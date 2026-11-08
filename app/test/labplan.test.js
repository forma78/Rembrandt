import test from 'node:test';
import assert from 'node:assert/strict';
import { LAB, labPlan, labSize, endSecs, rowsOfCell, sliceLine, snakeRuns, dipsOnLong, startOnLong } from '../src/labplan.js';
import { dragRowsOf } from '../src/opmplan.js';
import { reach } from '../src/machine.js';
import { idleCellOf, idleRunsOf } from '../src/idleplan.js';
import { cellOf } from '../src/formgplan.js';
import { REAL_PIECES, REAL_LONG } from '../src/labreal.js';

const cup = { hand: true, on: true, up: [30, 35], to: [30, 35], dip: 14, paint: [14, 15], dwell: 1, swing: 40 };
const P = labPlan({ x0: 200, y0: 150, cup });
const of = n => P.blocks.filter(b => b.row === n);
const paint = n => of(n).find(b => b.paintMM > 0);

test('every stroke numbered, a dip before it, the arm straight at the sheet\'s start', () => {
  assert.equal(P.strokes.length, 21);
  assert.deepEqual(P.strokes.map(q => q.n), Array.from({ length: 21 }, (_, i) => i + 1));
  assert.equal(P.blocks[1].deg, 0); assert.equal(P.blocks[2].cmd, 'J 3 0');
  for (const q of P.strokes) assert.ok(of(q.n).some(b => b.kind === 'joint' && b.deg > 0 && b.dip), `${q.n}: over the jar`);
  assert.equal(P.remote.rows.length, 21);
});

test('at the end of every stroke the wrist straight and the elbow up: no shoulder turn with the wrist off', () => {
  for (const q of P.strokes) {
    const b = of(q.n), iDip = b.findIndex(x => x.kind === 'joint'), arms = b.filter(x => x.cmd?.startsWith('J 3'));
    assert.ok(arms.length === 0 || arms.at(-1).cmd === 'J 3 0' || q.kind === 'wrist' && arms.at(-1).cmd === 'J 3 0', `${q.n}: the wrist back`);
    assert.ok(!b.slice(0, iDip).some(x => x.cmd?.startsWith('J 3')), `${q.n}: the wrist not turned before the dip`);
    assert.equal(b.filter(x => x.cmd?.startsWith('J 2')).at(-1).cmd, `J 2 ${LAB.up}`, `${q.n}: the elbow up last`);
  }
});

test('one W on a piece: the board keeps only one', () => {
  for (const b of P.blocks.filter(x => x.cmds)) {
    b.cmds.forEach((c, i) => { if (c[0] === 'W') assert.equal(b.cmds[i + 1][0], 'L', `${b.row}: a piece after every W`); });
  }
});

test('as tonight: the elbow down fast on the first tail, up over the last, on the line', () => {
  const b = paint(3);
  assert.equal(b.cmds[0], `F ${LAB.speed}`);
  assert.match(b.cmds[1], /^W 2 0 211$/);
  assert.match(b.cmds.at(-3), new RegExp(`^W 2 ${LAB.lift} \\d+$`));
  const q = P.strokes[2], y = (c) => +c.split(' ')[2];
  assert.equal(y(b.cmds.at(-2)), q.to.y);
  assert.equal(q.to.y - q.from.y, LAB.length, 'across: along Y');
  assert.equal(q.from.x, q.to.x);
});

test('the carriage against the elbow: starts off the line by mm/° × the elbow\'s way, on it when pressed', () => {
  const q = P.strokes.find(s => s.kind === 'comp' && s.say.includes('1 mm/°, +X')), line = P.strokes.find(s => s.kind === 'comp' && s.say.includes('0.5 mm/°, +X'));
  const b = paint(q.n), on = +b.cmds[2].split(' ')[1];
  assert.equal(q.from.x, on - LAB.hover, 'the flight ends off the line');
  assert.equal(q.to.x, on - LAB.lift, 'the lift ends off it the other way round');
  assert.equal(+b.cmds[3].split(' ')[1], on, 'the line itself straight');
  assert.ok(line);
  const m = P.strokes.find(s => s.kind === 'comp' && s.say.includes('1 mm/°, −X'));
  assert.equal(m.from.x, +paint(m.n).cmds[2].split(' ')[1] + LAB.hover, '−X: the other side');
});

test('the wrist\'s strokes: tilted one way before the landing, the other way at the lift, the elbow still', () => {
  const q = P.strokes.find(s => s.kind === 'wrist'), b = of(q.n), p = paint(q.n);
  assert.ok(b.some(x => x.cmd === 'J 3 -10'), 'tilted back in the air');
  assert.ok(b.some(x => x.cmd === `J 2 ${LAB.light}`));
  assert.ok(!p.cmds.some(c => c.startsWith('W 2')), 'no elbow on the stroke');
  assert.match(p.cmds[1], /^W 3 0 \d+$/);
  assert.match(p.cmds.at(-3), /^W 3 10 \d+$/);
});

test('the shallow dip less deep, every other at the jar\'s own', () => {
  const q = P.strokes.find(s => s.kind === 'shallow');
  assert.ok(of(q.n).some(b => b.cmd === 'J 2 16'));
  assert.ok(of(3).some(b => b.cmd === 'J 2 14'));
});

test('the time over a tail from speed to rest', () => {
  assert.ok(endSecs(3) > 3 / LAB.speed, 'braking takes longer than at speed');
  assert.ok(Math.abs(endSecs(1.25) - 0.1) < 1e-9);
});

test('angles and pieces within what the server takes', () => {
  for (const b of P.blocks) {
    if (b.cmd?.startsWith('J 3')) assert.ok(Math.abs(+b.cmd.split(' ')[2]) <= 20);
    for (const c of b.cmds || []) if (c[0] === 'W') { const v = c.split(' '); assert.ok(+v[3] >= 1 && +v[3] <= 211, c); }
  }
  assert.ok(P.bounds.x1 - P.bounds.x0 < 240 && P.bounds.y1 - P.bounds.y0 < 260);
});

// ---------- LAB 2.0 ----------
const P2 = labPlan({ x0: 100, y0: 200, cup, sheet: 2 });
const said = t => P2.strokes.find(q => q.say.includes(t));
const rowsOf = n => P2.remote.rows.flatMap((r, i) => r.cells[0][0] === n ? [i + 1] : []);
const paint2 = n => P2.blocks.filter(b => rowsOf(n).includes(b.row) && b.paintMM > 0);

test('2.0: every number on the list, every row in the iPhone\'s, W always on a piece', () => {
  assert.equal(P2.strokes.length, 24);
  assert.equal(new Set(P2.remote.rows.map(r => r.cells[0][0])).size, 24);
  for (const b of P2.blocks) { if (b.row) assert.ok(b.row <= P2.remote.rows.length, 'a row the iPhone knows'); (b.cmds || []).forEach((c, i) => { if (c[0] === 'W') assert.equal(b.cmds[i + 1][0], 'L'); }); }
  assert.ok(!P2.blocks.some(b => b.cmd?.startsWith('J 3') && b.cmd !== 'J 3 0') && !P2.blocks.some(b => (b.cmds || []).some(c => c.startsWith('W 3'))), 'no wrist on this sheet');
});

test('2.0: the carriage always the same way along X, whichever way the stroke goes', () => {
  for (const t of ['Across →, the carriage 1 mm/°', 'Across ←, the carriage 1 mm/°', 'Diagonal ↗', 'Diagonal ↙']) {
    const q = said(t), b = paint2(q.n)[0], fly = P2.blocks.find(x => x.row === rowsOf(q.n)[0] && x.kind === 'move');
    const startX = +fly.cmds[1].split(' ')[1], lastL = b.cmds.filter(c => c[0] === 'L').at(-1).split(' ');
    assert.ok(Math.abs(startX - (q.tip[0].x - LAB.hover)) < 0.02, `${t}: the flight ends 12 mm below the line's start`);
    assert.ok(Math.abs(+lastL[1] - (q.tip.at(-1).x - LAB.lift)) < 0.02, `${t}: the lift ends 10 mm below its end`);
  }
});

test('2.0: pressed lighter, less way for the elbow, less for the carriage', () => {
  const q = said('pressed +2°'), fly = P2.blocks.find(x => x.row === rowsOf(q.n)[0] && x.kind === 'move');
  assert.ok(Math.abs(+fly.cmds[1].split(' ')[1] - (q.tip[0].x - (LAB.hover - 2))) < 0.02);
  assert.match(paint2(q.n)[0].cmds[1], /^W 2 2 \d+$/);
});

test('2.0: a cell as OPM-N\'s, a dip every 75 mm of track, the next from 5 mm back, nothing left out', () => {
  const q = said('A cell across, a snake, as tonight'), runs = rowsOfCell(q.tip);
  assert.ok(runs.length >= 3);
  const lens = runs.map(r => r.slice(1).reduce((t, p, i) => t + Math.hypot(p.x - r[i].x, p.y - r[i].y), 0));
  const all = q.tip.slice(1).reduce((t, p, i) => t + Math.hypot(p.x - q.tip[i].x, p.y - q.tip[i].y), 0);
  assert.ok(Math.abs(lens.reduce((a, b) => a + b, 0) - (runs.length - 1) * 5 - all) < 0.1, 'the track whole, the laps on top');
  assert.ok(Math.abs(runs[1][0].x - sliceLine(q.tip, 70, 71)[0].x) < 1e-6 && Math.abs(runs[1][0].y - sliceLine(q.tip, 70, 71)[0].y) < 1e-6, 'from a lap back');
  for (const t of rowsOf(q.n)) assert.ok(P2.blocks.some(b => b.row === t && b.kind === 'joint' && b.deg > 0), `row ${t}: its dip`);
  assert.equal(paint2(q.n)[0].cmds[1], 'W 2 0 211', 'as tonight: no carriage');
});

test('2.0: one way: every track the same way, a dip every other, with the fur', () => {
  const q = said('every track ↓'), rs = rowsOf(q.n);
  assert.equal(rs.length, 8);
  assert.equal(rs.filter(r => P2.blocks.some(b => b.row === r && b.kind === 'joint' && b.deg > 0)).length, 4);
  for (const b of paint2(q.n)) { const ls = b.cmds.filter(c => c[0] === 'L').map(c => +c.split(' ')[1]); assert.ok(ls[0] > ls[1], 'towards −X'); }
});

test('2.0: all of it on the sheet, the carriage below it only by the elbow\'s way', () => {
  assert.ok(P2.bounds.x0 >= 100 - 1e-6 && P2.bounds.y0 >= 200 - 1e-6, JSON.stringify(P2.bounds));
  assert.ok(P2.bounds.x1 <= 100 + 258 + 1 && P2.bounds.y1 <= 200 + 250 + 1, JSON.stringify(P2.bounds));
  assert.ok(P2.seconds > 240 && P2.seconds < 900, String(P2.seconds));
});

// ---------- LAB 3.0 ----------
const P3 = labPlan({ x0: 60, y0: 10, cup, sheet: 3 });
const rows3 = n => P3.remote.rows.flatMap((r, i) => r.cells[0][0] === n ? [i + 1] : []);
const said3 = t => P3.strokes.find(q => q.say.includes(t));

test('3.0: eight cells of four tracks, one way, no wrist, its own name', () => {
  assert.equal(P3.strokes.length, 8);
  assert.equal(P3.remote.rows.length, 32, '4 tracks at first');
  assert.equal(P3.remote.colours[0].name, 'LAB 3.0');
  assert.ok(!P3.blocks.some(b => b.cmd?.startsWith('J 3') && b.cmd !== 'J 3 0') && !P3.blocks.some(b => (b.cmds || []).some(c => c.startsWith('W 3'))));
  for (const b of P3.blocks) (b.cmds || []).forEach((c, i) => { if (c[0] === 'W') assert.equal(b.cmds[i + 1][0], 'L'); });
});

