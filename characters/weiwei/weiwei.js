// Character spec for WeiWei, an orange fox with a white mop, white eyebrows, white cheeks and muzzle, a big spiky
// white ruff, pink inner ears, one eye blue over mint and the other brown over yellow, peach forearms and feet with
// pink pads, and a bushy tail with a peach end.
// Pictures: examples/IMG_7740.jpg (a close-up of his head, the latest picture, which wins wherever the two differ)
// and 148.png (an earlier reference sheet: front, back and side, the tail, and a color bar), which gives what the
// close-up does not show: the body, the arms and legs, the paws, the tail and his back. The sheet as it differs is
// kept as backup/sheet.js.
// Colors are taken from the close-up, and from the sheet's color bar for the parts that only the sheet shows,
// deepened only where noted.
PhyFriends.define('weiwei', {
  palette: {
    bg: '#1c1d21',
    fur: '#f58d3e',        // The orange of the color bar, which the close-up's matches: the head, ears, arms, body and tail. Its house shade (furShade) fills the body, which sits under the head, and the legs.
    head: 'fur',
    face: '#efeef3',       // The white of the close-up (#ffffff, the hair #f2f2f2), deepened to mumuyou's depth to stay visible on paper: the hair, the muzzle and cheeks, the eyebrows and the ruff. Its house shade fills the partings in the hair (hairShade) and the back layer of the ruff, under the chin (faceShade).
    hair: 'face',
    ear: 'fur',
    earInner: '#ef847e',   // The pink of the inner ears in the close-up.
    iris: '#193bdb',       // His right eye's upper half: the deep blue of the close-up.
    irisRight: '#864205',  // His left eye's upper half: the close-up's amber (#c8702a), two house steps deeper, the brown of its darker top, since the amber itself would vanish on the orange fur.
    ink: '#2a1a1e',        // A warm near-black, after the dark of the close-up's nose, for the open mouth.
    blush: '#e8aea2',      // The pink of the sheet's color bar (#feccc1), the pads', one house step deeper so that the pads show on the peach: the pads, and the blush, which neither picture draws strongly enough to show.
    tongue: '#ff8f8e',     // The pink of the tongue in the close-up.
    body: 'furShade',
    tail: 'fur',
    arm: 'fur',
    paw: 'peach',
    leg: 'furShade',
    foot: 'peach',
    peach: '#fbd0a9',      // The peach of the sheet's color bar: the forearms and paws, the lower legs and feet, and the end of the tail.
    eyeMint: '#b2f6b9',    // His right eye's lower half: the mint of the close-up.
    eyeYellow: '#f7ff51',  // His left eye's lower half: the yellow of the close-up.
  },
  // The head is a broad dome. Its fluffy cheeks are the ruff under it (an extra).
  head: {
    cx: 0, cy: -22, rx: 90, ry: 68,
  },
  // The white muzzle and cheeks, under the eyes, as in the close-up, so that the eyes sit on the orange; an eye
  // looking down just reaches it. Its sides are cut into the spiky tufts of the close-up's white cheeks. An n: 1 range
  // with len < 0 dips its top in the middle, where the orange comes down between the eyes to the nose. Its chin lies
  // over the ruff's shaded back layer (an extra), which parts it from the white ruff.
  face: {
    cx: 0, cy: 34, rx: 68, ry: 20,
    fluff: [{ from: -10, to: 40, n: 3, len: 10, lean: 4, depth: 0.08, b1: -24, b2: 8, jit: 0, sym: true },
      { from: 235, to: 305, n: 1, len: -8, b1: 0, b2: 0, jit: 0 }],
  },
  // The ears are tall pointed fox ears whose pink insides fill most of each ear, as in the close-up (the sheet's are
  // white).
  ears: {
    base: [-58, -66], angle: 30, width: 88, length: 98, lean: 8, tip: 5, b1: -14, b2: -8,
    inner: { scale: 0.65, dx: 2, dy: -10 },
  },
  // The white mop of the close-up (the sheet has orange tufts): a crown of pointed locks rising above the head, a short
  // flick and a long lock down each side of the face to the cheek, and a lock between the eyes. The valleys over the
  // eyes sit high, so that the orange forehead shows above each eye, where the white eyebrows are, and the eyes stay
  // clear as they look round; the close-up's long locks over the eyes are shortened to clear them. Each tip is [x, y,
  // bendIn, bendOut, following valley].
  hair: {
    cx: 0, cy: -60, rx: 76, ry: 42,
    tips: [
      [92, -24, -8, 6, [80, -8]],
      [80, 12, -6, 10, [36, -42]],
      [2, 4, -10, 8, [-36, -42]],
      [-76, 12, -10, 6, [-80, -8]],
      [-94, -26, -6, -8, [-82, -58]],
      [-84, -88, -10, -10, [-46, -98]],
      [-44, -124, -10, -10, [-12, -104]],
      [8, -132, -10, -10, [30, -104]],
      [54, -118, -10, -10, [62, -90]],
      [88, -72, -10, -8, [88, -48]],
    ],
  },
  // The eyes are tall pills in his own colors, split at the middle as in the close-up: his right eye (the viewer's
  // left) blue over mint, and his left brown over yellow (the sheet's bar gives a paler sky, a stronger green and an
  // apricot). Each lower half is a flat mark clipped to the eye, so that
  // it follows every glance and blink; the color above holds the eye's shape on the orange. The pictures' pupils,
  // dark lids and highlights are line work and lighting, and are left out. An eye looking down reaches the white.
  // Setting arc: 1 draws the happy, closed and squint strokes at the full eye width, in the upper colors.
  eyes: { x: 34, y: -4, w: 13, h: 32, stroke: 5, arc: 1,
    shine: { x: 0, y: 24, rx: 30, ry: 24, color: 'eyeMint' },
    right: { shine: { x: 0, y: 24, rx: 30, ry: 24, color: 'eyeYellow' } } },
  // The blush sits on the white muzzle under each eye, tipped up to follow the cheek, in the pads' pink.
  blush: { x: 40, y: 31, rx: 11, ry: 6, tilt: 8 },
  // There is no mouth by default (the pictures' nose and mouth are omitted); when open, it shows the close-up's pink
  // tongue.
  mouth: { y: 34, size: 4.2 },
  // The body is an onigiri (a rice ball): narrow under the chin, broad and round at the base. It is in the house
  // shade. Small hip tufts sit at its base.
  body: {
    cx: 0, cy: 82, rx: 66, ry: 50, onigiri: 1,
    fluff: [{ from: 8, to: 40, n: 2, len: 7, lean: 6, depth: 0.08, b1: -25, b2: 5, jit: 0, sym: true }],
  },
  // The tail is a large bushy brush rising behind his left hip (the viewer's right), its tip curling in. Its peach
  // end, half its length as on the sheet, is cut into flame-shaped tufts that reach into the orange. The sheet does
  // not say on which side it hangs.
  tail: {
    base: [56, 106], angle: 50, length: 140, width: 98, bend: -70, taper: 0.7, root: 0.5,
    tip: { at: 0.5, color: 'peach', fluff: [{ from: 50, to: 130, n: 4, len: 18, depth: 0.02, b1: 18, b2: 12, jit: 0.2 }] },
  },
  // The limbs, on the house template. Seated, the peach forepaws rest on the ground in front, and the peach hind feet
  // show their soles at either side. Standing, as on the sheet, the orange arms turn peach at the elbow, in tufts, down
  // to the peach paws, and the legs turn peach halfway down to the peach feet.
  stand: {
    seat: { paw: { cx: 18, cy: 121, rx: 13, ry: 10 }, foot: { cx: 50, cy: 117, rx: 20, ry: 14 } },
    arms: { bands: [{ from: 0.5, to: 1, color: 'peach', teeth: 3, depth: 4 }] },
    legs: { bands: [{ from: 0.45, to: 1, color: 'peach', teeth: 3, depth: 4 }] },
  },
  extras: [
    // Cheek fluff under the head: an orange ruff whose spiky tufts stick out past the cheeks, as in both pictures. An
    // n: 1 range with len < 0 tucks the bottom in under the chin.
    { feature: 'cheekRuff', on: 'base', under: true, fill: 'fur', cx: 0, cy: 14, rx: 92, ry: 52,
      fluff: [{ from: -40, to: 22, n: 3, len: 16, lean: -3, depth: 0.1, b1: -33, b2: 10, jit: 0, sym: true },
        { from: 50, to: 130, n: 1, len: -22, b1: 5, b2: 5, jit: 0 }] },
    // The partings in the mop, in the hair's house shade, sweeping down from the crown, so that the white mop reads as
    // locks rather than a cap.
    { feature: 'partings', on: 'hair', clip: true, fill: 'hairShade', nodes: [[-30, -104, 1, -12], [-66, -6, 1, 0], [-54, -10, 1, 10]] },
    { feature: 'partings', on: 'hair', clip: true, fill: 'hairShade', nodes: [[26, -106, 1, 10], [58, -24, 1, 0], [68, -28, 1, -12]] },
    // The white eyebrows, which the close-up draws under the fringe and the sheet's note gives him: a short oval above
    // each eye, between the locks, rising toward the middle.
    { feature: 'brows', on: 'face', kind: 'ellipse', fill: 'face', cx: -36, cy: -28, rx: 7, ry: 4.5, rot: -10 },
    { feature: 'brows', on: 'face', kind: 'ellipse', fill: 'face', cx: 36, cy: -28, rx: 7, ry: 4.5, rot: 10 },
    // The big white ruff round his neck: a back layer in the house shade, which shows as a collar under the chin and
    // parts the white muzzle from the white ruff, where the pictures show a little orange of his neck (in the orange,
    // the neck reads as an open mouth under the muzzle); and the ruff in front of it, wider than the narrow top of the
    // body, its long pointed tufts, as in the close-up, hanging to the middle of his chest. It is fur round the neck,
    // so it lies over the tops of the arms, as a scarf does (scarf). The front narrows a little toward the top, as the
    // body does (onigiri: 0.5).
    { feature: 'chest', on: 'scarf', fill: 'faceShade', cx: 0, cy: 56, rx: 52, ry: 12 },
    { feature: 'chest', on: 'scarf', fill: 'face', cx: 0, cy: 75, rx: 60, ry: 20, onigiri: 0.5,
      fluff: [{ from: -20, to: 78, n: 4, len: 15, lean: 2, depth: 0.04, b1: -18, b2: 12, jit: 0 },
        { from: 78, to: 102, n: 1, len: 16, lean: 4, depth: 0, b1: -12, b2: -4, jit: 0 },
        { from: 102, to: 200, n: 4, len: 15, lean: -2, depth: 0.04, b1: -18, b2: 12, jit: 0 }] },
    // The ruff's back, across his shoulders, as the sheet's back view draws it. It lies on the back (turn: 'back'),
    // under the body, so that it shows only once he turns.
    { feature: 'chest', on: 'body', under: true, turn: 'back', fill: 'face', cx: 0, cy: 66, rx: 54, ry: 26,
      fluff: [{ from: -10, to: 190, n: 7, len: 12, depth: 0.08, b1: -25, b2: 6, jit: 0 }] },
    // Paws extras are in the seated paw's space (its center on the origin, +x toward the center line). The pink pads
    // of the forepaws, which the sheet's front view shows on his palms: a palm pad and three small ones above it; the
    // sheet's fourth is too small to keep.
    { feature: 'soles', on: 'paws', kind: 'ellipse', fill: 'blush', cx: 0, cy: 3, rx: 5.5, ry: 4 },
    { feature: 'soles', on: 'paws', fill: 'blush', round: 0.5, polys: [[-6.5, -3.5, 2.2, 8], [0, -5.5, 2.2, 8], [6.5, -3.5, 2.2, 8]] },
    // Feet extras are in the seated foot's space. The soles of the hind feet, as the sheet's back view shows them: a
    // pink pad under three pink toe beans on each. They face the viewer only while he sits, so they flatten as the
    // foot tips down (sole).
    { feature: 'soles', on: 'feet', sole: true, kind: 'ellipse', fill: 'blush', cx: 0, cy: 5, rx: 8.5, ry: 6.5 },
    { feature: 'soles', on: 'feet', sole: true, fill: 'blush', round: 0.5, polys: [[-10, -6, 3.4, 8], [0, -9, 3.4, 8], [10, -6, 3.4, 8]] },
  ],
  // The paws reach y ~131, so squash and stretch pivot about that height.
  rig: { ground: 131 },
  views: {
    // The pictures, matched by their eyes: the close-up, with the tongue out, and the sheet's front view, standing.
    IMG_7740: { w: 1000, h: 1000, x: 606, y: 574, scale: 4.6, pose: { mouth: 'open' } },
    148: { w: 4724, h: 1772, x: 684, y: 470, scale: 2.5, pose: { stance: 'stand' } },
    // The house close-up (1254 px, head tipped 20°). There is no house-style reference for WeiWei yet.
    closeup: { w: 1254, h: 1254, x: 450, y: 835, scale: 5.5, rotate: 20 },
  },
});
