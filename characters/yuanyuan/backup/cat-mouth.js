// A candidate, the runner-up to characters/yuanyuan/yuanyuan.js: the icon's cat's mouth with the tongue out as his
// face at rest, which breaks the house rule of no mouth by default (STYLE.md §9). Kept per STYLE.md, principle 1.
// Character spec for YuanYuan, a white cat with a lavender mop of pointed locks and a thick curl on the crown,
// lavender ears with white tufts, red-brown eyes, two lavender dots on his forehead, pink paw pads and a
// red-and-white cord around one ankle. He wears a navy yukata with pale blue dots, a pale blue collar and a pale
// blue sash.
// Pictures: examples/icon.png (his head, drawn by his owner) and sixteen of his owner's works in examples/EVE HP/.
// Colors and shapes are taken from examples/icon.png; colors it does not show are taken from EVE HP/2507.png, and
// the yukata's from EVE HP/2508.png. The works serve for colors, markings and fur shapes only.
PhyFriends.define('yuanyuan', {
  palette: {
    bg: '#1c1d21',
    fur: '#efeef3',        // The white, deepened to mumuyou's depth to stay visible on paper; the icon's warm white (#fff6f4) merges with the paper's cream. It fills the face, the ear tufts, the paws, the tail and the white of the cord. Its house shade (furShade) fills the chest in the collar of the yukata, under the white chin.
    hair: '#a3a4cb',       // The icon's lavender (#a6a4c2) at the chroma of the hair in EVE HP/2507.png (C* 22 for 17), so that on paper it keeps the icon's own color rather than turning gray: the mop, the curl, the head, the ears and the forehead dots.
    earInner: '#fcd6d0',   // The pink of the icon's inner ears.
    eye: '#2e2024',        // A warm near-black, used for the open mouth.
    eyeRed: '#97423a',     // The red-brown of the icon's eyes.
    blush: '#ffb6a7',      // The icon's blush, also used for the paw pads, whose pink in EVE HP/2507.png (#fcb4ae) is nearly the same.
    tongue: '#ebb4ab',     // The icon's tongue.
    cord: '#ae4e48',       // The red of the twisted cord in EVE HP/2507.png.
    yukata: '#5c5c74',     // The dusky navy of the yukata in EVE HP/2508.png (its most common color, #5a5a72), which holds on paper as it is. The yukata is the body, which sits under the head, so its house shade (yukataShade) fills it; only the top panel of the robe, which lies over the other, takes this color.
    pattern: '#c4d4f4',    // The pale blue of the round dots on the yukata in EVE HP/2508.png, also used for the collar bands and the sash, so that they add no color of their own and stay clear of the red cord and the red seal beside him.
  },
  // The head is a broad dome in the hair's lavender; the mop covers all of it but the face.
  head: { cx: 0, cy: -20, rx: 84, ry: 60, color: 'hair' },
  // The white face is a broad, low mask, as on the icon: its bottom is a wide, flat curve, and at each lower corner
  // a spiky cheek ruff sticks out sideways, with a smaller tuft below it pointing down.
  face: {
    cx: 0, cy: -17, rx: 86, ry: 64, color: 'fur',
    fluff: [
      { from: 12, to: 36, n: 1, len: 16, lean: -2, depth: 0, b1: -10, b2: 10, jit: 0, sym: true },
      { from: 38, to: 56, n: 1, len: 11, lean: 0, depth: 0, b1: -10, b2: 10, jit: 0, sym: true },
    ],
  },
  // The ears are broad cat ears at the outer corners of the head, as wide apart as the icon's: the outer edge rises
  // almost straight from the side of the head, and the inner edge slopes down to the crown, dipping a little before
  // it meets it. The ear's inner base lies under the crown, so a notch parts each ear from the round crown, which
  // is what makes them read as cat ears without the icon's outlines. The pink inner ear fills the outer part of the
  // ear and leaves a broad lavender rim along the inner edge; the white tufts in it are an extra.
  ears: {
    base: [-65, -71], angle: 31, width: 82, length: 78.5, lean: 0, tip: 6, b1: -6, b2: 5, color: 'hair',
    inner: { scale: 1, width: 46, length: 74, lean: 14, tip: 5, b1: -8, b2: 2, dx: -15, dy: 2 },
  },
  // The mop is a round crown over a fringe of pointed locks: a broad middle lock that comes down to a point between
  // the forehead dots, a shorter lock over each brow and a jagged point out at each side of the head, as on the
  // icon. The icon's crown is a straight line from ear to ear, which only its outlines part from the ears; without
  // them, a straight top reads as a box, so the crown is a low dome, as the house heads are, bowed well outward on
  // both sides. The partings either side of the middle lock sit high, so that the dots show on the white. The long
  // locks down the sides of the face are an extra, since a star orders its tips by angle and they hang lower than
  // the brow locks inside them.
  // Each tip is [x, y, bendIn, bendOut, following valley].
  hair: {
    cx: 0, cy: -56, rx: 80, ry: 48, color: 'hair',
    tips: [
      [0, -114, -40, -40, [86, -34]],
      [94, -12, -4, 0, [58, -62]],
      [44, -33, 6, 4, [28, -78]],
      [0, -30, 6, 6, [-28, -78]],
      [-44, -33, -4, -6, [-58, -62]],
      [-94, -12, 0, 4, [-86, -34]],
    ],
  },
  // The eyes are plain tall pills in his own red-brown, set wide and low. Setting arc: 1 draws the happy, closed and
  // squint strokes at the full eye width.
  eyes: { x: 34, y: 4, w: 13, h: 32, stroke: 5, arc: 1, color: 'eyeRed' },
  // The blush sits on the white beside the lower half of each eye, as on the icon, tipped up to follow the cheek. It
  // sits far enough out that an eye looking down and outward does not land on it. The icon's strokes across the
  // blush are left out.
  blush: { x: 58, y: 19, rx: 11.5, ry: 7, tilt: 10 },
  // His mouth at rest is the icon's cat's mouth ('w'), larger than the house mouth so that it reads at gallery size,
  // with the tongue out below it (an extra); the icon's nose is left out. When open, the mouth shows his pink tongue
  // and one fang for the small fangs of EVE HP/2502.png.
  mouth: { y: 20, size: 5, shape: 'w', fang: true },
  // The body is small, round and seated, and wears the yukata, so it has no fur tufts. It sits under the head, so it
  // takes the yukata's house shade. As with every friend, the arms are not drawn, so neither are the wide sleeves.
  body: { cx: 0, cy: 84, rx: 64, ry: 47, color: 'yukataShade' },
  // The tail is a slim white cat's tail, as in every work before 2026. It leaves his left hip (the viewer's right) above
  // the hind foot, so that it does not read as a leg, and curls up in a C, as a sitting cat's does, beside the body
  // rather than behind the head.
  tail: {
    base: [56, 104], angle: 78, length: 120, width: 34, bend: -150, taper: 0.3, root: 0.2, color: 'fur',
    fluff: [{ from: 320, to: 350, n: 1, len: 5, lean: 4, depth: 0.05, b1: -30, b2: 5, jit: 0 },
      { from: 190, to: 225, n: 1, len: 4, lean: 4, b1: -25, b2: 5, jit: 0 }],
  },
  extras: [
    // The two dots on the forehead, either side of the middle lock, where eyebrows would be. The icon draws them as
    // pale circles that only their outlines show; without outlines they take the hair's lavender, as EVE HP/2604(2).png
    // fills them with the hair's color. A pale pink dot all but vanishes on the white at gallery size, and a pink
    // ring reads as an outline.
    { on: 'face', kind: 'ellipse', fill: 'hair', cx: -28, cy: -34, rx: 7.5, ry: 7 },
    { on: 'face', kind: 'ellipse', fill: 'hair', cx: 28, cy: -34, rx: 7.5, ry: 7 },
    // The tongue, out below the cat's mouth as on the icon. The mouth layer takes no extras, so the tongue is drawn
    // on the blush layer, which lies under the mouth: it shows under every mouth shape, hidden only by the open one.
    { on: 'blush', kind: 'ellipse', fill: 'tongue', cx: 0, cy: 22.6, rx: 2.6, ry: 2.9 },
    // Ear extras are in ear-local space (base on the origin, tip up, +x toward the top of the head).
    // The white tufts along the inner edge of the inner ear, as on the icon: a band of white fur whose outer side is
    // cut into three spikes that point out and down, the lowest the longest. They cover less than half of the pink,
    // as on the icon, so that the ear still reads as pink inside.
    { on: 'ears', fill: 'fur', nodes: [[-1.2, -58, 1], [1.2, -32], [3.6, -6, 1], [-2, 4, 1], [-20.4, -7, 1],
      [-8.4, -14, 1], [-14, -28, 1], [-6, -31, 1], [-8.4, -44, 1], [-3.6, -47, 1]] },
    // The long locks down each side of the face, as on the icon: a lock from the parting above the outer corner of
    // the eye down past it to the cheek, and beside it a shorter outer lock, with a notch between them.
    { on: 'hair', fill: 'hair', nodes: [[58, -62, 1, -4], [63, 2, 1, 4], [71, -10, 1, -4], [79, 1, 1, 4], [92, -12, 1, 0],
      [86, -34, 1, 0]] },
    { on: 'hair', fill: 'hair', nodes: [[-58, -62, 1, 0], [-86, -34, 1, 0], [-92, -12, 1, -4], [-79, 1, 1, 4],
      [-71, -10, 1, -4], [-63, 2, 1, 4]] },
    // The curl on the crown, from the icon: a thick lock that rises from the middle of the crown, loops over to the
    // left and curls back in, leaving a small opening low on the left rather than a ring. It stands as high as the
    // icon's, a little clear of the domed crown, so that the opening stays open.
    { on: 'hair', fill: 'hair', nodes: [[8, -110, 1, 0], [16, -128], [15, -145], [4, -158], [-12, -163], [-28, -159],
      [-39, -148], [-41, -135], [-35, -125], [-27, -121, 1, 0], [-27, -131], [-21, -138], [-12, -140], [-5, -134],
      [-4, -122], [-9, -110, 1, 0]] },
    // The yukata, crossed left over right as it is worn: the top panel, his left (the viewer's right), lies over the
    // other, so its edge runs from under his chin on the viewer's right down across the sash to the viewer's left,
    // like the long stroke of a y. Crossed the other way, right over left, a kimono is how the dead are dressed. The
    // top panel is in the yukata's own color, and the panel under it keeps the body's house shade.
    // Each panel's edge carries a collar band in the pale blue of the dots. The band of the panel underneath is
    // drawn first and runs on beneath the top panel. The two panels differ by only one house step, which the pencil
    // blurs at gallery size; the bands draw the crossed collar that tells a yukata from a round dark sweater.
    { on: 'body', clip: true, fill: 'pattern', nodes: [[-36.3, 22, 1], [-1, 63, 1], [5.5, 70.6, 1], [0.2, 75.2, 1],
      [-41.6, 26.6, 1]] },
    { on: 'body', clip: true, fill: 'yukata', nodes: [[34, 28, 1], [110, 28, 1], [110, 140, 1], [-14, 140, 1], [-10, 81, 1],
      [-8, 70, 1]] },
    // The white chest in the V of the collar, where the two panels part below the chin. It lies under the white chin,
    // so it takes the fur's house shade, which parts the two.
    { on: 'body', clip: true, fill: 'furShade', nodes: [[-26, 34, 1], [28, 34, 1], [-1, 63, 1]] },
    // The top panel's collar band, along its edge from under the chin to the sash.
    { on: 'body', clip: true, fill: 'pattern',
      nodes: [[40, 22, 1], [-8, 70, 1], [-9.3, 77, 1], [-5.1, 77, 1], [49.9, 22, 1]] },
    // Eight of the yukata's pale blue dots, scattered over both panels and kept clear of the collar, so that
    // they read as a print on the cloth. Four dots, two of them beside the collar, read as a jacket's buttons.
    { on: 'body', clip: true, fill: 'pattern', round: 0.5, polys: [[-40, 52, 3.4, 12], [38, 56, 3.4, 12],
      [-54, 92, 3.4, 12], [-24, 96, 3.4, 12], [6, 90, 3.4, 12], [34, 95, 3.4, 12], [58, 88, 3.4, 12],
      [0, 106, 3.4, 12]] },
    // The sash round the waist, in the pale blue of the dots, bowed down in the middle as it follows the round body.
    // The robe in EVE HP/2508.png is tied at the front instead; without a sash, a crossed robe reads as a dressing
    // gown.
    { on: 'body', clip: true, fill: 'pattern', nodes: [[-100, 70, 1, 6], [100, 70, 1], [100, 81, 1, -6], [-100, 81, 1]] },
    // The forepaws on the ground between the hind feet.
    { on: 'body', kind: 'ellipse', fill: 'fur', cx: -15, cy: 121, rx: 12.5, ry: 10 },
    { on: 'body', kind: 'ellipse', fill: 'fur', cx: 15, cy: 121, rx: 12.5, ry: 10 },
    // The hind feet, soles to the front, as in EVE HP/2507.png: a pink pad under three pink toe beans on each.
    { on: 'body', kind: 'ellipse', fill: 'fur', cx: -48, cy: 114, rx: 19, ry: 16 },
    { on: 'body', kind: 'ellipse', fill: 'fur', cx: 48, cy: 114, rx: 19, ry: 16 },
    { on: 'body', kind: 'ellipse', fill: 'blush', cx: -48, cy: 119, rx: 8.5, ry: 6.5 },
    { on: 'body', kind: 'ellipse', fill: 'blush', cx: 48, cy: 119, rx: 8.5, ry: 6.5 },
    { on: 'body', fill: 'blush', round: 0.5, polys: [[-58, 108, 3.4, 8], [-48, 105, 3.4, 8], [-38, 108, 3.4, 8],
      [38, 108, 3.4, 8], [48, 105, 3.4, 8], [58, 108, 3.4, 8]] },
    // The twisted red-and-white cord that almost every work showing his feet ties around one ankle, here his right
    // (the viewer's left), just below the hem where the foot meets the leg: a red band, bowed around the ankle and
    // clipped to the body, crossed by two slanted white twists. The red carries the band's shape, since a white band
    // would leave only red slashes, which read as scratches.
    { on: 'body', clip: true, fill: 'cord', round: 0.5,
      nodes: [[-64, 89, 1, 12], [-33, 89, 1, 0], [-33, 100, 1, -12], [-64, 100, 1, 0]] },
    { on: 'body', fill: 'fur', nodes: [[-53, 89.8, 1], [-48.5, 89.8, 1], [-52.5, 100.6, 1], [-57, 100.6, 1]] },
    { on: 'body', fill: 'fur', nodes: [[-43, 90.2, 1], [-38.5, 90.2, 1], [-42.5, 100.8, 1], [-47, 100.8, 1]] },
  ],
  // The paws reach y ~131, so squash and stretch pivot about that height.
  rig: { ground: 131 },
  views: {
    // The icon, whose eyes are set as far apart as the spec's, so that the two line up (pf.py compare).
    icon: { w: 1679, h: 1629, x: 859, y: 1023, scale: 4.53, rotate: 0 },
    // The house close-up (1254 px, head tipped 20°). There is no house-style reference for YuanYuan yet.
    closeup: { w: 1254, h: 1254, x: 450, y: 835, scale: 5.5, rotate: 20 },
  },
});
