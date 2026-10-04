/*!
 * say hi, bars 5-12 (theme A, page A): phy is built round the eyes, a part a beat, in the order the
 * library paints them; on the hit of bar 7 the colored pencil goes over the whole figure, rubbing out
 * the construction and the eyes' tape; phy breathes and blinks, hops and writes "hello, world", then
 * "call me phy." on the next rule, and looks at you as the page turns.
 *
 * The build. Each part is the library's own drawing of it: a flat render (pencil: false) that shows
 * that part's groups (data-pf) alone. It comes in as a draftsman's part would: a graphite
 * construction from the spec's numbers (a center, two radii, or a root, an angle and a length), with
 * the line of characters/phy/phy.js that holds them penciled beside it; then its outline, whose tufts
 * grow as their lengths (fluff len) run from 0 to the spec's; then a flat fill that floods out from the
 * center. The parts come in the order of the render's own groups. The eyes and the blush, on the page
 * since bars 1-4, stay in pencil throughout.
 *
 * The color. On 7.1 the pencil's texture goes over the figure in one pass, behind a front that lies
 * at the library's own stroke angle (PENCIL.angle, -40 degrees, as a right hand shades), and the
 * construction and the tape are rubbed out as the front passes.
 *
 * Alive. Until 8.1 phy is still, as a drawing is. Over the last half of bar 7 the scene's idle
 * (breath, sway) eases in, and on 8.1 the scene's own phy takes over, pose for pose, with a breath, a
 * blink and a small w of a mouth.
 */
