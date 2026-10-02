// Character spec for Brian, a cream fox in an orange newsboy cap and a green bandana, with dark orange
// ear backs, two tan dots on the forehead and brown boots.
// Pictures: examples/sheet.png, and two small drawings that show him standing, BRAIN REN ADMIRE.png and
// smol_BRIAN_REN_hat.png.
// Colors are taken from the color circles on examples/sheet.png; the pink of the cap band, which the
// circles do not show, is taken from the front view beside them.
PhyFriends.define('brian', {
  palette: {
    bg: '#1c1d21',
    fur: '#ffe5b8',        // The cream of the sheet. Its house shade (furShade) fills the body, which sits under the head.
    head: 'fur',
    face: '#fceed6',       // The sheet's pale cream (#fff8ea), deepened to show on paper but kept paler than the fur.
    hair: 'cap',
    ear: '#c95f13',        // The dark orange of the backs of the ears.
    iris: '#d78844',       // His right eye is brown-orange.
    irisRight: '#57bbde',  // His left eye is blue.
    ink: '#2b211c',        // Near-black, faintly warm, used for the mouth.
    blush: '#f9bba9',      // The sheet draws no blush; this soft peach pink is chosen to read on the pale cream.
    tongue: 'band',
    body: 'furShade',
    tail: 'fur',
    arm: 'fur',
    paw: 'face',
    leg: 'furShade',
    foot: 'boot',
    cap: '#f6760a',        // The orange cap. Its house shade (capShade) fills the peak, under the front of the crown.
    band: '#f96b8b',       // The thin pink band around the cap, also used for the tongue.
    scarf: '#6fa68a',      // The green bandana. Its house shade (scarfShade) fills the band around the neck.
    dot: '#d8a977',        // The tan of the forehead dots.
    boot: '#8b6d4c',       // The brown of the boots. Its house shade (bootShade) fills the cuffs behind the feet.
  },
  // The head is a round dome with a soft tuft down each side, under the ears.
  head: {
    cx: 0, cy: -22, rx: 90, ry: 68,
    fluff: [{ from: -26, to: -2, n: 1, len: 9, lean: 4, depth: 0, b1: -30, b2: 10, jit: 0, sym: true }],
  },
  // The pale muzzle and cheeks. On the sheet the pale stops halfway up the eyes; here it rises to their tops, so
  // that each pill eye sits on one color. Its sides are cut into shingles, and one tuft hangs from the chin over
  // the bandana.
  face: {
    cx: 0, cy: 14, rx: 80, ry: 38,
    fluff: [
      { from: -40, to: 20, n: 3, len: 5, lean: 3, depth: 0.1, b1: -18, b2: 5, jit: 0, sym: true },
      { from: 78, to: 102, n: 1, len: 9, depth: 0, b1: -10, b2: -10, jit: 0 },
      { from: 235, to: 305, n: 1, len: -4, b1: 0, b2: 0, jit: 0 }, // Setting len < 0 flattens the top.
    ],
  },
  // The ears are large pointed fox ears. Their backs are dark orange; the cream front (an extra) covers the
  // outer part of each ear, so the back shows along the inner edge, as on the sheet.
  ears: {
    base: [-58, -66], angle: 33, width: 90, length: 92, lean: 8, tip: 5, b1: -14, b2: -8,
  },
  // The cap takes the place of a mop of hair, so it sways about the middle of its foot. The crown is a low dome
  // whose foot (an n: 1 range with len < 0) sags gently across the head and is as wide as the head there, so that
  // it sits on the head rather than floating above it.
  hair: {
    cx: 0, cy: -62, rx: 74, ry: 52,
    fluff: [{ from: 0, to: 180, n: 1, len: -48, b1: -3, b2: -3, jit: 0 }],
  },
  // The eyes are plain tall pills, set wide and low, in his own colors as his owner asked: brown-orange on his right
  // (the viewer's left) and blue on his left, both from the sheet. Setting arc: 1 draws the happy, closed and
  // squint strokes at the full eye width.
  eyes: { x: 34, y: 3, w: 13, h: 32, stroke: 5.2, arc: 1 },
  // The blush sits on the pale cream under the outer corner of each eye, tipped up to follow the cheek. It
  // sits low enough that an eye looking down and outward does not land on it.
  blush: { x: 54, y: 27, rx: 11, ry: 6.5, tilt: 10 },
  // There is no mouth by default (the sheet's nose and small mouth are omitted); when open, it shows a pink tongue
  // and no fang.
  mouth: { y: 20, size: 3.8 },
  // The body is an onigiri (a rice ball): narrow under the chin, broad and round at the base. It sits under the
  // head, so it takes the house shade. Shoulder tufts sit under the cheeks, and small hip tufts below them.
  body: {
    cx: 0, cy: 82, rx: 68, ry: 50, onigiri: 1,
    fluff: [{ from: -65, to: -25, n: 2, len: 14, depth: 0, b1: 0, b2: -25, jit: 0, sym: true },
      { from: 8, to: 40, n: 2, len: 7, lean: 6, depth: 0.08, b1: -25, b2: 5, jit: 0, sym: true }],
  },
  // The tail is a large bushy plume rising behind his left hip (the viewer's right), its tip curling in. Its
  // pale end, more than half its length on the sheet, is cut into flame-shaped tufts that reach into the cream.
  tail: {
    base: [56, 106], angle: 50, length: 140, width: 98, bend: -70, taper: 0.7, root: 0.5,
    fluff: [{ from: 300, to: 350, n: 2, len: 10, lean: 6, depth: 0.05, b1: -30, b2: 5, jit: 0 },
      { from: 255, to: 290, n: 1, len: 18, lean: -10, b1: 25, b2: -25, jit: 0 },
      { from: 200, to: 240, n: 2, len: 9, lean: 6, b1: -25, b2: 5, jit: 0 }],
    tip: { at: 0.45, color: 'face', fluff: [{ from: 50, to: 130, n: 4, len: 18, depth: 0.02, b1: 18, b2: 12, jit: 0.2 }] },
  },
  // The limbs, on the house template. Seated, the pale forepaws rest on the ground between the hind feet,
  // whose boots show their soles, as on the sheet. Standing, as on the sheet and in the small drawings, the cream arms
  // turn pale down the forearm, in tufts, to the pale paws, and the short legs stand in the brown boots, whose shafts
  // show behind the feet and so take the boot's house shade.
  stand: {
    seat: { paw: { cx: 15, cy: 121, rx: 12.5, ry: 10 }, foot: { cx: 50, cy: 115, rx: 20, ry: 16 } },
    arms: { bands: [{ from: 0.55, to: 1, color: 'face', teeth: 3, depth: 3 }] },
    legs: { bands: [{ from: 0.3, to: 1, color: 'bootShade', grow: 1 }] },
  },
  extras: [
    // Cheek fluff under the head: a cream ruff whose tufts reach past the pale cheeks. An n: 1 range with
    // len < 0 tucks the bottom in under the chin.
    { feature: 'cheekRuff', on: 'base', under: true, fill: 'fur', cx: 0, cy: 13, rx: 90, ry: 48,
      fluff: [{ from: -42, to: 21, n: 3, len: 16, lean: -3, depth: 0.1, b1: -33, b2: 10, jit: 0, sym: true },
        { from: 45, to: 135, n: 1, len: -14, b1: 5, b2: 5, jit: 0 }] },
    // The two tan dots on the forehead, above the inner corners of the eyes.
    { feature: 'brows', on: 'face', kind: 'ellipse', fill: 'dot', cx: -25, cy: -32, rx: 8, ry: 5 },
    { feature: 'brows', on: 'face', kind: 'ellipse', fill: 'dot', cx: 25, cy: -32, rx: 8, ry: 5 },
    // Ear extras are in ear-local space (base on the origin, tip up, +x toward the top of the head); on: 'ears'
    // puts them on both. The cream front, cut off by a line from the tip to the middle of the base, and the pale
    // tufts rising from its base.
    { feature: 'earFront', on: 'ears', clip: true, fill: 'fur', nodes: [[-80, 30, 1], [-80, -130, 1], [2, -96, 1, -8], [-8, 0, 1], [-8, 30, 1]] },
    { feature: 'earTufts', on: 'ears', clip: true, fill: 'face', cx: -12, cy: 2, rx: 20, ry: 36,
      fluff: [{ from: 228, to: 312, n: 3, len: 12, depth: 0.05, b1: -5, b2: 5, jit: 0 }] },
    // The short peak juts out over the forehead from under the front of the crown, so it takes the house shade;
    // in the crown's color the two merge into one disc, which reads as a beret. Then the pink band around the foot
    // of the crown, and the button on top.
    { feature: 'cap', on: 'hair', under: true, fill: 'capShade', nodes: [[-66, -62, 1, 2], [66, -62, 1, -28]] },
    { feature: 'cap', on: 'hair', clip: true, fill: 'band', nodes: [[-80, -70, 1, 6], [80, -70, 1, 0], [80, -40, 1, 0], [-80, -40, 1, 0]] },
    { feature: 'cap', on: 'hair', kind: 'ellipse', fill: 'cap', cx: 0, cy: -115, rx: 7, ry: 5 },
    // The pale chest and belly: a bib under the bandana, its lower edge in soft tufts. It narrows toward the top as the
    // body does (onigiri: 0.5), so that the cream still shows at its sides.
    { feature: 'chest', on: 'body', clip: true, fill: 'face', cx: 0, cy: 76, rx: 31, ry: 25, onigiri: 0.5,
      fluff: [{ from: 30, to: 150, n: 4, len: 6, depth: 0.08, b1: -25, b2: 5, jit: 0 }] },
    // The bandana: the band around the neck (in the house shade, because it lies behind the point) and the point
    // hanging on the chest. The knot is at the back, as on the sheet. It lies over the tops of the arms, as a scarf
    // does (scarf).
    { feature: 'bandana', on: 'scarf', fill: 'scarfShade', nodes: [[-32, 40, 1, 0], [32, 40, 1, 0], [42, 56, 1, -10], [-42, 56, 1, 10]], round: 0.3 },
    { feature: 'bandana', on: 'scarf', fill: 'scarf', nodes: [[-38, 47, 1, -4], [38, 47, 1, -4], [0, 104, 1, -4]], round: 0.2 },
    // Feet extras are in the seated foot's space (its center on the origin, +x toward the center line). The cuff of
    // each boot shows behind the foot, so it takes the boot's house shade.
    { feature: 'boots', on: 'feet', under: true, kind: 'ellipse', fill: 'bootShade', cx: 0, cy: -9, rx: 18, ry: 15 },
  ],
  // The paws reach y ~131, so squash and stretch pivot about that height.
  rig: { ground: 131 },
  views: {
    // The house close-up (1254 px, head tipped 20°). There is no house-style reference for Brian yet.
    closeup: { w: 1254, h: 1254, x: 450, y: 835, scale: 5.5, rotate: 20 },
  },
});
