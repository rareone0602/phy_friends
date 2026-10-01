# phy's fwiends: the gallery and its characters

This file adds what only this project needs to phy's style guide
(`STYLE.md`): the gallery page, its stage, the rules for drawing a friend
with `src/phyfriends.js`, and the rules for putting friends together in
films and games. If the two disagree, `STYLE.md` wins, unless this
file says why. The site's `style.html` shows both files, one after the other,
under a contents line for each. Every § in the text links to its section, and
section N of `STYLE.md` stays at `style.html#sN`. Run
`python3 tools/pf.py style` after editing either.

---

## the gallery page

The files are `index.html` (the gallery), `style.html` (the guides) and
`specimen.html` (the kit at work, with the dial to turn). All three wear
the kit, `site/notebook.css` (the paper) and `site/pencil.css` (the
pencil). The paper is design C from the mockups in `design/`; A and B are
kept in `design/backup/`.

The specimen shows the kit as a site wears it, at `50`. Its dial turns
the page to `0` or `100` and back, and a reload returns it to `50`. Only
the face turns: the chrome stays lower case at every stop, since case is
written rather than set (`STYLE.md` §3).

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
   ground and all watch the cursor. A mock disclaimer stands under the last
   of them.
5. The footer: "characters belong to the people named under them", the style
   guide and the source.

**The stage:**
- The stage is the one centred thing on the page, as the subject of a group
  photo stands in the middle of the frame. The rest keeps to the margin line.
  The stage is also the one wide thing: beside the margin line it runs to the
  paper's edge, and the page stops at 3159px.
- Every friend is drawn at the same scale, in a box 270 head units tall whose
  bottom edge is the friend's `rig.ground`. The box is a whole number of
  rules, so the ground stays on a rule: 5 rules. The smallest phones, below
  360px, take 4, so two fwiends still stand side by side.
- Ears and tails may reach outside the box, as in a photo. A body or tail
  that sticks out at ground level widens that friend's slot
  (`--reach-left` and `--reach-right`, measured on load), so neighbours stand
  close but never tread on a tail. Below 420px there is no room, and a tail
  reaches into the gap beside the pair.
- All seventeen stand in one row from a 3159px window, where the page stops
  growing. The seventeen reaches add up to 827 head units and neighbours
  overlap by 0.06 of a box, so the row is 19.04 boxes wide. Narrower, they
  stand eight to a row, from a 1568px window, with Claude, the last, alone
  under the rest, and in rows of five, from a 1022px window, where jiaoyue
  and Claude share the last. Either way the second row stands on its rule
  768px down the page, so a window at least that tall shows two rows of
  friends. Below that they stand four to a row, with Claude alone again,
  below an 846px window three to a row, where jiaoyue and Claude share the
  last, and below a 586px window in pairs, never a mix of pairs and threes,
  with Claude alone.
- The order is phy's. Howdi, YuanYuan and phy come first, side by side at
  every width; Fruit stands next to Yuda, Raze between cowosus and
  tanyuan, and jiaoyue after Alfie; and on a phone Yuda shares a row with
  Terry, and Brian with mumuyou. A new fwiend, or a change of order,
  is checked at every width, since a row that breaks in the wrong place
  parts neighbours.
- A phone held sideways, if it is at least 390px tall, still shows the
  first row and its names on the first screen. The kit gives it the
  phone's header; the gallery, having no portrait to reach into it, gives
  up the blank rule above the title, and the note the one below it.
- Each friend's ground is its own patch of rule, gone over in pencil: a
  seeded wobble (`PhyFriends.rng(5)`), ink at 70%, 1.4px, through the
  graphite filter.
- In forced colours the page takes the system's background, so each friend
  is drawn on a sheet of paper cut to its outline (`STYLE.md` §9), and its
  ground is in the system's text colour.
- The ring circles the host's name, phy's: "this one" is the one whose
  page it is. The nav's ring marks the page, as it does everywhere.
