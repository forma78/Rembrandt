import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanRect, unitsOf, figuresOf, planOf, linksOf, johnDepths, johnLoop, johnBand, johnRadius, lobesOf, JOHN_W_MAX, traceRows, cutPieces, spokesOf, dealFigure, dragRows, wipeBlocks, INKA_META, lenOf, atPiece, JOHN, figName, BRUSH_NEW, SWELL_NEW } from '../src/inkaplan.js';
import { dragPasses } from '../src/ccdplan.js';
import { DIP_RUN, DIP_LAP } from '../src/band.js';
import { plotRun, DEFAULTS, ELBOW_HOVER } from '../src/strokes.js';

// ST-JOHN's ⌘, St. John's Arms (the owner, 2026-10-19, St_John/): four
// lobes, every loop round all four from the middle, their inner sides on
// across it; the brush 3.5 mm, 9 with paint, on his 40 × 40 canvas.
const O = { cw: 400, ch: 400, brush: BRUSH_NEW, swell: SWELL_NEW, corner: 4, change: 30 };
const RUN = { ...DEFAULTS, speed: 40, travel: 180, tail: 3, lift: false, ink: false, snake: true, pause: false, here: { x: 300, y: 300 }, hover: ELBOW_HOVER, pauseAtEnds: true };
const SIGN = (o = {}) => cleanRect({ id: 1, x: 0, y: 0, w: 400, h: 400, step: 3, kind: JOHN, ...o });
const crs = (a, b) => a[0] * b[1] - a[1] * b[0];

