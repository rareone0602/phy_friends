// Character spec for phy, a tuxedo Eevee with cookies-and-cream crumbs on its ruff and tail.
// Reference: examples/ref.png (views.ref).
// Colors are taken from examples/icon.png (views.icon); those the icon does not show are taken
// from ref.png.
PhyFriends.define('phy', {
  palette: {
    bg: '#1c1d21',
    fur: '#8c7979',        // The cat's black, as the icon draws it. Its house shade (furShade) fills the body, the folded ear tips and the top of the crest.
    head: 'fur',
    face: '#f5ede6',       // The cat's warm white (#fcf5ef), deepened to mumuyou's depth to stay visible on paper.
    hair: 'fur',
    ear: 'fur',
    earInner: 'almondShade',
    iris: '#9cac47',       // The yellow-green of the eyes in front.png and card.png, one house step deeper so that it holds its weight.
    ink: '#2e2020',        // A warm near-black, for the open mouth.
    blush: '#fdcabc',
    tongue: 'almond',
    body: 'furShade',
    tail: '#f1e5da',       // The cream of the tail, one step deeper than the ruff so that its tip can be white.
    arm: 'fur',
    paw: 'face',
    leg: 'furShade',
    foot: 'face',
    almond: '#f9bcaa',     // The lighter almond in the ear. Its house shade (almondShade) fills the rim around it.
    marble: '#d8bab0',     // The cookies-and-cream marbling and the pale bands on the crest.
    chest: 'face',         // The ruff, in the cream of the Oreo: the face's white.
    crumb: '#5f4d50',      // The cookie, a step darker than the fur's shade so that the tail's base stays apart from the hip.
  },
  // A broad leaf-shaped tuft of fur runs down each side, under the ears. The cheek fluff (an extra)
  // draws the lower outline.
  head: {
    cx: 0, cy: -15.1, rx: 70, ry: 55,
    fluff: [{ from: -30, to: 10, n: 2, len: 13, lean: 4, depth: 0.1, b1: -35, b2: 10, jit: 0, sym: true }],
  },
  // The white mask covers the muzzle, the cheeks and a chin that blends into the cream ruff. Its top
  // runs flat under the eyes, where the blaze takes over, and each cheek ends in round scallops.
  face: {
    cx: 0, cy: 24.1, rx: 64.6, ry: 18.6,
    fluff: [
      { from: 236, to: 304, n: 1, len: -3.4, b1: 0, b2: 0, jit: 0 }, // Setting len < 0 flattens the top.
      { from: -54, to: -10, n: 2, len: 3.5, depth: 0.03, b1: -40, b2: -40, jit: 0, sym: true }, // Cheek tops.
      { from: -8, to: 36, n: 2, len: 3, depth: 0.04, b1: -40, b2: -40, jit: 0, sym: true }, // Cheek ends.
    ],
  },
  // The Eevee ears are tall leaf shapes, with the outer edge bowed out and the tip leaning in. The
  // inner ear is the deep pink, with a lighter almond inside it (an extra).
  ears: {
    base: [-42.5, -37], angle: 36.2, width: 65.7, length: 107, lean: 27, tip: 1, b1: -25.1, b2: -39.3,
    inner: { scale: 1, width: 39.5, length: 47.9, lean: 23.3, tip: 2.8, b1: -32.4, b2: -15.3, dx: -1.1, dy: -23.5 },
  },
  // The crest is one large lock rising to a point left of center, with a dome for its right side;
  // the second tip is hidden inside the head. Each tip is [x, y, bendIn, bendOut, following valley].
  hair: { cx: -5, cy: -62, rx: 30, ry: 15, tips: [[-31.1, -97.4, -20.6, -37.4, [19, -69.3]], [0, -45, 0, 0, [-35.3, -60.9]]] },
  // The eyes are plain tall pills in phy's own green, their tops leaning in slightly. Setting arc: 1
  // draws the happy, closed and squint strokes at the full eye width.
  eyes: { x: 31, y: 0.6, w: 13, h: 33, tilt: 2, stroke: 4.5, arc: 1 },
  // The blush sits on the white under the outer corner of each eye, tipped up to follow the cheek.
  blush: { x: 48.1, y: 21.3, rx: 9.6, ry: 5.5, tilt: 20 },
  // There is no mouth by default; when open (as in the icon), it shows one fang.
  mouth: { y: 18.6, size: 3.8, fang: true },
  // The body is broad, and an onigiri (a rice ball): narrow under the chin, broad and round at the base. It sits
  // under the head, so it takes the house shade. Shoulder tufts sit under the cheeks, and hip tufts below the ruff.
  body: {
    cx: 0, cy: 80, rx: 74, ry: 51, onigiri: 1,
    fluff: [{ from: -65, to: -25, n: 2, len: 18, depth: 0, b1: 0, b2: -25, jit: 0, sym: true },
      { from: 8, to: 40, n: 2, len: 6, lean: 6, depth: 0.08, b1: -25, b2: 5, jit: 0, sym: true }],
  },
  // The tail is an Oreo tail: a large bushy crescent that rises from behind the right hip to above
  // the eyes, with its point hooked over toward the head. It is cream and marbled, on a dark cookie base.
  tail: {
    base: [68, 85], angle: 42, length: 160, width: 108, bend: -110, taper: 0.6, root: 0.2,
    // The curled end sharpens into a point: a tuft that leans inward and is concave underneath.
    fluff: [{ from: 240, to: 300, n: 1, len: 20, lean: -17, jit: 0, depth: 0, b1: 30, b2: -20 }],
  },
  // The limbs, on the house template. Seated, the white forepaws rest on the ground under the ruff (paw), and the
  // round white hind feet point at us at either side (foot), as in examples/sketch.jpg. Standing, as in
  // examples/walking.png, the dark arms end in the white forepaws, and the dark legs in white toes, which meet the
  // dark fur in a jagged edge.
  stand: {
    seat: { paw: { cx: 22, cy: 121, rx: 14, ry: 10 }, foot: { cx: 52, cy: 116, rx: 20, ry: 15 } },
    legs: { bands: [{ from: 0.75, to: 1, color: 'face', teeth: 3, depth: 4 }] },
  },
  extras: [
    // Cheek fluff under the head: broad tufts pointing down and outward around the white cheeks. An
    // n: 1 range with len < 0 tucks the bottom in behind the chin.
    { feature: 'cheekRuff', on: 'base', under: true, fill: 'fur', cx: 0, cy: 19.5, rx: 81, ry: 24,
      fluff: [{ from: -40, to: 52, n: 3, len: 12, lean: 6, depth: 0.1, b1: -25, b2: 5, jit: 0, sym: true },
        { from: 53, to: 127, n: 1, len: -6.9, b1: 5, b2: 5, jit: 0 }] },
    // The blaze: a white flame shape that runs from the muzzle to a point between the eyes and flares out under them.
    { feature: 'blaze', on: 'face', fill: 'face', nodes: [[0, -32.3, 1, 4], [8.2, -7.6, 1, 24], [24.7, 8.9, 1, 0], [0, 20.6, 1, 0], [-24.7, 8.9, 1, 24], [-8.2, -7.6, 1, 4]] },
    // Ear extras are in ear-local space (base on the origin, tip up, +x toward the top of the
    // head); on: 'ears' puts them on both. They are drawn in this order.
    // The lighter pink: the inner ear shrunk toward its tip, which leaves a deep rim below.
    { feature: 'earInner', on: 'ears', fill: 'almond', nodes: [[-11.7, -34.4, 1, -32.4], [21.5, -71.4, 1, -45], [22.8, -70.8, 1, -15.3], [20.1, -34.4, 1, 0], [4.2, -21.7]] },
    // The tip folds over into a dark cap, with a tuft hanging from its edge and a flick that
    // reaches past the outer edge.
    { feature: 'earFold', on: 'ears', clip: true, fill: 'furShade', cx: 27.7, cy: -84, rx: 43, ry: 20.9, rot: 14.8,
      fluff: [{ from: 64.6, to: 94.6, n: 1, len: 14.8, depth: 0, b1: -25, b2: 10, jit: 0 }] },
    { feature: 'earFold', on: 'ears', fill: 'furShade', nodes: [[3, -89, 1, -25], [-9, -79, 1, 15], [3, -77, 1, 0]] },
    // The dark top of the crest, with a fur lock rising into it. A pale band runs down its left
    // edge, with a pale lock below it, on the forehead, which faces forward (turn: 'forward').
    { feature: 'crest', on: 'hair', clip: true, fill: 'furShade', nodes: [[-48, -72, 1], [-40, -115, 1], [25, -110, 1], [17.5, -73.8, 1, -4], [-23.1, -84.7, 1, -52], [-28.4, -60, 1]] },
    { feature: 'crest', on: 'hair', kind: 'ellipse', clip: true, fill: 'marble', cx: -49.7, cy: -94.3, rx: 36.1, ry: 8.3, rot: 47.8 },
    { feature: 'crest', on: 'hair', turn: 'forward', fill: 'marble', nodes: [[-37, -63, 1, 40], [-53, -42, 1, 0], [-39, -40, 1, -40]] },
    // The ruff: cream clumps rising to the white chin, modeled on a tuxedo cat's bib, on a marble layer that shows at
    // its sides. Both narrow toward the top, as the body does (onigiri: 1, the house's rice ball). The ruff lies over
    // the tops of the arms, as a scarf does (scarf), as in front.png and walking.png.
    { feature: 'chest', on: 'scarf', fill: 'marble', cx: 0, cy: 68, rx: 48.5, ry: 38, onigiri: 1,
      fluff: [{ from: -25, to: 29, n: 1, len: 9, depth: 0.04, b1: -40, b2: -40, jit: 0, sym: true },
        { from: 30, to: 150, n: 4, len: 9, depth: 0.04, b1: -40, b2: -40, jit: 0 }] },
    { feature: 'chest', on: 'scarf', fill: 'chest', cx: 0, cy: 68, rx: 44, ry: 34, onigiri: 1,
      fluff: [{ from: -60, to: 48, n: 3, len: 10, depth: 0.04, b1: -40, b2: -40, jit: 0, sym: true },
        { from: 49, to: 131, n: 3, len: 10, depth: 0.04, b1: -40, b2: -40, jit: 0 },
        { from: 241, to: 299, n: 3, len: 8, depth: 0.04, b1: -40, b2: -40, jit: 0 }] },
    // Cookie crumbs on the ruff, each [x, y, r, sides, rot, aspect], drawn in as the ruff narrows.
    { feature: 'crumbs', on: 'scarf', fill: 'crumb', polys: [[-16, 66, 11, 6, 10], [-25, 96, 8, 4, 60, 0.7], [-8, 90, 6, 3, 20], [10, 64, 6.5],
      [-1, 64, 3.5, 4, 80, 0.7], [8.5, 46, 4.5, 4, 30, 0.7]] },
    // Tail extras are drawn on the straight tail (base on the origin, tip at y -160,
    // +x away from the body); the library bends them onto the crescent.
    // The very tip is white.
    { feature: 'tailTip', on: 'tail', clip: true, fill: 'chest', cx: 0, cy: -168, rx: 108, ry: 24,
      fluff: [{ from: 60, to: 120, n: 3, len: 5.5, jit: 0, depth: 0.04 }] },
    // Large soft marble patches on the cream.
    { feature: 'marbling', on: 'tail', clip: true, fill: 'marble', cx: 28, cy: -104, rx: 37.4, ry: 34, rot: 10 },
    { feature: 'marbling', on: 'tail', clip: true, fill: 'marble', cx: -25, cy: -95, rx: 24.1, ry: 21, rot: 20 },
    // The dark cookie base, its top edge cut in sawtooth steps.
    { feature: 'tailBase', on: 'tail', clip: true, fill: 'crumb', cx: 0, cy: 0, rx: 72, ry: 80, rot: -5,
      fluff: [{ from: 222, to: 262, n: 3, len: 0.8, lean: 5, depth: 0.07, b1: -15, b2: 0, jit: 0 },
        { from: 263, to: 318, n: 3, len: 1.6, lean: 7, depth: 0.1, b1: -15, b2: 0, jit: 0 }] },
    // Crumbs, and a cream chip on the dark base.
    { feature: 'crumbs', on: 'tail', clip: true, fill: 'crumb', polys: [[45, -100, 11, 6, 15], [-10, -95, 5, 5, 10], [48, -78, 4, 4, 30, 0.7], [-6, -142, 5, 3, 0]] },
    { feature: 'crumbs', on: 'tail', clip: true, fill: 'tail', polys: [[25, -70, 5, 3, 10]] },
    // Paw extras are in the seated forepaw's space (its center on the origin, +x toward the center line): a
    // cookie crumb on each white forepaw.
    { feature: 'crumbs', on: 'pawL', fill: 'crumb', polys: [[-2, 0, 4, 3, 30]] },
    { feature: 'crumbs', on: 'pawR', fill: 'crumb', polys: [[5, -3, 3.5, 4, 110, 0.7]] },
  ],
  // The paws reach y ~131, so squash and stretch pivot about that height.
  rig: { ground: 131 },
  views: {
    // The close-up in examples/ref.png, lying with the head tipped onto the ruff. The body shifts up
    // and to the left under the head (x, y), and headX, headY undo that shift for the head.
    ref: { w: 1254, h: 1254, x: 438.6, y: 832.2, scale: 5.5, rotate: 20, pose: { earL: 16.2, earR: 20.5, x: -5, y: -10, headX: 5, headY: 10, tail: 1 } },
    // The pose in examples/icon.png: head tilted, eyes squeezed shut, mouth open and the tail tucked
    // away behind. The raised paws in the icon are not drawn.
    icon: { w: 800, h: 800, x: 373, y: 472, scale: 2.983, pose: { tilt: 8, earL: -18, earR: 18, tail: -75, eyes: 'squint', mouth: 'open' } },
  },
});
