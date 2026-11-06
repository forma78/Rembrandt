// FORM-G: a finished picture's plan through OPM-N's own rows and strokes.js's plotRun; the owner's rules on the brush hold, every cell in reach.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { FORMG_LIB, seqOf, passesOf, rowsOf, brushRuns, cellOf, idleLegsOf, airRuns, placeRange } from '../src/formgplan.js';
import { IDLE, idleRowsOf } from '../src/idleplan.js';
import { plotRun, DEFAULTS, ELBOW_HOVER } from '../src/strokes.js';
import { reach } from '../src/machine.js';

const load = id => JSON.parse(fs.readFileSync(new URL(`../formg/${id}.json`, import.meta.url)));
const cup = { hand: true, on: true, up: [30, 35], to: [30, 35], dip: 15, paint: [14, 16], dwell: 1, swing: 40 };
const PIC = { id: 't', w: 100, h: 200, pitch: 5, jars: [] };
const OPTS = { ...DEFAULTS, speed: 25, travel: 180, tail: 3, lift: true, ink: true, snake: true, pause: false, cup, noDipUnder: 0, hover: ELBOW_HOVER, press: 0 };
const grouped = (R, why = k => (k ? 'next' : null)) => R.groups.map((g, k) => ({ key: 'DRAG', ps: g.map(i => R.ps[i]), why: why(k) }));
function runOf(pic, place) {
  const P = passesOf(pic), R = rowsOf(pic, P), W = reach(), here = { x: W.x.min + place.bottom + pic.h / 2, y: W.y.min + place.left + pic.w / 2 };
  return { P, R, r: plotRun({ ...OPTS, rows: R.ps.length, here }, grouped(R)), here, W };
}
const rangeOf = pic => { const R = rowsOf(pic, passesOf(pic)); return placeRange(pic, plotRun({ ...OPTS, rows: R.ps.length }, grouped(R)).carriage, reach()); };

