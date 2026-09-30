#!/usr/bin/env python3
"""Derive the pen strokes that write the gallery's title, and write site/title-pen.js.

  python3 tools/title_pen.py            # Requires numpy, scipy, Pillow and Google Chrome.
  python3 tools/title_pen.py --check    # Also writes out/design/title-pen.png, the strokes over the title.

Headless Chrome sets the title exactly as the gallery does (Shantell Sans, weight 300, INFM 100 and
BNCE 50), large and upright, and the ink is thinned to its centerlines. Each letter's strokes are
given below as a few waypoints, in the order and direction a hand writes them; a stroke follows the
centerline from one waypoint to the next. The gallery reveals its title along these strokes
(src/pen.js; FWIENDS.md, "the opening"), as does the roll-call film. Run this again whenever the title, the face or its axes change: it
fails if the strokes leave any of the ink unwritten.
"""
import argparse
import io
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import dijkstra

from cdp import HeadlessChrome

ROOT = Path(__file__).resolve().parent.parent

TITLE = "phy's fwiends"
SIZE = 400                    # The font size, in px, at which the title is set and measured.
VIEWPORT = (3600, 700)
EM = 1000                     # Output lengths are in thousandths of an em.
MARGIN = 0.012                # Added to each side of a stroke's width beyond the ink it covers, in em.
SIMPLIFY = 0.004              # How far a simplified stroke may stray from the centerline, in em.
REACH = 0.15                  # How far past its own box, in em, a letter's strokes may look for its centerline.
UNWRITTEN_LIMIT = 0.001       # The share of the ink the strokes may leave uncovered.
OUT = ROOT / 'site' / 'title-pen.js'
CHECK = ROOT / 'out' / 'design' / 'title-pen.png'

# Each letter's strokes, in writing order. A waypoint is (x, y) in em from the letter's origin on the
# baseline, y downward; a stroke runs along the centerline through its waypoints in turn.
STROKES = {
    'p': [[(0.10, -0.45), (0.145, -0.12), (0.12, 0.175)],                        # The stem, downward.
          [(0.10, -0.46), (0.30, -0.49), (0.46, -0.25), (0.145, -0.12)]],       # The bowl, clockwise.
    'h': [[(0.165, -0.70), (0.10, -0.025)],                                      # The stem.
          [(0.10, -0.11), (0.41, -0.475), (0.56, -0.0125)]],                    # The arch.
    'y': [[(0.1175, -0.40), (0.2175, -0.025), (0.4125, -0.175), (0.4225, -0.40),  # Down, round and up,
           (0.405, 0.15), (0.1375, 0.25)]],                                      # then down into the tail.
    "'": [[(0.1325, -0.7125), (0.115, -0.50)]],
    's': [[(0.365, -0.53), (0.1025, -0.3625), (0.39, -0.125), (0.09, 0.02)]],   # From the top end.
    'f': [[(0.3025, -0.77), (0.12, -0.60), (0.135, 0.05)],                       # The hook and the stem,
          [(0.11, -0.4875), (0.3525, -0.50)]],                                   # then the crossbar.
    'w': [[(0.0425, -0.425), (0.21, -0.055), (0.43, -0.405), (0.705, -0.045), (0.86, -0.4125)]],
    'i': [[(0.1325, -0.3875), (0.135, 0.025)],                                   # The stem, then the dot.
          [(0.1225, -0.605), (0.1425, -0.605)]],
    'e': [[(0.12, -0.27), (0.39, -0.28), (0.4525, -0.40), (0.2775, -0.5375),     # The bar, then round.
           (0.1525, -0.425), (0.1275, -0.225), (0.315, -0.05), (0.495, -0.1625)]],
    'n': [[(0.1275, -0.3625), (0.145, -0.0125)],                                 # The stem.
          [(0.14, -0.055), (0.4025, -0.45), (0.52, 0.025)]],                    # The arch.
    'd': [[(0.4275, -0.35), (0.24, -0.42), (0.1025, -0.225), (0.2275, -0.005),   # The bowl, anticlockwise,
           (0.44, -0.1875)],
          [(0.4725, -0.6875), (0.54, -0.005)]],                                  # then the stem.
}
# The second s bounces differently from the first, so it has waypoints of its own.
SECOND_S = [[(0.3475, -0.5925), (0.0975, -0.45), (0.385, -0.1875), (0.0725, -0.10)]]

