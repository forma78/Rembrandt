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

import { SAUSAGE_W } from './ccdplan.js';
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
// { keys: [{ x, y, w, h }] in A's fractions, A's own left out; corners: mm, A's first; steps; core: the last key filled }
export function cleanBlend(r, w, h) {
  const ok = q => q && [q.x, q.y, q.w, q.h].every(fin) && q.w > 0 && q.h > 0;
  const keys = (Array.isArray(r.keys) ? r.keys.filter(ok) : []).map(q => ({ x: q.x, y: q.y, w: q.w, h: q.h }));
  if (!keys.length) keys.push(...BLEND_1554.keys.map(q => ({ ...q })));
  const c0 = cornerNew(w, h);
  return { keys, corners: [0, ...keys].map((_, k) => clamp(fin(r.corners?.[k]) ? r.corners[k] : c0, KEY_CORNER_MIN, KEY_CORNER_MAX)), steps: fin(r.steps) ? clamp(Math.round(r.steps), STEPS_MIN, STEPS_MAX) : STEPS_NEW, core: r.core !== false };
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
// A blend's two lines: the loops, the outermost first, the next over it — the
// side the S's on its own, where the loops lie nearest one another — and the
// core's, from its middle out, the S's on that side too.
// o: as blendLoops's; turn 'cw' | 'ccw' → { side, blend, core, loops, rings, box }
export function blendPaths(r, o) {
  const B = blendLoops(r, o), side = seamSide(B.loops.length > 1 ? B.loops : B.rings), ccw = r.turn === 'ccw';
  return { side, blend: lineOf(B.loops, side, ccw, o), core: B.core ? lineOf(B.rings, side, ccw, o, true) : null, loops: B.loops.length, rings: B.rings.length, box: B.core };
}

// ---------- the sausages ----------
// An X, as INKA's: every corner's way through the loops — the tops of their
// round turns, the apex, where the brush crosses it — from A's to the last
// loop's, a sausage from key to key; two keys, one cut in its middle. The
// outer half the blend's first paint, the inner half its second ({ inner }):
// the paint goes over from the one to the other as the shapes do. The core
// an X of its own, from its outer ring's turns to its innermost's ({ core }).
// → [{ a, b, inner?, core? }]
const apex = (L, sx, sy) => { const k = L.r * (1 - Math.SQRT1_2); return [sx > 0 ? L.x1 - k : L.x0 + k, sy > 0 ? L.y1 - k : L.y0 + k]; };
const CORNERS = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
export function blendSpokes(r, o) {
  const B = blendLoops(r, o), L = B.loops, out = [], far = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]) > 0.5;
  if (L.length) {
    const at = L.map((q, i) => i).filter(i => !i || L[i].key >= 0 || i === L.length - 1);
    for (const [sx, sy] of CORNERS) {
      let ps = at.map(i => apex(L[i], sx, sy));
      if (ps.length === 2) ps = [ps[0], [(ps[0][0] + ps[1][0]) / 2, (ps[0][1] + ps[1][1]) / 2], ps[1]];
      const n = ps.length - 1;
      for (let j = 0; j < n; j++) if (far(ps[j], ps[j + 1])) out.push({ a: ps[j], b: ps[j + 1], ...(j >= n / 2 ? { inner: true } : {}) });
    }
  }
  if (B.rings.length) for (const [sx, sy] of CORNERS) { const a = apex(B.rings[0], sx, sy), b = apex(B.rings.at(-1), sx, sy); if (far(a, b)) out.push({ a, b, core: true }); }
  return out;
}
