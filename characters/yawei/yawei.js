// Character spec for Yawei, a sky-blue dragon with a big spiky white mane all round his face, two long white horns
// with a white crest tuft between them, long pale gray-blue ears pointing up and out among the mane's spikes, dark red
// eyes under a white spot each, small teal bat wings with sky-blue bones and a yellow-and-white streak, and a sky-blue
// tail with yellow and white bands, ending in a white tuft.
// Picture: examples/357461512_984040536139726_4484697279077923589_n.jpg, his reference sheet and the color standard: a
// head close-up, the whole body side-on, the wings from above and the claws. Its color bar gives the palette.
// Colors are taken from the color bar; the lavender and darker blue on the body and the mane are the drawing's
// lighting and shading, so they are not colors here. His long muzzle becomes the house face, since the house has no
// nose, and the feral four-legged body becomes the house figure.
PhyFriends.define('yawei', {
  palette: {
    bg: '#1c1d21',
    fur: '#5dc6e6',        // The sky blue of the first swatch: the head, arms, tail and bones of the wings. Its house shade (furShade) fills the body, which sits under the head, and the legs.
    head: 'fur',
    face: 'fur',           // The close-up's face is sky blue throughout, so the face is the head's own color and has no mask (face: false below).
    hair: '#efeef3',       // The white of the color bar (#fdfdfd), deepened to mumuyou's depth to stay visible on paper: the mane, the horns, the crest, the spots above his eyes and the tail's tuft. Its house shade (hairShade) fills the back layer of the mane.
    ear: '#c9dfe5',        // The pale gray-blue of the color bar (#d1e3e7), a step deeper for the same reason, since the ears show against the white mane.
    earInner: 'ear',
    iris: '#7f0917',       // The dark red of the color bar, as the close-up has it; it holds against the sky blue (5.5:1).
    ink: '#3a0d14',        // A dark red near-black, for the open mouth.
    blush: '#e89aae',      // The sheet draws no blush; a soft rose chosen to read on the sky blue.
    tongue: '#e8788a',
    body: 'furShade',
    tail: 'fur',
    arm: 'fur',
    paw: 'fur',
    leg: 'furShade',
    foot: 'fur',
    wing: '#145f7f',       // The teal of the color bar, the wings' membranes.
    yellow: '#f3d37c',     // The yellow of the color bar: the streaks on the wings and the bands on the flank and the tail.
  },
  // The head is a round dome whose sides are cut into spiky tufts under the ears.
  head: {
    cx: 0, cy: -22, rx: 90, ry: 68,
    fluff: [{ from: -34, to: -4, n: 2, len: 10, lean: 4, depth: 0.05, b1: -30, b2: 10, jit: 0, sym: true }],
  },
  // The face is the head's own sky blue, as in the close-up, with no muzzle of another color.
  face: false,
  // The ears are long and pale, pointing up and out from among the mane's spikes. Their insides are the same color,
  // so there is no inner ear.
  ears: {
    base: [-70, -58], angle: 33, width: 46, length: 110, lean: 12, tip: 4, b1: -12, b2: -8,
  },
  // The crest tuft between the horns: a small crown of white spikes, kept above the forehead so that his brows and
  // eyes stay clear. Each tip is [x, y, bendIn, bendOut, following valley].
  hair: {
    cx: 0, cy: -78, rx: 24, ry: 16,
    tips: [
      [-26, -104, -6, -4, [-14, -96]],
      [-8, -132, -6, -6, [0, -104]],
      [10, -140, -6, 6, [18, -100]],
      [30, -108, -4, -6, [28, -90]],
      [22, -64, 4, -4, [8, -70]],
      [-22, -64, 4, -4, [-8, -70]],
    ],
  },
  // The eyes are plain tall pills in his dark red, without the close-up's whites and pupils. Setting arc: 1 draws the
  // happy, closed and squint strokes at the full eye width.
  eyes: { x: 34, y: 3, w: 13, h: 33, stroke: 4.8, arc: 1 },
  // The blush sits under the outer corner of each eye, tipped up to follow the cheek.
  blush: { x: 58, y: 27, rx: 11, ry: 6.5, tilt: 10 },
  // There is no mouth by default; when open, it shows a fang, as the sheet's open jaws do.
  mouth: { y: 21, size: 3.8, fang: true },
  // The body is small under the large head, and an onigiri (a rice ball): narrow under the chin, broad and round at the
  // base, in the house shade of the sky blue. Small hip tufts sit at its base.
  body: {
    cx: 0, cy: 84, rx: 64, ry: 47, onigiri: 1,
    fluff: [{ from: 8, to: 40, n: 2, len: 7, lean: 6, depth: 0.08, b1: -25, b2: 5, jit: 0, sym: true }],
  },
  // The tail is a slim dragon's tail rising behind his left hip (the viewer's right), its tip curling in, ending in
  // the white tuft. It is shorter than the sheet's, so that it reaches no further past his box than the other
  // fwiends' tails.
  tail: {
    base: [54, 118], angle: 84, length: 128, width: 62, bend: -80, taper: 0.6, root: 0.9,
    tip: { at: 0.68, color: 'hair', fluff: [{ from: 50, to: 130, n: 3, len: 20, depth: 0.02, b1: 18, b2: 12, jit: 0.2 }] },
  },
  // The limbs, on the house template. Seated, his forepaws rest on the ground between his hind feet, which are turned
  // out slightly; the white claws are too small to keep.
  stand: {
    seat: { paw: { cx: 16, cy: 121, rx: 12.5, ry: 10 }, foot: { cx: 48, cy: 121, rx: 19, ry: 10, rot: -8 } },
  },
  extras: [
    // The mane's back layer, in the house shade of the white, a ring of long spikes round the whole head, behind the
    // ears and under the head, so that the white front layer reads as locks and not as a cap.
    { feature: 'neck', on: 'base', under: true, fill: 'hairShade', cx: 0, cy: -16, rx: 104, ry: 82,
      fluff: [{ from: 0, to: 360, n: 11, len: 20, lean: 6, depth: 0.05, b1: -22, b2: 10, jit: 0, sym: true }] },
    // The big white mane round his face, a ruff under the cheeks whose long tufts reach past them, as in the
    // close-up. An n: 1 range with len < 0 tucks the bottom in under the chin.
    { feature: 'cheekRuff', on: 'base', under: true, fill: 'hair', cx: 0, cy: 12, rx: 98, ry: 52,
      fluff: [{ from: -50, to: 24, n: 4, len: 22, lean: -3, depth: 0.08, b1: -33, b2: 12, jit: 0, sym: true },
        { from: 45, to: 135, n: 1, len: -14, b1: 5, b2: 5, jit: 0 }] },
    // The two long white horns, swept up and back from the forehead on either side of the crest, tips leaning out.
    // They are drawn on the head, under the crest, which covers their inner edges.
    { feature: 'horns', on: 'base', fill: 'hair', round: 0.25, nodes: [[-16, -76, 1, 20], [-56, -176, 1, 6], [-50, -70, 1, 0]] },
    { feature: 'horns', on: 'base', fill: 'hair', round: 0.25, nodes: [[50, -70, 1, 6], [56, -176, 1, 20], [16, -76, 1, 0]] },
    // The white spots above his eyes, which the close-up draws as ovals between the horns and the eyes.
    { feature: 'brows', on: 'hair', kind: 'ellipse', fill: 'hair', cx: -30, cy: -28, rx: 5.5, ry: 8, rot: -8 },
    { feature: 'brows', on: 'hair', kind: 'ellipse', fill: 'hair', cx: 30, cy: -28, rx: 5.5, ry: 8, rot: 8 },
    // The small bat wings behind the body, as for Fruit: a teal membrane whose leading edge rises to a point and
    // whose trailing edge is cut into scallops, its root tucked behind the shoulder. The sheet's bones are a sky-blue
    // band along the leading edge, and each wing carries a yellow streak (the white one inside it is too small to
    // keep). The flank's white-and-yellow stripe is left out, since at this size it reads as a pair of yellow teeth.
    { feature: 'wings', on: 'body', under: true, fill: 'wing',
      nodes: [[40, 72, 1, -6], [114, 40, 1, 0], [112, 70, 1, 30], [106, 82, 1, 30], [90, 92, 1, 30], [60, 98, 1, 0]] },
    { feature: 'wings', on: 'body', under: true, fill: 'wing',
      nodes: [[-40, 72, 1, 0], [-60, 98, 1, 30], [-90, 92, 1, 30], [-106, 82, 1, 30], [-112, 70, 1, 0], [-114, 40, 1, -6]] },
    { feature: 'wings', on: 'body', under: true, fill: 'fur', round: 0.3,
      nodes: [[40, 70, 1], [114, 40, 1], [108, 50, 1], [46, 82, 1]] },
    { feature: 'wings', on: 'body', under: true, fill: 'fur', round: 0.3,
      nodes: [[-40, 70, 1], [-46, 82, 1], [-108, 50, 1], [-114, 40, 1]] },
    { feature: 'wings', on: 'body', under: true, fill: 'yellow', round: 0.1,
      nodes: [[84, 74, 1], [104, 62, 1], [100, 84, 1]] },
    { feature: 'wings', on: 'body', under: true, fill: 'yellow', round: 0.1,
      nodes: [[-84, 74, 1], [-100, 84, 1], [-104, 62, 1]] },
    // Tail extras are drawn on the straight tail (base on the origin, tip at y -128, +x away from the body); the
    // library bends them onto the curve. A white band between two yellow ones, as on the sheet's tail.
    { feature: 'tailMarks', on: 'tail', clip: true, kind: 'ellipse', fill: 'yellow', cx: 0, cy: -50, rx: 60, ry: 3.2 },
    { feature: 'tailMarks', on: 'tail', clip: true, kind: 'ellipse', fill: 'hair', cx: 0, cy: -57, rx: 60, ry: 3.2 },
    { feature: 'tailMarks', on: 'tail', clip: true, kind: 'ellipse', fill: 'yellow', cx: 0, cy: -64, rx: 60, ry: 3.2 },
  ],
  // The paws reach y ~131, so squash and stretch pivot about that height.
  rig: { ground: 131 },
  views: {
    // The house close-up (1254 px, head tipped 20 degrees). There is no house-style reference for Yawei yet.
    closeup: { w: 1254, h: 1254, x: 450, y: 835, scale: 5.5, rotate: 20 },
  },
});