PAGE = f'''<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Shantell+Sans:wght,BNCE,INFM@300..800,-100..100,0..100&display=block">
<link rel="stylesheet" href="{(ROOT / 'site' / 'notebook.css').as_uri()}">
<style>
  :root {{ --informal: 100; }}  /* As index.html sets it. */
  html, body {{ margin: 0; padding: 0; background: #fff !important; }}
  h1 {{ font-size: {SIZE}px; line-height: {SIZE * 3 // 2}px; height: auto; top: 0; padding: 0 {SIZE // 4}px;
       color: #000; filter: none; transform: none; white-space: nowrap; }}
</style></head><body><h1>{TITLE}</h1></body></html>'''

TWO_FRAMES_JS = 'new Promise(done => requestAnimationFrame(() => requestAnimationFrame(() => done(true))))'

MEASURE_JS = '''(() => {
  const title = document.querySelector('h1'), text = title.firstChild, letters = [];
  for (let i = 0; i < text.length; i++) {
    const range = document.createRange();
    range.setStart(text, i); range.setEnd(text, i + 1);
    const box = range.getBoundingClientRect();
    letters.push({ char: text.data[i], left: box.left, right: box.right });
  }
  const probe = document.createElement('span');
  probe.style.cssText = 'display: inline-block; width: 0; height: 0; vertical-align: baseline';
  title.insertBefore(probe, text);
  const baseline = probe.getBoundingClientRect().top;
  probe.remove();
  return JSON.stringify({ letters, baseline, axes: getComputedStyle(title).fontVariationSettings });
})()'''


def main():
    parser = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    parser.add_argument('--check', action='store_true', help='draw the strokes over the title in out/design/')
    args = parser.parse_args()
    ink, layout = set_title()
    origin = (layout['letters'][0]['left'], layout['baseline'])  # The start of the text on its baseline, in px.
    centerline = np.argwhere(thin(ink))  # (row, column) of every centerline pixel.
    graph, half_width = pixel_graph(centerline), ndimage.distance_transform_edt(ink)
    strokes = [trace(centerline, graph, half_width, origin, layout['letters'][index], index, waypoints)
               for index, waypoints in writing_order(layout)]
    unwritten = unwritten_share(ink, strokes, origin)
    if args.check:
        draw_check(ink, strokes, origin)
    if unwritten > UNWRITTEN_LIMIT:
        sys.exit(f'title_pen: the strokes leave {unwritten:.2%} of the ink unwritten; adjust STROKES')
    letters = layout['letters']
    write_module(strokes, layout['axes'], (letters[-1]['right'] - letters[0]['left']) / SIZE)
    print(f'{OUT.relative_to(ROOT)}: {len(strokes)} strokes, {unwritten:.3%} of the ink unwritten')


def set_title():
    """Set the title in headless Chrome; return its ink (a boolean image) and where its letters are."""
    page = ROOT / 'out' / 'design' / 'title-pen.html'
    page.parent.mkdir(parents=True, exist_ok=True)
    page.write_text(PAGE)
    face = f'300 {SIZE}px "Shantell Sans"'
    with HeadlessChrome(*VIEWPORT) as chrome:
        chrome.open(str(page))
        loaded = chrome.evaluate(f"document.fonts.load({json.dumps(face)}).then(() => document.fonts.ready)"
                                 f".then(() => document.fonts.check({json.dumps(face)}, {json.dumps(TITLE)}))")
        if not loaded:
            sys.exit('title_pen: Shantell Sans did not load from Google Fonts, so the title would be set in another face')
        chrome.evaluate(TWO_FRAMES_JS)  # Lets the page paint with the face in place.
        layout = json.loads(chrome.evaluate(MEASURE_JS))
        shot = chrome.screenshot()
    page.unlink()
    pixels = np.asarray(Image.open(io.BytesIO(shot)).convert('L'))
    return pixels < 128, layout


