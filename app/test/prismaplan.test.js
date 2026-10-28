import test from 'node:test';
import assert from 'node:assert/strict';
import { prismaPlan, passesOf, drawRows, ringsOf, raysOf, rayPieces, runsOf, ranksOf, nearestOf, tOf, rubbed, rubsOf, PRISMA_PENCILS, BOX_5, BOX_6, SHORTEST_NEW } from '../src/prismaplan.js';
import { cleanPencils, runOrder, regionsOf, shapeAt, withChanges, lineLen, PITCH, PENCILS_NEW, JOIN_MM as JOIN } from '../src/dacheplan.js';
import { cleanRect, atPiece } from '../src/inkaplan.js';
import { BLEND, BLEND_1554 } from '../src/blendplan.js';
import { SAUSAGE_W } from '../src/ccdplan.js';
import { plotRun, DEFAULTS, ELBOW_HOVER, TAIL_MIN } from '../src/strokes.js';

// PRISMA, DACHE's Preview in rings and rays (the owner, 2026-10-27, PRISMA/):
// IMG_1554's blend on a 400 × 400, a Preview made up — its left half blue,
// its right half orange — one spoke's sausage down the bottom, red in it.
const SIDE = BLEND_1554.side * 400, AT = (400 - SIDE) / 2;
const SPOKE = { a: [0.7, 0.02], b: [0.7, 0.55], paint: 'red' };   // on the bottom, between A and Key 2, right of the middle
const MIX = (o = {}) => cleanRect({ id: 1, x: AT, y: AT, w: SIDE, h: SIDE, step: 3, kind: BLEND, ss: [SPOKE], ...o });
const P = cleanPencils(PRISMA_PENCILS);
const resOf = (fn, W = 400, H = 400, h = 1) => {
  const nx = W / h, ny = H / h, data = new Uint8ClampedArray(4 * nx * ny);
  for (let iy = 0; iy < ny; iy++) for (let ix = 0; ix < nx; ix++) { const c = fn((ix + 0.5) * h, (iy + 0.5) * h), q = 4 * ((ny - 1 - iy) * nx + ix); data.set([...c, 255], q); }
  return { nx, ny, h, data };
};
const SX = AT + 0.7 * SIDE;                                                       // the spoke's x on the canvas
const RED = [194, 33, 58], BLUE = [36, 80, 158], ORANGE = [235, 115, 37];
const PREVIEW = resOf(x => Math.abs(x - SX) < SAUSAGE_W / 2 ? RED : x < 200 ? BLUE : ORANGE);
const joined = ps => ps.every((g, i) => !i || Math.hypot(g.a[0] - ps[i - 1].b[0], g.a[1] - ps[i - 1].b[1]) < 1e-6);

test('the box: DACHE\'s 27, fifteen more Prismacolors and twelve for the four transitions, every one with its number', () => {
  assert.equal(P.length, PENCILS_NEW.length + 15 + 12);
  assert.equal(BOX_5.length, 15); assert.equal(BOX_6.length, 12);
  assert.ok([...BOX_5, ...BOX_6].every(q => /^PC \d+$/.test(q.code) && q.brand === 'Prismacolor'));
  assert.equal(new Set(P.map(p => p.id)).size, P.length, 'no id twice');
});

test('every shade its pencil, ΔE 2000; the paper next to white; white never a shade of its own', () => {
  const near = nearestOf(P), lin = c => c.map(v => ((v / 255 + 0.055) / 1.055) ** 2.4);
  assert.equal(near(lin([36, 80, 158])), 'blue');
  assert.equal(near(lin([235, 115, 37])), 'orange');
  assert.equal(near(lin([251, 250, 247])), null, 'the paper');
  assert.equal(near(lin([254, 254, 254])), null, 'white paint: the paper, not White');
  assert.equal(nearestOf(P.map(p => ({ ...p, on: p.id !== 'blue' })))(lin([36, 80, 158])) === 'blue', false, 'out of the box: never chosen');
});

