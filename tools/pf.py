#!/usr/bin/env python3
"""phy's fwiends command line — render characters with headless Chrome.

  python3 tools/pf.py list
  python3 tools/pf.py render howdi                      # -> out/howdi/portrait.png
  python3 tools/pf.py render howdi --view ref --pose '{"lookX": 1}' -o out/scratch/x.png
  python3 tools/pf.py compare howdi                     # every example -> out/howdi/compare/<example>.png
  python3 tools/pf.py compare howdi --view ref --region 0,600,700,1254   # one example, metrics + zoom for a box
  python3 tools/pf.py anim howdi --clip idle            # -> out/howdi/anim/idle.gif
  python3 tools/pf.py anim howdi --clip "layer(idle, curious)" --size 512 --sheet -o out/scratch/x.mp4
  python3 tools/pf.py render howdi --with out/scratch/mine.js   # mine.js may redefine howdi (a working copy)
  python3 tools/pf.py style                             # STYLE.md -> style.html (the site's style-guide page)

Characters live in characters/<name>/: the spec <name>.js, and examples/ with
reference pictures. An example is compared through the view of the same name,
so examples/ref.jpg pairs with the spec's views.ref.

Output layout: out/<name>/ for each character (stills, compare/, anim/),
out/design/ for page mockups, out/scratch/ for experiments.

Needs Google Chrome (override with $CHROME) and Pillow; ffmpeg for video.
"""
import argparse
import html
import json
import math
import os
import re
import shutil
import signal
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from string import Template

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'out'  # out/<name>/..., out/design/, out/scratch/
CHARACTERS = ROOT / 'characters'  # characters/<name>/<name>.js and characters/<name>/examples/
CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
IMAGE_TYPES = {'.png', '.jpg', '.jpeg', '.webp', '.gif'}
EXTRA = []  # --with: scripts loaded after the characters, e.g. a working copy that redefines one


def characters():
    """Character names: every characters/<name>/ that holds a <name>.js."""
    return sorted(d.name for d in CHARACTERS.iterdir() if (d / f'{d.name}.js').is_file())


def examples(name):
    """{example name: path} for the pictures in characters/<name>/examples/."""
    folder = CHARACTERS / name / 'examples'
    if not folder.is_dir():
        return {}
    return {p.stem: p for p in sorted(folder.iterdir()) if p.suffix.lower() in IMAGE_TYPES}


