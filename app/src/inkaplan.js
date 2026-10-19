// INKA's plan — Inca patterns (the owner, 2026-10-17, INKA/): square tiles
// "like Mexican rugs or chocolate bars", every tile filled by a spiral of the
// dry brush, the brush going on from tile to tile without a lift; Florian
// Markus's way with the paint (INKA/master_flo_hires/: sausages squeezed
// across every lane, the brush landing in them, the colours dragged into
// one another), not his race tracks; Heather Day's pure colour (INKA/HDay/,
// Painting 12) in a figure of one paint beside the mixed tiles.
//
// The words: a tile, a rectangle on the canvas; a block, rectangles that
// overlap, one outline — the owner's "[" — its rings the outline's; a unit,
// a tile or a block; a figure, the units that touch — "if 6 tiles … the
// brush goes on non-stop over the modules … only when all six rectangles are
// painted the brush lifts and moves to the brown" (personal_references/
// IMG_1009, Screenshot 12.51.16 PM); a ring, one loop of the brush round a
// unit, Step apart, the outer one's brush edge on its outline; the brush
// swollen with paint, its trail (trailOf), lays wider — the core by it.
//
// DRAG: a figure one path, the brush down from its landing to its lift: the
// first unit from its centre out, the next from its outside in, the next from
// its centre out … — as the owner's scheme draws it — the units in a snake
// through the figure from its bottom left; every turn a tangent arc, so the
// board never stops on the way (the owner, the same day: "stopping to zero is
// not Instagrammable … a stop of the brush during the process kills the
// mesmerising effect"). Between figures the brush up at the elbow's highest
// over the next one's start, a pause to wipe it, Continue.
//
// mm from the canvas's bottom left corner, x right, y up; the runs from its
// centre for the machine (toMachine). Lines and arcs. No DOM.

import { toMachine } from './band.js';
import { pieceLen } from './strokes.js';
import { PAINT } from './tapeplan.js';
import { CCD_META, paintOf, DENSITY_NEW, FILM, PICK_BULK, PICK_FILM, DRY, THIN, DS, GROOVE_K, SAUSAGE_W, MARKS_DIP, MARK_DOT } from './ccdplan.js';
import { linOf, toLin, toSrgb, luminance } from './color.js';
import { rng } from './util.js';
import { ELBOW_MAX } from './ink.js';

export const STEP_NEW = 3, STEP_MIN = 1, STEP_MAX = 100;   // mm, ring to ring: the owner's on his canvas of 2026-10-17, the rings' paint over one another, its ridges the bristles'
export const BRUSH_NEW = 3.5;                              // mm, the brush as he set it there
// The brush is no felt-tip: it takes up the paint and swells (the owner,
// 2026-10-19: "the brush is not a felt-tip or a Posca marker. It picks up
// paint … and swells in volume. We need to account for this in the
// simulation on screen"). Set at 3.5 mm, it laid 9 on that canvas
// (INKA/update-19-10-2026-1.0.9/): the strip from tile to tile 8.5 … 9 mm by
// the ruler (IMG_1190, 1191), a tile's paint 1.4 … 4.3 mm past its outline,
// 2.8 on average, where the 3.5 mm brush's edge was on it (IMG_1193, 1194).
// Its trail: the brush and SWELL — est. at any other width.
export const SWELL_NEW = 5.5;
export const trailOf = o => Math.max(0.5, (o.brush ?? BRUSH_NEW) + (o.swell ?? SWELL_NEW));
// The outer ring the brush's half in from the tile's edge, less Edge: out —
// the owner's optical compensation (2026-10-19, the evening, IMG_1201: white
// along the sides where the brush lays less than its width; "maybe we make
// an optical compensation?"), 0 by default; never past the edge itself
export const EDGE_OUT_NEW = 0, EDGE_MIN = 0.25;
export const edgeOf = o => Math.max(EDGE_MIN, (o.brush ?? BRUSH_NEW) / 2 - (o.edgeOut ?? EDGE_OUT_NEW));
// Overlap: one more ring round every tile, its brush's edge that far past
// the tile's — onto its neighbour, the two over one another (the owner,
// 2026-10-19, IMG_1203 … 1208, 2 … 4 mm of white still between tiles: "maybe
// one more pass on every square — let it go overlapping"); 0 none. → the
// ring's middle, mm in from the tile's edge — out past it negative — or null
export const OVERLAP_NEW = 0;
export const overDepth = o => (o.overlap ?? OVERLAP_NEW) > 0 ? (o.brush ?? BRUSH_NEW) / 2 - o.overlap : null;
export const JOIN_NEW = 5;                                 // mm: tiles this near are one figure (est.)
export const CORNER_NEW = 4;                               // mm, a turn's radius: √(250 · 4) ≈ 31 mm/s on it, never a stop (machine.js, arcSpeed)
export const CHANGE_NEW = 30;                              // mm: from a ring to the next at a side's middle, an S this long at most (est.)
export const R_MIN = 0.3;                                  // mm: a tighter turn is left a corner (a 180° one)
export const RING_MIN = 0.5;                               // mm: no ring narrower than twice this in the middle — its turns too tight to run through
export const GAP_MIN = 0.25;                               // mm: the paint this short of meeting in a middle, no ring more — the swell closes it (est.)
export const WIPE_NEW = ELBOW_MAX;                         // °: the brush up to wipe, the elbow's highest (est.)
export const OFF = 60, MIN_SIDE = 1;                       // mm, as CCD's
export const SHARE_MIN = 1;                                // mm two tiles must share along a side to touch
export const SECOND_P = 0.4, ACCENT_SECOND = 0.35;         // a tile's chance of a second paint, and of it being an accent (Claude's)
// ⌘, St. John's Arms (ST-JOHN, 2026-10-19): a rectangle of this kind is the sign, its path johnPts's
export const JOHN = 'john', isJohn = r => r?.kind === JOHN;
const EPS = 1e-7, fin = Number.isFinite;

// ---------- a rectangle as it may be kept ----------
// { id, x, y, w, h, step, turn, ss: [{ a: [u, v], b: [u, v], paint, thin }], pal, kind }:
// its id, for the nodes; the way the brush goes round it as it paints, ↻
// 'cw' or ↺ 'ccw'; its sausages in its own fractions, so they move and
// stretch with it; the palette of its figure; 'john', a ⌘, else a tile
const ids = a => Array.isArray(a) && a.every(id => PAINT[id]);
const shares = w => w && typeof w === 'object' ? Object.fromEntries(Object.entries(w).filter(([k, v]) => PAINT[k] && fin(v) && v > 0)) : null;
export const cleanPal = q => q && typeof q.name === 'string' && ids(q.core) && q.core.length && ids(q.accent ?? [])
  ? { name: q.name, core: q.core.slice(), accent: (q.accent ?? []).slice(), ...(PAINT[q.pure] ? { pure: q.pure } : {}), ...(shares(q.w) ? { w: shares(q.w) } : {}), ...(PAINT[q.spot] ? { spot: q.spot } : {}), seed: fin(q.seed) ? q.seed : 0 } : null;
const pair = v => Array.isArray(v) && v.length === 2 && v.every(fin);
export function cleanRect(r) {
  if (!r || ![r.x, r.y, r.w, r.h].every(fin)) return null;
  const ss = Array.isArray(r.ss) ? r.ss.filter(q => q && pair(q.a) && pair(q.b) && PAINT[q.paint]).map(q => ({ a: q.a.slice(), b: q.b.slice(), paint: q.paint, ...(q.thin ? { thin: true } : {}) })) : [];
  const pal = cleanPal(r.pal);
  return { ...(fin(r.id) ? { id: r.id } : {}), x: r.x, y: r.y, w: Math.max(MIN_SIDE, r.w), h: Math.max(MIN_SIDE, r.h), step: fin(r.step) ? Math.max(STEP_MIN, Math.min(STEP_MAX, r.step)) : STEP_NEW, turn: r.turn === 'ccw' ? 'ccw' : 'cw', ss, ...(pal ? { pal } : {}), ...(isJohn(r) ? { kind: JOHN } : {}) };
}
// every rectangle an id of its own: the missing and the repeated given new ones
export function withIds(rects) {
  const seen = new Set();
  let next = Math.max(0, ...rects.map(r => fin(r.id) ? r.id : 0)) + 1;
  for (const r of rects) { if (!fin(r.id) || seen.has(r.id)) r.id = next++; seen.add(r.id); }
  return rects;
}
// a node, the owner's link from one tile to the next (2026-10-17): from a
// magnet of one — its middle 'c', a corner or a side's middle of its outer
// ring — to a magnet of another
export const MAGNETS = ['c', 'n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
const cleanEnd = e => e && fin(e.id) && MAGNETS.includes(e.m) ? { id: e.id, m: e.m } : null;
export const cleanNodes = a => Array.isArray(a) ? a.map(q => ({ a: cleanEnd(q?.a), b: cleanEnd(q?.b) })).filter(q => q.a && q.b && q.a.id !== q.b.id) : [];

// ---------- units and figures ----------
const overX = (a, b) => Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
const overY = (a, b) => Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
export const overlaps = (a, b) => overX(a, b) > 0.01 && overY(a, b) > 0.01;
// side by side within join mm, sharing SHARE_MIN of a side; corners only do not touch
export const touches = (a, b, join) => (-overX(a, b) <= join && overY(a, b) >= SHARE_MIN) || (-overY(a, b) <= join && overX(a, b) >= SHARE_MIN);
const boxOf = rs => { const x0 = Math.min(...rs.map(r => r.x)), y0 = Math.min(...rs.map(r => r.y)), x1 = Math.max(...rs.map(r => r.x + r.w)), y1 = Math.max(...rs.map(r => r.y + r.h)); return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; };
const mid = b => [b.x + b.w / 2, b.y + b.h / 2];
// The units: rectangles that overlap are one, a block; in the order of their first rectangle. A ⌘ a unit of its own, melting into none
export function unitsOf(rects) {
  const up = rects.map((_, i) => i), find = i => up[i] === i ? i : (up[i] = find(up[i]));
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) if (!isJohn(rects[i]) && !isJohn(rects[j]) && overlaps(rects[i], rects[j])) up[find(j)] = find(i);
  const by = new Map();
  rects.forEach((_, i) => { const k = find(i); if (!by.has(k)) by.set(k, []); by.get(k).push(i); });
  return [...by.values()].sort((a, b) => a[0] - b[0]).map((rs, id) => ({ id, rs, box: boxOf(rs.map(i => rects[i])), step: rects[rs[0]].step, turn: rects[rs[0]].turn ?? 'cw', ...(isJohn(rects[rs[0]]) ? { john: true } : {}) }));
}
const near = (A, B, rects, join) => A.rs.some(i => B.rs.some(j => touches(rects[i], rects[j], join)));
// The units of a figure in a snake from its bottom left: up the way it went
// while it can, the units with fewer ways on first, as the owner's scheme
// goes — up the left column, down the right (Screenshot 12.52.59 PM); a
// path through them all, each the next one's neighbour, if there is one
export function snakeOf(us, units, adj) {
  if (us.length < 2) return us.slice();
  const c = id => mid(units[id].box), n = us.length;
  const start = us.slice().sort((a, b) => units[a].box.x - units[b].box.x > 0.5 ? 1 : units[b].box.x - units[a].box.x > 0.5 ? -1 : units[a].box.y - units[b].box.y)[0];
  const seen = new Set([start]), path = [start];
  let budget = 20000;
  const go = dir => {
    if (path.length === n) return true;
    if (--budget < 0) return false;
    const at = path.at(-1), p = c(at);
    const cand = us.filter(k => !seen.has(k) && adj(at, k)).map(k => {
      const q = c(k), d = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, u = [(q[0] - p[0]) / d, (q[1] - p[1]) / d];
      return { k, u, straight: -Math.round((u[0] * dir[0] + u[1] * dir[1]) * 10), ways: us.filter(m => !seen.has(m) && m !== k && adj(k, m)).length, d };
    }).sort((a, b) => a.straight - b.straight || a.ways - b.ways || a.d - b.d);
    for (const q of cand) {
      seen.add(q.k); path.push(q.k);
      if (go(q.u)) return true;
      seen.delete(q.k); path.pop();
    }
    return false;
  };
  if (go([0, 1])) return path;
  const out = [start], left = new Set(us.filter(k => k !== start));   // none: the nearest next, the brush across what lies between
  while (left.size) { const p = c(out.at(-1)); let best = null, bd = Infinity; for (const k of left) { const q = c(k), d = Math.hypot(q[0] - p[0], q[1] - p[1]); if (d < bd) { bd = d; best = k; } } out.push(best); left.delete(best); }
  return out;
}
// The figures: units that touch, in the order of their first rectangle, each its units in their snake; a ⌘ a figure of its own
export function figuresOf(rects, units, join = JOIN_NEW) {
  const n = units.length, adjM = units.map(A => units.map(B => A !== B && !A.john && !B.john && near(A, B, rects, join))), adj = (a, b) => adjM[a][b];
  const seen = new Array(n).fill(false), out = [];
  for (let i = 0; i < n; i++) {
    if (seen[i]) continue;
    const comp = [i]; seen[i] = true;
    for (let q = 0; q < comp.length; q++) for (let j = 0; j < n; j++) if (!seen[j] && adjM[comp[q]][j]) { seen[j] = true; comp.push(j); }
    out.push({ us: snakeOf(comp.sort((a, b) => a - b), units, adj), adj });
  }
  return out.map((F, k) => ({ n: k + 1, ...F }));
}

