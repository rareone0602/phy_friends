"""Color math for testing phy's data palette (requires only numpy).

Provides sRGB <-> CIELAB (D65), CIEDE2000, WCAG contrast, Machado et al. (2009)
CVD simulation at severity 1.0, PhyFriends.shadeOf ported from src/phyfriends.js,
OKLab distances, and the house step in both directions. Run the module directly
to check CIEDE2000 against the Sharma et al. (2005) test pairs.
"""
import itertools
import numpy as np

# ------------------------------------------------------------------ sRGB / Lab
def hex2rgb(h):
    h = h.lstrip('#')
    return np.array([int(h[k:k + 2], 16) / 255 for k in (0, 2, 4)])

def rgb2hex(rgb):
    return '#' + ''.join(f'{int(round(min(1, max(0, c)) * 255)):02x}' for c in rgb)

def lin(c):
    c = np.asarray(c, float)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)

def gam(c):
    c = np.asarray(c, float)
    return np.where(c <= 0.0031308, 12.92 * c, 1.055 * np.abs(c) ** (1 / 2.4) * np.sign(c) - 0.055)

M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
Minv = np.array([[3.2406, -1.5372, -0.4986], [-0.9689, 1.8758, 0.0415], [0.0557, -0.2040, 1.0570]])
WHITE = np.array([0.95047, 1.0, 1.08883])

def _f(t):
    return np.where(t > 216 / 24389, np.cbrt(t), (24389 / 27 * t + 16) / 116)

def _finv(t):
    return np.where(t ** 3 > 216 / 24389, t ** 3, (116 * t - 16) / (24389 / 27))

def linrgb2lab(rl):
    X = M @ rl / WHITE
    fx, fy, fz = _f(X)
    return np.array([116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)])

def lab(hexc):
    return linrgb2lab(lin(hex2rgb(hexc)))

def lab2linrgb(L, a, b):
    fy = (L + 16) / 116
    X = np.array([_finv(fy + a / 500), _finv(fy), _finv(fy - b / 200)]) * WHITE
    return Minv @ X

def lch2hex(L, C, h_deg, clip_chroma=True):
    """Convert CIE LCh(ab) to hex; if out of gamut and clip_chroma is set, reduce chroma, keeping L and hue."""
    h = np.radians(h_deg)
    for _ in range(80):
        rl = lab2linrgb(L, C * np.cos(h), C * np.sin(h))
        if np.all(rl >= -1e-4) and np.all(rl <= 1 + 1e-4):
            break
        if not clip_chroma:
            break
        C *= 0.97
    return rgb2hex(gam(np.clip(rl, 0, 1)))

def lch(hexc):
    L, a, b = lab(hexc)
    return L, np.hypot(a, b), np.degrees(np.arctan2(b, a)) % 360

# ------------------------------------------------------------------ CIEDE2000
def de2000(lab1, lab2):
    L1, a1, b1 = lab1
    L2, a2, b2 = lab2
    C1, C2 = np.hypot(a1, b1), np.hypot(a2, b2)
    Cb = (C1 + C2) / 2
    G = 0.5 * (1 - np.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)))
    a1p, a2p = (1 + G) * a1, (1 + G) * a2
    C1p, C2p = np.hypot(a1p, b1), np.hypot(a2p, b2)
    h1p = np.degrees(np.arctan2(b1, a1p)) % 360
    h2p = np.degrees(np.arctan2(b2, a2p)) % 360
    dLp = L2 - L1
    dCp = C2p - C1p
    if C1p * C2p == 0:
        dhp = 0
    else:
        dhp = h2p - h1p
        if dhp > 180: dhp -= 360
        elif dhp < -180: dhp += 360
    dHp = 2 * np.sqrt(C1p * C2p) * np.sin(np.radians(dhp / 2))
    Lbp = (L1 + L2) / 2
    Cbp = (C1p + C2p) / 2
    if C1p * C2p == 0:
        hbp = h1p + h2p
    elif abs(h1p - h2p) <= 180:
        hbp = (h1p + h2p) / 2
    elif h1p + h2p < 360:
        hbp = (h1p + h2p + 360) / 2
    else:
        hbp = (h1p + h2p - 360) / 2
    T = (1 - 0.17 * np.cos(np.radians(hbp - 30)) + 0.24 * np.cos(np.radians(2 * hbp))
         + 0.32 * np.cos(np.radians(3 * hbp + 6)) - 0.20 * np.cos(np.radians(4 * hbp - 63)))
    dth = 30 * np.exp(-(((hbp - 275) / 25) ** 2))
    Rc = 2 * np.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7))
    Sl = 1 + 0.015 * (Lbp - 50) ** 2 / np.sqrt(20 + (Lbp - 50) ** 2)
    Sc = 1 + 0.045 * Cbp
    Sh = 1 + 0.015 * Cbp * T
    Rt = -np.sin(np.radians(2 * dth)) * Rc
    return float(np.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh)))

