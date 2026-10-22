// Tests for lib/fwiends/film/scene.js. Each test builds a scene in its own laid-out stage and destroys it after.
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
      phy.look(yuda, { at: 0.5 }).feel('happy', { at: 1, until: 3 });
      scene.seek(1.3);
      const first = snapshot(el);
      scene.seek(0.1).seek(2.7).seek(1.3);
      assertEqual(snapshot(el), first);
    });
  });

  test('a friend stands up and sits down on cue, walking while it stands and hopping while it sits', () => {
    withScene({}, scene => {
      const yuda = scene.add('yuda', { x: 600 });
      yuda.stand({ at: 1 }).moveTo(700, { at: 3 }).sit({ at: 6 }).moveTo(600, { at: 8 });
      assertEqual([yuda.stanceAt(0.9), yuda.stanceAt(2.5), yuda.stanceAt(7)], ['sit', 'stand', 'sit']);
      scene.seek(2.5);
      assertEqual(yuda.rig.pose.stance, 'stand', 'its rig stands');
      const walking = yuda.state(3.3), hopping = yuda.state(8.15);
      assert(walking.moving && walking.walk && walking.lift === 0, 'it walks: its feet keep to the floor');
      assert(hopping.moving && !hopping.walk && hopping.lift > 0, 'seated again, it hops');
      assertEqual(yuda.state(10).x, 600, 'and ends on its mark');
    });
  });

  test('a friend added standing has its eyes raised by its lift', () => {
    withScene({}, scene => {
      const phy = scene.add('phy', { x: 500 }), yuda = scene.add('yuda', { x: 1100, stance: 'stand' });
      const lift = PhyFriends.standLift('yuda');
      assert(lift > 0, 'standing is taller');
      assertEqual(yuda.eyesAt(0).y, phy.eyesAt(0).y - lift + (PhyFriends.groundOf('phy') - PhyFriends.groundOf('yuda')));
      scene.seek(0.5);
      assertEqual(yuda.rig.pose.stance, 'stand');
    });
  });

  test('a friend raises its eyes smoothly as it stands up, and lowers them as it sits', () => {
    withScene({}, scene => {
      const terry = scene.add('terry', { x: 600 }), lift = PhyFriends.standLift('terry');
      terry.stand({ at: 1 }).sit({ at: 4 });
      const seated = terry.eyesAt(0.5).y;
      let previous = seated, steepest = 0;
      for (let t = 0.5; t <= 6; t += 1 / 60) {
        const y = terry.eyesAt(t).y;
        steepest = Math.max(steepest, Math.abs(y - previous));
        previous = y;
      }
      assert(steepest < 4, `the eyes never jump (the largest step in a 60th of a second is ${steepest.toFixed(2)})`);
      assert(Math.abs(terry.eyesAt(3.5).y - (seated - lift)) < 0.5, 'standing, they are raised by its lift');
      assert(Math.abs(terry.eyesAt(6).y - seated) < 0.5, 'seated again, they are back where they were');
    });
  });

  test('a friend that never stands ignores a cue to stand, and hops even when added standing', () => {
    withScene({}, scene => {
      const claude = scene.add('claude', { x: 800 });
      claude.stand({ at: 0 });
      assertEqual(claude.stanceAt(5), 'sit');
      assert(!claude.state(0).walk, 'nor does it walk');
    });
    withScene({}, scene => {
      const claude = scene.add('claude', { x: 800, stance: 'stand' });
      claude.moveTo(1100, { at: 0 });
      assert(!claude.state(0.3).walk && claude.state(0.3).lift > 0, 'it hops');
    });
  });

  test('a change of stance cued while another is under way follows it, and one to the stance cued does nothing', () => {
    withScene({}, scene => {
      const terry = scene.add('terry', { x: 600 });
      terry.stand({ at: 0 }).sit({ at: 0.5 });
      assertEqual([terry.stanceAt(0.95), terry.stanceAt(5)], ['stand', 'sit'], 'it stands up, then sits down again');
      assert(Math.abs(terry.eyesAt(5).y - terry.eyesAt(0).y) < 0.5, 'and ends where it sat');
    });
    withScene({}, scene => {
      const terry = scene.add('terry', { x: 600 }), lift = PhyFriends.standLift('terry');
      terry.stand({ at: 0 }).stand({ at: 0.5 });
      const seated = terry.eyesAt(0).y;
      for (let t = 1; t <= 3; t += 0.05) assert(Math.abs(terry.eyesAt(t).y - (seated - lift)) < 3, `standing, it stays up (${t.toFixed(2)} s)`);
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

  test('a feeling shows its face and its mark, and a mark that repeats does so while it is held', () => {
    withScene({}, (scene, el) => {
      const yuda = scene.add('yuda', { x: 800 });
      yuda.feel('surprised', { at: 1 }).feel('asleep', { at: 3, until: 9 });
      scene.seek(1.2);
      assertEqual(yuda.rig.pose.mouth, 'o', 'the surprised mouth');
      const shown = () => [...el.querySelectorAll('.pf-mark')].filter(node => node.style.display !== 'none').map(node => node.textContent);
      assertEqual(shown(), ['!']);
      scene.seek(6);
      assertEqual(yuda.rig.pose.eyes, 'closed', 'asleep');
      assertEqual(shown(), ['z'], 'one z at a time');
      const zAt = t => { scene.seek(t); return shown().includes('z'); };
      assertEqual([2.9, 3.1, 4.5, 5.1, 7.1, 8.5, 9.1].map(zAt), [false, true, false, true, true, false, false], 'a z every 2 s while asleep');
      assertEqual(el.querySelectorAll('.pf-mark').length, 2, 'drawn in one node');
    });
  });

  test('a mark that repeats for as long as a feeling is held is drawn as it comes round, not laid out ahead', () => {
    withScene({}, (scene, el) => {
      const yuda = scene.add('yuda', { x: 800 });
      yuda.feel('asleep', { at: 0, until: Infinity });
      assertEqual(el.querySelectorAll('.pf-mark').length, 1, 'one node, whatever the hold');
      const zAt = t => { scene.seek(t); return [...el.querySelectorAll('.pf-mark')].some(node => node.style.display !== 'none'); };
      assertEqual([3600.5, 3601.5, 10.5, 3602.5].map(zAt), [true, false, true, true], 'an hour on, and back');
    });
  });

  test('a friend that shows no feelings makes their movements without their faces, but smiles when it greets', () => {
    withScene({}, scene => {
      const claude = scene.add('claude', { x: 500 }), phy = scene.add('phy', { x: 1100 });
      claude.greet(phy, { at: 1 }).feel('surprised', { at: 3 });
      scene.seek(1.3);
      assert(claude.rig.pose.eyes === 'happy' && claude.rig.pose.y < 0, 'in the air, smiling');
      scene.seek(3.2);
      assert(claude.rig.pose.mouth !== 'o' && claude.rig.pose.y < 0, 'starts, without the surprised mouth');
    });
  });

  test('strangers who stand too close break the scene', () => {
    withScene({}, scene => {
      scene.add('kevin', { x: 700 });
      assertThrows(() => scene.add('brian', { x: 860 }), /K3V1N and Brian stand -?\d+ head units apart, but strangers keep at least 40/);
    });
  });

  test('strangers who turn keep their distance in the outlines they are drawn in', () => {
    withScene({}, scene => {
      const howdi = scene.add('howdi', { x: 400 }), front = howdi.extent(), back = howdi.extent({ facing: 180 });
      assert(Math.abs(back.right - front.right) > 1, "from behind, Howdi's tail is on his other side");
      // Terry as close as the outlines facing the viewer allow, then both turn their backs.
      const terry = scene.add('terry', { x: 1500 });
      terry.moveTo(400 + front.right + PhyFriends.cast.gap('howdi', 'terry') + terry.extent().left, { at: 0, duration: 0 });
      const away = PhyFriends.anim.still({ facing: 180 });
      howdi.play(away, { at: 1, fade: 0 });
      terry.play(away, { at: 1, fade: 0 });
      scene.check({ to: 0.9 });
      const error = assertThrows(() => scene.check({ to: 1.5 }), /Howdi and Terry stand -?\d+ head units apart/);
      assertEqual(error.code, PhyFriends.cast.BROKEN, "a broken rule carries the cast's code");
    });
  });

  test("a broken rule carries the cast's code, and a mistake does not", () => {
    withScene({}, scene => {
      const yuda = scene.add('yuda', { x: 400 }), terry = scene.add('terry', { x: 1100 });
      const broken = [
        assertThrows(() => yuda.say('hello'), /no voice/),
        assertThrows(() => yuda.say('!', { to: terry }), /may not talk to/),
        assertThrows(() => scene.add('brian', { x: 1000 }), /stand -?\d+ head units apart/),
      ];
      assertEqual(broken.map(error => error.code), [1, 2, 3].map(() => PhyFriends.cast.BROKEN));
      assertEqual(assertThrows(() => scene.add('nobody'), /not in the cast/).code, undefined);
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
    withScene({}, (scene, el) => {
      const yuda = scene.add('yuda', { x: 400 }), terry = scene.add('terry', { x: 1100 });
      assertThrows(() => yuda.say('hello'), /Yuda has no voice/);
      assertThrows(() => yuda.emote('hello'), /is not a mark/);
      yuda.emote('♪');
      yuda.say('heart', { at: 1 });
      const said = [...el.querySelectorAll('.pf-words')].at(-1);
      assert(said.dataset.mark === 'heart' && said.querySelector('svg') && !said.textContent.includes('heart'), 'a mark said is drawn, not the word');
      assertThrows(() => yuda.say('!', { to: terry }), /Yuda may not talk to Terry/);
      assertThrows(() => yuda.give(scene.prop({ w: 10, h: 10, svg: '' }), terry), /Yuda may not hand something to Terry/);
    });
  });

  // The weight and the color of a node's hand, once it is shown.
  const handOf = node => { const style = getComputedStyle(node); return [style.fontWeight, style.color]; };
  const INK = 'rgb(61, 60, 57)', INK_2 = 'rgb(109, 106, 99)';

  test("a film made for one owner lets that owner's fwiend say and write words, as its marks are, and no other fwiend", () => {
    withScene({ madeFor: 'yuda' }, (scene, el) => {
      const yuda = scene.add('yuda', { x: 400 }), terry = scene.add('terry', { x: 1100 });
      assertEqual(scene.madeFor, 'yuda');
      yuda.say('happy birthday', { at: 0 });
      const words = scene.write('found you', { by: yuda, at: 0, tone: 'ink' });
      scene.write('found you too', { by: 'yuda', at: 0 });
      assertThrows(() => terry.say('hello'), /Terry has no voice/);
      assertThrows(() => scene.write('hello', { by: terry }), /Terry has no voice/);
      scene.seek(1);
      assertEqual(handOf(el.querySelector('.pf-words')), ['600', INK_2], 'said in the hand pressed harder');
      assertEqual(handOf(words.node), ['600', INK_2], 'and written so, whatever tone is asked for');
    });
    const el = document.createElement('div');
    assertThrows(() => S.create(el, { madeFor: 'nobody' }), /"nobody" is not in the cast/);
    assertEqual(el.childElementCount, 0, 'a scene refused leaves no stage behind');
  });

  test('writing by a fwiend checks its words as said, and a fwiend other than the host writes as its marks are', () => {
    withScene({}, scene => {
      const phy = scene.add('phy', { x: 400 }), yuda = scene.add('yuda', { x: 1100 });
      assertThrows(() => scene.write('hello', { by: yuda }), /Yuda has no voice/);
      assertThrows(() => scene.write('hello', { by: 'nobody' }), /"nobody" is not in the cast/);
      const host = scene.write('hello', { by: phy, at: 0 }), plain = scene.write('hello', { at: 0 });
      const mark = scene.write('!?', { by: yuda, at: 0 }), heart = scene.write('heart', { by: 'yuda', at: 0 });
      assertThrows(() => mark.set({ text: 'hello' }), /Yuda has no voice/, 'words set later are checked too');
      scene.seek(1);
      assertEqual([handOf(host.node), handOf(plain.node)], [['300', INK], ['300', INK]], "the host's writing is unchanged");
      assertEqual(handOf(mark.node), ['600', INK_2], 'a fwiend writes in the hand pressed harder, in ink-2');
      assert(heart.node.querySelector('svg') && !heart.node.textContent.includes('heart'), 'a mark written is drawn, as said');
    });
  });

  test('a writing set to another mark is drawn as that mark, and words set by the host are written', () => {
    withScene({}, scene => {
      const phy = scene.add('phy', { x: 400 }), yuda = scene.add('yuda', { x: 1100 });
      const note = scene.write('!', { by: yuda, at: 0 });
      note.set({ text: 'heart' });
      assert(note.node.dataset.mark === 'heart' && note.node.querySelector('svg') && !note.node.textContent.includes('heart'), 'a heart, not the word');
      note.set({ text: '?' });
      assertEqual([note.node.dataset.mark, note.node.textContent], ['?', '?'], 'a written mark');
      assertThrows(() => note.set({ text: 'hello' }), /Yuda has no voice/, 'still no words');
      const line = scene.write('♪', { by: phy, at: 0 });
      assert(line.node.querySelector('svg'), "the host's ♪ is drawn");
      line.set({ text: 'hello' });
      assertEqual([line.node.dataset.mark, line.node.textContent], [undefined, 'hello'], 'and its words written');
    });
  });

  test('moves cued out of time order make the frames of the same moves cued in order', () => {
    const film = order => withScene({}, (scene, el) => {
      const phy = scene.add('phy', { x: 300 }), yuda = scene.add('yuda', { x: 1300 });
      const cues = [
        () => yuda.stand({ at: 0.5 }), () => phy.moveTo(100, { at: 1 }), () => yuda.moveTo(1100, { at: 2 }),
        () => phy.leap({ at: 3 }), () => phy.moveTo(500, { at: 5 }), () => yuda.exit({ at: 6 }),
      ];
      for (const i of order) cues[i]();
      return [0, 1.5, 2.5, 3.2, 4.99, 5.05, 5.5, 7, 12].map(t => `${snapshot(scene.seek(t).el)}|${phy.state(t).x}|${yuda.visibleAt(t)}`);
    });
    const inOrder = film([0, 1, 2, 3, 4, 5]);
    assertEqual(film([5, 4, 3, 2, 1, 0]), inOrder, 'backward');
    assertEqual(film([4, 2, 5, 0, 3, 1]), inOrder, 'shuffled');
  });

  test('a move cut short by a later one stays cut short when a third begins', () => {
    withScene({}, scene => {
      const phy = scene.add('phy', { x: 300 });
      phy.moveTo(1300, { at: 0, duration: 10 }).moveTo(700, { at: 2, duration: 1 }).moveTo(500, { at: 5, duration: 1 });
      assertEqual([phy.state(4).x, phy.state(7).x], [700, 500]);
    });
  });

  test('a live scene forgets the cues that have ended, and draws on as it would have', async () => {
    const el = document.createElement('div');
    Object.assign(el.style, { position: 'fixed', left: '0', top: '0', width: '800px', opacity: '0' });
    document.body.appendChild(el);
    const scene = S.create(el, { width: 1600, height: 900, strict: true });
    try {
      const yuda = scene.add('yuda', { x: 500 });
      yuda.stand({ at: 0.5 }).moveTo(700, { at: 1 }).exit({ at: 4 }).enter({ from: 'right', to: 600, at: 6 });
      const cake = scene.prop('cake', { x: 1200 }).moveTo({ x: 1300 }, { at: 1, duration: 1, arc: 30 }).state('lit', true, { at: 2 });
      const note = scene.write('hello', { at: 0, until: 3 });
      const now = () => [cake.at(20), yuda.state(20).x, yuda.stanceAt(20), yuda.visibleAt(20)];
      const before = now();
      scene.seek(20).play();
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      scene.pause();
      assert(!note.node.isConnected, 'the writing that ended is gone');
      assertEqual(now(), before, 'the rest is as it was');
      assert([...cake.node.querySelectorAll('[data-pf-show="lit"]')].every(g => g.getAttribute('display') === null), 'the cake is still lit');
    } finally {
      scene.destroy();
      el.remove();
    }
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
      scene.add('kevin', { x: 1100 });
      assert(!stamp.hidden, 'K3V1N makes it a draft');
    });
  });

  test('a filmable scene lists the friends whose owners have not agreed to video', () => {
    withScene({}, scene => {
      scene.add('phy', { x: 400 });
      scene.add('mumuyou', { x: 1100 });
      assertEqual(scene.film({ duration: 2 }), false);
      assertEqual(window.film.duration, 2);
      assertEqual(window.film.unagreed, ['mumuyou']);
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
      scene.add('kevin', { x: 1100 });
      assertEqual(window.film.unagreed, ['kevin']);
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
