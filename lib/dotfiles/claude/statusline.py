#!/usr/bin/env python3
"""Claude Code status line in phy's inks: who, where and which model, then a meter for each limit.

Claude Code pipes the session to this script as JSON on stdin and shows what it prints. The inks follow the
house style at https://rareone0602.github.io/phy_friends/style.html. lib/dotfiles/install.sh links this file from
a clone of phy_friends, so a git pull updates it, and the settings recommended beside it run it.
"""

import getpass
import json
import os
import socket
import subprocess
import sys

# The inks, written by `python3 tools/dark_sheet.py` from the kit's and the figures' (lib/style): edit those and run it.
INKS = {
    "dark": {
        "ink": "#fbf9f3", "ink2": "#b4b1a9", "ink3": "#86837a", "red": "#fe9c8c", "rule": "#45505a",
        "blue": "#1d97cf", "slate": "#a7b9f2", "ochre": "#9d840e", "pink": "#d46b75",
    },
    "paper": {
        "ink": "#3d3c39", "ink2": "#6d6a63", "ink3": "#97938a", "red": "#a64a3f", "rule": "#cfdbe8",
        "blue": "#1092ca", "slate": "#4d6295", "ochre": "#a98f12", "pink": "#d56b75",
    },
}
# The end of the inks.

# Each meter keeps one data color (lib/style/figures/README.md) on every machine. The red one is left out, since red is
# for a limit reached.
METERS = (
    ("context", "blue", ("context_window", "used_percentage")),
    ("5h", "slate", ("rate_limits", "five_hour", "used_percentage")),
    ("7d", "ochre", ("rate_limits", "seven_day", "used_percentage")),
)
LIMITS = ("5h", "7d")
METER_WIDTH = 12
PRESSED_FROM = 85
BOLD = "\033[1m"
RESET = "\033[0m"


def color(hex_color):
    """Return the escape sequence that sets a 24-bit foreground color."""
    red, green, blue = (int(hex_color[i:i + 2], 16) for i in (1, 3, 5))
    return "\033[38;2;{};{};{}m".format(red, green, blue)


def lookup(data, path):
    """Follow a path of keys into nested dictionaries, returning None where any key is missing."""
    for key in path:
        if not isinstance(data, dict):
            return None
        data = data.get(key)
    return data


def settings_path():
    """Return the path of Claude Code's user settings."""
    config_dir = os.environ.get("CLAUDE_CONFIG_DIR", os.path.join(os.path.expanduser("~"), ".claude"))
    return os.path.join(config_dir, "settings.json")


def system_is_light():
    """Whether the system asks for light: macOS's appearance, or GNOME's color scheme. A machine reached over SSH has
    no appearance of its own that this script can read, so it, like any other that says nothing, counts as dark."""
    if os.environ.get("SSH_CONNECTION"):
        return False
    try:
        if sys.platform == "darwin":
            # The key holds "Dark" while the appearance is dark, and is absent while it is light.
            result = subprocess.run(["defaults", "read", "-g", "AppleInterfaceStyle"], capture_output=True,
                                    text=True, timeout=1)
            return result.returncode != 0 or "Dark" not in result.stdout
        result = subprocess.run(["gsettings", "get", "org.gnome.desktop.interface", "color-scheme"],
                                capture_output=True, text=True, timeout=1)
        return result.returncode == 0 and "dark" not in result.stdout
    except (OSError, subprocess.SubprocessError):
        return False


def sheet():
    """Choose the inks: STATUSLINE_SHEET if set; otherwise the Claude Code theme's sheet, and for "auto" (or no theme)
    the system's, as Claude Code follows it."""
    chosen = os.environ.get("STATUSLINE_SHEET")
    if chosen in INKS:
        return INKS[chosen]
    try:
        with open(settings_path()) as settings_file:
            theme = str(json.load(settings_file).get("theme", ""))
    except (OSError, ValueError, AttributeError):
        theme = ""
    if theme.startswith("light"):
        return INKS["paper"]
    if theme.startswith("dark"):
        return INKS["dark"]
    return INKS["paper"] if system_is_light() else INKS["dark"]



def short_path(path):
    """Write a path under the home folder with a tilde, as a shell prompt does."""
    home = os.path.expanduser("~")
    if path == home:
        return "~"
    if path.startswith(home + os.sep):
        return "~" + path[len(home):]
    return path


def identity_line(data, inks):
    """Draw the first line: who, where and which model, separated by middle dots."""
    dot = color(inks["ink3"]) + " · "
    host = socket.gethostname().split(".")[0]
    parts = [color(inks["ink"]) + getpass.getuser() + "@" + host]
    where = lookup(data, ("workspace", "current_dir")) or data.get("cwd")
    if where:
        parts.append(color(inks["ink2"]) + short_path(where))
    model = lookup(data, ("model", "display_name"))
    if model:
        parts.append(color(inks["ink2"]) + model.lower())
    return dot.join(parts) + RESET


def meter(label, series_color, percent, inks):
    """Draw one meter: its label, a heavy stroke for the part used and a faint rule for the rest, then the number."""
    percent = max(0.0, min(100.0, float(percent)))
    filled = int(round(percent / 100 * METER_WIDTH))
    stroke = color(series_color) + "━" * filled + color(inks["ink3"]) + "─" * (METER_WIDTH - filled)
    if label in LIMITS and percent >= 100:
        number = color(inks["red"]) + "100% limited"
    else:
        weight = BOLD if percent >= PRESSED_FROM else ""
        number = weight + color(inks["ink"]) + "{:.0f}%".format(percent)
    return color(inks["ink2"]) + label + " " + stroke + " " + number + RESET


def meter_line(data, inks):
    """Draw the second line from the meters the session reports, or return None when it reports none."""
    meters = []
    for label, series, path in METERS:
        percent = lookup(data, path)
        if isinstance(percent, (int, float)):
            meters.append(meter(label, inks[series], percent, inks))
    return "   ".join(meters) if meters else None


def main():
    """Read the session from stdin and print the status line."""
    try:
        data = json.load(sys.stdin)
    except ValueError:
        data = {}
    if not isinstance(data, dict):
        data = {}
    inks = sheet()
    lines = [identity_line(data, inks), meter_line(data, inks)]
    # Write UTF-8 bytes directly, because an ASCII locale on an older Python cannot encode the meter strokes.
    sys.stdout.buffer.write(("\n".join(line for line in lines if line) + "\n").encode("utf-8"))


if __name__ == "__main__":
    main()
