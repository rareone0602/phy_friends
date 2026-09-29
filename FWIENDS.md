# phy's fwiends: the gallery and its characters

This file adds what only this project needs to phy's style guide
(`STYLE.md`): the gallery page, its stage, the rules for drawing a friend
with `src/phyfriends.js`, and the rules for putting friends together in
films and games. If the two disagree, `STYLE.md` wins, unless this
file says why. The site's `style.html` shows both files, one after the other;
run `python3 tools/pf.py style` after editing either.

---

## the gallery page

The files are `index.html` (the gallery), `style.html` (the guides) and
`specimen.html` (the kit at work). All three wear the kit, `site/notebook.css`
(the paper) and `site/pencil.css` (the pencil). The paper is
design C from the mockups in `design/`; A and B are kept in `design/backup/`.

The gallery is a hobby project, so it sits at `100`, the top of the dial
(`STYLE.md` §5): every letter is as informal as the face goes, big s and
all, and the hand bounces.

The page has five parts, in this order:
1. The title, `phy's fwiends`, in the hand. That is the project's name
   wherever people read it; `phy_friends` is only the repository and code
   name.
2. One line of intro: "a few fwiends in coloured pencil, each one drawn from a
   hundred-odd lines of code."
3. The nav, as on the other two pages: fwiends, style guide, specimen.
4. **The stage**, a group photo: the fwiends stand together on pencilled
   ground and all watch the cursor.
5. The footer: "characters belong to the people named under them", the style
   guide and the source, with a mock disclaimer on the last rule.

**The stage:**
- The stage is the one centred thing on the page, as the subject of a group
  photo stands in the middle of the frame. The rest keeps to the margin line.
  The stage is also the one wide thing: beside the margin line it runs to the
  paper's edge, and the page stops at 1767px.
- Every friend is drawn at the same scale, in a box 270 head units tall whose
  bottom edge is the friend's `rig.ground`. The box is a whole number of
  rules, so the ground stays on a rule: 5 rules. The smallest phones, below
  360px, take 4, so two fwiends still stand side by side.
- Ears and tails may reach outside the box, as in a photo. A body or tail
  that sticks out at ground level widens that friend's slot
  (`--reach-left` and `--reach-right`, measured on load), so neighbours stand
  close but never tread on a tail. Below 420px there is no room, and a tail
  reaches into the gap beside the pair.
- All nine stand in one row from a 1767px window, where the page stops
  growing. The nine reaches add up to 508 head units and neighbours overlap
  by 0.06 of a box, so the row is 10.3 boxes wide. Narrower, a row holds at
  most five, so the nine split five and four, and both rows fit a laptop's
  first screen. Below a 1025px window, where five no longer fit, they stand
  three to a row, so that no row is left with one fwiend, and on phones two.
- Each friend's ground is its own patch of rule, gone over in pencil: a
  seeded wobble (`PhyFriends.rng(5)`), ink at 70%, 1.4px, through the
  graphite filter.
- The ring circles the host's name, phy's: "this one" is the one whose
  page it is. The nav's ring marks the page, as it does everywhere.
- A pencilled note says what to do: "psst: they watch your cursor. click one
  to say hi". It sits on the rule under the nav, over the right end of the
  row with one blank rule below, so it is read before the fwiends and is on
  the first screen of every device. Being one long line, it takes the
  title's tilt, `−1°`, rather than a margin note's `−2°`, at which its far end
  would climb half a rule; and sitting so close, it needs no arrow. Where
  fewer than nine stand in a row it is only "click one to say hi", and touch
  screens, which have no cursor, read "tap one to say hi".
- Without JavaScript: "the fwiends are drawn live, so they need JavaScript
  to appear."

**Labels.** Each friend has a small label, three rules tall:
- the name in the hand, `31px` (`26px` on phones, `22px` on the smallest):
  a step up the scale from an h3, because it is read under a picture from
  further away;
