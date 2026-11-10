// FORM-G: a finished picture's plan through OPM-N's own rows and strokes.js's plotRun; the owner's rules on the brush hold, every cell in reach.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { FORMG_LIB, OPMG_LIB, seqOf, passesOf, rowsOf, brushRuns, canonRuns, cellOf, idleLegsOf, airRuns, placeRange, framedPic, cleanFrame } from '../src/formgplan.js';
import { landInside, DOSE, CANON } from '../src/canon.js';
import { IDLE, idleRowsOf, idleRunsOf } from '../src/idleplan.js';
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
  assert.deepEqual(FORMG_LIB, ['porsche-race-k', 'porsche-race', 'porsche-red', 'porsche-red-k', 'porsche-white', 'watch']);   // the racing 911's face in the green's place since 2026-11-10; porsche.json stays for the tests below
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

// F, the frame (the owner, 2026-11-08: "a 20 × 20 cm piece first, how many paints mix"; OPM-W's F carried into FORM-G)
const FR = { id: 'f', w: 100, h: 100, pitch: 5, jars: [
  { id: 'a', name: 'A', hex: '#EEEEEE', coats: 2, cells: [{ n: 1, legs: [[12.5, 10, 90], [17.5, 90, 10], [22.5, 10, 90]] }, { n: 2, legs: [[47.5, 70, 80]] }] },
  { id: 'b', name: 'B', hex: '#222222', coats: 1, cells: [{ n: 1, legs: [[77.5, 10, 30]] }] },
  { id: 'c', name: 'C', hex: '#888888', coats: 1, cells: [{ n: 1, legs: [[27.5, 10, 40], [32.5, 60, 50], [37.5, 30, 45]] }] }] };

test('the frame: only the columns whose whole track lies in it, every leg cut at its top and bottom, the way it goes kept', () => {
  const p = framedPic(FR, { x0: 10, y0: 20, x1: 40, y1: 75 });
  assert.deepEqual(p.frame, { x0: 10, y0: 20, x1: 40, y1: 75 });
  assert.deepEqual(p.jars.find(j => j.id === 'a').cells, [{ n: 1, legs: [[12.5, 20, 75], [17.5, 75, 20], [22.5, 20, 75]] }], 'its cell 2, at 47.5, out of the frame');
  assert.equal(p.jars.find(j => j.id === 'b'), undefined, 'a jar with nothing in the frame is out of the list');
  assert.deepEqual(framedPic(FR, { x0: 10, y0: 0, x1: 20, y1: 100 }).jars.find(j => j.id === 'a').cells[0].legs.map(l => l[0]), [12.5, 17.5], 'a column half out is not painted');
  assert.equal(framedPic(FR, null), FR, 'no frame: the picture as it is');
  assert.equal(cleanFrame({ x0: 0, y0: 0, x1: 3, y1: 50 }), null, 'narrower than the pitch: no frame');
});

test('the frame: a cell broken where a leg falls out, so no step crosses the gap; a cut end under minLeg not painted', () => {
  const c = framedPic(FR, { x0: 25, y0: 0, x1: 40, y1: 42 }).jars.find(j => j.id === 'c');
  assert.deepEqual(c.cells, [{ n: 1, legs: [[27.5, 10, 40]] }, { n: 2, legs: [[37.5, 30, 42]] }], 'the leg 50 … 60 out, the cell in two');
  const d = framedPic(FR, { x0: 25, y0: 0, x1: 40, y1: 31 }).jars.find(j => j.id === 'c');
  assert.deepEqual(d.cells, [{ n: 1, legs: [[27.5, 10, 31]] }], 'the leg cut to 1 mm at the frame\'s top: not painted');
});

test('the frame: its coats as they were, the second layer\'s jars last; the same lines, cells and legs through OPM-N\'s rows', () => {
  const p = framedPic(FR, { x0: 10, y0: 20, x1: 40, y1: 75 });
  assert.deepEqual(seqOf(p).map(j => j.id), ['a', 'c', 'a:2']);
  const P = passesOf(p);
  assert.deepEqual(P.map(q => q.cells), [1, 1, 1]);
  for (const q of P) for (const c of q.byCell) for (const l of c.legs) for (const [x, y] of l) assert.ok(x > 10 && x < 40 && y >= 20 && y <= 75, `a leg's point out of the frame: ${x}, ${y}`);
});

