// A medal: a gold disc hung from a ribbon whose two ends meet above it.
PhyFriends.props.define('medal', {
  palette: {
    ribbon: '#7a9bd3',
    gold: '#e2b951',
  },
  box: { w: 48, h: 104 },
  parts: [
    // The end that runs behind the other is in the ribbon's shade, and the rim behind the face in the gold's.
    { fill: 'ribbonShade', nodes: [[6, -104, 1], [18, -104, 1], [6, -40, 1], [-6, -40, 1]] },
    { fill: 'ribbon', nodes: [[-18, -104, 1], [-6, -104, 1], [6, -40, 1], [-6, -40, 1]] },
    { fill: 'goldShade', cx: 0, cy: -19, rx: 19 },
    { fill: 'gold', cx: 0, cy: -19, rx: 15 },
    { fill: 'gold', cx: 0, cy: -40, rx: 5, ry: 3.5 },
  ],
});
