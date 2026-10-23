/*!
 * phy_friends/workings: how a page is made, drawn over it in blue pencil while the reader asks to see it.
 *
 * An illustrator lays a drawing out in non-photo blue, a pencil the camera does not see, before going
 * over it in graphite. A page that loads this module can show its own workings so. Over each friend
 * goes the construction its spec describes (the head, the face and the body, a center line, the line
 * of the eyes and the eyes on it, the ears and the tail's spine) while the friend's own drawing fades;
 * beside any part of the page goes a note in the same blue; and the page's own elements (a note on how
 * to use the library, say) may wait hidden until then. A page that does not load the module has none
 * of it, and one that does shows nothing until the reader asks.
 *
 *   const workings = PhyFriends.workings.attach({
 *     button,                         // Shows and hides the workings; its aria-pressed follows them.
 *     stage,                          // A live stage, whose friends sit still while the workings show.
 *     friends: stage.friends,         // The friends to draw the construction of, each { name, rig }.
 *     notes: [{ at, text, place }],   // A note (HTML) by an element: place is 'right', 'left', 'above',
 *                                     // 'below' or 'over', where it stands in for the element's own text.
 *                                     // A note may also take dx and dy (px), a size (px), and media, a
 *                                     // query outside which it is left out; at may be a function that
 *                                     // returns the element, or a box in the window ({ left, top, ... }).
 *     reveal: [element],              // The page's own elements, hidden until the workings show.
 *     ink,                            // The pencil's color: the kit's --blue-pencil by default.
 *   });
 *   workings.show(true);  workings.shown;  workings.detach();
 *   PhyFriends.workings.construction('howdi');   // The construction alone, as SVG in head space.
 *
 * Every part is optional, so that a page chooses what it shows. Escape hides the workings. A note that
 * would leave the window is left out, so that a narrow page keeps what fits. Notes are for the eye
 * (aria-hidden): what a reader needs to read goes in an element that the workings reveal.
 *
 * Loads as a classic script after lib/fwiends/src/phyfriends.js (PhyFriends.workings).
 */
