// OPM-N's DRAG SNAKE by LAB's + idle 6.0: the same module, the same commands to the board, but for the owner's one correction.
import test from 'node:test';
import assert from 'node:assert/strict';
import { IDLE, idleCellOf, idleDragsOf, idleRowsOf, idleRunsOf, slantedOf } from '../src/idleplan.js';
import { labPlan, LAB } from '../src/labplan.js';
import { plotRun, DEFAULTS } from '../src/strokes.js';
import { opmpPlan, numbersOf, PITCH_NEW } from '../src/opmplan.js';
import { PRISMA_PENCILS } from '../src/prismaplan.js';
import { cleanPencils } from '../src/dacheplan.js';
import { cleanRect } from '../src/inkaplan.js';
import { BLEND, blendSpokes } from '../src/blendplan.js';

const cup = { hand: true, on: true, up: [30, 35], to: [30, 35], dip: 14, paint: [14, 15], dwell: 1, swing: 40 };
const PENCILS = [{ id: 'a', name: 'A' }], O = { cw: 400, ch: 400 };                 // a plan's q0, q1 are the machine's Y, X with Here at the board's centre, 200, 200
const LABP = labPlan({ x0: 0, y0: 0, cup, sheet: 12 });
const rowsOfLab = n => LABP.remote.rows.flatMap((r, i) => r.cells[0][0] === n ? [i + 1] : []);
const said = bs => bs.filter(b => !b.home).map(b => b.cmds ?? b.cmd ?? b.deg);
const off = 2;                                                                       // half the tip: a cell's contour, its first run inset by it
const box = (y0, y1, x0, x1) => [[y0 - off, x0 - off], [y1 + off, x0 - off], [y1 + off, x1 + off], [y0 - off, x1 + off]];
const SQ2 = off * Math.SQRT2;
function runOf(poly, every = IDLE.every, lap = IDLE.lap, over = {}) {
  const passes = idleDragsOf([{ poly, num: 1, pencil: 'a', ray: -1 }], ['a'], over), R = idleRowsOf(passes, PENCILS, O, every, lap);
  const r = plotRun({ ...DEFAULTS, speed: LAB.speed, travel: LAB.travel, tail: 3, lift: true, ink: true, snake: true, pause: false, rows: R.ps.length, here: { x: 200, y: 200 }, cup, noDipUnder: 0, hover: 12, press: 0 }, R.groups.map(g => ({ key: 'DRAG', ps: g.map(i => R.ps[i]), why: null })));
  return { ...r, R, passes, rowsN: R.ps.length, of: row => r.blocks.filter(b => b.row === row) };
}
const lineOf = bs => bs.find(b => b.paintMM > 0).cmds.filter(c => c !== 'G');

test('LAB\'s no. 1, a vertical: the same dips, the same runs, the idle run the same to its last leg, which ends on the module\'s end, no +2', () => {
  const lab = rowsOfLab(1), R = runOf(box(70, 87.5, 100, 180));
  assert.equal(R.fault, '');
  assert.equal(R.rowsN, lab.length);
  lab.slice(0, -1).forEach((row, i) => assert.deepEqual(said(R.of(i + 1)).slice(0), said(LABP.blocks.filter(b => b.row === row)).slice(0), `run ${i + 1}`));
  const L = lineOf(LABP.blocks.filter(b => b.row === lab.at(-1))), M = lineOf(R.of(R.rowsN));
  assert.deepEqual(M.slice(0, -3), L.slice(0, -3), 'the idle run to the last leg');
  assert.ok(L.at(-3).startsWith('L 98.00 87.50'), `LAB's was pressed to +2: ${L.at(-3)}`);
  assert.equal(M.at(-3), 'L 100.00 87.50', 'pressed to the module\'s end');
  assert.match(M.at(-2), /^W 2 10 /); assert.equal(M.at(-1), 'L 79.50 87.50');   // the lift beyond, the carriage against the elbow
});

test('LAB\'s no. 4, lying down: the same, whole legs a dip, 15 and 19 legs', () => {
  const lab = rowsOfLab(4), R = runOf(box(20, 100, 50, 67.5));
  assert.equal(R.fault, '');
  assert.equal(R.rowsN, lab.length);
  lab.slice(0, -1).forEach((row, i) => assert.deepEqual(said(R.of(i + 1)), said(LABP.blocks.filter(b => b.row === row)), `run ${i + 1}`));
  const L = lineOf(LABP.blocks.filter(b => b.row === lab.at(-1))), M = lineOf(R.of(R.rowsN));
  assert.deepEqual(M.slice(0, -3), L.slice(0, -3), 'the idle run to the last leg');
  assert.equal(M.at(-3), 'L 50.00 100.00', 'pressed to the module\'s end, +0');
  assert.equal(R.passes[0].tracks, 15);
});

