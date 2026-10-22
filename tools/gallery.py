"""The pages that show every friend, kept in step with the cast and with the friends' drawings.

The cast (lib/fwiends/characters/cast.js) is the one list of the friends, in the gallery's order, and the friends' drawings
decide how much room each takes. From them come, without anyone writing them by hand:

- the script tags that load the friends, in each page that loads them all (PAGES), in the cast's order;
- the gallery's rows (index.html): how wide in boxes each way of splitting the friends into rows is (--abreast),
  the stage width from which each fits, the stage width below which even the pairs fit only without their reaches,
  and the page width at which every friend stands in one row (layout_css);
- each friend's slot (index.html): its reaches past its box on a wide screen and on a phone (--wide-left,
  --wide-right, --phone-left, --phone-right) in its tag, so that the page is laid out as it will stand before its
  script has drawn and measured the friends (with_slots).

`python3 tools/pf.py pages` writes both, and `python3 tools/pf.py test` fails while either is stale, or while the
friends do not stand in the rows of the split that the page means for a window either side of where each split
takes over (row_drift). The labels that the gallery repeats by hand (each friend's name, species and credit) are
checked against the cast too (label_drift), since they are prose that a person words.
"""
import html.parser
import math
import re
import tempfile
from pathlib import Path

from layout import CHARACTERS, SRC

ROOT = Path(__file__).resolve().parent.parent
GALLERY = ROOT / 'index.html'
# The pages that load every friend: the gallery, the tests and the tools that show any friend. The demos are one-offs
# that keep the friends they were made with.
PAGES = [GALLERY, ROOT / 'test' / 'index.html', ROOT / 'tools' / 'animate.html', ROOT / 'tools' / 'feelings.html',
         ROOT / 'tools' / 'tune.html']
SCRIPT_TAG = re.compile(r'^(?P<indent>[ \t]*)<script src="(?P<prefix>[^"]*?)lib/fwiends/characters/(?P<name>[\w-]+)/(?P=name)\.js"></script>[ \t]*$', re.M)

# ---- The cast and the friends' reaches, read in Chrome -------------------------------------

# A page that installs the cast, from which READ_CAST_JS reads it: the library, every friend that has a folder of its
# own in lib/fwiends/characters/, then the cast, which checks that each friend it names is defined.
def cast_scripts():
    friends = sorted(p for p in CHARACTERS.glob('*/*.js') if p.stem == p.parent.name)
    return [SRC / 'phyfriends.js', *friends, SRC / 'cast.js', CHARACTERS / 'cast.js']


# The cast as a page installed it (lib/fwiends/characters/cast.js), or null if it has none.
READ_CAST_JS = """(() => {
  try {
    const cast = PhyFriends.cast;
    return { host: cast.host, names: cast.names(), friends: Object.fromEntries(cast.names().map(name => [name, cast.friend(name)])) };
  } catch (error) {
    return null;
  }
})()"""
# Each friend's reach past its box on the gallery (index.html measures them once its face has arrived, since the
# labels count), in head units, in page order, and whether the page drew it at all.
READ_REACHES_JS = """document.fonts.ready.then(() => new Promise(requestAnimationFrame)).then(() =>
  [...document.querySelectorAll('.friend')].map(li => ({
    name: li.dataset.friend,
    drawn: !!li.querySelector('.rig svg'),
    left: +getComputedStyle(li).getPropertyValue('--reach-left') || 0,
    right: +getComputedStyle(li).getPropertyValue('--reach-right') || 0,
  })))"""
