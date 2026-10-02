// The test bench: rows of hairpins on a board, 30 × 30 cm by default (the
// owner, 2026-10-02: width and height apart, 40 × 60 too), drawn by the plotter
// — X and Y on their steppers, lines and arcs (the arm strokes were tried in
// the air and dropped, "not Instagram-worthy"; the patterns of
// references/Screenshot 2026-10-02 3DOF.png stay). A row: the brush down, a
// row to the right, a turn down, a row back, the brush off with the wrist's
// hook; then the carriage to the next row. C, the snake, is one line.
//
// A row can bow (the owner, 2026-10-02, references/Screenshot 2026-10-02
// snake.png): an arc instead of a straight line, its middle `bow` mm lower
// than its ends (higher when minus). The ends of a bowed row tilt, so a turn
// is a half circle and a short straight line: the path stays smooth, no
// kink for the board to stop at.
//
// The broom (the owner, 2026-10-02, test_results/, the 15-row snake): at a
// turn the bristles flipped over, so the wrist tilts the brush `tilt`°,
// plus at the right end, minus at the left, and stands it upright again
// once the turn is done. ±15° left the brush on the board; it leaves at
// ±45° (Calibration), so a turn at 45° runs in the air.
//
// The wrist moves the brush's tip along Y only (minus left, plus right),
// and with the carriage standing it drags the tip while it is on the board:
// coming down from −54° the brush touches the board at −45°, 50 mm left of
// the point under it (a ruler), and drags there. That is a tip 50 / sin 45°
// ≈ 71 mm from the wrist's axis (est.); the preview draws what the brush
// paints by it: the drags, and a tilted stretch shifted along Y.
//
// The landing stays as it is. A carriage
// standing 50 mm into the row (tried 2026-10-02) put the blob at the start,
// but the drag runs along Y only, and a bowed row starts at a slant: the
// row bent off its arc by up to 22 mm and left a gap — the owner: "fix it
// as it was". Landing on the arc needs the carriage to move back while the
// wrist comes down, and the firmware never moves the rail and the arm
// together.
//
// Machine mm: X up the picture, Y to the right. "Here" is where the carriage
// stands with the brush over the board's centre. No DOM.

import { arcSpeed, homeCorner } from './machine.js';

export const PATTERNS = {
  A: { rows: 8, turn: 10, pitch: 25, snake: false },   // tight, the owner's sketch A
  B: { rows: 5, turn: 20, pitch: 30, snake: false },   // loose, sketch B; 30 apart since the slider stops there (2026-10-02; was 40)
  // C, the snake (the owner, 2026-10-02: references/Screenshot 2026-10-02
  // snake.png): one continuous line, row after row, turning round at either
  // end; the brush stays down from the first row to the last
  C: { rows: 12, pitch: 20, snake: true },
  // D (the owner, 2026-10-02, references/IMG_9455.JPG and PATTERN-D1…3.jpg):
  // three passes, each the snake of C turned its own way, the sliders shared —
  // "keep the geometry of C". One pass, two, or all three.
  D: { snake: true },
};
// The passes of D, in the order they run, as the sketches lay them (the
// angle turns C's rows; C's bow, below them, comes to lie on that side):
// D1 rows upright, bowed to the left — nested Cs; D2 down to the lower right,
// bowed down-left; D3 up to the upper right, bowed up-left — the hair. The
// paint of each, for the preview only. Claude's reading of the sketches.
export const PASSES = {
  D1: { angle: 90,  paint: 'orange', color: '#EE9A1F' },
  D2: { angle: 50,  paint: 'red',    color: '#BD2410' },
  D3: { angle: 120, paint: 'dark grey', color: '#4A4846' },
};
export const DEFAULTS = {
  boardW: 300, boardH: 300,   // mm: the board across (Y) and up the picture (X)
  margin: 30,
  length: 220,                // mm, the chord of a row
  bow: 0,                     // mm: how far the middle of a row lies below its ends; 0 — straight
  speed: 30,                  // mm/s with the brush on (est.)
  travel: 100,                // mm/s between rows, the brush off
  swing: -54,                 // the wrist's brush off
  tilt: 45,                   // degrees: the wrist through a turn, + at the right end, − at the left; 45 lifts the brush
  tail: 100,                  // mm: along the first and the last of every row the brush lands and lifts, on the move (est.)
  wave: 0,                    // mm: a row waves this far either side of its line or arc; 0 — none
  waveLen: 100,               // mm, about a wave along the row (est.)
  pause: true,                // after every row: paint for the brush
  passes: ['D1'],             // D: the passes on, in their order
  shift: {},                  // D: { D1: { x, y, a } … }: a pass moved off Here, mm — X up, Y to the right — and turned a° more, plus clockwise (the owner, 2026-10-02)
  ...PATTERNS.A,
};

