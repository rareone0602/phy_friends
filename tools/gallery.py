"""The pages that show every friend, kept in step with the cast and with the friends' drawings.

The cast (characters/cast.js) is the one list of the friends, in the gallery's order, and the friends' drawings
decide how much room each takes. From them come, without anyone writing them by hand:

- the script tags that load the friends, in each page that loads them all (PAGES), in the cast's order;
- the gallery's rows (index.html): how wide in boxes each way of splitting the friends into rows is (--abreast),
  the stage width from which each fits, and the page width at which every friend stands in one row (layout_css).

`python3 tools/pf.py pages` writes both, and `python3 tools/pf.py test` fails while either is stale. The labels
that the gallery repeats by hand (each friend's name, species and credit) are checked against the cast too
(label_drift), since they are prose that a person words.
"""
import html.parser
import math
import re
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GALLERY = ROOT / 'index.html'
# The pages that load every friend: the gallery, the tests and the tools that show any friend. The demos are one-offs
# that keep the friends they were made with.
PAGES = [GALLERY, ROOT / 'test' / 'index.html', ROOT / 'tools' / 'animate.html', ROOT / 'tools' / 'feelings.html',
         ROOT / 'tools' / 'tune.html']
SCRIPT_TAG = re.compile(r'^(?P<indent>[ \t]*)<script src="(?P<prefix>[^"]*?)characters/(?P<name>[\w-]+)/(?P=name)\.js"></script>[ \t]*$', re.M)

# ---- The cast and the friends' reaches, read in Chrome -------------------------------------

# A page that installs the cast, from which READ_CAST_JS reads it: the library, every friend that has a folder of its
# own in characters/, then the cast, which checks that each friend it names is defined.
def cast_scripts():
    friends = sorted(p for p in (ROOT / 'characters').glob('*/*.js') if p.stem == p.parent.name)
    return [ROOT / 'src/phyfriends.js', *friends, ROOT / 'src/cast.js', ROOT / 'characters/cast.js']


# The cast as a page installed it (characters/cast.js), or null if it has none.
READ_CAST_JS = """(() => {
  try {
    const cast = PhyFriends.cast;
    return { host: cast.host, names: cast.names(), friends: Object.fromEntries(cast.names().map(name => [name, cast.friend(name)])) };
  } catch (error) {
    return null;
  }
})()"""
# Each friend's reach past its box on the gallery (index.html measures them on load), in head units, in page order, and
# whether the page drew it at all.
READ_REACHES_JS = """[...document.querySelectorAll('.friend')].map(li => ({
  name: li.dataset.friend,
  drawn: !!li.querySelector('.rig svg'),
  left: +getComputedStyle(li).getPropertyValue('--reach-left') || 0,
  right: +getComputedStyle(li).getPropertyValue('--reach-right') || 0,
}))"""
# The size of a friend's box at the window's size, and how much narrower the stage is than a window that main does not
# cap: main's padding, less the stage's reach past it; in CSS px.
READ_BOX_JS = """(() => {
  const main = getComputedStyle(document.querySelector('main')), stage = getComputedStyle(document.querySelector('.stage'));
  const less = ['paddingLeft', 'paddingRight'].reduce((sum, side) => sum + parseFloat(main[side]), 0) +
    ['marginLeft', 'marginRight'].reduce((sum, side) => sum + parseFloat(stage[side]), 0);
  return { box: document.querySelector('.rig').offsetWidth, less };
})()"""
# A window this wide or narrower is a phone's, on which the rules, and so the boxes, are smaller (site/notebook.css).
PHONE_WINDOW = 720
NARROW, WIDE = 700, 1600  # Windows at which the gallery's measures are read, one either side of PHONE_WINDOW.
# The page rounds each reach to a whole head unit at the size it draws the friends, so a reach may differ by a unit
# from one window to another; the rows are measured with each friend's largest reach over windows of every size.
REACH_WINDOWS = (360, NARROW, 900, 1200, WIDE, 2400, 3600)


