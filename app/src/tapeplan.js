// TAPE's plan — a cassette in the centre, its tape wound round it (the
// owner, 2026-10-12, TAPE-Claude/: a hand-painted cassette in the centre,
// the tape painted by the machine with the brush, after Werner Bronkhorst;
// "only to restore Soumkine, on Etsy"). The geometry is chat-Claude's
// approved prototype v0.3 (TAPE-Claude/reference/TAPE-prototype.html; the
// owner: "everything is super now"), its numbers the acceptance's
// (TAPE-Claude/reference/acceptance.json).
//
// Every lane a rounded rectangle whose four corner arcs share one centre, so
// lane k+1 lies one pitch outside lane k all the way round, corners
// included. A lane is cut into 9 pieces from the seam, the middle of its
// right side, clockwise on the screen: u = the piece + its fraction, 0 … 9,
// the same u on two lanes the same spot across the tape. The lane change
// (the owner: "×24 or even ×48! Let it curl invisibly, elegantly, as a
// spiral"): lane k to k+1 over Lb mm from the seam, f(u) = smoothstep(L0(u) /
// Lb) — one f for every lane, so neighbours drift out together and never
// bunch or part.
//
// mm from the canvas's centre, x right, y down, as the prototype's; the
// machine's from there (toMachine). The samples are the prototype's — the
// runs, the segments and the numbers come from them — and the machine gets
// lines and arcs (Rembrandt.md §1): a lane's own pieces exact, a lane change
// fitted with biarcs (fitPieces, FIT_MM). No DOM.

import { fitPieces, toMachine, DIP_RUN, LOOP_SHARE } from './band.js';
import { pieceLen, reverse, sweepOf } from './strokes.js';
import { linOf, toSrgb, pigmentMix } from './color.js';

export const REAL = { tape: 3.81, cassW: 100.4, cassH: 63.8 };   // mm: a compact cassette's tape and shell
export const CASS_R = 1.8;            // mm: the shell's corner radius in cassette_trace.svg (body-1)
export const DEFAULT_CASS = { vx: 0, vy: 0, vw: 100.4, vh: 63.8, mmW: 100.4 };
// The prototype's settings, the owner's (TAPE.md, Controls). mode: the DRAG
// key last pressed, snake or air; step: the lane change in brush widths;
// keepDown: the brush down off the canvas too, no lift at its edges (the
// owner, 2026-10-12; false: the prototype's runs, for its acceptance)
export const DEFAULTS = {
  brush: 4, speed: 25, gap: 0, corners: 0, seam: 'shift', dir: 'cw', mode: 'snake',
  cassScale: 100, clear: 0, step: 48, segLen: 180, strokes: 3, overrun: 4, brushType: 'round', brushAngle: 45,
  traceCass: true, traceTape: true, keepDown: true,
};
export const MODES = ['snake', 'air'], SEAMS = ['shift', 'closed'], DIRS = ['cw', 'ccw'], BRUSH_TYPES = ['round', 'flat'];
// the prototype's estimate (TAPE.md, Moves): the air, a lift and a lower, the pencil — est.
export const AIR_SPEED = 80, LIFT_S = 0.8, TRACE_SPEED = 40;
export const TINY = 12;               // mm: a segment shorter is a corner piece, warned about

// ---------- the cassette's box: real size, centred ----------
export function cassBox(o) {
  const C = o.cass || DEFAULT_CASS, k = o.cassScale / 100, w = (C.mmW || REAL.cassW) * k, h = w * C.vh / C.vw;
  return { w, h, k, r: CASS_R * w / REAL.cassW };
}

