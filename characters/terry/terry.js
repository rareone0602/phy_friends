// Character spec for Terry, a pup-like yellow plush toy with two very large floppy ears.
// Pictures: examples/front.png, turnaround.gif, sitting.png, standing.png, paws.png, soles.png.
// Colors are taken from the pictures: one butter yellow throughout. The ears sit behind the face,
// so they take its house shade (furShade).
// As a stuffed toy, Terry is drawn with soft round shapes, without fur tufts or seams. Terry is one figure, which sits
// and stands on the same limbs.
PhyFriends.define('terry', {
  palette: {
    bg: '#1c1d21',
    fur: '#fce08e',        // Butter yellow, used throughout. Its house shade (furShade) fills the ears.
    head: 'fur',
    face: 'fur',
    ear: 'furShade',
    earInner: '#a47a4c',   // The dark inside of each ear under the flap (in every front view of the turnaround), warm so that it does not read as an eye.
    iris: 'ink',
    ink: '#29231c',        // Near-black, faintly warm, as every picture draws the eyes.
    blush: '#f8b9a2',      // The art has no blush; this soft peach pink is chosen to read on the yellow.
    tongue: 'blush',
    body: 'furShade',
    tail: 'cream',
    arm: 'fur',
    paw: 'fur',
    leg: 'furShade',
    foot: 'fur',
    cream: '#fef0c8',      // The bib and the tail (white in front.png), as one pale cream that stays visible on paper.
    pad: '#6f573f',        // The dark felt soles of the hind feet.
  },
  // The head is large, round and plush, widest at eye level. The ears cover its upper sides.
  head: { cx: 0, cy: -24, rx: 94, ry: 78 },
  // The cheeks and muzzle, in the head's yellow, are drawn in front of the lower half of the ears so that
  // the ears hang behind the face.
  face: { cx: 0, cy: 16, rx: 81, ry: 38 },
  // The ears are very large and floppy: soft lobes that hang from beside the crown to the jaw, with their
  // tops slightly above the crown, drawn over the upper sides of the head (over); the face, the blush, the eyes and
  // the mouth stay on top of them. The ear itself is a stub, and the lobe is an extra on the ears, so it swings about
  // the stub, which sits high in the lobe. A positive ear rotation flops the lobes in, and a negative one lifts them out.
  ears: { base: [-60, -86], angle: 180, width: 6, length: 6, over: true },
  // As a stuffed toy, Terry has no hair.
  hair: false,
  // The eyes are plain tall pills, set wide and low. Setting arc: 1 draws the happy, closed and squint
  // strokes at the full eye width.
  eyes: { x: 33, y: 2, w: 13, h: 32, stroke: 4.5, arc: 1 },
  // The blush sits under the outer corner of each eye, tipped up to follow the cheek, below the dark insides of the ears.
  blush: { x: 52, y: 26, rx: 11, ry: 6.5, tilt: 10 },
  // There is no mouth by default (the nose and small mouth in the pictures are omitted); when open, it is
  // a soft mouth without a fang.
  mouth: { y: 22, size: 3.8 },
  // The body is small under the large head, and an onigiri (a rice ball): narrow under the chin, broad and flat at
  // the base. It sits behind the limbs, which share its yellow, so it takes the house shade.
  body: { cx: 0, cy: 80, rx: 63, ry: 40, onigiri: 1 },
  // The tail is small and curly, behind the right hip: a thin plume bent all the way around into a
  // spiral. Setting step: 4 keeps it smooth.
  tail: { base: [56, 100], angle: 10, length: 70, width: 16, bend: 330, taper: 0.3, root: 0, step: 4, fluff: [] },
  // The limbs, on the house template. Seated, as in sitting.png, the forelegs are straight columns side by side in
  // front, their round ends on the ground (paw), so the arms fold into them (length 0) rather than hang down to
  // them, and the large round hind feet point at us at either side (foot), their dark felt soles showing (extras).
  // Standing, as in standing.png, they are short round arms and straight round legs. The feet keep the head's
  // yellow, as seated.
  stand: {
    seat: { paw: { cx: 18, cy: 106, rx: 12.5, ry: 25 }, foot: { cx: 53, cy: 114, rx: 21, ry: 17 }, arms: { length: 0 } },
  },
  extras: [
    // Ear extras are in ear-local space (base on the root, the lobe hanging along -y, +x outward).
    // The lobe: a large soft oval whose top rises about 10 above the crown (the turnaround's M) and whose
    // inner edge lies just outside the eye.
    { feature: 'earLobes', on: 'ears', kind: 'ellipse', fill: 'furShade', cx: 16, cy: -45, rx: 35, ry: 71, rot: 6 },
    // The dark inside of the ear: a crescent beside the cheek, cut by a lobe-colored oval so that it stays a
    // crescent (never a pill) when a head turn slides the face off it.
    { feature: 'earInner', on: 'ears', kind: 'ellipse', fill: 'earInner', cx: 22, cy: -92, rx: 10, ry: 17, rot: -10 },
    { feature: 'earInner', on: 'ears', kind: 'ellipse', fill: 'furShade', cx: 16, cy: -96, rx: 10, ry: 17, rot: -10 },
    // The bib: a pale patch under the chin, its edge in soft scallops, as narrow as the top of the body. It lies
    // over the tops of the arms, as a scarf does (scarf).
    { feature: 'chest', on: 'scarf', fill: 'cream', cx: 0, cy: 59, rx: 40, ry: 27,
      fluff: [{ from: 10, to: 170, n: 6, len: 6, depth: 0.04, b1: -40, b2: -40, jit: 0 }] },
    // Feet extras are in the seated foot's space (its center on the origin, +x toward the center line). The round
    // felt sole faces the viewer only while Terry sits, so it flattens as the foot tips down (sole).
    { feature: 'soles', on: 'feet', sole: true, kind: 'ellipse', fill: 'pad', cx: -2, cy: 1, rx: 12, ry: 12.5 },
  ],
  // The paws reach y ~131, so squash and stretch pivot about that height.
  rig: { ground: 131 },
  views: {
    // The house close-up (1254 px, head tipped 20°). There is no house-style reference for Terry yet.
    closeup: { w: 1254, h: 1254, x: 450, y: 835, scale: 5.5, rotate: 20 },
  },
});
