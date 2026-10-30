# Working in phy_friends

Before making anything, read `STYLE.md` (the look, the words and the way of working)
and, for anything with the fwiends in it, `FWIENDS.md`. `README.md` says where
each part of the repository lives, and `lib/fwiends/README.md` documents the
code. These rules are for agents working here, most important first.

1. **Consent comes from the cast.** `lib/fwiends/characters/cast.js` says
   which media each owner has agreed to and which owners know each other.
   Never put a friend in a medium its owner has not agreed to, and never give
   one a fact, a line or a relationship its owner did not give. Owners accept
   moderate changes to how their characters are drawn; consent does not move.
2. **Private material stays where it is.** Never copy, quote, describe or
   commit anything in `characters/*/examples/` or `characters/*/private/`, any
   untracked folder, or anything `CLAUDE.local.md` names. Owners' real names
   stay out of files; their handles are fine.
3. **Commit or push only when phy asks**, and never rewrite history.
4. **Fix the shared structure, never one character.** A difference between
   friends is fixed in the factory, the house anatomy or a check, not patched
   into one spec. Claude is exempt from the house anatomy and shows no
   feelings.
5. **One pass.** A change updates every document, page and derived value it
   touches. Generated files are never edited by hand; their tools write them:
   `pf.py pages` (script tags and the gallery's rows), `tools/dark_sheet.py`
   (the dark sheet, the papers' and the dotfiles' inks) and
   `tools/site_assets.py` (icons and the link preview). `style.html` is drawn
   by hand from `STYLE.md` and `FWIENDS.md`, so a change to a rule it pictures
   redraws the picture. Work is done when `python3 tools/pf.py test` passes.
6. **No CJK text in any file**, code and data included.
