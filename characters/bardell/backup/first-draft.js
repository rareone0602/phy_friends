// The first draft of characters/bardell/bardell.js, before the adversarial review's fixes. Kept per STYLE.md, principle 1.
// Character spec for BarDell, a cream dog with a crimson mop of flame-like locks over orange-red lower locks, a
// curled cowlick on the crown, chocolate ears, a tan forehead, amber eyes, tan shoulders, striped arms, chocolate
// paws and feet, and a bushy cream tail with an orange band and a crimson tip.
// Pictures: examples/icon.jpg (a close-up in the house template, the color standard), sheet.png (his owner's design,
// standing) and sticker.jpg (of which only the sticker itself serves).
// Colors are taken from examples/icon.jpg; those it does not show (the eyes and the markings on the body) are taken
// from sheet.png, which fills its markings with the icon's colors.
PhyFriends.define('bardell', {
  palette: {
    bg: '#1c1d21',
    fur: '#f8e9d4',        // The cream of the icon's muzzle: muzzle, cheeks, cheek tufts, the base of the inner ears and the tail. Its house shade (furShade) fills the body, which sits under the head.
    tan: '#eeb26c',        // The tan-orange of the icon's upper face: the head above the muzzle and the patches on the shoulders.
    hair: '#c6293c',       // The crimson of the icon's mop, which the sheet also gives the bands on the legs and the tip of the tail.
    fringe: '#e3573e',     // The orange-red of the icon's lower locks.
    brown: '#684128',      // The chocolate of the icon's ears, which the sheet also gives the stripes on the upper arms, the paws and the hind feet.
    orange: '#fbab42',     // The orange of the icon's inner ears, which the sheet also gives the bands above the forepaws and the band on the tail.
    eye: '#2b2020',        // A warm near-black, used for the open mouth.
    eyeAmber: '#da8911',   // The amber of the irises on the sheet (#fda223), one house step deeper so that it holds its weight on the cream.
    blush: '#fac1b8',      // The icon's blush, also used for the tongue.
  },
  // The head is a round dome in the tan of the upper face, with a soft tuft down each side, under the ears.
  head: {
    cx: 0, cy: -22, rx: 90, ry: 68, color: 'tan',
    fluff: [{ from: -26, to: -2, n: 1, len: 9, lean: 4, depth: 0, b1: -30, b2: 10, jit: 0, sym: true }],
  },
  // The cream muzzle and cheeks. On the icon the cream starts halfway down the eyes; here it rises to their tops, as
  // for Howdi and Brian, so that each amber eye sits on one color, since amber on tan is too faint at gallery size.
  // Its sides are cut into spiky tufts. Setting len < 0 flattens the top, under the fringe.
  face: {
    cx: 0, cy: 16, rx: 84, ry: 38, color: 'fur',
    fluff: [
      { from: -24, to: 30, n: 3, len: 9, lean: 3, depth: 0.1, b1: -28, b2: 8, jit: 0, sym: true },
      { from: 235, to: 305, n: 1, len: -4, b1: 0, b2: 0, jit: 0 },
    ],
  },
  // The ears are big, upright, pointed dog ears in chocolate, with an orange inner ear; the cream tufts at its base
  // are an extra.
  ears: {
    base: [-56, -70], angle: 26, width: 92, length: 94, lean: 6, tip: 8, b1: -14, b2: -8, color: 'brown',
    inner: { scale: 0.64, dx: 2, dy: -12, color: 'orange' },
  },
  // The mop is a crimson crown with a spike at each upper corner and one on top, from which long flame-like locks
  // hang over the forehead and out at each side, each curving outward to its point, as on the icon. The orange-red
  // lower locks (an extra) show between them and hang below them.
  // Each tip is [x, y, bendIn, bendOut, following valley].
  hair: {
    cx: 0, cy: -70, rx: 80, ry: 36, color: 'hair',
    tips: [
      [108, -40, -8, 12, [84, -76]],
      [62, -36, -14, 14, [30, -84]],
      [-8, -24, -14, 14, [-36, -84]],
      [-66, -38, -14, 14, [-84, -78]],
      [-110, -42, -8, 8, [-96, -70]],
      [-100, -82, -10, -4, [-76, -96]],
      [-70, -112, -12, -4, [-20, -104]],
      [32, -118, -4, -12, [58, -100]],
      [92, -94, -4, -10, [96, -72]],
    ],
  },
  // The eyes are plain tall pills in his own amber, which the sheet and the sticker draw (the icon's dark pills are
  // the template's). Setting arc: 1 draws the happy, closed and squint strokes at the full eye width.
  eyes: { x: 34, y: 3, w: 13, h: 32, stroke: 5, arc: 1, color: 'eyeAmber' },
  // The blush sits on the cream beside the lower half of each eye, as on the icon, tipped up to follow the cheek.
  blush: { x: 54, y: 25, rx: 11, ry: 6.5, tilt: 10 },
  // There is no mouth by default (the sheet's nose and mouth are omitted); when open, it shows the pink tongue of
  // the sheet's inset, without a fang.
  mouth: { y: 22, size: 3.8, tongue: 'blush' },
  // The body is small, round and seated, in the house shade. Shoulder tufts sit under the cheeks, and small hip
  // tufts below them.
  body: {
    cx: 0, cy: 86, rx: 64, ry: 46, color: 'furShade',
    fluff: [{ from: -65, to: -25, n: 2, len: 10, depth: 0, b1: 0, b2: -25, jit: 0, sym: true },
      { from: 20, to: 60, n: 2, len: 6, lean: 6, depth: 0.08, b1: -25, b2: 5, jit: 0, sym: true }],
  },
  // The tail is a big bushy cream plume rising behind his left hip (the viewer's right), as on the sheet and the
  // sticker, its tip curling in. Its crimson tip and the orange band below it are extras.
  tail: {
    base: [56, 106], angle: 50, length: 132, width: 98, bend: -70, taper: 0.72, root: 0.5, color: 'fur',
    fluff: [{ from: 300, to: 350, n: 2, len: 10, lean: 6, depth: 0.05, b1: -30, b2: 5, jit: 0 },
      { from: 255, to: 290, n: 1, len: 16, lean: -10, b1: 25, b2: -25, jit: 0 },
      { from: 200, to: 240, n: 2, len: 8, lean: 6, b1: -25, b2: 5, jit: 0 }],
  },
  extras: [
    // The cheek tufts: a cream ruff under the head whose spiky tufts stick out sideways past the cheeks, as on the
    // sheet. An n: 1 range with len < 0 tucks the bottom in under the chin.
    { on: 'base', under: true, fill: 'fur', cx: 0, cy: 12, rx: 92, ry: 48,
      fluff: [{ from: -40, to: 14, n: 3, len: 12, lean: -2, depth: 0.1, b1: -38, b2: 12, jit: 0, sym: true },
        { from: 45, to: 135, n: 1, len: -14, b1: 5, b2: 5, jit: 0 }] },
    // Ear extras are in ear-local space (base on the origin, tip up, +x toward the top of the head); on: 'ears' puts
    // them on both. The cream tufts rising from the base of the inner ear, on its side toward the crown, as on the
    // icon.
    { on: 'ears', clip: true, fill: 'fur', cx: 8, cy: 0, rx: 24, ry: 38,
      fluff: [{ from: 225, to: 315, n: 2, len: 12, depth: 0.05, b1: -5, b2: 5, jit: 0 }] },
    // The orange-red lower locks, hanging from under the crimson mop: a lock down each side of the face to the
    // cheek, a spike out past it, a lock over the outer corner of each eye and a narrow lock between the eyes. The
    // partings either side of that lock sit high, so that the tan forehead shows above each eye, as on the icon. The
    // top tip lies hidden under the crown.
    { on: 'hair', under: true, fill: 'fringe', cx: 0, cy: -80, rx: 80, ry: 30,
      tips: [
        [114, -24, -8, 6, [94, -4]],
        [90, 10, -8, 12, [76, -40]],
        [54, -16, -10, 12, [26, -48]],
        [12, -10, -10, 10, [-22, -50]],
        [-48, -18, -12, 10, [-72, -40]],
        [-92, 10, -12, 8, [-96, -4]],
        [-114, -26, -6, 8, [-104, -70]],
        [0, -110, 0, 0, [104, -70]],
      ] },
    // The curled cowlick on the crown, which every picture draws: a thick lock that rises left of the middle and
    // hooks over to the right into a point, as on the icon.
    { on: 'hair', fill: 'hair', nodes: [[-30, -104, 1, 0], [-36, -120], [-30, -134], [-16, -142], [2, -141, 1, 0],
      [-10, -134], [-16, -124], [-14, -112], [-6, -102, 1, 0]] },
    // The tan patches on the shoulders, under the cheek tufts, as on the sheet.
    { on: 'body', clip: true, fill: 'tan', cx: -62, cy: 58, rx: 24, ry: 22, rot: -20 },
    { on: 'body', clip: true, fill: 'tan', cx: 62, cy: 58, rx: 24, ry: 22, rot: 20 },
    // The chocolate stripes on the upper arms, which hang at the body's sides: two narrow bands on each side,
    // running in from the edge and tapering to a round end, clipped to the body so that they start at its edge.
    { on: 'body', clip: true, fill: 'brown', round: 0.4, nodes: [[74, 70, 1, -8], [38, 79, 1, 0], [74, 82, 1, 0]] },
    { on: 'body', clip: true, fill: 'brown', round: 0.4, nodes: [[74, 88, 1, -8], [42, 96, 1, 0], [74, 100, 1, 0]] },
    { on: 'body', clip: true, fill: 'brown', round: 0.4, nodes: [[-74, 70, 1, 0], [-74, 82, 1, 0], [-38, 79, 1, 8]] },
    { on: 'body', clip: true, fill: 'brown', round: 0.4, nodes: [[-74, 88, 1, 0], [-74, 100, 1, 0], [-42, 96, 1, 8]] },
    // The hind feet, turned out slightly: chocolate, as far as an edge cut into points, under the crimson bands of the
    // lower legs, as on the sheet. They are fur markings, which the sheet draws like boots.
    { on: 'body', kind: 'ellipse', fill: 'hair', cx: -50, cy: 111, rx: 17, ry: 11, rot: -8 },
    { on: 'body', kind: 'ellipse', fill: 'hair', cx: 50, cy: 111, rx: 17, ry: 11, rot: 8 },
    { on: 'body', fill: 'brown', cx: -50, cy: 120, rx: 19, ry: 10, rot: -8,
      fluff: [{ from: 210, to: 330, n: 3, len: 4, depth: 0.05, b1: -10, b2: 10, jit: 0 }] },
    { on: 'body', fill: 'brown', cx: 50, cy: 120, rx: 19, ry: 10, rot: 8,
      fluff: [{ from: 210, to: 330, n: 3, len: 4, depth: 0.05, b1: -10, b2: 10, jit: 0 }] },
    // The chocolate forepaws on the ground between them, under the orange bands above them, as on the sheet.
    { on: 'body', kind: 'ellipse', fill: 'orange', cx: -16, cy: 113, rx: 11.5, ry: 8 },
    { on: 'body', kind: 'ellipse', fill: 'orange', cx: 16, cy: 113, rx: 11.5, ry: 8 },
    { on: 'body', kind: 'ellipse', fill: 'brown', cx: -16, cy: 121, rx: 12.5, ry: 10 },
    { on: 'body', kind: 'ellipse', fill: 'brown', cx: 16, cy: 121, rx: 12.5, ry: 10 },
    // Tail extras are drawn on the straight tail (base on the origin, tip at y -132, +x away from the body); the
    // library bends them onto the curve. The orange band and the crimson tip over it, in that order on the sheet and
    // the sticker, each edge cut into flame-shaped tufts that reach back toward the base. They are drawn as extras
    // rather than as the tail's tip, whose ellipse is twice as wide as the plume and so widens the reach the gallery
    // measures for the tail.
    { on: 'tail', clip: true, fill: 'orange', cx: 0, cy: -132, rx: 64, ry: 60,
      fluff: [{ from: 55, to: 125, n: 2, len: 14, depth: 0.02, b1: 18, b2: 12, jit: 0.2 }] },
    { on: 'tail', clip: true, fill: 'hair', cx: 0, cy: -132, rx: 64, ry: 36,
      fluff: [{ from: 55, to: 125, n: 2, len: 12, depth: 0.02, b1: 18, b2: 12, jit: 0.2 }] },
  ],
  // The paws reach y ~131, so squash and stretch pivot about that height.
  rig: { ground: 131 },
  views: {
    // The icon, which frames the head larger and lower than the house close-up: the origin sits between its eyes and
    // the scale sets its eyes as far apart as the spec's, so that the two line up (pf.py compare).
    icon: { w: 2000, h: 2000, x: 699, y: 1536, scale: 10.07, rotate: 20 },
  },
});
