// ALU's plan: pipes of paint, each a wide band along a line drawn on the tab
// (ALU-Claude/ALU.md; the prototype of Claude in chat, ALU-Claude/Rembrandt ·
// ALU.html — its logic ported, not called). A pipe is brushed in one of two
// modes, named by the owner on 2026-10-08:
//
// - Whole lanes, Master Flo (a new pipe's default, and New composition's
//   only one): every lane the whole pipe in one run, the inside lane first,
//   a lift after each — or, the snake, back and forth with the brush down
//   (the owner, 2026-10-10; snakeOf) — the owner's paper test of 2026-10-08,
//   ALU-Claude/paper-test/, "repeating the brush's way with absolute
//   precision": where a pipe crosses itself, one lane per step. Every mark
//   right across the whole pipe, one paint: the paints along the pipe,
//   never across it (the owner, 2026-10-08, ALU-Claude/paper-test/
//   02_marks_black_white.jpg: "the lines always across the whole sausage,
//   they make no gradient at once"; the paints across are Alu's).
// - Segments, Alu (formerly "Segments, Lett"): cut by seams, each segment
//   brushed along the line — its paints across the pipe, Lett's tubes, "the
//   Australian style" — or across it; fan ends.
//
// The passes are TYPE's: TRACE, the pipes' outlines in watercolour from the
// cup; MARKS, a mark across the pipe where each paint goes, from lane 1 to
// lane n, no ticks since 2026-10-11; DRAG, the dry brush through it. Result
// mixes the paint as pigment, the brush not washed between lanes, wet paint
// loaded into it where a lane passes over it.
//
// The panel is the canvas from home (canvas.js). Its mm here as in the
// prototype and its files: origin top left, x right, y down; the runs for the
// machine from the panel's centre (toMachine). Lines and arcs only
// (Rembrandt.md §1): the spine is lines and corners rounded by arcs, so every
// lane offset from it is lines and arcs too, and fitPieces gives them back as
// such. No DOM.

import { rng } from './util.js';
import { fitPieces, toMachine, LOOP_SHARE, DIP_RUN, dipParts } from './band.js';
import { pieceLen } from './strokes.js';

// ---------- the tubes ----------
// The prototype's, by eye: [key, name, colour]. FAMILIES: three paints a
// pipe's tube is made of; the last four after Belem Lett's works of 2021 the
// owner showed (Sunsets From My Window, Drainage, Burnouts in Blue, Burnouts).
export const TUBES = [['white', 'Titanium white', '#F4F2EE'], ['ice', 'Pale blue', '#BFE3EC'], ['lilac', 'Lilac', '#B9A6D9'], ['violet', 'Violet', '#6A3FA0'],
  ['pink', 'Fluo pink', '#FF4FA0'], ['rose', 'Pink', '#F2A3C0'], ['magenta', 'Magenta', '#D0207A'], ['red', 'Red', '#E0242E'],
  ['orange', 'Fluo orange', '#FF6A1F'], ['yellow', 'Yellow', '#FFD23A'], ['acid', 'Acid green', '#C8F03C'], ['green', 'Green', '#2E9E5A'],
  ['teal', 'Teal', '#1E9AA8'], ['blue', 'Ultramarine', '#2A3FB8'], ['navy', 'Navy', '#16205A'], ['maroon', 'Maroon', '#6E1424'], ['black', 'Black', '#151515']];
export const FAMILIES = [['navy', 'blue', 'ice'], ['maroon', 'red', 'rose'], ['violet', 'magenta', 'pink'], ['black', 'teal', 'ice'], ['orange', 'pink', 'white'],
  ['green', 'acid', 'yellow'], ['navy', 'violet', 'lilac'], ['red', 'orange', 'yellow'], ['teal', 'green', 'acid'], ['magenta', 'pink', 'lilac'],
  ['black', 'navy', 'blue'], ['maroon', 'violet', 'lilac'], ['navy', 'teal', 'ice'], ['maroon', 'magenta', 'rose'],
  ['pink', 'yellow', 'ice'], ['red', 'maroon', 'acid'], ['navy', 'pink', 'ice'], ['rose', 'magenta', 'navy']];
// SMKN's: the paints in stock, the owner's brand Soumkine's palette (the
// owner, 2026-10-08, ALU-Claude/Screenshot 2026-10-08 at 3.12.15 PM.png and
// 3.12.23 PM.png: "a real palette with the colours we have now in stock …
// it is the palette of my brand Soumkine, so the colours are unusual").
// Sennelier Abstract, 120 ml and 500 ml; Lukas Cryl Terzia; Pébéo Studio
// Acrylics. The colours est.: read off the photographs, the light ones put
// right by the white wall behind them, the strong ones as they are; the
// iridescent two as their colour, their shine not drawn.
export const SMKN_TUBES = [['sa116', '116 Titanium White · Sennelier Abstract', '#F3F2EC'], ['sa029', '029 Iridescent Silver · Sennelier Abstract', '#C6C8BE'],
  ['sa250', '250 Light Rose Ochre · Sennelier Abstract', '#F3D7A6'], ['sa543', '543 Cadmium Yellow Deep Hue · Sennelier Abstract', '#FBA400'],
  ['sa640', '640 Saturn Orange · Sennelier Abstract', '#FE8000'], ['sa208', '208 Raw Sienna · Sennelier Abstract', '#C47A55'],
  ['sa645', '645 Chinese Orange · Sennelier Abstract', '#6E2C1C'], ['sa613', '613 Cadmium Red Light Hue · Sennelier Abstract', '#E01B33'],
  ['sa686', '686 Primary Red · Sennelier Abstract', '#D02848'], ['pbazo', 'Azo Pink, transparent · Pébéo Studio Acrylics', '#D6377E'],
  ['sa921', '921 Light Violet · Sennelier Abstract', '#8790DC'], ['sa323', '323 Cerulean Blue Hue · Sennelier Abstract', '#0B66AC'],
  ['sa070', '070 Iridescent Black · Sennelier Abstract', '#3C3E3E'], ['lk4982', '4982 Ivory Black · Lukas Cryl Terzia', '#1D1C1B']];
// three paints a pipe's tube is made of, dark to light (Claude's choice, by eye)
export const SMKN_FAMILIES = [['sa323', 'sa921', 'sa116'], ['sa645', 'sa640', 'sa543'], ['sa686', 'sa613', 'sa250'], ['lk4982', 'sa070', 'sa029'], ['sa645', 'sa208', 'sa250'],
  ['sa323', 'sa029', 'sa116'], ['sa686', 'pbazo', 'sa250'], ['sa921', 'pbazo', 'sa116'], ['lk4982', 'sa323', 'sa921'], ['sa070', 'sa613', 'sa640'],
  ['sa208', 'sa543', 'sa116'], ['lk4982', 'sa645', 'sa543'], ['sa323', 'sa921', 'pbazo'], ['sa070', 'sa029', 'sa250']];
// A palette: its tubes, its families, the plain pipes now and then (solo),
// its black and its white (the paper test's). ALU's the prototype's.
export const PALETTES = {
  alu: { tubes: TUBES, families: FAMILIES, solo: [['black'], ['navy', 'black']], black: 'black', white: 'white' },
  smkn: { tubes: SMKN_TUBES, families: SMKN_FAMILIES, solo: [['lk4982'], ['sa070', 'lk4982']], black: 'lk4982', white: 'sa116' },
};
// every tube of every palette by its key: their keys never meet
export const HEX = Object.fromEntries(Object.values(PALETTES).flatMap(q => q.tubes.map(([k, , h]) => [k, h])));
export const NAME = Object.fromEntries(Object.values(PALETTES).flatMap(q => q.tubes.map(([k, n]) => [k, n])));
export const M = 60;   // mm round the panel where a pipe's points may lie, so it comes in over an edge

// ---------- helpers ----------
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], add = (a, b) => [a[0] + b[0], a[1] + b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1], crs = (a, b) => a[0] * b[1] - a[1] * b[0], len = a => Math.hypot(a[0], a[1]);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]), lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const norm = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; }, perp = a => [-a[1], a[0]];
export const cumOf = P => { const c = [0]; for (let i = 1; i < P.length; i++) c.push(c[i - 1] + dist(P[i], P[i - 1])); return c; };
export const lengthOf = P => { let l = 0; for (let i = 1; i < P.length; i++) l += dist(P[i], P[i - 1]); return l; };
function segDist(p, a, b) { const ab = sub(b, a), l2 = dot(ab, ab); let t = l2 ? dot(sub(p, a), ab) / l2 : 0; t = Math.max(0, Math.min(1, t)); return dist(p, add(a, mul(ab, t))); }
export function rdp(P, eps) {
  if (P.length < 3) return P; const keep = new Uint8Array(P.length); keep[0] = keep[P.length - 1] = 1; const st = [[0, P.length - 1]];
  while (st.length) { const [a, b] = st.pop(); let md = 0, mi = -1; for (let i = a + 1; i < b; i++) { const d = segDist(P[i], P[a], P[b]); if (d > md) { md = d; mi = i; } } if (md > eps) { keep[mi] = 1; st.push([a, mi], [mi, b]); } }
  return P.filter((_, i) => keep[i]);
}
function lb(a, b, R) {   // Liang–Barsky: the part of a → b inside R = [x0, y0, x1, y1], as [t0, t1]
  let t0 = 0, t1 = 1; const dx = b[0] - a[0], dy = b[1] - a[1], p = [-dx, dx, -dy, dy], q = [a[0] - R[0], R[2] - a[0], a[1] - R[1], R[3] - a[1]];
  for (let k = 0; k < 4; k++) { if (p[k] === 0) { if (q[k] < 0) return null; continue; } const r = q[k] / p[k]; if (p[k] < 0) { if (r > t1) return null; if (r > t0) t0 = r; } else { if (r < t0) return null; if (r < t1) t1 = r; } }
  return t1 - t0 > 1e-9 ? [t0, t1] : null;
}
// an open polyline cut to R → its pieces inside; a point's lane, if it has one, goes with it
export function clipOpen(P, R) {
  const out = []; let cur = null;
  const at = (a, b, t) => { const q = lerp(a, b, t); if (b.length > 2) q.push(b[2], b[3]); return q; };
  for (let i = 0; i < P.length - 1; i++) {
    const a = P[i], b = P[i + 1], c = lb(a, b, R);
    if (!c) { if (cur) { out.push(cur); cur = null; } continue; }
    if (!cur || c[0] > 1e-9) { if (cur) out.push(cur); cur = [at(a, b, c[0])]; }
    cur.push(at(a, b, c[1]));
    if (c[1] < 1 - 1e-9) { out.push(cur); cur = null; }
  }
  if (cur) out.push(cur);
  return out.filter(r => lengthOf(r) > 1);
}