test('the ranks: the first n of N spread over all of them, the fewer always among the more', () => {
  for (const N of [1, 2, 7, 23, 64]) {
    const r = ranksOf(N);
    assert.deepEqual([...r].sort((a, b) => a - b), Array.from({ length: N }, (_, i) => i), `N ${N}: every rank once`);
  }
  const r = ranksOf(23), kept = n => [...r.keys()].filter(i => r[i] < n);
  for (let n = 1; n < 23; n++) assert.ok(kept(n).every(i => kept(n + 1).includes(i)), `${n} among ${n + 1}`);
  const k6 = kept(6), gaps = k6.slice(1).map((v, i) => v - k6[i]);
  assert.ok(Math.max(...gaps) <= 2 * 23 / 6 + 1, `six of 23 spread: ${k6}`);
});

test('runs: a short one to its longer neighbour, the paper\'s gap too; where nothing is drawn never merged', () => {
  const ids = ['a', 'a', 'a', 'b', 'a', 'a', null, 'a', 'a', 'a', undefined, 'a'], L = ids.map(() => 1);
  assert.deepEqual(runsOf(ids, L, 2).map(q => [q.id, q.i0, q.i1]), [['a', 0, 9], [undefined, 10, 10], ['a', 11, 11]]);
  assert.deepEqual(runsOf(['a', 'b', 'b', 'b'], [1, 1, 1, 1], 0.5).map(q => q.id), ['a', 'b'], 'none shorter: as they are');
});

test('t: 0 on the outer key, 1 on the inner, -1 outside, 2 inside it', () => {
  const R = regionsOf([MIX()], { corner: 4 })[0], mid = s => [(s.x0 + s.x1) / 2, s.y0 + 1e-6];
  assert.equal(tOf(R, -5, -5), -1);
  assert.ok(Math.abs(tOf(R, ...mid(shapeAt(R, 0.37))) - 0.37) < 1e-3);
  assert.equal(tOf(R, (R.b.x0 + R.b.x1) / 2, (R.b.y0 + R.b.y1) / 2), 2);
});

test('the rings: lines PITCH apart round the bands, clockwise, a run of one pencil a stroke, every one joined', () => {
  const regions = regionsOf([MIX()], { corner: 4 }), rings = ringsOf(regions, PREVIEW, nearestOf(P));
  assert.ok(rings.length > 100);
  assert.ok(rings.every(q => q.kind === 'ring' && joined(q.pieces) && q.mm >= SHORTEST_NEW - 1e-6));
  const used = new Set(rings.map(q => q.pencil));
  assert.ok(used.has('blue') && used.has('orange') && (used.has('carmine') || used.has('poppy')), `the halves, the red spoke under them: ${[...used]}`);
  const flat = rings.flatMap(q => { const L = shapeAt(regions[q.reg], q.t); return q.pieces.filter(g => g.t === 'L' && Math.abs(g.a[1] - g.b[1]) < 1e-9 && Math.abs(g.b[0] - g.a[0]) > 1).map(g => ({ g, top: Math.abs(g.a[1] - L.y1) < 1e-6 })); });
  assert.ok(flat.some(q => q.top) && flat.some(q => !q.top));
  assert.ok(flat.every(({ g, top }) => top === (g.b[0] > g.a[0])), 'clockwise: on top left to right, at the bottom right to left');
  const area = rings.reduce((a, q) => a + q.mm, 0) * PITCH, blend = SIDE * SIDE;
  assert.ok(area > blend && area < 1.6 * blend, `the blend's area in lines ${PITCH} mm wide, over it where a side is narrow: ${Math.round(area)} of ${Math.round(blend)}`);
});

