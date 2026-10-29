import test from 'node:test';
import assert from 'node:assert/strict';
import { cellsOf, opmPlan, insetOf, roundedOf, areaOf, outerOf, boldestOf, INSET, MIN_ROW, FACETS_NEW, blockCellsOf, blocksIn, opmpPlan, dragRowsOf, rowsIn, bandRows, fitKeys, FIT, PITCH_NEW, FRAME_MARK } from '../src/opmplan.js';
import { rubbed, passesOf, drawRows, PRISMA_PENCILS } from '../src/prismaplan.js';
import { cleanPencils, runOrder, lineLen, withChanges, lightnessOf } from '../src/dacheplan.js';
import { cleanRect, atPiece } from '../src/inkaplan.js';
import { BLEND, BLEND_1554, blendSpokes, keysOf } from '../src/blendplan.js';
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

// OPM-W (the owner, 2026-10-28, OPM/Screenshot 2.34.42 PM: "no smooth
// semicircles and no rounded corners — straight lines at different slants";
// wooden sticks glued on): every corner FACETS straight pieces, the same turn
// each, every row's at the same slants — three, 75°, 45° and 15°
const slant = (a, b) => ((Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI) % 180 + 180) % 180;
const onFacet = (deg, n) => { const t = 90 / n, r = ((deg - t / 2) % t + t) % t; return Math.min(r, t - r) < 1e-4; };   // 15°, 45°, 75° … for three
test('OPM-W, the cells: a corner in straight pieces, the rows\' at the same slants, the blend all over', () => {
  assert.equal(FACETS_NEW, 3, 'the owner\'s screenshot: three');
  for (const n of [1, 3, 6]) {
    const { cells } = cellsOf([MIX()], { corner: 4, facets: n }), corner = cells.filter(c => c.p % 2);
    const area = cells.reduce((a, c) => a + c.area, 0), blend = SIDE * SIDE;
    assert.ok(Math.abs(area - blend) < 0.015 * blend, `${n}: the cells' area ${Math.round(area)} of ${Math.round(blend)}`);
    assert.ok(corner.length > 20 && corner.every(c => c.poly.length <= 2 * (n + 1)), `${n}: a corner cell its two loops' ${n} pieces and the two ends, no more`);
    for (const c of corner) {                                                         // every edge on a facet's slant but the two across the row
      const off = c.poly.filter((q, i) => { const b = c.poly[(i + 1) % c.poly.length]; return Math.hypot(b[0] - q[0], b[1] - q[1]) > 1e-3 && !onFacet(slant(q, b), n); });
      assert.ok(off.length <= 2, `${n}: ${off.length} edges off the slants`);
    }
  }
  const round = cellsOf([MIX()], { corner: 4 }).cells.filter(c => c.p % 2);
  assert.ok(round.some(c => c.poly.length > 2 * (FACETS_NEW + 1)), 'OPM-S\'s corners its arcs, a point every 2 mm');
});
test('OPM-W, the contours: straight pieces only, closed, on the cells\' own edges, none lost', () => {
  const D = opmPlan([MIX()], PREVIEW, { pencils: P, corner: 4, inset: 0, round: 0, facets: 3 });
  assert.equal(D.lost, 0);
  assert.ok(D.modules.length > 50 && D.modules.every(M => closed(M.pieces) && M.pieces.every(g => g.t === 'L')), 'no arc');
  const slants = D.modules.flatMap(M => M.pieces.map(g => slant(g.a, g.b)));
  for (const deg of [15, 45, 75, 105, 135, 165]) assert.ok(slants.some(v => Math.abs(v - deg) < 1e-4), `a piece at ${deg}°`);
  const inset = opmPlan([MIX()], PREVIEW, { pencils: P, corner: 4, inset: 0.7, round: 0, facets: 3 });
  assert.ok(inset.modules.every(M => M.pieces.every(g => g.t === 'L')), 'in from the edge, straight still');
});
test('OPM-W, FRAME: Key 1 · A, four sides and its corners three pieces each, no arc; one pencil in', () => {
  const [M] = outerOf([MIX()], { corner: 4, pencil: 'black', facets: 3 }), [R] = outerOf([MIX()], { corner: 4, pencil: 'black' });
  assert.ok(closed(M.pieces) && M.pieces.every(g => g.t === 'L'));
  assert.equal(M.pieces.length, 4 + 4 * 3);
  assert.ok(M.mm < R.mm && M.mm > 0.99 * R.mm, `the chords a hair shorter than the arcs: ${M.mm.toFixed(2)} of ${R.mm.toFixed(2)} mm`);
  assert.deepEqual([...new Set(M.pieces.map(g => Math.round(slant(g.a, g.b))))].sort((a, b) => a - b), [0, 15, 45, 75, 90, 105, 135, 165]);
  const { run, blocks } = runOf(passesOf({ modules: [M] }, [P.find(p => p.id === 'black')], { rubs: () => 4 }));
  assert.equal(run.fault, '');
  assert.equal(blocks.filter(b => b.kind === 'p-pause').length, 1);
});