// ---------- the spine: the points, the corners rounded by arcs ----------
// → { P points about every mm, T tangents, N normals (to the right of the
// way), s arc length, R the signed radius there (Infinity on a line), L,
// tight: corners rounder than half the pipe, turn: the pipe's whole signed
// turning — its sign the side of N the pipe turns to }. A corner is rounded
// by min(Corners × the shorter half-leg, Largest corner radius × tan(θ/2))
// as its tangent length; at the pipe's first and last corner the whole leg.
export function spineOf(st) {
  const V = st.pts; if (!V || V.length < 2) return null;
  const n = V.length, Ls = [], U = [];
  for (let i = 0; i < n - 1; i++) { const d = sub(V[i + 1], V[i]), l = len(d); Ls.push(l); U.push(l > 1e-9 ? mul(d, 1 / l) : (U.at(-1) || [1, 0])); }
  const out = { P: [], T: [], N: [], s: [], R: [], tight: 0, turn: 0 };
  const push = (p, t, r) => { if (out.P.length) { const d = dist(p, out.P.at(-1)); if (d < 1e-6) return; out.s.push(out.s.at(-1) + d); } else out.s.push(0); out.P.push(p); out.T.push(t); out.N.push(perp(t)); out.R.push(r); };
  const line = (a, b, t) => { const l = dist(a, b), k = Math.max(1, Math.ceil(l)); for (let j = out.P.length ? 1 : 0; j <= k; j++) push(lerp(a, b, j / k), t, Infinity); };
  let cur = V[0];
  for (let i = 1; i < n - 1; i++) {
    const u = U[i - 1], v = U[i], th = Math.acos(Math.max(-1, Math.min(1, dot(u, v))));
    if (th < 1e-3) continue;
    const tin = i === 1 ? Ls[0] : Ls[i - 1] / 2, tout = i === n - 2 ? Ls[n - 2] : Ls[i] / 2;
    const t = Math.min(st.round * Math.min(tin, tout), st.rad ? st.rad * Math.tan(th / 2) : Infinity), R = t / Math.tan(th / 2), sg = Math.sign(crs(u, v)) || 1;
    out.turn += sg * th;
    if (R < 0.5) { line(cur, V[i], u); cur = V[i]; continue; }
    if (R < st.w / 2 - 0.5) out.tight++;
    const Tin = sub(V[i], mul(u, t)), C = add(Tin, mul(perp(u), R * sg));
    line(cur, Tin, u);
    const a0 = Math.atan2(Tin[1] - C[1], Tin[0] - C[0]), k = Math.max(4, Math.ceil(R * th));
    for (let j = 1; j <= k; j++) { const a = a0 + sg * th * j / k, p = [C[0] + R * Math.cos(a), C[1] + R * Math.sin(a)]; push(p, [-Math.sin(a) * sg, Math.cos(a) * sg], R * sg); }
    cur = add(V[i], mul(v, t));
  }
  line(cur, V[n - 1], U[n - 2]);
  out.L = out.s.at(-1);
  return out.L > 2 ? out : null;
}
export function frameAt(sp, s) {
  s = Math.max(0, Math.min(sp.L, s));
  let lo = 0, hi = sp.s.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (sp.s[m] <= s) lo = m; else hi = m; }
  const d = sp.s[hi] - sp.s[lo], t = d > 0 ? (s - sp.s[lo]) / d : 0;
  return { p: lerp(sp.P[lo], sp.P[hi], t), T: sp.T[lo], N: sp.N[lo] };
}
// the line at offset d from the spine between a and b; where it would fold
// back (inside a tight corner) the points are dropped: the inner lanes pinch
export function offsetRange(sp, a, b, d) {
  const out = [], f0 = frameAt(sp, a); out.push(add(f0.p, mul(f0.N, d)));
  let last = out[0];
  for (let i = 0; i < sp.P.length; i++) {
    if (sp.s[i] <= a || sp.s[i] >= b) continue;
    const q = add(sp.P[i], mul(sp.N[i], d));
    if (dot(sub(q, last), sp.T[i]) <= 0.05) continue;
    out.push(q); last = q;
  }
  const f1 = frameAt(sp, b), e = add(f1.p, mul(f1.N, d)); if (dot(sub(e, last), f1.T) > 0.05 || out.length === 1) out.push(e);
  return out;
}
// a pipe's segments between its seams: { mode, stops, a, b, j, cutA, cutB }
// — cutA, cutB: a cut at its start, at its end (ALU-CUT, st.cutS)
const isCut = (st, s) => (st.cutS || []).some(c => Math.abs(c - s) < 1e-6);
export const segsOf = st => { const L = st.sp.L, cuts = [0, ...st.seams.map(f => f * L), L]; return st.segs.map((g, j) => ({ ...g, a: cuts[j], b: cuts[j + 1], j, cutA: isCut(st, cuts[j]), cutB: isCut(st, cuts[j + 1]) })); };
// ALU-CUT (the owner, 2026-10-11; ALU-cut-Claude/): a pipe's parts between its
// cuts, each painted on its own, a clean brush and its own paints, the brush
// stopping at a cut: [{ a, b, k, cutA, cutB }]. No cuts: the pipe one part.
export function partsOf(st) {
  const L = st.sp.L, at = [0, ...(st.cutS || []), L];
  return at.slice(0, -1).map((a, k) => ({ a, b: at[k + 1], k, cutA: k > 0, cutB: k < at.length - 2 }));
}
const partAt = (st, s) => Math.max(0, partsOf(st).findIndex(q => s >= q.a - 1e-6 && s <= q.b + 1e-6));
// Where the lane at offset d clears a cut at s0 by r, the half brush, so the
// brush's edge lies on the cut's line and never past it (ALU-cut-Claude/: "at
// a seam the brush's edge never crosses it"): the first s from s0 the way dir
// (+1 after the cut, −1 before it) whose lane point lies r from the cut's
// line, along the pipe's tangent there — on a bend too, the lanes at their own
// distances along the spine.
export function clearOf(sp, s0, d, r, dir) {
  const f0 = frameAt(sp, s0), gone = s => { const f = frameAt(sp, s); return dir * dot(sub(add(f.p, mul(f.N, d)), f0.p), f0.T); };
  let s1 = s0, g1 = gone(s0);
  for (let s = s0 + dir * 0.25; dir > 0 ? s <= sp.L : s >= 0; s += dir * 0.25) {
    const g2 = gone(s);
    if (g2 >= r) return g2 - g1 > 1e-9 ? s1 + (s - s1) * (r - g1) / (g2 - g1) + dir * 1e-6 : s;
    s1 = s; g1 = g2;
  }
  return dir > 0 ? sp.L : 0;
}
export const isLanes = st => st.brush === 'lanes';
export const handMarks = st => isLanes(st) && st.marks && st.marks.length > 0;
// the pipes as the plan takes them: each with its spine (null for fewer than
// two points), a segment for every stretch between its seams, and, with cuts
// (ALU-CUT), cutS: the mm along it of the seams that are cuts (st.cuts)
export function pipesOf(pipes, fill = FAMILIES[0], cuts = false) {
  return pipes.map(st => {
    const segs = st.segs.slice(0, st.seams.length + 1);
    while (segs.length < st.seams.length + 1) segs.push({ mode: 'along', stops: fill.slice() });
    const sp = spineOf(st), cutS = cuts && sp ? st.seams.map((f, i) => (st.cuts || [])[i] ? f * sp.L : null).filter(v => v !== null) : [];
    return { ...st, segs, sp, cutS };
  });
}

