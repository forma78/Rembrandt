import test from 'node:test';
import assert from 'node:assert/strict';
import { xyPlan, plotPaths, PATTERNS, PASSES, waved, tipY, LIFT_DEG, DRAG_MM } from '../src/strokes.js';

const PLOTTER = { tilt: 0 };   // the plotter's own path, the broom aside

test('A and B fit the 30 × 30 board inside its margins', () => {
  for (const k of ['A', 'B']) {
    const p = xyPlan({ ...PATTERNS[k] });
    assert.ok(p.fits, `${k}: ${p.width} × ${p.height} in ${p.room.w} × ${p.room.h}`);
    // the carriage's path; the wrist's drags reach past it (the preview draws them)
    for (const c of p.blocks.filter(b => b.kind === 'move').flatMap(b => b.cmds).filter(c => /^[LAM]/.test(c))) {
      const [x, y] = c.split(' ').slice(-2 - (c[0] === 'A')).map(Number);
      assert.ok(Math.abs(x) <= p.room.h / 2 + 1e-6 && Math.abs(y) <= p.room.w / 2 + 1e-6, `${k}: ${c}`);
    }
  }
});

test('a row is a hairpin of the plotter: a line out, a half circle round on the right, a line back', () => {
  const p = xyPlan({ ...PATTERNS.B, here: { x: 400, y: 280 }, pause: false, ...PLOTTER });
  const row = p.blocks.filter(b => b.row === 1);
  assert.deepEqual(row.map(b => b.kind === 'arm' ? b.cmd : b.cmds[1].split(' ')[0]), ['M', 'J 3 0', 'L', 'J 3 -54']);
  const paint = row[2].cmds;
  const x = 400 + p.height / 2, left = 280 - p.width / 2, right = left + 220;
  assert.equal(paint[1], `L ${x.toFixed(2)} ${right.toFixed(2)}`);
  const arc = paint.find(c => c.startsWith('A '));
  assert.equal(arc, `A ${(x - 10).toFixed(2)} ${right.toFixed(2)} ${(x - 20).toFixed(2)} ${right.toFixed(2)} 1`, '+1: from +X to +Y, the turn bulges to the right');
  assert.equal(paint.at(-2), `L ${(x - 20).toFixed(2)} ${left.toFixed(2)}`);
  assert.ok(paint.every(c => /^[FLAG]/.test(c)), 'only speeds, lines, arcs and go: the runner sends them as they are');
  assert.equal(p.blocks.at(-1).cmds[1], 'M 0.10 0.10', 'home at the end, where home is set, as a job ends');
  assert.ok(p.blocks.at(-1).home && p.blocks.at(-2).cmd === 'J 3 -54', 'the brush off before it goes');
});

test('the tight turn of A is slowed to what the arc allows, and back', () => {
  const p = xyPlan({ ...PATTERNS.A, speed: 60, ...PLOTTER });
  const cmds = p.blocks.find(b => b.row === 1 && b.paintMM).cmds;
  const i = cmds.findIndex(c => c.startsWith('A '));
  assert.ok(+cmds[i - 1].split(' ')[1] < 60 && cmds[i + 1] === 'F 60', cmds.join(' | '));
});

test('a pause for paint after every row but the last; too many rows do not fit', () => {
  assert.equal(xyPlan({ ...PATTERNS.A }).blocks.filter(b => b.kind === 'pause').length, PATTERNS.A.rows - 1);
  assert.ok(!xyPlan({ rows: 12, pitch: 25 }).fits);
});

test('the box the brush covers, from Here: for the walls check', () => {
  const p = xyPlan({ ...PATTERNS.A });
  assert.ok(Math.abs(p.box.x1 - p.height / 2) < 1e-9 && Math.abs(p.box.x0 + p.height / 2) < 1e-9);
  assert.ok(Math.abs(p.box.y0 + p.width / 2) < 1e-9 && Math.abs(p.box.y1 - p.width / 2) < 1e-9);
  const big = xyPlan({ rows: 11, pitch: 25 });
  assert.ok(!big.fits && big.blocks.length > 0, 'past the margins still makes a plan');
});

