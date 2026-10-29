#!/usr/bin/env python3
"""Command-line tool for phy's fwiends that renders characters with headless Chrome.

  python3 tools/pf.py list
  python3 tools/pf.py render howdi                      # Writes out/howdi/portrait.png.
  python3 tools/pf.py render howdi --view ref --pose '{"lookX": 1}' -o out/scratch/x.png
  python3 tools/pf.py render howdi --flat               # The flat shapes, without the pencil texture.
  python3 tools/pf.py compare howdi                     # Every example -> out/howdi/compare/<example>.png.
  python3 tools/pf.py compare howdi --view ref --region 0,600,700,1254   # One example; metrics and a zoom for a box.
  python3 tools/pf.py anim howdi --clip idle            # Writes out/howdi/anim/idle.gif.
  python3 tools/pf.py anim howdi --clip "layer(idle, hold('curious'))" --size 512 --sheet -o out/scratch/x.mp4
  python3 tools/pf.py render howdi --with out/scratch/mine.js   # A working copy that may redefine howdi.
  python3 tools/pf.py film test/film-stub.html -o out/scratch/film/stub.mp4   # Films a page that defines window.film.
  python3 tools/pf.py film test/film-stub.html --at 1 --size 1920x1080 -o out/scratch/film/still.png
  python3 tools/pf.py film test/film-stub.html --audio out/scratch/music.mp3 --from 0.5 --to 1.5 -o out/scratch/film/part.mp4
  python3 tools/pf.py film test/film-stub.html --scale 2 --crf 12 -o out/scratch/film/master.mp4   # Twice the pixels each way, at a higher quality.
  python3 tools/pf.py test                              # Runs test/index.html headless, checks the pages and the derived files, and opens every page as a reader opens it from disk; exits non-zero on a failure or a page error.
  python3 tools/pf.py pages                             # Writes the friends' script tags and the gallery's rows and slots (tools/gallery.py).
  python3 tools/pf.py tune                              # Writes tools/tune.html, the tuning page, as one file: out/tune.html.

Each character lives in lib/fwiends/characters/<name>/, which holds the spec <name>.js and
an examples/ folder of reference pictures. An example is compared through the
view of the same name, so examples/ref.jpg pairs with the spec's views.ref.

A still is drawn in a page that loads the library, the characters and the --with
scripts. A page that reports an error (a script that fails to load, or a drawing
that throws) stops the command with the page's message, so that a broken working
copy is never shot as the committed friend.

`film` films any page that follows the film contract (see film() below) frame
by frame, so a scene exports frame-exactly whatever the machine's speed. With
--audio, it puts a sound file under the video, cut sample-exactly to the filmed
span, so that a part filmed alone with --from and --to keeps in step with the
whole; --fade fades the sound out at the end. An .mp4 or .webm is converted with
the BT.709 matrix in limited range and tagged so, as players assume for HD video,
so that its colors match the page's; --crf sets its quality.

`test` also checks the pages against the cast in lib/fwiends/characters/cast.js: the labels
that index.html repeats by hand, and the script tags and rows that `pages` writes
(tools/gallery.py); and the files derived from others: the dark sheet's blocks
(tools/dark_sheet.py), the theme colors, the inks' contrasts and the data
colors that the kit's README and style.html give, and the list of test files
in test/index.html.

Output goes to out/<name>/ for each character (stills, compare/, anim/),
out/design/ for page mockups, out/tune.html for the tuning page to send, and
out/scratch/ for experiments.

Requires Google Chrome (override the path with $CHROME) and Pillow; compare also
requires numpy, video output ffmpeg, and a film's sound the ffprobe that comes
with it.
"""
import argparse
import functools
import json
import math
import re
import shutil
import subprocess
import sys
import tempfile
import time
from contextlib import ExitStack, contextmanager
from pathlib import Path

from PIL import Image

import dark_sheet
import gallery
import kit_api
import layout
from layout import CHARACTERS, KIT, SRC
from cdp import (NEXT_PAINT_JS, ChromeError, ChromeTimeout, HeadlessChrome, PageError, exit_on_sigterm, page_url,
                 split_page)
from shoot import shoot as shoot_page

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'out'  # Holds out/<name>/..., out/design/, out/tune.html and out/scratch/.
TUNE_PAGE = ROOT / 'tools' / 'tune.html'  # The tuning page, which `tune` writes out as one file.
LOCAL_SCRIPT = re.compile(r'<script src="(?P<src>[^":]+)"></script>')  # A script tag that loads a file of this repository.
IMAGE_TYPES = {'.png', '.jpg', '.jpeg', '.webp', '.gif'}
EXTRA = []  # Scripts from --with, loaded after the characters (e.g. a working copy that redefines one).


def characters():
    """Return the character names: every lib/fwiends/characters/<name>/ that holds a <name>.js."""
    return sorted(d.name for d in CHARACTERS.iterdir() if (d / f'{d.name}.js').is_file())


def examples(name):
    """Return {example name: path} for the pictures in lib/fwiends/characters/<name>/examples/."""
    folder = CHARACTERS / name / 'examples'
    if not folder.is_dir():
        return {}
    return {p.stem: p for p in sorted(folder.iterdir()) if p.suffix.lower() in IMAGE_TYPES}


def scripts():
    """Return the scripts a page loads: library files, then character definitions, then --with scripts."""
    libs = [SRC / 'phyfriends.js'] + sorted(p for p in SRC.glob('*.js') if p.name not in ('phyfriends.js', 'title-pen.js'))
    return libs + [CHARACTERS / n / f'{n}.js' for n in characters()] + [Path(x).resolve() for x in EXTRA]


def page(body_js, bg='transparent'):
    """A page that loads the library, the characters and the --with scripts, then runs body_js, which may draw into
    #root. An error in any of them is reported to Chrome (see Session), never drawn."""
    tags = '\n'.join(f'<script src="{p.as_uri()}"></script>' for p in scripts())
    return f"""<!doctype html><meta charset="utf-8">
<style>html,body{{margin:0;padding:0;overflow:hidden;background:{bg}}}svg{{display:block}}
#root{{display:flex;flex-wrap:wrap;align-content:flex-start}}</style>
{tags}
<div id="root"></div>
<script>
{body_js}
</script>"""


# ---- One headless Chrome per command: evaluations and stills' checks ----------------

_session = None  # The Session that evaluate() and shoot() share while session() is open.


class Session:
    """A headless Chrome that evaluate() and shoot() share, started when first needed: it evaluates expressions in
    the library's page (page('')), and opens each still's page to check it for errors before it is shot."""

    def __init__(self, stack):
        self._stack = stack  # Closes Chrome, then removes its folder, when the session ends.
        self._chrome = self._library = None

    @property
    def chrome(self):
        if self._chrome is None:
            work = Path(self._stack.enter_context(tempfile.TemporaryDirectory(prefix='pf-')))
            self._library = work / 'library.html'
            self._library.write_text(page(''), encoding='utf-8')
            self._chrome = self._stack.enter_context(HeadlessChrome())
        return self._chrome

    def evaluate(self, js_expr, timeout):
        chrome = self.chrome
        if chrome.url != page_url(self._library):  # Opened first, and again after a still's page.
            errors = chrome.visit(self._library, timeout=timeout)
            if errors:
                raise PageError('the library, the characters or a --with script reported errors', errors)
        value = chrome.evaluate(f'JSON.stringify({js_expr})', timeout)
        errors = chrome.take_errors()
        if errors:
            raise PageError('the page reported errors while evaluating an expression', errors)
        if value is None:
            raise PageError(f'the expression has no JSON value: {js_expr}')
        return json.loads(value)


