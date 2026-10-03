import test from 'node:test';
import assert from 'node:assert/strict';
import { xyPlan, plotPaths, PATTERNS, PASSES, waved, WRIST_MAX, ELBOW_LIFT, ELBOW_UP } from '../src/strokes.js';

const PLOTTER = { lift: false };   // the plotter's own path, the brush not lifted at the turns

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

test('a row is a hairpin of the plotter: a line out, a half circle round on the right, a line back — one move, the brush landing and lifting on it', () => {
  const p = xyPlan({ ...PATTERNS.B, here: { x: 400, y: 280 }, pause: false, ...PLOTTER });
  const row = p.blocks.filter(b => b.row === 1);
  assert.deepEqual(row.map(b => b.kind === 'arm' ? b.cmd : b.cmds[1].split(' ')[0]), ['M', 'W', 'J 2 25'], 'travel, one move that starts with the elbow, the brush up');
  const paint = row[1].cmds;
  const x = 400 + p.height / 2, left = 280 - p.width / 2, right = left + 220;
  assert.ok(paint.includes(`L ${x.toFixed(2)} ${right.toFixed(2)}`), 'the line out, upright to its end');
  assert.ok(paint.includes(`A ${(x - 10).toFixed(2)} ${right.toFixed(2)} ${(x - 20).toFixed(2)} ${right.toFixed(2)} 1`), '+1: from +X to +Y, the turn bulges to the right');
  assert.ok(paint.every(c => /^[FLAGW]/.test(c)), 'only speeds, the wrist, lines, arcs and go: the runner sends them as they are');
  assert.equal(row[1].painted.length, paint.filter(c => /^[LA]/.test(c)).length, 'a mark for every piece');
  assert.equal(p.blocks.at(-1).cmds[1], 'M 0.10 0.10', 'home at the end, where home is set, as a job ends');
  assert.ok(p.blocks.at(-1).home && p.blocks.at(-2).cmd === 'J 2 25', 'the brush up before it goes');
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

const radius = c => { const q = c.split(' ').slice(1).map(Number); return Math.hypot(q[2] - q[0], q[3] - q[1]); };
test('C, the snake: one move, the brush landing once on it, the turns round on the right and on the left by turns', () => {
  const p = xyPlan({ ...PATTERNS.C, here: { x: 400, y: 280 }, ...PLOTTER });
  assert.ok(p.fits, `${p.width} × ${p.height} in ${p.room.w} × ${p.room.h}`);
  const moves = p.blocks.filter(b => b.paintMM);
  assert.equal(moves.length, 1, 'one move: the carriage never stops');
  assert.deepEqual(J(p), ['J 2 25', 'J 3 0', 'J 2 25'], 'up, the wrist to the active pose; then no J 2 0: the brush lands on the move, by W');
  assert.equal(p.blocks.filter(b => b.kind === 'pause').length, 0, 'no pause in a continuous line');
  const cmds = moves[0].cmds;
  const turns = cmds.filter(c => c.startsWith('A ') && Math.abs(radius(c) - PATTERNS.C.pitch / 2) < 0.01);
  assert.equal(turns.length, PATTERNS.C.rows - 1);
  assert.deepEqual(turns.map(a => a.split(' ').at(-1)), turns.map((_, i) => i % 2 ? '-1' : '1'));
  const x = 400 + p.height / 2;
  assert.ok(cmds.includes(`L ${x.toFixed(2)} ${(280 + 110).toFixed(2)}`), 'row 1 ends on the right');
  assert.ok(cmds.includes(`L ${(x - 20).toFixed(2)} ${(280 - 110).toFixed(2)}`), 'row 2 ends on the left');
  assert.equal(moves[0].painted.length, cmds.filter(c => /^[LA]/.test(c)).length);
  for (const q of p.preview[0]) assert.ok(q.y >= p.box.y0 - 0.01 && q.y <= p.box.y1 + 0.01 && q.x >= p.box.x0 - 0.01 && q.x <= p.box.x1 + 0.01,
    'the tip keeps to the path: nothing painted past it');
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

// ---------- the elbow (the new arm, the owner, 2026-10-02) ----------
const J = p => p.blocks.filter(b => b.kind === 'arm').map(b => b.cmd);
const Ws = b => b.cmds.filter(c => c[0] === 'W').map(c => { const q = c.split(' '); assert.equal(q[1], '2', `${c}: the elbow`); return +q[2]; });
test('the elbow on the move: pressed along the rows, eased off to +15° at their ends, up to +25° through the turns', () => {
  const p = xyPlan({ ...PATTERNS.C, rows: 15, pitch: 10, length: 255, bow: 36 });
  assert.deepEqual(J(p), ['J 2 25', 'J 3 0', 'J 2 25'], 'up, the wrist at 0, and up at the end — nothing else stops the carriage');
  assert.equal(p.turns, 14);
  const w = Ws(p.blocks.find(b => b.paintMM));
  assert.equal(w.filter(d => d === ELBOW_UP).length, 14, 'up once a turn');
  const ups = w.flatMap((d, i) => d === ELBOW_UP ? [i] : []);
  for (const i of ups) assert.deepEqual([w[i - 1], w[i + 1]], [ELBOW_LIFT, ELBOW_LIFT], 'off the canvas into the turn, down to touching out of it');
  for (let k = 0; k <= ups.length; k++) assert.ok(w.slice(k ? ups[k - 1] : 0, ups[k] ?? w.length).includes(0), `row ${k + 1}: pressed`);
  assert.equal(w.at(-1), ELBOW_LIFT, 'the last row eased off; the J 2 25 after it lifts it');
  assert.ok(w.every(d => d >= 0 && d <= ELBOW_UP));
  assert.equal(p.blocks.filter(b => b.kind === 'pause').length, 0, 'no pause in a continuous line');
});

test('A and B on the move: each hairpin lands, eases off into its turn, goes up, lands again and eases off at its end', () => {
  const p = xyPlan({ ...PATTERNS.B, pause: false });
  assert.deepEqual(J(p), ['J 2 25', 'J 3 0', ...Array(PATTERNS.B.rows).fill('J 2 25')]);
  const moves = p.blocks.filter(b => b.paintMM);
  assert.equal(moves.length, PATTERNS.B.rows);
  for (const b of moves) assert.equal(Ws(b).filter(d => d === ELBOW_UP).length, 1);
});

test('Lift at the turns off: the snake is one stroke, the brush pressed through every turn', () => {
  const p = xyPlan({ ...PATTERNS.C, lift: false });
  assert.equal(p.turns, 0);
  const w = Ws(p.blocks.find(b => b.paintMM));
  assert.ok(w[0] < ELBOW_LIFT && w.includes(0) && w.at(-1) === ELBOW_LIFT && !w.includes(ELBOW_UP), w.join(' '));
});

test('the elbow never past the reach of rembrandt.py: −5…+45°', () => {
  for (const k of ['A', 'B', 'C']) {
    const p = xyPlan({ ...PATTERNS[k] });
    for (const d of [...J(p).filter(c => c.startsWith('J 2')).map(c => +c.split(' ')[2]), ...p.blocks.filter(b => b.paintMM).flatMap(Ws)]) assert.ok(d >= -5 && d <= 45, `${k}: ${d}`);
  }
});

const lengthOf = l => l.slice(1).reduce((a, q, i) => a + Math.hypot(q.x - l[i].x, q.y - l[i].y), 0);
test('the tip keeps to the row: the snake pressed throughout is one stroke, light at both ends, its whole length', () => {
  const p = xyPlan({ ...PATTERNS.C, lift: false }), k = p.preview[0];
  assert.equal(p.preview.length, 1);
  assert.ok(k[0].k < 0.05 && k.at(-1).k < 0.05 && Math.max(...k.map(q => q.k)) === 1, 'light where it lands and lifts, full between');
  const rows = PATTERNS.C.rows, full = rows * 220 + (rows - 1) * Math.PI * PATTERNS.C.pitch / 2;
  assert.ok(Math.abs(lengthOf(k) - full) < 5, `${lengthOf(k)} of ${full} mm: nothing past the ends`);
});

test('the turns in the air: a stroke a row, from its start to its end; the carriage where the tip is', () => {
  const p = xyPlan({ ...PATTERNS.C, rows: 4 });
  assert.equal(p.preview.length, 4);
  p.preview.forEach((k, i) => {
    assert.ok(k.every(q => Math.abs(q.x - k[0].x) < 1e-6), `row ${i + 1}: straight along Y`);
    const s = i % 2 ? -1 : 1;
    assert.ok(Math.abs(k[0].y + s * 110) <= 2 + 1e-6 && Math.abs(k.at(-1).y - s * 110) <= 2 + 1e-6, `row ${i + 1}: ${k[0].y} → ${k.at(-1).y}`);
  });
  for (const e of ['x0', 'x1', 'y0', 'y1']) assert.ok(Math.abs(p.carriage[e] - p.box[e]) < 0.01, `${e}: nothing aside`);
});

test('a tail the elbow keeps up with, the speeds within the board\'s', () => {
  const slow = xyPlan({ ...PATTERNS.C, speed: 30, tail: 100 }), fast = xyPlan({ ...PATTERNS.C, speed: 250, tail: 40 });
  assert.ok(slow.need < 10 && fast.need < WRIST_MAX, `${slow.need} · ${fast.need}`);
  for (const p of [slow, fast]) for (const c of p.blocks.find(b => b.paintMM).cmds.filter(c => c[0] === 'W')) {
    const v = +c.split(' ')[3];
    assert.ok(v >= 1 && v <= WRIST_MAX, c);
  }
  for (const c of fast.blocks.find(b => b.paintMM).cmds.filter(c => c[0] === 'F')) assert.ok(+c.split(' ')[1] <= 250, c);
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
  const k = d1.preview[0].slice(0, 50);
  assert.ok(k.every(q => Math.abs(q.y - k[0].y) < 1e-6), 'D1 turns C a quarter: its rows run up and down, Y the same along them');
  assert.ok(Math.abs(k.at(-1).x - k[0].x) > 90, 'and X changes the length of a row');
  assert.deepEqual(d1.passes, ['D1']);
  assert.ok(d1.preview.every(l => l.pass === 'D1'));

  const all = xyPlan({ ...o, passes: ['D3', 'D1'] });
  assert.deepEqual(all.passes, ['D1', 'D3'], 'in their order, not the clicks\'');
  const pauses = all.blocks.filter(b => b.kind === 'pause');
  assert.equal(pauses.length, 1);
  assert.match(pauses[0].why, /D3, dark grey/);
  assert.deepEqual([...new Set(all.preview.map(l => l.pass))], ['D1', 'D3']);
  assert.deepEqual(J(all), ['J 2 25', 'J 3 0', 'J 2 25', 'J 2 25'], 'each pass one move: the brush lands and lifts on it');
  assert.equal(all.blocks.filter(b => b.paintMM).length, 2);
  assert.equal(all.lifts, 2 * (o.rows - 1), 'every turn in the air');

  // the same sliders for every pass: the same rows and length, only turned — what the tip paints
  const len = p => p.preview.reduce((a, l) => a + lengthOf(l), 0);
  const one = k => xyPlan({ ...o, passes: [k] });
  assert.ok(Math.abs(len(one('D1')) - len(one('D2'))) < 1 && Math.abs(len(one('D2')) - len(one('D3'))) < 1, `${len(one('D1'))} ${len(one('D2'))} ${len(one('D3'))}`);
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
  assert.deepEqual(back.blocks.map(b => b.cmds ?? b.cmd), xyPlan({ ...o, pattern: 'C' }).blocks.map(b => b.cmds ?? b.cmd));
  const d3 = xyPlan({ ...o, pattern: 'D', passes: ['D3'] }), more = xyPlan({ ...o, pattern: 'D', passes: ['D3'], shift: { D3: { a: 30 } } });
  assert.notDeepEqual(d3.blocks, more.blocks);
  const len = p => p.preview.reduce((a, l) => a + lengthOf(l), 0);
  assert.ok(Math.abs(len(d3) - len(more)) < 1, 'turned, not changed: the tip paints as long');
});

// ---------- INK ON (the owner, 2026-10-03): a dip in the cup before every row ----------
const D1 = { pattern: 'D', ...PATTERNS.D, passes: ['D1'], rows: 14, pitch: 6.5, length: 330, bow: 20, wave: 5, speed: 200, travel: 225, tail: 80, lift: true, boardW: 500, boardH: 700 };
const HERE = { x: 450, y: 330 }, CUPAT = { x: 400, y: 20, rim: 35, dip: 5, dwell: 1 };
const endOf = c => { const q = c.split(' ').map(Number); return c[0] === 'A' ? { x: q[3], y: q[4] } : { x: q[1], y: q[2] }; };   // where an L or an A ends

test('INK ON, D1: fourteen dips, each before its row — to the cup, down into the paint, a second, up — then the row top to bottom, then back to the cup; home at the end', () => {
  const p = xyPlan({ ...D1, here: HERE, ink: true, cup: CUPAT });
  assert.equal(p.dips, 14);
  assert.equal(p.turns, 0, 'no snake: every row on its own');
  assert.equal(p.blocks.filter(b => b.kind === 'pause').length, 0);
  assert.deepEqual(J(p).slice(0, 2), ['J 2 35', 'J 3 0'], 'the brush over the rim before anything moves');
  const say = b => b.kind === 'move' ? (b.home ? 'home' : b.paintMM ? 'row' : b.cmds[1] === 'M 400.00 20.00' ? 'to the cup' : 'to the row') : b.kind === 'wait' ? `wait ${b.s}` : b.cmd;
  const row = ['to the cup', 'J 2 5', 'wait 1', 'J 2 35', 'to the row', 'J 2 25', 'row', 'J 2 35'];
  assert.deepEqual(p.blocks.slice(2).map(say), [...Array(14).fill(row).flat(), 'home']);
  for (const b of p.blocks.filter(q => q.paintMM)) {
    const pts = b.cmds.filter(c => /^[LA]/.test(c));
    assert.ok(endOf(pts.at(-1)).x < endOf(pts[0]).x - 250, `row ${b.row}: top to bottom`);
  }
  assert.deepEqual(p.blocks.filter(b => b.dip).map(b => b.row).filter((r, i, a) => a.indexOf(r) === i), [...Array(14)].map((_, i) => i + 1));
  assert.ok(p.carriage.y0 <= CUPAT.y - HERE.y, 'the walls check takes the cup in');
  assert.equal(p.air.length, 14 * 2 + 1, 'drawn: to the cup and to the row, fourteen times, and home');
});

test('INK ON keeps D1\'s rows where the snake had them, only all one way', () => {
  const snake = xyPlan({ ...D1, here: HERE }), ink = xyPlan({ ...D1, here: HERE, ink: true, cup: CUPAT });
  const tops = q => q.blocks.filter(b => b.paintMM).flatMap(b => b.cmds.filter(c => /^[LA]/.test(c)).map(c => endOf(c).y));
  const ys = a => [Math.min(...a), Math.max(...a)].map(v => Math.round(v));
  assert.deepEqual(ys(tops(ink)), ys(tops(snake)), 'the same width across');
  assert.ok(Math.abs(ink.length - snake.length) < 0.02 * snake.length, `${ink.length} against ${snake.length}: the same rows, the turns gone`);
});

test('INK OFF is the plan as it was, the cup or not', () => {
  for (const o of [D1, { ...PATTERNS.A }, { ...PATTERNS.C }]) {
    assert.deepEqual(xyPlan({ ...o, here: HERE, ink: false, cup: CUPAT }).blocks, xyPlan({ ...o, here: HERE }).blocks);
  }
});

test('INK ON without the cup taken: the rows one way, no dips — the page refuses PLAY', () => {
  const p = xyPlan({ ...D1, here: HERE, ink: true, cup: { ...CUPAT, x: null, y: null } });
  assert.equal(p.dips, 0);
  assert.equal(p.blocks.filter(b => b.kind === 'wait').length, 0);
});

test('INK ON, A: a dip before every hairpin, no pause for paint', () => {
  const p = xyPlan({ ...PATTERNS.A, here: HERE, ink: true, cup: CUPAT });
  assert.equal(p.dips, PATTERNS.A.rows);
  assert.equal(p.blocks.filter(b => b.kind === 'pause').length, 0);
});

test('D2 after D1 with INK ON: the pause asks for the paint in the cup', () => {
  const p = xyPlan({ ...D1, rows: 3, passes: ['D1', 'D2'], here: HERE, ink: true, cup: CUPAT });
  assert.deepEqual(p.blocks.filter(b => b.kind === 'pause').map(b => b.why), ['D2, red: its paint in the cup, then Continue']);
  assert.equal(p.dips, 6);
});

// ---------- the walls press the path (the owner, 2026-10-03: "remove this restriction") ----------
const allPoints = p => p.blocks.filter(b => b.kind === 'move').flatMap(b => b.cmds.filter(c => /^[LMA]/.test(c)).map(endOf));
test('D1 2 mm past the bottom wall: pressed along it, every elbow command kept, nothing past the walls', () => {
  const o = { ...D1, rows: 14 }, at = xyPlan({ ...o, here: { x: 300, y: 300 } });
  const here = { x: 300 - (300 + at.carriage.x0) - 2, y: 300 };   // the lowest point 2 mm under the bottom wall
  const p = xyPlan({ ...o, here });
  assert.ok(p.pastWall > 0 && p.pastWall < 100, `${p.pastWall} mm pressed: a few mm of every row's tail and turn, the rows steep to the wall`);
  assert.ok(allPoints(p).every(q => q.x >= 0 && q.y >= 0), 'the board gets nothing past a wall');
  const W = q => q.blocks.flatMap(b => b.cmds || []).filter(c => c[0] === 'W');
  assert.deepEqual(W(p), W(at), 'the elbow lands and lifts as before');
  assert.ok(Math.abs(p.length - at.length) < 5, `${p.length} against ${at.length}: the same paint, nearly`);
  assert.equal(p.gone, 0);
});

test('INK ON past the bottom wall too: the dips stay, the rows pressed', () => {
  const at = xyPlan({ ...D1, here: { x: 300, y: 300 } });
  const p = xyPlan({ ...D1, here: { x: 300 - (300 + at.carriage.x0) - 2, y: 300 }, ink: true, cup: CUPAT });
  assert.equal(p.dips, 14);
  assert.ok(allPoints(p).every(q => q.x >= 0 && q.y >= 0));
});

test('rows wholly past the bottom wall, across it, are pressed into points and left out; along a wall they run along it', () => {
  const o = { pattern: 'D', ...PATTERNS.D, passes: ['D1'], rows: 3, pitch: 10, length: 100, bow: 0, ink: true };
  const under = xyPlan({ ...o, here: { x: -200, y: 300 } });
  assert.equal(under.gone, 3, 'upright rows under the bottom wall');
  assert.equal(under.blocks.filter(b => b.paintMM).length, 0);
  const left = xyPlan({ ...o, here: { x: 300, y: -40 } });
  assert.equal(left.gone, 0, 'upright rows past the left wall lie along it');
  assert.ok(allPoints(left).every(q => q.y >= 0));
});
