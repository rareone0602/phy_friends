#!/usr/bin/env python3
"""Write demo/say-hi/source-data.js: the source text that the film shows, ready for the screen.

  python3 demo/say-hi/make_source_data.py            # Runs the tests in headless Chrome for their names and count.
  python3 demo/say-hi/make_source_data.py --no-tests # Keeps the tests of the file written last.

A page opened from file:// cannot read the repository's files, so the film reads this module instead.
It holds:

  phy      the lines of characters/phy/phy.js with their own line numbers, every comment stripped,
           whole-line and trailing; the views block is left out altogether.
  onigiri  the line of src/phyfriends.js that defines ONIGIRI, with its number.
  tests    the names of the tests and the count from a real run of `python3 tools/pf.py test`
           (test/index.html and the checks of the pages against the cast), and its summary line.

Nothing it writes may name a friend whose owner has not agreed to video (read from characters/cast.js)
or hold a forbidden string; a test whose name would is left out of the names but still counted, and any
other offending text stops the script. Run it again before the film is filmed, so that the count is the
count on that day.
"""
import argparse
import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools'))

OUT = Path(__file__).resolve().parent / 'source-data.js'
PHY = ROOT / 'characters' / 'phy' / 'phy.js'
LIBRARY = ROOT / 'src' / 'phyfriends.js'
CAST = ROOT / 'characters' / 'cast.js'
FORBIDDEN_STRINGS = ['examples/', '.png', '.jpg', 'views', 'generated']
MEDIUM = 'video'
ONIGIRI = re.compile(r'^\s*const ONIGIRI = ')
LEFT_OUT_BLOCK = re.compile(r'^\s*views:\s*\{')  # The reference views name pictures and are never shown.


def strip_comment(line, in_block):
    """Return (the line without its comments, whether a block comment is still open at its end).

    Quotes are followed, so that // or /* inside a string is kept.
    """
    out, i, quote = [], 0, None
    while i < len(line):
        c, pair = line[i], line[i:i + 2]
        if in_block:
            if pair == '*/':
                in_block, i = False, i + 2
            else:
                i += 1
            continue
        if quote:
            out.append(c)
            if c == '\\' and i + 1 < len(line):
                out.append(line[i + 1])
                i += 2
                continue
            if c == quote:
                quote = None
            i += 1
            continue
        if pair == '//':
            break
        if pair == '/*':
            in_block, i = True, i + 2
            continue
        if c in '\'"`':
            quote = c
        out.append(c)
        i += 1
    return ''.join(out).rstrip(), in_block


def source_lines(path):
    """Return [{n, text, stripped}] for every line, comments removed, with the views block left out."""
    lines, in_block, depth, skipping = [], False, 0, False
    for n, raw in enumerate(path.read_text(encoding='utf-8').splitlines(), start=1):
        text, in_block = strip_comment(raw, in_block)
        if skipping or LEFT_OUT_BLOCK.match(text):
            skipping = True
            depth += text.count('{') - text.count('}')
            if depth <= 0:
                skipping, depth = False, 0
            continue
        lines.append({'n': n, 'text': text, 'stripped': text != raw.rstrip()})
    return lines


def onigiri_line(path):
    for n, raw in enumerate(path.read_text(encoding='utf-8').splitlines(), start=1):
        if ONIGIRI.match(raw):
            text, _ = strip_comment(raw, False)
            return {'n': n, 'text': text.strip()}
    raise SystemExit(f'no ONIGIRI line in {path}')


def forbidden_names():
    """The ids and names of the friends whose owners have not agreed to video, read from characters/cast.js."""
    text = CAST.read_text(encoding='utf-8')
    names = []
    for match in re.finditer(r"^\s{4}(\w+): \{\s*name: '([^']+)'.*?agreed: \[([^\]]*)\]", text, re.S | re.M):
        friend_id, name, agreed = match.groups()
        if f"'{MEDIUM}'" not in agreed:
            names += [friend_id, name]
    if not names and "agreed" not in text:
        raise SystemExit('could not read the consent from characters/cast.js')
    return names


def problem(text, names):
    """Why a string may not be shown, or None."""
    lower = text.lower()
    if any(name.lower() in lower for name in names):
        return 'names a friend whose owner has not agreed to video'
    found = next((s for s in FORBIDDEN_STRINGS if s.lower() in lower), None)
    return f'holds "{found}"' if found else None


