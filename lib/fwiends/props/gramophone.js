// A wind-up gramophone, side-on: a wooden cabinet, a record on its turntable, a brass tone arm and a brass horn. Its
// states: playing (the arm down on the record, rather than raised), and turn0 to turn2, the record's label mark at three
// places in its turn, which a film cycles to spin it.
PhyFriends.props.define('gramophone', {
  palette: {
    wood: '#b07a52',
    record: '#3a3936',
    label: '#c45a4f',
    mark: '#efeef3',      // A paper sticker on the label, which shows the record turning.
    brass: '#d1a94e',
  },
  box: { w: 236, h: 270 },
  parts: [
    // The horn, behind everything: a neck rising from the back of the cabinet and a bell opening up and to the left.
    // Its mouth is the brass's shade, since it is the inside of the same brass.
    { fill: 'brass', nodes: [[52, -86, 1, 0], [66, -92, 1, 0], [20, -168, 0], [-46, -232, 1, 0], [-112, -170, 1, 0], [-20, -150, 0], [40, -104, 1, 0]] },
    { fill: 'brassShade', cx: -78, cy: -204, rx: 46, ry: 22, rot: -42 },
    // The cabinet, its lid a strip of the wood's shade, as the top edge of the same wood.
    { fill: 'wood', nodes: [[-64, -72, 1], [64, -72, 1], [64, 0, 1], [-64, 0, 1]], round: 0.06 },
    { fill: 'woodShade', nodes: [[-68, -80, 1], [68, -80, 1], [68, -70, 1], [-68, -70, 1]], round: 0.3 },
    // The record and its label, seen nearly edge-on.
    { fill: 'record', cx: -6, cy: -84, rx: 54, ry: 9 },
    { fill: 'label', cx: -6, cy: -84, rx: 14, ry: 3 },
    { show: 'turn0', fill: 'mark', cx: 3, cy: -83, rx: 3.5, ry: 1.4 },
    { show: 'turn1', fill: 'mark', cx: -6, cy: -86.4, rx: 3.5, ry: 1.4 },
    { show: 'turn2', fill: 'mark', cx: -15, cy: -83, rx: 3.5, ry: 1.4 },
    // The tone arm, pivoting on the cabinet's back corner: down on the record while it plays, raised otherwise.
    { fill: 'brass', cx: 48, cy: -86, rx: 7, ry: 5 },
    { show: 'playing', fill: 'brass', nodes: [[44, -90, 1], [50, -86, 1], [14, -82, 1], [10, -86, 1]], round: 0.2 },
    { hide: 'playing', fill: 'brass', nodes: [[44, -90, 1], [50, -86, 1], [20, -108, 1], [16, -112, 1]], round: 0.2 },
  ],
});
