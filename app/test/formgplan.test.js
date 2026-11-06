// FORM-G: a finished picture's plan through OPM-N's own rows and strokes.js's plotRun; the owner's rules on the brush hold, every cell in reach.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { FORMG, FORMG_LIB, partsOf, passesOf, rowsOf, brushRuns, cellOf, idleLegsOf, airRuns, placeRange } from '../src/formgplan.js';
import { IDLE, idleRowsOf } from '../src/idleplan.js';
import { plotRun, DEFAULTS, ELBOW_HOVER } from '../src/strokes.js';
import { reach } from '../src/machine.js';

const load = id => JSON.parse(fs.readFileSync(new URL(`../formg/${id}.json`, import.meta.url)));
const cup = { hand: true, on: true, up: [30, 35], to: [30, 35], dip: 15, paint: [14, 16], dwell: 1, swing: 40 };
const PIC = { id: 't', w: 100, h: 200, pitch: 5, jars: [] };
function runOf(pic, part, place) {
  const P = passesOf(pic, part), R = rowsOf(pic, P), W = reach(), here = { x: W.x.min + place.bottom + pic.h / 2, y: W.y.min + place.left + pic.w / 2 };
  const r = plotRun({ ...DEFAULTS, speed: 25, travel: 180, tail: 3, lift: true, ink: true, snake: true, pause: false, rows: R.ps.length, here, cup, noDipUnder: 0, hover: ELBOW_HOVER, press: 0 }, R.groups.map((g, k) => ({ key: 'DRAG', ps: g.map(i => R.ps[i]), why: k ? 'next' : null })));
  return { P, R, r, here, W };
}

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
  for (const id of FORMG_LIB) {
    const pic = load(id);
    for (const part of partsOf(pic)) for (const P of passesOf(pic, part)) for (const q of P.byCell) for (const [a, b] of q.legs) assert.equal(a[0], b[0], `${id}: a leg on the slant`);
  }
});

test('the Porsche is past the reach, two parts, no cell in both; the watch fits; every cell painted once', () => {
  const car = load('porsche'), watch = load('watch');
  assert.deepEqual(partsOf(car), [1, 2]); assert.deepEqual(partsOf(watch), [1]);
  for (const pic of [car, watch]) {
    const cells = pic.jars.reduce((a, j) => a + j.cells.length, 0), legs = pic.jars.reduce((a, j) => a + j.cells.reduce((n, c) => n + c.legs.length, 0), 0);
    const P = partsOf(pic).flatMap(p => passesOf(pic, p));
    assert.equal(P.reduce((a, q) => a + q.cells, 0), cells); assert.equal(P.reduce((a, q) => a + q.tracks, 0), legs);
  }
});

test('part 2 is the canvas turned 180°: p to (w − x, h − y), the same place, in reach', () => {
  const pic = { ...PIC, jars: [{ id: 'a', name: 'A', hex: '#112233', cells: [{ n: 1, legs: [[20, 150, 50]], part: 2 }] }] };
  const [P] = passesOf(pic, 2);
  assert.deepEqual(P.byCell[0].legs[0], [[80, 52], [80, 148]], 'half the tip in from both ends, in the turned frame');
  assert.equal(passesOf(pic, 1).length, 0);
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
  const c = cellOf({ n: 1, legs: [[10, 20, 100]] }, PIC, 1, 1);
  assert.ok(c.line.every(q => q[0] === 10), 'its one lane');
});

test('a staircase cell: every idle leg as long as the column it lies nearest', () => {
  const legs = [[[0, 0], [0, 50]], [[5, 60], [5, 10]], [[10, 20], [10, 70]]], L = idleLegsOf(legs, 3.75);
  assert.equal(L.length, 4);
  assert.deepEqual(L[1], [[10 / 3, 60], [10 / 3, 10]]);
  assert.deepEqual(L[3], [[10, 70], [10, 20]]);
});

test('a dial\'s leg: a dip at every cut, on from the lap back, the last with its lift beyond; the cuts where the file says, the turned too', () => {
  const R = airRuns([[10, 300], [10, 40]], [240, 160, 80], 15);
  assert.deepEqual(R.map(q => q.pts.map(p => p[1])), [[300, 240], [255, 160], [175, 80], [95, 40]]);
  assert.deepEqual(R.map(q => q.dip), [true, true, true, true]);
  assert.deepEqual(R.map(q => q.beyond), [false, false, false, true]);
  assert.equal(airRuns([[10, 300], [10, 280]], [], 15)[0].dip, false, 'a short leg goes on what the brush holds');
  const c = cellOf({ n: 1, air: true, cuts: [150], legs: [[10, 180, 120]] }, { ...PIC, w: 100, h: 200 }, 2, 1);
  assert.deepEqual(c.runs.map(q => q.pts.map(p => p[1])), [[22, 50], [35, 78]], 'turned, going up');
});

test('idleplan.js as it was without a cell\'s own runs: the same rows for OPM-N', () => {
  const legs = [[[0, 0], [0, 40]], [[5, 40], [5, 0]]], P = { pencil: 'a', byCell: [{ num: 1, legs, line: legs.flat() }], mm: 1 };
  const R = idleRowsOf([P], [{ id: 'a', name: 'A' }], { cw: 100, ch: 100 }, 95, 15);
  assert.equal(R.ps.length, 2); assert.equal(R.ps[0][0].nodip, false); assert.equal(R.ps[1][0].nodip, true);
});

test('a canvas out of the range: plotRun says how far past the walls, FORM-G does not run it', () => {
  const pic = load('porsche'), { r } = runOf(pic, 1, { left: 60, bottom: 0 });
  assert.ok(r.pastWall > 1, 'what plotRun would have pressed into the wall');
});

test('every picture through plotRun: no fault, within the walls, the dips of the cup at hand, a pause between jars', () => {
  for (const id of FORMG_LIB) {
    const pic = load(id), W = reach();
    const R = partsOf(pic).map(p => placeRange(pic, p, W)), left = Math.max(...R.map(r => r.left[0])), leftHi = Math.min(...R.map(r => r.left[1])), bottom = Math.max(...R.map(r => r.bottom[0])), bottomHi = Math.min(...R.map(r => r.bottom[1]));
    assert.ok(left <= leftHi && bottom <= bottomHi, `${id}: no place for the canvas that keeps within the walls`);
    const place = { left: (left + leftHi) / 2, bottom: (bottom + bottomHi) / 2 };
    for (const part of partsOf(pic)) {
      const { P, r, here } = runOf(pic, part, place);
      assert.equal(r.fault, '', `${id} part ${part}`);
      assert.equal(r.pastWall, 0, `${id} part ${part}: nothing pressed into a wall`); assert.equal(r.gone, 0, `${id} part ${part}: no leg gone`);
      assert.ok(r.dips >= P.length, `${id} part ${part}: a dip at every jar's start at least`);
      assert.ok(r.blocks.some(q => q.fork), 'the cup at hand: its forks');
    }
  }
});
