import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanRect, unitsOf, figuresOf, planOf, linksOf, dealFigure, dealFigures, dragRows, wipeBlocks, marksRows, simOf, spokesOf, figSausages, figName, INKA_META, lenOf, atPiece, BRUSH_NEW, SWELL_NEW, CORNER_NEW, trailOf, edgeOf, blendQuota, clouds, CLOUD_NB, BLEND_THIN, paletteOfPixels, barsOf } from '../src/inkaplan.js';
import { BLEND, BLEND_1554, STEPS_NEW, STEPS_MAX, KEY_CORNER_MIN, keysOf, keyIn, shapesOf, turnOf, loopOf, coreDepths, seamSide, blendLoops, spokeGap, spokesRound, SPOKE_GAP } from '../src/blendplan.js';
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

test('key after key: every loop one after another, the outermost first, round to where it began; the S on the side the loops lie nearest — IMG_1554\'s top — never a kink, the board never stops', () => {
  const P = planOf([MIX({ order: 'seq' })], O), F = P.figs[0], B = blendLoops(MIX(), { trail: 9, edge: BRUSH_NEW / 2 }), L = B.loops;
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
  const R = dragRows(P, O); assert.equal(R.runs, 28 + 1, 'in turn a row a loop, the core\'s one'); assert.equal(R.stops.length, 1, 'a wipe before the core, none between the loops');
  assert.equal(dragRows(planOf([MIX({ order: 'seq' })], O), O).runs, 2, 'key after key: one row the loops, one the core');
  assert.equal(planOf([MIX({ core: false })], O).figs.length, 1, 'the core off: the line on round it');
  assert.equal(planOf([MIX({ core: false })], O).figs[0].rings, 29);
  assert.deepEqual(coreDepths({ x0: 0, y0: 0, x1: 6, y1: 6 }, { trail: 9, edge: 1.75, step: 3 }), [1.75], 'narrower than the trail: one ring');
});

test('key after key, ↺ mirrored; a key off the middle: the S\'s on the side the loops lie nearest', () => {
  const P = planOf([MIX({ turn: 'ccw', order: 'seq' })], O), q = P.figs[0].pieces.filter(g => g.t === 'A' && near(lenOf(g) / g.r, Math.PI / 2));
  assert.ok(q.every(g => g.left), '↺, every corner to the left');
  const R = MIX({ keys: [{ x: 0.62, y: 0.4, w: 0.18, h: 0.2 }], corners: [40, 12], steps: 20, order: 'seq' }), PR = planOf([R], O);
  assert.equal(PR.units[0].BP.side, 'right');
  const S = PR.figs[0].pieces.filter(g => g.t === 'A' && !near(lenOf(g) / g.r, Math.PI / 2));
  assert.ok(S.length >= 2 * 19 && S.every(g => g.a[0] > 280), 'on the right sides');
  const radii = PR.figs[0].pieces.filter(g => g.t === 'A' && near(lenOf(g) / g.r, Math.PI / 2)).map(g => g.r);
  assert.ok(near(Math.max(...radii), 40 - BRUSH_NEW / 2) && Math.min(...radii) < 12, 'the corners from A\'s to the core\'s');
});

// The owner's blend of his first run in paint (Library 2026-10-26 12-57): A 523 × 528.5 on a 60 × 60, its corners 100 mm,
// Key 2 three fifths of it against its top, the core at that one's bottom, 25 steps, the brush 9
const OWN = () => cleanRect({ id: 1, x: 39, y: 34, w: 523, h: 528.5, step: 3, kind: BLEND, steps: 25, corners: [100, 100, 15], keys: [{ x: 0.21414913957934992, y: 0.4153263954588458, w: 0.597354049072028, h: 0.5846736045411542 }, { x: 0.4359464627151052, y: 0.4153263954588458, w: 0.13748220576056297, h: 0.14493287653165826 }] });
const O60 = { cw: 600, ch: 600, brush: 9, swell: 3, corner: 4, change: 30, density: 50 };

