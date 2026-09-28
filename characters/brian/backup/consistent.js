// A candidate that lost to the "faithful" variant (reviewed as characters/brian/brian.js). Kept per STYLE.md, principle 1.
// Character spec for Brian, a cream fox in an orange newsboy cap and a green bandana, with rust ear
// backs and brown boots.
// Pictures: examples/sheet.png.
// Colors are taken from the color circles on examples/sheet.png. Brian's eyes are drawn as the house's
// plain pills, as their owner has not asked otherwise, so the sheet's eye colors are left out. So are
// its thin yellow-orange rim along the ears, the brownish shadow under the bandana and the darker cuffs
// of the boots, which are light and shade rather than colors of their own.
PhyFriends.define('brian', {
  palette: {
    bg: '#1c1d21',
    fur: '#fddcac',        // The cream of the sheet (#ffe5b8), deepened slightly to hold its weight on paper. Its house shade (furShade) fills the body, which sits under the head.
    face: '#faecd4',       // The pale cream of the muzzle, cheeks, chest, forepaws and tail end, deepened slightly to stay visible on paper.
    earBack: '#c95f13',    // The dark orange of the ear backs, which shows around the cream front of each ear.
    cap: '#f6760a',        // The orange of the newsboy cap.
    capBand: '#f96b8b',    // The thin pink band around the cap.
    scarf: '#6fa68a',      // The green bandana. Its house shade (scarfShade) fills the band behind its point.
    spot: '#d8a977',       // The tan of the two dots on the forehead.
    boot: '#8b6d4c',       // The brown of the boots on the hind feet.
    eye: '#2b2220',        // A near-black, faintly warm.
    blush: '#fbbcb2',      // A soft pink, lighter than the cap band.
  },
  // The head is a round dome with a soft tuft down each side, under the ears.
  head: {
    cx: 0, cy: -22, rx: 90, ry: 68,
    fluff: [{ from: -26, to: -2, n: 1, len: 9, lean: 4, depth: 0, b1: -30, b2: 10, jit: 0, sym: true }],
  },
  // The pale muzzle and plump cheeks are edged with small shingles; the fur ruff behind them (an extra)
  // makes the long cheek tufts. Setting len < 0 flattens the top, under the eyes.
  face: {
    cx: 0, cy: 16, rx: 80, ry: 37,
    fluff: [
      { from: -40, to: 20, n: 3, len: 4, lean: 3, depth: 0.1, b1: -18, b2: 5, jit: 0, sym: true },
      { from: 235, to: 305, n: 1, len: -4, b1: 0, b2: 0, jit: 0 },
    ],
  },
  // The ears are large, pointed fox ears, tipped outward. Their front is cream, and the rust back
  // shows around it as a broad margin, widest at the tip. The cap covers the base of each ear, so the
  // pale tufts that grow there on the sheet are left out.
  ears: {
    base: [-56, -68], angle: 34, width: 86, length: 86, lean: 8, tip: 5, b1: -14, b2: -8, color: 'earBack',
    inner: { scale: 0.58, dx: 3, dy: -12, color: 'fur' },
  },
  // The cap takes the place of a mop of hair: a puffy newsboy crown sitting on top of the head between
  // the ears, its lower edge following the dome of the head. It is tipped 6° down toward Brian's right
  // (the viewer's left), as the other artists draw it.
  hair: {
    cx: 0, cy: -92, color: 'cap',
    nodes: [[-55, -60, 1, 0], [-72, -82], [-54, -109], [-3, -123], [49, -120], [72, -98], [60, -72, 1, -16]],
  },
  // The eyes are plain tall pills, set wide and low. Setting arc: 1 draws the happy, closed and
  // squint strokes at the full eye width.
  eyes: { x: 34, y: 3, w: 13, h: 33, stroke: 4.5, arc: 1 },
  // The blush sits on the pale cheeks under the outer corner of each eye, tipped up to follow the cheek. It
  // sits low enough that an eye looking down and outward does not land on it.
  blush: { x: 54, y: 27.5, rx: 11, ry: 6.5, tilt: 10 },
  // There is no mouth by default (the nose and small mouth on the sheet are omitted); when open, it
  // shows one fang.
  mouth: { y: 21, size: 3.8, fang: true, tongue: 'blush' },
  // The body is seated and round. It sits under the head, so it takes the house shade. Shoulder tufts
  // sit under the cheeks, and small hip tufts below them.
  body: {
    cx: 0, cy: 82, rx: 70, ry: 50, color: 'furShade',
    fluff: [{ from: -65, to: -25, n: 2, len: 14, depth: 0, b1: 0, b2: -25, jit: 0, sym: true },
      { from: 20, to: 60, n: 2, len: 7, lean: 6, depth: 0.08, b1: -25, b2: 5, jit: 0, sym: true }],
  },
  // The tail is a large bushy cream plume rising behind the right hip, its tip curling in. Its pale end
  // is cut into flame-shaped tufts.
  tail: {
    base: [56, 106], angle: 52, length: 138, width: 96, bend: -70, taper: 0.72, root: 0.5, color: 'fur',
    fluff: [{ from: 300, to: 350, n: 2, len: 10, lean: 6, depth: 0.05, b1: -30, b2: 5, jit: 0 },
      { from: 255, to: 290, n: 1, len: 18, lean: -10, b1: 25, b2: -25, jit: 0 },
      { from: 200, to: 240, n: 1, len: 8, lean: 6, b1: -25, b2: 5, jit: 0 }],
    tip: { at: 0.68, color: 'face', fluff: [{ from: 50, to: 130, n: 3, len: 16, depth: 0.02, b1: 18, b2: 12, jit: 0.2 }] },
  },
  extras: [
    // Cheek fluff under the head: a fur ruff whose tufts sit behind the pale ones and reach past them,
    // so that the pale points read against fur instead of vanishing into the paper.
    { on: 'base', under: true, fill: 'fur', cx: 0, cy: 14, rx: 90, ry: 48,
      fluff: [{ from: -42, to: 21, n: 3, len: 16, lean: -3, depth: 0.1, b1: -33, b2: 10, jit: 0, sym: true },
        { from: 45, to: 135, n: 1, len: -14, b1: 5, b2: 5, jit: 0 }] },
    // The two tan dots on the forehead, above the inner corners of the eyes.
    { on: 'face', kind: 'ellipse', fill: 'spot', cx: -24, cy: -33, rx: 9, ry: 6 },
    { on: 'face', kind: 'ellipse', fill: 'spot', cx: 24, cy: -33, rx: 9, ry: 6 },
    // The pink band around the cap, just above its lower edge, and the button on its crown.
    { on: 'hair', clip: true, fill: 'capBand', nodes: [[-79, -72, 1, 11.5], [81, -88, 1, 0], [81, -82, 1, -11.5], [-78, -66, 1, 0]] },
    { on: 'hair', kind: 'ellipse', fill: 'cap', cx: -3, cy: -123, rx: 8, ry: 5.5, rot: -6 },
    // The pale chest and belly: a round bib under the bandana, its sides cut into tufts, ending above the forepaws.
    { on: 'body', clip: true, fill: 'face', cx: 0, cy: 80, rx: 46, ry: 30,
      fluff: [{ from: -40, to: 60, n: 3, len: 6, lean: 5, depth: 0.1, b1: -25, b2: 5, jit: 0, sym: true }] },
    // The bandana, tied behind the neck: the band around the neck (in the house shade, because it lies
    // behind the point) and the large point hanging on the chest.
    { on: 'body', fill: 'scarfShade', nodes: [[-54, 40, 1, 0], [54, 40, 1, 0], [52, 56, 1, -10], [-52, 56, 1, 0]], round: 0.3 },
    { on: 'body', fill: 'scarf', nodes: [[-54, 48, 1, 6], [54, 48, 1, 6], [0, 104, 1, 6]], round: 0.2 },
    // The hind feet in brown boots, turned out slightly.
    { on: 'body', kind: 'ellipse', fill: 'boot', cx: -46, cy: 117.5, rx: 21, ry: 13.5, rot: -10 },
    { on: 'body', kind: 'ellipse', fill: 'boot', cx: 46, cy: 117.5, rx: 21, ry: 13.5, rot: 10 },
    // Pale forepaws on the ground, between the boots.
    { on: 'body', kind: 'ellipse', fill: 'face', cx: -17, cy: 121, rx: 13, ry: 10 },
    { on: 'body', kind: 'ellipse', fill: 'face', cx: 17, cy: 121, rx: 13, ry: 10 },
  ],
  // The paws reach y ~131, so squash and stretch pivot about that height.
  rig: { ground: 131 },
  views: {
    // The house close-up (1254 px, head tipped 20°). There is no house-style reference for Brian yet.
    closeup: { w: 1254, h: 1254, x: 450, y: 835, scale: 5.5, rotate: 20 },
  },
});
