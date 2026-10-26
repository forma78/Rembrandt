// BLEND's plan — Adobe Illustrator's blend for the machine (the owner,
// 2026-10-26, BLEND/: "we start a new tab with you, BLEND, as in Adobe
// Illustrator, but for our machine. Until now we made figures whose lines did
// not cross but lay side by side"; "the key image in the BLEND folder is
// IMG_1554.PNG — we start testing with it"; "for BLEND take INKA as the base,
// it has all the menu panels we need"). INKA's page and plan; this the
// blend's geometry, inkaplan.js's planOf the rest.
//
// A blend: a rectangle of kind 'blend', its box the first key, A, the
// outermost; its other keys rounded rectangles in A's fractions, so they move
// and stretch with it, the last one the core; every key its Corners, mm.
// Steps shapes between every two keys, their edges and corners going evenly
// from the one to the next — Illustrator's Specified Steps. IMG_1554 is three
// keys: A; a square three eighths of it against its top; the orange core
// against that one's bottom; 13 steps between each two, one corner for all
// (Claude's measure off the picture, 2026-10-26).
//
// Every shape one loop of the brush, its edge on the shape's outline as a
// tile's outer ring's, its turns the shape's corner its depth less: the
// outermost first, every next over it — where the shapes close in on one
// another the loops lie over the ones before, the later on top, as a blend's
// front objects lie over its back ones. One line: every loop round to where
// it began, then on to the next by an S on the side where the loops lie
// nearest one another — there the S is shortest, hidden in the paint over
// paint. The core filled by rings of its own, a figure of its own: a wipe, its
// pure paint, from its middle out.
//
// mm from the canvas's bottom left corner, x right, y up. Lines and arcs. No DOM.

import { SAUSAGE_W, DENSITY_NEW, reachOf } from './ccdplan.js';
import { CORNER_NEW, CHANGE_NEW, GAP_MIN, RING_MIN, STEP_NEW } from './inkaplan.js';

export const BLEND = 'blend', isBlend = r => r?.kind === BLEND;
export const STEPS_NEW = 13, STEPS_MIN = 1, STEPS_MAX = 200;   // shapes between two keys: IMG_1554's 13
export const KEY_CORNER_MIN = 0.5, KEY_CORNER_MAX = 500;       // mm, a key's Corners, as INKA's slider
export const KEY_MIN = 1;                                      // mm, a key's side at least
// IMG_1554 (1125 px square, the blue the canvas): A 854 px, 12 % in from the
// canvas's left and bottom; its keys in A's fractions from its bottom left
// corner; every corner 33 px, 3.86 % of A's side
export const BLEND_1554 = { side: 0.759, corner: 0.0386, keys: [{ x: 0.313, y: 0.625, w: 0.374, h: 0.375 }, { x: 0.43, y: 0.625, w: 0.14, h: 0.14 }] };
const fin = Number.isFinite, clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------- a blend as it may be kept ----------
// a new blend's corners, all of them: IMG_1554's share of A's side, to half a mm
export const cornerNew = (w, h) => Math.max(KEY_CORNER_MIN, Math.round(BLEND_1554.corner * Math.min(w, h) * 2) / 2);
// { keys: [{ x, y, w, h }] in A's fractions, A's own left out; corners: mm, A's first; steps; core: the last key filled; phase: its spokes' places along the sides, of a gap; spokes: how many, 0 none set; order: 'turn', the series in turn, every loop its own, or 'seq', key after key, one line }
export function cleanBlend(r, w, h) {
  const ok = q => q && [q.x, q.y, q.w, q.h].every(fin) && q.w > 0 && q.h > 0;
  const keys = (Array.isArray(r.keys) ? r.keys.filter(ok) : []).map(q => ({ x: q.x, y: q.y, w: q.w, h: q.h }));
  if (!keys.length) keys.push(...BLEND_1554.keys.map(q => ({ ...q })));
  const c0 = cornerNew(w, h);
  return { keys, corners: [0, ...keys].map((_, k) => clamp(fin(r.corners?.[k]) ? r.corners[k] : c0, KEY_CORNER_MIN, KEY_CORNER_MAX)), steps: fin(r.steps) ? clamp(Math.round(r.steps), STEPS_MIN, STEPS_MAX) : STEPS_NEW, core: r.core !== false, phase: fin(r.phase) ? (r.phase % 1 + 1) % 1 : 0, spokes: fin(r.spokes) && r.spokes >= SPOKES_MIN ? clamp(Math.round(r.spokes), SPOKES_MIN, SPOKES_MAX) : 0, order: r.order === 'seq' ? 'seq' : 'turn' };
}
// its keys in canvas mm, A first: { x, y, w, h, c }
export function keysOf(r) {
  return [{ x: r.x, y: r.y, w: r.w, h: r.h, c: r.corners[0] }, ...r.keys.map((q, k) => ({ x: r.x + q.x * r.w, y: r.y + q.y * r.h, w: q.w * r.w, h: q.h * r.h, c: r.corners[k + 1] }))];
}
// a key back into A's fractions
export const keyIn = (r, q) => ({ x: (q.x - r.x) / r.w, y: (q.y - r.y) / r.h, w: q.w / r.w, h: q.h / r.h });

