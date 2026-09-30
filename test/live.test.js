// Tests of src/live.js: a stage drawn frame by frame at chosen times (stage.draw), so that the rules for
// saying hi, stroking, curiosity and dozing can be checked without waiting for real time to pass.
(function () {
  'use strict';

  const PF = PhyFriends, L = PF.live;

  // Runs fn(stage, friends, said) with the named friends mounted on a stage that is never started.
  function withStage(names, options, fn) {
    const boxes = names.map(() => {
      const box = document.createElement('div');
      Object.assign(box.style, { position: 'relative', width: '160px', height: '160px' });
      document.body.appendChild(box);
      return box;
    });
    const said = [];
    try {
      const stage = L.stage({ announce: text => said.push(text), ...options });
      const friends = names.map((name, index) => stage.add(boxes[index], name, { label: PF.cast.friend(name).name, index }));
      fn(stage, friends, said);
    } finally {
      boxes.forEach(box => box.remove());
    }
  }

  const moving = { reducedMotion: { matches: false } };
  const still = { reducedMotion: { matches: true } };

  test('a stroke is two turns of the pointer within a moment, each after a few pixels', () => {
    const strokes = L.strokeDetector();
    const along = (xs, step = 0.1) => xs.map((x, i) => strokes.move(x, i * step)).at(-1);
    assert(!along([0, 20, 40, 60, 80]), 'passing over is not a stroke');
    strokes.reset();
    assert(!along([0, 5, 0, 5, 0, 5]), 'a jiggle smaller than the distance is not a stroke');
    strokes.reset();
    assert(along([0, 20, 0, 20]), 'right, left and right again is a stroke');
    strokes.reset();
    assert(!along([0, 20, 0, 20], 0.9), 'turns too far apart are not a stroke');
  });

  test('the friends doze off one at a time, in a seeded order, each falling asleep a few seconds later', () => {
    const times = L.dozeSchedule(12, 10), again = L.dozeSchedule(12, 10);
    assertEqual(times, again, 'the same every time');
    const sleepy = times.map(time => time.sleepyAt).sort((a, b) => a - b);
    assertEqual([sleepy[0], sleepy.at(-1)], [10, 10 + L.DOZE.spread]);
    assert(new Set(sleepy).size === 12, 'one at a time');
    for (const { sleepyAt, asleepAt } of times) {
      assert(Math.abs(asleepAt - sleepyAt - L.DOZE.asleep) <= L.DOZE.jitter, `asleep ${asleepAt - sleepyAt} s after growing sleepy`);
    }
    assert(times[0].sleepyAt !== 10 || times[1].sleepyAt !== 10 + L.DOZE.spread / 11, 'not in the order of the page');
  });

  test('what a screen reader hears when the friends doze and wake', () => {
    assertEqual(L.dozeAnnouncement(['Howdi', 'phy'], ['Claude']), 'Everyone but Claude falls asleep.');
    assertEqual(L.dozeAnnouncement(['phy']), 'phy falls asleep.');
    assertEqual(L.dozeAnnouncement(['Howdi', 'phy']), 'Everyone falls asleep.');
    assertEqual(L.wakeAnnouncement(['phy'], 1), 'phy wakes up.');
    assertEqual(L.wakeAnnouncement(['Howdi'], 2), 'Everyone wakes up.');
  });

  test('a hi hops twice, a friend in the air ignores another, and the third hi of a run makes it shy for a while', () => {
    withStage(['howdi'], moving, (stage, [howdi], said) => {
      stage.draw(0);
      assert(howdi.hi(), 'the first hi');
      stage.draw(0.3);
      assertEqual(howdi.rig.pose.eyes, 'happy');
      assert(howdi.rig.pose.y < 0, 'in the air');
      assert(!howdi.hi(), 'a hi in the air is ignored');
      stage.draw(1.3);
      assert(howdi.hi(), 'the second hi');
      stage.draw(2.6);
      assert(howdi.hi(), 'the third hi');
      assertEqual(howdi.feeling, 'shy');
      assertEqual(said, ['Howdi hops twice.', 'Howdi hops twice.', 'Howdi goes shy.']);
      stage.draw(2.6 + L.SHY.seconds - 0.2);
      assert(!howdi.hi(), 'a hi while shy is ignored');
      assertEqual(howdi.feeling, 'shy', 'still shy, not hopping for joy');
      stage.draw(9);
      assertEqual(howdi.feeling, null, 'shy for a while only');
      howdi.hi();
      assertEqual(said.at(-1), 'Howdi hops twice.', 'a new run starts with a hop');
    });
  });

  test('a friend that shows no feelings hops and smiles on every hi, and never goes shy', () => {
    withStage(['claude'], moving, (stage, [claude], said) => {
      for (const t of [0, 1.3, 2.6]) {
        stage.draw(t);
        claude.hi();
      }
      stage.draw(2.9);
      assert(claude.rig.pose.y < 0 && claude.rig.pose.eyes === 'happy', 'in the air, smiling');
      assertEqual(claude.feeling, null);
      assertEqual(said, ['Claude hops twice.', 'Claude hops twice.', 'Claude hops twice.']);
    });
  });

  test('under reduced motion a hi is a smile, and nothing moves', () => {
    withStage(['howdi', 'claude'], still, (stage, [howdi, claude], said) => {
      stage.draw(0);
      howdi.hi();
      claude.hi();
      stage.draw(0.3);
      assertEqual([howdi.rig.pose.eyes, howdi.rig.pose.y, howdi.rig.pose.earL], ['happy', 0, 0]);
      assertEqual([claude.rig.pose.eyes, claude.rig.pose.mouth, claude.rig.pose.y], ['happy', 'w', 0]);
      assertEqual(said, ['Howdi smiles.', 'Claude smiles.']);
    });
  });

  test('stroking a friend makes it content until a moment after the stroking stops', () => {
    withStage(['phy'], moving, (stage, [phy], said) => {
      stage.draw(0);
      for (const x of [100, 120, 140, 110, 90, 120, 150]) {
        phy.rig.el.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: x }));
      }
      assertEqual(phy.feeling, 'content');
      assertEqual(said, ['phy looks content.']);
      assert(phy.rig.el.querySelector('.pf-live-mark').textContent === '♪', 'with its mark');
      stage.draw(0.5);
      assertEqual(phy.feeling, 'content', 'still content just after');
      stage.draw(1.2);
      assertEqual(phy.feeling, null, 'calm once the stroking has stopped');
    });
  });

  test('a friend hovered for a moment grows curious until the pointer leaves', () => {
    withStage(['yuda'], moving, (stage, [yuda]) => {
      yuda.rig.el.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
      stage.draw(0);
      stage.draw(1);
      assertEqual(yuda.feeling, null, 'not yet');
      stage.draw(1.6);
      assertEqual(yuda.feeling, 'curious');
      yuda.rig.el.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
      stage.draw(1.7);
      assertEqual(yuda.feeling, null);
    });
  });

  test('left alone, everyone but Claude dozes off, and any input wakes them with a start', () => {
    withStage(['howdi', 'phy', 'claude'], { ...moving, doze: 1 }, (stage, [howdi, phy, claude], said) => {
      stage.draw(0);
      stage.draw(0.9);
      assert(!stage.dozing, 'awake before the wait is over');
      stage.draw(1);
      assert(stage.dozing, 'dozing once it is');
      stage.draw(1 + L.DOZE.spread + L.DOZE.asleep + 1);
      assertEqual([howdi.feeling, phy.feeling, claude.feeling], ['asleep', 'asleep', null]);
      assertEqual(howdi.rig.pose.eyes, 'closed');
      assert([...howdi.rig.el.querySelectorAll('.pf-live-mark')].some(mark => mark.textContent === 'z'), 'a z over a sleeper');
      assertEqual(said, ['Everyone but Claude falls asleep.']);
      stage.noteInput(null);
      assertEqual(said.at(-1), 'Everyone wakes up.');
      stage.draw(stage.seconds + 0.2);
      assertEqual([howdi.feeling, phy.feeling], ['surprised', 'surprised']);
      assert(!howdi.hi(), 'a friend waking with a start ignores a hi');
    });
  });

  test('the hold and feel options hold a greeting or a feeling still, for screenshots', () => {
    withStage(['phy', 'claude'], { ...moving, pointer: { x: 0, y: 0 }, feel: 'sad' }, (stage, [phy, claude]) => {
      stage.draw(0.5);
      assertEqual(phy.rig.pose.mouth, 'frown');
      assertEqual(claude.rig.pose.mouth, null, 'a friend that shows no feelings is left out');
    });
    withStage(['phy', 'yuda'], { ...moving, pointer: { x: 0, y: 0 }, hold: 'yuda' }, (stage, [phy, yuda]) => {
      stage.draw(5);
      assert(yuda.rig.pose.y < 0 && yuda.rig.pose.eyes === 'happy', 'held in the air');
      assert(phy.rig.pose.lookY > 0.5, 'the others look at it, below them, rather than at the pointer above');
    });
  });

  test('keep still: a checkbox makes the choice, which is remembered, or else the system decides', () => {
    const checkbox = Object.assign(document.createElement('input'), { type: 'checkbox' });
    const label = document.createElement('label');
    label.hidden = true;
    label.appendChild(checkbox);
    document.body.appendChild(label);
    try {
      L.still.choose(null);
      L.keepStill(checkbox);
      assert(!label.hidden, 'shown once it works');
      assertEqual([checkbox.checked, L.still.matches], [L.still.system.matches, L.still.system.matches], 'the system decides at first');
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));
      assert(L.still.matches, 'ticked, the friends keep still');
      assertEqual(localStorage.getItem('phy-friends-still'), '1', 'and the choice is remembered');
      checkbox.checked = false;
      checkbox.dispatchEvent(new Event('change'));
      assert(!L.still.matches, 'cleared, they move, whatever the system says');
      withStage(['howdi'], {}, (stage, [howdi]) => {
        L.still.choose(true);
        assert(stage.reduced, 'a stage keeps to the choice by default');
      });
    } finally {
      L.still.choose(null);
      label.remove();
    }
  });

  test('a mirrored clip looks, turns and tilts the other way, and swaps its ears', () => {
    const pose = L.mirrored(PF.anim.still({ lookX: 0.5, turnX: 0.2, tilt: 5, earL: 10, earR: -3, flush: 0.4 }))(0);
    assertEqual([pose.lookX, pose.turnX, pose.tilt, pose.earL, pose.earR, pose.flush], [-0.5, -0.2, -5, -3, 10, 0.4]);
  });
})();
