// The spec of characters/yuanyuan/yuanyuan.js before its realignment with the icon (a closer head, fringe, ears and face). Kept per STYLE.md, principle 1.
// Character spec for YuanYuan, a white cat with a lavender mop and a round curl on the crown, lavender ears, red-brown
// eyes, two lavender dots on his forehead, pink paw pads and a red-and-white cord around one ankle.
// Pictures: examples/icon.png (his head, drawn by his owner) and sixteen of his owner's works in examples/EVE HP/.
// Colors are taken from examples/icon.png; those it does not show are taken from EVE HP/2507.png, and the works serve
// for colors and markings only.
PhyFriends.define('yuanyuan', {
  palette: {
    bg: '#1c1d21',
    fur: '#efeef3',        // The white, deepened to mumuyou's depth to stay visible on paper; the icon's warm white (#fff6f4) merges with the paper's cream. It fills the face, the ear tufts, the paws, the tail and the white of the cord. Its house shade (furShade) fills the body, which sits under the head.
    hair: '#a3a4cb',       // The icon's lavender (#a6a4c2) at the chroma of the hair in EVE HP/2507.png (C* 22 for 17), so that on paper it keeps the icon's own color rather than turning gray: the mop, the curl, the head, the ears and the forehead dots.
    earInner: '#fcd6d0',   // The pink of the icon's inner ears.
    eye: '#2e2024',        // A warm near-black, used for the open mouth.
    eyeRed: '#97423a',     // The red-brown of the icon's eyes.
    blush: '#ffb6a7',      // The icon's blush, also used for the paw pads, whose pink in EVE HP/2507.png (#fcb4ae) is nearly the same.
    tongue: '#ebb4ab',     // The icon's tongue.
    cord: '#ae4e48',       // The red of the twisted cord in EVE HP/2507.png.
  },
  // The head is a broad dome in the hair's lavender; the mop covers all of it but the face.
  head: { cx: 0, cy: -24, rx: 92, ry: 70, color: 'hair' },
  // The white face shows under the fringe and spreads into wide cheeks, which end in spiky tufts at the sides, as on
  // the icon. Setting len < 0 flattens the top, under the fringe.
  face: {
    cx: 0, cy: -2, rx: 84, ry: 58, color: 'fur',
    fluff: [
      { from: -4, to: 42, n: 3, len: 14, lean: 0, depth: 0.1, b1: -24, b2: 14, jit: 0, sym: true },
      { from: 235, to: 305, n: 1, len: -4, b1: 0, b2: 0, jit: 0 },
    ],
  },
  // The ears are broad cat ears at the corners of the head, tipped out, in the hair's lavender with pink insides. The
  // white tufts in them are an extra.
  ears: {
    base: [-60, -70], angle: 34, width: 90, length: 76, lean: -6, tip: 6, b1: -10, b2: -6, color: 'hair',
    inner: { scale: 0.76, dx: -4, dy: -4 },
  },
  // The mop is a round crown over a fringe that comes to a point between the forehead dots, with a lock down each side
  // of the face to the outer corner of the eye and short jagged points along the sides, above the cheek tufts, as on
  // the icon. The valleys either side of the middle lock sit high, so that the dots show on the white.
  // Each tip is [x, y, bendIn, bendOut, following valley].
  hair: {
    cx: 0, cy: -56, rx: 80, ry: 48, color: 'hair',
    tips: [
      [0, -108, -30, -30, [96, -50]],
      [106, -30, -4, 4, [96, -24]],
      [100, -8, -6, 4, [88, -12]],
      [78, -2, -4, 6, [70, -14]],
      [54, 2, 10, 12, [30, -72]],
      [2, -26, -6, -6, [-30, -72]],
      [-54, 2, 12, 10, [-70, -14]],
      [-78, -2, 6, -4, [-88, -12]],
      [-100, -8, 4, -6, [-96, -24]],
      [-106, -30, 4, -4, [-96, -50]],
    ],
  },
  // The eyes are plain tall pills in his own red-brown, set wide and low. Setting arc: 1 draws the happy, closed and
  // squint strokes at the full eye width.
  eyes: { x: 34, y: 4, w: 13, h: 32, stroke: 5, arc: 1, color: 'eyeRed' },
  // The blush sits on the white under the outer corner of each eye, tipped up to follow the cheek. It sits low enough
  // that an eye looking down and outward does not land on it.
  blush: { x: 57, y: 28, rx: 11.5, ry: 7, tilt: 10 },
  // There is no mouth by default (the icon's nose and small mouth are omitted); when open, it shows his pink tongue and
  // one fang for the small fangs of EVE HP/2502.png.
  mouth: { y: 22, size: 3.8, fang: true },
  // The body is small, round and seated, in the house shade. Shoulder tufts sit under the cheeks, and small hip tufts
  // below them.
  body: {
    cx: 0, cy: 84, rx: 64, ry: 47, color: 'furShade',
    fluff: [{ from: -65, to: -25, n: 2, len: 8, depth: 0, b1: 0, b2: -25, jit: 0, sym: true },
      { from: 20, to: 60, n: 2, len: 6, lean: 6, depth: 0.08, b1: -25, b2: 5, jit: 0, sym: true }],
  },
  // The tail is a slim white cat's tail, as in every work before 2026. It leaves his left hip (the viewer's right) above
  // the hind foot, so that it does not read as a leg, and curls up in a C, as a sitting cat's does, beside the body
  // rather than behind the head.
  tail: {
    base: [56, 104], angle: 78, length: 120, width: 34, bend: -150, taper: 0.3, root: 0.2, color: 'fur',
    fluff: [{ from: 320, to: 350, n: 1, len: 5, lean: 4, depth: 0.05, b1: -30, b2: 5, jit: 0 },
      { from: 190, to: 225, n: 1, len: 4, lean: 4, b1: -25, b2: 5, jit: 0 }],
  },
  extras: [
    // The two dots on the forehead, either side of the middle lock, where eyebrows would be. The icon draws them as
    // pale circles that only their outlines show; without outlines they take the hair's lavender, as EVE HP/2604(2).png
    // fills them with the hair's color.
    { on: 'face', kind: 'ellipse', fill: 'hair', cx: -27, cy: -34, rx: 7.5, ry: 6.5 },
    { on: 'face', kind: 'ellipse', fill: 'hair', cx: 27, cy: -34, rx: 7.5, ry: 6.5 },
    // Ear extras are in ear-local space (base on the origin, tip up, +x toward the top of the head).
    // The white tufts rising from the base of the inner ear, clipped to the ear.
    { on: 'ears', clip: true, fill: 'fur', cx: -6, cy: -2, rx: 14, ry: 22,
      fluff: [{ from: 210, to: 330, n: 3, len: 9, depth: 0.05, b1: -5, b2: 5, jit: 0 }] },
    // The curl on the crown, from the icon: a thick lock that rises from the middle of the crown, loops over to the
    // left and curls back in, leaving a small opening low on the left rather than a ring.
    { on: 'hair', fill: 'hair', nodes: [[8, -104, 1, 0], [16, -122], [15, -139], [4, -152], [-12, -157], [-28, -153],
      [-39, -142], [-41, -129], [-35, -119], [-27, -115, 1, 0], [-27, -125], [-21, -132], [-12, -134], [-5, -128],
      [-4, -116], [-9, -104, 1, 0]] },
    // The forepaws on the ground between the hind feet.
    { on: 'body', kind: 'ellipse', fill: 'fur', cx: -15, cy: 121, rx: 12.5, ry: 10 },
    { on: 'body', kind: 'ellipse', fill: 'fur', cx: 15, cy: 121, rx: 12.5, ry: 10 },
    // The hind feet, soles to the front, as in EVE HP/2507.png: a pink pad under three pink toe beans on each.
    { on: 'body', kind: 'ellipse', fill: 'fur', cx: -48, cy: 114, rx: 19, ry: 16 },
    { on: 'body', kind: 'ellipse', fill: 'fur', cx: 48, cy: 114, rx: 19, ry: 16 },
    { on: 'body', kind: 'ellipse', fill: 'blush', cx: -48, cy: 119, rx: 8.5, ry: 6.5 },
    { on: 'body', kind: 'ellipse', fill: 'blush', cx: 48, cy: 119, rx: 8.5, ry: 6.5 },
    { on: 'body', fill: 'blush', round: 0.5, polys: [[-58, 108, 3.4, 8], [-48, 105, 3.4, 8], [-38, 108, 3.4, 8],
      [38, 108, 3.4, 8], [48, 105, 3.4, 8], [58, 108, 3.4, 8]] },
    // The twisted red-and-white cord that almost every work showing his feet ties around one ankle, here his right
    // (the viewer's left), where the foot meets the leg: a red band, bowed around the ankle and clipped to the body,
    // crossed by two slanted white twists. The red carries the band's shape, since a white band on the shaded body
    // would leave only red slashes, which read as scratches.
    { on: 'body', clip: true, fill: 'cord', round: 0.5,
      nodes: [[-64, 89, 1, 12], [-33, 89, 1, 0], [-33, 100, 1, -12], [-64, 100, 1, 0]] },
    { on: 'body', fill: 'fur', nodes: [[-53, 89.8, 1], [-48.5, 89.8, 1], [-52.5, 100.6, 1], [-57, 100.6, 1]] },
    { on: 'body', fill: 'fur', nodes: [[-43, 90.2, 1], [-38.5, 90.2, 1], [-42.5, 100.8, 1], [-47, 100.8, 1]] },
  ],
  // The paws reach y ~131, so squash and stretch pivot about that height.
  rig: { ground: 131 },
  views: {
    // The icon, whose eyes are set as far apart as the spec's, so that the two line up (pf.py compare).
    icon: { w: 1679, h: 1629, x: 859, y: 1023, scale: 4.53, rotate: 0 },
    // The house close-up (1254 px, head tipped 20°). There is no house-style reference for YuanYuan yet.
    closeup: { w: 1254, h: 1254, x: 450, y: 835, scale: 5.5, rotate: 20 },
  },
});
