// Tests of the harness itself (test/harness.js), where `python3 tools/pf.py test` relies on it.
(function () {
  'use strict';

  // pf.py reads window.testRunning to name a test that hangs in an endless loop, which it must then stop.
  test('the harness names the test that is running', () => {
    assertEqual(window.testRunning, 'the harness names the test that is running');
  });

  test('the harness still names a test after it has waited', async () => {
    await new Promise(done => setTimeout(done, 0));
    assertEqual(window.testRunning, 'the harness still names a test after it has waited');
  });
})();
