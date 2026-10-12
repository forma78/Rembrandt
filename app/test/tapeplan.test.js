import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { planOf, family, piecesOf, dragRows, traceRows, shellOf, cassetteLines, flattenD, pathD, DEFAULTS, DEFAULT_CASS } from '../src/tapeplan.js';
import { plotRun, DEFAULTS as RUN_DEFAULTS, pieceLen, sweepOf } from '../src/strokes.js';
import { toMachine, LOOP_SHARE } from '../src/band.js';

// TAPE's plan: the tape wound round a cassette (the owner, 2026-10-12,
// TAPE-Claude/). The numbers of chat-Claude's approved prototype v0.3 are
// the acceptance: TAPE-Claude/reference/acceptance.json.
const ACC = JSON.parse(readFileSync(new URL('../../TAPE-Claude/reference/acceptance.json', import.meta.url)));
const SVG = readFileSync(new URL('../cassette_trace.svg', import.meta.url), 'utf8');
const ITEMS = [...SVG.matchAll(/<path id="([^"]*)" d="([^"]*)"/g)].map(m => ({ id: m[1], d: m[2] }));
const settingsOf = c => {
  const o = { ...DEFAULTS, cw: 200, ch: 200, keepDown: false };   // the prototype's runs, cut at the canvas's edges
  for (const [k, v] of Object.entries(c)) {
    if (k === 'format') o.cw = o.ch = v;
    else if (k === 'mode') o.mode = v === 'oneway' ? 'air' : v;
    else if (k !== 'view') o[k] = v;
  }
  return o;
};
const R1 = v => +v.toFixed(1);

test('the acceptance: every case of the prototype, its numbers to its rounding', () => {
  for (const [name, c] of Object.entries(ACC)) {
    const G = planOf(settingsOf(c.settings_changed_from_default));
    const got = { lanes_total: G.K, lanes_to_sides: G.kSide, lanes_to_top_bottom: G.kTop, runs: G.runs.length, segments: G.segs.length,
      paint_m: R1(G.paintLen / 1000), air_m: R1(G.airLen / 1000), lifts: G.lifts, machine_min: R1(G.tMachine / 60),
      lane_change_mm: R1(G.Lb), continuous_spiral: G.full, lane1_perimeter_mm: R1(G.P0), first_lane_R0_mm: R1(G.F.R0) };
    for (const k of Object.keys(got)) assert.equal(got[k], c[k], `${name}: ${k}`);
  }
});

test('lane 1 hugs the cassette, its rounded corner too; the lanes touch, one pitch apart all the way round', () => {
  const o = settingsOf({}), F = family(o), cb = F.cb, l1 = F.ring(0);
  assert.ok(Math.abs(l1.a - o.brush / 2 - cb.w / 2) < 1e-9 && Math.abs(l1.b - o.brush / 2 - cb.h / 2) < 1e-9, 'its inner edge on the shell');
  assert.ok(Math.abs(l1.r - o.brush / 2 - cb.r) < 1e-9, 'its inner corner the shell\'s 1.8 mm');
  for (let k = 0; k < 20; k++) {
    const a = F.ring(k), b = F.ring(k + 1);
    for (const q of ['a', 'b', 'r']) assert.ok(Math.abs(b[q] - a[q] - o.brush) < 1e-9, `lane ${k + 2}: ${q}`);
  }
});

