import test from 'node:test';
import assert from 'node:assert/strict';
import { CUP, HAND, cupOf, tableOf, handOf, cupProblem, canvasFrom, dipAt } from '../src/ink.js';

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

// ---------- INK-Y (the owner, 2026-11-03): the cup at hand, README's How to dip ----------
test('INK-Y: once on, every dip goes to the cup at hand — his forks till typed, no place to take', () => {
  const table = { x: 653.13, y: 0.11, rim: 24, dip: -5, diameter: 50 };
  assert.equal(cupOf({ cup: table }).hand, undefined, 'none at hand: the Ink tab\'s, as before');
  assert.equal(cupOf({ cup: table, hand: { dip: 15 } }).hand, undefined, 'not on: the Ink tab\'s still');
  const c = cupOf({ cup: table, hand: { on: true } });
  assert.deepEqual([c.hand, c.x, c.y, c.up, c.to, c.dip, c.paint, c.dwell, c.swing, c.diameter], [true, null, null, [30, 35], [30, 35], 15, [14, 16], 1, HAND.swing, 57]);
  assert.deepEqual(c.est, { swing: true }, 'the shoulder\'s speed a guess; his angles measured');
  assert.equal(cupProblem(c), '');
  assert.equal(dipAt(c), null, 'the carriage dips where it stands');
  assert.deepEqual(tableOf({ cup: table, hand: { on: true } }), tableOf({ cup: table }), 'the Ink tab keeps its own');
  const own = handOf({ hand: { on: true, up: [31, 34], to: [32, null], dip: 14, swing: 30 } });
  assert.deepEqual([own.up, own.to, own.dip, own.paint, own.swing, own.est], [[31, 34], [32, 35], 14, [14, 15], 30, {}], 'in the paint within 1° of it, never below +14');
});

test('INK-Y: the forks checked — the elbow up over the paint, the shoulder clear of 0, in the paint +14…+16', () => {
  const p = h => cupProblem(handOf({ hand: { on: true, ...h } }));
  assert.match(p({ up: [30, 30.5] }), /ELBOW up/, 'a whole step must land in it');
  assert.match(p({ up: [18, 35] }), /ELBOW up/);
  assert.match(p({ to: [-1, 3] }), /SHOULDER/);
  assert.match(p({ to: [30, 50] }), /SHOULDER/);
  assert.match(p({ dip: 13 }), /in the paint/);
  assert.match(p({ dip: 17 }), /in the paint/);
  assert.match(p({ swing: 500 }), /°\/s/);
  assert.equal(p({ to: [-35, -30] }), '', 'the other side would do too');
});
