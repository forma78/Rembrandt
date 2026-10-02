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
// The wrist (the owner, 2026-10-02, test_results/, the 15-row snake): it
// lays the brush down from −54°, minus to the left, so the brush touches
// the board left of the point under it and drags there — a fat blob 50 mm
// before the row (a ruler). The carriage stands `land` mm into the row as
// the brush comes down: the blob is the row's start, the drag its first mm.
// At a turn the bristles flipped over: the wrist tilts the brush `tilt`°
// like a broom, plus at the right end, minus at the left, and stands it
// upright again once the turn is done.
//
// Machine mm: X up the picture, Y to the right. "Here" is where the carriage
// stands with the brush over the board's centre. No DOM.

import { arcSpeed } from './machine.js';

export const PATTERNS = {
  A: { rows: 8, turn: 10, pitch: 25, snake: false },   // tight, the owner's sketch A
  B: { rows: 5, turn: 20, pitch: 40, snake: false },   // loose, sketch B
  // C, the snake (the owner, 2026-10-02: references/Screenshot 2026-10-02
  // snake.png): one continuous line, row after row, turning round at either
  // end; the brush stays down from the first row to the last
  C: { rows: 12, pitch: 20, snake: true },
};
export const DEFAULTS = {
  boardW: 300, boardH: 300,   // mm: the board across (Y) and up the picture (X)
  margin: 30,
  length: 220,                // mm, the chord of a row
  bow: 0,                     // mm: how far the middle of a row lies below its ends; 0 — straight
  speed: 30,                  // mm/s with the brush on (est.)
  travel: 100,                // mm/s between rows, the brush off
  swing: -54,                 // the wrist's brush off
  land: 50,                   // mm the wrist drags the brush along +Y as it lays it down (a ruler, 2026-10-02)
  tilt: 15,                   // degrees: the wrist through a turn, + at the right end, − at the left (est.)
  pause: true,                // after every row: paint for the brush
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

// The landing: the wrist drags the brush s mm along +Y as it lays it down,
// so the carriage stands s mm into the first row; the drag is a piece of its
// own ({ land: true }: the wrist paints it, the board does not run it). The
// row goes on from there to its own end as an arc that ends as the row did,
// so the turn after it stays smooth; a straight row stays a line.
function landed(p, s) {
  if (!(s > 0)) return p;
  const g = p[0], P = add(g.a, pt(0, 1), s), t = endDir(g), n = pt(-t.y, t.x);
  const v = add(P, g.b, -1), w = dot(v, n), k = dot(v, v) / (2 * w);
  const rest = Math.abs(w) < 1e-6 ? { t: 'L', a: P, b: g.b }
    : { t: 'A', a: P, b: g.b, c: add(g.b, n, k), r: Math.abs(k), d: Math.sign(k) };
  return [{ t: 'L', a: g.a, b: P, land: true, tilt: 0, row: g.row }, { ...rest, tilt: g.tilt, row: g.row }, ...p.slice(1)];
}

// The rows as pieces, a path per brush down (A, B: one a row; C: one in all).
// Every piece carries its row and the wrist's angle: 0 along a row, ±tilt
// through a turn.
function paths(o) {
  const half = o.length / 2, bow = Math.max(-half + 1, Math.min(half - 1, o.bow || 0));
  const out = [], along = (g, row) => ({ ...g, tilt: 0, row });
  const round = (g, D, row) => {   // the turn at the end of row g: + at the right end, − at the left
    const t = endDir(g), tilt = Math.sign(t.y) * (o.tilt || 0) || 0;
    return turn(g.b, t, D).map(q => ({ ...q, tilt, row }));
  };
  if (o.snake) {
    const p = [];
    for (let k = 0; k < o.rows; k++) {
      const x = -k * o.pitch, g = k % 2 === 0 ? row(x, -half, half, bow) : row(x, half, -half, bow);
      p.push(along(g, k + 1));
      if (k < o.rows - 1) p.push(...round(g, pt(-o.pitch, 0), k + 1));
    }
    out.push(p);
  } else {
    for (let k = 0; k < o.rows; k++) {
      const x = -k * o.pitch, g = row(x, -half, half, bow), back = row(x - o.turn, half, -half, bow);
      out.push([along(g, k + 1), ...round(g, pt(-o.turn, 0), k + 1), along(back, k + 1)]);
    }
  }
  return out.map(p => landed(p, Math.min(o.land || 0, half)));
}
const tracePoints = p => { const q = [p[0].a]; p.forEach(g => points(g, q)); return q; };
export const plotPaths = opts => paths({ ...DEFAULTS, ...opts });   // for the tests

export function xyPlan(opts) {
  const o = { ...DEFAULTS, ...opts };
  if (opts?.board && !opts.boardW) o.boardW = o.boardH = opts.board;   // one size for both, before 2026-10-02
  // the pieces, then centred on Here by the box the brush covers
  let ps = paths(o);
  const all = ps.flatMap(tracePoints);
  const bx = { x0: Math.min(...all.map(q => q.x)), x1: Math.max(...all.map(q => q.x)), y0: Math.min(...all.map(q => q.y)), y1: Math.max(...all.map(q => q.y)) };
  const mid = pt(-(bx.x0 + bx.x1) / 2, -(bx.y0 + bx.y1) / 2);
  ps = ps.map(p => p.map(g => shift(g, mid)));
  const width = bx.y1 - bx.y0, height = bx.x1 - bx.x0;
  const box = { x0: -height / 2, x1: height / 2, y0: -width / 2, y1: width / 2 };
  const room = { w: o.boardW - 2 * o.margin, h: o.boardH - 2 * o.margin };

  const f = v => (Math.round(v * 100) / 100).toFixed(2);
  const X0 = o.here?.x ?? 0, Y0 = o.here?.y ?? 0, M = q => `${f(X0 + q.x)} ${f(Y0 + q.y)}`;
  const blocks = [{ kind: 'arm', cmd: `J 3 ${o.swing}`, row: 0 }];
  const preview = [];
  let length = 0, turns = 0;
  const paint = grp => {           // one move with the brush on
    const cmds = [`F ${o.speed}`];
    let v = o.speed, len = 0;
    for (const g of grp) {
      const want = g.t === 'A' ? arcSpeed(o.speed, g.r) : o.speed;
      if (want !== v) { cmds.push(`F ${want}`); v = want; }
      cmds.push(g.t === 'L' ? `L ${M(g.b)}` : `A ${M(g.c)} ${M(g.b)} ${g.d}`);
      len += pieceLen(g);
    }
    cmds.push('G');
    length += len;
    return { kind: 'move', cmds, lengthMM: len, paintMM: len, painted: grp.map(() => 1), row: grp[0].row };
  };
  ps.forEach((p, i) => {
    const run = p.filter(g => !g.land);                                                  // the landing is the wrist's
    blocks.push({ kind: 'move', cmds: [`T ${o.travel}`, `M ${M(run[0].a)}`, 'G'], lengthMM: null, paintMM: 0, row: run[0].row });
    // the brush down (J 3 0), then a move for every stretch at one angle of
    // the wrist: upright along the rows, tilted through the turns
    for (let j = 0; j < run.length;) {
      const grp = [run[j++]];
      while (j < run.length && run[j].tilt === grp[0].tilt) grp.push(run[j++]);
      if (grp[0].tilt) turns++;
      blocks.push({ kind: 'arm', cmd: `J 3 ${grp[0].tilt}`, row: grp[0].row }, paint(grp));
    }
    blocks.push({ kind: 'arm', cmd: `J 3 ${o.swing}`, row: run.at(-1).row });           // the brush off: the hook
    if (!o.snake && o.pause && i < ps.length - 1) blocks.push({ kind: 'pause', why: `paint for the brush, then Continue: row ${i + 2} of ${o.rows}`, row: i + 1 });
    preview.push(tracePoints(p));
  });
  blocks.push({ kind: 'move', cmds: [`T ${o.travel}`, `M ${f(X0)} ${f(Y0)}`, 'G'], lengthMM: null, paintMM: 0, row: o.rows });
  // the painting, the moves, the wrist off and on, and twice at every turn (est.)
  const seconds = length / o.speed + ps.length * (o.pitch / o.travel + 5) + turns * 2;
  return { blocks, preview, width, height, room, box, length, fits: width <= room.w + 1e-9 && height <= room.h + 1e-9,
    seconds, rows: o.rows, snake: !!o.snake, turns, opts: o };
}