// ---------- pieces in mm from Here: { t: 'L', a, b } or { t: 'A', a, b, c, r, d } ----------
// d = +1 turns from +X towards +Y, as the board's A takes it.
const pt = (x, y) => ({ x, y });
const add = (p, q, k = 1) => pt(p.x + q.x * k, p.y + q.y * k);
const dot = (p, q) => p.x * q.x + p.y * q.y;
const cross = (p, q) => p.x * q.y - p.y * q.x;

// A row at height x from y0 to y1: a line, or the arc through its middle bow mm lower.
function row(x, y0, y1, bow) {
  const a = pt(x, y0), b = pt(x, y1);
  if (Math.abs(bow) < 1e-6) return { t: 'L', a, b };
  const L = Math.abs(y1 - y0), r = (L * L / 4 + bow * bow) / (2 * Math.abs(bow));
  const m = pt(x - bow, (y0 + y1) / 2), c = pt(x - bow + Math.sign(bow) * r, (y0 + y1) / 2);
  return { t: 'A', a, b, c, r, d: Math.sign(cross(add(a, c, -1), add(m, c, -1))) || 1 };
}
// The direction at the end of a piece.
function endDir(g) {
  if (g.t === 'L') { const l = Math.hypot(g.b.x - g.a.x, g.b.y - g.a.y) || 1; return pt((g.b.x - g.a.x) / l, (g.b.y - g.a.y) / l); }
  const dx = g.b.x - g.c.x, dy = g.b.y - g.c.y;
  return pt(-g.d * dy / g.r, g.d * dx / g.r);
}
// A turn from E, going in direction t, to E + D: a half circle across, and
// a straight line along t before it or back along it after, as D needs.
function turn(E, t, D) {
  const n = dot(D, pt(-t.y, t.x)) > 0 ? pt(-t.y, t.x) : pt(t.y, -t.x);
  const r = dot(D, n) / 2, q = dot(D, t), out = [];
  let p = E;
  if (q > 1e-6) { out.push({ t: 'L', a: p, b: add(p, t, q) }); p = add(p, t, q); }
  const f = add(p, n, 2 * r);
  out.push({ t: 'A', a: p, b: f, c: add(p, n, r), r, d: Math.sign(cross(t, n)) || 1 });
  if (q < -1e-6) out.push({ t: 'L', a: f, b: add(f, t, q) });
  return out;
}
function sweepOf(g) {
  const a0 = Math.atan2(g.a.y - g.c.y, g.a.x - g.c.x), a1 = Math.atan2(g.b.y - g.c.y, g.b.x - g.c.x);
  let s = (a1 - a0) * g.d;
  while (s <= 1e-9) s += 2 * Math.PI;
  while (s > 2 * Math.PI + 1e-9) s -= 2 * Math.PI;
  return s;
}
const pieceLen = g => g.t === 'L' ? Math.hypot(g.b.x - g.a.x, g.b.y - g.a.y) : g.r * sweepOf(g);
function points(g, out) {
  if (g.t === 'L') { out.push(g.b); return; }
  const a0 = Math.atan2(g.a.y - g.c.y, g.a.x - g.c.x), s = sweepOf(g), n = Math.max(4, Math.ceil(s / 0.05));
  for (let i = 1; i <= n; i++) { const a = a0 + g.d * s * i / n; out.push(pt(g.c.x + g.r * Math.cos(a), g.c.y + g.r * Math.sin(a))); }
}
const shift = (g, v) => g.t === 'L' ? { ...g, a: add(g.a, v), b: add(g.b, v) } : { ...g, a: add(g.a, v), b: add(g.b, v), c: add(g.c, v) };
const reverse = p => p.slice().reverse().map(g => g.t === 'L' ? { ...g, a: g.b, b: g.a } : { ...g, a: g.b, b: g.a, d: -g.d });
// turned by deg about Here; an arc keeps its way round
const turnPt = (q, deg) => { const c = Math.cos(deg * Math.PI / 180), s = Math.sin(deg * Math.PI / 180); return pt(q.x * c - q.y * s, q.x * s + q.y * c); };
const turned = (g, deg) => g.t === 'L' ? { ...g, a: turnPt(g.a, deg), b: turnPt(g.b, deg) } : { ...g, a: turnPt(g.a, deg), b: turnPt(g.b, deg), c: turnPt(g.c, deg) };

