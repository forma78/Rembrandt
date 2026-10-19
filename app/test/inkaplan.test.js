import test from 'node:test';
import assert from 'node:assert/strict';
import { dealFigures, paletteOfPixels, paintingBox, nearestPaint, withIds, cleanNodes, magnetsOf, linksOf, snakeNodes, cleanRect, unitsOf, figuresOf, ringsOf, spiralOf, cleanPts, jogged, roundOf, planOf, dragRows, wipeBlocks, dragSvg, dealFigure, sausagesOf, unitSausages, spokesOf, spokeAt, marksRows, simOf, stepsOf, INKA_META, pureOf, lenOf, atPiece,
  STEP_NEW, STEP_MAX, JOIN_NEW, WIPE_NEW, R_MIN, BRUSH_NEW, SWELL_NEW, trailOf } from '../src/inkaplan.js';
import { dragPasses, MARKS_DIP } from '../src/ccdplan.js';
import { PAINT } from '../src/tapeplan.js';
import { plotRun, DEFAULTS, ELBOW_HOVER } from '../src/strokes.js';

// INKA's plan: Inca patterns — tiles filled by spirals, the brush on from
// tile to tile without a lift, a wipe between figures (the owner, 2026-10-17).
const O = { cw: 200, ch: 200, brush: 6, swell: 0, join: JOIN_NEW, corner: 4 };   // the geometry with a 6 mm trail: the brush, no swell
const RUN = { ...DEFAULTS, speed: 40, travel: 180, tail: 3, lift: false, ink: false, snake: true, pause: false, here: { x: 300, y: 300 }, hover: ELBOW_HOVER, pauseAtEnds: true };
const near = (a, b, e = 1e-6) => Math.abs(a[0] - b[0]) < e && Math.abs(a[1] - b[1]) < e;
// the owner's paper test (personal_references/ Screenshot 12.52.59 PM): six tiles, two columns of three, and the brown "[" apart
const SIX = () => { const rs = []; for (let c = 0; c < 2; c++) for (let r = 0; r < 3; r++) rs.push(cleanRect({ x: 10 + c * 50, y: 10 + r * 50, w: 50, h: 50 })); return rs; };
const BRACKET = [{ x: 130, y: 30, w: 20, h: 100 }, { x: 130, y: 110, w: 50, h: 20 }, { x: 130, y: 30, w: 50, h: 20 }, { x: 130, y: 72, w: 35, h: 16 }];
const LAYOUT = () => [...SIX(), ...BRACKET.map(cleanRect)];
const dirIn = (g, end) => { if (g.t === 'L') { const d = [g.b[0] - g.a[0], g.b[1] - g.a[1]], l = Math.hypot(...d); return [d[0] / l, d[1] / l]; } return atPiece(g, end ? lenOf(g) : 0).t; };

// The brush swollen with paint (the owner, 2026-10-19: "the brush is not a
// felt-tip … it swells in volume"): 3.5 mm set, 9 on the canvas by the ruler
test('the trail: the brush and its swell, 9 mm at his 3.5; the Drag and the Result by it', () => {
  assert.equal(trailOf({}), BRUSH_NEW + SWELL_NEW); assert.equal(trailOf({ brush: 3.5 }), 9);
  const rs = [cleanRect({ x: 0, y: 0, w: 64, h: 63.5, step: 3 })], P = planOf(rs, { ...O, brush: 3.5, swell: SWELL_NEW });
  const edge = q => Math.min(q[0], q[1], 64 - q[0], 63.5 - q[1]);
  assert.ok(P.figs[0].pts.every(q => edge(q) >= 4.5 - 1e-6) && P.figs[0].pts.some(q => Math.abs(edge(q) - 4.5) < 1e-6), 'the outer ring 4.5 in: the paint ends on the tile\'s edge');
  assert.match(dragSvg(P, { ...O, brush: 3.5, swell: SWELL_NEW }), /data-trail-mm="9"/);
});

