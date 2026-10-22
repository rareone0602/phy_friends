// Character spec for mosing, a black dragon: charcoal fur with a spiky charcoal mop, two cyan horns on the crown, big
// upright ears striped in cyan and cyan inside, a white diamond and two cyan brows on the forehead, a white muzzle and
// cheeks with a charcoal V between the eyes, one eye green and the other amber, a big white chest ruff, cyan tribal
// stripes on the hips, and a slim tail with cyan fins.
// Picture: examples/33_20240310124429.png (his reference sheet, front and back, standing, which is the color
// standard). The lettering of his name and the paw prints are not his; the five prints are the sheet's color swatches
// and give the colors below.
// Colors are taken from the sheet's swatches where it has them, and from the drawing otherwise.
PhyFriends.define('mosing', {
  extends: 'house',
  palette: {
    fur: '#383838',        // The charcoal of the sheet and of its charcoal swatch (L* 24): the head, ears, arms, tail and feet. Its house shade (furShade, L* about 15) fills the body, which sits under the head, and the legs; it stays a dark gray rather than black on paper, since the pencil lets the paper through.
    head: 'fur',
    face: '#efeef3',       // The white of the sheet (#f6fdff, a cool white), deepened to mumuyou's depth to stay visible on paper: the muzzle and cheeks, the diamond, the tufts in the ears and the ruff. Its house shade (faceShade) fills the back layer of the ruff, under the chin.
    hair: 'fur',
    ear: 'fur',
    earInner: 'cyan',
    iris: '#00eb3a',       // His right eye (the viewer's left): the green of the sheet's green swatch. The drawing's own green (#008e1e) is faint on the charcoal, so the swatch's brighter green is kept.
    irisRight: '#edb100',  // His left eye (the viewer's right): the amber of the sheet's amber swatch; the drawing's (#906700) is darker and fainter on the charcoal.
    ink: '#241a1c',        // A near-black, for the open mouth, since the sheet's grin is dark inside.
    blush: '#e8a0ae',      // The pink of the tongue in the sheet's grin, as a soft blush on the white muzzle; the sheet draws none.
    tongue: '#f07f8f',     // The pink of the tongue in the sheet.
    body: 'furShade',
    tail: 'fur',
    arm: 'fur',
    paw: 'fur',
    foot: 'fur',
    cyan: '#00e9ff',       // The cyan of the sheet's cyan swatch: the inside of the ears, the horns, the ear stripes, the brows, the hip stripes and the tail's fins.
  },
  // The head is a round dome whose sides are cut into spiky tufts under the ears, and whose crown is spiky too.
  head: {
    cy: -22, rx: 90, ry: 68,
    fluff: [{ from: -34, to: -4, n: 2, len: 10, lean: 4, depth: 0.05, b1: -30, b2: 10, jit: 0, sym: true }],
  },
  // The white muzzle and cheeks, under the eyes, so that the eyes sit on the charcoal and a glance down reaches the
  // white. Its sides are cut into the spiky tufts of the sheet's cheeks. The sheet's charcoal comes down between the
  // eyes into the white; it is kept as a moderate V notched in the top of the muzzle (an n: 1 range with len < 0 and
  // straight sides), since a band down the whole muzzle cut the white too sharply.
  face: {
    cy: 24, rx: 70, ry: 30,
    fluff: [{ from: -10, to: 40, n: 3, len: 10, lean: 4, depth: 0.08, b1: -24, b2: 8, jit: 0, sym: true },
      { from: 252, to: 288, n: 1, len: -20, b1: 0, b2: 0, jit: 0 }],
  },
  // The ears are big, tall and upright, charcoal outside with the sheet's cyan stripes, and cyan inside. The curved
  // stripes of the sheet are a band across each tip and a second lower down; the white tuft in the inner ear is an
  // extra.
  ears: {
    base: [-58, -66], angle: 26, width: 92, length: 104, lean: 10, tip: 8, b1: -14, b2: -8,
    inner: { scale: 0.6, dx: 6, dy: -10 },
    stripes: [{ t: 0.86, w: 22, a: -16, color: 'cyan' }],
    right: { stripes: [{ t: 0.86, w: 22, a: 16, color: 'cyan' }] },
  },
  // The mop is charcoal, in the head's own color, a crown of pointed locks rising above the head with a flick over
  // each side of the forehead, as on the sheet. The valleys over the eyes sit high, so that the brows and the diamond
  // show on the head below them. Each tip is [x, y, bendIn, bendOut, following valley].
  hair: {
    cy: -62, rx: 44, ry: 30,
    tips: [
      [-50, -90, -8, -6, [-44, -76]],
      [-28, -120, -8, -8, [-16, -102]],
      [6, -128, -8, -8, [20, -106]],
      [38, -112, -8, -8, [46, -92]],
      [56, -84, -8, -4, [52, -68]],
      [44, -56, 4, 4, [26, -56]],
      [-44, -60, -4, 4, [-26, -56]],
    ],
  },
  // The eyes are plain tall pills in his two colors, as on the sheet: his right eye (the viewer's left) green and his
  // left amber, without the sheet's pupils, whites or highlights.
  eyes: { x: 34, y: 4, h: 32, stroke: 4.8 },
  // The blush sits on the white muzzle under each eye, tipped up to follow the cheek.
  blush: { x: 46, y: 32, rx: 10, ry: 5.5, tilt: 8 },
  // There is no mouth by default (the sheet's open grin is omitted); when open, it shows the pink tongue and a fang.
  mouth: { y: 34, size: 4, fang: true },
  // The body is small under the large head, and an onigiri (a rice ball): narrow under the chin, broad and round at the
  // base. It is in the house shade of the charcoal. Small hip tufts sit at its base. The sheet's white belly stripe,
  // and the cyan spot beside it, are left out: under the big ruff, the stripe showed only as a thin stem to the ground.
  body: {
    cy: 84, rx: 64, ry: 48,
    fluff: [{ from: 8, to: 40, n: 2, len: 7, lean: 6, depth: 0.08, b1: -25, b2: 5, jit: 0, sym: true }],
  },
  // The tail is a slim dragon's tail rising behind his right hip (the viewer's left), as on the sheet, its tip curling
  // in; its outer part is a cyan crest of spiky fins. It is shorter than the sheet's, so that it reaches no further
  // past his box than the other fwiends' tails.
  tail: {
    base: [-56, 106], angle: 56, length: 108, width: 66, bend: -72, taper: 0.6, root: 0.95,
    fluff: [{ from: 300, to: 350, n: 2, len: 12, lean: 6, depth: 0.05, b1: -30, b2: 5, jit: 0 },
      { from: 200, to: 240, n: 2, len: 10, lean: 6, b1: -25, b2: 5, jit: 0 }],
    tip: { at: 0.6, color: 'cyan' },
  },
  // The limbs, on the house template. Seated, his charcoal forepaws rest on the ground between his hind feet, which are
  // turned out slightly; the cyan claws and the stripes on the arms are too small to keep. Standing, as on the sheet,
  // the charcoal arms are held out and the legs are short and plain.
  stand: {
    seat: { paw: { cx: 16, cy: 121, rx: 12.5, ry: 10 }, foot: { cx: 48, cy: 121, rx: 19, ry: 10, rot: -8 } },
  },
  extras: [
    // Cheek fluff under the head: a charcoal ruff whose spiky tufts reach past the cheeks, as on the sheet. An n: 1
    // range with len < 0 tucks the bottom in under the chin.
    { feature: 'cheekRuff', on: 'base', under: true, fill: 'fur', cx: 0, cy: 13, rx: 90, ry: 48,
      fluff: [{ from: -42, to: 21, n: 3, len: 15, lean: -2, depth: 0.1, b1: -35, b2: 12, jit: 0, sym: true },
        { from: 45, to: 135, n: 1, len: -12, b1: 5, b2: 5, jit: 0 }] },
    // The two horns, one on each side of the crown, cyan cones leaning in, as on the sheet's back view; its front view
    // hides most of the far one behind the mop. They are drawn on the mop's layer, since the mop, in the head's own
    // charcoal, would hide them.
    { feature: 'horns', on: 'hair', fill: 'cyan', round: 0.15, nodes: [[-16, -90, 1, 10], [-20, -148, 1, 6], [-38, -86, 1, 0]] },
    { feature: 'horns', on: 'hair', fill: 'cyan', round: 0.15, nodes: [[38, -86, 1, 6], [20, -148, 1, 10], [16, -90, 1, 0]] },
    // The white tuft in each inner ear, a few spiky points along its inner edge, as on the sheet.
    { feature: 'earTufts', on: 'ears', clip: true, fill: 'face', cx: 14, cy: -4, rx: 12, ry: 15,
      fluff: [{ from: 100, to: 260, n: 3, len: 10, depth: 0.05, b1: -20, b2: 8, jit: 0 }] },
    // The white diamond on the forehead, between the brows: a square squashed across its top corner.
    { feature: 'forehead', on: 'hair', fill: 'face', bend: 0, polys: [[0, -40, 12, 4, -90, 0.6]] },
    // The cyan brows, a spot above each eye, tipped up toward the outside.
    { feature: 'brows', on: 'hair', kind: 'ellipse', fill: 'cyan', cx: -41, cy: -31, rx: 11, ry: 6, rot: 14 },
    { feature: 'brows', on: 'hair', kind: 'ellipse', fill: 'cyan', cx: 41, cy: -31, rx: 11, ry: 6, rot: -14 },
    // The big white ruff round his neck: a back layer in the house shade of the white, which parts the white muzzle
    // from the white ruff, and the ruff in front of it, its long pointed tufts hanging to the middle of his chest. It is
    // fur round the neck, so it lies over the tops of the arms (scarf).
    { feature: 'chest', on: 'scarf', fill: 'faceShade', cx: 0, cy: 56, rx: 52, ry: 12 },
    { feature: 'chest', on: 'scarf', fill: 'face', cx: 0, cy: 75, rx: 58, ry: 20, onigiri: 0.5,
      fluff: [{ from: -20, to: 78, n: 4, len: 15, lean: 2, depth: 0.04, b1: -18, b2: 12, jit: 0 },
        { from: 78, to: 102, n: 1, len: 16, lean: 4, depth: 0, b1: -12, b2: -4, jit: 0 },
        { from: 102, to: 200, n: 4, len: 15, lean: -2, depth: 0.04, b1: -18, b2: 12, jit: 0 }] },
    // The ruff's back, as the sheet's back view draws it. It lies on the back (turn: 'back'), under the body, so that
    // it shows only once he turns.
    { feature: 'chest', on: 'body', under: true, turn: 'back', fill: 'face', cx: 0, cy: 66, rx: 54, ry: 26,
      fluff: [{ from: -10, to: 190, n: 7, len: 12, depth: 0.08, b1: -25, b2: 6, jit: 0 }] },
    // The cyan tribal stripes of the sheet's hips and thighs, simplified to two slanted bands on each hip.
    { feature: 'thighs', on: 'body', clip: true, fill: 'cyan', round: 0.4, nodes: [[33, 70, 1, -8], [26, 79, 1, 0], [42, 83, 1, 0]] },
    { feature: 'thighs', on: 'body', clip: true, fill: 'cyan', round: 0.4, nodes: [[48, 90, 1, -8], [26, 99, 1, 0], [50, 103, 1, 0]] },
    { feature: 'thighs', on: 'body', clip: true, fill: 'cyan', round: 0.4, nodes: [[-33, 70, 1, 0], [-42, 83, 1, 0], [-26, 79, 1, 8]] },
    { feature: 'thighs', on: 'body', clip: true, fill: 'cyan', round: 0.4, nodes: [[-48, 90, 1, 0], [-50, 103, 1, 0], [-26, 99, 1, 8]] },
    // Tail extras are drawn on the straight tail (base on the origin, tip at y -108, +x away from the body); the
    // library bends them onto the curve. Two cyan bands before the fins, as on the sheet.
    { feature: 'tailMarks', on: 'tail', clip: true, kind: 'ellipse', fill: 'cyan', cx: 0, cy: -40, rx: 60, ry: 3.4 },
    { feature: 'tailMarks', on: 'tail', clip: true, kind: 'ellipse', fill: 'cyan', cx: 0, cy: -30, rx: 60, ry: 3.4 },
  ],
  // The paws reach y ~131, so squash and stretch pivot about that height.
  views: {
    // The house close-up (1254 px, head tipped 20 degrees). There is no house-style reference for mosing yet.
  },
});
