// Howdi — sky-blue wolf with a navy mop of hair. Reference: examples/ref.jpg (views.ref)
PhyFriends.define('howdi', {
  palette: {
    bg: '#1c1d21',
    fur: '#84cefd',        // its house shade (furShade) is the body, under the head
    face: '#e7f6fd',
    hair: '#253d79',
    hairShade: '#1d3068',  // its one shade, set by hand: the derived shade of this navy is nearly black
    earInner: '#e4f5fd',
    stripe: '#29417d',
    eye: '#1c1d22',
    blush: '#e9d3e0',
    chest: '#e3f4fe',      // the ruff; its house shade (chestShade) is the layer behind its clumps
    tailTip: '#29417d',
  },
  // the cheek fluff draws the lower outline, so the head itself stays inside its notches
  head: { cx: 0, cy: -30, rx: 86, ry: 70 },
  // face mask: wide and turned a little, edged with fur shingles (a long convex sweep
  // into a point, then a short notch back in); the sides differ, so no `sym`
  face: {
    cx: -1, cy: 15.3, rx: 77.9, ry: 42.5, rot: -4.4,
    fluff: [
      { from: -40, to: 33, n: 3, len: -2, lean: 2, depth: 0.13, b1: -14, b2: 0, jit: 0.89, seed: 55 }, // right
      { from: 161, to: 241, n: 3, len: 0, lean: -7, depth: 0.15, b1: 16, b2: -25, jit: 0.62, seed: 8 }, // left (runs upwards)
      { from: 242, to: 278, n: 2, len: 3, lean: -4, depth: 0.26, b1: -25, b2: 15 }, // fur bites in at the top left
      { from: 42, to: 149, n: 1, len: -3, b1: -5, b2: -15 }, // len < 0 flattens the chin
    ],
  },
  // Wolf ears: pointed and stood fairly upright. The reference has them relaxed
  // 30° further out (views.ref.pose). The left ear is the nearer one there:
  // taller, with a long convex outer edge.
  ears: {
    base: [-73, -59], angle: 32, width: 96.5, length: 82, lean: 36, tip: 5, b1: -15.5, b2: -17,
    // a sail-shaped inner ear, drawn in front of the head so it runs down over the fur
    inner: { front: true, scale: 1, dx: -8, dy: -5, width: 35, length: 56, lean: 36, tip: 3, b1: -38, b2: -4 },
    stripes: [{ t: 0.3, w: 13, a: 5 }],
    // the right ear is shorter and broader (as drawn in the reference), its navy band lower
    right: {
      base: [-72, -57.5], width: 98, length: 63, lean: 35, b1: -25, b2: -17,
      stripes: [{ t: 0.17, w: 17, a: 45 }],
      inner: { front: true, scale: 1, dx: -7.5, dy: -9, width: 38, length: 41, lean: 32, tip: 5.5, b1: -20, b2: 7.5 },
    },
  },
  // Flame-like locks: [tipX, tipY, bendIn, bendOut, following valley].
  hair: {
    cx: 20, cy: -68, rx: 68, ry: 52,
    tips: [
      [-33, -132, -30, -26, [28, -110]],
      [28, -126, 9, -24, [53, -91]],
      [67, -96, 1, -20, [64, -80]],
      [96.5, -65, 1, -12, [81, -53]],
      [92, -24, -27, -17, [82.5, -26]],
      [78, -17, 21, 11, [49.5, -46]],
      [54, -33, -21, -12, [26, -34]],
      [35.5, -20, 4, -13, [24, -18]],
      [26, -7, -21, -30, [-0.5, -18.5]],
      [-3, -6, 22, -26, [-31, -50]],
      [-71.5, -14, -19, 20, [-75.5, -23.5]],
      [-87, -19, -15, -22, [-83, -37]],
      [-103, -43, -16, -12, [-85, -65]],
      [-100.5, -77, -11, -8, [-52, -96.5]],
      [-63, -103, 16, -15, [-25, -117]],
    ],
  },
  eyes: { x: 34.7, y: 0.4, w: 11.5, h: 31, tilt: -3 },
  blush: { x: 53, y: 21.3, rx: 11, ry: 6.5 },
  // compact body under the head, in the house shade: shoulder tufts reach up and out under the
  // cheeks, small hip tufts below
  body: {
    cx: -5, cy: 75.4, rx: 68.6, ry: 56, color: 'furShade',
    fluff: [{ from: -70.1, to: -20.7, n: 2, len: 18, depth: 0, b1: 0, b2: -25, jit: 0, sym: true },
      { from: 15, to: 65, n: 2, len: 7, lean: 7.5, depth: 0.1, b1: -25, b2: 5, jit: 0, sym: true }],
  },
  // bushy wolf tail with a navy tip, curling up behind the left hip (outside the ref crop)
  tail: { base: [-56, 102], angle: 55, tip: { at: 0.68 } },
  extras: [
    // cheek fluff under the ears: shingles whose points hook up towards the ears, and
    // an n: 1 range with len < 0 that tucks the bottom in behind the chin
    { on: 'base', under: true, fill: 'fur', cx: 0, cy: -9, rx: 100, ry: 71,
      fluff: [
        { from: -21, to: 46, n: 4, len: 1, lean: -4, depth: 0.1, b1: 0, b2: -14, jit: 0.87, seed: 71, sym: true },
        { from: 46, to: 128, n: 1, len: -19, b1: 14, b2: 8 },
      ] },
    // darker strand along the lower right lock, in the hair's shade (its lower edge is the lock's, via the clip)
    { on: 'hair', clip: true, fill: 'hairShade', nodes: [[19, -54, 1, 29], [55, -38, 1, 0], [58, -29, 1, 0], [27, -33, 1, -10]] },
    // chest ruff: pale clumps over their back layer in the house shade, which shows as a collar
    // under the chin and in the gaps between clumps. Tufts are shingles: a long convex sweep into a point,
    // then a short notch back in, leaning outwards. jit: 0 keeps them fixed whatever their
    // index in this list.
    { on: 'body', clip: true, fill: 'chestShade', cx: -12, cy: 65.3, rx: 96, ry: 25.3, rot: -1.2,
      fluff: [{ from: -42.6, to: -8.2, n: 3, len: 0, lean: -6, depth: 0.1, b1: -25, b2: 5, jit: 0, sym: true },
        { from: 95, to: 160, n: 3, len: 9, lean: 7.6, depth: 0.1, b1: -25, b2: 5, jit: 0, sym: true }] },
    // forepaws, peeking out under the ruff
    { on: 'body', kind: 'ellipse', fill: 'fur', cx: -28, cy: 121, rx: 14, ry: 9 },
    { on: 'body', kind: 'ellipse', fill: 'fur', cx: 16, cy: 121, rx: 14, ry: 9 },
    // left clump: a rounded end under the left cheek
    { on: 'body', clip: true, fill: 'chest', cx: -65.9, cy: 65.8, rx: 24.7, ry: 14.2, rot: -7.1,
      fluff: [{ from: 70, to: 190, n: 3, len: 9, lean: 12, depth: 0.2, b1: -25, b2: 5, jit: 0 }] },
    // middle clump: one broad point hidden under the chin
    { on: 'body', clip: true, fill: 'chest', cx: -11.6, cy: 80.1, rx: 31.6, ry: 24, rot: -14.6,
      fluff: [{ from: 172.2, to: 303.4, n: 1, len: 11.2, lean: -22.4, b1: -40, b2: -37.8, jit: 0 },
        { from: 30, to: 160, n: 4, len: 10, lean: 9.8, depth: 0.2, b1: -25, b2: 5, jit: 0 }] },
    // right clump: its point peeks out under the chin; tufts lean the other way
    { on: 'body', clip: true, fill: 'chest', cx: 31.3, cy: 84.7, rx: 24.9, ry: 15, rot: 4,
      fluff: [{ from: 223, to: 331.8, n: 1, len: 12.6, lean: -21.5, b1: -17.1, b2: 8, jit: 0 },
        { from: 20, to: 150, n: 3, len: 10, lean: -13, depth: 0.2, b1: 5, b2: -25, jit: 0 }] },
  ],
  // the paws reach y ~131: squash and stretch about that
  rig: { ground: 131 },
  views: {
    // the reference is drawn with the ears relaxed outwards
    ref: { w: 1254, h: 1254, x: 470, y: 837, scale: 5.5, rotate: 20, pose: { earL: 30, earR: 30 } },
  },
});
