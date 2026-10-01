// The draft of characters/jiaoyue/jiaoyue.js as phy added it, before it was fitted to the house conventions and the
// standing template. Kept per STYLE.md, principle 1.
PhyFriends.define('jiaoyue', {
  palette: {
    bg: '#1c1d21', fur: '#d6cce4', face: '#f4f1f3', hair: '#d6cce4',
    earInner: '#b7a3d5', eye: '#302630', eyeBlue: '#56b9dd',
    blush: '#e7cbdc', chest: '#eae5f0', brow: '#aaa1b7',
    tail: '#9c89c6', tailTip: '#f4f1f3',
  },
  head: { cx: 0, cy: -20, rx: 85, ry: 68,
    fluff: [{ from: -22, to: 20, n: 2, len: 8, lean: 4, depth: 0.07, b1: -26, b2: 8, jit: 0, sym: true }] },
  face: { cx: 0, cy: 16, rx: 75, ry: 42,
    fluff: [
      { from: -26, to: 25, n: 2, len: 4, lean: 3, depth: 0.08, b1: -20, b2: 5, jit: 0, sym: true },
      { from: 235, to: 305, n: 1, len: -4, b1: 0, b2: 0, jit: 0 },
    ] },
  ears: { base: [-59, -67], angle: 28, width: 87, length: 97, lean: 8, tip: 5, b1: -14, b2: -8,
    inner: { scale: 0.63, dx: 1, dy: -9 } },
  hair: {
    cx: 0, cy: -66, rx: 70, ry: 36,
    tips: [
      [-69, -82, -8, -9, [-36, -99]], [-9, -110, -10, -10, [17, -99]],
      [62, -88, -6, -10, [82, -51]], [80, -34, 5, -9, [69, -29]],
      [57, -13, 8, -11, [39, -36]], [22, -17, 7, -9, [4, -36]],
      [-16, -16, -7, 8, [-40, -36]], [-58, -12, -9, 8, [-68, -28]],
      [-80, -37, -8, 6, [-79, -70]],
    ],
  },
  eyes: { x: 34, y: 4, w: 15, h: 32, stroke: 5.2, arc: 1, color: 'eyeBlue',
    shine: { color: '#e9faff', x: 2, y: -6, rx: 2.8, ry: 7 } },
  blush: { x: 55, y: 26, rx: 11, ry: 6, tilt: 10 },
  mouth: { y: 32, size: 4.6 },
  body: { cx: 0, cy: 81, rx: 66, ry: 50, color: 'furShade',
    fluff: [{ from: -60, to: -25, n: 2, len: 11, depth: 0.04, b1: -15, b2: -22, jit: 0, sym: true }] },
  tail: { base: [-54, 102], angle: 54, length: 147, width: 105, bend: -73, taper: 0.7,
    root: 0.5, color: 'tail', tip: { at: 0.64, color: 'tailTip' } },
  extras: [
    { on: 'body', fill: 'chest', cx: 0, cy: 76, rx: 45, ry: 36,
      fluff: [{ from: 25, to: 155, n: 5, len: 9, depth: 0.07, b1: -22, b2: 6, jit: 0 }] },
    { on: 'body', kind: 'ellipse', fill: 'fur', cx: -28, cy: 103, rx: 20, ry: 28, rot: -9 },
    { on: 'body', kind: 'ellipse', fill: 'fur', cx: 28, cy: 103, rx: 20, ry: 28, rot: 9 },
    { on: 'body', kind: 'ellipse', fill: 'face', cx: -30, cy: 121, rx: 21, ry: 12 },
    { on: 'body', kind: 'ellipse', fill: 'face', cx: 30, cy: 121, rx: 21, ry: 12 },
    { on: 'hair', kind: 'ellipse', fill: 'brow', cx: -30, cy: -49, rx: 5.5, ry: 4, rot: -22 },
    { on: 'hair', kind: 'ellipse', fill: 'brow', cx: 30, cy: -49, rx: 5.5, ry: 4, rot: 22 },
  ],
  rig: { ground: 131 },
  views: {
    work_9: { w: 512, h: 512, x: 256, y: 255, scale: 1.55,
      pose: { eyes: 'happy' } },
    PENUP_20261001_192151: { w: 649, h: 821, x: 326, y: 445, scale: 2.4 },
  },
});
