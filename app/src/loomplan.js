// LOOM's plan — Claude's own tab (the owner, 2026-10-16, Claude-Freedome/: "I
// offer you full freedom: study the result yourself and come up with a tab
// entirely your own"; "of everything we made the coolest is IMG_0924.jpg" —
// Crimson Ruby Weave, BIAS SNAKE at 45°, a step of 8 mm, the brush 6 mm, the
// run log of 2026-10-15 15:17; "it has a texture like Bottega Veneta's";
// "just driving stripes back and forth as on CCD turned out less gripping").
//
// The canvas is one cloth: two families of diagonal lanes — strips — square
// to each other, a rising one and a crossing one in turn, as BIAS SNAKE lays
// them, every lane RUNOUT mm off the canvas at both its ends (the owner's
// +30 mm). What is new is the weave. On BIAS the later strip always lies on
// top; on a woven cloth a strip goes over one and under the next. So where a
// strip should go under one painted before it, the elbow lifts the brush on
// the move just before that strip and lands it just past — a hop — and the
// earlier strip stays on top there (the machine's third servo, the elbow, the
// owner's reminder: "we have three servo actuators, not only the NEMA17s for X
// and Y"). The weaves: Plain, one over and one under, the intrecciato; Twill,
// two and two, its ribs straight across the canvas at 45°; Basket, the strips
// in pairs; Lattice, no hop at all — the later strip on top, as IMG_0924.
//
// A canvas wider or taller than the machine reaches (60 × 80, 70 × 100: "two
// runs, though that is a tricky construction — maybe something simple") in two
// halves: the near half and an overlap past the middle; then the canvas turned
// round 180° by hand — its far corner, C, on the stop where the near one, A,
// was; its far half near —
// and the far half the same way. The lattice is laid from the canvas's centre,
// one lane of each family through it, so turned it is the same lattice: the
// second half's strips go on from the first's, over the overlap, the paint
// dragged the other way — the fold of IMG_0924 in the middle.
//
// mm from the canvas's bottom left corner, x right, y up, as a ruler reads
// them; a turned run in the canvas's frame as it lies turned, p ↦ (w − x,
// h − y), so the machine runs both halves alike. Lines only. No DOM.

import { toMachine } from './band.js';
import { pieceLen, plotRun } from './strokes.js';
import { PAINT } from './tapeplan.js';
import { paintOf, GROOVE_K, HOLD, FILM, PICK_BULK, PICK_FILM, DRY, THIN, SAUSAGE_W, MARKS_DIP, DENSITY_NEW } from './ccdplan.js';
import { cleanPat, sausagesOf, markOf, rowName, distTo, ROUND_MAX } from './biasplan.js';
import { linOf, toSrgb, pigmentMix } from './color.js';

export { SAUSAGE_W, MARKS_DIP, DENSITY_NEW, ROUND_MAX };
export const ANGLE_NEW = 45, ANGLE_MIN = 5, ANGLE_MAX = 85;   // °: the rising strips; 45 the intrecciato's, and IMG_0924's
export const STEP_NEW = 9, STEP_MIN = 3, STEP_MAX = 60;       // mm, strip centre to strip centre: IMG_0924's 8, one more for the hop's room (Claude's)
export const ROWS_NEW = 3, ROWS_MIN = 2, ROWS_MAX = 12;       // BIAS's rows of sausages: the edges and the middle — IMG_0924's fold
export const WEAVES = ['plain', 'twill', 'basket', 'lattice'];
export const WEAVE_NAME = { plain: 'Plain', twill: 'Twill', basket: 'Basket', lattice: 'Lattice' };
export const HALVES = ['one', 'lr', 'bt'];
export const MODES = ['snake', 'air'];
export const BRUSH_NEW = 6;          // mm: the owner's round brush
export const DRAG_NEW = 30;          // mm/s: slow enough for the elbow to hop (est.; Lattice runs at BIAS's 90)
export const HOP_NEW = 1;            // mm: the brush up this far before the strip it goes under, and down this far past it (est.)
export const TAIL_NEW = 1.5;         // mm: the pressure eased off before a lift and on after a landing (strokes.js's tail; est.)
export const RUNOUT_NEW = 30;        // mm off the canvas at a strip's ends: the owner's +30 (BIAS)
export const MARGIN_NEW = 25;        // mm round the canvas for the brush to turn in: the owner's 25 (BIAS)
export const CLEAR_NEW = 2;          // mm: the brush's edge past the canvas at a snake's turn, est. (BIAS's)
export const OVERLAP_NEW = 30;       // mm: each half's strips on past the middle, over the other's (Claude's: the owner's +30 again)
export const MIN_PRESS = 2;          // mm: two hops closer than this are one; a strip shorter than this between a hop and its end, none
export const MIN_LANE = 1;           // mm: a shorter chord, a corner's touch, is none

