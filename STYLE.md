# phy's friends style guide

The one rule behind everything below: **a page from a sketchbook.** The
characters are the only saturated things on it; everything else is graphite on
paper. It should feel drawn, not designed.

Read this before building a page or adding a character. The site's
`style.html` is made from this file with `python3 tools/pf.py style`; run it
again after editing.

---

## 1. Principles

- **Handmade, honest, quiet.** Small, plain words and hand-drawn marks.
  Whitespace is part of the drawing.
- **Characters first.** If an element does not help you meet the characters,
  leave it out.
- **Slightly imperfect on purpose.** Tilt things ±1–2°, leave spacing a little
  uneven, and let lines wobble. Mechanical perfection is what makes a page
  look generated.

**Do:**
- paper as the background
- pencil handwriting for the title and labels
- hand-drawn ground lines, arrows and underlines
- lots of space

**Don't:**
- gradients, glassmorphism, glows, or heavy drop shadows
- emoji bullets or stock icons
- marketing hero copy or calls to action
- generic card grids
- perfectly aligned everything

## 2. Page

The page is a sheet of **lined notebook paper** (design C, chosen from the
mockups in `design/`; A and B are kept as backups in `design/backup/`). It has pale blue
rules, a red margin line on the left and a little paper tooth, and
**everything is written on the rules**:
- every vertical measure is a whole number of rules, and text sits on them;
- the friends' ground line is a rule, gone over in pencil;
- the rule spacing is 32px, or 30px on phones.

The files are `index.html` (the gallery), `style.html` (this guide) and
`site/notebook.css`, which the two share.

Each page has four parts, in this order:
1. A handwritten title: `phy's friends`. That is the project's name wherever
   people see it (titles, headings, labels, copy); `phy_friends` is only the
   repository and code name.
2. One short, honest line of intro.
3. **The stage.** It's a group photo: the friends stand together on one
   pencilled ground line and all watch the cursor.
   - Every friend is drawn at the same scale, with its own ground (`rig.ground`)
     on the line. The stage box is 7 rules tall, stepping down to 6, 5 and
     then 4 on narrow screens, so two friends still fit side by side on the
     smallest phones.
   - Ears and tails may reach outside a friend's box, as they would in a
     photo. A tail that sticks out at ground level gets room beside it.
   - On phones the friends stand in a row while they fit, then wrap onto
     more rows, each grounded on a rule.
   - A loose pencil ring circles one name: the host's, phy.
   - Every friend can be greeted (see §5). A pencilled note says so: in the
     margin beside the stage with an arrow, or one line under it on narrow
     screens ("click one to say hi", or "tap" on touch screens).
4. A small footer: who the characters belong to, a link to the style guide
   and a link to the repo.

Each character gets a small handwritten label:
- name
- species (optional)
- a credit line: the owner's handle, linking to their page (and the artist's,
  if someone else drew it). phy's reads "that's me". Other people's fursonas
  appear only with their owner's consent.

Names keep their owner's capitalisation: **Howdi** and **Yuda** are
capitalised, but **phy** is always lower case, even at the start of a line.
Everything else on the page is written in lower case.

## 3. Type

Two pencil hands, both from Google Fonts, and very little text:
- **Reenie Beanie** for the handwriting:
  - the title, 92px (66px on phones), three rules tall (two on phones), tilted
    by −1° and gone over with the graphite filter;
  - the friends' names, 36px (31px on phones);
  - headings on the style guide.
- **The Girl Next Door** for everything else:
  - the intro, 21px (17px on phones);
  - species, credits and the footer, 14–17px, in the lighter inks;
  - body text on the style guide, 18px.

The line height is always the rule spacing, and each block is nudged down a
few pixels so its baseline lands on a rule.

These fonts don't cover Chinese or Japanese; pick a companion font if CJK text
is ever needed.

## 4. Colour

