/*!
 * phy_friends/live: friends alive on an ordinary page.
 *
 * A stage (stage()) keeps one clock and one frame loop for every friend on a page. Each friend is
 * mounted in a box of its own, standing on the box's bottom edge (PhyFriends.standingView), and lives
 * there, seated unless it is added standing (stance: 'stand'), when its ears reach higher above the
 * box. It breathes and blinks with the library's idle clip, as in a scene. It follows the pointer
 * with its eyes and, half as far, its head, and without a pointer it watches the friend the keyboard is
 * on; it perks up while hovered or focused; and it answers a hi
 * (a click, a tap, Enter or Space) with the emotion library's greeting (src/emotion.js).
 *
 * Its feelings come from the emotion library too, one rule each:
 *   a third hi within a few seconds of the first makes a friend shy, and it ignores a hi until it recovers;
 *   stroking it (the pointer or a finger moved back and forth over it, the left and right arrow keys
 *   pressed in turn, or a finger held still on it) makes it content;
 *   hovering over it or focusing it for a moment makes it curious;
 *   with no input for a while the friends grow sleepy one by one and fall asleep, and any input
 *   wakes them, those asleep with a start.
 * A friend that shows no feelings (Claude; E.fits()) takes part in none of these, and does the rest;
 * if its spec has a routine (Claude's laptop), its third hi plays that instead.
 *
 * Under reduced motion only the eyes follow the pointer and only the face changes, so that a hi is a
 * smile. A reader may ask for the same with a page's "keep still" checkbox (keepStill()), a choice
 * remembered on the device (still). The page keeps its own layout and says aloud what happens in its
 * live region (announcer). It may drive a friend's travel and gaze through hooks on the
 * friend (travel, watch), as the gallery's roll call does, and keep fields of its own on a friend.
 *
 * Example:
 *
 *   const stage = PhyFriends.live.stage({ root: box, announcer: document.querySelector('.announcer') });
 *   stage.add(box, 'phy', { label: 'phy' });
 *   stage.start();
 *
 * Loads as a classic script after src/phyfriends.js, src/anim.js and src/emotion.js (PhyFriends.live).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const PF = require('./phyfriends.js');
    require('./anim.js');
    require('./emotion.js');
    module.exports = factory(PF);
  } else factory(root.PhyFriends);
})(typeof self !== 'undefined' ? self : this, function (PF) {
  'use strict';

  const A = PF && PF.anim, E = PF && PF.emotion;
  if (!A || !E) throw new Error('phy_friends/live: load src/phyfriends.js, src/anim.js and src/emotion.js first');

  // ------------------------------------------------------------ Settings

  const IDLE_SECONDS = 8;                // The idle clip's loop, as in a scene (film/scene.js).
  const PHASE_STEP = 1.7;                // Offsets each friend's idle cycles so that they do not move in step.
  const GLANCES = ['lookX', 'lookY', 'turnX', 'turnY'];  // The idle clip's glances about, which fade while a friend looks at something.
  const POINTER_TIMEOUT_MS = 8000;       // A pointer that stays still this long is treated as gone.
  const GAZE_RATE = 7;                   // How fast the gaze eases toward its target, per second.
  const PERK_RATE = 10;                  // How fast a friend perks up or relaxes, per second.
  const SOFT_GAZE_RADIUS = 0.6;          // Within this fraction of a friend's width, the gaze softens.
  const HEAD_TURN = 0.5;                 // The head turns half as far as the eyes look.
  const PERK = { earDegrees: 6, widen: 0.06 };
  // A friend on its way somewhere looks and turns where it is going, about as far as in a scene (film/scene.js).
  const TRAVEL = { look: 0.5, turn: 0.35 };
  const BOIL = 8;                        // Pencil texture redraws per second, as in a film (film/film.js).
  const MAX_EASING_SECONDS = 0.1;        // After a long frame, the gaze and the perk ease by at most this much time.
  // With no pointer to follow and no one reacting, the friends only breathe and glance about, slowly
  // enough that 30 frames a second look as smooth as more, so a frame is drawn at most every 1/30 s
  // (a little under, so that a 60 Hz screen draws every other frame). This halves a phone's work.
  // While every friend that shows feelings is asleep, or while the friends keep still, a frame is drawn
  // only as often as the pencil texture is redrawn (the boil), so that a page left open does little
  // work.
  const CALM_FRAME_SECONDS = 0.85 / 30;
  const HI_FADE = 0.08;                  // The greeting starts and ends at rest, so it comes and goes quickly.
  const HELD_HI_SECONDS = 0.3;           // How far into its greeting the `hold` option holds a friend.
  const FEEL_FADE = 0.15;                // How long a feeling takes to come on or wear off, in seconds.
  // The third hi to a friend within `within` seconds of the first of the run makes it shy for `seconds`,
  // during which it ignores another hi. A friend that shows no feelings plays its routine instead, if its
  // spec has one, and ignores a hi until the routine ends.
  const SHY = { his: 3, within: 6, seconds: 2.5 };
  // A stroke: `reversals` turns along x within `within` seconds, each after at least `distance` px one
  // way; the friend stays content until `linger` seconds after the stroking stops. From the keyboard,
  // the left and right arrow keys pressed in turn stroke it, each press a `distance` one way, and the
  // turns may fall within `keyWithin` seconds, since keys are slower than a hand. A finger held on a
  // friend for `press` seconds, moving less than `steady` px, strokes it for as long as it stays.
  // The click that follows a long press within `click` seconds of the finger lifting is not a hi.
  const STROKE = { reversals: 2, distance: 12, within: 0.8, keyWithin: 1.5, linger: 1, press: 0.5, steady: 10, click: 0.6 };
  // Hovered or focused for `after` seconds without a hi, a friend grows curious; the feeling comes on
  // over `fade` seconds, since it has no reaction of its own.
  const CURIOUS = { after: 1.5, fade: 0.4 };
  // With no input for `after` seconds, the friends grow sleepy one at a time over `spread` seconds, in an
  // order seeded by `seed`, and each falls asleep `asleep` seconds (give or take `jitter`) later. Woken
  // by the pointer, the nearest starts first, `wake` seconds sooner for every 100 px nearer.
  const DOZE = { after: 30, spread: 8, asleep: 6, jitter: 0.4, seed: 11, wake: 0.05 };
  // Feelings in which a friend stops following the pointer: its eyes are shut, or it looks away.
  const INWARD = ['content', 'shy', 'sleepy', 'asleep'];
  // A mark (src/cast.js MARKS) in the hand, in head units within the friend's box, from its eyes: `size`
  // tall, its bottom at (x, y), just outside the right ear and just above the box, clear of the labels of
  // a row above. A mark that repeats (the z of sleep) starts lower, beside the head, and drifts up without
  // rising above the box. Both stand far enough out to clear every right ear but Howdi's, the widest,
  // which they graze, and near enough to read as their own friend's rather than a neighbor's.
  const MARK = { size: 44, x: 145, y: -108, drifting: { x: 145, y: -50 } };
  const FIELDS_MIRRORED = ['lookX', 'turnX', 'headX', 'tilt', 'x'];  // What changes sign when a pose is mirrored.
  const ANNOUNCEMENT = { hop: name => `${name} hops twice.` };  // The greeting (E.greeting) bounces twice.
  // A mark is bold, the pencil pressed harder (STYLE.md §5), so that it reads at a glance at the
  // gallery's size; film/scene.js draws its marks alike.
  const STYLE = [
    '.pf-live { container-type: inline-size; }',
    '.pf-live-mark { position: absolute; left: 0; top: 0; margin: 0; pointer-events: none; white-space: pre; line-height: 1;',
    '  font-family: var(--face, \'Shantell Sans\', sans-serif); font-weight: 600; color: var(--ink-2, #6d6a63); transform-origin: 50% 100%; }',
  ].join('\n');

  const STILL_KEY = 'phy-friends-still';  // Where the reader's "keep still" is remembered; index.html's head script reads it too.

  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  // ------------------------------------------------------------ Keeping still

  // Whether the friends keep still, as they do under reduced motion: the reader's choice, made with a
  // page's "keep still" checkbox (keepStill()) and remembered on this device, or else the system's
  // setting. It has a MediaQueryList's `matches`, so that a stage takes it as its reducedMotion, and
  // every stage does by default. choose(true or false) makes the choice, and choose(null) forgets it.
  const still = (() => {
    const system = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
    let chosen = remembered();
    // A choice made in another tab holds here too.
    if (typeof addEventListener === 'function') addEventListener('storage', event => { if (event.key === STILL_KEY) chosen = remembered(); });
    return {
      system,
      get matches() { return chosen ?? !!system.matches; },
      choose(value) {
        chosen = value === null ? null : !!value;
        try {
          if (chosen === null) localStorage.removeItem(STILL_KEY);
          else localStorage.setItem(STILL_KEY, chosen ? '1' : '0');
        } catch {
          // Without storage, as in some private windows, the choice lasts as long as the page.
        }
      },
    };
  })();

  // The choice remembered on this device: true, false, or null for none.
  function remembered() {
    try {
      const value = localStorage.getItem(STILL_KEY);
      return value === null ? null : value === '1';
    } catch {
      return null;
    }
  }

  // Makes a checkbox the reader's "keep still": it is ticked while the friends keep still, and ticking
  // or clearing it keeps or frees them from the next frame, on every page that has friends alive. The
  // checkbox is shown only once it works, since without this script it would do nothing.
  function keepStill(checkbox) {
    const show = () => { checkbox.checked = still.matches; };
    checkbox.addEventListener('change', () => still.choose(checkbox.checked));
    if (still.system.addEventListener) still.system.addEventListener('change', show);
    addEventListener('storage', event => { if (event.key === STILL_KEY) show(); });
    show();
    const shown = checkbox.closest('[hidden]');
    if (shown) shown.hidden = false;
    return checkbox;
  }

  // ------------------------------------------------------------ Stage

  const ANNOUNCEMENT_GAP_MS = 100;  // Screen readers repeat a message only if the region was empty for a moment.
  // Keys that move focus or scroll the page, which wake the friends quietly.
  const MOVING_KEYS = new Set(['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End',
    'Shift', 'Control', 'Alt', 'Meta']);

  // Says a message in a live region. The region is emptied first, so that a second hop is announced
  // even when its message is the same as the first.
  function liveRegion(element) {
    let timer = 0;
    return message => {
      clearTimeout(timer);
      element.textContent = '';
      timer = setTimeout(() => { element.textContent = message; }, ANNOUNCEMENT_GAP_MS);
    };
  }

  // Options: root (the element whose being in view keeps the frames coming; the page by default) and
  // margin (px by which it counts as in view early); pointer (a simulated pointer { x, y } in CSS px:
  // fixed, and the friends keep still, for screenshots); hold (the name of a friend held in the middle
  // of its greeting, for screenshots); feel (a feeling every friend that shows feelings holds still, for
  // screenshots and review); boil (texture redraws per second; anything but a positive number keeps it
  // still); doze (seconds without input before the friends doze off, or 0 for never); reducedMotion (a
  // MediaQueryList, or anything with `matches`; still, the reader's choice or else the system's, by
  // default); announcer (the page's live region, role="status"), in
  // which the stage says what happened, or announce(text), to say it some other way; and
  // hooks: beforeHi(friend), which may refuse a hi by returning false; onFocus(friend); beforeFrame(t),
  // run before each frame; busy(t), true while the page wants every frame drawn; canDoze(), false while
  // the friends must stay awake; and afterPose(friend, travel), run after each friend is posed.
  function stage(options = {}) {
    const o = {
      root: null, margin: 0, pointer: null, hold: null, feel: null, boil: BOIL, doze: DOZE.after,
      reducedMotion: still,
      announcer: null, announce: null, beforeHi: null, onFocus: null, beforeFrame: null, busy: null, canDoze: null, afterPose: null,
    };
    for (const key in options) if (options[key] !== undefined && options[key] !== null) o[key] = options[key];
    if (!o.announce) o.announce = o.announcer ? liveRegion(o.announcer) : () => {};
    const simulated = options.pointer || null;
    const records = [], byFriend = new Map();
    let pointer = simulated, pointerMovedAt = now();
    // The stage keeps its own clock, which stands still while the stage is out of sight, so that idle
    // cycles, reactions and dozing carry on from where they stopped.
    let clock = 0, lastFrame = 0, frameRequest = 0, frameTimer = 0, inView = true, started = false;
    let lastInput = 0, doze = null, toldAsleep = false;
    addStyle();

    const self = {
      get friends() { return records.map(record => record.friend); },
      get seconds() { return clock; },
      get pointer() { return pointer; },
      get reduced() { return !!o.reducedMotion.matches; },
      get dozing() { return !!doze; },
      add, start, draw, wake, noteInput,
    };
    return self;

    // Mounts a friend in box and returns it. label is its name as the page writes it; bg the mount's
    // background (false by default: the page's paper); index its place, which offsets its idle cycles;
    // stance 'stand' stands it up, as a clip may for a while.
    function add(box, name, { label = name, bg = false, index = records.length, interactive = true, stance = 'sit' } = {}) {
      const record = createFriend(box, name, { label, bg, phase: index * PHASE_STEP, interactive, stance });
      records.push(record);
      byFriend.set(record.friend, record);
      return record.friend;
    }

    // Starts following the pointer, listening for input and drawing frames while the stage is in view.
    function start() {
      if (started) return self;
      started = true;
      if (!simulated) followPointer();
      listenForInput();
      animateWhileVisible();
      return self;
    }

    // ---- Frames

    // Draws frames only while the page is shown and the root is in view, which spares a phone's battery.
    function animateWhileVisible() {
      const observer = new IntersectionObserver(entries => {
        inView = entries.at(-1).isIntersecting;  // The latest entry wins when several arrive at once.
        pauseOrResume();
      }, { rootMargin: `${o.margin}px` });
      observer.observe(o.root || document.documentElement);
      document.addEventListener('visibilitychange', pauseOrResume);
      pauseOrResume();
    }

    function pauseOrResume() {
      if (inView && !document.hidden) resume();
      else pause();
    }

    function pause() {
      cancelAnimationFrame(frameRequest);
      clearTimeout(frameTimer);
      frameRequest = frameTimer = 0;
    }

    // The first frame after a pause advances the stage by one frame rather than by the time away, so
    // that the gaze eases toward wherever the pointer is now at its usual rate.
    function resume() {
      if (frameRequest || frameTimer) return;
      lastFrame = now();
      frameRequest = requestAnimationFrame(animate);
    }

    // With nothing to watch and nobody reacting, a frame is drawn only every CALM_FRAME_SECONDS, and
    // while everyone who shows feelings is asleep, or while the friends keep still, only when the texture
    // would be redrawn. The stage waits on a timer rather than a request for every refresh, so that the
    // browser has nothing to do in between.
    function animate(time) {
      frameRequest = 0;
      const elapsed = Math.max(0, (time - lastFrame) / 1000), t = clock + elapsed;
      if (o.beforeFrame) o.beforeFrame(t);
      const quiet = isPointerGone(time) && !watchedAt(t) && !records.some(r => r.friend.watch && r.friend.watch(t)) &&
        !(o.busy && o.busy(t));
      const wait = !quiet ? 0 : (doze && doze.asleep) || self.reduced ? untilRedrawn(t) : CALM_FRAME_SECONDS - elapsed;
      if (wait > 0) {
        frameTimer = setTimeout(() => {
          frameTimer = 0;
          frameRequest = requestAnimationFrame(animate);
        }, wait * 1000);
        return;
      }
      lastFrame = time;
      draw(t, elapsed, time);
      frameRequest = requestAnimationFrame(animate);
    }

    // Seconds from t until the texture is next redrawn, or 0 if it has been since the last frame. Where
    // the texture keeps still, the frames keep to the rate at which it would boil.
    function untilRedrawn(t) {
      const rate = Number.isFinite(o.boil) && o.boil > 0 ? o.boil : BOIL;
      const drawn = Math.floor(clock * rate);
      return Math.floor(t * rate) > drawn ? 0 : (drawn + 1) / rate - t;
    }

    // Input brings the next frame forward, rather than leaving it until a calm wait ends.
    function hurry() {
      if (!frameTimer) return;
      clearTimeout(frameTimer);
      frameTimer = 0;
      frameRequest = requestAnimationFrame(animate);
    }

    // Draws the stage at time t on its clock, elapsed seconds after the frame before. Each friend looks
    // at what its page gives it to watch, or at a friend reacting to the reader, or else at the pointer,
    // or, with no pointer, at the friend the keyboard is on, or else around; its idle motion, its
    // feelings and any greeting play underneath.
    function draw(t, elapsed = Math.max(0, t - clock), time = now()) {
      const dt = Math.min(MAX_EASING_SECONDS, elapsed);
      clock = t;
      const reduced = self.reduced, gone = isPointerGone(time);
      updateDoze(t);
      for (const record of records) record.update(t);
      const watched = watchedAt(t), focus = gone ? records.find(r => r.friend.focused) : null;
      const watches = new Map(records.map(r => [r, r.friend.watch ? byFriend.get(r.friend.watch(t)) : null]));
      // Every friend's eyes are found before any friend is posed, since finding them after a pose would
      // make the browser lay out the page again, once for each friend.
      const measure = watched || focus || [...watches.values()].some(Boolean) || !gone;
      const eyes = measure ? new Map(records.map(r => [r, r.eyes()])) : null;
      const frame = {
        reduced, moving: !reduced && !simulated,
        gazeEase: simulated ? 1 : 1 - Math.exp(-dt * GAZE_RATE),
        perkEase: simulated ? 1 : 1 - Math.exp(-dt * PERK_RATE),
      };
      for (const record of records) {
        const travel = record.friend.travel ? record.friend.travel(t) : null, newcomer = watches.get(record);
        const target = newcomer ? eyes.get(newcomer) : watched && watched !== record ? eyes.get(watched) : !gone ? pointer
          : focus && focus !== record ? eyes.get(focus) : null;
        record.pose(t, { ...frame, travel, target, eyes: eyes && eyes.get(record) });
        if (o.afterPose) o.afterPose(record.friend, travel);
      }
      for (const record of records) record.drawMarks(t, reduced);
      boil(t, reduced);
    }

    // The pencil texture "boils": every friend's is redrawn o.boil times a second, cycling through the
    // library's variants in step, as in hand-drawn animation. Under reduced motion, or with a simulated
    // pointer, it keeps still.
    function boil(t, reduced) {
      const still = reduced || simulated || !(Number.isFinite(o.boil) && o.boil > 0);
      const variant = still ? 0 : Math.floor(t * o.boil) % PF.pencil.settings.variants;
      for (const record of records) record.friend.rig.setTexture(variant);
    }

    // The friend that reacted to the reader most recently (a hi, going shy), while its reaction is worth
    // watching (watchedUntil): the others glance at it.
    function watchedAt(t) {
      let latest = null;
      for (const record of records) {
        const reaction = record.reaction;
        if (reaction && reaction.at <= t && t < reaction.watchedUntil && (!latest || reaction.at > latest.reaction.at)) latest = record;
      }
      return latest;
    }

    // ---- The pointer and other input

    function isPointerGone(time) {
      return !pointer || (!simulated && time - pointerMovedAt > POINTER_TIMEOUT_MS);
    }

    // Follows a mouse or a pen while it is over the window, and a finger while it touches the screen.
    // A finger is followed through touch events, which keep arriving while the page scrolls under it.
    function followPointer() {
      addEventListener('pointermove', event => {
        if (event.pointerType !== 'touch') { pointer = { x: event.clientX, y: event.clientY }; pointerMovedAt = now(); }
      });
      document.addEventListener('mouseout', event => { if (!event.relatedTarget) pointer = null; });
      const followTouch = event => {
        const touch = event.touches[0];
        pointer = touch ? { x: touch.clientX, y: touch.clientY } : null;
        pointerMovedAt = now();
      };
      for (const type of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) addEventListener(type, followTouch, { passive: true });
    }

    // Any input keeps the friends awake, and wakes them if they doze. The listeners capture, so that a
    // friend is awake before a click or a key reaches it. Input that only moves about the page (a
    // scroll, focus moving, or a key that does either) wakes them quietly, so that the live region does
    // not talk over what a screen reader says about the move.
    function listenForInput() {
      const input = event => noteInput(pointOf(event), { quiet: event.type === 'wheel' || (event.type === 'keydown' && MOVING_KEYS.has(event.key)) });
      for (const type of ['pointerdown', 'keydown', 'wheel', 'touchstart']) addEventListener(type, input, { capture: true, passive: true });
      addEventListener('pointermove', event => { if (event.pointerType !== 'touch') input(event); }, { capture: true, passive: true });
      addEventListener('scroll', () => noteInput(null, { quiet: true }), { capture: true, passive: true });
      addEventListener('focusin', () => noteInput(null, { quiet: true }), true);
    }

    // Notes input at point (client px), or at no point for a key or a scroll; quiet input wakes the
    // friends without saying so.
    function noteInput(point = null, { quiet = false } = {}) {
      lastInput = clock;
      if (doze) wake(point, { quiet });
      hurry();
    }

    // ---- Dozing

    function updateDoze(t) {
      const allowed = o.doze > 0 && !simulated && !o.feel && !o.hold && (!o.canDoze || o.canDoze());
      if (!allowed && !doze) {
        lastInput = t;  // The wait for a doze starts once dozing is allowed.
        return;
      }
      if (!doze && t - lastInput >= o.doze) doze = beginDoze(t);
      if (doze) advanceDoze(t);
    }

    function beginDoze(t) {
      const sleepers = records.filter(record => record.friend.fits);
      if (!sleepers.length) return null;
      const times = dozeSchedule(sleepers.length, t);
      return { entries: sleepers.map((record, i) => ({ record, ...times[i], sleepy: false, asleep: false })), asleep: false };
    }

    function advanceDoze(t) {
      for (const entry of doze.entries) {
        if (!entry.sleepy && t >= entry.sleepyAt) {
          entry.sleepy = true;
          entry.record.friend.feel('sleepy', { at: entry.sleepyAt });
        }
        if (!entry.asleep && t >= entry.asleepAt) {
          entry.asleep = true;
          entry.record.friend.feel('asleep', { at: entry.asleepAt });
        }
      }
      // Falling asleep is told once a visit: after that, a screen reader knows what a quiet page means.
      if (!doze.asleep && doze.entries.every(entry => entry.asleep)) {
        doze.asleep = true;
        const awake = records.filter(record => !record.friend.fits).map(record => record.friend.label);
        if (!toldAsleep) o.announce(dozeAnnouncement(doze.entries.map(entry => entry.record.friend.label), awake));
        toldAsleep = true;
      }
    }

    // Wakes the friends: those asleep with a start, the nearest to point first (all at once for a key),
    // and those only sleepy by opening their eyes. Unless quiet, it says so.
    function wake(point = null, { quiet = false } = {}) {
      if (!doze) return;
      const t = clock, woken = [];
      for (const entry of doze.entries) {
        if (entry.asleep) {
          const eyes = point ? entry.record.eyes() : null;
          const delay = eyes ? DOZE.wake * Math.hypot(eyes.x - point.x, eyes.y - point.y) / 100 : 0;
          entry.record.wakeAt(t + delay);
          woken.push(entry.record.friend.label);
        } else if (entry.sleepy) entry.record.friend.calm(t);
      }
      doze = null;
      if (woken.length && !quiet) o.announce(wakeAnnouncement(woken, records.filter(record => record.friend.fits).length));
    }

    // ---- A friend

    function createFriend(box, name, { label, bg, phase, interactive, stance }) {
      const spec = PF.get(name), view = PF.standingView(spec), fits = E.fits(spec);
      box.classList.add('pf-live');
      const rig = PF.mount(box, spec, { bg, view, pose: { stance } });
      rig.svg.setAttribute('aria-hidden', 'true');  // The box's label says who the friend is.
      const idle = A.make.idle({ seed: PF.hash(name) % 997, duration: IDLE_SECONDS });
      const greeting = E.greeting(spec), layers = A.stack(), marks = [], strokes = strokeDetector();
      // A friend that shows no feelings may have a routine of its own (spec.routine), which its third hi plays.
      const routine = !fits && spec.routine ? A.track(spec.routine.keys, { duration: spec.routine.duration }) : null;
      const keyStrokes = strokeDetector({ within: STROKE.keyWithin });
      let lookX = 0, lookY = 0, glance = 1, perk = 0, hovered = false, focused = false;
      let run = null, feeling = null, attendedSince = null, stroking = null, pendingWake = null;
      let keyX = 0, press = null;  // Where the arrow keys have moved an imaginary hand; a finger held on the friend.

      const friend = {
        name, label, spec, rig, view, fits,
        travel: null,  // Set by the page: t => null, or { dir, squash, lean } while the friend is on its way.
        watch: null,   // Set by the page: t => null, or another friend to look at.
        get hovered() { return hovered; },
        get focused() { return focused; },
        get feeling() { return feeling ? feeling.name : null; },
        hi, feel, calm, smile,
        reacting: t => reacting(t),
      };
      const record = { friend, reaction: null, update, pose, drawMarks, eyes, wakeAt };

      if (o.hold === name) {
        layers.add(A.still(greeting(HELD_HI_SECONDS)), { at: -Infinity, fade: 0 });
        record.reaction = { at: -Infinity, until: Infinity, watchedUntil: Infinity };
      }
      if (o.feel && fits) {
        feeling = feelingOf(o.feel, layers.add(A.still(E.face(o.feel, { spec })), { at: -Infinity, fade: 0 }), Infinity);
        const shown = E.mark(o.feel);
        if (shown) showMark(shown.text, { at: 0, lasting: Infinity });
      }
      if (interactive) listen();
      return record;

      // A click, a tap, Enter or Space says hi; a key held down says it once. Hovering or focusing from
      // the keyboard perks the friend up, and either is enough on its own. Moving the pointer or a finger
      // back and forth over it strokes it, as do the left and right arrow keys pressed in turn and a
      // finger held still on it (a long press), after which the tap that ends the press is not a hi.
      function listen() {
        box.addEventListener('click', event => {
          const endsPress = press && press.held && !press.down && event.timeStamp - press.liftedAt <= STROKE.click * 1000;
          press = null;
          if (!endsPress) hi();
        });
        box.addEventListener('keydown', event => {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            // The press moves the hand from where it was, so that right, left and right stroke once.
            event.preventDefault();
            keyStrokes.move(keyX, event.timeStamp / 1000);
            keyX += event.key === 'ArrowRight' ? STROKE.distance : -STROKE.distance;
            stroke(keyX, event.timeStamp, keyStrokes);
            return;
          }
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          if (!event.repeat) hi();
        });
        box.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') hovered = true; });
        box.addEventListener('pointerleave', () => { hovered = false; strokes.reset(); });
        box.addEventListener('pointermove', event => { if (event.pointerType !== 'touch') stroke(event.clientX, event.timeStamp); });
        box.addEventListener('touchstart', event => {
          strokes.reset();
          releasePress(event.timeStamp);
          const touch = event.touches.length === 1 ? event.touches[0] : null;
          press = touch ? { x: touch.clientX, y: touch.clientY, down: true, held: false, liftedAt: 0, timer: setTimeout(holdPress, STROKE.press * 1000) } : null;
        }, { passive: true });
        box.addEventListener('touchmove', event => {
          const touch = event.touches[0];
          if (!touch) return;
          if (press && !press.held && Math.hypot(touch.clientX - press.x, touch.clientY - press.y) > STROKE.steady) press = releasePress(event.timeStamp);
          stroke(touch.clientX, event.timeStamp);
        }, { passive: true });
        for (const type of ['touchend', 'touchcancel']) box.addEventListener(type, event => releasePress(event.timeStamp), { passive: true });
        // A long press would otherwise open the system's menu for the page.
        box.addEventListener('contextmenu', event => { if (press && press.down) event.preventDefault(); });
        box.addEventListener('focus', () => {
          focused = box.matches(':focus-visible');
          if (o.onFocus) o.onFocus(friend);
        });
        box.addEventListener('blur', () => { focused = false; });
      }

      // A friend that is already reacting ignores a hi until its reaction ends: the hop under way
      // answers it, and restarting the hop would drop the friend to the ground in one frame (FWIENDS.md).
      // The third hi of a run makes a friend shy instead.
      function hi() {
        const t = clock;
        if (o.beforeHi && o.beforeHi(friend) === false) return false;
        if (reacting(t)) return false;
        attendedSince = t;  // Curiosity starts afresh after a hi.
        calm(t);
        run = run && t - run.first <= SHY.within ? { first: run.first, count: run.count + 1 } : { first: t, count: 1 };
        if (routine && run.count >= SHY.his) {
          run = null;
          // It keeps its eyes on what it is doing, ignores a hi until it is done, and the others watch it throughout.
          layers.add(routine, { at: t, fade: HI_FADE });
          record.reaction = { at: t, until: t + routine.duration, watchedUntil: t + routine.duration, absorbed: true };
          o.announce(`${label} ${self.reduced ? spec.routine.saysStill : spec.routine.says}.`);
          return true;
        }
        if (fits && run.count >= SHY.his) {
          run = null;
          const own = eyes();
          feel('shy', { at: t, lasting: SHY.seconds, mirror: !!pointer && pointer.x > own.x });  // It looks away from the pointer.
          // It ignores a hi for as long as it is shy, and the others glance at it only while it ducks.
          record.reaction = { at: t, until: t + SHY.seconds, watchedUntil: t + E.react('shy').duration };
          o.announce(E.describe('shy', label));
          return true;
        }
        layers.add(greeting, { at: t, fade: HI_FADE });
        record.reaction = { at: t, until: t + greeting.duration, watchedUntil: t + greeting.duration };
        o.announce(self.reduced ? E.describe('happy', label) : ANNOUNCEMENT.hop(label));
        return true;
      }

      // Shows a feeling from `at` for `lasting` seconds (by default for as long as it is held, or for its
      // reaction alone when held is false): its reaction first, unless react is false, and its mark
      // unless mark is false. It replaces the feeling before. A friend that shows no feelings is left as
      // it is, and feel() returns false.
      function feel(name, { at = clock, lasting, react = true, held = true, mark = true, mirror = false, fade = FEEL_FADE } = {}) {
        if (!fits) return false;
        calm(at);
        let clip = react && held ? E.feel(name, { spec }) : react ? E.react(name, { spec }) : E.hold(name, { spec });
        if (mirror) clip = mirrored(clip);
        const until = at + (lasting ?? (held ? Infinity : clip.duration));
        feeling = feelingOf(name, layers.add(clip, { at, until, fade }), until);
        const shown = mark ? E.mark(name) : null;
        if (shown && shown.every) feeling.repeat = { text: shown.text, every: shown.every, next: at };
        else if (shown) showMark(shown.text, { at });
        return true;
      }

      function feelingOf(name, layer, until) {
        return { name, layer, until, repeat: null, curious: false };
      }

      // Lets the feeling wear off from t. The marks a repeating feeling left (the z of sleep) fade out
      // with it, so that none lingers over what comes next.
      function calm(t = clock) {
        if (!feeling) return;
        layers.release(feeling.layer, t);
        if (feeling.repeat) for (const mark of marks) if (mark.drifting) mark.until = Math.min(mark.until, t + E.MARK.fade);
        feeling = null;
      }

      // Smiles (E.smile) from `at` for `lasting` seconds, as a friend landing after the gallery's roll
      // call does.
      function smile({ at = clock, lasting }) {
        layers.add(A.still(E.smile(spec)), { at, until: at + lasting, fade: 0 });
      }

      function reacting(t) {
        return !!record.reaction && t < record.reaction.until;
      }

      // Wakes the friend with a start at time t.
      function wakeAt(t) {
        pendingWake = t;
        record.reaction = { at: t, until: t + E.react('surprised').duration, watchedUntil: t };  // Nobody glances at it.
      }

      function stroke(x, timeStamp, detector = strokes) {
        if (detector.move(x, timeStamp / 1000)) strokeNow();
      }

      function strokeNow() {
        if (reacting(clock)) return;
        if (stroking) {
          stroking.last = clock;
          return;
        }
        stroking = { last: clock };
        if (feel('content')) o.announce(E.describe('content', label));
      }

      // A finger held still for STROKE.press seconds: the friend is stroked until it lifts.
      function holdPress() {
        press.held = true;
        strokeNow();
        hurry();
      }

      // The finger lifts, at timeStamp (ms). The stroking lingers from here, and a press that was held
      // is kept, lifted, so that the click that may follow is not taken for a hi. Returns the press.
      function releasePress(timeStamp) {
        if (!press || !press.down) return press;
        clearTimeout(press.timer);
        press.down = false;
        press.liftedAt = timeStamp;
        if (press.held && stroking) stroking.last = clock;
        if (!press.held) press = null;
        return press;
      }

      // Starts and ends what depends on the time: a start from sleep, a stroke that has stopped, a
      // curiosity, a feeling that has run its course, and a mark that repeats.
      function update(t) {
        if (pendingWake !== null && t >= pendingWake) {
          feel('surprised', { at: pendingWake, held: false });
          pendingWake = null;
        }
        if (feeling && t >= feeling.until) feeling = null;
        if (stroking && press && press.held && press.down) stroking.last = t;  // The finger is still on it.
        if (stroking && t - stroking.last > STROKE.linger) {
          if (feeling && feeling.name === 'content') calm(t);
          stroking = null;
          attendedSince = t;  // Curiosity starts afresh once the stroking stops.
        }
        if (!hovered && !focused) {
          attendedSince = null;
          if (feeling && feeling.curious) calm(t);
        } else {
          attendedSince ??= t;
          const free = !feeling && !stroking && !reacting(t) && !o.feel;
          if (free && t - attendedSince >= CURIOUS.after && feel('curious', { react: false, mark: false, fade: CURIOUS.fade })) feeling.curious = true;
        }
        const repeat = feeling && feeling.repeat;
        while (repeat && repeat.next <= t && repeat.next < feeling.until) {
          showMark(repeat.text, { at: repeat.next, drifting: true });
          repeat.next += repeat.every;
        }
        layers.prune(t);
      }

      // The pose for this frame: the idle motion with its glances, the feelings and any greeting, then
      // the gaze, the perk and any travel. Under reduced motion only the eyes move and only the face
      // changes; with a simulated pointer the idle motion stops, so that a screenshot comes out the same
      // every time.
      function pose(t, { target, eyes: own, travel, reduced, moving, gazeEase, perkEase }) {
        const absorbed = !!record.reaction && record.reaction.absorbed && reacting(t);  // In its routine.
        const inward = (!!feeling && INWARD.includes(feeling.name) && t >= feeling.layer.at) || absorbed;
        const [toX, toY] = travel ? [travel.dir * TRAVEL.look, 0] : target && !inward ? gazeToward(own, target) : [0, 0];
        lookX += (toX - lookX) * gazeEase;
        lookY += (toY - lookY) * gazeEase;
        glance += ((target || inward || travel ? 0 : 1) - glance) * gazeEase;
        perk += (((hovered || focused) && !reduced ? 1 : 0) - perk) * perkEase;
        const acc = { stance };  // The stance it was added in, which a clip may change for a while.
        if (moving) {
          const idlePose = idle(t + phase), glances = {};
          for (const key of GLANCES) {
            if (key in idlePose) { glances[key] = idlePose[key]; delete idlePose[key]; }
          }
          A.combine(acc, idlePose);
          A.combine(acc, glances, glance);
        }
        A.combine(acc, layers.sample(t, { reduced }));
        const turn = reduced ? 0 : HEAD_TURN;
        A.combine(acc, {
          lookX, lookY, turnX: lookX * turn + (travel ? travel.dir * TRAVEL.turn : 0), turnY: lookY * turn,
          earL: -PERK.earDegrees * perk, earR: -PERK.earDegrees * perk, widen: PERK.widen * perk,
          squash: travel ? travel.squash : 0, tilt: travel ? travel.lean : 0,
        });
        rig.setPose(A.sample(acc), true);
      }

      // The on-screen position of the friend's eyes (the origin of head space), and its width.
      function eyes() {
        const rect = rig.svg.getBoundingClientRect();
        return { x: rect.left + rect.width * view.x / view.w, y: rect.top + rect.height * (view.y - lift()) / view.h, width: rect.width };
      }

      // How far the pose raises the friend's eyes above where they are while it sits, in head units.
      function lift() {
        return PF.riseOf(spec, rig.pose);
      }

      // Adds a mark to show from `at` for `lasting` seconds. It is a drawing, not words, so screen
      // readers skip it; what happened is announced in words.
      function showMark(text, { at, lasting = E.MARK.seconds, drifting = false }) {
        const node = document.createElement('span'), place = drifting ? MARK.drifting : MARK;
        node.className = 'pf-live-mark hand';
        node.textContent = text;
        node.setAttribute('aria-hidden', 'true');
        const unit = `100cqw / ${view.w}`;
        Object.assign(node.style, {
          left: `calc(${view.x + place.x} * ${unit})`, top: `calc(${view.y - lift() + place.y} * ${unit})`, fontSize: `calc(${MARK.size} * ${unit})`,
          display: 'none',
        });
        box.appendChild(node);
        marks.push({ node, at, until: at + lasting, drifting, unit });
      }

      function drawMarks(t, reduced) {
        for (let i = marks.length - 1; i >= 0; i--) {
          const mark = marks[i];
          if (t >= mark.until) {
            mark.node.remove();
            marks.splice(i, 1);
            continue;
          }
          const shown = t >= mark.at;
          mark.node.style.display = shown ? '' : 'none';
          if (!shown) continue;
          const look = E.markAt(t - mark.at, mark.until - t, { reduced, drifting: mark.drifting });
          mark.node.style.opacity = String(look.opacity);
          mark.node.style.transform = `translate(-50%, calc(-100% - ${look.rise} * ${mark.unit})) scale(${look.scale}) rotate(-2deg)`;
        }
      }
    }
  }

  // ------------------------------------------------------------ Helpers

  // The direction from a friend's eyes to the target, at full length unless the target is near the face.
  function gazeToward(eyes, target) {
    const dx = target.x - eyes.x, dy = target.y - eyes.y;
    const distance = Math.max(Math.hypot(dx, dy), eyes.width * SOFT_GAZE_RADIUS);
    return [dx / distance, dy / distance];
  }

  // Where an input event happened, in client px, or null for one with no place (a key, a scroll).
  function pointOf(event) {
    const touch = event.touches && event.touches[0];
    if (touch) return { x: touch.clientX, y: touch.clientY };
    return 'clientX' in event ? { x: event.clientX, y: event.clientY } : null;
  }

  // A clip seen in a mirror: looks, turns and tilts change sides, and so do the ears and eyes.
  function mirrored(clip) {
    return A.clip(t => {
      const pose = { ...clip(t) };
      for (const key of FIELDS_MIRRORED) if (typeof pose[key] === 'number') pose[key] = -pose[key];
      [pose.earL, pose.earR] = [pose.earR, pose.earL];
      [pose.eyeL, pose.eyeR] = [pose.eyeR, pose.eyeL];
      return pose;
    }, clip.duration, clip.loop);
  }

  // Tells a stroke from a pass: it counts the turns the pointer makes along x, each after at least
  // `distance` px one way, and reports a stroke while `reversals` of them fall within `within` seconds.
  // move(x, t) takes the pointer's x (px) at time t (s) and returns whether a stroke is under way.
  function strokeDetector({ reversals = STROKE.reversals, distance = STROKE.distance, within = STROKE.within } = {}) {
    let start = null, extreme = null, direction = 0, turns = [];
    return {
      move(x, t) {
        if (start === null) {
          start = extreme = x;
          return false;
        }
        if (direction === 0) {
          if (Math.abs(x - start) >= distance) { direction = Math.sign(x - start); extreme = x; }
        } else if ((x - extreme) * direction > 0) extreme = x;
        else if ((extreme - x) * direction >= distance) {
          turns.push(t);
          direction = -direction;
          extreme = x;
        }
        turns = turns.filter(turn => t - turn <= within);
        return turns.length >= reversals;
      },
      reset() {
        start = extreme = null;
        direction = 0;
        turns = [];
      },
    };
  }

  // When each of `count` friends grows sleepy and falls asleep, from `start`: one at a time, in a
  // seeded order, spread over DOZE.spread seconds, each asleep about DOZE.asleep seconds later.
  // Returns [{ sleepyAt, asleepAt }] in the friends' order.
  function dozeSchedule(count, start, { seed = DOZE.seed, spread = DOZE.spread, asleep = DOZE.asleep, jitter = DOZE.jitter } = {}) {
    const random = PF.rng(seed), order = [...Array(count).keys()];
    for (let i = count - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const times = new Array(count);
    order.forEach((index, turn) => {
      const sleepyAt = start + (count > 1 ? (spread * turn) / (count - 1) : 0);
      times[index] = { sleepyAt, asleepAt: sleepyAt + asleep + (random() * 2 - 1) * jitter };
    });
    return times;
  }

  // What a screen reader hears once everyone who shows feelings is asleep; anyone who does not (Claude)
  // stays up. Names are written as their owners write them.
  function dozeAnnouncement(asleep, awake = []) {
    if (asleep.length === 1 && !awake.length) return E.describe('asleep', asleep[0]);
    return `${awake.length ? `Everyone but ${listed(awake)}` : 'Everyone'} falls asleep.`;
  }

  // What a screen reader hears when the friends are woken; `of` is how many were dozing.
  function wakeAnnouncement(woken, of) {
    return woken.length === 1 && of === 1 ? `${woken[0]} wakes up.` : 'Everyone wakes up.';
  }

  function listed(names) {
    return names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
  }

  // The page's rules for a mark, added once.
  function addStyle() {
    if (typeof document === 'undefined' || document.getElementById('pf-live-style')) return;
    const style = document.createElement('style');
    style.id = 'pf-live-style';
    style.textContent = STYLE;
    document.head.appendChild(style);
  }

  const api = {
    stage, still, keepStill, strokeDetector, dozeSchedule, dozeAnnouncement, wakeAnnouncement, gazeToward, mirrored,
    SHY, STROKE, CURIOUS, DOZE, MARK,
  };
  PF.live = api;
  return api;
});
