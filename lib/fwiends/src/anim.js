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
 * Afterward, sample() clamps each field to its range (RANGE): blink and lid to
 * 0..1, look and turn to -1..1, and so on.
 *
 * The clips here are movements (idle, hop, bounce, nod, turn, ...), and the
 * movements of a friend standing (walk, wave, cheer, jump, standUp, sitDown,
 * dance, ...). A friend turns in quarter turns (pose.facing; PhyFriends.TURN).
 * Feelings, which add a face and a posture to a movement, are in lib/fwiends/src/emotion.js,
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
 * (lib/fwiends/film/scene.js) or a live page (lib/fwiends/src/live.js).
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
    // negative one beyond the legs' stretch lifts the feet; rise moves at most a whole stance; the whole figure tips
    // about its feet only as far as the template's legs stretch to keep them planted; an arm reaches from across the
    // chest to straight up; a foot only lifts.
    crouch: [-4, 30], rise: [-1, 1], lean: [-30, 30], tip: [-15, 15], armL: [-90, 180], armR: [-90, 180], elbowL: [-150, 150], elbowR: [-150, 150],
    legL: [-30, 60], legR: [-30, 60], stepL: [0, 24], stepR: [0, 24],
  };

  // Stacks partial pose `p` onto `acc` (in place) with weight k; strings apply only when k >= 0.5, but for the arms drawn
  // whole in front (over), which apply whenever p shows at all: the draw order changes at the ends of a blend, where the
  // arm it moves is nearest where it rests and the change shows least.
  function combine(acc, p, k = 1) {
    for (const f in p) {
      const v = p[f];
      if (v === undefined) continue;
      if (typeof v !== 'number') { if (k >= 0.5 || (f === 'over' && k > 0)) acc[f] = v; }
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
  // A clip made of others (out) is weighed if any of them is (weighed()), so that nothing weighs it again: a clip is
  // weighed once, whatever it is then laid on, joined to or played at.
  const carry = (out, ...cs) => (cs.some(c => c && c.weighed) ? Object.assign(out, { weighed: true }) : out);

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
    return carry(tag(t => cs.reduce((acc, c) => combine(acc, c(t)), {}),
      ds.length ? (loop ? period(ds) : Math.max(...ds)) : undefined, loop), ...cs);
  }

  // Plays clips one after another; a number stands for a rest of that many seconds.
  function seq(...items) {
    const cs = items.map(c => (typeof c === 'number' ? rest(c) : toClip(c))), at = [];
    let total = 0;
    for (const c of cs) { at.push(total); total += c.duration || 0; }
    return carry(clip(t => {
      let i = cs.length - 1;
      while (i > 0 && t < at[i]) i--;
      return cs[i](t - at[i]);
    }, total), ...cs);
  }

  // Time remapping.
  const remap = (c, f, duration, loop = false) => (c = toClip(c), carry(tag(t => c(f(t)), duration, loop), c));
  const loop = (c, duration) => (c = toClip(c), carry(clip(t => c(t), duration ?? c.duration, true), c));
  const repeat = (c, n) => (c = toClip(c), carry(clip(t => c(t >= n * c.duration ? c.duration : mod(t, c.duration)), n * c.duration), c));
  const speed = (c, k) => (c = toClip(c), carry(tag(t => c(t * k), c.duration && c.duration / k, c.loop), c));
  const delay = (c, s) => (c = toClip(c), carry(c.loop ? tag(t => c(t - s), c.duration, true)
    : tag(t => c(Math.max(0, t - s)), c.duration == null ? _ : c.duration + s, false), c));
  const pingpong = c => (c = toClip(c), carry(clip(t => c(t < c.duration ? t : 2 * c.duration - t), 2 * c.duration, true), c));
  // Scales a clip's offsets by k (a number or a function of t, e.g., a fade envelope).
  const weight = (c, k) => (c = toClip(c), carry(tag(t => combine({}, c(t), typeof k === 'function' ? k(t) : k), c.duration, c.loop), c));

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
  // lengths divide 8 s, so any of them layered over idle still loops in 8 s, but for
  // bounce's 1.1 s, the hi's hop, which keeps its own timing: a layer of it over idle
  // does not loop seamlessly.

  const make = {};

  // The idle. A friend's own (idleOf) is a stream that never repeats: its breath wanders in tempo and depth, its head,
  // its weight and its tail sway on slow waves whose lengths share no common period, and what it does now and then (a
  // blink, a glance, an ear's flick, a swish of its tail) comes at times drawn afresh for each stretch of time from the
  // seed, the kind of thing and the stretch's number alone (stretches). Nothing is carried from one frame to the next,
  // so any moment can be sampled directly. Given a loop length (duration), as the library's `idle` is, the same idle
  // repeats in it instead, so that an export loops: its breath and its waves are rounded to divide the loop, its
  // stretches to tile it, and its breath keeps its tempo and depth.

  // The breath. The house's figure breathes once every `seconds`; a friend breathes as much more slowly as its build is
  // heavier, by its mass (buildOf) to the power `scale`, as animals' breathing slows with their size, and faster or
  // slower by up to `detune` as its seed has it (breathFor). Where that leaves two friends of the cast within `apart`
  // of each other, their tempos are spread (breathOf), so that no two share one. A friend's tempo wanders by up
  // to `wander` either way, and its breath grows shallower by up to `swell` and deep again (never deeper than the
  // house's), over a stretch of half a minute or so, each friend's its own way, so that even two whose tempos are near
  // never keep in step for long.
  const BREATH = Object.freeze({ seconds: 8 / 3, scale: 0.25, detune: 0.08, apart: 0.012, wander: 0.06, swell: 0.2 });
  // What happens now and then: for each stretch of `every` seconds, with `chance`, one event `from` to `to` of the way
  // through it, which lasts `lasts` seconds at most (a double blink, a glance held, a swish).
  const NOW_AND_THEN = Object.freeze({
    blink: { every: 2.6, chance: 1, from: 0.25, to: 0.75, lasts: 0.5, double: 0.3 },
    glance: { every: 4, chance: 0.85, from: 0.2, to: 0.55, lasts: 1.8 },
    flick: { every: 4.5, chance: 0.55, from: 0.1, to: 0.8, lasts: 0.55 },
    swish: { every: 8, chance: 0.75, from: 0.1, to: 0.75, lasts: 1.2 },
  });
  // A glance's eyes lead its head, which follows them `lag` seconds later by `follow` of the way, as far as a friend
  // with a figure of the house's turns its head (buildOf).
  const GLANCE = Object.freeze({ follow: 0.35, lag: 0.12 });

  // The build of a friend of the house's figure as most are drawn (HOUSE), against which a friend's own is measured:
  // the radii of its body and its head, and the length of its ears and of its tail with its width.
  const HOUSE = Object.freeze({ body: [66, 48], head: [90, 68], ears: 92, tail: [130, 96] });
  // A friend's build, from its spec alone, as a share of the house's: its mass, the area of its body (as tall as it
  // stands, PhyFriends.BODY), its head and half its tail; and how long its ears and its tail are, by which each turns
  // with a breath, less the longer it is, so that its tip travels about as far; and its head's size, by which a big
  // head bobs less. A friend without the house's figure (one that never stands: Claude) takes the house's build, and
  // so breathes, glances and sways as it always has, its head still while its eyes glance.
  const PLAIN = Object.freeze({ mass: 1, ears: 1, tail: 1, head: 1, follow: 0 });
  function buildOf(specOrName) {
    const spec = PF.find(specOrName);  // A name nothing defines takes the house's build, as no spec does.
    if (!spec || !PF.standFor(spec)) return PLAIN;
    const E = PF.shapes.ellipse, body = E(spec.body), head = E(spec.head || {}), ears = (spec.ears && spec.ears.length) || HOUSE.ears;
    const tail = spec.tail ? [spec.tail.length ?? HOUSE.tail[0], spec.tail.width ?? HOUSE.tail[1]] : [0, 0];
    const mass = ([b, h, t]) => b[0] * b[1] * PF.BODY.height + h[0] * h[1] + (t[0] * t[1]) / 8;
    const within = v => clamp(v, 0.6, 1.6);
    return {
      mass: mass([[body.rx, body.ry], [head.rx, head.ry], tail]) / mass([HOUSE.body, HOUSE.head, HOUSE.tail]),
      ears: within(Math.sqrt(HOUSE.ears / ears)), tail: within(Math.sqrt(HOUSE.tail[0] / (tail[0] || HOUSE.tail[0]))),
      head: within(Math.sqrt((HOUSE.head[0] * HOUSE.head[1]) / (head.rx * head.ry))), follow: GLANCE.follow,
    };
  }

  // A friend's breath, in seconds, from its build and its seed alone (BREATH). The seed sets the detune by the golden
  // ratio, which spreads whole numbers round a circle as evenly as can be.
  const breathFor = (build, seed) => BREATH.seconds * build.mass ** BREATH.scale * (1 + BREATH.detune * (2 * ((seed * 0.6180339887) % 1) - 1));
  // The seed of a friend's own idle (idleOf).
  const seedOf = name => PF.hash(name) % 997;
  // A friend of the cast's breath, in seconds: the breaths by build and seed (breathFor) of the cast's friends that the
  // page defines (with no cast installed, of every friend it defines), spread so that any two differ by BREATH.apart
  // at least. In their order, with g the log of 1 + apart, the logs of the tempos x must keep x[i + 1] - x[i] >= g;
  // they are moved as little as can be in least squares, which is to fit x[i] - i g to b[i] - i g (b the logs before)
  // by the nearest sequence that never falls (pooling adjacent violators), so that friends already far enough apart
  // keep their tempos. Undefined for any other name (a film's working copy, a page's own placeholder), which keeps the
  // breath its build and its seed give it (make.idle).
  let spread = { key: null, of: new Map() };
  const castNames = () => (PF.cast && PF.cast.installed ? new Set(PF.cast.names()) : null);
  function breathOf(name) {
    const cast = castNames(), names = PF.list().filter(n => !cast || cast.has(n)), key = names.join('\n');
    if (spread.key !== key) {
      const g = Math.log(1 + BREATH.apart), blocks = [];
      const rows = names.map(n => ({ n, b: Math.log(breathFor(buildOf(n), seedOf(n))) })).sort((p, q) => p.b - q.b || (p.n < q.n ? -1 : 1));
      rows.forEach((row, i) => {
        blocks.push({ sum: row.b - i * g, count: 1 });
        for (let k = blocks.length - 1; k > 0 && blocks[k - 1].sum / blocks[k - 1].count > blocks[k].sum / blocks[k].count; k--) {
          blocks[k - 1].sum += blocks[k].sum;
          blocks[k - 1].count += blocks[k].count;
          blocks.pop();
        }
      });
      const of = new Map();
      let i = 0;
      for (const { sum, count } of blocks) for (let j = 0; j < count; j++, i++) of.set(rows[i].n, Math.exp(sum / count + i * g));
      spread = { key, of };
    }
    return spread.of.get(name);
  }

  // The events of one kind about time t, for each stretch of `every` seconds (stretch i starts at i·every): each one
  // drawn by make(R, start) from its own generator R, seeded by the seed, the kind (salt) and i alone; in a loop of n
  // stretches, by i mod n. at(t, f) sums f(event, t) over the events that may be under way at t, those that began in the
  // last `lasts` seconds. Each stretch's draw is kept while it is near, so that a frame does not draw it again.
  function stretches(seed, salt, { every, lasts }, make, n = 0) {
    const kept = new Map();
    const of = i => {
      let events = kept.get(i);
      if (!events) {
        if (kept.size > 8) kept.clear();
        events = make(PF.rng(PF.hash(`${seed}/${salt}/${n ? mod(i, n) : i}`)), i * every);
        kept.set(i, events);
      }
      return events;
    };
    return (t, f) => {
      let sum = 0;
      for (let i = Math.floor((t - lasts) / every), last = Math.floor(t / every); i <= last; i++) for (const e of of(i)) sum += f(e, t);
      return sum;
    };
  }
  // A glance's profile, `dt` seconds after it starts: the eyes go out quickly, hold, and come back.
  const glanceShape = (dt, hold) => (dt <= 0 || dt >= hold + 0.15 ? 0 : dt < 0.12 ? ease.out(dt / 0.12) : dt < hold ? 1 : 1 - ease.out((dt - hold) / 0.15));

  make.idle = ({ seed = 7, duration = 8, energy = 1, spec, breath: given } = {}) => {
    const loop = Number.isFinite(duration) && duration > 0 ? duration : 0, build = buildOf(spec), R = PF.rng(seed);
    // A length that divides the loop, if there is one, nearest to the length asked for.
    const fit = s => (loop ? loop / Math.max(1, Math.round(loop / s)) : s);
    const tiles = s => (loop ? Math.round(loop / fit(s)) : 0);
    const wave = (seconds, k = 1) => { const w = TAU / fit(seconds * (0.8 + 0.45 * R())), at = TAU * R(); return t => k * Math.sin(w * t + at); };
    // A slow sway that never repeats: two waves whose lengths stand in the golden ratio, at most 1 either way.
    const sway = seconds => { const a = wave(seconds, 0.7), b = wave(seconds * 0.618, 0.3); return t => a(t) + b(t); };
    const breath = fit(given > 0 ? given : breathFor(build, seed));  // A cast's own, spread (idleOf), if given.
    const drift = [wave(23), wave(37)], depth = [wave(19, 0.6), wave(31, 0.4)];
    // How far the breath's phase wanders: enough to change its tempo by BREATH.wander at most.
    const wander = loop ? 0 : BREATH.wander / breath / (1 / (0.8 * 23) + 1 / (0.8 * 37));
    const at0 = TAU * R(), swell = loop ? 0 : BREATH.swell;
    const tilt = [sway(9), sway(4.5)], turn = sway(11), tail = sway(9.5), lean = sway(10);

    const kinds = {};
    for (const kind in NOW_AND_THEN) {
      const k = NOW_AND_THEN[kind], every = fit(k.every), within = (r, s) => s + every * (k.from + (k.to - k.from) * r);
      kinds[kind] = stretches(seed, kind, { every, lasts: k.lasts }, (r, s) => {
        if (r() >= k.chance) return [];
        const start = within(r(), s);
        if (kind === 'blink') return r() < k.double ? [[start], [start + 0.3]] : [[start]];
        if (kind === 'glance') return [[start, 0.8 + r() * 0.6, (r() < 0.5 ? -1 : 1) * (0.2 + r() * 0.2), (r() - 0.6) * 0.3]];
        if (kind === 'flick') return [[start, r() < 0.5 ? 0 : 1, 14 + r() * 8]];
        return [[start, 6 + r() * 3]];
      }, tiles(k.every));
    }
    const glances = (t, i) => kinds.glance(t, (e, u) => e[i] * glanceShape(u - e[0], e[1]));
    const pulse = (shape, width) => (u, t0) => { const x = (u - t0) / width; return x > 0 && x < 1 ? shape(x) : 0; };
    const blinkAt = pulse(blinkShape, 0.2), flickAt = pulse(flickShape, 0.55), swishAt = pulse(swishShape, 1.2);

    const phase = t => (TAU * t) / breath + at0 + wander * (drift[0](t) + drift[1](t));  // The breath's, in radians
    const idle = t => {
      const b = phase(t);
      const deep = energy * (1 - (swell * (1 - depth[0](t) - depth[1](t))) / 2);  // From 1 - swell to 1.
      const lookX = glances(t, 2), lookY = glances(t, 3);
      const follow = build.follow ? [glances(t - GLANCE.lag, 2), glances(t - GLANCE.lag, 3)].map(v => build.follow * v) : [0, 0];
      return {
        lookX: energy * lookX, lookY: energy * lookY,
        squash: 0.014 * deep * Math.sin(b),
        headY: 0.6 * build.head * deep * Math.sin(b - 2.2),
        tilt: energy * (1.4 * tilt[0](t) + 0.5 * tilt[1](t)),
        turnX: energy * (0.06 * turn(t) + follow[0]), turnY: energy * follow[1],
        hair: 1.2 * deep * Math.sin(b - 1.2), // Lags the breath
        earL: 2 * build.ears * deep * Math.sin(b - 0.6) + kinds.flick(t, (e, u) => (e[1] === 0 ? e[2] * flickAt(u, e[0]) : 0)),
        earR: 2 * build.ears * deep * Math.sin(b - 0.9) + kinds.flick(t, (e, u) => (e[1] === 1 ? e[2] * flickAt(u, e[0]) : 0)),
        // A slow sway, and a little of the breath, which it lags; and now and then a swish.
        tail: build.tail * (energy * 2.5 * tail(t) + deep * Math.sin(b - 2)) + build.tail * kinds.swish(t, (e, u) => e[1] * swishAt(u, e[0])),
        blink: kinds.blink(t, (e, u) => blinkAt(u, e[0])),
        // A standing friend's arms lift a little with each breath, and its weight shifts slowly from foot to foot.
        armL: 2.5 * deep * Math.sin(b - 0.4), armR: 2.5 * deep * Math.sin(b - 0.6),
        elbowL: 3 * deep * Math.sin(b - 1.3), elbowR: 3 * deep * Math.sin(b - 1.5),
        lean: 0.8 * energy * lean(t),
      };
    };
    return Object.assign(loop ? clip(idle, loop, true) : tag(t => idle(t), undefined, false), { breath, phase });
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

  // Hops on the spot: crouches, springs up and lands squashed. The ears, the tail, the hair and the head follow the
  // hop by its weight (weighed()), which every way of playing it on a friend gives it: a player (play()), a friend's
  // stack, a scene, and parse() for a friend.
  make.hop = ({ height = 22 } = {}) => track({
    squash: [[0, 0], [0.18, -0.12, 'out'], [0.26, 0.1, 'out'], [0.5, 0.01], [0.68, 0.07, 'in'], [0.74, -0.11, 'out'], [0.9, 0.03], [1.05, 0]],
    y: [[0, 0], [0.18, 1], [0.24, 0], [0.5, -height, 'out'], [0.72, 0, 'in'], [1.05, 0]],
    turnY: [[0, 0], [0.18, 0.15], [0.5, -0.2], [0.75, 0.1], [1.0, 0]],
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

  // A standing friend's walk. Its pace: a step's time and how far the body goes in it (seconds, length), which a
  // scene's walk keeps when it is given no time. Its limits: the most steps it takes in a second (cadence), and the
  // share of a step that a foot stays down after it lands (sigma; over 1, both feet are down for a while, as in a
  // walk), which a walk keeps to when its steps are short enough. How high a foot lifts, how far a leg swings out as
  // it steps on the spot (kick, degrees), how far the arms swing (degrees), the lean onto the planted foot (degrees),
  // the stretch as the body passes over that foot, how far below the lower of its legs' reaches the body may drop
  // where the two meet (soften, head units, so that it never turns a corner), how far the body dips as it steps on the
  // spot (dip, head units), and a leg at rest, from the hip to the ankle: how far out and how far down it reaches. The leg is the template's, worked out from PhyFriends.STAND_DEFAULT and STAND_FIT: from
  // hips hipUp above the body's base, it shows `legs` below the base, down to an ankle `ankle` above the ground. A
  // friend's own gait follows from its spec.stand (gaitOf()).
  const WALK = Object.freeze({
    seconds: 0.25, length: 24, cadence: 5, sigma: 1.3, height: 7, kick: 10, swing: 14, lean: 3, squash: 0.02, soften: 4, dip: 2,
    leg: Object.freeze([PF.STAND_DEFAULT.legs.spread, PF.STAND_FIT.legs + PF.STAND_FIT.hipUp - PF.STAND_DEFAULT.legs.ankle]),
  });

  // The walk on the spot at p steps in (p = 1 ends the first step). The right foot lifts in the even steps and the
  // left in the odd ones, or the other way round when first is -1. A foot rises and comes down as the square of the
  // step's sine, so that it meets the floor at rest rather than stamping, and its leg swings out and back in as it
  // goes; the weight shifts onto the planted foot, the arms swing against the legs, the head, the hair and the tail
  // sway with the step, and the body stretches and dips (dip) as it passes over the planted foot, the feet kept to the
  // floor. Every part is at rest at each whole step, so that a walk cut after whole steps ends at rest, as it starts;
  // what follows the body a little late (the ears, the tail, the hair and the head) is its weight's (weighed()), driven
  // by the dip, which settles when the walk ends.
  function stepping(p, { height, kick, swing, lean, squash, dip } = WALK, { first = 1 } = {}) {
    const a = Math.PI * p, q = first * Math.sin(a), lift = q * q, y = dip * lift;
    return {
      stepL: (q < 0 ? height * lift : 0) + y, stepR: (q > 0 ? height * lift : 0) + y, y,
      legL: q < 0 ? kick * lift : 0, legR: q > 0 ? kick * lift : 0,
      lean: -lean * q,
      armL: swing * q, armR: -swing * q, elbowL: 0.5 * swing * q, elbowR: -0.5 * swing * q,
      squash: squash * lift, tilt: -1.5 * q, hair: -1.2 * q, tail: 5 * q,
    };
  }

  // Walks on the spot, two steps a loop. walking() is the same walk going somewhere.
  make.walk = ({ duration = 2 * WALK.seconds, ...gait } = {}) =>
    clip(t => stepping((2 * t) / duration, { ...WALK, ...gait }), duration, true);

  // The side ('L' or 'R', the viewer's) away from a friend's tail, where a raised arm shows best (PF.freeSide): 'R'
  // without a spec. parse() gives a clip the spec of the friend that plays it.
  const freeSide = spec => { const found = PF.find(spec); return found == null ? 'R' : PF.freeSide(found); };

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

  // Throws both arms up and out beside the head with a little hop, and shakes them for joy, the paws flicking out. The
  // paws stay clear of the cheeks: an arm raised further would hold its paw in front of the head (PhyFriends.STAND_DEFAULT).
  make.cheer = ({ height = 12 } = {}) => track({
    crouch: [[0, 0], [0.14, 7], [0.26, -2, 'out'], [0.42, 0], [0.5, 6, 'out'], [0.8, 0]],
    y: [[0, 0], [0.2, 0], [0.33, -height, 'out'], [0.46, 0, 'in']],
    squash: [[0, 0], [0.14, -0.04], [0.24, 0.05, 'out'], [0.4, 0.01], [0.48, -0.05, 'out'], [0.8, 0]],
    armL: [[0, 0], [0.14, -8], [0.32, 90, 'back'], [0.95, 90], [1.4, 0]],
    armR: [[0, 0], [0.14, -8], [0.32, 90, 'back'], [0.95, 90], [1.4, 0]],
    elbowL: [[0, 0], [0.32, -15, 'back'], [0.47, -35], [0.62, -15], [0.77, -35], [0.95, -15], [1.4, 0]],
    elbowR: [[0, 0], [0.32, -15, 'back'], [0.47, -35], [0.62, -15], [0.77, -35], [0.95, -15], [1.4, 0]],
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

  // Jumps: crouches, springs up with its arms flung up and out, clear of the cheeks, and its feet tucked under it, and
  // lands in a crouch. The landing's crouch, the ears, the tail, the hair and the head follow the jump by its weight
  // (weighed()), which every way of playing it on a friend gives it, as for the hop.
  make.jump = ({ height = 32 } = {}) => track({
    crouch: [[0, 0], [0.24, 14], [0.32, -3, 'in'], [0.42, 0]],
    y: [[0, 0], [0.3, 0], [0.52, -height, 'out'], [0.74, 0, 'in']],
    squash: [[0, 0], [0.24, -0.05], [0.32, 0.07, 'out'], [0.5, 0], [0.73, 0.03], [0.78, -0.08, 'out'], [1.1, 0]],
    stepL: [[0, 0], [0.32, 0], [0.46, 12, 'out'], [0.62, 9], [0.73, 0, 'in']],
    stepR: [[0, 0], [0.32, 0], [0.46, 12, 'out'], [0.62, 9], [0.73, 0, 'in']],
    legL: [[0, 0], [0.32, 0], [0.46, 8], [0.73, 0]],
    legR: [[0, 0], [0.32, 0], [0.46, 8], [0.73, 0]],
    armL: [[0, 0], [0.24, -15], [0.36, 90, 'out'], [0.55, 80], [0.74, 30], [0.84, 45], [1.15, 0]],
    armR: [[0, 0], [0.24, -15], [0.36, 90, 'out'], [0.55, 80], [0.74, 30], [0.84, 45], [1.15, 0]],
    elbowL: [[0, 0], [0.24, -10], [0.36, -15, 'out'], [0.74, 10], [1.15, 0]],
    elbowR: [[0, 0], [0.24, -10], [0.36, -15, 'out'], [0.74, 10], [1.15, 0]],
    turnY: [[0, 0], [0.24, 0.15], [0.5, -0.2], [0.75, 0.1], [1, 0]],
    blink: [[0, 0], [0.74, 0], [0.78, 0.6], [0.88, 0]],
  }, { duration: 1.2 });

  // A change of stance eases `rise`, which the rig adds to the stance (sit 0, stand 1), so that the friend rises or
  // sinks through every height between, unfolding or folding its limbs: the rig gathers its feet under it before its
  // hips rise, and keeps its paws in their seated fold until it is most of the way up (PhyFriends stanceFor).

  // Stands up from sitting (over a seated stance): squashes down where it sits, its head bowing forward as its weight
  // comes over its feet, rises through every height with its arms a little out, goes a little past upright, and
  // settles. It ends with rise 1, standing; the scene that plays it changes the stance itself, which is what reduced
  // motion keeps.
  make.standUp = () => track({
    rise: [[0, 0], [0.18, 0], [0.76, 1, 'inOut'], [1, 1]],
    crouch: [[0, 0], [0.76, 0], [0.86, -2.5, 'out'], [1, 0]],
    squash: [[0, 0], [0.16, -0.045, 'inOut'], [0.45, 0.02], [0.76, 0], [0.86, 0.025, 'out'], [1, 0]],
    turnY: [[0, 0], [0.2, 0.22], [0.4, 0.25], [0.66, -0.06], [0.86, 0.03], [1, 0]],
    armL: [[0, 0], [0.3, 0], [0.6, 12], [0.95, 0]],
    armR: [[0, 0], [0.3, 0], [0.6, 12], [0.95, 0]],
    headY: [[0, 0], [0.18, 1.5], [0.5, -1], [0.86, 0.5], [1, 0]],
    earL: [[0, 0], [0.18, 6], [0.5, 10], [0.86, -6, 'out'], [1, 0]],
    earR: [[0, 0], [0.2, 6], [0.52, 10], [0.88, -5, 'out'], [1, 0]],
    tail: [[0, 0], [0.2, -3], [0.6, 6, 'out'], [0.86, -3], [1, 0]],
    hair: [[0, 0], [0.2, 1], [0.55, -2], [0.86, 0.8], [1, 0]],
  }, { duration: 1 });

  // Sits down from standing (over a standing stance): sinks through every height with its arms a little out, its
  // head bowing a little as it lowers its weight, and plops down onto its seat. It ends with rise -1, sitting.
  make.sitDown = () => track({
    rise: [[0, 0], [0.1, 0], [0.7, -1, 'inOut'], [1, -1]],
    squash: [[0, 0], [0.1, -0.015], [0.5, 0.01], [0.72, -0.06, 'in'], [0.86, 0.015, 'out'], [1, 0]],
    turnY: [[0, 0], [0.15, 0], [0.45, 0.15], [0.72, 0.1], [0.86, -0.03], [1, 0]],
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

  // Stretches: rises with its arms thrown up and out, the paws turned out clear of the cheeks, and its head back,
  // leans one way and the other, and settles again.
  make.stretch = () => track({
    squash: [[0, 0], [0.3, -0.02], [0.7, 0.05], [1.7, 0.05], [2, -0.02], [2.4, 0]],
    crouch: [[0, 0], [0.3, 3], [0.7, -3], [1.7, -3], [2, 2], [2.4, 0]],
    armL: [[0, 0], [0.3, -10], [0.75, 95, 'out'], [1.7, 100], [2.1, 0]],
    armR: [[0, 0], [0.3, -10], [0.75, 95, 'out'], [1.7, 100], [2.1, 0]],
    elbowL: [[0, 0], [0.75, -25], [1.7, -30], [2.1, 0]],
    elbowR: [[0, 0], [0.75, -25], [1.7, -30], [2.1, 0]],
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

  // Beckons with one arm (side and spec as for wave), calling someone over: reaches it out straight to the side and
  // sweeps the forearm back in toward itself, the paw up beside the cheek, `sweeps` times, one every `rate` seconds;
  // the head tips toward the paw and the ears prick with each sweep. Seated, its arms are forelegs and keep still, so
  // only the head beckons.
  make.beckon = ({ spec, side = freeSide(spec), sweeps = 2, rate = 0.27 } = {}) => {
    const rise = 0.18, fall = 0.18, duration = rise + sweeps * rate + fall, d = side === 'L' ? -1 : 1;
    return clip(t => {
      const up = t < rise ? ease.out(t / rise) : t > duration - fall ? 1 - ease.smooth((t - duration + fall) / fall) : 1;
      const u = (t - rise) / rate, pull = u > 0 && u < sweeps ? (1 - Math.cos(TAU * u)) / 2 : 0;  // 1 with the paw drawn in.
      return {
        [`arm${side}`]: up * (70 + 5 * pull), [`elbow${side}`]: up * (-80 + 120 * pull),
        tilt: d * (3 * up + 4 * pull), lean: -1.5 * d * pull, turnY: -0.12 * pull,
        earL: -4 * up - 4 * pull, earR: -4 * up - 4 * pull, hair: -1.5 * d * pull,
        tail: up * 5 * Math.sin((TAU * t) / 0.45),
      };
    }, duration);
  };

  // A turn's lead (make.turn), in shares of a quarter's `seconds`: the eyes go first, `eyes` of the way round by `look`;
  // the head follows from `head`, turned `turn` of the way when the view snaps; and the new view comes in with the head
  // still `behind` it, turned back the way it came, from where it comes round over the settle, a little past, and back.
  // In every view, a turn of the head (turnX) or of the eyes (lookX) toward the viewer's right leads a turn that way.
  // The eyes lead only in a view that shows them: from behind, the head leads alone, from the start, and the eyes keep
  // to the front.
  const TURN_LEAD = Object.freeze({ eyes: 0.6, look: 0.4, head: 0.3, turn: 0.5, behind: 0.35 });

  // Turns round as South Park's cut-out characters do, a quarter turn at a time (PhyFriends.TURN): `quarters` quarter
  // turns, toward the viewer's right (a negative number turns the other way, and 4 all the way round), one every
  // `seconds`, each snapping in with a small hop. The eyes lead the first, then the head, then the view snaps, and
  // after the last the head settles (TURN_LEAD). `from` is the facing it starts from, which decides the views that
  // show the eyes. The facing it ends on holds to the clip's end; laid over a pose, it adds to that pose's facing.
  make.turn = ({ quarters = 2, seconds = 0.25, hop = 3, from = 0 } = {}) => {
    const n = Math.max(1, Math.round(Math.abs(quarters))), d = quarters < 0 ? -1 : 1, duration = (n + 0.6) * seconds, L = TURN_LEAD;
    const shows = k => PF.quarterOf(from + d * 90 * k) !== 180;  // Whether the view after k quarters shows the eyes.
    const lead = shows(0) ? L.head : 0;
    return clip(t => {
      const k = Math.min(n, Math.floor(t / seconds)), u = t / seconds - k, snap = k > 0 && u < 1 ? Math.sin(Math.PI * Math.min(1, u * 2)) : 0;
      const settle = k === n ? clamp(u / 0.6, 0, 1) : 0;  // After the last snap
      const head = k === n ? -L.behind * (1 - ease.back(settle))
        : k === 0 ? L.turn * ease.smooth(clamp((u - lead) / (1 - lead), 0, 1)) : lerp(-L.behind, L.turn, ease.smooth(u));
      const eyes = !shows(k) ? 0 : L.eyes * (k === n ? 1 - ease.smooth(settle) : shows(0) ? ease.out(clamp(t / seconds / L.look, 0, 1)) : 1);
      return { facing: d * 90 * k, y: -hop * snap, squash: -0.04 * snap, turnX: d * head, lookX: d * eyes };
    }, duration);
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

  // Adds functions or clips to parse()'s scope under the given names, as lib/fwiends/src/emotion.js adds react,
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
  // Made for a friend, the clip is weighed for it (weighed()), once, as a whole.
  let parsing = 0;  // How many expressions parse() is evaluating, one within another.
  function parse(expr, { spec } = {}) {
    const made = spec != null && parsing === 0 ? c => weighed(c, { spec }) : c => c;
    if (typeof expr !== 'string') return made(toClip(expr));
    if (clips[expr]) return spec == null ? clips[expr] : made(make[expr]({ spec }));
    const scope = scopeFor(spec), outer = parsingFor;
    parsingFor = spec;  // So that a clip named in quotes within the expression ("layer('wave', idle)") is the friend's too.
    parsing++;
    try {
      return made(toClip(Function(...Object.keys(scope), `'use strict'; return (${expr});`)(...Object.values(scope))));
    } finally {
      parsingFor = outer;
      parsing--;
    }
  }

  // --------------------------------------------------------------- Stacks

  const STACK_FADE = 0.15; // Default fade in and out of a layer on a stack, in seconds.

  // A face's shapes (SHAPES: the eyes and the mouth) cannot fade. Its eyes (EYES) change their shape only while shut:
  // the friend blinks, `seconds` long, and the eyes change at the blink's middle, `shut` of the way through it, when
  // they are fully shut (blinkShape). swapBlink(dt) is that blink, dt seconds after they change. A mouth changes without
  // one.
  const SHAPES = ['eyes', 'eyeL', 'eyeR', 'mouth'];
  const EYES = ['eyes', 'eyeL', 'eyeR'];
  const SWAP = Object.freeze({ seconds: 0.2, shut: 0.36 });
  const swapBlink = dt => {
    const u = dt / SWAP.seconds + SWAP.shut;
    return u > 0 && u < 1 ? blinkShape(u) : 0;
  };
  const hasShapes = partial => SHAPES.some(key => partial[key] !== undefined);
  const hasEyes = partial => EYES.some(key => partial[key] !== undefined);

  // A friend's timed layers, for a scene or a live page. Each layer is a clip that plays from `at`
  // until `until` (by default until the clip ends, or for ever if it loops or never ends), faded in
  // and out over `fade` seconds, eased (smooth), and scaled by `weight`; its time starts at `at`. sample(t) combines
  // the layers that are on at t, in the order they were added, into a partial pose. A layer's eye shapes (EYES) come
  // and go with a blink as it fades in and out (SWAP), the blink's middle a set time into the fade rather than
  // wherever the fade is half done; its mouth comes in as it starts to fade in and goes as it ends fading out, as an
  // arm laid over everything does (combine); a layer weighted under one half shows neither. Under reduced
  // motion (sample(t, { reduced: true })) only the face changes (faceOnly()), nothing moves, and nor do the eyes blink.
  // Given the spec of the friend whose layers they are (stack({ spec })), each clip laid on it is weighed for that
  // friend (weighed()): its root's path moves the rest of its body.
  function stack(friend = null) {
    const layers = [];
    const envelope = (layer, t) => {
      if (t < layer.at || t >= layer.end) return 0;
      if (!(layer.fade > 0)) return 1;
      return ease.smooth(Math.min(1, (t - layer.at) / layer.fade, (layer.end - t) / layer.fade));
    };
    // When a layer's eye shapes come in (from) and go (until): SWAP.shut of a blink into its fade in and its fade out.
    const swapIn = layer => (layer.fade > 0 && Number.isFinite(layer.at) ? layer.at + SWAP.seconds * SWAP.shut : -Infinity);
    const swapOut = layer => (layer.fade > 0 && Number.isFinite(layer.end) ? layer.end - layer.fade + SWAP.seconds * SWAP.shut : Infinity);
    // Whether the layer has eye shapes to change at a swap at time s, worked out once for each swap: coming in, those
    // it starts with (a clip whose own come later, as a reaction's do, blinks for them itself: E.react); going, those it
    // has then.
    const swaps = (layer, s, going) => {
      const kept = layer.swaps || (layer.swaps = new Map());
      if (!kept.has(s)) kept.set(s, layer.weight >= 0.5 && hasEyes(layer.clip(going ? s - layer.at : 0)));
      return kept.get(s);
    };
    // The blink at t that hides the layer's eye shapes coming in or going.
    const blinkFor = (layer, t) => {
      const coming = swapIn(layer), going = swapOut(layer);
      let blink = 0;
      if (Math.abs(t - coming) < SWAP.seconds && swaps(layer, coming, false)) blink += swapBlink(t - coming);
      if (Math.abs(t - going) < SWAP.seconds && swaps(layer, going, true)) blink += swapBlink(t - going);
      return blink;
    };
    // A partial pose without its face shapes.
    const shapeless = partial => {
      const out = { ...partial };
      for (const key of SHAPES) delete out[key];
      return out;
    };
    const self = {
      get layers() { return layers.slice(); },
      add(c, { at = 0, until, fade = STACK_FADE, weight = 1 } = {}) {
        c = friend ? weighed(c, friend) : toClip(c);
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
        let blink = 0;
        for (const layer of layers) {
          const k = envelope(layer, t);
          if (!reduced) blink += blinkFor(layer, t);
          if (k <= 0) continue;
          let partial = layer.clip(t - layer.at);
          if (reduced) partial = faceOnly(partial);
          if (!hasShapes(partial)) { combine(acc, partial, k * layer.weight); continue; }
          combine(acc, shapeless(partial), k * layer.weight);
          if (layer.weight < 0.5) continue;
          const eyed = t >= swapIn(layer) && t < swapOut(layer);
          for (const key of SHAPES) if (partial[key] !== undefined && (eyed || key === 'mouth')) acc[key] = partial[key];
        }
        if (blink > 0) acc.blink = (acc.blink || 0) + blink;
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
  // Each clip it plays is weighed for the rig's friend (weighed(), with rig.spec), unless it is weighed already.
  function play(rig, c, opts = {}) {
    const o = { speed: 1, loop: true, autoplay: true, reducedMotion: true, smooth: 0.12, fade: 0.25, mode: 'add', ...opts };
    const mq = o.reducedMotion && typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
    const live = {}; // Override field -> {v, tv, w, tw, mode}: value, target value, weight, target weight
    const weigh = next => weighed(next, { spec: rig.spec });
    let cur = weigh(c), time = o.start || 0, playing = false, pose = null, from = null, fadeT = 0, fadeD = 0;

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
        cur = weigh(next); time = start; draw(); wake(); return p;
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

  // A friend seated gets about by hopping (FWIENDS.md): each hop is a crouch, a flight and a landing crouch. length is
  // a hop's usual reach in head units and height its usual height; crouch is the share of a hop spent on the floor at
  // each end, so that it takes off `crouch` of the way into a hop (a film that times a leap by its take-off relies on
  // it); squash is how far the body squashes in a crouch, sink how far a standing friend's hips drop as it gathers
  // itself (head units), and lean the tilt in flight toward the way it goes.
  const HOP = Object.freeze({ length: 80, seconds: 0.34, height: 26, crouch: 0.15, squash: 0.08, sink: 8, lean: 4 });

  // How far through `hops` equal hops a friend is at u (0 to 1): along, the share of the distance covered; lift, the
  // share of a hop's height it is off the ground; squash; crouch, how far a standing friend's hips drop (head units);
  // and lean, in degrees toward the way it goes. Each hop gathers itself before it leaves the floor: it sinks and
  // squashes over most of its crouch and springs out of it, stretched, as it takes off; it rounds out in the air and
  // lands squashed. The weight of the move (inertia()) adds the rest: the ears and the tail trailing in flight, and a
  // standing friend's crouch on landing, as deep as the fall is fast.
  function hopping(u, hops) {
    const i = Math.min(hops - 1, Math.floor(u * hops)), v = u * hops - i;
    const c = HOP.crouch, air = clamp((v - c) / (1 - 2 * c), 0, 1);
    const gather = ease.smooth(v / (0.7 * c)), spring = ease.smooth((v - 0.7 * c) / (0.3 * c));
    let squash, crouch = 0;
    if (v < c) {
      squash = lerp(-HOP.squash * gather, 0.6 * HOP.squash, spring);
      crouch = HOP.sink * gather * (1 - spring);
    } else if (v > 1 - c) squash = -HOP.squash * Math.sin(Math.PI * (v - 1 + c) / c);
    else squash = 0.6 * HOP.squash * (1 - air) ** 2;
    return { along: (i + ease.smooth(air)) / hops, lift: Math.sin(Math.PI * air), squash, crouch, lean: HOP.lean * Math.sin(Math.PI * air) };
  }

  // A friend's legs as a walk uses them: a leg at rest from its hip to its ankle (out, down), its length (reach) and
  // slant; how far each hip is from the middle (hip) and half a foot's width (foot); and how far a foot may be from
  // where it rests: out to the side as far as a leg swung out by SWING.out keeps it (outer), in toward the other foot
  // as far as keeps three tenths of the gap between the feet at rest closed by it at most (inner, so that the feet
  // never meet), and forward or back, side-on, as far as a leg swung by SWING.side keeps it (swing). The template's
  // legs (WALK.leg, from hips STAND_FIT.hip of the house body's half-width out) unless a spec is given; null for a
  // friend that never stands.
  const SWING = Object.freeze({ out: 40 * DEG, side: 28 * DEG, gap: 0.3 });  // side: within the 30 degrees RANGE lets a leg swing back.
  function gaitFrom([out, down], hip, foot) {
    const reach = Math.hypot(out, down), slant = Math.atan2(out, down), gap = Math.max(0, 2 * (hip + out - foot));
    return Object.freeze({
      out, down, reach, slant, hip, foot,
      outer: reach * Math.sin(SWING.out + slant) - out, inner: SWING.gap * gap, swing: reach * Math.sin(SWING.side),
    });
  }
  const HOUSE_HALF_WIDTH = 68;  // The house body's half-width (spec.body.rx), for the template's hips.
  const GAIT = gaitFrom(WALK.leg, PF.STAND_FIT.hip * HOUSE_HALF_WIDTH, PF.STAND_DEFAULT.legs.foot.rx);
  function gaitOf(spec) {
    spec = PF.find(spec);  // A name nothing defines walks as the template does, as no spec does.
    if (spec == null) return GAIT;
    const stand = PF.standFor(spec);
    if (!stand) return null;
    const leg = stand.legs.L, foot = leg.foot, ankle = leg.ankle ?? (foot.cy || 0) + (foot.ry ?? foot.rx ?? 0);
    return gaitFrom([leg.spread, stand.ground - ankle - leg.hip[1]], Math.abs(leg.hip[0]), foot.rx ?? foot.ry ?? 0);
  }

  // Which way a friend side-on faces (PhyFriends.TURN): 1 to the viewer's right, -1 to the left, 0 facing the viewer or away.
  function sideOn(facing) {
    const quarter = PF.quarterOf(facing || 0);
    return quarter === 90 ? 1 : quarter === 270 ? -1 : 0;
  }

  // How a walk of n steps covers a distance (head units) with a gait (gaitOf()): the length of a step, how far the body
  // goes in it (stride), and how far from its rest a foot lands ahead and lifts behind (outer and inner). sigma is the
  // share of a step a foot stays down after it lands: over 1, both feet are down for a while, as in a walk; under 1,
  // both are off the floor for a moment, and the steps are too long for a walk. Facing the viewer, a friend walks
  // sideways and the trailing foot keeps clear of the leading one: the leading foot lands `outer` ahead of its rest and
  // lifts `inner` behind it, and the trailing one lands `inner` ahead and lifts `outer` behind, so that the two never
  // meet; such a walk takes an odd number of steps, the leading foot first and last. Side-on, a foot reaches as far
  // ahead as behind. Where they can, the feet stay down for WALK.sigma of a step.
  function strides(distance, n, g, side) {
    const D = Math.abs(distance);
    if (side) {
      const stride = D / n, reach = Math.min(g.swing, (WALK.sigma * stride) / 2);
      return { n, stride, outer: reach, inner: reach, sigma: stride > 0 ? (2 * reach) / stride : Infinity };
    }
    let stride = (D + 2 * g.inner) / (n + WALK.sigma), outer = WALK.sigma * stride - g.inner;
    if (outer > g.outer) { outer = g.outer; stride = (D - outer + g.inner) / n; }
    return { n, stride, outer, inner: g.inner, sigma: stride > 0 ? (outer + g.inner) / stride : Infinity };
  }

  // How many steps a standing friend takes to walk `distance` head units in `seconds`, with its gait (gaitOf()) and
  // facing: steps three quarters as long as the longest that keep a foot down, but never more than WALK.cadence of
  // them a second, so that a walk short of time takes longer steps; or 0 where even its longest steps would not cover
  // the distance in that time, and it should hop instead.
  function walkSteps(distance, seconds, { gait: g = GAIT, facing = 0 } = {}) {
    const side = sideOn(facing), D = Math.abs(distance), longest = side ? 2 * g.swing : g.outer + g.inner;
    const odd = n => (side || n % 2 ? n : n + 1);
    const most = Math.max(1, Math.floor(WALK.cadence * seconds)), cap = side || most % 2 ? most : most - 1;
    const n = Math.min(odd(Math.max(1, Math.ceil(D / (0.75 * longest)))), cap);
    return strides(D, n, g, side).sigma >= 1 ? n : 0;
  }

  // The share of a walk's distance covered at u (0 to 1) of its time: its speed rises from rest over the share `ramp`
  // of the time, as a smoothstep in time, so that its acceleration has no jumps; holds; and falls back to rest over the
  // last share `ramp`. Its speed there, as a share of the speed it holds, is pace(u, ramp).
  function travelled(u, ramp) {
    const V = 1 / (1 - ramp), start = s => { const w = s / ramp; return V * ramp * (w ** 3 - w ** 4 / 2); };
    u = clamp(u, 0, 1);
    return u < ramp ? start(u) : u > 1 - ramp ? 1 - start(1 - u) : V * (u - ramp / 2);
  }
  const pace = (u, ramp) => ease.smooth(clamp(Math.min(u, 1 - u) / ramp, 0, 1));  // ease.smooth repeats past 1.

  // A friend standing walks instead (WALK). How far through a walk of `steps` steps a friend is at u (0 to 1), going
  // `distance` head units (negative: to the viewer's left) on its legs (gait; gaitOf(), or a leg at rest, `leg`, on the
  // template's hips): along, the share of the distance covered (travelled()); pose, the partial pose of the walk there,
  // a standing one (the legs, the feet, the arms, the lean); and planted, whether each foot (L, R) is down. The step's
  // phase follows the distance covered, not
  // the time, so that a planted foot stays where it was put while the body moves on over it, and each foot swings from
  // where it lifted to where it lands (strides()) measured from its hip, which carries it along, leaving the floor and
  // meeting it again moving as a planted foot does. Each leg reaches for its foot, and the body drops as far as the
  // legs' swings lift their feet (y): a smooth maximum of the two, so that the body's height has no step and no corner
  // as a foot lifts or lands, and its weight is not jolted by the walk. Facing the viewer, a friend
  // goes sideways, the foot on the side it goes to stepping out first; side-on (facing; PhyFriends.TURN), its legs hang
  // straight down and swing forward and back. The ears, the tail and the rest follow by the walk's weight (inertia()).
  function walking(u, steps, { distance = 0, gait: g = null, leg = null, facing = 0 } = {}) {
    g = g || (leg ? gaitFrom(leg, GAIT.hip, GAIT.foot) : GAIT);
    const side = sideOn(facing), D = Math.abs(distance), dir = distance < 0 ? -1 : 1;
    const whole = Math.max(1, Math.round(steps)), n = side || whole % 2 ? whole : whole + 1;
    const { stride, outer, inner, sigma } = strides(D, n, g, side);
    const ramp = clamp(1 / (n + 1), 0.08, 0.35), along = travelled(u, ramp), d = along * D, speed = pace(u, ramp);
    if (!(stride > 0)) return { along, pose: {}, planted: { L: true, R: true } };
    const lead = dir > 0 ? 'R' : 'L', trail = lead === 'R' ? 'L' : 'R';
    const land = { [lead]: outer, [trail]: inner }, lift = { [lead]: -inner, [trail]: -outer };
    const plantedIn = k => (k % 2 ? lead : trail);  // The foot that lands at the start of step k (step 0: at rest).
    const phi0 = inner / stride, phi = phi0 + d / stride, k = clamp(Math.floor(phi), 0, n);
    // Where a foot is, ahead of its rest along the way the friend goes (o), and how far through its swing it is (w;
    // null while it is planted). The foot planted in step j stays at (j - phi0) stride + land along the way.
    const foot = s => {
      const j = plantedIn(k) === s ? k : k - 1;
      if (j === n || (j >= 0 && phi - j < sigma)) return { o: (j - phi0) * stride + land[s] - d, w: null };
      let from = lift[s], to = land[s], off = j + sigma, on = j + 2;  // Off the floor and on it again, in steps.
      const first = j < 0, last = on > n;
      if (first) { from = 0; off = phi0; on = 1; }          // The first step, from rest.
      if (last) { to = 0; on = n + outer / stride; }        // The last, back to rest.
      // A cubic (Hermite) from where the foot lifts to where it lands, leaving and meeting the floor at the speed a
      // planted foot goes back along the way (-stride a step), or at rest at the walk's ends: the leg's swing, and the
      // body's height that follows from it, change with no jolt.
      const w = clamp((phi - off) / (on - off), 0, 1), w2 = w * w, w3 = w2 * w, m = -stride * (on - off);
      const o = from + (to - from) * (3 * w2 - 2 * w3) + (first ? 0 : m) * (w - 2 * w2 + w3) + (last ? 0 : m) * (w3 - w2);
      return { o, w };
    };
    const feet = { L: foot('L'), R: foot('R') };
    const [out, down] = side ? [0, g.reach] : [g.out, g.down], slant = side ? 0 : g.slant;
    // A swing outward (facing the viewer) or forward (side-on) that puts the foot o ahead of its rest.
    const swing = s => {
      const ahead = (side || (s === 'R' ? 1 : -1)) * dir * feet[s].o;
      return Math.asin(clamp((out + ahead) / g.reach, -0.95, 0.95)) - slant;
    };
    const rise = a => down * (1 - Math.cos(a)) + out * Math.sin(a);  // How far a leg's swing lifts its foot.
    const angle = { L: swing('L'), R: swing('R') }, rises = [rise(angle.L), rise(angle.R)];
    // The smooth maximum (a + b + sqrt((a - b)^2 + e^2)) / 2, never under either and within e / 2 of the larger: e grows
    // with the walk's speed from none at rest, so that a walk starts and ends with the body at its rest.
    const e = WALK.soften * speed, y = (rises[0] + rises[1] + Math.sqrt((rises[0] - rises[1]) ** 2 + e * e)) / 2;
    // A foot is lifted by as far as the body's drop would put it below the floor (a foot whose leg swings less than the
    // other's, its leg shortened to stay on the floor), and a swinging foot by its step besides.
    const height = WALK.height * clamp(stride / 16, 0.4, 1);
    const step = s => Math.max(0, y - rise(angle[s])) + (feet[s].w === null ? 0 : height * Math.sin(Math.PI * feet[s].w));
    const q = speed * ((feet.R.w === null ? 0 : Math.sin(Math.PI * feet.R.w)) - (feet.L.w === null ? 0 : Math.sin(Math.PI * feet.L.w)));
    const pose = {
      legL: angle.L / DEG, legR: angle.R / DEG, stepL: step('L'), stepR: step('R'), y,
      armL: WALK.swing * q, armR: -WALK.swing * q, elbowL: 0.5 * WALK.swing * q, elbowR: -0.5 * WALK.swing * q,
      lean: side ? 0 : -WALK.lean * q, squash: WALK.squash * q * q,
    };
    return { along, pose, planted: { L: feet.L.w === null, R: feet.R.w === null } };
  }

  // ------------------------------------------------------------ Weight

  // What a friend's body does of its own accord as it is carried about: secondary motion, derived from the path of its
  // root (where the whole cut-out is: x along the floor and y down, in head units), for every clip a friend plays
  // (weighed()) and every move a scene makes. The standing figure tips about its planted feet by atan(a / g) of the
  // root's acceleration a along the floor, so that it leans into a start, stands upright at a steady speed and leans
  // back as it stops; the head lags at a start and carries on at a stop; a landing drops the hips (crouch) as far as
  // the fall is fast; and the ears, the tail and the hair drag behind the root's acceleration and, as in air, its
  // speed. Each is a spring, x'' = w^2 (u - x) - 2 z w x', driven toward u, its gains times its drives, with z > 1:
  // overdamped, so that it settles without ringing and never passes the place its drive would hold it at. A spring's
  // frequency and gains come from the friend's figure, never its name (massesOf()).
  //   step: the fixed step, in seconds, over which the springs are integrated, exactly; g: gravity, in head units a
  //   second squared, about what a scene's hops fall under; speed: the speed (head units a second) at which a part
  //   drags by its whole drag gain, about a hop's; tip: the furthest the weight tips the figure, in degrees; rest: a
  //   part this near its rest is at rest; settle: how long, in seconds, the slowest spring takes to come to rest once
  //   the root keeps still (its slowest root, w (z - sqrt(z^2 - 1)), is over 4 a second: e^-10 is left); tail: the
  //   furthest the weight swings a tail either way, in degrees, however long the tail, so that a long tail side-on,
  //   tucked in, never reaches the head.
  const INERTIA = Object.freeze({ step: 1 / 120, g: 5000, speed: 300, tip: 12, rest: 1e-3, settle: 2.5, tail: 10 });
  // The springs: what each needs of the figure (massesOf()), the axis it is driven along ('x' along the floor, 'y'
  // upward), its frequency w (radians a second) and damping z, and its gains, per g of acceleration (accel) and per
  // INERTIA.speed of speed (drag): a part sags as the floor pushes the body up and floats as the body falls freely,
  // and trails behind the way the body goes. A landing spring is driven only as the root stops falling from above its
  // rest (y < 0: in the air), not by a walk's dip; and tip by the angle atan(a / g) in degrees. A part goes at most
  // about its reach from rest: its spring's place x shows as reach tanh(x / reach), which grows with x, so that a small
  // hop moves it nearly as far as its gains say and a great one no further than its reach, and it still never passes
  // where its drive would hold it. The head rolls HEAD_TILT degrees for each head unit it is carried along.
  const SPRINGS = Object.freeze({
    tip: Object.freeze({ needs: 'legs', axis: 'x', w: 16, z: 1.1, atan: true }),
    headX: Object.freeze({ needs: 'head', axis: 'x', w: 11, z: 1.05, accel: -60, reach: 8 }),
    headY: Object.freeze({ needs: 'head', axis: 'y', w: 13, z: 1.05, accel: 6, reach: 4 }),
    crouch: Object.freeze({ needs: 'legs', axis: 'y', w: 14, z: 1.05, accel: 30, landing: true, reach: 16 }),
    earY: Object.freeze({ needs: 'ears', axis: 'y', w: 13, z: 1.1, accel: 36, drag: 24, reach: 24 }),
    earX: Object.freeze({ needs: 'ears', axis: 'x', w: 13, z: 1.1, accel: 30, drag: 8, reach: 16 }),
    tailY: Object.freeze({ needs: 'tail', axis: 'y', w: 9, z: 1.1, accel: 30, drag: 16, reach: 16 }),
    tailX: Object.freeze({ needs: 'tail', axis: 'x', w: 9, z: 1.1, accel: 40, drag: 10, reach: 16 }),
    hair: Object.freeze({ needs: 'hair', axis: 'x', w: 12, z: 1.1, accel: -24, drag: -4, reach: 6 }),
  });
  const HEAD_TILT = 0.9;
  const EMPTY = Object.freeze({});

  // How much of each part a friend's figure has, against the template's (1): the head's share of head and body by area
  // (spec.head and spec.body, rx by ry), the ears' length and the tail's; and hair and legs, 1 for a friend with hair
  // or one that stands. A part the figure lacks is 0 (Claude has no round head, no body, tail or hair, and never
  // stands), and no spring moves it. A heavier or longer part swings further and more slowly: a spring's gains are
  // scaled by its mass m, and its frequency by 1 / sqrt(m). Without a spec, the template's.
  const TEMPLATE = Object.freeze({ head: 90 * 68, body: 66 * 48, ears: 92, tail: 124 });
  const masses = new WeakMap();
  function massesOf(spec) {
    spec = PF.find(spec);  // A name nothing defines takes the template's, as no spec does.
    if (spec == null) return { head: 1, ears: 1, tail: 1, hair: 1, legs: 1 };
    if (masses.has(spec)) return masses.get(spec);
    const area = e => (e && e.rx > 0 && e.ry > 0 ? e.rx * e.ry : 0), head = area(spec.head), body = area(spec.body);
    const share = (h, b) => h / (h + b), length = (part, of) => (part && part.length > 0 ? part.length / of : 0);
    const m = Object.freeze({
      head: head && body ? share(head, body) / share(TEMPLATE.head, TEMPLATE.body) : 0,
      ears: length(spec.ears, TEMPLATE.ears), tail: length(spec.tail, TEMPLATE.tail),
      hair: spec.hair ? 1 : 0, legs: PF.standLift(spec) > 0 ? 1 : 0,
    });
    masses.set(spec, m);
    return m;
  }

  // The springs that move a friend's figure, each with what an exact step of h seconds needs: the two roots of its
  // characteristic equation, r = -w (z -+ sqrt(z^2 - 1)), and their exponentials over h; that step itself,
  // step(state, i, u) (springStep()); and shown(x), how far its part goes for its place x (within its reach).
  function springsFor(spec, h = INERTIA.step) {
    const m = massesOf(spec), out = [];
    for (const name in SPRINGS) {
      const s = SPRINGS[name], mass = m[s.needs];
      if (!(mass > 0)) continue;
      const w = Math.min(40, s.w / Math.sqrt(mass)), root = Math.sqrt(s.z * s.z - 1), r1 = -w * (s.z - root), r2 = -w * (s.z + root);
      const q = { ...s, name, mass: s.atan ? 1 : mass, w, r1, r2, e1: Math.exp(r1 * h), e2: Math.exp(r2 * h) };
      q.reach = s.reach ? s.reach * q.mass : 0;  // A longer part goes further.
      q.shown = q.reach ? x => q.reach * Math.tanh(x / q.reach) : x => x;
      out.push(Object.assign(q, { step: (state, i, u) => springStep(q, state, i, u) }));
    }
    return out;
  }

  // One exact step of spring q over its step, its drive held at u, on its place state[i] and speed state[i + 1]: with
  // e = x - u, e(t) = c1 e^(r1 t) + c2 e^(r2 t), where c1 + c2 = e(0) and r1 c1 + r2 c2 = x'(0).
  function springStep(q, state, i, u) {
    const e = state[i] - u, v = state[i + 1], c1 = (v - q.r2 * e) / (q.r1 - q.r2), c2 = e - c1;
    state[i] = u + c1 * q.e1 + c2 * q.e2;
    state[i + 1] = q.r1 * c1 * q.e1 + q.r2 * c2 * q.e2;
  }

  // The partial pose of the springs' places (x, by name), for a friend whose tail lies on `side` (1: the viewer's right).
  function weightPose(x, side) {
    const p = {};
    if ('tip' in x) p.tip = x.tip;
    if ('headX' in x) Object.assign(p, { headX: x.headX, tilt: HEAD_TILT * x.headX });
    if ('headY' in x) p.headY = x.headY;
    if ('crouch' in x) p.crouch = x.crouch;
    if ('earY' in x) Object.assign(p, { earL: x.earY + x.earX, earR: x.earY - x.earX });
    if ('tailY' in x) p.tail = INERTIA.tail * Math.tanh((x.tailY - side * x.tailX) / INERTIA.tail);  // Within INERTIA.tail.
    if ('hair' in x) p.hair = x.hair;
    return p;
  }

  // The weight of a path for a friend (spec; the template's without one): path(t) is where its root is at t ({ x, y },
  // head units, y down), from `from` on, before which it is taken to have been at rest there. Returns a function of t
  // giving the partial pose the springs add: nothing before `from`, nor while every spring is at rest. The springs are
  // integrated from `from` at a fixed step, always in the same order of operations, so that the pose at t is the same
  // however the times before it were sampled. Given a period, the path loops, and the motion is the steady one it
  // settles into, which loops with it; given `until`, the path keeps still from then on, and INERTIA.settle seconds
  // later the springs are at rest. Memory is bounded however long the path runs: the springs' places are kept for one
  // block of INERTIA_BLOCK steps at a time, and their state at the start of a few blocks (INERTIA_KEPT), from the
  // latest of which before t a block is integrated afresh; a time before them all is integrated from `from` again.
  // The function's size() is how many numbers it keeps.
  const INERTIA_BLOCK = 120, INERTIA_KEPT = 8;
  function inertia(path, { spec, from = 0, period = 0, until = Infinity } = {}) {
    const loop = period > 0, h = loop ? period / Math.max(1, Math.round(period / INERTIA.step)) : INERTIA.step;
    const springs = springsFor(spec, h), n = springs.length;
    if (!n) return Object.assign(() => EMPTY, { size: () => 0 });
    const side = freeSide(spec) === 'L' ? 1 : -1, state = new Float64Array(2 * n);
    let i = 0, p0 = path(from - h), p1 = path(from);
    // Steps the springs on from step i, from + i h, to i + 1, driven by the root's acceleration there (its second
    // difference) and its speed (the central difference).
    const advance = () => {
      const p2 = path(from + (i + 1) * h), hh = h * h, falling = p0.y < 0 && p1.y > p0.y;  // Coming down from above its rest.
      const acc = { x: (p2.x - 2 * p1.x + p0.x) / hh, y: -(p2.y - 2 * p1.y + p0.y) / hh };
      const vel = { x: (p2.x - p0.x) / (2 * h), y: -(p2.y - p0.y) / (2 * h) };
      for (let k = 0; k < n; k++) {
        const q = springs[k], a = acc[q.axis];
        const u = q.atan ? clamp(Math.atan(a / INERTIA.g) / DEG, -INERTIA.tip, INERTIA.tip)
          : q.landing ? (falling && a > 0 ? (q.mass * q.accel * a) / INERTIA.g : 0)
            : q.mass * ((q.accel * a) / INERTIA.g + ((q.drag || 0) * vel[q.axis]) / INERTIA.speed);
        springStep(q, state, 2 * k, u);
      }
      p0 = p1; p1 = p2; i++;
    };
    const keep = (rows, r) => { for (let k = 0; k < n; k++) rows[r * n + k] = state[2 * k]; };
    // The springs' places at step j and j + 1 of the rows kept (rows, of which row r is step first + r).
    let rows, first;
    if (loop) {  // Settles into the loop's steady motion over a few loops, and keeps the last.
      const steps = Math.round(period / h), warm = steps * Math.max(3, Math.ceil(4 / period));
      while (i < warm) advance();
      rows = new Float64Array((steps + 2) * n);
      for (let r = 0; r <= steps + 1; r++) { keep(rows, r); advance(); }
      first = 0;
    } else {
      rows = new Float64Array((INERTIA_BLOCK + 1) * n);
      first = -Infinity;
    }
    const origin = { i: 0, state: state.slice(), p0, p1 }, starts = new Map();  // The state at the start of a block, by block.
    // Keeps the places through block b (steps b B to (b + 1) B), from the latest start kept at or before it.
    const fill = b => {
      let start = origin;
      for (const [c, kept] of starts) if (c <= b && kept.i > start.i) start = kept;
      state.set(start.state); ({ i, p0, p1 } = start);
      const remember = () => {
        if (i % INERTIA_BLOCK || starts.has(i / INERTIA_BLOCK)) return;
        starts.set(i / INERTIA_BLOCK, { i, state: state.slice(), p0, p1 });
        if (starts.size > INERTIA_KEPT) starts.delete(starts.keys().next().value);  // The first kept goes first.
      };
      while (i < b * INERTIA_BLOCK) { advance(); remember(); }
      for (let r = 0; r <= INERTIA_BLOCK; r++) { keep(rows, r); if (r < INERTIA_BLOCK) { advance(); remember(); } }
      first = b * INERTIA_BLOCK;
    };
    const sample = t => {
      const f = loop ? mod(t - from, period) / h : (t - from) / h;
      if (!(f >= 0) || !Number.isFinite(f) || (!loop && t > until + INERTIA.settle)) return EMPTY;
      let j = Math.floor(f);
      if (!loop && !(j >= first && j < first + INERTIA_BLOCK)) fill(Math.floor(j / INERTIA_BLOCK));
      j -= first;
      const u = f - first - j, x = {};
      let moving = false;
      for (let k = 0; k < n; k++) {
        const a = rows[j * n + k], v = a + (rows[(j + 1) * n + k] - a) * u;
        x[springs[k].name] = springs[k].shown(v);
        if (Math.abs(v) > INERTIA.rest) moving = true;
      }
      return moving ? weightPose(x, side) : EMPTY;
    };
    return Object.assign(sample, { size: () => rows.length + starts.size * (2 * n + 1) });
  }

  // A clip with the weight of its own root's path (inertia() over its x and y), for the friend whose spec is given (the
  // template's without one): a hop's ears trail as it rises and flop as it lands. A clip whose root never moves comes
  // back as it is, as does one weighed already; a looping clip loops with the steady motion its weight settles into.
  function weighed(c, { spec } = {}) {
    c = toClip(c);
    if (c.weighed || !movesRoot(c)) return c;
    const root = t => { const p = c(t); return { x: p.x || 0, y: p.y || 0 }; };
    const loops = c.loop && c.duration > 0, ends = !c.loop && c.duration >= 0;
    const weight = inertia(root, { spec, period: loops ? c.duration : 0, until: ends ? c.duration : Infinity });
    return Object.assign(tag(t => combine({ ...c(t) }, weight(t)), c.duration, c.loop), { weighed: true });
  }
  // Whether a clip moves its root, x or y, between a few times through it (through its first two seconds, if it never
  // ends): a root held still, however far from the floor, weighs nothing.
  function movesRoot(c) {
    const span = c.duration > 0 ? c.duration : 2, root = t => { const p = c(t) || {}; return [p.x || 0, p.y || 0]; };
    const [x0, y0] = root(0);
    for (let k = 1; k <= 32; k++) { const [x, y] = root((k / 32) * span); if (x !== x0 || y !== y0) return true; }
    return false;
  }

  // A pose seen in a mirror: what turns one way turns the other (MIRROR.turned; a friend side-on to the right faces
  // left), and each part of a pair changes places with the other (MIRROR.paired), so that a reaction toward the
  // viewer's left plays toward the right. The tail stays on its side of the body, as it would on the friend turned round.
  const MIRROR = {
    turned: ['x', 'headX', 'tilt', 'lookX', 'turnX', 'lean', 'tip', 'hair', 'facing'],
    paired: [['earL', 'earR'], ['eyeL', 'eyeR'], ['armL', 'armR'], ['elbowL', 'elbowR'], ['legL', 'legR'], ['stepL', 'stepR']],
  };
  function mirror(clip) {
    clip = toClip(clip);
    return carry(tag(t => {
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
    }, clip.duration, clip.loop), clip);
  }

  // A friend's own idle, as a page or a scene plays it: a stream that never repeats (make.idle), the same every time for
  // that friend on a given page, breathing at the tempo its build and its seed give it, spread from the rest of the cast's (breathOf),
  // and out of step with every other friend's.
  const idleOf = (name, options = {}) => make.idle({ seed: seedOf(name), duration: Infinity, spec: name, breath: breathOf(name), ...options });

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
    gaitOf, walkSteps, travelled, INERTIA, SPRINGS, massesOf, springsFor, inertia, weighed,
    stack, faceOnly, blinkShape, flickShape, swishShape, mirror, idleOf, addIdle, GLANCES,
    BREATH, NOW_AND_THEN, buildOf, breathOf, TURN_LEAD, SHAPES, EYES, SWAP, swapBlink,
  };
  PF.anim = api;
  return api;
});