test('the Porsche in a 20 × 20 frame at its place: within the walls, no fault, the cup at hand, a pause between lines; most of its jars in the richest piece', () => {
  const pic = load('porsche'), G = rangeOf(pic), place = { left: (G.left[0] + G.left[1]) / 2, bottom: (G.bottom[0] + G.bottom[1]) / 2 };
  const p = framedPic(pic, { x0: 310, y0: 630, x1: 510, y1: 830 });
  assert.ok(p.jars.length >= 45 && p.jars.length < pic.jars.length, `${p.jars.length} of ${pic.jars.length} jars`);
  const { P, r } = runOf(p, place);
  assert.equal(r.fault, ''); assert.equal(r.pastWall, 0); assert.equal(r.gone, 0);
  assert.equal(r.blocks.filter(q => q.kind === 'pause').length, P.length - 1);
  const whole = runOf(pic, place);
  assert.ok(r.seconds < whole.r.seconds / 4, 'a piece, not the picture');
});

// OPM-G (the owner, 2026-11-07): the G-wagon on 60 × 60, at most 36 jars, every jar 1 m at least, its run by the canon of a long leg (canon.js, README)
const loadG = id => JSON.parse(fs.readFileSync(new URL(`../opmg/${id}.json`, import.meta.url)));
function runOfG(pic, place) {
  const P = passesOf(pic, { canon: true }), R = rowsOf(pic, P, 95, 15, true), W = reach(), here = place && { x: W.x.min + place.bottom + pic.h / 2, y: W.y.min + place.left + pic.w / 2 };
  return { P, R, r: plotRun({ ...OPTS, rows: R.ps.length, ...(here ? { here } : {}) }, grouped(R)) };
}

test('OPM-G\'s library: the G-wagon on 60 × 60, 36 jars at most, every jar 1 m of line at least as its list shows it ("from 60 to 36 … 1 metre at least")', () => {
  assert.deepEqual(OPMG_LIB, ['gwagon']);
  const pic = loadG('gwagon');
  assert.equal(pic.w, 600); assert.equal(pic.h, 600); assert.equal(pic.pitch, 5);
  assert.ok(fs.existsSync(new URL(`../${pic.image}`, import.meta.url)), pic.image);
  assert.ok(pic.jars.length <= 36, `${pic.jars.length} jars`);
  for (const q of passesOf(pic, { canon: true })) assert.ok(q.mm >= 1000, `${q.pencil}: ${Math.round(q.mm)} mm`);
  for (const q of passesOf(pic)) assert.ok(q.mm >= 1000, `${q.pencil}: ${Math.round(q.mm)} mm, FORM-G's reckoning too`);
  const xs = new Set(pic.jars.flatMap(j => j.cells.flatMap(c => c.legs.map(l => l[0]))));
  for (const x of xs) assert.ok(Math.abs((x - 2.5) / 5 - Math.round((x - 2.5) / 5)) < 1e-6, `a leg off the grid, ${x}`);
  for (const P of passesOf(pic, { canon: true })) for (const q of P.byCell) for (const [a, b] of q.legs) assert.equal(a[0], b[0], 'a leg on the slant');
});

