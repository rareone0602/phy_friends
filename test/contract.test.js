// Tests of the house contract: what every friend but Claude promises the code that animates it. The pages, the films,
// the clips and the feelings (src/anim.js, src/emotion.js, src/live.js, film/scene.js) know only these promises and
// never a particular friend, so each promise is checked on every friend of the house rather than on a few, and a new
// friend is held to all of them the moment it is registered.
(function () {
  'use strict';

  const PF = PhyFriends, A = PF.anim, E = PF.emotion, { houseFriends, withBoxSync } = support;
  const STANCES = [A.still({ stance: 'sit' }), A.still({ stance: 'stand' })];
  // Every movement and every feeling, as the friend given would play it.
  const movements = name => [
    ...Object.keys(A.clips).map(clip => [clip, A.make[clip] ? A.make[clip]({ spec: name }) : A.clips[clip]]),
    ...E.names.flatMap(feeling => [[`react('${feeling}')`, E.react(feeling, { spec: name })], [`hold('${feeling}')`, E.hold(feeling, { spec: name })]]),
  ];
  const timesOf = clip => [0, 0.15, 0.4, 0.75, 1.3, 2.1].filter(t => !clip.duration || t <= clip.duration).concat(clip.duration || []);
  const BROKEN = /NaN|Infinity|undefined/;
  // How far below or above the ground a friend's lowest point may lie, in head units: about two pixels of the canvas
  // that measures it, which is as finely as it can tell.
  const ON_GROUND = 4;
  // The least share of a limb that shows against what lies behind it.
  const SHOWN = 0.4;
  // The friends with an ear drawn as the flap that hangs from its fold, as cowosus's folded ear is: such a flap turns
  // about the fold, above it, so that a positive ear rotation swings it in against the head. Every other ear turns
  // about its root, below it. An ear that hangs from a pivot above it is added here only on purpose, since a lobe hung
  // that way by mistake turns the same way (Terry's did, until his ears were set on their roots).
  const EARS_HUNG_FROM_A_FOLD = ['cowosus'];

  test('every friend of the house has the parts that a pose moves, under the same names', () => {
    withBoxSync(box => {
      for (const name of houseFriends()) {
        const rig = PF.mount(box, name, { bitmap: false, view: 'stand' });
        const missing = PF.ANATOMY.parts.filter(part => !rig.parts[part]);
        assertEqual(missing, [], `${name} lacks`);
      }
    });
  });

  test('every friend of the house can stand and show its feelings', () => {
    for (const name of houseFriends()) {
      assert(PF.standFor(name) && PF.standLift(name) > 0, `${name} stands`);
      assert(E.fits(name), `${name} shows its feelings`);
    }
  });

  test('every movement and every feeling poses every friend in finite numbers, sitting and standing', () => {
    for (const name of houseFriends()) {
      const spec = PF.get(name);
      for (const [label, clip] of movements(name)) {
        for (const stance of STANCES) {
          for (const t of timesOf(clip)) {
            const state = JSON.stringify(PF.poseState(spec, A.sample(A.layer(stance, clip), t)), (key, value) => (value instanceof Set ? [...value] : value));
            assert(!BROKEN.test(state), `${name} at ${t} s of ${label}: ${(state.match(BROKEN) || [])[0]}`);
          }
        }
      }
    }
  });

  test('every friend of the house draws every feeling, standing, in finite numbers', () => {
    for (const name of houseFriends()) {
      for (const feeling of E.names) {
        const svg = PF.render(name, { view: 'stand', pose: A.sample(A.layer(STANCES[1], E.feel(feeling, { spec: name })), 1.2), bg: false });
        assert(!BROKEN.test(svg), `${name} feeling ${feeling}`);
      }
    }
  });

  // What a drawing shows of its parts, for comparing a mounted rig with a fresh render: each part's transform,
  // display and opacity, and the part it lies in; the parts of each slot that a pose restacks, in order; whether the
  // arms take the tuck's mask; each outline; and each toggle.
  function drawingOf(root) {
    const parts = [...root.querySelectorAll('[data-pf]')], within = n => n.parentNode.closest('[data-pf]');
    const named = n => (n ? n.getAttribute('data-pf') : null);
    const slot = name => [...root.querySelectorAll(`[data-pf="${name}"] > [data-pf]`)].map(named);
    const tuck = root.querySelector('[data-pf="tuck"]');
    return {
      looks: parts.map(n => [named(n), n.getAttribute('transform'), n.getAttribute('display'), n.getAttribute('opacity'), named(within(n))].join(':')).sort(),
      slots: ['armsUnder', 'pawsUnder', 'armsOver'].map(slot),
      tucked: tuck ? tuck.hasAttribute('mask') : null,
      outlines: [...root.querySelectorAll('[data-pf-d]')].map(n => `${n.getAttribute('data-pf-d')}:${n.getAttribute('d')}`),
      toggles: [...root.querySelectorAll('[data-pf-when], [data-pf-show]')].map(n => n.getAttribute('display')),
    };
  }

  test('a mounted rig draws every pose of every friend as a fresh render of that pose draws it', () => {
    const poses = [
      { stance: 'sit', rise: 0.4, armR: 60, eyes: 'happy', mouth: 'open' },
      { stance: 'stand', armL: 120, elbowL: 30, crouch: 5, lean: 6, stepR: 4, over: 'armL', lid: 0.3, tail: 20 },
      { stance: 'stand', armR: 150, elbowR: -30, legL: 15, turnX: 0.6, lookY: -1, earL: 12, blink: 0.5 },
      { stance: 'stand', over: 'armR armL', armL: 90, eyes: 'closed', mouth: 'o', show: 'laptop' },
    ];
    withBoxSync(box => {
      for (const name of houseFriends()) {
        // Mounted in the last pose, so that the first one changes what the mount drew, toggles and all.
        const rig = PF.mount(box, name, { bitmap: false, pose: poses[poses.length - 1] });
        for (const pose of poses) {
          rig.setPose(pose, true);
          const fresh = document.createElement('div');
          fresh.innerHTML = PF.render(name, { pose });
          assertEqual(drawingOf(rig.svg), drawingOf(fresh), `${name} in ${JSON.stringify(pose)}`);
        }
      }
    });
  });

  test('every friend of the house sits and stands on its ground', async () => {
    for (const name of houseFriends()) {
      for (const stance of ['sit', 'stand']) {
        const below = await raster.lowest(name, { stance });
        assert(Math.abs(below) <= ON_GROUND, `${name} ${stance}s with its lowest point ${below.toFixed(1)} units below the ground`);
      }
    }
  });

  test('every friend of the house sits and stands on its ground with a taller or a shorter body', async () => {
    const height = PF.BODY.height;
    try {
      for (const k of [0.8, 1.3]) {
        PF.BODY.height = k;
        for (const name of houseFriends()) {
          // A fresh copy of the spec, since the core works a friend's figure out once per spec. The view keeps the
          // ground in the frame, however far it drops.
          const spec = { ...PF.get(name) }, view = { w: 400, h: 400, x: 200, y: 340 - PF.groundOf(spec), scale: 1, rotate: 0 };
          for (const stance of ['sit', 'stand']) {
            const below = await raster.lowest(spec, { stance }, { view });
            assert(Math.abs(below) <= ON_GROUND, `${name} ${stance}s on a body ${k} times as tall with its lowest point ${below.toFixed(1)} units below the ground`);
          }
        }
      }
    } finally {
      PF.BODY.height = height;
    }
  });

  test('every friend of the house keeps a foot on the ground as it walks', async () => {
    for (const name of houseFriends()) {
      for (const u of [0.1, 0.3, 0.55, 0.8]) {
        const pose = A.sample({ ...A.walking(u, 4).pose, stance: 'stand' });
        const below = await raster.lowest(name, pose);
        assert(Math.abs(below) <= ON_GROUND, `${name} at ${u} of a walk has its lowest point ${below.toFixed(1)} units below the ground`);
      }
    }
  });

  test('every limb of every friend of the house shows against what lies behind it, sitting and standing', async () => {
    for (const name of houseFriends()) {
      for (const stance of ['sit', 'stand']) {
        for (const S of ['L', 'R']) {
          for (const limb of [[`arm${S}`, `paw${S}`], [`leg${S}`, `foot${S}`]]) {
            const { share } = await raster.visibility(name, limb, { stance });
            assert(share >= SHOWN, `${name} ${stance}ing: ${Math.round(share * 100)}% of ${limb.join(' and ')} shows`);
          }
        }
      }
    }
  });

  test('a paw raised in front of the face shows against it, even where it is the color of the face, in its house shade', async () => {
    const pose = A.sample({ stance: 'stand', armL: 150, elbowL: -30, armR: 150, elbowR: -30, over: 'armL armR' });  // As scared holds them.
    const lost = [];
    for (const name of houseFriends()) {
      const shares = await Promise.all(['L', 'R'].map(S => raster.visibility(name, [`arm${S}`, `paw${S}`], pose, { against: 'head' })));
      if (shares.some(({ area, share }) => area > 0 && share < SHOWN)) lost.push(name);
    }
    assertEqual(lost.sort(), [], 'the friends whose raised paws are lost against the face');
  });

  test('every friend of the house waves and points with the arm away from its tail', () => {
    withBoxSync(box => {
      for (const name of houseFriends()) {
        const rig = PF.mount(box, name, { bitmap: false, view: 'stand' });
        for (const move of ['wave', 'point']) {
          const pose = A.sample(A.layer(STANCES[1], A.make[move]({ spec: name })), 0.6);
          rig.setPose(pose, true);
          const S = pose.armL > pose.armR ? 'L' : 'R';
          const middle = part => { const r = rig.parts[part].getBoundingClientRect(); return r.left + r.width / 2; };
          const body = middle('body'), paw = middle(`paw${S}`) - body, tail = middle('tail') - body;
          assert(Math.sign(paw) !== Math.sign(tail), `${name} ${move}s with arm${S}, on its tail's side`);
        }
      }
    });
  });

  test('every friend of the house turns its ears out on a positive rotation, about their roots, but for a flap hung from its fold', () => {
    const turnedIn = [];
    withBoxSync(box => {
      for (const name of houseFriends()) {
        const rig = PF.mount(box, name, { bitmap: false });
        const middle = (part, deg) => {
          rig.setPose({ earL: deg, earR: deg }, true);
          const r = rig.parts[part].getBoundingClientRect();
          return r.left + r.width / 2;
        };
        const out = S => (S === 'L' ? -1 : 1) * (middle(`ear${S}`, 10) - middle(`ear${S}`, 0));
        if (['L', 'R'].some(S => out(S) <= 0)) turnedIn.push(name);
      }
    }, 400);
    assertEqual(turnedIn, EARS_HUNG_FROM_A_FOLD, 'the friends with an ear that a positive rotation turns in, which should be the flaps hung from their folds');
  });
})();
