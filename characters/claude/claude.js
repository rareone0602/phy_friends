// Character spec for Claude, the model that drew this gallery, as Claude Code draws it on its welcome screen: a small
// terracotta block with two tall eyes, a stub of an arm on either side and four short legs.
// Picture: the mascot in Claude Code 2.1.284, three lines of block characters, each cell two quadrant pixels wide and
// two tall. A terminal cell is about twice as tall as it is wide, so a quadrant pixel is one unit wide and two units
// tall; the spec draws one such unit as 16 head units, which makes the eyes as tall as the house's. In those units the
// body is 13 wide and 8 tall, the eyes are notches one wide and two tall, the arms stand out two from each side, and
// the legs are one wide and two tall. Its routine (below) follows examples/claude-claude-code.gif, the animated mascot
// getting out its laptop.
PhyFriends.define('claude', {
  palette: {
    bg: '#1c1d21',
    body: '#d77757',       // The mascot's one color (clawd_body in Claude Code's themes, rgb(215, 119, 87)).
    eye: '#29231c',        // Near-black, faintly warm: the notches show the terminal's black through the body.
    laptop: '#888888',     // The gray of the laptop in the animated mascot's GIF.
    blush: '#ee8e8e',      // The mascot has no blush. On the terracotta a pale pink reads as a highlight, so this is a
                           // soft rose, a little lighter than the body and redder.
  },
  // The body is the head: one block, from 3 units above the eyes to 5 below, with its edges bowed out a little so
  // that it reads as drawn rather than as pixels. Each corner is rounded by an eighth of the shorter edge beside it,
  // and the sides are split where the arms' lower edges meet them, so the top corners are soft and the bottom ones
  // stay nearly square: the sides run straight down into the outer legs, as in the glyphs, rather than curving in
  // over them as a cushion does over a sofa's legs.
  head: {
    nodes: [[-104, -48, 1, -3], [104, -48, 1, -3], [104, 48, 1], [104, 80, 1, -3], [-104, 80, 1], [-104, 48, 1, -3]],
    round: 0.125, color: 'body',
  },
  // The arms take the ears' places, so that they rise when the friend is pleased or startled, as the mascot raises
  // its arms. Each arm is an extra in the body's own color, as the glyphs draw it, and turns about a shoulder 4 units
  // inside the block, out of sight; from there the house's largest ear lift (16 degrees, when startled) raises its
  // end most of the row by which the glyphs' arms-up pose raises it. The ear's own shape sits at the shoulder, hidden
  // by the block.
  ears: { base: [-40, 32], angle: 90, width: 30, length: 30, tip: 14, color: 'body' },
  // The eyes are 4 units either side of the middle, 1 wide and 2 tall. They look as far as the glyphs move the
  // notches to look aside, one unit, where the house's eyes move 6 head units.
  eyes: { x: 64, y: 0, w: 16, h: 32, stroke: 5.5, arc: 1, color: 'eye', range: 16 },
  // The blush sits below and outside each eye, level with the arms, low enough that the eyes clear it when they
  // look down.
  blush: { x: 86, y: 32, rx: 12, ry: 7, tilt: 10 },
  mouth: { y: 30, size: 4.5 },
  extras: [
    // Ear extras are in ear-local space (base on the origin, tip up, +x toward the top of the head): the arm, a
    // rounded bar 2 units tall from the shoulder to 2 units past the side.
    { on: 'ears', fill: 'body', round: 0.3, nodes: [[-16, -96, 1], [16, -96, 1], [16, 0, 1], [-16, 0, 1]] },
    // Claude's laptop, which it brings out on its third hi (routine, below): a gray base and screen, drawn only while
    // the pose shows them. In its hand it is drawn on the right arm, in arm-local space, once for each way the arm
    // holds it, so that it stays level as the arm swings it up and out; set down, it stands open on the ground beside
    // Claude, where it stays while Claude hops, then folds shut.
    { on: 'earR', show: 'laptopTilted', fill: 'laptop', round: 0.3, nodes: [[7.8, -95.8, 1], [-33.2, -136.8, 1], [-41, -129, 1], [0, -88, 1]] },
    { on: 'earR', show: 'laptopTilted', fill: 'laptop', round: 0.3, nodes: [[-25.5, -129, 1], [-33.2, -136.8, 1], [-12.7, -168.6, 1], [-4.9, -160.8, 1]] },
    { on: 'earR', show: 'laptopUp', fill: 'laptop', round: 0.3, nodes: [[0, -99, 1], [-58, -99, 1], [-58, -88, 1], [0, -88, 1]] },
    { on: 'earR', show: 'laptopUp', fill: 'laptop', round: 0.3, nodes: [[-47, -99, 1], [-58, -99, 1], [-66, -136, 1], [-55, -136, 1]] },
    { on: 'earR', show: 'laptopOut', fill: 'laptop', round: 0.3, nodes: [[10.8, -89.9, 1], [0.8, -147, 1], [-10.1, -145.1, 1], [0, -88, 1]] },
    { on: 'earR', show: 'laptopOut', fill: 'laptop', round: 0.3, nodes: [[2.7, -136.2, 1], [0.8, -147, 1], [35.8, -161.3, 1], [37.7, -150.5, 1]] },
    { on: 'earR', show: 'laptopShut', fill: 'laptop', round: 0.3, nodes: [[14, -88, 1], [14, -146, 1], [0, -146, 1], [0, -88, 1]] },
    { on: 'ground', show: 'laptop', fill: 'laptop', round: 0.3, nodes: [[84, 101, 1], [140, 101, 1], [140, 112, 1], [84, 112, 1]] },
    { on: 'ground', show: 'laptop', fill: 'laptop', round: 0.3, nodes: [[129, 106, 1], [140, 106, 1], [156, 68, 1], [145, 68, 1]] },
    { on: 'ground', show: 'laptopFolding', fill: 'laptop', round: 0.3, nodes: [[84, 101, 1], [140, 101, 1], [140, 112, 1], [84, 112, 1]] },
    { on: 'ground', show: 'laptopFolding', fill: 'laptop', round: 0.3, nodes: [[129, 106, 1], [140, 106, 1], [112, 72, 1], [101, 72, 1]] },
    // The block's side, which shows as Claude turns to its laptop, as the mascot draws it: a band down its right side
    // (the viewer's left), clipped to the block. It turns away behind the front, so it takes the one shade.
    { on: 'base', show: 'side', clip: true, fill: 'bodyShade', nodes: [[-130, -70, 1], [-60, -70, 1], [-60, 100, 1], [-130, 100, 1]] },
    // The four legs, two under each end, as the mascot stands: 1 unit wide and 2 tall below the block. They are the
    // body, which sits under the head, so they wear the body's house shade (the one shade layer). Each reaches 24
    // behind the block, so that it stays joined when the block rocks as far as the house's clips tilt a head
    // (11 degrees).
    ...[-96, -64, 64, 96].map(x => ({
      on: 'body', fill: 'bodyShade', round: 0.3, nodes: [[x - 8, 56, 1], [x + 8, 56, 1], [x + 8, 112, 1], [x - 8, 112, 1]],
    })),
  ],
  // Claude's third hi in a row (where the others go shy, which it does not) plays the routine of Claude Code's animated
  // mascot, frame for frame as its GIF times them: it winks as it steps aside, swings its laptop up and sets it down
  // open, hops round to sit at it side-on and types, then folds it away and turns back. Each key is [seconds, value,
  // ease]; 'hold' steps to a key, as the GIF's frames do. `says` is told to a screen reader, and `saysStill` under
  // reduced motion, where only the face changes and it only winks.
  routine: {
    says: 'gets out its laptop and types', saysStill: 'winks', duration: 3.6,
    keys: {
      x: [[0, 0], [0.39, 0], [0.64, -24], [3.19, -24], [3.46, 0]],
      y: [[0.39, 0], [0.5, -10], [0.64, 0], [1.22, 0], [1.3, -14], [1.39, 0, 'in'], [3.19, 0], [3.3, -10], [3.46, 0, 'in']],
      headY: [[0.39, 0], [0.46, 6], [0.81, 0], [1.3, 0], [1.39, 16, 'hold'], [3.03, 16], [3.1, 6, 'hold'], [3.19, 6, 'hold'], [3.46, 0]],
      tilt: [[0.39, 0], [0.46, 6], [0.81, 0], [3.1, 0], [3.19, 6, 'hold'], [3.46, 0]],
      lookX: [[0.39, 0], [0.46, 0.4], [0.81, 0.3], [1.14, 0.8], [1.3, 1, 'hold'], [3.03, 1], [3.1, 0.4, 'hold'], [3.19, 0, 'hold']],
      lookY: [[0.39, 0], [0.46, 1], [0.81, 0, 'hold'], [1.14, 0.5, 'hold'], [1.3, 0, 'hold'], [1.39, 0.4, 'hold'], [3.1, 0, 'hold'], [3.19, 1, 'hold'], [3.46, 0]],
      turnX: [[1.22, 0], [1.3, 0.8, 'hold'], [3.03, 0.8], [3.1, 0.2, 'hold'], [3.19, 0, 'hold']],
      earL: [[0.39, 0], [0.46, -14, 'hold'], [0.81, 0, 'hold'], [1.3, -90, 'hold'], [1.39, 180, 'hold'], [3.1, -6, 'hold'], [3.19, -14, 'hold'], [3.46, 0, 'hold']],
      earR: [[0.39, 0], [0.46, 12, 'hold'], [0.81, -45, 'hold'], [0.88, -90, 'hold'], [1.05, -10, 'hold'], [1.14, 0, 'hold'], [1.3, -90, 'hold'], [1.39, -75, 'hold'], [1.48, -8, 'hold'], [1.57, 36, 'hold'], [1.66, 14, 'hold'], [1.75, -8, 'hold'], [1.82, 36, 'hold'], [1.91, 14, 'hold'], [2, -8, 'hold'], [2.09, 36, 'hold'], [2.18, 14, 'hold'], [2.25, -8, 'hold'], [2.34, 36, 'hold'], [2.43, 14, 'hold'], [2.52, -8, 'hold'], [2.61, 36, 'hold'], [2.68, 14, 'hold'], [2.77, -8, 'hold'], [2.86, 36, 'hold'], [2.94, 14, 'hold'], [3.03, -75, 'hold'], [3.1, 0, 'hold'], [3.19, 12, 'hold'], [3.46, 0, 'hold']],
      eyeL: [[0.39, 'closed'], [0.81, null]],
      show: [[0.81, 'laptopTilted'], [0.88, 'laptopUp'], [1.05, 'laptopOut'], [1.14, 'laptop'], [1.3, 'laptop side'], [3.03, 'laptopFolding side'], [3.1, 'laptopShut'], [3.19, '']],
    },
  },
  // The legs reach y 112, so squash and stretch pivot about that height, and the block turns about the middle of its
  // bottom edge, so that it rocks on its legs.
  rig: { ground: 112, neck: [0, 80] },
  // Claude keeps every rule but the shape, and its ears are arms, so the emotion library (src/emotion.js) leaves it
  // out: it moves as the others do, but shows no feelings.
  emotions: false,
});
