// NOLAN's ribbon in 3D (NOLAN.md §3.0; the owner, 2026-10-04: "one
// construction that turns, something like IMG_9424"; the model of Claude in
// chat and of previous_research/nolan_3d_prototype.html). One flat band
// along one centre curve in space, its rows parallel on it, and its imprint
// on the canvas — what the machine paints. 3D lives only in the drawing:
// each visible piece of a row is fitted into lines and arcs, then Test's
// run (strokes.js, plotRun).
//
// Canvas mm from its centre: x right, y down, z towards the viewer. On the
// machine, as on Test: mm from Here — the canvas's centre — X up, Y right.
// No DOM here.

import { biarc, at, pieceLen, sweepOf } from './strokes.js';

export const DIP_RUN = 720;   // mm a dip carries along a row (the owner, 2026-10-04: "all 720 mm will go easily"), est.
// A piece shorter than this goes on what the brush holds, no dip: a dip
// before a dot left a puddle of water (the owner, 2026-10-04: "under 50 mm,
// do not dip, work with what is on the brush; even if the paint runs out, I
// will see it by the density of the other lines"); then 75 mm: "the trace is
// quite clear" (both 2026-10-04). A layer starts on its first piece this long.
export const NO_DIP = 75;     // mm, the owner's rule
export const FIT_MM = 0.1;    // a fitted piece keeps this close to the imprint (Rembrandt.md §3)
const ARC_MAX = 2000;         // mm: a flatter arc goes as a line — a centre kilometres away is no command for the board
export const ROWS_MAX = 60;

// ---------- the blanks of the centre ----------
// IMG_9424's one ribbon, by eye (the prototype the owner took, "yes, that is
// it"): the curl on the right, the arch over the top, down the left, the big
// band in front up to the fold at the centre, down the right behind it,
// round the lower loop into its vortex. { x, y } on the canvas, z the depth,
// roll the band's angle: 0° flat, facing you; 90° edge-on.
export const SKETCH = [
  { x: 232, y: -98, z: -10, roll: 78 }, { x: 188, y: -168, z: -20, roll: 35 }, { x: 92, y: -214, z: -35, roll: 12 },
  { x: -30, y: -220, z: -45, roll: 0 }, { x: -140, y: -172, z: -40, roll: 8 }, { x: -188, y: -78, z: -20, roll: 28 },
  { x: -172, y: 40, z: 20, roll: 72 }, { x: -108, y: 62, z: 62, roll: 18 }, { x: -38, y: 8, z: 72, roll: 8 },
  { x: 22, y: -44, z: 62, roll: 88 }, { x: 118, y: -42, z: -8, roll: 60 }, { x: 150, y: 60, z: -30, roll: 25 },
  { x: 62, y: 168, z: -42, roll: 5 }, { x: -60, y: 168, z: -52, roll: 0 }, { x: -92, y: 92, z: -72, roll: 10 },
  { x: -32, y: 54, z: -110, roll: 35 }, { x: 2, y: 80, z: -150, roll: 70 },
];
// A ring — the first try's donut — as a blank of the centre (Claude in chat:
// "the donuts need not be thrown away").
export const ringBlank = () => Array.from({ length: 13 }, (_, i) => {
  const th = -Math.PI / 2 + i * (Math.PI * 2 * 330 / 360) / 12;
  return { x: Math.round(165 * Math.cos(th)), y: Math.round(40 + 165 * Math.sin(th)), z: Math.round(60 * Math.sin(2 * th)), roll: Math.round(30 * Math.sin(th)) };
});

