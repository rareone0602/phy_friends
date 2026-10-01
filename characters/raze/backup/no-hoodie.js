// An alternative to characters/raze/raze.js: Raze as his plain sheet (IMG_2574.jpg) draws him, without the hoodie
// and headphones of IMG_2575.jpg, so that the diamonds and the chevron on his body show. His owner chose the hoodie.
// Kept per STYLE.md, principle 1.
// Character spec for Raze, a dark-teal dragon with one cyan horn, big pointed ears tipped in teal and purple, a cyan
// fringe swept over his left eye, one eye cyan and the other lavender, teal and purple markings and a slim tail
// ending in a teal tuft.
// Pictures: examples/IMG_2574.jpg (his reference sheet, front and back, the color standard) and IMG_2575.jpg (the
// same sheet, dressed in a short-sleeved hoodie with headphones round his neck).
// Colors are taken from the color bar on the sheet; those it does not show are taken from the drawing.
PhyFriends.define('raze', {
  palette: {
    bg: '#1c1d21',
    fur: '#174052',        // The dark teal of the color bar. Its house shade (furShade, L* 15) fills the body, which sits under the head; it is about as dark as Fruit's (L* 17), so it still reads as fur rather than black. Both sheets draw the fur flat, so there is no lighter tint of it to take instead.
    teal: '#11809e',       // The teal of the color bar: the inside and tip of his right ear, the locks at the root of the fringe, the marks on his right side and the tail's tuft.
    hair: '#42c8ee',       // The cyan of the color bar: the fringe, the horn, the streaks in the tuft and his right eye.
    purple: '#745cd4',     // The purple of the color bar: the tip of his left ear and the marks on his left side.
    lavender: '#a87cf7',   // The lavender of the color bar: his left eye.
    eye: '#0b1f29',        // A teal near-black, for the mouth. It is faint on the dark teal (1.5:1), but a lighter mouth (the teal, 2.4:1) reads as a marking rather than an opening.
    blush: '#d88fb4',      // The sheet draws no blush; this dusky pink is chosen to read on the dark teal.
  },
  // The head is a round dome whose sides are cut into spiky tufts under the ears, and whose crown is spiky too.
  head: {
    cx: 0, cy: -22, rx: 90, ry: 68,
    fluff: [{ from: -34, to: -4, n: 2, len: 10, lean: 4, depth: 0.05, b1: -30, b2: 10, jit: 0, sym: true },
      { from: 236, to: 304, n: 3, len: 9, lean: 4, depth: 0.04, b1: -25, b2: 8, jit: 0 }],
  },
  // The ears are big, pointed and upright, tipped out a little. Each tip is a band in the color of its side, cut
  // on a slant as on the sheet: teal on his right ear (the viewer's left), purple on his left. The front view also
  // draws the inside of his right ear teal, up to the tip, with a dark margin along its outer edge; the inner ear is
  // large and set high, so that it runs into the tip with no dark band between them. The inside of his left ear is
  // dark, so it has no inner ear, and its black earring is line work at gallery size, so it is left out.
  ears: {
    base: [-58, -66], angle: 26, width: 92, length: 104, lean: 10, tip: 8, b1: -14, b2: -8,
    inner: { scale: 0.72, dx: 4, dy: -14, color: 'teal' },
    stripes: [{ t: 0.84, w: 56, a: -18, color: 'teal' }],
    right: { inner: null, stripes: [{ t: 0.84, w: 56, a: 18, color: 'purple' }] },
  },
  // The fringe is a cyan lock swept from his right toward his left, as on the sheet: rooted at the crown beside the
  // horn, it comes down between the eyes to the inner corner of his left eye (where the sheet lets it cover half that
  // eye), with a shorter lock over his right brow and one toward his left ear. The crown stays dark: its spikes are
  // the head's. Each tip is [x, y, bendIn, bendOut, following valley].
  hair: {
    cx: 4, cy: -52, rx: 40, ry: 28, color: 'hair',
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
  eyes: { x: 34, y: 4, w: 13, h: 33, stroke: 4.8, arc: 1, color: 'hair', right: { color: 'lavender' } },
  // The blush sits under the outer corner of each eye, beyond the cheek marks, tipped up to follow the cheek.
  blush: { x: 61, y: 30, rx: 9.5, ry: 6, tilt: 10 },
  // There is no mouth by default (the sheet's grin is omitted); when open, it shows the cyan tongue and the fang of
  // the sheet.
  mouth: { y: 22, size: 3.8, fang: true, tongue: 'hair' },
  // The body is small, round and seated, in the house shade. Shoulder tufts sit under the cheeks, and small hip
  // tufts below them. It is Brian's and Howdi's size, since a smaller body leaves a sliver of paper between the
  // chin and the shoulders, which the dark fur shows plainly.
  body: {
    cx: 0, cy: 82, rx: 68, ry: 50, color: 'furShade',
    fluff: [{ from: -65, to: -25, n: 2, len: 14, depth: 0, b1: 0, b2: -25, jit: 0, sym: true },
      { from: 20, to: 60, n: 2, len: 7, lean: 6, depth: 0.08, b1: -25, b2: 5, jit: 0, sym: true }],
  },
  // The tail is a slim dragon's tail rising behind his right hip (the viewer's left), as on the sheet, its tip curling
  // in; its outer part is the teal tuft, cut into flame-shaped tufts that reach back toward the base. It is shorter
  // than the sheet's, so that it reaches no further past his box than the other fwiends' tails (56 head units).
  tail: {
    base: [-56, 106], angle: 56, length: 108, width: 70, bend: -72, taper: 0.6, root: 0.95, color: 'fur',
    fluff: [{ from: 300, to: 350, n: 2, len: 12, lean: 6, depth: 0.05, b1: -30, b2: 5, jit: 0 },
      { from: 255, to: 290, n: 1, len: 14, lean: -10, b1: 25, b2: -25, jit: 0 },
      { from: 200, to: 240, n: 2, len: 10, lean: 6, b1: -25, b2: 5, jit: 0 }],
    tip: { at: 0.56, color: 'teal', fluff: [{ from: 50, to: 130, n: 3, len: 20, depth: 0.02, b1: 18, b2: 12, jit: 0.2 }] },
  },
  extras: [
    // Cheek fluff under the head: a ruff whose spiky tufts reach past the cheeks, as on the sheet. An n: 1 range with
    // len < 0 tucks the bottom in under the chin, a little less than for Fruit, so that no paper shows between the
    // chin and the shoulders.
    { on: 'base', under: true, fill: 'fur', cx: 0, cy: 13, rx: 90, ry: 48,
      fluff: [{ from: -42, to: 21, n: 3, len: 15, lean: -2, depth: 0.1, b1: -35, b2: 12, jit: 0, sym: true },
        { from: 45, to: 135, n: 1, len: -12, b1: 5, b2: 5, jit: 0 }] },
    // The one horn, on his right (the viewer's left), as both views of the sheet draw it: a cyan cone rising in front
    // of the ear, its tip leaning in. It is drawn on the head, under the fringe, so that it stays put while the hair
    // sways.
    { on: 'base', fill: 'hair', round: 0.12, nodes: [[-36, -76, 1, 12], [-50, -140, 1, 8], [-68, -72, 1, 0]] },
    // The teal locks of the fringe, as on the sheet: one at its root, beside the horn, which parts the cyan horn from
    // the cyan fringe (in one color, the two read as one shape), and a streak in the parting between the long lock
    // and the lock toward his left ear. Down the middle of the long lock, a streak would read as the midrib of a leaf.
    { on: 'hair', clip: true, kind: 'ellipse', fill: 'teal', cx: -44, cy: -62, rx: 14, ry: 34, rot: 24 },
    { on: 'hair', clip: true, kind: 'ellipse', fill: 'teal', cx: 28, cy: -50, rx: 4.5, ry: 26, rot: -30 },
    // The marks under his right eye: a slanted bar and a small triangle, in teal.
    { on: 'face', fill: 'teal', round: 0.2, nodes: [[-38, 26, 1], [-32, 26, 1], [-38, 42, 1], [-44, 42, 1]] },
    { on: 'face', fill: 'teal', round: 0.2, nodes: [[-25, 27, 1], [-18, 41, 1], [-32, 41, 1]] },
    // The mark beside his left eye: a purple bar running down the outer cheek.
    { on: 'face', fill: 'purple', round: 0.3, nodes: [[42, 25, 1], [48, 25, 1], [52, 44, 1], [46, 44, 1]] },
    // Tail extras are drawn on the straight tail (base on the origin, tip at y -108, +x away from the body); the
    // library bends them onto the curve. Two purple bands before the tuft, as on the sheet, and the cyan streaks in it.
    { on: 'tail', clip: true, kind: 'ellipse', fill: 'purple', cx: 0, cy: -49, rx: 60, ry: 3.2 },
    { on: 'tail', clip: true, kind: 'ellipse', fill: 'purple', cx: 0, cy: -57, rx: 60, ry: 3.2 },
    { on: 'tail', clip: true, kind: 'ellipse', fill: 'hair', cx: -8, cy: -86, rx: 4, ry: 16, rot: 8 },
    { on: 'tail', clip: true, kind: 'ellipse', fill: 'hair', cx: 11, cy: -77, rx: 3.5, ry: 12, rot: -6 },
    // The diamond on his belly, as on the sheet: an outline, teal on his right side (the viewer's left) and purple on
    // his left, round a diamond of the shaded body.
    { on: 'body', fill: 'teal', nodes: [[0, 72, 1], [0, 106, 1], [-14, 89, 1]] },
    { on: 'body', fill: 'purple', nodes: [[0, 72, 1], [14, 89, 1], [0, 106, 1]] },
    { on: 'body', fill: 'furShade', nodes: [[0, 80, 1], [7, 89, 1], [0, 98, 1], [-7, 89, 1]] },
    // The teal diamond on his right thigh, and on his left the purple chevron, with the purple patch on its outer side.
    // The patch reaches in far enough to read as a patch: as a thin crescent along the body's edge, it would read as
    // a rim of light. The sheet frames the diamond in teal brackets and puts a teal triangle on his right flank and
    // two bars on his chest; at gallery size they crowd the diamonds, and the chest lies under the cheek fluff, so
    // they are left out.
    { on: 'body', fill: 'teal', polys: [[-46, 97, 13, 4, 90, 0.62]] },
    { on: 'body', fill: 'purple', round: 0.2, nodes: [[46, 84, 1], [52, 86, 1], [42, 98, 1], [52, 110, 1], [46, 112, 1], [35, 98, 1]] },
    { on: 'body', clip: true, fill: 'purple', nodes: [[74, 72, 1, 30], [53, 99, 1, -30], [74, 116, 1, 0]] },
    // The hind feet, turned out slightly.
    { on: 'body', kind: 'ellipse', fill: 'fur', cx: -48, cy: 121, rx: 19, ry: 10, rot: -8 },
    { on: 'body', kind: 'ellipse', fill: 'fur', cx: 48, cy: 121, rx: 19, ry: 10, rot: 8 },
    // The forepaws on the ground between them. As with every friend, the arms are not drawn, and the claws are too
    // small to keep.
    { on: 'body', kind: 'ellipse', fill: 'fur', cx: -16, cy: 121, rx: 12.5, ry: 10 },
    { on: 'body', kind: 'ellipse', fill: 'fur', cx: 16, cy: 121, rx: 12.5, ry: 10 },
  ],
  // The paws reach y ~131, so squash and stretch pivot about that height.
  rig: { ground: 131 },
  views: {
    // The house close-up (1254 px, head tipped 20°). There is no house-style reference for Raze yet.
    closeup: { w: 1254, h: 1254, x: 450, y: 835, scale: 5.5, rotate: 20 },
  },
});
