#!/usr/bin/env python3
"""Rebuild the site's images from the character specs.

Run this after a character changes:

  python3 tools/site_assets.py

Outputs:

  site/icon.svg              The favicon: phy's head, with the tail tucked away. The icons are drawn
                             flat, because they are too small to hold the pencil texture.
  site/icon-32.png           The same icon as a PNG, for browsers without SVG favicons.
  site/apple-touch-icon.png  180 px, on the paper color (iOS requires an opaque square).
  site/preview.png           1200x630 link preview image: the title over every friend, standing in the gallery's
                             order in rows on the gallery's paper, as large as the frame allows (see LAYOUT).
"""
import json
import re
import tempfile
from pathlib import Path

from PIL import Image

import gallery
import pf
import shoot
from cdp import ChromeError, exit_on_sigterm

ROOT = Path(__file__).resolve().parent.parent

POSE = {'tail': -75}
ICON = {'w': 64, 'h': 64, 'x': 32, 'y': 47, 'scale': 0.31}
TOUCH = {'w': 180, 'h': 180, 'x': 90, 'y': 132, 'scale': 0.75}
PREVIEW = (1200, 630)        # The link preview's size.
# The preview's composition, in rules: a rule is the paper's line spacing in px, and a friend's box is five rules, as
# in the gallery, so that the larger the rule, the larger every friend. `rows` says how many friends stand in each
# row, in the gallery's order, and `first` which rule the first row stands on, counted from the top; each row after it
# stands EARS rules lower than a box's height, so that the tallest ears clear the ground above. `title` is its size
# in px and the rule it stands on; the paper's rules begin at the rule after `band`; `top` is how far down the frame
# the paper's first rule is moved, in px, to balance the blank paper above and below; and `margin` is the red line's
# distance from the left edge, in px.
LAYOUT = {'rule': 27, 'rows': (7, 7, 7), 'first': 10, 'band': 2, 'top': 4, 'margin': 24, 'title': {'size': 88, 'rule': 3}}
EARS = 1                     # Rules kept above each row's box for the tallest ears.
SIDE = 16                    # Space between the margin line and the first slot, and between the last slot and the edge, in px.
POINTER = (PREVIEW[0] // 2, 900)  # The simulated pointer, below the middle, so that they look out at the viewer.
# The preview is saved as a palette PNG, which is half the size of a full-color one and keeps the pencil's grain. The
# palette is trained on the colors with their populations flattened (count ** FLATTEN), so that the small bright
# things (eyes, a bandana, a cheek) keep their colors beside the great areas of paper and fur.
PALETTE = {'colors': 224, 'flatten': 0.2, 'refinements': 3}
GRAPHITE = re.compile(r'<filter id="graphite".*?</filter>', re.S)


def gallery_slots():
    """The friends in the gallery's order, each as (name, reach left, reach right) in head units, the slots' geometry
    (gallery.slot_geometry) and the graphite filter that the gallery textures its lines with, all read from index.html."""
    text = gallery.GALLERY.read_text(encoding='utf-8')
    return gallery.read_slots(text), gallery.slot_geometry(text), GRAPHITE.search(text)[0]


def composition(layout=LAYOUT):
    """The link preview as a page: the title on the paper's top rule, and under it the friends in rows, each friend
    in a box five rules square standing on a rule, as in the gallery (index.html), with one size for all."""
    slots, geometry, graphite = gallery_slots()
    box, overlap = geometry['box'], geometry['overlap'] / 2  # Each side of a slot overlaps its neighbor's by half.
    rule, rows, margin = layout['rule'], layout['rows'], layout['margin']
    if sum(rows) != len(slots):
        raise ValueError(f'the rows seat {sum(rows)} friends, but the gallery has {len(slots)}')
    width, height = PREVIEW
    lists, first = [], 0
    for index, count in enumerate(rows):
        ground = layout['top'] + (layout['first'] + index * (5 + EARS)) * rule  # The row's ground, on a rule.
        row = slots[first:first + count]
        needed = 5 * rule * sum(gallery.slot_boxes(left, right, geometry) for _, left, right in row)  # The slots' widths, in px.
        if needed > width - layout['margin'] - 2 * SIDE:
            raise ValueError(f'row {index + 1} needs {needed:.0f} px, which is wider than the frame; use a smaller rule or fewer friends in it')
        if ground > height:
            raise ValueError(f'row {index + 1} stands on {ground} px, which is below the frame; use a smaller rule or fewer rows')
        items = ''.join(
            f'<li class="friend" data-friend="{name}" style="--reach-left: {left}; --reach-right: {right}"><div class="rig"></div></li>'
            for name, left, right in row)
        lists.append(f'<ul class="friends" style="top: {ground}px">{items}</ul>')
        first += count
    scripts = '\n'.join(f'<script src="{path.as_uri()}"></script>' for path in pf.scripts())
    return f"""<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8">
<link rel="stylesheet" href="{(ROOT / 'site/notebook.css').as_uri()}">
<link rel="stylesheet" href="{(ROOT / 'site/pencil.css').as_uri()}">
<style>
  :root {{ --informal: 100; --L: {rule}px; --margin-x: {margin}px; --band: {layout['band'] + layout['top'] / rule}; --size: calc(var(--L) * 5); }}
  html, body {{ width: {width}px; height: {height}px; margin: 0; overflow: hidden; }}
  h1 {{ position: absolute; left: var(--column-left); top: calc(var(--sit) + {layout['title']['rule'] - 2} * var(--L) + {layout['top']}px);
    font-size: {layout['title']['size']}px; }}
  /* The stage as the gallery sets it (index.html): a box five rules square whose bottom edge is each friend's
     ground, and a slot a box wide plus the friend's reaches, so that neighbors stand close without overlapping. */
  .friends {{ position: absolute; left: calc(var(--margin-x) + {SIDE}px); right: {SIDE}px; margin: 0; padding: 0; list-style: none;
    display: flex; justify-content: space-between; transform: translateY(calc(var(--size) * -1)); }}
  .friend {{ position: relative; margin: 0 calc(var(--size) * -{overlap:g});
    width: calc(var(--size) * ({box:g} + var(--reach-left) + var(--reach-right)) / {box:g}); }}
  .rig {{ width: var(--size); height: var(--size); margin-left: calc(var(--size) * var(--reach-left) / {box:g}); }}
  .rig svg {{ display: block; width: 100%; height: auto; overflow: visible; }}
  .ground {{ position: absolute; left: 0; width: 100%; top: calc(var(--size) - 7px); height: 12px; overflow: visible; z-index: 5;
    color: var(--ink); filter: url(#graphite); }}
</style>
{scripts}
</head><body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true">{graphite}</svg>
<h1>phy's fwiends</h1>
{''.join(lists)}
<script>
  // Each friend stands on its own penciled ground, as in the gallery (index.html), and follows the simulated pointer.
  const GROUND = {{ width: 200, height: 12, inset: 6, y: 6.5, wobble: 1.6, step: 50 }};
  const random = PhyFriends.rng(5);
  const stage = PhyFriends.live.stage({{ root: document.body, pointer: {{ x: {POINTER[0]}, y: {POINTER[1]} }} }});
  document.querySelectorAll('.friend').forEach((slot, index) => {{
    stage.add(slot.querySelector('.rig'), slot.dataset.friend, {{ bg: 'page', index, interactive: false }});
    const start = random() * GROUND.inset, end = GROUND.width - random() * GROUND.inset;
    const segments = Math.max(1, Math.round((end - start) / GROUND.step)), points = [];
    for (let i = 0; i <= segments; i++) points.push({{ x: start + (i * (end - start)) / segments, y: GROUND.y + (random() - 0.5) * GROUND.wobble }});
    slot.insertAdjacentHTML('beforeend', `<svg class="ground" viewBox="0 0 ${{GROUND.width}} ${{GROUND.height}}" preserveAspectRatio="none" aria-hidden="true">` +
      `<path d="${{PhyFriends.shapes.pathD(points, false)}}" fill="none" stroke="currentColor" stroke-opacity=".7" stroke-width="1.4" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`);
  }});
  stage.start();
</script>
</body></html>
"""


def quantize(image, colors=PALETTE['colors'], flatten=PALETTE['flatten'], refinements=PALETTE['refinements']):
    """The image in at most `colors` colors, without dithering (which would smooth the paper's grain away), from a
    palette trained on its colors, each repeated by the `flatten` power of its count."""
    image = image.convert('RGB')
    pixels = [color for count, color in image.getcolors(image.width * image.height) for _ in range(max(1, round(count ** flatten)))]
    training = Image.new('RGB', (len(pixels), 1))
    training.putdata(pixels)
    palette = training.quantize(colors, method=Image.Quantize.MEDIANCUT, kmeans=refinements)
    return image.quantize(palette=palette, dither=Image.Dither.NONE)


def photograph(layout, out):
    """Photograph the composition of `layout` at the preview's size and save it into out as a palette PNG."""
    with pf.session() as shared, tempfile.TemporaryDirectory(prefix='pf-preview-') as work:
        page, shot = Path(work) / 'preview.html', Path(work) / 'shot.png'
        page.write_text(composition(layout), encoding='utf-8')
        shoot.shoot(page, shot, *PREVIEW, chrome=shared.chrome)
        quantize(Image.open(shot)).save(out, optimize=True)


def still(view, out, bg=False):
    js = (f"document.getElementById('root').innerHTML = PhyFriends.render('phy', "
          f"{{ view: {json.dumps(view)}, pose: {json.dumps(POSE)}, bg: {json.dumps(bg)}, pencil: false }});")
    pf.shoot(pf.page(js), view['w'], view['h'], out)
    print(out)


def main():
    with pf.session():  # One Chrome for the icon's drawing and every still's check.
        svg = pf.evaluate(f"PhyFriends.render('phy', {{ view: {json.dumps(ICON)}, pose: {json.dumps(POSE)}, bg: false, pencil: false, uid: 'i' }})")
        (ROOT / 'site/icon.svg').write_text(svg)
        print(ROOT / 'site/icon.svg')
        still({**ICON, 'w': 32, 'h': 32, 'x': 16, 'y': 23.5, 'scale': 0.155}, ROOT / 'site/icon-32.png')
        still(TOUCH, ROOT / 'site/apple-touch-icon.png', bg='#fbf9f3')
        photograph(LAYOUT, ROOT / 'site/preview.png')
        print(ROOT / 'site/preview.png')


if __name__ == '__main__':
    exit_on_sigterm()
    try:
        main()
    except ChromeError as error:  # The message names what failed in Chrome or the page; a traceback adds nothing.
        raise SystemExit(f'error: {error}')
