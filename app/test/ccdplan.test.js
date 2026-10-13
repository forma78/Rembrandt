import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanRect, cleanPat, lanesOf, pitchOf, gapOf, planOf, dragRows, dragPasses, dragSvg, LANES_MAX, ROWS_NEW, rowsOf, newPattern, recolour, dealPaints, lanesKept, stripesAcross, sausagesOf, marksRows, markOf, mixRect, reachOf, paintOf, CCD_META, MARKS_DIP, SAUSAGE_W, REACH_50, OVER_NEW, LIFT_EARLY } from '../src/ccdplan.js';
import { PAINT } from '../src/tapeplan.js';
import { plotRun, DEFAULTS } from '../src/strokes.js';

// CCD's plan: rectangles of straight lanes, after Carlos Cruz-Diez (the
// owner, 2026-10-11) — the paint squeezed along one edge, the brush driving
// it across, one way, lane after lane.
const O = { cw: 200, ch: 200, brush: 10, before: 0, past: 0 };
const RUN = { ...DEFAULTS, snake: true, pause: false, lift: false, tail: 3, speed: 60, travel: 180, ink: false, here: { x: 350, y: 300 } };
const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} ≠ ${b}`);

test('a rectangle as kept: lanes 1 … 218, vertical unless horizontal, sides at least 1 mm', () => {
  assert.equal(cleanRect({ x: 0, y: 0, w: 10, h: 10, lanes: 500 }).lanes, LANES_MAX);
  assert.equal(cleanRect({ x: 0, y: 0, w: 10, h: 10, lanes: 0 }).lanes, 1);
  assert.equal(cleanRect({ x: 0, y: 0, w: 10, h: 10, dir: 'sideways' }).dir, 'up');
  assert.equal(cleanRect({ x: 0, y: 0, w: 10, h: 10, dir: 'right' }).dir, 'right');
  assert.equal(cleanRect({ x: 0, y: 0, w: 0, h: 10 }).w, 1);
  assert.equal(cleanRect({ x: 'a', y: 0, w: 10, h: 10 }), null);
});

test('vertical: lane 1 on the left, the outer brush edges on the sides, every lane from the bottom edge to the top', () => {
  const r = cleanRect({ x: 20, y: 30, w: 100, h: 150, lanes: 3 }), L = lanesOf(r, O);
  assert.deepEqual(L.map(l => l.n), [1, 2, 3]);
  assert.deepEqual(L.map(l => l.a[0]), [25, 70, 115]);
  for (const l of L) { assert.equal(l.a[0], l.b[0]); assert.equal(l.a[1], 30); assert.equal(l.b[1], 180); }
  close(pitchOf(r, 10), 45, 'pitch'); close(gapOf(r, 10), 35, 'white between');
});

test('horizontal: lane 1 at the bottom, every lane from the left edge to the right; before and past stretch it', () => {
  const r = cleanRect({ x: 20, y: 30, w: 100, h: 50, dir: 'right', lanes: 2 }), L = lanesOf(r, { ...O, before: 4, past: 6 });
  assert.deepEqual(L.map(l => l.a[1]), [35, 75]);
  for (const l of L) { assert.equal(l.a[1], l.b[1]); assert.equal(l.a[0], 16); assert.equal(l.b[0], 126); }
});

test('218 lanes on 200 mm: overlapping when the brush is wider than the pitch; a brush wider than the rectangle, all on its middle', () => {
  const r = cleanRect({ x: 0, y: 0, w: 200, h: 200, lanes: 218 });
  close(pitchOf(r, 1), 199 / 217, 'pitch'); assert.ok(gapOf(r, 1) < 0, 'they overlap');
  assert.equal(lanesOf(r, { ...O, brush: 1 }).length, 218);
  const narrow = cleanRect({ x: 10, y: 0, w: 8, h: 50, lanes: 5 });
  for (const l of lanesOf(narrow, O)) assert.equal(l.a[0], 14);
  assert.equal(lanesOf(cleanRect({ x: 0, y: 0, w: 100, h: 50, lanes: 1 }), O)[0].a[0], 50, 'one lane: the middle');
});

test('DRAG: a row a lane, up the machine (+X) for vertical, to the right (+Y) for horizontal; a stop before every next rectangle', () => {
  const rects = [cleanRect({ x: 0, y: 0, w: 200, h: 200, lanes: 4 }), cleanRect({ x: 50, y: 50, w: 100, h: 100, lanes: 3 }), cleanRect({ x: 0, y: 0, w: 60, h: 40, dir: 'right', lanes: 2 })];
  const pl = planOf(rects, O), R = dragRows(pl, O);
  assert.equal(R.ps.length, 9); assert.equal(pl.runs, 9);
  const up = R.ps[0][0], right = R.ps[7][0];
  assert.ok(up.b.x > up.a.x && Math.abs(up.b.y - up.a.y) < 1e-9, 'vertical runs +X');
  close(up.a.x, -100, 'from the canvas\'s bottom edge'); close(up.b.x, 100, 'to its top'); close(up.a.y, -95, 'lane 1 brush half in from the left');
  assert.ok(right.b.y > right.a.y && Math.abs(right.b.x - right.a.x) < 1e-9, 'horizontal runs +Y');
  assert.deepEqual(R.stops.map(s => s.at), [4, 7]);
  assert.match(R.stops[0].why, /^Rectangle 2, vertical/); assert.match(R.stops[1].why, /along its left edge/);
  assert.doesNotMatch(R.stops.map(s => s.why).join(' '), /flat brush/, 'a round brush: nothing to turn (2026-10-13)');
  close(R.length, 4 * 200 + 3 * 100 + 2 * 60, 'length');
  const P = dragPasses(R);
  assert.deepEqual(P.map(q => q.ps.length), [4, 3, 2]); assert.equal(P[0].why, null); assert.equal(P[1].why, R.stops[0].why);
  const run = plotRun({ ...RUN, rows: R.ps.length, pauseAtEnds: true }, P);
  assert.equal(run.fault, '');
  assert.equal(run.blocks.filter(b => b.kind === 'pause').length, 2, 'a pause before rectangles 2 and 3');
  const painting = run.blocks.filter(b => b.kind === 'move' && b.paintMM > 0);
  assert.equal(painting.length, 9, 'one brush-down move a lane');
  assert.ok(painting.every(b => b.pauseAtEnd), 'PAUSE waits for a lane\'s end');
});

test('the snake: a rectangle one row, its lanes back and forth with the brush down, a step across at each end, PAUSE at the lanes\' ends', () => {
  const rects = [cleanRect({ x: 0, y: 0, w: 100, h: 200, lanes: 4 }), cleanRect({ x: 0, y: 0, w: 60, h: 40, dir: 'right', lanes: 3 })];
  const pl = planOf(rects, O), R = dragRows(pl, { ...O, snake: true }), air = dragRows(pl, O);
  assert.equal(R.ps.length, 2, 'a row a rectangle');
  assert.deepEqual(R.stops.map(s => s.at), [1]); assert.equal(R.stops[0].why, air.stops[0].why);
  const p = R.ps[0];
  assert.equal(p.length, 4 + 3, 'four lanes, three steps across');
  assert.ok(p[0].b.x > p[0].a.x, 'lane 1 up'); assert.ok(p[2].b.x < p[2].a.x, 'lane 2 down'); assert.ok(p[4].b.x > p[4].a.x, 'lane 3 up');
  for (const i of [1, 3, 5]) { close(p[i].a.x, p[i].b.x, 'a step across, along the edge'); close(p[i].b.y - p[i].a.y, pl.rects[0].pitch, 'a pitch'); }
  for (let i = 1; i < p.length; i++) { close(p[i].a.x, p[i - 1].b.x, 'one line'); close(p[i].a.y, p[i - 1].b.y, 'one line'); }
  assert.deepEqual(p[0].stopsAt.map(v => Math.round(v * 1e6) / 1e6), [200, 200 + 30 + 200, 2 * (200 + 30) + 200]);
  close(R.length, air.length + 3 * 30 + 2 * pl.rects[1].pitch, 'the lanes and the steps');
  const run = plotRun({ ...RUN, rows: R.ps.length, pauseAtEnds: true }, dragPasses(R));
  assert.equal(run.fault, '');
  assert.equal(run.blocks.filter(b => b.kind === 'pause').length, 1);
  assert.equal(run.blocks.filter(b => b.kind === 'move' && b.paintMM > 0).length, 4 + 3, 'a block a lane, cut at the lanes\' ends');
  const lands = run.blocks.filter(b => b.kind === 'move' && b.paintMM === 0 && !b.home).length;
  assert.equal(lands, 2, 'the brush lands once a rectangle');
  const one = dragRows(planOf([cleanRect({ x: 0, y: 0, w: 8, h: 50, lanes: 3 })], O), { ...O, snake: true });
  assert.equal(one.ps[0].length, 3, 'a brush wider than the rectangle: back and forth on one line, no step');
});

test('the SVG: a path a lane, y down', () => {
  const pl = planOf([cleanRect({ x: 0, y: 0, w: 200, h: 100, lanes: 2 })], O), s = dragSvg(pl, O);
  assert.equal((s.match(/<path /g) || []).length, 2);
  assert.match(s, /M5 200 L5 100/);
});

// ---------- the paints (2026-10-13) ----------
const near = (a, b, msg, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${msg}: ${a} ≠ ${b}`);
const PAL = CCD_META['meta 2'];
const genesis = (o = {}) => { const r = cleanRect({ x: 0, y: 0, w: 200, h: 200, lanes: 40, rows: 4, ...o }); return { ...r, pat: newPattern(r, 10, PAL, 7) }; };