def read_cast(chrome):
    """The cast ({host, names, friends}), read in a page that installs it; a cast that fails to install is an error."""
    with tempfile.TemporaryDirectory(prefix='pf-cast-') as work:
        page = Path(work) / 'cast.html'
        page.write_text('<!doctype html><meta charset="utf-8">' +
                        ''.join(f'<script src="{script.as_uri()}"></script>' for script in cast_scripts()))
        chrome.open(str(page))
        cast = chrome.evaluate(READ_CAST_JS)
    if cast is None:
        raise ValueError('characters/cast.js installed no cast: see the page errors above, or load it in a browser')
    return cast


def measure_gallery(chrome):
    """The friends' reaches on the gallery, each the largest over windows of every size, and its box and stage at
    a phone's window and at a wide one. A gallery that fails to draw a friend has no reach to give for it, so it is
    an error rather than a reach of nothing."""
    sizes, reaches = {}, {}
    for width in REACH_WINDOWS:
        chrome.set_viewport(width, 900)
        chrome.open(str(GALLERY))
        measured = chrome.evaluate(READ_REACHES_JS)
        undrawn = [reach['name'] for reach in measured if not reach.pop('drawn')]
        if undrawn:
            raise ValueError(f'{GALLERY.name} drew no {", ".join(undrawn)}, so its rows cannot be measured: '
                             'load every friend (python3 tools/pf.py pages) and see the page errors')
        for reach in measured:
            kept = reaches.setdefault(reach['name'], reach)
            kept['left'], kept['right'] = max(kept['left'], reach['left']), max(kept['right'], reach['right'])
        for label, size in (('narrow', NARROW), ('wide', WIDE)):
            if width == size:
                sizes[label] = chrome.evaluate(READ_BOX_JS)
    return {'reaches': list(reaches.values()), **sizes}


# ---- The gallery's rows ---------------------------------------------------------------------

# The friends stand in rows of the most of these that fit the stage: every friend in one row (None), else eight,
# five, four, three or two, so that the same friends always share a row, and a phone never mixes pairs and threes.
ROW_SIZES = (None, 8, 5, 4, 3, 2)
BOX_UNITS = 270      # A box's width in head units (FWIENDS.md): five rules.
SLOT_OVERLAP = 0.06  # Neighboring slots overlap by this much of a box (.friend's negative margins).
LAYOUT_START = '  /* The rows (--abreast) and the page\'s width, written by `python3 tools/pf.py pages` from the friends\' reaches. */\n'
LAYOUT_END = '  /* The end of the rows. */\n'


def rows(names, n):
    """The friends in rows of n (every friend in one row for None)."""
    n = n or len(names)
    return [names[i:i + n] for i in range(0, len(names), n)]


def layout(measures):
    """For each way of splitting the friends into rows, the widest row in boxes, rounded up so that its friends
    always fit (--abreast), and the stage width in CSS px from which that split fits, with the window that has it.

    A row's width in boxes is the sum of its slots, each a box plus its reaches, less the slots' overlap.
    """
    slot = {r['name']: (BOX_UNITS + r['left'] + r['right']) / BOX_UNITS - SLOT_OVERLAP for r in measures['reaches']}
    names, splits = list(slot), []
    for n in ROW_SIZES:
        widest = max(sum(slot[name] for name in row) for row in rows(names, n))
        abreast = math.ceil(round(widest * 1000, 6)) / 1000
        stage = fitting_stage(abreast, measures)
        size = 'narrow' if stage + measures['narrow']['less'] <= PHONE_WINDOW else 'wide'
        window = math.ceil(stage + measures[size]['less'])
        splits.append({'size': n, 'abreast': abreast, 'stage': stage, 'window': window})
    return splits