test('the canon (no. 9): a dip\'s run lands inside its first leg, 16 mm along it or 0.6 of a shorter one, back to its start, then along it; one without a dip as it is', () => {
  assert.deepEqual(landInside([[10, 20], [10, 120]], true), [[10, 36], [10, 20], [10, 120]]);
  assert.deepEqual(landInside([[10, 20], [10, 40]], true), [[10, 32], [10, 20], [10, 40]], '0.6 of 20');
  assert.deepEqual(landInside([[10, 20], [10, 120]], false), [[10, 20], [10, 120]]);
  // a rope of short legs: inside its own line, back along it to its start
  const rope = [[0, 0], [0, 10], [5, 10], [5, 0], [10, 0], [10, 10]], L = landInside(rope, true);
  assert.deepEqual(L.slice(0, 4), [[5, 9], [5, 10], [0, 10], [0, 0]]);
  assert.deepEqual(L.slice(4), rope.slice(1));
  const pic = loadG('gwagon'), P = passesOf(pic, { canon: true });
  const runs = canonRuns(P, 15).filter(r => !r.idle), dips = runs.filter(r => r.dip);      // the canon alone, before the dose
  assert.ok(dips.length >= P.length);
  // inside its first leg (the same column, back towards the leg's start), or a rope's inside its own line; only a lone leg under 16 mm lands at its start
  const inLeg = r => r.pts.length > 2 && r.pts[0][0] === r.pts[1][0] && r.pts[1][0] === r.pts[2][0] && (r.pts[2][1] - r.pts[1][1]) * (r.pts[0][1] - r.pts[1][1]) > 0;
  assert.ok(dips.filter(inLeg).length > dips.length * 0.6, 'most land inside their first leg');
  assert.ok(dips.filter(r => r.pts.length === 2).every(r => Math.abs(r.pts[1][1] - r.pts[0][1]) < 16), 'a dip\'s run not landed inside: a lone leg under 16 mm');
  assert.ok(dips.filter(r => r.pts.length > 2).length > dips.length * 0.95);
  // the legs under 30 mm go on what a longer one leaves, to 79 mm of plan
  let held = 0;
  for (const r of canonRuns(P, 15)) { if (r.idle) continue; const L = r.pts.slice(1).reduce((t, q, i) => t + Math.hypot(q[0] - r.pts[i][0], q[1] - r.pts[i][1]), 0); held = r.dip ? 0 : held + L; assert.ok(held <= 79.5 + 1e-6, `${held} mm on what the brush holds`); }
});

test('OPM-G\'s G-wagon through plotRun, the canvas in the middle of its range: no fault, nothing pressed into a wall, the cup at hand\'s forks, a pause between lines', () => {
  const pic = loadG('gwagon'), { r: free } = runOfG(pic), G = placeRange(pic, free.carriage, reach());
  assert.ok(G.left[0] <= G.left[1] && G.bottom[0] <= G.bottom[1], `a place for the canvas: ${G.left} · ${G.bottom}`);
  const { P, r } = runOfG(pic, { left: (G.left[0] + G.left[1]) / 2, bottom: (G.bottom[0] + G.bottom[1]) / 2 });
  assert.equal(r.fault, ''); assert.equal(r.pastWall, 0); assert.equal(r.gone, 0);
  assert.ok(r.blocks.some(q => q.fork), 'the cup at hand: its forks');
  assert.equal(r.blocks.filter(q => q.kind === 'pause').length, P.length - 1);
  assert.ok(P.filter(q => q.layer === 2).length > 0 && P.findIndex(q => q.layer === 2) > P.findLastIndex(q => q.layer === 1), 'the second layer last');
});

// the dose (canon.js; the owner, 2026-11-09, LAB's real 3: short cells dabs, a tail after 79 mm pale, "FORM-G and OPM-G need fixing too"): every run on a dip of its own,
// a short leg after DOSE.tail mm of line a dip at its start; the idle runs as they were, so every leg still gone over
const legLen = (pts, i) => { let j = i + 1, leg = 0; while (j < pts.length && Math.abs(pts[j][0] - pts[j - 1][0]) < 1e-6) { leg += Math.abs(pts[j][1] - pts[j - 1][1]); j++; } return leg; };
function doseHolds(runs, label) {
  for (const r of runs.filter(r => !r.idle)) {
    assert.ok(r.dip, `${label}: a run on what another left`);
    let s = 0;
    for (let i = 1; i < r.pts.length; i++) {
      const a = r.pts[i - 1], b = r.pts[i];
      if (Math.abs(b[0] - a[0]) > 1e-6) { const leg = legLen(r.pts, i); assert.ok(!(s >= DOSE.tail && leg > 0 && leg < CANON.rideUnder), `${label}: a ${leg} mm leg after ${s.toFixed(0)} mm of line`); }
      s += Math.hypot(b[0] - a[0], b[1] - a[1]);
    }
  }
}
test('FORM-G\'s run by the dose: every run on a dip of its own, no landing inside (not on the canon), the same points in the same order, the idle runs as they were', () => {
  for (const id of FORMG_LIB) {
    const P = passesOf(load(id)), a = brushRuns(P, 95, 15), b = idleRunsOf(P, 95, 15);
    doseHolds(a, id);
    assert.deepEqual(a.filter(r => r.idle), b.filter(r => r.idle), `${id}: the idle runs`);
    const flat = R => R.filter(r => !r.idle).flatMap(r => r.pts);
    assert.deepEqual(flat(a), flat(b), `${id}: no point added, none moved`);
    assert.ok(a.filter(r => r.dip).length > b.filter(r => r.dip).length, `${id}: more dips`);
  }
});
test('OPM-G\'s run by the dose: every run on a dip of its own, landing inside as the canon\'s, the idle runs as the canon has them', () => {
  for (const id of OPMG_LIB) {
    const P = passesOf(loadG(id), { canon: true }), a = brushRuns(P, 95, 15, true), b = canonRuns(P, 15);
    doseHolds(a, id);
    assert.deepEqual(a.filter(r => r.idle), b.filter(r => r.idle), `${id}: the idle runs`);
    for (const r of a.filter(r => !r.idle)) assert.ok(r.pts.length > 2 || Math.abs(r.pts[1][1] - r.pts[0][1]) < CANON.insideMin, `${id}: a dip's run of ${Math.abs(r.pts[1][1] - r.pts[0][1])} mm not landed inside`);
    const rows = rowsOf(loadG(id), P, 95, 15, true);
    assert.equal(rows.ps.filter(p => !p[0].nodip).length, a.filter(r => r.dip).length, `${id}: a row's dip as its run's`);
  }
});