// ---------- the shapes and their loops ----------
// Every shape in the brush's order: the keys and Steps shapes between every
// two, their edges and corner going evenly. → { x0, y0, x1, y1, c, key (its index, or -1 a step), seg (the two keys it lies between) }
export function shapesOf(r) {
  const K = keysOf(r), n = r.steps + 1, out = [], box = q => ({ x0: q.x, y0: q.y, x1: q.x + q.w, y1: q.y + q.h, c: q.c });
  for (let i = 0; i + 1 < K.length; i++) {
    const a = box(K[i]), b = box(K[i + 1]);
    for (let j = 0; j < n; j++) { const t = j / n, s = {}; for (const k of ['x0', 'y0', 'x1', 'y1', 'c']) s[k] = a[k] + (b[k] - a[k]) * t; out.push({ ...s, key: j ? -1 : i, seg: i }); }
  }
  return out.concat({ ...box(K.at(-1)), key: K.length - 1, seg: K.length - 2 });
}
// a turn d mm in from a shape's corner c: concentric, c less d, never under turn (or c, if less) — the board never stops on it
export const turnOf = (c, d, turn = CORNER_NEW) => Math.max(c - d, Math.min(c, turn));
// the loop d mm in from a shape's outline, its turns as roundOf will run them — no more than half a side; null where it has no room
export function loopOf(s, d, turn) {
  const x0 = s.x0 + d, x1 = s.x1 - d, y0 = s.y0 + d, y1 = s.y1 - d;
  if (x1 - x0 < 2 * RING_MIN - 1e-9 || y1 - y0 < 2 * RING_MIN - 1e-9) return null;
  return { x0, y0, x1, y1, r: Math.min(turnOf(s.c, d, turn), (x1 - x0) / 2, (y1 - y0) / 2), key: s.key, seg: s.seg };
}
// The core's rings, as a tile's: the first at its edge, Step apart, the
// innermost where its paint meets in the middle — moved there if it would
// lie under half a step on — none narrower than RING_MIN twice.
// o: { trail, edge, step } → depths, mm
export function coreDepths(K, o) {
  const D = Math.min(K.x1 - K.x0, K.y1 - K.y0) / 2, d0 = Math.min(o.edge, o.trail / 2), want = Math.min(D - o.trail / 2, D - RING_MIN), step = o.step ?? STEP_NEW, ds = [];
  if (want <= d0 + GAP_MIN) return [Math.max(0, Math.min(d0, D - RING_MIN))];
  for (let d = d0; d < want - GAP_MIN - 1e-9 && ds.length < 4000; d += step) ds.push(d);
  if (ds.length > 1 && want - ds.at(-1) < step / 2) ds[ds.length - 1] = want; else ds.push(want);
  return ds;
}
// The blend's loops and the core's rings, canvas mm: the shapes the brush's
// edge on, in by the edge as a tile's outer ring; with the core on, the last
// key's rings its own, the blend's line short of it. Every turn at least
// CORNER_NEW round, as INKA's tiles' (or the key's own Corners, if less).
// o: { trail, edge, step } → { loops, rings, core: the last key's box or null }
export function blendLoops(r, o) {
  const sh = shapesOf(r), turn = CORNER_NEW, d = Math.min(o.edge, o.trail / 2), K = sh.at(-1);
  const loops = (r.core ? sh.slice(0, -1) : sh).map(s => loopOf(s, d, turn)).filter(Boolean);
  const rings = r.core ? coreDepths(K, o).map(q => loopOf(K, q, turn)).filter(Boolean) : [];
  return { loops, rings, core: r.core && rings.length ? { x: K.x0, y: K.y0, w: K.x1 - K.x0, h: K.y1 - K.y0 } : null };
}