test('K1 · K2 in turn (the owner, 2026-10-26, after the first run in paint): a loop of Key 1\'s, then one of Key 2\'s; every loop a stroke of its own, drawn once, from the middle of its top round to there, the brush up between', () => {
  assert.equal(MIX().order, 'turn', 'in turn, at first'); assert.equal(MIX({ order: 'seq' }).order, 'seq');
  for (const [r, o, n] of [[MIX(), O, 28], [OWN(), O60, 52]]) {
    const P = planOf([r], o), F = P.figs[0], BP = P.units[0].BP, K = keysOf(r), L = blendLoops(r, { trail: trailOf(o), edge: edgeOf(o) }).loops;
    assert.equal(F.rings, n); assert.equal(BP.side, 'top', 'where Key 1\'s loops meet'); assert.equal(BP.blend, null); assert.equal(F.strokes.length, n, 'a stroke a loop');
    assert.deepEqual(BP.sides, { 0: 'top', 1: 'bottom' }, 'every series lands where its own loops meet: Key 1\'s at 12, Key 2\'s at 6 (Screenshot 9.44.16 PM)');
    const sts = F.strokes.map(([a, b]) => F.pieces.slice(a, b)), wide = [];
    sts.forEach((st, k) => {
      for (let i = 1; i < st.length; i++) {
        const a = st[i - 1], b = st[i], e = atPiece(a, lenOf(a)), t = atPiece(b, 0).t;
        assert.ok(Math.hypot(e.p[0] - b.a[0], e.p[1] - b.a[1]) < 1e-6 && Math.hypot(e.t[0] - t[0], e.t[1] - t[1]) < 1e-3, `loop ${k + 1}, piece ${i}: a kink`);
      }
      const turned = st.reduce((t, g) => t + (g.t === 'A' ? (g.left ? 1 : -1) * lenOf(g) / g.r : 0), 0);
      assert.ok(Math.abs(turned + 2 * Math.PI) < 1e-6, `loop ${k + 1} round once, clockwise: ${turned}`);
      const a = st[0].a, z = st.at(-1).b, xs = st.filter(g => g.t === 'L' && near(g.a[0], g.b[0])).map(g => g.a[0]);
      assert.ok(Math.hypot(z[0] - a[0], z[1] - a[1]) < 1e-6, `loop ${k + 1}: drawn once, to where it landed`);
      assert.ok(Math.abs(a[0] - sts[0][0].a[0]) < 1e-6 && a[0] > K.at(-1).x && a[0] < K.at(-1).x + K.at(-1).w, 'landing in the middle, all on one column over the core');
      const ys = st.filter(g => g.t === 'L' && near(g.a[1], g.b[1])).map(g => g.a[1]);
      if (k % 2 === 0) assert.ok(near(a[1], Math.max(...ys), 1e-6) && near(a[1], K[0].y + K[0].h - edgeOf(o), 1e-6), `Key 1's loop ${k / 2 + 1}: on its top, on A's`);
      else assert.ok(near(a[1], Math.min(...ys), 1e-6) && near(a[1], K[1].y + edgeOf(o), 1e-6) && a[1] < K.at(-1).y + K.at(-1).h / 2, `Key 2's loop ${(k + 1) / 2}: on its bottom, Key 2's, under the core — its top smooth over it`);
      wide.push(Math.max(...xs) - Math.min(...xs));                                   // its sides apart
    });
    assert.ok(near(wide[0], K[0].w - 2 * edgeOf(o), 1e-6) && near(wide[1], K[1].w - 2 * edgeOf(o), 1e-6) && wide[2] > K[1].w && wide[2] < wide[0] && wide[3] < wide[1], 'A\'s loop, Key 2\'s, Key 1\'s next, Key 2\'s next');
    assert.ok(F.pieces.filter(g => g.t === 'A').every(g => g.r >= 4 - 1e-9), 'no turn tighter than 4 mm');
    const R = dragRows(P, o), run = plotRun({ ...RUN, rows: R.ps.length }, dragPasses(R));
    assert.equal(R.ps.length, n + 1); assert.equal(run.fault, ''); assert.equal(wipeBlocks(run.blocks).filter(b => b.wipe).length, 1, 'a wipe before the core only');
    const ups = run.blocks.filter(b => b.kind === 'arm' && /^J 2 /.test(b.cmd) && b.row >= 1 && b.row <= n).length, flights = run.blocks.filter(b => b.kind === 'move' && /^T /.test(b.cmds[0]) && b.row >= 2 && b.row <= n).length;
    assert.ok(ups >= 2 * n && flights === n - 1, `the brush up and down at every loop (${ups}), in the air to the next ${flights} times`);
    const seq = planOf([{ ...r, order: 'seq' }], o).figs[0];
    const loops = L.reduce((t, q) => t + 2 * (q.x1 - q.x0 + q.y1 - q.y0) - (8 - 2 * Math.PI) * q.r, 0);
    assert.ok(Math.abs(F.length - loops) < 0.01 * loops, `${F.length} mm: every contour once, ${loops} round them all (a few top turns on the column a little tighter), key after key ${seq.length}`);
  }
  const ccw = planOf([MIX({ turn: 'ccw' })], O).figs[0];
  for (const [a, b] of ccw.strokes) { const st = ccw.pieces.slice(a, b), t = st.reduce((t, g) => t + (g.t === 'A' ? (g.left ? 1 : -1) * lenOf(g) / g.r : 0), 0); assert.ok(Math.abs(t - 2 * Math.PI) < 1e-6, '↺, every loop round to the left'); assert.ok(Math.hypot(st.at(-1).b[0] - st[0].a[0], st.at(-1).b[1] - st[0].a[1]) < 1e-6, '↺: drawn once'); }
  const two = MIX({ keys: [{ x: 0.4, y: 0.4, w: 0.2, h: 0.2 }] }), P2 = planOf([two], O);
  assert.equal(P2.figs[0].strokes, undefined, 'one series: one line'); assert.deepEqual(P2.figs[0].pieces, planOf([{ ...two, order: 'seq' }], O).figs[0].pieces);
});

