// OPM — Optical Pigment Mixing (the owner, 2026-10-27, after PRISMA on
// paper: "rubbed like sandpaper the 40 × 40 takes thirty hours … back to the
// paints, painted by hand on the canvas along a contour drawn beforehand in
// pencils, every pencil's colour its paint's — a person and a robot
// together"; "the original geometry of the colour strokes, not the
// screenshot"; "white areas with a thin contour of their colour"; Kuzya's
// OPM/Rainbow Perspective Tile Grid.png, "I like it most").
//
// Cells: every band between two of the blend's loops (dacheplan.js's bands),
// on a side cut by the sausages' strips crossing it — a strip SAUSAGE_W
// wide a narrow cell, the gaps between the strips wide ones ("yes,
// exactly"); on a corner the band's arc one cell. Every cell its pencil, the
// nearest to the Preview's colour in it (prismaplan.js's nearestOf), next to
// white the lightest — the canvas never left bare ("the whole canvas
// painted, right?"). Its contour INSET in from its edges, two
// neighbours' never touching, its corners rounded, ROUND at most, so the
// carriage goes round without stopping at each. Merged (a switch, "I do
// not know without a test"): the cells of one pencil side by side one area,
// one contour round them all. A contour a closed stroke: rubbed round and
// round, never back (prismaplan.js's rubbed).
//
// mm from the canvas's bottom left corner, x right, y up. No DOM.

import { regionsOf, shapeAt, pointOn, pieceLength, lineOn, bandsOf, widthOn, cleanPencils, lightnessOf, LEAST_MM, LEAST_SHARE } from './dacheplan.js';
import { sausagesOf, machinePiece } from './inkaplan.js';
import { keysOf, keyIn, isBlend } from './blendplan.js';
import { SAUSAGE_W } from './ccdplan.js';
import { nearestOf, tOf, rubbed, PRISMA_PENCILS } from './prismaplan.js';
import { toLin } from './color.js';

