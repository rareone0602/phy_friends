# phy's style guide

This is phy's house style for everything phy makes, from pages, slides and
posters to READMEs, hobby projects and code. Hand it to anyone, or any agent,
making something for phy. A paper's text has its own guide; from a paper, this
one covers only the main diagram (§3).

It is a short programme, not a rulebook. A few things make a work phy's (§1),
and the words have rules of their own (§2).
The rest is a kit of good defaults (§3), a way into pieces made to be enjoyed
(§4) and a way of working (§5). The kit is a tool: work that keeps to it out
of habit has missed the point, since phy's work should not look the same
twice.

**Where this guide is the standard.** Its §1 and §2 outrank anything else,
and where they are wrong, they are corrected here. The source is `STYLE.md`
in [rareone0602/phy_friends](https://github.com/rareone0602/phy_friends),
also at [its raw address](https://raw.githubusercontent.com/rareone0602/phy_friends/main/STYLE.md)
for an agent to read. §1 is the guide in short, for a brief with no room for
the rest.

**The details live in code.** The look of a page is a CSS library,
`lib/style/site/`, whose README lists its tokens, type, marks and components;
the look of a chart or a diagram is in `lib/style/figures/`, whose README lists
the data colours and the rules for charts, slides and a paper's diagram; and an
editor and a terminal take the same inks from phy's dotfiles, `lib/dotfiles/`.
Other projects link the kit where it is published rather than copy it, so that
they change as the style does; the kit keeps every name that a page relies on.
A work with phy's characters in it also follows `FWIENDS.md`, which says how
they are drawn and staged.

---

## 1. phy

**phy**, always lower case, even at the start of a sentence. The handle is
`rareone0602` on GitHub and X; a credit to phy links to
[LinkedIn](https://www.linkedin.com/in/po-hung-yeh-6a8134116).

**The signature** is the one thing that stays the same in everything phy
makes: phy's avatar, an Eevee in the colours of phy's tuxedo cat, seated
beside the words (a title or the name, in lower case and in the hand) on one
short pencilled line at their baseline, in a box twice the words' size (the
portrait in the kit's README). Where there is no room, the head alone stands for it,
drawn for its size rather than shrunk: at 16 pixels it keeps the ears, the
white face and the green eyes, and leaves the rest out. Its colour is the
green of phy's eyes; where a work takes one colour of its own, it is that
green. It signs a work once, beside the title or in a corner, and the paper,
the scale, the place and the light round it are free. A work about other
people's characters, such as the gallery, leaves it out.

**What makes a work phy's.** Whatever else changes, four things stay:
- **One hand.** Every word is in **Shantell Sans**, a hand drawn with one even
  line, at any setting of its dial (§3), any size and any colour. Only code
  (the system monospace) and words in a host that sets its own type (a
  paper's text and maths, a README on GitHub) are in anything else.
- **The words** (§2).
- **Drawn, not designed.** By hand, or as a hand would, honest and quiet.
  Something in the work shows that a hand made it: a line that wobbles,
  spacing a little uneven, the grain a pencil, a brush or a press leaves.
  Nothing a design tool lays on by default: no tool's gradients, glows,
  glass or drop shadows, no emoji or stock icons, no hero copy and no
  template layouts such as a grid of cards.
- **Colour goes to the subject:** the data in a figure, the characters on a
  page, the places in a film. The ground stays quiet, and on a working page
  red is only for an error.

**Never the same twice.** The obvious answer is the floor, not the target. The
most likely choice is the boring one: the template, the stock phrase, the
default chart, the formal tone put on for show, and phy's own last piece.
Before calling a piece finished, describe its look in one sentence; if the
sentence also fits phy's last piece of the same kind (the casebook, §5),
redraw. The signature stays out of the sentence, since it is meant to repeat.
A piece made to delight should surprise, and then, on a second look, seem the
only way it could have gone.

**The kit is a tool.** Everything else, from the ruled paper and the dial to
the marks, the layout, the inks, light and motion (§3, §4), is good defaults,
not rules. A working page (a tool, a README, a gallery's controls) keeps
them, since there sameness is what makes it easy to use. Anything made to be
enjoyed or shown starts free and takes from the kit only what the idea needs;
a piece that keeps every default says why, in a line at the top of its
source. A series shares its look.

## 2. words

**Prose** is modelled on The Economist: opinionated, analytical and dry, with
words few, exact and honest, like a note in the margin.
- **British English, all the way down:** the spelling (colour, centre, grey,
  programme, -ise) and the idiom as well ("at the weekend", "in hospital",
  "take a decision"); American prose in British spelling is not British
  English. English only: another script appears only inside someone's own
  name or a quote of theirs.
- **Take a view, in the exact word.** Say which is better and why, with the
  evidence, in short sentences: "the second method is better: it halves the
  build time", never "both approaches have their merits". Numbers and names,
  not adjectives: "one script redraws every figure in about 40 seconds", never
  "blazing-fast". A long word is welcome when it is the precise one, never to
  sound clever.
- **No hype and no ceremony:** no "magical", "seamless" or "leverage", no
  welcome, no call to action, no sign-off, no exclamation marks and no emoji.
  "that's me", never "Meet phy, the creator behind it all!". Where the reader
  can do something, say what, plainly.

Two habits, kept unless a piece has a reason to break them:
- **Case follows the dial** (§3). From `50` up, the chrome (titles, headings,
  nav, labels, notes, captions, buttons and footers) is lower case and running
  prose is in sentence case; below `50`, and in plain text (READMEs, email),
  it is sentence case throughout. Names keep their owner's case. A page talks
  about the work; where phy speaks, it says "me", and the reader is "you".
  Dates go in full in prose (28 September 2026) and short in a date line (28
  sep 2026).
- **Humour is dark and dry**, and phy's own: understatement, irony and the
  grim thing said in the flattest official voice, never explained. A line or
  two, in the corners, never in what the reader came for. Never at the
  expense of a real person, their character or the reader, and never baby
  talk.

**Code** is a language of its own: American English and formal. The dial, the lower-case chrome and the
humour stop at its edge.
- **American English** in identifiers, comments, docstrings and commit
  messages: `color`, `center`, `gray`, `normalize`, `behavior`, `license`,
  `labeled`, `toward`. Words the code puts in front of people (a page's text,
  a label, an error message) are prose, and follow the rules above.
- **Formal.** Comments and docstrings are full sentences in sentence case,
  plain and precise: no jokes, no asides and no metaphors.
- **Plain names:** no cute names and no puns, however playful the project.

## 3. the kit

The house setting, for a working page to keep and a piece to take from. Each
part says what it is for; the kit's READMEs say how.

**Paper and ink.** The page is a sheet of lined notebook paper: pale blue
rules, a faded red margin line and a little paper tooth, with everything
written on the rules. The rules and the margin line are decoration, so
nothing that carries meaning is drawn in them. The inks run from graphite for
words to red for errors.
- **The dark sheet.** Where the reader's system asks for dark, the paper and
  the ink swap: the sheet is graphite, and the words are in the paper's
  colour, like white pencil on black paper. Nothing is inverted: a character
  keeps its own paper, and a scan its own white. On a dark host the page
  doesn't control, a slide say, lay a sheet of paper on it. The reader's
  system decides: a page never offers a switch, and a print is always on
  paper.
- **Other sheets** (`lib/style/site/papers.css`): graph paper, a score, a
  toned sketchbook, kraft, an index card, a cyanotype, and tracing paper laid
  over another, each with inks that keep the paper's contrasts. A light sheet
  turns to the dark sheet with the page; a dark or toned one is a piece's
  look, never a working page's.
- **Blue pencil**, an illustrator's non-photo blue deepened to be read, is
  for a page's workings: the construction under a drawing and the notes on
  how the page is made, shown only when the reader asks
  (`lib/fwiends/src/workings.js`).

**Type: the dial.** The face is fixed (§1); its informality axis lets the
same hand be neat in a diagram and loose in a toy. Each work sets one number, `--informal`: `0` for a paper's
diagram and for charts, `50` for a site, notes, slides and posters, and `100`
for a hobby project. Running words sit at the work's number; the few words
written rather than set (titles, headings, notes, names) are never neater than
`50`. Weight is pressure: everything is light, bold is the pencil pressed
harder, and there are no italics. The face's
files for LaTeX, matplotlib and design tools are in `lib/style/figures/fonts/`;
the SIL Open Font License allows any use, so long as the licence file stays
beside any copy of the font.

**Marks.** Every mark is a single stroke, never filled, in an ink: a ground
line, a ring round "this one", an arrow from a note, a squiggle for a break or
a wait, a side line down a quote, a box round the one primary button, a tick,
a cross for an error and a caret on a select. A mark tilts anticlockwise,
never more than `2°`. **The graphite filter**, the grain that makes a line look
drawn, goes over the title, the ground line and the arrow, never over small
text or a chart.

**A page.** One column, `42em` at most, against the margin line: a title in
the hand, one line of intro, the content and a small footer. It has no menus,
pills, frames or borders, and its empty state is one note, "nothing saved
yet.". The kit's README has the parts, the favicon, the link preview, the
README and print.

**Motion** is calm: nothing bounces all the time.

**Charts, slides and a paper's diagram** wear the same hand, and the data is
the only saturated thing. `lib/style/figures/`
carries the rules for matplotlib and TikZ:

```
plt.style.use(['phy.mplstyle', 'phy-slides.mplstyle'])  # Slides and the web.
plt.style.use(['phy.mplstyle', 'phy-print.mplstyle'])   # Print: white, in the host document's typeface.
```

- **Data colours** come from phy's characters: five at most, each legible on
  the paper and apart under colour blindness. A series keeps its colour from
  figure to figure, never its rank.
- **A caption** says what is shown, then what it shows: "build time for four
  versions: the last one halves it". A slide's title states the point, not
  the topic.
- **A paper's main diagram**, the one people remember the paper by and redraw
  in their own talks, is where the hand shows; the paper's text keeps the
  venue's type.

## 4. pieces

A piece made to delight (a picture, a film, a game) is looked at before it is
read, and starts free (§1). What follows are ways in, not requirements,
except where it says a thing is fixed.

**The picture.** A frame is composed, not filled. Some ways that have worked:
- one thing to look at first, and everything else quieter than it;
- scale doing the work: something large against something small;
- the paper as part of the picture, a frame mostly empty when the idea is
  small;
- off centre and uneven: a row facing us, evenly spaced, is the gallery's
  picture, and a piece needs its own;
- turned grey (CIELAB L* alone), a frame that still shows its one thing.

**The characters stay as drawn; the world is free.** As in cel animation, the
characters are drawn as they always are (`FWIENDS.md`), and the place around them takes
its own colours and its own light. The house way with light is to draw it,
never filter it: a beam or a pool of lamplight is a pale shape in coloured
pencil laid on the set, or, on a dark sheet, rubbed out of the graphite as an
eraser leaves it. Night is a darker sheet of paper, on which the inks turn
over. Either way, light falls on the place, never on a character.

**References.** Each piece picks its own, and takes one thing from each,
never a whole look. Three that have served:
- The Snowman (Raymond Briggs's book and the 1982 film): soft coloured
  pencil throughout, almost no words, and the pace set by Howard Blake's
  score.
- Ernest & Celestine (2012): colour that stops short of the frame's edges,
  so the paper shows round every scene.
- Jon Klassen's hat books (2011–16): eyes without mouths doing all the
  acting, and menace stated flatly.

**Sound and pace.** A film has usually been cut to its music: the track
chosen before the story, measured once into data beside the film (its bars
and beats, or, where the tempo is free, its moments), and every cue written
against that data, never by ear. Motion lands on phrases, not on every beat.
Two things are fixed:
- **Whose music.** Anything a non-commercial film may legally use. Never
  music that the agent making the film composes or generates; music someone
  else made with AI only where it is good. Legal is narrower than it looks:
  setting music to pictures adapts it, so an ND licence rules it out and an
  SA one passes to the film; public domain must hold where the film is
  published, for the recording as well as the score; and a commercial song
  goes only through a platform's own library, never on a page. Credit the
  composer even where nothing requires it.
- **Credits once, large.** A link in a picture cannot be clicked, so a video
  names the people and characters in it once, written large, and the post
  that carries it links them.

## 5. working with phy

- **Discuss before building** anything big: say what you'll make and wait
  for a yes. The surprise is in the idea, not the scope: add no work phy did
  not ask for.
- **Keep the source** (a spec, a script, a Markdown file) and the command
  that builds from it; a built file is never edited by hand. A first version
  is a sketch, to be redrawn once phy has looked, and the candidates that lose
  are kept until phy says otherwise.
- **Show, don't describe.** Render the options and put them side by side.
  Looks are settled by looking, and a look settled for one piece stays with
  that piece: it goes in the casebook, never into this guide.
- **The casebook**, `lib/style/CASEBOOK.md`, has one line per finished piece,
  newest first: what it is, its look in one sentence and a link. It records
  what has been done so that the next piece can do something else; nothing in
  it is a rule.
- **phy reviews before anything is published.** Pushing, posting and sharing
  are phy's call, each time.
- **An adversarial review** for visual work, by a reviewer who knows the
  references and the casebook and asks first where we have seen this before.
  A review, whoever writes it, is a reference rather than an order: check
  each finding against the work, adopt what holds, and say what was rejected
  and why.
- **Three ideas first.** For a piece, think first of what the viewer will
  enjoy, and sketch three ideas before choosing, one of which leaves the house
  look entirely; an ideas agent is briefed with the piece and its limits
  alone, never with this guide. The first idea to come is presumed the boring one (§1),
  judged against phy's recent pieces as well as everyone else's, and stays
  only if it beats the other two. Then draw the best: the kit gives way to the
  idea. Where §1 or §2 blocks a good idea, propose changing the rule rather
  than dropping the idea.
- **Private stays private.** Personal references (photos of a real pet, say)
  live in a git-ignored folder and never reach a public page. Quote phy's own
  words only where a piece needs them.
