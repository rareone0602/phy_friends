#!/usr/bin/env python3
"""Screenshot a page with headless Chrome, using a throwaway profile.

  python3 tools/shoot.py design/backup/a.html out/design/a-desktop.png --size 1280x800 --query 'px=900&py=260'
  python3 tools/shoot.py design/fonts.html out/design/fonts.png --size 1280x2400

It loads the page through its real file:// URL (so that relative ../src and ../characters paths resolve) and
gives web fonts and timers time to settle, in virtual time (cdp.screenshot_once). The gallery, the specimen and
the mockups in design/backup/ honor ?px=..&py=.. (CSS pixels) as a simulated pointer position, so a still shows
the eyes following it. tools/pf.py takes its stills with shoot() too, from an HTML string.

A page that reports an error (an uncaught exception, a console.error or a file that fails to load) is not shot:
the command fails with the page's message.
"""
import argparse
import io
import shutil
import tempfile
from pathlib import Path

from PIL import Image

from cdp import ChromeError, HeadlessChrome, PageError, exit_on_sigterm, page_url, screenshot_once

ROOT = Path(__file__).resolve().parent.parent
NARROWEST_WINDOW = 500  # Headless Chrome will not make a window narrower than about this, in CSS px.


def shoot(page, out_png, w, h, query='', scale=1, budget=12000, timeout=90, transparent=False, fluid=True,
          chrome=None):
    """Screenshot a page at w x h CSS px (times scale) into out_png, and return the image.

    page: an HTML file, or an HTML document as a string (one that starts with '<'), whose paths must then be
    absolute. The page is first opened in chrome, a HeadlessChrome (one is started when none is given), and one
    that reports an error there raises PageError instead of being shot. The still itself is taken once `budget`
    ms of virtual time have passed (cdp.screenshot_once). With transparent, the page's own background is all
    there is. fluid: whether the page lays itself out to the window's width, as a phone layout does, rather than
    drawing at a size of its own, as tools/pf.py's stills do.
    """
    work = Path(tempfile.mkdtemp(prefix='pf-page-'))
    try:
        if isinstance(page, str) and page.lstrip().startswith('<'):
            source, page = page, work / 'page.html'
            page.write_text(source, encoding='utf-8')
        url = page_url(Path(page).resolve(), query)
        errors = check(url, w, h, scale, timeout, chrome)
        if errors:
            raise PageError(f'the page reported errors, so nothing was written to {out_png}', errors)
        win_w = w
        if fluid and w < NARROWEST_WINDOW:
            # A phone layout is rendered in an iframe of the exact size, and then cropped.
            wrap = work / 'wrap.html'
            wrap.write_text('<!doctype html><style>html,body{margin:0;background:#fff}iframe{border:0;display:block}</style>'
                            f'<iframe src="{url}" width="{w}" height="{h}"></iframe>')
            url, win_w = wrap.as_uri(), NARROWEST_WINDOW
        png = screenshot_once(url, win_w, h, scale=scale, budget=budget, transparent=transparent, timeout=timeout)
    finally:
        shutil.rmtree(work, ignore_errors=True)
    img = Image.open(io.BytesIO(png))
    img.load()
    img = img.crop((0, 0, round(w * scale), round(h * scale)))
    Path(out_png).parent.mkdir(parents=True, exist_ok=True)
    img.save(out_png)
    return img


def check(url, w, h, scale, timeout, chrome=None):
    """Open a page in Chrome at w x h CSS px and return the errors it reports while it loads and first paints."""
    if chrome is None:
        with HeadlessChrome(w, h, scale, timeout) as own:
            return own.visit(url)
    chrome.set_viewport(w, h, scale)
    return chrome.visit(url, timeout=timeout)


def main():
    exit_on_sigterm()
    ap = argparse.ArgumentParser()
    ap.add_argument('page')
    ap.add_argument('out')
    ap.add_argument('--size', default='1280x800')
    ap.add_argument('--query', default='')
    ap.add_argument('--scale', type=float, default=1)
    ap.add_argument('--budget', type=int, default=12000)
    a = ap.parse_args()
    w, h = (int(v) for v in a.size.lower().split('x'))
    try:
        shoot(a.page, a.out, w, h, a.query, a.scale, a.budget)
    except ChromeError as error:  # The message names what failed in Chrome or the page; a traceback adds nothing.
        raise SystemExit(f'error: {error}')
    print(a.out)


if __name__ == '__main__':
    main()
