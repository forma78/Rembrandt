import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanRect, unitsOf, figuresOf, planOf, linksOf, dealFigure, dealFigures, dragRows, wipeBlocks, marksRows, simOf, spokesOf, figSausages, figName, INKA_META, lenOf, atPiece, BRUSH_NEW, SWELL_NEW, CORNER_NEW, trailOf } from '../src/inkaplan.js';
import { BLEND, BLEND_1554, STEPS_NEW, STEPS_MAX, KEY_CORNER_MIN, keysOf, keyIn, shapesOf, turnOf, loopOf, coreDepths, seamSide, blendLoops } from '../src/blendplan.js';
import { dragPasses } from '../src/ccdplan.js';
import { plotRun, DEFAULTS, ELBOW_HOVER } from '../src/strokes.js';

// BLEND, Illustrator's blend for the machine (the owner, 2026-10-26, BLEND/):
// IMG_1554 — a square, a square three eighths of it against its top, the
// orange core against that one's bottom, 13 steps between each two — on a
// 40 × 40 canvas, the brush 3.5 mm, 9 with paint.
const O = { cw: 400, ch: 400, brush: BRUSH_NEW, swell: SWELL_NEW, corner: 4, change: 30 };
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

test('the sausages: an X along every corner\'s way through the loops\' turns, the outer half and the inner; the core\'s own X', () => {
  const rs = [MIX()], P = planOf(rs, O), U = P.units[0], X = spokesOf(U, rs, O), K = keysOf(rs[0]);
  assert.equal(X.length, 12); assert.equal(X.filter(q => q.inner).length, 4); assert.equal(X.filter(q => q.core).length, 4);
  for (const q of X.filter(q => !q.core)) for (const p of [q.a, q.b]) assert.ok(p[0] > K[0].x && p[0] < K[0].x + K[0].w && p[1] > K[0].y && p[1] < K[0].y + K[0].h);
  for (const q of X.filter(q => q.core)) for (const p of [q.a, q.b]) assert.ok(p[0] > K[2].x && p[0] < K[2].x + K[2].w && p[1] > K[2].y && p[1] < K[2].y + K[2].h, 'the core\'s inside it');
  const top = X.filter(q => !q.core && !q.inner && near(q.a[1], q.b[1]));
  assert.equal(top.length, 2, 'the outer top arms along A\'s top, where the outer loops run on one line');
  const two = MIX({ keys: [{ x: 0.4, y: 0.4, w: 0.2, h: 0.2 }] }), X2 = spokesOf(planOf([two], O).units[0], [two], O);
  assert.equal(X2.filter(q => !q.core).length, 8, 'two keys: every arm cut in its middle'); assert.equal(X2.filter(q => q.inner).length, 4);
});

test('the paints: the loops\' two, outer and inner, its core another — the spot where there is one; New spokes keeps each part\'s; the core\'s figure dealt with its loops\'', () => {
  const rs = [MIX()], P = planOf(rs, O);
  let twos = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const ss = dealFigure(rs, P.units, P.figs[0], INKA_META.Inka, seed, 'colours', O).ss.get(0);
    assert.equal(ss.length, 12);
    const outer = new Set(ss.filter(q => !q.core && !q.inner).map(q => q.paint)), inner = new Set(ss.filter(q => q.inner).map(q => q.paint)), core = new Set(ss.filter(q => q.core).map(q => q.paint));
    assert.ok(outer.size === 1 && inner.size === 1 && core.size === 1);
    assert.equal([...core][0], 'brown', 'the core Inka\'s pure paint');
    if ([...outer][0] !== [...inner][0]) twos++;
  }
  assert.ok(twos > 20 && twos < 40, `${twos} of 40 in two paints`);
  const spot = { ...INKA_META.Inka, spot: 'turquoise' }, ss = dealFigure(rs, P.units, P.figs[0], spot, 7, 'colours', O).ss.get(0);
  assert.ok(ss.filter(q => q.core).every(q => q.paint === 'turquoise'), 'the core the spot');
  rs[0].ss = ss;
  const again = dealFigure(rs, P.units, P.figs[0], INKA_META['meta 1'], 99, 'spokes', O).ss.get(0);
  for (const part of [q => q.core, q => q.inner, q => !q.core && !q.inner]) assert.deepEqual(new Set(again.filter(part).map(q => q.paint)), new Set(ss.filter(part).map(q => q.paint)));
  assert.equal(dealFigure(rs, P.units, P.figs[1], INKA_META.Inka, 3, 'colours', O).ss.size, 0, 'the core\'s figure: nothing on its own');
  assert.equal(dealFigures(rs, P.units, P.figs, INKA_META.Inka, 5, 'colours', O).ss.get(0).length, 12, 'all the figures at once: the blend dealt once');
});

test('MARKS, the Result, DRAG: every sausage once, in its figure; one row a figure, a wipe between, the run whole', () => {
  const rs = [MIX()], P = planOf(rs, O);
  rs[0].ss = dealFigure(rs, P.units, P.figs[0], INKA_META.Inka, 11, 'colours', O).ss.get(0);
  assert.equal(figSausages(P.figs[0], P.units, rs).length, 8); assert.equal(figSausages(P.figs[1], P.units, rs).length, 4);
  assert.ok(figSausages(P.figs[1], P.units, rs).every(q => q.core));
  assert.equal(marksRows(P, rs, O).marks, 12);
  const sim = simOf(P, rs, { ...O, density: 50, h: 2 });
  const one = simOf(P, [{ ...rs[0], ss: rs[0].ss.slice(0, 1) }], { ...O, density: 50, h: 2 }).squeezed();
  assert.ok(sim.squeezed() > 0 && sim.squeezed() < 13 * one * 3, 'squeezed once, not twice');
  sim.advance(Infinity); assert.ok(sim.onCanvas() > 0);
  const R = dragRows(P, O), run = plotRun({ ...RUN, rows: R.ps.length }, dragPasses(R));
  assert.equal(run.fault, ''); assert.equal(wipeBlocks(run.blocks).filter(b => b.wipe).length, 1);
  assert.ok(run.seconds > 6 * 60 && run.seconds < 12 * 60, `${run.seconds} s`);
  assert.ok(trailOf(O) === 9);
});