@contextmanager
def session():
    """Share one headless Chrome among every evaluate() and shoot() in the block, and close it when the block ends,
    however it ends. Outside a session, each of them starts a Chrome of its own."""
    global _session
    if _session is not None:
        yield _session
        return
    with ExitStack() as stack:
        _session = Session(stack)
        try:
            yield _session
        finally:
            _session = None


def evaluate(js_expr, timeout=60):
    """Evaluate a JS expression in a page that has the library loaded and return its JSON value.

    A script that fails to load (a --with file with a syntax error, say) or an expression that throws raises
    PageError with the page's message; an expression still running after timeout seconds raises ChromeTimeout.
    """
    with session() as shared:
        return shared.evaluate(js_expr, timeout)


def shoot(html, w, h, out_png, timeout=60):
    """Screenshot an HTML string at w x h CSS pixels into out_png, on a transparent background, and return the image.
    A page that reports an error is not shot (see shoot.shoot)."""
    with session() as shared:
        return shoot_page(html, out_png, w, h, budget=1000, timeout=timeout, transparent=True, fluid=False,
                          chrome=shared.chrome)


def check_friend(name, view=None):
    """Stop with a one-line message unless the page defines a friend called name and, when view is a name, that
    friend has a view of that name."""
    found = evaluate(f"""(() => {{
  const friends = PhyFriends.list(), name = {json.dumps(name)};
  return {{ friends, views: friends.includes(name) ? Object.keys(PhyFriends.get(name).views || {{}}) : [] }};
}})()""")
    if name not in found['friends']:
        raise SystemExit(f'no friend called {name!r} (have: {", ".join(found["friends"])})')
    views = list(dict.fromkeys(['portrait', 'stand', *found['views']]))
    if isinstance(view, str) and view not in views:
        raise SystemExit(f'{name} has no view called {view!r} (have: {", ".join(views)})')


def render(name, out_png, view='portrait', pose=None, size=None, bg=True, pencil=True):
    """Render one still and return the PIL image. pencil=False draws the flat shapes without the pencil texture."""
    check_friend(name, view)
    opts = {'view': view, 'pose': pose or {}, 'pencil': pencil}
    if size:
        opts['size'] = size
    if bg is False:
        opts['bg'] = False
    elif isinstance(bg, str):
        opts['bg'] = bg
    js = f"""
const spec = PhyFriends.get({json.dumps(name)});
document.getElementById('root').innerHTML = PhyFriends.render(spec, {json.dumps(opts)});"""
    w, h = view_size(name, view, size)
    return shoot(page(js), w, h, out_png)


def view_size(name, view='portrait', size=None):
    v = evaluate(f'PhyFriends.resolveView(PhyFriends.get({json.dumps(name)}), {json.dumps(view)}, {json.dumps(size)})')
    return round(v['w']), round(v['h'])