// ---------- vectors ----------
const rad = d => d * Math.PI / 180;
const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const nrm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const mul = (A, B) => A.map(r => [0, 1, 2].map(j => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
export const apply = (M, v) => [M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2], M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2], M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]];
export const transpose = M => [[M[0][0], M[1][0], M[2][0]], [M[0][1], M[1][1], M[2][1]], [M[0][2], M[1][2], M[2][2]]];
// The construction turned about the canvas's centre: X (its top towards you
// or away), Y (its sides), then in the canvas's plane (↻, plus clockwise).
export function rotation(tilt = 0, swing = 0, spin = 0) {
  const a = rad(tilt), b = rad(swing), c = rad(spin), ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cc = Math.cos(c), sc = Math.sin(c);
  return mul([[cc, -sc, 0], [sc, cc, 0], [0, 0, 1]], mul([[cb, 0, sb], [0, 1, 0], [-sb, 0, cb]], [[1, 0, 0], [0, ca, -sa], [0, sa, ca]]));
}
// A point of the construction → the canvas: turned, sized, moved; the lens
// adds perspective (a camera 9000 / lens mm in front). [x, y, depth].
export function projector(v) {
  const R = rotation(v.tilt, v.swing, v.spin), zoom = v.zoom ?? 1, f = v.lens > 0 ? 9000 / v.lens : Infinity;
  return q => {
    const w = apply(R, q), x = w[0] * zoom + (v.dx || 0), y = w[1] * zoom + (v.dy || 0), k = f === Infinity ? 1 : f / (f - w[2] * zoom);
    return [x * k, y * k, w[2]];
  };
}

// ---------- the centre ----------
// In plan, biarcs through the anchors — two arcs between two anchors, the
// tangent continuous (strokes.js): lines and arcs, as Pen and Arc draw. The
// depth and the roll ease between the anchors (Catmull-Rom on their values).
function ease(vals, i, u) {
  const p0 = vals[Math.max(0, i - 1)], p1 = vals[i], p2 = vals[Math.min(vals.length - 1, i + 1)], p3 = vals[Math.min(vals.length - 1, i + 2)];
  const m1 = (p2 - p0) / 2, m2 = (p3 - p1) / 2, u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p1 + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2 + (u3 - u2) * m2;
}
const unit2 = (x, y) => { const l = Math.hypot(x, y); return l > 1e-9 ? { x: x / l, y: y / l } : { x: 1, y: 0 }; };
// The centre in space, every `step` mm in plan: [{ p: [x, y, z], roll, s }].
export function centreOf(anchors, step = 1.5) {
  const n = anchors.length;
  if (n < 2) return [];
  const P = anchors.map(a => ({ x: a.x, y: a.y })), zs = anchors.map(a => a.z), rs = anchors.map(a => a.roll);
  const T = P.map((_, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)]; return unit2(b.x - a.x, b.y - a.y); });
  const out = [];
  let s = 0;
  for (let i = 0; i < n - 1; i++) {
    const ps = biarc(P[i], T[i], P[i + 1], T[i + 1]), lens = ps.map(pieceLen), L = lens[0] + lens[1];
    if (!(L > 1e-6)) continue;
    const m = Math.max(2, Math.ceil(L / step));
    for (let j = out.length ? 1 : 0; j <= m; j++) {
      const d = L * j / m, u = j / m, first = d <= lens[0], g = first ? ps[0] : ps[1], q = at(g, Math.min(first ? d : d - lens[0], first ? lens[0] : lens[1])).p;
      out.push({ p: [q.x, q.y, ease(zs, i, u)], roll: ease(rs, i, u), s: s + d });
    }
    s += L;
  }
  return out;
}