// ---------- a lane: a rounded rectangle in 9 pieces ----------
export function rrGeo(a, b, r) {
  r = Math.max(0, Math.min(r, a, b));
  const sa = a - r, sb = b - r, q = Math.PI * r / 2;
  const len = [sb, q, 2 * sa, q, 2 * sb, q, 2 * sa, q, sb], c = [0];
  let P = 0;
  for (const L of len) { P += L; c.push(P); }
  return { a, b, r, sa, sb, len, c, P };
}
export function rrU(g, u) {
  let i = Math.floor(u), f = u - i;
  if (i >= 9) { i = 8; f = 1; } if (i < 0) { i = 0; f = 0; }
  const { a, b, r, sa, sb } = g;
  let th;
  switch (i) {
    case 0: return { x: a, y: f * sb, tx: 0, ty: 1 };
    case 1: th = f * Math.PI / 2; return { x: sa + r * Math.cos(th), y: sb + r * Math.sin(th), tx: -Math.sin(th), ty: Math.cos(th) };
    case 2: return { x: sa - 2 * sa * f, y: b, tx: -1, ty: 0 };
    case 3: th = Math.PI / 2 + f * Math.PI / 2; return { x: -sa + r * Math.cos(th), y: sb + r * Math.sin(th), tx: -Math.sin(th), ty: Math.cos(th) };
    case 4: return { x: -a, y: sb - 2 * sb * f, tx: 0, ty: -1 };
    case 5: th = Math.PI + f * Math.PI / 2; return { x: -sa + r * Math.cos(th), y: -sb + r * Math.sin(th), tx: -Math.sin(th), ty: Math.cos(th) };
    case 6: return { x: -sa + 2 * sa * f, y: -b, tx: 1, ty: 0 };
    case 7: th = 1.5 * Math.PI + f * Math.PI / 2; return { x: sa + r * Math.cos(th), y: -sb + r * Math.sin(th), tx: -Math.sin(th), ty: Math.cos(th) };
    default: return { x: a, y: -sb + sb * f, tx: 0, ty: 1 };
  }
}
export const uToL = (g, u) => { const i = Math.floor(u); if (i >= 9) return g.P; return g.c[i] + (u - i) * g.len[i]; };
export function lToU(g, l) {
  if (l >= g.P - 1e-9) return 9;
  for (let i = 0; i < 9; i++) if (g.len[i] > 0 && l < g.c[i + 1]) return i + (l - g.c[i]) / g.len[i];
  return 9;
}
// u from u0 to u1, about step mm apart, always on the pieces' ends: a mitred corner stays sharp
export function uSamples(g, u0, u1, step) {
  const out = [];
  for (let i = Math.floor(u0); i < 9 && i < u1; i++) {
    const f0 = Math.max(0, u0 - i), f1 = Math.min(1, u1 - i);
    if (f1 <= f0) continue;
    const n = Math.max(1, Math.ceil((f1 - f0) * g.len[i] / step));
    for (let j = 1; j <= n; j++) out.push(i + f0 + (f1 - f0) * j / n);
  }
  return out;
}
export const smooth3 = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
export function inRR(x, y, a, b, r) {
  x = Math.abs(x); y = Math.abs(y);
  if (x > a || y > b) return false;
  r = Math.max(0, Math.min(r, a, b));
  const dx = x - (a - r), dy = y - (b - r);
  if (dx <= 0 || dy <= 0) return true;
  return dx * dx + dy * dy <= r * r;
}

// The lanes. Corners −50 … 0: sharp (mitred) → a true offset of the
// cassette's outline; 0 … +50: the shared corner centre slides to the
// cassette's, the lanes turning into circles (the owner: "from angle to
// rounded … but then on the fly").
export function family(o) {
  const w = o.brush, p = w + o.gap, cb = cassBox(o), v = o.corners;
  const mu = v < 0 ? (v + 50) / 50 : 1, lam = v > 0 ? v / 50 : 0;
  const ex = cb.w / 2 - cb.r, ey = cb.h / 2 - cb.r;
  const cx = ex * (1 - lam), cy = ey * (1 - lam);
  const R0 = lam * Math.hypot(ex, ey) + cb.r + o.clear + w / 2;
  const ring = k => { const R = R0 + k * p; return { a: cx + R, b: cy + R, r: Math.max(0, mu * R) }; };
  return { w, p, cb, mu, lam, cx, cy, R0, ring };
}

