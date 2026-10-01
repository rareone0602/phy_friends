// Character spec for Alfie, a coral tabby cat in round glasses, with a red mark on the forehead, white eyebrow
// spots, amber eyes, striped hips and a bushy coral tail.
// Pictures: examples/sheet.jpg (the color standard), envelope.png and glasses.png.
// Colors are taken from the color bar on examples/sheet.jpg; those it does not show are taken from the drawing.
PhyFriends.define('alfie', {
  palette: {
    bg: '#1c1d21',
    fur: '#fe8568',        // The coral of the color bar. Its house shade (furShade) fills the body, which sits under the head.
    head: 'fur',
    face: '#efeef3',       // The white of the color bar, deepened to mumuyou's depth to stay visible on paper: muzzle, cheeks, eyebrow spots, inner ears, chest and paws.
    hair: 'fur',
    ear: 'fur',
    earInner: 'face',
    iris: '#bb7500',       // The amber of the irises on the sheet (#d69033), one house step deeper so that it holds its weight on the white.
    ink: '#2a2a2a',        // The black of the color bar (the claws), used for the open mouth and the glasses.
    blush: '#ffbebf',      // The pink of the color bar, which the sheet gives the paw pads: the blush, the pads and the tongue.
    tongue: 'blush',
    body: 'furShade',
    tail: 'fur',
    arm: 'fur',
    paw: 'face',
    leg: 'furShade',
    foot: 'face',
    stripe: '#b23f27',     // The darker red-orange of the color bar (#d75639), one house step (L* -10) deeper so that it parts from furShade, with its chroma kept at the pictures' (C* ~60) rather than raised: the forehead mark, inner ears, hip stripes and ankles.
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
    inner: { scale: 0.62, dx: 2, dy: -12 },
  },
  // The mop is in the fur color: a crown of spikes inside the head's outline and a shaggy tuft under each ear. It
  // stops above the eyebrow spots, so that the white between the eyes and the glasses stay clear of it.
  // Each tip is [x, y, bendIn, bendOut, following valley].
  hair: {
    cx: 0, cy: -62, rx: 74, ry: 40,
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
  eyes: { x: 34, y: 3, w: 13, h: 32, stroke: 4.8, arc: 1 },
  // The blush sits on the white below each lens, clear of the ring, tipped up to follow the cheek.
  blush: { x: 48, y: 40, rx: 10, ry: 6, tilt: 10 },
  // There is no mouth by default (the sheet's nose and small mouth are omitted); when open, it shows the pink tongue
  // of the sheet's head study, without a fang.
  mouth: { y: 22, size: 3.8 },
  // The body is small under the large head, and an onigiri (a rice ball): narrow under the chin, broad and flat at the
  // base. It is in the house shade. Shoulder tufts sit under the cheeks, and small hip tufts below them.
  body: {
    cx: 0, cy: 87, rx: 64, ry: 45, onigiri: 1,
    fluff: [{ from: -65, to: -25, n: 2, len: 8, depth: 0, b1: 0, b2: -25, jit: 0, sym: true },
      { from: 8, to: 40, n: 2, len: 6, lean: 6, depth: 0.08, b1: -25, b2: 5, jit: 0, sym: true }],
  },
  // The tail is a large bushy plume rising behind Alfie's left hip (the viewer's right) and curling in low. It is all
  // coral, as the sheet's tip is: a white end vanishes into the paper and meets the white cheek as the tail sways in,
  // and the white that the sheet runs along the underside would sit on the silhouette's edge, where it vanishes too.
  tail: {
    base: [52, 110], angle: 58, length: 120, width: 96, bend: -84, taper: 0.72, root: 0.5,
    fluff: [{ from: 300, to: 350, n: 2, len: 10, lean: 6, depth: 0.05, b1: -30, b2: 5, jit: 0 },
      { from: 255, to: 290, n: 1, len: 14, lean: -10, b1: 25, b2: -25, jit: 0 },
      { from: 200, to: 240, n: 2, len: 8, lean: 6, b1: -25, b2: 5, jit: 0 }],
  },
  // The limbs, on the house template, in the sheet's markings. Seated, the white forepaws rest on the ground between
  // the hind feet (paw), and the white hind feet point at us at either side, under the red of the lower legs (foot).
  // Standing, the coral arms end in white forearms and paws, whose white edge is tufted, and the red of the lower
  // legs runs down to the white feet, its upper edge tufted too, as on the sheet.
  stand: {
    seat: { paw: { cx: 16, cy: 121, rx: 12.5, ry: 10 }, foot: { cx: 50, cy: 120, rx: 19, ry: 11, rot: -8 } },
    arms: { bands: [{ from: 0.5, to: 1, color: 'face', teeth: 3, depth: 4 }] },
    legs: { bands: [{ from: 0.6, to: 1, color: 'stripe', teeth: 3, depth: 4 }] },
  },
  extras: [
    // The spiky cheek tufts: a fur ruff under the head whose points reach past the white cheeks, as on the sheet. An
    // n: 1 range with len < 0 tucks the bottom in under the chin.
    { feature: 'cheekRuff', on: 'base', under: true, fill: 'fur', cx: 0, cy: 10, rx: 92, ry: 48,
      fluff: [{ from: -42, to: 12, n: 3, len: 14, lean: -2, depth: 0.1, b1: -40, b2: 14, jit: 0, sym: true },
        { from: 45, to: 135, n: 1, len: -14, b1: 5, b2: 5, jit: 0 }] },
    // The white rises into a point between the eyes, up between the eyebrow spots, as in every picture.
    { feature: 'blaze', on: 'face', fill: 'face', nodes: [[0, -44, 1, -10], [16, -14, 1, 0], [-16, -14, 1, -10]] },
    // The round glasses of envelope.png and glasses.png: a thin ring around each eye, wide enough that an eye
    // looking about stays inside it, a bridge across the white between them and a short arm running back to the
    // side of the head. They are drawn on the face, so they move with it; each ring is a path of two circles
    // wound in opposite directions, so that its middle stays open.
    { feature: 'glasses', on: 'face', fill: 'ink', d: 'M-63 3A29 29 0 1 1 -5 3A29 29 0 1 1 -63 3ZM-59.5 3A25.5 25.5 0 1 0 -8.5 3A25.5 25.5 0 1 0 -59.5 3Z' },
    { feature: 'glasses', on: 'face', fill: 'ink', d: 'M5 3A29 29 0 1 1 63 3A29 29 0 1 1 5 3ZM8.5 3A25.5 25.5 0 1 0 59.5 3A25.5 25.5 0 1 0 8.5 3Z' },
    { feature: 'glasses', on: 'face', fill: 'ink', d: 'M-7 0Q0 -5 7 0L7 3.5Q0 -1.5 -7 3.5Z' },
    { feature: 'glasses', on: 'face', fill: 'ink', round: 0.3, nodes: [[-61, -3, 1], [-86, -8, 1], [-86, -4.5, 1], [-61, 0.5, 1]] },
    { feature: 'glasses', on: 'face', fill: 'ink', round: 0.3, nodes: [[61, -3, 1], [61, 0.5, 1], [86, -4.5, 1], [86, -8, 1]] },
    // Ear extras are in ear-local space (base on the origin, tip up, +x toward the top of the head); on: 'ears' puts
    // them on both. The red half of the inner ear along its side toward the crown, from the base to the tip, as
    // envelope.png and glasses.png draw it: a marking, the same on both ears.
    { feature: 'earInner', on: 'ears', clip: true, fill: 'stripe', nodes: [[2, 0, 1, 0], [40, 0, 1, -16], [13, -76, 1, 0], [3, -40]] },
    // The forehead mark as the sheet's breakdown draws it: an upright oval over a round dot, between two moon
    // crescents whose round backs face the middle and whose horns point outward. It sits between the eyebrow spots
    // and the crown.
    { feature: 'forehead', on: 'hair', kind: 'ellipse', fill: 'stripe', cx: 0, cy: -74, rx: 5.5, ry: 11 },
    { feature: 'forehead', on: 'hair', kind: 'ellipse', fill: 'stripe', cx: 0, cy: -55, rx: 4.5, ry: 4.5 },
    { feature: 'forehead', on: 'hair', fill: 'stripe', nodes: [[-32, -84, 1], [-19, -79], [-12, -67], [-15, -56], [-27, -50, 1], [-20, -58], [-21, -67], [-24, -77]] },
    { feature: 'forehead', on: 'hair', fill: 'stripe', nodes: [[32, -84, 1], [24, -77], [21, -67], [20, -58], [27, -50, 1], [15, -56], [12, -67], [19, -79]] },
    // The eyebrow spots: a white oval above each lens, as in every picture.
    { feature: 'brows', on: 'hair', kind: 'ellipse', fill: 'face', cx: -32, cy: -38, rx: 8.5, ry: 5.5, rot: -8 },
    { feature: 'brows', on: 'hair', kind: 'ellipse', fill: 'face', cx: 32, cy: -38, rx: 8.5, ry: 5.5, rot: 8 },
    // The tabby stripes on the outer side of each hip: two narrow bands running in from the body's edge and tapering
    // to a round end, as the sheet's thigh stripes do, clipped to the body so that they start at its edge. They are
    // as short as the narrow top of the body allows, clear of the white chest.
    { feature: 'thighs', on: 'body', clip: true, fill: 'stripe', round: 0.4, nodes: [[50, 70, 1, -8], [29, 79, 1, 0], [50, 83, 1, 0]] },
    { feature: 'thighs', on: 'body', clip: true, fill: 'stripe', round: 0.4, nodes: [[57, 88, 1, -8], [29, 98, 1, 0], [57, 101, 1, 0]] },
    { feature: 'thighs', on: 'body', clip: true, fill: 'stripe', round: 0.4, nodes: [[-50, 70, 1, 0], [-50, 83, 1, 0], [-29, 79, 1, 8]] },
    { feature: 'thighs', on: 'body', clip: true, fill: 'stripe', round: 0.4, nodes: [[-57, 88, 1, 0], [-57, 101, 1, 0], [-29, 98, 1, 8]] },
    // The white chest and belly, an oval from under the chin whose tufts hang over the belly. The gray of the color
    // bar, which the sheet draws down the chest and where the white meets the coral at the wrists and ankles, is
    // left out: at gallery size it would read as a shadow. It is a little narrower than the sheet's, as the top of the
    // body is narrow. Its top is the ruff under the chin, so it lies over the tops of the arms, as a scarf does
    // (scarf).
    { feature: 'chest', on: 'scarf', clip: true, fill: 'face', cx: 0, cy: 80, rx: 25, ry: 30,
      fluff: [{ from: 40, to: 140, n: 3, len: 5, depth: 0.1, b1: -25, b2: 5, jit: 0 }] },
    // Feet extras are in the seated foot's space (its center on the origin, +x toward the center line).
    // The red of the lower leg above each white foot, behind it.
    { feature: 'socks', on: 'feet', under: true, kind: 'ellipse', fill: 'stripe', cx: 0, cy: -8, rx: 17, ry: 11, rot: -8 },
    // The big pink pad on each sole, which faces the viewer only while Alfie sits, so it flattens as the foot tips
    // down (sole).
    { feature: 'soles', on: 'feet', sole: true, kind: 'ellipse', fill: 'blush', cx: -1, cy: 1, rx: 8, ry: 6, rot: -8 },
  ],
  // The paws reach y ~131, so squash and stretch pivot about that height.
  rig: { ground: 131 },
  views: {
    // The house close-up (1254 px, head tipped 20°). There is no house-style reference for Alfie yet.
    closeup: { w: 1254, h: 1254, x: 450, y: 835, scale: 5.5, rotate: 20 },
  },
});
