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
    assertEqual(timing(A.layer(A.clips.idle, A.clips.curious)), { duration: 8, loop: true });
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
    const frames = A.frames(A.clips.curious, 10);
    assertEqual(frames.length, 40);
    assertEqual(A.sample(A.clips.curious, A.clips.curious.duration), frames[0]);
  });

  test('parse accepts a clip name or an expression', () => {
    assert(A.parse('idle') === A.clips.idle, 'a name gives the library clip');
    assertEqual(timing(A.parse('layer(idle, curious)')), { duration: 8, loop: true });
  });

  test('an unknown ease is an error', () => {
    assertThrows(() => A.sample(A.track({ tilt: [[0, 0], [1, 1, 'wobbly']] }), 0.5), 'unknown ease "wobbly"');
  });
})();