// ---------- waves (the owner, 2026-10-02: "from a perfectly straight pass to waves") ----------
// A row waves about its line or its arc: a sine `wave` mm either side, a
// whole number of half waves so that its ends stay where they were, about
// `waveLen` mm a wave. The board runs lines and arcs only (§1): the wave is
// laid as biarcs, two arcs between points a quarter of a half wave apart,
// the tangent continuous everywhere — no kink for the board to stop at.
const rot90 = p => pt(-p.y, p.x);
const unit = p => { const l = Math.hypot(p.x, p.y) || 1; return pt(p.x / l, p.y / l); };
// the point s mm along a line or an arc, and its direction there
function at(g, s) {
  if (g.t === 'L') { const t = unit(add(g.b, g.a, -1)); return { p: add(g.a, t, s), t }; }
  const th = Math.atan2(g.a.y - g.c.y, g.a.x - g.c.x) + g.d * s / g.r;
  return { p: pt(g.c.x + g.r * Math.cos(th), g.c.y + g.r * Math.sin(th)), t: pt(-g.d * Math.sin(th), g.d * Math.cos(th)) };
}
// the arc from p, leaving along t, to q; a line when it bulges less than 5 µm
function arcTo(p, t, q) {
  const v = add(q, p, -1), h = dot(v, rot90(t));
  if (Math.abs(h) < 0.02) return { t: 'L', a: p, b: q };
  const k = dot(v, v) / (2 * h);
  return { t: 'A', a: p, b: q, c: add(p, rot90(t), k), r: Math.abs(k), d: Math.sign(k) };
}
// two arcs from p0 (leaving along t0) to p1 (arriving along t1), as long
// each way to the joint, which they share with its tangent
function biarc(p0, t0, p1, t1) {
  const v = add(p1, p0, -1), vt = dot(v, add(t0, t1)), c = 2 * (1 - dot(t0, t1)), vv = dot(v, v);
  const d = c < 1e-9 ? vv / (2 * vt) : (-vt + Math.sqrt(vt * vt + c * vv)) / c;
  const q0 = add(p0, t0, d), q1 = add(p1, t1, -d), j = pt((q0.x + q1.x) / 2, (q0.y + q1.y) / 2);
  return [arcTo(p0, t0, j), arcTo(j, unit(add(q1, q0, -1)), p1)];
}
// the wave along g (a line or an arc), as biarcs
export function waved(g, amp, waveLen) {
  const L = pieceLen(g), m = Math.max(1, Math.round(2 * L / waveLen)), n = 4 * m;
  const on = s => { const q = at(g, s); return add(q.p, rot90(q.t), amp * Math.sin(Math.PI * m * s / L)); };
  const dir = s => unit(add(on(Math.min(L, s + 1e-4)), on(Math.max(0, s - 1e-4)), -1));
  const out = [];
  for (let i = 0; i < n; i++) out.push(...biarc(on(L * i / n), dir(L * i / n), on(L * (i + 1) / n), dir(L * (i + 1) / n)));
  out[0] = { ...out[0], a: g.a };
  out[out.length - 1] = { ...out.at(-1), b: g.b };    // the ends exactly where the row's are
  return out;
}

