#!/usr/bin/env python3
"""A Chrome DevTools Protocol client for headless Chrome, using the standard library only.

It launches Google Chrome headless with a throwaway profile and talks to it over
--remote-debugging-pipe, so it opens no port and needs no WebSocket library. The
page runs in real time, so requestAnimationFrame, fonts and image decoding behave
as they do in a browser.

    from cdp import HeadlessChrome
    with HeadlessChrome(1280, 720) as chrome:
        chrome.open('test/film-stub.html', query='film')
        print(chrome.evaluate('film.ready.then(() => film.duration)'))
        Path('frame.png').write_bytes(chrome.screenshot())

A relative page path is resolved against the repository root. Errors the page
reports (uncaught exceptions, console.error calls and resources that fail to
load) collect in `errors`; `evaluate` raises PageError, carrying them, when the
expression throws or its promise rejects. Chrome is killed and its profile
removed when the `with` block ends, however it ends.
"""
import base64
import fcntl
import json
import os
import re
import select
import shutil
import signal
import subprocess
import tempfile
import threading
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
DEFAULT_TIMEOUT = 60  # Seconds to wait for any one reply from Chrome.
READ_SIZE = 1 << 20  # Screenshots arrive as messages of a few megabytes.
LOG_TAIL_LINES = 20  # Lines of Chrome's own log quoted when it exits unexpectedly.

# With --remote-debugging-pipe, Chrome reads commands from descriptor 3 and writes replies to 4.
COMMAND_FD, REPLY_FD = 3, 4
FLAGS = [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio', '--no-first-run',
    '--no-default-browser-check', '--disable-extensions', '--use-mock-keychain',
    '--allow-file-access-from-files', '--force-color-profile=srgb',
    # A headless page counts as hidden to some schedulers; these keep its timers and animation frames running.
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
    # A screenshot waits until every tile is rasterized, so a frame never has blank or stale tiles.
    '--run-all-compositor-stages-before-draw',
    # A changed tile is rasterized whole. Partial raster redraws only the damaged part of a tile, and since
    # the damage depends on the previous frame, the same frame would come out a few pixels different
    # depending on the frames shot before it.
    '--disable-partial-raster',
]
CONSOLE_ERROR_TYPES = {'error', 'assert'}
URL_SCHEME = re.compile(r'^[a-zA-Z][a-zA-Z0-9+.-]+:')


class ChromeError(RuntimeError):
    """Chrome could not be started, stopped answering, or refused a command."""


def is_favicon(entry):
    """Whether a log entry is the browser's own request for a favicon the page never asked for."""
    return entry.get('url', '').split('?')[0].endswith('/favicon.ico')


class PageError(ChromeError):
    """The page threw an exception, or reported errors, while Chrome ran it."""

    def __init__(self, message, page_errors=()):
        super().__init__(message)
        self.page_errors = list(page_errors)

    def __str__(self):
        text = super().__str__()
        if self.page_errors:
            text += '\npage errors:\n' + '\n'.join(f'  {error}' for error in self.page_errors)
        return text


def page_url(page, query=''):
    """Return the URL for a page: a URL as it is, or a path (relative to the repository root) as a file URL.

    A query already on the page is kept, and `query` is appended to it.
    """
    page = str(page)
    if URL_SCHEME.match(page):
        url = page
    else:
        path, _, own_query = page.partition('?')
        url = (ROOT / path).resolve().as_uri() + (f'?{own_query}' if own_query else '')
    if query:
        url += ('&' if '?' in url else '?') + query
    return url


def kill_process_group(process):
    """Kill a process started with start_new_session=True, with every process it started, and reap it.

    Once the process has exited, its group holds only its zombie until it is reaped. Linux then reports the group
    as gone (ProcessLookupError), while macOS refuses to signal it (PermissionError); either way nothing is left
    to kill.
    """
    try:
        os.killpg(process.pid, signal.SIGKILL)
    except (ProcessLookupError, PermissionError):
        pass
    process.wait()


