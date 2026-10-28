import test from 'node:test';
import assert from 'node:assert/strict';
import { cellsOf, opmPlan, insetOf, roundedOf, areaOf, outerOf, boldestOf, INSET, MIN_ROW } from '../src/opmplan.js';
import { rubbed, passesOf, drawRows, PRISMA_PENCILS } from '../src/prismaplan.js';
import { cleanPencils, runOrder, lineLen, withChanges, lightnessOf } from '../src/dacheplan.js';
import { cleanRect, atPiece } from '../src/inkaplan.js';
import { BLEND, BLEND_1554 } from '../src/blendplan.js';
import { SAUSAGE_W } from '../src/ccdplan.js';
import { plotRun, DEFAULTS, TAIL_MIN } from '../src/strokes.js';

// OPM (the owner, 2026-10-27, after PRISMA on paper: "back to the paints,
// painted by hand along a contour drawn beforehand in pencils";
// OPM/Rainbow Perspective Tile Grid.png): IMG_1554's blend on a 400 × 400, a
// Preview made up — its left half blue, its right half orange — one spoke's
// sausage down the bottom, red in it.
const SIDE = BLEND_1554.side * 400, AT = (400 - SIDE) / 2;
const SPOKE = { a: [0.7, 0.02], b: [0.7, 0.55], paint: 'red' };
const MIX = () => cleanRect({ id: 1, x: AT, y: AT, w: SIDE, h: SIDE, step: 3, kind: BLEND, ss: [SPOKE] });
const P = cleanPencils(PRISMA_PENCILS);
const resOf = (fn, W = 400, H = 400, h = 1) => {
  const nx = W / h, ny = H / h, data = new Uint8ClampedArray(4 * nx * ny);
  for (let iy = 0; iy < ny; iy++) for (let ix = 0; ix < nx; ix++) { const c = fn((ix + 0.5) * h, (iy + 0.5) * h), q = 4 * ((ny - 1 - iy) * nx + ix); data.set([...c, 255], q); }
  return { nx, ny, h, data };
};
const SX = AT + 0.7 * SIDE, RED = [194, 33, 58], BLUE = [36, 80, 158], ORANGE = [235, 115, 37];
const PREVIEW = resOf(x => Math.abs(x - SX) < SAUSAGE_W / 2 ? RED : x < 200 ? BLUE : ORANGE);
const inPoly = (Q, x, y) => { let c = false; for (let i = 0, j = Q.length - 1; i < Q.length; j = i++) { const a = Q[i], b = Q[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
const segDist = (p, a, b) => { const ab = [b[0] - a[0], b[1] - a[1]], t = Math.max(0, Math.min(1, ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1]) / (ab[0] ** 2 + ab[1] ** 2 || 1))); return Math.hypot(p[0] - a[0] - t * ab[0], p[1] - a[1] - t * ab[1]); };
const closed = ps => Math.hypot(ps[0].a[0] - ps.at(-1).b[0], ps[0].a[1] - ps.at(-1).b[1]) < 1e-6;

test('the cells: the blend all over, every one anticlockwise, rows MIN_ROW at least however narrow a side', () => {
  const { cells } = cellsOf([MIX()], { corner: 4 });
  const area = cells.reduce((a, c) => a + c.area, 0), blend = SIDE * SIDE;
  assert.ok(Math.abs(area - blend) < 0.015 * blend, `the cells' area ${Math.round(area)} of ${Math.round(blend)}`);
  assert.ok(cells.every(c => areaOf(c.poly) > 0));
  assert.ok(cells.length > 100 && cells.length < 5000, `${cells.length} cells`);
  const thin = cells.filter(c => 2 * c.area / c.poly.reduce((s, q, i) => s + Math.hypot(c.poly[(i + 1) % c.poly.length][0] - q[0], c.poly[(i + 1) % c.poly.length][1] - q[1]), 0) < 0.5 * MIN_ROW);
  assert.ok(thin.length < 0.05 * cells.length, `${thin.length} cells under half a row`);
});

test('the sausage\'s strip across the bands of the bottom: a narrow cell, SAUSAGE_W wide, its pencil red', () => {
  const D = opmPlan([MIX()], PREVIEW, { pencils: P, corner: 4 });
  const strip = D.cells.filter(c => c.p === 0 && inPoly(c.poly, SX, c.poly.reduce((s, q) => s + q[1], 0) / c.poly.length));
  assert.ok(strip.length >= 3, `the strip down the bands: ${strip.length}`);
  const ws = strip.map(c => { const xs = c.poly.map(q => q[0]); return Math.max(...xs) - Math.min(...xs); }), narrow = ws.filter(w => Math.abs(w - SAUSAGE_W) < 0.5);
  assert.ok(narrow.length >= strip.length - 1, `the strip SAUSAGE_W wide but where it runs past the side's end: ${ws.map(w => w.toFixed(1))}`);
  assert.ok(strip.some(c => c.pencil === 'carmine' || c.pencil === 'poppy' || c.pencil === 'crimsonlake'), `red: ${strip.map(c => c.pencil)}`);
  assert.ok(D.cells.some(c => c.pencil === 'blue') && D.cells.some(c => c.pencil === 'orange'), 'the halves');
});

test('every contour closed, inside its cell, INSET in from its edges, its corners rounded', () => {
  const D = opmPlan([MIX()], PREVIEW, { pencils: P, corner: 4 });
  assert.ok(D.modules.length > 50 && D.lost < 0.15 * D.modules.length, `${D.modules.length} contours, ${D.lost} lost — where IMG_1554's keys meet at the top the bands are thinner than a contour`);
  const byId = D.cells.filter(c => c.pencil);
  let checked = 0;
  for (const M of D.modules.slice(0, 200)) {
    assert.ok(closed(M.pieces), 'closed');
    const pts = M.pieces.flatMap(g => [0.25, 0.5, 0.75].map(f => atPiece(g, lineLen(g) * f).p));
    const c = byId.find(q => q.pencil === M.pencil && pts.every(p => inPoly(q.poly, ...p)));
    if (!c) continue;
    checked++;
    const d = Math.min(...pts.map(p => Math.min(...c.poly.map((a, i) => segDist(p, a, c.poly[(i + 1) % c.poly.length])))));
    assert.ok(d > INSET * 0.6, `${d.toFixed(2)} mm from the cell's edge`);
  }
  assert.ok(checked > 100, `${checked} contours in their cells`);
  assert.ok(D.modules.some(M => M.pieces.some(g => g.t === 'A')), 'the corners rounded, arcs');
});

test('Merged: one pencil\'s cells side by side one area, fewer contours, closed too', () => {
  const C = opmPlan([MIX()], PREVIEW, { pencils: P, corner: 4 }), M = opmPlan([MIX()], PREVIEW, { pencils: P, corner: 4, merge: true });
  assert.ok(M.modules.length < C.modules.length / 3, `${M.modules.length} against ${C.modules.length}`);
  assert.ok(M.modules.every(q => closed(q.pieces)));
  const mm = D => D.modules.reduce((a, q) => a + q.mm, 0);
  assert.ok(mm(M) < mm(C), 'less line');
});

test('a contour rubbed round and round, never back; inset and rounding by themselves', () => {
  const sq = [[0, 0], [10, 0], [10, 6], [0, 6]], I = insetOf(sq, 1);
  assert.deepEqual(I.map(q => q.map(v => Math.round(v * 1e6) / 1e6)), [[1, 1], [9, 1], [9, 5], [1, 5]]);
  assert.equal(insetOf([[0, 0], [10, 0], [10, 1], [0, 1]], 0.7), null, 'too narrow: none');
  const R = roundedOf(I, 1.5);
  assert.ok(closed(R) && R.filter(g => g.t === 'A').length === 4);
  const r3 = rubbed(R, 3);
  assert.equal(r3.length, 3 * R.length);
  assert.deepEqual(r3.slice(R.length, 2 * R.length), R, 'the second time round as the first');
  const D = opmPlan([MIX()], PREVIEW, { pencils: P, corner: 4 }), S = passesOf(D, runOrder(P.filter(p => !D.few.includes(p.id))), { rubs: () => 4 }), rows = drawRows(S, P, { cw: 400, ch: 400 });
  const run = plotRun({ ...DEFAULTS, speed: 60, travel: 180, tail: TAIL_MIN, lift: true, ink: false, snake: true, pause: false, rows: rows.ps.length, here: { x: 300, y: 300 }, hover: 1, minPiece: 0.005, pencil: { press: -1.4, glide: 1 } }, [{ key: 'DRAW', ps: rows.ps, why: null }]);
  assert.equal(run.fault, '');
});

test('OPM-B: the rows thicker and the rays wider at its asking, OPM\'s cells as they were', () => {
  const a = cellsOf([MIX()], { corner: 4 }), b = cellsOf([MIX()], { corner: 4, minRow: 6, stripW: 10 });
  assert.ok(b.cells.length < a.cells.length * 0.75, `fewer cells: ${b.cells.length} against ${a.cells.length}`);
  const area = q => q.cells.reduce((s, c) => s + c.area, 0);
  assert.ok(Math.abs(area(a) - area(b)) < 1e-6 * area(a) + 1, 'the blend all over still');
  const D = opmPlan([MIX()], PREVIEW, { pencils: P, corner: 4, minRow: 6, stripW: 10, minW: 2.5 });
  const strip = D.cells.filter(c => c.p === 0 && inPoly(c.poly, SX, c.poly.reduce((s, q) => s + q[1], 0) / c.poly.length));
  const ws = strip.map(c => { const xs = c.poly.map(q => q[0]); return Math.max(...xs) - Math.min(...xs); });
  assert.ok(ws.filter(w => Math.abs(w - 10) < 0.5).length >= strip.length - 1, `the ray 10 mm wide: ${ws.map(w => w.toFixed(1))}`);
});

test('OPM, the rim of Key 1 · A alone with OPM-B\'s cells: its rows thicker, its rays wider, every other band as it was', () => {
  const rim = { minRow: 6, stripW: 10, minW: 2.5 }, a = cellsOf([MIX()], { corner: 4 }), b = cellsOf([MIX()], { corner: 4, rim });
  const inRim = q => q.cells.filter(c => q.regions[c.reg].kind === 'blend' && q.regions[c.reg].key === 0), rest = q => q.cells.filter(c => !inRim(q).includes(c));
  assert.notDeepEqual(inRim(b).map(c => c.poly), inRim(a).map(c => c.poly), 'the rim\'s cells its own (its loops here 6 mm apart already: its rays wider)');
  assert.deepEqual(rest(b).map(c => c.poly), rest(a).map(c => c.poly), 'Key 2 to the core and the core cell for cell OPM\'s');
  const D = opmPlan([MIX()], PREVIEW, { pencils: P, corner: 4, rim });
  const strip = D.cells.filter(c => c.reg === 0 && c.p === 0 && inPoly(c.poly, SX, c.poly.reduce((s, q) => s + q[1], 0) / c.poly.length));
  const ws = strip.map(c => { const xs = c.poly.map(q => q[0]); return Math.max(...xs) - Math.min(...xs); });
  assert.ok(ws.filter(w => Math.abs(w - 10) < 0.5).length >= strip.length - 1, `the rim's ray 10 mm wide: ${ws.map(w => w.toFixed(1))}`);
});

// OPM-S (the owner, 2026-10-28): FRAME, "only the outer big frame, so that I
// can lay the canvas perfectly straight"; DRAW BW, "without a change of
// pencils, at once"
const runOf = (S, pencils = P) => {
  const rows = drawRows(S, pencils, { cw: 400, ch: 400 });
  const run = plotRun({ ...DEFAULTS, speed: 60, travel: 180, tail: TAIL_MIN, lift: true, ink: false, snake: true, pause: false, rows: rows.ps.length, here: { x: 300, y: 300 }, hover: 1, minPiece: 0.005, pencil: { press: -1.4, glide: 1 } }, [{ key: 'DRAW', ps: rows.ps, why: null }]);
  return { run, blocks: withChanges(run.blocks, rows, pencils, S, { press: -1.4, at: 5 }) };
};
test('OPM-S, FRAME: Key 1 · A alone, on its own line, closed, rubbed round; one pencil in, no other stop', () => {
  const F = outerOf([MIX()], { corner: 4, pencil: 'black' });
  assert.equal(F.length, 1, 'the one blend\'s outer contour');
  const M = F[0], ends = M.pieces.flatMap(g => [g.a, g.b]), xs = ends.map(q => q[0]), ys = ends.map(q => q[1]), near = (v, w) => Math.abs(v - w) < 1e-6;
  assert.ok(closed(M.pieces) && M.pencil === 'black');
  assert.ok(near(Math.min(...xs), AT) && near(Math.max(...xs), AT + SIDE) && near(Math.min(...ys), AT) && near(Math.max(...ys), AT + SIDE), 'on the blend\'s box, not in from it');
  assert.ok(M.pieces.filter(g => g.t === 'A').length === 4 && M.mm < 4 * SIDE && M.mm > 0.95 * 4 * SIDE, `its corners rounded, ${M.mm.toFixed(1)} mm round`);
  const pc = P.find(p => p.id === 'black'), S = passesOf({ modules: F }, [pc], { rubs: () => 4 });
  assert.equal(S.length, 1); assert.ok(Math.abs(S[0].mm - 4 * M.mm) < 1e-6, 'four times round');
  const { run, blocks } = runOf(S);
  assert.equal(run.fault, '');
  assert.equal(blocks.filter(b => b.kind === 'p-pause').length, 1, 'the pencil in, then round without a stop');
  assert.deepEqual(outerOf([]), []);
});
test('OPM-S, DRAW BW: every contour DRAW draws in the darkest pencil, one pass, no change of pencils', () => {
  const pc = boldestOf(P);
  assert.ok(P.filter(p => p.on).every(p => lightnessOf(p.hex) >= lightnessOf(pc.hex)), `${pc.name} the darkest`);
  assert.notEqual(boldestOf(P.map(p => p.id === pc.id ? { ...p, on: false } : p)).id, pc.id, 'one out of the box not taken');
  const lit = boldestOf(P, '#161514');                                                // on a black ground: the lightest
  assert.ok(P.filter(p => p.on).every(p => lightnessOf(p.hex) <= lightnessOf(lit.hex)), `${lit.name} the lightest`);
  const D = opmPlan([MIX()], PREVIEW, { pencils: P, corner: 4 }), clr = passesOf(D, runOrder(P.filter(p => !D.few.includes(p.id))), { rubs: () => 4 });
  const bw = passesOf({ modules: D.modules.map(M => ({ ...M, pencil: pc.id })) }, [pc], { rubs: () => 4 });
  assert.equal(bw.length, 1); assert.ok(clr.length > 1, `DRAW CLR ${clr.length} pencils`);
  assert.equal(bw[0].modules, D.modules.length, 'every contour');
  assert.ok(Math.abs(bw[0].mm - clr.reduce((a, q) => a + q.mm, 0)) < 1e-6 * bw[0].mm, 'the same line, rubbed as much');
  const { run, blocks } = runOf(bw);
  assert.equal(run.fault, '');
  assert.equal(blocks.filter(b => b.kind === 'p-pause').length, 1, 'the one pencil in, no change after');
  assert.ok(runOf(clr).blocks.filter(b => b.kind === 'p-pause').length === clr.length, 'DRAW CLR a stop a pencil, as ever');
});
test('OPM-S, the mosaic pressed together: every contour its cell\'s own edge, sharp, two neighbours one line, none lost', () => {
  const D = opmPlan([MIX()], PREVIEW, { pencils: P, corner: 4, inset: 0, round: 0 }), R = opmPlan([MIX()], PREVIEW, { pencils: P, corner: 4 });
  assert.equal(D.lost, 0); assert.equal(D.modules.length, D.areas.reduce((a, A) => a + A.loops.length, 0), 'a contour every cell');
  assert.ok(D.modules.every(M => closed(M.pieces) && M.pieces.every(g => g.t === 'L')), 'no arcs: the corners sharp');
  const key = p => `${Math.round(p[0] * 1e4)},${Math.round(p[1] * 1e4)}`, corners = new Set(D.cells.filter(c => c.pencil).flatMap(c => c.poly.map(key)));
  assert.ok(D.modules.every(M => M.pieces.every(g => corners.has(key(g.a)))), 'every corner of a contour a corner of the cells');
  const edges = new Map(); for (const M of D.modules) for (const g of M.pieces) { const k = [key(g.a), key(g.b)].sort().join(' '); edges.set(k, (edges.get(k) ?? 0) + 1); }
  assert.ok([...edges.values()].filter(n => n === 2).length > 0.3 * edges.size, 'a neighbour\'s side its own, both ways');
  assert.ok(D.modules.reduce((a, M) => a + M.mm, 0) > R.modules.reduce((a, M) => a + M.mm, 0), 'longer than OPM\'s, 0.7 in');
});
