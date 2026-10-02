// Tests of src/anim.js: a clip is a deterministic function of time, and composition keeps its timing.
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
    assertEqual(timing(A.parse("layer(idle, hold('curious'))")), { duration: 8, loop: true }, 'src/emotion.js adds hold');
    assertThrows(() => A.extend({ idle: A.rest(1) }), 'already a name');
    assertThrows(() => A.extend({ layer: () => null }), 'already a name');
  });

  test('a stack fades its layers in and out and plays each from its own start', () => {
    const stack = A.stack(), tilt = A.track({ tilt: [[0, 0], [1, 10, 'linear']] });
    const layer = stack.add(tilt, { at: 2, fade: 0.5 });
    assertEqual(layer.end, 3, 'a one-shot layer ends with its clip');
    assertEqual(stack.sample(1.9), {}, 'nothing before it starts');
    assertEqual(stack.sample(2.25).tilt, 2.5 * 0.5, 'half faded in, a quarter of the way through');
    assertEqual(stack.sample(2.5).tilt, 5, 'fully in');
    stack.release(layer, 2.5);
    assertEqual(stack.sample(2.75).tilt, 7.5 * 0.5, 'half faded out after a release');
    assert(!stack.active(3), 'gone once faded out');
    stack.prune(3.1);
    assertEqual(stack.layers.length, 0, 'forgotten once pruned');
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

  // ---- The standing figure

  const STANDING = ['walk', 'wave', 'cheer', 'jump', 'standUp', 'sitDown', 'dance', 'stretch', 'point'];
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

  test('idle breathes with a standing friend\'s arms, a little', () => {
    const arms = sampled(A.clips.idle, 10).map(t => A.sample(A.clips.idle, t).armL);
    const low = Math.min(...arms), high = Math.max(...arms);
    assert(high > 1 && Math.max(high, -low) < 4, `the arms move between ${low} and ${high}`);
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
      const first = A.walking(0.5 / 8, 8, { distance }).pose;
      const [lead, trail] = distance > 0 ? ['stepR', 'stepL'] : ['stepL', 'stepR'];
      assert(first[lead] > 0 && first[trail] === 0, `the first step going ${distance}`);
      let last = null;
      for (let i = 0; i <= 64; i++) {
        const walk = A.walking(i / 64, 8, { distance });
        const pose = A.sample({ ...walk.pose, x: walk.along * distance, stance: 'stand' });
        const st = PhyFriends.poseState(house, pose), feet = {};
        for (const side of ['L', 'R']) {
          const [, x, y] = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(st.transform[`foot${side}`]).map(Number);
          feet[side] = { x: pose.x + (1 - pose.squash / 2) * x, y: y + pose.y, planted: pose[`step${side}`] === 0 };
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
    assertEqual(A.walking(0.5, 3).along, 0.5, 'steps come in pairs, so three steps are four');
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
