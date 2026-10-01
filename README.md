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
                                PhyFriends.emotion.*                     (feelings)
                                PhyFriends.live.stage().add(el, name)    (alive on a page)
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
| `index.html`, `style.html`, `specimen.html`, `site/` | the site: the gallery; the style guide, made from `STYLE.md` and `FWIENDS.md` by `pf.py style`; and the specimen, every part of a page working, with the dial (`--informal`) to turn. `site/notebook.css` is the paper, `site/pencil.css` everything drawn on it, and `site/title-pen.js` the strokes with which the gallery's title writes itself |
| `src/phyfriends.js` | core: shape generators, spec registry, renderer, pose rig, seated and standing |
| `src/anim.js` | animation: clips of movement (idle, hop, bounce, nod; and for a friend standing, walk, wave, cheer, jump, dance, stretch, point, and standing up and sitting down), composition, stacks of timed layers, a browser player, and the hop and the walk by which a friend gets about |
| `src/emotion.js` | feelings: happy, content, shy, proud, surprised, scared, curious, sleepy, asleep, sad and cross, each as a face, a reaction and a held loop, for every friend drawn on the house template; a friend standing adds its arms and a gesture |
| `src/live.js` | friends alive on an ordinary page, as the gallery and the specimen's portrait are: one clock for all of them, the idle clip, following the pointer, a hi, and the feelings a visitor stirs (shy, content, curious, asleep) |
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
| `tools/animate.html` | a page for trying clips and feelings on every friend, live, seated or standing |
| `tools/feelings.html` | a review sheet of every friend in every feeling, still or playing, seated or standing (`?stand`) |
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
the machine that drew the character. Material that should never leave that
machine, such as photos of the real pet behind a fursona, goes in
`characters/<name>/private/`, which git ignores too.

## Head space

Origin is between the eyes; +x is right and +y is down. The head is about 200
units wide. Angles are in degrees with 0 = right and 90 = down. A **view** (a
camera: `{w, h, x, y, scale, rotate}`) maps head space to pixels. `portrait`
(512², whole character) is the default, and a spec can add its own views, e.g.
Howdi's `ref`, which matches the reference crop. A view may also carry a
`pose`, the one its reference was drawn in (Howdi's `ref` has the ears relaxed
outwards); a render's own pose overrides it field by field. The view `stand`,
built in unless a spec has its own, is the portrait of the friend standing,
drawn a little smaller so that its ears stay in the square.

## Standing

A friend sits unless its pose says `stance: 'stand'`. Standing, it keeps its
seated body, with every marking and garment on it, and stands that body on two
short legs, with two short arms hanging from its sides. The limbs are a stuffed
toy's: soft, straight hoses with round ends, bent along an arc when a pose bends
them, so that they never show a joint. An arm keeps its length; a leg squashes
or stretches a little, as stuffing does. Unless a spec places them, the limbs
are fitted to its body (`PhyFriends.STAND_FIT`): the legs show 22 units below
the body's bottom, from hips tucked under it, and each arm hangs from high on
the body's side, just inside it, and well out from the side below it, so that
its paw shows past the body (phy's pick until the final numbers arrive). The
feet touch the figure's own ground (`stand.ground`, the body's bottom plus 22,
about 153 for most friends), and the rig lifts the friend by the difference
(`PhyFriends.standLift(spec)`), so that its feet stand where its seated paws
did: the floor stays put. Any part a spec leaves out comes from
`PhyFriends.STAND_DEFAULT`, and a spec may tune the fit for itself
(`stand.fit`, any of `STAND_FIT`'s numbers), so most give only their seated
paws and feet (`stand.seat`) and their limbs' colours and bands.
`PhyFriends.standFor(spec)` returns a spec's figure with all of this filled in.

A friend is one figure, which sits and stands on the same limbs. Sitting is
the bottom of its crouch: its hips drop by the lift and its limbs fold.
Standing is the same figure with its limbs unfolded, and every height between
is a pose: the pose's `rise` is added to its stance (0 for `sit`, 1 for
`stand`) and the sum held between 0 and 1, so an animation eases `rise` to
stand a friend up or sit it down, and can catch it halfway. Nothing appears or
vanishes on the way, and `PhyFriends.riseOf(spec, pose)` says how far a pose
has raised its head.