test('a rectangle as kept: its step 1 … 100 mm, its sausages with real paints only, its palette', () => {
  assert.equal(cleanRect({ x: 0, y: 0, w: 10, h: 10 }).step, STEP_NEW);
  assert.equal(cleanRect({ x: 0, y: 0, w: 10, h: 10, step: 500 }).step, STEP_MAX);
  const r = cleanRect({ x: 0, y: 0, w: 10, h: 10, ss: [{ a: [0, 0.5], b: [0.5, 0.5], paint: 'ochre' }, { a: [0, 0], b: [1, 1], paint: 'nope' }], pal: { name: 'x', core: ['sand'], accent: [], pure: 'brown', seed: 3 } });
  assert.equal(r.ss.length, 1); assert.equal(r.pal.pure, 'brown');
  assert.equal(cleanRect({ x: 'a', y: 0, w: 1, h: 1 }), null);
});

test('rectangles that overlap are one block; side by side they stay tiles, one figure; apart, two figures', () => {
  const rs = LAYOUT(), U = unitsOf(rs);
  assert.equal(U.length, 7);
  assert.deepEqual(U.at(-1).rs, [6, 7, 8, 9]);
  const F = figuresOf(rs, U);
  assert.equal(F.length, 2);
  assert.deepEqual(F[1].us, [6]);
  // corners only: not one figure
  const c = [cleanRect({ x: 0, y: 0, w: 20, h: 20 }), cleanRect({ x: 20, y: 20, w: 20, h: 20 })];
  assert.equal(figuresOf(c, unitsOf(c)).length, 2);
  // within the join they are
  const g = [cleanRect({ x: 0, y: 0, w: 20, h: 20 }), cleanRect({ x: 24, y: 0, w: 20, h: 20 })];
  assert.equal(figuresOf(g, unitsOf(g), 5).length, 1); assert.equal(figuresOf(g, unitsOf(g), 3).length, 2);
});

test('the units of a figure in a snake: up the left column, down the right, as the owner\'s scheme', () => {
  const rs = SIX(), F = figuresOf(rs, unitsOf(rs));
  assert.deepEqual(F[0].us, [0, 1, 2, 5, 4, 3]);
});

test('a square\'s rings: the classic spiral, a step apart all the way, the outer brush edge on its sides', () => {
  const R = ringsOf([{ x: 0, y: 0, w: 40, h: 40 }], 6, 7);
  assert.equal(R.levels, 3);
  assert.deepEqual(cleanPts(spiralOf(R, [0, 40])), [[3, 37], [37, 37], [37, 3], [3, 3], [3, 30], [30, 30], [30, 10], [10, 10], [10, 23], [23, 23], [23, 17], [17, 17], [17, 23]]);
  // outward: the same reversed, ending at the corner nearest the hint
  const out = cleanPts(spiralOf(R, [40, 40], true));
  assert.ok(near(out.at(-1), [37, 37]));
});

// The core (the owner, 2026-10-19: "in the centre it has no room to turn …
// with a 9 mm pass it starts to fidget in place"): the rings a step apart
// until the paint meets in the middle, the innermost the trail wide
const depths = R => { const out = []; for (let n = R.roots[0]; n; n = n.kids[0]) out.push(n.d); return out; };
const innermost = R => { let n = R.roots[0]; while (n.kids.length) n = n.kids[0]; const L = n.loops[0], w = k => Math.max(...L.map(v => v[k])) - Math.min(...L.map(v => v[k])); return Math.min(w(0), w(1)); };
test('the core: the innermost ring the trail wide, its paint meeting in the middle; none narrower', () => {
  const R = ringsOf([{ x: 0, y: 0, w: 46, h: 100 }], 6, 7);
  assert.deepEqual(depths(R), [3, 10, 20]);                                     // the last 3 mm short of 17 + 3.5: 17 moved in to 20
  assert.equal(innermost(R), 6);
  assert.deepEqual(depths(ringsOf([{ x: 0, y: 0, w: 50, h: 50 }], 6, 7)), [3, 10, 17, 22]);   // 24 went past: in at 22
  // his tile of 2026-10-17, 64 × 63.5 at a 3 mm step: with the 9 mm trail nine rings, none under 9 mm across — before, eleven, the last 1.75 mm
  const T = ringsOf([{ x: 0, y: 0, w: 64, h: 63.5 }], trailOf({ brush: 3.5 }), 3);
  assert.equal(T.levels, 9); assert.ok(Math.abs(innermost(T) - 9) < 1e-6);
  assert.equal(depths(T)[0], 4.5, 'the outer ring the trail\'s half in: the paint ends on the tile\'s edge');
});

