/*!
 * say hi, the method: the code made visible (bars 21-28, 31-36, the callout at 38.3, and 41-45.2).
 *
 * 21-28, page A. On the track's strongest attack the page drops into its source: every rule holds, at
 * once and in bold, a line of characters/phy/phy.js that draws phy, numbered as in the file and folded as
 * an editor folds them, and phy sits on their own `rig: { ground: 131 },`. The g phy was writing on page B
 * carries on down through the rule as the page drops. On the groove's hits each part's line lights and a
 * penciled leader runs from it to the part. In bar 24 the parts slide out from the head, each along a
 * trail that carries its line number in binary, with one long line to the library: fourteen trails and
 * the long line, as on the plaque's map; in bar 25 they snap back. Then the caret edits three numbers,
 * each shown large on a slip before the part changes (the ears, flicked between before and after; the
 * tail; the eyes), and when phy writes "hey." it undoes them, one a beat.
 *
 * 31-36, page A at night. phy looks at their paws, which barely show on the paper, rings them, and calls
 * Claude, which hops in and opens its laptop. Claude renders the paws, shown large on a card of day
 * paper, and measures them against the paper (CIE76, as test/raster.js does): under "just visible". phy
 * asks for "a shade darker."; Claude retypes the white; the second render goes beside the first and the
 * meter jumps past the mark. phy compares the two, ticks the second and writes "there." The camera holds
 * still from the call to the end of the night, so that before and after can be compared.
 *
 * 38.3, page B: the shared line `const ONIGIRI = { square: 0, taper: 0 };` as the film's era has it before
 * the rice ball, and Claude typing into it the square and the taper the era has after it (2 and 0.8),
 * both read from the era, over the gallery's rows.
 *
 * 41-45.3, page B: the recorded test run, quickening bar by bar while its count races up, large, a tick
 * lands over each house friend in turn and then pulses with the sixteenths, the camera leans in over the
 * last two bars, and "158 passed, 0 failed" lands on the downbeat of bar 45 as the camera snaps back.
 *
 * Every drawing is a function of t. Each typed number reaches phy as an era patch (core.js), so that phy is
 * drawn from a fresh spec for each set of numbers and nothing shared is changed.
 */