The seat (`stand.seat`) is the friend's own seated drawing: `seat.paw` and
`seat.foot` are the forepaw and the hind foot it sits with, the left ones, as
ellipses in head space (`{ cx, cy, rx, ry, rot }`, with `cx` measured outwards
from the centre line), and `seat.right` holds overrides for the right ones.
Seated, each paw and foot is exactly that ellipse. Each arm hangs straight down
to its paw in front of the body, sleeves and all, from the middle of the body's
height (`STAND_FIT.forelegs`), as a seated animal's forelegs do, and each leg's
hose is hidden behind the body; as the friend rises, the ellipse moves, turns
and stretches into the standing paw or foot, the arm swings up to its shoulder
and the leg unfolds out of the foot. A seated paw tall enough to be a foreleg
itself, as Terry's is, takes `seat.arms: { length: 0 }`, which folds the arm
into it. A foot that the seated drawing does not show is left out of `seat`,
and tucks under the body. Extras on `paws` and `feet` (or `pawL`, `footR`…) are
drawn in the seated paw's or foot's own space, with its centre on the origin
and +x towards the centre line, so they move and scale with it; one marked
`sole: true`, such as a pad on a sole that faces us only while the friend sits,
flattens towards the foot's lower edge as it rises, to nothing standing. Seated
feet lie in front of the body, with any band that reaches them, and the leg
hoses behind it. Without `seat.paw` the limbs fold instead towards
`STAND_FIT`'s places (the feet beside the base, the paws reaching for the
ground in front), and `seat.arms` and `seat.legs` override the folded limbs'
numbers. So a seated drawing's paws and feet on the ground belong in `seat`,
not in the body's extras, and their markings in extras on `paws` and
`feet`. A body drawn as an onigiri (`body.onigiri`, see the shapes below),
narrow under the chin and broad and flat at the base, reads as a seated friend
does and stands just as well.

An arm is posed by its angles; a leg reaches from its hip to its foot, which
stays planted while the hips drop (`crouch`), lean (`lean`) or the foot steps
up (`stepL`). A plush leg (the default, `knees: false`) squashes to take up the
slack, where one with knees (`knees: true`) bows out; a leg that cannot reach
stretches a little before its foot leaves the ground.

