import test from 'node:test';
import assert from 'node:assert/strict';
import { xyPlan, PATTERNS } from '../src/strokes.js';

test('A and B fit the 30 × 30 board inside its margins', () => {
  for (const k of ['A', 'B']) {
    const p = xyPlan({ ...PATTERNS[k] });
    assert.ok(p.fits, `${k}: ${p.width} × ${p.height} in ${p.room}`);
    for (const line of p.preview) for (const q of line) assert.ok(Math.abs(q.x) <= p.room / 2 + 1e-6 && Math.abs(q.y) <= p.room / 2 + 1e-6, `${k}: ${q.x}, ${q.y}`);
  }
});

test('a row is a hairpin of the plotter: a line out, a half circle round on the right, a line back', () => {
  const p = xyPlan({ ...PATTERNS.B, here: { x: 400, y: 280 }, pause: false });
  const row = p.blocks.filter(b => b.row === 1);
  assert.deepEqual(row.map(b => b.kind === 'arm' ? b.cmd : b.cmds[1].split(' ')[0]), ['M', 'J 3 0', 'L', 'J 3 -54']);
  const paint = row[2].cmds;
  const x = 400 + p.height / 2, left = 280 - p.width / 2, right = left + 220;
  assert.equal(paint[1], `L ${x.toFixed(2)} ${right.toFixed(2)}`);
  const arc = paint.find(c => c.startsWith('A '));
  assert.equal(arc, `A ${(x - 10).toFixed(2)} ${right.toFixed(2)} ${(x - 20).toFixed(2)} ${right.toFixed(2)} 1`, '+1: from +X to +Y, the turn bulges to the right');
  assert.equal(paint.at(-2), `L ${(x - 20).toFixed(2)} ${left.toFixed(2)}`);
  assert.ok(paint.every(c => /^[FLAG]/.test(c)), 'only speeds, lines, arcs and go: the runner sends them as they are');
  assert.equal(p.blocks.at(-1).cmds[1], 'M 400.00 280.00', 'back to Here at the end');
});

test('the tight turn of A is slowed to what the arc allows, and back', () => {
  const p = xyPlan({ ...PATTERNS.A, speed: 60 });
  const cmds = p.blocks.find(b => b.row === 1 && b.paintMM).cmds;
  const i = cmds.findIndex(c => c.startsWith('A '));
  assert.ok(+cmds[i - 1].split(' ')[1] < 60 && cmds[i + 1] === 'F 60', cmds.join(' | '));
});

test('a pause for paint after every row but the last; too many rows do not fit', () => {
  assert.equal(xyPlan({ ...PATTERNS.A }).blocks.filter(b => b.kind === 'pause').length, PATTERNS.A.rows - 1);
  assert.ok(!xyPlan({ rows: 12, pitch: 25 }).fits);
});

test('the box the brush covers, from Here: for the walls check', () => {
  const p = xyPlan({ ...PATTERNS.A });
  assert.ok(Math.abs(p.box.x1 - p.height / 2) < 1e-9 && Math.abs(p.box.x0 + p.height / 2) < 1e-9);
  assert.ok(Math.abs(p.box.y0 + p.width / 2) < 1e-9 && Math.abs(p.box.y1 - p.width / 2) < 1e-9);
  const big = xyPlan({ rows: 11, pitch: 25 });
  assert.ok(!big.fits && big.blocks.length > 0, 'past the margins still makes a plan');
});

test('C, the snake: one path, the brush down once, the turns round on the right and on the left by turns', () => {
  const p = xyPlan({ ...PATTERNS.C, here: { x: 400, y: 280 } });
  assert.ok(p.fits, `${p.width} × ${p.height} in ${p.room}`);
  assert.equal(p.blocks.filter(b => b.cmd === 'J 3 0').length, 1, 'the brush goes down once');
  assert.equal(p.blocks.filter(b => b.kind === 'pause').length, 0, 'no pause in a continuous line');
  const cmds = p.blocks.find(b => b.paintMM).cmds;
  const arcs = cmds.filter(c => c.startsWith('A '));
  assert.equal(arcs.length, PATTERNS.C.rows - 1);
  assert.deepEqual(arcs.map(a => a.split(' ').at(-1)), arcs.map((_, i) => i % 2 ? '-1' : '1'));
  const lines = cmds.filter(c => c.startsWith('L '));
  assert.equal(lines.length, PATTERNS.C.rows);
  assert.equal(lines[0].split(' ')[2], (280 + 110).toFixed(2), 'row 1 ends on the right');
  assert.equal(lines[1].split(' ')[2], (280 - 110).toFixed(2), 'row 2 ends on the left');
  assert.equal(p.blocks.find(b => b.paintMM).painted.length, 2 * PATTERNS.C.rows - 1);
  for (const q of p.preview[0]) assert.ok(q.y >= p.box.y0 - 1e-9 && q.y <= p.box.y1 + 1e-9 && q.x >= p.box.x0 - 1e-9 && q.x <= p.box.x1 + 1e-9);
});
