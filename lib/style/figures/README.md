# Figures

phy's charts, slides and a paper's main diagram, in the house style (`STYLE.md`
§8 says what they are for). The matplotlib styles and the TikZ package carry
these rules; stack a matplotlib overlay for the medium:

```
plt.style.use(['phy.mplstyle', 'phy-slides.mplstyle'])  # Slides and the web.
plt.style.use(['phy.mplstyle', 'phy-print.mplstyle'])   # Print: white, in the host document's typeface.
```

| file | what it is |
|---|---|
| `phy.mplstyle`, `phy-slides.mplstyle`, `phy-print.mplstyle` | matplotlib: the house style, and its overlays for slides and the web, and for print |
| `phy-diagram.sty`, `diagram.tex` | TikZ: a paper's main diagram, and an example |
| `fonts/` | the face, Shantell Sans, for LaTeX, matplotlib and design tools, with its licence |

## Data colours

Each comes from one of phy's characters: the character's colour taken down in
the house shade step (`STYLE.md` §9) until it holds `3:1` on the paper, and
where two still sat too close, one took another step. `python3
tools/palette.py` derives them again and prints the tests.

| series | colour | shade |
|---|---|---|
| 1, blue | `#1092ca` | `#1777a4` |
| 2, red | `#a74126` | `#931800` |
| 3, slate | `#4d6295` | `#284a85` |
| 4, ochre | `#a98f12` | `#8c7609` |
| 5, pink | `#d56b75` | `#c34758` |

- Every pair stays apart under protanopia, deuteranopia and tritanopia
  (CIEDE2000 `13.9` at the closest), but the five fall into only two tiers of
  grey: a figure that may be printed in grey needs direct labels or marker
  shapes as well.
- **Five at most.** Fold the rest into "other" in `--ink-3`, or split the
  figure into small panels. Take the colours in order; a series keeps its
  colour from figure to figure, never its rank.
- **Data on a scale** takes the blue in steps: `#e4f3ff` `#abdafe` `#83c0ea`
  `#55a6d7` `#0c8dc3` `#09729f` `#06587c`. The lightest four fall short of
  `3:1` on the paper, so they are for fills only; a line or a small mark takes
  one of the last three. **Data either side of a middle** takes the blue and
  the red, with the paper in the middle.

## Charts

- Words are in `--ink`; axes, ticks and numbers in `--ink-2`.
- Two spines, short ticks, no box and no grid. Where a grid helps, pale rules
  (`#cfdbe8`, `0.6pt`) run across y only, under the data.
- Lines are `1.2pt` with round caps. Fills are flat, and a band of spread is
  the series colour at `16%`.
- Label lines at their ends. A legend goes only where labels would collide,
  and has no frame.
- The face is at `0`, which is the font file's default, so matplotlib needs no
  dial; but register it before plotting, or matplotlib falls back to Helvetica
  Neue without a word:
  `font_manager.fontManager.addfont('lib/style/figures/fonts/ShantellSans-Variable.ttf')`.
  A chart inside a document with its own typeface takes that typeface instead
  (the print overlay).
- No wobble and no graphite filter: on a chart they look bent, not drawn.
- A caption says what is shown, then what it shows: "build time for four
  versions: the last one halves it". Never just "results".

## Slides

A slide is the notebook page `×1.5`: at `1280×720` the rules are `48px` apart,
15 to a slide, and the title is `96px`. A chart on a slide takes the slides
overlay's sizes instead.
- The title states the point, not the topic.
- A chart sits on blank paper, since rules behind it would read as gridlines;
  the overlay's paper-toned figure covers them.
- One note with an arrow may point at the one thing to see.
- The bottom line, in small print, gives the source and what is missing: "one
  run each; no error bars".

## A paper's main diagram

The teaser or method overview that people remember the paper by, and redraw in
their own talks, is where the hand shows; the paper's text keeps the venue's
type. `phy-diagram.sty` carries it for TikZ, and `diagram.tex` is an example.
- Build it as its own file with `lualatex diagram.tex` and include the PDF, so
  the paper builds as usual, arXiv included, without the font. Only LuaLaTeX
  can turn the dial; XeLaTeX stops with a message.
- It sits on white, with no title: the caption carries it. Its words are in
  the face at `0`, in sentence case; a box holds a noun or two, and the caption
  does the explaining. A diagram for a site or slides takes that work's
  number: `\usepackage[informal=50]{phy-diagram}`.
- Symbols and values are maths in the paper's own type, so the `z_t` in the
  diagram is the `z_t` in the text: load the paper's text and maths packages
  (`newtxtext` and `newtxmath` for Times) before `phy-diagram`.
- One note in the hand, at `50`, with an arrow, may point at the new part.
- Draw it at the size it prints, `6.75in` across both columns or `3.3in` in
  one, so words come out at `8pt` and none is smaller than `7pt`.
- Lines are graphite, `0.7pt`, with round caps and open arrowheads, and wobble
  a little from a fixed seed, so a rebuild draws the same lines.
- Boxes are outlined, not filled. Colour goes only to the new part, or to the
  few things the reader must follow: a data colour on the line and at `16%`
  inside, the same in every figure of the paper.
