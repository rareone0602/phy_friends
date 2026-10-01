// Character spec for mumuyou, a white fox with a cream-blonde mop, sky-blue ears and socks, a blue
// diamond on his forehead, a ringed mark on his left shoulder and a salmon-tipped tail.
// Pictures: examples/sheet.png (the color standard), and five by other artists: badge.png, sitting.png,
// scarf.png, blond.png and uniform.png.
// Colors are taken from the color bar on examples/sheet.png; the newer pictures fill their shapes with the
// same colors. The house shade of the white marks the parts that lie under his white face.
PhyFriends.define('mumuyou', {
  palette: {
    bg: '#1c1d21',
    fur: '#efeef3',        // The white, deepened slightly to stay visible on paper. Its house shade (furShade) fills the cheek ruff and body, under his white face.
    head: 'fur',
    face: 'fur',
    hair: '#faefcf',       // The pale cream of the sheet.
    ear: 'sky',
    earInner: '#fcacb0',   // The pink of the ears, the left forearm and forepaw, the tongue and the end of the crescent on the tail.
    iris: '#4690e0',       // His right eye is blue.
    irisRight: '#c98f12',  // His left eye is yellow, as on the sheet, deepened to match the weight of the blue.
    ink: '#221d22',        // A soft plum black, used for the open mouth.
    blush: '#fcc2c6',
    tongue: 'earInner',
    body: 'furShade',
    tail: 'fur',
    arm: 'fur',
    paw: 'fur',
    pawRight: 'earInner',
    leg: 'furShade',
    foot: 'sky',
    hairShade: '#efcf8a',  // The hair's one shade, set by hand: the warm gold of the back locks, the partings and the ponytail.
    sky: '#98d4f8',        // The ears, the socks, the diamond on the forehead, the ring of the mark on the shoulder and the dot on the tail.
    tailTip: '#fc9494',    // Salmon, for the tip of the tail, the band of the ponytail and the speck beside the crescent.
    yellow: '#fce874',     // The yellow of the crescent on the tail and of the arcs of the mark on the shoulder.
  },
  // The head is a round dome with a soft tuft down each side, under the ears.
  head: {
    cx: 0, cy: -22, rx: 90, ry: 68,
    fluff: [{ from: -26, to: -2, n: 1, len: 9, lean: 4, depth: 0, b1: -30, b2: 10, jit: 0, sym: true }],
  },
  // The cheeks are plump and white, with their sides cut into tufts against the shaded ruff behind them.
  face: {
    cx: 0, cy: 16, rx: 82, ry: 40,
    fluff: [
      { from: -40, to: 25, n: 3, len: 9, lean: 4, depth: 0.1, b1: -25, b2: 5, jit: 0, sym: true },
      { from: 235, to: 305, n: 1, len: -4, b1: 0, b2: 0, jit: 0 }, // Setting len < 0 flattens the top, under the fringe.
    ],
  },
  // The ears are tall fox ears, sky blue with pink insides. The white tufts in them are an extra.
  ears: {
    base: [-60, -64], angle: 27, width: 86, length: 88, lean: 10, tip: 4, b1: -14, b2: -8,
    inner: { scale: 0.6, dx: 2, dy: -10 },
  },
  // The messy mop has a round crown, shaggy pointed locks over the forehead (the longest between
  // the eyes) and a lock down each side of the face to eye level. The locks part above his right
  // eye, where blond.png and uniform.png show the diamond on the forehead whole; the two edges of
  // that parting bow out less than the others, so that it is wide enough for the diamond. Each tip
  // is [x, y, bendIn, bendOut, following valley].
  hair: {
    cx: 0, cy: -58, rx: 74, ry: 46,
    tips: [
      [-36, -116, -14, -10, [-6, -112]],
      [28, -116, -14, -12, [62, -90]],
      [96, -50, -10, -6, [84, -30]],
      [90, 2, 6, -10, [70, -26]],
      [58, -10, 12, -14, [38, -38]],
      [18, -12, 10, -16, [8, -40]],
      [-6, 2, 12, -6, [-27, -47]],
      [-50, -10, -6, 12, [-72, -26]],
      [-92, 2, -10, 6, [-86, -34]],
      [-98, -48, 6, -12, [-66, -96]],
    ],
  },
  // The eyes are plain tall pills, set wide and low, in his own colors: blue on his right (the
  // viewer's left) and yellow on his left, as in every picture. The yellow ring that badge.png draws
  // round the yellow eye is its outline, so it is left out, as are the pale dots that badge.png and
  // blond.png alone set above the eyes. Setting arc: 1 draws the happy, closed and squint strokes at
  // the full eye width.
  eyes: { x: 34, y: 5, w: 13, h: 32, tilt: -3, stroke: 5.2, arc: 1 },
  // The blush sits on the white under the outer corner of each eye, tipped up to follow the cheek.
  blush: { x: 53, y: 26, rx: 12, ry: 7, tilt: 12 },
  // There is no mouth by default; when open, it shows one fang.
  mouth: { y: 21, size: 3.8, fang: true },
  // The body is small, in the house shade, and an onigiri (a rice ball): narrow under the chin, broad and flat at the
  // base; the white chest is an extra. Shoulder tufts sit under the cheeks, and hip tufts below them.
  body: {
    cx: 0, cy: 86, rx: 62, ry: 46, onigiri: 1,
    fluff: [{ from: -65, to: -25, n: 2, len: 12, depth: 0, b1: 0, b2: -25, jit: 0, sym: true },
      { from: 8, to: 40, n: 2, len: 6, lean: 6, depth: 0.08, b1: -25, b2: 5, jit: 0, sym: true }],
  },
  // The tail is a large bushy white brush rising behind his right hip (the viewer's left), its white
  // set against the shaded body. The salmon tip is cut into flame-shaped tufts. The standing pictures
  // hold the tail on his left, but seated it would rise through the ponytail, which hangs on that side.
  tail: {
    base: [-54, 106], angle: 54, length: 146, width: 104, bend: -76, taper: 0.7, root: 0.5,
    fluff: [{ from: 300, to: 350, n: 2, len: 10, lean: 6, depth: 0.05, b1: -30, b2: 5, jit: 0 },
      { from: 255, to: 290, n: 1, len: 18, lean: -10, b1: 25, b2: -25, jit: 0 },
      { from: 195, to: 240, n: 2, len: 8, lean: 6, b1: -25, b2: 5, jit: 0 }],
    tip: { at: 0.7, color: 'tailTip', fluff: [{ from: 50, to: 130, n: 3, len: 16, depth: 0.02, b1: 18, b2: 12, jit: 0.2 }] },
  },
  // The limbs, on the house template. Seated, the forepaws rest on the ground between the hind feet, which
  // are in sky-blue socks and turned out slightly, as in sitting.png. Standing, as on the sheet and in uniform.png,
  // the white arms end in his paws: his right one white under a sky-blue patch at the wrist (the sheet, scarf.png and
  // blond.png), and his left one pink, the pink running up the forearm in tufts.
  stand: {
    seat: { paw: { cx: 14, cy: 121, rx: 12.5, ry: 10 }, foot: { cx: 45, cy: 122, rx: 19, ry: 9.5, rot: -8 } },
    arms: {
      bands: [{ from: 0.6, to: 1, color: 'sky', teeth: 2, depth: 3 }],
      right: { bands: [{ from: 0.5, to: 1, color: 'earInner', teeth: 3, depth: 3 }] },
    },
  },
  extras: [
    // The cheek ruff under the head, in the house shade. Its tufts reach past the white cheeks, and
    // under the chin it stands in for the neck's shadow, separating the white head from the white chest.
    { feature: 'cheekRuff', on: 'base', under: true, fill: 'furShade', cx: 0, cy: 14, rx: 92, ry: 54,
      fluff: [{ from: -42, to: 21, n: 3, len: 16, lean: -3, depth: 0.1, b1: -33, b2: 10, jit: 0, sym: true }] },
    // The back hair, in the house shade: locks that show behind the mop, down beside the eyes.
    { feature: 'backHair', on: 'base', under: true, fill: 'hairShade', cx: 0, cy: -30, rx: 100, ry: 70,
      tips: [[0, -100, 0, 0, [98, -62]], [110, -20, -10, 6, [96, -14]], [104, 8, -6, 4, [88, -2]], [78, 10, 8, 0, [0, 0]],
        [-78, 10, 0, 8, [-88, -2]], [-104, 8, 4, -6, [-96, -14]], [-110, -20, 6, -10, [-98, -62]]] },
    // The blue diamond on the forehead, above the right eye (the viewer's left) and a little inward,
    // in the parting of the locks. As in the pictures, it is half as tall as the eye, a little
    // narrower than tall, and leans toward the middle of the face.
    { feature: 'forehead', on: 'face', fill: 'sky', polys: [[-28, -30, 8, 4, 102, 0.82]] },
    // Ear extras are in ear-local space (base on the origin, tip up, +x toward the top of the head).
    // The white tufts rise from the base of the inner ear to just above the mop. The ear clips off
    // their round bottom, so that no stray shape shows when the ears flick.
    { feature: 'earTufts', on: 'ears', clip: true, fill: 'fur', cx: 8, cy: -8, rx: 22, ry: 32,
      fluff: [{ from: 210, to: 330, n: 3, len: 9, depth: 0.05, b1: -5, b2: 5, jit: 0 }] },
    // Lock partings in the house shade, sweeping down from the crown.
    { feature: 'partings', on: 'hair', clip: true, fill: 'hairShade', nodes: [[-36, -104, 1, -16], [-80, -20, 1, 0], [-64, -20, 1, 10]] },
    { feature: 'partings', on: 'hair', clip: true, fill: 'hairShade', nodes: [[30, -108, 1, 10], [32, -26, 1, 0], [46, -28, 1, -14]] },
    // The curl on the crown: a lock that rises from the mop and hooks over to the right.
    { feature: 'curl', on: 'hair', fill: 'hair', nodes: [[-14, -104, 1, -80], [26, -140, 1, 50], [4, -104, 1, 0]] },
    // The ponytail, showing behind the neck on the right, and its band.
    { feature: 'ponytail', on: 'body', under: true, fill: 'hairShade', nodes: [[58, 40, 1, -10], [72, 42, 1, -30], [94, 116, 1, 16], [64, 72, 1, 0]] },
    { feature: 'ponytail', on: 'body', under: true, fill: 'tailTip', nodes: [[58, 66, 1], [81, 57, 1], [84, 64, 1], [61, 73, 1]], round: 0.3 },
    // The white fluffy chest, below the shade under the chin, with its tufts hanging over the belly, as narrow as the
    // body and ending above the forepaws. It is fur round the neck, so it lies over the tops of the arms, as a scarf
    // does (scarf).
    { feature: 'chest', on: 'scarf', clip: true, fill: 'fur', cx: 0, cy: 81, rx: 35, ry: 23,
      fluff: [{ from: 20, to: 160, n: 4, len: 8, depth: 0.1, b1: -25, b2: 5, jit: 0 }] },
    // The mark on his left shoulder, which every picture draws and the sheet shows on its own: a blue ring between two
    // yellow arcs. Seated, it lies on the front of his left foreleg, above the pink forepaw, as in sitting.png. It
    // lies over the scarf and over the top of his left arm.
    { feature: 'shoulders', on: 'scarf', kind: 'ellipse', fill: 'sky', cx: 30, cy: 92, rx: 7.5, ry: 7.5 },
    { feature: 'shoulders', on: 'scarf', kind: 'ellipse', fill: 'fur', cx: 30, cy: 92, rx: 4.5, ry: 4.5 },
    { feature: 'shoulders', on: 'scarf', fill: 'yellow', round: 0.5, nodes: [[19.8, 84.9, 1], [22.6, 82.1], [26.1, 80.2], [30, 79.6], [33.9, 80.2], [37.4, 82.1],
      [40.2, 84.9, 1], [38.2, 86.3, 1], [36, 84], [33.1, 82.5], [30, 82], [26.9, 82.5], [24, 84], [21.8, 86.3, 1]] },
    { feature: 'shoulders', on: 'scarf', fill: 'yellow', round: 0.5, nodes: [[40.2, 99.1, 1], [37.4, 101.9], [33.9, 103.8], [30, 104.4], [26.1, 103.8], [22.6, 101.9],
      [19.8, 99.1, 1], [21.8, 97.7, 1], [24, 100], [26.9, 101.5], [30, 102], [33.1, 101.5], [36, 100], [38.2, 97.7, 1]] },
    // Tail extras are drawn on the straight tail (base on the origin, tip at y -146,
    // +x away from the body); the library bends them onto the curve.
    // The end of the white brush, cut into pointed tufts that reach up into the salmon tip.
    { feature: 'tailTip', on: 'tail', clip: true, fill: 'fur', cx: -14, cy: -62, rx: 31, ry: 54,
      fluff: [{ from: 235, to: 305, n: 3, len: 16, lean: 0, depth: 0.05, b1: 15, b2: 15, jit: 0 }] },
    // The crescent on the tail, as every picture that shows it draws it: a ring left open toward the
    // tip, thickest toward the base, yellow for two thirds of its length and pink for the last third,
    // on the side away from the body, with a blue dot in the opening and a salmon speck beside it.
    // The two parts of the ring share one center (cx, cy), so that they turn with the tail as one.
    { feature: 'tailMarks', on: 'tail', fill: 'yellow', cx: -4, cy: -64, nodes: [[9.9, -65.2, 1], [8.8, -58.4], [4.6, -52.9], [-1.7, -50.2], [-8.6, -50.8], [-14.4, -54.6],
      [-17.6, -60.7], [-17.5, -67.6, 1], [-15.6, -68.1, 1], [-15.6, -63], [-13.2, -58.4], [-8.9, -55.5], [-3.7, -55.1], [1, -57.1], [4.2, -61.2], [5, -66.3, 1]] },
    { feature: 'tailMarks', on: 'tail', fill: 'earInner', cx: -4, cy: -64, nodes: [[-7.6, -77.5, 1], [0.4, -77.3], [7, -72.7], [9.9, -65.2, 1], [5, -66.3, 1], [2.8, -71.9],
      [-2.1, -75.4], [-8.1, -75.6, 1]] },
    { feature: 'tailMarks', on: 'tail', kind: 'ellipse', fill: 'sky', cx: -12.2, cy: -73.1, rx: 3.5, ry: 3.5 },
    { feature: 'tailMarks', on: 'tail', kind: 'ellipse', fill: 'tailTip', cx: -12.8, cy: -79.2, rx: 1.8, ry: 1.8 },
    // Feet extras are in the seated foot's space: the white fluffy trim at the top of each sock, its tufts hanging over
    // the blue.
    { feature: 'socks', on: 'feet', fill: 'fur', cx: -1, cy: -9, rx: 15, ry: 5, fluff: [{ from: 20, to: 160, n: 4, len: 4, depth: 0.05, b1: -20, b2: 20, jit: 0 }] },
  ],
  // The paws reach y ~131, so squash and stretch pivot about that height.
  rig: { ground: 131 },
  views: {
    // The house close-up (1254 px, head tipped 20°). There is no house-style reference for mumuyou yet.
    closeup: { w: 1254, h: 1254, x: 450, y: 835, scale: 5.5, rotate: 20 },
  },
});
