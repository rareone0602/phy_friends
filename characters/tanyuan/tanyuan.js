// Character spec for tanyuan, a tan dog with a messy white mop streaked with red, red eyes, one ear whose tip
// folds over, white eyebrow spots, a red mark on each cheek and a bushy tail that is white underneath. He wears
// his blue-gray hoodie, as in hoodie.jpg: its pale gray hood lies around his neck, two white drawstrings hang from
// it, and its front blouses over a ribbed hem.
// Pictures: examples/goggles.jpg, badminton.jpg, hoodie.jpg, ramen.jpg, bust.jpg, poster.jpg.
// Colors are taken from ramen.jpg, whose fills are flat; those it does not show are taken from bust.jpg, and the
// hoodie's from hoodie.jpg.
PhyFriends.define('tanyuan', {
  palette: {
    bg: '#1c1d21',
    fur: '#eab27f',        // The tan of every picture. Its house shade (furShade) fills the folded ear below its tip.
    head: 'fur',
    face: '#efeef3',       // The white, deepened to mumuyou's depth to stay visible on paper: the mop, muzzle, eyebrow spots, drawstrings, hind feet and the tail's underside.
    hair: 'face',
    ear: 'fur',
    earRight: 'furShade',
    earInner: '#aa7d5c',   // The brown inside the ears, from bust.jpg.
    iris: '#c84033',       // The red of the eyes in ramen.jpg (#da6655), one house step deeper so that it holds its weight on the tan.
    ink: '#2b2220',        // A warm near-black, as the pictures draw the nose, used for the open mouth.
    blush: '#f4ad9e',      // The coral of the hatched blush in ramen.jpg, as one flat soft tint.
    tongue: 'blush',
    body: 'hoodieShade',
    tail: 'fur',
    arm: 'hoodieShade',
    paw: 'fur',
    leg: 'furShade',
    foot: 'face',
    streak: '#b85a4b',     // The brick red of the streaks in the mop, also used for the marks on the cheeks.
    hoodie: '#698296',     // The blue-gray of the hoodie in hoodie.jpg (poster.jpg's is the same). Its house shade (hoodieShade) fills the body, which sits under the head; only the front, which lies over the ribbed hem, takes this color, and the sleeves take the shade, so that they show against it.
    hood: '#dcdcdc',       // The pale gray of the hood in hoodie.jpg and bust.jpg (poster.jpg draws it in the hoodie's blue). Its house shade (hoodShade) fills the inside of the hood, which lies behind its rim.
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
    right: { angle: 26, length: 64, width: 86, tip: 30, inner: { scale: 0.6, dx: 2, dy: -6 } },
  },
  // The messy mop is white: spiky tufts on the crown and its corners, a lock down each side of the face to eye
  // level, a lock over the outer corner of each eye and a narrow lock between the eyes. The valleys either side of
  // that lock sit high and are bowed alike, so that the tan forehead shows above each eye, where the white eyebrow
  // spots are.
  // Each tip is [x, y, bendIn, bendOut, following valley].
  hair: {
    cx: 0, cy: -60, rx: 76, ry: 42,
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
  eyes: { x: 34, y: 3, w: 13, h: 32, stroke: 5, arc: 1 },
  // The blush sits on the white under each eye, inside the cheek mark, tipped up to follow the cheek.
  blush: { x: 41, y: 34, rx: 9.5, ry: 6, tilt: 8 },
  // There is no mouth by default (the pictures' nose and mouth are omitted). It sits on the white, below the tan
  // between the eyes; when open, it shows a pink tongue and no fang, as the pictures show none.
  mouth: { y: 27, size: 3.8 },
  // The body is small under the large head, and an onigiri (a rice ball): narrow under the chin, broad and flat at
  // the base. It wears the hoodie, so it has no fur tufts. It sits under the head, so it takes the hoodie's house
  // shade. Below the front of the hoodie (an extra) it shows as the ribbed hem of hoodie.jpg, which lies under the
  // front where the front blouses over it. The paw print on the chest in poster.jpg is too small to keep.
  body: { cx: 0, cy: 84, rx: 66, ry: 48, onigiri: 1 },
  // The tail is a bushy tan plume rising behind his left hip (the viewer's right), its tip curling in. Its
  // underside is white (an extra); no picture gives it a white end.
  tail: {
    base: [56, 106], angle: 52, length: 136, width: 96, bend: -70, taper: 0.72, root: 0.5,
    fluff: [{ from: 300, to: 350, n: 2, len: 10, lean: 6, depth: 0.05, b1: -30, b2: 5, jit: 0 },
      { from: 255, to: 290, n: 1, len: 16, lean: -10, b1: 25, b2: -25, jit: 0 },
      { from: 200, to: 240, n: 2, len: 8, lean: 6, b1: -25, b2: 5, jit: 0 }],
  },
  // The limbs, on the house template. Seated, his tan forepaws rest on the ground between his white hind feet, which
  // are turned out slightly. Standing, the arms are the hoodie's long sleeves, which stand proud of them and blouse
  // over the ribbed cuffs of hoodie.jpg. They take the hoodie's house shade, as its sides and hem do, so that they show
  // against its front, which is in its own color; the forepaws are tan. The legs are his tan fur, in its house shade,
  // and white from the shin down to the white hind feet, as badminton.jpg draws them. Seated, the arms start low on
  // the body (forelegs), so that the drawstrings hang clear of them.
  stand: {
    fit: { forelegs: 0.4 },
    seat: { paw: { cx: 15, cy: 121, rx: 12.5, ry: 10 }, foot: { cx: 48, cy: 120, rx: 19, ry: 10, rot: -8 } },
    arms: { bands: [{ from: 0.34, to: 0.74, color: 'hoodieShade', grow: 1.5 }, { from: 0, to: 0.4, color: 'hoodieShade', grow: 2.5 }] },
    legs: { bands: [{ from: 0.5, to: 0.95, color: 'face' }] },
  },
  extras: [
    // The tan band across the eyes: it covers the top of the white face down to just under the eyes, far enough
    // that an eye looking down stays on the tan, and runs lower on the outer cheeks, where the red marks sit.
    { feature: 'mask', on: 'face', clip: true, fill: 'fur', nodes: [[-100, -80, 1], [100, -80, 1], [100, 34, 1, 0], [66, 36, 1, 20],
      [44, 26, 1, -10], [0, 22, 1, -10], [-44, 26, 1, 20], [-66, 36, 1, 0], [-100, 34, 1]] },
    // The red mark on each cheek: a small triangle under the outer corner of the eye, pointing in toward the nose.
    { feature: 'cheekMarks', on: 'face', fill: 'streak', nodes: [[-72, 20, 1, 12], [-52, 31, 1, 12], [-68, 37, 1, -8]] },
    { feature: 'cheekMarks', on: 'face', fill: 'streak', nodes: [[72, 20, 1, -12], [68, 37, 1, 8], [52, 31, 1, -12]] },
    // The white eyebrow spots: an oval above each eye, on the tan between the locks.
    { feature: 'brows', on: 'face', kind: 'ellipse', fill: 'face', cx: -33, cy: -28, rx: 7.5, ry: 5, rot: -8 },
    { feature: 'brows', on: 'face', kind: 'ellipse', fill: 'face', cx: 33, cy: -28, rx: 7.5, ry: 5, rot: 8 },
    // Ear extras are in ear-local space (base on the origin, tip up, +x toward the top of the head).
    // The folded tip of his left ear: a broad round dome in the tan that rolls forward over the fold and hangs
    // a little past the outer edge. It stays a dome when the ear flicks or perks.
    { feature: 'earFold', on: 'earR', fill: 'fur', round: 0.5, nodes: [[-50, -42, 1, -36], [36, -80, 1, -46], [4, -14, 1, -30], [-60, 2, 1, -24]] },
    // The red streaks in the mop: six strands, each widest where it runs off a lock's edge (the clip cuts it
    // there) and pointed inward, none parallel, so that none floats free in the white as a cut would.
    { feature: 'streaks', on: 'hair', clip: true, fill: 'streak', nodes: [[-54, -123, 1, -8], [-26, -70, 1, -8], [-38, -129, 1]] },
    { feature: 'streaks', on: 'hair', clip: true, fill: 'streak', nodes: [[-80, -90, 1, 8], [-48, -54, 1, 8], [-68, -98, 1]] },
    { feature: 'streaks', on: 'hair', clip: true, fill: 'streak', nodes: [[35, -135, 1, 8], [22, -80, 1, 8], [49, -129, 1]] },
    { feature: 'streaks', on: 'hair', clip: true, fill: 'streak', nodes: [[105, -67, 1, -8], [56, -70, 1, -8], [103, -53, 1]] },
    { feature: 'streaks', on: 'hair', clip: true, fill: 'streak', nodes: [[-89, 16, 1, 8], [-78, -40, 1, 8], [-103, 12, 1]] },
    { feature: 'streaks', on: 'hair', clip: true, fill: 'streak', nodes: [[100, 11, 1, -6], [84, -30, 1, -6], [88, 13, 1]] },
    // The front of the hoodie, in its own color. It blouses over the ribbed hem, as in hoodie.jpg: its sides tuck in
    // under the ends of the hood and fall a little past the body, and its lower edge overhangs the hem at the hips, so
    // that the hem shows as a band of cloth under a lip. Its top lies under the hood.
    { feature: 'hoodie', on: 'body', fill: 'hoodie', nodes: [[-32, 36, 1], [32, 36, 1], [38, 58], [41.5, 67], [46.5, 78], [51, 88], [53, 94],
      [48, 98], [26, 100.5], [0, 101.5], [-26, 100.5], [-48, 98], [-53, 94], [-51, 88], [-46.5, 78], [-41.5, 67], [-38, 58]] },
    // The two white drawstrings, coming out of the hood's edge on either side of the point and hanging a little apart,
    // over the lip of the front.
    { feature: 'drawstrings', on: 'body', fill: 'face', round: 0.5, nodes: [[-14, 78, 1], [-9, 78, 1], [-12, 105, 1], [-17, 105, 1]] },
    { feature: 'drawstrings', on: 'body', fill: 'face', round: 0.5, nodes: [[9, 78, 1], [14, 78, 1], [17, 105, 1], [12, 105, 1]] },
    // The hood is clothing, so it lies under the arms, and the sleeves show against its pale gray where they cross its
    // ends. The inside of the hood, in its house shade: it lies behind the rim, which is the
    // same gray, and shows where the rim's two sides part under the chin, as the inside of the hood does beside the
    // chest in hoodie.jpg. The white chest that the pictures show there is left out: right under the white chin it
    // would merge with the chin, and in its own house shade it would merge with the rim.
    { feature: 'hood', on: 'body', fill: 'hoodShade', nodes: [[-28, 44, 1], [28, 44, 1], [0, 82, 1]] },
    // The rim of the hood, lying bunched around the neck as a thick roll, one side from each shoulder down to a point
    // under the chin; his left side (the viewer's right) lies over the other, as in hoodie.jpg. Its ends rest on the
    // narrow shoulders and stand out past them, so that the roll overhangs the hoodie below and reads as cloth lying
    // on the body rather than printed on it. Its top lies under the head.
    { feature: 'hood', on: 'body', fill: 'hood', nodes: [[-24, 50, 1, -8], [1, 78, 1], [1, 86, 1], [-18, 79], [-34, 71], [-41, 63], [-40, 53],
      [-33, 45], [-28, 40, 1]] },
    { feature: 'hood', on: 'body', fill: 'hood', nodes: [[24, 50, 1], [28, 40, 1], [33, 45], [40, 53], [41, 63], [34, 71], [18, 79],
      [0, 86, 1], [0, 80, 1, -8]] },
    // Tail extras are drawn on the straight tail (base on the origin, tip at y -136, +x away from the body); the
    // library bends them onto the curve. The white underside, on the side toward the body, as in hoodie.jpg and
    // badminton.jpg.
    { feature: 'tailUnderside', on: 'tail', clip: true, fill: 'face', cx: -40, cy: -62, rx: 26, ry: 76,
      fluff: [{ from: -60, to: 60, n: 3, len: 10, lean: 4, depth: 0.05, b1: -25, b2: 5, jit: 0 }] },
  ],
  // The paws reach y ~131, so squash and stretch pivot about that height.
  rig: { ground: 131 },
  views: {
    // The house close-up (1254 px, head tipped 20°). There is no house-style reference for tanyuan yet.
    closeup: { w: 1254, h: 1254, x: 450, y: 835, scale: 5.5, rotate: 20 },
  },
});