test('a ⌘ as kept; a unit and a figure of its own: it melts into no tile, joins none, no node holds on it', () => {
  assert.equal(SIGN().kind, JOHN); assert.equal(cleanRect({ x: 0, y: 0, w: 10, h: 10 }).kind, undefined);
  assert.equal(SIGN().width, 76, 'a new one\'s loop as he found it best, 74 on 387'); assert.equal(SIGN({ width: 9999 }).width, JOHN_W_MAX); assert.equal(cleanRect({ x: 0, y: 0, w: 10, h: 10, width: 30 }).width, undefined);
  const rs = [SIGN(), cleanRect({ id: 2, x: 300, y: 300, w: 200, h: 50 }), cleanRect({ id: 3, x: 400, y: 0, w: 50, h: 50 })], U = unitsOf(rs);
  assert.equal(U.length, 3, 'over the ⌘, the tile no block with it'); assert.ok(U[0].john && !U[1].john);
  assert.equal(figuresOf(rs, U).length, 3, 'beside it, the tile no figure with it');
  assert.equal(linksOf([{ a: { id: 3, m: 'c' }, b: { id: 1, m: 'w' } }], rs, (() => { const P = planOf(rs, O); return P.units; })()).length, 0);
  assert.match(figName(planOf(rs, O).figs[0], U), /⌘ St\. John's Arms/);
});

test('the loops: a lobe\'s rings, alike in all four, Step apart, the outer by the brush\'s half; Width a lobe\'s half, the innermost the trail wide', () => {
  const P = planOf([SIGN({ width: 100 })], O), U = P.units[0], ds = U.ds;
  assert.deepEqual(ds, johnDepths(U.R).slice(0, ds.length));
  assert.deepEqual(lobesOf(SIGN()).map(q => [q.x, q.y]), [[200, 0], [200, 200], [0, 200], [0, 0]], '1 the bottom right, 2 the top right, 3 the top left, 4 the bottom left');
  assert.equal(ds[0], BRUSH_NEW / 2); assert.equal(ds.length, U.R.levels);
  for (let k = 1; k < ds.length - 1; k++) assert.ok(Math.abs(ds[k] - ds[k - 1] - 3) < 1e-6);
  assert.ok(Math.abs(ds.at(-1) - (100 - (BRUSH_NEW + SWELL_NEW) / 2)) < 1e-6, 'the paint of the innermost meets in the lobe\'s middle');
  assert.ok(ds.length >= 25 && ds.length <= 35, `"25 of them maybe, as the canvas is": ${ds.length}`);
});

test('every loop the ⌘ in one line: round lobe 1, 2, 3, 4, each clockwise, the inner sides straight on across the middle', () => {
  const r = SIGN(), L = johnLoop(r, 10), c = 200;
  // every corner a turn to the right
  L.forEach((v, k) => { const a = L[(k + L.length - 1) % L.length], b = L[(k + 1) % L.length]; assert.ok(crs([v[0] - a[0], v[1] - a[1]], [b[0] - v[0], b[1] - v[1]]) < 0); });
  // lobe 1's inner side up on into lobe 2's, 2's along into 3's, 3's down into 4's, 4's along into 1's
  assert.deepEqual([L[2], L[3]], [[c + 10, 10], [c + 10, 390]]);
  assert.deepEqual([L[5], L[6]], [[390, c + 10], [10, c + 10]]);
  assert.deepEqual([L[8], L[9]], [[c - 10, 390], [c - 10, 10]]);
  assert.deepEqual([L[11], L[0]], [[10, c - 10], [390, c - 10]]);
});

test('the path: lands in the middle, loop after loop inward, an S on lobe 4\'s top, never a corner — the board never stops', () => {
  const P = planOf([SIGN({ width: 100 })], O), F = P.figs[0], ds = P.units[0].ds;
  assert.equal(P.figs.length, 1);
  assert.deepEqual(F.start, [200, 200 - ds[0]], 'from the middle');
  assert.deepEqual(F.end, [200 - ds.at(-1), 200 - ds.at(-1)], 'the last loop closed where it began');
  for (let i = 1; i < F.pieces.length; i++) {
    const a = F.pieces[i - 1], b = F.pieces[i], e = atPiece(a, lenOf(a)), t = atPiece(b, 0).t;
    assert.ok(Math.hypot(e.p[0] - b.a[0], e.p[1] - b.a[1]) < 1e-6 && Math.hypot(e.t[0] - t[0], e.t[1] - t[1]) < 1e-3, `piece ${i} a kink`);
  }
  const S = F.pieces.filter(g => g.t === 'A' && g.r > 10);                         // the S's arcs
  assert.ok(S.length >= 2 * (ds.length - 4), 'a ring change for every loop but the last few, tight in the middle of the lobe');
  assert.ok(S.every(g => g.a[0] < 200 && g.a[1] < 200), 'all on lobe 4, the bottom left');
  assert.ok(F.length > 60000 && F.length < 70000, `${F.length} mm`);
});

// Width (the owner, 2026-10-19: "a slider as in ALU-CUT called WIDTH — there the loop's thickness can be raised")
test('Width: the loop edge to edge, the rings so far in from the outline, a window in every lobe, the grid in the middle 2 Width across', () => {
  const P = planOf([SIGN({ width: 50 })], O), U = P.units[0], ds = U.ds, inner = 50 - BRUSH_NEW / 2, F = P.figs[0];
  assert.equal(ds.at(-1), inner, 'the innermost ring\'s dry edge on the loop\'s inner edge'); assert.equal(U.R.levels, ds.length); assert.equal(ds.length, 17);
  for (let k = 1; k < ds.length - 1; k++) assert.ok(Math.abs(ds[k] - ds[k - 1] - 3) < 1e-6);
  const xs = F.pieces.flatMap(g => [g.a, g.b]);
  assert.ok(!xs.some(p => p[0] > 200 + inner + 1e-6 && p[0] < 400 - inner - 1e-6 && p[1] > inner + 1e-6 && p[1] < 200 - inner - 1e-6), 'lobe 1\'s window clear');
  assert.deepEqual(F.end, [200 - inner, 200 - inner], 'the grid\'s corner, 2 Width less the brush across');
  assert.deepEqual(johnBand([1, 4, 7, 10], 8.6, 3), [1, 4, 7, 8.6]); assert.deepEqual(johnBand([1, 4, 7, 10], 8, 3), [1, 4, 8], "under half a step on: the last moved there"); assert.deepEqual(johnBand([1, 4, 7, 10], 7.6, 3), [1, 4, 7.6]); assert.deepEqual(johnBand([1, 4, 7, 10], 12, 3), [1, 4, 7, 10]); assert.deepEqual(johnBand([1, 4], 0.5, 3), [1]);
  assert.ok(F.length < planOf([SIGN({ width: 100 })], O).figs[0].length * 0.75);
});

// Corners up to 50 (the owner, 2026-10-19): on a ⌘ concentric, as a pipe's lanes
test('the turns concentric: the outer ring\'s Corners, every ring inside its depth less, never under 4 mm; the X from where the paint begins', () => {
  const rs = [SIGN({ width: 50 })], o = { ...O, corner: 50 }, P = planOf(rs, o), U = P.units[0], ds = U.ds, F = P.figs[0];
  assert.equal(johnRadius(50, ds[0], ds[0]), 50); assert.equal(johnRadius(50, ds.at(-1), ds[0]), 4); assert.equal(johnRadius(3, 40, 1), 3);
  const quarter = F.pieces.filter(g => g.t === 'A' && Math.abs(lenOf(g) / g.r - Math.PI / 2) < 1e-6), radii = new Set(quarter.map(g => Math.round(g.r * 1e6) / 1e6));
  for (const d of ds) assert.ok(radii.has(Math.round(johnRadius(50, d, ds[0]) * 1e6) / 1e6), `a loop ${d} mm in, its turns ${johnRadius(50, d, ds[0])}`);
  // the outer arm of lobe 3's top left corner begins on the paint's edge round the turn, not in the box's corner
  const arm = spokesOf(U, rs, o).find(q => Math.hypot(q.a[0], q.a[1] - 400) < 40), C = [ds[0] + 50, 400 - ds[0] - 50];
  assert.ok(Math.abs(Math.hypot(arm.a[0] - C[0], arm.a[1] - C[1]) - (50 + BRUSH_NEW / 2)) < 1e-6);
  assert.equal(spokesOf(U, rs, O).find(q => Math.hypot(q.a[0], q.a[1] - 400) < 40).a[0] < arm.a[0], true, 'at Corners 4 nearer the corner');
  const N = ds.at(-1), RN = johnRadius(50, N, ds[0]), CN = [N + RN, 400 - N - RN];
  assert.ok(Math.abs(Math.hypot(arm.b[0] - CN[0], arm.b[1] - CN[1]) - RN) < 1e-6, 'in to the innermost ring round its turn');
});

// Corners up to 100 (the owner, 2026-10-19, Screenshot 9.24.56 PM, the roundings drawn in blue)
test('Corners 100 on his 43 × 43: round lobes, round windows; past half a ring\'s side the ring a circle; the X across the whole loop', () => {
  const rs = [cleanRect({ id: 1, x: 0, y: 0, w: 430, h: 430, step: 3, kind: JOHN, width: 54 })], o = { ...O, cw: 430, ch: 430, corner: 100 }, P = planOf(rs, o), U = P.units[0], ds = U.ds, F = P.figs[0];
  const quarter = F.pieces.filter(g => g.t === 'A' && Math.abs(lenOf(g) / g.r - Math.PI / 2) < 1e-6), r = quarter.map(g => g.r);
  assert.ok(Math.abs(Math.max(...r) - 100) < 1e-6, 'the outer ring 100 round'); assert.ok(Math.abs(Math.min(...r) - johnRadius(100, ds.at(-1), ds[0])) < 1e-6 && Math.min(...r) > 45, 'the window\'s ring near 50');
  const P4 = planOf([cleanRect({ id: 1, x: 0, y: 0, w: 400, h: 400, step: 3, kind: JOHN })], { ...O, corner: 100 }), big = P4.figs[0].pieces.filter(g => g.t === 'A' && Math.abs(lenOf(g) / g.r - Math.PI / 2) < 1e-6).map(g => g.r);
  assert.ok(Math.abs(Math.max(...big) - (100 - BRUSH_NEW / 2)) < 1e-6, 'on 40 × 40 the outer ring a circle, half its side round');
  // his, Screenshot 9.27.36 PM — 387 × 387.5, Step 7, Width 74, the brush 4.5 and 1 with paint — the windows' rings round, no squares: every turn half its ring's side
  const his = [cleanRect({ id: 1, x: 21, y: 20, w: 387, h: 387.5, step: 7, kind: JOHN, width: 74 })], Ph = planOf(his, { ...O, cw: 430, ch: 430, brush: 4.5, swell: 1, corner: 100 }), Uh = Ph.units[0];
  const turns = Ph.figs[0].pieces.filter(g => g.t === 'A' && Math.abs(lenOf(g) / g.r - Math.PI / 2) < 1e-6);
  for (const d of Uh.ds) assert.ok(turns.some(g => Math.abs(g.r - (193.5 - 2 * d) / 2) < 1e-6), `the ring ${d} mm in a round one`);
  assert.ok(Math.min(...turns.map(g => g.r)) > 24);
  const X = spokesOf(U, rs, o), outer = X.filter(q => Math.hypot(q.a[0] - 215, q.a[1] - 215) > 10);
  assert.equal(X.length, 16); assert.ok(outer.every(q => Math.abs(Math.hypot(q.b[0] - q.a[0], q.b[1] - q.a[1]) - (ds.at(-1) - ds[0] + BRUSH_NEW / 2)) < 1e-6), 'every outer arm across the loop as thick as on a side: the outer paint\'s edge to the innermost ring');
});

test('↺: the sign mirrored, lobe 1 the bottom left', () => {
  const P = planOf([SIGN({ turn: 'ccw' })], O), F = P.figs[0], first = F.pieces.find(g => g.t === 'A');
  assert.ok(first.a[0] < 200, 'the first turn on the left');
  assert.ok(F.pieces.filter(g => g.t === 'A' && Math.abs(lenOf(g) / g.r - Math.PI / 2) < 1e-6).every(g => g.left), 'every corner, a quarter turn, to the left');
});

test('the sausages: an X on every lobe; one paint or two, the second on lobes 2 and 4', () => {
  const rs = [SIGN()], P = planOf(rs, O), U = P.units[0], X = spokesOf(U, rs, O);
  assert.equal(X.length, 16);
  lobesOf(rs[0]).forEach((q, k) => X.slice(4 * k, 4 * k + 4).forEach(s => [s.a, s.b].forEach(p => assert.ok(p[0] >= q.x && p[0] <= q.x + q.w && p[1] >= q.y && p[1] <= q.y + q.h))));
  let two = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const d = dealFigure(rs, P.units, P.figs[0], INKA_META.Inka, seed, 'colours', O), ss = d.ss.get(0), paints = [...new Set(ss.map(q => q.paint))];
    assert.ok(paints.length === 1 || paints.length === 2);
    if (paints.length === 2) {
      two++;
      const at = q => { const m = [(q.a[0] + q.b[0]) * 200, (q.a[1] + q.b[1]) * 200]; return (m[0] - 200) * (m[1] - 200) > 0; };   // the fractions back to mm: lobes 2 and 4
      assert.equal(new Set(ss.filter(at).map(q => q.paint)).size, 1); assert.equal(new Set(ss.filter(q => !at(q)).map(q => q.paint)).size, 1);
    }
  }
  assert.ok(two > 5 && two < 35, `${two} of 40 in two paints`);
});