// ---------- New composition: pipes from a seed ----------
// The owner, 2026-10-08, after the earlier generator gave across strokes and
// fans: "take out the across ones, just stripes in parallel"; his references,
// Belem Lett 2021. Whole lanes only — Master Flo's, so a tube's paints a, b,
// c, b, a lie along the pipe, a mark right across in each (the owner,
// 2026-10-08: the paints across are Alu's, not Master Flo's) — no Across
// segments, no fan ends. Wide pipes on the 45° grid with tight corners and
// hairpins, each coming in over an edge of the panel and going out over one;
// a pipe that would lie too much on the ones before it is drawn again. A
// proposal to start from, never the painting. o: { cw, ch, brush, lanes }.
export function familiesOf(r, pal = PALETTES.alu) { const F = pal.families, out = []; while (out.length < 3) { const f = F[Math.floor(r() * F.length)]; if (!out.includes(f)) out.push(f); } return out; }
function family(r, fams = FAMILIES, pal = PALETTES.alu) {
  if (r() < 0.1) return (r() < 0.5 ? pal.solo[0] : pal.solo[1]).slice();
  let f = fams[Math.floor(r() * fams.length)].slice(); if (r() < 0.5) f.reverse();
  if (r() < 0.4) f = [f[0], f[1], f[2], f[1], f[0]];   // a tube: dark, colour, light, colour, dark
  return f;
}
export const lettFamily = (r, fams = FAMILIES) => { let f = fams[Math.floor(r() * fams.length)].slice(); if (r() < 0.5) f.reverse(); return r() < 0.65 ? [f[0], f[1], f[2], f[1], f[0]] : f; };
// New colours: the families picked again, the lines kept; a tube on a whole-lane pipe, its paints along it
export function recolour(pipes, seed, pal = PALETTES.alu) {
  const r = rng(seed), fams = familiesOf(r, pal);
  for (const st of pipes) st.segs = st.segs.map(g => ({ mode: g.mode, stops: isLanes(st) ? lettFamily(r, fams) : family(r, fams, pal) }));
  return pipes;
}
export function compose(seed, o) {
  const r = rng(seed), out = [], fams = familiesOf(r, o.pal), n = 3 + (r() < 0.35 ? 1 : 0);
  const wMax = Math.max(16, Math.round(o.brush + (o.lanes - 1) * o.brush * 0.92));   // the widest pipe the lanes cover without gaps
  const dir = a => [Math.cos(a * Math.PI / 4), Math.sin(a * Math.PI / 4)];
  const inPanel = (q, m) => q[0] >= m && q[0] <= o.cw - m && q[1] >= m && q[1] <= o.ch - m;
  let lim0 = 0.22;
  const tooClose = (sp, w) => {
    const P = sp.P.filter((_, i) => i % 4 === 0); if (!P.length) return true;
    if (P.filter(q => inPanel(q, 0)).length < 0.55 * P.length) return true;
    for (const p of out) { const lim = (w + p.w) / 2 * 0.85, Q = p.sp.P.filter((_, i) => i % 4 === 0); if (P.filter(q => Q.some(z => dist(q, z) < lim)).length > lim0 * P.length) return true; }
    return false;
  };
  // how much of the panel the pipes cover, on a 10 mm grid: more pipes past n until about 45 %, six at most.
  // A cell is covered with a pipe's point (every third) within half its width of the cell's centre, each point
  // marking the cells round it — the prototype's count, without asking every point of every pipe for every cell.
  const nx = Math.ceil((o.cw - 5) / 10), ny = Math.ceil((o.ch - 5) / 10);
  const cover = () => {
    const hit = new Uint8Array(nx * ny);
    for (const p of out) {
      const r = p.w / 2;
      p.sp.P.forEach((q, i) => {
        if (i % 3) return;
        for (let a = Math.max(0, Math.ceil((q[0] - r - 5) / 10)); a <= Math.min(nx - 1, Math.floor((q[0] + r - 5) / 10)); a++)
          for (let b = Math.max(0, Math.ceil((q[1] - r - 5) / 10)); b <= Math.min(ny - 1, Math.floor((q[1] + r - 5) / 10)); b++)
            if (!hit[a * ny + b] && dist(q, [5 + 10 * a, 5 + 10 * b]) < r) hit[a * ny + b] = 1;
      });
    }
    return hit.reduce((c, v) => c + v, 0) / (nx * ny);
  };
  for (let tries = 0; (out.length < n || (out.length < 6 && cover() < 0.45)) && tries < 120; tries++) {
    lim0 = 0.22 + 0.015 * Math.max(0, tries - 25);   // more of a crossing let through the longer it takes, so a composition always finishes
    const w = Math.round(wMax * (0.72 + 0.28 * r())), off = w / 2 + 12, side = Math.floor(r() * 4), u = 0.12 + 0.76 * r();
    let p, a;
    if (side === 0) { p = [-off, o.ch * u]; a = [0, 1, 7][Math.floor(r() * 3)]; }
    else if (side === 1) { p = [o.cw + off, o.ch * u]; a = [4, 3, 5][Math.floor(r() * 3)]; }
    else if (side === 2) { p = [o.cw * u, -off]; a = [2, 1, 3][Math.floor(r() * 3)]; }
    else { p = [o.cw * u, o.ch + off]; a = [6, 5, 7][Math.floor(r() * 3)]; }
    const pts = [p], legs = 2 + Math.floor(r() * 3);
    for (let j = 0; j < legs; j++) {
      let placed = false;
      for (let k = 0; k < 12 && !placed; k++) {
        const turn = j === 0 ? 0 : [2, -2, 2, -2, 1, -1, 3, -3, 4, 4][Math.floor(r() * 10)];
        if (turn === 4) {   // a hairpin: two right angles round a leg one width long, the pipe folding back beside itself (Lett's U)
          const sg = r() < 0.5 ? 1 : -1, q1 = add(pts.at(-1), mul(dir((a + 2 * sg + 8) % 8), w * 1.05)), b = (a + 4) % 8, q2 = add(q1, mul(dir(b), (0.2 + 0.3 * r()) * o.ch));
          if (!inPanel(q1, w * 0.6) || !inPanel(q2, w * 0.6)) continue;
          pts.push(q1, q2); a = b; placed = true; continue;
        }
        const b = (a + turn + 8) % 8, q = add(pts.at(-1), mul(dir(b), (0.18 + 0.32 * r()) * o.ch * (b % 2 ? 1.2 : 1)));
        if (!inPanel(q, w * 0.6)) continue;
        pts.push(q); a = b; placed = true;
      }
      if (!placed) break;
    }
    if (pts.length < 2) continue;
    let best = null;   // out over the nearest edge the pipe can reach without turning back
    for (const turn of [0, 2, -2, 1, -1]) {
      const b = (a + turn + 8) % 8, v = dir(b); let t = 0;
      while (t < 3000 && inPanel(add(pts.at(-1), mul(v, t)), -off)) t += 2;
      if (!best || t < best.t * (0.7 + 0.6 * r())) best = { b, t };
    }
    pts.push(add(pts.at(-1), mul(dir(best.b), best.t)));
    const st = { pts, w, round: 1, rad: Math.round(w * (0.55 + 0.45 * r())), capA: 'flat', capB: 'flat', seams: [], segs: [], brush: 'lanes', first: 'in', marks: [] };
    st.sp = spineOf(st); if (!st.sp || tooClose(st.sp, w)) continue;
    // the colours change along a pipe once or twice at most, and stay in the family: the tube turned inside out, or a new paint in its middle
    if (r() < 0.6) { let s0 = (0.3 + 0.25 * r()) * st.sp.L; while (s0 < st.sp.L - 120 && st.seams.length < 2) { st.seams.push(s0 / st.sp.L); s0 += 220 + r() * 200; } }
    st.segs = [{ mode: 'along', stops: lettFamily(r, fams) }];
    for (let k = 0; k < st.seams.length; k++) {
      const prev = st.segs.at(-1).stops, K = prev.length, mid = Math.floor(K / 2);
      let next;
      if (r() < 0.5 && K >= 3) next = K === 5 ? [prev[2], prev[1], prev[0], prev[1], prev[2]] : prev.slice().reverse();
      else { const f = fams[Math.floor(r() * fams.length)], c = f.find(x => !prev.includes(x)) || f[0]; next = prev.slice(); next[mid] = c; }
      st.segs.push({ mode: 'along', stops: next });
    }
    out.push(st);
  }
  return out.map(({ sp, ...st }) => st);
}
// A pipe drawn by hand: Whole lanes, inside first, a tube's paints along it
export const newPipe = (w, seed, pal = PALETTES.alu) => ({ pts: [], w, round: 0.8, capA: 'flat', capB: 'flat', seams: [], segs: [{ mode: 'along', stops: lettFamily(rng(seed), pal.families) }], brush: 'lanes', first: 'in', marks: [] });

// The owner's paper test, 2026-10-08, 1 : 1 on an A5 page (ALU-Claude/
// paper-test/): a band of eight lanes, 47 mm, a 6 mm brush, comes in from the
// left, turns up into a loop and comes down across itself. Black marks on the
// way in and at the turn, white round the loop and on the way down, at mm
// along the centre line read off the photographs (est.). Lanes 8 (inside) to
// 1 (outside), each the whole way, a lift after each: the snake off. In a
// palette's own black and white.
// → { cw, ch, settings, pipes }
export const PAPER_MARKS = [[5, 'black'], [30, 'black'], [88.8, 'black'], [123.3, 'white'], [157, 'white'], [193.8, 'white'], [216.2, 'white'], [266.6, 'white'], [329.1, 'white'], [354.1, 'white']];   // mm along the centre line, est.
export function paperTest(pal = PALETTES.alu) {
  const st = { pts: [[5, 126], [115, 126], [115, 40], [58, 40], [58, 197]], w: 47, round: 1, capA: 'flat', capB: 'flat', seams: [], segs: [{ mode: 'along', stops: [pal.black, pal.white] }], brush: 'lanes', first: 'in', marks: [] };
  const L = spineOf(st).L;
  st.marks = PAPER_MARKS.map(([at, paint]) => ({ f: at / L, paint: pal[paint] }));
  return { cw: 148, ch: 210, settings: { ground: 'paper', aorder: 'one', brush: 6, lanes: 8, spacing: 60, run: 70, dryTail: 180, overlap: 'wet', over: 3, look: 'relief', pick: 40, mix: 0.7 }, pipes: [st] };
}