test('3.0: every track of a cell the same way, each its own landing and lift, shared over the cell\'s width', () => {
  for (const q of P3.strokes) {
    assert.equal(q.lines.length, 4);
    const d = l => [l[1].x - l[0].x, l[1].y - l[0].y];
    for (const l of q.lines) { const [a, b] = d(l), [a0, b0] = d(q.lines[0]); assert.ok(Math.abs(a - a0) < 1e-6 && Math.abs(b - b0) < 1e-6); assert.ok(Math.abs(Math.hypot(a, b) - 36) < 1e-6); }
    assert.ok(Math.abs(Math.hypot(q.lines[1][0].x - q.lines[0][0].x, q.lines[1][0].y - q.lines[0][0].y) - 17.5 / 3) < 1e-6);
    for (const r of rows3(q.n)) assert.equal(P3.blocks.filter(b => b.row === r && b.paintMM > 0).length, 1);
  }
});

test('3.0: the fur: along and the named diagonals go −X, the others +X, across neither', () => {
  const dx = q => q.lines[0][1].x - q.lines[0][0].x, dy = q => q.lines[0][1].y - q.lines[0][0].y;
  assert.equal(dx(said3('across →')), 0); assert.ok(dy(said3('across →')) > 0);
  assert.equal(dx(said3('across ←')), 0); assert.ok(dy(said3('across ←')) < 0);
  assert.ok(dx(said3('23 again')) < 0);
  for (const t of ['↘', '↙']) assert.ok(dx(said3(t)) < 0, t);
  for (const t of ['↗', '↖']) assert.ok(dx(said3(t)) > 0, t);
});

test('3.0: the carriage 1.25 mm/° against the elbow, whichever way the track goes', () => {
  for (const q of P3.strokes) {
    const r = rows3(q.n)[0], fly = P3.blocks.find(b => b.row === r && b.kind === 'move'), p = P3.blocks.find(b => b.row === r && b.paintMM > 0);
    assert.ok(Math.abs(+fly.cmds[1].split(' ')[1] - (q.lines[0][0].x - 1.25 * LAB.hover)) < 0.02, q.say);
    assert.ok(Math.abs(+fly.cmds[1].split(' ')[2] - q.lines[0][0].y) < 0.02, q.say);
    const end = p.cmds.filter(c => c[0] === 'L').at(-1).split(' ');
    assert.ok(Math.abs(+end[1] - (q.lines[0][1].x - 1.25 * LAB.lift)) < 0.02, q.say);
  }
});

test('3.0: a dip every other track, 72 mm; on the one cell every track, 36', () => {
  const dips = q => rows3(q.n).filter(r => P3.blocks.some(b => b.row === r && b.kind === 'joint' && b.deg > 0)).length;
  for (const q of P3.strokes) assert.equal(dips(q), q.say.includes('every track') ? 4 : 2, q.say);
});

test('3.0: all on the short sheet, the cells apart', () => {
  assert.ok(P3.bounds.x0 >= 60 && P3.bounds.y0 >= 10 - 1e-9, JSON.stringify(P3.bounds));
  assert.ok(P3.bounds.x1 <= 60 + 120 && P3.bounds.y1 <= 10 + 245, JSON.stringify(P3.bounds));
  const box = q => { const p = q.lines.flat(); return { a: Math.min(...p.map(v => v.x)), b: Math.max(...p.map(v => v.x)), c: Math.min(...p.map(v => v.y)), d: Math.max(...p.map(v => v.y)) }; };
  const B = P3.strokes.map(box), gap = 10;   // the trail ~7 mm wide and a margin
  B.forEach((u, i) => B.forEach((v, j) => { if (i < j) assert.ok(u.b + gap <= v.a || v.b + gap <= u.a || u.d + gap <= v.c || v.d + gap <= u.c, `cells ${i + 1} and ${j + 1}`); }));
});

test('every sheet ends at home, the brush up first, the row the last one; home is no part of its bounds', () => {
  const R = reach();
  for (const sheet of [1, 2, 3]) {
    const p = labPlan({ x0: 60, y0: 10, cup, sheet }), last = p.blocks.at(-1), before = p.blocks.at(-2);
    assert.equal(before.cmd, 'J 2 25', `sheet ${sheet}`);
    assert.equal(last.home, true);
    assert.deepEqual(last.cmds, [`T ${LAB.travel}`, `M ${(R.x.min + 0.1).toFixed(2)} ${(R.y.min + 0.1).toFixed(2)}`, 'G']);
    assert.equal(last.row, p.remote.rows.length);
    assert.ok(p.bounds.x0 >= 60 - 16 && p.bounds.y0 >= 10 - 1e-9, JSON.stringify(p.bounds));
    assert.ok(!p.blocks.slice(-2).some(b => b.paintMM > 0));
  }
});

test('3.0: tracks as asked, the cell\'s width kept; 8 as the sheet of 01:19, 1 a lone track', () => {
  const p8 = labPlan({ x0: 60, y0: 10, cup, sheet: 3, tracks: 8 }), p1 = labPlan({ x0: 60, y0: 10, cup, sheet: 3, tracks: 1 });
  assert.equal(p8.remote.rows.length, 64); assert.equal(p1.remote.rows.length, 8);
  const q = p8.strokes[0], w = Math.hypot(q.lines[7][0].x - q.lines[0][0].x, q.lines[7][0].y - q.lines[0][0].y);
  assert.ok(Math.abs(w - 17.5) < 1e-6);
  const f = P3.strokes[0]; assert.ok(Math.abs(Math.hypot(f.lines[3][0].x - f.lines[0][0].x, f.lines[3][0].y - f.lines[0][0].y) - 17.5) < 1e-6);
});

// ---------- LAB 3.0 · long ----------
const P4 = labPlan({ x0: 0, y0: 0, cup, sheet: 4 });
const rows4 = n => P4.remote.rows.flatMap((r, i) => r.cells[0][0] === n ? [i + 1] : []);
const lenOf = l => Math.hypot(l[1].x - l[0].x, l[1].y - l[0].y);

test('long: 40, 60, 80, 100 mm and a 100 with its seam, vertical ↓ and horizontal →, 4 tracks each', () => {
  assert.equal(P4.strokes.length, 10);
  assert.equal(P4.remote.colours[0].name, 'LAB 3.0 · long');
  const lens = q => q.lines.map(lenOf);
  [40, 60, 80, 100].forEach((len, i) => {
    const v = P4.strokes[i], h = P4.strokes[5 + i];
    assert.deepEqual(lens(v), [len, len, len, len]); assert.deepEqual(lens(h), [len, len, len, len]);
    for (const l of v.lines) assert.ok(l[1].x < l[0].x && l[0].y === l[1].y, 'vertical: down X');
    for (const l of h.lines) assert.ok(l[1].y > l[0].y && l[0].x === l[1].x, 'horizontal: along Y');
    assert.ok(Math.abs(v.lines[1][0].y - v.lines[0][0].y - 17.5 / 3) < 1e-6); assert.ok(Math.abs(h.lines[1][0].x - h.lines[0][0].x - 17.5 / 3) < 1e-6);
  });
});

test('long: every run its own dip; the seams two runs a track, the second 5 mm back over the first', () => {
  for (let n = 1; n <= 10; n++) for (const r of rows4(n)) assert.ok(P4.blocks.some(b => b.row === r && b.kind === 'joint' && b.deg > 0), `run ${r}`);
  for (const n of [1, 2, 3, 4, 6, 7, 8, 9]) assert.equal(rows4(n).length, 4);
  for (const n of [5, 10]) assert.equal(rows4(n).length, 8);
  const v = P4.strokes[4], h = P4.strokes[9];
  assert.equal(lenOf(v.lines[0]), 60); assert.equal(lenOf(h.lines[0]), 60);
  assert.equal(v.lines[1][0].x, v.lines[0][1].x + 5); assert.equal(h.lines[1][0].y, h.lines[0][1].y - 5);
  assert.equal(lenOf(v.lines[1]), 45); assert.equal(lenOf(h.lines[1]), 45);
});

test('long: the cells apart with their trail, all on the sheet, the carriage against the elbow, home at the end', () => {
  const box = q => { const p = q.lines.flat(); return { a: Math.min(...p.map(v => v.x)), b: Math.max(...p.map(v => v.x)), c: Math.min(...p.map(v => v.y)), d: Math.max(...p.map(v => v.y)) }; };
  const B = P4.strokes.map(box), gap = 12;   // the trail ~10 mm wide and a margin
  B.forEach((u, i) => B.forEach((v, j) => { if (i < j) assert.ok(u.b + gap <= v.a || v.b + gap <= u.a || u.d + gap <= v.c || v.d + gap <= u.c, `cells ${i + 1} and ${j + 1}`); }));
  const all = P4.strokes.flatMap(q => q.lines.flat());
  assert.ok(Math.min(...all.map(p => p.x)) >= 20 && Math.max(...all.map(p => p.x)) <= 200 && Math.min(...all.map(p => p.y)) >= 0 && Math.max(...all.map(p => p.y)) <= 230);
  assert.ok(P4.bounds.x0 >= 0, JSON.stringify(P4.bounds));
  for (const n of [4, 9]) {
    const q = P4.strokes[n - 1], r = rows4(n)[0], fly = P4.blocks.find(b => b.row === r && b.kind === 'move'), p = P4.blocks.find(b => b.row === r && b.paintMM > 0);
    assert.ok(Math.abs(+fly.cmds[1].split(' ')[1] - (q.lines[0][0].x - 1.25 * LAB.hover)) < 0.02);
    assert.ok(Math.abs(+p.cmds.filter(c => c[0] === 'L').at(-1).split(' ')[1] - (q.lines[0][1].x - 1.25 * LAB.lift)) < 0.02);
  }
  assert.equal(P4.blocks.at(-1).home, true);
  assert.ok(P4.seconds > 480 && P4.seconds < 1000, String(P4.seconds));
});

// ---------- LAB 3.0 · seam ----------
const P5 = labPlan({ x0: 0, y0: 0, cup, sheet: 5 });
const rows5 = n => P5.remote.rows.flatMap((r, i) => r.cells[0][0] === n ? [i + 1] : []);

test('seam: 80 mm of 4 tracks, a second dip at 45, on from 10, 15, 20 mm back, both ways', () => {
  assert.equal(P5.strokes.length, 6);
  assert.equal(P5.remote.colours[0].name, 'LAB 3.0 · seam');
  [10, 15, 20, 10, 15, 20].forEach((lap, i) => {
    const q = P5.strokes[i], vert = i < 3;
    assert.equal(q.lines.length, 8, 'two parts a track');
    assert.equal(lenOf(q.lines[0]), 45); assert.equal(lenOf(q.lines[1]), 35 + lap);
    if (vert) { assert.equal(q.lines[0][1].x + lap, q.lines[1][0].x); assert.equal(q.lines[0][0].y, q.lines[1][1].y); assert.ok(q.lines[1][1].x < q.lines[1][0].x); }
    else { assert.equal(q.lines[0][1].y - lap, q.lines[1][0].y); assert.equal(q.lines[0][0].x, q.lines[1][1].x); assert.ok(q.lines[1][1].y > q.lines[1][0].y); }
    assert.ok(q.say.includes(`${lap} mm back`));
    assert.equal(rows5(i + 1).length, 8);
    for (const r of rows5(i + 1)) assert.ok(P5.blocks.some(b => b.row === r && b.kind === 'joint' && b.deg > 0), `run ${r}: its dip`);
  });
});

