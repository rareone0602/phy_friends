// Character spec for Howdi, a sky-blue wolf with a navy mop of hair, two navy bands on each ear, blue eyes
// and a pale-tipped tail.
// Pictures: examples/IMG_3308.png (a reference sheet), IMG_9372.png, 68c53a39-b337-489f-89a3-f325b83f11d9.png
// (a crayon drawing by another artist) and ref.jpg (an earlier close-up in the house template, which the
// newer pictures supersede).
// Colors are taken from the color bar on examples/IMG_3308.png; those it does not show are taken from the
// drawings on the same sheet.
PhyFriends.define('howdi', {
  palette: {
    bg: '#1c1d21',
    fur: '#6ec7ff',        // The sky blue of the color bar. Its house shade (furShade) fills the body, which sits under the head.
    face: '#d5f0ff',       // The pale blue of the color bar: muzzle, cheeks, ruff, paws and tail end. Its house shade (faceShade) fills the back layer of the ruff.
    hair: '#223678',       // The navy of the color bar: the mop and the bands on the ears.
    earInner: '#eceff3',   // The white of the color bar, deepened to mumuyou's depth to stay visible on paper.
    eye: '#1d2038',        // A navy near-black, like the pupils, used for the mouth.
    eyeBlue: '#1f84e5',    // The bright blue of the irises in IMG_3308.png and IMG_9372.png (#539eff), one house step deeper so that it holds its weight.
    belly: '#a7deff',      // The mid blue of the color bar: the belly in all three newer pictures.
    blush: '#ffc6c8',      // The pink of the color bar, lightened by hand. The pictures mark the blush only with hatching.
    tongue: '#ff9da3',     // The pink of the color bar.
  },
  // The head is a round dome whose sides are cut into spiky tufts under the ears.
  head: {
    cx: 0, cy: -22, rx: 90, ry: 68,
    fluff: [{ from: -34, to: -4, n: 2, len: 10, lean: 4, depth: 0.05, b1: -30, b2: 10, jit: 0, sym: true }],
  },
  // The pale muzzle and cheeks. In the pictures the pale starts at the lower lids, so the eyes sit on sky blue;
  // here it rises to their tops, as for Brian and K3V1N, because the blue eyes are too faint on sky blue
  // (about 2:1) at gallery size. The cheeks end in spiky pale tufts that point outward and down. Setting
  // len < 0 flattens the top, under the fringe.
  face: {
    cx: 0, cy: 14, rx: 80, ry: 38,
    fluff: [
      { from: -24, to: 40, n: 3, len: 12, lean: 5, depth: 0.1, b1: -25, b2: 5, jit: 0, sym: true },
      { from: 235, to: 305, n: 1, len: -4, b1: 0, b2: 0, jit: 0 },
    ],
  },
  // The wolf ears are large and pointed, and stand fairly upright. Two navy bands cross the upper half of
  // each, and the tip stays sky blue, as in all three newer pictures. The white inner ear is drawn in front
  // of the head, so that it runs down over the fur.
  ears: {
    base: [-70, -60], angle: 34, width: 94, length: 92, lean: 26, tip: 5, b1: -15, b2: -12,
    inner: { front: true, scale: 1, dx: -2, dy: -8, width: 48, length: 62, lean: 18, tip: 4, b1: -20, b2: -4 },
    stripes: [{ t: 0.52, w: 12, a: 6, span: [-80, 20] }, { t: 0.75, w: 11, a: 6 }],
    stripeColor: 'hair',
  },
  // The messy mop is made of flame-shaped locks: a tall one leaning left on the crown, one sweeping right, a
  // spike out over each ear, a lock down each temple, one over the outer corner of each eye and a long one
  // between the eyes. The valleys sit high enough to clear the eyes as they look around.
  // Each tip is [x, y, bendIn, bendOut, following valley]. The pictures' eyebrow marks are left out: at gallery
  // size they merge into the fringe.
  hair: {
    cx: 0, cy: -62, rx: 70, ry: 42,
    tips: [
      [-70, -108, -8, -26, [-38, -106]],
      [-16, -142, -30, -6, [18, -112]],
      [60, -120, -28, 8, [70, -90]],
      [104, -60, -22, 10, [82, -40]],
      [88, -6, 4, -18, [70, -30]],
      [58, -16, 14, -18, [28, -46]],
      [8, 6, 14, -14, [-20, -46]],
      [-58, -16, -18, 14, [-70, -30]],
      [-88, -6, -18, 4, [-84, -42]],
      [-106, -58, 10, -22, [-80, -84]],
    ],
  },
  // The eyes are plain tall pills in Howdi's own blue, which every newer picture draws (ref.jpg draws them
  // black), without the pictures' darker ring, pupil, mint crescent, highlight or heavy lids. They are set
  // wide and low. Setting arc: 1 draws the happy, closed and squint strokes at the full eye width.
  eyes: { x: 34, y: 3, w: 13, h: 33, stroke: 4.5, arc: 1, color: 'eyeBlue' },
  // The blush sits on the pale under the outer corner of each eye, tipped up to follow the cheek. It sits low
  // enough that an eye looking down and outward does not land on it.
  blush: { x: 54, y: 26, rx: 11, ry: 6.5, tilt: 10 },
  // There is no mouth by default, and the pictures' nose is left out. The greeting's 'w' mouth stands for the
  // small mouth the pictures draw.
  mouth: { y: 21, size: 3.8 },
  // The body is an onigiri (a rice ball): narrow under the chin, broad and flat at the base. It sits under the head,
  // so it takes the house shade. Shoulder tufts sit under the cheeks, and small hip tufts below them.
  body: {
    cx: 0, cy: 82, rx: 68, ry: 50, color: 'furShade', onigiri: 1,
    fluff: [{ from: -65, to: -25, n: 2, len: 14, depth: 0, b1: 0, b2: -25, jit: 0, sym: true },
      { from: 8, to: 40, n: 2, len: 7, lean: 6, depth: 0.08, b1: -25, b2: 5, jit: 0, sym: true }],
  },
  // The tail is a bushy wolf tail that sweeps out from behind Howdi's right hip (the viewer's left), as in the
  // crayon drawing, and curls up. The sheet and IMG_9372.png put it on the other side; it stays on this side
  // because the gallery's layout is measured with it here. Its pale end is cut into flame-shaped
  // tufts that reach back into the sky blue.
  tail: {
    base: [-54, 108], angle: 62, length: 124, width: 82, bend: -50, taper: 0.72, root: 0.5, color: 'fur',
    fluff: [{ from: 300, to: 350, n: 2, len: 10, lean: 6, depth: 0.05, b1: -30, b2: 5, jit: 0 },
      { from: 255, to: 290, n: 1, len: 14, lean: -10, b1: 25, b2: -25, jit: 0 },
      { from: 200, to: 240, n: 2, len: 8, lean: 6, b1: -25, b2: 5, jit: 0 }],
    tip: { at: 0.65, color: 'face', fluff: [{ from: 50, to: 130, n: 3, len: 18, depth: 0.02, b1: 18, b2: 12, jit: 0.2 }] },
  },
  // The limbs, on the house template. Seated, the pale forepaws rest on the ground between the pale hind feet, which
  // are turned out slightly. Standing, as in IMG_3308.png, the sky-blue arms end in pale paws, and the legs in pale
  // lower legs and feet, the pale meeting the blue in a jagged edge.
  stand: {
    seat: { paw: { cx: 15, cy: 121, rx: 12.5, ry: 10 }, foot: { cx: 46, cy: 121, rx: 18, ry: 10, rot: -8 } },
    arms: { paw: { color: 'face' }, bands: [{ from: 0.72, to: 1, color: 'face', teeth: 2, depth: 4 }] },
    legs: { bands: [{ from: 0.55, to: 1, color: 'face', teeth: 3, depth: 5 }], foot: { color: 'face' } },
  },
  extras: [
    // Cheek fluff under the head: a fur ruff whose tufts reach past the pale cheeks. An n: 1 range with
    // len < 0 tucks the bottom in under the chin.
    { on: 'base', under: true, fill: 'fur', cx: 0, cy: 13, rx: 90, ry: 48,
      fluff: [{ from: -42, to: 21, n: 3, len: 15, lean: -2, depth: 0.1, b1: -35, b2: 12, jit: 0, sym: true },
        { from: 45, to: 135, n: 1, len: -14, b1: 5, b2: 5, jit: 0 }] },
    // The mid-blue belly, under the ruff.
    { on: 'body', clip: true, fill: 'belly', cx: 0, cy: 106, rx: 34, ry: 34 },
    // The ruff: a back layer in the house shade, which shows as a collar under the chin, and the pale ruff in
    // front of it, whose spiky tufts hang over the belly. It lies over the tops of the arms, as a scarf does (scarf).
    { on: 'scarf', clip: true, fill: 'faceShade', cx: 0, cy: 52, rx: 66, ry: 24 },
    { on: 'scarf', fill: 'face', cx: 0, cy: 70, rx: 36, ry: 19,
      fluff: [{ from: 20, to: 160, n: 5, len: 13, depth: 0.1, b1: -25, b2: 5, jit: 0 },
        { from: 215, to: 325, n: 4, len: 5, depth: 0.05, b1: -20, b2: 10, jit: 0 }] },
  ],
  // The paws reach y ~131, so squash and stretch pivot about that height.
  rig: { ground: 131 },
  views: {
    // The house close-up of examples/ref.jpg, drawn with the ears relaxed outward.
    ref: { w: 1254, h: 1254, x: 470, y: 837, scale: 5.5, rotate: 20, pose: { earL: 30, earR: 30 } },
  },
});