// ---------- Squeeze: the whole band's lever ----------
// The owner, 2026-10-04 ("why a glossary, if the panel has two Rolls — the
// second one, Squeeze?"): Roll is a point's; Squeeze presses the whole band
// towards edge-on (+, the bundles close up) or towards flat (−, they open).
// It squeezes the band's part across the canvas — tan(roll) divided by
// (1 − Squeeze); for −, its part towards you: a slanted place closes or
// opens most, a flat one stays flat, an edge-on one edge-on, and nothing
// jumps along the ribbon (towards "the nearest edge-on" flipped where the
// roll crossed flat). ±98 % at most: the band still passes flat smoothly.
// Degrees in, degrees out, in the same turn as the roll given.
export function squeezed(deg, pct) {
  if (!pct) return deg;
  const k = Math.max(-0.98, Math.min(0.98, pct / 100)), t = rad(deg);
  const f = (k > 0 ? Math.atan2(Math.sin(t), (1 - k) * Math.cos(t)) : Math.atan2((1 + k) * Math.sin(t), Math.cos(t))) * 180 / Math.PI;
  return f + 360 * Math.round((deg - f) / 360);
}

// ---------- the band ----------
// Across the curve at every point: B in the canvas's plane, N towards the
// viewer; the band D = cos(roll) B + sin(roll) N, twist adding half turns
// along it. The rows on it `pitch` apart, and a little apart in depth too
// (`stack`): a deck of cards, so a band edge-on fans out at a fold, as in
// IMG_9424. o: { rows, pitch, width, stack, twist, squeeze, step } and the view
// { tilt, swing, spin, zoom, dx, dy, lens }.
export function bandOf(anchors, o) {
  const step = o.step || 1.5, C = centreOf(anchors, step);
  if (C.length < 2) return null;
  const L = C.at(-1).s || 1, n = o.rows, half = (n - 1) / 2 * o.pitch, edge = half + o.width / 2, stack = o.stack || 0;
  const imp = projector(o), R = rotation(o.tilt, o.swing, o.spin), zoom = o.zoom ?? 1;
  const S = [], E0 = [], E1 = [], M = [], pitch = [], back = [];
  C.forEach((c, i) => {
    const a = C[Math.max(0, i - 1)].p, b = C[Math.min(C.length - 1, i + 1)].p;
    const T = nrm([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
    let N = [-T[2] * T[0], -T[2] * T[1], 1 - T[2] * T[2]];
    N = Math.hypot(N[0], N[1], N[2]) < 1e-6 ? [1, 0, 0] : nrm(N);
    const B = crs(T, N), th = rad(squeezed(c.roll + 180 * (o.twist || 0) * c.s / L, o.squeeze || 0));
    const D = [0, 1, 2].map(j => Math.cos(th) * B[j] + Math.sin(th) * N[j]), F = crs(D, T);   // F: the band's face, towards you at roll 0
    const on = (v, w) => imp([0, 1, 2].map(j => c.p[j] + v * D[j] + w * F[j]));
    const row = [];
    for (let k = 0; k < n; k++) row.push(on(-half + k * o.pitch, (k / Math.max(1, n - 1) - 0.5) * stack));
    S.push(row); E0.push(on(-edge, -stack / 2)); E1.push(on(edge, stack / 2)); M.push(imp(c.p));
    const Dr = apply(R, D);
    pitch.push(Math.hypot(Dr[0], Dr[1]) * o.pitch * zoom);   // the rows apart on the canvas
    back.push(apply(R, F)[2] < 0);                           // its back towards you: the glazes' place (zone G)
  });
  const quads = [];
  for (let i = 0; i < C.length - 1; i++) quads.push({ i, z: (M[i][2] + M[i + 1][2]) / 2, poly: [E0[i], E0[i + 1], E1[i + 1], E1[i]] });
  quads.sort((p, q) => p.z - q.z);                            // far first: the painter's order
  quads.forEach((q, j) => { q.o = j; });
  return { S, E0, E1, M, pitch, back, s: C.map(c => c.s), n: C.length, step, quads, L, rows: n, across: 2 * edge };
}

// ---------- what lies over what ----------
function pip(p, poly) {
  let ins = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) ins = !ins;
  }
  return ins;
}
const CELL = 24, ckey = (i, j) => i * 100003 + j;
function gridOf(quads) {
  const grid = new Map();
  for (const q of quads) {
    const xs = q.poly.map(p => p[0]), ys = q.poly.map(p => p[1]);
    for (let i = Math.floor(Math.min(...xs) / CELL); i <= Math.floor(Math.max(...xs) / CELL); i++)
      for (let j = Math.floor(Math.min(...ys) / CELL); j <= Math.floor(Math.max(...ys) / CELL); j++) {
        const key = ckey(i, j);
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key).push(q);
      }
  }
  return grid;
}
const near = (grid, p) => grid.get(ckey(Math.floor(p[0] / CELL), Math.floor(p[1] / CELL))) || [];
// ---------- the layers: stretches of the ribbon, cut along it ----------
// A layer is a whole bundle: a stretch of the ribbon between two cuts along
// its length (the owner, 2026-10-04, machine/layers selected.png and
// layers how to cut.png: "continuous bundles, where the line goes
// naturally"). Before it was the depth — a piece one layer up from what it
// covers — and the second layer came out in patches, "very strange to the
// eye". Cut where the ribbon hides behind itself, turns over or edge-on, and
// a layer's edge is the line where it goes under: its rows end there anyway.
// The cuts are s, mm along the centre; the owner moves them on the tab.
const CUT_SEE = 0.25;   // a place with no more than this share of its rows in sight is hidden (Claude's choice)
const CUT_GAP = 60;     // mm along the ribbon: places closer than this are one
const CUT_END = 60;     // mm: no cut nearer an end of the ribbon
const EDGE_ON = 15;     // mm across on the canvas: the band nearly edge-on
const across = (band, i) => Math.hypot(band.E0[i][0] - band.E1[i][0], band.E0[i][1] - band.E1[i][1]);
// Where to cut, suggested: the least seen place of every stretch that is
// hidden, turns over (its back to you) or edge-on.
export function cutsOf(band, imp) {
  const { n, s, rows } = band, vis = imp.vis, places = [];
  for (let i = 1; i < n - 1; i++) {
    const w = across(band, i);
    if (vis[i] <= CUT_SEE * rows || band.back[i] !== band.back[i - 1] || (w < EDGE_ON && w <= across(band, i - 1) && w <= across(band, i + 1))) places.push(i);
  }
  const groups = [];
  for (const i of places) { const G = groups.at(-1); if (G && s[i] - s[G.at(-1)] <= CUT_GAP) G.push(i); else groups.push([i]); }
  return groups.map(G => { const mid = (G[0] + G.at(-1)) / 2; return G.reduce((a, i) => vis[i] * 1e4 + Math.abs(i - mid) < vis[a] * 1e4 + Math.abs(a - mid) ? i : a); })
    .map(i => s[i]).filter(v => v > CUT_END && v < s[n - 1] - CUT_END);
}
// The stretches between the cuts and the order they are painted in: a
// stretch after every one it lies over (where it hides more of that one than
// that one of it), each once the one under it is dry; free to choose, or in
// a ring, the farthest first. lay: the layer of every piece of the band,
// numbered in that order — N1 first.
export function stretchesOf(band, cuts, imp) {
  const { n, s, M } = band, at = cuts.filter(Number.isFinite).slice().sort((a, b) => a - b), m = at.length + 1;
  const st = new Array(n);
  for (let i = 0, j = 0; i < n; i++) { while (j < at.length && s[i] >= at[j]) j++; st[i] = j; }
  const W = Array.from({ length: m }, () => new Array(m).fill(0)), depth = new Array(m).fill(0), cnt = new Array(m).fill(0);
  for (let c = 0; c < imp.covers.length; c += 2) { const a = st[imp.covers[c]], b = st[imp.covers[c + 1]]; if (a !== b) W[a][b]++; }
  for (let i = 0; i < n; i++) { depth[st[i]] += M[i][2]; cnt[st[i]]++; }
  for (let a = 0; a < m; a++) depth[a] /= cnt[a] || 1;
  const order = [], left = new Set(depth.keys());
  while (left.size) {
    const free = [...left].filter(a => [...left].every(b => b === a || !(W[a][b] > W[b][a])));
    const a = (free.length ? free : [...left]).reduce((x, y) => depth[y] < depth[x] ? y : x);
    order.push(a); left.delete(a);
  }
  const num = new Array(m);
  order.forEach((a, j) => { num[a] = j + 1; });
  const lay = new Array(n - 1);
  for (let i = 0; i < n - 1; i++) lay[i] = num[st[i]];
  const stretches = [];
  for (let a = 0; a < m; a++) { const i0 = st.indexOf(a), i1 = st.lastIndexOf(a); if (i0 >= 0) stretches.push({ layer: num[a], i0, i1, s0: s[i0], s1: s[i1] }); }
  return { lay, stretches, cuts: at };
}
// A row hidden for a moment — where the ribbon is edge-on, at a pinch — is
// painted through: two strokes there, each landing and lifting, left a gap
// (the owner, 2026-10-04, machine/2026-10-04 Nolan-v2-details.jpg: "the line
// breaks at the tips; the line must go on").
const BRIDGE_MM = 6;     // on the canvas, est. (Claude's choice): 17 of 32 such gaps of the first ribbon under 10 mm
const BRIDGE_ALONG = 30; // mm along the ribbon: the same place of it, not another part lying near
function bridged(band, runs) {
  const rows = new Map(), out = [];
  for (const r of runs) { if (!rows.has(r.k)) rows.set(r.k, []); rows.get(r.k).push(r); }
  for (const rs of rows.values()) {
    rs.sort((a, b) => a.i0 - b.i0);
    let cur = null;
    for (const r of rs) {
      if (cur) {
        const end = cur.i0 + cur.pts.length - 1, a = cur.pts.at(-1), c = r.pts[0];
        if (Math.hypot(c[0] - a[0], c[1] - a[1]) < BRIDGE_MM && (r.i0 - end) * band.step <= BRIDGE_ALONG) {
          for (let i = end + 1; i < r.i0; i++) cur.pts.push([band.S[i][r.k][0], band.S[i][r.k][1]]);
          cur.pts.push(...r.pts);
          continue;
        }
        out.push(cur);
      }
      cur = { ...r, pts: r.pts.slice() };
    }
    if (cur) out.push(cur);
  }
  return out;
}
// The imprint in its layers: o.cuts, or the cuts suggested when there are none.
export function layeredOf(band, o) {
  const imp0 = imprintOf(band, null, o), cuts = Array.isArray(o.cuts) ? o.cuts : cutsOf(band, imp0);
  const st = stretchesOf(band, cuts, imp0), runs = [];
  for (const r of bridged(band, imp0.runs)) {      // a run breaks where its layer changes, both parts at the cut's point: they meet
    let cur = null;
    r.pts.forEach((p, j) => {
      const i = r.i0 + j, layer = st.lay[Math.min(i, band.n - 2)];
      if (!cur || cur.layer !== layer) { if (cur) { cur.pts.push(p); runs.push(cur); } cur = { k: r.k, layer, i0: i, pts: [] }; }
      cur.pts.push(p);
    });
    if (cur) runs.push(cur);
  }
  return { imp: { ...finished(runs), red: imp0.red, vis: imp0.vis }, lay: st.lay, cuts: st.cuts, stretches: st.stretches, auto: !Array.isArray(o.cuts) };
}