test('rows: evenly from the paint\'s edge to the far one, both edges in — the owner\'s 20 × 20, four', () => {
  const r = genesis(), R = rowsOf(r);
  assert.equal(ROWS_NEW, 4);
  assert.deepEqual(R.map(q => q.j), [0, 1, 2, 3]);
  R.forEach((q, i) => near(q.t, i * 200 / 3, `row ${i}`));
  assert.deepEqual(rowsOf({ ...r, rows: 1 }), [{ t: 0, j: 0 }], 'one row: the paint\'s edge only');
  assert.deepEqual(rowsOf({ ...r, rows: 2 }).map(q => q.t), [0, 200], 'two: both edges');
});

test('the genesis repeated at the same scale: 40 × 40 its rows again, the far edge\'s last; its pitch kept, the lanes grow', () => {
  const r = genesis(), big = { ...r, w: 400, h: 400 };
  assert.equal(lanesKept(r, 10), 40, 'on its own rectangle: its lanes');
  assert.equal(lanesKept(big, 10), 81, '(400 − 10) / pitch + 1');
  const R = rowsOf({ ...big, lanes: 81 });
  assert.deepEqual(R.map(q => q.j), [0, 1, 2, 0, 1, 2, 3]); near(R[3].t, 200, 'the genesis again at 200 mm'); near(R.at(-1).t, 400, 'the far edge');
  const mid = rowsOf({ ...r, w: 300, h: 300 });
  assert.deepEqual(mid.map(q => q.j), [0, 1, 2, 0, 1, 3], '30 × 30: one and a half, cut'); near(mid.at(-1).t, 300, 'its far edge');
  const across = stripesAcross({ ...big, lanes: 81 });
  assert.equal(across.length, 2 * r.pat.stripes.length + 1, 'twice over, and lane 81 the first stripe\'s start');
  assert.deepEqual(across.at(-1), { s: 0, k0: 80, k1: 80 });
  const lanes = new Set(); for (const q of across) for (let k = q.k0; k <= q.k1; k++) { assert.ok(!lanes.has(k), `lane ${k} once`); lanes.add(k); }
  assert.equal(lanes.size, 81);
});