test('seam: the cells apart, within the sheet, no wrist, home at the end', () => {
  const box = q => { const p = q.lines.flat(); return { a: Math.min(...p.map(v => v.x)), b: Math.max(...p.map(v => v.x)), c: Math.min(...p.map(v => v.y)), d: Math.max(...p.map(v => v.y)) }; };
  const B = P5.strokes.map(box), gap = 12;
  B.forEach((u, i) => B.forEach((v, j) => { if (i < j) assert.ok(u.b + gap <= v.a || v.b + gap <= u.a || u.d + gap <= v.c || v.d + gap <= u.c, `cells ${i + 1} and ${j + 1}`); }));
  const all = P5.strokes.flatMap(q => q.lines.flat());
  assert.ok(Math.min(...all.map(p => p.x)) >= 20 && Math.max(...all.map(p => p.x)) <= 180 && Math.max(...all.map(p => p.y)) <= 190);
  assert.ok(P5.bounds.x0 >= 0 && P5.bounds.y0 >= 0, JSON.stringify(P5.bounds));
  assert.ok(!P5.blocks.some(b => (b.cmds || []).some(c => c.startsWith('W 3'))));
  assert.equal(P5.blocks.at(-1).home, true);
});

// ---------- LAB 3.0 · long snake ----------
const P6 = labPlan({ x0: 0, y0: 0, cup, sheet: 6 });
const rows6 = n => P6.remote.rows.flatMap((r, i) => r.cells[0][0] === n ? [i + 1] : []);
const pathLen = pts => pts.slice(1).reduce((t, p, i) => t + Math.hypot(p.x - pts[i].x, p.y - pts[i].y), 0);
const legs = q => q.tip.slice(1).map((p, i) => ({ dx: p.x - q.tip[i].x, dy: p.y - q.tip[i].y }));

test('long snake: the long sheet\'s cells, their places and numbers, one line with its turns', () => {
  assert.equal(P6.strokes.length, 10);
  assert.equal(P6.remote.colours[0].name, 'LAB 3.0 · long snake');
  const box = q => { const p = q.flat(); return [Math.min(...p.map(v => v.x)), Math.max(...p.map(v => v.x)), Math.min(...p.map(v => v.y)), Math.max(...p.map(v => v.y))]; };
  P6.strokes.forEach((q, i) => {
    const [a, b, c, d] = box(P4.strokes[i].lines), [a6, b6, c6, d6] = box([q.tip]);
    for (const [u, v] of [[a, a6], [b, b6], [c, c6], [d, d6]]) assert.ok(Math.abs(u - v) < 1e-6, `${q.n}: the same box`);
    assert.equal(q.tip.length, 8, 'four tracks, joined');
  });
});

test('long snake: back and forth, the steps across the brush down, ↓ and → first', () => {
  const v = legs(P6.strokes[3]), h = legs(P6.strokes[8]);
  assert.deepEqual(v.map(g => Math.sign(g.dx)), [-1, 0, 1, 0, -1, 0, 1]);
  assert.deepEqual(h.map(g => Math.sign(g.dy)), [1, 0, -1, 0, 1, 0, -1]);
  for (const r of rows6(4)) { const p = P6.blocks.filter(b => b.row === r && b.paintMM > 0); assert.equal(p.length, 1, 'no lift inside a run'); assert.ok(!p[0].cmds.some(c => c[0] === 'M')); }
});

test('long snake: as much paint as the long sheet: four dips a cell, 5 and 10 about eight; every run its dip', () => {
  for (const n of [1, 2, 3, 4, 6, 7, 8, 9]) assert.equal(rows6(n).length, 4, `${n}`);
  for (const n of [5, 10]) assert.ok(rows6(n).length >= 8 && rows6(n).length <= 9, `${n}: ${rows6(n).length}`);
  for (let n = 1; n <= 10; n++) for (const r of rows6(n)) assert.ok(P6.blocks.some(b => b.row === r && b.kind === 'joint' && b.deg > 0), `run ${r}`);
});

test('snakeRuns: the whole path, every next run its lap back, the last taking a short rest', () => {
  const pts = [{ x: 100, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 6 }, { x: 100, y: 6 }, { x: 100, y: 12 }, { x: 0, y: 12 }], all = pathLen(pts);
  const runs = snakeRuns(pts, 75, 15), lens = runs.map(pathLen);
  assert.ok(Math.abs(lens.reduce((a, b) => a + b, 0) - (runs.length - 1) * 15 - all) < 1e-6, 'nothing left out');
  lens.slice(0, -1).forEach(l => assert.ok(Math.abs(l - 75) < 1e-6, 'every run 75 mm, its lap among them'));
  assert.deepEqual(runs[0][0], pts[0]); assert.deepEqual(runs.at(-1).at(-1), pts.at(-1));
  assert.deepEqual(runs[1][0], { x: 40, y: 0 }, '15 mm back from 75');
  assert.equal(snakeRuns(pts, 300, 15).length, 1, 'all but a quarter on one dip');
  assert.ok(snakeRuns(pts, 75, 100)[1][0].x > 0, 'a lap half a run at most');
});

test('snakeRuns cuts as OPM-N\'s dragRowsOf does', () => {
  const pts = [{ x: 100, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 6 }, { x: 100, y: 6 }, { x: 100, y: 12 }, { x: 0, y: 12 }, { x: 0, y: 18 }, { x: 100, y: 18 }];
  const strokes = [pts.slice(1).map((p, i) => ({ t: 'L', a: [pts[i].x, pts[i].y], b: [p.x, p.y] }))];
  for (const [every, lap] of [[75, 5], [75, 15], [115, 15], [60, 15], [200, 10]]) {
    const real = dragRowsOf([{ pencil: 'a', strokes }], [{ id: 'a', name: 'a' }], { boardW: 600, boardH: 600, edgeLeft: 0, edgeBottom: 0 }, every, lap).info.map(q => q.L);
    const mine = snakeRuns(pts, every, lap).map(pathLen);
    assert.equal(mine.length, real.length, `${every}/${lap}`);
    mine.forEach((l, i) => assert.ok(Math.abs(l - real[i]) < 0.6, `${every}/${lap} run ${i}: ${l} against ${real[i]}`));
  }
});

test('long snake: W on a piece, the carriage against the elbow at either end of a run, home at the end, no wrist', () => {
  for (const b of P6.blocks) (b.cmds || []).forEach((c, i) => { if (c[0] === 'W') assert.equal(b.cmds[i + 1][0], 'L'); });
  assert.ok(!P6.blocks.some(b => (b.cmds || []).some(c => c.startsWith('W 3'))));
  const q = P6.strokes[3], r = rows6(4)[0], fly = P6.blocks.find(b => b.row === r && b.kind === 'move'), p = P6.blocks.find(b => b.row === r && b.paintMM > 0);
  assert.ok(Math.abs(+fly.cmds[1].split(' ')[1] - (q.tip[0].x - 1.25 * LAB.hover)) < 0.02);
  const last = P6.remote.rows.length, pl = P6.blocks.find(b => b.row === last && b.paintMM > 0), end = pl.cmds.filter(c => c[0] === 'L').at(-1).split(' ');
  assert.ok(Math.abs(+end[1] - (P6.strokes[9].tip.at(-1).x - 1.25 * LAB.lift)) < 0.02);
  assert.equal(P6.blocks.at(-1).home, true);
  assert.ok(P6.bounds.x0 >= 0 && P6.bounds.y0 >= -1e-9, JSON.stringify(P6.bounds));
});

// ---------- LAB 3.0 · snake + idle ----------
const P7 = labPlan({ x0: 0, y0: 0, cup, sheet: 7 });
const rows7 = n => P7.remote.rows.flatMap((r, i) => r.cells[0][0] === n ? [i + 1] : []);
const inRow = (P, r) => P.blocks.filter(b => b.row === r);

test('snake + idle: the long snake to the letter, each cell followed by one run more', () => {
  assert.equal(P7.strokes.length, 10);
  assert.equal(P7.remote.colours[0].name, 'LAB 3.0 · snake + idle');
  assert.deepEqual(labSize(7), labSize(6));
  for (let n = 1; n <= 10; n++) {
    const r6 = rows6(n), r7 = rows7(n);
    assert.deepEqual(P7.strokes[n - 1].tip, P6.strokes[n - 1].tip, `${n}: the same line`);
    assert.equal(r7.length, r6.length + 1, `${n}: one run more`);
    const noHome = bs => bs.at(-1)?.home ? bs.slice(0, -2) : bs;
    r6.forEach((r, i) => assert.deepEqual(inRow(P7, r7[i]).map(b => b.cmds ?? b.cmd ?? b.deg), noHome(inRow(P6, r)).map(b => b.cmds ?? b.cmd ?? b.deg), `${n}, run ${i + 1}: its dip and paint as the long snake's`));
  }
});

test('snake + idle: the idle run has no dip and never turns the shoulder; it comes right after its cell', () => {
  assert.equal(P7.blocks.filter(b => b.dip).length, P6.blocks.filter(b => b.dip).length, 'no more dips');
  for (let n = 1; n <= 10; n++) {
    const r7 = rows7(n), idle = r7.at(-1);
    assert.deepEqual(r7, r7.map((_, i) => r7[0] + i), `${n}: its runs in a row, the idle one last`);
    r7.slice(0, -1).forEach(r => assert.ok(inRow(P7, r).some(b => b.kind === 'joint'), `${n}, run ${r}: a dip`));
    const b = inRow(P7, idle);
    assert.ok(!b.some(q => q.kind === 'joint' || q.dip), `${n}: no jar`);
    assert.ok(!b.some(q => /^J 1\b/.test(q.cmd ?? '')), `${n}: the shoulder still`);
    assert.deepEqual(b.slice(0, 4).map(q => q.kind), ['move', 'arm', 'move', 'arm'], `${n}: the flight, down, the line, up`);
    assert.equal(b.slice(4).length, n === 10 ? 2 : 0, `${n}: nothing after it, the last one's way home`);
  }
});

test('snake + idle: the idle run is the whole line, from the first run\'s own start, in one go', () => {
  for (let n = 1; n <= 10; n++) {
    const q = P7.strokes[n - 1], r7 = rows7(n), [fly0] = inRow(P7, r7[0]), [fly1, , line] = inRow(P7, r7.at(-1));
    assert.deepEqual(fly1.cmds, fly0.cmds, `${n}: flies to where the first run started`);
    assert.ok(Math.abs(line.paintMM - pathLen(q.tip)) < 1e-6, `${n}: all of it`);
    assert.ok(!line.cmds.some(c => c[0] === 'M'), `${n}: no flight inside`);
    const pts = line.cmds.filter(c => c[0] === 'L').map(c => c.split(' ').slice(1).map(Number));
    for (const p of q.tip.slice(1, -1)) assert.ok(pts.some(([x, y]) => Math.hypot(x - p.x, y - p.y) < 0.02), `${n}: through its turn at ${p.x}, ${p.y}`);
    const end = pts.at(-1);
    assert.ok(Math.abs(end[0] - (q.tip.at(-1).x - 1.25 * LAB.lift)) < 0.02 && Math.abs(end[1] - q.tip.at(-1).y) < 0.02, `${n}: lifts at the line's end`);
  }
  for (const b of P7.blocks) (b.cmds || []).forEach((c, i) => { if (c[0] === 'W') assert.equal(b.cmds[i + 1][0], 'L', 'W on a piece'); });
  assert.equal(P7.blocks.at(-1).home, true);
});

// ---------- LAB 3.0 · + idle 2.0 ----------
const P8 = labPlan({ x0: 0, y0: 0, cup, sheet: 8 });
const rows8 = n => P8.remote.rows.flatMap((r, i) => r.cells[0][0] === n ? [i + 1] : []);
const box = pts => ({ x0: Math.min(...pts.map(p => p.x)), x1: Math.max(...pts.map(p => p.x)), y0: Math.min(...pts.map(p => p.y)), y1: Math.max(...pts.map(p => p.y)) });

