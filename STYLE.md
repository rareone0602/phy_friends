# phy's style guide

This is phy's house style: one voice and one look for everything phy makes,
from pages, slides and posters to READMEs, hobby projects and code. Hand it
to anyone, or any agent, making something for phy.

A paper's text is the exception. It has its own guide, which keeps the
English simple for the reviewers' sake. From a paper, this guide covers only
the main diagram (§8).

The idea behind all of it is to **work in pencil.** A page from a sketchbook
is graphite on paper, drawn rather than designed. A pencil mark is light and
can be erased cleanly and drawn again, so every piece of work stays easy to
rework. Colour belongs only to what the work is about.

**This guide is the standard.** Where anything else disagrees with it, the
guide wins; where the guide is wrong, it is corrected here. The source is
`STYLE.md` in [rareone0602/phy_friends](https://github.com/rareone0602/phy_friends),
also at [its raw address](https://raw.githubusercontent.com/rareone0602/phy_friends/main/STYLE.md)
for an agent to read. Other projects copy the kit (§7) and point to the
source, so every copy stays the same.

---

## in short

For an agent's brief, when there is no room for the rest:
- **Work in pencil.** Keep everything easy to erase cleanly and redo: make it
  from a small source with a script, and when something goes, remove all of
  it.
- **Few rules (low Kolmogorov complexity).** Derive values rather than pick
  them. Measure against one named reference. A special case gets a comment
  saying why.
- **Not the mode.** The most likely choice (a template, a stock phrase, a
  default chart, a formal tone) is the boring one. Across works, phy stays
  consistent through the rules, not through sameness.
- **Don't make it too artificial.** No gradients, glows, glass, heavy
  shadows, emoji, stock icons, hype or template layouts.
- **Graphite on paper, never black.** Colour goes only to the subject, a
  character or the data. A character is coloured in with coloured pencil and
  has no outline; data colour is flat. Either has at most one shade step.
- **One hand on one dial.** Everything is in Shantell Sans, set by one
  number: `0` for a paper's diagram, `50` for a site, `100` for a hobby
  project. Titles, notes and names are never neater than `50`.
- **Keep a set aligned**: within one set, in look, size and structure.
- **Tell things apart first**, but never simplify away what makes a thing
  itself.
- **Make it cute:** characters are soft and round, a big head on a small
  body.
- **The owner decides** names, colours and credit. Names keep their owner's
  case, so phy is always lower case.
- **British English, as The Economist writes it:** opinionated, analytical
  and dry; British in idiom and grammar, not merely in spelling; the exact
  word in a short sentence, and numbers rather than adjectives. No ceremony
  and no exclamation marks. The humour is dark, with puns and irony, and
  stays out of formal work.
- **Code is American English**, formal and clean, after Robert C. Martin's
  *Clean Code*. The dial, the lower case and the jokes stop at its edge.
- **A paper's main diagram**, the picture people remember it by, is drawn
  in the face at `0` with `figures/phy-diagram.sty`.
- **Show, then ship.** Discuss before building anything big, ask which part
  is meant when a request is unclear, put the options side by side, and let
  phy review before anything is published.
- **Private stays private.**

## 1. who phy is

- **phy**, always lower case, even at the start of a sentence. The handle is
  `rareone0602` on GitHub and X.
- **A pencil user**, who likes work that can be erased cleanly and reworked.
- **Work over ceremony.** phy skips formality put on for show, lets the work
  speak, and looks for more than one way to put an idea. The single most
  likely answer (the mode, or the MAP estimate) is the most boring one.
- **A fan of dark humour, dark comedy and British humour**: dark and dry,
  understated, and said with a straight face. It stays out of formal work,
  and may go on a poster or into a talk.
- **Draws with code.** phy noticed that
  [Grokbot Icon](https://grokbot-icon-studio.serio-ai.chatgpt.site/)'s
  character icons have a low Kolmogorov complexity: a few ellipses, some
  tufts, two pill eyes and a blush. So phy's characters are made by a small
  program, not stored as pixels.
- **The avatar is phy**, phy's fursona: an Eevee in the colours of phy's
  tuxedo cat, with Oreo crumbs on the ruff and tail, in coloured pencil (§9).

## 2. principles

1. **Work in pencil.** Everything should be as easy to erase and redraw as a
   pencil line.
   - Keep sources, not results. A spec, a script or a Markdown file is the
     source, and pictures, pages and figures are generated from it. Never
     hand-edit a generated file.
   - Erase cleanly. When something goes, all of it goes: no leftover
     references, no half-renamed words, no commented-out code. Git remembers
     the old version.
   - Keep the candidates that lose in a `backup/` folder until phy says
     otherwise. Set them aside; don't rub them out.
   - A first version is a sketch. Expect to redraw it once phy has looked.
2. **Few rules (low Kolmogorov complexity).**
   - Derive values rather than pick them: shades from colours, and every
     vertical measure from the rule spacing.
   - Measure against one standard. Pick one reference, say which it is, and
     lower the diff against it rather than eyeballing.
   - A special case gets a comment saying why. If special cases pile up, the
     rule is wrong.
3. **Don't make it too artificial.** It should feel drawn, not designed:
   honest and quiet.
   - Tilt a hand-drawn thing by up to `2°`, anticlockwise. Let lines wobble,
     and leave horizontal spacing a little uneven. Vertical measures still
     sit on the rules.
   - Never use gradients, glassmorphism, glows, heavy drop shadows, emoji
     bullets, stock icons, marketing hero copy, calls to action, generic card
     grids, or a layout snapped to a grid.
4. **Graphite on paper; colour for the subject.** Everything is in paper and
   ink tones except what the work is about. On a page of characters, the
   characters are the only saturated things. In a figure, the data is.
5. **One layer.** Colour goes on in one layer: flat in a chart, in coloured
   pencil on a character (§9). Each colour may have at most one shade, a
   single step darker. The shade is used only to tell apart two neighbours
   of the same colour. There are no lighting effects, highlights or second
   steps, and nothing is copied from a reference's light and shade. The
   pencil's texture is the same everywhere, so it is paper, not shading.
6. **Keep the set aligned.** Within a set (a family of characters, a figure
   series, a deck), anything new matches what is already there in look, size
   and structure. Where the set is made of code, as a family of character
   specs is, the code matches too. When a rule changes, it changes
   everywhere at once.
7. **Tell things apart first.** If two parts can't be told apart, fix that
   before matching a reference any closer. Simplify only down to what makes
   a thing itself, never past it.
8. **The owner decides.** People and their characters appear as their owners
   give them:
   - names in the owner's capitalisation, with their species, colours and
     pronouns;
   - a credit linking to the owner.
   An owner's wish beats a house rule. A character appears only with its
   owner's say-so.
9. **Make it cute.** Characters are soft and round, with a big head on a
   small body. Cute comes before literal, but never at the cost of what
   makes a character itself (principle 7).
10. **Not the mode.** The most likely choice is the most boring one: the
    template layout, the stock phrase, the default chart, the formal tone put
    on for show. There is more than one way to put an idea, so look for the
    one that fits this idea.
    - Across works, phy stays consistent through the rules (one hand, one
      dial, one palette), not by every piece looking the same. Within a set,
      principle 6 still holds.
    - Inside the rules, each piece is a fresh draw, like the face's letters.

## 3. words

The model is *The Economist*: opinionated, analytical and dry, with wit,
puns and irony. Words are few, exact and honest, like a note in the margin.
- **British English, all the way down.** The spelling is British (colour,
  centre, grey, programme, -ise), and so are the vocabulary, grammar,
  collocations and phrasal verbs: "at the weekend", "in hospital", "a
  fortnight", "take a decision", "have got", "I've just finished", "sort it
  out", "muddle through". American prose in British spelling, a *New York
  Times* piece run through a spell-checker, is not British English.
- **Take a view, and show the working.** Say which is better and why, with
  the evidence or the mechanism behind it. Hedging everything is ceremony of
  another kind.
- **The exact word, in a short sentence.** A long or academic word is welcome
  when it is the precise one ("orthogonal", "idiosyncratic", "a trade-off"),
  never to sound clever. The structure stays plain: one idea to a sentence,
  one line per job. Say how a thing is made ("each one drawn from a
  hundred-odd lines of code") rather than how good it is, with numbers and
  names rather than adjectives.
- **English only.** Another script appears only inside someone's own name or
  a quote of theirs.
- **No hype.** No "magical", "seamless", "powerful", "novel",
  "revolutionary", "leverage" or "unlock". No "welcome" and no calls to
  action.
- **No ceremony.** Lead with the work. No throat-clearing, no "I hope this
  finds you well", no titles or credentials before the point, no sign-off.
  A formal piece is the same voice with the jokes taken out.
- **Calm punctuation:** full stops and colons, no exclamation marks and no
  emoji.
- **Case follows the dial** (§5).
  - From `50` up (a site, notes, slides, a poster, a hobby project), the
    chrome is lower case: titles, headings, intros, nav, labels, notes,
    captions, buttons and footers. Running prose is in sentence case.
  - At `0` (a paper's diagram), and in plain text the face can't reach
    (READMEs, email), write in sentence case throughout.
  - A chart takes the case of the work it sits in, though its face is always
    at `0`.
  - Names always keep their owner's case.
- **Person.** A page talks about the work. Where phy speaks for themself, as
  in a credit line, it may say "me". The reader is "you", told the one thing
  they can do.
- **Humour is dark and dry**, and phy's own: dark comedy and British humour.
  Understatement, irony, puns and self-deprecation; the absurd or grim thing
  said in the flattest, most official voice, like a mock disclaimer or a
  solemn footnote. Never explain the joke. It follows the dial: none at `0`,
  welcome from `50` up (a poster, a talk, a site), at home at `100`.
  - Keep it to a line or two per page, in the corners (a note, a caption,
    the footer), never in what the reader came for.
  - Dark about the world, the work and the machine; never at the expense of
    a real person, their character or the reader. Never baby talk.
- **Credit**: the owner, linked. Name an artist only when you know who drew
  the picture.
- **Dates**: in full in prose (28 September 2026), short in a date line
  (28 sep 2026).

| do | don't |
|---|---|
| that's me | Meet phy, the creator behind it all! |
| nothing saved yet. | Oops! Looks like there's nothing here yet! |
| the second method is better: it halves the build time. | Both approaches have their merits. |
| one script redraws every figure in about 40 seconds | Blazing-fast, seamless figure generation |

## 4. paper and ink

The page is a sheet of **lined notebook paper**: pale blue rules, a faded
red margin line on the left, and a little paper tooth. **Everything is
written on the rules.** Every vertical measure is a whole number of rules,
and text sits on them.

The tokens, from `site/notebook.css`:

```
:root {
  --L: 32px;            /* Rule spacing; 30px on phones. */
  --band: 4;            /* Blank rules above the first. */
  --paper: #fbf9f3;
  --rule: #cfdbe8;      /* Pale blue. */
  --margin: #e6aaa3;    /* Faded red. */
  --margin-x: 88px;     /* 22px on phones. */
  --ink: #3d3c39;       /* Graphite. */
  --ink-2: #6d6a63;
  --ink-3: #97938a;
  --red: #a64a3f;       /* For errors only. */
  --face: 'Shantell Sans', ui-rounded, system-ui, sans-serif;
  --informal: 50;       /* The dial (§5): 0 a paper's diagram, 50 a site, 100 a hobby project. */
  --sit: calc(var(--L) / 2 - 1px - .35em);  /* Moves a line onto its rule (§5). */
}
```

The inks, measured on the paper:

| ink | contrast | use it for |
|---|---|---|
| `--ink` | `10.5:1` | anything: titles, names, body text |
| `--ink-2` | `5.1:1` | quieter words (intros, small print, notes, captions), the lines of controls, focus |
| `--ink-3` | `2.9:1` | marks only: dashes, squiggles, the quote line, disabled controls. Never words someone needs to read |
| `--red` | `5.4:1` | errors, and nothing else: the margin's red, pressed harder |

- Ink is graphite, never black.
- The rules and the margin line are decoration. Nothing that carries meaning
  is drawn in them.
- The paper tooth is a fine fractal noise at `40%`, multiplied over
  everything.
- There is no dark theme: the page is paper. Tell the browser with
  `<meta name="color-scheme" content="light">`. On a dark host, a slide say,
  lay a sheet of paper on it rather than inverting the inks.

## 5. type

**One hand on one dial.** Everything this guide covers is written in one
face, **Shantell Sans**: a hand drawn with one even line, like a fine pen
held lightly. The pencil is in the rest: the graphite ink, the paper, the
marks and the filter over the title. The face has an informality axis, so
the same hand can be neat in a diagram and loose in a toy. Formality is a
setting of the one voice, never a different voice. Above the neat end, a
letter that repeats is drawn a little differently each time (the face swaps
in alternates by itself), so no two words come out the same.

**The dial.** Each piece of work has one number, `--informal`, from `0` to
`100`:
- `0` for a paper's diagram, and for charts (matplotlib can't turn it);
- `50` for a site, notes, slides and posters;
- `100` for a hobby project: the face as informal as it goes.

A piece may sit anywhere in between; these are the usual stops.

**The print and the hand.** Running words, the print, sit at the work's
number, which is the face's informality (`INFM`). A few words written
rather than set, the hand (titles, headings, notes, captions, table heads
and names), are never neater than `50`, and in the top half of the dial
they bounce as well (`BNCE`, rising to `50` at the top).
- Past `50` a lower-case s grows towards a capital. A site stops there, so
  "saved" still reads as "saved"; a hobby project goes all the way, big s
  and all.
- Bounce stops at `50`: any more lifts a p or an s to capital height, and
  "phy" reads "Phy". The print never bounces.

| | the print | the hand |
|---|---|---|
| a paper's diagram, `0` | neat | loose |
| a site, `50` | loose | loose |
| a hobby project, `100` | loosest | loosest, bouncing |

**Weight is pressure.** Everything is Light (`300`). Bold is `600`, the
pencil pressed harder. There are no other weights and no italics.

**Sizes** step by `1.2` from the `18px` print. On a phone the hand and the
intro step down one; the rest of the print keeps its size.

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

- Words are in `--ink`. The intro, small print, notes, captions and table
  heads are in `--ink-2`. Code is in the system monospace (`ui-monospace`,
  SF Mono, Menlo), in `--ink-2`.
- The line height is always a whole number of rules. A line moves down by
  `--sit` so its baseline lands on its rule: half a rule, less the rule's
  1px, less `0.35em` (half the face's ascent, `1.02em`, minus its descent,
  `0.32em`). No nudge is picked by eye.
- **The hand is for a few words.** Anything longer than a line goes in the
  print.
- A title is a few words: about 12 letters fit on one line on a phone. It
  sits on the first rule, and the rule under it stays blank for its tails.
- **Loading it:**
  `https://fonts.googleapis.com/css2?family=Shantell+Sans:wght,BNCE,INFM@300..800,-100..100,0..100&display=swap`,
  about 170 KB for Latin. `site/notebook.css` sets the dial; a page changes
  only `--informal`, and marks its own hand text with `.hand`. A file for
  LaTeX, matplotlib or a design tool is in `figures/fonts/`.
- **CJK text:** add `'LXGW WenKai TC'` (Google Fonts, a pencil-like hand)
  after the face. Load it only on pages with CJK text, and mark that text
  with `lang`.
- **Licence.** Shantell Sans is under the SIL Open Font License: free for
  any use, papers included, and it may be embedded in a PDF. Keep the
  licence file next to any copy of the font file.

## 6. hand-drawn marks

Every mark is a single pencil stroke: an SVG path with round caps, `1.1–1.5px`
wide, in an ink, never filled. There are nine:
- a **ground line** along a rule, for a character to stand on;
- a **ring**, one loose loop that doesn't quite close, round "this one": the
  current page, or the one thing that matters;
- an **arrow** from a note to what it's about;
- a **squiggle** for a break;
- a **side line** down a quote;
- a **box** round the one primary button;
- a **tick**;
- a **cross**, in red, for errors;
- a **caret** on a select.

If something needs a tenth mark, write a word instead.

- **Focus** is a dashed pencil outline, `1.5px` in `--ink-2`, `3–4px` clear of
  the thing.
- **Tilts** are anticlockwise and never more than `2°`: the title `−1°`, a
  margin note `−2°`, the button's box `−0.8°`.
- **The graphite filter** goes over the title, the ground line and the arrow,
  never over small text or a figure. Paste it once into each page:

```
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <filter id="graphite" x="-2%" y="-20%" width="104%" height="140%">
    <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="7" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 2.1" result="grain"/>
    <feComposite in="SourceGraphic" in2="grain" operator="in" result="g"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="1" seed="2" result="w"/>
    <feDisplacementMap in="g" in2="w" scale="1.5" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</svg>
```

## 7. parts of a page

**The kit.** Copy these from rareone0602/phy_friends:
- `site/notebook.css`, the paper;
- `site/pencil.css`, everything drawn on it. Its opening comment lists the
  classes;
- `site/icon.svg`, the favicon;
- `figures/`, for charts and diagrams (§8);
- the graphite filter (§6).

`specimen.html` shows every part below, working, on the rules.

**Layout.**
- One column, `42em` at most, left-aligned against the margin line.
- Nothing scrolls sideways. Long words break.
- A page has a title in the hand, one line of intro, the content, and a
  small footer. Nothing else is required.

**Small print.** The nav, a date line and the footer are small print in
`--ink-2`.
- The nav sits on the rule under the intro, its items spaced apart. The
  current page wears the ring. There are no menus and no hamburgers, and a
  page in one part needs no nav at all.
- A date line and the footer split their items with middle dots: "28 sep 2026
  · pencils · paper". Tags are plain words: no pills and no #.

**Links** are the text itself, underlined like a pencil line (`1px`, `3px`
below). Hovering darkens them to `--ink`.

**Lists and quotes.** A list item starts with a dash in `--ink-3`, and a
numbered item with its number in the hand. A quote is indented, in `--ink-2`,
with the side line.

**Code** is one line to a rule. A block is indented like a list, with no box,
and wraps rather than scrolls.

**Pictures:**
- A picture is a whole number of rules tall, with its top and bottom on
  rules. It has no frame, no rounded corners and no shadow.
- A photo stays a photo. A scan or a line drawing on white is laid in with
  `multiply`, so its white becomes the paper. A character or a chart is
  drawn on paper or on nothing.
- A picture is scaled to fit, never cut: a chart loses nothing on a phone.
- The caption is a note on the next rule. Never put words over a photo.
- A picture that is the point of the page may be in colour, like a
  character.

**Tables.** The rules are the rows: no borders, stripes or vertical lines.
- The head is in the hand in `--ink-2`, and the rule under it is gone over in
  pencil.
- Numbers are right-aligned.
- A cell that wraps takes whole rules.
- A phone fits three columns. Fold the rest into a label, or split the table.

**Controls:**
- **One primary button per view:** the word in the pencil box. Hovering goes
  over the box again, and pressing moves it down `1px`.
- **Every other button is quiet:** the word alone, underlined like a link.
- **A text field** has its label on its own rule, in `--ink-2`, and the field
  on the next. The field has no box; the rule under it is gone over in
  `--ink-2`. There are no placeholders: put an example in the label.
- **A select** is the same, with the caret. Its open list is the system's;
  leave it alone.
- **A checkbox** is a pencil box with a tick that overshoots it. There are no
  switches: an on/off setting is a checkbox.
- **Disabled** things are in `--ink-3`.

**States:**
- **An error** turns the field's line into a red wave. A note in red on the
  next rule says what to do: "that needs to be a number, like 250".
- **A result** is written in the hand with the arrow pointing at it,
  numbers and all.
- **Loading** shows the squiggle drawing itself, with one plain word:
  "counting…". Under reduced motion it stays still.
- **An empty state** is one note, "nothing saved yet.", then a few blank
  rules. No picture, no "oops".

**A portrait.** An about page may have one character standing beside the
title, a rule taller than it. It stands on the title's rule, reaches up into
the blank band, and may watch the cursor.

**Other places:**
- **Favicon:** phy's head on everything phy makes, unless the work is about
  another character.
- **Link preview:** the page itself, photographed at `1200×630`. It is not a
  designed card: no extra text and no logo.
- **README:** GitHub strips CSS, so the style lives in the words. Write it in
  sentence case, as plain text (§3): a title, one honest line, the preview
  picture, and short plain sections. No badges, no emoji and no feature
  lists.
- **Print:** plain paper. The rules, margin line, tooth, nav and portrait
  drop out; the ink stays.

## 8. charts, slides and a paper's diagram

Charts and diagrams wear the same pencil. The data plays the part of the
characters, the only saturated thing on the page. The matplotlib styles in
`figures/` carry these rules; stack an overlay for the medium:

```
plt.style.use(['phy.mplstyle', 'phy-slides.mplstyle'])  # Slides and the web.
plt.style.use(['phy.mplstyle', 'phy-print.mplstyle'])   # Print: white, in the host document's typeface.
```

**Data colours** come from phy's characters. Each is a character's colour
taken down in the one-shade step (CIELAB L* `−10`, chroma `×1.2`, same hue)
until it holds `3:1` on the paper; where two still sat too close, one took
another step. `python3 figures/palette.py` derives them again and prints the
tests.

| series | colour | shade |
|---|---|---|
| 1, blue | `#179ad0` | `#087fad` |
| 2, red | `#a74126` | `#931800` |
| 3, slate | `#4d6295` | `#284a85` |
| 4, ochre | `#a98f12` | `#8c7609` |
| 5, pink | `#d56b75` | `#c34758` |

- Every pair stays apart under protanopia, deuteranopia and tritanopia:
  CIEDE2000 `13.9` at the closest.
- **Five at most.** Fold the rest into "other" in `--ink-3`, or split the
  figure into small panels.
- Take the colours in order. A series keeps its colour from figure to figure,
  never its rank.
- **Data on a scale** takes the blue in the same steps: `#e3f3ff` `#a7dbfe`
  `#7cc1eb` `#49a7d9` `#158dbf` `#0f729b` `#01597a`. The lightest two are for
  fills only.
- **Data either side of a middle** takes the blue and the red, with the
  paper in the middle.
- The five fall into only two tiers of grey. A figure that may be printed in
  grey needs direct labels or marker shapes as well.

**Charts:**
- Words are in `--ink`; axes, ticks and numbers in `--ink-2`.
- Draw two spines, short ticks, no box and no grid. Where a grid helps, draw
  pale rules (`#cfdbe8`, `0.6pt`) across y only, under the data.
- Lines are `1.2pt` with round caps. Fills are flat, and a band of spread is
  the series colour at `16%`.
- Label lines at their ends. Use a legend only where labels would collide,
  and give it no frame.
- Bars start at zero.
- Words and numbers are in the face at the neat end of the dial, `0`.
  matplotlib can't turn the dial, and the font file's default is exactly
  that. Register it before plotting, or matplotlib falls back to Helvetica
  Neue without a word:
  `font_manager.fontManager.addfont('figures/fonts/ShantellSans-Variable.ttf')`.
  A chart inside a document with its own typeface takes that typeface
  instead (the print overlay).
- No wobble and no graphite filter: on a chart they look bent, not drawn.
- A caption says what is shown, then what it shows: "build time for four
  versions: the last one halves it". Never just "results".
- A chart is made by a script and redrawn by running it again, never
  touched up by hand.
- Check that everything reads at the size it will be seen.

**Slides.** A slide is the notebook page with everything `×1.5`: at
`1280×720` the rules are `48px` apart, 15 to a slide, and the title is `96px`.
- One idea per slide, and the title states the point, not the topic.
- A chart gets blank paper with no rules behind it, since they would read
  as gridlines. The slides overlay's paper-toned figure covers them.
- One note with an arrow may point at the one thing to see.
- The bottom line, in small print, gives the source and what is missing:
  "one run each; no error bars".

**A paper's main diagram.** Every paper needs one diagram that people
remember it by, the teaser or the method overview, and redraw in their own
talks. That is where the pencil shows; the paper's text keeps the venue's
type. `figures/phy-diagram.sty` carries it for TikZ, and
`figures/diagram.tex` is an example.
- Build it as its own file with `lualatex diagram.tex` and include the PDF,
  so the paper builds as usual, arXiv included, without the font. Only
  LuaLaTeX can turn the dial; XeLaTeX stops with a message. In any other
  tool, install the font from `figures/fonts/`.
- It sits on white, not the paper tone, and has no title: the caption
  carries it.
- Words are in the face at `0`, the neat end of the dial, in sentence case.
  A box holds a noun or two; the caption does the explaining. A diagram for
  a site or slides takes that work's number:
  `\usepackage[informal=50]{phy-diagram}`.
- Symbols and values are maths in the paper's own type, so the `z_t` in the
  diagram is the `z_t` in the text. Load the paper's text and maths packages
  (`newtxtext` and `newtxmath` for Times) before `phy-diagram`.
- One note in the hand, at `50`, with an arrow, may point at the new part.
- Draw it at the size it prints, `6.75in` across both columns or `3.3in` in
  one, so words come out at `8pt` and none is smaller than `7pt`.
- Lines are graphite, `0.7pt`, with round caps and open arrowheads. They
  wobble a little, from a fixed seed, so a rebuild draws the same lines.
- Boxes are outlined, not filled. Colour goes only to the new part, or to
  the few things the reader must follow: a data colour on the line and at
  `16%` inside. Each keeps its colour in every figure of the paper.

## 9. the avatar and characters

- **phy's mark is phy**, the fursona: the head alone for a favicon or
  avatar, the whole character where there is room. It is drawn by
  `src/phyfriends.js` from `characters/phy/phy.js`, never redrawn by hand, so
  every copy matches.
- Characters are **drawn in coloured pencil**: soft round shapes coloured
  in without an outline, pill eyes in each character's own eye colour, soft
  blush, and no nose and no mouth by default. Each has exactly one shade layer (principle 5), and
  the body, which sits under the head, always wears it.
- **The pencil is one texture over the whole character**, which the factory
  lays on: strokes rising to the right, the paper's tooth, and patches where
  the hand pressed more lightly. The paper, rules and all, shows through.
  The texture belongs to the paper, so it stays put while a character moves.
  On a background of its own, such as a dark close-up, a character is drawn
  on a sheet of paper cut to its outline, so the pencil shows paper, never
  the background. An icon too small to hold it, such as a favicon, is drawn
  flat.
- The shapes came from the template of the
  [Grokbot Icon](https://grokbot-icon-studio.serio-ai.chatgpt.site/) prompt:
  a close-up with the head tipped, pill eyes and blush on a dark ground.
  Reviewers of a character should know its examples.
- Every character is a small spec (about 100 lines) that a factory draws.
  The rules for drawing one are in `FWIENDS.md`, next to the factory.
- **Motion** is calm and alive. The eyes follow the pointer, smoothed so they
  never jitter, with breathing, irregular blinks and a slow sway
  underneath. Nothing bounces all the time. Under `prefers-reduced-motion`,
  only the eyes move.

## 10. code

Code is a language of its own, with its own conventions: American English,
formal, and clean in the sense of Robert C. Martin's *Clean Code*. The dial,
the lower-case chrome and the humour stop at its edge.
- **American English** in identifiers, comments, docstrings and commit
  messages: `color`, `center`, `gray`, `normalize`, `behavior`, `license`,
  `labeled`, `toward`. Words the code puts in front of people (a page's
  text, a label, an error message) are copy, and follow §3.
- **Formal.** Comments and docstrings are full sentences in sentence case,
  plain and precise: no jokes, no asides and no metaphors.
- **Names reveal intent.** A name says what a thing is or does, and can be
  said aloud and searched for. Use one word per concept across a codebase;
  no cute names, no puns, and no abbreviations beyond the field's own
  (`rgb`, `L*`). A number that means something gets a name (principle 2).
- **Functions are small and do one thing**, at one level of abstraction,
  with few arguments and no hidden side effects. A file reads from the top
  down, each caller above what it calls.
- **Comments say why**: intent, a constraint, a warning, a reference
  ("STYLE.md §5"). If a comment has to explain what the code does, rename or
  extract instead. No commented-out code, no changelogs and no bylines; git
  keeps those.
- **Errors** are raised with a message that says what went wrong and what to
  do, not returned as codes.
- **Tests** are as clean as the code: one concept each, fast, independent
  and repeatable.
- **Formatting** follows the language's convention (PEP 8 for Python) and
  the project's formatter, so a codebase reads as if one person wrote it.
- **Commit messages** have a subject line in the imperative and in sentence
  case, of about 50 characters ("Add the formality dial"), and the why in
  the body.

## 11. working with phy

For anyone, or any agent, making something for phy:
- **Discuss before building** anything big. Say what you'll make and wait
  for a yes.
- **Show, don't describe.** Render the options and put them side by side.
  Rules about looks are settled by looking; once one is settled, write it
  down at the source.
- **Ask which part** when a request names a region or a word that could mean
  two things, before changing anything. A marked-up crop helps.
- **Let phy review before anything is published.** Pushing, posting and
  sharing are phy's call, each time.
- **Keep folders tidy:** one folder per thing, with its examples beside it,
  and generated output in a git-ignored `out/`.
- **Fanning out is welcome:** phy is happy for a big job to go to several
  agents in parallel. Visual work then goes to an adversarial reviewer who
  knows the references.
- **Private stays private.** Personal references (photos of a real pet, say)
  live in a git-ignored folder and never reach a public page. Quote phy's
  own words only where a piece needs them.

## 12. is it phy's?

Before calling something done:
- Could it be erased and redrawn from its source in one command?
- Could its rules fit on an index card?
- Is anything saturated that isn't the subject?
- Is there a gradient, a glow, a shadow, an emoji or a hype word?
- Is there more than one shade of any colour, or shading that isn't parting
  two neighbours?
- Does it match the rest of the set in size, look and structure?
- Can every part be told apart at the size people will see it?
- Is everyone credited as they wish, with every name written as its owner
  writes it?
- Is it in the one face, at the work's place on the dial?
- Is it British English as The Economist would write it, with no ceremony?
- Is the code American English, formal and clean?
- Is any part of it the first template that came to mind?
- Has phy seen it?