test('the paints dealt: never the paint before along a stripe, nor beside it across; the repeat\'s neighbours too; one seed one deal', () => {
  const r = genesis(), P = r.pat.paint, n = r.rows, last = P.length - 1;
  for (let s = 0; s < P.length; s++) for (let j = 0; j < n; j++) {
    assert.ok(PAINT[P[s][j]], 'a paint everywhere');
    if (j) assert.notEqual(P[s][j], P[s][j - 1], `stripe ${s}, rows ${j - 1}, ${j}`);
    if (s) assert.notEqual(P[s][j], P[s - 1][j], `row ${j}, stripes ${s - 1}, ${s}`);
  }
  for (let s = 0; s < P.length; s++) assert.notEqual(P[s][0], P[s][n - 2], 'the genesis again after its row n − 2');
  for (let j = 0; j < n; j++) assert.notEqual(P[last][j], P[0][j], 'its first stripe after its last');
  assert.deepEqual(dealPaints(r.pat.stripes, n, PAL, 7), P);
  assert.deepEqual(recolour(r.pat, 3, PAL, 9).stripes, r.pat.stripes, 'another deal: the stripes kept');
  assert.equal(recolour(r.pat, 3, PAL, 9).paint[0].length, 3);
});

test('the sausages: a stripe across, SAUSAGE_W along at its row, the edges\' rows inside the rectangle; thin the accents', () => {
  const r = genesis(), ss = sausagesOf(r, 10);
  assert.equal(ss.length, r.pat.stripes.length * 4);
  const first = ss.filter(q => q.t === 0), lastRow = ss.filter(q => q.j === 3);
  assert.ok(first.every(q => q.a === 0 && q.b === SAUSAGE_W)); assert.ok(lastRow.every(q => q.b === 200 && q.a === 200 - SAUSAGE_W));
  near(first[0].c0, 0, 'lane 1 from the side'); near(first.at(-1).c1, 200, 'the last to the other');
  for (let i = 1; i < first.length; i++) near(first[i].c0, first[i - 1].c1, 'stripes edge to edge');
  for (const q of ss) assert.equal(q.thin, PAL.accent.includes(q.paint) && !PAL.core.includes(q.paint));
  assert.deepEqual(sausagesOf({ ...r, pat: undefined }, 10), [], 'no pattern, no sausages');
});