# The size of a friend's box at the window's size, and how much narrower the stage is than a window that main does not
# cap: main's padding, less the stage's reach past it; in CSS px.
READ_BOX_JS = """(() => {
  const main = getComputedStyle(document.querySelector('main')), stage = getComputedStyle(document.querySelector('.stage'));
  const less = ['paddingLeft', 'paddingRight'].reduce((sum, side) => sum + parseFloat(main[side]), 0) +
    ['marginLeft', 'marginRight'].reduce((sum, side) => sum + parseFloat(stage[side]), 0);
  return { box: document.querySelector('.rig').offsetWidth, less };
})()"""
# How many friends stand in each of the gallery's rows, top to bottom, once their slots are fitted.
READ_ROWS_JS = """document.fonts.ready.then(() => new Promise(requestAnimationFrame)).then(() => {
  const rows = [];
  for (const li of document.querySelectorAll('.friend')) {
    const top = Math.round(li.getBoundingClientRect().top), row = rows.find(r => Math.abs(r.top - top) < 2);
    if (row) row.count++;
    else rows.push({ top, count: 1 });
  }
  return rows.sort((a, b) => a.top - b.top).map(row => row.count);
})"""
# A window this wide or narrower is a phone's, on which the rules, and so the boxes, are smaller (lib/style/site/notebook.css).
PHONE_WINDOW = 720
NARROW, WIDE = 700, 1600  # Windows at which the gallery's measures are read, one either side of PHONE_WINDOW.
# The page rounds each reach to a whole head unit at the size it draws the friends, so a reach may differ by a unit
# from one window to another; each slot takes a friend's largest reach over the windows of a screen's size (a phone's,
# or a wider one), and the rows its largest over windows of every size.
REACH_WINDOWS = (360, NARROW, 900, 1200, WIDE, 2400, 3600)
SCREENS = ('wide', 'phone')  # The sizes of screen for which each slot's reaches are written.


def take_errors(chrome, page, errors):
    """Add the errors that a page has reported to errors, each as (the page, the message)."""
    errors += [(page, error) for error in chrome.take_errors()]


def read_cast(chrome, errors):
    """The cast ({host, names, friends}), read in a page that installs it; a cast that fails to install is an error.
    errors: a list to which the errors that the page reports are added, as take_errors() adds them."""
    with tempfile.TemporaryDirectory(prefix='pf-cast-') as work:
        page = Path(work) / 'cast.html'
        page.write_text('<!doctype html><meta charset="utf-8">' +
                        ''.join(f'<script src="{script.as_uri()}"></script>' for script in cast_scripts()))
        chrome.open(str(page))
        cast = chrome.evaluate(READ_CAST_JS)
        take_errors(chrome, 'the cast (every friend, then lib/fwiends/characters/cast.js)', errors)
    if cast is None:
        raise ValueError('lib/fwiends/characters/cast.js installed no cast: see the page errors, or load it in a browser')
    return cast


def measure_gallery(chrome, errors):
    """The friends' reaches on the gallery, each the largest over the windows of each size of screen and over
    windows of every size; its box and stage at a phone's window and at a wide one; and, where its rows and slots
    are as layout_css and with_slots would write them, how many friends stand in each row in a window either side of
    where each split takes over (rows, by window). A gallery that fails to draw a friend has no reach to give for it,
    so it is an error rather than a reach of nothing. errors: a list to which the errors that the gallery reports at
    each window's width are added, as take_errors() adds them."""
    sizes, reaches = {}, {}
    for width in REACH_WINDOWS:
        chrome.set_viewport(width, 900)
        chrome.open(str(GALLERY))
        measured = chrome.evaluate(READ_REACHES_JS)
        take_errors(chrome, f'{GALLERY.name} at {width} px', errors)
        undrawn = [reach['name'] for reach in measured if not reach.pop('drawn')]
        if undrawn:
            raise ValueError(f'{GALLERY.name} drew no {", ".join(undrawn)}, so its rows cannot be measured: '
                             'load every friend (python3 tools/pf.py pages) and see the page errors')
        screen = 'phone' if width <= PHONE_WINDOW else 'wide'
        for reach in measured:
            kept = reaches.setdefault(reach['name'], {'name': reach['name'], 'left': 0, 'right': 0,
                                                      **{s: {'left': 0, 'right': 0} for s in SCREENS}})
            for side in ('left', 'right'):
                kept[screen][side] = max(kept[screen][side], reach[side])
                kept[side] = max(kept[side], reach[side])
        for label, size in (('narrow', NARROW), ('wide', WIDE)):
            if width == size:
                sizes[label] = chrome.evaluate(READ_BOX_JS)
    measures = {'reaches': list(reaches.values()), **sizes}
    text = GALLERY.read_text(encoding='utf-8')
    if layout_block(text) == layout_css(layout(measures)) and with_slots(text, measures['reaches']) == text:
        measures['rows'] = {}
        for width in boundary_windows(layout(measures)):
            chrome.set_viewport(width, 900)
            chrome.open(str(GALLERY))
            measures['rows'][width] = chrome.evaluate(READ_ROWS_JS)
            take_errors(chrome, f'{GALLERY.name} at {width} px', errors)
    return measures


# ---- The gallery's rows ---------------------------------------------------------------------