test('DRAG runs the ⌘ as one row, the brush down all the way, no stop; a wipe before a tile after it', () => {
  const rs = [SIGN(), cleanRect({ id: 2, x: -50, y: -50, w: 40, h: 40 })], P = planOf(rs, O), R = dragRows(P, O);
  assert.equal(R.runs, 2); assert.equal(R.stops.length, 1);
  const r = plotRun({ ...RUN, rows: R.ps.length }, dragPasses(R));
  assert.equal(r.fault, '');
  assert.equal(wipeBlocks(r.blocks).filter(b => b.wipe).length, 1);
});

// TRACE in MARKS' place (the owner, 2026-10-19, St_John/ Screenshot 8.50.53 PM: "see that it coincides perfectly with DRAG … the same brush in water, only slightly tinted")
test('TRACE: DRAG\'s very line — whole without ink, cut where the dips fall with it, each stretch on from DIP_LAP back, every piece on DRAG\'s', () => {
  const rs = [SIGN(), cleanRect({ id: 2, x: -60, y: 0, w: 50, h: 50 })], o = { ...O, corner: 100 }, P = planOf(rs, o), D = dragRows(P, o);
  const dry = traceRows(P, { ...o, ink: false }), key = ps => JSON.stringify(ps.map(p => p.map(g => [g.t, g.a, g.b, g.c, g.d])));
  assert.equal(key(dry.ps), key(D.ps), 'without ink the very rows DRAG runs, a figure a row');
  const wet = traceRows(P, { ...o, ink: true, tail: 3 }), F = P.figs[0], n = Math.ceil((F.length - DIP_RUN / 4) / DIP_RUN);
  const mine = wet.info.filter(q => q.fi === 0);
  assert.equal(mine.length, n, `${n} stretches on the ⌘'s ${Math.round(F.length)} mm`);
  assert.ok(mine.slice(0, -1).every((q, j) => Math.abs(q.L - (j ? DIP_RUN + DIP_LAP : DIP_RUN)) < 1e-6), 'a dip carries DIP_RUN, each next on from DIP_LAP back');
  assert.ok(Math.abs(mine.reduce((a, q) => a + q.L, 0) - (F.length + DIP_LAP * (n - 1))) < 1e-6, 'all of the line, nothing left out');
  // every stretch's pieces on DRAG's: a cut line on its line, a cut arc on its circle
  for (const [j, at] of wet.at.entries()) assert.ok(j === 0 || P.figs.some(G => G.pieces.some(g => g.t === 'L' ? Math.abs((g.b[0] - g.a[0]) * (at[1] - g.a[1]) - (g.b[1] - g.a[1]) * (at[0] - g.a[0])) < 1e-6 * Math.hypot(g.b[0] - g.a[0], g.b[1] - g.a[1]) : Math.abs(Math.hypot(at[0] - g.c[0], at[1] - g.c[1]) - g.r) < 1e-6)));
  const cut = cutPieces(F.pieces, 1000, 3000);
  assert.ok(Math.abs(cut.reduce((a, g) => a + lenOf(g), 0) - 2000) < 1e-6);
  const r = plotRun({ ...RUN, rows: wet.ps.length, ink: true, cup: { x: 100, y: 100, dip: 20, rim: 30, dwell: 1 }, noDipUnder: 0 }, [{ key: 'TRACE', ps: wet.ps, why: null }]);
  assert.equal(r.fault, ''); assert.equal(r.dips, wet.ps.length, 'a dip before every stretch');
});
