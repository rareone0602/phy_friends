/*!
 * say hi: the film's core. One clock, the pages, the shots that cut between them, the drawers that
 * section modules add, the era (the library's shared constants as the film changes them), and the
 * checks that every frame must pass.
 *
 * A section module registers itself with SayHi.section(name, build). Once the cast, the fonts and
 * the source data are in, the core calls each build(k) in turn with a context k through which the
 * module adds what it draws and when (see HANDOFF.md):
 *
 *   SayHi.section('gallery', k => {
 *     k.shot('B', '13.1', '21.1');                                         // Page B is on screen.
 *     k.cue('B', (scene, cast) => cast.phy.play('hop', { at: k.at('17.1') }));  // A cue for the scene.
 *     k.draw(k.page('B').over, '16.3', '17.1', (el, t, { u }) => { ... });    // Drawn from t alone.
 *   });
 *
 * Every frame is a function of its time alone: seek(t) sets the era, picks the shot, seeks each
 * page shown and calls every drawer whose window holds t, whatever was shown before. A module that
 * throws, at its build or at a seek, is reported and the others carry on; with ?strict its failure
 * fails the filming. A broken rule of the cast (friends too close, a name or a word that must not be
 * shown) always does.
 *
 * Queries: ?film (tools/pf.py film), ?strict, ?debug (bar.beat, section and shot over the frame),
 * ?draft (allows friends outside the film's cast, stamped as a draft), ?at=<bar.beat or seconds>.
 *
 * Loads as a classic script after the library, film/scene.js and demo/say-hi/beats.js (SayHi).
 */