test('+ idle 2.0: five verticals and five horizontals of 80 mm, the long snake\'s, over 1 … 5 mm', () => {
  assert.equal(P8.remote.colours[0].name, 'LAB 3.0 · + idle 2.0');
  assert.deepEqual(P8.strokes.map(q => q.over), [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]);
  const v3 = P6.strokes[2], h8 = P6.strokes[7], shape = q => legs(q).map(g => [Math.round(g.dx * 100), Math.round(g.dy * 100)]);
  P8.strokes.slice(0, 5).forEach(q => assert.deepEqual(shape(q), shape(v3), `${q.n}: the long snake's no. 3`));
  P8.strokes.slice(5).forEach(q => assert.deepEqual(shape(q), shape(h8), `${q.n}: the long snake's no. 8`));
});

test('+ idle 2.0: each cell\'s first runs as the long snake\'s, four dips, then one run with none', () => {
  const mm = (P, r) => +inRow(P, r).find(b => b.paintMM > 0).paintMM.toFixed(6), lens = r => mm(P8, r), want = n => rows6(n).map(r => mm(P6, r));
  for (let n = 1; n <= 10; n++) {
    const rs = rows8(n), idle = rs.at(-1);
    assert.equal(rs.length, 5, `${n}: four and the idle one`);
    assert.deepEqual(rs.slice(0, 4).map(lens), want(n <= 5 ? 3 : 8), `${n}: the runs' lengths`);
    rs.slice(0, 4).forEach(r => assert.ok(inRow(P8, r).some(b => b.kind === 'joint'), `${n}, run ${r}: a dip`));
    assert.ok(!inRow(P8, idle).some(b => b.kind === 'joint' || /^J 1\b/.test(b.cmd ?? '')), `${n}: no jar, no shoulder`);
  }
  assert.equal(P8.remote.rows.filter((_, i) => inRow(P8, i + 1).some(b => b.kind === 'joint')).length, 40, 'forty dips');
});

test('+ idle 2.0: every track of the idle run longer by over at both ends, the turns out beyond the cell', () => {
  for (const q of P8.strokes) {
    const M = q.over, I = q.idleTip, T = q.tip, along = q.n <= 5 ? 'x' : 'y', side = along === 'x' ? 'y' : 'x';
    const c = box(T), o = box(I);
    assert.ok(Math.abs(c[`${along}0`] - o[`${along}0`] - M) < 1e-6 && Math.abs(o[`${along}1`] - c[`${along}1`] - M) < 1e-6, `${q.n}: out by ${M} at both ends`);
    assert.ok(Math.abs(c[`${side}0`] - o[`${side}0`]) < 1e-6 && Math.abs(o[`${side}1`] - c[`${side}1`]) < 1e-6, `${q.n}: no wider`);
    assert.equal(I.length, T.length, `${q.n}: its four tracks, in their order`);
    I.forEach((p, i) => assert.ok(Math.abs(p[side] - T[i][side]) < 1e-6, `${q.n}, point ${i}: on its track`));
    assert.ok(Math.abs(pathLen(I) - (pathLen(T) + 8 * M)) < 1e-6, `${q.n}: eight ends, ${M} mm each`);
    // the run itself: lands on the first point out, through the turns, lifts at the last
    const [fly, , line] = inRow(P8, rows8(q.n).at(-1)), pts = line.cmds.filter(c => c[0] === 'L').map(c => c.split(' ').slice(1).map(Number));
    assert.ok(Math.abs(line.paintMM - (pathLen(I) + LAB.wide)) < 1e-6, `${q.n}: all of it and the lift beyond`);
    const [mx, my] = fly.cmds[1].split(' ').slice(1).map(Number);
    assert.ok(Math.abs(mx - (I[0].x - 1.25 * LAB.hover)) < 0.02 && Math.abs(my - I[0].y) < 0.02, `${q.n}: flies to behind the bulb, the carriage against the elbow`);
    for (const p of I.slice(1)) assert.ok(pts.some(([x, y]) => Math.hypot(x - p.x, y - p.y) < 0.02), `${q.n}: through ${p.x}, ${p.y}`);
    // pressed all the way: the lift only after the plan's end + over (IMG_2303: "no past its end +5")
    const cmds = line.cmds.filter(c => c !== 'G'), w = cmds.findLastIndex(c => c.startsWith('W 2'));
    const [px, py] = cmds[w - 1].split(' ').slice(1).map(Number), E = I.at(-1), T0 = T.at(-1), T1 = T.at(-2), d = Math.hypot(T0.x - T1.x, T0.y - T1.y), u = { x: (T0.x - T1.x) / d, y: (T0.y - T1.y) / d };
    assert.ok(Math.abs(px - E.x) < 0.02 && Math.abs(py - E.y) < 0.02, `${q.n}: pressed to the end of the line, ${px}, ${py}`);
    assert.ok(Math.abs((px - T0.x) * u.x + (py - T0.y) * u.y - M) < 0.02, `${q.n}: ${M} mm past the cell's end, pressed`);
    assert.equal(cmds.slice(w).length, 2, `${q.n}: then only the lift`);
    const lx = E.x + u.x * LAB.wide - 1.25 * LAB.lift, ly = E.y + u.y * LAB.wide;
    assert.ok(Math.abs(pts.at(-1)[0] - lx) < 0.02 && Math.abs(pts.at(-1)[1] - ly) < 0.02, `${q.n}: lifts beyond it, the carriage against the elbow`);
  }
});

test('+ idle 2.0: on an A3 at the corner, the cells clear of each other even with their bulbs', () => {
  const { w, h } = labSize(8);
  assert.ok(w <= 420 && h + LAB.rowGap <= 297, `${w} × ${h + LAB.rowGap}`);
  assert.ok(P8.bounds.x0 >= 0 && P8.bounds.y0 >= 0 && P8.bounds.y1 <= w, JSON.stringify(P8.bounds));
  assert.ok(P8.strokes.every(q => box(q.idleTip).y1 <= w && box(q.idleTip).x1 <= h + LAB.rowGap), 'within the sheet drawn');
  const clear = 8, B = P8.strokes.map(q => box(q.idleTip));          // about a bulb's overrun at either side (est.)
  B.forEach((a, i) => B.slice(i + 1).forEach((b, j) => {
    const apart = Math.max(a.x0 - b.x1, b.x0 - a.x1, a.y0 - b.y1, b.y0 - a.y1);
    assert.ok(apart >= clear, `${i + 1} and ${i + j + 2}: ${apart} mm apart`);
  }));
  assert.equal(P8.blocks.at(-1).home, true);
  for (const b of P8.blocks) (b.cmds || []).forEach((c, i) => { if (c[0] === 'W') assert.equal(b.cmds[i + 1][0], 'L', 'W on a piece'); });
});

// ---------- LAB 3.0 · + idle 3.0 ----------
const P9 = labPlan({ x0: 0, y0: 0, cup, sheet: 9 });
const rows9 = n => P9.remote.rows.flatMap((r, i) => r.cells[0][0] === n ? [i + 1] : []);

test('+ idle 3.0: + idle 2.0\'s cells, first runs and dips to the letter', () => {
  assert.equal(P9.remote.colours[0].name, 'LAB 3.0 · + idle 3.0');
  assert.deepEqual(labSize(9), labSize(8));
  assert.deepEqual(P9.strokes.map(q => q.over), [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]);
  assert.equal(P9.remote.rows.length, P8.remote.rows.length);
  for (let n = 1; n <= 10; n++) {
    assert.deepEqual(P9.strokes[n - 1].tip, P8.strokes[n - 1].tip, `${n}: the same cell`);
    assert.deepEqual(rows9(n), rows8(n));
    rows9(n).slice(0, 4).forEach(r => assert.deepEqual(inRow(P9, r).map(b => b.cmds ?? b.cmd ?? b.deg), inRow(P8, r).map(b => b.cmds ?? b.cmd ?? b.deg), `${n}, run ${r}`));
    assert.ok(!inRow(P9, rows9(n).at(-1)).some(b => b.kind === 'joint' || /^J 1\b/.test(b.cmd ?? '')), `${n}: no jar, no shoulder`);
  }
});

test('+ idle 3.0: five passes, half a step aside: between the first run\'s tracks and outside the outer two', () => {
  for (const q of P9.strokes) {
    const M = q.over, I = q.idleTip, T = q.tip, side = q.n <= 5 ? 'y' : 'x', way = q.n <= 5 ? 'x' : 'y';
    assert.equal(I.length, 10, `${q.n}: five tracks`);
    const first = [0, 2, 4, 6].map(i => T[i][side]), step = first[1] - first[0], lines = [0, 2, 4, 6, 8].map(i => I[i][side]);
    lines.forEach((v, i) => assert.ok(Math.abs(v - (first[0] + (i - 0.5) * step)) < 1e-6, `${q.n}: pass ${i + 1} on a ridge`));
    [0, 2, 4, 6, 8].forEach(i => assert.ok(Math.abs(I[i + 1][side] - I[i][side]) < 1e-6, `${q.n}: pass straight`));
    const c = box(T), o = box(I);
    assert.ok(Math.abs(c[`${way}0`] - o[`${way}0`] - M) < 1e-6 && Math.abs(o[`${way}1`] - c[`${way}1`] - M) < 1e-6, `${q.n}: out by ${M} at both ends`);
    assert.ok(Math.abs(pathLen(I) - (5 * (80 + 2 * M) + 4 * step)) < 1e-6, `${q.n}: its length`);
    // the run: flies to where the idle line starts, pressed to its end, the lift beyond, no flight inside
    const [fly, , line] = inRow(P9, rows9(q.n).at(-1)), cmds = line.cmds.filter(c => c !== 'G'), w = cmds.findLastIndex(c => c.startsWith('W 2')), [px, py] = cmds[w - 1].split(' ').slice(1).map(Number), [mx, my] = fly.cmds[1].split(' ').slice(1).map(Number);
    assert.ok(Math.abs(mx - (I[0].x - 1.25 * LAB.hover)) < 0.02 && Math.abs(my - I[0].y) < 0.02, `${q.n}: lands behind the bulb`);
    assert.ok(Math.abs(px - I.at(-1).x) < 0.02 && Math.abs(py - I.at(-1).y) < 0.02, `${q.n}: pressed to its end`);
    assert.equal(cmds.slice(w).length, 2, `${q.n}: then only the lift`);
    assert.ok(!line.cmds.some(c => c[0] === 'M'), `${q.n}: no flight inside`);
    assert.ok(Math.abs(line.paintMM - (pathLen(I) + LAB.wide)) < 1e-6, `${q.n}: all of it and the lift`);
  }
});

test('+ idle 3.0: on an A3 at the corner, the cells still clear of each other', () => {
  const { w, h } = labSize(9);
  assert.ok(P9.bounds.x0 >= 0 && P9.bounds.y0 >= 0 && P9.bounds.y1 <= w, JSON.stringify(P9.bounds));
  assert.ok(P9.strokes.every(q => box(q.idleTip).y1 <= w && box(q.idleTip).x1 <= h + LAB.rowGap), 'within the sheet drawn');
  const B = P9.strokes.map(q => box(q.idleTip));
  B.forEach((a, i) => B.slice(i + 1).forEach((b, j) => {
    const apart = Math.max(a.x0 - b.x1, b.x0 - a.x1, a.y0 - b.y1, b.y0 - a.y1);
    assert.ok(apart >= 8, `${i + 1} and ${i + j + 2}: ${apart} mm apart`);
  }));
  assert.equal(P9.blocks.at(-1).home, true);
  for (const b of P9.blocks) (b.cmds || []).forEach((c, i) => { if (c[0] === 'W') assert.equal(b.cmds[i + 1][0], 'L', 'W on a piece'); });
});