test('LAB\'s nos. 7 and 8, the diagonals: "we leave them as they are", to the letter, +3 at the very end too', () => {
  const diag = (T, lean) => { const B = T - 30, y = 205, D = SQ2; return lean > 0 ? [[y + 30 - D + off, B - off], [y + 90 + D + off, B - off], [y + 60 + D - off, T + off], [y - D - off, T + off]] : [[y - D - off, B - off], [y + 60 + D - off, B - off], [y + 90 + D + off, T + off], [y + 30 - D + off, T + off]]; };
  for (const [n, poly] of [[7, diag(185, 1)], [8, diag(135, -1)]]) {
    const lab = rowsOfLab(n), R = runOf(poly);
    assert.equal(R.fault, '', `no. ${n}`);
    assert.equal(R.rowsN, lab.length, `no. ${n}: its runs`);
    lab.forEach((row, i) => { const mine = said(R.of(i + 1)); assert.deepEqual(mine, said(LABP.blocks.filter(b => b.row === row)).slice(0, mine.length), `no. ${n}, run ${i + 1}`); });   // the sheet's last row goes on home
  }
});

test('any cell: every leg along the machine\'s X, the idle run\'s too, a step no farther sideways than the legs are apart; inside the cell; the idle no dip', () => {
  const lean = [[0, 0], [90, 0], [120, 40], [30, 40]], wedge = [[0, 0], [60, 0], [60, 55]], steep = [[0, 0], [14, 0], [34, 70], [20, 70]];
  for (const poly of [box(0, 17.5, 0, 80), box(0, 80, 0, 17.5), lean, wedge, steep]) {
    const t = idleCellOf({ poly });
    assert.ok(t.legs.length > 0);
    t.legs.forEach(([a, b]) => assert.ok(Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) >= 3, 'a leg along X'));
    for (let i = 0; i + 1 < t.line.length; i += 2) assert.ok(Math.abs(t.line[i][0] - t.line[i + 1][0]) < 1e-9, 'an idle leg along X');
    for (let i = 1; i + 1 < t.legs.length; i++) assert.ok(Math.abs(t.legs[i][0][0] - t.legs[i - 1][1][0]) <= IDLE.step + 1, 'the next leg a step along');
    const xs = poly.map(q => q[0]), ys = poly.map(q => q[1]);
    t.legs.flat().forEach(q => assert.ok(q[0] >= Math.min(...xs) && q[0] <= Math.max(...xs) && q[1] >= Math.min(...ys) && q[1] <= Math.max(...ys), 'inside its box'));
    const R = runOf(poly);
    assert.equal(R.fault, '');
    assert.ok(R.blocks.filter(b => b.dip).length > 0);
    assert.ok(!R.of(R.rowsN).some(b => b.dip), 'no dip before the idle run');
  }
});

test('the ends: flat +2 and 0 at the very end, a slanted side +3 to the end; the sliders change them', () => {
  const flat = idleCellOf({ poly: box(0, 17.5, 0, 80) }), slant = idleCellOf({ poly: [[0, 0], [60, 0], [90, 30], [30, 30]] });
  assert.ok(!slantedOf(box(0, 17.5, 0, 80)) && slantedOf([[0, 0], [60, 0], [90, 30], [30, 30]]));
  assert.deepEqual([flat.over, flat.end, slant.over, slant.end], [2, 0, 3, 3]);
  assert.deepEqual(flat.line[0], [0, 82], 'starts +2 above the first run\'s top');
  assert.deepEqual(flat.line.at(-1), [17.5, 0], 'ends on its end, +0');
  assert.deepEqual(flat.line[1], [0, -2], '+2 at a turn');
  const o2 = idleCellOf({ poly: box(0, 17.5, 0, 80) }, { over: 5 });
  assert.equal(o2.line[1][1], -5);
});

test('a cell without room for the inset: a thin one a leg in its middle, a long thin one its legs across all of it', () => {
  const t = idleCellOf({ poly: [[0, 0], [3, 0], [3, 40], [0, 40]] });
  assert.equal(t.k, 1);
  assert.ok(Math.abs(t.legs[0][0][0] - 1.5) < 1e-9);
  assert.deepEqual([t.legs[0][0][1], t.legs[0][1][1]], [38, 2]);
  const thin = idleCellOf({ poly: [[0, 0], [80, 0], [80, 3], [0, 3]] });             // a lying row thinner than the tip: all along it
  assert.equal(thin.k, 14);
  assert.deepEqual([thin.legs[0][0][0], thin.legs.at(-1)[0][0]], [2, 78]);
});

