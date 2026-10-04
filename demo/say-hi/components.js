/*!
 * say hi: the shared components. A section module gets them as k.ui, each bound to the module, so
 * that what they draw is the module's own (see HANDOFF.md):
 *
 *   hand(layer, text, o)     words written in pencil, letter by letter, on a rule (phy's lines)
 *   label(layer, text, o)    words already written (a name, a note)
 *   typed(layer, text, o)    what Claude types, held large in the typed style (say-hi.css, .sh-typed)
 *   leader(layer, o)         a graphite line drawn from one point to another
 *   mark(layer, kind, o)     one of the house's pencil marks (tick, ring, box, arrow, caret, line, ground)
 *
 * and the film's rules for words (DECISIONS.md and BUILD/FIXES.md, draft 2):
 *
 *   SPEECH                   the least cap height on the 1080 frame of phy's lines, of Claude's typed
 *                            numbers and of labels a viewer must read
 *   sizeFor(kind, layer, t)  the font size, in the layer's units, that gives a kind its cap height
 *                            under the camera at t
 *   holdFor(text)            how long a must-read line stays whole before it goes or the shot cuts
 *   legible(el, kind, ...)   the size check, for a module's own drawers
 *
 * Positions are in the layer's units: head units on a page's world layers (under, over), frame pixels
 * on a page's screen layer. Times are cues (bar.beat, or seconds). Every drawing is a function of t.
 *
 * Loads after core.js (SayHi.components).
 */
