# phy's fwiends: the gallery and its characters

This file adds what only this project needs to phy's style guide
(`STYLE.md`): the gallery page, the rules for drawing a friend with
`src/phyfriends.js`, and the rules for putting friends together in films and
games. Where the two disagree, `STYLE.md` wins unless this file says why.
The site's `style.html` shows both, one after the other, and section N of
`STYLE.md` stays at `style.html#sN`. Run `python3 tools/pf.py style` after
editing either.

---

## the gallery page

`index.html` (the gallery), `style.html` (the guides) and `specimen.html`
(the kit at work) all wear the kit. The paper is design C of the mockups in
`design/`; A and B are kept in `design/backup/`. The specimen sits at `50`,
and its dial turns the face, never the case, to `0` or `100` until a reload.
The gallery is a hobby project, so it sits at `100` (`STYLE.md` §5).

The page has five parts, in this order:
1. The title, `phy's fwiends`, in the hand: the project's name wherever
   people read it (`phy_friends` is only the repository's and the code's).
2. One line of intro: "a few fwiends in coloured pencil, each one drawn from a
   hundred-odd lines of code."
3. The nav, as on the other two pages: fwiends, style guide, specimen.
4. **The stage**, a group photo: the fwiends stand together on pencilled
   ground and all watch the cursor.
5. The footer: "characters belong to the people named under them"; a credit
   to Terry's owner, who tuned the fwiends' proportions by eye on the tuning
   page; the style guide; and the source.

**The stage:**
- It is the one centred and the one wide thing on the page, as the subject
  of a group photo is; the rest keeps to the margin line. Beside the margin
  line it runs to the paper's edge, and the page stops growing where every
  friend fits in one row.
- Every friend is drawn at one scale, in a box 270 head units tall whose
  bottom edge is its ground (`PhyFriends.groundOf`): 5 rules, or 4 below
  360px, so that two still stand side by side. Ears and tails may reach out
  of the box, as in a photo. A body or tail that sticks out at ground level
  widens the friend's slot (`--reach-left`, `--reach-right`, measured on
  load), so neighbours stand close but never tread on a tail; below 420px a
  pair stands a whole box apart instead, so that two long species never run
  together.
- Narrower than one row, they stand eight to a row, then five, four and
  three, and in pairs on a phone, never a mix of pairs and threes, so that the
  same friends always share a row. In rows of eight or five the second row's
  rule is 768px down, so a window that tall shows two rows.
  `python3 tools/pf.py pages` works out from the reaches (neighbours overlap
  by 0.06 of a box) how wide each split is and where the page stops, and
  writes them into the page; `python3 tools/pf.py test` fails while they are
  stale.
- The order is phy's. Howdi, YuanYuan and phy come first, side by side at
  every width; Fruit stands next to Yuda, WeiWei between K3V1N and BarDell,
  Raze between cowosus and tanyuan, and Alfie, Teni, WhiteDeer and jiaoyue
  follow tanyuan in that order; on a phone Yuda shares a row with Terry, and
  Brian with mumuyou. Claude stands last, so a new fwiend goes before it, and
  any change of order is checked at every width.
- A phone held sideways, if at least 390px tall, shows the first row and its
  names on the first screen: the gallery gives up the blank rule above the
  title, and the note the one below it.
- Each friend's ground is its own patch of rule, gone over in pencil (a
  seeded wobble, `PhyFriends.rng(5)`, ink at 70%, 1.4px, through the graphite
  filter). In forced colours each friend is drawn on paper cut to its outline
  (`STYLE.md` §9), and its ground is in the system's text colour.
- The ring circles the host's name, phy's: "this one" is the one whose page
  it is.
