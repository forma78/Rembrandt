import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanPencils, PENCILS_NEW, runOrder, candidatesOf, regionsOf, shapeAt, pointOn, pieceLength, bandsOf, linesIn, runsOf, modulesOf, pencilPlan, LEAST_MM, LEAST_SHARE, hatchOf, lineLen, passesOf, drawRows, withChanges, changeWhy, PITCH } from '../src/dacheplan.js';
import { cleanRect, BRUSH_NEW } from '../src/inkaplan.js';
import { BLEND, BLEND_1554, keysOf } from '../src/blendplan.js';
import { plotRun, DEFAULTS, ELBOW_HOVER, TAIL_MIN } from '../src/strokes.js';

// DACHE, BLEND in coloured pencils on paper (the owner, 2026-10-27, DACHE/):
// IMG_1554's blend on a 40 × 40, a Result made up — its left half blue, its
// right half orange — and the eleven pencils.
const SIDE = BLEND_1554.side * 400, AT = (400 - SIDE) / 2;
const MIX = (o = {}) => cleanRect({ id: 1, x: AT, y: AT, w: SIDE, h: SIDE, step: 3, kind: BLEND, ...o });
const P = cleanPencils(PENCILS_NEW);
const resOf = (fn, W = 400, H = 400, h = 1) => {
  const nx = W / h, ny = H / h, data = new Uint8ClampedArray(4 * nx * ny);
  for (let iy = 0; iy < ny; iy++) for (let ix = 0; ix < nx; ix++) { const c = fn((ix + 0.5) * h, (iy + 0.5) * h), q = 4 * ((ny - 1 - iy) * nx + ix); data.set([...c, 255], q); }
  return { nx, ny, h, data };
};
const HALVES = resOf(x => x < 200 ? [36, 80, 158] : [235, 115, 37]);
const near = (a, b, e = 1e-6) => Math.abs(a - b) < e;
const joined = ps => ps.every((g, i) => !i || Math.hypot(g.a[0] - ps[i - 1].b[0], g.a[1] - ps[i - 1].b[1]) < 1e-6);

test('the pencil box: eleven, black among them, white the light one; kept as it may be', () => {
  assert.equal(P.length, 11);
  assert.ok(P.find(p => p.id === 'black')); assert.deepEqual(P.filter(p => p.light).map(p => p.id), ['white']);
  assert.ok(P.every(p => p.on && p.brand === '' && p.code === ''));
  const k = cleanPencils([{ id: 'a', name: 'Sunflower', hex: 'f2c21e', brand: 'Winsor & Newton' }, { id: 'a', hex: '#000000' }, { id: 'b', hex: 'nope' }, null]);
  assert.deepEqual(k, [{ id: 'a', name: 'Sunflower', hex: '#F2C21E', brand: 'Winsor & Newton', code: '', light: false, on: true }]);
  assert.equal(cleanPencils([]).length, 11, 'none kept: the eleven');
});

test('the run\'s order: light to dark, the owner\'s order over it, the light ones always last', () => {
  const ids = runOrder(P).map(p => p.id);
  assert.equal(ids[0], 'yellow'); assert.equal(ids.at(-2), 'black'); assert.equal(ids.at(-1), 'white');
  const mine = runOrder(P, ['white', 'blue', 'orange']).map(p => p.id);
  assert.deepEqual(mine.slice(0, 2), ['blue', 'orange']); assert.equal(mine.at(-1), 'white', 'white over the rest, whatever the order');
  assert.ok(!runOrder(P.map(p => p.id === 'grey' ? { ...p, on: false } : p)).some(p => p.id === 'grey'), 'a pencil off: not in the run');
});

test('what a module may look like: the paper, a pencil, a pencil with white over it, paler; more coats darker', () => {
  const C = candidatesOf(P, 1), own = P.filter(p => !p.light).length;
  assert.equal(C[0].own, null); assert.equal(C.length, 1 + own * 2);
  const o = C.find(q => q.own === 'orange' && !q.light), ow = C.find(q => q.own === 'orange' && q.light === 'white');
  assert.ok(ow.lab[0] > o.lab[0], 'white over orange lighter');
  assert.ok(candidatesOf(P, 3).find(q => q.own === 'orange' && !q.light).lab[0] < o.lab[0], 'three coats darker than one');
  assert.equal(candidatesOf(P.map(p => ({ ...p, on: p.id !== 'white' })), 1).length, 1 + own, 'white off: no pairs');
});

