// A candidate that lost to the "cute" variant (reviewed as characters/kevin/kevin.js). Kept per STYLE.md, principle 1.
// Character spec for K3V1N, an ice-blue cat with a lightning-bolt mark and a large white-ended tail.
// Pictures: examples/sheet.png.
// Colors are taken from the color bar on examples/sheet.png; those the bar does not show are taken
// from the front view. His eyes are drawn as the house's plain pills, as his owner has not asked otherwise.
// The sheet's darker cyan (the spots on the backs of the ears and the bands above the paws) is the fur's
// house shade, so those marks are left out rather than drawn as a second step of shading.
PhyFriends.define('kevin', {
  palette: {
    bg: '#1c1d21',
    fur: '#9ee8fa',        // The ice blue of the color bar, deepened slightly to hold its weight on paper. Its house shade (furShade) fills the body, which sits under the head.
    face: '#e6f1f4',       // The white of the muzzle, chest, paws and tail, deepened slightly to stay visible on paper.
    earInner: '#fcaac8',   // The pink of the ears, also used for the tongue.
    eye: '#20263a',        // A near-black with a faint navy tint.
    blush: '#fcc4d4',      // A soft pink, lighter than the ears.
    mark: '#fdff3b',       // The yellow of the lightning bolt and the thigh stripes.
    tailTip: '#a9b5c9',    // The gray-lavender at the very end of the tail.
  },
  // The head is a round dome with a shaggy tuft down each side, under the ears.
  head: {
    cx: 0, cy: -22, rx: 90, ry: 68,
    fluff: [{ from: -26, to: -2, n: 1, len: 9, lean: 4, depth: 0, b1: -30, b2: 10, jit: 0, sym: true }],
  },
  // The white muzzle and lower cheeks, their sides cut into small shingles. The cheek ruff behind them
  // (an extra) makes the long spikes. Setting len < 0 flattens the top, above the eyes.
  face: {
    cx: 0, cy: 12, rx: 78, ry: 40,
    fluff: [
      { from: -40, to: 20, n: 3, len: 4, lean: 3, depth: 0.1, b1: -18, b2: 5, jit: 0, sym: true },
      { from: 235, to: 305, n: 1, len: -6, b1: 0, b2: 0, jit: 0 },
    ],
  },
  // The ears are large, upright cat ears with pointed tips, broad pink insides and a wide fur margin.
  ears: {
    base: [-54, -70], angle: 31, width: 84, length: 86, lean: 8, tip: 6, b1: -12, b2: -6,
    inner: { scale: 0.66, dx: 2, dy: -10 },
  },
  // The mop is in the fur color: a shaggy crown between the ears, a spike at each temple, and a lock
  // down each side of the face, beside the eyes. The forehead is left bare for its marks.
  // Each tip is [x, y, bendIn, bendOut, following valley].
  hair: {
    cx: 0, cy: -58, rx: 72, ry: 40, color: 'fur',
    tips: [
      [-26, -118, -4, 10, [0, -98]],
      [24, -112, -6, -10, [56, -84]],
      [94, -42, -6, -8, [80, -30]],
      [64, 10, -10, 10, [44, -38]],
      [0, -52, 0, 0, [-44, -38]],
      [-64, 10, 10, -10, [-80, -30]],
      [-94, -42, -8, -6, [-56, -90]],
    ],
  },
  // The eyes are plain tall pills, set wide and low. Setting arc: 1 draws the happy, closed and
  // squint strokes at the full eye width.
  eyes: { x: 34, y: 3, w: 13, h: 32, stroke: 4.5, arc: 1 },
  // The blush sits on the white under the outer corner of each eye, tipped up to follow the cheek. It
  // sits low enough that an eye looking down and outward does not land on it.
  blush: { x: 53, y: 26, rx: 11, ry: 6.5, tilt: 10 },
  // There is no mouth by default; when open, it shows the pink tongue of the sheet and no fang.
  mouth: { y: 20, size: 3.8, tongue: 'earInner' },
  // The body is seated and round. It sits under the head, so it takes the house shade. Shoulder tufts
  // sit under the cheeks, and small hip tufts below them.
  body: {
    cx: 0, cy: 84, rx: 66, ry: 48, color: 'furShade',
    fluff: [{ from: -65, to: -25, n: 2, len: 14, depth: 0, b1: 0, b2: -25, jit: 0, sym: true },
      { from: 20, to: 60, n: 2, len: 7, lean: 6, depth: 0.08, b1: -25, b2: 5, jit: 0, sym: true }],
  },
  // The tail is a very large bushy plume rising behind the left hip (the viewer's right), its end
  // white and cut into flame-shaped tufts that reach back toward the base.
  tail: {
    base: [56, 106], angle: 52, length: 142, width: 100, bend: -74, taper: 0.7, root: 0.5, color: 'fur',
    fluff: [{ from: 300, to: 350, n: 2, len: 10, lean: 6, depth: 0.05, b1: -30, b2: 5, jit: 0 },
      { from: 255, to: 290, n: 1, len: 18, lean: -10, b1: 25, b2: -25, jit: 0 },
      { from: 195, to: 240, n: 2, len: 8, lean: 6, b1: -25, b2: 5, jit: 0 }],
    tip: { at: 0.5, color: 'face', fluff: [{ from: 50, to: 130, n: 3, len: 18, depth: 0.02, b1: 18, b2: 12, jit: 0.2 }] },
  },
  extras: [
    // Cheek fluff under the head: a fur ruff whose long spikes reach out past the white cheeks. An
    // n: 1 range with len < 0 tucks the bottom in under the chin.
    { on: 'base', under: true, fill: 'fur', cx: 0, cy: 14, rx: 92, ry: 48,
      fluff: [{ from: -42, to: 21, n: 3, len: 16, lean: -3, depth: 0.1, b1: -33, b2: 10, jit: 0, sym: true },
        { from: 45, to: 135, n: 1, len: -14, b1: 5, b2: 5, jit: 0 }] },
    // The white rises into a soft point between the eyes.
    { on: 'face', fill: 'face', nodes: [[0, -34, 1, -14], [16, -12, 1, 0], [-16, -12, 1, -14]] },
    // Ear extras are in ear-local space (base on the origin, tip up, +x toward the top of the
    // head); on: 'ears' puts them on both.
    // The zigzag tuft of fur rising from the base of the inner ear.
    { on: 'ears', clip: true, fill: 'fur', cx: 5, cy: 0, rx: 26, ry: 20,
      fluff: [{ from: 200, to: 340, n: 3, len: 9, depth: 0.05, b1: -5, b2: 5, jit: 0 }] },
    // The two white dots on the forehead, one above each eye.
    { on: 'hair', kind: 'ellipse', fill: 'face', cx: -32, cy: -38, rx: 5, ry: 5 },
    { on: 'hair', kind: 'ellipse', fill: 'face', cx: 24, cy: -40, rx: 5, ry: 5 },
    // The yellow lightning bolt above his right eye (the viewer's left), between the dots.
    { on: 'hair', fill: 'mark', nodes: [[-12, -58, 1], [-3, -58, 1], [-8, -48, 1], [-1, -48, 1], [-16, -30, 1], [-12, -43, 1], [-19, -43, 1]] },
    // The white chest and belly: a narrow strip under the chin, its sides cut into tufts, ending above the forepaws.
    { on: 'body', clip: true, fill: 'face', cx: 0, cy: 78, rx: 32, ry: 31,
      fluff: [{ from: -40, to: 60, n: 3, len: 6, lean: 5, depth: 0.1, b1: -25, b2: 5, jit: 0, sym: true }] },
    // The yellow stripes: two crescents on the outside of each thigh, curving down and inward from the edge.
    { on: 'body', clip: true, fill: 'mark', nodes: [[72, 60, 1, 0], [72, 80, 1, -25], [40, 102, 1, 14]] },
    { on: 'body', clip: true, fill: 'mark', nodes: [[72, 90, 1, 0], [72, 104, 1, -25], [52, 116, 1, 14]] },
    { on: 'body', clip: true, fill: 'mark', nodes: [[-72, 60, 1, -14], [-40, 102, 1, 25], [-72, 80, 1, 0]] },
    { on: 'body', clip: true, fill: 'mark', nodes: [[-72, 90, 1, -14], [-52, 116, 1, 25], [-72, 104, 1, 0]] },
    // The hind feet, turned out slightly, with white toes.
    { on: 'body', kind: 'ellipse', fill: 'fur', cx: -46, cy: 121, rx: 19, ry: 10, rot: -8 },
    { on: 'body', kind: 'ellipse', fill: 'fur', cx: 46, cy: 121, rx: 19, ry: 10, rot: 8 },
    { on: 'body', kind: 'ellipse', fill: 'face', cx: -47, cy: 125.5, rx: 16, ry: 5.5, rot: -8 },
    { on: 'body', kind: 'ellipse', fill: 'face', cx: 47, cy: 125.5, rx: 16, ry: 5.5, rot: 8 },
    // White forepaws on the ground, under the chest.
    { on: 'body', kind: 'ellipse', fill: 'face', cx: -16, cy: 121, rx: 13, ry: 10 },
    { on: 'body', kind: 'ellipse', fill: 'face', cx: 16, cy: 121, rx: 13, ry: 10 },
    // Tail extras are drawn on the straight tail (base on the origin, tip at y -142,
    // +x away from the body); the library bends them onto the curve.
    // The gray-lavender end, its edge a row of tufts pointing back toward the base.
    { on: 'tail', clip: true, fill: 'tailTip', cx: 0, cy: -156, rx: 100, ry: 34,
      fluff: [{ from: 60, to: 120, n: 3, len: 9, depth: 0.04, jit: 0 }] },
  ],
  // The paws reach y ~131, so squash and stretch pivot about that height.
  rig: { ground: 131 },
  views: {
    // The house close-up (1254 px, head tipped 20°). There is no house-style reference for K3V1N yet.
    closeup: { w: 1254, h: 1254, x: 450, y: 835, scale: 5.5, rotate: 20 },
  },
});
