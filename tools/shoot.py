#!/usr/bin/env python3
"""Screenshot a page with headless Chrome, using a throwaway profile.

  python3 tools/shoot.py design/backup/a.html out/design/a-desktop.png --size 1280x800 --query 'px=900&py=260'
  python3 tools/shoot.py design/fonts.html out/design/fonts.png --size 1280x2400

Unlike shoot() in tools/pf.py, which shoots an HTML string, it loads a real file:// URL (so that
relative ../src and ../characters paths resolve) and gives Google Fonts time to load. Both take
the screenshot with cdp.screenshot_once(). The pages honor ?px=..&py=.. (CSS pixels) as a
simulated pointer position, so a still shows the eyes following it.
"""
import argparse
import io
import shutil
import tempfile
from pathlib import Path

from PIL import Image

from cdp import screenshot_once

ROOT = Path(__file__).resolve().parent.parent
NARROWEST_WINDOW = 500  # Headless Chrome will not make a window narrower than about this, in CSS px.


def shoot(page, out_png, w, h, query='', scale=1, budget=12000, timeout=90):
    page = Path(page).resolve()
    url = page.as_uri() + (('?' + query) if query else '')
    work = Path(tempfile.mkdtemp(prefix='pf-design-'))
    try:
        win_w = w
        if w < NARROWEST_WINDOW:
            # A phone layout is rendered in an iframe of the exact size, and then cropped.
            wrap = work / 'wrap.html'
            wrap.write_text('<!doctype html><style>html,body{margin:0;background:#fff}iframe{border:0;display:block}</style>'
                            f'<iframe src="{url}" width="{w}" height="{h}"></iframe>')
            url, win_w = wrap.as_uri(), NARROWEST_WINDOW
        png = screenshot_once(url, win_w, h, scale=scale, budget=budget, timeout=timeout)
    finally:
        shutil.rmtree(work, ignore_errors=True)
    img = Image.open(io.BytesIO(png))
    img.load()
    img = img.crop((0, 0, round(w * scale), round(h * scale)))
    Path(out_png).parent.mkdir(parents=True, exist_ok=True)
    img.save(out_png)
    return out_png


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