- The mock disclaimer is about the last fwiend, Claude, the machine that
  made the page: "this work was generated entirely by this machine", then
  "human intelligence was confined to the characters and the corrections."
  It sits in small print on the rules under the last row, a blank rule below
  the labels, and its first line ends in the kit's arrow, turned to point up
  at Claude from under its middle (measured on load, as the reaches are), as
  the ring marks the host. Where Claude stands alone, its middle is the
  page's, and ending the line there would squeeze both sentences into the
  left half; so the disclaimer is centred under it, and the arrow turns to
  point up and in at it. Each sentence is a line of its own, balanced
  where it wraps. A fwiend added later goes before Claude, so that the
  disclaimer stays under the machine.
- A pencilled note says what to do: "psst: they watch your cursor. click one
  to say hi". It sits on the rule under the nav, over the right end of the
  row with one blank rule below, so it is read before the fwiends and is on
  the first screen of every device. Being one long line, it takes the
  title's tilt, `−1°`, rather than a margin note's `−2°`, at which its far end
  would climb half a rule; and sitting so close, it needs no arrow. Where
  fewer than five stand in a row it is only "click one to say hi", and touch
  screens, which have no cursor, read "tap one to say hi".
- On the note's rule, at the left under the nav, a checkbox in small print
  says "keep still". Ticked, it keeps the fwiends as still as reduced motion
  does (below) and skips the opening. It starts as the system's setting,
  the reader's choice is remembered on the device, and the specimen's
  portrait keeps to it too. On a phone held sideways, where the tallest
  ears reach into the note's rule, it moves up to the right end of the
  nav's. Without JavaScript it is not shown, since it would do nothing.
- Each fwiend has a link of its own, to send its owner: `index.html#yuda`,
  its name as the page writes it, in lower case (`#k3v1n`). The link skips
  the opening, brings the fwiend into view and focus, and it says hi.
- Without JavaScript: "the fwiends are drawn live, so they need JavaScript
  to appear."

**Labels.** Each friend has a small label, three rules tall:
- the name in the hand, `31px` (`26px` on phones, `22px` on the smallest):
  a step up the scale from an h3, because it is read under a picture from
  further away;