test('a pattern kept, and refused when broken', () => {
  const r = genesis(), kept = cleanRect(JSON.parse(JSON.stringify(r)));
  assert.deepEqual(kept.pat.paint, r.pat.paint); assert.equal(kept.rows, 4);
  assert.equal(cleanPat({ ...r.pat, stripes: [[0, 99]] }), null, 'a stripe past the genesis\'s lanes');
  assert.equal(cleanPat({ ...r.pat, paint: [] }), null);
  assert.equal(cleanPat({ ...r.pat, paint: r.pat.paint.map(row => row.map(() => 'nothing')) }).paint[0][0], null, 'an unknown paint: none');
  assert.equal(cleanRect({ x: 0, y: 0, w: 10, h: 10, rows: 99 }).rows, 12);
});

test('Duo: every lane from the far edge to the middle, the brush lifting there, then from the paint\'s edge; top half first', () => {
  const r = cleanRect({ x: 0, y: 0, w: 200, h: 200, lanes: 4 }), h = cleanRect({ x: 0, y: 0, w: 200, h: 100, dir: 'right', lanes: 2 });
  const R = dragRows(planOf([r, h], O), { ...O, mode: 'duo' });
  assert.equal(R.ps.length, 12); assert.deepEqual(R.stops.map(s => s.at), [8]);
  const top = R.ps[0][0], bottom = R.ps[4][0], right = R.ps[8][0], left = R.ps[10][0];
  close(top.a.x, 100, 'from the top edge'); close(top.b.x, 0, 'to the middle'); close(bottom.a.x, -100, 'from the bottom edge'); close(bottom.b.x, 0, 'to the middle');
  close(right.a.y, 100, 'horizontal: the right half first'); close(right.b.y, 0, 'to the middle'); close(left.a.y, -100, 'then from the left edge');
  assert.match(R.info[0].label, /from the far edge to the middle/);
  const run = plotRun({ ...RUN, rows: R.ps.length, pauseAtEnds: true }, dragPasses(R));
  assert.equal(run.fault, '');
});