// ---------- the imprint: only the visible pieces of the rows ----------
// A point of a row is hidden when a piece of band nearer than it covers it,
// that piece's brush's half width included. A visible run breaks where its
// layer changes (layers null: one). o.width: the row's width — closer than
// that on the canvas, the rows lie on one another ("red"). covers: pairs of
// the piece hiding a point and the point, along the band; vis: the rows in
// sight at each place.
export function imprintOf(band, layers, o) {
  const grid = gridOf(band.quads), order = new Array(band.n - 1);
  for (const q of band.quads) order[q.i] = q.o;
  const runs = [], covers = [], vis = new Array(band.n).fill(0);
  let red = 0, all = 0;
  for (let k = 0; k < band.rows; k++) {
    let run = null;
    for (let i = 0; i < band.n; i++) {
      const p = band.S[i][k], mine = Math.max(order[i - 1] ?? -1, order[i] ?? -1), layer = layers ? layers[Math.min(i, band.n - 2)] : 1;
      let hidden = false;
      for (const q of near(grid, p)) {
        if (q.o <= mine || Math.abs(q.i - i) <= 1) continue;
        if (pip(p, q.poly)) { hidden = true; covers.push(q.i, i); break; }
      }
      if (!hidden) vis[i]++;
      if (hidden || (run && run.layer !== layer)) { if (run) runs.push(run); run = null; if (hidden) continue; }
      if (!run) run = { k, layer, i0: i, pts: [] };
      run.pts.push([p[0], p[1]]); all++;
      if (band.pitch[i] < o.width) red++;
    }
    if (run) runs.push(run);
  }
  return { ...finished(runs), red: all ? red / all : 0, covers, vis };
}
// the runs worth a stroke, and the length of each layer
function finished(runs) {
  const kept = runs.filter(r => r.pts.length > 1 && lengthOf(r.pts) >= 4);
  const byLayer = {};
  for (const r of kept) byLayer[r.layer] = (byLayer[r.layer] || 0) + lengthOf(r.pts);
  return { runs: kept, total: kept.reduce((a, r) => a + lengthOf(r.pts), 0), byLayer };
}
export const lengthOf = pts => pts.reduce((a, p, i) => i ? a + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0, 0);