export const INSET = 0.7;          // mm, a contour in from its cell's edge: two neighbours' 1.4 apart (est.)
export const ROUND = 1.5;          // mm, a contour's corner rounded at most so much (est.)
const ARC_MM = 2;                  // mm, a corner's arc a point every so far
const KINK = 10 * Math.PI / 180;   // a turn under 10° no corner: the carriage goes through it (strokes.js's KINK)
const CUT_EPS = 0.3;               // mm: two cuts closer, one
const SAMPLE = 1;                  // mm, the Preview read in a cell on a grid so fine
export const MIN_ROW = 2.5;        // mm, a row of cells across a band so thick at least: a narrow side's loops together (est.)
export const MIN_W = 1.2;          // mm, a cell thinner (twice its area over its outline) goes in with its neighbour once: a sliver between two cuts
// OPM-W's, no arc anywhere (the owner, 2026-10-28, OPM/Screenshot 2.34.42 PM: "no smooth semicircles and no
// rounded corners … straight lines at different slants — I want to try cutting wooden sticks and gluing them
// straight onto the canvas or a sheet of plywood"): o.facets, a corner so many straight pieces, every one the
// same turn, every row's at the same slants — three, the owner's screenshot's, 75°, 45° and 15°
export const FACETS_NEW = 3, FACETS_MIN = 1, FACETS_MAX = 6;
// OPM-B's, the cells bigger (the owner, 2026-10-28, OPM on paper: "I cannot draw such thin lines with a
// pencil — the rectangles bigger, there is no white left inside for the paint"; "the rays come out as dots,
// a brush cannot get into them: wider, the rings round them pressed a little"): o.minRow, o.stripW, o.minW.
// OPM's own, its outer rim alone, Key 1 · A's band (the owner, the same night, OPM and OPM-B side by side,
// Screenshot 1.37.23 AM: "back to OPM, and take from OPM-B only the rim of Key 1 · A"): o.rim { minRow,
// stripW, minW } there, OPM's sizes everywhere else
const isRim = R => R.kind === 'blend' && R.key === 0;
const sizeOf = (o, R, k) => (o.rim && isRim(R) ? o.rim : o)[k];

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], add = (a, b) => [a[0] + b[0], a[1] + b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
const len = v => Math.hypot(v[0], v[1]), unit = v => { const l = len(v) || 1; return [v[0] / l, v[1] / l]; };
const cross = (a, b) => a[0] * b[1] - a[1] * b[0], dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const left = u => [-u[1], u[0]];
export const areaOf = P => P.reduce((s, p, i) => s + cross(p, P[(i + 1) % P.length]), 0) / 2;
const rOf = s => Math.max(0, Math.min(s.c, (s.x1 - s.x0) / 2, (s.y1 - s.y0) / 2));
const keyOf = p => `${Math.round(p[0] * 1e4)},${Math.round(p[1] * 1e4)}`;
const lineKey = (s, p) => `${p}:${[s.x0, s.y0, s.x1, s.y1, s.c].map(v => Math.round(v * 1e5)).join(',')}`;

// ---------- the colour ----------
const LIN = Float32Array.from({ length: 256 }, (_, i) => toLin(i / 255));
function sample(res, x, y, acc) {
  const ix = Math.floor(x / res.h), iy = Math.floor(y / res.h);
  if (ix < 0 || iy < 0 || ix >= res.nx || iy >= res.ny) return 0;
  const q = 4 * ((res.ny - 1 - iy) * res.nx + ix);
  acc[0] += LIN[res.data[q]]; acc[1] += LIN[res.data[q + 1]]; acc[2] += LIN[res.data[q + 2]];
  return 1;
}
const inPoly = (P, x, y) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
// the Preview's mean in a polygon, linear light; null off the Result
export function meanIn(res, P) {
  const xs = P.map(p => p[0]), ys = P.map(p => p[1]), acc = [0, 0, 0];
  let got = 0;
  for (let y = Math.min(...ys) + SAMPLE / 2; y < Math.max(...ys); y += SAMPLE) for (let x = Math.min(...xs) + SAMPLE / 2; x < Math.max(...xs); x += SAMPLE) if (inPoly(P, x, y)) got += sample(res, x, y, acc);
  if (!got) { const c = P.reduce((a, p) => add(a, mul(p, 1 / P.length)), [0, 0]); got = sample(res, c[0], c[1], acc); }
  return got ? acc.map(v => v / got) : null;
}

// ---------- the cells ----------
// A sausage's region and side: its middle's band, the side of the shape there
// it lies along (a corner's: none, the corner uncut)
function sideOf(R, m) {
  const t = tOf(R, m[0], m[1]); if (t < 0 || t > 1) return -1;
  const s = shapeAt(R, t), r = rOf(s), inX = m[0] > s.x0 + r && m[0] < s.x1 - r, inY = m[1] > s.y0 + r && m[1] < s.y1 - r;
  if (!inX && !inY) return -1;
  const d = [[Math.abs(m[1] - s.y0), 0], [Math.abs(m[0] - s.x1), 2], [Math.abs(m[1] - s.y1), 4], [Math.abs(m[0] - s.x0), 6]].filter(([, p]) => p % 4 === 0 ? inX : inY);
  return d.sort((a, b) => a[0] - b[0])[0][1];
}
// where a line (o + s·d) crosses a side's line from P0 to P1: u along it, or null
function uOn(o, d, P0, P1) {
  const e = sub(P1, P0), den = cross(d, e);
  if (Math.abs(den) < 1e-12) return null;
  return cross(d, sub(o, P0)) / den;
}
// A piece's rows (the owner's sides are not alike: a narrow one's loops
// 0.6 mm apart): its bands so many at a time that a row is MIN_ROW at least
// — a side by its width, a corner as the narrower side it runs into (a
// sheared corner's band thins to that side's, OPM/opm-cells.png's top right)
// — t's from 0 to 1
function rowsOf(R, p, minRow = MIN_ROW) {
  const nb = bandsOf(R);
  const w = p % 2 === 0 ? widthOn(R, p, 0, 1) : Math.min(widthOn(R, (p + 7) % 8, 0, 1), widthOn(R, (p + 1) % 8, 0, 1));
  const rows = Math.max(1, Math.min(nb, Math.floor(nb / Math.max(1, Math.ceil(minRow / Math.max(1e-6, w / nb))))));
  return Array.from({ length: rows + 1 }, (_, i) => Math.round(i * nb / rows) / nb);
}
// the sausages' strips on every side: { 'reg:p': [{ id, a, u, n, t0, t1 }] }, t0 … t1 the bands they cross
function stripsOf(rects, regions) {
  const out = {};
  let id = 0;
  for (const q of sausagesOf(rects.map(r => ({ ...r, ss: r.ss ?? [] })))) {
    const v = sub(q.b, q.a), L = len(v); if (L < 0.5) continue;
    const u = unit(v), mid = mul(add(q.a, q.b), 0.5);
    const reg = regions.findIndex(R => R.rect === q.ri && (R.kind === 'core') === !!q.core && (R.kind !== 'blend' || (t => t >= 0 && t <= 1)(tOf(R, mid[0], mid[1]))));
    if (reg < 0) continue;
    const R = regions[reg], p = sideOf(R, mid); if (p < 0) continue;
    const ts = [q.a, q.b].map(e => { const t = tOf(R, e[0], e[1]); return t === 2 ? 1 : Math.max(0, Math.min(1, t)); });
    (out[`${reg}:${p}`] ??= []).push({ id: id++, a: q.a, u, n: left(u), t0: Math.min(...ts), t1: Math.max(...ts) });
  }
  return out;
}
// the cuts across a side's row from A (t0) to B (t1): [{ uA, uB }], u along A's side and B's, no two the same, never crossing
function cutsIn(R, p, A, B, t0, t1, strips, W = SAUSAGE_W) {
  const PA = [pointOn(A, p, 0), pointOn(A, p, 1)], PB = [pointOn(B, p, 0), pointOn(B, p, 1)], lA = len(sub(...PA)), lB = len(sub(...PB)), list = [];
  for (const q of strips) {
    if (q.t1 <= t0 + 1e-9 || q.t0 >= t1 - 1e-9) continue;
    for (const k of [-0.5, 0.5]) {
      const o = add(q.a, mul(q.n, k * W)), uA = uOn(o, q.u, ...PA), uB = uOn(o, q.u, ...PB);
      if (uA === null || uB === null || uA < -0.02 || uA > 1.02 || uB < -0.02 || uB > 1.02) continue;
      list.push({ uA: Math.max(0, Math.min(1, uA)), uB: Math.max(0, Math.min(1, uB)) });
    }
  }
  list.sort((x, y) => x.uA + x.uB - y.uA - y.uB);
  const kept = [];
  for (const c of list) {
    const last = kept.at(-1);
    if (last && Math.abs(c.uA - last.uA) * lA < CUT_EPS && Math.abs(c.uB - last.uB) * lB < CUT_EPS) continue;
    if (last) { c.uA = Math.max(c.uA, last.uA); c.uB = Math.max(c.uB, last.uB); }
    if (c.uA <= 1e-6 && c.uB <= 1e-6 || c.uA >= 1 - 1e-6 && c.uB >= 1 - 1e-6) continue;
    kept.push(c);
  }
  return kept;
}
// The cells: { reg, row, p, poly (anticlockwise, every point of a shared
// line its neighbour's too), area }
export function cellsOf(rects, o = {}) {
  const regions = regionsOf(rects, o), strips = stripsOf(rects, regions), breaks = new Map(), plan = [];
  const brk = (s, p, u) => { const k = lineKey(s, p); (breaks.get(k) ?? breaks.set(k, new Set([0, 1])).get(k)).add(u); };
  regions.forEach((R, reg) => { for (let p = 0; p < 8; p++) { const ts = rowsOf(R, p, sizeOf(o, R, 'minRow')); for (let j = 0; j + 1 < ts.length; j++) {
    const A = shapeAt(R, ts[j]), B = shapeAt(R, ts[j + 1]), cuts = p % 2 ? [] : cutsIn(R, p, A, B, ts[j], ts[j + 1], strips[`${reg}:${p}`] ?? [], sizeOf(o, R, 'stripW'));
    for (const c of cuts) { brk(A, p, c.uA); brk(B, p, c.uB); }
    plan.push({ reg, row: j, p, A, B, cuts });
  } } });
  const along = (s, p, u0, u1) => {                                                     // a side's points from u0 to u1, every break between
    const us = [...(breaks.get(lineKey(s, p)) ?? [])].filter(u => u > Math.min(u0, u1) + 1e-9 && u < Math.max(u0, u1) - 1e-9).sort((a, b) => u0 < u1 ? a - b : b - a);
    return [u0, ...us, u1].map(u => pointOn(s, p, u));
  };
  const arc = (s, p) => { const n = o.facets ? Math.round(o.facets) : Math.max(2, Math.ceil(pieceLength(s, p) / ARC_MM)); return Array.from({ length: n + 1 }, (_, i) => pointOn(s, p, i / n)); };   // OPM-W: its facets, its chords
  const out = [];
  for (const { reg, row, p, A, B, cuts } of plan) {
    const polys = [];
    if (p % 2) { if (rOf(A) > 1e-6 || rOf(B) > 1e-6) polys.push([...arc(A, p), ...arc(B, p).reverse()]); }
    else {
      const us = [{ uA: 0, uB: 0 }, ...cuts, { uA: 1, uB: 1 }];
      for (let k = 0; k + 1 < us.length; k++) polys.push([...along(A, p, us[k].uA, us[k + 1].uA), ...along(B, p, us[k + 1].uB, us[k].uB)]);
    }
    for (const P0 of polys) {
      const P = P0.filter((q, i) => len(sub(q, P0[(i + 1) % P0.length])) > 1e-7), area = areaOf(P);
      if (P.length >= 3 && area > 0.05) out.push({ reg, row, p, poly: P, area });
    }
  }
  return { regions, cells: out };
}

// A sliver of a cell — two cuts close — into its neighbour, the one it
// shares the most edge with, once.
// → cells, every one a polygon (the union's outline), its parts' cells
function thickened(cells, minWOf = () => MIN_W) {
  const find = sliversOf(cells, minWOf);
  const by = new Map(); cells.forEach((c, i) => { const r = find(i); (by.get(r) ?? by.set(r, []).get(r)).push(i); });
  const out = [];
  for (const list of by.values()) {
    if (list.length === 1) { out.push(cells[list[0]]); continue; }
    const [L] = loopsOf(list.map(i => ({ ...cells[i], pencil: 1 })), true).flatMap(A => A.loops).sort((a, b) => Math.abs(areaOf(b)) - Math.abs(areaOf(a)));
    if (L) out.push({ ...cells[list[0]], poly: L, area: areaOf(L), parts: list.length });
  }
  return out;
}
// the slivers' groups: i → the cell it went in with (itself if none)
export function sliversOf(cells, minWOf = () => MIN_W) {
  const up = cells.map((_, i) => i), find = i => up[i] === i ? i : (up[i] = find(up[i]));
  const ek = (a, b) => `${keyOf(a)}>${keyOf(b)}`, owner = new Map(), E = cells.map(c => c.poly.map((p, j) => [p, c.poly[(j + 1) % c.poly.length]]));
  E.forEach((es, i) => es.forEach(([a, b]) => owner.set(ek(a, b), i)));
  const area = cells.map(c => c.area), per = cells.map((c, i) => E[i].reduce((s, [a, b]) => s + len(sub(b, a)), 0));
  for (let pass = 0; pass < 1; pass++) {
    let moved = false;
    const shared = new Map();                                                           // a group's boundary length with each neighbour
    E.forEach((es, i) => { const gi = find(i); for (const [a, b] of es) { const j = owner.get(ek(b, a)); if (j === undefined) continue; const gj = find(j); if (gj === gi) continue; const m = shared.get(gi) ?? shared.set(gi, new Map()).get(gi); m.set(gj, (m.get(gj) ?? 0) + len(sub(b, a))); } });
    const thin = [...shared.keys()].filter(g => 2 * area[g] / per[g] < (minWOf(cells[g]) ?? MIN_W)).sort((a, b) => 2 * area[a] / per[a] - 2 * area[b] / per[b]);
    for (const g of thin) {
      if (find(g) !== g) continue;
      const m = shared.get(g); let best = -1, bl = 0;
      for (const [h, l] of m) { const r = find(h); if (r !== g && l > bl) { bl = l; best = r; } }
      if (best < 0) continue;
      up[g] = best; area[best] += area[g]; per[best] += per[g] - 2 * bl; moved = true;
    }
    if (!moved) break;
  }
  return find;
}

// ---------- the contours ----------
// a loop's points, the repeated and the straight ones out
function clean(P) {
  let Q = P.filter((q, i) => len(sub(q, P[(i + 1) % P.length])) > 1e-6);
  for (let i = 0; Q.length > 3 && i < Q.length;) {
    const a = Q[(i - 1 + Q.length) % Q.length], b = Q[i], c = Q[(i + 1) % Q.length], u = unit(sub(b, a)), v = unit(sub(c, b));
    if (Math.abs(cross(u, v)) < 1e-5 && dot(u, v) > 0) Q.splice(i, 1); else i++;
  }
  return Q;
}
// a loop, its inside on its left, moved in by d: every edge's line d in, a
// corner where two meet. An edge the move turns back — a short one at a sharp
// corner, an arc's piece where a sheared corner meets its end — goes, its
// corner with it, and again; null where a long one would (too narrow), or a
// corner falls outside the loop
export function insetOf(P0, d) {
  let P = blunted(P0, d);
  for (let guard = 0; guard <= P0.length; guard++) {
    const n = P.length, Q = [];
    if (n < 3) return null;
    for (let i = 0; i < n; i++) {
      const a = P[(i - 1 + n) % n], b = P[i], c = P[(i + 1) % n], u1 = unit(sub(b, a)), u2 = unit(sub(c, b)), n1 = left(u1), n2 = left(u2), x = cross(u1, u2);
      if (Math.abs(x) < 1e-9) { Q.push(add(b, mul(n1, d))); continue; }
      const s = cross(mul(sub(n2, n1), d), u2) / x;
      Q.push(add(add(b, mul(n1, d)), mul(u1, s)));
    }
    const elen = i => len(sub(P[(i + 1) % n], P[i])), bad = [];
    for (let i = 0; i < n; i++) if (dot(sub(Q[(i + 1) % n], Q[i]), sub(P[(i + 1) % n], P[i])) <= 0) bad.push(i);
    if (!bad.length) return Math.sign(areaOf(Q)) === Math.sign(areaOf(P0)) && Q.every(q => inPoly(P0, q[0], q[1])) ? Q : null;
    const i = bad.sort((x, y) => elen(x) - elen(y))[0];
    if (n <= 4 || elen(i) > 3 * d) return null;
    P = P.filter((_, j) => j !== (i + 1) % n);
  }
  return null;
}
// a loop's sharp corners — under SHARP inside, a sheared band's thin end —
// cut across where its two sides are 3d apart, walked back and on along
// them past as many points as it takes, so the contour has room to turn
const SHARP = 30 * Math.PI / 180;
function blunted(P0, d) {
  let P = P0.slice();
  for (let guard = 0; guard < 16; guard++) {
    const n = P.length;
    const k = P.findIndex((b, i) => { const u1 = unit(sub(b, P[(i - 1 + n) % n])), u2 = unit(sub(P[(i + 1) % n], b)), th = Math.atan2(cross(u1, u2), dot(u1, u2)); return th > 0 && Math.PI - th < SHARP; });
    if (k < 0 || n < 5) return P;
    const walk = (t, step) => { let i = k, rem = t; for (let m = 0; m < n; m++) { const j = (i + step + n) % n, L = len(sub(P[j], P[i])); if (rem <= L) return { p: add(P[i], mul(unit(sub(P[j], P[i])), rem)), i, j }; rem -= L; i = j; } return null; };
    let cut = null;
    for (let t = 0.1; t < 30 && !cut; t += 0.1) { const a = walk(t, -1), b = walk(t, 1); if (!a || !b) break; if (len(sub(b.p, a.p)) >= 3 * d) cut = [a, b]; }
    if (!cut) return P;
    const [a, b] = cut, keep = [];
    for (let i = b.j; i !== a.j; i = (i + 1) % n) keep.push(P[i]);                  // from past the cut on round to before it
    keep.push(P[a.j], a.p, b.p);
    if (keep.length < 4 || keep.length >= n + 2) return P;
    P = keep.filter((q, i) => len(sub(q, keep[(i + 1) % keep.length])) > 1e-6);
  }
  return P;
}
// a loop as pieces, closed, its corners of KINK and more rounded — r ROUND at
// most, less where an edge is short — the rest straight on
export function roundedOf(P, R = ROUND) {
  const n = P.length, corner = P.map((b, i) => {
    const a = P[(i - 1 + n) % n], c = P[(i + 1) % n], u1 = unit(sub(b, a)), u2 = unit(sub(c, b)), th = Math.atan2(cross(u1, u2), dot(u1, u2));
    if (Math.abs(th) < KINK) return { a: b, b };
    const tn = Math.tan(Math.abs(th) / 2), r = Math.min(R, 0.45 * Math.min(len(sub(b, a)), len(sub(c, b))) / tn), T = r * tn;
    if (r < 0.05) return { a: b, b };
    const A = sub(b, mul(u1, T)), B = add(b, mul(u2, T)), C = add(A, mul(left(u1), th > 0 ? r : -r));
    return { a: A, b: B, arc: { t: 'A', a: A, b: B, c: C, r, left: th > 0 } };
  });
  const out = [];
  corner.forEach((q, i) => {
    if (q.arc) out.push(q.arc);
    const next = corner[(i + 1) % n].a;
    if (len(sub(next, q.b)) > 1e-6) out.push({ t: 'L', a: q.b, b: next });
  });
  return out;
}
// The areas' outlines: every cell alone, or (merge) the cells of one pencil
// side by side one area — its edges those no neighbour of its own shares, in
// loops, the inside on the left (a hole's loop the other way round)
function loopsOf(cells, merge) {
  const groups = [];
  if (!merge) cells.forEach((c, i) => groups.push({ pencil: c.pencil, cells: [i] }));
  else {
    const up = cells.map((_, i) => i), find = i => up[i] === i ? i : (up[i] = find(up[i])), edge = new Map();
    cells.forEach((c, i) => c.poly.forEach((p, j) => edge.set(`${keyOf(p)}>${keyOf(c.poly[(j + 1) % c.poly.length])}`, i)));
    cells.forEach((c, i) => c.poly.forEach((p, j) => { const k = edge.get(`${keyOf(c.poly[(j + 1) % c.poly.length])}>${keyOf(p)}`); if (k !== undefined && cells[k].pencil === c.pencil) up[find(k)] = find(i); }));
    const by = new Map(); cells.forEach((c, i) => { const r = find(i); (by.get(r) ?? by.set(r, []).get(r)).push(i); });
    for (const list of by.values()) groups.push({ pencil: cells[list[0]].pencil, cells: list });
  }
  return groups.map(G => {
    const es = [];
    for (const i of G.cells) { const P = cells[i].poly; P.forEach((p, j) => es.push([p, P[(j + 1) % P.length]])); }
    const own = new Set(es.map(([a, b]) => `${keyOf(a)}>${keyOf(b)}`)), rest = es.filter(([a, b]) => !own.has(`${keyOf(b)}>${keyOf(a)}`));
    const from = new Map(); rest.forEach((e, i) => (from.get(keyOf(e[0])) ?? from.set(keyOf(e[0]), []).get(keyOf(e[0]))).push(i));
    const used = new Set(), loops = [];
    rest.forEach((e, i) => {
      if (used.has(i)) return;
      const L = []; let j = i;
      while (j !== undefined && !used.has(j)) { used.add(j); L.push(rest[j][0]); j = (from.get(keyOf(rest[j][1])) ?? []).find(k => !used.has(k)); }
      if (L.length >= 3) loops.push(clean(L));
    });
    return { pencil: G.pencil, cells: G.cells, loops };
  });
}

// ---------- the plan ----------
// o: { pencils, corner, frame, merge, inset, round, minRow, stripW, minW, rim, facets } → { regions, cells (every
// one its pencil), areas, modules: a contour each { kind: 'cell', pencil,
// pieces, mm }, few, lost: cells too narrow for a contour }
export function opmPlan(rects, res, o = {}) {
  const pencils = o.pencils ?? cleanPencils(PRISMA_PENCILS), F = o.frame, { regions, cells: all } = cellsOf(rects, o), minWOf = c => sizeOf(o, regions[c.reg], 'minW');
  const inF = P => { if (!F) return true; const c = P.reduce((a, p) => add(a, mul(p, 1 / P.length)), [0, 0]); return c[0] >= F.x0 && c[0] <= F.x1 && c[1] >= F.y0 && c[1] <= F.y1; };
  const cells = thickened(all, minWOf).filter(c => inF(c.poly)).map(c => ({ ...c, lin: meanIn(res, c.poly) }));
  const once = ps => {
    const near = nearestOf(ps, -Infinity), mine = cells.map(c => ({ ...c, pencil: c.lin ? near(c.lin) : null })), drawn = mine.filter(c => c.pencil);   // never the canvas's own: the whole of it painted (the owner, 2026-10-27), next to white the lightest pencil
    const areas = loopsOf(drawn, !!o.merge), modules = [];
    let lost = 0;
    const d = o.inset ?? INSET;                                                         // 0: on the cell's own edge, its neighbour's line its own (OPM-S, 2026-10-28)
    for (const A of areas) for (const L of A.loops) {
      const Q = L.length >= 3 && (d > 0 ? insetOf(L, d) : L);
      if (!Q) { lost++; continue; }
      const pieces = roundedOf(Q, o.round ?? ROUND);
      modules.push({ kind: 'cell', pencil: A.pencil, pieces, mm: pieces.reduce((s, g) => s + pieceLenOf(g), 0) });
    }
    return { regions, cells: mine, areas, modules, lost };
  };
  const D = once(pencils), mm = new Map();
  for (const M of D.modules) mm.set(M.pencil, (mm.get(M.pencil) ?? 0) + M.mm);
  const least = Math.min(o.least ?? LEAST_MM, LEAST_SHARE * [...mm.values()].reduce((a, v) => a + v, 0)), few = [...mm].filter(([, v]) => v < least).map(([id]) => id);
  if (!few.length) return { ...D, few, rings: [], rays: [] };
  return { ...once(pencils.map(p => few.includes(p.id) ? { ...p, on: false } : p)), few, rings: [], rays: [] };
}
const pieceLenOf = g => g.t === 'L' ? len(sub(g.b, g.a)) : g.r * Math.abs(Math.atan2(cross(sub(g.a, g.c), sub(g.b, g.c)), dot(sub(g.a, g.c), sub(g.b, g.c))));

// ---------- OPM-S: FRAME and DRAW BW (the owner, 2026-10-28) ----------
// FRAME, "only the outer big frame, so that I can lay the canvas perfectly
// straight; only after this we draw with the pencils": the picture's outer
// contour alone — every blend's Key 1 · A, a tile's own box — on its line,
// its corners as they are (OPM-W's in o.facets straight pieces, as its
// cells'), a closed stroke. → modules as opmPlan's, o.pencil theirs
const facetsOn = (s, p, n) => Array.from({ length: n }, (_, i) => ({ t: 'L', a: pointOn(s, p, i / n), b: pointOn(s, p, (i + 1) / n) }));
// OPM-P's, o.marks (the owner, 2026-10-29: "in Frame I do not need the whole
// contour drawn as now; four lines are enough, one on every side, so there
// are no needless traces on the canvas — 8 cm or so at most"): one mark in
// the middle of every side of Key 1 · A, so long at most, on its line — the
// top, the right, the bottom, the left, every one clockwise — a stroke each,
// the pencil up between. → modules as above, one a mark
export const FRAME_MARK = 80;   // mm, a mark of FRAME at most (the owner's "8 cm or so at most")
export function outerOf(rects, o = {}) {
  if (o.marks) return regionsOf(rects, o).filter(R => R.key === 0).flatMap(R => [4, 2, 0, 6].map(p => {
    const L = pieceLength(R.a, p), f = L > 1e-9 ? Math.min(1, o.marks / L) / 2 : 0, g = lineOn(R.a, p, 0.5 - f, 0.5 + f);
    return { kind: 'cell', mark: true, pencil: o.pencil ?? null, pieces: [{ t: 'L', a: g.b, b: g.a }], mm: pieceLenOf(g) };   // its side anticlockwise as the shape goes: the other way, clockwise
  }).filter(M => M.mm > 1e-6));
  return regionsOf(rects, o).filter(R => R.key === 0).map(R => {
    const pieces = [0, 1, 2, 3, 4, 5, 6, 7].flatMap(p => p % 2 && o.facets ? facetsOn(R.a, p, Math.round(o.facets)) : [lineOn(R.a, p, 0, 1)]).filter(g => pieceLenOf(g) > 1e-6);
    return { kind: 'cell', pencil: o.pencil ?? null, pieces, mm: pieces.reduce((s, g) => s + pieceLenOf(g), 0) };
  }).filter(M => M.pieces.length >= 2);
}
// DRAW BW, "without a change of pencils, at once": every contour in one
// pencil, the one in the box that shows best on the ground, its lightness
// the farthest from the ground's — on the white the darkest, on black the
// lightest (the owner, 2026-10-28: "on a black background"); FRAME's too
export const boldestOf = (pencils, ground = '#FBFAF7') => { const L = lightnessOf(ground), far = p => Math.abs(lightnessOf(p.hex) - L); return pencils.filter(p => p.on !== false).reduce((a, p) => !a || far(p) > far(a) ? p : a, null); };

// ---------- OPM-P: every block its own rows, the lines once, DRAG a colour at a time (the owner, 2026-10-29) ----------
// OPM-W's page for paint, "without cardboard and without sticks; the straight
// lines and the sharp corners stay". The rows the brush apart, as INKA's and
// ST-JOHN's ("the distance from one line to the next the brush's thickness"),
// on the blend's perspective, every block its own rows (his choice, the
// second time, OPM/Screenshot 2026-10-29 at 2.12.27 PM and 3.00.14 PM: "a side
// and a bevel filled with their own rows exactly the brush, parallel to their
// own edge; the rows end on the rays, the diagonals from Key 1's corner to Key
// 2's; the blend's perspective stays, a row does not go over the corner: every
// block its own number of rows"; the rings round the corner, the first try,
// "nearer INKA's rings", left white gaps, Screenshot 3.05.15 PM), bound by
// the compromise he set the same afternoon (Screenshot 3.24.37 PM, OPM-W's
// blocks each its own rows, not meeting: "we had this already"; "we cannot
// make the exact number of lines on the sides and at the top and bottom …
// take a compromise as the rule: 6 mm one strip, the least; two such strips
// can equal one the other way, 12 mm vertical = 6 mm horizontal"): the
// blend's loops the bands, as many as the narrowest block's gap holds strips
// of the brush, every band of every block a whole number of rows, 1, 2, 3 …
// — the bands' lines go on over the corners, the rows between them end on
// the rays (o.bound, at first; else every block its own count). The lines of
// every cell drawn once ("no double passes over shared segments; at RUBS = 1
// every piece once"): the rows first, block after block round the figure,
// clockwise or not, then the rays ("then the rays, by the corner"). DRAG a
// colour after another, one brush, a pause between to wipe it and squeeze the
// next ("the brush must not go through a neighbouring piece of another
// colour"): along the rows' middles, then along the rays' strips, every
// stroke on to where the brush covers its cells' ends, Rubs times over. Kuzya,
// of it: "we are going from drawing contours to the algorithmic control of
// laying the material".
export const PITCH_NEW = 6, PITCH_MIN = 2, PITCH_MAX = 20;          // mm, the brush's working width: the rows' step (est.)
export const DRAG_RUBS_NEW = 1, DRAG_RUBS_MIN = 1, DRAG_RUBS_MAX = 16;   // a colour's strokes so many times over, there and back
export const FIT = 1.05;           // a row so much wider than the brush at most: a block's rows a whole number, never a white stripe between them (est.)
const NF_ROUND = 8, RAY = Infinity;   // a round corner's chords; a ray's kind
// a ray drawn straight: through a bend sharper than this the pencil up, a new stroke (the owner, 2026-10-29,
// Screenshot 6.00.41 PM, a ray bent from the core to Key 2 and on to Key 1: "there one could simply draw a ray")
const RAY_TURN = 2;
// a block's rows: its gap over as many as come nearest the brush, more where one would be wider than FIT of it
export const rowsIn = (d, pitch = PITCH_NEW) => { const n = Math.max(1, Math.round(d / pitch)); return d / n <= pitch * FIT + 1e-9 ? n : Math.max(1, Math.ceil(d / (pitch * FIT) - 1e-9)); };
// a band's rows, Bound: 1, 2, 4, 8 … — two of one block's always one of its neighbour's ("12 mm = 6 + 6", never three against four) — the fewest that keep every one within FIT of the brush
export const bandRows = (w, pitch = PITCH_NEW) => { let m = 1; while (w / m > pitch * FIT + 1e-9) m *= 2; return m; };
// A region's blocks: its outline's points round it, anticlockwise — every
// side's start, every corner's facets' — each with its ray from the outer
// key's point to the inner one's; a block the piece between two rays, a side
// or a facet of a bevel, its gap square to its edge, its rows.
// → [{ p, side, a: [its outer edge's ends], b: [its inner edge's], d, n, at: its outer edge's middle }]
export function blocksIn(R, pitch = PITCH_NEW, facets = 0, bound = true) {
  const nf = facets ? Math.round(facets) : NF_ROUND, A = shapeAt(R, 0), B = shapeAt(R, 1), V = [];
  for (let p = 0; p < 8; p++) for (const f of p % 2 ? Array.from({ length: nf }, (_, i) => i / nf) : [0]) V.push({ p, a: pointOn(A, p, f), b: pointOn(B, p, f) });
  const W = V.filter((v, i) => { const w = V[(i + 1) % V.length]; return len(sub(v.a, w.a)) > 1e-7 || len(sub(v.b, w.b)) > 1e-7; });   // two rays one: no block between them
  const K = W.map((v, i) => {
    const w = W[(i + 1) % W.length], ea = sub(w.a, v.a), eb = sub(w.b, v.b), e = len(ea) >= len(eb) ? ea : eb;
    const d = len(e) > 1e-9 ? Math.abs(dot(sub(v.b, v.a), left(unit(e)))) : 0;   // the outer edge's line to the inner one's, square to them (a side's, a facet's: parallel)
    return { p: v.p, side: v.p % 2 === 0, a: [v.a, w.a], b: [v.b, w.b], d, n: rowsIn(d, pitch), m: 1, at: mul(add(v.a, w.a), 0.5) };
  });
  if (!bound) return K;
  // bound: the bands as many as the narrowest side holds — one row a brush wide there ("6 mm one strip, the least"), a side or a bevel a sliver left out of the count — every block's band 1, 2, 4 … rows
  const wide = K.filter(B => B.d >= pitch), ds = (wide.some(B => B.side) ? wide.filter(B => B.side) : wide).map(B => B.d), N = ds.length ? rowsIn(Math.min(...ds), pitch) : 1;
  for (const B of K) { B.m = bandRows(B.d / N, pitch); B.n = N * B.m; }
  return K;
}
// The keys fitted to the brush (the owner, 2026-10-29, the lines of three
// rows against four not meeting, Screenshot 3.28.26 PM: "let us look for the
// compromise not in the lines but globally in the geometry: we may change the
// size of Key 1, Key 2 and the core for the rule 12 = 6 + 6"): every next key
// moved so every side's gap to the key round it is the brush times the bands
// times 1, 2, 4 … — the bands as many as change the keys least — so every row
// of a side the brush exactly and every side's lines meet its neighbours';
// the core, its least side two of the brush's times its rings — so Key 1 a
// whole number of brushes across and up, about its middle (a quarter of a
// brush an edge at most), the core's evenness by the gaps chosen. A side against the key round it stays against it; the bevels as
// their keys' corners make them (one corner a key: their rows within FIT,
// 1, 2, 4 … a band). No key's side a point (the owner, 2026-10-29, the first
// test, OPM/IMAGE 17:58:29, Screenshot 6.00.41 PM: Key 2's corners eating its
// bottom side, its block a triangle at 6 o'clock, the rays meeting in its
// point and bending on to the core): every key's corner so much less that
// every side of it is the brush long at least. The sausages where they lie on
// the canvas. → { r, moved: [{ key, left, right, bottom, top }], bands: [N a gap], corners: [before, after] }
const POW2 = [1, 2, 4, 8, 16, 32];
export function fitKeys(r, pitch = PITCH_NEW) {
  if (!isBlend(r)) {                                                               // a tile: its least side two of the brush's times its rings, about its middle
    const two = 2 * pitch, W = Math.max(two, Math.round(r.w / two) * two), H = Math.max(two, Math.round(r.h / two) * two);
    return { r: { ...r, x: r.x + (r.w - W) / 2, y: r.y + (r.h - H) / 2, w: W, h: H }, moved: [{ key: 1, left: (W - r.w) / 2, right: (W - r.w) / 2, bottom: (H - r.h) / 2, top: (H - r.h) / 2 }], bands: [] };
  }
  const K = keysOf(r), box = q => ({ x0: q.x, y0: q.y, x1: q.x + q.w, y1: q.y + q.h }), two = 2 * pitch, moved = [], bands = [];
  const W = Math.max(two, Math.round(r.w / pitch) * pitch), H = Math.max(two, Math.round(r.h / pitch) * pitch), A = { x: r.x + (r.w - W) / 2, y: r.y + (r.h - H) / 2, w: W, h: H };   // a whole number of brushes: half a brush an edge at most; the core's evenness by its gaps
  const boxes = [box(A)];
  moved.push({ key: 1, left: (W - r.w) / 2, right: (W - r.w) / 2, bottom: (H - r.h) / 2, top: (H - r.h) / 2 });
  for (let k = 1; k < K.length; k++) {
    const P = boxes[k - 1], B = box(K[k]), last = k === K.length - 1 && r.core;
    const g = { left: B.x0 - P.x0, right: P.x1 - B.x1, bottom: B.y0 - P.y0, top: P.y1 - B.y1 }, sides = Object.keys(g).filter(s => g[s] >= pitch / 2);
    let best = null;
    for (let N = 1; N <= Math.max(1, Math.round(Math.max(...Object.values(g)) / pitch)); N++) {
      const u = N * pitch, t = {};
      for (const s of Object.keys(g)) t[s] = sides.includes(s) ? u * POW2.reduce((a, m) => Math.abs(m * u - g[s]) < Math.abs(a * u - g[s]) ? m : a, 1) : Math.max(0, g[s]);
      const w = P.x1 - P.x0 - t.left - t.right, h = P.y1 - P.y0 - t.bottom - t.top;
      if (w < 2 * pitch || h < 2 * pitch) continue;
      const odd = last && Math.abs(Math.min(w, h) / (2 * pitch) - Math.round(Math.min(w, h) / (2 * pitch))) > 1e-9;   // the core: its rings the brush exactly
      const cost = sides.reduce((a, s) => a + Math.abs(t[s] - g[s]), 0) + (odd ? 1e6 : 0);
      if (!best || cost < best.cost - 1e-9 || Math.abs(cost - best.cost) < 1e-9 && N > best.N) best = { N, t, cost };
    }
    if (!best) { boxes.push(B); moved.push({ key: k + 1, left: 0, right: 0, bottom: 0, top: 0 }); bands.push(0); continue; }
    const { t } = best;
    boxes.push({ x0: P.x0 + t.left, x1: P.x1 - t.right, y0: P.y0 + t.bottom, y1: P.y1 - t.top });
    moved.push({ key: k + 1, left: t.left - g.left, right: t.right - g.right, bottom: t.bottom - g.bottom, top: t.top - g.top }); bands.push(best.N);
  }
  const keys = boxes.slice(1).map(b => keyIn(A, { x: b.x0, y: b.y0, w: b.x1 - b.x0, h: b.y1 - b.y0 }));
  const corners = boxes.map((b, k) => Math.max(0, Math.min(r.corners[k], (Math.min(b.x1 - b.x0, b.y1 - b.y0) - pitch) / 2)));   // every side the brush long at least
  const at = q => [(r.x + q[0] * r.w - A.x) / A.w, (r.y + q[1] * r.h - A.y) / A.h];   // a sausage where it lay on the canvas
  return { r: { ...r, ...A, keys, corners, ss: (r.ss ?? []).map(q => ({ ...q, a: at(q.a), b: at(q.b) })) }, moved, bands, corners: [r.corners, corners] };
}
// a row line's order: its figure, its key, its block, its depth
const rowId = (R, blk, k) => ((R.rect * 100 + R.key) * 1000 + blk) * 1000 + k;
const blkOf = id => Math.floor(id / 1000) % 1000, keyOfRow = id => Math.floor(id / 1e6);
const lerpP = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
// The cells: { reg, blk, row, p, poly (anticlockwise), kinds (the edge from
// every point to the next: its row line, or RAY), area, mid (the row's middle
// through it, anticlockwise), ends (its two ends across the row, the same
// way), ray (a strip's id, -1 none), across and acrossEnds (a strip's cell: its
// middle from the outer row line to the inner, its two ends), nrm (the strip's
// normal) }
export function blockCellsOf(rects, o = {}) {
  const pitch = o.pitch ?? PITCH_NEW, W = o.stripW ?? SAUSAGE_W, regions = regionsOf(rects, o), strips = stripsOf(rects, regions), breaks = new Map(), plan = [];
  const brk = (s, p, u) => { const k = lineKey(s, p); (breaks.get(k) ?? breaks.set(k, new Set([0, 1])).get(k)).add(u); };
  regions.forEach((R, reg) => {
    const K = R.blocks = blocksIn(R, pitch, o.facets, o.bound !== false), m = K.length, fr = n => Array.from({ length: n + 1 }, (_, k) => k / n);
    R.sides = Object.fromEntries(K.filter(B => B.side).map(B => [B.p, B.n])); R.bands = o.bound !== false ? K[0].n / K[0].m : 0;
    const rays = K.map((_, i) => [...new Set([...fr(K[(i + m - 1) % m].n), ...fr(K[i].n)].map(f => Math.round(f * 1e9) / 1e9))].sort((x, y) => x - y));   // ray i: where the rows of the blocks either side of it end on it
    K.forEach((B, i) => {
      for (let k = 0; k < B.n; k++) {
        const t0 = k / B.n, t1 = (k + 1) / B.n, q = { reg, blk: i, row: k, p: B.p, t0, t1, B, ray0: rays[i], ray1: rays[(i + 1) % m] };
        if (B.side) {
          const A = shapeAt(R, t0), Bs = shapeAt(R, t1), list = (strips[`${reg}:${B.p}`] ?? []).filter(z => z.t1 > t0 + 1e-9 && z.t0 < t1 - 1e-9), cuts = cutsIn(R, B.p, A, Bs, t0, t1, list, W);
          for (const c of cuts) { brk(A, B.p, c.uA); brk(Bs, B.p, c.uB); }
          Object.assign(q, { A, Bs, cuts, list });
        }
        plan.push(q);
      }
    });
  });
  const along = (s, p, u0, u1) => {
    const us = [...(breaks.get(lineKey(s, p)) ?? [])].filter(u => u > Math.min(u0, u1) + 1e-9 && u < Math.max(u0, u1) - 1e-9).sort((a, b) => u0 < u1 ? a - b : b - a);
    return [u0, ...us, u1].map(u => pointOn(s, p, u));
  };
  const mid = (a, b) => mul(add(a, b), 0.5), out = [], seen = new Map(), HAIR = 1e-6;
  const snap = v => {                                                                // one point a place: a neighbour's the same, to the last digit
    const gx = Math.round(v[0] / (10 * HAIR)), gy = Math.round(v[1] / (10 * HAIR));
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const u of seen.get(`${gx + i},${gy + j}`) ?? []) if (Math.abs(u[0] - v[0]) <= HAIR && Math.abs(u[1] - v[1]) <= HAIR) return u;
    (seen.get(`${gx},${gy}`) ?? seen.set(`${gx},${gy}`, []).get(`${gx},${gy}`)).push(v);
    return v;
  };
  for (const q of plan) {
    const { reg, blk, row, p, t0, t1, B } = q, R = regions[reg], line0 = rowId(R, blk, row), line1 = rowId(R, blk, row + 1), parts = [];
    const on0 = f => lerpP(B.a[0], B.b[0], f), on1 = f => lerpP(B.a[1], B.b[1], f);                       // its two rays
    const between = (ray, on, up) => ray.filter(f => f > t0 + 1e-9 && f < t1 - 1e-9).sort((x, y) => up ? x - y : y - x).map(f => [on(f), RAY]);   // where the next block's rows end on the ray
    // a cell: its outer row line, the ray or the cut inward, its inner row line back, the ray or the cut outward — every point its edge's kind
    const cell = (a, end1, b, end0) => [...a.map((v, i) => [v, i < a.length - 1 ? line0 : RAY]), ...end1, ...b.map((v, i) => [v, i < b.length - 1 ? line1 : RAY]), ...end0];
    if (!B.side) {
      const A0 = on0(t0), A1 = on1(t0), B0 = on0(t1), B1 = on1(t1);
      parts.push({ pts: cell([A0, A1], between(q.ray1, on1, true), [B1, B0], between(q.ray0, on0, false)), mid: [mid(A0, B0), mid(A1, B1)], ends: [[A0, B0], [A1, B1]], ray: -1 });
    } else {
      const us = [{ uA: 0, uB: 0 }, ...q.cuts, { uA: 1, uB: 1 }];
      for (let j = 0; j + 1 < us.length; j++) {
        const a = along(q.A, p, us[j].uA, us[j + 1].uA), b = along(q.Bs, p, us[j + 1].uB, us[j].uB);
        const A0 = a[0], A1 = a.at(-1), B1 = b[0], B0 = b.at(-1), m = mul(add(add(A0, A1), add(B0, B1)), 0.25);
        const z = q.list.find(z => Math.abs(dot(sub(m, z.a), z.n)) < W / 2 - 1e-6);   // between a strip's two edges: a ray's cell
        parts.push({ pts: cell(a, j + 2 === us.length ? between(q.ray1, on1, true) : [], b, j === 0 ? between(q.ray0, on0, false) : []), mid: [mid(A0, B0), mid(A1, B1)], ends: [[A0, B0], [A1, B1]], ray: z ? z.id : -1,
          ...(z ? { across: [mid(A0, A1), mid(B0, B1)], acrossEnds: [[A0, A1], [B0, B1]], nrm: z.n } : {}) });
      }
    }
    for (const P0 of parts) {
      const S0 = P0.pts.map(([v, k]) => [snap(v), k]), C = S0.filter(([v], i) => v !== S0[(i + 1) % S0.length][0]), poly = C.map(e => e[0]), area = areaOf(poly);
      if (poly.length >= 3 && area > 0.05) out.push({ reg, blk, row, p, poly, kinds: C.map(e => e[1]), area, mid: P0.mid, ends: P0.ends, ray: P0.ray, ...(P0.across ? { across: P0.across, acrossEnds: P0.acrossEnds, nrm: P0.nrm } : {}) });
    }
  }
  return { regions, cells: out };
}

