// Tests of lib/fwiends/src/workings.js: a page's workings in blue pencil, which draw nothing until the reader asks,
// and take everything away again when the reader is done.
(function () {
  'use strict';

  const PF = PhyFriends, W = PF.workings;

  test("every friend's construction is drawn from numbers its spec gives", () => {
    for (const name of PF.list()) {
      const markup = W.construction(name);
      assert(markup.includes('<path'), `${name} has no construction`);
      assert(!/NaN|undefined/.test(markup), `${name}'s construction is missing a number`);
    }
  });

  test('a stage sits still while asked, and leaves the reader\'s own setting alone', () => {
    const setting = { matches: false }, stage = PF.live.stage({ reducedMotion: setting, announce: () => {} });
    assert(!stage.reduced, 'moving at first');
    stage.sitStill(true);
    assert(stage.reduced, 'still while asked');
    stage.sitStill(false);
    assert(!stage.reduced, 'moving again');
    assert(!setting.matches, "the reader's setting is untouched");
  });

  test('the workings show nothing until the button is pressed, and take everything away again', () => {
    support.withBoxSync(box => {
      const rig = PF.mount(box, 'howdi', { bitmap: false });
      const button = document.createElement('button'), shown = document.createElement('p'), label = document.createElement('span');
      label.textContent = 'sky-blue wolf';
      box.append(button, shown, label);
      const stage = { reduced: false, sitStill(on) { this.reduced = on; } };
      const workings = W.attach({ button, stage, friends: [{ name: 'howdi', rig }], reveal: [shown],
        notes: [{ at: label, place: 'over', text: 'howdi.js' }, { at: button, place: 'right', text: 'a note', media: '(max-width: 1px)' }] });
      const constructions = () => rig.svg.querySelectorAll('.pf-construction').length;
      const notes = () => [...document.querySelectorAll('.pf-workings-note')].filter(note => !note.hidden);
      try {
        assertEqual([constructions(), shown.hidden, button.getAttribute('aria-pressed'), notes().length], [0, true, 'false', 0], 'before');
        button.click();
        assertEqual([constructions(), shown.hidden, button.getAttribute('aria-pressed'), stage.reduced], [1, false, 'true', true], 'shown');
        assertEqual(notes().map(note => note.textContent), ['howdi.js'], 'the note over the label, and none outside its media');
        assert(label.classList.contains('pf-workings-covered'), 'the label stands aside for its note');
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        assertEqual([constructions(), shown.hidden, button.getAttribute('aria-pressed'), notes().length, stage.reduced],
          [0, true, 'false', 0, false], 'after Escape');
        assert(!label.classList.contains('pf-workings-covered') && !rig.svg.classList.contains('pf-workings'), 'nothing left behind');
      } finally {
        workings.detach();
      }
    });
  });
})();
