#!/usr/bin/env python3
"""Command-line tool for phy's fwiends that renders characters with headless Chrome.

  python3 tools/pf.py list
  python3 tools/pf.py render howdi                      # Writes out/howdi/portrait.png.
  python3 tools/pf.py render howdi --view ref --pose '{"lookX": 1}' -o out/scratch/x.png
  python3 tools/pf.py render howdi --flat               # The flat shapes, without the pencil texture.
  python3 tools/pf.py compare howdi                     # Every example -> out/howdi/compare/<example>.png.
  python3 tools/pf.py compare howdi --view ref --region 0,600,700,1254   # One example; metrics and a zoom for a box.
  python3 tools/pf.py anim howdi --clip idle            # Writes out/howdi/anim/idle.gif.
  python3 tools/pf.py anim howdi --clip "layer(idle, curious)" --size 512 --sheet -o out/scratch/x.mp4
  python3 tools/pf.py render howdi --with out/scratch/mine.js   # A working copy that may redefine howdi.
  python3 tools/pf.py style                             # STYLE.md + FWIENDS.md -> style.html (the style guide page).
  python3 tools/pf.py film test/film-stub.html -o out/scratch/film/stub.mp4   # Films a page that defines window.film.
  python3 tools/pf.py film test/film-stub.html --at 1 --size 1920x1080 -o out/scratch/film/still.png
  python3 tools/pf.py test                              # Runs test/index.html headless; exits non-zero on a failure.

Each character lives in characters/<name>/, which holds the spec <name>.js and
an examples/ folder of reference pictures. An example is compared through the
view of the same name, so examples/ref.jpg pairs with the spec's views.ref.

`film` films any page that follows the film contract (see film() below) frame
by frame, so a scene exports frame-exactly whatever the machine's speed.

Output goes to out/<name>/ for each character (stills, compare/, anim/),
out/design/ for page mockups, and out/scratch/ for experiments.

Requires Google Chrome (override the path with $CHROME) and Pillow; video
output also requires ffmpeg.
"""
import argparse
import html
import json
import math
import re
import shutil
import subprocess
import sys
import tempfile
import time
from contextlib import contextmanager
from pathlib import Path
from string import Template

from PIL import Image

from cdp import CHROME, ChromeError, HeadlessChrome, PageError, kill_process_group

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'out'  # Holds out/<name>/..., out/design/ and out/scratch/.
CHARACTERS = ROOT / 'characters'  # Holds characters/<name>/<name>.js and characters/<name>/examples/.
IMAGE_TYPES = {'.png', '.jpg', '.jpeg', '.webp', '.gif'}
EXTRA = []  # Scripts from --with, loaded after the characters (e.g. a working copy that redefines one).


def characters():
    """Return the character names: every characters/<name>/ that holds a <name>.js."""
    return sorted(d.name for d in CHARACTERS.iterdir() if (d / f'{d.name}.js').is_file())


def examples(name):
    """Return {example name: path} for the pictures in characters/<name>/examples/."""
    folder = CHARACTERS / name / 'examples'
    if not folder.is_dir():
        return {}
    return {p.stem: p for p in sorted(folder.iterdir()) if p.suffix.lower() in IMAGE_TYPES}


def scripts():
    """Return the scripts a page loads: library files, then character definitions, then --with scripts."""
    libs = [ROOT / 'src' / 'phyfriends.js'] + sorted(p for p in (ROOT / 'src').glob('*.js') if p.name != 'phyfriends.js')
    return libs + [CHARACTERS / n / f'{n}.js' for n in characters()] + [Path(x).resolve() for x in EXTRA]


def page(body_js, bg='transparent'):
    tags = '\n'.join(f'<script src="{p.as_uri()}"></script>' for p in scripts())
    return f"""<!doctype html><meta charset="utf-8">
<style>html,body{{margin:0;padding:0;overflow:hidden;background:{bg}}}svg{{display:block}}
#root{{display:flex;flex-wrap:wrap;align-content:flex-start}}</style>
{tags}
<div id="root"></div>
<pre id="err" style="color:red;font:16px monospace;position:absolute;top:0;left:0;margin:0"></pre>
<script>
try {{ {body_js} }} catch (e) {{ document.getElementById('err').textContent = String(e.stack || e); }}
</script>"""


