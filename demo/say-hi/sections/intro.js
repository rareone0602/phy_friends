/*!
 * say hi, bars 1-4 (the intro, page A): a line of phy's spec becomes a pair of eyes.
 *
 * Frame 0 is the start of one line of characters/phy/phy.js on a rule, `eyes:`, close and large, with
 * the typist's caret at its end, a pill as tall as the text. A graphite copy of the colon lifts off the
 * line (the line itself never changes) and, beside a penciled arrow, tips a quarter turn so that its dots
 * lie side by side. Then the rest of the line is typed, and each number acts on the dots as it is
 * typed and lights up: x parts them, y raises them to the rule above, w and h stretch them, tilt leans
 * them. The camera draws back to keep the line and the dots in view. The library's own eyes take their
 * place, looking down at the line, and look up at you. From the last eighth of bar 1, as soon as they
 * meet your eyes, they blink a pattern, a sixteenth note to a unit, and the rule under them takes a
 * penciled dash or dot for each blink as it happens. In bar 4 they glance down, to where a thumb rests,
 * and back up at you, with a touch of blush.
 *
 * The line's number stands in a gutter, as an editor shows it: smaller and lighter than the code, with a
 * penciled rule between them, so that it reads as the line's place in the file and not as a count.
 *
 * The film loops: its last frame is frame 0 again (sections/finale.js draws it with this module's
 * painters, exports.frame0).
 *
 * This module also holds the era of the house's standing template (see below), since it is built
 * first and every other module may read it when it is built.
 *
 * The reference section for the others (see HANDOFF.md): a shot, a camera, drawers that are pure
 * functions of t, a friend drawn outside the scene through k.friend, and a hand-over to the next section
 * through exports.
 */