// ---------- LAB 3.0 · + idle 4.0 and 5.0 ----------
const P10 = labPlan({ x0: 0, y0: 0, cup, sheet: 10 }), P11 = labPlan({ x0: 0, y0: 0, cup, sheet: 11 });
const rowsIn = (P, n) => P.remote.rows.flatMap((r, i) => r.cells[0][0] === n ? [i + 1] : []);
const cmdsOf = bs => bs.map(b => b.cmds ?? b.cmd ?? b.deg);

test('+ idle 4.0: + idle 2.0\'s cells, first runs and dips to the letter, its names', () => {
  assert.equal(P10.remote.colours[0].name, 'LAB 3.0 · + idle 4.0');
  assert.equal(P11.remote.colours[0].name, 'LAB 3.0 · + idle 5.0');
  assert.deepEqual(labSize(10), labSize(8)); assert.deepEqual(labSize(11), labSize(8));
  assert.deepEqual(P10.strokes.map(q => q.over), [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]);
  for (let n = 1; n <= 10; n++) {
    assert.deepEqual(P10.strokes[n - 1].tip, P8.strokes[n - 1].tip);
    assert.deepEqual(rowsIn(P10, n), rowsIn(P8, n));
    rowsIn(P10, n).slice(0, 4).forEach(r => assert.deepEqual(cmdsOf(inRow(P10, r)), cmdsOf(inRow(P8, r)), `${n}, run ${r}`));
  }
});

test('+ idle 4.0: five passes within the cell\'s width, evenly, out by over only at their ends', () => {
  for (const q of P10.strokes) {
    const M = q.over, I = q.idleTip, T = q.tip, side = q.n <= 5 ? 'y' : 'x', way = q.n <= 5 ? 'x' : 'y', c = box(T), o = box(I);
    assert.equal(I.length, 10, `${q.n}: five tracks`);
    assert.ok(Math.abs(o[`${side}0`] - c[`${side}0`]) < 1e-6 && Math.abs(o[`${side}1`] - c[`${side}1`]) < 1e-6, `${q.n}: not past the sides`);
    const W = c[`${side}1`] - c[`${side}0`];
    [0, 2, 4, 6, 8].forEach((i, k) => { assert.ok(Math.abs(I[i][side] - (T[0][side] + k * W / 4)) < 1e-6, `${q.n}: pass ${k + 1} evenly`); assert.ok(Math.abs(I[i + 1][side] - I[i][side]) < 1e-6, `${q.n}: straight`); });
    assert.ok(Math.abs(c[`${way}0`] - o[`${way}0`] - M) < 1e-6 && Math.abs(o[`${way}1`] - c[`${way}1`] - M) < 1e-6, `${q.n}: out by ${M} at both ends`);
    assert.ok(Math.abs(pathLen(I) - (5 * (80 + 2 * M) + W)) < 1e-6, `${q.n}: its length`);
    const b = inRow(P10, rowsIn(P10, q.n).at(-1)), [fly, , line] = b, cmds = line.cmds.filter(c => c !== 'G'), w = cmds.findLastIndex(c => c.startsWith('W 2')), [px, py] = cmds[w - 1].split(' ').slice(1).map(Number), [mx, my] = fly.cmds[1].split(' ').slice(1).map(Number);
    assert.ok(!b.some(q => q.kind === 'joint' || /^J 1\b/.test(q.cmd ?? '')), `${q.n}: no jar, no shoulder`);
    assert.ok(Math.abs(mx - (I[0].x - 1.25 * LAB.hover)) < 0.02 && Math.abs(my - I[0].y) < 0.02, `${q.n}: lands behind the bulb`);
    assert.ok(Math.abs(px - I.at(-1).x) < 0.02 && Math.abs(py - I.at(-1).y) < 0.02, `${q.n}: pressed to its end`);
    assert.equal(cmds.slice(w).length, 2, `${q.n}: then only the lift`);
    assert.ok(Math.abs(line.paintMM - (pathLen(I) + LAB.wide)) < 1e-6);
  }
});

test('+ idle 5.0: 4.0, but the first run\'s last track pressed to the cell\'s end, its lift beyond', () => {
  for (const q of P11.strokes) {
    const rs = rowsIn(P11, q.n), T = q.tip, E = T.at(-1), P = T.at(-2), d = Math.hypot(E.x - P.x, E.y - P.y), u = { x: (E.x - P.x) / d, y: (E.y - P.y) / d };
    assert.deepEqual(q.idleTip, P10.strokes[q.n - 1].idleTip, `${q.n}: the same idle line`);
    assert.deepEqual(cmdsOf(inRow(P11, rs.at(-1))).slice(0, 4), cmdsOf(inRow(P10, rs.at(-1))).slice(0, 4), `${q.n}: the same idle run`);
    rs.slice(0, 3).forEach(r => assert.deepEqual(cmdsOf(inRow(P11, r)), cmdsOf(inRow(P10, r)), `${q.n}, run ${r}: untouched`));
    // the fourth: as long plus the lift, the dip and the landing the same
    const a = inRow(P10, rs[3]), b = inRow(P11, rs[3]), line = b.find(x => x.paintMM > 0), cmds = line.cmds.filter(c => c !== 'G'), w = cmds.findLastIndex(c => c.startsWith('W 2')), [px, py] = cmds[w - 1].split(' ').slice(1).map(Number), [lx, ly] = cmds.at(-1).split(' ').slice(1).map(Number);
    assert.deepEqual(cmdsOf(b.filter(x => x.kind === 'joint')), cmdsOf(a.filter(x => x.kind === 'joint')), `${q.n}: the same dip`);
    assert.deepEqual(b[0].cmds, a[0].cmds, `${q.n}: flies to the same start`);
    assert.ok(Math.abs(line.paintMM - (a.find(x => x.paintMM > 0).paintMM + LAB.wide)) < 1e-6, `${q.n}: ${LAB.wide} mm more`);
    assert.ok(Math.abs(px - E.x) < 0.02 && Math.abs(py - E.y) < 0.02, `${q.n}: pressed to the cell's end, ${px}, ${py}`);
    assert.equal(cmds.slice(w).length, 2, `${q.n}: then only the lift`);
    assert.ok(Math.abs(lx - (E.x + u.x * LAB.wide - 1.25 * LAB.lift)) < 0.02 && Math.abs(ly - (E.y + u.y * LAB.wide)) < 0.02, `${q.n}: lifts beyond it`);
  }
  // the other sheets keep the old end: long snake's comparison stands
  const q = P10.strokes[3], line = inRow(P10, rowsIn(P10, 4)[3]).find(x => x.paintMM > 0), cmds = line.cmds.filter(c => c !== 'G'), w = cmds.findLastIndex(c => c.startsWith('W 2'));
  assert.ok(Math.abs(+cmds[w - 1].split(' ')[1] - (q.tip.at(-1).x - LAB.wide)) < 0.02, '4.0 presses to 8 mm short, as before');
});

test('+ idle 4.0 and 5.0: on an A3 at the corner, the cells clear of each other, home at the end', () => {
  const { w, h } = labSize(11);
  for (const P of [P10, P11]) {
    assert.ok(P.bounds.x0 >= 0 && P.bounds.y0 >= 0 && P.bounds.y1 <= w, JSON.stringify(P.bounds));
    assert.ok(P.strokes.every(q => box(q.idleTip).y1 <= w && box(q.idleTip).x1 <= h + LAB.rowGap));
    const B = P.strokes.map(q => box(q.idleTip));
    B.forEach((a, i) => B.slice(i + 1).forEach((b, j) => assert.ok(Math.max(a.x0 - b.x1, b.x0 - a.x1, a.y0 - b.y1, b.y0 - a.y1) >= 8, `${i + 1} and ${i + j + 2}`)));
    assert.equal(P.blocks.at(-1).home, true);
    for (const b of P.blocks) (b.cmds || []).forEach((c, i) => { if (c[0] === 'W') assert.equal(b.cmds[i + 1][0], 'L', 'W on a piece'); });
  }
});

// ---------- LAB 3.0 · + idle 6.0: the canon's verticals, and modules lying down made of short verticals ----------
const P12 = labPlan({ x0: 0, y0: 0, cup, sheet: 12 });
const numsOf = c => c.split(' ').slice(1).map(Number);
const W0_12 = 17.5, top12 = 67.5, bottom12 = 50;
const lineOf = (P, r) => { const b = inRow(P, r).find(x => x.paintMM > 0); return { fly: inRow(P, r).find(x => x.cmds?.some(c => c[0] === 'M')), cmds: b.cmds.filter(c => c !== 'G'), mm: b.paintMM }; };

test('+ idle 6.0: three verticals and three lying down, over 2, 3, 4, five runs each, four dips; two diagonals at +3', () => {
  assert.equal(P12.remote.colours[0].name, 'LAB 3.0 · + idle 6.0');
  assert.equal(P12.strokes.length, 8);
  assert.deepEqual(P12.strokes.map(q => q.over), [2, 3, 4, 2, 3, 4, 3, 3]);
  for (let n = 1; n <= 6; n++) {
    assert.equal(rowsIn(P12, n).length, 5, `${n}: four runs and the idle one`);
    const dips = rowsIn(P12, n).map(r => inRow(P12, r).filter(b => b.dip).length > 0);
    assert.deepEqual(dips, [true, true, true, true, false], `${n}: a dip before each of the four, none before the idle`);
  }
});

test('+ idle 6.0: its verticals are + idle 5.0\'s 2, 3, 4 to the letter, in their places', () => {
  for (let n = 1; n <= 3; n++) {
    assert.deepEqual(P12.strokes[n - 1].tip, P11.strokes[n].tip);
    assert.deepEqual(P12.strokes[n - 1].idleTip, P11.strokes[n].idleTip);
    rowsIn(P12, n).forEach((r, i) => assert.deepEqual(cmdsOf(inRow(P12, r)), cmdsOf(inRow(P11, rowsIn(P11, n + 1)[i])), `${n}, run ${i + 1}`));
  }
});

test('+ idle 6.0: lying down, 80 × 17.5 mm, the legs as far apart as a vertical\'s tracks', () => {
  P12.strokes.slice(3, 6).forEach((q, c) => {
    const B = box(q.tip), y0 = 20 + c * 105;
    assert.deepEqual([B.x0, B.x1], [bottom12, top12]);
    assert.ok(Math.abs(B.y0 - y0) < 1e-9 && Math.abs(B.y1 - (y0 + 80)) < 1e-9, `${q.n}`);
    assert.equal(q.tip.length, 30, '15 legs');
    for (let i = 0; i + 1 < q.tip.length; i += 2) {
      assert.equal(Math.abs(q.tip[i + 1].x - q.tip[i].x), W0_12);
      assert.ok(Math.abs(q.tip[i + 1].y - q.tip[i].y) < 1e-9, 'a leg along X only');
    }
    assert.ok(Math.abs(q.tip[2].y - q.tip[0].y - 80 / 14) < 1e-9);
    assert.equal(q.idleTip.length, 38, '19 idle legs');
    assert.ok(Math.abs(q.idleTip[2].y - q.idleTip[0].y - 80 / 18) < 1e-9);
  });
});

test('+ idle 6.0: lying down the brush never paints sideways: no diagonal anywhere, a step only at a leg\'s end, short', () => {
  for (let n = 4; n <= 6; n++) for (const r of rowsIn(P12, n)) {
    const { fly, cmds } = lineOf(P12, r);
    let at = numsOf(fly.cmds[1]);
    for (const c of cmds) {
      if (c[0] !== 'L') continue;
      const p = numsOf(c), dx = Math.abs(p[0] - at[0]), dy = Math.abs(p[1] - at[1]);
      assert.ok(dx < 0.011 || dy < 0.011, `${n}, row ${r}: no diagonal, ${c} from ${at}`);
      if (dy >= 0.011) assert.ok(dy <= 80 / 14 + 0.011, `${n}, row ${r}: a short step, ${c}`);
      at = p;
    }
  }
});