def shoot(html, w, h, out_png, timeout=60):
    """Screenshot an HTML string at w x h CSS pixels into out_png and return the image."""
    work = Path(tempfile.mkdtemp(prefix='pf-'))
    try:
        src = work / 'page.html'
        src.write_text(html)
        shot = work / 'shot.png'
        cmd = [CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
               '--no-default-browser-check', '--disable-extensions', '--mute-audio',
               f'--user-data-dir={work / "profile"}', f'--window-size={w},{h}',
               '--force-device-scale-factor=1', '--default-background-color=00000000',
               '--allow-file-access-from-files', '--virtual-time-budget=1000',
               f'--screenshot={shot}', src.as_uri()]
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
            raise RuntimeError('Chrome produced no screenshot (see $CHROME / page errors)')
        img = Image.open(shot)
        img.load()
        img = img.crop((0, 0, w, h))
        Path(out_png).parent.mkdir(parents=True, exist_ok=True)
        img.save(out_png)
        return img
    finally:
        shutil.rmtree(work, ignore_errors=True)


def render(name, out_png, view='portrait', pose=None, size=None, bg=True, pencil=True):
    """Render one still and return the PIL image. pencil=False draws the flat shapes without the pencil texture."""
    opts = {'view': view, 'pose': pose or {}, 'pencil': pencil}
    if size:
        opts['size'] = size
    if bg is False:
        opts['bg'] = False
    elif isinstance(bg, str):
        opts['bg'] = bg
    js = f"""
const spec = PhyFriends.get({json.dumps(name)});
const v = PhyFriends.resolveView(spec, {json.dumps(view)}, {json.dumps(size)});
document.getElementById('root').innerHTML = PhyFriends.render(spec, {json.dumps(opts)});
document.title = v.w + 'x' + v.h;"""
    w, h = view_size(name, view, size)
    return shoot(page(js), w, h, out_png)


def evaluate(js_expr, timeout=60):
    """Evaluate a JS expression in a page that has the library loaded and return its JSON value."""
    work = Path(tempfile.mkdtemp(prefix='pf-'))
    try:
        src = work / 'page.html'
        src.write_text(page(f"document.getElementById('result').textContent = JSON.stringify({js_expr});")
                       .replace('<div id="root"></div>', '<div id="root"></div><pre id="result"></pre>'))
        cmd = [CHROME, '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
               '--disable-extensions', f'--user-data-dir={work / "profile"}', '--allow-file-access-from-files',
               '--dump-dom', src.as_uri()]
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, start_new_session=True)
        buf, deadline = b'', time.time() + timeout
        while b'</html>' not in buf and time.time() < deadline:
            chunk = proc.stdout.read1(1 << 16)
            if not chunk:
                break
            buf += chunk
        kill_process_group(proc)
        html = buf.decode('utf-8', 'replace')
        import html as htmlmod
        import re
        err = re.search(r'<pre id="err"[^>]*>(.*?)</pre>', html, re.S)
        if err and err.group(1).strip():
            raise RuntimeError('page error: ' + htmlmod.unescape(err.group(1)))
        m = re.search(r'<pre id="result">(.*?)</pre>', html, re.S)
        if not m:
            raise RuntimeError('could not evaluate in Chrome')
        return json.loads(htmlmod.unescape(m.group(1)))
    finally:
        shutil.rmtree(work, ignore_errors=True)


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
_have = None