test('the dips: small cells share one, as far as Dip every goes; a colour\'s first always; none but that with Dip every 0', () => {
  const cells = [0, 1, 2, 3].map(i => ({ poly: box(i * 20, i * 20 + 4, 0, 12), num: i + 1, pencil: 'a', ray: -1 })), passes = idleDragsOf(cells, ['a']);
  const runs = idleRunsOf(passes, 95, 15), first = runs.filter(r => !r.idle);
  assert.equal(first.length, 4, 'a run a small cell');
  assert.deepEqual(first.map(r => r.dip), [true, false, false, true], 'as much line a dip');
  assert.ok(runs.filter(r => r.idle).every(r => !r.dip), 'the idle runs no dip');
  assert.deepEqual(idleRunsOf(passes, 0, 0).filter(r => r.dip).length, 1, 'Dip every 0: the colour\'s first alone');
  assert.equal(runs.length, 8, 'and an idle run a cell, right after it');
  runs.forEach((r, i) => assert.equal(r.idle, i % 2 === 1));
});

test('a long leg: the run cut in it, the lap back, the last alone with its lift beyond', () => {
  const runs = idleRunsOf(idleDragsOf([{ poly: box(0, 17.5, 0, 200), num: 1, pencil: 'a', ray: -1 }], ['a']), 95, 15).filter(r => !r.idle);
  assert.ok(runs.length > 4);
  runs.forEach((r, i) => assert.equal(r.beyond, i === runs.length - 1));
  runs.forEach(r => assert.ok(r.dip));
});

test('on a real plan: a colour after another, its cells by their numbers, no fault, up through the air, a pause between colours', () => {
  const P = cleanPencils(PRISMA_PENCILS), BLUE = [36, 80, 158], RED = [194, 33, 58], ORANGE = [235, 115, 37], W = 400, H = 400, data = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = x < 200 ? (y < 200 ? BLUE : RED) : (y < 200 ? ORANGE : [80, 160, 70]), i = (y * W + x) * 4; data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 255; }
  const r0 = cleanRect({ id: 1, x: 20, y: 20, w: 360, h: 360, step: 3, kind: BLEND, keys: [{ x: 0.3, y: 0.15, w: 0.5, h: 0.45 }, { x: 0.55, y: 0.35, w: 0.15, h: 0.12 }], corners: [40, 6, 4], steps: 13, core: true });
  const sp = blendSpokes(r0, { trail: 9, edge: 1.75, step: 3, change: 30, density: 50 }).filter((_, i) => i % 3 === 0);
  const persp = cleanRect({ ...r0, ss: sp.map(q => ({ ...q, a: [(q.a[0] - r0.x) / r0.w, (q.a[1] - r0.y) / r0.h], b: [(q.b[0] - r0.x) / r0.w, (q.b[1] - r0.y) / r0.h], paint: 'red' })) });
  const D = opmpPlan([persp], { nx: W, ny: H, h: 1, data }, { pencils: P, corner: 4, facets: 3, pitch: PITCH_NEW, stripW: PITCH_NEW });
  const N = numbersOf(D.cells, D.regions), order = D.drags.map(q => q.pencil), passes = idleDragsOf(N, order), R = idleRowsOf(passes, P, O, 95, 15);
  assert.deepEqual(passes.map(q => q.pencil), order);
  assert.ok(passes.reduce((a, q) => a + q.cells, 0) > 20, 'cells enough to mean something');
  passes.forEach(q => assert.deepEqual(q.byCell.map(c => c.num), q.byCell.map(c => c.num).slice().sort((a, b) => a - b)));
  const r = plotRun({ ...DEFAULTS, speed: 25, travel: 180, tail: 3, lift: true, ink: true, snake: true, pause: false, rows: R.ps.length, here: { x: 300, y: 300 }, cup, noDipUnder: 0, hover: 12, press: 0 }, R.groups.map((g, k) => ({ key: 'DRAG', ps: g.map(i => R.ps[i]), why: k ? 'the next colour' : null })));
  assert.equal(r.fault, '');
  assert.equal(r.blocks.filter(b => b.kind === 'pause').length, passes.length - 1);
  assert.equal(R.ps.length, r.blocks.filter(b => b.paintMM > 0).length, 'a block of paint a run');
  for (const b of r.blocks) (b.cmds ?? []).forEach((c, i) => { if (c[0] === 'W') assert.equal(b.cmds[i + 1][0], 'L', 'W on a piece'); });
});