test('the regions: a blend\'s every two keys and its core; a tile down to its middle', () => {
  const R = regionsOf([MIX(), cleanRect({ id: 2, x: 0, y: 0, w: 30, h: 20 })], { corner: 4 });
  assert.deepEqual(R.map(q => q.kind), ['blend', 'blend', 'core', 'tile']);
  const K = keysOf(MIX());
  assert.ok(near(R[0].a.x0, K[0].x) && near(R[1].b.x0, K[2].x));
  assert.deepEqual(R[3].b, { x0: 10, y0: 10, x1: 20, y1: 10, c: 0 }, 'a 30 × 20 tile in to its middle line');
  assert.equal(regionsOf([MIX({ core: false })]).length, 2, 'the core empty: paper');
});

test('a shape\'s eight pieces: the sides and the corners, round it anticlockwise, its perimeter', () => {
  const s = { x0: 0, y0: 0, x1: 100, y1: 60, c: 10 };
  const L = [0, 1, 2, 3, 4, 5, 6, 7].map(p => pieceLength(s, p));
  assert.ok(near(L.reduce((a, b) => a + b, 0), 2 * 80 + 2 * 40 + 2 * Math.PI * 10, 1e-9));
  for (let p = 0; p < 8; p++) { const e = pointOn(s, p, 1), b = pointOn(s, (p + 1) % 8, 0); assert.ok(near(e[0], b[0]) && near(e[1], b[1]), `piece ${p} ends where ${(p + 1) % 8} begins`); }
  assert.deepEqual(pointOn(s, 0, 0), [10, 0]); assert.deepEqual(pointOn(s, 4, 0.5), [50, 60]);
  assert.ok(near(pieceLength({ ...s, c: 999 }, 2), 0), 'the corner no more than half a side');
});

test('bands Stroke lines wide where the keys lie furthest apart; lines PITCH apart, one in half a pitch, none in less', () => {
  const R = { a: { x0: 0, y0: 0, x1: 100, y1: 100, c: 0 }, b: { x0: 20, y0: 30, x1: 80, y1: 100, c: 0 } };
  assert.equal(bandsOf(R, 2), 15); assert.equal(bandsOf(R, 1), 30); assert.equal(bandsOf(R, 4), 8);
  assert.equal(linesIn(4), 4); assert.equal(linesIn(2.4), 2); assert.equal(linesIn(0.6), 1); assert.equal(linesIn(0.4), 0);
  assert.equal(PITCH, 1);
});

test('runs of one colour: a piece shorter than the shortest goes to its longer neighbour; the frame\'s outside never', () => {
  assert.deepEqual(runsOf([1, 1, 1, 2, 1, 1, 3, 3, 3, 3], 1, 2).map(q => [q.k, q.i0, q.i1]), [[1, 0, 5], [3, 6, 9]]);
  assert.deepEqual(runsOf([-1, 2, -1, 1, 1, 1], 1, 3).map(q => q.k), [-1, 2, -1, 1], 'alone between the outside: it stays');
  assert.deepEqual(runsOf([0, 0, 1, 0, 0], 1, 2).map(q => q.k), [0], 'a speck on the paper: the paper');
});

test('modules off the Result: blue on its left, orange on its right, the pencils nearest; the frame cuts them', () => {
  const r = MIX(), D = modulesOf([r], HALVES, { pencils: P, stroke: 2 });
  assert.ok(D.modules.length > 50);
  assert.deepEqual([...new Set(D.modules.map(M => M.own))].sort(), ['blue', 'orange']);
  for (const M of D.modules) {
    const R = D.regions[M.reg], m = pointOn(shapeAt(R, (M.ta + M.tb) / 2), M.p, (M.fa + M.fb) / 2);
    if (Math.abs(m[0] - 200) > 5) assert.equal(M.own, m[0] < 200 ? 'blue' : 'orange', `a module at x ${m[0].toFixed(1)}`);
    assert.ok(M.n >= 1 && M.n <= 2 + 1, 'Stroke 2: two lines where widest');
  }
  const F = { x0: 250, y0: 50, x1: 330, y1: 170 }, Df = modulesOf([r], HALVES, { pencils: P, frame: F });
  assert.ok(Df.modules.length > 5 && Df.modules.length < D.modules.length / 4);
  for (const M of Df.modules) { const R = Df.regions[M.reg], m = pointOn(shapeAt(R, (M.ta + M.tb) / 2), M.p, (M.fa + M.fb) / 2); assert.ok(m[0] > F.x0 - 3 && m[0] < F.x1 + 3 && m[1] > F.y0 - 3 && m[1] < F.y1 + 3); }
  assert.ok(Df.modules.every(M => M.own === 'orange'));
  const white = modulesOf([r], resOf(() => [251, 250, 247]), { pencils: P });
  assert.equal(white.modules.length, 0, 'the Result\'s white: the paper, nothing drawn');
});

