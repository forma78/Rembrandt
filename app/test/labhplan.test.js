import test from 'node:test';
import assert from 'node:assert/strict';
import { labPlan, sheetHolo, SH } from '../src/labplan.js';

// LAB-H, HOLO's sheet (HOLO-Claude/HOLO.md, "LAB first"; the owner, 2026-11-14): a dab, how far a puddle lasts, run 1, the open time — one jar, a 20 × 20.
const CUP = { hand: true, on: true, up: [30, 35], to: [30, 35], dip: 15, paint: [14, 16], dwell: 1, swing: 40 };
const plan = (o = {}) => labPlan({ x0: 200, y0: 150, cup: CUP, sheet: 19, ...o });
const along = r => r.pts.every(p => p.y === r.pts[0].y) && r.pts.at(-1).x > r.pts[0].x;

test('LAB-H: A five puddles, B four, C three legs, D four laid and four dragged; every leg up X, only up and down', () => {
  const Q = sheetHolo(), by = k => Q.filter(q => q.say.startsWith(k));
  assert.equal(Q.length, 20);
  assert.deepEqual(['A', 'B', 'C', 'D'].map(k => by(k).length), [5, 4, 3, 8]);
  for (const q of Q) for (const r of q.seq) assert.ok(along(r), q.say);
  // a dab: 8 mm on a dip of its own; a stroke 150 mm, no dip
  for (const q of Q) for (const r of q.seq) {
    const len = r.pts.at(-1).x - r.pts[0].x;
    if (r.dip) assert.equal(len, SH.dab); else assert.equal(len, SH.leg[1] - SH.leg[0]);
  }
  // A's dabs on the same 8 mm, or end to end
  assert.deepEqual(by('A').map(q => q.seq.map(r => r.pts[0].x)), [[12], [12, 12], [12, 20], [12, 12, 12], [12, 20, 28]]);
  // B: 1 … 4 dabs at the leg's foot, then its stroke from there
  assert.deepEqual(by('B').map(q => q.seq.filter(r => r.dip).length), [1, 2, 3, 4]);
  for (const q of by('B')) assert.ok(!q.seq.at(-1).dip && q.seq.at(-1).pts[0].x === q.seq[0].pts[0].x);
  // C: a puddle every 30, 40, 55 mm at most, 4 mm in from the leg's ends
  for (const [i, g] of SH.gaps.entries()) {
    const xs = by('C')[i].seq.filter(r => r.dip).map(r => r.pts[0].x);
    assert.ok(xs[0] === SH.leg[0] + SH.inset && xs.at(-1) === SH.leg[1] - SH.inset);
    xs.slice(1).forEach((x, k) => assert.ok(x - xs[k] <= g + 1e-9 && x - xs[k] > g * 0.6, `${g}: ${xs}`));
  }
});

test('LAB-H: D dragged 30, 20, 10, 5 min after it was laid (est., the plan\'s clock), the brush in the jar between', () => {
  const Q = sheetHolo(), lays = Q.filter(q => q.say.includes('dragged at the end')), drags = Q.filter(q => q.strokeAt != null);
  SH.ages.forEach((age, k) => assert.ok(Math.abs(drags[k].strokeAt - lays[k].t1 - age * 60) < 1, `${age} min: ${(drags[k].strokeAt - lays[k].t1) / 60}`));
  for (let k = 1; k < Q.length; k++) assert.ok(Q[k].t0 >= Q[k - 1].t1 - 1e-9, 'one after another');
  assert.ok(lays.slice(1).every(q => q.parkS > 0), 'the brush waits in the jar before a later puddle');
  const P = plan();
  assert.equal(P.blocks.filter(b => b.kind === 'pause').length, 0, 'one jar: no pause');
  const waited = P.blocks.filter(b => b.kind === 'wait' && b.dip).reduce((t, b) => t + b.s, 0);
  assert.ok(waited > 20 * 60, `${waited} s in the jar`);
  assert.ok(P.seconds > 35 * 60 && P.seconds < 50 * 60, `${P.seconds} s`);
});

test('LAB-H: on the 20 × 20 at its corner, the journal\'s one jar, every run its row', () => {
  const P = plan({ jar: { name: 'Jar 45', hex: '#3C0608' } });
  assert.ok(P.bounds.x1 <= 200 + SH.size && P.bounds.y0 >= 150 && P.bounds.y1 <= 150 + SH.size, JSON.stringify(P.bounds));
  assert.deepEqual(P.remote.colours.map(c => c.name), ['LAB-H · HOLO · Jar 45']);
  assert.equal(P.remote.rows.length, P.runs.length);
  assert.ok(P.strokes.every(q => q.jar === 'Jar 45' && q.holo.length === sheetHolo().find((_, i) => i === q.n - 1).seq.length));
  assert.equal(P.runs.filter(r => r.dip).length, 4 * 0 + 1 + 2 + 2 + 3 + 3 + 1 + 2 + 3 + 4 + 6 + 5 + 4 + 4 * 2 + 4);
});