// The reference IMAGE 2026-10-26 11:55:05 as the tints read it (Claude's run of it)
const PAL_1155 = { name: 'Reference', core: ['white', 'roseazo', 'purple', 'ultramarine', 'pink', 'p04'], accent: ['orange', 'black', 'magenta'], w: { white: 0.368, roseazo: 0.136, purple: 0.119, ultramarine: 0.098, pink: 0.05, p04: 0.046 }, spot: 'oyellow' };
const mid = q => [(q.a[0] + q.b[0]) / 2, (q.a[1] + q.b[1]) / 2];

test('the sausages: spokes all round, at first one every ≈ 95 mm, from A\'s loop across every loop to the last, in pieces; the core\'s own X; their number the blend\'s, never the Density\'s', () => {
  const rs = [MIX()], P = planOf(rs, O), U = P.units[0], X = spokesOf(U, rs, O), K = keysOf(rs[0]), L = blendLoops(rs[0], { trail: trailOf(O), edge: edgeOf(O) }).loops, gap = spokeGap(50);
  assert.ok(gap > 70 && gap < 121, `${gap} mm: between the line full and the paint gone at 50 %`);
  const loops = X.filter(q => !q.core), ms = [...new Set(loops.map(q => q.m))];
  assert.equal(ms.length, 16, 'four a side on a 40 × 40'); assert.equal(X.filter(q => q.core).length, 4);
  assert.equal(SPOKE_GAP, gap, 'at first as far apart as the paint carries at 50 %');
  const R = spokesRound(rs[0], L[0]);
  assert.ok(R.gap <= gap && loops.every(q => Math.hypot(q.b[0] - q.a[0], q.b[1] - q.a[1]) <= R.gap + 1e-6), 'no piece longer than the spokes lie apart');
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
  for (const density of [30, 86]) assert.deepEqual(spokesOf(U, rs, { ...O, density }), X, `Density ${density} %: the spokes where they were`);
  const mine = spokesRound({ ...rs[0], spokes: 24 }, L[0]);
  assert.deepEqual(mine.n, [6, 6, 6, 6]); assert.equal(new Set(spokesOf(U, [{ ...rs[0], spokes: 24 }], O).filter(q => !q.core).map(q => q.m)).size, 24, 'Spokes 24: 24');
  const tall = spokesRound({ ...rs[0], spokes: 10 }, { x0: 0, y0: 0, x1: 100, y1: 300, r: 5 });
  assert.equal(tall.all, 10); assert.ok(tall.n[1] > tall.n[0] && tall.n.every(v => v >= 1), 'shared out by the sides\' lengths');
  assert.equal(MIX({ spokes: 2 }).spokes, 0, 'fewer than four: none set'); assert.equal(MIX({ spokes: 31.4 }).spokes, 31);
});