test('a module\'s hatch: Along its lines up and down, Across strokes PITCH apart, Cross both; coats over again; one line', () => {
  const R = { a: { x0: 0, y0: 0, x1: 100, y1: 100, c: 0 }, b: { x0: 0, y0: 4, x1: 100, y1: 100, c: 0 } };
  const M = { p: 0, fa: 0.2, fb: 0.5, ta: 0, tb: 1, n: 4, len: 30 };
  const A = hatchOf(R, M, 'along'), lines = A.filter((g, i) => i % 2 === 0);
  assert.ok(joined(A)); assert.equal(lines.length, 4, 'four lines in four mm: up and down four times');
  assert.deepEqual(lines.map(g => g.a[1]), [0.5, 1.5, 2.5, 3.5]);
  assert.ok(near(lines[0].a[0], 20) && near(lines[0].b[0], 50) && near(lines[1].a[0], 50) && near(lines[1].b[0], 20), 'back the way it came, never through the air');
  assert.ok(near(A.reduce((s, g) => s + lineLen(g), 0), 4 * 30 + 3 * 1));
  const X = hatchOf(R, M, 'across');
  assert.ok(joined(X)); assert.equal(X.filter((g, i) => i % 2 === 0).length, 30, 'thirty strokes in thirty mm');
  assert.ok(X.filter((g, i) => i % 2 === 0).every(g => near(Math.abs(g.b[1] - g.a[1]), 3)));
  const C = hatchOf(R, M, 'cross'), A2 = hatchOf(R, M, 'along', 2);
  assert.ok(joined(C) && near(C.reduce((s, g) => s + lineLen(g), 0), A.reduce((s, g) => s + lineLen(g), 0) + X.reduce((s, g) => s + lineLen(g), 0), 2));
  assert.ok(joined(A2) && near(A2.reduce((s, g) => s + lineLen(g), 0), 2 * (4 * 30 + 3)), 'two coats: back over itself');
  assert.deepEqual(hatchOf(R, M, 'along', 1, true)[0].a, [50, 0.5], 'from its other end');
  assert.deepEqual(hatchOf(R, { ...M, n: 1 }, 'across').length, 1, 'one line: Along');
  const corner = hatchOf({ a: { x0: 0, y0: 0, x1: 100, y1: 100, c: 30 }, b: { x0: 10, y0: 10, x1: 90, y1: 90, c: 20 } }, { p: 3, fa: 0, fb: 1, ta: 0, tb: 0.4, n: 4, len: 40 }, 'along');
  assert.ok(joined(corner) && corner.filter(g => g.t === 'A').length === 4, 'in a corner, arcs');
});

test('the passes: a pencil each in the run\'s order, its modules nearest next, on without a lift where they touch', () => {
  const D = modulesOf([MIX()], HALVES, { pencils: P }), order = runOrder(P), S = passesOf(D, order, { hatch: 'along' });
  assert.deepEqual(S.map(q => q.pencil), ['orange', 'blue'], 'orange lighter, first; no other pencil has a module');
  for (const q of S) {
    assert.equal(q.modules, D.modules.filter(M => M.own === q.pencil).length);
    assert.ok(q.strokes.length < q.modules, 'neighbours joined');
    assert.ok(q.strokes.every(joined));
  }
  const total = S.reduce((s, q) => s + q.mm, 0);
  assert.ok(total > 0.8 * SIDE * SIDE / PITCH && total < 1.4 * SIDE * SIDE / PITCH, `about the blend's area in mm of line: ${Math.round(total)}`);
  const pale = candidatesOf(P, 1).find(q => q.own === 'orange' && q.light === 'white').hex.match(/\w\w/g).map(v => parseInt(v, 16));
  const W = passesOf(modulesOf([MIX()], resOf(x => x < 200 ? [36, 80, 158] : pale), { pencils: P }), order);
  assert.deepEqual(W.map(q => q.pencil), ['orange', 'blue', 'white'], 'a pale orange: orange, white over it, last');
  assert.equal(W[2].modules, W[0].modules, 'white over every one of orange\'s');
});

