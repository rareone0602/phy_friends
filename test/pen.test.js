// Tests for src/pen.js. Each writes into its own positioned element with a pen made to fit it, since
// the test page sets its text in its own face rather than the house face.
(function () {
  'use strict';
  const P = PhyFriends.pen;
  const PACE = { pen: 10, lift: 0.1, nextLetter: 0.07, space: 0.2, shortest: 0.02 };

  // Two strokes in the first letter, one in the next, and one after a space.
  const STROKES = [
    { letter: 0, width: 100, length: 500, d: 'M100 -400L100 0' },
    { letter: 0, width: 100, length: 300, d: 'M100 -200L300 -200' },
    { letter: 1, width: 100, length: 400, d: 'M500 -400L500 0' },
    { letter: 3, width: 100, length: 0, d: 'M900 -300L900 -300' },
  ];

  function withLine(text, fn) {
    const el = document.createElement('p');
    Object.assign(el.style, { position: 'absolute', left: '0', top: '0', margin: '0', fontSize: '40px', whiteSpace: 'pre', opacity: '0' });
    el.textContent = text;
    document.body.appendChild(el);
    try {
      return fn(el, fittedPen(el, text));
    } finally {
      el.remove();
    }
  }

  // A pen whose width matches the text as this page sets it.
  function fittedPen(el, text) {
    const range = document.createRange();
    range.selectNodeContents(el);
    return { text, width: range.getBoundingClientRect().width / 40, strokes: STROKES };
  }

  test('the pen pauses between strokes, longer between letters and longest between words', () => {
    const times = P.times(STROKES, PACE);
    assertEqual(times.map(t => +t.seconds.toFixed(3)), [0.05, 0.03, 0.04, 0.02], 'the dot takes the shortest time');
    assertEqual(times.map(t => +t.at.toFixed(3)), [0, 0.15, 0.25, 0.49]);
    assertEqual(+P.duration(STROKES, PACE).toFixed(3), 0.51);
  });

  test('a stroke is written slowly at each end and fully by its end', () => {
    assertEqual(P.progress(0), 0);
    assertEqual(P.progress(1), 1);
    assert(P.progress(0.1) < 0.1 && P.progress(0.9) > 0.9, 'slower at the ends than in the middle');
  });

  test('the text shows as far as the pen has written it', () => {
    withLine('ab c', (el, pen) => {
      const writing = P.write(el, pen, { pace: PACE });
      assert(writing, 'a pen that fits is taken');
      const paths = [...el.querySelectorAll('.pf-pen path')];
      writing.at(0.1);
      assertEqual(paths.map(p => p.getAttribute('visibility')), ['visible', 'hidden', 'hidden', 'hidden']);
      writing.at(writing.duration);
      assertEqual(paths.map(p => p.getAttribute('visibility')), ['visible', 'visible', 'visible', 'visible']);
      assertEqual(paths.map(p => +p.style.strokeDashoffset), [0, 0, 0, 0]);
      assertEqual(writing.reaches(2), writing.reaches(3), 'the space has no strokes, so the pen reaches the next letter');
      writing.remove();
      assert(!el.querySelector('.pf-pen'), 'the copy is taken away');
    });
  });

  test('a pen that does not fit the text is refused', () => {
    withLine('ab c', (el, pen) => {
      assertEqual(P.write(el, { ...pen, text: 'ab d' }), null, 'another text');
      assertEqual(P.write(el, { ...pen, width: pen.width * 1.05 }), null, 'set 5% narrower than the pen was made for');
      assert(!el.querySelector('.pf-pen'), 'nothing is laid over the text');
    });
  });
})();
