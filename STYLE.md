# phy's style guide

phy's work is known by its hand and its voice, never by a look: the hand,
the voice and a quiet ground repeat, and the idea never does. This is the
house style for everything phy makes, from pages, slides and posters to
READMEs, hobby projects and code. Hand it to anyone, or any agent, making
something for phy. A paper's text has its own guide; from a paper, this one
covers only the main diagram (§3).

It is a short programme, not a rulebook. Five principles make a work phy's
and four duties bind it (§1), and the words have rules of their own (§2).
The rest is a kit of good defaults (§3), a way into pieces made to be enjoyed
(§4) and a way of working (§5).

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

**phy**, always lower case, even at the start of a sentence, and "they". The
handle is `rareone0602` on GitHub and X; a credit to phy links to
[LinkedIn](https://www.linkedin.com/in/po-hung-yeh-6a8134116).

**Five principles** make a work phy's. Each is about the reader, not the
medium, so it holds in a medium this guide has never met.

1. **One point.** A viewer keeps one thing, so every piece says one thing,
   and says it first: whatever is read first for the point (a slide's or a
   chart's title, a page's first line, a film's first frame) is the claim,
   never the topic ("v4 is twice as fast", never "build times"). A name is
   not a claim: a site, a film or a tool may be titled by its name, and then
   the line under the name is the claim. A point that will not fit in a
   sentence is two pieces.
2. **Quiet ground, one loud thing.** Colour, size, motion and jokes are a
   budget. The first three are spent on the point: the series a chart is
   about, the character on a page, the place in a film; a joke keeps to the
   corners (§2). The rest is graphite on paper. Turned grey (CIELAB L* alone)
   and shrunk to a thumbnail, the point is still what is seen first. A work
   with no colour of its own to spend takes the green of phy's eyes (`--green`
   in the kit).
3. **One hand, as exact as the reader's task.** A person is recognised by
   hand and voice, not by a logo, so there is one face, **Shantell Sans**, a
   hand drawn with one even line, and one voice (§2: British English, dry and
   exact) throughout. The hand is loose where the reader looks and exact
   where the reader measures: data, maths and code never wobble. Something
   shows that a person made it, be it a line that wobbles, spacing a little
   uneven or the grain a pencil, a brush or a press leaves, and nothing is
   there because the tool offered it: a gradient, a glow, a drop shadow, an
   emoji, a stock icon, hero copy, a grid of cards.
4. **Same hand, new idea.** Identity is what stays, and attention goes to
   what changes. The first idea to come is presumed the dull one: the
   template, the stock phrase, the default chart, the formal tone put on for
   show, and phy's own last one. The test is of the idea, not the look. With
   the name covered, a piece is plainly phy's; beside phy's last piece of the
   same kind (the casebook, §5), it is plainly not that one. A run of pieces
   made as one (a talk's slides, a set of cards) counts as one piece. A piece
   made to delight surprises, and then, on a second look, seems the only way
   it could have gone.
5. **It travels alone.** Work is shared when it is whole on its own. Cropped,
   screenshotted, reposted or redrawn in someone else's talk, a piece still
   makes its point, still says whose it is, and still credits whoever else is
   in it. So what a piece needs is in the piece: a label on the line rather
   than in a legend, a name written rather than linked.

**Four duties** bind every piece, however free:
- **The owners' say.** Other people and their characters appear only with
  their owners' say-so, as the owners gave them and in the media the owners
  agreed to. An owner's wish beats any rule here.
- **Private stays private.** Personal references (photos of a real pet, say)
  live in a git-ignored folder and never reach a public page. Quote phy's own
  words only where a piece needs them.
- **Licences.** Whatever a piece takes, it takes within its licence, and
  credits its maker even where nothing requires it: the face (§3), the music
  (§4), and other people's characters, which are not phy's to license.
- **The reader's settings.** What the reader's system asks for, a work gives:
  light or dark, less motion, the system's own colours. A page never offers
  a switch for light (§3).

**What the reader does with a work** sorts it, and the rest follows:

| the reader | such as | the dial (§3) | the kit | three ideas (§5) |
|---|---|---|---|---|
| measures it | a chart, a paper's diagram, a table of results | `0` | the figures' rules, kept | no |
| uses it | a tool, a README, notes, slides, a site's working pages | `50` | kept: sameness is what makes it easy to use | no |
| enjoys it | a picture, a film, a game, a card, a hobby project | `50` to `100` | only what its idea needs | yes |

A work of two kinds is sorted part by part: a chart on a slide is measured,
and the slide round it is used.

**The signature** is the name, in lower case and in the hand, once in a
work: beside the title or in a corner. A talk, a site and a film are each
one work, so a chart inside a signed talk is not signed again. Informal work
(a site, a card, a hobby project) may add a sign-off: phy's avatar, an Eevee
in the colours of phy's tuxedo cat, seated beside the name; where there is
no room, as in a favicon, its head alone stands for it, drawn for its size
rather than shrunk (the kit's README has both). Formal work (a paper, a
talk, a chart) is signed by the name alone, and a work about other people's
characters, such as the gallery, leaves the avatar out.

## 2. words

**Prose** is modelled on The Economist: opinionated, analytical and dry, with
words few, exact and honest, like a note in the margin.
- **British English, all the way down:** the spelling (colour, centre, grey,
  programme, -ise) and the idiom as well ("at the weekend", "in hospital",
  "take a decision"); American prose in British spelling is not British
  English. English only: a name or a quote from another script is written in
  Latin letters or in translation, and no file holds CJK text, code and data
  included.
- **Take a view, in the exact word.** Say which is better and why, with the
  evidence, in short sentences: "the second method is better: it halves the
  build time", never "both approaches have their merits". Numbers and names,
  not adjectives: "one script redraws every figure in about 40 seconds", never
  "blazing-fast". A long word is welcome when it is the precise one, never to
  sound clever.
- **No hype and no ceremony:** no "magical", "seamless" or "leverage", no
  welcome, no call to action, no farewell, no exclamation marks and no emoji.
  "that's me", never "Meet phy, the creator behind it all!". Where the reader
  can do something, say what, plainly.

Two habits, kept unless a piece has a reason to break them:
- **Case follows the dial** (§3). From `50` up, the chrome (titles, headings,
  nav, labels, notes, captions, buttons and footers) is lower case and running
  prose is in sentence case; below `50`, and in plain text (READMEs, email),
  it is sentence case throughout. People's and characters' names keep their
  owner's case; any other name in the chrome goes lower case with it (a
  species in a label, a site's name as a link). A page talks about the work;
  where phy speaks, it says "me", and the reader is "you". Dates go in full
  in prose (28 September 2026) and short in a date line (28 sep 2026).
- **Humour is dark and dry**, and phy's own: understatement, irony and the
  grim thing said in the flattest official voice, never explained. A line or
  two, in the corners, never in what the reader came for. Never at the
  expense of a real person, their character or the reader, and never baby
  talk.

**Code** is a language of its own: American English and formal. The dial, the
lower-case chrome and the humour stop at its edge.
- **American English** in identifiers, comments, docstrings and commit
  messages: `color`, `center`, `gray`, `normalize`, `behavior`, `license`,
  `labeled`, `toward`. Words the code puts in front of people (a page's text,
  a label, an error message) are prose, and follow the rules above.
- **Formal.** Comments and docstrings are full sentences in sentence case,
  plain and precise: no jokes, no asides and no metaphors.
- **Plain names:** no cute names and no puns, however playful the project.

## 3. the kit

The house setting: a work that is used keeps it, and a work that is enjoyed
takes from it (§1). Each part says what it is for; the kit's READMEs say how.

**Paper and ink.** The page is a sheet of lined notebook paper: pale blue
rules, a faded red margin line and a little paper tooth, with everything
written on the rules. The rules and the margin line are decoration, so
nothing that carries meaning is drawn in them. The inks run from graphite for
words to red, which on a working page is only for an error.
- **The dark sheet.** Where the reader's system asks for dark (§1), the paper
  and the ink swap: the sheet is graphite, and the words are in the paper's
  colour, like white pencil on black paper. Nothing is inverted: a character
  keeps its own paper, and a scan its own white. On a dark host the page
  doesn't control, a slide say, lay a sheet of paper on it. A print is always
  on paper.
- **Other sheets** (`lib/style/site/papers.css`): graph paper, a score, a
  toned sketchbook, kraft, an index card, a cyanotype, and tracing paper laid
  over another, each with inks that keep the paper's contrasts. A light sheet
  turns to the dark sheet with the page; a dark or toned one is a piece's
  look, never a working page's.
- **Blue pencil**, an illustrator's non-photo blue deepened to be read, is
  for a page's workings: the construction under a drawing and the notes on
  how the page is made, shown only when the reader asks.

**Type: the dial.** The face is fixed (§1); its informality axis lets the
same hand be exact in a diagram and loose in a toy. Each work sets one
number, `--informal`, by what its reader does (§1): `0` where the reader
measures, `50` where the reader uses, and up to `100` where the reader
enjoys, with a hobby project at the top. Running words sit at the work's
number; the few words written rather than set (titles, headings, notes,
names) are never neater than `50`. A chart's own words (its axes, ticks and
labels) are at `0`; its title and its caption belong to the page or the
slide it sits on. Weight is pressure: everything is light, bold is the
pencil pressed harder, and there are no italics. Only code (the system
monospace) and words in a host that sets its own type (a paper's text and
maths, a README on GitHub) are in another face. The face's files are in
`lib/style/figures/fonts/` (whole, for LaTeX, matplotlib and design tools)
and `lib/style/site/fonts/` (a Latin subset, for anything sent over a
network); the SIL Open Font License allows any use, so long as the licence
file stays beside any copy of the font.

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

**The reader's settings** (§1), in practice. Under reduced motion nothing
moves unbidden: what the motion said is said in a still, and a film waits to
be played. A page holds at a phone's width. Print is on plain paper, and
forced colours are the system's own. A picture that carries meaning has a
name that a screen reader can read; one that is decoration has none.

**Charts and a paper's diagram** wear the hand at its most exact, since the
reader measures them (§1). `lib/style/figures/` carries their rules, on a
slide and in print, and the styles for matplotlib and TikZ.
- **Data colours** come from phy's characters: five at most, each legible on
  the paper and apart under colour blindness. A series keeps its colour from
  figure to figure, never its rank. On a slide only the point's series takes
  its colour (§1) and the baselines are graphite; in print, where the reader
  compares, every series takes its own and the data is the only saturated
  thing.
- **A caption** says what is shown, then what it shows: "build time for four
  versions: the last one halves it".
- **A paper's main diagram**, the one people remember the paper by and redraw
  in their own talks, is where the hand shows; the paper's text keeps the
  venue's type.

## 4. pieces

A piece made to delight (a picture, a film, a game) is looked at before it is
read. What follows are ways in, not requirements, except where it says a
thing is fixed.

**The picture.** A frame is composed, not filled. Some ways in which the one
loud thing (§1) has been made loud:
- scale doing the work: something large against something small;
- the paper as part of the picture, a frame mostly empty when the idea is
  small;
- off centre and uneven: a row facing us, evenly spaced, has been done.

**Light is drawn, never filtered.** A beam or a pool of lamplight is a pale
shape in coloured pencil laid on the set, or, on a dark sheet, rubbed out of
the graphite as an eraser leaves it. Night is a darker sheet of paper, on
which the inks turn over.

**References.** Each piece picks its own, and takes one thing from each,
never a whole look. The casebook (§5) lists those that have served, and what
each gave.

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
  goes only through a platform's own library, never on a page.
- **Credits once, large.** A link in a picture cannot be clicked, so a video
  names the people and characters in it once, written large, and the post
  that carries it links them.

## 5. working with phy

In the order the work goes:

- **Discuss before building** anything big: say what you'll make and wait
  for a yes. The surprise is in the idea, not the scope: add no work phy did
  not ask for.
- **Three ideas first**, for a work the reader enjoys (§1). Think first of
  what the viewer will enjoy, and sketch three ideas before choosing. One of
  them leaves the kit entirely, keeping only the hand, the voice and a quiet
  ground. An ideas agent is briefed with the piece and the four duties (§1)
  alone, never with this guide. The first idea to come stays only if it beats
  the other two. Then draw the best: the kit gives way to the idea. Where §1
  or §2 blocks a good idea, propose changing the rule rather than dropping
  the idea.
- **Show, don't describe.** Render the options, put them side by side and say
  which you would pick. Looks are settled by looking, and a look settled for
  one piece stays with that piece: it never becomes a rule here.
- **Keep the source** (a spec, a script, a Markdown file) and the command
  that builds from it; a built file is never edited by hand. A first version
  is a sketch, to be redrawn once phy has looked, and the candidates that lose
  are kept until phy says otherwise.
- **An adversarial review** for visual work, by a reviewer who knows the
  references and the casebook and asks first where we have seen this before.
  A review, whoever writes it, is a reference rather than an order: check
  each finding against the work, adopt what holds, and say what was rejected
  and why.
- **phy reviews before anything is published.** Committing, pushing, posting
  and sharing are phy's call, each time.
- **The casebook**, `lib/style/CASEBOOK.md`, then takes one line for the
  finished piece, newest first: what it is, its idea in one sentence and a
  link. It records what has been done so that the next piece can do something
  else (§1); nothing in it is a rule.