class HeadlessChrome:
    """One headless Chrome with a single page, driven over the DevTools protocol."""

    def __init__(self, width=1280, height=720, scale=1, timeout=DEFAULT_TIMEOUT, chrome=CHROME, flags=()):
        self.width, self.height, self.scale = width, height, scale
        self.timeout = timeout
        self.errors = []  # What the page reported, as text, in the order it happened.
        self._chrome, self._flags = chrome, list(flags)
        self._process = self._work = self._session = None
        self._command_write = self._reply_read = None
        self._buffer, self._scanned = bytearray(), 0
        self._last_id, self._loaded, self._previous_sigterm = 0, False, None

    def __enter__(self):
        self._stop_on_sigterm()
        try:
            self._launch()
            self._attach()
        except BaseException:
            self.close()
            raise
        return self

    def __exit__(self, *exc_info):
        self.close()

    def close(self):
        """Kill Chrome with every process it started, and remove its profile."""
        if self._process:
            kill_process_group(self._process)
            self._process = None
        for fd in (self._command_write, self._reply_read):
            if fd is not None:
                os.close(fd)
        self._command_write = self._reply_read = None
        if self._work:
            shutil.rmtree(self._work, ignore_errors=True)
            self._work = None
        if self._previous_sigterm is not None:
            signal.signal(signal.SIGTERM, self._previous_sigterm)
            self._previous_sigterm = None

    # ---- Pages

    def open(self, page, query='', timeout=None):
        """Load a page (a URL, or a path relative to the repository root) and wait for its load event."""
        url = page_url(page, query)
        self._loaded = False
        result = self.send('Page.navigate', {'url': url}, timeout)
        if result.get('errorText'):
            raise ChromeError(f'could not open {url}: {result["errorText"]}')
        self._wait_for_load(timeout)

    def reload(self, timeout=None):
        """Load the current page again from scratch and wait for its load event."""
        self._loaded = False
        self.send('Page.reload', {'ignoreCache': True}, timeout)
        self._wait_for_load(timeout)

    def add_init_script(self, source):
        """Run `source` in every page opened from now on, before any of the page's own scripts."""
        self.send('Page.addScriptToEvaluateOnNewDocument', {'source': source})

    def evaluate(self, expression, timeout=None):
        """Evaluate a JavaScript expression, await it if it is a promise, and return its value as JSON data.

        Raises PageError, with the page's own message, when the expression throws or its promise rejects.
        """
        result = self.send('Runtime.evaluate', {'expression': expression, 'awaitPromise': True,
                                                'returnByValue': True}, timeout)
        if 'exceptionDetails' in result:
            raise PageError(describe_exception(result['exceptionDetails']), self.errors)
        return result['result'].get('value')

    def screenshot(self):
        """Return a PNG of the viewport at the current device scale factor."""
        reply = self.send('Page.captureScreenshot', {'format': 'png', 'captureBeyondViewport': False})
        return base64.b64decode(reply['data'])

    def set_viewport(self, width, height, scale=1):
        """Set the viewport in CSS pixels, and its device pixel ratio."""
        self.send('Emulation.setDeviceMetricsOverride', {'width': width, 'height': height,
                                                         'deviceScaleFactor': scale, 'mobile': False})
        self.width, self.height, self.scale = width, height, scale

    # ---- Input and media

    def mouse(self, kind, x, y, clicks=1, button='left'):
        """Dispatch a trusted mouse event: kind is mouseMoved, mousePressed or mouseReleased."""
        self.send('Input.dispatchMouseEvent', {'type': kind, 'x': x, 'y': y, 'button': button, 'clickCount': clicks})

    def click(self, x, y, clicks=1):
        self.mouse('mousePressed', x, y, clicks)
        self.mouse('mouseReleased', x, y, clicks)

    def key(self, key, code, kind='keyDown', repeat=False, text=None):
        """Dispatch a trusted key event, e.g. key('Enter', 'Enter', text='\\r')."""
        params = {'type': kind, 'key': key, 'code': code, 'autoRepeat': repeat,
                  'windowsVirtualKeyCode': {'Enter': 13, ' ': 32, 'Tab': 9}.get(key, 0)}
        if text is not None:
            params['text'] = text
        self.send('Input.dispatchKeyEvent', params)

    def media(self, **features):
        """Emulate media features, e.g. media(prefers_reduced_motion='reduce')."""
        self.send('Emulation.setEmulatedMedia',
                  {'features': [{'name': name.replace('_', '-'), 'value': value} for name, value in features.items()]})

    # ---- Protocol

    def send(self, method, params=None, timeout=None):
        """Send one command and return its result, handling the events that arrive in the meantime."""
        self._last_id += 1
        command_id = self._last_id
        message = {'id': command_id, 'method': method, 'params': params or {}}
        if self._session and not method.startswith('Target.'):
            message['sessionId'] = self._session
        self._write(json.dumps(message).encode() + b'\0')
        deadline = time.monotonic() + (timeout or self.timeout)
        while True:
            reply = self._read(deadline, method)
            if reply.get('id') != command_id:
                self._handle_event(reply)
            elif 'error' in reply:
                raise ChromeError(f'{method}: {reply["error"].get("message", reply["error"])}')
            else:
                return reply.get('result', {})

    def _launch(self):
        self._work = Path(tempfile.mkdtemp(prefix='pf-chrome-'))
        command_read, self._command_write = os.pipe()
        self._reply_read, reply_write = os.pipe()

        def wire_pipes():
            # Runs in the child before exec. Each end is first copied above 4, since os.pipe() may have
            # returned 3 or 4 itself, and dup2 would then close one end while placing the other.
            command = fcntl.fcntl(command_read, fcntl.F_DUPFD, REPLY_FD + 1)
            reply = fcntl.fcntl(reply_write, fcntl.F_DUPFD, REPLY_FD + 1)
            os.dup2(command, COMMAND_FD)
            os.dup2(reply, REPLY_FD)

        command = [self._chrome, *FLAGS, f'--user-data-dir={self._work / "profile"}',
                   f'--window-size={self.width},{self.height}', '--remote-debugging-pipe', *self._flags, 'about:blank']
        try:
            with open(self._work / 'chrome.log', 'wb') as log:
                self._process = subprocess.Popen(command, stdin=subprocess.DEVNULL, stdout=log, stderr=log,
                                                 preexec_fn=wire_pipes, pass_fds=(COMMAND_FD, REPLY_FD),
                                                 start_new_session=True)
        except FileNotFoundError:
            raise ChromeError(f'Chrome not found at {self._chrome}: install Google Chrome or set $CHROME') from None
        finally:
            os.close(command_read)
            os.close(reply_write)

    def _attach(self):
        targets = self.send('Target.getTargets')['targetInfos']
        page = next((t for t in targets if t['type'] == 'page'), None)
        target_id = page['targetId'] if page else self.send('Target.createTarget', {'url': 'about:blank'})['targetId']
        self._session = self.send('Target.attachToTarget', {'targetId': target_id, 'flatten': True})['sessionId']
        for domain in ('Page', 'Runtime', 'Log'):
            self.send(f'{domain}.enable')
        self.set_viewport(self.width, self.height, self.scale)

    def _wait_for_load(self, timeout):
        deadline = time.monotonic() + (timeout or self.timeout)
        while not self._loaded:
            self._handle_event(self._read(deadline, 'the load event'))

    def _handle_event(self, message):
        method, params = message.get('method'), message.get('params', {})
        if method == 'Page.loadEventFired':
            self._loaded = True
        elif method == 'Runtime.exceptionThrown':
            self.errors.append(describe_exception(params['exceptionDetails']))
        elif method == 'Runtime.consoleAPICalled' and params.get('type') in CONSOLE_ERROR_TYPES:
            arguments = ' '.join(describe_value(value) for value in params.get('args', []))
            self.errors.append(f'console.{params["type"]}: {arguments}')
        elif method == 'Log.entryAdded' and params['entry'].get('level') == 'error' and not is_favicon(params['entry']):
            entry = params['entry']
            self.errors.append(entry.get('text', '') + (f' ({entry["url"]})' if entry.get('url') else ''))
        elif method in ('Inspector.targetCrashed', 'Target.targetCrashed'):
            raise PageError('the page crashed', self.errors)

    def _write(self, data):
        view = memoryview(data)
        while view:
            view = view[os.write(self._command_write, view):]

    def _read(self, deadline, waiting_for):
        """Return the next message from Chrome; messages are JSON terminated by a NUL byte."""
        while True:
            end = self._buffer.find(b'\0', self._scanned)
            if end >= 0:
                break
            self._scanned = len(self._buffer)
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                raise ChromeError(f'Chrome gave no answer to {waiting_for} before the timeout')
            ready, _, _ = select.select([self._reply_read], [], [], remaining)
            if not ready:
                continue
            chunk = os.read(self._reply_read, READ_SIZE)
            if not chunk:
                raise ChromeError(f'Chrome closed the connection while waiting for {waiting_for}{self._log_tail()}')
            self._buffer += chunk
        message = bytes(self._buffer[:end])
        del self._buffer[:end + 1]
        self._scanned = 0
        return json.loads(message)

    def _log_tail(self):
        log = self._work / 'chrome.log' if self._work else None
        if not log or not log.is_file():
            return ''
        lines = log.read_text(errors='replace').strip().splitlines()[-LOG_TAIL_LINES:]
        return ('; its log ends:\n' + '\n'.join(lines)) if lines else ''

    def _stop_on_sigterm(self):
        # SIGTERM would otherwise end Python without unwinding, leaving Chrome running and the profile behind.
        # Only the main thread may install signal handlers.
        if threading.current_thread() is threading.main_thread():
            self._previous_sigterm = signal.signal(signal.SIGTERM, _exit_on_sigterm)


def _exit_on_sigterm(signum, frame):
    raise SystemExit(128 + signum)


def describe_exception(details):
    """Return a thrown exception as text: its message and stack, then where it was thrown."""
    exception = details.get('exception') or {}
    text = exception.get('description') or describe_value(exception) or details.get('text', 'unknown error')
    if details.get('url') and ' at ' not in text:
        text += f' ({details["url"]}:{details.get("lineNumber", 0) + 1})'
    return text


def describe_value(remote_object):
    """Return a console argument or thrown value as text."""
    if 'value' in remote_object:
        value = remote_object['value']
        return value if isinstance(value, str) else json.dumps(value)
    return remote_object.get('description') or remote_object.get('unserializableValue') or ''