test('no white between the rings (the owner, 2026-10-27, the top right corner): every point of the blend within half a line of one, on a side and round a corner', () => {
  const regions = regionsOf([MIX()], { corner: 4 }), rings = ringsOf(regions, PREVIEW, nearestOf(P)), grid = new Map(), cell = q => `${Math.floor(q[0])},${Math.floor(q[1])}`;
  for (const r of rings) for (const g of r.pieces) { const L = lineLen(g); for (let k = 0; k <= Math.ceil(L / 0.2); k++) { const q = atPiece(g, Math.min(L, k * 0.2)).p; (grid.get(cell(q)) ?? grid.set(cell(q), []).get(cell(q))).push(q); } }
  const near = q => { let d = Infinity; for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const p of grid.get(`${Math.floor(q[0]) + i},${Math.floor(q[1]) + j}`) ?? []) d = Math.min(d, Math.hypot(p[0] - q[0], p[1] - q[1])); return d; };
  const probes = [], A0 = shapeAt(regions[0], 0);
  for (let y = A0.y0 + 0.3; y < A0.y1 - 0.3; y += 0.7) probes.push([200, y]);                              // up through the bottom, the keys, the top
  for (let s = 0.3; s < 120; s += 0.7) probes.push([A0.x0 + s * 0.8, A0.y0 + s]);                        // in through the bottom left corner
  for (let s = 0.3; s < 120; s += 0.7) probes.push([A0.x1 - s * 0.6, A0.y1 - s]);                        // and the top right
  const inside = probes.filter(q => tOf(regions[0], ...q) >= 0 || regions.slice(1).some(R => tOf(R, ...q) >= 0));
  const worst = inside.map(q => [near(q), q]).sort((a, b) => b[0] - a[0])[0];
  assert.ok(inside.length > 300 && worst[0] <= PITCH / 2 + 0.15, `the widest white: ${worst[0].toFixed(2)} mm at ${worst[1].map(v => v.toFixed(1))}`);
});

test('Mixed: the pencils intertwined where no one is the Preview\'s colour, every run Shortest at least, the mix near it', () => {
  const olive = [104, 112, 72], res = resOf(() => olive), regions = regionsOf([MIX()], { corner: 4 });
  const near = ringsOf(regions, res, nearestOf(P)), mixed = ringsOf(regions, res, nearestOf(P), { mix: true, pencils: P, shortest: 5 });
  assert.ok(new Set(near.map(q => q.pencil)).size <= 2, 'Nearest: the one nearest');
  const used = new Map(); for (const q of mixed) used.set(q.pencil, (used.get(q.pencil) ?? 0) + q.mm);
  assert.ok(used.size >= 2, `Mixed: more than one: ${[...used.keys()]}`);
  const short = mixed.filter(q => q.mm < 5 - 1e-6);
  assert.ok(mixed.every(q => joined(q.pieces)) && short.length < 0.1 * mixed.length, `a run a stroke, Shortest at least but at a line's end: ${short.length} of ${mixed.length} shorter`);
  const lin = c => ((c / 255 + 0.055) / 1.055) ** 2.4, total = [...used.values()].reduce((a, v) => a + v, 0);
  const avg = [0, 1, 2].map(m => [...used].reduce((a, [id, mm]) => a + mm * lin(parseInt(P.find(p => p.id === id).hex.slice(1 + 2 * m, 3 + 2 * m), 16)), 0) / total);
  const want = olive.map(lin);
  assert.ok(avg.every((v, m) => Math.abs(v - want[m]) < 0.03), `the mix ${avg.map(v => v.toFixed(3))} near the olive ${want.map(v => v.toFixed(3))}`);
});

test('the rays: along the sausage, its width in lines, a cell a band, the pencil of the Preview over it', () => {
  const regions = regionsOf([MIX()], { corner: 4 }), rays = raysOf([MIX()], regions, PREVIEW, nearestOf(P));
  assert.ok(rays.length >= 1);
  assert.ok(rays.every(r => r.pencil === 'carmine' && r.K === Math.round(SAUSAGE_W / PITCH)), 'red: Carmine Red, five lines');
  for (const r of rays) {
    assert.ok(joined(r.pieces), 'up one line, down the next, the pencil on the paper');
    assert.ok(r.pieces.filter(g => lineLen(g) > PITCH + 1e-6).every(g => Math.abs(g.a[0] - g.b[0]) < 1e-6), 'along the spoke: upright on the bottom');
  }
  const b = MIX();
  const one = raysOf([MIX({ ss: [{ ...SPOKE, paint: 'red' }] })], regions, resOf(() => RED), nearestOf(P));
  assert.ok(one.length > 3 && one.every(r => r.s1 - r.s0 < 30), 'one pencil all the way: still a cell a band, short');
  assert.ok(one.every((r, i) => !i || Math.hypot(r.pieces[0].a[0] - one[i - 1].pieces.at(-1).b[0], r.pieces[0].a[1] - one[i - 1].pieces.at(-1).b[1]) < 1e-6), 'every next from where the last ended: the pencil on');
  const cells = raysOf([b], regions, resOf((x, y) => Math.floor(y / 12) % 2 ? RED : BLUE), nearestOf(P));
  assert.ok(cells.length > 2 && cells.every(r => r.s1 - r.s0 < 30), 'a colour a band or so: short');
  assert.equal(raysOf([b], regions, PREVIEW, nearestOf(P), { frame: { x0: 0, y0: 0, x1: 10, y1: 10 } }).length, 0, 'out of the frame: none');
});

