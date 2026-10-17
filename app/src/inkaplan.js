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
// unit, Step apart, the outer one's brush edge on its outline.
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
import { PAINT, MARK_MM } from './tapeplan.js';
import { CCD_META, paintOf, DENSITY_NEW, FILM, PICK_BULK, PICK_FILM, DRY, THIN, DS, GROOVE_K, SAUSAGE_W, MARKS_DIP, MARK_DOT } from './ccdplan.js';
import { linOf, toSrgb, luminance } from './color.js';
import { rng } from './util.js';
import { ELBOW_MAX } from './ink.js';

export const STEP_NEW = 7, STEP_MIN = 1, STEP_MAX = 100;   // mm, ring to ring; with the 6 mm brush a millimetre of white between, Florian's ridges (Claude's)
export const BRUSH_NEW = 6;                                // mm, the owner's round brush on BIAS
export const JOIN_NEW = 5;                                 // mm: tiles this near are one figure (est.)
export const CORNER_NEW = 4;                               // mm, a turn's radius: √(250 · 4) ≈ 31 mm/s on it, never a stop (machine.js, arcSpeed)
export const R_MIN = 0.3;                                  // mm: a tighter turn is left a corner (a 180° one)
export const RING_MIN = 0.5;                               // mm: no ring narrower than twice this in the middle — its turns too tight to run through
export const WIPE_NEW = ELBOW_MAX;                         // °: the brush up to wipe, the elbow's highest (est.)
export const OFF = 60, MIN_SIDE = 1;                       // mm, as CCD's
export const SHARE_MIN = 1;                                // mm two tiles must share along a side to touch
export const SPOKE_GAP = MARK_MM;                          // mm: spokes at most this far apart round a unit, TAPE's paper test
export const SECOND_P = 0.4, ACCENT_SECOND = 0.35;         // a tile's chance of a second paint, and of it being an accent (Claude's)
const EPS = 1e-7, fin = Number.isFinite;

// ---------- a rectangle as it may be kept ----------
// { id, x, y, w, h, step, turn, ss: [{ a: [u, v], b: [u, v], paint, thin }], pal }:
// its id, for the nodes; the way the brush goes round it as it paints, ↻
// 'cw' or ↺ 'ccw'; its sausages in its own fractions, so they move and
// stretch with it; the palette of its figure
const ids = a => Array.isArray(a) && a.every(id => PAINT[id]);
export const cleanPal = q => q && typeof q.name === 'string' && ids(q.core) && q.core.length && ids(q.accent ?? [])
  ? { name: q.name, core: q.core.slice(), accent: (q.accent ?? []).slice(), ...(PAINT[q.pure] ? { pure: q.pure } : {}), seed: fin(q.seed) ? q.seed : 0 } : null;
