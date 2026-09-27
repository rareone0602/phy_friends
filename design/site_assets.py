#!/usr/bin/env python3
"""Rebuild the site's images from the specs, after a character changes:

  python3 design/site_assets.py

  site/icon.svg              the favicon: phy's head, the tail tucked away
  site/icon-32.png           the same as a PNG, for browsers without SVG favicons
  site/apple-touch-icon.png  180px, on paper (iOS wants an opaque square)
  site/preview.png           1200x630, the picture shown where the link is shared
"""
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'tools'))
import pf  # noqa: E402

POSE = {'tail': -75}
ICON = {'w': 64, 'h': 64, 'x': 32, 'y': 47, 'scale': 0.31}
TOUCH = {'w': 180, 'h': 180, 'x': 90, 'y': 132, 'scale': 0.75}


def still(view, out, bg=False):
    js = (f"document.getElementById('root').innerHTML = PhyFriends.render('phy', "
          f"{{ view: {json.dumps(view)}, pose: {json.dumps(POSE)}, bg: {json.dumps(bg)} }});")
    pf.shoot(pf.page(js), view['w'], view['h'], out)
    print(out)


def main():
    svg = pf.evaluate(f"PhyFriends.render('phy', {{ view: {json.dumps(ICON)}, pose: {json.dumps(POSE)}, bg: false, uid: 'i' }})")
    (ROOT / 'site/icon.svg').write_text(svg)
    print(ROOT / 'site/icon.svg')
    still({**ICON, 'w': 32, 'h': 32, 'x': 16, 'y': 23.5, 'scale': 0.155}, ROOT / 'site/icon-32.png')
    still(TOUCH, ROOT / 'site/apple-touch-icon.png', bg='#fbf9f3')
    # the gallery itself, the friends looking out at whoever opens the link
    subprocess.run([sys.executable, str(ROOT / 'design/shoot.py'), str(ROOT / 'index.html'), str(ROOT / 'site/preview.png'),
                    '--size', '1200x630', '--query', 'px=640&py=360'], check=True)


if __name__ == '__main__':
    main()
