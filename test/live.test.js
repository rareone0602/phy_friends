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

  test('a friend added standing stays standing through a hi, and under reduced motion too', () => {
    for (const options of [moving, still]) {
      const box = document.createElement('div');
      Object.assign(box.style, { position: 'relative', width: '160px', height: '160px' });
      document.body.appendChild(box);
      try {
        const stage = L.stage({ announce: () => {}, ...options }), howdi = stage.add(box, 'howdi', { label: 'Howdi', stance: 'stand' });
        assertEqual(howdi.rig.pose.stance, 'stand', 'standing from the start');
        stage.draw(0);
        howdi.hi();
        stage.draw(0.3);
        assertEqual(howdi.rig.pose.stance, 'stand', 'through a hi');
        assert(PhyFriends.riseOf('howdi', howdi.rig.pose) > PhyFriends.standLift('howdi') / 2, 'it is drawn standing');
      } finally {
        box.remove();
      }
    }
  });

  test('a friend that shows no feelings hops and smiles on a hi, never goes shy, and its third hi plays its routine', () => {
    withStage(['claude'], moving, (stage, [claude], said) => {
      for (const t of [0, 1.3]) {
        stage.draw(t);
        claude.hi();
      }
      stage.draw(1.6);
      assert(claude.rig.pose.y < 0 && claude.rig.pose.eyes === 'happy', 'in the air, smiling');
      stage.draw(2.6);
      assert(claude.hi(), 'the third hi');
      assertEqual(claude.feeling, null, 'no feelings');
      assertEqual(said, ['Claude hops twice.', 'Claude hops twice.', 'Claude gets out its laptop and types.']);
      stage.draw(3.1);
      assertEqual(claude.rig.pose.eyeL, 'closed', 'it winks');
      stage.draw(4.6);
      assert(/\blaptop\b/.test(claude.rig.pose.show), 'its laptop is out');
      assert(!claude.hi(), 'a hi while it types is ignored');
      stage.draw(2.6 + claude.spec.routine.duration + 0.5);
      assert(!claude.rig.pose.show, 'the laptop is put away');
      assert(claude.hi(), 'a hi once it is done');
      assertEqual(said.at(-1), 'Claude hops twice.', 'a new run starts with a hop');
    });
  });

  test('under reduced motion the routine is its face alone: Claude winks, and its laptop stays away', () => {
    withStage(['claude'], still, (stage, [claude], said) => {
      for (const t of [0, 1.3, 2.6]) {
        stage.draw(t);
        claude.hi();
      }
      stage.draw(3.1);
      assertEqual([claude.rig.pose.eyeL, claude.rig.pose.x, claude.rig.pose.show || ''], ['closed', 0, '']);
      stage.draw(4.6);
      assertEqual(claude.rig.pose.show || '', '', 'no laptop');
      assertEqual(said.at(-1), 'Claude winks.');
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
      assert(phy.rig.el.querySelector('.pf-live-mark').dataset.mark === '♪', 'with its mark');
      stage.draw(0.5);
      assertEqual(phy.feeling, 'content', 'still content just after');
      stage.draw(1.2);
      assertEqual(phy.feeling, null, 'calm once the stroking has stopped');
    });
  });

  test('the stage tells the page how long a friend has been stroked, until the stroking stops', () => {
    const reports = [];
    withStage(['phy'], { ...moving, onStroke: (friend, seconds) => reports.push([friend.name, seconds]) }, (stage, [phy]) => {
      const rub = () => {
        for (const x of [100, 120, 140, 110, 90, 120, 150]) phy.rig.el.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: x }));
      };
      stage.draw(0);
      rub();
      stage.draw(0.5);
      rub();
      stage.draw(0.9);
      assertEqual(reports, [['phy', 0], ['phy', 0.5]]);
      stage.draw(0.5 + L.STROKE.linger + 0.1);
      stage.draw(3);
      assertEqual(reports.length, 2, 'no more once the stroking has stopped');
    });
  });

  test('the left and right arrow keys, pressed in turn, stroke a friend too', () => {
    withStage(['terry'], moving, (stage, [terry], said) => {
      stage.draw(0);
      const press = key => {
        const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        terry.rig.el.dispatchEvent(event);
        return event.defaultPrevented;
      };
      assert(press('ArrowRight') && press('ArrowRight'), 'the arrow keys do not scroll the page');
      assertEqual(terry.feeling, null, 'one way only is not a stroke');
      press('ArrowLeft');
      assertEqual(terry.feeling, null, 'nor is one turn');
      press('ArrowRight');
      assertEqual(terry.feeling, 'content', 'right, left and right again is');
      assertEqual(said, ['Terry looks content.']);
    });
  });

  test('a finger held still on a friend strokes it, and the tap that ends the press is not a hi', async () => {
    const box = document.createElement('div');
    Object.assign(box.style, { position: 'relative', width: '160px', height: '160px' });
    document.body.appendChild(box);
    const said = [];
    try {
      const stage = L.stage({ announce: text => said.push(text), ...moving });
      const alfie = stage.add(box, 'alfie', { label: 'Alfie' });
      const touches = x => [new Touch({ identifier: 1, target: box, clientX: x, clientY: 80 })];
      stage.draw(0);
      box.dispatchEvent(new TouchEvent('touchstart', { touches: touches(80), bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, L.STROKE.press * 1000 + 100));
      assertEqual(alfie.feeling, 'content', 'content while the finger stays');
      stage.draw(3);
      assertEqual(alfie.feeling, 'content', 'for as long as it stays');
      box.dispatchEvent(new TouchEvent('touchend', { touches: [], bubbles: true }));
      box.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      assertEqual(said, ['Alfie looks content.'], 'no hi');
      stage.draw(3 + L.STROKE.linger + 0.1);
      assertEqual(alfie.feeling, null, 'calm a moment after it lifts');
      box.dispatchEvent(new TouchEvent('touchstart', { touches: touches(80), bubbles: true }));
      box.dispatchEvent(new TouchEvent('touchend', { touches: [], bubbles: true }));
      box.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      assertEqual(said.at(-1), 'Alfie hops twice.', 'a quick tap is a hi');
    } finally {
      box.remove();
    }
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

  test('with no pointer, the others look at the friend the keyboard is on', () => {
    withStage(['howdi', 'phy', 'yuda'], moving, (stage, [howdi, phy, yuda]) => {
      // Focus counts as the keyboard's only after real input to a page that has the window's focus,
      // which a test cannot give, so the box is told that its focus shows and is sent the event.
      const box = phy.rig.el;
      box.matches = selector => selector === ':focus-visible' || Element.prototype.matches.call(box, selector);
      box.dispatchEvent(new FocusEvent('focus'));
      assert(phy.focused, 'phy is focused from the keyboard');
      for (let t = 0; t <= 1.2; t += 0.1) stage.draw(t);
      assert(howdi.rig.pose.lookY > 0.3 && yuda.rig.pose.lookY < -0.3, 'the others look at phy, below and above them');
      box.dispatchEvent(new FocusEvent('blur'));
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
      assert([...howdi.rig.el.querySelectorAll('.pf-live-mark')].some(mark => mark.dataset.mark === 'z'), 'a z over a sleeper');
      assertEqual(said, ['Everyone but Claude falls asleep.']);
      stage.noteInput(null);
      assertEqual(said.at(-1), 'Everyone wakes up.');
      stage.draw(stage.seconds + 0.2);
      assertEqual([howdi.feeling, phy.feeling], ['surprised', 'surprised']);
      assert(!howdi.hi(), 'a friend waking with a start ignores a hi');
    });
  });

  test('falling asleep is told once a visit, and waking is not told when the reader only moves about the page', () => {
    withStage(['howdi', 'phy'], { ...moving, doze: 1 }, (stage, friends, said) => {
      // From t, a second for the wait, then long enough for everyone to fall asleep.
      const dozeFrom = t => { stage.draw(t + 1); stage.draw(t + 1 + L.DOZE.spread + L.DOZE.asleep + 1); };
      stage.draw(0);
      dozeFrom(0);
      assertEqual(said, ['Everyone falls asleep.']);
      stage.noteInput(null, { quiet: true });
      assertEqual(said, ['Everyone falls asleep.'], 'a scroll or a Tab wakes them quietly');
      dozeFrom(stage.seconds);
      assert(stage.dozing, 'asleep again');
      assertEqual(said.length, 1, 'and not told again');
      stage.noteInput({ x: 0, y: 0 });
      assertEqual(said.at(-1), 'Everyone wakes up.', 'a click or the pointer wakes them aloud');
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

  test('a friend added standing shows its marks higher by its lift', () => {
    const boxes = [0, 1].map(() => {
      const box = document.createElement('div');
      Object.assign(box.style, { position: 'relative', width: '160px', height: '160px', containerType: 'inline-size' });
      document.body.appendChild(box);
      return box;
    });
    try {
      const stage = L.stage({ announce: () => {}, reducedMotion: { matches: false } });
      const [sitting, standing] = ['sit', 'stand'].map((stance, i) => stage.add(boxes[i], 'howdi', { label: 'Howdi', stance, index: 0 }));
      stage.draw(0);
      sitting.feel('surprised');
      standing.feel('surprised');
      stage.draw(0.2);
      const [low, high] = boxes.map(box => box.querySelector('.pf-live-mark').getBoundingClientRect().top - box.getBoundingClientRect().top);
      const unit = boxes[0].getBoundingClientRect().width / standing.view.w;
      assert(Math.abs(low - high - PF.standLift('howdi') * unit) < 1, `the marks are ${((low - high) / unit).toFixed(1)} units apart`);
    } finally {
      boxes.forEach(box => box.remove());
    }
  });
})();
