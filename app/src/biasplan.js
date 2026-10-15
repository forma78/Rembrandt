// BIAS's plan — a plaid on the bias (the owner, 2026-10-15, BIAS-plaid/: "a
// new way of painting, on the base of the CCD tab: absolutely the same palette
// and the same principle — DRAG Snake / DRAG Air. The only difference: the
// stripes not straight but diagonal"). Rectangles, as CCD's, each laid with
// two families of diagonal lanes, one step apart across them and one lane of
// each through the rectangle's bottom left corner: rising, / , at Angle above
// the horizontal; descending, \ , square to it (his scheme IMAGE 2026-10-15
// 10:52:30, and the tartans of BIAS-plaid/) or its mirror (his sketch
// 10:30:04).
//
// Four runs, the brush never on a lane already painted (the owner: "if the
// step is 32 mm it goes back not along the same trajectory, nor the next one,
// +32 mm, but skipping one, +64 mm … the brush must not drive over the ones
// already painted"): 1 rising, every other lane, from the bottom right corner
// up to the top left (10:52:26: "the brush starts rising from the bottom right
// corner and reaches the top left"); 2 descending, every other lane, from the
// top right corner down ("to come down the brush may move to the top right
// corner, that is allowed; there are no rules here"); 3 rising again, the
// lanes skipped; 4 descending again, the lanes skipped ("the machine does not
// stop there … That is all"). The snake turns off the rectangle, past its
// edge, so its step never crosses a lane; between the runs the brush lifts and
// flies, no stop.
//
// The paint (his hand test, 10:30:07 … 10:30:35): squeezed along the
// rectangle's edges, where every lane lands, and along vertical rows inside —
// one down the middle on the 20 × 20 — in sausages of TAPE's paints, a stripe
// of the row each; MARKS where they go; the Result the brush through them, run
// after run, the later lanes through the earlier's wet paint.
//
// A rectangle's mm: from the canvas's bottom left corner, x right, y up, as a
// ruler reads them; the runs for the machine from the canvas's centre
// (toMachine). Lines only. No DOM.

import { toMachine } from './band.js';
import { pieceLen } from './strokes.js';
import { PAINT, stripesOf } from './tapeplan.js';
import { CCD_META, dealPaints, isThin, paintOf, GROOVE_K, HOLD, FILM, PICK_BULK, PICK_FILM, DRY, THIN, SAUSAGE_W, MARKS_DIP, MARK_GAP, MARK_DOT, OFF, MIN_SIDE, DENSITY_NEW } from './ccdplan.js';
import { linOf, toSrgb, pigmentMix } from './color.js';

export { OFF, MIN_SIDE, SAUSAGE_W, MARKS_DIP, DENSITY_NEW };
export const BIAS_META = CCD_META;                   // CCD's meta 1 … 4, "absolutely the same palette"
export const ANGLE_NEW = 26.6, ANGLE_MIN = 5, ANGLE_MAX = 85;   // °: his sketches, the corner to the middle of the far side (1 : 2)
export const STEP_NEW = 32, STEP_MIN = 1, STEP_MAX = 200;       // mm, lane centre to lane centre across them: the owner's 32
export const ROWS_NEW = 3, ROWS_MIN = 2, ROWS_MAX = 12;         // vertical rows, both sides in: 3, the sides and the middle, his hand test
export const CROSSES = ['square', 'mirror'], MODES = ['snake', 'air'];
export const MIN_LANE = 1;          // mm: a shorter lane, a corner's touch, is none
export const CLEAR_NEW = 2;         // mm: the brush's edge past the rectangle's at a snake's turn, est.
export const ARROW = { A: '↗', B: '↘' };
export const RUN_NAME = ['', 'rising, every other lane', 'descending, every other lane', 'rising, the lanes skipped', 'descending, the lanes skipped'];