SayHi.section('method', k => {
  'use strict';
  const PF = PhyFriends, A = PF.anim, B = k.beats, at = k.at, RULE = k.RULE;
  const pageA = k.page('A'), pageB = k.page('B');
  const { phy: PLACE, margin: MARGIN } = SayHi.layout.A;
  const LAYOUT_B = SayHi.layout.B;
  const SPEC = PF.get('phy');
  const SOURCE = SayHi.source.phy.lines;
  // phy's head origin, between the eyes, on page A in the film's past (the template before Terry's tuning).
  const ORIGIN = { x: PLACE.x, y: PLACE.floor - k.era.under(k.at('21.1'), () => PF.groundOf(SPEC)) };
  const PAPER = PF.pencil.settings.paper;                               // The paper the house measures against.
  const INK = '#3d3c39';
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  // How far t has gone from a to b (seconds), eased, from 0 to 1.
  const ramp = (a, b, t, ease = A.ease.inOut) => ease(clamp((t - a) / (b - a), 0, 1));
  const escapeHtml = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  injectStyles();

  // ===================================================================== The source

  // The number of the first line after `after` whose text matches, so that the film follows the file.
  function lineNumber(pattern, after = 0) {
    const line = SOURCE.find(l => l.n > after && pattern.test(l.text));
    if (!line) throw new Error(`say hi: phy.js has no line matching ${pattern}`);
    return line.n;
  }
  const textOf = n => (SOURCE.find(l => l.n === n) || { text: '' }).text;

  const LINE = {
    head: lineNumber(/^\s{2}head: \{/), ears: lineNumber(/^\s{2}ears: \{/), hair: lineNumber(/^\s{2}hair: \{/),
    eyes: lineNumber(/^\s{2}eyes: \{/), blush: lineNumber(/^\s{2}blush: \{/), body: lineNumber(/^\s{2}body: \{/),
    tail: lineNumber(/^\s{2}tail: \{/), seat: lineNumber(/^\s{4}seat: \{/), legs: lineNumber(/^\s{4}legs: \{/),
    rig: lineNumber(/^\s{2}rig: \{/), face: lineNumber(/^\s{4}face: '#/),
  };
  // The lines that hold each part's numbers: the line after the part's name where the name opens a block.
  const NUMBERS = { head: LINE.head + 1, ears: LINE.ears + 1, body: LINE.body + 1, tail: LINE.tail + 1 };

  // Typing: from `at` the caret keeps what `find` and `replace` share at their start, deletes the rest of
  // `find` a step at a time and types the rest of `replace`, as an editor does; an undo puts `find` back at
  // once, as ctrl-Z does.
  function sharedStart(a, b) {
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    return i;
  }
  // How many keystrokes an edit takes: the rest of `find` deleted and the rest of `replace` typed.
  function typedSteps(e) {
    const keep = sharedStart(e.find, e.replace);
    return e.find.length + e.replace.length - 2 * keep;
  }
  // The text of a line under one edit at t, and the caret's column (or null).
  function edited(text, e, t, hold = B.BEAT) {
    const i = text.indexOf(e.find);
    if (i < 0 || t < e.at) return { text, caret: null };
    if (e.undo !== undefined && t >= e.undo) return { text, caret: t < e.undo + hold ? i + e.find.length : null };
    const keep = sharedStart(e.find, e.replace), cut = e.find.length - keep, add = e.replace.length - keep;
    const steps = Math.floor((t - e.at) / e.step + 1e-9);
    const deleted = Math.min(cut, steps), put = clamp(steps - cut, 0, add);
    const now = e.find.slice(0, e.find.length - deleted) + e.replace.slice(keep, keep + put);
    const typedBy = e.at + (cut + add) * e.step;
    return { text: text.slice(0, i) + now + text.slice(i + e.find.length), caret: t < typedBy + hold ? i + now.length : null, token: now };
  }

  // ===================================================================== The era: phy's numbers

  // The white that would not show on paper (before 8d1e01f), and the one that does: phy is drawn with the
  // old white until Claude's second render at 35.2, as the project was until that commit.
  const WHITE = { old: '#fcf5ef', now: SPEC.palette.face, at: at('35.2') };
  // The three numbers the caret changes in bars 25-27, and what it changes them to.
  const EDITS = [
    { key: 'ears', line: NUMBERS.ears, part: 'length', was: SPEC.ears.length, to: 160, apply: at('26.1'), undo: at('28.4'),
      patch: v => ({ ears: { length: v } }) },
    { key: 'tail', line: NUMBERS.tail, part: 'width', was: SPEC.tail.width, to: 220, apply: at('27.1'), undo: at('28.3'),
      patch: v => ({ tail: { width: v } }) },
    { key: 'eyes', line: LINE.eyes, part: 'h', was: SPEC.eyes.h, to: 8, apply: at('27.4'), undo: at('28.2'),
      patch: v => ({ eyes: { h: v } }) },
  ].map(e => {
    const find = `${e.part}: ${e.was}`, replace = `${e.part}: ${e.to}`;
    if (!textOf(e.line).includes(find)) throw new Error(`say hi: line ${e.line} of phy.js has no "${find}"`);
    const step = B.SIXTEENTH, steps = typedSteps({ find, replace });
    return { ...e, find, replace, step, at: e.apply - steps * step };
  });
  // The ears flick between before and after once they have changed: undone, redone, undone, redone.
  const FLICK = [at('26.2'), at('26.2.5'), at('26.3'), at('26.3.5')];
  const earsShown = t => {
    let shown = true;
    for (const f of FLICK) if (t >= f) shown = !shown;
    return shown;
  };
  const editOn = (e, t) => t >= e.apply && t < e.undo && (e.key !== 'ears' || earsShown(t));

  k.era.define('phyWhite', {
    value: t => (t < WHITE.at ? WHITE.old : WHITE.now),
    patch: v => (v === WHITE.now ? {} : { phy: { palette: { face: v } } }),
  });
  k.era.define('phyEdits', {
    value: t => EDITS.filter(e => editOn(e, t)).map(e => e.key).join(' '),
    patch: v => {
      const on = EDITS.filter(e => v.split(' ').includes(e.key));
      return on.length ? { phy: on.reduce((spec, e) => PF.merge(spec, e.patch(e.to)), {}) } : {};
    },
  });

  // ===================================================================== IV. The crash (21-28, page A)

  k.shot('A', '21.1', '29.1');

  // The listing: phy's line on phy's floor, the lines of the parts above it in the file's order, folded
  // between, the lines before the head's above those, and the file's last line below.
  const CODE = { size: 32, x: MARGIN + 18, number: MARGIN - 18, floorRule: Math.round(PLACE.floor / RULE) };
  const ADV = measureAdvance(CODE.size);
  const lastLine = [...SOURCE].reverse().find(l => l.text.trim());
  const shown = [LINE.head, NUMBERS.head, LINE.ears, NUMBERS.ears, LINE.hair, LINE.eyes, LINE.body, NUMBERS.body, LINE.tail, NUMBERS.tail, LINE.rig];
  const ROWS = shown.slice().reverse().map((n, i) => ({ n, rule: CODE.floorRule - i }));
  for (let i = 1, top = ROWS[ROWS.length - 1]; i <= 6; i++) ROWS.push({ n: top.n - i, rule: top.rule - i });
  ROWS.push({ n: lastLine.n, rule: CODE.floorRule + 1 });
  ROWS.sort((a, b) => a.rule - b.rule);
  const ruleOf = n => ROWS.find(r => r.n === n).rule;
  const FOLDS = ROWS.slice(1).filter((r, i) => r.n - ROWS[i].n > 1).map(r => r.rule);

  // Where a token of a shown line lies in the world: its left and right edges and its baseline.
  function tokenAt(n, token) {
    const i = textOf(n).indexOf(token);
    if (i < 0) throw new Error(`say hi: line ${n} of phy.js has no "${token}"`);
    return { x0: CODE.x + i * ADV, x1: CODE.x + (i + token.length) * ADV, y: ruleOf(n) * RULE };
  }

  // The crash: every line lands on the hit, in bold for a few frames, then in ink, and by the second beat
  // every line but the one lit is faint.
  const LISTING = { from: at('21.1'), to: at('29.1'), drop: 18, fall: 0.14, bold: 0.2, faint: at('21.2') };
  // The parts, in the order the hits light them: the lines lit, and the leader from a token of the line
  // (the numbers that place or size the part, where they lie clear of phy) to the part.
  // The middle of the left ear: halfway along it from its base, leaning out by its angle.
  const angle = SPEC.ears.angle * Math.PI / 180, half = SPEC.ears.length / 2;
  const earMid = { x: ORIGIN.x + SPEC.ears.base[0] - Math.sin(angle) * half, y: ORIGIN.y + SPEC.ears.base[1] - Math.cos(angle) * half };
  const tip = SPEC.hair.tips[0];
  const LEADS = [
    { key: 'head', at: at(21, 2.5), lines: [LINE.head, NUMBERS.head], from: ['end', NUMBERS.head], to: { x: ORIGIN.x - 64, y: ORIGIN.y + SPEC.head.cy - 26 } },
    { key: 'ears', at: at(21, 4), lines: [LINE.ears, NUMBERS.ears], from: ['token', NUMBERS.ears, `length: ${SPEC.ears.length}`], to: earMid },
    { key: 'hair', at: at(22, 1), lines: [LINE.hair], from: ['token', LINE.hair, `[${tip[0]}, ${tip[1]}`], to: { x: ORIGIN.x + tip[0] + 4, y: ORIGIN.y + tip[1] + 10 } },
    { key: 'eyes', at: at(23, 1), lines: [LINE.eyes], from: ['token', LINE.eyes, `w: ${SPEC.eyes.w}, h: ${SPEC.eyes.h}`], to: { x: ORIGIN.x - SPEC.eyes.x - 8, y: ORIGIN.y + SPEC.eyes.y - 4 } },
    { key: 'body', at: at(23, 2.5), lines: [LINE.body, NUMBERS.body], from: ['end', NUMBERS.body], to: { x: ORIGIN.x - SPEC.body.rx + 8, y: ORIGIN.y + SPEC.body.cy + 6 } },
    { key: 'tail', at: at(23, 4), lines: [LINE.tail, NUMBERS.tail], from: ['token', NUMBERS.tail, `taper: ${SPEC.tail.taper}`], to: { x: ORIGIN.x + SPEC.tail.base[0] + 48, y: ORIGIN.y + SPEC.tail.base[1] - 70 } },
  ];
  for (const lead of LEADS) {
    const [kind, n, token] = lead.from;
    if (kind === 'end') {
      const text = textOf(n);
      lead.start = { x: CODE.x + text.length * ADV + 10, y: ruleOf(n) * RULE - CODE.size * 0.32 };
    } else {
      const box = tokenAt(n, token);
      lead.start = { x: (box.x0 + box.x1) / 2, y: box.y + 7 };
    }
  }
  const litAt = t => {
    const lit = new Set();
    for (const lead of LEADS) if (t >= lead.at && t < at('24.1')) lead.lines.forEach(n => lit.add(n));
    for (const e of EDITS) if (t >= e.at - B.BEAT && t < e.apply + B.BEAT) lit.add(e.line);
    for (const e of EDITS) if (t >= e.undo && t < e.undo + B.BEAT) lit.add(e.line);
    if (t < LEADS[0].at) lit.add(LINE.rig);
    return lit;
  };
  // An edit's token at t and the caret's column in it (or null): typed, held, flicked between before and
  // after (the ears), and undone.
  function editToken(e, t) {
    const flicked = e.key === 'ears' && t < e.undo ? FLICK.filter(f => f <= t).pop() : undefined;
    if (flicked === undefined) {
      const { text, caret } = edited(e.find, e, t);
      return { token: text, caret };
    }
    const token = earsShown(t) ? e.replace : e.find;
    return { token, caret: t < flicked + B.BEAT / 2 ? token.length : null };
  }
  // The text of a shown line at t, and the caret's column (or null), under the edits of bars 25-28.
  function listingText(n, t) {
    let text = textOf(n), caret = null;
    for (const e of EDITS) {
      if (e.line !== n) continue;
      const i = text.indexOf(e.find), { token, caret: col } = editToken(e, t);
      text = text.slice(0, i) + token + text.slice(i + e.find.length);
      if (col != null) caret = i + col;
    }
    return { text, caret };
  }

  k.draw(pageA.under, LISTING.from, LISTING.to, (el, t) => {
    if (!el.firstChild) {
      el.className += ' sh-code sh-method-listing';
      el.innerHTML = ROWS.map(r => `<p class="sh-line mono" data-n="${r.n}" style="left:${CODE.x}px;font-size:${CODE.size}px">` +
        `<span class="sh-n">${r.n}</span><span class="sh-t"></span><span class="sh-caret" hidden></span></p>`).join('') +
        `<svg class="sh-method-folds" width="1" height="1">${FOLDS.map(foldMark).join('')}</svg>`;
    }
    const lit = litAt(t);
    // Every line lands on the hit, all at once, with a small bounce onto its rule.
    const fallen = A.ease.bounce(clamp((t - LISTING.from) / LISTING.fall, 0, 1));
    [...el.querySelectorAll('.sh-line')].forEach(p => {
      const n = Number(p.dataset.n), row = ROWS.find(r => r.n === n);
      p.style.top = `${row.rule * RULE - LISTING.drop * (1 - fallen)}px`;
      const { text, caret } = listingText(n, t);
      const span = p.querySelector('.sh-t');
      if (span.dataset.text !== text) { span.dataset.text = text; span.innerHTML = withSwatch(text); }
      const tone = t < LISTING.from + LISTING.bold ? 'lit' : t < LISTING.faint ? 'ink' : lit.has(n) ? 'lit' : 'faint';
      if (p.dataset.tone !== tone) {
        p.dataset.tone = tone;
        p.classList.toggle('faint', tone === 'faint');
        p.classList.toggle('sh-method-lit', tone === 'lit');
      }
      p.classList.toggle('sh-method-quiet', tone === 'faint' && t >= at('25.2'));
      const c = p.querySelector('.sh-caret');
      c.hidden = caret == null;
      if (caret != null) c.style.left = `${caret * ADV + (/'#[0-9a-fA-F]{6}'/.test(text.slice(0, caret)) ? SWATCH_EM * CODE.size : 0)}px`;
    });
    el.querySelector('.sh-method-folds').style.opacity = String(ramp(LISTING.from + 0.1, LISTING.from + 0.3, t));
    // The listing steps back while the parts are apart, so that the map reads.
    const back = ramp(at('24.1'), at('24.1') + 0.3, t) * (1 - ramp(at('25.1'), at('25.3'), t));
    el.style.opacity = back > 0 ? String(1 - 0.6 * back) : '';
  });

  // phy's pencil lets the paper through in specks and streaks, so over the listing the code would show
  // through phy. While the listing is on the page, a sheet of the paper in phy's shape lies between the
  // two, as the library lays one under a friend drawn on a background of its own (the paper sheet of
  // PhyFriends.render): the scene's own drawing of phy, flat, in the paper's color, where the scene puts
  // phy at t, so that it follows every pose and part as it is drawn. Not while the map draws phy itself.
  const BOX = PF.scene.BOX;
  k.draw(pageA.under, LISTING.from, LISTING.to, (el, t) => {
    if (!el.firstChild) {
      el.innerHTML = `<div class="sh-method-backing" style="position:absolute;left:0;top:0;width:${BOX}px;height:${BOX}px">` +
        `<svg width="${BOX}" height="${BOX}" viewBox="0 0 ${BOX} ${BOX}" style="display:block;overflow:visible">` +
        '<defs><filter id="sh-method-paper" x="-10%" y="-10%" width="120%" height="120%">' +
        `<feFlood style="flood-color:var(--sh-paper, ${PAPER})"/><feComposite in2="SourceAlpha" operator="in"/></filter></defs>` +
        '<use filter="url(#sh-method-paper)"/></svg></div>';
    }
    const holder = el.firstChild, built = pageA.sceneAt(t), actor = built && built.cast.phy;
    const shown = !!actor && !(t >= MAP.out && t < MAP_END) && actor.node.style.display !== 'none';
    holder.style.display = shown ? '' : 'none';
    if (!shown) return;
    holder.style.transform = actor.node.style.transform;
    const drawing = `#${actor.rig.svg.getAttribute('data-pf-uid')}-drawing`, use = holder.querySelector('use');
    if (use.getAttribute('href') !== drawing) use.setAttribute('href', drawing);
  });

  // A fold in the margin, between two rules whose lines are not consecutive in the file: a short zigzag
  // across the margin line, as a hand marks lines left out.
  function foldMark(rule) {
    const y = (rule - 1) * RULE + 1, x = MARGIN;
    return `<path d="M${x - 9} ${y - 7}l6 4.5l-5 4l8 3.5" fill="none" stroke="${INK}" stroke-opacity=".55" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="M${x + 2} ${y - 7}l6 4.5l-5 4l8 3.5" fill="none" stroke="${INK}" stroke-opacity=".55" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  // The crash: on the hit the page drops a little and settles, as if it had fallen onto its source,
  // starting from where it was, so that the words phy was writing do not jump on the cut.
  k.place('A', '21.1', '21.2', (t, { local }) => {
    const u = clamp(local / 0.42, 0, 1), bump = Math.sin(Math.PI * Math.min(1, u * 1.6)) * (1 - u);
    return { y: 30 * bump, rotate: -0.5 * bump };
  });

  // The leaders, each drawn on its hit, all gone as the parts slide out.
  for (const lead of LEADS) {
    k.ui.leader(pageA.under, { from: lead.start, to: lead.to, at: lead.at, seconds: 0.2, bend: 0.1, width: 2.6, until: '24.1', seed: lead.at * 100 });
  }

  // The camera: the listing and phy together; out to the map in bar 24; in to phy for the edits.
  // The wide shot holds every line's number on the left and the tail's `taper: 0.6` whole on the right.
  const CAM = {
    listing: { x: 730, y: 432, zoom: 1.43 },
    wide: { x: 918, y: 436, zoom: 1.12 },
    map: { x: 1425, y: ORIGIN.y + 14, zoom: 1.85 },
    edits: { x: 1150, y: 500, zoom: 1.75 },
  };
  // On the cut phy stays where the gallery's camera left them, with the g they were writing; the paper
  // under them has become their source, and the camera falls back at once to show all of it.
  const lo = k.exportsOf('gallery').lo, phyB = LAYOUT_B.places.phy;
  const MATCH = lo && lo.camera && phyB
    ? { x: PLACE.x + lo.camera.x - phyB.x, y: PLACE.floor + lo.camera.y - phyB.y, zoom: (lo.camera.zoom * pageB.fit) / pageA.fit }
    : CAM.listing;
  // The camera holds on phy for a few frames while the g's stroke plunges, then falls back fast.
  const CRASH = { hold: 0.12, back: 0.42, stroke: 0.14, depth: 2.6 * RULE, rub: [at('21.1.5'), at('21.2')] };
  k.camera('A', MATCH, { at: '21.1' });
  k.camera('A', CAM.listing, { at: at('21.1') + CRASH.hold, duration: CRASH.back, ease: 'out' });
  k.camera('A', CAM.wide, { at: at(23, 2.5) + 0.12, duration: 0.6, ease: 'inOut' });

  // The words phy was writing on page B, "lo" and part of a g, at the same place beside phy on the
  // cut (a unit of page B is a unit of page A on screen there), and the g's stroke carrying on down
  // through the rules as the page drops; then rubbed out. The gallery's export gives the letters and how
  // much of them it showed; without it, "lo" and half a g are measured here.
  const LO = lo && phyB && Number.isFinite(lo.x) ? {
    text: lo.text || 'login', size: lo.size || k.ui.HAND.size, rotate: lo.rotate ?? -1,
    x: lo.x - phyB.x + PLACE.x, y: lo.y - phyB.y + PLACE.floor,
    shown: typeof lo.shown === 'function' ? () => lo.shown(LISTING.from - 1e-3) : null,
  } : null;
  if (LO) {
    k.ensureShowable(LO.text, 'handwriting');
    // The letters' right ends and the line's width, measured once, on a copy outside the frame, as hand()
    // measures: a drawer that reads the layout of the line it draws paints its first frame a level
    // different from every later visit, so that the frame depends on the seeks before it.
    const probe = document.createElement('p');
    probe.className = 'sh-hand hand graphite';
    probe.style.fontSize = `${LO.size}px`;
    probe.textContent = LO.text;
    const { rights, width } = measureRights(probe);
    k.draw(pageA.over, LISTING.from, CRASH.rub[1], (el, t) => {
      if (!el.firstChild) {
        el.innerHTML = `<p class="sh-hand hand graphite" style="font-size:${LO.size}px">${escapeHtml(LO.text)}</p>` +
          '<svg class="sh-method-slip" width="1" height="1"><path/></svg>';
      }
      const p = el.firstChild, g = { left: rights[1], right: rights[2] };
      const shown = LO.shown ? LO.shown() : g.left + (g.right - g.left) / 2;
      p.style.transform = `translate(${LO.x}px, ${LO.y}px) rotate(${LO.rotate}deg) translateY(-${0.85}em)`;
      p.style.clipPath = `inset(-40% ${Math.max(0, width - shown)}px -40% -12%)`;
      // From where the pen was on the cut, the g's stroke runs on down through the rules instead of turning.
      const x = LO.x + shown - 0.1 * (g.right - g.left), y0 = LO.y - 0.1 * LO.size;
      const drawn = ramp(LISTING.from, LISTING.from + CRASH.stroke, t, A.ease.out);
      const path = el.lastChild.firstChild;
      path.setAttribute('d', `M${x} ${y0}C${x - 2} ${y0 + 0.4 * CRASH.depth} ${x + 6} ${y0 + 0.75 * CRASH.depth} ${x + 18} ${y0 + CRASH.depth}`);
      path.setAttribute('pathLength', '1');
      path.setAttribute('stroke-dasharray', `${drawn} 1`);
      path.setAttribute('stroke-width', String(0.09 * LO.size));
      el.style.opacity = String(1 - ramp(CRASH.rub[0], CRASH.rub[1], t));
    });
  }

  // The middles of parts of phy's drawing, seated, in head units from the head's origin, as the drawing
  // puts them: name -> [x, y]. Measured once, in a drawing of the spec off screen.
  function drawnCenters(names) {
    const host = document.createElement('div');
    host.style.cssText = 'position:absolute;left:0;top:0;width:512px;height:512px;visibility:hidden';
    pageA.under.appendChild(host);
    try {
      const rig = PF.mount(host, SPEC, { bg: false, bitmap: false });
      rig.setPose({}, true);
      const drawing = rig.svg.querySelector('[id$="-drawing"]'), toHead = drawing.getScreenCTM().inverse();
      const centers = {};
      for (const name of names) {
        const box = rig.svg.querySelector(`[data-pf="${name}"]`).getBoundingClientRect();
        const p = new DOMPoint(box.x + box.width / 2, box.y + box.height / 2).matrixTransform(toHead);
        centers[name] = [Math.round(p.x), Math.round(p.y)];
      }
      return centers;
    } finally {
      host.remove();
    }
  }

  // Where each letter of an element's text ends, from its left edge, in the element's own units:
  // measured on a copy outside every camera, so that the numbers do not depend on the zoom at the
  // moment of measuring.
  function measureRights(p) {
    const copy = p.cloneNode(true);
    copy.style.cssText += ';position:absolute;left:0;top:0;transform:none;clip-path:none;visibility:hidden';
    document.body.appendChild(copy);
    try {
      const node = copy.firstChild, range = document.createRange(), box = copy.getBoundingClientRect();
      const rights = [];
      for (let i = 1; i <= node.length; i++) {
        range.setStart(node, 0);
        range.setEnd(node, i);
        rights.push(Math.round((range.getBoundingClientRect().right - box.left) * 100) / 100);
      }
      return { rights, width: box.width };
    } finally {
      copy.remove();
    }
  }

  k.camera('A', CAM.map, { at: '24.1', duration: 0.42, ease: 'out' });
  k.camera('A', CAM.edits, { at: '25.1', duration: 2 * B.BEAT, ease: 'inOut' });

  // ------------------------------------------------------------ the map (24-25)

  // The parts as the drawing groups them (data-pf), each with its anchor in head units, from phy.js, and the
  // line that places it. Each slides out from the origin along its own direction, the same distance.
  // Fourteen trails and the long line, as the plaque's map has fourteen pulsars and the line to the
  // galaxy's center. The head and the body stay where they are, the map's center; every other part the
  // drawing names goes out along the line from the head's origin to its anchor in phy.js, or, for the
  // legs, which phy.js leaves to the house template, to where the drawing puts them.
  const seat = SPEC.stand.seat, legs = k.era.under(at('24.1'), () => drawnCenters(['legL', 'legR']));
  const PARTS = [
    { groups: ['base', 'face', 'mouth'], anchor: [SPEC.head.cx, SPEC.head.cy], line: LINE.head, trail: false, still: true },
    { groups: ['body', 'scarf', 'armL', 'armR'], anchor: [SPEC.body.cx, SPEC.body.cy], line: NUMBERS.body, trail: false, still: true },
    { groups: ['hair'], anchor: [SPEC.hair.cx, SPEC.hair.cy], line: LINE.hair },
    { groups: ['earL'], anchor: [SPEC.ears.base[0], SPEC.ears.base[1]], line: NUMBERS.ears },
    { groups: ['earR'], anchor: [-SPEC.ears.base[0], SPEC.ears.base[1]], line: NUMBERS.ears },
    { groups: ['eyeL'], anchor: [-SPEC.eyes.x, SPEC.eyes.y], line: LINE.eyes },
    { groups: ['eyeR'], anchor: [SPEC.eyes.x, SPEC.eyes.y], line: LINE.eyes },
    { groups: ['cheekL'], anchor: [-SPEC.blush.x, SPEC.blush.y], line: LINE.blush },
    { groups: ['cheekR'], anchor: [SPEC.blush.x, SPEC.blush.y], line: LINE.blush },
    { groups: ['tail'], anchor: [SPEC.tail.base[0], SPEC.tail.base[1]], line: NUMBERS.tail },
    { groups: ['pawL'], anchor: [-seat.paw.cx, seat.paw.cy], line: LINE.seat },
    { groups: ['pawR'], anchor: [seat.paw.cx, seat.paw.cy], line: LINE.seat },
    { groups: ['legL'], anchor: legs.legL, line: LINE.legs },
    { groups: ['legR'], anchor: legs.legR, line: LINE.legs },
    { groups: ['footL'], anchor: [-seat.foot.cx, seat.foot.cy], line: LINE.seat },
    { groups: ['footR'], anchor: [seat.foot.cx, seat.foot.cy], line: LINE.seat },
  ].map(p => {
    const r = Math.hypot(p.anchor[0], p.anchor[1]) || 1;
    const dir = [p.anchor[0] / r, p.anchor[1] / r];
    return { ...p, r, dir, binary: p.line.toString(2), from: centerExit(dir) };
  });
  if (PARTS.filter(p => p.trail !== false).length !== 14) throw new Error('say hi: the map wants fourteen trails');
  // The long line runs level, as the plaque's does, from the head's right edge a little above the origin,
  // so that it passes between the right ear's trail and the right eye's (which leaves the origin almost
  // level) and over the eye as it slides out, crossing no trail.
  const MAP = {
    out: at('24.1'), outSeconds: 0.5, back: at('25.1'), backSeconds: 0.16, apart: 100, drift: 0.1,
    rub: [at('25.2'), at(25, 3.5)], bit: { first: 6, step: 7.5, tick: 8, dash: 5 },
    library: { x: 1700, lift: 32, label: 'PhyFriends', at: at(24, 1.5) },
  };
  MAP.library.y = ORIGIN.y - MAP.library.lift;
  // Out in half a second, then still drifting a little further while the map holds, then back at once.
  const apartAt = t => (t < MAP.back
    ? ramp(MAP.out, MAP.out + MAP.outSeconds, t, A.ease.out) * (1 + MAP.drift * ramp(MAP.out, MAP.back, t, A.ease.linear))
    : (1 + MAP.drift) * (1 - ramp(MAP.back, MAP.back + MAP.backSeconds, t, A.ease.in)));
  const MAP_END = MAP.back + MAP.backSeconds;

  // While the map is drawn, phy is drawn here, part by part, and the scene's phy is hidden.
  k.parts('A', 'phy', MAP.out, MAP_END, () => ({ show: [] }));
  const phyDrawn = k.friend('phy');
  const MAP_BOX = 760;
  const mapView = { w: MAP_BOX, h: MAP_BOX, x: MAP_BOX / 2, y: MAP_BOX / 2, scale: 1, rotate: 0 };

  // The trails, under the parts: out along each part's direction from where it leaves the head and the
  // body (the map's center, which they would cover), drawn on as the part goes, with its line number in
  // binary (| for 1, a dash for 0, as on the plaque) from there outward; then the long line to the library.
  // Where the long line leaves the head: the head's oval at the line's height, with the trails' room.
  const libraryFrom = (() => {
    const { cx, cy, rx, ry } = SPEC.head, dy = -MAP.library.lift - cy;
    return { x: ORIGIN.x + cx + rx * Math.sqrt(Math.max(0, 1 - (dy / ry) ** 2)) + 6, y: MAP.library.y };
  })();
  k.draw(pageA.under, MAP.out, MAP.rub[1], (el, t) => {
    if (!el.firstChild) el.innerHTML = `<svg class="sh-method-map" width="1" height="1"></svg>`;
    const u = t < MAP.back ? apartAt(t) : 1 + MAP.drift, rubbed = ramp(MAP.rub[0], MAP.rub[1], t, A.ease.inOut);
    const svg = el.firstChild;
    svg.style.opacity = String(1 - rubbed);
    svg.style.transform = rubbed > 0 ? `translate(${-6 * rubbed}px, ${3 * rubbed}px)` : '';
    let out = '';
    for (const p of PARTS) {
      if (p.trail === false) continue;
      const length = (p.r + MAP.apart) * u, [dx, dy] = p.dir;
      if (length <= p.from) continue;
      out += `<path d="M${ORIGIN.x + dx * p.from} ${ORIGIN.y + dy * p.from}L${ORIGIN.x + dx * length} ${ORIGIN.y + dy * length}" class="trail"/>`;
      [...p.binary].forEach((bit, i) => {
        const r = p.from + MAP.bit.first + i * MAP.bit.step;
        if (r > length) return;
        const cx = ORIGIN.x + dx * r, cy = ORIGIN.y + dy * r;
        const [ax, ay] = bit === '1' ? [-dy * MAP.bit.tick / 2, dx * MAP.bit.tick / 2] : [dx * MAP.bit.dash / 2, dy * MAP.bit.dash / 2];
        out += `<path d="M${cx - ax} ${cy - ay}L${cx + ax} ${cy + ay}" class="bit"/>`;
      });
    }
    const reach = ramp(MAP.library.at, MAP.library.at + 0.35, t, A.ease.out), { x: x0, y: y0 } = libraryFrom;
    out += `<path d="M${x0} ${y0}L${lerp(x0, MAP.library.x, reach)} ${y0}" class="trail long"/>`;
    svg.innerHTML = out;
  });

  // How far from the head's origin a ray in direction dir leaves the head and the body as phy.js draws
  // them (plain ovals in the film's past), with a little room.
  function centerExit([dx, dy]) {
    const ovals = [[SPEC.head.cx, SPEC.head.cy, SPEC.head.rx, SPEC.head.ry], [SPEC.body.cx, SPEC.body.cy, SPEC.body.rx, SPEC.body.ry]];
    let far = 0;
    for (const [cx, cy, rx, ry] of ovals) {
      const a = (dx / rx) ** 2 + (dy / ry) ** 2, b = -2 * (dx * cx / rx ** 2 + dy * cy / ry ** 2), c = (cx / rx) ** 2 + (cy / ry) ** 2 - 1;
      const d = b * b - 4 * a * c;
      if (d >= 0) far = Math.max(far, (-b + Math.sqrt(d)) / (2 * a));
    }
    return far + 6;
  }

  // The library's name, at the long line's end, as large as a label to be read under the map's camera.
  const libraryName = 1.1 * k.ui.sizeFor('label', pageA.under, at('24.2'), 'mono');
  k.ui.label(pageA.under, MAP.library.label, { x: MAP.library.x + 10, y: MAP.library.y + libraryName * 0.36, size: libraryName, font: 'mono',
    tone: 'ink-2', at: MAP.library.at + 0.3, until: MAP.rub[0], mustRead: true });

  // phy, drawn whole by the library, with each part's group slid along its direction; the pose is the
  // scene's phy's at t, so that nothing jumps when the drawing is handed back.
  k.draw(pageA.over, MAP.out, MAP_END, (el, t) => {
    if (!el.firstChild) {
      el.innerHTML = '<div class="sh-method-phy"></div>';
      Object.assign(el.firstChild.style, { position: 'absolute', width: `${MAP_BOX}px`, height: `${MAP_BOX}px`,
        transform: `translate(${ORIGIN.x - MAP_BOX / 2}px, ${ORIGIN.y - MAP_BOX / 2}px)` });
    }
    const rig = phyDrawn.rig(el.firstChild, t, { view: mapView });
    rig.svg.style.overflow = 'visible';
    layPaperUnder(rig.svg);
    const built = pageA.sceneAt(t), actor = built && built.cast.phy;
    rig.setPose(actor ? actor.rig.pose : {}, true);
    slideParts(rig.svg, apartAt(t) * MAP.apart);
  });

  // Lays a sheet of the paper under a drawing of a friend, in its shape (as PhyFriends.render does for a
  // friend on a background), so that the listing does not show through the pencil: a flat copy of the
  // drawing, filled with the paper's color, under the penciled one. Made once in each drawing.
  function layPaperUnder(svg) {
    if (svg.querySelector('[data-method="paper"]')) return;
    const uid = svg.getAttribute('data-pf-uid'), defs = svg.querySelector('defs'), id = `${uid}-method-paper`;
    defs.insertAdjacentHTML('beforeend', `<filter id="${id}" x="-10%" y="-10%" width="120%" height="120%">` +
      `<feFlood style="flood-color:var(--sh-paper, ${PAPER})"/><feComposite in2="SourceAlpha" operator="in"/></filter>`);
    const use = document.createElementNS(SVG_NS, 'use');
    use.setAttribute('data-method', 'paper');
    use.setAttribute('href', `#${uid}-drawing`);
    use.setAttribute('filter', `url(#${id})`);
    defs.after(use);
  }

  // Moves each part's group by `distance` along its direction, inside a group of its own (made once in
  // each drawing), in the group's own frame, so that the rig's transforms are left as they are.
  function slideParts(svg, distance) {
    const drawing = svg.querySelector('[id$="-drawing"]');
    const toDrawing = drawing.getCTM().inverse();
    for (const p of PARTS) {
      if (p.still) continue;
      for (const name of p.groups) {
        const group = svg.querySelector(`[data-pf="${name}"]`);
        if (!group) continue;
        let inner = group.firstElementChild;
        if (!inner || inner.getAttribute('data-method') !== 'slide') {
          inner = document.createElementNS(SVG_NS, 'g');
          inner.setAttribute('data-method', 'slide');
          while (group.firstChild) inner.appendChild(group.firstChild);
          group.appendChild(inner);
        }
        // The direction in the group's own frame: the drawing's vector, through the inverse of the group's
        // linear transform relative to the drawing.
        const m = toDrawing.multiply(group.getCTM()).inverse();
        const vx = p.dir[0] * distance, vy = p.dir[1] * distance;
        const lx = m.a * vx + m.c * vy, ly = m.b * vx + m.d * vy;
        const value = distance ? `translate(${lx.toFixed(2)} ${ly.toFixed(2)})` : '';
        if ((inner.getAttribute('transform') || '') !== value) {
          if (value) inner.setAttribute('transform', value);
          else inner.removeAttribute('transform');
        }
      }
    }
  }

  // ------------------------------------------------------------ the edits (25.4-28.4)

  // Each edit is shown large on a slip of paper near its part, with the line's number, while the caret
  // types it: the number held a beat before the part changes, and three beats after. The slip of the
  // ears flicks with them; the slip of the eyes shows their undo.
  const SLIPS = {
    ears: { x: 905, y: 352, from: EDITS[0].at, to: at('27.1') },
    tail: { x: 1415, y: 372, from: EDITS[1].at, to: at('27.4') },
    eyes: { x: 935, y: 590, from: EDITS[2].at, to: at('28.3') },
  };
  const SLIP = { size: 56 };
  for (const e of EDITS) {
    const slip = SLIPS[e.key];
    k.draw(pageA.over, slip.from, slip.to, (el, t) => {
      if (!el.firstChild) {
        el.className += ' sh-typed';
        el.innerHTML = `<p><span class="sh-n">${e.line}</span><span class="sh-t"></span><span class="sh-caret pill"></span></p>`;
      }
      const p = el.firstChild, { token, caret: caretAt } = editToken(e, t);
      const span = p.querySelector('.sh-t');
      if (span.textContent !== token) span.textContent = token;
      const caret = p.querySelector('.sh-caret');
      caret.hidden = caretAt == null;
      if (caretAt != null) caret.style.left = `calc(.45em + ${String(e.line).length + 1.2 + caretAt}ch)`;
      const pop = ramp(slip.from, slip.from + 0.14, t, A.ease.back), fade = 1 - ramp(slip.to - 0.18, slip.to, t);
      p.style.fontSize = `${SLIP.size}px`;
      p.style.opacity = String(Math.min(pop * 3, 1) * fade);
      p.style.transform = `translate(${slip.x}px, ${slip.y}px) translate(-50%, -50%) rotate(-1.5deg) scale(${lerp(0.7, 1, pop)})`;
      if (pop >= 1 && fade >= 1) k.ui.legible(p, 'typed', t, token, { size: SLIP.size, face: 'mono' });
    });
  }

  // The ears shoot up: a spring in their roots as they change, and again with each flick.
  const boing = A.clip(t => {
    const s = Math.exp(-t * 9) * Math.sin(t * 34);
    return { earL: -9 * s, earR: -9 * s };
  }, 0.6);

  k.cue('A', (scene, cast) => {
    const p = cast.phy;
    if (!p) return;
    // The crash: phy looks down at their own line, then at each part's line as it lights.
    p.look({ x: PLACE.x - 120, y: PLACE.floor + 40 }, { at: at('21.1') });
    LEADS.forEach(lead => p.look({ x: lead.start.x, y: lead.start.y }, { at: lead.at }));
    p.look('viewer', { at: at('24.1') });
    // The edits: phy looks at what changes, startled by the ears.
    p.look({ x: 920, y: 330 }, { at: EDITS[0].at });
    p.play(boing, { at: EDITS[0].apply, fade: 0 });
    p.emote('!', { at: EDITS[0].apply });
    p.look('viewer', { at: at('26.2') });
    p.look({ x: 1470, y: 420 }, { at: EDITS[1].at });
    p.look({ x: PLACE.x + 160, y: PLACE.floor - 40 }, { at: EDITS[1].apply });
    p.look({ x: 940, y: 600 }, { at: EDITS[2].at });
    p.look('viewer', { at: EDITS[2].apply });
    p.look({ x: HEY.x + 60, y: HEY.y - 20 }, { at: at('28.1') });
    p.look('viewer', { at: at('28.2') });
  });

  // phy writes "hey."; on the beats after it, the caret undoes the three edits, the last first.
  const HEY = { x: 860, y: 486 };
  k.ui.hand(pageA.over, 'hey.', { x: HEY.x, y: HEY.y, at: '28.1', until: '29.1' });

  // ===================================================================== V. The white (31-36, page A at night)

  k.shot('A', '31.1', '37.1');

  // The night's paper, which the gallery's dusk takes too (exports.night). On page A the night is a flat
  // tone over the whole page, phy included, so that the paws stand off the paper no more than they do by
  // day, which is the trouble. The renders are shown as they would be drawn on the day's paper, over it.
  const NIGHT_PAPER = { paper: '#e3ddd0', rule: '#bfc9d3', grain: 1.3 };
  const NIGHT_TINT = tintBetween(PAPER, NIGHT_PAPER.paper);
  k.draw(pageA.screen, '31.1', '37.1', el => {
    if (el.firstChild) return;
    el.classList.add('sh-fill', 'sh-method-night');
    el.innerHTML = `<div style="position:absolute;inset:0;background:${NIGHT_TINT};mix-blend-mode:multiply"></div>`;
  });

  // The multiply tint that turns one paper color into another, channel by channel.
  function tintBetween(day, night) {
    const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const d = rgb(day), n = rgb(night);
    return `rgb(${d.map((v, i) => Math.round(clamp(n[i] / v, 0, 1) * 255)).join(',')})`;
  }

  // CIE76 between two colors, as test/raster.js measures how a part shows against the paper.
  function deltaE(c0, c1) {
    const lab = hex => {
      const linear = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
      const [red, green, blue] = [1, 3, 5].map(i => linear(parseInt(hex.slice(i, i + 2), 16)));
      const f = v => (v > 216 / 24389 ? Math.cbrt(v) : (24389 / 27 * v + 16) / 116);
      const x = f((0.4124 * red + 0.3576 * green + 0.1805 * blue) / 0.95047), y = f(0.2126 * red + 0.7152 * green + 0.0722 * blue);
      const z = f((0.0193 * red + 0.1192 * green + 0.9505 * blue) / 1.08883);
      return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
    };
    const p = lab(c0), q = lab(c1);
    return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  }
  const JUST_VISIBLE = 4;                          // test/raster.js: the least difference that shows.
  const READINGS = [deltaE(WHITE.old, PAPER), deltaE(WHITE.now, PAPER)];

  // phy notices (31.1-31.2.5), calls Claude (31.3.5-32.4), which comes and opens its laptop (33.1-33.4);
  // Claude renders the paws (34.1); phy asks (34.2); Claude retypes the white (34.4) and renders again
  // (35.2); phy compares (35.3) and approves (36.1).
  const NIGHT = {
    look: at('31.1'), puzzled: at('31.1.5'), ring: at('31.2'), move: at('31.2.5'), call: at('31.3.5'), enter: at('33.1'), laptop: at('33.3'),
    renders: [at('34.1'), WHITE.at], ask: at('34.1.75'), retype: at('34.4'), compare: at('35.3'), there: at('36.1'),
  };
  const claudeId = LAYOUT_B.claude;
  const CLAUDE_X = PLACE.x - 6 * RULE;

  // The camera: close on phy and their paws as they notice; then, as phy calls, back to the shot that
  // holds still to the end of the night: phy on the right, Claude's place left of them, and the paper on
  // the left for phy's call and then for the renders, so that before and after are seen side by side.
  const STILL = { x: 770, y: 405, zoom: 1.3 };
  k.camera('A', k.frame('A', { top: 300, bottom: PLACE.floor + 26, x: PLACE.x + 20, zoom: 1.75 }), { at: '31.1' });
  k.camera('A', STILL, { at: NIGHT.move, duration: B.BEAT, ease: 'inOut' });
  // Page A's camera goes back to the whole page for the next section to set as it wishes.
  k.camera('A', { x: 960, y: 540, zoom: 1 }, { at: '37.1' });
  // Frame pixels to page A's head units, under the still camera.
  const onPage = (fx, fy) => ({ x: STILL.x + (fx - k.FRAME.width / 2) / (STILL.zoom * pageA.fit), y: STILL.y + (fy - k.FRAME.height / 2) / (STILL.zoom * pageA.fit) });

  // phy rings their paws, in graphite, as they notice them: a loop drawn on, kept until the first render.
  const PAWS = { x: PLACE.x, y: PLACE.floor - 22, w: 196, h: 64 };
  k.draw(pageA.over, NIGHT.ring, NIGHT.renders[0], (el, t) => {
    if (!el.firstChild) {
      const rx = PAWS.w / 2 + 26, ry = PAWS.h / 2 + 16, cx = PAWS.x, cy = PAWS.y + 4;
      el.innerHTML = `<svg class="sh-method-ring" width="1" height="1"><path pathLength="1" d="M${cx + rx * 0.2} ${cy - ry}` +
        `C${cx - rx * 0.6} ${cy - ry * 1.08} ${cx - rx * 1.04} ${cy - ry * 0.5} ${cx - rx} ${cy + ry * 0.05}` +
        `S${cx - rx * 0.3} ${cy + ry * 1.1} ${cx + rx * 0.15} ${cy + ry}S${cx + rx * 1.02} ${cy + ry * 0.3} ${cx + rx * 0.96} ${cy - ry * 0.2}` +
        `S${cx + rx * 0.2} ${cy - ry * 1.12} ${cx - rx * 0.35} ${cy - ry * 0.86}"/></svg>`;
    }
    el.firstChild.firstChild.setAttribute('stroke-dasharray', `${ramp(NIGHT.ring, NIGHT.ring + 0.32, t, A.ease.inOut)} 1`);
    el.style.opacity = String(1 - ramp(NIGHT.renders[0] - 0.2, NIGHT.renders[0], t));
  });

  // phy calls Claude, in two lines on the rules left of phy, written quickly, and rubbed out as the
  // renders take the paper.
  const BELL = [{ text: 'Claude — come here —', rule: 5 }, { text: 'I want to see you.', rule: 7 }];
  const bellRight = PLACE.x - 110, BELL_UNTIL = at('34.1');
  const bell1 = k.ui.hand(pageA.over, BELL[0].text, { x: bellRight, y: BELL[0].rule * RULE, align: 'right', at: NIGHT.call, seconds: 1.2, until: BELL_UNTIL, fadeOut: 0.35 });
  k.ui.hand(pageA.over, BELL[1].text, { x: bellRight, y: BELL[1].rule * RULE, align: 'right', at: bell1.end + 0.1, seconds: 1.0, until: BELL_UNTIL, fadeOut: 0.35 });

  // Claude's routine (characters/claude/claude.js): from stepping aside, the laptop swung up and set down
  // open, the hop round to sit side-on, then the typing, round and round, until the night is over.
  const claudeSpec = PF.get(claudeId);
  const routine = A.track(claudeSpec.routine.keys, { duration: claudeSpec.routine.duration });
  const ROUTINE = { from: 0.39, typing: [1.48, 2.52] };
  const laptopClip = A.clip(local => {
    const lead = ROUTINE.typing[0] - ROUTINE.from;
    if (local < lead) return routine(ROUTINE.from + local);
    const span = ROUTINE.typing[1] - ROUTINE.typing[0];
    return routine(ROUTINE.typing[0] + ((local - lead) % span));
  });

  // The renders, as cards of day paper over the night, side by side over the paper's left: the paws and
  // feet alone, drawn as the render drew them, large, on the paper they are measured against, in a
  // dashed frame like the one round the paws as each is taken. The first holds the old white, the
  // second the new one.
  // As large as the frame holds them above phy and Claude, so that the change in the paws can be seen at
  // a phone's width.
  const CARD = { w: 760, h: 250, scale: 4.5, middle: [0, 117], y: 200, x: [40, 830], pop: B.BEAT / 4, paper: PAPER,
    parts: ['pawL', 'pawR', 'footL', 'footR'] };
  const cardView = { w: CARD.w, h: CARD.h, x: CARD.w / 2 - CARD.middle[0] * CARD.scale, y: CARD.h / 2 - CARD.middle[1] * CARD.scale, scale: CARD.scale, rotate: 0 };
  NIGHT.renders.forEach((when, i) => {
    const from = when + CARD.pop, x = CARD.x[i], uid = `sh-method-render-${i}`;
    const drawn = new Map();
    k.draw(pageA.screen, from, '37.1', (el, t) => {
      if (!el.firstChild) {
        el.className += ' sh-method-card';
        el.innerHTML = `<div style="left:${x}px;top:${CARD.y}px;width:${CARD.w}px;height:${CARD.h}px;background:${CARD.paper}"></div>` +
          `<svg class="sh-method-render" width="1" height="1"><rect x="${x - 10}" y="${CARD.y - 10}" width="${CARD.w + 20}" height="${CARD.h + 20}" rx="8"/></svg>`;
      }
      // The render: the drawing at the render's time, in the boil of the frame shown, with every part but
      // the paws and feet left out.
      const variant = String(Math.floor(t * k.BOIL + 1e-9) % PF.pencil.settings.variants), card = el.firstChild;
      if (card.dataset.variant !== variant) {
        if (!drawn.has(variant)) drawn.set(variant, phyDrawn.svg(t, { era: when, view: cardView, pose: {}, uid }));
        card.dataset.variant = variant;
        card.innerHTML = drawn.get(variant);
        keepOnly(card.firstChild, CARD.parts);
      }
      const pop = ramp(from, from + 0.14, t, A.ease.back);
      el.style.opacity = String(Math.min(1, pop * 3));
      el.style.transform = `translate(${x + CARD.w / 2}px, ${CARD.y + CARD.h / 2}px) scale(${lerp(0.9, 1, pop)}) translate(${-(x + CARD.w / 2)}px, ${-(CARD.y + CARD.h / 2)}px)`;
    });
  });

  // Leaves out every named part of a drawing but those given (and what holds them).
  function keepOnly(svg, names) {
    const kept = names.map(name => svg.querySelector(`[data-pf="${name}"]`)).filter(Boolean);
    for (const node of svg.querySelectorAll('[data-pf]')) {
      if (!kept.some(part => part === node || part.contains(node) || node.contains(part))) node.style.display = 'none';
    }
  }

  // The renders' moment: a dashed frame flashes round the paws, as a render is taken.
  for (const when of NIGHT.renders) {
    k.draw(pageA.over, when, when + 0.75, (el, t) => {
      if (!el.firstChild) {
        el.innerHTML = `<svg class="sh-method-render" width="1" height="1"><rect x="${PAWS.x - PAWS.w / 2}" y="${PAWS.y - PAWS.h / 2}" ` +
          `width="${PAWS.w}" height="${PAWS.h}" rx="6"/></svg>`;
      }
      const u = (t - when) / 0.75;
      el.firstChild.style.opacity = String(u < 0.08 ? u / 0.08 : 1 - ramp(0.45, 1, u, A.ease.inOut));
    });
  }

  // The meter under the cards: a penciled scale of the paws' difference from the paper, a mark at the
  // house's "just visible", and the reading, which jumps when the new white is rendered.
  // Its scale runs under the cards from the left, short of phy's ears.
  const METER = (() => {
    const left = onPage(CARD.x[0] + 30, 605), right = onPage(1230, 605);
    return { x: left.x, y: left.y, unit: (right.x - left.x) / 6, max: 6 };
  })();
  const METER_TEXT = { note: k.ui.sizeFor('label', pageA.over, NIGHT.renders[0]), reading: 1.25 * k.ui.sizeFor('label', pageA.over, NIGHT.renders[0]) };
  const readingAt = t => (t < NIGHT.renders[1] + CARD.pop ? READINGS[0] : READINGS[1]);
  k.draw(pageA.over, NIGHT.renders[0] + CARD.pop, '37.1', (el, t) => {
    if (!el.firstChild) {
      const ticks = Array.from({ length: METER.max + 1 }, (_, i) =>
        `<path d="M${METER.x + i * METER.unit} ${METER.y - (i % 2 ? 5 : 8)}v${i % 2 ? 10 : 16}" class="tick" data-at="${i / METER.max}"/>`).join('');
      const mark = METER.x + JUST_VISIBLE * METER.unit;
      el.innerHTML = `<svg class="sh-method-meter" width="1" height="1">` +
        `<path d="M${METER.x - 4} ${METER.y}C${METER.x + 100} ${METER.y - 1.2} ${METER.x + 200} ${METER.y + 1} ${METER.x + METER.max * METER.unit + 4} ${METER.y}" ` +
        `pathLength="1" class="scale"/>${ticks}<path d="M${mark} ${METER.y - 34}v44" class="just"/><g class="bar"></g></svg>` +
        `<p class="sh-method-meter-note hand" style="font-size:${METER_TEXT.note}px">just visible</p>` +
        `<p class="sh-method-meter-reading hand" style="font-size:${METER_TEXT.reading}px"></p>`;
    }
    // The scale draws itself left to right; the reading's bar follows; then its number.
    const from = NIGHT.renders[0] + CARD.pop;
    const drawn = ramp(from, from + 0.4, t, A.ease.out);
    const value = readingAt(t), reach = Math.min(value, METER.max) * METER.unit * ramp(from + 0.15, from + 0.5, t, A.ease.out);
    const svg = el.firstChild;
    svg.querySelector('.scale').setAttribute('stroke-dasharray', `${drawn} 1`);
    for (const tick of svg.querySelectorAll('.tick')) tick.style.opacity = drawn >= Number(tick.dataset.at) ? '' : '0';
    svg.querySelector('.just').style.opacity = drawn >= JUST_VISIBLE / METER.max ? '' : '0';
    svg.querySelector('.bar').innerHTML = hatch(METER.x, METER.y - 9, reach, 18);
    const note = el.querySelector('.sh-method-meter-note');
    note.style.transform = `translate(${METER.x + JUST_VISIBLE * METER.unit}px, ${METER.y - 40}px) translate(-50%, -100%) rotate(-1deg)`;
    note.style.opacity = String(ramp(from + 0.25, from + 0.45, t));
    const reading = el.querySelector('.sh-method-meter-reading');
    const words = `ΔE ${value.toFixed(1)}`;
    if (reading.textContent !== words) reading.textContent = words;
    // Under the scale, ending where the reading's bar ends, clear of Claude beside it.
    reading.style.transform = `translate(${METER.x + Math.max(reach, 160)}px, ${METER.y + 24}px) translate(-100%, 0) rotate(-1deg)`;
    reading.style.opacity = String(ramp(from + 0.35, from + 0.5, t));
    if (t >= from + 0.5) {
      k.ui.legible(note, 'label', t, 'just visible', { size: METER_TEXT.note });
      k.ui.legible(reading, 'label', t, words, { size: METER_TEXT.reading });
    }
  });

  // A bar of pencil hatching, x0 to x0 + w, its top at y, h tall: strokes leaning as a right hand shades.
  function hatch(x0, y, w, h) {
    if (w <= 0) return '';
    let d = '';
    for (let x = x0 + 2; x < x0 + w; x += 6) d += `M${x} ${y + h}L${Math.min(x + 8, x0 + w)} ${y}`;
    return `<path d="${d}" class="hatch"/><path d="M${x0} ${y + h}L${x0 + w} ${y + h}" class="hatch-edge"/>`;
  }

  // phy asks, in words, above their head: a shade darker; the words are rubbed out as the second render
  // comes to take their place.
  const ASK = { right: onPage(1860, 0).x, rules: [5, 7], until: NIGHT.renders[1] + CARD.pop };
  const ask1 = k.ui.hand(pageA.over, 'a shade', { x: ASK.right, y: ASK.rules[0] * RULE, align: 'right', at: NIGHT.ask, seconds: 0.42, until: ASK.until, fadeOut: 0.12 });
  k.ui.hand(pageA.over, 'darker.', { x: ASK.right, y: ASK.rules[1] * RULE, align: 'right', at: ask1.end + 0.06, seconds: 0.36, until: ASK.until, fadeOut: 0.12 });

  // The line of the white, typed large over the renders: Claude retypes it, the old digits out and the
  // new in, a thirty-second each, so that it is done on the downbeat and held before the second render.
  const CODE10 = { ...onPage(580, 125), size: k.ui.sizeFor('typed', pageA.over, NIGHT.retype) };
  const whiteEdit = { find: WHITE.old, replace: WHITE.now, at: NIGHT.retype, step: B.SIXTEENTH / 2 };
  const whiteLine = textOf(LINE.face).replace(`'${WHITE.now}'`, `'${WHITE.old}'`).trim();
  const whiteDone = whiteEdit.at + typedSteps(whiteEdit) * whiteEdit.step;
  k.draw(pageA.over, NIGHT.retype - B.BEAT / 4, NIGHT.there, (el, t) => {
    if (!el.firstChild) {
      el.className += ' sh-typed';
      el.innerHTML = `<p style="font-size:${CODE10.size}px"><span class="sh-n">${LINE.face}</span><span class="sh-t"></span><span class="sh-caret"></span></p>`;
    }
    const p = el.firstChild, { text, caret } = edited(whiteLine, whiteEdit, t, B.BEAT);
    const span = p.querySelector('.sh-t');
    if (span.dataset.text !== text) { span.dataset.text = text; span.innerHTML = withSwatch(text); }
    const c = p.querySelector('.sh-caret');
    c.hidden = caret == null;
    if (caret != null) c.style.left = `calc(.45em + ${String(LINE.face).length + 1.2 + caret}ch + ${SWATCH_EM}em)`;
    const from = NIGHT.retype - B.BEAT / 4, pop = ramp(from, from + 0.14, t, A.ease.back), fade = 1 - ramp(NIGHT.there - 0.2, NIGHT.there, t);
    p.style.opacity = String(Math.min(pop * 3, 1) * fade);
    p.style.transform = `translate(${CODE10.x}px, ${CODE10.y}px) translate(-50%, -50%) rotate(-1deg) scale(${lerp(0.8, 1, pop)})`;
    if (t >= whiteDone) k.ui.legible(p, 'typed', t, text, { size: CODE10.size, face: 'mono' });
  });

  // A line as markup, with a swatch before its color's literal (colors beside their swatches, as the
  // listing shows them): the color once all six digits are typed, and an empty box while it is typed.
  const SWATCH_EM = 0.85;
  function withSwatch(text) {
    const m = /'#([0-9a-fA-F]*)'?/.exec(text);
    if (!m) return escapeHtml(text);
    const whole = /^[0-9a-fA-F]{6}$/.test(m[1]);
    return escapeHtml(text.slice(0, m.index)) +
      `<i class="sh-swatch"${whole ? ` style="background:#${m[1]}"` : ''}></i>` + escapeHtml(text.slice(m.index));
  }

  // phy judges: a graphite tick of their own on the second render, and "there." beside it.
  const TICK = { x: CARD.x[1] + CARD.w - 34, y: CARD.y + 40, size: 96 };
  k.ui.mark(pageA.screen, 'tick', { x: TICK.x, y: TICK.y, w: TICK.size, h: TICK.size, at: NIGHT.there, until: '37.1', grow: 0.22 });
  const THERE = onPage(1860, 160);
  k.ui.hand(pageA.over, 'there.', { x: THERE.x, y: Math.round(THERE.y / RULE) * RULE, align: 'right', at: NIGHT.there + B.BEAT / 2, seconds: 0.4, until: '37.1' });

  k.cue('A', (scene, cast) => {
    const p = cast.phy, c = cast[claudeId];
    if (!p) return;
    const card = i => onPage(CARD.x[i] + CARD.w / 2, CARD.y + CARD.h / 2);
    p.look({ x: PLACE.x - 10, y: PLACE.floor + 70 }, { at: NIGHT.look });
    p.emote('?', { at: NIGHT.puzzled });
    p.look({ x: bellRight - 300, y: BELL[0].rule * RULE }, { at: NIGHT.call });
    if (c) {
      p.look(c, { at: NIGHT.enter + 0.2 });
      c.enter({ from: onPage(-160, 0).x, to: CLAUDE_X, at: NIGHT.enter, duration: 2 * B.BEAT, hops: 4 });
      c.play(laptopClip, { at: NIGHT.laptop, until: at('37.1'), fade: 0 });
      c.exit({ to: 'left', at: at('37.1'), duration: 0.05 });
    }
    p.look({ x: PLACE.x - 10, y: PLACE.floor + 60 }, { at: NIGHT.renders[0] });
    p.look(card(0), { at: NIGHT.renders[0] + B.BEAT / 2 });
    p.look({ x: ASK.right - 100, y: ASK.rules[0] * RULE - 40 }, { at: NIGHT.ask });
    p.look(CODE10, { at: NIGHT.retype });
    p.look({ x: PLACE.x - 10, y: PLACE.floor + 70 }, { at: NIGHT.renders[1] });
    p.look(card(1), { at: NIGHT.renders[1] + B.BEAT / 2 });
    p.look(card(0), { at: NIGHT.compare });
    p.look(card(1), { at: NIGHT.compare + B.BEAT });
    p.look({ x: THERE.x - 120, y: THERE.y - 30 }, { at: NIGHT.there + B.BEAT / 2 });
    p.look('viewer', { at: at('36.3') });
  });

  // ===================================================================== 38.3: the rice ball (page B)

  // Held at the top of the frame (the gallery's camera goes close on four friends under it as the numbers
  // are typed): the library's shared line as the film's era has it before the rice ball, and Claude
  // typing into it the numbers the era has once the bodies have changed, the square on the third beat's
  // "and", the taper on the fourth; the bodies follow at 39.1, while it is still in view. Both are read
  // from the era (the library's constants under the era at those times), so that the line always shows
  // the numbers the friends are drawn with. The line is set in two parts so that its numbers are as large
  // as typed numbers are: the file, the line's number and the name over the box, the object in it.
  const ONIGIRI = SayHi.source.onigiri;
  const [, onigiriName, onigiriObject] = ONIGIRI.text.match(/^(.*?=)\s*(\{.*)$/) || [];
  if (!onigiriObject || !/square: [\d.]+/.test(onigiriObject) || !/taper: [\d.]+/.test(onigiriObject)) throw new Error('say hi: the ONIGIRI line has no square or taper');
  // Where the box goes on the frame: the gallery's choice (exports.gallery.rice, frame pixels: the box's
  // middle), else the middle of the frame's top.
  const ricePlace = k.exportsOf('gallery').rice || {};
  const RICE = { from: at('38.3'), to: at('40.1'), settled: at('40.1'), x: ricePlace.x ?? k.FRAME.width / 2, y: ricePlace.y ?? 200,
    typing: [at('38.3.5'), at('38.4')], size: k.ui.sizeFor('typed', pageB.screen, 0), name: k.ui.sizeFor('label', pageB.screen, 0, 'mono') };
  // A number as the source writes it.
  const numeral = v => String(Math.round(v * 1000) / 1000);
  // The line before and the edits, from the era, worked out once every module has built (the era's
  // curves are all in place by the first frame drawn).
  let riceLine = null;
  function riceEdits() {
    if (riceLine) return riceLine;
    const read = t => k.era.under(t, () => ({ square: numeral(PF.ONIGIRI.square), taper: numeral(PF.ONIGIRI.taper) }));
    const was = read(RICE.from), now = read(RICE.settled);
    const before = onigiriObject.replace(/square: [\d.]+/, `square: ${was.square}`).replace(/taper: [\d.]+/, `taper: ${was.taper}`);
    const edits = ['square', 'taper'].map((key, i) => ({ find: `${key}: ${was[key]}`, replace: `${key}: ${now[key]}`, at: RICE.typing[i], step: B.SIXTEENTH }))
      .filter(e => e.find !== e.replace);
    const done = Math.max(RICE.from, ...edits.map(e => e.at + typedSteps(e) * e.step));
    riceLine = { before, edits, done };
    return riceLine;
  }
  k.draw(pageB.screen, RICE.from, RICE.to, (el, t) => {
    if (!el.firstChild) {
      el.className += ' sh-typed sh-method-rice';
      el.innerHTML = `<p class="name" style="font-size:${RICE.name}px"><span class="sh-file">${escapeHtml(ONIGIRI.file)}</span>` +
        `<span class="sh-n">${ONIGIRI.n}</span>${escapeHtml(onigiriName)}</p>` +
        `<p style="font-size:${RICE.size}px"><span class="sh-t"></span><span class="sh-caret"></span></p>`;
    }
    const [name, box] = el.children, line = riceEdits();
    // The edits one after the other, the caret where the latest one has it.
    let text = line.before, caret = null;
    for (const e of line.edits) {
      const step = edited(text, e, t, B.BEAT * 2);
      text = step.text;
      if (t >= e.at) caret = step.caret;
    }
    const span = box.querySelector('.sh-t');
    if (span.textContent !== text) span.textContent = text;
    const c = box.querySelector('.sh-caret');
    c.hidden = caret == null;
    if (caret != null) c.style.left = `calc(.45em + ${caret}ch)`;
    const pop = ramp(RICE.from, RICE.from + 0.16, t, A.ease.back), fade = 1 - ramp(RICE.to - B.SIXTEENTH, RICE.to, t);
    el.style.opacity = String(Math.min(1, pop * 3) * fade);
    box.style.transform = `translate(${RICE.x}px, ${RICE.y}px) translate(-50%, -50%) rotate(-1deg) scale(${lerp(0.8, 1, pop)})`;
    name.style.transform = `translate(${RICE.x}px, ${RICE.y - 0.62 * RICE.size}px) translate(-50%, -100%) rotate(-1deg)`;
    if (t >= line.done) {
      k.ui.legible(box, 'typed', t, text, { size: RICE.size, face: 'mono' });
      k.ui.legible(name, 'label', t, onigiriName, { size: RICE.name, face: 'mono' });
    }
  });

  // ===================================================================== 41-45.2: the tests (page B)

  // The recorded run (`python3 tools/pf.py test`, in demo/say-hi/source-data.js), verbatim and in its
  // order, in the band under the rows (pages.js): the newest name on the band's first line, a name a beat
  // in bar 41, an eighth in bar 42, a sixteenth in bar 43, and the rest through bar 44, quickening into the
  // swell, each ticked as it passes, while the count races up, large, at the line's right end. The two
  // tests the film's rules come from are kept on the second line as they pass. On the downbeat of bar 45
  // the count gives way to the run's own summary.
  k.shot('B', '41.1', '45.4');
  const TESTS = SayHi.source.tests;
  const RUN = TESTS.names;
  const KEEP = [/^every friend of the house turns its ears out/, /^strangers may share a scene, look at and greet each other$/];
  const SUMMARY_AT = at('45.1') - 1e-4;
  const passAt = (() => {
    const times = [], counts = [4, 8, 16], steps = [B.BEAT, B.BEAT / 2, B.SIXTEENTH];
    let t = at('41.1');
    counts.forEach((count, i) => { for (let j = 0; j < count && times.length < RUN.length; j++) { times.push(t); t += steps[i]; } });
    // The rest from a sixteenth after the last, each gap shorter than the one before, the last a frame
    // before the downbeat, so that the count reads every test on the frame before the summary.
    const rest = RUN.length - times.length, end = SUMMARY_AT - 1 / 30, from = t;
    const power = rest > 1 ? Math.log(B.SIXTEENTH / (end - from)) / Math.log(1 / rest) : 1;
    for (let j = 0; j < rest; j++) times.push(from + (end - from) * ((j + 1) / rest) ** power);
    return times;
  })();
  const passedBy = t => {
    let lo = 0, hi = passAt.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (passAt[mid] <= t) lo = mid + 1; else hi = mid; }
    return lo;
  };
  const kept = RUN.map((test, i) => ({ test, i })).filter(({ test }) => KEEP.some(re => re.test(test.name)));

  // The band shown with its two lines, eased to over two beats from the rows shown whole.
  const BAND = LAYOUT_B.band, PX = LAYOUT_B.perPixel;
  const TEST_CAMERA = LAYOUT_B.wide ? LAYOUT_B.wide.band[1] : LAYOUT_B.whole;
  k.camera('B', TEST_CAMERA, { at: '41.1', duration: 2 * B.BEAT, ease: 'inOut' });
  const COUNT = { size: k.ui.sizeFor('typed', pageB.over, at('41.3')), right: BAND.right, y: BAND.lines[0] };
  const SUMMARY = { size: 1.1 * COUNT.size, x: (BAND.left + BAND.right) / 2, y: BAND.lines[0] };
  const NAMES = { size: 36 * PX, x: BAND.left, y: BAND.lines[0], kept: 34 * PX };
  // The widest the count grows, "158 passed" in the typed box, and the room left of it for the names.
  const countWidth = (`${RUN.length} passed`.length * k.ui.TYPED_BOX.advance + 2 * k.ui.TYPED_BOX.padding) * COUNT.size;
  NAMES.width = COUNT.right - countWidth - 2 * RULE - NAMES.x;
  const STREAM = { from: at('41.1'), to: at('45.4'), out: [SUMMARY_AT - 0.02, SUMMARY_AT] };

  // The names shown are those that fit whole on at most two lines left of the count (a viewer reads none
  // cut short), each when it passes, while the count goes on counting every test: as indices into the
  // run, with each name's lines.
  const NAME_CHARS = Math.floor((NAMES.width - 1.35 * NAMES.size) / (NAMES.size * ADV / CODE.size));
  const NAME_LINES = RUN.map(test => wrapWords(test.name, NAME_CHARS));
  const SHOWN = RUN.map((test, i) => i).filter(i => NAME_LINES[i].length <= 2 && NAME_LINES[i].every(line => line.length <= NAME_CHARS));
  // The newest name shown by t, as its place in SHOWN (-1 before the first).
  const shownBy = t => {
    let lo = 0, hi = SHOWN.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (passAt[SHOWN[mid]] <= t) lo = mid + 1; else hi = mid; }
    return lo - 1;
  };

  // The newest name alone on the first line: typed on as it passes, a character at a time behind the
  // editor's bar, in at most half the time it is up, and ticked; it gives way to the next at once, so
  // that no two names ever share the line, however fast they come (the speed is in how many pass a beat
  // and in the count, not in names stacked on one another).
  const TYPING = { most: 0.12, share: 0.5 };
  k.draw(pageB.over, STREAM.from, STREAM.to, (el, t) => {
    if (!el.firstChild) {
      el.className += ' sh-method-stream';
      el.innerHTML = `<p class="mono" style="font-size:${NAMES.size}px"><i class="tick"></i><span class="lines"></span></p>`;
    }
    const last = shownBy(t), row = el.firstChild, index = last >= 0 ? SHOWN[last] : -1;
    el.style.opacity = String(1 - ramp(STREAM.out[0], STREAM.out[1], t));
    row.style.display = index >= 0 ? '' : 'none';
    if (index < 0) return;
    const up = (last + 1 < SHOWN.length ? passAt[SHOWN[last + 1]] : STREAM.to) - passAt[index];
    const lines = NAME_LINES[index], total = lines.reduce((n, line) => n + line.length, 0);
    const typing = ramp(passAt[index], passAt[index] + Math.min(TYPING.most, TYPING.share * up), t, A.ease.linear);
    let left = Math.ceil(total * typing), barred = typing >= 1;
    // Each line in two parts, the typed and the rest (laid out but not shown, so that nothing moves as it
    // is typed), with the bar between them on the line being typed.
    row.lastChild.innerHTML = lines.map(line => {
      const n = clamp(left, 0, line.length), at = !barred && left <= line.length;
      barred = barred || at;
      left -= line.length;
      return `<span><span>${escapeHtml(line.slice(0, n))}</span>${at ? '<i class="at"></i>' : ''}<span class="rest">${escapeHtml(line.slice(n))}</span></span>`;
    }).join('');
    row.style.transform = `translate(${NAMES.x}px, ${NAMES.y}px) translateY(-0.82em)`;
    row.firstChild.style.clipPath = `inset(-20% ${100 - 100 * ramp(passAt[index], passAt[index] + Math.min(0.1, up), t)}% -20% 0)`;
    row.classList.toggle('kept', kept.some(x => x.i === index));
  });

  // The two kept, each written out on the band's second line as it passes and held there, its tick
  // drawn first; the second takes the first's place.
  const KEPT = { x: BAND.left, y: BAND.lines[1], size: NAMES.kept, to: STREAM.to, width: BAND.right - BAND.left };
  kept.forEach(({ test, i }, n) => {
    const lines = wrapWords(test.name, Math.floor(KEPT.width / (KEPT.size * ADV / CODE.size)) - 3);
    const until = n + 1 < kept.length ? passAt[kept[n + 1].i] : KEPT.to;
    k.draw(pageB.over, passAt[i], until, (el, t) => {
      if (!el.firstChild) {
        el.className += ' sh-method-kept';
        el.innerHTML = lines.map((line, j) => `<p class="mono" style="font-size:${KEPT.size}px">${j ? '<i class="pad"></i>' : '<i class="tick"></i>'}<span>${escapeHtml(line)}</span></p>`).join('');
      }
      const written = ramp(passAt[i] + 0.06, passAt[i] + 0.06 + 0.3, t, A.ease.linear);
      [...el.children].forEach((p, j) => {
        p.style.transform = `translate(${KEPT.x}px, ${KEPT.y + j * KEPT.size * 1.3}px) translateY(-0.82em) rotate(-0.4deg)`;
        const share = clamp(written * lines.length - j, 0, 1);
        p.lastChild.style.clipPath = `inset(-20% ${100 - 100 * share}% -20% 0)`;
        p.firstChild.style.clipPath = j ? '' : `inset(-20% ${100 - 100 * ramp(passAt[i], passAt[i] + 0.1, t)}% -20% 0)`;
      });
      el.style.opacity = String(1 - 0.5 * ramp(SUMMARY_AT, SUMMARY_AT + 0.2, t));
    });
  });

  // The run checks every friend of the house (its first test checks each friend's anatomy, and many
  // after it every friend's parts, poses and feelings): a graphite tick lands over each house friend in
  // turn, along the rows from the left, quickening with the run, one a beat in bars 41 and 42 and two a
  // beat in bar 43; in bar 44, as the last hundred and more tests race by, every tick pulses on each
  // sixteenth, a ripple along the rows; the song on the downbeat takes their place.
  const ticked = LAYOUT_B.slots.filter(slot => slot.name && slot.name !== LAYOUT_B.claude);
  const TICKS = { size: 36 * PX, ripple: 0.014, rise: 5.65 * RULE, pop: 0.35, decay: 0.08, out: [SUMMARY_AT - 0.08, SUMMARY_AT] };
  const tickAt = ticked.map((slot, j) => (j < 8 ? at('41.1') + j * B.BEAT : at('43.1') + (j - 8) * B.BEAT / 2));
  const PULSES = { from: at('44.1'), step: B.SIXTEENTH };
  if (tickAt[tickAt.length - 1] >= PULSES.from) throw new Error('say hi: the ticks over the friends do not all land before bar 44');
  // The latest moment at or before t at which a tick pops: when it lands, or a sixteenth of bar 44.
  const popOf = (j, t) => {
    if (t < tickAt[j]) return null;
    if (t < PULSES.from) return tickAt[j];
    return PULSES.from + Math.floor((t - PULSES.from) / PULSES.step + 1e-9) * PULSES.step;
  };
  k.draw(pageB.over, tickAt[0], SUMMARY_AT, (el, t) => {
    if (!el.firstChild) {
      el.innerHTML = `<svg class="sh-method-ticks" width="1" height="1">${ticked.map(() => '<path d="M5.2 10.6c1.6 1.2 2.8 2.8 3.7 4.9C11.4 9.6 15 4.6 21 .8"/>').join('')}</svg>`;
    }
    const out = 1 - ramp(TICKS.out[0], TICKS.out[1], t), scale = TICKS.size / 22;
    [...el.firstChild.children].forEach((path, j) => {
      const slot = ticked[j], delay = t >= PULSES.from ? j * TICKS.ripple : 0, pop = popOf(j, t - delay);
      if (pop === null) { path.style.display = 'none'; return; }
      path.style.display = '';
      const since = t - delay - pop, grow = 1 + TICKS.pop * Math.exp(-since / TICKS.decay);
      const drawn = clamp((t - tickAt[j]) / 0.06, 0, 1);
      const x = slot.x, y = slot.y - TICKS.rise - TICKS.size / 2;
      path.setAttribute('transform', `translate(${x} ${y}) scale(${scale * grow * (0.6 + 0.4 * drawn)}) translate(-11 -11)`);
      path.style.opacity = String(out * drawn);
    });
  });

  // The camera leans in over the last two bars of the run, quickening, and snaps back on the downbeat, as
  // far as keeps every face, "you?" (the gallery's export) and the band's two lines in the frame, centered
  // between the outermost of them.
  const LEAN = (() => {
    const fit = pageB.fit, base = TEST_CAMERA.zoom ?? 1, you = k.exportsOf('gallery').you;
    const edges = LAYOUT_B.slots.flatMap(slot => [slot.x - 0.7 * slot.left, slot.x + 0.7 * slot.right]);
    if (you) edges.push(you.x - you.width / 2, you.x + you.width / 2);
    const left = Math.min(...edges), right = Math.max(...edges), x = (left + right) / 2;
    let most = Math.min(1.08, (k.FRAME.width / 2 - 12) / (((right - left) / 2) * fit * base));
    const low = (BAND.lines[1] + 1.6 * NAMES.kept - TEST_CAMERA.y) * fit * base;
    if (low > 0) most = Math.min(most, (k.FRAME.height / 2 - 8) / low);
    return { x, zoom: base * Math.max(1, most) };
  })();
  k.camera('B', LEAN, { at: '43.1', duration: at('45.1') - at('43.1') - 1 / 30, ease: 'in' });
  k.camera('B', TEST_CAMERA, { at: '45.1' });

  // Wraps words into lines of at most `width` characters.
  function wrapWords(text, width) {
    const lines = [];
    for (const word of text.split(' ')) {
      const line = lines[lines.length - 1];
      if (line && line.length + 1 + word.length <= width) lines[lines.length - 1] = `${line} ${word}`;
      else lines.push(word);
    }
    return lines;
  }

  // The count, in the typed style at the first line's right end: the number passed, racing up through
  // the run, the pill caret after it.
  k.draw(pageB.over, STREAM.from, SUMMARY_AT, (el, t) => {
    if (!el.firstChild) {
      el.className += ' sh-typed sh-method-count';
      el.innerHTML = `<p style="font-size:${COUNT.size}px;padding-right:1em"><span class="sh-t"></span><span class="sh-caret pill"></span></p>`;
    }
    const p = el.firstChild, words = `${passedBy(t)} passed`, span = p.firstChild;
    if (span.textContent !== words) span.textContent = words;
    p.lastChild.style.left = `calc(.5em + ${words.length}ch)`;
    const pop = ramp(STREAM.from, STREAM.from + 0.14, t, A.ease.back);
    p.style.opacity = String(Math.min(1, pop * 3));
    p.style.transform = `translate(${COUNT.right}px, ${COUNT.y - k.ui.TYPED_BOX.baseline * COUNT.size}px) translate(-100%, -50%) rotate(-1.5deg) scale(${lerp(0.85, 1, pop)})`;
    if (t >= STREAM.from + 0.2) k.ui.legible(p, 'typed', t, words, { size: COUNT.size, face: 'mono' });
  });
  // On the downbeat, the run's own summary, larger, in the middle of the band, whole on its first frame.
  k.draw(pageB.over, SUMMARY_AT, STREAM.to, (el, t) => {
    if (!el.firstChild) {
      el.className += ' sh-typed sh-method-summary';
      el.innerHTML = `<p style="font-size:${SUMMARY.size}px"><i class="tick"></i><span class="sh-t">${escapeHtml(TESTS.summary)}</span></p>`;
    }
    const p = el.firstChild, land = ramp(SUMMARY_AT, SUMMARY_AT + 0.18, t, A.ease.out);
    p.style.transform = `translate(${SUMMARY.x}px, ${SUMMARY.y - k.ui.TYPED_BOX.baseline * SUMMARY.size}px) translate(-50%, -50%) rotate(-1.5deg) scale(${lerp(1.08, 1, land)})`;
    k.ui.legible(p, 'typed', t, TESTS.summary, { size: SUMMARY.size, face: 'mono' });
  });

  // ===================================================================== Exports and styles

  Object.assign(k.exports, {
    night: NIGHT_PAPER,                                         // The night's paper, rules and grain (the gallery's dusk).
  });

  // The advance of the system monospace at a size, measured in the page.
  function measureAdvance(size) {
    const probe = document.createElement('span');
    probe.className = 'mono';
    probe.style.cssText = `position:absolute;left:0;top:0;white-space:pre;font-size:${size}px;font-family:var(--mono)`;
    probe.textContent = '0'.repeat(20);
    pageA.under.appendChild(probe);
    const advance = probe.offsetWidth / 20;
    probe.remove();
    return advance || size * 0.6;
  }

  // This module's own styles: the listing's lit lines, the slipping g, the map, the ring, the renders,
  // the meter, the rice ball's line and the run.
  function injectStyles() {
    if (document.getElementById('sh-method-styles')) return;
    const style = document.createElement('style');
    style.id = 'sh-method-styles';
    style.textContent = `
      .sh-method-listing .sh-line { transition: none; }
      .sh-method-listing .sh-line.sh-method-lit { font-weight: 600; color: var(--ink); }
      .sh-method-listing .sh-n { font-weight: 400; }
      .sh-method-listing .sh-line.faint.sh-method-quiet { opacity: .3; }
      .sh-method-folds, .sh-method-map, .sh-method-render, .sh-method-meter, .sh-method-slip, .sh-method-ring { position: absolute; left: 0; top: 0; overflow: visible; }
      .sh-method-slip path, .sh-method-ring path { fill: none; stroke: var(--ink); stroke-linecap: round; filter: url(#graphite); }
      .sh-method-ring path { stroke-width: 3.4; stroke-opacity: .85; }
      .sh-method-map .trail { fill: none; stroke: var(--ink); stroke-opacity: .7; stroke-width: 1.6; stroke-linecap: round; }
      .sh-method-map .trail.long { stroke-opacity: .6; }
      .sh-method-map .bit { fill: none; stroke: var(--ink); stroke-opacity: .85; stroke-width: 2; stroke-linecap: round; }
      .sh-method-render rect { fill: none; stroke: var(--ink); stroke-width: 2.4; stroke-dasharray: 9 7; stroke-linecap: round; }
      .sh-method-card > div { position: absolute; overflow: hidden; }
      .sh-method-card > div > svg { display: block; }
      .sh-method-meter .scale, .sh-method-meter .tick { fill: none; stroke: var(--ink); stroke-opacity: .8; stroke-width: 2.4; stroke-linecap: round; }
      .sh-method-meter .just { fill: none; stroke: var(--ink); stroke-width: 2.6; stroke-dasharray: 5 5; stroke-linecap: round; }
      .sh-method-meter .hatch { fill: none; stroke: var(--ink); stroke-opacity: .75; stroke-width: 2.2; stroke-linecap: round; }
      .sh-method-meter .hatch-edge { fill: none; stroke: var(--ink); stroke-width: 2.6; stroke-linecap: round; }
      .sh-method-meter-note, .sh-method-meter-reading { position: absolute; left: 0; top: 0; margin: 0; white-space: pre; line-height: 1;
        font-family: var(--face); font-weight: 300; color: var(--ink); transform-origin: 0 0; }
      .sh-method-meter-note { color: var(--ink-2); }
      .sh-method-rice p.name { background: none; padding: 0; font-weight: 400; transform-origin: 50% 100%; }
      .sh-method-rice p.name .sh-file { position: static; font-size: .6em; margin-right: 1.2ch; }
      .sh-method-rice p.name .sh-n { margin-right: 1ch; }
      .sh-method-stream p, .sh-method-kept p { position: absolute; left: 0; top: 0; margin: 0; white-space: pre;
        line-height: 1; color: var(--ink-2); font-family: var(--mono); font-variation-settings: normal !important; transform-origin: 0 50%; }
      .sh-method-stream .lines { display: inline-flex; flex-direction: column; line-height: 1.25; }
      .sh-method-stream .rest { visibility: hidden; }
      .sh-method-stream .at { display: inline-block; position: relative; width: 0; height: 1em; vertical-align: -.2em; }
      .sh-method-stream .at::before { content: ''; position: absolute; left: .04em; top: 0; bottom: 0; width: .12em; border-radius: .06em; background: var(--ink); }
      .sh-method-stream p.kept, .sh-method-kept p { color: var(--ink); }
      .sh-method-kept p span { font-weight: 600; }
      .sh-method-stream .tick, .sh-method-kept .tick, .sh-method-kept .pad, .sh-method-summary .tick { display: inline-block; width: .8em; height: .8em;
        margin-right: .55em; vertical-align: -.05em; background: var(--mark-tick) 0 0 / 100% 100% no-repeat; }
      .sh-method-kept .pad { background: none; }
      .sh-method-ticks { position: absolute; left: 0; top: 0; overflow: visible; filter: url(#graphite); }
      .sh-method-ticks path { fill: none; stroke: var(--ink); stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
    `;
    document.head.appendChild(style);
  }
});