// ---------- the plan: runs and marks ----------
// o: { cw, ch, brush, lanes, xstep, aorder ('snake' | 'one'), spacing, run
// (the dense run), overlap ('wet' | 'dry'), over (mm a run goes past the
// panel's edge) }
export const MARK_END = 2;         // mm: a mark this far inside each end of a segment, est.
export const EDGE_IN = 3;          // mm: a dash along an edge this far in, est.
export const RING_STROKES = 3;     // an Across segment's ring: so many strokes of one paint, est.
export const groupOf = (i, n, K) => Math.min(K - 1, Math.floor(i * K / n));
export const ringOf = (sg, s, o) => { const K = sg.stops.length; if (K < 2) return 0; const i = Math.floor(Math.max(0, s - sg.a) / (RING_STROKES * o.xstep)), per = 2 * K - 2, m = i % per; return m < K ? m : per - m; };
function markIndex() {
  const cell = 6, map = new Map();
  const cells = (a, b, fn) => { const x0 = Math.floor(Math.min(a[0], b[0]) / cell), x1 = Math.floor(Math.max(a[0], b[0]) / cell), y0 = Math.floor(Math.min(a[1], b[1]) / cell), y1 = Math.floor(Math.max(a[1], b[1]) / cell); for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) fn(x + ',' + y); };
  return {
    add(q, m = q) { for (let i = 1; i < q.pts.length; i++) { const e = { m, a: q.pts[i - 1], b: q.pts[i] }; cells(e.a, e.b, k => { let l = map.get(k); if (!l) map.set(k, l = []); l.push(e); }); } },
    query(a, b) { const out = new Set(); cells(a, b, k => { const l = map.get(k); if (l) for (const e of l) out.add(e); }); return out; },
  };
}
// a mark as the brush meets it: its ends out by r, the half brush — a lane 1
// or n on a mark's end takes up its paint, as the brush's edge does
const reach = (P, r) => { if (P.length < 2 || !(r > 0)) return P; const u = norm(sub(P[1], P[0])), v = norm(sub(P.at(-1), P.at(-2))); return [sub(P[0], mul(u, r)), ...P.slice(1, -1), add(P.at(-1), mul(v, r))]; };
export function crossT(a, b, c, d) {
  const r = sub(b, a), q = sub(d, c), den = crs(r, q); if (Math.abs(den) < 1e-12) return null;
  const ca = sub(c, a), t = crs(ca, q) / den, u = crs(ca, r) / den;
  return t >= 0 && t < 1 && u >= 0 && u <= 1 ? t : null;
}
function crossingsOf(P, cum, idx) {   // the marks a run crosses: [{ s mm along it, m }]
  const out = [];
  for (let i = 0; i < P.length - 1; i++) for (const e of idx.query(P[i], P[i + 1])) { const t = crossT(P[i], P[i + 1], e.a, e.b); if (t !== null) out.push({ s: cum[i] + t * (cum[i + 1] - cum[i]), m: e.m }); }
  out.sort((x, y) => x.s - y.s);
  return out.filter((c, i) => !out.slice(Math.max(0, i - 4), i).some(q => q.m === c.m && c.s - q.s < 2));
}
// where marks go across a stretch a..b: MARK_END in from both ends — at a cut
// its own, ea or eb (ALU-CUT's Marks from a cut) — and each time the longer of
// the two edge lanes has run 0.97 of the spacing, so the outer lane on a bend
// meets one at least every spacing
export function markStops(sp, a, b, e, spacing, ea = MARK_END, eb = MARK_END) {
  const span = b - a, at = [];
  if (span < ea + eb + MARK_END + 2) return [(a + b) / 2];
  let pa = null, pb = null, acc = 0; const lim = spacing * 0.97;
  at.push(a + ea);
  for (let s = a + ea; s <= b - eb; s += 0.5) {
    const f = frameAt(sp, s), A = add(f.p, mul(f.N, -e)), B = add(f.p, mul(f.N, e));
    if (pa) acc += Math.max(dist(A, pa), dist(B, pb));
    pa = A; pb = B;
    if (acc >= lim) { at.push(s); acc = 0; }
  }
  if (b - eb - at.at(-1) > 4) at.push(b - eb); else at[at.length - 1] = b - eb;
  return at;
}
// the paint a whole-lane pipe takes at s: the mark by hand last passed (the
// first one before any), or the segment's paints in turn along it
export function paintAt(st, s) {
  if (handMarks(st)) { const L = st.sp.L; let k = st.marks[0].paint; for (const m of st.marks) if (m.f * L <= s) k = m.paint; return k; }
  const g = segsOf(st).find(x => s >= x.a && s <= x.b) || segsOf(st).at(-1), K = g.stops.length;
  return g.stops[Math.min(K - 1, Math.max(0, Math.floor((s - g.a) / Math.max(1e-6, g.b - g.a) * K)))];
}
// Whole lanes, Master Flo's way: lane i of n at offset d(i), from −e to +e,
// e = W/2 − b/2. The inside is the side the pipe turns to on the whole. The
// owner's numbers: 1 the outside lane, n the inside one; inside first runs
// n … 1. → { e, pitch, d, num: lane → its number, order: lanes as they run }
export function lanesOf(st, o) {
  const sp = st.sp, e = Math.max(0, st.w / 2 - o.brush / 2), n = o.lanes, pitch = n > 1 ? 2 * e / (n - 1) : 0, sig = Math.sign(sp.turn) || 1;
  const d = i => n > 1 ? -e + i * pitch : 0, inward = i => d(i) * sig;
  const byIn = Array.from({ length: n }, (_, i) => i).sort((p, q) => inward(q) - inward(p));
  const num = {}; byIn.slice().reverse().forEach((i, r) => { num[i] = r + 1; });
  return { e, pitch, d, num, order: st.first === 'out' ? byIn.slice().reverse() : byIn };
}
// Master Flo's marks: every one right across the whole pipe, from lane 1 to
// lane n — DRAG's own lines, as TRACE's (the owner, 2026-10-11: "MARKS has the
// same trouble TRACE had: the strokes stick out, they do not meet DRAG's
// way"; before, edge to edge less 0.5 mm) — one paint — by hand, or every spacing from the segment's
// paints in turn along it (paintAt). Never cut into a dash a paint across
// the pipe: that is a gradient across, Lett's tubes, Alu's (the owner,
// 2026-10-08: "the lines always across the whole sausage, they make no
// gradient at once"; the prototype had laid them across, lay 'across').
// a run's points carry their lane and way: [x, y, lane, ±1]
// With the snake (o.aorder 'snake') every other lane runs back, the way
// reversed, so snakeOf can join it to the one before. With cuts (ALU-CUT) the
// lanes part by part, in the pipe's numbers and order, each lane clear of a
// cut by the half brush (clearOf), so lane k on one side goes on as lane k on
// the other.
function lanesPipeOf(st, si, o) {
  const sp = st.sp, W = st.w, { e, pitch, d, num, order } = lanesOf(st, o), runs = [], marks = [], half = Math.max(1, e), parts = partsOf(st), r = o.brush / 2;
  for (const q of parts) order.forEach((i, k) => {
    const sa = q.cutA ? clearOf(sp, q.a, d(i), r, 1) : q.a, sb = q.cutB ? clearOf(sp, q.b, d(i), r, -1) : q.b;
    if (sb - sa < 1) return;
    const back = o.aorder === 'snake' && k % 2 === 1, P = offsetRange(sp, sa, sb, d(i));
    runs.push({ si, j: 0, mode: 'lanes', pitch, lane: i, num: num[i], part: q.k, parts: parts.length, pts: (back ? P.reverse() : P).map(q2 => [q2[0], q2[1], i, back ? -1 : 1]) });
  });
  const across = (s, paint, kind) => { const f = frameAt(sp, s), j = Math.max(0, segsOf(st).findIndex(x => s >= x.a && s <= x.b)); marks.push({ si, j, mode: 'lanes', s, pts: [add(f.p, mul(f.N, -half)), add(f.p, mul(f.N, half))], paint, kind }); };
  if (handMarks(st)) for (const m of st.marks) across(m.f * sp.L, m.paint, 'hand');
  else for (const g of segsOf(st)) {
    if (g.b - g.a < 1) continue;
    for (const s of markStops(sp, g.a, g.b, e, o.spacing, g.cutA ? o.cutMark ?? MARK_END : MARK_END, g.cutB ? o.cutMark ?? MARK_END : MARK_END)) across(s, paintAt(st, s), 'across');
  }
  return { runs, marks, pitch, e, parts: parts.length };
}
// one pipe's brush runs and marks, before cutting to the panel
function pipeOf(st, si, o) {
  if (isLanes(st)) return lanesPipeOf(st, si, o);
  const sp = st.sp, W = st.w, b = o.brush, e = Math.max(0, W / 2 - b / 2), n = o.lanes, pitch = n > 1 ? 2 * e / (n - 1) : 0;
  const offs = Array.from({ length: n }, (_, i) => n > 1 ? -e + i * pitch : 0), runs = [], marks = [];
  const nParts = partsOf(st).length;
  for (const g of segsOf(st)) {
    const K = g.stops.length, base = { si, j: g.j, mode: g.mode, pitch, part: partAt(st, (g.a + g.b) / 2), parts: nParts };
    if (g.b - g.a < 1) continue;
    if (g.mode === 'along') {
      const lanes = offs.map(d => offsetRange(sp, g.cutA ? clearOf(sp, g.a, d, b / 2, 1) : g.a, g.cutB ? clearOf(sp, g.b, d, b / 2, -1) : g.b, d));
      if (o.aorder === 'snake') { const run = []; lanes.forEach((l, i) => { const dir = i % 2 ? -1 : 1; for (const q of dir < 0 ? l.slice().reverse() : l) run.push([q[0], q[1], i, dir]); }); runs.push({ ...base, pts: run, lanes: n }); }
      else lanes.forEach((l, i) => runs.push({ ...base, pts: l.map(q => [q[0], q[1], i, 1]), lanes: 1, lane: i }));
      for (const s of markStops(sp, g.a, g.b, e, o.spacing, g.cutA ? o.cutMark ?? MARK_END : MARK_END, g.cutB ? o.cutMark ?? MARK_END : MARK_END)) {   // marks across the pipe, a dash a paint, at both ends of the segment and every spacing between
        const f = frameAt(sp, s);
        for (let k = 0; k < K; k++) {
          const ids = offs.map((d, i) => i).filter(i => groupOf(i, n, K) === k); if (!ids.length) continue;
          const ee = Math.max(1, e), lo = Math.max(-ee, offs[ids[0]] - pitch / 2), hi = Math.min(ee, offs[ids.at(-1)] + pitch / 2);   // within lanes 1 … n (2026-10-11)
          marks.push({ ...base, s, pts: [add(f.p, mul(f.N, n > 1 ? lo : -ee)), add(f.p, mul(f.N, n > 1 ? hi : ee))], paint: g.stops[k], kind: 'across' });
        }
      }
    } else {
      // strokes over the pipe, back and forth, the next where either end has moved Step across: on a bend they fan out
      const strokes = [], a0 = g.a + Math.min(b / 2, (g.b - g.a) / 2), a1 = g.b - Math.min(b / 2, (g.b - g.a) / 2);
      let lastA = null, lastB = null;
      for (let s = a0; s <= a1 + 1e-6; s += 0.5) {
        const f = frameAt(sp, s), A = add(f.p, mul(f.N, -e)), B = add(f.p, mul(f.N, e));
        if (!lastA || Math.max(dist(A, lastA), dist(B, lastB)) >= o.xstep) { strokes.push([A, B, s]); lastA = A; lastB = B; }
      }
      if (!strokes.length) { const f = frameAt(sp, (g.a + g.b) / 2); strokes.push([add(f.p, mul(f.N, -e)), add(f.p, mul(f.N, e)), (g.a + g.b) / 2]); }
      const run = []; strokes.forEach(([A, B], k) => { if (k % 2) run.push(B, A); else run.push(A, B); });
      runs.push({ ...base, pts: run, strokes: strokes.length });
      // dashes along both edges, EDGE_IN inside the strokes' ends, the paints in turn along the segment, a ring each
      const rl = K > 1 ? RING_STROKES * o.xstep : g.b - g.a, sides = e > EDGE_IN + 1 ? [-(e - EDGE_IN), e - EDGE_IN] : [0];
      for (const off of sides) for (let sa = g.a; sa < g.b - 0.5; sa += rl) {
        const sb = Math.min(g.b, sa + rl);
        marks.push({ ...base, s: sa, pts: rdp(offsetRange(sp, sa, sb, off), 0.2), paint: g.stops[ringOf(g, (sa + sb) / 2, o)], kind: 'edge' });
      }
    }
  }
  // Fan ends: rays from the rim to b/4 from the end of the line, Step across apart at the rim, a lift each; a mark round the rim
  const fan = atEnd => {
    const g = segsOf(st)[atEnd ? st.segs.length - 1 : 0], f = frameAt(sp, atEnd ? sp.L : 0), out = atEnd ? f.T : mul(f.T, -1), K = g.stops.length;
    if (e < 2) return;
    const m = Math.max(3, Math.ceil(Math.PI * e / o.xstep) + 1), rIn = Math.min(e, b / 2) * 0.5;
    for (let k = 0; k < m; k++) {
      const ph = -Math.PI / 2 + Math.PI * k / (m - 1), d = add(mul(out, Math.cos(ph)), mul(f.N, Math.sin(ph)));
      runs.push({ si, j: g.j, mode: 'fan', part: atEnd ? nParts - 1 : 0, parts: nParts, pts: [add(f.p, mul(d, e)), add(f.p, mul(d, rIn))] });
    }
    const rr = Math.max(1, e - EDGE_IN);
    for (let k = 0; k < K; k++) {
      const arc = [], over = 0.12; for (let q = 0; q <= 24; q++) { const ph = -Math.PI / 2 - (k === 0 ? over * (1 - q / 24) : 0) + (k === K - 1 ? over * q / 24 : 0) + Math.PI * (k + q / 24) / K, d = add(mul(out, Math.cos(ph)), mul(f.N, Math.sin(ph))); arc.push(add(f.p, mul(d, rr))); }
      marks.push({ si, j: g.j, mode: 'fan', s: atEnd ? sp.L : 0, pts: arc, paint: g.stops[k], kind: 'rim' });
    }
  };
  if (st.capA === 'fan') fan(false);
  if (st.capB === 'fan') fan(true);
  return { runs, marks, pitch, e, parts: nParts };
}
// where a pipe runs off the panel: a dash along the edge, EDGE_IN in, over the
// stretch its lanes 1 … n cover (2026-10-11; the pipe's whole width before),
// in the paint the pipe has there
function edgeMarks(st, si, pipe, o) {
  const out = [], sp = st.sp, W = st.w, n = o.lanes, reachOf = Math.max(1, pipe.e);
  const sides = [['l', u => [EDGE_IN, u], o.ch], ['r', u => [o.cw - EDGE_IN, u], o.ch], ['t', u => [u, EDGE_IN], o.cw], ['b', u => [u, o.ch - EDGE_IN], o.cw]];
  const near = q => { let best = null; for (let i = 0; i < sp.P.length; i++) { const d = dist(q, sp.P[i]); if (d <= reachOf && (!best || d < best.d)) best = { d, i }; } return best; };
  const out1 = p => p[0] < 0 || p[0] > o.cw || p[1] < 0 || p[1] > o.ch;
  if (!sp.P.some(out1)) return out;
  const segs = segsOf(st);
  const nearSide = { l: p => p[0] < W / 2 + EDGE_IN, r: p => p[0] > o.cw - W / 2 - EDGE_IN, t: p => p[1] < W / 2 + EDGE_IN, b: p => p[1] > o.ch - W / 2 - EDGE_IN };
  for (const [side, at, Ls] of sides) {
    if (!sp.P.some(nearSide[side])) continue;
    let cur = null;
    const flush = () => { if (cur && cur.pts.length > 1 && lengthOf(cur.pts) > 3) out.push(cur); cur = null; };
    for (let u = 1; u <= Ls - 1; u += 1) {
      const q = at(u), h = near(q);
      if (!h) { flush(); continue; }
      const s = sp.s[h.i], g = segs.find(x => s >= x.a && s <= x.b) || segs.at(-1), K = g.stops.length;
      let paint;
      if (isLanes(st)) paint = paintAt(st, s);
      else if (g.mode === 'along') { const d = dot(sub(q, sp.P[h.i]), sp.N[h.i]), i = n > 1 ? Math.round((d + pipe.e) / pipe.pitch) : 0; paint = g.stops[groupOf(Math.max(0, Math.min(n - 1, i)), n, K)]; }
      else paint = g.stops[ringOf(g, s, o)];
      if (!cur || cur.paint !== paint || cur.j !== g.j) { flush(); cur = { si, j: g.j, mode: g.mode, s, pts: [], paint, kind: 'edge of panel' }; }
      cur.pts.push(q);
    }
    flush();
  }
  return out;
}
// where a pipe crosses itself: its stretches more than two widths apart along it whose centre lines cross → [[s0, s1, p]]
export function selfCrossings(sp, W) {
  const Q = []; for (let i = 0; i < sp.P.length; i += 3) Q.push([sp.P[i], sp.s[i]]); Q.push([sp.P.at(-1), sp.L]);
  const hits = [];
  for (let i = 0; i < Q.length - 1; i++) for (let j = i + 2; j < Q.length - 1; j++) {
    if (Q[j][1] - Q[i][1] < 2 * W || crossT(Q[i][0], Q[i + 1][0], Q[j][0], Q[j + 1][0]) === null) continue;
    if (!hits.some(h => Math.abs(h[0] - Q[i][1]) < W && Math.abs(h[1] - Q[j][1]) < W)) hits.push([Q[i][1], Q[j][1], Q[i][0]]);
  }
  return hits;
}
// Whole lanes as a snake (the owner, 2026-10-10: "I need a run as a snake,
// back and forth, the brush going non-stop, without flying back to the start
// through the air; this one is needed too — a switch"): a lane's end joined
// to the next lane's start, run back, by a step across with the brush down,
// where they lie within SNAKE_STEP pitches — across the pipe's flat end on
// the canvas, on the trace's line there; along the edge past it, where the
// lanes are cut — so a pipe is one run. Where a lane leaves the canvas and
// comes back, it lifts there as before. A joined run: nums its lanes' numbers
// in order, starts the index each begins at.
export const SNAKE_STEP = 3;   // pitches: farther apart, no step across, est.
export function snakeOf(runs, pitch) {
  const out = [];
  for (const r of runs) {
    const last = out.at(-1);
    if (last && pitch > 0 && last.si === r.si && last.part === r.part && dist(last.pts.at(-1), r.pts[0]) <= SNAKE_STEP * pitch + 0.5) {
      last.starts.push(last.pts.length); last.nums.push(r.num); last.pts = [...last.pts, ...r.pts]; last.lanes = last.nums.length;
    } else out.push({ ...r, nums: [r.num], starts: [0], lanes: 1 });
  }
  return out;
}
// → { pipes (with spines), sessions: [{ n, runs, marks }], nums: the paints
// in order of their marks, 1 the first — tight, dry,
// crossings }. A run: { si, j, mode, pitch, lane, num, pts, cum, cross },
// a snake's its nums and starts too (snakeOf);
// a mark: { si, j, mode, s, pts, paint, kind, session }.
export const OVERLAPS = ['wet', 'dry'];
export function planOf(pipesIn, o) {
  const R = [-o.over, -o.over, o.cw + o.over, o.ch + o.over], PAN = [1, 1, o.cw - 1, o.ch - 1];
  const all = pipesOf(pipesIn, o.pal?.families[0], !!o.cuts), pipes = [];
  all.forEach((st, si) => { if (st.sp) pipes.push({ st, si }); });
  // sessions: a pipe over an earlier one it touches goes a session later, unless wet on wet
  const ses = {};
  for (const { st, si } of pipes) {
    ses[si] = 1;
    if (o.overlap === 'dry') for (const q of pipes) {
      if (q.si >= si) break;
      const lim = (st.w + q.st.w) / 2; let hit = false;
      for (let i = 0; i < st.sp.P.length && !hit; i += 4) for (let j = 0; j < q.st.sp.P.length && !hit; j += 4) hit = dist(st.sp.P[i], q.st.sp.P[j]) < lim;
      if (hit) ses[si] = Math.max(ses[si], ses[q.si] + 1);
    }
  }
  const nSes = Math.max(1, ...Object.values(ses)), sessions = [];
  for (let n = 1; n <= nSes; n++) sessions.push({ n, runs: [], marks: [], idx: markIndex() });
  let tight = 0;
  for (const { st, si } of pipes) {
    const s = sessions[ses[si] - 1], pp = pipeOf(st, si, o); tight += st.sp.tight;
    for (const m of [...pp.marks, ...edgeMarks(st, si, pp, o)]) for (const piece of clipOpen(m.pts, PAN)) { const mk = { ...m, pts: piece, session: s.n }; s.marks.push(mk); s.idx.add({ ...mk, pts: reach(piece, o.brush / 2) }, mk); }
    const runs = pp.runs.flatMap(r => clipOpen(r.pts, R).map(piece => ({ ...r, pts: piece, session: s.n })));
    s.runs.push(...(isLanes(st) && o.aorder === 'snake' ? snakeOf(runs, pp.pitch) : runs));
  }
  const nums = [];
  for (const s of sessions) for (const m of s.marks) if (!nums.includes(m.paint)) nums.push(m.paint);
  let dry = 0;
  for (const s of sessions) for (const r of s.runs) {
    r.cum = cumOf(r.pts); r.cross = crossingsOf(r.pts, r.cum, s.idx);
    // a stretch on the panel longer than the dense run with no mark behind it
    let first = null;
    for (let i = 0; i < r.pts.length; i++) {
      const p = r.pts[i]; if (p[0] < 4 || p[0] > o.cw - 4 || p[1] < 4 || p[1] > o.ch - 4) continue;
      if (first === null) first = r.cum[i];
      const before = r.cross.filter(c => c.s <= r.cum[i]), ls = before.length ? before.at(-1).s : null;
      if (ls === null ? r.cum[i] - first > EDGE_IN + 8 : r.cum[i] - ls > o.run + 1) { dry++; r.dry = true; break; }
    }
  }
  for (const s of sessions) delete s.idx;
  const crossings = {}; for (const { st, si } of pipes) if (isLanes(st)) crossings[si] = selfCrossings(st.sp, st.w);
  return { pipes: all, sessions, nums, tight, dry, crossings };
}