test('the library: every picture has its plan and its image, one grid, the brush 5 mm', () => {
  assert.deepEqual(FORMG_LIB, ['porsche', 'watch']);
  for (const id of FORMG_LIB) {
    const pic = load(id);
    assert.equal(pic.id, id); assert.equal(pic.pitch, 5);
    assert.ok(fs.existsSync(new URL(`../${pic.image}`, import.meta.url)), pic.image);
    const xs = new Set(pic.jars.flatMap(j => j.cells.flatMap(c => c.legs.map(l => l[0]))));
    for (const x of xs) assert.ok(Math.abs((x - pic.box[0]) / 5 - Math.round((x - pic.box[0]) / 5)) < 1e-6, `${id}: a leg off the grid, ${x}`);
    assert.ok(pic.jars.every(j => /^#[0-9A-F]{6}$/i.test(j.hex) && j.name), `${id}: a jar with no colour or name`);
    assert.ok(new Set(pic.jars.map(j => j.id)).size === pic.jars.length, `${id}: a jar twice`);
  }
});

test('only up and down, along the machine\'s X: every leg of every run keeps its Y (README, "How to lay a module")', () => {
  for (const id of FORMG_LIB) for (const P of passesOf(load(id))) for (const q of P.byCell) for (const [a, b] of q.legs) assert.equal(a[0], b[0], `${id}: a leg on the slant`);
});

test('two layers, one list: every jar once, light to dark, then the jars that need it in the same order, the second layer last (the owner, 2026-11-06)', () => {
  const car = load('porsche'), S = seqOf(car), n = car.jars.length, two = car.jars.filter(j => j.coats === 2);
  assert.ok(two.length > 10, 'the Porsche has a second layer');
  assert.deepEqual(S.slice(0, n).map(j => j.id), car.jars.map(j => j.id));
  assert.deepEqual(S.slice(n).map(j => j.jar), two.map(j => j.id), 'the same order');
  assert.ok(S.slice(0, n).every(j => j.layer === 1) && S.slice(n).every(j => j.layer === 2));
  assert.equal(new Set(S.map(j => j.id)).size, S.length, 'every line of the list its own id: Start from, the LCD');
  assert.ok(S.slice(n).every(j => j.name.endsWith('layer 2') && j.hex === car.jars.find(q => q.id === j.jar).hex), 'the same paint, said');
  const watch = load('watch');
  assert.equal(seqOf(watch).length, watch.jars.length, 'the watch: as its picture, one layer');
});

test('the second layer: the same legs, every cell the other way round, so that its dips and bulbs do not fall on the first\'s', () => {
  const pic = { ...PIC, jars: [{ id: 'a', name: 'A', hex: '#112233', coats: 2, cells: [{ n: 1, legs: [[10, 20, 100], [15, 100, 20]] }] }] };
  const [one, two] = passesOf(pic);
  assert.deepEqual(one.byCell[0].legs, [[[10, 22], [10, 98]], [[15, 98], [15, 22]]]);
  assert.deepEqual(two.byCell[0].legs, [[[15, 22], [15, 98]], [[10, 98], [10, 22]]]);
  assert.equal(one.layer, 1); assert.equal(two.layer, 2); assert.equal(one.mm, two.mm);
  const R = rowsOf(pic, [one, two]);
  assert.equal(R.groups.length, 2, 'a pause between them, like two jars');
  assert.match(R.info.at(-1).label, /layer 2/);
});

test('every cell in the list as often as its jar has layers', () => {
  for (const id of FORMG_LIB) {
    const pic = load(id), P = passesOf(pic), want = pic.jars.reduce((a, j) => a + j.cells.length * (j.coats === 2 ? 2 : 1), 0);
    assert.equal(P.reduce((a, q) => a + q.cells, 0), want, id);
  }
});

test('a cell as OPM-N\'s: legs half a tip in, then at once the idle run, no dip, +over at its start and turns, 0 at its very end', () => {
  const pic = { ...PIC, jars: [{ id: 'a', name: 'A', hex: '#112233', cells: [{ n: 1, legs: [[10, 20, 100], [15, 100, 20], [20, 20, 100], [25, 100, 20]] }] }] };
  const [P] = passesOf(pic), c = P.byCell[0];
  assert.deepEqual(c.legs[0], [[10, 22], [10, 98]]);
  const runs = brushRuns([P], 0, 0);
  assert.equal(runs.length, 2, 'its snake, its idle run');
  assert.equal(runs[0].dip, true); assert.equal(runs[1].idle, true); assert.equal(runs[1].dip, false);
  // LAB's five passes over its four tracks
  const n = c.line.length / 2;
  assert.equal(n, 5);
  assert.deepEqual(c.line[0], [10, 22 - IDLE.over], '+2 at its start');
  assert.equal(c.line.at(-1)[0], 25);
  const lastIdle = c.line.slice(-2), span = c.legs.at(-1).map(q => q[1]);
  assert.ok(Math.min(...span) <= Math.min(...lastIdle.map(q => q[1])) + IDLE.over + 1e-9);
});

test('a one-leg cell: its idle run back over itself, nothing into the neighbours\' lanes', () => {
  const legs = [[[10, 22], [10, 98]]];
  assert.deepEqual(idleLegsOf(legs, 3.75), legs);
  const c = cellOf({ n: 1, legs: [[10, 20, 100]] }, PIC, 1);
  assert.ok(c.line.every(q => q[0] === 10), 'its one lane');
});

test('a staircase cell: every idle leg as long as the column it lies nearest', () => {
  const legs = [[[0, 0], [0, 50]], [[5, 60], [5, 10]], [[10, 20], [10, 70]]], L = idleLegsOf(legs, 3.75);
  assert.equal(L.length, 4);
  assert.deepEqual(L[1], [[10 / 3, 60], [10 / 3, 10]]);
  assert.deepEqual(L[3], [[10, 70], [10, 20]]);
});

test('a dial\'s leg: a dip at every cut, on from the lap back, the last with its lift beyond', () => {
  const R = airRuns([[10, 300], [10, 40]], [240, 160, 80], 15);
  assert.deepEqual(R.map(q => q.pts.map(p => p[1])), [[300, 240], [255, 160], [175, 80], [95, 40]]);
  assert.deepEqual(R.map(q => q.dip), [true, true, true, true]);
  assert.deepEqual(R.map(q => q.beyond), [false, false, false, true]);
  assert.equal(airRuns([[10, 300], [10, 280]], [], 15)[0].dip, false, 'a short leg goes on what the brush holds');
  const c = cellOf({ n: 1, air: true, cuts: [150], legs: [[10, 180, 120]] }, PIC, 1);
  assert.deepEqual(c.runs.map(q => q.pts.map(p => p[1])), [[178, 150], [165, 122]], 'its cell the same way');
});

test('idleplan.js as it was without a cell\'s own runs: the same rows for OPM-N', () => {
  const legs = [[[0, 0], [0, 40]], [[5, 40], [5, 0]]], P = { pencil: 'a', byCell: [{ num: 1, legs, line: legs.flat() }], mm: 1 };
  const R = idleRowsOf([P], [{ id: 'a', name: 'A' }], { cw: 100, ch: 100 }, 95, 15);
  assert.equal(R.ps.length, 2); assert.equal(R.ps[0][0].nodip, false); assert.equal(R.ps[1][0].nodip, true);
});

test('a canvas out of the range: plotRun says how far past the walls, FORM-G does not run it', () => {
  const pic = load('porsche'), { r } = runOf(pic, { left: 60, bottom: 0 });
  assert.ok(r.pastWall > 1, 'what plotRun would have pressed into the wall');
});

test('the Porsche 85 cm long, in the middle of its canvas, more white round it, within the reach in one go', () => {
  const pic = load('porsche'), [x0, y0, x1, y1] = pic.box;
  assert.ok(Math.abs(y1 - y0 - 850) < 10 && Math.abs((y0 + y1) / 2 - pic.h / 2) < 8, `y ${y0} … ${y1}`);
  assert.ok(Math.abs((x0 + x1) / 2 - pic.w / 2) < 3);
  const R = rangeOf(pic);
  assert.ok(R.bottom[1] - R.bottom[0] >= 1.5, `a bottom edge keeps within the walls, some room for the elbow's degrees: ${R.bottom}`);
  assert.ok(R.left[0] <= 0 && 0 <= R.left[1], 'its left edge at home will do');
});

test('every picture through plotRun, the canvas in the middle of its range: no fault, nothing pressed into a wall, the dips of the cup at hand, a pause between lines', () => {
  for (const id of FORMG_LIB) {
    const pic = load(id), G = rangeOf(pic), place = { left: (G.left[0] + G.left[1]) / 2, bottom: (G.bottom[0] + G.bottom[1]) / 2 };
    assert.ok(G.left[0] <= G.left[1] && G.bottom[0] <= G.bottom[1], `${id}: no place for the canvas`);
    const { P, r } = runOf(pic, place);
    assert.equal(r.fault, '', id);
    assert.equal(r.pastWall, 0, `${id}: nothing pressed into a wall`); assert.equal(r.gone, 0, `${id}: no leg gone`);
    assert.ok(r.dips >= P.length, `${id}: a dip at every line's start at least`);
    assert.ok(r.blocks.some(q => q.fork), 'the cup at hand: its forks');
    assert.equal(r.blocks.filter(q => q.kind === 'pause').length, P.length - 1, `${id}: a pause between lines`);
  }
});
