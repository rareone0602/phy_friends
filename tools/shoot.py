#!/usr/bin/env python3
"""Screenshot a design mockup with headless Chrome, using a throwaway profile.

  python3 tools/shoot.py design/backup/a.html out/design/a-desktop.png --size 1280x800 --query 'px=900&py=260'
  python3 tools/shoot.py design/fonts.html out/design/fonts.png --size 1280x2400

Modeled on shoot() in tools/pf.py, but loads a real file:// URL (so that
relative ../src and ../characters paths resolve) and gives Google Fonts time to
load. The mockups honor ?px=..&py=.. (CSS pixels) as a simulated pointer
position, so a still shows the eyes following it.
"""
import argparse
import os
import shutil
import subprocess
import tempfile
import time
from pathlib import Path

from PIL import Image

from cdp import kill_process_group

ROOT = Path(__file__).resolve().parent.parent
CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')


def shoot(page, out_png, w, h, query='', scale=1, budget=12000, timeout=90):
    page = Path(page).resolve()
    url = page.as_uri() + (('?' + query) if query else '')
    work = Path(tempfile.mkdtemp(prefix='pf-design-'))
    try:
        shot = work / 'shot.png'
        win_w = w
        if w < 500:
            # Headless Chrome will not make a window narrower than about 500 px, so a
            # phone layout is rendered in an iframe of the exact size and then cropped.
            wrap = work / 'wrap.html'
            wrap.write_text('<!doctype html><style>html,body{margin:0;background:#fff}iframe{border:0;display:block}</style>'
                            f'<iframe src="{url}" width="{w}" height="{h}"></iframe>')
            url, win_w = wrap.as_uri(), 500
        cmd = [CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
               '--no-default-browser-check', '--disable-extensions', '--mute-audio',
               f'--user-data-dir={work / "profile"}', f'--window-size={win_w},{h}',
               f'--force-device-scale-factor={scale}', '--allow-file-access-from-files',
               f'--virtual-time-budget={budget}', f'--screenshot={shot}', url]
        proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
        deadline, last = time.time() + timeout, -1
        while time.time() < deadline:
            if shot.exists():
                size = shot.stat().st_size
                if size and size == last:
                    break
                last = size
            elif proc.poll() is not None:
                break
            time.sleep(0.25)
        kill_process_group(proc)
        if not shot.exists():
            raise RuntimeError('Chrome produced no screenshot')
        img = Image.open(shot)
        img.load()
        img = img.crop((0, 0, round(w * scale), round(h * scale)))
        Path(out_png).parent.mkdir(parents=True, exist_ok=True)
        img.save(out_png)
        return out_png
    finally:
        shutil.rmtree(work, ignore_errors=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('page')
    ap.add_argument('out')
    ap.add_argument('--size', default='1280x800')
    ap.add_argument('--query', default='')
    ap.add_argument('--scale', type=float, default=1)
    ap.add_argument('--budget', type=int, default=12000)
    a = ap.parse_args()
    w, h = (int(v) for v in a.size.lower().split('x'))
    print(shoot(a.page, a.out, w, h, a.query, a.scale, a.budget))


if __name__ == '__main__':
    main()