const fin = Number.isFinite, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const ids = a => Array.isArray(a) && a.every(id => PAINT[id]);
const cleanPalette = q => q && typeof q.name === 'string' && ids(q.core) && ids(q.accent) ? { name: q.name, core: q.core.slice(), accent: q.accent.slice() } : null;
// a rectangle as it may be kept: whatever is wrong in it put right, or null
export function cleanRect(r) {
  if (!r || ![r.x, r.y, r.w, r.h].every(fin)) return null;
  const pat = cleanPat(r.pat);
  return { x: r.x, y: r.y, w: Math.max(MIN_SIDE, r.w), h: Math.max(MIN_SIDE, r.h),
    angle: fin(r.angle) ? clamp(r.angle, ANGLE_MIN, ANGLE_MAX) : ANGLE_NEW, step: fin(r.step) && r.step > 0 ? clamp(r.step, STEP_MIN, STEP_MAX) : STEP_NEW,
    cross: r.cross === 'mirror' ? 'mirror' : 'square', rows: fin(r.rows) ? Math.round(clamp(r.rows, ROWS_MIN, ROWS_MAX)) : ROWS_NEW, ...(pat ? { pat } : {}) };
}
// a pattern as it may be kept: its rows' sausages as fractions along each, [f0, f1, paint | null]; or null
export function cleanPat(q) {
  if (!q || !q.segs || typeof q.segs !== 'object') return null;
  const segs = {};
  for (const [k, a] of Object.entries(q.segs)) if (Array.isArray(a)) segs[k] = a.filter(s => Array.isArray(s) && fin(s[0]) && fin(s[1]) && s[0] >= 0 && s[0] < s[1] && s[1] <= 1 + 1e-9).map(s => [s[0], Math.min(1, s[1]), PAINT[s[2]] ? s[2] : null]);
  return { segs, palette: cleanPalette(q.palette), seed: fin(q.seed) ? q.seed : 0 };
}

// ---------- the lanes ----------
// A family: u the way its forward stroke runs — rising ↗ at Angle; descending
// ↘ square to it, or its mirror — n square to u, its lanes in order along n:
// the rising ones from the bottom right corner to the top left, the
// descending ones from the bottom left to the top right.
export function familiesOf(r) {
  const t = r.angle * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
  return [[c, s], r.cross === 'mirror' ? [c, -s] : [s, -c]].map((u, i) => ({ key: i ? 'B' : 'A', u, n: [-u[1], u[0]] }));
}
const cornersOf = r => [[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h]];
// the line n·p = c through the rectangle → its chord along u, a to b, or null
function chord(r, F, c) {
  const P = [F.n[0] * c, F.n[1] * c];
  let t0 = -Infinity, t1 = Infinity;
  for (const [ax, lo, hi] of [[0, r.x, r.x + r.w], [1, r.y, r.y + r.h]]) {
    const u = F.u[ax], p = P[ax];
    if (Math.abs(u) < 1e-12) { if (p < lo - 1e-9 || p > hi + 1e-9) return null; continue; }
    let a = (lo - p) / u, b = (hi - p) / u; if (a > b) [a, b] = [b, a];
    t0 = Math.max(t0, a); t1 = Math.min(t1, b);
  }
  if (!(t1 - t0 >= MIN_LANE)) return null;
  return { a: [P[0] + F.u[0] * t0, P[1] + F.u[1] * t0], b: [P[0] + F.u[0] * t1, P[1] + F.u[1] * t1], len: t1 - t0 };
}
// A family's lanes, a step apart across them, k = 0 through the bottom left
// corner ("from the bottom left corner", 2026-10-15): [{ fam, k, a, b, len }] in order along n
export function familyLanes(r, F) {
  const c0 = dot(F.n, [r.x, r.y]), cs = cornersOf(r).map(p => dot(F.n, p)), lo = Math.min(...cs), hi = Math.max(...cs), out = [];
  for (let k = Math.ceil((lo - c0) / r.step - 1e-9); c0 + k * r.step <= hi + 1e-9; k++) { const q = chord(r, F, c0 + k * r.step); if (q) out.push({ fam: F.key, k, ...q }); }
  return out;
}
// The four runs: 1 the rising lanes from the bottom right corner up, every
// other one — the lowest first; 2 the descending ones from the top right corner
// down, every other one — the highest first; 3 and 4 the lanes they skipped,
// the same ways. → [{ n, fam, F, lanes }]
export function runsOf(r) {
  const [FA, FB] = familiesOf(r), A = familyLanes(r, FA), B = familyLanes(r, FB).reverse();
  const a0 = A[0]?.k ?? 0, b0 = B[0]?.k ?? 0, even = (L, k) => L.filter(l => (l.k - k) % 2 === 0), odd = (L, k) => L.filter(l => (l.k - k) % 2 !== 0);
  return [even(A, a0), even(B, b0), odd(A, a0), odd(B, b0)].map((lanes, i) => ({ n: i + 1, fam: i % 2 ? 'B' : 'A', F: i % 2 ? FB : FA, lanes }));
}
// The plan: every rectangle with its runs, in the order they run
export function planOf(rects) {
  const out = rects.map((r, i) => { const runs = runsOf(r); return { ...r, i, runs, lanes: runs.reduce((a, q) => a + q.lanes.length, 0) }; });
  return { rects: out, lanes: out.reduce((a, r) => a + r.lanes, 0), length: out.reduce((a, r) => a + r.runs.reduce((s, q) => s + q.lanes.reduce((t, l) => t + l.len, 0), 0), 0) };
}

