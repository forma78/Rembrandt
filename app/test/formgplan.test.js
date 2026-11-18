// FORM-G: a finished picture's plan through OPM-N's own rows and strokes.js's plotRun; the owner's rules on the brush hold, every cell in reach.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { FORMG_LIB, OPMG_LIB, PRESS_OK, passOf, pointsOf, seqOf, passesOf, rowsOf, brushRuns, canonRuns, cellOf, idleLegsOf, airRuns, placeRange, framedPic, cleanFrame, R3, MARKS, stripsOf, marksOf, withMarks, markCellsOf, fillOf, DROPS, squareSnake, backLine, againOf, myJarsOf, withJars, CLASSIC, JAR_NAME } from '../src/formgplan.js';
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
  assert.deepEqual(FORMG_LIB, ['porsche-targa', 'porsche-headlight-v2', 'porsche-headlight', 'porsche-race-k', 'porsche-red-k', 'porsche-red-v3', 'porsche-red-v4', 'porsche-white', 'watch']);   // the racing 911's face in the green's place since 2026-11-10; porsche.json stays for the tests below; each 911's v.2 alone since 2026-11-11, its v.1 on the disk; the classic's v.3 after its v.2 (2026-11-11), its v.4 after it (2026-11-13)
  for (const id of FORMG_LIB) assert.doesNotMatch(load(id).title + load(id).sub, /Kuzya/, `${id}: no "Kuzya" on its card (the owner, 2026-11-11: "it only makes noise")`);
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

test('the orange, Jar 6, the first of Layer 2 (the canon, the owner, 2026-11-11: "Jar 6, the orange, is sensitive to the grey next to it … Jar 6 always at the start of Layer 2")', () => {
  for (const id of ['porsche-red-k', 'porsche-red', 'porsche-red-v3']) {
    const pic = load(id), S = seqOf(pic), one = S.filter(q => q.layer === 1), at = S.findIndex(q => q.id === 'j6');
    const six = pic.jars.find(j => j.name === 'Jar 6');
    assert.equal(six.id, 'j6'); assert.equal(six.hex, '#EE8A22'); assert.ok(six.late);
    assert.equal(at, one.length, `${id}: the orange the first line of Layer 2`);
    assert.ok(S.slice(0, at).every(q => q.layer === 1 && q.id !== 'j6') && S.slice(at).every(q => q.layer === 2), `${id}: the first layer whole before it`);
    assert.equal(S.filter(q => q.jar === 'j6' || q.id === 'j6').length, 1, `${id}: once, as its one coat`);
    assert.equal(one.at(-1).name, 'Black', `${id}: Black the last of the first layer`);
    assert.ok(pic.jars.every(j => j.name === 'Black' || /^Jar \d+$/.test(j.name)), `${id}: a jar by its number, Black the one word ("we do not call the black Wheels")`);
  }
  const k = seqOf(load('porsche-red-k'));
  assert.equal(k.length, 62); assert.equal(k.findIndex(q => q.id === 'j6') + 1, 41, 'v.2: Jar 6 the 41st line, Black the 40th'); assert.equal(k[39].name, 'Black');
  // its cells as a first coat runs them, not turned round as a second coat's
  const pic = { ...PIC, jars: [{ id: 'a', name: 'A', hex: '#112233', coats: 1, late: true, cells: [{ n: 1, legs: [[10, 20, 100], [15, 100, 20]] }] }, { id: 'b', name: 'B', hex: '#445566', coats: 2, cells: [{ n: 1, legs: [[30, 20, 100]] }] }] };
  const P = passesOf(pic);
  assert.deepEqual(P.map(q => [q.pencil, q.layer]), [['b', 1], ['a', 2], ['b:2', 2]]);
  assert.deepEqual(P[1].byCell[0].legs, [[[10, 22], [10, 98]], [[15, 98], [15, 22]]]);
});

test('the classic\'s v.4: v.3 to the leg, its shadow beside the car in Black, the last two lines, never on the car (the owner, 2026-11-13: "the Porsche\'s form is not to be touched"; "about 10 cm to the side")', () => {
  const v3 = load('porsche-red-v3'), v4 = load('porsche-red-v4'), S = seqOf(v4), sh = v4.jars.at(-1);
  assert.deepEqual(v4.jars.slice(0, -1), v3.jars, 'the car as v.3 painted it, every jar, cell and leg');
  assert.ok(sh.last && sh.name === 'Black · shadow' && sh.hex === v3.jars.find(j => j.name === 'Black').hex && sh.coats === 2, 'the car\'s Black, two coats');
  assert.deepEqual(S.slice(0, seqOf(v3).length).map(q => q.id), seqOf(v3).map(q => q.id), 'v.3\'s list as it was');
  assert.deepEqual(S.slice(-2).map(q => [q.id, q.coat]), [['shadow', 1], ['shadow:2', 2]], 'the shadow\'s two coats the last two lines: Start from its first runs it alone');
  const car = new Map();
  for (const j of v3.jars) for (const c of j.cells) for (const [x, a, b] of c.legs) (car.get(x) ?? car.set(x, []).get(x)).push([Math.min(a, b), Math.max(a, b)]);
  const right = Math.max(...car.keys());
  for (const c of sh.cells) for (const [x, a, b] of c.legs) {
    const lo = Math.min(a, b), hi = Math.max(a, b);
    assert.ok(hi - lo >= 8 && x > 450 && x <= right + 80, `a leg at ${x}: beside the car, on its right, 8 cm at most: what the brush reaches at the place (left −60)`);
    for (const [p, q] of car.get(x) ?? []) assert.ok(hi <= p - 6 || lo >= q + 6, `a leg at ${x} ${lo}…${hi}: 6 mm off the car's ${p}…${q} along the column, the J3's 3 + 3`);
  }
  for (const c of sh.cells) for (let k = 1; k < c.legs.length; k++) assert.ok(c.legs[k][0] - c.legs[k - 1][0] === 5 && Math.abs(c.legs[k][1] - c.legs[k - 1][2]) <= 7, 'a snake: the next column, a step of 7 mm at most');
  // MARKS: the shadow no cell, v.3's lines theirs as v.3 laid them on the paper
  const cells = markCellsOf(S), M = marksOf(S, { strips: [{ no: 1, side: 'left', cell: (k, row) => [k, row] }] });
  assert.deepEqual(cells.slice(0, -2), markCellsOf(seqOf(v3)));
  assert.deepEqual(cells.slice(-2).map(q => q.k), [undefined, undefined]);
  assert.deepEqual(M.slice(-2), [null, null], 'no marks before the shadow\'s lines');
  const P = passesOf(v4), runs = withMarks(P.map((q, k) => ({ pass: k, num: 1, pts: [] })), P, S, M);
  assert.ok(runs.filter(r => r.pass >= P.length - 2).every(r => !r.mark));
});

