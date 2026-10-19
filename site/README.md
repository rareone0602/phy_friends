# The kit

phy's CSS library: a sheet of lined notebook paper and everything drawn on it,
for any page in the house style. `STYLE.md` §4 to §7 say what it is for; this
says how to use it. `specimen.html` shows every part at work, with the dial to
turn. Copy the folder from one commit and point to the source: a copy does not
update itself.

| file | what it is |
|---|---|
| `phy.css` | the library: the paper, then everything drawn on it |
| `notebook.css` | the paper: the tokens, the face, the rules, the margin line, the tooth and the dark sheet |
| `pencil.css` | everything drawn on the paper; its opening comment lists the classes |
| `fonts/` | the face, Shantell Sans: a Latin subset of about 170 KB with all three axes (`tools/font_subset.py` makes it), and its licence; it stays beside `notebook.css` |
| `graphite.svg` | the graphite filter, pasted once into each page |
| `icon.svg`, `icon-32.png`, `apple-touch-icon.png` | the favicon: phy's head (`tools/site_assets.py` draws them) |
| `preview.png` | the gallery's link preview |
| `title-pen.js` | the strokes in which the gallery writes its title (`tools/title_pen.py` derives them) |

## A page

```html
<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<link rel="preload" href="site/fonts/ShantellSans-Latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="site/phy.css">
</head>
<body>
<!-- site/graphite.svg, pasted here -->
<header><h1>a title</h1><p class="intro">one line of intro.</p></header>
<main><div class="doc">the writing</div></main>
<footer>a small footer</footer>
</body>
</html>
```

- Link `phy.css`, or, to save a round trip, `notebook.css` then `pencil.css`.
- **The dial:** set `--informal` on `:root` where the work is not at `50`, and
  mark hand-written text with `.hand`.
- **The dark sheet:** `<meta name="color-scheme" content="light dark">` turns
  the page to the dark sheet where the reader's system asks for dark; a page
  made for paper alone says `light`. Print is always on paper.
- **The filter** is an SVG filter, which every browser can use from the page's
  own document, so paste `graphite.svg` first in the body, and give
  `filter: url(#graphite)` to whatever it goes over.

## Paper and ink

The tokens, in `notebook.css`, on the paper and on the dark sheet:

| token | paper | dark | use it for |
|---|---|---|---|
| `--paper` | `#fbf9f3` | `#3d3c39` | the sheet |
| `--rule` | `#cfdbe8` | `#45505a` | the pale blue rules, `--L` apart: `32px`, `30px` on phones, with `--band`, 4 blank rules, above the first |
| `--margin` | `#e6aaa3` | `#8b5751` | the faded red margin line, `--margin-x` in: `88px`, `22px` on phones |
| `--ink` | `#3d3c39` | `#fbf9f3` | graphite, `10.5:1`: anything, titles, names and body text |
| `--ink-2` | `#6d6a63` | `#b4b1a9` | `5.1:1`: quieter words (intros, small print, notes, captions, table heads, code), the lines of controls, focus |
| `--ink-3` | `#97938a` | `#86837a` | `2.9:1`: marks only (dashes, squiggles, the quote line, disabled controls); never words someone needs to read |
| `--red` | `#a64a3f` | `#fe9c8c` | `5.4:1`: errors, and nothing else; the margin's red, pressed harder |

- The paper's tooth is a fine fractal noise at `40%`, multiplied over
  everything.