# The friends stand in rows of the most of these that fit the stage: every friend in one row (None), else eight,
# five, four, three or two, so that the same friends always share a row, and a phone never mixes pairs and threes.
ROW_SIZES = (None, 8, 5, 4, 3, 2)
LAYOUT_START = '  /* The rows (--abreast) and the page\'s width, written by `python3 tools/pf.py pages` from the friends\' reaches. */\n'
LAYOUT_END = '  /* The end of the rows. */\n'
# The slots' geometry, as the gallery's CSS declares it on the troupe: a box's width in head units (--box), and how
# much neighboring slots overlap, as a share of a box (--overlap).
SLOT_GEOMETRY = re.compile(r'\.troupe \{[^}]*--box: (?P<box>[\d.]+);[^}]*--overlap: (?P<overlap>[\d.]+);')
# A friend's reach in its tag, in head units, on a size of screen (SCREENS).
REACH = re.compile(r'--(wide|phone)-(left|right):\s*(-?\d+(?:\.\d+)?)')


def rows(names, n):
    """The friends in rows of n (every friend in one row for None)."""
    n = n or len(names)
    return [names[i:i + n] for i in range(0, len(names), n)]


def slot_geometry(text=None):
    """The gallery's slot geometry as its CSS declares it, as {box, overlap} (SLOT_GEOMETRY)."""
    match = SLOT_GEOMETRY.search(GALLERY.read_text(encoding='utf-8') if text is None else text)
    if not match:
        raise ValueError(f'{GALLERY.name} declares no --box and --overlap on .troupe')
    return {'box': float(match['box']), 'overlap': float(match['overlap'])}


def slot_boxes(left, right, geometry):
    """How wide a friend's slot is, in boxes: its box and its reaches past it (in head units), less the overlap with
    its neighbors' slots, in the gallery's slot geometry (slot_geometry)."""
    return (geometry['box'] + left + right) / geometry['box'] - geometry['overlap']


def layout(measures):
    """For each way of splitting the friends into rows, the widest row in boxes, rounded up so that its friends
    always fit (--abreast), and the stage width in CSS px from which that split fits, with the window that has it.

    A row's width in boxes is the sum of its slots (slot_boxes), in the page's own geometry (--box and --overlap).
    """
    geometry = slot_geometry()
    slot = {r['name']: slot_boxes(r['left'], r['right'], geometry) for r in measures['reaches']}
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
    growing, and the list's cap is lifted so that rounding never sends the last friend to a second row. Where even
    the narrowest split does not fit, its friends stand without their reaches (--reaching: 0), a box apart, and
    phy's credit gives up "that's me", so that its label fits its box."""
    narrowest, *wider = sorted(splits, key=lambda s: s['abreast'])
    one_row = next(s for s in splits if s['size'] is None)
    out = [LAYOUT_START, f"  .troupe {{ --abreast: {number(narrowest['abreast'])}; }}\n",
           f"  main {{ max-width: {one_row['window']}px; }}\n",
           f"  @container (width < {narrowest['stage']}px) {{ .troupe {{ --reaching: 0; }} .credit .me {{ display: none; }} }}\n"]
    for split in wider:
        rules = [f".troupe {{ --abreast: {number(split['abreast'])}; }}"]
        if split['size'] == 5:
            rules.append('.note .long { display: inline; }')
        if split['size'] is None:
            rules.append('.friends { max-width: none; }')
        out.append(f"  @container (width >= {split['stage']}px) {{ {' '.join(rules)} }}\n")
    out.append(LAYOUT_END)
    return ''.join(out)


def stage_of(window, measures):
    """The stage's width, in CSS px, in a window of the given width (below the width at which main stops growing)."""
    return window - measures['narrow' if window <= PHONE_WINDOW else 'wide']['less']


def boundary_windows(splits):
    """The windows either side of where each split takes over, and either side of a phone's widest window."""
    return sorted({w for split in splits for w in (split['window'] - 1, split['window'])} | {PHONE_WINDOW, PHONE_WINDOW + 1})