test('+ idle 6.0: lying down every run lands on a leg ↓ from the top and is pressed to its last leg\'s end, its lift beyond', () => {
  for (let n = 4; n <= 6; n++) rowsIn(P12, n).slice(0, 4).forEach((r, j) => {
    const { fly, cmds } = lineOf(P12, r), q = P12.strokes[n - 1], leg = q.tip[j * 8], w = cmds.findLastIndex(c => c.startsWith('W 2'));
    const [mx, my] = numsOf(fly.cmds[1]), [fx, fy] = numsOf(cmds.find(c => c[0] === 'L'));
    assert.ok(Math.abs(mx - (leg.x - 1.25 * LAB.hover)) < 0.02 && Math.abs(my - leg.y) < 0.02, `${n}, run ${j + 1}: flies to its leg's start`);
    assert.ok(Math.abs(fx - (top12 - LAB.wide)) < 0.02 && Math.abs(fy - leg.y) < 0.02, `${n}, run ${j + 1}: pressed ${LAB.wide} mm down the leg`);
    const last = q.tip[Math.min(j * 8 + 7, 29)], [px, py] = numsOf(cmds[w - 1]), [lx, ly] = numsOf(cmds.at(-1)), way = last === q.tip[29] ? -1 : 1;
    assert.ok(Math.abs(px - last.x) < 0.02 && Math.abs(py - last.y) < 0.02, `${n}, run ${j + 1}: pressed to the leg's end, ${px}, ${py}`);
    assert.ok(Math.abs(lx - (last.x + way * LAB.wide - 1.25 * LAB.lift)) < 0.02 && Math.abs(ly - last.y) < 0.02, `${n}, run ${j + 1}: lifts beyond it`);
    assert.equal(cmds.slice(w).length, 2, 'then only the lift');
  });
});

test('+ idle 6.0: lying down the idle run stays within the 80 mm, out by over only at the legs\' ends, no jar, no shoulder', () => {
  for (let n = 4; n <= 6; n++) {
    const q = P12.strokes[n - 1], I = box(q.idleTip), T = box(q.tip), r = rowsIn(P12, n).at(-1);
    assert.ok(Math.abs(I.y0 - T.y0) < 1e-9 && Math.abs(I.y1 - T.y1) < 1e-9, `${n}: within the sides`);
    assert.deepEqual([I.x0, I.x1], [bottom12 - q.over, top12 + q.over]);
    assert.ok(!inRow(P12, r).some(b => b.dip || b.kind === 'joint' || /^J 1\b/.test(b.cmd ?? '')), `${n}: no jar, no shoulder`);
    const { fly, cmds } = lineOf(P12, r), w = cmds.findLastIndex(c => c.startsWith('W 2')), [mx, my] = numsOf(fly.cmds[1]), [px] = numsOf(cmds[w - 1]);
    assert.ok(Math.abs(mx - (top12 + q.over - 1.25 * LAB.hover)) < 0.02 && Math.abs(my - T.y0) < 0.02, `${n}: lands behind the bulb`);
    assert.ok(Math.abs(px - (bottom12 - q.over)) < 0.02, `${n}: pressed to its end`);
  }
});

test('+ idle 6.0: on an A3 at the corner, the modules clear of each other, the same line at any Tracks, home at the end', () => {
  const { w, h } = labSize(12), B = P12.strokes.map(q => box(q.idleTip));
  assert.ok(P12.bounds.x0 >= 0 && P12.bounds.y0 >= 0 && P12.bounds.y1 <= w && P12.bounds.x1 <= h + LAB.rowGap, JSON.stringify(P12.bounds));
  B.forEach((a, i) => B.slice(i + 1).forEach((b, j) => assert.ok(Math.max(a.x0 - b.x1, b.x0 - a.x1, a.y0 - b.y1, b.y0 - a.y1) >= 8, `${i + 1} and ${i + j + 2}`)));
  assert.equal(P12.blocks.at(-1).home, true);
  for (const b of P12.blocks) (b.cmds || []).forEach((c, i) => { if (c[0] === 'W') assert.equal(b.cmds[i + 1][0], 'L', 'W on a piece'); });
  for (const tracks of [1, 2, 8]) {
    const P = labPlan({ x0: 0, y0: 0, cup, sheet: 12, tracks });
    assert.equal(P.strokes.length, 8, `${tracks} tracks`);
    assert.ok(P.blocks.flatMap(b => b.cmds ?? []).every(c => !/NaN|Infinity/.test(c)), `${tracks} tracks: every number a number`);
  }
});

// the diagonals, 7 and 8: parallelograms, a flat top and bottom, sides at 45°, the same up-and-down legs cut short by the sides
const D12 = [{ n: 7, top: 185, lean: 1 }, { n: 8, top: 135, lean: -1 }], High = 30, Base = 60, Y12 = 205;
const edge12 = (q, y) => { const s = y - Y12, t = q.lean > 0 ? s : Base + High - s; return [q.top - Math.max(0, t - Base), q.top - Math.min(High, t)]; };

test('+ idle 6.0, the diagonals: every leg along X, from its top to its bottom in the parallelogram, cut short only by its sides', () => {
  for (const d of D12) {
    const q = P12.strokes[d.n - 1];
    for (const [pts, label] of [[q.tip, 'first'], [P12.strokes[d.n - 1].idleTip, 'idle']]) {
      const out = label === 'idle' ? q.over : 0;
      for (let i = 0; i + 1 < pts.length; i += 2) {
        const hi = Math.max(pts[i].x, pts[i + 1].x), lo = Math.min(pts[i].x, pts[i + 1].x), [a, b] = edge12(d, pts[i].y);
        assert.ok(Math.abs(pts[i].y - pts[i + 1].y) < 1e-9, `${d.n} ${label}: a leg along X only`);
        assert.ok(Math.abs(hi - (a + out)) < 1e-9 && Math.abs(lo - (b - out)) < 1e-9, `${d.n} ${label}, leg ${i / 2 + 1}: ${lo} … ${hi}, not ${b} … ${a}`);
      }
    }
    const lens = []; for (let i = 0; i + 1 < q.tip.length; i += 2) lens.push(Math.abs(q.tip[i].x - q.tip[i + 1].x));
    assert.equal(Math.max(...lens), High, `${d.n}: full height in its middle`);
    assert.ok(Math.min(...lens) >= 3 && Math.min(...lens) < 7, `${d.n}: short at its corners, ${Math.min(...lens)}`);
    assert.ok(box(q.tip).y0 > Y12 && box(q.tip).y1 < Y12 + Base + High, `${d.n}: within its span`);
    assert.ok(box(q.idleTip).y0 > Y12 && box(q.idleTip).y1 < Y12 + Base + High, `${d.n}: the idle within its span`);
    assert.equal(q.tip.length / 2, 14); assert.equal(q.idleTip.length / 2, 20);
  }
  // mirror images: the same legs from the other end
  const len = (q, i) => Math.abs(q.tip[2 * i].x - q.tip[2 * i + 1].x), a = P12.strokes[6], b = P12.strokes[7];
  for (let i = 0; i < 14; i++) assert.ok(Math.abs(len(a, i) - len(b, 13 - i)) < 1e-9);
});

test('+ idle 6.0, the diagonals: no piece but a short step leaves X; a step sideways or along the side, never farther than the pitch', () => {
  for (const d of D12) for (const r of rowsIn(P12, d.n)) {
    const { fly, cmds } = lineOf(P12, r), idle = r === rowsIn(P12, d.n).at(-1), pitch = 90 / (idle ? 21 : 15);
    let at = numsOf(fly.cmds[1]);
    for (const c of cmds) {
      if (c[0] !== 'L') continue;
      const p = numsOf(c), dx = Math.abs(p[0] - at[0]), dy = Math.abs(p[1] - at[1]);
      if (dy > 0.011) { assert.ok(dy <= pitch + 0.011, `${d.n}, row ${r}: ${c} a step of ${dy}`); assert.ok(dx <= dy + 0.02, `${d.n}, row ${r}: ${c}, no steeper than the side`); }
      at = p;
    }
  }
});

test('+ idle 6.0, the diagonals: whole legs a run, at most as much line as a vertical\'s, the last leg pressed to its end, the idle with no dip', () => {
  for (const d of D12) {
    const q = P12.strokes[d.n - 1], rs = rowsIn(P12, d.n);
    assert.ok(rs.length >= 5 && rs.length <= 7, `${d.n}: ${rs.length} runs`);
    let leg = 0;
    rs.slice(0, -1).forEach(r => {
      const { fly, cmds, mm } = lineOf(P12, r), w = cmds.findLastIndex(c => c.startsWith('W 2')), [mx, my] = numsOf(fly.cmds[1]), [px, py] = numsOf(cmds[w - 1]);
      assert.ok(inRow(P12, r).some(b => b.dip), `${d.n}, row ${r}: a dip`);
      assert.ok(Math.abs(my - q.tip[2 * leg].y) < 0.02 && Math.abs(mx - (q.tip[2 * leg].x - 1.25 * LAB.hover)) < 0.02, `${d.n}, row ${r}: flies to a leg's start`);
      assert.ok(mm - LAB.wide <= 95 + 1e-6, `${d.n}, row ${r}: ${mm} mm`);
      const legsHere = cmds.filter(c => c[0] === 'L').length, ends = q.tip.findIndex((p, i) => i % 2 && Math.abs(p.x - px) < 0.02 && Math.abs(p.y - py) < 0.02);
      assert.ok(ends > 0 && legsHere > 0, `${d.n}, row ${r}: pressed to a leg's end, ${px}, ${py}`);
      leg = (ends + 1) / 2;
    });
    assert.equal(leg, 14, `${d.n}: every leg painted`);
    assert.ok(!inRow(P12, rs.at(-1)).some(b => b.dip || b.kind === 'joint' || /^J 1\b/.test(b.cmd ?? '')), `${d.n}: no jar, no shoulder on the idle run`);
  }
});

test('+ idle 6.0: the lying modules cut as before the diagonals came: four legs a dip, the last run three', () => {
  for (let n = 4; n <= 6; n++) {
    const q = P12.strokes[n - 1], rs = rowsIn(P12, n).slice(0, 4), L = r => lineOf(P12, r).mm;
    const legs = [4, 4, 4, 3], one = 17.5, step = 80 / 14;
    rs.forEach((r, j) => assert.ok(Math.abs(L(r) - (legs[j] * one + (legs[j] - 1) * step + LAB.wide)) < 1e-6, `${n}, run ${j + 1}`));
    assert.equal(q.tip.length, 30);
  }
});

// ---------- LAB 3.0 · ladder: what a short leg really leaves, on one 20 × 20 canvas ----------
const P13 = labPlan({ x0: 0, y0: 0, cup, sheet: 13 });
const legsIn = q => { const out = []; for (let i = 0; i + 1 < q.tip.length; i += 2) out.push([q.tip[i], q.tip[i + 1]]); return out; };
const legLen = ([a, b]) => Math.hypot(b.x - a.x, b.y - a.y);
const dipped13 = r => inRow(P13, r).some(b => b.dip);
const LENGTHS = [5, 8, 12, 16, 24, 32], since = seq => { let t = 0; return seq.map(L => { const s = t; t += L; return s; }); };