From the back, a friend is drawn as its body with its clothes, its scarf, its
head, whose chin lies over the scarf and the collar, and then its arms, in
front of all of them, so that a paw raised to the face or held at the chest
shows. A ruff or bib of fur round the neck, or a scarf, goes in the extras on
`scarf`; other clothes, a hood lying round the neck included, stay on the body,
under the arms, and a sleeve takes its cloth's house shade, so that it shows
against the garment's front. Only the shoulder end of each arm
(`STAND_FIT.tuck`, 0.6 of its length) tucks under the scarf and the head, so
the arms come out from under the fur; the paws never do. Seated, the arms hang
in front of the scarf, a bib of fur included, and the tuck fades in as the
friend rises, fully by halfway, so that they slide under it. The pose's
`over` draws an arm whole in front of everything, shoulder too. Claude stands
already, on the glyphs' four legs, so its spec sets `stand: false` and it keeps
its shape in either stance, as does any spec without a body, or with one that
is not an ellipse, on which the limbs could not be fitted.

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
  body:  { ...fluffy ellipse..., onigiri },                            // onigiri: a rice ball rather than an ellipse (0..1, or { taper, square })
  tail:  { base, angle, length, width, curl, bend, taper, root, fluff, tip: { at, n, len, color } },  // Optional
  stand: {                                                             // The standing figure: the seated body on two legs (false: never stands); any part left out takes the default, fitted to the body
    seat:  { paw, foot, right: { paw, foot }, arms, legs },            // The seated forepaw and hind foot, ellipses { cx, cy, rx, ry, rot }, down to which the arms hang and into which the legs fold (left out: the fitted fold); arms and legs override the folded limbs' numbers (arms: { length: 0 } folds an arm into its paw)
    fit,                                                               // Any of STAND_FIT's numbers, for this friend
    ground, hips,                                                      // Where the feet touch, and the pivot of a lean
    arms:  { shoulder, angle, bend, length, width, taper, color, paw: { cx, cy, rx, ry, color }, bands: [{ from, to, color, grow, teeth, depth }], right: {...overrides} },
    legs:  { hip, spread, ankle, bow, knees, width, taper, color, foot: { cx, cy, rx, ry, color }, bands, right },  // A paw or foot the seat leaves out may be any shape
    tail:  { base, angle },                                            // The tail's place while standing
  },
  extras: [{ on: 'body', clip: true, fill: 'chestShade', ...shape }],  // Markings and the shade layer; on: 'ears' means both ears, 'paws' and 'feet' both of those
  // An extra with show: 'name' is drawn only while the pose's show lists that name (a prop); one on 'ground' stays put as the friend hops
  // An extra on 'paws' or 'feet' with sole: true faces us only while the friend sits, and flattens as it rises
  order: ['earL', 'earR', 'base', 'face', 'blush', 'eyes', 'mouth', 'hair'],
  rig:   { ground, neck, turn },                                       // ground: where the paws touch (default 120)
  emotions: false,                                                     // Only off the house template (Claude): no feelings
  routine: { says, saysStill, duration, keys: { field: [[t, value, ease]] } },  // Its third hi plays it, if it shows no feelings (Claude's laptop)
  views: { ref: { w, h, x, y, scale, rotate, pose } },
  extends: 'other-character',                                          // Variants
});
```

Every character file is laid out the same way, so two specs read side by side:
- a one-line header comment naming the character and its reference pictures;
- the keys in the order above;
- extras grouped by the part they sit on (`base`, `face`, `ears`, `hair`, `body`, `scarf`, `tail`, `paws`, `feet`, `ground`), each with a short comment saying what it depicts;
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
  range can flatten an arc. Ranges must not overlap. With `onigiri` (0 to 1)
  the ellipse becomes a rice ball by that much: it narrows towards its top
  and squares off into a broad, flat base with round corners, resting where
  the ellipse's bottom did, and its tufts keep their angles. `onigiri: 1` is
  `PhyFriends.ONIGIRI`'s rice ball (`{ taper: 0.6, square: 2 }`), and
  `onigiri: { taper, square }` gives a rice ball its own: how much narrower
  its top is, and how far its base squares off. `outlineOf`
  gives the outline a fluffy grows its tufts on, and `reachAt` how far it
  reaches either side at a given height.
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
- **limb**: an arm or a leg of the standing figure: a hose that leaves its
  shoulder or hip at an angle and turns steadily along an arc
  (`limbArc`), as wide as `width` at the root and narrower by `taper` at the
  end, which is round. Points are given on one side of the centre line
  (`hip: [27, 117]` is 27 either side), and the right limb mirrors the left
  unless `right` overrides it. `bands` colour stretches of the limb, between
  fractions `from` and `to` of its length: a sleeve, a cuff, a sock, a stripe.
  A band's `grow` makes it stand that far proud of the limb on each side, as
  cloth does, and its upper edge may be cut into `teeth` points `depth` deep.
  The standing paw and foot are ellipses in their own space, with the origin at
  the end of the limb, +y carrying on along it (down, for a foot) and +x towards
  the centre line, into which the seated ones (`seat`) rise; one that the seat
  leaves out may be any shape there. Extras on `paws` or `feet` are drawn in the
  seated paw's or foot's space, on both (see [Standing](#standing)).
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

Friends hop, look, show marks and feelings (`yuda.feel('surprised', { at: 2 })`,
from `src/emotion.js`, with its mark) and play clips; phy, the host, may also
speak. A friend sits unless it is added standing (`scene.add('yuda', { stance:
'stand' })`) or stands up on cue (`yuda.stand({ at: 1 })`, and `sit()` to sit
down again). It rises through every height in between (the pose's `rise`), and
its eyes, and the marks and words above them, rise with it. While it stands it
walks where a seated friend hops: its feet take the walk's small steps
(`PhyFriends.anim.WALK` and `walking`) while its body glides on up to twice as
far, at a little under half a hop's speed. `moveTo(x, { hop: true })` hops all
the same.
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
characters, `src/anim.js`, `src/emotion.js`, `src/cast.js`, `characters/cast.js` and
`film/scene.js`, with `src/pen.js` and `site/title-pen.js` before the scene where
a title writes itself. A page that shows a film also loads `film/film.css` after
the site's stylesheets and `film/film.js` after the scene. The films in `demo/`
are built this way: `python3 tools/pf.py film demo/roll-call/index.html --draft
-o out/roll-call.mp4` films one while its friends' owners have yet to agree to
video.

## Pose

Every field is optional:

```js
{ x, y, squash, tilt, headX, headY, turnX, turnY, lookX, lookY, blink, widen, lid, lidTilt, earL, earR, hair, tail,
  blush, flush, eyes: 'open' | 'happy' | 'closed' | 'squint', eyeL, eyeR,
  mouth: 'none' | 'w' | 'smile' | 'frown' | 'o' | 'v' | 'open', show: 'laptop side',
  stance: 'sit' | 'stand', rise, crouch, lean, armL, armR, elbowL, elbowR, legL, legR, stepL, stepR, over: 'armL armR' }