// ---------- FORM-G as LAB's real 3, and DRAW BW (the owner, 2026-11-10, before the red 911 on 70 × 100) ----------
test('FORM-G\'s run as real 3: a dip every 79 mm, no slack, the J3 compensation 3 + 3 on the machine\'s path alone, the idle runs and the screen as they were', async () => {
  const { R3, j3Runs } = await import('../src/formgplan.js');
  const { ELBOW_J3 } = await import('../src/canon.js');
  assert.deepEqual(R3, { every: 79, slack: 0, j3: { early: 3, late: 3 } });
  assert.equal(R3.j3, ELBOW_J3, 'LAB\'s and FORM-G\'s one number');
  assert.deepEqual(j3Runs([{ pts: [[10, 50], [10, 80], [15, 80], [15, 60]], dip: true }, { pts: [[10, 50], [10, 80]], idle: true }]),
    [{ pts: [[10, 47], [10, 80], [15, 80], [15, 57]], dip: true }, { pts: [[10, 50], [10, 80]], idle: true }], 'landing 3 mm before the first point, back along its first piece; lifting 3 mm past the last; the idle run as it was');
  assert.deepEqual(j3Runs([{ pts: [[10, 4], [10, 30]] }], R3.j3, { floor: 2 })[0].pts, [[10, 2], [10, 33]], 'no farther than the floor');
  const pic = load('porsche-red'), P = passesOf(pic), runs = brushRuns(P, R3.every, FORMG_LAP, false, R3.slack);
  const len = pts => pts.slice(1).reduce((t, q, i) => t + Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]), 0);
  for (const r of runs.filter(r => !r.idle)) assert.ok(len(r.pts) <= R3.every + 1e-6, `a run of ${len(r.pts).toFixed(1)} mm on one dip`);
  const plain = rowsOf(pic, P, R3.every, FORMG_LAP, false, { slack: 0 }), j3 = rowsOf(pic, P, R3.every, FORMG_LAP, false, { slack: 0, j3: R3.j3 });
  assert.equal(j3.ps.length, plain.ps.length);
  const rowLen = p => p.reduce((t, g) => t + Math.hypot(g.b.x - g.a.x, g.b.y - g.a.y), 0);
  runs.forEach((r, i) => assert.ok(Math.abs(rowLen(j3.ps[i]) - rowLen(plain.ps[i]) - (r.idle ? 0 : 6)) < 1e-6, `row ${i + 1}: ${r.idle ? 'idle, as it was' : '6 mm longer on the machine'}`));
  assert.deepEqual(rowsOf(pic, P), rowsOf(pic, P, FORMG_EVERY, FORMG_LAP, false, {}), 'without R3 as before (OPM-G\'s, and the defaults)');
});
const FORMG_EVERY = 95, FORMG_LAP = 15;