- On the dark sheet every ink but the paper and graphite keeps its hue and its
  contrast with the sheet, as the table's numbers say; `python3
  tools/dark_sheet.py` derives them again and writes them, and the marks, into
  the kit. The tooth shows through the graphite as light specks, and the
  graphite lies in strokes rising to the right.

## Type

- **The print** sits at the work's number `d` (`INFM d`) and never bounces.
  **The hand** is never neater than `50` and bounces in the top half: `INFM
  max(d, 50)`, `BNCE max(d − 50, 0)`. A chart's words are all at `0`. Past
  `50` a lower-case s grows towards a capital: a site stops there, so "saved"
  still reads as "saved", and a hobby project goes all the way. Bounce stops
  at `50`: any more lifts a p or an s to capital height, and "phy" reads
  "Phy".
- **Weights:** everything is Light (`300`); bold is `600`. No other weights and
  no italics, not even for the title of a book.
- **Sizes** step by `1.2` from the `18px` print. On a phone the hand and the
  intro step down one (in brackets); the rest of the print keeps its size.

| in the hand | size | rules |
|---|---|---|
| title | `64px` (`54px`) | 3 (2) |
| part title | `54px` (`45px`) | 3 (2) |
| h2 | `37px` (`31px`) | 2 |
| h3, a result | `26px` (`22px`) | 1 |
| note, caption, table head | `22px` (`18px`) | 1 |

| in the print | size | rules |
|---|---|---|
| intro | `22px` (`18px`) | 1 (2) |
| body | `18px` | 1 |
| small print, code | `15px` | 1 |

- The line height is a whole number of rules. A line moves down by `--sit` so
  that its baseline lands on its rule: half a rule, less the rule's 1px, less
  `0.35em` (half the face's ascent, `1.02em`, minus its descent, `0.32em`).
  No nudge is picked by eye.
- A title is about 12 letters, what fits on a phone's line. It sits on the
  first rule, with the rule under it left blank for its tails; too long for a
  phone, it shrinks rather than wraps.
- **CJK text** adds `'LXGW WenKai TC'` (Google Fonts, a pencil-like hand)
  after the face, loaded only on pages that need it, with the text marked by
  `lang`.

## Marks

Every mark is a single pencil stroke: an SVG path with round caps, `1.1–1.5px`
wide, in an ink, never filled. `pencil.css` defines each once, as a token
(`--mark-ring` and the rest). There are nine:
- a **ground line** along a rule, for a character to stand on, or in
  `--ink-2` going over a rule (under a table's head, under a field) or under
  a link;
- a **ring**, one loose loop that doesn't quite close, round "this one": the
  current page, or the one thing that matters;
- an **arrow** from a note to what it's about;
- a **squiggle** for a break, or while loading; in red, the wave under a field
  in error;
- a **side line** down a quote;
- a **box** round the one primary button;
- a **tick**;
- a **cross**, in red, for errors;
- a **caret** on a select.

- **Focus** is a dashed pencil outline, `1.5px` in `--ink-2`, `3–4px` clear of
  the thing.
- **Tilts:** the title `−1°`, a margin note `−2°`, the button's box `−0.8°`.
- **The graphite filter** goes over the title, the ground line and the arrow.

## Parts of a page

- **Small print**, in `--ink-2`: the nav, a date line, a contents line and the
  footer. The nav sits on the rule under the intro: plain words spaced apart,
  underlined only while hovered, with the ring round the current page. A date
  line, a contents line and the footer split their items with middle dots:
  "28 sep 2026 · pencils · paper". A long page opens its writing with a
  contents line of its headings, each a link.
- **Links** are underlined with the ground line in `--ink-2`, just under the
  text, darkening to `--ink` when hovered. Print and forced colours, which
  drop the pencil, keep a plain underline (`1px`, `3px` below).
- **Lists, quotes and code.** A list item starts with a dash in `--ink-3`, and
  a numbered one with its number in the hand. A quote is indented, in
  `--ink-2`, with the side line. Code is one line to a rule; a block is
  indented like a list, with no box, and wraps rather than scrolls.
- **Pictures** are a whole number of rules tall (`figure style="--rules: 6"`),
  with top and bottom on rules. A scan or a line drawing on white is laid in
  with `multiply` (`img.drawing`), so its white becomes the paper, and keeps
  its white on the dark sheet; a character or a chart is drawn on paper or on
  nothing. The caption is a note on the next rule.
- **Tables.** The head is in the hand in `--ink-2`, with the rule under it gone
  over in pencil, and a cell that wraps takes whole rules. On a phone, a table
  too wide for its column scrolls by itself.
- **Buttons:** the primary button is the word in the pencil box; hovering goes
  over the box again, and pressing moves it down `1px`. Every other button is
  quiet: the word alone, underlined like a link.
- **A text field** has its label on its own rule, in `--ink-2`, and the field
  on the next, with no box: the rule under it is gone over in `--ink-2`. **A
  select** is the same, with the caret; its open list is the system's. **A
  checkbox** is a pencil box with a tick that overshoots it. **Disabled**
  things are in `--ink-3`.
- **States:** an error turns the field's line into a red wave, with a red note
  on the next rule; a result is written in the hand with the arrow pointing at
  it; loading shows the squiggle drawing itself, and under reduced motion it
  stays still; an empty state is one note, then a few blank rules.
- **Print:** plain paper. The rules, margin line, tooth, nav and portrait drop
  out; the ink stays.