```

`rise` adds to the stance (0 for `sit`, 1 for `stand`), the sum held between 0
and 1, and the friend is caught at that height. The rest of the last line moves
the limbs (see [Standing](#standing)): a friend takes less of it the lower it
is, and none seated. `armL` raises the left arm (the viewer's left) in
degrees, 0 hanging and 90 held out level, and `elbowL` bends it further along:
+ carries on the way it raises, as in a wave, and − curls the paw in towards
the chest. `legL` swings a leg out at the hip, `stepL` lifts its foot (head
units), `crouch` drops the hips with the feet planted, and `lean` tips the upper
body about the hips (+ to the viewer's right, as `tilt` tips the head). `over`
names the arms drawn whole in front of everything, shoulder too.

`lid` brings a lid down over the open eyes, cut straight across (0 up, 1 shut),
and `lidTilt` slants it: + lowers its inner end, for a cross look, − raises it,
for a sad one. Unlike `blink`, which squashes the whole eye for a moment, a lid
is held. `flush` spreads the blush (0.5 makes each cheek half as large again),
since `blush`, its opacity, can only fade it. `show` lists the extras to draw
that a spec keeps for a cue (`show: 'laptop'` on an extra), such as a prop;
reduced motion leaves it out, since it is not the face.

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

## Feelings

`src/emotion.js` (`PhyFriends.emotion`) shows how a friend feels with the parts
every friend drawn on the house template has, so every feeling works on every
one of them without a new drawing. There are eleven: happy, content, shy,
proud, surprised, scared, curious, sleepy, asleep, sad and cross. Each comes in
four forms, all partial poses that layer over a friend's idle clip:

```js
const E = PhyFriends.emotion;
PhyFriends.render('howdi', { pose: PhyFriends.anim.sample(E.face('sad')) });  // A still.
E.react('surprised');   // A clip that plays once as the feeling comes on: a start, with the mouth open.
E.hold('curious');      // A looping clip: the head tilts one way, then the other.
E.feel('sleepy');       // A clip that never ends: a yawn, then nodding off.
E.greeting('howdi');    // The hi every page uses: a hop for joy.
```

A feeling's body language follows from where it sits on two axes, valence
(unpleasant to pleasant) and arousal (drowsy to alert), after Russell's
circumplex of affect: alert ears stand up and drowsy or unhappy ones droop, a
pleased friend holds itself up and an unhappy one slumps (`E.posture`). The face
adds what the axes cannot say: the eye and mouth shapes, the lids and where the
eyes look. So feelings that sit close look alike, and a new feeling needs only
its place, its face and its movements. A friend standing has arms, so its
posture carries them too (raised and out when pleased or alert, in and low when
unhappy, limp when drowsy), and most feelings add a gesture of their own: paws
together when shy, on the hips when proud, up by the face when scared, a paw
raised under the chin when curious, arms folded when cross. A friend takes
less of them the lower it is, and seated it ignores them.
Some have a mark (`!` for surprise, `z`,
repeating, for sleep), which a scene shows with `feel()`, and `E.describe(name,
'Howdi')` gives a screen reader "Howdi looks surprised." `anim`'s `parse`
understands the four forms, so `pf.py anim howdi --clip "layer(idle,
hold('content'))"` films one, `tools/animate.html` plays any of them on any
friend, and `tools/feelings.html` shows every friend in every feeling.