// The rows as pieces, a path per brush down (A, B: one a row; C, D: one in
// all), turned `angle` degrees. Every piece carries its row and the wrist's
// angle: 0 along a row, ±tilt through a turn — plus at a right end, minus at
// a left one, on the machine (after the turning).
function paths(o, angle = 0) {
  const half = o.length / 2, bow = Math.max(-half + 1, Math.min(half - 1, o.bow || 0));
  const base = row(0, -half, half, bow);
  const shape = (o.wave > 0 ? waved(base, o.wave, o.waveLen) : [base]).map(g => turned(g, angle)), back = reverse(shape);
  const out = [], place = (p, v, row) => p.map(g => ({ ...shift(g, v), tilt: 0, row }));
  const round = (g, D, row) => {   // the turn at the end of row g; a row up or down the board turns to the plus side
    const t = endDir(g), tilt = (t.y < -1e-9 ? -1 : 1) * (o.tilt || 0) || 0;
    return turn(g.b, t, D).map(q => ({ ...q, tilt, row }));
  };
  const step = k => turnPt(pt(-k, 0), angle);
  if (o.snake) {
    const p = [];
    for (let k = 0; k < o.rows; k++) {
      const r = place(k % 2 === 0 ? shape : back, step(k * o.pitch), k + 1);
      p.push(...r);
      if (k < o.rows - 1) p.push(...round(r.at(-1), step(o.pitch), k + 1));
    }
    out.push(p);
  } else {
    for (let k = 0; k < o.rows; k++) {
      const g = place(shape, step(k * o.pitch), k + 1), b = place(back, step(k * o.pitch + o.turn), k + 1);
      out.push([...g, ...round(g.at(-1), step(o.turn), k + 1), ...b]);
    }
  }
  return out;
}
const tracePoints = p => { const q = [p[0].a]; p.forEach(g => points(g, q)); return q; };
export const plotPaths = (opts, angle) => paths({ ...DEFAULTS, ...opts }, angle);   // for the tests

// The wrist on the board (2026-10-02): it moves the brush's tip along Y
// only, minus left, plus right; the brush leaves the board at ±LIFT_DEG
// (the owner, on Calibration), DRAG_MM to the side of the point under the
// carriage (a ruler): a tip 50 / sin 45° ≈ 71 mm from the wrist's axis (est.).
export const LIFT_DEG = 45, DRAG_MM = 50;
// The brush's trace across a row, for the preview (est.): rows 4.5 mm apart
// left grooves between them on the canvas, about 1 mm each
// (test_results/IMAGE 2026-10-02 17:12:24.jpg, photo_2026-10-02 D2+D3.jpeg);
// drawn 10 mm wide before, they ran together (the owner, 2026-10-02).
export const BRUSH_MM = 3.5;
const rad = d => d * Math.PI / 180;
export const tipY = deg => DRAG_MM / Math.sin(rad(LIFT_DEG)) * Math.sin(rad(deg));   // the tip along Y from upright (est.)
const tipY1 = deg => DRAG_MM / Math.sin(rad(LIFT_DEG)) * Math.cos(rad(deg)) * Math.PI / 180;   // its change, mm a degree
const onBoard = deg => Math.abs(deg) < LIFT_DEG;
const round1 = v => Math.round(v * 10) / 10;

