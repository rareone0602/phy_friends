#!/usr/bin/env python3
"""Derive the dark sheet's inks, marks and data colors from the paper's (lib/style/site/README.md and
lib/style/figures/README.md), and write them wherever they are used.

  python3 tools/dark_sheet.py

On the dark sheet the paper and the ink swap: the sheet is the graphite ink and the words are in
the paper's color. Every other ink (the rules, the margin line, ink-2, ink-3, the red and the blue
pencil) keeps its CIELAB hue and chroma and moves to the lightness at which it has the same contrast
with the dark sheet as it has with the paper, and so does each data color. The marks in lib/style/site/pencil.css
hard-code their inks, since a data URI cannot read var(), so their dark set is the same marks with
each ink replaced by its dark one.

Run it after an ink, a mark or a data color changes. It rewrites the block between its markers in
lib/style/site/notebook.css and lib/style/site/pencil.css, the data colors' table in
lib/style/figures/README.md, and the inks of both sheets in the dotfiles (lib/dotfiles/vimrc and
statusline.py), and prints each color's contrast on both sheets. The pages' theme colors (their
theme-color metas) are kept by hand: the paper's, and the dark sheet's where a page has one;
`python3 tools/pf.py test` checks them, and everything written here, with written() and theme_drift().
"""
import html.parser
import re
from pathlib import Path

from layout import DOTFILES, FIGURES, KIT

NOTEBOOK = KIT / 'notebook.css'
PENCIL = KIT / 'pencil.css'
MPLSTYLE = FIGURES / 'phy.mplstyle'  # Holds the data colors, in order, as matplotlib's color cycle.
FIGURES_README = FIGURES / 'README.md'
VIMRC = DOTFILES / 'vimrc'
STATUSLINE = DOTFILES / 'statusline.py'
SERIES = ['blue', 'red', 'slate', 'ochre', 'pink']  # The data colors' names, in their order.
# The colors a terminal is painted in: the inks, and the data colors but the red, which there would read as an error.
TERMINAL_INKS = {'ink': 'ink', 'ink2': 'ink-2', 'ink3': 'ink-3', 'red': 'red', 'rule': 'rule'}
TERMINAL_SERIES = ['blue', 'slate', 'ochre', 'pink']

# A page turns to the dark sheet only where it declares both schemes, so that pages and films made
# for paper alone keep it. Print always stays on paper.
OPT_IN = ':root:has(meta[name="color-scheme"][content~="dark"])'
MEDIA = '@media screen and (prefers-color-scheme: dark)'
INKS = ['rule', 'margin', 'ink-2', 'ink-3', 'red', 'blue-pencil']  # The inks that keep their contrast; ink and paper swap.

INKS_BEGIN = ("/* The dark sheet's inks, written by `python3 tools/dark_sheet.py` from the paper's above: edit those and run it. */")
INKS_END = "/* The end of the dark sheet's inks. */"
MARKS_BEGIN = ("/* The dark sheet's marks, written by `python3 tools/dark_sheet.py` from the marks above and the inks in\n"
               "   lib/style/site/notebook.css: edit those and run it. */")
MARKS_END = "/* The end of the dark sheet's marks. */"
VIM_BEGIN = """    " The inks, written by `python3 tools/dark_sheet.py` from the kit's and the
    " figures' (lib/style): edit those and run it."""
VIM_END = '    " The end of the inks.'
PYTHON_BEGIN = "# The inks, written by `python3 tools/dark_sheet.py` from the kit's and the figures' (lib/style): edit those and run it."
PYTHON_END = '# The end of the inks.'
TABLE_HEAD = '| series | colour | shade |'
TABLE_ROW = re.compile(r'^\| (\d), (\w+) \| `(#[0-9a-f]{6})` \| `(#[0-9a-f]{6})` \|.*$', re.M)


# ---- Color: sRGB, CIELAB (D65) and WCAG contrast

def to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def to_gamma(c):
    return 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055


def rgb_of(hex_color):
    return [int(hex_color[i:i + 2], 16) / 255 for i in (1, 3, 5)]


def hex_of(rgb):
    return '#' + ''.join(f'{round(min(1, max(0, c)) * 255):02x}' for c in rgb)