(function (root) {
  'use strict';

  const PF = root.PhyFriends;
  if (!PF) throw new Error('phy_friends/workings: load lib/fwiends/src/phyfriends.js first');

  const INK = 'var(--blue-pencil, #1c77ad)';
  const FADE = 0.26;         // How much of a friend's own drawing shows through its construction.
  const OVERHANG = 18;       // How far the center line runs past the head and the body, in head units.
  const SMALLEST_EAR = 12;   // An ear shorter than this (a plush's stub) is no shape to construct.
  const EDGE = 4;            // How near the window's edge a note may come, in px.
  const GAP = 12;            // The space between a note and what it is about, in px.
  const TILT = -2;           // A note's tilt in degrees, as for any margin note (STYLE.md §3).
  const STYLE = [
    `.pf-workings > :not(.pf-construction) { opacity: ${FADE}; }`,
    '.pf-construction { pointer-events: none; }',
    '.pf-construction * { fill: none; stroke: var(--pf-workings-ink); stroke-width: 1.4px; vector-effect: non-scaling-stroke;',
    '  stroke-linecap: round; stroke-linejoin: round; }',
    '.pf-construction .pf-faint { stroke-opacity: .6; stroke-dasharray: 3 4; }',
    '.pf-workings-note { position: absolute; z-index: 60; margin: 0; pointer-events: none; color: var(--pf-workings-ink);',
    '  font-size: 16px; line-height: 1.25; white-space: nowrap; transform-origin: 0 100%; }',
    '.pf-workings-note code { color: inherit; }',
    '.pf-workings-covered { color: transparent !important; }',
    '@media print { .pf-construction, .pf-workings-notes { display: none; } .pf-workings > * { opacity: 1; } }',
  ].join('\n');

  const finite = (...values) => values.every(Number.isFinite);
  const path = (d, faint) => `<path${faint ? ' class="pf-faint"' : ''} d="${d}"/>`;

  // The construction of a friend, as SVG in head space: an ellipse for the head, the face and the body (or the
  // outline a spec gives instead, as Claude's block of a head), a center line, the line of the eyes with an
  // upright stroke for each eye, a triangle for each ear, and the tail's spine to a circle at its tip. A part
  // that a spec lacks, or whose numbers do not make a shape, is left out.
  function construction(specOrName) {
    const spec = PF.get(specOrName), S = PF.shapes, parts = [];
    const ellipse = (e, faint) => e && finite(e.rx) && parts.push(path(S.ellipseD({
      cx: e.cx || 0, cy: e.cy || 0, rx: e.rx, ry: Number.isFinite(e.ry) ? e.ry : e.rx }), faint));
    const head = spec.head || {}, body = spec.body || {}, eyes = spec.eyes, ears = spec.ears, tail = spec.tail;
    if (Array.isArray(head.nodes)) parts.push(path(`M${head.nodes.map(([x, y]) => `${x} ${y}`).join(' L ')} Z`));
    else ellipse(head);
    ellipse(spec.face, true);
    ellipse(body);
    const ys = Array.isArray(head.nodes) ? head.nodes.map(([, y]) => y) : [(head.cy || 0) - head.ry, (head.cy || 0) + head.ry];
    const top = Math.min(...ys), bottom = Math.max(...ys, finite(body.cy, body.ry) ? body.cy + body.ry : -Infinity);
    const halfWidth = Array.isArray(head.nodes) ? Math.max(...head.nodes.map(([x]) => Math.abs(x))) : head.rx;
    if (finite(top, bottom)) parts.push(path(`M0 ${top - OVERHANG} V ${bottom + OVERHANG}`, true));
    if (eyes && finite(eyes.x, eyes.y, halfWidth)) {
      const h = Number.isFinite(eyes.h) ? eyes.h : 30;
      parts.push(path(`M${-halfWidth - 10} ${eyes.y} H ${halfWidth + 10}`, true));
      for (const side of [-1, 1]) parts.push(path(`M${side * eyes.x} ${eyes.y - h / 2} V ${eyes.y + h / 2}`));
    }
    if (ears && finite(ears.width, ears.length, ears.angle) && ears.length >= SMALLEST_EAR && Array.isArray(ears.base)) {
      const [x, y] = ears.base, w = ears.width / 2;
      const triangle = path(`M${-w} 0 L ${ears.lean || 0} ${-ears.length} L ${w} 0`);
      for (const mirror of ['', 'scale(-1 1) ']) parts.push(`<g transform="${mirror}translate(${x} ${y}) rotate(${-ears.angle})">${triangle}</g>`);
    }
    if (tail && finite(tail.length, tail.angle) && Array.isArray(tail.base)) {
      const bend = S.tailBend(tail), spine = [];
      for (let i = 0; i <= 20; i++) spine.push(bend(0, -i / 20 * tail.length));
      const [tipX, tipY] = spine[spine.length - 1], side = tail.base[0] < 0 ? -1 : 1;
      parts.push(`<g transform="translate(${tail.base[0]} ${tail.base[1]}) scale(${side} 1) rotate(${tail.angle})">` +
        path(`M${spine.map(([px, py]) => `${px} ${py}`).join(' L ')}`) +
        `<circle cx="${tipX}" cy="${tipY}" r="${(tail.width || 20) / 5}"/></g>`);
    }
    return parts.join('');
  }

  // Shows a page's workings on request: see the comment at the top for the options.
  function attach({ button = null, stage = null, friends = stage ? stage.friends : [], notes = [], reveal = [], ink = INK } = {}) {
    addStyle();
    let shown = false, layer = null, placing = 0;
    const covered = new Set();
    const self = { get shown() { return shown; }, show, toggle: () => show(!shown), detach };
    for (const element of reveal) element.hidden = true;
    if (button) {
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', toggle);
    }
    document.addEventListener('keydown', onKey);
    addEventListener('resize', placeSoon);
    return self;

    function toggle() { show(!shown); }

    function show(on) {
      if (!!on === shown) return self;
      shown = !!on;
      if (button) button.setAttribute('aria-pressed', String(shown));
      if (stage && stage.sitStill) stage.sitStill(shown);
      for (const element of reveal) element.hidden = !shown;
      for (const friend of friends) drawOver(friend, shown);
      if (shown) {
        layer = document.createElement('div');
        layer.className = 'pf-workings-notes';
        layer.setAttribute('aria-hidden', 'true');
        layer.style.setProperty('--pf-workings-ink', ink);
        document.body.appendChild(layer);
        for (const note of notes) layer.appendChild(noteElement(note));
        place();
      } else {
        layer.remove();
        layer = null;
        for (const element of covered) element.classList.remove('pf-workings-covered');
        covered.clear();
      }
      return self;
    }

    // Draws a friend's construction over its drawing, through the drawing's own camera, while the drawing
    // fades; or takes it away again.
    function drawOver({ name, rig }, on) {
      const svg = rig && rig.svg, drawing = svg && svg.querySelector('[id$="-drawing"]');
      if (!drawing) return;
      svg.querySelectorAll(':scope > .pf-construction').forEach(old => old.remove());
      svg.classList.toggle('pf-workings', on);
      if (on) {
        svg.insertAdjacentHTML('beforeend', `<g class="pf-construction" aria-hidden="true" style="--pf-workings-ink: ${ink}" ` +
          `transform="${drawing.getAttribute('transform')}">${construction(name)}</g>`);
      }
    }

    function noteElement({ text, at, place = 'right', dx = 0, dy = 0, size = null, media = null }) {
      const element = document.createElement('p');
      element.className = 'pf-workings-note hand';
      element.innerHTML = text;
      element.pfNote = { at, place, dx, dy, size, media };
      return element;
    }

    // Puts each note by what it is about, and leaves out any that would leave the window.
    function place() {
      if (!layer) return;
      const windowWidth = document.documentElement.clientWidth;
      for (const element of layer.children) {
        const { at, place: where, dx, dy, size, media } = element.pfNote;
        const target = typeof at === 'function' ? at() : at;
        const isElement = !!(target && target.getBoundingClientRect);
        if (!target || (media && !matchMedia(media).matches) || (where === 'over' && !isElement)) {
          element.hidden = true;
          continue;
        }
        const box = isElement ? target.getBoundingClientRect() : target, x = scrollX, y = scrollY;
        element.hidden = false;
        element.style.transform = where === 'over' ? 'none' : `rotate(${TILT}deg)`;
        element.style.fontSize = size ? `${size}px` : where === 'over' ? getComputedStyle(target).fontSize : '';
        const right = box.right ?? box.left, bottom = box.bottom ?? box.top, width = right - box.left, height = bottom - box.top;
        element.style.width = where === 'over' ? `${width}px` : '';
        element.style.textAlign = where === 'over' ? 'center' : where === 'left' ? 'right' : '';
        const note = element.getBoundingClientRect();
        const left = { right: right + GAP, left: box.left - GAP - note.width, over: box.left }[where] ?? box.left;
        const top = { above: box.top - GAP - note.height, below: bottom + GAP, over: box.top + (height - note.height) / 2 }[where] ?? box.top;
        element.style.left = `${left + x + dx}px`;
        element.style.top = `${top + y + dy}px`;
        const placed = element.getBoundingClientRect();
        element.hidden = placed.left < EDGE || placed.right > windowWidth - EDGE;
        if (where === 'over') {
          target.classList.toggle('pf-workings-covered', !element.hidden);
          if (!element.hidden) covered.add(target);
        }
      }
    }

    function placeSoon() {
      if (!layer || placing) return;
      placing = requestAnimationFrame(() => { placing = 0; place(); });
    }

    function onKey(event) {
      if (event.key === 'Escape' && shown) show(false);
    }

    function detach() {
      show(false);
      if (button) {
        button.removeEventListener('click', toggle);
        button.removeAttribute('aria-pressed');
      }
      document.removeEventListener('keydown', onKey);
      removeEventListener('resize', placeSoon);
    }
  }

  // The rules for the construction and the notes, added to the page once.
  function addStyle() {
    if (document.getElementById('pf-workings-style')) return;
    const style = document.createElement('style');
    style.id = 'pf-workings-style';
    style.textContent = STYLE;
    document.head.appendChild(style);
  }

  const api = { INK, FADE, construction, attach };
  PF.workings = api;
})(typeof self !== 'undefined' ? self : this);