// ---------- Result: the paint as it lies ----------
// RIBBON.md's measured step model for the brush running dry: solid over the
// dense run, then the dry tail. Paint mixes as pigment, not light: in linear
// light, geometrically (Kubelka–Munk in a line), so white lightens black step
// by step, and a dark paint, strong, takes over a light brush at once. The
// brush is not washed between the lanes of a whole-lane pipe; a new pipe, or
// a Segments segment, starts clean. Wet on wet: the panel is kept as a grid of
// the paint last laid, its run and session; a run passing over wet paint of
// another run, or of itself more than 30 mm back, loads it into the brush —
// 1 − e^(−l / pick) for l mm — and carries it on, so a lane comes out of a
// wet crossing in that colour and, where a pipe crosses itself, the lane
// painted later lies on top: one lane per step, as on the paper test. A lane
// leaves a track 0.4 of its pitch wide, laid behind the brush once it has
// moved on past it, so the lane beside it is not wet paint under it and the
// brush never hides the wet paint just ahead. Tuned on the paper test.
// With cuts (ALU-CUT) a part starts clean too, and a run taking up wet paint
// of another part, or of another pipe, is mud: one ⚠ names it (the owner,
// 2026-10-11, "yes, OK!") — no ban.
// o: { cw, ch, brush, lanes, xstep, run, tail (the dry tail), pick, mix, cuts }
// → { runs: [[{ a, b, col, alpha, thin, lane, bw, sh }] a run], length, at(p) → the run on top there, 1 the first, or 0, mud: [{ si, part, from: { si, part } }] }
export const SOLID = 0.9;          // the opacity of solid paint, est.
export const TRACK = 0.4;          // of a lane's pitch: the wet track it leaves, est.
export const OWN_BACK = 30;        // mm: a run's own paint further back than this counts as wet paint under it, est.
export const rgbOf = h => { const v = parseInt(h.slice(1), 16); return [v >> 16 & 255, v >> 8 & 255, v & 255]; };
export const mixRGB = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const toLin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const toSrgb = v => 255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
export const pmix = (a, b, t) => a.map((v, i) => toSrgb(Math.exp(Math.log(Math.max(0.003, toLin(v))) * (1 - t) + Math.log(Math.max(0.003, toLin(b[i]))) * t)));
export const strength = c => 0.5 + 2.5 * (1 - (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255);   // 0.5 white … 3 black, est.
const share = (f, add, into) => into ? f * strength(add) / (f * strength(add) + (1 - f) * strength(into)) : 1;
export function paintWalk(pl, o) {
  const all = [], GR_ = Math.min(o.cw, o.ch) < 300 ? 2 : 1, gx = Math.ceil((o.cw + 2 * M) * GR_), gy = Math.ceil((o.ch + 2 * M) * GR_), n = gx * gy;
  const GC = new Float32Array(n * 3), GR = new Int32Array(n).fill(-1), GS = new Float32Array(n), GE = new Int16Array(n);
  const cellOf = p => { const x = Math.floor((p[0] + M) * GR_), y = Math.floor((p[1] + M) * GR_); return x < 0 || y < 0 || x >= gx || y >= gy ? -1 : y * gx + x; };
  const stamp = (p, rad, rgb, run, at, ses) => {
    const cx = (p[0] + M) * GR_, cy = (p[1] + M) * GR_, rr = rad * GR_;
    for (let y = Math.max(0, Math.floor(cy - rr)); y <= Math.min(gy - 1, Math.floor(cy + rr)); y++) for (let x = Math.max(0, Math.floor(cx - rr)); x <= Math.min(gx - 1, Math.floor(cx + rr)); x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy; if (dx * dx + dy * dy > rr * rr) continue;
      const c = y * gx + x; GC[c * 3] = rgb[0]; GC[c * 3 + 1] = rgb[1]; GC[c * 3 + 2] = rgb[2]; GR[c] = run; GS[c] = at; GE[c] = ses;
    }
  };
  const bw = o.brush, nl = o.lanes, DRY = o.run + o.tail + 1;
  const laned = r => r.mode === 'along' || r.mode === 'lanes';
  const beadOf = (r, lane, dir) => {   // a bead as wide as its pitch, the two edge lanes out to the pipe's edge
    if (!laned(r) || lane === undefined) return { w: Math.min(o.xstep, bw) * 0.96, sh: 0 };
    if (nl < 2) return { w: bw, sh: 0 };
    const p = r.pitch || bw, inner = Math.min(p, bw) * 0.96;
    if ((lane === 0 || lane === nl - 1) && bw > inner) return { w: inner / 2 + bw / 2, sh: (lane === 0 ? -1 : 1) * dir * (bw - inner) / 4 };
    return { w: inner, sh: 0 };
  };
  let runId = 0, col = null, load = DRY, pipe = null, part = null, length = 0;
  const keyOf = [null], mud = new Map();
  for (const s of pl.sessions) for (const r of s.runs) {
    runId++; keyOf[runId] = { si: r.si, part: r.part ?? 0 };
    if (r.si !== pipe || r.mode !== 'lanes' || (r.part ?? 0) !== part) { col = null; load = DRY; }   // a new pipe, a fresh brush; Alu's segments each start clean, and ALU-CUT's parts
    pipe = r.si; part = r.part ?? 0;
    const segs = [], track = Math.max(0.8, (laned(r) && r.pitch ? r.pitch : o.xstep) * TRACK);
    let ci = 0, last = null;
    const pending = [];
    for (let i = 1; i < r.pts.length; i++) {
      const s0 = r.cum[i - 1], s1 = r.cum[i];
      while (ci < r.cross.length && r.cross[ci].s <= s1) { if (r.cross[ci].s >= s0 - 1e-9) { const pc = rgbOf(HEX[r.cross[ci].m.paint]); col = col && load <= o.run ? pmix(col, pc, share(o.mix, pc, col)) : pc; load = 0; } ci++; }
      const a = r.pts[i - 1], b = r.pts[i], L = s1 - s0, k = Math.max(1, Math.ceil(L / (GR_ > 1 ? 1 : 2)));   // long strokes in pieces, so a stroke runs dry along itself
      const bead = beadOf(r, b[2], b[3] || 1);
      for (let q = 0; q < k; q++) {
        const pa = last || lerp(a, b, q / k), pb = lerp(a, b, (q + 1) / k), at = s0 + L * (q + 0.5) / k, mid = lerp(pa, pb, 0.5), l = L / k; last = pb;
        load += l;
        const c = cellOf(mid);
        if (c >= 0 && GR[c] >= 0 && GE[c] === s.n && (GR[c] !== runId || Math.abs(GS[c] - at) > OWN_BACK)) {
          const wc = [GC[c * 3], GC[c * 3 + 1], GC[c * 3 + 2]], f = 1 - Math.exp(-l / Math.max(1, o.pick)), from = keyOf[GR[c]];
          if (o.cuts && (from.si !== pipe || from.part !== part)) mud.set(`${pipe}:${part}<${from.si}:${from.part}`, { si: pipe, part, from });
          col = col ? pmix(col, wc, share(f, wc, col)) : wc; load = Math.min(load, DRY) * (1 - f);
        }
        const dry = col ? (load - o.run) / Math.max(1, o.tail) : 2, hash = Math.abs(Math.sin(pa[0] * 12.9898 + pa[1] * 78.233) * 43758.5453) % 1;
        let out = null, alpha = 0, thin;
        if (dry <= 0) { out = col; alpha = SOLID; }
        else if (dry < 1 && hash > dry) { out = col; alpha = 0.7 * (1 - dry); thin = 1 - 0.5 * dry; }
        if (out) { segs.push({ a: pa, b: pb, col: out, alpha, thin, lane: b[2], bw: bead.w, sh: bead.sh }); pending.push([mid, out, at]); }
        else segs.push({ a: pa, b: pb, col: null });
        while (pending.length && at - pending[0][2] > track + 1) { const [pm, pc, pat] = pending.shift(); stamp(pm, track, pc, runId, pat, s.n); }
      }
    }
    for (const [pm, pc, pat] of pending) stamp(pm, track, pc, runId, pat, s.n);
    all.push(segs);
    length += r.cum.at(-1) || 0;
  }
  const at = p => { const c = cellOf(p); return c < 0 || GR[c] < 0 ? 0 : GR[c]; };
  return { runs: all, length, at, mud: [...mud.values()] };
}

// ---------- the passes, as rows of Test's run ----------
// Canvas mm from the panel's centre (x right, y down) for the machine, as
// loveplan's; fitPieces gives the lines and arcs back. A run turning sharper
// than KINK — Across's zig-zag, a lane's step at a segment's end, a pinch — is
// cut there first, so no biarc rounds a corner the brush takes.
const KINK = 30 * Math.PI / 180;
const centred = o => p => [p[0] - o.cw / 2, p[1] - o.ch / 2];
export function fitRun(pts) {
  const P = pts.filter((p, i) => !i || dist(p, pts[i - 1]) > 1e-6);
  if (P.length < 2) return [];
  const parts = []; let cur = [P[0]];
  for (let i = 1; i < P.length; i++) {
    cur.push(P[i]);
    if (i < P.length - 1 && dot(norm(sub(P[i], P[i - 1])), norm(sub(P[i + 1], P[i]))) < Math.cos(KINK)) { parts.push(cur); cur = [P[i]]; }
  }
  parts.push(cur);
  return parts.flatMap(q => fitPieces(q));
}
// TRACE: every pipe's outline on its outermost lanes, lane 1 and lane n — the
// very lines DRAG runs, offset as they are (the owner, 2026-10-10,
// alu-result/: "I brush first, do the trace, and think Drag will go along this
// outline, but it goes quite otherwise, inside the trace's outline … remove
// the slider and make a strict correspondence"). Before, the line's outer
// edge lay on the pipe's, TYPE's way, so the outline ran (Brush width − Line
// width) / 2 outside the lanes: 1.75 mm at 4.5 and 1, 4 mm at 12 and 4. Fan
// ends round, cut to the panel. An outline whole on the panel is a loop:
// round clockwise and on LOOP_SHARE of itself over its start, as every loop
// of Rembrandt. → [{ pts, si, lap, closed }]
export function outlineOf(st, r) {
  const sp = st.sp, a = offsetRange(sp, 0, sp.L, -r), b = offsetRange(sp, 0, sp.L, r).reverse();
  const capPts = atEnd => { const f = frameAt(sp, atEnd ? sp.L : 0), out = atEnd ? f.T : mul(f.T, -1), pts = [];
    for (let q = 0; q <= 24; q++) { const ph = (atEnd ? -1 : 1) * (Math.PI / 2 - Math.PI * q / 24), d = add(mul(out, Math.cos(ph)), mul(f.N, Math.sin(ph))); pts.push(add(f.p, mul(d, r))); } return pts; };
  return [...a, ...(st.capB === 'fan' && !isLanes(st) ? capPts(true) : []), ...b, ...(st.capA === 'fan' && !isLanes(st) ? capPts(false) : []), a[0]];
}
const areaOf = P => P.reduce((s, p, i) => { const q = P[(i + 1) % P.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
export function traceOf(pl, o) {
  const out = [];
  pl.pipes.forEach((st, si) => {
    if (!st.sp) return;
    const loop = outlineOf(st, Math.max(0.5, lanesOf(st, o).e)), pieces = clipOpen(loop, [0, 0, o.cw, o.ch]);   // e: lanes 1 and n's offset, Segments' too
    if (pieces.length === 1 && dist(pieces[0][0], loop[0]) < 1e-6 && Math.abs(lengthOf(pieces[0]) - lengthOf(loop)) < 1e-3) {
      let P = loop.slice(0, -1); if (areaOf(P) < 0) P = P.reverse();   // clockwise on the canvas, y down
      let i0 = 0; P.forEach((p, i) => { if (p[1] < P[i0][1] - 1e-9) i0 = i; });   // from its top, 12 o'clock
      const ring = [...P.slice(i0), ...P.slice(0, i0), P[i0]], lap = LOOP_SHARE * lengthOf(ring), run = ring.slice();
      let d = 0;
      for (let j = 1; j < ring.length && d < lap; j++) { const step = dist(ring[j], ring[j - 1]); if (d + step > lap) { run.push(lerp(ring[j - 1], ring[j], (lap - d) / step)); d = lap; break; } run.push(ring[j]); d += step; }
      out.push({ pts: run, si, lap: d, closed: true });
    } else for (const pts of pieces) out.push({ pts, si, lap: 0, closed: false });
  });
  return out;
}
// With ink a dip, then outlines on what the brush holds while they keep
// within a dip run; a loop never split, as a ring is never; an open outline
// longer than a dip run cut where the dips fall (dipParts, NOLAN's
// watercolour). → { ps, info: [{ label, si, L }] }
export function traceRows(trace, ink, o, dipRun = DIP_RUN) {
  const ps = [], info = [], c = centred(o);
  let since = Infinity;
  trace.forEach((t, k) => {
    for (const [j, part] of (ink && !t.closed ? dipParts(t.pts, k, dipRun) : [t.pts]).entries()) {
      const pieces = fitRun(part.map(c));
      if (!pieces.length) continue;
      const L = pieces.reduce((a, g) => a + pieceLen(g), 0), nodip = !!ink && !j && since + L <= dipRun;
      since = nodip ? since + L : L;
      const row = ps.length + 1;
      ps.push(pieces.map(g => ({ ...g, tilt: 0, row, ...(t.closed ? { tailOut: t.lap } : {}), ...(nodip ? { nodip: true } : {}) })));
      info.push({ label: `Pipe ${t.si + 1} · ${t.closed ? 'its outline' : `its outline, a stretch`}${j ? `, after dip ${j + 1}` : ''}`, si: t.si, L });
    }
  });
  return { ps, info };
}
// MARKS: every mark of the session a stroke of its own, from the cup as
// TRACE, a dip before every MARKS_DIP-th. No ticks since 2026-10-11 (the
// owner: "the ticks turned out unnecessary — the lines are enough for me");
// before, TYPE's abacus, the paint's number across the dash.
export const MARKS_DIP = 4;   // marks a dip carries, est. (the prototype's)
export function marksRows(pl, session, o) {
  const ps = [], info = [], count = {}, c = centred(o), s = pl.sessions[session];
  let n = 0;
  for (const m of s?.marks || []) {
    const num = pl.nums.indexOf(m.paint) + 1;
    n++; count[m.paint] = (count[m.paint] || 0) + 1;
    const pieces = fitRun(m.pts.map(c)); if (!pieces.length) continue;
    const dip = (n - 1) % MARKS_DIP === 0, row = ps.length + 1;
    ps.push(pieces.map(g => ({ ...g, tilt: 0, row, ...(o.ink && !dip ? { nodip: true } : {}) })));
    info.push({ label: `Pipe ${m.si + 1} · mark ${n}, paint ${num}`, si: m.si, L: pieces.reduce((a, g) => a + pieceLen(g), 0) });
  }
  return { ps, info, marks: n, count };
}
// DRAG: the session's runs one after another, a row a run, the dry brush, no
// dip ever: Whole lanes in their order, n … 1 inside first, each the whole
// pipe, the brush lifting at its end and going back in the air — or, the
// snake, a pipe's lanes back and forth in one row, the brush down, each lane
// fitted on its own, its step across before it, and the row's stopsAt the mm
// where each lane ends: plotRun cuts its block there, so a pause falls at a
// lane's end (the owner, 2026-10-10: "the pause works only at the ends of a
// line … at the start of the sausage or at its end").
// With cuts (ALU-CUT, o.cuts) a stop before every part but the first — at a
// cut, and before every next pipe (the owner, 2026-10-11: "a good idea"): the
// brush lifted over the canvas at the part's end, a pause the deck and the LCD
// name, the owner wiping or washing it and squeezing the next part's paints
// before Continue. stops: [{ at: the row it comes before, why }].
export const stopWhy = (si, part, parts) => `Pipe ${si + 1}${parts > 1 ? `, part ${part + 1} of ${parts}` : ''}: wipe or wash the brush, squeeze its paints, then Continue`;
export function dragRows(pl, session, o) {
  const ps = [], info = [], stops = [], c = centred(o), s = pl.sessions[session];
  let length = 0, lanes = 0, was = null;
  for (const r of s?.runs || []) {
    const chunks = r.starts?.length > 1 ? r.starts.map((at, k) => r.pts.slice(Math.max(0, at - 1), r.starts[k + 1] ?? r.pts.length)) : [r.pts];
    const parts = chunks.map(q => fitRun(q.map(c))), pieces = parts.flat(); if (!pieces.length) continue;
    const stopsAt = []; let acc = 0;
    parts.slice(0, -1).forEach(q => { acc += q.reduce((a, g) => a + pieceLen(g), 0); stopsAt.push(acc); });
    const row = ps.length + 1, L = pieces.reduce((a, g) => a + pieceLen(g), 0), key = `${r.si}:${r.part ?? 0}`;
    if (o.cuts && was !== null && key !== was) stops.push({ at: ps.length, why: stopWhy(r.si, r.part ?? 0, r.parts ?? 1) });
    was = key;
    ps.push(pieces.map((g, i) => ({ ...g, tilt: 0, row, ...(!i && stopsAt.length ? { stopsAt } : {}) })));
    info.push({ label: r.mode === 'lanes' ? `Pipe ${r.si + 1}${o.cuts && (r.parts ?? 1) > 1 ? `, part ${r.part + 1}` : ''} · ${r.nums?.length > 1 ? `lanes ${r.nums.join(' → ')}, back and forth` : `lane ${r.num}, the whole pipe`}` : `Pipe ${r.si + 1} · segment ${r.j + 1}, ${r.mode === 'fan' ? 'a fan ray' : r.mode === 'across' ? `${r.strokes} strokes across` : `${r.lanes > 1 ? `${r.lanes} lanes back and forth` : `lane ${r.lane + 1}`}`}`, si: r.si, L });
    length += L; lanes += r.mode === 'lanes' || r.mode === 'along' ? (r.lanes || 1) : 0;
  }
  return { ps, info, stops, lanes, runs: ps.length, length };
}
// DRAG's rows as plotRun's passes: a pass a stretch between stops, its why the
// stop's, so plotRun lays a pause block before it — none before the first
export function dragPasses(R) {
  const cuts = [0, ...R.stops.map(q => q.at), R.ps.length];
  return cuts.slice(0, -1).map((a, k) => ({ key: 'DRAG', ps: R.ps.slice(a, cuts[k + 1]), why: k ? R.stops[k - 1].why : null })).filter(q => q.ps.length);
}

// ---------- the files (TYPE.md's format) ----------
// SVG in panel mm, y down, origin top left; each <path> one brush-down run,
// in drawing order; the paint map for the painter only; the plan as JSON.
// o: the settings, as planOf's, with seed, ground, width, tail.
const f2 = v => (Math.round(v * 100) / 100).toString(), dd = (pts, closed) => 'M' + pts.map(p => f2(p[0]) + ' ' + f2(p[1])).join(' L') + (closed ? ' Z' : '');
const svgDoc = (o, title, body) => `<?xml version="1.0" encoding="UTF-8"?>\n<!-- Rembrandt ${(o.tab || 'alu').toUpperCase()} · ${title} · panel ${o.cw}x${o.ch} mm, y down, origin top left. Each <path> is one brush-down run, in drawing order. -->\n<svg xmlns="http://www.w3.org/2000/svg" width="${o.cw}mm" height="${o.ch}mm" viewBox="0 0 ${o.cw} ${o.ch}">\n${body}\n</svg>\n`;
export const slugOf = o => `${o.tab || 'alu'}_${o.seed}`;
export function traceSvg(pl, o) {
  const rows = traceOf(pl, o).map(t => `  <path d="${dd(rdp(t.pts, 0.15))}" data-pipe="${t.si + 1}"/>`);
  return svgDoc(o, 'pass 1 trace', `<g id="pass1-trace" data-pass="1" data-ink="INK-1" data-dip-every-mm="${DIP_RUN}" fill="none" stroke="#6E8EB0" stroke-width="${o.width}">\n${rows.join('\n')}\n</g>`);
}
export function marksSvg(pl, s, o) {
  const rows = [];
  for (const m of s.marks) {
    const n = pl.nums.indexOf(m.paint) + 1;
    rows.push(`  <path d="${dd(rdp(m.pts, 0.15))}" data-paint="${n}" data-pipe="${m.si + 1}" data-segment="${m.j + 1}" data-kind="${m.kind}"/>`);
  }
  return svgDoc(o, `pass 2 marks, session ${s.n}`, `<g id="pass2-marks-s${s.n}" data-pass="2" data-ink="INK-1" data-dip-every-marks="${MARKS_DIP}" fill="none" stroke="#8A8A8A" stroke-width="${o.width}">\n${rows.join('\n')}\n</g>`);
}
export function dragSvg(s, o) {
  const rows = s.runs.map(r => r.mode === 'lanes' ? `  <path d="${dd(rdp(r.pts, 0.1))}" data-pipe="${r.si + 1}" data-mode="lanes" data-lane="${r.nums ? r.nums.join(' ') : r.num}"/>` : `  <path d="${dd(rdp(r.pts, 0.1))}" data-pipe="${r.si + 1}" data-segment="${r.j + 1}" data-mode="${r.mode}"/>`);
  return svgDoc(o, `pass 3 drag, session ${s.n}`, `<g id="pass3-drag-s${s.n}" data-pass="3" data-ink="none" data-brush-mm="${o.brush}" fill="none" stroke="#24221F" stroke-width="1">\n${rows.join('\n')}\n</g>`);
}
export function paintMapSvg(pl, o) {
  const rows = [];
  pl.pipes.forEach(st => { if (!st.sp) return; for (const piece of clipOpen(outlineOf(st, st.w / 2 - 1), [0, 0, o.cw, o.ch])) rows.push(`<path d="${dd(rdp(piece, 0.2))}" fill="none" stroke="#24221F" stroke-width="0.6" opacity="0.5"/>`); });
  for (const s of pl.sessions) for (const m of s.marks) rows.push(`<path d="${dd(rdp(m.pts, 0.2))}" stroke="${HEX[m.paint]}" stroke-width="4.5" stroke-linecap="round" fill="none"/>`);
  const legend = pl.nums.map((k, i) => `<rect x="10" y="${10 + i * 15}" width="11" height="11" fill="${HEX[k]}" stroke="#24221F" stroke-width="0.3"/><text x="27" y="${19 + i * 15}" font-family="Helvetica, Arial" font-size="10" fill="#24221F">${i + 1} ${NAME[k]}</text>`).join('');
  return svgDoc(o, 'paint map, for the painter, not for the machine', `<rect width="100%" height="100%" fill="${o.ground === 'paper' ? '#F1ECE1' : '#FBFAF7'}"/>\n${rows.join('\n')}\n<rect x="5" y="5" width="120" height="${pl.nums.length * 15 + 8}" fill="#FBFAF7" opacity="0.92"/>${legend}`);
}
export function planJson(pl, o) {
  return JSON.stringify({ tab: (o.tab || 'alu').toUpperCase(), seed: o.seed, panel: { w: o.cw, h: o.ch, units: 'mm', origin: 'top left, y down' }, ground: o.ground,
    brush_mm: o.brush, lanes_along: o.lanes, step_across_mm: o.xstep, along: o.aorder, mark_spacing_mm: o.spacing, dense_run_mm: o.run, dry_tail_mm: o.tail, crossings: o.overlap, past_edge_mm: o.over,
    paints: pl.nums.map((k, i) => ({ n: i + 1, key: k, name: NAME[k], hex: HEX[k] })),
    pipes: pl.pipes.map((st, i) => ({ n: i + 1, brush: isLanes(st) ? 'whole lanes' : 'segments', ...(isLanes(st) ? { first: st.first === 'out' ? 'outside' : 'inside', marks_by_hand: handMarks(st) ? st.marks.map(m => ({ at_mm: Number(f2(m.f * (st.sp?.L || 0))), paint: pl.nums.indexOf(m.paint) + 1 })) : null } : {}), points: st.pts.map(p => p.map(v => Number(f2(v)))), width_mm: st.w, round: Number(f2(st.round)), largest_radius_mm: st.rad || null, ends: [st.capA, st.capB], seams: st.seams.map(v => Number(v.toFixed(4))), segments: st.segs.map(sg => ({ mode: sg.mode, paints: sg.stops.map(k => pl.nums.indexOf(k) + 1) })) })),
    sessions: pl.sessions.map(s => ({ n: s.n, runs: s.runs.length, marks: s.marks.length })) }, null, 1);
}
