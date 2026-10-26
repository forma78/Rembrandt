import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanRect, unitsOf, figuresOf, planOf, linksOf, dealFigure, dealFigures, dragRows, wipeBlocks, marksRows, simOf, spokesOf, figSausages, figName, INKA_META, lenOf, atPiece, BRUSH_NEW, SWELL_NEW, CORNER_NEW, trailOf, edgeOf, blendQuota, clouds, CLOUD_NB, BLEND_THIN, paletteOfPixels, barsOf } from '../src/inkaplan.js';
import { BLEND, BLEND_1554, STEPS_NEW, STEPS_MAX, KEY_CORNER_MIN, keysOf, keyIn, shapesOf, turnOf, loopOf, coreDepths, seamSide, blendLoops, spokeGap } from '../src/blendplan.js';
import { PAINT } from '../src/tapeplan.js';
import { linOf, toSrgb } from '../src/color.js';
import { dragPasses } from '../src/ccdplan.js';
import { plotRun, DEFAULTS, ELBOW_HOVER } from '../src/strokes.js';

// BLEND, Illustrator's blend for the machine (the owner, 2026-10-26, BLEND/):
// IMG_1554 — a square, a square three eighths of it against its top, the
// orange core against that one's bottom, 13 steps between each two — on a
// 40 × 40 canvas, the brush 3.5 mm, 9 with paint.
const O = { cw: 400, ch: 400, brush: BRUSH_NEW, swell: SWELL_NEW, corner: 4, change: 30, density: 50 };
const RUN = { ...DEFAULTS, speed: 40, travel: 180, tail: 3, lift: false, ink: false, snake: true, pause: false, here: { x: 300, y: 300 }, hover: ELBOW_HOVER, pauseAtEnds: true };
const SIDE = BLEND_1554.side * 400, AT = (400 - SIDE) / 2;
const MIX = (o = {}) => cleanRect({ id: 1, x: AT, y: AT, w: SIDE, h: SIDE, step: 3, kind: BLEND, ...o });
const near = (a, b, e = 1e-6) => Math.abs(a - b) < e;

test('a blend as kept: IMG_1554\'s keys in A\'s fractions, one corner 3.86 % of A, 13 steps, the core filled', () => {
  const r = MIX();
  assert.equal(r.kind, BLEND); assert.equal(r.steps, STEPS_NEW); assert.equal(r.core, true);
  assert.deepEqual(r.keys, BLEND_1554.keys); assert.equal(r.corners.length, 3); assert.ok(r.corners.every(c => c === Math.round(0.0386 * SIDE * 2) / 2));
  assert.equal(MIX({ steps: 9999 }).steps, STEPS_MAX); assert.equal(MIX({ steps: 4.4 }).steps, 4); assert.equal(MIX({ corners: [0, 0, 0] }).corners[0], KEY_CORNER_MIN); assert.equal(MIX({ core: false }).core, false);
  assert.deepEqual(MIX({ keys: [{ x: 0.1, y: 0.1, w: 0.2, h: 0.3 }, { x: 0, y: 0, w: 0, h: 1 }] }).keys, [{ x: 0.1, y: 0.1, w: 0.2, h: 0.3 }], 'a key with no size dropped');
  const t = cleanRect({ x: 0, y: 0, w: 10, h: 10, keys: [{ x: 0, y: 0, w: 1, h: 1 }], steps: 3 });
  assert.equal(t.kind, undefined); assert.equal(t.keys, undefined); assert.equal(t.steps, undefined);
  const K = keysOf(r);
  assert.ok(near(K[1].y + K[1].h, AT + SIDE, 0.2), 'the second against A\'s top'); assert.ok(near(K[2].y, K[1].y), 'the core against its bottom');
  assert.ok(near(K[1].x + K[1].w / 2, 200, 0.2) && near(K[2].x + K[2].w / 2, 200, 0.2), 'all three on the middle');
  assert.deepEqual(Object.values(keyIn(r, K[2])).map(v => Math.round(v * 1e6) / 1e6), Object.values(BLEND_1554.keys[1]));
});