def run_tests():
    """Run the tests as `pf.py test` does and return (passed names, failed names)."""
    import gallery
    import pf
    from cdp import HeadlessChrome
    with HeadlessChrome(1024, 768) as chrome:
        chrome.open(pf.TEST_PAGE)
        results = chrome.evaluate(pf.TEST_RESULTS_JS, timeout=pf.TEST_TIMEOUT)
        cast = gallery.read_cast(chrome)
        measures = gallery.measure_gallery(chrome)
    if results is None:
        raise SystemExit('test/index.html did not report its results')
    passed, failed = list(results['passed']), [f['name'] for f in results['failed']]
    for name, drift in {pf.LABEL_TEST: gallery.label_drift(cast), pf.PAGES_TEST: gallery.page_drift(cast, measures)}.items():
        (failed if drift else passed).append(name)
    return passed, sorted(set(failed), key=failed.index)


def tests_section(names):
    passed, failed = run_tests()
    shown = [{'name': n, 'ok': True} for n in passed] + [{'name': n, 'ok': False} for n in failed]
    kept = [t for t in shown if not problem(t['name'], names)]
    return {
        'passed': len(passed), 'failed': len(failed), 'summary': f'{len(passed)} passed, {len(failed)} failed',
        'names': kept, 'leftOut': len(shown) - len(kept), 'ran': date.today().isoformat(),
    }


def previous_tests():
    if not OUT.is_file():
        raise SystemExit(f'{OUT} does not exist yet: run without --no-tests')
    match = re.search(r'^  "tests": (\{.*?\n  \})', OUT.read_text(encoding='utf-8'), re.S | re.M)
    if not match:
        raise SystemExit(f'could not find the tests in {OUT}')
    return json.loads(match.group(1))


def compact_json(data):
    """JSON with two-space indents, but each line of source and each test on a line of its own."""
    def dump(value, indent):
        pad = '  ' * indent
        if isinstance(value, dict) and not all(isinstance(v, (str, int, float, bool)) for v in value.values()):
            items = [f'{pad}  {json.dumps(k)}: {dump(v, indent + 1)}' for k, v in value.items()]
            return '{\n' + ',\n'.join(items) + f'\n{pad}}}'
        if isinstance(value, list) and value and isinstance(value[0], dict):
            items = [f'{pad}  {json.dumps(v, ensure_ascii=False)}' for v in value]
            return '[\n' + ',\n'.join(items) + f'\n{pad}]'
        return json.dumps(value, ensure_ascii=False)
    return dump(data, 0)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('--no-tests', action='store_true', help='keep the tests of the file written last')
    a = parser.parse_args(argv)
    names = forbidden_names()
    data = {
        'phy': {'file': 'characters/phy/phy.js', 'lines': source_lines(PHY)},
        'onigiri': {'file': 'src/phyfriends.js', **onigiri_line(LIBRARY)},
        'tests': previous_tests() if a.no_tests else tests_section(names),
    }
    texts = [line['text'] for line in data['phy']['lines']] + [data['onigiri']['text']] + [t['name'] for t in data['tests']['names']]
    bad = [(text, why) for text in texts if (why := problem(text, names))]
    if bad:
        for text, why in bad:
            print(f'refused: a line {why}', file=sys.stderr)
        raise SystemExit(f'{len(bad)} line(s) may not be shown; nothing was written')
    body = compact_json(data)
    OUT.write_text(
        '/*\n'
        ' * say hi: the source text that the film shows, made by demo/say-hi/make_source_data.py; do not edit\n'
        ' * by hand. Every comment is stripped from the lines, which keep their numbers in the file.\n'
        ' */\n'
        f'window.SayHi = window.SayHi || {{}};\nwindow.SayHi.source = Object.freeze({body});\n',
        encoding='utf-8')
    tests = data['tests']
    print(f"wrote {OUT.relative_to(ROOT)}: {len(data['phy']['lines'])} lines of phy.js, the ONIGIRI line ({data['onigiri']['n']}), "
          f"{len(tests['names'])} test names ({tests['leftOut']} left out), {tests['summary']}")


if __name__ == '__main__':
    main()