// ---------- the brush lands and lifts on the move: (a) + (b) ----------
// The owner, 2026-10-02, after D2 + D3: the carriage stood at every turn
// while the wrist lifted and landed the brush, 5.4 s a turn, and the tip
// dragged 50 mm across the rows' ends — the flags, the dark band. Now over
// the first and the last `tail` mm of a row the wrist goes between upright
// and ±45°, and the carriage moves the other way along Y as it does, so the
// tip keeps to the row: a tail along it, the brush lightening, no drag
// across, no stop. The wrist goes by place, not by time: a W rides on every
// TAIL_STEP mm of a tail, and the board turns the wrist as the carriage
// reaches it — whatever the speed, a brake, a pause. Through a turn the
// brush is in the air (the wrist at ±tilt), the carriage still aside.
const TAIL_STEP = 16;           // mm along a tail a W; the pieces not much shorter, or the board's queue of 16 runs thin
export const WRIST_MAX = 211;   // °/s, the firmware's fastest for W (2400 ticks/s; the servo makes about 250, est.)
export const SPEED_MAX = 250;   // mm/s, the board's fastest path (firmware F, 1…250 since 2026-10-02)

const trackOf = p => { let s = 0; return p.map(g => { const L = pieceLen(g), e = { g, s0: s, s1: s + L }; s += L; return e; }); };
function atTrack(tr, s) {
  const e = tr.find(q => s <= q.s1 + 1e-9) || tr.at(-1);
  return at(e.g, Math.max(0, Math.min(e.s1 - e.s0, s - e.s0)));
}
// the part of a piece from u to w mm along it
function cutPiece(g, u, w) {
  const L = pieceLen(g), a = u < 1e-9 ? g.a : at(g, u).p, b = w > L - 1e-9 ? g.b : at(g, w).p;
  return g.t === 'L' ? { t: 'L', a, b } : { t: 'A', a, b, c: g.c, r: g.r, d: g.d };
}
const cutTrack = (tr, a, b) => tr.filter(e => e.s1 > a + 1e-6 && e.s0 < b - 1e-6).map(e => cutPiece(e.g, Math.max(a, e.s0) - e.s0, Math.min(b, e.s1) - e.s0));
// The wrist along a row Lr long: from `from` to upright over its first zi
// mm, upright, then to `to` over its last zo — a half cosine each, level at
// both ends, so the carriage's path bends in and out without a kink.
function rowWrist(Lr, from, to, zi, zo) {
  const th = s => s < zi ? from * (1 + Math.cos(Math.PI * s / zi)) / 2 : s > Lr - zo ? to * (1 - Math.cos(Math.PI * (s - Lr + zo) / zo)) / 2 : 0;
  const dth = s => s < zi ? -from * Math.PI / zi * Math.sin(Math.PI * s / zi) / 2 : s > Lr - zo ? to * Math.PI / zo * Math.sin(Math.PI * (s - Lr + zo) / zo) / 2 : 0;
  return { zi, zo, th, dth };
}

