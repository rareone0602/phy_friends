// The spec before the alignment to the newer pictures (examples/67.png, by_yuda.png and gurumin1.png), drawn
// from examples/sheet.png and mark.png alone. Kept per STYLE.md, principle 1.
// Character spec for K3V1N, an ice-blue cat with large pointed ears, one blue eye and one orange eye, a
// yellow mark on his forehead and a bushy white-ended tail.
// Pictures: examples/sheet.png, mark.png.
// Colors are taken from the color bar on examples/sheet.png; those it does not show are taken from the drawing.
PhyFriends.define('kevin', {
  palette: {
    bg: '#1c1d21',
    fur: '#9ee8fa',        // The ice blue of the color bar (#adeffd), deepened slightly to hold its own on paper. Its house shade (furShade) fills the body, which sits under the head.
    face: '#e8f0f3',       // The white, deepened to mumuyou's depth to stay visible on paper: muzzle, dots, chest, paws and tail end.
    earInner: '#fcaac8',   // The pink of the ears, also used for the tongue.
    band: '#4db5ca',       // The darker cyan of the ear tips and cuffs, one house step deeper than the sheet's (#80cfe0), which matches furShade.
    eye: '#202638',        // A deep navy, near-black, used for the open mouth.
    eyeBlue: '#054dec',    // His right eye: the royal blue of the color bar.
    eyeOrange: '#fd8004',  // His left eye: the orange of the color bar.
    blush: '#fcc3d6',      // A soft pink, lighter than the ears.
    mark: '#fdff3b',       // The yellow of the mark on his forehead and the crescents on his thighs.
  },
  // The head is a round dome with a soft tuft down each side, under the ears.
  head: {
    cx: 0, cy: -22, rx: 92, ry: 71,
    fluff: [{ from: -26, to: -2, n: 1, len: 9, lean: 4, depth: 0, b1: -30, b2: 10, jit: 0, sym: true }],
  },
  // The white muzzle and lower cheeks, edged with small shingles. Setting len < 0 flattens the top, under the fringe.
  face: {
    cx: 0, cy: 16, rx: 80, ry: 38,
    fluff: [
      { from: -22, to: 26, n: 3, len: 5, lean: 3, depth: 0.1, b1: -20, b2: 5, jit: 0, sym: true },
      { from: 235, to: 305, n: 1, len: -4, b1: 0, b2: 0, jit: 0 },
    ],
  },
  // The ears are large, upright cat ears with soft tips. The pink inner ear keeps a broad fur margin; the
  // pale rim that the sheet draws around it is lighting and is left out.
  ears: {
    base: [-54, -70], angle: 27, width: 90, length: 88, lean: 8, tip: 10, b1: -16, b2: -8,
    inner: { scale: 0.6, dx: 2, dy: -12 },
  },
  // The mop is in the fur color: a crown inside the head's outline, a shaggy tuft under each ear, one
  // point between the eyes, as on the sheet, and a lock beside each eye. The valleys sit high enough to
  // clear the eyes as they look around. Each tip is [x, y, bendIn, bendOut, following valley].
  hair: {
    cx: 0, cy: -58, rx: 74, ry: 44, color: 'fur',
    tips: [
      [36, -84, 0, 0, [72, -62]],
      [90, -34, -6, -4, [70, -26]],
      [62, -2, 10, -12, [40, -34]],
      [0, -2, 8, -8, [-40, -34]],
      [-62, -2, -12, 10, [-70, -26]],
      [-90, -34, -4, -6, [-72, -62]],
      [-36, -84, 0, 0, [0, -80]],
    ],
  },
  // The eyes are plain tall pills, set wide and low, in his own colors, as his owner asked: blue on his
  // right (the viewer's left) and orange on his left, without the sheet's highlights or the mint and
  // yellow of their lower halves. Setting arc: 1 draws the happy, closed and squint strokes at the full eye width.
  eyes: { x: 34, y: 5, w: 13, h: 33, stroke: 4.8, arc: 1, color: 'eyeBlue', right: { color: 'eyeOrange' } },
  // The blush sits on the white under the outer corner of each eye, tipped up to follow the cheek. It
  // sits low enough that an eye looking down and outward does not land on it.
  blush: { x: 55, y: 29, rx: 11.5, ry: 7, tilt: 10 },
  // There is no mouth by default; when open, it shows the pink tongue of the sheet, without a fang.
  mouth: { y: 21, size: 3.8 },
  // The body is small, round and seated, in the house shade. Shoulder tufts sit under the cheeks, and small
  // hip tufts below them.
  body: {
    cx: 0, cy: 87, rx: 64, ry: 45, color: 'furShade',
    fluff: [{ from: -65, to: -25, n: 2, len: 7, depth: 0, b1: 0, b2: -25, jit: 0, sym: true },
      { from: 20, to: 60, n: 2, len: 6, lean: 6, depth: 0.08, b1: -25, b2: 5, jit: 0, sym: true }],
  },
  // The tail is a large bushy fox-like plume rising behind the left hip (the viewer's right), its tip
  // curling in. Its white end, cut into flame-shaped tufts that reach back toward the base, is its outer
  // half, as on the sheet. The white is what rises beside the cheek fluff, so that the ice blue stays
  // apart from the fur there as the tail sways in. The gray-lavender that the sheet paints along the
  // underside of the white is shading and is left out.
  tail: {
    base: [58, 106], angle: 60, length: 140, width: 102, bend: -74, taper: 0.72, root: 0.6, color: 'fur',
    fluff: [{ from: 300, to: 350, n: 2, len: 10, lean: 6, depth: 0.05, b1: -30, b2: 5, jit: 0 },
      { from: 255, to: 290, n: 1, len: 11, lean: -10, b1: 25, b2: -25, jit: 0 },
      { from: 200, to: 240, n: 2, len: 8, lean: 6, b1: -25, b2: 5, jit: 0 }],
    tip: { at: 0.5, color: 'face', fluff: [{ from: 50, to: 130, n: 3, len: 22, depth: 0.02, b1: 18, b2: 12, jit: 0.2 }] },
  },
  extras: [
    // The spiky cheek tufts: a fur ruff under the head whose points reach past the white cheeks. An n: 1
    // range with len < 0 tucks the bottom in under the chin.
    { on: 'base', under: true, fill: 'fur', cx: 0, cy: 13, rx: 92, ry: 48,
      fluff: [{ from: -42, to: 21, n: 3, len: 15, lean: -2, depth: 0.1, b1: -40, b2: 14, jit: 0, sym: true },
        { from: 45, to: 135, n: 1, len: -14, b1: 5, b2: 5, jit: 0 }] },
    // Ear extras are in ear-local space (base on the origin, tip up, +x toward the top of the head).
    // The round darker spot on each ear tip, which the sheet draws on the back of the ear; clipped to the ear, it caps the tip.
    { on: 'ears', clip: true, kind: 'ellipse', fill: 'band', cx: 8, cy: -88, rx: 30, ry: 26 },
    // The white dot above each eye.
    { on: 'hair', kind: 'ellipse', fill: 'face', cx: -33, cy: -35, rx: 5.5, ry: 5 },
    { on: 'hair', kind: 'ellipse', fill: 'face', cx: 33, cy: -35, rx: 5.5, ry: 5 },
    // His forehead mark as his owner draws it (examples/mark.png): straight round-ended strokes, an
    // upright, a diagonal rising from its foot to the top of a second, lower upright, and a level bar
    // across both, at one scale, with the strokes thickened to read at gallery size. It sits above his
    // right eye (the viewer's left), to the right of the white dot.
    { on: 'hair', fill: 'mark', round: 0.5, nodes: [[-17.2, -56.7, 1], [-17.2, -28, 1], [-14.4, -28, 1], [-14.4, -56.7, 1]] },
    { on: 'hair', fill: 'mark', round: 0.5, nodes: [[-15.8, -27.4, 1], [4.2, -47.1, 1], [2.3, -49.1, 1], [-17.8, -29.4, 1]] },
    { on: 'hair', fill: 'mark', round: 0.5, nodes: [[0.9, -48.5, 1], [0.9, -17.3, 1], [3.7, -17.3, 1], [3.7, -48.5, 1]] },
    { on: 'hair', fill: 'mark', round: 0.5, nodes: [[-24.3, -35.6, 1], [12.3, -35.6, 1], [12.3, -38.4, 1], [-24.3, -38.4, 1]] },
    // The white chest and belly, an oval from under the chin whose tufts hang over the belly, above the
    // cuffs of the forepaws.
    { on: 'body', clip: true, fill: 'face', cx: 0, cy: 80, rx: 22, ry: 28,
      fluff: [{ from: 40, to: 140, n: 3, len: 4, depth: 0.1, b1: -25, b2: 5, jit: 0 }] },
    // The yellow crescents on the outer side of each thigh, clipped to the body so that they start at its edge.
    { on: 'body', clip: true, fill: 'mark', nodes: [[72, 56, 1, 30], [36, 90, 1, -30], [72, 74, 1, 0]] },
    { on: 'body', clip: true, fill: 'mark', nodes: [[72, 82, 1, 30], [44, 104, 1, -30], [72, 94, 1, 0]] },
    { on: 'body', clip: true, fill: 'mark', nodes: [[-72, 56, 1, -30], [-36, 90, 1, 30], [-72, 74, 1, 0]] },
    { on: 'body', clip: true, fill: 'mark', nodes: [[-72, 82, 1, -30], [-44, 104, 1, 30], [-72, 94, 1, 0]] },
    // The hind feet, turned out slightly: white toes under a darker cuff at the ankle.
    { on: 'body', kind: 'ellipse', fill: 'band', cx: -50, cy: 118, rx: 17, ry: 10, rot: -8 },
    { on: 'body', kind: 'ellipse', fill: 'band', cx: 50, cy: 118, rx: 17, ry: 10, rot: 8 },
    { on: 'body', kind: 'ellipse', fill: 'face', cx: -50, cy: 123, rx: 17, ry: 8, rot: -8 },
    { on: 'body', kind: 'ellipse', fill: 'face', cx: 50, cy: 123, rx: 17, ry: 8, rot: 8 },
    // The white forepaws on the ground between them, each under a darker cuff at the wrist.
    { on: 'body', kind: 'ellipse', fill: 'band', cx: -16, cy: 113, rx: 11.5, ry: 8 },
    { on: 'body', kind: 'ellipse', fill: 'band', cx: 16, cy: 113, rx: 11.5, ry: 8 },
    { on: 'body', kind: 'ellipse', fill: 'face', cx: -16, cy: 121, rx: 12.5, ry: 10 },
    { on: 'body', kind: 'ellipse', fill: 'face', cx: 16, cy: 121, rx: 12.5, ry: 10 },
  ],
  // The paws reach y ~131, so squash and stretch pivot about that height.
  rig: { ground: 131 },
  views: {
    // The house close-up (1254 px, head tipped 20°). There is no house-style reference for K3V1N yet.
    closeup: { w: 1254, h: 1254, x: 450, y: 835, scale: 5.5, rotate: 20 },
  },
});
