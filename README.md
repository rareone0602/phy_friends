# phy's fwiends

A tiny factory for characters in coloured pencil. The repository and the code
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

The repository is laid out by what each part is for:

```
index.html  style.html  specimen.html    the site (GitHub Pages serves it from the root)
site/          the site's stylesheets, icons, link preview and title strokes
src/           the library: what a friend is and does
film/          the film kit: friends together on a sheet, played in a page or filmed
characters/    the fwiends: a spec each, and the cast
demo/          one-off pieces, each in a folder of its own
design/        page mockups, and the candidates not taken
tools/         the command line, and the scripts that rebuild the site's assets
test/          the in-browser tests
figures/       the house style for charts and diagrams
out/           generated output (git-ignored)
```

| path | what |
|---|---|
| `index.html`, `style.html`, `specimen.html`, `site/` | the site: the gallery; the style guide, made from `STYLE.md` and `FWIENDS.md` by `pf.py style`; and the specimen, every part of a page working. `site/notebook.css` is the paper, `site/pencil.css` everything drawn on it, and `site/title-pen.js` the strokes with which the gallery's title writes itself |
| `src/phyfriends.js` | core: shape generators, spec registry, renderer, pose rig |
| `src/anim.js` | animation clips, composition, a browser player, and the hop by which a friend gets about |
| `src/pen.js` | text that writes itself stroke by stroke, as the gallery's title does |
| `src/cast.js` | the rules for friends together: who knows whom, who may speak, and what they may do together |
| `film/scene.js` | scenes: several friends on one sheet of ruled paper, with props, handwriting and a camera, for films and games |
| `film/film.js`, `film/film.css` | a film on a page: it plays once when it scrolls into view, with a button to play it again, and boils as it plays; the stage, and the credits and controls under it |
| `characters/cast.js` | the cast itself: each friend's name, pronoun, owner's credit and the media the owner has agreed to, and which owners know each other |
| `characters/<name>/` | one folder per character: the spec `<name>.js` (`PhyFriends.define(name, spec)`), `examples/`, and `backup/` for the versions not taken |
| `demo/` | one-off pieces, each in its own folder: `index.html` lists the films (`roll-call/`, `card/`), which are made with the film kit |
| `design/` | page mockups: `index.html` lists them (C, the notebook, became the real page; A and B are kept as backups in `design/backup/`, with `roll-call-rise.html`, the gallery's roll call not taken) |
| `tools/pf.py` | CLI: render stills, compare with a reference, export animations, film pages and run the tests (headless Chrome + ffmpeg) |
| `tools/cdp.py` | a small client for the Chrome DevTools Protocol, with which `pf.py` drives headless Chrome for films and tests |
| `tools/site_assets.py` | rebuilds the site's icons and link preview after a character changes |
| `tools/title_pen.py` | derives the strokes that write the gallery's title (`site/title-pen.js`) |
| `tools/shoot.py` | takes a screenshot of a page, such as a mockup, through a real `file://` address |
| `tools/animate.html` | a page for trying clips on every friend, live |
| `test/` | in-browser tests: `index.html` loads the library, `harness.js` and every `*.test.js`; `film-stub.html` is the smallest page `pf.py film` can film |
| `figures/` | matplotlib styles for charts in the house style; `palette.py`, which derives the data colours from the fwiends (needs numpy); `phy-diagram.sty`, for a paper's TikZ diagram (`diagram.tex` is an example); and `fonts/`, the house face, Shantell Sans, with its licence |
| `STYLE.md` | phy's style guide: the house style for everything phy makes, written to be copied into other projects |
| `FWIENDS.md` | what only this project adds to it: the gallery page, the rules for drawing a friend, and the rules for scenes |
| `out/` | generated output, git-ignored: `out/<name>/` per character (stills, `compare/`, `anim/`), `out/design/` for page mockups, `out/scratch/` for experiments |
| `LICENSE` | the GNU Affero General Public License, version 3, which covers everything here but the fwiends and the font (see [Licence](#licence)) |

New work goes where it will be used from:
- **What every friend can do goes in `src/`**: a new module is a classic script that
  adds to `PhyFriends`, loads after `src/anim.js`, and has its tests in `test/`.
  It works from the parts that every friend drawn to the house template has (the
  eyes, ears, blush, mouth, body and tail), so it suits all of them. Claude keeps
  every rule but the shape (FWIENDS.md, "Claude, the exception"), so a module
  may leave it out.
- **What every film needs goes in `film/`**, and `pf.py film` is how a film is
  recorded. A film's own script, props and soundtrack stay in its folder under
  `demo/`.
- **A one-off goes in `demo/`**, in a folder of its own. It may use anything in
  the library or the film kit, but nothing outside `demo/` may use it, so any
  one-off can be deleted without breaking the rest.

## Characters and examples

```
characters/
  howdi/
    howdi.js            the spec, with views.ref lining the render up with ref.jpg
    examples/
      ref.jpg           an early close-up of Howdi in the house template
```

An example is any picture of the character: the original drawing, a sheet, a
sticker, another artist's take. Drop it into `examples/` under a short name, and
give the spec a view **of the same name** to line the render up with it (a
camera, plus the pose it was drawn in). `pf.py compare <name>` then checks every
example that has a view and skips the rest, so a picture can wait in the folder
until its view is written. For a sheet with several figures, crop each one into
its own file (`sheet-front.png`, `sheet-back.png`), each with its own view.

Git ignores `examples/`: the pictures belong to their artists, so they stay on
the machine that drew the character (the few committed before that rule are
still in the repository). Material that should never leave that machine, such
as photos of the real pet behind a fursona, goes in `characters/<name>/private/`,
which git ignores too.

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
  palette: { bg, fur, face, hair, earInner, stripe, eye, blush, chest, tailTip },  // Shades such as furShade are derived
  head:  { cx, cy, rx, ry, fluff: [{ from, to, n, len, lean, sym }] },  // Fluffy ellipse
  face:  { ... same as head ... },                                     // Pale mask
  ears:  { base, angle, width, length, lean, tip, inner, stripes, right: {...overrides} },
  hair:  { cx, cy, rx, ry, valley, tips: [[x, y, b1, b2], ...] },      // Spiky star
  eyes:  { x, y, w, h, shape: 'pill' | 'dot', tilt, shine, range, stroke, arc, right: { color, shine } },  // shine: a highlight, or a list of marks (iris, highlight); right: the right eye's own color
  blush: { x, y, rx, ry, tilt },                                      // tilt > 0 raises the outer ends
  mouth: { x, y, size, shape, fang, tongue },                         // shape: the default mouth
  body:  { ...fluffy ellipse... },
  tail:  { base, angle, length, width, curl, bend, taper, root, fluff, tip: { at, n, len, color } },  // Optional
  extras: [{ on: 'body', clip: true, fill: 'chestShade', ...shape }],  // Markings and the shade layer; on: 'ears' means both ears
  order: ['earL', 'earR', 'base', 'face', 'blush', 'eyes', 'mouth', 'hair'],
  rig:   { ground, neck, turn },                                       // ground: where the paws touch (default 120)
  views: { ref: { w, h, x, y, scale, rotate, pose } },
  extends: 'other-character',                                          // Variants
});
```

Every character file is laid out the same way, so two specs read side by side:
- a one-line header comment naming the character and its reference pictures;
- the keys in the order above;
- extras grouped by the part they sit on (`base`, `face`, `ears`, `hair`, `body`, `tail`), each with a short comment saying what it depicts;
- `views` last, with `ref` first.

Fwiends share one scale: a reference drawn in the house template (a 1254 px close-up, the head tipped 20°) is matched at `scale: 5.5`, so the eyes come out the same size in every spec.

Shades are derived (the one-layer rule: STYLE.md, principle 5, and FWIENDS.md): any `<name>Shade` a spec uses and leaves out of
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

## The pencil

`render` and `mount` colour every character in with coloured pencil (STYLE.md
§9): one mask over the whole drawing lets the paper show through in diagonal
strokes, fine tooth and patches of lighter pressure. There are no outlines.
The mask is measured in the picture's own units rather than head units,
since a pencil is the same size however large the drawing; it stays put while
the character breathes or turns (in a scene, a character that travels takes its
paper with it, as a figure cut out of paper would), and, being an image, costs a browser one draw rather
than one per frame. A render with a background of its own lays a sheet of
paper, cut to the character's outline, under the drawing, so the pencil shows
paper rather than the background. `{ pencil: false }` draws the flat shapes
alone, for an icon too small to hold the texture or for matching a flat
reference picture.

## Scenes

`film/scene.js` puts several friends on one sheet of ruled paper, measured in
head units (a rule every 54, so a friend stands five rules tall). Everything in
it is a cue at a time on the scene's clock, and a frame depends on the time
alone, so a film plays in a page and `pf.py film` films it frame by frame from
the same script, while a game adds cues as it goes.

```js
const scene = PhyFriends.scene.create(document.querySelector('#stage'), { width: 1600, height: 900 });
const phy = scene.add('phy', { x: 520 }), yuda = scene.add('yuda', { x: 1100 });
yuda.enter({ from: 'right', at: 0.5 });
phy.look(yuda, { at: 1 }).say('hi, Yuda', { to: yuda, at: 1.2 });
yuda.emote('♪', { at: 2 });
if (!scene.film({ duration: 4 })) scene.play();   // Filmed by pf.py film; played live otherwise.
```

Friends hop, look, show marks and play clips; phy, the host, may also speak.
`src/cast.js` holds the rules for friends together (FWIENDS.md, "scenes"), and
the scene enforces them: two friends are strangers unless `characters/cast.js`
says their owners know each other, strangers keep a strip of paper between them
and neither talk to nor hand things to each other, and only a friend with a
voice says words. A broken rule throws, saying what would allow it. Each frame
credits the owners of the friends in it, and a friend whose owner has not agreed
to films or games marks the scene "draft". A game that runs only in the page may
turn the frame's credits off (`credits: false`) and link each owner in the
page's small print instead; a film keeps them, since they travel with the video.
`paper: false` leaves the scene's ruled paper out so the page's own shows
through, and `write(text, { graphite: true })` is for a title only (STYLE.md
§6); `write(text, { pen: TITLE_PEN })` writes the gallery's title stroke by
stroke (`src/pen.js`). A page loads, in order, `src/phyfriends.js`, the
characters, `src/anim.js`, `src/cast.js`, `characters/cast.js` and
`film/scene.js`, with `src/pen.js` and `site/title-pen.js` before the scene where
a title writes itself. A page that shows a film also loads `film/film.css` after
the site's stylesheets and `film/film.js` after the scene. The films in `demo/`
are built this way: `python3 tools/pf.py film demo/roll-call/index.html --draft
-o out/roll-call.mp4` films one while its friends' owners have yet to agree to
video.

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
python3 tools/pf.py list                                    # Characters and their examples
python3 tools/pf.py render howdi --size 512                 # out/howdi/portrait.png
python3 tools/pf.py render howdi --pose '{"eyes":"happy","mouth":"w"}' -o out/howdi/happy.png
python3 tools/pf.py render howdi --flat                     # The flat shapes, without the pencil
python3 tools/pf.py compare howdi                           # Every example: out/howdi/compare/ref.png + ref-diff.png
python3 tools/pf.py compare howdi --view ref --region 0,600,700,1254   # One example, metrics and a zoomed crop for a box
python3 tools/pf.py anim howdi --clip idle                  # out/howdi/anim/idle.gif
python3 tools/pf.py render howdi --with out/scratch/mine.js # Here mine.js redefines howdi, to try a working copy
python3 tools/pf.py film test/film-stub.html -o out/scratch/film/stub.mp4 --sheet   # A page, frame by frame
python3 tools/pf.py film test/film-stub.html --at 1 -o out/scratch/film/still.png  # One still from it
python3 tools/pf.py test                                    # The in-browser tests in test/index.html
```

`compare` snaps every pixel of the reference and the render to the nearest
palette colour and paints the disagreements red in `compare/<example>-diff.png`; it prints
the mismatch on a 4×4 grid and the per-colour overlap (IoU), which is a far
better guide than the mean pixel error.

`film` films any page that keeps the film contract (the docstring of `film` in
`tools/pf.py`): opened with `?film`, the page fills the window, and `pf.py` seeks
it to each frame's time in turn and takes a screenshot. The video is therefore
frame-exact however slow the machine, and filming a page twice gives the same
frames, byte for byte. A film with a friend whose owner has not agreed to video
is refused unless `--draft` is given, in which case the page marks it as a draft.

`test` runs `test/index.html` in headless Chrome, prints each failure, and exits
non-zero on a failure or a page error. The page also works opened by hand.

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

## Licence

Copyright © 2026 phy.

Everything here, bar the two exceptions below, is under the GNU Affero General
Public License, version 3 only (`LICENSE`; SPDX `AGPL-3.0-only`), the strictest
of the GNU licences. Anyone who passes on a copy, changed or not, must pass on
its source under the same terms, and anyone who runs a changed copy that people
use over a network (a website, say) must offer those people its source too.
"Version 3 only" means that no later version of the licence applies.

The exceptions:
- **The fwiends.** Each character (its look, its name, everything in its folder
  under `characters/` and every picture of it, such as the site's icons and link
  preview) belongs to whoever is named under it in the gallery, and the licence
  gives no rights to it. That goes for phy's own, and for Claude's, whose figure
  is Claude Code's mascot and belongs to Anthropic.
- **Shantell Sans** (`figures/fonts/`) is under the SIL Open Font License, whose
  text sits next to it.