# ------------------------------------------------------------------ CVD (Machado 2009, severity 1)
CVD = {
    'protan': np.array([[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]]),
    'deutan': np.array([[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]]),
    'tritan': np.array([[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]]),
}

def sim(hexc, kind):
    if kind == 'normal':
        return hexc
    rl = np.clip(CVD[kind] @ lin(hex2rgb(hexc)), 0, 1)
    return rgb2hex(gam(rl))

def sim_lab(hexc, kind):
    if kind == 'normal':
        return lab(hexc)
    return linrgb2lab(np.clip(CVD[kind] @ lin(hex2rgb(hexc)), 0, 1))

# ------------------------------------------------------------------ WCAG contrast
def Y(hexc):
    return float(M[1] @ lin(hex2rgb(hexc)))

def contrast(c1, c2):
    y1, y2 = sorted([Y(c1), Y(c2)])
    return (y2 + 0.05) / (y1 + 0.05)

# ------------------------------------------------------------------ Port of shadeOf from src/phyfriends.js
SHADE = dict(dL=-10, chroma=1.2, lavender=(2, -6), neutral=10)

def shadeOf(hexc, dL=SHADE['dL']):
    L, a0, b0 = lab(hexc)
    L = L + dL
    C = np.hypot(a0, b0); hue = np.arctan2(b0, a0); w = max(0, 1 - C / SHADE['neutral'])
    def to(c2):
        A = c2 * np.cos(hue) + SHADE['lavender'][0] * w
        B = c2 * np.sin(hue) + SHADE['lavender'][1] * w
        return gam(lab2linrgb(L, A, B))
    c2 = C * SHADE['chroma']; rgb = to(c2)
    for _ in range(30):
        if not np.any((rgb < -0.002) | (rgb > 1.002)):
            break
        c2 *= 0.95; rgb = to(c2)
    return rgb2hex(rgb)

# ------------------------------------------------------------------ Report
KINDS = ['normal', 'protan', 'deutan', 'tritan']

def pair_table(cols, kind, pairs='all'):
    labs = [sim_lab(c, kind) for c in cols]
    idx = (list(itertools.combinations(range(len(cols)), 2)) if pairs == 'all'
           else [(i, i + 1) for i in range(len(cols) - 1)])
    return {(i, j): de2000(labs[i], labs[j]) for i, j in idx}

def report(named, surfaces=('#fbf9f3', '#ffffff'), show_matrix=True):
    names = list(named); cols = [named[n] for n in names]
    print(f"{'name':10} {'hex':8} {'L*':>5} {'C*':>5} {'h':>5} " + ' '.join(f'cr:{s}' for s in surfaces) + '  shade')
    for n, c in named.items():
        L, C, h = lch(c)
        print(f'{n:10} {c:8} {L:5.1f} {C:5.1f} {h:5.0f} ' + ' '.join(f'{contrast(c, s):10.2f}' for s in surfaces) + f'  {shadeOf(c)}')
    for k in KINDS:
        t = pair_table(cols, k)
        (i, j), v = min(t.items(), key=lambda kv: kv[1])
        adj = pair_table(cols, k, 'adjacent')
        (ai, aj), av = min(adj.items(), key=lambda kv: kv[1])
        print(f'{k:7} min all-pairs dE00 {v:5.1f} ({names[i]}/{names[j]})   min adjacent {av:5.1f} ({names[ai]}/{names[aj]})')
        if show_matrix:
            n = len(cols)
            mat = np.zeros((n, n))
            for (a, b), d in t.items():
                mat[a, b] = mat[b, a] = d
            print('         ' + ' '.join(f'{x[:6]:>6}' for x in names))
            for a in range(n):
                print(f'  {names[a][:6]:>6} ' + ' '.join('     -' if a == b else f'{mat[a, b]:6.1f}' for b in range(n)))

