// A candidate, the runner-up to characters/teni/teni.js: faithful to headshot.jpeg rather than keychain.jpg, in its
// deeper colors, with its dark inner ears and long locks, and without the curl, which only keychain.jpg draws.
// Kept per STYLE.md, principle 1.
// Character spec for Teni, a Glaceon with a blue bob whose long side locks end in teal diamonds, tall pale ears
// with dark insides and a diamond-tipped tail.
// Pictures: examples/keychain.jpg, headshot.jpeg, skeb.png.
// Colors are taken from examples/headshot.jpeg; those it does not show are taken from keychain.jpg and skeb.png,
// which serve for colors and markings only.
PhyFriends.define('teni', {
  palette: {
    bg: '#1c1d21',
    fur: '#9cced5',        // The pale teal of headshot.jpeg: ears, face, chest and tail. Its house shade (furShade) fills the body, which sits under the head.
    hair: '#2f95bd',       // The blue of the hair. Its house shade (hairShade) fills the back of the bob, behind the mop.
    earInner: '#0f637d',   // The dark teal inside the ears.
    diamond: '#218c96',    // The teal of the diamonds at the ends of the side locks. The tail and the hind feet, which headshot.jpeg does not show, take it too.
    eye: '#1b2b31',        // A deep teal near-black, for the open mouth.
    eyeBlue: '#248dbc',    // The blue of the irises: the median over the two eyes of headshot.jpeg.
    blush: '#f9bdc4',      // The pictures mark the blush only with pink hatching; this soft pink is chosen to read on the pale teal.
    tongue: '#e09197',     // The pink of the open mouth in headshot.jpeg.
  },
  // The head is a round dome. The hair covers all of it but the face.
  head: { cx: 0, cy: -20, rx: 80, ry: 64 },
  // The cheeks and jaw, in the fur's pale teal, end in a few tufts at the corners of the jaw, as in headshot.jpeg and
  // skeb.png; the chin sits on the shaded body. Setting len < 0 flattens the top, under the fringe.
  face: {
    cx: 0, cy: 14, rx: 76, ry: 38, color: 'fur',
    fluff: [
      { from: 0, to: 50, n: 2, len: 9, lean: 4, depth: 0.1, b1: -25, b2: 5, jit: 0, sym: true },
      { from: 235, to: 305, n: 1, len: -4, b1: 0, b2: 0, jit: 0 },
    ],
  },
  // The ears are the Eevee line's tall, narrow leaf shapes, near phy's in size: the outer edge bows out and the tip
  // leans in. The dark inner ear is a slim leaf of its own with a pale margin all round.
  ears: {
    base: [-50, -58], angle: 34, width: 64, length: 108, lean: 20, tip: 8, b1: -24, b2: -34,
    inner: { scale: 1, width: 32, length: 56, lean: 12, tip: 6, b1: -22, b2: -26, dx: 8, dy: -44 },
  },
  // The mop is a round crown over a fringe that comes to a point between the eyes, the cap of a Glaceon, with a
  // lock down each side of the face that flares out below the cheek. Each lock ends in a short outer point and an
  // inner one that reaches the chest, as in headshot.jpeg, and runs into a diamond (an extra) at its full width.
  // The fringe curves up over the eyes, and its valleys sit high enough to clear them as they look around.
  // Each tip is [x, y, bendIn, bendOut, following valley].
  hair: {
    cx: 0, cy: -56, rx: 76, ry: 44, color: 'hair',
    tips: [
      [112, 24, -10, 4, [96, 16]],
      [86, 56, -4, 12, [40, -34]],
      [0, -16, 20, -20, [-40, -34]],
      [-86, 56, -12, 4, [-96, 16]],
      [-112, 24, -4, 10, [-96, -50]],
      [0, -104, -34, -34, [96, -50]],
    ],
  },
  // The eyes are plain tall pills in Teni's own blue, set wide and low. Setting arc: 1 draws the happy, closed
  // and squint strokes at the full eye width.
  eyes: { x: 33, y: 4, w: 13, h: 32, stroke: 4.6, arc: 1, color: 'eyeBlue' },
  // The blush sits on the pale teal under the outer corner of each eye, tipped up to follow the cheek. It sits
  // low enough that an eye looking down and outward does not land on it.
  blush: { x: 52, y: 26, rx: 11, ry: 6.5, tilt: 10 },
  // There is no mouth by default (the pictures' nose is left out); when open, it shows one fang for the small
  // fangs that headshot.jpeg and skeb.png draw.
  mouth: { y: 21, size: 3.8, fang: true },
  // The body is small, round and seated, in the house shade. Short shoulder tufts sit under the cheeks, low enough
  // not to rise beside the chin like a collar, and small hip tufts below them.
  body: {
    cx: 0, cy: 84, rx: 68, ry: 47, color: 'furShade',
    fluff: [{ from: -65, to: -25, n: 2, len: 8, depth: 0, b1: 0, b2: -25, jit: 0, sym: true },
      { from: 20, to: 60, n: 2, len: 6, lean: 6, depth: 0.08, b1: -25, b2: 5, jit: 0, sym: true }],
  },
  // The tail is the flat blade of a Glaceon, rising from behind his left hip (the viewer's right) and bending in,
  // with a large teal diamond at its end (an extra), as on the keychain and in skeb.png.
  tail: {
    base: [56, 104], angle: 56, length: 116, width: 40, bend: -40, taper: 0.6, root: 0.3, color: 'fur', fluff: [],
  },
  extras: [
    // The back of the bob, in the house shade because it lies behind the mop: it shows beside the jaw and under each
    // side lock, and its middle is tucked behind the chin.
    { on: 'base', under: true, fill: 'hairShade', cx: 0, cy: -24, rx: 100, ry: 74,
      tips: [[0, -110, 0, 0, [104, -30]], [98, 46, -10, 0, [64, 30]], [0, 20, 0, 0, [-64, 30]], [-98, 46, 0, 10, [-104, -30]]] },
    // The diamonds at the ends of the side locks, the tips of a Glaceon's hanging appendages, tilted 6° so that
    // their lower points turn out, as on the keychain. They sit far enough out that the right one stays apart from
    // the tail's diamond when the head turns.
    { on: 'hair', fill: 'diamond', polys: [[-86, 72, 30, 4, 84, 0.62], [86, 72, 30, 4, 96, 0.62]] },
    // The pale ruff on the chest, from headshot.jpeg, its lower edge in spiky tufts. It starts a little below the chin,
    // so that a band of the shaded body parts the pale chin from the pale chest.
    { on: 'body', clip: true, fill: 'fur', cx: 0, cy: 78, rx: 40, ry: 18,
      fluff: [{ from: 20, to: 160, n: 5, len: 9, depth: 0.1, b1: -25, b2: 5, jit: 0 }] },
    // The forepaws on the ground between the hind feet, pale teal as in skeb.png.
    { on: 'body', kind: 'ellipse', fill: 'fur', cx: -15, cy: 122, rx: 12.5, ry: 9.5 },
    { on: 'body', kind: 'ellipse', fill: 'fur', cx: 15, cy: 122, rx: 12.5, ry: 9.5 },
    // The hind feet in the teal of the diamonds, as the keychain's feet are, turned out slightly.
    { on: 'body', kind: 'ellipse', fill: 'diamond', cx: -47, cy: 119, rx: 19, ry: 12, rot: -8 },
    { on: 'body', kind: 'ellipse', fill: 'diamond', cx: 47, cy: 119, rx: 19, ry: 12, rot: 8 },
    // Tail extras are drawn on the straight tail (base on the origin, tip at y -116, +x away from the body); the
    // library bends them onto the curve.
    // The diamond at the end of the blade.
    { on: 'tail', fill: 'diamond', polys: [[0, -112, 36, 4, 90, 0.6]] },
  ],
  // The paws reach y ~131, so squash and stretch pivot about that height.
  rig: { ground: 131 },
  views: {
    // The house close-up (1254 px, head tipped 20°). There is no house-style reference for Teni yet.
    closeup: { w: 1254, h: 1254, x: 450, y: 835, scale: 5.5, rotate: 20 },
  },
});