// One brush-down path (pieces with their tilt) as the carriage runs it:
// pieces { g, v, on, row, w?, ws? } — g its line or arc, v the speed it may
// go there, on: the tip on the board, w and ws a W riding on it (degrees,
// °/s) — and the tip's trace for the preview, points { x, y, k }, k the
// brush's weight: 1 upright, 0 at ±45°.
function onTheMove(p, o) {
  const swing = Math.sign(o.swing) * LIFT_DEG;          // the side the brush leaves to, at a path's ends
  const phi = t => Math.sign(t) * Math.min(Math.abs(t), LIFT_DEG);   // the wrist at a turn, as far as the tip is followed
  const groups = [];
  for (const g of p) {
    const last = groups.at(-1);
    if (last && last.tilt === g.tilt) last.p.push(g); else groups.push({ tilt: g.tilt, p: [g], row: g.row });
  }
  const out = [], trace = [];
  let line = null, turns = 0, lifts = 0, need = 0;
  const touch = (q, k) => { if (k <= 1e-9) { line = null; return; } if (!line) trace.push(line = []); line.push({ x: q.x, y: q.y, k }); };
  const put = (g, on, row, w, v = o.speed) => out.push({ g, on, row, v: g.t === 'A' ? arcSpeed(v, g.r) : v, ...w });
  groups.forEach((G, i) => {
    if (G.tilt) {                                        // a turn at one tilt: the carriage aside by the tip
      turns++;
      const off = pt(0, -tipY(phi(G.tilt))), on = onBoard(G.tilt), k = 1 - Math.abs(G.tilt) / LIFT_DEG;
      if (!on) lifts++;
      G.p.forEach((g, j) => {
        put(shift(g, off), on ? 1 : 0, G.row, j === 0 && !on && Math.abs(G.tilt) > LIFT_DEG ? { w: G.tilt, ws: WRIST_MAX } : {});
        if (on) { const q = [g.a]; points(g, q); q.forEach(v => touch(v, k)); }
      });
      if (!on) line = null;
      return;
    }
    const tr = trackOf(G.p), Lr = tr.at(-1).s1;
    const from = i ? phi(groups[i - 1].tilt) : swing, to = i < groups.length - 1 ? phi(groups[i + 1].tilt) : swing;
    const car = (W, s) => {                              // the carriage under the tip at s: aside by the tip's offset
      const q = atTrack(tr, s), th = W.th(s);
      return { p: pt(q.p.x, q.p.y - tipY(th)), t: unit(pt(q.t.x, q.t.y - tipY1(th) * W.dth(s))), th };
    };
    // the steps of a tail: the tip keeps the brush's speed along the row, so
    // the carriage goes as much faster or slower as its way there is longer
    // or shorter than the tip's — longer aside of a row along X, shorter
    // along a row along Y, where the wrist carries the tip on with it
    const steps = (W, a, b) => {
      const n = Math.max(1, Math.ceil((b - a) / TAIL_STEP)), ds = (b - a) / n, out = [];
      let c0 = car(W, a);
      for (let j = 1; j <= n; j++) {
        const c1 = car(W, a + ds * j), dc = Math.hypot(c1.p.x - c0.p.x, c1.p.y - c0.p.y);
        out.push({ c0, c1, rate: Math.abs(c1.th - c0.th) * o.speed / ds, v: Math.max(1, Math.min(SPEED_MAX, Math.round(o.speed * dc / ds))) });
        c0 = c1;
      }
      return out;
    };
    // a tail o.tail long, longer where the wrist would not keep up (the owner's Tail is the least)
    const fit = (lift, ang) => {
      if (!ang) return 0;
      for (let z = Math.min(o.tail, Lr / 2); ; z = Math.min(Lr / 2, z * 1.15)) {
        const W = lift ? rowWrist(Lr, 0, ang, 0, z) : rowWrist(Lr, ang, 0, z, 0);
        if (z >= Lr / 2 - 1e-9 || Math.max(...steps(W, lift ? Lr - z : 0, lift ? Lr : z).map(q => q.rate)) <= WRIST_MAX) return z;
      }
    };
    const W = rowWrist(Lr, from, to, fit(false, from), fit(true, to));
    const zone = (a, b) => {                             // a tail: biarcs through the carriage's points, a W on each
      steps(W, a, b).forEach(({ c0, c1, rate, v }, j) => {
        need = Math.max(need, rate);
        const ws = j === 0 && !a ? WRIST_MAX : rate;     // the first of a landing comes down from the air too: as fast as it goes
        biarc(c0.p, c0.t, c1.p, c1.t).forEach((g, m) => put(g, 1, G.row, m ? {} : { w: round1(c1.th), ws: Math.max(1, Math.min(WRIST_MAX, Math.ceil(ws))) }, v));
      });
    };
    if (W.zi) zone(0, W.zi);
    for (const g of cutTrack(tr, W.zi, Lr - W.zo)) put(g, 1, G.row, {});
    if (W.zo) zone(Lr - W.zo, Lr);
    for (let s = 0; ; s = Math.min(Lr, s + 2)) {          // the tip: the row itself, light in its tails
      touch(atTrack(tr, s).p, 1 - Math.abs(W.th(s)) / LIFT_DEG);
      if (s >= Lr) break;
    }
  });
  return { pieces: out, trace, turns, lifts, need };
}

