import test from 'node:test';
import assert from 'node:assert/strict';
import { waveLines, waveRun, WAVE_MARGIN, WAVE_GAP, WAVE_MIN } from '../src/wavetest.js';
import { hereOf, CANVAS } from '../src/canvas.js';

// The wave test (the owner, 2026-10-29: the 40 × 40 canvas on the machine)
const len = l => Math.hypot(l.b[0] - l.a[0], l.b[1] - l.a[1]);
const dirOf = l => [(l.b[0] - l.a[0]) / len(l), (l.b[1] - l.a[1]) / len(l)];
const cross = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
const meet = (l, m) => cross(l.a, l.b, m.a) * cross(l.a, l.b, m.b) < 0 && cross(m.a, m.b, l.a) * cross(m.a, m.b, l.b) < 0;

test('wave test: 14 lines on the 400 × 400, in from the edges, none crossing another', () => {
  const T = waveLines(400, 400);
  assert.equal(T.lines.length, 14);
  for (const l of T.lines) for (const q of [l.a, l.b]) {
    assert.ok(q[0] >= WAVE_MARGIN - 1e-9 && q[0] <= 400 - WAVE_MARGIN + 1e-9 && q[1] >= WAVE_MARGIN - 1e-9 && q[1] <= 400 - WAVE_MARGIN + 1e-9, `${l.side} ${l.dir} off the margin`);
  }
  T.lines.forEach((l, i) => T.lines.slice(i + 1).forEach(m => assert.ok(!meet(l, m), `${l.side} ${l.dir} crosses ${m.side} ${m.dir}`)));
  assert.ok(T.b * Math.SQRT2 > 150, 'the diagonals long enough to see a wave');
});

test('wave test: every pair one line each way, WAVE_GAP apart; the left column and the right alike', () => {
  const T = waveLines(400, 400), pairs = {};
  for (const l of T.lines) (pairs[`${l.side} ${l.pair}`] ||= []).push(l);
  assert.equal(Object.keys(pairs).length, 7);
  for (const [k, [p, q]] of Object.entries(pairs)) {
    const u = dirOf(p), v = dirOf(q);
    assert.ok(Math.abs(u[0] + v[0]) < 1e-9 && Math.abs(u[1] + v[1]) < 1e-9, `${k}: not opposite`);
    assert.ok(Math.abs(len(p) - len(q)) < 1e-9, `${k}: not as long`);
    assert.ok(Math.abs(Math.abs(cross(p.a, p.b, q.a)) / len(p) - WAVE_GAP) < 1e-9, `${k}: not ${WAVE_GAP} mm apart`);
    assert.ok(['→', '↘', '↗', '↑'].includes(p.dir) || ['→', '↘', '↗', '↑'].includes(q.dir), `${k}: no first line`);
  }
  const L = T.lines.filter(l => l.side === 'left'), R = T.lines.filter(l => l.side === 'right'), dx = 400 - 2 * L[0].a[0] - T.w;
  for (const l of L) {
    const r = R.find(m => m.dir === l.dir);
    assert.deepEqual([r.a[0] - dx, r.a[1], r.b[0] - dx, r.b[1]].map(v => +v.toFixed(9)), [l.a[0], l.a[1], l.b[0], l.b[1]].map(v => +v.toFixed(9)), `${l.dir}: the right not the left's`);
  }
});

test('wave test: a canvas too small says so; a tall one keeps the diagonals at 45°', () => {
  const s = waveLines(150, 150);
  assert.equal(s.lines.length, 0);
  assert.match(s.why, /too small/);
  const T = waveLines(500, 700);
  for (const l of T.lines.filter(l => l.pair === '/' || l.pair === '\\')) assert.ok(Math.abs(Math.abs(dirOf(l)[0]) - Math.SQRT1_2) < 1e-9);
  assert.ok(T.b >= WAVE_MIN);
});

test('wave test run: one path, the pencil pressed on the lines and up between, every line drawn, home at the end', () => {
  const W = 400, H = 400, C = { ...CANVAS, boardW: W, boardH: H }, here = hereOf(C);
  const T = waveRun(W, H, { here, speed: 60, travel: 180, press: 3.6, glide: 6.6 });
  assert.equal(T.fault, '');
  assert.ok(Math.abs(T.length - T.mm) < 0.5, `${T.length} mm painted, ${T.mm} mm drawn`);
  const ws = T.blocks.filter(b => b.kind === 'move').flatMap(b => b.cmds).filter(c => /^W 2 /.test(c)).map(c => +c.split(' ')[2]);
  assert.ok(ws.length >= 2 * (T.lines.length - 1), 'down and up at every line');
  assert.ok(ws.every(d => d >= 3.6 - 1e-9 && d <= 6.6 + 1e-9), 'the elbow between pressing and the air');
  const arms = T.blocks.filter(b => b.kind === 'arm').map(b => b.cmd);
  assert.ok(arms.includes('J 2 6.6'), 'over the first line in the air, at glide');
  assert.ok(T.blocks.at(-1).home, 'home at the end');
});

// the debug of the pencil's downs (strokes.js, landingCheck), on the wave test's run
import { landingCheck } from '../src/strokes.js';
test('downs debug: every line down at press, up at glide; one down taken out is found', () => {
  const W = 400, H = 400, here = hereOf({ ...CANVAS, boardW: W, boardH: H }), T = waveRun(W, H, { here, speed: 60, travel: 180, press: 3.6, glide: 6.6 });
  const C = landingCheck(T.blocks, 3.6, 6.6);
  assert.ok(C.ok);
  assert.equal(C.lines, T.lines.length);
  assert.equal(C.downs, T.lines.length);
  assert.ok(Math.abs(C.pressed - C.drawn) < 1e-9 && C.drawn > T.mm - 0.1 * 2 * T.lines.length, 'all drawn but the 0.05 mm tails');
  const drop = cmds => { const at = cmds.map((c, i) => /^W 2 3\.6 /.test(c) ? i : -1).filter(i => i >= 0)[5]; return cmds.filter((c, i) => i !== at); };   // the sixth line's down
  const cut = T.blocks.map(b => b.kind === 'move' && b.paintMM > 0 ? { ...b, cmds: drop(b.cmds) } : b);
  const D = landingCheck(cut, 3.6, 6.6);
  assert.equal(D.ok, false);
  assert.ok(D.bad.length > 0 && D.bad.every(q => q.deg === 6.6), 'the line after it drawn with the pencil up');
});