// ---------- the rings: the outline eroded, a step at a time ----------
// A union of rectangles on a grid of its own edges; a square of half-size d
// round a point inside it or not — so the outline eroded by d (its rings
// with square corners, as a ruler draws them) is exact, a grid of the edges
// moved by ±d, a cell in or out by its middle.
function gridOf(rs) {
  const xs = uniq(rs.flatMap(r => [r.x, r.x + r.w])), ys = uniq(rs.flatMap(r => [r.y, r.y + r.h])), nx = xs.length - 1, ny = ys.length - 1, inn = new Uint8Array(Math.max(0, nx * ny));
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const x = (xs[i] + xs[i + 1]) / 2, y = (ys[j] + ys[j + 1]) / 2; if (rs.some(r => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h)) inn[i * ny + j] = 1; }
  return { xs, ys, nx, ny, inn };
}
function uniq(v) { const s = v.slice().sort((a, b) => a - b), out = []; for (const q of s) if (!out.length || q - out.at(-1) > 1e-7) out.push(q); return out; }
const lower = (a, v) => { let lo = 0, hi = a.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (a[m] <= v) lo = m; else hi = m - 1; } return lo; };   // the last a[i] ≤ v
// the square [cx ± d] × [cy ± d] inside the union
function squareIn(G, cx, cy, d) {
  const x0 = cx - d, x1 = cx + d, y0 = cy - d, y1 = cy + d, t = 1e-9;
  if (x0 < G.xs[0] - t || x1 > G.xs.at(-1) + t || y0 < G.ys[0] - t || y1 > G.ys.at(-1) + t) return false;
  const i0 = Math.min(G.nx - 1, lower(G.xs, x0 + t)), i1 = Math.min(G.nx - 1, lower(G.xs, x1 - t)), j0 = Math.min(G.ny - 1, lower(G.ys, y0 + t)), j1 = Math.min(G.ny - 1, lower(G.ys, y1 - t));
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) if (!G.inn[i * G.ny + j]) return false;
  return true;
}
// how deep inside a point is: the largest square round it inside the union, half its side
export function depthIn(G, p) {
  if (!squareIn(G, p[0], p[1], 1e-6)) return 0;
  let lo = 0, hi = Math.max(G.xs.at(-1) - G.xs[0], G.ys.at(-1) - G.ys[0]) / 2;
  for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (squareIn(G, p[0], p[1], m)) lo = m; else hi = m; }
  return lo;
}
// The union eroded by d: its cells, its parts (4-neighbours), every part's loops — the outer one first
function erode(G, d) {
  const lo = G.xs[0] + d, hi = G.xs.at(-1) - d, bo = G.ys[0] + d, to = G.ys.at(-1) - d;
  if (hi - lo < 1e-6 || to - bo < 1e-6) return null;
  const X = uniq([lo, hi, ...G.xs.flatMap(v => [v - d, v + d]).filter(v => v > lo && v < hi)]), Y = uniq([bo, to, ...G.ys.flatMap(v => [v - d, v + d]).filter(v => v > bo && v < to)]);
  const nx = X.length - 1, ny = Y.length - 1, lab = new Int32Array(nx * ny).fill(-2);
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) if (X[i + 1] - X[i] > 1e-9 && Y[j + 1] - Y[j] > 1e-9 && squareIn(G, (X[i] + X[i + 1]) / 2, (Y[j] + Y[j + 1]) / 2, d)) lab[i * ny + j] = -1;
  const inSet = (i, j) => i >= 0 && j >= 0 && i < nx && j < ny && lab[i * ny + j] !== -2, parts = [];
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    if (lab[i * ny + j] !== -1) continue;
    const id = parts.length, cells = [[i, j]]; lab[i * ny + j] = id;
    for (let q = 0; q < cells.length; q++) {
      const [a, b] = cells[q];
      for (const [u, v] of [[a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]]) if (inSet(u, v) && lab[u * ny + v] === -1) { lab[u * ny + v] = id; cells.push([u, v]); }
    }
    parts.push({ cells, loops: loopsOf(X, Y, inSet, cells) });
  }
  return parts.length ? { d, X, Y, nx, ny, lab, parts } : null;
}
const area = L => L.reduce((s, p, i) => { const q = L[(i + 1) % L.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
// The edges round the cells, the inside always on the right — the outer loop
// clockwise, a hole's anticlockwise — linked into loops, the sharpest right
// turn first where two loops touch at a corner; straight runs one edge
function loopsOf(X, Y, inSet, cells) {
  const out = new Map(), key = (i, j) => i * 100003 + j, add = (a, b) => { const k = key(a[0], a[1]); if (!out.has(k)) out.set(k, []); out.get(k).push(b); };
  for (const [i, j] of cells) {
    if (!inSet(i, j + 1)) add([i, j + 1], [i + 1, j + 1]);
    if (!inSet(i + 1, j)) add([i + 1, j + 1], [i + 1, j]);
    if (!inSet(i, j - 1)) add([i + 1, j], [i, j]);
    if (!inSet(i - 1, j)) add([i, j], [i, j + 1]);
  }
  const loops = [], sg = v => Math.sign(v);
  for (const [k0, list0] of out) {
    while (list0.length) {
      const start = [Math.floor(k0 / 100003), k0 % 100003], verts = [start];
      let prev = start, cur = list0.shift(), guard = 0;
      while ((cur[0] !== start[0] || cur[1] !== start[1]) && guard++ < 1e6) {
        verts.push(cur);
        const list = out.get(key(cur[0], cur[1])), din = [sg(cur[0] - prev[0]), sg(cur[1] - prev[1])];
        let best = 0, bs = 9;
        list.forEach((q, m) => { const dout = [sg(q[0] - cur[0]), sg(q[1] - cur[1])], cr = din[0] * dout[1] - din[1] * dout[0], s = cr < 0 ? 0 : cr === 0 ? 1 : 2; if (s < bs) { bs = s; best = m; } });
        prev = cur; cur = list.splice(best, 1)[0];
      }
      const L = verts.filter((v, m) => { const a = verts[(m + verts.length - 1) % verts.length], b = verts[(m + 1) % verts.length]; return (v[0] - a[0]) * (b[1] - v[1]) - (v[1] - a[1]) * (b[0] - v[0]) !== 0; }).map(([i, j]) => [X[i], Y[j]]);
      if (L.length >= 3) loops.push(L);
    }
  }
  return loops.sort((a, b) => area(a) - area(b));   // the outer loop, clockwise, the most negative
}
// Where a point lies in an eroded grid: its part, or -1
function partAt(E, p) {
  if (p[0] <= E.X[0] || p[0] >= E.X.at(-1) || p[1] <= E.Y[0] || p[1] >= E.Y.at(-1)) return -1;
  const i = lower(E.X, p[0]), j = lower(E.Y, p[1]), v = E.lab[i * E.ny + j];
  return v >= 0 ? v : -1;
}
// A unit's rings: its outline eroded by `edge` — the dry brush's half, its edge
// on the outline, so touching tiles meet whatever the paint (the owner,
// 2026-10-19, his first canvas of the evening, IMG_1197 … 1199: "such
// gigantic gaps between the squares … they must adjoin one another, as on
// the screen"; the trail's half the same afternoon, its thin paint laying
// far less than its 10 mm) — then a step more each time, until the paint meets in the
// middle: the innermost ring the trail wide, none narrower than the paint it
// lays (the owner, 2026-10-19: "in the centre it has no room to turn, yet the
// program wants three or four more turns … with a 9 mm pass it starts to
// fidget in place"; "reduce the passes in the core at any brush width"). By
// how deep each part of a block goes: its innermost ring moved out to where
// its paint meets — or, under half a step on from the one before, that one
// moved in there. → the tree of rings: { d, loops, kids }, the roots the outer ones
const cellMid = (E, c) => [(E.X[c[0]] + E.X[c[0] + 1]) / 2, (E.Y[c[1]] + E.Y[c[1] + 1]) / 2];
export function ringsOf(rs, trail, step, edge = trail / 2, over = null) {
  const G = gridOf(rs), h = trail / 2;
  let lo = 0, hi = Math.max(G.xs.at(-1) - G.xs[0], G.ys.at(-1) - G.ys[0]) / 2;
  for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (erode(G, m)) lo = m; else hi = m; }
  const D = lo, ds = [];
  for (let d = Math.min(edge, h); d < D - RING_MIN && ds.length < 4000; d += step) ds.push(d);
  if (!ds.length) ds.push(Math.max(D / 2, D - RING_MIN));                         // narrower than the trail: one ring down its middle
  const levels = ds.map(d => erode(G, d)).filter(Boolean), nodes = levels.map(E => E.parts.map(q => ({ d: E.d, loops: q.loops, kids: [], cells: q.cells, E })));
  for (let l = 1; l < levels.length; l++) for (const n of nodes[l]) {
    const k = partAt(levels[l - 1], cellMid(n.E, n.cells[0]));
    (nodes[l - 1][k] ?? nodes[l - 1][0]).kids.push(n);
  }
  // how deep each branch goes, and its deepest point
  const deep = n => {
    if (n.kids.length) { n.kids.forEach(deep); const c = n.kids.reduce((a, b) => b.Dp > a.Dp ? b : a); n.Dp = c.Dp; n.Pp = c.Pp; return; }
    n.Dp = -1;
    for (const c of n.cells) { const p = cellMid(n.E, c), v = Math.round(depthIn(G, p) * 1e6) / 1e6; if (v > n.Dp) { n.Dp = v; n.Pp = p; } }
  };
  const moveTo = (n, d, p) => { const E = erode(G, d), k = E ? partAt(E, p) : -1; if (k < 0) return false; n.d = d; n.loops = E.parts[k].loops; return true; };
  // the rings a branch keeps: every one short of its middle, then the one whose paint meets there
  const core = (n, root) => {
    if (!n.kids.length) {                                                          // the last of its branch, its paint short of the middle: one more, or itself moved in
      const want = n.Dp - h;
      if (want > n.d + GAP_MIN) {
        if (!root && want - n.d < step / 2) moveTo(n, want, n.Pp);
        else { const c = { d: want, loops: null, kids: [] }; if (moveTo(c, want, n.Pp)) n.kids = [c]; }
      }
      return;
    }
    const keep = [];
    for (const c of n.kids) {
      const want = c.Dp - h;
      if (want <= n.d + GAP_MIN) continue;                                         // n's paint meets in this part's middle already
      if (c.d < want - 1e-9) { core(c, false); keep.push(c); continue; }
      if (!root && n.kids.length === 1 && want - n.d < step / 2 && moveTo(n, want, c.Pp)) { n.kids = []; return; }
      if (moveTo(c, want, c.Pp)) { c.kids = []; keep.push(c); }
    }
    n.kids = keep;
  };
  const roots = nodes[0] ?? [];
  for (const r of roots) { deep(r); core(r, true); }
  let rings = 0, lv = 0;
  const tidy = (n, l) => { rings++; lv = Math.max(lv, l); delete n.E; delete n.cells; delete n.Dp; delete n.Pp; n.kids.forEach(c => tidy(c, l + 1)); };
  roots.forEach(r => tidy(r, 1));
  // the overlap: a ring outside the outer one — past the outline, on the outline grown, every rectangle by as much
  if (over !== null && roots.length && over < roots[0].d - 0.25) {
    const E = over > 1e-6 ? erode(G, over) : erode(gridOf(rs.map(r => ({ x: r.x + over, y: r.y + over, w: r.w - 2 * over, h: r.h - 2 * over }))), 1e-6);
    if (E) {
      const snap = L => L.map(p => p.map(c => Math.round(c * 1e4) / 1e4)), outer = E.parts.map(q => ({ d: over, loops: over > 1e-6 ? q.loops : q.loops.map(snap), kids: [] }));
      for (const r of roots) { const v = r.loops[0][0], k = partAt(E, v); (outer[k] ?? outer[0]).kids.push(r); }
      const made = outer.filter(n => n.kids.length);
      return { G, D, roots: made, rings: rings + made.length, levels: lv + 1 };
    }
  }
  return { G, D, roots, rings, levels: lv };
}

// ---------- the spiral ----------
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const unitV = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
const crs = (a, b) => a[0] * b[1] - a[1] * b[0];
// a loop's corners where it turns right, inward on a clockwise loop, and the way inward from each
function convexOf(L) {
  const out = [];
  L.forEach((v, k) => {
    const a = L[(k + L.length - 1) % L.length], b = L[(k + 1) % L.length], din = unitV(sub(v, a)), dout = unitV(sub(b, v));
    if (crs(din, dout) < 0) out.push({ k, v, diag: [Math.sign(dout[0] - din[0]), Math.sign(dout[1] - din[1])] });
  });
  return out;
}
const hasV = (L, p) => L.some(v => Math.abs(v[0] - p[0]) < 1e-4 && Math.abs(v[1] - p[1]) < 1e-4);
// how many rings in a row a corner goes on inward, each a step diagonally in
function chainOf(node, c) {
  let n = node, v = c.v, k = 0;
  while (n.kids.length === 1 && n.loops.length === 1) {
    const kid = n.kids[0], s = kid.d - n.d, w = [v[0] + c.diag[0] * s, v[1] + c.diag[1] * s];
    if (!hasV(kid.loops[0], w)) break;
    n = kid; v = w; k++;
  }
  return k;
}
// The seam, where the brush comes onto a ring: the corner the hint names, if
// it is one; else of the corners that go on inward the longest, the nearest
function seamOf(node, hint) {
  const C = convexOf(node.loops[0]);
  if (!C.length) return 0;
  const exact = hint && C.find(c => dist(c.v, hint) < 1e-4);
  if (exact) return exact.k;
  const deep = C.map(c => ({ c, n: chainOf(node, c) })), top = Math.max(...deep.map(q => q.n));
  const h = hint ?? [Math.min(...node.loops[0].map(v => v[0])), Math.min(...node.loops[0].map(v => v[1]))];
  return deep.filter(q => q.n === top).sort((a, b) => dist(a.c.v, h) - dist(b.c.v, h))[0].c.k;
}
// A point on a loop: the vertex it is, or put into the side it lies on → { L, k }, or null
function seamAt(L, p) {
  if (!p) return null;
  for (let k = 0; k < L.length; k++) if (dist(L[k], p) < 1e-4) return { L, k };
  for (let k = 0; k < L.length; k++) {
    const a = L[k], b = L[(k + 1) % L.length], ab = dist(a, b) || 1, t = ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / (ab * ab);
    if (t > 0 && t < 1 && Math.abs(crs(sub(b, a), sub(p, a))) / ab < 1e-4) return { L: [...L.slice(0, k + 1), p, ...L.slice(k + 1)], k: k + 1 };
  }
  return null;
}
// Inward from a ring: round it clockwise from its seam — the point given, if
// it lies on it, a corner or the middle of a side, else a corner by the
// rule; with one ring inside, on into the next one's seam a step in: from a
// corner, the last side a step short, on diagonally — the square spiral; from
// a side's middle, an S over the last stretch of the side, CHANGE mm or as
// much as it has, as TAPE's lane change (the owner, 2026-10-19, Screenshot
// 2.21.20 PM: "too sharp. In reality the paint lies like this", IMG_1195,
// 1196; "let the transition be as in TAPE or BASF … a smoothed transition
// from one turn to the next"); else round to the seam, then its holes and the
// rings inside, each from the nearest. o: { corner, change }. The S's two
// ends carry one token, .S, so roundOf lays them two arcs.
// The S past the seam (the owner, 2026-10-19, the same evening, white along
// the tiles' sides on his canvas, IMG_1201): every ring whole round to its
// seam, then in to the next over the side ahead of it, the next ring from
// there round to its own seam — one stretch the S's for every ring, as
// TAPE's lane change, and the outer ring whole along the tile's edge; before
// the seam only where the side ahead is too short. skip: the ring begun
// that far past its seam, where the S coming in lands.
function spiralIn(node, hint, o = {}, tok = null, skip = 0) {
  const at = seamAt(node.loops[0], hint), L = at ? at.L : node.loops[0], k0 = at ? at.k : seamOf(node, hint), n = L.length, pts = [];
  for (let m = 0; m <= n; m++) pts.push(L[(k0 + m) % n].slice());
  if (skip > 0) { const v = unitV(sub(L[(k0 + 1) % n], L[k0])); pts[0] = [pts[0][0] + v[0] * skip, pts[0][1] + v[1] * skip]; }
  if (tok) pts[0].S = tok;
  if (node.kids.length === 1 && node.loops.length === 1) {
    const kid = node.kids[0], s = kid.d - node.d, c = pts.at(-1), b = pts.at(-2), u = unitV(sub(c, b)), on = unitV(sub(L[(k0 + 1) % n], c)), cv = convexOf(L).find(q => q.k === k0);
    const side = !cv && Math.abs(crs(u, on)) < 1e-9 && u[0] * on[0] + u[1] * on[1] > 0, w = cv ? cv.diag : side ? [u[1], -u[0]] : null;
    const next = w ? [c[0] + w[0] * s, c[1] + w[1] * s] : null, room = dist(c, b) - (o.corner ?? CORNER_NEW);
    const ahead = side ? dist(c, L[(k0 + 1) % n]) - s - (o.corner ?? CORNER_NEW) : 0;
    if (side && ahead >= s) {
      const Lx = Math.min(ahead, Math.max(s, o.change ?? CHANGE_NEW)), land = [next[0] + u[0] * Lx, next[1] + u[1] * Lx], t = {};
      if (seamAt(kid.loops[0], next) && seamAt(kid.loops[0], land)) { c.S = t; return pts.concat(spiralIn(kid, next, o, t, Lx)); }
    }
    if (side && room >= s) {
      const Lx = Math.min(room, Math.max(s, o.change ?? CHANGE_NEW)), a = [c[0] - u[0] * Lx, c[1] - u[1] * Lx], t = {};
      a.S = t; pts[pts.length - 1] = a;
      return pts.concat(spiralIn(kid, next, o, t));
    }
    if (dist(c, b) > s + 1e-6) pts[pts.length - 1] = [c[0] - u[0] * s, c[1] - u[1] * s];
    return pts.concat(spiralIn(kid, next ?? pts.at(-1), o));
  }
  let cur = pts.at(-1);
  for (const H of node.loops.slice(1)) { let k = 0; H.forEach((v, m) => { if (dist(v, cur) < dist(H[k], cur)) k = m; }); for (let m = 0; m <= H.length; m++) pts.push(H[(k + m) % H.length].slice()); cur = pts.at(-1); }
  const kids = node.kids.slice();
  while (kids.length) {
    kids.sort((a, b) => Math.min(...a.loops[0].map(v => dist(v, cur))) - Math.min(...b.loops[0].map(v => dist(v, cur))));
    pts.push(...spiralIn(kids.shift(), cur, o)); cur = pts.at(-1);
  }
  return pts;
}
// A unit's spiral: inward from the outer ring nearest the hint; outward, the
// same reversed — from the middle to the outer ring's seam at the hint
export function spiralOf(R, hint, out = false, o = {}) {
  const roots = R.roots.slice(), pts = [];
  let cur = hint;
  while (roots.length) {
    roots.sort((a, b) => Math.min(...a.loops[0].map(v => dist(v, cur ?? v))) - Math.min(...b.loops[0].map(v => dist(v, cur ?? v))));
    pts.push(...spiralIn(roots.shift(), cur, o)); cur = pts.at(-1);
  }
  return out ? pts.reverse() : pts;
}
// A unit's spiral as the brush paints it: inward — from its outer ring at
// `at`, or the corner nearest `hint` — or outward, to `at` or that corner;
// the brush going round as the unit's turn says, ↻ clockwise or ↺
// anticlockwise. The rings are built clockwise: the other way, the unit
// mirrored, built and mirrored back. o: { trail, corner, change }
const mx = p => { if (!p) return p; const q = [-p[0], p[1]]; if (p.S) q.S = p.S; return q; };
export function unitPath(U, rects, o, dir, at, hint) {
  const mirror = (dir === 'in') === (U.turn === 'ccw');
  if (mirror && !U.Rm) U.Rm = ringsOf(U.rs.map(i => { const r = rects[i]; return { x: -(r.x + r.w), y: r.y, w: r.w, h: r.h }; }), o.trail ?? trailOf(o), U.step, o.edge ?? edgeOf(o), o.over !== undefined ? o.over : overDepth(o));
  const R = mirror ? U.Rm : U.R, pts = spiralOf(R, mirror ? mx(at ?? hint ?? null) : at ?? hint ?? null, dir === 'out', o);
  return mirror ? pts.map(mx) : pts;
}
// A magnet of a rectangle, its outer ring d mm in: its middle, a corner, a side's middle
export function magnetPoint(r, m, d) {
  const L = r.x + d, R = r.x + r.w - d, B = r.y + d, T = r.y + r.h - d, cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  return { c: [cx, cy], n: [cx, T], ne: [R, T], e: [R, cy], se: [R, B], s: [cx, B], sw: [L, B], w: [L, cy], nw: [L, T] }[m] ?? null;
}
// A unit's magnets: first its middle — the middle of its innermost ring,
// where a spiral ends inside — then its rectangles' corners and sides'
// middles that lie on its outer ring: [{ id, m, p, c }]
export function magnetsOf(U, rects) {
  const d = U.R.roots[0]?.d ?? 0, loops = U.R.roots.map(n => n.loops[0]), out = [];
  let n = U.R.roots[0]; while (n?.kids.length) n = n.kids[0];
  const L = n?.loops[0], cen = L ? [(Math.min(...L.map(v => v[0])) + Math.max(...L.map(v => v[0]))) / 2, (Math.min(...L.map(v => v[1])) + Math.max(...L.map(v => v[1]))) / 2] : mid(U.box);
  out.push({ id: rects[U.rs[0]].id, m: 'c', p: cen, c: true });
  for (const i of U.rs) for (const m of MAGNETS.slice(1)) {
    const p = magnetPoint(rects[i], m, d);
    if (loops.some(Lp => seamAt(Lp, p)) && !out.some(q => !q.c && dist(q.p, p) < 1e-3)) out.push({ id: rects[i].id, m, p, c: false });
  }
  return out;
}
// A node's end on the plan: its unit and its magnet — a magnet no longer on
// the outer ring (its tile grown into a block) the nearest one that is
function endOf(e, rects, units) {
  const ri = rects.findIndex(r => r.id === e.id); if (ri < 0) return null;
  const U = units.find(u => u.rs.includes(ri)), M = U?.M;
  if (!U || U.john) return null;                                                   // a ⌘ no magnets: no node holds on it
  if (e.m === 'c') return { u: U.id, ...M[0] };
  const q = magnetPoint(rects[ri], e.m, U.R.roots[0]?.d ?? 0), rim = M.filter(m => !m.c);
  if (!rim.length) return { u: U.id, ...M[0] };
  return { u: U.id, ...rim.reduce((a, m) => dist(m.p, q) < dist(a.p, q) ? m : a) };
}
// The links the nodes make: one way out of a unit and one way in, a later
// node taking the place of the one before; none that would close a loop.
// → [{ i (the node's index), a, b: { u, id, m, p, c } }]
export function linksOf(nodes, rects, units) {
  const out = new Map(), inn = new Map();
  (nodes || []).forEach((nd, i) => {
    const a = endOf(nd.a, rects, units), b = endOf(nd.b, rects, units);
    if (!a || !b || a.u === b.u) return;
    for (let u = b.u, g = 0; g < 1e4; g++) { if (u === a.u) return; const l = out.get(u); if (!l) break; u = l.b.u; }
    const oa = out.get(a.u); if (oa) { out.delete(a.u); inn.delete(oa.b.u); }
    const ib = inn.get(b.u); if (ib) { inn.delete(b.u); out.delete(ib.a.u); }
    const L = { i, a, b }; out.set(a.u, L); inn.set(b.u, L);
  });
  return [...out.values()].sort((p, q) => p.i - q.i);
}
// The figures the nodes make: a chain of units a figure, from the one no
// node comes into; a unit no node touches a figure of its own; in the order
// of their first tile
function figuresByNodes(rects, units, links, join) {
  const out = new Map(links.map(l => [l.a.u, l])), inn = new Map(links.map(l => [l.b.u, l])), figs = [];
  const near_ = units.map(A => units.map(B => A !== B && near(A, B, rects, join)));
  for (const U of units) {
    if (inn.has(U.id)) continue;
    const us = [U.id], ls = [];
    for (let u = U.id, g = 0; out.has(u) && g < 1e4; g++) { const l = out.get(u); ls.push(l); u = l.b.u; us.push(u); }
    figs.push({ us, ls });
  }
  const first = F => Math.min(...F.us.flatMap(u => units[u].rs));
  return figs.sort((a, b) => first(a) - first(b)).map((F, k) => ({ n: k + 1, ...F, adj: (a, b) => near_[a][b] || F.ls.some(l => (l.a.u === a && l.b.u === b) || (l.a.u === b && l.b.u === a)) }));
}
// The nodes the snake would make, to start from and change: between every
// two units of a figure, from where the one ends to where the next begins
export function snakeNodes(P, rects) {
  const out = [], rimNear = (M, p) => M.filter(m => !m.c).reduce((a, m) => !a || dist(m.p, p) < dist(a.p, p) ? m : a, null) ?? M[0];
  for (const F of P.figs) for (let k = 0; k + 1 < F.us.length; k++) {
    const A = P.units[F.us[k]], B = P.units[F.us[k + 1]];
    const a = k % 2 ? A.M[0] : rimNear(A.M, F.ends[k].b), b = (k + 1) % 2 ? rimNear(B.M, F.ends[k + 1].a) : B.M[0];
    out.push({ a: { id: a.id, m: a.m }, b: { id: b.id, m: b.m } });
  }
  return out;
}
// the points of a path without repeats and without points in a straight run; an S's ends kept
export function cleanPts(P) {
  const a = [];
  for (const p of P) if (!a.length || dist(p, a.at(-1)) > 1e-6) a.push(p); else if (p.S && !a.at(-1).S) a.at(-1).S = p.S;
  return a.filter((p, i) => i === 0 || i === a.length - 1 || p.S || Math.abs(crs(sub(p, a[i - 1]), sub(a[i + 1], p))) > 1e-9 * dist(p, a[i - 1]) * dist(a[i + 1], p) || (p[0] - a[i - 1][0]) * (a[i + 1][0] - p[0]) + (p[1] - a[i - 1][1]) * (a[i + 1][1] - p[1]) < 0);
}
// A turn back on itself — a middle's last side up, the way to the next
// middle down — would stop the board dead: a jog of w mm sideways there, on
// the longer side's end, two turns of 90° instead, each run through
export function jogged(P, w) {
  const out = P.slice();
  for (let i = 1; i < out.length - 1; i++) {
    const A = out[i - 1], V = out[i], B = out[i + 1], u1 = unitV(sub(V, A)), u2 = unitV(sub(B, V));
    if (u1[0] * u2[0] + u1[1] * u2[1] > -0.5) continue;
    const before = dist(A, V) > dist(V, B), u = before ? u1 : u2, left = crs(u1, u2) >= 0, n = left ? [-u[1], u[0]] : [u[1], -u[0]];
    const J = [V[0] + n[0] * w, V[1] + n[1] * w];
    out.splice(before ? i : i + 1, 0, J);
    i++;
  }
  return out;
}
// Every turn a tangent arc of radius `corner`, or as much as half of each
// side lets it — so the board runs through it and never stops (the owner,
// 2026-10-17: "rounded corners … a stop of the brush kills the effect");
// a turn of more than 170°, or one too tight, left a corner. Two points
// with one .S token an S between them (spiralIn): two arcs, no turn rounded
// at either end, the side up to it the turn's before it.
// → pieces in canvas mm: { t: 'L', a, b } | { t: 'A', a, b, c, r, left }
export function roundOf(P, corner) {
  const out = [], n = P.length, isS = i => i >= 0 && i + 1 < n && !!P[i].S && P[i].S === P[i + 1].S, free = i => isS(i - 1) || isS(i);
  let cur = P[0];
  for (let i = 1; i < n - 1 || (i === n - 1 && isS(i - 1)); i++) {
    if (isS(i - 1)) {
      const a = P[i - 1], u = i >= 2 ? unitV(sub(a, P[i - 2])) : i + 1 < n ? unitV(sub(P[i + 1], P[i])) : unitV(sub(P[i], a));
      if (dist(cur, a) > 1e-6) out.push({ t: 'L', a: cur, b: a });
      out.push(...sCurve(a, P[i], u)); cur = P[i];
      continue;
    }
    const A = P[i - 1], V = P[i], B = P[i + 1];
    if (isS(i)) { if (dist(cur, V) > 1e-6) out.push({ t: 'L', a: cur, b: V }); cur = V; continue; }
    const l1 = dist(A, V) * (free(i - 1) ? 1 : 0.5), l2 = dist(V, B) * (free(i + 1) ? 1 : 0.5), u1 = unitV(sub(V, A)), u2 = unitV(sub(B, V));
    const th = Math.acos(Math.max(-1, Math.min(1, u1[0] * u2[0] + u1[1] * u2[1])));
    if (th < 1e-4) continue;
    const tn = Math.tan(th / 2), r = th > 170 * Math.PI / 180 ? 0 : Math.min(corner, Math.min(l1, l2) / tn);
    if (r < R_MIN) { if (dist(cur, V) > 1e-6) out.push({ t: 'L', a: cur, b: V }); cur = V; continue; }
    const t = r * tn, a = [V[0] - u1[0] * t, V[1] - u1[1] * t], b = [V[0] + u2[0] * t, V[1] + u2[1] * t], left = crs(u1, u2) > 0;
    const nr = left ? [-u1[1], u1[0]] : [u1[1], -u1[0]], c = [a[0] + nr[0] * r, a[1] + nr[1] * r];
    if (dist(cur, a) > 1e-6) out.push({ t: 'L', a: cur, b: a });
    out.push({ t: 'A', a, b, c, r, left });
    cur = b;
  }
  if (P.length > 1 && dist(cur, P.at(-1)) > 1e-6) out.push({ t: 'L', a: cur, b: P.at(-1) });
  return out;
}
// An S from a to b, tangent to u at both: two arcs of one radius, turning
// towards b's side and back, the switch half way
function sCurve(a, b, u) {
  const e = sub(b, a), lat = crs(u, e), y = Math.abs(lat);
  if (y < 1e-6) return [{ t: 'L', a, b }];
  const left = lat > 0, w = left ? [-u[1], u[0]] : [u[1], -u[0]], R = (e[0] * e[0] + e[1] * e[1]) / (4 * y), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  return [{ t: 'A', a, b: m, c: [a[0] + w[0] * R, a[1] + w[1] * R], r: R, left }, { t: 'A', a: m, b, c: [b[0] - w[0] * R, b[1] - w[1] * R], r: R, left: !left }];
}
export const lenOf = g => g.t === 'L' ? dist(g.a, g.b) : g.r * sweepC(g);
const sweepC = g => { const a0 = Math.atan2(g.a[1] - g.c[1], g.a[0] - g.c[0]), a1 = Math.atan2(g.b[1] - g.c[1], g.b[0] - g.c[0]); let s = (a1 - a0) * (g.left ? 1 : -1); while (s <= 1e-12) s += 2 * Math.PI; while (s > 2 * Math.PI) s -= 2 * Math.PI; return s; };
// a point s mm along a piece, and the way it goes there
export function atPiece(g, s) {
  if (g.t === 'L') { const L = dist(g.a, g.b) || 1, u = [(g.b[0] - g.a[0]) / L, (g.b[1] - g.a[1]) / L]; return { p: [g.a[0] + u[0] * s, g.a[1] + u[1] * s], t: u }; }
  const a0 = Math.atan2(g.a[1] - g.c[1], g.a[0] - g.c[0]), sg = g.left ? 1 : -1, a = a0 + sg * s / g.r;
  return { p: [g.c[0] + g.r * Math.cos(a), g.c[1] + g.r * Math.sin(a)], t: [-Math.sin(a) * sg, Math.cos(a) * sg] };
}

// ---------- ⌘, St. John's Arms (ST-JOHN) ----------
// The owner, 2026-10-19, St_John/: the old sign, Screenshot 8.23.36 PM — "an
// interesting solution for us, how the brush will go" — his arrows on it in
// … PM 2, and the sign drawn, IMAGE 2026-10-19 20:22:20. A figure of its
// own, laid with ⌘ in the Tools between R and N: its box in four lobes, its
// quarters, each filled by rings as a tile is ("it is just how the brush goes
// over the canvas; there may be 25 of them, as the canvas is"). A loop: one
// ring of every lobe at one depth, as ⌘ is drawn in one line — round lobe 1,
// the bottom right, clockwise, up its inner side and straight on through the
// middle into lobe 2, the top right, round it, along its inner side on into
// 3, the top left, down into 4, the bottom left, and along its top into 1
// again — so every lobe's inner sides go on across the middle and cross
// there, the sign's middle a grid, as he drew it. The brush lands in the
// middle on the outermost loop ("the sign goes from the centre"), then loop
// after loop inward, to the next by the ring change, an S over lobe 4's top:
// one line, no lift. ↻, as his arrows; ↺, the sign mirrored.
export const JOHN_TWO = 0.5;                               // a ⌘'s chance of a second paint, on its lobes 2 and 4 (Claude's)
// its lobes, in the brush's order: 1 the bottom right, 2 the top right, 3 the top left, 4 the bottom left
export function lobesOf(r) {
  const a = r.w / 2, b = r.h / 2, cx = r.x + a, cy = r.y + b;
  return [{ x: cx, y: r.y, w: a, h: b }, { x: cx, y: cy, w: a, h: b }, { x: r.x, y: cy, w: a, h: b }, { x: r.x, y: r.y, w: a, h: b }];
}
// its rings, alike in every lobe: a tile's, its first lobe's; their depths, the outermost first
export const johnRings = (r, trail, step, edge, over = null) => ringsOf([lobesOf(r)[0]], trail, step, edge, over);
export function johnDepths(R) { const out = []; let n = R.roots[0]; while (n) { out.push(n.d); n = n.kids[0]; } return out; }
// One loop d mm in: its twelve corners from lobe 1's top right on, every
// one a turn to the right; at the inner corners none, the sides on through
// the middle, crossing there
export function johnLoop(r, d) {
  const x0 = r.x + d, x1 = r.x + r.w - d, y0 = r.y + d, y1 = r.y + r.h - d, cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  return [[x1, cy - d], [x1, y0], [cx + d, y0], [cx + d, y1], [x1, y1], [x1, cy + d], [x0, cy + d], [x0, y1], [cx - d, y1], [cx - d, y0], [x0, y0], [x0, cy - d]];
}
// The path: from the middle, on the outermost loop's line across it — lobe
// 4's top going on into 1's — round every loop; to the next by an S over
// lobe 4's top, Ring change long or as much as the side has, landing where
// the next loop's line crosses the middle; the side too short, straight on
// a step in. The last loop closed where it began.
export function johnPts(r, ds, o = {}) {
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2, corner = o.corner ?? CORNER_NEW, pts = [];
  ds.forEach((d, k) => {
    if (!k) pts.push([cx, cy - d]);
    pts.push(...johnLoop(r, d));
    const n = ds[k + 1];
    if (n === undefined) { pts.push(k ? [cx - d, cy - d] : [cx, cy - d]); return; }
    const B = [cx - n, cy - n], s = n - d, room = B[0] - (r.x + d + corner);
    if (room >= s) { const L = Math.min(room, Math.max(s, o.change ?? CHANGE_NEW)), A = [B[0] - L, cy - d], t = {}; A.S = t; B.S = t; pts.push(A, B); }
    else pts.push(B);
  });
  return pts;
}
export function johnPath(U, rects, o = {}) {
  const r = rects[U.rs[0]], ds = johnDepths(U.R), ccw = U.turn === 'ccw', pts = johnPts(ccw ? { x: -(r.x + r.w), y: r.y, w: r.w, h: r.h } : r, ds, o);
  return ccw ? pts.map(mx) : pts;
}

// ---------- the plan ----------
// Every unit its rings; every figure one path. With nodes (the owner,
// 2026-10-17: "the brush's way must be set, not left to itself") the
// figures their chains, each unit as its nodes say: a node into its middle,
// it spirals out — to the magnet the next node leaves from, its outer ring
// turned to end there; a node into its outer ring, it spirals in from there
// to its middle, where the next leaves; both on the rim, in and then across
// the rings to leave; both in the middle, out and back across. Without, the
// snake: its units from the bottom left, the first from its middle out, the
// next from its outside in, and so on — out to the corner nearest the next
// unit, in from the corner nearest where the brush is; from a middle straight
// to the next middle across the rings. Every turn rounded.
// The last two cross the tile's rings to leave — a tile so marked ! (the
// owner, 2026-10-17, on a node laid in and out of one middle by mistake,
// Screenshot 3.54.39 PM: "maybe mark such a square with the sign !"):
// cross, per unit, null, 'middle' or 'edge'.
// o: { brush, swell, edgeOut, overlap, join, corner, change, nodes } → { units, figs: [{ n, us, ls, pts, pieces, length, along, ends, cross }], links, manual, length }
export function planOf(rects, o) {
  const trail = trailOf(o), edge = edgeOf(o), over = overDepth(o), units = unitsOf(rects), way = { trail, edge, over, corner: o.corner ?? CORNER_NEW, change: o.change ?? CHANGE_NEW };
  for (const U of units) {
    if (U.john) { U.R = johnRings(rects[U.rs[0]], trail, U.step, edge, over); U.M = []; continue; }
    U.R = ringsOf(U.rs.map(i => rects[i]), trail, U.step, edge, over); U.M = magnetsOf(U, rects);
  }
  const links = o.nodes?.length ? linksOf(o.nodes, rects, units) : [], manual = links.length > 0;
  const F0 = manual ? figuresByNodes(rects, units, links, o.join ?? JOIN_NEW) : figuresOf(rects, units, o.join ?? JOIN_NEW).map(F => ({ ...F, ls: [] }));
  const figs = F0.map(F => {
    const pts = [], at = [], ends = [], cross = [];
    F.us.forEach((id, k) => {
      const U = units[id], next = F.us[k + 1], prev = pts.at(-1), nextMid = next !== undefined ? mid(units[next].box) : null;
      let s, x = null;
      if (U.john) s = johnPath(U, rects, way);
      else if (!manual) { const out = k % 2 === 0; s = unitPath(U, rects, way, out ? 'out' : 'in', null, out ? nextMid ?? prev ?? null : prev ?? null); }
      else {
        const inE = k ? F.ls[k - 1].b : null, outE = next !== undefined ? F.ls[k].a : null, rim = e => e && !e.c;
        if (rim(inE) && rim(outE)) { s = [...unitPath(U, rects, way, 'in', inE.p), outE.p]; x = 'edge'; }
        else if (rim(inE)) s = unitPath(U, rects, way, 'in', inE.p);
        else if (rim(outE)) s = unitPath(U, rects, way, 'out', outE.p);
        else if (inE && outE) { s = unitPath(U, rects, way, 'out', null, nextMid); s.push(s[0]); x = 'middle'; }
        else if (outE) s = unitPath(U, rects, way, 'in', null, null);
        else s = unitPath(U, rects, way, 'out', null, null);
      }
      at.push(pts.length); ends.push({ a: s[0], b: s.at(-1) }); cross.push(x); pts.push(...s);
    });
    const P = jogged(cleanPts(pts), trail / 2), pieces = roundOf(P, o.corner ?? CORNER_NEW), length = pieces.reduce((s, g) => s + lenOf(g), 0);
    // where each unit starts, mm along the path: the nearest point of the rounded path to its first point
    const along = at.map(i => alongTo(pieces, pts[i]));
    return { ...F, pts: P, pieces, length, along, ends, cross, start: P[0], end: P.at(-1) };
  });
  return { units, figs, links, manual, length: figs.reduce((s, F) => s + F.length, 0) };
}
function alongTo(pieces, p) {
  let s = 0, best = 0, bd = Infinity;
  for (const g of pieces) { const L = lenOf(g); for (let q = 0; q <= 4; q++) { const t = L * q / 4, d = dist(atPiece(g, t).p, p); if (d < bd) { bd = d; best = s + t; } } s += L; }
  return best;
}
// a figure's name, for the LCD and the stop
export const figName = (F, units) => `Figure ${F.n}${F.us.length > 1 ? `, ${F.us.length} units` : units[F.us[0]].john ? ', ⌘ St. John\'s Arms' : units[F.us[0]].rs.length > 1 ? ', a block' : ', one tile'}`;
export const wipeWhy = (F, units) => `${figName(F, units)}: the brush up — wipe it; are its sausages squeezed? Then Continue`;

// DRAG's rows for plotRun, mm from the canvas's centre: a figure a row, one
// block — no stop on the way, so no PAUSE before the figure's end; a stop
// before every next figure
const toM = (o, q) => toMachine([q[0] - o.cw / 2, o.ch / 2 - q[1]]);
function machinePiece(g, o) {
  if (g.t === 'L') return { t: 'L', a: toM(o, g.a), b: toM(o, g.b) };
  const A = toM(o, g.a), B = toM(o, g.b), C = toM(o, g.c);
  return { t: 'A', a: A, b: B, c: C, r: g.r, d: (A.x - C.x) * (B.y - C.y) - (A.y - C.y) * (B.x - C.x) >= 0 ? 1 : -1 };
}
export function dragRows(P, o) {
  const ps = [], info = [], stops = [];
  let length = 0;
  for (const F of P.figs) {
    if (!F.pieces.length) continue;
    if (ps.length) stops.push({ at: ps.length, why: wipeWhy(F, P.units) });
    const row = ps.length + 1;
    ps.push(F.pieces.map(g => ({ ...machinePiece(g, o), tilt: 0, row })));
    info.push({ label: `${figName(F, P.units)} · the brush down all the way`, fi: F.n - 1, L: F.length });
    length += F.length;
  }
  return { ps, info, stops, runs: ps.length, length };
}
// Before every stop the brush flies on over the next figure's start and goes
// up to `up`° — the elbow's highest — so the owner wipes it there (the owner,
// 2026-10-17: "here the brush can be lifted up, so that I wipe it"); after
// Continue it comes down and lands as ever. plotRun's blocks, changed: the
// flight to the next start before the pause, an elbow block up
export function wipeBlocks(blocks, up = WIPE_NEW) {
  const out = blocks.slice();
  for (let i = 0; i < out.length; i++) {
    if (out[i].kind !== 'pause') continue;
    const j = out.findIndex((b, m) => m > i && b.kind === 'move' && /^T /.test(b.cmds?.[0] ?? ''));
    if (j < 0) continue;
    const fly = out.splice(j, 1)[0];
    out.splice(i, 0, fly, { kind: 'arm', cmd: `J 2 ${up}`, row: fly.row, wipe: true });
    i += 2;
  }
  return out;
}

// The paths as an SVG in canvas mm, y down, origin top left: a <path> a figure, in running order
const f2 = v => (Math.round(v * 100) / 100).toString();
export function dragSvg(P, o) {
  const Y = v => o.ch - v, rows = P.figs.filter(F => F.pieces.length).map(F => {
    const d = [`M${f2(F.pieces[0].a[0])} ${f2(Y(F.pieces[0].a[1]))}`];
    for (const g of F.pieces) d.push(g.t === 'L' ? `L${f2(g.b[0])} ${f2(Y(g.b[1]))}` : `A${f2(g.r)} ${f2(g.r)} 0 0 ${g.left ? 0 : 1} ${f2(g.b[0])} ${f2(Y(g.b[1]))}`);
    return `  <path d="${d.join(' ')}" data-figure="${F.n}" data-units="${F.us.length}"/>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<!-- Rembrandt INKA · drag · canvas ${o.cw}x${o.ch} mm, y down, origin top left. Each <path> is one figure, the brush down all the way, in running order; a wipe between them. -->\n<svg xmlns="http://www.w3.org/2000/svg" width="${o.cw}mm" height="${o.ch}mm" viewBox="0 0 ${o.cw} ${o.ch}">\n<g id="drag" data-ink="none" data-brush-mm="${o.brush}" data-trail-mm="${trailOf(o)}" fill="none" stroke="#24221F" stroke-width="1">\n${rows.join('\n')}\n</g>\n</svg>\n`;
}

// ---------- the paints: sausages across the rings ----------
// As Florian squeezes his across every lane of his track and the brush lands
// in them (master_flo_hires/ 11.03.10, 11.20.04 AM): a spoke, a sausage from
// a unit's outline in across its rings, so every ring takes it up as it
// passes — since 2026-10-19 the arms of an X, corner to the innermost ring
// (spokesOf); a unit its paint, now and then a second — the next one's, or an accent, thin — and
// a figure of one unit one pure paint, Heather Day's flat blue among her
// stains (HDay/ Painting 12; the owner's brown "[", IMG_1027).
// A sausage: { a, b } canvas mm, along it the paint across the rings, SAUSAGE_W wide.
export function sausagesOf(rects, ri) {
  const out = [];
  rects.forEach((r, i) => { if (ri !== undefined && ri !== i) return; r.ss.forEach((q, k) => out.push({ ri: i, k, a: [r.x + q.a[0] * r.w, r.y + q.a[1] * r.h], b: [r.x + q.b[0] * r.w, r.y + q.b[1] * r.h], paint: q.paint, thin: !!q.thin })); });
  return out;
}
const unitOfRect = (units, i) => units.find(U => U.rs.includes(i));
// a unit's sausages, by its rectangles
export const unitSausages = (U, rects) => U.rs.flatMap(i => sausagesOf(rects, i));
function erodeZero(G) {
  const inSet = (i, j) => i >= 0 && j >= 0 && i < G.nx && j < G.ny && !!G.inn[i * G.ny + j], cells = [];
  for (let i = 0; i < G.nx; i++) for (let j = 0; j < G.ny; j++) if (G.inn[i * G.ny + j]) cells.push([i, j]);
  return loopsOf(G.xs, G.ys, inSet, cells);
}
// The spokes a cross, X (the owner, 2026-10-19, Screenshot 2.21.20 PM, his
// beige tile 1 laid by hand: "show the paint with a cross X, it is logical
// and simple; at the corners eight times turned out of no use in practice"):
// from every corner of a tile along its diagonal in to its innermost ring,
// so every ring crosses each arm and the middle is the brush's; the round end
// on the tile at the corner, clear of both its sides. A block: from every
// corner of its outline in at 45°, as far as the middle of its part goes, no
// deeper than its innermost ring. A ⌘: every lobe its X, as a tile's, the
// lobes in their order. → [{ a, b }]
export function spokesOf(U, rects, o = {}) {
  const out = [], arm = (k, v, s0, s1) => { if (s1 > s0 + 0.5) out.push({ a: [k[0] + v[0] * s0, k[1] + v[1] * s0], b: [k[0] + v[0] * s1, k[1] + v[1] * s1] }); };
  // a rectangle's X, in to the innermost ring of half sides hx, hy round its middle
  const cross = (r, hx, hy) => {
    const c = [r.x + r.w / 2, r.y + r.h / 2];
    for (const k of [[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h]]) {
      const v = unitV(sub(c, k)), ax = Math.abs(v[0]), ay = Math.abs(v[1]);
      arm(k, v, SAUSAGE_W / 2 / Math.max(1e-9, Math.min(ax, ay)), dist(k, c) - Math.min(ax > 1e-9 ? hx / ax : Infinity, ay > 1e-9 ? hy / ay : Infinity));
    }
  };
  if (U.john) {
    const r = rects[U.rs[0]], dN = johnDepths(U.R ?? johnRings(r, trailOf(o), U.step, edgeOf(o))).at(-1) ?? 0;
    for (const q of lobesOf(r)) cross(q, Math.max(0, q.w / 2 - dN), Math.max(0, q.h / 2 - dN));
    return out;
  }
  const R = U.R ?? ringsOf(U.rs.map(i => rects[i]), trailOf(o), U.step, edgeOf(o));
  let n = R.roots[0]; while (n?.kids.length) n = n.kids[0];
  const L = n?.loops[0], half = k => L ? (Math.max(...L.map(v => v[k])) - Math.min(...L.map(v => v[k]))) / 2 : 0;
  if (U.rs.length === 1) { cross(rects[U.rs[0]], half(0), half(1)); return out; }
  const G = gridOf(U.rs.map(i => rects[i])), cap = (n?.d ?? 0) * Math.SQRT2;
  for (const Lp of erodeZero(G)) for (const cv of convexOf(Lp)) {
    const v = unitV(cv.diag), ok = s => squareIn(G, cv.v[0] + v[0] * s, cv.v[1] + v[1] * s, Math.max(1e-6, s / Math.SQRT2 - 1e-6));
    let lo = 0, hi = Math.max(G.xs.at(-1) - G.xs[0], G.ys.at(-1) - G.ys[0]) * Math.SQRT2;
    for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (ok(m)) lo = m; else hi = m; }
    arm(cv.v, v, SAUSAGE_W / 2 * Math.SQRT2, Math.min(lo - 1, cap));
  }
  return out;
}
// The spoke M lays at a point of a unit: the arm of its X nearest it
const segD = (p, a, b) => { const v = sub(b, a), l2 = v[0] * v[0] + v[1] * v[1], t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * v[0] + (p[1] - a[1]) * v[1]) / l2)) : 0; return Math.hypot(p[0] - a[0] - t * v[0], p[1] - a[1] - t * v[1]); };
export function spokeAt(U, rects, p, o = {}) {
  let best = null, bd = Infinity;
  for (const q of spokesOf(U, rects, o)) { const d = segD(p, q.a, q.b); if (d < bd) { bd = d; best = q; } }
  return best;
}
// a sausage in the fractions of the rectangle of its unit its middle lies in
export function keepIn(U, rects, q) {
  const m = [(q.a[0] + q.b[0]) / 2, (q.a[1] + q.b[1]) / 2], i = U.rs.find(j => { const r = rects[j]; return m[0] >= r.x - 1e-6 && m[0] <= r.x + r.w + 1e-6 && m[1] >= r.y - 1e-6 && m[1] <= r.y + r.h + 1e-6; }) ?? U.rs[0], r = rects[i];
  return { i, s: { a: [(q.a[0] - r.x) / r.w, (q.a[1] - r.y) / r.h], b: [(q.b[0] - r.x) / r.w, (q.b[1] - r.y) / r.h], paint: q.paint, ...(q.thin ? { thin: true } : {}) } };
}

