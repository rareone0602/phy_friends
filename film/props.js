/*!
 * phy_friends/props: the things in a scene (a cake, a balloon, a party hat), each a small spec that the
 * factory's shapes and pencil draw, as they draw a friend.
 *
 * A spec is a palette, a box and parts:
 *
 *   PhyFriends.props.define('candle', {
 *     palette: { wax: '#a9bcd4', flame: '#f7d98c' },
 *     box: { w: 16, h: 48 },
 *     parts: [
 *       { fill: 'wax', nodes: [[-3, -24, 1], [3, -24, 1], [3, 0, 1], [-3, 0, 1]], round: 0.3 },
 *       { stroke: true, nodes: [[0, -24], [0.6, -29]] },
 *       { show: 'lit', fill: 'flame', cx: 0, cy: -33, rx: 4, ry: 5, fluff: [{ from: 200, to: 340, n: 1, len: 7, b1: -8, b2: -8 }] },
 *     ],
 *   });
 *
 * The palette names the colors that the thing really has, and each color's house shade (<name>Shade) is
 * derived by PhyFriends.shadeOf. The box is the prop's width and height in head units; its origin is the
 * bottom center, on the ground, with y negative upward, as a friend's ground is. The parts are drawn
 * from the back. Each is a fill (a palette color or its shade) on a shape the factory draws (an ellipse,
 * a fluffy ellipse, a star, rounded polygons or raw nodes), or an ink mark (stroke: true): a pencil line
 * along its nodes, in one of the paper's inks, never filled. A part with show: '<state>' is drawn only in
 * that state, and one with hide: '<state>' only out of it; each lies in a group of its own
 * (data-pf-show, data-pf-hide) that a scene switches on cue without drawing the prop again.
 *
 * Loads as a classic script after src/phyfriends.js (PhyFriends.props); the specs in props/ load after it.
 */
