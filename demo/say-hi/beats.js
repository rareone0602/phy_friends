/*!
 * say hi: the beat map, as data.
 *
 * The track is 76 bars of 4/4 at a steady 130 beats a minute, with bar 1 on its first sample
 * (out/video/music/map/music-map.md). Bar n starts at (n - 1) * 24/13 s and a beat lasts 6/13 s, so
 * every cue in the film is written as a bar and a beat, never in seconds:
 *
 *   at(25, 4)      the fourth beat of bar 25
 *   at('25.4')     the same, as a string
 *   at(25, 2.5)    the "and" of beat 2
 *   at('25.2.5')   the same, as a string
 *
 * Loads as a classic script before demo/say-hi/core.js (SayHi.beats).
 */
(function (root) {
  'use strict';

  const BPM = 130;
  const BEAT = 60 / BPM;          // 6/13 s.
  const BAR = 4 * BEAT;           // 24/13 s.
  const BARS = 76;
  const DURATION = BARS * BAR;    // 140.3077 s: the track stops on the bar-77 line.
  const SIXTEENTH = BEAT / 4;

  // The ten sections of the music map, with what each holds in the screenplay (out/video/screenplay.md).
  const SECTIONS = Object.freeze([
    { id: 'I', name: 'intro', bars: [1, 4], energy: 1 },
    { id: 'A', name: 'theme A', bars: [5, 12], energy: 3 },
    { id: 'B', name: 'theme B', bars: [13, 20], energy: 3 },
    { id: 'C', name: 'theme C', bars: [21, 28], energy: 4 },
    { id: "I'", name: 'breakdown', bars: [29, 36], energy: 2 },
    { id: 'D', name: 'bridge', bars: [37, 44], energy: 3 },
    { id: "B'", name: 'B again', bars: [45, 52], energy: 4 },
    { id: "A'", name: 'A again', bars: [53, 60], energy: 4 },
    { id: "B''", name: 'B a third time', bars: [61, 68], energy: 4 },
    { id: "C'", name: 'finale', bars: [69, 76], energy: 5 },
  ].map(Object.freeze));

  // The strongest hits (music-map.md, section 4), for cues that want to land on them.
  const HITS = Object.freeze(['5.1', '13.1', '15.1', '21.1', '28.1', '29.1', '37.1', '44.1', '45.1', '53.1', '61.1', '69.1', '75.1', '76.1']);

  const TRACK = Object.freeze({
    title: 'The road we use to travel when we were kids',
    author: 'Komiku',
    album: 'Tale on the Late',
    licence: 'CC0 1.0',
    source: 'https://archive.org/details/Komiku-TaleOnTheLate',
    file: 'out/video/music/candidates/cc-composers/komiku-the-road-we-use-to-travel.mp3',
  });

  // Seconds from the start of the film to a bar and a beat (see the examples above). A beat may be
  // fractional, and a bar past the last one is allowed, for the end of the film (at(77)).
  function at(bar, beat = 1) {
    if (typeof bar === 'string') return parse(bar);
    if (!Number.isFinite(bar) || !Number.isFinite(beat)) throw new Error(`say hi: at(${bar}, ${beat}) is not a bar and a beat`);
    return (bar - 1) * BAR + (beat - 1) * BEAT;
  }

  // '25.4' or '25.2.5': the bar, then the beat, whose decimals follow a second dot.
  function parse(text) {
    const match = /^(\d+)(?:\.(\d+(?:\.\d+)?))?$/.exec(text.trim());
    if (!match) throw new Error(`say hi: "${text}" is not a bar and a beat such as '25.4'`);
    return at(Number(match[1]), match[2] === undefined ? 1 : Number(match[2]));
  }

  // A time as a cue, or a number of seconds left as it is.
  function time(cue) {
    return typeof cue === 'number' ? cue : parse(String(cue));
  }

  // The bar and beat at t: { bar, beat } with beat from 1 up to 5 (exclusive), fractional.
  function position(t) {
    const bar = Math.floor(t / BAR + 1e-9) + 1;
    return { bar, beat: (t - (bar - 1) * BAR) / BEAT + 1 };
  }

  // A time written as bar.beat, for labels: 25.4, or 25.2.50 for a fraction of a beat.
  function label(t) {
    const { bar, beat } = position(t), whole = Math.floor(beat + 1e-9), part = beat - whole;
    return part < 0.005 ? `${bar}.${whole}` : `${bar}.${whole}.${String(Math.round(part * 100)).padStart(2, '0')}`;
  }

  // The section that holds t.
  function section(t) {
    const { bar } = position(t);
    return SECTIONS.find(s => bar >= s.bars[0] && bar <= s.bars[1]) || SECTIONS[SECTIONS.length - 1];
  }

  root.SayHi = root.SayHi || {};
  root.SayHi.beats = Object.freeze({ BPM, BEAT, BAR, BARS, DURATION, SIXTEENTH, SECTIONS, HITS, TRACK, at, time, position, label, section });
})(typeof self !== 'undefined' ? self : this);