def pick_encoder(ext):
    """Return (encoder, args) for an output extension, falling back when ffmpeg lacks the best one."""
    global _have
    if ext not in ENCODERS:
        raise SystemExit(f'unknown output type {ext} (use .gif, .mp4, .webm or .apng)')
    if _have is None:
        if not shutil.which('ffmpeg'):
            raise SystemExit('ffmpeg not found: install it (e.g. `brew install ffmpeg`) to export animations')
        txt = subprocess.run(['ffmpeg', '-hide_banner', '-encoders'], capture_output=True, text=True).stdout
        _have = {ln.split()[1] for ln in txt.splitlines() if ln.startswith(' V') and len(ln.split()) > 1}
    options = ENCODERS[ext]
    for name, args in options:
        if name in _have:
            if name != options[0][0]:
                print(f'note: ffmpeg has no {options[0][0]}; using {name}', file=sys.stderr)
            return name, args
    raise SystemExit(f'{ext} needs one of the ffmpeg encoders {", ".join(n for n, _ in options)}, '
                     'and this ffmpeg has none of them; try .gif or .apng')


def encode(frame_paths, out, fps=30):
    """Encode frames (f0000.png, ...) into .gif, .mp4, .webm or .apng with ffmpeg."""
    frame_dir = Path(frame_paths[0]).parent
    pattern = str(frame_dir / 'f%04d.png')
    out = Path(out)
    out.parent.mkdir(parents=True, exist_ok=True)
    ext = out.suffix.lower()
    codec, args = pick_encoder(ext)
    base = ['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(fps), '-i', pattern]
    if ext == '.gif':
        vf = 'split[a][b];[a]palettegen=reserve_transparent=1:stats_mode=full[p];[b][p]paletteuse=dither=none'
        cmd = base + ['-vf', vf, '-loop', '0', str(out)]
    elif ext == '.mp4':  # MP4 has no alpha channel, and yuv420p requires even dimensions.
        cmd = base + ['-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2', '-c:v', codec, *args, '-pix_fmt', 'yuv420p',
                      '-movflags', '+faststart', str(out)]
    elif ext == '.webm':
        cmd = base + ['-c:v', codec, *args, '-pix_fmt', 'yuva420p', str(out)]
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
    """Render a PhyFriends.anim clip (a name or an expression such as "layer(idle, curious)").

    sheet: a path for a contact sheet of sampled frames, or True for <out>-sheet.png.
    zoom: a value below 1 zooms out about the bottom edge, for clips that travel upward (hop).
    Returns the output path.
    """
    import re
    out = Path(out or OUT / name / 'anim' / f'{re.sub(r"[^A-Za-z0-9]+", "-", clip).strip("-")[:40]}.gif')
    if sheet is True:
        sheet = out.with_name(out.stem + '-sheet.png')
    ext = out.suffix.lower()
    pick_encoder(ext)  # Fail before the slow render if no encoder is available.
    clip_js = f'PhyFriends.anim.parse({json.dumps(clip)})'
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


# ---- Style guide page: STYLE.md and FWIENDS.md rendered to style.html -------------

LIST_ITEM = re.compile(r'( *)([-*]|\d+\.) +(.*)')


def md_inline(text):
    """Convert inline Markdown (**bold**, *italic*, `code`, [text](url)) to HTML; escape the rest."""
    codes = []  # Code spans are held out as \0n\0 so emphasis can wrap them but not match inside.

    def stash(m):
        codes.append(f'<code>{html.escape(m[1], quote=False)}</code>')
        return f'\0{len(codes) - 1}\0'
    text = html.escape(re.sub(r'`([^`]+)`', stash, text), quote=False)
    text = re.sub(r'\[([^\]]+)\]\(([^)\s]+)\)', lambda m: '<a href="%s">%s</a>' % (m[2].replace('"', '%22'), m[1]), text)
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'(?<![\w*])\*(?=\S)(.+?)(?<=\S)\*(?![\w*])', r'<em>\1</em>', text)
    return re.sub(r'\0(\d+)\0', lambda m: codes[int(m[1])], text)