// a polyline's pieces
const piecesOf = pts => pts.slice(1).map((b, i) => ({ t: 'L', a: pts[i], b }));
// a stroke on to where the brush, square across it, covers its cells' ends — the far point of either end's edge — so no white is left where a row meets a ray at a slant
function covering(pts, e0, e1) {
  if (pts.length < 2 || len(sub(pts.at(-1), pts[0])) < 1e-6) return pts;
  const P = pts.slice(), u0 = unit(sub(P[1], P[0])), u1 = unit(sub(P.at(-1), P.at(-2)));
  P[0] = add(P[0], mul(u0, Math.min(0, ...e0.map(q => dot(sub(q, P[0]), u0)))));
  P[P.length - 1] = add(P.at(-1), mul(u1, Math.max(0, ...e1.map(q => dot(sub(q, P.at(-1)), u1)))));
  return P;
}
// the way round a region's middle: the angle from 12 o'clock clockwise, 0 … 2π
const clock = (c, p) => { const a = Math.atan2(p[0] - c[0], p[1] - c[1]); return a < 0 ? a + 2 * Math.PI : a; };
const centreOf = R => [(R.a.x0 + R.a.x1) / 2, (R.a.y0 + R.a.y1) / 2];
// a line turned ↻ (cw) or ↺ about c; a closed one from its point nearest 12 o'clock
function turned(pts, c, cw) {
  let w = 0;
  for (let i = 1; i < pts.length; i++) w += cross(sub(pts[i - 1], c), sub(pts[i], pts[i - 1]));
  let P = w > 0 === cw ? pts.slice().reverse() : pts.slice();                        // w > 0: anticlockwise
  if (P.length > 2 && len(sub(P[0], P.at(-1))) < 1e-6) {
    const ring = P.slice(0, -1), off = q => { const a = clock(c, q); return Math.min(a, 2 * Math.PI - a); };
    const best = ring.reduce((b, q, i) => off(q) < off(ring[b]) - 1e-9 ? i : b, 0);
    P = [...ring.slice(best), ...ring.slice(0, best), ring[best]];
  }
  return P;
}
// a place round c, in the way the brush goes
const turnAt = (c, p, cw) => { const a = clock(c, p); return cw ? a : (2 * Math.PI - a) % (2 * Math.PI); };
// a region's blocks in the brush's order: round from 12 o'clock
const blockOrder = (R, cw) => { const c = centreOf(R), o = R.blocks.map((B, i) => [turnAt(c, B.at, cw), i]).sort((x, y) => x[0] - y[0]), at = []; o.forEach(([, i], j) => { at[i] = j; }); return at; };
// edges into polylines, end to end; at a fork the straightest on; with
// maxTurn (degrees) never on through a bend sharper — a ray straight
function chainsOf(edges, maxTurn = Infinity) {
  const at = new Map(), used = new Set(), out = [];
  edges.forEach((e, i) => { for (const p of [e.a, e.b]) (at.get(keyOf(p)) ?? at.set(keyOf(p), []).get(keyOf(p))).push(i); });
  const other = (e, k) => keyOf(e.a) === k ? e.b : e.a;
  const walk = (i, from) => {
    const L = [from]; let j = i, cur = from;
    while (j !== undefined) {
      used.add(j); const nx = other(edges[j], keyOf(cur)), d = unit(sub(nx, cur)); L.push(nx); cur = nx;
      const next = (at.get(keyOf(cur)) ?? []).filter(m => !used.has(m)).map(m => ({ m, c: dot(d, unit(sub(other(edges[m], keyOf(cur)), cur))) })).sort((x, y) => y.c - x.c);
      j = next.length && (maxTurn >= 180 || next[0].c > Math.cos(maxTurn * Math.PI / 180)) ? next[0].m : undefined;
    }
    return L;
  };
  for (const [k, list] of at) for (const i of list) if (!used.has(i) && list.length !== 2) out.push(walk(i, keyOf(edges[i].a) === k ? edges[i].a : edges[i].b));   // from the ends first
  edges.forEach((e, i) => { if (!used.has(i)) out.push(walk(i, e.a)); });                                                  // then the loops
  return out;
}
// The lines, every one once (DRAW BW, FRAME's after it): a cell's edge where
// it meets the canvas, a cell of another colour or (Cells) another cell;
// Merged, one colour's neighbours none between them. The rows first, every
// line as long as it goes on: one block's line and the next one's where they
// meet on a ray one line, a band's all round the figure a ring (the owner,
// 2026-10-29, Screenshot 5.44.03 PM, the pencil from short piece to short
// piece: "we spoke of continuous rings, remember? … short pieces may be, but
// not all") — a figure's keys in turn, from the outside in, every line the way
// round, a band at a time — its ring first, from its point nearest the pencil,
// then its pieces, the nearest next, every one from its end nearer the pencil
// — then the rays, by their place round the figure, every one from its end
// nearer the pencil, straight — a bend, a new stroke.
// → [{ kind: 'row' | 'ray', pts }]
export function linesOf(cells, regions, o = {}) {
  const E = new Map(), cw = o.cw !== false;
  cells.forEach((c, i) => {
    if (!c.pencil) return;
    c.poly.forEach((a, j) => {
      const b = c.poly[(j + 1) % c.poly.length], ka = keyOf(a), kb = keyOf(b), k = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`, e = E.get(k);
      if (e) { e.cells.push(i); if (c.kinds[j] < e.kind) Object.assign(e, { kind: c.kinds[j], reg: c.reg }); } else E.set(k, { a, b, kind: c.kinds[j], cells: [i], reg: c.reg });
    });
  });
  const kept = [...E.values()].filter(e => e.cells.length === 1 || cells[e.cells[0]].group !== cells[e.cells[1]].group && (!o.merge || cells[e.cells[0]].pencil !== cells[e.cells[1]].pencil));
  const out = [], rows = kept.filter(e => e.kind !== RAY), at = new Map(), ek = (a, b) => { const ka = keyOf(a), kb = keyOf(b); return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`; };
  for (const e of rows) at.set(ek(e.a, e.b), { reg: e.reg, key: keyOfRow(e.kind), t: e.kind % 1000 / regions[e.reg].blocks[blkOf(e.kind)].n });   // its figure and key, its depth in its block, 0 … 1
  // a band at a time (the owner, 2026-10-29, IMAGE 19:31:25 and 19:32:39, the pencil across the
  // figure from piece to piece): its ring first, then its pieces round the figure, a block's from
  // its outer edge in — the pencil from one to the next a short way
  const lines = chainsOf(rows).map(L => {
    const q = at.get(ek(L[0], L[1])), R = regions[q.reg], c = centreOf(R), P = turned(L, c, cw), closed = len(sub(P[0], P.at(-1))) < 1e-6;
    return { ...q, P, closed, band: R.bands ? Math.floor(q.t * R.bands + 1e-6) : 0, at: turnAt(c, P[0], cw) };
  });
  // a band's ring the way round, from its point nearest the pencil; its pieces — a C where a block has fewer
  // rows — the nearest next, from its end nearer the pencil, not round from the far end across the gap
  const tq = v => Math.round(v * 1e6), groups = new Map();
  lines.sort((x, y) => x.key - y.key || x.band - y.band || (y.closed - x.closed) || tq(x.t) - tq(y.t) || x.at - y.at);
  for (const L of lines) (groups.get(`${x0(L)}`) ?? groups.set(`${x0(L)}`, []).get(`${x0(L)}`)).push(L);
  function x0(L) { return `${L.key}:${L.band}`; }
  let pen = null;
  for (const G of groups.values()) {
    for (const L of G.filter(L => L.closed)) {
      let P = L.P;
      if (pen) { const ring = P.slice(0, -1), b = ring.reduce((m, q, i) => len(sub(q, pen)) < len(sub(ring[m], pen)) ? i : m, 0); P = [...ring.slice(b), ...ring.slice(0, b), ring[b]]; }
      out.push({ kind: 'row', pts: P }); pen = P.at(-1);
    }
    const rest = G.filter(L => !L.closed);
    while (rest.length) {
      let bi = 0, flip = false;
      if (pen) rest.forEach((L, i) => { for (const [q, f] of [[L.P[0], false], [L.P.at(-1), true]]) { const d = len(sub(q, pen)), b = rest[bi], db = len(sub(flip ? b.P.at(-1) : b.P[0], pen)); if (d < db - 1e-9) { bi = i; flip = f; } } });
      const L = rest.splice(bi, 1)[0], P = flip ? L.P.slice().reverse() : L.P;
      out.push({ kind: 'row', pts: P }); pen = P.at(-1);
    }
  }
  const rays = kept.filter(e => e.kind === RAY), byRect = new Map();
  for (const e of rays) { const r = regions[e.reg].rect; (byRect.get(r) ?? byRect.set(r, []).get(r)).push(e); }
  for (const r of [...byRect.keys()].sort((a, b) => a - b)) {
    const es = byRect.get(r), c = centreOf(regions[es[0].reg]), th = L => turnAt(c, mul(add(L[0], L.at(-1)), 0.5), cw);
    const rs = chainsOf(es, RAY_TURN).sort((x, y) => th(x) - th(y));
    for (const L of rs) { const pen = out.at(-1)?.pts.at(-1) ?? L[0]; out.push({ kind: 'ray', pts: len(sub(L.at(-1), pen)) < len(sub(L[0], pen)) ? L.slice().reverse() : L }); }   // from its end nearer the pencil
  }
  return out;
}
// DRAG, a colour's strokes (the owner, 2026-10-29): the brush along the
// middles of its rows — a figure's keys in turn, the blocks round from 12
// o'clock, every block's from its outer edge in, every stroke the way round —
// a stroke the cells of its colour one after another along a row, never
// through a cell of another colour or a ray's, on to where it covers their
// ends; then its rays, along their strips, from the outside in, side by side
// where wider than the brush. Every stroke rubbed.
// → [{ pencil, strokes: [pieces], rows, rays, cells, mm, rubs }] in the order given
export function dragsOf(cells, regions, order, o = {}) {
  const pitch = o.pitch ?? PITCH_NEW, cw = o.cw !== false, rubs = Math.max(1, Math.round(o.rubs ?? DRAG_RUBS_NEW)), W = o.stripW ?? SAUSAGE_W, near = (a, b) => len(sub(a, b)) < 1e-3;
  const rows = new Map(), strips = new Map(), orders = regions.map(R => blockOrder(R, cw));
  cells.forEach((c, i) => {
    if (!c.pencil) return;
    if (c.ray >= 0) { (strips.get(c.ray) ?? strips.set(c.ray, []).get(c.ray)).push(i); return; }
    const R = regions[c.reg], id = rowId(R, c.blk, c.row);
    (rows.get(id) ?? rows.set(id, { reg: c.reg, list: [], rank: [keyOfRow(id), orders[c.reg][c.blk], c.row] }).get(id)).list.push(i);
  });
  const rowIds = [...rows.keys()].sort((x, y) => { const a = rows.get(x).rank, b = rows.get(y).rank; return a[0] - b[0] || a[1] - b[1] || a[2] - b[2]; }), passes = [];
  for (const pc of order) {
    const strokes = [];
    let nr = 0, ny = 0, nc = 0;
    for (const id of rowIds) {
      const { reg, list } = rows.get(id), c = centreOf(regions[reg]), runs = [];
      let cur = null;
      list.slice().sort((a, b) => seqAlong(cells[a]) - seqAlong(cells[b])).forEach(i => {
        const C = cells[i];
        if (C.pencil !== pc) { cur = null; return; }
        nc++;
        if (cur && near(cur.pts.at(-1), C.mid[0])) { cur.pts.push(...C.mid.slice(1)); cur.e1 = C.ends[1]; } else runs.push(cur = { pts: C.mid.slice(), e0: C.ends[0], e1: C.ends[1] });   // FORM's round cells: a middle of many points
      });
      for (const r of runs) {
        const t = turned(r.pts, c, cw), back = t[0] !== r.pts[0] && len(sub(t[0], r.pts[0])) > 1e-9;
        strokes.push(rubbed(piecesOf(covering(t, back ? r.e1 : r.e0, back ? r.e0 : r.e1)), rubs)); nr++;
      }
    }
    const rayRuns = [];
    for (const [sid, list] of strips) {
      const seq = list.slice().sort((a, b) => cells[a].row - cells[b].row), c = centreOf(regions[cells[seq[0]].reg]);
      let cur = null;
      seq.forEach(i => {
        const C = cells[i];
        if (C.pencil !== pc) { cur = null; return; }
        nc++;
        if (cur && near(cur.pts.at(-1), C.across[0])) { cur.pts.push(C.across[1]); cur.e1 = C.acrossEnds[1]; } else rayRuns.push(cur = { pts: C.across.slice(), e0: C.acrossEnds[0], e1: C.acrossEnds[1], nrm: C.nrm, c, sid });
      });
    }
    rayRuns.sort((x, y) => turnAt(x.c, x.pts[0], cw) - turnAt(y.c, y.pts[0], cw));
    for (const r of rayRuns) {
      const k = Math.max(1, Math.ceil(W / (pitch * FIT) - 1e-9));                     // side by side, every pass within FIT of the brush
      for (let j = 0; j < k; j++) {
        const d = (j - (k - 1) / 2) * W / k, pts = covering(r.pts.map(q => add(q, mul(r.nrm, d))), r.e0, r.e1);
        strokes.push(rubbed(piecesOf(j % 2 ? pts.slice().reverse() : pts), rubs)); ny++;
      }
    }
    if (!strokes.length) continue;
    passes.push({ pencil: pc.id ?? pc, strokes, rows: nr, rays: ny, cells: nc, rubs, mm: strokes.reduce((a, s) => a + s.reduce((b, g) => b + len(sub(g.b, g.a)), 0), 0) });
  }
  return passes;
}
// a side cell's place along its side, anticlockwise: the bottom left to right, the right up, the top right to left, the left down; a facet's one cell a row;
// FORM's its own, seq, along its side's line (formplan.js)
const seqAlong = C => { if (C.seq !== undefined) return C.seq; const m = C.mid[0]; return C.p % 2 ? 0 : [m[0], m[1], -m[0], -m[1]][C.p / 2]; };
// The plan: o { pencils (the colours), order (the run's, ids), frame, merge,
// pitch, stripW, minW, facets, cw, rubs } → { regions, cells (every one its
// colour), lines (DRAW BW's, once each), drags (DRAG's, a colour each, in the
// order), few: the colours with next to nothing to paint, their cells to the
// nearest of the rest; modules: the lines as opmPlan's, for FRAME's and DRAW
// BW's pencil }
export function opmpPlan(rects, res, o = {}) {
  const pencils = o.pencils ?? cleanPencils(PRISMA_PENCILS), F = o.frame, { regions, cells: all } = blockCellsOf(rects, o);
  const inF = P => { if (!F) return true; const c = P.reduce((a, p) => add(a, mul(p, 1 / P.length)), [0, 0]); return c[0] >= F.x0 && c[0] <= F.x1 && c[1] >= F.y0 && c[1] <= F.y1; };
  const cells = all.filter(c => inF(c.poly)).map(c => ({ ...c, lin: meanIn(res, c.poly) })), find = sliversOf(cells, () => o.minW ?? MIN_W);
  const glin = new Map();                                                                  // a group's light, its parts' by their areas
  cells.forEach((c, i) => { if (!c.lin) return; const r = find(i), g = glin.get(r) ?? glin.set(r, { a: 0, v: [0, 0, 0] }).get(r); g.a += c.area; c.lin.forEach((v, m) => { g.v[m] += v * c.area; }); });
  const once = ps => {
    const near = nearestOf(ps, -Infinity), gp = new Map([...glin].map(([r, g]) => [r, near(g.v.map(v => v / g.a))]));
    const mine = cells.map((c, i) => ({ ...c, group: find(i), pencil: gp.get(find(i)) ?? null }));
    const ids = (o.order ?? ps.filter(p => p.on !== false).map(p => p.id)).filter(id => mine.some(c => c.pencil === id));
    const lines = linesOf(mine, regions, o), drags = dragsOf(mine, regions, ids, o);
    const modules = lines.map(L => { const pieces = piecesOf(L.pts); return { kind: 'cell', line: L.kind, pencil: null, pieces, mm: pieces.reduce((s, g) => s + pieceLenOf(g), 0) }; });
    return { regions, cells: mine, lines, drags, modules, areas: [], lost: 0 };
  };
  const D = once(pencils), total = D.drags.reduce((a, q) => a + q.mm, 0);
  const least = Math.min(o.least ?? LEAST_MM, LEAST_SHARE * total), few = D.drags.filter(q => q.mm < least).map(q => q.pencil);
  if (!few.length) return { ...D, few, rings: [], rays: [] };
  return { ...once(pencils.map(p => few.includes(p.id) ? { ...p, on: false } : p)), few, rings: [], rays: [] };
}
// DRAG's rows for strokes.js's plotRun, machine mm from Here: a colour a row,
// its strokes one after another, already rubbed, the brush up on the move
// from the end of one to the start of the next (a turn: up through it, down
// to land); between two rows the run's pause, to wipe the brush and squeeze
// the next colour. info: a row's colour, for the LCD and its swatch
export function dragRowsOf(passes, pencils, o) {
  const ps = [], info = [], byId = Object.fromEntries(pencils.map(p => [p.id, p]));
  let lifts = 0;
  passes.forEach((P, k) => {
    const row = k + 1, path = [];
    P.strokes.forEach((s, j) => { if (j) { path.push({ t: 'L', a: path.at(-1).b, b: s[0].a, turn: true }); lifts++; } path.push(...s); });
    ps.push(path.map(g => ({ ...machinePiece(g, o), tilt: 0, row, ...(g.turn ? { turn: true } : {}) })));
    info.push({ label: `${row}/${passes.length} · ${byId[P.pencil]?.name ?? P.pencil}`, pencil: P.pencil, pass: k, L: P.mm });
  });
  return { ps, info, lifts };
}
