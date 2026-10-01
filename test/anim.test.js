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
})();