// ---------- the plan: the samples, the runs on the canvas, the segments ----------
// o: the settings, the canvas cw × ch mm, the cassette (o.cass). Every
// sample remembers its span — a lane's arc, or a lane change — and its u
// there, for the machine's lines and arcs (piecesOf).
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export function planOf(oIn) {
  const o = { ...DEFAULTS, ...oIn }, F = family(o), { w, cb, ring } = F, Hx = o.cw / 2, Hy = o.ch / 2;
  const sy = o.dir === 'ccw' ? -1 : 1;                                           // counter-clockwise: mirrored top to bottom, the seam stays on the right
  const step = Math.max(0.6, Math.max(o.cw, o.ch) / 500);
  const fits = cb.w + 2 * w < o.cw && cb.h + 2 * w < o.ch;
  const geo = k => { const q = ring(k); return rrGeo(q.a, q.b, q.r); };
  const g0 = geo(0), Lb = Math.min(o.step * w, g0.P), U = lToU(g0, Lb), full = U >= 9;
  const blend = u => smooth3(uToL(g0, u) / Lb);                                 // one profile for every lane: neighbours never bunch or part
  const pts = [], spans = [];
  const add = (p, s, u, brk, l) => {                                              // l: the lane it lies on, k + f on a lane change (the paint's map)
    p.y *= sy; p.ty *= sy; p.s = s; p.u = u; p.l = l;
    const prev = pts.at(-1);
    if (!brk && prev) { const dx = p.x - prev.x, dy = p.y - prev.y, l = Math.hypot(dx, dy); if (l < 1e-6) return; p.tx = dx / l; p.ty = dy / l; }
    if (brk) p.brk = true;
    pts.push(p);
  };
  // the lane change: lane k → lane k + 1, from the seam to u = U (the whole turn when full)
  const band = (k, brk) => {
    const B0 = geo(k + 1), s = spans.push({ kind: 'change', k, u0: 0 }) - 1;
    if (k < 0 && B0.r > 0) {
      // the tape coming out from under the cassette: lane 1 pushed in along its own normal, so it keeps
      // the cassette's rounded corners (a "lane 0" would have a negative radius)
      [0, ...uSamples(B0, 0, U, step)].forEach((u, i) => { const B = rrU(B0, u), q = F.p * (1 - blend(u)); add({ x: B.x - B.ty * q, y: B.y + B.tx * q, tx: B.tx, ty: B.ty }, s, u, brk && i === 0, k + blend(u)); });
      return;
    }
    const A0 = geo(k);
    [0, ...uSamples(A0, 0, U, step)].forEach((u, i) => { const A = rrU(A0, u), B = rrU(B0, u), f = blend(u); add({ x: A.x + (B.x - A.x) * f, y: A.y + (B.y - A.y) * f, tx: A.tx, ty: A.ty }, s, u, brk && i === 0, k + f); });
  };
  const arc = (k, u0, u1, brk) => {
    const g = geo(k), us = uSamples(g, u0, u1, step), s = spans.push({ kind: 'lane', k, g, u0 }) - 1;
    if (brk) us.unshift(u0);
    us.forEach((u, i) => add(rrU(g, u), s, u, brk && i === 0, k));
  };
  const gone = k => { const q = ring(k); return inRR(Hx, Hy, q.a - w / 2, q.b - w / 2, q.r - w / 2); };   // lane k no longer touches the canvas
  let K = 0;
  if (fits) {
    if (o.seam === 'shift') {
      band(-1, true);                                                            // the tape comes out from under the cassette by the same lane change
      for (let k = 0; k < 600; k++) { if (gone(k)) break; if (!full) arc(k, U, 9, false); band(k, false); K = k + 1; }
    } else {
      for (let k = 0; k < 600; k++) { if (gone(k)) break; arc(k, 0, 9, true); K = k + 1; }
    }
  }
  let kSide = 0, kTop = 0;
  while (kSide < K && ring(kSide).a + w / 2 < Hx) kSide++;
  while (kTop < K && ring(kTop).b + w / 2 < Hy) kTop++;
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum[i] = cum[i - 1] + (pts[i].brk ? 0 : dist(pts[i - 1], pts[i]));
  // a lane counts as on the canvas while any of its width still touches it
  const ins = pts.map(q => Math.abs(q.x) <= Hx + w / 2 - 0.2 && Math.abs(q.y) <= Hy + w / 2 - 0.2);
  // the tape on the canvas, mm along the path: what a squeeze of paint has to cover
  const onCum = [0];
  for (let i = 1; i < pts.length; i++) onCum[i] = onCum[i - 1] + (!pts[i].brk && ins[i] && ins[i - 1] ? dist(pts[i - 1], pts[i]) : 0);
  // The runs, past the canvas's edge by the overrun at their ends. With
  // keepDown (the owner, 2026-10-12: "on the corners there is no need at all
  // to lift the head — the canvas sits firm on its supports on the table, the
  // brush just goes through the air and fits into the corners smoothly; we
  // only lose time on the lifts"; "really, let it just go without a lift, I
  // will be calmer"): a path's run from its first sample on the canvas to its
  // last, the stretches off it run with the brush down, in the air. Without,
  // the prototype's: every piece on the canvas a run of its own.
  const runs = [];
  const run = (i, j) => {
    let s = i, e = j;
    while (s > 0 && !pts[s].brk && cum[i] - cum[s - 1] <= o.overrun + step) s--;
    while (e < pts.length - 1 && !pts[e + 1].brk && cum[e + 1] - cum[j] <= o.overrun + step) e++;
    runs.push({ i0: s, i1: e, c0: i, c1: j });
  };
  for (let i = 0; i < pts.length;) {
    if (o.keepDown) {
      let e = i;
      while (e + 1 < pts.length && !pts[e + 1].brk) e++;                       // a path: i … e
      let c0 = i, c1 = e;
      while (c0 <= e && !ins[c0]) c0++;
      while (c1 >= c0 && !ins[c1]) c1--;
      if (c0 <= e) run(c0, c1);
      i = e + 1;
      continue;
    }
    if (!ins[i]) { i++; continue; }
    let j = i;
    while (j + 1 < pts.length && ins[j + 1] && !pts[j + 1].brk) j++;
    run(i, j);
    i = j + 1;
  }
  // The segments: a squeeze of paint each, equal lengths of a run. With
  // keepDown, equal lengths of the tape on the canvas, so every paint stop
  // falls on the canvas, never in the air past its edge.
  const segs = [], along = o.keepDown ? onCum : cum;
  for (const r of runs) {
    const L = along[r.i1] - along[r.i0], n = Math.max(1, Math.ceil(L / o.segLen - 0.15));
    let a = r.i0;
    for (let k = 1; k <= n; k++) {
      const target = along[r.i0] + L * k / n;
      let b = a;
      while (b < r.i1 && along[b] < target) b++;
      if (k === n) b = r.i1;
      if (b > a) segs.push({ i0: a, i1: b, len: cum[b] - cum[a] });
      a = b;
    }
  }
  // the moves, the prototype's: for its numbers and for Play the run
  const moves = [];
  let pos = null, paintLen = 0, airLen = 0, lifts = 0;
  segs.forEach((sg, idx) => {
    const P = pts.slice(sg.i0, sg.i1 + 1), R = P.slice().reverse();
    if (pos) { const d = dist(pos, P[0]); moves.push({ type: 'air', pts: [pos, P[0]], len: d }); airLen += d; lifts++; }
    moves.push({ type: 'stop', at: P[0], n: idx + 1 });
    for (let k = 0; k < o.strokes; k++) {
      if (o.mode === 'snake') { const Q = k % 2 ? R : P; moves.push({ type: 'paint', pts: Q, len: sg.len, seg: idx }); paintLen += sg.len; pos = Q.at(-1); }
      else {
        moves.push({ type: 'paint', pts: P, len: sg.len, seg: idx }); paintLen += sg.len; pos = P.at(-1);
        if (k < o.strokes - 1) { const d = dist(pos, P[0]); moves.push({ type: 'air', pts: [pos, P[0]], len: d, ret: true }); airLen += d; lifts++; pos = P[0]; }
      }
    }
  });
  const guideLen = runs.reduce((s, r) => s + cum[r.c1] - cum[r.c0], 0);
  return { o, F, cb, Hx, Hy, sy, step, K, kSide, kTop, fits, Lb, U, full, P0: g0.P, pts, spans, cum, runs, segs, moves,
    paintLen, airLen, lifts, guideLen, tiny: segs.filter(s => s.len < TINY).length,
    tMachine: paintLen / o.speed + airLen / AIR_SPEED + lifts * LIFT_S };
}

