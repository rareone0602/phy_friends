/*!
 * say hi, the finale (C', bars 69-76): it is a library; where to say hi; the loop.
 *
 *   69-70  On the downbeat the gallery pulls back, in one beat, into a browser window three quarters of
 *          the frame wide, drawn in pencil on a fresh sheet of ruled paper (page "desk"), its address bar
 *          the gallery's address; under it, phy's pencilled note, "the gallery (which others call the
 *          library)". On the stab of 69.4 a second window slides in and the two share the desk side by
 *          side, never over the note: its tab "hello, world" (page C), a plain page holding the three lines
 *          that draw a friend. On 70.1 the camera pushes in to it, the call is underlined and its return
 *          value, the real string from the real call, streams out a line a sixteenth; the assignment is
 *          underlined and on 70.3 the page shows what the string draws: phy, on the page, for the call asks
 *          for no background.
 *   71-72  A page of its own (page "thesis"): phy writes, at the size of phy's lines, a line on each of
 *          the bar's hits, "one JavaScript library. / no build, no dependencies. / the fwiends are their
 *          owners'.", and holds them while bar 72 rings out.
 *   74.2   On the band under the rows the address types itself, larger, its caret solid at its end.
 *   76     phy writes "73, phy". In the top right corner, small, the colophon: page, seek(t), frame;
 *          thirty a second as ||||-; the same frame each time; and last a panel showing frame 0 (page
 *          "frame0", drawn by the intro's own painters). The caret blinks a short pattern, going dark
 *          for each element as the eyes did in bars 1-3, and a pencilled tape takes each element as it
 *          is blinked. Over the last half beat, in the pause after the pattern, the panel grows to fill
 *          the frame, quickening, and becomes frame 0 on the loop, so that the film runs back into its
 *          first frame without a seam.
 */