// OPM-P (the owner, 2026-10-29, OPM/Screenshot 10.58.14 PM, 1.01.38 PM,
// 2.12.27 PM, 3.00.14 PM: "every block its own rows: a side and a bevel filled
// with their own rows exactly the brush, parallel to their own edge; the rows
// end on the rays, the diagonals from Key 1's corner to Key 2's"; 3.05.15 PM:
// "white gaps — there must be none"): his OPM-W blend of 2026-10-28 23:18 —
// Key 2 big and low, one facet a corner — and a blend whose Key 2 lies off the
// middle with three, its spokes the rays; a Preview of four colours
const OWNER = cleanRect({ id: 1, x: 50.5, y: 32, w: 499, h: 736, step: 4, kind: BLEND, keys: [{ x: 0.2785, y: 0.1618, w: 0.5646, h: 0.4373 }, { x: 0.6, y: 0.3098, w: 0.1439, h: 0.0939 }], corners: [68.5, 60, 9.5], steps: 22, core: true });
const PERSP = (() => {
  const r = cleanRect({ id: 1, x: 20, y: 20, w: 360, h: 360, step: 3, kind: BLEND, keys: [{ x: 0.3, y: 0.15, w: 0.5, h: 0.45 }, { x: 0.55, y: 0.35, w: 0.15, h: 0.12 }], corners: [40, 6, 4], steps: 13, core: true });
  const sp = blendSpokes(r, { trail: 9, edge: 1.75, step: 3, change: 30, density: 50 }).filter((_, i) => i % 3 === 0);
  return cleanRect({ ...r, ss: sp.map(q => ({ ...q, a: [(q.a[0] - r.x) / r.w, (q.a[1] - r.y) / r.h], b: [(q.b[0] - r.x) / r.w, (q.b[1] - r.y) / r.h], paint: 'red' })) });
})();
const QUAD = resOf((x, y) => x < 200 ? (y < 200 ? BLUE : RED) : (y < 200 ? ORANGE : [80, 160, 70]));
const QUAD8 = resOf((x, y) => x < 300 ? (y < 400 ? BLUE : RED) : (y < 400 ? ORANGE : [80, 160, 70]), 600, 800, 2);
const keyOfPt = q => `${Math.round(q[0] * 1e3)},${Math.round(q[1] * 1e3)}`;
const onLine = (q, a, b) => { const u = [b[0] - a[0], b[1] - a[1]], L = Math.hypot(...u); return L < 1e-9 ? Math.hypot(q[0] - a[0], q[1] - a[1]) < 1e-6 : Math.abs((q[0] - a[0]) * u[1] - (q[1] - a[1]) * u[0]) / L < 1e-6; };
const CASES = [[OWNER, 1, QUAD8], [PERSP, 3, QUAD]];
test('OPM-P, every block its own rows: a side, a facet of a bevel, its rows parallel to its edge, never wider than the brush, ending on its rays; Bound, the blend\'s bands every block\'s in whole rows', () => {
  for (const [r, facets] of CASES) for (const pitch of [4, PITCH_NEW, 9]) for (const bound of [true, false]) {
    const { regions, cells } = blockCellsOf([r], { corner: 4, facets, pitch, bound });
    for (const R of regions) for (const B of R.blocks) {
      if (!bound) assert.equal(B.n, rowsIn(B.d, pitch));
      else { assert.equal(B.n, R.bands * bandRows(B.d / R.bands, pitch), 'a band a whole number of rows'); assert.ok([1, 2, 4, 8, 16, 32].includes(B.m), `${B.m} rows a band: 1, 2, 4 …, never three against four`); }
      if (B.d > 0.5) assert.ok(B.d / B.n <= pitch * FIT + 1e-9, `a row ${(B.d / B.n).toFixed(2)} mm for ${pitch}: never wider than the brush`);
    }
    if (bound) for (const R of regions) {                                             // the narrowest block's band one row, the brush wide; its lines and every block's band lines meet on the rays
      const wide = R.blocks.filter(B => B.side && B.d >= pitch);
      if (wide.length) assert.ok(wide.some(B => B.m === 1), 'the narrowest side a row a band');
      R.blocks.forEach((B, i) => { const C = R.blocks[(i + 1) % R.blocks.length]; for (let k = 0; k <= R.bands; k++) assert.ok(Math.hypot(...[0, 1].map(j => B.a[1][j] + (B.b[1][j] - B.a[1][j]) * k / R.bands - (C.a[0][j] + (C.b[0][j] - C.a[0][j]) * k / R.bands))) < 1e-9); });
    }
    const facetsSeen = regions[0].blocks.filter(B => !B.side).length;
    assert.equal(facetsSeen, 4 * facets, 'every facet of every bevel its own block');
    for (const c of cells) {
      const B = regions[c.reg].blocks[c.blk], e = B.a[1][0] - B.a[0][0] || B.a[1][1] - B.a[0][1] ? [B.a[0], B.a[1]] : [B.b[0], B.b[1]];
      c.poly.forEach((q, i) => {
        const b = c.poly[(i + 1) % c.poly.length];
        if (c.kinds[i] !== Infinity) assert.ok(Math.abs((b[0] - q[0]) * (e[1][1] - e[0][1]) - (b[1] - q[1]) * (e[1][0] - e[0][0])) / Math.hypot(b[0] - q[0], b[1] - q[1]) / Math.hypot(e[1][0] - e[0][0], e[1][1] - e[0][1]) < 1e-6, 'a row line parallel to its block\'s edge');
      });
      if (c.ray < 0) for (const q of c.poly) assert.ok(onLine(q, B.a[0], B.b[0]) || onLine(q, B.a[1], B.b[1]) || c.poly.length > 4 || B.side, 'a facet\'s cell between its two rays');
    }
  }
});
test('OPM-P, the cells: the blend all over, no white gap; no row over a corner', () => {
  for (const [r, facets] of CASES) {
    const { cells } = blockCellsOf([r], { corner: 4, facets, pitch: PITCH_NEW });
    const [O] = outerOf([r], { corner: 4, facets }), A = Math.abs(areaOf(O.pieces.map(g => g.a))), area = cells.reduce((a, c) => a + c.area, 0);
    assert.ok(Math.abs(area - A) < 1e-6 * A, `the cells' area ${area.toFixed(1)} of Key 1 · A's ${A.toFixed(1)}`);
    assert.ok(cells.every(c => areaOf(c.poly) > 0 && c.kinds.length === c.poly.length));
    const lines = new Map();                                                       // a row line, every piece of it in one block
    for (const c of cells) c.kinds.forEach(k => { if (k !== Infinity) (lines.get(k) ?? lines.set(k, new Set()).get(k)).add(`${c.reg}:${c.blk}`); });
    assert.ok([...lines.values()].every(b => b.size === 1 || [...b].every(x => x.endsWith(`:${[...b][0].split(':')[1]}`))), 'a row line one block\'s');
  }
});
test('OPM-P, the lines: every one once, none over another; the rows first, block after block, ↻ or ↺, then the rays', () => {
  for (const [r, facets, res] of CASES) for (const cw of [true, false]) {
    const D = opmpPlan([r], res, { pencils: P, corner: 4, facets, pitch: PITCH_NEW, stripW: PITCH_NEW, cw });
    const segs = D.lines.flatMap(L => L.pts.slice(1).map((b, i) => [L.pts[i], b])), seen = new Set();
    for (const [a, b] of segs) { const ka = keyOfPt(a), kb = keyOfPt(b), k = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`; assert.ok(!seen.has(k), 'a segment drawn twice'); seen.add(k); }
    for (const [a, b] of segs) {                                                     // no piece of a line over another's: its middle on no other segment
      const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      assert.ok(segs.filter(([c, d]) => segDist(m, c, d) < 1e-4).length === 1, `a line over another at ${m.map(v => v.toFixed(1))}`);
    }
    const kinds = D.lines.map(L => L.kind), first = kinds.indexOf('ray');
    assert.ok(first > 10 && kinds.slice(first).every(k => k === 'ray') && kinds.slice(0, first).every(k => k === 'row'), 'the rows, then the rays');
    const centre = L => {                                                            // the region the line lies in: its key's middle
      const m = [(L.pts[0][0] + L.pts[1][0]) / 2, (L.pts[0][1] + L.pts[1][1]) / 2], C = D.cells.find(c => c.poly.some((v, i) => segDist(m, v, c.poly[(i + 1) % c.poly.length]) < 1e-6)), R = D.regions[C.reg];
      return [(R.a.x0 + R.a.x1) / 2, (R.a.y0 + R.a.y1) / 2];
    };
    const turn = L => { const c = centre(L); return L.pts.slice(1).reduce((s, b, i) => s + (L.pts[i][0] - c[0]) * (b[1] - L.pts[i][1]) - (L.pts[i][1] - c[1]) * (b[0] - L.pts[i][0]), 0); };
    assert.ok(D.lines.slice(0, first).every(L => Math.abs(turn(L)) < 1e-6 || (turn(L) < 0) === cw), cw ? 'every row line clockwise' : 'anticlockwise');
    assert.equal(D.modules.length, D.lines.length);
  }
  const merged = opmpPlan([PERSP], QUAD, { pencils: P, corner: 4, facets: 3, pitch: PITCH_NEW, merge: true }), cellsLines = opmpPlan([PERSP], QUAD, { pencils: P, corner: 4, facets: 3, pitch: PITCH_NEW });
  const mm = D => D.modules.reduce((a, M) => a + M.mm, 0);
  assert.ok(mm(merged) < 0.7 * mm(cellsLines), `Merged fewer lines: ${Math.round(mm(merged))} of ${Math.round(mm(cellsLines))} mm`);
});
test('OPM-P, DRAG: a colour at a time, the brush along its own cells, every one of them covered, no white; Rubs the passes', () => {
  for (const [r, facets, res] of CASES) {
    const pitch = PITCH_NEW, D = opmpPlan([r], res, { pencils: P, corner: 4, facets, pitch, stripW: pitch, rubs: 1 });
    assert.ok(D.drags.length >= 3, `${D.drags.length} colours`);
    assert.deepEqual(D.drags.map(q => q.pencil), [...new Set(D.drags.map(q => q.pencil))], 'every colour once');
    const segsOf = id => D.drags.find(q => q.pencil === id)?.strokes.flat() ?? [];
    const mine = (id, q) => D.cells.some(c => c.pencil === id && (inPoly(c.poly, q[0], q[1]) || c.poly.some((v, i) => segDist(q, v, c.poly[(i + 1) % c.poly.length]) < pitch / 2)));
    for (const P_ of D.drags) for (const g of P_.strokes.flat()) {                  // the brush's middle on its own colour's cells — past their end by the slant of a ray at most
      const L = Math.hypot(g.b[0] - g.a[0], g.b[1] - g.a[1]);
      for (let s = 0; s <= L; s += 2) { const q = [g.a[0] + (g.b[0] - g.a[0]) * s / (L || 1), g.a[1] + (g.b[1] - g.a[1]) * s / (L || 1)]; assert.ok(mine(P_.pencil, q), `${P_.pencil}: the brush at ${q.map(v => v.toFixed(1))} on another colour`); }
    }
    let bare = 0, all = 0;                                                            // every cell under the brush of its colour, the brush pitch wide: no white
    for (const c of D.cells.filter(c => c.pencil)) {
      const xs = c.poly.map(q => q[0]), ys = c.poly.map(q => q[1]), sg = segsOf(c.pencil);
      for (let x = Math.min(...xs) + 0.25; x < Math.max(...xs); x += 0.7) for (let y = Math.min(...ys) + 0.25; y < Math.max(...ys); y += 0.7) {
        if (!inPoly(c.poly, x, y)) continue;
        all++; if (!sg.some(g => segDist([x, y], g.a, g.b) <= pitch * FIT / 2 + 1e-6)) bare++;
      }
    }
    assert.equal(bare, 0, `${bare} of ${all} points of the cells bare`);
    assert.ok(D.drags.every(q => q.rows > 0));
    const D4 = opmpPlan([r], res, { pencils: P, corner: 4, facets, pitch, stripW: pitch, rubs: 4 }), mm = X => X.drags.reduce((a, q) => a + q.mm, 0);
    assert.ok(Math.abs(mm(D4) / mm(D) - 4) < 1e-6, `Rubs 4: ${(mm(D4) / mm(D)).toFixed(3)} times Rubs 1`);
  }
  assert.ok(opmpPlan([PERSP], QUAD, { pencils: P, corner: 4, facets: 3, pitch: PITCH_NEW, stripW: PITCH_NEW }).drags.some(q => q.rays > 0), 'the rays\' strips along themselves');
});
test('OPM-P, DRAG on the machine: a colour a row, a pause between, the brush up on the move between strokes, pressed at its own degrees', () => {
  const D = opmpPlan([PERSP], QUAD, { pencils: P, corner: 4, facets: 3, pitch: PITCH_NEW, stripW: PITCH_NEW });
  const R = dragRowsOf(D.drags, P, { cw: 400, ch: 400 }), opts = { ...DEFAULTS, speed: 40, travel: 180, tail: 3, lift: true, ink: false, snake: true, pause: false, rows: R.ps.length, here: { x: 300, y: 300 }, hover: 12 };
  const passes = R.ps.map((ps, k) => ({ key: 'DRAG', ps: [ps], why: k ? 'wipe the brush, squeeze the next colour' : null }));
  const run = plotRun({ ...opts, press: -1.5 }, passes);
  assert.equal(run.fault, '');
  assert.equal(run.blocks.filter(b => b.kind === 'pause').length, D.drags.length - 1);
  assert.equal(R.lifts, D.drags.reduce((a, q) => a + q.strokes.length - 1, 0));
  const ws = run.blocks.flatMap(b => (b.cmds ?? []).filter(c => /^W 2 /.test(c)).map(c => +c.split(' ')[2]));
  assert.equal(Math.min(...ws), -1.5, 'pressed at −1.5°, not 0°');
  assert.deepEqual(plotRun({ ...opts, press: 0 }, passes).blocks, plotRun(opts, passes).blocks, 'no press: 0°, as every other tab');
});
test('OPM-P, Fit the keys (12 = 6 + 6): every side\'s rows the brush exactly, 1, 2, 4 … a band; the keys moved a little, the sausages where they lay; once more, nothing', () => {
  for (const pitch of [PITCH_NEW, 5]) {
    const F = fitKeys(OWNER, pitch), { regions } = blockCellsOf([F.r], { corner: 4, facets: 1, pitch });
    for (const R of regions) for (const B of R.blocks.filter(B => B.side && B.d > pitch / 2)) assert.ok(Math.abs(B.d / B.n - pitch) < 1e-9, `${R.kind} ${R.key}, side ${B.p}: ${(B.d / B.n).toFixed(4)} mm`);
    assert.ok(F.moved.every(q => [q.left, q.right, q.bottom, q.top].every(v => Math.abs(v) <= 30)), `moved ${JSON.stringify(F.moved.map(q => Math.max(...[q.left, q.right, q.bottom, q.top].map(Math.abs)).toFixed(1)))}`);
    assert.ok(F.moved[0].left <= pitch / 2 + 1e-9 && Math.abs(F.r.w / (2 * pitch) - Math.round(F.r.w / (2 * pitch))) < 1e-9, 'Key 1 two brushes a whole number of times, about its middle');
    assert.ok(fitKeys(F.r, pitch).moved.every(q => [q.left, q.right, q.bottom, q.top].every(v => Math.abs(v) < 1e-6)), 'fitted, it stays');
    const [k1] = keysOf(OWNER), [f1] = keysOf(F.r);
    assert.ok(Math.abs(k1.x + k1.w / 2 - (f1.x + f1.w / 2)) < 1e-9, 'Key 1 about its middle');
  }
  const S0 = { ...PERSP }, F = fitKeys(S0, PITCH_NEW), abs = (r, q) => [r.x + q[0] * r.w, r.y + q[1] * r.h];
  S0.ss.forEach((q, i) => assert.ok(Math.hypot(...[0, 1].map(j => abs(S0, q.a)[j] - abs(F.r, F.r.ss[i].a)[j])) < 1e-9, 'a sausage where it lay'));
  const T = fitKeys(cleanRect({ id: 2, x: 10, y: 10, w: 97, h: 50, step: 3 }), PITCH_NEW).r;
  assert.deepEqual([T.w, T.h], [96, 48], 'a tile two brushes a whole number of times');
});
test('OPM-P, FRAME: four marks, one in the middle of every side of Key 1 · A, 80 mm at most, on its line, clockwise; a stroke each, one pencil in', () => {
  assert.equal(FRAME_MARK, 80, 'the owner\'s 8 cm');
  const M = outerOf([OWNER], { corner: 4, facets: 1, pencil: 'black', marks: FRAME_MARK }), [K] = keysOf(OWNER), c = [K.x + K.w / 2, K.y + K.h / 2];
  assert.equal(M.length, 4);
  assert.ok(M.every(m => m.pieces.length === 1 && Math.abs(m.mm - 80) < 1e-9), 'four lines, 80 mm each');
  const mids = M.map(m => [(m.pieces[0].a[0] + m.pieces[0].b[0]) / 2, (m.pieces[0].a[1] + m.pieces[0].b[1]) / 2]);
  assert.deepEqual(mids.map(q => q.map(v => +v.toFixed(6))), [[c[0], K.y + K.h], [K.x + K.w, c[1]], [c[0], K.y], [K.x, c[1]]].map(q => q.map(v => +v.toFixed(6))), 'top, right, bottom, left, each in its side\'s middle, on the line');
  assert.ok(M.every(m => { const g = m.pieces[0]; return (g.a[0] - c[0]) * (g.b[1] - g.a[1]) - (g.a[1] - c[1]) * (g.b[0] - g.a[0]) < 0; }), 'every one clockwise');
  const small = outerOf([cleanRect({ id: 3, x: 10, y: 10, w: 50, h: 120, step: 3 })], { corner: 4, pencil: 'black', marks: FRAME_MARK });
  assert.ok(small.every(m => m.mm <= 80 + 1e-9) && small.some(m => m.mm < 50), 'a side shorter than 80 mm its own length');
  const { run, blocks } = runOf([{ pencil: 'black', strokes: M.map(m => m.pieces), rubs: 4, mm: 320 }]);
  assert.equal(run.fault, '');
  assert.equal(blocks.filter(b => b.kind === 'p-pause').length, 1, 'one pencil in');
  assert.equal(run.turns, 3, 'the pencil up between the four');
});