if __name__ == '__main__':
    # Test pairs for CIEDE2000 from Sharma et al. (2005).
    tests = [((50, 2.6772, -79.7751), (50, 0, -82.7485), 2.0425),
             ((50, -1.3802, -84.2814), (50, 0, -82.7485), 1.0000),
             ((50, 2.5, 0), (50, 0, -2.5), 4.3065),
             ((60.2574, -34.0099, 36.2677), (60.4626, -34.1751, 39.4387), 1.2644),
             ((22.7233, 20.0904, -46.6940), (23.0331, 14.9730, -42.5619), 2.0373),
             ((90.8027, -2.0831, 1.4410), (91.1528, -1.6435, 0.0447), 1.4441)]
    for l1, l2, want in tests:
        got = de2000(np.array(l1), np.array(l2))
        print(f'dE00 {got:.4f} want {want:.4f}', 'ok' if abs(got - want) < 1e-3 else 'FAIL')
    # Check shadeOf against the behavior documented in the library.
    print('shadeOf #84cefd ->', shadeOf('#84cefd'), ' #fce08e ->', shadeOf('#fce08e'))
    print('contrast ink on paper', round(contrast('#3d3c39', '#fbf9f3'), 2), 'ink-2', round(contrast('#6d6a63', '#fbf9f3'), 2), 'ink-3', round(contrast('#97938a', '#fbf9f3'), 2))

# ------------------------------------------------------------------ OKLab (cross-check with the dataviz validator)
def oklab_lin(rl):
    l, m, s = np.cbrt(np.array([[0.4122214708, 0.5363325363, 0.0514459929],
                                [0.2119034982, 0.6806995451, 0.1073969566],
                                [0.0883024619, 0.2817188376, 0.6299787005]]) @ rl)
    return np.array([0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
                     1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
                     0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s])

def ok(hexc, kind='normal'):
    rl = lin(hex2rgb(hexc))
    if kind != 'normal':
        rl = np.clip(CVD[kind] @ rl, 0, 1)
    return oklab_lin(rl)

def dok(c1, c2, kind='normal'):
    return float(100 * np.linalg.norm(ok(c1, kind) - ok(c2, kind)))

def okC(hexc):
    L, a, b = ok(hexc)
    return float(np.hypot(a, b))

def summary(named, pairs='all'):
    names = list(named); cols = list(named.values())
    idx = (list(itertools.combinations(range(len(cols)), 2)) if pairs == 'all'
           else [(i, i + 1) for i in range(len(cols) - 1)])
    out = {}
    for k in KINDS:
        labs = [sim_lab(c, k) for c in cols]
        d00 = {(i, j): de2000(labs[i], labs[j]) for i, j in idx}
        dk = {(i, j): dok(cols[i], cols[j], k) for i, j in idx}
        (i0, j0), v0 = min(d00.items(), key=lambda kv: kv[1])
        (i1, j1), v1 = min(dk.items(), key=lambda kv: kv[1])
        out[k] = (v0, f'{names[i0]}/{names[j0]}', v1, f'{names[i1]}/{names[j1]}')
    return out

# ------------------------------------------------------------------ House step in both directions
def lighten(hexc):
    """Return the inverse of shadeOf for a chromatic (non-neutral) color: L* +10, chroma / 1.2, same hue."""
    L, a, b = lab(hexc)
    C, h = np.hypot(a, b) / SHADE['chroma'], np.arctan2(b, a)
    return rgb2hex(gam(np.clip(lab2linrgb(L - SHADE['dL'], C * np.cos(h), C * np.sin(h)), 0, 1)))

def step(hexc, n):
    """Apply n house steps: darker (shadeOf) for n > 0, lighter for n < 0."""
    for _ in range(abs(n)):
        hexc = shadeOf(hexc) if n > 0 else lighten(hexc)
    return hexc

def to_data(hexc, paper='#fbf9f3', ratio=3.0):
    """Darken a friend's color in house steps until its contrast on the paper reaches ratio (3:1).

    Returns (color, number of steps taken).
    """
    n = 0
    while contrast(hexc, paper) < ratio:
        hexc, n = shadeOf(hexc), n + 1
    return hexc, n

def ramp(hexc, lo, hi):
    """Return the house steps around a color, from `lo` (lighter, negative) to `hi` (darker)."""
    return [step(hexc, k) for k in range(lo, hi + 1)]
