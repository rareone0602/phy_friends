// A balloon on a string, the string's end on the ground.
PhyFriends.props.define('balloon', {
  palette: {
    rubber: '#e7868d',
  },
  box: { w: 80, h: 236 },
  parts: [
    // The string, a pencil line from the ground up to the knot.
    { stroke: true, tone: 'ink-2', nodes: [[0, 0], [4, -40], [-3, -85], [3, -125], [0, -150]] },
    { fill: 'rubber', nodes: [[0, -156, 1], [5, -146, 1], [-5, -146, 1]], round: 0.3 },
    // The balloon, narrower toward the knot.
    { fill: 'rubber', cx: 0, cy: -194, rx: 34, ry: 40, rot: 180, onigiri: 0.3 },
  ],
});
