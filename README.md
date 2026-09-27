# phy's friends

A tiny factory for flat-vector chibi characters. The repository and the code
are named `phy_friends`.

Images like `characters/howdi/examples/ref.jpg` have very low Kolmogorov complexity: a few
ellipses, some fur tufts, a spiky hair mop, two pill eyes, and blush. So instead
of storing pixels, a character here is a ~100-line **spec** (a palette plus a
handful of shape parameters). The library turns spec + pose into SVG, which makes
characters trivially scalable, recolourable, animatable, and able to look at
your cursor.

```
characters/howdi/howdi.js ──►  PhyFriends.render(spec, {view, pose})  ──►  SVG
   (data, ~100 lines)           PhyFriends.mount(el, spec).setPose({...})   (live rig)
                                PhyFriends.anim.*                        (clips)
```

No build step and no dependencies: `src/phyfriends.js` is a classic script
(`window.PhyFriends`, or CommonJS), so pages work straight from `file://` or
GitHub Pages.

## Layout

| path | what |
|---|---|
| `src/phyfriends.js` | core: shape generators, spec registry, renderer, pose rig |
| `src/anim.js` | animation clips, composition, and a browser player |
| `characters/<name>/` | one folder per character: the spec `<name>.js` (`PhyFriends.define(name, spec)`) and `examples/` |
| `tools/pf.py` | CLI: render stills, compare with a reference, and export animations (headless Chrome + ffmpeg) |
| `index.html`, `style.html`, `site/` | the site (GitHub Pages): the gallery, and the style guide made from `STYLE.md` by `pf.py style` |
| `demo/` | local dev pages |
| `design/` | design scratch: `index.html` lists the mockups (C, the notebook, became the real page; A and B are kept as backups in `design/backup/`), `shoot.py` takes page screenshots, and `site_assets.py` rebuilds the site's icons and link preview after a character changes |
| `out/` | generated output, git-ignored: `out/<name>/` per character (stills, `compare/`, `anim/`), `out/design/` for page mockups, `out/scratch/` for experiments |

## Characters and examples

```
characters/
  howdi/
    howdi.js            the spec, with views.ref lining the render up with ref.jpg
    examples/
      ref.jpg           the picture Howdi is reproduced from
```

An example is any picture of the character: the original drawing, a sheet, a
sticker, another artist's take. Drop it into `examples/` under a short name, and
give the spec a view **of the same name** to line the render up with it (a
camera, plus the pose it was drawn in). `pf.py compare <name>` then checks every
example that has a view and skips the rest, so a picture can wait in the folder
until its view is written. For a sheet with several figures, crop each one into
its own file (`sheet-front.png`, `sheet-back.png`), each with its own view.

Material that informs a design but should not be published, such as photos of
the real pet behind a fursona, goes in `characters/<name>/private/`, which git
ignores.

## Head space

Origin is between the eyes; +x is right and +y is down. The head is about 200
units wide. Angles are in degrees with 0 = right and 90 = down. A **view** (a
camera: `{w, h, x, y, scale, rotate}`) maps head space to pixels. `portrait`
(512², whole character) is the default, and a spec can add its own views, e.g.
Howdi's `ref`, which matches the reference crop. A view may also carry a
`pose`, the one its reference was drawn in (Howdi's `ref` has the ears relaxed
outwards); a render's own pose overrides it field by field.

## Spec

```js
PhyFriends.define('name', {
  palette: { bg, fur, face, hair, earInner, stripe, eye, blush, chest, tailTip },  // furShade etc. are derived
  head:  { cx, cy, rx, ry, fluff: [{ from, to, n, len, lean, sym }] },  // fluffy ellipse
  face:  { ... same as head ... },                                     // pale mask
  ears:  { base, angle, width, length, lean, tip, inner, stripes, right: {...overrides} },
  hair:  { cx, cy, rx, ry, valley, tips: [[x, y, b1, b2], ...] },      // spiky star
  eyes:  { x, y, w, h, shape: 'pill' | 'dot', tilt, shine, range, stroke, arc, right: { color, shine } },  // shine: a glint, or a list of marks (iris, glint); right: the right eye's own colour
  blush: { x, y, rx, ry, tilt },                                      // tilt > 0 raises the outer ends
  mouth: { x, y, size, shape, fang, tongue },                         // shape: the default mouth
  body:  { ...fluffy ellipse... },
  tail:  { base, angle, length, width, curl, bend, taper, root, fluff, tip: { at, n, len, color } },  // optional
  extras: [{ on: 'body', clip: true, fill: 'chestShade', ...shape }],  // markings, the shade layer; on: 'ears' = both ears
  order: ['earL', 'earR', 'base', 'face', 'blush', 'eyes', 'mouth', 'hair'],
  rig:   { ground, neck, turn },                                       // ground: where the paws touch (default 120)
  views: { ref: { w, h, x, y, scale, rotate, pose } },
  extends: 'other-character',                                          // variants
});
```

Every character file is laid out the same way, so two specs read side by side:
- a one-line header comment naming the character and its reference pictures;
- the keys in the order above;
- extras grouped by the part they sit on (`base`, `face`, `ears`, `hair`, `body`, `tail`), each with a short comment saying what it depicts;
- `views` last, with `ref` first.

Friends share one scale: a reference drawn in the house template (a 1254 px close-up, the head tipped 20°) is matched at `scale: 5.5`, so the eyes come out the same size in every spec.

