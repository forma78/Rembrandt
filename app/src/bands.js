// Bands: the lines of the painting, built from the curve (Rembrandt.md §3)
// and clipped to the image area. Lines and arcs only, in pt like the curve.
//
// Below the curve: exact offsets — the convex side of the dip, they do not
// fold there. Above it: vertical copies of the curve, Sonnet's way
// (adjustments/, 2026-10-01): they never fold and stay exact lines and arcs;
// on a slope they lie closer than the pitch, so neighbours overlap by
// 1 − cos(slope). Line k is centred (k − ½) pitches from the curve, so the
// edge of line 1 is the curve: the edge comes out sharp.
//
// Then the paint of every line, from the reference: each sample takes the
// nearest tube of its side, and what it missed by goes on to the next line
// at the same place — so neighbouring lines alternate where the reference
// lies between two tubes: optical mixing, as Sonnet did by hand. A run of
// one paint starts at its home and ends in its tail (§1, home and tail).
// No DOM.

import { P, dist } from './util.js';
import { segStart, segEnd, segLen, segAt } from './geometry.js';
import { offsetSegs } from './fillet.js';
import { moveSegBy } from './curve.js';

const EPS = 1e-9;

export const pathLength = segs => segs.reduce((a, g) => a + segLen(g), 0);
// The part of segment g for t in [t0, t1], 0 … 1 along it.
export function subSeg(g, t0, t1) {
  if (g.t === 'L') { const at = t => P(g.a.x + (g.b.x - g.a.x) * t, g.a.y + (g.b.y - g.a.y) * t); return { t: 'L', a: at(t0), b: at(t1) }; }
  return { t: 'A', c: g.c, r: g.r, a0: g.a0 + g.s * t0, s: g.s * (t1 - t0) };
}
const pointAt = (g, t) => g.t === 'L' ? P(g.a.x + (g.b.x - g.a.x) * t, g.a.y + (g.b.y - g.a.y) * t)
  : P(g.c.x + g.r * Math.cos(g.a0 + g.s * t), g.c.y + g.r * Math.sin(g.a0 + g.s * t));
// The point s along a path, with its direction.
export function pointAlong(segs, s) {
  for (const g of segs) { const L = segLen(g); if (s <= L + EPS) return segAt(g, Math.max(0, Math.min(L, s))); s -= L; }
  const g = segs[segs.length - 1]; return segAt(g, segLen(g));
}
// The path between s0 and s1 along it, exact lines and arcs.
export function cutPath(segs, s0, s1) {
  const out = []; let s = 0;
  for (const g of segs) {
    const L = segLen(g), a = Math.max(s0, s), b = Math.min(s1, s + L);
    if (L > EPS && b - a > EPS) out.push(subSeg(g, (a - s) / L, (b - s) / L));
    s += L; if (s >= s1) break;
  }
  return out;
}

// ---------- clipping to a rectangle {x0, y0, x1, y1} ----------
const inside = (q, R) => q.x >= R.x0 - 1e-7 && q.x <= R.x1 + 1e-7 && q.y >= R.y0 - 1e-7 && q.y <= R.y1 + 1e-7;
function crossings(g, R) {
  const ts = [];
  if (g.t === 'L') {
    const dx = g.b.x - g.a.x, dy = g.b.y - g.a.y;
    for (const X of [R.x0, R.x1]) if (Math.abs(dx) > EPS) ts.push((X - g.a.x) / dx);
    for (const Y of [R.y0, R.y1]) if (Math.abs(dy) > EPS) ts.push((Y - g.a.y) / dy);
  } else {
    const at = th => { for (let n = -3; n <= 3; n++) ts.push((th + 2 * Math.PI * n - g.a0) / g.s); };
    for (const X of [R.x0, R.x1]) { const c = (X - g.c.x) / g.r; if (Math.abs(c) <= 1) { const a = Math.acos(c); at(a); at(-a); } }
    for (const Y of [R.y0, R.y1]) { const c = (Y - g.c.y) / g.r; if (Math.abs(c) <= 1) { const a = Math.asin(c); at(a); at(Math.PI - a); } }
  }
  return ts.filter(t => t > EPS && t < 1 - EPS);
}
// The parts of a path inside R, each a path of its own.
export function clipSegs(segs, R) {
  const pieces = []; let cur = null;
  for (const g of segs) {
    if (segLen(g) < EPS) continue;
    const ts = [0, ...crossings(g, R).sort((a, b) => a - b), 1];
    for (let i = 0; i < ts.length - 1; i++) {
      const t0 = ts[i], t1 = ts[i + 1];
      if (t1 - t0 < EPS) continue;
      if (!inside(pointAt(g, (t0 + t1) / 2), R)) { cur = null; continue; }
      const h = subSeg(g, t0, t1);
      if (cur && dist(segEnd(cur[cur.length - 1]), segStart(h)) < 1e-6) cur.push(h);
      else { cur = [h]; pieces.push(cur); }
    }
  }
  return pieces.filter(p => pathLength(p) > 1e-6);
}

