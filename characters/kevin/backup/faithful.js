// A candidate that lost to the "cute" variant (reviewed as characters/kevin/kevin.js). Kept per STYLE.md, principle 1.
// Character spec for K3V1N, an ice-blue cat with a large white-tipped bushy tail, a yellow lightning mark
// on his forehead and yellow stripes on his thighs.
// Pictures: examples/sheet.png.
// Colors are taken from the color bar on examples/sheet.png; those the bar does not show are taken from
// the front view beside it.
PhyFriends.define('kevin', {
  palette: {
    bg: '#1c1d21',
    fur: '#adeffd',        // The ice blue of the color bar. Its house shade (furShade) fills the body, which sits under the head.
    face: '#e6f0f4',       // The white of the muzzle, forehead dots, chest, paws and tail, deepened slightly to stay visible on paper.
    earInner: '#fcaac8',   // The pink of the inner ears, the toe beans and the tongue.
    band: '#66b7c8',       // The spots on the ear tips and the bands above the paws. The sheet's #80cfe0 nearly matches the fur's house shade, so it is one step darker here, apart from the shaded body.
    eye: '#23263d',        // Near-black with a faint navy tint.
    blush: '#fbbfd0',      // The sheet draws no blush; this soft pink is chosen to go with the pink of his ears.
    mark: '#fdff3b',       // The yellow of the color bar: the lightning mark and the thigh stripes.
  },
  // The head is a round dome whose sides are cut into spiky tufts under the ears.
  head: {
    cx: 0, cy: -22, rx: 90, ry: 68,
    fluff: [{ from: -32, to: -2, n: 2, len: 10, lean: 4, depth: 0.05, b1: -30, b2: 10, jit: 0, sym: true }],
  },
  // The white covers the muzzle and the cheeks. On the sheet it stops halfway up the eyes; here it rises
  // to their tops, so that each pill eye sits on one color, and fur locks hang into it. Its sides are
  // cut into small shingles against the fur ruff behind them.
  face: {
    cx: 0, cy: 12, rx: 80, ry: 40,
    fluff: [
      { from: -30, to: 20, n: 3, len: 4, lean: 3, depth: 0.1, b1: -18, b2: 5, jit: 0, sym: true },
      { from: 235, to: 305, n: 1, len: -4, b1: 0, b2: 0, jit: 0 }, // Setting len < 0 flattens the top.
    ],
  },
  // The ears are large, upright and pointed, like a cat's, with large pink insides and no pale rim.
  ears: {
    base: [-56, -68], angle: 26, width: 86, length: 90, lean: 8, tip: 6, b1: -14, b2: -8,
    inner: { scale: 0.66, dx: 2, dy: -6 },
  },
  // The mop is in the fur color: spiky tufts on the crown and at the sides, and pointed locks that hang
  // over the white, one between the eyes and one beside each. Their inner edges are concave, so that they
  // clear the eyes as they look around. Each tip is [x, y, bendIn, bendOut, following valley].
  hair: {
    cx: 0, cy: -58, rx: 74, ry: 42, color: 'fur',
    tips: [
      [-38, -128, -4, -10, [-4, -106]],
      [26, -124, -8, -6, [54, -98]],
      [90, -58, -6, -4, [86, -30]],
      [68, 0, 8, 6, [30, -44]],
      [0, 2, 8, 8, [-30, -44]],
      [-68, 0, 6, 8, [-86, -30]],
      [-90, -58, -4, -6, [-60, -100]],
    ],
  },
  // The eyes are plain tall pills, set wide and low. The sheet's blue and orange eyes are drawn near-black,
  // as FWIENDS.md asks unless the owner wants otherwise. Setting arc: 1 draws the happy, closed and squint
  // strokes at the full eye width.
  eyes: { x: 34, y: 3, w: 13, h: 33, stroke: 4.5, arc: 1 },
  // The blush sits on the white under the outer corner of each eye, tipped up to follow the cheek. It
  // sits low enough that an eye looking down and outward does not land on it.
  blush: { x: 54, y: 27, rx: 11, ry: 6.5, tilt: 10 },
  // There is no mouth by default; when open, it shows the pink tongue of the sheet, and no fang.
  mouth: { y: 20, size: 3.8 },
  // The body is seated and round. It sits under the head, so it takes the house shade. Shoulder tufts
  // sit under the cheeks, and small hip tufts below them.
  body: {
    cx: 0, cy: 82, rx: 68, ry: 50, color: 'furShade',
    fluff: [{ from: -65, to: -25, n: 2, len: 14, depth: 0, b1: 0, b2: -25, jit: 0, sym: true },
      { from: 20, to: 60, n: 2, len: 7, lean: 6, depth: 0.08, b1: -25, b2: 5, jit: 0, sym: true }],
  },
  // The tail is a large bushy plume rising behind his left hip (the viewer's right), its tip curling in.
  // Its white end is cut into flame-shaped tufts that reach back into the ice blue. The gray at its very
  // end on the sheet is the shading of its underside, which also darkens the blue, so it is not drawn.
  tail: {
    base: [56, 106], angle: 50, length: 144, width: 100, bend: -70, taper: 0.7, root: 0.5, color: 'fur',
    fluff: [{ from: 300, to: 350, n: 2, len: 10, lean: 6, depth: 0.05, b1: -30, b2: 5, jit: 0 },
      { from: 255, to: 290, n: 1, len: 18, lean: -10, b1: 25, b2: -25, jit: 0 },
      { from: 200, to: 240, n: 2, len: 9, lean: 6, b1: -25, b2: 5, jit: 0 }],
    tip: { at: 0.5, color: 'face', fluff: [{ from: 50, to: 130, n: 4, len: 18, depth: 0.02, b1: 18, b2: 12, jit: 0.2 }] },
  },
  extras: [
    // Cheek fluff under the head: a fur ruff whose long spiky tufts reach past the white cheeks. An
    // n: 1 range with len < 0 tucks the bottom in under the chin.
    { on: 'base', under: true, fill: 'fur', cx: 0, cy: 14, rx: 92, ry: 48,
      fluff: [{ from: -42, to: 21, n: 3, len: 18, lean: -3, depth: 0.1, b1: -33, b2: 10, jit: 0, sym: true },
        { from: 45, to: 135, n: 1, len: -14, b1: 5, b2: 5, jit: 0 }] },
    // Ear extras are in ear-local space (base on the origin, tip up, +x toward the top of the head);
    // on: 'ears' puts them on both. The round spot on the tip of each ear.
    { on: 'ears', clip: true, kind: 'ellipse', fill: 'band', cx: 6, cy: -92, rx: 30, ry: 26 },
    // The forehead marks: a white dot above each eye and the yellow lightning bolt above his right eye
    // (the viewer's left), drawn over the mop.
    { on: 'hair', kind: 'ellipse', fill: 'face', cx: -36, cy: -33, rx: 5.5, ry: 5 },
    { on: 'hair', kind: 'ellipse', fill: 'face', cx: 36, cy: -33, rx: 5.5, ry: 5 },
    { on: 'hair', fill: 'mark', nodes: [[-10, -55, 1], [-3, -55, 1], [-9, -44, 1], [-3, -44, 1], [-17, -27, 1], [-13, -40, 1], [-19, -40, 1]] },
    // The white chest and belly: a strip that narrows to a point above the forepaws.
    { on: 'body', clip: true, fill: 'face', cx: 0, cy: 72, rx: 22, ry: 26,
      fluff: [{ from: 55, to: 125, n: 1, len: 18, depth: 0, b1: -10, b2: -10, jit: 0 }] },
    // The yellow stripes: two crescents on the outer side of each thigh, sweeping in toward the front.
    { on: 'body', clip: true, fill: 'mark', nodes: [[-76, 50, 1], [-64, 82], [-30, 95, 1], [-50, 82], [-62, 63]] },
    { on: 'body', clip: true, fill: 'mark', nodes: [[-76, 76, 1], [-65, 97], [-40, 103, 1], [-56, 95], [-67, 86]] },
    { on: 'body', clip: true, fill: 'mark', nodes: [[76, 50, 1], [62, 63], [50, 82], [30, 95, 1], [64, 82]] },
    { on: 'body', clip: true, fill: 'mark', nodes: [[76, 76, 1], [67, 86], [56, 95], [40, 103, 1], [65, 97]] },
    // The hind feet, soles to the front: the band around each ankle, the white sole, and pink beans (a
    // main pad and three toes, as in the paw prints on the sheet). The sheet's gray soles are shading.
    { on: 'body', kind: 'ellipse', fill: 'band', cx: -50, cy: 112, rx: 18, ry: 15 },
    { on: 'body', kind: 'ellipse', fill: 'band', cx: 50, cy: 112, rx: 18, ry: 15 },
    { on: 'body', kind: 'ellipse', fill: 'face', cx: -50, cy: 117, rx: 17, ry: 14 },
    { on: 'body', kind: 'ellipse', fill: 'face', cx: 50, cy: 117, rx: 17, ry: 14 },
    { on: 'body', fill: 'earInner', round: 0.4, polys: [[-50, 122, 8, 3, -90, 0.85], [-60, 111, 3.2], [-50, 107, 3.2], [-40, 111, 3.2],
      [50, 122, 8, 3, -90, 0.85], [40, 111, 3.2], [50, 107, 3.2], [60, 111, 3.2]] },
    // The forepaws on the ground between the hind feet, each with a band just above the white paw.
    { on: 'body', kind: 'ellipse', fill: 'band', cx: -16, cy: 115, rx: 11.5, ry: 9 },
    { on: 'body', kind: 'ellipse', fill: 'band', cx: 16, cy: 115, rx: 11.5, ry: 9 },
    { on: 'body', kind: 'ellipse', fill: 'face', cx: -16, cy: 122, rx: 12.5, ry: 9 },
    { on: 'body', kind: 'ellipse', fill: 'face', cx: 16, cy: 122, rx: 12.5, ry: 9 },
  ],
  // The paws reach y ~131, so squash and stretch pivot about that height.
  rig: { ground: 131 },
  views: {
    // The house close-up (1254 px, head tipped 20°). There is no house-style reference for K3V1N yet.
    closeup: { w: 1254, h: 1254, x: 450, y: 835, scale: 5.5, rotate: 20 },
  },
});