SayHi.section('build', k => {
  'use strict';
  const PF = PhyFriends, A = PF.anim, B = k.beats, at = k.at;
  const page = k.page('A'), { phy } = SayHi.layout.A;
  const BOX = PF.scene.BOX, RULE = k.RULE;
  const drawn = k.friend('phy');
  const INK = '#3d3c39', INK_2 = '#6d6a63';     // Graphite, as site/notebook.css's --ink and --ink-2.

  // The film's phy at the start of the build, in the era it is built in (a plain oval for a body, on the
  // standing template before Terry's owner tuned it), and what is worked out from it under that era.
  const intro = k.exportsOf('intro');
  const spec = drawn.spec(at('5.1'));
  const inEra = fn => (intro.template ? intro.template.under(at('5.1'), fn) : fn());
  const VIEW = inEra(() => PF.standingView(spec)); // As a scene draws a friend: its ground on the box's bottom edge.
  const ORIGIN = { x: phy.x - BOX / 2, y: phy.floor - BOX };   // The box's top left on the page.
  const HEAD = { x: phy.x, y: phy.floor - inEra(() => PF.groundOf(spec)) }; // The head's origin, between the eyes.

  // ------------------------------------------------------------ timing

  const STEP = B.BEAT;                            // A part a beat, from 5.1.
  // Within a part's beat, in seconds from its start: the construction's lines and its ellipse, the
  // label, the outline and its tufts, and the fill. The graphite settles to a lighter weight as the
  // next part begins.
  const PHASE = { lines: [0, 0.12], ellipse: [0.02, 0.24], label: [0.04, 0.24], sprout: [0.16, 0.4], fill: [0.28, 0.52], settle: [STEP, STEP + 0.25] };
  // The pencil's pass: its front crosses the figure in `figure` seconds, at a steady pace, reaching the
  // figure on the hit of 7.1; the frame's farther corners take a little longer.
  const PASS = { at: at('7.1'), figure: 0.36, soft: 6 };
  const ALIVE = { from: at('7.3'), to: at('8.1') }; // The scene's idle eases in; the scene's phy takes over at `to`.
  const HOP_TAKEOFF = 0.24;                       // Seconds into the hop clip at which phy leaves the ground.

  // ------------------------------------------------------------ cameras

  // The figure whole, with room on each side for the construction's labels; then phy on the left and
  // the rules to the right of the tail, where phy writes, drifting in a little while the words come.
  const BUILD_VIEW = { x: phy.x + 42, y: HEAD.y, zoom: 2.25 };
  const WRITE_VIEW = { x: phy.x + 232, y: HEAD.y, zoom: 2.1 };
  k.shot('A', '5.1', '13.1');
  k.camera('A', BUILD_VIEW, { at: '5.1', duration: B.BAR, ease: 'out' });
  k.camera('A', WRITE_VIEW, { at: '8.3', duration: 3 * B.BEAT, ease: 'inOut' });
  k.camera('A', { zoom: WRITE_VIEW.zoom * 1.08 }, { at: '9.2', duration: at('12.3') - at('9.2'), ease: 'inOut' });

  // ------------------------------------------------------------ the parts

  // The source's lines, comments stripped (demo/say-hi/source-data.js).
  const LINES = SayHi.source.phy.lines;
  // The first line at or after the one that matches `after` that holds every token, and the stretch of
  // it from the first token to the last, verbatim: the numbers a part is drawn from, where the file has them.
  function quote(after, tokens) {
    const start = LINES.findIndex(line => after.test(line.text));
    const line = start < 0 ? null : LINES.slice(start).find(l => tokens.every(token => l.text.includes(token)));
    if (!line) throw new Error(`say hi: no line of phy.js holds ${tokens.join(', ')}`);
    const from = Math.min(...tokens.map(token => line.text.indexOf(token)));
    const to = Math.max(...tokens.map(token => line.text.indexOf(token) + token.length));
    return { n: line.n, text: line.text.slice(from, to) };
  }
  const tokens = (o, ...keys) => keys.map(key => `${key}: ${o[key]}`);

  const SEAT = spec.stand.seat;
  const extraIndex = (on, test = () => true) => spec.extras.findIndex(x => x.on === on && test(x));
  // The fluffy outlines a part's tufts grow on: its own shape, and the extras on it that reach past it.
  const outlinesOf = (part, shape, seedName = part) => [
    ...(shape && shape.fluff ? [{ shape, seed: seedName }] : []),
    ...spec.extras.map((x, i) => ({ x, i })).filter(({ x }) => x.on === part && x.fluff && !x.clip)
      .map(({ x, i }) => ({ shape: x, seed: `${part}/extra${i}` })),
  ];
  const ruff = spec.extras[extraIndex('scarf', x => x.fluff)];
  const tail = { ...spec.tail, curl: spec.tail.bend ? 0 : spec.tail.curl };

  // The parts in the order the library paints them. Each names the groups it shows (show), the group
  // whose space its construction is drawn in (frame), its construction, the outlines whose tufts grow
  // (outlines), where its fill floods from and how far (flood), and its label: the line it comes from,
  // where it is penciled (x, y, align) and the point its leader runs to (to: [frame, x, y]).
  const PARTS = [
    {
      id: 'tail', main: 'tail', show: ['tail'], frame: 'tail',
      draw: { tail },
      outlines: [{ tail: true, seed: 'tail' }],
      flood: [['tail', 0, 0]], reach: tail.length * 1.15,
      label: { ...quote(/^\s*tail: \{/, tokens(spec.tail, 'angle', 'length')), x: phy.x + 196, y: phy.floor - 4 * RULE, align: 'start', to: ['tail', 0, -tail.length * 0.62] },
    },
    {
      id: 'body', main: 'body', show: ['legs', 'body', 'feet'], frame: 'body',
      draw: { ellipse: spec.body, also: [['footLseat', SEAT.foot], ['footRseat', SEAT.foot]] },
      outlines: outlinesOf('body', spec.body),
      flood: [['body', spec.body.cx, spec.body.cy]], reach: spec.body.rx * 1.45,
      label: { ...quote(/^\s*body: \{/, tokens(spec.body, 'rx', 'ry')), x: phy.x - 122, y: phy.floor - RULE, align: 'end', to: ['body', spec.body.cx - spec.body.rx, spec.body.cy] },
    },
    {
      id: 'ruff', main: 'scarf', show: ['scarf'], frame: 'scarf',
      draw: { ellipse: ruff },
      outlines: outlinesOf('scarf', null),
      flood: [['scarf', ruff.cx, ruff.cy]], reach: ruff.rx * 1.5,
      label: { ...quote(/feature: 'chest'/, tokens(ruff, 'rx', 'ry')), x: phy.x + 196, y: phy.floor, align: 'start', to: ['scarf', ruff.cx + ruff.rx * 0.8, ruff.cy + ruff.ry * 0.6] },
    },
    {
      id: 'ears', main: 'earL', show: ['earL', 'earR', 'earLfront', 'earRfront'], frame: 'earL',
      draw: { ears: spec.ears },
      outlines: [],
      flood: [['earL', 0, 0], ['earR', 0, 0]], reach: spec.ears.length * 1.15,
      label: { ...quote(/^\s*ears: \{/, tokens(spec.ears, 'width', 'length')), x: phy.x - 122, y: phy.floor - 4 * RULE, align: 'end', to: ['earL', 0, -spec.ears.length * 0.45] },
    },
    {
      id: 'head', main: 'base', show: ['base'], frame: 'base',
      draw: { ellipse: spec.head },
      outlines: outlinesOf('base', spec.head),
      flood: [['base', spec.head.cx, spec.head.cy]], reach: spec.head.rx * 1.45,
      label: { ...quote(/^\s*head: \{/, tokens(spec.head, 'rx', 'ry')), x: phy.x - 122, y: phy.floor - 3 * RULE, align: 'end', to: ['base', spec.head.cx - spec.head.rx, spec.head.cy] },
    },
    {
      id: 'face', main: 'face', show: ['face'], frame: 'face',
      draw: { ellipse: spec.face },
      outlines: outlinesOf('face', spec.face),
      flood: [['face', spec.face.cx, spec.face.cy]], reach: spec.face.rx * 1.2,
      label: { ...quote(/^\s*face: \{/, tokens(spec.face, 'rx', 'ry')), x: phy.x - 122, y: phy.floor - 2 * RULE, align: 'end', to: ['face', spec.face.cx - spec.face.rx, spec.face.cy] },
    },
    {
      id: 'hair', main: 'hair', show: ['hair'], frame: 'hair',
      draw: { ellipse: spec.hair },
      outlines: [{ star: spec.hair, seed: 'hair' }],
      flood: [['hair', spec.hair.cx, spec.hair.cy]], reach: spec.hair.rx * 2.4,
      label: { ...quote(/^\s*hair: \{/, tokens(spec.hair, 'rx', 'ry')), x: phy.x + spec.hair.cx, y: phy.floor - 5 * RULE - 8, align: 'middle', to: ['hair', spec.hair.cx, spec.hair.cy - spec.hair.ry] },
    },
    {
      id: 'forepaws', main: 'pawsUnder', show: ['armsBehind', 'armsBeside', 'tuck', 'pawsUnder', 'armsOver'], frame: 'pawLseat',
      draw: { also: [['pawLseat', SEAT.paw], ['pawRseat', SEAT.paw]] },
      outlines: [],
      flood: [['pawLseat', 0, 0], ['pawRseat', 0, 0]], reach: 58,
      label: { ...quote(/^\s*seat: \{/, tokens(SEAT.paw, 'rx', 'ry')), x: phy.x - 122, y: phy.floor, align: 'end', to: ['pawLseat', -SEAT.paw.rx, 0] },
    },
  ];

  // Sorts the parts into the order in which the library paints them: the order of their groups in a render.
  const painted = (() => {
    const order = [...drawn.svg(at('5.1')).matchAll(/data-pf="([^"]+)"/g)].map(m => m[1]);
    const index = part => {
      const i = order.indexOf(part.main);
      if (i < 0) throw new Error(`say hi: phy's render has no ${part.main}`);
      return i;
    };
    return PARTS.slice().sort((a, b) => index(a) - index(b)).map((part, i) => ({ ...part, start: at('5.1') + i * STEP }));
  })();

  // ------------------------------------------------------------ geometry

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const phase = (part, t, [a, b], ease = A.ease.out) => ease(clamp((t - part.start - a) / (b - a), 0, 1));
  const num = v => Math.round(v * 100) / 100;

  // The matrix from a group's own space to the page's world: the transforms of the group and of every
  // group above it in the drawing, then the drawing's place on the page.
  function toWorld(node, svg) {
    let m = new DOMMatrix();
    for (let n = node; n && n !== svg; n = n.parentNode) {
      const list = n.transform && n.transform.baseVal;
      if (list && list.numberOfItems) m = DOMMatrix.fromMatrix(list.consolidate().matrix).multiply(m);
    }
    return new DOMMatrix().translate(ORIGIN.x, ORIGIN.y).multiply(m);
  }

  // The frames of a still drawing of phy, by group: the body's is that of its shape, inside the body's
  // stretch (BODY.height), so that the body's own numbers draw it.
  const frames = new WeakMap();
  function framesOf(rig) {
    if (!frames.has(rig)) {
      const svg = rig.svg, of = {};
      for (const name of new Set(PARTS.flatMap(framesUsed))) {
        const node = name === 'body' ? rig.parts.body.querySelector('path') : rig.parts[name];
        if (!node) throw new Error(`say hi: phy's drawing has no ${name}`);
        of[name] = toWorld(node, svg);
      }
      frames.set(rig, of);
    }
    return frames.get(rig);
  }
  // Every group a part draws in: its frame, its floods' and its small ellipses', both ears', its leader's.
  function framesUsed(part) {
    return [part.frame, ...part.flood.map(f => f[0]), ...(part.draw.also || []).map(a => a[0]), ...(part.draw.ears ? ['earL', 'earR'] : []), part.label.to[0]];
  }
  const point = (m, x, y) => {
    const p = m.transformPoint(new DOMPoint(x, y));
    return { x: p.x, y: p.y };
  };
  const matrix = m => `matrix(${[m.a, m.b, m.c, m.d, m.e, m.f].map(v => Math.round(v * 1e4) / 1e4).join(' ')})`;

  // A fluffy shape with its tufts grown to `u` of their length (and notches to `u` of their depth).
  function sprouted(shape, u) {
    return { ...shape, fluff: shape.fluff.map(f => ({ ...f, len: (f.len ?? 8) * u, depth: (f.depth ?? 0.03) * u })) };
  }
  // The outline of a crest whose tips have risen `u` of the way from its ellipse to their points, and
  // whose valleys likewise.
  function risen(hair, u) {
    const S = PF.shapes, e = S.ellipse(hair);
    const toward = ([x, y]) => {
      const [ex, ey] = S.ellPoint(e, S.ellAngle(e, x, y));
      return [lerp(ex, x, u), lerp(ey, y, u)];
    };
    return {
      ...hair,
      tips: hair.tips.map(([x, y, b1, b2, v]) => [...toward([x, y]), b1, b2, Array.isArray(v) ? toward(v) : v]),
    };
  }
  const seedOf = name => PF.hash(`${spec.name}/${name}`);
  // An outline (as PARTS lists them) at u of its growth, as a path in its part's space.
  function outlineD(o, u) {
    const S = PF.shapes;
    if (o.tail) return S.pathD(S.tailNodes({ ...tail, fluff: sprouted(tail, u).fluff }, seedOf(o.seed)));
    if (o.star) return S.pathD(S.star(risen(o.star, u)));
    return S.pathD(S.fluffy(sprouted(o.shape, u), seedOf(o.seed)));
  }

  // ------------------------------------------------------------ the pencil's pass

  // The front lies along the pencil's strokes and moves across them, from the top left: a point is
  // colored once n . p is less than the front's place (in world units along n).
  const STROKE = (PF.pencil.settings.angle * Math.PI) / 180;
  const N = { x: -Math.sin(STROKE), y: Math.cos(STROKE) };
  const along = p => N.x * p.x + N.y * p.y;
  const GRADIENT = 180 + PF.pencil.settings.angle;     // The CSS angle of a gradient that runs along N.
  // The figure's reach on the page, and the frame's under the camera, along N.
  const FIGURE = [along({ x: phy.x - 100, y: phy.floor - 285 }), along({ x: phy.x + 160, y: phy.floor })];
  const SPEED = (FIGURE[1] - FIGURE[0]) / PASS.figure;
  const frameReach = (() => {
    const w = k.FRAME.width / 2 / BUILD_VIEW.zoom, h = k.FRAME.height / 2 / BUILD_VIEW.zoom;
    return [along({ x: BUILD_VIEW.x - w, y: BUILD_VIEW.y - h }), along({ x: BUILD_VIEW.x + w, y: BUILD_VIEW.y + h })];
  })();
  const PASS_FROM = PASS.at - (FIGURE[0] - frameReach[0]) / SPEED;
  const PASS_TO = PASS.at + (frameReach[1] - FIGURE[0]) / SPEED;
  const front = t => FIGURE[0] + (t - PASS.at) * SPEED;

  // A mask for a box whose top left is at `origin` on the page: the side of the front already colored
  // (colored) or the side still to come.
  function passMask(origin, t, colored) {
    const p = front(t) - along(origin), a = colored ? '#000' : 'transparent', b = colored ? 'transparent' : '#000';
    return `linear-gradient(${GRADIENT}deg, ${a} ${num(p - PASS.soft)}px, ${b} ${num(p + PASS.soft)}px)`;
  }
  // Sets an element's mask, only when it changes.
  function setMask(el, mask) {
    if (el.dataset.mask === (mask || '')) return;
    el.dataset.mask = mask || '';
    el.style.maskImage = mask || '';
    el.style.webkitMaskImage = mask || '';
  }

  // ------------------------------------------------------------ the still pose

  // phy as the eyes left the intro: looking at you, with a touch of blush; then, for the hand-over, the
  // scene's own phy at t.
  const STILL = { ...PF.POSE, ...(intro.eyesAt ? intro.eyesAt(at('5.1')) : {}) };
  const scenePose = t => page.sceneAt(t).cast.phy.rig.pose;
  const poseAt = t => (t < ALIVE.from ? STILL : A.mix(STILL, scenePose(t), A.ease.smooth(clamp((t - ALIVE.from) / (ALIVE.to - ALIVE.from), 0, 1))));

  // A box on the page: an element placed at box.x, box.y and sized box.w by box.h (head units).
  function placeAt(el, box) {
    Object.assign(el.style, { position: 'absolute', left: '0', top: '0', width: `${box.w}px`, height: `${box.h}px`, transform: `translate(${box.x}px, ${box.y}px)` });
  }
  // The pencil's masks reach only as far as the box they lie on, so the rigs sit in a stage that holds
  // the ears and the tail with room to spare; each rig is in a box of its own in it, as a scene's
  // cut-out is.
  const STAGE = { x: phy.x - 360, y: phy.floor - 540, w: 720, h: 640 };
  const IN_STAGE = { x: ORIGIN.x - STAGE.x, y: ORIGIN.y - STAGE.y, w: BOX, h: BOX };
  // Places the stage in el, with count boxes in it, one for each rig.
  function staged(el, count) {
    placeAt(el, STAGE);
    el.innerHTML = '<div></div>'.repeat(count);
    for (const div of el.children) placeAt(div, IN_STAGE);
    return [...el.children];
  }
  // phy's rig in el at t (k.friend), its drawing filling its box and free to reach past it, as a scene's is.
  function rigIn(el, t, opts) {
    const rig = drawn.rig(el, t, { view: VIEW, ...opts });
    const style = rig.svg.style;
    if (style.overflow !== 'visible') Object.assign(style, { display: 'block', width: '100%', height: '100%', overflow: 'visible' });
    return rig;
  }

  // ------------------------------------------------------------ drawing the parts

  // The flat parts, each in its own rig showing only its groups, stacked in paint order; each floods
  // in from its center, and all are hidden behind the pencil's front as it passes.
  k.draw(page.under, '5.1', PASS_TO, (el, t) => {
    if (!el.firstChild) staged(el.appendChild(document.createElement('div')), painted.length);
    const wrap = el.firstChild;
    setMask(wrap, t >= PASS_FROM ? passMask(STAGE, t, false) : '');
    painted.forEach((part, i) => {
      const div = wrap.children[i], u = phase(part, t, PHASE.fill);
      div.style.display = u > 0 ? '' : 'none';
      if (u <= 0) return;
      const rig = rigIn(div, t, { pencil: false });
      rig.setPose(STILL, true);
      k.showParts(rig.svg, { show: part.show });
      div.style.clipPath = u < 1 ? flood(part, framesNow(), u) : '';
    });
  });

  // A clip of circles round each of a part's flood centers, `u` of the way to its reach, in its box.
  function flood(part, of, u) {
    const r = Math.max(0.01, part.reach * u);
    return `path('${part.flood.map(([frame, x, y]) => {
      const c = point(of[frame], x, y), cx = c.x - ORIGIN.x, cy = c.y - ORIGIN.y;
      return `M${num(cx - r)} ${num(cy)}a${num(r)} ${num(r)} 0 1 0 ${num(2 * r)} 0a${num(r)} ${num(r)} 0 1 0 ${num(-2 * r)} 0Z`;
    }).join('')}')`;
  }

  // phy in pencil: the eyes and the blush from the start, then, from the pencil's pass, the whole figure
  // on its colored side; it eases into the scene's pose over the last half of bar 7.
  k.draw(page.under, '5.1', ALIVE.to, (el, t) => {
    if (!el.firstChild) {
      for (let i = 0; i < 2; i++) staged(el.appendChild(document.createElement('div')), 1);
    }
    const [whole, eyes] = el.children, pose = poseAt(t), passing = t >= PASS_FROM;
    whole.style.display = passing ? '' : 'none';
    if (passing) {
      rigIn(whole.firstChild, t, {}).setPose(pose, true);
      setMask(whole, t < PASS_TO ? passMask(STAGE, t, true) : '');
    }
    eyes.style.display = t < PASS_TO ? '' : 'none';
    if (t < PASS_TO) {
      const rig = rigIn(eyes.firstChild, t, {});
      rig.setPose(pose, true);
      k.showParts(rig.svg, { show: ['eyes', 'blush'] });
      setMask(eyes, passing ? passMask(STAGE, t, false) : '');
    }
  });

  // The scene's phy stays hidden while the build draws phy itself.
  k.parts('A', 'phy', '5.1', ALIVE.to, () => ({ show: [] }));

  // ------------------------------------------------------------ the construction

  // A still drawing of phy, never shown, in whose groups' spaces the construction is drawn and from
  // whose centers the fills flood: the flat parts' own frames, since they are posed alike.
  let geometry = null;
  function framesNow() {
    if (!geometry) {
      const holder = document.createElement('div');
      const rig = PF.mount(holder, spec, { bg: false, view: VIEW, pencil: false, bitmap: false });
      rig.setPose(STILL, true);
      geometry = framesOf(rig);
    }
    return geometry;
  }

  // The graphite over the parts: for each part from its beat, the construction, the outline and the
  // label, each drawn on, then settled lighter; all rubbed out behind the pencil's front.
  const SHEET = { x: phy.x - 560, y: phy.floor - 420, w: 1120, h: 520 };   // The construction's sheet on the page.
  const PEN = { construction: 1.15, outline: 1.6, leader: 0.9, cross: 5, arc: 26 };
  const LABEL = { size: 12.5, advance: 0.6 };      // The code's face sets every character 0.6em wide.

  k.draw(page.over, '5.1', PASS_TO, (el, t) => {
    if (!el.firstChild) {
      el.innerHTML = `<div><svg class="graphite" viewBox="${SHEET.x} ${SHEET.y} ${SHEET.w} ${SHEET.h}" ` +
        `width="${SHEET.w}" height="${SHEET.h}" style="display:block;overflow:visible"></svg></div>`;
      placeAt(el.firstChild, SHEET);
    }
    const wrap = el.firstChild, of = framesNow();
    setMask(wrap, t >= PASS_FROM ? passMask(SHEET, t, false) : '');
    wrap.firstChild.innerHTML = painted.filter(part => t >= part.start).map(part => graphite(part, of, t)).join('');
  });

  // Pencil marks, as SVG: a stroke of width w, drawn on to u of its length.
  const line = (d, w, u = 1, opacity = 1) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" ` +
    `stroke-linejoin="round"${u < 1 ? ` pathLength="1" stroke-dasharray="${num(u)} 1.01"` : ''}${opacity < 1 ? ` opacity="${num(opacity)}"` : ''}/>`;
  const within = (m, inner, opacity) => `<g transform="${matrix(m)}" opacity="${num(opacity)}">${inner}</g>`;
  const ellipsePath = e => PF.shapes.ellipseD({ cx: e.cx || 0, cy: e.cy || 0, rx: e.rx, ry: e.ry ?? e.rx, rot: e.rot || 0 });
  const crossPath = (x, y) => `M${num(x - PEN.cross)} ${num(y)}h${2 * PEN.cross}M${num(x)} ${num(y - PEN.cross)}v${2 * PEN.cross}`;

  // One part's graphite at t: its construction, its outline as its tufts grow, and its label.
  function graphite(part, of, t) {
    const settle = 1 - 0.62 * phase(part, t, PHASE.settle, A.ease.smooth);
    const u = {
      lines: phase(part, t, PHASE.lines), ellipse: phase(part, t, PHASE.ellipse, A.ease.inOut),
      grow: phase(part, t, PHASE.sprout, A.ease.inOut), label: phase(part, t, PHASE.label, A.ease.linear),
    };
    const { draw } = part, out = [];
    // An ellipse from its center and two radii.
    if (draw.ellipse) {
      const e = draw.ellipse, cx = e.cx || 0, cy = e.cy || 0;
      out.push(within(of[part.frame], line(crossPath(cx, cy), PEN.construction, u.lines) +
        line(`M${cx} ${cy}h${e.rx}M${cx} ${cy}v${-(e.ry ?? e.rx)}`, PEN.construction * 0.8, u.lines) +
        line(ellipsePath(e), PEN.construction, u.ellipse), 0.6 * settle));
    }
    // Small ellipses on frames of their own (a seated foot or paw), each its own outline.
    for (const [frame, e] of draw.also || []) {
      out.push(within(of[frame], line(crossPath(0, 0), PEN.construction, u.lines) +
        line(ellipsePath({ rx: e.rx, ry: e.ry }), draw.ellipse ? PEN.construction : PEN.outline, u.ellipse), 0.7 * settle));
    }
    // A part on a root: the tail, with its spine as the bend curls it; the ears, each with its base and outline.
    if (draw.tail) out.push(rooted(of[part.frame], draw.tail.length, u, settle, draw.tail));
    if (draw.ears) {
      const ear = draw.ears, w = ear.width / 2;
      for (const frame of ['earL', 'earR']) {
        out.push(rooted(of[frame], ear.length, u, settle, null));
        out.push(within(of[frame], line(`M${-w} 0H${w}`, PEN.construction, u.lines, 0.75) +
          line(PF.shapes.pathD(PF.shapes.earNodes(ear)), PEN.outline, u.grow), 0.85 * settle));
      }
    }
    // The outline, its tufts growing from the construction's ellipse to the spec's lengths.
    if (part.outlines.length && u.grow > 0) {
      out.push(within(of[part.frame], part.outlines.map(o => line(outlineD(o, u.grow), PEN.outline)).join(''), 0.85 * Math.min(1, u.grow * 4) * settle));
    }
    out.push(labelOf(part, of, u.label, settle));
    return out.join('');
  }

  // A part on a root (an ear, the tail): the root, the axis it lies along, the vertical and an arc from
  // it to the axis (its angle), and for the tail the spine as its bend curls it.
  function rooted(m, length, u, settle, bent) {
    const root = point(m, 0, 0), tip = point(m, 0, -length), r = PEN.arc;
    const a0 = -Math.PI / 2, a1 = Math.atan2(tip.y - root.y, tip.x - root.x);
    const arc = `M${num(root.x)} ${num(root.y - r)}A${r} ${r} 0 0 ${a1 > a0 ? 1 : 0} ${num(root.x + r * Math.cos(a1))} ${num(root.y + r * Math.sin(a1))}`;
    let inner = line(crossPath(0, 0), PEN.construction, u.lines) + line(`M0 0V${-length}`, PEN.construction, u.lines);
    if (bent) {
      const curve = PF.shapes.tailBend(bent), points = [];
      for (let i = 0; i <= 24; i++) points.push(curve(0, (-i / 24) * length));
      inner += line(`M${points.map(([x, y]) => `${num(x)} ${num(y)}`).join('L')}`, PEN.construction, u.ellipse);
    }
    return `<g opacity="${num(0.55 * settle)}">${line(`M${num(root.x)} ${num(root.y)}v${-1.5 * r}`, PEN.construction * 0.8, u.lines)}` +
      `${line(arc, PEN.construction * 0.8, u.ellipse)}</g>` + within(m, inner, 0.6 * settle);
  }

  // A label in the code's face: the line's number, then its numbers, verbatim, written out from the
  // left; and a leader from the label to the part.
  function labelOf(part, of, u, settle) {
    if (u <= 0) return '';
    const { n, text, x, y, align, to } = part.label;
    const goal = point(of[to[0]], to[1], to[2]);
    const width = (String(n).length + 2 + text.length) * LABEL.size * LABEL.advance;
    const left = align === 'end' ? x - width : align === 'middle' ? x - width / 2 : x;
    const from = align === 'end' ? { x: x + 6, y: y - LABEL.size * 0.35 } : align === 'middle' ? { x, y: y + 5 } : { x: x - 6, y: y - LABEL.size * 0.35 };
    const leader = line(`M${num(from.x)} ${num(from.y)}L${num(goal.x)} ${num(goal.y)}`, PEN.leader, clamp(u * 1.4 - 0.4, 0, 1), 0.5 * settle);
    const shown = `inset(-40% ${num(100 - 100 * Math.min(1, u * 1.25))}% -40% 0)`;
    return leader + `<text x="${num(left)}" y="${num(y)}" font-size="${LABEL.size}" opacity="${num(0.95 * settle + 0.05)}" ` +
      `style="font-family:var(--mono);clip-path:${shown}"><tspan fill="${INK_2}">${n}</tspan>` +
      `<tspan fill="${INK}" dx="${LABEL.size * 2 * LABEL.advance}">${escape(text)}</tspan></text>`;
  }
  const escape = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  // What the intro leaves on the page: its line fades as the build begins, and the tape is rubbed out as
  // the pencil's front reaches it (it lies under the face, where the pencil would let it show).
  const TAPE = [along({ x: HEAD.x - 45, y: phy.floor - 2 * RULE }), along({ x: HEAD.x + 270, y: phy.floor - 2 * RULE })];
  k.exports.intro = {
    line: t => 1 - A.ease.smooth(clamp((t - at('5.1')) / B.BEAT, 0, 1)),
    tape: t => 1 - clamp((front(t) - TAPE[0]) / (0.3 * (TAPE[1] - TAPE[0])), 0, 1),
  };

  // ------------------------------------------------------------ alive

  // On 8.1 a breath: a stretch up, the ears pricking and the tail lifting, with a blink on its way out,
  // and a small w of a mouth until the page turns.
  const BREATH = A.track({
    squash: [[0, 0], [0.42, 0.035, 'out'], [1.1, 0]],
    headY: [[0, 0], [0.42, -1.6, 'out'], [1.1, 0]],
    earL: [[0, 0], [0.3, -7, 'out'], [0.6, -5], [1.2, 0]],
    earR: [[0, 0], [0.34, -7, 'out'], [0.64, -5], [1.2, 0]],
    tail: [[0, 0], [0.5, 6, 'out'], [1.3, 0]],
  }, { duration: 1.3 });

  // ------------------------------------------------------------ hello, world

  // phy's two lines, at the size of phy's lines (the rule of speech, under the camera as each is done).
  const TEXT = { x: phy.x + 218, rows: [phy.floor - 3 * RULE, phy.floor - 2 * RULE] };
  const HELLO = { text: 'hello, world', at: at('9.1.5') };
  const NAME = { text: 'call me phy.', at: at('11.1') };
  const hello = k.ui.hand(page.over, HELLO.text, { x: TEXT.x, y: TEXT.rows[0], at: HELLO.at, until: '13.1' });
  const name = k.ui.hand(page.over, NAME.text, { x: TEXT.x, y: TEXT.rows[1], at: NAME.at, until: '13.1' });
  // Where the hand is as it writes a line, near enough for phy's eyes to follow it.
  const pen = (written, text, row) => ({
    at: t => ({ x: TEXT.x + text.length * written.size * 0.48 * clamp((t - written.at) / (written.end - written.at), 0, 1), y: row - written.size * 0.35 }),
  });

  k.cue('A', (scene, cast) => {
    const me = cast.phy;
    me.play(BREATH, { at: ALIVE.to, fade: 0 });
    me.play('blink', { at: ALIVE.to + 0.22 });
    me.pose({ mouth: 'w' }, { at: ALIVE.to, until: at('13.1') });
    // phy hops, leaving the ground on 9.1, and watches the words as they are written; looks back at
    // you; watches their name written; and looks at you as the page turns.
    me.play('hop', { at: at('9.1') - HOP_TAKEOFF });
    me.look(pen(hello, HELLO.text, TEXT.rows[0]), { at: HELLO.at });
    me.look('viewer', { at: at('10.1') });
    me.look(pen(name, NAME.text, TEXT.rows[1]), { at: NAME.at });
    me.look('viewer', { at: at('12.2.5') });
    me.play(A.track({ tilt: [[0, 0], [0.3, -5, 'back'], [1.4, -5], [1.8, 0]] }, { duration: 1.8 }), { at: at('12.2.5') });
  });

});
