// Tests of the house contract: what every friend but Claude promises the code that animates it. The pages, the films,
// the clips and the feelings (lib/fwiends/src/anim.js, lib/fwiends/src/emotion.js, lib/fwiends/src/live.js, lib/fwiends/film/scene.js) know only these promises and
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
  // The quarter turns besides facing the viewer (PF.TURN): side-on to the right, away, and side-on to the left.
  const TURNED = [90, 180, 270];

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
  // arms take the tuck's mask; each outline; each toggle; and what each link points at.
  function drawingOf(root) {
    const parts = [...root.querySelectorAll('[data-pf]')], within = n => n.parentNode.closest('[data-pf]');
    const named = n => (n ? n.getAttribute('data-pf') : null);
    const slot = name => [...root.querySelectorAll(`[data-pf="${name}"] > [data-pf]`)].map(named);
    const tuck = root.querySelector('[data-pf="tuck"]');
    return {
      looks: parts.map(n => [named(n), n.getAttribute('transform'), n.getAttribute('display'), n.getAttribute('opacity'), named(within(n))].join(':')).sort(),
      slots: ['armsBehind', 'armsBeside', 'armsUnder', 'pawsUnder', 'armsOver'].map(slot),
      tucked: tuck ? tuck.hasAttribute('mask') : null,
      outlines: [...root.querySelectorAll('[data-pf-d]')].map(n => `${n.getAttribute('data-pf-d')}:${n.getAttribute('d')}`),
      toggles: [...root.querySelectorAll('[data-pf-when], [data-pf-show]')].map(n => n.getAttribute('display')),
      links: [...root.querySelectorAll('[data-pf-link]')].map(n => (n.getAttribute('href') || '').replace(/^#.*?-/, '#')),  // Without the drawing's uid.
    };
  }

  test('a mounted rig draws every pose of every friend as a fresh render of that pose draws it', () => {
    const poses = [
      { stance: 'sit', rise: 0.4, armR: 60, eyes: 'happy', mouth: 'open' },
      { stance: 'stand', armL: 120, elbowL: 30, crouch: 5, lean: 6, stepR: 4, over: 'armL', lid: 0.3, tail: 20 },
      { stance: 'stand', armR: 150, elbowR: -30, legL: 15, turnX: 0.6, lookY: -1, earL: 12, blink: 0.5 },
      { stance: 'stand', over: 'armR armL', armL: 90, eyes: 'closed', mouth: 'o', show: 'laptop' },
      { stance: 'stand', facing: 90, armR: 120, legL: 10, eyes: 'happy' },
      { stance: 'stand', facing: 90, over: 'armR', armR: 150, elbowR: -30, mouth: 'open' },
      { stance: 'sit', facing: 180, tail: 20, rise: 0.3 },
      { stance: 'stand', facing: 270, armL: 60, lookX: 0.5, blink: 0.4 },
      { stance: 'sit', facing: 0, earL: 10 },
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

  // The most attributes that posing a friend through a second of its idle, at the 15 frames a second at which the
  // pages play it, may write, seated and standing: a browser restyles, and may repaint, for every write, and the
  // gallery idles a score of friends at once. In November 2026 the friends wrote 195 to 246 seated, as the gallery has
  // them, and 335 to 568 standing, once a pose wrote nothing to an arm's edge, a tuck or an arms' slot that it does not
  // draw (poseState).
  const IDLE_WRITES = { sit: 250, stand: 580 };

  test('posing any friend through a second of its idle writes no more attributes than IDLE_WRITES allows', () => {
    const over = [];
    withBoxSync(box => {
      for (const name of PF.list()) {
        for (const stance of ['sit', 'stand']) {
          const rig = PF.mount(box, name, { bitmap: false, pose: { stance } }), idle = A.idleOf(name);
          const at = t => { const pose = { stance }; A.addIdle(pose, idle, t); return A.sample(pose); };
          rig.setPose(at(0), true);
          const observer = new MutationObserver(() => {});
          observer.observe(rig.svg, { attributes: true, subtree: true });
          for (let i = 1; i <= 15; i++) rig.setPose(at(i / 15), true);
          const writes = observer.takeRecords().length;
          observer.disconnect();
          if (writes > IDLE_WRITES[stance]) over.push(`${name} ${stance === 'sit' ? 'seated' : 'standing'}: ${writes}`);
        }
      }
    });
    assertEqual(over, [], 'the friends whose idle writes more than IDLE_WRITES allows');
  });

  test('every friend of the house turns to each quarter, sitting and standing, in finite numbers, and keeps its parts', () => {
    withBoxSync(box => {
      for (const name of houseFriends()) {
        const rig = PF.mount(box, name, { bitmap: false, view: 'stand' });
        for (const facing of TURNED) {
          for (const stance of ['sit', 'stand']) {
            const svg = PF.render(name, { view: 'stand', pose: { stance, facing }, bg: false });
            assert(!BROKEN.test(svg), `${name} ${stance}ing, facing ${facing}: ${(svg.match(BROKEN) || [])[0]}`);
          }
          rig.setPose({ facing }, true);
          assertEqual(PF.ANATOMY.parts.filter(part => !rig.parts[part]), [], `${name} facing ${facing} lacks`);
        }
      }
    });
  });

  test('every friend of the house, side-on, has its face ahead of the middle of its head with its near eye alone, and from behind, none', () => {
    withBoxSync(box => {
      for (const name of houseFriends()) {
        const rig = PF.mount(box, name, { bitmap: false, view: 'stand' });
        const middle = part => { const r = rig.parts[part].getBoundingClientRect(); return r.left + r.width / 2; };
        const shapes = part => rig.parts[part].querySelectorAll('path, ellipse, rect, circle').length;
        for (const [facing, way, near, far] of [[90, 1, 'eyeL', 'eyeR'], [270, -1, 'eyeR', 'eyeL']]) {
          rig.setPose({ facing, mouth: 'o' }, true);  // A mouth that shows, since a friend's own may be none.
          for (const part of [near, 'mouth']) assert(way * (middle(part) - middle('base')) > 0, `${name} facing ${facing}: its ${part} is ahead`);
          assertEqual(shapes(far), 0, `the shapes ${name} draws of its far eye facing ${facing}`);
        }
        rig.setPose({ facing: 180 }, true);
        for (const part of ['face', 'eyes', 'mouth']) assertEqual(shapes(part), 0, `the shapes ${name} draws of its ${part} from behind`);
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

  test('every friend of the house sits and stands on its ground in every quarter turn', async () => {
    for (const name of houseFriends()) {
      for (const facing of TURNED) {
        for (const stance of ['sit', 'stand']) {
          const below = await raster.lowest(name, { stance, facing });
          assert(Math.abs(below) <= ON_GROUND, `${name} ${stance}s facing ${facing} with its lowest point ${below.toFixed(1)} units below the ground`);
        }
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

  test('every friend of the house keeps a foot on the ground as it walks, facing the viewer or side-on', async () => {
    for (const name of houseFriends()) {
      for (const facing of [0, 90]) {
        for (const u of [0.1, 0.3, 0.55, 0.8]) {
          const pose = A.sample({ ...A.walking(u, 4, { distance: 48, facing, gait: A.gaitOf(name) }).pose, stance: 'stand', facing });
          const below = await raster.lowest(name, pose);
          assert(Math.abs(below) <= ON_GROUND, `${name} at ${u} of a walk facing ${facing} has its lowest point ${below.toFixed(1)} units below the ground`);
        }
      }
    }
  });

  // Where a pose puts a friend's feet, in head units of its cut-out: the point each foot is drawn about (its
  // translation), carried by the root's transform, which translates and scales (PhyFriends.poseState).
  function feetOf(spec, pose) {
    const st = PF.poseState(spec, pose), at = {};
    assert(!/rotate|matrix/.test(st.transform.root), `a walk's root only translates and scales: ${st.transform.root}`);
    const ops = [...st.transform.root.matchAll(/(translate|scale)\(([^)]*)\)/g)].map(m => [m[1], m[2].trim().split(/[\s,]+/).map(Number)]).reverse();
    for (const side of ['L', 'R']) {
      let [, x, y] = /translate\(([-\d.e]+) ([-\d.e]+)\)/.exec(st.transform[`foot${side}`]).map(Number);
      for (const [op, [a, b = op === 'scale' ? a : 0]] of ops) [x, y] = op === 'translate' ? [x + a, y + b] : [x * a, y * b];
      at[side] = [x, y];
    }
    return at;
  }

  test('every friend of the house keeps a planted foot where it was put as it walks, facing the viewer and side-on', () => {
    const SLIDE = 0.5;  // How far, in head units, a planted foot may move from one sample to the next.
    for (const name of houseFriends()) {
      const spec = PF.get(name), gait = A.gaitOf(spec);
      for (const facing of [0, 90, 270]) {
        for (const distance of [240, -150]) {
          const steps = A.walkSteps(distance, 2.5, { gait, facing });
          assert(steps > 0, `${name} walks ${distance} units in 2.5 s facing ${facing}`);
          let last = null;
          for (let i = 0; i <= 240; i++) {
            const walk = A.walking(i / 240, steps, { distance, gait, facing });
            const feet = feetOf(spec, A.sample({ ...walk.pose, x: walk.along * distance, stance: 'stand', facing }));
            for (const side of ['L', 'R']) {
              if (!last || !walk.planted[side] || !last.planted[side]) continue;
              const moved = Math.hypot(feet[side][0] - last.feet[side][0], feet[side][1] - last.feet[side][1]);
              assert(moved < SLIDE, `${name} facing ${facing} going ${distance}: planted foot ${side} moves ${moved.toFixed(2)} at ${(i / 240).toFixed(3)}`);
            }
            last = { feet, planted: walk.planted };
          }
        }
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

  // The key poses of every gesture that the library offers, standing, each with the paws it raises: each movement at the
  // first moment that it holds an arm at its highest, and each feeling's standing gesture, held. A paw counts as
  // raised once it has moved a paw's breadth from where it hangs; one moved less hangs still, as the test of every
  // limb above checks it.
  function keyPoses(name) {
    const still = STANCES[1], spec = PF.get(name), out = [], MOVED = 20, STEPS = 30;
    const at = (pose, S) => PF.poseState(spec, pose).transform[`paw${S}`].match(/translate\(([-\d.]+) ([-\d.]+)\)/).slice(1).map(Number);
    const rest = ['L', 'R'].map(S => at(A.sample(still), S));
    const raised = pose => ['L', 'R'].filter((S, i) => Math.hypot(...at(pose, S).map((v, k) => v - rest[i][k])) >= MOVED);
    for (const move of ['wave', 'cheer', 'jump', 'stretch', 'point', 'beckon']) {
      const clip = A.layer(still, A.make[move]({ spec: name }));
      const poses = Array.from({ length: STEPS + 1 }, (_, i) => A.sample(clip, clip.duration * i / STEPS));
      const keys = new Set(['L', 'R'].map(S => {
        const top = Math.max(...poses.map(p => p[`arm${S}`]));
        return poses.findIndex(p => p[`arm${S}`] >= top - 1e-6);
      }));
      for (const i of keys) out.push([`${move} at ${(clip.duration * i / STEPS).toFixed(2)} s`, poses[i], raised(poses[i])]);
    }
    for (const feeling of E.names) out.push([`${feeling}, held`, A.sample(A.layer(still, E.hold(feeling, { spec: name })), 1.5)]);
    return out.map(([label, pose, paws]) => [label, pose, paws || raised(pose)]).filter(([, , paws]) => paws.length);
  }
  // The least share of a gesturing paw's outline that shows against what lies round it (raster.outline): the paper, the
  // head, the body or the tail. Where it borders on the arms and paws, its own and the other, it does not count, since
  // those in front are cut out as one piece, with one edge round them (drawLimbs).
  const OUTLINED = 0.5;

  test('at the key pose of every gesture, every paw it moves shows its outline, against the head and the body too', async () => {
    const lost = [];
    for (const name of houseFriends()) {
      for (const [label, pose, paws] of keyPoses(name)) {
        const limbs = ['L', 'R'].flatMap(S => [`arm${S}`, `paw${S}`]), apart = paws.map(S => limbs.filter(n => n !== `paw${S}`));
        const shares = await raster.outline(name, paws.map(S => `paw${S}`), pose, { apart });
        paws.forEach((S, i) => {
          if (shares[i].share < OUTLINED) lost.push(`${name} ${label}: ${Math.round(shares[i].share * 100)}% of paw${S}`);
        });
      }
    }
    assertEqual(lost, [], 'the paws whose outlines are lost at a key pose');
  });

  test('at the key pose of every gesture, the paper edge lies round the arms and paws in front, never inside them', async () => {
    const inside = [];
    let edged = 0;
    for (const name of houseFriends()) {
      const spec = PF.get(name);
      for (const [label, pose] of keyPoses(name)) {
        const { state } = PF.poseState(spec, pose);
        if (state.edgeL === 'off' && state.edgeR === 'off') continue;
        edged++;
        const front = ['L', 'R'].filter(S => !state.behind.has(`arm${S}`) && !state.beside.has(`arm${S}`)).flatMap(S => [`arm${S}`, `paw${S}`]);
        const { area, seen } = await raster.within(name, front, 'edges', pose);
        if (seen) inside.push(`${name} ${label}: ${seen} of ${area} pixels`);
      }
    }
    assert(edged > houseFriends().length, `the key poses that draw an edge: ${edged}`);
    assertEqual(inside, [], 'the key poses whose paper edge shows inside the arms and paws in front');
  });

  // How far a tail's root may stand off the rest of the figure and still meet it (raster.rootGap), in head units: a
  // pixel and a half of the canvas that measures it.
  const MEETS = 1.5;
  // The points of a rise at which a tail is tested: through the middle, where the seated feet have stepped in and the
  // paws have not come down (PF.RISE.tuck), and near either end.
  const MIDDLE = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9], ENDS = [0.02, 0.05, 0.95, 0.98];

  test('every friend of the house keeps its tail on through a rise: a root that meets the figure at rest meets it all the way', async () => {
    const off = [];
    let tails = 0;
    for (const name of houseFriends()) {
      if (!PF.get(name).tail || !PF.standFor(name)) continue;
      tails++;
      const gap = rise => raster.rootGap(name, 'tail', { stance: 'sit', rise });
      const rests = [await gap(0), await gap(1)], meets = Math.min(...rests) <= MEETS, most = Math.max(...rests) + MEETS;
      for (const rise of MIDDLE) {
        const d = await gap(rise);
        if (d > (meets ? MEETS : most)) off.push(`${name} at ${rise}: ${d.toFixed(1)} off, against ${rests.map(r => r.toFixed(1)).join(' and ')} at rest`);
      }
      for (const rise of ENDS) {
        const d = await gap(rise);
        if (d > most) off.push(`${name} at ${rise}: ${d.toFixed(1)} off, against ${rests.map(r => r.toFixed(1)).join(' and ')} at rest`);
      }
    }
    assert(tails > houseFriends().length / 2, `the friends with a tail that stand: ${tails}`);
    assertEqual(off, [], 'the points of a rise at which a tail stands further off the figure than at rest');
  });

  test('every friend of the house waves, points and beckons with the arm away from its tail', () => {
    withBoxSync(box => {
      for (const name of houseFriends()) {
        const rig = PF.mount(box, name, { bitmap: false, view: 'stand' });
        for (const move of ['wave', 'point', 'beckon']) {
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
