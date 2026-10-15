import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanRect, familiesOf, familyLanes, runsOf, runsTwo, planOf, snakeOf, airOf, distTo, dragRows, dragPasses, dragSvg, rowsOf, newPattern, recolour, reRows, sausagesOf, stripeAt, marksRows, mixAll,
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

// BIAS SNAKE and BIAS AIR (the owner, the same afternoon: "two runs, not
// four"; "+30 mm aside, so the brush straightens out off the canvas")
test('BIAS: two runs, every lane — rising from the bottom right corner, the crossing from the top right or the bottom left', () => {
  const r = sq(), [A, B] = familiesOf(r), T = runsTwo(r);
  assert.equal(RUNOUT_NEW, 30);
  assert.deepEqual(T.map(q => q.fam), ['A', 'B']);
  assert.deepEqual(T[0].lanes.map(l => l.k), familyLanes(r, A).map(l => l.k), 'every rising lane, the lowest first');
  assert.deepEqual(T[1].lanes.map(l => l.k), familyLanes(r, B).map(l => l.k).reverse(), 'every crossing lane, from the top right');
  const bl = runsTwo(cleanRect({ x: 0, y: 0, w: 200, h: 200, from2: 'bl' }));
  assert.deepEqual(bl[1].lanes.map(l => l.k), familyLanes(r, B).map(l => l.k), 'or from the bottom left');
  assert.equal(bl[1].arrow, '↖'); assert.ok(bl[1].F.u[1] > 0 && bl[1].F.u[0] < 0, 'its strokes up to the left, the paint dragged the other way');
  for (const l of bl[1].lanes) assert.ok(l.a[1] < l.b[1], 'each from its lower end');
  assert.equal(cleanRect({ x: 0, y: 0, w: 10, h: 10, from2: 'middle' }).from2, 'tr');
});

test('BIAS SNAKE: every lane 30 mm along it off the canvas at both ends, the turns off it too; two landings', () => {
  const pl = planOf([sq()]), r = pl.rects[0], o = { ...O, runout: 30 };
  for (const run of r.runs2) {
    const P = snakeOf(r, run, o);
    run.lanes.forEach((l, j) => {
      const a = P.pts[P.ends[j] - 1], b = P.pts[P.ends[j]], s = j % 2 ? [l.b, l.a] : [l.a, l.b];
      assert.ok(Math.hypot(a[0] - s[0][0], a[1] - s[0][1]) >= 30 - 1e-6, `run ${run.n}, lane ${j + 1}: it comes in from 30 mm off`);
      assert.ok(Math.hypot(b[0] - s[1][0], b[1] - s[1][1]) >= 30 - 1e-6, `run ${run.n}, lane ${j + 1}: it runs 30 mm on`);
    });
    for (let j = 0; j < P.ends.length - 1; j++) for (let i = P.ends[j]; i < P.ends[j + 1] - 1; i++) {
      const a = P.pts[i], b = P.pts[i + 1];
      for (let t = 0; t <= 1; t += 0.02) assert.ok(distTo(r, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]) >= O.brush / 2 + O.clear - 1e-3, 'its turns off the canvas');
    }
  }
  const R = dragRows(pl, { ...O, mode: 'biassnake' });
  assert.equal(R.ps.length, 2); assert.equal(R.stops.length, 0);
  assert.match(R.info[0].label, /BIAS run 1 ↗ · 8 lanes, the snake/); assert.match(R.info[1].label, /BIAS run 2 ↘ · 8 lanes/);
  const run = plotRun({ ...RUN, rows: R.ps.length, pauseAtEnds: true }, dragPasses(R));
  assert.equal(run.fault, '');
  const four = dragRows(pl, { ...O, mode: 'snake' });
  assert.ok(R.length > four.length, 'the 30 mm off the canvas: a longer way');
});

test('BIAS AIR: a lane a row, landing and lifting 30 mm off the canvas', () => {
  const pl = planOf([sq()]), R = dragRows(pl, { ...O, mode: 'biasair' });
  assert.equal(R.ps.length, pl.lanes);
  const l = pl.rects[0].runs2[0].lanes[1], g = R.ps[1][0];
  close(Math.hypot(g.b.x - g.a.x, g.b.y - g.a.y), l.len + 60, 'the lane and 30 mm at each end');
  const M = mixAll(planOf([Object.assign(sq(), { pat: newPattern(sq(), BIAS_META['meta 2'], 7) })]), { ...O, density: 50, mode: 'biassnake' });
  assert.equal(M.strokes.length, pl.lanes * 5);
  assert.ok(M.strokes.filter(q => q.run === 2).some(q => q.cover.some(c => c > 0.5)), 'the crossing run paints');
});