test('DRAW BW\'s contour: every border between two colours as the brush leaves them, the later jar over the earlier, every piece once, joined', async () => {
  const { contourOf } = await import('../src/formgplan.js');
  // two columns: A the whole of both, 20 mm; B, darker, over the right one's top half
  const pic = { ...PIC, w: 10, h: 20, jars: [{ id: 'a', cells: [{ n: 1, legs: [[2.5, 0, 20], [7.5, 20, 0]] }] }, { id: 'b', cells: [{ n: 1, legs: [[7.5, 10, 20]] }] }] };
  const C = contourOf(pic);
  assert.equal(C.mm, 60 + 5 + 10, 'the outline round both, B\'s bottom across its column, and between the columns where A meets B');
  assert.ok(C.lines.length <= 2, `${C.lines.length} lines`);
  for (const l of C.lines) for (let i = 1; i < l.length; i++) assert.ok(l[i][0] === l[i - 1][0] || l[i][1] === l[i - 1][1], 'along or across, the columns\' steps');
  assert.equal(contourOf({ ...pic, jars: [pic.jars[0]] }).mm, 60, 'one colour: its outline alone');
  // the red 911: one line for every border, never twice
  const red = contourOf(load('porsche-red')), seen = new Set();
  for (const l of red.lines) for (let i = 1; i < l.length; i++) {
    const a = l[i - 1], b = l[i], k = [a, b].map(q => q.join(',')).sort().join('|');
    assert.ok(!seen.has(k), 'a piece drawn twice'); seen.add(k);
  }
  assert.ok(red.lines.length > 100 && red.mm > 20000, `${red.lines.length} lines, ${(red.mm / 1000).toFixed(1)} m`);
});
test('DRAW BW\'s outline alone (the owner, 2026-11-10: "to centre it the contour without the lines inside is enough"): only where a colour meets the bare canvas', async () => {
  const { contourOf } = await import('../src/formgplan.js');
  const pic = { ...PIC, w: 10, h: 20, jars: [{ id: 'a', cells: [{ n: 1, legs: [[2.5, 0, 20], [7.5, 20, 0]] }] }, { id: 'b', cells: [{ n: 1, legs: [[7.5, 10, 20]] }] }] };
  const O = contourOf(pic, { outline: true });
  assert.equal(O.mm, 60, 'round both columns, nothing between A and B');
  assert.equal(O.lines.length, 1, 'one closed line');
  assert.deepEqual(O.lines[0][0], O.lines[0].at(-1));
  const red = contourOf(load('porsche-red'), { outline: true }), all = contourOf(load('porsche-red'));
  assert.ok(red.mm < all.mm / 5 && red.lines.length < 10, `${red.lines.length} lines, ${(red.mm / 1000).toFixed(2)} m`);
});

test('DRAW BW through plotRun, the pen at the brush\'s elbow: no fault, every mm with the pen down, within the walls where the brush\'s run is', async () => {
  const { contourOf, PEN } = await import('../src/formgplan.js');
  const { machinePiece } = await import('../src/inkaplan.js');
  const { landingCheck, TAIL_MIN } = await import('../src/strokes.js');
  const pic = load('porsche-red'), rg = rangeOf(pic), W = reach(), mid = ([a, b]) => (a + b) / 2;
  const here = { x: W.x.min + mid(rg.bottom) + pic.h / 2, y: W.y.min + mid(rg.left) + pic.w / 2 }, C = contourOf(pic), press = 0, glide = press + PEN.air;
  const ps = C.lines.map((l, i) => l.slice(1).map((b, j) => ({ ...machinePiece({ t: 'L', a: l[j], b }, { cw: pic.w, ch: pic.h }), tilt: 0, row: i + 1 })));
  const r = plotRun({ ...DEFAULTS, speed: PEN.speed, travel: 180, tail: TAIL_MIN, lift: true, ink: false, snake: false, pause: false, minPiece: 0.005, pencil: { press, glide }, hover: glide, here, rows: ps.length }, [{ key: 'DRAW', ps, why: null }]);
  assert.equal(r.fault, '');
  assert.ok(r.pastWall < 0.05 && !r.gone, `${r.pastWall} mm past the walls`);
  assert.equal(r.dips, 0, 'no dip');
  const dbg = landingCheck(r.blocks, press, glide);
  assert.ok(dbg.ok, `${dbg.bad.length} pieces not down`);
  assert.equal(dbg.lines, C.lines.length);
  assert.ok(Math.abs(dbg.pressed - dbg.drawn) < 1e-6 && Math.abs(dbg.drawn - (C.mm - 2 * TAIL_MIN * C.lines.length)) < 1, `${dbg.pressed} of ${C.mm} mm pressed (the landings' and the lifts' ${TAIL_MIN} mm apart)`);
});