test('the "[" — four rectangles overlapping — one outline, its rings round the whole of it', () => {
  const R = ringsOf(BRACKET, 6, 7);
  assert.equal(R.roots.length, 1);
  const outer = R.roots[0].loops[0];
  assert.ok(outer.some(v => near(v, [162, 85])), 'the tongue in the outer ring');
  assert.equal(R.levels, 2);
  const s = cleanPts(spiralOf(R, null));
  assert.ok(near(s[0], [133, 33]), 'from the bottom left corner');
});

test('a figure one path: the first tile from its middle out, the next from its outside in, middle to middle across the rings', () => {
  const P = planOf(SIX(), O), F = P.figs[0];
  assert.ok(Math.hypot(F.start[0] - 35, F.start[1] - 35) < 3 * Math.SQRT2 + 1e-6, 'lands on the innermost ring of the bottom left tile, in its middle');
  assert.equal(F.along.length, 6);
  // the first tile ends at its outer ring's corner by the second, which comes on at its own a brush's width over the shared side
  const k = F.pts.findIndex((p, i) => i && p[1] >= 63 - 1e-6 && Math.abs(F.pts[i - 1][1] - 57) < 1e-6 && Math.abs(p[0] - F.pts[i - 1][0]) < 1e-6);
  assert.ok(k > 0, 'the step across the shared side, straight on into the next tile\'s outer ring');
  assert.ok([13, 57].includes(F.pts[k][0]), 'at a corner');
});

test('no turn the board stops on: every joint tangent, every arc at least R_MIN, the turn back a jog', () => {
  const P = planOf(LAYOUT(), O);
  for (const F of P.figs) for (let i = 1; i < F.pieces.length; i++) {
    const a = dirIn(F.pieces[i - 1], true), b = dirIn(F.pieces[i], false);
    assert.ok(a[0] * b[0] + a[1] * b[1] > Math.cos(10 * Math.PI / 180), `figure ${F.n}, piece ${i}: a kink`);
    if (F.pieces[i].t === 'A') assert.ok(F.pieces[i].r >= R_MIN);
  }
  assert.deepEqual(jogged([[0, 0], [0, 10], [0, -40]], 3), [[0, 0], [0, 10], [3, 10], [0, -40]]);   // on the longer side's end
});

test('DRAG: a figure one row, one block with the brush down; before the next the flight over its start, the brush up to wipe, the pause', () => {
  const P = planOf(LAYOUT(), O), R = dragRows(P, O);
  assert.equal(R.ps.length, 2); assert.equal(R.stops.length, 1);
  assert.match(R.stops[0].why, /wipe/);
  const run = plotRun({ ...RUN, rows: R.ps.length }, dragPasses(R));
  assert.equal(run.fault, '');
  assert.equal(run.blocks.filter(b => b.kind === 'move' && b.paintMM > 0).length, 2, 'no split on the way');
  const B = wipeBlocks(run.blocks), k = B.findIndex(b => b.kind === 'pause');
  assert.match(B[k - 1].cmd, new RegExp(`^J 2 ${WIPE_NEW}$`));
  assert.match(B[k - 2].cmds[0], /^T /);
  assert.ok(B[k + 1].kind === 'arm' && B[k + 2].kind === 'move' && B[k + 2].paintMM > 0, 'after Continue: down and on');
  assert.equal(B.length, run.blocks.length + 1);
});