// The palettes: CCD's (TAPE's families, meta 1 … 4) and INKA's own, in the
// owner's paints (Claude's reading): Inka, his paper test of the same day
// (IMG_1027) — sand, orange, ochre, pink, orange yellow, rose, the brown "["
// pure; Heather Day's warm (HDay/ the pit, color_01) — peach, ochre, plum,
// gold, its pure a plum; and her blue (Painting 12, color_02) — the blues and
// viridian over white, threads of orange and lime, its pure the flat ultramarine
export const INKA_META = {
  ...CCD_META,
  'Inka': { name: 'Inka', core: ['sand', 'orange', 'ochre', 'pink', 'oyellow', 'roseazo'], accent: ['red', 'white'], pure: 'brown' },
  'HDay warm': { name: 'HDay warm', core: ['sand', 'pink', 'ochre', 'oyellow', 'deepred', 'magenta'], accent: ['purple', 'sky', 'white'], pure: 'purple' },
  'HDay blue': { name: 'HDay blue', core: ['p04', 'sky', 'p03', 'viridian', 'white'], accent: ['orange', 'p01', 'green'], pure: 'ultramarine' },
};
// a figure of one unit, its pure paint: the palette's, or its darkest core paint but black, white
export function pureOf(pal) {
  if (pal.pure) return pal.pure;
  const lum = id => luminance(PAINT[id].hex), c = pal.core.filter(id => id !== 'black' && id !== 'white');
  return (c.length ? c : pal.core).slice().sort((a, b) => lum(a) - lum(b))[0];
}
// a unit's paints as its sausages have them: the commonest, then the rest
function paintsOfUnit(ss) {
  const n = {};
  for (const q of ss) n[q.paint] = (n[q.paint] || 0) + (q.thin ? 0.5 : 1);
  return Object.keys(n).sort((a, b) => n[b] - n[a]);
}
// A figure's sausages dealt (mode 'colours': new paints, their places kept —
// or, none lying, the spokes laid; 'spokes': new places, the paints kept —
// or, none, dealt): every unit a core paint, never its neighbour's or the one
// before — the least used of them; with the palette's shares (pal.w, the
// reference's), drawn at random as from an urn of the tiles, each paint its
// share of them, so every press deals anew, as the meta keys do (the owner,
// 2026-10-19: "there is no random going through the colours, as in meta");
// now and then a second, the next one's or an accent; one unit, the pure paint. st, a deal over many figures (dealFigures): its counts, and a
// tile's neighbours in any figure; a lone one then its paint by the shares.
// → Map(rect index → its sausages), the palette for every rectangle of the figure
export function dealFigure(rects, units, F, pal, seed, mode = 'colours', o = {}, st = null) {
  const r = rng(seed ^ 0x2545f491), pick = a => a[Math.floor(r() * a.length)], used = st?.used ?? {}, main = st?.main ?? {}, out = new Map();
  for (const id of F.us) for (const i of units[id].rs) out.set(i, []);
  const spotU = !pal.spot ? null : st ? st.spot : F.us[Math.floor(r() * F.us.length)];   // the spot's one unit
  const lone = F.us.length === 1, total = (st?.total ?? F.us.length) - (pal.spot ? 1 : 0), Wsum = pal.core.reduce((s, q) => s + (pal.w?.[q] ?? 0), 0) || 1;
  const urn = c => { const ws = c.map(q => Math.max(0.05, (pal.w?.[q] ?? 0) / Wsum * total - (used[q] || 0))); let x = r() * ws.reduce((s, v) => s + v, 0); for (let k = 0; k < c.length; k++) if ((x -= ws[k]) <= 0) return c[k]; return c.at(-1); };
  F.us.forEach((id, k) => {
    const U = units[id], had = unitSausages(U, rects), was = paintsOfUnit(had);
    let p1, p2 = null;
    if (mode === 'spokes' && was.length) { p1 = was[0]; p2 = was[1] ?? null; }
    else if (id === spotU) p1 = pal.spot;                                         // the spot: this unit, all of it, and no other
    else if (lone && !st && !U.john) p1 = pureOf(pal);
    else {
      const by = st ? Object.keys(main).map(Number).filter(m => m !== id && st.near(id, m)) : F.us.filter(m => main[m] && F.adj(id, m));
      const avoid = new Set([main[F.us[k - 1]], ...by.map(m => main[m])].filter(Boolean));
      let c = pal.core.filter(q => !avoid.has(q));
      if (!c.length) c = pal.core.filter(q => q !== main[F.us[k - 1]]);
      if (!c.length) c = pal.core;
      if (pal.w) p1 = urn(c);
      else { const least = Math.min(...c.map(q => used[q] || 0)); p1 = pick(c.filter(q => (used[q] || 0) === least)); }
      if (U.john) { const core = pal.core.filter(q => q !== p1); if (core.length && r() < JOHN_TWO) p2 = pick(core); }   // ⌘: one paint or two (the owner, 2026-10-19: "in one or two colours")
      else if (!lone && r() < SECOND_P) {
        const acc = pal.accent.filter(q => q !== p1), nxt = main[F.us[k - 1]], core = pal.core.filter(q => q !== p1);
        p2 = acc.length && r() < ACCENT_SECOND ? pick(acc) : nxt && nxt !== p1 && nxt !== pal.spot && r() < 0.5 ? nxt : core.length ? pick(core) : null;
      }
    }
    main[id] = p1; used[p1] = (used[p1] || 0) + 1;
    const places = mode === 'colours' && had.length ? had.map(q => ({ a: q.a, b: q.b, old: q.paint })) : spokesOf(U, rects, o);
    const two = p2 ? Math.floor(r() * places.length) : -1, R0 = rects[U.rs[0]];
    // a ⌘'s second paint on its lobes 2 and 4, the top right and the bottom left
    const even = q => (q.a[0] + q.b[0] - 2 * R0.x - R0.w) * (q.a[1] + q.b[1] - 2 * R0.y - R0.h) > 0;
    places.forEach((q, m) => {
      const paint = U.john ? (even(q) ? p2 ?? p1 : p1) : mode === 'colours' && had.length ? (q.old === was[0] ? p1 : p2 ?? p1) : m === two ? p2 : p1;
      const thin = !lone && pal.accent.includes(paint) && !pal.core.includes(paint);
      const { i, s } = keepIn(U, rects, { a: q.a, b: q.b, paint, thin });
      out.get(i).push(s);
    });
  });
  return { ss: out, pal: { ...pal, seed } };
}
// Every figure given dealt from one palette at once — the Reference key, and
// the keys with the tiles chosen together: the paints spread in the
// palette's shares over all of them, a tile never its touching neighbour's
// in any figure, a lone figure one paint. → { ss: Map(rect index → its sausages), pal }
// A tile whose neighbours have taken every core paint must share one: dealt
// again, DEAL_TRIES at most, the first with no two touching tiles of one
// paint kept — else the one with the fewest.
export const DEAL_TRIES = 20;
export function dealFigures(rects, units, figs, pal, seed, mode = 'colours', o = {}) {
  const us = figs.flatMap(F => F.us), nb = (a, b) => near(units[a], units[b], rects, o.join ?? JOIN_NEW), pairs = [];
  for (let i = 0; i < us.length; i++) for (let j = i + 1; j < us.length; j++) if (nb(us[i], us[j])) pairs.push([us[i], us[j]]);
  let best = null;
  for (let t = 0; t < DEAL_TRIES; t++) {
    const s0 = seed + 104729 * t, rs = rng(s0 ^ 0x5b07), st = { used: {}, main: {}, total: us.length, spot: pal.spot ? us[Math.floor(rs() * us.length)] : null, near: nb }, ss = new Map();
    figs.forEach((F, k) => { for (const [i, q] of dealFigure(rects, units, F, pal, s0 + 7919 * k, mode, o, st).ss) ss.set(i, q); });
    const bad = pairs.filter(([a, b]) => st.main[a] && st.main[a] === st.main[b]).length;
    if (!best || bad < best.bad) best = { ss, bad };
    if (!bad) break;
  }
  return { ss: best.ss, pal: { ...pal, seed } };
}