Shades are derived (STYLE.md §6): any `<name>Shade` a spec uses and leaves out of
its palette is `<name>` one fixed step darker (`PhyFriends.shadeOf`: CIELAB L* −10,
its hue a little richer, near-whites leaning to lavender), so every friend's one
shade layer matches. Set one by hand only where the derived one looks wrong.
`PhyFriends.palette(spec)` lists a spec's colours with the shades it uses.

Shape primitives (`PhyFriends.shapes`):

- **fluffy**: an ellipse whose outline grows fur tufts over angle ranges
  (`n` tufts, `len`, `lean`, jitter, and `sym` to mirror left/right).
  Seeded, so it is deterministic. For sawtooth shingles, cut notches in
  rather than growing bumps out: `len` ~0, `depth` ~0.1, a `lean` that puts
  each tip next to a valley, a convex long side (`b1` or `b2` ~ -15) and a
  straight notch (~0). A negative `len` pulls a tip inward, so an `n: 1`
  range can flatten an arc. Ranges must not overlap.
- **star**: a hair mop. Absolute tip points; valleys sit on a scaled base
  ellipse between tips, and each edge can bend concave (`b > 0`) or convex (`b < 0`).
- **ear**: a rounded triangle in local space with an inner ear and stripe bands
  (clipped). The right ear mirrors the left unless overridden. With
  `inner.front` the inner ear is drawn in front of the head, so it can run down
  over the head fur while the rest of the ear stays behind.
- **tail**: an optional bushy plume drawn behind the body. In local space it is
  a fluffy ellipse standing on its base (so `fluff` angles run 270 at the tip to
  90 at the base) and bent into a curve. `curl` swings the tip outward (or
  inward if negative) by sliding it sideways. `bend` (degrees) turns the spine
  itself, outward or inward if negative, and keeps the plume's thickness, so a
  tail can curl right over into a crescent (a tail with `bend` has no curl
  unless it sets one). `taper` and `root` (0..1) pinch the two ends. `tip`
  paints a clipped marking over the last part of the length, from `at` (a
  fraction) to the end. Its edge is `n` tufts pointing back at the base. The
  tail pivots at `base` and leans `angle` degrees away from the body's centre
  line; a base on the left is mirrored. Extras with `on: 'tail'` are drawn on
  the straight tail: fluffies bend with it, while nodes and ellipses keep their
  shape and move and turn with the part of the tail they sit on. The tail is
  left out unless the spec has a `tail`, and `tail: {}` gives the default plume.
- **nodes**: raw `[x, y, corner, bend]` escape hatch. `round: 0.2` on the shape
  softens every corner into an arc (cut at that fraction of the shorter edge).
- **polys**: several rounded polygons in one shape, for crumbs and spots:
  `polys: [[x, y, r, sides, rot, aspect], ...]`. `r` reaches the corners, `rot`
  turns it (degrees), and `aspect` < 1 squashes it across its first corner (a
  square becomes a diamond). The shape's `round` (default 0.2) softens the
  corners and `bend` (default -6) bows the edges out. On the tail, each polygon
  rides the curve on its own.

## Pose

Every field is optional:

```js
{ x, y, squash, tilt, headX, headY, turnX, turnY, lookX, lookY, blink, widen, earL, earR, hair, tail, blush,
  eyes: 'open' | 'happy' | 'closed' | 'squint', eyeL, eyeR, mouth: 'none' | 'w' | 'smile' | 'o' | 'v' | 'open' }
```

`tail` wags the tail about its base, in degrees: + swings the tip outward and
− tucks it in behind the body. The clips keep it within about ±12°, and
`PhyFriends.anim` clamps it to ±45°.

Turning is faked with per-layer parallax: ears and the tail slide back, while the
face, eyes and hair slide forward. That gives a convincing 2.5D head turn for
look-at effects.

```js
const rig = PhyFriends.mount(document.querySelector('#box'), 'howdi');
rig.setPose({ lookX: 0.8, turnX: 0.5, eyes: 'happy' });
```

## CLI

```sh
python3 tools/pf.py list                                    # characters and their examples
python3 tools/pf.py render howdi --size 512                 # out/howdi/portrait.png
python3 tools/pf.py render howdi --pose '{"eyes":"happy","mouth":"w"}' -o out/howdi/happy.png
python3 tools/pf.py compare howdi                           # every example: out/howdi/compare/ref.png + ref-diff.png
python3 tools/pf.py compare howdi --view ref --region 0,600,700,1254   # one example, metrics and a zoomed crop for a box
python3 tools/pf.py anim howdi --clip idle                  # out/howdi/anim/idle.gif
python3 tools/pf.py render howdi --with out/scratch/mine.js # mine.js redefines howdi: try a working copy
```

`compare` snaps every pixel of the reference and the render to the nearest
palette colour and paints the disagreements red in `compare/<example>-diff.png`; it prints
the mismatch on a 4×4 grid and the per-colour overlap (IoU), which is a far
better guide than the mean pixel error.

The CLI needs Google Chrome (override the path with `$CHROME`), Pillow, and
ffmpeg for video.

## Workflows

1. **Reproduce an image**: make `characters/<name>/`, put the picture in its
   `examples/` as `ref.jpg`, write `<name>.js` with a `views.ref` camera
   matching the crop, and iterate with `pf.py compare <name>`. A new character
   also needs a `<script>` tag in any page that shows it.
2. **Reproduce a design sheet**: crop each figure into `examples/`, add a view
   per figure, and compare against all of them at once; the portrait view is
   the canonical one.
3. **Animate**: pick or compose clips from `PhyFriends.anim` and export with
   `pf.py anim`, or play them live in a page.
