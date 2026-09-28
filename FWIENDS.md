# phy's fwiends: the gallery and its characters

This file adds what only this project needs to phy's style guide
(`STYLE.md`): the gallery page, its stage, and the rules for drawing a friend
with `src/phyfriends.js`. If the two disagree, `STYLE.md` wins, unless this
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
  paper's edge, and the page stops at 1720px.
- Every friend is drawn at the same scale, in a box 270 head units tall whose
  bottom edge is the friend's `rig.ground`. The box is a whole number of
  rules, so the ground stays on a rule: 5 rules, and 6 once a row of seven
  has room, from about 1670px. The smallest phones, below 360px, take 4, so
  two fwiends still stand side by side.
- Ears and tails may reach outside the box, as in a photo. A body or tail
  that sticks out at ground level widens that friend's slot
  (`--reach-left` and `--reach-right`, measured on load), so neighbours stand
  close but never tread on a tail. Below 420px there is no room, and a tail
  reaches into the gap beside the pair.
- All seven stand in one row from about 1410px. The seven reaches add up to
  410 head units and neighbours overlap by 0.06 of a box, so the row is 8.1
  boxes wide. Narrower, a row holds at most four, so the seven split four and
  three, at 5 rules so that both rows fit a laptop's first screen; below
  about 830px they stand three to a row, and on phones two.
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
  fewer than seven stand in a row it is only "click one to say hi", and touch
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

Names keep their owner's capitalisation: **Howdi**, **Yuda** and **Terry**
are capitalised; **phy** and **mumuyou** are always lower case, even at the
start of a line.

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

**The link preview and icons** come from `python3 design/site_assets.py`, run
after any character changes:
- the favicon is phy's head;
- the preview (1200×630) is a snapshot of the page with the whole set. The
  page is photographed at 1440×756, the same shape, and scaled down, because
  1440px is the narrowest common window where all seven stand in one row;
  at 1200px the second row would fall out of the picture.

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
  `earInner`, `eye`, `blush`, `chest`, … The current seven use 6–12 each, plus
  `bg` (`#1c1d21`, the same for all).
- **Exactly one shade layer** (`STYLE.md`, principle 5). `<name>Shade` is
  derived by the library from `<name>` with `PhyFriends.shadeOf`: CIELAB L*
  `−10`, chroma `×1.2`, the same hue, and near-whites lean to lavender. The
  shades therefore match across fwiends.
  - Every friend has the layer, and none has a second. The body sits under
    the head, so every body is in its fur's shade.
  - Elsewhere the shade goes only on a part behind a neighbour of the same
    colour: Terry's ears behind the face, the back layer of a ruff, locks of
    hair behind the mop, a bandana's band behind its point.
  - A spec sets a shade by hand only where the derived one looks wrong, and
    says so in a comment: mumuyou's gold hair, and Howdi's navy, whose
    derived shade is nearly black.
  - Where a shade lands on a neighbouring colour, the neighbour moves, not the
    shade: phy's crumb went a step darker, so the tail's cookie base stays
    apart from the shaded hip.
- Nothing is copied from a reference's lighting: no pale rim along an ear, no
  darker far side, no highlights.
- A pale colour that would vanish on paper takes one slightly deeper tint
  wherever it appears (mumuyou's white, `#efeef3`). The pencil lets the paper
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
  draws dark eyes, as Howdi's and Terry's does, they are near-black. A colour
  that would be faint at gallery size goes one house step deeper, as phy's
  green and mumuyou's gold do. Eyes of two colours take the other through
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
  sway, an occasional ear flick.
- When the pointer leaves the window, or sits still for a while, the fwiends
  drift back to centre or glance around. A pen is followed like a mouse. On
  touch screens they follow the finger while it touches; there is no
  gyroscope.
- The stage stops drawing while none of it is in view, or the page is
  hidden, to spare a phone's battery. It keeps its own clock, which stops
  with it, so everything picks up where it left off.
- With `prefers-reduced-motion`: eyes only, no idle motion, and saying hi
  changes just the face.

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
