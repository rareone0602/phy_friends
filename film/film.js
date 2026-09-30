/*!
 * How a page shows its film: the page side of the film kit, which every film page loads (the films
 * in demo/ do).
 *
 * A film plays once, the first time most of its stage scrolls into view, and the page's button
 * starts it again from the beginning; the button reads "play" until the film has started, and "play
 * again" after. Under prefers-reduced-motion the film never plays by itself: it shows its last frame
 * until the button is pressed (STYLE.md §9). Opened by tools/pf.py film (?film), the page is filmed
 * instead and does not play at all.
 *
 * A film boils: its pencil texture is redrawn BOIL times a second, as hand-drawn animation does,
 * except under prefers-reduced-motion, where it keeps still. Two queries help to check a film by
 * eye: ?at=<seconds> holds that frame, for screenshots, and ?boil=<redraws per second> sets how often
 * the texture is redrawn (0 keeps it still).
 *
 * Loads as a classic script after film/scene.js (window.filmPage).
 */
(function (root) {
  'use strict';

  // A film plays once nine tenths of its stage is in view, or, where the window is too short for
  // that, once the stage fills nine tenths of the window's height.
  const PLAY_WHEN_VISIBLE = 0.9;
  const THRESHOLDS = Array.from({ length: 21 }, (_, i) => i / 20);  // Reports every 5%, to catch either case.
  const PLAYED_LABEL = 'play again';
  const BOIL = 8;  // Texture redraws per second in a film.

  const params = new URLSearchParams(location.search);
  const filming = params.has('film');  // A filmed scene never glides (film/scene.js), and nor should what moves with a friend.

  // Texture redraws per second: BOIL, or ?boil=N, where anything but a positive number keeps the
  // texture still. Reduced motion keeps it still too.
  function boilRate() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return 0;
    if (!params.has('boil')) return BOIL;
    const rate = Number(params.get('boil'));
    return Number.isFinite(rate) && rate > 0 ? rate : 0;
  }

  // Films the scene when tools/pf.py opens the page; otherwise shows it on the page. The button
  // replays it.
  function present(scene, { duration, button }) {
    if (scene.film({ duration })) return;
    button.addEventListener('click', () => playFromStart(scene, button));
    const still = heldTime(duration);
    if (still !== null) scene.seek(still);
    else if (scene.reduced) scene.seek(duration);
    else playWhenFirstInView(scene, button);
  }

  // The time given by ?at=, kept within the film, or null.
  function heldTime(duration) {
    if (!params.has('at')) return null;
    const t = Number(params.get('at'));
    return Number.isFinite(t) ? Math.min(duration, Math.max(0, t)) : null;
  }

  function playWhenFirstInView(scene, button) {
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(isMostlyInView)) return;
      observer.disconnect();
      playFromStart(scene, button);
    }, { threshold: THRESHOLDS });
    observer.observe(scene.el);
  }

  function isMostlyInView(entry) {
    return entry.intersectionRatio >= PLAY_WHEN_VISIBLE || entry.intersectionRect.height >= PLAY_WHEN_VISIBLE * innerHeight;
  }

  function playFromStart(scene, button) {
    scene.seek(0).play();
    button.textContent = PLAYED_LABEL;
  }

  // Fills a list (ul.meta) with a credit for each friend, in the given order: the name as its owner
  // writes it, and the owner's handle linking to their page (STYLE.md, principle 8).
  function listCredits(list, names) {
    for (const name of names) {
      const { name: written, credit } = root.PhyFriends.cast.friend(name);
      const item = document.createElement('li'), link = document.createElement('a');
      Object.assign(link, { href: credit.href, textContent: credit.handle });
      item.append(`${written}\u00a0`, link);  // A no-break space keeps a name with its handle.
      list.appendChild(item);
    }
  }

  root.filmPage = { params, filming, boilRate, present, listCredits };
})(typeof self !== 'undefined' ? self : this);
