// A candidate that lost to the reviewed design in characters/claude/claude.js: the first draft. Kept per STYLE.md, principle 1.
// Character spec for Claude, the model that drew this gallery, as Claude Code draws it on its welcome screen: a small
// terracotta block with two tall eyes, a stub of an arm on either side and four short legs.
// Picture: the mascot in Claude Code 2.1.284, three lines of block characters, each cell two quadrant pixels wide and
// two tall. A terminal cell is about twice as tall as it is wide, so a quadrant pixel is one unit wide and two units
// tall; the spec draws one such unit as 16 head units, which makes the eyes as tall as the house's. In those units the
// body is 13 wide and 8 tall, the eyes are notches one wide and two tall, the arms stand out two from each side, and
// the legs are one wide and two tall.
PhyFriends.define('claude', {
  palette: {
    bg: '#1c1d21',
    body: '#d77757',       // The mascot's one color (clawd_body in Claude Code's themes, rgb(215, 119, 87)).
    eye: '#29231c',        // Near-black, faintly warm: the notches show the terminal's black through the body.
    blush: '#f8b3a4',      // The mascot has no blush; this soft pink is chosen to read on the terracotta.
  },
  // The body is the head: one block, from 3 units above the eyes to 5 below, with the corners rounded as a pencil
  // rounds them, and the edges bowed out a little so that it reads as drawn rather than as pixels.
  head: {
    nodes: [[-104, -48, 1, -3], [104, -48, 1, -3], [104, 80, 1, -3], [-104, 80, 1, -3]], round: 0.14, color: 'body',
  },
  // The arms are the ears' places: each stands straight out from the middle of a side, 2 units long and 1 tall,
  // behind the body, so they take the body's house shade (the one shade layer). As ears, they rise when the friend is
  // pleased or startled, which is how the mascot raises its arms.
  ears: { base: [-104, 32], angle: 90, width: 30, length: 30, tip: 14, color: 'bodyShade' },
  // The eyes are 4 units either side of the middle, 1 wide and 2 tall.
  eyes: { x: 64, y: 0, w: 16, h: 32, stroke: 5.5, arc: 1, color: 'eye' },
  blush: { x: 86, y: 28, rx: 12, ry: 7, tilt: 10 },
  mouth: { y: 30, size: 4.5 },
  extras: [
    // Ear extras are in ear-local space (base on the origin, tip up, +x toward the top of the head): the arm is a
    // rounded square, reaching 32 out from the side and tucked 14 behind the body.
    { on: 'ears', fill: 'bodyShade', round: 0.3, nodes: [[-16, -32, 1], [16, -32, 1], [16, 14, 1], [-16, 14, 1]] },
    // The four legs, two under each end, as the mascot stands: 1 unit wide and 2 tall below the body, tucked 14
    // behind it, in the body's house shade.
    ...[-96, -64, 64, 96].map(x => ({
      on: 'body', fill: 'bodyShade', round: 0.3, nodes: [[x - 8, 66, 1], [x + 8, 66, 1], [x + 8, 112, 1], [x - 8, 112, 1]],
    })),
  ],
  // The legs reach y 112, so squash and stretch pivot about that height, and the body rocks on its legs.
  rig: { ground: 112, neck: [0, 80] },
});
