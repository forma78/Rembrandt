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
import { sausagesOf } from './inkaplan.js';
import { SAUSAGE_W } from './ccdplan.js';
import { nearestOf, tOf, PRISMA_PENCILS } from './prismaplan.js';
import { toLin } from './color.js';

export const INSET = 0.7;          // mm, a contour in from its cell's edge: two neighbours' 1.4 apart (est.)
export const ROUND = 1.5;          // mm, a contour's corner rounded at most so much (est.)
const ARC_MM = 2;                  // mm, a corner's arc a point every so far
const KINK = 10 * Math.PI / 180;   // a turn under 10° no corner: the carriage goes through it (strokes.js's KINK)
const CUT_EPS = 0.3;               // mm: two cuts closer, one
const SAMPLE = 1;                  // mm, the Preview read in a cell on a grid so fine
export const MIN_ROW = 2.5;        // mm, a row of cells across a band so thick at least: a narrow side's loops together (est.)
export const MIN_W = 1.2;          // mm, a cell thinner (twice its area over its outline) goes in with its neighbour once: a sliver between two cuts
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
function meanIn(res, P) {
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
// the sausages' strips on every side: { 'reg:p': [{ a, u, n, t0, t1 }] }, t0 … t1 the bands they cross
function stripsOf(rects, regions) {
  const out = {};
  for (const q of sausagesOf(rects.map(r => ({ ...r, ss: r.ss ?? [] })))) {
    const v = sub(q.b, q.a), L = len(v); if (L < 0.5) continue;
    const u = unit(v), mid = mul(add(q.a, q.b), 0.5);
    const reg = regions.findIndex(R => R.rect === q.ri && (R.kind === 'core') === !!q.core && (R.kind !== 'blend' || (t => t >= 0 && t <= 1)(tOf(R, mid[0], mid[1]))));
    if (reg < 0) continue;
    const R = regions[reg], p = sideOf(R, mid); if (p < 0) continue;
    const ts = [q.a, q.b].map(e => { const t = tOf(R, e[0], e[1]); return t === 2 ? 1 : Math.max(0, Math.min(1, t)); });
    (out[`${reg}:${p}`] ??= []).push({ a: q.a, u, n: left(u), t0: Math.min(...ts), t1: Math.max(...ts) });
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
  const arc = (s, p) => { const n = Math.max(2, Math.ceil(pieceLength(s, p) / ARC_MM)); return Array.from({ length: n + 1 }, (_, i) => pointOn(s, p, i / n)); };
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
  const by = new Map(); cells.forEach((c, i) => { const r = find(i); (by.get(r) ?? by.set(r, []).get(r)).push(i); });
  const out = [];
  for (const list of by.values()) {
    if (list.length === 1) { out.push(cells[list[0]]); continue; }
    const [L] = loopsOf(list.map(i => ({ ...cells[i], pencil: 1 })), true).flatMap(A => A.loops).sort((a, b) => Math.abs(areaOf(b)) - Math.abs(areaOf(a)));
    if (L) out.push({ ...cells[list[0]], poly: L, area: areaOf(L), parts: list.length });
  }
  return out;
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
// o: { pencils, corner, frame, merge, inset, round, minRow, stripW, minW, rim } → { regions, cells (every
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
// its corners as they are, a closed stroke. → modules as opmPlan's, o.pencil
// theirs
export function outerOf(rects, o = {}) {
  return regionsOf(rects, o).filter(R => R.key === 0).map(R => {
    const pieces = [0, 1, 2, 3, 4, 5, 6, 7].map(p => lineOn(R.a, p, 0, 1)).filter(g => pieceLenOf(g) > 1e-6);
    return { kind: 'cell', pencil: o.pencil ?? null, pieces, mm: pieces.reduce((s, g) => s + pieceLenOf(g), 0) };
  }).filter(M => M.pieces.length >= 2);
}
// DRAW BW, "without a change of pencils, at once": every contour in one
// pencil, the one in the box that shows best on the ground, its lightness
// the farthest from the ground's — on the white the darkest, on black the
// lightest (the owner, 2026-10-28: "on a black background"); FRAME's too
export const boldestOf = (pencils, ground = '#FBFAF7') => { const L = lightnessOf(ground), far = p => Math.abs(lightnessOf(p.hex) - L); return pencils.filter(p => p.on !== false).reduce((a, p) => !a || far(p) > far(a) ? p : a, null); };
