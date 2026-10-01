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
 * (stand), such as paws on the hips or a paw under the chin. A friend takes less of these fields the lower
 * it is, and seated it ignores them, so it shows every feeling as before.
 *
 * A feeling may have a mark, one of the marks in src/cast.js ('!' for surprise, 'z' for sleep),
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
  // ({ text, every } for a mark that repeats while the feeling lasts), if any; and what a screen reader
  // hears (says). The arms are drawn in front of the scarf and the head, but for the shoulder, which tucks under
  // them; a gesture may draw an arm whole in front, shoulder too (over).
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
      says: 'looks content',
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
      says: 'goes shy',
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
      says: 'falls asleep',
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

  const api = { names: NAMES, posture, face, react, hold, feel, greeting, smile, mark, describe, fits, place, markAt, MARK };
  A.extend({ face, react, hold, feel });
  PF.emotion = api;
  return api;
});
