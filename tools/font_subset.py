#!/usr/bin/env python3
"""Subset the house face, Shantell Sans, to the WOFF2 that site/notebook.css serves.

  python3 tools/font_subset.py          # Requires fontTools and brotli: pip install fonttools brotli

The source is the full variable font in figures/fonts/. The axes the pages use (wght, BNCE and INFM;
STYLE.md §5) keep their full ranges, and every other axis is pinned to its default, since the house style has
no italics and keeps the face's spacing. The glyphs are those of UNICODE_RANGES, with the features the pages
use: kerning, ligatures, the alternates for repeated letters (in rlig) and tabular figures. A character the face
lacks, such as the eighth note, falls back to the system's faces, as it always has.

The face's license names no reserved font name, so the subset keeps the face's name, and the license is copied
beside it (the OFL asks for that). Run this again when the source face changes, or when it reports a character
that the documents use and the face has but UNICODE_RANGES leaves out.
"""
import html
import shutil
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'figures' / 'fonts' / 'ShantellSans-Variable.ttf'
LICENSE = ROOT / 'figures' / 'fonts' / 'OFL-ShantellSans.txt'
OUT_DIR = ROOT / 'site' / 'fonts'
OUT = OUT_DIR / 'ShantellSans-Latin.woff2'

KEPT_AXES = ('wght', 'BNCE', 'INFM')  # The axes at their full ranges, as site/notebook.css and the pages use them.
ADDED_FEATURES = ('tnum',)            # Tabular figures (font-variant-numeric in site/pencil.css), beyond fontTools' defaults.
DROPPED_TABLES = ('vhea', 'vmtx', 'VVAR')  # Vertical metrics: the pages set horizontal text only.

# The code points kept, inclusive. Where a range reaches past what the face holds, the subset keeps what it has.
UNICODE_RANGES = (
    (0x0020, 0x007E),  # Basic Latin.
    (0x00A0, 0x00FF),  # Latin-1 Supplement.
    (0x0100, 0x017F),  # Latin Extended-A.
    (0x2000, 0x206F),  # General Punctuation: dashes, quotation marks, the bullet and the ellipsis.
    (0x2190, 0x2193),  # Arrows: the guides' ← and →, and the vertical pair.
    (0x2212, 0x2212),  # The minus sign, which the guides use in formulas.
    (0x2215, 0x2215),  # The division slash.
    (0x20AC, 0x20AC),  # The euro sign.
    (0x2122, 0x2122),  # The trade mark sign.
)

# The documents whose characters the subset must cover; a character outside ASCII that they use is checked.
DOCUMENTS = ('index.html', 'specimen.html', 'style.html', 'STYLE.md', 'FWIENDS.md')


def main():
    font = TTFont(SOURCE)
    source_cmap = dict(font.getBestCmap())
    axes = {axis.axisTag: (axis.minValue, axis.defaultValue, axis.maxValue) for axis in font['fvar'].axes}
    missing_axes = [tag for tag in KEPT_AXES if tag not in axes]
    if missing_axes:
        sys.exit(f'font_subset: {SOURCE.name} has no {", ".join(missing_axes)} axis')
    pinned = {tag: values[1] for tag, values in axes.items() if tag not in KEPT_AXES}
    if pinned:
        # The instancer's delta optimization is off: it moves outlines by up to a unit in 1000, and with this face it
        # makes the file larger.
        instancer.instantiateVariableFont(font, pinned, inplace=True, optimize=False)

    codepoints = [codepoint for first, last in UNICODE_RANGES for codepoint in range(first, last + 1)]
    options = subset.Options()
    options.layout_features = [*options.layout_features, *ADDED_FEATURES]
    options.drop_tables = [*options.drop_tables, *DROPPED_TABLES]
    options.name_IDs = ['*']       # Keeps the copyright and license notices, and the axes' names.
    options.hinting = True         # Keeps the face's scan-conversion program (its glyphs have no instructions).
    options.notdef_outline = True
    options.glyph_names = True     # Dropping them, to save 2 KB, changed how Chrome on macOS sets small text.
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=codepoints)
    subsetter.subset(font)
    kept_cmap = font.getBestCmap()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    font.flavor = 'woff2'
    font.save(OUT)
    shutil.copyfile(LICENSE, OUT_DIR / LICENSE.name)

    kept_axes = ', '.join(f'{axis.axisTag} {axis.minValue:g} to {axis.maxValue:g}' for axis in font['fvar'].axes)
    print(f'{OUT.relative_to(ROOT)}: {OUT.stat().st_size / 1000:.1f} KB, {len(font.getGlyphOrder())} glyphs, '
          f'{len(kept_cmap)} characters, axes {kept_axes}')
    report_coverage(source_cmap, kept_cmap)


def report_coverage(source_cmap, kept_cmap):
    """Exit if a document uses a character the face has and the subset lacks; list those the face lacks."""
    used = set()
    for name in DOCUMENTS:
        used.update(html.unescape((ROOT / name).read_text(encoding='utf-8')))
    outside = sorted(char for char in used if ord(char) > 0x7E and ord(char) not in kept_cmap)
    dropped = [char for char in outside if ord(char) in source_cmap]
    if dropped:
        listing = ' '.join(f'U+{ord(char):04X}' for char in dropped)
        sys.exit(f'font_subset: the documents use {listing}, which the face has; add them to UNICODE_RANGES')
    if outside:
        listing = ' '.join(f'U+{ord(char):04X} {char}' for char in outside)
        print(f'the face lacks {listing}; they fall back to the system')


if __name__ == '__main__':
    main()