- the species in small print, two or three lower-case words ("tuxedo
  eevee", "yellow plush toy");
- a credit line in small print: the owner's handle, linking to their page.
  phy's reads "that's me · @rareone0602", on two lines on a phone.

Both small-print lines are in `--ink-2`; the credit is told apart by being a
link.

Each friend is a button, and its `aria-label` says who it is in one line:
"say hi to Terry, a yellow plush toy with huge floppy ears, a fluffy bib and
dark felt soles".

Names keep their owner's capitalisation: **Howdi**, **Yuda**, **Terry**,
**Brian** and **Teni** are capitalised; **phy**, **mumuyou** and **tanyuan**
are always lower case, even at the start of a line; and **K3V1N** is spelt
with a 3 and a 1.

**The copy**, against what it isn't:

| do | don't |
|---|---|
| that's me | Meet phy, the creator behind it all! |
| click one to say hi | Click a character to interact! |
| a few fwiends in coloured pencil, each one drawn from a hundred-odd lines of code. | Welcome to a magical world of adorable characters |
| characters belong to the people named under them | All rights reserved. |

The "psst" and the footer's disclaimer are the page's two winks, both in
the corners (`STYLE.md` §3).

**Saying hi:**
- Hovering over a friend (or tabbing to it) perks it up: ears in, eyes a
  touch wider. It stays perked while either lasts, click or no click.
- A click, a tap, Enter or Space plays the library's happy hop: happy eyes,
  a small mouth, two bounces. The other fwiends glance at the one being
  greeted.
- A friend in mid-air ignores another hi until it lands, and a key held down
  says hi once. Starting the hop again would drop it to the ground in one
  frame.
- A hidden status line tells a screen reader what happened, in one flat
  sentence: "Howdi hops twice.", or "Howdi smiles." under reduced motion.
  Names keep their owner's case: "phy hops twice."
- A double-click or a long press on a friend selects nothing, and a quick
  second tap doesn't zoom the page. The labels stay selectable, so a handle
  can still be copied.

**The opening.** The first time the page opens in a tab, the title writes
itself and the fwiends come in by roll call. A reload, a step back through
the history, reduced motion and the link preview show everything in place.
- The title is written stroke by stroke, in the order a hand writes each
  letter, in about two and a half seconds. The pen slows at each end of a
  stroke and lifts between strokes, which gives it a hand's rhythm.
  `src/pen.js` does the writing; `python3 design/title_pen.py` derives the
  strokes (`site/title-pen.js`) from the title as the page sets it, and
  must be run again if the title or its face changes. Should the face be
  slow to arrive or not match the strokes, or colours be forced, the title
  simply shows.
- The fwiends begin to come in as the pen reaches "fwiends", and land one
  after another, row by row. Each hops in along its row's rule from the
  nearer edge of the screen, in hops a little lower than a scene's, so
  that ears clear the labels above. The one farthest from its edge comes
  first, so that nobody hops past anybody already standing. Its
  neighbours watch it land while it smiles; the rest keep watching the
  cursor.
- The labels are there from the start, so the empty places above them read
  as the names still to be called.
- A row is called once it comes into view, so on a phone the lower rows come
  in as they are scrolled to. A row scrolled past unseen is simply there.
- A change in the window's width, or tabbing to a fwiend still to come,
  brings everyone in at once.

**The link preview and icons** come from `python3 design/site_assets.py`, run
after any character changes:
- the favicon is phy's head;
- the preview (1200×630) is a snapshot of the page with the whole set. The
  page is photographed at 1767×928, the same shape, and scaled down, because
  1767px is the narrowest window where all nine stand in one row; narrower,
  the second row would fall out of the picture.

## drawing a friend

These are the rules the factory (`src/phyfriends.js`) encodes. A friend is a
spec of about 100 lines, a palette plus shape parameters, not a traced path.
Follow them when turning someone's picture or design sheet into a friend.

**Before starting:**
- Ask the owner how their character is written: its name's capitalisation,
  its species, and its pronoun (they, until told).
- Take one picture as the colour standard, and say which one.
- A friend appears only with its owner's consent, and its credit line names
  them.
- Keep private references (photos of a real pet, say) in a git-ignored
  `private/` folder. They are never published.

**Coloured pencil:**
- No outlines and no gradients. The one texture is the factory's pencil
  (`STYLE.md` §9), which `render` and `mount` lay over the whole friend. A
  spec never draws a texture of its own.
- `pencil: false` draws the flat shapes alone. It is only for an icon too
  small to hold the texture, and for matching a flat reference picture, as
  `pf.py compare` does.
- Every colour is one the character really has: fur, hair, markings,
  accessories. A band the owner counts as a marking (phy's crest) is a
  colour, not shading.
- A few colours, each with a named role in `palette`: `fur`, `face`, `hair`,
  `earInner`, `eye`, `blush`, `chest`, … The current nine use 6–12 each, plus
  `bg` (`#1c1d21`, the same for all).
- **Exactly one shade layer** (`STYLE.md`, principle 5). `<name>Shade` is
  derived by the library from `<name>` with `PhyFriends.shadeOf`: CIELAB L*
  `−10`, chroma `×1.2`, the same hue, and near-whites lean to lavender. The
  shades therefore match across fwiends.
  - Every friend has the layer, and none has a second. The body sits under
    the head, so every body is in its fur's shade, or in its clothes' shade
    where it is dressed (tanyuan's hoodie).
  - Elsewhere the shade goes only on a part behind a neighbour of the same
    colour: Terry's ears behind the face, the back layer of a ruff, locks of
    hair behind the mop, a bandana's band behind its point, the part of
    tanyuan's folded ear under its flap.
  - A spec sets a shade by hand only where the derived one looks wrong, and
    says so in a comment: mumuyou's gold hair.
  - Where a shade lands on a neighbouring colour, the neighbour moves, not the
    shade: phy's crumb went a step darker, so the tail's cookie base stays
    apart from the shaded hip.
- Nothing is copied from a reference's lighting: no pale rim along an ear, no
  darker far side, no highlights.
- A pale colour that would vanish on paper takes one slightly deeper tint
  wherever it appears (mumuyou's and tanyuan's white, `#efeef3`; Teni's pale
  teal, `#ace1e0`). The pencil lets the paper
  through, so judge it on the page, not on a flat render.

**Proportions, in head space:** a big head on a small, seated body.
- The origin sits between the eyes. The head is widest around eye level,
  about 140–190 units across the cheeks.
- Ear tips reach about −155 (floppy ears less), and the paws reach
  `rig.ground`, about +131. A tail may curl out to one side.
- The eyes are about 13 × 32 units, centred 31–35 either side of the origin.
- A reference in the house template (a 1254px close-up, head tipped 20°,
  as in the Grokbot Icon prompt's examples; reviewers should know them) is
  matched at `scale: 5.5` with the view `{w: 1254, h: 1254, x: 450, y: 835,
  scale: 5.5, rotate: 20}`.

**Shape vocabulary:**
- **fluffy ellipses** for the head, face mask and chest, whose outlines grow
  small curved tufts;
- **a star hair mop** of broad, curved, flame-like locks, some hanging over the
  face;
- **rounded-triangle ears**, with an inner ear and stripe bands only where the
  character really has them;
- **pill eyes** in the character's own eye colour: one flat colour per eye,
  with no whites, no highlight and no dark rim round the colour (a rim reads
  as an outline). The colour comes from the art (`eyes.color`); where the art
  draws dark eyes, as Terry's does, they are near-black. A colour that would
  be faint at gallery size goes one house step deeper, as phy's green,
  mumuyou's gold, Howdi's blue and tanyuan's red do. Eyes of two colours take the other through
  `eyes.right`: mumuyou's, K3V1N's and Brian's. The palette keeps `eye`, a
  near-black, for the open mouth;
- soft **blush** ovals, in the owner's colour if they have one (Yuda's is blue,
  `#a9dbf3`);
- no nose, and no mouth by default.

**Layering:** ears, head, face mask, blush, eyes, mouth, then hair on top.
Bangs may cross the face.

**Expressions come from the pose, not from new drawings:** `eyes: 'happy' |
'closed'`, `mouth`, `blink`, and ear angles. `eyes.arc` and `eyes.stroke`
set how wide and thick the happy and closed strokes are.

**Keep the spec small.** Tune the `fluffy`, `star` and ear parameters rather
than writing raw `nodes`. A new friend matches the set in size and in the
spec's structure as well as in its look.

**Motion on the page:**
- Each friend works out the direction from its own head to the pointer, so
  the group converges on it. The eyes take the full offset (`lookX/lookY`);
  the head turns about half as much (`turnX/turnY`, drawn as layer parallax).
- Idle underneath: breathing, blinks at irregular intervals, a slow tail
  sway, an occasional ear flick. The pencil "boils": its texture is redrawn
  8 times a second, cycling through three versions, as in hand-drawn
  animation.
- When the pointer leaves the window, or sits still for a while, the fwiends
  drift back to centre or glance around. A pen is followed like a mouse. On
  touch screens they follow the finger while it touches; there is no
  gyroscope.
- The stage stops drawing while none of it is in view, or the page is
  hidden, to spare a phone's battery. It keeps its own clock, which stops
  with it, so everything picks up where it left off.
- With `prefers-reduced-motion`: eyes only, no idle motion, a still
  pencil, and saying hi changes just the face.

## scenes: films and games

Beyond the gallery, the fwiends appear in scenes built with
`src/scene.js`: short films, listed in `demo/index.html`, and in time
games. A scene is a sheet of ruled paper measured in head units, a rule
every 54, so a fwiend stands five rules tall, as in the gallery.
Everything in it happens at a time on the scene's clock, so a film plays
in a page and is filmed frame by frame (`pf.py film`) from the same
script.

**Who knows whom.** Every fwiend belongs to someone, and not every owner
knows every other one. phy, the host, knows everyone; any other two are
strangers until phy says their owners know each other
(`characters/cast.js`). The scene checks these rules and refuses to break
them.

| | strangers | know each other |
|---|---|---|
| share a scene, take turns, look at each other, react to the same thing | yes | yes |
| greet from a distance | yes | yes |
| stand close, talk, hand something over, play on one side | no | yes |
| touch, compete head to head, tease | no | only if both owners opt in |

- Strangers keep a strip of paper between them, 40 head units between
  outlines (ears apart); fwiends who know each other may stand side by
  side. Choreograph so that nobody hops past anybody.
- **Only phy speaks in words.** The others speak in marks (! ? !? … ♪ z),
  since only their owners know how they talk. A mark is a drawing over a
  fwiend's head, not punctuation, so the calm punctuation of `STYLE.md` §3
  doesn't apply to it. Likewise, nobody is given a
  personality, a birthday or any other fact its owner didn't give it.
- Nobody is hurt, frightened for a laugh or beaten by another fwiend. Games
  are won against the clock or the page; a miss ends with a fwiend sitting
  down, not falling over or knocked out. Nobody is blamed for a miss, and
  each fwiend keeps its own best score, never set against another's.
- **Every frame credits** the owners of the fwiends in it, on the bottom
  rule, and the page links each owner in its small print. A game that plays
  only in the page may keep the credits to the small print.
- **Consent is per medium.** An owner who agreed to the gallery has not
  thereby agreed to films or games (`agreed` in `characters/cast.js`). Until
  they do, work that shows their fwiend carries the word "draft" in a
  corner, and `pf.py film` refuses to film it without `--draft`.

**Motion in a scene:**
- Fwiends get about by hopping, since they sit. They turn with `turnX`,
  never with a mirror image, which would swap two-coloured eyes and reverse
  K3V1N's mark.
- Each fwiend is drawn on its own piece of paper, cut to its outline: its
  pencil stays put while it breathes, turns or hops on the spot, and
  travels with it when it moves about the page (`STYLE.md` §9).
- Films boil as the gallery does, 8 times a second (`demo/film.js`), and
  keep still under reduced motion.
- Under `prefers-reduced-motion` a scene plays no idle motion, travel
  becomes a glide and a greeting changes only the face; a film shows its
  last frame and waits to be played.

---

## appendix: the gallery's original brief

Claude wrote this brief for the design agents from phy's first request: a
pencil font, and a design that isn't too artificial. It is kept so later
changes can be checked against it:

> A pencil font. Don't make the design too artificial: no glossy,
> over-designed, template-y "AI landing page" look (no gradients,
> glassmorphism, glows, heavy drop shadows, emoji bullets, marketing hero
> copy, generic SaaS card grids). Aim for handmade, honest and quiet, like a
> page of someone's sketchbook where the characters are the only saturated
> things on it. The fwiends stand together on one shared stage and all watch
> the cursor (falling back to a grid or rows on narrow screens), each with a
> small handwritten label: name, maybe species, and a credit/owner line.
