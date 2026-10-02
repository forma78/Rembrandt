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

// The wrist on the board (2026-10-02): the brush leaves it at ±LIFT_DEG
// (the owner, on Calibration) and drags DRAG_MM along Y between touching it
// and standing upright (a ruler).
export const LIFT_DEG = 45, DRAG_MM = 50;
const rad = d => d * Math.PI / 180;
export const tipY = deg => DRAG_MM / Math.sin(rad(LIFT_DEG)) * Math.sin(rad(deg));   // the tip along Y from upright (est.)
const onBoard = deg => Math.abs(deg) < LIFT_DEG;

// What the brush paints on path p, the wrist going from swing down to the
// first stretch's angle, from stretch to stretch, and back to swing:
// polylines, one a touch of the board.
function brushTrace(p, swing) {
  const out = [], at = (q, d) => pt(q.x, q.y + tipY(d));
  let w = swing, cur = null;
  // the wrist from w to d, the carriage standing at q: on the board it drags
  const turnWrist = (q, d) => {
    const lo = Math.max(Math.min(w, d), -LIFT_DEG), hi = Math.min(Math.max(w, d), LIFT_DEG);
    if (lo < hi) {
      const [from, to] = w < d ? [lo, hi] : [hi, lo];
      if (!cur) out.push(cur = [at(q, from)]);
      cur.push(at(q, to));
    }
    if (!onBoard(d)) cur = null;
    w = d;
  };
  for (let j = 0; j < p.length;) {
    const d = p[j].tilt;
    turnWrist(p[j].a, d);
    for (; j < p.length && p[j].tilt === d; j++) {
      if (!cur) continue;                                   // in the air
      const q = []; points(p[j], q);
      cur.push(...q.map(v => at(v, d)));
    }
  }
  turnWrist(p.at(-1).b, swing);
  return out;
}

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
  const preview = [];
  let length = 0, moved = 0, turns = 0, lifts = 0;
  const paint = grp => {           // one move with the brush on — or lifted, a turn at 45°
    const cmds = [`F ${o.speed}`], on = onBoard(grp[0].tilt);
    let v = o.speed, len = 0;
    for (const g of grp) {
      const want = g.t === 'A' ? arcSpeed(o.speed, g.r) : o.speed;
      if (want !== v) { cmds.push(`F ${want}`); v = want; }
      cmds.push(g.t === 'L' ? `L ${M(g.b)}` : `A ${M(g.c)} ${M(g.b)} ${g.d}`);
      len += pieceLen(g);
    }
    cmds.push('G');
    moved += len;
    if (on) length += len;
    return { kind: 'move', cmds, lengthMM: len, paintMM: on ? len : 0, painted: grp.map(() => on ? 1 : 0), row: grp[0].row };
  };
  let runs = 0;
  passes.forEach(({ key, ps }, n) => {
    // between D's passes, always: another paint
    if (n) blocks.push({ kind: 'pause', why: `${key}, ${PASSES[key].paint}: its paint on the brush, then Continue`, row: 0 });
    runs += ps.length;
    ps.forEach((p, i) => {
      blocks.push({ kind: 'move', cmds: [`T ${o.travel}`, `M ${M(p[0].a)}`, 'G'], lengthMM: null, paintMM: 0, row: p[0].row });
      // the brush down (J 3 0), then a move for every stretch at one angle of
      // the wrist: upright along the rows, tilted through the turns
      for (let j = 0; j < p.length;) {
        const grp = [p[j++]];
        while (j < p.length && p[j].tilt === grp[0].tilt) grp.push(p[j++]);
        if (grp[0].tilt) { turns++; if (!onBoard(grp[0].tilt)) lifts++; }
        blocks.push({ kind: 'arm', cmd: `J 3 ${grp[0].tilt}`, row: grp[0].row }, paint(grp));
      }
      blocks.push({ kind: 'arm', cmd: `J 3 ${o.swing}`, row: p.at(-1).row });             // the brush off: the hook
      if (!o.snake && o.pause && i < ps.length - 1) blocks.push({ kind: 'pause', why: `paint for the brush, then Continue: row ${i + 2} of ${o.rows}`, row: i + 1 });
      for (const line of brushTrace(p, o.swing)) preview.push(Object.assign(line, { pass: key }));   // its paint, on the preview
    });
  });
  // at 100 % the carriage goes home, to the corner where home is set, as a
  // job does: the end seen on the machine, not only on the screen (the
  // owner, 2026-10-02; it stood over Here before)
  const home = homeCorner();
  blocks.push({ kind: 'move', cmds: [`T ${o.travel}`, `M ${f(home.x)} ${f(home.y)}`, 'G'], lengthMM: null, paintMM: 0, row: o.rows, home: true });
  // the painting, the moves, the wrist off and on, and twice at every turn (est.)
  const seconds = moved / o.speed + runs * (o.pitch / o.travel + 5) + turns * 2;
  return { blocks, preview, width, height, room, box, length, fits,
    seconds, rows: o.rows, snake: !!o.snake, turns, lifts, passes: keys.filter(Boolean), opts: o };
}