// LOOM's tones: one colour in its shades — IMG_0924 was crimson, ruby, rose
// and pink only, so the strips never muddy (Claude's; the paints off the
// strip, TAPE's). Fall after the owner's BOTTEGA FALL 001; Azure and Dusk
// after his AZURE HORIZON and CHROMATIC DUSK.
export const LOOM_TONES = {
  'Crimson Ruby': { name: 'Crimson Ruby', core: ['magenta', 'roseazo', 'p05', 'red', 'pink', 'deepred'], accent: ['purple'] },
  'Fall': { name: 'Fall', core: ['orange', 'red', 'pink', 'oyellow', 'p05'], accent: ['purple', 'ochre'] },
  'Azure': { name: 'Azure', core: ['p04', 'p03', 'sky', 'ultramarine', 'white'], accent: ['turquoise'] },
  'Dusk': { name: 'Dusk', core: ['purple', 'magenta', 'pink', 'sand', 'roseazo'], accent: ['ochre'] },
};

const fin = Number.isFinite, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), mod = (a, n) => ((a % n) + n) % n;
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const along = (p, d, s) => [p[0] + d[0] * s, p[1] + d[1] * s];
const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);

// ---------- the cloth ----------
// The cloth as it may be kept: whatever is wrong in it put right. Its size is
// the canvas's; its sausages BIAS's, on its edges and rows.
export function cleanCloth(c) {
  if (!c || typeof c !== 'object') c = {};
  const pat = cleanPat(c.pat);
  return {
    angle: fin(c.angle) ? clamp(c.angle, ANGLE_MIN, ANGLE_MAX) : ANGLE_NEW,
    step: fin(c.step) ? clamp(c.step, STEP_MIN, STEP_MAX) : STEP_NEW,
    weave: WEAVES.includes(c.weave) ? c.weave : WEAVES[0],
    rows: fin(c.rows) ? Math.round(clamp(c.rows, ROWS_MIN, ROWS_MAX)) : ROWS_NEW,
    from2: c.from2 === 'bl' ? 'bl' : 'tr',
    halves: HALVES.includes(c.halves) ? c.halves : 'one',
    ...(pat ? { pat } : {}),
  };
}
// the cloth as BIAS's rectangle the whole canvas, for its sausages and rows
export const rectOf = (cloth, cw, ch) => ({ ...cloth, x: 0, y: 0, w: cw, h: ch, i: 0 });