// the distance from a point to a line or an arc, machine mm
function off(g, p) {
  if (g.t === 'L') {
    const dx = g.b.x - g.a.x, dy = g.b.y - g.a.y, L2 = dx * dx + dy * dy, t = L2 ? Math.max(0, Math.min(1, ((p.x - g.a.x) * dx + (p.y - g.a.y) * dy) / L2)) : 0;
    return Math.hypot(p.x - g.a.x - t * dx, p.y - g.a.y - t * dy);
  }
  const a0 = Math.atan2(g.a.y - g.c.y, g.a.x - g.c.x), th = Math.atan2(p.y - g.c.y, p.x - g.c.x), sw = sweepOf(g);
  let s = (th - a0) * g.d; while (s < 0) s += 2 * Math.PI; while (s > 2 * Math.PI) s -= 2 * Math.PI;
  if (s <= sw) return Math.abs(Math.hypot(p.x - g.c.x, p.y - g.c.y) - g.r);
  return Math.min(Math.hypot(p.x - g.a.x, p.y - g.a.y), Math.hypot(p.x - g.b.x, p.y - g.b.y));
}
const gapOf = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
function checkPieces(name, G) {
  G.segs.forEach((sg, n) => {
    const P = piecesOf(G, sg.i0, sg.i1);
    assert.ok(P.length, `${name}: segment ${n + 1} has pieces`);
    for (const g of P) assert.ok(g.t === 'L' || g.t === 'A', 'lines and arcs only');
    for (let i = 1; i < P.length; i++) assert.ok(gapOf(P[i - 1].b, P[i].a) < 0.01, `${name}: segment ${n + 1} continuous at piece ${i}`);
    const A = toMachine([G.pts[sg.i0].x, G.pts[sg.i0].y]), B = toMachine([G.pts[sg.i1].x, G.pts[sg.i1].y]);
    assert.ok(gapOf(P[0].a, A) < 1e-6 && gapOf(P.at(-1).b, B) < 1e-6, `${name}: segment ${n + 1} from its first sample to its last`);
    for (let i = sg.i0; i <= sg.i1; i++) {
      const p = toMachine([G.pts[i].x, G.pts[i].y]), d = Math.min(...P.map(g => off(g, p)));
      assert.ok(d <= 0.1 + 1e-6, `${name}: segment ${n + 1}, sample ${i} ${d.toFixed(3)} mm off`);
    }
    const L = P.reduce((a, g) => a + pieceLen(g), 0);
    assert.ok(Math.abs(L - sg.len) <= Math.max(0.05, 0.002 * sg.len), `${name}: segment ${n + 1} ${L.toFixed(2)} mm, the samples ${sg.len.toFixed(2)}`);
  });
}
test('for the machine: every segment lines and arcs, continuous, within 0.1 mm of the samples — clockwise and counter', () => {
  checkPieces('default', planOf(settingsOf({})));
  checkPieces('counter', planOf(settingsOf({ dir: 'ccw' })));
});
test('for the machine: the corners sharp and round, closed rings, the spiral', () => {
  checkPieces('corners −50', planOf(settingsOf({ corners: -50 })));
  checkPieces('corners +50', planOf(settingsOf({ corners: 50 })));
  checkPieces('closed rings', planOf(settingsOf({ seam: 'closed' })));
  checkPieces('×120', planOf(settingsOf({ step: 120 })));
});
test('a lane is its own sides and corners: closed rings run as lines and quarter arcs only, nine a lane', () => {
  const G = planOf(settingsOf({ seam: 'closed' })), first = G.segs[0], P = piecesOf(G, first.i0, first.i1);
  for (const g of P) if (g.t === 'A') assert.ok(Math.abs(sweepOf(g) - Math.PI / 2) < 1e-6 || sweepOf(g) < Math.PI / 2, 'a corner a quarter at most');
});

test('DRAG: a pass a segment, its stop first; the snake one path of the strokes, air a path a stroke', () => {
  const G = planOf(settingsOf({}));
  const S = dragRows(G, 'snake'), A = dragRows(G, 'air');
  assert.equal(S.passes.length, G.segs.length); assert.equal(S.stops, 72);
  assert.ok(S.passes.every(p => p.ps.length === 1 && p.why.startsWith('Segment ')));
  assert.ok(A.passes.every(p => p.ps.length === 3));
  const one = S.passes[5].ps[0], seg = A.passes[5].ps[0], L = seg.reduce((a, g) => a + pieceLen(g), 0);
  assert.ok(Math.abs(one.reduce((a, g) => a + pieceLen(g), 0) - 3 * L) < 1e-6, 'forward, back, forward');
  assert.ok(gapOf(one.at(-1).b, seg.at(-1).b) < 1e-9, 'three strokes: it ends at the far end');
});

test('DRAG on the machine: the brush over each segment\'s start before its stop, the first too; no other pause', () => {
  const G = planOf(settingsOf({})), D = dragRows(G, 'snake');
  const o = { ...RUN_DEFAULTS, speed: 25, travel: 180, tail: 3, lift: false, ink: false, snake: true, pause: false, rows: D.info.length, here: { x: 400, y: 300 }, pauseAtEnds: true, pauseOver: true };
  const R = plotRun(o, D.passes);
  assert.equal(R.fault, '');
  const pauses = R.blocks.map((b, i) => [b, i]).filter(([b]) => b.kind === 'pause');
  assert.equal(pauses.length, 72);
  pauses.forEach(([b, i], n) => {
    const mv = R.blocks[i - 1], at = mv.cmds.find(c => c.startsWith('M ')).split(' ').map(Number), s = D.passes[n].ps[0][0].a;
    assert.ok(Math.abs(at[1] - 400 - s.x) < 0.01 && Math.abs(at[2] - 300 - s.y) < 0.01, `stop ${n + 1}: the brush over its start`);
    assert.equal(b.why, D.passes[n].why);
  });
  const without = plotRun({ ...o, pauseOver: false }, D.passes);
  assert.equal(without.blocks.filter(b => b.kind === 'pause').length, 71, 'without pauseOver: none before the first, as every other tab');
});