test('MARKS: a dash a sausage across its stripe at its row, apart from its neighbours; a dip every MARKS_DIP-th with INK', () => {
  const r = genesis(), pl = planOf([r], O), M = marksRows(pl, { ...O, ink: true }), ss = sausagesOf(pl.rects[0], 10);
  assert.equal(M.marks, ss.length); assert.equal(M.ps.length, ss.length);
  M.ps.forEach((p, i) => assert.equal(!!p[0].nodip, i % MARKS_DIP !== 0, `mark ${i + 1}`));
  assert.ok(marksRows(pl, { ...O, ink: false }).ps.every(p => !p[0].nodip));
  const g = M.ps[0][0]; close(g.a.x, g.b.x, 'across a vertical rectangle: along the machine\'s Y');
  const row = ss.filter(q => q.t === 0).map(q => markOf(q, 10)).sort((a, b) => a.c0 - b.c0);
  for (let i = 1; i < row.length; i++) if (row[i].c1 - row[i].c0 > 1.5 && row[i - 1].c1 - row[i - 1].c0 > 1.5) assert.ok(row[i].c0 - row[i - 1].c1 >= 10 - 1e-9, 'the round brush\'s dashes never touch');
  const run = plotRun({ ...RUN, rows: M.ps.length, ink: true, cup: { x: 20, y: 300, rim: 20, dip: 30, dwell: 1 }, noDipUnder: 0 }, [{ key: 'MARKS', ps: M.ps, why: null }]);
  assert.equal(run.fault, ''); assert.equal(run.dips, Math.ceil(ss.length / MARKS_DIP));
});

test('the Result: a sausage carries the line full 70 mm at Density 50 % — the measure — then it fades; more paint, farther', () => {
  const R = reachOf(50);
  assert.ok(Math.abs(R.full - REACH_50) <= 2, `full ${R.full}`); assert.ok(R.gone > 100 && R.gone < 140, `gone ${R.gone}`);
  assert.ok(reachOf(75).full > R.full && reachOf(25).full < R.full);
  near(paintOf(75), 2 * paintOf(50), 'twice the paint every 25 %');
});

test('the Result on a rectangle: Air from the paint\'s edge; Duo from both edges to the middle', () => {
  const BW = { name: 'bw', core: ['black', 'white'], accent: [] };   // no accents: every sausage a whole one
  const r = cleanRect({ x: 0, y: 0, w: 20, h: 300, lanes: 2, rows: 1 }), pat = newPattern(r, 10, BW, 3), o = { brush: 10, before: 0, past: 0, density: 50 };
  const air = mixRect({ ...r, pat }, { ...o, mode: 'air' }), c = (M, t) => M.lanes[0].grooves[0].cover[t];
  assert.equal(air.lanes.length, 2); assert.equal(air.n, 301);
  assert.ok(c(air, 20) > 0.9 && c(air, 280) < 0.05, 'full near the paint, the ground at the far end');
  const two = { ...r, h: 200, rows: 2 }, duo = mixRect({ ...two, pat: newPattern(two, 10, BW, 3) }, { ...o, mode: 'duo', over: 5 });
  assert.ok(c(duo, 20) > 0.9 && c(duo, 180) > 0.9, 'Duo: both halves from their own edges');
  assert.ok(c(duo, 100) > 0.05 && c(duo, 100) < 0.9, 'and thinning towards the middle, 100 mm from each');
  const snake = mixRect({ ...two, pat: newPattern(two, 10, BW, 3) }, { ...o, mode: 'snake' });
  assert.ok(snake.lanes[1].grooves[0].cover[180] > 0.9, 'the snake: lane 2 from the far edge down, its row there');
});