test('C, the snake: one path, the brush down once, the turns round on the right and on the left by turns', () => {
  const p = xyPlan({ ...PATTERNS.C, here: { x: 400, y: 280 }, ...PLOTTER });
  assert.ok(p.fits, `${p.width} × ${p.height} in ${p.room.w} × ${p.room.h}`);
  assert.equal(p.blocks.filter(b => b.cmd === 'J 3 0').length, 1, 'the brush goes down once');
  assert.equal(p.blocks.filter(b => b.kind === 'pause').length, 0, 'no pause in a continuous line');
  const cmds = p.blocks.find(b => b.paintMM).cmds;
  const arcs = cmds.filter(c => c.startsWith('A '));
  assert.equal(arcs.length, PATTERNS.C.rows - 1);
  assert.deepEqual(arcs.map(a => a.split(' ').at(-1)), arcs.map((_, i) => i % 2 ? '-1' : '1'));
  const lines = cmds.filter(c => c.startsWith('L '));
  assert.equal(lines.length, PATTERNS.C.rows);
  assert.equal(lines[0].split(' ')[2], (280 + 110).toFixed(2), 'row 1 ends on the right');
  assert.equal(lines[1].split(' ')[2], (280 - 110).toFixed(2), 'row 2 ends on the left');
  assert.equal(p.blocks.find(b => b.paintMM).painted.length, 2 * PATTERNS.C.rows - 1);
  for (const q of p.preview[0]) assert.ok(q.y >= p.box.y0 - DRAG_MM - 1e-9 && q.y <= p.box.y1 + DRAG_MM + 1e-9 && q.x >= p.box.x0 - 1e-9 && q.x <= p.box.x1 + 1e-9,
    'the brush within the box but for the wrist\'s drags along Y');
});

test('the board: width and height apart — 400 × 600 holds a snake 26 rows long, 300 × 300 does not', () => {
  const tall = xyPlan({ ...PATTERNS.C, rows: 26, boardW: 400, boardH: 600 });
  assert.ok(tall.fits, `${tall.width} × ${tall.height} in ${tall.room.w} × ${tall.room.h}`);
  assert.ok(!xyPlan({ ...PATTERNS.C, rows: 26 }).fits);
  assert.deepEqual(xyPlan({ board: 400 }).room, { w: 340, h: 340 }, 'a size saved before still reads');
});

// the direction where a piece starts and where it ends
const dirs = g => {
  if (g.t === 'L') { const l = Math.hypot(g.b.x - g.a.x, g.b.y - g.a.y); const u = { x: (g.b.x - g.a.x) / l, y: (g.b.y - g.a.y) / l }; return [u, u]; }
  const t = q => ({ x: -g.d * (q.y - g.c.y) / g.r, y: g.d * (q.x - g.c.x) / g.r });
  return [t(g.a), t(g.b)];
};
test('a bowed row: an arc whose middle lies bow mm lower; the snake stays smooth at every joint, no kink to stop at', () => {
  for (const o of [{ ...PATTERNS.C, bow: 25 }, { ...PATTERNS.C, bow: -25 }, { ...PATTERNS.A, bow: 30 }, { ...PATTERNS.C, bow: 0 },
    { ...PATTERNS.C, bow: 36, length: 255, pitch: 10, rows: 15 }]) {
    for (const p of plotPaths(o)) {
      for (let i = 0; i < p.length; i++) {
        const g = p[i];
        if (g.t === 'A') for (const q of [g.a, g.b]) assert.ok(Math.abs(Math.hypot(q.x - g.c.x, q.y - g.c.y) - g.r) < 1e-6, 'an arc ends on its circle');
        if (!i) continue;
        const prev = p[i - 1], e = dirs(prev)[1], s = dirs(g)[0];
        assert.ok(Math.hypot(prev.b.x - g.a.x, prev.b.y - g.a.y) < 1e-6, 'joined');
        assert.ok(e.x * s.x + e.y * s.y > Math.cos(Math.PI / 180), `bow ${o.bow}: a kink of ${(Math.acos(Math.min(1, e.x * s.x + e.y * s.y)) * 180 / Math.PI).toFixed(1)}° at piece ${i}`);
      }
    }
  }
  const first = plotPaths({ ...PATTERNS.C, bow: 25 })[0][0];
  assert.equal(first.t, 'A');
  const lowest = first.c.x - first.r;                      // the bottom of its circle: the middle of the row
  assert.ok(Math.abs(first.a.x - lowest - 25) < 1e-6, 'the middle 25 mm below the ends');
  const plan = xyPlan({ ...PATTERNS.C, bow: 25, boardW: 400, boardH: 600 });
  assert.ok(plan.fits && plan.height > xyPlan({ ...PATTERNS.C, boardW: 400, boardH: 600 }).height, 'a bow makes it taller');
});

