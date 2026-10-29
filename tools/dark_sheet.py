#!/usr/bin/env python3
"""Derive the dark sheet's inks, marks and data colors, and every other sheet's inks and marks, from the paper's
(lib/style/site/README.md and lib/style/figures/README.md), and write them wherever they are used.

  python3 tools/dark_sheet.py

On the dark sheet the paper and the ink swap: the sheet is the graphite ink and the words are in
the paper's color. Every other ink (the rules, the margin line, ink-2, ink-3, the red and the blue
pencil) keeps its CIELAB hue and chroma and moves to the lightness at which it has the same contrast
with the dark sheet as it has with the paper, and so does each data color. The marks in lib/style/site/pencil.css
hard-code their inks, since a data URI cannot read var(), so their dark set is the same marks with
each ink replaced by its dark one.

The other sheets (lib/style/site/papers.css) give their paper, and some their rule. Every other ink of a sheet keeps
its hue and chroma on the paper and moves to the lightness at which it has the same contrast with the sheet as with
the paper, on the dark side of a light sheet and the light side of a dark one; where a sheet cannot give that much, it
gives nearly as much as it can, and the script fails where that falls short of what words need (MINIMUM). A sheet's
marks are the paper's with each ink replaced by the sheet's. The grid's lesser line has half the rule's contrast, and
the tracing sheet's film is a milky white over a sheet with dark words and, over one with light words, its mirror: as
far from the sheet as the milky white is from the paper, on the dark side. It is as opaque as it can be (up to TRACING)
while the words written on it keep what they need.

Run it after an ink, a mark, a sheet or a data color changes. It rewrites the block between its markers in
lib/style/site/notebook.css, lib/style/site/pencil.css and lib/style/site/papers.css, the data colors' table in
lib/style/figures/README.md, and the inks of both sheets in the dotfiles (lib/dotfiles/vimrc and
claude/statusline.py), and prints each color's contrast on both sheets. The pages' theme colors (their
theme-color metas) are kept by hand: the paper's, and the dark sheet's where a page has one; and so are the inks'
contrasts that the kit's README and the style guide (style.html) give, and the style guide's data colors.
`python3 tools/pf.py test` checks them, and everything written here, with written(), theme_drift() and
shown_drift().
"""
import html.parser
import re
from pathlib import Path

from layout import DOTFILES, FIGURES, KIT, ROOT

NOTEBOOK = KIT / 'notebook.css'
PENCIL = KIT / 'pencil.css'
PAPERS = KIT / 'papers.css'
MPLSTYLE = FIGURES / 'phy.mplstyle'  # Holds the data colors, in order, as matplotlib's color cycle.
FIGURES_README = FIGURES / 'README.md'
VIMRC = DOTFILES / 'vimrc'
KIT_README = KIT / 'README.md'
GUIDE = ROOT / 'style.html'
STATUSLINE = DOTFILES / 'claude' / 'statusline.py'
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
PAPERS_BEGIN = ("/* Every sheet's inks and marks, written by `python3 tools/dark_sheet.py` from the paper's in notebook.css and\n"
                "   pencil.css and each sheet's own paper above: edit those and run it. */")
PAPERS_END = "/* The end of every sheet's inks. */"
# The sheets, in order. A light one, as a page's paper, turns to the dark sheet with the notebook; the others keep their
# own colours, so their inks are written also for a page that declares both schemes, outweighing the dark sheet's.
LIGHT_PAPERS = ['notebook', 'graph', 'score', 'card']
PAPERS_ORDER = ['notebook', 'graphite', 'graph', 'score', 'sketchbook', 'kraft', 'card', 'cyanotype']
SHEET_INKS = ['rule', 'margin', 'ink', 'ink-2', 'ink-3', 'red', 'blue-pencil']
MINIMUM = {'ink': 7, 'ink-2': 4.5, 'ink-3': 2.2, 'red': 4.5, 'blue-pencil': 4.5}  # What a sheet must give each ink.
REACH = 0.96  # The share of a sheet's greatest contrast that an ink may take where it cannot keep the paper's.
FILM = '#fdfdfb'  # The tracing sheet's film over a sheet with dark words, a milky white.
TRACING = 0.6  # The tracing film's opacity where the words on it need it no thinner.
WORDS = {'ink': 7, 'ink-2': 4.5, 'blue-pencil': 4.5}  # What the words written on the film keep.
BOOST = ':has(meta[name="color-scheme"][content~="dark"])'
VIM_BEGIN = """    " The inks, written by `python3 tools/dark_sheet.py` from the kit's and the
    " figures' (lib/style): edit those and run it."""
