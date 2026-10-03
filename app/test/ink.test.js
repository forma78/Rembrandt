import test from 'node:test';
import assert from 'node:assert/strict';
import { CUP, cupOf, cupProblem } from '../src/ink.js';

test('a cup not set yet: the owner\'s ⌀50 × 20, the elbow est., no centre — and it says so', () => {
  const c = cupOf({});
  assert.equal(c.x, null);
  assert.deepEqual([c.diameter, c.height, c.rim, c.dip, c.dwell], [CUP.diameter, CUP.height, CUP.rim, CUP.dip, CUP.dwell]);
  assert.deepEqual(c.est, { rim: true, dip: true }, 'only the elbow\'s two are guesses');
  assert.match(cupProblem(c), /not set/);
});

test('typed numbers replace the defaults and are est. no more', () => {
  const c = cupOf({ cup: { x: 400, y: 92.5, rim: 30, dip: 3, dwell: 1.5 } });
  assert.deepEqual([c.x, c.y, c.rim, c.dip, c.dwell], [400, 92.5, 30, 3, 1.5]);
  assert.deepEqual(c.est, {});
  assert.equal(cupProblem(c), '');
});

test('the elbow is checked: over the rim well off the canvas, in the cup below it, within reach', () => {
  const at = { x: 400, y: 90 };
  assert.match(cupProblem(cupOf({ cup: { ...at, rim: 12 } })), /Over the rim/);
  assert.match(cupProblem(cupOf({ cup: { ...at, rim: 50 } })), /Over the rim/);
  assert.match(cupProblem(cupOf({ cup: { ...at, rim: 30, dip: 28 } })), /In the cup/);
  assert.match(cupProblem(cupOf({ cup: { ...at, dip: -6 } })), /In the cup/);
  assert.match(cupProblem(cupOf({ cup: { ...at, dwell: 12 } })), /In the paint/);
  assert.equal(cupProblem(cupOf({ cup: { ...at, dip: -5 } })), '', 'the reserve is allowed, as on Calibration');
});