test('ladder: 36 numbers, in their order: alone by its own dip, on 4 mm, shortest first, longest first, snakes, snakes + idle, shapes', () => {
  assert.equal(P13.remote.colours[0].name, 'LAB 3.0 · ladder');
  assert.equal(P13.strokes.length, 36);
  assert.deepEqual(P13.strokes.slice(0, 6).map(q => legLen(legsIn(q)[0])), LENGTHS);
  assert.deepEqual(P13.strokes.slice(6, 9).map(q => legLen(legsIn(q)[0])), [5, 8, 12]);
  assert.deepEqual(P13.strokes.slice(9, 15).map(q => legLen(legsIn(q)[0])), LENGTHS);
  assert.deepEqual(P13.strokes.slice(15, 21).map(q => legLen(legsIn(q)[0])), [...LENGTHS].reverse());
  P13.strokes.slice(21, 33).forEach((q, i) => legsIn(q).forEach(l => assert.ok(Math.abs(legLen(l) - LENGTHS[i % 6]) < 1e-9, `${q.n}`)));
});

test('ladder: the doses as it says: its own dip each, or one dip and the line since it', () => {
  for (let n = 1; n <= 9; n++) assert.deepEqual(rowsIn(P13, n).map(dipped13), [true], `${n}`);
  const up = since(LENGTHS), down = since([...LENGTHS].reverse());
  P13.strokes.slice(9, 15).forEach((q, i) => { assert.equal(dipped13(rowsIn(P13, q.n)[0]), i === 0, `${q.n}`); if (i) assert.match(q.say, new RegExp(`${up[i]} mm of line since it`)); });
  P13.strokes.slice(15, 21).forEach((q, i) => { assert.equal(dipped13(rowsIn(P13, q.n)[0]), i === 0, `${q.n}`); if (i) assert.match(q.say, new RegExp(`${down[i]} mm of line since it`)); });
  for (const n of [11, 12, 17, 21]) assert.ok(!inRow(P13, rowsIn(P13, n)[0]).some(b => b.kind === 'joint' || /^J 1\b/.test(b.cmd ?? '')), `${n}: no jar, no shoulder`);
});

test('ladder: a leg alone goes ↓ along X, pressed to its end if it has room, its lift beyond it, on 8 mm or on 4', () => {
  P13.strokes.slice(0, 21).forEach(q => {
    const r = rowsIn(P13, q.n)[0], { fly, cmds } = lineOf(P13, r), [a, b] = legsIn(q)[0], ramp = q.n >= 7 && q.n <= 9 ? 4 : 8, L = legLen([a, b]), W = Math.min(ramp, (L + ramp) / 2);
    assert.ok(a.x > b.x && Math.abs(a.y - b.y) < 1e-9, `${q.n}: ↓ along X`);
    const [mx, my] = numsOf(fly.cmds[1]), ls = cmds.filter(c => c[0] === 'L').map(numsOf);
    assert.ok(Math.abs(mx - (a.x - 1.25 * LAB.hover)) < 0.02 && Math.abs(my - a.y) < 0.02, `${q.n}: flies to its start`);
    assert.ok(Math.abs(ls[0][0] - (a.x - W)) < 0.02, `${q.n}: lands over ${W} mm, at ${ls[0][0]}`);
    assert.ok(Math.abs(ls.at(-1)[0] - (b.x - ramp - 1.25 * LAB.lift)) < 0.02, `${q.n}: lifts over its ${ramp} mm beyond the end`);
    assert.ok(cmds.filter(c => c[0] === 'L').every((c, i, all) => numsOf(c)[1] === numsOf(all[0])[1]), `${q.n}: never off its column`);
  });
});

test('ladder: its snakes are what OPM-N\'s DRAG SNAKE lays for that rectangle, first run and idle run, the dips too', () => {
  const up = bs => bs.filter(b => !b.home).map(b => b.cmds ?? b.cmd ?? b.deg);
  P13.strokes.slice(27, 33).forEach(q => {
    const B = box(q.tip), off = 2, poly = [[B.y0 - off, B.x0 - off], [B.y1 + off, B.x0 - off], [B.y1 + off, B.x1 + off], [B.y0 - off, B.x1 + off]];
    const c = idleCellOf({ poly });
    assert.equal(c.legs.length, q.tip.length / 2, `${q.n}: its legs`);
    c.legs.forEach(([a, b], i) => assert.ok(Math.abs(a[0] - q.tip[2 * i].y) < 1e-6 && Math.abs(a[1] - q.tip[2 * i].x) < 1e-6 && Math.abs(b[1] - q.tip[2 * i + 1].x) < 1e-6, `${q.n}, leg ${i + 1}`));
    assert.equal(c.line.length, q.idleTip.length, `${q.n}: its idle legs`);
    c.line.forEach((p, i) => assert.ok(Math.abs(p[0] - q.idleTip[i].y) < 1e-6 && Math.abs(p[1] - q.idleTip[i].x) < 1e-6, `${q.n}, idle point ${i}`));
    assert.equal(c.over, q.over); assert.equal(c.end, 0);
  });
});

test('ladder: the shapes\' legs cut by their sides, idle +3 to the very end, as OPM-N has a slanted side', () => {
  P13.strokes.slice(33).forEach(q => assert.equal(q.over, q.n === 34 ? 2 : 3, `${q.n}`));
  const lens = q => legsIn(q).map(l => +legLen(l).toFixed(6));
  assert.deepEqual(lens(P13.strokes[33]), [12, 12]);
  assert.deepEqual(lens(P13.strokes[34]), [5, 9, 13, 17, 21]);
  assert.deepEqual(lens(P13.strokes[35]), [5, 13, 21, 13, 5]);
  for (const q of P13.strokes.slice(34)) {
    const ends = legsIn({ tip: q.idleTip }).map(l => +legLen(l).toFixed(6));
    assert.ok(Math.min(...ends) >= 10.9, `${q.n}: every idle leg +3 at both ends, ${ends}`);
    assert.equal(rowsIn(P13, q.n).length, 2, `${q.n}: one dip, one idle run`);
  }
});

test('ladder: at most 95 mm of line a dip, whole legs; pressed to the last leg\'s end; the idle with no jar', () => {
  P13.strokes.slice(21).forEach(q => {
    const rs = rowsIn(P13, q.n), idle = q.idleTip ? rs.at(-1) : null;
    rs.filter(r => r !== idle).forEach(r => {
      assert.ok(dipped13(r), `${q.n}, row ${r}: a dip`);
      assert.ok(lineOf(P13, r).mm - LAB.wide <= 95 + 1e-6, `${q.n}, row ${r}: ${lineOf(P13, r).mm} mm`);
    });
    if (idle) assert.ok(!inRow(P13, idle).some(b => b.dip || b.kind === 'joint' || /^J 1\b/.test(b.cmd ?? '')), `${q.n}: no jar, no shoulder on the idle run`);
  });
  assert.equal(rowsIn(P13, 27).filter(dipped13).length, 2, '3 legs of 32 mm go over 95: 2 + 1');
  assert.equal(rowsIn(P13, 26).filter(dipped13).length, 1);
});

test('ladder: no piece of no length, where a short leg\'s landing meets its lift: the board gets a move or nothing', () => {
  for (const b of P13.blocks) {
    if (!b.paintMM) continue;
    const ls = b.cmds.filter(c => c[0] === 'L');
    ls.forEach((c, i) => assert.ok(!i || c !== ls[i - 1], `row ${b.row}: ${c} twice`));
  }
});

test('ladder: on one 20 × 20, 10 mm clear of its edges even in its lifts, every number clear of the others, the same at any Tracks', () => {
  const { w, h } = labSize(13);
  assert.deepEqual([w, h + LAB.rowGap], [200, 200]);
  const boxes = P13.strokes.map(q => { const b = box([...q.tip, ...(q.idleTip ?? [])]), ramp = q.n >= 7 && q.n <= 9 ? 4 : 8; return { ...b, n: q.n, tailed: b.x0 - ramp, y0: b.y0 - 2, y1: b.y1 + 2, x1: b.x1 }; });
  for (const b of boxes) assert.ok(b.y0 >= 10 && b.y1 <= 190 && b.x1 <= 190 && b.tailed >= 10, `${b.n}: ${JSON.stringify(b)}`);
  boxes.forEach((a, i) => boxes.slice(i + 1).forEach(b => {
    const clear = Math.max(a.tailed - b.x1, b.tailed - a.x1, a.y0 - b.y1, b.y0 - a.y1);
    assert.ok(clear >= 2, `${a.n} and ${b.n}: ${clear} mm`);          // a lift's tail is in the air by then
  }));
  assert.equal(P13.blocks.at(-1).home, true);
  for (const b of P13.blocks) (b.cmds || []).forEach((c, i) => { if (c[0] === 'W') assert.equal(b.cmds[i + 1][0], 'L', 'W on a piece'); });
  assert.ok(P13.blocks.flatMap(b => b.cmds ?? []).every(c => !/NaN|Infinity/.test(c)), 'every number a number');
  assert.deepEqual(labPlan({ x0: 0, y0: 0, cup, sheet: 13, tracks: 1 }).strokes, P13.strokes);
  assert.ok(P13.seconds > 300 && P13.seconds < 900, `${P13.seconds} s`);
});

// ---------- LAB 4.0 · real strokes: the pictures' own legs, no dip on a short one, four ways of coming from the jar ----------
const P14 = labPlan({ x0: 0, y0: 0, cup, sheet: 14 });
const rowsOf14 = n => P14.remote.rows.map((r, i) => r.cells[0][0] === n ? i + 1 : 0).filter(Boolean);
const blocks14 = n => { const set = new Set(rowsOf14(n)); return P14.blocks.filter(b => set.has(b.row)); };
const shifted = n => { const s = P14.strokes[n - 1], o = s.lines[0][0]; return s.lines.map(([a, b]) => [a.x - o.x, a.y - o.y, b.x - o.x, b.y - o.y].map(v => +v.toFixed(2))); };

test('real strokes: 20 numbers, the first paint then a pause then the second, the two colours on the iPhone\'s list', () => {
  assert.equal(P14.strokes.length, 20);
  assert.deepEqual(P14.remote.colours.map(c => c.cells), [12, 8]);
  assert.equal(P14.remote.colours[0].name, 'LAB 4.0 · real strokes · the first paint');
  const pauses = P14.blocks.map((b, i) => [b, i]).filter(([b]) => b.kind === 'pause');
  assert.equal(pauses.length, 1);
  assert.ok(P14.remote.rows.every((r, i) => i + 1 >= P14.blocks[pauses[0][1] + 1].row ? r.c === 1 : r.c === 0), 'all of the first paint before it');
  assert.deepEqual(labSize(14), { h: 176, w: 200 });
});

test('real strokes: the same strokes in all four ways, each of the pieces\' cells with its idle run', () => {
  const firstLines = k => shifted(k);
  for (const group of [[1, 4, 7, 10], [2, 5, 8, 11], [13, 15, 17, 19], [14, 16, 18, 20]]) {
    const legs = n => { const s = P14.strokes[n - 1]; return s.lines.map(([a, b]) => [Math.min(a.x, b.x), Math.max(a.x, b.x), a.y, b.y].map(v => +(v).toFixed(1))); };
    const ends = n => legs(n).filter(l => l[2] === l[3]).length;
    assert.equal(ends(group[0]), ends(group[1]), `${group}: as many legs on a slow way`);
    assert.ok(firstLines(group[0]).length > 0);
  }
  for (const P of REAL_PIECES) for (const paint of [0, 1]) {
    const cells = P.cells.filter(c => c.paint === paint).flatMap(startOnLong), done = dipsOnLong(cells.map((c, i) => cellOf({ ...c, n: i + 1 }, { pitch: 5 }, i + 1, { every: 95, lap: 15 })), 95, 15);
    assert.equal(cells.flatMap(c => c.legs).length, P.cells.filter(c => c.paint === paint).flatMap(c => c.legs).length, 'no leg lost');
    assert.equal(done.length, cells.length, 'no cell lost');
    const runs = idleRunsOf([{ byCell: done }], 95, 15);
    assert.equal(runs.filter(r => r.idle).length, cells.length, 'every cell its idle run');
  }
  assert.equal(REAL_PIECES.length, 2); assert.ok(REAL_LONG.leg[0] > 95, 'a dip in the middle of the long leg');
});