(function (root) {
  'use strict';

  const PF = root.PhyFriends, A = PF.anim;
  // The rule of speech: the least cap height, in frame pixels on the 1080-pixel frame, of phy's
  // handwritten lines (hand), of the numbers Claude types in the typed style (typed), and of labels a
  // viewer must read (label: names, handles, notes, meters). Only pause-and-find details (construction
  // labels, the colophon, scrolling test names) may be smaller, and are drawn with mustRead false.
  const SPEECH = Object.freeze({ hand: 80, typed: 56, label: 40 });
  // The rule of holds: a must-read line stays whole for `beats` beats, and a beat more for every
  // `wordsPerBeat` words, before it goes or the shot cuts.
  const HOLD = Object.freeze({ beats: 2, wordsPerBeat: 3 });
  // A hand's pace, in seconds: a letter, a little more for a wide one (per em), the lift between
  // letters, a pause at a space, and a quick stroke for punctuation; and the size phy's lines were
  // written at on close pages before the rule of speech, one rule tall (head units), kept for layouts
  // that measure by it.
  const HAND = Object.freeze({ letter: 0.07, perEm: 0.08, lift: 0.03, space: 0.14, punctuation: 0.05, size: 52, rotate: -1 });
  const BASELINE = 0.85;      // With a line box of 1em, the face's baseline lies this far below its top (film/scene.js).
  const MARKS = ['tick', 'ring', 'box', 'box-again', 'arrow', 'caret', 'line', 'ground', 'squiggle', 'checkbox'];
  // The faces words are set in, as say-hi.css sets them, for measuring their cap heights.
  const FACES = Object.freeze({ hand: '300 100px "Shantell Sans"', mono: "600 100px ui-monospace, 'SF Mono', Menlo, monospace" });
  const CAP_FALLBACK = Object.freeze({ hand: 0.709, mono: 0.676 });    // As measured in Chrome, should a canvas be wanting.
  // The typed box's measures in em (say-hi.css, .sh-typed): its side padding, a character's advance,
  // and how far the baseline lies below the box's middle.
  const TYPED_BOX = Object.freeze({ padding: 0.45, advance: 0.6, baseline: 0.33 });

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const escapeHtml = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // A face's cap height as a share of its size: the height of a capital H, measured once.
  const caps = {};
  function capOf(face) {
    if (!(face in caps)) {
      let cap = CAP_FALLBACK[face];
      try {
        const context = document.createElement('canvas').getContext('2d');
        context.font = FACES[face];
        const measured = context.measureText('H').actualBoundingBoxAscent / 100;
        if (measured > 0.4 && measured < 0.95) cap = measured;
      } catch (error) {
        // The fallback stands.
      }
      caps[face] = cap;
    }
    return caps[face];
  }

  // Where each letter of a line ends, from the line's left end, and the line's width, in px of a line
  // set at `size` px in the look `className` gives it: measured once for each look, size and text, on a
  // copy of the line outside the frame. The line drawn is never touched to measure it: in Chrome, a line
  // whose transform was taken off for a measurement and put back in the same frame came out a level or
  // two different in that frame, so that a frame depended on the seeks before it.
  const lines = new Map();
  function measureLine(className, size, text) {
    const key = `${className}|${size}|${text}`;
    if (!lines.has(key)) {
      const p = document.createElement('p');
      p.className = className;
      p.textContent = text;
      Object.assign(p.style, { fontSize: `${size}px`, visibility: 'hidden' });
      document.body.appendChild(p);
      const node = p.firstChild, range = document.createRange(), box = p.getBoundingClientRect();
      const rights = [];
      let end = 0;
      for (const letter of text) {
        end += letter.length;
        range.setStart(node, 0);
        range.setEnd(node, end);
        rights.push(range.getBoundingClientRect().right - box.left);
      }
      lines.set(key, { rights, width: box.width });
      p.remove();
    }
    return lines.get(key);
  }

  // The words of a line, for its hold: runs of letters or digits, so that "rise: 1" has two.
  const wordCount = text => (String(text).match(/[\p{L}\p{N}]+/gu) || []).length;

  // How long a must-read line stays whole before it goes or the shot cuts, in seconds.
  function holdFor(text, beat) {
    return beat * (HOLD.beats + wordCount(text) / HOLD.wordsPerBeat);
  }

  // The shared components for one module, drawing through its context k, so that what they add is the
  // module's own.
  function components(k, core) {
    const warned = new Set();
    const span = (at, until) => [k.time(at), until === undefined || until === Infinity ? Infinity : k.time(until)];
    const BEAT = k.beats.BEAT;

    // Frame pixels a unit of a layer is drawn at, at t (the page's camera and placing).
    const scaleAt = (layer, t) => core.layerScale(layer, k.time(t));

    // The font size, in a layer's units, at which words of a kind ('hand', 'typed' or 'label') have the
    // cap height the rule of speech asks for, under the camera at t. face: 'hand' or 'mono' (a kind's
    // own face by default: the hand for phy's lines and labels, the code's for what Claude types).
    function sizeFor(kind, layer, t, face = kind === 'typed' ? 'mono' : 'hand') {
      if (!(kind in SPEECH)) throw new Error(`say hi: no kind of words "${kind}"; use one of ${Object.keys(SPEECH).join(', ')}`);
      return (1.01 * SPEECH[kind]) / capOf(face) / scaleAt(layer, t);
    }

    // Notes, once for each element, words a viewer must read whose cap height on the frame is under
    // the rule of speech for their kind: el is drawn at `size` (its own units) in face.
    function legible(el, kind, t, what, { size = parseFloat(el.style.fontSize) || 0, face = kind === 'typed' ? 'mono' : 'hand' } = {}) {
      if (warned.has(el)) return true;
      const frame = core.stage.frame.getBoundingClientRect(), scale = frame.width / core.FRAME.width || 1;
      const rect = el.getBoundingClientRect();
      const shown = (el.offsetHeight ? (size * rect.height) / el.offsetHeight / scale : size) * capOf(face);
      if (shown >= SPEECH[kind] - 0.5) return true;
      warned.add(el);
      const note = `say hi: ${k.name}: "${what}" has a cap height of ${Math.round(shown)}px at ${k.beats.label(t)}; ` +
        `${kind === 'hand' ? 'phy\'s lines' : kind === 'typed' ? 'typed numbers' : 'labels to be read'} want ${SPEECH[kind]}px or more`;
      core.notes.push(note);
      console.warn(note);
      return false;
    }

    // Registers a must-read line for the check of holds (core.js), which runs once every module is built.
    function mustHold(layer, text, end, until, hold) {
      core.reads.push({ owner: k.name, text, layer, end, until, hold });
    }

    // ------------------------------------------------------------ hand

    // When each letter of a line starts and how long it takes, from the hand's pace, as
    // [{ at, seconds }] from the start of the writing, and the whole writing's length.
    function letterTimes(text, seconds) {
      let at = 0;
      const times = [...text].map((ch, i) => {
        const slot = /\s/.test(ch) ? HAND.space : /[.,;:!?'"]/.test(ch) ? HAND.punctuation : HAND.letter + HAND.perEm * (/[mwMW]/.test(ch) ? 0.5 : 0.25);
        const timed = { at: at + (i ? HAND.lift : 0), seconds: slot };
        at = timed.at + slot;
        return timed;
      });
      const scale = seconds ? seconds / at : 1;
      return { times: times.map(x => ({ at: x.at * scale, seconds: x.seconds * scale })), total: at * scale };
    }

    // Words written in pencil, letter by letter, their baseline from (x, y). o: size (head units or
    // pixels, as the layer has them; by default the rule of speech's for its kind under the camera when
    // the line is done), kind ('hand' for phy's lines, 'label' for a note), at, until, hold (true: the
    // line goes once it has been held whole for holdFor(text), unless `until` is later), seconds (the
    // writing's length; else the hand's pace), upTo (stop after this many letters, fractional: 2.5
    // writes "lo" and half a g), rotate (degrees; hand-drawn things tilt up to 2 anticlockwise), tone
    // ('ink' or 'ink-2'), align ('left', 'center', 'right'), graphite (the grain filter), mustRead
    // (checks the size on screen and the hold), fadeOut (seconds before `until` over which the words
    // are rubbed out; 0 takes them away at once).
    // Returns { at, end, held, until, size, letterAt(i) }: when it starts, is done, has been held
    // long enough, goes, its size, and when it reaches a letter.
    function hand(layer, text, o = {}) {
      const opt = { x: 0, y: 0, size: null, kind: 'hand', at: 0, until: Infinity, hold: false, seconds: null, upTo: Infinity, rotate: HAND.rotate,
        tone: 'ink', align: 'left', graphite: true, mustRead: true, fadeOut: 0, ...o };
      k.ensureShowable(text, 'handwriting');
      const [at, given] = span(opt.at, opt.until);
      const { times, total } = letterTimes(text, opt.seconds);
      const letters = [...text];
      const upTo = Math.min(letters.length, opt.upTo);
      const end = at + (upTo >= letters.length ? total : (() => {
        const i = Math.floor(upTo), part = upTo - i;
        return i < letters.length ? times[i].at + part * times[i].seconds : total;
      })());
      const hold = holdFor(text, BEAT), held = end + hold;
      const until = opt.hold ? (given === Infinity ? held + opt.fadeOut : Math.max(given, held + opt.fadeOut)) : given;
      const size = opt.size ?? sizeFor(opt.kind, layer, end);
      if (opt.mustRead) mustHold(layer, text, end, until - opt.fadeOut, hold);
      const className = `sh-hand hand${opt.tone === 'ink-2' ? ' ink-2' : ''}${opt.graphite ? ' graphite' : ''}`;
      const { rights, width } = measureLine(className, size, text);
      k.draw(layer, at, until, (el, t) => {
        let p = el.firstChild;
        if (!p) {
          p = document.createElement('p');
          p.className = className;
          p.textContent = text;
          p.style.fontSize = `${size}px`;
          el.appendChild(p);
        }
        const shift = opt.align === 'center' ? '-50%' : opt.align === 'right' ? '-100%' : '0';
        p.style.transform = `translate(${opt.x}px, ${opt.y}px) rotate(${opt.rotate}deg) translate(${shift}, -${BASELINE}em)`;
        const local = Math.min(t, end) - at;
        let x = 0;
        for (let i = 0; i < letters.length && i < Math.ceil(upTo); i++) {
          const { at: a, seconds } = times[i], left = i ? rights[i - 1] : 0;
          if (local < a) break;
          const part = Math.min(clamp((local - a) / seconds, 0, 1), i + 1 > upTo ? upTo - i : 1);
          x = left + (rights[i] - left) * A.ease.smooth(part);
          if (part < 1) break;
        }
        p.style.clipPath = `inset(-40% ${Math.max(0, width - x)}px -40% -12%)`;
        if (opt.fadeOut > 0 && until < Infinity) p.style.opacity = String(clamp((until - t) / opt.fadeOut, 0, 1));
        if (opt.mustRead && t >= end) legible(p, opt.kind, t, text, { size });
      });
      return { at, end, held, until, size, letterAt: i => at + times[clamp(i, 0, letters.length - 1)].at };
    }

    // ----------------------------------------------------------- label

    // Words already written (not written out): o as for hand(), font 'hand' or 'mono', and size by
    // default the rule's for a label under the camera at `at`. mustRead checks the size on screen.
    function label(layer, text, o = {}) {
      const opt = { x: 0, y: 0, size: null, at: 0, until: Infinity, rotate: 0, tone: 'ink', align: 'left', font: 'hand', graphite: false, mustRead: false, ...o };
      k.ensureShowable(text, 'a label');
      const [at, until] = span(opt.at, opt.until);
      const face = opt.font === 'mono' ? 'mono' : 'hand', size = opt.size ?? sizeFor('label', layer, at, face);
      k.draw(layer, at, until, (el, t) => {
        let p = el.firstChild;
        if (!p) {
          p = document.createElement('p');
          p.className = `sh-label ${opt.font === 'mono' ? 'mono' : 'hand'}${opt.tone === 'ink-2' ? ' ink-2' : ''}${opt.graphite ? ' graphite' : ''}`;
          p.textContent = text;
          p.style.fontSize = `${size}px`;
          el.appendChild(p);
        }
        const shift = opt.align === 'center' ? '-50%' : opt.align === 'right' ? '-100%' : '0';
        p.style.transform = `translate(${opt.x}px, ${opt.y}px) rotate(${opt.rotate}deg) translate(${shift}, -${BASELINE}em)`;
        if (opt.mustRead) legible(p, 'label', t, text, { size, face });
      });
      return { size };
    }

    // ----------------------------------------------------------- typed

    // What Claude types, held large in the typed style (say-hi.css, .sh-typed): a character every
    // `step` seconds from `at`, in a pencilled box centered on x (align 'left' or 'right': starting or
    // ending at x) with its
    // baseline on y, the pill caret after the last character, blinking a beat on and a beat off once
    // the line is done. The box pops in over a few frames and fades over the sixteenth before `until`.
    // o: size (by default the rule of speech's for typed numbers under the camera when the line is
    // done), step, until, hold (true: it goes once held whole for holdFor(text), unless `until` is
    // later), n (a line number before the text), file (a file name over the box), rotate, mustRead.
    // Returns { at, done, held, until, size, width, middle }: when it starts, is done, has been held
    // long enough, goes; its size, the box's width and the height of its middle, in the layer's units.
    function typed(layer, text, o = {}) {
      const opt = { x: 0, y: 0, size: null, at: 0, step: k.beats.SIXTEENTH / 2, until: Infinity, hold: false, align: 'center',
        n: null, file: null, rotate: -1.5, mustRead: true, ...o };
      k.ensureShowable(text, 'typed code');
      if (opt.file) k.ensureShowable(opt.file, 'a file name');
      const [at, given] = span(opt.at, opt.until);
      const done = at + text.length * opt.step, hold = holdFor(text, BEAT), held = done + hold;
      const until = opt.hold ? (given === Infinity ? held + k.beats.SIXTEENTH : Math.max(given, held + k.beats.SIXTEENTH)) : given;
      const size = opt.size ?? sizeFor('typed', layer, done);
      const number = opt.n == null ? '' : String(opt.n);
      const chars = text.length + (number ? number.length + 1.2 / TYPED_BOX.advance : 0);
      const width = (chars * TYPED_BOX.advance + 2 * TYPED_BOX.padding) * size, middle = opt.y - TYPED_BOX.baseline * size;
      const left = opt.align === 'left' ? opt.x : opt.align === 'right' ? opt.x - width : opt.x - width / 2;
      if (opt.mustRead) mustHold(layer, text, done, until - k.beats.SIXTEENTH, hold);
      k.draw(layer, at, until, (el, t) => {
        if (!el.firstChild) {
          el.innerHTML = `<p style="font-size:${size}px">${opt.file ? `<span class="sh-file">${escapeHtml(opt.file)}</span>` : ''}` +
            `${number ? `<span class="sh-n">${escapeHtml(number)}</span>` : ''}<span class="sh-t"></span><span style="visibility:hidden"></span><span class="sh-caret pill"></span></p>`;
        }
        const p = el.firstChild, n = clamp(Math.floor((t - at) / opt.step + 1e-9) + 1, 0, text.length);
        const [typedSpan, rest, caret] = [...p.children].slice(-3);
        if (typedSpan.textContent !== text.slice(0, n)) {
          typedSpan.textContent = text.slice(0, n);
          rest.textContent = text.slice(n);
        }
        const pop = clamp((t - at) / 0.12, 0, 1);
        p.style.transform = `translate(${left + width / 2}px, ${middle}px) translate(-50%, -50%) rotate(${opt.rotate}deg) scale(${lerp(0.85, 1, A.ease.back(pop))})`;
        const fade = until === Infinity ? 1 : 1 - clamp((t - (until - k.beats.SIXTEENTH)) / k.beats.SIXTEENTH, 0, 1);
        el.style.opacity = String(Math.min(clamp((t - at) / 0.06, 0, 1), fade));
        caret.style.left = `calc(${TYPED_BOX.padding}em + ${n + (number ? number.length : 0)}ch${number ? ' + 1.2ch' : ''})`;
        caret.style.display = t < done || Math.floor((t - done) / BEAT + 1e-9) % 2 === 0 ? '' : 'none';
        if (opt.mustRead && t >= done && pop >= 1) legible(p, 'typed', t, text, { size, face: 'mono' });
      }, { className: 'sh-typed' });
      return { at, done, held, until, size, width, middle, left };
    }

    // ---------------------------------------------------------- leader

    // A graphite line from one point to another, drawn on from `at` over `seconds`. from and to are
    // points or functions of t (to follow something that moves). o: bend (how far it bows, as a
    // share of its length), arrow, width, until, seed (its wobble).
    function leader(layer, o = {}) {
      const opt = { from: { x: 0, y: 0 }, to: { x: 100, y: 0 }, at: 0, until: Infinity, seconds: 0.3, bend: 0.12, arrow: false, width: 2.6, seed: 1, tone: 'ink', ...o };
      const [at, until] = span(opt.at, opt.until);
      const random = PF.rng(opt.seed), wobble = [random() - 0.5, random() - 0.5];
      const point = (p, t) => (typeof p === 'function' ? p(t) : p);
      k.draw(layer, at, until, (el, t) => {
        if (!el.firstChild) {
          el.className += ' sh-leader';
          el.innerHTML = `<svg class="${opt.tone}"><path class="line" pathLength="1" fill="none" stroke-linecap="round" stroke-width="${opt.width}"/>` +
            `${opt.arrow ? `<path class="head" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="${opt.width}"/>` : ''}</svg>`;
        }
        const a = point(opt.from, t), b = point(opt.to, t), dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len, ny = dx / len, bow = opt.bend * len;
        const c1 = { x: a.x + dx / 3 + nx * bow * (1 + wobble[0] * 0.4), y: a.y + dy / 3 + ny * bow * (1 + wobble[0] * 0.4) };
        const c2 = { x: a.x + 2 * dx / 3 + nx * bow * (0.8 + wobble[1] * 0.4), y: a.y + 2 * dy / 3 + ny * bow * (0.8 + wobble[1] * 0.4) };
        const svg = el.firstChild, line = svg.querySelector('.line');
        line.setAttribute('d', `M${a.x} ${a.y}C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${b.x} ${b.y}`);
        const drawn = opt.seconds > 0 ? A.ease.out(clamp((t - at) / opt.seconds, 0, 1)) : 1;
        line.setAttribute('stroke-dasharray', `${drawn} 1`);
        const head = svg.querySelector('.head');
        if (head) {
          const ex = b.x - c2.x, ey = b.y - c2.y, el2 = Math.hypot(ex, ey) || 1, ux = ex / el2, uy = ey / el2, s = 7 * opt.width;
          head.setAttribute('d', `M${b.x - ux * s + uy * s * 0.6} ${b.y - uy * s - ux * s * 0.6}L${b.x} ${b.y}L${b.x - ux * s - uy * s * 0.6} ${b.y - uy * s + ux * s * 0.6}`);
          head.style.opacity = drawn >= 1 ? '1' : '0';
        }
      });
    }

    // ------------------------------------------------------------ mark

    // One of the house's pencil marks (site/pencil.css), w by h, its center at (x, y). o: at, until,
    // rotate, grow (seconds over which it is drawn on, as a wipe from the left).
    function mark(layer, kind, o = {}) {
      if (!MARKS.includes(kind)) throw new Error(`say hi: no mark "${kind}"; use one of ${MARKS.join(', ')}`);
      const opt = { x: 0, y: 0, w: 60, h: 60, at: 0, until: Infinity, rotate: 0, grow: 0, ...o };
      const [at, until] = span(opt.at, opt.until);
      k.draw(layer, at, until, (el, t) => {
        if (!el.firstChild) {
          el.className += ' sh-mark';
          el.innerHTML = `<i style="width:${opt.w}px;height:${opt.h}px;background-image:var(--mark-${kind})"></i>`;
        }
        const i = el.firstChild, u = opt.grow > 0 ? clamp((t - at) / opt.grow, 0, 1) : 1;
        i.style.transform = `translate(${opt.x - opt.w / 2}px, ${opt.y - opt.h / 2}px) rotate(${opt.rotate}deg)`;
        i.style.clipPath = u < 1 ? `inset(-10% ${(1 - u) * 100}% -10% -10%)` : '';
      });
    }

    return { hand, label, typed, leader, mark, letterTimes, sizeFor, holdFor: text => holdFor(text, BEAT), legible, scaleAt, capOf, HAND, SPEECH, HOLD, TYPED_BOX };
  }

  // What a page's layout needs before any module is built (pages.js): the faces' cap heights and the rule.
  components.capOf = capOf;
  components.SPEECH = SPEECH;

  root.SayHi = root.SayHi || {};
  root.SayHi.components = components;
})(typeof self !== 'undefined' ? self : this);