test('the passes: a pencil each in the run\'s order, a ring from its start, near to near; the frame', () => {
  const D = prismaPlan([MIX()], PREVIEW, { pencils: P, corner: 4 }), order = runOrder(P.filter(p => !D.few.includes(p.id))), S = passesOf(D, order);
  assert.deepEqual(S.map(q => q.pencil), order.map(p => p.id).filter(id => S.some(q => q.pencil === id)));
  for (const q of S) {
    assert.ok(q.strokes.every(joined));
    assert.equal(q.modules, q.rings + q.rays);
    assert.ok(Math.abs(q.mm - q.strokes.flat().reduce((a, g) => a + lineLen(g), 0)) < 1e-6);
  }
  const ringStarts = new Set(D.rings.map(q => q.pieces[0].a.join())), starts = S.flatMap(q => q.strokes.map(s => s[0].a.join()));
  assert.ok(starts.filter(s => ringStarts.has(s)).length > 0.5 * starts.length, 'the rings from where they start');
  const F = { x0: 50, y0: 50, x1: 150, y1: 150 }, Df = prismaPlan([MIX()], PREVIEW, { pencils: P, corner: 4, frame: F });
  const pts = Df.modules.flatMap(M => M.pieces.flatMap(g => [g.a, g.b]));
  assert.ok(pts.length && pts.every(p => p[0] > F.x0 - 1.5 && p[0] < F.x1 + 1.5 && p[1] > F.y0 - 1.5 && p[1] < F.y1 + 1.5), 'only what lies in the frame');
});

test('on the machine: a pencil one path, up and down on the move, a p-pause at every change, no fault', () => {
  const D = prismaPlan([MIX()], PREVIEW, { pencils: P, corner: 4 }), S = passesOf(D, runOrder(P.filter(p => !D.few.includes(p.id)))), o = { cw: 400, ch: 400 };
  const R = drawRows(S, P, o);
  assert.equal(R.ps.length, S.length, 'a row a pass');
  assert.equal(R.lifts, S.reduce((a, q) => a + q.strokes.length - 1, 0));
  assert.ok(R.ps.every((row, k) => S[k].strokes.length < 2 || row.filter(g => g.turn).length === S[k].strokes.length - 1), 'the lifts inside the row, on the move');
  assert.ok(R.ps.slice(0, -1).every(row => row.at(-1).tailOut === 0) && R.ps.at(-1).at(-1).tailOut === undefined, 'the pencil left on the paper at a change; the very last lifts');
  const run = plotRun({ ...DEFAULTS, speed: 60, travel: 180, tail: TAIL_MIN, lift: true, ink: false, snake: true, pause: false, rows: R.ps.length, here: { x: 300, y: 300 }, hover: ELBOW_HOVER, minPiece: 0.005 }, [{ key: 'DRAW', ps: R.ps, why: null }]);
  assert.equal(run.fault, '');
  const B = withChanges(run.blocks, R, P, S), pp = B.filter(b => b.kind === 'p-pause');
  assert.deepEqual(pp.map(b => b.pencil), S.map(q => q.pencil));
  assert.equal(B.filter(b => b.kind === 'pause').length, 0, 'never the brush\'s pause');
});

