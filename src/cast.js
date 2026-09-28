/*!
 * phy_friends/cast: who the friends are, and what they may do together.
 *
 * Every friend belongs to a real person, and not every owner knows every other one. So two friends
 * are strangers unless the cast says that their owners know each other; the host (phy, whose friends
 * they all are) knows everyone. What two friends may do together depends on that relation:
 *
 *   strangers  share a scene, look at each other, react to the same thing, take turns, and greet
 *              each other from a polite distance;
 *   know       also stand close, talk to each other, hand each other things and play on one side;
 *   opted in   touching and rivalry (competing head to head, teasing) need both owners to agree,
 *              pair by pair, even when they know each other.
 *
 * Two rules hold whoever knows whom. Only a friend with a voice speaks in words: the host, and anyone
 * whose owner has given them lines. Everyone else speaks in marks (MARKS), so that nobody is given
 * words or a personality their owner never gave them. And a friend appears in a medium (a film, a
 * game) only once its owner has agreed to it; until then, work that shows it is a draft.
 *
 * The data lives in characters/cast.js. src/scene.js checks these rules wherever friends meet, and
 * a game calls ensure() before anything the scene cannot see, such as putting two friends on one
 * side. A broken rule throws, with a message that says what would make it allowed.
 *
 * Loads as a classic script after phyfriends.js (PhyFriends.cast), or through require().
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./phyfriends.js'));
  else factory(root.PhyFriends);
})(typeof self !== 'undefined' ? self : this, function (PF) {
  'use strict';

  // What each verb needs: a relation ('strangers' or 'know'), or an opt-in of the same name.
  const VERBS = {
    share: { needs: 'strangers', phrase: 'share a scene with' },
    watch: { needs: 'strangers', phrase: 'look at' },
    greet: { needs: 'strangers', phrase: 'greet' },
    near: { needs: 'know', phrase: 'stand close to' },
    talk: { needs: 'know', phrase: 'talk to' },
    give: { needs: 'know', phrase: 'hand something to' },
    team: { needs: 'know', phrase: 'play on the same side as' },
    touch: { needs: 'touch', phrase: 'touch' },
    rival: { needs: 'rival', phrase: 'compete against or tease' },
  };
  const OPT_INS = ['touch', 'rival'];
  const MEDIA = ['gallery', 'video', 'games'];

  // The marks a friend without a voice may use: surprise, a question, a pause, a song, a doze.
  const MARKS = ['!', '?', '!?', '…', '♪', 'z'];

  // The least gap between two friends' outlines (heads, bodies and tails, not ears), in head units.
  // Strangers keep a strip of paper between them; friends who know each other may stand side by side.
  // Only an opt-in to touch lets outlines meet.
  const GAP = { strangers: 40, know: 4, touch: -Infinity };

  let installed = null;

  // Installs the cast that scenes use (characters/cast.js calls this once).
  function define(data) {
    installed = rules(data);
    return api;
  }

  function current() {
    if (!installed) throw new Error('phy_friends/cast: no cast is defined; load characters/cast.js after src/cast.js');
    return installed;
  }

  // Validates a cast and returns its rules, without installing it (tests use this directly). Every
  // name must be a registered character.
  function rules(data) {
    const friends = data.friends || {};
    for (const name of Object.keys(friends)) PF.get(name);
    const known = name => {
      if (!friends[name]) throw new Error(`phy_friends/cast: "${name}" is not in the cast; add it to friends in characters/cast.js`);
      return name;
    };
    const host = known(data.host);
    for (const [name, entry] of Object.entries(friends)) {
      for (const medium of entry.agreed || []) {
        if (!MEDIA.includes(medium)) throw new Error(`phy_friends/cast: ${name} agreed to an unknown medium "${medium}"; use ${MEDIA.join(', ')}`);
      }
    }
    const know = new Set((data.know || []).map(([a, b]) => pairKey(known(a), known(b))));
    const optIns = new Map();
    for (const { pair: [a, b], verbs } of data.optIn || []) {
      for (const verb of verbs) {
        if (!OPT_INS.includes(verb)) throw new Error(`phy_friends/cast: "${verb}" is not an opt-in; use ${OPT_INS.join(' or ')}`);
      }
      const key = pairKey(known(a), known(b));
      optIns.set(key, new Set([...(optIns.get(key) || []), ...verbs]));  // A pair named twice keeps both lists.
    }

    // The cast's entry for a friend: { name, pronoun, species, credit: { handle, href }, voice, agreed }.
    function friend(name) {
      return friends[known(name)];
    }

    // 'self', 'know' or 'strangers'.
    function relation(a, b) {
      known(a); known(b);
      if (a === b) return 'self';
      return a === host || b === host || know.has(pairKey(a, b)) ? 'know' : 'strangers';
    }

    function optedIn(a, b, verb) {
      const verbs = optIns.get(pairKey(a, b));
      return !!verbs && verbs.has(verb);
    }

    function allows(verb, a, b) {
      const rule = VERBS[verb];
      if (!rule) throw new Error(`phy_friends/cast: unknown verb "${verb}"; use one of ${Object.keys(VERBS).join(', ')}`);
      const r = relation(a, b);
      if (r === 'self' || rule.needs === 'strangers') return true;
      if (rule.needs === 'know') return r === 'know';
      return optedIn(a, b, rule.needs);
    }

    // Throws unless a may do `verb` with b, saying what would make it allowed.
    function ensure(verb, a, b) {
      if (allows(verb, a, b)) return;
      const rule = VERBS[verb], A = friend(a).name, B = friend(b).name;
      const why = rule.needs === 'know'
        ? `${A} and ${B} are strangers, so ${A} may not ${rule.phrase} ${B}. Add ['${a}', '${b}'] to know in characters/cast.js once their owners know each other.`
        : `${A} may not ${rule.phrase} ${B} unless both owners opt in. Add { pair: ['${a}', '${b}'], verbs: ['${rule.needs}'] } to optIn in characters/cast.js once they have.`;
      throw new Error(`phy_friends/cast: ${why}`);
    }

    // The least gap between the outlines of a and b, in head units.
    function gap(a, b) {
      if (optedIn(a, b, 'touch')) return GAP.touch;
      return relation(a, b) === 'strangers' ? GAP.strangers : GAP.know;
    }

    function canSpeak(name) {
      return name === host || !!friend(name).voice;
    }

    // Throws unless the friend may say these words: words need a voice, and a mark must be one of MARKS.
    function ensureVoice(name, words) {
      if (MARKS.includes(words) || canSpeak(name)) return;
      throw new Error(`phy_friends/cast: ${friend(name).name} has no voice and speaks in marks (${MARKS.join(' ')}), ` +
        `not in words ("${words}"). Set voice: true for ${name} in characters/cast.js only if its owner has given it lines.`);
    }

    function agreed(name, medium) {
      if (!MEDIA.includes(medium)) throw new Error(`phy_friends/cast: unknown medium "${medium}"; use ${MEDIA.join(', ')}`);
      return (friend(name).agreed || []).includes(medium);
    }

    return { host, friend, names: () => Object.keys(friends), relation, allows, ensure, gap, canSpeak, ensureVoice, agreed };
  }

  function pairKey(a, b) {
    return [a, b].sort().join('+');
  }

  // The installed cast's rules, under the same names (see rules()).
  const delegate = method => (...args) => current()[method](...args);
  const api = {
    VERBS, MARKS, GAP, MEDIA, define, rules,
    get host() { return current().host; },
  };
  for (const method of ['friend', 'names', 'relation', 'allows', 'ensure', 'gap', 'canSpeak', 'ensureVoice', 'agreed']) api[method] = delegate(method);
  PF.cast = api;
  return api;
});