// ---------- the lines ----------
// segs: the curve, kinks already rounded (fillet.js); pitch and area in pt.
// Returns [{ side: 'below' | 'above', k, pieces: [path, …] }], k from 1 at
// the curve outwards; lines that miss the area are left out.
export function buildLanes(segs, { pitch, area }) {
  if (!segs.length || !(pitch > 0)) return [];
  const mid = pointAlong(segs, pathLength(segs) / 2);
  const down = mid.dx >= 0 ? 1 : -1;                // offsetSegs: + is to the right of travel — down, for a curve drawn left to right
  const K = Math.ceil(Math.hypot(area.x1 - area.x0, area.y1 - area.y0) / pitch) + 2;
  const lanes = [];
  for (let k = 1; k <= K; k++) {
    const pieces = clipSegs(offsetSegs(segs, down * (k - 0.5) * pitch), area);
    if (pieces.length) lanes.push({ side: 'below', k, pieces, off: (k - 0.5) * pitch, down });
  }
  for (let k = 1; k <= K; k++) {
    const pieces = clipSegs(segs.map(g => moveSegBy(g, P(0, -(k - 0.5) * pitch))), area);
    if (pieces.length) lanes.push({ side: 'above', k, pieces, off: (k - 0.5) * pitch });
  }
  return lanes;
}
// The steepest slope of the curve, in degrees: above it the vertical copies
// overlap most there.
export function steepest(segs) {
  let m = 0;
  for (const g of segs) {
    const L = segLen(g), n = g.t === 'L' ? 1 : Math.max(2, Math.ceil(Math.abs(g.s) / 0.05));
    for (let i = 0; i <= n; i++) { const q = segAt(g, L * i / n); m = Math.max(m, Math.abs(Math.atan2(q.dy, q.dx))); }
  }
  const d = m * 180 / Math.PI; return d > 90 ? 180 - d : d;
}

// ---------- the paint of the lines ----------
// sample(x, y) → OKLab [L, a, b] of the reference there, or null;
// tubes: { below: [{ id, lab }], above: [...] }; step and minRun in pt;
// bucket: the width (pt) of the places the miss is carried in; guard: the
// lines nearer the curve than this read the reference at this distance from
// it, so the edge of the reference — a few mm off a hand-drawn curve — does
// not colour them.
// Returns the runs: { side, k, piece, tube, s0, s1, len, home, tailAtEdge, segs }.
export function paintLanes(lanes, { sample, tubes, step, minRun, bucket, damp = 0.85, lightness, guard = 0 }) {
  const runs = [];
  for (const side of ['below', 'above']) {
    const err = new Map(), list = tubes[side] || [];
    if (!list.length) continue;
    for (const lane of lanes.filter(l => l.side === side).sort((a, b) => a.k - b.k)) {
      lane.pieces.forEach((piece, pi) => {
        const Lp = pathLength(piece), n = Math.max(1, Math.round(Lp / step)), h = Lp / n, ids = [];
        for (let i = 0; i < n; i++) {
          const q = pointAlong(piece, (i + 0.5) * h), more = Math.max(0, guard - (lane.off || 0));
          const out = side === 'below' ? P(-q.dy * (lane.down || 1), q.dx * (lane.down || 1)) : P(0, -1);
          const lab = sample(q.x + out.x * more, q.y + out.y * more);
          if (!lab) { ids.push(null); continue; }
          const b = Math.floor(q.x / bucket), e = err.get(b) || [0, 0, 0];
          const t = lab.map((v, j) => v + damp * e[j]);
          let best = list[0], bd = Infinity;
          for (const tb of list) { const d = (tb.lab[0] - t[0]) ** 2 + (tb.lab[1] - t[1]) ** 2 + (tb.lab[2] - t[2]) ** 2; if (d < bd) { bd = d; best = tb; } }
          err.set(b, t.map((v, j) => v - best.lab[j]));
          ids.push(best.id);
        }
        // runs of one tube; a run shorter than minRun goes to its longer neighbour
        let rs = [];
        ids.forEach((id, i) => { const last = rs[rs.length - 1]; if (last && last.id === id) last.n++; else rs.push({ id, i, n: 1 }); });
        for (;;) {
          let w = -1;
          rs.forEach((r, i) => { if (r.id && !r.keep && r.n * h < minRun && (w < 0 || r.n < rs[w].n)) w = i; });
          if (w < 0) break;
          const a = rs[w - 1]?.id ? rs[w - 1] : null, c = rs[w + 1]?.id ? rs[w + 1] : null;
          const into = a && c ? (a.n >= c.n ? a : c) : a || c;
          if (!into) { rs[w].keep = true; continue; }       // alone between gaps: it stays
          if (into === c) c.i = rs[w].i;
          into.n += rs[w].n; rs.splice(w, 1);
          rs = rs.reduce((o, r) => { const l = o[o.length - 1]; if (l && l.id === r.id) l.n += r.n; else o.push(r); return o; }, []);
        }
        rs.forEach((r, i) => {
          if (!r.id) return;
          const s0 = r.i * h, s1 = (r.i + r.n) * h, L = lightness(r.id);
          const score = (atEdge, nb) => atEdge ? 2 : !nb || !nb.id ? 2 : lightness(nb.id) > L ? -1 : 1;
          const sStart = score(s0 < 1e-6, rs[i - 1]), sEnd = score(s1 > Lp - 1e-6, rs[i + 1]);
          const home = sEnd > sStart ? 'end' : 'start';
          const tailAtEdge = home === 'start' ? (s1 > Lp - 1e-6 || !rs[i + 1]?.id) : (s0 < 1e-6 || !rs[i - 1]?.id);
          runs.push({ side, k: lane.k, piece: pi, tube: r.id, s0, s1, len: s1 - s0, home, tailAtEdge, segs: cutPath(piece, s0, s1) });
        });
      });
    }
  }
  return runs;
}