SayHi.section('finale', k => {
  'use strict';
  const PF = PhyFriends, A = PF.anim, { BEAT, SIXTEENTH } = k.beats;
  const W = k.FRAME.width, H = k.FRAME.height, RULE = k.RULE;
  const gallery = k.page('B'), hello = k.page('C'), layout = SayHi.layout.B;
  const intro = k.exportsOf('intro');
  const INK = '#3d3c39';                               // Graphite, as site/notebook.css's --ink.
  const PAPER = '#fbf9f3';                             // The paper, as --paper.
  const PAGE_WHITE = '#ffffff';                        // A plain browser page, which has no style of its own.

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const span = (from, to, t, ease = A.ease.linear) => ease(clamp((t - k.time(from)) / (k.time(to) - k.time(from)), 0, 1));
  const escape = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ------------------------------------------------------------ pencil

  // A pencil stroke along points, as an SVG path's d: the hand wobbles a little, from a seeded hand, so
  // that every frame draws the same stroke.
  function strokeD(points, seed, wobble = 1.1) {
    const random = PF.rng(seed);
    return PF.shapes.pathD(points.map(p => ({ x: p.x + (random() - 0.5) * wobble, y: p.y + (random() - 0.5) * wobble })), false);
  }

  // A straight pencil line from a to b, a node every `step` units, overshooting its ends a little.
  function lineD(a, b, seed, { step = 70, wobble = 1.1, over = 2 } = {}) {
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1, ux = (b.x - a.x) / len, uy = (b.y - a.y) / len;
    const n = Math.max(1, Math.round(len / step)), points = [];
    for (let i = 0; i <= n; i++) {
      const s = -over + (i / n) * (len + 2 * over);
      points.push({ x: a.x + ux * s, y: a.y + uy * s });
    }
    return strokeD(points, seed, wobble);
  }

  // A rounded rectangle in one pencil stroke, from the top left round to a little past where it began.
  function boxD(x, y, w, h, r, seed, wobble = 1.1) {
    const points = [{ x: x + r, y }], arc = (cx, cy, from) => {
      // A corner too tight to round is one point, the square's corner.
      if (r < 2) { points.push({ x: cx + r * Math.SQRT2 * Math.cos(from + Math.PI / 4), y: cy + r * Math.SQRT2 * Math.sin(from + Math.PI / 4) }); return; }
      for (let i = 0; i <= 3; i++) {
        const a = from + (i / 3) * (Math.PI / 2);
        points.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
      }
    };
    const edge = (x0, y0, x1, y1) => {
      const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 90));
      for (let i = 1; i < n; i++) points.push({ x: lerp(x0, x1, i / n), y: lerp(y0, y1, i / n) });
    };
    edge(x + r, y, x + w - r, y);
    arc(x + w - r, y + r, -Math.PI / 2);
    edge(x + w, y + r, x + w, y + h - r);
    arc(x + w - r, y + h - r, 0);
    edge(x + w - r, y + h, x + r, y + h);
    arc(x + r, y + h - r, Math.PI / 2);
    edge(x, y + h - r, x, y + r);
    arc(x + r, y + r, Math.PI);
    points.push({ x: x + r + Math.min(18, w / 4), y: y + 0.4 });
    return strokeD(points, seed, wobble);
  }

  // An SVG in a drawer, its coordinates those of the layer, made once.
  function svgIn(el, className = '') {
    if (!el.firstChild) {
      el.innerHTML = `<svg class="${className}" width="1" height="1" style="position:absolute;left:0;top:0;overflow:visible"></svg>`;
    }
    return el.firstChild;
  }

  // A pencil path drawn on from 0 to 1 (drawn), as markup.
  function penPath(d, drawn, { width = 2.6, tone = INK, opacity = 0.85, fill = 'none' } = {}) {
    if (drawn <= 0) return '';
    const dash = drawn >= 1 ? '' : ` stroke-dasharray="${drawn.toFixed(4)} 1"`;
    return `<path d="${d}" pathLength="1"${dash} fill="${fill}" stroke="${tone}" stroke-opacity="${opacity}" stroke-width="${width}" ` +
      'stroke-linecap="round" stroke-linejoin="round"/>';
  }

  // ======================================================== 69-70: two windows on a desk

  // The desk: a fresh sheet of the notebook's paper, on which the windows are drawn, with a camera of its
  // own. Everything on the desk is laid out in its units, which are frame pixels while its camera is at
  // rest; the two pages in the windows are placed by the desk's camera, so that they move with the desk.
  const desk = k.definePage('desk', { world: { width: W, height: H }, describe: 'the desk under the browser windows' });

  // The climax grows (the director's notes on draft 2): on the downbeat the gallery pulls back in one
  // beat into a window three quarters of the frame wide; on the stab of 69.4 the hello window slides in
  // and the two share the desk side by side, the width of the frame between them; on 70.1 the camera
  // pushes in to the hello window, whose return value streams out a line a sixteenth with the hi-hat,
  // and the page shows what it draws on 70.3.
  const TILE = 0.465;                                  // Each window's body once both are in, as a share of the frame.
  const BIG = 0.76;                                    // The gallery's window alone, as it lands.
  const GAP = 40;                                      // Between the two windows, in desk units.
  const BAR = 46;                                      // A window's title bar at the tiles' size, in desk units.
  const RADIUS = 14;                                   // Its corners.
  // The title bar and its words grow with the window, so that the address reads while the gallery's
  // window is large: in desk units, at a window's scale.
  const barOf = scale => (BAR * scale) / TILE;
  // phy's note under the gallery's window, one line, as large as a label to be read: its size, the drop
  // from the window's bottom to its baseline, and how far its ink reaches under the baseline.
  const NOTE = { text: 'the gallery (which others call the library)', size: (1.01 * k.ui.SPEECH.label) / k.ui.capOf('hand'), indent: 10 };
  NOTE.drop = 26 + 0.76 * NOTE.size;
  NOTE.under = 0.26 * NOTE.size;
  // A layout's body top left, framed by the film's rule (the same paper above and below, lifted a
  // little to the optical middle), for windows of a scale with the note under them.
  const LIFT = 0.012 * H;
  const topOf = scale => (H - (barOf(scale) + H * scale + NOTE.drop + NOTE.under)) / 2 - LIFT + barOf(scale);
  const GALLERY = {
    big: { x: (W - W * BIG) / 2, y: topOf(BIG), scale: BIG },
    tile: { x: (W - 2 * W * TILE - GAP) / 2, y: topOf(TILE), scale: TILE },
  };
  // The hello window draws its own title bar inside its page, so its box starts where the gallery's bar does.
  const HELLO = { x: GALLERY.tile.x + W * TILE + GAP, y: GALLERY.tile.y - barOf(TILE), scale: TILE };
  const ADDRESS_BAR = { gallery: 'rareone0602.github.io/phy_friends/', hello: 'hello.html' };
  Object.values(ADDRESS_BAR).forEach(text => k.ensureShowable(text, 'an address bar'));
  const T = {
    pull: ['69.1', '69.2'],                            // The gallery pulls back into its window, in one beat.
    chrome: ['69.1.25', '69.2'],                       // Its window is drawn round it as it lands.
    note: ['69.2.25', 0.55],                           // phy's note under it: the start and the writing's length.
    tile: ['69.4', 0.3],                               // On the stab the hello window slides in and the two share the desk.
    call: '70.1', push: ['70.1', 0.26],                // The call is underlined and the camera pushes in to the hello window.
    stream: ['70.1', 8],                               // Its return value streams out, a line a sixteenth.
    assign: '70.2.75', drawn: '70.3',                  // The assignment is underlined; the page shows what it draws, on the beat.
    end: '71.1',                                       // The cut to phy's lines.
  };
  const TILED = [k.time(T.tile[0]), k.time(T.tile[0]) + T.tile[1]];

  // The desk's camera: at rest, then on the hello window, as large as the frame allows.
  const helloBox = { x: HELLO.x, y: HELLO.y, w: W * HELLO.scale, h: H * HELLO.scale };
  k.camera('desk', { x: W / 2, y: H / 2, zoom: 1 }, { at: 0 });
  k.camera('desk', { x: helloBox.x + helloBox.w / 2, y: helloBox.y + helloBox.h / 2, zoom: Math.min((W - 160) / helloBox.w, (H - 100) / helloBox.h) },
    { at: T.push[0], duration: T.push[1], ease: 'out' });

  // A box on the desk (desk units) as a box of the frame at t, through the desk's camera.
  function onFrame(box, t) {
    const p = desk.toFrame(box.x, box.y, t);
    return { x: p.x, y: p.y, w: box.w * p.scale, h: box.h * p.scale };
  }

  // The gallery's body at t, on the desk: the whole frame, shrinking into its large window in one beat,
  // then into its share of the desk as the hello window comes in. u: how far the window has formed.
  function galleryBox(t) {
    const u = span(T.pull[0], T.pull[1], t, A.ease.out), v = span(TILED[0], TILED[1], t, A.ease.out);
    const { big, tile } = GALLERY, scale = lerp(lerp(1, big.scale, u), tile.scale, v);
    return { x: lerp(lerp(0, big.x, u), tile.x, v), y: lerp(lerp(0, big.y, u), tile.y, v), w: W * scale, h: H * scale, scale, u };
  }

  // The hello window at t, on the desk: sliding in from beyond the frame's right edge on the stab.
  function helloAt(t) {
    const off = W - HELLO.x + 24;
    return { ...helloBox, x: HELLO.x + off * (1 - span(TILED[0], TILED[1], t, A.ease.out)) };
  }

  // A page's placing for a box of the frame (the page's transform turns about its middle).
  const placing = r => ({ scale: r.w / W, x: r.x + r.w / 2 - W / 2, y: r.y + r.h / 2 - H / 2 });

  k.shot(['desk', 'B', 'C'], '69.1', T.end);
  // The gallery's camera shows the whole page while it is in its window.
  k.camera('B', layout.whole, { at: '69.1' });
  k.place('B', '69.1', T.end, t => {
    const box = galleryBox(t), r = onFrame(box, t), round = (RADIUS * box.u) / box.scale;
    return { ...placing(r), clip: box.u > 0 ? `inset(0 round 0 0 ${round}px ${round}px)` : '' };
  });
  k.place('C', '69.1', T.end, t => ({ ...placing(onFrame(helloAt(t), t)), clip: `inset(0 round ${RADIUS / HELLO.scale}px)` }));
  // The hello page is a plain browser page: white, without rules.
  k.paper('C', '69.1', T.end, () => ({ paper: PAGE_WHITE, rule: 'transparent' }));

  // A window's title bar: the tab with its title, and the address field beside it with its address, in
  // the units of the layer it is drawn on. x, y: the bar's top left; w its width; h its height; drawn
  // from 0 to 1. Returns where the tab's title and the address go.
  function titleBar(svg, { x, y, w, h, title, size, drawn, seed, unit = 1 }) {
    const tabW = Math.max(220 * unit, title.length * size * 0.5 + 64 * unit), pad = 14 * unit;
    const tab = strokeD([
      { x: x + pad, y: y + h }, { x: x + pad + 8 * unit, y: y + 12 * unit }, { x: x + pad + 20 * unit, y: y + 8 * unit },
      { x: x + pad + tabW - 20 * unit, y: y + 8 * unit }, { x: x + pad + tabW - 8 * unit, y: y + 12 * unit }, { x: x + pad + tabW, y: y + h },
    ], seed, 0.9 * unit);
    const fx = x + pad + tabW + 22 * unit, fw = w - (fx - x) - 22 * unit, fh = h - 20 * unit;
    const field = boxD(fx, y + 11 * unit, fw, fh, fh / 2, seed + 1, 0.8 * unit);
    svg.innerHTML = penPath(lineD({ x, y: y + h }, { x: x + w, y: y + h }, seed + 2, { wobble: unit }), drawn, { width: 2.4 * unit }) +
      penPath(tab, span(0.2, 0.7, drawn), { width: 2.4 * unit }) +
      penPath(field, span(0.45, 1, drawn), { width: 1.8 * unit, opacity: 0.5 });
    return { tabX: x + pad + tabW / 2, tabY: y + h - 0.3 * h, fieldX: fx + fh / 2, fieldY: y + 11 * unit + fh / 2 };
  }

  // A title bar's words: the tab's title in the hand, the address in the code's face.
  const barWords = (title, address) => `<p class="sh-label hand sh-finale-tab">${escape(title)}</p>` +
    `<p class="sh-label mono ink-2 sh-finale-address-bar">${escape(address)}</p>`;
  // Places a title bar's words where titleBar() says, at `unit` times their size, shown as far as `shown`.
  function placeBarWords(el, { tabX, tabY, fieldX, fieldY }, unit, shown) {
    const [tab, address] = el.querySelectorAll('p');
    Object.assign(tab.style, { fontSize: `${25 * unit}px`, transform: `translate(${tabX}px, ${tabY}px) translate(-50%, -0.85em) rotate(-1deg)`, opacity: String(shown) });
    Object.assign(address.style, { fontSize: `${21 * unit}px`, transform: `translate(${fieldX}px, ${fieldY}px) translate(0, -50%)`, opacity: String(shown) });
  }

  // ---- the gallery's window, drawn on the desk round the shrinking page, its bar as large as its window

  k.draw(desk.over, T.pull[0], T.end, (el, t) => {
    const box = galleryBox(t), drawn = span(T.chrome[0], T.chrome[1], t, A.ease.out), unit = box.scale / TILE;
    if (!el.firstChild) {
      el.innerHTML = '<svg class="graphite" width="1" height="1" style="position:absolute;left:0;top:0;overflow:visible"><rect class="bar"/><g class="frame"></g><g class="title"></g></svg>' +
        barWords('phy’s fwiends', ADDRESS_BAR.gallery);
    }
    const svg = el.firstChild, top = box.y - barOf(box.scale) * box.u;
    const bar = svg.querySelector('.bar');
    Object.entries({ x: box.x, y: top, width: box.w, height: Math.max(0, box.y - top + 1), fill: PAPER }).forEach(([a, v]) => bar.setAttribute(a, String(v)));
    svg.querySelector('.frame').innerHTML = penPath(boxD(box.x - 2, top, box.w + 4, box.h + box.y - top + 2, RADIUS * box.u, 11), drawn, { width: 2.6 * Math.sqrt(unit) });
    const places = titleBar(svg.querySelector('.title'), { x: box.x, y: top, w: box.w, h: barOf(box.scale) * box.u, title: 'phy’s fwiends', size: 28 * unit, drawn, seed: 21, unit });
    placeBarWords(el, places, unit, span(0.5, 1, drawn));
  });

  // ---- the hello window: page C, its title bar and frame drawn inside it, in C's own pixels

  const C = { bar: BAR / HELLO.scale, unit: 1 / HELLO.scale };   // In C's pixels.
  k.draw(hello.screen, T.pull[0], T.end, el => {
    if (el.firstChild) return;
    el.innerHTML = '<svg class="graphite" width="1" height="1" style="position:absolute;left:0;top:0;overflow:visible"><g class="title"></g><g class="frame"></g></svg>' +
      barWords('hello, world', ADDRESS_BAR.hello);
    const svg = el.firstChild;
    const places = titleBar(svg.querySelector('.title'), { x: 0, y: 0, w: W, h: C.bar, title: 'hello, world', size: 28 * C.unit, drawn: 1, seed: 31, unit: C.unit });
    svg.querySelector('.frame').innerHTML = penPath(boxD(3 * C.unit, 3 * C.unit, W - 6 * C.unit, H - 6 * C.unit, (RADIUS - 2) * C.unit, 41, C.unit), 1, { width: 2.6 * C.unit });
    placeBarWords(el, places, C.unit, 1);
  });

  // ---- the three lines, the return value and the drawing

  // The three lines, verbatim; run at the repository's root, they return the string streamed below and
  // draw phy on the page, with no background of their own ({ bg: false }, as the library takes it).
  const LINES = [
    '<script src="src/phyfriends.js"></script>',
    '<script src="characters/phy/phy.js"></script>',
    '<script>document.body.innerHTML = PhyFriends.render(\'phy\', { bg: false });</script>',
  ];
  LINES.forEach(line => k.ensureShowable(line, 'a line of hello, world'));
  const RENDER = { bg: false };                        // The options the third line passes.
  // In C's pixels: the code's left edge, size, first baseline and the step between lines, sized so that
  // the longest line fits the window.
  const CODE = { x: 112, top: C.bar + 72, step: 58 };
  CODE.size = Math.floor((W - CODE.x - 60) / (0.6 * Math.max(...LINES.map(line => line.length))));
  const CALL = { line: 2, find: 'PhyFriends.render(\'phy\', { bg: false })' }, ASSIGN = { line: 2, find: 'document.body.innerHTML =' };
  const RESULT = { x: 64, top: CODE.top + 3 * CODE.step - 6, bottom: H - 30 };   // The result panel, under the lines.
  // The return value's text: its size, and how much of each line's sixteenth it takes to stream out.
  const STREAM = { size: 36, lines: T.stream[1], typing: 0.7 };

  // The real string from the real call, as a fresh page makes it (its first render takes the uid pf1),
  // made once from the spec as the film draws it at t; the era is the same over the whole window.
  const phyDrawn = k.friend('phy');
  // The three lines run the library as it is today, so by bar 70 the film's era must have reached the
  // library's own shared constants: the rice ball's taper and the standing template. If it has not, the
  // window would not show what the lines draw: a note says so, as for words drawn too small.
  const callAt = k.time(T.call), eraThen = k.era.values(callAt);
  const today = { taper: Number((SayHi.source.onigiri.text.match(/taper: ([\d.]+)/) || [])[1]) };
  (intro.template ? intro.template.entries : []).forEach(entry => { today[entry.name] = entry.after; });
  for (const [name, value] of Object.entries(today)) {
    if (!Number.isFinite(value) || !(name in eraThen) || Math.abs(eraThen[name] - value) < 1e-6) continue;
    const note = `say hi: finale: at ${T.call} the film's ${name} is ${eraThen[name]}, the library's own ${value}: ` +
      'the hello window does not show what the three lines draw today';
    SayHi.notes.push(note);
    console.warn(note);
  }
  let returned = null;
  const returnValue = t => {
    if (returned === null) returned = PF.render(phyDrawn.spec(t), { ...RENDER, uid: 'pf1' });
    return returned;
  };

  k.draw(hello.screen, T.tile[0], T.end, (el, t) => {
    if (!el.firstChild) {
      el.innerHTML = '<div class="sh-code sh-finale-code"></div><svg class="sh-finale-marks graphite" width="1" height="1" style="position:absolute;left:0;top:0;overflow:visible"></svg>' +
        `<pre class="sh-finale-stream" style="position:absolute;margin:0;line-height:1.3;white-space:pre;font-family:var(--mono);color:var(--ink-2)"></pre>` +
        '<div class="sh-finale-page" style="position:absolute"></div>';
      const code = el.querySelector('.sh-finale-code');
      code.innerHTML = LINES.map((line, i) => `<p class="sh-line mono" style="top:${CODE.top + i * CODE.step}px;left:${CODE.x}px;font-size:${CODE.size}px">` +
        `<span class="sh-n">${i + 1}</span><span class="sh-t">${escape(line)}</span></p>`).join('');
      Object.assign(el.querySelector('.sh-finale-stream').style, { left: `${RESULT.x}px`, top: `${RESULT.top + 8}px`, fontSize: `${STREAM.size}px` });
      Object.assign(el.querySelector('.sh-finale-page').style, { left: `${RESULT.x - 8}px`, top: `${RESULT.top}px` });
    }
    const advance = el.querySelector('.sh-t').offsetWidth / LINES[0].length;
    // The underlines: the call when it is made, the assignment when the page takes its value.
    const underline = (which, from, seed) => {
      const line = LINES[which.line], i = line.indexOf(which.find), y = CODE.top + which.line * CODE.step + 10;
      const x0 = CODE.x + i * advance - 4, x1 = CODE.x + (i + which.find.length) * advance + 4;
      return penPath(strokeD([{ x: x0, y: y + 1 }, { x: (x0 + x1) / 2, y: y - 1.5 }, { x: x1, y: y + 0.5 }], seed, 1.2),
        span(from, k.time(from) + 0.16, t, A.ease.out), { width: 3.4 });
    };
    el.querySelector('.sh-finale-marks').innerHTML =
      penPath(lineD({ x: RESULT.x - 20, y: RESULT.top - 18 }, { x: W - RESULT.x + 20, y: RESULT.top - 18 }, 51), 1, { width: 2, opacity: 0.45 }) +
      underline(CALL, T.call, 52) + underline(ASSIGN, T.assign, 53);
    // The return value streams out until the page takes it; then the page shows what it draws.
    const stream = el.querySelector('.sh-finale-stream'), page = el.querySelector('.sh-finale-page');
    const showsPage = t >= k.time(T.drawn);
    const streams = t >= k.time(T.stream[0]);
    stream.style.display = !showsPage && streams ? '' : 'none';
    page.style.display = showsPage ? '' : 'none';
    if (!showsPage && streams) {
      // A line of the return value a sixteenth, with the hi-hat: each streams out over the first part of its
      // sixteenth, so that the text races on and every line lands on its tick.
      const perLine = Math.floor((W - 2 * RESULT.x) / (STREAM.size * 0.6)), text = returnValue(t);
      const sixteenths = (t - k.time(T.stream[0])) / SIXTEENTH, row = Math.floor(sixteenths + 1e-9);
      const part = clamp((sixteenths - row) / STREAM.typing, 0, 1);
      const shown = Math.min(text.length, Math.round(perLine * (row >= STREAM.lines ? STREAM.lines : row + part)));
      const rows = [];
      for (let i = 0; i < shown; i += perLine) rows.push(text.slice(i, Math.min(shown, i + perLine)));
      if (stream.dataset.shown !== String(shown)) {
        k.ensureShowable(text.slice(0, shown), 'the return value');
        stream.innerHTML = escape(rows.join('\n'));
        stream.dataset.shown = String(shown);
      }
    }
    if (showsPage) {
      const size = RESULT.bottom - RESULT.top, variant = String(Math.floor(t * k.BOIL + 1e-9));
      if (page.dataset.variant !== variant) {
        page.innerHTML = phyDrawn.svg(t, { ...RENDER, uid: 'sh-finale-hello' });
        const svg = page.firstElementChild;
        svg.setAttribute('width', String(size));
        svg.setAttribute('height', String(size));
        page.dataset.variant = variant;
      }
    }
  });

  // ---- the gallery watches the second window

  // While the hello window is in, every friend in the gallery's window looks across at it, all at once
  // (one thing that every stranger looks at), and back at you as the film cuts away. Claude, at its
  // laptop, keeps its eyes on its work.
  const ACROSS = { x: layout.world.width + 900, y: layout.floors[0] + 2 * RULE };
  k.cue('B', (scene, cast) => {
    for (const [name, actor] of Object.entries(cast)) {
      if (name === layout.claude) continue;
      actor.look(ACROSS, { at: k.time(T.tile[0]) }).look('viewer', { at: k.time(T.end) });
    }
  });

  // ---- phy's note under the gallery's window

  // Written on the desk, so that it moves with the desk's camera, on one line under the window's left
  // edge as it lands; it keeps its place under that edge, and its size, as the window makes room for the
  // other, and leaves the frame as the camera goes to it. A holder carries it with the window.
  const noteAnchor = t => {
    const box = galleryBox(t);
    return { x: box.x + NOTE.indent, y: box.y + box.h + NOTE.drop };
  };
  const noteFrom = noteAnchor(k.time(T.note[0]));
  const holder = k.draw(desk.over, T.note[0], T.end, (el, t) => {
    const p = noteAnchor(t);
    el.style.transform = `translate(${p.x - noteFrom.x}px, ${p.y - noteFrom.y}px)`;
  });
  k.ui.hand(holder.el, NOTE.text, { kind: 'label', x: noteFrom.x, y: noteFrom.y, size: NOTE.size, rotate: -0.5, tone: 'ink-2', mustRead: false,
    at: T.note[0], seconds: T.note[1], until: T.end });

  // ======================================================== 71-72: phy's lines

  // A fresh sheet, ruled more widely than the notebook's other pages look (the camera is farther off),
  // phy's three lines on every other rule, at the size of phy's lines, and left aligned so that the
  // longest is centered. Each is written fast, on one of the bar's hits (1, the "and" of 2, and 4), and
  // whole within the beat; then all three are held while bar 72's chord rings out.
  const THESIS = {
    lines: ['one JavaScript library.', 'no build, no dependencies.', 'the fwiends are their owners’.'],
    at: ['71.1', '71.2.5', '71.4'], seconds: 0.9 * BEAT, zoom: 1.6, first: 9 * RULE, apart: 2 * RULE,
    widest: 14.68,       // The longest line's width, in its font size (Shantell Sans, measured).
    ascent: 0.76, descent: 0.04,   // How far the first line's ascenders and the last line's ink reach (it has no descenders).
  };
  const thesis = k.definePage('thesis', { world: { width: W, height: H }, describe: 'phy\'s three lines' });
  k.shot('thesis', T.end, '73.1');
  const thesisSize = (1.01 * k.ui.SPEECH.hand) / k.ui.capOf('hand') / THESIS.zoom;
  const thesisLeft = W / 2 - (THESIS.widest * thesisSize) / 2;
  const thesisLast = THESIS.first + (THESIS.lines.length - 1) * THESIS.apart;
  const thesisView = k.frame('thesis', {
    top: THESIS.first - THESIS.ascent * thesisSize, bottom: thesisLast + THESIS.descent * thesisSize, x: W / 2, zoom: THESIS.zoom,
  });
  // Still while the lines are written; then, while they are held, the camera leans in a little.
  k.camera('thesis', thesisView, { at: 0 });
  k.camera('thesis', { zoom: THESIS.zoom * 1.04 }, { at: '72.1', duration: k.time('73.1') - k.time('72.1'), ease: 'inOut' });
  THESIS.lines.forEach((text, i) => {
    k.ui.hand(thesis.over, text, { x: thesisLeft, y: THESIS.first + i * THESIS.apart, size: thesisSize, at: THESIS.at[i], seconds: THESIS.seconds, until: '73.1' });
  });

  // ======================================================== 74.2-77: the address

  const ADDRESS = 'rareone0602.github.io/phy_friends/#phy';
  k.ensureShowable(ADDRESS, 'the address');
  // The address: centered on page B's width, its baseline on the band's second line (pages.js), in the
  // code's face at 1.3 times its first size, in head units, so that it reads as large on screen as page
  // B shown whole makes it.
  const band = layout.band || { lines: [layout.bands.below, layout.bands.below + 4 * RULE] };
  const PLACE = { x: layout.world.width / 2, y: band.lines[1], size: 73 * layout.perPixel };
  const TYPE = { address: ['74.2', '74.3.5'], blinks: '76.2' };
  const BLINKS = k.pattern('-.-', TYPE.blinks);         // The caret's pattern, a sixteenth to a unit, as the eyes' was.
  const BLINKS_END = BLINKS[BLINKS.length - 1].to;      // A pause runs from here to the loop.

  // Whether the address's caret shows at t: solid from the first character typed, and dark for each
  // element of its pattern, as the eyes closed for each element of theirs.
  const caretOn = t => !k.during(BLINKS, t);

  // Typed text: how much of it shows at t, a character a step over [from, to).
  const typed = (text, [from, to], t) => text.slice(0, Math.round(text.length * span(from, to, t)));

  // The address's measures, from its face: its width and the caret's place at its end.
  let addressWidth = null;
  k.draw(gallery.over, TYPE.address[0], Infinity, (el, t) => {
    if (!el.firstChild) {
      el.innerHTML = `<p class="sh-intro-line mono sh-finale-address" style="font-size:${PLACE.size}px;color:var(--ink)"><span class="sh-t"></span><span class="sh-caret pill"></span></p>`;
    }
    const address = el.firstChild, text = address.querySelector('.sh-t');
    if (addressWidth === null) {
      text.textContent = ADDRESS;
      addressWidth = text.offsetWidth;
    }
    text.textContent = typed(ADDRESS, TYPE.address, t);
    address.style.transform = `translate(${PLACE.x - addressWidth / 2}px, ${PLACE.y}px) translateY(-0.82em)`;
    const caret = address.querySelector('.sh-caret');
    caret.style.left = `${text.offsetWidth + 0.08 * PLACE.size}px`;
    caret.style.visibility = caretOn(t) ? '' : 'hidden';
  });
  // Where the caret's middle lies on page B once the address is whole.
  const caretX = () => PLACE.x + (addressWidth ?? 0.6 * PLACE.size * ADDRESS.length) / 2 + 0.08 * PLACE.size + 0.22 * PLACE.size;

  // ---- the caret's tape: on a rule over the address's end, clear of its ascenders, a pencilled dash or
  // dot for each element as the caret blinks it, left to right, each as long as its time, ending over
  // the caret, as the eyes' tape ran under the eyes.
  const TAPE = { y: band.lines[1] - 3 * RULE, unit: 34 * layout.perPixel, gap: 12 * layout.perPixel, thick: 12 * layout.perPixel, dot: 18 * layout.perPixel };
  const random = PF.rng(73);
  const tapeMarks = BLINKS.map(element => ({ ...element, dy: (random() - 0.5) * 3, tilt: (random() - 0.5) * 4, bow: (random() - 0.5) * 3 }));
  k.draw(gallery.over, TYPE.blinks, Infinity, (el, t) => {
    const svg = svgIn(el, 'graphite'), start = caretX() - ((BLINKS_END - BLINKS[0].from) / SIXTEENTH) * TAPE.unit;
    const x = time => start + ((time - BLINKS[0].from) / SIXTEENTH) * TAPE.unit;
    svg.innerHTML = tapeMarks.filter(m => t >= m.from).map(m => {
      const drawn = span(m.from, m.to, t), x0 = x(m.from), y = TAPE.y + m.dy;
      if (m.kind === 'dot') {
        const r = (TAPE.dot / 2) * (0.6 + 0.4 * drawn);
        return `<ellipse cx="${x0 + TAPE.dot / 2}" cy="${y}" rx="${r}" ry="${r * 0.9}" fill="${INK}" fill-opacity="0.85" transform="rotate(${m.tilt} ${x0} ${y})"/>`;
      }
      const x1 = x0 + (x(m.to) - x0 - TAPE.gap) * drawn;
      return `<path d="M${x0} ${y}Q${(x0 + x1) / 2} ${y + m.bow} ${x1} ${y - m.bow * 0.3}" fill="none" stroke="${INK}" stroke-opacity="0.85" ` +
        `stroke-width="${TAPE.thick}" stroke-linecap="round" transform="rotate(${m.tilt} ${x0} ${y})"/>`;
    }).join('');
  });

  // ======================================================== 76: "73, phy", the colophon, the loop

  const frame0 = k.definePage('frame0', { world: SayHi.layout.A.world, margin: SayHi.layout.A.margin, describe: 'frame 0, again' });
  k.shot(['B', 'frame0'], '76.1', k.beats.DURATION);
  // Page B as the gallery's shot leaves it at 76.1 (its export), else shown whole with the band's two lines.
  const END_VIEW = k.exportsOf('gallery').end || (layout.wide && layout.wide.band && layout.wide.band[1]) || layout.whole;
  k.camera('B', END_VIEW, { at: '76.1' });
  // phy's sign-off, as large as a label, though it need not be read: where phy wrote "say hi.", on the
  // band's first line from its left.
  k.ui.hand(gallery.over, '73, phy', { kind: 'label', x: band.left ?? layout.world.width * 0.1, y: band.lines[0], at: '76.1', seconds: 0.55, mustRead: false });

  // The colophon, a diagram of how the film is made, drawn in units of its own from its top left and
  // placed on the gallery's page (COLO), in the top right corner of the frame that page B is shown in
  // from 76.1, clear of the friends. Row one: a page, an arrow marked seek(t) over thirty a second
  // written in strokes (||||-, binary: | for 1, a dash for 0), a frame, and the same frame again (each
  // frame the same, byte for byte). Row two: the page sought at 0 gives the last panel, the largest:
  // frame 0 itself (the frame0 page, placed in the panel).
  const FRAME_BOX = { w: 112, h: 63 }, PANEL = { x: 342, y: 100, w: 240, h: 135 };
  // Its width and its margins from the frame's top and right edges, in frame pixels: small, but large
  // enough to show what it draws.
  const COLO = { onFrame: 300, margin: { top: 64, right: 72 }, width: PANEL.x + PANEL.w + 5, height: PANEL.y + PANEL.h + 5 };
  {
    const perPixel = 1 / (gallery.fit * (END_VIEW.zoom ?? 1));
    COLO.scale = (COLO.onFrame * perPixel) / COLO.width;
    COLO.x = END_VIEW.x + (W / 2 - COLO.margin.right) * perPixel - COLO.scale * COLO.width;
    COLO.y = END_VIEW.y - (H / 2 - COLO.margin.top) * perPixel;
  }
  // A point of the colophon on the gallery's page.
  const onPage = (x, y) => ({ x: COLO.x + COLO.scale * x, y: COLO.y + COLO.scale * y });
  const COLOPHON = ['76.1', '76.2.5'];                 // Drawn on over these beats.
  const REVEAL = ['76.2.1', '76.2.5'];                 // Frame 0 shows in its panel.
  // The panel grows to fill the frame over the last half beat, in the pause after the caret's pattern,
  // easing in, so that it closes on the loop's first frame, which is frame 0 itself.
  const GROW = [k.time('76.4.5'), k.beats.DURATION];
  if (GROW[0] < BLINKS_END) throw new Error('say hi: finale: the panel would grow before the caret has blinked its pattern');

  // The colophon's strokes, each with the stretch of the drawing-on (0 to 1) over which it is drawn.
  const colophon = (() => {
    const P = (x, y) => ({ x, y }), strokes = [];
    let seed = 60;
    const add = (d, from, to, o = {}) => strokes.push({ d, from, to, o });
    const line = (a, b, o) => lineD(a, b, seed++, { over: 0.5, wobble: 0.6, ...o });
    // The page: a sheet with a turned corner, and four rules.
    add(strokeD([P(40, 0), P(0, 0), P(0, 70), P(54, 70), P(54, 14), P(40, 0), P(40, 14), P(54, 14)], seed++, 0.8), 0, 0.2, { width: 2.6 });
    for (let i = 0; i < 4; i++) add(line(P(8, 28 + i * 10), P(46, 28 + i * 10)), 0.08, 0.22, { width: 1.6, opacity: 0.5 });
    // seek(t): the arrow to a frame, and thirty under it, four ones and a nought.
    add(line(P(66, 35), P(184, 35), { step: 60 }), 0.15, 0.32);
    add(strokeD([P(174, 28), P(186, 35), P(174, 42)], seed++, 0.5), 0.3, 0.36);
    for (let i = 0; i < 4; i++) add(line(P(98 + i * 10, 46), P(98 + i * 10, 64)), 0.3 + i * 0.025, 0.36 + i * 0.025, { width: 2.4 });
    add(line(P(140, 55), P(160, 55)), 0.41, 0.46, { width: 2.4 });
    // A frame, and the same frame again: the same marks in each, three bars between them.
    const frame = x => strokeD([P(x, 3), P(x + FRAME_BOX.w, 3), P(x + FRAME_BOX.w, 3 + FRAME_BOX.h), P(x, 3 + FRAME_BOX.h), P(x, 2)], 70, 0.7);
    // In each frame, the same small friend on its rule: a head with two ears and two pill eyes.
    const inside = x => [line(P(x + 16, 53), P(x + 96, 53), { over: 0 }),
      strokeD([P(x + 45, 47), P(x + 43, 36), P(x + 46, 21), P(x + 53, 29), P(x + 63, 29), P(x + 70, 21), P(x + 73, 36), P(x + 71, 47),
        P(x + 63, 52), P(x + 53, 52), P(x + 45, 47)], 71, 0.3),
      lineD(P(x + 53, 36), P(x + 53, 43), 72, { over: 0, wobble: 0.2 }), lineD(P(x + 64, 36), P(x + 64, 43), 73, { over: 0, wobble: 0.2 })];
    add(frame(198), 0.33, 0.5, { width: 2.4 });
    inside(198).forEach(d => add(d, 0.45, 0.58, { width: 1.8, opacity: 0.65 }));
    for (let i = 0; i < 3; i++) add(line(P(320, 25 + i * 9.5), P(340, 25 + i * 9.5)), 0.52 + i * 0.02, 0.58 + i * 0.02, { width: 2.2 });
    add(frame(350), 0.55, 0.7, { width: 2.4 });
    inside(350).forEach(d => add(d, 0.65, 0.76, { width: 1.8, opacity: 0.65 }));
    // seek(0): from the page down and along to the last panel.
    const mid = PANEL.y + PANEL.h / 2;
    add(strokeD([P(27, 80), P(27, 128), P(36, mid - 8), P(60, mid), P(200, mid), P(PANEL.x - 16, mid)], seed++, 0.7), 0.45, 0.72);
    add(strokeD([P(PANEL.x - 26, mid - 7), P(PANEL.x - 14, mid), P(PANEL.x - 26, mid + 7)], seed++, 0.5), 0.7, 0.76);
    // The last panel's box, at the film's own shape, a little outside the panel.
    add(boxD(PANEL.x - 5, PANEL.y - 5, PANEL.w + 10, PANEL.h + 10, 4, seed++, 0.8), 0.68, 0.92, { width: 2.8 });
    return strokes;
  })();
  const COLO_LABELS = [{ text: 'seek(t)', x: 125, y: 24, from: 0.2, to: 0.36 }, { text: 'seek(0)', x: 150, y: PANEL.y + PANEL.h / 2 - 14, from: 0.55, to: 0.72 }];

  k.draw(gallery.over, COLOPHON[0], Infinity, (el, t) => {
    const svg = svgIn(el, 'graphite'), drawn = span(COLOPHON[0], COLOPHON[1], t, A.ease.out);
    Object.assign(el.style, { transformOrigin: '0 0', transform: `translate(${COLO.x}px, ${COLO.y}px) scale(${COLO.scale})` });
    svg.innerHTML = colophon.map(s => penPath(s.d, span(s.from, s.to, drawn), s.o)).join('');
    if (!el.querySelector('p')) {
      el.insertAdjacentHTML('beforeend', COLO_LABELS.map(l => `<p class="sh-label mono ink-2" style="font-size:24px">${escape(l.text)}</p>`).join(''));
    }
    el.querySelectorAll('p').forEach((p, i) => {
      const l = COLO_LABELS[i];
      p.style.transform = `translate(${l.x}px, ${l.y}px) translate(-50%, -0.85em) rotate(-1deg)`;
      p.style.opacity = String(span(l.from, l.to, drawn));
    });
  });

  // Frame 0's panel: where it lies in the frame at t, then growing to fill it, exactly, by the last frame.
  function panelRect(t) {
    const corner = onPage(PANEL.x, PANEL.y), p = gallery.toFrame(corner.x, corner.y, t);
    const small = { x: p.x, y: p.y, w: PANEL.w * COLO.scale * p.scale, h: PANEL.h * COLO.scale * p.scale };
    const u = span(GROW[0], GROW[1], t, v => v * v);
    if (u <= 0) return small;
    if (u >= 1) return { x: 0, y: 0, w: W, h: H };
    // Grows about the point that both rects keep (their homothety's center), its size eased in on a
    // square, so that every frame of the half beat grows it by about the same ratio, quickening into the
    // frame it becomes.
    return { x: lerp(small.x, 0, u), y: lerp(small.y, 0, u), w: lerp(small.w, W, u), h: lerp(small.h, H, u) };
  }

  k.place('frame0', '76.1', k.beats.DURATION, t => {
    const r = panelRect(t), reveal = span(REVEAL[0], REVEAL[1], t, A.ease.out);
    return { ...placing(r), clip: reveal < 1 ? `inset(0 ${(1 - reveal) * 100}% 0 0)` : '' };
  });

  // ---- frame 0, again: the intro's own painters at t = 0, under page A's camera at 0

  k.camera('frame0', k.page('A').cameraAt(0), { at: 0 });
  if (intro.frame0) {
    k.draw(frame0.under, '76.1', k.beats.DURATION, el => intro.frame0.line(el));
    k.draw(frame0.over, '76.1', k.beats.DURATION, el => intro.frame0.copy(el));
  }
});
