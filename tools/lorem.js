// The lorem placeholder: a plain friend on the house template, in a neutral warm gray with a white face, chest, paws and
// feet, and nobody's markings, so that the shared body plan can be tuned without any one friend's design in the way
// (tools/tune.html). It keeps the house anatomy (PhyFriends.check finds nothing), so it sits, stands and moves as every
// friend does. It is not one of the friends: the cast does not name it, and no page but the tuning page loads it.
PhyFriends.define('lorem', {
  palette: {
    bg: '#1c1d21',
    fur: '#a89f95',        // A neutral warm gray. Its house shade (furShade) fills the body, which sits under the head.
    head: 'fur',
    face: '#efe9df',       // A warm white, deep enough to stay visible on paper: the muzzle, the chest, the paws and the feet.
    ear: 'fur',
    earInner: '#e8c6bd',
    iris: 'ink',
    ink: '#2b2622',
    blush: '#f3b6ad',
    tongue: 'blush',
    body: 'furShade',
    tail: 'fur',
    arm: 'fur',
    paw: 'face',
    leg: 'furShade',
    foot: 'face',
    tailTip: 'face',
  },
  head: { cx: 0, cy: -12, rx: 80, ry: 58, fluff: [{ from: -28, to: 28, n: 2, len: 11, lean: 3, depth: 0.08, jit: 0, sym: true }] },
  face: { cx: 0, cy: 24, rx: 56, ry: 20, fluff: [{ from: -30, to: 30, n: 2, len: 3, depth: 0.04, jit: 0, sym: true }] },
  ears: { base: [-46, -50], angle: 30, width: 62, length: 84, lean: 10, tip: 6, inner: { scale: 0.58, dy: -8 } },
  hair: false,
  eyes: { x: 33, y: 2, w: 13, h: 31, stroke: 4.5, arc: 1 },
  blush: { x: 53, y: 22, rx: 10, ry: 6, tilt: 12 },
  mouth: { y: 21, size: 3.8 },
  // The body is the house's onigiri (a rice ball), its base on the ground.
  body: { cx: 0, cy: 85, rx: 66, ry: 46, onigiri: 1 },
  // The house's default tail: a bushy plume behind the left side of the body, with a white tip.
  tail: { tip: { at: 0.72 } },
  // Seated, the white forepaws rest on the ground between the hind feet, which point at us at either side.
  stand: { seat: { paw: { cx: 18, cy: 121, rx: 12.5, ry: 10 }, foot: { cx: 50, cy: 120, rx: 19, ry: 11, rot: -8 } } },
  extras: [
    // A plain white chest, kept inside the body.
    { feature: 'chest', on: 'body', clip: true, fill: 'face', cx: 0, cy: 74, rx: 40, ry: 30 },
  ],
  rig: { ground: 131 },
});
