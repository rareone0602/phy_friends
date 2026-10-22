#!/bin/bash
# Installs phy's dotfiles from this clone of phy_friends: links ~/.vimrc to lib/dotfiles/vimrc and Claude
# Code's status line to lib/dotfiles/statusline.py, so that a git pull in the clone updates both.
# Usage: git clone https://github.com/rareone0602/phy_friends.git && phy_friends/lib/dotfiles/install.sh
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
config_dir="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"

if ! command -v python3 >/dev/null; then
  echo "The status line needs python3. Install it, then run this again." >&2
  exit 1
fi

# Links a file to its copy in this clone. A file already there is kept beside it as <file>.before-dotfiles,
# unless an earlier run kept one, which is never overwritten.
link() {
  local target="$1" source="$2"
  if [ -L "$target" ] && [ "$(readlink "$target")" = "$source" ]; then
    return
  fi
  if [ -e "$target" ] || [ -L "$target" ]; then
    if [ -e "$target.before-dotfiles" ] || [ -L "$target.before-dotfiles" ]; then
      echo "Both $target and $target.before-dotfiles exist: move one of them, then run this again." >&2
      exit 1
    fi
    mv "$target" "$target.before-dotfiles"
  fi
  ln -s "$source" "$target"
}

mkdir -p "$config_dir"
link "$HOME/.vimrc" "$here/vimrc"
link "$config_dir/statusline.py" "$here/statusline.py"

# Point Claude Code at the script, keeping every other setting and a copy of the file as it was before the first
# run.
python3 - "$config_dir" <<'EOF'
import json
import os
import shlex
import shutil
import sys

config_dir = sys.argv[1]
settings_path = os.path.join(config_dir, "settings.json")
settings = {}
if os.path.exists(settings_path):
    with open(settings_path) as settings_file:
        settings = json.load(settings_file)
    if not os.path.exists(settings_path + ".before-statusline"):
        shutil.copyfile(settings_path, settings_path + ".before-statusline")
# Any other setting of the status line (its padding, say) is kept.
settings["statusLine"] = {
    **(settings.get("statusLine") or {}),
    "type": "command",
    "command": "python3 " + shlex.quote(os.path.join(config_dir, "statusline.py")),
}
with open(settings_path + ".tmp", "w") as settings_file:
    json.dump(settings, settings_file, indent=2)
    settings_file.write("\n")
os.replace(settings_path + ".tmp", settings_path)
EOF

echo "Linked ~/.vimrc and Claude Code's status line to $here. A git pull there updates them."
