// A candidate, the runner-up to characters/claude/claude.js: the glyphs' hard corners on the block, the arms and the
// legs, softened only as far as a pencil rounds a corner. Kept per STYLE.md, principle 1.
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
    blush: '#ee8e8e',      // The mascot has no blush. On the terracotta a pale pink reads as a highlight, so this is a
                           // soft rose, a little lighter than the body and redder.
  },
  // The body is the head: one block, from 3 units above the eyes to 5 below, with its edges bowed out a little so
  // that it reads as drawn rather than as pixels. Its corners keep the glyphs' square cut, rounded only by 5 head
  // units, about as far as a pencil rounds a drawn corner.
  head: {
    nodes: [[-104, -48, 1, -2], [104, -48, 1, -2], [104, 80, 1, -2], [-104, 80, 1, -2]], round: 0.04, color: 'body',
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
    // bar 2 units tall, as square as the block, from the shoulder to 2 units past the side.
    { on: 'ears', fill: 'body', round: 0.12, nodes: [[-16, -96, 1], [16, -96, 1], [16, 0, 1], [-16, 0, 1]] },
    // The four legs, two under each end, as the mascot stands: 1 unit wide and 2 tall below the block. They are the
    // body, which sits under the head, so they wear the body's house shade (the one shade layer). Each reaches 24
    // behind the block, so that it stays joined when the block rocks as far as the house's clips tilt a head
    // (11 degrees).
    ...[-96, -64, 64, 96].map(x => ({
      on: 'body', fill: 'bodyShade', round: 0.15, nodes: [[x - 8, 56, 1], [x + 8, 56, 1], [x + 8, 112, 1], [x - 8, 112, 1]],
    })),
  ],
  // The legs reach y 112, so squash and stretch pivot about that height, and the block turns about the middle of its
  // bottom edge, so that it rocks on its legs.
  rig: { ground: 112, neck: [0, 80] },
});
