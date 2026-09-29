// The first draft of characters/tanyuan/tanyuan.js, before the adversarial review's fixes. Kept per STYLE.md, principle 1.
// Character spec for tanyuan, a tan dog with a messy white mop streaked with red, red eyes, one ear whose tip
// folds over, white eyebrow spots, a red mark on each cheek and a bushy white-ended tail.
// Pictures: examples/goggles.jpg, badminton.jpg, hoodie.jpg, ramen.jpg, bust.jpg, poster.jpg.
// Colors are taken from the ramen picture, whose fills are flat; those it does not show are taken from the bust.
PhyFriends.define('tanyuan', {
  palette: {
    bg: '#1c1d21',
    fur: '#eab27f',        // The tan of every picture. Its house shade (furShade) fills the body, which sits under the head, and the folded ear below its tip.
    face: '#efeef3',       // The white, deepened to mumuyou's depth to stay visible on paper: the mop, muzzle, eyebrow spots, chest, hind feet and tail end.
    earInner: '#aa7d5c',   // The brown inside the ears, from the bust.
    streak: '#b85a4b',     // The brick red of the streaks in the mop, also used for the marks on the cheeks.
    eye: '#2b2220',        // A warm near-black, as the pictures draw the nose, used for the open mouth.
    eyeRed: '#c84033',     // The red of the eyes in the ramen picture (#da6655), one house step deeper so that it holds its weight on the tan.
    blush: '#f4ad9e',      // The coral of the hatched blush in the ramen picture, as one flat soft tint.
  },
  // The head is a round dome with a soft tuft down each side, under the ears.
  head: {
    cx: 0, cy: -22, rx: 90, ry: 68,
    fluff: [{ from: -26, to: -2, n: 1, len: 9, lean: 4, depth: 0, b1: -30, b2: 10, jit: 0, sym: true }],
  },
  // The white muzzle and cheeks, with spiky tufts on the lower cheeks. The tan band across the eyes (an extra)
  // covers its top, so that the white starts under the eyes, as in every picture. It is tall enough for its top
  // edge to lie under the mop, since an edge under the band would show as a pale seam across the forehead.
  face: {
    cx: 0, cy: -2, rx: 86, ry: 62,
    fluff: [{ from: 16, to: 52, n: 3, len: 10, lean: 3, depth: 0.1, b1: -30, b2: 10, jit: 0, sym: true }],
  },
  // The ears are pointed dog ears with soft tips. His right ear (the viewer's left) stands; the other is cut off
  // at the fold, and its tip (an extra) hangs forward and outward, as in five of the six pictures. The part below
  // the fold lies behind the tip, so it takes the house shade.
  ears: {
    base: [-56, -66], angle: 27, width: 84, length: 86, lean: 8, tip: 8, b1: -14, b2: -8,
    inner: { scale: 0.6, dx: 2, dy: -12 },
    right: { angle: 30, length: 54, tip: 16, color: 'furShade', inner: { scale: 0.6, dx: 2, dy: -6 } },
  },
  // The messy mop is white: spiky tufts above the crown, a lock down each side of the face to eye level, a lock
  // over the outer corner of each eye and a narrow lock between the eyes. The valleys either side of that lock sit
  // high and are bowed alike, so that the tan forehead shows above each eye, where the white eyebrow spots are.
  // Each tip is [x, y, bendIn, bendOut, following valley].
  hair: {
    cx: 0, cy: -60, rx: 76, ry: 42, color: 'face',
    tips: [
      [36, -122, -12, -12, [70, -88]],
      [98, -56, -10, -6, [84, -32]],
      [90, 8, 6, -10, [72, -30]],
      [54, -10, 12, -6, [34, -52]],
      [2, 6, 8, 8, [-34, -52]],
      [-54, -10, -6, 12, [-72, -30]],
      [-90, 8, -10, 6, [-84, -32]],
      [-98, -52, 6, -12, [-70, -88]],
      [-40, -118, -14, -8, [-20, -110]],
      [-4, -134, -12, -10, [14, -112]],
    ],
  },
  // The eyes are plain tall pills in his own red, set wide and low on the tan. Setting arc: 1 draws the happy,
  // closed and squint strokes at the full eye width.
  eyes: { x: 34, y: 3, w: 13, h: 32, stroke: 5, arc: 1, color: 'eyeRed' },
  // The blush sits on the white under each eye, inside the cheek mark, tipped up to follow the cheek.
  blush: { x: 41, y: 34, rx: 9.5, ry: 6, tilt: 8 },
  // There is no mouth by default (the pictures' nose and mouth are omitted). It sits on the white, below the tan
  // between the eyes; when open, it shows a pink tongue and no fang, as the pictures show none.
  mouth: { y: 27, size: 3.8, tongue: 'blush' },
  // The body is seated and round. It sits under the head, so it takes the house shade. Shoulder tufts sit
  // under the cheeks, and small hip tufts below them.
  body: {
    cx: 0, cy: 84, rx: 66, ry: 48, color: 'furShade',
    fluff: [{ from: -65, to: -25, n: 2, len: 12, depth: 0, b1: 0, b2: -25, jit: 0, sym: true },
      { from: 20, to: 60, n: 2, len: 7, lean: 6, depth: 0.08, b1: -25, b2: 5, jit: 0, sym: true }],
  },
  // The tail is a bushy plume rising behind his left hip (the viewer's right), its tip curling in, with a white
  // end cut into tufts that reach back toward the base, as in the badminton picture.
  tail: {
    base: [56, 106], angle: 52, length: 136, width: 96, bend: -70, taper: 0.72, root: 0.5, color: 'fur',
    fluff: [{ from: 300, to: 350, n: 2, len: 10, lean: 6, depth: 0.05, b1: -30, b2: 5, jit: 0 },
      { from: 255, to: 290, n: 1, len: 16, lean: -10, b1: 25, b2: -25, jit: 0 },
      { from: 200, to: 240, n: 2, len: 8, lean: 6, b1: -25, b2: 5, jit: 0 }],
    tip: { at: 0.62, color: 'face', fluff: [{ from: 50, to: 130, n: 3, len: 16, depth: 0.02, b1: 18, b2: 12, jit: 0.2 }] },
  },
  extras: [
    // The tan band across the eyes: it covers the top of the white face down to just under the eyes, far enough
    // that an eye looking down stays on the tan, and runs lower on the outer cheeks, where the red marks sit.
    { on: 'face', clip: true, fill: 'fur', nodes: [[-100, -80, 1], [100, -80, 1], [100, 34, 1, 0], [66, 36, 1, 20],
      [44, 26, 1, -10], [0, 22, 1, -10], [-44, 26, 1, 20], [-66, 36, 1, 0], [-100, 34, 1]] },
    // The red mark on each cheek: a small triangle under the outer corner of the eye, pointing in toward the nose.
    { on: 'face', fill: 'streak', nodes: [[-72, 20, 1, 12], [-52, 31, 1, 12], [-68, 37, 1, -8]] },
    { on: 'face', fill: 'streak', nodes: [[72, 20, 1, -12], [68, 37, 1, 8], [52, 31, 1, -12]] },
    // The white eyebrow spots: an oval above each eye, on the tan between the locks.
    { on: 'face', kind: 'ellipse', fill: 'face', cx: -33, cy: -28, rx: 7.5, ry: 5, rot: -8 },
    { on: 'face', kind: 'ellipse', fill: 'face', cx: 33, cy: -28, rx: 7.5, ry: 5, rot: 8 },
    // Ear extras are in ear-local space (base on the origin, tip up, +x toward the top of the head).
    // The folded tip of his left ear: a round flap in the tan that hangs forward and outward from the fold.
    { on: 'earR', fill: 'fur', round: 0.3, nodes: [[-24, -44, 1, -24], [26, -58, 1, -24], [-62, -8, 1, -24]] },
    // The red streaks in the mop: long thin strokes, pointed at both ends, running down the locks as in the bust.
    { on: 'hair', clip: true, fill: 'streak', nodes: [[-40, -112, 1, -20], [-66, -40, 1, -10]] },
    { on: 'hair', clip: true, fill: 'streak', nodes: [[6, -124, 1, -10], [22, -64, 1, -20]] },
    { on: 'hair', clip: true, fill: 'streak', nodes: [[62, -96, 1, -10], [86, -30, 1, -20]] },
    { on: 'hair', clip: true, fill: 'streak', nodes: [[-88, -46, 1, -20], [-84, 0, 1, -10]] },
    // The white chest, clear of the white chin so that the shaded body parts the two, with its tufts hanging over
    // the belly.
    { on: 'body', clip: true, fill: 'face', cx: 0, cy: 88, rx: 36, ry: 22,
      fluff: [{ from: 30, to: 150, n: 4, len: 6, depth: 0.08, b1: -25, b2: 5, jit: 0 }] },
    // The white hind feet, turned out slightly, as the badminton picture draws the lower legs.
    { on: 'body', kind: 'ellipse', fill: 'face', cx: -48, cy: 120, rx: 19, ry: 10, rot: -8 },
    { on: 'body', kind: 'ellipse', fill: 'face', cx: 48, cy: 120, rx: 19, ry: 10, rot: 8 },
    // The tan forepaws on the ground between them.
    { on: 'body', kind: 'ellipse', fill: 'fur', cx: -15, cy: 121, rx: 12.5, ry: 10 },
    { on: 'body', kind: 'ellipse', fill: 'fur', cx: 15, cy: 121, rx: 12.5, ry: 10 },
  ],
  // The paws reach y ~131, so squash and stretch pivot about that height.
  rig: { ground: 131 },
  views: {
    // The house close-up (1254 px, head tipped 20°). There is no house-style reference for tanyuan yet.
    closeup: { w: 1254, h: 1254, x: 450, y: 835, scale: 5.5, rotate: 20 },
  },
});
