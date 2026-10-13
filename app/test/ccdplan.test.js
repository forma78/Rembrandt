import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanRect, lanesOf, pitchOf, gapOf, planOf, dragRows, dragPasses, dragSvg, LANES_MAX } from '../src/ccdplan.js';
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
