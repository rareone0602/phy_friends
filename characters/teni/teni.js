// Character spec for Teni, a Glaceon with a cyan bob that ends in dark-teal diamonds, a curl on the crown,
// tall pale ears and a diamond-tipped tail.
// Pictures: examples/keychain.jpg, headshot.jpeg, skeb.png.
// Colors are taken from examples/keychain.jpg; those it does not show are taken from headshot.jpeg and skeb.png,
// which serve for colors and markings only.
PhyFriends.define('teni', {
  palette: {
    bg: '#1c1d21',
    fur: '#ace1e0',        // The pale teal of the keychain (#c3e5e4), deepened and made a little richer to stay visible on paper: ears, face, chest, tail, arms and forepaws. Its house shade (furShade) fills the body, which sits under the head.
    head: 'fur',
    face: 'fur',
    hair: '#34b6d0',       // The cyan of the hair, the curl and the inner ears. Its house shade (hairShade) fills the back of the bob, behind the mop.
    ear: 'fur',
    earInner: 'hair',
    iris: '#197c95',       // The teal of the irises: the median over the keychain's two eyes.
    ink: '#1b2b31',        // A deep teal near-black, for the open mouth.
    blush: '#f9bdc4',      // The pictures mark the blush only with pink hatching; this soft pink is chosen to read on the pale teal.
    tongue: '#e09197',     // The pink of the open mouth in headshot.jpeg.
    body: 'furShade',
    tail: 'fur',
    arm: 'fur',
    paw: 'fur',
    leg: 'furShade',
    foot: 'diamond',
    diamond: '#057291',    // The dark teal of the diamonds at the ends of the side locks and the tail, and of the hind feet.
  },
  // The head is a round dome. The hair covers all of it but the face.
  head: { cx: 0, cy: -20, rx: 80, ry: 64 },
  // The cheeks and jaw, in the fur's pale teal, end in a few tufts at the corners of the jaw, as in headshot.jpeg and
  // skeb.png; the chin sits on the shaded body. Setting len < 0 flattens the top, under the fringe.
  face: {
    cx: 0, cy: 14, rx: 76, ry: 38,
    fluff: [
      { from: 0, to: 50, n: 2, len: 9, lean: 4, depth: 0.1, b1: -25, b2: 5, jit: 0, sym: true },
      { from: 235, to: 305, n: 1, len: -4, b1: 0, b2: 0, jit: 0 },
    ],
  },
  // The ears are the Eevee line's tall, narrow leaf shapes, near phy's in size and as slim as the keychain's: the
  // outer edge bows out and the tip leans in. The cyan inner ear is a slim leaf of its own with a pale margin all
  // round; it stops short of the crown, so that it does not run into the cyan hair.
  ears: {
    base: [-50, -58], angle: 34, width: 64, length: 108, lean: 20, tip: 8, b1: -24, b2: -34,
    inner: { scale: 1, width: 32, length: 56, lean: 12, tip: 6, b1: -22, b2: -26, dx: 8, dy: -44 },
  },
  // The mop is a round crown over a fringe that comes to a point between the eyes, the cap of a Glaceon, with a
  // lock down each side of the face that flares out below the cheek. Each lock ends in a short outer point and an
  // inner one that runs into a diamond (an extra) at its full width, as on the keychain. The fringe curves up over
  // the eyes, and its valleys sit high enough to clear them as they look around.
  // Each tip is [x, y, bendIn, bendOut, following valley].
  hair: {
    cx: 0, cy: -56, rx: 76, ry: 44,
    tips: [
      [112, 24, -10, 4, [96, 16]],
      [86, 40, -4, 12, [40, -34]],
      [0, -16, 20, -20, [-40, -34]],
      [-86, 40, -12, 4, [-96, 16]],
      [-112, 24, -4, 10, [-96, -50]],
      [0, -104, -34, -34, [96, -50]],
    ],
  },
  // The eyes are plain tall pills in Teni's own teal, set wide and low. Setting arc: 1 draws the happy, closed
  // and squint strokes at the full eye width.
  eyes: { x: 33, y: 4, w: 13, h: 32, stroke: 4.6, arc: 1 },
  // The blush sits on the pale teal under the outer corner of each eye, tipped up to follow the cheek. It sits
  // low enough that an eye looking down and outward does not land on it.
  blush: { x: 52, y: 26, rx: 11, ry: 6.5, tilt: 10 },
  // There is no mouth by default (the pictures' nose is left out); when open, it shows one fang for the small
  // fangs that headshot.jpeg and skeb.png draw.
  mouth: { y: 21, size: 3.8, fang: true },
  // The body is small under the large head, and an onigiri (a rice ball): narrow under the chin, broad and flat at the
  // base. It is in the house shade. Short shoulder tufts sit under the cheeks, low enough not to rise beside the chin
  // like a collar, and small hip tufts below them.
  body: {
    cx: 0, cy: 84, rx: 68, ry: 47, onigiri: 1,
    fluff: [{ from: -65, to: -25, n: 2, len: 8, depth: 0, b1: 0, b2: -25, jit: 0, sym: true },
      { from: 8, to: 40, n: 2, len: 6, lean: 6, depth: 0.08, b1: -25, b2: 5, jit: 0, sym: true }],
  },
  // The tail is the flat blade of a Glaceon, rising from behind his left hip (the viewer's right) and bending in,
  // with a large dark-teal diamond at its end (an extra), as on the keychain and in skeb.png.
  tail: {
    base: [56, 104], angle: 56, length: 116, width: 40, bend: -40, taper: 0.6, root: 0.3, fluff: [],
  },
  // The limbs, on the house template; Teni stays bare. Seated, the pale teal forepaws rest on the ground between the
  // hind feet (paw), and the hind feet, in the dark teal of the keychain's feet, are turned out slightly at either
  // side (foot). Standing, the pale teal arms hang beside the body, and the dark teal of the feet runs up the lower
  // leg to a point at the front, as on the keychain. Standing, the tail leaves the hip lower and further out, so that
  // the pale right paw, hanging beside the body, does not vanish against the pale blade.
  stand: {
    seat: { paw: { cx: 15, cy: 122, rx: 12.5, ry: 9.5 }, foot: { cx: 47, cy: 119, rx: 19, ry: 12, rot: -8 } },
    legs: { bands: [{ from: 0.6, to: 1, color: 'diamond', teeth: 1, depth: 6 }] },
    tail: { base: [46, 116], angle: 80 },
  },
  extras: [
    // The back of the bob, in the house shade because it lies behind the mop: it shows beside the jaw and under each
    // side lock, and its middle is tucked behind the chin.
    { feature: 'backHair', on: 'base', under: true, fill: 'hairShade', cx: 0, cy: -24, rx: 100, ry: 74,
      tips: [[0, -110, 0, 0, [104, -30]], [98, 46, -10, 0, [64, 30]], [0, 20, 0, 0, [-64, 30]], [-98, 46, 0, 10, [-104, -30]]] },
    // The curl on the crown, from the keychain: a lock that rises from the top of the mop and curls over to the
    // right and back in.
    { feature: 'curl', on: 'hair', fill: 'hair', nodes: [[-10, -100, 1, 0], [-16, -126], [-4, -146], [18, -150], [32, -136], [26, -120],
      [12, -120, 1, 0], [18, -128], [14, -137], [2, -135], [-2, -122], [6, -100, 1, 0]] },
    // The diamonds at the ends of the side locks, the tips of a Glaceon's hanging appendages, tilted 6° so that
    // their lower points turn out, as on the keychain. They sit far enough out that the right one stays apart from
    // the tail's diamond when the head turns.
    { feature: 'lockTips', on: 'hair', fill: 'diamond', polys: [[-86, 56, 30, 4, 84, 0.62], [86, 56, 30, 4, 96, 0.62]] },
    // The pale ruff on the chest, from headshot.jpeg, its lower edge in spiky tufts. It starts a little below the chin,
    // so that a band of the shaded body parts the pale chin from the pale chest. It is a ruff round the neck, so it
    // lies over the tops of the arms, as a scarf does (scarf). It is no wider than the neck, so that the pale arms hang
    // beside it on the shaded body rather than vanishing against it.
    { feature: 'chest', on: 'scarf', clip: true, fill: 'fur', cx: 0, cy: 78, rx: 26, ry: 17,
      fluff: [{ from: 20, to: 160, n: 5, len: 9, depth: 0.1, b1: -25, b2: 5, jit: 0 }] },
    // Tail extras are drawn on the straight tail (base on the origin, tip at y -116, +x away from the body); the
    // library bends them onto the curve.
    // The diamond at the end of the blade.
    { feature: 'tailTip', on: 'tail', fill: 'diamond', polys: [[0, -112, 36, 4, 90, 0.6]] },
  ],
  // The paws reach y ~131, so squash and stretch pivot about that height.
  rig: { ground: 131 },
  views: {
    // The house close-up (1254 px, head tipped 20°). There is no house-style reference for Teni yet.
    closeup: { w: 1254, h: 1254, x: 450, y: 835, scale: 5.5, rotate: 20 },
  },
});
