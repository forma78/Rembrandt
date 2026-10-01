import test from 'node:test';
import assert from 'node:assert/strict';
import { armPlan, tipAt, PATTERNS, DEFAULTS } from '../src/strokes.js';

test('pattern A fits the 30 × 30 board: about 22 cm wide, the rows inside the margins', () => {
  const p = armPlan({ ...PATTERNS.A });
  assert.ok(p.fits, `${p.width} × ${p.height} in ${p.room}`);
  assert.ok(Math.abs(p.width - 220.5) < 1, `width ${p.width}`);
  assert.ok(Math.abs(p.sag - 31.6) < 0.2, `the ends lie ${p.sag} mm lower than the middle`);
  for (const line of p.preview) for (const q of line) assert.ok(Math.abs(q.x) <= p.room / 2 + 1e-6 && Math.abs(q.y) <= p.room / 2 + 1e-6);
});

test('a row is a hairpin: out on the arc, down by the turn with the brush on, back, the brush off', () => {
  const p = armPlan({ ...PATTERNS.B, here: { x: 400, y: 280 }, pause: false });
  const row = p.blocks.filter(b => b.row === 1).map(b => b.kind === 'joint' ? `S${b.deg}@${b.speed}` : b.kind === 'arm' ? b.cmd : b.cmds[1]);
  assert.deepEqual(row, ['S-32@53', `M ${(400 + p.height / 2).toFixed(1)} 280.0`, 'J 3 0', 'S32@10', `M ${(400 + p.height / 2 - 20).toFixed(1)} 280.0`, 'S-32@10', 'J 3 -54']);
  assert.equal(p.blocks[0].cmd, 'J 3 -54', 'the brush off before anything');
  assert.deepEqual(p.blocks.at(-1).cmds[1], 'M 400.0 280.0', 'back to Here at the end');
});

test('a pause for paint after every row but the last', () => {
  const p = armPlan({ ...PATTERNS.A });
  assert.equal(p.blocks.filter(b => b.kind === 'pause').length, PATTERNS.A.rows - 1);
  assert.equal(armPlan({ ...PATTERNS.A, pause: false }).blocks.filter(b => b.kind === 'pause').length, 0);
});

test('the shoulder takes the brush to the right; the ends lie lower than the middle', () => {
  const o = { ...DEFAULTS };
  const l = tipAt(o, 0, 0, -32), m = tipAt(o, 0, 0, 0), r = tipAt(o, 0, 0, 32);
  assert.ok(l.y < 0 && r.y > 0 && Math.abs(m.y) < 1e-9);
  assert.ok(l.x < m.x && Math.abs(l.x - r.x) < 1e-9);
  assert.ok(!armPlan({ rows: 12, pitch: 25 }).fits, 'too many rows do not fit');
});
