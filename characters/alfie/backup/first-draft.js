// The first draft of characters/alfie/alfie.js, before the adversarial review's fixes. Kept per STYLE.md, principle 1.
// Character spec for Alfie, a coral tabby cat in round glasses, with a red mark on the forehead, white eyebrow
// spots, amber eyes, striped hips and a bushy white-ended tail.
// Pictures: examples/sheet.jpg (the color standard), envelope.png and glasses.png.
// Colors are taken from the color bar on examples/sheet.jpg; those it does not show are taken from the drawing.
PhyFriends.define('alfie', {
  palette: {
    bg: '#1c1d21',
    fur: '#fe8568',        // The coral of the color bar. Its house shade (furShade) fills the body, which sits under the head.
    face: '#efeef3',       // The white of the color bar, deepened to mumuyou's depth to stay visible on paper: muzzle, cheeks, eyebrow spots, inner ears, chest, paws and the tail's end.
    stripe: '#c42911',     // The darker red-orange of the color bar (#d75639), one house step deeper, since the sheet's own would match furShade: the forehead mark, inner ears, hip stripes and ankles.
    eye: '#2a2a2a',        // The black of the color bar (the claws), used for the open mouth and the glasses.
    eyeAmber: '#bb7500',   // The amber of the irises on the sheet (#d69033), one house step deeper so that it holds its weight on the white.
    blush: '#ffbebf',      // The pink of the color bar, which the sheet gives the paw pads: the blush, the pads and the tongue.
  },
  // The head is a round dome with two spiky tufts down each side, under the ears.
  head: {
    cx: 0, cy: -22, rx: 90, ry: 68,
    fluff: [{ from: -30, to: -2, n: 2, len: 10, lean: 4, depth: 0.05, b1: -30, b2: 10, jit: 0, sym: true }],
  },
  // The white muzzle and cheeks. On the sheet the coral comes down beside each eye; here the white rises to the
  // eyes' tops, so that each pill eye sits on one color. Its sides are cut into spiky tufts. Setting len < 0
  // flattens the top.
  face: {
    cx: 0, cy: 16, rx: 80, ry: 38,
    fluff: [
      { from: -24, to: 30, n: 3, len: 9, lean: 3, depth: 0.1, b1: -28, b2: 8, jit: 0, sym: true },
      { from: 235, to: 305, n: 1, len: -4, b1: 0, b2: 0, jit: 0 },
    ],
  },
  // The ears are large, upright cat ears with soft tips. The white inner ear keeps a broad coral margin; the red of
  // its inner half is an extra.
  ears: {
    base: [-54, -70], angle: 27, width: 90, length: 92, lean: 8, tip: 10, b1: -16, b2: -8,
    inner: { scale: 0.62, dx: 2, dy: -12, color: 'face' },
  },
  // The mop is in the fur color: a crown of spikes inside the head's outline and a shaggy tuft under each ear. It
  // stops above the eyebrow spots, so that the white between the eyes and the glasses stay clear of it.
  // Each tip is [x, y, bendIn, bendOut, following valley].
  hair: {
    cx: 0, cy: -62, rx: 74, ry: 40, color: 'fur',
    tips: [
      [14, -114, -10, -6, [40, -86]],
      [88, -40, -6, -4, [70, -40]],
      [60, -46, 0, 0, [0, -52]],
      [-60, -46, 0, 0, [-70, -40]],
      [-88, -40, -4, -6, [-40, -86]],
      [-12, -104, -6, -10, [0, -92]],
    ],
  },
  // The eyes are plain tall pills in Alfie's own amber. Setting arc: 1 draws the happy, closed and squint strokes at
  // the full eye width.
  eyes: { x: 34, y: 3, w: 13, h: 32, stroke: 4.8, arc: 1, color: 'eyeAmber' },
  // The blush sits on the white below the outer edge of each lens, tipped up to follow the cheek.
  blush: { x: 58, y: 36, rx: 10, ry: 6, tilt: 10 },
  // There is no mouth by default (the sheet's nose and small mouth are omitted); when open, it shows the pink tongue
  // of the sheet's head study, without a fang.
  mouth: { y: 22, size: 3.8, tongue: 'blush' },
  // The body is small, round and seated, in the house shade. Shoulder tufts sit under the cheeks, and small hip
  // tufts below them.
  body: {
    cx: 0, cy: 87, rx: 64, ry: 45, color: 'furShade',
    fluff: [{ from: -65, to: -25, n: 2, len: 8, depth: 0, b1: 0, b2: -25, jit: 0, sym: true },
      { from: 20, to: 60, n: 2, len: 6, lean: 6, depth: 0.08, b1: -25, b2: 5, jit: 0, sym: true }],
  },
  // The tail is a large bushy plume rising behind Alfie's left hip (the viewer's right) and curling in low, so that
  // its white end stays below the white cheek as the tail sways in. The white end is cut into tufts that reach back
  // toward the base. The white that the sheet runs along the underside is left out: beside the white end, it would
  // leave only a thin stripe of coral.
  tail: {
    base: [52, 110], angle: 58, length: 120, width: 96, bend: -84, taper: 0.72, root: 0.5, color: 'fur',
    fluff: [{ from: 300, to: 350, n: 2, len: 10, lean: 6, depth: 0.05, b1: -30, b2: 5, jit: 0 },
      { from: 255, to: 290, n: 1, len: 14, lean: -10, b1: 25, b2: -25, jit: 0 },
      { from: 200, to: 240, n: 2, len: 8, lean: 6, b1: -25, b2: 5, jit: 0 }],
    tip: { at: 0.62, color: 'face', fluff: [{ from: 50, to: 130, n: 3, len: 16, depth: 0.02, b1: 18, b2: 12, jit: 0.2 }] },
  },
  extras: [
    // The spiky cheek tufts: a fur ruff under the head whose points reach past the white cheeks, as on the sheet. An
    // n: 1 range with len < 0 tucks the bottom in under the chin.
    { on: 'base', under: true, fill: 'fur', cx: 0, cy: 10, rx: 92, ry: 48,
      fluff: [{ from: -42, to: 12, n: 3, len: 14, lean: -2, depth: 0.1, b1: -40, b2: 14, jit: 0, sym: true },
        { from: 45, to: 135, n: 1, len: -14, b1: 5, b2: 5, jit: 0 }] },
    // The white rises into a point between the eyes, up between the eyebrow spots, as in every picture.
    { on: 'face', fill: 'face', nodes: [[0, -44, 1, -10], [16, -14, 1, 0], [-16, -14, 1, -10]] },
    // The round glasses of envelope.png and glasses.png: a thin ring around each eye, wide enough that an eye
    // looking about stays inside it, a bridge across the white between them and a short arm running back to the
    // side of the head. They are drawn on the face, so they move with it; each ring is a path of two circles
    // wound in opposite directions, so that its middle stays open.
    { on: 'face', fill: 'eye', d: 'M-63 3A29 29 0 1 1 -5 3A29 29 0 1 1 -63 3ZM-59.5 3A25.5 25.5 0 1 0 -8.5 3A25.5 25.5 0 1 0 -59.5 3Z' },
    { on: 'face', fill: 'eye', d: 'M5 3A29 29 0 1 1 63 3A29 29 0 1 1 5 3ZM8.5 3A25.5 25.5 0 1 0 59.5 3A25.5 25.5 0 1 0 8.5 3Z' },
    { on: 'face', fill: 'eye', d: 'M-7 0Q0 -5 7 0L7 3.5Q0 -1.5 -7 3.5Z' },
    { on: 'face', fill: 'eye', round: 0.3, nodes: [[-61, -3, 1], [-86, -8, 1], [-86, -4.5, 1], [-61, 0.5, 1]] },
    { on: 'face', fill: 'eye', round: 0.3, nodes: [[61, -3, 1], [61, 0.5, 1], [86, -4.5, 1], [86, -8, 1]] },
    // Ear extras are in ear-local space (base on the origin, tip up, +x toward the top of the head); on: 'ears' puts
    // them on both. The red inner half of the inner ear, along its side toward the crown, as the sheet and
    // glasses.png draw it.
    { on: 'ears', clip: true, fill: 'stripe', nodes: [[12, -10, 1, 0], [32, -10, 1, 0], [15, -54, 1, 8]] },
    // The forehead mark as the sheet's breakdown draws it: an upright oval over a round dot, between two crescents
    // whose backs face the middle. It sits between the eyebrow spots and the crown, thickened to read at gallery size.
    { on: 'hair', kind: 'ellipse', fill: 'stripe', cx: 0, cy: -74, rx: 5.5, ry: 10 },
    { on: 'hair', kind: 'ellipse', fill: 'stripe', cx: 0, cy: -55, rx: 4.5, ry: 4.5 },
    { on: 'hair', fill: 'stripe', nodes: [[-27, -82, 1], [-11, -68], [-21, -52, 1], [-18, -67]] },
    { on: 'hair', fill: 'stripe', nodes: [[27, -82, 1], [18, -67], [21, -52, 1], [11, -68]] },
    // The eyebrow spots: a white oval above each lens, as in every picture.
    { on: 'hair', kind: 'ellipse', fill: 'face', cx: -32, cy: -38, rx: 8.5, ry: 5.5, rot: -8 },
    { on: 'hair', kind: 'ellipse', fill: 'face', cx: 32, cy: -38, rx: 8.5, ry: 5.5, rot: 8 },
    // The white chest and belly, an oval from under the chin whose tufts hang over the belly. The gray of the color
    // bar, which the sheet draws down the chest and where the white meets the coral at the wrists and ankles, is
    // left out: at gallery size it would read as a shadow.
    { on: 'body', clip: true, fill: 'face', cx: 0, cy: 80, rx: 28, ry: 30,
      fluff: [{ from: 40, to: 140, n: 3, len: 5, depth: 0.1, b1: -25, b2: 5, jit: 0 }] },
    // The tabby stripes on the outer side of each hip: two wedges, each widest at the body's edge and pointed
    // inward, clipped to the body so that they start at its edge.
    { on: 'body', clip: true, fill: 'stripe', nodes: [[72, 54, 1, -10], [34, 72, 1, 10], [72, 74, 1, 0]] },
    { on: 'body', clip: true, fill: 'stripe', nodes: [[72, 84, 1, -10], [40, 98, 1, 10], [72, 102, 1, 0]] },
    { on: 'body', clip: true, fill: 'stripe', nodes: [[-72, 54, 1, 0], [-72, 74, 1, -10], [-34, 72, 1, 10]] },
    { on: 'body', clip: true, fill: 'stripe', nodes: [[-72, 84, 1, 0], [-72, 102, 1, -10], [-40, 98, 1, 10]] },
    // The hind feet, turned out slightly: white, under the red of the lower legs, each with its big pink pad
    // turned to the front.
    { on: 'body', kind: 'ellipse', fill: 'stripe', cx: -50, cy: 112, rx: 17, ry: 11, rot: -8 },
    { on: 'body', kind: 'ellipse', fill: 'stripe', cx: 50, cy: 112, rx: 17, ry: 11, rot: 8 },
    { on: 'body', kind: 'ellipse', fill: 'face', cx: -50, cy: 120, rx: 19, ry: 11, rot: -8 },
    { on: 'body', kind: 'ellipse', fill: 'face', cx: 50, cy: 120, rx: 19, ry: 11, rot: 8 },
    { on: 'body', kind: 'ellipse', fill: 'blush', cx: -51, cy: 121, rx: 8, ry: 6, rot: -8 },
    { on: 'body', kind: 'ellipse', fill: 'blush', cx: 51, cy: 121, rx: 8, ry: 6, rot: 8 },
    // The white forepaws on the ground between them.
    { on: 'body', kind: 'ellipse', fill: 'face', cx: -16, cy: 121, rx: 12.5, ry: 10 },
    { on: 'body', kind: 'ellipse', fill: 'face', cx: 16, cy: 121, rx: 12.5, ry: 10 },
  ],
  // The paws reach y ~131, so squash and stretch pivot about that height.
  rig: { ground: 131 },
  views: {
    // The house close-up (1254 px, head tipped 20°). There is no house-style reference for Alfie yet.
    closeup: { w: 1254, h: 1254, x: 450, y: 835, scale: 5.5, rotate: 20 },
  },
});