def luminance(hex_color):
    r, g, b = (to_linear(c) for c in rgb_of(hex_color))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    la, lb = sorted((luminance(a), luminance(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


WHITE = (0.95047, 1.0, 1.08883)
M = [(0.4124564, 0.3575761, 0.1804375), (0.2126729, 0.7151522, 0.0721750), (0.0193339, 0.1191920, 0.9503041)]
M_INV = [(3.2404542, -1.5371385, -0.4985314), (-0.9692660, 1.8760108, 0.0415560), (0.0556434, -0.2040259, 1.0572252)]


def lab_of(hex_color):
    rgb = [to_linear(c) for c in rgb_of(hex_color)]
    xyz = [sum(m * c for m, c in zip(row, rgb)) / w for row, w in zip(M, WHITE)]
    f = [t ** (1 / 3) if t > 216 / 24389 else (24389 / 27 * t + 16) / 116 for t in xyz]
    return 116 * f[1] - 16, 500 * (f[0] - f[1]), 200 * (f[1] - f[2])


def rgb_of_lab(lightness, a, b):
    fy = (lightness + 16) / 116
    f = (fy + a / 500, fy, fy - b / 200)
    xyz = [w * (t ** 3 if t ** 3 > 216 / 24389 else (116 * t - 16) * 27 / 24389) for t, w in zip(f, WHITE)]
    return [to_gamma(sum(m * c for m, c in zip(row, xyz))) for row in M_INV]


def in_gamut(rgb):
    return all(-1e-6 <= c <= 1 + 1e-6 for c in rgb)


def at_contrast(color, sheet, target):
    """The color with color's hue and chroma, lighter than sheet, whose contrast with sheet is target.

    Where that lightness is out of gamut, the chroma is reduced until it fits."""
    _, a, b = lab_of(color)
    for scale in [1 - i / 20 for i in range(21)]:
        low, high = lab_of(sheet)[0], 100.0
        for _ in range(60):
            mid = (low + high) / 2
            rgb = rgb_of_lab(mid, a * scale, b * scale)
            if contrast(hex_of(rgb), sheet) < target:
                low = mid
            else:
                high = mid
        rgb = rgb_of_lab(high, a * scale, b * scale)
        if in_gamut(rgb):
            return hex_of(rgb)
    raise ValueError(f'no color at contrast {target} with {sheet}')


# ---- The kit

def day_inks():
    root = re.search(r':root \{(.*?)\n\}', NOTEBOOK.read_text(), re.S).group(1)
    return dict(re.findall(r'--(paper|rule|margin|ink|ink-2|ink-3|red|blue-pencil): (#[0-9a-f]{6});', root))


def dark_inks(day):
    dark = {'paper': day['ink'], 'ink': day['paper']}
    for name in INKS:
        dark[name] = at_contrast(day[name], dark['paper'], contrast(day[name], day['paper']))
    return dark


# ---- The figures and the dotfiles

def day_data():
    """The data colors on the paper, by name, from matplotlib's color cycle in lib/style/figures/phy.mplstyle."""
    cycle = re.search(r"axes\.prop_cycle: cycler\('color', \[(.*?)\]\)", MPLSTYLE.read_text())[1]
    return dict(zip(SERIES, ('#' + color for color in re.findall(r"'([0-9a-f]{6})'", cycle))))


def dark_data(day, data):
    """The data colors on the dark sheet: each keeps its contrast with the sheet, as the inks do."""
    sheet = dark_inks(day)['paper']
    return {name: at_contrast(color, sheet, contrast(color, day['paper'])) for name, color in data.items()}


def with_data_table(text, dark):
    """lib/style/figures/README.md's text with the data colors' table given a column for the dark sheet."""
    head = text.index(TABLE_HEAD)
    rule = text.index('\n', head) + 1
    text = text[:head] + TABLE_HEAD + ' on the dark sheet |\n|---|---|---|---|\n' + text[text.index('\n', rule) + 1:]
    return TABLE_ROW.sub(lambda m: f'| {m[1]}, {m[2]} | `{m[3]}` | `{m[4]}` | `{dark[m[2]]}` |', text)


def terminal_sheets(day, dark, data, data_dark):
    """The colors a terminal is painted in, on each sheet: {'dark': {name: color}, 'paper': {name: color}}."""
    def sheet(inks, colors):
        return {**{name: inks[ink] for name, ink in TERMINAL_INKS.items()}, **{name: colors[name] for name in TERMINAL_SERIES}}
    return {'dark': sheet(dark, data_dark), 'paper': sheet(day, data)}


def with_vim_inks(text, sheets):
    """lib/dotfiles/vimrc's text with the inks of both sheets written in, the dark sheet's for a dark terminal."""
    def lets(colors):
        return ''.join(f"      let l:{name} = '{color}'\n" for name, color in colors.items())
    body = f"    if &background ==# 'dark'\n{lets(sheets['dark'])}    else\n{lets(sheets['paper'])}    endif\n"
    return replace_block(text, VIM_BEGIN, VIM_END, body)


def with_python_inks(text, sheets):
    """lib/dotfiles/statusline.py's text with the inks of both sheets written in, as INKS."""
    def entries(colors):
        pairs = [f'"{name}": "{color}"' for name, color in colors.items()]
        inks, series = pairs[:len(TERMINAL_INKS)], pairs[len(TERMINAL_INKS):]
        return f'        {", ".join(inks)},\n        {", ".join(series)},\n'
    body = 'INKS = {\n' + ''.join(f'    "{name}": {{\n{entries(colors)}    }},\n' for name, colors in sheets.items()) + '}\n'
    return replace_block(text, PYTHON_BEGIN, PYTHON_END, body)


def replace_block(text, begin, end, body):
    start, stop = text.index(begin), text.index(end)
    return text[:start] + begin + '\n' + body + end + text[stop + len(end):]


def with_inks(text, dark):
    """lib/style/site/notebook.css's text with the dark sheet's inks written in."""
    order = ['paper', 'rule', 'margin', 'ink', 'ink-2', 'ink-3', 'red', 'blue-pencil']
    tokens = ' '.join(f'--{name}: {dark[name]};' for name in order)
    return replace_block(text, INKS_BEGIN, INKS_END, f'{MEDIA} {{\n  {OPT_IN} {{ {tokens} }}\n}}\n')


def with_marks(text, day, dark):
    """lib/style/site/pencil.css's text with the dark sheet's marks written in."""
    marks = re.search(r':root \{\n(.*?)\n\}', text, re.S).group(1)
    swap = {day[name][1:]: dark[name][1:] for name in ('ink', 'ink-2', 'ink-3', 'red')}
    lines = []
    for name, uri in re.findall(r'^  (--mark-[a-z-]+): (url\(".*?"\));$', marks, re.M):
        lines.append(f'    {name}: ' + re.sub(r'%23([0-9a-f]{6})', lambda m: '%23' + swap.get(m.group(1), m.group(1)), uri) + ';')
    return replace_block(text, MARKS_BEGIN, MARKS_END, f'{MEDIA} {{\n  {OPT_IN} {{\n' + '\n'.join(lines) + '\n  }\n}\n')


def written(day=None):
    """Each file's text now and as written, as {path: (text now, text as written)}."""
    day = day or day_inks()
    dark, data = dark_inks(day), day_data()
    data_dark = dark_data(day, data)
    sheets = terminal_sheets(day, dark, data, data_dark)
    texts = {path: path.read_text() for path in (NOTEBOOK, PENCIL, FIGURES_README, VIMRC, STATUSLINE)}
    write = {NOTEBOOK: lambda text: with_inks(text, dark), PENCIL: lambda text: with_marks(text, day, dark),
             FIGURES_README: lambda text: with_data_table(text, data_dark), VIMRC: lambda text: with_vim_inks(text, sheets),
             STATUSLINE: lambda text: with_python_inks(text, sheets)}
    return {path: (text, write[path](text)) for path, text in texts.items()}


class ThemeColors(html.parser.HTMLParser):
    """Reads a page's theme colors: each theme-color meta's content and media."""

    def __init__(self, text):
        super().__init__()
        self.colors = []
        self.feed(text)
        self.close()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'meta' and attrs.get('name') == 'theme-color':
            self.colors.append((attrs.get('content') or '', attrs.get('media') or ''))


def theme_drift(page):
    """Every theme color of a page that is not the paper's, or the dark sheet's for a meta that is for a dark
    scheme, one line each."""
    day = day_inks()
    sheets = {False: ('the paper', day['paper']), True: ('the dark sheet', dark_inks(day)['paper'])}
    problems = []
    for color, media in ThemeColors(Path(page).read_text(encoding='utf-8')).colors:
        sheet, wanted = sheets['prefers-color-scheme: dark' in media]
        if color.lower() != wanted:
            problems.append(f'the theme color{f" for {media}" if media else ""} is {color}, not {sheet}\'s {wanted}')
    return problems


def main():
    day = day_inks()
    dark = dark_inks(day)
    for path, (_, new) in written(day).items():
        path.write_text(new)
    print(f'{"ink":11} {"paper":>8} {"dark":>8}  contrast on paper / on the dark sheet')
    for name in ['ink'] + INKS:
        print(f'{name:11} {day[name]:>8} {dark[name]:>8}  {contrast(day[name], day["paper"]):.2f} / {contrast(dark[name], dark["paper"]):.2f}')
    data = day_data()
    for name, color in dark_data(day, data).items():
        print(f'{name:11} {data[name]:>8} {color:>8}  {contrast(data[name], day["paper"]):.2f} / {contrast(color, dark["paper"]):.2f}')


if __name__ == '__main__':
    main()
