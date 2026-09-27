// phy — tuxedo Eevee with cookies-and-cream crumbs on its ruff and tail. Reference: examples/ref.png (views.ref)
// Colours from examples/icon.png (views.icon); the ones the icon doesn't show are from ref.png.
PhyFriends.define('phy', {
  palette: {
    bg: '#1c1d21',
    fur: '#8c7979',        // the cat's black, as the icon draws it; its house shade (furShade) is the ears' folded tips and the crest's top
    face: '#fcf5ef',       // the cat's white
    earInner: '#f9bcaa',   // the lighter almond in the ear; its house shade (earInnerShade) is the rim round it
    marble: '#d8bab0',     // the cookies-and-cream marbling, and the pale crest bands
    eye: '#2e2020',
    blush: '#fdcabc',
    chest: '#fcf5ef',      // the ruff: the cream of the Oreo
    crumb: '#766666',
    tailTip: '#f1e5da',    // the tail's cream, a step deeper than the ruff so its tip can go white
  },
  // a broad leaf of fur down each side, under the ears; the cheek fluff (an extra) draws the lower outline
  head: {
    cx: 0, cy: -15.1, rx: 70, ry: 55,
    fluff: [{ from: -30, to: 10, n: 2, len: 13, lean: 4, depth: 0.1, b1: -35, b2: 10, jit: 0, sym: true }],
  },
  // white mask: muzzle, cheeks and a chin that melts into the cream ruff. Its top runs
  // flat under the eyes, where the blaze takes over, and each cheek ends in round scallops
  face: {
    cx: 0, cy: 24.1, rx: 64.6, ry: 18.6,
    fluff: [
      { from: 236, to: 304, n: 1, len: -3.4, b1: 0, b2: 0, jit: 0 }, // len < 0 flattens the top
      { from: -54, to: -10, n: 2, len: 3.5, depth: 0.03, b1: -40, b2: -40, jit: 0, sym: true }, // cheek tops
      { from: -8, to: 36, n: 2, len: 3, depth: 0.04, b1: -40, b2: -40, jit: 0, sym: true }, // cheek ends
    ],
  },
  // Eevee ears: tall leaves, the outer edge bowed out and the tip leaning in. The inner
  // ear is the deep pink, with a lighter almond inside it (an extra)
  ears: {
    base: [-42.5, -37], angle: 36.2, width: 65.7, length: 107, lean: 27, tip: 1, b1: -25.1, b2: -39.3,
    inner: { scale: 1, width: 39.5, length: 47.9, lean: 23.3, tip: 2.8, b1: -32.4, b2: -15.3, dx: -1.1, dy: -23.5, color: 'earInnerShade' },
  },
  // the crest: one big lock rising to a point left of centre, its right side a dome; the
  // second tip hides in the head. Tips: [x, y, bendIn, bendOut, following valley]
  hair: { cx: -5, cy: -62, rx: 30, ry: 15, color: 'fur', tips: [[-31.1, -97.4, -20.6, -37.4, [19, -69.3]], [0, -45, 0, 0, [-35.3, -60.9]]] },
  // plain tall pills, the tops leaning in a touch; arc: 1 draws the happy / closed / squint strokes eye-wide
  eyes: { x: 31, y: 0.6, w: 13, h: 33, tilt: 2, stroke: 4.5, arc: 1 },
  // on the white under the outer corner of each eye, tipped up to follow the cheek
  blush: { x: 48.1, y: 21.3, rx: 9.6, ry: 5.5, tilt: 20 },
  // none by default; open (the icon), it shows one fang
  mouth: { y: 18.6, size: 3.8, fang: true },
  // sitting, broad and dark: shoulder tufts under the cheeks, hip tufts below the ruff
  body: {
    cx: 0, cy: 80, rx: 74, ry: 51, color: 'fur',
    fluff: [{ from: -65, to: -25, n: 2, len: 18, depth: 0, b1: 0, b2: -25, jit: 0, sym: true },
      { from: 20, to: 60, n: 2, len: 6, lean: 6, depth: 0.08, b1: -25, b2: 5, jit: 0, sym: true }],
  },
  // an Oreo tail: a big bushy crescent rising from behind the right hip to above the
  // eyes, its point hooked over towards the head. Cream, marbled, on a dark cookie base
  tail: {
    base: [68, 85], angle: 42, length: 160, width: 108, bend: -110, taper: 0.6, root: 0.2, color: 'tailTip',
    // the curled end sharpens into a point: a tuft leaning inward, concave underneath
    fluff: [{ from: 240, to: 300, n: 1, len: 20, lean: -17, jit: 0, depth: 0, b1: 30, b2: -20 }],
  },
  extras: [
    // cheek fluff under the head: broad tufts pointing down and out round the white cheeks,
    // and an n: 1 range with len < 0 that tucks the bottom in behind the chin
    { on: 'base', under: true, fill: 'fur', cx: 0, cy: 19.5, rx: 81, ry: 24,
      fluff: [{ from: -40, to: 52, n: 3, len: 12, lean: 6, depth: 0.1, b1: -25, b2: 5, jit: 0, sym: true },
        { from: 53, to: 127, n: 1, len: -6.9, b1: 5, b2: 5, jit: 0 }] },
    // the blaze: a white flame from the muzzle to a point between the eyes, flaring out under them
    { on: 'face', fill: 'face', nodes: [[0, -32.3, 1, 4], [8.2, -7.6, 1, 24], [24.7, 8.9, 1, 0], [0, 20.6, 1, 0], [-24.7, 8.9, 1, 24], [-8.2, -7.6, 1, 4]] },
    // Ear extras are in ear-local space (base on the origin, tip up, +x towards the
    // top of the head); on: 'ears' puts them on both. Drawn in this order.
    // the lighter pink: the inner ear shrunk towards its tip, leaving a deep rim below
    { on: 'ears', fill: 'earInner', nodes: [[-11.7, -34.4, 1, -32.4], [21.5, -71.4, 1, -45], [22.8, -70.8, 1, -15.3], [20.1, -34.4, 1, 0], [4.2, -21.7]] },
    // the tip folds over into a dark cap, with a tuft hanging from its edge and a flick
    // out past the outer edge
    { on: 'ears', clip: true, fill: 'furShade', cx: 27.7, cy: -84, rx: 43, ry: 20.9, rot: 14.8,
      fluff: [{ from: 64.6, to: 94.6, n: 1, len: 14.8, depth: 0, b1: -25, b2: 10, jit: 0 }] },
    { on: 'ears', fill: 'furShade', nodes: [[3, -89, 1, -25], [-9, -79, 1, 15], [3, -77, 1, 0]] },
    // the crest's dark top, with a fur lock rising into it; a pale band down its left
    // edge, and a pale lock below it
    { on: 'hair', clip: true, fill: 'furShade', nodes: [[-48, -72, 1], [-40, -115, 1], [25, -110, 1], [17.5, -73.8, 1, -4], [-23.1, -84.7, 1, -52], [-28.4, -60, 1]] },
    { on: 'hair', kind: 'ellipse', clip: true, fill: 'marble', cx: -49.7, cy: -94.3, rx: 36.1, ry: 8.3, rot: 47.8 },
    { on: 'hair', fill: 'marble', nodes: [[-37, -63, 1, 40], [-53, -42, 1, 0], [-39, -40, 1, -40]] },
    // the ruff: a cream cloud of clumps rising to the white chin, like a tuxedo cat's bib,
    // on a marble layer that shows at its sides
    { on: 'body', fill: 'marble', cx: 0, cy: 72, rx: 66, ry: 38,
      fluff: [{ from: -25, to: 29, n: 1, len: 9, depth: 0.04, b1: -40, b2: -40, jit: 0, sym: true },
        { from: 30, to: 150, n: 4, len: 9, depth: 0.04, b1: -40, b2: -40, jit: 0 }] },
    { on: 'body', fill: 'chest', cx: 0, cy: 72, rx: 60, ry: 34,
      fluff: [{ from: -60, to: 48, n: 3, len: 10, depth: 0.04, b1: -40, b2: -40, jit: 0, sym: true },
        { from: 49, to: 131, n: 3, len: 10, depth: 0.04, b1: -40, b2: -40, jit: 0 },
        { from: 241, to: 299, n: 3, len: 8, depth: 0.04, b1: -40, b2: -40, jit: 0 }] },
    // white forepaws on the ground, under the ruff
    { on: 'body', kind: 'ellipse', fill: 'face', cx: -22, cy: 121, rx: 14, ry: 10 },
    { on: 'body', kind: 'ellipse', fill: 'face', cx: 22, cy: 121, rx: 14, ry: 10 },
    // cookie crumbs ([x, y, r, sides, rot, aspect]), the last two on the forepaws
    { on: 'body', fill: 'crumb', polys: [[-40, 70, 11, 6, 10], [-39, 100, 8, 4, 60, 0.7], [-13, 94, 6, 3, 20], [26, 68, 6.5],
      [-1, 68, 3.5, 4, 80, 0.7], [37, 50, 4.5, 4, 30, 0.7], [57, 48, 5], [-24, 121, 4, 3, 30], [17, 118, 3.5, 4, 70, 0.7]] },
    // Tail extras are drawn on the straight tail (base on the origin, tip at y -160,
    // +x away from the body); the library bends them onto the crescent.
    // the very tip goes white
    { on: 'tail', clip: true, fill: 'chest', cx: 0, cy: -168, rx: 108, ry: 24,
      fluff: [{ from: 60, to: 120, n: 3, len: 5.5, jit: 0, depth: 0.04 }] },
    // big soft marble clouds on the cream
    { on: 'tail', clip: true, fill: 'marble', cx: 28, cy: -104, rx: 37.4, ry: 34, rot: 10 },
    { on: 'tail', clip: true, fill: 'marble', cx: -25, cy: -95, rx: 24.1, ry: 21, rot: 20 },
    // the dark cookie base, its top edge torn in sawtooth steps
    { on: 'tail', clip: true, fill: 'crumb', cx: 0, cy: 0, rx: 72, ry: 80, rot: -5,
      fluff: [{ from: 222, to: 262, n: 3, len: 0.8, lean: 5, depth: 0.07, b1: -15, b2: 0, jit: 0 },
        { from: 263, to: 318, n: 3, len: 1.6, lean: 7, depth: 0.1, b1: -15, b2: 0, jit: 0 }] },
    // crumbs, and a cream chip on the dark base
    { on: 'tail', clip: true, fill: 'crumb', polys: [[45, -100, 11, 6, 15], [-10, -95, 5, 5, 10], [48, -78, 4, 4, 30, 0.7], [-6, -142, 5, 3, 0]] },
    { on: 'tail', clip: true, fill: 'tailTip', polys: [[25, -70, 5, 3, 10]] },
  ],
  // the paws reach y ~131: squash and stretch about that
  rig: { ground: 131 },
  views: {
    // examples/ref.png: a close-up, lying with the head tipped onto the ruff: the body
    // rides up and left under the head (x, y, undone on the head by headX, headY)
    ref: { w: 1254, h: 1254, x: 438.6, y: 832.2, scale: 5.5, rotate: 20, pose: { earL: 16.2, earR: 20.5, x: -5, y: -10, headX: 5, headY: 10, tail: 1 } },
    // examples/icon.png: head tilted, eyes squeezed shut, mouth open, the tail tucked away
    // behind (its paws, held up, are not drawn)
    icon: { w: 800, h: 800, x: 373, y: 472, scale: 2.983, pose: { tilt: 8, earL: -18, earR: 18, tail: -75, eyes: 'squint', mouth: 'open' } },
  },
});
