"""The repository's layout: where each part lives, and the checks that keep the parts whole and apart.

The repository has two parts. The library, lib/, is what other work uses: the fwiends (lib/fwiends: the renderer and
its kin in src/, the film kit in film/, the characters and the props), phy's style (lib/style: the CSS kit in site/ and
the figures' styles in figures/) and phy's dotfiles (lib/dotfiles). The demos use it: the site's pages at the root, the
films in demo/ and the mockups in design/. tools/ and test/ serve both.

`python3 tools/pf.py test` runs these checks:
- link_drift: every local link of every page, stylesheet and document, and every link to this repository's own pages
  or source, names a file that the repository holds.
- dependency_drift: dependencies run one way. Nothing in the library links outside it, and phy's style and dotfiles
  link nothing of the fwiends, so that each can be used without the others.
- dotfiles_drift: the dotfiles fit every machine. Claude Code's recommended settings parse, and no dotfile names one
  machine's home folder.
"""
import json
import os
import posixpath
import re
import subprocess
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent.parent
LIB = ROOT / 'lib'
FWIENDS = LIB / 'fwiends'
SRC = FWIENDS / 'src'
FILM = FWIENDS / 'film'
CHARACTERS = FWIENDS / 'characters'  # Holds characters/<name>/<name>.js and the git-ignored examples/ and private/.
PROPS = FWIENDS / 'props'
STYLE = LIB / 'style'
KIT = STYLE / 'site'
FIGURES = STYLE / 'figures'
DOTFILES = LIB / 'dotfiles'

# A link to the repository as published (its Pages site) or to its source on GitHub, at any branch or commit; the
# second group is the path inside the repository.
OWN_URL = re.compile(r'(https://rareone0602\.github\.io/phy_friends/'
                     r'|https://github\.com/rareone0602/phy_friends/(?:blob|tree|raw)/[\w.-]+/'
                     r'|https://raw\.githubusercontent\.com/rareone0602/phy_friends/[\w.-]+/)'
                     r'''((?:[^\s"'<>()`\]]*[^\s"'<>()`\].,;:!?])?)''')  # A full stop after a link ends the sentence.
ATTRIBUTE = re.compile(r'''\b(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)')''')
CSS_URL = re.compile(r'''url\(\s*(?:"([^"]*)"|'([^']*)'|([^)'"\s]+))\s*\)|@import\s+(?:"([^"]*)"|'([^']*)')''')
MARKDOWN_LINK = re.compile(r'\]\(([^)\s]+)\)')
EXTERNAL = re.compile(r'^(?:[a-zA-Z][a-zA-Z0-9+.-]*:|//|#)')
TEMPLATED = re.compile(r'[${}+<>]')  # A link put together by a script, which only the page itself can check.
CODE = {'.html', '.css', '.js', '.py'}  # The files whose links are dependencies; a document's links are not.
OUT = 'out/'  # The git-ignored output, which a fresh copy lacks and which a page looks for only with a fallback.


def tracked():
    """The repository's files, as paths from its root; a file staged but not yet committed counts."""
    listing = subprocess.run(['git', 'ls-files', '-z'], cwd=ROOT, capture_output=True, text=True, check=True).stdout
    return [path for path in listing.split('\0') if path and (ROOT / path).is_file()]


def references(path, text):
    """Each reference that a file makes, as the text of the link."""
    suffix = Path(path).suffix
    found = []
    if suffix == '.html':
        found += [a or b for a, b in ATTRIBUTE.findall(text)]
    if suffix in ('.html', '.css'):
        found += [next(group for group in groups if group) for groups in CSS_URL.findall(text) if any(groups)]
    if suffix == '.md':
        found += MARKDOWN_LINK.findall(text)
    found += [match[0] for match in OWN_URL.finditer(text)]
    return found


def target(source, link):
    """The path from the repository's root that a link in source names: None for a link to anything else (another
    site, an anchor, data, or a link put together by a script), and a path that starts with ../ or / for one that
    leaves the repository."""
    own = OWN_URL.match(link)
    if own:
        base, path = '', own[2]
    elif EXTERNAL.match(link) or TEMPLATED.search(link):
        return None
    else:
        base, path = posixpath.dirname(source), link
    path = unquote(path.split('#')[0].split('?')[0])
    if not path and not own:
        return None
    if path.startswith('/'):
        return path
    return posixpath.normpath(posixpath.join(base, path)) if path else '.'


def links():
    """Every link from one of the repository's files to a path, as (source, link, target)."""
    found = []
    for source in tracked():
        try:
            text = (ROOT / source).read_text(encoding='utf-8')
        except UnicodeDecodeError:  # A picture, a font or another binary file links nothing.
            continue
        for link in dict.fromkeys(references(source, text)):
            path = target(source, link)
            if path is not None:
                found.append((source, link, path))
    return found


def held(path, files, folders):
    """Whether the repository holds path: a file, or a folder of its files (served as its index.html)."""
    return path in files or path == '.' or path.rstrip('/') in folders


def link_drift(found=None):
    """Every link that names no file of the repository, one line each."""
    files = set(tracked())
    folders = {folder for path in files for folder in parents(posixpath.dirname(path))}
    problems = []
    for source, link, path in found if found is not None else links():
        if path.startswith(('../', '/')) or path == '..':
            problems.append(f'{source}: {link} leaves the repository')
        elif not held(path, files, folders) and not path.startswith(OUT):
            problems.append(f'{source}: {link} names no file of the repository')
    return problems


def parents(folder):
    """A folder and every folder that holds it."""
    out = []
    while folder:
        out.append(folder)
        folder = posixpath.dirname(folder)
    return out


def within(path, folder):
    """Whether a path from the repository's root lies in a folder of the repository."""
    folder = os.path.relpath(folder, ROOT)
    return path == folder or path.startswith(folder + '/')


def dependency_drift(found=None):
    """Every link of the library's code that runs against the one way that dependencies run, one line each. A link
    to the repository's published pages or source is a pointer for the reader, not a dependency."""
    problems = []
    for source, link, path in found if found is not None else links():
        if Path(source).suffix not in CODE or not within(source, LIB) or OWN_URL.match(link):
            continue
        if not within(path, LIB):
            problems.append(f'{source}: {link} lies outside the library, which the demos use and never the reverse')
        elif (within(source, STYLE) or within(source, DOTFILES)) and within(path, FWIENDS):
            problems.append(f"{source}: {link} lies in the fwiends, which phy's style and dotfiles never use")
    return problems


# A path into one machine's home folder (/Users/<name> on macOS, /home/<name> on Linux), which no other machine has.
HOME_FOLDER = re.compile(r'/(?:Users|home)/\w')


def dotfiles_drift():
    """Every way in which the dotfiles would not fit every machine, one line each. Claude Code's recommended settings
    must parse, so that a machine can take any of them as they stand, and no dotfile may name one machine's home
    folder, which ~ names for each."""
    problems = []
    settings = DOTFILES / 'claude' / 'settings.json'
    if not settings.exists():
        problems.append(f'{settings.relative_to(ROOT)}, the recommended settings, is missing')
    else:
        try:
            json.loads(settings.read_text(encoding='utf-8'))
        except ValueError as error:
            problems.append(f'{settings.relative_to(ROOT)} does not parse, so no machine could take it: {error}')
    for path in sorted(ROOT / name for name in tracked() if within(name, DOTFILES)):
        for number, line in enumerate(path.read_text(encoding='utf-8').splitlines(), 1):
            if HOME_FOLDER.search(line):
                problems.append(f"{path.relative_to(ROOT)}:{number} names one machine's home folder: write ~ instead")
    return problems