test('the paints: neighbours never one paint, a figure of one unit one pure paint, spokes from the outline to the middle', () => {
  const rs = LAYOUT(), P = planOf(rs, O);
  for (const F of P.figs) { const d = dealFigure(rs, P.units, F, INKA_META.Inka, 7, 'colours', O); for (const [i, ss] of d.ss) { rs[i].ss = ss; rs[i].pal = d.pal; } }
  const P2 = planOf(rs, O), F = P2.figs[0], main = id => { const n = {}; for (const q of unitSausages(P2.units[id], rs)) n[q.paint] = (n[q.paint] || 0) + 1; return Object.keys(n).sort((a, b) => n[b] - n[a])[0]; };
  for (const a of F.us) for (const b of F.us) if (a !== b && F.adj(a, b)) assert.notEqual(main(a), main(b));
  assert.deepEqual([...new Set(unitSausages(P2.units[6], rs).map(q => q.paint))], ['brown']);
  const ss0 = unitSausages(P2.units[0], rs);
  assert.equal(ss0.length, 4, 'an X');
  for (const q of ss0) { const L = Math.hypot(q.b[0] - q.a[0], q.b[1] - q.a[1]); assert.ok(Math.abs(L - 27.58) < 0.01, `corner to the innermost ring: ${L}`); assert.ok(Math.abs(Math.abs(q.b[0] - q.a[0]) - Math.abs(q.b[1] - q.a[1])) < 1e-6, 'on the diagonal'); }
  assert.equal(pureOf(INKA_META['HDay blue']), 'ultramarine');
  assert.equal(pureOf({ name: 'x', core: ['black', 'sand', 'ochre'], accent: [] }), 'ochre');
});

// The spokes an X (the owner, 2026-10-19, Screenshot 2.21.20 PM: "a cross X, it is logical and simple")
test('the spokes an X: from every corner along the diagonal to the innermost ring; M lays the arm nearest the point', () => {
  const rs = [cleanRect({ x: 0, y: 0, w: 130, h: 40 })], U = unitsOf(rs)[0], S = spokesOf(U, rs, O);
  assert.equal(S.length, 4);
  assert.ok(near(S[0].a, [8.125, 2.5]) && near(S[0].b, [55.25, 17]), 'its round end clear of both sides at the corner; to the innermost ring, 17 mm in');
  for (const q of S) assert.ok(Math.abs((q.b[1] - q.a[1]) / (q.b[0] - q.a[0])) - 40 / 130 < 1e-9, 'along the diagonal');
  assert.deepEqual(spokeAt(U, rs, [50, 5], O), S[0]);
  assert.deepEqual(spokeAt(U, rs, [100, 30], O), S[2]);
  // a block: from every corner of its outline at 45°
  const b = BRACKET.map(cleanRect), B = spokesOf(unitsOf(b)[0], b, O);
  assert.ok(B.length >= 6 && B.every(q => Math.abs(Math.abs(q.b[0] - q.a[0]) - Math.abs(q.b[1] - q.a[1])) < 1e-6));
});

test('MARKS: a dash a sausage, a dip every fourth', () => {
  const rs = SIX(), P = planOf(rs, O);
  const d = dealFigure(rs, P.units, P.figs[0], INKA_META['meta 1'], 3, 'colours', O); for (const [i, ss] of d.ss) rs[i].ss = ss;
  const M = marksRows(planOf(rs, O), rs, { ...O, ink: true }), n = sausagesOf(rs).length;
  assert.equal(M.marks, n);
  assert.equal(M.ps.filter(p => !p[0].nodip).length, Math.ceil(n / MARKS_DIP));
});

test('the Result: the brush drags a tile\'s paint round its rings and on; wiped at every figure', () => {
  const rs = LAYOUT(), P = planOf(rs, O);
  for (const F of P.figs) { const d = dealFigure(rs, P.units, F, INKA_META.Inka, 11, 'colours', O); for (const [i, ss] of d.ss) rs[i].ss = ss; }
  const P2 = planOf(rs, O), S = simOf(P2, rs, { ...O, density: 50, h: 0.5 });
  const T = stepsOf(P2);
  assert.equal(S.steps, T.n);
  assert.equal([...T.fig].filter(f => f < 0).length, 2, 'a wipe at each figure\'s start');
  S.advance(1e9);
  // the bottom left tile's outer ring, a mm in from its corner's rounding, covered
  const covered = (x, y) => S.amt[Math.floor(y / 0.5) * S.nx + Math.floor(x / 0.5)] >= 0.5;
  let on = 0, all = 0;
  for (let y = 20; y <= 50; y += 2) { all++; if (covered(13, y)) on++; }
  assert.ok(on / all > 0.8, `the outer ring's left side: ${on} of ${all} covered`);
  assert.ok(S.wiped() > 0);
  const img = new Uint8ClampedArray(S.nx * S.ny * 4); S.rgba(img, true);
  assert.ok(img.some((v, i) => i % 4 === 0 && v < 200), 'paint on it');
});

