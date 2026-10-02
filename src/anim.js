/*!
 * phy_friends/anim: clips, composition, and a small player for PhyFriends rigs.
 *
 * A clip is a deterministic function of time, clip(t seconds) -> partial pose,
 * tagged with .duration (in seconds; undefined means endless) and .loop. A
 * looping clip is periodic: clip(t) repeats every duration, so exports loop
 * seamlessly. A non-looping clip holds its end pose after duration. Randomness
 * is seeded (PhyFriends.rng).
 *
 * Partial poses stack like layers: numbers add onto the neutral POSE (blush
 * multiplies), strings (eyes, eyeL, eyeR, mouth, show) are last-wins, undefined
 * leaves the field to lower layers, and null selects the spec default.
 * Afterward, sample() clamps blink and lid to 0..1 and look/turn to -1..1.
 *
 * The clips here are movements (idle, hop, bounce, nod, ...), and the movements
 * of a friend standing (walk, wave, cheer, jump, standUp, sitDown, dance, ...).
 * Feelings, which add a face and a posture to a movement, are in src/emotion.js,
 * which adds its react(), hold() and feel() to what parse() understands (extend()).
 *
 * Example:
 *
 *   const A = PhyFriends.anim;
 *   const tip = A.track({ tilt: [[0, 0], [0.3, 8, 'back'], [1, 8], [1.4, 0]] });
 *   const player = A.play(PhyFriends.mount(el, 'howdi'), A.layer(A.clips.idle, tip));
 *   el.onpointermove = e => player.override(A.lookAt(player.rig, e.clientX, e.clientY));
 *
 * A stack (stack()) holds a friend's timed layers, faded in and out, for a scene
 * (film/scene.js) or a live page (src/live.js).
 *
 * Loads as a classic script after phyfriends.js (PhyFriends.anim), or through require().
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./phyfriends.js'));
  else factory(root.PhyFriends);
})(typeof self !== 'undefined' ? self : this, function (PF) {
  'use strict';

  const TAU = Math.PI * 2;
  const DEG = Math.PI / 180;
  const _ = undefined; // Marks "no value" in string tracks, so lower layers decide.
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const mod = (t, d) => ((t % d) + d) % d;

  // --------------------------------------------------------------- Easing

  const ease = {
    linear: u => u,
    smooth: u => (1 - Math.cos(Math.PI * u)) / 2, // Sine in-out; the default for tracks
    in: u => u * u * u,
    out: u => 1 - (1 - u) ** 3,
    inOut: u => (u < 0.5 ? 4 * u ** 3 : 1 - (2 - 2 * u) ** 3 / 2),
    back: u => 1 + 2.70158 * (u - 1) ** 3 + 1.70158 * (u - 1) ** 2, // Overshoots, then settles
    anticipate: u => 2.70158 * u ** 3 - 1.70158 * u * u,           // Dips back, then advances
    elastic: u => (u <= 0 || u >= 1 ? u : 2 ** (-10 * u) * Math.sin((u * 10 - 0.75) * TAU / 3) + 1),
    bounce: u => {
      const n = 7.5625, d = 2.75;
      if (u < 1 / d) return n * u * u;
      if (u < 2 / d) return n * (u -= 1.5 / d) * u + 0.75;
      if (u < 2.5 / d) return n * (u -= 2.25 / d) * u + 0.9375;
      return n * (u -= 2.625 / d) * u + 0.984375;
    },
    hold: u => (u < 1 ? 0 : 1),
  };
  function easing(e) {
    const f = typeof e === 'function' ? e : ease[e || 'smooth'];
    if (!f) throw new Error(`phy_friends/anim: unknown ease "${e}"`);
    return f;
  }

  // ------------------------------------------------------------ Pose math

  const MULT = { blush: 1 }; // Fields that multiply instead of add
  const RANGE = {
    blink: [0, 1], lid: [0, 1], lidTilt: [-30, 30], widen: [-0.8, 1], flush: [0, 1],
    lookX: [-1, 1], lookY: [-1, 1], turnX: [-1, 1], turnY: [-1, 1], tail: [-45, 45],
    // The standing figure: a crouch drops the hips at most as far as sitting does (the rig holds it there), and a
    // negative one beyond the legs' stretch lifts the feet; rise moves at most a whole stance; an arm reaches from
    // across the chest to straight up; a foot only lifts.
    crouch: [-4, 30], rise: [-1, 1], lean: [-30, 30], armL: [-90, 180], armR: [-90, 180], elbowL: [-150, 150], elbowR: [-150, 150],
    legL: [-30, 60], legR: [-30, 60], stepL: [0, 24], stepR: [0, 24],
  };

  // Stacks partial pose `p` onto `acc` (in place) with weight k; strings apply only when k >= 0.5.
  function combine(acc, p, k = 1) {
    for (const f in p) {
      const v = p[f];
      if (v === undefined) continue;
      if (typeof v !== 'number') { if (k >= 0.5) acc[f] = v; }
      else if (MULT[f]) acc[f] = (acc[f] ?? 1) * (1 + (v - 1) * k);
      else acc[f] = (acc[f] || 0) + v * k;
    }
    return acc;
  }

  // Converts stacked offsets to a full pose.
  function settle(d) {
    const p = { ...PF.POSE };
    for (const f in d) {
      const v = d[f];
      p[f] = typeof v !== 'number' ? v : MULT[f] ? (p[f] ?? 1) * v : (p[f] || 0) + v;
    }
    return tidy(p);
  }
  function tidy(p) {
    for (const f in RANGE) if (typeof p[f] === 'number') p[f] = clamp(p[f], ...RANGE[f]);
    if (p.blush < 0) p.blush = 0;
    for (const f in p) if (typeof p[f] === 'number') p[f] = Math.round(p[f] * 1e4) / 1e4;
    return p;
  }

  // Blends two full poses: numbers interpolate linearly, and strings switch halfway. A change of stance, which would
  // switch at once, is blended as a rise from the first pose's stance instead, so that the friend rises or sinks.
  function mix(a, b, u) {
    const p = { ...a };
    for (const f in b) {
      p[f] = typeof a[f] === 'number' && typeof b[f] === 'number' ? lerp(a[f], b[f], u) : u < 0.5 && f in a ? a[f] : b[f];
    }
    if (a.stance !== b.stance) {
      const up = q => (q.stance === 'stand' ? 1 : 0) + (q.rise || 0);
      Object.assign(p, { stance: a.stance, rise: lerp(up(a), up(b), u) - up({ stance: a.stance }) });
    }
    return p;
  }

  // ---------------------------------------------------------------- Clips

  const tag = (fn, duration, loop) => Object.assign(fn, { duration, loop: !!loop });

  // The wrapped fn only sees t within the clip: looping clips wrap t into [0, duration),
  // and other clips clamp it to [0, duration], holding the end poses.
  function clip(fn, duration, loop = false) {
    if (duration == null) return tag(t => fn(t) || {}, undefined, false);
    return tag(t => fn(loop && duration > 0 ? mod(t, duration) : clamp(t, 0, duration)) || {}, duration, loop);
  }
  const still = (pose, duration) => clip(() => pose, duration);
  const rest = duration => still({}, duration);

  // The spec of the friend for which parse() is evaluating an expression, if any.
  let parsingFor;
  function toClip(c) {
    if (typeof c === 'function') return 'loop' in c ? c : clip(c);
    if (typeof c === 'string') return parse(c, { spec: parsingFor });
    if (c == null) return rest();
    if (typeof c === 'object') return still(c);
    throw new Error(`phy_friends/anim: not a clip: ${c}`);
  }

  // Keyframes: {field: [[t, value, ease], ...]}. The `ease` shapes the segment
  // arriving at that key (default opts.ease || 'smooth'). Numbers interpolate;
  // strings and null step, and are undefined before their first key. When looping,
  // the last key eases back into the first one a period later.
  function track(fields, { duration, loop = false, ease: e } = {}) {
    const tracks = Object.entries(fields).map(([f, ks]) =>
      [f, ks.map(k => (Array.isArray(k) ? k : [k.t, k.v, k.ease])).sort((a, b) => a[0] - b[0])]);
    const end = duration ?? Math.max(0, ...tracks.map(([, ks]) => ks[ks.length - 1][0]));
    const at = (ks, t) => {
      const n = ks.length, wrap = loop ? end : 0;
      let i = 0;
      while (i < n && ks[i][0] <= t) i++;
      let a = ks[i - 1], b = ks[i];
      if (!a) { if (!wrap) return typeof ks[0][1] === 'number' ? ks[0][1] : _; a = [ks[n - 1][0] - wrap, ks[n - 1][1]]; }
      if (!b) { if (!wrap) return a[1]; b = [ks[0][0] + wrap, ks[0][1], ks[0][2]]; }
      if (typeof a[1] !== 'number' || typeof b[1] !== 'number') return a[1];
      const u = clamp((t - a[0]) / (b[0] - a[0] || 1), 0, 1);
      return lerp(a[1], b[1], easing(b[2] || e)(u));
    };
    return clip(t => {
      const out = {};
      for (const [f, ks] of tracks) out[f] = at(ks, t);
      return out;
    }, end, loop);
  }

  // Returns the common period of looping durations (on a millisecond grid), or the longest
  // duration when that period would exceed max(4 x longest, 16 s).
  function period(ds) {
    const gcd = (a, b) => (b ? gcd(b, a % b) : a);
    let L = 1;
    for (const d of ds) { const q = Math.max(1, Math.round(d * 1000)); L = (L / gcd(L, q)) * q; }
    const max = Math.max(...ds);
    return L / 1000 <= Math.max(4 * max, 16) ? L / 1000 : max;
  }

  // Stacks clips from bottom to top. The result loops if every timed clip loops.
  function layer(...cs) {
    cs = cs.map(toClip);
    const ds = cs.filter(c => c.duration != null).map(c => c.duration);
    const loop = ds.length > 0 && cs.every(c => c.duration == null || c.loop);
    return tag(t => cs.reduce((acc, c) => combine(acc, c(t)), {}),
      ds.length ? (loop ? period(ds) : Math.max(...ds)) : undefined, loop);
  }

  // Plays clips one after another; a number stands for a rest of that many seconds.
  function seq(...items) {
    const cs = items.map(c => (typeof c === 'number' ? rest(c) : toClip(c))), at = [];
    let total = 0;
    for (const c of cs) { at.push(total); total += c.duration || 0; }
    return clip(t => {
      let i = cs.length - 1;
      while (i > 0 && t < at[i]) i--;
      return cs[i](t - at[i]);
    }, total);
  }

  // Time remapping.
  const remap = (c, f, duration, loop = false) => (c = toClip(c), tag(t => c(f(t)), duration, loop));
  const loop = (c, duration) => (c = toClip(c), clip(t => c(t), duration ?? c.duration, true));
  const repeat = (c, n) => (c = toClip(c), clip(t => c(t >= n * c.duration ? c.duration : mod(t, c.duration)), n * c.duration));
  const speed = (c, k) => (c = toClip(c), tag(t => c(t * k), c.duration && c.duration / k, c.loop));
  const delay = (c, s) => (c = toClip(c), c.loop ? tag(t => c(t - s), c.duration, true)
    : tag(t => c(Math.max(0, t - s)), c.duration == null ? _ : c.duration + s, false));
  const pingpong = c => (c = toClip(c), clip(t => c(t < c.duration ? t : 2 * c.duration - t), 2 * c.duration, true));
  // Scales a clip's offsets by k (a number or a function of t, e.g., a fade envelope).
  const weight = (c, k) => (c = toClip(c), tag(t => combine({}, c(t), typeof k === 'function' ? k(t) : k), c.duration, c.loop));

  function sample(c, t = 0) { return settle(combine({}, toClip(c)(t))); }

  // Returns poses at t = i / fps for i < seconds * fps. For a looping clip, frame n
  // would equal frame 0, so leaving it out makes the exported loop seamless.
  function frames(c, fps = 30, seconds) {
    c = toClip(c);
    const n = Math.max(1, Math.round((seconds ?? c.duration ?? 1) * fps));
    return Array.from({ length: n }, (_, i) => sample(c, i / fps));
  }

  // Returns the sum of bump-shaped events [[t0, width, amp], ...]; with `wrap`, they wrap
  // around a loop of that length.
  function pulses(events, wrap, shape = blinkShape) {
    const offs = wrap ? [-wrap, 0, wrap] : [0];
    return t => {
      let s = 0;
      for (const [t0, w, a = 1] of events) for (const o of offs) {
        const u = (t - t0 + o) / w;
        if (u > 0 && u < 1) s += a * shape(u);
      }
      return s;
    };
  }
  // Blink profile: fast close, brief hold, slower open.
  const blinkShape = u => (u < 0.3 ? ease.smooth(u / 0.3) : u < 0.42 ? 1 : 1 - ease.smooth((u - 0.42) / 0.58));
  // Damped twitch: out, back past rest, then settle.
  const flickShape = u => Math.sin(u * TAU * 1.5) * (1 - u) ** 2;
  // Tail swish: two swings that grow and then decay.
  const swishShape = u => Math.sin(u * TAU * 2) * Math.sin(Math.PI * u);
  const blinks = (times, duration, loop = true) =>
    (b => clip(t => ({ blink: b(t) }), duration, loop))(pulses(times.map(t => [t, 0.2]), loop && duration));

  // -------------------------------------------------------------- Library
  // Factories in `make` take options; `clips` holds their default instances. Loop
  // lengths divide 8 s, so any of them layered over idle still loops in 8 s.

  const make = {};

  make.idle = ({ seed = 7, duration = 8, energy = 1 } = {}) => {
    const R = PF.rng(seed), nb = Math.max(1, Math.round(duration / 2.7)), ev = [], ears = [[], []];
    for (let t = 0.4 + R() * 1.2; t < duration - 0.9; t += 1.4 + R() * 2.2) {
      ev.push([t, 0.2]);
      if (R() < 0.3) ev.push([t + 0.3, 0.2]); // Double blink
    }
    const nf = R() < 0.5 ? 1 : 2;
    for (let k = 0; k < nf; k++) ears[R() < 0.5 ? 0 : 1].push([(k + 0.15 + R() * 0.6) * duration / nf, 0.55, 14 + R() * 8]);
    const gx = [[0, 0]], gy = [[0, 0]]; // Two small glances
    for (let k = 0; k < 2; k++) {
      const t0 = (k + 0.2 + R() * 0.35) * duration / 2, hold = 0.8 + R() * 0.6;
      const x = (R() < 0.5 ? -1 : 1) * (0.2 + R() * 0.2), y = (R() - 0.6) * 0.3;
      gx.push([t0, 0], [t0 + 0.12, x, 'out'], [t0 + hold, x], [t0 + hold + 0.15, 0, 'out']);
      gy.push([t0, 0], [t0 + 0.12, y, 'out'], [t0 + hold, y], [t0 + hold + 0.15, 0, 'out']);
    }
    const swish = pulses([[(0.15 + R() * 0.6) * duration, 1.2, 6 + R() * 3]], duration, swishShape); // One tail swish
    const blink = pulses(ev, duration), flick = ears.map(e => pulses(e, duration, flickShape));
    return layer(weight(track({ lookX: gx, lookY: gy }, { duration, loop: true }), energy), clip(t => {
      const a = (TAU * t) / duration, b = a * nb; // Phases: a is one cycle per clip, b is breathing
      return {
        squash: 0.014 * energy * Math.sin(b),
        headY: 0.6 * energy * Math.sin(b - 2.2),
        tilt: energy * (1.4 * Math.sin(a + 0.5) + 0.5 * Math.sin(2 * a)),
        turnX: 0.06 * energy * Math.sin(a + 2),
        hair: 1.2 * energy * Math.sin(b - 1.2), // Lags the breath
        earL: 2 * energy * Math.sin(b - 0.6) + flick[0](t),
        earR: 2 * energy * Math.sin(b - 0.9) + flick[1](t),
        tail: energy * (2.5 * Math.sin(a + 1) + Math.sin(b - 2)) + swish(t), // Slow sway that lags the breath
        blink: blink(t),
        // A standing friend's arms lift a little with each breath, and its weight shifts slowly from foot to foot.
        armL: 2.5 * energy * Math.sin(b - 0.4), armR: 2.5 * energy * Math.sin(b - 0.6),
        elbowL: 3 * energy * Math.sin(b - 1.3), elbowR: 3 * energy * Math.sin(b - 1.5),
        lean: 0.8 * energy * Math.sin(a + 1.6),
      };
    }, duration, true));
  };

  make.blink = () => track({ blink: [[0, 0], [0.06, 1, 'in'], [0.09, 1], [0.24, 0, 'out'], [0.3, 0]] });

  make.wink = () => track({
    eyeR: [[0, _], [0.1, 'happy'], [0.8, _]],
    mouth: [[0, _], [0.1, 'smile'], [0.8, _]],
    tilt: [[0, 0], [0.18, 6, 'back'], [0.8, 6], [1.1, 0]],
    earR: [[0, 0], [0.18, -8, 'back'], [0.8, -8], [1.1, 0]],
    squash: [[0, 0], [0.1, 0.03, 'out'], [0.3, 0]],
  }, { duration: 1.2 });

  make.lookAround = () => layer(track({
    lookX: [[0, 0], [0.5, 0], [0.62, -0.9, 'out'], [2.2, -0.9], [2.34, 0.9, 'out'], [4.2, 0.9], [4.34, 0.25, 'out'], [5.7, 0.25], [5.84, 0, 'out']],
    lookY: [[0, 0], [4.2, 0], [4.34, -0.8, 'out'], [5.7, -0.8], [5.84, 0, 'out']],
    turnX: [[0, 0], [0.55, 0], [1.2, -0.55], [2.25, -0.55], [3.0, 0.55], [4.25, 0.55], [4.9, 0.1], [5.75, 0.1], [6.4, 0]],
    turnY: [[0, 0], [4.25, 0], [4.9, -0.4], [5.75, -0.4], [6.4, 0]],
    tilt: [[0, 0], [0.55, 0], [1.2, -3], [2.25, -3], [3.0, 3], [4.25, 3], [4.9, 5], [5.75, 5], [6.4, 0]],
    earL: [[0, 0], [0.55, 0], [1.2, -6], [2.25, -6], [3.0, 3], [4.25, 3], [5.75, 0]],
    earR: [[0, 0], [2.25, 0], [3.0, -6], [4.25, -6], [5.75, 0]],
    hair: [[0, 0], [0.7, 0], [1.3, 1.5], [2.4, 1.5], [3.1, -1.5], [4.4, -1.5], [6.6, 0]],
    tail: [[0, 0], [0.9, 0], [1.6, 4], [2.6, 4], [3.4, -3], [4.6, -3], [5.3, 2], [6.2, 2], [7.2, 0]],
  }, { duration: 8, loop: true }), blinks([2.2, 5.72, 7.1], 8));

  make.nod = () => track({
    turnY: [[0, 0], [0.22, 0.75, 'out'], [0.45, -0.1], [0.67, 0.6, 'out'], [0.95, 0], [1.4, 0]],
    lookY: [[0, 0], [0.22, -0.3, 'out'], [0.45, 0.05], [0.67, -0.25, 'out'], [0.95, 0]],
    headY: [[0, 0], [0.22, 6, 'out'], [0.45, -0.8], [0.67, 5, 'out'], [0.95, 0]],
    y: [[0, 0], [0.22, 1, 'out'], [0.45, 0], [0.67, 0.8, 'out'], [0.95, 0]],
    squash: [[0, 0], [0.22, -0.015, 'out'], [0.45, 0.005], [0.67, -0.01, 'out'], [0.95, 0]],
    earL: [[0, 0], [0.26, -5], [0.5, 2], [0.72, -4], [1.0, 0]],
    earR: [[0, 0], [0.26, -5], [0.5, 2], [0.72, -4], [1.0, 0]],
    hair: [[0, 0], [0.26, 1.5], [0.5, -1], [0.72, 1], [1.0, 0]],
  }, { duration: 1.4 });

  make.shake = () => track({
    turnX: [[0, 0], [0.14, -0.6], [0.36, 0.6], [0.58, -0.5], [0.8, 0.35], [1.0, -0.1], [1.2, 0]],
    lookX: [[0, 0], [0.14, -0.3], [0.36, 0.3], [0.58, -0.25], [0.8, 0.15], [1.0, 0]],
    headX: [[0, 0], [0.14, -3], [0.36, 3], [0.58, -2.5], [0.8, 1.5], [1.0, 0]],
    tilt: [[0, 0], [0.14, -2.5], [0.36, 2.5], [0.58, -2], [0.8, 1.2], [1.0, 0]],
    hair: [[0, 0], [0.2, 2.5], [0.42, -2.5], [0.64, 2], [0.86, -1.2], [1.1, 0.4], [1.3, 0]],
    earL: [[0, 0], [0.2, 6], [0.42, -4], [0.64, 5], [0.86, -2], [1.1, 0]],
    earR: [[0, 0], [0.2, -4], [0.42, 6], [0.64, -3], [0.86, 3], [1.1, 0]],
  }, { duration: 1.4 });

  // Bounces on the spot, ears flapping and tail wagging: the motion of a hop for joy (the emotion
  // library's happy reaction, which adds the face, and the gallery's hi). A standing friend throws its
  // arms up beside its head, tucks its feet up in the air and bends its knees as it lands.
  make.bounce = ({ duration = 1.1, bounces = 2, height = 10, wags = 3 } = {}) => clip(t => {
    const T = duration / bounces, u = mod(t, T) / T, a = (TAU * t) / duration;
    const air = 4 * u * (1 - u), contact = Math.exp(-((Math.min(u, 1 - u) / 0.09) ** 2));
    const arms = 80 + 20 * air, elbows = 25 + 10 * Math.sin(TAU * u);
    return {
      y: -height * air,
      squash: -0.07 * contact + 0.05 * Math.abs(1 - 2 * u) * (1 - contact),
      tilt: 4 * Math.sin(a),
      hair: -2.5 * Math.sin(a - 0.8),
      turnY: -0.12 * air,
      headY: 2.5 * contact,
      earL: -7 + 12 * contact, earR: -7 + 12 * contact,
      tail: -2 + 9 * Math.sin(wags * a + 0.6), // Brisk wag, held slightly high
      armL: arms, armR: arms, elbowL: elbows, elbowR: elbows,
      stepL: 4 * air, stepR: 4 * air, crouch: 6 * contact,
    };
  }, duration, true);

  // One-shot tail wag that grows and then decays, with a small matching head sway.
  make.wag = ({ duration = 1.6, wags = 3, amp = 10 } = {}) => clip(t => {
    const u = t / duration, env = Math.sin(Math.PI * u), w = TAU * wags * u;
    return { tail: env * (amp * Math.sin(w) - 2), tilt: 1.5 * env * Math.sin(w - 1.2), hair: -env * Math.sin(w - 1.8) };
  }, duration);

  make.hop = ({ height = 22 } = {}) => track({
    squash: [[0, 0], [0.18, -0.12, 'out'], [0.26, 0.1, 'out'], [0.5, 0.01], [0.68, 0.07, 'in'], [0.74, -0.11, 'out'], [0.9, 0.03], [1.05, 0]],
    y: [[0, 0], [0.18, 1], [0.24, 0], [0.5, -height, 'out'], [0.72, 0, 'in'], [1.05, 0]],
    earL: [[0, 0], [0.18, 6], [0.3, 16, 'out'], [0.5, 2], [0.7, -8], [0.8, 12, 'out'], [0.95, -3], [1.1, 0]],
    earR: [[0, 0], [0.18, 6], [0.32, 17, 'out'], [0.52, 2], [0.7, -7], [0.82, 11, 'out'], [0.97, -3], [1.1, 0]],
    hair: [[0, 0], [0.26, -2.5], [0.5, 2], [0.76, -2], [0.9, 1.5], [1.1, 0]],
    tail: [[0, 0], [0.18, -3], [0.32, 7, 'out'], [0.52, -4], [0.72, 5], [0.84, -6, 'out'], [0.98, 2], [1.15, 0]], // Lags the body
    turnY: [[0, 0], [0.18, 0.15], [0.5, -0.2], [0.75, 0.1], [1.0, 0]],
    headY: [[0, 0], [0.18, 2], [0.28, 3], [0.5, -1], [0.72, -1.5], [0.8, 4, 'out'], [0.95, -0.5], [1.1, 0]],
    blink: [[0, 0], [0.14, 0], [0.18, 0.5], [0.24, 0], [0.72, 0], [0.76, 0.6], [0.86, 0]],
  }, { duration: 1.2 });

  make.talk = ({ seed = 3, duration = 2, rate = 7 } = {}) => {
    const R = PF.rng(seed), n = Math.round(duration * rate), shapes = ['o', 'w', 'smile', 'o', 'v'];
    const mouth = [], bob = [];
    for (let i = 0; i < n; i++) {
      const pause = R() < 0.15;
      mouth.push([i / rate, pause ? 'none' : shapes[Math.floor(R() * shapes.length)]]);
      bob.push([i / rate, pause ? 0 : 0.6 + R() * 1.2]);
    }
    return layer(track({ mouth }, { duration: n / rate, loop: true }), track({ headY: bob }, { duration: n / rate, loop: true }),
      clip(t => ({ tilt: 2 * Math.sin((TAU * t) / (n / rate)), tail: 2 * Math.sin((TAU * t) / (n / rate) + 1.5) }), n / rate, true));
  };

  // ------------------------------------------------------------ Standing
  // Movements of a friend's standing figure (spec.stand). A seated friend has its limbs folded, so it shows only
  // what they do with the head, ears and tail: lay them over a standing pose ("layer(still({ stance: 'stand' }), walk)");
  // standUp and sitDown ease rise over the stance laid under them, and a scene changes its stance once they end. The
  // arms are drawn in front of the scarf and the head, but for the shoulder, which tucks under them; `over` draws an
  // arm whole in front, shoulder too.

  // A standing friend's walk: seconds a step, how far a step carries it (length, in head units: legs this short
  // take small steps), how high a foot lifts, how far the arms swing (degrees), the lean onto the planted foot
  // (degrees), the stretch as the body passes over that foot, and a leg at rest, from the hip to the ankle: how
  // far out and how far down it reaches, with which walking() keeps a planted foot still. The leg is the
  // template's, worked out from PhyFriends.STAND_DEFAULT and STAND_FIT: from hips hipUp above the body's base, it
  // shows `legs` below the base, down to an ankle `ankle` above the ground. A friend's own follows from its
  // spec.stand.
  const WALK = Object.freeze({
    seconds: 0.25, length: 12, height: 7, swing: 14, lean: 3, squash: 0.02,
    leg: Object.freeze([PF.STAND_DEFAULT.legs.spread, PF.STAND_FIT.legs + PF.STAND_FIT.hipUp - PF.STAND_DEFAULT.legs.ankle]),
  });

  // The walk at p steps in (p = 1 ends the first step). The right foot lifts in the even steps and the left in
  // the odd ones, or the other way round when first is -1; the weight shifts onto the planted foot, the arms
  // swing against the legs, and the body stretches as it passes over the planted foot. follow scales what
  // follows the body a little late (by the phase given, in radians): the head, the ears, the hair and the tail.
  function stepping(p, { height, swing, lean, squash } = WALK, { first = 1, follow = 1 } = {}) {
    const a = Math.PI * p, q = first * Math.sin(a);
    const sway = late => follow * first * Math.sin(a - late), bob = late => follow * Math.cos(2 * a - late);
    return {
      stepL: height * Math.max(0, -q), stepR: height * Math.max(0, q),
      lean: -lean * q,
      armL: swing * q, armR: -swing * q, elbowL: 0.5 * swing * q, elbowR: -0.5 * swing * q,
      squash: squash * q * q,
      tilt: -1.5 * sway(0.6), hair: -1.2 * sway(0.9), tail: 5 * sway(1.1),
      headY: 0.8 * bob(0.5), earL: 3 * bob(0.8), earR: 3 * bob(1),
    };
  }

  // Walks on the spot, two steps a loop. walking() is the same walk going somewhere.
  make.walk = ({ duration = 2 * WALK.seconds, ...gait } = {}) =>
    clip(t => stepping((2 * t) / duration, { ...WALK, ...gait }), duration, true);

  // The side ('L' or 'R', the viewer's) away from a friend's tail, where a raised arm shows best (PF.freeSide): 'R'
  // without a spec. parse() gives a clip the spec of the friend that plays it.
  const freeSide = spec => (spec == null ? 'R' : PF.freeSide(spec));

  // Waves hello with one arm (side 'L' or 'R', the viewer's; by default the one away from the tail of the
  // friend whose spec is given), held out low to the side with the paw beside the cheek and the elbow
  // rocking; the head tips toward the paw and the body leans a little away.
  make.wave = ({ spec, side = freeSide(spec), waves = 3, rate = 0.36 } = {}) => {
    const rise = 0.3, fall = 0.35, duration = rise + waves * rate + fall, d = side === 'L' ? -1 : 1;
    return clip(t => {
      const up = t < rise ? ease.back(t / rise) : t > duration - fall ? 1 - ease.smooth((t - duration + fall) / fall) : 1;
      const rock = Math.sin((TAU * Math.max(0, t - rise)) / rate);
      return {
        [`arm${side}`]: 70 * up, [`elbow${side}`]: up * (55 + 32 * rock),
        tilt: 5 * d * up, lean: -2 * d * up, earL: -5 * up, earR: -5 * up,
        tail: up * 6 * Math.sin((TAU * t) / 0.6), hair: -1.5 * d * up,
      };
    }, duration);
  };

  // Throws both arms up beside the head with a little hop, and shakes them for joy.
  make.cheer = ({ height = 12 } = {}) => track({
    crouch: [[0, 0], [0.14, 7], [0.26, -2, 'out'], [0.42, 0], [0.5, 6, 'out'], [0.8, 0]],
    y: [[0, 0], [0.2, 0], [0.33, -height, 'out'], [0.46, 0, 'in']],
    squash: [[0, 0], [0.14, -0.04], [0.24, 0.05, 'out'], [0.4, 0.01], [0.48, -0.05, 'out'], [0.8, 0]],
    armL: [[0, 0], [0.14, -8], [0.32, 100, 'back'], [0.95, 100], [1.4, 0]],
    armR: [[0, 0], [0.14, -8], [0.32, 100, 'back'], [0.95, 100], [1.4, 0]],
    elbowL: [[0, 0], [0.32, 25, 'back'], [0.47, 45], [0.62, 15], [0.77, 45], [0.95, 25], [1.4, 0]],
    elbowR: [[0, 0], [0.32, 25, 'back'], [0.47, 45], [0.62, 15], [0.77, 45], [0.95, 25], [1.4, 0]],
    stepL: [[0, 0], [0.24, 0], [0.33, 5], [0.45, 0]],
    stepR: [[0, 0], [0.24, 0], [0.33, 5], [0.45, 0]],
    earL: [[0, 0], [0.14, 5], [0.3, -12, 'out'], [0.48, -4], [0.56, 6, 'out'], [0.8, -6], [1.4, 0]],
    earR: [[0, 0], [0.14, 5], [0.3, -12, 'out'], [0.48, -4], [0.56, 6, 'out'], [0.8, -6], [1.4, 0]],
    tail: [[0, 0], [0.3, -8, 'out'], [0.6, 6], [0.9, -6], [1.2, 2], [1.4, 0]],
    tilt: [[0, 0], [0.5, 0], [0.65, 4], [0.85, -4], [1.05, 2], [1.4, 0]],
    headY: [[0, 0], [0.14, 2], [0.3, -1.5], [0.5, 3, 'out'], [0.7, 0]],
    hair: [[0, 0], [0.3, -2], [0.5, 2], [0.7, -1], [0.9, 0]],
    turnY: [[0, 0], [0.3, -0.15], [0.7, 0]],
  }, { duration: 1.4 });

  // Jumps: crouches, springs up with its arms flung up and its feet tucked under it, and lands in a crouch.
  make.jump = ({ height = 32 } = {}) => track({
    crouch: [[0, 0], [0.24, 14], [0.32, -3, 'in'], [0.42, 0], [0.72, 0], [0.78, 13, 'out'], [1.15, 0]],
    y: [[0, 0], [0.3, 0], [0.52, -height, 'out'], [0.74, 0, 'in']],
    squash: [[0, 0], [0.24, -0.05], [0.32, 0.07, 'out'], [0.5, 0], [0.73, 0.03], [0.78, -0.08, 'out'], [1.1, 0]],
    stepL: [[0, 0], [0.32, 0], [0.46, 12, 'out'], [0.62, 9], [0.73, 0, 'in']],
    stepR: [[0, 0], [0.32, 0], [0.46, 12, 'out'], [0.62, 9], [0.73, 0, 'in']],
    legL: [[0, 0], [0.32, 0], [0.46, 8], [0.73, 0]],
    legR: [[0, 0], [0.32, 0], [0.46, 8], [0.73, 0]],
    armL: [[0, 0], [0.24, -15], [0.36, 95, 'out'], [0.55, 80], [0.74, 30], [0.84, 45], [1.15, 0]],
    armR: [[0, 0], [0.24, -15], [0.36, 95, 'out'], [0.55, 80], [0.74, 30], [0.84, 45], [1.15, 0]],
    elbowL: [[0, 0], [0.24, -10], [0.36, 30, 'out'], [0.74, 10], [1.15, 0]],
    elbowR: [[0, 0], [0.24, -10], [0.36, 30, 'out'], [0.74, 10], [1.15, 0]],
    earL: [[0, 0], [0.24, 6], [0.36, 16, 'out'], [0.55, -6], [0.74, -8], [0.8, 14, 'out'], [0.95, -3], [1.15, 0]],
    earR: [[0, 0], [0.24, 6], [0.38, 17, 'out'], [0.57, -6], [0.74, -7], [0.82, 13, 'out'], [0.97, -3], [1.15, 0]],
    tail: [[0, 0], [0.24, -3], [0.38, 8, 'out'], [0.58, -5], [0.78, 6], [0.9, -5, 'out'], [1.05, 2], [1.2, 0]], // Lags the body
    headY: [[0, 0], [0.24, 3], [0.34, -2], [0.55, -1], [0.74, -1.5], [0.8, 5, 'out'], [0.95, -0.5], [1.1, 0]],
    hair: [[0, 0], [0.32, -3], [0.55, 2.5], [0.78, -2.5], [0.95, 1.5], [1.15, 0]],
    turnY: [[0, 0], [0.24, 0.15], [0.5, -0.2], [0.75, 0.1], [1, 0]],
    blink: [[0, 0], [0.74, 0], [0.78, 0.6], [0.88, 0]],
  }, { duration: 1.2 });

  // A change of stance eases `rise`, which the rig adds to the stance (sit 0, stand 1), so that the friend rises or
  // sinks through every height between, unfolding or folding its limbs.

  // Stands up from sitting (over a seated stance): squashes down where it sits, rises through every height with
  // its arms a little out, goes a little past upright, and settles. It ends with rise 1, standing; the scene that
  // plays it changes the stance itself, which is what reduced motion keeps.
  make.standUp = () => track({
    rise: [[0, 0], [0.18, 0], [0.76, 1, 'inOut'], [1, 1]],
    crouch: [[0, 0], [0.76, 0], [0.86, -2.5, 'out'], [1, 0]],
    squash: [[0, 0], [0.16, -0.045, 'inOut'], [0.45, 0.02], [0.76, 0], [0.86, 0.025, 'out'], [1, 0]],
    armL: [[0, 0], [0.3, 0], [0.6, 12], [0.95, 0]],
    armR: [[0, 0], [0.3, 0], [0.6, 12], [0.95, 0]],
    headY: [[0, 0], [0.18, 1.5], [0.5, -1], [0.86, 0.5], [1, 0]],
    earL: [[0, 0], [0.18, 6], [0.5, 10], [0.86, -6, 'out'], [1, 0]],
    earR: [[0, 0], [0.2, 6], [0.52, 10], [0.88, -5, 'out'], [1, 0]],
    tail: [[0, 0], [0.2, -3], [0.6, 6, 'out'], [0.86, -3], [1, 0]],
    hair: [[0, 0], [0.2, 1], [0.55, -2], [0.86, 0.8], [1, 0]],
  }, { duration: 1 });

  // Sits down from standing (over a standing stance): sinks through every height with its arms a little out,
  // and plops down onto its seat. It ends with rise -1, sitting.
  make.sitDown = () => track({
    rise: [[0, 0], [0.1, 0], [0.7, -1, 'inOut'], [1, -1]],
    squash: [[0, 0], [0.1, -0.015], [0.5, 0.01], [0.72, -0.06, 'in'], [0.86, 0.015, 'out'], [1, 0]],
    armL: [[0, 0], [0.15, 0], [0.45, 12], [0.75, 0]],
    armR: [[0, 0], [0.15, 0], [0.45, 12], [0.75, 0]],
    headY: [[0, 0], [0.3, 1], [0.74, 3], [1, 0]],
    earL: [[0, 0], [0.3, 4], [0.76, 11, 'out'], [0.9, -3], [1, 0]],
    earR: [[0, 0], [0.32, 4], [0.78, 10, 'out'], [0.92, -3], [1, 0]],
    tail: [[0, 0], [0.3, -3], [0.76, 7, 'out'], [0.9, -2], [1, 0]],
    hair: [[0, 0], [0.3, -1], [0.76, 2], [0.92, -0.5], [1, 0]],
  }, { duration: 1 });

  // Dances on the spot: sways from side to side, tapping the free foot out and back in on each beat, with
  // both arms swinging the way it sways and a bob on every beat. One loop is four beats.
  make.dance = ({ duration = 2 } = {}) => clip(t => {
    const a = (TAU * t) / duration, s = Math.sin(a), tap = Math.abs(Math.sin(2 * a)), beat = Math.cos(2 * a) ** 2;
    return {
      lean: 5 * s,
      stepL: s > 0 ? 6 * tap : 0, stepR: s < 0 ? 6 * tap : 0,
      legL: 14 * Math.max(0, s), legR: 14 * Math.max(0, -s),
      armL: 70 - 35 * s, armR: 70 + 35 * s,
      elbowL: 30 + 15 * Math.sin(2 * a), elbowR: 30 - 15 * Math.sin(2 * a),
      crouch: 3 * beat, squash: -0.015 * beat,
      tilt: 6 * Math.sin(a - 0.4), headY: 1.2 * Math.cos(4 * a - 1),
      earL: 4 * Math.cos(4 * a - 1.2), earR: 4 * Math.cos(4 * a - 1.4),
      hair: -2 * Math.sin(a - 0.8), tail: 8 * Math.sin(a - 1) + 2 * Math.sin(4 * a - 1.5),
    };
  }, duration, true);

  // Stretches: rises with its arms thrown up and out and its head back, leans one way and the other, and
  // settles again.
  make.stretch = () => track({
    squash: [[0, 0], [0.3, -0.02], [0.7, 0.05], [1.7, 0.05], [2, -0.02], [2.4, 0]],
    crouch: [[0, 0], [0.3, 3], [0.7, -3], [1.7, -3], [2, 2], [2.4, 0]],
    armL: [[0, 0], [0.3, -10], [0.75, 100, 'out'], [1.7, 105], [2.1, 0]],
    armR: [[0, 0], [0.3, -10], [0.75, 100, 'out'], [1.7, 105], [2.1, 0]],
    elbowL: [[0, 0], [0.75, 15], [1.7, 10], [2.1, 0]],
    elbowR: [[0, 0], [0.75, 15], [1.7, 10], [2.1, 0]],
    lean: [[0, 0], [0.8, 0], [1.1, -5], [1.45, 5], [1.75, 0]],
    turnY: [[0, 0], [0.7, -0.3], [1.7, -0.3], [2.1, 0]],
    headY: [[0, 0], [0.7, -1.5], [1.7, -1.5], [2, 1.5], [2.4, 0]],
    earL: [[0, 0], [0.7, 10], [1.7, 10], [2, -3], [2.4, 0]],
    earR: [[0, 0], [0.7, 10], [1.7, 10], [2.05, -3], [2.4, 0]],
    tail: [[0, 0], [0.7, -6], [1.7, -6], [2, 4], [2.4, 0]],
  }, { duration: 2.4 });

  // Points with one arm (side and spec as for wave) held out straight to the side for `hold` seconds, the
  // head tipping and the body leaning toward it. Where the friend looks is the scene's to say.
  make.point = ({ spec, side = freeSide(spec), hold = 1.2 } = {}) => {
    const out = 0.3, back = 0.4, end = out + hold + back, d = side === 'L' ? -1 : 1;
    const held = v => [[0, 0], [out, v, 'back'], [out + hold, v], [end, 0]];
    return track({ [`arm${side}`]: held(80), lean: held(2 * d), tilt: held(3 * d), earL: held(-3), earR: held(-3) }, { duration: end });
  };

  const clips = {};
  for (const k in make) clips[k] = make[k]();
  // In an expression, a library clip's name is that clip, and called with options (or none) it makes one, as make
  // does: "wave" is the clip, and "wave({ spec: 'terry' })" is make.wave({ spec: 'terry' }). Given the spec of the
  // friend that plays it, each is made for that friend: "wave" waves with the arm away from its tail.
  function callables(spec) {
    const out = {};
    for (const k in clips) {
      const own = spec == null ? clips[k] : make[k]({ spec });
      out[k] = tag(arg => (typeof arg === 'number' ? own(arg) : make[k]({ spec, ...arg })), own.duration, own.loop);
    }
    return out;
  }
  const callable = callables();

  // Names that other modules add to what parse() understands (see extend()).
  const vocabulary = {};

  // Adds functions or clips to parse()'s scope under the given names, as src/emotion.js adds react,
  // hold and feel, so that an expression such as "layer(idle, hold('content'))" can use them. A function takes its
  // options last, as an object, so that parse() can give it the spec of the friend that plays the expression.
  function extend(names) {
    for (const name in names) {
      if (name in api || name in clips) throw new Error(`phy_friends/anim: "${name}" is already a name in PhyFriends.anim`);
    }
    Object.assign(vocabulary, names);
    return api;
  }

  // The names parse() understands, made for the friend whose spec is given: every factory among them takes the spec
  // with its own options, so that the friend that plays an expression need not be named in it.
  function scopeFor(spec) {
    if (spec == null) return { ...api, ...callable, ...vocabulary };
    const bound = {};
    for (const name in vocabulary) {
      const f = vocabulary[name];
      bound[name] = typeof f === 'function' && !('loop' in f) ? (first, options = {}) => f(first, { spec, ...options }) : f;
    }
    return { ...api, ...callables(spec), ...bound };
  }

  // Accepts a clip name, a JS expression over this API, the clips and the names added by extend()
  // (e.g., "layer(idle, hold('curious'))"), or a clip; with { spec }, it makes every clip and feeling in it for that
  // friend, as a scene or a page does for the friend that plays it. Expressions are evaluated with Function(), so
  // never pass untrusted input.
  function parse(expr, { spec } = {}) {
    if (typeof expr !== 'string') return toClip(expr);
    if (clips[expr]) return spec == null ? clips[expr] : make[expr]({ spec });
    const scope = scopeFor(spec), outer = parsingFor;
    parsingFor = spec;  // So that a clip named in quotes within the expression ("layer('wave', idle)") is the friend's too.
    try {
      return toClip(Function(...Object.keys(scope), `'use strict'; return (${expr});`)(...Object.values(scope)));
    } finally {
      parsingFor = outer;
    }
  }

  // --------------------------------------------------------------- Stacks

  const STACK_FADE = 0.15; // Default fade in and out of a layer on a stack, in seconds.

  // A friend's timed layers, for a scene or a live page. Each layer is a clip that plays from `at`
  // until `until` (by default until the clip ends, or for ever if it loops or never ends), faded in
  // and out over `fade` seconds and scaled by `weight`; its time starts at `at`. sample(t) combines
  // the layers that are on at t, in the order they were added, into a partial pose. Under reduced
  // motion (sample(t, { reduced: true })) only the face changes (faceOnly()), and nothing moves.
  function stack() {
    const layers = [];
    const envelope = (layer, t) => {
      if (t < layer.at || t >= layer.end) return 0;
      if (!(layer.fade > 0)) return 1;
      return Math.min(1, (t - layer.at) / layer.fade, (layer.end - t) / layer.fade);
    };
    const self = {
      get layers() { return layers.slice(); },
      add(c, { at = 0, until, fade = STACK_FADE, weight = 1 } = {}) {
        c = toClip(c);
        const end = until ?? (c.loop || c.duration == null ? Infinity : at + c.duration);
        const layer = { clip: c, at, end, fade, weight };
        layers.push(layer);
        return layer;
      },
      // Ends a layer at t: it fades out from there over its fade.
      release(layer, t) {
        layer.end = Math.min(layer.end, t + (layer.fade > 0 ? layer.fade : 0));
        return self;
      },
      // How much of a layer shows at t, from 0 to 1, before its weight.
      envelope,
      sample(t, { reduced = false } = {}) {
        const acc = {};
        for (const layer of layers) {
          const k = envelope(layer, t);
          if (k <= 0) continue;
          const partial = layer.clip(t - layer.at);
          combine(acc, reduced ? faceOnly(partial) : partial, k * layer.weight);
        }
        return acc;
      },
      // Whether any layer is on at t.
      active(t) {
        return layers.some(layer => envelope(layer, t) > 0);
      },
      // Forgets the layers that ended before t.
      prune(t) {
        for (let i = layers.length - 1; i >= 0; i--) if (layers[i].end < t) layers.splice(i, 1);
        return self;
      },
    };
    return self;
  }

  // The fields that change a face without moving anything: besides the eye and mouth shapes (the
  // strings), the lids and the blush. A prop brought out on cue (show) is not the face, and nor are
  // arms drawn whole in front of everything (over), which only a raised arm needs. A stance is the story, not a
  // movement, so a friend that a scene stands up stays standing.
  const FACE = ['lid', 'lidTilt', 'flush', 'blush'];
  const CUES = ['show', 'over'];

  // The face of a partial pose alone, as reduced motion shows it, with its stance.
  function faceOnly(partial) {
    const out = {};
    for (const key in partial) {
      if ((typeof partial[key] !== 'number' && !CUES.includes(key)) || FACE.includes(key)) out[key] = partial[key];
    }
    return out;
  }

  // --------------------------------------------------------------- Player

  const players = new Set();
  let raf = 0, last = 0;
  function frame(now) {
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    let busy = false;
    last = now; raf = 0;
    for (const p of players) busy = p._tick(dt) || busy;
    if (busy) raf = requestAnimationFrame(frame);
    else last = 0;
  }
  const wake = () => { if (!raf && typeof requestAnimationFrame === 'function') raf = requestAnimationFrame(frame); };

  // Drives a mounted rig. Options: speed, loop (default true), autoplay (true),
  // start (s), reducedMotion (true: honor prefers-reduced-motion by not
  // autoplaying), smooth (override easing, s), fade (clip crossfade, s),
  // mode ('add' | 'set': how overrides combine with the clip), onFrame, and onEnd.
  function play(rig, c, opts = {}) {
    const o = { speed: 1, loop: true, autoplay: true, reducedMotion: true, smooth: 0.12, fade: 0.25, mode: 'add', ...opts };
    const mq = o.reducedMotion && typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
    const live = {}; // Override field -> {v, tv, w, tw, mode}: value, target value, weight, target weight
    let cur = toClip(c), time = o.start || 0, playing = false, pose = null, from = null, fadeT = 0, fadeD = 0;

    const loops = () => cur.duration > 0 && (cur.loop || p.loop);
    function draw() {
      let q = settle(combine({}, cur(time)));
      if (from) q = mix(from, q, ease.smooth(Math.min(1, fadeT / fadeD)));
      for (const f in live) {
        const { v, w, mode } = live[f];
        if (typeof v !== 'number') { if (w >= 0.5) q[f] = v; }
        else if (mode === 'set') q[f] = lerp(typeof q[f] === 'number' ? q[f] : 0, v, w);
        else q[f] = MULT[f] ? (q[f] ?? 1) * (1 + (v - 1) * w) : (q[f] || 0) + v * w;
      }
      pose = tidy(q);
      rig.setPose(pose, true);
      if (o.onFrame) o.onFrame(p);
    }
    const onMotion = e => (e.matches ? p.pause() : o.autoplay && p.play());

    const p = {
      rig, speed: o.speed, loop: o.loop,
      get clip() { return cur; },
      get time() { return time; },
      get duration() { return cur.duration; },
      get playing() { return playing; },
      get pose() { return pose; },
      get reduced() { return !!(mq && mq.matches); },
      play() {
        if (!loops() && cur.duration != null && time >= cur.duration) time = 0;
        playing = true; wake(); return p;
      },
      pause() { playing = false; return p; },
      toggle() { return playing ? p.pause() : p.play(); },
      seek(t) { time = loops() ? mod(t, cur.duration) : clamp(t, 0, cur.duration ?? Infinity); from = null; draw(); return p; },
      setClip(next, { fade = o.fade, start = 0 } = {}) {
        from = fade > 0 && pose ? pose : null; fadeT = 0; fadeD = fade;
        cur = toClip(next); time = start; draw(); wake(); return p;
      },
      // Adds a live layer on top of the clip, eased by opts.smooth; null or undefined removes a field.
      override(partial, mode = o.mode) {
        for (const f in partial) {
          const v = partial[f], s = live[f];
          if (v == null) { if (s) s.tw = 0; } else if (s) Object.assign(s, { tv: v, tw: 1, mode });
          else live[f] = { v, tv: v, w: 0, tw: 1, mode };
        }
        wake(); return p;
      },
      clearOverride() { for (const f in live) live[f].tw = 0; wake(); return p; },
      destroy() { players.delete(p); playing = false; if (mq && mq.removeEventListener) mq.removeEventListener('change', onMotion); },
      _tick(dt) {
        let moving = false;
        if (playing) {
          time += dt * p.speed;
          if (loops()) time = mod(time, cur.duration);
          else if (cur.duration != null && (time >= cur.duration || time < 0)) {
            time = clamp(time, 0, cur.duration); playing = false;
            if (o.onEnd) o.onEnd(p);
          }
        }
        const a = o.smooth > 0 ? 1 - Math.exp(-dt / o.smooth) : 1;
        for (const f in live) {
          const s = live[f];
          s.v = typeof s.tv === 'number' ? s.v + (s.tv - s.v) * a : s.tv;
          s.w += (s.tw - s.w) * a;
          if (Math.abs(s.tw - s.w) > 1e-3 || (typeof s.tv === 'number' && Math.abs(s.tv - s.v) > 1e-3)) moving = true;
          else { s.v = s.tv; s.w = s.tw; if (!s.tw) delete live[f]; }
        }
        if (from && (fadeT += dt) >= fadeD) from = null;
        if (playing || moving || from) draw();
        return playing || moving || !!from;
      },
    };
    if (mq && mq.addEventListener) mq.addEventListener('change', onMotion);
    players.add(p);
    draw();
    if (o.autoplay && !p.reduced) p.play();
    return p;
  }

  // ------------------------------------------------------------ Travel

  // A friend seated gets about by hopping (FWIENDS.md): each hop is a crouch, a flight and a
  // landing crouch. length is a hop's usual reach in head units, height its usual height, crouch the
  // share of a hop spent crouching at each end, and lean the tilt in flight toward the way it goes.
  const HOP = Object.freeze({ length: 80, seconds: 0.34, height: 26, crouch: 0.15, squash: 0.08, lean: 4 });

  // How far through `hops` equal hops a friend is at u (0 to 1): along, the share of the distance
  // covered; lift, the share of a hop's height it is off the ground; squash; and lean, in degrees
  // toward the way it goes.
  function hopping(u, hops) {
    const i = Math.min(hops - 1, Math.floor(u * hops)), v = u * hops - i;
    const c = HOP.crouch, air = clamp((v - c) / (1 - 2 * c), 0, 1);
    const squash = v < c ? -HOP.squash * Math.sin(Math.PI * v / c)
      : v > 1 - c ? -HOP.squash * Math.sin(Math.PI * (v - 1 + c) / c)
        : HOP.squash * 0.5 * Math.sin(Math.PI * air);
    return { along: (i + ease.smooth(air)) / hops, lift: Math.sin(Math.PI * air), squash, lean: HOP.lean * Math.sin(Math.PI * air) };
  }

  // A friend standing walks instead (WALK). Facing us, it goes sideways: the foot on the side it goes to
  // steps out and the other one closes up to it, so the steps come in pairs (an odd number of steps gets one
  // more). How far through `steps` steps a friend is at u (0 to 1), going `distance` head units (negative: to
  // the viewer's left): along, the share of the distance covered, which eases in over the first step and out
  // over the last; and pose, the partial pose of the walk there (a standing one: the feet, the arms, the lean).
  // Each leg (at rest, `leg` out and down from its hip; see WALK) swings so that its foot stays where it was
  // planted while the body moves on over it; the body drops by as much as that swing lifts a planted foot (y).
  function walking(u, steps, { distance = 0, leg = WALK.leg } = {}) {
    const n = 2 * Math.max(1, Math.ceil(steps / 2)), p = clamp(u, 0, 1) * n, k = Math.min(n - 1, Math.floor(p)), v = p - k;
    const dir = distance < 0 ? -1 : 1, stride = (2 * Math.abs(distance)) / n;  // How far a foot moves in a step
    const start = w => w * w * (2 - w);  // Eases from rest into the walk's pace over a step
    const progress = k === 0 ? start(v) : k === n - 1 ? n - start(1 - v) : k + v;  // In steps
    const body = (progress * stride) / 2, from = Math.floor(k / 2) * stride;
    const lead = dir > 0 ? 'R' : 'L', trail = dir > 0 ? 'L' : 'R', [moving, planted] = k % 2 ? [trail, lead] : [lead, trail];
    const offset = {  // How far each foot is ahead of where it rests under the body, in head units.
      [moving]: from + stride * ease.smooth(v) - body,
      [planted]: from + (k % 2) * stride - body,
    };
    const [out, down] = leg, reach = Math.hypot(out, down), slant = Math.atan2(out, down);
    const swing = side => Math.asin(clamp((out + (side === 'R' ? 1 : -1) * dir * offset[side]) / reach, -0.95, 0.95)) - slant;
    const lift = a => down * (1 - Math.cos(a)) + out * Math.sin(a);
    const pose = stepping(p, WALK, { first: dir, follow: ease.smooth(clamp(Math.min(p, n - p), 0, 1)) });
    Object.assign(pose, { legL: swing('L') / DEG, legR: swing('R') / DEG, y: lift(swing(planted)) });
    return { along: progress / n, pose };
  }

  // A pose seen in a mirror: what turns one way turns the other (MIRROR.turned), and each part of a pair changes
  // places with the other (MIRROR.paired), so that a reaction toward the viewer's left plays toward the right. The
  // tail stays on its side of the body, as it would on the friend turned round.
  const MIRROR = {
    turned: ['x', 'headX', 'tilt', 'lookX', 'turnX', 'lean', 'hair'],
    paired: [['earL', 'earR'], ['eyeL', 'eyeR'], ['armL', 'armR'], ['elbowL', 'elbowR'], ['legL', 'legR'], ['stepL', 'stepR']],
  };
  function mirror(clip) {
    clip = toClip(clip);
    return tag(t => {
      const pose = { ...clip(t) };
      for (const key of MIRROR.turned) if (typeof pose[key] === 'number') pose[key] = -pose[key];
      for (const [a, b] of MIRROR.paired) {
        const [left, right] = [pose[a], pose[b]];
        delete pose[a]; delete pose[b];
        if (right !== undefined) pose[a] = right;
        if (left !== undefined) pose[b] = left;
      }
      if (typeof pose.over === 'string') pose.over = pose.over.replace(/arm([LR])/g, (m, S) => `arm${S === 'L' ? 'R' : 'L'}`);
      return pose;
    }, clip.duration, clip.loop);
  }

  // A friend's own idle: the same every time for that friend, and out of step with every other friend's.
  const idleOf = (name, options = {}) => make.idle({ seed: PF.hash(name) % 997, ...options });

  // The idle clip's glances about, which fade while a friend looks at something.
  const GLANCES = ['lookX', 'lookY', 'turnX', 'turnY'];
  // Stacks an idle clip's pose at t onto acc (in place), its glances about weighted by `glance`: 1 while the friend
  // looks at nothing in particular, and 0 while it watches something, as a scene or a live page has it.
  function addIdle(acc, idle, t, glance = 1) {
    const pose = { ...idle(t) }, glances = {};
    for (const key of GLANCES) {
      if (key in pose) { glances[key] = pose[key]; delete pose[key]; }
    }
    combine(acc, pose);
    return combine(acc, glances, glance);
  }

  // Maps a pointer position (client px) to {lookX, lookY, turnX, turnY} for a mounted
  // rig: the direction from between its eyes to the pointer, as if the pointer hovered
  // `depth` head units in front of the screen. The `turn` option is the share of that
  // direction the head follows.
  function lookAt(rig, clientX, clientY, { depth = 180, turn = 0.4 } = {}) {
    const cam = rig.parts.root && rig.parts.root.parentNode, m = cam && cam.getScreenCTM();
    if (!m) return {};
    const q = new DOMPoint(clientX, clientY).matrixTransform(m.inverse()), d = Math.hypot(q.x, q.y, depth);
    return { lookX: q.x / d, lookY: q.y / d, turnX: (q.x / d) * turn, turnY: (q.y / d) * turn };
  }

  const api = {
    ease, clip, still, rest, track, layer, seq, loop, repeat, speed, delay, remap, pingpong, weight,
    combine, mix, sample, frames, pulses, blinks, parse, extend, play, lookAt, make, clips, HOP, hopping, WALK, walking,
    stack, faceOnly, blinkShape, flickShape, swishShape, mirror, idleOf, addIdle, GLANCES,
  };
  PF.anim = api;
  return api;
});
