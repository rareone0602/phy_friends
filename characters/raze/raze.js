// Character spec for Raze, a dark-teal dragon with one cyan horn, big pointed ears tipped in teal and purple, a cyan
// fringe swept over his left eye, one eye cyan and the other lavender, teal and purple markings and a slim tail
// ending in a teal tuft. He wears his short-sleeved teal hoodie, as in IMG_2575.jpg: its hood lies around his neck,
// under white headphones, two gray drawstrings hang from it, and its front blouses over a gray hem.
// Pictures: examples/IMG_2574.jpg (his reference sheet, front and back, the color standard) and IMG_2575.jpg (the
// same sheet, dressed in a short-sleeved hoodie with headphones round his neck).
// Colors are taken from the color bar on the sheet; those it does not show are taken from the drawing.
// His owner chose this version, in his hoodie, over the plain sheet (backup/no-hoodie.js).
PhyFriends.define('raze', {
  palette: {
    bg: '#1c1d21',
    fur: '#174052',        // The dark teal of the color bar. Its house shade (furShade, L* 15) fills the legs, below the hoodie; it is about as dark as Fruit's (L* 17), so it still reads as fur rather than black. Both sheets draw the fur flat, so there is no lighter tint of it to take instead.
    head: 'fur',
    hair: '#42c8ee',       // The cyan of the color bar: the fringe, the horn, the streaks in the tuft and his right eye.
    ear: 'fur',
    earInner: 'teal',
    iris: 'hair',
    irisRight: '#a87cf7',  // The lavender of the color bar: his left eye.
    ink: '#0b1f29',        // A teal near-black, for the mouth. It is faint on the dark teal (1.5:1), but a lighter mouth (the teal, 2.4:1) reads as a marking rather than an opening.
    blush: '#d88fb4',      // The sheet draws no blush; this dusky pink is chosen to read on the dark teal.
    tongue: 'hair',
    body: 'furShade',
    tail: 'fur',
    arm: 'fur',
    paw: 'fur',
    leg: 'furShade',
    foot: 'fur',
    teal: '#11809e',       // The teal of the color bar: the inside and tip of his right ear, the locks at the root of the fringe, the marks on his right side and the tail's tuft.
    purple: '#745cd4',     // The purple of the color bar: the tip of his left ear and the marks on his left side.
    hoodie: '#0e516b',     // The teal of the hoodie in IMG_2575.jpg, a step lighter than his fur: its front and hood. Its house shade (hoodieShade) fills the inside of the hood, which lies behind its rim, and the short sleeves, so that they show against the front.
    string: '#536a72',     // The gray of the drawstrings, also used for the hem, whose gray is the same.
    phones: '#efeef3',     // The white of the headphones, deepened to mumuyou's depth to stay visible on paper.
  },
  // The head is a round dome whose sides are cut into spiky tufts under the ears, and whose crown is spiky too.
  head: {
    cx: 0, cy: -22, rx: 90, ry: 68,
    fluff: [{ from: -34, to: -4, n: 2, len: 10, lean: 4, depth: 0.05, b1: -30, b2: 10, jit: 0, sym: true },
      { from: 236, to: 304, n: 3, len: 9, lean: 4, depth: 0.04, b1: -25, b2: 8, jit: 0 }],
  },
  // The face is the head's own dark teal, as on the sheet, with no muzzle of another color, so there is no face; the
  // marks under and beside his eyes lie on its layer all the same (extras on 'face').
  face: false,
  // The ears are big, pointed and upright, tipped out a little. Each tip is a band in the color of its side, cut
  // on a slant as on the sheet: teal on his right ear (the viewer's left), purple on his left. The front view also
  // draws the inside of his right ear teal, up to the tip, with a dark margin along its outer edge; the inner ear is
  // large and set high, so that it runs into the tip with no dark band between them. The inside of his left ear is
  // dark, so it has no inner ear, and its black earring is line work at gallery size, so it is left out.
  ears: {
    base: [-58, -66], angle: 26, width: 92, length: 104, lean: 10, tip: 8, b1: -14, b2: -8,
    inner: { scale: 0.72, dx: 4, dy: -14 },
    stripes: [{ t: 0.84, w: 56, a: -18, color: 'teal' }],
    right: { inner: null, stripes: [{ t: 0.84, w: 56, a: 18, color: 'purple' }] },
  },
  // The fringe is a cyan lock swept from his right toward his left, as on the sheet: rooted at the crown beside the
  // horn, it comes down between the eyes to the inner corner of his left eye (where the sheet lets it cover half that
  // eye), with a shorter lock over his right brow and one toward his left ear. The crown stays dark: its spikes are
  // the head's. Each tip is [x, y, bendIn, bendOut, following valley].
  hair: {
    cx: 4, cy: -52, rx: 40, ry: 28,
    tips: [
      [-40, -78, -4, -4, [-14, -86]],
      [14, -88, -6, 10, [40, -60]],
      [54, -24, 18, -14, [36, -30]],
      [24, 8, 20, -16, [4, -32]],
      [-14, -16, 18, -14, [-26, -38]],
      [-46, -34, 16, -10, [-50, -58]],
    ],
  },
  // The eyes are plain tall pills, one of each of his colors, as on the sheet: his right eye (the viewer's left)
  // cyan and his left lavender. The sheet's irises are a deeper teal and purple inside a cyan and a lavender rim; on
  // the dark teal those deeper colors are faint (about 2.3:1), so each eye takes its lighter tint instead (5.7:1 and
  // 3.6:1). The whites, pupils and highlights are left out. Setting arc: 1 draws the happy, closed and squint strokes
  // at the full eye width.
  eyes: { x: 34, y: 4, w: 13, h: 33, stroke: 4.8, arc: 1 },
  // The blush sits under the outer corner of each eye, beyond the cheek marks, tipped up to follow the cheek.
  blush: { x: 61, y: 30, rx: 9.5, ry: 6, tilt: 10 },
  // There is no mouth by default (the sheet's grin is omitted); when open, it shows the cyan tongue and the fang of
  // the sheet.
  mouth: { y: 22, size: 3.8, fang: true },
  // The body is small under the large head, and an onigiri (a rice ball): narrow under the chin, broad and round at
  // the base. It wears the hoodie down to the hips, so only the small hip tufts show; below the hoodie's hem it is his
  // legs, in the house shade of his fur. The hoodie's pocket is only line work on the sheet, so it is left out.
  body: {
    cx: 0, cy: 85, rx: 64, ry: 46, onigiri: 1,
    fluff: [{ from: 8, to: 40, n: 2, len: 6, lean: 6, depth: 0.08, b1: -25, b2: 5, jit: 0, sym: true }],
  },
  // The tail is a slim dragon's tail rising behind his right hip (the viewer's left), as on the sheet, its tip curling
  // in; its outer part is the teal tuft, cut into flame-shaped tufts that reach back toward the base. It is shorter
  // than the sheet's, so that it reaches no further past his box than the other fwiends' tails (56 head units).
  tail: {
    base: [-56, 106], angle: 56, length: 108, width: 70, bend: -72, taper: 0.6, root: 0.95,
    fluff: [{ from: 300, to: 350, n: 2, len: 12, lean: 6, depth: 0.05, b1: -30, b2: 5, jit: 0 },
      { from: 255, to: 290, n: 1, len: 14, lean: -10, b1: 25, b2: -25, jit: 0 },
      { from: 200, to: 240, n: 2, len: 10, lean: 6, b1: -25, b2: 5, jit: 0 }],
    tip: { at: 0.56, color: 'teal', fluff: [{ from: 50, to: 130, n: 3, len: 20, depth: 0.02, b1: 18, b2: 12, jit: 0.2 }] },
  },
  // The limbs, on the house template. Seated, his forepaws rest on the ground between his hind feet, which are turned
  // out slightly; the claws are too small to keep. Standing, as on the sheets, the short sleeves of IMG_2575.jpg are
  // bands on the upper arms that stand proud of them, in the hoodie's house shade so that they show against its front,
  // which is in its own color; the forearms, paws, legs and feet are his fur, the legs in its house shade. Seated, the
  // arms start low on the body (forelegs), so that the drawstrings hang clear of them.
  stand: {
    fit: { forelegs: 0.4 },
    seat: { paw: { cx: 16, cy: 121, rx: 12.5, ry: 10 }, foot: { cx: 48, cy: 121, rx: 19, ry: 10, rot: -8 } },
    arms: { bands: [{ from: 0, to: 0.46, color: 'hoodieShade', grow: 2.5 }] },
  },
  extras: [
    // Cheek fluff under the head: a ruff whose spiky tufts reach past the cheeks, as on the sheet. An n: 1 range with
    // len < 0 tucks the bottom in under the chin, a little less than for Fruit, so that no paper shows between the
    // chin and the shoulders.
    { feature: 'cheekRuff', on: 'base', under: true, fill: 'fur', cx: 0, cy: 13, rx: 90, ry: 48,
      fluff: [{ from: -42, to: 21, n: 3, len: 15, lean: -2, depth: 0.1, b1: -35, b2: 12, jit: 0, sym: true },
        { from: 45, to: 135, n: 1, len: -12, b1: 5, b2: 5, jit: 0 }] },
    // The one horn, on his right (the viewer's left), as both views of the sheet draw it: a cyan cone rising in front
    // of the ear, its tip leaning in. It is drawn on the head, under the fringe, so that it stays put while the hair
    // sways.
    { feature: 'horns', on: 'base', fill: 'hair', round: 0.12, nodes: [[-36, -76, 1, 12], [-50, -140, 1, 8], [-68, -72, 1, 0]] },
    // The teal locks of the fringe, as on the sheet: one at its root, beside the horn, which parts the cyan horn from
    // the cyan fringe (in one color, the two read as one shape), and a streak in the parting between the long lock
    // and the lock toward his left ear. Down the middle of the long lock, a streak would read as the midrib of a leaf.
    { feature: 'streaks', on: 'hair', clip: true, kind: 'ellipse', fill: 'teal', cx: -44, cy: -62, rx: 14, ry: 34, rot: 24 },
    { feature: 'streaks', on: 'hair', clip: true, kind: 'ellipse', fill: 'teal', cx: 28, cy: -50, rx: 4.5, ry: 26, rot: -30 },
    // The marks under his right eye: a slanted bar and a small triangle, in teal.
    { feature: 'cheekMarks', on: 'face', fill: 'teal', round: 0.2, nodes: [[-38, 26, 1], [-32, 26, 1], [-38, 42, 1], [-44, 42, 1]] },
    { feature: 'cheekMarks', on: 'face', fill: 'teal', round: 0.2, nodes: [[-25, 27, 1], [-18, 41, 1], [-32, 41, 1]] },
    // The mark beside his left eye: a purple bar running down the outer cheek.
    { feature: 'cheekMarks', on: 'face', fill: 'purple', round: 0.3, nodes: [[42, 25, 1], [48, 25, 1], [52, 44, 1], [46, 44, 1]] },
    // Tail extras are drawn on the straight tail (base on the origin, tip at y -108, +x away from the body); the
    // library bends them onto the curve. Two purple bands before the tuft, as on the sheet, and the cyan streaks in it.
    { feature: 'tailMarks', on: 'tail', clip: true, kind: 'ellipse', fill: 'purple', cx: 0, cy: -49, rx: 60, ry: 3.2 },
    { feature: 'tailMarks', on: 'tail', clip: true, kind: 'ellipse', fill: 'purple', cx: 0, cy: -57, rx: 60, ry: 3.2 },
    { feature: 'tailTip', on: 'tail', clip: true, kind: 'ellipse', fill: 'hair', cx: -8, cy: -86, rx: 4, ry: 16, rot: 8 },
    { feature: 'tailTip', on: 'tail', clip: true, kind: 'ellipse', fill: 'hair', cx: 11, cy: -77, rx: 3.5, ry: 12, rot: -6 },
    // The gray hem of the hoodie, a band round the hips that stands a few units proud of the body at each side; its
    // top lies under the front.
    { feature: 'hem', on: 'body', fill: 'string', nodes: [[-40.5, 90, 1], [40.5, 90, 1], [46, 100], [46, 106], [29, 108.5], [0, 109.5],
      [-29, 108.5], [-46, 106], [-46, 100]] },
    // The front of the hoodie, in its own color. It blouses over the hem: its sides fall a little past the body,
    // following it as it narrows toward the neck, so that the sleeves leave the hoodie at its sides, and its lower edge
    // overhangs the hem, which shows as a band of cloth under a lip. Its top lies under the head.
    { feature: 'hoodie', on: 'body', fill: 'hoodie', nodes: [[-18, 36, 1], [18, 36, 1], [18.5, 58], [28, 70], [37.5, 82], [44, 92], [45.5, 98],
      [32, 101.5], [0, 103], [-32, 101.5], [-45.5, 98], [-44, 92], [-37.5, 82], [-28, 70], [-18.5, 58]] },
    // The two gray drawstrings, coming out of the hood's edge on either side of the point and hanging apart, over the
    // lip of the front, as long as the sheet draws them.
    { feature: 'drawstrings', on: 'body', fill: 'string', round: 0.5, nodes: [[-11.5, 78, 1], [-7.5, 78, 1], [-11, 104, 1], [-15, 104, 1]] },
    { feature: 'drawstrings', on: 'body', fill: 'string', round: 0.5, nodes: [[7.5, 78, 1], [11.5, 78, 1], [15, 104, 1], [11, 104, 1]] },
    // The inside of the hood, in its house shade: it lies behind the rim, which is the same teal, and shows where the
    // rim's two sides part under the chin. The hood and the headphones on it are clothing, so they lie under the arms,
    // which show over them.
    { feature: 'hood', on: 'body', fill: 'hoodieShade', nodes: [[-7.5, 44, 1], [7.5, 44, 1], [0, 82, 1]] },
    // The rim of the hood, lying bunched around the neck as a thick roll, one side from each shoulder down to a point
    // under the chin; his left side (the viewer's right) lies over the other. Its ends rest on the narrow shoulders and
    // stand out past them, so that the roll reads as cloth lying on the hoodie rather than printed on it.
    { feature: 'hood', on: 'body', fill: 'hoodie', nodes: [[-9, 50, 1, -8], [1, 78, 1], [1, 86, 1], [-14, 79], [-24, 71], [-24.5, 63], [-17.5, 53],
      [-9.5, 45], [-4, 40, 1]] },
    { feature: 'hood', on: 'body', fill: 'hoodie', nodes: [[9, 50, 1], [4, 40, 1], [9.5, 45], [17.5, 53], [24.5, 63], [24, 71], [14, 79],
      [0, 86, 1], [0, 80, 1, -8]] },
    // The headphones round his neck, over the hood, as on the sheet: the cup on his right (the viewer's left) faces
    // forward, a white ring round its pad, which is in the hoodie's teal. The cup on his left is turned away, and the
    // sheet draws its face in the hoodie's teal, so only a thin crescent of its white rim shows on its outer side; a
    // second white cup would read as a second pair of eyes. The tops of the cups lie under the chin, so that they hang
    // from the neck rather than sit on the chest, and the band behind the neck is hidden by the head.
    { feature: 'headphones', on: 'body', kind: 'ellipse', fill: 'phones', cx: -14, cy: 58, rx: 11.5, ry: 11.5 },
    { feature: 'headphones', on: 'body', kind: 'ellipse', fill: 'hoodie', cx: -14, cy: 58, rx: 5, ry: 5 },
    { feature: 'headphones', on: 'body', kind: 'ellipse', fill: 'phones', cx: 15, cy: 57, rx: 8.5, ry: 10.5, rot: -12 },
    { feature: 'headphones', on: 'body', kind: 'ellipse', fill: 'hoodie', cx: 13.5, cy: 57, rx: 8.5, ry: 10.5, rot: -12 },
  ],
  // The paws reach y ~131, so squash and stretch pivot about that height.
  rig: { ground: 131 },
  views: {
    // The house close-up (1254 px, head tipped 20°). There is no house-style reference for Raze yet.
    closeup: { w: 1254, h: 1254, x: 450, y: 835, scale: 5.5, rotate: 20 },
  },
});