// ---------- the wrist (the owner, 2026-10-02, test_results/: the 15-row snake) ----------
const J = p => p.blocks.filter(b => b.kind === 'arm').map(b => b.cmd);

test('the broom: the wrist +45° through a turn on the right, −45° on the left, upright along the rows; down from −54° once', () => {
  const p = xyPlan({ ...PATTERNS.C, rows: 15, pitch: 10, length: 255, bow: 36 });
  const turns = Array.from({ length: 14 }, (_, k) => [k % 2 ? 'J 3 -45' : 'J 3 45', 'J 3 0']).flat();
  assert.deepEqual(J(p), ['J 3 -54', 'J 3 0', ...turns, 'J 3 -54']);
  assert.equal(p.turns, 14);
  assert.equal(p.lifts, 14, 'at 45° the brush is off the board through every turn');
  const moves = p.blocks.filter(b => b.kind === 'move' && b.lengthMM);
  assert.equal(moves.length, 29, '15 rows and 14 turns, a move each');
  for (const [i, b] of moves.entries()) {
    const pieces = b.cmds.filter(c => /^[LA]/.test(c));
    assert.ok(i % 2 ? pieces.some(c => c[0] === 'A') && b.paintMM === 0 : pieces.length === 1 && b.paintMM > 0, `move ${i}: ${pieces.join(' | ')}`);
  }
  assert.equal(p.blocks.filter(b => b.kind === 'pause').length, 0, 'no pause in a continuous line');
});

test('the broom in A and B: the hairpin\'s turn on the right at +45°, then the row back upright, then the hook', () => {
  const p = xyPlan({ ...PATTERNS.B, pause: false });
  assert.deepEqual(J(p), ['J 3 -54', ...Array.from({ length: PATTERNS.B.rows }, () => ['J 3 0', 'J 3 45', 'J 3 0', 'J 3 -54']).flat()]);
});

test('tilt 0: no broom, the snake one move as before', () => {
  const p = xyPlan({ ...PATTERNS.C, tilt: 0 });
  assert.deepEqual(J(p), ['J 3 -54', 'J 3 0', 'J 3 -54']);
  assert.equal(p.blocks.filter(b => b.paintMM).length, 1);
});

test('the wrist never past the reach of rembrandt.py: −90…+45°', () => {
  for (const k of ['A', 'B', 'C']) for (const c of J(xyPlan({ ...PATTERNS[k] }))) {
    const d = +c.split(' ')[2];
    assert.ok(d >= -90 && d <= 45, c);
  }
});

// ---------- what the brush paints: the wrist drags it along Y (2026-10-02) ----------
const near = (q, x, y, mm = 1e-6) => Math.hypot(q.x - x, q.y - y) < mm;
test('the wrist\'s drag: 50 mm between touching the board at ±45° and upright, along Y, plus to the right', () => {
  assert.equal(LIFT_DEG, 45);
  assert.ok(Math.abs(tipY(45) - DRAG_MM) < 1e-9 && Math.abs(tipY(-45) + DRAG_MM) < 1e-9 && tipY(0) === 0);
  assert.ok(Math.abs(tipY(15) - 18.3) < 0.05, `${tipY(15)}`);
});

test('the snake upright: one stroke, the landing drag 50 mm before the first row, the hook back over the last', () => {
  const p = xyPlan({ ...PATTERNS.C, tilt: 0 }), row = plotPaths({ ...PATTERNS.C, tilt: 0 })[0], k = p.preview[0];
  assert.equal(p.preview.length, 1);
  const mid = { x: k[1].x - row[0].a.x, y: k[1].y - row[0].a.y };   // the plan centred on Here
  assert.ok(near(k[0], row[0].a.x + mid.x, row[0].a.y + mid.y - 50), 'touches 50 mm left of the start');
  assert.ok(near(k[1], row[0].a.x + mid.x, row[0].a.y + mid.y), 'and drags to it');
  const end = row.at(-1).b;
  assert.ok(near(k.at(-1), end.x + mid.x, end.y + mid.y - 50), 'the last row ends on the left: the hook 50 mm further left');
});

test('the broom at 15°: the brush stays on the board, the turn painted 18 mm out past the carriage\'s', () => {
  const p = xyPlan({ ...PATTERNS.C, tilt: 15 });
  assert.equal(p.preview.length, 1, 'never off the board');
  assert.equal(p.lifts, 0);
  const plain = xyPlan({ ...PATTERNS.C, tilt: 0 });
  const far = l => Math.max(...l.map(q => q.y));
  assert.ok(Math.abs(far(p.preview[0]) - far(plain.preview[0]) - tipY(15)) < 0.1);
});

