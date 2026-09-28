// Character spec for mumuyou, a white fox with a cream-blonde mop, sky-blue ears and socks,
// and a salmon-tipped tail.
// Pictures: examples/sheet.png.
// Colors are taken from the color bar on examples/sheet.png. The house shade of the white marks
// the parts that lie under his white face.
PhyFriends.define('mumuyou', {
  palette: {
    bg: '#1c1d21',
    fur: '#efeef3',        // The white, deepened slightly to stay visible on paper. Its house shade (furShade) fills the cheek ruff and body, under his white face.
    hair: '#faefcf',       // The pale cream of the sheet.
    hairShade: '#efcf8a',  // The hair's one shade, set by hand: the warm gold of the back locks, the partings and the ponytail.
    sky: '#98d4f8',        // The ears, the socks and the mark on the forehead.
    earInner: '#fcacb0',   // The pink of the ears, the left forepaw and the tongue.
    eye: '#221d22',        // A soft plum black, used for the open mouth.
    eyeBlue: '#4690e0',    // His right eye is blue.
    eyeGold: '#c98f12',    // His left eye is yellow, as on the sheet, deepened to match the weight of the blue.
    blush: '#fcc2c6',
    tailTip: '#fc9494',    // Salmon, for the tip of the tail and the band of the ponytail.
    moon: '#fce874',       // The yellow crescent.
  },
  // The head is a round dome with a soft tuft down each side, under the ears.
  head: {
    cx: 0, cy: -22, rx: 90, ry: 68,
    fluff: [{ from: -26, to: -2, n: 1, len: 9, lean: 4, depth: 0, b1: -30, b2: 10, jit: 0, sym: true }],
  },
  // The cheeks are plump and white, with their sides cut into tufts against the shaded ruff behind them.
  face: {
    cx: 0, cy: 16, rx: 82, ry: 40, color: 'fur',
    fluff: [
      { from: -40, to: 25, n: 3, len: 9, lean: 4, depth: 0.1, b1: -25, b2: 5, jit: 0, sym: true },
      { from: 235, to: 305, n: 1, len: -4, b1: 0, b2: 0, jit: 0 }, // Setting len < 0 flattens the top, under the fringe.
    ],
  },
  // The ears are tall fox ears, sky blue with pink insides. The white tufts in them are an extra.
  ears: {
    base: [-60, -64], angle: 27, width: 86, length: 88, lean: 10, tip: 4, b1: -14, b2: -8, color: 'sky',
    inner: { scale: 0.6, dx: 2, dy: -10 },
  },
  // The messy mop has a round crown, shaggy pointed locks over the forehead (the longest between
  // the eyes) and a lock down each side of the face to eye level. Each tip is [x, y, bendIn,
  // bendOut, following valley].
  hair: {
    cx: 0, cy: -58, rx: 74, ry: 46, color: 'hair',
    tips: [
      [-36, -116, -14, -10, [-6, -112]],
      [28, -116, -14, -12, [62, -90]],
      [96, -50, -10, -6, [84, -30]],
      [90, 2, 6, -10, [70, -26]],
      [58, -10, 12, -14, [38, -38]],
      [18, -12, 10, -16, [8, -40]],
      [-6, 2, 12, -12, [-22, -38]],
      [-50, -10, -14, 12, [-72, -26]],
      [-92, 2, -10, 6, [-86, -34]],
      [-98, -48, 6, -12, [-66, -96]],
    ],
  },
  // The eyes are plain tall pills, set wide and low, in his own colors: blue on his right (the
  // viewer's left) and yellow on his left. Setting arc: 1 draws the happy, closed and squint
  // strokes at the full eye width.
  eyes: { x: 34, y: 5, w: 13, h: 32, tilt: -3, stroke: 5.2, arc: 1, color: 'eyeBlue', right: { color: 'eyeGold' } },
  // The blush sits on the white under the outer corner of each eye, tipped up to follow the cheek.
  blush: { x: 53, y: 26, rx: 12, ry: 7, tilt: 12 },
  // There is no mouth by default; when open, it shows one fang.
  mouth: { y: 21, size: 3.8, fang: true },
  // The body is small, round and seated, in the house shade; the white chest is an extra.
  // Shoulder tufts sit under the cheeks, and hip tufts below them.
  body: {
    cx: 0, cy: 86, rx: 62, ry: 46, color: 'furShade',
    fluff: [{ from: -65, to: -25, n: 2, len: 12, depth: 0, b1: 0, b2: -25, jit: 0, sym: true },
      { from: 20, to: 60, n: 2, len: 6, lean: 6, depth: 0.08, b1: -25, b2: 5, jit: 0, sym: true }],
  },
  // The tail is a large bushy white brush rising behind the left hip, its white set against the
  // shaded body. The salmon tip is cut into flame-shaped tufts.
  tail: {
    base: [-54, 106], angle: 54, length: 146, width: 104, bend: -76, taper: 0.7, root: 0.5, color: 'fur',
    fluff: [{ from: 300, to: 350, n: 2, len: 10, lean: 6, depth: 0.05, b1: -30, b2: 5, jit: 0 },
      { from: 255, to: 290, n: 1, len: 18, lean: -10, b1: 25, b2: -25, jit: 0 },
      { from: 195, to: 240, n: 2, len: 8, lean: 6, b1: -25, b2: 5, jit: 0 }],
    tip: { at: 0.7, color: 'tailTip', fluff: [{ from: 50, to: 130, n: 3, len: 16, depth: 0.02, b1: 18, b2: 12, jit: 0.2 }] },
  },
  extras: [
    // The cheek ruff under the head, in the house shade. Its tufts reach past the white cheeks, and
    // under the chin it stands in for the neck's shadow, separating the white head from the white chest.
    { on: 'base', under: true, fill: 'furShade', cx: 0, cy: 14, rx: 92, ry: 54,
      fluff: [{ from: -42, to: 21, n: 3, len: 16, lean: -3, depth: 0.1, b1: -33, b2: 10, jit: 0, sym: true }] },
    // The back hair, in the house shade: locks that show behind the mop, down beside the eyes.
    { on: 'base', under: true, fill: 'hairShade', cx: 0, cy: -30, rx: 100, ry: 70,
      tips: [[0, -100, 0, 0, [98, -62]], [110, -20, -10, 6, [96, -14]], [104, 8, -6, 4, [88, -2]], [78, 10, 8, 0, [0, 0]],
        [-78, 10, 0, 8, [-88, -2]], [-104, 8, 4, -6, [-96, -14]], [-110, -20, 6, -10, [-98, -62]]] },
    // The blue mark on the forehead, above the right eye (the viewer's left), between the locks.
    // It is a small upright diamond, so that it reads as a mark rather than a speck.
    { on: 'face', fill: 'sky', polys: [[-25, -25, 5.5, 4, 90, 0.62]] },
    // Ear extras are in ear-local space (base on the origin, tip up, +x toward the top of the head).
    // The white tufts rise from the base of the inner ear to just above the mop. The ear clips off
    // their round bottom, so that no stray shape shows when the ears flick.
    { on: 'ears', clip: true, fill: 'fur', cx: 8, cy: -8, rx: 22, ry: 32,
      fluff: [{ from: 210, to: 330, n: 3, len: 9, depth: 0.05, b1: -5, b2: 5, jit: 0 }] },
    // Lock partings in the house shade, sweeping down from the crown.
    { on: 'hair', clip: true, fill: 'hairShade', nodes: [[-36, -104, 1, -16], [-80, -20, 1, 0], [-64, -20, 1, 10]] },
    { on: 'hair', clip: true, fill: 'hairShade', nodes: [[30, -108, 1, 10], [32, -26, 1, 0], [46, -28, 1, -14]] },
    // The curl on the crown: a lock that rises from the mop and hooks over to the right.
    { on: 'hair', fill: 'hair', nodes: [[-14, -104, 1, -80], [26, -140, 1, 50], [4, -104, 1, 0]] },
    // The ponytail, showing behind the neck on the right, and its band.
    { on: 'body', under: true, fill: 'hairShade', nodes: [[58, 40, 1, -10], [72, 42, 1, -30], [94, 116, 1, 16], [64, 72, 1, 0]] },
    { on: 'body', under: true, fill: 'tailTip', nodes: [[58, 66, 1], [81, 57, 1], [84, 64, 1], [61, 73, 1]], round: 0.3 },
    // The white fluffy chest, below the shade under the chin, with its tufts hanging over the belly.
    { on: 'body', clip: true, fill: 'fur', cx: 0, cy: 84, rx: 50, ry: 27,
      fluff: [{ from: 20, to: 160, n: 4, len: 9, depth: 0.1, b1: -25, b2: 5, jit: 0 }] },
    // The hind feet in sky-blue socks, turned out slightly, with white fluffy trim at the top.
    { on: 'body', kind: 'ellipse', fill: 'sky', cx: -45, cy: 122, rx: 19, ry: 9.5, rot: -8 },
    { on: 'body', kind: 'ellipse', fill: 'sky', cx: 45, cy: 122, rx: 19, ry: 9.5, rot: 8 },
    { on: 'body', fill: 'fur', cx: -46, cy: 113, rx: 15, ry: 5, fluff: [{ from: 20, to: 160, n: 4, len: 4, depth: 0.05, b1: -20, b2: 20, jit: 0 }] },
    { on: 'body', fill: 'fur', cx: 46, cy: 113, rx: 15, ry: 5, fluff: [{ from: 20, to: 160, n: 4, len: 4, depth: 0.05, b1: -20, b2: 20, jit: 0 }] },
    // The forepaws on the ground between the hind feet: his right one is white and his left one pink.
    { on: 'body', kind: 'ellipse', fill: 'fur', cx: -14, cy: 121, rx: 12.5, ry: 10 },
    { on: 'body', kind: 'ellipse', fill: 'earInner', cx: 14, cy: 121, rx: 12.5, ry: 10 },
    // Tail extras are drawn on the straight tail (base on the origin, tip at y -146,
    // +x away from the body); the library bends them onto the curve.
    // The end of the white brush, cut into pointed tufts that reach up into the salmon tip.
    { on: 'tail', clip: true, fill: 'fur', cx: -14, cy: -62, rx: 31, ry: 54,
      fluff: [{ from: 235, to: 305, n: 3, len: 16, lean: 0, depth: 0.05, b1: 15, b2: 15, jit: 0 }] },
    // The yellow crescent moon, opening toward the body, and the blue dot inside its curve.
    { on: 'tail', fill: 'moon', nodes: [[-18, -79, 1], [-5, -82], [6, -74], [6, -58], [-5, -50], [-18, -53, 1], [-8, -55], [-2, -66], [-8, -77]] },
    { on: 'tail', kind: 'ellipse', fill: 'sky', cx: -16, cy: -61, rx: 3.5, ry: 3.5 },
  ],
  // The paws reach y ~131, so squash and stretch pivot about that height.
  rig: { ground: 131 },
  views: {
    // The house close-up (1254 px, head tipped 20°). There is no house-style reference for mumuyou yet.
    closeup: { w: 1254, h: 1254, x: 450, y: 835, scale: 5.5, rotate: 20 },
  },
});
