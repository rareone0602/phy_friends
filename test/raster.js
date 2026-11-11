/*
 * Measures drawings as pixels, for the tests that promise what a viewer sees: that a part shows against what lies
 * behind it, that its outline can be told from what lies round it, and where a figure meets the ground.
 *
 * A drawing is rendered flat (without the pencil texture, which would add noise) and rasterized on a canvas. A part
 * is a group the renderer names (data-pf), drawn three ways: as it is, hidden, and filled with a marker color. The
 * pixels where the marker shows are the part's visible area; of those, the ones where the drawing as it is differs
 * from the drawing without the part by more than a just-visible difference of color are where the part shows.
 *
 * Loads as a classic script after the library and before the tests that use it (window.raster).
 */
(function () {
  'use strict';

  const SIZE = 192;            // The side of the canvas, in pixels: large enough for a paw to cover a few hundred.
  const MARKER = '#ff00ff';    // A color no friend wears, so that every pixel it covers differs from the drawing.
  const ALPHA_SEEN = 128;      // A pixel at least this opaque is part of the figure.
  // The least difference of color (CIE76) that shows: how far phy's warm white, the palest color the house lets lie on
  // the paper (FWIENDS.md), stands off it.
  const JUST_VISIBLE = 4;

  // Renders a friend in a pose as an SVG document: flat, on the paper that the pages draw the friends on (unless bg
  // says otherwise), at the canvas's size (SIZE, unless size says otherwise).
  function svgOf(name, pose, { view = 'stand', bg = PhyFriends.pencil.settings.paper, size = SIZE } = {}) {
    const svg = PhyFriends.render(name, { view, pose, pencil: false, size, uid: 'raster', bg });
    return new DOMParser().parseFromString(svg, 'image/svg+xml');
  }

  // A copy of the drawing in which `edit` has changed every element of the parts named. A limb's part takes in its
  // outlines wherever they are drawn: the bands of a leg that reach its foot lie in front of the body with the foot.
  function edited(doc, parts, edit) {
    const copy = doc.cloneNode(true);
    for (const name of [].concat(parts)) {
      copy.querySelectorAll(`[data-pf="${name}"], [data-pf-d="${name}"], [data-pf-d^="${name}:"]`).forEach(edit);
    }
    return copy;
  }
  const hide = node => node.setAttribute('display', 'none');
  // Fills every shape of a part with the marker, and keeps its clips and its place in the drawing.
  const mark = node => {
    for (const shape of [node, ...node.querySelectorAll('path, ellipse, circle, rect')]) {
      if (!shape.matches('path, ellipse, circle, rect')) continue;
      if (!shape.closest('clipPath, mask')) { shape.setAttribute('fill', MARKER); shape.removeAttribute('stroke'); }
    }
  };

  async function pixels(doc, size = SIZE) {
    const text = new XMLSerializer().serializeToString(doc);
    const image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, size, size);
    return context.getImageData(0, 0, size, size).data;
  }

  // CIE L*a*b* of an sRGB pixel, for the CIE76 difference between two colors.
  function lab(r, g, b) {
    const linear = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
    const [R, G, B] = [r, g, b].map(linear);
    const f = t => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
    const x = f((0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047), y = f(0.2126 * R + 0.7152 * G + 0.0722 * B);
    const z = f((0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883);
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
  }
  function deltaE(a, b, i) {
    const p = lab(a[i], a[i + 1], a[i + 2]), q = lab(b[i], b[i + 1], b[i + 2]);
    return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  }
  // The same, between two pixels (at i and j) of one picture.
  function deltaWithin(a, i, j) {
    const p = lab(a[i], a[i + 1], a[i + 2]), q = lab(a[j], a[j + 1], a[j + 2]);
    return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  }

  // How a part shows in a pose: its visible area in pixels, and the share of that area where it differs from what lies
  // behind it by at least `difference` (CIE76). With `against`, only the area where that part lies behind it counts.
  async function visibility(name, parts, pose, { difference = JUST_VISIBLE, against, ...options } = {}) {
    const doc = svgOf(name, pose, options), withoutParts = edited(doc, parts, hide);
    const drawings = [doc, withoutParts, edited(doc, parts, mark)];
    if (against) drawings.push(edited(withoutParts, against, mark));
    const [shown, hidden, marked, behind] = await Promise.all(drawings.map(d => pixels(d)));
    let area = 0, seen = 0;
    for (let i = 0; i < shown.length; i += 4) {
      if (deltaE(marked, hidden, i) < 1 || (behind && deltaE(behind, hidden, i) < 1)) continue;
      area++;
      if (deltaE(shown, hidden, i) >= difference) seen++;
    }
    return { area, share: area ? seen / area : 0 };
  }

  // How each of the parts named (each a part or a list of parts) shows its outline in a pose: the length of its outline
  // (the pixels of its visible area that border on others), and the share of it across which the drawing changes, from
  // the part to what lies round it, by at least `difference` (CIE76). Each outline pixel is compared, one pixel in from
  // it where the part is that thick, with the pixels up to `reach` out from it, so that an edge drawn round the part
  // (drawLimbs's paper edge) counts as well as a part of another color or the paper behind it. With `apart` (for each
  // part, the parts it is drawn as one piece with, or none), the outline where a part borders on those does not count.
  // Drawn at `size` (twice SIZE), on which the paper's lip (PhyFriends's LIP) is a pixel or two.
  async function outline(name, parts, pose, { difference = JUST_VISIBLE, reach = 3, size = 2 * SIZE, apart = [], ...options } = {}) {
    const doc = svgOf(name, pose, { ...options, size });
    const others = parts.map((_, i) => apart[i] && [].concat(apart[i]).length ? edited(doc, apart[i], mark) : null);
    const [shown, ...marked] = await Promise.all([doc, ...parts.map(part => edited(doc, part, mark)), ...others].map(d => d && pixels(d, size)));
    const on = (x, y) => x >= 0 && y >= 0 && x < size && y < size;
    // A part's visible area: where marking it changes the drawing (by more than the canvas's rounding, compared channel
    // by channel, which is quicker than as colors and as exact against a marker that no friend wears).
    const areaOf = mine => {
      const inside = new Uint8Array(size * size);
      for (let i = 0; i < inside.length; i++) {
        const j = 4 * i;
        inside[i] = Math.abs(mine[j] - shown[j]) + Math.abs(mine[j + 1] - shown[j + 1]) + Math.abs(mine[j + 2] - shown[j + 2]) > 2 ? 1 : 0;
      }
      return inside;
    };
    return parts.map((_, p) => {
      const inside = areaOf(marked[p]), besides = marked[parts.length + p] ? areaOf(marked[parts.length + p]) : new Uint8Array(size * size);
      const isIn = (x, y) => on(x, y) && inside[y * size + x] === 1;
      let length = 0, seen = 0;
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        if (!isIn(x, y)) continue;
        const ways = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => on(x + dx, y + dy) && !isIn(x + dx, y + dy) && !besides[(y + dy) * size + x + dx]);
        if (!ways.length) continue;
        length++;
        const shows = ways.some(([dx, dy]) => {
          const from = isIn(x - dx, y - dy) ? (y - dy) * size + (x - dx) : y * size + x;
          for (let k = 1; k <= reach && on(x + k * dx, y + k * dy) && !isIn(x + k * dx, y + k * dy); k++) {
            if (deltaWithin(shown, 4 * from, 4 * ((y + k * dy) * size + x + k * dx)) >= difference) return true;
          }
          return false;
        });
        if (shows) seen++;
      }
      return { length, share: length ? seen / length : 0 };
    });
  }

  // How much of the parts named in `others` shows inside the parts named in `parts`, taken together, in a pose: of the
  // pixels that those parts cover whole once `others` are hidden (where marking them leaves the marker alone, not
  // blended with what lies round them), the area and those at which the drawing with `others` differs from the drawing
  // without them by at least `difference` (CIE76). Drawn at `size`, as outline is.
  async function within(name, parts, others, pose, { difference = JUST_VISIBLE, size = 2 * SIZE, ...options } = {}) {
    const doc = svgOf(name, pose, { ...options, size }), withoutOthers = edited(doc, others, hide);
    const [shown, without, marked] = await Promise.all([doc, withoutOthers, edited(withoutOthers, parts, mark)].map(d => pixels(d, size)));
    let area = 0, seen = 0;
    for (let i = 0; i < shown.length; i += 4) {
      if (marked[i] < 252 || marked[i + 1] > 3 || marked[i + 2] < 252) continue;
      area++;
      if (deltaE(shown, without, i) >= difference) seen++;
    }
    return { area, seen };
  }

  // How far what shows of a part's root stands off the rest of the figure in a pose, in head units: the least distance
  // from what shows of the part within `near` head units of its own origin (where PhyFriends sets a tail's root) to a
  // pixel of the rest of the figure (Infinity if there is none within twice `near`), or 0 where none shows, the root
  // lying behind the figure. Drawn at `size`, as outline is.
  async function rootGap(name, part, pose, { near = 6, size = 2 * SIZE, ...options } = {}) {
    const doc = svgOf(name, pose, { ...options, bg: false, size }), root = doc.cloneNode(true), NS = 'http://www.w3.org/2000/svg';
    root.querySelectorAll(`[data-pf="${part}"]`).forEach((node, i) => {
      const clip = root.createElementNS(NS, 'clipPath'), circle = root.createElementNS(NS, 'circle'), inner = root.createElementNS(NS, 'g');
      clip.setAttribute('id', `raster-root-${i}`);
      circle.setAttribute('r', near);
      clip.appendChild(circle);
      inner.setAttribute('clip-path', `url(#raster-root-${i})`);
      while (node.firstChild) inner.appendChild(node.firstChild);
      node.append(clip, inner);
    });
    const [rest, marked] = await Promise.all([edited(doc, part, hide), edited(root, part, mark)].map(d => pixels(d, size)));
    const unit = PhyFriends.resolveView(PhyFriends.get(name), options.view || 'stand', size).scale, reach = Math.ceil(2 * near * unit);
    const figure = i => rest[4 * i + 3] >= ALPHA_SEEN;
    let best = Infinity, shows = false;
    for (let i = 0; i < size * size; i++) {
      const j = 4 * i;
      if (marked[j + 3] < ALPHA_SEEN || Math.abs(marked[j] - rest[j]) + Math.abs(marked[j + 1] - rest[j + 1]) + Math.abs(marked[j + 2] - rest[j + 2]) <= 2) continue;
      const x = i % size, y = (i - x) / size;
      shows = true;
      for (let dy = -reach; dy <= reach; dy++) for (let dx = -reach; dx <= reach; dx++) {
        const u = x + dx, v = y + dy, d = Math.hypot(dx, dy);
        if (d < best && u >= 0 && v >= 0 && u < size && v < size && figure(v * size + u)) best = d;
      }
      if (!best) break;
    }
    return shows ? best / unit : 0;
  }

  // The lowest row of the figure, and of the ground line, in head units below the ground (positive is below it).
  async function lowest(name, pose, options = {}) {
    const doc = svgOf(name, pose, { bg: false, ...options });
    const data = await pixels(doc);
    let bottom = -1;
    for (let i = 3; i < data.length; i += 4) if (data[i] >= ALPHA_SEEN) bottom = Math.floor(i / 4 / SIZE);
    const view = PhyFriends.resolveView(PhyFriends.get(name), options.view || 'stand', SIZE);
    return (bottom + 1 - (view.y + PhyFriends.groundOf(name) * view.scale)) / view.scale;
  }

  window.raster = { SIZE, JUST_VISIBLE, visibility, outline, within, rootGap, lowest };
})();
