import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanRect, familiesOf, familyLanes, runsOf, runsTwo, runs90Of, plainOf, straightOf, straightLanes, lanesFor, strokesOf, bowsOf, planOf, snakeOf, airOf, distTo, dragRows, dragPasses, dragSvg, rowsOf, newPattern, recolour, reRows, sausagesOf, stripeAt, marksRows, mixAll,
  ANGLE_NEW, STEP_NEW, ROWS_NEW, CLEAR_NEW, RUNOUT_NEW, BIAS_META, MARKS_DIP } from '../src/biasplan.js';
import { plotRun, DEFAULTS } from '../src/strokes.js';

// BIAS's plan: CCD's rectangles laid with diagonal lanes in four runs (the
// owner, 2026-10-15, BIAS-plaid/): rising every other lane from the bottom
// right corner, descending every other lane from the top right, then the
// lanes skipped; the brush never on a painted lane.
const O = { cw: 200, ch: 200, brush: 6, before: 0, past: 0, clear: CLEAR_NEW };
const RUN = { ...DEFAULTS, snake: true, pause: false, lift: false, tail: 3, speed: 60, travel: 180, ink: false, here: { x: 350, y: 300 } };
const close = (a, b, msg, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${msg}: ${a} ≠ ${b}`);
const sq = () => cleanRect({ x: 0, y: 0, w: 200, h: 200 });

test('a rectangle as kept: the owner\'s 32 mm step, his sketches\' angle, square, three rows', () => {
  const r = sq();
  assert.equal(r.step, STEP_NEW); assert.equal(r.step, 32); assert.equal(r.angle, ANGLE_NEW); assert.equal(r.cross, 'square'); assert.equal(r.rows, ROWS_NEW);
  assert.equal(cleanRect({ x: 0, y: 0, w: 10, h: 10, angle: 120 }).angle, 85);
  assert.equal(cleanRect({ x: 0, y: 0, w: 10, h: 10, cross: 'mirror' }).cross, 'mirror');
  assert.equal(cleanRect({ x: 0, y: 0, w: 10, h: 10, step: -3 }).step, 32);
  assert.equal(cleanRect({ x: 'a', y: 0, w: 10, h: 10 }), null);
});

test('two families: rising at the angle, descending square to it — or its mirror', () => {
  const [A, B] = familiesOf(sq());
  close(Math.atan2(A.u[1], A.u[0]) * 180 / Math.PI, 26.6, 'rising at the angle');
  close(A.u[0] * B.u[0] + A.u[1] * B.u[1], 0, 'square');
  assert.ok(B.u[0] > 0 && B.u[1] < 0, 'descending to the right');
  const [, M] = familiesOf(cleanRect({ x: 0, y: 0, w: 200, h: 200, cross: 'mirror' }));
  close(M.u[0], A.u[0], 'mirror: as far across'); close(M.u[1], -A.u[1], 'mirror: as far down');
});

test('the lanes a step apart, one through the bottom left corner, every one edge to edge', () => {
  const r = sq(), [A] = familiesOf(r), L = familyLanes(r, A);
  const k0 = L.find(l => l.k === 0);
  close(k0.a[0], 0, 'from the corner'); close(k0.a[1], 0, 'from the corner');
  close(k0.b[0], 200, 'to the right edge'); close(k0.b[1], 200 * Math.tan(26.6 * Math.PI / 180), 'near its middle', 1e-6);
  for (let i = 1; i < L.length; i++) assert.equal(L[i].k, L[i - 1].k + 1);
  for (const l of L) for (const p of [l.a, l.b]) close(distTo(r, p), 0, 'on the rectangle');
  for (const l of L) { const ofs = l.a[0] * A.n[0] + l.a[1] * A.n[1]; close(ofs, l.k * 32, 'a step apart', 1e-6); }
});

test('the four runs: 1 rising from the bottom right corner, 2 descending from the top right, every other lane; 3 and 4 the lanes skipped', () => {
  const r = sq(), R = runsOf(r), [A, B] = familiesOf(r), LA = familyLanes(r, A), LB = familyLanes(r, B);
  assert.deepEqual(R.map(q => q.fam), ['A', 'B', 'A', 'B']);
  assert.deepEqual(R[0].lanes.map(l => l.k), [-2, 0, 2, 4], 'the owner\'s 20 × 20: the corner lane in run 1');
  assert.deepEqual(R[2].lanes.map(l => l.k), [-1, 1, 3, 5]);
  assert.deepEqual(R[1].lanes.map(l => l.k), [8, 6, 4, 2], 'from the top right corner down');
  assert.deepEqual(R[3].lanes.map(l => l.k), [7, 5, 3, 1]);
  assert.equal(R[0].lanes[0].k, LA[0].k, 'run 1 starts at the lowest rising lane, by the bottom right corner');
  assert.equal(R[1].lanes[0].k, LB.at(-1).k, 'run 2 at the highest descending one, by the top right corner');
  assert.ok(R[0].lanes[0].a[0] > 100 && R[0].lanes[0].a[1] < 1e-6, 'it lands on the bottom edge, on the right');
  for (const q of R) for (let i = 1; i < q.lanes.length; i++) assert.equal(Math.abs(q.lanes[i].k - q.lanes[i - 1].k), 2, 'skipping one');
  assert.deepEqual([...R[0].lanes, ...R[2].lanes].map(l => l.k).sort((a, b) => a - b), LA.map(l => l.k), 'every rising lane once');
  assert.deepEqual([...R[1].lanes, ...R[3].lanes].map(l => l.k).sort((a, b) => a - b), LB.map(l => l.k), 'every descending lane once');
});

test('the snake: its lanes forward and back, turning off the rectangle, its steps never on it', () => {
  const r = sq(), pl = planOf([r]), d0 = O.brush / 2 + O.clear;
  for (const run of pl.rects[0].runs) {
    const P = snakeOf(pl.rects[0], run, O);
    assert.equal(P.ends.length, run.lanes.length);
    close(P.pts[0][0], run.lanes[0].a[0], 'lands on its first lane\'s start'); close(P.pts[0][1], run.lanes[0].a[1], 'lands on its first lane\'s start');
    // every turn: the lane's end and the next one's start, and all between, d0 clear of the rectangle
    for (let j = 0; j < P.ends.length - 1; j++) {
      const from = P.ends[j], to = P.ends[j + 1] - 1;
      for (let i = from; i < to; i++) {
        const a = P.pts[i], b = P.pts[i + 1];
        for (let t = 0; t <= 1; t += 0.02) assert.ok(distTo(r, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]) >= d0 - 1e-3, `run ${run.n}, turn ${j + 1}: on the canvas`);
      }
    }
    // the lanes alternate: every other one back
    const dir = j => { const a = P.pts[j ? P.ends[j - 1] + 1 + (P.ends[j] - P.ends[j - 1] - 2) : 0], b = P.pts[P.ends[j]]; return Math.sign((b[0] - a[0]) * run.F.u[0] + (b[1] - a[1]) * run.F.u[1]); };
    run.lanes.forEach((_, j) => assert.equal(dir(j), j % 2 ? -1 : 1, `run ${run.n}, lane ${j + 1}`));
  }
});

test('DRAG Snake: a run a row, four landings, no stop between the runs; the paths plot', () => {
  const pl = planOf([sq()]), R = dragRows(pl, { ...O, mode: 'snake' });
  assert.equal(R.ps.length, 4); assert.equal(R.stops.length, 0);
  assert.match(R.info[0].label, /run 1 ↗ · 4 lanes, the snake/); assert.match(R.info[1].label, /run 2 ↘/);
  assert.equal(R.ps[0][0].stopsAt.length, 3, 'a pause at every lane\'s end but the last');
  const run = plotRun({ ...RUN, rows: R.ps.length, pauseAtEnds: true }, dragPasses(R));
  assert.equal(run.fault, ''); assert.ok(run.seconds > 0);
  assert.equal(run.blocks.filter(b => b.kind === 'pause').length, 0, 'the machine does not stop between the runs');
});

test('DRAG Air: a lane a row, the rising ones up to the right, the descending ones down to the right; a stop before the next rectangle', () => {
  const rects = [sq(), cleanRect({ x: 50, y: 50, w: 100, h: 100, step: 20 })], pl = planOf(rects), R = dragRows(pl, { ...O, mode: 'air' });
  assert.equal(R.ps.length, pl.lanes);
  assert.equal(R.stops.length, 1); assert.equal(R.stops[0].at, pl.rects[0].lanes); assert.match(R.stops[0].why, /^Rectangle 2:/);
  const first = R.ps[0][0], second = R.ps[pl.rects[0].runs[0].lanes.length][0];
  assert.ok(first.b.x > first.a.x && first.b.y > first.a.y, 'rising: up the machine (+X) and to the right (+Y)');
  assert.ok(second.b.x < second.a.x && second.b.y > second.a.y, 'descending: down the machine and to the right');
  const [a, b] = airOf(pl.rects[0].runs[0], pl.rects[0].runs[0].lanes[1], { before: 4, past: 6 }), l = pl.rects[0].runs[0].lanes[1];
  close(Math.hypot(b[0] - a[0], b[1] - a[1]), l.len + 10, 'before and past stretch it');
  const P = dragPasses(R); assert.deepEqual(P.map(q => q.ps.length), [pl.rects[0].lanes, pl.rects[1].lanes]);
  assert.match(dragSvg(pl, O), /data-run="4"/);
});

test('the sausages: along the four edges and the rows inside, a stripe a paint; Rows keeps the edges', () => {
  const r = sq();
  assert.deepEqual(rowsOf(r).map(q => q.key), ['B', 'R', 'T', 'L', 'M1/3']);
  close(rowsOf(r)[4].a[0], 100, 'one down the middle, the owner\'s hand test');
  r.pat = newPattern(r, BIAS_META['meta 2'], 7);
  const ss = sausagesOf(r);
  assert.ok(ss.length > 10);
  for (const q of ss) { const [x, y, w, h] = q.box; assert.ok(x >= -1e-9 && y >= -1e-9 && x + w <= 200 + 1e-9 && y + h <= 200 + 1e-9, 'on the canvas'); }
  for (const key of ['B', 'R', 'T', 'L']) { const s = r.pat.segs[key]; close(s[0][0], 0, 'from the row\'s start'); close(s.at(-1)[1], 1, 'to its end'); }
  const re = recolour(r, r.pat, BIAS_META['meta 1'], 9);
  assert.deepEqual(Object.values(re.segs).map(a => a.map(s => [s[0], s[1]])), Object.values(r.pat.segs).map(a => a.map(s => [s[0], s[1]])), 'the stripes in their places');
  const was = r.pat.segs.B; r.rows = 4; r.pat = reRows(r);
  assert.deepEqual(Object.keys(r.pat.segs), ['B', 'R', 'T', 'L', 'M1/4', 'M2/4']); assert.equal(r.pat.segs.B, was);
  const st = stripeAt(r, [100, 1]); assert.equal(st.key, 'B'); assert.ok(st.s >= 0);
});

test('MARKS: a dash a sausage, a dip every fourth with INK ON', () => {
  const r = sq(); r.pat = newPattern(r, BIAS_META['meta 3'], 3);
  const pl = planOf([r]), M = marksRows(pl, { ...O, ink: true });
  assert.equal(M.marks, sausagesOf(r).length);
  assert.equal(M.ps.filter(p => !p[0].nodip).length, Math.ceil(M.marks / MARKS_DIP));
});

test('the Result: the brush lays the sausages along the lanes, the later runs through the earlier\'s paint', () => {
  const r = sq(); r.pat = newPattern(r, BIAS_META['meta 2'], 7);
  const pl = planOf([r]), M = mixAll(pl, { ...O, density: 50, mode: 'snake' });
  assert.equal(M.strokes.length, pl.lanes * 5, 'five grooves a lane');
  const painted = M.strokes.filter(q => q.cover.some(c => c > 0.5));
  assert.ok(painted.length > pl.lanes, 'most lanes carry paint');
  assert.ok(M.strokes.filter(q => q.run === 2).some(q => q.cover.some(c => c > 0.5)), 'the descending run paints too');
  const dry = mixAll(planOf([sq()]), { ...O, mode: 'air' });
  assert.ok(dry.strokes.every(q => q.cover.every(c => c === 0)), 'no sausages, no paint');
});

// BIAS SNAKE and BIAS AIR (the owner, the same afternoon: "after the first
// diagonal only one line, then the other way"; "+30 mm aside, so the brush
// straightens out off the canvas"; Screenshot 2.27.43 PM: the rising lanes
// down from the right side, the crossing ones down to it, idle passes over
// the canvas between)
const isA = l => l.F.u[0] < 0 && l.F.u[1] < 0;                              // a rising lane, run down ↙
test('BIAS: a rising lane and a crossing one in turn — the rising from the bottom right corner, each run down ↙; the crossing from the top right ↘, or the bottom left ↖', () => {
  const r = sq(), [A, B] = familiesOf(r), [T] = runsTwo(r);
  assert.equal(RUNOUT_NEW, 30);
  assert.equal(T.lanes.length, familyLanes(r, A).length + familyLanes(r, B).length, 'every lane once');
  const n = Math.min(familyLanes(r, A).length, familyLanes(r, B).length);
  for (let i = 0; i < 2 * n; i++) assert.equal(isA(T.lanes[i]), i % 2 === 0, `lane ${i + 1}: ${i % 2 ? 'crossing' : 'rising'}`);
  assert.deepEqual(T.lanes.filter(isA).map(l => l.k), familyLanes(r, A).map(l => l.k), 'the rising ones from the bottom right corner up');
  assert.deepEqual(T.lanes.filter(l => !isA(l)).map(l => l.k), familyLanes(r, B).map(l => l.k).reverse(), 'the crossing ones from the top right down');
  close(T.lanes[0].a[0], 200, 'the first starts on the right side'); close(T.lanes[0].b[1], 0, 'and runs down to the bottom');
  for (const l of T.lanes.filter(l => !isA(l))) assert.ok(l.F.u[0] > 0 && l.F.u[1] < 0 && l.a[1] > l.b[1], 'the crossing ones down to the right');
  assert.equal(T.arrow, '↙↘');
  const [U] = runsTwo(cleanRect({ x: 0, y: 0, w: 200, h: 200, from2: 'bl' })), cross = U.lanes.filter(l => !isA(l));
  assert.deepEqual(cross.map(l => l.k), familyLanes(r, B).map(l => l.k), 'or from the bottom left up');
  assert.equal(U.arrow, '↙↖'); for (const l of cross) assert.ok(l.a[1] < l.b[1] && l.F.u[1] > 0, 'its strokes up to the left, the paint dragged the other way');
  assert.equal(cleanRect({ x: 0, y: 0, w: 10, h: 10, from2: 'middle' }).from2, 'tr');
});

test('BIAS SNAKE: every lane 30 mm off the canvas at both ends; the brush down between two along the side it left by, over the canvas a flight', () => {
  for (const from2 of ['tr', 'bl']) {
    const pl = planOf([cleanRect({ x: 0, y: 0, w: 350, h: 350, angle: 45, step: 40, from2 })]), r = pl.rects[0], [run] = r.runs2, o = { ...O, runout: 30 };
    const W = bowsOf(r, run, o, true), S = strokesOf(r, run, true);
    assert.deepEqual(W.flatMap(w => w.lanes), run.lanes.map((_, j) => j), `${from2}: every lane once, in turn`);
    assert.ok(W.length > 1 && W.length < run.lanes.length, `${from2}: some joined, some flown to (${W.length} landings)`);
    for (const w of W) {
      w.lanes.forEach((j, i) => {
        const a = w.pts[w.ends[i] - 1], b = w.pts[w.ends[i]], s = S[j];
        close(Math.hypot(a[0] - s.from[0], a[1] - s.from[1]), 30, `lane ${j + 1}: it comes in from 30 mm off`, 1e-6);
        close(Math.hypot(b[0] - s.to[0], b[1] - s.to[1]), 30, `lane ${j + 1}: it runs 30 mm on`, 1e-6);
      });
      for (let i = 0; i < w.ends.length - 1; i++) for (let q = w.ends[i]; q < w.ends[i + 1] - 1; q++) {
        const a = w.pts[q], b = w.pts[q + 1];
        for (let t = 0; t <= 1; t += 0.02) assert.ok(distTo(r, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]) >= O.brush / 2 + O.clear - 1e-3, 'the brush down only off the canvas');
      }
    }
    if (from2 === 'tr') {
      assert.deepEqual(W[0].lanes, [0], 'the first down to the bottom, then a flight up over the canvas');
      assert.deepEqual(W[1].lanes, [1, 2], 'the crossing one down to the right side, the brush down along it to the next rising one');
    }
    const R = dragRows(pl, { ...O, cw: 350, ch: 350, mode: 'biassnake' });
    assert.equal(R.ps.length, W.length); assert.equal(R.stops.length, 0);
    if (from2 === 'tr') assert.match(R.info[1].label, /BIAS · lanes 2–3 of \d+ ↘↙, the brush down between/);
    else assert.match(R.info[0].label, /BIAS · lanes 1–2 of \d+ ↙↖, the brush down between/, 'from the bottom left: down to the bottom, along it to the crossing one');
    const run2 = plotRun({ ...RUN, rows: R.ps.length, pauseAtEnds: true }, dragPasses(R));
    assert.equal(run2.fault, '');
  }
});

test('BIAS AIR: a lane a landing, in turn, each its way, 30 mm off the canvas at both ends', () => {
  const pl = planOf([sq()]), R = dragRows(pl, { ...O, mode: 'biasair' }), [run] = pl.rects[0].runs2;
  assert.equal(R.ps.length, pl.lanes);
  const g0 = R.ps[0][0], g1 = R.ps[1][0];
  close(Math.hypot(g0.b.x - g0.a.x, g0.b.y - g0.a.y), run.lanes[0].len + 60, 'the lane and 30 mm at each end');
  assert.ok(g0.b.x < g0.a.x && g0.b.y < g0.a.y, 'the first rising one down: down the machine and to the left');
  assert.ok(g1.b.x < g1.a.x && g1.b.y > g1.a.y, 'then a crossing one: down the machine, to the right');
  assert.match(R.info[1].label, /BIAS · lane 2 of \d+ ↘/);
  const M = mixAll(planOf([Object.assign(sq(), { pat: newPattern(sq(), BIAS_META['meta 2'], 7) })]), { ...O, density: 50, mode: 'biassnake' });
  assert.equal(M.strokes.length, pl.lanes * 5);
  assert.ok(M.strokes.some(q => q.cover.some(c => c > 0.5)), 'it paints');
});

test('the margin round the canvas (the owner\'s 25 mm "to let the brush turn"): BIAS\'s way and the brush\'s edge stay in it, the run off shortened where 30 mm would leave it', () => {
  for (const angle of [26.6, 45, 70]) {
    const r = cleanRect({ x: 0, y: 0, w: 300, h: 300, angle, step: 12 }), pl = planOf([r]), o = { ...O, cw: 300, ch: 300, runout: 30, margin: 25 }, canvas = { x: 0, y: 0, w: 300, h: 300 };
    for (const mode of ['biassnake', 'biasair']) {
      const R = dragRows(pl, { ...o, mode });
      for (const p of R.ps) for (const g of p) for (const q of [g.a, g.b]) {
        const c = [q.y + 150, q.x + 150];                                      // machine mm from the centre → canvas mm
        assert.ok(distTo(canvas, c) <= 25 - O.brush / 2 + 1e-3, `${angle}°, ${mode}: ${distTo(canvas, c).toFixed(2)} mm off the canvas`);
      }
    }
    const P = snakeOf(pl.rects[0], pl.rects[0].runs2[0], o), S = strokesOf(pl.rects[0], pl.rects[0].runs2[0], true);
    const runs = S.map((s, j) => Math.hypot(P.pts[P.ends[j]][0] - s.to[0], P.pts[P.ends[j]][1] - s.to[1]));
    assert.ok(Math.max(...runs) <= 30 + 1e-6, 'never more than 30 mm');
    if (angle === 45) assert.ok(runs.some(v => Math.abs(v - 30) < 1e-6), 'at 45°, 30 mm fits in 25 mm');
  }
});

// 90 SNAKE and 90 AIR (the owner, 2026-10-16, BIAS-plaid/ Screenshot 9.08.29
// PM: "the counter check at a right angle"): Snake's and Air's four runs, the
// lanes upright and across, whatever the Angle.
test('90: the lanes upright and across, centred, a step apart, none down the middle, the brush wholly on the rectangle', () => {
  const r = cleanRect({ x: 0, y: 0, w: 220, h: 220, angle: 45, step: 16 }), [A, B] = straightOf(), U = straightLanes(r, A, 6), X = straightLanes(r, B, 6);
  assert.deepEqual(U.map(l => l.a[0]), [214, 198, 182, 166, 150, 134, 118, 102, 86, 70, 54, 38, 22, 6], 'from the right edge to the left, 6 mm in at both');
  for (const l of U) { close(l.a[0], l.b[0], 'upright'); close(l.a[1], 0, 'from the bottom edge'); close(l.b[1], 220, 'to the top edge'); }
  assert.deepEqual(X.map(l => l.a[1]), [6, 22, 38, 54, 70, 86, 102, 118, 134, 150, 166, 182, 198, 214], 'across: from the bottom up, along n');
  for (const l of X) { close(l.a[1], l.b[1], 'across'); close(l.a[0], 0, 'from the left edge'); close(l.b[0], 220, 'to the right edge'); }
  assert.ok(!U.some(l => Math.abs(l.a[0] - 110) < 1), 'none down the middle row');
  assert.equal(straightLanes(cleanRect({ x: 0, y: 0, w: 212, h: 100, step: 16 }), A, 6).length, 12, 'the outer ones dropped where the brush would leave it');
  const one = straightLanes(cleanRect({ x: 10, y: 0, w: 20, h: 100, step: 32 }), A, 6);
  assert.equal(one.length, 1); close(one[0].a[0], 20, 'one fitting: down the middle');
  assert.deepEqual(straightLanes(cleanRect({ x: 0, y: 0, w: 4, h: 100 }), A, 6), [], 'the brush wider than it: none');
});

test('90: four runs — 1 upright every other lane from the right edge, 2 across from the top, 3 and 4 the lanes skipped; the plan counts them its own', () => {
  const r = cleanRect({ x: 0, y: 0, w: 220, h: 220, angle: 26.6, step: 16 }), R = runs90Of(r, 6);
  assert.deepEqual(R.map(q => q.arrow), ['↑', '→', '↑', '→']);
  assert.deepEqual(R[0].lanes.map(l => l.a[0]), [214, 182, 150, 118, 86, 54, 22]);
  assert.deepEqual(R[1].lanes.map(l => l.a[1]), [214, 182, 150, 118, 86, 54, 22], 'from the top down');
  assert.deepEqual(R[2].lanes.map(l => l.a[0]), [198, 166, 134, 102, 70, 38, 6]);
  assert.deepEqual(R[3].lanes.map(l => l.a[1]), [198, 166, 134, 102, 70, 38, 6]);
  const pl = planOf([r], { brush: 6 }), q = pl.rects[0];
  assert.equal(q.lanes90, 28); assert.equal(pl.lanes90, 28); assert.equal(lanesFor(pl, 'snake90'), 28); assert.equal(lanesFor(pl, 'snake'), pl.lanes);
  assert.deepEqual(runs90Of(cleanRect({ ...r, angle: 70 }), 6).map(q => q.lanes.length), R.map(q => q.lanes.length), 'whatever the Angle');
});

test('90 SNAKE: a run a row, turning off the rectangle, every other lane back; 90 AIR: a lane a row, up and to the right; the paths plot', () => {
  const r = cleanRect({ x: 0, y: 0, w: 200, h: 200, step: 20 }), pl = planOf([r], { brush: O.brush }), q = pl.rects[0], d0 = O.brush / 2 + O.clear;
  const S = dragRows(pl, { ...O, mode: 'snake90' });
  assert.equal(S.ps.length, 4); assert.equal(S.stops.length, 0);
  assert.match(S.info[0].label, /run 1 ↑ · 5 lanes, the snake/); assert.match(S.info[1].label, /run 2 → · 5 lanes, the snake/);
  for (const run of q.runs90) {
    const P = snakeOf(q, run, O);
    for (let j = 0; j < P.ends.length - 1; j++) for (let i = P.ends[j]; i < P.ends[j + 1] - 1; i++) {
      const a = P.pts[i], b = P.pts[i + 1];
      for (let t = 0; t <= 1; t += 0.05) assert.ok(distTo(r, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]) >= d0 - 1e-3, `run ${run.n}, turn ${j + 1}: on the canvas`);
    }
  }
  const A = dragRows(pl, { ...O, mode: 'air90' });
  assert.equal(A.ps.length, pl.lanes90);
  const up = A.ps[0][0], across = A.ps[q.runs90[0].lanes.length][0];
  assert.ok(up.b.x > up.a.x && Math.abs(up.b.y - up.a.y) < 1e-9, 'upright: up the machine (+X), no way across');
  assert.ok(across.b.y > across.a.y && Math.abs(across.b.x - across.a.x) < 1e-9, 'across: to the right (+Y)');
  for (const R of [S, A]) { const run = plotRun({ ...RUN, rows: R.ps.length, pauseAtEnds: true }, dragPasses(R)); assert.equal(run.fault, ''); assert.ok(run.seconds > 0); }
  assert.match(dragSvg(pl, { ...O, mode: 'snake90' }), /the upright ones up/);
  const M = mixAll(planOf([Object.assign(r, { pat: newPattern(r, BIAS_META['meta 1'], 3) })], { brush: O.brush }), { ...O, density: 50, mode: 'snake90' });
  assert.equal(M.strokes.length, pl.lanes90 * 5); assert.ok(M.strokes.some(s => s.cover.some(c => c > 0.5)), 'it paints');
});

// SNAKE PLAIN → and ↑ (the owner, 2026-10-16, on 90 tried: "some kind of
// parquet :)) let us simply do it as in CCD, straight stripes").
test('SNAKE PLAIN: one run, every lane in its order as CCD\'s — across from the bottom up, upright from the left — the snake turning off the rectangle', () => {
  const r = cleanRect({ x: 0, y: 0, w: 200, h: 120, step: 20 }), pl = planOf([r], { brush: O.brush }), q = pl.rects[0], d0 = O.brush / 2 + O.clear;
  assert.deepEqual(q.runsX[0].lanes.map(l => l.a[1]), [10, 30, 50, 70, 90, 110], 'across: from the bottom up, none skipped');
  assert.deepEqual(q.runsY[0].lanes.map(l => l.a[0]), [10, 30, 50, 70, 90, 110, 130, 150, 170, 190], 'upright: from the left');
  assert.equal(q.runsX[0].arrow, '→'); assert.equal(q.runsY[0].arrow, '↑');
  assert.equal(lanesFor(pl, 'plainx'), 6); assert.equal(lanesFor(pl, 'plainy'), 10);
  for (const [mode, run] of [['plainx', q.runsX[0]], ['plainy', q.runsY[0]]]) {
    const R = dragRows(pl, { ...O, mode });
    assert.equal(R.ps.length, 1, `${mode}: one landing`); assert.equal(R.ps[0][0].stopsAt.length, run.lanes.length - 1);
    assert.match(R.info[0].label, new RegExp(`plain ${run.arrow} · ${run.lanes.length} lanes, the snake`));
    const P = snakeOf(q, run, O);
    for (let j = 0; j < P.ends.length - 1; j++) for (let i = P.ends[j]; i < P.ends[j + 1] - 1; i++) {
      const a = P.pts[i], b = P.pts[i + 1];
      for (let t = 0; t <= 1; t += 0.05) assert.ok(distTo(r, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]) >= d0 - 1e-3, `${mode}, turn ${j + 1}: on the canvas`);
    }
    const dir = j => Math.sign((P.pts[P.ends[j]][0] - P.pts[P.ends[j] - 1][0]) * run.F.u[0] + (P.pts[P.ends[j]][1] - P.pts[P.ends[j] - 1][1]) * run.F.u[1]);
    run.lanes.forEach((_, j) => assert.equal(dir(j), j % 2 ? -1 : 1, `${mode}, lane ${j + 1}: forward, back, forward …`));
    const plot = plotRun({ ...RUN, rows: R.ps.length, pauseAtEnds: true }, dragPasses(R)); assert.equal(plot.fault, ''); assert.ok(plot.seconds > 0);
  }
  assert.deepEqual(plainOf(r, 6, true)[0].lanes.map(l => l.k), q.runsX[0].lanes.map(l => l.k));
  const M = mixAll(planOf([Object.assign(r, { pat: newPattern(r, BIAS_META['meta 4'], 5) })], { brush: O.brush }), { ...O, density: 50, mode: 'plainx' });
  assert.equal(M.strokes.length, 6 * 5); assert.ok(M.strokes.some(s => s.cover.some(c => c > 0.5)), 'it paints');
});
