// A pencil standing on its eraser, point up: pink eraser, metal ferrule, yellow body, the sharpened wood and its graphite.
PhyFriends.props.define('pencil', {
  palette: {
    eraser: '#e8a39b',
    ferrule: '#b9b5ac',
    body: '#e9c46a',
    wood: '#ecd3a8',
    graphite: '#5f5d58',
  },
  box: { w: 14, h: 112 },
  parts: [
    { fill: 'eraser', nodes: [[-6, -13, 1], [6, -13, 1], [6, 0, 1], [-6, 0, 1]], round: 0.35 },
    { fill: 'ferrule', nodes: [[-6.5, -22, 1], [6.5, -22, 1], [6.5, -12, 1], [-6.5, -12, 1]], round: 0.1 },
    { fill: 'body', nodes: [[-6, -88, 1], [6, -88, 1], [6, -21, 1], [-6, -21, 1]], round: 0.1 },
    { fill: 'wood', nodes: [[-6, -88, 1], [6, -88, 1], [1.6, -104, 1], [-1.6, -104, 1]], round: 0.1 },
    { fill: 'graphite', nodes: [[-1.7, -103, 1], [1.7, -103, 1], [0, -111, 1]], round: 0.2 },
  ],
});