(function (root) {
  'use strict';
  const PF = root.PhyFriends;
  if (!PF) throw new Error('phy_friends/props: load src/phyfriends.js first');
  const { pathD, shapeD, shapeNodes, ellipseD } = PF.shapes;

  // The inks of site/notebook.css, in which an ink mark is drawn (STYLE.md §4).
  const INKS = { ink: '#3d3c39', 'ink-2': '#6d6a63' };
  // An ink mark's width in CSS px at the size it is drawn, whatever the prop's scale (STYLE.md §6).
  const STROKE = { width: 1.4, least: 1.1, most: 1.5 };
  const SPEC_KEYS = ['palette', 'box', 'parts'];
  // What a part is drawn in, when it is drawn, and its shape, as the factory's shapes take it (PhyFriends.shapes).
  const PART_KEYS = ['fill', 'stroke', 'tone', 'width', 'show', 'hide',
    'cx', 'cy', 'rx', 'ry', 'rot', 'fluff', 'onigiri', 'step', 'tips', 'valley', 'b1', 'b2', 'nodes', 'round', 'polys', 'bend'];
  const SHAPES = { rx: 'an ellipse', tips: 'a star', nodes: 'raw nodes', polys: 'rounded polygons' };
  const isHex = v => typeof v === 'string' && /^#([0-9a-f]{3}){1,2}$/i.test(v);
  const isObject = v => !!v && typeof v === 'object' && !Array.isArray(v);
  const num = n => Math.round(n * 100) / 100;
  const registry = new Map();

  function define(name, spec) {
    check(spec, name);
    const defined = { name, ...spec };
    registry.set(name, defined);
    return defined;
  }

  function get(name) {
    const spec = registry.get(name);
    if (!spec) throw new Error(`phy_friends/props: there is no prop "${name}"; the props are ${list().join(', ') || 'not loaded'}`);
    return spec;
  }

  function list() {
    return [...registry.keys()];
  }

  // The states that the spec's parts show or hide, in the order they first appear.
  function states(nameOrSpec) {
    const spec = typeof nameOrSpec === 'string' ? get(nameOrSpec) : nameOrSpec;
    return [...new Set(spec.parts.flatMap(part => [part.show, part.hide]).filter(Boolean))];
  }

  // Returns the spec if it keeps to the format above, and otherwise throws an error that lists every departure.
  function check(spec, name = (spec && spec.name) || 'the prop') {
    const problems = departures(spec);
    if (problems.length) throw new Error(`phy_friends/props: ${name}: ${problems.join('; ')}`);
    return spec;
  }

  function departures(spec) {
    if (!isObject(spec)) return ['a prop is an object with a palette, a box and parts'];
    const out = [], palette = isObject(spec.palette) ? spec.palette : {}, colors = withShades(palette);
    for (const key of Object.keys(spec)) if (key !== 'name' && !SPEC_KEYS.includes(key)) out.push(`"${key}" is not a key of a prop (${SPEC_KEYS.join(', ')})`);
    if (!isObject(spec.palette)) out.push('it has no palette');
    for (const [key, value] of Object.entries(palette)) if (!isHex(value)) out.push(`palette.${key} is not a color ("${value}")`);
    if (!isObject(spec.box) || !(spec.box.w > 0 && spec.box.h > 0)) out.push('it has no box: give its width and height in head units, { w, h }');
    if (!Array.isArray(spec.parts) || !spec.parts.length) out.push('it has no parts');
    else spec.parts.forEach((part, i) => out.push(...partDepartures(part, `parts[${i}]`, colors)));
    return out;
  }

  function partDepartures(part, at, colors) {
    if (!isObject(part)) return [`${at} is not a part`];
    const out = [], shapes = Object.keys(SHAPES).filter(key => part[key] !== undefined);
    for (const key of Object.keys(part)) if (!PART_KEYS.includes(key)) out.push(`${at}.${key} is not a key of a part`);
    if (shapes.length !== 1) out.push(`${at} needs exactly one shape, ${Object.values(SHAPES).join(', ')}, and has ${shapes.length ? shapes.join(' and ') : 'none'}`);
    if (part.show !== undefined && part.hide !== undefined) out.push(`${at} gives both show and hide`);
    for (const key of ['show', 'hide']) if (part[key] !== undefined && !/^\w+$/.test(part[key])) out.push(`${at}.${key} is not the name of a state ("${part[key]}")`);
    if (part.stroke) {
      const width = part.width ?? STROKE.width;
      if (part.fill !== undefined) out.push(`${at} is an ink mark, which is never filled: leave out its fill`);
      if (!part.nodes) out.push(`${at} is an ink mark, which is drawn along nodes`);
      if (!((part.tone ?? 'ink') in INKS)) out.push(`${at}.tone is not an ink (${Object.keys(INKS).join(', ')})`);
      if (!(width >= STROKE.least && width <= STROKE.most)) out.push(`${at}.width is ${width}, but an ink mark is ${STROKE.least} to ${STROKE.most}px wide`);
    } else {
      if (!(part.fill in colors)) out.push(`${at}.fill names no color of the palette or its shades ("${part.fill}")`);
      for (const key of ['tone', 'width']) if (part[key] !== undefined) out.push(`${at}.${key} belongs to an ink mark (stroke: true)`);
    }
    return out;
  }

  // The palette with any colors overridden, and the house shade of each color. A shade that the spec sets by hand
  // holds only for the spec's own color: an overridden color takes its derived shade.
  function withShades(palette, overrides = {}) {
    const colors = { ...palette, ...overrides };
    for (const [key, value] of Object.entries(colors)) {
      const shade = `${key}Shade`;
      if (key.endsWith('Shade') || !isHex(value) || (shade in palette && !(key in overrides))) continue;
      colors[shade] = PF.shadeOf(value);
    }
    return colors;
  }

  // Draws a prop (a name or a spec) as { w, h, svg } for scene.prop(): the parts, scaled, with the box's bottom
  // center at the bottom center of a viewBox 0 0 w h. state lists the states that are on, and palette overrides
  // colors by name (a party hat in a friend's color), whose shades follow. The ink marks keep their width in
  // CSS px at any scale (vector-effect), as the house's marks do.
  function drawing(nameOrSpec, { state = [], palette = {}, scale = 1 } = {}) {
    const spec = typeof nameOrSpec === 'string' ? get(nameOrSpec) : check(nameOrSpec);
    const name = spec.name || 'the prop', known = states(spec);
    const on = new Set(typeof state === 'string' ? state.split(/\s+/).filter(Boolean) : state);
    for (const s of on) if (!known.includes(s)) throw new Error(`phy_friends/props: ${name} has no state "${s}" (${known.length ? `its states are ${known.join(', ')}` : 'it has none'})`);
    for (const [key, value] of Object.entries(palette)) {
      if (!(key in spec.palette)) throw new Error(`phy_friends/props: ${name} has no color "${key}" to override (its colors are ${Object.keys(spec.palette).join(', ')})`);
      if (!isHex(value)) throw new Error(`phy_friends/props: the color given for ${name}'s ${key} is not a color ("${value}")`);
    }
    if (!(scale > 0)) throw new Error(`phy_friends/props: ${name} cannot be drawn at a scale of ${scale}`);
    const colors = withShades(spec.palette, palette), w = num(spec.box.w * scale), h = num(spec.box.h * scale);
    const parts = spec.parts.map((part, i) => cued(part, on, markupOf(part, colors, `prop:${name}/${i}`))).join('');
    return { w, h, svg: `<g transform="translate(${num(w / 2)} ${h}) scale(${num(scale)})">${parts}</g>` };
  }

  // A part's markup: a fill on its shape (an ellipse without tufts is drawn exactly), or an ink mark along its nodes.
  function markupOf(part, colors, seed) {
    if (part.stroke) {
      return `<path d="${pathD(shapeNodes(part), false)}" fill="none" stroke="${INKS[part.tone ?? 'ink']}" ` +
        `stroke-width="${part.width ?? STROKE.width}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
    }
    const exact = part.rx !== undefined && !part.fluff && !part.onigiri;
    return `<path d="${exact ? ellipseD({ ...part, ry: part.ry ?? part.rx }) : shapeD(part, seed)}" fill="${colors[part.fill]}"/>`;
  }

  // A part that a state shows or hides lies in a group of its own, which a scene switches on cue (film/scene.js).
  function cued(part, on, markup) {
    if (part.show) return `<g data-pf-show="${part.show}"${on.has(part.show) ? '' : ' display="none"'}>${markup}</g>`;
    if (part.hide) return `<g data-pf-hide="${part.hide}"${on.has(part.hide) ? ' display="none"' : ''}>${markup}</g>`;
    return markup;
  }

  PF.props = { define, get, list, states, check, drawing, INKS, STROKE };
})(typeof self !== 'undefined' ? self : this);