def fitting_stage(abreast, measures):
    """The narrowest stage, in whole CSS px, from which a row `abreast` boxes wide fits at every wider stage. A
    stage of a given width may belong to a phone's window, whose boxes are smaller, or to a wider one, and the two
    overlap: a stage of 640px is a phone's in a 686px window and a wide page's in a 752px one. So the row must fit
    the phone's boxes wherever a phone's stage can be that wide, and the wide page's wherever its can."""
    narrow, wide = measures['narrow'], measures['wide']
    widest_phone = PHONE_WINDOW - narrow['less']           # The widest stage a phone's window has.
    narrowest_wide = PHONE_WINDOW + 1 - wide['less']       # The narrowest stage a wide page has.
    on_phone = min(math.ceil(round(abreast * narrow['box'], 6)), math.floor(widest_phone) + 1)
    on_wide = math.ceil(round(abreast * wide['box'], 6))
    return max(on_phone, on_wide if on_wide > narrowest_wide else 0)


def number(value):
    """A number as the CSS writes it: up to three decimals, without trailing zeros."""
    return f'{value:.3f}'.rstrip('0').rstrip('.')


def layout_css(splits):
    """The gallery's CSS for its rows: the narrowest split by default, then each wider one from the stage width at
    which it fits. Five abreast leave room for the whole note. Where every friend fits in one row, the page stops
    growing, and the list's cap is lifted so that rounding never sends the last friend to a second row."""
    narrowest, *wider = sorted(splits, key=lambda s: s['abreast'])
    one_row = next(s for s in splits if s['size'] is None)
    out = [LAYOUT_START, f"  .troupe {{ --abreast: {number(narrowest['abreast'])}; }}\n",
           f"  main {{ max-width: {one_row['window']}px; }}\n"]
    for split in wider:
        rules = [f".troupe {{ --abreast: {number(split['abreast'])}; }}"]
        if split['size'] == 5:
            rules.append('.note .long { display: inline; }')
        if split['size'] is None:
            rules.append('.friends { max-width: none; }')
        out.append(f"  @container (width >= {split['stage']}px) {{ {' '.join(rules)} }}\n")
    out.append(LAYOUT_END)
    return ''.join(out)


def one_row_window(gallery=GALLERY):
    """The narrowest window in which every friend stands in one row, as the gallery's layout gives it."""
    match = re.search(r'^  main \{ max-width: (\d+)px; \}$', layout_block(Path(gallery).read_text(encoding='utf-8')), re.M)
    if not match:
        raise ValueError(f'{gallery} has no page width in its rows; run python3 tools/pf.py pages')
    return int(match[1])


def layout_block(text):
    """The gallery's layout as written in its CSS, or '' if it has none."""
    start, end = text.find(LAYOUT_START), text.find(LAYOUT_END)
    return text[start:end + len(LAYOUT_END)] if start >= 0 and end > start else ''


# ---- Writing and checking the pages ---------------------------------------------------------

def with_scripts(text, names):
    """A page's text with its run of the friends' script tags in the cast's order, or None if it loads no friend."""
    tags = list(SCRIPT_TAG.finditer(text))
    if not tags:
        return None
    first, last = tags[0], tags[-1]
    run = text[first.start():last.end()]
    if len(run.splitlines()) != len(tags):
        raise ValueError('its friends\' script tags are not in one run')
    lines = [f"{first['indent']}<script src=\"{first['prefix']}characters/{name}/{name}.js\"></script>" for name in names]
    return text[:first.start()] + '\n'.join(lines) + text[last.end():]


def written(cast, measures):
    """Each page's text as it should be: {path: (text now, text as written)}. Without measures, only the script
    tags are written."""
    out = {}
    for page in PAGES:
        text = page.read_text(encoding='utf-8')
        new = with_scripts(text, cast['names']) or text
        if page == GALLERY and measures:
            block = layout_block(new)
            if not block:
                raise ValueError(f'{page} has no rows to write: mark them as layout_css() does')
            new = new.replace(block, layout_css(layout(measures)))
        out[page] = (text, new)
    return out


