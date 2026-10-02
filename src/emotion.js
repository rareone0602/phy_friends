/*!
 * phy_friends/emotion: how a friend feels, for every friend drawn on the house template.
 *
 * A feeling is shown with the parts every house-template friend has (FWIENDS.md): the eyes and
 * their lids, the blush and the mouth, the ears, the head, the tail and the posture. It needs no
 * new drawing. Each feeling comes in four forms:
 *
 *   face(name)    a partial pose: the feeling held still, for a still picture;
 *   react(name)   a clip that plays once as the feeling comes on: a start, a hop for joy, a yawn;
 *   hold(name)    a looping clip: the feeling held, with the movement that goes with it;
 *   feel(name)    a clip that never ends: the reaction, then the feeling held.
 *
 * All four are partial poses in the sense of src/anim.js, so they layer over a friend's idle clip,
 * and anim's parse() understands them ("layer(idle, hold('content'))").
 *
 * The body's share of a feeling follows from where the feeling sits on two axes: valence, from
 * unpleasant (-1) to pleasant (1), and arousal, from drowsy (-1) to alert (1), after Russell's
 * circumplex of affect (1980). Alert ears stand up, drowsy or unhappy ones droop, a pleased friend
 * holds itself up and an unhappy one slumps (posture()). Feelings that sit near each other therefore
 * look alike, and a new feeling needs only its place, what its face adds, and its movements.
 *
 * A friend standing (spec.stand) has arms and legs as well: its posture carries its arms (up and out
 * when pleased or alert, in and low when unhappy, limp when drowsy), and a feeling may add a gesture
 * (stand), such as paws on the hips, a paw under the chin or a shrug. A friend takes less of these fields the lower
 * it is, and seated it ignores them, so it shows every feeling as before.
 *
 * A feeling may have a mark, one of the marks in src/cast.js, written in the hand ('!' for surprise,
 * 'z' for sleep) or drawn in its line (a heart, a bead of sweat; markMarkup() gives either as markup),
 * which a scene or a live page shows above the head (markAt() is how it looks over time), and a few
 * words for a screen reader (describe()).
 *
 * Claude is the exception (FWIENDS.md, "Claude, the exception"): it keeps every rule but the shape,
 * and its ears are arms, so its spec sets `emotions: false` and fits() is false for it. Such a friend
 * moves as the others do but shows no feelings: given its spec, react() and feel() play a reaction's
 * movement alone, with no face and no posture, and hold() and face() leave it at rest. It still
 * returns a greeting: its hi (greeting()) is the hop for joy with a smile (smile()), the happy face's
 * eyes and mouth alone.
 *
 * Loads as a classic script after src/phyfriends.js and src/anim.js (PhyFriends.emotion), or through
 * require().
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const PF = require('./phyfriends.js');
    require('./anim.js');
    module.exports = factory(PF);
  } else factory(root.PhyFriends);
})(typeof self !== 'undefined' ? self : this, function (PF) {
  'use strict';

  const A = PF && PF.anim;
  if (!A) throw new Error('phy_friends/emotion: load src/phyfriends.js and src/anim.js first');

  const TAU = Math.PI * 2;
  const _ = undefined; // Leaves a string field to lower layers, as in src/anim.js.
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const wave = (t, period, phase = 0) => Math.sin((TAU * t) / period + phase);
  const tapShape = u => Math.abs(Math.sin(3 * Math.PI * u));  // A foot tapped three times, from 0 to 1.
  const HOLD_SECONDS = 8; // A held feeling loops in 8 s, or in a length that divides it, as idle does.
  const HOLD_EASE = 0.5;  // How long a held movement takes to take over from the reaction, in seconds.

  // ------------------------------------------------------------ Posture

  // The body's share of a feeling at (valence, arousal), as offsets on the neutral pose. Ears: positive
  // turns them outward (drooping), negative stands them up. Tail: positive swings the tip out and down,
  // negative raises it or tucks it in behind. turnY: positive tips the head down. Arms (a standing
  // friend's): positive raises them out to the side; elbows: positive opens the paws out, negative
  // curls them in.
  function posture(valence, arousal) {
    const good = Math.max(0, valence), bad = Math.max(0, -valence);
    const alert = Math.max(0, arousal), drowsy = Math.max(0, -arousal);
    const ears = -14 * alert * (1 - bad)  // Pricked up with interest,
      + 12 * drowsy + 14 * bad            // drooping when drowsy or unhappy,
      + 10 * bad * alert;                 // and laid back in fright.
    const arms = 12 * good + 12 * alert * (1 - bad)  // Up and out when pleased or alert,
      - 10 * bad - 6 * drowsy;                       // in and low when unhappy or drowsy;
    const elbows = 8 * good + 8 * bad                // the paws open,
      + 18 * drowsy                                  // hang limp when drowsy,
      - 12 * bad * alert;                            // and are clutched in fright.
    return {
      earL: ears, earR: ears,
      widen: 0.25 * alert - 0.08 * drowsy,
      lid: 0.4 * drowsy,
      turnY: 0.3 * bad + 0.25 * drowsy,
      headY: 2.5 * bad + 1.5 * drowsy,
      squash: 0.025 * good - 0.035 * bad - 0.015 * drowsy,
      tail: -5 * good + 12 * bad * (1 - alert) - 12 * bad * alert,  // Raised when pleased, limp when low, tucked in fright.
      flush: 0.3 * good,
      blush: 1 - 0.25 * bad,  // Paler when unhappy (blush multiplies).
      armL: arms, armR: arms, elbowL: elbows, elbowR: elbows,
      crouch: 4 * bad * alert + 2 * drowsy,  // Cowers in fright, and the knees go slack when drowsy.
    };
  }

  // ------------------------------------------------------------ Feelings

  // Each feeling: its place (valence, arousal); what its face adds to the posture (face); what a standing
  // friend adds to that (stand), if anything; how long its reaction takes (react.seconds) and how long of
  // that the face takes to come on (react.rise); the reaction's own movement, which starts and ends at
  // rest (react.motion, a clip); the movement while it is held (hold, a looping clip); its mark
  // ({ text, every } for a mark that repeats while the feeling lasts), if any; whether it turns the friend inward, its
  // eyes shut or its look turned away, so that it stops following what goes on (inward); and what a screen reader
  // hears (says), and of the greeting, which is the happy reaction (greets). The arms are drawn in front of the scarf
  // and the head, but for the shoulder, which tucks under them; a gesture may draw an arm whole in front, shoulder
  // too (over).
  const FEELINGS = {
    happy: {
      valence: 0.8, arousal: 0.5,
      face: { eyes: 'happy', mouth: 'w' },
      // A hop for joy: two bounces, eased in and out so that it starts and ends at rest. Standing, it
      // throws its arms up as it goes (src/anim.js, bounce).
      react: { seconds: 1.1, rise: 0.08, motion: () => A.weight(A.make.bounce(), t => Math.min(1, t / 0.08, (1.1 - t) / 0.2)) },
      // Standing, it sways from foot to foot with its paws swinging.
      hold: () => A.clip(t => ({
        tail: 7 * wave(t, 2 / 3), tilt: 2.5 * wave(t, 4), hair: -1.2 * wave(t, 4, -0.8),
        earL: 2 * wave(t, 2, 0.4), earR: 2 * wave(t, 2, 0.9),
        lean: 2 * wave(t, 2), armL: 6 * wave(t, 2, 0.5), armR: -6 * wave(t, 2, 0.5),
      }), 4, true),
      says: 'smiles',
      greets: 'hops twice',
    },
    excited: {
      valence: 0.8, arousal: 0.9,
      face: { widen: 0.1, mouth: 'open', lookY: -0.1, flush: 0.2 },
      stand: { armL: 80, elbowL: 30, armR: 80, elbowR: 30 },  // Standing, its paws are up by its face.
      // Crouches, then springs up off its feet.
      react: {
        seconds: 1, rise: 0.3,
        motion: () => A.track({
          crouch: [[0, 0], [0.15, 5], [0.3, -2, 'out'], [0.55, 0]],
          squash: [[0, 0], [0.15, -0.06], [0.3, 0.07, 'out'], [0.55, -0.02], [0.8, 0]],
          y: [[0, 0], [0.15, 1], [0.38, -12, 'out'], [0.6, 0, 'in']],
          stepL: [[0, 0], [0.3, 0], [0.42, 6, 'out'], [0.6, 0, 'in']], stepR: [[0, 0], [0.3, 0], [0.42, 6, 'out'], [0.6, 0, 'in']],
          earL: [[0, 0], [0.15, 6], [0.35, -12, 'out'], [0.6, 4], [0.9, 0]],
          earR: [[0, 0], [0.15, 6], [0.37, -12, 'out'], [0.62, 4], [0.92, 0]],
          tail: [[0, 0], [0.35, -8, 'out'], [0.6, 6], [1, 0]],
          hair: [[0, 0], [0.38, -3], [0.6, 2], [0.85, 0]],
        }),
      },
      // Bounces on the spot twice a second, its paws pumping by turns; the bouncing swells and dies away in 4 s, so
      // that it is never at it all the time.
      hold: () => A.clip(t => {
        const swell = (1 + Math.cos((TAU * t) / 4)) / 2, up = swell * Math.abs(wave(t, 1));
        return {
          y: -4 * up, squash: 0.03 * up - 0.01 * swell, crouch: 2 * swell - 2 * up,
          armL: 8 * swell * wave(t, 1), armR: -8 * swell * wave(t, 1),
          tail: 9 * wave(t, 0.5), earL: 3 * swell * wave(t, 1, 0.6), earR: 3 * swell * wave(t, 1, 0.9), hair: -1.5 * up,
        };
      }, 4, true),
      mark: { text: 'spark' },
      says: 'gets excited',
    },
    laughing: {
      valence: 0.9, arousal: 0.6,
      face: { eyes: 'squint', mouth: 'open', turnY: -0.25, tilt: -4, flush: 0.4 },
      stand: { armL: -25, elbowL: -80, armR: -25, elbowR: -80 },  // Standing, it holds its sides.
      // Throws its head back.
      react: {
        seconds: 0.8, rise: 0.15,
        motion: () => A.track({
          squash: [[0, 0], [0.15, 0.05, 'out'], [0.45, -0.02], [0.8, 0]],
          turnY: [[0, 0], [0.15, -0.2, 'out'], [0.8, 0]],
          headY: [[0, 0], [0.15, -2, 'out'], [0.45, 1], [0.8, 0]],
          earL: [[0, 0], [0.15, -6, 'out'], [0.45, 4], [0.8, 0]], earR: [[0, 0], [0.15, -6, 'out'], [0.47, 4], [0.8, 0]],
          tail: [[0, 0], [0.2, -6, 'out'], [0.5, 4], [0.8, 0]],
        }),
      },
      // Shakes with laughter, four times a second, in fits that swell and ease every 2 s, swaying as it goes.
      hold: () => A.clip(t => {
        const fit = 0.6 + 0.4 * Math.cos((TAU * t) / 2), shake = fit * Math.abs(wave(t, 0.5));
        return {
          headY: -1.5 * shake, squash: 0.025 * shake, y: -1 * shake, tilt: 4 * wave(t, 4),
          earL: 3 * shake, earR: 3 * shake, tail: 8 * wave(t, 0.5), hair: 1.5 * shake,
          elbowL: 6 * shake, elbowR: 6 * shake, lean: 2 * wave(t, 4),
        };
      }, 4, true),
      inward: true,
      says: 'laughs',
    },
    playful: {
      valence: 0.7, arousal: 0.6,
      face: { eyeR: 'happy', mouth: 'w', tilt: 8, headX: 1.5, lookX: -0.15 },
      stand: { armR: 80, elbowR: 75 },  // Standing, a paw up by the eye it winks.
      // Winks with a little hop.
      react: {
        seconds: 0.8, rise: 0.12,
        motion: () => A.track({
          y: [[0, 0], [0.12, 0], [0.32, -8, 'out'], [0.52, 0, 'in']],
          squash: [[0, 0], [0.12, -0.04], [0.3, 0.05, 'out'], [0.52, -0.04], [0.8, 0]],
          earR: [[0, 0], [0.15, -8, 'back'], [0.8, 0]],
          tail: [[0, 0], [0.3, -8, 'out'], [0.55, 6], [0.8, 0]],
        }),
      },
      // Hops from side to side, a hop a second, its head and paws swinging the way it goes.
      hold: () => A.clip(t => {
        const side = wave(t, 2), air = Math.abs(Math.cos((TAU * t) / 2));
        return {
          x: 4 * side, y: -5 * air, squash: 0.03 * air - 0.015, tilt: 5 * side, lean: 3 * side,
          armL: 10 * side, armR: -10 * side, tail: 10 * wave(t, 1), earL: 4 * air, earR: 4 * air, hair: -2 * side,
        };
      }, 2, true),
      says: 'looks playful',
    },
    fond: {
      valence: 0.8, arousal: -0.1,
      face: { eyes: 'happy', mouth: 'w', flush: 0.6, tilt: 8, headX: 1.5, turnY: 0.1 },
      // Standing, its paws are clasped under its chin.
      stand: { armL: -60, elbowL: -150, armR: -60, elbowR: -150, over: 'armL armR' },
      // Melts a little.
      react: {
        seconds: 1.2, rise: 0.5,
        motion: () => A.track({
          squash: [[0, 0], [0.4, -0.04], [0.8, 0.01], [1.2, 0]],
          headY: [[0, 0], [0.4, 2], [1.2, 0]],
          tail: [[0, 0], [0.4, -6], [0.8, 3], [1.2, 0]],
        }),
      },
      // Sways slowly from side to side, its tail going.
      hold: () => A.clip(t => ({
        tilt: 3 * wave(t, 4), lean: 2 * wave(t, 4, 0.4), headX: 1 * wave(t, 4, 0.2), tail: 6 * wave(t, 2),
        squash: 0.01 * wave(t, 4, 1), hair: -1 * wave(t, 4, -0.6), earL: 2 * wave(t, 4, 0.5), earR: 2 * wave(t, 4, 0.8),
      }), 4, true),
      mark: { text: 'heart' },
      inward: true,
      says: 'looks fond',
    },
    content: {
      valence: 0.7, arousal: -0.5,
      face: { eyes: 'happy', tilt: 7, headX: 1.5, flush: 0.25 },
      react: {
        seconds: 1, rise: 0.6,
        motion: () => A.track({ squash: [[0, 0], [0.35, -0.035], [1, 0]], headY: [[0, 0], [0.35, 1.5], [1, 0]] }),
      },
      // Standing, it sways gently.
      hold: () => A.clip(t => ({
        tilt: 2 * wave(t, 8), tail: 5 * wave(t, 4, 1), squash: 0.008 * wave(t, 4, 2), hair: 1 * wave(t, 8, -1),
        lean: 1.5 * wave(t, 8, 0.6),
      }), 8, true),
      mark: { text: '♪' },
      inward: true,
      says: 'looks content',
    },
    relieved: {
      valence: 0.5, arousal: -0.3,
      face: { eyes: 'closed', mouth: 'smile', headY: 1, turnY: 0.1 },
      // A sigh: breathes in, its shoulders rising, then breathes out and sinks.
      react: {
        seconds: 1.8, rise: 1.2,
        motion: () => A.track({
          squash: [[0, 0], [0.5, 0.045], [0.7, 0.045], [1.3, -0.03], [1.8, 0]],
          turnY: [[0, 0], [0.5, -0.35], [0.7, -0.35], [1.3, 0.15], [1.8, 0]],
          headY: [[0, 0], [0.5, -1.5], [0.7, -1.5], [1.3, 2.5], [1.8, 0]],
          earL: [[0, 0], [0.5, -6], [1.3, 8], [1.8, 0]], earR: [[0, 0], [0.5, -6], [1.3, 8], [1.8, 0]],
          armL: [[0, 0], [0.5, 15], [1.3, -6], [1.8, 0]], armR: [[0, 0], [0.5, 15], [1.3, -6], [1.8, 0]],
          crouch: [[0, 0], [0.5, -2], [1.3, 2.5], [1.8, 0]],
          tail: [[0, 0], [0.5, -5], [1.3, 6], [1.8, 0]],
        }),
      },
      // Breathes slowly and deeply.
      hold: () => A.clip(t => ({
        squash: 0.015 * wave(t, 4), headY: -0.8 * wave(t, 4), earL: 2 * wave(t, 4, -1), earR: 2 * wave(t, 4, -1.2),
        armL: 3 * wave(t, 4), armR: 3 * wave(t, 4), tail: 3 * wave(t, 4, 1),
      }), 4, true),
      mark: { text: 'sweat' },
      inward: true,
      says: 'sighs with relief',
    },
    proud: {
      valence: 0.6, arousal: 0.2,
      face: { eyes: 'happy', mouth: 'smile', turnY: -0.35, lookY: -0.2, squash: 0.02, tail: -6 },
      stand: { armL: 20, elbowL: -95, armR: 20, elbowR: -95 },  // Standing, its paws on its hips.
      react: {
        seconds: 0.8, rise: 0.3,
        motion: () => A.track({
          squash: [[0, 0], [0.25, 0.04, 'out'], [0.8, 0]], y: [[0, 0], [0.25, -1.5, 'out'], [0.8, 0]],
          crouch: [[0, 0], [0.25, -2, 'out'], [0.8, 0]],
        }),
      },
      hold: () => A.clip(t => ({ tail: 4 * wave(t, 4), tilt: 1.5 * wave(t, 8) }), 8, true),
      says: 'looks proud',
    },
    determined: {
      valence: 0.4, arousal: 0.6,
      face: { lid: 0.22, lidTilt: 14, mouth: 'flat', turnY: 0.1, lookY: -0.05 },
      // Standing, its fists are up at its chest and its feet planted apart.
      stand: { armL: 70, elbowL: -140, armR: 70, elbowR: -140, legL: 6, legR: 6 },
      // A firm nod, and a stamp of each foot.
      react: {
        seconds: 0.8, rise: 0.2,
        motion: () => A.track({
          turnY: [[0, 0], [0.15, 0.45, 'out'], [0.4, 0]],
          headY: [[0, 0], [0.15, 3, 'out'], [0.4, 0]],
          squash: [[0, 0], [0.15, -0.04], [0.35, 0.03], [0.6, 0]],
          stepL: [[0, 0], [0.1, 5, 'out'], [0.2, 0, 'in']], stepR: [[0, 0], [0.25, 0], [0.35, 5, 'out'], [0.45, 0, 'in']],
          earL: [[0, 0], [0.15, 6], [0.4, -4], [0.8, 0]], earR: [[0, 0], [0.15, 6], [0.4, -4], [0.8, 0]],
        }),
      },
      // Breathes steadily, leaning into it; standing, its fists pump once in 4 s.
      hold: () => A.clip(t => {
        const pump = Math.sin(Math.PI * clamp((t - 2) / 0.5, 0, 1));
        return {
          squash: 0.012 * wave(t, 2), headY: -0.6 * wave(t, 2), tail: 4 * wave(t, 2, 1), lean: 1 * wave(t, 4),
          armL: 8 * pump, armR: 8 * pump, elbowL: -10 * pump, elbowR: -10 * pump,
        };
      }, 4, true),
      says: 'looks determined',
    },
    inspired: {
      valence: 0.6, arousal: 0.8,
      face: { widen: 0.2, mouth: 'open', lookY: -0.3, turnY: -0.15 },
      stand: { armL: 85, elbowL: 45 },  // Standing, a paw raised beside its head.
      // Goes still for a beat, then starts up.
      react: {
        seconds: 0.9, rise: 0.15,
        motion: () => A.track({
          y: [[0, 0], [0.12, 0], [0.3, -6, 'out'], [0.55, 0, 'in']],
          squash: [[0, 0], [0.12, -0.03], [0.3, 0.06, 'out'], [0.55, -0.02], [0.8, 0]],
          earL: [[0, 0], [0.3, -12, 'out'], [0.6, 2], [0.9, 0]], earR: [[0, 0], [0.3, -12, 'out'], [0.62, 2], [0.9, 0]],
          tail: [[0, 0], [0.3, -8, 'out'], [0.6, 4], [0.9, 0]],
          hair: [[0, 0], [0.3, 4, 'out'], [0.55, -2], [0.8, 0]],
          mouth: [[0, _], [0.1, 'o'], [0.3, _]],
        }),
      },
      // Rocks on its toes, the raised paw bobbing with it.
      hold: () => A.clip(t => ({
        y: -1.5 * Math.abs(wave(t, 2)), armL: 6 * wave(t, 1), tail: 6 * wave(t, 1),
        earL: 2 * wave(t, 1, 0.5), earR: 2 * wave(t, 1, 0.8), tilt: 2 * wave(t, 4),
      }), 4, true),
      mark: { text: 'bulb' },
      says: 'has an idea',
    },
    curious: {
      valence: 0.2, arousal: 0.4,
      face: { tilt: 9, headX: 2, turnX: 0.2, lookX: 0.2, lookY: -0.3, earL: 8, earR: -8 },
      stand: { armR: -60, elbowR: -150, over: 'armR' },  // Standing, a paw raised to its chest, under its chin.
      react: {
        seconds: 1.2, rise: 0.5,
        motion: () => A.track({
          earR: [[0, 0], [0.5, -6, 'back'], [1.2, 0]],
          tail: [[0, 0], [0.5, -7, 'back'], [1.2, 0]],
          mouth: [[0, _], [0.35, 'o'], [1.1, _]],
        }),
      },
      // Tilts the head one way, then the other.
      hold: () => A.layer(A.track({
        tilt: [[0, 0], [1.7, 0], [2.2, -18, 'back'], [3.4, -18], [4, 0]],
        headX: [[0, 0], [1.7, 0], [2.2, -4], [3.4, -4], [4, 0]],
        turnX: [[0, 0], [1.7, 0], [2.2, -0.4], [3.4, -0.4], [4, 0]],
        lookX: [[0, 0], [1.7, 0], [1.95, -0.65, 'out'], [3.4, -0.65], [3.8, 0]],
        earL: [[0, 0], [1.7, 0], [2.2, -18, 'back'], [3.4, -18], [4, 0]],
        earR: [[0, 0], [1.7, 0], [2.2, 16], [3.4, 16], [4, 0]],
        hair: [[0, 0], [1.7, 0], [2.3, 3], [3.4, 3], [4, 0]],
        tail: [[0, 0], [2.2, 4, 'back'], [2.8, 1], [3.4, 3], [4, 0]],
      }, { duration: 4, loop: true }), A.blinks([1.2, 2.9], 4)),
      mark: { text: '?' },
      says: 'looks curious',
    },
    thoughtful: {
      valence: 0.1, arousal: 0.1,
      face: { lookX: 0.5, lookY: -0.65, turnX: 0.25, turnY: -0.15, tilt: -5, mouth: 'flat', lid: 0.1 },
      // Standing, a paw at its chin and the other arm across under it.
      stand: { armR: -60, elbowR: -150, armL: -45, elbowL: -95, over: 'armR' },
      // Looks up and away.
      react: {
        seconds: 1, rise: 0.6,
        motion: () => A.track({
          earR: [[0, 0], [0.5, -6, 'back'], [1, 0]],
          squash: [[0, 0], [0.5, 0.015], [1, 0]],
        }),
      },
      // Turns the question over: its eyes go from one side to the other and back, its head tipping with them, and
      // standing, it taps its chin.
      hold: () => {
        const across = A.track({ u: [[0, 0], [2.5, 0], [3.1, 1], [5.5, 1], [6.1, 0], [8, 0]] });
        return A.clip(t => {
          const u = across(t).u, tap = tapShape(clamp((t - 0.8) / 0.9, 0, 1)) + tapShape(clamp((t - 6.6) / 0.9, 0, 1));
          return {
            lookX: -0.9 * u, turnX: -0.45 * u, tilt: 9 * u, headX: -1.5 * u,
            elbowR: 8 * tap, tail: 4 * wave(t, 8, 1), earL: 3 * u, earR: -3 * u,
          };
        }, HOLD_SECONDS, true);
      },
      mark: { text: '…' },
      inward: true,
      says: 'thinks',
    },
    shy: {
      valence: 0.3, arousal: 0.2,
      face: { flush: 0.7, lookX: 0.55, lookY: 0.5, turnX: 0.3, turnY: 0.25, tilt: -5, earL: 12, earR: 12, tail: -6 },
      // Standing, it holds its paws together and turns a foot in.
      stand: { armL: -55, elbowL: -30, armR: -55, elbowR: -30, legR: -10, stepR: 3, lean: -2 },
      react: {
        seconds: 0.7, rise: 0.25,
        motion: () => A.track({
          squash: [[0, 0], [0.15, -0.06, 'out'], [0.7, 0]], headY: [[0, 0], [0.15, 3, 'out'], [0.7, 0]],
          crouch: [[0, 0], [0.15, 3, 'out'], [0.7, 0]],
        }),
      },
      // Steals a glance at whoever it is shy of, then looks away again; standing, it scuffs the turned-in foot.
      hold: () => A.track({
        lookX: [[0, 0], [1.6, 0], [1.75, -0.45, 'out'], [2.3, -0.45], [2.5, 0, 'out'], [4, 0]],
        turnX: [[0, 0], [1.6, 0], [1.9, -0.15], [2.3, -0.15], [2.7, 0], [4, 0]],
        tail: [[0, 0], [0.8, 0], [1.1, 4], [1.4, 0], [3.1, 0], [3.4, 3], [3.7, 0], [4, 0]],
        legR: [[0, 0], [2.7, 0], [3, 5], [3.3, -2], [3.6, 0], [4, 0]],
      }, { duration: 4, loop: true }),
      inward: true,
      says: 'goes shy',
    },
    surprised: {
      valence: 0, arousal: 0.9,
      face: { widen: 0.1, lookY: -0.15, turnY: -0.2 },
      stand: { armL: 65, elbowL: 15, armR: 65, elbowR: 15 },  // Standing, its arms flung out.
      react: {
        seconds: 1.9, rise: 0.1,
        motion: () => A.track({
          armL: [[0, 0], [0.1, 25, 'out'], [0.4, 0]], armR: [[0, 0], [0.1, 25, 'out'], [0.4, 0]],
          stepL: [[0, 0], [0.1, 3, 'out'], [0.35, 0, 'in']], stepR: [[0, 0], [0.1, 3, 'out'], [0.35, 0, 'in']],
          squash: [[0, 0], [0.1, 0.05, 'out'], [0.3, -0.03], [0.5, 0.01], [0.7, 0]],
          y: [[0, 0], [0.1, -3, 'out'], [0.35, 0, 'in']],
          headY: [[0, 0], [0.1, -2, 'out'], [0.3, 1], [0.5, 0]],
          widen: [[0, 0], [0.1, 0.15, 'back'], [1.2, 0.05], [1.7, 0]],
          earL: [[0, 0], [0.1, -6, 'out'], [0.3, 2], [0.6, 0]],
          earR: [[0, 0], [0.1, -6, 'out'], [0.3, 2], [0.6, 0]],
          hair: [[0, 0], [0.1, 4, 'out'], [0.3, -2], [0.5, 1], [0.7, 0]],
          tail: [[0, 0], [0.1, -6, 'out'], [0.3, 2], [0.6, 0]],  // Snaps up.
          mouth: [[0, _], [0.08, 'o'], [1.3, _]],
          blink: [[0, 0], [0.9, 0], [0.96, 1, 'in'], [1.05, 0, 'out'], [1.12, 1, 'in'], [1.22, 0, 'out']],
        }),
      },
      hold: () => A.blinks([1.4, 1.7], 4),
      mark: { text: '!' },
      says: 'looks surprised',
    },
    confused: {
      valence: -0.2, arousal: 0.3,
      face: { tilt: -10, headX: -2, turnX: -0.1, mouth: 'wobble', lid: 0.12, lidTilt: -10, lookY: -0.1 },
      stand: { armL: 30, elbowL: 60, armR: 30, elbowR: 60 },  // Standing, it shrugs, its paws turned up.
      // A double take: looks one way, then the other.
      react: {
        seconds: 1.2, rise: 0.8,
        motion: () => A.track({
          lookX: [[0, 0], [0.15, -0.6, 'out'], [0.45, -0.6], [0.6, 0.6, 'out'], [0.9, 0.6], [1.2, 0]],
          turnX: [[0, 0], [0.15, -0.3, 'out'], [0.45, -0.3], [0.6, 0.3, 'out'], [0.9, 0.3], [1.2, 0]],
          squash: [[0, 0], [0.15, -0.02], [0.6, 0.02], [1.2, 0]],
        }),
      },
      // Tips its head the other way and back; standing, its paws bob as it shrugs again.
      hold: () => {
        const other = A.track({ u: [[0, 0], [1.6, 0], [2, 1, 'back'], [3.4, 1], [3.8, 0], [4, 0]] });
        return A.clip(t => {
          const u = other(t).u;
          return {
            tilt: 20 * u, headX: 4 * u, turnX: 0.2 * u, earL: -6 * u, earR: 6 * u,
            elbowL: 8 * u, elbowR: 8 * u, squash: 0.012 * u, tail: 4 * wave(t, 2),
          };
        }, 4, true);
      },
      mark: { text: '??' },
      says: 'looks confused',
    },
    nervous: {
      valence: -0.4, arousal: 0.5,
      face: { lid: 0.1, lidTilt: -14, mouth: 'wobble', lookX: 0.25, turnX: -0.1, squash: -0.015 },
      // Standing, its paws are together in front and its knees in.
      stand: { armL: -45, elbowL: -45, armR: -45, elbowR: -45, legL: -4, legR: -4 },
      // A gulp, and a glance aside.
      react: {
        seconds: 0.7, rise: 0.2,
        motion: () => A.track({
          headY: [[0, 0], [0.15, 2, 'out'], [0.35, -1], [0.6, 0]],
          squash: [[0, 0], [0.15, -0.04, 'out'], [0.4, 0.01], [0.6, 0]],
          lookX: [[0, 0], [0.1, -0.5, 'out'], [0.35, -0.5], [0.45, 0, 'out']],
        }),
      },
      // Its eyes dart about, it trembles a little and its paws fidget.
      hold: () => A.layer(
        A.clip(t => ({
          headX: 0.3 * wave(t, 0.125), elbowL: 6 * wave(t, 0.5), elbowR: -6 * wave(t, 0.5), tail: 2 * wave(t, 0.25, 1),
        }), 4, true),
        A.track({ lookX: [[0, 0], [0.6, 0], [0.7, -0.6, 'out'], [1.3, -0.6], [1.4, 0.3, 'out'], [2.6, 0.3], [2.7, -0.4, 'out'], [3.3, -0.4], [3.4, 0, 'out'], [4, 0]] },
          { duration: 4, loop: true })),
      mark: { text: 'sweat' },
      says: 'looks nervous',
    },
    scared: {
      valence: -0.7, arousal: 0.8,
      face: { widen: 0.1, mouth: 'frown', squash: -0.03, headY: 2, turnY: 0.1 },
      // Standing, it holds its paws up by its face, in front of the head, and its knees in.
      stand: { armL: 150, elbowL: -30, armR: 150, elbowR: -30, over: 'armL armR', legL: -5, legR: -5 },
      react: {
        seconds: 0.6, rise: 0.12,
        motion: () => A.track({
          squash: [[0, 0], [0.1, -0.07, 'out'], [0.6, 0]], x: [[0, 0], [0.1, -3, 'out'], [0.6, 0]],
          tilt: [[0, 0], [0.1, -4, 'out'], [0.6, 0]], crouch: [[0, 0], [0.1, 5, 'out'], [0.6, 0]],
        }),
      },
      // Trembles, paws and all, and glances from side to side.
      hold: () => A.layer(
        A.clip(t => ({
          headX: 0.5 * wave(t, 0.1), tail: 1.5 * wave(t, 0.1, 1), elbowL: 2 * wave(t, 0.1, 2), elbowR: 2 * wave(t, 0.1, 2.5),
        }), 4, true),
        A.track({ lookX: [[0, 0], [0.5, 0], [0.6, -0.4, 'out'], [1.4, -0.4], [1.5, 0.4, 'out'], [2.4, 0.4], [2.5, 0, 'out'], [4, 0]] },
          { duration: 4, loop: true })),
      mark: { text: '!?' },
      says: 'looks scared',
    },
    cross: {
      valence: -0.5, arousal: 0.4,
      face: { lid: 0.3, lidTilt: 18, mouth: 'frown', turnX: -0.15, lookX: 0.25, turnY: 0.1 },
      stand: { armL: -15, elbowL: -115, armR: -10, elbowR: -123 },  // Standing, its arms folded.
      react: {
        seconds: 0.7, rise: 0.2,
        motion: () => A.track({
          squash: [[0, 0], [0.12, 0.04, 'out'], [0.3, -0.03], [0.7, 0]],
          earL: [[0, 0], [0.12, 8, 'out'], [0.7, 0]], earR: [[0, 0], [0.12, 8, 'out'], [0.7, 0]],
          stepR: [[0, 0], [0.08, 6, 'out'], [0.18, 0, 'in']],  // Standing, it stamps.
        }),
      },
      // The tail lashes twice in 4 s, and an ear twitches; standing, it taps a foot.
      hold: () => A.clip(t => ({
        tail: 9 * A.swishShape(clamp((t - 0.8) / 0.6, 0, 1)) + 9 * A.swishShape(clamp((t - 2.6) / 0.6, 0, 1)),
        earR: 6 * A.flickShape(clamp((t - 1.9) / 0.4, 0, 1)),
        stepR: 4 * tapShape(clamp((t - 0.2) / 0.9, 0, 1)) + 4 * tapShape(clamp((t - 2.2) / 0.9, 0, 1)),
      }), 4, true),
      says: 'looks cross',
    },
    dizzy: {
      valence: -0.2, arousal: 0,
      face: { eyes: 'swirl', mouth: 'wobble' },
      // Standing, its arms are out for balance and its feet apart.
      stand: { armL: 50, elbowL: 10, armR: 50, elbowR: 10, legL: 6, legR: 6 },
      // Staggers.
      react: {
        seconds: 1, rise: 0.2,
        motion: () => A.track({
          x: [[0, 0], [0.25, -3], [0.55, 3], [0.8, -1], [1, 0]],
          tilt: [[0, 0], [0.25, -8], [0.55, 8], [0.8, -3], [1, 0]],
          squash: [[0, 0], [0.25, -0.03], [0.55, 0.01], [1, 0]],
        }),
      },
      // Its head goes round in circles, and its body sways after it.
      hold: () => A.clip(t => ({
        headX: 2.5 * wave(t, 2, Math.PI / 2), headY: 1.2 * wave(t, 2), tilt: 7 * wave(t, 2, Math.PI / 2 - 0.5),
        lean: 3 * wave(t, 2, Math.PI / 2 - 0.8), x: 1 * wave(t, 2, Math.PI / 2 - 1),
        earL: 4 * wave(t, 2), earR: -4 * wave(t, 2), tail: 6 * wave(t, 2, Math.PI / 2 - 1), hair: -2 * wave(t, 2, Math.PI / 2 - 0.6),
      }), 2, true),
      mark: { text: 'swirl' },
      inward: true,
      says: 'looks dizzy',
    },
    bored: {
      valence: -0.4, arousal: -0.6,
      face: { lid: 0.5, mouth: 'flat', lookX: -0.4, lookY: 0.15, turnX: -0.15, tilt: -5 },
      stand: { legR: 6, lean: -3, armL: -4, armR: -4 },  // Standing, it rests its weight on one leg.
      // A long breath out.
      react: {
        seconds: 1.4, rise: 1,
        motion: () => A.track({
          squash: [[0, 0], [0.5, 0.02], [1.1, -0.03], [1.4, 0]],
          earL: [[0, 0], [0.5, -3], [1.1, 6], [1.4, 0]], earR: [[0, 0], [0.5, -3], [1.1, 6], [1.4, 0]],
          headY: [[0, 0], [0.5, -1], [1.1, 2], [1.4, 0]],
        }),
      },
      // Its eyes wander off and back, and it sighs once in 8 s; standing, it swings a foot.
      hold: () => A.track({
        lookX: [[0, 0], [2.5, 0], [3.2, 0.6], [5, 0.6], [5.7, 0], [8, 0]],
        turnX: [[0, 0], [2.5, 0], [3.4, 0.2], [5, 0.2], [5.9, 0], [8, 0]],
        squash: [[0, 0], [6, 0], [6.5, 0.02], [7.3, -0.025], [8, 0]],
        headY: [[0, 0], [6, 0], [6.5, -1], [7.3, 1.5], [8, 0]],
        lid: [[0, 0], [6, 0], [6.5, -0.1], [7.3, 0.1], [8, 0]],
        legL: [[0, 0], [0.5, 0], [1, 6], [1.5, 0], [2, 6], [2.5, 0], [8, 0]],
        tail: [[0, 0], [1, 3], [2, 0], [8, 0]],
      }, { duration: HOLD_SECONDS, loop: true }),
      inward: true,
      says: 'looks bored',
    },
    sad: {
      valence: -0.7, arousal: -0.4,
      face: { lid: 0.15, lidTilt: -16, mouth: 'frown', lookY: 0.45, lookX: -0.1 },
      stand: { armL: -4, armR: -4, legL: -4, legR: -4 },  // Standing, its arms hang and its feet come together.
      react: {
        seconds: 1.4, rise: 1.2,
        motion: () => A.track({ squash: [[0, 0], [0.6, -0.02], [1.4, 0]] }),
      },
      // Sighs once in 8 s: breathes in, then sinks, its arms rising and falling with it when it stands.
      hold: () => A.track({
        squash: [[0, 0], [3, 0], [3.6, 0.025], [4.6, -0.02], [5.6, 0], [8, 0]],
        armL: [[0, 0], [3, 0], [3.6, 4], [4.6, -3], [5.6, 0], [8, 0]],
        armR: [[0, 0], [3, 0], [3.6, 4], [4.6, -3], [5.6, 0], [8, 0]],
        headY: [[0, 0], [3, 0], [3.6, -1], [4.6, 1.5], [5.6, 0], [8, 0]],
        earL: [[0, 0], [3.6, -3], [4.8, 3], [6, 0], [8, 0]],
        earR: [[0, 0], [3.6, -3], [4.8, 3], [6, 0], [8, 0]],
        lid: [[0, 0], [3.6, -0.1], [4.8, 0.08], [6, 0], [8, 0]],
      }, { duration: HOLD_SECONDS, loop: true }),
      mark: { text: '…' },
      says: 'looks sad',
    },
    sleepy: {
      valence: 0, arousal: -0.7,
      face: { lid: 0.25, tail: -3 },
      // A yawn: the head goes up, the eyes shut and the mouth opens wide, then the lids come back heavy.
      react: {
        seconds: 2, rise: 1.8,
        motion: () => A.track({
          eyes: [[0, _], [0.3, 'closed'], [1.35, _]],
          mouth: [[0, _], [0.35, 'open'], [1.3, _]],
          turnY: [[0, 0], [0.4, -0.45], [1.2, -0.4], [1.7, 0]],
          squash: [[0, 0], [0.4, 0.045], [1.2, 0.04], [1.7, 0]],
          earL: [[0, 0], [0.45, 12], [1.2, 12], [1.8, 0]],
          earR: [[0, 0], [0.45, 12], [1.2, 12], [1.8, 0]],
          tail: [[0, 0], [0.5, 6], [1.3, 6], [2, 0]],
          // Standing, it stretches its arms up and out as it yawns.
          armL: [[0, 0], [0.45, 95], [1.2, 100], [1.8, 0]], armR: [[0, 0], [0.45, 95], [1.2, 100], [1.8, 0]],
          elbowL: [[0, 0], [0.45, 10], [1.8, 0]], elbowR: [[0, 0], [0.45, 10], [1.8, 0]],
          crouch: [[0, 0], [0.45, -3], [1.2, -3], [1.8, 0]],
        }),
      },
      // Nods off and starts awake again, once in 8 s.
      hold: () => A.track({
        lid: [[0, 0], [1.1, 0.05], [1.5, 0.45, 'in'], [2.1, 0.1, 'out'], [2.9, 0.3], [3.3, 0.75], [5.9, 0.75], [6.0, -0.3, 'out'], [6.8, -0.1], [8, 0]],
        eyes: [[0, _], [3.3, 'closed'], [5.9, _]],
        turnY: [[0, 0], [3.2, 0.3], [5.8, 0.6], [6.05, -0.25, 'out'], [6.6, -0.1], [8, 0]],
        lookY: [[0, 0], [3.2, 0.1], [5.9, 0.1], [6.05, -0.3, 'out'], [6.6, -0.2], [8, 0]],
        tilt: [[0, 0], [3.2, 4], [5.8, 9], [6.1, -4, 'out'], [7, -1], [8, 0]],
        y: [[0, 0], [5.8, 2], [6.05, -3, 'out'], [6.5, -1], [8, 0]],
        headY: [[0, 0], [3.2, 1.5], [5.8, 4], [6.05, -3, 'out'], [6.6, -1], [8, 0]],
        earL: [[0, 0], [5.8, 8], [6.05, -16, 'out'], [6.6, -8], [8, 0]],
        earR: [[0, 0], [5.8, 8], [6.1, -14, 'out'], [6.7, -7], [8, 0]],
        hair: [[0, 0], [5.8, 2], [6.05, -3, 'out'], [6.5, 1], [7.2, 0]],
        tail: [[0, 0], [5.8, -4], [6.05, 10, 'out'], [6.6, 4], [8, 0]],  // Curls in, and flicks on waking.
        // Standing, its knees sag and its arms hang, and it starts upright with its arms out.
        crouch: [[0, 0], [3.2, 1], [5.8, 3], [6.05, -1, 'out'], [6.6, 0], [8, 0]],
        armL: [[0, 0], [5.8, -4], [6.05, 12, 'out'], [6.8, 0], [8, 0]],
        armR: [[0, 0], [5.8, -4], [6.1, 11, 'out'], [6.9, 0], [8, 0]],
      }, { duration: HOLD_SECONDS, loop: true }),
      inward: true,
      says: 'grows sleepy',
    },
    asleep: {
      valence: 0.1, arousal: -1,
      face: { eyes: 'closed', lid: 0.6, turnY: 0.2, headY: 2, tilt: 7, tail: -4 },
      // Nods off: the lids come down, the head drops and tips.
      react: {
        seconds: 1.6, rise: 1.3,
        motion: () => A.track({
          eyes: [[0, 'open'], [0.9, _]],
          lid: [[0, 0], [0.9, 0.4, 'in'], [1.6, 0]],
          headY: [[0, 0], [1.1, 1.5, 'out'], [1.6, 0]],
        }),
      },
      // Breathes slowly and deeply; an ear twitches as it dreams.
      hold: () => A.clip(t => {
        const twitch = A.flickShape(clamp((t - 2.6) / 0.5, 0, 1)) * (t > 2.6 && t < 3.1 ? 1 : 0);
        return {
          squash: 0.022 * wave(t, 4), headY: 1.2 * wave(t, 4, -0.6), tilt: 1 * wave(t, 4, -0.3),
          earL: 2 * wave(t, 4, -0.8) + 10 * twitch, earR: 2 * wave(t, 4, -1),
          lean: 1.5 * wave(t, 4, -0.4),  // Standing, it sways a little as it sleeps.
        };
      }, 4, true),
      mark: { text: 'z', every: 2 },
      inward: true,
      says: 'falls asleep',
    },
  };

  const NAMES = Object.freeze(Object.keys(FEELINGS));

  function feeling(name) {
    const f = FEELINGS[name];
    if (!f) throw new Error(`phy_friends/emotion: "${name}" is not a feeling; use one of ${NAMES.join(', ')}`);
    return f;
  }

  // Scales the numbers of a partial pose by k and keeps its strings (blush, which multiplies, scales
  // its difference from 1).
  function scaled(partial, k) {
    return A.combine({}, partial, k);
  }

  // ------------------------------------------------------------ Forms

  // Every form takes options: strength (numbers scale by it; the eye and mouth shapes show from half
  // strength up) and spec (the friend it is for; a friend that shows no feelings gets the movement of
  // a reaction alone).
  const showsFeelings = spec => spec === undefined || fits(spec);

  // The feeling held still: its posture, its face and, for a friend standing, its gesture.
  function face(name, { strength = 1, spec } = {}) {
    const f = feeling(name);
    if (!showsFeelings(spec)) return {};
    const still = A.combine(A.combine(posture(f.valence, f.arousal), f.face), f.stand || {});
    return strength === 1 ? still : scaled(still, strength);
  }

  // The reaction as the feeling comes on: the face rises over react.rise seconds while the reaction's
  // movement plays, and the clip ends in the feeling's face.
  function react(name, { strength = 1, spec } = {}) {
    const f = feeling(name), { seconds, rise, motion } = f.react, still = face(name, { strength, spec });
    const move = motion ? A.weight(motion(), strength) : A.rest(seconds);
    if (!showsFeelings(spec)) return A.clip(t => numbersOnly(move(t)), seconds);
    const risen = t => A.ease.smooth(clamp(t / rise, 0, 1));
    return A.clip(t => A.combine(A.combine({}, still, risen(t)), move(Math.min(t, seconds))), seconds);
  }

  // The feeling held: its face, with the movement that goes with it, looping.
  function hold(name, { strength = 1, spec } = {}) {
    const f = feeling(name), move = A.weight(f.hold(), strength);
    if (!showsFeelings(spec)) return A.clip(() => ({}), move.duration, true);
    const still = face(name, { strength });
    return A.clip(t => A.combine(A.combine({}, still), move(t)), move.duration, true);
  }

  // The reaction, then the feeling held, for ever (until a scene or a page ends it). The held
  // movement eases in over HOLD_EASE seconds, so that it takes over from the reaction without a jump.
  function feel(name, options = {}) {
    const first = react(name, options), still = face(name, options), held = hold(name, options);
    const move = showsFeelings(options.spec) ? A.weight(feeling(name).hold(), options.strength ?? 1) : held;
    return A.clip(t => {
      if (t < first.duration) return first(t);
      const u = t - first.duration;
      return A.combine(A.combine({}, still), move(u), A.ease.smooth(Math.min(1, u / HOLD_EASE)));
    });
  }

  // The numbers of a partial pose alone: movement without the eye and mouth shapes.
  function numbersOnly(partial) {
    const out = {};
    for (const key in partial) if (typeof partial[key] === 'number') out[key] = partial[key];
    return out;
  }

  // A friend's hi, the same on every page: the hop for joy (react('happy')). A friend that shows no
  // feelings makes the same hop with a smile.
  function greeting(specOrName) {
    const hop = react('happy', { spec: specOrName });
    if (showsFeelings(specOrName)) return hop;
    const shapes = smile(specOrName);
    return A.clip(t => ({ ...hop(t), ...shapes }), hop.duration);
  }

  // The smile with which a friend answers a greeting, as a still partial pose: the happy face without
  // its movement. A friend that shows no feelings smiles with the happy face's eyes and mouth alone,
  // without the blush or the posture that would make it a feeling.
  function smile(specOrName) {
    if (showsFeelings(specOrName)) return A.faceOnly(face('happy'));
    const { eyes, mouth } = FEELINGS.happy.face;
    return { eyes, mouth };
  }

  // The mark a feeling shows ({ text, every }: every is how often a mark that repeats reappears, in
  // seconds), or null.
  function mark(name) {
    const m = feeling(name).mark;
    return m ? { every: null, ...m } : null;
  }

  // One flat sentence for a screen reader: "Howdi looks surprised."
  function describe(name, who) {
    return `${who} ${feeling(name).says}.`;
  }
  // What a screen reader hears of a friend's greeting (greeting()).
  function describeGreeting(who) {
    return `${who} ${FEELINGS.happy.greets}.`;
  }
  // Whether a feeling turns a friend inward, so that it stops following what goes on.
  function inward(name) {
    return !!feeling(name).inward;
  }

  // Whether the library can show a friend's feelings: every friend drawn on the house template can;
  // a spec that sets `emotions: false`, as Claude's does, cannot.
  function fits(specOrName) {
    return PF.get(specOrName).emotions !== false;
  }

  // Where a feeling sits on the two axes, for a page that arranges or blends them.
  function place(name) {
    const f = feeling(name);
    return { valence: f.valence, arousal: f.arousal };
  }

  // ------------------------------------------------------------ Marks

  // A mark pops up to its size, easing past it, and fades out at its end; one that repeats (the z of
  // sleep) drifts up as it goes. Sizes and places belong to the page or scene that shows it.
  const MARK = Object.freeze({ seconds: 1.4, pop: 0.18, appear: 0.06, fade: 0.25, drift: 40 });

  // How a mark looks `age` seconds after it appeared, with `left` seconds to go: its opacity, its scale
  // and how far it has risen (drift, in the units of MARK.drift per second, for a repeating mark).
  // Under reduced motion it neither pops nor drifts.
  function markAt(age, left, { reduced = false, drifting = false } = {}) {
    const pop = reduced ? 1 : A.ease.back(clamp(age / MARK.pop, 0, 1));
    return {
      opacity: Math.min(clamp(left / MARK.fade, 0, 1), clamp(age / MARK.appear, 0, 1)),
      scale: 0.6 + 0.4 * pop,
      rise: drifting && !reduced ? MARK.drift * age : 0,
    };
  }

  // The marks that are drawn rather than written (src/cast.js MARKS has both), each a pencil line as thick as the
  // hand's bold stem, never filled, in a box an em tall: 100 units, with the hand's baseline at 81 and its capitals'
  // tops at 9, so that a drawn mark stands as a written one does. The ♪ is drawn too, since the hand has no such
  // letter and a page would set it in some other face.
  const MARK_STROKE = 12.8;  // The stem of the bold hand, in hundredths of an em.
  function spiral(cx, cy, r, turns) {
    const steps = Math.round(turns * 24);
    return 'M' + Array.from({ length: steps + 1 }, (_, i) => {
      const u = i / steps, a = u * turns * TAU, reach = 3 + (r - 3) * u;
      return `${(cx + reach * Math.cos(a)).toFixed(1)} ${(cy + reach * Math.sin(a)).toFixed(1)}`;
    }).join('L');
  }
  const DRAWN_MARKS = Object.freeze({
    heart: { width: 86, d: 'M43 76C30 64 9 51 10 34C11 21 19 14 28 14C36 14 41 19 43 28C45 19 51 13 59 14C68 15 76 22 76 34C75 50 56 64 43 76Z' },
    sweat: { width: 60, d: 'M34 14C29 30 14 42 14 57C14 69 22 77 32 77C42 77 50 69 50 58C50 44 38 32 34 14Z' },
    spark: { width: 92, d: 'M38 10Q42 42 74 46Q42 50 38 80Q34 50 4 46Q34 42 38 10ZM80 16h0.1' },  // A twinkle, and a dot.
    bulb: { width: 76, d: 'M28 64C21 59 17 53 18 45C19 34 27 28 38 28C49 28 57 34 58 45C59 53 55 59 48 64ZM31 78H45M38 6V12M12 16L17 20M64 16L59 20' },
    swirl: { width: 84, d: spiral(42, 46, 34, 1.6) },
    '♪': { width: 66, d: 'M13 70C13 63 21 59 27 61C33 63 33 70 27 74C21 77 13 76 13 70ZM30 66V14C36 27 56 28 53 48' },
  });

  // A mark as markup, for an element whose font size is the mark's size and whose color is its ink: a written mark
  // is its text, and a drawn one an inline SVG an em tall.
  function markMarkup(text) {
    const drawn = DRAWN_MARKS[text];
    if (!drawn) return text.replace(/[&<>]/g, c => `&#${c.charCodeAt(0)};`);
    return `<svg viewBox="0 0 ${drawn.width} 100" width="${drawn.width / 100}em" height="1em" style="display:block;overflow:visible"` +
      ` fill="none" stroke="currentColor" stroke-width="${MARK_STROKE}" stroke-linecap="round" stroke-linejoin="round"><path d="${drawn.d}"/></svg>`;
  }

  const api = {
    names: NAMES, posture, face, react, hold, feel, greeting, smile, mark, describe, describeGreeting, inward, fits, place,
    markAt, markMarkup, drawnMarks: Object.freeze(Object.keys(DRAWN_MARKS)), MARK,
  };
  A.extend({ face, react, hold, feel });
  PF.emotion = api;
  return api;
});
