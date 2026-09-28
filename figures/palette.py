"""Derive phy's data palette from the characters' own colors and test it (STYLE.md §8).

  python3 figures/palette.py        # Requires numpy.

Rule: each series color is a character's color darkened in house steps (shadeOf: L* -10,
chroma x1.2, same hue) until it has 3:1 contrast on the paper. Where two series remain too
similar, one of them takes one more step. Series follow the stage order.
"""
import itertools
from colormath import (KINDS, contrast, de2000, dok, lab, lch, okC, shadeOf, sim_lab, step, to_data,
                      lch2hex)

PAPER, WHITE, INK = '#fbf9f3', '#ffffff', '#3d3c39'
SOURCES = [  # Name, source part, source color, extra steps beyond 3:1, and the reason for them.
    ('Howdi', 'fur (sky blue)', '#6ec7ff', 0, ''),
    ('phy', 'inner-ear almond', '#f9bcaa', 1, 'parts it from mumuyou'),
    ('Yuda', 'fur (slate blue)', '#6c7ba7', 1, 'parts it from Howdi'),
    ('Terry', 'plush (butter yellow)', '#fce08e', 0, ''),
    ('mumuyou', 'inner-ear pink', '#fcacb0', 0, ''),
]

rows = []
for name, where, src, extra, why in SOURCES:
    base, n = to_data(src)
    c = step(base, extra)
    rows.append((name, where, src, n + extra, c, why))

print(f"{'name':8} {'from':22} {'source':8} {'steps':>5}  {'hex':8} {'L*':>4} {'C*':>4} {'h':>4}  "
      f"{'paper':>5} {'white':>5}  {'shade':8}  note")
for name, where, src, n, c, why in rows:
    L, C, h = lch(c)
    print(f'{name:8} {where:22} {src:8} {n:5d}  {c:8} {L:4.0f} {C:4.0f} {h:4.0f}  '
          f'{contrast(c, PAPER):5.2f} {contrast(c, WHITE):5.2f}  {shadeOf(c):8}  {why}')

cols = [r[4] for r in rows]
names = [r[0] for r in rows]
print('\nWorst pair, all pairs (CIEDE2000 | OKLab x100):')
for k in KINDS:
    labs = [sim_lab(c, k) for c in cols]
    d = {(i, j): de2000(labs[i], labs[j]) for i, j in itertools.combinations(range(5), 2)}
    o = {(i, j): dok(cols[i], cols[j], k) for i, j in itertools.combinations(range(5), 2)}
    (i, j), v = min(d.items(), key=lambda kv: kv[1])
    (p, q), w = min(o.items(), key=lambda kv: kv[1])
    print(f'  {k:7} {v:5.1f} {names[i]}/{names[j]:8} | {w:5.1f} {names[p]}/{names[q]}')

print('\nWhat the extra steps fixed (CIEDE2000 normal / protan / deutan / tritan):')
for a, b, label in [('#bb6147', '#d56b75', 'phy at 3:1 vs mumuyou'), ('#a74126', '#d56b75', 'phy one step on'),
                    ('#6c7ba7', '#1092ca', 'Yuda at 3:1 vs Howdi'), ('#4d6295', '#1092ca', 'Yuda one step on')]:
    print(f'  {label:24}', ' '.join(f'{de2000(sim_lab(a, k), sim_lab(b, k)):5.1f}' for k in KINDS))

print('\nOKLCH chroma (dataviz floor 0.10):', ' '.join(f'{n} {okC(c):.3f}' for n, c in zip(names, cols)))
print('dE00 to ink:', ' '.join(f'{n} {de2000(lab(c), lab(INK)):.0f}' for n, c in zip(names, cols)))
print('greyscale L*:', ' '.join(f'{n} {lch(c)[0]:.0f}' for n, c in zip(names, cols)))

# Ramps apply the house step's ratio (chroma x1.2 per 10 L*) along a single hue.
def ramp_lch(hexc, Ls):
    L0, C0, h = lch(hexc)
    return [lch2hex(L, C0 * 1.2 ** ((L0 - L) / 10), h) for L in Ls]

seq = ramp_lch(cols[0], [95, 85, 75, 65, 55, 45, 35])
div_b = ramp_lch(cols[0], [40, 50, 60, 70, 80, 90])
div_r = ramp_lch(cols[1], [90, 80, 70, 60, 50, 40])
print('\nsequential (Howdi):', ' '.join(seq))
print('  L*:', ' '.join(f'{lch(c)[0]:.0f}' for c in seq), ' contrast of light end on paper', f'{contrast(seq[0], PAPER):.2f}')
print('diverging (Howdi | paper | phy):', ' '.join(div_b), PAPER, ' '.join(div_r))
for k in KINDS:
    pairs = [de2000(sim_lab(a, k), sim_lab(b, k)) for a, b in zip(div_b, div_r[::-1])]
    print(f'  {k:7} arms at equal L*, dE00 from {min(pairs):.1f} to {max(pairs):.1f}')