test('TRACE: the cassette\'s outline, its shell, round from 12 o\'clock and on over its start, the brush lifting off over the lap; the guides the very lines DRAG runs', () => {
  const G = planOf(settingsOf({})), cb = G.cb, T = traceRows(G, { traceCass: true, traceTape: true, ink: false });
  const shell = T.ps[0], L = shell.reduce((a, g) => a + pieceLen(g), 0), P = 2 * (100.4 + 63.8) - (8 - 2 * Math.PI) * 1.8;
  assert.ok(Math.abs(L - (1 + LOOP_SHARE) * P) < 0.01, `once round and ${LOOP_SHARE * 100} % over its start: ${L.toFixed(2)} mm`);
  assert.ok(shell.every(g => Math.abs(g.tailOut - LOOP_SHARE * P) < 0.01), 'the brush lifting off over all of the lap');
  assert.ok(gapOf(shell[0].a, toMachine([0, -cb.h / 2])) < 1e-9, 'from 12 o\'clock');
  assert.ok(shell.every(g => g.t === 'L' || Math.abs(g.r - 1.8) < 1e-9), 'its sides lines, its corners the shell\'s 1.8 mm');
  assert.ok(shell[0].b.y > shell[0].a.y, 'clockwise: to the right first');
  assert.equal(T.ps.length, 1 + G.runs.length);
  for (const p of T.ps) for (let i = 1; i < p.length; i++) assert.ok(gapOf(p[i - 1].b, p[i].a) < 0.01, 'continuous');
  const guide = T.ps.slice(1).reduce((a, p) => a + p.reduce((b, g) => b + pieceLen(g), 0), 0);
  assert.ok(Math.abs(guide - G.guideLen) < 0.002 * G.guideLen, 'the guide as long as the runs on the canvas');
  const inked = traceRows(G, { traceCass: true, traceTape: true, ink: true });
  assert.ok(inked.ps.length > T.ps.length, 'with ink the long guides cut where the dips fall');
  assert.equal(traceRows(G, { traceCass: false, traceTape: true }).ps.length, G.runs.length);
  assert.equal(traceRows(G, { traceCass: true, traceTape: false }).ps.length, 1);
  assert.ok(Math.abs(shellOf(G, 0).pieces.reduce((a, g) => a + pieceLen(g), 0) - P) < 0.01, 'the save\'s outline once round');
});

test('the SVG\'s paths: lines, curves, arcs, relative and repeated; through a matrix', () => {
  const sq = flattenD('m10 10 h20 v20 h-20 z'), lenOf = P => P.reduce((a, p, i) => i ? a + Math.hypot(p[0] - P[i - 1][0], p[1] - P[i - 1][1]) : 0, 0);
  assert.equal(sq.length, 1); assert.ok(sq[0].closed);
  for (const v of [[10, 10], [30, 10], [30, 30], [10, 30]]) assert.ok(sq[0].pts.some(p => p[0] === v[0] && p[1] === v[1]), `corner ${v}`);
  assert.deepEqual(sq[0].pts.at(-1), [10, 10]); assert.ok(Math.abs(lenOf(sq[0].pts) - 80) < 1e-9);
  assert.ok(sq[0].pts.every((p, i) => !i || Math.hypot(p[0] - sq[0].pts[i - 1][0], p[1] - sq[0].pts[i - 1][1]) <= 0.2 + 1e-9), 'a line cut as finely as a curve');
  const circ = flattenD('M0,10 A10,10 0 1,0 20,10 A10 10 0 1 0 0 10Z')[0];
  for (const p of circ.pts) assert.ok(Math.abs(Math.hypot(p[0] - 10, p[1] - 10) - 10) < 1e-9, 'on the circle');
  const flags = flattenD('M0 0a5 5 0 0110 0')[0];                             // flags without separators
  assert.ok(Math.abs(flags.pts.at(-1)[0] - 10) < 1e-9 && Math.min(...flags.pts.map(p => p[1])) < -4.9, 'a half circle over the top');
  const moved = flattenD('M0 0L1 0', [2, 0, 0, 2, 5, 7])[0];
  assert.deepEqual([moved.pts[0], moved.pts.at(-1)], [[5, 7], [7, 7]]);
  const two = flattenD('M0 0 1 1 2 0M5 5 6 6');
  assert.equal(two.length, 2); assert.deepEqual(two[0].pts.at(-1), [2, 0]); assert.deepEqual(two[1].pts.at(-1), [6, 6]);
});