// ---------- one line through the loops ----------
// The side the brush goes on to the next loop by: where the loops lie
// nearest one another, the S shortest — a tie, 12 o'clock first, then 3, 6, 9
const SIDE = { top: L => L.y1, right: L => L.x1, bottom: L => L.y0, left: L => L.x0 }, QUARTER = { top: 0, right: 1, bottom: 2, left: 3 };
export function seamSide(loops) {
  let best = 'top', bs = Infinity;
  for (const s of Object.keys(SIDE)) {
    let v = 0;
    for (let k = 1; k < loops.length; k++) v += Math.abs(SIDE[s](loops[k]) - SIDE[s](loops[k - 1]));
    if (v < bs - 1e-6) { bs = v; best = s; }
  }
  return best;
}
// Into the frame where the seam is on top and the brush goes clockwise: so
// many quarter turns anticlockwise, (x, y) → (−y, x), then mirrored for ↺;
// and back, a point's tokens kept
const rotL = L => ({ ...L, x0: -L.y1, x1: -L.y0, y0: L.x0, y1: L.x1 }), mirL = L => ({ ...L, x0: -L.x1, x1: -L.x0 });
const keep = (p, q) => { if (p.S) q.S = p.S; if (p.r !== undefined) q.r = p.r; return q; };
function framed(loops, side, ccw) { let Ls = loops; for (let k = 0; k < QUARTER[side]; k++) Ls = Ls.map(rotL); return ccw ? Ls.map(mirL) : Ls; }
function unframed(pts, side, ccw) { let P = ccw ? pts.map(p => keep(p, [-p[0], p[1]])) : pts; for (let k = 0; k < QUARTER[side]; k++) P = P.map(p => keep(p, [p[1], -p[0]])); return P; }
// In the frame: every loop clockwise from where it comes onto its top round
// to where it leaves it, on to the next by an S over the tops — Ring change
// long, or as much as both tops have straight, and no shorter than the step
// between them — the S's in one column as far as the tops let them, so they
// lie one under another; tops with no room in common, straight across. The
// first loop begins where it ends, the last ends where it began; neither
// nearer its corner than the turn's diameter, so roundOf runs it whole.
// Every corner its radius, .r; an S's two ends one token, .S.
function loopsLine(Ls, change) {
  const span = L => [L.x0 + L.r, L.x1 - L.r], S = [];
  for (let k = 0; k + 1 < Ls.length; k++) { const a = span(Ls[k]), b = span(Ls[k + 1]); S.push({ lo: Math.max(a[0], b[0]), hi: Math.min(a[1], b[1]), dy: Math.abs(Ls[k].y1 - Ls[k + 1].y1) }); }
  const col = S.length ? (S.at(-1).lo + S.at(-1).hi) / 2 : 0;
  for (const s of S) {
    const room = s.hi - s.lo;
    if (room > 1e-6 && room >= s.dy - 1e-9) { const Lx = Math.min(room, Math.max(s.dy, change)); s.a = clamp(col - Lx / 2, s.lo, s.hi - Lx); s.b = s.a + Lx; s.S = true; }
    else { s.a = room > 0 ? clamp(col, s.lo, s.hi) : (s.lo + s.hi) / 2; s.b = s.a; }
  }
  const pts = [], corners = L => [[L.x1, L.y1], [L.x1, L.y0], [L.x0, L.y0], [L.x0, L.y1]].map(v => Object.assign(v, { r: L.r }));
  let from = null;
  Ls.forEach((L, k) => {
    const out = S[k];
    if (!k) pts.push(from = [Math.min(out ? out.a : (L.x0 + L.x1) / 2, L.x1 - 2 * L.r), L.y1]);
    pts.push(...corners(L));
    if (!out) { pts.push([Math.max(from[0], L.x0 + 2 * L.r), L.y1]); return; }
    const A = [out.a, L.y1], B = [out.b, Ls[k + 1].y1];
    if (out.S) { const t = {}; A.S = t; B.S = t; }
    pts.push(A, B); from = B;
  });
  return pts;
}
// The loops given as one line, canvas mm: outermost first, or `out`, from the innermost out; ccw the brush's way ↺
export function lineOf(loops, side, ccw, o = {}, out = false) {
  if (!loops.length) return [];
  const pts = unframed(loopsLine(framed(loops, side, ccw !== out), o.change ?? CHANGE_NEW), side, ccw !== out);
  return out ? pts.reverse() : pts;
}
// K1 · K2 in turn (the owner, 2026-10-26, the evening, after the first run
// in paint, Screenshots 8.51.21 and 8.51.38 PM — A's loops all first, "at the
// top its lines always meet in one", "the paint gathers in little hills at
// the top"; his drawing, 8.53.35 PM: "the first contour of Key 1 comes to the
// middle at the top and leaves it; instead of going on with Key 1's big
// contour into the second spiral, it draws Key 2 straight away, and only then
// from the middle of the top goes on to Key 1 … one line of Key 1, then one
// of Key 2, then K1 again, and so in turn"; an S between them, Screenshots
// 9.28.24 and 9.29.47 PM: "no, not that … the line goes down without a lift
// right over the host and makes a circle not needed. The idea was just to
// keep from such an overlap. The brush must lift, to draw this going over in
// the air"): the loops between every two keys a series, a loop of each in
// turn, the outermost series first — every loop a stroke of its own: the
// brush lands in the middle of the side where its series meets (blendPaths),
// goes round once to where it landed, lifts, and goes in the air to the next
// one's. → the loops in the brush's order
export function inTurn(loops) {
  const by = [];
  for (const L of loops) (by[L.seg] ??= []).push(L);
  const S = by.filter(Boolean), n = Math.max(0, ...S.map(q => q.length)), out = [];
  for (let k = 0; k < n; k++) for (const q of S) if (k < q.length) out.push(q[k]);
  return out;
}
// Every contour drawn once (the owner, the same evening: "the right test
// here: every contour of the blend drawn once, K1 and K2 in turn, the moves
// between them in the air. The tops of the contours where they meet stay —
// the lift takes away just the passes that join them, not needed"): a loop
// ends where it landed, no lap over it.
export const LOOP_LAP = 0;   // mm on over where a loop landed
// Every loop its own stroke, canvas mm: in the frame where its side is on
// top and the brush goes clockwise, from the column — the middle of the
// narrowest loop there, so the brush goes over in the air straight up and
// down — two radii clear of its corners, so it runs them whole, or, not so
// on that column, one radius, those two turns a little tighter — round to
// where it landed, and on lap mm along it. sideOf(L): the side a loop lands on. → [points] a loop
export function loopStrokes(loops, sideOf, ccw, lap = LOOP_LAP) {
  const cols = {}, span = L => [L.x0 + 2 * L.r, L.x1 - 2 * L.r];
  const colOf = side => cols[side] ??= (Fs => { const t = Fs.reduce((a, L) => (L.x1 - L.x0 < a.x1 - a.x0 ? L : a), Fs[0]); return t ? (t.x0 + t.x1) / 2 : 0; })(framed(loops, side, ccw));
  return loops.map(L0 => {
    const side = sideOf(L0), [L] = framed([L0], side, ccw), col = colOf(side);
    const [lo, hi] = span(L), m = (L.x0 + L.x1) / 2, c = col >= lo && col <= hi ? col : clamp(col, Math.min(L.x0 + L.r, m), Math.max(L.x1 - L.r, m)), e = Math.max(c, Math.min(c + lap, L.x1 - L.r));
    const pts = [[c, L.y1], ...[[L.x1, L.y1], [L.x1, L.y0], [L.x0, L.y0], [L.x0, L.y1]].map(v => Object.assign(v, { r: L.r })), [e, L.y1]];
    return unframed(pts, side, ccw);
  });
}
// A blend's lines: its loops — in turn (order 'turn'), every loop a stroke of
// its own, every series landing in the middle of the side where its own
// loops meet in one line, so the join lies under their paint and every other
// side runs smooth: on IMG_1554 Key 1's at 12 o'clock, Key 2's at 6, under
// the core (the owner, the same evening, Screenshot 9.44.16 PM, a red ring
// over the core: "you did Key 1 right, but stumbled on Key 2 … your join, the
// start and the end, is OVER the yellow cross, just where an even line is
// needed, as below on Key 1. Turn the building of the second axis upside down
// in Key 2: on a clock face you start at 12 noon — start at 6 in the
// evening! Then the brush's lifts hide under the yellow cross and all the
// lines are smooth"); or key after key ('seq'), one line, the outermost
// first and every next over it, on by an S on the side where the loops lie
// nearest — and the core's, from its middle out, the S's on Key 1's side. A
// blend of one series runs one line.
// o: as blendLoops's; turn 'cw' | 'ccw' → { side, sides: every series' side, or null; blend: one line, or null; strokes: [lines], or null; core, loops, rings, box }
export function blendPaths(r, o) {
  const B = blendLoops(r, o), ccw = r.turn === 'ccw', segs = [...new Set(B.loops.map(L => L.seg))];
  if (r.order !== 'seq' && segs.length > 1) {
    const series = seg => B.loops.filter(L => L.seg === seg), side = seamSide(series(segs[0]).length > 1 ? series(segs[0]) : B.loops);
    const sides = Object.fromEntries(segs.map(seg => [seg, series(seg).length > 1 ? seamSide(series(seg)) : side]));
    return { side, sides, blend: null, strokes: loopStrokes(inTurn(B.loops), L => sides[L.seg], ccw), core: B.core ? lineOf(B.rings, side, ccw, o, true) : null, loops: B.loops.length, rings: B.rings.length, box: B.core };
  }
  const side = seamSide(B.loops.length > 1 ? B.loops : B.rings);
  return { side, sides: null, blend: lineOf(B.loops, side, ccw, o), strokes: null, core: B.core ? lineOf(B.rings, side, ccw, o, true) : null, loops: B.loops.length, rings: B.rings.length, box: B.core };
}

