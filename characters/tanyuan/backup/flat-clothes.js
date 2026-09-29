// A candidate that lost to the reviewed design of characters/tanyuan/tanyuan.js: the hoodie before it was given
// thickness, with the hood clipped to the round body and the whole body in the hoodie's house shade. Kept per
// STYLE.md, principle 1.
// Character spec for tanyuan, a tan dog with a messy white mop streaked with red, red eyes, one ear whose tip
// folds over, white eyebrow spots, a red mark on each cheek and a bushy tail that is white underneath. He wears
// his blue-gray hoodie, as in hoodie.jpg: its pale gray hood lies around his neck, and two white drawstrings hang
// from it.
// Pictures: examples/goggles.jpg, badminton.jpg, hoodie.jpg, ramen.jpg, bust.jpg, poster.jpg.
// Colors are taken from ramen.jpg, whose fills are flat; those it does not show are taken from bust.jpg, and the
// hoodie's from hoodie.jpg.
PhyFriends.define('tanyuan', {
  palette: {
    bg: '#1c1d21',
    fur: '#eab27f',        // The tan of every picture. Its house shade (furShade) fills the folded ear below its tip.
    face: '#efeef3',       // The white, deepened to mumuyou's depth to stay visible on paper: the mop, muzzle, eyebrow spots, drawstrings, hind feet and the tail's underside.
    earInner: '#aa7d5c',   // The brown inside the ears, from bust.jpg.
    streak: '#b85a4b',     // The brick red of the streaks in the mop, also used for the marks on the cheeks.
    eye: '#2b2220',        // A warm near-black, as the pictures draw the nose, used for the open mouth.
    eyeRed: '#c84033',     // The red of the eyes in ramen.jpg (#da6655), one house step deeper so that it holds its weight on the tan.
    blush: '#f4ad9e',      // The coral of the hatched blush in ramen.jpg, as one flat soft tint.
    hoodie: '#698296',     // The blue-gray of the hoodie in hoodie.jpg (poster.jpg's is the same). The hoodie is the body, which sits under the head and the hood, so only its house shade (hoodieShade) is drawn.
    hood: '#dcdcdc',       // The pale gray of the hood in hoodie.jpg and bust.jpg (poster.jpg draws it in the hoodie's blue).
  },
  // The head is a round dome with a soft tuft down each side, under the ears.
  head: {
    cx: 0, cy: -22, rx: 90, ry: 68,
    fluff: [{ from: -26, to: -2, n: 1, len: 9, lean: 4, depth: 0, b1: -30, b2: 10, jit: 0, sym: true }],
  },
  // The white muzzle and cheeks, with spiky tufts on the lower cheeks. The tan band across the eyes (an extra)
  // covers its top, so that the white starts under the eyes, as in every picture. It is tall enough for its top
  // edge to lie under the mop, since an edge under the band would show as a pale seam across the forehead.
  face: {
    cx: 0, cy: -2, rx: 86, ry: 62,
    fluff: [{ from: 16, to: 52, n: 3, len: 10, lean: 3, depth: 0.1, b1: -30, b2: 10, jit: 0, sym: true }],
  },
  // The ears are pointed dog ears with soft tips. His right ear (the viewer's left) stands; the other folds over,
  // as in five of the six pictures. Below the fold it is short, broad and round, and its tip (an extra) rolls forward
  // over the fold into a broad dome as wide as the ear, as hoodie.jpg, ramen.jpg and poster.jpg draw it (bust.jpg
  // draws a round disc). The part below the fold lies behind the tip, so it takes the house shade.
  ears: {
    base: [-56, -66], angle: 27, width: 84, length: 86, lean: 8, tip: 8, b1: -14, b2: -8,
    inner: { scale: 0.6, dx: 2, dy: -12 },
    right: { angle: 26, length: 64, width: 86, tip: 30, color: 'furShade', inner: { scale: 0.6, dx: 2, dy: -6 } },
  },
  // The messy mop is white: spiky tufts on the crown and its corners, a lock down each side of the face to eye
  // level, a lock over the outer corner of each eye and a narrow lock between the eyes. The valleys either side of
  // that lock sit high and are bowed alike, so that the tan forehead shows above each eye, where the white eyebrow
  // spots are.
  // Each tip is [x, y, bendIn, bendOut, following valley].
  hair: {
    cx: 0, cy: -60, rx: 76, ry: 42, color: 'face',
    tips: [
      [36, -122, -12, -12, [54, -100]],
      [84, -104, -8, -8, [80, -76]],
      [104, -48, -10, -6, [84, -32]],
      [90, 8, 6, -10, [72, -30]],
      [54, -10, 12, -6, [34, -52]],
      [2, 6, 8, 8, [-34, -52]],
      [-54, -10, -6, 12, [-72, -30]],
      [-90, 8, -10, 6, [-84, -32]],
      [-104, -46, 6, -12, [-80, -76]],
      [-78, -108, -8, -8, [-54, -100]],
      [-40, -118, -14, -8, [-20, -110]],
      [-4, -134, -12, -10, [14, -112]],
    ],
  },
  // The eyes are plain tall pills in his own red, set wide and low on the tan. Setting arc: 1 draws the happy,
  // closed and squint strokes at the full eye width.
  eyes: { x: 34, y: 3, w: 13, h: 32, stroke: 5, arc: 1, color: 'eyeRed' },
  // The blush sits on the white under each eye, inside the cheek mark, tipped up to follow the cheek.
  blush: { x: 41, y: 34, rx: 9.5, ry: 6, tilt: 8 },
  // There is no mouth by default (the pictures' nose and mouth are omitted). It sits on the white, below the tan
  // between the eyes; when open, it shows a pink tongue and no fang, as the pictures show none.
  mouth: { y: 27, size: 3.8, tongue: 'blush' },
  // The body is seated and round, and wears the hoodie, so it has no fur tufts. It sits under the head and the
  // hood, so it takes the hoodie's house shade. The ribbed cuffs and hem of hoodie.jpg and the paw on the chest in
  // poster.jpg are too small to keep.
  body: { cx: 0, cy: 84, rx: 66, ry: 48, color: 'hoodieShade' },
  // The tail is a bushy tan plume rising behind his left hip (the viewer's right), its tip curling in. Its
  // underside is white (an extra); no picture gives it a white end.
  tail: {
    base: [56, 106], angle: 52, length: 136, width: 96, bend: -70, taper: 0.72, root: 0.5, color: 'fur',
    fluff: [{ from: 300, to: 350, n: 2, len: 10, lean: 6, depth: 0.05, b1: -30, b2: 5, jit: 0 },
      { from: 255, to: 290, n: 1, len: 16, lean: -10, b1: 25, b2: -25, jit: 0 },
      { from: 200, to: 240, n: 2, len: 8, lean: 6, b1: -25, b2: 5, jit: 0 }],
  },
  extras: [
    // The tan band across the eyes: it covers the top of the white face down to just under the eyes, far enough
    // that an eye looking down stays on the tan, and runs lower on the outer cheeks, where the red marks sit.
    { on: 'face', clip: true, fill: 'fur', nodes: [[-100, -80, 1], [100, -80, 1], [100, 34, 1, 0], [66, 36, 1, 20],
      [44, 26, 1, -10], [0, 22, 1, -10], [-44, 26, 1, 20], [-66, 36, 1, 0], [-100, 34, 1]] },
    // The red mark on each cheek: a small triangle under the outer corner of the eye, pointing in toward the nose.
    { on: 'face', fill: 'streak', nodes: [[-72, 20, 1, 12], [-52, 31, 1, 12], [-68, 37, 1, -8]] },
    { on: 'face', fill: 'streak', nodes: [[72, 20, 1, -12], [68, 37, 1, 8], [52, 31, 1, -12]] },
    // The white eyebrow spots: an oval above each eye, on the tan between the locks.
    { on: 'face', kind: 'ellipse', fill: 'face', cx: -33, cy: -28, rx: 7.5, ry: 5, rot: -8 },
    { on: 'face', kind: 'ellipse', fill: 'face', cx: 33, cy: -28, rx: 7.5, ry: 5, rot: 8 },
    // Ear extras are in ear-local space (base on the origin, tip up, +x toward the top of the head).
    // The folded tip of his left ear: a broad round dome in the tan that rolls forward over the fold and hangs
    // a little past the outer edge. It stays a dome when the ear flicks or perks.
    { on: 'earR', fill: 'fur', round: 0.5, nodes: [[-50, -42, 1, -36], [36, -80, 1, -46], [4, -14, 1, -30], [-60, 2, 1, -24]] },
    // The red streaks in the mop: six strands, each widest where it runs off a lock's edge (the clip cuts it
    // there) and pointed inward, none parallel, so that none floats free in the white as a cut would.
    { on: 'hair', clip: true, fill: 'streak', nodes: [[-54, -123, 1, -8], [-26, -70, 1, -8], [-38, -129, 1]] },
    { on: 'hair', clip: true, fill: 'streak', nodes: [[-80, -90, 1, 8], [-48, -54, 1, 8], [-68, -98, 1]] },
    { on: 'hair', clip: true, fill: 'streak', nodes: [[35, -135, 1, 8], [22, -80, 1, 8], [49, -129, 1]] },
    { on: 'hair', clip: true, fill: 'streak', nodes: [[105, -67, 1, -8], [56, -70, 1, -8], [103, -53, 1]] },
    { on: 'hair', clip: true, fill: 'streak', nodes: [[-89, 16, 1, 8], [-78, -40, 1, 8], [-103, 12, 1]] },
    { on: 'hair', clip: true, fill: 'streak', nodes: [[100, 11, 1, -6], [84, -30, 1, -6], [88, 13, 1]] },
    // The pale gray hood, lying around the neck under the chin. Its lower edge dips to a point where its two sides
    // cross, and the clip keeps it inside the shoulders. The white chest that the pictures show in the opening is
    // left out: right under the white chin, the two would merge into one long white chin.
    { on: 'body', clip: true, fill: 'hood', nodes: [[-90, 20, 1], [90, 20, 1], [90, 60, 1, -12], [0, 86, 1, -12], [-90, 60, 1]] },
    // The two white drawstrings, coming out of the hood's edge on either side of the point and hanging a little apart.
    { on: 'body', fill: 'face', round: 0.5, nodes: [[-14, 78, 1], [-9, 78, 1], [-13, 106, 1], [-18, 106, 1]] },
    { on: 'body', fill: 'face', round: 0.5, nodes: [[9, 78, 1], [14, 78, 1], [18, 106, 1], [13, 106, 1]] },
    // The white hind feet, turned out slightly, as badminton.jpg draws the lower legs.
    { on: 'body', kind: 'ellipse', fill: 'face', cx: -48, cy: 120, rx: 19, ry: 10, rot: -8 },
    { on: 'body', kind: 'ellipse', fill: 'face', cx: 48, cy: 120, rx: 19, ry: 10, rot: 8 },
    // The tan forepaws on the ground between them. As with every friend, the arms are not drawn, so neither are the
    // sleeves.
    { on: 'body', kind: 'ellipse', fill: 'fur', cx: -15, cy: 121, rx: 12.5, ry: 10 },
    { on: 'body', kind: 'ellipse', fill: 'fur', cx: 15, cy: 121, rx: 12.5, ry: 10 },
    // Tail extras are drawn on the straight tail (base on the origin, tip at y -136, +x away from the body); the
    // library bends them onto the curve. The white underside, on the side toward the body, as in hoodie.jpg and
    // badminton.jpg.
    { on: 'tail', clip: true, fill: 'face', cx: -40, cy: -62, rx: 26, ry: 76,
      fluff: [{ from: -60, to: 60, n: 3, len: 10, lean: 4, depth: 0.05, b1: -25, b2: 5, jit: 0 }] },
  ],
  // The paws reach y ~131, so squash and stretch pivot about that height.
  rig: { ground: 131 },
  views: {
    // The house close-up (1254 px, head tipped 20°). There is no house-style reference for tanyuan yet.
    closeup: { w: 1254, h: 1254, x: 450, y: 835, scale: 5.5, rotate: 20 },
  },
});