VIM_END = '    " The end of the inks.'
PYTHON_BEGIN = "# The inks, written by `python3 tools/dark_sheet.py` from the kit's and the figures' (lib/style): edit those and run it."
PYTHON_END = '# The end of the inks.'
TABLE_HEAD = '| series | colour | shade |'
WORD_INKS = ['ink', 'ink-2', 'ink-3', 'red', 'blue-pencil']  # The inks whose contrast the README and the guide give.
README_CONTRAST = re.compile(r'^\| `--([\w-]+)` \|.*?`([\d.]+):1`', re.M)
GUIDE_CONTRAST = re.compile(r'<tr data-ink="([\w-]+)">.*?<td class="n">([\d.]+) : 1</td>')
GUIDE_DATA = re.compile(r'--data-(\w+): (#[0-9a-f]{6});')
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


def at_contrast(color, sheet, target, darker=False):
    """The color with color's hue and chroma, lighter than sheet (or darker, with darker), whose contrast with sheet
    is target.

    Where that lightness is out of gamut, the chroma is reduced until it fits."""
    _, a, b = lab_of(color)
    for scale in [1 - i / 20 for i in range(21)]:
        near, far = lab_of(sheet)[0], 0.0 if darker else 100.0
        for _ in range(60):
            mid = (near + far) / 2
            rgb = rgb_of_lab(mid, a * scale, b * scale)
            if contrast(hex_of(rgb), sheet) < target:
                near = mid
            else:
                far = mid
        rgb = rgb_of_lab(far, a * scale, b * scale)
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


# ---- The other sheets

def papers_given():
    """Each sheet's own paper and the inks it gives, from lib/style/site/papers.css: {name: {ink: color}}."""
    text = PAPERS.read_text()
    text = text[:text.index(PAPERS_BEGIN)]
    given = {name: {} for name in PAPERS_ORDER}
    for name, body in re.findall(r'^\[data-paper=([a-z]+)\] \{([^}]*)\}', text, re.M):
        if name in given:
            given[name].update(re.findall(r'--(paper|rule|margin): (#[0-9a-f]{6});', body))
    return given


def sheet_inks(day, paper, given):
    """A sheet's inks, from the paper's (day), given its paper and any inks it gives."""
    darker = lab_of(paper)[0] > 50
    reach = contrast('#000000' if darker else '#ffffff', paper) * REACH
    inks = {'paper': paper}
    for name in SHEET_INKS:
        if name in given:
            inks[name] = given[name]
            continue
        inks[name] = at_contrast(day[name], paper, min(contrast(day[name], day['paper']), reach), darker)
        if contrast(inks[name], paper) < MINIMUM.get(name, 1):
            raise SystemExit(f'the sheet {paper} gives {name} only {contrast(inks[name], paper):.2f}:1, '
                             f'short of {MINIMUM[name]}:1: choose a lighter or a darker paper')
    rule = inks['rule']
    inks['rule-faint'] = at_contrast(rule, paper, 1 + (contrast(rule, paper) - 1) / 2, luminance(rule) < luminance(paper))
    inks['tracing'] = tracing_film(inks, day)
    return inks


def over(film, sheet, alpha):
    """The color of a film of the given opacity laid over sheet, blended as a browser blends it."""
    return hex_of([alpha * f + (1 - alpha) * s for f, s in zip(rgb_of(film), rgb_of(sheet))])


def tracing_film(inks, day):
    """The tracing sheet's film over a sheet, as an rgba(): the milky white over a sheet with dark words, or its
    mirror over one with light words; as opaque as TRACING allows, or less where the words written on it would lose
    the contrast they need."""
    paper = inks['paper']
    film = FILM if luminance(inks['ink']) < luminance(paper) else at_contrast(paper, paper, contrast(FILM, day['paper']), True)
    alpha = TRACING
    while alpha > 0 and any(contrast(inks[name], over(film, paper, alpha)) < need for name, need in WORDS.items()):
        alpha = round(alpha - 0.01, 2)
    r, g, b = (round(c * 255) for c in rgb_of(film))
    return f'rgba({r}, {g}, {b}, {alpha:g})'


def every_sheet(day=None):
    """Every sheet's inks, by name, in PAPERS_ORDER."""
    day = day or day_inks()
    dark, given = dark_inks(day), papers_given()
    sheets = {}
    for name in PAPERS_ORDER:
        if name == 'notebook':
            sheets[name] = {**day, **sheet_extras(day, day)}
        elif name == 'graphite':
            sheets[name] = {**dark, **sheet_extras(day, dark)}
        else:
            if 'paper' not in given[name]:
                raise SystemExit(f'lib/style/site/papers.css: the sheet {name} gives no --paper')
            sheets[name] = sheet_inks(day, given[name]['paper'], {k: v for k, v in given[name].items() if k != 'paper'})
    return sheets


