// Tests of lib/fwiends/src/anim.js: a clip is a deterministic function of time, and composition keeps its timing.
(function () {
  'use strict';

  const A = PhyFriends.anim;
  const TIMES = [0, 0.5, 1.25, 3.75, 6.5];  // Exact in binary, so that a time plus a loop's length wraps back to it exactly.
  const timing = clip => ({ duration: clip.duration, loop: clip.loop });

  test('a clip is a deterministic function of time', () => {
    const rebuilt = A.make.idle();  // The same default seed as the library's idle.
    for (const t of TIMES) assertEqual(A.sample(rebuilt, t), A.sample(A.clips.idle, t), `idle at ${t} s`);
  });

  test('a looping clip repeats every duration', () => {
    const idle = A.clips.idle;
    assertEqual(timing(idle), { duration: 8, loop: true });
    for (const t of TIMES) assertEqual(A.sample(idle, t + idle.duration), A.sample(idle, t), `idle at ${t} s and one loop later`);
  });

  test('a one-shot clip holds its end pose after it ends and its first pose before it starts', () => {
    const hop = A.clips.hop;
    assertEqual(A.sample(hop, hop.duration + 5), A.sample(hop, hop.duration));
    assertEqual(A.sample(hop, -1), A.sample(hop, 0));
  });

  test('layer loops over the common period of its looping clips', () => {
    assertEqual(timing(A.layer(A.loop(A.rest(3)), A.loop(A.rest(2)))), { duration: 6, loop: true });
    assertEqual(timing(A.layer(A.clips.idle, A.clips.lookAround)), { duration: 8, loop: true });
    assertEqual(timing(A.layer(A.clips.idle, A.clips.hop)), { duration: 8, loop: false }, 'a one-shot layer stops the loop');
  });

  test('seq plays clips one after another, and a number is a rest', () => {
    const steps = A.seq(A.still({ tilt: 1 }, 1), 0.5, A.still({ tilt: 2 }, 1));
    assertEqual(steps.duration, 2.5);
    assertEqual([0.5, 1.25, 2].map(t => A.sample(steps, t).tilt), [1, 0, 2]);
  });

  test('sample clamps the gaze, the turn and the blink, and keeps the blush positive', () => {
    const pose = A.sample({ lookX: 3, lookY: -3, turnX: 2, turnY: -2, blink: 1.5, blush: -1 });
    assertEqual([pose.lookX, pose.lookY, pose.turnX, pose.turnY, pose.blink, pose.blush], [1, -1, 1, -1, 1, 0]);
  });

  test('frames leaves out the last frame of a loop, which would repeat the first', () => {
    const frames = A.frames(A.clips.lookAround, 10);
    assertEqual(frames.length, 80);
    assertEqual(A.sample(A.clips.lookAround, A.clips.lookAround.duration), frames[0]);
  });

  test('parse accepts a clip name or an expression', () => {
    assert(A.parse('idle') === A.clips.idle, 'a name gives the library clip');
    assertEqual(timing(A.parse('layer(idle, lookAround)')), { duration: 8, loop: true });
  });

  test('in an expression, a clip\'s name called with options makes that clip, as make does', () => {
    const made = A.parse("wave({ spec: 'terry' })"), byMake = A.make.wave({ spec: 'terry' });
    assertEqual(timing(made), timing(byMake));
    assertEqual(made(0.5), byMake(0.5), 'the same wave');
    assertEqual(A.parse('layer(still({ stance: "stand" }), point({ spec: "terry", hold: 2 }))')(0.5), A.layer(A.still({ stance: 'stand' }), A.make.point({ spec: 'terry', hold: 2 }))(0.5));
    assertEqual(timing(A.parse('walk()')), timing(A.clips.walk), 'and with none, the library clip');
  });

  test('parse makes every clip and feeling of an expression for the friend given', () => {
    assertEqual(A.parse('wave', { spec: 'howdi' })(0.6), A.make.wave({ spec: 'howdi' })(0.6), 'a name');
    assertEqual(A.parse('layer(still({}), wave)', { spec: 'yuanyuan' })(0.6), A.make.wave({ spec: 'yuanyuan' })(0.6), 'a name in an expression');
    assertEqual(A.parse('point({ hold: 2 })', { spec: 'howdi' })(0.6), A.make.point({ spec: 'howdi', hold: 2 })(0.6), 'a call');
    assertEqual(A.parse('layer("wave", rest(1))', { spec: 'yuanyuan' })(0.6), A.make.wave({ spec: 'yuanyuan' })(0.6), 'a name in quotes');
    assertEqual(A.parse('layer("wave", rest(1))')(0.6), A.clips.wave(0.6), 'and in quotes without a spec, the library clip');
    assertEqual(A.parse("hold('happy')", { spec: 'claude' })(1), {}, 'a feeling, which Claude does not show');
    assert(Object.keys(A.parse("hold('happy')")(1)).length > 0, 'and without a spec, the house face');
  });

  test('extend adds names to what parse understands, but never replaces one', () => {
    assertEqual(timing(A.parse("layer(idle, hold('curious'))")), { duration: 8, loop: true }, 'lib/fwiends/src/emotion.js adds hold');
    assertThrows(() => A.extend({ idle: A.rest(1) }), 'already a name');
    assertThrows(() => A.extend({ layer: () => null }), 'already a name');
  });

  test('a stack fades its layers in and out, eased, and plays each from its own start', () => {
    const stack = A.stack(), tilt = A.track({ tilt: [[0, 0], [1, 10, 'linear']] }), near = (a, b) => Math.abs(a - b) < 1e-9;
    const layer = stack.add(tilt, { at: 2, fade: 0.5 });
    assertEqual(layer.end, 3, 'a one-shot layer ends with its clip');
    assertEqual(stack.sample(1.9), {}, 'nothing before it starts');
    assert(near(stack.sample(2.25).tilt, 2.5 * 0.5), 'half faded in, a quarter of the way through');
    assert(stack.sample(2.125).tilt < 1.25 * 0.25 && stack.sample(2.375).tilt > 3.75 * 0.75, 'eased: slow to start and slow to finish');
    assertEqual(stack.sample(2.5).tilt, 5, 'fully in');
    stack.release(layer, 2.5);
    assert(near(stack.sample(2.75).tilt, 7.5 * 0.5), 'half faded out after a release');
    assert(!stack.active(3), 'gone once faded out');
    stack.prune(3.1);
    assertEqual(stack.layers.length, 0, 'forgotten once pruned');
  });

  test('a layer changes the eye shapes as it fades in and out under a blink, with the eyes shut, and the mouth at the fade\'s ends', () => {
    const stack = A.stack(), layer = stack.add(A.still({ eyes: 'happy', mouth: 'w', tilt: 4 }), { at: 1, until: 3 });
    const swap = A.SWAP.seconds * A.SWAP.shut, coming = layer.at + swap, going = layer.end - layer.fade + swap;
    const shut = t => A.sample(stack.sample(t)).blink;
    assertEqual([stack.sample(coming - 1e-3).eyes, stack.sample(coming).eyes], [undefined, 'happy'], 'in');
    assertEqual([stack.sample(going - 1e-3).eyes, stack.sample(going).eyes], ['happy', undefined], 'and out');
    for (const t of [coming, going]) assert(shut(t - 1e-3) > 0.95 && shut(t) > 0.95, `with the eyes shut (${shut(t)} at ${t} s)`);
    assertEqual([layer.at, layer.at + 1e-3, layer.end - 1e-3, layer.end].map(t => stack.sample(t).mouth), [undefined, 'w', 'w', undefined],
      'the mouth from the start of the fade in to the end of the fade out');
    const mouthed = A.stack();
    mouthed.add(A.still({ mouth: 'o', tilt: 4 }), { at: 1, until: 3 });
    assert([1.03, coming, 1.1, 2.9, going, 2.95].every(t => !A.sample(mouthed.sample(t)).blink), 'a mouth alone changes without a blink');
    assertEqual(mouthed.sample(1.001).mouth, 'o');
    assertEqual([shut(layer.at), shut(2), shut(layer.end + A.SWAP.seconds)], [0, 0, 0], 'and no other blink');
    const reduced = stack.sample(coming, { reduced: true });
    assertEqual([reduced.eyes, reduced.blink], ['happy', undefined], 'under reduced motion, at the same moment, without the blink');
    const quiet = A.stack(), light = A.stack();
    quiet.add(A.still({ tilt: 4 }), { at: 1, until: 3 });
    light.add(A.still({ eyes: 'happy', tilt: 4 }), { at: 1, until: 3, weight: 0.4 });
    assertEqual([shut(coming), A.sample(quiet.sample(coming)).blink, A.sample(light.sample(coming)).blink, light.sample(2).eyes],
      [1, 0, 0, undefined], 'a layer without shapes, or too light to show them, does not blink');
  });

  test('an arm laid over everything (over) comes forward as its layer starts to fade in and goes back as it ends', () => {
    const stack = A.stack();
    stack.add(A.still({ over: 'armL', armL: 160 }), { at: 1, until: 2 });
    assertEqual([1, 1.005, 1.995, 2].map(t => stack.sample(t).over), [undefined, 'armL', 'armL', undefined]);
    assert(Math.abs(stack.sample(1.005).armL) < 1 && Math.abs(stack.sample(1.995).armL) < 1, 'where the arm has hardly moved');
  });

  test('under reduced motion a stack passes on only the face: eye and mouth shapes, lids and blush', () => {
    const stack = A.stack();
    stack.add({ eyes: 'happy', mouth: 'w', lid: 0.4, flush: 0.3, y: -10, tilt: 5, show: 'laptop' }, { at: 0, fade: 0 });
    assertEqual(stack.sample(1, { reduced: true }), { eyes: 'happy', mouth: 'w', lid: 0.4, flush: 0.3 }, 'no prop either');
    assertEqual(stack.sample(1).y, -10);
  });

  test('lid, lidTilt and flush are clamped like the other ranged fields', () => {
    const pose = A.sample({ lid: 1.4, lidTilt: 50, flush: -0.3 });
    assertEqual([pose.lid, pose.lidTilt, pose.flush], [1, 30, 0]);
  });

  test('an unknown ease is an error', () => {
    assertThrows(() => A.sample(A.track({ tilt: [[0, 0], [1, 1, 'wobbly']] }), 0.5), 'unknown ease "wobbly"');
  });

  test('a friend turns round a quarter at a time, and a mirror turns it the other way', () => {
    const turn = A.make.turn({ quarters: 2, seconds: 0.25 });
    assertEqual([0.1, 0.3, 0.6, turn.duration].map(t => A.sample(turn, t).facing), [0, 90, 180, 180]);
    assertEqual(A.sample(A.make.turn({ quarters: -1 }), 1).facing, -90, 'a negative number turns the other way');
    assertEqual(A.sample(A.layer(A.still({ facing: 90 }), turn), 0.6).facing, 270, 'it adds to the facing under it');
    assertEqual(PhyFriends.quarterOf(A.sample(A.mirror(A.still({ facing: 90 })), 0).facing), 270, 'a mirror faces the other way');
  });

  test('a turn leads with the eyes, then the head, then the view snaps round, and the head settles', () => {
    for (const d of [1, -1]) {
      const turn = A.make.turn({ quarters: d }), frames = Array.from({ length: Math.round(turn.duration * 240) + 1 }, (_, i) => A.sample(turn, i / 240));
      const snap = frames.findIndex(p => p.facing !== 0), eyes = frames.findIndex(p => d * p.lookX > 0.1), head = frames.findIndex(p => d * p.turnX > 0.1);
      assert(0 < eyes && eyes < head && head < snap, `going ${d}: the eyes at ${eyes / 240} s, the head at ${head / 240} s, the view at ${snap / 240} s`);
      assert(d * frames[snap - 1].turnX > 0.4 && d * frames[snap].turnX < 0, 'the head well round before the snap, and a little behind after it');
      const end = frames.at(-1);
      assert(end.facing === d * 90 && Math.abs(end.turnX) < 1e-9 && Math.abs(end.lookX) < 1e-9, `going ${d}: it settles, looking ahead`);
    }
  });

  test('from behind, where its eyes do not show, the head leads a turn alone, from the start', () => {
    for (const d of [1, -1]) {
      const turn = A.make.turn({ quarters: d, from: 180 }), frames = Array.from({ length: Math.round(turn.duration * 240) + 1 }, (_, i) => A.sample(turn, i / 240));
      const snap = frames.findIndex(p => p.facing !== 0);
      assert(frames.slice(0, snap).every(p => p.lookX === 0), `going ${d}: the eyes keep to the front while the back is turned`);
      assert(d * frames[2].turnX > 0 && d * frames[snap - 1].turnX > 0.4, `going ${d}: the head turns from the start (${frames[2].turnX})`);
      assert(d * frames[snap].lookX > 0.3 && Math.abs(frames.at(-1).lookX) < 1e-9, 'side-on, the eyes show, come in turned, and settle');
    }
    const round = A.make.turn({ quarters: 2 });
    assertEqual(A.sample(round, round.duration * 0.9).lookX, 0, 'turned to its back, the eyes keep to the front');
  });

  // ---- The standing figure

  const STANDING = ['walk', 'wave', 'cheer', 'jump', 'standUp', 'sitDown', 'dance', 'stretch', 'point', 'beckon'];
  const NEUTRAL = A.sample({});
  // The numbers of a pose that are not at rest.
  const restless = pose => Object.keys(pose).filter(key => typeof pose[key] === 'number' && Math.abs(pose[key] - NEUTRAL[key]) > 1e-3);
  const span = (seconds, fps = 60) => Array.from({ length: Math.round(seconds * fps) + 1 }, (_, i) => i / fps);
  const sampled = (clip, fps = 60) => span(clip.duration, fps);
  const standers = () => PhyFriends.list().filter(name => PhyFriends.standFor(PhyFriends.get(name)));

  test('the standing movements start and end at rest, or loop in a length that divides 8 s', () => {
    const risen = { standUp: 1, sitDown: -1 };  // How far a change of stance has risen by its end.
    for (const name of STANDING) {
      const clip = A.clips[name];
      if (clip.loop) {
        assert(8 % clip.duration === 0, `${name} loops in ${clip.duration} s`);
        for (const t of TIMES) assertEqual(A.sample(clip, t + clip.duration), A.sample(clip, t), `${name} at ${t} s, a loop later`);
      } else {
        const end = A.sample(clip, clip.duration);
        assertEqual(restless(A.sample(clip, 0)), [], `${name} starts at rest`);
        assertEqual(end.rise, risen[name] || 0, `${name} ends risen by ${risen[name] || 0}`);
        assertEqual(restless({ ...end, rise: 0 }), [], `${name} ends at rest`);
      }
      assertEqual(A.sample(A.make[name](), 0.3), A.sample(clip, 0.3), `${name} is a deterministic function of time`);
    }
  });

  test('no movement lifts a foot by less than nothing, and sample keeps the figure within what it can take', () => {
    const steps = [...STANDING, 'bounce', 'idle'].flatMap(name => sampled(A.clips[name]).map(t => A.clips[name](t)));
    steps.push(...span(1).map(u => A.walking(u, 6, { distance: -70 }).pose));
    for (const pose of steps) assert(!(pose.stepL < -1e-9) && !(pose.stepR < -1e-9), `a step of ${pose.stepL} or ${pose.stepR}`);
    const pose = A.sample({ crouch: 40, stepL: -3, armL: 300, elbowR: -400, legR: -80, lean: 90 });
    assertEqual([pose.crouch, pose.stepL, pose.armL, pose.elbowR, pose.legR, pose.lean], [30, 0, 180, -150, -30, 30]);
    assertEqual([A.sample({ rise: 2 }).rise, A.sample({ rise: -2 }).rise], [1, -1], 'rise moves at most a whole stance');
  });

  test('a beckon reaches out the arm away from the tail and sweeps the paw back in twice, in under a second', () => {
    const beckon = A.parse('beckon', { spec: 'yuda' }), side = PhyFriends.freeSide('yuda'), other = side === 'L' ? 'R' : 'L';
    assert(beckon.duration > 0.8 && beckon.duration < 1, `it takes ${beckon.duration} s`);
    assertEqual(beckon(0.5), A.make.beckon({ spec: 'yuda' })(0.5), 'played by name, it is made for the friend');
    const poses = sampled(beckon, 120).map(t => A.sample(beckon, t)), elbows = poses.map(pose => pose[`elbow${side}`]);
    const sweeps = elbows.filter((e, i) => i > 0 && i < elbows.length - 1 && e > elbows[i - 1] && e >= elbows[i + 1]);
    assertEqual(sweeps.length, 2, 'the paw comes in twice');
    assert(sweeps.every(e => e > 20) && Math.min(...elbows) < -60, 'from the arm held straight out to the paw drawn in');
    assert(poses.every(pose => pose[`arm${other}`] === 0), 'the other arm rests');
  });

  test('idle breathes with a standing friend\'s arms, a little', () => {
    const arms = sampled(A.clips.idle, 10).map(t => A.sample(A.clips.idle, t).armL);
    const low = Math.min(...arms), high = Math.max(...arms);
    assert(high > 1 && Math.max(high, -low) < 4, `the arms move between ${low} and ${high}`);
  });

  test('a friend\'s idle never repeats: over a minute, no lag brings back what it did', () => {
    for (const name of ['phy', 'terry', 'claude']) {
      const idle = A.idleOf(name), n = 60 * 30, poses = Array.from({ length: 2 * n + 1 }, (_, i) => idle(i / 30));
      // Each field that moves, scaled to its own range.
      const series = Object.keys(poses[0]).filter(key => typeof poses[0][key] === 'number').map(key => {
        const v = poses.map(pose => pose[key]), lo = Math.min(...v), hi = Math.max(...v);
        return hi > lo ? v.map(x => (x - lo) / (hi - lo)) : null;
      }).filter(Boolean);
      for (let lag = 1; lag <= n; lag++) {
        let apart = 0;
        for (let i = 0; i < n && apart <= 0.2; i++) for (const s of series) apart = Math.max(apart, Math.abs(s[i + lag] - s[i]));
        assert(apart > 0.2, `${name}'s idle comes back ${lag / 30} s later, within ${apart.toFixed(3)} of each field's range`);
      }
    }
  });

  test('no two friends of the cast breathe in step, and each breathes by its build', () => {
    const names = PhyFriends.cast.names().filter(name => PhyFriends.list().includes(name)), idles = names.map(name => A.idleOf(name));
    assert(names.length > 2, `the cast's friends are defined here (${names})`);
    // Each friend's breath by its build and its seed alone, before the cast's are spread.
    const own = names.map(name => A.make.idle({ seed: PhyFriends.hash(name) % 997, duration: Infinity, spec: name }).breath);
    for (const [i, a] of idles.entries()) {
      for (const [j, b] of idles.entries()) {
        if (j <= i) continue;
        assert(Math.abs(a.breath - b.breath) / Math.min(a.breath, b.breath) >= 0.01, `${names[i]} and ${names[j]} breathe within 1%, ${a.breath} s and ${b.breath} s`);
        assert((a.breath - b.breath) * (own[i] - own[j]) > 0, `${names[i]} and ${names[j]} spread out of the order their builds give`);
        // How far apart their breaths drift over a minute, in breaths.
        const gaps = Array.from({ length: 61 }, (_, s) => (a.phase(s) - b.phase(s)) / (2 * Math.PI));
        const drift = Math.max(...gaps) - Math.min(...gaps);
        assert(drift > 0.1, `${names[i]} and ${names[j]} keep in step for a minute, drifting ${drift.toFixed(3)} of a breath apart`);
      }
    }
    const heavy = names.reduce((a, b) => (A.buildOf(a).mass > A.buildOf(b).mass ? a : b));
    const light = names.reduce((a, b) => (A.buildOf(a).mass < A.buildOf(b).mass ? a : b));
    assert(A.idleOf(heavy).breath > A.idleOf(light).breath, `${heavy}, the heaviest, breathes slower than ${light}, the lightest`);
  });

  test('a friend outside the cast, by a name nothing defines or with a spec of its own, idles by its build and never fails', () => {
    // A film's working copy is kept under a film-local name (demo/say-hi/sections/owners.js), which nothing defines.
    const name = 'test~working-copy', seed = PhyFriends.hash(name) % 997, own = { ...PhyFriends.get('terry') };
    assertEqual(A.breathOf(name), undefined, 'the cast\'s ladder leaves it out');
    assertEqual(A.idleOf(name).breath, A.make.idle({ seed, duration: Infinity }).breath, 'by name alone, the house\'s build, with its seed\'s detune');
    assertEqual(A.idleOf(name, { spec: own }).breath, A.make.idle({ seed, duration: Infinity, spec: own }).breath, 'with its spec, its own build');
    assert(Object.keys(A.idleOf(name)(12.5)).length > 0, 'and it idles');
    assertEqual([A.buildOf(name), A.massesOf(name), A.gaitOf(name), PhyFriends.emotion.fits(name)],
      [A.buildOf(null), A.massesOf(null), A.gaitOf(null), true], 'its build, its weight, its gait and its feelings are the house\'s');
    assertEqual(PhyFriends.find(name), null, 'and PhyFriends.find, unlike get, finds nothing rather than throwing');
    assertThrows(() => PhyFriends.get(name), 'unknown character');
  });

  test('Claude idles as it always has: the house\'s breath, never deeper, its head still while its eyes glance', () => {
    const idle = A.idleOf('claude'), poses = Array.from({ length: 2 * 60 * 30 + 1 }, (_, i) => idle(i / 30));
    const most = key => Math.max(...poses.map(pose => Math.abs(pose[key] || 0)));
    assertEqual(A.buildOf('claude'), { mass: 1, ears: 1, tail: 1, head: 1, follow: 0 }, 'the house\'s build');
    const limits = { turnY: 0, turnX: 0.06, tilt: 1.9, lean: 0.8, squash: 0.014, headY: 0.6, hair: 1.2, armL: 2.5, elbowL: 3, lookX: 0.4, lookY: 0.18 };
    for (const key in limits) assert(most(key) <= limits[key] + 1e-9, `its ${key} goes to ${most(key)}, beyond ${limits[key]}`);
  });

  test('standUp and sitDown raise and lower the head smoothly', () => {
    support.withBoxSync(el => {
      for (const name of standers()) {
        const rig = PhyFriends.mount(el, name, { bitmap: false, view: 'stand' }), lift = PhyFriends.riseOf(name, { stance: 'stand' });
        const moves = [['standUp', 'sit', 0, lift], ['sitDown', 'stand', lift, 0]];
        for (const [move, stance, from, to] of moves) {
          const clip = A.layer(A.still({ stance }), A.make[move]()), pose = t => A.sample(clip, t);
          assertEqual([PhyFriends.riseOf(name, pose(0)), PhyFriends.riseOf(name, pose(clip.duration))], [from, to], `${name}: ${move}`);
          // The eyes move a little each frame; the rig draws a squash to the hundredth, so a frame may add a step of a
          // unit or two, but never the whole rise at once.
          const eyes = t => { rig.setPose(pose(t), true); return rig.parts.eyeL.getScreenCTM().f; };
          let last = eyes(0), largest = 0;
          for (const t of span(clip.duration, 120).slice(1)) { const y = eyes(t); largest = Math.max(largest, Math.abs(y - last)); last = y; }
          assert(largest < 6, `${name}: the head jumps ${largest.toFixed(1)} px in one frame of ${move}`);
        }
        el.textContent = '';
      }
    }, 512);
  });

  test('walking steps off with the foot on the side it goes to and keeps a planted foot where it was', () => {
    // A spec with the house's body and the template's limbs, whose legs WALK.leg describes.
    const house = { rig: { ground: 131 }, body: { cx: 0, cy: 83, rx: 68, ry: 48 } };
    for (const distance of [96, -96]) {
      const first = A.walking(0.5 / 8, 8, { distance });
      const [lead, trail] = distance > 0 ? ['R', 'L'] : ['L', 'R'];
      assert(first.pose[`step${lead}`] > 0 && !first.planted[lead] && first.planted[trail], `the first step going ${distance}`);
      let last = null;
      for (let i = 0; i <= 64; i++) {
        const walk = A.walking(i / 64, 8, { distance });
        const pose = A.sample({ ...walk.pose, x: walk.along * distance, stance: 'stand' });
        const st = PhyFriends.poseState(house, pose), feet = {};
        for (const side of ['L', 'R']) {
          const [, x, y] = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(st.transform[`foot${side}`]).map(Number);
          feet[side] = { x: pose.x + (1 - pose.squash / 2) * x, y: y + pose.y, planted: walk.planted[side] };
        }
        for (const side of ['L', 'R']) {
          if (!last || !feet[side].planted || !last[side].planted) continue;
          assert(Math.abs(feet[side].x - last[side].x) < 0.5, `foot ${side} slides from ${last[side].x} to ${feet[side].x}`);
          assert(Math.abs(feet[side].y - last[side].y) < 0.5, `foot ${side} lifts from ${last[side].y} to ${feet[side].y}`);
        }
        last = feet;
      }
      assertEqual(A.walking(1, 8, { distance }).along, 1);
      assertEqual(restless(A.sample(A.walking(1, 8, { distance }).pose)), [], 'it ends at rest');
    }
    assertEqual(A.walking(0.5, 3).along, 0.5, 'its speed rises and falls alike, so it is halfway at half its time');
  });

  test('a walk takes steps no faster than WALK.cadence, longer ones when short of time, and gives way to hops when too short', () => {
    const gait = A.gaitOf('phy');
    for (const facing of [0, 90]) {
      const calm = A.walkSteps(240, 4, { gait, facing }), hurried = A.walkSteps(240, 2.5, { gait, facing });
      assert(calm > 0 && hurried > 0 && hurried <= A.WALK.cadence * 2.5, `${calm} steps in 4 s, ${hurried} in 2.5 s, facing ${facing}`);
      assert(hurried < calm || calm <= A.WALK.cadence * 2.5, 'short of time, it takes fewer, longer steps');
      assertEqual(A.walkSteps(240, 0.5, { gait, facing }), 0, `facing ${facing}, 240 units in half a second is a hop`);
    }
    assert(A.walkSteps(240, 4, { gait }) % 2 === 1, 'facing the viewer, a walk takes an odd number of steps, the leading foot first and last');
    assertEqual(A.gaitOf('claude'), null, 'Claude never stands, and has no gait');
  });

  test('every spring of the weight is overdamped: from rest it rises to a step in its drive and never past it', () => {
    for (const spec of [null, ...PhyFriends.list()]) {
      for (const q of A.springsFor(spec)) {
        assert(q.z > 1, `${q.name} has a damping of ${q.z}`);
        const state = new Float64Array(2);
        let top = 0;
        for (let i = 0; i < 4 / A.INERTIA.step; i++) { q.step(state, 0, 1); top = Math.max(top, state[0]); }
        assert(top <= 1 + 1e-12, `${spec || 'the template'}: ${q.name} reaches ${top} of its drive`);
        assert(state[0] > 0.999, `${spec || 'the template'}: ${q.name} settles on its drive, at ${state[0]}`);
      }
    }
  });

  test('a clip a friend plays is weighed for it: a hop trails its ears, Claude moves only what it has', () => {
    const ears = clip => Math.max(...span(clip.duration, 120).map(t => Math.abs(clip(t).earL || 0)));
    assert(ears(A.parse('hop', { spec: 'phy' })) > 5, 'a hop flops long ears');
    assert(ears(A.parse('hop', { spec: 'phy' })) > 4 * ears(A.parse('hop', { spec: 'terry' })), 'and tiny ones hardly at all');
    assert(!('earL' in A.make.hop()(0.5)), 'the hop itself leaves its ears to the weight');
    const claude = A.parse('hop', { spec: 'claude' });
    for (const t of span(claude.duration, 24)) {
      const pose = claude(t);
      assert(!('tip' in pose) && !('crouch' in pose) && !('tail' in pose) && !('headX' in pose), `Claude at ${t}: ${Object.keys(pose)}`);
    }
    const wave = A.parse('wave', { spec: 'phy' });
    assert(!wave.weighed && !A.parse('blink', { spec: 'phy' }).weighed, 'a clip whose root keeps still comes as it is');
  });

  test('a weighed clip is a function of its time alone: sampled at t, it is the same after any other times', () => {
    const times = [0.05, 0.31, 0.62, 0.9, 1.17, 2.4];
    for (const expr of ['hop', 'jump', 'bounce', 'layer(turn, hop)']) {
      const direct = times.map(t => A.sample(A.parse(expr, { spec: 'phy' }), t));
      const clip = A.parse(expr, { spec: 'phy' });
      for (const t of [3, 1.9, 0.2, 0.7]) clip(t);  // Another history, later times first.
      times.forEach((t, k) => assertEqual(A.sample(clip, t), direct[k], `${expr} at ${t} s`));
      if (clip.loop) for (const t of times) assertEqual(A.sample(clip, t + clip.duration), A.sample(clip, t), `${expr} loops at ${t} s`);
    }
  });

  test('a walk carries the body at a height with no step and no corner, as a foot lifts or lands, for every friend that stands', () => {
    // At 4000 samples, a jump would move the body units at once, and a corner would change its slope by about as much
    // as the slope itself; a smooth walk's height changes by under a tenth of a unit, and its slope by a fraction of that.
    const N = 4000;
    for (const name of PhyFriends.list().filter(name => A.gaitOf(name))) {
      for (const facing of [0, 90]) {
        for (const [distance, seconds] of [[200, 2.5], [-150, 2], [60, 1]]) {
          const gait = A.gaitOf(name), steps = A.walkSteps(distance, seconds, { gait, facing });
          const ys = span(1, N).map(u => A.walking(u, steps, { distance, gait, facing }).pose.y);
          let step = 0, corner = 0;
          for (let i = 1; i < ys.length; i++) step = Math.max(step, Math.abs(ys[i] - ys[i - 1]));
          for (let i = 1; i < ys.length - 1; i++) corner = Math.max(corner, Math.abs(ys[i + 1] - 2 * ys[i] + ys[i - 1]));
          const where = `${name} facing ${facing}, ${distance} units in ${seconds} s`;
          assert(step < 0.1, `${where}: the body moves ${step} in one sample`);
          assert(corner < 0.01, `${where}: the body's speed changes by ${corner} in one sample`);
          assertEqual([ys[0], ys[ys.length - 1]], [0, 0], `${where}: it starts and ends at rest`);
        }
      }
    }
  });

  test('a weight kept for an endless path holds a bounded number of values, and a far seek back gives what a fresh one does', () => {
    const path = t => ({ x: 40 * Math.sin(1.3 * t) + 10 * Math.sin(4.1 * t), y: -12 * Math.abs(Math.sin(3 * t)) });
    const weight = A.inertia(path, { spec: 'phy' });
    weight(1);
    const early = weight.size();
    for (let t = 0; t < 3600; t += 1 / 30) weight(t);  // An hour of frames.
    assert(weight.size() <= 2 * early, `it keeps ${weight.size()} values after an hour, ${early} after a second`);
    for (const t of [12.3456, 3599.5, 0.5]) {
      assertEqual(weight(t), A.inertia(path, { spec: 'phy' })(t), `at ${t} s, after the hour`);
    }
  });

  test('a clip is weighed once: every combinator carries the mark, and a friend\'s stack or a player does not weigh it again', () => {
    const hop = A.parse('hop', { spec: 'phy' }), ears = clip => Math.max(...span(2, 240).map(t => Math.abs(clip(t).earL || 0)));
    assert(hop.weighed, 'a hop parsed for a friend is weighed');
    const made = {
      layer: A.layer(hop), seq: A.seq(hop, 0.5), loop: A.loop(hop), repeat: A.repeat(hop, 2), speed: A.speed(hop, 2),
      delay: A.delay(hop, 0.3), pingpong: A.pingpong(hop), weight: A.weight(hop, 0.5), mirror: A.mirror(hop),
      remap: A.remap(hop, t => t, 1.2), 'a layer of it and another': A.layer(A.make.wave(), hop),
    };
    for (const name in made) assert(made[name].weighed, `${name} drops the mark`);
    const stack = A.stack({ spec: 'phy' });
    stack.add(A.layer(hop), { fade: 0 });
    assertEqual(ears(t => stack.sample(t)), ears(hop), 'a friend\'s stack does not weigh it twice');
  });

  test('every way of playing a clip on a friend weighs it once: a player weighs a hop or a jump for its rig', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    try {
      const rig = PhyFriends.mount(el, 'phy', { bg: false });
      for (const name of ['hop', 'jump']) {
        const own = A.weighed(A.clips[name], { spec: 'phy' });
        for (const clip of [A.clips[name], A.parse(name), own]) {
          const player = A.play(rig, clip, { autoplay: false, loop: false });
          for (const t of [0.4, 0.75, 0.9]) {
            const pose = player.seek(t).pose;
            for (const key of ['earL', 'crouch', 'tail']) {
              assert(Math.abs((pose[key] || 0) - (A.sample(own, t)[key] || 0)) < 1e-9, `${name} at ${t} s: ${key} ${pose[key]}`);
            }
          }
          player.destroy();
        }
        assert(Math.max(...[0.75, 0.8, 0.85].map(t => A.sample(own, t).crouch || 0)) > 2, `the ${name} lands in a crouch`);
      }
    } finally {
      el.remove();
    }
  });

  test('a friend\'s weight swings its tail no further than INERTIA.tail, however long the tail and however hard the move', () => {
    const rush = t => ({ x: 600 * Math.sin(2 * t), y: -60 * Math.abs(Math.sin(5 * t)) });  // Far harder than any scene's.
    for (const name of PhyFriends.list().filter(name => A.massesOf(name).tail > 0)) {
      const weight = A.inertia(rush, { spec: name, until: 3 });
      const most = Math.max(...span(6, 120).map(t => Math.abs(weight(t).tail || 0)));
      assert(most > 1 && most < A.INERTIA.tail, `${name}'s tail swings ${most} degrees`);
    }
  });

  test('the walk on the spot is at rest at every whole step, so that one cut after whole loops ends at rest and settles', () => {
    const walk = A.make.walk();
    for (const k of [0, 1, 2, 7]) assertEqual(restless(A.sample(walk((k * walk.duration) / 2))), [], `after ${k} steps`);
    for (const facing of [0, 90]) {
      const stood = { stance: 'stand', facing };
      const cut = A.parse(`layer(still(${JSON.stringify(stood)}), seq(repeat(walk, 4), rest(1)))`, { spec: 'mosing' });
      const tilts = span(cut.duration, 60).map(t => A.sample(cut, t).tilt);
      const jolt = Math.max(...tilts.slice(1).map((tilt, i) => Math.abs(tilt - tilts[i])));
      assert(jolt < 0.6, `facing ${facing}, the head turns ${jolt} degrees in a frame`);
      assert(Math.abs(tilts[tilts.length - 1]) < 0.05, 'and is back at rest a second after');
    }
  });

  test('a mirrored clip turns the other way and swaps every pair, limbs too, but keeps the tail on its side', () => {
    const pose = A.mirror(A.still({ lookX: 0.5, turnX: 0.2, tilt: 5, lean: 4, earL: 10, earR: -3, armL: 150, elbowL: -30, stepR: 6, over: 'armL', tail: 8, flush: 0.4 }))(0);
    assertEqual([pose.lookX, pose.turnX, pose.tilt, pose.lean, pose.earL, pose.earR, pose.flush, pose.tail], [-0.5, -0.2, -5, -4, -3, 10, 0.4, 8]);
    assertEqual([pose.armR, pose.elbowR, pose.stepL, pose.over, 'armL' in pose], [150, -30, 6, 'armR', false]);
  });

  test('under reduced motion a standing friend keeps its stance, and drops the arm movements and over, which are not the face', () => {
    assertEqual(A.faceOnly({ stance: 'stand', over: 'armL', armL: 150, eyes: 'happy' }), { stance: 'stand', eyes: 'happy' });
  });
})();
