// Terry — a yellow plush toy, pup-like, with two huge floppy ears. Pictures: examples/front.png, turnaround.gif, sitting.png, standing.png, paws.png, soles.png
// One yellow all over, the pictures' butter; the ears sit behind the face, so they take its house shade (furShade).
// A stuffed toy: soft round shapes, no fur tufts, no seams.
PhyFriends.define('terry', {
  palette: {
    bg: '#1c1d21',
    fur: '#fce08e',        // butter yellow, all over; the ears are its house shade
    earInner: '#a47a4c',   // the dark inside of each ear under the flap (in every front view of the turnaround), warm so it isn't an eye
    eye: '#29231c',        // near-black, faintly warm
    blush: '#f8b9a2',      // the art has none: a soft peach pink that reads on the yellow
    cream: '#fef0c8',      // the bib and the tail (white in front.png), one pale cream that holds on paper
    pad: '#6f573f',        // the dark felt soles of the hind feet
  },
  // a big round plush head, widest at eye level; the ears cover its upper sides
  head: { cx: 0, cy: -24, rx: 94, ry: 78 },
  // Two huge floppy ears: soft lobes hanging from beside the crown to the jaw, their tops a little above it,
  // drawn over the head's upper sides (see order). The ear itself is a stub; the lobe is an extra on
  // the ears, so it swings about the stub, high in the lobe: + flops the lobes in, - lifts them out.
  ears: { base: [-60, -86], angle: 180, width: 6, length: 6, color: 'furShade' },
  // the cheeks and muzzle, in the head's yellow, in front of the ears' lower half: so the ears hang behind the face
  face: { cx: 0, cy: 16, rx: 81, ry: 38, color: 'fur' },
  // plain tall pills, set wide and low; arc: 1 draws the happy / closed / squint strokes eye-wide
  eyes: { x: 33, y: 2, w: 13, h: 32, stroke: 4.5, arc: 1 },
  // under the outer corner of each eye, tipped up to follow the cheek, below the ears' dark insides
  blush: { x: 52, y: 26, rx: 11, ry: 6.5, tilt: 10 },
  // none by default (the picture's nose and little mouth are dropped); open, a soft mouth, no fang
  mouth: { y: 22, size: 3.8, tongue: 'blush' },
  // sitting, small and round under the big head; behind the legs and feet (the same yellow), so in its house shade
  body: { cx: 0, cy: 80, rx: 63, ry: 40, color: 'furShade' },
  // a small curly tail behind the right hip: a thin plume bent right round into a spiral (step: 4 keeps it smooth)
  tail: { base: [56, 100], angle: 10, length: 70, width: 16, bend: 330, taper: 0.3, root: 0, step: 4, color: 'cream', fluff: [] },
  extras: [
    // Ear extras are in ear-local space (base on the root, the lobe hanging along -y, +x outwards).
    // the lobe: a big soft oval, its top rising about 10 above the crown (the turnaround's M), its inner edge just outside the eye
    { on: 'ears', kind: 'ellipse', fill: 'furShade', cx: 16, cy: -45, rx: 35, ry: 71, rot: 6 },
    // the dark inside of the ear: a crescent beside the cheek, carved by a lobe-coloured oval so it stays a
    // crescent (never a pill) when a head turn slides the face off it
    { on: 'ears', kind: 'ellipse', fill: 'earInner', cx: 22, cy: -92, rx: 10, ry: 17, rot: -10 },
    { on: 'ears', kind: 'ellipse', fill: 'furShade', cx: 16, cy: -96, rx: 10, ry: 17, rot: -10 },
    // the bib: a pale cloud under the chin, its edge in soft scallops
    { on: 'body', fill: 'cream', cx: 0, cy: 58, rx: 47, ry: 28,
      fluff: [{ from: 10, to: 170, n: 6, len: 6, depth: 0.04, b1: -40, b2: -40, jit: 0 }] },
    // straight forelegs, round paws on the ground
    { on: 'body', kind: 'ellipse', fill: 'fur', cx: -18, cy: 106, rx: 12.5, ry: 25 },
    { on: 'body', kind: 'ellipse', fill: 'fur', cx: 18, cy: 106, rx: 12.5, ry: 25 },
    // big round hind feet sticking forward, their round felt soles facing us
    { on: 'body', kind: 'ellipse', fill: 'fur', cx: -53, cy: 114, rx: 21, ry: 17 },
    { on: 'body', kind: 'ellipse', fill: 'fur', cx: 53, cy: 114, rx: 21, ry: 17 },
    { on: 'body', kind: 'ellipse', fill: 'pad', cx: -55, cy: 115, rx: 12, ry: 12.5 },
    { on: 'body', kind: 'ellipse', fill: 'pad', cx: 55, cy: 115, rx: 12, ry: 12.5 },
  ],
  // the ears lie over the head's upper sides; the eyes, blush and mouth stay on top of them
  order: ['base', 'earL', 'earR', 'face', 'blush', 'eyes', 'mouth'],
  // the paws reach y ~131: squash and stretch about that
  rig: { ground: 131 },
  views: {
    // the house close-up (1254 px, head tipped 20°); Terry has no house-style reference yet
    closeup: { w: 1254, h: 1254, x: 450, y: 835, scale: 5.5, rotate: 20 },
  },
});
