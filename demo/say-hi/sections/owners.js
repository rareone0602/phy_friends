/*!
 * say hi, bars 45.4-52.2 (B'): two numbers make a mood, and the owners decide what their friends look
 * like.
 *
 * 45.4-49.1, a page of feelings: phy alone beside a penciled cross whose axes run from unpleasant to
 * pleasant and from drowsy to alert, every feeling of src/emotion.js a dot where it sits on them. A
 * cursor glides from dot to dot; the two numbers it stands for are written under the cross as the call
 * posture(valence, arousal), and phy's ears, lids, head and tail follow them all the way, since the
 * body's share of a feeling is computed from the two numbers. At each dot the face snaps into the feeling
 * and its mark shows: happy, curious, surprised, sad and content, each on a strong hit of the bar.
 *
 * 49.1-52.3, the owners' choices, a page each, cut on the downbeats: Fruit beside the two designs that
 * came before the one his owner chose, a tick and "his owner's pick" under his choice, and penciled
 * rings round the chest, which his owner had edged in dark red; WhiteDeer plain and in his sailor
 * suit, a tick and "his owner said yes" under the suit; and Terry, standing, under the seven penciled
 * sliders of the tuning page (tools/tune.html) whose numbers changed, each moving from the value before
 * to the one his owner chose by eye. The sliders drive the film's era of the standing template
 * (sections/intro.js): until they move, every friend in the film stands and sits on the numbers before;
 * from then on, on his owner's, which are the library's today.
 *
 * The designs not chosen are the specs kept in characters/<friend>/backup/, loaded under names of the
 * film's own, so that they never replace the friend's own spec.
 */
