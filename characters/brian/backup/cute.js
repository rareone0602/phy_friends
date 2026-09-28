// A candidate that lost to the "faithful" variant (reviewed as characters/brian/brian.js). Kept per STYLE.md, principle 1.
// Character spec for Brian, a cream fox in an orange newsboy cap and a green bandana, with brown boots.
// Pictures: examples/sheet.png.
// Colors are taken from the color circles on examples/sheet.png; the pale cream is deepened to stay visible on paper.
PhyFriends.define('brian', {
  palette: {
    bg: '#1c1d21',
    fur: '#ffe5b8',        // The cream. Its house shade (furShade) fills the body, which sits under the head.
    face: '#f5ecdc',       // The pale cream of the muzzle, cheeks, chest, forepaws and tail end, deepened to stay visible on paper.
    ear: '#c95f13',        // The dark orange of the backs and edges of the ears.
    cap: '#f6760a',        // The orange of the cap.
    band: '#f8688a',       // The thin pink band around the cap.
    dot: '#d8a977',        // The tan of the two dots on the forehead.
    scarf: '#6fa68a',      // The bandana. Its house shade (scarfShade) fills the band behind the point.
    boot: '#8b6d4c',       // The brown boots. Their house shade (bootShade) fills the cuffs, behind the feet.
    eye: '#2a211e',        // A warm near-black.
    blush: '#fbbcae',      // A soft peach pink.
  },
  // The head is a round dome with a soft tuft down each side, under the ears.
  head: {
    cx: 0, cy: -22, rx: 92, ry: 70,
    fluff: [{ from: -26, to: -2, n: 1, len: 9, lean: 4, depth: 0, b1: -30, b2: 10, jit: 0, sym: true }],
  },
  // The pale muzzle and plump cheeks are edged with small shingles; the cream ruff behind them (an extra)
  // makes the long cheek tufts. Setting len < 0 flattens the top, under the eyes.
  face: {
    cx: 0, cy: 16, rx: 80, ry: 38,
    fluff: [
      { from: -40, to: 20, n: 3, len: 5, lean: 3, depth: 0.1, b1: -18, b2: 5, jit: 0, sym: true },
      { from: 235, to: 305, n: 1, len: -4, b1: 0, b2: 0, jit: 0 },
    ],
  },
  // The ears are large pointed fox ears, set wide on either side of the cap: dark orange, with a broad
  // cream inner ear.
  ears: {
    base: [-58, -70], angle: 32, width: 88, length: 90, lean: 8, tip: 8, b1: -16, b2: -8, color: 'ear',
    inner: { scale: 0.58, dx: 2, dy: -12, color: 'fur' },
  },
  // The cap is a newsboy cap: a round puffy crown on top of the head, between the ears. An n: 1 range with
  // len < 0 flattens its foot, where the band and the brim are.
  hair: {
    cx: 0, cy: -92, rx: 62, ry: 40, color: 'cap',
    fluff: [{ from: 40, to: 140, n: 1, len: -10, b1: 0, b2: 0, jit: 0 }],
  },
  // The eyes are plain tall pills, set wide and low, in the house near-black (the sheet colors their right
  // eye orange-brown and their left eye blue). Setting arc: 1 draws the happy, closed and squint strokes at
  // the full eye width.
  eyes: { x: 33, y: 4, w: 13, h: 32, stroke: 4.6, arc: 1 },
  // The blush sits on the pale cheek under the outer corner of each eye, tipped up to follow the cheek.
  blush: { x: 53, y: 25, rx: 11.5, ry: 7, tilt: 10 },
  // There is no mouth by default; when open, it shows one fang and a tongue in the blush pink.
  mouth: { y: 21, size: 3.8, fang: true, tongue: 'blush' },
  // The body is small, round and seated, in the house shade. Shoulder tufts sit under the cheeks, and
  // small hip tufts below them.
  body: {
    cx: 0, cy: 86, rx: 64, ry: 45, color: 'furShade',
    fluff: [{ from: -65, to: -25, n: 2, len: 12, depth: 0, b1: 0, b2: -25, jit: 0, sym: true },
      { from: 20, to: 60, n: 2, len: 6, lean: 6, depth: 0.08, b1: -25, b2: 5, jit: 0, sym: true }],
  },
  // The tail is a large bushy plume rising behind their left hip (the viewer's right), its tip curling in.
  // Its pale end is cut into flame-shaped tufts that reach back toward the base.
  tail: {
    base: [56, 104], angle: 46, length: 148, width: 108, bend: -66, taper: 0.64, root: 0.5, color: 'fur',
    fluff: [{ from: 300, to: 350, n: 2, len: 10, lean: 6, depth: 0.05, b1: -30, b2: 5, jit: 0 },
      { from: 255, to: 290, n: 1, len: 10, lean: -10, b1: 25, b2: -25, jit: 0 },
      { from: 200, to: 240, n: 2, len: 8, lean: 6, b1: -25, b2: 5, jit: 0 }],
    tip: { at: 0.64, color: 'face', fluff: [{ from: 50, to: 130, n: 3, len: 16, depth: 0.02, b1: 18, b2: 12, jit: 0 }] },
  },
  extras: [
    // The cheek tufts: a cream ruff under the head whose points reach past the pale cheeks. An n: 1
    // range with len < 0 tucks the bottom in under the chin.
    { on: 'base', under: true, fill: 'fur', cx: 0, cy: 13, rx: 92, ry: 48,
      fluff: [{ from: -42, to: 21, n: 3, len: 16, lean: -3, depth: 0.1, b1: -33, b2: 10, jit: 0, sym: true },
        { from: 45, to: 135, n: 1, len: -14, b1: 5, b2: 5, jit: 0 }] },
    // The two tan dots on the forehead, under the brim and inside the eyes. They sit on the face, so that
    // they stay put when the cap sways.
    { on: 'face', kind: 'ellipse', fill: 'dot', cx: -24, cy: -35, rx: 8.5, ry: 5.5 },
    { on: 'face', kind: 'ellipse', fill: 'dot', cx: 24, cy: -35, rx: 8.5, ry: 5.5 },
    // Ear extras are in ear-local space (base on the origin, tip up, +x toward the top of the head).
    // The pale tuft rising from the base of the inner ear.
    { on: 'ears', clip: true, fill: 'face', cx: 5, cy: 0, rx: 24, ry: 19,
      fluff: [{ from: 200, to: 340, n: 3, len: 9, depth: 0.05, b1: -5, b2: 5, jit: 0 }] },
    // The cap: the short brim, peeking out under the crown; the pink band around the foot of the crown;
    // and the button on top.
    { on: 'hair', under: true, kind: 'ellipse', fill: 'cap', cx: 0, cy: -62, rx: 52, ry: 13 },
    { on: 'hair', clip: true, fill: 'band', nodes: [[-70, -70, 1], [70, -70, 1], [70, -50, 1], [-70, -50, 1]] },
    { on: 'hair', kind: 'ellipse', fill: 'cap', cx: 0, cy: -133, rx: 8, ry: 6 },
    // The pale chest and belly: a round bib under the bandana, its sides cut into tufts.
    { on: 'body', clip: true, fill: 'face', cx: 0, cy: 78, rx: 44, ry: 27,
      fluff: [{ from: -40, to: 60, n: 3, len: 6, lean: 5, depth: 0.1, b1: -25, b2: 5, jit: 0, sym: true }] },
    // The bandana: the band around the neck (in the house shade, because it lies behind the point) and
    // the broad point hanging on the chest. The knot is out of sight, as on the sheet.
    { on: 'body', fill: 'scarfShade', nodes: [[-54, 40, 1, 0], [54, 40, 1, 0], [52, 56, 1, -10], [-52, 56, 1, 0]], round: 0.3 },
    { on: 'body', fill: 'scarf', nodes: [[-54, 48, 1, 6], [54, 48, 1, -6], [0, 102, 1, -6]], round: 0.2 },
    // The hind feet in brown boots, turned out slightly. The cuff rises behind each foot, so it takes the house
    // shade, which is also the darker cuff that the sheet draws.
    { on: 'body', kind: 'ellipse', fill: 'bootShade', cx: -46, cy: 108, rx: 16, ry: 10, rot: -8 },
    { on: 'body', kind: 'ellipse', fill: 'bootShade', cx: 46, cy: 108, rx: 16, ry: 10, rot: 8 },
    { on: 'body', kind: 'ellipse', fill: 'boot', cx: -46, cy: 120, rx: 21, ry: 11.5, rot: -8 },
    { on: 'body', kind: 'ellipse', fill: 'boot', cx: 46, cy: 120, rx: 21, ry: 11.5, rot: 8 },
    // The pale forepaws on the ground between the hind feet.
    { on: 'body', kind: 'ellipse', fill: 'face', cx: -15, cy: 121, rx: 12.5, ry: 10 },
    { on: 'body', kind: 'ellipse', fill: 'face', cx: 15, cy: 121, rx: 12.5, ry: 10 },
  ],
  // The paws reach y ~131, so squash and stretch pivot about that height.
  rig: { ground: 131 },
  views: {
    // The house close-up (1254 px, head tipped 20°). There is no house-style reference for Brian yet.
    closeup: { w: 1254, h: 1254, x: 450, y: 835, scale: 5.5, rotate: 20 },
  },
});
