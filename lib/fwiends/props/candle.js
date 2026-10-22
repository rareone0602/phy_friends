// A birthday candle, as the cake's are, with a pencil line of wick and, lit, a flame.
PhyFriends.props.define('candle', {
  palette: {
    wax: '#a9bcd4',
    flame: '#f7d98c',     // A flame is drawn as a pale shape, never as a glow.
  },
  box: { w: 16, h: 48 },
  parts: [
    { fill: 'wax', nodes: [[-3, -25, 1], [3, -25, 1], [3, 0, 1], [-3, 0, 1]], round: 0.3 },
    { stroke: true, nodes: [[0, -25], [0.4, -30]] },
    { show: 'lit', fill: 'flame', cx: 0, cy: -33, rx: 4, ry: 5, fluff: [{ from: 200, to: 340, n: 1, len: 7, depth: 0, b1: -8, b2: -8, jit: 0 }] },
  ],
});