def write_pages(cast, measures=None):
    """Rewrites every page whose script tags or rows are stale (only the script tags, without measures), and returns
    the pages rewritten."""
    changed = []
    for page, (text, new) in written(cast, measures).items():
        if new != text:
            page.write_text(new, encoding='utf-8')
            changed.append(page)
    return changed


def page_drift(cast, measures):
    """Every page whose script tags or rows are stale, one line each. Without measures, the rows are not checked."""
    problems = []
    for page, (text, new) in written(cast, measures).items():
        if new == text:
            continue
        scripts = with_scripts(text, cast['names']) or text
        stale = (["its friends' script tags"] if scripts != text else []) + (['its rows'] if new != scripts else [])
        problems.append(f'{page.relative_to(ROOT)}: {" and ".join(stale)} are stale; run python3 tools/pf.py pages')
    return problems


# ---- The gallery's labels, checked against the cast -----------------------------------------

NUMBER_WORDS = ('no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven',
                'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty')


class GalleryLabels(html.parser.HTMLParser):
    """Reads the gallery page: for each .friend in page order, its key, whether it is the host, its
    aria-label and its label (name, species, and the credit link's text and address); every other link
    that credits a friend's owner (data-credit, the friend's key), with its text and address; and the
    link preview's alt text (og:image:alt)."""

    VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'}
    TEXT = ('name', 'species', 'credit')  # The parts of a label whose text is read.

    def __init__(self):
        super().__init__()
        self.friends, self.credits, self.preview_alt = [], [], None
        self.open = []  # The open elements, each as (tag, the part of a friend it lies in, or None).

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = (attrs.get('class') or '').split()
        part = self.open[-1][1] if self.open else None
        if tag == 'meta' and attrs.get('property') == 'og:image:alt':
            self.preview_alt = attrs.get('content') or ''
        elif tag == 'a' and 'data-credit' in attrs and not part:
            self.credits.append({'key': attrs['data-credit'], 'credit': '', 'credit link': attrs.get('href') or ''})
            part = 'other credit'
        elif tag == 'li' and 'friend' in classes:
            self.friends.append({'key': attrs.get('data-friend'), 'host': 'data-host' in attrs, 'aria-label': '',
                                 'name': '', 'species': '', 'credit': '', 'credit link': ''})
            part = 'friend'
        elif part:
            friend = self.friends[-1]
            if 'rig' in classes:
                friend['aria-label'] = attrs.get('aria-label') or ''
            if 'credit' in classes:
                part = 'credit line'  # Its text outside the link, such as phy's "that's me", is not the credit.
            elif tag == 'a' and part == 'credit line':
                friend['credit link'], part = attrs.get('href') or '', 'credit'
            else:
                part = next((c for c in ('name', 'species') if c in classes), part)
        if tag not in self.VOID:
            self.open.append((tag, part))

    def handle_endtag(self, tag):
        for i in range(len(self.open) - 1, -1, -1):  # Closes the innermost element of this tag, and any left open in it.
            if self.open[i][0] == tag:
                del self.open[i:]
                return

    def handle_data(self, data):
        part = self.open[-1][1] if self.open else None
        if part in self.TEXT:  # A <wbr> splits a handle's text, so the pieces are joined.
            self.friends[-1][part] += data
        elif part == 'other credit':
            self.credits[-1]['credit'] += data