test('a unit and a figure of its own: it melts into no tile, joins none, no node holds on it', () => {
  const rs = [MIX(), cleanRect({ id: 2, x: 300, y: 300, w: 80, h: 50 }), cleanRect({ id: 3, x: AT + SIDE, y: AT, w: 40, h: 40 })], U = unitsOf(rs);
  assert.equal(U.length, 3, 'over the blend, the tile no block with it'); assert.ok(U[0].blend && !U[1].blend);
  assert.equal(figuresOf(rs, U).length, 3, 'beside it, the tile no figure with it');
  const P = planOf(rs, O);
  assert.equal(linksOf([{ a: { id: 3, m: 'c' }, b: { id: 1, m: 'w' } }], rs, P.units).length, 0);
  assert.match(figName(P.figs[0], P.units), /a blend$/); assert.match(figName(P.figs[1], P.units), /a blend's core$/);
});

test('the shapes: the keys and Steps between every two, their edges and corner evenly; IMG_1554\'s outer ones sharing A\'s top, the inner ones the middle key\'s bottom', () => {
  const r = MIX(), S = shapesOf(r), K = keysOf(r);
  assert.equal(S.length, 2 * (STEPS_NEW + 1) + 1, '29');
  assert.deepEqual(S.map((s, i) => s.key).filter(k => k >= 0), [0, 1, 2]); assert.equal(S[14].key, 1); assert.equal(S.at(-1).key, 2);
  assert.ok(near(S[0].x0, K[0].x) && near(S.at(-1).y1, K[2].y + K[2].h));
  for (let i = 1; i < 14; i++) {
    assert.ok(near(S[i].y1, S[0].y1), 'the outer steps\' tops on A\'s'); assert.ok(near(S[i].y0 - S[i - 1].y0, S[1].y0 - S[0].y0), 'their bottoms evenly');
    assert.ok(near(S[14 + i].y0, S[14].y0), 'the inner steps\' bottoms on the middle key\'s');
  }
  const bottom = S[1].y0 - S[0].y0, sideStep = S[1].x0 - S[0].x0, top = S[14].y1 - S[15].y1;
  assert.ok(bottom > 13 && bottom < 14, `${bottom} mm a step at the bottom — his 38 px`); assert.ok(sideStep > 6.5 && sideStep < 7, `${sideStep} at the sides — his 19`); assert.ok(top > 4.9 && top < 5.3, `${top} on the inner tops — his 14`);
  assert.equal(turnOf(11.7, 1.75), 11.7 - 1.75); assert.equal(turnOf(5, 3), CORNER_NEW, 'never under 4 mm'); assert.equal(turnOf(2, 1.75), 2, 'or the corner itself, if less');
  assert.equal(loopOf({ x0: 0, y0: 0, x1: 3, y1: 50, c: 1 }, 1.5), null, 'no room');
  assert.ok(near(loopOf({ x0: 0, y0: 0, x1: 20, y1: 50, c: 30 }, 1).r, 9), 'no more than half a side');
});

test('the line: every loop one after another, the outermost first, round to where it began; the S on the side the loops lie nearest — IMG_1554\'s top — never a kink, the board never stops', () => {
  const P = planOf([MIX()], O), F = P.figs[0], B = blendLoops(MIX(), { trail: 9, edge: BRUSH_NEW / 2 }), L = B.loops;
  assert.equal(P.figs.length, 2); assert.equal(L.length, 28, 'every shape but the core'); assert.equal(F.rings, 28);
  assert.equal(seamSide(L), 'top'); assert.equal(P.units[0].BP.side, 'top');
  assert.ok(near(F.start[1], L[0].y1), 'lands on A\'s loop, on its top');
  for (let i = 1; i < F.pieces.length; i++) {
    const a = F.pieces[i - 1], b = F.pieces[i], e = atPiece(a, lenOf(a)), t = atPiece(b, 0).t;
    assert.ok(Math.hypot(e.p[0] - b.a[0], e.p[1] - b.a[1]) < 1e-6 && Math.hypot(e.t[0] - t[0], e.t[1] - t[1]) < 1e-3, `piece ${i} a kink`);
  }
  const quarter = F.pieces.filter(g => g.t === 'A' && near(lenOf(g) / g.r, Math.PI / 2));
  assert.equal(quarter.length, 4 * 28, 'four turns a loop'); assert.ok(quarter.every(g => !g.left), 'clockwise');
  assert.ok(quarter.every((g, k) => k < 4 || Math.abs(g.c[0] - 200) <= Math.abs(quarter[k - 4].c[0] - 200) + 1e-6), 'every loop no wider than the one before');
  assert.ok(quarter.every(g => g.r >= turnOf(MIX().corners[0], BRUSH_NEW / 2) - 1e-6));
  const S = F.pieces.filter(g => g.t === 'A' && !near(lenOf(g) / g.r, Math.PI / 2));     // the S's arcs: the inner steps' only, the outer ones' tops one line
  assert.equal(S.length, 2 * 13); assert.ok(S.every(g => g.a[1] > 280 && near((g.a[0] + g.b[0]) / 2, 200, 15)), 'on the tops, over the core, one under another');
  assert.ok(F.length > 15000 && F.length < 16500, `${F.length} mm`);
});

test('the core: a figure of its own right after the loops, from its middle out, its rings Step apart, the innermost\'s paint meeting in the middle', () => {
  const r = MIX(), P = planOf([r], O), C = P.figs[1], K = keysOf(r)[2], ds = coreDepths({ x0: K.x, y0: K.y, x1: K.x + K.w, y1: K.y + K.h }, { trail: 9, edge: BRUSH_NEW / 2, step: 3 });
  assert.ok(C.core); assert.ok(['x', 'y', 'w', 'h'].every(k => near(C.box[k], K[k]))); assert.equal(C.rings, ds.length);
  assert.equal(ds[0], BRUSH_NEW / 2); assert.ok(near(ds.at(-1), K.w / 2 - 4.5)); assert.ok(ds.slice(1, -1).every((d, k) => near(d - ds[k], 3)));
  assert.ok(Math.hypot(C.start[0] - 200, C.start[1] - (K.y + K.h / 2)) < 6, 'from the middle');
  assert.ok(near(C.end[1], K.y + K.h - BRUSH_NEW / 2), 'out to its outer ring, on its top');
  const turned = C.pieces.reduce((s, g) => s + (g.t === 'A' ? (g.left ? 1 : -1) * lenOf(g) / g.r : 0), 0);   // the innermost too small for an S: a step down there, one turn left
  assert.ok(near(turned, -2 * Math.PI * ds.length, 0.6), `clockwise out, a turn a ring: ${turned}`);
  const R = dragRows(P, O); assert.equal(R.runs, 2); assert.equal(R.stops.length, 1, 'a wipe before the core');
  assert.equal(planOf([MIX({ core: false })], O).figs.length, 1, 'the core off: the line on round it');
  assert.equal(planOf([MIX({ core: false })], O).figs[0].rings, 29);
  assert.deepEqual(coreDepths({ x0: 0, y0: 0, x1: 6, y1: 6 }, { trail: 9, edge: 1.75, step: 3 }), [1.75], 'narrower than the trail: one ring');
});

test('↺ mirrored; a key off the middle: the S\'s on the side the loops lie nearest', () => {
  const P = planOf([MIX({ turn: 'ccw' })], O), q = P.figs[0].pieces.filter(g => g.t === 'A' && near(lenOf(g) / g.r, Math.PI / 2));
  assert.ok(q.every(g => g.left), '↺, every corner to the left');
  const R = MIX({ keys: [{ x: 0.62, y: 0.4, w: 0.18, h: 0.2 }], corners: [40, 12], steps: 20 }), PR = planOf([R], O);
  assert.equal(PR.units[0].BP.side, 'right');
  const S = PR.figs[0].pieces.filter(g => g.t === 'A' && !near(lenOf(g) / g.r, Math.PI / 2));
  assert.ok(S.length >= 2 * 19 && S.every(g => g.a[0] > 280), 'on the right sides');
  const radii = PR.figs[0].pieces.filter(g => g.t === 'A' && near(lenOf(g) / g.r, Math.PI / 2)).map(g => g.r);
  assert.ok(near(Math.max(...radii), 40 - BRUSH_NEW / 2) && Math.min(...radii) < 12, 'the corners from A\'s to the core\'s');
});

// The reference IMAGE 2026-10-26 11:55:05 as the tints read it (Claude's run of it)
const PAL_1155 = { name: 'Reference', core: ['white', 'roseazo', 'purple', 'ultramarine', 'pink', 'p04'], accent: ['orange', 'black', 'magenta'], w: { white: 0.368, roseazo: 0.136, purple: 0.119, ultramarine: 0.098, pink: 0.05, p04: 0.046 }, spot: 'oyellow' };
const mid = q => [(q.a[0] + q.b[0]) / 2, (q.a[1] + q.b[1]) / 2];

test('the sausages: spokes all round, no further apart than the paint carries, from A\'s loop across every loop to the last, in pieces; the core\'s own X', () => {
  const rs = [MIX()], P = planOf(rs, O), U = P.units[0], X = spokesOf(U, rs, O), K = keysOf(rs[0]), L = blendLoops(rs[0], { trail: trailOf(O), edge: edgeOf(O) }).loops, gap = spokeGap(50);
  assert.ok(gap > 70 && gap < 121, `${gap} mm: between the line full and the paint gone at 50 %`);
  const loops = X.filter(q => !q.core), ms = [...new Set(loops.map(q => q.m))];
  assert.equal(ms.length, 16, 'four a side on a 40 × 40'); assert.equal(X.filter(q => q.core).length, 4);
  assert.ok(loops.every(q => Math.hypot(q.b[0] - q.a[0], q.b[1] - q.a[1]) <= gap + 1e-6), 'no piece longer than the gap');
  for (const q of loops) for (const p of [q.a, q.b]) assert.ok(p[0] > K[0].x && p[0] < K[0].x + K[0].w && p[1] > K[0].y && p[1] < K[0].y + K[0].h);
  for (const q of X.filter(q => q.core)) for (const p of [q.a, q.b]) assert.ok(p[0] > K[2].x && p[0] < K[2].x + K[2].w && p[1] > K[2].y && p[1] < K[2].y + K[2].h, 'the core\'s inside it');
  const first = m => loops.filter(q => q.m === m).sort((a, b) => a.j - b.j);
  for (const m of ms) { const sp = first(m); sp.forEach((q, k) => assert.equal(q.j, k)); for (let k = 1; k < sp.length; k++) assert.ok(Math.hypot(sp[k].a[0] - sp[k - 1].b[0], sp[k].a[1] - sp[k - 1].b[1]) < 1e-6, 'a spoke one line, piece to piece'); }
  const L0 = L[0], k0 = L0.r * (1 - Math.SQRT1_2);
  assert.ok(Math.hypot(first(0)[0].a[0] - (L0.x0 + k0), first(0)[0].a[1] - (L0.y1 - k0)) < 1e-6, 'phase 0: the first on the top left corner\'s apex, as the X\'s arm');
  for (let m = 0; m < 16; m++) { const a = first(m)[0].a, b = first((m + 1) % 16)[0].a; assert.ok(Math.hypot(b[0] - a[0], b[1] - a[1]) <= gap + 1e-6, 'round A\'s loop no further apart than the gap'); }
  const Ln = L.at(-1), onLast = p => Math.min(Math.abs(p[0] - Ln.x0), Math.abs(p[0] - Ln.x1), Math.abs(p[1] - Ln.y0), Math.abs(p[1] - Ln.y1)) < Ln.r + 1e-6;
  assert.ok(ms.every(m => onLast(first(m).at(-1).b)), 'every spoke on to the last loop');
  const half = spokesOf(U, [{ ...rs[0], phase: 0.5 }], O).filter(q => !q.core && q.j === 0);
  assert.ok(half.every(q => Math.hypot(q.a[0] - (L0.x0 + k0), q.a[1] - (L0.y1 - k0)) > 10), 'phase ½: moved on along the sides, none on the apex');
  assert.equal(new Set(spokesOf(U, rs, { ...O, density: 30 }).filter(q => !q.core).map(q => q.m)).size, 24, 'thinner paint, the spokes nearer');
});

test('the paints in patches: every paint its share of the sausages, an accent BLEND_THIN, thin; grown together; the core the spot; a press a new deal', () => {
  const rs = [MIX()], P = planOf(rs, O), n = spokesOf(P.units[0], rs, O).filter(q => !q.core).length, Q = new Map(blendQuota(PAL_1155, n));
  assert.equal([...Q.values()].reduce((s, v) => s + v, 0), n);
  assert.equal(Q.get('orange'), Math.max(1, Math.round(n * BLEND_THIN)));
  assert.ok(Q.get('white') >= Q.get('roseazo') && Q.get('roseazo') >= Q.get('pink'), 'by the shares');
  const deals = [1, 2, 3].map(seed => dealFigure(rs, P.units, P.figs[0], PAL_1155, seed, 'colours', O).ss.get(0));
  for (const ss of deals) {
    const lo = ss.filter(q => !q.core), count = {};
    for (const q of lo) count[q.paint] = (count[q.paint] || 0) + 1;
    for (const [p, c] of Q) assert.equal(count[p], c, `${p}: its share`);
    assert.ok(ss.filter(q => q.core).every(q => q.paint === 'oyellow'), 'the core the spot');
    assert.ok(lo.every(q => !!q.thin === ['orange', 'black', 'magenta'].includes(q.paint)), 'the accents thin');
    const pts = lo.map(mid), d = (i, j) => Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
    const together = lo.filter((q, i) => Q.get(q.paint) < 2 || pts.map((_, j) => j).filter(j => j !== i).sort((x, y) => d(i, x) - d(i, y)).slice(0, CLOUD_NB).some(j => lo[j].paint === q.paint)).length;
    assert.ok(together >= 0.85 * lo.length, `${together} of ${lo.length} beside one of their own paint`);
  }
  assert.notDeepEqual(deals[0].map(q => q.paint), deals[1].map(q => q.paint), 'a press, a new deal');
  const inka = dealFigure(rs, P.units, P.figs[0], INKA_META.Inka, 4, 'colours', O).ss.get(0), ci = {};
  for (const q of inka.filter(q => !q.core && !q.thin)) ci[q.paint] = (ci[q.paint] || 0) + 1;
  assert.ok(Math.max(...Object.values(ci)) - Math.min(...Object.values(ci)) <= 1, 'no shares: the core paints alike');
  assert.ok(inka.filter(q => q.core).every(q => q.paint === 'brown'), 'the core Inka\'s pure paint');
  const ss = deals[0]; rs[0].ss = ss;
  assert.deepEqual(dealFigure(rs, P.units, P.figs[0], INKA_META['meta 1'], 99, 'spokes', O).ss.get(0).map(q => q.paint), ss.map(q => q.paint), 'New spokes, the places the same: the paints the same');
  const moved = dealFigure([{ ...rs[0], phase: 0.5 }], P.units, P.figs[0], INKA_META['meta 1'], 99, 'spokes', O).ss.get(0);
  assert.ok(moved.every(q => PAL_1155.core.concat(PAL_1155.accent, 'oyellow').includes(q.paint)), 'moved on: each the paint of the old one nearest');
  rs[0].ss = [{ a: [0.1, 0.1], b: [0.3, 0.3], paint: 'pink' }, { a: [0.5, 0.7], b: [0.5, 0.6], paint: 'black', core: true }];
  assert.equal(dealFigure(rs, P.units, P.figs[0], PAL_1155, 5, 'colours', O).ss.get(0).length, n + 4, 'an X from before laid anew as spokes');
  assert.equal(dealFigure(rs, P.units, P.figs[1], INKA_META.Inka, 3, 'colours', O).ss.size, 0, 'the core\'s figure: nothing on its own');
  assert.equal(dealFigures(rs, P.units, P.figs, PAL_1155, 5, 'colours', O).ss.get(0).length, n + 4, 'all the figures at once: the blend dealt once');
  const noCore = MIX({ core: false }), Pn = planOf([noCore], O), sn = dealFigure([noCore], Pn.units, Pn.figs[0], PAL_1155, 2, 'colours', O).ss.get(0);
  assert.equal(sn.filter(q => q.paint === 'oyellow').length, 1, 'no core: the spot one sausage');
});

test('patches: the counts kept, whatever the points; one paint, one patch', () => {
  const pts = Array.from({ length: 60 }, (_, i) => [i % 10 * 10, Math.floor(i / 10) * 10]);
  let s = 1; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const out = clouds(pts, [['pink', 30], ['purple', 20], ['black', 10]], r), c = {};
  for (const p of out) c[p] = (c[p] || 0) + 1;
  assert.deepEqual(c, { pink: 30, purple: 20, black: 10 });
  assert.deepEqual(clouds(pts.slice(0, 5), [['sky', 5]], r), Array(5).fill('sky'));
});

test('the reference read in tints: a pale colour its paint thin over the white, the rest White\'s; a phone\'s bar off', () => {
  const W = linOf(PAINT.white.hex), pale = linOf(PAINT.roseazo.hex).map((v, k) => Math.round(toSrgb(v * 0.25 + W[k] * 0.75) * 255));
  const w = 40, h = 100, px = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) { const y = Math.floor(i / w), c = y < 4 ? (i % w > 30 ? [250, 250, 250] : [58, 58, 60]) : pale; px.set([...c, 255], 4 * i); }
  assert.deepEqual(barsOf(px, w, h), { top: 4, bottom: 0 }, 'the status bar, the time on grey');
  const t = paletteOfPixels(px, w, h, { tints: true });
  assert.deepEqual(t.core, ['white', 'roseazo']); assert.ok(Math.abs(t.w.white - 0.75) < 0.02 && Math.abs(t.w.roseazo - 0.25) < 0.02, JSON.stringify(t.w));
  assert.ok(!paletteOfPixels(px, w, h).core.includes('roseazo'), 'read plain, a pale pink is no Rose Azo');
  const tall = px.slice(); for (let i = 0; i < w * 20; i++) tall.set([58, 58, 60, 255], 4 * i);
  assert.deepEqual(barsOf(tall, w, h), { top: 0, bottom: 0 }, 'a fifth of the picture one colour: the picture\'s own');
});