def frames(name, poses_js, out_dir, view='portrait', size=256, bg=True, max_side=4096):
    """Render many poses to frame PNGs, batched into sprite sheets that are then split.

    Batching costs one Chrome launch per sheet instead of one per frame.
    poses_js: a JS expression that evaluates to an array of pose objects; it can
    use PhyFriends (and PhyFriends.anim when present). Returns the frame paths
    (out_dir/f0000.png, ...).
    """
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    for old in out_dir.glob('f*.png'):
        old.unlink()
    w, h = view_size(name, view, size)
    total = evaluate(f'({poses_js}).length')
    cols, rows = max(1, max_side // w), max(1, max_side // h)
    per = cols * rows
    opts = {'view': view, 'size': size}
    if bg is False:
        opts['bg'] = False
    paths = []
    for start in range(0, total, per):
        n = min(per, total - start)
        c, r = min(cols, n), math.ceil(n / cols)
        js = f"""
const spec = PhyFriends.get({json.dumps(name)});
const poses = ({poses_js}).slice({start}, {start + n});
const root = document.getElementById('root');
root.style.width = '{c * w}px';
root.innerHTML = poses.map(p => PhyFriends.render(spec, Object.assign({json.dumps(opts)}, {{pose: p}}))).join('');"""
        sheet = shoot(page(js), c * w, r * h, out_dir / '_sheet.png')
        (out_dir / '_sheet.png').unlink()
        for i in range(n):
            x, y = (i % c) * w, (i // c) * h
            p = out_dir / f'f{start + i:04d}.png'
            sheet.crop((x, y, x + w, y + h)).save(p)
            paths.append(p)
    return paths


# Encoders per output type, best first: (ffmpeg encoder, extra args).
ENCODERS = {
    '.gif': [('gif', [])],
    '.apng': [('apng', [])],
    '.png': [('apng', [])],
    '.mp4': [('libx264', ['-crf', '18']), ('h264_videotoolbox', ['-b:v', '6M'])],
    '.webm': [('libvpx-vp9', ['-b:v', '0', '-crf', '30']), ('libvpx', ['-b:v', '2M', '-crf', '10', '-auto-alt-ref', '0'])],
}

# A player turns a video's YUV back into RGB with the matrix that the stream names or, when it names none, with
# the one its size suggests: BT.709 for HD, as browsers and YouTube assume. Left to itself, ffmpeg converts RGB
# frames with BT.601 and names nothing, which shifts saturated colors (phy's green iris by about 4 CIE76 dE).
# Video is therefore converted with the BT.709 matrix, in limited range, and tagged so: matrix, primaries
# (those of sRGB) and transfer. The tags are set on the frames (setparams), which the encoder follows; ffmpeg's
# output options for primaries and transfer are overridden by the frames' own, which are unspecified.
TO_BT709 = ('scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd,format={},'
            'setparams=colorspace=bt709:color_primaries=bt709:color_trc=bt709:range=tv')


def pick_encoder(ext, crf=None):
    """Return (encoder, args) for an output extension, falling back when ffmpeg lacks the best one.

    crf: a constant quality in place of the encoder's own (lower is better and larger), for the
    encoders that have one: libx264 for .mp4 and libvpx(-vp9) for .webm.
    """
    if ext not in ENCODERS:
        raise SystemExit(f'unknown output type {ext} (use .gif, .mp4, .webm or .apng)')
    options = ENCODERS[ext]
    for name, args in options:
        if name in ffmpeg_encoders('V'):
            if name != options[0][0]:
                print(f'note: ffmpeg has no {options[0][0]}; using {name}', file=sys.stderr)
            if crf is not None:
                if '-crf' not in args:
                    raise SystemExit(f'--crf sets the constant quality of an .mp4 (libx264) or a .webm (libvpx-vp9); '
                                     f'{name}, which writes this {ext}, has none')
                args = [*args[:args.index('-crf') + 1], f'{crf:g}', *args[args.index('-crf') + 2:]]
            return name, args
    raise SystemExit(f'{ext} needs one of the ffmpeg encoders {", ".join(n for n, _ in options)}, '
                     'and this ffmpeg has none of them; try .gif or .apng')


@functools.lru_cache(maxsize=None)
def ffmpeg_encoders(kind):
    """The names of the encoders of a kind, 'V' (video) or 'A' (audio), that this ffmpeg has."""
    if not shutil.which('ffmpeg'):
        raise SystemExit('ffmpeg not found: install it (e.g. `brew install ffmpeg`) to export animations and films')
    listing = subprocess.run(['ffmpeg', '-hide_banner', '-encoders'], capture_output=True, text=True).stdout
    return frozenset(line.split()[1] for line in listing.splitlines() if line.startswith(' ' + kind) and len(line.split()) > 1)


def even_size(frame_path):
    """The filters that make a frame's width and height even, as yuv420p requires: an odd one gains a column or a row
    that repeats the frame's edge (fillborders' smear), where ffmpeg's pad alone would add a black line."""
    with Image.open(frame_path) as frame:
        width, height = frame.size
    smear = f'fillborders=right={width % 2}:bottom={height % 2}:mode=smear,' if width % 2 or height % 2 else ''
    return 'pad=ceil(iw/2)*2:ceil(ih/2)*2,' + smear


def encode(frame_paths, out, fps=30, crf=None):
    """Encode frames (f0000.png, ...) into .gif, .mp4, .webm or .apng with ffmpeg.

    .mp4 and .webm are converted with the BT.709 matrix in limited range and tagged so (see TO_BT709).
    crf: the constant quality of an .mp4 or .webm (see pick_encoder); None keeps the encoder's own.
    """
    frame_dir = Path(frame_paths[0]).parent
    pattern = str(frame_dir / 'f%04d.png')
    out = Path(out)
    out.parent.mkdir(parents=True, exist_ok=True)
    ext = out.suffix.lower()
    codec, args = pick_encoder(ext, crf)
    base = ['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(fps), '-i', pattern]
    if ext == '.gif':
        vf = 'split[a][b];[a]palettegen=reserve_transparent=1:stats_mode=full[p];[b][p]paletteuse=dither=none'
        cmd = base + ['-vf', vf, '-loop', '0', str(out)]
    elif ext == '.mp4':  # MP4 has no alpha channel, and yuv420p requires even dimensions.
        cmd = base + ['-vf', even_size(frame_paths[0]) + TO_BT709.format('yuv420p'), '-c:v', codec, *args,
                      '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(out)]
    elif ext == '.webm':
        cmd = base + ['-vf', TO_BT709.format('yuva420p'), '-c:v', codec, *args, '-pix_fmt', 'yuva420p', str(out)]
    else:
        cmd = base + ['-plays', '0', '-f', 'apng', str(out)]
    subprocess.run(cmd, check=True)
    return out


def contact_sheet(frame_paths, out_png, count=16, cols=8, fps=None, start=0):
    """Tile `count` evenly spaced frames, always including the first and the last.

    Each tile is labeled with its frame index, and with its time when fps is given.
    start: the index of the first frame, for frames taken from partway through a film.
    """
    from PIL import ImageDraw, ImageFont
    n = len(frame_paths)
    count = min(count, n)
    idx = sorted({round(i * (n - 1) / max(1, count - 1)) for i in range(count)})
    tiles = [Image.open(frame_paths[i]).convert('RGBA') for i in idx]
    w, h = tiles[0].size
    cols = min(cols, len(tiles))
    sheet = Image.new('RGBA', (cols * w, math.ceil(len(tiles) / cols) * h), '#555')
    label_size = max(12, w // 16)
    draw, font = ImageDraw.Draw(sheet), ImageFont.load_default(size=label_size)
    for k, (i, tile) in enumerate(zip(idx, tiles)):
        x, y, frame = (k % cols) * w, (k // cols) * h, start + i
        sheet.alpha_composite(tile, (x, y))
        # The dark outline keeps a label legible on a light frame, such as a film on paper.
        draw.text((x + 6, y + 4), f'#{frame}' + (f' {frame / fps:.2f}s' if fps else ''), fill='#fff', font=font,
                  stroke_width=max(1, label_size // 8), stroke_fill='#333')
    Path(out_png).parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_png)
    return out_png


def zoom_view(name, view='portrait', k=1.0):
    """Return the view zoomed by k about its bottom center (k < 1 leaves headroom for hops)."""
    v = evaluate(f'PhyFriends.resolveView(PhyFriends.get({json.dumps(name)}), {json.dumps(view)})')
    return {**v, 'x': v['w'] / 2 + (v['x'] - v['w'] / 2) * k, 'y': v['h'] + (v['y'] - v['h']) * k, 'scale': v['scale'] * k}


def anim(name, clip='idle', out=None, fps=30, seconds=None, view='portrait', size=384, bg=True, sheet=None, zoom=1.0):
    """Render a PhyFriends.anim clip (a name or an expression such as "layer(idle, hold('curious'))"), made for
    the friend named: a wave is away from its tail, and a feeling is its own.

    sheet: a path for a contact sheet of sampled frames, or True for <out>-sheet.png.
    zoom: a value below 1 zooms out about the bottom edge, for clips that travel upward (hop).
    Returns the output path.
    """
    out = Path(out or OUT / name / 'anim' / f'{re.sub(r"[^A-Za-z0-9]+", "-", clip).strip("-")[:40]}.gif')
    if sheet is True:
        sheet = out.with_name(out.stem + '-sheet.png')
    ext = out.suffix.lower()
    pick_encoder(ext)  # Fail before the slow render if no encoder is available.
    check_friend(name, view)
    clip_js = f'PhyFriends.anim.parse({json.dumps(clip)}, {{ spec: {json.dumps(name)} }})'
    if seconds is None:
        seconds = evaluate(f'{clip_js}.duration ?? null')
        if not seconds:
            raise SystemExit(f'clip {clip!r} has no duration; pass --seconds')
    if zoom != 1:
        view = zoom_view(name, view, zoom)
    if ext == '.mp4' and bg is False:
        print('note: mp4 has no alpha channel; use .webm, .apng or .gif for transparency', file=sys.stderr)
    work = Path(tempfile.mkdtemp(prefix='pf-anim-'))
    try:
        paths = frames(name, f'PhyFriends.anim.frames({clip_js}, {fps}, {seconds})', work, view=view, size=size, bg=bg)
        if sheet:
            contact_sheet(paths, sheet, fps=fps)
        encode(paths, out, fps)
    finally:
        shutil.rmtree(work, ignore_errors=True)
    return out


def palette_classes(name, merge=24):
    """Return the spec's palette, with the house shades it uses, as color classes.

    Colors closer than `merge` (Euclidean distance in 0-255 RGB) share a class.
    """
    pal = evaluate(f'PhyFriends.palette({json.dumps(name)})')
    classes = []  # List of (label, (r, g, b)).
    for key, col in pal.items():
        if not (isinstance(col, str) and col.startswith('#') and len(col) in (4, 7)):
            continue
        h = col[1:] if len(col) == 7 else ''.join(c * 2 for c in col[1:])
        rgb = tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
        near = next((i for i, (_, c) in enumerate(classes) if sum((a - b) ** 2 for a, b in zip(c, rgb)) < merge ** 2), None)
        if near is None:
            classes.append((key, rgb))
        else:
            classes[near] = (classes[near][0] + '/' + key, classes[near][1])
    return classes


def classify(img, classes):
    import numpy as np
    a = np.asarray(img, dtype=np.int32)[..., :3]
    cols = np.array([c for _, c in classes], dtype=np.int32)
    d = ((a[:, :, None, :] - cols[None, None, :, :]) ** 2).sum(-1)
    return d.argmin(-1)


def compare(name, out_png=None, view=None, pose=None, region=None):
    """Compare the character with its examples, each through the view of the same name.

    view: one example (and view) name; by default, every example that has a view.
    Writes out/<name>/compare/<example>.png and -diff.png (see compare_one), and
    the plain render to out/<name>/<example>.png. out_png and region require a single
    example. Returns the names of the compared examples.
    """
    found = examples(name)
    if not found:
        raise SystemExit(f'no examples for {name}: add pictures to {CHARACTERS / name / "examples"}')
    views = set(evaluate(f'Object.keys(PhyFriends.get({json.dumps(name)}).views || {{}})'))
    if view:
        if view not in found:
            raise SystemExit(f'no example called {view!r} for {name} (have: {", ".join(found)})')
        if view not in views:
            raise SystemExit(f'example {view!r} needs a matching view: add views.{view} to {name}.js')
        picked = [view]
    else:
        picked = [v for v in found if v in views]
        for v in found:
            if v not in views:
                print(f'skipping example {v!r}: {name}.js has no views.{v} to line it up yet')
        if not picked:
            raise SystemExit(f'none of the examples for {name} has a matching view yet')
        if len(picked) > 1 and (out_png or region):
            raise SystemExit('-o and --region need a single example: pass --view')
    for v in picked:
        png = Path(out_png) if out_png else OUT / name / 'compare' / f'{v}.png'
        compare_one(name, found[v], png, OUT / name / f'{v}.png', view=v, pose=pose, region=region)
    return picked


def compare_one(name, ref_path, out_png, render_png, view, pose=None, region=None):
    """Write a reference | render | blend sheet, a palette-class diff map, and metrics.

    Every pixel of both images is snapped to the nearest palette color; the diff
    map (<out>-diff.png) paints red where the classes disagree, over a dimmed
    reference. The "solid" mismatch ignores a 2 px band along the reference's
    color edges, where anti-aliasing and JPEG noise dominate. region = (x0, y0,
    x1, y1) in reference pixels also prints metrics for that box and writes a
    zoomed <out>-region.png.
    """
    import numpy as np
    ref = Image.open(ref_path).convert('RGB')
    out_png = Path(out_png)
    out_png.parent.mkdir(parents=True, exist_ok=True)
    got = render(name, render_png, view=view, pose=pose, pencil=False).convert('RGB').resize(ref.size)
    blend = Image.blend(ref, got, 0.5)
    k = 600 / ref.width
    tiles = [im.resize((600, round(ref.height * k)), Image.LANCZOS) for im in (ref, got, blend)]
    sheet = Image.new('RGB', (600 * 3 + 20, tiles[0].height), '#555')
    for i, t in enumerate(tiles):
        sheet.paste(t, (i * 610, 0))
    sheet.save(out_png)

    classes = palette_classes(name)
    cr, cg = classify(ref, classes), classify(got, classes)
    miss = cr != cg
    edge = np.zeros_like(miss)
    for dy in range(-2, 3):
        for dx in range(-2, 3):
            edge |= np.roll(np.roll(cr, dy, 0), dx, 1) != cr
    solid = miss & ~edge
    dim = (np.asarray(ref.convert('L'), dtype=np.float32) * 0.45).astype(np.uint8)
    diff = np.stack([dim] * 3, -1)
    diff[miss & edge] = (150, 60, 60)
    diff[solid] = (255, 40, 40)
    diff_png = out_png.with_name(out_png.stem + '-diff.png')
    Image.fromarray(diff).save(diff_png)

    err = np.abs(np.asarray(ref, dtype=np.float32) - np.asarray(got, dtype=np.float32)).mean()
    print(f'== {name} / {view}: {ref_path.relative_to(ROOT)}\n{out_png}\n{diff_png}')
    print(f'mean abs error {err:.1f}/255   class mismatch {miss.mean() * 100:.1f}%   solid {solid.mean() * 100:.1f}%')

    def report(box, label):
        x0, y0, x1, y1 = box
        m, sm = miss[y0:y1, x0:x1], solid[y0:y1, x0:x1]
        a, b = cr[y0:y1, x0:x1], cg[y0:y1, x0:x1]
        print(f'{label}: mismatch {m.mean() * 100:.1f}%  solid {sm.mean() * 100:.1f}%')
        for i, (lab, _) in enumerate(classes):
            ra, gb = a == i, b == i
            if ra.sum() + gb.sum() < 0.002 * a.size:
                continue
            iou = (ra & gb).sum() / max(1, (ra | gb).sum())
            print(f'  {lab:28s} ref {ra.mean() * 100:5.1f}%  render {gb.mean() * 100:5.1f}%  IoU {iou:.3f}')

    h, w = miss.shape
    print('solid mismatch % on a 4x4 grid (rows top to bottom):')
    for r in range(4):
        print('  ' + '  '.join(f'{solid[r * h // 4:(r + 1) * h // 4, c * w // 4:(c + 1) * w // 4].mean() * 100:5.1f}'
                               for c in range(4)))
    report((0, 0, w, h), 'whole image')
    if region:
        x0, y0, x1, y1 = region
        report(region, f'region {x0},{y0},{x1},{y1}')
        crops = [im.crop(region) for im in (ref, got, Image.fromarray(diff))]
        z = max(1, round(600 / max(1, x1 - x0)))
        crops = [c.resize((c.width * z, c.height * z), Image.NEAREST) for c in crops]
        cw, ch = crops[0].size
        zs = Image.new('RGB', (cw * 3 + 20, ch), '#555')
        for i, c in enumerate(crops):
            zs.paste(c, (i * (cw + 10), 0))
        reg_png = out_png.with_name(out_png.stem + '-region.png')
        zs.save(reg_png)
        print(reg_png)
    return out_png


# ---- Films: a page that defines window.film, filmed frame by frame ----------------

FILM_VIEWPORT = (1280, 720)  # The viewport a page first opens at, before its film's own size is known.
FILM_FPS = 30  # The frame rate when neither --fps nor the film sets one.
SETTLE_ATTEMPTS = 10  # Screenshots taken at most while waiting for the first frame to stop changing.
PROGRESS_REPORTS = 4  # Progress lines printed while filming.
URL = re.compile(r'[a-zA-Z][a-zA-Z0-9+.-]*://')

# The sound that --audio puts under a film, per output type: (ffmpeg encoder, extra args). Only the sound is
# encoded; the frames are copied from the silent video as they are.
FILM_SOUND = {
    # AAC-LC is the sound that every MP4 player decodes. 320 kb/s, the usual ceiling for stereo, keeps a second
    # lossy generation (AAC from an MP3, say) transparent and leaves headroom for a site that encodes the upload
    # again. The source's sample rate is kept, so the sound is not resampled.
    '.mp4': ('aac', ['-b:a', '320k']),
    # Opus is the sound of WebM. It codes at 48 kHz only, so the sound is resampled once, here; 192 kb/s is well
    # above the rate at which Opus is transparent for stereo music.
    '.webm': ('libopus', ['-b:a', '192k', '-ar', '48000']),
}

READ_FILM_JS = """(async () => {
  const film = window.film;
  if (!film || typeof film.seek !== 'function') {
    throw new Error('the page defines no window.film with a seek(t) method (see the film contract in tools/pf.py)');
  }
  await film.ready;
  await document.fonts.ready;
  return { width: film.width, height: film.height, fps: film.fps, duration: film.duration,
           unagreed: Array.from(film.unagreed || []) };
})()"""


def film(page, out, size=None, scale=1, fps=None, start=0, end=None, at=None, draft=False, sheet=None, audio=None,
         fade=None, crf=None):
    """Film a page frame by frame to a video, or save one still, and return the output path.

    The page must follow the film contract. Opened with ?film (plus &draft for a draft),
    it lays its scene out to fill the viewport, hides its chrome, does not play on its
    own, and defines:

      window.film = {
        width, height,  // Preferred frame size in CSS px (used when size is not given).
        fps,            // Optional preferred frame rate (default 30).
        duration,       // Seconds.
        unagreed,       // Names of friends on screen whose owners have not agreed to video.
        ready,          // Promise: resolves when fonts, images and textures are loaded.
        seek(t),        // Draws the frame at t seconds; may return a promise.
      };

    Frame i shows t = i / fps, for start * fps <= i < end * fps; each is screenshotted
    after seek(t) and two animation frames. A film with unagreed friends is refused
    unless draft is set (the owners' say, STYLE.md §1).
    page: an HTML file, relative to the current directory and optionally with a query
    and a fragment of its own, or a URL. out: .mp4, .webm, .gif or .apng; with `at` (seconds), a .png
    still instead. size: (width, height) in CSS pixels. scale: the device pixel ratio, so
    that a page laid out at 1920x1080 is filmed at 2560x1440 with scale 4/3, say.
    crf: the constant quality of an .mp4 or .webm (lower is better and larger; see
    pick_encoder); None keeps the encoder's own (18 for .mp4, 30 for .webm). The video's
    bit rate is printed, to be checked against what a site that takes the upload asks.
    sheet: a path for a contact sheet, or True for <out>-sheet.png.
    audio: a sound file to put under a .mp4 or .webm film (see add_sound), cut to the
    filmed span, so that a part filmed alone with start and end keeps in step with the
    whole. fade: seconds over which the sound fades out at the end; by default it does
    not fade, so that a film cut to a looping track can loop too.
    """
    page, out = absolute_page(page), Path(out)
    if fade is not None and audio is None:
        raise SystemExit('--fade fades the sound out: give --audio too')
    # Fail before the slow part if the sound cannot go into the output.
    sound = probe_sound(audio, out.suffix.lower(), fade) if audio is not None else None
    if at is not None:
        if out.suffix.lower() != '.png' or sheet:
            raise SystemExit('--at saves one still: give a .png output, and no --sheet')
        return film_still(page, out, at, size, scale, draft)
    pick_encoder(out.suffix.lower(), crf)  # Fail before the slow part if no encoder is available.
    if sheet is True:
        sheet = out.with_name(out.stem + '-sheet.png')
    work = Path(tempfile.mkdtemp(prefix='pf-film-'))
    try:
        paths, fps, first = film_frames(page, work, size, scale, fps, start, end, draft)
        if sheet:
            contact_sheet(paths, sheet, fps=fps, start=first)
        video = encode(paths, work / f'silent{out.suffix.lower()}' if sound else out, fps, crf)
        if out.suffix.lower() in ('.mp4', '.webm'):
            print(f'video: {video.stat().st_size * 8 * fps / len(paths) / 1e6:.1f} Mb/s', file=sys.stderr)
        if sound:
            add_sound(video, sound, out, first / fps, (first + len(paths)) / fps, fade)
    finally:
        shutil.rmtree(work, ignore_errors=True)
    return out


def probe_sound(path, ext, fade=None):
    """Check that a sound file can go under a film of type ext, and return its first audio stream's properties:
    {'path', 'rate' (samples a second), 'length' (in samples, or None when the file does not say)}."""
    if ext not in FILM_SOUND:
        raise SystemExit(f'--audio needs an .mp4 or .webm output: {ext or "a file without a type"} carries no sound')
    if fade is not None and not fade > 0:
        raise SystemExit(f'--fade must be a number of seconds above 0, not {fade:g}')
    for tool in ('ffmpeg', 'ffprobe'):
        if not shutil.which(tool):
            raise SystemExit(f'{tool} not found: install ffmpeg (e.g. `brew install ffmpeg`) to film with sound')
    path = Path(path).resolve()
    if not path.is_file():
        raise SystemExit(f'no sound file at {path}')
    encoder = FILM_SOUND[ext][0]
    if encoder not in ffmpeg_encoders('A'):
        raise SystemExit(f'sound in {ext} needs the ffmpeg encoder {encoder}, and this ffmpeg lacks it')
    probe = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'a:0', '-show_entries',
                            'stream=sample_rate,duration:format=duration', '-of', 'json', str(path)],
                           capture_output=True, text=True)
    found = json.loads(probe.stdout or '{}') if probe.returncode == 0 else {}
    if not found.get('streams'):
        raise SystemExit(f'ffmpeg finds no sound in {path}')
    # The stream's duration excludes the encoder's padding, such as an MP3's, which ffmpeg removes on decoding.
    stream = found['streams'][0]
    rate, duration = int(stream['sample_rate']), stream.get('duration') or found.get('format', {}).get('duration')
    return {'path': path, 'rate': rate, 'length': round(float(duration) * rate) if duration else None}


def add_sound(video, sound, out, start, end, fade=None):
    """Write a silent video with the sound from start to end seconds under it to out, and return out.

    sound: the properties from probe_sound. The video stream is copied, so the frames stay
    byte for byte as encode() made them. The sound is cut by counting samples rather than
    by timestamps, so its first sample is the one at start; it is padded with silence where
    it ends before end, and faded out over its last `fade` seconds when fade is given.
    """
    rate, length = sound['rate'], sound['length']
    first, last = round(start * rate), round(end * rate)
    span = last - first
    if length is not None and last > length:
        print(f'note: the sound ends at {length / rate:.3f} s, so the last {(last - max(first, length)) / rate:.3f} s '
              'of the film are silent', file=sys.stderr)
    chain = [f'atrim=start_sample={first}:end_sample={last}', 'asetpts=PTS-STARTPTS', f'apad=whole_len={span}']
    if fade is not None:
        faded = min(round(fade * rate), span)
        if faded < round(fade * rate):
            print(f'note: --fade {fade:g} is longer than the filmed {span / rate:g} s; the sound fades over all of it',
                  file=sys.stderr)
        chain.append(f'afade=t=out:start_sample={span - faded}:nb_samples={faded}')
    encoder, args = FILM_SOUND[out.suffix.lower()]
    cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-i', str(video), '-i', str(sound['path']),
           '-filter_complex', f'[1:a:0]{",".join(chain)}[sound]', '-map', '0:v', '-map', '[sound]',
           '-c:v', 'copy', '-c:a', encoder, *args]
    if out.suffix.lower() == '.mp4':
        cmd += ['-movflags', '+faststart']
    out.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(cmd + [str(out)], check=True)
    return out


def absolute_page(page):
    """Return a page with its path made absolute from the current directory, keeping its query and fragment; a URL is
    returned as it is."""
    page = str(page)
    if URL.match(page):
        return page
    path, query, fragment = split_page(page, Path.cwd())
    if not path.is_file():
        raise SystemExit(f'no page at {path}')
    return str(path) + (f'?{query}' if query else '') + (f'#{fragment}' if fragment else '')


def film_still(page, out, at, size=None, scale=1, draft=False):
    """Save the frame at `at` seconds as a PNG and return its path."""
    with open_film(page, size, scale, draft) as (chrome, spec):
        if not 0 <= at <= spec['duration']:
            raise SystemExit(f"--at must lie within the film's {spec['duration']:g} s")
        png = settle(chrome, at)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(png)
    return out


def film_frames(page, frame_dir, size=None, scale=1, fps=None, start=0, end=None, draft=False):
    """Screenshot the film's frames from start to end seconds into frame_dir/f0000.png, ...

    Returns (frame paths, fps, the index of the first frame within the whole film).
    """
    frame_dir = Path(frame_dir)
    frame_dir.mkdir(parents=True, exist_ok=True)
    with open_film(page, size, scale, draft) as (chrome, spec):
        fps = fps or spec['fps'] or FILM_FPS
        total = round(spec['duration'] * fps)
        first, last = round(start * fps), total if end is None else round(end * fps)
        if not 0 <= first < last <= total:
            raise SystemExit(f"--from and --to must lie within the film's {spec['duration']:g} s, --from first")
        settle(chrome, first / fps)
        count = last - first
        report_every = math.ceil(count / PROGRESS_REPORTS)
        began, paths = time.monotonic(), []
        for i in range(first, last):
            paths.append(frame_dir / f'f{i - first:04d}.png')
            paths[-1].write_bytes(shoot_frame(chrome, i / fps))
            if len(paths) % report_every == 0 and len(paths) < count:
                print(f'{len(paths)}/{count} frames', file=sys.stderr)
        seconds = time.monotonic() - began
        print(f'{count}/{count} frames in {seconds:.1f} s ({seconds / count:.3f} s a frame, '
              f'{chrome.width}x{chrome.height} at scale {chrome.scale:g})', file=sys.stderr)
    return paths, fps, first


@contextmanager
def open_film(page, size=None, scale=1, draft=False):
    """Open a page in film mode at its film's size, check consent, and yield (chrome, the film's properties)."""
    width, height = size or FILM_VIEWPORT
    with HeadlessChrome(width, height, scale) as chrome:
        chrome.open(page, 'film&draft' if draft else 'film')
        spec = read_film(chrome)
        refuse_unagreed(spec['unagreed'], draft)
        if not size:
            if not (spec['width'] and spec['height']):
                raise SystemExit('the film gives no width and height: pass --size')
            if (spec['width'], spec['height']) != (width, height):
                # The page laid its scene out for the first viewport, so it is loaded again at its own size.
                chrome.set_viewport(spec['width'], spec['height'], scale)
                chrome.reload()
                spec = read_film(chrome)
        yield chrome, spec


def read_film(chrome):
    """Wait until the page's film is ready and return its properties, checked."""
    spec = chrome.evaluate(READ_FILM_JS)
    if chrome.errors:
        raise PageError('the page reported errors while loading', chrome.errors)
    if not (isinstance(spec['duration'], (int, float)) and spec['duration'] > 0):
        raise SystemExit(f"film.duration must be a number of seconds above 0, not {spec['duration']!r}")
    if spec['fps'] is not None and not (isinstance(spec['fps'], (int, float)) and spec['fps'] > 0):
        raise SystemExit(f"film.fps must be a frame rate above 0, not {spec['fps']!r}")
    for key in ('width', 'height'):
        value = spec[key]
        spec[key] = round(value) if isinstance(value, (int, float)) and value >= 1 else None
    return spec


def refuse_unagreed(names, draft):
    """Stop unless every owner of a friend on screen has agreed to video, or the film is a draft."""
    if not names:
        return
    several = len(names) > 1
    owners = f'the owner{"s" if several else ""} of {join_names(names)} {"have" if several else "has"}'
    if not draft:
        raise SystemExit(f'not filming: {owners} not agreed to video. Record the agreement in lib/fwiends/characters/cast.js, '
                         'or pass --draft to film a draft.')
    print(f'note: filming a draft; {owners} not agreed to video', file=sys.stderr)


def join_names(names):
    """Join names as prose: "Terry", "Terry and mumuyou", "Yuda, Terry and mumuyou"."""
    return names[0] if len(names) == 1 else ', '.join(names[:-1]) + ' and ' + names[-1]


def settle(chrome, t):
    """Draw the frame at t seconds, wait until two screenshots in a row agree, and return the last one.

    The first paint after loading can come before a data-URI image, such as the pencil
    texture, has decoded, which would leave the first frame without its characters.
    """
    previous = shoot_frame(chrome, t)
    for _ in range(SETTLE_ATTEMPTS):
        chrome.evaluate(NEXT_PAINT_JS)
        current = chrome.screenshot()
        if current == previous:
            return current
        previous = current
    print(f'note: the frame at {t:g} s kept changing; the page may be animating on its own', file=sys.stderr)
    return previous


def shoot_frame(chrome, t):
    """Return a PNG of the frame at t seconds, taken once seek(t) has finished and its result has been painted."""
    chrome.evaluate(f'(async () => {{ await window.film.seek({t!r}); await {NEXT_PAINT_JS}; }})()')
    if chrome.errors:
        raise PageError(f'the page reported errors at {t:g} s', chrome.errors)
    return chrome.screenshot()


# ---- Tests: test/index.html, run headless, the derived files, and every page ----

TEST_PAGE = ROOT / 'test' / 'index.html'
TEST_TIMEOUT = 120  # Seconds for the whole run; the harness stops a test that waits too long, and pf.py one that hangs.
TEST_RESULTS_JS = 'window.testsDone ? window.testsDone.then(() => window.testResults) : null'
DEMOS = ROOT / 'demo' / 'index.html'  # Lists the demos, each as <a href="<folder>/index.html">.
# The pages whose theme colors must be the paper's, and the dark sheet's where a page has one.
THEMED_PAGES = [ROOT / 'index.html', ROOT / 'style.html']
OPENED_VIEWPORT = (1280, 800)  # The window in which every page is opened.

# The checks of the pages against the cast (tools/gallery.py) and of the derived files, each a test of its own.
LABEL_TEST = "the gallery's labels agree with the cast"
PAGES_TEST = "the pages load every friend of the cast, in its order, and the gallery's rows and slots fit the friends' reaches"
DARK_TEST = "the dark sheet's inks and marks, and every theme color, follow from the paper's inks"
SHOWN_TEST = "the inks' contrasts and the data colors that the kit's README and the style guide give are the kit's"
TEST_FILES_TEST = 'test/index.html loads every test file'
GRAPHITE_TEST = 'every page that draws in pencil loads the graphite filter from lib/style/site/graphite.js'
LINKS_TEST = 'every local link names a file of the repository'
DEPENDENCY_TEST = "the library links nothing outside it, and phy's style and dotfiles nothing of the fwiends"
KIT_TEST = 'the kit keeps every name that the published kit defines'
DOTFILES_TEST = 'the dotfiles fit any machine: the recommended settings parse, and no file names a home folder'
GRAPHITE = KIT / 'graphite.js'
PENCIL_SHEETS = {KIT / 'pencil.css', KIT / 'phy.css'}  # The kit's stylesheets that draw through the filter.


def run_tests(page=TEST_PAGE):
    """Run the in-browser tests and the checks of the pages and of the derived files, and open every page as a reader
    opens it from disk. Return (results, errors): results is {'passed': [names], 'failed': [{'name', 'message'}]},
    and errors lists what the pages reported as (page, message): the tests' page, the cast's, the gallery at each
    width at which it is measured, and each page opened."""
    errors, unmeasured = [], []
    with HeadlessChrome(1024, 768) as chrome:
        chrome.open(page)
        results = test_results(chrome)
        errors += [(relative(page), error) for error in chrome.take_errors()]
        cast = measures = None
        try:
            cast = gallery.read_cast(chrome, errors)
            measures = gallery.measure_gallery(chrome, errors)
        except ValueError as error:
            unmeasured.append(str(error))
    with HeadlessChrome(*OPENED_VIEWPORT, reader=True) as reader:
        errors += opening_errors(reader, opened_pages())
    if results is None:
        errors.append((relative(page), 'it did not load test/harness.js: window.testsDone is missing'))
        results = {'passed': [], 'failed': []}
    found = layout.links()
    checks = {LABEL_TEST: gallery.label_drift(cast),
              PAGES_TEST: unmeasured + (gallery.page_drift(cast, measures) if cast else []),
              DARK_TEST: dark_drift(), SHOWN_TEST: dark_sheet.shown_drift(), TEST_FILES_TEST: test_files_drift(page),
              LINKS_TEST: layout.link_drift(found), DEPENDENCY_TEST: layout.dependency_drift(found),
              GRAPHITE_TEST: graphite_drift(found), KIT_TEST: kit_api.kit_drift(),
              DOTFILES_TEST: layout.dotfiles_drift()}
    for name, drift in checks.items():
        results['failed'] += [{'name': name, 'message': message} for message in drift]
        if not drift:
            results['passed'].append(name)
    return results, errors


def test_results(chrome):
    """Wait for the harness's results, or None if the page has none. A test that hangs without waiting (an endless
    loop) holds up the harness's timer too, so once the run has taken TEST_TIMEOUT seconds, it is stopped; the timer
    then fails it, and the run goes on."""
    while True:
        try:
            return chrome.evaluate(TEST_RESULTS_JS, timeout=TEST_TIMEOUT)
        except ChromeTimeout as timeout:
            chrome.send('Runtime.terminateExecution')
            try:
                running = chrome.evaluate('window.testRunning ?? null')
            except PageError:  # No script was running, so the termination stopped this evaluation instead.
                running = None
            if running is None:
                raise timeout
            print(f'note: stopped "{running}", which was still running when the tests had taken {TEST_TIMEOUT} s',
                  file=sys.stderr)


def demo_pages():
    """The demos' index, and each demo that it lists."""
    listed = re.findall(r'<a href="([\w-]+/index\.html)"', DEMOS.read_text(encoding='utf-8'))
    return [DEMOS] + [DEMOS.parent / link for link in listed]


def opened_pages():
    """The pages that `test` opens to see that they load and draw without errors: the site's, every tool page and
    every demo page."""
    return THEMED_PAGES + sorted((ROOT / 'tools').glob('*.html')) + demo_pages()


def opening_errors(chrome, pages):
    """Open each page and return the errors that it reports while it loads and first paints, as (page, message).
    Requests to other hosts are refused, so that the check needs no network and does not wait for one. With a reader's
    Chrome (HeadlessChrome(reader=True)) a page is opened from disk as anyone opens it, unable to read the files beside
    it, as a font preloaded with crossorigin would."""
    chrome.block('http://*', 'https://*')
    chrome.set_viewport(*OPENED_VIEWPORT)
    return [(relative(page), error) for page in pages for error in chrome.visit(page)]


def dark_drift():
    """Whether the dark sheet's blocks are as tools/dark_sheet.py would write them, and every theme color is the
    paper's or, for the dark sheet, its own, as a list of problems."""
    stale = [f'{relative(path)}: the dark sheet\'s block is stale; run python3 tools/dark_sheet.py'
             for path, (text, new) in dark_sheet.written().items() if new != text]
    return stale + [f'{relative(page)}: {problem}' for page in THEMED_PAGES + demo_pages()
                    for problem in dark_sheet.theme_drift(page)]


def graphite_drift(found):
    """Every page that pastes a graphite filter of its own, or draws in pencil (it loads the kit's pencil, or puts the
    filter over something itself) without loading lib/style/site/graphite.js, one line each. found is layout.links()."""
    loads = {}
    for source, _, path in found:
        loads.setdefault(source, set()).add(ROOT / path)
    problems = []
    for page in sorted(source for source in loads if source.endswith('.html')):
        text = (ROOT / page).read_text(encoding='utf-8')
        if '<filter id="graphite"' in text:
            problems.append(f'{page} pastes a graphite filter of its own: load {relative(GRAPHITE)} instead')
        elif (loads[page] & PENCIL_SHEETS or 'url(#graphite)' in text) and GRAPHITE not in loads[page]:
            problems.append(f'{page} draws in pencil without the graphite filter: load {relative(GRAPHITE)} first in its body')
    return problems


def test_files_drift(page=TEST_PAGE):
    """Every test file beside the tests' page that the page does not load, one line each."""
    page = Path(page)
    loaded ={(page.parent / src).resolve() for src in LOCAL_SCRIPT.findall(page.read_text(encoding='utf-8'))}
    return [f'{relative(page)} does not load {test.name}: add <script src="{test.name}"></script>'
            for test in sorted(page.parent.glob('*.test.js')) if test.resolve() not in loaded]


def relative(path):
    """A path as the messages give it: from the repository's root when it lies inside it."""
    try:
        return str(Path(path).resolve().relative_to(ROOT))
    except ValueError:
        return str(path)


def print_page_errors(errors):
    for where, error in errors:
        print(f'page error: {where}: {error}')


def print_results(results, errors):
    """Print each failure and page error, then a summary."""
    for failure in results['failed']:
        print(f'failed: {failure["name"]}: {failure["message"]}')
    print_page_errors(errors)
    summary = f'{len(results["passed"])} passed, {len(results["failed"])} failed'
    if errors:
        summary += f', {len(errors)} page error{"" if len(errors) == 1 else "s"}'
    print(summary)


def one_file(page, out):
    """Writes a page out as one file, with every script that it loads from this repository written into it, so that it
    works when sent to someone without the repository. Returns the path written."""
    def inline(tag):
        script = (page.parent / tag['src']).read_text(encoding='utf-8')
        if '</script' in script:
            raise ValueError(f"{tag['src']} contains '</script', which would end the inline script early")
        return f'<script>\n{script}\n</script>'
    out = Path(out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(LOCAL_SCRIPT.sub(inline, page.read_text(encoding='utf-8')), encoding='utf-8')
    return out


def frame_size(text):
    """Parse a frame size given as WxH, e.g. 1280x720."""
    match = re.fullmatch(r'([1-9]\d*)x([1-9]\d*)', text)
    if not match:
        raise argparse.ArgumentTypeError(f'{text!r} is not a size such as 1280x720')
    return int(match[1]), int(match[2])


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    common = argparse.ArgumentParser(add_help=False)
    common.add_argument('--with', dest='extra', action='append', default=[], metavar='FILE.js',
                        help='also load this script after the characters (e.g. a working copy of a spec)')

    sub.add_parser('list')

    r = sub.add_parser('render', help='render a still PNG', parents=[common])
    r.add_argument('name')
    r.add_argument('--view', default='portrait')
    r.add_argument('--pose', default='{}', help='JSON pose, e.g. {"lookX": 1, "eyes": "happy"}')
    r.add_argument('--size', type=int)
    r.add_argument('--no-bg', action='store_true', help='transparent background')
    r.add_argument('--flat', action='store_true', help='without the pencil texture')
    r.add_argument('-o', '--out')

    c = sub.add_parser('compare', help='render next to its example pictures', parents=[common])
    c.add_argument('name')
    c.add_argument('--view', help='one example (and view) name; default: every example with a view')
    c.add_argument('--pose', default='{}', help='JSON pose')
    c.add_argument('--region', help='x0,y0,x1,y1 in reference pixels: metrics and a zoomed crop for that box')
    c.add_argument('-o', '--out')

    n = sub.add_parser('anim', help='render an animation clip to .gif / .mp4 / .webm / .apng', parents=[common])
    n.add_argument('name')
    n.add_argument('--clip', default='idle', help='clip name or expression, e.g. "layer(idle, hold(\'curious\'))"')
    n.add_argument('--fps', type=int, default=30)
    n.add_argument('--seconds', type=float, help="default: the clip's duration")
    n.add_argument('--size', type=int, default=384)
    n.add_argument('--view', default='portrait', help='view name or JSON view object')
    n.add_argument('--zoom', type=float, default=1.0, help='< 1 zooms out about the bottom edge (headroom for hop)')
    n.add_argument('--no-bg', action='store_true', help='transparent background')
    n.add_argument('--sheet', nargs='?', const=True, help='also write a contact sheet (default <out>-sheet.png)')
    n.add_argument('-o', '--out')

    f = sub.add_parser('film', help='film a page that defines window.film to .mp4 / .webm (with --audio, with sound) / '
                                    '.gif / .apng, or a still')
    f.add_argument('page', help='an HTML file, optionally with a query and a fragment (e.g. "scene.html?take=2"), '
                                'or a URL')
    f.add_argument('-o', '--out', required=True)
    f.add_argument('--size', type=frame_size, help="WxH in CSS pixels; default: the film's own size")
    f.add_argument('--scale', type=float, default=1,
                   help='device pixel ratio (2 films twice the pixels each way; 1.3333333333 films a 1920x1080 '
                        'film at 2560x1440)')
    f.add_argument('--fps', type=int, help="default: the film's own rate, or 30")
    f.add_argument('--from', dest='start', type=float, default=0, metavar='SECONDS')
    f.add_argument('--to', dest='end', type=float, metavar='SECONDS', help="default: the film's end")
    f.add_argument('--at', type=float, metavar='SECONDS', help='with a .png output, save one still at this time')
    f.add_argument('--draft', action='store_true',
                   help="film even without every owner's agreement; the page marks it as a draft")
    f.add_argument('--sheet', nargs='?', const=True, help='also write a contact sheet (default <out>-sheet.png)')
    f.add_argument('--audio', metavar='FILE',
                   help='put this sound under a .mp4 or .webm film, cut to the filmed span (--from to --to), '
                        'padded with silence if it ends early')
    f.add_argument('--fade', type=float, metavar='SECONDS',
                   help='with --audio, fade the sound out over its last seconds; default: no fade')
    f.add_argument('--crf', type=float, metavar='N',
                   help='constant quality of a .mp4 (libx264, default 18) or .webm (VP9, default 30): lower is '
                        'better and larger, about 6 lower doubling the bit rate, which film prints; YouTube asks '
                        'for at least 8 Mb/s at 1080p30 and 16 Mb/s at 1440p30')

    sub.add_parser('test', help='run the in-browser tests in test/index.html, check the pages against the cast and '
                                'the derived files, and open every page as a reader opens it from disk')
    sub.add_parser('pages', help="write the friends' script tags and the gallery's rows and slots from the cast and the friends' reaches")
    u = sub.add_parser('tune', help='write the tuning page (tools/tune.html) out as one file, to send to an artist')
    u.add_argument('-o', '--out', default=OUT / 'tune.html')

    a = ap.parse_args(argv)
    EXTRA[:] = getattr(a, 'extra', [])
    with session():  # One Chrome, started when first needed, for the command's evaluations and stills.
        run(a)


def run(a):
    """Carry out the command that main() parsed."""
    if a.cmd == 'list':
        for n in characters():
            ex = examples(n)
            print(f'{n:16s} ' + (f'examples: {", ".join(ex)}' if ex else 'no examples'))
    elif a.cmd == 'render':
        out = a.out or OUT / a.name / f'{a.view}.png'
        render(a.name, out, view=a.view, pose=json.loads(a.pose), size=a.size, bg=not a.no_bg, pencil=not a.flat)
        print(out)
    elif a.cmd == 'compare':
        region = tuple(int(v) for v in a.region.split(',')) if a.region else None
        compare(a.name, a.out, view=a.view, pose=json.loads(a.pose), region=region)
    elif a.cmd == 'anim':
        view = json.loads(a.view) if a.view.lstrip().startswith('{') else a.view
        print(anim(a.name, a.clip, a.out, fps=a.fps, seconds=a.seconds, view=view, size=a.size,
                   bg=not a.no_bg, sheet=a.sheet, zoom=a.zoom))
    elif a.cmd == 'film':
        print(film(a.page, a.out, size=a.size, scale=a.scale, fps=a.fps, start=a.start, end=a.end, at=a.at,
                   draft=a.draft, sheet=a.sheet, audio=a.audio, fade=a.fade, crf=a.crf))
    elif a.cmd == 'test':
        results, errors = run_tests()
        print_results(results, errors)
        raise SystemExit(1 if results['failed'] or errors else 0)
    elif a.cmd == 'pages':
        run_pages()
    elif a.cmd == 'tune':
        print(one_file(TUNE_PAGE, a.out))


def run_pages():
    """Write the friends' script tags, then the gallery's rows and slots, and print each page written. Rows measured
    on a gallery that reported errors could be wrong, so they are then not written, and the command fails."""
    errors, changed = [], []
    try:
        # The script tags first, so that the gallery measured for the rows draws every friend of the cast.
        with HeadlessChrome(gallery.WIDE, 900) as chrome:
            cast = gallery.read_cast(chrome, errors)
            changed += gallery.write_pages(cast)
            measures = gallery.measure_gallery(chrome, errors)
            if not errors:
                changed += gallery.write_pages(cast, measures)
    except ValueError as error:
        problem = str(error)
    else:
        problem = "the pages reported errors, so the gallery's rows and slots were not written" if errors else None
    for page in dict.fromkeys(changed):
        print(page)
    print_page_errors(errors)
    if problem:
        raise SystemExit(f'error: {problem}')


if __name__ == '__main__':
    exit_on_sigterm()
    try:
        main()
    except ChromeError as error:  # The message names what failed in Chrome or the page; a traceback adds nothing.
        raise SystemExit(f'error: {error}')
