// A wrapped gift: a box under its lid, with a ribbon and a bow.
PhyFriends.props.define('gift', {
  palette: {
    paper: '#a7c4e5',
    ribbon: '#e0828c',
  },
  box: { w: 92, h: 90 },
  parts: [
    // The box lies under its lid, so it and the ribbon around it are in their shades.
    { fill: 'paperShade', nodes: [[-36, -54, 1], [36, -54, 1], [36, 0, 1], [-36, 0, 1]], round: 0.06 },
    { fill: 'ribbonShade', nodes: [[-6, -54, 1], [6, -54, 1], [6, 0, 1], [-6, 0, 1]] },
    { fill: 'paper', nodes: [[-40, -68, 1], [40, -68, 1], [40, -52, 1], [-40, -52, 1]], round: 0.2 },
    { fill: 'ribbon', nodes: [[-6, -68, 1], [6, -68, 1], [6, -52, 1], [-6, -52, 1]] },
    // The bow: two loops behind the knot, in its shade.
    { fill: 'ribbonShade', cx: -13, cy: -76, rx: 13, ry: 7.5, rot: -22 },
    { fill: 'ribbonShade', cx: 13, cy: -76, rx: 13, ry: 7.5, rot: 22 },
    { fill: 'ribbon', cx: 0, cy: -71, rx: 6, ry: 5.5 },
  ],
});