const pair = v => Array.isArray(v) && v.length === 2 && v.every(fin);
export function cleanRect(r) {
  if (!r || ![r.x, r.y, r.w, r.h].every(fin)) return null;
  const ss = Array.isArray(r.ss) ? r.ss.filter(q => q && pair(q.a) && pair(q.b) && PAINT[q.paint]).map(q => ({ a: q.a.slice(), b: q.b.slice(), paint: q.paint, ...(q.thin ? { thin: true } : {}) })) : [];
  const pal = cleanPal(r.pal);
  return { ...(fin(r.id) ? { id: r.id } : {}), x: r.x, y: r.y, w: Math.max(MIN_SIDE, r.w), h: Math.max(MIN_SIDE, r.h), step: fin(r.step) ? Math.max(STEP_MIN, Math.min(STEP_MAX, r.step)) : STEP_NEW, turn: r.turn === 'ccw' ? 'ccw' : 'cw', ss, ...(pal ? { pal } : {}) };
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
// The units: rectangles that overlap are one, a block; in the order of their first rectangle
export function unitsOf(rects) {
  const up = rects.map((_, i) => i), find = i => up[i] === i ? i : (up[i] = find(up[i]));
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) if (overlaps(rects[i], rects[j])) up[find(j)] = find(i);
  const by = new Map();
  rects.forEach((_, i) => { const k = find(i); if (!by.has(k)) by.set(k, []); by.get(k).push(i); });
  return [...by.values()].sort((a, b) => a[0] - b[0]).map((rs, id) => ({ id, rs, box: boxOf(rs.map(i => rects[i])), step: rects[rs[0]].step, turn: rects[rs[0]].turn ?? 'cw' }));
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
// The figures: units that touch, in the order of their first rectangle, each its units in their snake
export function figuresOf(rects, units, join = JOIN_NEW) {
  const n = units.length, adjM = units.map(A => units.map(B => A !== B && near(A, B, rects, join))), adj = (a, b) => adjM[a][b];
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
// A unit's rings: its outline eroded by the brush's half, then a step more
// each time, while anything is left; when the middle is left wider than half
// a step, one more ring there, so no white runs down it. → the tree of rings:
// { d, loops, kids }, the roots the outer ones
export function ringsOf(rs, brush, step) {
  const G = gridOf(rs), all = [Math.max(G.xs.at(-1) - G.xs[0], G.ys.at(-1) - G.ys[0]) / 2];
  let lo = 0, hi = all[0];
  for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (erode(G, m)) lo = m; else hi = m; }
  const D = lo, ds = [];
  for (let d = brush / 2; d < D - RING_MIN && ds.length < 4000; d += step) ds.push(d);
  if (!ds.length) ds.push(Math.max(D / 2, D - brush / 4));
  else if (D - ds.at(-1) > step / 2) ds.push(Math.min(D - RING_MIN, Math.max(ds.at(-1) + step / 2, D - brush / 4)));
  const levels = ds.map(d => erode(G, d)).filter(Boolean), nodes = levels.map(E => E.parts.map(q => ({ d: E.d, loops: q.loops, kids: [], cell: q.cells[0], E })));
  for (let l = 1; l < levels.length; l++) for (const n of nodes[l]) {
    const E = n.E, p = [(E.X[n.cell[0]] + E.X[n.cell[0] + 1]) / 2, (E.Y[n.cell[1]] + E.Y[n.cell[1] + 1]) / 2], k = partAt(levels[l - 1], p);
    (nodes[l - 1][k] ?? nodes[l - 1][0]).kids.push(n);
  }
  for (const L of nodes) for (const n of L) { delete n.E; delete n.cell; }
  return { G, D, roots: nodes[0] ?? [], rings: nodes.reduce((s, L) => s + L.length, 0), levels: levels.length };
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
// rule; with one ring inside, its last side a step short and on into the
// next one's seam a step in — diagonally from a corner, square to the side
// from a side's middle: the spiral, a step apart all the way; else round to
// the seam, then its holes and the rings inside, each from the nearest
function spiralIn(node, hint) {
  const at = seamAt(node.loops[0], hint), L = at ? at.L : node.loops[0], k0 = at ? at.k : seamOf(node, hint), n = L.length, pts = [];
  for (let m = 0; m <= n; m++) pts.push(L[(k0 + m) % n]);
  if (node.kids.length === 1 && node.loops.length === 1) {
    const kid = node.kids[0], s = kid.d - node.d, c = pts.at(-1), u = unitV(sub(c, pts.at(-2))), on = unitV(sub(L[(k0 + 1) % n], c)), cv = convexOf(L).find(q => q.k === k0);
    const w = cv ? cv.diag : Math.abs(crs(u, on)) < 1e-9 && u[0] * on[0] + u[1] * on[1] > 0 ? [u[1], -u[0]] : null;
    if (dist(c, pts.at(-2)) > s + 1e-6) pts[pts.length - 1] = [c[0] - u[0] * s, c[1] - u[1] * s];
    return pts.concat(spiralIn(kid, w ? [c[0] + w[0] * s, c[1] + w[1] * s] : pts.at(-1)));
  }
  let cur = pts.at(-1);
  for (const H of node.loops.slice(1)) { let k = 0; H.forEach((v, m) => { if (dist(v, cur) < dist(H[k], cur)) k = m; }); for (let m = 0; m <= H.length; m++) pts.push(H[(k + m) % H.length]); cur = pts.at(-1); }
  const kids = node.kids.slice();
  while (kids.length) {
    kids.sort((a, b) => Math.min(...a.loops[0].map(v => dist(v, cur))) - Math.min(...b.loops[0].map(v => dist(v, cur))));
    pts.push(...spiralIn(kids.shift(), cur)); cur = pts.at(-1);
  }
  return pts;
}
// A unit's spiral: inward from the outer ring nearest the hint; outward, the
// same reversed — from the middle to the outer ring's seam at the hint
export function spiralOf(R, hint, out = false) {
  const roots = R.roots.slice(), pts = [];
  let cur = hint;
  while (roots.length) {
    roots.sort((a, b) => Math.min(...a.loops[0].map(v => dist(v, cur ?? v))) - Math.min(...b.loops[0].map(v => dist(v, cur ?? v))));
    pts.push(...spiralIn(roots.shift(), cur)); cur = pts.at(-1);
  }
  return out ? pts.reverse() : pts;
}
// A unit's spiral as the brush paints it: inward — from its outer ring at
// `at`, or the corner nearest `hint` — or outward, to `at` or that corner;
// the brush going round as the unit's turn says, ↻ clockwise or ↺
// anticlockwise. The rings are built clockwise: the other way, the unit
// mirrored, built and mirrored back.
const mx = p => p ? [-p[0], p[1]] : p;
export function unitPath(U, rects, brush, dir, at, hint) {
  const mirror = (dir === 'in') === (U.turn === 'ccw');
  if (mirror && !U.Rm) U.Rm = ringsOf(U.rs.map(i => { const r = rects[i]; return { x: -(r.x + r.w), y: r.y, w: r.w, h: r.h }; }), brush, U.step);
  const R = mirror ? U.Rm : U.R, pts = spiralOf(R, mirror ? mx(at ?? hint ?? null) : at ?? hint ?? null, dir === 'out');
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
  const U = units.find(u => u.rs.includes(ri)), M = U.M;
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
// the points of a path without repeats and without points in a straight run
export function cleanPts(P) {
  const a = [];
  for (const p of P) if (!a.length || dist(p, a.at(-1)) > 1e-6) a.push(p);
  return a.filter((p, i) => i === 0 || i === a.length - 1 || Math.abs(crs(sub(p, a[i - 1]), sub(a[i + 1], p))) > 1e-9 * dist(p, a[i - 1]) * dist(a[i + 1], p) || (p[0] - a[i - 1][0]) * (a[i + 1][0] - p[0]) + (p[1] - a[i - 1][1]) * (a[i + 1][1] - p[1]) < 0);
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
// a turn of more than 170°, or one too tight, left a corner.
// → pieces in canvas mm: { t: 'L', a, b } | { t: 'A', a, b, c, r, left }
export function roundOf(P, corner) {
  const out = [];
  let cur = P[0];
  for (let i = 1; i < P.length - 1; i++) {
    const A = P[i - 1], V = P[i], B = P[i + 1], l1 = dist(A, V), l2 = dist(V, B), u1 = unitV(sub(V, A)), u2 = unitV(sub(B, V));
    const th = Math.acos(Math.max(-1, Math.min(1, u1[0] * u2[0] + u1[1] * u2[1])));
    if (th < 1e-4) continue;
    const tn = Math.tan(th / 2), r = th > 170 * Math.PI / 180 ? 0 : Math.min(corner, Math.min(l1, l2) / 2 / tn);
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
export const lenOf = g => g.t === 'L' ? dist(g.a, g.b) : g.r * sweepC(g);
const sweepC = g => { const a0 = Math.atan2(g.a[1] - g.c[1], g.a[0] - g.c[0]), a1 = Math.atan2(g.b[1] - g.c[1], g.b[0] - g.c[0]); let s = (a1 - a0) * (g.left ? 1 : -1); while (s <= 1e-12) s += 2 * Math.PI; while (s > 2 * Math.PI) s -= 2 * Math.PI; return s; };
// a point s mm along a piece, and the way it goes there
export function atPiece(g, s) {
  if (g.t === 'L') { const L = dist(g.a, g.b) || 1, u = [(g.b[0] - g.a[0]) / L, (g.b[1] - g.a[1]) / L]; return { p: [g.a[0] + u[0] * s, g.a[1] + u[1] * s], t: u }; }
  const a0 = Math.atan2(g.a[1] - g.c[1], g.a[0] - g.c[0]), sg = g.left ? 1 : -1, a = a0 + sg * s / g.r;
  return { p: [g.c[0] + g.r * Math.cos(a), g.c[1] + g.r * Math.sin(a)], t: [-Math.sin(a) * sg, Math.cos(a) * sg] };
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
// o: { brush, join, corner, nodes } → { units, figs: [{ n, us, ls, pts, pieces, length, along, ends, cross }], links, manual, length }
export function planOf(rects, o) {
  const brush = o.brush ?? BRUSH_NEW, units = unitsOf(rects);
  for (const U of units) { U.R = ringsOf(U.rs.map(i => rects[i]), brush, U.step); U.M = magnetsOf(U, rects); }
  const links = o.nodes?.length ? linksOf(o.nodes, rects, units) : [], manual = links.length > 0;
  const F0 = manual ? figuresByNodes(rects, units, links, o.join ?? JOIN_NEW) : figuresOf(rects, units, o.join ?? JOIN_NEW).map(F => ({ ...F, ls: [] }));
  const figs = F0.map(F => {
    const pts = [], at = [], ends = [], cross = [];
    F.us.forEach((id, k) => {
      const U = units[id], next = F.us[k + 1], prev = pts.at(-1), nextMid = next !== undefined ? mid(units[next].box) : null;
      let s, x = null;
      if (!manual) { const out = k % 2 === 0; s = unitPath(U, rects, brush, out ? 'out' : 'in', null, out ? nextMid ?? prev ?? null : prev ?? null); }
      else {
        const inE = k ? F.ls[k - 1].b : null, outE = next !== undefined ? F.ls[k].a : null, rim = e => e && !e.c;
        if (rim(inE) && rim(outE)) { s = [...unitPath(U, rects, brush, 'in', inE.p), outE.p]; x = 'edge'; }
        else if (rim(inE)) s = unitPath(U, rects, brush, 'in', inE.p);
        else if (rim(outE)) s = unitPath(U, rects, brush, 'out', outE.p);
        else if (inE && outE) { s = unitPath(U, rects, brush, 'out', null, nextMid); s.push(s[0]); x = 'middle'; }
        else if (outE) s = unitPath(U, rects, brush, 'in', null, null);
        else s = unitPath(U, rects, brush, 'out', null, null);
      }
      at.push(pts.length); ends.push({ a: s[0], b: s.at(-1) }); cross.push(x); pts.push(...s);
    });
    const P = jogged(cleanPts(pts), brush / 2), pieces = roundOf(P, o.corner ?? CORNER_NEW), length = pieces.reduce((s, g) => s + lenOf(g), 0);
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
export const figName = (F, units) => `Figure ${F.n}${F.us.length > 1 ? `, ${F.us.length} units` : units[F.us[0]].rs.length > 1 ? ', a block' : ', one tile'}`;
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
  return `<?xml version="1.0" encoding="UTF-8"?>\n<!-- Rembrandt INKA · drag · canvas ${o.cw}x${o.ch} mm, y down, origin top left. Each <path> is one figure, the brush down all the way, in running order; a wipe between them. -->\n<svg xmlns="http://www.w3.org/2000/svg" width="${o.cw}mm" height="${o.ch}mm" viewBox="0 0 ${o.cw} ${o.ch}">\n<g id="drag" data-ink="none" data-brush-mm="${o.brush}" fill="none" stroke="#24221F" stroke-width="1">\n${rows.join('\n')}\n</g>\n</svg>\n`;
}

// ---------- the paints: sausages across the rings ----------
// As Florian squeezes his across every lane of his track and the brush lands
// in them (master_flo_hires/ 11.03.10, 11.20.04 AM): a spoke, a sausage from
// a unit's outline straight in across its rings to its middle, so every ring
// takes it up as it passes; round a unit at most SPOKE_GAP apart, so its
// outer ring never runs RUN_MM without paint (TAPE's paper test); a unit its
// paint, now and then a second — the next one's, or an accent, thin — and
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
// The spoke at an outline point: straight in, square to its side, to the
// middle — as deep as a square round it still lies inside — a millimetre short
function spokeFrom(G, e, n) {
  let lo = 0, hi = Math.max(G.xs.at(-1) - G.xs[0], G.ys.at(-1) - G.ys[0]);
  const ok = s => squareIn(G, e[0] + n[0] * s, e[1] + n[1] * s, Math.max(1e-6, s - 1e-6));
  for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (ok(m)) lo = m; else hi = m; }
  const s = Math.max(0, lo - 1), a0 = Math.min(SAUSAGE_W / 2, s);                   // its round end on the tile, not past its edge
  return { a: [e[0] + n[0] * a0, e[1] + n[1] * a0], b: [e[0] + n[0] * s, e[1] + n[1] * s], depth: s };
}
// The outline's sides of a unit, the inside on their right: [{ a, b, u, n, L }]
function sidesOf(G) {
  const parts = erodeZero(G), out = [];
  for (const L of parts) L.forEach((v, k) => { const w = L[(k + 1) % L.length], len = dist(v, w), u = unitV(sub(w, v)); out.push({ a: v, b: w, u, n: [u[1], -u[0]], L: len }); });
  return out;
}
function erodeZero(G) {
  const inSet = (i, j) => i >= 0 && j >= 0 && i < G.nx && j < G.ny && !!G.inn[i * G.ny + j], cells = [];
  for (let i = 0; i < G.nx; i++) for (let j = 0; j < G.ny; j++) if (G.inn[i * G.ny + j]) cells.push([i, j]);
  return loopsOf(G.xs, G.ys, inSet, cells);
}
// The spokes round a unit: every side long enough a spoke or more, evenly,
// a little this way or that by the seed; none shallower than the brush's half
export function spokesOf(U, rects, o, seed) {
  const G = gridOf(U.rs.map(i => rects[i])), r = rng(seed ^ 0x51ed27), brush = o.brush ?? BRUSH_NEW, out = [];
  for (const sd of sidesOf(G)) {
    if (sd.L < 2 * SAUSAGE_W) continue;
    const n = Math.ceil(sd.L / SPOKE_GAP);
    for (let k = 0; k < n; k++) {
      const t = sd.L * Math.max(0.1, Math.min(0.9, (k + 0.5 + (r() - 0.5) * 0.3) / n)), e = [sd.a[0] + sd.u[0] * t, sd.a[1] + sd.u[1] * t], q = spokeFrom(G, e, sd.n);
      if (q.depth >= brush / 2) out.push({ a: q.a, b: q.b });
    }
  }
  return out;
}
// The spoke M lays at a point of a unit: from the side nearest it, through it, to the middle
export function spokeAt(U, rects, p) {
  const G = gridOf(U.rs.map(i => rects[i]));
  let best = null, bd = Infinity;
  for (const sd of sidesOf(G)) {
    const t = Math.max(0, Math.min(sd.L, (p[0] - sd.a[0]) * sd.u[0] + (p[1] - sd.a[1]) * sd.u[1])), e = [sd.a[0] + sd.u[0] * t, sd.a[1] + sd.u[1] * t], d = dist(e, p);
    if (d < bd) { bd = d; best = { sd, e }; }
  }
  if (!best) return null;
  const q = spokeFrom(G, best.e, best.sd.n);
  return q.depth > 0.5 ? { a: q.a, b: q.b } : null;
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
// before; now and then a second, the next one's or an accent; one unit, the
// pure paint. → Map(rect index → its sausages), the palette for every
// rectangle of the figure
export function dealFigure(rects, units, F, pal, seed, mode = 'colours', o = {}) {
  const r = rng(seed ^ 0x2545f491), pick = a => a[Math.floor(r() * a.length)], used = {}, main = {}, out = new Map();
  for (const id of F.us) for (const i of units[id].rs) out.set(i, []);
  const lone = F.us.length === 1;
  F.us.forEach((id, k) => {
    const U = units[id], had = unitSausages(U, rects), was = paintsOfUnit(had);
    let p1, p2 = null;
    if (mode === 'spokes' && was.length) { p1 = was[0]; p2 = was[1] ?? null; }
    else if (lone) p1 = pureOf(pal);
    else {
      const avoid = new Set([main[F.us[k - 1]], ...F.us.filter(m => main[m] && F.adj(id, m)).map(m => main[m])].filter(Boolean));
      let c = pal.core.filter(q => !avoid.has(q));
      if (!c.length) c = pal.core.filter(q => q !== main[F.us[k - 1]]);
      if (!c.length) c = pal.core;
      const least = Math.min(...c.map(q => used[q] || 0));
      p1 = pick(c.filter(q => (used[q] || 0) === least));
      if (r() < SECOND_P) {
        const acc = pal.accent.filter(q => q !== p1), nxt = main[F.us[k - 1]], core = pal.core.filter(q => q !== p1);
        p2 = acc.length && r() < ACCENT_SECOND ? pick(acc) : nxt && nxt !== p1 && r() < 0.5 ? nxt : core.length ? pick(core) : null;
      }
    }
    main[id] = p1; used[p1] = (used[p1] || 0) + 1;
    const places = mode === 'colours' && had.length ? had.map(q => ({ a: q.a, b: q.b, old: q.paint })) : spokesOf(U, rects, o, seed + 7919 * (k + 1));
    const two = p2 ? Math.floor(r() * places.length) : -1;
    places.forEach((q, m) => {
      const paint = mode === 'colours' && had.length ? (q.old === was[0] ? p1 : p2 ?? p1) : m === two ? p2 : p1;
      const thin = !lone && pal.accent.includes(paint) && !pal.core.includes(paint);
      const { i, s } = keepIn(U, rects, { a: q.a, b: q.b, paint, thin });
      out.get(i).push(s);
    });
  });
  return { ss: out, pal: { ...pal, seed } };
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
// o: { cw, ch, brush, density, h } → the sim: advance(n) steps it, rgba(img, all) paints its cells into an ImageData's data, row 0 the canvas's top
export function simOf(P, rects, o) {
  const W = o.cw, H = o.ch, h = o.h ?? Math.max(0.4, Math.max(W, H) / 900), nx = Math.ceil(W / h), ny = Math.ceil(H / h), N = nx * ny;
  const amt = new Float32Array(N), lc = new Float32Array(3 * N), sh = new Float32Array(N), dirty = new Uint8Array(N), dlist = [];
  const mark = c => { if (!dirty[c]) { dirty[c] = 1; dlist.push(c); } };
  const V = paintOf(o.density ?? DENSITY_NEW), brush = o.brush ?? BRUSH_NEW;
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