// ---------- the time: the board's planner (firmware path.h), run here ----------
const ACCEL = 250, TICK = 0.02, KINK = Math.cos(rad(10));
// seconds along pieces { g, v }, the queue of 16 looked ahead as the board does
function pathTime(ps) {
  const n = ps.length, len = ps.map(q => pieceLen(q.g)), dir = ps.map(q => [at(q.g, 0).t, at(q.g, pieceLen(q.g)).t]);
  const J = ps.map((q, i) => i + 1 < n && dot(dir[i][1], dir[i + 1][0]) >= KINK ? Math.min(q.v, ps[i + 1].v) : 0);
  let h = 0, s = 0, v = 0, t = 0;
  for (let guard = 0; h < n && guard < 1e6; guard++) {
    const end = Math.min(n, h + 16);
    let vmax = ps[h].v, d = len[h] - s;
    for (let k = h; k < end; k++) {
      const vj = k + 1 < end ? J[k] : 0;
      vmax = Math.min(vmax, Math.sqrt(vj * vj + 2 * ACCEL * Math.max(d, 0)));
      if (k + 1 < end) d += len[k + 1];
    }
    const vn = Math.min(v + ACCEL * TICK, vmax);
    s += (v + vn) / 2 * TICK; v = vn; t += TICK;
    while (h < n && s >= len[h] - 1e-3) { s = Math.max(0, s - len[h]); h++; }
  }
  return t;
}
const travelTime = (L, v) => L > v * v / ACCEL ? L / v + v / ACCEL : 2 * Math.sqrt(L / ACCEL);
// each brush-down path besides its pieces: the wrist's zero, the brush off at its end, the runner's waits (est.)
const PATH_S = 2;

// A pass's paths, centred on Here by the box the carriage covers.
function centred(o, angle) {
  const ps = paths(o, angle), all = ps.flatMap(tracePoints);
  const bx = { x0: Math.min(...all.map(q => q.x)), x1: Math.max(...all.map(q => q.x)), y0: Math.min(...all.map(q => q.y)), y1: Math.max(...all.map(q => q.y)) };
  const mid = pt(-(bx.x0 + bx.x1) / 2, -(bx.y0 + bx.y1) / 2);
  return { ps: ps.map(p => p.map(g => shift(g, mid))), width: bx.y1 - bx.y0, height: bx.x1 - bx.x0 };
}

