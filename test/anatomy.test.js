// Tests of the house anatomy (PhyFriends.ANATOMY and PhyFriends.check): every friend but Claude is made of the same
// parts, named the same way, and a part that a friend lacks is declared rather than left out.
(function () {
  'use strict';
  const PF = PhyFriends, { EXCEPTIONS, houseFriends } = support;
  // A friend's spec to break on purpose: a deep copy, so that the registered friend is never changed.
  const copy = name => JSON.parse(JSON.stringify(PF.get(name)));
  const departs = (spec, pattern) => PF.check(spec).some(p => pattern.test(p));

  test('every friend but Claude keeps to the house anatomy', () => {
    for (const name of houseFriends()) assertEqual(PF.check(name), [], name);
  });

  test('Claude is the one friend outside the house anatomy', () => {
    assertEqual(PF.list().filter(name => PF.check(name).length), EXCEPTIONS);
  });

  test("every friend's palette opens with the same roles, in the same order", () => {
    const roles = Object.keys(PF.ANATOMY.roles);
    for (const name of houseFriends()) {
      const given = Object.keys(PF.get(name).palette).filter(k => roles.includes(k));
      for (const role of ['bg', 'fur', 'head', 'ear', 'iris', 'ink', 'blush', 'tongue', 'body', 'tail', 'arm', 'paw', 'leg', 'foot']) {
        assert(given.includes(role), `${name} has no ${role}`);
      }
      assertEqual(Object.keys(PF.get(name).palette).slice(0, given.length), given, name);
    }
  });

  test('a friend that stands and leaves out its seated foot departs from the anatomy', () => {
    const spec = copy('yuda');
    delete spec.stand.seat.foot;
    assert(departs(spec, /stand\.seat has no foot/), 'a seated foot left out');
    spec.stand.seat.foot = false;
    assertEqual(PF.check(spec), [], 'a seated foot declared hidden');
  });

  test('a part left out, a misnamed key, and a part with a color of its own each depart from the anatomy', () => {
    const noHair = copy('jiaoyue');
    delete noHair.hair;
    assert(departs(noHair, /no hair/), 'hair left out');
    const feet = copy('jiaoyue');
    feet.stand.seat.feet = feet.stand.seat.foot;
    assert(departs(feet, /stand\.seat\.feet is not a key/), 'feet for foot');
    const colored = copy('jiaoyue');
    colored.body.color = 'fur';
    assert(departs(colored, /body\.color is set: give the palette's body instead/), 'a body color of its own');
    const typo = copy('jiaoyue');
    typo.extras[0].fill = 'brows';
    assert(departs(typo, /names no color of the palette \("brows"\)/), 'a color the palette lacks');
    const ear = copy('tanyuan');
    ear.ears.right.color = 'furShade';
    assert(departs(ear, /ears\.right\.color is set: give the palette's earRight instead/), 'a right ear with a color of its own');
    const paw = copy('mumuyou');
    paw.stand.arms.right.paw = { color: 'earInner' };
    assert(departs(paw, /stand\.arms\.right\.paw\.color is set: give the palette's pawRight instead/), 'a right paw with a color of its own');
  });

  test('an extra names a feature of the house list, so that what friends share has one name', () => {
    const spec = copy('jiaoyue');
    spec.extras[0].feature = 'eyebrows';
    assert(departs(spec, /names no feature of the house's list \("eyebrows"\)/), 'eyebrows for brows');
    const brows = name => PF.get(name).extras.filter(x => x.feature === 'brows').length;
    for (const name of ['yuda', 'brian', 'kevin', 'tanyuan', 'alfie', 'jiaoyue']) assertEqual(brows(name), 2, name);
  });

  test('a palette role may name another role, or its house shade, and takes its color', () => {
    const spec = copy('jiaoyue'), palette = PF.palette(spec);
    assertEqual(palette.paw, palette.face, 'paw: face');
    assertEqual(palette.body, palette.furShade, 'body: furShade');
    assertEqual(palette.leg, palette.furShade, 'leg: furShade');
  });
})();