// ---------- into lines and arcs, for the machine ----------
// A run of the imprint (canvas mm) → Test's pieces in machine mm: biarcs
// between its points, each as long as it can be and still within FIT_MM of
// every point it passes — the tangent continuous at every joint, so the
// board does not stop there (Rembrandt.md §3). An arc flatter than ARC_MAX
// is laid as its chord when that keeps within FIT_MM, else the span is
// shortened: it bends a hundredth of a degree there, no kink to stop at.
export const toMachine = p => ({ x: -p[1], y: p[0] });
export function offPiece(g, q) {
  if (g.t === 'L') {
    const vx = g.b.x - g.a.x, vy = g.b.y - g.a.y, l2 = vx * vx + vy * vy || 1, t = Math.max(0, Math.min(1, ((q.x - g.a.x) * vx + (q.y - g.a.y) * vy) / l2));
    return Math.hypot(q.x - g.a.x - vx * t, q.y - g.a.y - vy * t);
  }
  const a0 = Math.atan2(g.a.y - g.c.y, g.a.x - g.c.x), aq = Math.atan2(q.y - g.c.y, q.x - g.c.x);
  let d = (aq - a0) * g.d; d -= Math.floor(d / (2 * Math.PI)) * 2 * Math.PI;
  if (d <= sweepOf(g) + 1e-9) return Math.abs(Math.hypot(q.x - g.c.x, q.y - g.c.y) - g.r);
  return Math.min(Math.hypot(q.x - g.a.x, q.y - g.a.y), Math.hypot(q.x - g.b.x, q.y - g.b.y));
}
export function fitPieces(pts, tol = FIT_MM) {
  const P = pts.map(toMachine), n = P.length;
  if (n < 2) return [];
  const T = P.map((_, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)]; return unit2(b.x - a.x, b.y - a.y); });
  const fits = (i, j) => {
    const bs = [];
    for (const g of biarc(P[i], T[i], P[j], T[j])) {
      if (g.t === 'A' && g.r > ARC_MAX) {
        const ch = Math.hypot(g.b.x - g.a.x, g.b.y - g.a.y);
        if (ch * ch / (8 * g.r) > tol / 2) return null;
        bs.push({ t: 'L', a: g.a, b: g.b });
      } else bs.push(g);
    }
    for (let q = i + 1; q < j; q++) if (Math.min(offPiece(bs[0], P[q]), offPiece(bs[1], P[q])) > tol) return null;
    return bs;
  };
  const out = [];
  let i = 0;
  while (i < n - 1) {
    let good = i + 1, goodBs = fits(i, i + 1) || [{ t: 'L', a: P[i], b: P[i + 1] }], hi = n;
    for (;;) {                                                // longer and longer while it fits
      const next = Math.min(n - 1, i + (good - i) * 2);
      if (next === good) { hi = good + 1; break; }
      const b = fits(i, next);
      if (!b) { hi = next; break; }
      good = next; goodBs = b;
      if (next === n - 1) { hi = n; break; }
    }
    while (hi - good > 1) {                                   // then the longest that fits
      const mid = (good + hi) >> 1, b = fits(i, mid);
      if (b) { good = mid; goodBs = b; } else hi = mid;
    }
    for (const g of goodBs) if (pieceLen(g) > 1e-6) out.push(g);
    i = good;
  }
  return out;
}