// ---------- the strips ----------
// Two families square to each other: A rising ↗ at the angle, B descending ↘;
// n square to u, a family's lanes in order along it — A's from the bottom
// right corner to the top left, B's from the bottom left to the top right.
export function familiesOf(angle) {
  const t = angle * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
  return [[c, s], [s, -c]].map((u, i) => ({ key: i ? 'B' : 'A', u, n: [-u[1], u[0]] }));
}
// The line n·p = c through the box → its chord along u, a to b, or null
function chord(B, F, c) {
  const P = [F.n[0] * c, F.n[1] * c];
  let t0 = -Infinity, t1 = Infinity;
  for (const [ax, lo, hi] of [[0, B.x0, B.x1], [1, B.y0, B.y1]]) {
    const u = F.u[ax], p = P[ax];
    if (Math.abs(u) < 1e-12) { if (p < lo - 1e-9 || p > hi + 1e-9) return null; continue; }
    let a = (lo - p) / u, b = (hi - p) / u; if (a > b) [a, b] = [b, a];
    t0 = Math.max(t0, a); t1 = Math.min(t1, b);
  }
  if (!(t1 - t0 >= MIN_LANE)) return null;
  return { a: [P[0] + F.u[0] * t0, P[1] + F.u[1] * t0], b: [P[0] + F.u[0] * t1, P[1] + F.u[1] * t1], len: t1 - t0 };
}
// What a run paints of the canvas, w × h: all of it, or the near half — the
// left (lr) or the bottom (bt) — and the overlap past the middle
export function windowOf(halves, w, h, overlap = OVERLAP_NEW) {
  const ov = Math.max(0, overlap || 0);
  if (halves === 'lr') return { x0: 0, x1: Math.min(w, w / 2 + ov), y0: 0, y1: h };
  if (halves === 'bt') return { x0: 0, x1: w, y0: 0, y1: Math.min(h, h / 2 + ov) };
  return { x0: 0, x1: w, y0: 0, y1: h };
}
// A family's lanes a step apart across them, k = 0 through the canvas's
// centre — so the lattice turned 180° is itself, lane k lane −k — cut to the
// window: [{ fam, k, a, b, len }] in order along n
export function familyLanes(F, w, h, step, W = { x0: 0, x1: w, y0: 0, y1: h }) {
  const c0 = dot(F.n, [w / 2, h / 2]), cs = [[W.x0, W.y0], [W.x1, W.y0], [W.x1, W.y1], [W.x0, W.y1]].map(p => dot(F.n, p));
  const lo = Math.min(...cs), hi = Math.max(...cs), out = [];
  for (let k = Math.ceil((lo - c0) / step - 1e-9); c0 + k * step <= hi + 1e-9; k++) { const q = chord(W, F, c0 + k * step); if (q) out.push({ fam: F.key, k, ...q }); }
  return out;
}
// A run's lanes in the order the brush lays them, BIAS SNAKE's: a rising one,
// a crossing one, in turn — the rising ones from the bottom right corner up,
// each run down ↙; the crossing ones from the top right corner, each ↘ to the
// right side, or from the bottom left, each ↖ — the longer family's last on
// their own. Each with its way (from, to, u), its place in the order (pos)
// and its index on the canvas as it lies first (ko: −k on a turned run).
export function laneOrder(cloth, w, h, W, turned = false) {
  const [FA, FB] = familiesOf(cloth.angle), up = cloth.from2 === 'bl', back = F => [-F.u[0], -F.u[1]];
  const A = familyLanes(FA, w, h, cloth.step, W).map(l => ({ ...l, from: l.b, to: l.a, u: back(FA), F: FA }));
  const B0 = familyLanes(FB, w, h, cloth.step, W);
  const B = (up ? B0 : B0.slice().reverse()).map(l => up ? { ...l, from: l.b, to: l.a, u: back(FB), F: FB } : { ...l, from: l.a, to: l.b, u: FB.u, F: FB });
  const out = [];
  for (let i = 0; i < Math.max(A.length, B.length); i++) { if (A[i]) out.push(A[i]); if (B[i]) out.push(B[i]); }
  return out.map((l, pos) => ({ ...l, pos, ko: turned ? 0 - l.k : l.k }));
}

// ---------- the weave ----------
// Where rising strip i crosses crossing strip j (their indices on the canvas
// as it lies first): is the rising one on top? Plain, the intrecciato, in
// turn like a chessboard; Twill two and two along the diagonals, so its ribs
// run straight across a 45° cloth; Basket the strips in pairs. Lattice: null —
// whichever comes later is on top, as BIAS.
export function aOver(weave, i, j) {
  if (weave === 'plain') return mod(i + j, 2) === 0;
  if (weave === 'twill') return mod(i + j, 4) < 2;
  if (weave === 'basket') return mod(Math.floor(i / 2) + Math.floor(j / 2), 2) === 0;
  return null;
}
// is lane L on top where it crosses M — null: no rule, the later on top
export function onTop(weave, L, M) {
  const a = L.fam === 'A' ? aOver(weave, L.ko, M.ko) : aOver(weave, M.ko, L.ko);
  return a === null ? null : L.fam === 'A' ? a : !a;
}
// Where two lanes' lines cross: s along L from its start, t along M from its
export function crossAt(L, M) {
  const d = [M.from[0] - L.from[0], M.from[1] - L.from[1]], den = L.u[0] * M.u[1] - L.u[1] * M.u[0];
  if (Math.abs(den) < 1e-12) return null;
  return { s: (d[0] * M.u[1] - d[1] * M.u[0]) / den, t: (d[0] * L.u[1] - d[1] * L.u[0]) / den, sin: Math.abs(den) };
}
// The shortest stretch with the brush down between two lifts: MIN_PRESS, and
// the tail eased on and off at both its ends — shorter, the elbow cannot keep
// up (strokes.js, its need)
export const pressOf = o => Math.max(MIN_PRESS, 2 * (o?.tail ?? TAIL_NEW));
// two intervals closer than min are one
function merged(I, min = MIN_PRESS) {
  const out = [];
  for (const q of I.slice().sort((a, b) => a[0] - b[0])) {
    const last = out.at(-1);
    if (last && q[0] - last[1] < min) last[1] = Math.max(last[1], q[1]); else out.push([q[0], q[1]]);
  }
  return out;
}
// The hops: every lane over the ones laid before it where it should go under
// them — from o.hop mm before that strip's near edge to o.hop past its far
// one, s along the lane from its start; the ones laid after it hop over it
// themselves. → [[s0, s1] …] a lane, merged, in order
export function hopsOf(lanes, weave, o = {}) {
  const out = lanes.map(() => []);
  if (aOver(weave, 0, 0) === null) return out;
  const hw = (o.brush ?? BRUSH_NEW) / 2, e = o.hop ?? HOP_NEW;
  for (const L of lanes) for (const M of lanes) {
    if (M.fam === L.fam || M.pos > L.pos) continue;
    const X = crossAt(L, M);
    if (!X || X.s < -1e-6 || X.s > L.len + 1e-6 || X.t < -1e-6 || X.t > M.len + 1e-6) continue;
    if (onTop(weave, L, M)) continue;
    const half = hw / X.sin + e;                                   // M's strip across L, and the clearance
    out[L.pos].push([X.s - half, X.s + half]);
  }
  return out.map(I => merged(I, pressOf(o)));
}