(function (root) {
  'use strict';

  const PF = root.PhyFriends, A = PF && PF.anim, B = root.SayHi && root.SayHi.beats;
  if (!PF || !A || !PF.scene || !B) throw new Error('say hi: load the library, film/scene.js and beats.js before core.js');

  const ROOT = '../../';                       // The repository, from demo/say-hi/.
  const FRAME = Object.freeze({ width: 1920, height: 1080, fps: 30 });
  const RULE = PF.scene.RULE;
  const BOIL = 4 / B.BEAT;                     // Texture redraws a second: four a beat (8.67), derived from the tempo.
  const VARIANTS = PF.pencil.settings.variants;
  const MEDIUM = 'video';
  // Strings that no text on screen may hold, besides the names of friends whose owners have not agreed to video.
  const FORBIDDEN_STRINGS = Object.freeze(['examples/', '.png', '.jpg', 'views', 'generated']);
  const RULE_SCREEN_PX = 1.5;                  // A rule of the paper keeps this width on screen whatever the camera's zoom.
  const LIFT = 0.012;                          // How far above the frame's middle a framed subject sits (its optical center), as a share of the frame's height.
  const PAGE_SPAN = 3;                         // The paper reaches this many frames each way, so that a camera can pan.

  const params = new URLSearchParams(location.search);
  const MODE = Object.freeze({
    filming: params.has('film'), strict: params.has('strict'), debug: params.has('debug'), draft: params.has('draft'),
  });

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const easeOf = e => (typeof e === 'function' ? e : A.ease[e || 'inOut']);

  // ----------------------------------------------------------- Failures

  const failures = [];                         // { owner, phase, message, t, rule }
  const notes = [];                            // Warnings that are not failures (words drawn too small to read), as text.
  const reported = new Set();

  // Reports a module's failure, once per owner, phase and message: loudly on the console, and in the
  // frame. A broken rule of the cast, or any failure under ?strict, is reported as an error, which
  // tools/pf.py film treats as fatal; anything else as a warning, so that the other modules go on.
  function fail(owner, phase, error, t = null, { rule = false } = {}) {
    const message = String((error && error.message) || error);
    const entry = { owner, phase, message, t, rule };
    const key = `${owner}|${phase}|${message}`;
    if (!reported.has(key)) {
      reported.add(key);
      failures.push(entry);
      const when = t == null ? '' : ` at ${B.label(t)} (${t.toFixed(3)} s)`;
      const text = `say hi: ${rule ? 'BROKEN RULE' : 'MODULE FAILED'}: ${owner}, ${phase}${when}: ${message}`;
      if (rule || MODE.strict) console.error(text);
      else console.warn(`%c${text}`, 'font-weight: bold; font-size: 14px');
      if (error && error.stack && !rule) console.warn(error.stack);
    }
    return entry;
  }

  // ------------------------------------------------------------- Loading

  const loaded = { cast: null };

  // Loads a classic script after those already added, resolving once it has run.
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`say hi: could not load ${src}`));
      document.head.appendChild(script);
    });
  }

  // Loads characters/cast.js and the specs of the friends whose owners have agreed to video. The cast
  // names every friend of the gallery, and installing it needs a spec for each, so a friend outside
  // the film gets an empty placeholder: its drawing is never loaded, and its name is never written in
  // the film's source.
  async function loadCast() {
    const install = PF.cast.define;
    let data = null;
    PF.cast.define = given => { data = given; return PF.cast; };
    try {
      await loadScript(`${ROOT}characters/cast.js`);
    } finally {
      PF.cast.define = install;
    }
    if (!data) throw new Error('say hi: characters/cast.js defined no cast');
    const inFilm = id => (data.friends[id].agreed || []).includes(MEDIUM);
    await Promise.all(Object.keys(data.friends).filter(inFilm).map(id => loadScript(`${ROOT}characters/${id}/${id}.js`)));
    for (const id of Object.keys(data.friends)) if (!inFilm(id)) PF.define(id, {});
    install(data);
    loaded.cast = data;
    for (const id of filmCast()) canon.set(id, PF.get(id));
  }

  // The film's cast, in the gallery's order: every friend whose owner has agreed to video.
  function filmCast() {
    return Object.keys(loaded.cast.friends).filter(id => PF.cast.agreed(id, MEDIUM));
  }

  // Every name and id that must not be shown: those of the friends outside the film's cast.
  function forbiddenNames() {
    return Object.entries(loaded.cast.friends).filter(([id]) => !PF.cast.agreed(id, MEDIUM))
      .flatMap(([id, entry]) => [id, entry.name]);
  }

  // ---------------------------------------------------------------- Era

  // The film begins in the project's past: shared constants of the library, and a friend's own
  // numbers, change on the timeline (the rice ball at bar 39, phy's white at bar 33). An era entry is
  // a value as a function of t, rounded to its quantum, which either sets a shared constant (apply)
  // or patches friends' specs (patch: value -> { friend: partial spec }). Every friend drawn at t is
  // drawn from a spec made for the values at t: a fresh object for each set of values, so that the
  // library's caches, which are keyed by spec, never hold a figure made under other values.
  const eraEntries = new Map();
  const canon = new Map();                     // Each friend's spec as its file defines it.
  const eraSpecs = new Map();                  // "name|key" -> the spec for those values.

  // get (optional, with apply): reads the number apply sets, so that era.under() can put it back exactly.
  function defineEra(name, { value, quantum = 0, apply = null, get = null, patch = null }) {
    if (eraEntries.has(name)) throw new Error(`say hi: the era already has "${name}"`);
    eraEntries.set(name, { name, value, quantum, apply, get, patch, owner: building ? building.name : 'core' });
  }

  // Replaces an entry's curve: value(t) -> its value at t.
  function eraCurve(name, value) {
    const entry = eraEntries.get(name);
    if (!entry) throw new Error(`say hi: the era has no "${name}"`);
    entry.value = value;
  }

  // The value of every era entry at t, each rounded to its quantum, so that nearby times share a spec.
  function eraValues(t) {
    const values = {};
    for (const entry of eraEntries.values()) {
      let v = entry.value(t);
      if (typeof v === 'number' && entry.quantum > 0) v = Math.round(Math.round(v / entry.quantum) * entry.quantum * 1e6) / 1e6;
      values[entry.name] = v;
    }
    return values;
  }

  // The era's values for the frame being drawn, read at the frame nearest its time, so that a time
  // between frames is drawn under the values of a frame and finds its scene among those built at the
  // start (buildEveryScene).
  function frameValues() {
    return eraValues(Math.round(now * FRAME.fps) / FRAME.fps);
  }

  // Sets every shared constant the era holds to its value in values.
  function applyEra(values) {
    for (const entry of eraEntries.values()) if (entry.apply) entry.apply(values[entry.name]);
  }

  // Runs fn under the era's values, then puts back the values of the frame being drawn, so that a
  // friend drawn as it was at another time (a before and after) leaves the rest of the frame alone.
  function underEra(values, fn) {
    applyEra(values);
    try {
      return fn();
    } finally {
      applyEra(frameValues());
    }
  }

  // Runs fn under the era's values at t, then puts back the numbers that were set before it: an entry's
  // own number where it can be read (get), else the value of the frame last drawn. For what a module
  // works out once, as it is built (where a friend's ground lies under the template of its time).
  function underEraAt(t, fn) {
    const kept = [...eraEntries.values()].filter(entry => entry.apply && entry.get).map(entry => [entry, entry.get()]);
    applyEra(eraValues(B.time(t)));
    try {
      return fn();
    } finally {
      const values = frameValues();
      for (const entry of eraEntries.values()) if (entry.apply && !entry.get) entry.apply(values[entry.name]);
      for (const [entry, value] of kept) entry.apply(value);
    }
  }

  // The film's default era: the bodies are plain ovals (ONIGIRI.taper 0) until bar 39, then ease to
  // the library's own taper, the one the gallery draws today. The gallery's module may give the
  // curve its final shape with k.era.curve('taper', t => ...).
  function defineDefaultEra() {
    const today = PF.ONIGIRI.taper, from = B.at(39, 1), seconds = 2 * B.BEAT;
    defineEra('taper', {
      value: t => (t < from ? 0 : today * A.ease.inOut(clamp((t - from) / seconds, 0, 1))),
      quantum: 0.04,
      apply: v => { PF.ONIGIRI.taper = v; },
      get: () => PF.ONIGIRI.taper,
    });
  }

  // The part of the era's values that a friend's drawing depends on: every shared constant, and the
  // patches that touch it.
  function eraKey(values, name) {
    const parts = [];
    for (const entry of eraEntries.values()) {
      if (entry.apply) parts.push([entry.name, values[entry.name]]);
      else if (entry.patch) {
        const patch = entry.patch(values[entry.name]);
        if (patch && patch[name] !== undefined) parts.push([entry.name, values[entry.name]]);
      }
    }
    return JSON.stringify(parts);
  }

  // The spec a friend is drawn from under the era's values.
  function eraSpec(name, values) {
    const key = `${name}|${eraKey(values, name)}`;
    if (!eraSpecs.has(key)) {
      if (!canon.has(name)) canon.set(name, PF.get(name));
      let spec = { ...canon.get(name) };
      for (const entry of eraEntries.values()) {
        const patch = entry.patch && entry.patch(values[entry.name]);
        if (patch && patch[name] !== undefined) spec = PF.merge(spec, patch[name]);
      }
      eraSpecs.set(key, spec);
    }
    return eraSpecs.get(key);
  }

  // Runs fn while PhyFriends.get(name) gives each named friend its era spec, for film/scene.js,
  // which takes a friend's spec by name when the friend is added.
  function withEraSpecs(values, fn) {
    const get = PF.get;
    PF.get = name => (typeof name === 'string' && canon.has(name) ? eraSpec(name, values) : get(name));
    try {
      return fn();
    } finally {
      PF.get = get;
    }
  }

  // ----------------------------------------------------------- Registry

  const modules = new Map();                   // name -> { name, build, built, failed }
  const shots = [];                            // { owner, from, to, pages, enter }
  const drawers = [];                          // { owner, page, el, from, to, fn, failedAt }
  const placings = [];                         // { owner, page, from, to, fn }: a page's place in the frame
  const papers = [];                           // { owner, page, from, to, fn }: a page's paper and rules
  const partsHooks = [];                       // { owner, page, friend, from, to, fn }: which parts of a friend show
  const pages = new Map();
  const drawnFriends = new Set();              // Friends drawn outside a scene (k.friend).
  const exportsOf = {};                        // What a module offers the others: SayHi.exports.<module>.
  let building = null;                         // The module whose build is running.
  let sealed = false;                          // Set once the modules are built: nothing may be added after.

  // Registers a section module; start() builds it, in the order registered, once the cast is in.
  function section(name, build) {
    if (modules.has(name)) throw new Error(`say hi: a section named "${name}" is already registered`);
    if (typeof build !== 'function') throw new Error(`say hi: section "${name}" needs a build function`);
    modules.set(name, { name, build, built: false, failed: false });
  }

  // Throws once the modules are built: everything is added while they build, so that the registry, and so
  // every frame, is fixed by then.
  function ensureOpen(what) {
    if (sealed) throw new Error(`say hi: ${what} must be added while the modules are built, not later`);
  }

  // ------------------------------------------------------------ Pages

  // A page is a sheet of ruled paper as large as the frame, measured in head units like a scene
  // (world: { width, height }, 16:9), with its own camera. From the back: the paper (paper), a layer
  // under the friends (under), the friends of its scene, a layer over them (over), all three moving
  // with the camera, and a layer fixed to the page (screen), in frame pixels. A page with a cast gets
  // a scene (film/scene.js) for every set of era values it is shown under; the scene's cues come from
  // the page's programs (cue()), which run again for each new scene.
  function definePage(id, def) {
    ensureOpen(`page ${id}`);
    if (pages.has(id)) throw new Error(`say hi: page ${id} is already defined`);
    const world = def.world || { width: FRAME.width, height: FRAME.height };
    const el = document.createElement('div');
    el.className = 'sh-page';
    el.dataset.page = id;
    el.style.visibility = 'hidden';
    el.innerHTML = '<div class="sh-paper sh-world"><div class="sh-sheet"></div></div><div class="sh-grain"></div>' +
      '<div class="sh-under sh-world"></div><div class="sh-scenes"></div><div class="sh-over sh-world"></div><div class="sh-screen"></div>';
    stage.pages.appendChild(el);
    const q = s => el.querySelector(s);
    const page = {
      id, el, world, owner: building ? building.name : 'core',
      fit: FRAME.width / world.width,
      paper: q('.sh-paper'), under: q('.sh-under'), over: q('.sh-over'), screen: q('.sh-screen'),
      places: def.places || {},                // name -> { x, y (its floor), ...scene.add options }
      ground: def.ground ?? world.height - 2 * RULE,
      margin: def.margin ?? false,
      describe: def.describe || '',
      cameraCues: [], programs: [], scenes: new Map(), shown: null,
      get cast() { return Object.keys(page.places); },
      camera(to, opts) { addCamera(page, to, opts); return page; },
      cameraAt: t => cameraAt(page, t),
      // World point (head units) to frame pixels, under the camera at t, before the page's own placing.
      toFrame: (x, y, t) => {
        const cam = cameraAt(page, t), k = page.fit * cam.zoom;
        return { x: FRAME.width / 2 + (x - cam.x) * k, y: FRAME.height / 2 + (y - cam.y) * k, scale: k };
      },
      sceneAt,
    };
    const sheet = q('.sh-sheet');
    Object.assign(sheet.style, {
      left: `${-PAGE_SPAN * world.width}px`, top: `${-PAGE_SPAN * Math.ceil(world.height / RULE) * RULE}px`,
      width: `${(2 * PAGE_SPAN + 1) * world.width}px`, height: `${(2 * PAGE_SPAN + 1) * Math.ceil(world.height / RULE) * RULE}px`,
    });
    if (page.margin !== false) sheet.insertAdjacentHTML('afterend', `<div class="sh-margin" style="left:${page.margin}px"></div>`);
    pages.set(id, page);

    // The scene for the era's values at t, made the first time those values are shown. By default the values
    // are read at the frame nearest t, as seek() reads them, so that a module asking at a time between frames
    // is given the scene on show, not another one that is hidden and still posed for an earlier seek.
    function sceneAt(t, values = eraValues(Math.round(t * FRAME.fps) / FRAME.fps)) {
      if (!page.cast.length) return null;
      const key = page.cast.map(name => eraKey(values, name)).join(';');
      if (!page.scenes.has(key)) page.scenes.set(key, buildScene(page, values, key));
      return page.scenes.get(key);
    }
    return page;
  }

  // Makes the scene a page shows under one set of era values: its friends at their places, the page's camera
  // cues and every module's cues.
  function buildScene(page, values, key) {
    const holder = document.createElement('div');
    holder.className = 'sh-scene';
    holder.dataset.era = key;
    holder.style.visibility = 'hidden';
    page.el.querySelector('.sh-scenes').appendChild(holder);
    // No frame of the film carries credits: a link in a video cannot be followed, so the roll call writes
    // the owners' handles large and the video's post links them (FWIENDS.md).
    const scene = PF.scene.create(holder, {
      width: page.world.width, height: page.world.height, ground: page.ground, paper: false, margin: false,
      boil: BOIL, medium: MEDIUM, credits: false, strict: true,
    });
    // A scene without a duration is a live one, which forgets the cues that ended two seconds before
    // the time of any frame it draws itself (film/scene.js, pruneCues); a browser frame can come
    // between two seeks, so a film's scene is given the film's length and keeps every cue.
    scene.duration = B.DURATION;
    const cast = {};
    withEraSpecs(values, () => {
      for (const [name, place] of Object.entries(page.places)) {
        try {
          cast[name] = scene.add(name, { look: 'viewer', ...place, x: place.x, y: place.y });
        } catch (error) {
          fail(page.owner, `placing ${name} on page ${page.id}`, error, null, { rule: true });
        }
      }
    });
    for (const cue of page.cameraCues) scene.camera(cue.to, { at: cue.at, duration: cue.duration, ease: cue.ease });
    for (const program of page.programs) {
      try {
        withEraSpecs(values, () => program.fn(scene, cast, page));
      } catch (error) {
        fail(program.owner, `cues on page ${page.id}`, error);
      }
    }
    return { scene, cast, holder, key };
  }

  // Adds a camera cue to a page, kept in time order.
  function addCamera(page, to, { at = 0, duration = 0, ease = 'inOut' } = {}) {
    ensureOpen(`a camera move on page ${page.id}`);
    page.cameraCues.push({ to, at: B.time(at), duration, ease, owner: building ? building.name : 'core' });
    page.cameraCues.sort((a, b) => a.at - b.at);
  }

  // The camera at t: where its cues have taken it, each easing from where the last left it, as
  // film/scene.js moves its own (which the page's scenes are given too).
  function cameraAt(page, t) {
    let state = { x: page.world.width / 2, y: page.world.height / 2, zoom: 1 };
    for (const cue of page.cameraCues) {
      if (t < cue.at) break;
      const u = cue.duration > 0 ? clamp((t - cue.at) / cue.duration, 0, 1) : 1, k = easeOf(cue.ease)(u);
      state = {
        x: lerp(state.x, cue.to.x ?? state.x, k), y: lerp(state.y, cue.to.y ?? state.y, k),
        zoom: lerp(state.zoom, cue.to.zoom ?? state.zoom, k),
      };
    }
    return state;
  }

  // The film's one rule for a frame (DECISIONS.md): what a shot shows, from its top to its bottom in a
  // page's world units, lies with the same paper above and below it, lifted by LIFT of the frame's
  // height to the frame's optical center. Returns the camera that frames it so at a zoom, centered on x.
  function frameBox(page, { top, bottom, x = page.world.width / 2, zoom = 1 }) {
    return { x, y: (top + bottom) / 2 + (LIFT * FRAME.height) / (page.fit * zoom), zoom };
  }

  // ------------------------------------------------------------- Stage

  const stage = { root: null, frame: null, pages: null, screen: null, debug: null, alarm: null };

  // Builds the frame in host: the pages, the screen layer over them, the alarm line and the debug line.
  function buildStage(host) {
    host.innerHTML = '<div class="sh-frame" role="img"><div class="sh-pages"></div><div class="sh-screen-top"></div>' +
      '<p class="sh-alarm" hidden></p><div class="sh-debug" hidden></div></div>';
    stage.root = host;
    stage.frame = host.querySelector('.sh-frame');
    stage.pages = host.querySelector('.sh-pages');
    stage.screen = host.querySelector('.sh-screen-top');
    stage.alarm = host.querySelector('.sh-alarm');
    stage.debug = host.querySelector('.sh-debug');
    Object.assign(stage.frame.style, { width: `${FRAME.width}px`, height: `${FRAME.height}px` });
  }

  // ------------------------------------------------------------- Seeking

  let now = 0;
  const decoded = new Set();

  // Draws the frame at t. Returns a promise that resolves once every texture the frame shows has
  // been decoded, so that tools/pf.py films the frame complete. The film loops, so a time past its end
  // (the end itself included) draws the frame it runs back into.
  function seek(t) {
    t = Number(t) || 0;
    t = t >= B.DURATION ? t % B.DURATION : Math.max(0, t);
    now = t;
    fresh();
    const values = frameValues();
    applyEra(values);
    const shown = pagesShownAt(t);
    for (const page of pages.values()) {
      const on = shown.has(page.id);
      // Hidden, not undisplayed, so that the scenes keep their layout; nothing inside a page may set
      // visibility: visible, which would show through.
      page.el.style.visibility = on ? '' : 'hidden';
      if (on) seekPage(page, t, values, shown.get(page.id));
    }
    for (const drawer of drawers) drawDrawer(drawer, t, shown);
    checkText(t);
    drawAlarm();
    if (MODE.debug) drawDebug(t, values);
    return texturesDecoded();
  }

  // Takes the frame's layout down and has it built again, so that Chrome paints the frame from its
  // markup alone: kept from one seek to the next, the layout and paint of a friend whose shape had just
  // changed (a stretch, a wake) came out a few levels different from a first drawing of the same markup.
  function fresh() {
    stage.frame.style.display = 'none';
    getComputedStyle(stage.frame).display;     // The layout tree is taken down here.
    stage.frame.style.display = '';
  }

  // The pages on screen at t, each with its place in the frame: the shot's pages, and while a shot
  // comes in with a transition, the last shot's pages under it. A transition runs for enter.seconds
  // from enter.lead seconds before the shot starts, so that a page can turn into a downbeat.
  function pagesShownAt(t) {
    const shown = new Map();
    const coming = shots.find(s => s.enter && s.enter.seconds > 0 &&
      t >= s.from - (s.enter.lead || 0) && t < s.from - (s.enter.lead || 0) + s.enter.seconds);
    if (coming) {
      const before = shotAt(coming.from - 1e-6);
      if (before && before !== coming) before.pages.forEach((id, i) => shown.set(id, { z: 1 + i, enter: null }));
      const u = easeOf(coming.enter.ease || 'inOut')((t - coming.from + (coming.enter.lead || 0)) / coming.enter.seconds);
      coming.pages.forEach((id, i) => shown.set(id, { z: 10 + i, enter: { kind: coming.enter.kind, from: coming.enter.from, u } }));
      return shown;
    }
    const shot = shotAt(t);
    if (shot) shot.pages.forEach((id, i) => shown.set(id, { z: 1 + i, enter: null }));
    return shown;
  }

  // The shot that holds t, or null.
  function shotAt(t) {
    let found = null;
    for (const shot of shots) if (shot.from <= t && t < shot.to) found = shot;
    return found;
  }

  // Draws a shown page at t: its camera, paper and place in the frame, the scene for the era's values, and
  // which parts of each friend show.
  function seekPage(page, t, values, { z, enter }) {
    const cam = cameraAt(page, t), k = page.fit * cam.zoom;
    const transform = `translate(${FRAME.width / 2}px, ${FRAME.height / 2}px) scale(${k}) translate(${-cam.x}px, ${-cam.y}px)`;
    for (const layer of [page.paper, page.under, page.over]) layer.style.transform = transform;
    page.paper.style.setProperty('--rule-width', `${RULE_SCREEN_PX / k}px`);
    drawPaper(page, t);
    placePage(page, t, z, enter);
    if (!page.cast.length) return;
    let built;
    try {
      built = page.sceneAt(t, values);
    } catch (error) {
      fail(page.owner, `building page ${page.id}`, error, t);
      return;
    }
    if (page.shown !== built) {
      if (page.shown) page.shown.holder.style.visibility = 'hidden';
      built.holder.style.visibility = '';
      page.shown = built;
    }
    try {
      built.scene.seek(t);
    } catch (error) {
      fail(page.owner, `page ${page.id}`, error, t, { rule: /stand .* apart|may not|not agreed/.test(String(error.message)) });
    }
    showParts(page, built, t);
  }

  // The paper's tone and its rules' color: the last hook whose window holds t, or the paper's own.
  function drawPaper(page, t) {
    let look = {};
    for (const hook of papers) {
      if (hook.page !== page.id || t < hook.from || t >= hook.to) continue;
      try {
        look = { ...look, ...hook.fn(t, info(hook, t)) };
      } catch (error) {
        fail(hook.owner, `paper of page ${page.id}`, error, t);
      }
    }
    const style = page.paper.style;
    style.setProperty('--sh-paper', look.paper || 'var(--paper)');
    style.setProperty('--sh-rule', look.rule || 'var(--rule)');
    page.el.style.setProperty('--sh-paper', look.paper || 'var(--paper)');
    page.el.style.setProperty('--sh-grain', String(look.grain ?? 1));
  }

  // The page's place in the frame: a transition's wipe or slide, then the hooks' moves (for a page
  // shrunk into a window, say). A hook gives { x, y, scale, rotate, opacity, clip } in frame pixels.
  function placePage(page, t, z, enter) {
    let place = { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1, clip: '' };
    if (enter && enter.kind === 'wipe') {
      // The edge on a whole frame pixel: a fractional one was snapped to one pixel or the next by what
      // Chrome had drawn before, so that the same frame came out differently in different seek orders.
      const edge = Math.round((1 - enter.u) * FRAME.width);
      place.clip = enter.from === 'left' ? `inset(0 ${edge}px 0 0)` : `inset(0 0 0 ${edge}px)`;
    }
    if (enter && enter.kind === 'slide') place.x = (1 - enter.u) * FRAME.width;
    place = { ...place, ...placeAt(page, t) };
    const style = page.el.style;
    style.zIndex = String(z);
    style.transform = place.x || place.y || place.scale !== 1 || place.rotate
      ? `translate(${place.x}px, ${place.y}px) rotate(${place.rotate}deg) scale(${place.scale})` : '';
    style.opacity = place.opacity === 1 ? '' : String(place.opacity);
    style.clipPath = place.clip || '';
  }

  // What the placing hooks whose window holds t make of a page's place, merged in order.
  function placeAt(page, t) {
    let place = {};
    for (const hook of placings) {
      if (hook.page !== page.id || t < hook.from || t >= hook.to) continue;
      try {
        place = { ...place, ...hook.fn(t, info(hook, t)) };
      } catch (error) {
        fail(hook.owner, `placing page ${page.id}`, error, t);
      }
    }
    return place;
  }

  // Frame pixels a unit of a layer is drawn at, at t: a page's world layers (paper, under, over)
  // scale with its camera, and every layer of a page with the page's own placing. A layer outside any
  // page is in frame pixels.
  function layerScale(layer, t) {
    const pageEl = layer && layer.closest && layer.closest('.sh-page');
    const page = pageEl && pages.get(pageEl.dataset.page);
    if (!page) return 1;
    const world = layer.classList.contains('sh-world') ? page.fit * cameraAt(page, t).zoom : 1;
    return world * (placeAt(page, t).scale ?? 1);
  }

  // Which parts of a friend in a page's scene show: a hook gives the part names (data-pf) to hide,
  // or { show: [...] } to hide every part but those. Without a hook, every part shows.
  function showParts(page, built, t) {
    for (const [name, actor] of Object.entries(built.cast)) {
      let rule = null;
      for (const hook of partsHooks) {
        if (hook.page !== page.id || hook.friend !== name || t < hook.from || t >= hook.to) continue;
        try {
          rule = hook.fn(t, info(hook, t));
        } catch (error) {
          fail(hook.owner, `parts of ${name}`, error, t);
        }
      }
      applyParts(actor.rig.svg, rule);
    }
  }

  // Hides parts of a drawing: rule is null (all show), an array of parts to hide, or { show: [...] },
  // which hides the rest. The parts are the drawing's innermost named groups, so that the eyes can show
  // without the head. A hidden part is undisplayed (a scene measures its friends' outlines once, when
  // they are added, before any part is hidden).
  const PART_ROOTS = ['tail', 'legs', 'body', 'feet', 'scarf', 'earL', 'earR', 'earLfront', 'earRfront', 'base', 'face', 'blush', 'eyes',
    'mouth', 'hair', 'tuck', 'armsBehind', 'armsBeside', 'pawsUnder', 'armsOver', 'ground'];
  function applyParts(svg, rule) {
    const hide = !rule ? new Set() : Array.isArray(rule) ? new Set(rule) : new Set(PART_ROOTS.filter(p => !rule.show.includes(p)));
    for (const node of svg.querySelectorAll('[data-pf]')) {
      const name = node.getAttribute('data-pf');
      if (!PART_ROOTS.includes(name)) continue;
      const value = hide.has(name) ? 'none' : '';
      if (node.style.display !== value) node.style.display = value;
    }
  }

  // What a drawer or hook is told at t: the time, its window, the time since it began and how far through it
  // is.
  function info(item, t) {
    const span = item.to - item.from;
    return { t, from: item.from, to: item.to, local: t - item.from, u: Number.isFinite(span) && span > 0 ? clamp((t - item.from) / span, 0, 1) : 0 };
  }

  // Draws a drawer while t is in its window and its page is shown, and hides it otherwise or when it throws.
  function drawDrawer(drawer, t, shown) {
    const active = t >= drawer.from && t < drawer.to && (!drawer.page || shown.has(drawer.page));
    const display = active ? '' : 'none';
    if (drawer.el.style.display !== display) drawer.el.style.display = display;
    if (!active) return;
    try {
      drawer.fn(drawer.el, t, info(drawer, t));
    } catch (error) {
      fail(drawer.owner, 'drawing', error, t);
      drawer.el.style.display = 'none';
    }
  }

  // Every image the shown pages hold, decoded, so that no frame is filmed before its texture.
  function texturesDecoded() {
    const waits = [];
    for (const image of stage.frame.querySelectorAll('image[href^="data:"]')) {
      const href = image.getAttribute('href');
      if (decoded.has(href)) continue;
      decoded.add(href);
      const img = new Image();
      img.src = href;
      waits.push(img.decode().catch(() => {}));
    }
    return waits.length ? Promise.all(waits).then(() => undefined) : Promise.resolve();
  }

  // ------------------------------------------------------------- Checks

  let lastText = null;

  // Refuses text on screen that names a friend outside the film's cast or holds a forbidden string.
  // The whole frame's text is read, shown or not, so that nothing can slip in behind a hidden layer.
  function checkText(t) {
    const text = stage.pages.textContent + stage.screen.textContent;
    if (text === lastText) return;
    lastText = text;
    const problem = textProblem(text);
    if (problem) fail('the frame', 'the text check', new Error(problem), t, { rule: true });
  }

  // Why a string may not be shown, or null.
  function textProblem(text) {
    const lower = String(text).toLowerCase();
    const name = forbiddenNames().find(n => lower.includes(n.toLowerCase()));
    if (name) return 'shown text names a friend whose owner has not agreed to video';
    const string = FORBIDDEN_STRINGS.find(s => lower.includes(s.toLowerCase()));
    return string ? `shown text holds "${string}"` : null;
  }

  // Throws if a string may not be shown; for components to check their text when they are made.
  function ensureShowable(text, what = 'text') {
    const problem = textProblem(text);
    if (problem) throw new Error(`say hi: ${what} may not be shown: ${problem}`);
    return text;
  }

  // Every friend drawn anywhere on the page whose owner has not agreed to video.
  function unagreed() {
    const names = new Set(drawnFriends);
    for (const page of pages.values()) for (const name of page.cast) names.add(name);
    return [...names].filter(name => !PF.cast.agreed(name, MEDIUM));
  }

  // Shows how many failures there are, and whose, in a red line atop the frame.
  function drawAlarm() {
    const broken = failures.length;
    stage.alarm.hidden = !broken;
    if (broken) stage.alarm.textContent = `${broken} failure${broken > 1 ? 's' : ''}: ${failures.map(f => f.owner).filter((o, i, a) => a.indexOf(o) === i).join(', ')}`;
  }

  // ----------------------------------------------------------- Friends

  // A friend drawn outside a scene, in the era's spec and the film's boil. Consent is checked here,
  // and the friend counts in film.unagreed.
  function friend(owner, name) {
    PF.cast.friend(name);
    if (!PF.cast.agreed(name, MEDIUM) && !MODE.draft) {
      throw new Error(`say hi: ${owner} draws a friend outside the film's cast; only friends whose owners agreed to video may be drawn`);
    }
    drawnFriends.add(name);
    const mounts = new WeakMap();
    return {
      name,
      spec: t => eraSpec(name, eraValues(t)),
      // An SVG string of the friend as it is drawn at t: opts as PhyFriends.render takes them (pose,
      // view, size, bg), with its pencil in the film's boil for t. Pass { era: t2 } to draw it as it was
      // drawn at another time.
      svg(t, opts = {}) {
        const values = eraValues(opts.era ?? t);
        const svg = underEra(values, () => PF.render(eraSpec(name, values), { bg: false, ...opts, uid: opts.uid || `sh-${name}` }));
        return withVariant(svg, t);
      },
      // A live rig of the friend in el, made again whenever the era changes what it looks like, with
      // its pencil in the film's boil for t. Pose it after every call: rig.setPose(pose, true). opts as
      // PhyFriends.mount takes them, and { era: t2 } as for svg().
      rig(el, t, opts = {}) {
        const values = eraValues(opts.era ?? t), key = eraKey(values, name) + JSON.stringify(opts.view || null);
        let kept = mounts.get(el);
        if (!kept || kept.key !== key) {
          const rig = underEra(values, () => PF.mount(el, eraSpec(name, values), { bg: false, ...opts, bitmap: false }));
          kept = {
            key,
            rig: {
              get svg() { return rig.svg; },
              get parts() { return rig.parts; },
              get pose() { return rig.pose; },
              spec: rig.spec, view: rig.view,
              setPose(pose, replace = true) { underEra(values, () => rig.setPose(pose, replace)); return this; },
              setTexture(variant) { rig.setTexture(variant); return this; },
            },
          };
          mounts.set(el, kept);
        }
        kept.rig.setTexture(variantAt(t));
        return kept.rig;
      },
    };
  }

  // The pencil texture's boil variant at t.
  function variantAt(t) {
    return Math.floor(t * BOIL + 1e-9) % VARIANTS;
  }

  // An SVG string with its pencil texture redrawn in the boil variant for t.
  function withVariant(svg, t) {
    const variant = variantAt(t);
    if (!variant) return svg;
    return svg.replace(/<image data-pf-texture="" href="[^"]*" x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/,
      (match, x, y, w, h) => match.replace(/href="[^"]*"/, `href="${PF.pencil.texture(+x, +y, +w, +h, variant)}"`));
  }

  // ------------------------------------------------------------- Morse

  // When a Morse message is on, as a pure function of its arguments: code in dots and dashes, letters
  // apart by a space and words by a slash ('-.-. --.-' is CQ); start a cue or seconds; unit the length
  // of a dot, a sixteenth note unless given. A dash lasts three units; the gap within a letter is one
  // unit, between letters three and between words seven. Returns [{ from, to, kind, letter }], where
  // kind is 'dot' or 'dash' and letter counts the letters from 0.
  function morse(code, start = 0, unit = B.SIXTEENTH) {
    const out = [];
    let at = B.time(start), letter = 0;
    code.trim().split(/\s*\/\s*/).forEach((word, w) => {
      if (w) at += 4 * unit;
      word.split(/\s+/).forEach((symbols, l) => {
        if (l) at += 2 * unit;
        for (const symbol of symbols) {
          if (symbol !== '.' && symbol !== '-') throw new Error(`say hi: "${symbol}" is not Morse; use dots and dashes`);
          const length = symbol === '-' ? 3 : 1;
          out.push({ from: at, to: at + length * unit, kind: symbol === '-' ? 'dash' : 'dot', letter });
          at += (length + 1) * unit;
        }
        letter++;
      });
    });
    return out;
  }

  // The interval of a list (as morse() gives) that holds t, or null.
  function during(intervals, t) {
    return intervals.find(i => t >= i.from && t < i.to) || null;
  }

  // ------------------------------------------------------- Module context

  // What a module's build is given (see HANDOFF.md). Everything it adds is owned by it, so that a
  // failure is reported under its name and keeps to its own drawings.
  function contextFor(module) {
    const owner = module.name;
    const span = (from, to) => [B.time(from), to === undefined ? Infinity : B.time(to)];
    const pageOf = id => {
      const page = pages.get(id);
      if (!page) throw new Error(`say hi: there is no page ${id}`);
      return page;
    };
    const k = {
      name: owner,
      beats: B, at: B.at, time: B.time, FRAME, RULE, BOIL, MODE, morse, during,
      page: pageOf,
      get pages() { return [...pages.keys()]; },
      // Defines another page (see definePage); its id must be new.
      definePage: (id, def) => definePage(id, def),
      // This module's shot: the pages shown from `from` until `to`, the first lowest. enter: { kind:
      // 'wipe' | 'slide', seconds, lead, ease, from } brings them in over the last shot's, starting `lead`
      // seconds before `from`; a wipe comes from the right edge, or from the left with from: 'left'.
      shot(pageIds, from, to, { enter = null } = {}) {
        ensureOpen('a shot');
        const [a, b] = span(from, to);
        const list = [].concat(pageIds);
        list.forEach(pageOf);
        shots.push({ owner, from: a, to: b, pages: list, enter });
      },
      // A drawer: fn(el, t, { u, local, from, to }) draws into its own element in `layer` while t is in
      // [from, to) and the layer's page is shown. It must set everything it shows from t alone.
      draw(layer, from, to, fn, { tag = 'div', className = '' } = {}) {
        ensureOpen('a drawer');
        const [a, b] = span(from, to);
        const el = tag === 'svg' ? document.createElementNS('http://www.w3.org/2000/svg', 'svg') : document.createElement(tag);
        el.setAttribute('class', `sh-drawer ${className}`.trim());
        el.dataset.owner = owner;
        el.style.display = 'none';
        layer.appendChild(el);
        const pageEl = layer.closest('.sh-page');
        const drawer = { owner, el, from: a, to: b, fn, page: pageEl ? pageEl.dataset.page : null };
        drawers.push(drawer);
        return drawer;
      },
      // A program of cues for a page's scenes: fn(scene, cast, page), run once for each scene the page makes.
      cue(pageId, fn) {
        ensureOpen('a cue');
        pageOf(pageId).programs.push({ owner, fn });
      },
      camera(pageId, to, opts) { pageOf(pageId).camera(to, opts); },
      // The camera that frames { top, bottom } of a page (world units) by the film's rule, at { x, zoom }.
      frame: (pageId, box) => frameBox(pageOf(pageId), box),
      // The paper of a page while t is in [from, to): fn(t, info) -> { paper, rule, grain }.
      paper(pageId, from, to, fn) {
        ensureOpen('a paper');
        const [a, b] = span(from, to);
        pageOf(pageId);
        papers.push({ owner, page: pageId, from: a, to: b, fn });
      },
      // The page's place in the frame while t is in [from, to): fn(t, info) -> { x, y, scale, rotate, opacity, clip }.
      place(pageId, from, to, fn) {
        ensureOpen('a placing');
        const [a, b] = span(from, to);
        pageOf(pageId);
        placings.push({ owner, page: pageId, from: a, to: b, fn });
      },
      // Which parts of a friend in a page's scene show while t is in [from, to): fn(t, info) -> null,
      // [parts to hide] or { show: [parts] }.
      parts(pageId, name, from, to, fn) {
        ensureOpen('a parts hook');
        const [a, b] = span(from, to);
        pageOf(pageId);
        partsHooks.push({ owner, page: pageId, friend: name, from: a, to: b, fn });
      },
      friend: name => friend(owner, name),
      // Hides parts of a drawing of a friend (a rig's svg): rule as for parts().
      showParts: (svg, rule) => applyParts(svg, rule),
      era: {
        values: eraValues, curve: eraCurve, under: underEraAt,
        define: (name, def) => { ensureOpen('an era entry'); defineEra(name, def); },
      },
      ensureShowable,
      // What this module offers the others, as SayHi.exports[module].
      exports: (exportsOf[owner] = exportsOf[owner] || {}),
      exportsOf: name => exportsOf[name] || {},
      ui: null,                                // Filled by components.js: the shared components, owned by this module.
    };
    if (root.SayHi.components) k.ui = root.SayHi.components(k, internals);
    return k;
  }

  // ------------------------------------------------------------ Debug

  function drawDebug(t, values) {
    const shot = shotAt(t), section = B.section(t);
    const era = Object.entries(values).map(([name, v]) => `${name} ${typeof v === 'number' ? v.toFixed(2) : String(v).slice(0, 12)}`).join(' · ');
    stage.debug.hidden = false;
    stage.debug.textContent = `${B.label(t)}  ·  ${section.id} ${section.name}  ·  ${shot ? `${shot.owner} on ${shot.pages.join('+')}` : 'no shot'}` +
      `  ·  ${t.toFixed(3)} s${era ? `  ·  ${era}` : ''}`;
  }

  // ------------------------------------------------------- Determinism

  // A hash of what the frame shows: the markup of every visible page, scene and drawer, with the ids
  // that depend on the order in which things were made (masks, clips, texture uids) renamed in the
  // order they appear. Two seeks of the same t, in any order, give the same hash. hash({ text: true })
  // gives the text that is hashed, to find what differs.
  function hash({ text: wanted = false } = {}) {
    const parts = [];
    const visit = node => {
      if (node.nodeType === 3) { parts.push(node.nodeValue); return; }
      if (node.nodeType !== 1) return;
      const style = node.getAttribute('style') || '';
      if (/display:\s*none|visibility:\s*hidden/.test(style) || node.getAttribute('display') === 'none' || node.hidden) return;
      // An attribute set and cleared again (an empty style) draws nothing, and is left out; a style's
      // declarations are sorted, since an element keeps them in the order they were first set.
      const value = a => (a.name === 'style' ? a.value.split(';').map(d => d.trim()).filter(Boolean).sort().join('; ') : a.value);
      const attrs = [...node.attributes].filter(a => a.value !== '').map(a => `${a.name}=${value(a)}`).sort().join(' ');
      parts.push(`<${node.nodeName} ${attrs}>`);
      for (const child of node.childNodes) visit(child);
      parts.push(`</${node.nodeName}>`);
    };
    visit(stage.frame);
    let text = parts.join('');
    const ids = [];
    text.replace(/(?:id=|data-pf-uid=)([A-Za-z][\w-]*)/g, (m, id) => { if (!ids.includes(id)) ids.push(id); return m; });
    const renamed = ids.map((id, i) => [id, `#${i}#`]).sort((a, b) => b[0].length - a[0].length);
    for (const [id, name] of renamed) text = text.split(id).join(name);
    if (wanted) return text;
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
    return (h >>> 0).toString(16).padStart(8, '0');
  }

  // ------------------------------------------------------------- Start

  // Loads the cast, the fonts and the source data, defines the pages, builds every module, and
  // checks the shots. Resolves once the film can be sought.
  async function start(host) {
    buildStage(host);
    await loadCast();
    await Promise.all([document.fonts.ready, ...FONTS.map(face => document.fonts.load(face, 'say hi'))]);
    defineDefaultEra();
    if (root.SayHi.pages) runAs({ name: 'pages' }, () => root.SayHi.pages(internals));
    for (const module of modules.values()) {
      runAs(module, () => {
        module.build(contextFor(module));
        module.built = true;
      });
    }
    sealed = true;
    checkShots();
    checkHolds();
    buildEveryScene();
    await seek(0);
    return api;
  }

  // Builds, hidden, every scene the film shows: each page's scene for the era's values at every frame
  // (at the film's rate) at which the page is on screen, as seek() would build it. Which scenes the
  // frame holds then never depends on the seeks before it: a scene built late, hidden beside the one
  // shown, changed how Chrome painted the pencil on the page's other layers (up to 17 levels in the
  // graphite of the crash's g at 21.1.3 after a frame of phy's edits had built one).
  function buildEveryScene() {
    for (let i = 0; i / FRAME.fps < B.DURATION; i++) {
      const t = i / FRAME.fps, values = eraValues(t);
      for (const id of pagesShownAt(t).keys()) {
        const page = pages.get(id);
        if (!page || !page.cast.length) continue;
        try {
          underEra(values, () => page.sceneAt(t, values));
        } catch (error) {
          fail(page.owner, `building page ${page.id}`, error, t);
        }
      }
    }
  }

  // The faces the film writes in, loaded before anything is measured.
  const FONTS = ['300 1em "Shantell Sans"', '600 1em "Shantell Sans"'];

  // Runs a module's build as that module, taking back everything it added if it throws.
  function runAs(module, fn) {
    building = module;
    try {
      fn();
    } catch (error) {
      module.failed = true;
      fail(module.name, 'build', error);
      takeBack(module.name);
    } finally {
      building = null;
    }
  }

  // Takes back everything a module added before its build failed, so that nothing half made is shown:
  // its shots (their bars show blank paper), drawers, cues, camera moves, hooks and era entries.
  function takeBack(owner) {
    const keep = list => { for (let i = list.length - 1; i >= 0; i--) if (list[i].owner === owner) list.splice(i, 1); };
    for (const drawer of drawers) if (drawer.owner === owner) drawer.el.remove();
    [shots, drawers, placings, papers, partsHooks].forEach(keep);
    for (const page of pages.values()) { keep(page.programs); keep(page.cameraCues); }
    for (const [name, entry] of eraEntries) if (entry.owner === owner) eraEntries.delete(name);
  }

  // Shots must not overlap, and should cover the film; an overlap is reported against the later one.
  function checkShots() {
    shots.sort((a, b) => a.from - b.from);
    for (let i = 1; i < shots.length; i++) {
      const a = shots[i - 1], b = shots[i];
      if (b.from < a.to - 1e-6) fail(b.owner, 'shots', new Error(`its shot from ${B.label(b.from)} overlaps ${a.owner}'s, which runs to ${B.label(a.to)}`));
    }
  }

  // ---------------------------------------------------------------- Holds

  // The lines a viewer must read, as the components register them: { owner, text, layer, end, until,
  // hold }, where end is when the line is fully written, until when it starts to go, and hold how long
  // it must stay whole (components.js, holdFor).
  const reads = [];

  // How long a page stays on screen from t: to the end of the run of shots, back to back, that show it.
  function shownUntil(pageId, t) {
    let until = t;
    for (let shot = shotAt(until); shot && shot.pages.includes(pageId); shot = shotAt(until)) until = shot.to;
    return until;
  }

  // Notes every must-read line that goes, or whose page is cut away, before it has been held whole for
  // its time (DECISIONS.md, the rule of holds). A note, not a failure: the film still runs.
  function checkHolds() {
    for (const read of reads) {
      const pageEl = read.layer && read.layer.closest && read.layer.closest('.sh-page');
      const gone = Math.min(read.until, pageEl ? shownUntil(pageEl.dataset.page, read.end) : Infinity);
      if (gone - read.end + 1e-3 >= read.hold) continue;
      const note = `say hi: ${read.owner}: "${read.text}" is whole for ${(Math.max(0, gone - read.end) / B.BEAT).toFixed(2)} beats ` +
        `(${B.label(read.end)} to ${B.label(gone)}); a must-read line wants ${(read.hold / B.BEAT).toFixed(2)}`;
      notes.push(note);
      console.warn(note);
    }
  }

  // Shared with pages.js and components.js.
  const internals = {
    FRAME, RULE, BOIL, MODE, ROOT, B, definePage, frameBox, pages, friend, filmCast, eraValues, applyEra, underEra, eraSpec, eraKey, withEraSpecs,
    defineEra, cameraAt, layerScale, reads, fail, ensureShowable, variantAt, withVariant, applyParts, stage, notes, get now() { return now; },
  };

  // Starts the film in host and makes the page filmable (the film contract in tools/pf.py): the page
  // owns window.film itself, since film/scene.js's own film() would take over the whole page.
  function own(host) {
    const ready = start(host);
    root.film = {
      width: FRAME.width, height: FRAME.height, fps: FRAME.fps, duration: B.DURATION,
      get unagreed() { return loaded.cast ? unagreed() : []; },
      ready: ready.then(() => undefined),
      seek: t => seek(t),
    };
    return ready;
  }

  const api = {
    FRAME, MODE, BOIL, section, start, own, seek, hash, unagreed, failures, notes, internals, morse, during,
    get now() { return now; },
    exports: exportsOf,
    shots: () => shots.map(s => ({ owner: s.owner, from: s.from, to: s.to, pages: s.pages.slice() })),
    modules: () => [...modules.values()].map(m => ({ name: m.name, built: m.built, failed: m.failed })),
  };
  Object.assign(root.SayHi, api);
})(typeof self !== 'undefined' ? self : this);