test('the SVG: a path a figure, lines and arcs', () => {
  const svg = dragSvg(planOf(LAYOUT(), O), O);
  assert.equal((svg.match(/<path /g) || []).length, 2);
  assert.match(svg, / A\d/);
  assert.ok(PAINT.brown);
});

// Nodes (the owner, 2026-10-17, INKA/result/IMG_1033, Screenshot 3.31.29 PM:
// "the brush's way must be set"): 1 from its middle to 2's middle, 2 from its
// right side's middle to 3's middle, 3 from its bottom side's middle to 4's middle
const FOUR = () => withIds([[10, 10], [10, 60], [60, 60], [60, 10]].map(([x, y]) => cleanRect({ x, y, w: 50, h: 50 })));
const N1033 = [{ a: { id: 1, m: 'c' }, b: { id: 2, m: 'c' } }, { a: { id: 2, m: 'e' }, b: { id: 3, m: 'c' } }, { a: { id: 3, m: 's' }, b: { id: 4, m: 'c' } }];

test('ids for every tile; nodes as kept: real ends, two tiles', () => {
  const rs = withIds([cleanRect({ x: 0, y: 0, w: 9, h: 9 }), cleanRect({ id: 5, x: 0, y: 0, w: 9, h: 9 }), cleanRect({ id: 5, x: 0, y: 0, w: 9, h: 9 })]);
  assert.deepEqual(rs.map(r => r.id), [6, 5, 7]);
  assert.equal(cleanNodes([{ a: { id: 1, m: 'c' }, b: { id: 1, m: 'n' } }, { a: { id: 1, m: 'x' }, b: { id: 2, m: 'n' } }, { a: { id: 1, m: 'c' }, b: { id: 2, m: 'nw' } }]).length, 1);
});

test('magnets: a tile\'s middle, corners and sides\' middles on its outer ring; a block\'s only on its outline', () => {
  const rs = FOUR(), P = planOf(rs, O);
  assert.equal(P.units[0].M.length, 9);
  assert.ok(P.units[0].M.some(q => q.m === 'e' && near(q.p, [57, 35])));
  const b = withIds(BRACKET.map(cleanRect)), Pb = planOf(b, O);
  assert.ok(Pb.units[0].M.length < 4 * 8 + 1);
  assert.ok(!Pb.units[0].M.some(q => q.m === 'e' && q.id === b[0].id), 'the bar\'s right side\'s middle is inside the block, under the tongue');
});

test('links: one way out of a tile and one in, a later node in the place of the one before; never a loop', () => {
  const rs = FOUR(), P = planOf(rs, O);
  assert.equal(linksOf([...N1033, { a: { id: 4, m: 'c' }, b: { id: 1, m: 'sw' } }], rs, P.units).length, 3, 'the loop refused');
  const L = linksOf([{ a: { id: 1, m: 'c' }, b: { id: 2, m: 'c' } }, { a: { id: 1, m: 'e' }, b: { id: 4, m: 'w' } }], rs, P.units);
  assert.deepEqual(L.map(l => [l.a.u, l.b.u]), [[0, 3]]);
});

