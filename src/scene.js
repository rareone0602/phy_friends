/*!
 * phy_friends/scene: several friends on one sheet of paper, for films and games.
 *
 * A scene is a sheet of ruled paper, measured in head units, that fills a stage element. Friends
 * (actors), props and handwriting are placed on it. Everything that changes is a cue at a time on
 * the scene's clock, and a frame is a function of the cues and the time alone. A scripted film can
 * therefore be sought to any frame and filmed exactly (tools/pf.py film), while a game adds cues at
 * the current time as it runs.
 *
 * Each friend is drawn on a cut-out of paper: its pencil texture stays put while it breathes, turns
 * or hops in place, and travels with it when it moves about the sheet. Friends get around by hopping,
 * since they sit, and they turn with turnX, never with a mirror image, which would swap two-colored
 * eyes and reverse markings.
 *
 * The cast rules (src/cast.js) are checked where friends meet: a friend without a voice may only use
 * marks, words aimed at another friend need the two to know each other, and friends never stand
 * closer than their relation allows (checked on every frame; see check()). A scene that shows a
 * friend whose owner has not agreed to its medium is stamped as a draft.
 *
 * Example:
 *
 *   const scene = PhyFriends.scene.create(el, { width: 1600, height: 900 });
 *   const phy = scene.add('phy', { x: 800 });
 *   phy.enter({ from: 'left', at: 0.5 }).emote('♪', { at: 2.5 });
 *   if (!scene.film({ duration: 4 })) scene.play();  // Filmable by tools/pf.py film; plays live otherwise.
 *
 * Loads as a classic script after phyfriends.js, anim.js, cast.js and characters/cast.js
 * (PhyFriends.scene).
 */
