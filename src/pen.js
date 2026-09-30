/*!
 * phy_friends/pen: text that writes itself, stroke by stroke, the way a hand writes it.
 *
 * A pen is { text, width, strokes }, as tools/title_pen.py writes it (site/title-pen.js holds the
 * gallery's title): each stroke follows a letter's centerline in writing order, in thousandths of
 * an em from the start of the text on its baseline. write() lays a copy of the text over an
 * element's own and reveals it through a mask of those strokes; at(seconds) moves the pen on. The
 * caller keeps the element's own text out of sight meanwhile.
 *
 *   const writing = PhyFriends.pen.write(title, TITLE_PEN, { color: 'var(--ink)' });
 *   if (writing) writing.at(0.5);   // Null when the element's text or face does not match the pen.
 *
 * Loads as a classic script after phyfriends.js and anim.js (PhyFriends.pen).
 */
(function (root) {
  'use strict';

  const PF = root.PhyFriends, A = PF && PF.anim;
  if (!A) throw new Error('phy_friends/pen: load src/phyfriends.js and src/anim.js first');

  // A hand's pace: along a stroke at `pen` em a second, with a pause before each stroke, `lift`
  // within a letter, `nextLetter` between letters and `space` between words, in seconds. A stroke
  // takes at least `shortest`, so that a dot is seen to be made. The pauses give the writing its
  // rhythm: without them it reads as a wipe.
  const PACE = Object.freeze({ pen: 13, lift: 0.1, nextLetter: 0.07, space: 0.2, shortest: 0.05 });
  const WIDTH_TOLERANCE = 0.01;  // How far the text's set width may differ from the pen's before the pen is refused.
  const SVG_NS = 'http://www.w3.org/2000/svg';
  let writings = 0;              // Numbers each writing's mask, so that several can share a page.

  // When each stroke starts and how long it takes, in seconds from the first.
  function times(strokes, pace = PACE) {
    let at = 0;
    return strokes.map((stroke, i) => {
      if (i > 0) {
        const gap = stroke.letter - strokes[i - 1].letter;
        at += gap === 0 ? pace.lift : gap === 1 ? pace.nextLetter : pace.space;
      }
      const timed = { at, seconds: Math.max(pace.shortest, stroke.length / 1000 / pace.pen) };
      at += timed.seconds;
      return timed;
    });
  }

  function duration(strokes, pace = PACE) {
    const last = times(strokes, pace).at(-1);
    return last.at + last.seconds;
  }

  // How much of a stroke is written u (0 to 1) of the way through its time: a hand slows at each end.
  function progress(u) {
    const v = Math.min(1, Math.max(0, u));
    return (v + A.ease.smooth(v)) / 2;
  }

  // Lays the copy over the element's text and returns the writing, or null if the element's text is
  // not the pen's or is set wider or narrower than the pen was made for (another face, say). The
  // element must be laid out and positioned, so that the copy can sit on its baseline.
  function write(element, pen, { color = getComputedStyle(element).color, pace = PACE } = {}) {
    const size = parseFloat(getComputedStyle(element).fontSize), line = measureLine(element);
    if (element.textContent !== pen.text || Math.abs(line.width / size - pen.width) > pen.width * WIDTH_TOLERANCE) return null;
    const id = `pf-pen-${++writings}`, svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'pf-pen');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('width', element.offsetWidth);
    svg.setAttribute('height', element.offsetHeight);
    svg.style.cssText = `position: absolute; left: 0; top: 0; overflow: visible; pointer-events: none; color: ${color}`;
    const region = { x: line.x - size, y: line.y - 2 * size, width: (pen.width + 2) * size, height: 4 * size };
    svg.innerHTML =
      `<mask id="${id}" maskUnits="userSpaceOnUse" x="${region.x}" y="${region.y}" width="${region.width}" height="${region.height}">` +
      `<g transform="translate(${line.x} ${line.y}) scale(${size / 1000})" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round">` +
      pen.strokes.map(stroke => `<path d="${stroke.d}" stroke-width="${stroke.width}" pathLength="1" stroke-dasharray="1 1" visibility="hidden"/>`).join('') +
      `</g></mask><text x="${line.x}" y="${line.y}" fill="currentColor" mask="url(#${id})"></text>`;
    svg.querySelector('text').textContent = pen.text;
    element.appendChild(svg);
    const paths = [...svg.querySelectorAll('path')], timed = times(pen.strokes, pace);
    return {
      duration: duration(pen.strokes, pace),
      // When the pen starts on the given letter (an index into the text), or on the first after it.
      reaches(letter) {
        const i = pen.strokes.findIndex(stroke => stroke.letter >= letter);
        return i < 0 ? Infinity : timed[i].at;
      },
      // Shows the text as far as the pen has written it, `seconds` after it started.
      at(seconds) {
        timed.forEach(({ at, seconds: length }, i) => {
          paths[i].setAttribute('visibility', seconds >= at ? 'visible' : 'hidden');
          paths[i].style.strokeDashoffset = 1 - progress((seconds - at) / length);
        });
      },
      remove() {
        svg.remove();
      },
    };
  }

  // Where the element's text starts on its baseline and how wide it is set, in px from the element's
  // own box, before any transform: two empty inline blocks, one at each end of the text, sit on it.
  function measureLine(element) {
    const probe = () => {
      const span = document.createElement('span');
      span.style.cssText = 'display: inline-block; width: 0; height: 0; vertical-align: baseline';
      return span;
    };
    const start = probe(), end = probe();
    element.prepend(start);
    element.append(end);
    const line = { x: start.offsetLeft, y: start.offsetTop, width: end.offsetLeft - start.offsetLeft };
    start.remove();
    end.remove();
    return line;
  }

  const api = { PACE, times, duration, progress, write };
  PF.pen = api;
})(typeof self !== 'undefined' ? self : this);