def scripts():
    """Library files first, then every character definition."""
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
    """Screenshot an HTML string at w x h CSS px into out_png."""
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
        try:
            os.killpg(proc.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        proc.wait()
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


def render(name, out_png, view='portrait', pose=None, size=None, bg=True):
    """Render one still. Returns the PIL image."""
    opts = {'view': view, 'pose': pose or {}}
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
    """Evaluate a JS expression in a page that has the library loaded; returns its JSON value."""
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
        try:
            os.killpg(proc.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        proc.wait()
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
    """Render many poses as sprite sheets (one Chrome launch per sheet), then split.

    poses_js: JS expression evaluating to an array of pose objects; it can use
    PhyFriends (and PhyFriends.anim when present). Returns the frame paths
    (out_dir/f0000.png ...).
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
    """(encoder, args) for an output extension, falling back when ffmpeg lacks the best one."""
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
    """Encode frames (f0000.png ...) into .gif / .mp4 / .webm / .apng with ffmpeg."""
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
    elif ext == '.mp4':  # no alpha; yuv420p wants even sizes
        cmd = base + ['-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2', '-c:v', codec, *args, '-pix_fmt', 'yuv420p',
                      '-movflags', '+faststart', str(out)]
    elif ext == '.webm':
        cmd = base + ['-c:v', codec, *args, '-pix_fmt', 'yuva420p', str(out)]
    else:
        cmd = base + ['-plays', '0', '-f', 'apng', str(out)]
    subprocess.run(cmd, check=True)
    return out


def contact_sheet(frame_paths, out_png, count=16, cols=8, fps=None):
    """Tile `count` evenly spaced frames (always the first and the last), labelled."""
    from PIL import ImageDraw, ImageFont
    n = len(frame_paths)
    idx = sorted({round(i * (n - 1) / max(1, count - 1)) for i in range(min(count, n))})
    tiles = [Image.open(frame_paths[i]).convert('RGBA') for i in idx]
    w, h = tiles[0].size
    cols = min(cols, len(tiles))
    sheet = Image.new('RGBA', (cols * w, math.ceil(len(tiles) / cols) * h), '#555')
    draw, font = ImageDraw.Draw(sheet), ImageFont.load_default(size=max(12, w // 16))
    for k, (i, tile) in enumerate(zip(idx, tiles)):
        x, y = (k % cols) * w, (k // cols) * h
        sheet.alpha_composite(tile, (x, y))
        draw.text((x + 6, y + 4), f'#{i}' + (f' {i / fps:.2f}s' if fps else ''), fill='#fff', font=font)
    Path(out_png).parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_png)
    return out_png


def zoom_view(name, view='portrait', k=1.0):
    """The view zoomed by k about its bottom centre (k < 1 leaves headroom for hops)."""
    v = evaluate(f'PhyFriends.resolveView(PhyFriends.get({json.dumps(name)}), {json.dumps(view)})')
    return {**v, 'x': v['w'] / 2 + (v['x'] - v['w'] / 2) * k, 'y': v['h'] + (v['y'] - v['h']) * k, 'scale': v['scale'] * k}


def anim(name, clip='idle', out=None, fps=30, seconds=None, view='portrait', size=384, bg=True, sheet=None, zoom=1.0):
    """Render a PhyFriends.anim clip (a name or an expression like "layer(idle, curious)").

    sheet: a path for a contact sheet of sampled frames, or True for <out>-sheet.png.
    zoom: < 1 zooms out about the bottom edge, for clips that travel upwards (hop).
    """
    import re
    out = Path(out or OUT / name / 'anim' / f'{re.sub(r"[^A-Za-z0-9]+", "-", clip).strip("-")[:40]}.gif')
    if sheet is True:
        sheet = out.with_name(out.stem + '-sheet.png')
    ext = out.suffix.lower()
    pick_encoder(ext)  # fail before rendering
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
    """The spec's palette, with the house shades it uses, as colour classes; near-identical colours share a class."""
    pal = evaluate(f'PhyFriends.palette({json.dumps(name)})')
    classes = []  # [(label, (r, g, b))]
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

    view: one example (and view) name; by default every example that has a view.
    Writes out/<name>/compare/<example>.png and -diff.png (see compare_one), and
    the plain render to out/<name>/<example>.png. out_png and region need a single example.
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
    """Reference | render | blend, plus a palette-class diff map and metrics.

    Every pixel of both images is snapped to the nearest palette colour; the diff
    map (<out>-diff.png) paints red where the classes disagree, over a dimmed
    reference. "solid" mismatch ignores a 2px band along the reference's colour
    edges (anti-aliasing and JPEG noise). region = (x0, y0, x1, y1) in reference
    pixels also prints metrics for that box and writes a zoomed <out>-region.png.
    """
    import numpy as np
    ref = Image.open(ref_path).convert('RGB')
    out_png = Path(out_png)
    out_png.parent.mkdir(parents=True, exist_ok=True)
    got = render(name, render_png, view=view, pose=pose).convert('RGB').resize(ref.size)
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


# ---- style.html: STYLE.md written out on the notebook page ------------------------

LIST_ITEM = re.compile(r'( *)([-*]|\d+\.) +(.*)')


def md_inline(text):
    """**bold**, *italic*, `code` and [text](url); everything else HTML-escaped."""
    codes = []  # code spans wait outside as \0n\0, so emphasis can wrap them but not reach in

    def stash(m):
        codes.append(f'<code>{html.escape(m[1], quote=False)}</code>')
        return f'\0{len(codes) - 1}\0'
    text = html.escape(re.sub(r'`([^`]+)`', stash, text), quote=False)
    text = re.sub(r'\[([^\]]+)\]\(([^)\s]+)\)', lambda m: '<a href="%s">%s</a>' % (m[2].replace('"', '%22'), m[1]), text)
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'(?<![\w*])\*(?=\S)(.+?)(?<=\S)\*(?![\w*])', r'<em>\1</em>', text)
    return re.sub(r'\0(\d+)\0', lambda m: codes[int(m[1])], text)


def md_blocks(lines, tight=False):
    """The Markdown STYLE.md uses: # headings, ---, paragraphs, - and 1. lists nested
    by indentation, and > quotes. tight: paragraphs as bare text (inside a list item).
    A paragraph that runs straight into a list (no blank line) is marked class="lead"."""
    out, i, n = [], 0, len(lines)
    while i < n:
        line = lines[i]
        m = LIST_ITEM.match(line)
        if not line.strip():
            i += 1
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
                w, body = len(m[0]) - len(m[3]), [m[3]]  # w: indent + marker + space
                i += 1
                while i < n and lines[i].strip() and len(lines[i]) - len(lines[i].lstrip()) > indent:
                    body.append(lines[i][min(w, len(lines[i]) - len(lines[i].lstrip())):])
                    i += 1
                items.append(f'<li>{md_blocks(body, tight=True)}</li>')
            tag = 'ol' if ordered else 'ul'
            out.append(f'<{tag}>\n' + '\n'.join(items) + f'\n</{tag}>')
        else:
            j = i + 1
            while j < n and lines[j].strip() and not (LIST_ITEM.match(lines[j]) or re.match(r'#{1,6} |>|---\s*$', lines[j])):
                j += 1
            text = md_inline(' '.join(x.strip() for x in lines[i:j]))
            lead = j < n and LIST_ITEM.match(lines[j])
            out.append(text if tight else f'<p class="lead">{text}</p>' if lead else f'<p>{text}</p>')
            i = j
    return '\n'.join(out)


# Page CSS on top of site/notebook.css. Every block is a whole number of rules (--L)
# tall, so nothing drifts off the rules further down; .doc is lifted as one piece
# (--lift) so 18px body text sits on them, and h2 is nudged for its own font.
STYLE_PAGE = Template("""<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>$title</title>
<meta name="description" content="how phy's fwiends are drawn, and how their page behaves.">
<meta name="theme-color" content="#fbf9f3">
<link rel="icon" href="site/icon.svg" type="image/svg+xml">
<link rel="icon" href="site/icon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="site/apple-touch-icon.png">
<!-- Generated from STYLE.md by `python3 tools/pf.py style`: edit STYLE.md, not this file. -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Reenie+Beanie&family=The+Girl+Next+Door&display=swap">
<link rel="stylesheet" href="site/notebook.css">
<style>
  .doc { --lift: calc(var(--L) / 2 - 7px); position: relative; top: var(--lift); max-width: 42em; margin-top: calc(var(--L) * 2); overflow-wrap: break-word; text-wrap: pretty; }
  .doc * { margin: 0; }
  .doc > * + *, .doc blockquote > * + * { margin-top: var(--L); }   /* a blank rule between blocks */
  .doc :is(h2, hr, .lead) + * { margin-top: 0; }                   /* but none under a heading, squiggle or lead-in */
  .doc h2 { font: 400 44px/calc(var(--L) * 2) var(--hand); position: relative; top: 11px; }
  .doc ul, .doc ol { padding-left: 1.4em; }
  .doc ul { list-style-type: '\\2013  '; }
  .doc li::marker { color: var(--ink-3); }
  .doc ol { list-style: none; }  /* numbered by hand; out of flow, so the number can't stretch a line */
  .doc ol > li::before { content: counter(list-item) '.'; position: absolute; margin-left: -.9em; font: 25px/var(--L) var(--hand); color: var(--ink-2); }
  .doc blockquote { padding-left: 1.6em; color: var(--ink-2); position: relative; }
  .doc blockquote::before {  /* a thin pencil line down the side */
    content: ''; position: absolute; left: .45em; top: 2px; bottom: 6px; width: 4px;
    background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 100' preserveAspectRatio='none'><path d='M2 0C2.9 22 1.3 41 2.2 63S1.5 88 2 100' fill='none' stroke='%2397938a' stroke-width='1.1' stroke-linecap='round' vector-effect='non-scaling-stroke'/></svg>") 0 0 / 100% 100% no-repeat;
  }
  .doc code { font: 15px/1 ui-monospace, 'SF Mono', Menlo, Consolas, monospace; color: var(--ink-2); }
  .doc hr {  /* a short squiggle on the rule */
    border: 0; height: var(--L);
    background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='90' height='10'><path d='M2 6c5-5 9-5 13 0s8 5 13 0 9-5 13 0 8 5 13 0 9-5 13 0 8 4 13 0' fill='none' stroke='%2397938a' stroke-width='1.3' stroke-linecap='round'/></svg>") 0 calc(100% - var(--lift) - 2px) / 90px 10px no-repeat;
  }
  @media (max-width: 720px) {
    .doc { margin-top: var(--L); }
    .doc h2 { font-size: 38px; top: 12px; }
    .doc ul, .doc ol { padding-left: 1.2em; }
    .doc blockquote { padding-left: 1.3em; }
    .doc blockquote::before { left: .3em; }
  }
</style>
</head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <!-- graphite grain + a hair of wobble, for the title -->
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
    <p class="intro">how <a href="index.html">phy's fwiends</a> are drawn, and how their page behaves.</p>
  </header>

  <article class="doc">
$body
  </article>

  <footer>
    <ul>
      <li>characters belong to the people named under them</li>
      <li><a href="index.html">back to the fwiends</a></li>
      <li>source: <a href="https://github.com/rareone0602/phy_friends">github.com/rareone0602/phy_friends</a></li>
    </ul>
  </footer>
</main>
</body>
</html>
""")


def style_page(src=ROOT / 'STYLE.md', out=ROOT / 'style.html'):
    """Write STYLE.md out as style.html. Its # title becomes the <title>; the page's
    own handwritten h1 and intro come from STYLE_PAGE."""
    lines = Path(src).read_text(encoding='utf-8').splitlines()
    title = lines.pop(0)[2:].strip() if lines and lines[0].startswith('# ') else "phy's fwiends style guide"
    Path(out).write_text(STYLE_PAGE.substitute(title=html.escape(title, quote=False), body=md_blocks(lines)), encoding='utf-8')
    return out


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

    sub.add_parser('style', help='write STYLE.md out as style.html')

    a = ap.parse_args(argv)
    EXTRA[:] = getattr(a, 'extra', [])
    if a.cmd == 'list':
        for n in characters():
            ex = examples(n)
            print(f'{n:16s} ' + (f'examples: {", ".join(ex)}' if ex else 'no examples'))
    elif a.cmd == 'render':
        out = a.out or OUT / a.name / f'{a.view}.png'
        render(a.name, out, view=a.view, pose=json.loads(a.pose), size=a.size, bg=not a.no_bg)
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


if __name__ == '__main__':
    main()