Page chrome uses only paper and ink tones; saturated colour belongs to the
characters.
- paper `#fbf9f3`, with a fine noise overlay for tooth
- rules `#cfdbe8`, pale blue
- the margin line `#e6aaa3`, faded red
- ink `#3d3c39` (graphite) for the title and names, `#6d6a63` for the intro
  and species, and `#97938a` for credits and the footer

There is no dark theme: the page is paper. Backup B (`design/backup/b.html`)
shows a dark version, should that change.

## 5. Motion

- **Eye-follow:**
  - Each character works out the direction from its own head to the pointer,
    so the whole group converges on it.
  - The eyes take the full offset (`lookX/lookY`) and the head turns about
    half as much (`turnX/turnY`, drawn as layer parallax).
  - Motion is smoothed with a spring or lerp; it never jitters.
- **Idle underneath:** breathing, blinks at irregular intervals, a slow tail
  sway and an occasional ear flick. Nothing bounces all the time.
- **Pointer leaves the window** (or sits still for a while): they drift back
  to centre or glance around.
- **Touch:** follow the finger while touching, otherwise glance around. No
  gyroscope.
- **Saying hi:** each friend is a button. Hovering over it (or tabbing to it)
  perks it up: ears in, eyes a touch wider. A click, a tap, Enter or Space
  plays the library's happy hop (happy eyes, a small mouth, two bounces), and
  the other friends glance at the one being greeted.
- **`prefers-reduced-motion`:** eyes only, with no idle motion; saying hi
  changes just the face.

## 6. Characters: what makes one of phy's friends

These are the rules the factory (`src/phyfriends.js`) encodes. Follow them
when reproducing a new image or design sheet.

- **Flat vector:**
  - no outlines, no gradients, no textures
  - 8–12 colours per character, each with a named role in `palette`: `fur`,
    `face`, `hair`, `hairShade`, `earInner`, `stripe`, `eye`, `blush`,
    `chest`, …
  - shading, when used at all, is one darker flat shape of the same hue
    (e.g. `hairShade`)
- **Chibi proportions, in head space:**
  - the origin sits between the eyes, and the head is about 200 units wide
  - ear tips reach about −140, the paws about +130 (`rig.ground`), and a tail may curl out to one side
  - every friend shares one scale, so they stand together as a set: pill eyes
    about 12 × 32 units, centred about 31–35 either side of the origin, and a
    reference in the house template (a 1254px close-up, head tipped 20°) is
    matched at `scale: 5.5`
  - the head is widest around eye level
- **Shape vocabulary:**
  - *fluffy ellipses*: the head, face mask and chest, whose outlines grow
    small curved fur tufts
  - *a star hair mop*: broad, curved, flame-like locks, with some hanging
    over the face
  - *rounded-triangle ears* with a pale inner ear and optional stripe bands
  - *pill eyes*: solid, no whites, no highlight by default
  - soft *blush* ovals
  - no mouth by default
- **Layering:** ears, head, face mask, blush, eyes, mouth, then hair on top.
  Bangs may cross the face.
- **Expressions come from the pose, not new drawings:** `eyes: 'happy' |
  'closed'`, `mouth`, `blink`, ear angles.
- **Keep the spec small.** A character is about 100 lines of parameters, not a
  traced path. Prefer tuning `fluffy` / `star` / ear parameters over raw
  `nodes`.

---

## Appendix: original brief

This is the brief the design direction came from, kept verbatim-in-spirit so
later changes can be checked against it.

> A pencil font. Don't make the design too artificial: no glossy,
> over-designed, template-y "AI landing page" look (no gradients,
> glassmorphism, glows, heavy drop shadows, emoji bullets, marketing hero
> copy, generic SaaS card grids). Aim for handmade, honest and quiet, like a
> page of someone's sketchbook where the characters are the only saturated
> things on it. The friends stand together on one shared stage and all watch
> the cursor (falling back to a grid or rows on narrow screens), each with a
> small handwritten label: name, maybe species, and a credit/owner line.