export function xyPlan(opts) {
  const o = { ...DEFAULTS, ...opts };
  if (opts?.board && !opts.boardW) o.boardW = o.boardH = opts.board;   // one size for both, before 2026-10-02
  // the passes: D's that are on, in their order; A, B and C are one, unturned
  // each moved by its own shift; the rows, the length, the bow and the wave are shared
  const keys = o.pattern === 'D' ? Object.keys(PASSES).filter(k => (o.passes || []).includes(k)) : [null];
  const passes = keys.map(key => {
    const sh = (key && o.shift?.[key]) || {}, v = pt(+sh.x || 0, +sh.y || 0);
    const c = centred(o, key ? PASSES[key].angle + (+sh.a || 0) : 0);
    return { key, ps: c.ps.map(p => p.map(g => shift(g, v))),
      box: { x0: v.x - c.height / 2, x1: v.x + c.height / 2, y0: v.y - c.width / 2, y1: v.y + c.width / 2 } };
  });
  const box = { x0: Math.min(...passes.map(q => q.box.x0)), x1: Math.max(...passes.map(q => q.box.x1)),
    y0: Math.min(...passes.map(q => q.box.y0)), y1: Math.max(...passes.map(q => q.box.y1)) };
  const width = box.y1 - box.y0, height = box.x1 - box.x0;
  const room = { w: o.boardW - 2 * o.margin, h: o.boardH - 2 * o.margin };
  const fits = box.x0 >= -room.h / 2 - 1e-9 && box.x1 <= room.h / 2 + 1e-9 && box.y0 >= -room.w / 2 - 1e-9 && box.y1 <= room.w / 2 + 1e-9;

  const f = v => (Math.round(v * 100) / 100).toFixed(2);
  const X0 = o.here?.x ?? 0, Y0 = o.here?.y ?? 0, M = q => `${f(X0 + q.x)} ${f(Y0 + q.y)}`;
  const blocks = [{ kind: 'arm', cmd: `J 3 ${o.swing}`, row: 0 }];
  const preview = [], car = [];
  let length = 0, turns = 0, lifts = 0, need = 0, seconds = 1, at0 = pt(0, 0);
  passes.forEach(({ key, ps }, n) => {
    // between D's passes, always: another paint; the carriage stays where it is (the owner, 2026-10-02: "a break, not the end of the day")
    if (n) blocks.push({ kind: 'pause', why: `${key}, ${PASSES[key].paint}: its paint on the brush, then Continue`, row: 0 });
    ps.forEach((p, i) => {
      const m = onTheMove(p, o), first = m.pieces[0].g.a;
      turns += m.turns; lifts += m.lifts; need = Math.max(need, m.need);
      blocks.push({ kind: 'move', cmds: [`T ${o.travel}`, `M ${M(first)}`, 'G'], lengthMM: null, paintMM: 0, row: p[0].row });
      // one move, the brush landing at its start, lifting at its end and at every turn, on the way
      const cmds = [`F ${o.speed}`];
      let v = o.speed, len = 0, paint = 0;
      for (const q of m.pieces) {
        if (q.w !== undefined) cmds.push(`W ${q.w} ${q.ws}`);
        if (q.v !== v) { cmds.push(`F ${q.v}`); v = q.v; }
        cmds.push(q.g.t === 'L' ? `L ${M(q.g.b)}` : `A ${M(q.g.c)} ${M(q.g.b)} ${q.g.d}`);
        const L = pieceLen(q.g);
        len += L; if (q.on) paint += L;
        car.push(q.g);
      }
      cmds.push('G');
      length += paint;
      blocks.push({ kind: 'move', cmds, lengthMM: len, paintMM: paint, painted: m.pieces.map(q => q.on), row: p[0].row });
      blocks.push({ kind: 'arm', cmd: `J 3 ${o.swing}`, row: p.at(-1).row });   // in the air already: the brush put away
      if (!o.snake && o.pause && i < ps.length - 1) blocks.push({ kind: 'pause', why: `paint for the brush, then Continue: row ${i + 2} of ${o.rows}`, row: i + 1 });
      for (const l of m.trace) preview.push(Object.assign(l, { pass: key }));   // its paint, on the preview
      seconds += travelTime(Math.hypot(first.x - at0.x, first.y - at0.y), o.travel) + pathTime(m.pieces) + PATH_S;
      at0 = m.pieces.at(-1).g.b;
    });
  });
  // at 100 % the carriage goes home, to the corner where home is set, as a
  // job does: the end seen on the machine, not only on the screen (the
  // owner, 2026-10-02; it stood over Here before)
  const home = homeCorner();
  blocks.push({ kind: 'move', cmds: [`T ${o.travel}`, `M ${f(home.x)} ${f(home.y)}`, 'G'], lengthMM: null, paintMM: 0, row: o.rows, home: true });
  seconds += travelTime(Math.hypot(X0 + at0.x - home.x, Y0 + at0.y - home.y), o.travel);
  // where the carriage goes, from Here: the paint's box aside by the tails (the walls check)
  const cp = car.flatMap(g => { const q = [g.a]; points(g, q); return q; });
  const carriage = { x0: Math.min(...cp.map(q => q.x)), x1: Math.max(...cp.map(q => q.x)), y0: Math.min(...cp.map(q => q.y)), y1: Math.max(...cp.map(q => q.y)) };
  return { blocks, preview, width, height, room, box, carriage, length, fits,
    seconds, rows: o.rows, snake: !!o.snake, turns, lifts, need, passes: keys.filter(Boolean), opts: o };
}