SayHi.section('intro', k => {
  'use strict';
  const PF = PhyFriends, A = PF.anim, B = k.beats, at = k.at;

  // ------------------------------------------------------------ the template's era

  // Until Terry's owner tunes the standing template on the tuning page (bars 51-52, sections/owners.js),
  // every friend that stands is drawn on the numbers that page started from, its earlier pick of
  // 1 October (tools/tune.html, as in the library before 21029ef): a body as tall as its own spec makes
  // it, shorter legs set farther apart, wider legs and feet, and shorter arms. Its rice ball was squared
  // off at the base (square 2), and squaring came with the rice ball: until phy asks for one, the bodies
  // are plain ovals (square 0, taper 0), and as the taper comes in (the era's taper, whose curve the
  // gallery gives) the square comes in with it, in step, to 2. From the tuning on, the library's own
  // numbers, which are his owner's. Each number is an era entry named after where the library keeps it,
  // so that every frame stays a function of t; the owners' module gives each the curve of its slider
  // (k.era.curve), from its value before the tuning (beforeAt) to the library's, and until then each
  // steps at the tuning's start.
  const LEGS = PF.STAND_DEFAULT.legs;
  // A foot stands on the ground by the lower of its own bottom and its leg's round end, as the tuning
  // page settles it.
  const settleAnkle = () => { LEGS.ankle = Math.max(LEGS.width / 2, (LEGS.foot.cy || 0) + LEGS.foot.ry); };
  // How far the rice ball has come in at t, from 0 to 1 (a little past, as the taper overshoots): the
  // era's taper as a share of the library's own. The taper is read from the era itself, so that the
  // square follows whatever curve the taper is given; while it is read, this entry answers 0, which
  // the taper does not depend on.
  const RICE_TAPER = PF.ONIGIRI.taper;
  let readingTaper = false;
  function riceAt(t) {
    if (readingTaper) return 0;
    readingTaper = true;
    try {
      return Math.max(0, k.era.values(t).taper / RICE_TAPER);
    } finally {
      readingTaper = false;
    }
  }
  const TEMPLATE = [
    { name: 'BODY.height', before: 1, quantum: 0.01, get: () => PF.BODY.height, set: v => { PF.BODY.height = v; } },
    { name: 'ONIGIRI.square', before: 2, beforeAt: t => 2 * riceAt(t), quantum: 0.1, get: () => PF.ONIGIRI.square, set: v => { PF.ONIGIRI.square = v; } },
    { name: 'STAND_FIT.legs', before: 22, quantum: 0.5, get: () => PF.STAND_FIT.legs, set: v => { PF.STAND_FIT.legs = v; } },
    { name: 'STAND_DEFAULT.legs.width', before: 28, quantum: 0.5, get: () => LEGS.width, set: v => { LEGS.width = v; settleAnkle(); } },
    { name: 'STAND_DEFAULT.legs.foot.ry', before: 12, quantum: 0.25, get: () => LEGS.foot.ry, set: v => { LEGS.foot.ry = v; settleAnkle(); } },
    { name: 'STAND_FIT.hip', before: 0.4, quantum: 0.01, get: () => PF.STAND_FIT.hip, set: v => { PF.STAND_FIT.hip = v; } },
    { name: 'STAND_DEFAULT.arms.length', before: 30, quantum: 0.5, get: () => PF.STAND_DEFAULT.arms.length, set: v => { PF.STAND_DEFAULT.arms.length = v; } },
  ];
  const TUNED = at('51.1');
  for (const entry of TEMPLATE) {
    entry.after = entry.get();
    // The value before the tuning at t: a number of the earlier pick, or, for the square, in step with the rice ball.
    if (!entry.beforeAt) entry.beforeAt = () => entry.before;
    k.era.define(entry.name, { value: t => (t < TUNED ? entry.beforeAt(t) : entry.after), quantum: entry.quantum, apply: entry.set, get: entry.get });
  }

  // Runs fn with the template's numbers as the film has them at t, then puts back the numbers that were
  // set: for what a module works out once, as it is built, such as where a friend's ground is.
  function underTemplate(t, fn) {
    const values = k.era.values(t), saved = TEMPLATE.map(entry => entry.get());
    TEMPLATE.forEach(entry => entry.set(values[entry.name]));
    try {
      return fn();
    } finally {
      TEMPLATE.forEach((entry, i) => entry.set(saved[i]));
    }
  }

  // ------------------------------------------------------------ the line and the eyes

  const page = k.page('A'), { phy } = SayHi.layout.A;
  const spec = PF.get('phy'), EYE = spec.eyes, BOX = PF.scene.BOX;
  const IRIS = PF.palette('phy').iris;
  const INK = '#3d3c39';                           // Graphite, as site/notebook.css's --ink.

  // The line, as the file has it (comments stripped), and where it lies: on the rule one above phy's
  // floor, its colon under the middle of phy's eyes, in the code's face at the size whose caret is as
  // tall as phy's eye.
  const source = SayHi.source.phy.lines.find(line => /^\s*eyes:/.test(line.text));
  const LINE = { n: source.n, text: source.text.trim(), size: 30, y: phy.floor - k.RULE };
  const COLON = LINE.text.indexOf(':');
  // The head's origin, between the eyes, under the template of the intro's time.
  const head = underTemplate(0, () => ({ x: phy.x, y: phy.floor - PF.groundOf(spec) }));
  const view = underTemplate(0, () => PF.standingView(spec));

  // The rest of the line is typed a stretch a half beat, after the colon has turned; each stretch ends
  // on the number the dots then act on, which lights up as it is typed.
  const through = token => {
    const i = LINE.text.indexOf(token);
    if (i < 0) throw new Error(`say hi: the eyes' line has no "${token}"`);
    return i + token.length;
  };
  // A third of a beat a number, so that the eyes are made, and meet yours, before the bar is out.
  const STRETCH = B.BEAT / 3;
  const TYPED = [
    { upTo: COLON + 1, from: 0, to: 0 },                                        // eyes: (frame 0)
    { upTo: through(`x: ${EYE.x},`), from: at('1.2'), to: at('1.2') + STRETCH },
    { upTo: through(`y: ${EYE.y},`), from: at('1.2') + STRETCH, to: at('1.2') + 2 * STRETCH },
    { upTo: through(`h: ${EYE.h},`), from: at('1.2') + 2 * STRETCH, to: at('1.3') },
    { upTo: through(`tilt: ${EYE.tilt},`), from: at('1.3'), to: at('1.3') + STRETCH },
    { upTo: LINE.text.length, from: at('1.3') + STRETCH, to: at('1.4.5') },
  ];
  // How many characters of the line are typed at t.
  function typedAt(t) {
    let shown = 0;
    for (const stretch of TYPED) {
      if (t < stretch.from) break;
      const u = stretch.to > stretch.from ? Math.min(1, (t - stretch.from) / (stretch.to - stretch.from)) : 1;
      shown = Math.round(shown + (stretch.upTo - shown) * u);
      if (u < 1) break;
    }
    return shown;
  }

  // The numbers that place and size the eyes, each lit from when it is typed in full.
  const LIT = [
    { tokens: [`x: ${EYE.x}`] }, { tokens: [`y: ${EYE.y}`] }, { tokens: [`w: ${EYE.w}`, `h: ${EYE.h}`] }, { tokens: [`tilt: ${EYE.tilt}`] },
  ].map(group => ({ ...group, from: TYPED.find(stretch => stretch.upTo >= through(group.tokens[group.tokens.length - 1])).to }));
  const BLINKS_AT = '1.4.5';                      // The eyes start to blink as soon as they have looked up at you.

  // The eyes look down at the line as they land, then up at you.
  const LANDING_LOOK = { lookX: 0, lookY: 0.9 };
  const SHUT = 0.86;                               // How far a blink of the pattern closes the eyes (pose.blink).
  const T = {
    lift: [0.03, 0.25], turn: [0.04, at('1.2')],  // The copy lifts off and tips over (seconds from 0), on a still camera.
    arrow: [0.06, 0.34], arrowOut: [at('1.2.5'), at('1.3')],
    // Each act starts as its number has been typed.
    part: [LIT[0].from, LIT[0].from + 0.2], rise: [LIT[1].from, LIT[1].from + 0.22],
    stretch: [LIT[2].from, LIT[2].from + 0.2], lean: [LIT[3].from, LIT[3].from + 0.12],
    swap: LIT[3].from + 0.12, lookSeconds: 0.22,
    blinks: k.pattern('-.-. --.-', BLINKS_AT),   // A sixteenth to a unit: 1.615 s to 4.731 s.
    glance: at('4.1'), back: at('4.3'), blush: 0.5,
    blinkSince: at('4.1'),                        // The caret, solid until now, blinks on the beat from here.
  };
  T.lookUp = T.swap + B.SIXTEENTH;
  if (T.lookUp + T.lookSeconds > T.blinks[0].from - 0.04) throw new Error('say hi: intro: the eyes would blink before they look up at you');
  // The lit numbers settle back over the beat in which the eyes begin to blink.
  const UNLIT = { from: T.blinks[0].from, to: T.blinks[0].from + B.BEAT };
  // The tape under the eyes: a mark for each element of the pattern, on the rule they sit over, from
  // under the left eye rightward, as far along as its time (unit: head units a sixteenth).
  const TAPE = { y: phy.floor - 2 * k.RULE, start: -EYE.x - 12, unit: 11, gap: 4, thick: 4.2, dot: 6.5, ink: 0.85 };

  const easeIn = (a, b, t, ease = A.ease.inOut) => ease(Math.min(1, Math.max(0, (t - a) / (b - a))));
  const lerp = (a, b, u) => a + (b - a) * u;
  const mix = (c0, c1, u) => {
    const p = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
    return `rgb(${p(c0).map((v, i) => Math.round(lerp(v, p(c1)[i], u))).join(',')})`;
  };
  // What the build module may decide for what this module leaves on the page after 5.1 (HANDOFF.md):
  // how much of the line and of the tape still shows at t, from 1 to 0.
  const handOver = name => {
    const given = (k.exportsOf('build').intro || {})[name];
    return typeof given === 'function' ? given : null;
  };
  const lineShows = t => (handOver('line') ? handOver('line')(t) : 1 - easeIn(at('5.1'), at('5.2'), t));
  const tapeShows = t => (handOver('tape') ? handOver('tape')(t) : 1 - easeIn(at('7.1'), at('7.2'), t));

  // ------------------------------------------------------------ the shot

  k.shot('A', '1.1', '5.1');
  // Every part of the scene's phy is hidden until the build begins: the intro draws the eyes itself.
  k.parts('A', 'phy', '1.1', '5.1', () => ({ show: [] }));

  // Frame 0: the start of the line, close, framed by the film's rule over the line and the colon's copy
  // as it lifts. The camera holds while the colon turns; draws back as the line is typed, until the dots
  // have all their numbers as far as h (tilt and the rest are typed past the frame's edge); and pushes
  // in again, slowly, while the eyes blink.
  const ADVANCE = LINE.size * 0.6;                 // The code's face sets every character 0.6em wide.
  // The gutter, in ems of the line: the number's size (its baseline on the line's), the room from the code to
  // the number's right edge, where the rule stands between them, and how far the rule reaches above the
  // line's top and below it.
  const GUTTER = { number: 0.62, pad: 1.4, rule: 0.7, from: -1.6, to: 1.75 };
  GUTTER.drop = (0.82 * (1 - GUTTER.number)) / GUTTER.number;
  const lineX = head.x - (COLON + 0.5) * ADVANCE;
  const gutter = lineX - (GUTTER.pad + 1.2 * GUTTER.number + 0.1) * LINE.size;   // The line number's left edge.
  const caretAfter = chars => lineX + chars * ADVANCE + 0.5 * LINE.size;
  const SUBJECT = { top: head.y + EYE.y - EYE.h / 2 - 6, bottom: LINE.y + 0.25 * LINE.size };
  const SIZED = { left: gutter - 0.4 * LINE.size, right: caretAfter(through(`h: ${EYE.h},`)) + 0.4 * LINE.size };
  const LIFTED = { top: LINE.y - 0.55 * LINE.size - 0.9 * LINE.size - 10, bottom: LINE.y + 0.25 * LINE.size };
  const FRAME0 = k.frame('A', { ...LIFTED, zoom: 3.4, x: (gutter + caretAfter(COLON + 1)) / 2 + 12 });
  const TYPING_VIEW = k.frame('A', { ...SUBJECT, zoom: (k.FRAME.width - 240) / (SIZED.right - SIZED.left), x: (SIZED.left + SIZED.right) / 2 });
  k.camera('A', FRAME0, { at: 0 });
  k.camera('A', TYPING_VIEW, { at: '1.2', duration: at('1.3.5') - at('1.2'), ease: 'inOut' });
  k.camera('A', { x: head.x + 90, y: head.y + 44, zoom: 3.1 }, { at: '1.4.5', duration: at('4.1') - at('1.4.5'), ease: 'inOut' });

  // ------------------------------------------------------------ the line

  let geometry = null;    // The line's measured geometry: its left edge, the advance and the colon's dots.

  // The line at t into el: what is typed of it, the caret at its end, the lit numbers. Used by the
  // drawer below and, at t = 0, by the finale's last frame.
  function paintLine(el, t) {
    if (!el.firstChild) {
      el.innerHTML = `<p class="sh-intro-line mono" style="font-size:${LINE.size}px">` +
        `<span class="sh-n" style="font-size:${GUTTER.number}em;top:${GUTTER.drop}em;right:calc(100% + ${GUTTER.number > 0 ? GUTTER.pad / GUTTER.number : 0}em)">${LINE.n}</span>` +
        `<svg class="graphite" width="1" height="1" style="position:absolute;left:${-GUTTER.rule}em;top:0;overflow:visible">` +
        `<path d="M0 ${GUTTER.from * LINE.size}L0.6 ${GUTTER.to * LINE.size}" fill="none" stroke="var(--ink-3)" stroke-width="1.4" stroke-linecap="round"/></svg>` +
        `<span class="sh-t">${litMarkup()}</span><span class="sh-caret pill"></span></p>` +
        '<svg class="sh-intro-underlines" width="1" height="1" style="position:absolute;overflow:visible"></svg>';
    }
    if (!geometry) geometry = measureLine(el.firstChild);
    const p = el.firstChild, shows = lineShows(t), typed = typedAt(t);
    p.style.transform = `translate(${geometry.x}px, ${LINE.y}px) translateY(-0.82em)`;
    p.style.opacity = String(shows);
    p.style.display = shows > 0 ? '' : 'none';
    // What is not typed yet is hidden behind the caret.
    p.querySelector('.sh-t').style.clipPath = typed < LINE.text.length ? `inset(-0.5em ${(LINE.text.length - typed) * geometry.advance}px -0.5em -0.5em)` : '';
    // The caret: solid while the line is typed and while the eyes blink, then on a beat and off a beat.
    const caret = p.querySelector('.sh-caret');
    caret.style.left = `${typed * geometry.advance + 2}px`;
    caret.style.visibility = t < T.blinkSince || Math.floor((t - T.blinkSince) / B.BEAT + 1e-9) % 2 === 0 ? 'visible' : 'hidden';
    // The lit numbers: each from when it is typed, settling back as the eyes begin to blink.
    const settle = easeIn(UNLIT.from, UNLIT.to, t);
    const underlines = [];
    for (const span of p.querySelectorAll('.sh-lit')) {
      const from = LIT[Number(span.dataset.group)].from;
      const on = t >= from ? 1 - settle : 0;
      span.style.color = on > 0 ? mix('#6d6a63', INK, on) : '';
      span.style.fontWeight = on > 0.5 ? '600' : '';
      // An underline starts once its stroke has length, so that the pen leaves no dot where it lands.
      const drawn = easeIn(from, from + 0.16, t, A.ease.out);
      if (drawn > 0.04 && on > 0) underlines.push({ span, drawn, on });
    }
    drawUnderlines(el.querySelector('.sh-intro-underlines'), underlines);
  }

  k.draw(page.under, '1.1', '7.2', paintLine);

  // The line as markup, the numbers that act on the eyes in spans of their own.
  function litMarkup() {
    const marks = [];
    LIT.forEach((group, g) => group.tokens.forEach(token => {
      const i = LINE.text.indexOf(token);
      marks.push({ i, j: i + token.length, g });
    }));
    marks.sort((a, b) => a.i - b.i);
    let html = '', last = 0;
    for (const m of marks) {
      html += escape(LINE.text.slice(last, m.i)) + `<span class="sh-lit" data-group="${m.g}" data-from="${m.i}" data-to="${m.j}">${escape(LINE.text.slice(m.i, m.j))}</span>`;
      last = m.j;
    }
    return html + escape(LINE.text.slice(last));
  }

  // Escapes text for markup.
  function escape(s) {
    return s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  }

  // A penciled underline under each lit number, drawn on as it lights.
  function drawUnderlines(svg, lit) {
    svg.innerHTML = lit.map(({ span, drawn, on }) => {
      const from = Number(span.dataset.from), to = Number(span.dataset.to);
      const x0 = geometry.x + from * geometry.advance - 2, x1 = geometry.x + to * geometry.advance + 2, y = LINE.y + 7;
      const x = lerp(x0, x1, drawn);
      return `<path d="M${x0} ${y + 0.6}Q${(x0 + x) / 2} ${y - 1.4} ${x} ${y + 0.4}" fill="none" stroke="${INK}" stroke-opacity="${0.75 * on}" stroke-width="2.4" stroke-linecap="round"/>`;
    }).join('');
  }

  // Where the line starts, so that its colon lies under the middle of the eyes, how wide a character is
  // set, and where the colon's two dots are (their centers and size), from the face itself.
  function measureLine(p) {
    const textSpan = p.querySelector('.sh-t'), advance = textSpan.offsetWidth / LINE.text.length;
    const x = head.x - (COLON + 0.5) * advance;
    const canvas = document.createElement('canvas').getContext('2d');
    const style = getComputedStyle(p);
    canvas.font = `${style.fontWeight} ${LINE.size}px ${style.fontFamily}`;
    const m = canvas.measureText(':'), sameFace = Math.abs(canvas.measureText('0').width - advance) < 0.5;
    const dot = sameFace ? m.actualBoundingBoxLeft + m.actualBoundingBoxRight : LINE.size * 0.14;
    const top = sameFace ? m.actualBoundingBoxAscent : LINE.size * 0.5, bottom = sameFace ? -m.actualBoundingBoxDescent : 0;
    const cx = x + COLON * advance + (sameFace ? (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2 : advance / 2);
    return { x, advance, dot, dots: [{ x: cx, y: LINE.y - top + dot / 2 }, { x: cx, y: LINE.y - bottom - dot / 2 }] };
  }

  // ------------------------------------------------------------ the colon's copy

  // Where each eye lands: its center in the world, as the rig draws it looking down at the line.
  const landing = side => {
    const d = side === 'L' ? -1 : 1, range = EYE.range ?? 6;
    return { x: head.x + d * EYE.x + LANDING_LOOK.lookX * range, y: head.y + EYE.y + LANDING_LOOK.lookY * range * 0.8 };
  };

  // The copy of the colon at t into el, and the penciled arrow of its quarter turn: lifted, turned,
  // parted, raised, stretched and leaned as its numbers are typed. Used by the drawer below and, at
  // t = 0, by the finale's last frame.
  function paintCopy(el, t) {
    if (!geometry) return;
    if (!el.firstChild) {
      el.innerHTML = '<svg class="sh-intro-dots graphite" width="1" height="1" style="position:absolute;overflow:visible">' +
        '<path class="arrow" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect/><rect/></svg>';
    }
    const [upper, lower] = geometry.dots, center = { x: upper.x, y: (upper.y + lower.y) / 2 };
    const lifted = easeIn(T.lift[0], T.lift[1], t, A.ease.out), lift = 0.9 * LINE.size * lifted, grown = geometry.dot * (1 + 0.8 * lifted);
    const turn = (Math.PI / 2) * easeIn(T.turn[0], T.turn[1], t, A.ease.inOut);
    // Turned a quarter clockwise, the upper dot comes to lie on the right: it becomes the right eye.
    const turned = [lower, upper].map(dot => {
      const dx = dot.x - center.x, dy = dot.y - center.y;
      return { x: center.x + dx * Math.cos(turn) - dy * Math.sin(turn), y: center.y + dx * Math.sin(turn) + dy * Math.cos(turn) - lift };
    });
    const part = easeIn(T.part[0], T.part[1], t), rise = easeIn(T.rise[0], T.rise[1], t, A.ease.out);
    const stretch = easeIn(T.stretch[0], T.stretch[1], t, A.ease.back), lean = easeIn(T.lean[0], T.lean[1], t);
    const color = mix(INK, IRIS, easeIn(T.stretch[0], T.swap, t));
    const svg = el.firstChild, [arrow, ...rects] = svg.children;
    rects.forEach((rect, i) => {
      const side = i === 0 ? 'L' : 'R', goal = landing(side), from = turned[i];
      const x = lerp(from.x, goal.x, part), y = lerp(from.y, goal.y, rise);
      const w = lerp(grown, EYE.w, stretch), h = lerp(grown, EYE.h, stretch);
      const tilt = (side === 'L' ? 1 : -1) * EYE.tilt * lean;
      rect.setAttribute('x', String(-w / 2));
      rect.setAttribute('y', String(-h / 2));
      rect.setAttribute('width', String(w));
      rect.setAttribute('height', String(h));
      rect.setAttribute('rx', String(Math.min(w, h) / 2));
      rect.setAttribute('fill', color);
      rect.setAttribute('transform', `translate(${x} ${y}) rotate(${tilt})`);
    });
    arrow.setAttribute('d', arrowD({ x: center.x, y: center.y - lift }, upper.y - lower.y, easeIn(T.arrow[0], T.arrow[1], t, A.ease.out)));
    arrow.setAttribute('stroke', INK);
    arrow.setAttribute('stroke-width', '1.5');
    arrow.setAttribute('stroke-opacity', String(0.8 * (1 - easeIn(T.arrowOut[0], T.arrowOut[1], t))));
  }

  // A construction mark for the quarter turn: an arc a little outside the copy's dots, from above them
  // round to their right, clockwise, drawn on to `drawn` of its sweep, with an arrowhead once it is whole.
  function arrowD(c, span, drawn) {
    if (drawn <= 0) return '';
    const r = Math.abs(span) / 2 + 12, a0 = -Math.PI * 0.62, a1 = a0 + (Math.PI * 0.62) * drawn;
    const steps = 10, points = [];
    for (let i = 0; i <= steps; i++) {
      const a = lerp(a0, a1, i / steps);
      points.push(`${(c.x + r * Math.cos(a)).toFixed(2)} ${(c.y + r * Math.sin(a)).toFixed(2)}`);
    }
    let d = `M${points.join('L')}`;
    if (drawn >= 1) {
      // The head: two short strokes back from the arc's end, along the tangent (down, at the right).
      const end = { x: c.x + r * Math.cos(a1), y: c.y + r * Math.sin(a1) };
      d += `M${(end.x - 4.2).toFixed(2)} ${(end.y - 3.4).toFixed(2)}L${end.x.toFixed(2)} ${end.y.toFixed(2)}L${(end.x + 3.6).toFixed(2)} ${(end.y - 4.4).toFixed(2)}`;
    }
    return d;
  }

  k.draw(page.over, '1.1', T.swap, paintCopy);

  // ------------------------------------------------------------ the eyes

  const phyDrawn = k.friend('phy');

  k.draw(page.over, T.swap, '5.1', (el, t) => {
    if (!el.firstChild) {
      el.innerHTML = '<div class="sh-intro-eyes"></div>';
      Object.assign(el.firstChild.style, { position: 'absolute', width: `${BOX}px`, height: `${BOX}px`,
        transform: `translate(${phy.x - BOX / 2}px, ${phy.floor - BOX}px)` });
    }
    const rig = phyDrawn.rig(el.firstChild, t, { view });
    rig.setPose(eyesAt(t), true);
    k.showParts(rig.svg, { show: t >= T.back ? ['eyes', 'blush'] : ['eyes'] });
  });

  // The eyes' pose at t: looking down at the line, up at you, the pattern's blinks, the glance at your
  // thumb, and the blush as they come back.
  function eyesAt(t) {
    const up = easeIn(T.lookUp, T.lookUp + T.lookSeconds, t, A.ease.out);
    const down = easeIn(T.glance, T.glance + 0.28, t) * (1 - easeIn(T.back, T.back + 0.3, t, A.ease.out));
    const widen = 0.12 * Math.sin(Math.PI * easeIn(T.lookUp, T.lookUp + 0.45, t)) + 0.06 * Math.sin(Math.PI * easeIn(T.back, T.back + 0.5, t));
    const blush = 0.9 * easeIn(T.back, T.back + T.blush, t, A.ease.out);
    return {
      lookX: lerp(LANDING_LOOK.lookX, 0, up) + 0.18 * down, lookY: lerp(LANDING_LOOK.lookY, 0, up) + 1 * down,
      lid: 0.22 * down, widen, blink: blinkAt(t), blush, flush: 0.12 * blush,
    };
  }

  // The pattern's blinks: shut for each of its elements, closing in a frame and opening in a little more.
  // Shut is the library's blink held short of a sliver, so that a closed eye still shows as a line.
  function blinkAt(t) {
    let shut = 0;
    for (const { from, to } of T.blinks) {
      if (t < from - 0.04 || t > to + 0.06) continue;
      shut = Math.max(shut, Math.min(easeIn(from - 0.035, from, t, A.ease.linear), 1 - easeIn(to, to + 0.05, t, A.ease.linear)));
    }
    return SHUT * shut;
  }

  // ------------------------------------------------------------ the tape

  // Under the eyes, on their rule, a mark for each element of the pattern, drawn as the eyes blink it,
  // left to right, each as long as its time: a hand-drawn dash or a dot, never quite level.
  const random = PF.rng(23);
  const tapeMarks = T.blinks.map(element => ({
    ...element, dy: (random() - 0.5) * 2.4, tilt: (random() - 0.5) * 5, thick: TAPE.thick * (0.85 + random() * 0.3), bow: (random() - 0.5) * 2,
  }));
  const tapeStart = T.blinks[0].from;
  const tapeX = time => head.x + TAPE.start + ((time - tapeStart) / B.SIXTEENTH) * TAPE.unit;

  k.draw(page.under, '2.1', '7.2', (el, t) => {
    if (!el.firstChild) el.innerHTML = `<svg class="sh-intro-tape graphite" width="1" height="1" style="position:absolute;overflow:visible"></svg>`;
    const shows = tapeShows(t);
    el.firstChild.style.opacity = String(TAPE.ink * shows);
    el.firstChild.innerHTML = shows <= 0 ? '' : tapeMarks.filter(m => t >= m.from).map(m => {
      const drawn = easeIn(m.from, m.to, t, A.ease.linear), x0 = tapeX(m.from), y = TAPE.y + 2 + m.dy;
      if (m.kind === 'dot') {
        const r = (TAPE.dot / 2) * (0.6 + 0.4 * drawn);
        return `<ellipse cx="${x0 + TAPE.dot / 2}" cy="${y}" rx="${r}" ry="${r * 0.9}" fill="${INK}" transform="rotate(${m.tilt} ${x0} ${y})"/>`;
      }
      const x1 = x0 + (tapeX(m.to) - x0 - TAPE.gap) * drawn;
      return `<path d="M${x0} ${y}Q${(x0 + x1) / 2} ${y + m.bow} ${x1} ${y - m.bow * 0.3}" fill="none" stroke="${INK}" stroke-width="${m.thick}" ` +
        `stroke-linecap="round" transform="rotate(${m.tilt} ${x0} ${y})"/>`;
    }).join('');
  });

  // What the later sections build on: the template's era (its numbers, and a way to work under them);
  // the line and frame 0 (the finale draws frame 0 again with these painters, into a page with this
  // page's camera at 0); and the eyes' pose at a time in bars 1-4 (the build starts from it).
  Object.assign(k.exports, {
    template: { entries: TEMPLATE.map(({ name, before, beforeAt, after, quantum }) => ({ name, before, beforeAt, after, quantum })), tuned: TUNED, under: underTemplate },
    line: { n: LINE.n, text: LINE.text, size: LINE.size, y: LINE.y, geometry: () => geometry },
    frame0: { line: el => paintLine(el, 0), copy: el => paintCopy(el, 0) },
    head,
    eyesAt,
  });
});