(function (root) {
  'use strict';
  const PF = root.PhyFriends, A = PF && PF.anim;
  if (!A || !PF.cast) throw new Error('phy_friends/scene: load src/phyfriends.js, src/anim.js and src/cast.js first');

  const RULE = 54;            // The paper's rule spacing in head units: a friend stands five rules tall, as in the gallery.
  const BOX = 270;            // A friend's cut-out is this many head units square, with its ground on the bottom edge (FWIENDS.md).
  const DEFAULT_GROUND = 120; // The ground line for a spec without rig.ground, in head units.
  const OFFSTAGE = 200;       // How far past the frame's edge a friend waits before it enters, in head units.
  const PHASE_STEP = 1.7;     // Offsets each friend's idle cycles so that they do not move in step.
  const IDLE_SECONDS = 8;
  const HOP = A.HOP;
  const GAZE = { seconds: 0.3, depth: 180, turn: 0.5 };      // As in the gallery: the head turns half as far as the eyes.
  const TRAVEL = { look: 0.5, turn: 0.6, weight: 0.7 };      // A traveling friend looks where it is going.
  const MARK = { size: 64, pop: 0.18, fade: 0.25, seconds: 1.4, x: 70, y: -200 };
  const WORDS = { size: 34, perSecond: 14, fade: 0.25, x: 115, y: -130 };
  const FADE = 0.15;          // Default fade in and out of a clip layer, in seconds.
  const BOIL_VARIANTS = PF.pencil.settings.variants;  // Texture variants a boiling scene cycles through.
  const IN_FRAME = -1;        // frameRequest while a live frame is being drawn.
  const PRUNE_AFTER = 2;      // A live scene forgets cues that ended this many seconds ago.
  const FILM_WIDTH = 1280;    // The default frame width, in CSS px, of a filmed scene.
  const OUTLINE_PARTS = ['base', 'face', 'hair', 'body', 'tail'];  // What counts as a friend's outline: all but the ears.
  const VOICED_MARKS = PF.cast.MARKS;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const smooth = A.ease.smooth;

  // --------------------------------------------------------------- Scene

  // Options: width and height (the frame, in head units), ground (the y of the floor rule), paper
  // (false leaves the ruled paper out, so the page's own shows through), margin (the x of a red
  // margin line, or false), boil (texture redraws per second; 0 keeps it still),
  // medium ('video' or 'games', for the draft stamp), credits (true shows the owners of the friends
  // in frame), loop (a live scene with a duration starts again at the end), strict (throw rather
  // than warn when friends stand too close; always on while filming).
  function create(el, opts = {}) {
    const o = { width: 1600, height: 900, ground: null, paper: true, margin: false, boil: 0, medium: 'video', credits: true, loop: false, strict: false, ...opts };
    const ground = o.ground ?? Math.floor((o.height - RULE * 1.5) / RULE) * RULE;
    const reducedQuery = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
    const dom = buildStage(el, o);
    const actors = [], props = [], writings = [], cameraCues = [], steps = [], endHandlers = [];
    let cameraBase = { x: o.width / 2, y: o.height / 2, zoom: 1 };
    const warned = new Set();
    let time = 0, duration = null, playing = false, filming = false, destroyed = false, frameRequest = 0, lastFrame = 0;
    let inView = true, pointer = null, layout = { fit: 1, width: 0, height: 0 }, boilVariant = 0, creditsText = null;

    const scene = {
      el, RULE, BOX, ground,
      get width() { return o.width; },
      get height() { return o.height; },
      get time() { return time; },
      get duration() { return duration; },
      set duration(d) { duration = d; },
      get playing() { return playing; },
      get filming() { return filming; },
      get reduced() { return !filming && !!(reducedQuery && reducedQuery.matches); },
      get actors() { return actors.slice(); },
      get pointer() { return pointer; },
      add, prop, write, camera, team, rivals, seek, play, pause, onStep, onEnd, film, check, toWorld, cameraAt, destroy,
    };

    // ---- Building

    // Adds a friend standing at x on the floor (or at y), visible from `at` (default: always).
    function add(name, a = {}) {
      PF.cast.friend(name);
      if (actors.some(actor => actor.name === name)) throw new Error(`phy_friends/scene: ${name} is already in the scene`);
      for (const other of actors) PF.cast.ensure('share', name, other.name);
      const actor = createActor(scene, dom, name, {
        x: a.x ?? o.width / 2, y: a.y ?? ground, z: a.z ?? 0, at: a.at ?? -Infinity,
        phase: a.phase ?? actors.length * PHASE_STEP, energy: a.energy ?? 1, look: a.look ?? 'around',
      });
      actors.push(actor);
      updateDraftStamp();
      boilVariant = -1;  // Its textures are drawn in variant 0; the next frame sets the variant for the time.
      try {
        redraw();
      } catch (error) {  // A refused friend (standing too close, say) leaves the scene as it was.
        actors.pop();
        actor.node.remove();
        updateDraftStamp();
        throw error;
      }
      return actor;
    }

    // Places a drawing ({ w, h, svg }, in its own viewBox) with its bottom center at (x, y).
    function prop(drawing, p = {}) {
      const item = createProp(dom, drawing, { x: o.width / 2, y: ground, rotate: 0, z: 0, at: -Infinity, until: Infinity, ...p });
      item.remove = () => {
        const i = props.indexOf(item);
        if (i < 0) return;
        props.splice(i, 1);
        item.node.remove();
      };
      props.push(item);
      boilVariant = -1;
      redraw();
      return item;
    }

    // Writes text in the hand, its baseline starting at (x, y); it writes itself out over `seconds`,
    // from left to right, or stroke by stroke with pen: strokes made for the text (src/pen.js), such as
    // TITLE_PEN (site/title-pen.js). graphite: true puts the graphite filter over it, which STYLE.md §6
    // keeps for a title.
    function write(text, w = {}) {
      if (w.pen && !PF.pen) throw new Error('phy_friends/scene: write() with a pen needs src/pen.js');
      const item = createWriting(dom, text, { x: RULE, y: ground, size: 40, at: -Infinity, seconds: 0, until: Infinity, rotate: -1, tone: 'ink', align: 'left', graphite: false, pen: null, ...w });
      writings.push(item);
      redraw();
      return item;
    }

    // Moves the camera to { x, y, zoom } (the world point at the frame's center) from `at` over `duration`.
    function camera(to, { at = time, duration: d = 0, ease = 'inOut' } = {}) {
      cameraCues.push({ to, at, duration: d, ease: A.ease[ease] || ease });
      cameraCues.sort((a, b) => a.at - b.at);
      redraw();
      return scene;
    }

    // For games: checks that the named friends may play on one side, or against each other.
    function team(...names) {
      names.forEach((a, i) => names.slice(i + 1).forEach(b => PF.cast.ensure('team', a, b)));
      return scene;
    }
    function rivals(a, b) {
      PF.cast.ensure('rival', a, b);
      return scene;
    }

    // ---- Drawing

    function seek(t) {
      time = t;
      draw();
      return scene;
    }

    function redraw() {
      if (layout.width) draw();
    }

    function draw() {
      const t = time, cam = cameraAt(t);
      // A rule stays at least one device pixel thick however small the stage is drawn, or whole bands drop out.
      const ruleWidth = `${Math.max(1.4, 1 / (layout.fit * cam.zoom * (devicePixelRatio || 1)))}px`;
      if (ruleWidth !== dom.ruleWidth) dom.world.style.setProperty('--pf-rule-width', dom.ruleWidth = ruleWidth);
      dom.world.style.transform = `translate(${layout.width / 2}px, ${layout.height / 2}px) scale(${layout.fit * cam.zoom}) translate(${-cam.x}px, ${-cam.y}px)`;
      updateBoil(t);
      for (const actor of actors) actor.draw(t);
      for (const item of props) item.draw(t);
      for (const item of writings) item.draw(t);
      checkSpacing(t);
      updateCredits(t, cam);
    }

    function cameraAt(t) {
      let state = cameraBase;
      for (const cue of cameraCues) {
        if (t < cue.at) break;
        const u = cue.duration > 0 ? clamp((t - cue.at) / cue.duration, 0, 1) : 1, k = cue.ease(u);
        state = {
          x: lerp(state.x, cue.to.x ?? state.x, k), y: lerp(state.y, cue.to.y ?? state.y, k),
          zoom: lerp(state.zoom, cue.to.zoom ?? state.zoom, k),
        };
      }
      return state;
    }

    // Redraws every pencil texture with another seed a few times a second, as hand-drawn animation
    // does; the variant is a function of time, so a filmed scene boils identically every time.
    function updateBoil(t) {
      const variant = o.boil > 0 ? Math.floor(t * o.boil) % BOIL_VARIANTS : 0;
      if (variant === boilVariant) return;
      boilVariant = variant;
      for (const image of el.querySelectorAll('image[data-pf-texture]')) {
        const [x, y, w, h] = ['x', 'y', 'width', 'height'].map(key => +image.getAttribute(key));
        image.setAttribute('href', PF.pencil.texture(x, y, w, h, variant));
      }
    }

    // ---- The cast rules on the page

    // Friends whose drawings could overlap (floors less than a cut-out apart) keep at least their
    // relation's gap between their outlines; one standing a rule behind another counts.
    function checkSpacing(t) {
      const standing = actors.filter(actor => actor.visibleAt(t) && actor.extent());
      for (let i = 0; i < standing.length; i++) {
        for (let j = i + 1; j < standing.length; j++) {
          const problem = spacingProblem(standing[i], standing[j], t);
          if (problem) report(problem);
        }
      }
    }

    function spacingProblem(a, b, t) {
      const sa = a.state(t), sb = b.state(t);
      if (Math.abs(sa.y - sb.y) >= BOX) return null;
      const [left, right, sl, sr] = sa.x <= sb.x ? [a, b, sa, sb] : [b, a, sb, sa];
      const gap = (sr.x - right.extent().left) - (sl.x + left.extent().right), need = PF.cast.gap(a.name, b.name);
      if (gap >= need - 0.5) return null;
      const relation = PF.cast.relation(a.name, b.name);
      return {
        key: [a.name, b.name].sort().join('+'), t,
        message: `phy_friends/scene: at ${t.toFixed(2)} s, ${a.displayName} and ${b.displayName} stand ${Math.round(gap)} head units apart, ` +
          `but ${relation === 'strangers' ? 'strangers keep' : 'friends who have not opted in to touch keep'} at least ${need}. ` +
          'Move them apart, or see characters/cast.js.',
      };
    }

    function report(problem) {
      if (filming || o.strict) throw new Error(problem.message);
      if (warned.has(problem.key)) return;
      warned.add(problem.key);
      console.warn(problem.message);
    }

    // Seeks through the whole timeline (or [from, to]) and throws at the first broken rule.
    function check({ from = 0, to = duration ?? 0, step = 1 / 30 } = {}) {
      if (!layout.width || actors.some(actor => !actor.extent())) {
        throw new Error('phy_friends/scene: check() measures outlines, so the stage must be laid out (in the page, with a width) first');
      }
      const saved = time, strict = o.strict;
      o.strict = true;
      try {
        for (let t = from; t <= to + 1e-9; t += step) seek(t);
      } finally {
        o.strict = strict;
        seek(saved);
      }
      return scene;
    }

    // ---- Credits and the draft stamp

    function updateCredits(t, cam) {
      if (!o.credits) return;
      const halfWidth = o.width / 2 / cam.zoom;
      const inFrame = actors.filter(actor => {
        if (!actor.visibleAt(t)) return false;
        const x = actor.state(t).x, reach = actor.extent() || { left: BOX / 2, right: BOX / 2 };
        return x + reach.right > cam.x - halfWidth && x - reach.left < cam.x + halfWidth;
      });
      inFrame.sort((a, b) => a.firstSeen() - b.firstSeen() || actors.indexOf(a) - actors.indexOf(b));
      const credits = inFrame.map(actor => `${actor.displayName}\u00a0${PF.cast.friend(actor.name).credit.handle}`);
      const text = credits.join('\n');
      if (text === creditsText) return;
      creditsText = text;
      dom.credits.replaceChildren(...credits.map(credit => Object.assign(document.createElement('span'), { textContent: credit })));
    }

    function updateDraftStamp() {
      dom.draft.hidden = unagreed(o.medium).length === 0;
    }

    function unagreed(medium) {
      return actors.filter(actor => !PF.cast.agreed(actor.name, medium)).map(actor => actor.name);
    }

    // ---- Playing

    function play() {
      if (duration != null && time >= duration) time = 0;
      playing = true;
      resume();
      return scene;
    }

    function pause() {
      playing = false;
      return scene;
    }

    // A step runs before every live frame with (time, dt): the place for a game's rules.
    function onStep(fn) { steps.push(fn); resume(); return scene; }
    function onEnd(fn) { endHandlers.push(fn); return scene; }

    // frameRequest is 0 when no frame is due, IN_FRAME while one is being drawn (so that a play() or an
    // onStep() from a step does not start a second loop), and otherwise the pending request.
    function resume() {
      if (frameRequest || filming || !inView || document.hidden) return;
      lastFrame = performance.now();
      frameRequest = requestAnimationFrame(frame);
    }

    function stopFrames() {
      if (frameRequest !== IN_FRAME) cancelAnimationFrame(frameRequest);
      frameRequest = 0;
    }

    function frame(now) {
      frameRequest = IN_FRAME;
      try {
        drawFrame(now);
      } finally {
        if (frameRequest === IN_FRAME) frameRequest = 0;  // Unless stopFrames() ran meanwhile.
      }
      if (frameRequest === 0 && (playing || steps.length) && !filming && inView && !document.hidden && !destroyed) {
        frameRequest = requestAnimationFrame(frame);
      }
    }

    function drawFrame(now) {
      const dt = Math.min(0.1, Math.max(0, (now - lastFrame) / 1000));
      lastFrame = now;
      if (playing) {
        time += dt;
        if (duration != null && time >= duration) {
          if (o.loop) time %= duration;
          else { time = duration; playing = false; endHandlers.forEach(fn => fn(scene)); }
        }
      }
      for (const step of steps) step(time, playing ? dt : 0);
      pruneCues();
      draw();
    }

    // A live scene keeps only the cues that can still show; a film keeps them all, to seek back.
    function pruneCues() {
      if (duration != null) return;
      for (const actor of actors) actor.prune(time - PRUNE_AFTER);
      // A finished camera move becomes where the camera starts from.
      while (cameraCues.length && cameraCues[0].at + cameraCues[0].duration < time - PRUNE_AFTER) {
        const { to } = cameraCues.shift();
        cameraBase = { x: to.x ?? cameraBase.x, y: to.y ?? cameraBase.y, zoom: to.zoom ?? cameraBase.zoom };
      }
    }

    // Draws only while the stage is in view and the page is shown, which spares a phone's battery.
    function watchVisibility() {
      const observer = new IntersectionObserver(entries => {
        inView = entries.at(-1).isIntersecting;
        if (inView) resume(); else stopFrames();
      });
      observer.observe(el);
      const onVisibility = () => (document.hidden ? stopFrames() : resume());
      document.addEventListener('visibilitychange', onVisibility);
      return () => { observer.disconnect(); document.removeEventListener('visibilitychange', onVisibility); };
    }

    // ---- Filming

    // Makes the scene filmable by tools/pf.py film (the page is opened with ?film), and returns true
    // while it is being filmed. Otherwise returns false, and the page plays the scene itself.
    function film({ duration: d, fps = 30 } = {}) {
      if (!(d > 0)) throw new Error('phy_friends/scene: film() needs a duration in seconds');
      duration = d;
      const params = new URLSearchParams(location.search);
      filming = params.has('film');
      window.film = {
        width: FILM_WIDTH, height: Math.round(FILM_WIDTH * o.height / o.width), fps, duration: d,
        get unagreed() { return unagreed('video'); },
        ready: filming ? whenReady() : Promise.resolve(),
        seek: t => { seek(t); },
      };
      if (filming) {
        document.documentElement.classList.add('pf-filming');
        stopFrames();
        updateLayout();
        seek(0);
      }
      return filming;
    }

    // Resolves once the fonts and every pencil texture (all boil variants) have been decoded, so that
    // no frame is filmed before its texture has arrived.
    function whenReady() {
      const images = new Set();
      for (const image of el.querySelectorAll('image[data-pf-texture]')) {
        const [x, y, w, h] = ['x', 'y', 'width', 'height'].map(key => +image.getAttribute(key));
        for (let v = 0; v < (o.boil > 0 ? BOIL_VARIANTS : 1); v++) images.add(PF.pencil.texture(x, y, w, h, v));
      }
      const decoded = [...images].map(src => { const img = new Image(); img.src = src; return img.decode().catch(() => {}); });
      // Text that starts hidden does not load its face, so the face is loaded for every word the scene can show.
      const text = [...el.querySelectorAll('p')].map(node => node.textContent).join('') +
        actors.map(actor => `${actor.displayName} ${PF.cast.friend(actor.name).credit.handle}`).join('');
      const face = document.fonts.load(`300 1em ${getComputedStyle(dom.credits).fontFamily}`, text);
      return Promise.all([document.fonts.ready, face, ...decoded]).then(() => undefined);
    }

    // ---- Coordinates and layout

    // The world point under a client (CSS px) position.
    function toWorld(clientX, clientY) {
      const rect = el.getBoundingClientRect(), cam = cameraAt(time), scale = layout.fit * cam.zoom;
      return { x: (clientX - rect.left - layout.width / 2) / scale + cam.x, y: (clientY - rect.top - layout.height / 2) / scale + cam.y };
    }

    function updateLayout() {
      const width = el.clientWidth, height = el.clientHeight;
      layout = { width, height, fit: Math.min(width / o.width, height / o.height) || 1 };
      dom.frame.style.setProperty('--frame-unit', `${Math.max(10, height * 0.022)}px`);
      redraw();
    }

    function followPointer() {
      const move = event => { pointer = toWorld(event.clientX, event.clientY); };
      const leave = () => { pointer = null; };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerdown', move);
      el.addEventListener('pointerleave', leave);
      return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerdown', move); el.removeEventListener('pointerleave', leave); };
    }

    // Redraws when the page moves to a screen with another pixel ratio, for the rules' least width.
    function watchPixelRatio() {
      let query = null;
      const onChange = () => { redraw(); listen(); };
      const listen = () => {
        if (typeof matchMedia !== 'function') return;
        query = matchMedia(`(resolution: ${devicePixelRatio || 1}dppx)`);
        query.addEventListener('change', onChange, { once: true });
      };
      listen();
      return () => query && query.removeEventListener('change', onChange);
    }

    function destroy() {
      destroyed = true;
      stopFrames();
      resizeObserver.disconnect();
      stopWatching();
      stopFollowing();
      stopWatchingPixels();
      el.replaceChildren();
      el.classList.remove('pf-stage', 'pf-bare');
      if (dom.ownsAspectRatio) el.style.aspectRatio = '';
    }

    const resizeObserver = new ResizeObserver(updateLayout);
    resizeObserver.observe(el);
    const stopWatching = watchVisibility(), stopFollowing = followPointer(), stopWatchingPixels = watchPixelRatio();
    updateLayout();
    return scene;
  }

  // ------------------------------------------------------------ The stage

  function buildStage(el, o) {
    injectStyles();
    el.classList.add('pf-stage');
    const ownsAspectRatio = !el.style.aspectRatio;
    if (ownsAspectRatio) el.style.aspectRatio = `${o.width} / ${o.height}`;
    el.innerHTML =
      '<div class="pf-world"><div class="pf-paper"></div><div class="pf-layer"></div></div>' +
      '<div class="pf-frame"><p class="pf-credits"></p><p class="pf-draft hand" hidden>draft</p></div>';
    const world = el.querySelector('.pf-world'), paper = el.querySelector('.pf-paper');
    // The paper reaches a frame past every edge, so the camera can pan; its rules fall on multiples of RULE.
    const top = Math.floor(-o.height / RULE) * RULE;
    Object.assign(paper.style, { left: `${-o.width}px`, top: `${top}px`, width: `${o.width * 3}px`, height: `${o.height * 3 - top}px` });
    if (o.margin !== false) paper.insertAdjacentHTML('afterend', `<div class="pf-margin" style="left:${o.margin}px"></div>`);
    if (o.paper === false) {
      paper.remove();
      el.classList.add('pf-bare');
    }
    return {
      world, layer: el.querySelector('.pf-layer'),
      frame: el.querySelector('.pf-frame'), credits: el.querySelector('.pf-credits'), draft: el.querySelector('.pf-draft'),
      graphite: !!document.getElementById('graphite'), ownsAspectRatio, ruleWidth: null,
    };
  }

  // The scene's own layout. Colors and the face come from site/notebook.css when the page loads it.
  function injectStyles() {
    if (document.getElementById('pf-scene-styles')) return;
    const style = document.createElement('style');
    style.id = 'pf-scene-styles';
    style.textContent = `
.pf-stage { position: relative; overflow: clip; background: var(--paper, #fbf9f3); touch-action: manipulation; }
.pf-stage.pf-bare { background: none; }
.pf-world { position: absolute; left: 0; top: 0; transform-origin: 0 0; }
.pf-paper { position: absolute; pointer-events: none;
  background: repeating-linear-gradient(transparent 0 calc(${RULE}px - var(--pf-rule-width, 1.4px)),
    var(--rule, #cfdbe8) calc(${RULE}px - var(--pf-rule-width, 1.4px)) ${RULE}px); }
.pf-margin { position: absolute; top: -10000px; height: 20000px; width: 1.4px; background: var(--margin, #e6aaa3); pointer-events: none; }
.pf-layer { position: absolute; left: 0; top: 0; }
.pf-actor, .pf-prop, .pf-writing, .pf-mark, .pf-words { position: absolute; left: 0; top: 0; }
.pf-actor { width: ${BOX}px; height: ${BOX}px; }
.pf-actor svg, .pf-prop svg { display: block; width: 100%; height: 100%; overflow: visible; }
.pf-prop { transform-origin: 50% 100%; }
.pf-writing, .pf-mark, .pf-words { margin: 0; white-space: pre; font-family: var(--face, 'Shantell Sans', sans-serif); font-weight: 300; line-height: 1;
  color: var(--ink, #3d3c39); pointer-events: none; z-index: 50; }
.pf-writing.ink-2, .pf-mark, .pf-words { color: var(--ink-2, #6d6a63); }
.pf-mark { z-index: 60; font-size: ${MARK.size}px; }
.pf-words { z-index: 60; font-size: ${WORDS.size}px; }
.pf-frame { position: absolute; inset: 0; pointer-events: none; }
/* One owner to a span, each kept whole; where the line wraps, the dot that would end a line is clipped. */
.pf-credits { position: absolute; left: calc(var(--frame-unit) * 1.2); right: calc(var(--frame-unit) * 1.2 - 1.4em);
  bottom: calc(var(--frame-unit) * 0.6); margin: 0; display: flex; flex-wrap: wrap; justify-content: flex-end;
  clip-path: inset(-8px 1.4em -8px 0); font: 300 var(--frame-unit)/1.4 var(--face, sans-serif); color: var(--ink-2, #6d6a63); }
.pf-credits span { white-space: nowrap; }
.pf-credits span::after { content: '\\b7'; display: inline-block; width: 1.4em; text-align: center; }
.pf-draft { position: absolute; right: calc(var(--frame-unit) * 1.6); top: calc(var(--frame-unit) * 1.2); margin: 0; padding: .1em .6em;
  font: 300 calc(var(--frame-unit) * 1.3)/1.4 var(--face, sans-serif); color: var(--ink-2, #6d6a63); transform: rotate(-1deg); }
.pf-draft[hidden] { display: none; }
html.pf-filming, html.pf-filming body { overflow: hidden; }
html.pf-filming .pf-stage { position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100vh !important;
  max-width: none !important; margin: 0 !important; aspect-ratio: auto !important; z-index: 5; }
`;
    document.head.appendChild(style);
  }

  // --------------------------------------------------------------- Actors

  function createActor(scene, dom, name, a) {
    const spec = PF.get(name), rigGround = (spec.rig && spec.rig.ground) ?? DEFAULT_GROUND;
    const node = document.createElement('div');
    node.className = 'pf-actor';
    node.dataset.friend = name;
    node.style.zIndex = String(10 + a.z);
    dom.layer.appendChild(node);
    const view = { w: BOX, h: BOX, x: BOX / 2, y: BOX - rigGround, scale: 1, rotate: 0 };
    // The scene redraws the textures itself (boil), and a film must come out the same every time.
    const rig = PF.mount(node, spec, { bg: false, view, bitmap: false });
    const idle = A.make.idle({ seed: PF.hash(name) % 997, duration: IDLE_SECONDS, energy: a.energy });
    const home = { x: a.x, y: a.y };
    const moves = [], layers = [], gazes = [{ at: -Infinity, target: a.look }], marks = [], words = [];
    // Entrances and exits, in time order: the friend is shown after an entrance until the next exit.
    const showings = [{ at: a.at, shown: true, placed: true }];
    let extent = null;
    const displayName = PF.cast.friend(name).name;

    const actor = {
      name, displayName, rig, node, spec,
      get x() { return actor.state(scene.time).x; },

      // ---- Where the friend is

      visibleAt(t) {
        let shown = false;
        for (const s of showings) { if (s.at <= t) shown = s.shown; else break; }
        return shown;
      },
      firstSeen() {
        const first = showings.find(s => s.shown);
        return first ? first.at : Infinity;
      },

      // { x, y (its floor), lift (height above it), moving, dir, travel } at time t.
      state(t) {
        let x = moves.length ? moves[0].from : home.x;
        for (const m of moves) {
          if (t < m.at) break;
          if (t >= moveEnd(m)) { x = moveFinalX(m, glides(m)); continue; }
          return { ...hopAlong(m, (t - m.at) / m.duration, glides(m)), y: home.y, moving: true };
        }
        return { x, y: home.y, lift: 0, squash: 0, lean: 0, dir: 0, moving: false };
      },

      // How far the outline (OUTLINE_PARTS) reaches left and right of center, in head units, measured
      // once the stage has been laid out.
      extent() {
        if (extent) return extent;
        const hidden = node.style.display === 'none';
        if (hidden) node.style.display = '';  // A friend that has not entered yet is measured all the same.
        const svgRect = rig.svg.getBoundingClientRect();
        if (!svgRect.width) {
          if (hidden) node.style.display = 'none';
          return null;
        }
        const unit = svgRect.width / BOX, center = svgRect.left + svgRect.width / 2, pose = rig.pose;
        rig.setPose({}, true);  // Measured in the neutral pose, so that a hop or a turn does not count.
        let left = 0, right = 0;
        for (const part of OUTLINE_PARTS) {
          if (!rig.parts[part]) continue;
          const r = rig.parts[part].getBoundingClientRect();
          left = Math.max(left, (center - r.left) / unit);
          right = Math.max(right, (r.right - center) / unit);
        }
        rig.setPose(pose, true);
        if (hidden) node.style.display = 'none';
        extent = { left, right };
        return extent;
      },

      // ---- Cues

      // Hops in from off the frame to its place (or to `to`); hops and height are as for moveTo.
      enter({ from = 'left', to = home.x, at = scene.time, duration, hops, height } = {}) {
        const start = from === 'left' ? -OFFSTAGE : from === 'right' ? scene.width + OFFSTAGE : from;
        // A friend placed on the page by add() is hidden until its first entrance instead.
        const placed = showings.findIndex(s => s.placed);
        if (placed >= 0 && (showings[placed].at === -Infinity || at < showings[placed].at)) showings.splice(placed, 1);
        addShowing(at, true);
        return actor.moveTo(to, { at, duration, hops, height, from: start });
      },

      // Hops off the frame, and is gone once it is off.
      exit({ to = 'right', at = scene.time, duration } = {}) {
        const end = to === 'left' ? -OFFSTAGE : to === 'right' ? scene.width + OFFSTAGE : to;
        const m = addMove(end, { at, duration });
        addShowing(m.at + m.duration, false);
        return actor;
      },

      // Hops to x. A move that starts while another is under way cuts it short where it has reached, but
      // a move that starts mid-leap waits for the landing. glide: true or false overrides reduced motion.
      moveTo(x, options = {}) {
        addMove(x, options);
        return actor;
      },

      // Jumps in place, the whole cut-out leaving the floor (for games). A leap is the player's own
      // motion, so it leaves the floor under reduced motion too.
      leap({ at = scene.time, height = 90, duration = 0.6 } = {}) {
        const x = actor.state(at).x;
        addMove(x, { at, duration, hops: 1, height, from: x, glide: false, leap: true });
        return actor;
      },

      // Layers a clip (a name, an expression or a clip) from `at` until it ends, or until `until`.
      play(clip, { at = scene.time, until, fade = FADE, weight = 1 } = {}) {
        const c = A.parse(clip), end = until ?? (c.loop || c.duration == null ? Infinity : at + c.duration);
        layers.push({ clip: c, at, end, fade, weight });
        return actor;
      },

      // Holds a partial pose (a face, say { eyes: 'happy', mouth: 'w' }) from `at` until `until`.
      pose(partial, { at = scene.time, until = Infinity, fade = FADE } = {}) {
        layers.push({ clip: A.still(partial), at, end: until, fade, weight: 1 });
        return actor;
      },

      // Looks at a target from `at`: 'around' (idle glances), 'viewer', a world point { x, y },
      // another actor, or 'pointer' (a live scene's pointer).
      look(target, { at = scene.time } = {}) {
        if (target && target.name && target !== actor) PF.cast.ensure('watch', name, target.name);
        gazes.push({ at, target });
        gazes.sort((p, q) => p.at - q.at);
        return actor;
      },

      // Greets another friend from where it stands: a happy hop while looking at them.
      greet(other, { at = scene.time } = {}) {
        PF.cast.ensure('greet', name, other.name);
        actor.look(other, { at });
        const hop = A.make.happy({ duration: 1.1, bounces: 2, height: 10 });
        return actor.play(hop, { at, until: at + hop.duration });
      },

      // Shows a mark (one of PhyFriends.cast.MARKS) above the head.
      emote(mark, { at = scene.time, seconds = MARK.seconds } = {}) {
        if (!VOICED_MARKS.includes(mark)) throw new Error(`phy_friends/scene: "${mark}" is not a mark; use one of ${VOICED_MARKS.join(' ')}`);
        const node = textNode(dom, 'pf-mark hand', mark);
        node.setAttribute('aria-hidden', 'true');  // A mark is a drawing, not words; a game says what happened in words.
        marks.push({ text: mark, at, until: at + seconds, node });
        return actor;
      },

      // Says words beside the head, written out as they are said. Words need a voice (src/cast.js);
      // words to another friend need the two to know each other. side is 1 (right of the head), -1
      // (left) or 0 (centered above it, for a crowded row); rise lifts the words, in head units, and
      // size sets their size.
      say(text, { at = scene.time, seconds, to, side, rise = 0, size = WORDS.size } = {}) {
        PF.cast.ensureVoice(name, text);
        if (to) PF.cast.ensure('talk', name, to.name);
        const s = side ?? (to && to.state(at).x < actor.state(at).x ? -1 : 1);
        const node = textNode(dom, 'pf-words hand', text);
        node.style.fontSize = `${size}px`;
        words.push({ text, at, until: at + (seconds ?? 1.2 + text.length / WORDS.perSecond), side: s, rise, node });
        return actor;
      },

      // Hands a prop to another friend: it travels in an arc from one to the other, held height head
      // units above the floor.
      give(item, other, { at = scene.time, duration = 0.8, height = 60, arc = 80 } = {}) {
        PF.cast.ensure('give', name, other.name);
        const from = actor.state(at), to = other.state(at + duration);
        item.moveTo({ x: from.x, y: from.y - height }, { at, duration: 0 });
        item.moveTo({ x: to.x, y: to.y - height }, { at, duration, arc });
        return actor;
      },

      // Forgets cues that ended before t (live scenes only).
      prune(t) {
        const keep = list => {
          for (let i = list.length - 1; i >= 0; i--) {
            if (list[i].until < t) { list[i].node.remove(); list.splice(i, 1); }
          }
        };
        keep(marks); keep(words);
        for (let i = layers.length - 1; i >= 0; i--) if (layers[i].end < t) layers.splice(i, 1);
        while (gazes.length > 1 && gazes[1].at < t) gazes.shift();
        while (moves.length && moveEnd(moves[0]) < t) {
          const m = moves.shift();
          home.x = moveFinalX(m, glides(m));
        }
      },

      // ---- Drawing

      draw(t) {
        const shown = actor.visibleAt(t);
        node.style.display = shown ? '' : 'none';
        if (!shown) { hideAll(marks); hideAll(words); return; }
        const s = actor.state(t);
        node.style.transform = `translate(${s.x - BOX / 2}px, ${s.y - BOX - s.lift}px)`;
        rig.setPose(poseAt(t, s), true);
        const eyes = { x: s.x, y: s.y - rigGround - s.lift };
        for (const m of marks) drawMark(m, t, eyes);
        for (const w of words) drawWords(w, t, eyes);
      },
    };

    function poseAt(t, s) {
      const reduced = scene.reduced, acc = {};
      if (!reduced) {
        const idlePose = idle(t + a.phase), glances = {};
        for (const key of ['lookX', 'lookY', 'turnX', 'turnY']) {
          if (key in idlePose) { glances[key] = idlePose[key]; delete idlePose[key]; }
        }
        A.combine(acc, idlePose);
        A.combine(acc, glances, glancingAt(t));
      }
      for (const layer of layers) {
        const k = envelope(layer, t);
        if (k <= 0) continue;
        const partial = layer.clip(t - layer.at);
        A.combine(acc, reduced ? stringsOnly(partial) : partial, k * layer.weight);
      }
      const [lookX, lookY] = gazeAt(t, s);
      const turn = reduced ? 0 : GAZE.turn;
      A.combine(acc, { lookX, lookY, turnX: lookX * turn, turnY: lookY * turn });
      if (s.moving && !reduced) {
        A.combine(acc, { squash: s.squash, tilt: s.lean, turnX: s.dir * TRAVEL.turn * TRAVEL.weight });
      }
      return A.sample(acc);
    }


    function addMove(x, { at = scene.time, duration, hops, height = HOP.height, from, glide = null, leap = false } = {}) {
      const landing = moves.find(m => m.leap && m.at <= at && at < moveEnd(m));
      if (landing) at = moveEnd(landing);
      const start = from ?? actor.state(at).x;
      const n = hops ?? Math.max(1, Math.round(Math.abs(x - start) / HOP.length));
      for (const m of moves) if (m.at + m.duration > at && m.at <= at) m.cut = at;
      const move = { at, from: start, to: x, hops: n, height, duration: duration ?? n * HOP.seconds, cut: Infinity, glide, leap };
      moves.push(move);
      moves.sort((p, q) => p.at - q.at);
      return move;
    }

    // Whether a move glides: as it was cued, or else as reduced motion says when it is drawn.
    function glides(m) {
      return m.glide ?? scene.reduced;
    }

    function addShowing(at, shown) {
      showings.push({ at, shown });
      showings.sort((p, q) => p.at - q.at);
    }

    // How much of the idle clip's glancing about shows: all of it while the gaze is 'around', none
    // while it is on a target, and eased between the two as the gaze changes.
    function glancingAt(t) {
      let i = 0;
      while (i + 1 < gazes.length && gazes[i + 1].at <= t) i++;
      const now = gazes[i].target === 'around' ? 1 : 0;
      if (i === 0 || t - gazes[i].at >= GAZE.seconds) return now;
      const before = gazes[i - 1].target === 'around' ? 1 : 0;
      return lerp(before, now, smooth((t - gazes[i].at) / GAZE.seconds));
    }

    // The gaze, eased from the previous target to the current one over GAZE.seconds.
    function gazeAt(t, s) {
      let i = 0;
      while (i + 1 < gazes.length && gazes[i + 1].at <= t) i++;
      let look = lookToward(gazes[i].target, t);
      const since = t - gazes[i].at;
      if (i > 0 && since < GAZE.seconds) look = mixLook(lookToward(gazes[i - 1].target, t), look, smooth(since / GAZE.seconds));
      if (s.moving) look = mixLook(look, [s.dir * TRAVEL.look, 0], TRAVEL.weight);
      return look;
    }

    function lookToward(target, t) {
      if (!target || target === 'around' || target === 'viewer') return [0, 0];
      const point = target === 'pointer' ? scene.pointer : target.eyesAt ? target.eyesAt(t) : target.at ? target.at(t) : target;
      if (!point) return [0, 0];
      const me = actor.eyesAt(t), dx = point.x - me.x, dy = point.y - me.y, d = Math.hypot(dx, dy, GAZE.depth);
      return [dx / d, dy / d];
    }

    actor.eyesAt = t => {
      const s = actor.state(t);
      return { x: s.x, y: s.y - rigGround - s.lift };
    };

    function drawMark(m, t, eyes) {
      const active = t >= m.at && t < m.until;
      m.node.style.display = active ? '' : 'none';
      if (!active) return;
      const u = t - m.at, pop = scene.reduced ? 1 : A.ease.back(clamp(u / MARK.pop, 0, 1));
      const fade = clamp((m.until - t) / MARK.fade, 0, 1);
      m.node.style.opacity = String(Math.min(fade, clamp(u / 0.06, 0, 1)));
      m.node.style.transform = `translate(${eyes.x + MARK.x}px, ${eyes.y + MARK.y}px) translate(-50%, -100%) scale(${0.6 + 0.4 * pop}) rotate(-2deg)`;
    }

    function drawWords(w, t, eyes) {
      const active = t >= w.at && t < w.until;
      w.node.style.display = active ? '' : 'none';
      if (!active) return;
      const written = clamp((t - w.at) * WORDS.perSecond / Math.max(1, w.text.length), 0, 1);
      w.node.style.opacity = String(clamp((w.until - t) / WORDS.fade, 0, 1));
      w.node.style.clipPath = `inset(-20% ${100 - written * 100}% -20% -5%)`;  // Written left to right on either side.
      const shift = w.side > 0 ? '0' : w.side < 0 ? '-100%' : '-50%';
      w.node.style.transform = `translate(${eyes.x + w.side * WORDS.x}px, ${eyes.y + WORDS.y - w.rise}px) translate(${shift}, -85%) rotate(-2deg)`;
    }

    return actor;
  }

  // A move ends when it arrives, or where a later move cut it short.
  function moveEnd(m) {
    return Math.min(m.at + m.duration, m.cut);
  }
  function moveFinalX(m, glide) {
    return m.cut < m.at + m.duration ? hopAlong(m, (m.cut - m.at) / m.duration, glide).x : m.to;
  }

  // Where a move has reached at u (0 to 1): a row of hops, each a crouch, a flight and a landing; or,
  // under reduced motion, a plain glide.
  function hopAlong(m, u, glide) {
    const dir = Math.sign(m.to - m.from);
    if (glide) return { x: lerp(m.from, m.to, smooth(u)), lift: 0, squash: 0, lean: 0, dir };
    const hop = A.hopping(u, m.hops);
    return { x: lerp(m.from, m.to, hop.along), lift: m.height * hop.lift, squash: hop.squash, lean: hop.lean * dir, dir };
  }

  function envelope(layer, t) {
    if (t < layer.at || t >= layer.end) return 0;
    if (!(layer.fade > 0)) return 1;
    return Math.min(1, (t - layer.at) / layer.fade, (layer.end - t) / layer.fade);
  }

  // Under reduced motion only the face changes: eye and mouth shapes, not movement.
  function stringsOnly(partial) {
    const out = {};
    for (const key in partial) if (typeof partial[key] !== 'number') out[key] = partial[key];
    return out;
  }

  function mixLook(a, b, u) {
    return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
  }

  function hideAll(list) {
    for (const item of list) item.node.style.display = 'none';
  }

  function textNode(dom, className, text, { graphite = false } = {}) {
    const node = document.createElement('p');
    node.className = className;
    node.textContent = text;
    node.style.display = 'none';
    if (graphite && dom.graphite) node.style.filter = 'url(#graphite)';
    dom.layer.appendChild(node);
    return node;
  }

  // ---------------------------------------------------------------- Props

  // A prop is a drawing in the characters' pencil (or flat, for ink marks drawn as lines). Its
  // position is its bottom center, set directly by a game (set) or scheduled by a film (moveTo).
  function createProp(dom, drawing, p) {
    const node = document.createElement('div');
    node.className = 'pf-prop';
    Object.assign(node.style, { width: `${drawing.w}px`, height: `${drawing.h}px`, zIndex: String(20 + p.z) });
    node.innerHTML = PF.pencil.svg(drawing.svg, { w: drawing.w, h: drawing.h, flat: !!p.flat });
    dom.layer.appendChild(node);
    const moves = [];
    const state = { x: p.x, y: p.y, rotate: p.rotate, visible: true };

    const item = {
      node,
      set(values) { Object.assign(state, values); return item; },
      show(at, until = Infinity) { p.at = at; p.until = until; return item; },
      moveTo(to, { at = 0, duration = 0.5, ease = 'inOut', arc = 0 } = {}) {
        moves.push({ to, at, duration, ease: A.ease[ease] || ease, arc });
        moves.sort((a, b) => a.at - b.at);
        return item;
      },
      at(t) {
        let pos = { x: state.x, y: state.y, rotate: state.rotate };
        for (const m of moves) {
          if (t < m.at) break;
          const u = m.duration > 0 ? clamp((t - m.at) / m.duration, 0, 1) : 1, k = m.ease(u);
          pos = {
            x: lerp(pos.x, m.to.x ?? pos.x, k), y: lerp(pos.y, m.to.y ?? pos.y, k) - m.arc * Math.sin(Math.PI * u),
            rotate: lerp(pos.rotate, m.to.rotate ?? pos.rotate, k),
          };
        }
        return pos;
      },
      draw(t) {
        const shown = state.visible && t >= p.at && t < p.until;
        node.style.display = shown ? '' : 'none';
        if (!shown) return;
        const pos = item.at(t);
        node.style.transform = `translate(${pos.x - drawing.w / 2}px, ${pos.y - drawing.h}px) rotate(${pos.rotate}deg)`;
      },
    };
    return item;
  }

  // ------------------------------------------------------------- Writing

  // Handwriting whose baseline starts at (x, y). It writes itself out, left to right, over `seconds`.
  function createWriting(dom, text, w) {
    const node = textNode(dom, `pf-writing hand${w.tone === 'ink-2' ? ' ink-2' : ''}`, text, { graphite: w.graphite });
    node.style.fontSize = `${w.size}px`;
    let writing = null;  // The pen's copy of the text, laid over it the first time it is shown.
    const item = {
      node,
      set(values) {
        Object.assign(w, values);
        if ('text' in values) {
          node.textContent = values.text;  // This also takes away the pen's copy, which no longer fits.
          writing = null;
          w.pen = null;
          node.style.color = '';
        }
        node.style.fontSize = `${w.size}px`;
        return item;
      },
      draw(t) {
        const shown = t >= w.at && t < w.until;
        node.style.display = shown ? '' : 'none';
        if (!shown) return;
        if (w.pen && !writing) layPen();
        if (writing) {
          writing.at((t - w.at) * (w.seconds > 0 ? writing.duration / w.seconds : 1));
        } else {
          const written = w.seconds > 0 ? clamp((t - w.at) / w.seconds, 0, 1) : 1;
          node.style.clipPath = written < 1 ? `inset(-30% ${100 - written * 100}% -30% -5%)` : '';
        }
        const shift = w.align === 'center' ? '-50%' : w.align === 'right' ? '-100%' : '0';
        // A line box of 1em puts the face's baseline about 0.85em below its top (site/notebook.css, --sit).
        node.style.transform = `translate(${w.x}px, ${w.y}px) rotate(${w.rotate}deg) translate(${shift}, -0.85em)`;
      },
    };
    // The copy carries the ink, and the text itself stays as clear paper under it. Should the pen not
    // fit the text as set (another face, say), the text writes itself from left to right instead.
    function layPen() {
      writing = PF.pen.write(node, w.pen, { color: getComputedStyle(node).color });
      if (writing) node.style.color = 'transparent';
      else w.pen = null;
    }
    return item;
  }

  // ----------------------------------------------------------------- API

  const api = { create, RULE, BOX, HOP, MARK, WORDS };
  PF.scene = api;
})(typeof self !== 'undefined' ? self : this);