def row_drift(measures):
    """Every window measured (measures['rows']) in which the friends do not stand in the rows of the split that the
    page means for it, all full but the last, one line each: the widest split that fits the stage, or else the
    narrowest, whose friends then stand without their reaches."""
    splits, problems = layout(measures), []
    for window, counts in measures.get('rows', {}).items():
        stage = stage_of(int(window), measures)
        fitting = [split for split in splits if split['stage'] <= stage] or [min(splits, key=lambda s: s['abreast'])]
        size = max(fitting, key=lambda s: s['abreast'])['size'] or sum(counts)
        if any(count != size for count in counts[:-1]) or counts[-1] > size:
            problems.append(f'{GALLERY.name}: in a {window}px window the friends stand in rows of '
                            f'{", ".join(map(str, counts))}, not {size} to a row')
    return problems


def with_slots(text, reaches):
    """The gallery's text with each friend's reaches on each size of screen (the largest over its windows) written
    in its tag, so that its slot is as wide before the page's script runs as after."""
    by_name = {reach['name']: reach for reach in reaches}
    for tag in reversed(FriendTags(text).tags):  # From the end, so that each tag's place in the text still holds.
        reach = by_name[tag['key']]
        sides = '; '.join(f'--{screen}-{side}: {reach[screen][side]}' for screen in SCREENS for side in ('left', 'right'))
        slot = re.sub(r' style="[^"]*"', '', tag['text'])
        text = text[:tag['start']] + f'{slot[:-1]} style="{sides}">' + text[tag['start'] + len(tag['text']):]
    return text


def read_slots(text):
    """Each friend's slot on the gallery, in page order, as (key, reach left, reach right) in head units: the larger
    of its reaches on the two sizes of screen, as with_slots wrote them in its tag, which are what the rows take."""
    slots = []
    for tag in FriendTags(text).tags:
        reach = {}
        for screen, side, value in REACH.findall(tag['attrs'].get('style') or ''):
            reach[side] = max(reach.get(side, float('-inf')), float(value))
        if set(reach) != {'left', 'right'}:
            raise ValueError(f'{tag["key"]}: its tag on the gallery has no slot (--wide-left and the rest); '
                             'run python3 tools/pf.py pages')
        left, right = (int(reach[side]) if reach[side].is_integer() else reach[side] for side in ('left', 'right'))
        slots.append((tag['key'], left, right))
    return slots


def is_friend(tag, attrs):
    """Whether a start tag on the gallery is a friend's: an <li> of class friend, its attributes in any order."""
    return tag == 'li' and 'friend' in (attrs.get('class') or '').split()


class FriendTags(html.parser.HTMLParser):
    """Finds every friend's tag in a page's text (is_friend): its key (data-friend), where it starts in the text,
    its text as written, and its attributes."""

    def __init__(self, text):
        super().__init__()
        self.tags = []
        self._line_starts = [0] + [match.end() for match in re.finditer('\n', text)]
        self.feed(text)
        self.close()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if is_friend(tag, attrs):
            line, column = self.getpos()
            self.tags.append({'key': attrs.get('data-friend'), 'start': self._line_starts[line - 1] + column,
                              'text': self.get_starttag_text(), 'attrs': attrs})


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
        raise ValueError("its friends' script tags are not in one run, one to a line: move whatever lies between "
                         'them (a comment, another tag) before or after them')
    lines = [f"{first['indent']}<script src=\"{first['prefix']}lib/fwiends/characters/{name}/{name}.js\"></script>" for name in names]
    return text[:first.start()] + '\n'.join(lines) + text[last.end():]


def written(page, cast, measures):
    """A page's text now and as it should be, as (text now, text as written). Without measures, only the script
    tags are written. A page that cannot be written raises ValueError, which names it."""
    text = page.read_text(encoding='utf-8')
    try:
        new = with_scripts(text, cast['names']) or text
        if page == GALLERY and measures:
            block = layout_block(new)
            if not block:
                raise ValueError('it has no rows to write: mark them as layout_css() does')
            new = with_slots(new.replace(block, layout_css(layout(measures))), measures['reaches'])
    except ValueError as error:
        raise ValueError(f'{page.relative_to(ROOT)}: {error}') from None
    return text, new


def write_pages(cast, measures=None):
    """Rewrites every page whose script tags or rows are stale (only the script tags, without measures), and returns
    the pages rewritten."""
    changed = []
    for page in PAGES:
        text, new = written(page, cast, measures)
        if new != text:
            page.write_text(new, encoding='utf-8')
            changed.append(page)
    return changed