def thin(ink):
    """Zhang and Suen's thinning: peel the ink down to one-pixel centerlines."""
    image = ink.astype(np.uint8)
    changed = True
    while changed:
        changed = False
        for step in (0, 1):
            padded = np.pad(image, 1)
            p2, p3, p4, p5 = padded[:-2, 1:-1], padded[:-2, 2:], padded[1:-1, 2:], padded[2:, 2:]
            p6, p7, p8, p9 = padded[2:, 1:-1], padded[2:, :-2], padded[1:-1, :-2], padded[:-2, :-2]
            ring = [p2, p3, p4, p5, p6, p7, p8, p9, p2]
            neighbors = sum(p.astype(int) for p in ring[:8])
            transitions = sum(((ring[i] == 0) & (ring[i + 1] == 1)).astype(int) for i in range(8))
            if step == 0:
                clear = (p2 * p4 * p6 == 0) & (p4 * p6 * p8 == 0)
            else:
                clear = (p2 * p4 * p8 == 0) & (p2 * p6 * p8 == 0)
            peel = (image == 1) & (neighbors >= 2) & (neighbors <= 6) & (transitions == 1) & clear
            if peel.any():
                image[peel] = 0
                changed = True
    return image.astype(bool)


def writing_order(layout):
    """Yield (letter index, waypoints in px) for every stroke, in the order the title is written."""
    seen_s = False
    for index, letter in enumerate(layout['letters']):
        char = letter['char']
        if char == ' ':
            continue
        if char == 's':
            strokes, seen_s = (SECOND_S if seen_s else STROKES['s']), True
        elif char in STROKES:
            strokes = STROKES[char]
        else:
            sys.exit(f'title_pen: no strokes for {char!r}; add its waypoints to STROKES')
        for waypoints in strokes:
            yield index, [(letter['left'] + x * SIZE, layout['baseline'] + y * SIZE) for x, y in waypoints]


def trace(centerline, graph, half_width, origin, letter, index, waypoints):
    """Follow the centerline through the waypoints; return the stroke in em from the title's origin.

    Each waypoint snaps to the nearest centerline pixel within reach of its own letter, so that a
    stroke never strays into a neighbor where two letters touch.
    """
    columns = centerline[:, 1]
    own = np.flatnonzero((columns >= letter['left'] - REACH * SIZE) & (columns <= letter['right'] + REACH * SIZE))
    snapped = [int(own[np.argmin((columns[own] - x) ** 2 + (centerline[own, 0] - y) ** 2)]) for x, y in waypoints]
    route = [snapped[0]]
    for start, end in zip(snapped, snapped[1:]):
        _, previous = dijkstra(graph, indices=start, return_predecessors=True)
        leg = [end]
        while leg[-1] != start:
            if leg[-1] < 0:
                sys.exit(f'title_pen: stroke {waypoints} of letter {index} crosses a gap in the ink')
            leg.append(previous[leg[-1]])
        route += leg[::-1][1:]
    pixels = centerline[route]
    width = 2 * half_width[pixels[:, 0], pixels[:, 1]].max() / SIZE + 2 * MARGIN
    em = [((c - origin[0]) / SIZE, (r - origin[1]) / SIZE) for r, c in pixels]
    return {'letter': index, 'width': width, 'points': simplify(em, SIMPLIFY)}


def pixel_graph(points):
    """The centerline as a graph: every pixel joined to its eight neighbors."""
    lookup = {(r, c): i for i, (r, c) in enumerate(points)}
    rows, cols, weights = [], [], []
    for i, (r, c) in enumerate(points):
        for dr in (-1, 0, 1):
            for dc in (-1, 0, 1):
                j = lookup.get((r + dr, c + dc))
                if j is not None and j != i:
                    rows.append(i)
                    cols.append(j)
                    weights.append(np.hypot(dr, dc))
    return coo_matrix((weights, (rows, cols)), shape=(len(points), len(points))).tocsr()