test('the broom at 45°: a stroke a row, each 50 mm longer at either end — the lift and the landing drag along Y', () => {
  const p = xyPlan({ ...PATTERNS.C, rows: 4 }), rows = plotPaths({ ...PATTERNS.C, rows: 4 })[0].filter(g => !g.tilt);
  assert.equal(p.preview.length, 4);
  const dy = p.preview[0][1].y - rows[0].a.y, dx = p.preview[0][1].x - rows[0].a.x;
  p.preview.forEach((k, i) => {
    const s = Math.sign(rows[i].b.y - rows[i].a.y);
    assert.ok(near(k[0], rows[i].a.x + dx, rows[i].a.y + dy - 50 * s), `row ${i + 1}: lands 50 mm before its start`);
    assert.ok(near(k.at(-1), rows[i].b.x + dx, rows[i].b.y + dy + 50 * s), `row ${i + 1}: lifts 50 mm past its end`);
  });
});

// ---------- waves and pattern D (the owner, 2026-10-02) ----------
const kinks = p => p.slice(1).map((g, i) => {
  const e = dirs(p[i])[1], s0 = dirs(g)[0];
  return { gap: Math.hypot(p[i].b.x - g.a.x, p[i].b.y - g.a.y), deg: Math.acos(Math.min(1, e.x * s0.x + e.y * s0.y)) * 180 / Math.PI };
});
test('a wave is lines and arcs, joined without a kink, its ends where the row\'s are, as far out as asked', () => {
  for (const base of [{ t: 'L', a: { x: 0, y: -110 }, b: { x: 0, y: 110 } }, plotPaths({ ...PATTERNS.C, bow: 36, length: 255, wave: 0 })[0][0]]) {
    const w = waved(base, 12, 100);
    assert.ok(w.every(g => g.t === 'L' || g.t === 'A'));
    for (const k of kinks(w)) assert.ok(k.gap < 1e-6 && k.deg < 0.5, `gap ${k.gap}, kink ${k.deg.toFixed(2)}°`);
    assert.ok(Math.hypot(w[0].a.x - base.a.x, w[0].a.y - base.a.y) < 1e-9 && Math.hypot(w.at(-1).b.x - base.b.x, w.at(-1).b.y - base.b.y) < 1e-9);
  }
  // across a straight row: the sine itself, within a tenth of a mm, 12 mm out at its crests
  const w = waved({ t: 'L', a: { x: 0, y: -110 }, b: { x: 0, y: 110 } }, 12, 100), m = Math.round(2 * 220 / 100);
  let worst = 0, far = 0;
  for (const g of w) for (const q of [g.a, g.b]) {
    worst = Math.max(worst, Math.abs(-q.x - 12 * Math.sin(Math.PI * m * (q.y + 110) / 220)));
    far = Math.max(far, Math.abs(q.x));
  }
  assert.ok(worst < 0.1, `off the sine by ${worst}`);
  assert.ok(Math.abs(far - 12) < 0.5, `${far} out`);
});

test('a wavy snake stays smooth at every joint, the turns too', () => {
  for (const o of [{ ...PATTERNS.C, wave: 10 }, { ...PATTERNS.C, wave: 20, bow: 30 }, { ...PATTERNS.A, wave: 8 }]) {
    for (const p of plotPaths(o)) for (const k of kinks(p)) assert.ok(k.gap < 1e-6 && k.deg < 1, `wave ${o.wave}: a kink of ${k.deg.toFixed(2)}°`);
  }
  assert.deepEqual(xyPlan({ ...PATTERNS.C, wave: 0 }).blocks, xyPlan({ ...PATTERNS.C }).blocks, 'no wave: C exactly as before');
});

