# phy's style guide

This is phy's house style: one voice and one look for everything phy makes,
from pages, slides and posters to READMEs, hobby projects and code. Hand it
to anyone, or any agent, making something for phy. A paper's text has its
own guide; from a paper, this one covers only the main diagram (§8).

The idea behind all of it is to **draw rather than design**: by hand, or as a
hand would, and as easy to erase and redraw as a pencil line. Colour belongs
to what the work is about.

**This guide is the standard.** Where anything else disagrees with it, the
guide wins; where the guide is wrong, it is corrected here. The source is
`STYLE.md` in [rareone0602/phy_friends](https://github.com/rareone0602/phy_friends),
also at [its raw address](https://raw.githubusercontent.com/rareone0602/phy_friends/main/STYLE.md)
for an agent to read. Other projects copy the kit (§7) from the same commit
and point to the source; a copy does not update itself. §2 is the guide in
short, for a brief with no room for the rest.

**The details live in code.** The look of a page is a CSS library, `site/`,
whose README lists its tokens, type, marks and components; the look of a chart
or a diagram is in `figures/`, whose README lists the data colours and the
rules for charts, slides and a paper's diagram. This guide keeps the intent.

---

## 1. who phy is

- **phy**, always lower case, even at the start of a sentence. The handle is
  `rareone0602` on GitHub and X; a credit to phy links to
  [LinkedIn](https://www.linkedin.com/in/po-hung-yeh-6a8134116).
- **The avatar is phy**, phy's fursona: an Eevee in the colours of phy's
  tuxedo cat, with Oreo crumbs on the ruff and tail (§9).
- **Draws with code.** phy noticed that
  [Grokbot Icon](https://grokbot-icon-studio.serio-ai.chatgpt.site/)'s
  character icons have a low Kolmogorov complexity: a few ellipses, some
  tufts, two pill eyes and a blush. So phy's characters are made by a small
  program, not stored as pixels.

## 2. principles

1. **Keep the source.** Keep the source (a spec, a script, a Markdown file)
   and the command that builds from it. Each thing has one folder, with its
   examples beside it; working output goes in a git-ignored `out/`, and a
   built file is committed only where publishing needs it, never edited by
   hand. When something goes, all of it goes: no leftover references, no
   half-renamed words, no commented-out code; git remembers. Candidates that
   lose are set aside in a `backup/` folder until phy says otherwise. A first
   version is a sketch, to be redrawn once phy has looked.
2. **Don't make it too artificial.** Drawn, not designed: honest and quiet,
   in a texture a hand or a press leaves (pencil, ink, chalk, a print's grain),
   with lines that wobble and spacing a little uneven (§6). The work is in
   paper and ink tones, and colour goes to what it is about: the characters on
   a page, the data in a figure, the places in a film. Red is only for an
   error. No gradients, glows, glass, drop shadows, emoji, stock icons, hero
   copy or template layouts such as a grid of cards. Nor the mode: the most
   likely choice (the template, the stock phrase, the default chart, the
   formal tone put on for show) is the boring one, so look for the way that
   fits this idea. phy's work stays consistent through its rules, not through
   sameness. A piece made to delight should surprise, and then, on a second
   look, seem the only way it could have gone.
3. **Make it cute.** Characters are soft and round, with a big head on a small
   body. Cute comes before literal, so long as every part can still be told
   apart.

And the particulars:
- **One hand on one dial:** everything is in Shantell Sans, set by one
  number, `0` for a paper's diagram, `50` for a site, `100` for a hobby
  project (§5). Code is in the system monospace.
- **British English, as The Economist writes it** (§3); code in American
  English, formal and clean (§10).
- **Show phy first**, and keep private things private (§11).
- **A film is cut to its music**, chosen first and free to set to pictures
  (§12).

**Fixed rules and defaults.** A few things hold in everything phy makes: the
owners' say (people and their characters appear only with their owners'
say-so, as the owners give them: name, species, colours, pronoun and a credit
linking to the owner; an owner's wish beats a house rule), the characters as
their specs draw them (§9), the one face (§5), the words in prose and in code
(§3, §10), private things (§11) and whose music a film may use (§12). The rest
of the look, from the ruled paper and the layout to the texture, marks,
colour, light and motion, is the house setting. A page, a chart or a deck
keeps it, since there sameness is what makes it easy to use. A piece made to
delight (a picture, a film, a game) may depart from whatever the idea needs,
and says so: a line at the top of its source names each departure and why, and
a series departs together.

## 3. words

The model is The Economist: opinionated, analytical and dry, with words few,
exact and honest, like a note in the margin.
- **British English, all the way down:** the spelling (colour, centre, grey,
  programme, -ise) and the idiom as well ("at the weekend", "in hospital",
  "take a decision"); American prose in British spelling is not British
  English. English only: another script appears only inside someone's own
  name or a quote of theirs.
- **Take a view, in the exact word.** Say which is better and why, with the
  evidence, in short sentences: numbers and names, not adjectives. A long word
  is welcome when it is the precise one, never to sound clever. No hype
  ("magical", "seamless", "leverage") and no ceremony: no welcome, no call to
  action, no sign-off, no exclamation marks and no emoji. Where the reader can
  do something, say what, plainly.
- **Case follows the dial** (§5). From `50` up, the chrome (titles, headings,
  nav, labels, notes, captions, buttons and footers) is lower case, and
  running prose is in sentence case; below `50`, and in plain text (READMEs,
  email), it is sentence case throughout. Names keep their owner's case. A
  page talks about the work; where phy speaks, it says "me", and the reader is
  "you". Dates go in full in prose (28 September 2026) and short in a date
  line (28 sep 2026).
- **Humour is dark and dry**, and phy's own: understatement, irony and the
  grim thing said in the flattest official voice, never explained. From `50`
  up, a line or two per page, in the corners, never in what the reader came
  for; none at `0`. Never at the expense of a real person, their character or
  the reader, and never baby talk.

| do | don't |
|---|---|
| that's me | Meet phy, the creator behind it all! |
| nothing saved yet. | Oops! Looks like there's nothing here yet! |
| the second method is better: it halves the build time. | Both approaches have their merits. |
| one script redraws every figure in about 40 seconds | Blazing-fast, seamless figure generation |

## 4. paper and ink

The page is a sheet of **lined notebook paper**: pale blue rules, a faded red
margin line and a little paper tooth. **Everything is written on the rules:**
every vertical measure is a whole number of rules, and text sits on them. The
rules and the margin line are decoration, so nothing that carries meaning is
drawn in them. The inks, from graphite for words to red for errors, and their
contrast with the paper are tokens of the kit (§7).
- **The dark sheet.** Where the reader's system asks for dark, the paper and
  the ink swap: the sheet is graphite, and the words are in the paper's
  colour, like white pencil on black paper. The system's setting decides, and
  a page never offers a switch; a print is always on paper. Nothing is
  inverted: a character keeps its own paper (§9), and a scan its own white.
- On a dark host the page doesn't control, a slide say, lay a sheet of paper
  on it. A piece's night is a darker sheet (§12).

## 5. type

**One hand on one dial.** Everything is written in one face, **Shantell
Sans**: a hand drawn with one even line, like a fine pen held lightly. The
face's informality axis lets the same hand be neat in a diagram and loose in a
toy, so formality is a setting of the one voice, never another voice. Only
code (the system monospace) and words in a host that sets its own type (a
paper's text and maths, a README on GitHub) are in anything else.

**The dial.** Each work has one number, `--informal`, set by what the work
is, not where it appears: `0` for a paper's diagram and for charts, `50` for a
site, notes, slides and posters, and `100` for a hobby project, its site
included. A work may sit anywhere between; these are the usual stops.

**The print and the hand.** Running words, the print, sit at the work's
number. The few words written rather than set, the hand (titles, headings,
notes, captions, table heads and names), are never neater than `50`, and are
for a few words: anything longer than a line goes in the print. Weight is
pressure: everything is light, bold is the pencil pressed harder, and there
are no italics. The sizes, the steps of the dial and how a line sits on its
rule are the kit's (§7). The face's files for LaTeX, matplotlib or a design
tool are in `figures/fonts/`; the SIL Open Font License allows any use, so
long as the licence file stays beside any copy of the font.

## 6. hand-drawn marks

Every mark is a single stroke, never filled, in an ink. A page has a few, the
kit's: a ground line to stand or underline on, a ring round "this one", an
arrow from a note, a squiggle for a break or a wait, a side line down a quote,
a box round the one primary button, a tick, a cross for an error and a caret
on a select. If a page needs another, write a word instead; a piece (§12)
draws whatever it needs, rain or speed lines, by the same rule. A mark may
turn to point somewhere or grow to hold its own; it is still the same mark,
and it tilts anticlockwise, never more than `2°`. **The graphite filter**,
the grain that makes a line look drawn, goes over the title, the ground line
and the arrow, never over small text or a figure.

## 7. parts of a page

**The kit** is a CSS library, `site/` in rareone0602/phy_friends, to copy from
one commit: `phy.css` loads the paper (`notebook.css`) and everything drawn on
it (`pencil.css`); `fonts/` holds the face, `graphite.svg` the graphite filter
and `icon.svg` the favicon. Its README says how to set a page up and lists
every token, size, mark and class, and `specimen.html` shows every part at
work, on the rules, with the dial to turn. A page has a `header` (the title,
the intro and any nav), a `main` holding the writing and a `footer`.

**Layout.** One column, `42em` at most, left-aligned against the margin
line: a title in the hand, one line of intro, the content and a small
footer. Nothing else is required.

**What a page leaves out, and what it says:**
- No menus and no hamburgers: the nav is plain words, with the ring round
  the current page, and a page in one part needs no nav. Tags are plain
  words, with no pills and no #.
- Links are the text itself, underlined in pencil.
- Pictures sit on the rules with no frame, no rounded corners and no shadow,
  scaled to fit and never cut. A photo stays a photo, with no words over it.
- Tables are the rules themselves: no borders, stripes or vertical lines. A
  phone fits three columns: fold the rest into a label, or split the table.
- One primary button per view; every other button is quiet. No placeholders
  (put an example in the label) and no switches.
- An error says what to do ("that needs to be a number, like 250"); a result
  is written in the hand, numbers and all; loading is one plain word
  ("counting…"); an empty state is one note, "nothing saved yet.", with no
  picture and no "oops".

**A portrait.** An about page may have one character standing beside the
title, a rule taller than it. It stands on the title's rule, reaches up into
the blank band, and may watch the cursor.

**Other places:**
- **Favicon:** phy's head on everything phy makes, unless the work is about
  another character.
- **Link preview:** the page's own paper, title and characters, set to fill
  `1200×630` with every character at one size; not a designed card, with no
  extra text and no logo.
- **README:** GitHub strips CSS, so the style lives in the words, in
  sentence case (§3): a title, one honest line, the preview picture and short
  plain sections. No badges, no emoji and no feature lists.
- **Print:** plain paper, with the ink and nothing else.

## 8. charts, slides and a paper's diagram

Charts and diagrams wear the same hand, and the data plays the characters'
part as the only saturated thing (principle 2). `figures/` carries the rules
for matplotlib and TikZ, and its README lists the data colours and the rules
for charts, slides and a paper's main diagram:

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

## 9. the avatar and characters

- **phy's mark is phy** (§1): the head alone for a favicon or avatar, the
  whole character where there is room. It is drawn by `src/phyfriends.js`
  from `characters/phy/phy.js`, never by hand, so every copy matches.
- Every character is a small spec, about 100 lines, that a factory draws
  **in coloured pencil**: soft round shapes coloured in without an outline,
  pill eyes in the character's own eye colour, a soft blush, and no nose and
  no mouth by default. Each has **exactly one shade layer**, which its body,
  under the head, always wears: each colour has at most one shade, the house
  step darker (CIELAB L* `−10` and chroma `×1.2` at the same hue, with a
  near-grey leaning to lavender, as `shadeOf` in `src/phyfriends.js` computes
  it), and it only parts two neighbours of the same colour. No highlights or
  second steps, and nothing copied from a reference's light and shade: the
  pencil's texture is paper, and light (§12) falls on the place, never on a
  character. The rules for drawing one, and the references a reviewer needs,
  are in `FWIENDS.md`, next to the factory.
  However free a piece is (§12), it stages its characters and never redraws
  them.
- **The pencil is one texture over the whole character**: strokes rising to
  the right, the paper's tooth, and patches where the hand pressed more
  lightly, with the paper, rules and all, showing through. The texture
  belongs to the paper: it stays put while the character breathes, turns or
  hops on the spot, and travels with it about a page, as a figure cut out of
  paper would. On a background of its own, such as a dark close-up or the
  dark sheet (§4), a character is drawn on paper cut to its outline, so the
  pencil shows paper, never the background; on the dark sheet the cut runs
  a pencil's width wide, as a sticker's does, so that a dark character keeps
  its edge. An icon too small to hold the texture, such as a favicon, is
  drawn flat.
- **Motion** is calm and alive: eyes that follow the pointer, smoothed so
  they never jitter, over breathing, irregular blinks and a slow sway.
  Nothing bounces all the time. Under `prefers-reduced-motion` only the eyes
  move, and a page whose characters move of their own accord offers the same
  as a checkbox, "keep still".

## 10. code

Code is a language of its own: American English, formal, and clean in the
sense of Robert C. Martin's Clean Code. The dial, the lower-case chrome and
the humour stop at its edge.
- **American English** in identifiers, comments, docstrings and commit
  messages: `color`, `center`, `gray`, `normalize`, `behavior`, `license`,
  `labeled`, `toward`. Words the code puts in front of people (a page's text,
  a label, an error message) are copy, and follow §3.
- **Formal.** Comments and docstrings are full sentences in sentence case,
  plain and precise: no jokes, no asides and no metaphors.
- **Plain names:** no cute names, no puns, and no abbreviations beyond the
  field's own (`rgb`, `L*`).

## 11. working with phy

- **Discuss before building** anything big: say what you'll make and wait
  for a yes.
- **Show, don't describe.** Render the options and put them side by side.
  Looks are settled by looking; once one is settled, write it down here, at
  the source.
- **phy reviews before anything is published.** Pushing, posting and sharing
  are phy's call, each time.
- **Fanning out is welcome:** a big job may go to several agents in
  parallel. Visual work then goes to an adversarial reviewer who knows the
  references. A review, whoever writes it, is a reference rather than an
  order: check each finding against the work, adopt what holds, and say what
  was rejected and why.
- **Three ideas first.** For a piece, think first of what the viewer will
  enjoy, and sketch three ideas before choosing; an ideas agent is briefed
  with the fixed rules (§2) alone. The first idea to come is presumed the mode
  (principle 2), and stays only if it beats the other two. Then draw the
  best in the house style, departing from a default rather than dropping the
  idea (§2).
- **Private stays private.** Personal references (photos of a real pet, say)
  live in a git-ignored folder and never reach a public page. Quote phy's own
  words only where a piece needs them.

## 12. pictures, films and sound

A piece made to delight (a picture, a film, a game) is looked at before it is
read. Everything above holds in it, except where this section, or a departure
it declares (§2), says otherwise.

**The picture.** A frame is composed, not filled:
- One thing to look at first, and everything else quieter than it.
- Scale does the work: something large against something small, rather than
  everything at one size.
- The paper is part of the picture, and a frame may be mostly empty when the
  idea is small.
- Off centre and uneven. A row facing us, evenly spaced, is the gallery's
  picture; a piece needs its own.
- Turned grey (CIELAB L* alone), a frame still shows its one thing.

**The characters stay as drawn; the world is free.** As in cel animation, the
characters are drawn as they always are (§9), and the place around them takes
its own colours (principle 2) and its own light:
- **Light is drawn, never filtered:** a beam, a lit window or a pool of
  lamplight is a pale shape in coloured pencil, laid on the set. On a dark
  sheet it is rubbed out of the graphite instead, as an eraser leaves it:
  streaked, ragged at the edges and never quite clean. It falls on the place,
  never on a character or a thing (§9).
- **Night is a darker sheet** of paper, not a filter over the light one. On
  it the inks turn over, as on the dark sheet (§4), and each character keeps
  its own paper (§9).

**References**, each for the one thing to take from it, never its whole
look:
- The Snowman (Raymond Briggs's book and the 1982 film): soft coloured
  pencil throughout, almost no words, and the pace set by Howard Blake's
  score.
- Ernest & Celestine (2012): colour that stops short of the frame's edges,
  so the paper shows round every scene.
- Jon Klassen's hat books (2011–16): eyes without mouths doing all the
  acting, and menace stated flatly.

**Sound and pace:**
- **Music first.** Choose the track before the story. Measure it once, into
  data beside the film (its bars and beats, or, where the tempo is free, its
  moments), and write every cue against that data, never by ear.
- **The pace is the music's.** Motion lands on phrases, not on every beat,
  and a film may cut, pan and push in on the music's lifts, where a page
  stays calm (§9).
- **Whose music.** Never music that the agent making the film composes or
  generates; music someone else made with AI only where it is good. The
  licence must let a hobby film set it to pictures: public domain in the US,
  where the site is served (the recording as well as the score), CC0, CC BY
  or CC BY-NC. CC BY-SA only where phy alone is on screen, since the other
  characters are not phy's to license; never ND. Credit the composer even
  where nothing requires it. A commercial song goes only through a
  platform's own library, never on a page.
- **Credits once, large.** A link in a picture cannot be clicked, so a video
  names the people and characters in it once, written large, and the post
  that carries it links them.
