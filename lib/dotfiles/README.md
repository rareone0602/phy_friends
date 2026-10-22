# Dotfiles

phy's setup, the same on every machine where it can be: the editor, Claude
Code's status line, and the settings recommended for Claude Code. The inks in
`vimrc` and `claude/statusline.py` are the kit's, which
`python3 tools/dark_sheet.py` writes into them.

| file | on a machine |
|---|---|
| `vimrc` | linked as `~/.vimrc`: Google's indents and line lengths, in the house inks |
| `claude/statusline.py` | linked as `~/.claude/statusline.py`: who, where, which model, and a meter for each limit |
| `claude/settings.json` | not linked: the settings recommended for `~/.claude/settings.json` |

## Setting up a machine

Each machine keeps a clone of its own for these files, apart from any it works
in, so that a branch switched or a change half made there never reaches the
setup:

```sh
git clone --filter=blob:none --sparse https://github.com/rareone0602/phy_friends.git ~/.dotfiles
git -C ~/.dotfiles sparse-checkout set lib/dotfiles
~/.dotfiles/lib/dotfiles/install.sh
```

`install.sh` links `~/.vimrc` and the status line in place of the machine's
own, which it keeps as `<file>.before-dotfiles` unless it already matched. Run
it again after a pull that adds a file; anything already linked stays as it is.

## Claude Code's settings

`claude/settings.json` is a recommendation, not a link. Each machine keeps its
own `~/.claude/settings.json` and takes from it what its hardware and its work
need, by hand: the model and effort, the theme, the permissions and the
plugins. A setting worth having
everywhere goes into the recommendation, so that the next machine starts from
it. `python3 tools/pf.py test` fails while the recommendation does not parse,
or while a dotfile names one machine's home folder rather than `~`.

## What stays on each machine

The login (the Keychain on macOS, `~/.claude/.credentials.json` elsewhere),
`~/.claude.json` (the account, the folders trusted and any MCP servers),
`~/.claude/settings.json`, any `~/.claude/CLAUDE.md`, the history, the sessions
and each project's memory, which is kept under the machine's own paths.
