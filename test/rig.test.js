// Tests of the rig (src/phyfriends.js): extras shown on cue, extras that stay on the ground, and the standing figure.
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

  // A small friend with a seated body and no limbs of its own, so that it sits and stands in that body on the
  // template's limbs, which fold toward STAND_FIT's places as it sits; and one that never stands.
  const STANDER = {
    name: 'test-stander', palette: { fur: '#888888' }, head: { cx: 0, cy: 0, rx: 60, ry: 50 }, body: { cx: 0, cy: 80, rx: 60, ry: 45 },
  };
  const SITTER = { ...STANDER, name: 'test-sitter', stand: false };

  // Runs fn with every friend's body drawn k times as tall as its spec gives it (PF.BODY.height), and puts the height
  // back however fn ends. The core works a friend's figure out once per spec, so fn should use fresh copies of specs.
  function atHeight(k, fn) {
    const height = PF.BODY.height;
    PF.BODY.height = k;
    try {
      return fn();
    } finally {
      PF.BODY.height = height;
    }
  }

  // Whether node b is drawn after node a (later in the document, and so in front of it).
  const after = (a, b) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

  const withRig = (fn, spec = SPEC) => support.withBoxSync(box => fn(PF.mount(box, spec, { view: PF.standingView(spec) })), 160);
  const rectOf = (rig, part) => rig.parts[part].getBoundingClientRect();
  const drawn = node => !node.closest('[display="none"]');
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

  test('a friend sits and stands in its seated body, on the same limbs, with nothing swapped', () => {
    withRig(rig => {
      const limbs = ['body', 'armL', 'armR', 'legL', 'legR', 'pawL', 'footR'];
      assert(limbs.every(part => drawn(rig.parts[part])), 'its limbs are drawn while it sits');
      const seated = rig.parts.body.getBoundingClientRect();
      rig.setPose({ rise: 0.5 });
      assert(limbs.every(part => drawn(rig.parts[part])), 'and on the way up');
      rig.setPose({ stance: 'stand', rise: 0 });
      const standing = rig.parts.body.getBoundingClientRect();
      assert(limbs.every(part => drawn(rig.parts[part])), 'and standing');
      assert(Math.abs(standing.width - seated.width) < 0.5 && standing.top < seated.top, 'its body keeps its width and rises');
      assert(!rig.svg.querySelector('[data-pf-when^="stance"]'), 'no part is drawn in one stance only');
    }, STANDER);
  });

  test('the limbs and the ground are fitted to the friend\'s body', () => atHeight(1, () => {
    const S = { ...STANDER }, F = PF.STAND_FIT, stand = PF.standFor(S), [hx, hy] = stand.legs.L.hip, [sx, sy] = stand.arms.L.shoulder;
    assertEqual(stand.ground, 80 + 45 + F.legs, 'the legs show STAND_FIT.legs below the body');
    assertEqual([hx, hy], [60 * F.hip, 80 + 45 - F.hipUp], 'the hips sit inside the bottom of the body');
    const reach = PF.shapes.reachAt(S.body, sy);
    assert(sx < reach && sx > reach - stand.arms.L.width / 2, 'the shoulder sits just inside the body\'s side');
    assertEqual(PF.standLift(S), stand.ground - 120, 'the rig lifts it by the legs it shows below its seat');
    const given = PF.standFor({ ...S, stand: { ground: 150, arms: { shoulder: [30, 70], angle: 12 } } });
    assertEqual([given.ground, given.arms.R.shoulder, given.arms.R.angle], [150, [30, 70], 12], 'a spec may place them itself');
    const oni = PF.standFor({ ...S, body: { ...S.body, onigiri: { taper: 0.6, square: 2 } } });
    assert(oni.arms.L.angle > stand.arms.L.angle + 10, 'arms hang out along the sloping sides of a rice ball');
  }));

  test('a taller body grows down from under the chin, and what rests on the ground drops with its base', () => {
    // At 1.25, the body (top 35, half-height 45) keeps its top and reaches 22.5 lower.
    const SEAT = { paw: { cx: 18, cy: 115, rx: 12, ry: 10 }, foot: { cx: 50, cy: 118, rx: 18, ry: 7 } };
    const plain = atHeight(1, () => {
      const S = { ...STANDER, tail: { base: [40, 110] }, stand: { seat: SEAT } };
      return { ground: PF.groundOf(S), stand: PF.standFor(S), tail: PF.poseState(S, {}).transform.tail };
    });
    atHeight(1.25, () => {
      const S = { ...STANDER, tail: { base: [40, 110] }, stand: { seat: SEAT } }, stand = PF.standFor(S);
      assertEqual(PF.groundOf(S), plain.ground + 22.5, 'the ground drops as far as the base');
      assertEqual(stand.ground, plain.stand.ground + 22.5, 'and so do the feet, standing');
      assertEqual(stand.lift, plain.stand.lift, 'so the friend rises by the same legs');
      assertEqual(stand.seat.paw.L.cy, 115 + 22.5, 'the seated paws drop with it');
      assertEqual(stand.legs.L.hip[1], plain.stand.legs.L.hip[1] + 22.5, 'the hips stay inside the base');
      assert(/<g transform="matrix\(1 0 0 1.25 0 -8.75\)">/.test(PF.render(S)), 'the body and its extras stretch down from its top (35)');
      // The tail is placed last in its transform, at its root (tailPlace).
      const tailY = transform => +[...transform.matchAll(/translate\(([-\d.]+) ([-\d.]+)\)/g)].pop()[2];
      assertEqual([tailY(plain.tail), tailY(PF.poseState(S, {}).transform.tail)], [110, 35 + 75 * 1.25], 'the tail\'s root moves along with the body');
      const given = PF.standFor({ ...S, stand: { ground: 150, arms: { shoulder: [30, 70] }, tail: { base: [40, 115] } } });
      assertEqual([given.ground, given.arms.L.shoulder, given.tail.base], [150 + 22.5, [30, 35 + 35 * 1.25], [40, 35 + 80 * 1.25]],
        'what a spec places on the body moves along with it, and its ground drops');
      assertEqual(PF.groundOf({ ...SITTER }), 120, 'a friend that never stands keeps its body');
    });
  });

  test('an onigiri body is a rice ball: narrower at the top by its taper, squared off at the base by its square, with its tufts kept', () => {
    const E = { cx: 0, cy: 80, rx: 60, ry: 45, fluff: [{ from: 20, to: 60, n: 2, len: 6, sym: true }] };
    const R = PF.shapes.reachAt, O = { ...E, onigiri: { taper: 0.6, square: 2 } }, point = { ...E, onigiri: { taper: 1, square: 0 } };
    assertEqual(PF.shapes.shapeD({ ...E, onigiri: 0 }, 7), PF.shapes.shapeD(E, 7), 'onigiri: 0 is the ellipse itself');
    assert(R(O, 50) < 0.75 * R(E, 50), 'narrower under the chin');
    assert(R(O, 118) > 1.2 * R(E, 118), 'broader near the base, where it is squared off');
    const bottom = PF.shapes.outlineOf(O).point(90);
    assert(Math.abs(bottom[0]) < 1e-6 && Math.abs(bottom[1] - 125) < 1e-6, 'its base rests where the ellipse\'s bottom did');
    assert(Math.abs(PF.shapes.outlineOf(O).point(80)[1] - 125) < 1.5, 'and is flat');
    assert(Math.abs(PF.shapes.outlineOf(point).point(-90)[0]) < 1e-6 && R(point, 118) < R(E, 118), 'a taper of 1 comes to a point at the top; square 0 leaves the base round');
    assertEqual(PF.shapes.shapeD({ ...E, onigiri: 1 }, 7), PF.shapes.shapeD({ ...E, onigiri: { ...PF.ONIGIRI } }, 7), 'onigiri: 1 is the house rice ball (PF.ONIGIRI)');
    assertEqual(PF.shapes.fluffy(O).filter(n => n.c).length, PF.shapes.fluffy(E).filter(n => n.c).length, 'the same tufts');
  });

  test('a friend with stand: false, or without a body, keeps its seated figure in any stance', () => {
    withRig(rig => {
      const seated = rig.parts.root.getAttribute('transform');
      rig.setPose({ stance: 'stand', armL: 90 });
      assert(drawn(rig.parts.body) && !rig.parts.legL && !rig.parts.armL, 'no limbs');
      assertEqual(rig.parts.root.getAttribute('transform'), seated, 'not lifted');
    }, SITTER);
    assertEqual(PF.standFor(SPEC), null, 'a friend without a body has nothing to hang limbs on');
    assertEqual(PF.riseOf(SPEC, { stance: 'stand' }), 0, 'and is never raised');
    assertEqual(PF.standFor({ ...STANDER, body: { nodes: [[0, 40], [40, 120], [-40, 120]] } }), null, 'nor has one whose body is drawn in nodes');
    const round = { ...STANDER, name: 'test-round', body: { cy: 80, rx: 60 }, stand: { seat: { paw: { cx: 20, cy: 110, rx: 10 } } } };
    for (const pose of [{ stance: 'sit' }, { rise: 0.5 }, { stance: 'stand' }]) {
      assert(!PF.render(round, { pose }).includes('NaN'), `a round body and paw, their defaults left out, draw (${JSON.stringify(pose)})`);
    }
  });

  test('a standing friend\'s feet rest on the ground where its seated paws do', () => {
    withRig(rig => {
      rig.setPose({ stance: 'stand' });
      const unit = rig.svg.getBoundingClientRect().height / PF.STANDING_BOX, ground = rig.svg.getBoundingClientRect().bottom;
      for (const foot of ['footL', 'footR']) assert(Math.abs(rectOf(rig, foot).bottom - ground) < 1.5 * unit, `${foot} on the ground`);
    }, STANDER);
  });

  test('its feet stay planted while it crouches and leans, and a step lifts that foot alone', () => {
    withRig(rig => {
      rig.setPose({ stance: 'stand' });
      const unit = rig.svg.getBoundingClientRect().height / PF.STANDING_BOX;
      const [left, right, body] = ['footL', 'footR', 'body'].map(part => rectOf(rig, part));
      rig.setPose({ crouch: 12, lean: 8 });
      for (const [part, before] of [['footL', left], ['footR', right]]) {
        const after = rectOf(rig, part);
        assert(Math.abs(after.left - before.left) < 0.5 && Math.abs(after.bottom - before.bottom) < 0.5, `${part} stays put`);
      }
      const middle = rect => (rect.top + rect.bottom) / 2, drop = (middle(rectOf(rig, 'body')) - middle(body)) / unit;
      assert(Math.abs(drop - 12) < 1, `the upper body dropped by the crouch (by ${drop.toFixed(1)} units)`);
      rig.setPose({ crouch: 0, lean: 0, stepL: 10 });
      assert(Math.abs(left.bottom - rectOf(rig, 'footL').bottom - 10 * unit) < 0.5, 'the left foot rose by its step');
      assert(Math.abs(rectOf(rig, 'footR').bottom - right.bottom) < 0.5, 'the right foot stayed');
    }, STANDER);
  });

  test('an arm raises outward in front of the head, and in its own layer while over names it', () => {
    withRig(rig => {
      rig.setPose({ stance: 'stand' });
      const rest = rectOf(rig, 'pawL');
      rig.setPose({ armL: 90 });
      const raised = rectOf(rig, 'pawL');
      assert(raised.left < rest.left && raised.top < rest.top, 'the left paw moved out and up');
      const slotOf = part => rig.parts[part].parentNode.getAttribute('data-pf');
      assertEqual(slotOf('armL'), 'armsUnder');
      assert(after(rig.parts.head, rig.parts.armsUnder), 'in front of the head');
      rig.setPose({ over: 'armL' });
      assertEqual([slotOf('armL'), slotOf('armR')], ['armsOver', 'armsUnder']);
      rig.setPose({ over: null });
      assertEqual(slotOf('armL'), 'armsUnder', 'and back');
    }, STANDER);
    assert(PF.render(STANDER, { pose: { stance: 'stand', over: 'armR' } }).match(/data-pf="armsOver"[^>]*>(<g[^>]*>)?<g data-pf="armR"/), 'a still draws it in front');
  });

  // A friend whose seated drawing has its own forepaws and hind feet, the feet with soles that face us only seated.
  const SEATED = {
    ...STANDER, name: 'test-seated',
    stand: { seat: { paw: { cx: 20, cy: 98, rx: 12, ry: 22 }, foot: { cx: 50, cy: 109, rx: 18, ry: 11, rot: -10 } } },
    extras: [{ on: 'feet', sole: true, kind: 'ellipse', fill: 'fur', cx: -2, cy: 1, rx: 8, ry: 6 }],
  };
  const placeOf = transform => transform.match(/translate\(([-\d.]+) ([-\d.]+)\)/).slice(1).map(Number);

  test('a friend is one figure, whose stance is any height between sitting and standing', () => {
    const at = pose => PF.poseState(STANDER, pose);
    const same = (a, b) => JSON.stringify([a.transform, a.paths]) === JSON.stringify([b.transform, b.paths]);
    assert(same(at({ stance: 'sit' }), at({ stance: 'stand', rise: -1 })), 'sitting is standing risen by -1');
    assert(same(at({ stance: 'stand' }), at({ stance: 'sit', rise: 1 })), 'standing is sitting risen by 1');
    assert(same(at({ stance: 'sit', rise: 3 }), at({ stance: 'stand' })), 'it rises no further than standing');
    const lift = PF.standLift(STANDER);
    assertEqual([0, 0.5, 1].map(rise => PF.riseOf(STANDER, { rise })), [0, lift / 2, lift], 'its head rises with it');
    assertEqual(PF.riseOf(STANDER, { stance: 'stand', crouch: 5 }), lift - 5, 'and a crouch lowers it');
  });

  test('as it sits, its limbs fold: feet out beside its base, paws in front, and nothing jumps', () => {
    // Where the left foot and paw are on the page, in head units: the feet are planted in the figure's own space,
    // and the paws hang from the upper body, which is raised by riseOf above where it sits.
    const stand = PF.standFor(STANDER), places = rise => {
      const t = PF.poseState(STANDER, { rise }).transform, [foot, paw] = ['footL', 'pawL'].map(part => placeOf(t[part]));
      return [foot, [paw[0], paw[1] - PF.riseOf(STANDER, { rise })]];
    };
    const [[footX0, footY0], [pawX0, pawY0]] = places(0), [[footX1, footY1], [pawX1, pawY1]] = places(1);
    assert(footX0 < footX1 - 10, 'the seated feet rest further out');
    assert(Math.abs(pawX0) < Math.abs(pawX1) - 10, 'the seated paws come in, in front of the body');
    assert(pawY0 > pawY1, 'and down');
    const foot = stand.legs.L, ground = stand.ground - foot.ankle;
    for (const rise of [0, 0.3, 0.7, 1]) assert(Math.abs(places(rise)[0][1] - ground) < 1e-6, `the feet stay on the ground (rise ${rise})`);
    // The same of a friend whose seated paws and feet are its own drawing's.
    const own = rise => {
      const t = PF.poseState(SEATED, { rise }).transform, [foot, paw] = ['footL', 'pawL'].map(part => placeOf(t[part]));
      return [foot, [paw[0], paw[1] - PF.riseOf(SEATED, { rise })]];
    };
    for (const [label, at] of [['the template\'s places', places], ['a seated drawing', own]]) {
      let step = 0;
      for (let i = 1; i <= 40; i++) {
        const [a, b] = [at((i - 1) / 40), at(i / 40)];
        step = Math.max(step, ...a.map((p, k) => Math.hypot(p[0] - b[k][0], p[1] - b[k][1])));
      }
      assert(step < 3, `${label}: a fortieth of the way up moves a paw or a foot at most ${step.toFixed(2)} units`);
    }
  });

  test('seated, its arms hang straight down in front of its body to its paws, from the body\'s middle, sleeves and all', () => atHeight(1, () => {
    const NUBBED = {
      ...STANDER, name: 'test-nubbed',
      stand: { seat: { paw: { cx: 18, cy: 115, rx: 12, ry: 10 } }, arms: { bands: [{ from: 0, to: 0.4, color: 'fur', grow: 2 }] } },
    };
    const arm = PF.standFor(NUBBED).seat.arms.L;
    assertEqual([arm.shoulder, arm.angle, arm.length, arm.width], [[18, 90], 0, 25, 20],
      'its round end at the body\'s center (80), and as wide as the paw is tall');
    assertEqual(placeOf(PF.poseState(NUBBED, { stance: 'sit' }).transform.pawL), [-18, 115], 'its end at the paw');
    withRig(rig => {
      const width = name => rig.svg.querySelector(`[data-pf-d="${name}"]`).getBBox().width;
      assert(Math.abs(width('armL:0') - width('armL') - 4) < 0.5, `seated, its sleeve stands proud of it (${(width('armL:0') - width('armL')).toFixed(2)})`);
    }, NUBBED);
    const folded = { ...NUBBED, name: 'test-folded', stand: { ...NUBBED.stand, seat: { ...NUBBED.stand.seat, arms: { length: 0 } } } };
    assertEqual(PF.standFor(folded).seat.arms.L.shoulder, [18, 115], 'an arm given length 0 folds into its paw');
  }));

  // The page box of an ellipse { cx, cy, rx, ry } given in head units, in a rig's standing view.
  const boxOf = (rig, spec, { cx, cy, rx, ry }) => {
    const svg = rig.svg.getBoundingClientRect(), unit = svg.height / PF.STANDING_BOX, view = PF.standingView(spec);
    return { left: svg.left + (view.x + cx - rx) * unit, right: svg.left + (view.x + cx + rx) * unit,
      top: svg.top + (view.y + cy - ry) * unit, bottom: svg.top + (view.y + cy + ry) * unit };
  };
  const near = (a, b, label) => assert(['left', 'right', 'top', 'bottom'].every(k => Math.abs(a[k] - b[k]) < 1),
    `${label}: ${['left', 'right', 'top', 'bottom'].map(k => `${a[k].toFixed(1)}/${b[k].toFixed(1)}`).join(' ')}`);

  test('seated, its paws and feet are its seated drawing\'s; standing, the template\'s', () => atHeight(1, () => {
    const seated = { ...SEATED };
    withRig(rig => {
      const shape = part => rig.parts[`${part}seat`].querySelector('path').getBoundingClientRect();
      near(shape('pawL'), boxOf(rig, seated, { cx: -20, cy: 98, rx: 12, ry: 22 }), 'the left forepaw');
      near(shape('pawR'), boxOf(rig, seated, { cx: 20, cy: 98, rx: 12, ry: 22 }), 'the right forepaw');
      const tilted = boxOf(rig, seated, { cx: 50, cy: 109, rx: 18, ry: 11 }), foot = shape('footR');
      assert(Math.abs((foot.left + foot.right) / 2 - (tilted.left + tilted.right) / 2) < 1 && Math.abs(foot.bottom - foot.top - 2 *
        Math.hypot(18 * Math.sin(10 * Math.PI / 180), 11 * Math.cos(10 * Math.PI / 180)) * (tilted.bottom - tilted.top) / 22) < 1, 'the right hind foot, turned');
      // How much of its height the sole keeps (its frame's vertical scale about the foot's lower edge).
      const sole = () => Number(rig.parts.footLsole.getAttribute('transform').match(/scale\(1 ([-\d.]+)\)/)[1]);
      assert(sole() === 1 && rig.parts.footLsole.getBoundingClientRect().height > 5, 'its sole faces us');
      rig.setPose({ rise: 0.5 });
      const half = sole();
      rig.setPose({ stance: 'stand' });
      const paw = PF.standFor(seated).arms.L.paw;
      const [kx, ky] = rig.parts.pawLseat.getAttribute('transform').match(/scale\(([-\d.]+) ([-\d.]+)\)/).slice(1).map(Number);
      assert(Math.abs(kx * 12 - paw.rx) < 0.2 && Math.abs(ky * 22 - paw.ry) < 0.2, 'standing, the paw is the template\'s');
      assert(half === 0.5 && sole() === 0, `the sole flattens as it rises, to nothing (${half} of it halfway)`);
    }, seated);
  }));

  test('its feet lie in front of its body, and a crouch drops its paws with the body, by the crouch and no more', () => {
    withRig(rig => {
      const upper = [...rig.parts.upper.children].map(n => n.getAttribute('data-pf'));
      assert(upper.indexOf('feet') > upper.indexOf('body') && rig.parts.footL.closest('[data-pf="feet"]'), 'the feet come after the body');
      assert(rig.parts.legL.closest('[data-pf="legs"]') && !rig.parts.legL.contains(rig.parts.footL), 'the leg hoses stay behind it');
      rig.setPose({ stance: 'stand' });
      const unit = rig.svg.getBoundingClientRect().height / PF.STANDING_BOX, [foot, paw] = ['footL', 'pawL'].map(part => rectOf(rig, part));
      rig.setPose({ crouch: 10 });
      assert(Math.abs(rectOf(rig, 'footL').top - foot.top) < 0.5, 'a crouch leaves the feet where they stand');
      assert(Math.abs((rectOf(rig, 'pawL').top - paw.top) / unit - 10) < 0.5, 'and drops the paws by as much as the body');
    }, SEATED);
  });

  test('the body and its clothes, the scarf, the head, then the arms, whose shoulders tuck under the scarf and head', () => {
    const order = rig => ['armsUnder', 'pawsUnder', 'armsOver'].map(slot => [...rig.parts[slot].children].map(n => n.getAttribute('data-pf')));
    const SCARFED = { ...SEATED, name: 'test-scarfed', extras: [...(SEATED.extras || []), { on: 'scarf', kind: 'ellipse', fill: 'fur', cx: 0, cy: 60, rx: 30, ry: 12 }] };
    withRig(rig => {
      const { body, scarf, head, armsUnder, armsOver } = rig.parts, svg = rig.svg;
      assert(after(body, scarf) && after(scarf, head) && after(head, armsUnder) && after(armsUnder, armsOver), 'body, scarf, head, arms, then an arm over all');
      const mask = rig.parts.tuck.getAttribute('data-pf-mask'), held = svg.querySelector(`mask[id="${mask.slice(5, -1)}"]`);
      assert(held && held.querySelector(`use[href="#${scarf.id}"]`) && held.querySelector(`use[href="#${head.id}"]`), 'the arms are masked where the scarf or the head is drawn');
      assert(rig.parts.tuck.contains(armsUnder) && !rig.parts.tuck.hasAttribute('mask'), 'but not while the friend sits, when the mask would hide nothing');
      assert(!/<g data-pf="tuck"[^>]* mask=/.test(PF.render(SCARFED)) && /<g data-pf="tuck"[^>]* mask=/.test(PF.render(SCARFED, { pose: { rise: 0.1 } })),
        'a still takes it only once the friend has risen too');
      rig.setPose({ stance: 'stand' });
      assertEqual(rig.parts.tuck.getAttribute('mask'), mask, 'standing, they take it');
      const tuck = PF.standFor(SCARFED).tuck, arm = PF.standFor(SCARFED).arms.L;
      const radius = () => +/scale\(([\d.]+)\)/.exec(rig.parts.tuckL.getAttribute('transform'))[1];
      assert(rig.parts.tuckL && radius() == +(arm.length * tuck).toFixed(2), 'within the tuck of the shoulder');
      assert(after(armsUnder, rig.parts.pawsUnder) && !rig.parts.pawsUnder.closest('[mask*="-tuck"]') && armsUnder.closest('[mask*="-tuck"]'), 'the paws come after the arms, and never tuck');
      assertEqual(order(rig), [['armL', 'armR'], ['pawL', 'pawR'], []]);
      rig.setPose({ stance: 'sit', rise: 0.5 });
      assert(radius() >= arm.width / 2, `on the way up, the tuck takes in the round end of the hose (${radius()})`);
      const ink = () => rig.parts.tuckInk.getAttribute('opacity');
      assert(held.contains(rig.parts.tuckInk) && ink() === '1', 'halfway up, the arms tuck fully');
      rig.setPose({ rise: 0.2 });
      assertEqual(ink(), '0.4', 'and lower, only partly, so that they slide under the scarf as the friend rises');
      rig.setPose({ stance: 'stand', rise: 0, over: 'armL' });
      assertEqual(rig.parts.armL.parentNode.getAttribute('data-pf'), 'armsOver', 'an arm that over names lies whole over everything');
      assertEqual(order(rig), [['armR'], ['pawR'], ['armL', 'pawL']], 'its paw with it');
      rig.setPose({ over: 'armR armL' });
      assertEqual(order(rig), [[], [], ['armL', 'pawL', 'armR', 'pawR']]);
      rig.setPose({ over: null });
      assertEqual(order(rig), [['armL', 'armR'], ['pawL', 'pawR'], []], 'and back, in the order a render draws them');
    }, SCARFED);
    withRig(rig => {
      assert(!rig.parts.scarf, 'a friend without a scarf has no scarf layer');
      assert(after(rig.parts.head, rig.parts.armsUnder), 'and its arms are in front of its head');
    }, SEATED);
  });

  test('a spec may fit the template to itself', () => atHeight(1, () => {
    const fit = PF.standFor({ ...STANDER, stand: { fit: { legs: 18, hip: 0.3 } } });
    assertEqual([fit.ground, fit.legs.L.hip[0]], [80 + 45 + 18, 60 * 0.3]);
    const E = { cx: 0, cy: 80, rx: 60, ry: 45 }, d = s => PF.shapes.shapeD(s, 3);
    assertEqual(d({ ...E, onigiri: { taper: PF.ONIGIRI.taper, square: PF.ONIGIRI.square } }), d({ ...E, onigiri: 1 }), 'the rice ball\'s own taper and squareness');
    assertEqual(d({ ...E, onigiri: { taper: PF.ONIGIRI.taper / 2, square: PF.ONIGIRI.square / 2 } }), d({ ...E, onigiri: 0.5 }), 'a number scales both');
  }));

  test('a limb\'s arc keeps its length however it bends, and bendFor inverts it', () => {
    const L = 40, arc = PF.shapes.limbArc([0, 0], Math.PI / 2, Math.PI / 2, L);
    const [x, y] = arc(L), chord = Math.hypot(x, y);
    assert(Math.abs(chord - L * Math.sin(Math.PI / 4) / (Math.PI / 4)) < 1e-6, 'a quarter turn spans the chord of its arc');
    const b = PF.shapes.bendFor(chord, L);
    assert(Math.abs(b - Math.PI / 2) < 1e-6, 'bendFor inverts it');
    assert(PF.shapes.bendFor(L, L) < 1e-6, 'a straight limb');
  });

  test('seated, a friend ignores the arm, leg, lean and crouch fields', () => {
    const at = pose => JSON.stringify(PF.poseState(STANDER, pose));
    assertEqual(at({ stance: 'sit', armL: 120, elbowR: -60, legL: 20, stepR: 6, lean: 10, crouch: -4 }), at({ stance: 'sit' }));
    assertEqual(PF.riseOf(STANDER, { stance: 'sit', crouch: -4 }), 0, 'a crouch that would raise it leaves its head where it sits');
  });

  test('a tail with a standing place of its own moves there as the friend rises, from where it sits', () => {
    const own = PF.get('yuanyuan'), plain = { ...own, name: 'test-plain-tail', stand: { ...own.stand, tail: null } };
    const tailAt = (spec, rise) => PF.poseState(spec, { rise }).transform.tail;
    assertEqual(tailAt(own, 0), tailAt(plain, 0), 'seated, the tail is where the seated drawing has it');
    assert(tailAt(own, 1) !== tailAt(plain, 1), 'standing, it is in its standing place');
    assert(![tailAt(own, 0), tailAt(own, 1)].includes(tailAt(own, 0.5)), 'and halfway, between the two');
  });

  // A friend whose head is large enough to cover its shoulders, whatever the body's height (BODY.height), its arms in
  // a color of their own, drawn flat.
  const TUCKER = {
    name: 'test-tucker', palette: { fur: '#808080', chest: '#404040', arm: '#ff0000' },
    head: { cx: 0, cy: 0, rx: 90, ry: 95 }, body: { cx: 0, cy: 80, rx: 60, ry: 45 },
    stand: { arms: { color: 'arm', paw: { color: 'arm' } } },
  };
  const TUCKER_VIEW = { w: 300, h: 300, x: 150, y: 170, scale: 1, rotate: 0 };

  // What is drawn at each head-space point [x, y] (already lifted as the pose lifts it) of a flat render: the
  // arm, the head, or the color found.
  async function drawnAt(pose, points) {
    const svg = PF.render(TUCKER, { view: TUCKER_VIEW, pose, pencil: false, bg: false });
    const img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = TUCKER_VIEW.w;
    canvas.height = TUCKER_VIEW.h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, TUCKER_VIEW.w, TUCKER_VIEW.h);
    return points.map(([x, y]) => {
      const d = ctx.getImageData(Math.round(TUCKER_VIEW.x + x), Math.round(TUCKER_VIEW.y + y), 1, 1).data;
      return d[0] > 200 && d[1] < 60 ? 'arm' : d[0] > 100 && d[0] < 160 && Math.abs(d[0] - d[1]) < 8 ? 'head' : `rgb(${d[0]}, ${d[1]}, ${d[2]})`;
    });
  }

  test('a paw raised to the face shows in front of the head, while the shoulder tucks under it unless over names the arm', async () => {
    const stand = PF.standFor(TUCKER), lift = stand.lift, [sx, sy] = stand.arms.L.shoulder;
    const pose = { stance: 'stand', armL: 150, elbowL: -30 };
    const st = PF.poseState(TUCKER, pose), [px, py] = st.transform.pawL.match(/translate\(([-\d.]+) ([-\d.]+)\)/).slice(1).map(Number);
    const shoulder = [-sx, sy - lift], paw = [px, py - lift];
    assert(Math.hypot(paw[0] / 90, paw[1] / 95) < 1, 'the paw lies over the head');
    assertEqual(await drawnAt(pose, [paw, shoulder]), ['arm', 'head'], 'the paw in front, the shoulder under the head');
    assertEqual(await drawnAt({ ...pose, over: 'armL' }, [paw, shoulder]), ['arm', 'arm'], 'over draws the shoulder in front too');
  });

  // The width of a leg's outline and where its foot rests, standing at a crouch, on a friend mounted in a standing box.
  function legAt(spec, crouch) {
    return support.withBoxSync(box => {
      const rig = PF.mount(box, spec, { view: PF.standingView(spec), pose: { stance: 'stand', crouch } });
      return { width: rig.parts.legL.querySelector('path').getBBox().width, foot: rig.parts.footL.getBoundingClientRect().bottom };
    }, PF.STANDING_BOX);
  }

  test('a plush leg squashes to take up a crouch, where a leg with knees bows out, and either stretches a little first', () => {
    const kneed = { ...STANDER, name: 'test-kneed', stand: { legs: { knees: true } } };
    assert(Math.abs(legAt(STANDER, 12).width - legAt(STANDER, 0).width) < 1, 'the plush leg stays straight');
    assert(legAt(kneed, 12).width > legAt(kneed, 0).width + 3, 'the leg with knees bows out');
    assert(Math.abs(legAt(STANDER, -3).foot - legAt(STANDER, 0).foot) < 0.5, 'a little rise stretches the leg and leaves the foot down');
  });
})();