- **Two winks**, both in corners of the stage (`STYLE.md` §3). A pencilled
  note on the rule under the nav, over the right end of the row, says what to
  do: "psst: they watch your cursor. click one to say hi" (only "click one to
  say hi" where fewer than five stand in a row, and "tap" on touch screens).
  Being one long line, it takes the title's tilt, `−1°`, since at `−2°` its
  far end would climb half a rule. And a mock disclaimer about the last
  fwiend, Claude, the machine that made the page, in small print a blank rule
  under the last row's labels: "this work was generated entirely by this
  machine", then "human intelligence was confined to the characters and the
  corrections." Its first line ends in the kit's arrow, turned to point up at
  Claude's middle (measured on load); where Claude stands alone, the
  disclaimer is centred under it and the arrow points up and in.
- At the left of the note's rule, a small-print checkbox, "keep still", keeps
  the fwiends as still as reduced motion does and skips the opening. It
  starts as the system's setting, is remembered on the device, and on a phone
  held sideways moves up to the nav's rule. Without JavaScript it is hidden,
  and the stage reads "the fwiends are drawn live, so they need JavaScript to
  appear."
- Each fwiend has a link of its own to send its owner, `index.html#yuda`, its
  name in lower case (`#k3v1n`): it skips the opening, brings the fwiend into
  view and focus, and the fwiend says hi.

**Labels**, three rules tall: the name in the hand, `31px` (`26px` on phones,
`22px` on the smallest), a step above an h3, since it is read from further
away; the species in small print, two or three lower-case words ("tuxedo
eevee"); and the owner's handle in small print, linking to their page (phy's
reads "that's me · linkedin"). On the smallest phones a long species or
handle wraps onto a second rule rather than run into a neighbour.

Each friend is a button with a short name (`aria-label`), "say hi to Terry",
so that a screen reader or a voice gets to the point; what it looks like is a
hidden description (`aria-describedby`): "a yellow plush toy with huge floppy
ears, a fluffy bib and dark felt soles". The specimen's portrait is named and
described the same way.

The cast (`characters/cast.js`) is the source of each name, species, credit
and consent. The page repeats them by hand (the labels, the `aria-label`s,
the host, the footer's credit and the link preview's alt text);
`python3 tools/pf.py test` names the friend and field wherever the two
disagree, and fails any friend whose owner has not agreed to the gallery.
Every page that loads all the friends loads them in the cast's order, and
`python3 tools/pf.py pages` writes their script tags.

| do | don't |
|---|---|
| click one to say hi | Click a character to interact! |
| a few fwiends in coloured pencil, each one drawn from a hundred-odd lines of code. | Welcome to a magical world of adorable characters |
| characters belong to the people named under them | All rights reserved. |

**Saying hi, and how they take it.** `src/live.js`, which any page can use,
brings the fwiends to life, and their feelings come from the emotion library:
- Hovering over a friend, or tabbing to it, perks it up: ears in, eyes a touch
  wider. Kept there a moment, it grows curious and tilts its head one way,
  then the other.
- A click, a tap, Enter or Space says hi, with the hop for joy: happy eyes, a
  small mouth, two bounces, while the others glance at it. A friend in
  mid-air ignores another hi until it lands, since starting the hop again
  would drop it to the ground in one frame, and a key held down says hi once.
- A third hi within six seconds makes it shy instead: it blushes, ducks and
  looks away, and takes no notice of another hi until it recovers.
- Stroking makes it content: it shuts its eyes happily, and a ♪ shows once.
  The pointer or a finger moved back and forth strokes it, as do ← and →
  pressed in turn on a fwiend tabbed to, and a finger held still on it for
  half a second (the tap that ends a long press is not a hi).
- Left alone for 30 seconds, the fwiends grow sleepy one by one and fall
  asleep, a z drifting up now and then. Any input wakes them, with a "!",
  nearest the pointer first.
- Claude shows no feelings and stays awake. It perks up, watches and hops
  like the others, and returns a hi with the same smile, which is manners
  rather than a feeling. Its third hi, where the others go shy, plays the
  routine of Claude Code's animated mascot, timed as the mascot's GIF times
  it: a wink as it steps aside, its laptop swung up and set down open beside
  it, a hop round to type at it side-on, then the laptop folded away.
  Meanwhile it ignores a hi and the others watch it. Under reduced motion it
  only winks.
- A hidden status line tells a screen reader what happened in one flat
  sentence: "Howdi hops twice." ("Howdi smiles." under reduced motion),
  "Howdi goes shy.", "Howdi looks content.", "Claude gets out its laptop and
  types.", "Everyone but Claude falls asleep." (once a visit) and "Everyone
  wakes up.", which is not said when the reader only moves about the page, so
  that it never talks over the screen reader's own account.
- A double-click or a long press selects nothing and opens no menu, and a
  quick second tap doesn't zoom the page. The labels stay selectable, so a
  handle can still be copied.

**The opening.** The first time the page opens in a tab, the title writes
itself and the fwiends come in by roll call. A reload, a step back through
the history, a link to a fwiend, reduced motion, "keep still" and the link
preview show everything in place.
- The title is written stroke by stroke, in the order a hand writes each
  letter, in just under three seconds, slowing at each end of a stroke and
  lifting between strokes. `src/pen.js` writes it; `python3 tools/title_pen.py`
  derives the strokes (`site/title-pen.js`) from the title as the page sets
  it, and must run again if the title or its face changes. If the face is
  slow or doesn't match the strokes, or colours are forced, the title simply
  shows.
- As the pen reaches "fwiends", the friends hop in along their row's rule from
  the nearer edge of the screen, row by row, the one farthest from its edge
  first, so that nobody hops past anybody standing. The hops are a little
  lower than a scene's, so that ears clear the labels above, and neighbours
  watch each one land. The labels are there from the start, so the empty
  places read as the names still to be called.
- A row is called once any of it is in view; one just below the fold comes in
  with only its ears showing, which draws the eye down, and on a phone the
  lower rows come in as they are scrolled to. A row scrolled past unseen is
  simply there, as are the rows still to come once the fwiends doze off. A
  click, a tap, Escape, a change of width or tabbing to a fwiend still to
  come brings everyone in at once; scrolling does not.

**The favicon and link preview** come from `python3 tools/site_assets.py`, run
after any character changes: the favicon is phy's head, and the preview
(1200×630) is the page photographed in the narrowest window where every
friend stands in one row, then scaled down.

## drawing a friend

The factory (`src/phyfriends.js`) encodes these rules. A friend is a spec of
about 100 lines, a palette plus shape parameters, not a traced path. Before
turning someone's picture into one, ask the owner how the character is
written (the name's capitalisation, the species and the pronoun, "they"
until told), take one picture as the colour standard and say which, and keep
private references in a git-ignored `private/` folder.

**Coloured pencil** (`STYLE.md` §9):
- The one texture is the factory's pencil, which `render` and `mount` lay
  over the whole friend; a spec never draws a texture of its own.
  `pencil: false` draws the flat shapes alone, for an icon too small to hold
  the texture or to match a flat reference picture (`pf.py compare`).
- Clothes take their thickness from how they are made, never from a texture:
  a band standing a few units proud of the body (YuanYuan's sash, the roll of
  tanyuan's hood), or cloth lying over cloth (a crossed collar, a front over
  its hem). Painted on to the body's ellipse, clothes read as a print on a
  ball.
- Every colour is one the character really has: fur, hair, markings,
  accessories. A band the owner counts as a marking (phy's crest) is a
  colour, not shading.
- A few colours, 6–13, each with a named role in `palette`. Every fwiend but
  Claude opens with the same roles in the same order, one for each part of
  the house figure: `fur`, `head`, `face`, `hair`, `ear`, `earInner`, `iris`,
  `ink` (the mouth), `blush`, `tongue`, `body`, `tail`, `arm`, `paw`, `leg`
  and `foot`, with `earRight`, `irisRight` or `pawRight` where a pair
  differs. Each is a colour or the name of the role it shares (`paw: 'face'`).
  Markings and clothes follow, named for what they paint, and `bg`
  (`#1c1d21`) is the same for all.
- **Exactly one shade layer** (`STYLE.md`, principle 5). `<name>Shade` is
  derived from `<name>` by `PhyFriends.shadeOf`, so shades match across
  fwiends, and nothing comes from a reference's lighting: no pale rim along an
  ear, no darker far side, no highlights.
  - The body sits under the head, so every body is in its fur's shade, or its
    clothes' shade where it is dressed. A layer of the clothes lying over it
    takes the clothes' own colour, such as the front of a hoodie.
  - Elsewhere the shade goes only on a part behind a neighbour of the same
    colour: Terry's ears behind his face, the back layer of a ruff, locks
    behind the mop, the inside of a hood past its rim.
  - One part in front takes it instead: a raised paw, as far as it has come in
    front of the head or face (fading in as it crosses their edge), so that a
    paw the colour of the face still shows against it.
  - A spec sets a shade by hand only where the derived one looks wrong, and
    says so in a comment (mumuyou's gold hair). Where a shade lands on a
    neighbouring colour, the neighbour moves, not the shade: phy's crumb went a
    step darker, away from the shaded hip.
- A pale colour that would vanish on paper takes one slightly deeper tint
  wherever it appears: most whites become `#efeef3`, and phy's warm white
  `#f5ede6`. A dark colour whose shade would read as black takes the lightest
  tint its pictures give it (Fruit's navy, `#283e74`). Judge it on the page,
  not on a flat render, since the pencil lets the paper through.

**Proportions, in head space:** a big head on a small body.
- The origin sits between the eyes. The head is widest around eye level,
  about 140–190 units across the cheeks. Ear tips reach about −155 (floppy
  ears less), and the paws reach the ground (`PhyFriends.groundOf`), about
  +140. The eyes are about 13 × 32 units, centred 31–35 either side.
- **One figure sits and stands.** Standing, a friend keeps its seated body on
  two short plush legs that show 30 units below it, with arms hung high and
  well out from its sides; its feet touch `stand.ground`, and the rig lifts it
  so that they stand where its seated paws did. Seated, the same arms hang
  straight down in front as forelegs, to its seated paws (`stand.seat`), and
  the legs fold into its feet, so it stands up and sits down through every
  height between, with nothing appearing or vanishing.
- From the back: the body and its clothes, the scarf (a ruff or bib of fur, or
  a scarf), the head, whose chin lies over the scarf and collar, then the
  arms, except at the shoulder, which tucks under the scarf and head. A hood
  is clothing, so it lies under the arms, and a sleeve takes its cloth's
  shade, so that it shows against the garment's front.
- A reference in the house template (a 1254px close-up, head tipped 20°, as
  in the Grokbot Icon prompt's examples, which reviewers should know) is
  matched at `scale: 5.5` with the view `{w: 1254, h: 1254, x: 450, y: 835,
  scale: 5.5, rotate: 20}`.

**Shape vocabulary**, layered ears, head, face mask, blush, eyes, mouth, then
hair on top (bangs may cross the face):
- **fluffy ellipses** for the head, face mask and chest, whose outlines grow
  small curved tufts;
- **a star hair mop** of broad, curved, flame-like locks, some hanging over
  the face;
- **rounded-triangle ears**, with an inner ear and stripe bands only where
  the character really has them;
- **pill eyes**, one flat colour each, from the art (`iris`, and `irisRight`
  through `eyes.right` for a second colour): no whites, no highlight and no
  rim, which reads as an outline. Where the art draws dark eyes, as Terry's
  does, they are near-black. A colour that would be faint at gallery size
  goes a house step deeper, or further until it holds (phy's green; mumuyou's
  pale sky, to a blue), and on a dark face the step goes the other way (Raze's
  eyes take the cyan and lavender that rim them). An eye its owner draws in
  two colours keeps both, flat, the second a mark clipped to the eye
  (`shine`) that glances and blinks with it, as the lower half of K3V1N's
  does; it keeps its picture's own tint, since the colour above it holds the
  eye's shape. The palette's `eye`, a near-black, is for the open mouth;
- soft **blush** ovals, in the owner's colour if they have one (Yuda's is
  blue);
- no nose, and no mouth by default.

**Turning round comes from the spec, not from new drawings.** Every fwiend but
Claude turns as South Park's cut-outs do, a quarter turn at a time
(`pose.facing`): side-on to either side, or its back to the viewer, by rules
that every fwiend shares (`PhyFriends.TURN`), so a change to the body plan
turns with it. Where the true turn looks worse than a cheat, the cheat wins.
- Side-on, the face slides forwards and narrows, keeping a pale patch wide
  enough to read, with only its near eye (drawn over the hair), mouth, cheek
  and markings; the hair bends from the crown to the face, which a fringe
  follows; the ears close up and stand straighter, the far one in its shade;
  the body narrows, the far limbs go behind, and the tail grows from the back.
  Whatever lies on one side wraps round the near side and hides on the far one.
- From behind, a fwiend is its own mirror image: anything one-sided changes
  sides, the face hides but the chin keeps the head's outline, the ears show
  their backs in their shade, hair that covers the crown lies over the head,
  the arms hang beside it, and the tail is drawn over everything.
- A marking or a garment turns as its feature does (`ANATOMY.turns`): a bib
  goes to the front and hides from behind, a hood or wings go to the back,
  horns and antlers move with the ears, and glasses are left out once a
  fwiend turns, as is the custom in a side view. Name a feature for what it
  is and it turns rightly (the anchor on WhiteDeer's hat is a `badge`, which
  faces forwards); give an extra its own `turn` only where it lies otherwise
  (the pale lock on phy's forehead faces forwards). Teni's spec lights his
  back (`backLit`), so the back of his bob takes its own colour.
- A part that shows only from behind is drawn from the owner's own picture of
  the back (WhiteDeer's sailor-collar flap, the knot of Brian's bandana), and
  lies under the body facing the viewer, so the front is unchanged.
- A fwiend's own turn numbers (`turn` in its spec) are a last resort: a
  difference that several share belongs in the rules. The tuning page shows
  the side and the back.

**Feelings come from the pose, not from new drawings.** The emotion library
(`src/emotion.js`) has twenty-three, each made of parts every fwiend on the
house template has: the eye shapes (`happy`, `closed`, `squint` and the dizzy
`swirl`), a lid over the open eyes (`lid`, slanted by `lidTilt` for a sad or
cross look), the blush spreading (`flush`), a mouth (`w`, `smile`, `frown`,
`o`, `flat`, `wobble`, `open`), the ears, the tail and the posture, and,
standing, the arms and a gesture (paws on the hips when proud, a shrug when
confused). Each shape is drawn from the eye's or the mouth's own size and
colour, so a spec needs nothing for its feelings, and a new fwiend has them
all. Body language follows from how pleasant and how alert a feeling is, so
feelings that sit close look alike. `eyes.arc` and `eyes.stroke` set how wide
and thick the happy and closed strokes are.

**Keep the spec small.** Tune the `fluffy`, `star` and ear parameters rather
than writing raw `nodes`, and match the set in the spec's structure as well as
in its look.

**Claude, the exception.** The last fwiend is Claude, the model that drew the
others, as Claude Code draws it on its welcome screen: three lines of block
characters. It keeps every rule above but the shape, which comes from the
glyphs. A terminal cell is about twice as tall as it is wide, so a quadrant
pixel is one unit wide and two tall, drawn 16 head units to the unit, which
makes the eyes as tall as the house's: a terracotta block whose body is its
head, pill eyes where the glyphs cut their notches, a stub of an arm on each
side and four short legs.
- Being made of blocks, it is drawn in raw `nodes`, rounded as a pencil rounds
  them: soft top corners and nearly square bottom ones, so its sides run
  straight into its outer legs. Its arms take the place of ears, in its own
  colour, each turning about a shoulder inside the block so that they rise as
  it hops. Its legs are its body, in its one shade.
- It shows no feelings (`emotions: false`): a feeling gives it the movement
  without the face, and it smiles only to greet, with the happy eyes and mouth
  and without the blush. Its blush is a soft rose, since a pale pink on
  terracotta reads as a highlight, and its eyes look a whole unit aside (16
  head units, where the house's move 6), as the glyphs move the notches.
- Having no tail, it does not sway. It is short, so its legs meet the ground
  at 112 rather than about 131, and standing already on four legs, it never
  stands up (`stand: false`).
- Its laptop, for its routine, is a grey base and screen drawn only on cue (an
  extra's `show`): on its arm while held, then on the ground
  (`on: 'ground'`), where it stays while Claude hops. Set down, it reaches a
  little into the space after the last fwiend of a row, and while it is out
  the page clips sideways, as during the roll call.
- Its species is "language model", its pronoun "it", and its credit
  Anthropic's.

**Motion**, on the page and in a scene (`STYLE.md` §9):
- Idle, the library's clip plays underneath: breathing, blinks at irregular
  intervals, a slow sway of the head and tail, a glance about now and then and
  an occasional ear flick, on an 8-second loop that each fwiend starts at a
  different point. A fwiend standing also breathes with its arms and shifts
  its weight slowly from foot to foot. The pencil boils: its texture is
  redrawn 8 times a second, through three versions, as in hand-drawn
  animation.
- Each friend works out the direction from its own head to the pointer, so
  the group converges on it: the eyes take the whole offset (`lookX/lookY`),
  the head about half (`turnX/turnY`, drawn as layer parallax), and the
  glances give way whenever there is something to look at. When the pointer
  leaves or rests a while, they drift back to centre or glance about, unless
  one has been tabbed to: then the others look at it. A pen is followed like
  a mouse, and a finger while it touches; there is no gyroscope.
- The stage stops drawing while none of it is in view or the page is hidden,
  to spare a phone's battery. Its clock stops with it, so everything picks up
  where it left off.
- Under `prefers-reduced-motion`, or with "keep still" ticked: eyes only, no
  idle motion and a still pencil; a hi or a feeling changes just the face
  (the eye and mouth shapes, the lids and the blush), and marks neither pop
  nor drift. The stage draws only as often as the pencil would boil. A fwiend
  that stands stays standing, since its stance belongs to the story rather
  than the motion.

## scenes: films and games

Beyond the gallery, the fwiends appear in scenes built with `film/scene.js`:
short films, listed in `demo/index.html`, and in time games. A scene is a
sheet of ruled paper measured in head units, a rule every 54, so a seated
fwiend is five rules tall, as in the gallery. Everything happens at a time on
the scene's clock, so a film plays in a page and is filmed frame by frame
(`pf.py film`) from the same script.

**Who knows whom.** Every fwiend belongs to someone, and not every owner knows
every other one. phy, the host, knows everyone; any other two are strangers
until phy says their owners know each other (`characters/cast.js`). The scene
checks these rules and refuses to break them.

| | strangers | know each other |
|---|---|---|
| share a scene, take turns, look at each other, react to the same thing | yes | yes |
| greet from a distance | yes | yes |
| stand close, talk, hand something over, play on one side | no | yes |
| touch, compete head to head, tease | no | only if both owners opt in |

- Strangers keep a strip of paper between them, 40 head units between
  outlines (ears apart); fwiends who know each other may stand side by side.
  Choreograph so that nobody hops past anybody.
- **Only phy speaks in words.** The others speak in marks, since only their
  owners know how they talk: ! ? !? … z ??, and drawn ones, a ♪, a heart, a
  bead of sweat, a sparkle, a light bulb and a swirl. A mark is a drawing over
  a fwiend's head, not punctuation, so the calm punctuation of `STYLE.md` §3
  doesn't apply to it. It is written in the hand pressed harder, bold (`600`)
  in `--ink-2`, so that it reads at a glance; a drawn mark is a line as thick
  as that hand's stem, never filled, on the same baseline (the hand has no ♪,
  so the ♪ is drawn too). Likewise, nobody is given a personality, a birthday
  or any other fact its owner didn't give it.
- **Feelings are reactions, not temperaments.** A feeling answers something
  that happens in the scene (`actor.feel('surprised', { at })`, with its
  mark); nobody is shy, cross or sleepy by nature. Aimed at another fwiend, it
  follows the table: a heart or a fond look needs the two owners to know each
  other, and a wink or a laugh at another fwiend is teasing, which needs both
  to opt in. Aimed at a thing in the scene, any feeling will do.
- Nobody is hurt, frightened for a laugh or beaten by another fwiend. Games
  are won against the clock or the page; a miss ends with a fwiend sitting
  down, not falling over, nobody is blamed for it, and each fwiend keeps its
  own best score.
- **The owners are credited where a viewer can follow the link.** A page links
  each owner in its small print, and a frame may credit the owners of the
  fwiends in it on the bottom rule. A video need not, since a link in it
  cannot be clicked: it names the owners once, written large (in a roll call,
  say), and its post links them. Without the credits, recompose the frame, so
  that the bottom rule is not left as dead space.
- **Consent is per medium.** An owner who agreed to the gallery has not
  thereby agreed to films or games (`agreed` in `characters/cast.js`). Until
  they do, work that shows their fwiend carries the word "draft" in a corner,
  and `pf.py film` refuses to film it without `--draft`.
- **Getting about.** Seated fwiends hop. Standing ones walk: facing us, the
  foot on the side they go to steps out and the other closes up, and the body
  glides on up to twice as far as the feet, at a little under half a hop's
  speed. They turn with `turnX`, never with a mirror image, which would swap
  two-coloured eyes and reverse K3V1N's mark. Each is on its own paper, cut
  to its outline (`STYLE.md` §9).
- Films boil as the gallery does, 8 times a second (`film/film.js`). Under
  reduced motion a scene plays as the motion rules above say; travel becomes a
  glide, a fwiend stands up or sits down in a cut, and a film shows its last
  frame and waits to be played.
