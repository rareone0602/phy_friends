// Tests of src/emotion.js: every feeling works on every friend drawn on the house template, holds
// still as a face, loops as a hold, and ends its reaction in the face it holds.
(function () {
  'use strict';

  const PF = PhyFriends, A = PF.anim, E = PF.emotion;
  const HOUSE = PF.list().filter(name => E.fits(name));
  const NUMBERS = ['earL', 'earR', 'tail', 'tilt', 'squash', 'lid', 'lidTilt', 'flush', 'widen', 'turnY', 'lookX', 'lookY'];
  const close = (a, b) => Math.abs(a - b) < 1e-3;

  test('every friend but Claude fits the emotion library', () => {
    assertEqual(PF.list().filter(name => !E.fits(name)), ['claude']);
  });

  test('for a friend that shows no feelings, a feeling is its movement alone', () => {
    for (const feeling of E.names) {
      const react = E.react(feeling, { spec: 'claude' });
      for (const t of [0.05, react.duration / 2, react.duration]) {
        const partial = react(t);
        assert(Object.values(partial).every(v => typeof v === 'number'), `${feeling} at ${t} s has no eye or mouth shapes`);
      }
      assertEqual(E.face(feeling, { spec: 'claude' }), {});
      assertEqual(E.hold(feeling, { spec: 'claude' })(1), {});
    }
    assertEqual(Object.keys(E.greeting('claude')(0.5)).includes('eyes'), false, 'the hi is a hop without happy eyes');
    assertEqual(E.greeting('howdi')(0.5).eyes, 'happy');
  });

  test('a feeling that is not in the library is an error that lists the ones that are', () => {
    assertThrows(() => E.face('smug'), /not a feeling; use one of happy, content/);
  });

  test('every face is a pose the renderer draws on every friend of the house template', () => {
    for (const feeling of E.names) {
      const pose = A.sample(E.face(feeling));
      for (const name of HOUSE) {
        const svg = PF.render(name, { pose, bg: false });
        assert(svg.includes('<svg') && !svg.includes('NaN') && !svg.includes('undefined'), `${feeling} on ${name}`);
      }
    }
  });

  test('a reaction ends in the face the feeling holds, and feel carries on from there', () => {
    for (const feeling of E.names) {
      const react = E.react(feeling), end = A.sample(react, react.duration), face = A.sample(E.face(feeling));
      const start = A.sample(E.feel(feeling), react.duration);
      for (const key of NUMBERS) {
        assert(close(end[key], face[key]), `${feeling}: ${key} ends at ${end[key]}, the face holds ${face[key]}`);
        assert(close(start[key], face[key]), `${feeling}: feel goes on with ${key} at ${start[key]}, the face holds ${face[key]}`);
      }
      assertEqual([end.eyes, end.mouth], [face.eyes, face.mouth], `${feeling}: eye and mouth shapes at the end`);
    }
  });

  test('a held feeling loops in a length that divides 8 s, so that it loops with idle', () => {
    for (const feeling of E.names) {
      const hold = E.hold(feeling);
      assert(hold.loop && 8 % hold.duration === 0, `${feeling} loops in ${hold.duration} s`);
      assertEqual(A.sample(hold, 1.25 + hold.duration), A.sample(hold, 1.25), `${feeling} one loop later`);
    }
  });

  test('feel plays the reaction, then the feeling held, for ever', () => {
    const feel = E.feel('surprised'), react = E.react('surprised'), hold = E.hold('surprised');
    assertEqual(feel.duration, undefined);
    assertEqual(A.sample(feel, 0.5), A.sample(react, 0.5));
    assertEqual(A.sample(feel, react.duration + 3), A.sample(hold, 3), 'held, once the movement has eased in');
  });

  test('strength scales the movement and keeps the face from half strength up', () => {
    const full = A.sample(E.face('sad')), half = A.sample(E.face('sad', { strength: 0.5 }));
    assert(close(half.earL, full.earL / 2), `ears ${half.earL} against ${full.earL}`);
    assertEqual(half.mouth, 'frown');
    assertEqual(A.sample(E.face('sad', { strength: 0.4 })).mouth, null, 'below half strength, the spec default');
  });

  test('feelings near each other on the two axes share their posture', () => {
    const drowsy = E.posture(0, -1), alert = E.posture(0, 1), low = E.posture(-1, 0);
    assert(drowsy.earL > 0 && alert.earL < 0 && low.earL > 0, 'ears droop when drowsy or low and stand up when alert');
    assert(low.squash < 0 && E.posture(1, 0).squash > 0, 'a friend slumps when low and holds itself up when pleased');
  });

  test('every mark a feeling shows is one a friend without a voice may use', () => {
    for (const feeling of E.names) {
      const mark = E.mark(feeling);
      if (mark) assert(PF.cast.MARKS.includes(mark.text), `${feeling} shows "${mark.text}"`);
    }
    assertEqual(E.mark('asleep'), { text: 'z', every: 2 });
    assertEqual(E.mark('happy'), null);
  });

  test('a mark pops up, fades out at its end, and keeps still under reduced motion', () => {
    assertEqual(E.markAt(0, 1).opacity, 0);
    assertEqual(E.markAt(1, 1).scale, 1);
    assertEqual(E.markAt(1, 0).opacity, 0);
    assert(E.markAt(0.5, 1, { drifting: true }).rise > 0, 'a repeating mark drifts up');
    assertEqual(E.markAt(0.5, 1, { drifting: true, reduced: true }).rise, 0);
    assertEqual(E.markAt(0.01, 1, { reduced: true }).scale, 1);
  });

  test('describe says what a screen reader hears, with the name as its owner writes it', () => {
    assertEqual(E.describe('asleep', 'phy'), 'phy falls asleep.');
    assertEqual(E.describe('surprised', 'K3V1N'), 'K3V1N looks surprised.');
  });

  test('the lids come down over the open eyes, and flush spreads the blush', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    try {
      const rig = PF.mount(el, 'howdi', { bitmap: false }), eyeHeight = PF.get('howdi').eyes.h;
      const cheek = rig.parts.cheekL.getBoundingClientRect().width;
      const lidDrop = () => rig.parts.lidL.transform.baseVal.consolidate().matrix.f;
      assertEqual(lidDrop(), 0, 'the lid is up');
      rig.setPose({ lid: 1 });
      assert(lidDrop() > eyeHeight, `a shut lid comes down past the eye (${lidDrop()} against ${eyeHeight})`);
      rig.setPose({ lid: 0, flush: 0.5 });
      const flushed = rig.parts.cheekL.getBoundingClientRect().width;
      assert(Math.abs(flushed / cheek - 1.5) < 0.05, `the cheek grows ${flushed / cheek} times`);
    } finally {
      el.remove();
    }
  });
})();
