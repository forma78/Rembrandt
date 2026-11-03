import test from 'node:test';
import assert from 'node:assert/strict';
import { CUP, BEAM, cupOf, tableOf, beamOf, cupProblem, canvasFrom, dipAt } from '../src/ink.js';

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

test('the canvas from the cup: its left edge to the right, its bottom below — the centre half the canvas on from them', () => {
  const ink = { cup: { x: 400, y: 20 }, canvas: { left: 40, bottom: 500 } };
  assert.deepEqual(canvasFrom(ink, 500, 700), { x: 400 - 500 + 350, y: 20 + 40 + 250, left: 40, bottom: 500 });
  assert.equal(canvasFrom({ cup: { x: 400, y: 20 }, canvas: { left: 40 } }, 500, 700), null, 'one number is not enough');
  assert.equal(canvasFrom({ canvas: { left: 40, bottom: 500 } }, 500, 700), null, 'nor without the cup');
});

test('a cup a hair past the left wall: the brush dips just inside it; far past: refused', () => {
  const first = cupOf({ cup: { x: 390.18, y: -0.37 } });   // the owner's first cup, 2026-10-03
  const d = dipAt(first);
  assert.deepEqual([d.x, d.y], [390.18, 0.1]);
  assert.ok(Math.abs(d.off - 0.47) < 1e-9);
  assert.equal(cupProblem(first), '');
  assert.deepEqual(dipAt(cupOf({ cup: { x: 400, y: 20 } })), { x: 400, y: 20, off: 0 }, 'inside: the centre itself');
  assert.match(cupProblem(cupOf({ cup: { x: 400, y: -15 } })), /past the machine's walls/);
});

// ---------- INK-Y (the owner, 2026-11-03): the cup on the beam ----------
test('INK-Y: once its Y and the shoulder are set, every dip goes to the cup on the beam — the elbow\'s numbers the Ink tab\'s till typed', () => {
  const table = { x: 653.13, y: 0.11, rim: 24, dip: -5, diameter: 50 };
  assert.equal(cupOf({ cup: table }).beam, undefined, 'none on the beam: the Ink tab\'s, as before');
  assert.equal(cupOf({ cup: table, beam: { y: 30 } }).beam, undefined, 'its Y alone is not enough');
  const c = cupOf({ cup: table, beam: { y: 30, shoulder: -25.1 } });
  assert.deepEqual([c.beam, c.x, c.y, c.shoulder, c.rim, c.dip, c.dwell, c.diameter, c.swing], [true, null, 30, -25.1, 24, -5, 1, BEAM.diameter, BEAM.swing]);
  assert.deepEqual(c.est, { swing: true }, 'the elbow measured on the Ink tab; the shoulder\'s speed a guess');
  assert.equal(cupProblem(c), '');
  assert.deepEqual(tableOf({ cup: table, beam: { y: 30, shoulder: -25.1 } }), tableOf({ cup: table }), 'the Ink tab keeps its own');
  const own = cupOf({ cup: table, beam: { y: 30, shoulder: -25.1, rim: 30, dip: -3, swing: 20 } });
  assert.deepEqual([own.rim, own.dip, own.swing, own.est], [30, -3, 20, {}]);
});

test('INK-Y: its Y inside the walls, its X the beam\'s; the shoulder and its speed checked', () => {
  const c = cupOf({ beam: { y: 30, shoulder: -25.1 } });
  assert.deepEqual(dipAt(c), { x: null, y: 30, off: 0 });
  assert.match(cupProblem(cupOf({ beam: { y: 30, shoulder: -60 } })), /shoulder/);
  assert.match(cupProblem(cupOf({ beam: { y: 30, shoulder: -25, swing: 500 } })), /°\/s/);
  assert.match(cupProblem(cupOf({ beam: { y: -40, shoulder: -25 } })), /past the machine's walls/);
  assert.match(cupProblem(beamOf({})), /INK-Y/);
});
