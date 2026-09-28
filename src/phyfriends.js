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
  function withShades(palette) {
    const P = {}; // Insert each derived shade directly after its base color.
    for (const [k, v] of Object.entries(palette)) {
      P[k] = v;
      if (typeof v === 'string' && /^#[0-9a-f]{3,6}$/i.test(v) && !(`${k}Shade` in palette)) P[`${k}Shade`] = shadeOf(v);
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
  function ellAngle(e, x, y) {
    const [u, v] = rot(x - e.cx, y - e.cy, -e.rot);
    return (Math.atan2(v / e.ry, u / e.rx) / DEG + 360) % 360;
  }

  // ---------------------------------------------------------------- Shapes

  // Fluffy blob: an ellipse whose outline carries tufts of fur over given angle ranges.
  //   {cx, cy, rx, ry, rot, step, fluff: [{from, to, n, len, lean, jit, depth, b1, b2, sym, seed}]}
  //   Each range places n tufts between angles from..to. Per range: len = tuft length;
  //   lean shifts the tips toward +angle (degrees); jit = randomness (0..1); depth =
  //   notch depth (0..1 of the radius); b1/b2 bend the rising/falling side of each tuft;
  //   sym mirrors the range across the vertical axis. Ranges must not overlap.
  //   For sawtooth shingles, use len ~0, depth ~0.1, a lean that puts each tip near
  //   one of its valleys, and a convex long side (b ~ -15) with a straight
  //   notch (b ~ 0). A negative len pulls the tip inward (with n: 1, it flattens an arc).
  function fluffy(s, seed = 1) {
    const e = ellipse(s), step = s.step || 24, ranges = [];
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
        const [x, y] = ellPoint(e, a0 + (j * (a1 - a0)) / m);
        nodes.push({ x, y });
      }
    };
    if (!ranges.length) {
      const m = Math.round(360 / step);
      for (let j = 0; j < m; j++) { const [x, y] = ellPoint(e, (j * 360) / m); nodes.push({ x, y }); }
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
        const [x, y] = ellPoint(e, a, inner ? 1 - r.depth : 1);
        nodes.push({ x, y, c: true, b: k < r.tips.length ? r.b1 : 0 });
        if (k < r.tips.length) {
          const t = r.tips[k], at = from + t.pos * r.span;
          const [bx, by] = ellPoint(e, at), [nx, ny] = ellNormal(e, at);
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

  // Ear in local space: the base is centered on the origin, and the ear points up (-y).
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
    earL: 0, earR: 0,   // Extra outward ear rotation in degrees
    hair: 0,            // Hair sway in degrees
    tail: 0,            // Tail wag in degrees: positive swings the tip outward, negative tucks it in behind
    blush: 1,           // Blush opacity
    eyes: 'open',       // Eye state: 'open' | 'happy' | 'closed' | 'squint' (eyeL / eyeR override it)
    mouth: null,        // Mouth shape: null = spec default; 'none' | 'w' | 'smile' | 'o' | 'v' | 'open'
  };

  // Parallax depth per layer: how far each layer slides when the head turns.
  const DEPTH = { tail: -0.4, body: -0.15, earL: -0.5, earR: -0.5, face: 0.35, blush: 0.55, eyes: 0.6, mouth: 0.55, hair: 0.45 };

  const EAR_DEFAULT = { base: [-70, -70], angle: 35, width: 60, length: 70 };
  const EYE_DEFAULT = { x: 35, y: 0, w: 14, h: 28, shape: 'pill', range: 6 };
  // Default tail: a bushy plume that curls up behind the left side of the body (see tailNodes).
  const TAIL_DEFAULT = {
    base: [-56, 102], angle: 55, length: 108, width: 58, curl: -50,
    fluff: [{ from: 150, to: 205, n: 2, len: 8, lean: 8, sym: true },
      { from: 216, to: 258, n: 2, len: 11, lean: 7, depth: 0.06, sym: true },
      { from: 262, to: 278, n: 1, len: 12 }],
  };

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
  const tailFor = spec => ({ ...TAIL_DEFAULT, ...(spec.tail && spec.tail.bend ? { curl: 0 } : {}), ...spec.tail });
  function tailPlace(tail, wag) {
    const [bx, by] = tail.base, out = bx < 0 ? -1 : 1;
    return `translate(${num(bx)} ${num(by)}) rotate(${num(out * ((tail.angle || 0) + wag))})${out < 0 ? ' scale(-1 1)' : ''}`;
  }

  function poseState(spec, pose) {
    const p = { ...POSE, ...(pose || {}) }, rig = spec.rig || {};
    const turn = rig.turn ?? 14;
    const tx = p.turnX * turn, ty = p.turnY * turn * 0.7;
    const par = z => `translate(${num(tx * z)} ${num(ty * z)})`;
    const ground = rig.ground ?? 120, neck = rig.neck || [0, 50];
    const eye = { ...EYE_DEFAULT, ...(spec.eyes || {}) };
    const lx = p.lookX * eye.range, ly = p.lookY * eye.range * 0.8;
    const k = Math.max(0.2, 1 + p.widen), eyeOpen = `scale(${num(k)} ${num(k * Math.max(0.06, 1 - p.blink))})`;
    const hc = spec.hair ? [spec.hair.cx || 0, spec.hair.cy || 0] : [0, 0];
    const t = {
      root: `translate(${num(p.x)} ${num(p.y)}) translate(0 ${ground}) scale(${num(1 - p.squash * 0.5)} ${num(1 + p.squash)}) translate(0 ${-ground})`,
      head: `${p.headX || p.headY ? `translate(${num(p.headX)} ${num(p.headY)}) ` : ''}rotate(${num(p.tilt)} ${neck[0]} ${neck[1]})`,
      earL: `${par(DEPTH.earL)} ${earPlace(earFor(spec, 'L'), 'L', p.earL)}`,
      earR: `${par(DEPTH.earR)} ${earPlace(earFor(spec, 'R'), 'R', p.earR)}`,
      eyeL: `translate(${num(-eye.x + lx)} ${num(eye.y + ly)})`,
      eyeR: `translate(${num(eye.x + lx)} ${num(eye.y + ly)})`,
      eyeLopen: eyeOpen,
      eyeRopen: eyeOpen,
      hair: `${par(DEPTH.hair)} rotate(${num(p.hair)} ${hc[0]} ${hc[1]})`,
    };
    for (const k of ['body', 'face', 'blush', 'eyes', 'mouth']) t[k] = par(DEPTH[k]);
    if (spec.tail) t.tail = `${par(DEPTH.tail)} ${tailPlace(tailFor(spec), p.tail)}`;
    for (const s of ['L', 'R']) if (earFor(spec, s).inner?.front) t[`ear${s}front`] = t[`ear${s}`];
    const mouth = p.mouth || (spec.mouth && spec.mouth.shape) || 'none';
    return {
      transform: t,
      opacity: { blush: num(p.blush) },
      state: { eyeL: p.eyeL || p.eyes, eyeR: p.eyeR || p.eyes, mouth },
    };
  }

  // ---------------------------------------------------------------- Render

  // Portrait view: fits the whole character (ear tips ~ -145 .. paws ~ +132, tail to
  // ~ -150 at full wag) in a square, with a margin for hops and stretches.
  const DEFAULT_VIEW = { w: 512, h: 512, x: 256, y: 266, scale: 1.6, rotate: 0 };
  let UID = 0;

  // The pencil (FWIENDS.md): every character is colored in with colored pencil and has no outline.
  // A mask over the whole drawing lets the paper show through in three ways: diagonal strokes, the
  // paper's fine tooth, and patches where the hand pressed more lightly. The mask is measured in the
  // picture's own units, not head units, because the pencil is the same size however large the
  // drawing is; the gallery draws at about one unit to the pixel. It sits outside the camera, so the
  // strokes keep their angle when a view tips the head, and it stays put while the character moves,
  // as the paper would. It is an image, so a browser draws its noise once rather than on every frame.
  const PENCIL = {
    angle: -40,              // The strokes rise to the right, as a right hand shades.
    strokes: '0.035 0.9',    // Streaky noise: long along a stroke and fine across it.
    tooth: 1.2,              // The paper's grain.
    pressure: 0.02,          // The size of the lighter patches.
    margin: 0.5,             // The mask reaches this fraction of the view past each edge, for ears and tails.
    paper: '#fbf9f3',        // The paper of site/notebook.css, laid under a character drawn on a background of its own.
  };
  const pencilTextures = new Map();

  // The texture for a sheet (x, y, w, h), as an SVG image. Its filter mixes the three noises
  // (strokes 0.6, tooth 0.25, then pressure 0.35) and turns the mix into an alpha that keeps most of
  // the color, so that the paper shows only in specks and streaks. The rectangle is turned to the
  // stroke angle and reaches past the sheet's farthest corner. Views of one size share one image.
  function pencilTexture(x, y, w, h) {
    const key = [x, y, w, h].join(' ');
    if (!pencilTextures.has(key)) {
      const reach = Math.hypot(Math.abs(x) + w, Math.abs(y) + h);
      const noise = (frequency, octaves, seed, result) =>
        `<feTurbulence type='fractalNoise' baseFrequency='${frequency}' numOctaves='${octaves}' seed='${seed}' result='${result}'/>`;
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='${key}' width='${w}' height='${h}'>` +
        `<filter id='p' x='0' y='0' width='1' height='1' color-interpolation-filters='sRGB'>` +
        noise(PENCIL.strokes, 2, 11, 'strokes') + noise(PENCIL.tooth, 1, 7, 'tooth') + noise(PENCIL.pressure, 2, 4, 'pressure') +
        `<feComposite in='strokes' in2='tooth' operator='arithmetic' k2='0.6' k3='0.25' result='grain'/>` +
        `<feComposite in='grain' in2='pressure' operator='arithmetic' k2='1' k3='0.35' result='mix'/>` +
        `<feColorMatrix in='mix' type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3 2.7' result='alpha'/>` +
        `<feComposite in='SourceGraphic' in2='alpha' operator='in'/></filter>` +
        `<rect x='${-reach}' y='${-reach}' width='${2 * reach}' height='${2 * reach}' fill='#fff' filter='url(#p)' transform='rotate(${PENCIL.angle})'/></svg>`;
      // Encoded, so that the render stays well-formed XML when it is saved or shown as a standalone SVG.
      pencilTextures.set(key, `data:image/svg+xml,${encodeURIComponent(svg)}`);
    }
    return pencilTextures.get(key);
  }

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
      `<image href="${pencilTexture(x, y, w, h)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"/></mask>`;
  }

  function resolveView(spec, v, size) {
    const views = spec.views || {};
    const base = { ...DEFAULT_VIEW, ...(views.portrait || {}) };
    const out = typeof v === 'string' ? { ...base, ...(views[v] || {}) } : { ...base, ...(v || {}) };
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
    v: s => `M${-s * 0.6} ${-s * 0.3}L0 ${s * 0.4}L${s * 0.6} ${-s * 0.3}`,
    o: s => `M0 ${-s * 0.5}a${s * 0.45} ${s * 0.55} 0 1 0 0.01 0Z`,
  };

  function render(specOrName, opts = {}) {
    const spec = resolve(specOrName);
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
    const g = (name, inner) => `<g${attrs(name)}>${inner}</g>`;
    const when = (key, val, inner) =>
      `<g data-pf-when="${key}=${val}"${st.state[key] === val ? '' : ' display="none"'}>${inner}</g>`;
    const fill = (d, c, extra = '') => `<path d="${d}" fill="${col(c)}"${extra}/>`;
    const clipUrl = (id, d) => {
      defs.push(`<clipPath id="${uid}-${id}"><path d="${d}"/></clipPath>`);
      return `url(#${uid}-${id})`;
    };

    const extraShape = (x, i, part) => {
      if (x.kind === 'ellipse') {
        const e = ellipse(x);
        return `<ellipse cx="${num(e.cx)}" cy="${num(e.cy)}" rx="${num(e.rx)}" ry="${num(e.ry)}"` +
          `${x.rot ? ` transform="rotate(${x.rot} ${num(e.cx)} ${num(e.cy)})"` : ''} fill="${col(x.fill)}"/>`;
      }
      return fill(shapeD(x, seed(`${part}/extra${i}`)), x.fill);
    };
    const extras = (part, clip, under) => {
      const out = [];
      (spec.extras || []).forEach((x, i) => {
        // An extra with on: 'ears' is drawn on both ears (ear-local space is mirrored for the right ear).
        const on = x.on === 'ears' && (part === 'earL' || part === 'earR') ? part : x.on;
        if (on !== part || !!x.under !== under) return;
        const s = extraShape(x, i, part);
        out.push(x.clip && clip ? `<g clip-path="${clip}">${s}</g>` : s);
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

    // Ears. The inner ear goes in its own layer when it sits in front of the head.
    const innerEar = e => {
      const k = e.inner.scale ?? 0.6, dx = e.inner.dx || 0, dy = e.inner.dy || 0;
      return fill(pathD(earNodes({ ...e, ...e.inner }).map(n => ({ ...n, x: n.x * k + dx, y: n.y * k + dy }))), e.inner.color || 'earInner');
    };
    const earFront = side => {
      const e = earFor(spec, side);
      return e.inner && e.inner.front ? g(`ear${side}front`, innerEar(e)) : '';
    };
    const ear = side => {
      const e = earFor(spec, side), outer = earNodes(e), d = pathD(outer);
      const clip = clipUrl(`ear${side}`, d);
      const inner = e.inner && !e.inner.front ? innerEar(e) : '';
      const stripes = (e.stripes || []).map(s => {
        const [X0, X1] = s.span || [-e.width * 1.5, e.width * 1.5];
        const h = (s.w || 6) / 2, cy = -(s.t ?? 0.5) * e.length, b = s.b || 0;
        const nodes = [[X0, -h], [X1, -h], [X1, h], [X0, h]].map(([x, y], i) => {
          const [rx, ry] = rot(x, y, (s.a || 0) * DEG);
          return { x: rx, y: ry + cy, c: true, b: i === 0 ? b : i === 2 ? -b : 0 };
        });
        return fill(pathD(nodes), s.color || e.stripeColor || 'stripe');
      }).join('');
      return g(`ear${side}`, extras(`ear${side}`, null, true) + fill(d, e.color || 'fur') + (stripes && `<g clip-path="${clip}">${stripes}</g>`) +
        inner + extras(`ear${side}`, clip, false));
    };

    // Eyes. `shine` is one highlight or a list of marks drawn in order and
    // clipped to the eye, each a circle (r) or an ellipse (rx, ry): e.g., an
    // iris, then a lighter crescent visible at the bottom, then a white highlight.
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
    const eyeShape = side => {
      const e = side === 'R' && eye.right ? { ...eye, ...eye.right } : eye;
      const { w, h } = eye, c = col(e.color || 'eye'), tilt = (eye.tilt || 0) * (side === 'L' ? 1 : -1);
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
      return g(key, when(key, 'open', g(`${key}open`, open)) +
        ['happy', 'closed', 'squint'].map(k => when(key, k, stroke(k))).join(''));
    };

    // Mouth
    const m = spec.mouth || {};
    const mouthSvg = Object.keys(MOUTHS).map(k => {
      const s = m.size || 5;
      return when('mouth', k, `<path transform="translate(${m.x || 0} ${m.y ?? 22})" d="${MOUTHS[k](s)}" fill="${k === 'o' ? col(m.color || 'eye') : 'none'}" stroke="${col(m.color || 'eye')}" stroke-width="${num(s * 0.35)}" stroke-linecap="round" stroke-linejoin="round"/>`);
    }).join('') + when('mouth', 'open', (() => {
      // Open 'D' mouth: a flat-topped opening with a tongue (m.tongue, else the palette's
      // tongue or earInner) and, when m.fang is set, one small fang on the right.
      const s = (m.size || 5) * 1.8, D = `M${num(-s)} ${num(-0.35 * s)}Q0 ${num(-0.1 * s)} ${num(s)} ${num(-0.35 * s)}` +
        `C${num(s)} ${num(0.6 * s)} ${num(0.5 * s)} ${num(1.2 * s)} 0 ${num(1.2 * s)}C${num(-0.5 * s)} ${num(1.2 * s)} ${num(-s)} ${num(0.6 * s)} ${num(-s)} ${num(-0.35 * s)}Z`;
      const fang = m.fang ? `<path d="M${num(0.28 * s)} ${num(-0.26 * s)}L${num(0.64 * s)} ${num(-0.29 * s)}L${num(0.47 * s)} ${num(0.14 * s)}Z" fill="#fff"/>` : '';
      return `<g transform="translate(${m.x || 0} ${m.y ?? 22})">${fill(D, m.color || 'eye')}<g clip-path="${clipUrl('mouth', D)}">` +
        `<ellipse cx="0" cy="${num(0.9 * s)}" rx="${num(0.62 * s)}" ry="${num(0.42 * s)}" fill="${col(m.tongue || (P.tongue ? 'tongue' : 'earInner'))}"/></g>${fang}</g>`;
    })());

    // Blush. A tilt > 0 raises the outer ends (mirrored, like eyes.tilt).
    const bl = spec.blush;
    const blushSvg = bl ? [-1, 1].map(sx =>
      `<ellipse cx="${num(sx * bl.x)}" cy="${num(bl.y)}" rx="${bl.rx}" ry="${bl.ry}"` +
      `${bl.tilt ? ` transform="rotate(${num(-sx * bl.tilt)} ${num(sx * bl.x)} ${num(bl.y)})"` : ''} fill="${col(bl.color || 'blush')}"/>`).join('') : '';

    const layers = {
      earL: () => ear('L'),
      earR: () => ear('R'),
      earLfront: () => earFront('L'),
      earRfront: () => earFront('R'),
      base: () => g('base', part('base', spec.head, 'fur')),
      face: () => g('face', part('face', spec.face, 'face')),
      blush: () => g('blush', blushSvg + extras('blush', null, false)),
      eyes: () => g('eyes', eyeShape('L') + eyeShape('R')),
      mouth: () => g('mouth', mouthSvg),
      hair: () => g('hair', part('hair', spec.hair, 'hair')),
    };
    let order = spec.order || ['earL', 'earR', 'base', 'face', 'blush', 'eyes', 'mouth', 'hair'];
    if (!order.includes('earLfront')) order = order.flatMap(k => (k === 'base' ? [k, 'earLfront', 'earRfront'] : [k]));
    const head = g('head', order.map(k => layers[k]()).join(''));
    const body = g('body', part('body', spec.body, 'chest'));

    // Tail (optional, drawn behind the body): the plume, then a tip marking whose edge
    // is a row of tufts pointing back toward the base, bent with the plume and clipped to it.
    let tail = '';
    if (spec.tail) {
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
        return x.clip ? `<g clip-path="${clip}">${s}</g>` : s;
      }).join('');
      tail = g('tail', tx(true) + fill(d, tl.color || 'fur') + (tip && `<g clip-path="${clip}">${tip}</g>`) + tx(false));
    }

    const bg = opts.bg === false ? null : opts.bg || view.bg || P.bg;
    const size = opts.fluid ? '' : ` width="${num(view.w)}" height="${num(view.h)}"`;
    const cam = `translate(${num(view.x)} ${num(view.y)}) rotate(${view.rotate || 0}) scale(${num(view.scale * 1000) / 1000})`;
    // opts.pencil: false draws the flat shapes alone, for an icon too small to hold the texture or
    // for matching a flat reference picture.
    let drawing = `<g id="${uid}-drawing" transform="${cam}">${g('root', tail + body + head)}</g>`;
    if (opts.pencil !== false) {
      defs.push(pencilMask(`${uid}-pencil`, view));
      const sheet = bg ? `<use href="#${uid}-drawing" filter="url(#${uid}-paper)"/>` : '';
      if (bg) defs.push(paperSheet(`${uid}-paper`));
      drawing = `${sheet}<g mask="url(#${uid}-pencil)">${drawing}</g>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${num(view.w)} ${num(view.h)}"${size} data-pf-uid="${uid}">` +
      `<defs>${defs.join('')}</defs>` +
      (bg ? `<rect width="100%" height="100%" fill="${bg}"/>` : '') + drawing + '</svg>';
  }

  // ------------------------------------------------------------------ Mount

  function mount(el, specOrName, opts = {}) {
    const spec = resolve(specOrName);
    el.innerHTML = render(spec, { fluid: true, ...opts });
    const svg = el.querySelector('svg');
    const parts = {};
    svg.querySelectorAll('[data-pf]').forEach(n => { parts[n.getAttribute('data-pf')] = n; });
    const toggles = [...svg.querySelectorAll('[data-pf-when]')].map(n => {
      const [key, val] = n.getAttribute('data-pf-when').split('=');
      return { n, key, val };
    });
    let pose = { ...(opts.pose || {}) };
    const rig = {
      el, svg, spec, parts, view: resolveView(spec, opts.view, opts.size),
      get pose() { return pose; },
      setPose(next, replace = false) {
        pose = replace ? { ...next } : { ...pose, ...next };
        const st = poseState(spec, rig.view.pose ? { ...rig.view.pose, ...pose } : pose);
        for (const k in st.transform) if (parts[k]) parts[k].setAttribute('transform', st.transform[k]);
        for (const k in st.opacity) if (parts[k]) parts[k].setAttribute('opacity', st.opacity[k]);
        for (const t of toggles) {
          if (st.state[t.key] === t.val) t.n.removeAttribute('display');
          else t.n.setAttribute('display', 'none');
        }
        return rig;
      },
    };
    return rig;
  }

  return {
    VERSION, POSE, DEPTH,
    define, get: resolve, list: () => [...registry.keys()], merge,
    render, mount, poseState, resolveView,
    shapes: { pathD, fluffy, star, polyNodes, earNodes, tailNodes, tailBend, shapeNodes, shapeD, ellipse, ellPoint, ellAngle },
    rng, hash, SHADE, shadeOf,
    // The palette a render uses: the spec's colors plus the house shades that the spec refers to.
    palette: specOrName => {
      const spec = resolve(specOrName), P = withShades(spec.palette || {}), used = JSON.stringify(spec);
      return Object.fromEntries(Object.entries(P).filter(([k]) => (spec.palette || {})[k] !== undefined || used.includes(`"${k}"`)));
    },
  };
});
