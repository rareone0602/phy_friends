// The designer's first draft of characters/cowosus/cowosus.js, as it stood before review. The reviewer's version
// replaced it as the main spec. Kept per STYLE.md, principle 1.
// Character spec for cowosus, a white Australian Shepherd drawn as a pineapple: a lime patch over his right eye, one
// upright ear and one folded ear, both lime with dark green tips, a red-tipped curl on the crown, peach cheeks and
// eyebrow dots, pale blue eyes, a white ruff whose tips are lime like a pineapple's leaves, golden hips and thighs with
// orange diamonds like its scales, a star on his belly, yellow paw pads and a bushy tail that is gold at the base, then
// white, then lime at the tip.
// Pictures: examples/sheet.png (his owner's reference sheet, the color standard: a front, a side and a back view),
// sheet-b.png (the same, with the side view's arm drawn see-through) and sheet-accessories.png (the same, with a
// flower and sunglasses; backup/aloha.js).
// Colors are taken from the sheet's palette bar and swatches; those they do not show are taken from the drawing.
PhyFriends.define('cowosus', {
  palette: {
    bg: '#1c1d21',
    fur: '#efeef3',        // The white of the palette bar (#fdffff), deepened to mumuyou's depth to stay visible on paper: head, mop, root of the curl, muzzle, inner ear, ruff, tail band and paws. Its house shade (furShade) fills the body, which sits under the head.
    lime: '#b8dc79',       // The lime green of the palette bar: the patch over his right eye, the ears, the tips of the ruff and the tip of the tail.
    green: '#81a34d',      // The dark green of the palette bar: the tips of the ears.
    peach: '#fdd0a1',      // The peach of the palette bar (#ffdaae), deepened slightly so that the eyebrow dot on the white holds on paper: the cheeks, the cheek tufts and the eyebrow dots.
    gold: '#ffcb4f',       // The golden yellow of the palette bar: the thighs and the star on the belly. Its house shade (goldShade) fills the gold of the tail, which lies behind the gold thigh.
    orange: '#dc7808',     // The darker orange of the diamond swatch, at the heart of the pineapple's scales: the diamonds on the thighs.
    red: '#eb3333',        // The middle one of the three reds beside the back view (the sheet shades the curl from the first to the third): the tip of the curl.
    yellow: '#ffec57',     // The yellow of the paw-pad swatches: the pads and the tongue, since the sheet draws his open mouth yellow inside.
    eye: '#2b353c',        // The slate of the sheet's lines, used for the open mouth.
    eyeBlue: '#0b9aba',    // The pale blue of the eye swatches (#a8e9ff), three house steps deeper so that it holds its weight on the lime and on the white.
    blush: '#8eebbd',      // The mint of the swatch beside the head, which the sheet paints as a soft stroke across his nose and cheeks under the eyes, where a blush goes.
  },
  // The head is a round white dome with two spiky tufts down each side.
  head: {
    cx: 0, cy: -22, rx: 90, ry: 68,
    fluff: [{ from: -30, to: -2, n: 2, len: 10, lean: 4, depth: 0.05, b1: -30, b2: 10, jit: 0, sym: true }],
  },
  // The peach cheeks, a band across the lower face from cheek to cheek, as on the sheet. It starts under the eyes, far
  // enough down that an eye looking down stays on the white or the lime, and its sides are cut into spiky tufts.
  // Setting len < 0 flattens the top.
  face: {
    cx: 0, cy: 40, rx: 84, ry: 18, color: 'peach',
    fluff: [
      { from: -20, to: 40, n: 3, len: 9, lean: 3, depth: 0.1, b1: -28, b2: 8, jit: 0, sym: true },
      { from: 235, to: 305, n: 1, len: -4, b1: 0, b2: 0, jit: 0 },
    ],
  },
  // His right ear (the viewer's left) stands: a pointed lime ear with a white inner ear set high, so that a lime rim
  // parts it from the white crown, and a dark green tip. His left ear folds over, as in every view. It is drawn as the
  // flap that hangs from the fold: the ear's rounded base is the fold, and its tip, dark green, hangs down beside the
  // head. The part below the fold is hidden under the flap, so it is not drawn.
  ears: {
    base: [-56, -68], angle: 24, width: 88, length: 94, lean: 8, tip: 6, b1: -14, b2: -8, color: 'lime',
    inner: { scale: 0.46, dx: 6, dy: -28, color: 'fur' },
    stripes: [{ t: 0.84, w: 38, a: -14 }], stripeColor: 'green',
    right: { base: [-58, -100], angle: 156, width: 64, length: 82, lean: 0, tip: 14, b1: -20, b2: -20, inner: null, stripes: [] },
  },
  // The mop is the white fur of the crown: spiky tufts on top and a row of short locks hanging over the top of the lime
  // patch, as on the sheet. On the white side its locks lie on the white and do not show.
  // Each tip is [x, y, bendIn, bendOut, following valley].
  hair: {
    cx: 0, cy: -76, rx: 60, ry: 30, color: 'fur',
    tips: [
      [-18, -110, -8, -8, [-4, -102]],
      [12, -118, -8, -8, [28, -104]],
      [40, -108, -8, -6, [44, -80]],
      [30, -56, 0, 0, [8, -62]],
      [-6, -54, 6, 4, [-18, -66]],
      [-28, -54, 6, 4, [-40, -68]],
      [-50, -60, 4, 4, [-44, -80]],
      [-40, -92, -4, -6, [-30, -100]],
    ],
  },
  // The eyes are plain tall pills in his own blue, without the sheet's paler lower iris, orange sparkles or highlight.
  // Setting arc: 1 draws the happy, closed and squint strokes at the full eye width.
  eyes: { x: 34, y: 3, w: 13, h: 32, stroke: 5, arc: 1, color: 'eyeBlue' },
  // The blush is the sheet's mint, which it paints as one stroke across the nose and cheeks; here it is two soft ovals
  // on the peach under the eyes, as for every friend.
  blush: { x: 50, y: 34, rx: 11, ry: 6.5, tilt: 8 },
  // There is no mouth by default (the sheet's nose and grin are omitted). It sits on the white muzzle; when open, it
  // shows his yellow tongue and one fang for the sheet's two.
  mouth: { y: 40, size: 3.8, fang: true, tongue: 'yellow' },
  // The body is small, round and seated, in the house shade of the white. Shoulder tufts sit under the cheeks, and
  // small hip tufts below them.
  body: {
    cx: 0, cy: 86, rx: 64, ry: 46, color: 'furShade',
    fluff: [{ from: -65, to: -25, n: 2, len: 10, depth: 0, b1: 0, b2: -25, jit: 0, sym: true },
      { from: 20, to: 60, n: 2, len: 6, lean: 6, depth: 0.08, b1: -25, b2: 5, jit: 0, sym: true }],
  },
  // The tail is a big bushy plume rising behind his left hip (the viewer's right), as in the front and back views, its
  // tip curling in a little and ending in three long lime points, so that it reads as a pineapple under its crown. It
  // is shorter than the sheet's, which is as long as his body, so that it reaches no further past his place in the
  // gallery than the others' do, and it curls in less than theirs, so that its white band keeps clear of the white
  // head. Its gold lies behind the gold thigh, so it takes the house shade; in the gold itself, thigh and tail merge.
  // The white band and the lime tip are extras.
  tail: {
    base: [56, 106], angle: 42, length: 130, width: 100, bend: -30, taper: 0.72, root: 0.5, color: 'goldShade',
    fluff: [{ from: 300, to: 350, n: 2, len: 10, lean: 6, depth: 0.05, b1: -30, b2: 5, jit: 0 },
      { from: 238, to: 302, n: 3, len: 19, lean: 0, depth: 0.05, b1: 22, b2: -22, jit: 0 },
      { from: 200, to: 232, n: 1, len: 8, lean: 6, b1: -25, b2: 5, jit: 0 }],
  },
  extras: [
    // The peach cheek tufts: a ruff under the head whose spiky tufts stick out sideways past the cheeks, as on the
    // sheet. An n: 1 range with len < 0 tucks the bottom in under the chin.
    { on: 'base', under: true, fill: 'peach', cx: 0, cy: 30, rx: 88, ry: 30,
      fluff: [{ from: -12, to: 26, n: 2, len: 11, lean: -2, depth: 0.1, b1: -38, b2: 12, jit: 0, sym: true },
        { from: 45, to: 135, n: 1, len: -14, b1: 5, b2: 5, jit: 0 }] },
    // The lime patch over his right eye (the viewer's left), from the upright ear down to the cheek, as on the sheet.
    // Its inner edge runs down between the eyes, far enough in that an eye looking about stays on the lime; its top
    // lies under the mop.
    { on: 'base', clip: true, fill: 'lime', nodes: [[-120, -130, 1], [-44, -130, 1], [-40, -80, 1], [-14, -60, 1, 6],
      [-10, -10, 1, -4], [-12, 40, 1], [-120, 40, 1]] },
    // The white muzzle in the middle of the peach, with peach below it, so that it stays apart from the white ruff.
    { on: 'face', clip: true, fill: 'fur', cx: 0, cy: 42, rx: 22, ry: 13 },
    // Ear extras are in ear-local space (base on the origin, tip up, +x toward the top of the head). The dark green tip
    // of the folded ear, its edge cut into points that reach up toward the fold, as on the sheet.
    { on: 'earR', clip: true, fill: 'green', nodes: [[-60, -50, 1], [-20, -56, 1], [-13, -46, 1], [-5, -56, 1], [3, -46, 1],
      [11, -56, 1], [19, -48, 1], [60, -54, 1], [60, -100, 1], [-60, -100, 1]] },
    // The peach eyebrow dots: an oval above each eye, on the lime and on the white.
    { on: 'hair', kind: 'ellipse', fill: 'peach', cx: -32, cy: -34, rx: 8, ry: 6 },
    { on: 'hair', kind: 'ellipse', fill: 'peach', cx: 32, cy: -34, rx: 8, ry: 6 },
    // The curl on the crown, which every view draws: a thick white lock that rises left of the middle and hooks over to
    // the right into a point, and its red tip, whose edge is cut into points that reach down into the white.
    { on: 'hair', fill: 'fur', nodes: [[-28, -100, 1, 0], [-34, -118], [-34, -134], [-26, -146], [-10, -153], [20, -152, 1, 0],
      [0, -142], [-12, -130], [-14, -116], [-8, -102, 1, 0]] },
    { on: 'hair', fill: 'red', nodes: [[-32, -128, 1, 0], [-34, -134], [-26, -146], [-10, -153], [20, -152, 1, 0],
      [0, -142], [-10, -133, 1], [-14, -126, 1], [-18, -131, 1], [-24, -124, 1], [-28, -130, 1]] },
    // The golden hips and thighs, the fruit of his pineapple: the sheet's gold covers his hips, rising behind the arms
    // to the waist (sheet-b.png shows it through the arm), so seated it fills the lower body but for the belly, which
    // shows between the thighs in the body's shade. On each thigh are the sheet's pineapple scales: a big diamond with a
    // small one on either side, clipped to the body so that the outer one turns out of sight. The sheet's paler orange
    // round the heart of each diamond is left out: at gallery size it merges into the gold.
    { on: 'body', clip: true, fill: 'gold', cx: -48, cy: 98, rx: 36, ry: 40 },
    { on: 'body', clip: true, fill: 'gold', cx: 48, cy: 98, rx: 36, ry: 40 },
    { on: 'body', clip: true, fill: 'orange', polys: [[-45, 86, 14, 4, 90, 0.72], [45, 86, 14, 4, 90, 0.72],
      [-27, 100, 6, 4, 90, 0.75], [27, 100, 6, 4, 90, 0.75], [-63, 97, 6, 4, 90, 0.75], [63, 97, 6, 4, 90, 0.75]] },
    // The ruff at the neck: white fur whose tufts end in long lime points, like the leaves of the pineapple's crown. The
    // lime lies under the white and its tufts are longer, so that it shows only as the points below the white ones. The
    // peach fringes at the knees and elbows are left out, as are the lime spots on the shoulders and the yellow rings on
    // the wrists: without the arms, which the house does not draw, they would float on the body.
    { on: 'body', clip: true, fill: 'lime', cx: 0, cy: 50, rx: 58, ry: 28,
      fluff: [{ from: 15, to: 165, n: 7, len: 17, depth: 0.05, b1: -12, b2: 12, jit: 0 }] },
    { on: 'body', clip: true, fill: 'fur', cx: 0, cy: 46, rx: 55, ry: 26,
      fluff: [{ from: 15, to: 165, n: 7, len: 5, depth: 0.05, b1: -10, b2: 10, jit: 0 }] },
    // The gold star on the belly, between the thighs, as on the sheet.
    { on: 'body', fill: 'gold', round: 0.3, nodes: [[0, 83, 1], [2.5, 88.6, 1], [8.6, 89.2, 1], [4, 93.3, 1], [5.3, 99.3, 1],
      [0, 96.2, 1], [-5.3, 99.3, 1], [-4, 93.3, 1], [-8.6, 89.2, 1], [-2.5, 88.6, 1]] },
    // The white hind feet, soles to the front: a yellow pad under three yellow toe beans on each, as the sheet's pad
    // swatches draw them. A lone pad on a white foot reads as an egg.
    { on: 'body', kind: 'ellipse', fill: 'fur', cx: -48, cy: 115, rx: 19, ry: 16 },
    { on: 'body', kind: 'ellipse', fill: 'fur', cx: 48, cy: 115, rx: 19, ry: 16 },
    { on: 'body', kind: 'ellipse', fill: 'yellow', cx: -48, cy: 120, rx: 8.5, ry: 6.5 },
    { on: 'body', kind: 'ellipse', fill: 'yellow', cx: 48, cy: 120, rx: 8.5, ry: 6.5 },
    { on: 'body', fill: 'yellow', round: 0.5, polys: [[-58, 109, 3.4, 8], [-48, 106, 3.4, 8], [-38, 109, 3.4, 8],
      [38, 109, 3.4, 8], [48, 106, 3.4, 8], [58, 109, 3.4, 8]] },
    // The white forepaws on the ground between them.
    { on: 'body', kind: 'ellipse', fill: 'fur', cx: -15, cy: 121, rx: 12.5, ry: 10 },
    { on: 'body', kind: 'ellipse', fill: 'fur', cx: 15, cy: 121, rx: 12.5, ry: 10 },
    // Tail extras are drawn on the straight tail (base on the origin, tip at y -130, +x away from the body); the
    // library bends them onto the curve. The white band and, over it, the lime tip, each edge cut into flame-shaped
    // tufts that reach back toward the base, as on the sheet. The band is narrower than the sheet's, so that the gold
    // and the lime carry the tail. They stay inside the plume, so that they do not widen the tail's measured reach.
    { on: 'tail', clip: true, fill: 'fur', cx: 0, cy: -118, rx: 50, ry: 38,
      fluff: [{ from: 50, to: 130, n: 3, len: 12, depth: 0.02, b1: 18, b2: 12, jit: 0.2 }] },
    { on: 'tail', clip: true, fill: 'lime', cx: 0, cy: -130, rx: 50, ry: 30,
      fluff: [{ from: 50, to: 130, n: 3, len: 18, depth: 0.02, b1: 20, b2: 14, jit: 0.2 }] },
  ],
  // The folded ear lies over the upper side of the head, as on the sheet, so it is drawn after the head; the face, the
  // eyes and the mop stay on top of it.
  order: ['earL', 'base', 'earR', 'face', 'blush', 'eyes', 'mouth', 'hair'],
  // The paws reach y ~131, so squash and stretch pivot about that height.
  rig: { ground: 131 },
  views: {
    // The sheet at a quarter of its size, with the origin between the eyes of the front view and its eyes set as far
    // apart as the spec's, so that the heads line up (pf.py compare). The sheet stands him up; the spec sits.
    sheet: { w: 1733, h: 841, x: 331.8, y: 233.5, scale: 0.96, rotate: 0 },
    // The house close-up (1254 px, head tipped 20°). There is no house-style reference for cowosus yet.
    closeup: { w: 1254, h: 1254, x: 450, y: 835, scale: 5.5, rotate: 20 },
  },
});
