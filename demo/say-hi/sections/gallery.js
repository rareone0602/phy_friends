/*!
 * say hi, the gallery (page B): the friends in their two rows, every time the film comes back to them.
 *
 *   12-16  the gallery's title, "phy's fwiends", writes itself with the gallery's own pen as page B
 *          comes in, and as the pen reaches "fwiends" the roll call begins: the friends land in their
 *          places a beat apart, in the gallery's order, each with its name written under it and its
 *          owner's handle under that until the next lands; bar 13 under the title, then closer, the
 *          camera sliding on after each landing; Claude lands last, on the sixteenth beat, and gets
 *          its laptop out; one place stays empty.
 *   17     the camera pulls back to the page whole; a pencilled pointer comes down from above, every
 *          head following it; over phy it becomes a pointing hand, as a browser's does over a link,
 *          and clicks; phy hops.
 *   18-20  phy looks down at the line they sit on, which turns out to be type; the camera cuts in to
 *          the line, where it reads as line 139 of phy.js; it cuts back, and phy writes "lo" and begins
 *          a g before the crash (21.1).
 *   29-30  dusk: the paper settles to the evening's tone and the friends doze off one by one, as the
 *          gallery's do, while a poem writes itself in three lines above the rows and one along the
 *          rule under them, its last word, "you?", under the empty place. phy stays up; Claude types on.
 *   37-40  dawn: the night is rubbed off the page from left to right, uncovering the title; each friend
 *          wakes with a start as it passes, and stretches; "you?" stays. Close on four friends, phy asks
 *          for a rice ball, and once the number is typed every body but Claude's narrows at once, on a
 *          still camera, which cuts to the page whole on 41.1.
 *   45.1   every friend of the house hops and shows a song as the tests pass.
 *   52-68  phy's words in the band under the rows, then Claude's number beside them, then the shape:
 *          the friends stand up, raise a paw, dance on the beat (Terry and Brian seen close for a
 *          while) and turn round in quarter turns, faster and faster, the camera cutting from group to
 *          group before each turn.
 *   73-75  everyone leaps as the gallery comes back, without its title, and keeps the track's groove with
 *          small hops; the pointer settles on the empty place and becomes the hand; everyone looks at it;
 *          phy writes "say hi."; on the loudest bar the camera punches in, everyone leaps a hi to it,
 *          Claude folds its laptop away and turns to it, and the hand opens into a raised palm and waves
 *          back.
 *
 * Everything is a function of t: scene cues for the friends, drawers for the words, marks, pointer and
 * paper. This module owns the rice ball's curve (the era's taper) and the typing window of Claude at
 * its laptop (SayHi.layout.B.typing). Words follow the film's rules (components.js): phy's lines and
 * Claude's numbers at the speech size and held, in the band under the rows when the page is whole; no
 * frame's edge falls across a friend's face.
 */