def page_drift(cast, measures):
    """Every page whose script tags or rows are stale, or that cannot be written, every window in which the
    gallery's rows break (row_drift), and a gallery whose head script looks for "keep still" under another key than
    lib/fwiends/src/live.js keeps it under, one line each. Without measures, the rows are not checked."""
    problems = (row_drift(measures) if measures else []) + still_key_drift()
    for page in PAGES:
        try:
            text, new = written(page, cast, measures)
        except ValueError as error:
            problems.append(str(error))
            continue
        if new == text:
            continue
        scripts = with_scripts(text, cast['names']) or text
        stale = (["its friends' script tags"] if scripts != text else []) + (['its rows and slots'] if new != scripts else [])
        problems.append(f'{page.relative_to(ROOT)}: {" and ".join(stale)} are stale; run python3 tools/pf.py pages')
    return problems


# How the gallery's head script and lib/fwiends/src/live.js name the key under which "keep still" is remembered: the head script
# reads it before live.js loads.
STILL_KEY = re.compile(r"const STILL_KEY = '([^']+)'")


def still_key_drift(gallery=GALLERY, live=SRC / 'live.js'):
    """A line if the gallery's head script and lib/fwiends/src/live.js name different keys for "keep still", or either names none."""
    keys = {path: STILL_KEY.search(path.read_text(encoding='utf-8')) for path in (gallery, live)}
    if all(keys.values()) and len({key[1] for key in keys.values()}) == 1:
        return []
    found = '; '.join(f'{path.relative_to(ROOT)} has {key[1] if key else "none"}' for path, key in keys.items())
    return [f'the key under which "keep still" is remembered (const STILL_KEY) differs: {found}']


# ---- The gallery's labels, checked against the cast -----------------------------------------

NUMBER_WORDS = ('no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven',
                'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen')
TENS_WORDS = ('', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety')


def number_word(n):
    """A count as prose writes it: "nineteen", "twenty", "twenty-one"; in figures from a hundred."""
    if n < len(NUMBER_WORDS):
        return NUMBER_WORDS[n]
    if n < 100:
        tens, ones = divmod(n, 10)
        return TENS_WORDS[tens] + (f'-{NUMBER_WORDS[ones]}' if ones else '')
    return str(n)


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
        elif is_friend(tag, attrs):
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

    The cast (lib/fwiends/characters/cast.js) is the source, and the gallery repeats it by hand: each friend's
    label (name, species and credit), the name that opens its aria-label, and which friend is the
    host. A friend is there only with its owner's agreement to the gallery. Any other link that
    credits an owner, such as the footer's to Terry's, uses the cast's name or handle and credit link. The
    link preview's alt text counts the friends and names them in the gallery's order, as the preview
    pictures them.
    cast: {host, friends: {key: entry}}, as READ_CAST_JS reads it, or None.
    """
    if cast is None:
        return ['no cast (lib/fwiends/characters/cast.js) was installed to check the labels against']
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
    friend's entry in the cast, which is None if the cast has no such friend. The link may use the
    friend's name or the owner's handle, but its address must match the owner's credit link."""
    key = credit['key']
    if entry is None:
        return [f'{key}: credited by a link (data-credit) but not in the cast']
    problems = []
    expected = {'credit': (entry['credit']['handle'], entry['name']),
                'credit link': (entry['credit']['href'],)}
    for field, values in expected.items():
        found = ' '.join(credit[field].split())
        if found not in values:
            wanted = ' or '.join(f'"{value}"' for value in values)
            problems.append(f'{key}: the {field} is "{found}" in a link that credits its owner but {wanted} in the cast')
    return problems


def preview_drift(alt, names):
    """Return the ways in which the link preview's alt text ("sixteen fwiends ...: Howdi, a sky-blue
    wolf; ...; and Claude, ...") disagrees with the gallery, whose friends' names are given in order."""
    if alt is None:
        return ['og:image:alt: index.html has no alt text for its link preview']
    match = re.match(r'([\w-]+) fwiends\b[^:]*: (.+)', alt)
    if not match:
        return ['og:image:alt: it should give the number of fwiends, then name each after a colon']
    problems, count = [], number_word(len(names))
    if match[1] != count:
        problems.append(f'og:image:alt: it counts "{match[1]}" fwiends, but the gallery has {count}')
    named = [re.sub(r'^and ', '', item).split(',')[0].strip() for item in match[2].split('; ')]
    if named != names:
        problems.append(f'og:image:alt: it names {", ".join(named)}; the gallery has {", ".join(names)}, in that order')
    return problems