- the species in small print, two or three lower-case words ("tuxedo
  eevee", "yellow plush toy");
- a credit line in small print: the owner's handle, linking to their page.
  phy's reads "that's me · linkedin", on two lines on a phone.

On the smallest phones a long species or handle wraps onto a second rule
rather than running into its neighbour's.

Both small-print lines are in `--ink-2`; the credit is told apart by being a
link.

Each friend is a button, and its name (`aria-label`) is kept short, so that
a screen reader moving from friend to friend, or a visitor who says hi by
voice, gets to the point: "say hi to Terry". What the friend looks like is
its description, a hidden line the button points to (`aria-describedby`):
"a yellow plush toy with huge floppy ears, a fluffy bib and dark felt
soles". The specimen's portrait is named and described the same way.

The cast (`characters/cast.js`) is the source of these facts, and the page
repeats them by hand: each label's name, species and credit, the name in
the `aria-label`, the host, and the names in the link preview's alt text, in
the gallery's order. `python3 tools/pf.py test` names the friend and the
field wherever the two disagree, and fails any friend whose owner has not
agreed to the gallery.

Names keep their owner's capitalisation: **Howdi**, **Fruit**, **Yuda**,
**Terry**, **Brian**, **Teni**, **Alfie**, **Raze** and **Claude** are
capitalised; **YuanYuan** and **BarDell** have two capitals; **phy**,
**mumuyou**, **cowosus**, **tanyuan** and **jiaoyue** are always lower case,
even at the start of a line; and **K3V1N** is spelt with a 3 and a 1.

**The copy**, against what it isn't:

| do | don't |
|---|---|
| that's me | Meet phy, the creator behind it all! |
| click one to say hi | Click a character to interact! |
| a few fwiends in coloured pencil, each one drawn from a hundred-odd lines of code. | Welcome to a magical world of adorable characters |
| characters belong to the people named under them | All rights reserved. |

The "psst" and the disclaimer are the page's two winks, both in corners of
the stage (`STYLE.md` §3): one over the right end of the row, the other
under its last fwiend.

**Saying hi, and how they take it.** The fwiends are brought to life by
`src/live.js`, which any page can use (the specimen's portrait does), and
their feelings come from the emotion library, one rule each:
- Hovering over a friend (or tabbing to it) perks it up: ears in, eyes a
  touch wider. It stays perked while either lasts, click or no click. Kept
  there for a moment and it grows curious: its head tilts one way, then the
  other.
- A click, a tap, Enter or Space says hi, with the emotion library's hop for
  joy: happy eyes, a small mouth, two bounces. The other fwiends glance at
  the one being greeted.
- A third hi within six seconds of the first makes a friend shy instead: it
  blushes, ducks and looks away for a moment, and takes no notice of
  another hi until it recovers.
- Stroking a friend makes it content: it shuts its eyes happily, and a ♪
  shows once. The pointer or a finger moved back and forth over it strokes
  it, as do ← and → pressed in turn on a fwiend tabbed to, and a finger held
  still on it for half a second; the tap that ends a long press is not a
  hi.
- Left alone for 30 seconds, the fwiends grow sleepy one by one and fall
  asleep, a z drifting up from each now and then. Claude, a machine, stays
  up. Any input wakes them: those asleep start, with a "!", nearest the
  pointer first.
- Claude shows no feelings. It perks up, watches and hops like the others,
  and returns a hi with the same smile, which is manners rather than a
  feeling; none of the feelings above touch it. Its third hi in a row,
  where the others go shy, plays the routine of Claude Code's animated
  mascot instead, timed as the mascot's GIF times it: it winks as it steps
  aside, swings its laptop up and sets it down open beside it, hops round
  to sit at it side-on and types, then folds it away and turns back.
  Meanwhile it ignores a hi and keeps its eyes on the laptop, and the
  others watch it. Under reduced motion it only winks.
- A friend in mid-air ignores another hi until it lands, and a key held down
  says hi once. Starting the hop again would drop it to the ground in one
  frame.
- A hidden status line tells a screen reader what happened, in one flat
  sentence: "Howdi hops twice.", or "Howdi smiles." under reduced motion;
  "Howdi goes shy.", "Howdi looks content.", "Claude gets out its laptop
  and types." (or "Claude winks." under reduced motion), "Everyone but
  Claude falls asleep." and "Everyone wakes up." Names keep their owner's case: "phy
  hops twice." Falling asleep is told once a visit, and a wake is not told
  when the reader only moves about the page (a scroll, or Tab, the arrows
  and the like), so that the line never talks over the screen reader's
  own account of the move.
- A double-click or a long press on a friend selects nothing and opens no
  menu, and a quick second tap doesn't zoom the page. The labels stay
  selectable, so a handle can still be copied.

**The opening.** The first time the page opens in a tab, the title writes
itself and the fwiends come in by roll call. A reload, a step back through
the history, a link to a fwiend, reduced motion, "keep still" and the link
preview show everything in place.
- The title is written stroke by stroke, in the order a hand writes each
  letter, in just under three seconds. The pen slows at each end of a
  stroke and lifts between strokes, which gives it a hand's rhythm.
  `src/pen.js` does the writing; `python3 tools/title_pen.py` derives the
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
- A row is called once any of it comes into view. A row just below the fold
  comes in with only its ears showing, which draws the eye down, and on a
  phone the lower rows come in as they are scrolled to. A row scrolled past
  unseen is simply there, as are the rows still to come once the fwiends
  doze off.
- A click or a tap anywhere, Escape, a change in the window's width, or
  tabbing to a fwiend still to come, brings everyone in at once and shows
  the title written. Scrolling does not, since on a phone the lower rows
  are meant to come in as they are scrolled to.

**The link preview and icons** come from `python3 tools/site_assets.py`, run
after any character changes:
- the favicon is phy's head;
- the preview (1200×630) is a snapshot of the page with the whole set. The
  page is photographed at 3159×1659, the same shape, and scaled down, because
  3159px is the narrowest window where all seventeen stand in one row; narrower,
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
- Clothes take their thickness from how they are made, never from a
  texture: a band that stands a few units proud of the body (YuanYuan's
  sash, the roll of tanyuan's hood), and cloth that lies over cloth (a
  crossed collar, a front over its hem). Painted on to the body's ellipse,
  clothes read as a print on a ball.
- `pencil: false` draws the flat shapes alone. It is only for an icon too
  small to hold the texture, and for matching a flat reference picture, as
  `pf.py compare` does.
- Every colour is one the character really has: fur, hair, markings,
  accessories. A band the owner counts as a marking (phy's crest) is a
  colour, not shading.
- A few colours, each with a named role in `palette`: `fur`, `face`, `hair`,
  `earInner`, `eye`, `blush`, `chest`, … The current seventeen use 3–13
  each, plus `bg` (`#1c1d21`, the same for all).
- **Exactly one shade layer** (`STYLE.md`, principle 5). `<name>Shade` is
  derived by the library from `<name>` with `PhyFriends.shadeOf`: CIELAB L*
  `−10`, chroma `×1.2`, the same hue, and near-whites lean to lavender. The
  shades therefore match across fwiends.
  - Every friend has the layer, and none has a second. The body sits under
    the head, so every body is in its fur's shade, or in its clothes' shade
    where it is dressed (tanyuan's hoodie, YuanYuan's yukata). A layer of
    the clothes that lies over it takes the clothes' own colour: YuanYuan's
    top panel, the fronts of tanyuan's and Raze's hoodies.
  - Elsewhere the shade goes only on a part behind a neighbour of the same
    colour: Terry's ears behind the face, the back layer of a ruff, locks of
    hair behind the mop, a bandana's band behind its point, the part of
    tanyuan's folded ear under its flap, the inside of his hood past its
    rim (and of Raze's), the hem under his hoodie's front, the under band of YuanYuan's
    collar, the bow behind his sash and the side of Claude's block, which
    shows as it turns to its laptop.
  - A spec sets a shade by hand only where the derived one looks wrong, and
    says so in a comment: mumuyou's gold hair.
  - Where a shade lands on a neighbouring colour, the neighbour moves, not the
    shade: phy's crumb went a step darker, so the tail's biscuit base stays
    apart from the shaded hip.
- Nothing is copied from a reference's lighting: no pale rim along an ear, no
  darker far side, no highlights.
- A pale colour that would vanish on paper takes one slightly deeper tint
  wherever it appears (the white of mumuyou, tanyuan, YuanYuan, Alfie,
  cowosus, jiaoyue and Raze's headphones, `#efeef3`; Teni's pale teal, `#ace1e0`). The pencil lets the paper
  through, so judge it on the page, not on a flat render. A dark colour
  whose shade would read as black takes the lightest tint its pictures
  give it instead: Fruit's navy, `#283e74`, is the moon picture's.

**Proportions, in head space:** a big head on a small body, seated or
standing.
- The origin sits between the eyes. The head is widest around eye level,
  about 140–190 units across the cheeks.
- Ear tips reach about −155 (floppy ears less), and the paws reach
  `rig.ground`, about +131. A tail may curl out to one side.
- The eyes are about 13 × 32 units, centred 31–35 either side of the origin.
- Standing, a friend keeps its seated body and stands it on two short plush
  legs, which show 22 units below it, with two short arms hung high on its
  sides and well out from them. From the back: the body with its clothes, the
  scarf (a ruff or bib of fur round the neck, or a scarf, extras on `scarf`),
  the head, whose chin lies over the scarf and the collar, then the arms, in
  front of all of them, except at the shoulder, which tucks under the scarf
  and the head (the paws never do). A hood is clothing, so it lies under the
  arms, and a sleeve takes its cloth's house shade, so that it shows against
  the garment's front, which is in the cloth's own colour. Its feet touch
  `stand.ground`, the body's bottom plus 22 (about +153 in its own space), and
  the rig lifts it by the difference, so that its feet stand where its seated
  paws did. Every friend is one figure, which sits on the same limbs: its arms
  hang straight down in front of it, as forelegs, from the middle of its body
  to the paws of its own seated drawing (`stand.seat`), and its legs fold into
  that drawing's feet. So it stands up and sits down through every height
  between, with nothing appearing or vanishing: the arms slide under the scarf
  as it rises, and a sole that faces us while it sits flattens.
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
  Howdi's blue, tanyuan's red and Alfie's amber do; mumuyou's pale sky and
  lemon go further, to a blue and a gold that hold their own on his white
  face, cowosus's pale blue to a teal, and jiaoyue's to a sky blue. On a dark
  face the step goes the other way: Raze's irises, a deeper teal and purple,
  would be faint on his dark teal, so his eyes take the cyan and lavender that
  rim them. Eyes of two colours take the other through `eyes.right`:
  mumuyou's, K3V1N's, Brian's and Raze's. An eye its
  owner draws in two colours keeps both, flat, the second as a mark clipped
  to the eye (`shine`), so that it glances and blinks with it: the orange
  lower quarter of cowosus's left eye, and the mint and yellow lower halves
  of K3V1N's, which keep his colour bar's own tints because the blue and
  orange above them hold the eye's shape. The palette keeps `eye`, a
  near-black, for the open mouth;
- soft **blush** ovals, in the owner's colour if they have one (Yuda's is blue,
  `#a9dbf3`);
- no nose, and no mouth by default.

**Layering:** ears, head, face mask, blush, eyes, mouth, then hair on top.
Bangs may cross the face.

**Feelings come from the pose, not from new drawings.** The emotion library
(`src/emotion.js`) has eleven, each shown with the parts every fwiend on the
house template has: the eye shapes (`happy`, `closed`, `squint`), a lid held
over the open eyes (`lid`, slanted by `lidTilt` for a sad or a cross look),
the blush spreading (`flush`), a mouth (`w`, `smile`, `frown`, `o`, `open`),
the ears, the tail and the posture, and, standing, the arms and a gesture
(paws on the hips when proud). So a spec needs nothing for its
feelings, and a new fwiend has them all. A feeling's body language follows
from how pleasant and how alert it is, so feelings that sit close look
alike. `eyes.arc` and `eyes.stroke` set how wide and thick the happy and
closed strokes are.

**Keep the spec small.** Tune the `fluffy`, `star` and ear parameters rather
than writing raw `nodes`. A new friend matches the set in size and in the
spec's structure as well as in its look.

**Claude, the exception.** The last fwiend is Claude, the
model that drew the others, as Claude Code draws it on its welcome screen:
three lines of block characters. It keeps every rule above but the shape.
Its figure comes from the glyphs. A terminal cell is about twice as tall as
it is wide, so a quadrant pixel is one unit wide and two tall, drawn 16 head
units to the unit, which makes the eyes as tall as the house's: a terracotta
block whose body is its head, pill eyes where the glyphs cut their notches,
a stub of an arm on each side and four short legs. Being made of blocks, it
is drawn in raw `nodes`, rounded as a pencil rounds them: its top corners
are soft and its bottom ones nearly square, so that its sides run straight
into its outer legs. Its arms take the place of ears and are in its own
colour, as the glyphs draw them; each turns about a shoulder inside the
block, so that the arms rise as it hops. It moves as the others do but
shows no feelings: its spec sets `emotions: false`, so the emotion library
gives it a feeling's movement without the face. It smiles only to greet,
with the happy eyes and mouth and without the blush. Its legs are
its body, in its one house shade. Its eyes look a whole unit aside (16 head
units, where the house's move 6), as the glyphs move the notches, and its
blush is a soft rose, since a pale pink on terracotta reads as a highlight.
Having no tail, it does not sway. It is short, so its legs meet the ground
at 112 rather than about 131. Standing already on its four legs, it never
stands up (`stand: false`) and keeps its shape in either stance. Its laptop, which it brings out in its
routine, is a gray base and screen drawn only on cue (an extra's `show`),
on its arm while held and on the ground (`on: 'ground'`) once set down,
where it stays while Claude hops; set down, it reaches a little past
Claude's box, into the space after the last fwiend of a row, and while it
is out the page clips sideways, as during the roll call. Its
species is "language model", its pronoun is "it", and its credit is
Anthropic's.

**Motion on the page:**
- Each friend works out the direction from its own head to the pointer, so
  the group converges on it. The eyes take the full offset (`lookX/lookY`);
  the head turns about half as much (`turnX/turnY`, drawn as layer parallax).
- Idle underneath, the library's idle clip, as in a scene: breathing,
  blinks at irregular intervals, a slow sway of the head and tail, a glance
  about now and then and an occasional ear flick, on an 8-second loop that
  each fwiend starts at a different point. A fwiend added standing also
  breathes with its arms and shifts its weight slowly from foot to foot. The glances
  give way whenever there is something to look at. The pencil "boils": its
  texture is redrawn 8 times a second, cycling through three versions, as in
  hand-drawn animation.
- When the pointer leaves the window, or sits still for a while, the fwiends
  drift back to centre or glance around, unless one has been tabbed to: then
  the others look at it. A pen is followed like a mouse. On
  touch screens they follow the finger while it touches; there is no
  gyroscope.
- The stage stops drawing while none of it is in view, or the page is
  hidden, to spare a phone's battery. It keeps its own clock, which stops
  with it, so everything picks up where it left off.
- With `prefers-reduced-motion`, or "keep still" ticked: eyes only, no idle
  motion, a still pencil, and a hi or a feeling changes just the face (the
  eye and mouth shapes, the lids and the blush). A fwiend added standing
  stays standing, since its stance belongs to the story rather than the
  motion. Marks neither pop nor
  drift, and the stage draws only as often as the pencil would boil.

## scenes: films and games

Beyond the gallery, the fwiends appear in scenes built with
`film/scene.js`: short films, listed in `demo/index.html`, and in time
games. A scene is a sheet of ruled paper measured in head units, a rule
every 54, so a seated fwiend is five rules tall, as in the gallery.
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
  personality, a birthday or any other fact its owner didn't give it. A
  mark is written in the hand pressed harder, bold (`600`) in `--ink-2`,
  so that it reads at a glance in the gallery as in a film.
- **Feelings are reactions, not temperaments.** Every fwiend feels with
  the same library, and a feeling answers something that happens in the
  scene (`actor.feel('surprised', { at })`, with its mark). Nobody is shy,
  cross or sleepy by nature.
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
- Seated fwiends get about by hopping. Standing ones walk: facing us, the
  foot on the side they go to steps out and the other closes up, and the
  body glides on up to twice as far as the feet, at a little under half a
  hop's speed. A fwiend stands up and sits down through every height
  between, its legs unfolding or folding under it, so that the change never
  pops. They turn with `turnX`,
  never with a mirror image, which would swap two-coloured eyes and reverse
  K3V1N's mark.
- Each fwiend is drawn on its own piece of paper, cut to its outline: its
  pencil stays put while it breathes, turns or hops on the spot, and
  travels with it when it moves about the page (`STYLE.md` §9).
- Films boil as the gallery does, 8 times a second (`film/film.js`), and
  keep still under reduced motion.
- Under `prefers-reduced-motion` a scene plays no idle motion, travel
  becomes a glide and a greeting or a feeling changes only the face; a film
  shows its last frame and waits to be played. A fwiend that stands keeps
  standing, since its stance belongs to the story rather than the motion,
  but it stands up or sits down in a cut.

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