SayHi.section('gallery', k => {
  'use strict';
  const PF = PhyFriends, A = PF.anim, E = PF.emotion, B = k.beats, at = k.at;
  const page = k.page('B'), L = SayHi.layout.B;
  const { places, slots, empty, floors, world, title: TITLE, band: BAND, wide: WIDE } = L;
  const RULE = k.RULE, BEAT = B.BEAT, BAR = B.BAR, SIXTEENTH = B.SIXTEENTH, FRAME = k.FRAME;
  const HOST = 'phy', CLAUDE = L.claude;
  const ORDER = slots.filter(slot => slot.name).map(slot => slot.name);    // The gallery's order.
  const HOUSE = ORDER.filter(name => name !== CLAUDE);                      // Every friend drawn on the house template.
  const WHOLE = L.whole;                                                     // The title and the rows, as every module frames them (pages.js).
  const NAME_RULE = floors.map(floor => floor + RULE);                     // The rule under each row, where names go.
  const BASELINE = 0.85;      // A line box of 1em puts the face's baseline this far below its top (components.js).
  const DESCENDER = 0.26;     // How far the hand's descenders reach below its baseline, as a share of its size.
  // How far a friend's face reaches either side of its place, in head units: no frame's edge may fall
  // within it. How high the tallest ears reach above a floor, seated and standing.
  const FACE = 110, EARS = { sit: 5.5 * RULE, stand: 6 * RULE };
  // The library's taper today, which the rice ball eases to: read from the source, since by the time a
  // module is built the era may already have set the live constant to the film's opening value.
  const TAPER = Number(SayHi.source.onigiri.text.match(/taper: ([\d.]+)/)[1]);
  const DAY = { paper: '#fbf9f3', rule: '#cfdbe8', grain: 1 };              // site/notebook.css.
  const NIGHT = { paper: '#e3ddd0', rule: '#bfc9d3', grain: 1.3 };         // The stubs' night, unless the method gives one.
  const INK = '#3d3c39';

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const progress = (t, a, b, ease = A.ease.smooth) => ease(clamp((t - a) / (b - a), 0, 1));
  const rgb = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const mixColor = (c0, c1, u) => `#${rgb(c0).map((v, i) => Math.round(lerp(v, rgb(c1)[i], u)).toString(16).padStart(2, '0')).join('')}`;
  const escapeHtml = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const slotOf = name => slots.find(slot => slot.name === name);
  const night = () => ({ ...NIGHT, ...((SayHi.exports.method || {}).night || {}) });
  // The font size, in head units, whose cap height is `px` frame pixels when a head unit is `scale`.
  const capped = (px, scale, face = 'hand') => (1.01 * px) / k.ui.capOf(face) / scale;
  // Midway between two friends' places, where a frame's edge clears both faces.
  const between = (a, b) => (places[a].x + places[b].x) / 2;
  // Whether page B fills the frame at t, rather than being shown smaller, in the finale's window: words
  // are measured against the rule of speech only then.
  const fullFrame = t => k.ui.scaleAt(page.under, t) >= page.fit * page.cameraAt(t).zoom - 1e-6;

  // The camera whose frame runs from `left` to `right` (head units), centered by the film's rule on the
  // block from `top` to `bottom`, or with its bottom edge on `edge` (to keep a row below out of sight),
  // or its top edge on `topEdge`.
  function across(left, right, { top, bottom, edge, topEdge }) {
    const scale = FRAME.width / (right - left), zoom = scale / page.fit, x = (left + right) / 2, half = FRAME.height / 2 / scale;
    if (edge !== undefined) return { x, y: edge - half, zoom };
    if (topEdge !== undefined) return { x, y: topEdge + half, zoom };
    return k.frame('B', { top, bottom, x, zoom });
  }

  // ------------------------------------------------------------ measuring

  // The width of a line of words at a size, in the layer's units: the hand's face or the code's.
  const widths = new Map();
  function measure(text, size, font = 'hand') {
    const key = `${font}|${size}|${text}`;
    if (!widths.has(key)) {
      const p = document.createElement('p');
      p.className = font === 'mono' ? 'sh-label mono' : 'sh-hand hand';
      Object.assign(p.style, { fontSize: `${size}px`, visibility: 'hidden' });
      p.textContent = text;
      page.under.appendChild(p);
      widths.set(key, p.offsetWidth);
      p.remove();
    }
    return widths.get(key);
  }

  // Where each letter of an element's text ends, from its left edge, in the element's own units.
  function letterRights(p) {
    const node = p.firstChild, range = document.createRange(), transform = p.style.transform;
    p.style.transform = 'none';
    const box = p.getBoundingClientRect(), scale = box.width / (p.offsetWidth || 1) || 1;
    const rights = [];
    for (let i = 1; i <= node.length; i++) {
      range.setStart(node, 0);
      range.setEnd(node, i);
      rights.push((range.getBoundingClientRect().right - box.left) / scale);
    }
    p.style.transform = transform;
    return rights;
  }

  // ------------------------------------------------------------ words

  // Words on one of page B's layers, drawn from t alone, their baseline from (x, y), in the hand or
  // in the code's face (font). They are written from left to right over `write` ([from, to], seconds),
  // or letter by letter (letters: [[from, to], ...], a letter left half written if the time runs out),
  // rubbed out over `erase` ([from, to]) or from the left as far as rubbed(t) (a world x), at
  // opacity(t). fit: the widest the line may be (a wider one is set smaller). caret: { from } puts the
  // typist's pill caret after the last letter written, blinking on a beat and off a beat from `from`.
  // kind: the rule of speech's kind to check its size against once it is whole and until it is rubbed
  // out ('label', 'hand'), or null for words found on a pause. Returns { size, width, left, shown(t) }: shown is how much of
  // the line is written at t, in head units from its left end.
  function words(layer, text, o) {
    const opt = { x: 0, y: 0, size: 54, font: 'hand', tone: 'ink', align: 'left', rotate: -1, graphite: true, kind: null,
      write: null, letters: null, erase: null, rubbed: null, opacity: null, fit: Infinity, caret: null, from: 0, until: Infinity, ...o };
    k.ensureShowable(text, 'words');
    const size = Math.min(opt.size, (opt.size * opt.fit) / measure(text, opt.size, opt.font));
    const width = measure(text, size, opt.font);
    const left = opt.align === 'center' ? opt.x - width / 2 : opt.align === 'right' ? opt.x - width : opt.x;
    const fontClass = opt.font === 'mono' ? 'sh-label mono' : 'sh-hand hand';
    const markup = `<p class="${fontClass}${opt.tone === 'ink-2' ? ' ink-2' : ''}${opt.graphite ? ' graphite' : ''}" style="font-size:${size}px">${escapeHtml(text)}</p>`;
    // The letters' right ends, measured once as the module is built, so that shown(t) is pure.
    let rights = null;
    if (opt.letters) {
      const probe = document.createElement('div');
      probe.innerHTML = markup;
      page.under.appendChild(probe);
      rights = letterRights(probe.firstChild);
      probe.remove();
    }
    const shown = t => {
      if (opt.letters) return lettersShown(t);
      if (opt.write) return width * progress(t, opt.write[0], opt.write[1], A.ease.linear);
      return width;
    };
    const whole = opt.letters ? opt.letters[opt.letters.length - 1][1] : opt.write ? opt.write[1] : k.time(opt.from);
    k.draw(layer, opt.from, opt.until, (el, t) => {
      if (!el.firstChild) {
        el.innerHTML = markup + (opt.caret ? `<p class="sh-label mono" style="font-size:${size}px;color:transparent"><span class="sh-caret pill"></span></p>` : '');
      }
      const p = el.firstChild, written = shown(t);
      p.style.transform = `translate(${left}px, ${opt.y}px) rotate(${opt.rotate}deg) translateY(-${BASELINE}em)`;
      const from = opt.rubbed ? clamp(opt.rubbed(t) - left, 0, width) : 0;
      p.style.clipPath = `inset(-40% ${Math.max(0, width - written)}px -40% ${from > 0 ? from : -0.12 * size}px)`;
      const fade = opt.erase ? 1 - progress(t, opt.erase[0], opt.erase[1]) : 1;
      const opacity = fade * (typeof opt.opacity === 'function' ? opt.opacity(t) : opt.opacity ?? 1);
      el.style.opacity = String(opacity);
      el.style.visibility = opacity > 0.001 && written > 0 && from < width ? '' : 'hidden';
      if (opt.caret) {
        const c = el.lastChild, on = t < opt.caret.from || Math.floor((t - opt.caret.from) / BEAT + 1e-9) % 2 === 0;
        c.style.transform = `translate(${left + written + 0.12 * size}px, ${opt.y}px) rotate(${opt.rotate}deg) translateY(-${BASELINE}em)`;
        c.firstChild.style.display = on ? '' : 'none';
      }
      if (opt.kind && t >= whole && fade >= 1 && opacity > 0.5 && fullFrame(t)) k.ui.legible(p, opt.kind, t, text, { size, face: opt.font === 'mono' ? 'mono' : 'hand' });
    });
    // How far the letters are written at t, from their timings: whole letters, and the one being written in
    // part.
    function lettersShown(t) {
      let x = 0;
      for (let i = 0; i < opt.letters.length && i < rights.length; i++) {
        const [a, b] = opt.letters[i], start = i ? rights[i - 1] : 0;
        if (t < a) break;
        x = start + (rights[i] - start) * A.ease.smooth(clamp((t - a) / (b - a), 0, 1));
        if (t < b) break;
      }
      return x;
    }
    return { size, width, left, shown };
  }

  // phy's line in the band under the rows (pages.js, layout.B.band): from the band's left on the rule
  // of the band's `line`, at the rule of speech's size under the camera when it is written.
  function phySays(text, cue, { line = 0, seconds, until, hold = true, x = BAND.left } = {}) {
    return k.ui.hand(page.over, text, { x, y: BAND.lines[line], at: cue, seconds, until, hold, fadeOut: 2 * SIXTEENTH });
  }

  // A number Claude types in the band, ending at the band's right on the rule of the band's first line,
  // with a pencilled leader from the box to its laptop as it starts.
  const laptop = { x: places[CLAUDE].x + 118, y: floors[1] - 46 };
  function claudeTypes(text, cue, { until, step = SIXTEENTH / 2 } = {}) {
    const typed = k.ui.typed(page.over, text, { x: BAND.right, y: BAND.lines[0], align: 'right', at: cue, step, until, hold: true });
    const middle = typed.left + typed.width / 2;
    k.ui.leader(page.over, { from: { x: middle + 0.41 * typed.width, y: typed.middle - 0.62 * typed.size }, to: laptop,
      at: typed.at, until: typed.until, seconds: 0.2, bend: -0.18, width: 3 });
    return typed;
  }

  // ------------------------------------------------------------ the shots and the camera

  // Page B comes in wiping from the left, so that the title, at its top left, is uncovered first and the
  // lines phy wrote on the right of page A are the last thing covered.
  k.shot('B', '13.1', '21.1', { enter: { kind: 'wipe', from: 'left', seconds: 2 * BEAT, lead: 2 * BEAT } });
  k.shot('B', '29.1', '31.1');
  k.shot('B', '37.1', '41.1');
  k.shot('B', '52.3', '69.1');
  k.shot('B', '73.1', '76.1');

  // A camera cue that takes page B from wherever it was, over `seconds` (0 cuts).
  const move = (to, cue, seconds = 0, ease = 'inOut') => k.camera('B', to, { at: cue, duration: seconds, ease });

  // "you?", the empty place's label, under its middle (pages.js). The wides (pages.js) show the title
  // and the rows as large as the frame's width allows, with the label whole.
  const YOU = empty.label, youSize = YOU.size;
  const youWidth = measure('you?', youSize);

  // A camera move to `to` over `seconds` from `cue` by way of a point a share `split` of the way there
  // whose `side` edge ('top' or 'bottom') lies on `edge` (head units): quick into it and easing out of
  // it, so that the frame's edge crosses a row of faces in a few frames and is otherwise at the ears or
  // clear of the row. The cues before `cue` must be in.
  function routed(to, cue, seconds, { side, edge, split = 0.2 }) {
    const from = page.cameraAt(k.time(cue) - 1e-6), zoom = lerp(from.zoom, to.zoom, split);
    const half = FRAME.height / 2 / (page.fit * zoom);
    const via = { x: lerp(from.x, to.x, split), y: side === 'top' ? edge + half : edge - half, zoom };
    move(via, cue, split * seconds, 'in');
    move(to, k.time(cue) + split * seconds, (1 - split) * seconds, 'out');
  }

  // ------------------------------------------------------------ 12-16: the title and the roll call

  // The roll call: one friend a beat for the four bars 13-16, row 1 over bars 13 and 14, row 2 over 15
  // and the first three beats of 16, and Claude last, on the sixteenth beat, which steps aside, gets
  // its laptop out and sits to type. Each friend falls in from above the frame and lands on its ground
  // line. Its name is written under it, on the rule under its row, and stays while the camera is on
  // the row; its owner's handle stands whole on the next rule from the landing to the next landing, so
  // that only the newest arrival's handle shows, on one line under its own friend, held a beat. Bar 13
  // is still: the title and row 1's first four places, which fill as they land. From 14.1 the camera
  // is closer and follows the arrivals, the newest at `follow.at` of the frame's width and the title out
  // of the picture above; row 2 is called the same way after a carriage return on 15.1, the frame's top
  // edge under row 1's feet. The labels are as large as the rule for labels asks (the names a little
  // larger once the camera is close), and go when the camera leaves their row.
  const ROLL = {
    name: 42, handle: 45,                    // Cap heights, frame pixels: the names at the opening's scale, the handles wherever shown.
    opening: { places: 4, sides: 70, paper: 90 },  // Bar 13: row 1's first four places; least frame pixels at the sides, above and below.
    follow: { from: '14.1', scale: 1.75, at: 0.62, least: 0.35, sides: 70 },  // From 14.1: frame pixels a head unit, where the newest lands.
    slide: [0.1, 0.55],                      // The slide to the next frame, in beats after a landing: when it starts, how long it takes.
    sides: 40,                               // Frame pixels a handle keeps from the frame's sides.
    rows: ['13.1', '15.1'],
    claude: '16.4',
    pullBack: ['17.2', '17.3.5'],            // To the page whole, as Claude gets its laptop out, once its handle has been read.
    gone: ['17.2', '17.3'],                  // Row 2's labels and Claude's are rubbed out in the pull back.
  };
  const rowSlots = row => slots.filter(slot => slot.row === row && slot.name);
  const nameRule = row => floors[row] + RULE, handleRule = row => floors[row] + 2 * RULE;
  const DROP = { fall: 0.28, margin: 30 };  // Seconds a friend falls, and how far above the frame it starts.

  // Every landing: who, when (seconds), which row and its index in the row, and when the next lands.
  const CALLS = [];
  ROLL.rows.forEach((cue, row) => {
    rowSlots(row).filter(slot => slot.name !== CLAUDE).forEach((slot, i) => CALLS.push({ name: slot.name, row, i, land: at(cue) + i * BEAT, slot }));
  });
  if (CLAUDE) {
    const slot = slotOf(CLAUDE);
    CALLS.push({ name: CLAUDE, row: slot.row, i: rowSlots(slot.row).indexOf(slot), land: at(ROLL.claude), slot });
  }
  CALLS.forEach((call, i) => { call.next = i + 1 < CALLS.length ? CALLS[i + 1].land : at(ROLL.gone[0]); });
  const landOf = name => CALLS.find(call => call.name === name).land;

  // The title: the gallery's own, written by the gallery's own pen (src/pen.js, site/title-pen.js), a
  // little quicker than on the real page, so that, as there, the friends start to land as the pen
  // reaches "fwiends" (on 13.1, the roll call's first beat).
  const PEN = (typeof TITLE_PEN !== 'undefined' && PF.pen) ? TITLE_PEN : null;
  const TITLE_PACE = 1.5;
  const titleTimes = PEN ? PF.pen.times(PEN.strokes) : [];
  const titleReach = PEN ? titleTimes[PEN.strokes.findIndex(stroke => stroke.letter >= PEN.text.indexOf(' ') + 1)].at / TITLE_PACE : 0;
  const titleAt = at(ROLL.rows[0]) - titleReach, titleDone = titleAt + (PEN ? PF.pen.duration(PEN.strokes) / TITLE_PACE : 0);
  // How far right the title is written at t, in head units: the right end of the furthest stroke the pen
  // has started (its points are in thousandths of an em from the text's start); without the pen, its end.
  function titleRightAt(t) {
    if (!PEN) return TITLE.x + measure(TITLE.text, TITLE.size);
    const seconds = (t - titleAt) * TITLE_PACE;
    let right = TITLE.x;
    PEN.strokes.forEach((stroke, i) => {
      if (titleTimes[i].at > seconds) return;
      const xs = stroke.d.match(/[ML](-?[\d.]+)/g).map(point => Number(point.slice(1)));
      right = Math.max(right, TITLE.x + (Math.max(...xs) / 1000) * TITLE.size);
    });
    return right;
  }

  // Bar 13's frame: the title and row 1's first places, as large as the frame allows with the paper
  // the opening asks for at the sides, above and below; its scale (frame pixels a head unit).
  const OPENING = (() => {
    const { places: n, sides, paper } = ROLL.opening, first = rowSlots(0).slice(0, n), last = first[n - 1];
    const left = Math.min(TITLE.x, first[0].x - first[0].left), right = Math.max(TITLE.x + measure(TITLE.text, TITLE.size), last.x + last.right);
    const top = TITLE.top, bottom = handleRule(0) + DESCENDER * capped(ROLL.handle, 1);
    const scale = Math.min((FRAME.width - 2 * sides) / (right - left), (FRAME.height - 2 * paper) / (bottom - top));
    return { scale, camera: k.frame('B', { top, bottom, x: (left + right) / 2, zoom: scale / page.fit }) };
  })();

  // From 14.1, the camera on a landing friend, at the follow's scale: its left edge midway between two
  // friends already landed (or the follow's sides left of the row's first), so that it falls between
  // faces, the one that puts the newest nearest `follow.at` of the frame's width but no further left
  // than `follow.least`, and never left of the last landing's; row 1 seen from its tallest ears to its
  // handles, by the film's rule, the title above out of the picture; row 2 with the frame's top edge
  // just under row 1's feet.
  const FOLLOW = ROLL.follow, followZoom = FOLLOW.scale / page.fit, followWidth = FRAME.width / FOLLOW.scale;
  let followLeft = -Infinity;
  function following(call) {
    const row = rowSlots(call.row), first = row[0];
    const edges = [first.x - first.left - FOLLOW.sides / FOLLOW.scale, ...row.slice(0, call.i).map((slot, j) => (slot.x + row[j + 1].x) / 2)];
    const shares = edges.filter(left => left >= followLeft || call.i === 0).map(left => ({ left, at: (call.slot.x - left) / followWidth }));
    const fits = shares.filter(share => share.at >= FOLLOW.least && share.at <= 1 - FOLLOW.least / 2);
    const best = (fits.length ? fits : shares).reduce((a, b) => (Math.abs(b.at - FOLLOW.at) < Math.abs(a.at - FOLLOW.at) ? b : a));
    followLeft = best.left;
    const x = best.left + followWidth / 2;
    const y = call.row === 0
      ? k.frame('B', { top: floors[0] - EARS.sit, bottom: handleRule(0) + DESCENDER * capped(ROLL.handle, FOLLOW.scale), zoom: followZoom }).y
      : floors[0] + 12 + FRAME.height / 2 / FOLLOW.scale;
    return { x, y, zoom: followZoom };
  }
  {
    // Bar 13, at the opening's scale: centered on what is there as each friend lands, the title as far as
    // the pen has written it and the friends landed, so that the paper left bare lies evenly either side;
    // the camera slides on after each landing as it does from 14.1, and rests on the opening's frame,
    // the title whole and the four landed, by the last of them.
    const opening = CALLS.filter(call => call.land < at(FOLLOW.from) - 1e-6), first = rowSlots(0)[0];
    const left = Math.min(TITLE.x, first.x - first.left), [after, slide] = ROLL.slide.map(beats => beats * BEAT);
    const centered = call => ({ ...OPENING.camera,
      x: Math.min(OPENING.camera.x, (left + Math.max(call.slot.x + call.slot.right, titleRightAt(call.land))) / 2) });
    move(centered(opening[0]), 0);
    opening.slice(1).forEach((call, i) => move(centered(call), opening[i].land + after, slide, 'inOut'));
    const followed = CALLS.filter(call => call.land >= at(FOLLOW.from) - 1e-6);
    followed.forEach((call, i) => {
      // A cut where the row starts (or the camera starts to follow); otherwise a slide just after the last
      // landing, like a carriage after a letter, so that every frame held for a landing has its edges
      // between faces and each friend lands where the last did.
      const before = followed[i - 1], [after, slide] = ROLL.slide.map(beats => beats * BEAT);
      call.cut = !before || before.row !== call.row;
      if (call.cut) move(following(call), call.land);
      else move(following(call), before.land + after, slide, 'inOut');
    });
    // Back to the page whole, the frame's top edge clearing row 1's faces quickly.
    routed(WHOLE, at(ROLL.pullBack[0]), at(ROLL.pullBack[1]) - at(ROLL.pullBack[0]), { side: 'top', edge: floors[0] - EARS.sit - 30 });
  }

  // The title's drawer: the pen writes it from titleAt; it is not on the night's page (29.1-37.1), the
  // dawn uncovers it as the night is rubbed off from the left (sweepX, below), and it is not in the
  // last shot (from 73.1), whose leaps would reach it and whose band names the place instead.
  k.draw(page.under, titleAt, Infinity, (el, t) => {
    if (!el.firstChild) {
      el.innerHTML = `<p class="sh-hand hand graphite" style="font-size:${TITLE.size}px">${escapeHtml(TITLE.text)}</p>`;
      const p = el.firstChild;
      p.style.transform = `translate(${TITLE.x}px, ${TITLE.y}px) rotate(-1deg) translateY(-${BASELINE}em)`;
      const writing = PEN ? PF.pen.write(p, PEN, { color: 'var(--ink)' }) : null;
      el.writing = writing;
      if (writing) p.style.color = 'transparent';
    }
    const p = el.firstChild, away = (t >= at('29.1') && t < at('37.1')) || t >= at('73.1'), width = measure(TITLE.text, TITLE.size);
    const covered = t >= SWEEP.from && t < SWEEP.from + SWEEP.seconds ? clamp(TITLE.x + width - sweepX(t), 0, width) : 0;
    if (el.writing) {
      el.writing.at(Math.max(0, (t - titleAt) * TITLE_PACE));
      p.style.clipPath = covered > 0 ? `inset(-60% ${covered}px -60% -12%)` : '';
    } else {
      const unwritten = (1 - progress(t, titleAt, titleDone, A.ease.linear)) * width;
      p.style.clipPath = `inset(-60% ${Math.max(unwritten, covered)}px -60% -12%)`;
    }
    el.style.visibility = away ? 'hidden' : '';
  });

  // The labels. A name is written under its friend as it lands, at one size in head units (the label
  // size at the opening's scale), narrowed only where a neighbor's name would come too close; Claude's
  // is typed. A handle stands whole from the landing until the next friend lands, at the label size
  // under the camera then, under its friend but kept inside the frame while it shows.
  const fontOf = call => (call.name === CLAUDE ? 'mono' : 'hand');
  const nameSize = { hand: capped(ROLL.name, OPENING.scale), mono: capped(ROLL.name, OPENING.scale, 'mono') };
  const nameOf = call => PF.cast.friend(call.name).name;
  function nameRoom(call) {
    const width = other => measure(nameOf(other), nameSize[fontOf(other)], fontOf(other));
    const near = CALLS.filter(other => other.row === call.row && Math.abs(other.i - call.i) === 1);
    return 2 * Math.min(Infinity, ...near.map(other => Math.abs(other.slot.x - call.slot.x) - 30 - width(other) / 2));
  }
  // Where a handle's middle goes: under its friend, moved in as far as it must to keep ROLL.sides
  // frame pixels from either side of the frame from its landing to the next.
  function handleX(call, width) {
    let lo = -Infinity, hi = Infinity;
    for (const t of [call.land, Math.min(call.next, at(ROLL.pullBack[0])) - 1e-3]) {
      const cam = page.cameraAt(t), scale = page.fit * cam.zoom, half = FRAME.width / 2 / scale, keep = ROLL.sides / scale;
      lo = Math.max(lo, cam.x - half + keep + width / 2);
      hi = Math.min(hi, cam.x + half - keep - width / 2);
    }
    return lo <= hi ? clamp(call.slot.x, lo, hi) : (lo + hi) / 2;
  }
  for (const call of CALLS) {
    const { slot, row, land } = call, friend = PF.cast.friend(call.name), font = fontOf(call);
    const gone = row === 0 ? [at(ROLL.rows[1]) - 1e-3, at(ROLL.rows[1])] : ROLL.gone.map(cue => at(cue));
    const handleSize = capped(ROLL.handle, page.fit * page.cameraAt(land).zoom, font);
    const handle = friend.credit.handle, x = handleX(call, measure(handle, handleSize, font));
    if (call.name === CLAUDE) {
      // Typed, a character a 64th, the name and the handle together from the landing, as the others'
      // are written together; held until the pull back rubs them out.
      const step = SIXTEENTH / 4, handleAt = land + step;
      words(page.under, friend.name, { x: slot.x, y: nameRule(row), size: nameSize.mono, font: 'mono', align: 'center', rotate: 0, graphite: false, kind: 'label',
        letters: [...friend.name].map((_, j) => [land + j * step, land + j * step + 0.01]), fit: nameRoom(call),
        caret: { from: handleAt + (handle.length + 2) * step }, from: land, erase: gone, until: gone[1] + 0.05 });
      words(page.under, handle, { x, y: handleRule(row), size: handleSize, font: 'mono', tone: 'ink-2', align: 'center', rotate: 0,
        graphite: false, kind: 'label', letters: [...handle].map((_, j) => [handleAt + j * step, handleAt + j * step + 0.01]),
        from: handleAt, erase: gone, until: gone[1] + 0.05 });
      continue;
    }
    words(page.under, friend.name, { x: slot.x, y: nameRule(row), size: nameSize.hand, align: 'center', fit: nameRoom(call), kind: 'label',
      write: [land + 0.02, land + 0.26], from: land, erase: gone, until: gone[1] + 0.05 });
    words(page.under, handle, { x, y: handleRule(row), size: handleSize, tone: 'ink-2', align: 'center', kind: 'label',
      from: land, until: Math.min(call.next, gone[1]) });
  }

  // Claude, landed, steps aside, swings its laptop up and sets it down open, and hops round to sit at it,
  // as its routine has it (characters/claude/claude.js); from then the page's typing loop takes over
  // (pages.js), until it folds the laptop away at 75.1.
  // Routine seconds: from the step aside to the typing, and the fold; `after` is the wait after landing.
  const ROUTINE = { arrive: [0.39, L.typing.loop[0]], fold: 3.03, after: 0.22 };
  const claudeSits = landOf(CLAUDE) + ROUTINE.after + ROUTINE.arrive[1] - ROUTINE.arrive[0];
  L.typing.from = claudeSits;
  L.typing.until = at('75.1');

  // The fall is the second half of a leap in place (the scene's own, which lifts the whole cut-out, so
  // that its pencil goes with it), shown from the top: the friend comes into sight falling, gathering
  // speed, and lands with the leap's crouch. Over it, its ears and tail stream up as it falls and flop
  // as it lands, and it gives a little.
  function landingClip(f) {
    return A.track({
      squash: [[0, 0.03], [f, 0.04], [f + 0.06, -0.06, 'out'], [f + 0.16, 0.02], [f + 0.3, 0]],
      earL: [[0, -10], [f, -12], [f + 0.08, 15, 'out'], [f + 0.22, -4], [f + 0.42, 0]],
      earR: [[0, -10], [f, -12], [f + 0.1, 14, 'out'], [f + 0.24, -4], [f + 0.44, 0]],
      tail: [[0, -6], [f, -8], [f + 0.1, 9, 'out'], [f + 0.26, -3], [f + 0.46, 0]],
      hair: [[0, -2], [f, -3], [f + 0.08, 3, 'out'], [f + 0.3, 0]],
      headY: [[0, 0], [f, 0], [f + 0.07, 3, 'out'], [f + 0.26, 0]],
    });
  }

  // How far above its floor a friend must start to start above the frame as it is when it lands.
  function dropHeight(call) {
    const cam = page.cameraAt(call.land);
    const top = cam.y - FRAME.height / 2 / (page.fit * cam.zoom);
    return Math.max(4 * RULE, call.slot.y - top + DROP.margin);
  }

  // The roll call: each friend falls in on its beat with a smile; Claude, last, steps aside to its laptop.
  function rollCallCues(cast) {
    for (const call of CALLS) {
      const actor = cast[call.name];
      if (!actor) continue;
      // A leap lands (1 - crouch) of the way through and is at its top half way, so a leap of
      // fall / (0.5 - crouch) seconds falls from its top for `fall`.
      const fall = DROP.fall, crouch = A.HOP.crouch, leap = fall / (0.5 - crouch), x = places[call.name].x;
      // A friend that lands on a cut comes in with it, so that its fall shows in no other shot.
      actor.enter({ from: x, to: x, at: call.cut ? call.land : call.land - fall, duration: 1e-3, hops: 1, height: 0 });
      actor.leap({ at: call.land - (1 - crouch) * leap, height: dropHeight(call), duration: leap });
      actor.play(landingClip(fall), { at: call.land - fall, fade: 0 });
      if (call.name !== CLAUDE) actor.pose(E.smile(actor.spec), { at: call.land, until: call.land + 0.8, fade: 0.12 });
    }
    const claude = cast[CLAUDE];
    if (claude) {
      const routine = A.track(claude.spec.routine.keys, { duration: claude.spec.routine.duration }), [a, b] = ROUTINE.arrive;
      claude.play(A.clip(t => routine(a + t), b - a), { at: landOf(CLAUDE) + ROUTINE.after, until: claudeSits, fade: 0 });
    }
  }

  // ------------------------------------------------------------ the pointer and the hand

  // The pencilled arrow, its tip at the origin, 56 units tall (as components.js draws it); the
  // pencilled pointing hand, its fingertip at the origin: the index finger up, three fingers curled
  // beside it and the thumb out, the wrist at WRIST; and the open hand, raised, palm out, the tip of
  // its middle finger at the origin, four fingers up and the thumb out, its wrist at PALM_WRIST.
  const ARROW = 'M0 0L0 46L12 35L21 56L30 52L21 32L37 31Z';
  const HAND = 'M-5.5 5C-5.5-1.5 5.5-1.5 5.5 5L5.5 23C5.5 18.5 13.5 18.5 13.5 23C13.5 19.5 21 19.5 21 24.5C21 21 28 21.5 28 26.5' +
    'L28 39C28 49 22 54 13 54L6 54C-1 54-5.5 50-5.5 44L-5.5 41C-9 38.5-13 35-15.5 31C-17.5 27.5-13.5 25-11 28C-9 30.5-7.5 32.5-5.5 33Z';
  const KNUCKLES = 'M5.5 24.5L5.5 31M13.5 24.5L13.5 30.5M21 26L21 31';
  const WRIST = { x: 11, y: 54 };
  const finger = (x0, x1, top, bottom) => { const r = (x1 - x0) / 2; return `M${x0} ${bottom}L${x0} ${top + r}A${r} ${r} 0 0 1 ${x1} ${top + r}L${x1} ${bottom}Z`; };
  const PALM_FINGERS = [finger(-17, -9, 2, 34), finger(-8, 0, -2, 34), finger(1, 9, 1, 34), finger(10, 17, 8, 36),
    'M-14 46L-28 30C-31 27-27 22-24 25L-11 37Z'].join('');
  const PALM = 'M-18 30L18 30L18 44C18 54 11 60 1 60L-6 60C-14 60-18 54-18 46Z';
  const PALM_WRIST = { x: -1, y: 60 };

  // A pointer on page B: path [[cue, { x, y }], ...] (world points, each leg eased, with a slight arc);
  // shape(t): 'arrow', 'hand' or 'palm'; clicks [cue]; waves [cue] (the hand tips twice about its
  // wrist, a beat a time). Returns a gaze target for the friends.
  function pointer({ path, shape, clicks = [], waves = [], from, until, size = 140 }) {
    const keys = path.map(([cue, p]) => ({ t: k.time(cue), ...p })), pressAt = clicks.map(k.time), waveAt = waves.map(k.time);
    const tipAt = t => {
      if (t <= keys[0].t) return { x: keys[0].x, y: keys[0].y };
      for (let i = 1; i < keys.length; i++) {
        if (t >= keys[i].t) continue;
        const a = keys[i - 1], b = keys[i], u = A.ease.inOut((t - a.t) / (b.t - a.t));
        const lift = Math.sin(Math.PI * u) * Math.min(90, Math.hypot(b.x - a.x, b.y - a.y) * 0.07);
        return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) - lift };
      }
      return { x: keys[keys.length - 1].x, y: keys[keys.length - 1].y };
    };
    const scale = size / 56;
    k.draw(page.over, from, until, (el, t) => {
      if (!el.firstChild) {
        el.innerHTML = '<svg class="sh-gal-pointer" width="1" height="1" style="position:absolute;left:0;top:0;overflow:visible">' +
          `<circle class="ring" r="16" fill="none" stroke="${INK}" stroke-opacity=".6" stroke-width="2.2"/>` +
          `<g class="shape" filter="url(#graphite)" stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">` +
          `<path class="arrow" d="${ARROW}" fill="var(--sh-paper, var(--paper))"/>` +
          `<g class="hand"><path d="${HAND}" fill="var(--sh-paper, var(--paper))"/><path d="${KNUCKLES}" fill="none" stroke-width="2.2"/></g>` +
          `<g class="palm"><path d="${PALM_FINGERS}" fill="var(--sh-paper, var(--paper))"/><path d="${PALM}" fill="var(--sh-paper, var(--paper))"/></g></g></svg>`;
      }
      const svg = el.firstChild, tip = tipAt(t), drawn = shape(t);
      const press = pressAt.reduce((m, c) => (t >= c && t < c + 0.4 ? Math.max(m, 1 - (t - c) / 0.4) : m), 0);
      const squeeze = 1 - 0.12 * Math.sin(Math.PI * Math.min(1, press * 1.4));
      const wave = waveAt.reduce((m, w) => (t >= w && t < w + 2 * BEAT ? 12 * Math.sin((2 * Math.PI * (t - w)) / BEAT) : m), 0);
      for (const name of ['arrow', 'hand', 'palm']) svg.querySelector(`.${name}`).style.display = drawn === name ? '' : 'none';
      const wrist = drawn === 'palm' ? PALM_WRIST : WRIST;
      const turn = drawn === 'arrow' ? 'rotate(-8)' : `translate(${wrist.x} ${wrist.y}) rotate(${wave - (drawn === 'palm' ? 6 : 3)}) translate(${-wrist.x} ${-wrist.y})`;
      svg.querySelector('.shape').setAttribute('transform', `translate(${tip.x} ${tip.y}) scale(${scale * squeeze}) ${turn}`);
      const ring = svg.querySelector('.ring');
      ring.setAttribute('cx', String(tip.x));
      ring.setAttribute('cy', String(tip.y));
      ring.setAttribute('r', String(14 + 40 * (1 - press)));
      ring.style.opacity = press > 0 ? String(press) : '0';
    });
    return { at: tipAt, target: { at: tipAt } };
  }

  // 17.1-18.2.5: down from above the frame as the camera pulls back, drifting to phy's middle (below
  // the face, so that the hand hides neither the face nor the hop), a click on the stab of the fourth
  // beat, and away up to the right as the camera goes in.
  const phyPlace = places[HOST];
  const POINTER_ONE = { from: at('17.1'), hand: at('17.3.5'), click: at('17.4'), leave: at('18.1'), gone: at('18.2.5') };
  const phyMiddle = { x: phyPlace.x + 12, y: phyPlace.y - 62 };
  const pointerOne = pointer({
    path: [[POINTER_ONE.from, { x: phyPlace.x + 420, y: WHOLE.y - 640 }], [POINTER_ONE.click - 0.1, phyMiddle], [POINTER_ONE.leave, phyMiddle],
      [POINTER_ONE.gone, { x: phyPlace.x + 900, y: WHOLE.y - 700 }]],
    shape: t => (t >= POINTER_ONE.hand && t < POINTER_ONE.leave + 0.1 ? 'hand' : 'arrow'), clicks: [POINTER_ONE.click],
    from: POINTER_ONE.from, until: POINTER_ONE.gone,
  });

  // ------------------------------------------------------------ 18-21: the line phy sits on

  // The ground under phy is a pencilled line, like every other, until phy looks down at it (18.1): then
  // it shows itself as line 139 of phy.js, set in type so small that from afar it still reads as a
  // line; the camera goes in until it reads as type. After the crash the page is the gallery again,
  // and the ground a line.
  const groundLine = SayHi.source.phy.lines.find(line => /^\s*rig:\s*\{\s*ground:/.test(line.text));
  const GROUND = { text: groundLine.text.trim(), n: groundLine.n, size: 13, cap: 0.73, opacity: 0.8, shows: [at('18.1'), at('18.2')], gone: at('21.1') };
  {
    const index = slots.findIndex(slot => slot.name === HOST), drawn = page.under.querySelectorAll('.sh-grounds path')[index];
    if (drawn) drawn.style.display = 'none';
  }
  const groundWidth = measure(GROUND.text, GROUND.size, 'mono');
  const groundLeft = phyPlace.x - groundWidth / 2, groundBaseline = phyPlace.y + GROUND.cap * GROUND.size + 1.5;
  k.draw(page.under, 0, Infinity, (el, t) => {
    if (!el.firstChild) {
      const slot = slotOf(HOST), random = PF.rng(139), wobble = () => (random() - 0.5) * 1.6;
      const stroke = (x0, x1) => {
        const n = Math.max(1, Math.round((x1 - x0) / 50)), points = [];
        for (let i = 0; i <= n; i++) points.push({ x: x0 + (i * (x1 - x0)) / n, y: phyPlace.y + wobble() });
        return `<path d="${PF.shapes.pathD(points, false)}"/>`;
      };
      el.innerHTML = '<svg width="1" height="1" style="position:absolute;left:0;top:0;overflow:visible;color:var(--ink);filter:url(#graphite)">' +
        `<g fill="none" stroke="currentColor" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round">${stroke(slot.x - slot.left - 12, groundLeft - 7)}` +
        `<g class="plain">${stroke(groundLeft - 7, groundLeft + groundWidth + 7)}</g>${stroke(groundLeft + groundWidth + 7, slot.x + slot.right + 12)}</g></svg>` +
        `<p class="sh-label mono graphite" style="font-size:${GROUND.size}px">${escapeHtml(GROUND.text)}</p>` +
        `<p class="sh-label mono" style="font-size:${GROUND.size}px;color:var(--ink-3)">${GROUND.n}</p>`;
      el.children[1].style.transform = `translate(${groundLeft}px, ${groundBaseline}px) translateY(-${BASELINE}em)`;
      el.children[2].style.transform = `translate(${groundLeft - 2.2 * GROUND.size}px, ${groundBaseline}px) translate(-100%, -${BASELINE}em)`;
    }
    const type = t < GROUND.gone ? progress(t, GROUND.shows[0], GROUND.shows[1]) : 0;
    el.querySelector('.plain').style.opacity = String(1 - type);
    el.children[1].style.opacity = String(GROUND.opacity * type);
    // The line's number shows as it would in the file, while the camera is close.
    el.children[2].style.opacity = String(progress(t, at('19.2'), at('19.3')) * (1 - progress(t, at('20.1'), at('20.2'))));
  });

  // The camera: in to phy between their neighbors as phy looks down; on the third beat a cut in to the
  // line itself, pushing slowly on over the bright bar; on the downbeat of bar 20 a cut back to phy,
  // who writes. Close on phy, the frame's edges fall between faces and its bottom edge above row 2's
  // ears. The line seen close runs from under phy's face to above row 2's ears, so that no edge meets
  // a face: a frame holding phy's whole head and the line would take the neighbors' faces across its
  // sides, and a push between the two would sweep its edges across phy's face for half a bar.
  const PHY_WRITES = across(between('howdi', 'yuanyuan'), between('fruit', 'yuda'), { edge: floors[1] - EARS.sit - 6 });
  const CHIN = 70;     // How far above its floor a seated friend's face ends, looking down, less a margin.
  const LINE = { top: floors[0] - CHIN, bottom: floors[1] - EARS.sit - 6, push: 1.06 };
  const lineNumberLeft = groundLeft - 2.2 * GROUND.size - measure(String(GROUND.n), GROUND.size, 'mono');
  const CLOSE = { x: (lineNumberLeft + groundLeft + groundWidth) / 2, y: (LINE.top + LINE.bottom) / 2,
    zoom: FRAME.height / (LINE.bottom - LINE.top) / page.fit };
  routed(PHY_WRITES, at('18.1'), BEAT, { side: 'bottom', edge: floors[1] - EARS.sit + 40 });
  move(CLOSE, at('18.3'));
  move({ ...CLOSE, zoom: CLOSE.zoom * LINE.push }, at('18.3'), at('20.1') - at('18.3'), 'linear');
  move(PHY_WRITES, at('20.1'));

  // phy writes "lo" and starts a g, at the rule of speech's size: the l on the third beat of bar 20,
  // the o on the fourth, and the g on its "and"; the crash takes the page on the downbeat, half way
  // through the g. The rest of the word is never written.
  const LO = { text: 'login', x: phyPlace.x + 110, y: phyPlace.y - 6 * RULE, at: at('20.3'), cut: at('21.1'), rotate: -1, font: 'hand' };
  LO.size = k.ui.sizeFor('hand', page.over, LO.at);
  LO.letters = [[LO.at, LO.at + 0.2], [at('20.4'), at('20.4') + 0.2], [at('20.4.5'), at('20.4.5') + 2 * (LO.cut - at('20.4.5'))], [Infinity, Infinity], [Infinity, Infinity]];
  const lo = words(page.over, LO.text, { x: LO.x, y: LO.y, size: LO.size, rotate: LO.rotate, from: LO.at, until: LO.cut, letters: LO.letters, kind: 'hand' });
  LO.shown = lo.shown;

  // ------------------------------------------------------------ 29-30: dusk

  const DUSK = { from: '29.1', settle: BAR, to: '37.1' };
  k.paper('B', DUSK.from, DUSK.to, t => {
    const u = progress(t, at(DUSK.from), at(DUSK.from) + DUSK.settle), n = night();
    return { paper: mixColor(DAY.paper, n.paper, u), rule: mixColor(DAY.rule, n.rule, u), grain: lerp(DAY.grain, n.grain, u) };
  });

  // The doze: the gallery's own schedule (src/live.js), its seconds scaled so that the friends grow
  // sleepy one by one over bar 29 and each falls asleep three beats later. phy stays up.
  const SLEEPERS = HOUSE.filter(name => name !== HOST);
  const DOZE = PF.live.DOZE, dozeScale = BAR / DOZE.spread;
  const DOZING = PF.live.dozeSchedule(SLEEPERS.length, at('29.1'), { spread: DOZE.spread * dozeScale, asleep: DOZE.asleep * dozeScale, jitter: DOZE.jitter * dozeScale });

  // The poem: its first line in three lines above the rows, where the title stands by day, and its
  // second along the rule under row 2 that holds the empty place's label, its last word under the empty
  // place, where it stays. In graphite, dark on the evening's paper, and large enough to read on a
  // phone: the lines above the rows at a typed number's cap height; the line under the rows as large as
  // it can be with its ascenders clear of the ground lines above it.
  const POEM = {
    lines: ['Stranger, if you passing meet me', 'and desire to speak to me,', 'why should you not speak to me?'],
    second: 'And why should I not speak to ', last: 'you?', cap: 56, faint: 0.57,
    // Off the title's rule (nine over row 1's floor), so that at dawn, where the title is uncovered and the
    // poem is not yet rubbed out, the two meet as two lines; the last clear of the sleepers' z's.
    rules: [floors[0] - 16 * RULE, floors[0] - 13 * RULE, floors[0] - 10 * RULE],
    writes: [['29.1.5', '29.3'], ['29.3', '29.4.5'], ['29.4.5', '30.2']],
    clear: 14,                                // Head units the line under the rows keeps from the ground lines.
    ascender: 0.76,                           // Shantell Sans's ascenders, as a share of its size (measured in Chrome).
  };
  const poemSize = capped(POEM.cap, page.fit), poemLeft = WHOLE.x - Math.max(...POEM.lines.map(line => measure(line, poemSize))) / 2;
  const secondSize = Math.min(poemSize, (YOU.y - floors[1] - POEM.clear) / POEM.ascender);
  const DUSK_FRAME = k.frame('B', { top: POEM.rules[0] - k.ui.capOf('hand') * poemSize, bottom: YOU.y + DESCENDER * youSize, x: WHOLE.x, zoom: 1 });
  const DUSK_END = { ...DUSK_FRAME, zoom: 1.03 };
  move(DUSK_FRAME, at('29.1'));
  move(DUSK_END, at('29.1'), 2 * BAR, 'inOut');

  // ------------------------------------------------------------ 37: dawn

  // The night is rubbed off the page from left to right over three beats, with a ragged edge, and the
  // friends wake as it passes over them, with a start, and stretch.
  const SWEEP = { from: at('37.1'), seconds: 3 * BEAT, x0: -140, x1: world.width + 140, ragged: 26 };
  const sweepX = t => lerp(SWEEP.x0, SWEEP.x1, clamp((t - SWEEP.from) / SWEEP.seconds, 0, 1));
  const sweptAt = x => SWEEP.from + (SWEEP.seconds * (x - SWEEP.x0)) / (SWEEP.x1 - SWEEP.x0);
  const rubbed = t => (t < SWEEP.from ? -Infinity : sweepX(t));

  POEM.lines.forEach((line, i) => {
    const [from, to] = POEM.writes[i];
    words(page.under, line, { x: poemLeft, y: POEM.rules[i], size: poemSize, rotate: -0.6, kind: 'label',
      write: [at(from), at(to)], rubbed, from, until: SWEEP.from + SWEEP.seconds });
  });
  const youLeft = empty.x - youWidth / 2 - 0.2 * secondSize;
  words(page.under, POEM.second, { x: youLeft, y: YOU.y, size: secondSize, align: 'right', rotate: 0, kind: 'label',
    write: [at('30.2'), at('30.3.5')], rubbed, from: '30.2', until: SWEEP.from + SWEEP.seconds });
  // "you?" is written last, as the second line reaches it, and is never rubbed out: from dawn it stays
  // as the empty place's label, fainter (POEM.faint: as light as the second ink was), and darkens when
  // the hand comes to rest over it.
  const handRests = at('73.3.75');
  words(page.under, POEM.last, { x: empty.x, y: YOU.y, size: youSize, align: 'center', rotate: 0, kind: 'label',
    write: [at('30.3.5'), at('30.4')], from: '30.3.5', until: at('77.1') + 1,
    opacity: t => (t < sweptAt(empty.x) ? 1
      : lerp(lerp(1, POEM.faint, progress(t, sweptAt(empty.x), sweptAt(empty.x) + BEAT)), 1, progress(t, handRests, handRests + 0.3))) });

  // The night still left on the page, right of the rubbed-out edge: a flat tone, multiplied over the
  // paper as the evening's was, so that the rules darken with it.
  k.draw(page.under, SWEEP.from, SWEEP.from + SWEEP.seconds, (el, t) => {
    if (!el.firstChild) {
      el.innerHTML = '<svg width="1" height="1" style="position:absolute;left:0;top:0;overflow:visible;mix-blend-mode:multiply"><path/></svg>';
    }
    const n = night(), tone = `#${rgb(n.paper).map((v, i) => Math.round(Math.min(255, (255 * v) / rgb(DAY.paper)[i])).toString(16).padStart(2, '0')).join('')}`;
    const x = sweepX(t), random = PF.rng(37), top = -world.height, bottom = 2 * world.height, step = 34, points = [];
    for (let y = top; y <= bottom; y += step) points.push(`${x + (random() - 0.5) * 2 * SWEEP.ragged} ${y}`);
    const path = el.firstChild.firstChild;
    path.setAttribute('d', `M${points.join('L')}L${3 * world.width} ${bottom}L${3 * world.width} ${top}Z`);
    path.setAttribute('fill', tone);
  });
  move(DUSK_END, at('37.1'));      // Page B as the night left it, so that the poem is rubbed out whole.
  const WAKING = Object.fromEntries(SLEEPERS.map(name => [name, sweptAt(places[name].x)]));
  const STRETCH = A.speed(A.make.stretch(), 2.4 / (4 * BEAT));

  // Dusk and dawn: each sleeper grows sleepy and falls asleep on the schedule, wakes with a start as the
  // night is rubbed off it, and stretches.
  function nightCues(cast) {
    SLEEPERS.forEach((name, i) => {
      const actor = cast[name], { sleepyAt, asleepAt } = DOZING[i], wake = WAKING[name];
      if (!actor) return;
      actor.feel('sleepy', { at: sleepyAt, until: asleepAt });
      actor.feel('asleep', { at: asleepAt, until: wake });
      actor.feel('surprised', { at: wake });
      actor.play(STRETCH, { at: wake + 0.32 });
    });
    // phy stays up, and looks down at their paws as the evening comes on.
    const phy = cast[HOST];
    if (phy) phy.look({ x: phyPlace.x - 20, y: phyPlace.y + 10 }, { at: at('30.2') }).look('viewer', { at: at('37.1') });
  }

  // ------------------------------------------------------------ 38-40: the rice ball

  // Close on four friends of row 1 (Yuda, Terry, Brian, BarDell: Terry's plain body shows the change
  // best), the frame's edges clear of every face and its bottom edge above row 2's ears; the camera
  // settles on the downbeat of bar 38 and stays still through the change, so that before and after can
  // be compared. phy asks for the rice ball there, above them, at the size of speech, and the line
  // holds until the shot cuts on 41.1, so that the paper above the four is never bare.
  const RICE_FRAME = across(between('fruit', 'yuda'), places.bardell.x + FACE + 30, { edge: floors[1] - EARS.sit - 6 });
  routed(RICE_FRAME, at('37.3'), 2 * BEAT, { side: 'bottom', edge: floors[1] - EARS.sit + 40 });
  const riceLeft = RICE_FRAME.x - FRAME.width / 2 / (RICE_FRAME.zoom * page.fit);
  k.ui.hand(page.over, 'like a rice ball.', { x: riceLeft + 90 / (RICE_FRAME.zoom * page.fit), y: floors[0] - 7 * RULE, at: '38.1', seconds: 0.8, until: '41.1', hold: true });
  // The close-up holds past the change and cuts to the page whole on the downbeat of bar 41, where the
  // tests start (a pull back would cross row 2's faces).
  move(WHOLE, at('41.1'));

  // The bodies narrow at the top into rice balls, all at once, over two beats, a little past and back.
  const RICE = { from: at('39.1'), seconds: 2 * BEAT };
  k.era.curve('taper', t => (t < RICE.from ? 0 : TAPER * A.ease.back(clamp((t - RICE.from) / RICE.seconds, 0, 1))));

  // The rice ball: phy looks to Claude as they ask, and back at you as the number is typed.
  function riceCues(cast) {
    const phy = cast[HOST], claude = cast[CLAUDE];
    if (phy && claude) phy.look(claude, { at: at('38.1') }).look('viewer', { at: at('38.4') });
  }

  // ------------------------------------------------------------ 45.1: the tests pass

  const SONG = { at: at('45.1'), height: 46, seconds: 0.42 };
  // On the downbeat every friend of the house hops, its feet leaving the floor on the beat, and shows a song.
  function songCues(cast) {
    for (const name of HOUSE) {
      const actor = cast[name];
      if (!actor) continue;
      actor.feel('content', { at: SONG.at });
      actor.leap({ at: SONG.at - A.HOP.crouch * SONG.seconds, height: SONG.height, duration: SONG.seconds });
    }
  }

  // ------------------------------------------------------------ 52-60: stand, wave, dance

  // The page whole with two lines in the band: phy's words, then Claude's number, then the rise, on a
  // still camera. Then the page whole for the raised paws; the band again for the number that starts
  // the dance, a close view of the dance, and the band for the words and number that start the turns.
  move(WIDE.band[1], at('52.3'));
  // Broken after "and", so that the first line ends well short of Claude's number on its rule.
  const stand = phySays('stand and', '52.3', { seconds: 0.45, until: '54.3', hold: false });
  phySays('unfold yourselves.', stand.end + 0.1, { line: 1, seconds: 0.85, until: '54.3', hold: false });
  claudeTypes('rise: 1', '53.1', { until: '54.3' });
  // The library's standUp, a second long, slowed to a bar and held at its end: rise 1. The friends are
  // upright on the downbeat of bar 54.
  const RISE = { at: at('53.2'), clip: A.speed(A.make.standUp(), 1 / BAR) };

  // The page whole, for the raised paws.
  move(WHOLE, at('54.3'), 2 * BEAT, 'inOut');

  // The raised paw (55.1): the paw away from the tail raised beside the cheek and held still for a
  // beat in unison, then waved four times, a half beat each, the head and body rocking with it so that
  // the wave reads at the size of the whole page; lowered on the next downbeat. (A friend's arms are
  // short: a raised paw reaches its cheek, not above its head.)
  function raisedPaw(spec) {
    const side = PF.freeSide(spec), d = side === 'L' ? -1 : 1, rise = 0.16, hold = BEAT, rock = BEAT / 2, rocks = 4, fall = 0.3;
    const duration = rise + hold + rocks * rock + fall;
    return A.clip(t => {
      const up = t < rise ? A.ease.back(t / rise) : t > duration - fall ? 1 - A.ease.smooth((t - duration + fall) / fall) : 1;
      const rocking = t > rise + hold ? Math.sin((2 * Math.PI * (t - rise - hold)) / rock) : 0;
      return {
        [`arm${side}`]: 84 * up, [`elbow${side}`]: up * (52 + 40 * rocking),
        tilt: up * d * (6 + 4 * rocking), lean: -2.5 * d * up, earL: -6 * up + 4 * rocking, earR: -6 * up - 4 * rocking,
        tail: up * 8 * rocking, hair: -2 * d * up,
      };
    }, duration);
  }

  // Pencilled wave marks beside each waving paw, as a comic draws a waving hand: two short arcs up and
  // out from the paw's side of the head (tipped up by `tip` degrees), swinging with each wave, so that
  // the wave reads at the size of the page whole. They are small enough that two neighbors waving on
  // their facing sides leave a gap between their marks, which then read as two waves, not one exchange.
  const WAVE = { from: at('55.1') + 0.16 + BEAT, waves: 4, every: BEAT / 2, head: 196, out: 96, radii: [20, 36], swing: 12, tip: 30 };
  const arc = r => {
    const a = (40 * Math.PI) / 180;
    return `M${(r * Math.cos(-a)).toFixed(1)} ${(r * Math.sin(-a)).toFixed(1)}A${r} ${r} 0 0 1 ${(r * Math.cos(a)).toFixed(1)} ${(r * Math.sin(a)).toFixed(1)}`;
  };
  k.draw(page.over, WAVE.from, WAVE.from + WAVE.waves * WAVE.every, (el, t) => {
    if (!el.firstChild) {
      const marks = HOUSE.map(name => {
        const d = PF.freeSide(PF.get(name)) === 'L' ? -1 : 1, { x, y } = places[name];
        return `<g data-side="${d}" transform="translate(${x + d * WAVE.out} ${y - WAVE.head}) scale(${d} 1) rotate(${-WAVE.tip})"><g class="swing">${WAVE.radii.map(r => `<path d="${arc(r)}"/>`).join('')}</g></g>`;
      });
      el.innerHTML = `<svg width="1" height="1" style="position:absolute;left:0;top:0;overflow:visible;filter:url(#graphite)" fill="none" stroke="${INK}" ` +
        `stroke-width="6" stroke-linecap="round">${marks.join('')}</svg>`;
    }
    const phase = (t - WAVE.from) / WAVE.every, swing = WAVE.swing * Math.sin(2 * Math.PI * phase);
    for (const g of el.querySelectorAll('.swing')) g.setAttribute('transform', `rotate(${swing.toFixed(2)})`);
    el.style.opacity = String(Math.min(1, phase * 4, (WAVE.waves - phase) * 4));
  });

  move(WIDE.band[0], at('56.1'), 2 * BEAT, 'inOut');
  claudeTypes("play('dance')", '56.3', { until: '57.4' });
  // The dance seen close, from the accent on 57.4, once the number has gone, back to the page whole on
  // 59.1: Terry and Brian side by side, as large as the frame allows. Row 1's friends stand so close that,
  // as they all lean together, one's ears sweep where its neighbor's face was a moment before, so no still
  // frame holds three of them with every face out of its sides and their own ears clear of them (phy's
  // ear met the left side in draft 3, and room for it took YuanYuan's face across the edge). These two's
  // sides fall where, over the dance's sway, Yuda's and BarDell's faces never reach and these two's heads
  // never do (measured, in head units from the neighbors' places: Yuda's head reaches 161 to his right,
  // and Terry's 151 to his left; Brian's head 179 to his right, and BarDell's face 133 to his left), and
  // their ears, which reach 352 above the floor at the top of the sway, keep paper above them.
  const DANCE_CLOSE = at('57.4'), DANCE_WHOLE = at('59.1');
  const DANCE_PAIR = { left: places.yuda.x + 165, right: places.bardell.x - 143, ears: 352 };
  // The library's dance is four beats at 120 a minute; here it is four beats at 130.
  const DANCE = { from: at('57.1'), to: at('60.3'), clip: A.make.dance({ duration: BAR }) };

  // Every friend of the house rises on the beat and stays up, raises a paw and waves at 55, and dances.
  function standCues(cast) {
    for (const name of HOUSE) {
      const actor = cast[name];
      if (!actor) continue;
      actor.play(RISE.clip, { at: RISE.at, until: Infinity, fade: 0 });
      actor.play(raisedPaw(actor.spec), { at: at('55.1'), fade: 0 });
      actor.play(DANCE.clip, { at: DANCE.from, until: DANCE.to, fade: 0.3 });
    }
  }

  // ------------------------------------------------------------ 60-68: the turns

  move(WIDE.band[0], at('59.4'), 2 * BEAT, 'inOut');
  phySays('turn round.', '60.2', { seconds: 0.5 });
  claudeTypes('facing: 90', '60.3', { step: BEAT / 11 });

  // Sixteen quarter turns, four full turns, each landing on its beat with a hop: one a bar (61-64), one
  // a half bar (65-66), one a beat (67-68). The friend turns as it lands, a frame before the beat, so
  // that the new side shows on the beat (turned at the top of the hop, it showed four frames early).
  const TURNS = [
    ...[61, 62, 63, 64].map(bar => at(bar, 1)),
    ...[65, 66].flatMap(bar => [at(bar, 1), at(bar, 3)]),
    ...[67, 68].flatMap(bar => [1, 2, 3, 4].map(beat => at(bar, beat))),
  ];
  const HOP = { up: 0.15, down: 0.13, height: 20, land: 0.2, turn: 1 / 30 };
  // A hop on every turn of TURNS, with a quarter turn on landing for a friend that turns (Claude only hops).
  function hopsClip(turns) {
    return A.clip(t => {
      let facing = 0, y = 0, squash = 0, crouch = 0;
      for (const land of TURNS) {
        const take = land - HOP.down - HOP.up;
        if (t < take - 0.1) break;
        if (turns && t >= land - HOP.turn) facing += 90;
        const air = (t - take) / (HOP.up + HOP.down);
        if (air > 0 && air < 1) y -= HOP.height * Math.sin(Math.PI * air);
        const before = (t - take + 0.1) / 0.1;
        if (before > 0 && before < 1) { squash -= 0.04 * Math.sin(Math.PI * before); crouch += 3 * Math.sin(Math.PI * before); }
        const after = (t - land) / HOP.land;
        if (after >= 0 && after < 1) { squash -= 0.06 * Math.sin(Math.PI * after); crouch += 4 * Math.sin(Math.PI * after); }
      }
      return turns ? { facing, y, squash, crouch } : { y, squash };
    });
  }

  // The turns: every friend plays the hops from the start, so that each lands on its beat.
  function turnCues(cast) {
    for (const name of HOUSE) if (cast[name]) cast[name].play(hopsClip(true), { at: 0, fade: 0 });
    if (cast[CLAUDE]) cast[CLAUDE].play(hopsClip(false), { at: 0, fade: 0 });
  }

  // The turns seen closer, the camera cutting to the next view a beat or two before its turn, so that
  // every turn is seen landing. Every edge falls between faces: a group of row 1 seen from just under
  // the title (out of the picture) to above row 2's ears, so that the backs fill the frame; a group of
  // row 2, its top edge at row 1's feet. (One row's faces lie between the other's, so a frame narrower
  // than the page shows one row's faces only.) The page whole for the last two bars, a turn on every
  // beat, and front again.
  const ROW1_EDGE = floors[1] - EARS.stand - 8, ROW2_TOP = floors[0] - 40;
  const TITLE_CLEAR = TITLE.y + DESCENDER * TITLE.size + 14;      // Just under the title's descenders.
  // Row 1 from `first` to `last` seen close under the title: the frame runs from TITLE_CLEAR to
  // ROW1_EDGE, and its sides fall as far from the faces either side of them as they can.
  function underTitle(first, last) {
    const scale = FRAME.height / (ROW1_EDGE - TITLE_CLEAR), width = FRAME.width / scale;
    const row = rowSlots(0).map(slot => slot.name), i = row.indexOf(first), j = row.indexOf(last);
    const lo = Math.max(i > 0 ? places[row[i - 1]].x + FACE : -Infinity, places[last].x + FACE - width);
    const hi = Math.min(places[first].x - FACE, j + 1 < row.length ? places[row[j + 1]].x - FACE - width : Infinity);
    const left = lo <= hi ? (lo + hi) / 2 : between(row[Math.max(0, i - 1)], first);
    return { x: left + width / 2, y: (TITLE_CLEAR + ROW1_EDGE) / 2, zoom: scale / page.fit };
  }
  const GROUPS = {
    row1Left: underTitle('yuanyuan', 'fruit'),
    row1Far: underTitle('howdi', 'phy'),
    row2Left: across(places.cowosus.x - FACE - 60, between('tanyuan', 'alfie'), { topEdge: ROW2_TOP }),
    row2Middle: across(between('raze', 'tanyuan'), between('teni', 'whitedeer'), { topEdge: ROW2_TOP }),
    row2Right: across(between('whitedeer', 'jiaoyue'), empty.x + youWidth / 2 + 60, { topEdge: ROW2_TOP }),
    whole: WHOLE,
  };
  const CUTS = [['61.3', 'row1Left'], ['62.3', 'row2Middle'], ['63.3', 'row2Right'], ['64.3', 'row2Left'],
    ['65.2', 'whole'], ['65.4', 'row1Far'], ['66.2', 'whole']];
  for (const [cue, group] of CUTS) move(GROUPS[group], at(cue));
  move(across(DANCE_PAIR.left, DANCE_PAIR.right, { top: floors[0] - DANCE_PAIR.ears, bottom: floors[0] }), DANCE_CLOSE);
  move(WHOLE, DANCE_WHOLE);

  // ------------------------------------------------------------ 73-75: the place was yours

  // The rows and the band's two lines (phy's "say hi." and the address), without the title, which the
  // leaps would reach (its drawer leaves it out from 73.1): from the tallest ears standing to the
  // address, by the film's rule, a little smaller than the frame allows, so that the punch in on the
  // loudest bar keeps every face and the empty place's label in the frame (and the ears at the top of a
  // leap, which the frame's paper above them leaves room for); it eases back over the bar to the same
  // frame, where the finale takes it on at 76.1 (exports.end).
  const END = { zoom: 0.92, punch: 1.12 };
  END.frame = k.frame('B', { top: floors[0] - EARS.stand, bottom: BAND.lines[1] + DESCENDER * BAND.size, x: WHOLE.x, zoom: END.zoom });
  // Until two beats before phy writes, the band is empty: the rows and "you?" alone, by the film's rule,
  // as large as the wides.
  END.rows = k.frame('B', { top: floors[0] - EARS.stand, bottom: YOU.y + DESCENDER * youSize, x: WHOLE.x, zoom: WIDE.zoom });
  move(END.rows, at('73.1'));
  move(END.frame, at('73.3'), 2 * BEAT, 'inOut');
  move({ zoom: END.zoom * END.punch }, at('75.1'), 0.07, 'out');
  move(END.frame, at('75.1') + 0.07, at('76.1') - at('75.1') - 0.07, 'inOut');
  const placeFace = { x: empty.x, y: empty.y - 230 };
  const pointerTwo = pointer({
    path: [['73.1', { x: -90, y: floors[0] - 9.5 * RULE }], [at('73.4') - 0.05, placeFace]],
    shape: t => (t >= at('75.1') ? 'palm' : t >= handRests ? 'hand' : 'arrow'), waves: ['75.1'], from: '73.1', until: at('77.1') + 1, size: 150,
  });
  phySays('say hi.', '74.1', { seconds: 0.7, until: '76.1' });

  // A leap of a third of a friend's height or more, the whole cut-out leaving the floor: as the
  // gallery comes back (73.1), and with the hi on the loudest bar (75.1); and on the last chord (76.1)
  // a small hop, as at the song, before everyone settles for the loop.
  const LEAP = { height: 110, seconds: 0.56, last: at('76.1') };
  // Between the leaps, the friends keep the track's groove (it accents beat 1, the "and" of 2 and beat 4, a
  // 3+3+2 feel): a small hop on each accent, a quarter of a leap's height, the downbeat's a little higher;
  // in the last bar, as the chord dies away, smaller still. Each lands before the next leap starts, so that
  // none is put off by one under way.
  const GROOVE = { seconds: 0.3, hops: [
    ['73.2.5', 28], ['73.4', 28], ['74.1', 36], ['74.2.5', 28], ['74.4', 28], ['75.2.5', 28], ['75.4', 28],
    ['76.2.5', 20], ['76.4', 14]] };
  // The end: every friend of the house looks at the pointer and leaps as the gallery comes back, keeps the
  // groove, leaps a hi on the loudest bar, and hops on the last chord.
  function endCues(cast) {
    for (const name of HOUSE) {
      const actor = cast[name];
      if (!actor) continue;
      actor.look(pointerTwo.target, { at: at('73.1') });
      actor.leap({ at: at('73.1') - A.HOP.crouch * LEAP.seconds, height: LEAP.height, duration: LEAP.seconds });
      actor.leap({ at: at('75.1') - A.HOP.crouch * LEAP.seconds, height: LEAP.height, duration: LEAP.seconds });
      actor.play(E.greeting(actor.spec), { at: at('75.1') });
      actor.leap({ at: LEAP.last - A.HOP.crouch * SONG.seconds, height: SONG.height, duration: SONG.seconds });
      for (const [cue, height] of GROOVE.hops) actor.leap({ at: at(cue) - A.HOP.crouch * GROOVE.seconds, height, duration: GROOVE.seconds });
    }
    // Claude folds its laptop away and turns to the place, as its routine ends (characters/claude/claude.js).
    const claude = cast[CLAUDE];
    if (claude) {
      const routine = A.track(claude.spec.routine.keys, { duration: claude.spec.routine.duration }), a = ROUTINE.fold;
      claude.play(A.clip(t => routine(a + t), claude.spec.routine.duration - a), { at: at('75.1'), until: Infinity, fade: 0 });
    }
  }

  // ------------------------------------------------------------ the friends' cues

  k.cue('B', (scene, cast) => {
    rollCallCues(cast);
    // Every friend follows the pointer, and looks back at you once it has gone; phy, clicked, looks down
    // at the line they sit on instead.
    for (const name of HOUSE) {
      const actor = cast[name];
      if (!actor) continue;
      actor.look(pointerOne.target, { at: POINTER_ONE.from });
      if (name !== HOST) actor.look('viewer', { at: POINTER_ONE.gone - 0.1 });
    }
    const phy = cast[HOST];
    if (phy) {
      phy.play(E.greeting(phy.spec), { at: POINTER_ONE.click });
      phy.look({ x: phyPlace.x + 8, y: phyPlace.y + 30 }, { at: GROUND.shows[0] })
        .look('viewer', { at: at('20.2') })
        .look({ x: LO.x + 40, y: LO.y - 20 }, { at: LO.at });
    }
    nightCues(cast);
    riceCues(cast);
    songCues(cast);
    standCues(cast);
    turnCues(cast);
    endCues(cast);
  });

  // What the others build on: "lo" (where, how large, and how much is written at t: shown(t), in head
  // units from its left end) and the camera on it, which the crash keeps; the page whole; the camera
  // the page is left at for the finale (76.1); where "you?" lies (its middle and width, in head units),
  // so that a camera move keeps it whole.
  Object.assign(k.exports, { lo: { ...LO, camera: PHY_WRITES }, whole: WHOLE, end: END.frame, you: { x: empty.x, width: youWidth } });
});