def md_blocks(lines, tight=False):
    """Convert the block-level Markdown that STYLE.md uses to HTML.

    Supported: # headings, ---, paragraphs, - and 1. lists nested by indentation,
    > quotes, | tables and ``` code blocks. tight: emit paragraphs as bare text
    (inside a list item). A paragraph that runs straight into a list (no blank
    line) is marked class="lead".
    """
    out, i, n = [], 0, len(lines)
    while i < n:
        line = lines[i]
        m = LIST_ITEM.match(line)
        if not line.strip():
            i += 1
        elif line.lstrip().startswith('```'):
            j = i + 1
            while j < n and not lines[j].lstrip().startswith('```'):
                j += 1
            code = '\n'.join(lines[i + 1:j])
            out.append(f'<pre><code>{html.escape(code, quote=False)}</code></pre>')
            i = j + 1
        elif line.startswith('|'):
            j = i
            while j < n and lines[j].startswith('|'):
                j += 1
            rows = [[c.strip() for c in x.strip().strip('|').split('|')] for x in lines[i:j]]
            head, body = (rows[0], rows[2:]) if len(rows) > 1 and set(''.join(rows[1])) <= set('-: ') else (None, rows)
            cells = lambda tag, row: ''.join(f'<{tag}>{md_inline(c)}</{tag}>' for c in row)
            out.append('<table>\n' + (f'<thead><tr>{cells("th", head)}</tr></thead>\n' if head else '')
                       + '<tbody>\n' + '\n'.join(f'<tr>{cells("td", r)}</tr>' for r in body) + '\n</tbody>\n</table>')
            i = j
        elif line.strip() == '---':
            out.append('<hr>')
            i += 1
        elif re.match(r'#{1,6} ', line):
            hashes, text = line.split(None, 1)
            slug = re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')
            out.append(f'<h{len(hashes)} id="{slug}">{md_inline(text.strip())}</h{len(hashes)}>')
            i += 1
        elif line.startswith('>'):
            j = i
            while j < n and lines[j].startswith('>'):
                j += 1
            out.append('<blockquote>\n' + md_blocks([re.sub(r'^> ?', '', x) for x in lines[i:j]]) + '\n</blockquote>')
            i = j
        elif m:
            indent, ordered, items = len(m[1]), m[2].endswith('.'), []
            while i < n and (m := LIST_ITEM.match(lines[i])) and len(m[1]) == indent and m[2].endswith('.') == ordered:
                w, body = len(m[0]) - len(m[3]), [m[3]]  # The item text starts at column w (indent + marker + space).
                i += 1
                while i < n and lines[i].strip() and len(lines[i]) - len(lines[i].lstrip()) > indent:
                    body.append(lines[i][min(w, len(lines[i]) - len(lines[i].lstrip())):])
                    i += 1
                items.append(f'<li>{md_blocks(body, tight=True)}</li>')
            tag = 'ol' if ordered else 'ul'
            out.append(f'<{tag}>\n' + '\n'.join(items) + f'\n</{tag}>')
        else:
            j = i + 1
            while j < n and lines[j].strip() and not (LIST_ITEM.match(lines[j]) or re.match(r'#{1,6} |>|---\s*$|\s*```|\|', lines[j])):
                j += 1
            text = md_inline(' '.join(x.strip() for x in lines[i:j]))
            lead = j < n and LIST_ITEM.match(lines[j])
            out.append(text if tight else f'<p class="lead">{text}</p>' if lead else f'<p>{text}</p>')
            i = j
    return '\n'.join(out)


# The page is styled only by site/notebook.css (the paper) and site/pencil.css (the .doc
# column and everything drawn on it). It deliberately has no CSS of its own, so the style
# guide is rendered with the same stylesheets it documents.
STYLE_PAGE = Template("""<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>$title</title>
<meta name="description" content="how phy makes things: the paper, the pencil, the words and the fwiends.">
<meta name="theme-color" content="#fbf9f3">
<link rel="icon" href="site/icon.svg" type="image/svg+xml">
<link rel="icon" href="site/icon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="site/apple-touch-icon.png">
<!-- Generated from STYLE.md and FWIENDS.md by `python3 tools/pf.py style`: edit those, not this file. -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Shantell+Sans:wght,BNCE,INFM@300..800,-100..100,0..100&display=swap">
<link rel="stylesheet" href="site/notebook.css">
<link rel="stylesheet" href="site/pencil.css">
</head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <!-- Graphite grain and a slight displacement wobble for the title. -->
  <filter id="graphite" x="-2%" y="-20%" width="104%" height="140%">
    <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="7" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 2.1" result="grain"/>
    <feComposite in="SourceGraphic" in2="grain" operator="in" result="g"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="1" seed="2" result="w"/>
    <feDisplacementMap in="g" in2="w" scale="1.5" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</svg>

<main>
  <header>
    <h1>style guide</h1>
    <p class="intro">how phy makes things: the paper, the pencil, the words and the fwiends.</p>
    <nav aria-label="pages">
      <ul>
        <li><a href="index.html">fwiends</a></li>
        <li><span aria-current="page">style guide</span></li>
        <li><a href="specimen.html">specimen</a></li>
      </ul>
    </nav>
  </header>

  <article class="doc">
$body
  </article>

  <footer>
    <ul>
      <li><a href="index.html">back to the fwiends</a></li>
      <li>source: <a href="https://github.com/rareone0602/phy_friends">github.com/<wbr>rareone0602/<wbr>phy_friends</a></li>
    </ul>
  </footer>
</main>
</body>
</html>
""")


