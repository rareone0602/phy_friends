// Tests for src/scene.js. Each test builds a scene in its own laid-out stage and destroys it after.
(function () {
  'use strict';
  const S = PhyFriends.scene;

  function withScene(opts, fn) {
    const el = document.createElement('div');
    Object.assign(el.style, { position: 'fixed', left: '0', top: '0', width: '800px', opacity: '0' });
    document.body.appendChild(el);
    const scene = S.create(el, { width: 1600, height: 900, strict: true, ...opts });
    try {
      return fn(scene, el);
    } finally {
      scene.destroy();
      el.remove();
    }
  }

  // Everything a frame shows: each cut-out's placement and each rig part's transform.
  function snapshot(el) {
    return [...el.querySelectorAll('.pf-actor, .pf-actor [data-pf]')].map(node =>
      `${node.style.transform || ''}|${node.getAttribute('transform') || ''}|${node.style.display || ''}`).join('\n');
  }

  test('writing with a pen that does not fit the text falls back to writing from left to right', () => {
    withScene({}, (scene, el) => {
      const pen = { text: 'hi', width: 99, strokes: [{ letter: 0, width: 100, length: 400, d: 'M100 -400L100 0' }] };
      const writing = scene.write('hi', { at: 0, seconds: 1, pen });
      scene.seek(0.5);
      assert(!el.querySelector('.pf-pen'), 'no copy is laid over the text');
      assert(writing.node.style.clipPath.startsWith('inset('), 'the text is half written from the left');
    });
  });

  test('a frame depends only on the time: seeking back redraws it exactly', () => {
    withScene({}, (scene, el) => {
      const phy = scene.add('phy', { x: 500 }), yuda = scene.add('yuda', { x: 1100 });
      yuda.enter({ from: 'right', at: 0.2 });
      phy.look(yuda, { at: 0.5 }).play('happy', { at: 1 });
      scene.seek(1.3);
      const first = snapshot(el);
      scene.seek(0.1).seek(2.7).seek(1.3);
      assertEqual(snapshot(el), first);
    });
  });

  test('a friend who enters is hidden before its entrance and ends on its mark', () => {
    withScene({}, scene => {
      const yuda = scene.add('yuda', { x: 1100 });
      yuda.enter({ from: 'right', at: 1 });
      assert(!yuda.visibleAt(0.5), 'hidden before');
      assert(yuda.state(1.2).x > 1100, 'on the way in from the right');
      assertEqual(yuda.state(10).x, 1100);
    });
  });

  test('strangers who stand too close break the scene', () => {
    withScene({}, scene => {
      scene.add('kevin', { x: 700 });
      assertThrows(() => scene.add('brian', { x: 860 }), /K3V1N and Brian stand -?\d+ head units apart, but strangers keep at least 40/);
    });
  });

  test('strangers may stand a polite distance apart', () => {
    withScene({}, scene => {
      scene.add('kevin', { x: 500 });
      scene.add('brian', { x: 1000 });
      scene.check({ to: 0 });
    });
  });

  test('the host may stand closer to a friend than strangers may', () => {
    withScene({}, scene => {
      const phy = scene.add('phy', { x: 600 }), yuda = scene.add('yuda', { x: 1200 });
      const room = (1200 - yuda.extent().left) - (600 + phy.extent().right), gap = 10;
      assert(gap < PhyFriends.cast.GAP.strangers, 'closer than strangers stand');
      yuda.moveTo(1200 - room + gap, { at: 0.1, duration: 0.5 });
      scene.check({ to: 1 });
    });
  });

  test('a friend without a voice may not say words, and strangers may not talk or hand things over', () => {
    withScene({}, scene => {
      const yuda = scene.add('yuda', { x: 400 }), terry = scene.add('terry', { x: 1100 });
      assertThrows(() => yuda.say('hello'), /Yuda has no voice/);
      assertThrows(() => yuda.emote('hello'), /is not a mark/);
      yuda.emote('♪');
      assertThrows(() => yuda.say('!', { to: terry }), /Yuda may not talk to Terry/);
      assertThrows(() => yuda.give(scene.prop({ w: 10, h: 10, svg: '' }), terry), /Yuda may not hand something to Terry/);
    });
  });

  test('the host may talk to anyone and hand them things', () => {
    withScene({}, scene => {
      const phy = scene.add('phy', { x: 500 }), yuda = scene.add('yuda', { x: 1000 });
      phy.say('happy birthday, Yuda!', { to: yuda });
      phy.give(scene.prop({ w: 40, h: 40, svg: '<circle cx="20" cy="20" r="18" fill="#e9a"/>' }), yuda, { at: 1 });
    });
  });

  test('the draft stamp shows while a friend on stage has not agreed to the medium', () => {
    withScene({}, (scene, el) => {
      const stamp = el.querySelector('.pf-draft');
      scene.add('phy', { x: 500 });
      assert(stamp.hidden, 'phy alone is not a draft');
      scene.add('yuda', { x: 1100 });
      assert(!stamp.hidden, 'Yuda makes it a draft');
    });
  });

  test('a filmable scene lists the friends whose owners have not agreed to video', () => {
    withScene({}, scene => {
      scene.add('phy', { x: 400 });
      scene.add('terry', { x: 1100 });
      assertEqual(scene.film({ duration: 2 }), false);
      assertEqual(window.film.duration, 2);
      assertEqual(window.film.unagreed, ['terry']);
    });
  });

  test('the credit line names the owners of the friends in frame, in order of appearance', () => {
    withScene({}, (scene, el) => {
      scene.add('terry', { x: 1200 });
      scene.add('phy', { x: 400, at: 1 });
      const credits = () => [...el.querySelectorAll('.pf-credits span')].map(span => span.textContent.replace('\u00a0', ' '));
      scene.seek(2);
      assertEqual(credits(), ['Terry @FreshSnails_x_6', 'phy linkedin']);
      scene.seek(0.5);
      assertEqual(credits(), ['Terry @FreshSnails_x_6']);
    });
  });

  test('a boiling scene redraws the pencil texture as a function of time', () => {
    withScene({ boil: 8 }, (scene, el) => {
      scene.add('phy', { x: 800 });
      const texture = () => el.querySelector('image[data-pf-texture]').getAttribute('href');
      scene.seek(0);
      const still = texture();
      scene.seek(0.2);
      assert(texture() !== still, 'the texture changes');
      scene.seek(0.375);
      assertEqual(texture(), still, 'three variants, then around again');
    });
  });

  test('the film contract reads consent when filmed, not when the film was declared', () => {
    withScene({}, scene => {
      scene.add('phy', { x: 400 });
      scene.film({ duration: 2 });
      scene.add('yuda', { x: 1100 });
      assertEqual(window.film.unagreed, ['yuda']);
    });
  });

  test('a friend may enter, exit and enter again, and a later move does not bring it back', () => {
    withScene({}, scene => {
      const yuda = scene.add('yuda', { x: 800 });
      yuda.enter({ from: 'left', at: 0 }).exit({ to: 'right', at: 4 }).enter({ from: 'right', at: 10 });
      assert(yuda.visibleAt(3) && !yuda.visibleAt(9) && yuda.visibleAt(13), 'shown, gone, shown again');
      const terry = scene.add('terry', { x: 300 });
      terry.moveTo(500, { at: 6 });
      terry.exit({ to: 'left', at: 1 });
      assert(!terry.visibleAt(7), 'still gone after the later move');
    });
  });

  test('a friend refused for standing too close leaves the scene as it was', () => {
    withScene({}, (scene, el) => {
      scene.add('kevin', { x: 700 });
      assertThrows(() => scene.add('brian', { x: 860 }), /strangers keep at least 40/);
      assertEqual(scene.actors.length, 1);
      assert(!el.querySelector('[data-friend="brian"]'), 'no cut-out left behind');
    });
  });

  test('removing a prop twice leaves the other props drawn', () => {
    withScene({}, scene => {
      const a = scene.prop({ w: 10, h: 10, svg: '' }), b = scene.prop({ w: 10, h: 10, svg: '' });
      a.remove();
      a.remove();
      b.show(5);
      scene.seek(1);
      assertEqual(b.node.style.display, 'none');
    });
  });

  test('a move cued in the middle of a leap waits for the landing', () => {
    withScene({}, scene => {
      const phy = scene.add('phy', { x: 800 });
      phy.leap({ at: 1, height: 90, duration: 0.6 });
      phy.moveTo(1000, { at: 1.2 });
      assert(phy.state(1.3).lift > 40, 'still in the air');
      assertEqual(phy.state(10).x, 1000);
    });
  });

  test('a friend may look at a prop', () => {
    withScene({}, (scene, el) => {
      const phy = scene.add('phy', { x: 600 });
      phy.look(scene.prop({ w: 10, h: 10, svg: '' }, { x: 1000 }), { at: 0 });
      scene.seek(1);
      assert(!/NaN/.test(snapshot(el)), 'no NaN in any transform');
    });
  });
})();
