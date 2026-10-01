/*
 * What the test files share: which friends are of the house, and a box to mount a friend in.
 *
 * Loads as a classic script after test/harness.js and before the test files (window.support).
 */
(function () {
  'use strict';

  // Claude keeps the shape of Claude Code's mascot, so it is the one friend outside the house anatomy: it never stands,
  // shows no feelings, and has its own palette. Every other friend keeps every promise of the house contract.
  const EXCEPTIONS = ['claude'];

  // The friends of the house: every registered friend but the exceptions, so that a new friend is held to the contract
  // the moment it is registered.
  const houseFriends = () => PhyFriends.list().filter(name => !EXCEPTIONS.includes(name));

  // Runs fn with a box of the given size in the page, and removes the box afterward, however fn ends. fn may be async.
  async function withBox(fn, size = 200) {
    const box = document.createElement('div');
    Object.assign(box.style, { position: 'relative', width: `${size}px`, height: `${size}px` });
    document.body.appendChild(box);
    try {
      return await fn(box);
    } finally {
      box.remove();
    }
  }

  // The synchronous form of withBox, for tests that measure a rig without waiting on anything.
  function withBoxSync(fn, size = 200) {
    const box = document.createElement('div');
    Object.assign(box.style, { position: 'relative', width: `${size}px`, height: `${size}px` });
    document.body.appendChild(box);
    try {
      return fn(box);
    } finally {
      box.remove();
    }
  }

  window.support = { EXCEPTIONS, houseFriends, withBox, withBoxSync };
})();