test('the owner\'s nodes: 1 in to its middle, 2 out to its right side\'s middle, 3 out to its bottom\'s, 4 out from its middle', () => {
  const rs = FOUR(), P = planOf(rs, { ...O, nodes: N1033 }), F = P.figs[0];
  assert.equal(P.manual, true); assert.equal(P.figs.length, 1); assert.deepEqual(F.us, [0, 1, 2, 3]);
  assert.ok(near(F.ends[0].a, [13, 13]) && Math.hypot(F.ends[0].b[0] - 35, F.ends[0].b[1] - 35) < 3 * Math.SQRT2 + 1e-6, '1: from its bottom left corner in');
  assert.ok(near(F.ends[1].b, [57, 85]), '2: out to its right side\'s middle');
  assert.ok(near(F.ends[2].b, [85, 63]), '3: out to its bottom\'s middle');
  for (let i = 1; i < F.pieces.length; i++) { const a = dirIn(F.pieces[i - 1], true), b = dirIn(F.pieces[i], false); assert.ok(a[0] * b[0] + a[1] * b[1] > Math.cos(10 * Math.PI / 180), `a kink at ${i}`); }
  // a tile no node touches: a figure of its own
  rs.push(...withIds([...rs, cleanRect({ x: 140, y: 10, w: 40, h: 40 })]).slice(4));
  assert.equal(planOf(rs, { ...O, nodes: N1033 }).figs.length, 2);
});

// The ring change (the owner, 2026-10-19: "too sharp … let the transition be as in TAPE or BASF")
test('a side\'s middle the seam: every ring round, then an S in to the next over the side, as TAPE\'s lane change', () => {
  const R = ringsOf([{ x: 0, y: 0, w: 50, h: 50 }], 6, 7), s = cleanPts(spiralOf(R, [47, 25], false, { corner: 4, change: 30 }));
  assert.deepEqual(s.slice(0, 8).map(p => [p[0], p[1]]), [[47, 25], [47, 3], [3, 3], [3, 47], [47, 47], [47, 43], [40, 25], [40, 10]]);   // the side has 22 mm, 4 the turn's: an S over 18
  assert.ok(s[5].S && s[5].S === s[6].S, 'the S\'s two ends');
  const g = roundOf(s, 4), k = g.findIndex(q => q.t === 'A' && near(q.a, [47, 43]));
  assert.ok(k > 0 && g[k + 1].t === 'A' && near(g[k + 1].b, [40, 25]) && g[k].left !== g[k + 1].left, 'two arcs, one way and back');
  assert.ok(Math.abs(g[k].r - (18 * 18 + 7 * 7) / 28) < 1e-9 && g[k].r === g[k + 1].r);
  for (let i = k; i <= k + 2; i++) { const a = dirIn(g[i - 1], true), b = dirIn(g[i], false); assert.ok(a[0] * b[0] + a[1] * b[1] > 1 - 1e-9, `tangent at ${i}`); }
  // Ring change 0: as short as the step, an S still
  const z = cleanPts(spiralOf(R, [47, 25], false, { corner: 4, change: 0 }));
  assert.deepEqual([z[5][0], z[5][1]], [47, 32]);
});

test('the turn: ↺ the same spiral mirrored; the snake as nodes runs the very path', () => {
  const rs = FOUR(), a = planOf(rs, { ...O, nodes: N1033 }).figs[0].pts.slice(-4);
  rs[3].turn = 'ccw';
  const b = planOf(rs, { ...O, nodes: N1033 }).figs[0].pts.slice(-4);
  assert.notDeepEqual(a, b);
  const A = planOf(FOUR(), O), B = planOf(FOUR(), { ...O, nodes: snakeNodes(A, FOUR()) });
  assert.deepEqual(B.figs[0].pts, A.figs[0].pts);
});

test('! a tile its nodes both in its middle, or both on its edge (the owner\'s mistake, Screenshot 3.54.39 PM)', () => {
  const rs = FOUR();
  const mid2 = [{ a: { id: 1, m: 'c' }, b: { id: 2, m: 'c' } }, { a: { id: 2, m: 'c' }, b: { id: 3, m: 'c' } }];
  assert.deepEqual(planOf(rs, { ...O, nodes: mid2 }).figs[0].cross, [null, 'middle', null]);
  const edge2 = [{ a: { id: 1, m: 'c' }, b: { id: 2, m: 's' } }, { a: { id: 2, m: 'e' }, b: { id: 3, m: 'c' } }];
  assert.deepEqual(planOf(rs, { ...O, nodes: edge2 }).figs[0].cross, [null, 'edge', null]);
  assert.deepEqual(planOf(rs, { ...O, nodes: N1033 }).figs[0].cross, [null, null, null, null]);
});