def sheet_extras(day, inks):
    """The grid's lesser line and the tracing film for the paper or the dark sheet, whose inks are already known."""
    rule = inks['rule']
    faint = at_contrast(rule, inks['paper'], 1 + (contrast(rule, inks['paper']) - 1) / 2, luminance(rule) < luminance(inks['paper']))
    return {'rule-faint': faint, 'tracing': tracing_film(inks, day)}


def with_papers(text, pencil, day):
    """lib/style/site/papers.css's text with every sheet's inks and marks written in."""
    marks = re.findall(r'^  (--mark-[a-z-]+): (url\(".*?"\));$', re.search(r':root \{\n(.*?)\n\}', pencil, re.S).group(1), re.M)
    sheets = every_sheet(day)
    order = ['paper', 'rule', 'margin', 'rule-faint', 'ink', 'ink-2', 'ink-3', 'red', 'blue-pencil', 'tracing']

    def declarations(inks, indent):
        swap = {day[name][1:]: inks[name][1:] for name in ('ink', 'ink-2', 'ink-3', 'red')}
        lines = [indent + ' '.join(f'--{name}: {inks[name]};' for name in order)]
        for name, uri in marks:
            lines.append(f'{indent}{name}: ' + re.sub(r'%23([0-9a-f]{6})', lambda m: '%23' + swap.get(m.group(1), m.group(1)), uri) + ';')
        return '\n'.join(lines)

    blocks = [f":root {{ --rule-faint: {sheets['notebook']['rule-faint']}; --tracing: {sheets['notebook']['tracing']}; }}",
              f"{MEDIA} {{\n  {OPT_IN} {{ --rule-faint: {sheets['graphite']['rule-faint']}; --tracing: {sheets['graphite']['tracing']}; }}\n}}"]
    for name, inks in sheets.items():
        selector = f'[data-paper={name}]' + ('' if name in LIGHT_PAPERS else f', :root[data-paper={name}]{BOOST}')
        blocks.append(f'{selector} {{\n{declarations(inks, "  ")}\n}}')
    blocks.append(f'@media print {{\n  :root[data-paper], :root[data-paper]{BOOST} {{\n{declarations(sheets["notebook"], "    ")}\n  }}\n}}')
    return replace_block(text, PAPERS_BEGIN, PAPERS_END, '\n'.join(blocks) + '\n')


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
    """lib/dotfiles/claude/statusline.py's text with the inks of both sheets written in, as INKS."""
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
    texts = {path: path.read_text() for path in (NOTEBOOK, PENCIL, PAPERS, FIGURES_README, VIMRC, STATUSLINE)}
    write = {NOTEBOOK: lambda text: with_inks(text, dark), PENCIL: lambda text: with_marks(text, day, dark),
             PAPERS: lambda text: with_papers(text, texts[PENCIL], day),
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


def shown_drift():
    """Every ink's contrast that the kit's README or the style guide gives, and every data color of the style
    guide's, that is not as the kit and the figures have it, one line each. A contrast is given to one decimal, on
    the paper; the guide's data colors are the paper's in its :root and the dark sheet's under OPT_IN."""
    day = day_inks()
    wanted = {name: f'{contrast(day[name], day["paper"]):.1f}' for name in WORD_INKS}
    problems = []
    for path, pattern in ((KIT_README, README_CONTRAST), (GUIDE, GUIDE_CONTRAST)):
        given = dict(pattern.findall(path.read_text(encoding='utf-8')))
        problems += [f'{path.relative_to(ROOT)}: {name} is given at {given.get(name, "no")} : 1, not {ratio} : 1'
                     for name, ratio in wanted.items() if given.get(name) != ratio]
    text = GUIDE.read_text(encoding='utf-8')
    data = day_data()
    sheets = {'the paper': (re.search(r'(?m)^\s*:root \{([^}]*--data-[^}]*)\}', text), data),
              'the dark sheet': (re.search(re.escape(OPT_IN) + r' \{([^}]*--data-[^}]*)\}', text), dark_data(day, data))}
    for sheet, (rule, colors) in sheets.items():
        given = dict(GUIDE_DATA.findall(rule[1])) if rule else {}
        problems += [f'{GUIDE.relative_to(ROOT)}: the data color {name} on {sheet} is {given.get(name, "missing")}, '
                     f'not {color}' for name, color in colors.items() if given.get(name) != color]
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
    print(f'\n{"sheet":11} {"paper":>8}  ' + '  '.join(f'{name:>11}' for name in ['ink'] + INKS[2:]) + '  tracing')
    for name, inks in every_sheet(day).items():
        print(f'{name:11} {inks["paper"]:>8}  ' + '  '.join(f'{contrast(inks[ink], inks["paper"]):11.2f}' for ink in ['ink'] + INKS[2:])
              + f'  {inks["tracing"]}')


if __name__ == '__main__':
    main()
