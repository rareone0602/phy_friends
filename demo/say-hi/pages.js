/*!
 * say hi: the pages every section shares.
 *
 *   A  phy's page: phy alone, close, sitting on a rule. Its rules can become the lines of
 *      characters/phy/phy.js (the crash at bar 21).
 *   B  the gallery: the film's cast in two rows on floors seven rules apart, in the gallery's order,
 *      Claude at its laptop at the end of the second row, then an empty place on the ground line: the
 *      viewer's. Neighbors are spaced for every facing (the friends turn later, together, and from
 *      behind a tail changes sides) with the stranger gap between outlines, which the scene kit checks
 *      on every frame. Claude waits out of sight on page A too, for bar 33.
 *   C  a blank page, for the second browser window of the finale.
 *
 * Every page starts hidden; a section shows it with a shot. Loads after core.js (SayHi.pages).
 */
(function (root) {
  'use strict';

  const PF = root.PhyFriends, A = PF.anim;
  const RULE = PF.scene.RULE, BOX = PF.scene.BOX;

  // Page A: the frame at one head unit a pixel, with phy sitting a little right of the middle on the
  // thirteenth rule, and a margin line for the numbers of the source's lines.
  const PAGE_A = { world: { width: 1920, height: 1080 }, phy: { x: 22 * RULE, floor: 13 * RULE }, margin: 3 * RULE };

  // Page B: two rows. Row 1 holds eight friends, one for each beat of the two bars in which it is called
  // (13-14), and row 2 the rest, one a beat over bars 15 and 16, Claude last; then the empty place.
  // The floors lie seven rules apart, the first on the last rule above the page's middle, so that the
  // rows and the bands round them lie in the middle of the page, with paper to spare on every side for
  // a camera that pans.
  const ROWS = { first: 8, apart: 7, margin: 2 * RULE };
  // The bands of page B shown whole, in rules from the floors: the rule `above` rules over row 1's
  // floor, clear of the tallest friend standing, under the title; and the band for words under the
  // rows (phy's lines, Claude's numbers, the test run, the address), from the rule `below` rules under
  // row 2's floor, its second line `next` rules under that.
  const BANDS = { above: 8, below: 4, next: 4 };
  // Page B's composition (DECISIONS.md, the frame rule; BUILD/FIXES.md and FIXES2.md). The gallery's
  // title, "phy's fwiends", heads the rows: it sits TITLE.above rule over the band rule above row 1 (nine
  // rules over row 1's floor, about its own capitals' height above the tallest ears), left-aligned with
  // row 1, its capitals TITLE.cap frame pixels tall at zoom 1. (The finale's leaps, which would reach
  // its descenders, are shot without it: sections/gallery.js.) The
  // band under the rows is the one place for words: phy's lines from its left (row 1's left edge, under
  // the title's), on the rule `below` rules under row 2 and, for a second line, the rule `next` rules
  // under that; Claude's typed numbers end at its right, clear of the empty place's label. Words in the
  // band are as large as the rule of speech asks (components.js, SPEECH), whose cap heights and the
  // hand's descender (DESCENDER, a share of the size) set how far the wides reach.
  const TITLE = { text: "phy's fwiends", cap: 64, above: 1 };
  const DESCENDER = 0.26;
  // The wides keep this many frame pixels between the rows' outermost reaches and the frame's sides: the
  // rows fill the frame's width but for them, which sets the wides' zoom.
  const SIDES = 34;
  const OUTLINE_PARTS = ['base', 'face', 'hair', 'body', 'tail'];   // As film/scene.js measures an outline.
  const FACINGS = [0, 90, 180, 270];
  const STANCES = ['sit', 'stand'];
  // The empty place, the viewer's: a place as wide as a friend's (its reach either side is the mean of
  // the house friends'), with a patch of ground of its own after Claude's laptop and its label, "you?",
  // under its middle on the rule `rules` rules under the floor (clear of the ground line), its capitals
  // `cap` frame pixels tall when the page is shown whole, as large as a label phy presses hard.
  const EMPTY = { cap: 60, rules: 2 };
  // Claude, at its laptop: the moment of its routine (characters/claude/claude.js) at which it sits
  // side-on at the open laptop, and the stretch of the routine that types, looped.
  const TYPING = { sit: 1.4, from: 1.48, to: 2.52 };
  const GROUND = { inset: 6, wobble: 1.6, step: 50, seed: 5 };      // As the gallery draws a friend's ground (index.html).

  // Defines pages A, B and C and publishes their layouts as SayHi.layout, before any module is built.
  function pages(core) {
    const { definePage, filmCast } = core;
    const cast = filmCast();
    definePage('A', {
      world: PAGE_A.world, ground: PAGE_A.phy.floor, margin: PAGE_A.margin,
      places: { phy: { x: PAGE_A.phy.x, y: PAGE_A.phy.floor }, ...hiddenClaude(cast) },
      describe: 'phy alone, close',
    });
    const gallery = galleryLayout(core, cast);
    const pageB = definePage('B', {
      world: gallery.world, ground: gallery.floors[1], places: gallery.places, describe: 'the gallery',
    });
    // Head units a frame pixel at zoom 1, the page's width across the frame: words sized by it read as
    // large on screen however wide the cast makes the page (the wides, at wide.zoom, show them a few
    // hundredths larger).
    gallery.perPixel = 1 / pageB.fit;
    composeGallery(core, pageB, gallery);
    pageB.layout = gallery;
    drawGrounds(pageB, gallery);
    typeAtTheLaptop(pageB);
    definePage('C', { world: PAGE_A.world, describe: 'a second browser window' });
    root.SayHi.layout = { A: PAGE_A, B: gallery };
  }

  // Page B shown whole, by the film's rule, in three wides at the same zoom (`wide.zoom`: the rows fill
  // the frame's width but for SIDES pixels either side, a little closer than the page's own width),
  // which differ only in how far down they reach: `rows`, the title and the rows, from the title's
  // capitals to the empty place's label, with the same paper above and below, for when the band under
  // the rows is empty; `band[0]` and `band[1]`, the title, the rows and one or two lines of words in
  // the band. `whole` is `rows`. Adds the title's place, the band's and the empty place's label to the
  // layout.
  function composeGallery(core, page, layout) {
    const components = root.SayHi.components, cap = components ? components.capOf('hand') : 0.709;
    const speech = components ? components.SPEECH.hand : 80;
    const second = layout.floors[1], row1 = layout.slots.filter(slot => slot.row === 0);
    const left = row1[0].x - row1[0].left;
    const title = { text: TITLE.text, x: left, y: layout.bands.above - TITLE.above * RULE, size: (TITLE.cap * layout.perPixel) / cap, cap: TITLE.cap };
    title.top = title.y - cap * title.size;
    const lines = [second + BANDS.below * RULE, second + (BANDS.below + BANDS.next) * RULE];
    const words = (1.01 * speech * layout.perPixel) / cap;
    const band = { lines, left, right: layout.empty.x - 2 * layout.empty.reach, size: words, top: lines[0] - cap * words };
    const label = { y: second + EMPTY.rules * RULE, size: (1.01 * EMPTY.cap * layout.perPixel) / cap };
    const reachLeft = Math.min(...layout.slots.map(slot => slot.x - slot.left));
    const reachRight = Math.max(...layout.slots.map(slot => slot.x + slot.right));
    const zoom = (core.FRAME.width - 2 * SIDES) / ((reachRight - reachLeft) * page.fit), x = (reachLeft + reachRight) / 2;
    const frame = bottom => core.frameBox(page, { top: title.top, bottom, x, zoom });
    layout.title = title;
    layout.band = band;
    layout.empty.label = label;
    layout.wide = { zoom, rows: frame(label.y + DESCENDER * label.size), band: lines.map(y => frame(y + DESCENDER * words)) };
    layout.whole = layout.wide.rows;
  }

  // Claude is on page A too, out of sight until a section brings it in (enter()), as it does at bar 33.
  function hiddenClaude(cast) {
    const claude = cast.find(name => !PF.standFor(name));
    return claude ? { [claude]: { x: PAGE_A.phy.x + 6 * RULE, y: PAGE_A.phy.floor, at: Infinity } } : {};
  }

  // ------------------------------------------------------------ Page B

  // Places the cast in two rows, each centered, and returns the page's world, the places (for the
  // scenes) and the slots (the places with their reaches, the empty one last). Neighbors stand as far
  // apart as the widest of the four facings needs, with the stranger gap between their outlines: the
  // friends turn together, so that at any time the two face the same way, and the gap is the larger of
  // the left one's reach on its right and the right one's on its left, facing by facing. (From behind a
  // friend is its own mirror image, so a tail changes sides.) Claude, which never turns, keeps its reach,
  // and the empty place, as wide as a friend's, starts the stranger gap after its laptop.
  function galleryLayout(core, cast) {
    const reaches = measureReaches(core, cast);
    const claude = cast.find(name => !PF.standFor(name));
    const rows = [cast.slice(0, ROWS.first), cast.slice(ROWS.first)];
    const house = cast.filter(name => name !== claude);
    const emptyReach = Math.round(house.reduce((sum, name) => sum + (reaches[name].left + reaches[name].right) / 2, 0) / house.length);
    const apart = (a, b) => Math.max(...FACINGS.map(f => reaches[a].facings[f].right + reaches[b].facings[f].left)) + PF.cast.gap(a, b);
    const laidOut = rows.map((row, r) => {
      const slots = [];
      let x = reaches[row[0]].left;
      row.forEach((name, i) => {
        if (i) x += apart(row[i - 1], name);
        slots.push({ name, x, row: r, left: reaches[name].left, right: reaches[name].right });
      });
      const last = row[row.length - 1];
      let end = x + reaches[last].right;
      if (r === rows.length - 1) {
        const clear = Math.max(reaches[last].right, reaches[last].beyond || 0);
        slots.push({ name: null, x: x + clear + PF.cast.GAP.strangers + emptyReach, row: r, left: emptyReach, right: emptyReach });
        end = slots[slots.length - 1].x + emptyReach;
      }
      return { slots, width: end };
    });
    const width = Math.ceil((Math.max(...laidOut.map(row => row.width)) + 2 * ROWS.margin) / 16) * 16;
    const world = { width, height: width * 9 / 16 };
    const first = Math.floor(world.height / 2 / RULE) * RULE, floors = [first, first + ROWS.apart * RULE];
    const places = {}, slots = [];
    for (const row of laidOut) {
      const shift = (width - row.width) / 2;
      for (const slot of row.slots) {
        const placed = { ...slot, x: slot.x + shift, y: floors[slot.row], index: slots.length };
        slots.push(placed);
        if (slot.name) places[slot.name] = { x: placed.x, y: placed.y, row: placed.row, index: placed.index, look: 'viewer' };
      }
    }
    const empty = slots[slots.length - 1];
    const bands = { above: floors[0] - BANDS.above * RULE, below: floors[1] + BANDS.below * RULE };
    return { world, places, slots, empty: { x: empty.x, y: empty.y, reach: emptyReach }, floors, bands, rows, reaches, claude };
  }

  // How far each friend's outline reaches left and right of its middle, in head units, in each facing
  // (facings), and at its widest (left, right): over both stances and both bodies the film shows (the
  // plain oval and the rice ball). Claude, which does not turn, is measured at its laptop, whose own
  // reach (beyond) lies outside its outline.
  function measureReaches(core, cast) {
    const host = document.createElement('div');
    host.style.cssText = `position:absolute;left:0;top:0;width:${BOX}px;height:${BOX}px;visibility:hidden;`;
    core.stage.frame.appendChild(host);
    const tapers = [0, PF.ONIGIRI.taper], saved = PF.ONIGIRI.taper, reaches = {};
    try {
      for (const name of cast) {
        const turns = !!PF.standFor(name), facings = {};
        let beyond = 0;
        for (const f of FACINGS) facings[f] = { left: 0, right: 0 };
        for (const taper of tapers) {
          PF.ONIGIRI.taper = taper;
          const spec = { ...PF.get(name) };           // A fresh spec, whose cached figure is made under this taper.
          const rig = PF.mount(host, spec, { bg: false, view: PF.standingView(spec), bitmap: false });
          const poses = turns ? posesToMeasure() : FACINGS.map(facing => ({ ...laptopPose(spec), facing }));
          for (const pose of poses) {
            rig.setPose(pose, true);
            const r = outlineReach(rig, OUTLINE_PARTS), kept = facings[pose.facing];
            kept.left = Math.max(kept.left, r.left);
            kept.right = Math.max(kept.right, r.right);
            if (!turns) beyond = Math.max(beyond, outlineReach(rig, ['ground']).right);
          }
          host.replaceChildren();
        }
        const all = Object.values(facings);
        reaches[name] = { left: Math.max(...all.map(r => r.left)), right: Math.max(...all.map(r => r.right)), facings, ...(turns ? {} : { beyond }) };
      }
    } finally {
      PF.ONIGIRI.taper = saved;
      host.remove();
    }
    return reaches;
  }

  // Every facing in both stances: the poses a friend that turns is measured in.
  function posesToMeasure() {
    return FACINGS.flatMap(facing => STANCES.map(stance => ({ facing, stance })));
  }

  // How far a rig's named parts reach left and right of the drawing's middle, in head units.
  function outlineReach(rig, parts) {
    const box = rig.svg.getBoundingClientRect(), unit = box.width / BOX, middle = box.left + box.width / 2;
    let left = 0, right = 0;
    for (const part of parts) {
      const node = rig.parts[part];
      if (!node) continue;
      const r = node.getBoundingClientRect();
      if (!r.width) continue;
      left = Math.max(left, (middle - r.left) / unit);
      right = Math.max(right, (r.right - middle) / unit);
    }
    return { left, right };
  }

  // Claude's pose at its laptop, from its own routine.
  function laptopPose(spec) {
    return A.sample(A.track(spec.routine.keys, { duration: spec.routine.duration }), TYPING.sit);
  }

  // Claude types at its laptop for as long as the gallery is shown: it sits side-on at the open
  // laptop, as its routine has it, and the stretch of the routine that types runs round and round,
  // from layout.typing.from until layout.typing.until (seconds), which a section may set while it is
  // built (the gallery's brings Claude in first, and has it fold the laptop away at the end). The
  // routine's moments are given there too (sit, loop), for a section that plays the rest of it.
  function typeAtTheLaptop(page) {
    const name = page.layout.claude;
    if (!name) return;
    page.layout.typing = { from: 0, until: Infinity, sit: TYPING.sit, loop: [TYPING.from, TYPING.to] };
    page.programs.push({
      owner: 'pages',
      fn(scene, cast) {
        const actor = cast[name], spec = actor.spec;
        const routine = A.track(spec.routine.keys, { duration: spec.routine.duration });
        const sitting = A.still(A.sample(routine, TYPING.sit));
        const span = TYPING.to - TYPING.from;
        const typing = A.clip(t => {
          const pose = routine(TYPING.from + (((t % span) + span) % span));
          return { earR: pose.earR - (A.sample(routine, TYPING.sit).earR || 0) };
        }, span, true);
        // A finite start: the clip's own time is t - at, which an infinite start would make infinite.
        const { from, until } = page.layout.typing;
        actor.play(A.layer(sitting, typing), { at: from, until, fade: 0 });
      },
    });
  }

  // A patch of pencilled ground under every place, the empty one too, as the gallery draws one under
  // every friend: a line that wanders a little, from a seeded hand, so that every frame draws the same.
  function drawGrounds(page, layout) {
    const random = PF.rng(GROUND.seed);
    const lines = layout.slots.map(slot => {
      const x0 = slot.x - slot.left - 14 + random() * GROUND.inset, x1 = slot.x + slot.right + 14 - random() * GROUND.inset;
      const segments = Math.max(1, Math.round((x1 - x0) / GROUND.step)), points = [];
      for (let i = 0; i <= segments; i++) points.push({ x: x0 + (i * (x1 - x0)) / segments, y: slot.y + (random() - 0.5) * GROUND.wobble });
      return `<path d="${PF.shapes.pathD(points, false)}"/>`;
    });
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'sh-grounds');
    svg.setAttribute('width', layout.world.width);
    svg.setAttribute('height', layout.world.height);
    svg.innerHTML = `<g fill="none" stroke="currentColor" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round">${lines.join('')}</g>`;
    page.under.appendChild(svg);
  }

  root.SayHi = root.SayHi || {};
  root.SayHi.pages = pages;
})(typeof self !== 'undefined' ? self : this);
