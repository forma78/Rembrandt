import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanCloth, rectOf, familiesOf, familyLanes, windowOf, laneOrder, aOver, onTop, crossAt, hopsOf, strokeOf, piecesOf, planOf, toCanvas, bowsOf, dragRows, runPasses, dragSvg, marksRows, mixAll, inFar,
  ANGLE_NEW, STEP_NEW, ROWS_NEW, BRUSH_NEW, HOP_NEW, RUNOUT_NEW, MARGIN_NEW, CLEAR_NEW, OVERLAP_NEW, MIN_PRESS, LOOM_TONES, TURN_WHY } from '../src/loomplan.js';
import { newPattern } from '../src/biasplan.js';
import { DEFAULTS } from '../src/strokes.js';
import { PAINT } from '../src/tapeplan.js';

// LOOM's plan, Claude's tab (2026-10-16): the canvas one cloth of strips
// square to each other, laid in turn as BIAS SNAKE, the elbow hopping over
// the strips a strip goes under — Plain, Twill, Basket, Lattice; a canvas
// past the reach in two halves, the canvas turned round between.
const O = { cw: 300, ch: 300, brush: BRUSH_NEW, hop: HOP_NEW, tail: 1.5, runout: RUNOUT_NEW, margin: MARGIN_NEW, clear: CLEAR_NEW, overlap: OVERLAP_NEW };
const RUN = { ...DEFAULTS, snake: true, pause: false, lift: true, tail: 1.5, speed: 30, travel: 180, ink: false, here: { x: 200, y: 300 } };
const close = (a, b, msg, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${msg}: ${a} ≠ ${b}`);
const cloth = o => cleanCloth(o);

test('a cloth as kept: 45°, a step of 9 mm, Plain, three rows, the crossing from the top right, one run', () => {
  const c = cloth();
  assert.equal(c.angle, ANGLE_NEW); assert.equal(c.angle, 45); assert.equal(c.step, STEP_NEW); assert.equal(c.weave, 'plain'); assert.equal(c.rows, ROWS_NEW); assert.equal(c.from2, 'tr'); assert.equal(c.halves, 'one');
  assert.equal(cloth({ angle: 120 }).angle, 85); assert.equal(cloth({ weave: 'satin' }).weave, 'plain'); assert.equal(cloth({ halves: 'lr' }).halves, 'lr');
  assert.equal(cleanCloth(null).step, 9);
  for (const t of Object.values(LOOM_TONES)) for (const id of [...t.core, ...t.accent]) assert.ok(PAINT[id], `${t.name}: ${id} a paint of the strip`);
});

test('the lattice from the centre: a lane of each family through it, so turned 180° it is itself', () => {
  const [A, B] = familiesOf(45);
  close(A.u[0] * B.u[0] + A.u[1] * B.u[1], 0, 'square');
  for (const F of [A, B]) {
    const L = familyLanes(F, 300, 200, 9), k0 = L.find(l => l.k === 0), mid = [(k0.a[0] + k0.b[0]) / 2, (k0.a[1] + k0.b[1]) / 2];
    close(F.n[0] * (mid[0] - 150) + F.n[1] * (mid[1] - 100), 0, 'lane 0 through the centre');
    const ks = L.map(l => l.k);
    assert.deepEqual(ks.map(k => 0 - k).sort((a, b) => a - b), ks, 'the lanes −k as the lanes k');
  }
});

test('the run in turn: a rising lane ↙ from the bottom right corner, a crossing one ↘ from the top right, …', () => {
  const c = cloth(), L = laneOrder(c, 300, 300, windowOf('one', 300, 300));
  assert.equal(L[0].fam, 'A'); assert.equal(L[1].fam, 'B'); assert.equal(L[2].fam, 'A');
  assert.ok(L[0].u[0] < 0 && L[0].u[1] < 0, 'the rising ones run down to the left');
  assert.ok(L[1].u[0] > 0 && L[1].u[1] < 0, 'the crossing ones down to the right');
  assert.ok(L[0].from[0] > 250 && L[0].to[1] < 50, 'the first rising lane by the bottom right corner');
  assert.ok(L[1].from[1] > 250 && L[1].to[0] > 250, 'the first crossing one by the top right corner');
  L.forEach((l, i) => assert.equal(l.pos, i));
  const U = laneOrder(cloth({ from2: 'bl' }), 300, 300, windowOf('one', 300, 300));
  assert.ok(U[1].u[0] < 0 && U[1].u[1] > 0, 'from the bottom left: up to the left');
  assert.ok(U[1].from[0] < 50 && U[1].from[1] < 50 + 1e-6, '… by the bottom left corner');
  const T = laneOrder(c, 300, 300, windowOf('one', 300, 300), true);
  T.forEach((l, i) => assert.equal(l.ko, 0 - L[i].k), 'turned: its index on the canvas as it lay first');
});

test('the weaves: Plain a chessboard, Twill two and two, Basket in pairs, Lattice none', () => {
  assert.equal(aOver('plain', 0, 0), true); assert.equal(aOver('plain', 1, 0), false); assert.equal(aOver('plain', -3, 1), true);
  assert.deepEqual([0, 1, 2, 3, 4].map(i => aOver('twill', i, 0)), [true, true, false, false, true]);
  assert.deepEqual([0, 1, 2, 3].map(i => aOver('basket', i, 0)), [true, true, false, false]);
  assert.equal(aOver('basket', -1, 0), false, 'pairs on the minus side too: −2 and −1 together');
  assert.equal(aOver('lattice', 0, 0), null);
  const a = { fam: 'A', ko: 1 }, b = { fam: 'B', ko: 2 };
  assert.equal(onTop('plain', a, b), false); assert.equal(onTop('plain', b, a), true); assert.equal(onTop('lattice', a, b), null);
});

test('the hops: a lane goes up over every earlier strip it should go under, a brush wide and the clearance either side', () => {
  const c = cloth(), L = laneOrder(c, 300, 300, windowOf('one', 300, 300)), H = hopsOf(L, 'plain', O);
  let n = 0;
  for (const P of L) for (const Q of L) {
    if (P.fam === Q.fam || Q.pos > P.pos) continue;
    const X = crossAt(P, Q);
    if (!X || X.s < 0 || X.s > P.len || X.t < 0 || X.t > Q.len) continue;
    const hopped = H[P.pos].some(([a, b]) => a <= X.s && X.s <= b);
    assert.equal(hopped, !onTop('plain', P, Q), `lane ${P.pos} at lane ${Q.pos}: up where it goes under`);
    n++;
  }
  assert.ok(n > 500, `a 30 × 30 crosses itself many times: ${n}`);
  const w = H.flat().map(([a, b]) => b - a);
  assert.ok(w.every(x => x >= BRUSH_NEW + 2 * HOP_NEW - 1e-6), 'every hop at least the strip and the clearance');
  for (const h of H) for (let i = 1; i < h.length; i++) assert.ok(h[i][0] - h[i - 1][1] >= MIN_PRESS - 1e-9, 'hops apart, or one');
  assert.equal(hopsOf(L, 'lattice', O).flat().length, 0, 'Lattice: no hop');
});

test('Plain at a 9 mm step: under one strip, over the next — every hop alone, the brush down between', () => {
  const c = cloth(), L = laneOrder(c, 300, 300, windowOf('one', 300, 300)), H = hopsOf(L, 'plain', O);
  const long = L.reduce((a, l) => l.len > a.len ? l : a);
  const h = H[long.pos], gaps = h.slice(1).map((q, i) => q[0] - h[i][1]);
  assert.ok(h.length > 5);
  for (const g of gaps) assert.ok(Math.abs(g - (2 * 9 - (BRUSH_NEW + 2 * HOP_NEW))) < 1e-6 || g > 2 * 9, `down 2 steps less a hop between: ${g}`);
  const T = hopsOf(L, 'twill', O)[long.pos];
  assert.ok(T.some(([a, b]) => b - a > 9 + BRUSH_NEW), 'Twill: under two strips at a time, one hop');
});

test('a stroke: 30 mm off the canvas at both ends, within the margin; its hops along it; trimmed where a hop takes an end', () => {
  const c = cloth(), L = laneOrder(c, 300, 300, windowOf('one', 300, 300)), H = hopsOf(L, 'plain', O);
  for (const [j, l] of L.entries()) {
    const st = strokeOf(l, H[j], O);
    if (!st) continue;
    for (const p of [st.P0, st.P1]) {
      const out = Math.max(-p[0], -p[1], p[0] - 300, p[1] - 300);
      if (st.outA && p === st.P0 || st.outB && p === st.P1) assert.ok(out > 0 && out <= MARGIN_NEW - BRUSH_NEW / 2 + 1e-6, `lane ${j}: off the canvas, inside the margin (${out})`);
    }
    for (const [a, b] of st.hops) assert.ok(a >= MIN_PRESS - 1e-9 && b <= st.len - MIN_PRESS + 1e-9, 'a hop never at an end');
    const P = piecesOf(st);
    close(P[0][0], 0, 'from its start'); close(P.at(-1)[1], st.len, 'to its end');
    for (let i = 1; i < P.length; i++) { close(P[i][0], P[i - 1][1], 'piece after piece'); assert.notEqual(P[i][2], P[i - 1][2], 'down, up, down'); }
  }
  const lone = strokeOf({ ...L[5], len: L[5].len }, [[-5, L[5].len + 5]], O);
  assert.equal(lone, null, 'a hop over all of it: nothing left');
});

test('one run: the snake keeps the brush down off the canvas between lanes, or flies; Air a landing a lane', () => {
  const c = cloth(), P = planOf(c, O), run = P.runs[0], S = bowsOf(run, O, true), A = bowsOf(run, O, false);
  assert.equal(P.runs.length, 1);
  assert.equal(A.length, run.strokes.filter(Boolean).length, 'Air: a landing a lane');
  assert.ok(S.length < A.length, 'the snake lands fewer times');
  assert.deepEqual(S.flatMap(w => w.lanes), A.flatMap(w => w.lanes), 'every lane once, in turn');
  for (const w of S) for (const g of w.pieces) if (!g.hop) {
    // a piece with the brush down: on a lane, or off the canvas at least the clearance
    const inLane = run.strokes.some(st => st && Math.abs((g.a[0] - st.P0[0]) * st.u[1] - (g.a[1] - st.P0[1]) * st.u[0]) < 1e-6 && Math.abs((g.b[0] - st.P0[0]) * st.u[1] - (g.b[1] - st.P0[1]) * st.u[0]) < 1e-6);
    if (!inLane) for (const q of [g.a, g.b]) assert.ok(Math.max(-q[0], -q[1], q[0] - 300, q[1] - 300) >= BRUSH_NEW / 2 + CLEAR_NEW - 1e-6, 'a step off the canvas, clear');
  }
});

test('DRAG to the machine: the hops lift the elbow on the move, a W up and a W down, the brush down between', () => {
  const c = cloth(), P = planOf(c, O), D = dragRows(P, { ...O, mode: 'snake' });
  assert.equal(D.passes.length, 1); assert.equal(D.passes[0].why, null);
  const hops = D.passes[0].ps.flat().filter(g => g.turn).length;
  assert.ok(hops >= P.hops, 'every hop a turn piece');
  const R = runPasses(D.passes, { ...RUN, pauseAtEnds: true });
  assert.equal(R.fault, '', R.fault);
  const W = R.blocks.filter(b => b.kind === 'move').flatMap(b => b.cmds).filter(c => c.startsWith('W 2'));
  assert.ok(W.filter(c => c.startsWith('W 2 25')).length >= P.hops, 'up through every hop');
  assert.ok(R.blocks.filter(b => b.kind === 'pause').length === 0, 'one run: no pause');
  const DA = dragRows(P, { ...O, mode: 'air' }), air = runPasses(DA.passes, RUN);
  assert.ok(DA.runs > D.runs, 'Air lands more often');
  assert.equal(air.fault, '', air.fault);
  assert.ok(R.need <= 211 + 1e-6, `the elbow keeps up at 30 mm/s with a 1.5 mm tail: ${R.need}°/s`);
  const lat = planOf(cloth({ weave: 'lattice' }), O), RL = runPasses(dragRows(lat, { ...O, mode: 'snake' }).passes, RUN);
  assert.equal(lat.hops, 0);
  assert.equal(RL.blocks.filter(b => b.kind === 'move').flatMap(b => b.cmds).filter(c => c.startsWith('W 2 25')).length, 0, 'Lattice: the elbow never up on the canvas');
});

test('two halves: the near half and the overlap, the canvas turned, the far half — the same strips on from the first', () => {
  const o = { ...O, cw: 600, ch: 400 }, c = cloth({ halves: 'lr' }), P = planOf(c, o);
  assert.equal(P.runs.length, 2); assert.ok(P.runs[1].turned);
  const W = P.runs[0].win;
  assert.equal(W.x1, 300 + OVERLAP_NEW);
  // every point a run paints lies in its half and the overlap, on the canvas as it lay first
  for (const run of P.runs) for (const st of run.strokes) if (st) for (const [a, b, hop] of piecesOf(st)) if (!hop) for (const s of [a, b]) {
    const p = toCanvas(run, [st.P0[0] + st.u[0] * s, st.P0[1] + st.u[1] * s], o);
    if (p[0] > 0 && p[0] < 600 && p[1] > 0 && p[1] < 400) assert.ok(run.turned ? p[0] >= 300 - OVERLAP_NEW - 1e-6 : p[0] <= 300 + OVERLAP_NEW + 1e-6, `half ${run.n}: ${p[0]}`);
  }
  // the turned run's strips are the first's lines: lane k turned is lane −k
  const lines = run => new Set(run.lanes.map(l => `${l.fam}${l.ko}`));
  const a = lines(P.runs[0]), b = lines(P.runs[1]), both = [...a].filter(q => b.has(q));
  assert.ok(both.length > 10, 'the strips crossing the middle painted from both halves');
  const D = dragRows(P, { ...o, mode: 'snake' });
  assert.equal(D.passes.length, 2); assert.equal(D.passes[1].why, TURN_WHY);
  const R = runPasses(D.passes, RUN);
  const pause = R.blocks.findIndex(b => b.kind === 'pause');
  assert.ok(pause > 0 && R.blocks[pause - 1].home, 'the carriage home before the turn');
  assert.equal(R.blocks.filter(b => b.kind === 'pause').length, 1);
  assert.equal(R.fault, '', R.fault);
  // the weave agrees at a crossing painted from both halves: the same strip on top
  const bt = planOf(cloth({ halves: 'bt' }), { ...o, cw: 400, ch: 600 });
  assert.equal(bt.runs[0].win.y1, 300 + OVERLAP_NEW);
});

test('MARKS: a dash a sausage; on a halved canvas the near half\'s, the turn, the far half\'s', () => {
  const o = { ...O, cw: 600, ch: 400 }, c = cloth({ halves: 'lr' }), P0 = planOf(c, o);
  const pat = newPattern(P0.rect, LOOM_TONES['Crimson Ruby'], 7), P = planOf({ ...c, pat }, o), M = marksRows(P, { ...o, ink: true });
  assert.equal(M.passes.length, 2); assert.equal(M.passes[1].why, TURN_WHY);
  assert.ok(M.marks > 10);
  assert.ok(inFar('lr', [400, 10], o) && !inFar('lr', [100, 10], o) && !inFar('one', [500, 10], o));
});

test('the Result: the strips mixed half after half, the brush up over the hops; a tuck at both ends of each', () => {
  const c = cloth(), P0 = planOf(c, O), pat = newPattern(P0.rect, LOOM_TONES['Crimson Ruby'], 3), P = planOf({ ...c, pat }, O);
  const M = mixAll(P, { ...O, mode: 'snake' });
  assert.ok(M.strokes.length > 100);
  assert.equal(M.tucks.length, 2 * P.hops);
  const s = M.strokes.find(q => P.runs[0].strokes[q.j]?.hops.length);
  const st = P.runs[0].strokes[s.j], [a, b] = st.hops[0], i = Math.round(((a + b) / 2) / s.h);
  assert.equal(s.cover[i], 0, 'nothing painted over a hop');
  assert.ok([...s.cover].some(v => v > 0.2), 'the strip painted elsewhere');
});

test('the drag SVG: a path a stretch with the brush down, the hops left out', () => {
  const c = cloth(), P = planOf(c, O), svg = dragSvg(P, O), n = (svg.match(/<path /g) || []).length;
  assert.equal(n, P.lanes + P.hops);
  assert.ok(svg.includes('Plain'));
});
