"""The kit's promise to the pages that link it: every name that the published kit defines stays defined.

Pages elsewhere link the kit as it is published (https://rareone0602.github.io/phy_friends/lib/style/site/phy.css),
so that every change to it reaches them at once and they keep in step with phy's style. What a page relies on is the
kit's names: its files, its tokens (custom properties such as --ink) and its classes (such as .note). kit_drift
compares them with the kit as published, on origin/main, and names each one that the working copy drops, so that a
change can add and restyle, but not break a page. To retire a name, keep it beside its successor until no page uses
it, or list it in RETIRED with the reason.
"""
import re
import subprocess

from layout import KIT, ROOT

PUBLISHED = 'origin/main'
# Names that the kit gave up on purpose, with the reason: none of them is linked from a page outside this repository.
RETIRED = {
    'graphite.svg': 'graphite.js writes the filter into the page, so that no page pastes a copy',
    'title-pen.js': "the gallery's title, which moved to lib/fwiends/src/ beside the pen that writes it",
    'preview.png': "the gallery's link preview, which moved beside index.html",
    '.pf-cutout': 'the paper under a friend, which lib/fwiends/src/phyfriends.js now styles itself',
}
COMMENT = re.compile(r'/\*.*?\*/', re.S)
STRING = re.compile(r'"(?:[^"\\]|\\.)*"|\'(?:[^\'\\]|\\.)*\'')
TOKEN = re.compile(r'(--[\w-]+)\s*:')
PRELUDE = re.compile(r'([^{};]+)\{')
CLASS = re.compile(r'\.(-?[a-zA-Z_][\w-]*)')


def git(*args):
    return subprocess.run(['git', *args], cwd=ROOT, capture_output=True, text=True, check=True).stdout


def names(files):
    """The names a kit defines, given its files as {path within the kit: text, or None for a binary file}."""
    found = set(files)
    for path, text in files.items():
        if not path.endswith('.css') or text is None:
            continue
        text = STRING.sub('""', COMMENT.sub('', text))
        found |= set(TOKEN.findall(text))
        for prelude in PRELUDE.findall(text):
            if not prelude.strip().startswith('@'):
                found |= {'.' + name for name in CLASS.findall(prelude)}
    return found


def kit_now():
    """The working copy's kit, as names() takes it."""
    files = {}
    for path in sorted(p for p in KIT.rglob('*') if p.is_file() and p.name != '.DS_Store'):
        try:
            files[str(path.relative_to(KIT))] = path.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            files[str(path.relative_to(KIT))] = None
    return files


def kit_published():
    """The kit as published, as names() takes it: the folder that holds phy.css on PUBLISHED, or None where there
    is no such commit (a copy without its remote)."""
    try:
        listing = git('ls-tree', '-r', '--name-only', PUBLISHED).split('\n')
    except subprocess.CalledProcessError:
        return None
    folder = next((path[:-len('phy.css')] for path in listing if path.endswith('/phy.css')), None)
    if folder is None:
        return None
    files = {}
    for path in listing:
        if path.startswith(folder):
            blob = subprocess.run(['git', 'show', f'{PUBLISHED}:{path}'], cwd=ROOT, capture_output=True, check=True).stdout
            try:
                files[path[len(folder):]] = blob.decode('utf-8')
            except UnicodeDecodeError:
                files[path[len(folder):]] = None
    return files


def kit_drift():
    """Each name that the published kit defines and the working copy's does not, one line each."""
    published = kit_published()
    if published is None:
        return []
    dropped = sorted(names(published) - names(kit_now()) - set(RETIRED))
    return [f'the kit drops {name}, which a page that links the published kit may use: keep it beside its successor, '
            f'or retire it in tools/kit_api.py' for name in dropped]