// ---------- the brush's way ----------
// how far a point is from the rectangle, 0 inside
export const distTo = (r, p) => Math.hypot(Math.max(r.x - p[0], 0, p[0] - r.x - r.w), Math.max(r.y - p[1], 0, p[1] - r.y - r.h));
// how far on from p, along d, until the brush's centre is d0 clear of the rectangle
function clearAlong(r, p, d, d0) {
  if (!(d0 > 0)) return 0;
  const at = s => distTo(r, [p[0] + d[0] * s, p[1] + d[1] * s]);
  let lo = 0, hi = 2 * d0 + 1;
  while (at(hi) < d0 && hi < 1e5) hi *= 2;
  for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (at(m) >= d0) hi = m; else lo = m; }
  return hi;
}
// the nearest a segment comes to the rectangle (the distance is convex along it)
function segClear(r, a, b) {
  const f = t => distTo(r, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  let lo = 0, hi = 1;
  for (let i = 0; i < 60; i++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (f(m1) < f(m2)) hi = m2; else lo = m1; }
  return Math.min(f(0), f(1), f((lo + hi) / 2));
}
// the snake's step from a lane's end to the next one's start, off the
// rectangle: straight, or round the corner between them, d0 out on both axes
function stepAround(r, A, B, d0) {
  if (segClear(r, A, B) >= d0 - 1e-6) return [];
  let best = null;
  for (const [cx, cy, sx, sy] of [[r.x, r.y, -1, -1], [r.x + r.w, r.y, 1, -1], [r.x + r.w, r.y + r.h, 1, 1], [r.x, r.y + r.h, -1, 1]]) {
    const C = [cx + sx * d0, cy + sy * d0], L = Math.hypot(C[0] - A[0], C[1] - A[1]) + Math.hypot(B[0] - C[0], B[1] - C[1]);
    if (segClear(r, A, C) >= d0 - 1e-6 && segClear(r, C, B) >= d0 - 1e-6 && (!best || L < best.L)) best = { C, L };
  }
  return best ? [best.C] : [];
}
const along = (p, d, s) => [p[0] + d[0] * s, p[1] + d[1] * s];
// A lane as the brush runs it: forward, or back on every other one of the snake
export const strokeOf = (run, l, back) => back ? { from: l.b, to: l.a, u: [-run.F.u[0], -run.F.u[1]] } : { from: l.a, to: l.b, u: run.F.u };
// One run as the snake: its lanes forward, back, forward … with the brush
// down, the brush landing o.before mm before its first lane's edge and
// lifting o.past mm past its last's; at every other end it runs on till it is
// o.clear mm clear of the rectangle, steps across off it — round the corner
// between if it must — and comes back in on the next lane, so it never
// touches the lane between, nor a painted one. → { pts, ends: the index in
// pts where every lane ends }
export function snakeOf(r, run, o) {
  const d0 = (o.brush || 0) / 2 + (o.clear ?? CLEAR_NEW), pts = [], ends = [], n = run.lanes.length;
  run.lanes.forEach((l, j) => {
    const s = strokeOf(run, l, j % 2 === 1), back = [-s.u[0], -s.u[1]];
    const a = j ? along(s.from, back, clearAlong(r, s.from, back, d0)) : along(s.from, back, o.before || 0);
    if (j) pts.push(...stepAround(r, pts.at(-1), a, d0));
    pts.push(a, j < n - 1 ? along(s.to, s.u, clearAlong(r, s.to, s.u, d0)) : along(s.to, s.u, o.past || 0));
    ends.push(pts.length - 1);
  });
  return { pts, ends };
}
// The lanes one way, through the air: each from o.before mm before its edge to o.past past the far one
export const airOf = (run, l, o) => { const s = strokeOf(run, l, false); return [along(s.from, s.u, -(o.before || 0)), along(s.to, s.u, o.past || 0)]; };

// DRAG's rows for plotRun, mm from the canvas's centre (the owner, 2026-10-15:
// "DRAG Snake / DRAG Air", CCD's): the snake, a run a row — its lanes forward
// and back with the brush down, stopsAt their ends, so a PAUSE falls there,
// never on a lane; in the air, a lane a row, one way — the rising ones ↗, the
// descending ones ↘ — the brush lifting past the far edge and flying to the
// next. The four runs one after another with no stop: between them the brush
// lifts and flies ("there are no rules here"). A stop before every next
// rectangle — its paints squeezed.
export const stopWhy = r => `Rectangle ${r.i + 1}: wipe the brush, squeeze its paints along its edges and rows, then Continue`;
const lanesWord = n => `${n} lane${n === 1 ? '' : 's'}`;
export function dragRows(pl, o) {
  const ps = [], info = [], stops = [], at = q => toMachine([q[0] - o.cw / 2, o.ch / 2 - q[1]]), snake = o.mode === 'snake';
  let length = 0;
  for (const r of pl.rects) {
    if (!r.lanes) continue;
    if (ps.length) stops.push({ at: ps.length, why: stopWhy(r) });
    for (const run of r.runs) {
      const n = run.lanes.length;
      if (!n) continue;
      if (snake) {
        const P = snakeOf(r, run, o), pieces = [], stopsAt = [], row = ps.length + 1;
        let acc = 0;
        P.pts.forEach((q, i) => {
          const p = P.pts[i - 1];
          if (p && Math.hypot(q[0] - p[0], q[1] - p[1]) > 1e-6) { const g = { t: 'L', a: at(p), b: at(q) }; pieces.push(g); acc += pieceLen(g); }
          if (i < P.pts.length - 1 && P.ends.includes(i)) stopsAt.push(acc);
        });
        ps.push(pieces.map((g, i) => ({ ...g, tilt: 0, row, ...(!i && stopsAt.length ? { stopsAt } : {}) })));
        info.push({ label: `Rectangle ${r.i + 1} · run ${run.n} ${ARROW[run.fam]} · ${n > 1 ? `${lanesWord(n)}, the snake` : 'one lane'}`, ri: r.i, run: run.n, L: acc });
        length += acc;
        continue;
      }
      run.lanes.forEach((l, j) => {
        const [a, b] = airOf(run, l, o), g = { t: 'L', a: at(a), b: at(b) }, L = pieceLen(g), row = ps.length + 1;
        ps.push([{ ...g, tilt: 0, row }]);
        info.push({ label: `Rectangle ${r.i + 1} · run ${run.n} ${ARROW[run.fam]} · lane ${j + 1} of ${n}`, ri: r.i, run: run.n, L });
        length += L;
      });
    }
  }
  return { ps, info, stops, runs: ps.length, length };
}
// DRAG's rows as plotRun's passes: a pass a rectangle, its why the stop's
export function dragPasses(R) {
  const cuts = [0, ...R.stops.map(q => q.at), R.ps.length];
  return cuts.slice(0, -1).map((a, k) => ({ key: 'DRAG', ps: R.ps.slice(a, cuts[k + 1]), why: k ? R.stops[k - 1].why : null })).filter(q => q.ps.length);
}
// The lanes as an SVG in canvas mm, y down, origin top left, as CCD's: a <path> a lane in running order, forward
const f2 = v => (Math.round(v * 100) / 100).toString();
export function dragSvg(pl, o) {
  const y = v => o.ch - v, rows = pl.rects.flatMap(r => r.runs.flatMap(run => run.lanes.map(l => `  <path d="M${f2(l.a[0])} ${f2(y(l.a[1]))} L${f2(l.b[0])} ${f2(y(l.b[1]))}" data-rect="${r.i + 1}" data-run="${run.n}" data-k="${l.k}"/>`)));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<!-- Rembrandt BIAS · drag · canvas ${o.cw}x${o.ch} mm, y down, origin top left. Each <path> is one brush-down lane, run by run in running order, drawn forward: the rising ones up to the right, the descending ones down to the right. -->\n<svg xmlns="http://www.w3.org/2000/svg" width="${o.cw}mm" height="${o.ch}mm" viewBox="0 0 ${o.cw} ${o.ch}">\n<g id="drag" data-ink="none" data-brush-mm="${o.brush}" fill="none" stroke="#24221F" stroke-width="1">\n${rows.join('\n')}\n</g>\n</svg>\n`;
}

// ---------- the paints: sausages along the edges and the rows ----------
// The rows: the rectangle's four edges, a sausage's half in from each — the
// sides' between the bottom's and the top's — and vertical rows inside,
// evenly, Rows counting the sides (his hand test: the edges all round and one
// down the middle). A row cut into stripes of 1, 2, 3 or 6 units, half a step
// each (TAPE's stripesOf; Claude's unit), a paint each or none.
export const unitOf = r => r.step / 2;
export function rowsOf(r) {
  const i = SAUSAGE_W / 2, n = r.rows ?? ROWS_NEW, out = [
    { key: 'B', a: [r.x, r.y + i], b: [r.x + r.w, r.y + i] },
    { key: 'R', a: [r.x + r.w - i, r.y + SAUSAGE_W], b: [r.x + r.w - i, r.y + r.h - SAUSAGE_W] },
    { key: 'T', a: [r.x, r.y + r.h - i], b: [r.x + r.w, r.y + r.h - i] },
    { key: 'L', a: [r.x + i, r.y + SAUSAGE_W], b: [r.x + i, r.y + r.h - SAUSAGE_W] },
  ];
  for (let j = 1; j < n - 1; j++) { const x = r.x + r.w * j / (n - 1); out.push({ key: `M${j}/${n}`, a: [x, r.y + SAUSAGE_W], b: [x, r.y + r.h - SAUSAGE_W] }); }
  return out.map(q => ({ ...q, len: Math.hypot(q.b[0] - q.a[0], q.b[1] - q.a[1]) })).filter(q => q.len >= 1);
}
const hashOf = s => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
// a row's stripes, as many units as fit, its own seed off the pattern's
function segsFor(row, r, pal, seed) {
  const s = (seed ^ hashOf(row.key)) >>> 0, nU = Math.max(1, Math.round(row.len / unitOf(r))), st = stripesOf(nU, s);
  const paint = pal ? dealPaints(st, 1, pal, s).map(q => q[0]) : st.map(() => null);
  return st.map(([k0, k1], i) => [k0 / nU, (k1 + 1) / nU, paint[i]]);
}
// A new pattern on a rectangle as it is: every row's stripes anew, their paints dealt
export function newPattern(r, pal, seed) {
  const segs = {};
  for (const row of rowsOf(r)) segs[row.key] = segsFor(row, r, pal, seed);
  return { segs, palette: pal, seed };
}
// Its paints dealt again — another palette — the stripes in their places; a row with none yet laid
export function recolour(r, pat, pal, seed) {
  const segs = {};
  for (const row of rowsOf(r)) {
    const was = pat.segs[row.key] || segsFor(row, r, null, seed), units = was.map(([f0, f1]) => [0, Math.max(0, Math.round((f1 - f0) * row.len / unitOf(r)) - 1)]);
    const paint = dealPaints(units, 1, pal, (seed ^ hashOf(row.key)) >>> 0).map(q => q[0]);
    segs[row.key] = was.map(([f0, f1], i) => [f0, f1, paint[i]]);
  }
  return { segs, palette: pal, seed };
}
// Rows changed: the edges' sausages kept, the rows inside laid anew in the palette, or empty
export function reRows(r) {
  if (!r.pat) return r.pat;
  const segs = {};
  for (const row of rowsOf(r)) segs[row.key] = r.pat.segs[row.key] || segsFor(row, r, r.pat.palette, r.pat.seed);
  return { ...r.pat, segs };
}
// The sausages: a stripe of a row with a paint, SAUSAGE_W across it, a mm
// apart along it → [{ key, s, paint, thin, a, b (its centre line), box: [x, y, w, h], len }]
export const SEG_GAP = 1;
export function sausagesOf(r) {
  if (!r.pat) return [];
  const out = [];
  for (const row of rowsOf(r)) {
    const segs = r.pat.segs[row.key]; if (!segs) continue;
    const d = [(row.b[0] - row.a[0]) / row.len, (row.b[1] - row.a[1]) / row.len], vert = Math.abs(d[0]) < 0.5;
    segs.forEach(([f0, f1, paint], s) => {
      if (!paint) return;
      const t0 = f0 * row.len + SEG_GAP / 2, t1 = f1 * row.len - SEG_GAP / 2;
      if (t1 - t0 < 0.5) return;
      const a = along(row.a, d, t0), b = along(row.a, d, t1);
      const box = vert ? [a[0] - SAUSAGE_W / 2, Math.min(a[1], b[1]), SAUSAGE_W, Math.abs(b[1] - a[1])] : [Math.min(a[0], b[0]), a[1] - SAUSAGE_W / 2, Math.abs(b[0] - a[0]), SAUSAGE_W];
      out.push({ key: row.key, s, paint, thin: isThin(r.pat.palette, paint), a, b, box, len: t1 - t0 });
    });
  }
  return out;
}
// The stripe of a row under a point, within a sausage's width and a bit: { key, s } or null
export function stripeAt(r, p, reach = SAUSAGE_W) {
  let best = null;
  for (const row of rowsOf(r)) {
    const d = [(row.b[0] - row.a[0]) / row.len, (row.b[1] - row.a[1]) / row.len], t = dot([p[0] - row.a[0], p[1] - row.a[1]], d);
    if (t < 0 || t > row.len) continue;
    const off = Math.abs((p[0] - row.a[0]) * d[1] - (p[1] - row.a[1]) * d[0]);
    if (off <= reach && (!best || off < best.off)) best = { key: row.key, f: t / row.len, off };
  }
  if (!best) return null;
  const segs = r.pat?.segs[best.key];
  const s = segs ? segs.findIndex(([f0, f1]) => best.f >= f0 && best.f <= f1) : -1;
  return { key: best.key, s, f: best.f };
}

// ---------- MARKS: where the sausages go ----------
// CCD's: a sausage a dash along its row, in watercolour from the cup, a dip
// before every MARKS_DIP-th; a round brush, so a dash's ends half a brush and
// MARK_GAP in from its ends — neighbours apart; a short one a dot. Row by row,
// the bottom, the right, the top, the left, then the rows inside, back and
// forth, rectangle by rectangle.
export function markOf(q, brush) {
  const h = Math.max(MARK_DOT / 2, q.len / 2 - brush / 2 - MARK_GAP), m = [(q.a[0] + q.b[0]) / 2, (q.a[1] + q.b[1]) / 2], d = [(q.b[0] - q.a[0]) / q.len, (q.b[1] - q.a[1]) / q.len];
  return { a: along(m, d, -h), b: along(m, d, h) };
}
export function marksRows(pl, o) {
  const ps = [], info = [], at = q => toMachine([q[0] - o.cw / 2, o.ch / 2 - q[1]]);
  let n = 0;
  for (const r of pl.rects) {
    const ss = sausagesOf(r), keys = [...new Set(ss.map(q => q.key))];
    keys.forEach((key, j) => {
      const row = ss.filter(q => q.key === key);
      if (j % 2) row.reverse();
      for (const q of row) {
        const m = markOf(q, o.brush), [a, b] = j % 2 ? [m.b, m.a] : [m.a, m.b];
        const g = { t: 'L', a: at(a), b: at(b) }, dip = n % MARKS_DIP === 0;
        n++; ps.push([{ ...g, tilt: 0, row: ps.length + 1, ...(o.ink && !dip ? { nodip: true } : {}) }]);
        info.push({ label: `Rectangle ${r.i + 1} · row ${rowName(key)} · ${PAINT[q.paint].name}`, ri: r.i, L: pieceLen(g) });
      }
    });
  }
  return { ps, info, marks: n };
}
export const rowName = key => ({ B: 'the bottom edge', R: 'the right edge', T: 'the top edge', L: 'the left edge' })[key] || `inside ${key.slice(1).split('/')[0]}`;

// ---------- the Result: the brush through the sausages, run after run (est.) ----------
// CCD's brush on a grid of the canvas a groove wide: the sausages laid on it
// first, then every lane in its order, every groove a walk through the cells
// — picking up what lies there, the earlier lanes' wet paint too, laying down
// what it carries (CCD's laneWalk, its numbers) — so the descending runs drag
// through the rising ones' paint, as on his canvas. A groove touches the four
// cells about it, each by its share, so a diagonal walk does not stair-step.
// The snake carries the brush from lane to lane and from run to run, HOLD at
// most over a turn; in the air every lane starts clean, as CCD's. → { h,
// strokes: [{ ri, run, k, g, start, u, n (samples h apart), rgb, cover, shade, w }] }
export function mixAll(pl, o) {
  const W = o.cw, H = o.ch, G = GROOVE_K.length, h = Math.min(2, Math.max(o.brush / G, Math.max(W, H) / 1400, 0.2));
  const nx = Math.max(1, Math.ceil(W / h)), ny = Math.max(1, Math.ceil(H / h)), amt = new Float32Array(nx * ny), col = new Float32Array(3 * nx * ny);
  // the four cells about a point and their shares (bilinear); off the canvas, none
  const quad = (x, y) => {
    const fx = x / h - 0.5, fy = y / h - 0.5, i0 = Math.floor(fx), j0 = Math.floor(fy), tx = fx - i0, ty = fy - j0, out = [];
    for (const [di, dj, w] of [[0, 0, (1 - tx) * (1 - ty)], [1, 0, tx * (1 - ty)], [0, 1, (1 - tx) * ty], [1, 1, tx * ty]]) {
      const i = i0 + di, j = j0 + dj;
      if (w > 1e-9 && i >= 0 && j >= 0 && i < nx && j < ny) out.push([j * nx + i, w]);
    }
    return out;
  };
  // what lies under a point: as thick as its cells by their shares, their colours mixed as pigments by what each holds there
  const under = Q => {
    let m = 0, ws = 0; const lg = [0, 0, 0];
    for (const [c, w] of Q) { ws += w; const v = w * amt[c]; if (!(v > 0)) continue; m += v; for (let q = 0; q < 3; q++) lg[q] += v * Math.log(Math.max(col[3 * c + q], 0.003)); }
    return { a: ws > 0 ? m / ws : 0, m, ws, rgb: m > 0 ? lg.map(v => Math.exp(v / m)) : null };
  };
  const colAt = c => [col[3 * c], col[3 * c + 1], col[3 * c + 2]];
  const put = (c, rgb, a) => { if (!(a > 0)) return; const t = a / (amt[c] + a); col.set(amt[c] > 0 ? pigmentMix(colAt(c), rgb, t) : rgb, 3 * c); amt[c] += a; };
  const V = paintOf(o.density ?? DENSITY_NEW), snake = o.mode === 'snake', before = o.before || 0, past = o.past || 0;
  for (const r of pl.rects) for (const q of sausagesOf(r)) {           // a sausage: V along a lane that crosses it, so V / SAUSAGE_W thick
    const v = V * (q.thin ? THIN : 1) / SAUSAGE_W, c = linOf(PAINT[q.paint].hex), [x0, y0, w, hh] = q.box;
    for (let j = Math.max(0, Math.floor(y0 / h)); j < Math.min(ny, Math.ceil((y0 + hh) / h)); j++) for (let i = Math.max(0, Math.floor(x0 / h)); i < Math.min(nx, Math.ceil((x0 + w) / h)); i++) {
      const cx = (i + 0.5) * h, cy = (j + 0.5) * h;
      if (cx >= x0 && cx <= x0 + w && cy >= y0 && cy <= y0 + hh) put(j * nx + i, c, v);
    }
  }
  // A lane is one pass of the brush: its grooves read the canvas as it was
  // before it — each sample once, CCD's laneWalk along them — and then the
  // canvas under it takes what they left, cell by cell by their shares
  const accW = new Float32Array(nx * ny), accA = new Float32Array(nx * ny), accL = new Float32Array(3 * nx * ny), touched = [];
  const strokes = [];
  for (const r of pl.rects) {
    const carry = GROOVE_K.map(() => null);                           // the brush across a turn, a groove each; clean at a rectangle's start, wiped at its stop
    for (const run of r.runs) run.lanes.forEach((l, j) => {
      const s = strokeOf(run, l, snake && j % 2 === 1), n = Math.max(2, Math.round((l.len + before + past) / h) + 1), F = run.F;
      const lane = GROOVE_K.map((_, g) => {
        const off = ((g + 0.5) / G - 0.5) * o.brush, start = [s.from[0] - s.u[0] * before + F.n[0] * off, s.from[1] - s.u[1] * before + F.n[1] * off];
        const Qs = Array.from({ length: n }, (_, i) => quad(start[0] + s.u[0] * i * h, start[1] + s.u[1] * i * h));
        return { start, Qs, Us: Qs.map(Q => Q.length ? under(Q) : null) };
      });
      lane.forEach(({ start, Qs, Us }, g) => {
        const [kv, kd, shade] = GROOVE_K[g], dry = DRY * kd, A = new Float32Array(n), C = new Float32Array(3 * n), rgb = new Float32Array(3 * n), cover = new Float32Array(n);
        let b = 0, bc = [0, 0, 0];
        if (snake && carry[g]) { b = Math.min(carry[g].b, HOLD); bc = carry[g].bc; }
        for (let i = 0; i < n; i++) {
          const U = Us[i];
          if (!U) continue;                                             // off the canvas: nothing under the brush
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
        strokes.push({ ri: r.i, run: run.n, k: l.k, g, start, u: s.u, n, h, rgb, cover, shade, w: o.brush / G });
      });
      for (const cc of touched) {                                       // the canvas under the lane: what the brush left, by how much of each cell it went over
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
  return { h, strokes };
}