test('Duo Air past the middle: each half 5 mm on, as the head lifts before it (2026-10-13)', () => {
  const r = cleanRect({ x: 0, y: 0, w: 200, h: 200, lanes: 4 }), h = cleanRect({ x: 0, y: 0, w: 200, h: 100, dir: 'right', lanes: 2 });
  assert.equal(OVER_NEW, 5);
  const R = dragRows(planOf([r, h], O), { ...O, mode: 'duo', over: 5 });
  close(R.ps[0][0].b.x, -5, 'the top half down past the middle'); close(R.ps[4][0].b.x, 5, 'the bottom half up past it');
  close(R.ps[8][0].b.y, -5, 'the right half past the middle'); close(R.ps[10][0].b.y, 5, 'the left half past it');
});

test('Duo Snake: a half one row, from its edge to the middle and back with the brush down, the far edge\'s half first; PAUSE at the lanes\' ends', () => {
  const r = cleanRect({ x: 0, y: 0, w: 200, h: 200, lanes: 4 });
  const R = dragRows(planOf([r], O), { ...O, mode: 'duosnake', over: 5 });
  assert.equal(R.ps.length, 2, 'two rows, a half each'); assert.deepEqual(R.stops, []);
  const [top, bottom] = R.ps;
  assert.equal(top.length, 7, 'four lanes and three steps across'); assert.equal(top[0].stopsAt.length, 3);
  close(top[0].a.x, 100, 'lane 1 from the top edge'); close(top[0].b.x, 0, 'to the middle itself: no lift there, the over Duo Air\'s');
  close(top[1].a.x, 0, 'a step across there'); close(top[1].b.x, 0, '');
  close(top[2].a.x, 0, 'lane 2 back up'); close(top[2].b.x, 100, 'to the top edge');
  close(bottom[0].a.x, -100, 'then from the bottom edge'); close(bottom[0].b.x, 0, 'up to the middle');
  assert.match(R.info[0].label, /from the far edge to the middle and back, the snake/);
  const run = plotRun({ ...RUN, rows: R.ps.length, pauseAtEnds: true }, dragPasses(R));
  assert.equal(run.fault, '');
});

test('the Result of Duo Snake: lane 1 from the edges in, lane 2 from the middle out, fed by the rows inside', () => {
  const BW = { name: 'bw', core: ['black', 'white'], accent: [] }, r = cleanRect({ x: 0, y: 0, w: 20, h: 200, lanes: 2, rows: 4 });
  const M = mixRect({ ...r, pat: newPattern(r, 10, BW, 3) }, { brush: 10, before: 0, past: 0, density: 50, mode: 'duosnake', over: 5 }), c = k => M.lanes[k].grooves[0].cover;
  assert.ok(c(0)[20] > 0.9 && c(0)[180] > 0.9, 'lane 1: both edges\' rows dragged in');
  assert.ok(c(1)[50] > 0.9 && c(1)[150] > 0.9, 'lane 2: the inner rows dragged out');
  const two = { ...r, rows: 2 }, D = mixRect({ ...two, pat: newPattern(two, 10, BW, 3) }, { brush: 10, before: 0, past: 0, density: 50, mode: 'duosnake', over: 5 });
  assert.ok(D.lanes[1].grooves[0].cover[50] < 0.1, 'two rows, the edges only: lane 2, from the middle out, stays dry');
});

test('the Result of Duo Air: the paint ends LIFT_EARLY before the lift — 5 mm on, at the middle', () => {
  const BW = { name: 'bw', core: ['black', 'white'], accent: [] }, r = cleanRect({ x: 0, y: 0, w: 20, h: 100, lanes: 1, rows: 2 }), pat = newPattern(r, 10, BW, 3);
  const at = over => mixRect({ ...r, pat }, { brush: 10, before: 0, past: 0, density: 50, mode: 'duo', over }).lanes[0].grooves[0].cover;
  assert.equal(LIFT_EARLY, 5);
  const c5 = at(5), c0 = at(0);
  assert.ok(c5[48] > 0.5 && c5[52] > 0.5, 'over 5: both halves to the middle');
  assert.ok(c0[50] === 0 && c0[47] === 0 && c0[53] === 0, 'over 0: a gap at the middle, as the owner saw');
});
