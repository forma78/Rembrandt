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
// { keys: [{ x, y, w, h }] in A's fractions, A's own left out; corners: mm, A's first; steps; core: the last key filled; phase: its spokes' places along the sides, of a gap; spokes: how many, 0 none set; order: 'turn', the series in turn, or 'seq', key after key }
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
// whole, the series in turn (inTurn): which loops run whole, 'inner' or
// 'outer' — the others meet on the seam's side in one line, their tops' gap
// at the column hidden under their own paint. In to a loop inside and out
// again, the S's land on and leave the column on the whole ones: entered and
// left there, nothing of them left out. No room for an S so — deep in, the
// loops far apart — a step: a quarter turn down, as round as the room lets
// (half the drop at most, R), straight on, a quarter turn back, its own side
// of the column, the step in and the step out never on one line.
function seams(Ls, change, whole = null) {
  const span = L => [L.x0 + L.r, L.x1 - L.r], S = [];
  for (let k = 0; k + 1 < Ls.length; k++) { const a = span(Ls[k]), b = span(Ls[k + 1]); S.push({ lo: Math.max(a[0], b[0]), hi: Math.min(a[1], b[1]), dy: Math.abs(Ls[k].y1 - Ls[k + 1].y1) }); }
  const col = S.length ? (S.at(-1).lo + S.at(-1).hi) / 2 : 0;
  S.forEach((s, k) => {
    const room = s.hi - s.lo;
    if (whole) {
      const A = span(Ls[k]), B = span(Ls[k + 1]), down = Ls[k + 1].y1 < Ls[k].y1 - 1e-9, land = down === (whole === 'inner');   // the S lands on the column, or leaves it
      const c = land ? clamp(col, B[0], B[1]) : clamp(col, A[0], A[1]), Lx = Math.min(Math.max(s.dy, change), land ? c - A[0] : B[1] - c);
      if (Lx >= s.dy - 1e-9 && Lx > 1e-6 && (land ? c - Lx <= A[1] + 1e-9 : c + Lx >= B[0] - 1e-9)) { s.a = land ? c - Lx : c; s.b = s.a + Lx; s.S = true; return; }
      const R = Math.min(s.dy / 2, Math.max(0, Lx) / 2);
      if (R >= RING_MIN && (land ? c - 2 * R <= A[1] + 1e-9 : c + 2 * R >= B[0] - 1e-9)) { s.a = s.b = land ? c - R : c + R; s.R = R; return; }
    }
    if (room > 1e-6 && room >= s.dy - 1e-9) { const Lx = Math.min(room, Math.max(s.dy, change)); s.a = clamp(col - Lx / 2, s.lo, s.hi - Lx); s.b = s.a + Lx; s.S = true; }
    else { s.a = room > 0 ? clamp(col, s.lo, s.hi) : (s.lo + s.hi) / 2; s.b = s.a; }
  });
  return S;
}
function loopsLine(Ls, change, whole = null) {
  const S = seams(Ls, change, whole);
  const pts = [], corners = L => [[L.x1, L.y1], [L.x1, L.y0], [L.x0, L.y0], [L.x0, L.y1]].map(v => Object.assign(v, { r: L.r }));
  let from = null;
  Ls.forEach((L, k) => {
    const out = S[k];
    if (!k) pts.push(from = [Math.min(out ? out.a : (L.x0 + L.x1) / 2, L.x1 - 2 * L.r), L.y1]);
    pts.push(...corners(L));
    if (!out) { pts.push([Math.max(from[0], L.x0 + 2 * L.r), L.y1]); return; }
    const A = [out.a, L.y1], B = [out.b, Ls[k + 1].y1];
    if (out.S) { const t = {}; A.S = t; B.S = t; }
    if (out.R) A.r = B.r = out.R;
    pts.push(A, B); from = B;
  });
  return pts;
}
// The loops given as one line, canvas mm, in their order, or `out`, the other way; ccw the brush's way ↺; whole, the series in turn (loopsLine)
export function lineOf(loops, side, ccw, o = {}, out = false, whole = null) {
  if (!loops.length) return [];
  const pts = unframed(loopsLine(framed(loops, side, ccw !== out), o.change ?? CHANGE_NEW, whole), side, ccw !== out);
  return out ? pts.reverse() : pts;
}
// The series in turn (the owner, 2026-10-26, the evening, after the first
// run in paint, Screenshots 8.51.21 and 8.51.38 PM — A's loops all first,
// "at the top its lines always meet in one", "the paint gathers in little
// hills at the top"; his drawing, 8.53.35 PM: "the first contour of Key 1
// comes to the middle at the top and leaves it; instead of going on with
// Key 1's big contour into the second spiral, it draws Key 2 straight away,
// and only then from the middle of the top goes on to Key 1 … one line of
// Key 1, then one of Key 2, then K1 again, and so in turn"): the loops
// between every two keys a series, a loop of each in turn, the outermost
// series first. → the loops in the brush's order
export function inTurn(loops) {
  const by = [];
  for (const L of loops) (by[L.seg] ??= []).push(L);
  const S = by.filter(Boolean), n = Math.max(0, ...S.map(q => q.length)), out = [];
  for (let k = 0; k < n; k++) for (const q of S) if (k < q.length) out.push(q[k]);
  return out;
}
// The series in turn on two sides: the S's where the outermost series' loops
// meet (IMG_1554's top), as long as the loops inside lie near enough there,
// then on the side across (its bottom, where the inner series meets) — the
// owner's middle of the top for the first loops; deep in, by the core, an
// inner loop's top lies far under A's, no S has room, and the brush would go
// down and up one line in the middle every time. The loop where it goes over
// runs on half round more, to the side across; where it goes over the least
// way in all: the S's drops, an S with no room ten times, and the half round.
const OPP = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
const HALF = { top: [[1, 1], [1, 0]], right: [[1, 0], [0, 0]], bottom: [[0, 0], [0, 1]], left: [[0, 1], [1, 1]] };   // the corners on from a side to the one across, ↻: x1 or x0, y1 or y0
const HALF_CCW = { top: [[0, 1], [0, 0]], right: [[1, 1], [0, 1]], bottom: [[1, 0], [1, 1]], left: [[0, 0], [1, 0]] };   // ↺
function wholeOf(Fs) {                                                             // on this side the series that meets runs with the gaps, the other whole
  const s0 = Math.min(...Fs.map(L => L.seg)), sp = q => { const v = Fs.filter(L => (L.seg === s0) === q).map(L => L.y1); return v.length > 1 ? Math.max(...v) - Math.min(...v) : 0; };
  return sp(true) <= sp(false) ? 'inner' : 'outer';
}
const costs = (Fs, change, whole) => seams(Fs, change, whole).map(s => s.S ? s.dy : s.R ? s.dy + 5 * (s.dy - 2 * s.R) : 10 * s.dy + 100);   // an S its drop; a step its straight five times more; a plain step down ten
function turnLine(Ls, side, ccw, o) {
  const side2 = OPP[side], F1 = framed(Ls, side, ccw), F2 = framed(Ls, side2, ccw), w1 = wholeOf(F1), w2 = wholeOf(F2), change = o.change ?? CHANGE_NEW;
  const c1 = costs(F1, change, w1), c2 = costs(F2, change, w2), n = Ls.length;
  let best = { J: n - 1, v: c1.reduce((a, b) => a + b, 0) };
  for (let J = 0; J < n - 1; J++) {
    const L = Ls[J], half = J ? (L.x1 - L.x0 + L.y1 - L.y0 - (8 - 2 * Math.PI) * L.r) / 2 : 0;
    const v = c1.slice(0, J).reduce((a, b) => a + b, 0) + c2.slice(J).reduce((a, b) => a + b, 0) + half;
    if (v < best.v - 1e-6) best = { J, v };
  }
  const { J } = best;
  if (J === n - 1) return { pts: lineOf(Ls, side, ccw, o, false, w1), side, side2: null, over: -1 };
  if (J === 0) return { pts: lineOf(Ls, side2, ccw, o, false, w2), side: side2, side2: null, over: -1 };
  const A = lineOf(Ls.slice(0, J + 1), side, ccw, o, false, w1), B = lineOf(Ls.slice(J), side2, ccw, o, false, w2), L = Ls[J];
  const on = (ccw ? HALF_CCW : HALF)[side].map(([i, k]) => Object.assign([i ? L.x1 : L.x0, k ? L.y1 : L.y0], { r: L.r }));
  return { pts: [...A, ...on, ...B.slice(5)], side, side2, over: J };
}
// A blend's two lines: the loops — the series in turn (order 'turn': above),
// or key after key, the outermost first and every next over it ('seq'), the
// S's on the side where those loops lie nearest one another — and the
// core's, from its middle out, the S's on that side too.
// o: as blendLoops's; turn 'cw' | 'ccw' → { side, side2: the side across where the S's go on, or null; over: the loop that goes over; blend, core, loops, rings, box }
export function blendPaths(r, o) {
  const B = blendLoops(r, o), ccw = r.turn === 'ccw', first = B.loops.filter(L => L.seg === B.loops[0]?.seg);
  if (r.order !== 'seq' && new Set(B.loops.map(L => L.seg)).size > 1) {             // two series at least, else one after another as ever
    const Ls = inTurn(B.loops), T = turnLine(Ls, seamSide(first.length > 1 ? first : Ls), ccw, o);
    return { side: T.side, side2: T.side2, over: T.over, blend: T.pts, core: B.core ? lineOf(B.rings, T.side, ccw, o, true) : null, loops: B.loops.length, rings: B.rings.length, box: B.core };
  }
  const side = seamSide(B.loops.length > 1 ? B.loops : B.rings);
  return { side, side2: null, over: -1, blend: lineOf(B.loops, side, ccw, o), core: B.core ? lineOf(B.rings, side, ccw, o, true) : null, loops: B.loops.length, rings: B.rings.length, box: B.core };
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
