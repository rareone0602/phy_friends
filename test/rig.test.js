// Tests of the rig (src/phyfriends.js): extras shown on cue, and extras that stay on the ground.
(function () {
  'use strict';
  const PF = PhyFriends;

  // A small spec with a prop on cue in each place one can be: on an ear, on the head and on the ground. It is
  // not registered (PF.define), since every registered friend must be in the cast.
  const SPEC = {
    name: 'test-props',
    palette: { fur: '#888888' },
    head: { cx: 0, cy: 0, rx: 60, ry: 50 },
    extras: [
      { on: 'earR', show: 'flag', kind: 'ellipse', fill: 'fur', cx: 0, cy: -80, rx: 6, ry: 6 },
      { on: 'base', show: 'side flag', kind: 'ellipse', fill: 'fur', cx: -40, cy: 0, rx: 6, ry: 6 },
      { on: 'ground', show: 'mat', kind: 'ellipse', fill: 'fur', cx: 90, cy: 115, rx: 20, ry: 4 },
    ],
  };

  function withRig(fn) {
    const box = document.createElement('div');
    Object.assign(box.style, { position: 'relative', width: '160px', height: '160px' });
    document.body.appendChild(box);
    try {
      fn(PF.mount(box, SPEC, { view: PF.standingView(SPEC) }));
    } finally {
      box.remove();
    }
  }
  const shown = (rig, name) => [...rig.svg.querySelectorAll(`[data-pf-show="${name}"]`)].map(n => !n.hasAttribute('display'));

  test('an extra with a show name is drawn only while the pose shows that name', () => {
    withRig(rig => {
      assertEqual([shown(rig, 'flag'), shown(rig, 'mat')], [[false], [false]], 'hidden at rest');
      rig.setPose({ show: 'flag mat' });
      assertEqual([shown(rig, 'flag'), shown(rig, 'mat')], [[true], [true]]);
      rig.setPose({ show: 'mat' });
      assertEqual([shown(rig, 'flag'), shown(rig, 'mat')], [[false], [true]]);
      rig.setPose({ show: null });
      assertEqual(shown(rig, 'mat'), [false], 'null shows nothing');
    });
    assert(PF.render(SPEC, { pose: { show: 'mat' } }).includes('data-pf-show="mat">'), 'a still draws it shown');
  });

  test('an extra on the ground stays put while the friend hops, squashes or moves', () => {
    withRig(rig => {
      rig.setPose({ show: 'mat' });
      const mat = rig.svg.querySelector('[data-pf-show="mat"]'), before = mat.getBoundingClientRect();
      rig.setPose({ show: 'mat', x: -30, y: -20, squash: 0.2 });
      const after = mat.getBoundingClientRect();
      assertEqual([after.left, after.top], [before.left, before.top]);
      assert(rig.parts.root.getAttribute('transform').includes('translate(-30 -20)'), 'the friend moved');
    });
  });
})();
