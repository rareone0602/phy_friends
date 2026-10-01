// An alternative to characters/whitedeer/whitedeer.js: WhiteDeer as the sheet's front view draws him, without the
// sailor suit and hat of the dressed figure, so that his white chest shows. Kept per STYLE.md, principle 1.
// Built from the main spec by out/scratch/whitedeer/make_plain.py; edit that spec and rerun it.
// Character spec for WhiteDeer, a pale blue deer with branched blue antlers, big leaf-shaped ears, a white face split
// by a pale blue blaze, two-tone blue eyes, blue hands with pink pads, blue hooves and a short tail with a white
// underside.
// Pictures: examples/IMG_8961.PNG (the reference sheet: front, back, dressed, the eyes and the tail; the color
// standard). The paintbrush that the sheet gives as his accessory is left for now; a later animation may give it to
// him as a prop.
// Colors are taken from the sheet's flat fills. Its pale blue fur would vanish on paper, so it is deepened, and the
// pale blues beside it (the inner ears, the hands and hooves, the forehead spot) by the same step, so that each stays
// as far from the fur as on the sheet.
PhyFriends.define('whitedeer', {
  palette: {
    bg: '#1c1d21',
    fur: '#b6def3',        // The pale blue of the head, body, arms and legs (#cae8f8), deepened to stay visible on paper. Its house shade (furShade) fills the body, which sits under the head, and the legs.
    head: 'fur',
    face: '#efeef3',       // The white of the face, the chest and the tail's underside (#ffffff), deepened to mumuyou's depth to stay visible on paper.
    hair: 'fur',
    ear: 'fur',
    earInner: '#7ccbf4',   // The blue of the inner ears (#94d5f9), deepened by the fur's step so that the two stay as far apart.
    iris: '#59c2f9',       // The blue of the upper irises.
    ink: '#0c2762',        // The dark navy of the dressed figure's neckerchief, for the open mouth.
    blush: '#f4bcbb',      // The pink of the blush, also used for the pads of the hands.
    tongue: '#f09699',     // The pink of the tongue in the dressed figure.
    body: 'furShade',
    tail: 'fur',
    arm: 'fur',
    paw: 'hoof',
    leg: 'furShade',
    foot: 'hoof',
    antler: '#3c8af7',     // The blue of the antlers.
    hoof: '#74bff1',       // The deeper blue of the hands and hooves (#8cc9f6), deepened by the fur's step. Its house shade (hoofShade) fills the cleft of each hoof.
    eyeLow: '#8ae7fc',     // The cyan of the lower irises.
    spot: '#9acff5',       // The blue of the spot on the forehead (#afd9fa), deepened by the fur's step.
  },
  // The head is a broad dome, a little wider than tall.
  head: {
    cx: 0, cy: -20, rx: 86, ry: 68,
  },
  // The white muzzle and cheeks. As on the sheet, the white rises well above the eyes, so that the fringe and the
  // forehead spot lie on its edge; the blaze (an extra) divides its top. Setting len < 0 flattens the top, and the
  // range before it lifts the white under the fringe.
  face: {
    cx: 0, cy: 8, rx: 76, ry: 52,
    fluff: [{ from: 190, to: 250, n: 1, len: 10, b1: -22, b2: -22, jit: 0 },
      { from: 250, to: 305, n: 1, len: -6, b1: 0, b2: 0, jit: 0 }],
  },
  // The ears are big leaves, set wide and tipped well out, with large blue insides.
  ears: {
    base: [-64, -56], angle: 50, width: 62, length: 94, lean: 0, tip: 24, b1: -42, b2: -38,
    inner: { scale: 0.68, dx: 1, dy: -10 },
  },
  // The crown's tufts, in the fur's pale blue, and the broad fringe that sweeps from the crown down across his
  // right brow (the viewer's left) toward the blaze. It lies on the white, which shows its edge, and stops short of
  // the blaze, so that the white parts the two. Each tip is [x, y, bendIn, bendOut, following valley].
  hair: {
    cx: 0, cy: -64, rx: 66, ry: 34,
    tips: [
      [-60, -86, -8, -8, [-26, -104]], [8, -112, -10, -8, [30, -98]],
      [62, -84, -8, -6, [66, -60]], [56, -54, 6, 4, [-16, -52]],
      [-24, -24, 4, -18, [-72, -46]],
      [-80, -56, -6, 6, [-74, -74]],
    ],
  },
  // The eyes are tall pills in his own blue, with the sheet's cyan lower iris, its lower three-eighths, as a flat
  // mark clipped to each, so that it follows every glance and blink; the blue above holds the eye's shape on the
  // white. The dark lash over each eye and the highlights are line work and lighting, and are left out. Setting
  // arc: 1 draws the happy, closed and squint strokes at the full eye width.
  eyes: { x: 34, y: 4, w: 13, h: 32, stroke: 5, arc: 1,
    shine: { x: 0, y: 22, rx: 30, ry: 18, color: 'eyeLow' } },
  // The blush sits on the white under the outer corner of each eye, tipped up to follow the cheek.
  blush: { x: 56, y: 28, rx: 11, ry: 6.5, tilt: 8 },
  // There is no mouth by default (the sheet's :3 is omitted); when open, it shows the pink tongue of the dressed
  // figure.
  mouth: { y: 32, size: 4.4 },
  // The body is an onigiri (a rice ball): narrow under the chin, broad and flat at the base. It is in the house
  // shade.
  body: {
    cx: 0, cy: 82, rx: 64, ry: 49, onigiri: 1,
  },
  // The tail is a deer's short flag, behind his left hip (the viewer's right), as the back view draws it: it
  // sticks out to the side and curls up to a pale blue point, and its underside is white, cut into tufts that reach
  // up into the blue (an extra).
  tail: {
    base: [50, 106], angle: 62, length: 56, width: 44, bend: -50, taper: 0.75, root: 0.6,
    fluff: [{ from: 15, to: 80, n: 3, len: 8, lean: -5, depth: 0.05, b1: -20, b2: 5, jit: 0 }],
  },
  // The limbs, on the house template. Seated, the blue hands rest on the ground in front, and the blue hooves at
  // either side. Standing, the arms end in the blue hands, and the legs in the blue hooves.
  stand: {
    seat: { paw: { cx: 22, cy: 121, rx: 14, ry: 10 }, foot: { cx: 52, cy: 120, rx: 19, ry: 11, rot: -8 } },
  },
  extras: [
    // Cheek fluff under the head: a ruff whose spiky tufts stick out past the cheeks, as on the sheet. An n: 1 range
    // with len < 0 tucks the bottom in under the chin.
    { feature: 'cheekRuff', on: 'base', under: true, fill: 'fur', cx: 0, cy: 14, rx: 88, ry: 46,
      fluff: [{ from: -40, to: 20, n: 3, len: 16, lean: -2, depth: 0.1, b1: -30, b2: 12, jit: 0, sym: true },
        { from: 45, to: 135, n: 1, len: -12, b1: 5, b2: 5, jit: 0 }] },
    // The antlers, rising from the crown between the ears, in their own blue. As on the sheet, each is a stout beam
    // with a tine that branches outward low down and a fork of two at the top, every tine nearly as thick as the
    // beam. They are drawn under the head, so that the crown lies over their roots, and clear of the ears.
    { feature: 'antlers', on: 'base', under: true, fill: 'antler', round: 0.35, nodes: [[-24, -80, 1], [-28, -116, 1], [-14, -138, 1],
      [-17, -146, 1], [-25, -144, 1], [-36, -128, 1], [-38, -154, 1], [-44, -160, 1], [-51, -156, 1], [-52, -126, 1], [-72, -140, 1],
      [-80, -138, 1], [-80, -129, 1], [-56, -106, 1], [-46, -80, 1]] },
    { feature: 'antlers', on: 'base', under: true, fill: 'antler', round: 0.35, nodes: [[46, -80, 1], [56, -106, 1], [80, -129, 1],
      [80, -138, 1], [72, -140, 1], [52, -126, 1], [51, -156, 1], [44, -160, 1], [38, -154, 1], [36, -128, 1], [25, -144, 1],
      [17, -146, 1], [14, -138, 1], [28, -116, 1], [24, -80, 1]] },
    // The blaze: the pale blue of the forehead runs down between the eyes to the nose, narrowing, and parts the top of
    // the white.
    { feature: 'blaze', on: 'face', clip: true, fill: 'fur', round: 0.3, nodes: [[-15, -50, 1], [15, -50, 1], [4, 20, 1], [-4, 20, 1]] },
    // The spot on the forehead, above his left eye, in a deeper blue, resting on the white's edge as on the sheet.
    { feature: 'forehead', on: 'face', kind: 'ellipse', fill: 'spot', cx: 37, cy: -41, rx: 15, ry: 8.5, rot: -4 },
    // Ear extras are in ear-local space (base on the origin, tip up, +x toward the top of the head). The tuft in his
    // left ear (the viewer's right).
    { feature: 'earTufts', on: 'earR', clip: true, fill: 'fur', cx: -8, cy: -14, rx: 14, ry: 20,
      fluff: [{ from: 210, to: 330, n: 3, len: 9, lean: 3, depth: 0.05, b1: -20, b2: 6, jit: 0 }] },
    // The white chest: a broad oval down the front of the body, as on the sheet's front view.
    { feature: 'chest', on: 'body', clip: true, fill: 'face', cx: 0, cy: 88, rx: 32, ry: 34 },
    // Tail extras are drawn on the straight tail (base on the origin, tip at y -56, +x away from the body, which is
    // its underside here); the library bends them onto the curve. The white underside, its edge cut into tufts that
    // point toward the tip.
    { feature: 'tailUnderside', on: 'tail', clip: true, fill: 'face', cx: 22, cy: -18, rx: 20, ry: 34,
      fluff: [{ from: 160, to: 260, n: 3, len: 8, lean: -6, depth: 0.05, b1: -20, b2: 6, jit: 0 }] },
    // Paws extras are in the seated paw's space (its center on the origin, +x toward the center line). The pink pads
    // of the hands: a palm pad and three small ones above it; the sheet's fourth, the thumb's, is too small to keep.
    { feature: 'soles', on: 'paws', kind: 'ellipse', fill: 'blush', cx: 0, cy: 3, rx: 6, ry: 4.5 },
    { feature: 'soles', on: 'paws', fill: 'blush', round: 0.5, polys: [[-7, -4, 2.4, 8], [0, -6, 2.4, 8], [7, -4, 2.4, 8]] },
    // Feet extras are in the seated foot's space. The cleft of each hoof, a small notch at its front, in the hoof's
    // house shade, since it is the far side of the hoof seen through the split.
    { feature: 'hooves', on: 'feet', fill: 'hoofShade', round: 0.4, nodes: [[-1.5, 2, 1], [1.5, 2, 1], [2.5, 11, 1], [-2.5, 11, 1]] },
  ],
  // The paws reach y ~131, so squash and stretch pivot about that height.
  rig: { ground: 131 },
  views: {
    // The house close-up (1254 px, head tipped 20°). There is no house-style reference for WhiteDeer yet.
    closeup: { w: 1254, h: 1254, x: 450, y: 835, scale: 5.5, rotate: 20 },
  },
});