// ---------- a palette off a reference ----------
// The owner, 2026-10-19, Screenshot 4.15.26 PM — ten tiles, the keys
// painting only the chosen figure's: "a picture with the colour range there,
// appearing on all ten squares. Important: the reference's analysis must
// match the colours we have in stock". Every pixel of the painting — the
// wall and the frame off (paintingBox) — to the nearest of his paints by
// CIEDE2000, a paint to buy (PAINT's buy, TO_BUY) only where it is BUY_K
// times nearer than his nearest in stock, and counted; the paints with a share the
// palette: the core the largest, REF_CORE at most, each CORE_MIN of the
// picture or more; the accents the next, thin, REF_ACCENT at most, each
// ACCENT_MIN or more; the shares its weights (est., Claude's).
// px: RGBA bytes → { name: 'Reference', core, accent, w, seed }
export const REF_CORE = 6, REF_ACCENT = 3, CORE_MIN = 0.04, ACCENT_MIN = 0.015;
const labOf = lin => {
  const f = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116, [r, g, b] = lin;
  const X = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047), Y = f(0.2126 * r + 0.7152 * g + 0.0722 * b), Z = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883);
  return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)];
};
// ΔE, CIEDE2000: the hue weighed as an eye does — a photograph's neon pink
// his Pink, not the dark 05; his navy Ultramarine
export function de2000([L1, a1, b1], [L2, a2, b2]) {
  const rad = Math.PI / 180, c7 = c => Math.sqrt(c ** 7 / (c ** 7 + 25 ** 7)), Cb = (Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2, G = 0.5 * (1 - c7(Cb));
  const A1 = (1 + G) * a1, A2 = (1 + G) * a2, C1 = Math.hypot(A1, b1), C2 = Math.hypot(A2, b2), hue = (a, b) => { const v = Math.atan2(b, a) / rad; return v < 0 ? v + 360 : v; }, h1 = hue(A1, b1), h2 = hue(A2, b2);
  let dh = C1 * C2 ? h2 - h1 : 0; if (dh > 180) dh -= 360; else if (dh < -180) dh += 360;
  const dL = L2 - L1, dC = C2 - C1, dH = 2 * Math.sqrt(C1 * C2) * Math.sin(dh / 2 * rad), Lb = (L1 + L2) / 2, Cp = (C1 + C2) / 2;
  const hb = !(C1 * C2) ? h1 + h2 : Math.abs(h1 - h2) > 180 ? (h1 + h2 + 360) / 2 : (h1 + h2) / 2;
  const T = 1 - 0.17 * Math.cos((hb - 30) * rad) + 0.24 * Math.cos(2 * hb * rad) + 0.32 * Math.cos((3 * hb + 6) * rad) - 0.2 * Math.cos((4 * hb - 63) * rad);
  const SL = 1 + 0.015 * (Lb - 50) ** 2 / Math.sqrt(20 + (Lb - 50) ** 2), SC = 1 + 0.045 * Cp, SH = 1 + 0.015 * Cp * T, RT = -2 * c7(Cp) * Math.sin(60 * Math.exp(-(((hb - 275) / 25) ** 2)) * rad);
  return Math.sqrt((dL / SL) ** 2 + (dC / SC) ** 2 + (dH / SH) ** 2 + RT * (dC / SC) * (dH / SH));
}
export const BUY_K = 1.5;
const LABS = new Map(), labP = id => { if (!LABS.has(id)) LABS.set(id, labOf(linOf(PAINT[id].hex))); return LABS.get(id); };
export function nearestPaint(rgb, ids = Object.keys(PAINT)) {
  const lab = labOf(rgb.map(v => toLin(v / 255)));
  let best = ids[0], bd = Infinity;
  for (const id of ids) { const d = de2000(lab, labP(id)) * (PAINT[id].buy ? BUY_K : 1); if (d < bd) { bd = d; best = id; } }
  return best;
}
// The painting, not its wall (the owner's references, INKA/references/:
// his canvases photographed on a wall, framed): the background the median of
// the picture's outer ring; the painting the box of what differs from it by
// more than BG_DE — its 2nd … 98th percentile — in by FRAME of its size on
// every side, the frame off; a picture nearly all painting kept whole (est.).
// → { x0, y0, x1, y1 } in pixels, x1 and y1 past the last
export const BG_DE = 15, FRAME = 0.04;
export function paintingBox(px, w, h) {
  const whole = { x0: 0, y0: 0, x1: w, y1: h }, L = new Float32Array(3 * w * h), ring = [[], [], []], m = Math.max(1, Math.round(0.04 * Math.min(w, h)));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = 4 * (y * w + x), q = labOf([px[i], px[i + 1], px[i + 2]].map(v => toLin(v / 255)));
    L.set(q, 3 * (y * w + x));
    if (x < m || y < m || x >= w - m || y >= h - m) for (let k = 0; k < 3; k++) ring[k].push(q[k]);
  }
  const bg = ring.map(v => v.sort((a, b) => a - b)[v.length >> 1] ?? 0), xs = [], ys = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const j = 3 * (y * w + x); if (Math.hypot(L[j] - bg[0], L[j + 1] - bg[1], L[j + 2] - bg[2]) > BG_DE) { xs.push(x); ys.push(y); } }
  if (xs.length < 0.05 * w * h) return whole;
  xs.sort((a, b) => a - b); ys.sort((a, b) => a - b);
  const pc = (v, f) => v[Math.min(v.length - 1, Math.floor(f * v.length))], x0 = pc(xs, 0.02), x1 = pc(xs, 0.98) + 1, y0 = pc(ys, 0.02), y1 = pc(ys, 0.98) + 1;
  if (x1 - x0 > 0.92 * w && y1 - y0 > 0.92 * h) return whole;
  const ix = Math.round(FRAME * (x1 - x0)), iy = Math.round(FRAME * (y1 - y0));
  return { x0: x0 + ix, y0: y0 + iy, x1: Math.max(x0 + ix + 1, x1 - ix), y1: Math.max(y0 + iy + 1, y1 - iy) };
}
// The spot (the owner, 2026-10-19, Screenshot 5.10.28 PM, IMG_1522's red
// band and its little red square gone from the tiles: "an algorithm not by
// which colour has the most area, but by which is the brightest speck in
// the picture, and let it go on one square only, never two or three"): of
// the paints not in the core, nor like one of it, the one its pixels the most
// colourful — their mean chroma, C* — SPOT_C at least, SPOT_MIN of the
// painting or more; out of the accents with the paints like it, within
// SPOT_DE (CIEDE2000) — the red band's orange edge — a paint of one tile (dealFigure).
export const SPOT_C = 45, SPOT_MIN = 0.001, SPOT_DE = 12;
// px, w, h: the picture; with w and h, its painting only (paintingBox)
export function paletteOfPixels(px, w, h) {
  const n = {}, ch = {}, seen = new Map(), B = w && h ? paintingBox(px, w, h) : null;
  let all = 0;
  for (let i = 0; i + 3 < px.length; i += 4) {
    if (px[i + 3] < 128) continue;
    if (B) { const k = i >> 2, x = k % w, y = (k - x) / w; if (x < B.x0 || x >= B.x1 || y < B.y0 || y >= B.y1) continue; }
    const key = (px[i] >> 2) << 12 | (px[i + 1] >> 2) << 6 | px[i + 2] >> 2;
    let q = seen.get(key);
    if (!q) { const rgb = [px[i], px[i + 1], px[i + 2]], L = labOf(rgb.map(v => toLin(v / 255))); q = { id: nearestPaint(rgb), c: Math.hypot(L[1], L[2]) }; seen.set(key, q); }
    n[q.id] = (n[q.id] || 0) + 1; ch[q.id] = (ch[q.id] || 0) + q.c; all++;
  }
  if (!all) return null;
  const by = Object.keys(n).sort((a, b) => n[b] - n[a]), sh = Object.fromEntries(by.map(id => [id, Math.round(n[id] / all * 1000) / 1000]));
  const core = by.filter((id, k) => k === 0 || sh[id] >= CORE_MIN).slice(0, REF_CORE);
  const like = (a, b) => de2000(labP(a), labP(b)) < SPOT_DE;
  const spot = by.filter(id => !core.includes(id) && !core.some(c => like(c, id)) && n[id] >= SPOT_MIN * all && ch[id] / n[id] >= SPOT_C).sort((a, b) => ch[b] / n[b] - ch[a] / n[a])[0] ?? null;
  const accent = by.filter(id => !core.includes(id) && id !== spot && !(spot && like(id, spot)) && sh[id] >= ACCENT_MIN).slice(0, REF_ACCENT);
  return { name: 'Reference', core, accent, w: Object.fromEntries(core.map(id => [id, sh[id]])), ...(spot ? { spot } : {}), seed: 0 };
}

