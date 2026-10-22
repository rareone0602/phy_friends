// A paper party hat: a cone with dots and a pompom. Its colors are meant to be overridden, so that it takes a friend's.
PhyFriends.props.define('partyHat', {
  palette: {
    paper: '#f2a0a8',
    dots: '#f6e2a0',
    pompom: '#f6e2a0',
  },
  box: { w: 72, h: 96 },
  parts: [
    // The cone, whose base curves around the front.
    { fill: 'paper', nodes: [[0, -80, 1, 0], [30, -3, 1, -16], [-30, -3, 1, 0]], round: 0.12 },
    { fill: 'dots', polys: [[-12, -22, 4, 8], [9, -36, 4, 8], [-4, -52, 3.5, 8], [16, -14, 3.5, 8]] },
    { fill: 'pompom', cx: 0, cy: -82, rx: 10, ry: 9, fluff: [{ from: 0, to: 360, n: 12, len: 1.5, depth: 0.03, b1: -20, b2: -20, jit: 0.3 }] },
  ],
});
