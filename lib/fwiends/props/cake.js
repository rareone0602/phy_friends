// A round birthday cake: two layers of sponge with jam between, cream poured over the top, and three candles that are lit on cue.
PhyFriends.props.define('cake', {
  palette: {
    sponge: '#e5cda4',
    jam: '#cf9d95',
    cream: '#ece0ca',
    berry: '#c4847e',
    wax: '#a9bcd4',
    flame: '#f7d98c',     // A flame is drawn as a pale shape, never as a glow.
  },
  box: { w: 112, h: 100 },
  parts: [
    // The side, whose bottom edge curves around the front as a cylinder's does, and the jam between the two layers.
    { fill: 'sponge', nodes: [[-50, -46, 1, 0], [50, -46, 1, 0], [50, -6, 1, -14], [-50, -6, 1, 0]], round: 0.08 },
    { fill: 'jam', nodes: [[-50, -27, 1, 14], [50, -27, 1, 0], [50, -21, 1, -14], [-50, -21, 1, 0]] },
    // The cream over the top, running down the front in drips.
    { fill: 'cream', cx: 0, cy: -46, rx: 51, ry: 11, fluff: [{ from: 18, to: 162, n: 6, len: 8, depth: 0, b1: -30, b2: -30, jit: 0.4 }] },
    { fill: 'berry', polys: [[-38, -48, 4.5, 7], [38, -48, 4.5, 7]] },
    // Three candles, each a pencil line of wick and, lit, a flame.
    { fill: 'wax', nodes: [[-25, -72, 1], [-19, -72, 1], [-19, -48, 1], [-25, -48, 1]], round: 0.3 },
    { fill: 'wax', nodes: [[-3, -76, 1], [3, -76, 1], [3, -51, 1], [-3, -51, 1]], round: 0.3 },
    { fill: 'wax', nodes: [[19, -72, 1], [25, -72, 1], [25, -48, 1], [19, -48, 1]], round: 0.3 },
    { stroke: true, nodes: [[-22, -72], [-21.6, -77]] },
    { stroke: true, nodes: [[0, -76], [0.4, -81]] },
    { stroke: true, nodes: [[22, -72], [22.4, -77]] },
    { show: 'lit', fill: 'flame', cx: -22, cy: -80, rx: 4, ry: 5, fluff: [{ from: 200, to: 340, n: 1, len: 7, depth: 0, b1: -8, b2: -8, jit: 0 }] },
    { show: 'lit', fill: 'flame', cx: 0, cy: -84, rx: 4, ry: 5, fluff: [{ from: 200, to: 340, n: 1, len: 7, depth: 0, b1: -8, b2: -8, jit: 0 }] },
    { show: 'lit', fill: 'flame', cx: 22, cy: -80, rx: 4, ry: 5, fluff: [{ from: 200, to: 340, n: 1, len: 7, depth: 0, b1: -8, b2: -8, jit: 0 }] },
  ],
});