test('on the machine: the pencil down over its first start, a p-pause at every change with the pencil on the paper, no fault', () => {
  const D = modulesOf([MIX()], HALVES, { pencils: P }), S = passesOf(D, runOrder(P)), o = { cw: 400, ch: 400 };
  const R = drawRows(S, P, o);
  const run = plotRun({ ...DEFAULTS, speed: 40, travel: 180, tail: TAIL_MIN, lift: false, ink: false, snake: true, pause: false, rows: R.ps.length, here: { x: 300, y: 300 }, hover: ELBOW_HOVER }, [{ key: 'DRAW', ps: R.ps, why: null }]);
  assert.equal(run.fault, '');
  const B = withChanges(run.blocks, R, P, S), pp = B.filter(b => b.kind === 'p-pause');
  assert.deepEqual(pp.map(b => b.pencil), ['orange', 'blue']);
  assert.match(pp[0].why, /^Pencil 1 of 2: Orange — in the holder, its tip on the paper; then Continue$/);
  assert.equal(pp[1].why, changeWhy(P, S, 1)); assert.match(pp[1].why, /Orange out, Blue in, its tip on the paper/);
  const i0 = B.indexOf(pp[0]);
  assert.deepEqual(B[i0 - 1], { kind: 'arm', cmd: 'J 2 0', row: 1 }, 'the first: the holder down over the first start');
  assert.match(B[i0 - 2].cmds[0], /^T /, 'after the travel there');
  const i1 = B.indexOf(pp[1]), before = B[i1 - 1], after = B[i1 + 1];
  assert.equal(before.kind, 'move'); assert.match(before.cmds[0], /^F /);
  const ws = before.cmds.filter(c => c[0] === 'W');
  assert.ok(!ws.length || ws.at(-1).startsWith('W 2 0 '), `the pencil left on the paper at the colour's end: ${ws.at(-1)}`);
  assert.equal(after.kind, 'arm'); assert.match(after.cmd, /^J 2 25/, 'then up, once the next is in');
  assert.equal(B.filter(b => b.kind === 'pause').length, 0, 'never the brush\'s pause');
  const lastPass = R.info.filter(q => q.pass === 0), row = lastPass.at(-1);
  assert.ok(R.ps[R.info.indexOf(row)].at(-1).tailOut === 0 && R.ps.at(-1).at(-1).tailOut === undefined, 'the very last lifts as ever');
});

test('a pencil with next to nothing to draw left out, its modules to the nearest of the rest', () => {
  const grey = candidatesOf(P, 1).find(q => q.own === 'grey' && !q.light).hex.match(/\w\w/g).map(v => parseInt(v, 16));
  const specks = resOf((x, y) => x < 200 ? [36, 80, 158] : (x > 300 && x < 308 && y > 200 && y < 208) ? grey : [235, 115, 37]);
  const all = modulesOf([MIX()], specks, { pencils: P }), D = pencilPlan([MIX()], specks, { pencils: P });
  assert.ok(all.modules.some(M => M.own === 'grey'), 'a speck of grey in the Result');
  assert.deepEqual(D.few, ['grey']); assert.ok(!D.modules.some(M => M.own === 'grey'));
  assert.equal(LEAST_MM, 300);
  const F = { x0: 296, y0: 196, x1: 312, y1: 212 }, small = pencilPlan([MIX()], specks, { pencils: P, frame: F });
  assert.ok(small.modules.some(M => M.own === 'grey'), `in a small frame the speck is ${LEAST_SHARE * 100} % and more of it: kept`);
});

test('a narrow side its lines too: across all of its gap PITCH apart, shared out to the bands — no paper left on it', () => {
  // the owner's blend, Screenshot 2026-10-27 at 12.09.03 PM: 16.5 mm between A and Key 2 at the top, 151.5 at the bottom
  const r = cleanRect({ id: 1, x: 15, y: 15, w: 370, h: 370, step: 3, kind: BLEND, keys: [{ x: 78 / 370, y: 151.5 / 370, w: 211.5 / 370, h: 202 / 370 }, { x: 0.43, y: 0.63, w: 0.14, h: 0.2 }] });
  const D = modulesOf([r], resOf(() => [235, 115, 37]), { pencils: P, stroke: 2 }), lines = p => { const ts = new Set(); for (const M of D.modules) if (M.reg === 0 && M.p === p) M.ts.forEach(t => ts.add(t)); return ts.size; };
  assert.equal(lines(4), 17, 'the top: 16.5 mm, 17 lines'); assert.equal(lines(0), 152, 'the bottom: 151.5 mm, 152');
  for (const M of D.modules) {
    const R = D.regions[M.reg], gap = Math.abs(shapeAt(R, M.ts[0]).y1 - shapeAt(R, M.ts.at(-1)).y1);
    if (M.reg === 0 && M.p === 4 && M.n > 1) assert.ok(Math.abs(gap / (M.n - 1) - 16.5 / 17) < 1e-6, 'a line every 0.97 mm');
  }
});