// ---------- for the machine: lines and arcs ----------
const cross = (p, q) => p.x * q.y - p.y * q.x;
const CORNER = [null, [1, 1], null, [-1, 1], null, [-1, -1], null, [1, -1], null];   // a corner piece's centre, (±sa, ±sb)
// an arc of a lane's corner, canvas mm → the machine's; its way round from the turn it makes (a corner is 90° at most)
function cornerArc(c, a, b, r) {
  const A = toMachine(a), B = toMachine(b), C = toMachine(c);
  if (Math.hypot(B.x - A.x, B.y - A.y) < 0.01) return { t: 'L', a: A, b: B };
  return { t: 'A', a: A, b: B, c: C, r, d: cross({ x: A.x - C.x, y: A.y - C.y }, { x: B.x - C.x, y: B.y - C.y }) >= 0 ? 1 : -1 };
}
// lane g's own pieces from u0 to u1, exact: its sides lines, its corners arcs
function lanePieces(g, u0, u1, sy) {
  const out = [], P = q => [q.x, q.y * sy];
  for (let i = Math.floor(u0); i < 9 && i < u1; i++) {
    const f0 = Math.max(0, u0 - i), f1 = Math.min(1, u1 - i);
    if (f1 <= f0 + 1e-12 || g.len[i] <= 0) continue;
    const a = P(rrU(g, i + f0)), b = P(rrU(g, i + f1));
    if (CORNER[i] && g.r > 0) out.push(cornerArc([CORNER[i][0] * g.sa, CORNER[i][1] * g.sb * sy], a, b, g.r));
    else out.push({ t: 'L', a: toMachine(a), b: toMachine(b) });
  }
  return out;
}
const onEnd = u => Math.abs(u - Math.round(u)) < 1e-9;
const fitted = part => fitPieces(part.map(p => [p.x, p.y]));
// The lines and arcs through samples i0 … i1, machine mm from the canvas's
// centre: a lane's arcs and sides as they are; a lane change fitted, cut
// at the pieces' ends, where a mitred corner turns.
export function piecesOf(G, i0, i1) {
  const P = G.pts, out = [];
  for (let i = i0; i < i1;) {
    const s = P[i + 1].s, sp = G.spans[s];
    let j = i + 1;
    while (j < i1 && P[j + 1].s === s) j++;
    if (sp.kind === 'lane') out.push(...lanePieces(sp.g, P[i].s === s ? P[i].u : sp.u0, P[j].u, G.sy));
    else {
      let part = [P[i]];
      for (let q = i + 1; q <= j; q++) { part.push(P[q]); if (q < j && onEnd(P[q].u)) { out.push(...fitted(part)); part = [P[q]]; } }
      out.push(...fitted(part));
    }
    i = j;
  }
  return out;
}

