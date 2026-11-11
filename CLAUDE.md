# Working in phy_friends

Before making anything, read `STYLE.md` (five principles, four duties, the
words and the way of working) and, for anything with the fwiends in it,
`FWIENDS.md`. `README.md` says where each part of the repository lives, and
`lib/fwiends/README.md` documents the code. These rules are for agents working
here, most important first. The first three are the guide's duties as this
repository keeps them; its fourth, the reader's settings, is the kit's work.

1. **Consent comes from the cast.** `lib/fwiends/characters/cast.js` says
   which media each owner has agreed to and which owners know each other.
   Never put a friend in a medium its owner has not agreed to, and never give
   one a fact, a line or a relationship its owner did not give. Owners accept
   moderate changes to how their characters are drawn; consent does not move.
   An owner's decision about a character is recorded in its spec, in a
   comment beside the part it settles.
2. **Private material stays where it is.** Never copy, quote, describe or
   commit anything in `characters/*/examples/` or `characters/*/private/`, any
   untracked folder, or anything `CLAUDE.local.md` names. Owners' real names
   stay out of files; their handles are fine.
3. **Nothing comes in without its licence.** A font, a track or a picture
   made by someone else is used only as its licence allows, with the licence
   beside it and its exception written into `README.md`'s Licence section. The
   fwiends are their owners', never phy's to license.
4. **Commit or push only when phy asks**, and never rewrite history.
5. **Fix the shared structure, never one character.** A difference between
   friends is fixed in the factory, the house anatomy or a check, not patched
   into one spec. Claude is exempt from the house anatomy and shows no
   feelings.
6. **One pass.** A change updates every document, page and derived value it
   touches. Generated files are never edited by hand; their tools write them:
   `python3 tools/pf.py pages` (script tags and the gallery's rows and drawings),
   `tools/dark_sheet.py` (the dark sheet, the papers' and the dotfiles' inks)
   and `tools/site_assets.py` (icons and the link preview). `style.html` is
   drawn by hand from `STYLE.md` and `FWIENDS.md`, so a change to a rule it
   pictures redraws the picture. Work is done when `python3 tools/pf.py test`
   passes.
7. **No CJK text in any file**, code, data and file names included. A name or
   a quote from another script is written in Latin letters or in translation.
   `python3 tools/pf.py test` fails on any tracked file that holds some; an
   untracked file is yours to check.
