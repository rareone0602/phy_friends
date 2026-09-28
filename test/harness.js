/*
 * A minimal in-browser test harness, loaded as a classic script before the test files.
 *
 * A test file registers tests with test(name, fn), where fn may be async, and checks with
 * assert, assertEqual and assertThrows. Once the page has loaded, the harness runs every
 * test in the order registered, publishes window.testResults = { passed: [names],
 * failed: [{ name, message }] }, resolves window.testsDone, and lists the results on the
 * page. `python3 tools/pf.py test` runs test/index.html headless and reads the results.
 */
(function () {
  'use strict';

  const TEST_TIMEOUT_MS = 10000;  // A test that runs longer fails, so that one hung test cannot stall the run.
  const registered = [];
  let finish;

  class AssertionError extends Error {
    constructor(message) {
      super(message);
      this.name = 'AssertionError';
    }
  }

  window.testsDone = new Promise(resolve => { finish = resolve; });

  window.test = (name, fn) => {
    registered.push({ name, fn });
  };

  window.assert = (condition, message = 'assertion failed') => {
    if (!condition) throw new AssertionError(message);
  };

  // Compares numbers, strings and the like with ===, and plain objects and arrays by their contents.
  window.assertEqual = (actual, expected, message = 'values differ') => {
    if (!deepEqual(actual, expected)) throw new AssertionError(`${message}: expected ${show(expected)}, got ${show(actual)}`);
  };

  // Checks that fn throws, and, when a pattern (a RegExp or a substring) is given, that the error's message matches it.
  // Returns the error, for further checks.
  window.assertThrows = (fn, pattern, message = 'expected an error') => {
    try {
      fn();
    } catch (error) {
      const text = String(error && error.message !== undefined ? error.message : error);
      const matches = !pattern || (pattern instanceof RegExp ? pattern.test(text) : text.includes(pattern));
      if (!matches) throw new AssertionError(`${message}: the error "${text}" does not match ${pattern}`);
      return error;
    }
    throw new AssertionError(`${message}: nothing was thrown`);
  };

  function deepEqual(a, b) {
    if (a === b || Object.is(a, b)) return true;
    if (Array.isArray(a) || Array.isArray(b)) {
      return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x, i) => deepEqual(x, b[i]));
    }
    if (!isPlainObject(a) || !isPlainObject(b)) return false;
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length &&
      keys.every(key => Object.prototype.hasOwnProperty.call(b, key) && deepEqual(a[key], b[key]));
  }

  function isPlainObject(value) {
    if (value === null || typeof value !== 'object') return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  }

  function show(value) {
    if (value === undefined) return 'undefined';
    if (typeof value === 'number' && !Number.isFinite(value)) return String(value);
    try {
      return JSON.stringify(value);
    } catch (error) {
      return String(value);
    }
  }

  // An assertion's message says what failed; any other error also names its type and where it was thrown.
  function describe(error) {
    if (error instanceof AssertionError) return error.message;
    if (!(error instanceof Error)) return String(error);
    const origin = (error.stack || '').split('\n').find(line => line.trim().startsWith('at '));
    return `${error.name}: ${error.message}` + (origin ? ` (${origin.trim()})` : '');
  }

  function withTimeout(promise) {
    let timer;
    const timeout = new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(new AssertionError(`timed out after ${TEST_TIMEOUT_MS / 1000} s`)), TEST_TIMEOUT_MS);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }

  async function runAll() {
    const results = { passed: [], failed: [] };
    for (const { name, fn } of registered) {
      try {
        await withTimeout(Promise.resolve().then(fn));
        results.passed.push(name);
      } catch (error) {
        results.failed.push({ name, message: describe(error) });
      }
    }
    window.testResults = results;
    showResults(results);
    finish(results);
  }

  function showResults({ passed, failed }) {
    const summary = document.getElementById('summary');
    const list = document.getElementById('failures');
    if (summary) summary.textContent = `${passed.length} passed, ${failed.length} failed`;
    if (list) {
      for (const { name, message } of failed) {
        const item = document.createElement('li');
        item.textContent = `${name}: ${message}`;
        list.append(item);
      }
    }
  }

  window.addEventListener('load', runAll);
})();