// ---------- the brush's way ----------
// how far on from p, along d, until the brush's centre is d0 clear of the box (BIAS's)
function clearAlong(r, p, d, d0) {
  if (!(d0 > 0)) return 0;
  const at = s => distTo(r, [p[0] + d[0] * s, p[1] + d[1] * s]);
  let lo = 0, hi = 2 * d0 + 1;
  while (at(hi) < d0 && hi < 1e5) hi *= 2;
  for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (at(m) >= d0) hi = m; else lo = m; }
  return hi;
}
function segClear(r, a, b) {
  const f = t => distTo(r, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  let lo = 0, hi = 1;
  for (let i = 0; i < 60; i++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (f(m1) < f(m2)) hi = m2; else lo = m1; }
  return Math.min(f(0), f(1), f((lo + hi) / 2));
}
// the snake's step from a lane's end to the next one's start off the canvas:
// straight, or round a corner or two, d0 out — the shortest that keeps off it (BIAS's)
function stepAround(r, A, B, d0) {
  const ok = (p, q) => segClear(r, p, q) >= d0 - 1e-6;
  if (ok(A, B)) return [];
  const C = [[r.x - d0, r.y - d0], [r.x + r.w + d0, r.y - d0], [r.x + r.w + d0, r.y + r.h + d0], [r.x - d0, r.y + r.h + d0]];
  let best = null;
  const take = mid => {
    const P = [A, ...mid, B];
    let L = 0;
    for (let i = 1; i < P.length; i++) { if (!ok(P[i - 1], P[i])) return; L += dist(P[i - 1], P[i]); }
    if (!best || L < best.L) best = { mid, L };
  };
  for (let i = 0; i < 4; i++) { take([C[i]]); take([C[i], C[(i + 1) % 4]]); take([C[i], C[(i + 3) % 4]]); }
  return best ? best.mid : [];
}
const canvasOf = o => ({ x: 0, y: 0, w: o.cw, h: o.ch });
// how far along d from p the brush may run off the canvas and stay, its edge too, inside the margin round it (BIAS's)
const marginAlong = (p, d, o) => o.margin > 0 ? clearAlong(canvasOf(o), p, d, Math.max(0, o.margin - (o.brush || 0) / 2)) : Infinity;
const runOff = (p, d, o) => Math.min(o.runout ?? RUNOUT_NEW, marginAlong(p, d, o));
const offCanvas = (p, o) => p[0] < -1e-9 || p[1] < -1e-9 || p[0] > o.cw + 1e-9 || p[1] > o.ch + 1e-9;
// A lane as the brush runs it: from RUNOUT before the canvas's edge — or, at
// the middle of a halved canvas, from the window's edge on the canvas — to
// RUNOUT past the other, the snake's clearance at least; its hops along it.
// A hop that would leave less than the shortest stretch (pressOf) at an end
// takes the end: the strip starts after it, or ends before. → { P0, P1, u, len, hops, outA,
// outB (an end off the canvas), lane } or null, nothing left
export function strokeOf(L, hops, o) {
  const back = [-L.u[0], -L.u[1]], d0 = (o.brush ?? BRUSH_NEW) / 2 + (o.clear ?? CLEAR_NEW), K = canvasOf(o);
  const outA = offCanvas(along(L.from, back, 0.01), o), outB = offCanvas(along(L.to, L.u, 0.01), o);
  const ra = outA ? Math.max(runOff(L.from, back, o), clearAlong(K, L.from, back, d0)) : 0;
  const rb = outB ? Math.max(runOff(L.to, L.u, o), clearAlong(K, L.to, L.u, d0)) : 0;
  const min = pressOf(o);
  let s0 = 0, s1 = ra + L.len + rb, H = (hops || []).map(([a, b]) => [a + ra, b + ra]), inA = !outA, inB = !outB;
  while (H.length && H[0][0] - s0 < min) { s0 = Math.max(s0, H.shift()[1]); inA = true; }
  while (H.length && s1 - H.at(-1)[1] < min) { s1 = Math.min(s1, H.pop()[0]); inB = true; }
  if (s1 - s0 < min) return null;
  // the brush down on the canvas — between ra and ra + L.len — for MIN_PRESS at least, or none of it
  let onIt = Math.max(0, Math.min(s1, ra + L.len) - Math.max(s0, ra));
  for (const [a, b] of H) onIt -= Math.max(0, Math.min(b, ra + L.len) - Math.max(a, ra));
  if (onIt < min) return null;
  const P0 = along(L.from, back, ra - s0);
  return { P0, P1: along(P0, L.u, s1 - s0), u: L.u, len: s1 - s0, hops: H.map(([a, b]) => [a - s0, b - s0]), outA: !inA, outB: !inB, lane: L };
}
// A stroke's pieces: brush down, up over a hop, down … → [[s0, s1, hop]]
export function piecesOf(st) {
  const out = [];
  let s = 0;
  for (const [a, b] of st.hops) { if (a > s) out.push([s, a, false]); out.push([Math.max(s, a), b, true]); s = b; }
  if (st.len > s) out.push([s, st.len, false]);
  return out;
}

// ---------- the plan ----------
// Every run with its lanes, hops and strokes: one, or two halves, the second
// on the canvas turned. o: cw, ch (the canvas), brush, hop, tail, runout,
// margin, clear, overlap.
export function planOf(cloth, o) {
  const w = o.cw, h = o.ch, W = windowOf(cloth.halves, w, h, o.overlap ?? OVERLAP_NEW);
  const runs = (cloth.halves === 'one' ? [false] : [false, true]).map((turned, i) => {
    const lanes = laneOrder(cloth, w, h, W, turned), hops = hopsOf(lanes, cloth.weave, o);
    return { n: i + 1, turned, win: W, lanes, strokes: lanes.map((L, j) => strokeOf(L, hops[j], o)) };
  });
  const all = runs.flatMap(q => q.strokes.filter(Boolean));
  return { cloth, rect: rectOf(cloth, w, h), runs, lanes: all.length, hops: all.reduce((a, s) => a + s.hops.length, 0),
    length: all.reduce((a, s) => a + s.len - s.hops.reduce((t, [p, q]) => t + q - p, 0), 0) };
}
// a point of a run's frame on the canvas as it lies first
export const toCanvas = (run, p, o) => run.turned ? [o.cw - p[0], o.ch - p[1]] : p;
export const dirOn = (run, u) => run.turned ? [-u[0], -u[1]] : u;
// The landings: the snake keeps the brush down off the canvas from a lane's
// end to the next one's start where it can go round no farther than
// ROUND_MAX as straight across (BIAS SNAKE's), else — and always in the air,
// and from or to the middle of a halved canvas — it lifts and flies.
// → [{ pieces: [{ a, b, hop }], lanes: [j], ends: [mm along where each lane ends] }]
export function bowsOf(run, o, snake) {
  const d0 = (o.brush ?? BRUSH_NEW) / 2 + (o.clear ?? CLEAR_NEW), K = canvasOf(o), out = [];
  let cur = null;
  const add = (st, j) => {
    for (const [a, b, hop] of piecesOf(st)) { const p = along(st.P0, st.u, a), q = along(st.P0, st.u, b); cur.pieces.push({ a: p, b: q, hop }); cur.L += b - a; }
    cur.lanes.push(j); cur.ends.push(cur.L); cur.end = st.P1; cur.out = st.outB;
  };
  run.strokes.forEach((st, j) => {
    if (!st) return;
    if (cur && snake && cur.out && st.outA) {
      const A = cur.end, mid = stepAround(K, A, st.P0, d0), P = [A, ...mid, st.P0];
      const L = P.slice(1).reduce((t, q, i) => t + dist(P[i], q), 0);
      if (mid.length <= 1 && L <= ROUND_MAX * dist(A, st.P0) + 1e-6) {
        P.slice(1).forEach((q, i) => { if (dist(P[i], q) > 1e-6) { cur.pieces.push({ a: P[i], b: q, hop: false }); cur.L += dist(P[i], q); } });
        add(st, j); return;
      }
    }
    if (cur) out.push(cur);
    cur = { pieces: [], lanes: [], ends: [], L: 0 };
    add(st, j);
  });
  if (cur) out.push(cur);
  return out;
}

// ---------- DRAG ----------
// DRAG's rows for plotRun, a landing a row, machine mm from the canvas's
// centre — a turned run's frame is the canvas as it lies turned, so both
// halves go to the machine alike: its lanes and the snake's steps with the
// brush down, its hops marked as turns (the elbow up through them, strokes.js,
// o.lift); stopsAt at the lanes' ends, so a PAUSE falls there. A pass a run;
// the second's why: the turn.
export const TURN_WHY = 'Turn the canvas round 180°: corner C, the far one, on the stop where corner A was — its far half now by home. Then Continue';
export function dragRows(P, o) {
  const snake = o.mode !== 'air', at = q => toMachine([q[0] - o.cw / 2, o.ch / 2 - q[1]]), info = [], passes = [];
  let length = 0, n = 0;
  for (const run of P.runs) {
    const ps = [];
    for (const w of bowsOf(run, o, snake)) {
      const row = ++n, stopsAt = w.ends.slice(0, -1);
      ps.push(w.pieces.map((g, i) => ({ t: 'L', a: at(g.a), b: at(g.b), tilt: 0, row, ...(g.hop ? { turn: true } : {}), ...(!i && stopsAt.length ? { stopsAt } : {}) })));
      const first = w.lanes[0] + 1, last = w.lanes.at(-1) + 1, hops = w.pieces.filter(g => g.hop).length;
      info.push({ label: `${P.runs.length > 1 ? `Half ${run.n} · ` : ''}${first === last ? `lane ${first}` : `lanes ${first}–${last}`} of ${run.lanes.length}${hops ? ` · ${hops} hop${hops === 1 ? '' : 's'}` : ''}${w.lanes.length > 1 ? ', the brush down between' : ''}`, run: run.n, L: w.L });
      length += w.L;
    }
    if (ps.length) passes.push({ key: 'DRAG', ps, why: run.turned ? TURN_WHY : null });
  }
  return { passes, info, runs: n, length };
}
// The passes on the machine: plotRun each — the brush up, its rows, home —
// and between two the pause for the turn, the carriage at home, out of the
// way of the hands. → plotRun's, joined
export function runPasses(passes, opts) {
  const parts = passes.map(p => plotRun(opts, [{ key: p.key, ps: p.ps, why: null }]));
  if (!parts.length) return null;
  const out = { ...parts[0], blocks: parts[0].blocks.slice(), preview: parts[0].preview.slice() };
  parts.slice(1).forEach((q, i) => {
    out.blocks.push({ kind: 'pause', why: passes[i + 1].why || 'Continue', row: passes[i + 1].ps[0]?.[0]?.row ?? 0 }, ...q.blocks);
    out.preview.push(...q.preview);
    for (const k of ['length', 'seconds', 'turns', 'lifts', 'dips', 'pastWall', 'gone']) out[k] = (out[k] || 0) + (q[k] || 0);
    out.need = Math.max(out.need || 0, q.need || 0);
    out.fault = out.fault || q.fault;
    const a = out.carriage, b = q.carriage;
    out.carriage = a && b ? { x0: Math.min(a.x0, b.x0), x1: Math.max(a.x1, b.x1), y0: Math.min(a.y0, b.y0), y1: Math.max(a.y1, b.y1) } : a || b;
  });
  return out;
}
// The lanes as an SVG in canvas mm, y down, origin top left: a <path> a
// stretch of strip the brush paints, in running order, the hops left out
const f2 = v => (Math.round(v * 100) / 100).toString();
export function dragSvg(P, o) {
  const y = v => o.ch - v, rows = [];
  for (const run of P.runs) run.strokes.forEach((st, j) => {
    if (!st) return;
    for (const [a, b, hop] of piecesOf(st)) {
      if (hop) continue;
      const p = toCanvas(run, along(st.P0, st.u, a), o), q = toCanvas(run, along(st.P0, st.u, b), o);
      rows.push(`  <path d="M${f2(p[0])} ${f2(y(p[1]))} L${f2(q[0])} ${f2(y(q[1]))}" data-run="${run.n}" data-lane="${j + 1}" data-fam="${st.lane.fam}"/>`);
    }
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<!-- Rembrandt LOOM · drag · ${WEAVE_NAME[P.cloth.weave]} · canvas ${o.cw}x${o.ch} mm, y down, origin top left. Each <path> one stretch of a strip with the brush down, in running order; the gaps between are the hops. -->\n<svg xmlns="http://www.w3.org/2000/svg" width="${o.cw}mm" height="${o.ch}mm" viewBox="0 0 ${o.cw} ${o.ch}">\n<g id="drag" data-ink="none" data-brush-mm="${o.brush}" fill="none" stroke="#24221F" stroke-width="1">\n${rows.join('\n')}\n</g>\n</svg>\n`;
}

// ---------- MARKS ----------
// BIAS's: a dash a sausage along its edge or row, in watercolour from the
// cup, a dip every MARKS_DIP-th; on a halved canvas the near half's, then,
// the canvas turned, the far half's in its frame. → { passes, info, marks }
export function inFar(halves, p, o) { return halves === 'lr' ? p[0] > o.cw / 2 : halves === 'bt' ? p[1] > o.ch / 2 : false; }
export function marksRows(P, o) {
  const halves = P.cloth.halves, at = q => toMachine([q[0] - o.cw / 2, o.ch / 2 - q[1]]), ss = sausagesOf(P.rect), info = [], passes = [];
  let n = 0;
  for (const run of P.runs) {
    const mine = ss.filter(q => inFar(halves, [(q.a[0] + q.b[0]) / 2, (q.a[1] + q.b[1]) / 2], o) === run.turned), keys = [...new Set(mine.map(q => q.key))], ps = [];
    keys.forEach((key, j) => {
      const row = mine.filter(q => q.key === key);
      if (j % 2) row.reverse();
      for (const q of row) {
        const m = markOf(q, o.brush), [a, b] = (j % 2 ? [m.b, m.a] : [m.a, m.b]).map(p => toCanvas(run, p, o)), dip = n % MARKS_DIP === 0;
        n++; ps.push([{ t: 'L', a: at(a), b: at(b), tilt: 0, row: n, ...(o.ink && !dip ? { nodip: true } : {}) }]);
        info.push({ label: `${P.runs.length > 1 ? `Half ${run.n} · ` : ''}row ${rowName(key)} · ${PAINT[q.paint].name}`, run: run.n });
      }
    });
    if (ps.length) passes.push({ key: 'MARKS', ps, why: run.turned ? TURN_WHY : null });
  }
  return { passes, info, marks: n };
}

// ---------- the Result: the brush through the sausages, strip after strip (est.) ----------
// BIAS's walk, CCD's numbers, on a grid of the canvas: the sausages laid
// first, then every lane in its order, half after half, each groove picking up
// what lies under it and laying down what it carries — except over a hop,
// where the brush is up: it neither takes nor leaves, and the strip under
// keeps its paint, so it lies on top there. The snake carries the brush from
// lane to lane, HOLD at most; in the air every lane starts clean; a half
// starts clean. → { h, strokes: [{ run, j, g, start, u, n, h, rgb, cover,
// shade, w }], tucks: [{ p, u, w }] where a strip dives under another }
export function mixAll(P, o) {
  const W = o.cw, H = o.ch, G = GROOVE_K.length, brush = o.brush ?? BRUSH_NEW, h = Math.min(2, Math.max(brush / G, Math.max(W, H) / 1400, 0.2));
  const nx = Math.max(1, Math.ceil(W / h)), ny = Math.max(1, Math.ceil(H / h)), amt = new Float32Array(nx * ny), col = new Float32Array(3 * nx * ny);
  const quad = (x, y) => {
    const fx = x / h - 0.5, fy = y / h - 0.5, i0 = Math.floor(fx), j0 = Math.floor(fy), tx = fx - i0, ty = fy - j0, out = [];
    for (const [di, dj, w] of [[0, 0, (1 - tx) * (1 - ty)], [1, 0, tx * (1 - ty)], [0, 1, (1 - tx) * ty], [1, 1, tx * ty]]) {
      const i = i0 + di, j = j0 + dj;
      if (w > 1e-9 && i >= 0 && j >= 0 && i < nx && j < ny) out.push([j * nx + i, w]);
    }
    return out;
  };
  const under = Q => {
    let m = 0, ws = 0; const lg = [0, 0, 0];
    for (const [c, w] of Q) { ws += w; const v = w * amt[c]; if (!(v > 0)) continue; m += v; for (let q = 0; q < 3; q++) lg[q] += v * Math.log(Math.max(col[3 * c + q], 0.003)); }
    return { a: ws > 0 ? m / ws : 0, m, ws, rgb: m > 0 ? lg.map(v => Math.exp(v / m)) : null };
  };
  const colAt = c => [col[3 * c], col[3 * c + 1], col[3 * c + 2]];
  const put = (c, rgb, a) => { if (!(a > 0)) return; const t = a / (amt[c] + a); col.set(amt[c] > 0 ? pigmentMix(colAt(c), rgb, t) : rgb, 3 * c); amt[c] += a; };
  const V = paintOf(o.density ?? DENSITY_NEW), snake = o.mode !== 'air';
  for (const q of sausagesOf(P.rect)) {
    const v = V * (q.thin ? THIN : 1) / SAUSAGE_W, c = linOf(PAINT[q.paint].hex), [x0, y0, w, hh] = q.box;
    for (let j = Math.max(0, Math.floor(y0 / h)); j < Math.min(ny, Math.ceil((y0 + hh) / h)); j++) for (let i = Math.max(0, Math.floor(x0 / h)); i < Math.min(nx, Math.ceil((x0 + w) / h)); i++) {
      const cx = (i + 0.5) * h, cy = (j + 0.5) * h;
      if (cx >= x0 && cx <= x0 + w && cy >= y0 && cy <= y0 + hh) put(j * nx + i, c, v);
    }
  }
  const accW = new Float32Array(nx * ny), accA = new Float32Array(nx * ny), accL = new Float32Array(3 * nx * ny), touched = [], strokes = [], tucks = [];
  for (const run of P.runs) {
    const carry = GROOVE_K.map(() => null);
    run.strokes.forEach((st, j) => {
      if (!st) return;
      const start0 = toCanvas(run, st.P0, o), u = dirOn(run, st.u), nn = [-u[1], u[0]], n = Math.max(2, Math.round(st.len / h) + 1);
      const up = new Uint8Array(n);
      for (const [a, b] of st.hops) {
        for (let i = Math.max(0, Math.ceil(a / h)); i <= Math.min(n - 1, Math.floor(b / h)); i++) up[i] = 1;
        for (const s of [a, b]) tucks.push({ p: along(start0, u, s), u, w: brush, out: s === a });
      }
      const lane = GROOVE_K.map((_, g) => {
        const off = ((g + 0.5) / G - 0.5) * brush, start = [start0[0] + nn[0] * off, start0[1] + nn[1] * off];
        const Qs = Array.from({ length: n }, (_, i) => up[i] ? [] : quad(start[0] + u[0] * i * h, start[1] + u[1] * i * h));
        return { start, Qs, Us: Qs.map(Q => Q.length ? under(Q) : null) };
      });
      lane.forEach(({ start, Qs, Us }, g) => {
        const [kv, kd, shade] = GROOVE_K[g], dry = DRY * kd, A = new Float32Array(n), C = new Float32Array(3 * n), rgb = new Float32Array(3 * n), cover = new Float32Array(n);
        let b = 0, bc = [0, 0, 0];
        if (snake && carry[g]) { b = Math.min(carry[g].b, HOLD); bc = carry[g].bc; }
        for (let i = 0; i < n; i++) {
          const U = Us[i];
          if (!U) continue;                                             // off the canvas, or up over a hop: nothing under the brush
          const a = U.a, take = Math.min(0.95 * a, (Math.min(a, FILM) * PICK_FILM + Math.max(0, a - FILM) * PICK_BULK) * kv);
          const give = Math.min(b / h, FILM * (1 - Math.exp(-b / dry))), got = take * U.ws * h, gave = give * U.ws * h, left = a - take;
          const c = left > 0 && U.rgb ? (give > 0 ? pigmentMix(U.rgb, bc, give / (left + give)) : U.rgb) : bc;
          A[i] = left + give; C.set(c, 3 * i);
          const nb = b - gave + got;
          if (got > 0) bc = b - gave > 1e-9 ? pigmentMix(bc, U.rgb, got / nb) : U.rgb;
          b = nb;
          cover[i] = Math.min(1, A[i] / FILM);
          if (A[i] > 0) for (let m = 0; m < 3; m++) rgb[3 * i + m] = toSrgb(c[m]);
        }
        carry[g] = { b, bc };
        for (let i = 0; i < n; i++) for (const [cc, w] of Qs[i]) {
          if (!accW[cc]) touched.push(cc);
          accW[cc] += w; accA[cc] += w * A[i];
          if (A[i] > 0) for (let m = 0; m < 3; m++) accL[3 * cc + m] += w * A[i] * Math.log(Math.max(C[3 * i + m], 0.003));
        }
        strokes.push({ run: run.n, j, g, start, u, n, h, rgb, cover, shade, w: brush / G, fam: st.lane.fam });
      });
      for (const cc of touched) {
        const f = Math.min(1, accW[cc]), mean = accA[cc] / accW[cc], was = amt[cc] * (1 - f), now = mean * f;
        if (now > 0) {
          const cm = [0, 1, 2].map(m => Math.exp(accL[3 * cc + m] / accA[cc]));
          col.set(was > 0 ? pigmentMix(colAt(cc), cm, now / (was + now)) : cm, 3 * cc);
        }
        amt[cc] = was + now;
        accW[cc] = 0; accA[cc] = 0; accL[3 * cc] = accL[3 * cc + 1] = accL[3 * cc + 2] = 0;
      }
      touched.length = 0;
    });
  }
  return { h, strokes, tucks };
}