def label_drift(cast, gallery=GALLERY):
    """Return every way in which the gallery disagrees with the cast, one line per friend and field.

    The cast (characters/cast.js) is the source, and the gallery repeats it by hand: each friend's
    label (name, species and credit), the name that opens its aria-label, and which friend is the
    host. A friend is there only with its owner's agreement to the gallery. Any other link that
    credits an owner, such as the footer's to Terry's, gives the owner's credit as the cast does. The
    link preview's alt text counts the friends and names them in the gallery's order, as the preview
    pictures them.
    cast: {host, friends: {key: entry}}, as READ_CAST_JS reads it, or None.
    """
    if cast is None:
        return ['no cast (characters/cast.js) was installed to check the labels against']
    page = GalleryLabels()
    page.feed(Path(gallery).read_text(encoding='utf-8'))
    entries, keys = cast['friends'], [friend['key'] for friend in page.friends]
    problems = [f'{key}: on the gallery {keys.count(key)} times' for key in sorted(set(keys)) if keys.count(key) > 1]
    problems += [f'{key}: on the gallery but not in the cast' for key in keys if key not in entries]
    problems += [f'{key}: in the cast but not on the gallery' for key in entries if key not in keys]
    for friend in page.friends:
        if friend['key'] in entries:
            problems += friend_drift(friend, entries[friend['key']], cast['host'])
    for credit in page.credits:
        problems += credit_drift(credit, entries.get(credit['key']))
    return problems + preview_drift(page.preview_alt, [entries[key]['name'] for key in keys if key in entries])


def friend_drift(friend, entry, host):
    """Return the ways in which one friend on the gallery disagrees with its entry in the cast."""
    key, problems = friend['key'], []
    expected = {'name': entry['name'], 'species': entry['species'], 'credit': entry['credit']['handle'],
                'credit link': entry['credit']['href']}
    for field, value in expected.items():
        found = ' '.join(friend[field].split())
        if found != value:
            problems.append(f'{key}: the {field} is "{found}" on the gallery but "{value}" in the cast')
    greeting, label = f'say hi to {entry["name"]}', friend['aria-label']
    if label != greeting and not label.startswith(greeting + ', '):  # A description may follow the name.
        problems.append(f'{key}: the aria-label opens "{label.split(",")[0]}", not "{greeting}"')
    if friend['host'] != (key == host):
        problems.append(f'{key}: {"marked" if friend["host"] else "not marked"} as the host (data-host), '
                        f'but the cast\'s host is {host}')
    if 'gallery' not in entry.get('agreed', []):
        problems.append(f"{key}: on the gallery without its owner's agreement ('gallery' is not in its agreed media in the cast)")
    return problems


def credit_drift(credit, entry):
    """Return the ways in which a link that credits a friend's owner outside its label disagrees with the
    friend's entry in the cast, which is None if the cast has no such friend."""
    key = credit['key']
    if entry is None:
        return [f'{key}: credited by a link (data-credit) but not in the cast']
    problems = []
    for field, value in (('credit', entry['credit']['handle']), ('credit link', entry['credit']['href'])):
        found = ' '.join(credit[field].split())
        if found != value:
            problems.append(f'{key}: the {field} is "{found}" in a link that credits its owner but "{value}" in the cast')
    return problems


def preview_drift(alt, names):
    """Return the ways in which the link preview's alt text ("sixteen fwiends ...: Howdi, a sky-blue
    wolf; ...; and Claude, ...") disagrees with the gallery, whose friends' names are given in order."""
    if alt is None:
        return ['og:image:alt: index.html has no alt text for its link preview']
    match = re.match(r'(\w+) fwiends\b[^:]*: (.+)', alt)
    if not match:
        return ['og:image:alt: it should give the number of fwiends, then name each after a colon']
    problems, count = [], NUMBER_WORDS[len(names)] if len(names) < len(NUMBER_WORDS) else str(len(names))
    if match[1] != count:
        problems.append(f'og:image:alt: it counts "{match[1]}" fwiends, but the gallery has {count}')
    named = [re.sub(r'^and ', '', item).split(',')[0].strip() for item in match[2].split('; ')]
    if named != names:
        problems.append(f'og:image:alt: it names {", ".join(named)}; the gallery has {", ".join(names)}, in that order')
    return problems