def simplify(points, tolerance):
    """Ramer, Douglas and Peucker: drop the points a polyline can do without."""
    if len(points) < 3:
        return points
    start, end = np.array(points[0]), np.array(points[-1])
    chord = end - start
    length = np.hypot(*chord)
    if length == 0:
        distances = [np.hypot(*(np.array(p) - start)) for p in points]
    else:
        distances = [abs(chord[0] * (start[1] - p[1]) - chord[1] * (start[0] - p[0])) / length for p in points]
    farthest = int(np.argmax(distances))
    if distances[farthest] <= tolerance:
        return [points[0], points[-1]]
    return simplify(points[:farthest + 1], tolerance)[:-1] + simplify(points[farthest:], tolerance)


def unwritten_share(ink, strokes, origin):
    """The share of the ink that no stroke covers, drawn at its width with round ends."""
    covered = Image.new('L', (ink.shape[1], ink.shape[0]), 0)
    draw = ImageDraw.Draw(covered)
    for stroke in strokes:
        radius = stroke['width'] * SIZE / 2
        xy = [to_pixels(p, origin) for p in stroke['points']]
        draw.line(xy, fill=255, width=round(2 * radius), joint='curve')
        for x, y in (xy[0], xy[-1]):
            draw.ellipse([x - radius, y - radius, x + radius, y + radius], fill=255)
    return float((ink & (np.asarray(covered) == 0)).sum() / ink.sum())


def to_pixels(point, origin):
    return (origin[0] + point[0] * SIZE, origin[1] + point[1] * SIZE)


def draw_check(ink, strokes, origin):
    """Draw each stroke over the ink, numbered in writing order, with a dot where it starts."""
    image = Image.fromarray(np.where(ink, 205, 255).astype(np.uint8)).convert('RGB')
    draw = ImageDraw.Draw(image)
    for number, stroke in enumerate(strokes, 1):
        xy = [to_pixels(p, origin) for p in stroke['points']]
        draw.line(xy, fill=(200, 40, 40), width=3)
        x, y = xy[0]
        draw.ellipse([x - 7, y - 7, x + 7, y + 7], fill=(40, 90, 200))
        draw.text((x + 9, y - 22), str(number), fill=(40, 90, 200))
    CHECK.parent.mkdir(parents=True, exist_ok=True)
    image.save(CHECK)
    print(CHECK.relative_to(ROOT))


def write_module(strokes, axes, width):
    lines = []
    for stroke in strokes:
        points = [(round(x * EM), round(y * EM)) for x, y in stroke['points']]
        path = 'M' + 'L'.join(f'{x} {y}' for x, y in points)
        length = sum(np.hypot(x1 - x0, y1 - y0) for (x0, y0), (x1, y1) in zip(points, points[1:]))
        lines.append(f"    {{ letter: {stroke['letter']}, width: {round(stroke['width'] * EM)}, length: {round(length)}, d: '{path}' }},")
    OUT.write_text(f'''/*
 * The pen strokes that write the gallery's title, made by tools/title_pen.py; do not edit by hand.
 *
 * Each stroke follows the centerline of a letter of "{TITLE}" in the order and direction a hand
 * writes it, as Shantell Sans sets the title in the gallery ({axes}, weight 300).
 * Lengths are in thousandths of an em, from the start of the text on its baseline, y downward.
 * width is the text's width in em, by which src/pen.js checks that the face still matches. For each
 * stroke, letter indexes the character in the text, width is how wide a pen reveals the whole
 * letter, and length is how long the stroke is.
 */
self.TITLE_PEN = Object.freeze({{
  text: {json.dumps(TITLE)},
  width: {width:.4f},
  strokes: [
{chr(10).join(lines)}
  ],
}});
''')


if __name__ == '__main__':
    main()