test('the save\'s path data: back to canvas mm, y down, the arcs\' sweep the way they turn on the screen', () => {
  const G = planOf(settingsOf({ seam: 'closed' })), sg = G.segs[0], d = pathD(piecesOf(G, sg.i0, sg.i1));
  assert.ok(d.startsWith(`M${(Math.round(G.pts[sg.i0].x * 100) / 100)} `));
  assert.ok(/A\d/.test(d) && / 0 0 1 /.test(d), 'clockwise corners: sweep 1');
});

test('the brush down off the canvas (the owner, 2026-10-12: "let it just go without a lift"): one run a path, every paint stop on the canvas', () => {
  const on = (G, p) => Math.abs(p.x) <= G.Hx + G.o.brush / 2 - 0.2 && Math.abs(p.y) <= G.Hy + G.o.brush / 2 - 0.2;
  for (const c of [{}, { seam: 'closed' }, { corners: 50 }, { corners: -50 }, { cw: 300, ch: 300, brush: 5 }]) {
    const G = planOf({ ...DEFAULTS, cw: 200, ch: 200, ...c }), was = planOf({ ...DEFAULTS, cw: 200, ch: 200, ...c, keepDown: false }), name = JSON.stringify(c);
    assert.equal(G.K, was.K, `${name}: the same lanes`);
    if ((c.seam || 'shift') === 'shift') assert.equal(G.runs.length, 1, `${name}: the spiral one run, no lift at the edges`);
    else assert.ok(G.runs.length <= G.K, `${name}: a ring one run at most`);
    assert.ok(G.lifts < was.lifts, `${name}: fewer lifts, ${G.lifts} < ${was.lifts}`);
    G.segs.forEach((sg, n) => { if (!G.runs.some(r => r.i0 === sg.i0)) assert.ok(on(G, G.pts[sg.i0]), `${name}: stop ${n + 1} on the canvas`); });
    for (let n = 1; n < G.segs.length; n++) if (!G.runs.some(r => r.i0 === G.segs[n].i0)) assert.equal(G.segs[n].i0, G.segs[n - 1].i1, `${name}: the segments one after another`);
    checkPieces(name, G);
  }
  const G = planOf({ ...DEFAULTS, cw: 200, ch: 200 }), onLen = G.segs.map(sg => { let s = 0; for (let i = sg.i0 + 1; i <= sg.i1; i++) if (on(G, G.pts[i]) && on(G, G.pts[i - 1])) s += Math.hypot(G.pts[i].x - G.pts[i - 1].x, G.pts[i].y - G.pts[i - 1].y); return s; });
  assert.ok(Math.max(...onLen) - Math.min(...onLen) < 2, 'a squeeze the same tape on the canvas each');
});

test('Counter: TRACE\'s outline the other way round too, from 12 o\'clock', () => {
  const G = planOf(settingsOf({ dir: 'ccw' })), shell = traceRows(G, { traceCass: true }).ps[0];
  assert.ok(gapOf(shell[0].a, toMachine([0, -G.cb.h / 2])) < 1e-9, 'from 12 o\'clock');
  assert.ok(shell[0].b.y < shell[0].a.y, 'to the left first');
});

test('the cassette on the board and in the Result: its SVG at real size, centred on the canvas', () => {
  const G = planOf(settingsOf({})), body = cassetteLines(ITEMS, G.cb, DEFAULT_CASS).find(l => l.id === 'body-1');
  assert.ok(body.closed);
  const xs = body.pts.map(p => p[0]), ys = body.pts.map(p => p[1]);
  assert.ok(Math.abs(Math.min(...xs) + 50.2) < 1e-6 && Math.abs(Math.max(...xs) - 50.2) < 1e-6, 'its 100.4 mm across, centred');
  assert.ok(Math.abs(Math.min(...ys) + 31.9) < 1e-6 && Math.abs(Math.max(...ys) - 31.9) < 1e-6, 'its 63.8 mm up, centred');
});