// ---------- DRAG: the tape a run, its strokes over it, no stop ----------
// The tab plans with segLen Infinity: a run one segment, the whole tape
// (the owner, 2026-10-12, on the first DRAG: "I press Snake and the pause
// comes at once, right on the first segment. Not on the first — not at all.
// Press it 27 times? What for?"; then on Segment at 40 mm: "269 of them, what
// for? This option must go, we have overcomplicated something"). The snake:
// a run's strokes forward, back, forward … with the brush down; air:
// forward, the brush lifting at the end and flying back to the start, the
// strokes over ("two Drag — the snake, and there along the canvas, back
// through the air"). PAUSE waits where the tape passes the seam, a lap's
// end, or a stroke's end (stopsAt), never on a lap. → { passes, info,
// length, runs: the landings }
export function dragRows(G, mode = G.o.mode) {
  const ps = [], info = [], N = G.segs.length, k = G.o.strokes;
  let length = 0;
  G.segs.forEach((sg, n) => {
    const P = piecesOf(G, sg.i0, sg.i1);
    if (!P.length) return;
    const L = P.reduce((a, g) => a + pieceLen(g), 0), R = reverse(P), name = N > 1 ? `Run ${n + 1} of ${N}` : 'The tape';
    const laps = [];                                                                // where it passes the seam, mm from its start
    for (let i = sg.i0 + 1; i < sg.i1; i++) if (G.pts[i].s !== G.pts[i - 1].s && G.spans[G.pts[i].s].kind === 'change') laps.push((G.cum[i - 1] - G.cum[sg.i0]) * L / (G.cum[sg.i1] - G.cum[sg.i0] || 1));
    const tag = (pieces, row, stops) => pieces.map((g, j) => ({ ...g, tilt: 0, row, ...(!j && stops.length ? { stopsAt: stops } : {}) }));
    length += L * k;
    if (mode === 'snake') {
      const stops = [];
      for (let t = 0; t < k; t++) { for (const q of t % 2 ? laps.slice().reverse().map(q => L - q) : laps) stops.push(t * L + q); if (t < k - 1) stops.push((t + 1) * L); }
      ps.push(tag(Array.from({ length: k }, (_, t) => t % 2 ? R : P).flat(), ps.length + 1, stops));
      info.push({ label: `${name} · ${k} stroke${k === 1 ? '' : 's'}, the snake` });
      return;
    }
    for (let t = 0; t < k; t++) { ps.push(tag(P, ps.length + 1, laps)); info.push({ label: `${name} · stroke ${t + 1} of ${k}, one way` }); }
  });
  return { passes: ps.length ? [{ key: 'DRAG', ps, why: null }] : [], info, length, runs: ps.length };
}

// ---------- TRACE: the cassette's outline and the tape's guide ----------
// The brush, not the pencil (the owner, 2026-10-12, after the pencil's
// traces, TAPE-images/: "too long, that will not do. I will just mark the
// rectangle with the brush … this construction does not draw that way";
// "so we take the cassette away and keep its outline — the cassette can
// stay in the Result, to see what comes out. I will cut a stencil out of
// cardboard and draw round it in 30 seconds; why wait 16 minutes?").
// The outline: the shell, the box the lanes hug, its sides and corners
// exact — round from 12 o'clock the way the tape goes and on LOOP_SHARE of
// it over its start, the brush lifting off over all of that, as every loop
// of Rembrandt's TRACE. The guide: every run's centre line on the canvas,
// the very line DRAG runs. With ink a dip, then lines on what the brush
// holds while they keep within a dip run; a guide longer than that cut
// where the dips fall (as ALU's TRACE). → { ps, info }
export function shellOf(G, share = LOOP_SHARE) {
  const cb = G.cb, g = rrGeo(cb.w / 2, cb.h / 2, cb.r), s0 = uToL(g, G.sy > 0 ? 6.5 : 2.5), end = s0 + g.P * (1 + share), out = [];
  for (let s = s0; s < end - 1e-9;) {                                            // round, past the seam at the middle of the right side
    const base = Math.floor(s / g.P + 1e-12) * g.P, e = Math.min(end, base + g.P);
    out.push(...lanePieces(g, lToU(g, s - base), lToU(g, e - base), G.sy));
    s = e;
  }
  return { pieces: out, lap: share * g.P, P: g.P };
}
export function traceRows(G, o, dipRun = DIP_RUN) {
  const ps = [], info = [], ink = !!o.ink;
  let since = Infinity;
  const push = (pieces, label, fresh) => {
    if (!pieces.length) return;
    const L = pieces.reduce((a, g) => a + pieceLen(g), 0), nodip = ink && !fresh && since + L <= dipRun;
    since = nodip ? since + L : L;
    const row = ps.length + 1;
    ps.push(pieces.map(g => ({ ...g, tilt: 0, row, ...(nodip ? { nodip: true } : {}) })));
    info.push({ label, L });
  };
  if (o.traceCass && G.fits) { const sh = shellOf(G); push(sh.pieces.map(g => ({ ...g, tailOut: sh.lap })), 'The cassette\'s outline', false); }
  if (o.traceTape) G.runs.forEach((r, i) => {
    const cuts = [r.c0];
    if (ink) for (let c = G.cum[r.c0] + (i % 2 ? dipRun / 2 : dipRun); c < G.cum[r.c1] - 1e-6; c += dipRun) { let q = cuts.at(-1); while (q < r.c1 && G.cum[q] < c) q++; if (q > cuts.at(-1) && q < r.c1) cuts.push(q); }
    cuts.push(r.c1);
    for (let j = 0; j + 1 < cuts.length; j++) push(piecesOf(G, cuts[j], cuts[j + 1]), `Tape guide · run ${i + 1}${j ? `, after dip ${j + 1}` : ''}`, j > 0);
  });
  return { ps, info };
}

