// Character spec for jiaoyue, a lavender dog with a white face and chest, pale blue eyes, gray eyebrow dots, white paws
// and a big purple tail with a white end.
// Pictures: examples/PENUP_20261001_192151.png (seated, the color standard) and work_9.png (a happy head and paws).
// Colors are taken from PENUP_20261001_192151.png, deepened where the pictures' pale ones would vanish on paper.
PhyFriends.define('jiaoyue', {
  palette: {
    bg: '#1c1d21',
    fur: '#d6cce4',        // The pale lavender of the head and body (#eae6f5), deepened so that it holds on paper. Its house shade (furShade) fills the body, which sits under the head.
    face: '#efeef3',       // The white, deepened to mumuyou's depth to stay visible on paper: the muzzle and cheeks, the chest, the paws and feet, and the tail's end.
    ear: '#c8bbe9',        // The violet lavender of the backs of the ears (#e3d8ff), more violet than the head's, one house step deeper.
    earInner: '#aa98e9',   // The violet of the inner ears (#c6b5fa), one house step deeper.
    eye: '#302630',        // A near-black, for the open mouth.
    eyeBlue: '#56b9dd',    // The pale blue of the irises (#e1f1f9), deepened to a blue that holds its own on the white face.
    brow: '#a6a5ab',       // The neutral gray of the eyebrow dots (#e7e7e7), deepened so that the dots show on the lavender.
    blush: '#fcc3d6',      // The pictures draw no blush; this soft pink is chosen to read on the white.
    tongue: '#ff4360',     // The red-pink of the tongue in PENUP_20261001_192151.png, which the open mouth shows.
    tail: '#9688c6',       // The purple of the tail.
  },
  // The head is a broad dome, with a short tuft down each side under the ears.
  head: {
    cx: 0, cy: -20, rx: 85, ry: 68,
    fluff: [{ from: -22, to: 20, n: 2, len: 8, lean: 4, depth: 0.07, b1: -26, b2: 8, jit: 0, sym: true }],
  },
  // The white muzzle and cheeks. In the pictures the lavender comes down around the top of each eye; here the white
  // rises to the eyes' tops, so that each pill eye sits on one color. Its sides are cut into small tufts. Setting
  // len < 0 flattens the top.
  face: {
    cx: 0, cy: 16, rx: 75, ry: 42,
    fluff: [
      { from: -26, to: 25, n: 2, len: 4, lean: 3, depth: 0.08, b1: -20, b2: 5, jit: 0, sym: true },
      { from: 235, to: 305, n: 1, len: -4, b1: 0, b2: 0, jit: 0 },
    ],
  },
  // The ears are large and upright, with soft tips, in a lavender more violet than the head's, and violet insides,
  // as in both pictures. The beaded clip on his left ear in PENUP_20261001_192151.png is left out, as phy asked.
  ears: {
    base: [-59, -67], angle: 28, width: 87, length: 97, lean: 8, tip: 5, b1: -14, b2: -8, color: 'ear',
    inner: { scale: 0.63, dx: 1, dy: -9 },
  },
  // The shaggy fur of the crown and cheeks, in the fur color: spikes around the top of the head and a ragged tuft on
  // each cheek, as both pictures draw them. Each tip is [x, y, bendIn, bendOut, following valley].
  hair: {
    cx: 0, cy: -66, rx: 70, ry: 36, color: 'fur',
    tips: [
      [-69, -82, -8, -9, [-36, -99]], [-9, -110, -10, -10, [17, -99]],
      [62, -88, -6, -10, [82, -51]], [80, -34, 5, -9, [69, -29]],
      [57, -13, 8, -11, [39, -36]], [22, -17, 7, -9, [4, -36]],
      [-16, -16, -7, 8, [-40, -36]], [-58, -12, -9, 8, [-68, -28]],
      [-80, -37, -8, 6, [-79, -70]],
    ],
  },
  // The eyes are plain tall pills in jiaoyue's own blue. Setting arc: 1 draws the happy, closed and squint strokes at
  // the full eye width.
  eyes: { x: 34, y: 4, w: 13, h: 32, stroke: 5.2, arc: 1, color: 'eyeBlue' },
  // The blush sits on the white under the outer corner of each eye, tipped up to follow the cheek.
  blush: { x: 55, y: 26, rx: 11, ry: 6, tilt: 10 },
  // There is no mouth by default; when open, it shows the red-pink tongue of PENUP_20261001_192151.png.
  mouth: { y: 32, size: 4.6, tongue: 'tongue' },
  // The body is an onigiri (a rice ball): narrow under the chin, broad and flat at the base. It is in the house
  // shade. Shoulder tufts sit under the cheeks.
  body: {
    cx: 0, cy: 81, rx: 66, ry: 50, color: 'furShade', onigiri: 1,
    fluff: [{ from: -60, to: -25, n: 2, len: 11, depth: 0.04, b1: -15, b2: -22, jit: 0, sym: true }],
  },
  // The tail is a big plume rising behind jiaoyue's right hip (the viewer's left) and curling in, purple with a white
  // end whose tufts reach down into the purple, as in both pictures.
  tail: {
    base: [-54, 102], angle: 54, length: 147, width: 105, bend: -73, taper: 0.7, root: 0.5, color: 'tail',
    tip: { at: 0.64, color: 'face', fluff: [{ from: 50, to: 130, n: 3, len: 16, depth: 0.02, b1: 18, b2: 12, jit: 0.2 }] },
  },
  // The limbs, on the house template. Seated, as in PENUP_20261001_192151.png, the lavender forelegs stand side by side
  // in front, white from the wrist down to the white paws on the ground (paw), and the white hind feet point at us at
  // either side (foot). Standing, the arms end in white forearms and paws, and the legs in white feet.
  stand: {
    seat: { paw: { cx: 22, cy: 121, rx: 14, ry: 10 }, foot: { cx: 52, cy: 120, rx: 19, ry: 11, rot: -8 } },
    arms: { paw: { color: 'face' }, bands: [{ from: 0.65, to: 1, color: 'face' }] },
    legs: { foot: { color: 'face' } },
  },
  extras: [
    // The eyebrow dots: a gray oval above each eye, tipped down toward the middle, as in both pictures.
    { on: 'hair', kind: 'ellipse', fill: 'brow', cx: -32, cy: -33, rx: 6, ry: 4.5, rot: 30 },
    { on: 'hair', kind: 'ellipse', fill: 'brow', cx: 32, cy: -33, rx: 6, ry: 4.5, rot: -30 },
    // The white chest: a ruff under the chin whose tufts hang over the belly, as in both pictures. It is a little
    // narrower than the pictures', as the top of the body is narrow. Its top is the ruff under the chin, so it lies
    // over the tops of the arms, as a scarf does (scarf).
    { on: 'scarf', clip: true, fill: 'face', cx: 0, cy: 64, rx: 34, ry: 30,
      fluff: [{ from: 25, to: 155, n: 5, len: 9, depth: 0.07, b1: -22, b2: 6, jit: 0 }] },
  ],
  // The paws reach y ~131, so squash and stretch pivot about that height.
  rig: { ground: 131 },
  views: {
    // The pictures, matched by their eyes: the seated one, and the happy head, tipped 10° to its left.
    PENUP_20261001_192151: { w: 674, h: 823, x: 358, y: 318, scale: 2.7 },
    work_9: { w: 512, h: 512, x: 293, y: 252, scale: 1.9, rotate: -10, pose: { eyes: 'happy' } },
    // The house close-up (1254 px, head tipped 20°). There is no house-style reference for jiaoyue yet.
    closeup: { w: 1254, h: 1254, x: 450, y: 835, scale: 5.5, rotate: 20 },
  },
});