def style_page(srcs=(ROOT / 'STYLE.md', ROOT / 'FWIENDS.md'), out=ROOT / 'style.html'):
    """Render STYLE.md, then FWIENDS.md, to style.html.

    The first file's # title becomes the <title>; each later file's # title heads
    its own part of the page. The page's own h1 and intro are written in STYLE_PAGE.
    """
    title, parts = "phy's style guide", []
    for k, src in enumerate(srcs):
        lines = Path(src).read_text(encoding='utf-8').splitlines()
        head = lines.pop(0)[2:].strip() if lines and lines[0].startswith('# ') else None
        if k == 0:
            title = head or title
        elif head:
            lines = ['---', '', '# ' + head, ''] + lines
        parts.append(md_blocks(lines))
    Path(out).write_text(STYLE_PAGE.substitute(title=html.escape(title, quote=False), body='\n'.join(parts)), encoding='utf-8')
    return out


# ---- Films: a page that defines window.film, filmed frame by frame ----------------

FILM_VIEWPORT = (1280, 720)  # The viewport a page first opens at, before its film's own size is known.
FILM_FPS = 30  # The frame rate when neither --fps nor the film sets one.
SETTLE_ATTEMPTS = 10  # Screenshots taken at most while waiting for the first frame to stop changing.
PROGRESS_REPORTS = 4  # Progress lines printed while filming.
URL = re.compile(r'[a-zA-Z][a-zA-Z0-9+.-]*://')

# Resolves after two animation frames, by which time the DOM changes made before it have been painted.
NEXT_PAINT_JS = 'new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)))'
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