// The reference's palette (the owner, 2026-10-19, Screenshot 4.15.26 PM: "a
// picture with the colour range … on all ten squares; the analysis must
// match the colours we have in stock")
test('Reference: a picture\'s colours to his paints, their shares; dealt on every tile, a neighbour never one paint', () => {
  const px = [], put = (c, n) => { for (let i = 0; i < n; i++) px.push(...c, 255); };
  put([236, 95, 100], 500); put([20, 35, 130], 300); put([250, 248, 240], 150); put([200, 140, 20], 30); put([0, 0, 0, 0], 0); px.push(9, 9, 9, 0);
  const pal = paletteOfPixels(Uint8ClampedArray.from(px));
  assert.deepEqual(pal.core, ['pink', 'ultramarine', 'white'], 'the core, in his paints, the most first');
  assert.deepEqual(pal.accent, ['ochre'], 'under 4 %: thin');
  assert.ok(Math.abs(pal.w.pink - 500 / 980) < 0.002, 'its share; the transparent pixel left out');
  assert.equal(nearestPaint([20, 35, 130]), 'ultramarine');
  // twelve lone tiles side by side, three rows of four: every one dealt, the shares kept, touching ones apart
  const rs = withIds([]); for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) rs.push(cleanRect({ id: rs.length + 1, x: 10 + c * 40, y: 10 + r * 40, w: 40, h: 40 }));
  const nodes = [{ a: { id: 1, m: 'c' }, b: { id: 2, m: 'c' } }], P = planOf(rs, { ...O, nodes }), d = dealFigures(rs, P.units, P.figs, pal, 3, 'colours', O);
  assert.equal(P.figs.length, 11);
  assert.equal(d.ss.size, 12, 'every tile');
  const main = i => d.ss.get(i)[0].paint, n = {};
  for (let i = 0; i < 12; i++) { assert.equal(d.ss.get(i).length, 4, 'an X'); n[main(i)] = (n[main(i)] || 0) + 1; }
  assert.ok(n.pink >= 5 && n.pink <= 7 && n.ultramarine >= 3 && n.white >= 1, JSON.stringify(n));
  for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) if (i !== j && Math.abs(i % 4 - j % 4) + Math.abs(Math.floor(i / 4) - Math.floor(j / 4)) === 1) assert.notEqual(main(i), main(j), `tiles ${i + 1} and ${j + 1} touch`);
});

// His references (INKA/references/): his canvases photographed on a wall, framed, in fluorescent paints
test('Reference: the painting off its wall and frame; a fluorescent paint marked to buy, his own in stock first', () => {
  const w = 100, h = 120, px = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = 4 * (y * w + x), inP = x >= 20 && x < 80 && y >= 20 && y < 100, frame = inP && (x < 22 || x >= 78 || y < 22 || y >= 98);
    const c = !inP ? [230, 228, 224] : frame ? [222, 205, 176] : y < 60 ? [250, 3, 80] : [18, 28, 90];   // the wall, the frame, neon pink over navy
    px.set([...c, 255], i);
  }
  const B = paintingBox(px, w, h);
  assert.ok(B.x0 >= 20 && B.x1 <= 80 && B.y0 >= 20 && B.y1 <= 100, `inside the painting: ${JSON.stringify(B)}`);
  const pal = paletteOfPixels(px, w, h);
  assert.ok(!pal.core.includes('white') && !pal.core.includes('sand'), `no wall, no frame: ${pal.core}`);
  assert.deepEqual(pal.core.slice(0, 2).sort(), ['fpink', 'ultramarine'], 'the neon pink one to buy; the navy his Ultramarine');
  assert.equal(PAINT.fpink.buy, true); assert.ok(!PAINT.pink.buy);
  assert.equal(nearestPaint([237, 93, 101]), 'pink', 'his own Pink, where it is');
  assert.equal(nearestPaint([250, 3, 80]), 'fpink');
});
