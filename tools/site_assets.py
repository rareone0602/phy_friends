#!/usr/bin/env python3
"""Rebuild the site's images from the character specs.

Run this after a character changes:

  python3 tools/site_assets.py

Outputs:

  site/icon.svg              The favicon: phy's head, with the tail tucked away. The icons are drawn
                             flat, because they are too small to hold the pencil texture.
  site/icon-32.png           The same icon as a PNG, for browsers without SVG favicons.
  site/apple-touch-icon.png  180 px, on the paper color (iOS requires an opaque square).
  site/preview.png           1200x630 link preview image: the gallery, photographed at 2782x1461 and scaled down.
"""
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image

import pf

ROOT = Path(__file__).resolve().parent.parent

POSE = {'tail': -75}
ICON = {'w': 64, 'h': 64, 'x': 32, 'y': 47, 'scale': 0.31}
TOUCH = {'w': 180, 'h': 180, 'x': 90, 'y': 132, 'scale': 0.75}
PREVIEW = (1200, 630)        # The link preview's size.
PREVIEW_SHOT = (2782, 1461)  # The window it is photographed in: the same shape, wide enough for one row.


def still(view, out, bg=False):
    js = (f"document.getElementById('root').innerHTML = PhyFriends.render('phy', "
          f"{{ view: {json.dumps(view)}, pose: {json.dumps(POSE)}, bg: {json.dumps(bg)}, pencil: false }});")
    pf.shoot(pf.page(js), view['w'], view['h'], out)
    print(out)


def main():
    svg = pf.evaluate(f"PhyFriends.render('phy', {{ view: {json.dumps(ICON)}, pose: {json.dumps(POSE)}, bg: false, pencil: false, uid: 'i' }})")
    (ROOT / 'site/icon.svg').write_text(svg)
    print(ROOT / 'site/icon.svg')
    still({**ICON, 'w': 32, 'h': 32, 'x': 16, 'y': 23.5, 'scale': 0.155}, ROOT / 'site/icon-32.png')
    still(TOUCH, ROOT / 'site/apple-touch-icon.png', bg='#fbf9f3')
    # The link preview is the gallery itself (STYLE.md §7), photographed at 2782x1461 and scaled to
    # 1200x630: 2782px is the narrowest window where all fifteen friends stand in one row (FWIENDS.md).
    # The simulated pointer sits below the middle so that they look out at the viewer.
    preview = ROOT / 'site/preview.png'
    subprocess.run([sys.executable, str(ROOT / 'tools/shoot.py'), str(ROOT / 'index.html'), str(preview),
                    '--size', f'{PREVIEW_SHOT[0]}x{PREVIEW_SHOT[1]}', '--query', 'px=1211&py=880'], check=True)
    Image.open(preview).convert('RGB').resize(PREVIEW, Image.LANCZOS).save(preview)


if __name__ == '__main__':
    main()
