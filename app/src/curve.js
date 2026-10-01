// The curve: the one master path of a painting (Rembrandt.md §3). Lines (L)
// and arcs (A) only, in pt as in RUBENS (geometry.js has the segment shapes).
//
// Editing by numbers, as in Illustrator (the owner, 2026-10-01): a segment
// takes new numbers and the rest of the curve follows it rigidly — turned by
// as much as the segment's end turned, moved to its new end. An arc keeps the
// direction it starts with, so it stays tangent to the segment before it.
// No DOM.

import { P, sub, add, dist, rad, deg, mod } from './util.js';
import { segStart, segEnd, segLen, segAt, segDirStart, segDirEnd } from './geometry.js';

const turn = (q, o, c, s) => P(o.x + (q.x - o.x) * c - (q.y - o.y) * s, o.y + (q.x - o.x) * s + (q.y - o.y) * c);

// Turn a segment by th (radians, clockwise on screen as everywhere here) about o.
export function rotateSeg(g, o, th) {
  const c = Math.cos(th), s = Math.sin(th);
  if (g.t === 'L') return { t: 'L', a: turn(g.a, o, c, s), b: turn(g.b, o, c, s) };
  return { ...g, c: turn(g.c, o, c, s), a0: g.a0 + th };
}
export function moveSegBy(g, d) {
  return g.t === 'L' ? { t: 'L', a: add(g.a, d), b: add(g.b, d) } : { ...g, c: add(g.c, d) };
}

// The numbers the panel shows. Angles as on a drawing: counter-clockwise
// from "to the right", y up — the same as RUBENS's segment labels.
// Line: length (pt) and angle (degrees, 0…360). Arc: radius (pt), sweep
// (degrees, positive) and which way it turns along the curve.
export function segNumbers(g) {
  if (g.t === 'L') return { t: 'L', length: segLen(g), angle: mod(-deg(Math.atan2(g.b.y - g.a.y, g.b.x - g.a.x)), 360) };
  return { t: 'A', radius: g.r, sweep: Math.abs(deg(g.s)), side: g.s > 0 ? 'right' : 'left' };
}

// Segment i rebuilt from its start with new numbers (any of them may be left
// out); the segments after it follow. Returns a new list, segs is not touched.
export function setSegNumbers(segs, i, nums) {
  const old = segs[i], cur = segNumbers(old), n = { ...cur, ...nums };
  const A = segStart(old);
  let g;
  if (old.t === 'L') {
    const th = -rad(n.angle), L = Math.max(n.length, 1e-6);
    g = { t: 'L', a: A, b: P(A.x + L * Math.cos(th), A.y + L * Math.sin(th)) };
  } else {
    const d = segDirStart(old), r = Math.max(n.radius, 1e-6), right = n.side === 'right';
    const nrm = right ? P(-d.y, d.x) : P(d.y, -d.x);   // towards the centre
    const c = P(A.x + nrm.x * r, A.y + nrm.y * r);
    g = { t: 'A', c, r, a0: Math.atan2(A.y - c.y, A.x - c.x), s: (right ? 1 : -1) * rad(Math.max(n.sweep, 1e-3)) };
  }
  const e0 = segEnd(old), e1 = segEnd(g), d0 = segDirEnd(old), d1 = segDirEnd(g);
  const th = Math.atan2(d1.y, d1.x) - Math.atan2(d0.y, d0.x), shift = sub(e1, e0);
  return segs.map((s, j) => j < i ? s : j === i ? g : moveSegBy(rotateSeg(s, e0, th), shift));
}

// The whole curve scaled about its start: lines longer, radii larger, the
// angles and sweeps as they were — the same shape, another length.
export function scaleCurve(segs, k) {
  if (!segs.length) return segs;
  const o = segStart(segs[0]), at = q => P(o.x + (q.x - o.x) * k, o.y + (q.y - o.y) * k);
  return segs.map(g => g.t === 'L' ? { t: 'L', a: at(g.a), b: at(g.b) } : { ...g, c: at(g.c), r: g.r * k });
}

export function curveInfo(segs) {
  const lines = segs.filter(g => g.t === 'L').length;
  return { lines, arcs: segs.length - lines, length: segs.reduce((a, g) => a + segLen(g), 0) };
}

// The segment nearest to q, if closer than lim; null otherwise.
export function nearestSeg(segs, q, lim) {
  let best = null, bd = lim;
  segs.forEach((g, i) => {
    const L = segLen(g), n = Math.max(2, Math.ceil(L / (lim / 2)));
    for (let j = 0; j <= n; j++) { const s = segAt(g, L * j / n), d = dist(s, q); if (d < bd) { bd = d; best = i; } }
  });
  return best;
}

// A curve from turtle steps: start point, start direction (degrees,
// clockwise on screen), then ['L', length] or ['R' | 'T', radius, degrees]
// — an arc turning right or left. As RUBENS's demo builds its strokes.
export function buildCurve(start, dirDeg, ops) {
  const segs = [];
  let pos = { ...start }, d = P(Math.cos(rad(dirDeg)), Math.sin(rad(dirDeg)));
  for (const [op, a, b] of ops) {
    let g;
    if (op === 'L') g = { t: 'L', a: { ...pos }, b: P(pos.x + d.x * a, pos.y + d.y * a) };
    else {
      const right = op === 'R', n = right ? P(-d.y, d.x) : P(d.y, -d.x), c = P(pos.x + n.x * a, pos.y + n.y * a);
      g = { t: 'A', c, r: a, a0: Math.atan2(pos.y - c.y, pos.x - c.x), s: (right ? 1 : -1) * rad(b) };
    }
    segs.push(g); pos = segEnd(g); d = segDirEnd(g);
  }
  return segs;
}
