// The spec of characters/yuda/yuda.js before its redesign closer to examples/bandana.png and icon.png. Kept per
// STYLE.md, principle 1.
// Character spec for Yuda, a slate-blue wolf with white eyebrow spots and a cyan bandana.
// Pictures: examples/icon.png, waving.png, card.png, teacup.png, bandana.png, snowman.webp.
// Colors are taken from examples/icon.png; those the icon does not show are taken from waving.png.
PhyFriends.define('yuda', {
  palette: {
    bg: '#1c1d21',
    fur: '#6c7ba7',        // The slate blue of the icon. Its house shade (furShade) fills the body, which sits under the head.
    face: '#f9f7f6',       // The muzzle, cheeks, eyebrow spots, chest and forepaws.
    earInner: '#88d5dd',   // Cyan, also used for the inside of the open mouth.
    eye: '#23263d',        // A deep slate navy, for the open mouth.
    eyeBlue: '#4e7ec0',    // The blue of the eyes in waving.png and card.png.
    blush: '#a9dbf3',      // A soft sky blue, as his owner set it (the pictures draw it peach or pink).
    scarf: '#98f0ff',      // The bandana. Its house shade (scarfShade) fills the band and the knot.
    tailMid: '#94a1d9',    // The periwinkle band on the tail, drawn in both waving.png and teacup.png.
    tailTip: '#bfbdf1',    // The pale lavender tip of the tail.
  },
  // The head is a round dome with a soft tuft down each side, under the ears.
  head: {
    cx: 0, cy: -22, rx: 90, ry: 68,
    fluff: [{ from: -26, to: -2, n: 1, len: 9, lean: 4, depth: 0, b1: -30, b2: 10, jit: 0, sym: true }],
  },
  // The white muzzle and plump round cheeks are edged with small shingles; the fur ruff behind them
  // (an extra) makes the long cheek spikes. Setting len < 0 flattens the top, under the forehead locks.
  face: {
    cx: 0, cy: 14, rx: 80, ry: 38,
    fluff: [
      { from: -40, to: 20, n: 3, len: 4, lean: 3, depth: 0.1, b1: -18, b2: 5, jit: 0, sym: true },
      { from: 235, to: 305, n: 1, len: -4, b1: 0, b2: 0, jit: 0 },
    ],
  },
  // The ears are large and pointed, with soft tips, and tipped out slightly. The cyan inner ear keeps a broad slate
  // margin, as in all three pictures, because a thin rim would read as an outline.
  ears: {
    base: [-48, -74], angle: 36, width: 78, length: 76, lean: 6, tip: 8, b1: -16, b2: -8,
    inner: { scale: 0.64, dx: 1, dy: -10 },
  },
  // The mop is in the fur color, with a tall crest leaning left on the crown (every picture has it),
  // a smaller spike beside it, and flame-shaped locks hanging over the forehead beside each eye.
  // The valleys sit high enough to clear the eyes as they look around.
  // Each tip is [x, y, bendIn, bendOut, following valley].
  hair: {
    cx: 0, cy: -58, rx: 72, ry: 40, color: 'fur',
    tips: [
      [-34, -132, 2, 12, [0, -96]],
      [22, -110, -6, -10, [52, -76]],
      [76, -30, 0, 0, [70, -24]],
      [60, -4, 10, -12, [40, -33]],
      [14, -7, 8, -12, [0, -46]],
      [-14, -7, -12, 8, [-40, -33]],
      [-60, -4, -12, 10, [-70, -24]],
      [-76, -30, 0, 0, [-50, -80]],
    ],
  },
  // The eyes are plain tall pills in Yuda's own blue, set wide and low. Setting arc: 1 draws the happy,
  // closed and squint strokes at the full eye width.
  eyes: { x: 34, y: 3, w: 13, h: 33, stroke: 4.5, arc: 1, color: 'eyeBlue' },
  // The blush sits on the white under the outer corner of each eye, tipped up to follow the cheek. It
  // sits low enough that an eye looking down and outward does not land on it.
  blush: { x: 53, y: 24.5, rx: 11, ry: 6.5, tilt: 10 },
  // There is no mouth by default; when open, it shows one fang and the cyan inside from waving.png.
  mouth: { y: 20, size: 3.8, fang: true },
  // The body is seated and round. It sits under the head, so it takes the house shade. Shoulder tufts
  // sit under the cheeks, and small hip tufts below them.
  body: {
    cx: 0, cy: 82, rx: 70, ry: 50, color: 'furShade',
    fluff: [{ from: -65, to: -25, n: 2, len: 14, depth: 0, b1: 0, b2: -25, jit: 0, sym: true },
      { from: 20, to: 60, n: 2, len: 7, lean: 6, depth: 0.08, b1: -25, b2: 5, jit: 0, sym: true }],
  },
  // The tail is a large bushy plume rising behind the right hip, its tip curling in. It is slate,
  // then a periwinkle band, then a pale lavender tip, markings that both artists draw.
  tail: {
    base: [56, 106], angle: 52, length: 142, width: 96, bend: -70, taper: 0.75, root: 0.5, color: 'fur',
    // Soft tufts down the outer edge and one on the inner edge; the tip is a point hooked inward.
    fluff: [{ from: 300, to: 350, n: 2, len: 10, lean: 6, depth: 0.05, b1: -30, b2: 5, jit: 0 },
      { from: 255, to: 290, n: 1, len: 18, lean: -10, b1: 25, b2: -25, jit: 0 },
      { from: 200, to: 240, n: 1, len: 8, lean: 6, b1: -25, b2: 5, jit: 0 }],
    tip: { at: 0.34, n: 3, len: 8, color: 'tailMid' },
  },
  extras: [
    // Cheek fluff under the head: a fur ruff whose tufts sit behind the white ones and reach past
    // them, so that the white points read against fur instead of vanishing into the paper. An n: 1
    // range with len < 0 tucks the bottom in under the chin.
    { on: 'base', under: true, fill: 'fur', cx: 0, cy: 13, rx: 90, ry: 48,
      fluff: [{ from: -42, to: 21, n: 3, len: 16, lean: -3, depth: 0.1, b1: -33, b2: 10, jit: 0, sym: true },
        { from: 45, to: 135, n: 1, len: -14, b1: 5, b2: 5, jit: 0 }] },
    // The white rises into a tall point between the eyes, up between the eyebrow spots (as in teacup.png and bandana.png).
    { on: 'face', fill: 'face', nodes: [[0, -42, 1, -12], [13, -12, 1, 0], [-13, -12, 1, -12]] },
    // Ear extras are in ear-local space (base on the origin, tip up, +x toward the top of the
    // head); on: 'ears' puts them on both.
    // The zigzag tuft of fur rising from the base of the inner ear.
    { on: 'ears', clip: true, fill: 'fur', cx: 5, cy: 0, rx: 24, ry: 19,
      fluff: [{ from: 200, to: 340, n: 3, len: 9, depth: 0.05, b1: -5, b2: 5, jit: 0 }] },
    // The eyebrow spots: two white ovals above the eyes, their inner ends raised slightly.
    { on: 'hair', kind: 'ellipse', fill: 'face', cx: -30, cy: -38, rx: 10, ry: 7.5, rot: -10 },
    { on: 'hair', kind: 'ellipse', fill: 'face', cx: 30, cy: -38, rx: 10, ry: 7.5, rot: 10 },
    // The white chest and belly: a round bib under the bandana, its sides cut into tufts, ending above the forepaws.
    { on: 'body', clip: true, fill: 'face', cx: 0, cy: 80, rx: 46, ry: 30,
      fluff: [{ from: -40, to: 60, n: 3, len: 6, lean: 5, depth: 0.1, b1: -25, b2: 5, jit: 0, sym: true }] },
    // The bandana: the band around the neck (in the house shade, because it lies behind the point),
    // the point hanging on the chest, and two ends sticking out from the knot at the side of the
    // neck. The knot lies behind the ends, so it is shaded too.
    { on: 'body', fill: 'scarfShade', nodes: [[-54, 40, 1, 0], [54, 42, 1, 0], [52, 58, 1, -10], [-50, 56, 1, 0]], round: 0.3 },
    { on: 'body', fill: 'scarf', nodes: [[-52, 48, 1, 8], [48, 50, 1, -4], [-6, 100, 1, -4]], round: 0.2 },
    { on: 'body', fill: 'scarf', nodes: [[52, 56, 1, -20], [90, 84, 1, -20], [50, 74, 1, 0]], round: 0.2 },
    { on: 'body', fill: 'scarf', nodes: [[46, 52, 1, -20], [96, 44, 1, -20], [60, 66, 1, 0]], round: 0.2 },
    { on: 'body', kind: 'ellipse', fill: 'scarfShade', cx: 52, cy: 59, rx: 8, ry: 7.5 },
    // White forepaws on the ground, under the bib.
    { on: 'body', kind: 'ellipse', fill: 'face', cx: -21, cy: 121, rx: 14, ry: 10 },
    { on: 'body', kind: 'ellipse', fill: 'face', cx: 21, cy: 121, rx: 14, ry: 10 },
    // Tail extras are drawn on the straight tail (base on the origin, tip at y -142,
    // +x away from the body); the library bends them onto the curve.
    // The pale lavender tip, its edge a row of tufts pointing back toward the base.
    { on: 'tail', clip: true, fill: 'tailTip', cx: 0, cy: -155, rx: 96, ry: 60,
      fluff: [{ from: 60, to: 120, n: 3, len: 10, depth: 0.04, jit: 0 }] },
  ],
  // The paws reach y ~131, so squash and stretch pivot about that height.
  rig: { ground: 131 },
  views: {
    // The house close-up (1254 px, head tipped 20°). There is no house-style reference for Yuda yet.
    closeup: { w: 1254, h: 1254, x: 450, y: 835, scale: 5.5, rotate: 20 },
  },
});