// ---------- the sausages ----------
// Spokes all round (the owner, 2026-10-26, Screenshots 11.43.09 and 11.43.17
// AM, the X's Result dry over most of the loops: "no, unfortunately a plain X
// will not do here — too much empty space stays unpainted"): Spokes of them
// shared out over the sides of A's loop by their lengths, one a side at
// least, every side parted evenly from corner to corner — none set, one
// every SPOKE_GAP, as far as Density 50 %'s paint carries, half way from the
// line full to the paint gone (est.) — and from each place a spoke across
// every loop to the same place on the last: the same piece of it, its
// corner's turn or its side, the same share of that piece, straight from key
// to key as the shapes go evenly from one to the next. Every key-to-key
// stretch, s, cut in pieces no longer than the spokes lie apart, a sausage
// each, so the paints can lie in patches over the loops, not only round them
// (inkaplan.js, dealBlend). Their number the blend's, never the Density's
// (the owner, the same day, Screenshots 1.03.27 and 1.03.40 PM, his Density
// 86 %: the core's Step changed, "all the spokes fell apart" — laid again as
// far apart as 86 % carries, two a side). Phase 0, a spoke on every corner's
// apex, where the X's arms were; New spokes moves them all on along the
// sides, phase of a gap. The core an X of its own, from its outer ring's
// turns to its innermost's ({ core }).
// o: as blendLoops's → [{ a, b, m: the spoke, s: the stretch, j: the piece from outside, inner?: past the middle key, core? }]
export const GAP_K = 0.5, SPOKES_MIN = 4, SPOKES_MAX = 200;
const GAPS = new Map();
export function spokeGap(density = DENSITY_NEW) {
  if (!GAPS.has(density)) { const q = reachOf(density); GAPS.set(density, q.full + (q.gone - q.full) * GAP_K); }
  return GAPS.get(density);
}
export const SPOKE_GAP = spokeGap(DENSITY_NEW);
const apex = (L, sx, sy) => { const k = L.r * (1 - Math.SQRT1_2); return [sx > 0 ? L.x1 - k : L.x0 + k, sy > 0 ? L.y1 - k : L.y0 + k]; };
const CORNERS = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
// A loop's corners' centres clockwise from the top left, and their apexes' angles
const centres = L => [[L.x0 + L.r, L.y1 - L.r], [L.x1 - L.r, L.y1 - L.r], [L.x1 - L.r, L.y0 + L.r], [L.x0 + L.r, L.y0 + L.r]];
const APEX = [135, 45, -45, -135].map(v => v * Math.PI / 180), Q8 = Math.PI / 4;
// side k from its corner's apex to the next's: half a turn, the straight, half a turn → lengths
const sideLens = (L, k) => { const C = centres(L), a = L.r * Q8; return [a, Math.hypot(C[(k + 1) % 4][0] - C[k][0], C[(k + 1) % 4][1] - C[k][1]), a]; };
// the point of side k: its piece p (0 the first half turn, 1 the straight, 2 the last half turn), u of the way along it
function sidePoint(L, k, p, u) {
  const C = centres(L), c0 = C[k], c1 = C[(k + 1) % 4], at = (c, th) => [c[0] + L.r * Math.cos(th), c[1] + L.r * Math.sin(th)];
  if (p === 0) return at(c0, APEX[k] - Q8 * u);
  if (p === 2) return at(c1, APEX[k] - Q8 * (1 + u));
  const n = APEX[k] - Q8;
  return [c0[0] + (c1[0] - c0[0]) * u + L.r * Math.cos(n), c0[1] + (c1[1] - c0[1]) * u + L.r * Math.sin(n)];
}
// How many spokes on each side of a loop, and how far apart round it: r.spokes shared out by the sides' lengths, the largest remainders
// first, one a side at least — none set, one every SPOKE_GAP. → { n: [top, right, bottom, left], all, gap }
export function spokesRound(r, L) {
  const S = [0, 1, 2, 3].map(k => sideLens(L, k).reduce((a, b) => a + b, 0)), P = S.reduce((a, b) => a + b, 0);
  let n;
  if (!r.spokes) n = S.map(v => Math.max(1, Math.ceil(v / SPOKE_GAP - 1e-9)));
  else {
    const raw = S.map(v => P > 0 ? r.spokes * v / P : r.spokes / 4); n = raw.map(v => Math.max(1, Math.floor(v)));
    raw.map((v, k) => [v - Math.floor(v), k]).sort((a, b) => b[0] - a[0]).forEach(([, k]) => { if (n.reduce((a, b) => a + b, 0) < r.spokes) n[k]++; });
    while (n.reduce((a, b) => a + b, 0) > r.spokes && n.some(v => v > 1)) n[n.indexOf(Math.max(...n))]--;
  }
  const all = n.reduce((a, b) => a + b, 0);
  return { n, all, gap: P / all };
}
export function blendSpokes(r, o) {
  const B = blendLoops(r, o), L = B.loops, out = [], far = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]) >= SAUSAGE_W;
  if (L.length) {
    const at = L.map((q, i) => i).filter(i => !i || L[i].key >= 0 || i === L.length - 1), mid = (at.length - 1) / 2, phase = r.phase ?? 0, R = spokesRound(r, L[0]), gap = R.gap;
    let m = 0;
    for (let k = 0; k < 4; k++) {
      const ls = sideLens(L[0], k), S = ls[0] + ls[1] + ls[2], n = R.n[k];
      for (let i = 0; i < n; i++, m++) {
        let t = (i + phase) / n * S, p = 0;
        while (p < 2 && t > ls[p] + 1e-9) t -= ls[p++];
        const u = ls[p] > 1e-9 ? Math.min(1, t / ls[p]) : 0, ps = at.map(j => sidePoint(L[j], k, p, u));
        let j = 0;
        for (let s = 0; s + 1 < ps.length; s++) {
          const a = ps[s], b = ps[s + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
          if (!far(a, b)) continue;
          const cut = Math.max(1, Math.ceil(len / gap - 1e-9));
          for (let c = 0; c < cut; c++, j++) out.push({ a: [a[0] + (b[0] - a[0]) * c / cut, a[1] + (b[1] - a[1]) * c / cut], b: [a[0] + (b[0] - a[0]) * (c + 1) / cut, a[1] + (b[1] - a[1]) * (c + 1) / cut], m, s, j, ...(s >= mid ? { inner: true } : {}) });
        }
      }
    }
  }
  if (B.rings.length) for (const [sx, sy] of CORNERS) { const a = apex(B.rings[0], sx, sy), b = apex(B.rings.at(-1), sx, sy); if (Math.hypot(b[0] - a[0], b[1] - a[1]) > 0.5) out.push({ a, b, core: true }); }
  return out;
}
