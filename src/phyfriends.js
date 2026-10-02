/*!
 * phy_friends: a small factory for characters drawn in colored pencil.
 *
 * A character is a small data "spec": a palette plus a handful of shape
 * parameters (head, face, ears, hair, eyes, and so on). Calling
 * render(spec, {pose, view}) returns it as an SVG string. Calling
 * mount(el, spec) returns a live rig whose setPose() rewrites only a few
 * transforms, so the rig is cheap to animate or to drive from the mouse.
 *
 * Head space: the origin is between the eyes, +x points right, +y points down,
 * and the head is about 200 units wide. Angles are in degrees: 0 is right and
 * 90 is down (screen space).
 *
 * Loads as a classic <script> (window.PhyFriends) or as a CommonJS module.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PhyFriends = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const VERSION = '0.1.0';
  const DEG = Math.PI / 180;
  const num = n => Math.round(n * 100) / 100;
  const rot = (x, y, a) => {
    const c = Math.cos(a), s = Math.sin(a);
    return [x * c - y * s, x * s + y * c];
  };

  // ---------------------------------------------------------------- Random

  function rng(seed) { // Mulberry32 PRNG
    let a = (seed >>> 0) || 0x9e3779b9;
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // The house shade (STYLE.md principle 5; FWIENDS.md) is the single shade layer that every
  // friend shares. When a spec omits a palette role `<name>Shade`, it is derived from <name>:
  // one fixed step darker in CIELAB lightness, with its own hue at a higher chroma (x1.2, kept
  // inside the sRGB gamut). Near-whites have no hue of their own, so they shift toward lavender
  // instead, matching the artists' own shading. Every friend's shades use the same step.
  const SHADE = { dL: -10, chroma: 1.2, lavender: [2, -6], neutral: 10 };
  function shadeOf(hex, by = SHADE) {
    let h = hex.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&');
    const lin = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    const [r, g, b] = [0, 2, 4].map(k => lin(parseInt(h.slice(k, k + 2), 16) / 255));
    const f = t => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
    const fx = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047), fy = f(0.2126 * r + 0.7152 * g + 0.0722 * b),
      fz = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883);
    const L = 116 * fy - 16 + by.dL, a0 = 500 * (fx - fy), b0 = 200 * (fy - fz);
    const C = Math.hypot(a0, b0), hue = Math.atan2(b0, a0), w = Math.max(0, 1 - C / by.neutral);
    const toRGB = c2 => {
      const A = c2 * Math.cos(hue) + by.lavender[0] * w, B = c2 * Math.sin(hue) + by.lavender[1] * w;
      const gy = (L + 16) / 116, gx = gy + A / 500, gz = gy - B / 200;
      const inv = t => (t ** 3 > 216 / 24389 ? t ** 3 : (116 * t - 16) / (24389 / 27));
      const X = inv(gx) * 0.95047, Y = inv(gy), Z = inv(gz) * 1.08883;
      const gam = c => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
      return [3.2406 * X - 1.5372 * Y - 0.4986 * Z, -0.9689 * X + 1.8758 * Y + 0.0415 * Z, 0.0557 * X - 0.2040 * Y + 1.0570 * Z].map(gam);
    };
    let c2 = C * by.chroma, rgb = toRGB(c2);
    for (let i = 0; i < 30 && rgb.some(c => c < -0.002 || c > 1.002); i++) rgb = toRGB(c2 *= 0.95);
    return '#' + rgb.map(c => Math.max(0, Math.min(255, Math.round(c * 255))).toString(16).padStart(2, '0')).join('');
  }
  const isHex = v => typeof v === 'string' && /^#[0-9a-f]{3,6}$/i.test(v);
  // A palette role is a color, or the name of another role (paw: 'face') or of its house shade (body: 'furShade'),
  // whose color it takes; its own house shade is then that color's.
  function withShades(palette) {
    const hexOf = (k, seen = new Set()) => {
      const v = palette[k];
      if (isHex(v)) return v;
      if (typeof v !== 'string' || seen.has(k)) return undefined;
      seen.add(k);
      if (v in palette) return hexOf(v, seen);
      const base = v.endsWith('Shade') && v.slice(0, -5);
      const hex = base && base in palette ? hexOf(base, seen) : undefined;
      return hex && shadeOf(hex);
    };
    const P = {}; // Insert each derived shade directly after its base color.
    for (const k of Object.keys(palette)) {
      const v = hexOf(k) ?? palette[k];
      P[k] = v;
      if (isHex(v) && !(`${k}Shade` in palette)) P[`${k}Shade`] = shadeOf(v);
    }
    return P;
  }

  function hash(str) { // FNV-1a
    let h = 2166136261;
    for (const ch of String(str)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    return h >>> 0;
  }

  // ----------------------------------------------------------- Path builder

  // Builds a closed outline through nodes {x, y, c, b}.
  //   c: True for a corner node (sharp); otherwise the curve passes through smoothly
  //      (Catmull-Rom).
  //   b: The bend of the edge leaving a corner node, in degrees. For outlines that
  //      run clockwise on screen (increasing angle), b > 0 bows the edge
  //      inward (concave) and b < 0 bows it outward (convex).
  function pathD(nodes, closed = true, tension = 1 / 6) {
    const pts = nodes.filter((n, i) => {
      const p = nodes[(i - 1 + nodes.length) % nodes.length];
      return i === 0 || Math.hypot(n.x - p.x, n.y - p.y) > 1e-3;
    });
    const n = pts.length;
    if (!n) return '';
    const P = i => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
    let d = `M${num(pts[0].x)} ${num(pts[0].y)}`;
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const a = P(i), b = P(i + 1), cx = b.x - a.x, cy = b.y - a.y, bend = (a.b || 0) * DEG;
      let h1, h2;
      if (a.c) h1 = rot(cx / 3, cy / 3, bend);
      else { const p = P(i - 1); h1 = [(b.x - p.x) * tension, (b.y - p.y) * tension]; }
      if (b.c) h2 = rot(-cx / 3, -cy / 3, -bend);
      else { const q = P(i + 2); h2 = [(a.x - q.x) * tension, (a.y - q.y) * tension]; }
      d += `C${num(a.x + h1[0])} ${num(a.y + h1[1])} ${num(b.x + h2[0])} ${num(b.y + h2[1])} ${num(b.x)} ${num(b.y)}`;
    }
    return closed ? d + 'Z' : d;
  }

  // --------------------------------------------------------------- Ellipses

  function ellipse(s) {
    const rx = s.rx ?? 50;
    return { cx: s.cx || 0, cy: s.cy || 0, rx, ry: s.ry ?? rx, rot: (s.rot || 0) * DEG };
  }
  function ellPoint(e, deg, k = 1) {
    const t = deg * DEG, [x, y] = rot(Math.cos(t) * e.rx * k, Math.sin(t) * e.ry * k, e.rot);
    return [e.cx + x, e.cy + y];
  }
  function ellNormal(e, deg) {
    const t = deg * DEG, nx = Math.cos(t) / e.rx, ny = Math.sin(t) / e.ry, l = Math.hypot(nx, ny);
    return rot(nx / l, ny / l, e.rot);
  }
  // An ellipse { cx, cy, rx, ry, rot (degrees) } as a path of two arcs.
  function ellipseD({ cx = 0, cy = 0, rx, ry, rot = 0 }) {
    const ax = rx * Math.cos(rot * DEG), ay = rx * Math.sin(rot * DEG);
    const arc = (x, y) => `A${num(rx)} ${num(ry)} ${num(rot)} 1 0 ${num(cx + x)} ${num(cy + y)}`;
    return `M${num(cx - ax)} ${num(cy - ay)}${arc(ax, ay)}${arc(-ax, -ay)}Z`;
  }
  function ellAngle(e, x, y) {
    const [u, v] = rot(x - e.cx, y - e.cy, -e.rot);
    return (Math.atan2(v / e.ry, u / e.rx) / DEG + 360) % 360;
  }

  // ---------------------------------------------------------------- Shapes

  // A rice ball (onigiri) is an ellipse squared off toward a superellipse of exponent 2 + square, which gives it
  // a broad, flat base with round corners, and narrowed toward its top until it is `taper` narrower there. The
  // house's rice ball is a soft rounded triangle: much narrower under the chin, and round at the base (square 0).
  const ONIGIRI = { square: 0, taper: 0.85 };
  // The outline a fluffy shape grows its tufts on: its ellipse or, with `onigiri`, a rice ball: a number (0 to 1)
  // makes the ellipse ONIGIRI's rice ball by that much, and { taper, square } gives the rice ball's own.
  // point(deg, k) is the point at angle deg (k scales it toward the center) and normal(deg) the outward normal
  // there. The angles keep their meaning (90 the bottom, 270 the top), so a shape's tufts stay where they were.
  function outlineOf(s) {
    const e = ellipse(s), g = s.onigiri || 0;
    if (!g) return { point: (deg, k = 1) => ellPoint(e, deg, k), normal: deg => ellNormal(e, deg) };
    const { taper, square } = typeof g === 'object' ? { ...ONIGIRI, ...g } : { taper: ONIGIRI.taper * g, square: ONIGIRI.square * g };
    const q = 2 / (2 + square);
    const unit = deg => {
      const c = Math.cos(deg * DEG), v = Math.sin(deg * DEG);
      const x = Math.sign(c) * Math.abs(c) ** q, y = Math.sign(v) * Math.abs(v) ** q;
      return [x * (1 - (taper * (1 - y)) / 2), y];
    };
    const point = (deg, k = 1) => {
      const [x, y] = unit(deg), [u, w] = rot(x * e.rx * k, y * e.ry * k, e.rot);
      return [e.cx + u, e.cy + w];
    };
    const normal = deg => {
      const [x0, y0] = unit(deg - 0.5), [x1, y1] = unit(deg + 0.5), tx = (x1 - x0) * e.rx, ty = (y1 - y0) * e.ry;
      const l = Math.hypot(tx, ty) || 1;
      return rot(ty / l, -tx / l, e.rot);
    };
    return { point, normal };
  }
  // How far the outline of a fluffy shape (without its tufts) reaches to the right of the center line at height y.
  function reachAt(s, y) {
    const o = outlineOf(s);
    let prev = o.point(-90);
    for (let deg = -89; deg <= 90; deg++) {
      const p = o.point(deg);
      if ((prev[1] - y) * (p[1] - y) <= 0 && p[1] !== prev[1]) return prev[0] + ((p[0] - prev[0]) * (y - prev[1])) / (p[1] - prev[1]);
      prev = p;
    }
    return 0;
  }

  // Fluffy blob: an ellipse whose outline carries tufts of fur over given angle ranges.
  //   {cx, cy, rx, ry, rot, onigiri, step, fluff: [{from, to, n, len, lean, jit, depth, b1, b2, sym, seed}]}
  //   onigiri (0..1) makes the ellipse a rice ball (outlineOf), which takes more nodes (step 10, not 24).
  //   Each range places n tufts between angles from..to. Per range: len = tuft length;
  //   lean shifts the tips toward +angle (degrees); jit = randomness (0..1); depth =
  //   notch depth (0..1 of the radius); b1/b2 bend the rising/falling side of each tuft;
  //   sym mirrors the range across the vertical axis. Ranges must not overlap.
  //   For sawtooth shingles, use len ~0, depth ~0.1, a lean that puts each tip near
  //   one of its valleys, and a convex long side (b ~ -15) with a straight
  //   notch (b ~ 0). A negative len pulls the tip inward (with n: 1, it flattens an arc).
  function fluffy(s, seed = 1) {
    const e = outlineOf(s), step = s.step || (s.onigiri ? 10 : 24), ranges = [];
    (s.fluff || []).forEach((fl, i) => {
      const R = rng(hash(seed) + (fl.seed ?? i) * 7919);
      const n = fl.n || 5, jit = fl.jit ?? 0.35, span = fl.to - fl.from;
      const valleys = [0], tips = [];
      for (let k = 1; k < n; k++) valleys.push((k + (R() - 0.5) * jit * 0.6) / n);
      valleys.push(1);
      for (let k = 0; k < n; k++) tips.push({
        pos: (valleys[k] + valleys[k + 1]) / 2 + (fl.lean || 0) / span + (R() - 0.5) * jit * 0.3 / n,
        len: (fl.len ?? 8) * (1 + (R() * 2 - 1) * jit),
      });
      const r = { from: fl.from, span, valleys, tips, depth: fl.depth ?? 0.03, b1: fl.b1 ?? -8, b2: fl.b2 ?? 22 };
      ranges.push(r);
      if (fl.sym) ranges.push({
        ...r, from: 180 - fl.to, b1: r.b2, b2: r.b1,
        valleys: valleys.map(v => 1 - v).reverse(),
        tips: tips.map(t => ({ ...t, pos: 1 - t.pos })).reverse(),
      });
    });
    ranges.forEach(r => { r.from = ((r.from % 360) + 360) % 360; });
    ranges.sort((a, b) => a.from - b.from);

    const nodes = [];
    const smooth = (a0, a1) => {
      const m = Math.max(1, Math.round((a1 - a0) / step));
      for (let j = 1; j < m; j++) {
        const [x, y] = e.point(a0 + (j * (a1 - a0)) / m);
        nodes.push({ x, y });
      }
    };
    if (!ranges.length) {
      const m = Math.round(360 / step);
      for (let j = 0; j < m; j++) { const [x, y] = e.point((j * 360) / m); nodes.push({ x, y }); }
      return nodes;
    }
    let cursor = ranges[0].from;
    const end = cursor + 360;
    for (const r of ranges) {
      let from = r.from;
      while (from < cursor - 1e-6) from += 360;
      smooth(cursor, from);
      r.valleys.forEach((v, k) => {
        const a = from + v * r.span, inner = k > 0 && k < r.valleys.length - 1;
        const [x, y] = e.point(a, inner ? 1 - r.depth : 1);
        nodes.push({ x, y, c: true, b: k < r.tips.length ? r.b1 : 0 });
        if (k < r.tips.length) {
          const t = r.tips[k], at = from + t.pos * r.span;
          const [bx, by] = e.point(at), [nx, ny] = e.normal(at);
          nodes.push({ x: bx + nx * t.len, y: by + ny * t.len, c: true, b: r.b2 });
        }
      });
      cursor = from + r.span;
    }
    smooth(cursor, end);
    return nodes;
  }

  // Spiky tuft (hair). Tips are absolute points; a valley sits on the base
  // ellipse (scaled by `valley`) halfway between consecutive tips.
  //   {cx, cy, rx, ry, rot, valley, b1, b2, tips: [[x, y, b1, b2, v], ...]}
  //   A tip's own b1/b2 bend the edges rising to and falling from that tip; its v
  //   overrides the following valley (a scale factor, or an absolute [x, y]).
  function star(s) {
    const e = ellipse(s);
    const tips = s.tips
      .map(t => (Array.isArray(t) ? { x: t[0], y: t[1], b1: t[2], b2: t[3], v: t[4] } : { ...t }))
      .map(t => ({ ...t, a: ellAngle(e, t.x, t.y) }))
      .sort((p, q) => p.a - q.a);
    const nodes = [];
    tips.forEach((t, i) => {
      const next = tips[(i + 1) % tips.length];
      nodes.push({ x: t.x, y: t.y, c: true, b: t.b2 ?? s.b2 ?? 0 });
      let a1 = next.a;
      if (a1 <= t.a) a1 += 360;
      const v = t.v ?? s.valley ?? 0.85;
      const [vx, vy] = Array.isArray(v) ? v : ellPoint(e, (t.a + a1) / 2, v);
      nodes.push({ x: vx, y: vy, c: true, b: next.b1 ?? s.b1 ?? 0 });
    });
    return nodes;
  }

  // Converts any shape spec to nodes. Raw nodes are given as [[x, y, corner, bend], ...];
  // the optional round (0 to 0.5) softens every corner into an arc, cut at that fraction
  // of its shorter edge.
  function shapeNodes(s, seed) {
    if (s.nodes) {
      const ns = s.nodes.map(n => (Array.isArray(n) ? { x: n[0], y: n[1], c: !!n[2], b: n[3] || 0 } : n));
      return s.round ? roundCorners(ns, s.round) : ns;
    }
    if (s.tips) return star(s);
    return fluffy(s, seed);
  }

  // Replaces each corner with two corners joined by an arc. The arc is bent by minus half
  // the turn at that corner, so it leaves along the incoming edge and arrives along the
  // outgoing one. The corner's own bend moves to the outgoing edge.
  function roundCorners(ns, r) {
    const n = ns.length;
    return ns.flatMap((v, i) => {
      if (!v.c) return [v];
      const p = ns[(i + n - 1) % n], q = ns[(i + 1) % n];
      const ax = v.x - p.x, ay = v.y - p.y, bx = q.x - v.x, by = q.y - v.y;
      const la = Math.hypot(ax, ay), lb = Math.hypot(bx, by), d = Math.min(la, lb) * r;
      const turn = Math.atan2(ax * by - ay * bx, ax * bx + ay * by) / DEG;
      return [{ x: v.x - (ax / la) * d, y: v.y - (ay / la) * d, c: true, b: -turn / 2 },
        { x: v.x + (bx / lb) * d, y: v.y + (by / lb) * d, c: true, b: v.b }];
    });
  }
  // Rounded polygons, several per shape (for crumbs or spots), given as
  // polys: [[x, y, r, sides, rot, aspect], ...]. The radius r reaches the corners, rot is
  // in degrees, and aspect < 1 squashes each polygon across its first corner (turning a
  // square into a diamond). The shape's round (default 0.2) softens the corners, and its
  // bend (default -6) bows the edges outward.
  function polyNodes(p, s) {
    const [x, y, r, n = 6, a = 0, k = 1] = p, b = s.bend ?? -6;
    return roundCorners(Array.from({ length: n }, (_, i) => {
      const [u, v] = rot(Math.cos((i * 2 * Math.PI) / n) * r, Math.sin((i * 2 * Math.PI) / n) * r * k, a * DEG);
      return { x: x + u, y: y + v, c: true, b };
    }), s.round ?? 0.2);
  }
  const shapeD = (s, seed) => s.d || (s.polys ? s.polys.map(p => pathD(polyNodes(p, s))).join('') : pathD(shapeNodes(s, seed)));

  // Ear in local space: the base is centered on the origin, and the ear points up (-y). The base is the ear's root,
  // where it meets the head, and the ear turns about it (earPlace), so an ear drawn as an extra keeps its base there.
  //   {width, length, lean, tip, b1, b2, inner: {scale, dx, dy}, stripes: [{t, w, a, b, span}]}
  //   Local +x is the side facing the top of the head. The lean moves the tip along
  //   +x, and tip > 0 rounds the tip. Stripes are bands at fraction t of the length,
  //   w thick, tilted a degrees, and bowed by b; span [x0, x1] limits a band to that
  //   local x range (the default is the full ear; the band's end is square).
  //   The inner ear is the outline scaled by `scale` and shifted by dx/dy; it may also
  //   override width/length/lean/tip/b1/b2 to get its own (e.g., slimmer) shape.
  //   Setting inner.front: true draws the inner ear in front of the head (layers
  //   earLfront / earRfront, directly after 'base'), so it can extend down over the
  //   head fur while the rest of the ear stays behind the head.
  function earNodes(ear) {
    const w = ear.width / 2, L = ear.length, lean = ear.lean || 0, r = ear.tip || 0;
    const B1 = [-w, 0], T = [lean, -L], B2 = [w, 0];
    const nodes = [{ x: B1[0], y: B1[1], c: true, b: ear.b1 ?? -12 }];
    if (r > 0) {
      const u1 = norm(T[0] - B1[0], T[1] - B1[1]), u2 = norm(B2[0] - T[0], B2[1] - T[1]);
      nodes.push({ x: T[0] - u1[0] * r, y: T[1] - u1[1] * r, c: true, b: -45 });
      nodes.push({ x: T[0] + u2[0] * r, y: T[1] + u2[1] * r, c: true, b: ear.b2 ?? -12 });
    } else nodes.push({ x: T[0], y: T[1], c: true, b: ear.b2 ?? -12 });
    nodes.push({ x: B2[0], y: B2[1], c: true, b: 0 }, { x: 0, y: w * 0.8 });
    return nodes;
  }
  function norm(x, y) { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; }

  // Tail in local space: the base is on the origin, and the tail points up (-y). It is a
  // fluffy ellipse (`fluff` angles as for any fluffy: 270 = tip, 90 = base) bent into
  // a plume.
  //   {length, width, curl, bend, taper, root, fluff}
  //   Local +x faces away from the body, and curl moves the tip that way (the spine
  //   bends as u², where u runs from 0 at the base to 1 at the tip). The taper and
  //   root values (0..1) pinch the tip end and the base end, so the plume is widest
  //   past its midpoint. The bend value (degrees) turns the spine itself, by bend·u²
  //   at the tip (+ outward, - inward), and lays the width off along the spine's
  //   normal, so the plume keeps its thickness as it curls over (curl only slides it
  //   sideways). The `blob` argument of tailNodes swaps in another ellipse spec
  //   (e.g., a tip marking) bent the same way.
  // Calling tailBend(tail) returns that mapping: (x, y) in the straight plume -> [x, y] bent.
  function tailBend(tail) {
    const L = tail.length, taper = tail.taper ?? 0.3, root = tail.root ?? 0.8, curl = tail.curl || 0;
    const bend = (tail.bend || 0) * DEG, N = 60, S = [[0, 0]];
    // Sample the bent spine in N steps per tail length, out to u = 1.2 (as far as tufts reach).
    if (bend) for (let i = 1; i <= N * 1.2; i++) {
      const a = bend * ((i - 0.5) / N) ** 2, [x, y] = S[i - 1];
      S.push([x + Math.sin(a) * L / N, y - Math.cos(a) * L / N]);
    }
    return (x, y) => {
      const u = Math.min(1.2, Math.max(0, -y / L));
      const k = Math.max(0.05, 1 - taper * u * u) * Math.max(0.05, 1 - root * (1 - Math.min(1, u)) ** 2);
      if (!bend) return [x * k + curl * u * u, y];
      const f = u * N, i = Math.min(S.length - 2, Math.floor(f)), t = f - i, a = bend * u * u;
      const sx = S[i][0] + (S[i + 1][0] - S[i][0]) * t, sy = S[i][1] + (S[i + 1][1] - S[i][1]) * t;
      return [sx + x * k * Math.cos(a) + curl * u * u, sy + x * k * Math.sin(a)];
    };
  }
  function tailNodes(tail, seed, blob) {
    const L = tail.length, bent = tailBend(tail);
    const s = blob || { cx: 0, cy: -L / 2, rx: tail.width / 2, ry: L / 2, step: tail.step, fluff: tail.fluff };
    return fluffy(s, seed).map(n => {
      const [x, y] = bent(n.x, n.y);
      return { ...n, x, y };
    });
  }
  // Returns where a rigid mark centered at (cx, cy) in the straight plume rides once the
  // tail is bent: a `translate(..) rotate(..) translate(..)` that moves the center onto
  // the bent tail and turns the mark with the spine at that point.
  function tailRide(tail, cx, cy) {
    const L = tail.length, bent = tailBend(tail);
    const u = Math.min(1.2, Math.max(0, -cy / L)), u0 = Math.max(0, Math.min(1.19, u - 0.005));
    const [ax, ay] = bent(0, -u0 * L), [bx, by] = bent(0, -(u0 + 0.01) * L), [X, Y] = bent(cx, cy);
    const turn = Math.atan2(bx - ax, ay - by) / DEG;
    return `translate(${num(X)} ${num(Y)}) rotate(${num(turn)}) translate(${num(-cx)} ${num(-cy)})`;
  }

  // ------------------------------------------------------------------ Specs

  const registry = new Map();
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);

  function merge(a, b) {
    if (!isObj(a) || !isObj(b)) return b === undefined ? a : b;
    const out = { ...a };
    for (const k in b) out[k] = merge(a[k], b[k]);
    return out;
  }

  function define(name, spec) {
    let s = { name, ...spec };
    if (s.extends) { const base = resolve(s.extends); s = merge(base, s); delete s.extends; s.name = name; }
    registry.set(name, s);
    return s;
  }
  function resolve(s) {
    if (typeof s !== 'string') return s;
    const r = registry.get(s);
    if (!r) throw new Error(`phy_friends: unknown character "${s}"`);
    return r;
  }
  // The palette role that colors a part (ANATOMY.roles): the role itself where the spec's palette gives it, else
  // `legacy`, the color that the part takes in a spec without the role (Claude's, and specs written before the roles).
  const roleOr = (spec, name, legacy) => (spec.palette && name in spec.palette ? name : legacy);

  // ---------------------------------------------------------------- Anatomy

  // Every friend drawn to the house template is made of the same parts, named the same way, so that one friend's spec
  // reads line for line against another's, and a part that a friend lacks is a decision rather than an oversight.
  // Claude, which keeps the shape of Claude Code's mascot, is the one friend outside it. check(spec) lists where a
  // spec departs from it.
  //   sections: a spec's sections, in order; each one marked true must be given, or be false where the friend has no
  //             such part (Terry has no hair). A friend that stands gives its seated paw and foot (stand.seat), or
  //             false for one that its seated drawing hides.
  //   roles:    the palette's roles, in order, each with the part that needs it ('' for every friend; null for a role
  //             that a friend may leave out). Each part takes its color from its role (the head from `head`, a hind
  //             foot from `foot`), never from a color of its own, so that the palette is the one table of a friend's
  //             colors; a role may name another role (paw: 'face') or its house shade (body: 'furShade'). The
  //             friend's other colors follow the roles.
  //   features: what an extra draws (its `feature`), grouped by where it sits, so that what friends share has one
  //             name: one friend's eyebrow dots are `brows` as much as another's.
  const ANATOMY = {
    sections: {
      palette: true, head: true, face: true, ears: true, hair: true, eyes: true, blush: true, mouth: true, body: true,
      tail: true, stand: true, extras: true, rig: true, views: false,
    },
    roles: {
      bg: '', fur: '', head: 'head', face: 'face', hair: 'hair', ear: 'ears', earRight: null, earInner: 'ears.inner',
      iris: 'eyes', irisRight: null, ink: 'mouth', blush: 'blush', tongue: 'mouth', body: 'body', tail: 'tail',
      arm: 'stand', paw: 'stand', pawRight: null, leg: 'stand', foot: 'stand',
    },
    features: {
      head: ['cheekRuff', 'neck', 'backHair', 'horns', 'antlers', 'blaze', 'brows', 'forehead', 'cheekMarks', 'eyePatch',
        'mask', 'muzzle', 'noseBand', 'glasses', 'cap'],
      ears: ['earInner', 'earTufts', 'earFold', 'earTips', 'earLobes', 'earFront'],
      hair: ['locks', 'curl', 'crest', 'partings', 'streaks', 'lockTips', 'ponytail'],
      body: ['chest', 'belly', 'shoulders', 'armStripes', 'thighs', 'wings', 'crumbs'],
      clothes: ['bandana', 'neckerchief', 'hoodie', 'shirt', 'hem', 'hood', 'drawstrings', 'headphones', 'yukata',
        'collar', 'print', 'sash', 'bow', 'anklet', 'boots'],
      tail: ['tailTip', 'tailMarks', 'tailBase', 'tailUnderside', 'marbling'],
      limbs: ['cuffs', 'socks', 'toes', 'soles', 'hooves'],
    },
    // The layers an extra may lie on (its `on`); 'ears', 'paws' and 'feet' mean both.
    layers: ['base', 'face', 'ears', 'earL', 'earR', 'hair', 'blush', 'body', 'scarf', 'tail', 'paws', 'pawL', 'pawR',
      'feet', 'footL', 'footR', 'ground'],
    // The parts of every friend's drawing that a pose moves, by the names that a mounted rig gives them (rig.parts):
    // what the code that animates a friend may rely on, whichever friend it is.
    parts: ['root', 'upper', 'head', 'base', 'face', 'earL', 'earR', 'hair', 'eyes', 'eyeL', 'eyeR', 'mouth', 'blush',
      'cheekL', 'cheekR', 'body', 'tail', 'legL', 'legR', 'footL', 'footR', 'armL', 'armR', 'pawL', 'pawR'],
    // The keys of the standing figure (stand) and of its seat, arms and legs.
    stand: {
      stand: ['seat', 'fit', 'ground', 'hips', 'arms', 'legs', 'tail'],
      seat: ['paw', 'foot', 'right', 'arms', 'legs'],
      arms: ['shoulder', 'angle', 'bend', 'length', 'width', 'taper', 'bands', 'paw', 'right'],
      legs: ['hip', 'spread', 'ankle', 'bow', 'knees', 'width', 'taper', 'bands', 'foot', 'right'],
    },
  };
  // The parts whose color is a role's, by the path of their own `color` (or tongue) in a spec. The right one of a pair
  // (`right`) takes the pair's role, or its own where the palette gives one (earRight, irisRight, pawRight).
  const ROLE_COLORS = {
    'head.color': 'head', 'face.color': 'face', 'ears.color': 'ear', 'ears.right.color': 'earRight',
    'ears.inner.color': 'earInner', 'hair.color': 'hair', 'eyes.color': 'iris', 'eyes.right.color': 'irisRight',
    'mouth.color': 'ink', 'mouth.tongue': 'tongue', 'blush.color': 'blush', 'body.color': 'body', 'tail.color': 'tail',
    'stand.arms.color': 'arm', 'stand.arms.right.color': 'arm', 'stand.arms.paw.color': 'paw',
    'stand.arms.right.paw.color': 'pawRight', 'stand.legs.color': 'leg', 'stand.legs.right.color': 'leg',
    'stand.legs.foot.color': 'foot', 'stand.legs.right.foot.color': 'foot',
  };

  // Where a spec departs from the house anatomy (ANATOMY), as a list of plain sentences; empty when it keeps to it.
  function check(specOrName) {
    const spec = resolve(specOrName);
    return [checkSections, checkPalette, checkColors, checkStand, checkExtras].flatMap(departures => departures(spec));
  }
  const valueAt = (o, path) => path.split('.').reduce((v, k) => (v == null ? v : v[k]), o);

  // The sections: each one the house knows, the required ones given, in the house order.
  function checkSections(spec) {
    const out = [], { sections } = ANATOMY, order = Object.keys(sections), given = Object.keys(spec).filter(k => k !== 'name');
    for (const k of given) if (!(k in sections)) out.push(`"${k}" is not a section of the house anatomy`);
    for (const k of order) if (sections[k] && spec[k] === undefined) out.push(`no ${k}: give it, or false if the friend has none`);
    const known = given.filter(k => k in sections);
    if (known.join() !== order.filter(k => known.includes(k)).join()) out.push(`the sections are not in the house order (${order.join(', ')})`);
    return out;
  }

  // The palette: every role a part needs, in the house order before the friend's other colors, each naming a color.
  function checkPalette(spec) {
    const out = [], { roles } = ANATOMY, palette = spec.palette || {}, P = withShades(palette), names = Object.keys(palette);
    const needed = Object.entries(roles).filter(([, need]) => need === '' || (need && valueAt(spec, need)));
    for (const [role] of needed) if (!(role in palette)) out.push(`the palette has no ${role}`);
    const rolesGiven = names.filter(k => k in roles), others = names.filter(k => !(k in roles));
    if (names.join() !== [...Object.keys(roles).filter(k => rolesGiven.includes(k)), ...others].join()) {
      out.push(`the palette's roles do not come first, in the house order (${Object.keys(roles).join(', ')})`);
    }
    for (const k of names) if (!isHex(P[k])) out.push(`palette.${k} names no color ("${palette[k]}")`);
    return out;
  }

  // Every color the spec names is the palette's, a house shade of it, or a color written out; and each part takes its
  // role's color, not one of its own.
  function checkColors(spec) {
    const out = [], P = withShades(spec.palette || {});
    const named = (v, path) => {
      if (typeof v === 'string' && v !== 'none' && !isHex(v) && !isHex(P[v])) out.push(`${path} names no color of the palette ("${v}")`);
    };
    const walk = (o, path) => {
      if (Array.isArray(o)) o.forEach((v, i) => walk(v, `${path}[${i}]`));
      else if (isObj(o)) {
        for (const [k, v] of Object.entries(o)) {
          const p = path ? `${path}.${k}` : k;
          if (['fill', 'color', 'tongue', 'stripeColor'].includes(k)) named(v, p);
          else if (k !== 'palette' && k !== 'views') walk(v, p);
        }
      }
    };
    walk(spec, '');
    for (const [path, role] of Object.entries(ROLE_COLORS)) {
      if (valueAt(spec, path) !== undefined) out.push(`${path} is set: give the palette's ${role} instead`);
    }
    return out;
  }

  // The standing figure's keys, and the seated paw and foot that it folds into.
  function checkStand(spec) {
    const out = [], s = spec.stand, keys = ANATOMY.stand;
    if (!s || !isObj(s)) return out;
    const only = (o, list, path) => o && Object.keys(o).forEach(k => list.includes(k) || out.push(`${path}.${k} is not a key of the standing figure`));
    only(s, keys.stand, 'stand');
    only(s.seat, keys.seat, 'stand.seat');
    only(s.arms, keys.arms, 'stand.arms');
    only(s.legs, keys.legs, 'stand.legs');
    for (const end of ['paw', 'foot']) {
      if (!s.seat || s.seat[end] === undefined) out.push(`stand.seat has no ${end}: give the seated ${end}, or false if the seated drawing hides it`);
    }
    return out;
  }

  // Each extra names a feature of the house's list, and lies on a layer of the figure.
  function checkExtras(spec) {
    const out = [], { features, layers } = ANATOMY, all = Object.values(features).flat();
    (spec.extras || []).forEach((x, i) => {
      if (!all.includes(x.feature)) out.push(`extras[${i}] (on ${x.on}) names no feature of the house's list ("${x.feature}")`);
      if (!layers.includes(x.on)) out.push(`extras[${i}] lies on "${x.on}", which is not a layer of the figure`);
    });
    return out;
  }

  // ------------------------------------------------------------------- Rig

  // Every pose field is optional; anim.js blends the numeric fields additively.
  const POSE = {
    x: 0, y: 0,         // Whole-body offset (head units)
    squash: 0,          // Positive stretches up, negative squashes down (about the ground)
    tilt: 0,            // Head roll in degrees
    headX: 0, headY: 0, // Head offset from the body (head units), for nods and bobs
    turnX: 0, turnY: 0, // Head yaw and pitch, -1..1 (rendered as layer parallax)
    lookX: 0, lookY: 0, // Gaze direction, -1..1
    blink: 0,           // Eyelid closure, 0 open to 1 shut (only the open eye shape squashes)
    widen: 0,           // Eye size: positive widens (0.3 = 30% larger), negative squints
    lid: 0,             // A lid held over the open eyes, cut straight across: 0 none to 1 shut (heavy, sad or cross eyes)
    lidTilt: 0,         // The lid's slant in degrees: positive lowers its inner end (cross), negative raises it (sad)
    earL: 0, earR: 0,   // Extra outward ear rotation in degrees
    hair: 0,            // Hair sway in degrees
    tail: 0,            // Tail wag in degrees: positive swings the tip outward, negative tucks it in behind
    blush: 1,           // Blush opacity
    flush: 0,           // How far the blush spreads: 0 as drawn, 0.5 half as large again
    eyes: 'open',       // Eye state: 'open' | 'happy' | 'closed' | 'squint' (eyeL / eyeR override it)
    mouth: null,        // Mouth shape: null = spec default; 'none' | 'w' | 'smile' | 'frown' | 'o' | 'v' | 'open'
    show: null,         // The extras shown on cue: a space-separated list of their names (an extra's `show`)
    // The figure's limbs (spec.stand), on which a friend both sits and stands. A spec with stand: false always sits
    // and ignores the fields below.
    stance: 'sit',      // 'sit' | 'stand'
    rise: 0,            // How much further up than its stance (sit 0, stand 1) the friend is, the sum held to 0..1: the
                        // figure rises through every height between
    crouch: 0,          // How far the hips drop while the feet stay planted (head units); a plush leg shortens to take it up
    lean: 0,            // Upper-body lean about the hips in degrees: positive tips the head to the viewer's right
    armL: 0, armR: 0,   // Arm raise in degrees: 0 hangs at rest, 90 is held out level, 180 is straight up
    elbowL: 0, elbowR: 0, // Further bend along the arm in degrees: positive carries on the way it raises (a wave), negative curls the paw in
    legL: 0, legR: 0,   // Leg swing at the hip in degrees: positive kicks the foot outward
    stepL: 0, stepR: 0, // How far each foot is lifted off the ground (head units); the leg shortens to take it up
    over: null,         // The arms drawn whole in front, shoulder too, rather than tucked under the scarf and the head at the
                        // shoulder: 'armL', 'armR' or 'armL armR'
  };

  // Parallax depth per layer: how far each layer slides when the head turns.
  const DEPTH = { tail: -0.4, body: -0.15, earL: -0.5, earR: -0.5, face: 0.35, blush: 0.55, eyes: 0.6, mouth: 0.55, hair: 0.45 };

  const LID_CLEARANCE = 2;     // How far above the eye the lid rests while it is up, in head units.
  const DEFAULT_GROUND = 120;  // The ground line, in head units, of a spec without rig.ground.
  // Extras on these are drawn on both of the pair, in each one's own space.
  const BOTH = { ears: ['earL', 'earR'], paws: ['pawL', 'pawR'], feet: ['footL', 'footR'] };
  const EAR_DEFAULT = { base: [-70, -70], angle: 35, width: 60, length: 70 };
  const EYE_DEFAULT = { x: 35, y: 0, w: 14, h: 28, shape: 'pill', range: 6 };
  // Default tail: a bushy plume that curls up behind the left side of the body (see tailNodes).
  const TAIL_DEFAULT = {
    base: [-56, 102], angle: 55, length: 108, width: 58, curl: -50,
    fluff: [{ from: 150, to: 205, n: 2, len: 8, lean: 8, sym: true },
      { from: 216, to: 258, n: 2, len: 11, lean: 7, depth: 0.06, sym: true },
      { from: 262, to: 278, n: 1, len: 12 }],
  };

  // The standing figure: the friend's seated body, on two short legs, with two short arms hanging from its sides,
  // all in head space. Its feet touch the ground at `ground`, and the rig lifts it so that they stand on
  // rig.ground, where the seated friend's paws are: the body keeps its shape and its markings, so a friend that
  // stands up only grows its legs. Sitting is the same figure with its hips dropped and its limbs folded (seat).
  // Points given as [x, y] are measured from the center line on either side, as the eyes and blush are.
  // Arms and legs are soft hoses of a fixed length bent along a circular arc (limbArc); an arm is posed by its
  // angles, and a leg reaches for its foot, which stays planted while the hips move.
  //   seat:  the seated drawing's forepaw and hind foot, { paw, foot, right }, down to which the arms hang and into
  //          which the legs fold (standFor)
  //   fit:   any of STAND_FIT's numbers, for this friend
  //   ground, hips: where the feet touch, and the pivot of a lean (default: the hips' height on the center line)
  //   arms:  { shoulder, angle, bend, length, width, taper, color, bands, paw, right }
  //   legs:  { hip, spread, ankle, bow, knees, width, taper, color, bands, foot, right }
  //   tail:  { base, angle }, the tail's place while standing
  // `angle` is the arm's rest angle out from hanging straight down, and `bend` its rest bend (negative curls
  // the paw in). A leg runs from its hip to an ankle `spread` farther out and `ankle` above the ground; `bow`
  // lengthens it beyond that, so that it bows out at rest; and with knees: false it never bows but shortens, as
  // a stuffed toy's leg squashes, where another would bend. Bands are sleeves, cuffs, socks and stripes:
  // { from, to, color, grow, teeth, depth }, a stretch of the limb between fractions from and to of its length,
  // standing `grow` proud of it on each side, whose upper edge may be cut into `teeth` points `depth` deep. A paw
  // or a foot is an ellipse in its own space: the origin at the end of the limb, +y carrying on along the arm
  // (down, for a foot) and +x toward the center line; the seated one (seat) rises into it. One that the seat leaves
  // out may be any shape. `right` holds overrides for the right side, as the ears' does. The arms, paws, legs and
  // feet take the palette's arm, paw, leg and foot (ANATOMY.roles); in a spec without those roles, the arms and paws
  // take the fur's color and the legs and feet the body's.
  // STAND_DEFAULT is the template: plush limbs, straight and round-ended, with legs that squash rather than bend.
  const STAND_DEFAULT = {
    arms: { bend: 0, length: 42, width: 22, taper: 0, paw: { cx: 0, cy: 0, rx: 11.5, ry: 11.5 } },
    legs: { spread: 0, bow: 0, knees: false, width: 26, taper: 0, ankle: 13, foot: { cx: 0, cy: 2, rx: 15, ry: 11 } },
  };
  // Where the limbs and the ground go on a friend's body, unless its spec places them. The legs show `legs` below
  // the body's bottom, from hips `hip` of its half-width out and `hipUp` above its bottom. The shoulders sit
  // `shoulder` below its center, `inset` of an arm's width inside its outline, and each arm hangs `out` degrees
  // out from the outline below the shoulder (or from straight down, where the outline turns in), so that it runs
  // down the body's side and its paw shows past it. The figure folds its limbs as it sits: an arm with a seated paw
  // of its own (seat) hangs straight down to it from `forelegs` of the body's half-height below its center; without
  // a seated paw and foot, its feet slide out until they rest `feet` of the body's half-width out, beside its base,
  // and each arm swings in to reach for a paw resting `paws` [of the half-width out, above the ground], in front of
  // the body. A spec may change any of these for itself (stand.fit). These numbers, with STAND_DEFAULT's, ONIGIRI's
  // and BODY's, were chosen by eye on the tuning page (October 2026): long arms that hang high on the body and well
  // out from it, and longer legs set close together. Each arm tucks under the scarf and the head for `tuck` of its
  // length from the shoulder (see render).
  const STAND_FIT = { legs: 30, hip: 0.3, hipUp: 14, shoulder: -12, inset: 0.3, out: 12, feet: 0.7, paws: [0.32, 12], forelegs: 0, tuck: 0.6 };
  // How tall the body of every friend that stands is, as a share of the height its own spec gives it. A taller body
  // keeps its top, under the chin, and reaches lower: it stretches downward with its markings and clothes (its
  // extras), what the spec places on it (the tail's root, and any shoulders or hips of its own) moves down with it,
  // and what rests on the ground (the seated paws and feet, the props, and the ground itself) drops as far as its
  // base does. The head stays where it is.
  const BODY = { height: 1.1 };
  // Whether a spec stands: it does unless it has stand: false or a body that is not a (fluffy) ellipse, on which the
  // limbs could not be fitted.
  function stands(spec) {
    const b = spec.body;
    return !(spec.stand === false || !b || b.nodes || b.tips || b.d || b.polys);
  }
  // A spec's body at BODY.height: how far it stretches (k) from its top (top), the ellipse it becomes (body), where a
  // point on it moves to (along), and how far its base drops (drop). A friend that never stands keeps its body.
  function bodyHeight(spec) {
    const k = BODY.height;
    if (k === 1 || !stands(spec)) return { k: 1, top: 0, body: spec.body, along: y => y, drop: 0 };
    const { cy, ry } = ellipse(spec.body), top = cy - ry;
    return { k, top, body: { ...spec.body, cy: top + ry * k, ry: ry * k }, along: y => (y > top ? top + (y - top) * k : y), drop: 2 * ry * (k - 1) };
  }
  // Where a friend's feet and seated paws touch the ground, in head units: its rig's ground, dropped with its body.
  function groundOf(specOrName) {
    const spec = resolve(specOrName);
    return ((spec.rig && spec.rig.ground) ?? DEFAULT_GROUND) + bodyHeight(spec).drop;
  }
  const standCache = new WeakMap();
  // The spec's standing figure with the defaults filled in, or null for a spec that never stands (stands).
  function standFor(specOrName) {
    const spec = resolve(specOrName);
    if (!stands(spec)) return null;
    if (!standCache.has(spec)) standCache.set(spec, standingFigure(spec));
    return standCache.get(spec);
  }
  function standingFigure(spec) {
    const tall = bodyHeight(spec), s = standOnBody(spec.stand || {}, tall);
    const { cx, cy, rx, ry } = ellipse(tall.body), body = { ...tall.body, cx, cy, rx, ry };
    const F = { ...STAND_FIT, ...(s.fit || {}) }, bottom = body.cy + body.ry, fitted = fittedLimbs(body, s, F);
    const stand = {
      ground: s.ground ?? bottom + F.legs, tail: s.tail || null,
      arms: limbPair(spec, s, fitted, 'arms', roleOr(spec, 'arm', 'fur'), 'paw'),
      legs: limbPair(spec, s, fitted, 'legs', roleOr(spec, 'leg', body.color || roleOr(spec, 'body', 'chest')), 'foot'),
    };
    stand.hips = s.hips || [0, stand.legs.L.hip[1]];
    stand.tuck = F.tuck;
    stand.lift = stand.ground - groundOf(spec);
    stand.seat = seatFold(stand, body, s.seat || {}, F);
    return stand;
  }
  // The spec's stand section on its body at BODY.height (bodyHeight): the points it places on the body (shoulders,
  // hips, the tail's standing root) move along with the body, and what rests on the ground (the ground, the seated
  // paws and feet) drops with its base.
  function standOnBody(s, { along, drop }) {
    if (!drop) return s;
    const on = p => [p[0], along(p[1])], down = e => (e && e.cy !== undefined ? { ...e, cy: e.cy + drop } : e);
    const seated = x => ({ ...x, ...(x.paw ? { paw: down(x.paw) } : {}), ...(x.foot ? { foot: down(x.foot) } : {}) });
    return {
      ...s,
      ...(s.seat ? { seat: { ...seated(s.seat), ...(s.seat.right ? { right: seated(s.seat.right) } : {}) } } : {}),
      ...(s.ground != null ? { ground: s.ground + drop } : {}),
      ...(s.hips ? { hips: on(s.hips) } : {}),
      ...(s.tail && s.tail.base ? { tail: { ...s.tail, base: on(s.tail.base) } } : {}),
      ...(s.arms && s.arms.shoulder ? { arms: { ...s.arms, shoulder: on(s.arms.shoulder) } } : {}),
      ...(s.legs && s.legs.hip ? { legs: { ...s.legs, hip: on(s.legs.hip) } } : {}),
    };
  }
  // The limbs and the ground are fitted to the body (STAND_FIT) where the spec does not place them. The arm's slope is
  // measured down the outline over most of the arm's length.
  function fittedLimbs(body, s, F) {
    const arm = { ...STAND_DEFAULT.arms, ...(s.arms || {}) }, bottom = body.cy + body.ry;
    const sy = arm.shoulder ? arm.shoulder[1] : body.cy + F.shoulder, below = sy + arm.length * 0.9;
    const slope = Math.atan2(reachAt(body, below) - reachAt(body, sy), below - sy) / DEG;
    return {
      arms: { shoulder: [reachAt(body, sy) - arm.width * F.inset, sy], angle: Math.max(0, slope) + F.out },
      legs: { hip: [body.rx * F.hip, bottom - F.hipUp] },
    };
  }
  // A pair of limbs (kind 'arms' or 'legs') with their paws or feet (end): the template's, fitted to the body, then
  // the spec's own, each part in its role's color; the right one takes its `right` overrides, and the end's own role
  // (pawRight) where the palette gives one.
  function limbPair(spec, s, fitted, kind, color, end) {
    const D = STAND_DEFAULT, given = s[kind] || {}, base = { ...D[kind], ...fitted[kind], color, ...given };
    base[end] = { ...D[kind][end], color: roleOr(spec, end, given.color || color), ...(given[end] || {}) };
    // The right paw or foot takes its own role (pawRight) where the palette gives one; otherwise, like the left, its
    // pair's role (paw), and only without that the right limb's own color.
    const right = given.right || {}, own = roleOr(spec, `${end}Right`, null) || (end in (spec.palette || {}) ? null : right.color);
    const rightEnd = { ...base[end], ...(own ? { color: own } : {}), ...(right[end] || {}) };
    return { L: base, R: { ...base, ...right, [end]: rightEnd } };
  }
  // The figure folds its limbs as it sits. The seat gives the forepaw and the hind foot of the friend's seated
  // drawing (paw, foot): ellipses { cx, cy, rx, ry, rot } in head space, the left one's, with cx measured from the
  // center line, and right: { paw, foot } holding overrides for the right one. Each limb folds until its paw or
  // foot is that ellipse: the arm hangs down in front of the body to its paw, and the leg reaches its foot from
  // behind the body. A foot left out tucks under the body. Without a paw, the limbs fold toward their places in
  // STAND_FIT instead: the feet out beside the base and the paws reaching for the ground in front. `arms` and
  // `legs` override the folded limbs' numbers.
  function seatFold(stand, body, given, F) {
    const fold = { arms: {}, legs: {}, paw: {}, foot: {} };
    const floor = stand.ground - stand.lift;  // Where the seated paws touch (rig.ground)
    // A seated paw or foot with its defaults filled in, as ellipse() fills them, but with rot in degrees.
    const full = e => e && { ...e, ...ellipse(e), rot: e.rot || 0 };
    for (const S of ['L', 'R']) {
      const leg = stand.legs[S], arm = stand.arms[S], [sx, sy] = arm.shoulder, right = S === 'R' ? given.right || {} : {};
      const paw = full(given.paw && { ...given.paw, ...(right.paw || {}) }), foot = full(given.foot && { ...given.foot, ...(right.foot || {}) });
      if (paw) {
        // Seated, the arm hangs straight down in front of the body to its paw, from `forelegs` of the body's
        // half-height below its center, as a seated animal's forelegs do; one given length 0 folds into its paw.
        const width = Math.min(arm.width, 2 * Math.min(paw.rx, paw.ry));
        const length = Math.max(0, (given.arms || {}).length ?? paw.cy - (body.cy + body.ry * F.forelegs) - width / 2);
        fold.paw[S] = paw;
        fold.arms[S] = { shoulder: [paw.cx, paw.cy - length], angle: 0, bend: 0, length, width };
      } else {
        const reach = [sx - body.rx * F.paws[0], stand.ground - F.paws[1] - sy - stand.lift];
        fold.arms[S] = { angle: -Math.atan2(reach[0], reach[1]) / DEG, bend: 0 };
      }
      if (foot) {
        fold.foot[S] = foot;
        fold.legs[S] = { spread: foot.cx - leg.hip[0], ankle: floor - foot.cy, width: Math.min(leg.width, 2 * Math.min(foot.rx, foot.ry)) };
      } else fold.legs[S] = given.paw ? {} : { spread: Math.max(0, body.rx * F.feet - leg.hip[0]) };
      Object.assign(fold.arms[S], given.arms || {});
      Object.assign(fold.legs[S], given.legs || {});
    }
    fold.front = !!(fold.foot.L || fold.foot.R);  // Seated feet lie on the body, so the feet are drawn in front of it
    return fold;
  }
  // The side ('L' or 'R', the viewer's) away from a friend's tail while it stands, where a raised arm shows best: 'R'
  // for a friend without a tail.
  function freeSide(specOrName) {
    const spec = resolve(specOrName), stand = standFor(spec);
    if (!spec.tail) return 'R';
    const tail = { ...tailFor(spec), ...((stand && stand.tail) || {}) };
    return tail.base[0] > 0 ? 'L' : 'R';
  }
  // How far the rig lifts a standing friend so that its feet stand where its seated paws do.
  function standLift(specOrName) {
    const stand = standFor(specOrName);
    return stand ? stand.lift : 0;
  }
  // How far up a pose has the figure: up, from 0 sitting to 1 standing (its stance plus its rise); how far its hips
  // drop (crouch); and how far its limbs are folded toward sitting (fold). Sitting is the figure's hips dropped by
  // the lift, with its limbs folded.
  function stanceFor(stand, p) {
    if (!stand) return { up: 0, crouch: 0, fold: 0 };
    const up = Math.min(1, Math.max(0, (p.stance === 'stand' ? 1 : 0) + (p.rise || 0)));
    // A crouch, like the limbs' fields, counts for less the lower the figure is, and for nothing while it sits.
    return { up, crouch: Math.min(stand.lift, (p.crouch || 0) * up + stand.lift * (1 - up)), fold: 1 - up };
  }
  // How far a pose raises a friend's upper body (its head) above where it sits, in head units.
  function riseOf(specOrName, pose) {
    const stand = standFor(specOrName);
    return stand ? stand.lift - stanceFor(stand, { ...POSE, ...(pose || {}) }).crouch : 0;
  }

  // A limb: a hose that leaves `base` at angle a0 (radians; 0 is +x and pi/2 is down) and turns steadily by
  // `turn` radians over its length L, as a circular arc. at(s) is the point s along it and the direction there.
  function limbArc([bx, by], a0, turn, L) {
    const k = L > 1e-6 ? turn / L : 0;
    return s => {
      const a = a0 + k * s;
      if (Math.abs(k) < 1e-6) return [bx + Math.cos(a0) * s, by + Math.sin(a0) * s, a];
      return [bx + (Math.sin(a) - Math.sin(a0)) / k, by + (Math.cos(a0) - Math.cos(a)) / k, a];
    };
  }
  // The outline of a stretch of a limb, from fraction f0 to f1 of its length L, `grow` proud of it on each
  // side. Its width runs from `width` at the base, narrowing by `taper` toward the end. An end of the limb is
  // rounded; a cut across it is square, and a cut nearer the base may be cut into `teeth` points `depth` deep.
  function limbNodes(at, L, { width, taper = 0, from: f0 = 0, to: f1 = 1, grow = 0, teeth = 0, depth = 5 }) {
    const half = s => (width * (1 - (L > 0 ? (taper * s) / L : 0))) / 2 + grow;
    const n = Math.max(3, Math.ceil((L * (f1 - f0)) / 6)), side = [[], []];
    for (let i = 0; i <= n; i++) {
      const s = L * (f0 + ((f1 - f0) * i) / n), [x, y, a] = at(s), h = half(s), cut = (i === 0 && f0 > 0) || (i === n && f1 < 1);
      side[0].push({ x: x - Math.sin(a) * h, y: y + Math.cos(a) * h, c: cut });
      side[1].push({ x: x + Math.sin(a) * h, y: y - Math.cos(a) * h, c: cut });
    }
    const cap = (s, from) => {
      const [x, y, a] = at(s), h = half(s);
      return [1, 2, 3].map(j => ({ x: x + Math.cos(a + from - (j * Math.PI) / 4) * h, y: y + Math.sin(a + from - (j * Math.PI) / 4) * h }));
    };
    const nodes = [...side[0], ...(f1 >= 1 ? cap(L * f1, Math.PI / 2) : []), ...side[1].slice().reverse()];
    if (f0 <= 0) nodes.push(...cap(0, -Math.PI / 2));
    else if (teeth > 0) {
      const [, , a] = at(L * f0), [b, e] = [side[1][0], side[0][0]];
      for (let i = 1; i < 2 * teeth; i++) {
        const u = i / (2 * teeth), tip = i % 2 ? depth : 0;
        nodes.push({ x: b.x + (e.x - b.x) * u - Math.cos(a) * tip, y: b.y + (e.y - b.y) * u - Math.sin(a) * tip, c: true });
      }
    }
    return nodes;
  }
  // A leg stretches up to STRETCH times its length before its foot leaves the ground, and bows out until its
  // chord is FOLD of its length.
  const STRETCH = 1.15, FOLD = 0.3;
  // The bend (radians) at which an arc of length L spans a chord of length c, from sin(b/2) / (b/2) = c / L.
  function bendFor(c, L) {
    const r = Math.max(FOLD, Math.min(1, c / L));
    let lo = 0, hi = 2 * Math.PI - 1e-3;
    for (let i = 0; i < 40; i++) {
      const b = (lo + hi) / 2;
      if (Math.sin(b / 2) / (b / 2) > r) lo = b; else hi = b;
    }
    return (lo + hi) / 2;
  }
  // Every limb of the standing figure for a pose: the hose of each arm and leg ({ at, L, a, spec }), where it
  // ends, and its paw's or foot's transform. The arms hang from the upper body and are drawn in its group, which
  // drops by crouch and leans about the hips, so they are given in its own frame; each leg runs from its hip,
  // carried with the upper body, to its foot, which stays planted
  // where the leg's swing and step put it. A leg too long for that bows out, and one too short stretches a
  // little and then lifts its foot.
  function limbsFor(stand, p, crouch = p.crouch || 0, fold = 0) {
    const lean = (p.lean || 0) * DEG, [px, py] = stand.hips;
    const carry = (x, y) => { const [u, v] = rot(x - px, y - py, lean); return [px + u, py + v + crouch]; };
    // A limb folded toward sitting by k: its numbers (and points) part of the way to the folded limb's.
    const folded = (limb, seat, k) => {
      if (!k) return limb;
      const out = { ...limb }, mix = (a, b) => a + (b - a) * k;
      for (const key in seat) out[key] = Array.isArray(seat[key]) ? seat[key].map((v, i) => mix(limb[key][i], v)) : mix(limb[key] || 0, seat[key]);
      return out;
    };
    const out = {};
    for (const [S, d] of [['L', 1], ['R', -1]]) {
      const arm = folded(stand.arms[S], stand.seat.arms[S], fold), [sx, sy] = arm.shoulder;
      const a0 = (90 + d * (arm.angle + (p[`arm${S}`] || 0))) * DEG;
      const arc = limbArc([-d * sx, sy], a0, d * (arm.bend + (p[`elbow${S}`] || 0)) * DEG, arm.length);
      out[`arm${S}`] = { at: arc, L: arm.length, spec: arm, end: arc(arm.length) };

      const leg = folded(stand.legs[S], stand.seat.legs[S], fold), [hx, hy] = leg.hip, foot = leg.foot;
      const ankle = leg.ankle ?? (foot.cy || 0) + (foot.ry ?? foot.rx ?? 0);
      const rest = [-d * (hx + leg.spread), stand.ground - ankle], swing = d * (p[`leg${S}`] || 0) * DEG;
      const [ox, oy] = rot(rest[0] + d * hx, rest[1] - hy, swing);
      const hip = carry(-d * hx, hy), want = [-d * hx + ox, hy + oy - (p[`step${S}`] || 0)];
      const L = Math.hypot(rest[0] + d * hx, rest[1] - hy) * (1 + (leg.bow || 0));
      const c = Math.hypot(want[0] - hip[0], want[1] - hip[1]), chord = Math.atan2(want[1] - hip[1], want[0] - hip[0]);
      // A leg bows out to its tightest (FOLD) and then shortens, so that a deep crouch never sinks the foot; a leg
      // without knees shortens at once.
      const knees = leg.knees !== false;
      const length = c > L ? Math.min(c, L * STRETCH) : knees ? Math.min(L, c / FOLD) : c, b = knees && c < length ? bendFor(c, length) : 0;
      const legArc = limbArc(hip, chord + (d * b) / 2, -d * b, length);
      out[`leg${S}`] = { at: legArc, L: length, spec: leg, end: legArc(length), tilt: swing * 0.5 };
    }
    return out;
  }

  function earFor(spec, side) {
    const ears = { ...EAR_DEFAULT, ...(spec.ears || {}) };
    return side === 'R' ? { ...ears, ...(ears.right || {}) } : ears;
  }
  function earPlace(ear, side, twitch) {
    const [bx, by] = ear.base, a = ear.angle + twitch;
    return side === 'L'
      ? `translate(${num(bx)} ${num(by)}) rotate(${num(-a)})`
      : `translate(${num(-bx)} ${num(by)}) rotate(${num(a)}) scale(-1 1)`;
  }
  // The tail pivots at its base and leans `angle` degrees away from the body's
  // center line (mirrored when the base is on the left, so +x stays outward).
  // A tail that sets `bend` curls through the bend instead, so it drops the default curl.
  // Its root moves down with a taller body (bodyHeight).
  const tailFor = spec => {
    const tail = { ...TAIL_DEFAULT, ...(spec.tail && spec.tail.bend ? { curl: 0 } : {}), ...spec.tail }, { along } = bodyHeight(spec);
    return { ...tail, base: [tail.base[0], along(tail.base[1])] };
  };
  function tailPlace(tail, wag) {
    const [bx, by] = tail.base, out = bx < 0 ? -1 : 1;
    return `translate(${num(bx)} ${num(by)}) rotate(${num(out * ((tail.angle || 0) + wag))})${out < 0 ? ' scale(-1 1)' : ''}`;
  }

  // The lid is the edge of a clip over the open eye, in the eye's own units: it comes down from above the eye
  // by `lid` of the eye's height (and a little more, so that 1 shuts it) and turns about its middle, the inner
  // end (d = 1 for the left eye, -1 for the right) lowering as lidTilt grows.
  function lidPlace(eye, p, d) {
    const lid = Math.min(1, Math.max(0, p.lid || 0));
    return `translate(0 ${num(lid * (eye.h + LID_CLEARANCE))}) rotate(${num(d * (p.lidTilt || 0))} 0 ${num(-eye.h / 2 - LID_CLEARANCE)})`;
  }

  // The pose fields that move the limbs, besides the crouch and the fold that stanceFor works out.
  const LIMB_FIELDS = ['lean', 'armL', 'armR', 'elbowL', 'elbowR', 'legL', 'legR', 'stepL', 'stepR'];
  const limbMemo = new WeakMap();
  // The limbs' outlines (paths), the transforms of their paws and feet, each arm's tuck (its disc about the shoulder,
  // before the parallax) and where each paw is (paws) for a pose. A seated friend's limbs stay as they are from frame to frame, so the
  // last answer for each figure is kept and given again while its limb fields, crouch and fold are unchanged.
  function limbStateFor(stand, q, at) {
    const key = [at.crouch, at.fold, ...LIMB_FIELDS.map(f => q[f] || 0)].join(' ');
    const kept = limbMemo.get(stand);
    if (kept && kept.key === key) return kept;
    const all = limbsFor(stand, q, at.crouch, at.fold), seat = stand.seat, transform = {}, paths = {}, tuck = {}, paws = {};
    for (const name in all) {
      const { at: arc, L, spec: limb, end: [x, y, a], tilt } = all[name], S = name.slice(-1), end = name.startsWith('arm') ? 'paw' : 'foot';
      // A limb folded into a seated paw or foot keeps its bands inside that, so their cloth thins as it folds; an arm
      // that still shows while seated keeps its sleeves.
      const folded = seat[end][S] && !(end === 'paw' && seat.arms[S].length) ? 1 - at.fold : 1;
      // The stretch of an arm that tucks under the scarf and the head: a disc about its shoulder (see render). It
      // always takes in the round end of the hose and its sleeves, with a unit to spare, which would otherwise show
      // round its edge as a ring while the arm is short, on the way up or down.
      if (end === 'paw') {
        const [bx, by] = arc(0), cuff = Math.max(0, ...(limb.bands || []).map(band => (band.grow || 0) * folded));
        tuck[S] = `translate(${num(bx)} ${num(by)}) scale(${num(Math.max(L * stand.tuck, limb.width / 2 + cuff + 1))})`;
      }
      if (end === 'paw') paws[S] = [x, y];
      paths[name] = pathD(limbNodes(arc, L, limb));
      (limb.bands || []).forEach((band, i) => { paths[`${name}:${i}`] = pathD(limbNodes(arc, L, { ...limb, ...band, grow: (band.grow || 0) * folded })); });
      const turn = tilt === undefined ? a / DEG - 90 : tilt / DEG;
      transform[`${end}${S}`] = `translate(${num(x)} ${num(y)}) rotate(${num(turn)})${S === 'R' ? ' scale(-1 1)' : ''}`;
    }
    // A seated paw or foot is its ellipse, drawn in its own seated frame (origin at its center, +x toward the center
    // line); as the friend rises, that frame moves, turns and stretches until the ellipse is the standing paw or foot.
    // Extras marked `sole`, which face us only while it sits, flatten toward its lower edge.
    const f = at.fold, mix = (a, b) => a + (b - a) * f;
    for (const [end, kind] of [['paw', 'arms'], ['foot', 'legs']]) for (const S of ['L', 'R']) {
      const seated = seat[end][S];
      if (!seated) continue;
      const to = ellipse(stand[kind][S][end]), rx = mix(to.rx, seated.rx), ry = mix(to.ry, seated.ry);
      transform[`${end}${S}seat`] = `translate(${num(mix(to.cx, 0))} ${num(mix(to.cy, 0))}) rotate(${num(mix(to.rot / DEG, seated.rot))})` +
        ` scale(${num(rx / seated.rx)} ${num(ry / seated.ry)}) rotate(${num(-seated.rot)})`;
      const r = seated.rot * DEG, low = Math.hypot(seated.rx * Math.sin(r), seated.ry * Math.cos(r));
      transform[`${end}${S}sole`] = `translate(0 ${num(low)}) scale(1 ${num(f)}) translate(0 ${num(-low)})`;
    }
    const state = { key, transform, paths, tuck, paws };
    limbMemo.set(stand, state);
    return state;
  }

  // The transforms, opacities and states that a pose gives a spec's parts, and for a friend with limbs their
  // outlines (paths).
  function poseState(spec, pose) {
    const p = { ...POSE, ...(pose || {}) }, rig = spec.rig || {};
    const stand = standFor(spec), at = stanceFor(stand, p), q = foldedPose(p, at);
    const turn = rig.turn ?? 14;
    const tx = p.turnX * turn, ty = p.turnY * turn * 0.7;
    const par = z => `translate(${num(tx * z)} ${num(ty * z)})`;
    const ground = groundOf(spec);
    const t = {
      root: `translate(${num(p.x)} ${num(p.y)}) translate(0 ${ground}) scale(${num(1 - p.squash * 0.5)} ${num(1 + p.squash)}) translate(0 ${-ground})` +
        (stand ? ` translate(0 ${num(-stand.lift)})` : ''),
      // The upper body of a friend with limbs (its body, arms, head and tail) drops with crouch, all the way down while
      // it sits, and leans about the hips.
      upper: stand ? `translate(0 ${num(at.crouch)}) rotate(${num(q.lean)} ${stand.hips[0]} ${stand.hips[1]})` : '',
      ...headTransforms(spec, p, par),
    };
    if (spec.tail) t.tail = `${t.upper} ${par(DEPTH.tail)} ${tailPlace(tailAt(spec, stand, at), p.tail)}`.trim();
    for (const s of ['L', 'R']) if (earFor(spec, s).inner?.front) t[`ear${s}front`] = t[`ear${s}`];
    const paths = {}, shade = {};
    if (stand) {
      for (const k of ['legs', 'armsUnder', 'pawsUnder', 'armsOver']) t[k] = par(DEPTH.body);
      const limbs = limbStateFor(stand, q, at);
      Object.assign(t, limbs.transform);
      Object.assign(paths, limbs.paths);
      for (const S of ['L', 'R']) t[`tuck${S}`] = `${par(DEPTH.body)} ${limbs.tuck[S]}`;
      // The feet lie in front of the body, inside the upper body's group, so they undo its crouch and lean.
      if (stand.seat.front) t.feet = `rotate(${num(-q.lean)} ${stand.hips[0]} ${stand.hips[1]}) translate(0 ${num(-at.crouch)}) ${par(DEPTH.body)}`;
      // Each arm and its paw show their house shades by as much as the paw has come in front of the head (drawLimbs).
      for (const S of ['L', 'R']) shade[`arm${S}Shade`] = shade[`paw${S}Shade`] = num(inFrontOfHead(spec, limbs.paws[S], stand.arms[S].paw, p));
    }
    const mouth = p.mouth || (spec.mouth && spec.mouth.shape) || 'none';
    return {
      transform: t,
      // How strongly the arms tuck under the scarf and the head (see render): not at all while the friend sits, when its
      // arms hang in front of it, and fully once it is halfway up, so that they slide under as it rises.
      opacity: { blush: num(p.blush), ...(stand ? { tuckInk: num(Math.min(1, at.up * 2)) } : {}), ...shade },
      // Whether the arms take the tuck at all: only once the friend has risen.
      state: { eyeL: p.eyeL || p.eyes, eyeR: p.eyeR || p.eyes, mouth, show: shownBy(p.show), over: shownBy(p.over), tucked: at.up > 0 },
      paths,
    };
  }

  // A figure folded toward sitting takes only part of the pose's lean and limb movements, and none while it sits.
  function foldedPose(p, at) {
    if (!at.fold) return p;
    const q = { ...p };
    for (const f of LIMB_FIELDS) q[f] = (p[f] || 0) * (1 - at.fold);
    return q;
  }

  // How far a paw at [x, y] (in the upper body's space, as limbStateFor places it) has come in front of the head: 0 while
  // it is a paw's breadth or more outside the head and the face, 1 once it is as far inside either, and between the
  // two as it crosses their edge. The head's nod and tilt are undone first, so that the paw is measured against the
  // head where the pose has put it.
  function inFrontOfHead(spec, [x, y], paw, p) {
    const neck = (spec.rig || {}).neck || [0, 50], r = Math.max(paw.rx ?? 0, paw.ry ?? paw.rx ?? 0) || 10;
    const [u, v] = rot(x - (p.headX || 0) - neck[0], y - (p.headY || 0) - neck[1], -(p.tilt || 0) * DEG);
    let inside = -Infinity;  // How far inside the head or the face the paw's center is (negative: outside)
    for (const shape of [spec.head, spec.face]) {
      if (!shape) continue;
      const e = ellipse(shape), [dx, dy] = rot(u + neck[0] - e.cx, v + neck[1] - e.cy, -e.rot), d = Math.hypot(dx / e.rx, dy / e.ry);
      inside = Math.max(inside, d < 1e-9 ? Infinity : Math.hypot(dx, dy) * (1 / d - 1));
    }
    return Math.min(1, Math.max(0, (inside + r) / (2 * r)));
  }

  // The head's transforms: its tilt and nod, and each of its layers, which slide by their depth (par) as it turns.
  function headTransforms(spec, p, par) {
    const neck = (spec.rig || {}).neck || [0, 50];
    const eye = { ...EYE_DEFAULT, ...(spec.eyes || {}) };
    const lx = p.lookX * eye.range, ly = p.lookY * eye.range * 0.8;
    const k = Math.max(0.2, 1 + p.widen), eyeOpen = `scale(${num(k)} ${num(k * Math.max(0.06, 1 - p.blink))})`;
    const hc = spec.hair ? [spec.hair.cx || 0, spec.hair.cy || 0] : [0, 0];
    const t = {
      head: `${p.headX || p.headY ? `translate(${num(p.headX)} ${num(p.headY)}) ` : ''}rotate(${num(p.tilt)} ${neck[0]} ${neck[1]})`,
      earL: `${par(DEPTH.earL)} ${earPlace(earFor(spec, 'L'), 'L', p.earL)}`,
      earR: `${par(DEPTH.earR)} ${earPlace(earFor(spec, 'R'), 'R', p.earR)}`,
      eyeL: `translate(${num(-eye.x + lx)} ${num(eye.y + ly)})`,
      eyeR: `translate(${num(eye.x + lx)} ${num(eye.y + ly)})`,
      eyeLopen: eyeOpen,
      eyeRopen: eyeOpen,
      lidL: lidPlace(eye, p, 1),
      lidR: lidPlace(eye, p, -1),
      hair: `${par(DEPTH.hair)} rotate(${num(p.hair)} ${hc[0]} ${hc[1]})`,
    };
    for (const k of ['body', 'face', 'blush', 'eyes', 'mouth']) t[k] = par(DEPTH[k]);
    t.scarf = t.body;
    if (spec.blush) {
      const { x, y } = spec.blush, k = num(Math.max(0, 1 + p.flush));
      t.cheekL = `translate(${num(-x)} ${num(y)}) scale(${k}) translate(${num(x)} ${num(-y)})`;
      t.cheekR = `translate(${num(x)} ${num(y)}) scale(${k}) translate(${num(-x)} ${num(-y)})`;
    }
    return t;
  }

  // Where the tail is: where the seated drawing has it, or, for a tail with a standing place of its own (stand.tail),
  // part of the way toward that place as the friend rises.
  function tailAt(spec, stand, at) {
    const seated = tailFor(spec), tail = stand && stand.tail ? { ...seated, ...stand.tail } : seated;
    if (tail !== seated && at.up < 1) {
      const mix = (a, b) => a + (b - a) * at.up;
      tail.base = seated.base.map((v, i) => mix(v, tail.base[i]));
      tail.angle = mix(seated.angle || 0, tail.angle || 0);
    }
    return tail;
  }

  // The names in a pose's `show`, as a set.
  function shownBy(show) {
    return new Set(typeof show === 'string' ? show.split(/\s+/).filter(Boolean) : []);
  }

  // ---------------------------------------------------------------- Render

  // Portrait view: fits the whole character (ear tips ~ -145 .. paws ~ +132, tail to
  // ~ -150 at full wag) in a square, with a margin for hops and stretches.
  const DEFAULT_VIEW = { w: 512, h: 512, x: 256, y: 266, scale: 1.6, rotate: 0 };
  // The standing portrait, the view named 'stand' unless a spec has its own: the friend standing, smaller, so
  // that the ears of the taller figure stay in the square.
  const STAND_VIEW = { y: 300, scale: 1.4, pose: { stance: 'stand' } };
  let UID = 0;

  // The pencil (FWIENDS.md): every character is colored in with colored pencil and has no outline.
  // A mask over the whole drawing lets the paper show through in three ways: diagonal strokes, the
  // paper's fine tooth, and patches where the hand pressed more lightly. The mask is measured in the
  // picture's own units, not head units, because the pencil is the same size however large the
  // drawing is; the gallery draws at about one unit to the pixel. It sits outside the camera, so the
  // strokes keep their angle when a view tips the head, and it stays put while the character moves,
  // as the paper would. It is an image; a live rig swaps it for a bitmap (see pencilBitmap).
  const PENCIL = {
    angle: -40,              // The strokes rise to the right, as a right hand shades.
    margin: 0.5,             // The mask reaches this fraction of the view past each edge, for ears and tails.
    paper: '#fbf9f3',        // The paper of site/notebook.css, laid under a character drawn on a background of its own.
    variants: 3,             // How many variants of the texture a boiling page cycles through.
  };
  // The texture's three noises, in the order in which they are mixed: the strokes, streaky noise long
  // along a stroke and fine across it; the paper's tooth; and the pressure, whose lighter patches are
  // this large. Each has a base frequency (along the stroke, across it), a number of octaves, a weight
  // in the mix and a seed ([seed of variant 0, step per variant]). The mix becomes the alpha that keeps
  // the color: slope * mix + offset.
  const PENCIL_NOISES = [
    { name: 'strokes', frequency: [0.035, 0.9], octaves: 2, weight: 0.6, seed: [11, 17] },
    { name: 'tooth', frequency: [1.2, 1.2], octaves: 1, weight: 0.25, seed: [7, 13] },
    { name: 'pressure', frequency: [0.02, 0.02], octaves: 2, weight: 0.35, seed: [4, 5] },
  ];
  const PENCIL_ALPHA = { slope: -3, offset: 2.7 };
  const pencilTextures = new Map();

  // The texture for a sheet (x, y, w, h), as an SVG image. Its filter mixes the three noises (the
  // strokes and the tooth, then the pressure) and turns the mix into an alpha that keeps most of the
  // color, so that the paper shows only in specks and streaks. The rectangle is turned to the stroke
  // angle and reaches past the sheet's farthest corner. Views of one size share one image.
  // Variant 0 is the texture every still uses; other variants reseed the noises, so that a page can
  // redraw the texture a few times a second, as hand-drawn animation does ("boil": rig.setTexture,
  // film/scene.js).
  function pencilTexture(x, y, w, h, variant = 0) {
    const box = [x, y, w, h].join(' '), key = `${box} ${variant}`;
    if (!pencilTextures.has(key)) {
      const reach = Math.hypot(Math.abs(x) + w, Math.abs(y) + h);
      const [strokes, tooth, pressure] = PENCIL_NOISES;
      const noise = ({ name, frequency: [along, across], octaves, seed: [seed, step] }) =>
        `<feTurbulence type='fractalNoise' baseFrequency='${along === across ? along : `${along} ${across}`}' ` +
        `numOctaves='${octaves}' seed='${seed + step * variant}' result='${name}'/>`;
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='${box}' width='${w}' height='${h}'>` +
        `<filter id='p' x='0' y='0' width='1' height='1' color-interpolation-filters='sRGB'>` +
        PENCIL_NOISES.map(noise).join('') +
        `<feComposite in='strokes' in2='tooth' operator='arithmetic' k2='${strokes.weight}' k3='${tooth.weight}' result='grain'/>` +
        `<feComposite in='grain' in2='pressure' operator='arithmetic' k2='1' k3='${pressure.weight}' result='mix'/>` +
        `<feColorMatrix in='mix' type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${PENCIL_ALPHA.slope} ${PENCIL_ALPHA.offset}' result='alpha'/>` +
        `<feComposite in='SourceGraphic' in2='alpha' operator='in'/></filter>` +
        `<rect x='${-reach}' y='${-reach}' width='${2 * reach}' height='${2 * reach}' fill='#fff' filter='url(#p)' transform='rotate(${PENCIL.angle})'/></svg>`;
      // Encoded, so that the render stays well-formed XML when it is saved or shown as a standalone SVG.
      pencilTextures.set(key, `data:image/svg+xml,${encodeURIComponent(svg)}`);
    }
    return pencilTextures.get(key);
  }

  // A browser draws the texture's noise again whenever the drawing under it changes, which for a live
  // rig is every frame, and on a phone that is most of the frame's work. So mount() swaps the texture
  // for a bitmap of it, made once at the density at which the rig is shown (device pixels per unit,
  // rounded up to a step) and again if the rig grows. The bitmap's noise is computed here rather than
  // drawn from the texture's filter, since Safari drew the filter into a canvas in one piece that held
  // the page up for seconds; it is computed a slice of rows at a time, no slice longer than `slice`
  // milliseconds, so that the page stays responsive meanwhile, and one bitmap at a time, in the order
  // in which they are asked for, so that the one a rig shows first arrives first. The bitmap is gray
  // on black, which masks as the white texture does, so that it can be a JPEG, which is quick to
  // encode. Rigs whose views are the same size share one bitmap per density and variant. A browser
  // that cannot make the bitmap keeps the texture.
  const BITMAP = { step: 0.5, maxDensity: 4, maxPixels: 4096, quality: 0.92, slice: 8 };
  const pencilBitmaps = new Map();
  let bitmapQueue = Promise.resolve();
  // For each texture image of a live rig: the variant it is to show, the density of its bitmap (0
  // until it has one) and the density of the bitmap it shows.
  const textureStates = new WeakMap();

  // The bitmap of a variant of the texture for a sheet (x, y, w, h) at a density, as a promise of a blob URL.
  function pencilBitmap(x, y, w, h, density, variant = 0) {
    const key = [x, y, w, h, density, variant].join(' ');
    if (!pencilBitmaps.has(key)) {
      const bitmap = bitmapQueue.then(() => drawBitmap(x, y, w, h, density, variant));
      bitmapQueue = bitmap.catch(() => {});
      pencilBitmaps.set(key, bitmap);
    }
    return pencilBitmaps.get(key);
  }

  // Computes a variant of the texture as a browser draws pencilTexture's filter: on a grid in the
  // turned rectangle's frame, a point every 1/density units, from which each pixel is then read
  // between its four nearest points. Reading the grid rather than the noise itself softens the
  // finest grain as much as the browser's drawing does.
  async function drawBitmap(x, y, w, h, density, variant) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(w * density);
    canvas.height = Math.ceil(h * density);
    const context = canvas.getContext('2d'), pixels = context.createImageData(canvas.width, canvas.height);
    const noises = PENCIL_NOISES.map(noise => ({ ...noise, ...turbulenceTables(noise.seed[0] + noise.seed[1] * variant) }));
    let sliceStart = performance.now();
    const yieldEverySlice = async () => {
      if (performance.now() - sliceStart < BITMAP.slice) return;
      await new Promise(resolve => setTimeout(resolve));
      sliceStart = performance.now();
    };
    // The rectangle's frame: `along` the strokes and `across` them, turned by PENCIL.angle from the sheet's.
    const cos = Math.cos(-PENCIL.angle * DEG), sin = Math.sin(-PENCIL.angle * DEG);
    const corners = [[x, y], [x + w, y], [x, y + h], [x + w, y + h]];
    const alongs = corners.map(([cx, cy]) => cx * cos - cy * sin), acrosses = corners.map(([cx, cy]) => cx * sin + cy * cos);
    const firstColumn = Math.floor(Math.min(...alongs) * density) - 1, firstRow = Math.floor(Math.min(...acrosses) * density) - 1;
    const columns = Math.ceil(Math.max(...alongs) * density) + 2 - firstColumn, rows = Math.ceil(Math.max(...acrosses) * density) + 2 - firstRow;
    const grid = new Uint8ClampedArray(columns * rows);
    for (let row = 0; row < rows; row++) {
      await yieldEverySlice();
      const across = (firstRow + row) / density;
      for (let column = 0; column < columns; column++) grid[row * columns + column] = 255 * pencilAlpha(noises, (firstColumn + column) / density, across);
    }
    for (let row = 0; row < canvas.height; row++) {
      await yieldEverySlice();
      const sheetY = y + ((row + 0.5) * h) / canvas.height;
      for (let column = 0; column < canvas.width; column++) {
        const sheetX = x + ((column + 0.5) * w) / canvas.width;
        const u = (sheetX * cos - sheetY * sin) * density - firstColumn, v = (sheetX * sin + sheetY * cos) * density - firstRow;
        const u0 = Math.floor(u), v0 = Math.floor(v), k = v0 * columns + u0;
        const value = lerp(v - v0, lerp(u - u0, grid[k], grid[k + 1]), lerp(u - u0, grid[k + columns], grid[k + columns + 1]));
        const i = 4 * (row * canvas.width + column);
        pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = value;
        pixels.data[i + 3] = 255;
      }
    }
    context.putImageData(pixels, 0, 0);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', BITMAP.quality));
    canvas.width = canvas.height = 0;  // Frees the canvas now; Safari limits the memory that canvases hold.
    if (!blob) throw new Error('the pencil texture could not be drawn as a bitmap');
    return URL.createObjectURL(blob);
  }

  // The noise of feTurbulence as the SVG 1.1 specification's reference code computes it, which the
  // browsers follow: a Perlin noise whose lattice and gradients come from a seeded Park-Miller
  // generator. Only the alpha channel, the fourth, is kept, since the texture uses no other.
  const TURBULENCE = { size: 256, offset: 4096, modulus: 2147483647, multiplier: 16807, quotient: 127773, remainder: 2836 };

  // The lattice and the alpha channel's gradients for a seed.
  function turbulenceTables(seed) {
    const { size, modulus, multiplier, quotient, remainder } = TURBULENCE;
    const random = () => {
      seed = multiplier * (seed % quotient) - remainder * Math.trunc(seed / quotient);
      if (seed <= 0) seed += modulus;
      return seed;
    };
    seed = Math.trunc(seed);
    if (seed <= 0) seed = -(seed % (modulus - 1)) + 1;
    if (seed > modulus - 1) seed = modulus - 1;
    const lattice = new Int32Array(2 * size + 2);
    let gradient;
    for (let channel = 0; channel < 4; channel++) {  // Every channel draws its gradients, so that the generator reaches alpha's.
      gradient = new Float64Array(2 * (2 * size + 2));
      for (let i = 0; i < size; i++) {
        lattice[i] = i;
        const gx = ((random() % (2 * size)) - size) / size, gy = ((random() % (2 * size)) - size) / size;
        const length = Math.hypot(gx, gy) || 1;
        gradient[2 * i] = gx / length;
        gradient[2 * i + 1] = gy / length;
      }
    }
    for (let i = size - 1; i > 0; i--) {
      const j = random() % size;
      [lattice[i], lattice[j]] = [lattice[j], lattice[i]];
    }
    for (let i = 0; i < size + 2; i++) {
      lattice[size + i] = lattice[i];
      gradient[2 * (size + i)] = gradient[2 * i];
      gradient[2 * (size + i) + 1] = gradient[2 * i + 1];
    }
    return { lattice, gradient };
  }

  // The texture's alpha at a point in its rectangle's frame: the noises mixed as pencilTexture's filter mixes them.
  function pencilAlpha([strokes, tooth, pressure], along, across) {
    const clamp = v => Math.min(1, Math.max(0, v));
    const grain = clamp(strokes.weight * fractalNoise(strokes, along, across) + tooth.weight * fractalNoise(tooth, along, across));
    const mix = clamp(grain + pressure.weight * fractalNoise(pressure, along, across));
    return clamp(PENCIL_ALPHA.slope * mix + PENCIL_ALPHA.offset);
  }

  // Fractal noise at a point, from 0 to 1: octaves of noise, each at twice the frequency and half the weight.
  function fractalNoise({ lattice, gradient, frequency, octaves }, x, y) {
    let sum = 0, vx = x * frequency[0], vy = y * frequency[1], weight = 1;
    for (let octave = 0; octave < octaves; octave++) {
      sum += perlinNoise(lattice, gradient, vx, vy) / weight;
      vx *= 2;
      vy *= 2;
      weight *= 2;
    }
    return Math.min(1, Math.max(0, (sum + 1) / 2));
  }

  function perlinNoise(lattice, gradient, x, y) {
    const tx = x + TURBULENCE.offset, ty = y + TURBULENCE.offset, ix = Math.trunc(tx), iy = Math.trunc(ty);
    const bx0 = ix & 0xff, bx1 = (bx0 + 1) & 0xff, by0 = iy & 0xff, by1 = (by0 + 1) & 0xff;
    const rx0 = tx - ix, rx1 = rx0 - 1, ry0 = ty - iy, ry1 = ry0 - 1;
    const i = lattice[bx0], j = lattice[bx1];
    const b00 = 2 * lattice[i + by0], b10 = 2 * lattice[j + by0], b01 = 2 * lattice[i + by1], b11 = 2 * lattice[j + by1];
    const sx = rx0 * rx0 * (3 - 2 * rx0), sy = ry0 * ry0 * (3 - 2 * ry0);
    const top = lerp(sx, rx0 * gradient[b00] + ry0 * gradient[b00 + 1], rx1 * gradient[b10] + ry0 * gradient[b10 + 1]);
    const bottom = lerp(sx, rx0 * gradient[b01] + ry1 * gradient[b01 + 1], rx1 * gradient[b11] + ry1 * gradient[b11 + 1]);
    return lerp(sy, top, bottom);
  }

  function lerp(t, a, b) {
    return a + t * (b - a);
  }

  // Gives a mounted drawing's texture a bitmap dense enough for the width (in CSS pixels) at which it is shown.
  function sharpenTexture(svg, width) {
    const image = svg.querySelector('image[data-pf-texture]'), units = svg.viewBox.baseVal.width;
    if (!image || !width || !units) return;
    const [, , w, h] = sheetOf(image), state = textureStateOf(image);
    const wanted = Math.ceil(((width / units) * (self.devicePixelRatio || 1)) / BITMAP.step) * BITMAP.step;
    const density = Math.min(wanted, BITMAP.maxDensity, BITMAP.maxPixels / Math.max(w, h));
    if (density <= state.density) return;
    state.density = density;
    showBitmap(image);
  }

  // Sets the variant of the texture that a live rig's image shows: as a bitmap where the rig has one
  // (bitmap), and otherwise as the texture itself.
  function setTextureVariant(image, variant, bitmap) {
    const state = textureStateOf(image);
    if (variant === state.variant) return;
    state.variant = variant;
    if (!bitmap) image.setAttribute('href', pencilTexture(...sheetOf(image), variant));
    else if (state.density) showBitmap(image);
  }

  // Shows the image's variant at its density once that bitmap is ready. Until then the image keeps what
  // it shows, unless it shows no bitmap at that density yet, in which case the first to arrive is shown.
  function showBitmap(image) {
    const state = textureStateOf(image), { variant, density } = state;
    pencilBitmap(...sheetOf(image), density, variant).then(url => {
      if (state.density !== density || (state.variant !== variant && state.shown === density)) return;
      image.setAttribute('href', url);
      state.shown = density;
    }, () => {});  // The texture stays as it was.
  }

  function textureStateOf(image) {
    if (!textureStates.has(image)) textureStates.set(image, { variant: 0, density: 0, shown: 0 });
    return textureStates.get(image);
  }

  // The sheet (x, y, w, h) that a texture image covers.
  function sheetOf(image) {
    return ['x', 'y', 'width', 'height'].map(name => +image.getAttribute(name));
  }

  // Watches the size of every mounted drawing, and forgets a drawing once it leaves the page.
  const textureWatch = typeof ResizeObserver === 'function' && new ResizeObserver(entries => {
    for (const { target, contentRect } of entries) {
      if (target.isConnected) sharpenTexture(target, contentRect.width);
      else textureWatch.unobserve(target);
    }
  });

  // A sheet of paper cut to the character's outline, for a render with a background of its own: the
  // pencil lets paper through, never the background (STYLE.md §4, on a dark host).
  function paperSheet(id) {
    return `<filter id="${id}" x="-10%" y="-10%" width="120%" height="120%">` +
      `<feFlood flood-color="${PENCIL.paper}"/><feComposite in2="SourceAlpha" operator="in"/></filter>`;
  }

  // The mask that holds the texture over a view: white keeps the color and transparent lets the paper through.
  function pencilMask(id, view) {
    const x = num(-view.w * PENCIL.margin), y = num(-view.h * PENCIL.margin);
    const w = num(view.w * (1 + 2 * PENCIL.margin)), h = num(view.h * (1 + 2 * PENCIL.margin));
    return `<mask id="${id}" maskUnits="userSpaceOnUse" x="${x}" y="${y}" width="${w}" height="${h}">` +
      `<image data-pf-texture="" href="${pencilTexture(x, y, w, h)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"/></mask>`;
  }

  // Content under the pencil mask. Safari masks each shape of a group on its own rather than the group
  // as drawn, so wherever the pencil lets the paper through, the shapes underneath show through too
  // (the body under a white chest, the shade layer under a face), and a boiling texture makes them
  // flicker. An isolated group inside the masked one is drawn whole first, in every browser; isolating
  // the masked group itself does not help.
  function penciled(maskId, inner) {
    return `<g mask="url(#${maskId})"><g style="isolation:isolate">${inner}</g></g>`;
  }

  // Draws any SVG content (in a viewBox of 0 0 w h) in the same pencil as the characters, for props
  // that share a scene with them. Returns an SVG string.
  function pencilSVG(inner, { w, h, uid = `pf${(++UID).toString(36)}`, flat = false } = {}) {
    const open = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${num(w)} ${num(h)}" data-pf-uid="${uid}">`;
    if (flat) return `${open}${inner}</svg>`;
    return `${open}<defs>${pencilMask(`${uid}-pencil`, { w, h })}</defs>${penciled(`${uid}-pencil`, inner)}</svg>`;
  }

  // The standing view: a square box `box` head units a side whose bottom edge is the friend's ground
  // (groundOf), so that friends drawn in it stand on one line at one scale. The gallery's box and a
  // scene's cut-out are 270 head units, five rules (FWIENDS.md).
  const STANDING_BOX = 270;
  function standingView(specOrName, box = STANDING_BOX) {
    return { w: box, h: box, x: box / 2, y: box - groundOf(specOrName), scale: 1, rotate: 0 };
  }

  function resolveView(spec, v, size) {
    const views = spec.views || {};
    const base = { ...DEFAULT_VIEW, ...(views.portrait || {}) };
    const named = name => views[name] || (name === 'stand' ? STAND_VIEW : {});
    const out = typeof v === 'string' ? { ...base, ...named(v) } : { ...base, ...(v || {}) };
    if (size) {
      const k = size / out.w;
      Object.assign(out, { w: size, h: Math.round(out.h * k), x: out.x * k, y: out.y * k, scale: out.scale * k });
    }
    return out;
  }

  // Eye strokes take the eye's w and h, a = the half-span as a fraction of w (eyes.arc),
  // and d = 1 for the left eye or -1 for the right ('squint' points inward: > <).
  const EYE_STROKES = {
    happy: (w, h, a) => `M${num(-w * a)} ${num(h * 0.12)}Q0 ${num(-h * 0.42)} ${num(w * a)} ${num(h * 0.12)}`,
    closed: (w, h, a) => `M${num(-w * a)} ${num(-h * 0.08)}Q0 ${num(h * 0.3)} ${num(w * a)} ${num(-h * 0.08)}`,
    squint: (w, h, a, d) => `M${num(-d * w * a * 0.8)} ${num(-h * 0.26)}L${num(d * w * a * 0.7)} 0L${num(-d * w * a * 0.8)} ${num(h * 0.26)}`,
  };
  const MOUTHS = {
    w: s => `M${-s} ${-s * 0.3}Q${-s * 0.5} ${s * 0.7} 0 ${-s * 0.1}Q${s * 0.5} ${s * 0.7} ${s} ${-s * 0.3}`,
    smile: s => `M${-s} ${-s * 0.2}Q0 ${s * 0.9} ${s} ${-s * 0.2}`,
    frown: s => `M${-s * 0.9} ${s * 0.35}Q0 ${-s * 0.6} ${s * 0.9} ${s * 0.35}`,
    v: s => `M${-s * 0.6} ${-s * 0.3}L0 ${s * 0.4}L${s * 0.6} ${-s * 0.3}`,
    o: s => `M0 ${-s * 0.5}a${s * 0.45} ${s * 0.55} 0 1 0 0.01 0Z`,
  };

  // A render draws the friend part by part, from the back: the tail, the legs, then the upper body (the body, the feet
  // that lie in front of it, the scarf, the head and the arms), then the props on the ground. Each part has a drawer
  // of its own, and the drawers share a context (renderContext); each one adds what it defines (clips, masks, filters)
  // to the context's defs, in the order in which render calls it.
  function render(specOrName, opts = {}) {
    const ctx = renderContext(resolve(specOrName), opts), { spec, g, part } = ctx;
    const eye = eyeDrawer(ctx), mouth = drawMouth(ctx), blush = drawBlush(ctx);
    const head = drawHead(ctx, { eye, mouth, blush });
    const body = g('body', drawBody(ctx));
    const limbs = drawLimbs(ctx);
    const upper = drawUpper(ctx, { body, head, limbs });
    return drawSheet(ctx, opts, drawTail(ctx) + limbs.legs + upper);
  }

  // What every drawer of one render shares: the spec, its view and the state of its pose, the palette with its shades,
  // the defs, and the helpers that draw a named part, a shape in a color, and a part's extras.
  function renderContext(spec, opts) {
    const uid = opts.uid || `pf${(++UID).toString(36)}`;
    const view = resolveView(spec, opts.view, opts.size);
    // A view may carry the pose its reference was drawn in; opts.pose overrides that pose.
    const st = poseState(spec, view.pose ? { ...view.pose, ...opts.pose } : opts.pose);
    const P = withShades(spec.palette || {});
    const col = c => (c && P[c]) || c || '#000';
    const seed = part => hash(`${spec.name || ''}/${part}`);
    const defs = [];

    const attrs = name => {
      let a = ` data-pf="${name}"`;
      if (st.transform[name]) a += ` transform="${st.transform[name]}"`;
      if (st.opacity[name] !== undefined) a += ` opacity="${st.opacity[name]}"`;
      return a;
    };
    const g = (name, inner, id) => `<g${id ? ` id="${uid}-${id}"` : ''}${attrs(name)}>${inner}</g>`;
    const when = (key, val, inner) =>
      `<g data-pf-when="${key}=${val}"${st.state[key] === val ? '' : ' display="none"'}>${inner}</g>`;
    // A clip is defined once for each name and outline, however many times a render asks for it.
    const clips = new Map();
    const clipUrl = (id, d) => {
      const key = `${id}\n${d}`;
      if (!clips.has(key)) {
        defs.push(`<clipPath id="${uid}-${id}"><path d="${d}"/></clipPath>`);
        clips.set(key, `url(#${uid}-${id})`);
      }
      return clips.get(key);
    };
    // An extra that names a `show` is drawn only while the pose's show lists that name: a prop, or a
    // side of the figure that a turn reveals.
    const cue = (x, s) => (x.show ? `<g data-pf-show="${x.show}"${st.state.show.has(x.show) ? '' : ' display="none"'}>${s}</g>` : s);

    // The helpers that draw in a set of colors (paint): a shape in a color, an extra, a part's extras, and a part.
    const drawers = paint => {
      const fill = (d, c, extra = '') => `<path d="${d}" fill="${paint(c)}"${extra}/>`;
      const extraShape = (x, i, part) => {
        if (x.kind === 'ellipse') {
          const e = ellipse(x);
          return `<ellipse cx="${num(e.cx)}" cy="${num(e.cy)}" rx="${num(e.rx)}" ry="${num(e.ry)}"` +
            `${x.rot ? ` transform="rotate(${x.rot} ${num(e.cx)} ${num(e.cy)})"` : ''} fill="${paint(x.fill)}"/>`;
        }
        return fill(shapeD(x, seed(`${part}/extra${i}`)), x.fill);
      };
      const extras = (part, clip, under, keep = () => true) => {
        const out = [];
        (spec.extras || []).forEach((x, i) => {
          // An extra on 'ears', 'paws' or 'feet' is drawn on both (the right one's space is mirrored).
          const on = BOTH[x.on] && BOTH[x.on].includes(part) ? part : x.on;
          if (on !== part || !!x.under !== under || !keep(x)) return;
          const s = extraShape(x, i, part);
          out.push(cue(x, x.clip && clip ? `<g clip-path="${clip}">${s}</g>` : s));
        });
        return out.join('');
      };
      // A part is an optional main shape plus its extras; clipped extras stay inside the main shape.
      const part = (name, shape, color) => {
        if (!shape) return extras(name, null, true) + extras(name, null, false);
        const d = shapeD(shape, seed(name));
        const clip = clipUrl(name, d);
        return extras(name, clip, true) + fill(d, shape.color || color) + extras(name, clip, false);
      };
      return { col: paint, fill, extraShape, extras, part };
    };
    // The palette's colors, and each one's house shade (shadeOf), in which a paw raised in front of the head is drawn.
    const shades = new Map();
    const shaded = c => {
      const hex = col(c);
      if (!isHex(hex)) return hex;
      if (!shades.has(hex)) shades.set(hex, shadeOf(hex));
      return shades.get(hex);
    };
    return { spec, uid, view, st, P, seed, defs, attrs, g, when, clipUrl, cue, ...drawers(col), shade: drawers(shaded) };
  }

  // The head: its layers from the back (the ears, the head, the inner ears that lie in front of it, any ear drawn over
  // it, then the face and what lies on it), in a group that the body's tuck mask can refer to.
  function drawHead(ctx, { eye, mouth, blush }) {
    const { spec, g, part } = ctx;
    const layers = {
      earL: () => drawEar(ctx, 'L'),
      earR: () => drawEar(ctx, 'R'),
      earLfront: () => drawEarFront(ctx, 'L'),
      earRfront: () => drawEarFront(ctx, 'R'),
      base: () => g('base', part('base', spec.head, roleOr(spec, 'head', 'fur'))),
      face: () => g('face', part('face', spec.face, 'face')),
      blush: () => g('blush', blush + ctx.extras('blush', null, false)),
      eyes: () => g('eyes', eye('L') + eye('R')),
      mouth: () => g('mouth', mouth),
      hair: () => g('hair', part('hair', spec.hair, 'hair')),
    };
    const earsOver = over => ['earL', 'earR'].filter(k => !!earFor(spec, k.slice(-1)).over === over);
    const order = [...earsOver(false), 'base', 'earLfront', 'earRfront', ...earsOver(true), 'face', 'blush', 'eyes', 'mouth', 'hair'];
    return g('head', order.map(k => layers[k]()).join(''), 'head');
  }

  // Ears. The inner ear goes in its own layer when it sits in front of the head.
  function drawInnerEar(ctx, e) {
    const k = e.inner.scale ?? 0.6, dx = e.inner.dx || 0, dy = e.inner.dy || 0;
    return ctx.fill(pathD(earNodes({ ...e, ...e.inner }).map(n => ({ ...n, x: n.x * k + dx, y: n.y * k + dy }))), e.inner.color || 'earInner');
  }
  function drawEarFront(ctx, side) {
    const e = earFor(ctx.spec, side);
    return e.inner && e.inner.front ? ctx.g(`ear${side}front`, drawInnerEar(ctx, e)) : '';
  }
  function drawEar(ctx, side) {
    const { spec, fill, g, clipUrl, extras } = ctx;
    const e = earFor(spec, side), outer = earNodes(e), d = pathD(outer);
    const clip = clipUrl(`ear${side}`, d);
    const inner = e.inner && !e.inner.front ? drawInnerEar(ctx, e) : '';
    const stripes = (e.stripes || []).map(s => {
      const [X0, X1] = s.span || [-e.width * 1.5, e.width * 1.5];
      const h = (s.w || 6) / 2, cy = -(s.t ?? 0.5) * e.length, b = s.b || 0;
      const nodes = [[X0, -h], [X1, -h], [X1, h], [X0, h]].map(([x, y], i) => {
        const [rx, ry] = rot(x, y, (s.a || 0) * DEG);
        return { x: rx, y: ry + cy, c: true, b: i === 0 ? b : i === 2 ? -b : 0 };
      });
      return fill(pathD(nodes), s.color || e.stripeColor || 'stripe');
    }).join('');
    // The right ear takes its own color, then its role (earRight), before the pair's, as the right eye and paw do.
    const ears = spec.ears || {}, pair = ears.color || roleOr(spec, 'ear', 'fur');
    const color = side === 'R' ? (ears.right && ears.right.color) || roleOr(spec, 'earRight', pair) : pair;
    return g(`ear${side}`, extras(`ear${side}`, null, true) + fill(d, color) + (stripes && `<g clip-path="${clip}">${stripes}</g>`) +
      inner + extras(`ear${side}`, clip, false));
  }

  // Eyes. `shine` is one highlight or a list of marks drawn in order and
  // clipped to the eye, each a circle (r) or an ellipse (rx, ry): e.g., an
  // iris, then a lighter crescent visible at the bottom, then a white highlight.
  // The drawer defines the clip that the shine shares, and returns the drawer of either eye.
  function eyeDrawer(ctx) {
    const { spec, uid, st, col, g, when, clipUrl, defs } = ctx;
    const eye = { ...EYE_DEFAULT, ...(spec.eyes || {}) };
    let eyeClip = '';
    if (eye.shine || (eye.right && eye.right.shine)) {
      const { w, h } = eye, r = Math.min(w, h) / 2, round = eye.shape === 'dot' || eye.shape === 'round';
      eyeClip = clipUrl('eye', round
        ? `M${num(-w / 2)} 0A${num(w / 2)} ${num(h / 2)} 0 1 1 ${num(w / 2)} 0A${num(w / 2)} ${num(h / 2)} 0 1 1 ${num(-w / 2)} 0Z`
        : `M${num(-w / 2)} ${num(-h / 2 + r)}A${num(r)} ${num(r)} 0 0 1 ${num(w / 2)} ${num(-h / 2 + r)}V${num(h / 2 - r)}` +
          `A${num(r)} ${num(r)} 0 0 1 ${num(-w / 2)} ${num(h / 2 - r)}Z`);
    }
    // The eyes.right entry overrides the right eye's color and shine (for eyes of two colors).
    return side => {
      const e = side === 'R' && eye.right ? { ...eye, ...eye.right } : eye;
      const iris = eye.color || roleOr(spec, 'iris', 'eye');
      const c = col(side === 'R' ? (eye.right && eye.right.color) || roleOr(spec, 'irisRight', iris) : iris);
      const { w, h } = eye, tilt = (eye.tilt || 0) * (side === 'L' ? 1 : -1);
      let open;
      if (eye.shape === 'dot' || eye.shape === 'round') open = `<ellipse rx="${w / 2}" ry="${h / 2}" fill="${c}"/>`;
      else open = `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${w / 2}" fill="${c}"/>`;
      if (e.shine) {
        const marks = [].concat(e.shine).map(s => {
          const x = num(s.x ?? w * 0.15), y = num(s.y ?? -h * 0.22), f = col(s.color || '#fff');
          return s.rx ? `<ellipse cx="${x}" cy="${y}" rx="${num(s.rx)}" ry="${num(s.ry ?? s.rx)}" fill="${f}"/>`
            : `<circle cx="${x}" cy="${y}" r="${num(s.r ?? w * 0.2)}" fill="${f}"/>`;
        }).join('');
        open += `<g clip-path="${eyeClip}">${marks}</g>`;
      }
      if (tilt) open = `<g transform="rotate(${tilt})">${open}</g>`;
      // Strokes for 'happy', 'closed', and 'squint': eyes.stroke sets the line width, and
      // eyes.arc sets the half-span (as a multiple of w).
      const stroke = k => `<path d="${EYE_STROKES[k](w, h, eye.arc ?? 0.9, side === 'L' ? 1 : -1)}" fill="none" stroke="${c}"` +
        ` stroke-width="${num(eye.stroke ?? w * 0.42)}" stroke-linecap="round" stroke-linejoin="round"/>`;
      const key = `eye${side}`;
      // The lid (pose.lid) is a clip whose edge comes down over the open eye; it widens and blinks with the eye.
      const reach = Math.max(w, h) * 2, top = -h / 2 - LID_CLEARANCE;
      defs.push(`<clipPath id="${uid}-lid${side}"><rect data-pf="lid${side}"${st.transform[`lid${side}`] ? ` transform="${st.transform[`lid${side}`]}"` : ''}` +
        ` x="${num(-reach)}" y="${num(top)}" width="${num(reach * 2)}" height="${num(reach * 2)}"/></clipPath>`);
      open = `<g clip-path="url(#${uid}-lid${side})">${open}</g>`;
      return g(key, when(key, 'open', g(`${key}open`, open)) +
        Object.keys(EYE_STROKES).map(k => when(key, k, stroke(k))).join(''));
    };
  }

  // The mouth: every shape it takes, each shown while the pose names it.
  function drawMouth(ctx) {
    const { spec, P, col, when, fill, clipUrl } = ctx;
    const m = spec.mouth || {}, ink = m.color || roleOr(spec, 'ink', 'eye');
    return Object.keys(MOUTHS).map(k => {
      const s = m.size || 5;
      return when('mouth', k, `<path transform="translate(${m.x || 0} ${m.y ?? 22})" d="${MOUTHS[k](s)}" fill="${k === 'o' ? col(ink) : 'none'}" stroke="${col(ink)}" stroke-width="${num(s * 0.35)}" stroke-linecap="round" stroke-linejoin="round"/>`);
    }).join('') + when('mouth', 'open', (() => {
      // Open 'D' mouth: a flat-topped opening with a tongue (m.tongue, else the palette's
      // tongue or earInner) and, when m.fang is set, one small fang on the right.
      const s = (m.size || 5) * 1.8, D = `M${num(-s)} ${num(-0.35 * s)}Q0 ${num(-0.1 * s)} ${num(s)} ${num(-0.35 * s)}` +
        `C${num(s)} ${num(0.6 * s)} ${num(0.5 * s)} ${num(1.2 * s)} 0 ${num(1.2 * s)}C${num(-0.5 * s)} ${num(1.2 * s)} ${num(-s)} ${num(0.6 * s)} ${num(-s)} ${num(-0.35 * s)}Z`;
      const fang = m.fang ? `<path d="M${num(0.28 * s)} ${num(-0.26 * s)}L${num(0.64 * s)} ${num(-0.29 * s)}L${num(0.47 * s)} ${num(0.14 * s)}Z" fill="#fff"/>` : '';
      return `<g transform="translate(${m.x || 0} ${m.y ?? 22})">${fill(D, ink)}<g clip-path="${clipUrl('mouth', D)}">` +
        `<ellipse cx="0" cy="${num(0.9 * s)}" rx="${num(0.62 * s)}" ry="${num(0.42 * s)}" fill="${col(m.tongue || (P.tongue ? 'tongue' : 'earInner'))}"/></g>${fang}</g>`;
    })());
  }

  // Blush. A tilt > 0 raises the outer ends (mirrored, like eyes.tilt).
  function drawBlush(ctx) {
    const { spec, col, g } = ctx, bl = spec.blush;
    return bl ? [-1, 1].map(sx => g(sx < 0 ? 'cheekL' : 'cheekR',
      `<ellipse cx="${num(sx * bl.x)}" cy="${num(bl.y)}" rx="${bl.rx}" ry="${bl.ry}"` +
      `${bl.tilt ? ` transform="rotate(${num(-sx * bl.tilt)} ${num(sx * bl.x)} ${num(bl.y)})"` : ''} fill="${col(bl.color || 'blush')}"/>`)).join('') : '';
  }

  // The limbs (standFor), on which the friend sits and stands: the legs behind the upper body, and the arms in front
  // of the head (see drawUpper). A limb is its hose, its bands, then its paw or foot, whose transform carries it to the
  // end. Gives the legs, the feet that lie in front of the body, and the arms: those under the head, bare (under),
  // then their paws, which never tuck (paws); then those that `over` names, each with its paw (over).
  // The body with its markings and clothes (its extras), stretched downward from its top to BODY.height (bodyHeight). A
  // scarf clipped to the body takes the stretched outline (bodyTall), since it is drawn outside the stretch.
  function drawBody(ctx) {
    const { spec, uid, seed, defs, part } = ctx, { k, top } = bodyHeight(spec);
    const drawn = part('body', spec.body, roleOr(spec, 'body', 'chest'));
    if (k === 1) return drawn;
    const stretch = `matrix(1 0 0 ${num(k)} 0 ${num(top * (1 - k))})`;
    defs.push(`<clipPath id="${uid}-bodyTall"><path d="${shapeD(spec.body, seed('body'))}" transform="${stretch}"/></clipPath>`);
    return `<g transform="${stretch}">${drawn}</g>`;
  }

  function drawLimbs(ctx) {
    const { spec, st, g, clipUrl } = ctx, stand = standFor(spec);
    const out = { legs: '', feet: '', under: '', paws: '', over: '' };
    if (!stand) return out;
    // An arm and its paw are drawn twice, in the palette's colors and then in their house shades (ctx.shade), which
    // show as the paw comes in front of the head (armLShade, pawLShade; see poseState), so that a paw the color of the
    // face still shows against it, without an outline.
    const twice = (name, draw, end) => draw(ctx) + (end === 'paw' ? g(`${name}Shade`, draw(ctx.shade)) : '');
    // A paw or a foot: its shape and extras, or, where the seat gives its seated ellipse, that ellipse in its seated
    // frame (which the pose moves and stretches), with the extras that face us only while it sits (sole) in a frame
    // of their own, which flattens them as it rises.
    const tipOf = (tip, end, S, l) => {
      const seated = stand.seat[end][S];
      if (!seated) return g(tip, twice(tip, look => look.part(tip, l[end], l[end].color), end));
      const d = ellipseD({ rx: seated.rx, ry: seated.ry, rot: seated.rot }), clip = clipUrl(tip, d);
      return g(tip, twice(tip, ({ fill, extras }) => {
        const plain = under => extras(tip, clip, under, x => !x.sole);
        const soles = extras(tip, clip, true, x => x.sole) + extras(tip, clip, false, x => x.sole);
        return g(`${tip}seat`, plain(true) + fill(d, l[end].color) + plain(false) + g(`${tip}sole`, soles));
      }, end));
    };
    // A limb is its hose, its bands, then its paw or foot. Its `hose` alone is the hose and the bands that stop
    // short of the end, and its `end` the rest; its `bare` is the hose and all its bands, and its `tip` the paw or
    // foot alone.
    const limb = (name, end, only) => {
      const S = name.slice(-1), l = (end === 'paw' ? stand.arms : stand.legs)[S], tip = `${end}${S}`;
      const bands = (keep, { col }) => (l.bands || []).map((b, i) => (keep(b) ? `<path data-pf-d="${name}:${i}" d="${st.paths[`${name}:${i}`]}" fill="${col(b.color || l.color)}"/>` : '')).join('');
      const reaches = b => (b.to ?? 1) >= 1, hose = ({ col }) => `<path data-pf-d="${name}" d="${st.paths[name]}" fill="${col(l.color)}"/>`;
      if (only === 'hose') return g(name, twice(name, look => hose(look) + bands(b => !reaches(b), look), end));
      if (only === 'end') return bands(reaches, ctx) + tipOf(tip, end, S, l);
      if (only === 'tip') return tipOf(tip, end, S, l);
      return g(name, twice(name, look => hose(look) + bands(() => true, look), end) + (only === 'bare' ? '' : tipOf(tip, end, S, l)));
    };
    // Where the seated feet lie on the body, the feet (and the bands that reach them) are drawn in front of the body
    // and the leg hoses behind it.
    const front = stand.seat.front;
    out.legs = g('legs', front ? limb('legL', 'foot', 'hose') + limb('legR', 'foot', 'hose') : limb('legL', 'foot') + limb('legR', 'foot'));
    if (front) out.feet = g('feet', limb('legL', 'foot', 'end') + limb('legR', 'foot', 'end'));
    const [over, under] = [true, false].map(o => ['armL', 'armR'].filter(n => st.state.over.has(n) === o));
    out.under = g('armsUnder', under.map(n => limb(n, 'paw', 'bare')).join(''));
    out.paws = g('pawsUnder', under.map(n => limb(n, 'paw', 'tip')).join(''));
    out.over = g('armsOver', over.map(n => limb(n, 'paw', 'bare') + limb(n, 'paw', 'tip')).join(''));
    return out;
  }

  // The upper body. From the back: the body with its clothes (its extras), the feet that lie in front of it, the scarf
  // (extras on 'scarf': a ruff or a bib of fur, or a scarf, round the neck, which `clip: true` clips to the body), the
  // head, whose chin lies over the scarf and the collar, then the arms in front of all of them, as a paw raised to the
  // face comes forward of it, except at the shoulder, which tucks under the scarf and the head. Those three overlap in
  // a ring, so the arms are masked within STAND_FIT.tuck of their length of each shoulder (tuckL, tuckR) wherever the
  // scarf or the head is drawn: the mask holds their silhouettes. The paws come after the arms, unmasked, as they are
  // while the friend sits, and an arm that the pose's `over` names is drawn whole in front of everything.
  function drawUpper(ctx, { body, head, limbs }) {
    const { spec, uid, st, attrs, g, extras, defs } = ctx;
    let scarf = '', armsFront = limbs.under;
    if ((spec.extras || []).some(x => x.on === 'scarf')) {
      const clip = spec.body ? `url(#${uid}-${bodyHeight(spec).k === 1 ? 'body' : 'bodyTall'})` : null;
      scarf = g('scarf', extras('scarf', clip, true) + extras('scarf', clip, false), 'scarf');
    }
    if (limbs.under) {
      const box = 'x="-1000" y="-1000" width="2000" height="2000"', ink = `filter="url(#${uid}-ink)"`;
      defs.push(`<filter id="${uid}-ink"><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"/></filter>` +
        `<clipPath id="${uid}-shoulders">${['L', 'R'].map(S => `<circle${attrs(`tuck${S}`)} r="1"/>`).join('')}</clipPath>` +
        `<mask id="${uid}-tuck" maskUnits="userSpaceOnUse" ${box}><rect ${box} fill="#fff"/><g clip-path="url(#${uid}-shoulders)"${attrs('tuckInk')}>` +
        `${scarf ? `<use href="#${uid}-scarf" ${ink}/>` : ''}<use href="#${uid}-head" ${ink}/></g></mask>`);
      // Seated, the arms hang in front of the scarf, so the mask would hide nothing; and a mask costs every frame, most
      // of all in Safari, so the arms take it only once the friend has risen (mount toggles it). Its ink fades in as
      // the friend rises (tuckInk), so that an arm crossing a bib slides under it rather than vanishing at once.
      const mask = `url(#${uid}-tuck)`;
      armsFront = `<g data-pf="tuck" data-pf-mask="${mask}"${st.state.tucked ? ` mask="${mask}"` : ''}>${limbs.under}</g>`;
    }
    return g('upper', body + limbs.feet + scarf + head + armsFront + limbs.paws + limbs.over);
  }

  // Tail (optional, drawn behind the body): the plume, then a tip marking whose edge
  // is a row of tufts pointing back toward the base, bent with the plume and clipped to it.
  function drawTail(ctx) {
    const { spec, seed, g, fill, clipUrl, extraShape, cue } = ctx;
    if (!spec.tail) return '';
    const tl = tailFor(spec), d = pathD(tailNodes(tl, seed('tail'))), clip = clipUrl('tail', d);
    let tip = '';
    if (tl.tip) {
      const k = tl.tip, s = k.span ?? 30;
      tip = fill(pathD(tailNodes(tl, seed('tail/tip'), {
        cx: 0, cy: -tl.length, rx: tl.width, ry: tl.length * (1 - (k.at ?? 0.7)),
        fluff: k.fluff || [{ from: 90 - s, to: 90 + s, n: k.n ?? 2, len: k.len ?? 10, depth: 0.02 }],
      })), k.color || 'tailTip');
    }
    // Extras on 'tail' are drawn in the tail's straight local space. Fluffy extras bend
    // with the tail; the rest (raw nodes, stars, paths, ellipses) stay rigid and ride
    // along: each is moved to where the bent tail puts its center (cx, cy, or the mean
    // of its nodes; each of its polys separately) and turned with the spine at that point.
    const tx = under => (spec.extras || []).map((x, i) => {
      if (x.on !== 'tail' || !!x.under !== under) return '';
      let s;
      if (x.polys) s = x.polys.map(p => `<g transform="${tailRide(tl, p[0], p[1])}">${fill(pathD(polyNodes(p, x)), x.fill)}</g>`).join('');
      else if (x.nodes || x.tips || x.d || x.kind === 'ellipse') {
        const pts = x.nodes && x.cx === undefined ? shapeNodes(x) : null;
        const cx = pts ? pts.reduce((a, p) => a + p.x, 0) / pts.length : x.cx || 0;
        const cy = pts ? pts.reduce((a, p) => a + p.y, 0) / pts.length : x.cy || 0;
        s = `<g transform="${tailRide(tl, cx, cy)}">${extraShape(x, i, 'tail')}</g>`;
      } else s = fill(pathD(tailNodes(tl, seed(`tail/extra${i}`), x)), x.fill);
      return cue(x, x.clip ? `<g clip-path="${clip}">${s}</g>` : s);
    }).join('');
    return g('tail', tx(true) + fill(d, tl.color || roleOr(spec, 'tail', 'fur')) + (tip && `<g clip-path="${clip}">${tip}</g>`) + tx(false));
  }

  // The sheet: the figure seen through the view's camera, the props on the ground, the pencil and the paper.
  function drawSheet(ctx, opts, figure) {
    const { spec, uid, view, P, g, extras, defs } = ctx;
    const bg = opts.bg === false ? null : opts.bg || view.bg || P.bg;
    const size = opts.fluid ? '' : ` width="${num(view.w)}" height="${num(view.h)}"`;
    const cam = `translate(${num(view.x)} ${num(view.y)}) rotate(${view.rotate || 0}) scale(${num(view.scale * 1000) / 1000})`;
    // opts.pencil: false draws the flat shapes alone, for an icon too small to hold the texture or
    // for matching a flat reference picture.
    // Extras on 'ground' stand on the ground in front of the friend, in head space but outside its
    // pose: a prop it has put down stays where it is while the friend hops, squashes or moves. They drop with the
    // ground under a taller body (bodyHeight).
    const props = extras('ground', null, false), drop = bodyHeight(spec).drop;
    const ground = drop && props ? `<g transform="translate(0 ${num(drop)})">${props}</g>` : props;
    let drawing = `<g id="${uid}-drawing" transform="${cam}">${g('root', figure)}${ground && g('ground', ground)}</g>`;
    if (opts.pencil !== false) {
      defs.push(pencilMask(`${uid}-pencil`, view));
      const sheet = bg ? `<use href="#${uid}-drawing" filter="url(#${uid}-paper)"/>` : '';
      if (bg) defs.push(paperSheet(`${uid}-paper`));
      drawing = sheet + penciled(`${uid}-pencil`, drawing);
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${num(view.w)} ${num(view.h)}"${size} data-pf-uid="${uid}">` +
      `<defs>${defs.join('')}</defs>` +
      (bg ? `<rect width="100%" height="100%" fill="${bg}"/>` : '') + drawing + '</svg>';
  }

  // ------------------------------------------------------------------ Mount

  function mount(el, specOrName, opts = {}) {
    const spec = resolve(specOrName);
    el.innerHTML = render(spec, { fluid: true, ...opts });
    const svg = el.querySelector('svg'), texture = svg.querySelector('image[data-pf-texture]');
    // opts.bitmap: false keeps the texture as it is drawn in a still, for a page that must come out the
    // same every time, such as a film.
    const bitmap = !!textureWatch && opts.bitmap !== false;
    if (bitmap) textureWatch.observe(svg);
    const drawing = indexDrawing(svg);
    let pose = { ...(opts.pose || {}) };
    const rig = {
      el, svg, spec, parts: drawing.parts, view: resolveView(spec, opts.view, opts.size),
      get pose() { return pose; },
      setPose(next, replace = false) {
        pose = replace ? { ...next } : { ...pose, ...next };
        redraw(drawing, poseState(spec, rig.view.pose ? { ...rig.view.pose, ...pose } : pose));
        return rig;
      },
      // Shows a variant of the pencil texture (0 is a still's). A boiling page cycles through
      // PENCIL.variants of them a few times a second, as hand-drawn animation does.
      setTexture(variant) {
        if (texture) setTextureVariant(texture, variant, bitmap);
        return rig;
      },
    };
    return rig;
  }

  // What a pose changes in a mounted drawing, each with what it was last given, so that a pose writes only what
  // changes: a browser restyles, and may repaint, for every write. The parts (data-pf) take a transform and an
  // opacity; the toggles (data-pf-when, data-pf-show) are shown or hidden; and the outlines that a pose redraws (the
  // limbs and their bands, data-pf-d) take a path.
  function indexDrawing(svg) {
    const parts = {}, copies = {}, placed = {}, faded = {}, outlines = {}, drawn = {};
    // A name drawn more than once (an arm's paw and the paw of its shaded copy) takes the same transform and opacity
    // everywhere; rig.parts holds the first, and copies all of them.
    svg.querySelectorAll('[data-pf]').forEach(n => {
      const name = n.getAttribute('data-pf');
      (copies[name] = copies[name] || []).push(n);
      if (parts[name]) return;
      parts[name] = n;
      placed[name] = n.getAttribute('transform');
      faded[name] = n.getAttribute('opacity');
    });
    const toggle = (n, shownBy) => ({ n, shownBy, shown: !n.hasAttribute('display') });
    const toggles = [
      ...[...svg.querySelectorAll('[data-pf-when]')].map(n => {
        const [key, val] = n.getAttribute('data-pf-when').split('=');
        return toggle(n, st => st.state[key] === val);
      }),
      ...[...svg.querySelectorAll('[data-pf-show]')].map(n => {
        const name = n.getAttribute('data-pf-show');
        return toggle(n, st => st.state.show.has(name));
      }),
    ];
    svg.querySelectorAll('[data-pf-d]').forEach(n => {
      const name = n.getAttribute('data-pf-d');
      (outlines[name] = outlines[name] || []).push(n);
      drawn[name] = n.getAttribute('d');
    });
    return { parts, copies, placed, faded, toggles, outlines, drawn };
  }

  // Gives a mounted drawing the state of a new pose (poseState), as a fresh render of that pose would draw it.
  function redraw({ parts, copies, placed, faded, toggles, outlines, drawn }, st) {
    for (const k in st.transform) {
      if (!parts[k] || placed[k] === st.transform[k]) continue;
      placed[k] = st.transform[k];
      for (const n of copies[k]) n.setAttribute('transform', placed[k]);
    }
    for (const k in st.opacity) {
      if (!parts[k] || faded[k] === st.opacity[k]) continue;
      faded[k] = st.opacity[k];
      for (const n of copies[k]) n.setAttribute('opacity', faded[k]);
    }
    for (const t of toggles) {
      const shown = t.shownBy(st);
      if (shown === t.shown) continue;
      if ((t.shown = shown)) t.n.removeAttribute('display');
      else t.n.setAttribute('display', 'none');
    }
    for (const k in st.paths) {
      if (!outlines[k] || drawn[k] === st.paths[k]) continue;
      drawn[k] = st.paths[k];
      for (const n of outlines[k]) n.setAttribute('d', drawn[k]);
    }
    if (parts.tuck && st.state.tucked !== parts.tuck.hasAttribute('mask')) {
      if (st.state.tucked) parts.tuck.setAttribute('mask', parts.tuck.getAttribute('data-pf-mask'));
      else parts.tuck.removeAttribute('mask');
    }
    restackArms(parts, st.state.over);
  }

  // Puts each arm and its paw where a render would draw them (drawLimbs): the left one first, and an arm that `over`
  // names followed by its paw.
  function restackArms(parts, over) {
    for (const S of ['L', 'R']) {
      const arm = parts[`arm${S}`], paw = parts[`paw${S}`], isOver = over.has(`arm${S}`);
      if (!arm || !paw) continue;
      const slot = parts[isOver ? 'armsOver' : 'armsUnder'], pawSlot = isOver ? slot : parts.pawsUnder;
      if (arm.parentNode !== slot) slot.insertBefore(arm, S === 'L' ? slot.firstChild : null);
      const before = isOver ? arm.nextSibling : S === 'L' ? pawSlot.firstChild : null;
      if (paw.parentNode !== pawSlot || (isOver && before !== paw)) pawSlot.insertBefore(paw, before);
    }
  }

  return {
    VERSION, POSE, DEPTH,
    define, get: resolve, list: () => [...registry.keys()], merge, check, ANATOMY,
    render, mount, poseState, resolveView, standingView, groundOf, STANDING_BOX, standFor, standLift, riseOf, freeSide, STAND_DEFAULT, STAND_FIT, ONIGIRI, BODY,
    shapes: { pathD, fluffy, star, polyNodes, earNodes, tailNodes, tailBend, shapeNodes, shapeD, ellipse, ellPoint, ellAngle, limbArc, limbNodes, bendFor, outlineOf, reachAt, ellipseD },
    rng, hash, SHADE, shadeOf,
    // The pencil, for drawing props in the characters' texture and for redrawing it (film/scene.js).
    pencil: { settings: PENCIL, texture: pencilTexture, svg: pencilSVG, bitmap: pencilBitmap },
    // The palette a render uses: the spec's colors plus the house shades that the spec refers to.
    palette: specOrName => {
      const spec = resolve(specOrName), P = withShades(spec.palette || {}), used = JSON.stringify(spec);
      return Object.fromEntries(Object.entries(P).filter(([k]) => (spec.palette || {})[k] !== undefined || used.includes(`"${k}"`)));
    },
  };
});
