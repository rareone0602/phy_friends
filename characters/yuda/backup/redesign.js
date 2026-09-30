// The redesign of characters/yuda/yuda.js closer to examples/bandana.png and icon.png, the main spec from 30
// September 2026 until his owner chose the spec before it: a broad white V rising between the eyes, a lower and
// broader head, ears splayed to 50°, and the bandana's knot at his back. The other files here, except
// bandana-colors.js, are alternatives to it. Kept per STYLE.md, principle 1.
// Character spec for Yuda, a slate-blue wolf with white eyebrow spots and a cyan bandana.
// Pictures: examples/icon.png, waving.png, card.png, teacup.png, bandana.png, snowman.webp.
// Colors are taken from examples/icon.png, the color standard; those it does not show are taken from waving.png. The
// shapes follow icon.png and bandana.png.
PhyFriends.define('yuda', {
  palette: {
    bg: '#1c1d21',
    fur: '#6c7ba7',        // The slate blue of the icon. Its house shade (furShade) fills the body, which sits under the head.
    face: '#f9f7f6',       // The muzzle, cheeks, eyebrow spots, chest and forepaws.
    earInner: '#88d5dd',   // Cyan, also used for the inside of the open mouth.
    eye: '#23263d',        // A deep slate navy, for the open mouth.
    eyeBlue: '#4e7ec0',    // The blue of the eyes in waving.png and card.png.
    blush: '#a9dbf3',      // A soft sky blue, as his owner set it (the pictures draw it peach or pink).
    scarf: '#98f0ff',      // The bandana. Its house shade (scarfShade) fills the band.
    tailMid: '#94a1d9',    // The periwinkle band on the tail, drawn in both waving.png and teacup.png.
    tailTip: '#bfbdf1',    // The pale lavender tip of the tail.
  },
  // The head is broad and low, as in icon.png and bandana.png, with two spiky tufts down each side under the ears.
  head: {
    cx: 0, cy: -16, rx: 92, ry: 60,
    fluff: [{ from: -34, to: -2, n: 2, len: 11, lean: 4, depth: 0.04, b1: -30, b2: 10, jit: 0, sym: true }],
  },
  // The white face is large, as in bandana.png. Its plump round cheeks end at each side in two large white tufts, as
  // in icon.png and bandana.png; the fur ruff behind them (an extra) makes longer cheek spikes that edge them.
  face: {
    cx: 0, cy: 12, rx: 82, ry: 40,
    fluff: [{ from: -30, to: 20, n: 2, len: 12, lean: 4, depth: 0.1, b1: -22, b2: 6, jit: 0, sym: true }],
  },
  // The ears are large and broad, with soft points, and splay out from the upper corners of the head, as in
  // icon.png and bandana.png; each inner edge runs on from the crown, dipping a little where it meets it. They lean
  // out between the icon's more upright ears and bandana.png's lower, wider ones. The cyan inner ear keeps a broad
  // slate margin, as in icon.png, waving.png and card.png, because a thin rim would read as an outline.
  ears: {
    base: [-60, -46], angle: 50, width: 88, length: 78, lean: 0, tip: 9, b1: -13, b2: 0,
    inner: { scale: 0.7, dx: -1, dy: -9 },
  },
  // The mop is in the fur color, with a tall crest leaning left on the crown (as in icon.png, waving.png and
  // card.png), a smaller spike beside it, and a flame-shaped lock down each side of the face, outside the eyes.
  // Between those locks its edge runs above the eyes and under the eyebrow spots, then rises to a point between the
  // spots: the white V of bandana.png, teacup.png and snowman.webp. It clears the eyes as they look around.
  // Each tip is [x, y, bendIn, bendOut, following valley].
  hair: {
    cx: 0, cy: -50, rx: 74, ry: 34, color: 'fur',
    tips: [
      [-32, -118, 2, 12, [0, -84]],
      [22, -98, -6, -10, [54, -66]],
      [80, -26, 0, 0, [72, -20]],
      [62, -2, 10, -6, [42, -21]],
      [18, -27, 0, 0, [0, -42]],
      [-18, -27, 0, 0, [-42, -21]],
      [-62, -2, -6, 10, [-72, -20]],
      [-80, -26, 0, 0, [-52, -70]],
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
      fluff: [{ from: -36, to: 22, n: 2, len: 19, lean: 2, depth: 0.1, b1: -30, b2: 10, jit: 0, sym: true },
        { from: 45, to: 135, n: 1, len: -14, b1: 5, b2: 5, jit: 0 }] },
    // The white rises in a broad V between the eyes to a point between the eyebrow spots; the mop's edge shapes it.
    { on: 'face', fill: 'face', nodes: [[0, -44, 1, 0], [44, -12, 1, 0], [-44, -12, 1, 0]] },
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
    // The bandana, as bandana.png draws it: a band of cloth around the neck, knotted out of sight at his back, and a
    // large point hanging over it on the chest. The band is not clipped to the body: each end stands a few units
    // proud of the neck, which shows its thickness. It lies behind the point, so it takes the house shade.
    { on: 'body', fill: 'scarfShade', nodes: [[-70, 43, 1, 6], [70, 43, 1, -8], [68, 59, 1, -8], [-68, 59, 1, -8]] },
    { on: 'body', fill: 'scarf', nodes: [[-62, 49, 1, 6], [62, 49, 1, -4], [0, 116, 1, -4]], round: 0.2 },
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
    // The icon, lined up on the eyebrow spots, and bandana.png, lined up on the eyes (pf.py compare).
    icon: { w: 600, h: 600, x: 258, y: 420, scale: 2.43, rotate: 11.8 },
    bandana: { w: 1154, h: 1038, x: 580, y: 472, scale: 3.86, rotate: -7.7 },
    // The house close-up (1254 px, head tipped 20°). There is no house-style reference for Yuda yet.
    closeup: { w: 1254, h: 1254, x: 450, y: 835, scale: 5.5, rotate: 20 },
  },
});
