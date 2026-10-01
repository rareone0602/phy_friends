/*
 * Measures drawings as pixels, for the tests that promise what a viewer sees: that a part shows against what lies
 * behind it, and where a figure meets the ground.
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
  // says otherwise), at the canvas's size.
  function svgOf(name, pose, { view = 'stand', bg = PhyFriends.pencil.settings.paper } = {}) {
    const svg = PhyFriends.render(name, { view, pose, pencil: false, size: SIZE, uid: 'raster', bg });
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

  async function pixels(doc) {
    const text = new XMLSerializer().serializeToString(doc);
    const image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = SIZE;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, SIZE, SIZE);
    return context.getImageData(0, 0, SIZE, SIZE).data;
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

  // How a part shows in a pose: its visible area in pixels, and the share of that area where it differs from what lies
  // behind it by at least `difference` (CIE76). With `against`, only the area where that part lies behind it counts.
  async function visibility(name, parts, pose, { difference = JUST_VISIBLE, against, ...options } = {}) {
    const doc = svgOf(name, pose, options), withoutParts = edited(doc, parts, hide);
    const drawings = [doc, withoutParts, edited(doc, parts, mark)];
    if (against) drawings.push(edited(withoutParts, against, mark));
    const [shown, hidden, marked, behind] = await Promise.all(drawings.map(pixels));
    let area = 0, seen = 0;
    for (let i = 0; i < shown.length; i += 4) {
      if (deltaE(marked, hidden, i) < 1 || (behind && deltaE(behind, hidden, i) < 1)) continue;
      area++;
      if (deltaE(shown, hidden, i) >= difference) seen++;
    }
    return { area, share: area ? seen / area : 0 };
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

  window.raster = { SIZE, JUST_VISIBLE, visibility, lowest };
})();