(function () {
  'use strict';

  const PF = window.PhyFriends;

  // ------------------------------------------------------------ The designs not chosen

  // Film-local names for the designs not chosen, and the backup each is kept in.
  const ALTERNATIVES = {
    'fruit~first-draft': 'characters/fruit/backup/first-draft.js',
    'fruit~reviewed': 'characters/fruit/backup/reviewed.js',
    'whitedeer~plain': 'characters/whitedeer/backup/plain.js',
  };
  const ROOT = '../../';                       // The repository, from demo/say-hi/.

  // Loads the backups now, while the page is read. Each file defines its friend under the friend's own
  // name, so while one of them runs, PhyFriends.define keeps the spec under its film-local name instead
  // and leaves the library's own untouched; every other definition goes through as before. Scripts added
  // in order run in order, so these run before the cast the core adds later, and are in by the time the
  // section is built. Returns the specs by film-local name, filled in as the files run.
  function loadAlternatives() {
    const kept = {}, define = PF.define;
    const byUrl = new Map(Object.entries(ALTERNATIVES).map(([local, path]) => [new URL(ROOT + path, document.baseURI).href, local]));
    let waiting = byUrl.size;
    const done = () => { if (--waiting === 0 && PF.define === intercept) PF.define = define; };
    // PhyFriends.define while the alternatives load: keeps a spec defined by one of their files under its
    // film-local name.
    function intercept(name, spec) {
      const script = document.currentScript, local = script && byUrl.get(script.src);
      if (!local) return define(name, spec);
      kept[local] = { name, ...spec };
      return kept[local];
    }
    PF.define = intercept;
    for (const url of byUrl.keys()) {
      const script = document.createElement('script');
      script.src = url;
      script.async = false;
      script.onload = done;
      script.onerror = () => { console.error(`say hi: owners: could not load ${url}`); done(); };
      document.head.appendChild(script);
    }
    return kept;
  }

  const alternatives = loadAlternatives();

  SayHi.section('owners', k => {
    const A = PF.anim, E = PF.emotion, BOX = PF.scene.BOX, RULE = k.RULE, BEAT = k.beats.BEAT;
    const VARIANTS = PF.pencil.settings.variants;
    const time = k.time;
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const lerp = (a, b, u) => a + (b - a) * u;
    const escapeHtml = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    // Works out fn under the standing template as the film has it at t (sections/intro.js).
    const intro = k.exportsOf('intro');
    const inTemplate = (t, fn) => (intro.template ? intro.template.under(t, fn) : fn());

    for (const local of Object.keys(ALTERNATIVES)) {
      if (!alternatives[local]) throw new Error(`say hi: owners: the design "${local}" (${ALTERNATIVES[local]}) did not load`);
    }

    // The camera that puts a world point (head units) at a point of the frame, at a zoom.
    const cameraPutting = (world, frame, zoom) => ({
      x: world.x - (frame.x - k.FRAME.width / 2) / zoom, y: world.y - (frame.y - k.FRAME.height / 2) / zoom, zoom,
    });

    // ========================================================== The feelings (45.4-49.1)

    const MOOD = {
      page: 'feelings', from: '45.4', to: '49.1',
      world: { width: 1920, height: 1080 },
      phy: { x: 22 * RULE, floor: 13 * RULE },   // Where page A has phy.
      zoom: 1.76, phyOnFrame: 1440,               // Where phy's middle lies across the frame.
      // The cross: its middle (left of phy, on a rule), the radius of its circle, and how far its axes
      // reach, in radii.
      chart: { dx: -440, y: 9 * RULE, radius: 180, reach: 1.12 },
      // The feelings the cursor stops at, each arriving on a strong hit (beat 1, the "and" of 2, beat 4).
      stops: [['happy', '46.1'], ['curious', '46.2.5'], ['surprised', '47.1'], ['sad', '47.4'], ['content', '48.2.5']],
      glide: 0.5,          // Seconds the cursor takes from one feeling to the next.
      snap: 0.08,          // Seconds the face takes to come on at a feeling (it snaps), and to go (release).
      release: 0.15,
      motionFade: 0.3,     // Seconds over which a feeling's reaction fades once the cursor moves on.
      drawn: 0.35,         // Seconds the cross takes to be drawn, from its middle out.
      readoutBelow: 56,        // Head units from the bottom of the cross to the call's baseline.
      // The shot opens on the stab with the cross already drawn and the cursor already on its way to the
      // first feeling: the cross is drawn, and the cursor sets off, this many seconds before the cut.
      before: 0.8, setOff: 0.25,
    };

    const T0 = time(MOOD.from), T1 = time(MOOD.to), DRAWN = T0 - MOOD.before;
    // The words' and the numbers' size, in head units: a label's, by the rule of speech, under the camera's zoom.
    const labelSize = face => (1.01 * k.ui.SPEECH.label) / k.ui.capOf(face) / MOOD.zoom;
    MOOD.text = labelSize('hand');
    MOOD.readout = labelSize('mono');
    const C = { x: MOOD.phy.x + MOOD.chart.dx, y: MOOD.chart.y }, R = MOOD.chart.radius, REACH = R * MOOD.chart.reach;
    const onChart = ({ valence, arousal }) => ({ x: C.x + valence * R, y: C.y - arousal * R });
    // A stand-in spec of a friend that shows no feelings, for which the emotion library gives a reaction's
    // movement alone, without its face or posture.
    const MOVEMENT_ONLY = { emotions: false };

    // Each stop: the feeling, where it sits, when the cursor sets off toward it (depart) and arrives (at),
    // when it leaves for the next (leave), and the reaction's movement.
    const stops = MOOD.stops.map(([name, cue]) => ({ name, at: time(cue), ...E.place(name), motion: E.react(name, { spec: MOVEMENT_ONLY }) }));
    stops.forEach((stop, i) => {
      const next = stops[i + 1];
      stop.leave = next ? next.at - MOOD.glide : T1;
      stop.from = i ? stops[i - 1] : { valence: 0, arousal: 0 };
      stop.depart = i ? stops[i - 1].leave : T0 - MOOD.setOff;
    });

    // The two numbers at t: where the cursor is, gliding from one feeling to the next.
    function cursorAt(t) {
      let at = { valence: 0, arousal: 0 };
      for (const stop of stops) {
        if (t < stop.depart) break;
        const u = A.ease.inOut(clamp((t - stop.depart) / (stop.at - stop.depart), 0, 1));
        at = { valence: lerp(stop.from.valence, stop.valence, u), arousal: lerp(stop.from.arousal, stop.arousal, u) };
      }
      return at;
    }

    // The feeling whose face shows at t, and how far: it snaps on as the cursor arrives and goes as it leaves.
    function faceAt(t) {
      for (const stop of stops) {
        if (t < stop.at || t >= stop.leave + MOOD.release) continue;
        const strength = t < stop.leave ? clamp((t - stop.at) / MOOD.snap, 0, 1) : 1 - clamp((t - stop.leave) / MOOD.release, 0, 1);
        return { stop, strength };
      }
      return null;
    }

    // phy's pose at t, as offsets over the idle: the posture the two numbers give, all the way; at a
    // feeling, its face, which holds that posture and adds its own; and each feeling's reaction as it
    // comes on, fading once the cursor moves on.
    function moodPose(t) {
      const { valence, arousal } = cursorAt(t), body = E.posture(valence, arousal), pose = {}, shown = faceAt(t);
      if (shown) {
        A.combine(pose, body, 1 - shown.strength);
        A.combine(pose, E.face(shown.stop.name), shown.strength);
      } else A.combine(pose, body);
      for (const stop of stops) {
        if (t < stop.at) continue;
        const weight = 1 - clamp((t - stop.leave) / MOOD.motionFade, 0, 1);
        if (weight > 0) A.combine(pose, stop.motion(t - stop.at), weight);
      }
      return pose;
    }

    k.definePage(MOOD.page, {
      world: MOOD.world, ground: MOOD.phy.floor, margin: false,
      places: { phy: { x: MOOD.phy.x, y: MOOD.phy.floor } }, describe: 'phy alone beside the feelings',
    });
    const moodPage = k.page(MOOD.page);
    k.shot(MOOD.page, MOOD.from, MOOD.to);
    // Framed by the film's rule: from the top of the cross to the call under it.
    k.camera(MOOD.page, k.frame(MOOD.page, {
      top: C.y - REACH - 8, bottom: C.y + REACH + MOOD.readoutBelow + 0.25 * MOOD.readout, zoom: MOOD.zoom, x: MOOD.phy.x - (MOOD.phyOnFrame - k.FRAME.width / 2) / MOOD.zoom,
    }), { at: 0 });

    k.cue(MOOD.page, (scene, cast) => {
      cast.phy.play(A.clip(local => moodPose(T0 + local)), { at: T0, fade: 0 });
      for (const stop of stops) {
        const mark = E.mark(stop.name);
        if (mark) cast.phy.emote(mark.text, { at: stop.at, seconds: stop.leave + MOOD.release - stop.at });
      }
    });

    // The cross: two axes drawn from the middle out, a faint circle, and a dot for every feeling, popping
    // up in turn round the circle, from pleasant toward alert.
    const around = ({ valence, arousal }) => (Math.atan2(arousal, valence) + 2 * Math.PI) % (2 * Math.PI);
    const feelingDots = E.names.map(name => ({ name, ...onChart(E.place(name)), angle: around(E.place(name)) }));
    feelingDots.slice().sort((a, b) => a.angle - b.angle).forEach((dot, i, all) => { dot.appear = 0.12 + (0.3 * i) / all.length; });

    // The chart as markup, made once: the axes, the circle and a dot for every feeling.
    function chartMarkup() {
      const random = PF.rng(45), wobble = () => (random() - 0.5) * 2.4;
      const half = (dx, dy) => `<path data-draw="axis" pathLength="1" d="M${C.x} ${C.y}Q${C.x + dx / 2 + wobble()} ${C.y + dy / 2 + wobble()} ${C.x + dx} ${C.y + dy}"/>`;
      const circle = Array.from({ length: 49 }, (_, i) => {
        const a = (i / 48) * 2 * Math.PI - 0.3, r = R + Math.sin(a * 3 + 1) * 1.6;
        return `${i ? 'L' : 'M'}${(C.x + r * Math.cos(a)).toFixed(1)} ${(C.y - r * Math.sin(a)).toFixed(1)}`;
      }).join('');
      return '<svg class="graphite" width="1" height="1" style="position:absolute;left:0;top:0;overflow:visible">' +
        `<path data-draw="circle" pathLength="1" d="${circle}" fill="none" style="stroke:var(--ink-3)" stroke-opacity=".55" stroke-width="1.3" stroke-linecap="round"/>` +
        `<g fill="none" style="stroke:var(--ink)" stroke-width="1.7" stroke-linecap="round">${half(REACH, 0)}${half(-REACH, 0)}${half(0, -REACH)}${half(0, REACH)}</g>` +
        `<g style="fill:var(--ink)">${feelingDots.map(d => `<circle data-appear="${d.appear}" cx="${d.x.toFixed(1)}" cy="${d.y.toFixed(1)}" r="0"/>`).join('')}</g></svg>`;
    }

    k.draw(moodPage.under, MOOD.from, MOOD.to, (el, t) => {
      if (!el.firstChild) el.innerHTML = chartMarkup();
      const local = t - DRAWN;
      for (const path of el.querySelectorAll('[data-draw]')) {
        const seconds = path.dataset.draw === 'circle' ? 0.6 : MOOD.drawn;
        path.setAttribute('stroke-dasharray', `${A.ease.out(clamp(local / seconds, 0, 1))} 1`);
      }
      for (const dot of el.querySelectorAll('[data-appear]')) {
        const u = clamp((local - Number(dot.dataset.appear)) / 0.14, 0, 1);
        dot.setAttribute('r', String(u > 0 ? 3.3 * (0.6 + 0.4 * A.ease.back(u)) : 0));
      }
    });

    // The axes' ends, in phy's hand, already written as the shot opens: pleasant and unpleasant over the
    // horizontal axis, alert and drowsy beside the vertical one.
    const axisWords = { at: MOOD.from, until: MOOD.to, size: MOOD.text, rotate: -1, graphite: true, mustRead: true };
    k.ui.label(moodPage.under, 'pleasant', { ...axisWords, x: C.x + REACH, y: C.y - 12, align: 'right' });
    k.ui.label(moodPage.under, 'unpleasant', { ...axisWords, x: C.x - REACH, y: C.y - 12 });
    k.ui.label(moodPage.under, 'alert', { ...axisWords, x: C.x - 12, y: C.y - REACH + 20, align: 'right' });
    k.ui.label(moodPage.under, 'drowsy', { ...axisWords, x: C.x - 12, y: C.y + REACH, align: 'right' });

    // Each feeling's name, written by its dot as the cursor arrives, fading once it moves on: right of
    // the dot, or left of it for a feeling on the unpleasant side, so that it stays inside the cross.
    k.draw(moodPage.under, MOOD.from, MOOD.to, (el, t) => {
      if (!el.firstChild) {
        el.innerHTML = stops.map(stop => `<p class="sh-hand hand graphite" style="font-size:${MOOD.text}px;text-shadow:0 0 4px var(--paper),0 0 2px var(--paper)">` +
          `${escapeHtml(k.ensureShowable(stop.name))}</p>`).join('');
      }
      stops.forEach((stop, i) => {
        const p = el.children[i], dot = onChart(stop), left = stop.valence < -0.3;
        const written = clamp((t - stop.at + 0.04) / 0.2, 0, 1);
        p.style.display = written > 0 ? '' : 'none';
        if (!written) return;
        p.style.transform = `translate(${dot.x + (left ? -14 : 14)}px, ${dot.y + 9}px) rotate(-1deg) translate(${left ? '-100%' : '0'}, -0.85em)`;
        p.style.clipPath = `inset(-40% ${(1 - written) * 100}% -40% -12%)`;
        p.style.opacity = String(1 - 0.6 * clamp((t - stop.leave) / 0.3, 0, 1));
      });
    });

    // The cursor: a penciled ring that glides from feeling to feeling, a faint trail behind it, and a
    // little pulse as it lands.
    const TRAIL_STEP = 1 / 30;
    k.draw(moodPage.under, MOOD.from, MOOD.to, (el, t) => {
      if (!el.firstChild) {
        el.innerHTML = '<svg class="graphite" width="1" height="1" style="position:absolute;left:0;top:0;overflow:visible">' +
          '<path class="trail" fill="none" style="stroke:var(--ink-2)" stroke-opacity=".5" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
          '<circle class="ring" r="10" fill="none" style="stroke:var(--ink)" stroke-width="2.6"/>' +
          '<circle class="pip" r="2" style="fill:var(--ink)"/></svg>';
      }
      const start = stops[0].depart, points = [];
      for (let s = start; s < t; s += TRAIL_STEP) points.push(onChart(cursorAt(s)));
      const here = onChart(cursorAt(t));
      points.push(here);
      const svg = el.firstChild;
      svg.querySelector('.trail').setAttribute('d', points.length > 1 ? `M${points.map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('L')}` : '');
      const landed = stops.reduce((m, stop) => (t >= stop.at && t < stop.at + 0.3 ? Math.max(m, 1 - (t - stop.at) / 0.3) : m), 0);
      const shows = clamp((t - (DRAWN + 0.05)) / 0.12, 0, 1);
      for (const node of svg.querySelectorAll('.ring, .pip')) {
        node.setAttribute('cx', here.x.toFixed(1));
        node.setAttribute('cy', here.y.toFixed(1));
        node.setAttribute('opacity', String(shows));
      }
      svg.querySelector('.ring').setAttribute('r', String(10 + 6 * Math.sin(Math.PI * landed)));
    });

    // The two numbers, as the call that turns them into a body: posture(valence, arousal).
    const fixed = v => (Math.abs(v) < 0.005 ? 0 : v).toFixed(2);
    k.draw(moodPage.under, MOOD.from, MOOD.to, (el, t) => {
      if (!el.firstChild) el.innerHTML = `<p class="sh-label mono" style="font-size:${MOOD.readout}px"></p>`;
      const p = el.firstChild, { valence, arousal } = cursorAt(t), text = `posture(${fixed(valence)}, ${fixed(arousal)})`;
      if (p.textContent !== text) p.textContent = text;
      p.style.transform = `translate(${C.x - REACH}px, ${C.y + REACH + MOOD.readoutBelow}px) translate(0, -0.85em)`;
      p.style.opacity = String(clamp((t - DRAWN - 0.1) / 0.15, 0, 1));
    });

    // ========================================================== The owners' choices (49.1-51.1)

    const CHOICE = {
      world: { width: 1920, height: 1080 }, floor: 13 * RULE,
      tick: 96,                          // Frame pixels: the tick's size.
      captionBelow: 100, noteBelow: 222, // Frame pixels from the floor to the captions' and the note's baselines.
      ring: 140,                         // Frame pixels: a penciled ring's size.
    };
    // The owners' part is the film's claim that the owners decide, so its words are larger than the least a
    // label may be, to read at a phone's width: the cap height, in frame pixels, of each design's caption,
    // of the note under the owner's choice (here and on the tuning page), and of the sliders' labels.
    const WORDS = { caption: 52, note: 60, slider: 44 };
    // The font size in a layer's units that gives words a cap height of `cap` frame pixels under the camera at t.
    const sizeAt = (cap, layer, t) => (k.ui.sizeFor('label', layer, t) * cap) / k.ui.SPEECH.label;
    // Each friend's page: the friend, the designs not chosen before it (film-local name and caption),
    // how far apart they sit, the camera's zoom, and how far the tallest design reaches above its floor,
    // seated (head units, measured on the frame: ear or antler tips), and how far right of the middle the
    // camera looks (a tail on one side). The tick and the note land as the
    // shot opens, the note written quickly, so that it is held whole for as long as a viewer needs to
    // read it before the cut. The note says what the record says: Fruit's owner picked his design from
    // the three (1659e45), WhiteDeer's owner approved the suit (3296f2d). Where the designs differ in
    // little, penciled rings, one a sixteenth after the other, circle the same part on each, where one
    // has it and another has not (rings: the part's middle from the head's origin, in head units).
    const CHOICES = [
      { page: 'choice-fruit', friend: 'fruit', from: '49.1', to: '50.1', apart: 320, zoom: 1.85, reach: 314, shift: 20, note: 'his owner\u2019s pick',
        others: [['fruit~first-draft', 'first draft'], ['fruit~reviewed', 'after review']],
        // The chest, which his owner asked to have edged in dark red (fruit.js): plain on the first draft and
        // after the review, edged on his pick.
        rings: { from: '49.2', at: [0, 68], step: 0.25 } },
      { page: 'choice-whitedeer', friend: 'whitedeer', from: '50.1', to: '51.1', apart: 330, zoom: 2.1, reach: 326, note: 'his owner said yes',
        others: [['whitedeer~plain', 'plain']] },
    ];
    const NOTE = { delay: 0.05, seconds: 0.24, tickGrow: 0.12 };

    for (const choice of CHOICES) {
      const n = choice.others.length + 1, middle = CHOICE.world.width / 2, Z = choice.zoom;
      const xs = Array.from({ length: n }, (_, i) => middle + (i - (n - 1) / 2) * choice.apart);
      const chosen = { x: xs[n - 1], y: CHOICE.floor };
      k.definePage(choice.page, {
        world: CHOICE.world, ground: CHOICE.floor, margin: false,
        places: { [choice.friend]: chosen }, describe: `${choice.friend}'s owner's choice`,
      });
      const page = k.page(choice.page);
      k.shot(choice.page, choice.from, choice.to);
      // Framed by the film's rule: from the tallest of the designs to the note under the chosen one.
      const camera = k.frame(choice.page, { top: CHOICE.floor - choice.reach, bottom: CHOICE.floor + (CHOICE.noteBelow + 0.3 * WORDS.note / k.ui.capOf('hand')) / Z, x: middle + (choice.shift || 0), zoom: Z });
      k.camera(choice.page, camera, { at: 0 });
      choice.others.forEach(([local, caption], i) => {
        standIn(page, local, asTheFriendIsDrawn(alternatives[local], choice.friend), { x: xs[i], y: CHOICE.floor, phase: 1.7 * (i + 1), from: choice.from, to: choice.to });
        k.ui.label(page.under, caption, { x: xs[i], y: CHOICE.floor + CHOICE.captionBelow / Z, size: sizeAt(WORDS.caption, page.under, time(choice.from)),
          tone: 'ink-2', align: 'center', at: choice.from, until: choice.to, graphite: true, rotate: -1, mustRead: true });
      });
      // The tick under the friend as his owner chose him, and the words under it, as the shot opens.
      const opens = time(choice.from);
      k.ui.mark(page.under, 'tick', { x: chosen.x, y: CHOICE.floor + 66 / Z, w: CHOICE.tick / Z, h: CHOICE.tick / Z, at: opens, until: choice.to, grow: NOTE.tickGrow });
      k.ui.hand(page.under, choice.note, {
        kind: 'label', x: chosen.x, y: CHOICE.floor + CHOICE.noteBelow / Z, size: sizeAt(WORDS.note, page.under, opens), align: 'center',
        at: opens + NOTE.delay, seconds: NOTE.seconds, until: choice.to,
      });
      // As the tick lands, the friend hops for joy.
      k.cue(choice.page, (scene, cast) => { cast[choice.friend].feel('happy', { at: opens + 0.05 }); });
      // The rings, one on each design in turn, at the same part of each.
      if (choice.rings) {
        xs.forEach((x, i) => {
          const head = { x, y: CHOICE.floor - inTemplate(time(choice.from), () => PF.groundOf(choice.friend)) };
          k.ui.mark(page.over, 'ring', {
            x: head.x + choice.rings.at[0], y: head.y + choice.rings.at[1], w: CHOICE.ring / Z, h: (0.86 * CHOICE.ring) / Z,
            at: time(choice.rings.from) + i * choice.rings.step * BEAT, until: choice.to, grow: 0.14, rotate: -6,
          });
        });
      }
    }

    // A design not chosen, drawn as it stands in its spec but with the body that the friend's own spec
    // gives today (the rice ball came after the owner chose), so that only the owner's choices differ.
    function asTheFriendIsDrawn(spec, friend) {
      const own = PF.get(friend).body || {};
      return own.onigiri && !(spec.body || {}).onigiri ? PF.merge(spec, { body: { onigiri: own.onigiri } }) : spec;
    }

    // Draws a design not chosen beside the friend, as a scene draws its friends: seated on its floor, on its
    // own idle (breathing, blinking), looking at the viewer, its pencil boiling with the film's. A copy of
    // its spec is made for each set of the era's values, so that no figure the library caches outlives them.
    function standIn(page, local, spec, { x, y, phase, from, to }) {
      const idle = A.idleOf(local), copies = new Map();
      let rig = null, mountedFor = null;
      k.draw(page.over, from, to, (el, t) => {
        const key = JSON.stringify(k.era.values(t));
        if (mountedFor !== key) {
          if (!copies.has(key)) copies.set(key, { ...spec });
          const copy = copies.get(key);
          el.innerHTML = '<div class="pf-actor"></div>';
          el.firstChild.style.transform = `translate(${x - BOX / 2}px, ${y - BOX}px)`;
          rig = PF.mount(el.firstChild, copy, { bg: false, view: { w: BOX, h: BOX, x: BOX / 2, y: BOX - PF.groundOf(copy), scale: 1, rotate: 0 }, bitmap: false });
          mountedFor = key;
        }
        const pose = { stance: 'sit' };
        A.addIdle(pose, idle, t + phase, 0);
        rig.setPose(A.sample(pose), true);
        rig.setTexture(Math.floor(t * k.BOIL + 1e-9) % VARIANTS);
      });
    }

    // ========================================================== Terry's proportions (51.1-52.3)

    const TUNING = {
      page: 'tuning', friend: 'terry', from: '51.1', to: '52.3', content: '52.1',
      world: { width: 1920, height: 1080 }, floor: 13 * RULE, x: 800,
      zoom: 2.1, onFrame: { x: 390, y: 940 },   // Terry's middle and floor on the frame.
      // The sliders, as the tuning page (tools/tune.html) has them, in its order: the era entry of the
      // standing template that each sets (sections/intro.js, named where the library keeps the number), its
      // label there, its range, and when it moves, an eighth apart. Each moves from the value before (the
      // earlier pick on that page, of 1 October; the square the rice ball came with) to the library's own,
      // the one Terry's owner chose by eye, and from then on every friend that stands is drawn on it.
      sliders: [
        { name: 'BODY.height', label: 'taller body', min: 0.7, max: 1.6, digits: 2, at: '51.1' },
        { name: 'ONIGIRI.square', label: 'flatter at the base', min: 0, max: 4, digits: 1, at: '51.1.5' },
        { name: 'STAND_FIT.legs', label: 'leg length', min: 8, max: 50, digits: 0, at: '51.2' },
        { name: 'STAND_DEFAULT.legs.width', label: 'leg thickness', min: 16, max: 38, digits: 0, at: '51.2.5' },
        { name: 'STAND_DEFAULT.legs.foot.ry', label: 'foot height', min: 6, max: 18, digits: 1, at: '51.3' },
        { name: 'STAND_FIT.hip', label: 'legs apart', min: 0.2, max: 0.6, digits: 2, at: '51.3.5' },
        { name: 'STAND_DEFAULT.arms.length', label: 'arm length', min: 18, max: 60, digits: 0, at: '51.4' },
      ],
      move: BEAT,          // How long a knob takes to find its value: the last settles as Terry is content.
      // The sliders' column, in frame pixels: where the labels end (right-aligned), the track's left
      // edge and length, the numbers' size, the frame's y of the first track, and how far past the
      // track's end the note ends. Each track lies on a rule, one under the other, its label before it
      // and its number after it.
      column: { labels: 1085, x: 1120, track: 420, value: 56, top: 105, note: 200 },
      note: { text: 'his owner tuned these by eye', at: '51.1.5', seconds: 0.62 },
      mark: { dx: -112, dy: -150 },   // Where Terry's mark sits from his eyes, in head units: on his free side, nearer than a scene's.
    };
    const tuningEnd = time(TUNING.to);

    // A knob does not go straight to its value: it overshoots, comes back a little short and settles, as
    // a hand finds a value by eye. The template's era follows the knobs (k.era.curve), so that every
    // friend drawn at t, here or on any other page, stands on the numbers the sliders show.
    const finding = A.track({ u: [[0, 0], [0.45, 1.16, 'inOut'], [0.75, 0.96], [1, 1]] });
    const template = new Map((intro.template || { entries: [] }).entries.map(entry => [entry.name, entry]));
    for (const slider of TUNING.sliders) {
      const entry = template.get(slider.name);
      if (!entry) throw new Error(`say hi: owners: the template's era has no ${slider.name} (sections/intro.js)`);
      slider.start = time(slider.at);
      slider.curve = t => clamp(lerp(entry.beforeAt(t), entry.after, finding(clamp((t - slider.start) / TUNING.move, 0, 1)).u), slider.min, slider.max);
      k.era.curve(slider.name, slider.curve);
      // The value the knob shows at t: the era's, as every friend is drawn on it.
      slider.value = t => k.era.values(t)[slider.name];
    }

    k.definePage(TUNING.page, {
      world: TUNING.world, ground: TUNING.floor, margin: false,
      places: { [TUNING.friend]: { x: TUNING.x, y: TUNING.floor, stance: 'stand' } }, describe: 'Terry under the sliders',
    });
    const tuningPage = k.page(TUNING.page);
    const tuningCamera = cameraPutting({ x: TUNING.x, y: TUNING.floor }, TUNING.onFrame, TUNING.zoom);
    k.shot(TUNING.page, TUNING.from, TUNING.to);
    k.camera(TUNING.page, tuningCamera, { at: 0 });
    // Once the last knob has settled, Terry is content; his mark is drawn below.
    k.cue(TUNING.page, (scene, cast) => { cast[TUNING.friend].feel('content', { at: time(TUNING.content), until: tuningEnd, mark: false }); });

    // The column, laid out in frame pixels and drawn on the paper in head units, each track on a rule.
    const Z = TUNING.zoom, col = TUNING.column;
    const worldX = x => tuningCamera.x + (x - k.FRAME.width / 2) / Z, worldY = y => tuningCamera.y + (y - k.FRAME.height / 2) / Z;
    const firstRule = Math.round(worldY(col.top) / RULE) * RULE;
    const trackY = i => firstRule + i * RULE, left = worldX(col.x), track = col.track / Z;
    TUNING.sliders.forEach((slider, i) => {
      k.ui.label(tuningPage.under, slider.label, { x: worldX(col.labels), y: trackY(i) + 6, size: sizeAt(WORDS.slider, tuningPage.under, time(TUNING.from)),
        align: 'right', at: TUNING.from, until: TUNING.to, graphite: true, rotate: -1, mustRead: true });
    });

    // The tracks and knobs: a penciled line on a rule with a small stop at each end, and a pill for a
    // knob, as wide as phy's caret; the number beside it in the code's face.
    k.draw(tuningPage.under, TUNING.from, TUNING.to, (el, t) => {
      if (!el.firstChild) {
        const random = PF.rng(51), lines = TUNING.sliders.map((slider, i) => {
          const y = trackY(i), bow = (random() - 0.5) * 2;
          return `<path d="M${left} ${y}Q${left + track / 2} ${y + bow} ${left + track} ${y}M${left} ${y - 6}V${y + 6}M${left + track} ${y - 6}V${y + 6}"/>`;
        });
        el.innerHTML = '<svg class="graphite" width="1" height="1" style="position:absolute;left:0;top:0;overflow:visible">' +
          `<g fill="none" style="stroke:var(--ink-2)" stroke-width="1.8" stroke-linecap="round">${lines.join('')}</g>` +
          `<g style="fill:var(--ink)">${TUNING.sliders.map(() => '<rect width="10" height="23" rx="5"/>').join('')}</g></svg>` +
          TUNING.sliders.map(() => `<p class="sh-label mono" style="font-size:${col.value / Z}px"></p>`).join('');
      }
      const knobs = el.firstChild.querySelectorAll('rect'), numbers = el.querySelectorAll('p');
      TUNING.sliders.forEach((slider, i) => {
        const v = slider.value(t), u = (v - slider.min) / (slider.max - slider.min), y = trackY(i);
        knobs[i].setAttribute('x', String(left + u * track - 5));
        knobs[i].setAttribute('y', String(y - 11.5));
        const text = v.toFixed(slider.digits);
        if (numbers[i].textContent !== text) numbers[i].textContent = text;
        numbers[i].style.transform = `translate(${left + track + 20}px, ${y + 8}px) translate(0, -0.85em)`;
      });
    });

    // The note, on the rule under the last slider, ending under the numbers' right edge.
    k.ui.hand(tuningPage.under, TUNING.note.text, {
      kind: 'label', x: worldX(col.x + col.track + col.note), y: trackY(TUNING.sliders.length) + 10, size: sizeAt(WORDS.note, tuningPage.under, time(TUNING.note.at)),
      align: 'right', at: TUNING.note.at, seconds: TUNING.note.seconds, until: TUNING.to,
    });

    // Terry's mark as he becomes content: the content feeling's own mark, popping up as a scene's does
    // (the emotion library's timing), but nearer his head than a scene puts it, so that the close-up
    // keeps it in the frame.
    const contentAt = time(TUNING.content);
    k.draw(tuningPage.over, TUNING.content, TUNING.to, (el, t) => {
      if (!el.firstChild) {
        el.innerHTML = `<p class="sh-hand hand" style="font-size:${PF.scene.MARK.size}px;font-weight:600;color:var(--ink-2);transform-origin:50% 100%">` +
          `${E.markMarkup(E.mark('content').text)}</p>`;
      }
      const built = tuningPage.sceneAt(t), eyes = built.cast[TUNING.friend].eyesAt(t);
      const look = E.markAt(t - contentAt, tuningEnd + 1 - t);
      const p = el.firstChild;
      p.style.opacity = String(look.opacity);
      p.style.transform = `translate(${eyes.x + TUNING.mark.dx}px, ${eyes.y + TUNING.mark.dy}px) translate(-50%, -100%) scale(${look.scale}) rotate(-2deg)`;
    });
  });
})();