test('rubbed, not touched (the owner, 2026-10-27, the first paper test): every stroke so many times there and back, the darkest pencil fewer, the lightest more', () => {
  const s = [{ t: 'L', a: [0, 0], b: [10, 0] }, { t: 'A', a: [10, 0], b: [12, 2], c: [10, 2], r: 2, left: true }], len = q => q.reduce((a, g) => a + lineLen(g), 0);
  const r4 = rubbed(s, 4);
  assert.equal(r4.length, 8); assert.ok(joined(r4), 'never up between the times');
  assert.ok(Math.abs(len(r4) - 4 * len(s)) < 1e-9); assert.deepEqual(r4.at(-1).b, [0, 0], 'four times: back at its start');
  assert.equal(r4[2].left, false, 'the arc back the other way');
  const pc = id => P.find(p => p.id === id);
  assert.equal(rubsOf(pc('black'), 8, 32), 8); assert.ok(rubsOf(pc('lightpeach'), 8, 32) >= 24, 'a light one near 32');
  assert.ok(rubsOf(pc('orange'), 8, 32) > 8 && rubsOf(pc('orange'), 8, 32) < 32);
  const D = prismaPlan([MIX()], PREVIEW, { pencils: P, corner: 4 }), order = runOrder(P.filter(p => !D.few.includes(p.id)));
  const once = passesOf(D, order), twice = passesOf(D, order, { rubs: () => 16 });
  assert.ok(twice.every((q, k) => q.rubs === 16 && Math.abs(q.mm - 16 * once[k].strokes.flat().reduce((a, g) => a + lineLen(g), 0)) < 16 * (once[k].strokes.length + 1) * JOIN), 'mm the line rubbed, every time over');
  const R = drawRows(twice, P, { cw: 400, ch: 400 });
  assert.ok(R.ps.every(row => row.every((g, i) => !i || Math.hypot(g.a.x - row[i - 1].b.x, g.a.y - row[i - 1].b.y) < 1e-6)), 'a pass one path');
});

test('the pencil pressed and gliding: drawn at Pressure, from stroke to stroke at Between strokes on the paper, never up to +25° on the way', () => {
  const D = prismaPlan([MIX()], PREVIEW, { pencils: P, corner: 4 }), S = passesOf(D, runOrder(P.filter(p => !D.few.includes(p.id))), { rubs: () => 4 }), R = drawRows(S, P, { cw: 400, ch: 400 });
  const run = plotRun({ ...DEFAULTS, speed: 60, travel: 180, tail: TAIL_MIN, lift: true, ink: false, snake: true, pause: false, rows: R.ps.length, here: { x: 300, y: 300 }, hover: -0.1, minPiece: 0.005, pencil: { press: -1.4, glide: -0.1 } }, [{ key: 'DRAW', ps: R.ps, why: null }]);
  assert.equal(run.fault, '');
  const W = run.blocks.filter(b => b.kind === 'move').flatMap(b => b.cmds.filter(c => c.startsWith('W 2 ')).map(c => +c.split(' ')[2]));
  assert.ok(W.length > 100 && W.every(v => v >= -1.4 - 1e-9 && v <= -0.1 + 1e-9), `the elbow on the way between −1.4° and −0.1°: ${Math.min(...W)} … ${Math.max(...W)}`);
  assert.ok(W.includes(-1.4) && W.includes(-0.1));
  assert.ok(run.blocks.some(b => b.kind === 'arm' && b.cmd === 'J 2 -0.1'), 'it comes down to the paper, the carriage standing');
  const B = withChanges(run.blocks, R, P, S, { press: -1.4 }), pp = B.filter(b => b.kind === 'p-pause');
  assert.ok(pp.length === S.length && pp.every(b => { const i = B.indexOf(b); return B[i - 1].kind === 'arm' && B[i - 1].cmd === 'J 2 0'; }), 'every pencil in at 0°, the pressed one back up to it first');
});

test('a ray\'s pieces: K lines PITCH apart, the next back, a mm across at the ends', () => {
  const ps = rayPieces({ a: [0, 0], u: [1, 0], n: [0, 1], K: 3, s0: 2, s1: 6 });
  assert.deepEqual(ps.map(g => [g.a, g.b]), [[[2, -1], [6, -1]], [[6, -1], [6, 0]], [[6, 0], [2, 0]], [[2, 0], [2, 1]], [[2, 1], [6, 1]]]);
});