Claude keeps every rule but the shape, and its ears are arms, so its spec sets
`emotions: false` (`E.fits('claude')` is false): given its spec, a feeling is
its movement alone, with no face (`E.react('surprised', { spec: 'claude' })`).
Its hi is the same hop with a smile alone (`E.smile('claude')`): the happy eyes
and mouth, without the blush or the posture.

## Alive on a page

`src/live.js` (`PhyFriends.live`) brings friends to life on an ordinary page,
as the gallery and the specimen's portrait are brought to life:

```js
const stage = PhyFriends.live.stage({ announcer: document.querySelector('.announcer') });
stage.add(document.querySelector('.portrait'), 'phy', { label: 'phy' });
stage.start();
```

Each friend rests on the bottom edge of its box, seated unless it is added
with `stance: 'stand'`; then it stays standing through a hi or a feeling, and
its ears reach further above the box. It breathes and blinks with the idle
clip, follows the pointer, answers a hi (a click, a tap, Enter or Space),
and feels what a visitor does to it (FWIENDS.md, "Saying hi"); the stage says
what happened in the page's live region (`.announcer`, in `site/pencil.css`).
A box that is a button takes `role="button"`, `tabindex="0"`, a short
`aria-label` ("say hi to phy") and an `aria-describedby` pointing at a
`hidden` element that says what the friend looks like. That element stands
beside the box, not in it, since mounting replaces what the box holds. The
page keeps its own layout; the gallery's roll call moves its friends and
turns their eyes through two hooks on each friend, `travel` and `watch`.
Options fix a pointer, a hi or a feeling for screenshots (the
gallery's `?px=..&py=..`, `?hi=<name>` and `?feel=<feeling>`) and set how long
the friends wait before they doze (`?doze=<seconds>`). Under reduced motion
the friends keep still but for their eyes; `PhyFriends.live.keepStill(checkbox)`
gives a reader the same choice ("keep still"), remembered on the device in
`live.still`, which every stage follows unless given a `reducedMotion` of its
own. A page loads
`src/phyfriends.js`, the characters, `src/anim.js`, `src/emotion.js` and
`src/live.js`, in that order.

## CLI

```sh
python3 tools/pf.py list                                    # Characters and their examples
python3 tools/pf.py render howdi --size 512                 # out/howdi/portrait.png
python3 tools/pf.py render howdi --pose '{"eyes":"happy","mouth":"w"}' -o out/howdi/happy.png
python3 tools/pf.py render howdi --flat                     # The flat shapes, without the pencil
python3 tools/pf.py compare howdi                           # Every example: out/howdi/compare/ref.png + ref-diff.png
python3 tools/pf.py compare howdi --view ref --region 0,600,700,1254   # One example, metrics and a zoomed crop for a box
python3 tools/pf.py anim howdi --clip idle                  # out/howdi/anim/idle.gif
python3 tools/pf.py anim howdi --view stand --clip "layer(still({stance:'stand'}), wave({spec:'howdi'}))"  # A clip's name, given options, makes one
python3 tools/pf.py render howdi --with out/scratch/mine.js # Here mine.js redefines howdi, to try a working copy
python3 tools/pf.py film test/film-stub.html -o out/scratch/film/stub.mp4 --sheet   # A page, frame by frame
python3 tools/pf.py film test/film-stub.html --at 1 -o out/scratch/film/still.png  # One still from it
python3 tools/pf.py test                                    # The in-browser tests, and the gallery's labels against the cast
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
`test` also checks the gallery against the cast, which `index.html` repeats by
hand: each friend's name, species and credit, the name in its `aria-label`, the
host, the owner's agreement to the gallery, and the names in the link preview's
alt text. A mismatch is a failure that names the friend and the field.

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
3. **Animate**: pick or compose clips from `PhyFriends.anim` and feelings
   from `PhyFriends.emotion`, try them on every friend in `tools/animate.html`,
   and export with `pf.py anim`, or play them live in a page.

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