test('D: each pass is C\'s snake turned its own way; the passes on run in their order, a pause for the paint between', () => {
  const o = { ...PATTERNS.C, pattern: 'D', snake: true, rows: 6, pitch: 15 };
  const d1 = xyPlan({ ...o, passes: ['D1'], tilt: 0 });
  const rows = d1.blocks.filter(b => b.paintMM).flatMap(b => b.cmds.filter(c => c[0] === 'L' || c[0] === 'A'));
  const first = rows[0].split(' ');
  assert.equal(first[0], 'L', 'C straight: a line');
  const start = d1.blocks.find(b => b.cmds?.[1]?.startsWith('M ')).cmds[1].split(' ');
  assert.equal(first[2], start[2], 'D1 turns C a quarter: its rows run up and down, Y the same at both ends');
  assert.ok(Math.abs(+first[1] - +start[1]) > 100, 'and X changes the length of a row');
  assert.deepEqual(d1.passes, ['D1']);
  assert.ok(d1.preview.every(l => l.pass === 'D1'));

  const all = xyPlan({ ...o, passes: ['D3', 'D1'] });
  assert.deepEqual(all.passes, ['D1', 'D3'], 'in their order, not the clicks\'');
  const pauses = all.blocks.filter(b => b.kind === 'pause');
  assert.equal(pauses.length, 1);
  assert.match(pauses[0].why, /D3, dark grey/);
  assert.deepEqual([...new Set(all.preview.map(l => l.pass))], ['D1', 'D3']);
  assert.equal(J(all).filter(c => c === 'J 3 0').length, 2 * (1 + (o.rows - 1)), 'each pass: down once, and back down after each lifted turn');

  // the same sliders for every pass: the same rows and length, only turned
  const len = p => p.blocks.filter(b => b.paintMM).reduce((a, b) => a + b.paintMM, 0);
  const one = k => xyPlan({ ...o, passes: [k] });
  assert.ok(Math.abs(len(one('D1')) - len(one('D2'))) < 1e-6 && Math.abs(len(one('D2')) - len(one('D3'))) < 1e-6);
  assert.deepEqual(Object.keys(PASSES), ['D1', 'D2', 'D3']);
});

test('A, B and C are not turned, whatever passes D had', () => {
  assert.deepEqual(xyPlan({ ...PATTERNS.C, pattern: 'C', passes: ['D2'] }).blocks, xyPlan({ ...PATTERNS.C }).blocks);
});

test('D: every turn lifts the brush, a row up and down the board too, and each pass lies where its shift puts it', () => {
  const o = { pattern: 'D', snake: true, rows: 10, pitch: 15, bow: 0, boardW: 300, boardH: 400 };
  for (const k of Object.keys(PASSES)) assert.equal(xyPlan({ ...o, passes: [k] }).lifts, 9, `${k}: 9 turns, 9 lifts`);
  const at = xyPlan({ ...o, passes: ['D1'] }), moved = xyPlan({ ...o, passes: ['D1'], shift: { D1: { x: 40, y: -30 } } });
  const ends = p => p.blocks.filter(b => b.kind === 'move').flatMap(b => b.cmds.filter(c => /^[LM]/.test(c))).map(c => c.split(' ').slice(1).map(Number));
  const a = ends(at), b = ends(moved);
  for (let i = 0; i < a.length - 1; i++) assert.ok(Math.abs(b[i][0] - a[i][0] - 40) < 0.011 && Math.abs(b[i][1] - a[i][1] + 30) < 0.011, `point ${i}`);
  assert.ok(Math.abs(moved.box.x0 - at.box.x0 - 40) < 1e-9 && Math.abs(moved.box.y1 - at.box.y1 + 30) < 1e-9, 'the box moves with it');
  assert.deepEqual(b.at(-1), a.at(-1), 'and the carriage goes home all the same');
  const two = xyPlan({ ...o, passes: ['D1', 'D3'], shift: { D1: { y: -60 }, D3: { y: 60 } } });
  assert.ok(two.width > at.width + 100, 'two passes apart: the box holds both');
});

test('D: a pass turned ±90° more from its own angle; D1 turned back −90° is C itself', () => {
  const o = { ...PATTERNS.C, pitch: 15, rows: 6, bow: 20 };
  const back = xyPlan({ ...o, pattern: 'D', passes: ['D1'], shift: { D1: { a: -90 } } });
  assert.deepEqual(back.blocks, xyPlan({ ...o, pattern: 'C' }).blocks);
  const d3 = xyPlan({ ...o, pattern: 'D', passes: ['D3'] }), more = xyPlan({ ...o, pattern: 'D', passes: ['D3'], shift: { D3: { a: 30 } } });
  assert.notDeepEqual(d3.blocks, more.blocks);
  const len = p => p.blocks.filter(b => b.paintMM).reduce((a, b) => a + b.paintMM, 0);
  assert.ok(Math.abs(len(d3) - len(more)) < 1e-6, 'turned, not changed');
});
