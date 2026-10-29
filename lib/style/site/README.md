# The kit

phy's CSS library: a sheet of lined notebook paper and everything drawn on it,
for any page in the house style. `STYLE.md` §3 says what it is for; this
says how to use it. `style.html` shows every part at work, with the dial to
turn. A page links the kit where it is published, never a copy of it, so that
it changes as the style does (see [Keeping step](#keeping-step)).

| file | what it is |
|---|---|
| `phy.css` | the library: the paper, then everything drawn on it |
| `notebook.css` | the paper: the tokens, the face, the rules, the margin line, the tooth and the dark sheet |
| `pencil.css` | everything drawn on the paper; its opening comment lists the classes |
| `papers.css` | other sheets, optional, loaded after the rest: see [Papers](#papers) |
| `fonts/` | the face, Shantell Sans: a Latin subset of about 170 KB with all three axes (`tools/font_subset.py` makes it), and its licence; it stays beside `notebook.css` |
| `graphite.js` | writes the graphite filter into the page |
| `icon.svg`, `icon-32.png`, `apple-touch-icon.png` | the favicon: phy's head (`tools/site_assets.py` draws them) |

## A page

```html
<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<link rel="preload" href="https://rareone0602.github.io/phy_friends/lib/style/site/fonts/ShantellSans-Latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="https://rareone0602.github.io/phy_friends/lib/style/site/phy.css">
</head>
<body>
<script src="https://rareone0602.github.io/phy_friends/lib/style/site/graphite.js"></script>
<header><h1>a title</h1><p class="intro">one line of intro.</p></header>
<main><div class="doc">the writing</div></main>
<footer>a small footer</footer>
</body>
</html>
```

- Link `phy.css`, or, to save a round trip, `notebook.css` then `pencil.css`.
  A page on rareone0602.github.io may write the address from the root,
  `/phy_friends/lib/style/site/phy.css`; one in this repository, from itself.
- **The preload** starts the face early. Opened from disk, a browser refuses
  a font preloaded from beside the page (one from the site is fine), so a page
  in this repository adds the preload from a script that leaves it out for a
  `file:` page, as `index.html` does.
- **The dial:** set `--informal` on `:root` where the work is not at `50`, and
  mark hand-written text with `.hand`.
- **The dark sheet:** `<meta name="color-scheme" content="light dark">` turns
  the page to the dark sheet where the reader's system asks for dark; a page
  made for paper alone says `light`. Print is always on paper.
- **The filter** is an SVG filter, which a browser applies only from the
  page's own document, so `graphite.js`, loaded first in the body, writes it
  there; give `filter: url(#graphite)` to whatever it goes over. Without
  JavaScript the lines are drawn without their grain.

## Keeping step

A page links the kit as published, so a change to the kit reaches every page
at once, and the style stays one style however fast it changes. What a page
relies on is the kit's names: its files, its tokens (`--ink`, `--L` and the
rest) and its classes (`.note`, `.btn` and the rest). The kit may add names
and restyle any of them, but never drops one: `python3 tools/pf.py test`
compares the kit with the one published on `origin/main` (`tools/kit_api.py`)
and fails on any name that has gone. To rename one, keep the old name beside
the new until no page uses it; to retire one, list it in `tools/kit_api.py`
with the reason.

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
| `--blue-pencil` | `#1c77ad` | `#66afe8` | `4.6:1`: a page's workings (the construction under a drawing, notes on how the page is made), shown only when the reader asks |

- The paper's tooth is a fine fractal noise at `40%`, multiplied over
  everything (`--tooth`; the dark sheet's specks and strokes are `--speckle`
  and `--streaks`).
- On the dark sheet every ink but the paper and graphite keeps its hue and its
  contrast with the sheet, as the table's numbers say; `python3
  tools/dark_sheet.py` derives them again and writes them, and the marks, into
  the kit. The tooth shows through the graphite as light specks, and the
  graphite lies in strokes rising to the right.

## Papers

`papers.css`, loaded after the kit, gives a piece other sheets. One attribute
picks a sheet, on `<html>` as the page's paper, or on any other element as a
sheet laid on the page, which keeps its own paper and inks whatever the
page's, as a character does. `style.html` shows each.

| `data-paper` | the sheet | its lines |
|---|---|---|
| `notebook` | the kit's own paper | lined |
| `graphite` | the dark sheet, at any hour | lined |
| `graph` | an engineering pad: a line every rule both ways, a lesser one every quarter | grid |
| `score` | manuscript paper: a stave every two rules | staves |
| `sketchbook` | toned paper with a heavier tooth | plain |
| `kraft` | brown wrapping paper, with its fibres | plain |
| `card` | an index card: its first rule red, the rest blue | card |
| `cyanotype` | a sun print of ruled paper | lined |
| `tracing` | a translucent film over another sheet | plain |

- **`data-ruling`** (`lined`, `grid`, `staves`, `card` or `plain`) changes a
  sheet's lines; given alone, it rules the paper it lies on.
- **Light and dark.** As a page's paper, a light sheet (notebook, graph,
  score, card) turns to the dark sheet where the page declares both schemes
  and the reader's system asks for dark; the others keep their colours, and
  are a piece's look, never a working page's (`STYLE.md` §3).
- **On the rules.** A page's sheet keeps the blank band and falls on the
  writing's rules. A laid sheet starts its rules at its top edge, so give it a
  height in whole rules; its margin line is `--sheet-margin` in (three
  quarters of a rule), and words keep to the right of it. On a score, words go
  on every other rule, between the staves.
- **Tracing paper** goes in a positioned element, `position: absolute; inset:
  0`: what lies under it shows through faded, and what is written on it keeps
  its contrast, in the inks of the sheet beneath. It is milky white over a
  sheet with dark words, and its mirror, a little darker than the sheet, over
  one with light words. `PhyFriends.workings` lays one with `tracing`.
- **Inks.** Every ink of a sheet but its paper (and its rule, where it gives
  one) keeps its hue and the contrast it has on the paper, or nearly all the
  sheet can give: at least `7:1` for ink, `4.5:1` for ink-2, red and blue
  pencil, `2.2:1` for ink-3. `python3 tools/dark_sheet.py` derives them, and
  the marks drawn in them, and fails where a sheet falls short; a new sheet
  gives its `--paper` in `papers.css` and joins `PAPERS_ORDER` in the tool.
- **Print and forced colours.** A page's sheet prints on plain paper; a laid
  sheet prints as a picture of itself. In forced colours every sheet is the
  system's canvas and tracing paper is not drawn.
- **Your own sheet:** `--sheet-ruling`, `--sheet-texture` and `--sheet-grain`
  (with `-opacity` and `-blend`) draw one, from `--tooth`, `--speckle`,
  `--streaks`, `--rule-faint` and `--tracing`.

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

A page that needs another mark writes a word instead; a piece draws whatever
it needs, rain or speed lines, by the same rule. A mark may turn to point
somewhere or grow to hold its own, and stays the same mark.

- **Focus** is a dashed pencil outline, `1.5px` in `--ink-2`, `3–4px` clear of
  the thing.
- **Tilts:** the title `−1°`, a margin note `−2°`, the button's box `−0.8°`.
- **The graphite filter** goes over the title, the ground line and the arrow.

## Parts of a page

A page has a `header` (the title, the intro and any nav), a `main` holding the
writing and a `footer`, in one column `42em` wide at most, left-aligned against
the margin line. Nothing else is required.

What a page leaves out, and what it says:
- No menus and no hamburgers: the nav is plain words, with the ring round
  the current page. Tags are plain words, with no pills and no #.
- Pictures have no frame, no rounded corners and no shadow. A photo stays a
  photo, with no words over it.
- Tables have no borders, stripes or vertical lines.
- An error says what to do in phy's voice ("that needs to be a number, like
  250"); loading is one plain word ("counting…"); an empty state is one note,
  "nothing saved yet.", with no picture and no "oops".

The parts:
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
- **A portrait:** an about page may have one character standing beside the
  title, a rule taller than it. It stands on the title's rule, reaches up into
  the blank band, and may watch the cursor.
- **Print:** plain paper. The rules, margin line, tooth, nav and portrait drop
  out; the ink stays.

## Other places

- **Favicon:** phy's head on everything phy makes, unless the work is about
  another character.
- **Link preview:** the page's own paper, title and characters, set to fill
  `1200×630` with every character at one size; not a designed card, with no
  extra text and no logo.
- **README:** GitHub strips CSS, so the style lives in the words, in sentence
  case: a title, one honest line, the preview picture and short plain
  sections. No badges, no emoji and no feature lists.