// ---------- the cassette's SVG: path data to points ----------
// Any path the SVG has — lines, cubic and quadratic curves, elliptic arcs —
// flattened about seg units apart and put through the element's matrix m
// [a b c d e f]; for the board's views and the Result. → [{ pts, closed }]
export function flattenD(d, m = [1, 0, 0, 1, 0, 0], seg = 0.2) {
  const NUMBER = /[\s,]*([-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)/y, FLAG = /[\s,]*([01])/y, CMD = /[\s,]*([MmLlHhVvCcSsQqTtAaZz])/y;
  const T = (x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  const out = [];
  let i = 0, cur = null, x = 0, y = 0, sx = 0, sy = 0, cmd = '', lc = null, lq = null;
  const read = re => { re.lastIndex = i; const r = re.exec(d); if (!r) return null; i = re.lastIndex; return r[1]; };
  const num = () => { const v = read(NUMBER); if (v === null) throw new Error('a number'); return +v; };
  const more = () => { NUMBER.lastIndex = i; return NUMBER.test(d); };
  const curve = (f, L) => { const n = Math.max(2, Math.min(400, Math.ceil(L / seg))); for (let k = 1; k <= n; k++) cur.pts.push(T(...f(k / n))); };
  // a line cut as finely as a curve: the fit sees it all along, or a two-point line comes back an arc
  const lineTo = (nx, ny) => { const x0 = x, y0 = y, n = Math.max(1, Math.min(4000, Math.ceil(Math.hypot(nx - x0, ny - y0) / seg))); for (let k = 1; k <= n; k++) cur.pts.push(T(x0 + (nx - x0) * k / n, y0 + (ny - y0) * k / n)); x = nx; y = ny; };
  try {
    for (;;) {
      const c = read(CMD);
      if (c) cmd = c; else if (!cmd || !more()) break;   // a number after a command repeats it
      const rel = cmd === cmd.toLowerCase() && cmd !== 'z', C = cmd.toUpperCase(), ox = rel ? x : 0, oy = rel ? y : 0;
      if (C !== 'Z' && C !== 'M' && !cur) { cur = { pts: [T(x, y)], closed: false }; out.push(cur); sx = x; sy = y; }
      if (C === 'M') {
        const nx = ox + num(), ny = oy + num();
        cur = { pts: [T(nx, ny)], closed: false }; out.push(cur); x = sx = nx; y = sy = ny;
        cmd = rel ? 'l' : 'L'; lc = lq = null; continue;
      }
      if (C === 'Z') { if (Math.hypot(x - sx, y - sy) > 1e-9) lineTo(sx, sy); if (cur) cur.closed = true; cur = null; x = sx; y = sy; cmd = ''; lc = lq = null; continue; }
      if (C === 'L') { lineTo(ox + num(), oy + num()); lc = lq = null; continue; }
      if (C === 'H') { lineTo(ox + num(), y); lc = lq = null; continue; }
      if (C === 'V') { lineTo(x, oy + num()); lc = lq = null; continue; }
      if (C === 'C' || C === 'S') {
        const [x1, y1] = C === 'C' ? [ox + num(), oy + num()] : lc ? [2 * x - lc[0], 2 * y - lc[1]] : [x, y];
        const x2 = ox + num(), y2 = oy + num(), ex = ox + num(), ey = oy + num(), x0 = x, y0 = y;
        const L = Math.hypot(x1 - x0, y1 - y0) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(ex - x2, ey - y2);
        curve(t => { const s = 1 - t; return [s * s * s * x0 + 3 * s * s * t * x1 + 3 * s * t * t * x2 + t * t * t * ex, s * s * s * y0 + 3 * s * s * t * y1 + 3 * s * t * t * y2 + t * t * t * ey]; }, L);
        x = ex; y = ey; lc = [x2, y2]; lq = null; continue;
      }
      if (C === 'Q' || C === 'T') {
        const [x1, y1] = C === 'Q' ? [ox + num(), oy + num()] : lq ? [2 * x - lq[0], 2 * y - lq[1]] : [x, y];
        const ex = ox + num(), ey = oy + num(), x0 = x, y0 = y, L = Math.hypot(x1 - x0, y1 - y0) + Math.hypot(ex - x1, ey - y1);
        curve(t => { const s = 1 - t; return [s * s * x0 + 2 * s * t * x1 + t * t * ex, s * s * y0 + 2 * s * t * y1 + t * t * ey]; }, L);
        x = ex; y = ey; lq = [x1, y1]; lc = null; continue;
      }
      if (C === 'A') {
        let rx = Math.abs(num()), ry = Math.abs(num()); const phi = num() * Math.PI / 180, fa = +read(FLAG), fs = +read(FLAG), ex = ox + num(), ey = oy + num();
        lc = lq = null;
        if (!rx || !ry) { lineTo(ex, ey); continue; }
        const co = Math.cos(phi), si = Math.sin(phi), dx = (x - ex) / 2, dy = (y - ey) / 2, xp = co * dx + si * dy, yp = -si * dx + co * dy;
        const lam = xp * xp / (rx * rx) + yp * yp / (ry * ry);
        if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
        const nu = rx * rx * ry * ry - rx * rx * yp * yp - ry * ry * xp * xp, de = rx * rx * yp * yp + ry * ry * xp * xp;
        const k = (fa === fs ? -1 : 1) * Math.sqrt(Math.max(0, nu / de)), cxp = k * rx * yp / ry, cyp = -k * ry * xp / rx;
        const cx = co * cxp - si * cyp + (x + ex) / 2, cy = si * cxp + co * cyp + (y + ey) / 2;
        const ang = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
        const t1 = ang(1, 0, (xp - cxp) / rx, (yp - cyp) / ry);
        let dt = ang((xp - cxp) / rx, (yp - cyp) / ry, (-xp - cxp) / rx, (-yp - cyp) / ry);
        if (!fs && dt > 0) dt -= 2 * Math.PI; else if (fs && dt < 0) dt += 2 * Math.PI;
        curve(t => { const th = t1 + dt * t; return [cx + rx * Math.cos(th) * co - ry * Math.sin(th) * si, cy + rx * Math.cos(th) * si + ry * Math.sin(th) * co]; }, Math.abs(dt) * Math.max(rx, ry));
        x = ex; y = ey; continue;
      }
    }
  } catch { }                                                                    // a broken path: what was read before it stays
  return out.filter(q => q.pts.length > 1);
}
// The cassette's outlines on the canvas, mm from its centre, y down: its
// box centred, real size times Cassette size. items: [{ d, m, id }] in the
// SVG's units, C its viewBox. → [{ pts: [[x, y] …], closed, id }]
export function cassetteLines(items, cb, C = DEFAULT_CASS) {
  const s = cb.w / C.vw, out = [];
  for (const it of items) for (const q of flattenD(it.d, it.m, 0.2 / s)) {
    out.push({ pts: q.pts.map(p => [(p[0] - C.vx) * s - cb.w / 2, (p[1] - C.vy) * s - cb.h / 2]), closed: q.closed, id: it.id });
  }
  return out;
}

// ---------- SVG path data from machine pieces (the save's layers) ----------
// back to canvas mm from the centre, y down: an arc's sweep flag 1 when it turns clockwise on the screen
const toCanvasMm = q => [q.y, -q.x];
const f2 = v => (Math.round(v * 100) / 100).toString();
export function pathD(pieces) {
  if (!pieces.length) return '';
  const a = toCanvasMm(pieces[0].a);
  let s = `M${f2(a[0])} ${f2(a[1])}`;
  for (const g of pieces) {
    const b = toCanvasMm(g.b);
    s += g.t === 'L' ? `L${f2(b[0])} ${f2(b[1])}` : `A${f2(g.r)} ${f2(g.r)} 0 ${sweepOf(g) > Math.PI ? 1 : 0} ${g.d > 0 ? 1 : 0} ${f2(b[0])} ${f2(b[1])}`;
  }
  return s;
}

// ---------- the paints, and the brush mixing them (the Result) ----------
// The owner's paints (2026-10-12, TAPE-images/: "the 18 colours I use now"
// — Shuttle Art acrylics, 18-colors.jpg — "plus what I mixed myself";
// colors-001…003.jpg, the swatches on paper in daylight). A colour read off
// the swatches, the paper taken for white (est.); the paints not swatched yet
// off the maker's chart (est.). [id, name, hex, from]
export const TAPE_PAINTS = [
  ['white', 'White', '#FBF9F0', 'swatch'],
  ['lemon', 'Lemon Yellow', '#FFF200', 'swatch'],
  ['p02', '02', '#FFE41E', 'swatch'],
  ['oyellow', 'Orange Yellow', '#FA9B00', 'swatch'],
  ['sand', 'Sand Yellow', '#F3C06D', 'swatch'],
  ['ochre', 'Yellow Ochre', '#B47528', 'chart'],
  ['orange', 'Orange', '#DB2B01', 'swatch'],
  ['red', 'Red', '#BF020B', 'swatch'],
  ['p05', '05', '#C10221', 'swatch'],
  ['deepred', 'Deep Red', '#9D1529', 'swatch'],
  ['pink', 'Pink', '#ED5D65', 'swatch'],
  ['magenta', 'Magenta', '#AA0955', 'swatch'],
  ['purple', 'Purple', '#7024CC', 'chart'],
  ['p01', '01', '#CFEA8E', 'swatch'],
  ['green', 'Green', '#01CB41', 'chart'],
  ['turquoise', 'Turquoise', '#54D6BE', 'chart'],
  ['viridian', 'Viridian', '#003734', 'chart'],
  ['sky', 'Sky Blue', '#80CCEC', 'chart'],
  ['p03', '03', '#0E72B5', 'swatch'],
  ['p04', '04', '#165AAB', 'swatch'],
  ['ultramarine', 'Ultramarine', '#002392', 'chart'],
  ['brown', 'Dark Brown', '#571F10', 'chart'],
  ['black', 'Black', '#252420', 'chart'],
];
export const PAINT = Object.fromEntries(TAPE_PAINTS.map(([id, name, hex, from]) => [id, { id, name, hex, from }]));

// A spoke: paint squeezed across the lanes, from the cassette outwards, as
// the owner laid it on paper (TAPE-images/ 17:22): at u round the lanes,
// lanes k0 … k1 (0 the one touching the cassette), one paint. Where the
// tape passes it on the canvas, lap after lap. → the samples it lies on
const uGap = (a, b) => { const d = Math.abs(a - b) % 9; return Math.min(d, 9 - d); };
export function spokeHits(G, sp) {
  const out = [];
  for (let i = 1; i < G.pts.length; i++) {
    const a = G.pts[i - 1], b = G.pts[i];
    if (b.brk || Math.abs(b.u - a.u) > 4.5) continue;                             // the seam's jump from 9 to 0: no crossing
    if ((a.u - sp.u) * (b.u - sp.u) > 0 && uGap(b.u, sp.u) > 1e-9) continue;
    const at = uGap(a.u, sp.u) < uGap(b.u, sp.u) ? i - 1 : i;
    const q = G.pts[at], on = Math.abs(q.x) <= G.Hx && Math.abs(q.y) <= G.Hy;          // paint is squeezed on the canvas only
    if (on && q.l >= sp.k0 - 0.5 && q.l <= sp.k1 + 0.5 && !out.some(h => Math.abs(h - at) < 3)) out.push(at);
  }
  return out;
}
// the spoke as it lies, canvas mm: a point on every lane it crosses
export function spokeLine(G, sp) {
  const out = [];
  for (let k = Math.max(0, sp.k0); k <= Math.min(G.K - 1, sp.k1); k++) { const q = G.F.ring(k), p = rrU(rrGeo(q.a, q.b, q.r), sp.u); out.push([p.x, p.y * G.sy]); }
  return out;
}
// The nearest sample to a point, canvas mm → its index, or -1 past `within` mm
export function nearestSample(G, x, y, within = Infinity) {
  let best = -1, bd = within * within;
  G.pts.forEach((p, i) => { const d = (p.x - x) ** 2 + (p.y - y) ** 2; if (d < bd) { bd = d; best = i; } });
  return best;
}

// The brush through the paint: DRAG's own walk — the snake its strokes
// forward, back, forward over a run; air each stroke from the start — every
// sample a place on the canvas, the lanes never crossing. At every step the
// brush picks up PICK of what lies there and lays down what it carries over
// SMEAR mm, the paints mixed as pigments (color.js); a spoke SPOKE_MM of
// paint on each lane it crosses, spread over SPOKE_W mm. All est., to be set
// by the owner's sheets. → per sample its colour (sRGB 0…1) and how covered
// it is (0 the ground … 1 a full film)
export const PICK = 0.35, SMEAR = 40, SPOKE_MM = 120, SPOKE_W = 5;   // est.
export function mixWalk(G, spokes, mode = G.o.mode) {
  const n = G.pts.length, amt = new Float32Array(n), col = new Float32Array(n * 3), len = new Float32Array(n);
  for (let i = 1; i < n; i++) len[i] = G.pts[i].brk ? 0 : G.cum[i] - G.cum[i - 1];
  const mm = i => Math.max(0.3, len[i] || len[i + 1] || 0.6);                      // the stretch a sample stands for
  const put = (i, c, a) => { if (a <= 0) return; const t = a / (amt[i] + a); const m = amt[i] > 0 ? pigmentMix([col[3 * i], col[3 * i + 1], col[3 * i + 2]], c, t) : c; col.set(m, 3 * i); amt[i] += a; };
  for (const sp of spokes) {
    const c = linOf(PAINT[sp.paint]?.hex); if (!c) continue;
    for (const h of spokeHits(G, sp)) {
      let s = 0; const half = SPOKE_W / 2, near = [];
      for (let j = h; j >= 0 && G.cum[h] - G.cum[j] <= half && !(j < h && G.pts[j + 1].brk); j--) near.push(j);
      for (let j = h + 1; j < n && G.cum[j] - G.cum[h] <= half && !G.pts[j].brk; j++) near.push(j);
      for (const j of near) s += mm(j);
      for (const j of near) put(j, c, SPOKE_MM * mm(j) / s);
    }
  }
  const walk = (i0, i1) => {                                                       // one stroke, i0 → i1 either way
    let b = 0, bc = [0, 0, 0];
    const d = i1 >= i0 ? 1 : -1;
    for (let i = i0; ; i += d) {
      const L = mm(i), take = amt[i] * PICK, give = b * Math.min(1, L / SMEAR);
      const was = [col[3 * i], col[3 * i + 1], col[3 * i + 2]];
      if (give > 0) { const keep = amt[i] - take; amt[i] = keep; put(i, bc, give); }
      else amt[i] -= take;
      const nb = b - give + take;
      if (take > 0) bc = b - give > 1e-9 ? pigmentMix(bc, was, take / nb) : was;
      b = nb;
      if (i === i1) break;
    }
  };
  for (const r of G.segs) for (let t = 0; t < G.o.strokes; t++) (mode === 'snake' && t % 2) ? walk(r.i1, r.i0) : walk(r.i0, r.i1);
  const rgb = new Float32Array(n * 3), cover = new Float32Array(n);
  for (let i = 0; i < n; i++) { cover[i] = Math.min(1, amt[i] / mm(i)); for (let q = 0; q < 3; q++) rgb[3 * i + q] = amt[i] > 0 ? toSrgb(col[3 * i + q]) : 0; }
  return { rgb, cover };
}