def film(page, out, size=None, scale=1, fps=None, start=0, end=None, at=None, draft=False, sheet=None):
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
    unless draft is set (STYLE.md, principle 8).
    page: an HTML file, relative to the current directory and optionally with a query
    of its own, or a URL. out: .mp4, .webm, .gif or .apng; with `at` (seconds), a .png
    still instead. size: (width, height) in CSS pixels. scale: the device pixel ratio.
    sheet: a path for a contact sheet, or True for <out>-sheet.png.
    """
    page, out = absolute_page(page), Path(out)
    if at is not None:
        if out.suffix.lower() != '.png' or sheet:
            raise SystemExit('--at saves one still: give a .png output, and no --sheet')
        return film_still(page, out, at, size, scale, draft)
    pick_encoder(out.suffix.lower())  # Fail before the slow part if no encoder is available.
    if sheet is True:
        sheet = out.with_name(out.stem + '-sheet.png')
    work = Path(tempfile.mkdtemp(prefix='pf-film-'))
    try:
        paths, fps, first = film_frames(page, work, size, scale, fps, start, end, draft)
        if sheet:
            contact_sheet(paths, sheet, fps=fps, start=first)
        encode(paths, out, fps)
    finally:
        shutil.rmtree(work, ignore_errors=True)
    return out


def absolute_page(page):
    """Return a page with its path made absolute from the current directory; a URL is returned as it is."""
    page = str(page)
    if URL.match(page):
        return page
    path, mark, query = page.partition('?')
    path = Path(path).resolve()
    if not path.is_file():
        raise SystemExit(f'no page at {path}')
    return str(path) + mark + query


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
        raise SystemExit(f'not filming: {owners} not agreed to video. Record the agreement in characters/cast.js, '
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


# ---- Tests: test/index.html, run headless -------------------------------------------

TEST_PAGE = ROOT / 'test' / 'index.html'
TEST_TIMEOUT = 120  # Seconds for the whole run; the harness also stops any single test that hangs.
TEST_RESULTS_JS = 'window.testsDone ? window.testsDone.then(() => window.testResults) : null'


def run_tests(page=TEST_PAGE):
    """Run the in-browser tests, print each failure and a summary, and return the number of problems."""
    with HeadlessChrome(1024, 768) as chrome:
        chrome.open(page)
        results = chrome.evaluate(TEST_RESULTS_JS, timeout=TEST_TIMEOUT)
        errors = list(chrome.errors)
    if results is None:
        errors.append(f'{page} did not load test/harness.js: window.testsDone is missing')
        results = {'passed': [], 'failed': []}
    for failure in results['failed']:
        print(f'failed: {failure["name"]}: {failure["message"]}')
    for error in errors:
        print(f'page error: {error}')
    summary = f'{len(results["passed"])} passed, {len(results["failed"])} failed'
    if errors:
        summary += f', {len(errors)} page error{"" if len(errors) == 1 else "s"}'
    print(summary)
    return len(results['failed']) + len(errors)


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
    n.add_argument('--clip', default='idle', help='clip name or expression, e.g. "layer(idle, curious)"')
    n.add_argument('--fps', type=int, default=30)
    n.add_argument('--seconds', type=float, help="default: the clip's duration")
    n.add_argument('--size', type=int, default=384)
    n.add_argument('--view', default='portrait', help='view name or JSON view object')
    n.add_argument('--zoom', type=float, default=1.0, help='< 1 zooms out about the bottom edge (headroom for hop)')
    n.add_argument('--no-bg', action='store_true', help='transparent background')
    n.add_argument('--sheet', nargs='?', const=True, help='also write a contact sheet (default <out>-sheet.png)')
    n.add_argument('-o', '--out')

    sub.add_parser('style', help='write STYLE.md and FWIENDS.md out as style.html')

    f = sub.add_parser('film', help='film a page that defines window.film to .mp4 / .webm / .gif / .apng, or a still')
    f.add_argument('page', help='an HTML file, optionally with a query (e.g. "scene.html?take=2"), or a URL')
    f.add_argument('-o', '--out', required=True)
    f.add_argument('--size', type=frame_size, help="WxH in CSS pixels; default: the film's own size")
    f.add_argument('--scale', type=float, default=1, help='device pixel ratio (2 films twice the pixels each way)')
    f.add_argument('--fps', type=int, help="default: the film's own rate, or 30")
    f.add_argument('--from', dest='start', type=float, default=0, metavar='SECONDS')
    f.add_argument('--to', dest='end', type=float, metavar='SECONDS', help="default: the film's end")
    f.add_argument('--at', type=float, metavar='SECONDS', help='with a .png output, save one still at this time')
    f.add_argument('--draft', action='store_true',
                   help="film even without every owner's agreement; the page marks it as a draft")
    f.add_argument('--sheet', nargs='?', const=True, help='also write a contact sheet (default <out>-sheet.png)')

    sub.add_parser('test', help='run the in-browser tests in test/index.html')

    a = ap.parse_args(argv)
    EXTRA[:] = getattr(a, 'extra', [])
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
    elif a.cmd == 'style':
        print(style_page())
    elif a.cmd == 'film':
        print(film(a.page, a.out, size=a.size, scale=a.scale, fps=a.fps, start=a.start, end=a.end, at=a.at,
                   draft=a.draft, sheet=a.sheet))
    elif a.cmd == 'test':
        raise SystemExit(1 if run_tests() else 0)


if __name__ == '__main__':
    try:
        main()
    except ChromeError as error:  # The message names what failed in Chrome or the page; a traceback adds nothing.
        raise SystemExit(f'error: {error}')
