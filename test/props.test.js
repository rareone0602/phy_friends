// Tests for film/props.js and the shared props in props/: every spec keeps to the format, a drawing depends only on its
// spec, its state and its colors, and a scene places a prop by name and switches its states on cue.
(function () {
  'use strict';
  const PF = PhyFriends, P = PF.props;
  const SHARED = ['cake', 'candle', 'partyHat', 'balloon', 'gift', 'medal', 'pencil', 'gramophone'];
  const CYAN = PF.get('yuda').palette.scarf;  // Yuda's bandana.
  const CANDLE = {
    palette: { wax: '#a9bcd4', flame: '#f7d98c' },
    box: { w: 16, h: 48 },
    parts: [
      { fill: 'wax', nodes: [[-3, -25, 1], [3, -25, 1], [3, 0, 1], [-3, 0, 1]], round: 0.3 },
      { show: 'lit', fill: 'flame', cx: 0, cy: -33, rx: 4, ry: 5 },
      { hide: 'lit', stroke: true, tone: 'ink-2', nodes: [[0, -25], [1, -31]] },
    ],
  };

  // The colors a drawing fills its shapes with, in order.
  const fillsOf = drawing => [...drawing.svg.matchAll(/fill="(#[0-9a-f]+)"/gi)].map(match => match[1]);
  // The display of each group that a state shows (or, with 'hide', hides), in order: null where it is drawn.
  const groupsOf = (drawing, which = 'show') =>
    [...drawing.svg.matchAll(new RegExp(`<g data-pf-${which}="\\w+"( display="none")?>`, 'g'))].map(match => (match[1] ? 'none' : null));

  test('every shared prop is defined and keeps to the format', () => {
    assertEqual(SHARED.filter(name => !P.list().includes(name)), [], 'shared props that are not defined');
    for (const name of P.list()) P.check(P.get(name));
  });

  test('check names what is wrong with a spec', () => {
    P.check(CANDLE);
    const [wax, flame, smoke] = CANDLE.parts, only = part => ({ ...CANDLE, parts: [part] });
    assertThrows(() => P.check({ ...CANDLE, box: undefined }), 'it has no box');
    assertThrows(() => P.check(only({ ...wax, fill: '#a9bcd4' })), 'parts[0].fill names no color of the palette');
    assertThrows(() => P.check(only({ fill: 'wax' })), 'needs exactly one shape');
    assertThrows(() => P.check(only({ ...flame, shwo: 'lit' })), 'parts[0].shwo is not a key of a part');
    assertThrows(() => P.check(only({ ...smoke, fill: 'wax' })), 'never filled');
    assertThrows(() => P.check(only({ ...smoke, width: 3 })), 'an ink mark is 1.1 to 1.5px wide');
    assertThrows(() => P.check(only({ ...smoke, tone: 'red' })), 'is not an ink');
    assertThrows(() => P.define('broken', { ...CANDLE, palette: { wax: 'blue' } }), 'phy_friends/props: broken: palette.wax is not a color');
    assert(!P.list().includes('broken'), 'a spec that fails is not defined');
  });

  test('a drawing depends only on its spec, its state and its colors', () => {
    for (const name of P.list()) {
      for (const state of [[], ...P.states(name).map(s => [s])]) {
        assertEqual(P.drawing(name, { state }).svg, P.drawing(name, { state }).svg, `${name} in ${state.join(' ') || 'no state'}`);
      }
    }
  });

  test('a part that a state shows is hidden until it is on, and one that it hides is drawn until then', () => {
    assertEqual(P.states('cake'), ['lit']);
    assertEqual(groupsOf(P.drawing('cake')), ['none', 'none', 'none'], "the cake's flames, out");
    assertEqual(groupsOf(P.drawing('cake', { state: ['lit'] })), [null, null, null], "the cake's flames, lit");
    assertEqual([groupsOf(P.drawing(CANDLE), 'hide'), groupsOf(P.drawing(CANDLE, { state: 'lit' }), 'hide')], [[null], ['none']]);
    assertThrows(() => P.drawing('cake', { state: ['lti'] }), 'cake has no state "lti" (its states are lit)');
  });

  test('a color overridden when drawn recolors its parts, and its shade follows', () => {
    const { paper } = P.get('gift').palette, plain = fillsOf(P.drawing('gift')), cyan = fillsOf(P.drawing('gift', { palette: { paper: CYAN } }));
    assert(plain.includes(paper) && plain.includes(PF.shadeOf(paper)), "the gift's lid is in its paper and its box in the paper's shade");
    assertEqual(cyan, plain.map(c => (c === paper ? CYAN : c === PF.shadeOf(paper) ? PF.shadeOf(CYAN) : c)));
    assert(fillsOf(P.drawing('partyHat', { palette: { paper: CYAN } })).includes(CYAN), 'the party hat takes the color too');
    assertThrows(() => P.drawing('partyHat', { palette: { papr: CYAN } }), 'partyHat has no color "papr" to override');
    // A shade set by hand holds for the spec's own color only.
    const handShaded = { palette: { wax: '#a9bcd4', waxShade: '#8a9cb8' }, box: { w: 10, h: 10 }, parts: [{ fill: 'waxShade', rx: 4 }] };
    assertEqual([fillsOf(P.drawing(handShaded)), fillsOf(P.drawing(handShaded, { palette: { wax: CYAN } }))], [['#8a9cb8'], [PF.shadeOf(CYAN)]]);
  });

  test('a prop drawn larger grows in proportion, and its ink marks keep their width', () => {
    const one = P.drawing('candle'), two = P.drawing('candle', { scale: 2 });
    assertEqual([two.w, two.h], [one.w * 2, one.h * 2]);
    assert(/stroke-width="1\.4"[^>]*vector-effect="non-scaling-stroke"/.test(two.svg), 'the wick is 1.4px at any size');
  });

  test('every shared prop stands on its ground and keeps inside its box', () => {
    for (const name of P.list()) {
      const { w, h } = P.get(name).box;
      for (const state of [[], ...P.states(name).map(s => [s])]) {
        const d = P.drawing(name, { state }), holder = document.createElement('div');
        holder.innerHTML = PF.pencil.svg(d.svg, { w: d.w, h: d.h, flat: true });
        document.body.appendChild(holder);
        const box = holder.querySelector('svg > g').getBBox();  // In head units, about the prop's origin.
        holder.remove();
        const where = `${name}${state.length ? ` (${state})` : ''}`;
        assert(Math.abs(box.y + box.height) <= 1, `${where} stands ${(-(box.y + box.height)).toFixed(1)} head units off its ground`);
        assert(box.x >= -w / 2 - 0.5 && box.x + box.width <= w / 2 + 0.5 && box.y >= -h - 0.5, `${where} reaches out of its box`);
      }
    }
  });

  function withScene(fn) {
    const el = document.createElement('div');
    Object.assign(el.style, { position: 'fixed', left: '0', top: '0', width: '800px', opacity: '0' });
    document.body.appendChild(el);
    const scene = PF.scene.create(el, { width: 1600, height: 900, strict: true });
    try {
      return fn(scene);
    } finally {
      scene.destroy();
      el.remove();
    }
  }
  const flamesOf = item => [...item.node.querySelectorAll('[data-pf-show="lit"]')].map(g => g.getAttribute('display'));

  test('a scene places a prop by name, in a state and a color, and places a drawing as it did', () => {
    withScene(scene => {
      const cake = scene.prop('cake', { state: ['lit'], x: 600 });
      const hat = scene.prop('partyHat', { palette: { paper: CYAN }, scale: 1.5, x: 900 });
      const candle = scene.prop(P.drawing('candle', { state: ['lit'] }), { x: 1000 });
      const drawing = scene.prop({ w: 40, h: 40, svg: '<circle cx="20" cy="20" r="18" fill="#e9a"/>' }, { x: 300 });
      scene.seek(1);
      assertEqual(flamesOf(cake), [null, null, null], 'the cake is lit');
      assertEqual(flamesOf(candle), [null], 'a drawing keeps the state it was drawn in');
      assert(hat.node.innerHTML.includes(CYAN) && hat.node.style.width === `${P.get('partyHat').box.w * 1.5}px`, 'the hat in cyan, half as large again');
      assert(drawing.node.querySelector('circle') && drawing.node.style.width === '40px' && drawing.node.style.display === '', 'the drawing is placed');
      assertThrows(() => scene.prop('trumpet'), 'there is no prop "trumpet"');
    });
  });

  test("a prop's state cued at a time switches then, and seeking back undoes it", () => {
    withScene(scene => {
      const cake = scene.prop('cake', { x: 800 });
      cake.state('lit', true, { at: 12.5 }).state('lit', false, { at: 14 });
      const litAt = t => {
        scene.seek(t);
        return flamesOf(cake).every(display => display === null);
      };
      assertEqual([litAt(12.4), litAt(12.5), litAt(13.9), litAt(14), litAt(13)], [false, true, true, false, true]);
      scene.seek(20);
      cake.state('lit');  // At the scene's time.
      assertEqual([litAt(19.9), litAt(20)], [false, true]);
      assertThrows(() => cake.state('lti', true, { at: 1 }), 'this prop has no state "lti"');
    });
  });

  test('a prop drawn in shows none of itself before its time, then more of itself until it is whole', () => {
    withScene(scene => {
      const cake = scene.prop('cake', { x: 800 }).reveal({ at: 2, seconds: 4 });
      const clipAt = t => { scene.seek(t); return cake.node.style.clipPath; };
      assertEqual([clipAt(1), clipAt(4), clipAt(6)], ['inset(100% -50% -50%)', 'inset(50% -50% -50%)', ''], 'from the bottom up');
      cake.reveal({ at: 2, seconds: 4, from: 'left' });
      assertEqual(clipAt(3), 'inset(-50% 75% -50% -50%)', 'from the left');
      assertThrows(() => cake.reveal({ from: 'top' }), 'not "top"');
    });
  });

  test('a prop rubbed out goes from the side it is rubbed from, and then none of it shows', () => {
    withScene(scene => {
      const cake = scene.prop('cake', { x: 800 }).erase({ at: 2, seconds: 4 });
      const clipAt = t => { scene.seek(t); return cake.node.style.clipPath; };
      const shownAt = t => { scene.seek(t); return cake.node.style.display !== 'none'; };
      assertEqual([clipAt(1), clipAt(3), clipAt(5)], ['', 'inset(-50% -50% 25%)', 'inset(-50% -50% 75%)'], 'from the bottom up');
      assertEqual([shownAt(5.9), shownAt(6), shownAt(60)], [true, false, false], 'gone once it is rubbed out');
      cake.erase({ at: 2, seconds: 4, from: 'left' });
      assertEqual(clipAt(3), 'inset(-50% -50% -50% 25%)', 'from the left');
      assertThrows(() => cake.erase({ from: 'top' }), 'not "top"');
    });
  });

  test('a prop drawn in and rubbed out shows only what is drawn and not yet rubbed out', () => {
    withScene(scene => {
      const cake = scene.prop('cake', { x: 800 }).reveal({ at: 0, seconds: 4 }).erase({ at: 2, seconds: 4 });
      scene.seek(3);
      assertEqual(cake.node.style.clipPath, 'inset(25% -50%)', 'three quarters drawn in, a quarter rubbed out');
      assertThrows(() => cake.erase({ at: -1 }), 'only after it starts to be drawn in');
      assertThrows(() => scene.prop('candle').erase({ at: 1 }).reveal({ at: 2 }), 'only after it starts to be drawn in');
    });
  });

  test('a prop colored in shows the same drawing in other colors coming in over it, as much of it as amount says', () => {
    withScene(scene => {
      const gift = scene.prop('gift', { x: 800 }), paper = P.get('gift').palette.paper;
      gift.recolor({ paper: CYAN }, { at: 2, seconds: 4, amount: 0.5 });
      const layers = () => [...gift.node.querySelectorAll(':scope > svg')];
      const [own, colored] = layers();
      assert(colored.innerHTML.includes(CYAN) && !colored.innerHTML.includes(paper) && own.innerHTML.includes(paper), 'the same drawing, in cyan');
      const clipsAt = t => { scene.seek(t); return layers().map(svg => (svg.style.display === 'none' ? 'hidden' : svg.style.clipPath)); };
      assertEqual(clipsAt(1), ['', 'hidden'], 'none of it colored before its time');
      assertEqual(clipsAt(4), ['inset(-50% -50% 25%)', 'inset(75% -50% -50%)'], 'a quarter colored, from the bottom');
      assertEqual(clipsAt(9), ['inset(-50% -50% 50%)', 'inset(50% -50% -50%)'], 'and never more than half');
      gift.recolor({ paper: CYAN }, { at: 10, seconds: 2 });
      assertEqual(clipsAt(11), ['inset(-50% -50% 50%)', 'hidden', 'inset(50% -50% -50%)'], 'colored in again, over the first');
      assertEqual(clipsAt(12), ['hidden', 'hidden', ''], 'all of it');
      gift.erase({ at: 20, seconds: 1 });
      scene.seek(21);
      assertEqual(gift.node.style.display, 'none', 'rubbed out, colors and all');
      assertThrows(() => gift.recolor({ paper: CYAN }, { from: 'left' }), 'colored in from the bottom');
      assertThrows(() => gift.recolor({ papr: CYAN }), 'gift has no color "papr"');
      assertThrows(() => gift.recolor({ paper: CYAN }, { amount: 2 }), 'not 2');
      assertThrows(() => scene.prop(P.drawing('gift')).recolor({ paper: CYAN }), 'only a prop placed by name or by spec');
    });
  });

  test("a prop colored in keeps the drawing's states, switched on cue", () => {
    withScene(scene => {
      const cake = scene.prop('cake', { x: 800 }).recolor({ cream: CYAN }, { at: 0, seconds: 0 }).state('lit', true, { at: 1 });
      scene.seek(2);
      assertEqual(flamesOf(cake), [null, null, null, null, null, null], 'the candles of both are lit');
    });
  });
})();