test('MARKS, the Result, DRAG: every sausage once, in its figure; one row a figure, a wipe between, the run whole', () => {
  const rs = [MIX()], P = planOf(rs, O);
  rs[0].ss = dealFigure(rs, P.units, P.figs[0], INKA_META.Inka, 11, 'colours', O).ss.get(0);
  const n = rs[0].ss.length;
  assert.equal(figSausages(P.figs[0], P.units, rs).length, n - 4); assert.equal(figSausages(P.figs[1], P.units, rs).length, 4);
  assert.ok(figSausages(P.figs[1], P.units, rs).every(q => q.core));
  assert.equal(marksRows(P, rs, O).marks, n);
  const sim = simOf(P, rs, { ...O, density: 50, h: 2 });
  const each = rs[0].ss.reduce((t, q) => t + simOf(P, [{ ...rs[0], ss: [q] }], { ...O, density: 50, h: 2 }).squeezed(), 0);
  assert.ok(sim.squeezed() > 0 && Math.abs(sim.squeezed() - each) < 0.05 * each, 'squeezed once, not twice');
  sim.advance(Infinity); assert.ok(sim.onCanvas() > 0);
  const R = dragRows(P, O), run = plotRun({ ...RUN, rows: R.ps.length }, dragPasses(R));
  assert.equal(run.fault, ''); assert.equal(wipeBlocks(run.blocks).filter(b => b.wipe).length, 1);
  assert.ok(run.seconds > 6 * 60 && run.seconds < 12 * 60, `${run.seconds} s`);
  assert.ok(trailOf(O) === 9);
});