// ---------- MARKS: where the sausages go ----------
// A dash along every sausage in watercolour from the cup, its ends a brush's
// half in, so the brush's own width lays it on the sausage; shorter, a dot. A
// dip before every MARKS_DIP-th, CCD's. Figure by figure, unit by unit.
export function markOf(q, brush) {
  const L = dist(q.a, q.b), u = L > 1e-9 ? [(q.b[0] - q.a[0]) / L, (q.b[1] - q.a[1]) / L] : [1, 0], m = [(q.a[0] + q.b[0]) / 2, (q.a[1] + q.b[1]) / 2], h = Math.max(MARK_DOT / 2, L / 2 - brush / 2);
  return { a: [m[0] - u[0] * h, m[1] - u[1] * h], b: [m[0] + u[0] * h, m[1] + u[1] * h] };
}
export function marksRows(P, rects, o) {
  const ps = [], info = [];
  let n = 0;
  for (const F of P.figs) for (const id of F.us) for (const q of unitSausages(P.units[id], rects)) {
    const m = markOf(q, o.brush), g = { t: 'L', a: toM(o, m.a), b: toM(o, m.b) }, dip = n % MARKS_DIP === 0;
    n++; ps.push([{ ...g, tilt: 0, row: ps.length + 1, ...(o.ink && !dip ? { nodip: true } : {}) }]);
    info.push({ label: `Figure ${F.n} · ${PAINT[q.paint].name}`, fi: F.n - 1, L: pieceLen(g) });
  }
  return { ps, info, marks: n };
}