// ---------- the run ----------
// A run cut where the dips fall (the Watercolour run, NOLAN.md §5.1): a
// fresh dip every dip run along the row, the next part landing where the
// last one's tail began; neighbouring rows cut half a dip run apart.
function cutAt(pts, cum, a, b) {
  const out = [];
  const lerp = s => { let j = 1; while (j < cum.length - 1 && cum[j] < s) j++; const t = (s - cum[j - 1]) / ((cum[j] - cum[j - 1]) || 1); return [pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * t, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * t]; };
  out.push(lerp(a));
  for (let j = 0; j < pts.length; j++) if (cum[j] > a + 1e-9 && cum[j] < b - 1e-9) out.push(pts[j]);
  out.push(lerp(b));
  return out;
}
export function dipParts(pts, k, dipRun = DIP_RUN, tail = 0) {
  const cum = [0];
  for (let j = 1; j < pts.length; j++) cum.push(cum[j - 1] + Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]));
  const L = cum.at(-1);
  if (L <= dipRun) return [pts];
  const cuts = [];
  for (let c = (k % 2 ? dipRun / 2 : dipRun); c < L - 1e-6; c += dipRun) cuts.push(c);
  const parts = [];
  let start = 0;
  for (const c of [...cuts, L]) { parts.push(cutAt(pts, cum, start, c)); start = Math.max(0, c - tail); }
  return parts;
}
// The imprint's runs as the passes of Test's run, layer by layer — N1 first,
// a pause before each next, CONTINUE once the one under it is dry; in a
// layer row by row, along the ribbon. Each piece one way, the way the
// ribbon runs. rows: what each row of the run is.
export function bandPasses(runs, o) {
  const sorted = runs.slice().sort((a, b) => a.layer - b.layer || a.k - b.k || a.i0 - b.i0);
  const rows = [], passes = [];
  for (const L of [...new Set(sorted.map(r => r.layer))]) {
    const ps = [];
    for (const r of sorted.filter(q => q.layer === L)) {
      for (const part of o.ink ? dipParts(r.pts, r.k, o.dipRun ?? DIP_RUN, o.tail || 0) : [r.pts]) {
        const pieces = fitPieces(part);
        if (!pieces.length) continue;
        rows.push({ layer: L, name: `N${L}`, row: r.k + 1 });
        const row = rows.length;
        ps.push(pieces.map(g => ({ ...g, tilt: 0, row })));
      }
    }
    if (!ps.length) continue;
    const under = passes.at(-1)?.key;
    passes.push({ key: `N${L}`, ps, why: o.ink ? `N${L}: its wash in the cup, then CONTINUE` : `N${L}: it lies over ${under} — CONTINUE when that is dry` });
  }
  return { passes, rows };
}
