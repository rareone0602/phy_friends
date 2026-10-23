# The fwiends' library

The library that draws phy's fwiends, and everything they do: `src/` is what a
friend is and does, `film/` puts friends together on a sheet, `props/` holds
the things the films share, and `characters/` the fwiends themselves. The rules
for how a friend looks and behaves are in `FWIENDS.md`, at the repository's
root; this is the reference for the code. Paths below are from the root.

A character is a spec of about 100 lines (a palette plus a handful of shape
parameters), not stored pixels; `FWIENDS.md` says why. The library turns spec
and pose into SVG, so a character scales, recolours, animates and looks at
your cursor.

```
lib/fwiends/characters/howdi/howdi.js
   (data, ~100 lines)
        │
        └──►  PhyFriends.render(spec, {view, pose})      ──►  SVG
              PhyFriends.mount(el, spec).setPose({...})       (live rig)
              PhyFriends.anim.*                               (clips)
              PhyFriends.emotion.*                            (feelings)
              PhyFriends.live.stage().add(el, name)           (alive on a page)
```

No build step and no dependencies: `lib/fwiends/src/phyfriends.js` is a
classic script (`window.PhyFriends`, or CommonJS), so pages work straight from
`file://` or GitHub Pages.

| path | what |
|---|---|
| `lib/fwiends/src/phyfriends.js` | core: shape generators, spec registry, renderer, pose rig, seated and standing |
| `lib/fwiends/src/anim.js` | animation: clips of movement (idle, hop, bounce, nod, turning round; and for a friend standing, walk, wave, cheer, jump, dance, stretch, point, beckon, and standing up and sitting down), composition, stacks of timed layers, a browser player, and the hop and the walk by which a friend gets about |
| `lib/fwiends/src/emotion.js` | feelings: happy, excited, laughing, playful, fond, content, relieved, proud, determined, inspired, curious, thoughtful, shy, surprised, confused, nervous, scared, cross, dizzy, bored, sad, sleepy and asleep, each as a face, a reaction and a held loop, for every friend drawn on the house template; a friend standing adds its arms and a gesture; and the marks over a friend's head, written in the hand or drawn in its line |
| `lib/fwiends/src/live.js` | friends alive on an ordinary page, as the gallery and the specimen's portrait are: one clock for all of them, the idle clip, following the pointer, a hi, and the feelings a visitor stirs (shy, content, curious, asleep) |
| `lib/fwiends/src/workings.js` | a page's workings in blue pencil, only when the reader asks: each friend's construction drawn from its spec, notes beside the parts of the page, and elements of the page's own revealed; a page loads it only if it wants it |
| `lib/fwiends/src/pen.js`, `lib/fwiends/src/title-pen.js` | text that writes itself stroke by stroke, and the strokes with which the gallery's title writes itself |
| `lib/fwiends/src/cast.js` | the rules for friends together: who knows whom, who may speak, and what they may do together |
| `lib/fwiends/film/scene.js` | scenes: several friends on one sheet of ruled paper, with props, handwriting and a camera, for films and games |
| `lib/fwiends/film/film.js`, `lib/fwiends/film/film.css` | a film on a page: it plays once when it scrolls into view, with a button to play it again, and boils as it plays; the stage, and the credits and controls under it |
| `lib/fwiends/film/props.js` | props as specs, as friends are: a palette, a box and parts, drawn with the core's shapes and pencil; states (a cake's candles lit) that a scene switches on cue, and colours a scene may override (a party hat in a friend's colour) |
| `lib/fwiends/props/<name>.js` | the shared props, one spec each (`PhyFriends.props.define(name, spec)`): `cake`, `candle`, `partyHat`, `balloon`, `gift`, `medal`, `pencil` and `gramophone` |
| `lib/fwiends/characters/cast.js` | the cast itself: each friend's name, pronoun, owner's credit and the media the owner has agreed to, and which owners know each other |
| `lib/fwiends/characters/<name>/` | one folder per character: the spec `<name>.js` (`PhyFriends.define(name, spec)`), `examples/`, and `backup/` for the versions not taken |

## Characters and examples

```
lib/fwiends/characters/
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
`lib/fwiends/characters/<name>/private/`, which git ignores too.

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
short legs, with two arms hanging from its sides. The limbs are a stuffed
toy's: soft, straight hoses with round ends, bent along an arc when a pose bends
them, so that they never show a joint. An arm keeps its length; a leg squashes
or stretches a little, as stuffing does. Unless a spec places them, the limbs
are fitted to its body (`PhyFriends.STAND_FIT`): the legs show 30 units below
the body's bottom, from hips tucked under it and set close together, and each
arm, 42 units long, hangs from high on the body's side, just inside it, and
well out from the side below it, so that its paw shows past the body. These
numbers, with the rice ball's and the body's height below, were chosen by eye
on the tuning page (`tools/tune.html`) by Terry's owner,
[@FreshSnails_x_6](https://x.com/FreshSnails_x_6), all but the rice ball's
taper, which is phy's. The feet touch the figure's own ground (`stand.ground`,
the body's bottom plus 30, about 171 for most friends), and the rig lifts the
friend by the difference
(`PhyFriends.standLift(spec)`), so that its feet stand where its seated paws
did: the floor stays put. Any part a spec leaves out comes from
`PhyFriends.STAND_DEFAULT`, and a spec may tune the fit for itself
(`stand.fit`, any of `STAND_FIT`'s numbers), so most give only their seated
paws and feet (`stand.seat`) and their limbs' colours and bands.
`PhyFriends.standFor(spec)` returns a spec's figure with all of this filled in.

Every friend that stands has a body `PhyFriends.BODY.height` times as tall as
its spec draws it: 1.1, a tenth taller, about 9 units. A taller body
keeps its top under the chin and reaches lower: its markings and clothes
stretch with it, the tail's root moves down with the hip, and the seated paws
and feet, the props and the ground itself drop as far as its base does, while
the head stays where it is. `PhyFriends.groundOf(spec)` gives the ground after
that drop, and every page that stands a friend on a floor asks it, rather than
reading `rig.ground`.

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
narrow under the chin and broad at the base, reads as a seated friend
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
`over` draws an arm whole in front of everything, shoulder too. An arm and its
paw take their colours' house shades as the paw comes in front of the head or
the face, fading in over a paw's breadth either side of their edge, so that a
paw the colour of the face still shows against it without an outline. Claude
stands already, on the glyphs' four legs, so its spec sets `stand: false` and
it keeps its shape in either stance, as does any spec without a body, or with
one that is not an ellipse, on which the limbs could not be fitted.

## Turning

Every friend that stands also turns round, as South Park's cut-out characters
do: not through every angle, but a quarter turn at a time. The pose's `facing`,
in degrees about the vertical, snaps to the nearest quarter
(`PhyFriends.quarterOf`): 0 faces the viewer, 90 is side-on, facing the
viewer's right, 180 turns its back, and 270 is side-on, facing left. No friend
has a turned drawing of its own. Each is turned from its own spec by rules that
every friend shares (`PhyFriends.TURN`), so a friend turns the same way after
any change to its spec or to the figure the house gives it (`STAND_FIT`,
`ONIGIRI`, `BODY`): a taller or narrower body is taller or narrower side-on and
from behind as well. The rules aim for what looks right rather than what is
spatially right: where the true turn looks worse than a cheat, the cheat wins.

Side-on, each part of the head and the body lies on a plane that slides towards
the way the friend faces and narrows. The face comes forward and narrows until
its near eye sits about halfway out from the middle of the head (`eye`) and its
front edge nearly reaches the head's (`reach`), while its pale patch stays wide
enough to read (`patch`). Only the near eye shows, drawn over the hair, with the
near cheek, both keeping their shape and the cheek staying on the face, the
mouth and the near side's markings of the face, which come in with the head
above the eyes; a blaze or an emblem across the face keeps at least `patch` of
its width. The far eye is hidden, and so is anything wholly on the far side of
the centre line, a brow or a cheek mark. Glasses are left out, as is the custom
in a side view, so Alfie turns without them. A dotted mark turns dot by dot. The
head loses the tufts in front of it. The hair bends from the head to the face:
its top stays on the head and lower down it comes ever further with the face,
so that a fringe, or a lock beside the face, goes with it, while hair that
covers the crown (at least `crown` of the head's width) keeps covering the side
of the head as well. The ears close up behind the middle of the head and stand
more upright, the far one first, showing its back, in its house shade where it
is the colour of the head, and an ear folded over, as cowosus's is, keeps its
fold; horns and antlers stand with them, but the far one is left out. The body
is narrower (`body`, 0.8): what lies on its front (a chest, a collar, a yukata's
crossed front) comes to its front, a ruff or a bib round the neck a little wider
(`scarf`), hanging forward where it is wider than the body, and a neckerchief's
knot and ends turn together; what lies on its back (a hood, a ponytail) goes to
its back, and what lies on one side of it (wings, a bow) reaches out behind. A
marking on one side of the head or the body (a thigh, a knot, cowosus's eye
patch) wraps round the near side where it lies, as on a round body turned a
quarter, never wider than it is facing the viewer, and hides on the far side; a
shoulder patch or an arm's stripe goes with the near arm. The pieces of one
marking turn together. The limbs close up and hang straight down, the far arm
behind the body and the far leg behind the near one, the feet pointing
forwards; seated, the forepaws come forwards. The tail grows from the back of
the body. Each side keeps its own colours, so K3V1N shows his blue eye facing
right and his orange one facing left.

From behind, a friend is its own mirror image, as it would be turned round: its
tail changes sides, and so does whatever is on its left or right. The face and
what lies on the front are hidden, though the head keeps the outline its face
gives it (a chin), as is whatever faces forwards (the insides of the ears, a
badge such as the anchor on WhiteDeer's hat, a hoof's cleft); what lies on the
back is drawn over the body, and what lies on the sides where it is; the ears
show their backs, in their house shade where they are the colour of the head,
so that they stand apart from it; the arms hang behind the body while it sits
and beside it, under the head, once it rises; hair that covers the crown lies
over the head, and a forelock or a crest behind it (`backHair`); and the tail,
which grows from nearer the middle of the back (`tail`), is drawn over
everything. A spec may light its back from behind (`backLit`), so that what is
shaded facing the viewer for lying behind the head, as the back of Teni's bob
is, takes its own colour once it is in front. Soles and glasses show only
facing the viewer.

How each feature turns is the house's (`ANATOMY.turns`): with the face, on the
front, on the back, on the sides, on the arms (shoulder patches, arm stripes),
with the ears (horns and antlers), facing forwards, or only facing the viewer
(soles and glasses); any other feature rides its part. An extra may name its
own group (`turn: 'forward'`, or `'none'` to ride its part), and a spec may
change any of `TURN`'s numbers for itself (`turn`), though a difference shared
by several friends belongs in the rules. A part that shows only once a friend
turns, drawn from its owner's own picture of its back, lies under the body
facing the viewer: WhiteDeer's sailor-collar flap and the knot of Brian's
bandana. A mounted rig draws a friend afresh when it turns, into the same
`<svg>`, keeping `rig.parts` and its pencil texture, since a turned friend is
drawn in another order; every other change of pose rewrites a few transforms,
as before. `PhyFriends.anim.make.turn({ quarters })` turns a friend round a
quarter at a time, each turn landing with a small hop.

## Spec

```js
PhyFriends.define('name', {
  extends: 'house',                                                    // What it is: the abstract house or friend (below), or another friend (a variant)
  palette: { bg, fur, head, face, hair, ear, earRight, earInner, iris, irisRight, ink, blush, tongue, body, tail, arm, paw, pawRight, leg, foot, ...others },  // The roles first (see Anatomy); shades such as furShade are derived
  head:  { cx, cy, rx, ry, fluff: [{ from, to, n, len, lean, sym }] },  // Fluffy ellipse
  face:  { ... same as head ... },                                     // Pale mask (false: none)
  ears:  { base, angle, width, length, lean, tip, inner, stripes, over, right: {...overrides} },  // over: drawn over the head, under the face (Terry's lobes); false: none
  hair:  { cx, cy, rx, ry, valley, tips: [[x, y, b1, b2], ...] },      // Spiky star (false: none)
  eyes:  { x, y, w, h, shape: 'pill' | 'dot', tilt, shine, range, stroke, arc, right: { shine } },  // shine: a highlight, or a list of marks (iris, highlight); right: the right eye's own (its color is irisRight); false: none
  blush: { x, y, rx, ry, tilt },                                      // tilt > 0 raises the outer ends
  mouth: { x, y, size, shape, fang },                                 // shape: the default mouth; false: none
  body:  { ...fluffy ellipse..., onigiri },                            // onigiri: a rice ball rather than an ellipse (0..1, or { taper, square })
  tail:  { base, angle, length, width, curl, bend, taper, root, fluff, tip: { at, n, len, span, color, fluff } },  // Optional; tip: the house's tip unless it says otherwise (see tail, below)
  stand: {                                                             // The standing figure: the seated body on two legs (false: never stands); any part left out takes the default, fitted to the body
    seat:  { paw, foot, right: { paw, foot }, arms, legs },            // The seated forepaw and hind foot, ellipses { cx, cy, rx, ry, rot }, down to which the arms hang and into which the legs fold (false: one the seated drawing hides, which tucks under the body); arms and legs override the folded limbs' numbers (arms: { length: 0 } folds an arm into its paw)
    fit,                                                               // Any of STAND_FIT's numbers, for this friend
    ground, hips,                                                      // Where the feet touch, and the pivot of a lean
    arms:  { shoulder, angle, bend, length, width, taper, paw: { cx, cy, rx, ry }, bands: [{ from, to, color, grow, teeth, depth }], right: {...overrides} },
    legs:  { hip, spread, ankle, bow, knees, width, taper, foot: { cx, cy, rx, ry }, bands, right },  // A paw or foot the seat leaves out may be any shape
    tail:  { base, angle },                                            // The tail's place while standing
  },
  turn:  { eye, reach, patch, body, ..., backHair, backLit },        // Optional: this friend's own numbers for turning round (TURN)
  extras: [{ feature: 'chest', on: 'body', clip: true, fill: 'face', ...shape }],  // Markings, clothes and props; feature: what it draws (see Anatomy); on: 'ears' means both ears, 'paws' and 'feet' both of those
  // An extra with show: 'name' is drawn only while the pose's show lists that name (a prop); one on 'ground' stays put as the friend hops
  // An extra on 'paws' or 'feet' with sole: true faces us only while the friend sits, and flattens as it rises
  // An extra's turn names the group of ANATOMY.turns it turns with, rather than its feature's ('none': it rides its part)
  // An extra with under: true lies under its part's own shape rather than over it; kind: 'ellipse' draws a plain ellipse { cx, cy, rx, ry, rot }
  rig:   { ground, neck, turn },                                       // ground: where the rig meets the ground (default 131, the house's; groundOf lowers it with a taller body); neck: the head's pivot (default [0, 50]); turn: how far the head's layers slide as it turns (default 14)
  emotions: false,                                                     // Only off the house template (Claude): no feelings
  routine: { says, saysStill, duration, keys: { field: [[t, value, ease]] } },  // Its third hi plays it, if it shows no feelings (Claude's laptop)
  views: { ref: { w, h, x, y, scale, rotate, pose, bg } },             // bg: the view's background, in place of the palette's (a render's own bg overrides it)
});
```

`render(spec, options)` returns the SVG and `mount(el, spec, options)` a live
rig, and both take the same options: `view` (a view's name, or a camera), `pose`,
`size` (the width in pixels to which the view is scaled, keeping its proportions),
`bg` and `pencil` (see [The pencil](#the-pencil)), `fluid` (no width or height,
so that the drawing fills its box: a mounted rig's default) and `uid` (the
prefix of the drawing's ids, otherwise new for every render: a page names its
own where it refers to them, or where a still must come out the same every
time). `mount` also takes `bitmap: false`, which keeps the pencil's texture as a
still draws it rather than swapping it for a bitmap, for a page that must come
out the same every time, such as a film. A pose field given as `undefined`
counts as not given.

A spec extends what it is, as a class extends an abstract one, and gives only
where it differs. Every friend extends `friend`, the abstract friend: the dark
background (`palette.bg`) and eye strokes that span the whole eye (`eyes.arc:
1`). Every friend on the house template extends `house`, which extends `friend`
with what they all share besides: the legs in the house shade (`palette.leg:
'furShade'`), the eyes' width (`eyes.w: 13`), the rice-ball body
(`body.onigiri: 1`), the ground (`rig.ground: 131`) and the close-up view
(`views.closeup`). Claude, off the template, extends `friend` alone. The
abstract friends are never listed (`PhyFriends.list()`), and `PhyFriends.get`
reads them like any friend.

Every character file is laid out the same way, so two specs read side by side:
- a one-line header comment naming the character and its reference pictures;
- `extends` first, then the keys in the order above, of which a spec gives only
  those it does not take from what it extends;
- extras grouped by the part they sit on (`base`, `face`, `ears`, `hair`, `body`, `scarf`, `tail`, `paws`, `feet`, `ground`), each with a short comment saying what it depicts;
- `views` last, with `ref` first.

Fwiends share one scale: a reference drawn in the house template (a 1254 px close-up, the head tipped 20°) is matched at `scale: 5.5`, so the eyes come out the same size in every spec.

Shades are derived (the one-layer rule: FWIENDS.md): any `<name>Shade` a spec uses and leaves out of
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
  and may square off into a broad, flat base with round corners, resting
  where the ellipse's bottom did, and its tufts keep their angles.
  `onigiri: 1` is `PhyFriends.ONIGIRI`'s rice ball (`{ taper: 0.8,
  square: 0 }`: a soft rounded triangle, round at the base), and
  `onigiri: { taper, square }` gives a rice ball its own: how much narrower
  its top is, and how far its base squares off. `outlineOf`
  gives the outline a fluffy grows its tufts on, and `reachAt` how far it
  reaches either side at a given height.
- **star**: a hair mop. Absolute tip points; valleys sit on a scaled base
  ellipse between tips, and each edge can bend concave (`b > 0`) or convex (`b < 0`).
- **ear**: a rounded triangle in local space with an inner ear and stripe bands
  (clipped). The right ear mirrors the left unless overridden. With
  `inner.front` the inner ear is drawn in front of the head, so it can run down
  over the head fur while the rest of the ear stays behind. `base` is the ear's
  root, where it meets the head: the ear stands on it and turns about it, by
  `angle` and by a pose's `earL` and `earR`. An ear drawn as an extra keeps its
  base on the root all the same: Terry's lobes are extras on a stub set low
  beside the cheek, where the dark inside of the ear shows, so that each lobe
  turns about its root, below it.
- **tail**: an optional bushy plume drawn behind the body. In local space it is
  a fluffy ellipse standing on its base (so `fluff` angles run 270 at the tip to
  90 at the base) and bent into a curve. `curl` swings the tip outward (or
  inward if negative) by sliding it sideways. `bend` (degrees) turns the spine
  itself, outward or inward if negative, and keeps the plume's thickness, so a
  tail can curl right over into a crescent (a tail with `bend` has no curl
  unless it sets one). `taper` and `root` (0..1) pinch the two ends. `tip`
  paints a clipped marking over the last part of the length, from `at` (a
  fraction, 0.7 unless given) to the end, in `color` (`tailTip` unless given).
  Its edge is the house's: `n` tufts (3) `len` long (18), pointing back at the
  base, `span` degrees either side of it (40); a spec gives only the numbers in
  which its tip differs, or replaces the row outright with `fluff`, as a fluffy's
  ranges (Yuda's short band). The
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

## Anatomy

Every friend but Claude is made of the same parts, named the same way
(`PhyFriends.ANATOMY`), so that one friend's spec reads line for line against
another's. `PhyFriends.check(spec)` lists where a spec departs from it, and the
tests hold every friend to it (`test/anatomy.test.js`), so a part that a friend
lacks is a decision rather than an oversight:

- Each section above from `palette` to `rig` is given, or `false` where the
  friend has no such part: Terry has no `hair`, and Raze no `face` of another
  colour. A friend that stands gives its seated forepaw and hind foot
  (`stand.seat`), or `false` for one that its seated drawing hides.
- Each part takes its colour from its palette role (`ANATOMY.roles`): the head
  from `head`, the ears from `ear`, the eyes from `iris`, the mouth's line from
  `ink`, a forepaw from `paw`, a hind foot from `foot`, and so on, never from a
  `color` of its own; the right one of a pair that differs takes `earRight`,
  `irisRight` or `pawRight` (tanyuan's folded right ear, K3V1N's orange eye,
  mumuyou's pink forepaw). So every
  friend's palette opens with the same roles in the same order, one table of its
  colours. A role is a colour, or the name of another role (`paw: 'face'`) or of
  a house shade (`body: 'furShade'`), whose colour it takes. The friend's other
  colours follow, named for what they paint (`scarf`, `hoodie`, `stripe`).
- Each extra names the feature it draws (`feature`), from the house's list
  (`ANATOMY.features`), grouped by where it sits: the head's (`cheekRuff`,
  `blaze`, `brows`, `forehead`, `cheekMarks`, …), the ears' (`earTufts`,
  `earFold`, …), the hair's (`locks`, `curl`, `streaks`, …), the body's
  (`chest`, `belly`, `shoulders`, `thighs`, …), clothes (`bandana`, `hoodie`,
  `hood`, `drawstrings`, …), the tail's (`tailTip`, `tailMarks`, …) and the
  limbs' (`cuffs`, `socks`, `toes`, `soles`). One friend's eyebrow dots are
  `brows` as much as another's, whatever their colour or layer. A feature that
  no friend has had yet is added to the list first.
- Each feature turns one way for every friend (`ANATOMY.turns`; see
  [Turning](#turning)): `chest` lies on the front, `hood` on the back, `brows`
  on the face, `earInner` faces forwards, and `glasses` show only facing the
  viewer, whoever wears them.
- The sections, the stand's keys, the extras' layers, a spec's turn numbers and
  an extra's turn group are checked by name, so `feet` written for `foot` is
  caught.
- Every friend's drawing has the same parts, by the names a mounted rig gives
  them (`ANATOMY.parts`, `rig.parts`): what a pose moves, and all that the code
  that animates a friend may rely on. A part that a friend lacks (`ears: false`,
  `eyes: false`, `mouth: false`) is still there, empty. The head's layers come
  in one order for all of them; an ear drawn over the head, as Terry's lobes and
  cowosus's folded ear are, says so (`ears.over`).

The anatomy makes the friends alike in what they are made of; the house contract
(`test/contract.test.js`) makes them alike in what they do, which is what the
clips, the feelings, the gallery and the films rely on. Every friend but Claude
is held to every promise of it, so that the code that animates a friend never
needs to know which friend it is: every movement and feeling poses it in finite
numbers, sitting and standing; it turns to each quarter in finite numbers with
all its parts, its face ahead of its head side-on and hidden from behind; a
mounted rig draws each pose as a fresh render does, turned or not; it sits and
stands on its ground, facing any way, and keeps a foot there as it walks; its
limbs show against what lies behind them (by at least the colour difference by
which phy's warm white, the palest the house allows, stands off the paper); it
waves, points and beckons with the arm away from its tail; and its ears turn
about their roots, below them, so that a positive ear rotation turns them out.
The one ear that turns otherwise does so by design: cowosus's folded ear, drawn
as the flap that hangs from its fold, turns about the fold, above it, so that a
positive rotation swings it in against the head, and the test names it, so that
no other ear hangs from a pivot above it by mistake. And a paw raised in front
of the face shows against it, even where it is the face's colour, since it
takes its house shade there (no outline being the house's rule).

Claude keeps the shape of Claude Code's mascot, and its spec the names it had
before the roles (`body`, `eye`). A spec without a role draws its part as one
written before them did: the head, ears, arms and tail in `fur`, the eyes and
the mouth in `eye`, the body in `chest`, and the legs in the body's colour.

## The pencil

`render` and `mount` colour every character in with coloured pencil
(FWIENDS.md): one mask over the whole drawing lets the paper show through in diagonal
strokes, fine tooth and patches of lighter pressure. There are no outlines.
The mask is measured in the picture's own units rather than head units,
since a pencil is the same size however large the drawing; it stays put while
the character breathes or turns (in a scene, a character that travels takes its
paper with it, as a figure cut out of paper would), and, being an image, costs a browser one draw rather
than one per frame. A render with a background of its own lays a sheet of
paper, cut to the character's outline, under the drawing, so the pencil shows
paper rather than the background. `{ bg: false }` draws no background, so the
pencil shows the page's own paper; `{ bg: 'page' }`, for a page that may turn
to the dark sheet, does the same but adds the cut-out with the class
`pf-cutout`, which the library shows only on the kit's dark sheet and in
forced colours (it adds its own rules to the page the first time it draws such
a friend). `{ pencil: false }` draws the flat shapes
alone, for an icon too small to hold the texture or for matching a flat
reference picture.

## Scenes

`lib/fwiends/film/scene.js` puts several friends on one sheet of ruled paper,
measured in head units (a rule every 54, so a friend stands five rules tall).
Everything in it is a cue at a time on the scene's clock, and a frame depends
on the time alone, so a film plays in a page and `pf.py film` films it frame
by frame from the same script, while a game adds cues as it goes.

```js
const scene = PhyFriends.scene.create(document.querySelector('#stage'), { width: 1600, height: 900 });
const phy = scene.add('phy', { x: 520 }), yuda = scene.add('yuda', { x: 1100 });
yuda.enter({ from: 'right', at: 0.5 });
phy.look(yuda, { at: 1 }).say('hi, Yuda', { to: yuda, at: 1.2 });
yuda.emote('♪', { at: 2 });
if (!scene.film({ duration: 4 })) scene.play();   // Filmed by pf.py film; played live otherwise.
```

Friends hop, look, show marks and feelings (`yuda.feel('surprised', { at: 2
})`, from `lib/fwiends/src/emotion.js`, with its mark) and play clips, each
made for the friend that plays it (`PhyFriends.anim.parse(clip, { spec })`):
`yuda.play('wave')` waves with the arm away from his tail, and a feeling in an
expression is his own; phy, the host, may also speak. A friend sits unless it
is added standing (`scene.add('yuda', { stance: 'stand' })`) or stands up on
cue (`yuda.stand({ at: 1 })`, and `sit()` to sit down again). It rises through
every height in between (the pose's `rise`), and its eyes, and the marks and
words above them, rise with it. While it stands it walks where a seated friend
hops: its feet take the walk's small steps (`PhyFriends.anim.WALK` and
`walking`) while its body glides on up to twice as far, at a little under half
a hop's speed. `moveTo(x, { hop: true })` hops all the same.
`lib/fwiends/src/cast.js` holds the rules for friends together (FWIENDS.md,
"scenes"), and the scene enforces them: two friends are strangers unless
`lib/fwiends/characters/cast.js` says their owners know each other, strangers
keep a strip of paper between their outlines as drawn (whichever way they
face, sitting or standing) and neither talk to nor hand things to each other,
and only a friend with a voice says or writes words (`scene.write(text, { by:
yuda })` checks a friend's writing as `say()` checks its speech); a friend
other than phy uses the hand its marks are written in. A film made for one
owner alone (`PhyFriends.scene.create(el, { madeFor: 'yuda' })`) lets that
owner's friend say and write a few drafted lines as well. A broken rule
throws, saying what would allow it, and its error's `code` is
`PhyFriends.cast.BROKEN`, which tells it from a slip in a page's own code.
Each frame credits the owners of the friends in it, and a friend whose owner
has not agreed to films or games marks the scene "draft". `credits: false`
turns the frame's credits off: a game that runs only in the page then links
each owner in the page's small print, and a film names the owners once,
written large, and leaves the links to its post, since a link in a video
cannot be clicked. Props are specs too (`lib/fwiends/film/props.js`,
`lib/fwiends/props/`): `scene.prop('cake', { x: 900 })` places the shared cake
on the floor, `state: ['lit']` draws it with its candles lit, `palette: {
paper: PF.get('yuda').palette.scarf }` draws the party hat in Yuda's cyan, its
shade following, and `scale: 2` draws a prop twice as large.
`cake.state('lit', true, { at: 12.5 })` lights the candles on cue without
drawing the cake again; `cake.reveal({ at: 72, seconds: 3.6 })` draws it in
from the bottom up (or `from: 'left'`), as handwriting writes itself, and
`cake.erase({ at: 90 })` rubs it out the same way, after which none of it
shows. `hat.recolor({ paper: PF.get('yuda').palette.scarf }, { at: 80, amount:
0.2 })` colours a prop in: the same drawing in those colours, merged over its
own, comes in over it as `reveal()` draws, until `amount` of it (here the
bottom fifth) is coloured. A prop may be coloured in again, each colouring
over the last and from the same side, and only one placed by name or by spec
can be coloured in at all. A drawing of a film's own (`{ w, h, svg }`) is
placed as before, and a scene that names props loads
`lib/fwiends/film/props.js` and the props it names after
`lib/fwiends/film/scene.js`. A scene follows the viewer's reduced-motion
setting unless given its own `reducedMotion` (anything with `matches`): say hi
passes `{ matches: false }`, so that it plays live as it is filmed, and
decides itself what the setting means (it never starts by itself). A friend's
moves may be cued in any order: each starts where the moves before it in time
leave the friend. `paper: false` leaves the scene's ruled paper out so the
page's own shows through, and `write(text, { graphite: true })` is for a title
only (STYLE.md §3); `write(text, { pen: TITLE_PEN })` writes the gallery's
title stroke by stroke (`lib/fwiends/src/pen.js`). A page loads, in order,
`lib/fwiends/src/phyfriends.js`, the characters, `lib/fwiends/src/anim.js`,
`lib/fwiends/src/emotion.js`, `lib/fwiends/src/cast.js`,
`lib/fwiends/characters/cast.js` and `lib/fwiends/film/scene.js`, with
`lib/fwiends/src/pen.js` and `lib/fwiends/src/title-pen.js` before the scene
where a title writes itself. A page that shows a film also loads
`lib/fwiends/film/film.css` after the site's stylesheets and
`lib/fwiends/film/film.js` after the scene. The films in `demo/` are built
this way: `python3 tools/pf.py film demo/roll-call/index.html --draft -o
out/roll-call.mp4` films one while its friends' owners have yet to agree to
video.

## Pose

Every field is optional:

```js
{ x, y, squash, tilt, headX, headY, turnX, turnY, lookX, lookY, blink, widen, lid, lidTilt, earL, earR, hair, tail,
  blush, flush, eyes: 'open' | 'happy' | 'closed' | 'squint' | 'swirl', eyeL, eyeR,
  mouth: 'none' | 'w' | 'smile' | 'frown' | 'o' | 'v' | 'flat' | 'wobble' | 'open', show: 'laptop side',
  stance: 'sit' | 'stand', rise, crouch, lean, armL, armR, elbowL, elbowR, legL, legR, stepL, stepR, over: 'armL armR',
  facing: 0 | 90 | 180 | 270 }
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

`earL` and `earR` turn the ears about their roots, in degrees: + turns an ear
out, as it droops or flaps, and − turns it in, as it pricks up. A flap that
hangs from its fold, as cowosus's folded ear does, turns about the fold
instead, so + lays it against the head and − lifts it away.

`tail` wags the tail about its base, in degrees: + swings the tip outward and
− tucks it in behind the body. The clips keep it within about ±12°, and
`PhyFriends.anim` clamps it to ±45°.

`facing` turns the whole friend round, a quarter at a time (see
[Turning](#turning)); like the other numbers, it adds up when clips are
layered, so a clip that turns a friend by 90 turns one already side-on to face
away. Side-on, a positive `armL`, `elbowL` or `legL` swings that limb forward,
on either side, so a wave reaches forward and a walk strides
(`PhyFriends.anim.walking(u, steps, { distance, facing })` keeps the planted
foot still side-on as well); from behind, the friend being its own mirror image,
`armL` is the arm on the viewer's right.

A head turn (`turnX`, `turnY`) is faked with per-layer parallax: ears and the
tail slide back, while the face, eyes and hair slide forward. That gives a
convincing 2.5D head turn for look-at effects.

```js
const rig = PhyFriends.mount(document.querySelector('#box'), 'howdi');
rig.setPose({ lookX: 0.8, turnX: 0.5, eyes: 'happy' });
```

## Feelings

`lib/fwiends/src/emotion.js` (`PhyFriends.emotion`) shows how a friend feels
with the parts every friend drawn on the house template has, so every feeling
works on every one of them without a new drawing. There are twenty-three,
listed from the pleased to the drowsy: happy, excited, laughing, playful,
fond, content, relieved, proud, determined, inspired, curious, thoughtful,
shy, surprised, confused, nervous, scared, cross, dizzy, bored, sad, sleepy
and asleep. Each comes in four forms, all partial poses that layer over a
friend's idle clip:

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
up by the face when excited and in front of it when scared, together when shy
or nervous, clasped under the chin when fond, on the hips when proud; fists at
the chest when determined; a paw raised beside the head when inspired, by a
winking eye when playful, at the chin when thoughtful and under it when
curious; the sides held when laughing, a shrug when confused, the arms out for
balance when dizzy and folded when cross. A friend takes less of them the lower
it is, and seated it ignores them. Most feelings have a mark, which a scene
shows with `feel()`: written in the hand (`!` for surprise, `??` when confused,
`z`, repeating, for sleep) or drawn in a line as thick as the hand's (a heart
when fond, a bead of sweat when relieved or nervous, a sparkle when excited, a
light bulb when inspired, a swirl when dizzy, and the `♪` of contentment, a
letter the hand lacks). `E.markMarkup(mark)` gives either as the markup for an
element whose font size is the mark's. `E.describe(name,
'Howdi')` gives a screen reader "Howdi looks surprised." What the code that
shows feelings needs to know of one, it asks the library: whether it turns a
friend inward, so that it stops following the pointer (`E.inward('shy')`), and
what a screen reader hears of the greeting (`E.describeGreeting('Howdi')`).
`anim`'s `parse` understands the four forms, so `pf.py anim howdi --clip
"layer(idle, hold('content'))"` films one, `tools/animate.html` plays any of
them on any friend, and `tools/feelings.html` shows every friend in every
feeling. `PhyFriends.anim.mirror(clip)` plays a clip toward the other side:
what turns one way turns the other, and each arm, leg, ear and eye changes
places with its pair.

Claude keeps every rule but the shape, and its ears are arms, so its spec sets
`emotions: false` (`E.fits('claude')` is false): given its spec, a feeling is
its movement alone, with no face (`E.react('surprised', { spec: 'claude' })`).
Its hi is the same hop with a smile alone (`E.smile('claude')`): the happy eyes
and mouth, without the blush or the posture.

## Alive on a page

`lib/fwiends/src/live.js` (`PhyFriends.live`) brings friends to life on an
ordinary page, as the gallery and the specimen's portrait are brought to life:

```js
const stage = PhyFriends.live.stage({ announcer: document.querySelector('.announcer') });
stage.add(document.querySelector('.portrait'), 'phy', { label: 'phy' });
stage.start();
```

Each friend rests on the bottom edge of its box, seated unless it is added
with `stance: 'stand'`; then it stays standing through a hi or a feeling, and
its ears reach further above the box. It breathes and blinks with the idle
clip, follows the pointer, answers a hi (a click, a tap, Enter or Space), and
feels what a visitor does to it (FWIENDS.md, "Saying hi"); the stage says what
happened in the page's live region (`.announcer`, in
`lib/style/site/pencil.css`). A box that is a button takes `role="button"`,
`tabindex="0"`, a short `aria-label` ("say hi to phy") and an
`aria-describedby` pointing at a `hidden` element that says what the friend
looks like. That element stands beside the box, not in it, since mounting
replaces what the box holds. The page keeps its own layout; the gallery's roll
call moves its friends and turns their eyes through two hooks on each friend,
`travel` and `watch` (another friend to look at, or a point on the screen),
and a friend's `smile()` lasts until the function it returns is called, as on
the gallery while a friend's owner's credit is pointed at. The stage's
`onStroke(friend, seconds)` tells a page how long a friend has been stroked;
on the gallery, stroking Terry for five seconds opens the tuning page
(`tools/tune.html`), on which his owner chose the proportions, and stroking
every friend that shows feelings, each at least once in one visit, opens the
feelings sheet (`tools/feelings.html`) once the last one's ♪ has shown.
Options fix a pointer, a hi or a feeling for screenshots (the gallery's
`?px=..&py=..`, `?hi=<name>` and `?feel=<feeling>`; a feeling so fixed returns
after a hi or a stroke) and set how long the friends wait before they doze
(`?doze=<seconds>`). Under reduced motion the friends keep still but for their
eyes; `PhyFriends.live.keepStill(checkbox)` gives a reader the same choice
("keep still"), remembered on the device in `live.still`, which every stage
follows unless given a `reducedMotion` of its own. A page loads
`lib/fwiends/src/phyfriends.js`, the characters, `lib/fwiends/src/anim.js`,
`lib/fwiends/src/emotion.js` and `lib/fwiends/src/live.js`, in that order.
`stage.sitStill(true)` holds every friend as still as reduced motion does
until `stage.sitStill(false)`, without touching the reader's setting.

## Workings

`lib/fwiends/src/workings.js` (`PhyFriends.workings`) shows how a page is
made, in blue pencil (`--blue-pencil`, STYLE.md §3), but only while the reader
asks; a page that does not load it has none of it, and one that does chooses
what it shows:

```js
PhyFriends.workings.attach({
  button,                           // shows and hides them; its aria-pressed follows
  stage,                            // whose friends sit still meanwhile
  friends: stage.friends,           // each drawn over with its construction
  notes: [{ at: title, place: 'above', text: 'the title, in the hand' }],
  reveal: [document.querySelector('#library')],   // the page's own, hidden until then
});
```

A friend's construction is the one its spec describes: an ellipse for the
head, the face and the body, a centre line, the line of the eyes with a stroke
for each eye, a triangle for each ear and the tail's spine
(`PhyFriends.workings.construction(name)` gives it alone, as SVG in head
space), drawn through the friend's own camera while its drawing fades. A note
stands `right`, `left`, `above` or `below` an element, or `over` it in place of
its text, and is left out where it would leave the window or outside its
`media` query. Notes are for the eye; what a reader needs goes in a revealed
element. Escape hides the workings. The gallery shows its own on "a hundred-odd
lines of code" (FWIENDS.md, "The workings").

## Workflows

1. **Reproduce an image**: make `lib/fwiends/characters/<name>/`, put the
   picture in its `examples/` as `ref.jpg`, write `<name>.js` with a
   `views.ref` camera matching the crop, and iterate with `pf.py compare
   <name>`. A new character joins the cast (`lib/fwiends/characters/cast.js`)
   and the gallery's list; `pf.py pages` then loads it in every page that
   shows them all and lays out the rows, and `pf.py test` holds it to the
   house contract (`test/contract.test.js`).
2. **Reproduce a design sheet**: crop each figure into `examples/`, add a view
   per figure, and compare against all of them at once; the portrait view is
   the canonical one.
3. **Animate**: pick or compose clips from `PhyFriends.anim` and feelings
   from `PhyFriends.emotion`, try them on every friend in `tools/animate.html`,
   and export with `pf.py anim`, or play them live in a page.
