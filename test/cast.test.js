// Tests for src/cast.js. Each builds its own rules with PhyFriends.cast.rules(), so the installed cast
// (characters/cast.js) is never changed.
(function () {
  'use strict';
  const C = PhyFriends.cast;
  const entry = (name, extra = {}) => ({ name, credit: { handle: `@${name}`, href: '#' }, agreed: ['gallery'], ...extra });
  const sample = (extra = {}) => C.rules({
    host: 'phy',
    friends: {
      phy: entry('phy', { agreed: ['gallery', 'video', 'games'], voice: true }),
      yuda: entry('Yuda'), terry: entry('Terry'), kevin: entry('K3V1N'), brian: entry('Brian'),
    },
    ...extra,
  });

  test('two friends are strangers unless the cast says they know each other', () => {
    const cast = sample({ know: [['yuda', 'terry']] });
    assertEqual(cast.relation('kevin', 'brian'), 'strangers');
    assertEqual(cast.relation('terry', 'yuda'), 'know');
  });

  test('the host knows everyone', () => {
    const cast = sample();
    for (const name of ['yuda', 'terry', 'kevin', 'brian']) assertEqual(cast.relation('phy', name), 'know', name);
  });

  test('strangers may share a scene, look at and greet each other', () => {
    const cast = sample();
    for (const verb of ['share', 'watch', 'greet']) assert(cast.allows(verb, 'kevin', 'brian'), verb);
  });

  test('strangers may not stand close, talk, give or team up', () => {
    const cast = sample();
    for (const verb of ['near', 'talk', 'give', 'team']) assert(!cast.allows(verb, 'kevin', 'brian'), verb);
  });

  test('touch and rivalry need an opt-in even between friends who know each other', () => {
    const cast = sample({ know: [['yuda', 'terry']], optIn: [{ pair: ['terry', 'yuda'], verbs: ['touch'] }] });
    assert(cast.allows('touch', 'yuda', 'terry'), 'touch with an opt-in');
    assert(!cast.allows('rival', 'yuda', 'terry'), 'rival without an opt-in');
    assert(!cast.allows('touch', 'phy', 'kevin'), 'touch with the host');
  });

  test('a refusal names both friends as their owners write them and says how to allow it', () => {
    assertThrows(() => sample().ensure('talk', 'kevin', 'brian'), /K3V1N and Brian are strangers.*\['kevin', 'brian'\] to know/);
  });

  test('only a friend with a voice says words; everyone may use marks', () => {
    const cast = sample();
    cast.ensureVoice('phy', 'happy birthday, Yuda!');
    for (const mark of C.MARKS) cast.ensureVoice('terry', mark);
    assertThrows(() => cast.ensureVoice('terry', 'hello'), /Terry has no voice/);
  });

  test('strangers keep a wider gap than friends who know each other, and touch removes it', () => {
    const cast = sample({ know: [['yuda', 'terry']], optIn: [{ pair: ['yuda', 'terry'], verbs: ['touch'] }] });
    assert(cast.gap('kevin', 'brian') > cast.gap('phy', 'kevin'), 'strangers keep more room');
    assertEqual(cast.gap('yuda', 'terry'), -Infinity);
  });

  test('a medium counts only once the owner has agreed to it', () => {
    const cast = sample();
    assert(cast.agreed('phy', 'video'), 'phy');
    assert(!cast.agreed('yuda', 'video'), 'yuda');
    assertThrows(() => cast.agreed('yuda', 'radio'), /unknown medium/);
  });

  test('a cast naming an unknown friend or opt-in is refused', () => {
    assertThrows(() => sample({ know: [['yuda', 'nobody']] }), /"nobody" is not in the cast/);
    assertThrows(() => sample({ optIn: [{ pair: ['yuda', 'terry'], verbs: ['hug'] }] }), /"hug" is not an opt-in/);
  });

  test('the installed cast credits every registered friend', () => {
    for (const name of PhyFriends.list()) {
      const friend = C.friend(name);
      assert(friend.name && friend.credit && friend.credit.handle && friend.credit.href, name);
    }
  });

  test('an opt-in pair named twice keeps the verbs of both entries', () => {
    const cast = sample({ know: [['yuda', 'terry']], optIn: [{ pair: ['yuda', 'terry'], verbs: ['touch'] }, { pair: ['terry', 'yuda'], verbs: ['rival'] }] });
    assert(cast.allows('touch', 'yuda', 'terry') && cast.allows('rival', 'yuda', 'terry'), 'both');
  });
})();
