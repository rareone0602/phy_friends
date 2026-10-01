// Character spec for K3V1N, an ice-blue cat with large pointed ears, one eye blue over mint and the other orange
// over yellow, a yellow mark on his forehead and a bushy white-ended tail.
// Pictures: examples/sheet.png (the color standard), mark.png (the forehead mark as his owner draws it),
// image.png (the sheet's eyes, which his owner sent to show their four colors), 67.png (a sticker) and two drawings
// by other artists, by_yuda.png and gurumin1.png.
// Colors are taken from the color bar on examples/sheet.png; those it does not show are taken from the drawing.
PhyFriends.define('kevin', {
  palette: {
    bg: '#1c1d21',
    fur: '#9ee8fa',        // The ice blue of the color bar (#adeffd), deepened slightly to hold its own on paper. Its house shade (furShade) fills the body, which sits under the head.
    face: '#e8f0f3',       // The white, deepened to mumuyou's depth to stay visible on paper: muzzle, dots, chest, paws and tail end.
    earInner: '#fcaac8',   // The pink of the ears, also used for the tongue.
    band: '#4db5ca',       // The darker cyan of the ear tips and cuffs, one house step deeper than the sheet's (#80cfe0), which matches furShade.
    eye: '#202638',        // A deep navy, near-black, used for the open mouth.
    eyeBlue: '#054dec',    // The upper half of his right eye: the royal blue of the color bar.
    eyeMint: '#94fcb7',    // The lower half of his right eye: the mint of the color bar.
    eyeOrange: '#fd8004',  // The upper half of his left eye: the orange of the color bar.
    blush: '#fcc3d6',      // A soft pink, lighter than the ears.
    mark: '#fdff3b',       // The yellow of the mark on his forehead, the crescents on his thighs and the lower half of his left eye.
  },
  // The head is a round dome with a soft tuft down each side, under the ears.
  head: {
    cx: 0, cy: -22, rx: 92, ry: 71,
    fluff: [{ from: -26, to: -2, n: 1, len: 9, lean: 4, depth: 0, b1: -30, b2: 10, jit: 0, sym: true }],
  },
  // The white muzzle and lower cheeks, edged with small shingles. Setting len < 0 flattens the top, under the fringe.
  face: {
    cx: 0, cy: 16, rx: 80, ry: 38,
    fluff: [
      { from: -22, to: 26, n: 3, len: 5, lean: 3, depth: 0.1, b1: -20, b2: 5, jit: 0, sym: true },
      { from: 235, to: 305, n: 1, len: -4, b1: 0, b2: 0, jit: 0 },
    ],
  },
  // The ears are large, upright cat ears with soft tips. The pink inner ear keeps a broad fur margin; the
  // pale rim that his pictures draw along its outer edge is treated as lighting and left out (FWIENDS.md).
  ears: {
    base: [-54, -70], angle: 27, width: 90, length: 88, lean: 8, tip: 10, b1: -16, b2: -8,
    inner: { scale: 0.6, dx: 2, dy: -12 },
  },
  // The mop is in the fur color: a crown inside the head's outline, a shaggy tuft under each ear, one
  // point between the eyes, where every picture brings the fur down, and a lock beside each eye. The
  // narrow pale bridge that the sheet, 67.png and gurumin1.png draw up the middle of that fur is left
  // out, because the two points of fur beside it would cover the eyes as they look inward. The valleys
  // sit high enough to clear the eyes as they look around. Each tip is [x, y, bendIn, bendOut, following valley].
  hair: {
    cx: 0, cy: -58, rx: 74, ry: 44, color: 'fur',
    tips: [
      [36, -84, 0, 0, [72, -62]],
      [90, -34, -6, -4, [70, -26]],
      [62, -2, 10, -12, [40, -34]],
      [0, -2, 8, -8, [-40, -34]],
      [-62, -2, -12, 10, [-70, -26]],
      [-90, -34, -4, -6, [-72, -62]],
      [-36, -84, 0, 0, [0, -80]],
    ],
  },
  // The eyes are tall pills, set wide and low, in the four colors of the color bar, as his owner asked: his right
  // eye (the viewer's left) blue over mint, and his left orange over yellow, split at the middle, as on the sheet
  // and in by_yuda.png. Each lower half is a flat mark clipped to the eye, level-edged like the sheet's, so that it
  // follows every glance and blink. The sheet's darker lid and upper iris, its pale crescent at the bottom and its
  // highlights are shading and are left out. Setting arc: 1 draws the happy, closed and squint strokes at the full
  // eye width, in the upper colors.
  eyes: { x: 34, y: 5, w: 13, h: 33, stroke: 4.8, arc: 1, color: 'eyeBlue',
    shine: { x: 0, y: 24, rx: 30, ry: 24, color: 'eyeMint' },
    right: { color: 'eyeOrange', shine: { x: 0, y: 24, rx: 30, ry: 24, color: 'mark' } } },
  // The blush sits on the white under the outer corner of each eye, tipped up to follow the cheek. It
  // sits low enough that an eye looking down and outward does not land on it.
  blush: { x: 55, y: 29, rx: 11.5, ry: 7, tilt: 10 },
  // There is no mouth by default; when open, it shows the pink tongue of the sheet, without a fang.
  mouth: { y: 21, size: 3.8 },
  // The body is small, in the house shade, and an onigiri (a rice ball): narrow under the chin, broad and flat at the
  // base. Shoulder tufts sit under the cheeks, and small hip tufts below them.
  body: {
    cx: 0, cy: 87, rx: 64, ry: 45, color: 'furShade', onigiri: 1,
    fluff: [{ from: -65, to: -25, n: 2, len: 7, depth: 0, b1: 0, b2: -25, jit: 0, sym: true },
      { from: 8, to: 40, n: 2, len: 6, lean: 6, depth: 0.08, b1: -25, b2: 5, jit: 0, sym: true }],
  },
  // The tail is a large bushy fox-like plume rising behind the left hip (the viewer's right), its tip
  // curling in. Its white end, cut into flame-shaped tufts that reach back toward the base, is its outer
  // half, as on the sheet. The white is what rises beside the cheek fluff, so that the ice blue stays
  // apart from the fur there as the tail sways in. The gray-lavender that the sheet paints along the
  // underside of the white is shading and is left out.
  tail: {
    base: [58, 106], angle: 60, length: 140, width: 102, bend: -74, taper: 0.72, root: 0.6, color: 'fur',
    fluff: [{ from: 300, to: 350, n: 2, len: 10, lean: 6, depth: 0.05, b1: -30, b2: 5, jit: 0 },
      { from: 255, to: 290, n: 1, len: 11, lean: -10, b1: 25, b2: -25, jit: 0 },
      { from: 200, to: 240, n: 2, len: 8, lean: 6, b1: -25, b2: 5, jit: 0 }],
    tip: { at: 0.5, color: 'face', fluff: [{ from: 50, to: 130, n: 3, len: 22, depth: 0.02, b1: 18, b2: 12, jit: 0.2 }] },
  },
  // The limbs, on the house template. Seated, the white forepaws rest on the ground between the hind feet,
  // which are turned out slightly, as on the sheet. Standing, as on the sheet and in by_yuda.png, the ice-blue arms end
  // in the white paws and the short legs in the feet, each under a darker cuff (extras).
  stand: {
    seat: { paw: { cx: 16, cy: 121, rx: 12.5, ry: 10 }, foot: { cx: 50, cy: 118, rx: 17, ry: 10, rot: -8 } },
    arms: { paw: { color: 'face' } },
    legs: { foot: { color: 'band' } },
  },
  extras: [
    // The spiky cheek tufts: a fur ruff under the head whose points reach past the white cheeks. An n: 1
    // range with len < 0 tucks the bottom in under the chin.
    { on: 'base', under: true, fill: 'fur', cx: 0, cy: 13, rx: 92, ry: 48,
      fluff: [{ from: -42, to: 21, n: 3, len: 15, lean: -2, depth: 0.1, b1: -40, b2: 14, jit: 0, sym: true },
        { from: 45, to: 135, n: 1, len: -14, b1: 5, b2: 5, jit: 0 }] },
    // Ear extras are in ear-local space (base on the origin, tip up, +x toward the top of the head).
    // The round darker spot on each ear tip, which the sheet draws on the back of the ear; clipped to the ear, it caps the tip.
    { on: 'ears', clip: true, kind: 'ellipse', fill: 'band', cx: 8, cy: -88, rx: 30, ry: 26 },
    // The white dot above the inner half of each eye: every picture sets the two dots closer together
    // than the eyes.
    { on: 'hair', kind: 'ellipse', fill: 'face', cx: -30, cy: -35, rx: 5.5, ry: 5 },
    { on: 'hair', kind: 'ellipse', fill: 'face', cx: 30, cy: -35, rx: 5.5, ry: 5 },
    // His forehead mark as his owner draws it (examples/mark.png): straight round-ended strokes, an
    // upright, a diagonal rising from its foot to the top of a second, lower upright, and a level bar
    // across both, at one scale, with the strokes thickened to read at gallery size. It is centered
    // between the white dots, as in the three frontal pictures (67.png, by_yuda.png and gurumin1.png),
    // with its bar level with the dots, as in by_yuda.png and the sheet.
    { on: 'hair', fill: 'mark', round: 0.5, nodes: [[-11.2, -56.7, 1], [-11.2, -28, 1], [-8.4, -28, 1], [-8.4, -56.7, 1]] },
    { on: 'hair', fill: 'mark', round: 0.5, nodes: [[-9.8, -27.4, 1], [10.2, -47.1, 1], [8.3, -49.1, 1], [-11.8, -29.4, 1]] },
    { on: 'hair', fill: 'mark', round: 0.5, nodes: [[6.9, -48.5, 1], [6.9, -17.3, 1], [9.7, -17.3, 1], [9.7, -48.5, 1]] },
    { on: 'hair', fill: 'mark', round: 0.5, nodes: [[-18.3, -35.6, 1], [18.3, -35.6, 1], [18.3, -38.4, 1], [-18.3, -38.4, 1]] },
    // The white chest and belly, an oval from under the chin whose tufts hang over the belly, above the
    // cuffs of the forepaws.
    { on: 'body', clip: true, fill: 'face', cx: 0, cy: 80, rx: 22, ry: 28,
      fluff: [{ from: 40, to: 140, n: 3, len: 4, depth: 0.1, b1: -25, b2: 5, jit: 0 }] },
    // The yellow crescents on the outer side of each thigh, clipped to the body so that they start at its edge, and
    // set low on its broad base, above the hind feet.
    { on: 'body', clip: true, fill: 'mark', nodes: [[58, 70, 1, 34], [24, 102, 1, -30], [60, 86, 1, 0]] },
    { on: 'body', clip: true, fill: 'mark', nodes: [[64, 94, 1, 34], [30, 120, 1, -30], [66, 106, 1, 0]] },
    { on: 'body', clip: true, fill: 'mark', nodes: [[-58, 70, 1, -34], [-24, 102, 1, 30], [-60, 86, 1, 0]] },
    { on: 'body', clip: true, fill: 'mark', nodes: [[-64, 94, 1, -34], [-30, 120, 1, 30], [-66, 106, 1, 0]] },
    // Paw extras are in the seated paw's space (its center on the origin, +x toward the center line): the darker cuff
    // at the wrist, behind the white paw.
    { on: 'paws', under: true, kind: 'ellipse', fill: 'band', cx: 0, cy: -8, rx: 11.5, ry: 8 },
    // Feet extras are in the seated foot's space: the white toes in front of the darker cuff at the ankle.
    { on: 'feet', kind: 'ellipse', fill: 'face', cx: 0, cy: 5, rx: 17, ry: 8, rot: -8 },
  ],
  // The paws reach y ~131, so squash and stretch pivot about that height.
  rig: { ground: 131 },
  views: {
    // The house close-up (1254 px, head tipped 20°). There is no house-style reference for K3V1N yet.
    closeup: { w: 1254, h: 1254, x: 450, y: 835, scale: 5.5, rotate: 20 },
  },
});