// ---------- the Result: the brush through the paint, on the canvas (est.) ----------
// CCD's walk of a lane (ccdplan.js, laneWalk) on a grid of the canvas, h mm a
// cell: the brush five grooves across, each its own paint, a mm a step along
// the figure's path; under a groove what lies there — a film or the bulk of
// a sausage — it picks up (PICK_FILM, PICK_BULK of the more than a film) and
// lays a film from what it carries, thinning as it runs dry over about DRY
// mm; the paints mixed as pigments (log-linear, color.js's pigmentMix). So
// the brush drags a tile's paint over its rings and on into the next tile,
// and from a middle to the next across the rings painted — the gradient of
// Florian's tongues where one paint runs into another. The brush wiped at
// every figure. A sausage on the cells under it, SAUSAGE_W wide, its paint
// Density's (CCD's, the line full 70 mm at 50 %).
export const STREAK = 0.12, STREAK_MM = 15;
// The bristles hold so much and no more: past CAP film-mm a groove sheds SHED
// of the more a mm, the paint laid thick by the sausage — impasto — not
// carried on for ever; one sausage's load (≈ 100) under it, so CCD's 70 mm
// stand (est.)
export const CAP = 120, SHED = 0.08;
const hash = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const wave = (t, s) => { const u = t / STREAK_MM + hash(s, 7) * 50, f = Math.floor(u), x = u - f, e = x * x * (3 - 2 * x); return hash(f, s) * (1 - e) + hash(f + 1, s) * e; };
export const GROUND = [251, 250, 247];
const LOGMIN = Math.log(0.003), logC = hex => linOf(hex).map(v => Math.log(Math.max(v, 0.003)));
// The steps along every figure's path: every piece cut evenly, about a mm a
// stretch, through a turn no more than 1/16 of a radian, a step the middle of
// its stretch — { x, y, tx, ty, ds (its stretch), k (its curvature, + turning left), s, fig (− at a figure's start) }
export function stepsOf(P) {
  const X = [], Yv = [], TX = [], TY = [], D = [], K = [], S = [], FG = [];
  for (const F of P.figs) {
    let s0 = 0, first = true;
    for (const g of F.pieces) {
      const L = lenOf(g), n = Math.max(1, Math.ceil(L / (g.t === 'A' ? Math.min(DS, g.r / 16) : DS))), ds = L / n, kq = g.t === 'A' ? (g.left ? 1 : -1) / g.r : 0;
      for (let j = 0; j < n; j++) {
        const q = atPiece(g, (j + 0.5) * ds);
        X.push(q.p[0]); Yv.push(q.p[1]); TX.push(q.t[0]); TY.push(q.t[1]); D.push(ds); K.push(kq); S.push(s0 + (j + 0.5) * ds); FG.push(first ? -(F.n) : F.n);
        first = false;
      }
      s0 += L;
    }
  }
  return { n: X.length, x: Float32Array.from(X), y: Float32Array.from(Yv), tx: Float32Array.from(TX), ty: Float32Array.from(TY), ds: Float32Array.from(D), k: Float32Array.from(K), s: Float32Array.from(S), fig: Int32Array.from(FG) };
}
// The grooves across the trail, the brush as it lays the paint, swollen.
// o: { cw, ch, brush, swell, density, h } → the sim: advance(n) steps it, rgba(img, all) paints its cells into an ImageData's data, row 0 the canvas's top
export function simOf(P, rects, o) {
  const W = o.cw, H = o.ch, h = o.h ?? Math.max(0.4, Math.max(W, H) / 900), nx = Math.ceil(W / h), ny = Math.ceil(H / h), N = nx * ny;
  const amt = new Float32Array(N), lc = new Float32Array(3 * N), sh = new Float32Array(N), dirty = new Uint8Array(N), dlist = [];
  const mark = c => { if (!dirty[c]) { dirty[c] = 1; dlist.push(c); } };
  const V = paintOf(o.density ?? DENSITY_NEW), brush = trailOf(o);
  // the sausages, squeezed: a capsule SAUSAGE_W wide along each
  let squeezed = 0;
  for (const F of P.figs) for (const id of F.us) for (const q of unitSausages(P.units[id], rects)) {
    const add = V / SAUSAGE_W * (q.thin ? THIN : 1), l = logC(PAINT[q.paint].hex), R = SAUSAGE_W / 2, L2 = (q.b[0] - q.a[0]) ** 2 + (q.b[1] - q.a[1]) ** 2;
    const i0 = Math.max(0, Math.floor((Math.min(q.a[0], q.b[0]) - R) / h)), i1 = Math.min(nx - 1, Math.floor((Math.max(q.a[0], q.b[0]) + R) / h));
    const j0 = Math.max(0, Math.floor((Math.min(q.a[1], q.b[1]) - R) / h)), j1 = Math.min(ny - 1, Math.floor((Math.max(q.a[1], q.b[1]) + R) / h));
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const x = (i + 0.5) * h, y = (j + 0.5) * h, t = L2 > 0 ? Math.max(0, Math.min(1, ((x - q.a[0]) * (q.b[0] - q.a[0]) + (y - q.a[1]) * (q.b[1] - q.a[1])) / L2)) : 0;
      if (Math.hypot(x - q.a[0] - t * (q.b[0] - q.a[0]), y - q.a[1] - t * (q.b[1] - q.a[1])) > R) continue;
      const c = j * nx + i, na = amt[c] + add, w = add / na;
      for (let m = 0; m < 3; m++) lc[3 * c + m] = amt[c] > 0 ? lc[3 * c + m] * (1 - w) + l[m] * w : l[m];
      amt[c] = na; squeezed += add; mark(c);
    }
  }
  const T = stepsOf(P), G = GROOVE_K.length, wg = brush / G, m = Math.max(1, Math.ceil(wg / h)), LMAX = DS * (1 + brush / 2 / 0.25);
  const b = new Float32Array(G), bl = new Float32Array(3 * G), stamp = new Int32Array(N), idx = new Int32Array(m * (Math.ceil(LMAX / h) + 2));
  let i = 0, sid = 0, wiped = 0, cur = null;
  // A step: every groove over the stretch it goes — on the outside of a turn
  // longer, inside shorter — taking up and laying down as CCD's lane walk
  // does a mm, so much the more or less as its stretch is long
  function advance(n) {
    const end = Math.min(T.n, i + n);
    for (; i < end; i++) {
      const x = T.x[i], y = T.y[i], tx = T.tx[i], ty = T.ty[i], nxv = -ty, nyv = tx, f = T.fig[i], ds = T.ds[i], kq = T.k[i];
      if (f < 0) { for (let g = 0; g < G; g++) { wiped += b[g]; b[g] = 0; } }       // a figure's start: the brush wiped
      for (let g = 0; g < G; g++) {
        const [kv, kd, shade] = GROOVE_K[g], og = ((g + 0.5) / G - 0.5) * brush, Lg = Math.max(0.05, ds * (1 - og * kq)), ma = Math.max(1, Math.ceil(Lg / h)), u = Lg / DS;
        sid++; let cnt = 0;
        for (let kk = 0; kk < m; kk++) {
          const off = og + ((kk + 0.5) / m - 0.5) * wg;
          for (let l = 0; l < ma; l++) {
            const al = ((l + 0.5) / ma - 0.5) * Lg * (1 - off * kq) / Math.max(0.05, 1 - og * kq), px = x + nxv * off + tx * al, py = y + nyv * off + ty * al, ix = Math.floor(px / h), iy = Math.floor(py / h);
            if (ix < 0 || iy < 0 || ix >= nx || iy >= ny) continue;
            const c = iy * nx + ix;
            if (stamp[c] === sid) continue;
            stamp[c] = sid; idx[cnt++] = c;
          }
        }
        if (!cnt) continue;                                                         // off the canvas: the brush keeps what it carries
        let A = 0, L0 = 0, L1 = 0, L2 = 0;
        for (let q = 0; q < cnt; q++) { const c = idx[q], a = amt[c]; A += a; L0 += a * lc[3 * c]; L1 += a * lc[3 * c + 1]; L2 += a * lc[3 * c + 2]; }
        // thicknesses, films: what lies there on average, what the groove takes of it, what it lays; the brush's load in film-mm
        const a = A / cnt, take = Math.min(a, (Math.min(a, FILM) * PICK_FILM + Math.max(0, a - FILM) * PICK_BULK) * kv), bb = b[g];
        const give = Math.min(bb / u, FILM * (1 - Math.exp(-bb / (DRY * kd))) + Math.max(0, bb - CAP) * SHED), keep = a > 0 ? 1 - take / a : 1;
        const w0 = A > 0 ? L0 / A : LOGMIN, w1 = A > 0 ? L1 / A : LOGMIN, w2 = A > 0 ? L2 / A : LOGMIN;
        const sv = shade + STREAK * (2 * wave(T.s[i], g + 13 * Math.abs(f)) - 1);
        for (let q = 0; q < cnt; q++) {
          const c = idx[q], left = amt[c] * keep;
          if (give > 0) {
            const na = left + give, t = give / na;
            for (let mm = 0; mm < 3; mm++) lc[3 * c + mm] = left > 0 ? lc[3 * c + mm] * (1 - t) + bl[3 * g + mm] * t : bl[3 * g + mm];
            amt[c] = na; sh[c] = sv;
          } else amt[c] = left;
          mark(c);
        }
        const nb = Math.max(0, bb + (take - give) * u);
        if (take > 0) {
          const t = Math.min(1, take * u / Math.max(1e-9, nb));
          bl[3 * g] = bl[3 * g] * (1 - t) + w0 * t; bl[3 * g + 1] = bl[3 * g + 1] * (1 - t) + w1 * t; bl[3 * g + 2] = bl[3 * g + 2] * (1 - t) + w2 * t;
        }
        b[g] = nb;
      }
      cur = [x, y];
    }
    return i >= T.n;
  }
  // its cells into rgba, row 0 the canvas's top: all of them, or those changed since
  function rgba(img, all = false) {
    const list = all ? null : dlist.splice(0);
    const one = c => {
      dirty[c] = 0;
      const ix = c % nx, iy = (c - ix) / nx, p = 4 * ((ny - 1 - iy) * nx + ix), cov = Math.min(1, amt[c]);
      if (cov < 0.03) { img[p] = GROUND[0]; img[p + 1] = GROUND[1]; img[p + 2] = GROUND[2]; img[p + 3] = 255; return; }
      const k = 1 + sh[c];
      for (let q = 0; q < 3; q++) img[p + q] = GROUND[q] + (Math.min(255, toSrgb(Math.exp(lc[3 * c + q])) * 255 * k) - GROUND[q]) * cov;
      img[p + 3] = 255;
    };
    if (all) { for (let c = 0; c < N; c++) one(c); dlist.length = 0; } else for (const c of list) one(c);
  }
  const held = () => b.reduce((s, v) => s + v, 0);
  return { nx, ny, h, N, steps: T.n, get i() { return i; }, get at() { return cur; }, advance, rgba, amt, squeezed: () => squeezed, held, wiped: () => wiped, onCanvas: () => amt.reduce((s, v) => s + v, 0) };
}