test('the front indicators\' orange on the classic\'s v.2 by the owner\'s marks: the bumper\'s reds from its front end on, but the four strokes at each outer corner; the two inner tips out, no bare canvas (2026-11-11, details-2-3.png, details-2-5.png)', () => {
  const pic = load('porsche-red-k'), amber = new Map(), CORNERS = [217.5, 222.5, 227.5, 232.5, 467.5, 472.5, 477.5, 482.5];
  const at = x => pic.jars.flatMap(j => j.cells.flatMap(c => c.legs.filter(l => l[0] === x).map(l => ({ jar: j, lo: Math.min(l[1], l[2]), hi: Math.max(l[1], l[2]) }))));
  for (const c of pic.jars.find(j => j.late).cells) for (const [x, a, b] of c.legs) if (Math.min(a, b) >= 500) amber.set(x, [Math.min(a, b), Math.max(a, b)]);
  assert.ok(amber.size >= 20 && !amber.has(267.5) && !amber.has(432.5), 'both front indicators, their inner tips out ("the two outermost orange ones removed")');
  let above = 0, corner = 0;
  for (const j of pic.jars.filter(q => !q.late)) for (const c of j.cells) for (const [x, a, b] of c.legs) {
    const o = amber.get(x), lo = Math.min(a, b), hi = Math.max(a, b);
    if (!o || hi <= o[0] || (lo + hi) / 2 <= (o[0] + o[1]) / 2) continue;   // not on it, or on the wing's side
    if (CORNERS.includes(x)) { assert.ok(lo < o[1], `${j.name} at x ${x}: a corner stroke pulled down onto the orange's 3 mm`); corner++; continue; }
    assert.ok(lo >= o[1] - 1e-9, `${j.name} at x ${x}: ${lo}…${hi} over the orange ${o[0]}…${o[1]}`);
    above++;
  }
  assert.equal(corner, 8, 'four strokes at each indicator\'s corner ("literally 4 strokes on the left and 4 on the right")');
  assert.ok(above >= 10, 'the bumper\'s reds still there, from the orange\'s front end on');
  for (const x of [267.5, 432.5]) {                                                   // the tips: the red under them on to the bumper's leg, no gap
    const legs = at(x).filter(q => q.hi > 880).sort((p, q) => p.lo - q.lo);
    for (let k = 1; k < legs.length; k++) assert.ok(legs[k].lo <= Math.max(...legs.slice(0, k).map(q => q.hi)), `x ${x}: bare canvas at ${legs[k].lo}`);
    assert.ok(legs.every(q => !q.jar.late));
  }
  for (const j of pic.jars) j.cells.forEach((c, i) => { assert.equal(c.n, i + 1); for (let k = 1; k < c.legs.length; k++) assert.ok(Math.abs(c.legs[k][0] - c.legs[k - 1][0]) <= pic.pitch + 1e-9, `${j.name} cell ${c.n}: a step across a gap`); });
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

test('FORM-G\'s cells since 2026-11-17, drops first: a zone\'s legs half a tip in, every leg its drops on dips of their own, at its start and every 35 mm at most; then at once one snake over them and back, no dip; a stroke jar a dip a leg, then that leg again the same way, no dip', () => {
  const legs = [[10, 20, 100], [15, 100, 20], [20, 20, 100], [25, 100, 20]];
  const pic = { ...PIC, jars: [{ id: 'a', name: 'A', hex: '#112233', fill: 'zone', cells: [{ n: 1, legs }, { n: 2, legs: [[40, 10, 190]] }] }, { id: 'b', name: 'B', hex: '#445566', fill: 'strokes', cells: [{ n: 1, legs }] }] };
  const [Z, St] = passesOf(pic), c = Z.byCell[0];
  assert.equal(Z.fill, 'zone'); assert.equal(St.fill, 'strokes');
  assert.deepEqual(c.legs[0], [[10, 22], [10, 98]]);
  assert.deepEqual(c.line, [[25, 20], [25, 100], [20, 100], [20, 20], [15, 20], [15, 100], [10, 100], [10, 22]], 'the second run: the legs again, the last first, each the other way, 2 mm past their ends, 0 at its very end');
  const runs = brushRuns([Z, St], 79, 15, false, 0), z1 = runs.filter(r => r.pass === 0 && r.num === 1);
  assert.equal(z1.length, 13, 'a 76 mm leg three drops, four legs, then one snake');
  z1.slice(0, 12).forEach((r, i) => {
    const leg = c.legs[Math.floor(i / 3)];
    assert.equal(r.dab, true); assert.equal(r.dip, true, `drop ${i + 1} on a dip of its own`);
    if (i % 3 === 0) assert.deepEqual(r.pts[0], leg[0], `drop ${i + 1} at its leg's start, the snake's way: top and bottom in turn`);
    assert.equal(Math.abs(r.pts[1][1] - r.pts[0][1]), DROPS.mark, 'a mark of 8 mm along it');
    assert.equal(Math.sign(r.pts[1][1] - r.pts[0][1]), Math.sign(leg[1][1] - leg[0][1]), '… the way the snake goes');
  });
  assert.deepEqual(z1.slice(0, 3).map(r => r.pts[0][1]), [22, 47.333, 72.667], 'evenly from its start, 25.3 mm apart');
  assert.deepEqual(z1[12].pts, [...c.legs.flat(), ...c.line], 'the snake: every leg start to end, across at its turns, then on at once, back'); assert.equal(z1[12].dip, false); assert.equal(z1[12].snake, true); assert.equal(z1[12].idle, false);
  const long = runs.filter(r => r.pass === 0 && r.num === 2);
  assert.deepEqual(long.filter(r => r.dab).map(r => r.pts[0][1]), [12, 41.333, 70.667, 100, 129.333, 158.667], 'a 176 mm leg: six drops, evenly from its start, 29.3 mm apart');
  assert.equal(long.filter(r => !r.dab).length, 1, 'then one drag through them all, no stop');
  const st = runs.filter(r => r.pass === 1);
  assert.equal(st.length, 8, 'strokes: a run a leg, each leg then again');
  St.byCell[0].legs.forEach((l, i) => {
    const [one, again] = st.slice(2 * i, 2 * i + 2), d = Math.sign(l[1][1] - l[0][1]);
    assert.equal(one.dip, true); assert.deepEqual(one.pts, l, `leg ${i + 1} alone`); assert.ok(!one.dab && !one.snake);
    assert.equal(again.dip, false); assert.equal(again.idle, true, `leg ${i + 1} again, no dip`);
    assert.deepEqual(again.pts, [[l[0][0], l[0][1] - 2 * d], l[1]], `… the same way, from 2 mm before its start, where the dip's drop lies, to its end: never back`);
  });
  assert.equal(St.byCell[0].mm, 4 * (76 + 78), 'a stroke cell\'s metres: its legs and their second runs, no turns');
  assert.equal(runs.filter(r => r.idle).length, 4, 'the strokes\' second runs alone: the zone\'s goes on in its snake');
});

test('the snake\'s turns square (the owner, 2026-11-17: "pass the track fully and only then go over to the next"): a leg to its very end, then straight across at the level both reach', () => {
  assert.deepEqual(squareSnake([[[0, 0], [0, 40]], [[5, 40], [5, 0]]]), [[0, 0], [0, 40], [5, 40], [5, 0]], 'level: as before');
  assert.deepEqual(squareSnake([[[0, 0], [0, 40]], [[5, 50], [5, 10]]]), [[0, 0], [0, 40], [5, 40], [5, 50], [5, 10]], 'the next longer: across at this one\'s end, on up to its own start, then down');
  assert.deepEqual(squareSnake([[[0, 0], [0, 40]], [[5, 30], [5, 10]]]), [[0, 0], [0, 40], [0, 30], [5, 30], [5, 10]], 'the next shorter: this one to its end, back to the next one\'s level, across');
  assert.deepEqual(squareSnake([[[0, 40], [0, 0]], [[5, 10], [5, 30]]]), [[0, 40], [0, 0], [0, 10], [5, 10], [5, 30]], 'down: the same');
  assert.deepEqual(squareSnake([[[0, 0], [0, 40]], [[5, 60], [5, 50]]]), [[0, 0], [0, 40], [5, 60], [5, 50]], 'no overlap: straight to its start, as before');
  assert.deepEqual(backLine([[[0, 0], [0, 40]], [[5, 50], [5, 10]]], 2), [[5, 8], [5, 52], [5, 42], [0, 42], [0, 0]], 'back: the last first, 2 mm past, 0 at its very end, square');
  for (const id of FORMG_LIB) {
    const runs = brushRuns(passesOf(load(id)), 79, 15, false, 0).filter(r => r.snake || r.idle);
    let slant = 0;
    for (const r of runs) r.pts.slice(1).forEach((b, i) => { const a = r.pts[i]; if (Math.abs(b[0] - a[0]) > 1e-6 && Math.abs(b[1] - a[1]) > 1e-6) slant++; });
    const turns = load(id).jars.flatMap(j => j.cells).reduce((t, c) => t + c.legs.length - 1, 0);
    assert.ok(slant <= 0.1 * turns, `${id}: ${slant} slanted steps of ${turns} turns, legs that do not overlap alone`);
  }
});

test('a jar\'s fill by its cells, its json\'s `fill` first; a motion blur\'s stripe and a dial\'s leg strokes in any jar', () => {
  const wide = { n: 1, legs: [[10, 0, 60], [15, 60, 0], [20, 0, 60]] }, thin = { n: 2, legs: [[50, 0, 12]] };
  assert.equal(fillOf({ cells: [wide, thin] }), 'zone');
  assert.equal(fillOf({ cells: [wide, thin], fill: 'strokes' }), 'strokes', 'its json\'s word');
  assert.equal(fillOf({ cells: [{ n: 1, legs: [[10, 0, 20], [15, 20, 0], [20, 0, 20]] }] }), 'strokes', 'wide but short legs');
  assert.equal(fillOf({ cells: [{ n: 1, legs: [[10, 0, 90]] }, { n: 2, legs: [[30, 0, 90]] }] }), 'strokes', 'long but a leg a cell');
  const pic = { ...PIC, jars: [{ id: 'a', name: 'A', hex: '#112233', fill: 'zone', cells: [wide, { ...thin, under: true }] }] };
  const runs = brushRuns(passesOf(pic), 79, 15, false, 0);
  assert.equal(runs.filter(r => r.num === 2).length, 2); assert.ok(!runs.find(r => r.num === 2).dab, 'the stripe a stroke'); assert.ok(runs.filter(r => r.num === 2)[1].idle, '… and again, the same way');
});

test('Mickey (local): the owner\'s split, zones 1, 3, 4, 9, 15, strokes the rest', { skip: !fs.existsSync(new URL('../formg/mickey-1.json', import.meta.url)) }, () => {
  const pic = load('mickey-1'), z = pic.jars.filter(j => fillOf(j) === 'zone').map(j => j.id);
  assert.deepEqual(z, ['c2', 'c1', 'c7', 'c5', 'c3'], 'Colour 1, 3, 4, 9, 15 by their ids: their names their jars\' since 2026-11-17');
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
    const pic = load(id), G = rangeOf(pic), room = G.bottom[0] <= G.bottom[1];
    // no room: only a picture in PRESS_OK, the canvas as high as the top wall lets it, the bottom pressed so many mm at most (the Targa, 2026-11-16)
    const place = { left: (G.left[0] + G.left[1]) / 2, bottom: room ? (G.bottom[0] + G.bottom[1]) / 2 : Math.floor(G.bottom[1]) };
    assert.ok(G.left[0] <= G.left[1] && (room || PRESS_OK[id] >= G.bottom[0] - place.bottom), `${id}: no place for the canvas`);
    const { P, r } = runOf(pic, place);
    assert.equal(r.fault, '', id);
    if (room) assert.equal(r.pastWall, 0, `${id}: nothing pressed into a wall`);
    assert.equal(r.gone, 0, `${id}: no leg gone`);
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
  for (const q of passesOf(pic, { idle: 'legs' })) assert.ok(q.mm >= 1000, `${q.pencil}: ${Math.round(q.mm)} mm, the jar canon's reckoning too (genfplan.js's lineOf)`);
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
test('FORM-G\'s run, drops first (2026-11-17): a zone cell its drops, each on a dip at a leg\'s start or along it, then one snake over its legs and back on no dip; a stroke cell a dip a leg, none across, 79 mm at most, then its run back; in the cells\' order', () => {
  for (const id of FORMG_LIB) {
    const P = passesOf(load(id)), a = brushRuns(P, 79, 15, false, 0);
    const near = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 1e-6, len = pts => pts.slice(1).reduce((t, q, i) => t + Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]), 0);
    let k = 0;
    P.forEach((q, pi) => q.byCell.forEach(c => {
      const mine = []; while (k < a.length && a[k].pass === pi && a[k].num === c.num) mine.push(a[k++]);
      assert.ok(mine.length, `${id}: line ${pi + 1}, cell ${c.num} runs`);
      if (q.fill === 'zone' && !c.under && !c.runs) {
        const drops = mine.filter(r => r.dab), snake = mine.at(-1);
        assert.equal(mine.length, drops.length + 1, `${id}: drops, then the snake`);
        assert.ok(drops.every(r => r.dip && r.pts.length === 2 && len(r.pts) <= DROPS.mark + 1e-6), `${id}: a drop a dip, a mark`);
        assert.equal(drops.length, c.legs.reduce((t, l) => t + Math.max(1, Math.ceil(len(l) / DROPS.every - 1e-9)), 0), `${id}: a drop every 35 mm of a leg`);
        assert.ok(snake.snake && !snake.dip && !snake.idle, `${id}: the snake on no dip`); assert.deepEqual(snake.pts, [...squareSnake(c.legs), ...c.line]);
      } else {
        const again = mine.filter(r => r.idle);
        assert.equal(again.length, c.runs ? 1 : c.legs.length, `${id}: every stroke leg again`);
        assert.ok(again.every(r => !r.dip && r.pts.length === 2 && Math.abs(r.pts[1][0] - r.pts[0][0]) < 1e-6), `${id}: … no dip, along its leg`);
        mine.splice(0, mine.length, ...mine.filter(r => !r.idle));
        assert.ok(mine.every(r => r.dip && !r.dab && r.pts.every(p => Math.abs(p[0] - r.pts[0][0]) < 1e-6)), `${id}: a stroke, a dip a leg`);
        assert.ok(c.runs || mine.every(r => len(r.pts) <= 79 + 1e-6), `${id}: a stroke's run 79 mm at most`);
        if (!c.runs) { let m = 0; for (const l of c.legs) { assert.ok(near(mine[m].pts[0], l[0]), `${id}: at its leg's start`); while (!near(mine[m].pts.at(-1), l[1])) m++; m++; } assert.equal(m, mine.length); }
      }
    }));
    assert.equal(k, a.length, `${id}: every run a cell's`);
    const rows = rowsOf(load(id), P, 79, 15, false, { slack: 0 });
    assert.equal(rows.ps.filter(p => !p[0].nodip).length, a.filter(r => r.dip).length, `${id}: a row's dip as its run's`);
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
  for (const r of runs.filter(r => !r.idle && !r.snake)) assert.ok(len(r.pts) <= R3.every + 1e-6, `a run of ${len(r.pts).toFixed(1)} mm on one dip`);
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

// the classic's v.3 (the owner, 2026-11-11: "13 hours and 62 jar changes are physically hard for me. Let us cut their number in two … if it does not work, we can always go back to v.2")
const lineOfPic = p => p.jars.reduce((t, j) => t + j.cells.reduce((u, c) => u + c.legs.reduce((v, l) => v + Math.abs(l[2] - l[1]), 0), 0), 0);
test('the classic\'s v.3: v.2\'s jars halved, every one a v.2 jar under its own number and paint, none new; 31 lines of the list, not 62; the same outline', () => {
  const v2 = load('porsche-red-k'), v3 = load('porsche-red-v3'), by = new Map(v2.jars.map(j => [j.name, j]));
  assert.equal(seqOf(v2).length, 62);
  assert.equal(v3.jars.length, 24); assert.equal(seqOf(v3).length, 31); assert.equal(v3.jars.filter(j => j.coats === 2).length, 7);
  for (const j of v3.jars) { const q = by.get(j.name); assert.ok(q, `${j.name}: not a v.2 jar`); assert.equal(j.hex, q.hex, `${j.name}: v.2's paint`); assert.equal(j.coats, q.coats, j.name); }
  assert.deepEqual(v3.box, v2.box, 'the same outline: the same place on the canvas, DRAW BW\'s outline, PRESS_OK');
  assert.equal(v3.w, 700); assert.equal(v3.h, 1000);
  assert.ok(Math.abs(lineOfPic(v3) - lineOfPic(v2)) / lineOfPic(v2) < 0.05, `the same picture painted: ${lineOfPic(v3)} mm of legs, v.2 ${lineOfPic(v2)}`);
  assert.ok(lineOfPic(v3) / v3.jars.length > 1.6 * lineOfPic(v2) / v2.jars.length, 'a jar\'s line longer ("from 1 metre to 3–4")');
});

// MARKS (the owner, 2026-11-11, FORM-G/IMG_2683: "every colour, when we change the jar, the machine dips once, then makes a mark on four sides … in the middle of the edges")
const placed = (pic, c) => { const W = reach(); return { x0: Math.max(0, -c.edgeLeft), x1: Math.min(pic.w, W.y.max - W.y.min - c.edgeLeft), y0: Math.max(0, -c.edgeBottom), y1: Math.min(pic.h, W.x.max - W.x.min - c.edgeBottom) }; };
test('MARKS on the classic at the owner\'s place, left −60, bottom −68: the left and the right strip about the middle of the sides, where the brush reaches, clear of the car; none at the top and the bottom, and why', () => {
  const pic = load('porsche-red-v3'), on = placed(pic, { edgeLeft: -60, edgeBottom: -68 }), n = 24, st = stripsOf(pic, on, n);
  assert.deepEqual(on, { x0: 60, x1: 628.5, y0: 68, y1: 933 });
  assert.deepEqual(st.strips.map(s => [s.no, s.side]), [[1, 'left'], [3, 'right']]);
  assert.deepEqual(st.missing.map(q => [q.no, q.side]), [[2, 'top'], [4, 'bottom']], 'the car takes 843 of the 865 mm along X (the owner: "only left and right")');
  for (const q of st.missing) assert.match(q.why, /mm between the picture and where the brush may mark, \d+ needed/);
  for (const s of st.strips) {
    const [x0, y0, x1, y1] = s.box;
    assert.ok(x0 >= on.x0 + MARKS.wall - 1e-9 && x1 <= on.x1 - MARKS.wall + 1e-9, `${s.side}: within the reach across, ${x0} … ${x1}`);
    assert.ok(x1 + MARKS.clear <= pic.box[0] - MARKS.trail / 2 || x0 - MARKS.clear >= pic.box[2] + MARKS.trail / 2, `${s.side}: clear of the car`);
    assert.ok(Math.abs((y0 + y1) / 2 - pic.h / 2) < 1e-6, `${s.side}: about the side's middle`);
    assert.ok(s.cell(0, 0)[1] > s.cell(1, 0)[1], 'the first at the top');
    assert.ok(Math.abs(s.cell(0, 0)[0] - (s.side === 'left' ? 0 : pic.w)) < Math.abs(s.cell(0, 1)[0] - (s.side === 'left' ? 0 : pic.w)), 'the first coats at the edge\'s side');
  }
  assert.ok(st.strips[0].box[0] < 75 && st.strips[1].box[2] > 615, 'as near the edges as the reach lets them');
});
test('MARKS on a canvas with room all round: four strips, the owner\'s order — 1 the left, 2 the top, 3 the right, 4 the bottom; the first at the left of a top or a bottom one', () => {
  const pic = { w: 600, h: 600, box: [150, 150, 450, 450] }, st = stripsOf(pic, { x0: 0, x1: 568, y0: 0, y1: 600 }, 10);
  assert.deepEqual(st.strips.map(s => s.no), [1, 2, 3, 4]); assert.deepEqual(st.missing, []);
  const top = st.strips[1], bottom = st.strips[3];
  assert.ok(top.cell(0, 0)[0] < top.cell(1, 0)[0] && bottom.cell(0, 0)[0] < bottom.cell(1, 0)[0], 'left to right');
  assert.ok(top.cell(0, 0)[1] > top.cell(0, 1)[1] && bottom.cell(0, 0)[1] < bottom.cell(0, 1)[1], 'the first coats at the edge\'s side');
  assert.ok(Math.abs((top.box[0] + top.box[2]) / 2 - 300) < 1e-6, 'about the edge\'s middle');
  assert.ok(st.strips[2].box[2] <= 568 - MARKS.wall + 1e-9, 'the right one within the reach, not at the canvas\'s edge past it');
  assert.ok(st.strips.every(s => s.shift === 0), 'all about the edges\' middles');
  const off = stripsOf(pic, { x0: 0, x1: 500, y0: 0, y1: 600 }, 40), t = off.strips.find(s => s.side === 'top');
  assert.ok(t.shift < -40 && Math.abs(t.box[2] - (500 - MARKS.wall)) < 1e-6, `the reach off the canvas's middle: as near it as the reach lets the strip, ${t.shift} mm off`);
  const narrow = stripsOf(pic, { x0: 0, x1: 568, y0: 0, y1: 600 }, 60);
  assert.deepEqual(narrow.strips, [], '60 cells: no strip takes them on a 60 × 60');
  assert.deepEqual(narrow.missing.map(q => /longer than the reach along X/.test(q.why) ? 'along' : /wider than the reach across X/.test(q.why) ? 'across' : q.why), ['along', 'across', 'along', 'across']);
});
test('MARKS in the run: every line\'s marks before its first cell, one dip for them all, the cell on a dip of its own; a second coat in its jar\'s cell, the inner row; no cell for BACK ONE CELL; nothing more past the walls', () => {
  const pic = load('porsche-red-v3'), c = { edgeLeft: -60, edgeBottom: -68 }, seq = seqOf(pic), st = stripsOf(pic, placed(pic, c), 24), M = marksOf(seq, st);
  const cells = markCellsOf(seq);
  assert.equal(M.length, 31);
  assert.deepEqual(cells.filter(q => q.row === 0).map(q => q.k), [...Array(24).keys()], 'every jar its cell, in the list\'s order, Jar 6 the last');
  for (const [i, j] of seq.entries()) if (j.coat === 2) assert.deepEqual([cells[i].k, cells[i].row], [cells[seq.findIndex(q => q.id === j.jar)].k, 1], `${j.name}: its jar's cell, the inner row`);
  const P = passesOf(pic), runs = withMarks(brushRuns(P, R3.every, undefined, false, R3.slack), P, seq, M);
  for (let k = 0; k < P.length; k++) {
    const mine = runs.filter(r => r.pass === k), first = mine.findIndex(r => !r.mark);
    assert.deepEqual(mine.slice(0, first).map(r => [r.mark, r.dip]), [[1, true], [3, false]], `line ${k + 1}: its marks first, 1 then 3, one dip`);
    assert.ok(mine[first].dip, `line ${k + 1}: its first cell on a dip of its own`);
    assert.ok(mine.slice(first).every(r => !r.mark));
    for (const r of mine.slice(0, first)) { assert.equal(r.pts[0][0], r.pts[1][0], 'a mark along X'); assert.ok(Math.abs(r.pts[1][1] - r.pts[0][1] - MARKS.leg) < 1e-9); }
  }
  const W = reach(), here = { x: W.x.min + c.edgeBottom + pic.h / 2, y: W.y.min + c.edgeLeft + pic.w / 2 };
  const run = marks => { const R = rowsOf(pic, P, R3.every, undefined, false, { slack: R3.slack, j3: R3.j3, marks }); return { R, r: plotRun({ ...OPTS, rows: R.ps.length, here }, grouped(R)) }; };
  const a = run(undefined), b = run(M);
  assert.equal(b.R.ps.length, a.R.ps.length + 31 * 2);
  assert.equal(b.r.fault, ''); assert.equal(b.r.gone, 0);
  assert.ok(Math.abs(b.r.pastWall - a.r.pastWall) < 1e-6, `nothing more pressed into a wall: ${a.r.pastWall} → ${b.r.pastWall}`);
  assert.equal(b.r.blocks.filter(q => q.kind === 'pause').length, P.length - 1, 'a pause between lines, as before');
  const marks = b.R.info.filter(q => q.mark);
  assert.equal(marks.length, 62); assert.ok(marks.every(q => q.cells.length === 0 && /· mark [13], (left|right)/.test(q.label)));
  assert.ok(b.r.seconds - a.r.seconds < 30 * 60, `the marks' time: ${Math.round((b.r.seconds - a.r.seconds) / 60)} min`);
});

test('the idle run on the legs (2026-11-16, the evening: "6 drops, so 6 runs"), now the jar canon\'s reckoning alone: n legs, n tracks, each on its own leg, its way; the n + 1 of the afternoon read no more; the pass apart otherwise (LAB\'s, OPM-G\'s); FORM-G\'s none on the morning of 2026-11-17, back since its noon', () => {
  const leg = (x, i) => (i % 2 ? [[x, 90], [x, 10]] : [[x, 10], [x, 90]]);
  for (const n of [1, 2, 3, 6, 7]) {
    const legs = Array.from({ length: n }, (_, i) => leg(10 + 5 * i, i));
    assert.deepEqual(idleLegsOf(legs, passOf(5), true), legs, `${n} legs`);
  }
  assert.equal(idleLegsOf(Array.from({ length: 6 }, (_, i) => leg(10 + 5 * i, i)), passOf(5)).length, 8, 'no flag: the pass apart, as before');
  const pic = { ...PIC, jars: [{ id: 'a', name: 'A', hex: '#112233', cells: [{ n: 1, legs: [[10, 20, 100], [15, 100, 20], [20, 20, 100], [25, 100, 20], [30, 20, 100], [35, 100, 20]] }] }] };
  const B = passesOf(pic)[0].byCell[0];
  assert.equal(B.line.length / 2, 6, 'FORM-G since 2026-11-17, noon: the run back, six legs, six tracks');
  assert.deepEqual(B.line.filter((q, i) => i % 2 === 0).map(q => q[0]), B.legs.map(l => l[0][0]).reverse(), '… the last first');
  const c = passesOf(pic, { idle: 'legs' })[0].byCell[0];
  assert.equal(c.line.length / 2, 6, 'on the legs: six legs, six tracks');
  assert.deepEqual(c.line.filter((q, i) => i % 2 === 0).map(q => q[0]), c.legs.map(l => l[0][0]), '… each on its leg');
  assert.deepEqual(passesOf({ ...pic, idle: 'n+1' }, { idle: 'legs' })[0].byCell[0].line, c.line, 'a picture\'s idle: \'n+1\' read no more');
  assert.equal(passesOf(pic, { canon: true })[0].byCell[0].line.length / 2, 8, 'OPM-G: the canon\'s, the pass apart');
});

test('a layer under (GEN-F\'s motion blur): its jars first, layer 0, one coat; the picture after them as before', () => {
  const jar = (id, hex, o = {}) => ({ id, name: id, hex, coats: 1, cells: [{ n: 1, legs: [[10, 20, 100]] }], ...o });
  const pic = { ...PIC, jars: [jar('a', '#EEEEEE'), jar('b', '#222222', { coats: 2 }), jar('ua', '#EEEEEE', { under: true, name: 'a' }), jar('ub', '#222222', { under: true, name: 'b' })] };
  const S = seqOf(pic);
  assert.deepEqual(S.map(j => [j.id, j.layer]), [['ua', 0], ['ub', 0], ['a', 1], ['b', 1], ['b:2', 2]]);
  assert.equal(S[0].name, 'a · under');
  assert.deepEqual(seqOf({ ...pic, jars: pic.jars.filter(j => !j.under) }).map(j => j.id), ['a', 'b', 'b:2'], 'none under: as before');
});

test('POINTS · Jar 0 (2026-11-16): the picture\'s outermost points, the corners of a band round it, a few, clockwise from the top; the layer under left out', () => {
  // a plus of legs: its four arms' tips the band's corners, nothing inside
  const legs = [[50, 0, 100], [45, 40, 60], [40, 40, 60], [55, 40, 60], [60, 40, 60], [30, 45, 55], [70, 45, 55]];
  const pic = { ...PIC, jars: [{ id: 'a', name: 'A', hex: '#111111', cells: [{ n: 1, legs }] }, { id: 'u', name: 'A', hex: '#111111', under: true, cells: [{ n: 1, legs: [[50, -40, 140]] }] }] };
  const P = pointsOf(pic);
  assert.ok(P.length >= 4 && P.length <= 8, `${P.length} points`);
  const ys = P.map(p => p[1]), xs = P.map(p => p[0]);
  assert.equal(Math.max(...ys), 100); assert.equal(Math.min(...ys), 0, 'the layer under not counted: its legs reach −40 … 140');
  assert.equal(Math.min(...xs), 30); assert.equal(Math.max(...xs), 70);
  assert.deepEqual(P[0], [50, 100], 'the top first');
  for (const p of P) assert.ok(legs.some(([x, a, b]) => x === p[0] && (a === p[1] || b === p[1])), 'every point a leg\'s end');
  assert.ok(pointsOf(pic, 1000).length === 3, 'a band of three at the coarsest');
});

test('the motion blur on the machine (2026-11-16): its stripes cells of their own jars, one coat — a second coat its picture\'s cells alone', () => {
  const pic = { ...PIC, jars: [{ id: 'b', name: 'B', hex: '#222222', coats: 2, cells: [{ n: 1, legs: [[10, 20, 100]] }, { n: 2, legs: [[15, 120, 180]], under: true }] }] };
  const S = seqOf(pic);
  assert.deepEqual(S.map(j => [j.id, j.layer, j.cells.length]), [['b', 1, 2], ['b:2', 2, 1]], 'one jar, its stripe in its first turn alone');
  assert.ok(!S[1].cells.some(c => c.under));
  const only = { ...PIC, jars: [{ id: 'c', name: 'C', hex: '#222222', coats: 2, cells: [{ n: 1, legs: [[15, 120, 180]], under: true }] }] };
  assert.deepEqual(seqOf(only).map(j => j.id), ['c'], 'a jar of stripes alone: no second coat');
});

test('THE JARS, the owner\'s 🔄 (2026-11-17): his jars by number, the classic\'s first, the ones mixed since after; a colour swapped takes its jar\'s name and hex, its place and cells its own', () => {
  const plans = CLASSIC.filter(id => fs.existsSync(new URL(`../formg/${id}.json`, import.meta.url))).map(load);
  const mine = myJarsOf(plans, { 'Jar 49': '#fef6e7', 'Jar 3': '#000000', 'Colour 7': '#111111' });
  assert.deepEqual(mine.find(j => j.name === 'Jar 28'), { name: 'Jar 28', hex: '#4B4D4E', mine: false }, 'Jar 28, the graphite grey, as COLORS has it');
  assert.equal(mine.find(j => j.name === 'Jar 3').hex, '#C6C6C1', 'a number of the classic\'s is its paint: never another hex for it');
  assert.deepEqual(mine.find(j => j.name === 'Jar 49'), { name: 'Jar 49', hex: '#FEF6E7', mine: true });
  assert.ok(!mine.some(j => j.name === 'Colour 7'), 'a jar is a number or Black');
  assert.equal(mine.at(-1).name, 'Black'); assert.ok(mine.every((j, i) => !i || j.name === 'Black' || +j.name.slice(4) > +mine[i - 1].name.slice(4)), 'by number');
  for (const id of FORMG_LIB) { const p = load(id), n = p.jars.map(j => j.name).filter(n => JAR_NAME.test(n)); assert.equal(new Set(n).size, n.length, `${id}: no jar twice`); assert.equal(withJars(p), p, `${id}: no swaps, the picture itself`); }
  const z = { n: 1, legs: [[10, 20, 100], [15, 100, 20], [20, 20, 100]] }, st = { n: 1, legs: [[40, 20, 30]] };
  const pic = { ...PIC, id: 't', jars: [{ id: 'a', name: 'Colour 1', hex: '#FEF6E7', cells: [z] }, { id: 'b', name: 'Colour 2', hex: '#D7D4C9', coats: 2, cells: [st] }, { id: 'c', name: 'Colour 3', hex: '#DFC682', cells: [st, { ...st, n: 2, legs: [[45, 20, 30]] }] }] };
  const one = withJars(pic, { a: { name: 'Jar 49', hex: '#FEF6E7' } });
  assert.deepEqual(one.jars.map(j => j.name), ['Jar 49', 'Colour 2', 'Colour 3']); assert.deepEqual(one.jars[0].was, { name: 'Colour 1', hex: '#FEF6E7' }); assert.ok(one.jarsKey);
  assert.equal(pic.jars[0].name, 'Colour 1', 'the picture itself untouched');
  // the canon (2026-11-18, the Targa: C11 → Jar 7 had merged into line 5, C6's, painted already): never merged, each colour its own line at its own place
  const m = withJars(pic, { b: { name: 'Jar 3', hex: '#C6C6C1' }, c: { name: 'Jar 3', hex: '#C6C6C1' } });
  assert.deepEqual(m.jars.map(j => j.name), ['Colour 1', 'Jar 3', 'Jar 3'], 'two colours, one jar: two lines, each at its own place');
  assert.deepEqual(m.jars.map(j => j.cells.length), [1, 1, 2]); assert.deepEqual(m.jars.map(j => j.was?.name), [undefined, 'Colour 2', 'Colour 3']);
  const S2 = seqOf(m);
  assert.deepEqual(S2.map(j => j.name), ['Colour 1', 'Jar 3', 'Jar 3', 'Jar 3 · layer 2']);
  assert.equal(S2[3].jar, 'b', 'the second coat Colour 2\'s alone, Colour 3 had one coat');
  const zm = withJars(pic, { a: { name: 'Jar 3', hex: '#C6C6C1' }, c: { name: 'Jar 3', hex: '#C6C6C1' } }), P = passesOf(zm);
  assert.deepEqual(P.map(q => q.fill), ['zone', 'strokes', 'strokes', 'strokes'], 'each colour its own fill, as before the swap (Colour 2\'s second coat last)');
  const plain = passesOf(pic), key = q => JSON.stringify(q.byCell.map(c => c.legs));
  assert.deepEqual(P.map(key), plain.map(key), 'every line\'s cells and legs as without the swap: only the name and hex change');
});

// a zone's touching cells one area (the owner, 2026-11-17, the evening, the Targa's Colour 6 on canvas: "the picture breaks because of the several runs"),
// a strokes jar's big ones too (his "yes"): every leg kept, an area's drops first, then its chains, JOIN.drops at most an area
test('areas: a zone\'s touching cells one area, its drops first, then its snakes; a strokes jar\'s big ones too; every leg kept', async () => {
  const { JOIN, joinedCells, fillOf } = await import('../src/formgplan.js');
  const key = l => `${l[0][0]}|${Math.min(l[0][1], l[1][1]).toFixed(2)}|${Math.max(l[0][1], l[1][1]).toFixed(2)}`;
  for (const id of FORMG_LIB) {
    const pic = load(id), A = passesOf(pic), B = passesOf(pic, { join: 'all' }), runs = brushRuns(B, 79, 15, false, 0);
    A.forEach((P, k) => assert.equal(B[k].byCell.flatMap(c => c.legs.map(key)).sort().join(), P.byCell.flatMap(c => c.legs.map(key)).sort().join(), `${id} ${P.pencil}: every leg kept`));
    B.forEach((P, k) => {
      const areas = new Map();
      for (const c of P.byCell) if (c.area) { if (!areas.has(c.area)) areas.set(c.area, []); areas.get(c.area).push(c); }
      for (const [a, cs] of areas) {
        const nums = new Set(cs.map(c => c.num)), mine = runs.filter(r => r.pass === k && nums.has(r.num)), drops = mine.filter(r => r.dab), snakes = mine.filter(r => r.snake);
        if (!drops.length) continue;                                                     // a second coat of strokes
        assert.ok(drops.length <= JOIN.drops, `${id} ${P.pencil} area ${a}: ${drops.length} drops`);
        assert.ok(mine.findIndex(r => r.snake) > mine.findLastIndex(r => r.dab), `${id} ${P.pencil} area ${a}: its drops first, all of them`);
        assert.equal(snakes.length, cs.length, 'a snake a chain');
        for (const c of cs) c.legs.slice(1).forEach((l, i) => { assert.ok(Math.abs(Math.abs(l[0][0] - c.legs[i][0][0]) - pic.pitch) < 0.2, `${id} ${P.pencil}: a chain a column at a time`); assert.ok((l[1][1] - l[0][1]) * (c.legs[i][1][1] - c.legs[i][0][1]) < 0, 'its legs down and up in turn'); });
      }
    });
  }
  const pic = load('porsche-targa'), c6 = pic.jars.find(j => j.id === 'c12'), J = joinedCells(c6, fillOf(c6), pic.pitch, JOIN, true);
  assert.ok(J.some(c => c.legs.length === 13 && c.legs[0][0] === 227.5), 'his upper circle, 9.11.51 PM: one snake of 13 legs');
  assert.ok(J.some(c => c.legs.length === 11 && c.legs[0][0] === 257.5), 'his lower circle: one snake of 11 legs');
  const thin = { id: 'x', cells: [{ n: 1, legs: [[10, 0, 20]] }, { n: 2, legs: [[15, 25, 5]] }] };
  assert.deepEqual(joinedCells(thin, 'strokes', 5, JOIN, true).map(c => c.legs.length), [1, 1], 'a strokes jar\'s two short legs stay strokes');
  assert.equal(passesOf(pic, { join: null })[4].byCell.length, 38, 'no join: the cells as they were (FROM THE BREAK of a run before)');
});

// a long stroke (the owner, 2026-11-17, the evening, IMG_3173, IMG_3175: a 75 … 90 mm stroke bald after 5 … 6 cm; "every 45, then"): its drops every 45 mm at most,
// then the leg once its own way, no dip, then again the same way; the shorter strokes as before; none without strokeDrops (FROM THE BREAK of a run before)
test('a long stroke: its drops every 45 mm, then the drag, then again the same way; the short ones as before', async () => {
  const { STROKE_DROPS, strokeOf } = await import('../src/formgplan.js');
  const pic = load('porsche-targa'), A = passesOf(pic, { join: 'all' }), B = passesOf(pic, { join: 'all', strokeDrops: STROKE_DROPS });
  const ra = brushRuns(A, 79, 15, false, 0), rb = brushRuns(B, 79, 15, false, 0), len = l => Math.abs(l[1][1] - l[0][1]);
  assert.equal(JSON.stringify(brushRuns(passesOf(pic, { join: 'all', strokeDrops: null }), 79, 15, false, 0)), JSON.stringify(ra), 'no strokeDrops: as before');
  const P = B[1], c = P.byCell.find(q => q.legs.some(l => len(l) > 150)), l = c.legs.find(q => len(q) > 150), mine = rb.filter(r => r.pass === 1 && r.num === c.num);
  assert.ok(strokeOf(c, P.fill));
  const drops = mine.filter(r => r.dab), drag = mine.find(r => !r.dip && !r.idle), again = mine.find(r => r.idle);
  assert.equal(drops.length, Math.ceil(len(l) / STROKE_DROPS), 'a drop every 45 mm at most');
  drops.slice(1).forEach((d, i) => assert.ok(Math.abs(d.pts[0][1] - drops[i].pts[0][1]) <= STROKE_DROPS + 1e-6, 'its drops 45 mm apart at most'));
  assert.deepEqual(drag.pts, l, 'then the leg once, its own way, no dip');
  assert.ok(mine.indexOf(drag) > mine.findLastIndex(r => r.dab) && mine.indexOf(again) > mine.indexOf(drag), 'drops, the drag, then again');
  assert.ok((again.pts[1][1] - again.pts[0][1]) * (l[1][1] - l[0][1]) > 0, 'again the same way');
  const short = P.byCell.find(q => q.legs.length === 1 && len(q.legs[0]) <= STROKE_DROPS), sa = ra.filter(r => r.pass === 1 && r.num === short.num), sb = rb.filter(r => r.pass === 1 && r.num === short.num);
  assert.equal(JSON.stringify(sb), JSON.stringify(sa), 'a short stroke as before');
});