test('the paints in patches: every paint its share of the sausages, an accent BLEND_THIN, thin; grown together; the core the spot; a press a new deal', () => {
  const rs = [MIX()], P = planOf(rs, O), n = spokesOf(P.units[0], rs, O).filter(q => !q.core).length, Q = new Map(blendQuota(PAL_1155, n));
  assert.equal([...Q.values()].reduce((s, v) => s + v, 0), n);
  assert.equal(Q.get('orange'), Math.max(1, Math.round(n * BLEND_THIN)));
  assert.ok(Q.get('white') >= Q.get('roseazo') && Q.get('roseazo') >= Q.get('pink'), 'by the shares');
  const deals = [1, 2, 3].map(seed => dealFigure(rs, P.units, P.figs[0], PAL_1155, seed, 'colours', O).ss.get(0));
  const pieces = spokesOf(P.units[0], rs, O).filter(q => !q.core).map(q => [(mid(q)[0] - rs[0].x) / rs[0].w, (mid(q)[1] - rs[0].y) / rs[0].h]);
  const on = (p, q) => { const v = [q.b[0] - q.a[0], q.b[1] - q.a[1]], l2 = v[0] ** 2 + v[1] ** 2, t = Math.max(0, Math.min(1, ((p[0] - q.a[0]) * v[0] + (p[1] - q.a[1]) * v[1]) / l2)); return Math.hypot(p[0] - q.a[0] - t * v[0], p[1] - q.a[1] - t * v[1]) < 1e-6; };
  for (const ss of deals) {
    const lo = ss.filter(q => !q.core), count = {};
    for (const p of pieces) { const q = lo.find(q => on(p, q)); assert.ok(q, 'every piece in a sausage'); count[q.paint] = (count[q.paint] || 0) + 1; }
    for (const [p, c] of Q) assert.equal(count[p], c, `${p}: its share of the pieces`);
    assert.ok(lo.length < n, `${lo.length} sausages of ${n} pieces: a run of one paint one sausage`);
    for (const a of lo) for (const b of lo) if (a !== b && a.m === b.m && a.paint === b.paint && Math.hypot(a.b[0] - b.a[0], a.b[1] - b.a[1]) < 1e-9) {
      const u = [a.b[0] - a.a[0], a.b[1] - a.a[1]], v = [b.b[0] - b.a[0], b.b[1] - b.a[1]];
      assert.ok(Math.abs(u[0] * v[1] - u[1] * v[0]) > 1e-9 * Math.hypot(...u) * Math.hypot(...v), 'one paint on along a stretch: joined');
    }
    assert.ok(ss.filter(q => q.core).every(q => q.paint === 'oyellow'), 'the core the spot');
    assert.ok(lo.every(q => !!q.thin === ['orange', 'black', 'magenta'].includes(q.paint)), 'the accents thin');
    const pp = pieces.map(p => lo.find(q => on(p, q)).paint), d = (i, j) => Math.hypot(pieces[i][0] - pieces[j][0], pieces[i][1] - pieces[j][1]);
    const together = pp.filter((c, i) => Q.get(c) < 2 || pieces.map((_, j) => j).filter(j => j !== i).sort((x, y) => d(i, x) - d(i, y)).slice(0, CLOUD_NB).some(j => pp[j] === c)).length;
    assert.ok(together >= 0.85 * n, `${together} of ${n} pieces beside one of their own paint`);
  }
  assert.notDeepEqual(deals[0].map(q => q.paint), deals[1].map(q => q.paint), 'a press, a new deal');
  const inka = dealFigure(rs, P.units, P.figs[0], INKA_META.Inka, 4, 'colours', O).ss.get(0), ci = {};
  for (const p of pieces) { const q = inka.find(q => !q.core && on(p, q)); if (!q.thin) ci[q.paint] = (ci[q.paint] || 0) + 1; }
  assert.ok(Math.max(...Object.values(ci)) - Math.min(...Object.values(ci)) <= 1, 'no shares: the core paints alike');
  assert.ok(inka.filter(q => q.core).every(q => q.paint === 'brown'), 'the core Inka\'s pure paint');
  const ss = deals[0]; rs[0].ss = ss;
  assert.deepEqual(dealFigure(rs, P.units, P.figs[0], INKA_META['meta 1'], 99, 'spokes', O).ss.get(0).map(q => q.paint), ss.map(q => q.paint), 'New spokes, the places the same: the paints the same');
  const moved = dealFigure([{ ...rs[0], phase: 0.5 }], P.units, P.figs[0], INKA_META['meta 1'], 99, 'spokes', O).ss.get(0);
  assert.ok(moved.every(q => PAL_1155.core.concat(PAL_1155.accent, 'oyellow').includes(q.paint)), 'moved on: each the paint of the old one nearest');
  const deep = { ...rs[0], step: 8 }, Pd = planOf([deep], O), relaid = dealFigure([deep], Pd.units, Pd.figs[0], INKA_META['meta 1'], 7, 'spokes', { ...O, density: 86 }).ss.get(0);
  assert.deepEqual(relaid.filter(q => !q.core), ss.filter(q => !q.core), 'its loops unmoved, at Density 86 %: the loops\' sausages as they lay (Screenshot 1.03.27 PM)');
  // the core's Step alone: its X on its new rings, its paint kept; every spoke as it lies, pieces cut as they were, even a hand-laid one
  const odd = [...ss.filter(q => !q.core), { a: [0.2, 0.2], b: [0.25, 0.3], paint: 'lemon', thin: true, m: 3, j: 9 }, ...ss.filter(q => q.core).map(q => ({ ...q, paint: 'turquoise' }))];
  const coreOnly = dealFigure([{ ...deep, ss: odd }], Pd.units, Pd.figs[0], INKA_META['meta 1'], 7, 'core', { ...O, density: 86 }).ss.get(0);
  const round = qs => qs.filter(q => !q.core).map(q => ({ ...q, a: q.a.map(v => +v.toFixed(9)), b: q.b.map(v => +v.toFixed(9)) }));
  assert.deepEqual(round(coreOnly), round(odd), 'the core\'s Step: the spokes, their pieces and paints, as they lay');
  const cx = spokesOf(Pd.units[0], [deep], O).filter(q => q.core).map(q => [(q.a[0] - deep.x) / deep.w, (q.a[1] - deep.y) / deep.h, (q.b[0] - deep.x) / deep.w, (q.b[1] - deep.y) / deep.h].map(v => +v.toFixed(9)));
  assert.notEqual(Pd.units[0].BP.rings, P.units[0].BP.rings, 'Step 8: fewer rings in the core');
  assert.deepEqual(coreOnly.filter(q => q.core).map(q => [...q.a, ...q.b].map(v => +v.toFixed(9))), cx, 'its X on its new rings'); assert.ok(coreOnly.filter(q => q.core).every(q => q.paint === 'turquoise'), 'its paint kept');
  rs[0].ss = [{ a: [0.1, 0.1], b: [0.3, 0.3], paint: 'pink' }, { a: [0.5, 0.7], b: [0.5, 0.6], paint: 'black', core: true }];
  const fromX = dealFigure(rs, P.units, P.figs[0], PAL_1155, 5, 'colours', O).ss.get(0);
  assert.ok(pieces.every(p => fromX.some(q => !q.core && on(p, q))) && fromX.filter(q => q.core).length === 4, 'an X from before laid anew as spokes');
  assert.equal(dealFigure(rs, P.units, P.figs[1], INKA_META.Inka, 3, 'colours', O).ss.size, 0, 'the core\'s figure: nothing on its own');
  const all = dealFigures(rs, P.units, P.figs, PAL_1155, 5, 'colours', O).ss.get(0);
  assert.ok(pieces.every(p => all.some(q => !q.core && on(p, q))), 'all the figures at once: the blend dealt once');
  const noCore = MIX({ core: false }), Pn = planOf([noCore], O), sn = dealFigure([noCore], Pn.units, Pn.figs[0], PAL_1155, 2, 'colours', O).ss.get(0);
  assert.equal(sn.filter(q => q.paint === 'oyellow').length, 1, 'no core: the spot one piece');
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
