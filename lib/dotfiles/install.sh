#!/bin/bash
# Installs phy's dotfiles from the clone of phy_friends that holds this script: links ~/.vimrc to vimrc and Claude
# Code's status line to claude/statusline.py, so that a git pull in the clone brings both up to date. Claude Code's
# settings are not linked: claude/settings.json recommends them, and each machine aligns its own by hand (README.md).
# Usage:
#   git clone --filter=blob:none --sparse https://github.com/rareone0602/phy_friends.git ~/.dotfiles
#   git -C ~/.dotfiles sparse-checkout set lib/dotfiles
#   ~/.dotfiles/lib/dotfiles/install.sh
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
config_dir="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"

if ! command -v python3 >/dev/null; then
  echo "The status line needs python3. Install it, then run this again." >&2
  exit 1
fi

# Links a file to its copy in this clone, given by its path in lib/dotfiles. A link into lib/dotfiles that an earlier
# run made, from this clone or another and wherever the file then lay, is replaced, and so is a file that already
# matches its copy; any other file is kept beside it as <file>.before-dotfiles, unless an earlier run kept one, which is
# never overwritten.
link() {
  local target="$1" source="$here/$2"
  if [ -L "$target" ] && [ "$(readlink "$target")" = "$source" ]; then
    return
  fi
  if [ -L "$target" ] && [[ "$(readlink "$target")" == */lib/dotfiles/* ]]; then
    rm "$target"
  elif [ -f "$target" ] && [ ! -L "$target" ] && cmp -s "$target" "$source"; then
    rm "$target"
  elif [ -e "$target" ] || [ -L "$target" ]; then
    if [ -e "$target.before-dotfiles" ] || [ -L "$target.before-dotfiles" ]; then
      echo "Both $target and $target.before-dotfiles exist: move one of them, then run this again." >&2
      exit 1
    fi
    mv "$target" "$target.before-dotfiles"
  fi
  mkdir -p "$(dirname "$target")"
  ln -s "$source" "$target"
}

# Each link, as the file in its place and the path of its copy in lib/dotfiles. Every copy is checked before any link
# is made, so that a clone missing one leaves the machine as it was.
links=("$HOME/.vimrc" vimrc "$config_dir/statusline.py" claude/statusline.py)
for ((i = 1; i < ${#links[@]}; i += 2)); do
  if [ ! -f "$here/${links[i]}" ]; then
    echo "This clone has no lib/dotfiles/${links[i]}: pull it again, then run this again." >&2
    exit 1
  fi
done
for ((i = 0; i < ${#links[@]}; i += 2)); do
  link "${links[i]}" "${links[i + 1]}"
done

echo "Linked ~/.vimrc and Claude Code's status line to $here; a git pull there updates them."
echo "Claude Code's settings stay the machine's own: $here/claude/settings.json recommends them."