test('real strokes: no dip lands on a short leg, what the brush holds paints those', () => {
  const short = [];
  for (const P of REAL_PIECES) for (const paint of [0, 1]) {
    const cells = P.cells.filter(c => c.paint === paint).flatMap(startOnLong).map((c, i) => cellOf({ ...c, n: i + 1 }, { pitch: 5 }, i + 1, { every: 95, lap: 15 }));
    for (const r of idleRunsOf([{ byCell: dipsOnLong(cells, 95, 15) }], 95, 15)) if (r.dip) { const d = Math.hypot(r.pts[1][0] - r.pts[0][0], r.pts[1][1] - r.pts[0][1]); if (d < 12) short.push([P.id, paint, +d.toFixed(1)]); }
  }
  assert.deepEqual(short, []);
  const legs = REAL_PIECES.flatMap(P => P.cells.flatMap(c => c.legs.map(l => Math.abs(l[2] - l[1]))));
  assert.ok(legs.filter(v => v < 16).length >= 20, 'and they are there, the real short legs');
});

test('real strokes: out of the paint slowly on its two ways only, the elbow from the paint to +22° at 3°/s, before the elbow up and the shoulder back', () => {
  const slow = n => blocks14(n).filter(b => b.kind === 'joint' && b.joint === 'elbow');
  for (const n of [1, 2, 3, 7, 8, 9, 13, 14, 17, 18]) assert.equal(slow(n).length, 0, `${n}: as today`);
  for (const n of [4, 5, 6, 10, 11, 12, 15, 16, 19, 20]) {
    const dips = blocks14(n).filter(b => b.kind === 'joint' && b.rim !== undefined).length;
    assert.equal(slow(n).length, dips, `${n}: every dip`);
    for (const b of slow(n)) { assert.deepEqual([b.deg, b.speed, b.fork], [22, 3, [21, 23]]); assert.equal(b.dip, true); }
    const b = blocks14(n), i = b.findIndex(q => q.kind === 'joint' && q.joint === 'elbow');
    assert.deepEqual([b[i - 2].fork, b[i - 1].kind, b[i + 1].fork, b[i + 2].joint, b[i + 2].deg], [cup.paint, 'wait', cup.up, 'shoulder', 0], 'in the paint, its wait, out slowly, up, back');
  }
});

test('real strokes: landing inside the leg, back to its start, then along it, on its two ways only', () => {
  // the way's first piece of a run with a dip is that much longer, the same legs after it
  const line = n => blocks14(n).filter(b => b.paintMM > 0).reduce((t, b) => t + b.paintMM, 0);
  for (const [today, inside] of [[1, 7], [2, 8], [3, 9], [13, 17], [14, 18], [4, 10], [5, 11], [6, 12], [15, 19], [16, 20]]) {
    const added = line(inside) - line(today), dips = blocks14(today).filter(b => b.kind === 'joint' && b.rim !== undefined).length;
    assert.ok(added > 0 && added <= 2 * 16 * dips + 1e-6 + 16 * dips, `${today}/${inside}: ${added} mm more over ${dips} dips`);
  }
  assert.equal(line(4), line(1)); assert.equal(line(5), line(2));
  const first = blocks14(9).find(b => b.paintMM > 0), xs = first.cmds.filter(c => c[0] === 'L').map(c => +c.split(' ')[1]);
  assert.ok(xs[0] < xs[1] || xs[0] > xs[1], 'it moves');
  const dir = Math.sign(xs.at(-1) - xs.at(-2)), back = Math.sign(xs[1] - xs[0]);
  assert.notEqual(dir, back, 'back to its start first, then along');
});

test('real strokes: on a 20 × 20 canvas at X 0, Y 0, the carriage within the wall, every J within the cup\'s forks, 5 mm between columns', () => {
  assert.ok(P14.bounds.x0 >= 0, `the carriage's lowest X ${P14.bounds.x0}`);
  assert.ok(P14.bounds.y0 >= 10 && P14.bounds.y1 <= 190, `Y ${P14.bounds.y0} … ${P14.bounds.y1}`);
  for (const s of P14.strokes) for (const [a, b] of s.lines) for (const q of [a, b]) { assert.ok(q.x >= 18 && q.x <= 198, `${s.n}: X ${q.x}`); assert.ok(q.y >= 13 && q.y <= 187, `${s.n}: Y ${q.y}`); }
  for (const b of P14.blocks) if (b.fork) { const v = b.deg ?? +b.cmd.split(' ')[2]; assert.ok(v >= b.fork[0] && v <= b.fork[1]); }
  const ys = new Set(P14.strokes.flatMap(s => s.lines.filter(([a, b]) => a.y === b.y).map(([a]) => +((a.y - 13) % 46).toFixed(2))));
  for (const y of ys) assert.ok(Math.abs(y / 5 - Math.round(y / 5)) < 1e-6 && y <= 35, `column at ${y}`);
});

// ---------- real strokes 2: no. 9's way four times, the owner's canon, its two fixes ----------
const P15 = labPlan({ x0: 0, y0: 0, cup, sheet: 15 });
const rows15 = n => P15.remote.rows.map((r, i) => r.cells[0][0] === n ? i + 1 : 0).filter(Boolean);
const runs15 = n => rows15(n).map(row => { const b = P15.blocks.filter(q => q.row === row), pa = b.find(q => q.paintMM > 0); return { dip: b.some(q => q.kind === 'joint' && q.rim !== undefined), mm: pa.paintMM, cmds: pa.cmds }; });

test('real strokes 2: the same strokes four times over, 46 mm apart, two paints, a pause between, no way out of the paint but today\'s', () => {
  assert.equal(P15.strokes.length, 20);
  assert.equal(P15.remote.colours[0].name, 'LAB 4.0 · real strokes 2 · the first paint');
  assert.equal(P15.blocks.filter(b => b.kind === 'pause').length, 1);
  assert.equal(P15.blocks.filter(b => b.kind === 'joint' && b.joint === 'elbow').length, 0);
  assert.deepEqual(labSize(15), { h: 176, w: 200 });
  const moved = (n, k) => P15.strokes[n - 1].lines.map(([a, b]) => [a.x, a.y - 46 * k, b.x, b.y - 46 * k].map(v => +v.toFixed(2)));
  for (const [n, step, per] of [[1, 3, 0], [2, 3, 0], [3, 3, 0], [13, 2, 0], [14, 2, 0]]) for (let k = 1; k < 4; k++) assert.deepEqual(moved(n + k * step, k), moved(n, 0), `no. ${n}, copy ${k + 1}`);
});

test('real strokes 2: its long leg is no. 9 to the letter', () => {
  const one = (P, row) => P.blocks.filter(b => b.row === row && b.paintMM > 0).map(b => b.cmds);
  const r9 = P14.remote.rows.map((r, i) => r.cells[0][0] === 9 ? i + 1 : 0).filter(Boolean), shift = c => c.replace(/^L (\S+) (\S+)$/, (m, x, y) => `L ${x} ${(+y - 92).toFixed(2)}`);
  const r3 = rows15(3);
  assert.equal(r3.length, r9.length);
  r3.forEach((row, i) => assert.deepEqual(one(P15, row)[0].map(c => c), one(P14, r9[i])[0].map(shift), `run ${i + 1}`));
});

test('real strokes 2: a dip lands on no lone short leg; a leg that goes on what the brush holds does so within 79 mm of plan', () => {
  for (const n of [1, 2, 13, 14]) {
    let held = 0;
    const ls = runs15(n).filter((_, i) => true);
    for (let i = 0; i < ls.length; i++) {
      const r = ls[i], pressed = r.cmds.filter(c => c[0] === 'L').map(c => +c.split(' ')[1]);
      if (r.dip) { const first = Math.abs(pressed[1] - pressed[0]); held = 0; assert.ok(r.mm >= 24, `${n}, run ${i + 1}: a dip on ${r.mm.toFixed(0)} mm`); }
    }
  }
});

test('real strokes 2: the rope of short legs takes its own dip and lands inside its own line, back along it to its start', () => {
  const rope = runs15(1).find(r => r.mm > 90 && r.dip);
  assert.ok(rope, 'its own dip');
  const ys = rope.cmds.filter(c => c[0] === 'L').map(c => +c.split(' ')[2]);
  assert.ok(ys[0] > ys[2] || ys[1] > ys[3], 'it goes back across first');
  assert.ok(ys.at(-1) > ys[0], 'and on to its far end');
});

test('real strokes 2: the carriage within the wall, on the 20 × 20', () => {
  assert.ok(P15.bounds.x0 >= 0 && P15.bounds.y0 >= 10 && P15.bounds.y1 <= 190, JSON.stringify(P15.bounds));
});


// ---------- real 3: the red 911's piece round its left headlight, every jar of it, by the canon as OPM-G runs ----------
import { REAL3 } from '../src/labreal3.js';
import { seqOf, passesOf, canonRuns } from '../src/formgplan.js';
const P16 = labPlan({ x0: 0, y0: 0, cup, sheet: 16 }), P17 = labPlan({ x0: 0, y0: 0, cup, sheet: 17 });

test('real 3: a number a jar, in FORM-G\'s list, the first layer on 16, the jars of two coats again on 17; a pause before every jar but the first', () => {
  const list = seqOf(REAL3.pic);
  assert.deepEqual(P16.strokes.map(q => q.hue), list.filter(j => j.layer === 1).map(j => j.hex));
  assert.deepEqual(P17.strokes.map(q => q.hue), list.filter(j => j.layer === 2).map(j => j.hex));
  assert.equal(P17.strokes.length, REAL3.pic.jars.filter(j => j.coats === 2).length);
  for (const P of [P16, P17]) {
    assert.equal(P.blocks.filter(b => b.kind === 'pause').length, P.strokes.length - 1);
    assert.equal(P.remote.colours.length, P.strokes.length);
    P.remote.rows.forEach(r => assert.equal(P.remote.colours[r.c].hex, P.strokes[r.cells[0][0] - 1].hue));
  }
  assert.deepEqual(labSize(16), { h: 176, w: 200 });
});

test('real 3: nothing of LAB\'s own: its runs are formgplan.js\'s canon runs of the piece, the same dips, at the picture\'s own size', () => {
  const passes = passesOf(REAL3.pic, { canon: true }), runs = canonRuns(passes), list = seqOf(REAL3.pic);
  const first = runs.filter(r => list[r.pass].layer === 1);
  assert.equal(P16.remote.rows.length, first.length);
  const dips = P16.blocks.filter(b => b.kind === 'joint' && b.rim !== undefined).length;
  assert.equal(dips, first.filter(r => r.dip).length);
  // every leg as long as in the picture: the pressed pieces along X keep their lengths
  const len = rs => rs.filter(r => !r.idle).flatMap(r => r.pts.slice(1).map((q, i) => Math.abs(q[1] - r.pts[i][1])).filter(v => v > 1)).sort((a, b) => a - b);
  const lab = P16.strokes.flatMap(q => q.lines.map(([a, b]) => Math.abs(b.x - a.x)).filter(v => v > 1)).sort((a, b) => a - b);
  assert.deepEqual(lab.map(v => +v.toFixed(2)), len(first).map(v => +v.toFixed(2)));
});

test('real 3: on the 20 × 20 at X 0, Y 0, as real 2: the carriage within the wall', () => {
  for (const P of [P16, P17]) assert.ok(P.bounds.x0 >= 0 && P.bounds.x1 <= 200 && P.bounds.y0 >= 10 && P.bounds.y1 <= 190, JSON.stringify(P.bounds));
});
