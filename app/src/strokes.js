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
// The new arm (2026-10-02, below): the elbow lifts the brush off the canvas,
// as a hand does; the broom and the wrist's drags above are history.
//
// INK ON (the owner, 2026-10-03): the brush takes its paint from the cup of
// the Ink tab. Before every row it goes there over the cup's rim, dips —
// down into the paint, a second, up — and goes to the row; after the row it
// goes back to the cup, not on to the next row; home at the end. C's and
// D's rows run one way each, as the snake's first row runs: top to bottom
// on D1. INK OFF is everything as it was.
//
// Machine mm: X up the picture, Y to the right. "Here" is where the carriage
// stands with the brush over the board's centre. No DOM.

import { arcSpeed, homeCorner, reach, lineCuts, arcCuts } from './machine.js';

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
  tilt: 45,                   // the turns' mark in the rows' pieces, before the new arm the wrist's angle there
  lift: true,                 // the brush up through every turn (the elbow); off: a snake's turns painted too
  tail: 3,                    // mm: along the first and the last of every row the brush lands and lifts, on the move (est.); TAIL_MIN … TAIL_MAX
  wave: 0,                    // mm: a row waves this far either side of its line or arc; 0 — none
  waveLen: 100,               // mm, about a wave along the row (est.)
  pause: true,                // after every row: paint for the brush
  ink: false,                 // INK ON: a dip in the cup of the Ink tab before every row, the rows one way (the owner, 2026-10-03)
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
export function turn(E, t, D) {
  const n = dot(D, pt(-t.y, t.x)) > 0 ? pt(-t.y, t.x) : pt(t.y, -t.x);
  const r = dot(D, n) / 2, q = dot(D, t), out = [];
  let p = E;
  if (q > 1e-6) { out.push({ t: 'L', a: p, b: add(p, t, q) }); p = add(p, t, q); }
  const f = add(p, n, 2 * r);
  out.push({ t: 'A', a: p, b: f, c: add(p, n, r), r, d: Math.sign(cross(t, n)) || 1 });
  if (q < -1e-6) out.push({ t: 'L', a: f, b: add(f, t, q) });
  return out;
}
export function sweepOf(g) {
  const a0 = Math.atan2(g.a.y - g.c.y, g.a.x - g.c.x), a1 = Math.atan2(g.b.y - g.c.y, g.b.x - g.c.x);
  let s = (a1 - a0) * g.d;
  while (s <= 1e-9) s += 2 * Math.PI;
  while (s > 2 * Math.PI + 1e-9) s -= 2 * Math.PI;
  return s;
}
export const pieceLen = g => g.t === 'L' ? Math.hypot(g.b.x - g.a.x, g.b.y - g.a.y) : g.r * sweepOf(g);
function points(g, out) {
  if (g.t === 'L') { out.push(g.b); return; }
  const a0 = Math.atan2(g.a.y - g.c.y, g.a.x - g.c.x), s = sweepOf(g), n = Math.max(4, Math.ceil(s / 0.05));
  for (let i = 1; i <= n; i++) { const a = a0 + g.d * s * i / n; out.push(pt(g.c.x + g.r * Math.cos(a), g.c.y + g.r * Math.sin(a))); }
}
const shift = (g, v) => g.t === 'L' ? { ...g, a: add(g.a, v), b: add(g.b, v) } : { ...g, a: add(g.a, v), b: add(g.b, v), c: add(g.c, v) };
export const reverse = p => p.slice().reverse().map(g => g.t === 'L' ? { ...g, a: g.b, b: g.a } : { ...g, a: g.b, b: g.a, d: -g.d });
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
export function at(g, s) {
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
export function biarc(p0, t0, p1, t1) {
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
    return turn(g.b, t, D).map(q => ({ ...q, tilt, row, turn: true }));
  };
  const step = k => turnPt(pt(-k, 0), angle);
  if (o.snake && o.ink) {
    // INK ON: every row on its own, one way, as the snake's first row runs —
    // the brush dips in the cup before each (2026-10-03)
    for (let k = 0; k < o.rows; k++) out.push(place(shape, step(k * o.pitch), k + 1));
  } else if (o.snake) {
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
// The box round points, by a loop: Math.min(...) runs out of stack on a long
// path (200 rows, the owner, 2026-10-03)
function boxOf(qs) {
  const b = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
  for (const q of qs) { if (q.x < b.x0) b.x0 = q.x; if (q.x > b.x1) b.x1 = q.x; if (q.y < b.y0) b.y0 = q.y; if (q.y > b.y1) b.y1 = q.y; }
  return b;
}
export const plotPaths = (opts, angle) => paths({ ...DEFAULTS, ...opts }, angle);   // for the tests

// The table round the board, either side across, where rows may run past it, mm.
export const TABLE_MM = 50;
// The brush's trace across a row, for the preview (est.): rows 4.5 mm apart
// left grooves between them on the canvas, about 1 mm each
// (test_results/IMAGE 2026-10-02 17:12:24.jpg, photo_2026-10-02 D2+D3.jpeg);
// drawn 10 mm wide before, they ran together (the owner, 2026-10-02).
export const BRUSH_MM = 3.5;
const round1 = v => Math.round(v * 10) / 10;
const rad = d => d * Math.PI / 180;

// ---------- the brush lands and lifts on the move, by the elbow ----------
// The new arm (the owner, 2026-10-02: "people do not move the brush aside,
// they lift it off the canvas, the human way"; "on the move: the tail a
// smooth easing of the pressure, no stops"). The elbow lifts the brush up:
// 0° pressed, the active pose; off the canvas at ELBOW_LIFT (measured); up
// at ELBOW_UP (est.). Over the first and the last `tail` mm of a row the
// elbow goes between pressed and the lift-off on a half cosine — the
// pressure easing in and out — and through a turn the brush is up. The tip
// keeps to the row, the carriage runs it as it is. The elbow goes by place:
// a W 2 rides on every TAIL_STEP mm of a tail, the board turning it as the
// carriage reaches the piece — whatever the speed, a brake, a pause. The
// wrist stands at 0° all the while ("the broom again" otherwise).
export const ELBOW_LIFT = 10, ELBOW_UP = 25, ELBOW_HOVER = 12;   // HOVER: just over the canvas, before a stroke (NOLAN), est.   // the lift-off measured +9.8° from the zero raised after midnight ("round it to +10"); ELBOW_UP est.
const TAIL_STEP = 16;           // mm along a tail a W
export const WRIST_MAX = 211;   // °/s, the firmware's fastest for W (2400 ticks/s; the servo makes about 250, est.)
export const SPEED_MAX = 250;   // mm/s, the board's fastest path (firmware F, 1…250 since 2026-10-02)
export const MIN_PIECE = 0.05;  // mm: a shorter piece is a sliver, never sent (plotRun)
// Tail, 10 … 20 mm on NOLAN and Test: at 155 mm the brush was fully pressed on
// 30 % of the ribbon, the pieces' ends never painted (machine/2026-10-04-
// test_both.png); at 15 on 92 %. The owner, 2026-10-04: "take it away past
// 20 mm altogether, it is not needed, so there is no temptation"; then "on
// Test too". Then 0.05 … 5 (the owner, 2026-10-05: "I do not use it, to be
// honest; past 3 mm it starts to play up — cut it to 0.05 … 5 mm"): a tail
// under MIN_PIECE is a sliver, never sent, its W riding on the next piece.
export const TAIL_MIN = 0.05, TAIL_MAX = 5;   // 10 … 20 at first; 3 … 20 since the elbow keeps pace with the carriage at a path's ends (2026-10-04, the breaks)
export const tailIn = v => Math.max(TAIL_MIN, Math.min(TAIL_MAX, Number.isFinite(v) ? v : DEFAULTS.tail));
const sliver = (g, min = MIN_PIECE) => Math.hypot(g.b.x - g.a.x, g.b.y - g.a.y) < min;
// How far the board runs a piece from where it stands, as the firmware takes
// it (path.h, arc): an arc's sweep from its start's angle to its end's, the
// way d goes — ends that meet are a full circle.
const boardLen = (from, g) => g.t === 'L' ? Math.hypot(g.b.x - from.x, g.b.y - from.y)
  : Math.hypot(from.x - g.c.x, from.y - g.c.y) * sweepOf({ ...g, a: from });
const FAULT_MM = 0.5;   // more than this between the drawing and what the board would run: no run

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
// The elbow along a row Lr long: from `from` to pressed over its first zi
// mm, pressed, then to `to` over its last zo — a half cosine each, level at
// both ends.
function rowLift(Lr, from, to, zi, zo) {
  return s => s < zi ? from * (1 + Math.cos(Math.PI * s / zi)) / 2 : s > Lr - zo ? to * (1 - Math.cos(Math.PI * (s - Lr + zo) / zo)) / 2 : 0;
}

// One brush-down path (pieces marked as rows or turns) as the carriage runs
// it: pieces { g, v, on, row, w?, ws? } — g its line or arc, v the speed it
// may go there, on: the brush on the canvas, w and ws a W 2 riding on it
// (degrees, °/s) — and the tip's trace for the preview, points { x, y, k },
// k the brush's weight: 1 pressed, 0 at the lift-off.
function onTheMove(p, o) {
  const groups = [];                                    // rows, and the turns the brush goes up through
  for (const g of p) {
    const up = !!(o.lift && g.turn), last = groups.at(-1);
    if (last && last.up === up) last.p.push(g); else groups.push({ up, p: [g], row: g.row });
  }
  const out = [], trace = [];
  let line = null, turns = 0, need = 0;
  const touch = (q, k) => { if (k <= 1e-9) { line = null; return; } if (!line) trace.push(line = []); line.push({ x: q.x, y: q.y, k }); };
  const put = (g, on, row, w) => out.push({ g, on, row, v: g.t === 'A' ? arcSpeed(o.speed, g.r) : o.speed, ...w });
  const fast = deg => ({ w: deg, ws: WRIST_MAX });
  // The carriage starts the path at rest and stops at its end (firmware
  // path.h, ACCEL): near them it is slow, and the elbow keeps pace with it,
  // not with the speed it never reaches there — else it lifts before the end
  // (NOLAN, 2026-10-04: the lines broke at their ends).
  const all = p.reduce((s, g) => s + pieceLen(g), 0);
  let off = 0;                                          // where the group starts along the path
  const carriage = s => Math.min(o.speed, Math.sqrt(2 * ACCEL * Math.max(0, Math.min(off + s, all - off - s))));
  const secs = (s0, s1) => { let t = 0; const h = (s1 - s0) / 8; for (let q = 0; q < 8; q++) t += h / Math.max(1, carriage(s0 + h * (q + 0.5))); return t; };
  groups.forEach(G => {
    if (G.up) {                                         // a turn in the air: up at its start, down to the lift-off by its end
      turns++;
      const tr = trackOf(G.p), L = tr.at(-1).s1;
      cutTrack(tr, 0, L / 2).forEach((g, j) => put(g, 0, G.row, j ? {} : fast(ELBOW_UP)));
      cutTrack(tr, L / 2, L).forEach((g, j) => put(g, 0, G.row, j ? {} : fast(ELBOW_LIFT)));
      line = null; off += L;
      return;
    }
    // its last tail its own when a piece says so: a loop's lap, the lift-off over all of it (NOLAN, band.js lapLoops)
    const tr = trackOf(G.p), Lr = tr.at(-1).s1, z = Math.min(o.tail, Lr / 2), zo = Math.min(G.p.at(-1).tailOut ?? o.tail, Lr / 2), th = rowLift(Lr, ELBOW_LIFT, ELBOW_LIFT, z, zo);
    const zone = (a, b) => {                            // a tail: the row cut every TAIL_STEP mm, a W 2 on each step
      const n = Math.max(1, Math.ceil((b - a) / TAIL_STEP)), ds = (b - a) / n;
      for (let j = 0; j < n; j++) {
        const s0 = a + ds * j, s1 = s0 + ds, rate = Math.abs(th(s1) - th(s0)) / secs(s0, s1);
        need = Math.max(need, rate);
        const ws = j === 0 && !a ? WRIST_MAX : rate;    // the first of a landing comes down from the air too: as fast as it goes
        cutTrack(tr, s0, s1).forEach((g, m) => put(g, 1, G.row, m ? {} : { w: round1(th(s1)), ws: Math.max(1, Math.min(WRIST_MAX, Math.ceil(ws))) }));
      }
    };
    zone(0, z);
    for (const g of cutTrack(tr, z, Lr - zo)) put(g, 1, G.row, {});
    zone(Lr - zo, Lr);
    for (let s = 0; ; s = Math.min(Lr, s + 2)) {         // the tip: the row itself, light in its tails
      touch(atTrack(tr, s).p, 1 - th(s) / ELBOW_LIFT);
      if (s >= Lr) break;
    }
    off += Lr;
  });
  return { pieces: out, trace, turns, lifts: turns, need };
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
// an elbow move in the air, the carriage standing: the runner turns it and waits till it is there (est.)
const ARM_S = 1;

// ---------- the walls press the path, as on the Job tab ----------
// The board takes no piece past a wall, and a run stopped there stops with
// the brush on the board. The page refused such a run before; the owner,
// 2026-10-03, D1 2 mm past the bottom wall: "remove this restriction". So
// the path is pressed into the walls as the Job tab presses a job
// (machine.js, jobToMachine): what lies past one runs along it, a straight
// line; a part that presses into a point is dropped, its W kept for the
// next. B: the reach from Here, mm; past: how many mm were pressed.
const EDGE_IN = 0.1;   // inside the walls, as the Job (machine.js)
const inB = (q, B) => q.x >= B.x0 && q.x <= B.x1 && q.y >= B.y0 && q.y <= B.y1;
const intoB = (q, B) => pt(Math.min(B.x1, Math.max(B.x0, q.x)), Math.min(B.y1, Math.max(B.y0, q.y)));
function pressed(pieces, B) {
  const out = [];
  let past = 0, carry = null;                                // a W whose piece was pressed into a point
  for (const q of pieces) {
    const g = q.g, own = q.w !== undefined ? { w: q.w, ws: q.ws } : null;
    // A sliver is never pressed: an arc whose ends meet is a full circle, and
    // pressed it ran along the walls, the brush down (NOLAN, 2026-10-04 12:58,
    // the cup nearly knocked off the table). Inside, it stays as it is and is
    // never sent (plotRun); past a wall it is a point pressed: its W rides on.
    if (sliver(g)) { if (inB(g.a, B) && inB(g.b, B)) out.push(q); else if (own) carry = own; continue; }
    let first = true;
    const add = g2 => {
      const w = first ? own || carry : null;
      out.push({ g: g2, v: q.v, on: q.on, row: q.row, ...(w || {}) });
      if (w) carry = null;
      first = false;
    };
    const press = (a, b, L) => { past += L; const A = intoB(a, B), Z = intoB(b, B); if (Math.hypot(Z.x - A.x, Z.y - A.y) >= 1e-6) add({ t: 'L', a: A, b: Z }); };
    if (g.t === 'L') {
      const cuts = lineCuts(g.a, g.b, B), P = t => t >= 1 ? g.b : t <= 0 ? g.a : pt(g.a.x + (g.b.x - g.a.x) * t, g.a.y + (g.b.y - g.a.y) * t);
      const mids = cuts.slice(1).map((c, k) => inB(P((cuts[k] + c) / 2), B));
      if (mids.every(Boolean)) add(g);                       // inside: the piece as it is
      else for (let k = 1; k < cuts.length; k++) {
        const a = P(cuts[k - 1]), b = P(cuts[k]);
        if (mids[k - 1]) add({ t: 'L', a, b }); else press(a, b, Math.hypot(b.x - a.x, b.y - a.y));
      }
    } else {
      const a0 = Math.atan2(g.a.y - g.c.y, g.a.x - g.c.x), sw = g.d * sweepOf(g);
      const P = t => t >= 1 ? g.b : t <= 0 ? g.a : pt(g.c.x + g.r * Math.cos(a0 + sw * t), g.c.y + g.r * Math.sin(a0 + sw * t));
      const cuts = arcCuts(g.c, g.r, a0, sw, B), mids = cuts.slice(1).map((c, k) => inB(P((cuts[k] + c) / 2), B));
      if (mids.every(Boolean)) add(g);
      else for (let k = 1, t0 = 0; k < cuts.length; k++) {   // neighbouring parts inside are one arc
        if (!mids[k - 1]) { press(P(cuts[k - 1]), P(cuts[k]), Math.abs(sw) * g.r * (cuts[k] - cuts[k - 1])); t0 = cuts[k]; continue; }
        if (k < mids.length && mids[k]) continue;
        if (Math.abs(sw) * g.r * (cuts[k] - t0) >= 1e-6) add({ t: 'A', a: P(t0), b: P(cuts[k]), c: g.c, r: g.r, d: g.d });
        t0 = cuts[k];
      }
    }
    if (first && own) carry = own;                         // nothing left of this piece: its W rides on the next
  }
  return { pieces: out, past };
}

// A pass's paths, centred on Here by the box the carriage covers.
function centred(o, angle) {
  const ps = paths(o, angle), all = ps.flatMap(tracePoints);
  const bx = boxOf(all);
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
  // between D's passes, always: another paint; the carriage stays where it is (the owner, 2026-10-02: "a break, not the end of the day")
  const why = key => `${key}, ${PASSES[key].paint}: its paint ${o.ink ? 'in the cup' : 'on the brush'}, then Continue`;
  const r = plotRun(o, passes.map(({ key, ps }) => ({ key, ps, why: key && why(key) })));
  return { blocks: r.blocks, preview: r.preview, width, height, room, box, carriage: r.carriage, length: r.length, fits,
    seconds: r.seconds, rows: o.rows, snake: !!o.snake, turns: r.turns, lifts: r.lifts, need: r.need, passes: keys.filter(Boolean), opts: o,
    ink: !!o.ink, cupAt: r.cupAt, air: r.air, homeAt: r.homeAt, dips: r.dips, pastWall: r.pastWall, gone: r.gone, fault: r.fault };
}

// The run of brush-down paths on the machine, for Test and NOLAN alike.
// passes: [{ key, ps, why }] in their order — ps the paths, mm from Here, each
// a list of pieces marked with their row (and `turn` through a turn); why: the
// pause before a pass after the first, for its paint. o: the speeds, the
// tail, lift, pause, ink, here, cup. The carriage goes home at the end.
export function plotRun(o, passes) {
  const f = v => (Math.round(v * 100) / 100).toFixed(2);
  const X0 = o.here?.x ?? 0, Y0 = o.here?.y ?? 0, M = q => `${f(X0 + q.x)} ${f(Y0 + q.y)}`;
  // INK ON: the cup of the Ink tab (carriage mm, its elbow angles), from Here; the brush up over its rim between rows
  const cup = o.ink && o.here && Number.isFinite(o.cup?.x) && Number.isFinite(o.cup?.y) ? o.cup : null;
  const cupAt = cup ? pt(cup.x - X0, cup.y - Y0) : null;
  const up = o.ink && Number.isFinite(o.cup?.rim) ? o.cup.rim : ELBOW_UP;
  const home = homeCorner(), homeAt = pt(home.x - X0, home.y - Y0);
  // the walls, from Here: the path is pressed into them (pressed, above); without Here nothing is
  const R = reach(), B = o.here ? { x0: R.x.min + EDGE_IN - X0, x1: R.x.max - EDGE_IN - X0, y0: R.y.min + EDGE_IN - Y0, y1: R.y.max - EDGE_IN - Y0 } : null;
  let pastWall = 0, gone = 0;
  // the brush up (the elbow), then the wrist to the active pose, in the air
  const blocks = [{ kind: 'arm', cmd: `J 2 ${up}`, row: 0 }, { kind: 'arm', cmd: 'J 3 0', row: 0 }];
  const preview = [], car = [], air = [];            // air: the brush's way off the board, with INK ON, for the page to draw
  let length = 0, turns = 0, lifts = 0, need = 0, seconds = 1, at0 = o.ink ? homeAt : pt(0, 0), dips = 0, fault = '';
  const min = o.minPiece ?? MIN_PIECE, real = ps => ps.filter(q => !sliver(q.g, min));
  const drawnOf = p => p.filter(g => !sliver(g, min)).reduce((s, g) => s + pieceLen(g), 0);
  const away = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
  passes.forEach(({ key, ps: ps0, why }, n) => {
    if (n && why) blocks.push({ kind: 'pause', why, row: 0 });   // a pass with no why runs on without one (NOLAN's watercolour)
    let dry = true;                                      // the brush at a pass's start: dry, or waited through the pause
    // With o.noDipUnder a pass starts on its first piece long enough for a
    // dip, the others after it in their order: a full brush never lands on a
    // dot (NOLAN, 2026-10-04: a puddle at every dot under 1 cm).
    const j = cupAt && o.noDipUnder ? ps0.findIndex(p => drawnOf(p) >= o.noDipUnder) : -1;
    const ps = j > 0 ? [ps0[j], ...ps0.slice(0, j), ...ps0.slice(j + 1)] : ps0;
    ps.forEach((p, i) => {
      const m = onTheMove(p, o), row = p[0].row;
      // The tails cut the row, they never add to it: the same length, or no run.
      const drawn = drawnOf(p), cut = real(m.pieces).reduce((s, q) => s + pieceLen(q.g), 0);
      if (!fault && Math.abs(cut - drawn) > FAULT_MM) fault = `row ${row}: ${round1(drawn)} mm drawn, ${round1(cut)} mm after its tails`;
      if (B) { const pr = pressed(m.pieces, B); m.pieces = pr.pieces; pastWall += pr.past; }
      if (!m.pieces.length) { gone++; return; }        // the whole row past a wall, pressed into a point: nothing to paint
      const first = m.pieces[0].g.a;
      turns += m.turns; lifts += m.lifts; need = Math.max(need, m.need);
      // o.noDipUnder (NOLAN): a shorter piece goes on what the brush holds, the first of a pass excepted
      const dipped = !!cupAt && (dry || !(drawn < o.noDipUnder));
      if (dipped) {
        dry = false;
        // the dip: to the cup over its rim, down into the paint, a second there, up over the rim again
        blocks.push({ kind: 'move', cmds: [`T ${o.travel}`, `M ${M(cupAt)}`, 'G'], lengthMM: null, paintMM: 0, row, dip: true },
          { kind: 'arm', cmd: `J 2 ${cup.dip}`, row, dip: true }, { kind: 'wait', s: cup.dwell, row, dip: true },
          { kind: 'arm', cmd: `J 2 ${cup.rim}`, row, dip: true });
        air.push([at0, cupAt]);
        seconds += travelTime(away(at0, cupAt), o.travel) + 2 * ARM_S + cup.dwell;
        at0 = cupAt; dips++;
      }
      if (o.ink) air.push([at0, first]);
      blocks.push({ kind: 'move', cmds: [`T ${o.travel}`, `M ${M(first)}`, 'G'], lengthMM: null, paintMM: 0, row });
      // from over the rim down to where the brush always lands from, in the air over the row's start: it lands as it did without the cup;
      // o.hover (NOLAN): just over the canvas, the carriage waiting — from +25° the elbow was still on its way down
      // when the carriage set off, and the line began 5–10 mm late (2026-10-04, machine/2026-10-04 Nolan-v3-both.png)
      const over = o.hover ?? ELBOW_UP;
      if (up !== over) { blocks.push({ kind: 'arm', cmd: `J 2 ${over}`, row }); seconds += ARM_S; }
      // one move, the brush landing at its start, lifting at its end and at every turn, on the way
      const cmds = [`F ${o.speed}`];
      let v = o.speed, len = 0, paint = 0;
      const sent = q => pt(+f(X0 + q.x) - X0, +f(Y0 + q.y) - Y0);   // a point as the command carries it, to 0.01 mm
      let on = sent(first);
      for (const q of m.pieces) {
        if (q.w !== undefined) cmds.push(`W 2 ${q.w} ${q.ws}`);
        // A sliver of a tail's cut, its ends closer than MIN_PIECE, is never
        // sent: the board takes an arc ending where it starts for a full circle
        // (firmware path.h, arc). A W before it rides on the next piece. The
        // owner, 2026-10-04: "of course, no need to send such noise to the board".
        if (sliver(q.g, min)) continue;
        if (q.v !== v) { cmds.push(`F ${q.v}`); v = q.v; }
        cmds.push(q.g.t === 'L' ? `L ${M(q.g.b)}` : `A ${M(q.g.c)} ${M(q.g.b)} ${q.g.d}`);
        const L = pieceLen(q.g);
        // what the board would run, from where it stands, as the command says it
        const g2 = q.g.t === 'L' ? { t: 'L', b: sent(q.g.b) } : { t: 'A', b: sent(q.g.b), c: sent(q.g.c), d: q.g.d }, Lb = boardLen(on, g2);
        if (!fault && Math.abs(Lb - L) > FAULT_MM) fault = `row ${row}: a piece of ${round1(L)} mm would run ${round1(Lb)} mm on the board`;
        on = g2.b;
        len += L; if (q.on) paint += L;
        car.push(q.g);
      }
      cmds.push('G');
      // pressed into the walls a row only gets shorter: longer is a path the drawing never had
      if (!fault && len > drawn + FAULT_MM) fault = `row ${row}: ${round1(drawn)} mm drawn, ${round1(len)} mm to the board`;
      length += paint;
      blocks.push({ kind: 'move', cmds, lengthMM: len, paintMM: paint, painted: real(m.pieces).map(q => q.on), row: p[0].row });   // one mark a piece sent, as rembrandt.py counts them
      blocks.push({ kind: 'arm', cmd: `J 2 ${up}`, row: p.at(-1).row });   // at the lift-off already: the brush up, over the cup's rim with INK ON
      if (!o.snake && o.pause && !o.ink && i < ps.length - 1) blocks.push({ kind: 'pause', why: `paint for the brush, then Continue: row ${i + 2} of ${o.rows}`, row: i + 1 });
      m.trace.forEach((l, j) => preview.push(Object.assign(l, { pass: key, dip: dipped && !j })));   // its paint, on the preview; dip: the brush fresh from the cup
      seconds += travelTime(Math.hypot(first.x - at0.x, first.y - at0.y), o.travel) + pathTime(real(m.pieces)) + PATH_S;
      at0 = m.pieces.at(-1).g.b;
    });
  });
  // at 100 % the carriage goes home, to the corner where home is set, as a
  // job does: the end seen on the machine, not only on the screen (the
  // owner, 2026-10-02; it stood over Here before)
  if (o.ink) air.push([at0, homeAt]);
  blocks.push({ kind: 'move', cmds: [`T ${o.travel}`, `M ${f(home.x)} ${f(home.y)}`, 'G'], lengthMM: null, paintMM: 0, row: o.rows, home: true });
  seconds += travelTime(Math.hypot(X0 + at0.x - home.x, Y0 + at0.y - home.y), o.travel);
  // where the carriage goes, from Here: the paint's box aside by the tails (the walls check)
  const cp = car.flatMap(g => { const q = [g.a]; points(g, q); return q; }).concat(cupAt ? [cupAt] : []);
  const carriage = boxOf(cp);
  return { blocks, preview, carriage, length, seconds, turns, lifts, need, cupAt, air, homeAt, dips, pastWall, gone, fault };
}
