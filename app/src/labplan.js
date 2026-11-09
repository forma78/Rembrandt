// LAB: a sheet of trial strokes on a scrap, every way of landing and lifting the brush side by side, a
// dip before each, a number on each (the owner, 2026-11-04, on OPM-N's first run with paint: "The elbow
// is not needed here, the wrist should do it, but do not take the elbow out altogether"; "the brush has
// one style of movement for the whole canvas"; of the three suspects, "let me name one: the elbow").
//
// The arm lies along X, so the elbow sweeps the tip along X as it lifts: along a stroke up X, across a
// stroke along Y, the hook. The wrist rolls round the arm: it sweeps the tip along Y, and lifts it hardly
// at all at small angles. All the numbers est.; the sheet is there to measure them.
import { handDip, homeBlocks } from './strokes.js';
import { cellOf, passesOf, canonRuns, canonCellsOf, seqOf } from './formgplan.js';
import { idleRunsOf } from './idleplan.js';
import { REAL_PIECES, REAL_LONG } from './labreal.js';
import { REAL3 } from './labreal3.js';
import { longEndFirst, startOnLong, ridersOnLong, jarsByCanvas, CANON } from './canon.js';

export const LAB = {
  speed: 25, travel: 120,      // mm/s, OPM-N's brush and a flight
  length: 50, step: 66, rowGap: 24, along: 50,   // mm: a stroke, column to column, row to row, the block of strokes up X
  tail: 3, wide: 8,            // mm: today's tail; a longer one where the carriage or the wrist goes with the elbow
  hover: 12, lift: 10, up: 25, // the elbow as OPM-N's run has it: over the canvas, off it, flying
  press: 0, light: 4,          // the elbow pressed, as tonight's run; pressed lightly, for the wrist's strokes (est.)
  accel: 250, turnMax: 211,    // the board's: mm/s², °/s for W
};
const COLS = 4, ROWS = 6;
export const labSize = (sheet = 1) => sheet >= 14 ?{ h: S14.size - LAB.rowGap, w: S14.size } : sheet === 13 ? { h: S13.size - LAB.rowGap, w: S13.size } : sheet >= 8 ? { h: S4.h - LAB.rowGap, w: S8.w } : sheet === 5 ? { h: S5.h - LAB.rowGap, w: S5.w } : sheet === 4 || sheet === 6 || sheet === 7 ? { h: S4.h - LAB.rowGap, w: S4.w } : ({ h: sheet === 3 ? S3.h : sheet === 2 ? S2.top : ROWS * LAB.rowGap + LAB.along, w: (COLS - 1) * LAB.step + (sheet === 3 ? S2.cellLong + 8 : LAB.length) });
// LAB 2.0 (the owner, the same night, of the first sheet: "yes, one correction for every way; a second
// sheet round 10, 11 and 12"; "21 goes with the fur, 20 against it"): the carriage against the elbow,
// sign + as the first sheet proved, the tip going +X as the elbow rises. Every line by its own points:
// the elbow's sweep is along X whatever way the stroke goes. Cells as OPM-N's: tracks, dips, a lap.
const S2 = { top: 258, cellLong: 36, tracks: 8, pitch: 2.5, every: 75, lap: 5 };
// LAB 3.0 (the owner, 2026-11-05, of the pink sheet's 23, one way, with the fur: "my favourite"; "yes, do LAB
// 3.0"): does its comb hold where the stroke does not go with the fur? Eight cells, every track one way, the
// carriage against the elbow 1.25 mm/° (the first sheets' 4 and 8). A shorter sheet: the bottom ran out on the last.
// Four tracks at first (the owner, the same night, a ruler on the blue sheet, IMG_2237: "the stroke is almost
// 1 cm; 8 strokes lie one on the other; let us make 4"): the cell's width as it was, the tracks shared out over it.
const S3 = { top: 80, bottom: 20, h: 96, mm: 1.25, tracks: 4 };
// LAB 3.0 · long (the owner, the same night: "excellent strokes; but what about the length? we have long ones … 60 mm
// 4 strokes, 80 mm 4 strokes and 100 mm, and 40 of course"; then, a new sheet of paper: "the vertical ones, but add
// the horizontal too, the same system of sizes"). Every track on one dip, so the sheet shows how far a dip carries;
// and a 100 of each with a second dip, on from a lap back, to see the seam a long track would need.
const S4 = { long: [40, 60, 80, 100], splitAt: 60, lap: 5, low: 20, high: 60, base: 100, col: 50, gap: 25, w: 235, h: 205 };
// LAB 3.0 · seam (the owner, 2026-11-05, of the long sheet's 5: "the gap between the line's second part has to go";
// its 4, on one dip, "a reject"; 1 and 6, 40 mm, good): 5 mm back was too little, the lift's own 8 mm being thin. Tracks of
// 80 mm, a second dip at 45, on from 10, 15 and 20 mm back, along X and along Y. All est.
const S5 = { len: 80, dipAt: 45, laps: [10, 15, 20], base: 100, col: 50, w: 190, h: 195 };
// LAB 3.0 · long snake (the owner, the same night: "all your tests were in the style of Drag Air, and I never use it; my
// guess is that with Drag Snake 4, 8 and 9 get right; instead of Seam make long-snake, Seam afterwards; we compare where the
// stroke is neater"): the long sheet's cells, its places and numbers, a snake with the brush down at its turns, cut as OPM-N's
// DRAG SNAKE cuts it (dragRowsOf). As much paint as on the long sheet: a dip per track's length and the lap, four a cell, its
// cuts right after the turns; 5 and 10, as there, 60 mm a dip, their cuts in the tracks.
const S6 = { lap: 15, every5: 60 };

// the sheet's list: its order the run's, its number the name you tell it by
const LIST = [
  { kind: 'markElbow', r: 0, c: 0, say: 'The elbow alone, the carriage still: the mark\'s length is its sweep along X' },
  { kind: 'markWrist', r: 0, c: 1, say: 'The wrist alone, ±10°, the carriage still: the mark\'s length is its sweep along Y' },
  { kind: 'today', r: 1, c: 0, say: 'Across →, as tonight' },
  { kind: 'today', r: 1, c: 1, back: true, say: 'Across ←, as tonight' },
  { kind: 'shallow', r: 1, c: 2, say: 'Across →, as tonight, a shallow dip +16°: less paint' },
  { kind: 'snake', r: 1, c: 3, say: 'Across, a snake\'s turn with the brush down, as tonight: the ear at a turn' },
  { kind: 'today', r: 2, c: 0, press: 2, say: 'Across →, pressed lighter, +2°' },
  { kind: 'today', r: 2, c: 1, press: 4, say: 'Across →, pressed lighter, +4°' },
  { kind: 'today', r: 2, c: 2, press: 6, say: 'Across →, pressed lighter, +6°' },
  { kind: 'comp', r: 3, c: 0, mm: 0.5, sign: 1, say: 'Across →, the carriage against the elbow, 0.5 mm/°, +X' },
  { kind: 'comp', r: 3, c: 1, mm: 1, sign: 1, say: 'Across →, the carriage against the elbow, 1 mm/°, +X' },
  { kind: 'comp', r: 3, c: 2, mm: 1.5, sign: 1, say: 'Across →, the carriage against the elbow, 1.5 mm/°, +X' },
  { kind: 'comp', r: 4, c: 0, mm: 0.5, sign: -1, say: 'Across →, the carriage against the elbow, 0.5 mm/°, −X' },
  { kind: 'comp', r: 4, c: 1, mm: 1, sign: -1, say: 'Across →, the carriage against the elbow, 1 mm/°, −X' },
  { kind: 'comp', r: 4, c: 2, mm: 1.5, sign: -1, say: 'Across →, the carriage against the elbow, 1.5 mm/°, −X' },
  { kind: 'wrist', r: 5, c: 0, deg: 10, say: 'Across →, the wrist lands and lifts, J3 −10° … +10°, the elbow still at +4°' },
  { kind: 'wrist', r: 5, c: 1, deg: 20, say: 'Across →, the wrist lands and lifts, J3 −20° … +20°, the elbow still at +4°' },
  { kind: 'wrist', r: 5, c: 2, deg: -10, say: 'Across →, the wrist lands and lifts, J3 +10° … −10°, the elbow still at +4°' },
  { kind: 'wrist', r: 5, c: 3, deg: -20, say: 'Across →, the wrist lands and lifts, J3 +20° … −20°, the elbow still at +4°' },
  { kind: 'along', c: 0, say: 'Along ↑, as tonight: what good looks like' },
  { kind: 'along', c: 1, back: true, say: 'Along ↓, as tonight: what good looks like' },
];

const f = v => (Math.round(v * 100) / 100).toFixed(2);
const L = p => `L ${f(p.x)} ${f(p.y)}`;
const arm = (j, deg, row) => ({ kind: 'arm', cmd: `J ${j} ${deg}`, row });
const fly = (p, row) => ({ kind: 'move', cmds: [`T ${LAB.travel}`, `M ${f(p.x)} ${f(p.y)}`, 'G'], lengthMM: null, paintMM: 0, row });
const paint = (cmds, mm, row) => {
  const n = cmds.filter(c => 'LAM'.includes(c[0])).length;
  return { kind: 'move', cmds: [`F ${LAB.speed}`, ...cmds, 'G'], lengthMM: mm, paintMM: mm, painted: Array(n).fill(1), row };
};
const along = (a, u, s) => ({ x: a.x + u.x * s, y: a.y + u.y * s });
// seconds over s mm from rest to the speed, or from it to rest: the board's planner
export function endSecs(s) {
  const v = LAB.speed, d = v * v / (2 * LAB.accel);
  return s >= d ? (s - d) / v + v / LAB.accel : Math.sqrt(2 * s / LAB.accel);
}
const rate = (deg, s) => Math.max(1, Math.min(LAB.turnMax, Math.ceil(Math.abs(deg) / endSecs(s))));

// the blocks of one stroke, from its flight to the elbow up: where it starts and ends besides
function strokeBlocks(q, row, cup, press) {
  const { x, y } = q.at, len = q.kind === 'along' ? LAB.along : LAB.length;
  const u = q.kind === 'along' ? { x: q.back ? -1 : 1, y: 0 } : { x: 0, y: q.back ? -1 : 1 };
  const a = q.kind === 'along' ? { x: q.back ? x + len : x, y } : { x, y: q.back ? y + len : y }, b = along(a, u, len);
  const dip = c => handDip(c, row);
  const T = LAB.tail, W = LAB.wide, p = q.press ?? press;
  const today = (start, end) => [arm(2, LAB.hover, row),
    paint([`W 2 ${p} ${LAB.turnMax}`, L(along(start, u, T)), L(along(end, u, -T)), `W 2 ${LAB.lift} ${rate(LAB.lift - p, T)}`, L(end)], len, row), arm(2, LAB.up, row)];
  switch (q.kind) {
    case 'markElbow': return { from: a, to: a, blocks: [fly(a, row), ...dip(cup), arm(2, LAB.hover, row), arm(2, press, row), { kind: 'wait', s: 0.3, row }, arm(2, LAB.hover, row), arm(2, LAB.up, row)] };
    case 'markWrist': { const m = { x: a.x, y: a.y + len / 2 }; return { from: m, to: m, blocks: [fly(m, row), ...dip(cup), arm(2, LAB.hover, row), arm(2, LAB.light, row), arm(3, 10, row), arm(3, 0, row), arm(3, -10, row), arm(3, 0, row), arm(2, LAB.up, row)] }; }
    case 'shallow': return { from: a, to: b, blocks: [fly(a, row), ...dip({ ...cup, dip: 16, paint: [15, 16] }), ...today(a, b)] };
    case 'snake': {
      const c = { x: b.x + 2.5, y: b.y }, d = { x: a.x + 2.5, y: a.y };
      return { from: a, to: d, via: [b, c], blocks: [fly(a, row), ...dip(cup), arm(2, LAB.hover, row),
        paint([`W 2 ${p} ${LAB.turnMax}`, L(along(a, u, T)), L(b), L(c), L(along(d, u, T)), `W 2 ${LAB.lift} ${rate(LAB.lift - p, T)}`, L(d)], 2 * len + 2.5, row), arm(2, LAB.up, row)] };
    }
    case 'comp': {
      // the tip along X = the carriage + sign · mm/° · the elbow: the carriage against it, so the tip stays on the line
      const off = deg => q.sign * q.mm * deg, s = { x: a.x - off(LAB.hover - p), y: a.y }, e = { x: b.x - off(LAB.lift - p), y: b.y };
      const inMM = Math.hypot(W, off(LAB.hover - p)), outMM = Math.hypot(W, off(LAB.lift - p));
      return { from: s, to: e, blocks: [fly(s, row), ...dip(cup), arm(2, LAB.hover, row),
        paint([`W 2 ${p} ${rate(LAB.hover - p, inMM)}`, L(along(a, u, W)), L(along(b, u, -W)), `W 2 ${LAB.lift} ${rate(LAB.lift - p, outMM)}`, L(e)], len, row), arm(2, LAB.up, row)] };
    }
    case 'wrist': return { from: a, to: b, blocks: [fly(a, row), ...dip(cup), arm(3, -q.deg, row), arm(2, LAB.light, row),
      paint([`W 3 0 ${rate(q.deg, W)}`, L(along(a, u, W)), L(along(b, u, -W)), `W 3 ${q.deg} ${rate(q.deg, W)}`, L(b)], len, row), arm(2, LAB.up, row), arm(3, 0, row)] };
    default: return { from: a, to: b, blocks: [fly(a, row), ...dip(cup), ...today(a, b)] };
  }
}

// ---------- LAB 2.0: any polyline, landed and lifted with the carriage against the elbow ----------
const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
const lengthOf = pts => pts.slice(1).reduce((t, q, i) => t + dist(pts[i], q), 0);
function pointAt(pts, s) {
  let left = s;
  for (let i = 1; i < pts.length; i++) {
    const d = dist(pts[i - 1], pts[i]);
    if (left <= d) return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * (d ? left / d : 0), y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * (d ? left / d : 0) };
    left -= d;
  }
  return pts.at(-1);
}
export function sliceLine(pts, s0, s1) {
  const out = [pointAt(pts, s0)];
  let t = 0;
  for (let i = 1; i < pts.length; i++) { t += dist(pts[i - 1], pts[i]); if (t > s0 + 1e-6 && t < s1 - 1e-6) out.push(pts[i]); }
  out.push(pointAt(pts, s1));
  return out;
}
// the elbow's run on the line: mm/°, the carriage off it along X so the tip stays on it; 0, as tonight's run
function rowPaint(pts, row, mm, press, ramp) {
  const len = lengthOf(pts), W = Math.min(ramp ?? (mm ? LAB.wide : LAB.tail), len / 2);
  const tail = d => d >= 3 ? Math.min(W, d) : W, Wi = tail(dist(pts[0], pts[1])), Wo = tail(dist(pts.at(-2), pts.at(-1)));   // a tail no farther than a turn: the carriage goes straight along it
  const mid = sliceLine(pts, Wi, len - Wo).filter((q, i, all) => !i || dist(all[i - 1], q) > 1e-6);   // a leg so short its landing meets its lift: no piece of no length
  const start = { x: pts[0].x - mm * (LAB.hover - press), y: pts[0].y }, end = { x: pts.at(-1).x - mm * (LAB.lift - press), y: pts.at(-1).y };
  return { start, blocks: [arm(2, LAB.hover, row),
    paint([`W 2 ${press} ${mm ? rate(LAB.hover - press, dist(start, mid[0])) : LAB.turnMax}`, L(mid[0]), ...mid.slice(1).map(L), `W 2 ${LAB.lift} ${rate(LAB.lift - press, mm ? dist(mid.at(-1), end) : Wo)}`, L(end)], len, row), arm(2, LAB.up, row)] };
}
const unitOf = deg => ({ x: Math.sin(deg * Math.PI / 180), y: Math.cos(deg * Math.PI / 180) });   // 0° →, 90° ↑ (+X)
const line = (at, deg, len) => [at, along(at, unitOf(deg), len)];
function snakeOf(at, u, v, long, n, pitch) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = along(at, v, i * pitch), b = along(a, u, long);
    pts.push(...(i % 2 ? [b, a] : [a, b]));
  }
  return pts;
}
const C2 = (x, c) => ({ x, y: c * LAB.step });
function sheet2() {
  const T = S2.top, one = [], add = o => one.push(o);
  const st = (r, c, mm, deg, say, o = {}) => add({ kind: 'line', hue: '#2B6CB0', mm, press: o.press, dip: o.dip, say, pts: line(deg === 180 ? { x: T - r * LAB.rowGap, y: c * LAB.step + LAB.length } : { x: T - r * LAB.rowGap, y: c * LAB.step }, deg, LAB.length) });
  [0.5, 0.75, 1, 1.25].forEach((mm, c) => st(0, c, mm, 0, `Across →, the carriage ${mm} mm/°`));
  st(1, 0, 1.5, 0, 'Across →, the carriage 1.5 mm/°');
  [0.75, 1, 1.25].forEach((mm, c) => st(1, c + 1, mm, 180, `Across ←, the carriage ${mm} mm/°`));
  [1, 2, 3].forEach((press, c) => st(2, c, 1, 0, `Across →, the carriage 1 mm/°, pressed +${press}°`, { press }));
  st(2, 3, 1, 0, 'Across →, the carriage 1 mm/°, a shallow dip +16°', { dip: 16 });
  const d = 50 * Math.SQRT1_2, lo = 165, hi = lo + d;
  add({ kind: 'line', hue: '#7B3FA0', mm: 1, say: 'Diagonal ↗, the carriage 1 mm/°', pts: [C2(lo, 0), { x: hi, y: d }] });
  add({ kind: 'line', hue: '#7B3FA0', mm: 1, say: 'Diagonal ↘, the carriage 1 mm/°', pts: [C2(hi, 1), { x: lo, y: LAB.step + d }] });
  add({ kind: 'line', hue: '#7B3FA0', mm: 1, say: 'Diagonal ↖, the carriage 1 mm/°', pts: [{ x: lo, y: 2 * LAB.step + d }, C2(hi, 2)] });
  add({ kind: 'line', hue: '#7B3FA0', mm: 1, say: 'Diagonal ↙, the carriage 1 mm/°', pts: [{ x: hi, y: 3 * LAB.step + d }, C2(lo, 3)] });
  add({ kind: 'line', hue: '#3E8E5A', mm: 1, say: 'Along ↑, against the fur, the carriage 1 mm/° (first sheet\'s 20, without it)', pts: [C2(105, 0), C2(155, 0)] });
  add({ kind: 'line', hue: '#3E8E5A', mm: 1, say: 'Along ↓, with the fur, the carriage 1 mm/° (first sheet\'s 21, without it)', pts: [C2(155, 1), C2(105, 1)] });
  add({ kind: 'line', hue: '#D8453B', mm: 0, say: 'Diagonal ↗, as tonight: what it was', pts: [C2(115, 2), { x: 115 + d, y: 2 * LAB.step + d }] });
  const L0 = S2.cellLong, W0 = (S2.tracks - 1) * S2.pitch, across = { x: 0, y: 1 }, up = { x: 1, y: 0 }, down = { x: -1, y: 0 }, right = { x: 0, y: 1 };
  add({ kind: 'cell', hue: '#D8453B', mm: 0, say: 'A cell across, a snake, as tonight', pts: snakeOf(C2(72, 0), across, up, L0, S2.tracks, S2.pitch) });
  add({ kind: 'cell', hue: '#2B6CB0', mm: 1, say: 'A cell across, a snake, the carriage 1 mm/°', pts: snakeOf(C2(72, 1), across, up, L0, S2.tracks, S2.pitch) });
  add({ kind: 'cell', hue: '#3E8E5A', mm: 1, say: 'A cell along, a snake, the carriage 1 mm/°: every other track against the fur', pts: snakeOf(C2(56, 2), up, right, L0, S2.tracks, S2.pitch) });
  add({ kind: 'oneway', hue: '#3E8E5A', mm: 1, say: 'A cell along, every track ↓ with the fur, up and back through the air, the carriage 1 mm/°', tracks: Array.from({ length: S2.tracks }, (_, i) => line({ x: 56 + L0, y: 3 * LAB.step + i * S2.pitch }, -90, L0)) });
  const k = Math.SQRT1_2;
  add({ kind: 'cell', hue: '#7B3FA0', mm: 1, say: 'A cell on the diagonal, a snake, the carriage 1 mm/°', pts: snakeOf({ x: 20 + W0 * k, y: 0 }, { x: k, y: k }, { x: -k, y: k }, L0, S2.tracks, S2.pitch) });
  return one;
}
// a cell's path in rows as OPM-N's run: a dip every so many mm of track, the next from a lap back
export function rowsOfCell(pts) {
  const all = lengthOf(pts), out = [];
  for (let s = 0; s < all - 0.01;) {
    let e = Math.min(s + S2.every, all);
    if (all - e < 10) e = all;
    out.push(sliceLine(pts, s ? s - S2.lap : 0, e));
    s = e;
  }
  return out;
}
function sheet3(n = S3.tracks) {
  const L0 = S2.cellLong, W0 = (S2.tracks - 1) * S2.pitch, k = Math.SQRT1_2, T = S3.top, B = S3.bottom, col = c => c * LAB.step, pitch = n > 1 ? W0 / (n - 1) : 0;
  const one = (hue, say, at, u, v, every = 2) => ({ kind: 'oneway', hue, mm: S3.mm, every, say,
    tracks: Array.from({ length: n }, (_, i) => { const a = along(at, v, i * pitch); return [a, along(a, u, L0)]; }) });
  const up = { x: 1, y: 0 }, down = { x: -1, y: 0 }, right = { x: 0, y: 1 }, left = { x: 0, y: -1 };
  return [
    one('#2B6CB0', 'A cell across →, across the fur', { x: T, y: col(0) }, right, up),
    one('#2B6CB0', 'A cell across ←, across the fur', { x: T, y: col(1) + L0 }, left, up),
    one('#3E8E5A', 'A cell along ↓, with the fur: the pink sheet\'s 23 again', { x: T + L0, y: col(2) }, down, right),
    one('#3E8E5A', 'A cell along ↓, with the fur, a dip before every track: 36 mm on a dip, not 72', { x: T + L0, y: col(3) }, down, right, 1),
    one('#7B3FA0', 'A cell on the diagonal ↗, against the fur', { x: B + W0 * k, y: col(0) }, { x: k, y: k }, { x: -k, y: k }),
    one('#7B3FA0', 'A cell on the diagonal ↘, with the fur', { x: B + L0 * k, y: col(1) }, { x: -k, y: k }, { x: k, y: k }),
    one('#7B3FA0', 'A cell on the diagonal ↖, against the fur', { x: B, y: col(2) + L0 * k }, { x: k, y: -k }, { x: k, y: k }),
    one('#7B3FA0', 'A cell on the diagonal ↙, with the fur', { x: B + (W0 + L0) * k, y: col(3) + L0 * k }, { x: -k, y: -k }, { x: -k, y: k }),
  ];
}
function sheet4(n = S3.tracks) {
  const W0 = (S2.tracks - 1) * S2.pitch, pitch = n > 1 ? W0 / (n - 1) : 0, down = { x: -1, y: 0 }, up = { x: 1, y: 0 }, right = { x: 0, y: 1 };
  const whole = len => [[0, len]], seam = [[0, S4.splitAt], [S4.splitAt - S4.lap, 100]], how = ', every track on one dip', sewn = `, a second dip at ${S4.splitAt} mm, on from ${S4.lap} mm back: the seam`;
  const cell = (hue, at, u, v, pieces, say) => ({ kind: 'oneway', hue, mm: S3.mm, every: 1, say,
    tracks: Array.from({ length: n }, (_, i) => pieces.map(([s0, s1]) => { const a = along(at, v, i * pitch); return [along(a, u, s0), along(a, u, s1)]; })).flat() });
  const vert = (len, c, pieces, tail) => cell('#3E8E5A', { x: S4.base + len, y: c * S4.col }, down, right, pieces, `Vertical ↓, ${len} mm${tail}`);
  const horz = (len, x, y, pieces, tail) => cell('#2B6CB0', { x, y }, right, up, pieces, `Horizontal →, ${len} mm${tail}`);
  const y60 = 40 + S4.gap, y80 = y60 + 60 + S4.gap, y100 = 100 + S4.gap;
  return [...S4.long.map((len, c) => vert(len, c, whole(len), how)), vert(100, 4, seam, sewn),
    horz(40, S4.high, 0, whole(40), how), horz(60, S4.high, y60, whole(60), how), horz(80, S4.high, y80, whole(80), how),
    horz(100, S4.low, 0, whole(100), how), horz(100, S4.low, y100, seam, sewn)];
}
function sheet5(n = S3.tracks) {
  const W0 = (S2.tracks - 1) * S2.pitch, pitch = n > 1 ? W0 / (n - 1) : 0, down = { x: -1, y: 0 }, up = { x: 1, y: 0 }, right = { x: 0, y: 1 };
  const cell = (hue, at, u, v, lap, say) => ({ kind: 'oneway', hue, mm: S3.mm, every: 1, say: `${say}, ${S5.len} mm, a second dip at ${S5.dipAt} mm, on from ${lap} mm back`,
    tracks: Array.from({ length: n }, (_, i) => [[0, S5.dipAt], [S5.dipAt - lap, S5.len]].map(([s0, s1]) => { const a = along(at, v, i * pitch); return [along(a, u, s0), along(a, u, s1)]; })).flat() });
  const [a, b, c] = S5.laps;
  return [...S5.laps.map((lap, k) => cell('#3E8E5A', { x: S5.base + S5.len, y: k * S5.col }, down, right, lap, 'Vertical ↓')),
    cell('#2B6CB0', { x: 60, y: 0 }, right, up, a, 'Horizontal →'), cell('#2B6CB0', { x: 60, y: S5.len + 25 }, right, up, b, 'Horizontal →'), cell('#2B6CB0', { x: 20, y: 0 }, right, up, c, 'Horizontal →')];
}
// A snake cut for its dips as dragRowsOf cuts OPM-N's: `every` mm a run, the lap back among them, the last run taking what
// would be left under a quarter of it.
export function snakeRuns(pts, every, lap) {
  const all = lengthOf(pts), back = Math.min(lap, every / 2), out = [];
  for (let from = 0, done = 0; ;) {
    const room = every - (done - from);
    if (all - done - Math.max(0, room) <= every / 4) { out.push(sliceLine(pts, from, all)); return out; }
    done += room; out.push(sliceLine(pts, from, done)); from = done - back;
  }
}
function sheet6(n = S3.tracks) {
  const W0 = (S2.tracks - 1) * S2.pitch, pitch = n > 1 ? W0 / (n - 1) : 0, down = { x: -1, y: 0 }, up = { x: 1, y: 0 }, right = { x: 0, y: 1 };
  const cell = (hue, at, u, v, len, every, say) => ({ kind: 'cell', hue, mm: S3.mm, every, lap: S6.lap, say, pts: snakeOf(at, u, v, len, n, pitch) });
  const asLong = len => `, ${len} mm, a snake, four dips as the long sheet's`, sewn = `, 100 mm, a snake, a dip every ${S6.every5} mm`;
  const vert = (len, c, every, tail) => cell('#3E8E5A', { x: S4.base + len, y: c * S4.col }, down, right, len, every, `Vertical ↓↑${tail}`);
  const horz = (len, x, y, every, tail) => cell('#2B6CB0', { x, y }, right, up, len, every, `Horizontal →←${tail}`);
  const y60 = 40 + S4.gap, y80 = y60 + 60 + S4.gap, y100 = 100 + S4.gap;
  return [...S4.long.map((len, c) => vert(len, c, len + S6.lap, asLong(len))), vert(100, 4, S6.every5, sewn),
    horz(40, S4.high, 0, 40 + S6.lap, asLong(40)), horz(60, S4.high, y60, 60 + S6.lap, asLong(60)), horz(80, S4.high, y80, 80 + S6.lap, asLong(80)),
    horz(100, S4.low, 0, 100 + S6.lap, asLong(100)), horz(100, S4.low, y100, S6.every5, sewn)];
}
// LAB 3.0 · snake + idle (the owner, 2026-11-05, OPM-N/IMG_2270 … 2276, the long snake on the flat Da Vinci no. 2: giant
// bulbs at the ends, then bald patches, the small brush out of paint; "a second run without a dip, that spreads the paint
// gathered at the edges"; Screenshot 12.50.03 PM: "first the run with the dips, then the idle one"): the long snake's cells
// in their places and numbers, each painted, then at once its whole line again from its start, one run, no dip.
const sheet7 = n => sheet6(n).map(q => ({ ...q, idle: true, say: `${q.say}; then at once again from its start, no dip` }));
// LAB 3.0 · + idle 2.0 (the owner, the same day, Idle+.png, OPM-N/IMG_2294, a ruler on the bulbs IMG_2299: "starts earlier, to
// catch the bulb of paint from behind, not to poke the brush into its centre"; "poked in the centre the paint stays a drop and
// does not drag the trace to the middle"; "+1 mm at the start and +1 mm further at the end … here one can take all 5 mm"): the
// idle run off the first's line, every track longer by `over` at both ends, its turns out beyond the cell. Five of the long
// snake's 80 mm verticals, five of its horizontals, over 1 … 5 mm. Five horizontals with their bulbs, about 100 mm each, do not
// fit A3's 420 mm in a row: three and two.
const S8 = { len: 80, overs: [1, 2, 3, 4, 5], left: 20, col: 50, step: 105, w: 330 };
// past its end for real (the owner, 14:18, IMG_2303: "no past its end +5, all as on no. 1"): rowPaint presses to the line's end
// less its lift, LAB.wide, so a line ending at +5 was pressed only to 3 mm short of the cell's end, the rest rising, and the last
// tracks looked alike. The line goes LAB.wide farther: pressed to +over, the lift beyond it.
const liftBeyond = (pts, by = LAB.wide) => { const a = pts.at(-2), b = pts.at(-1), d = dist(a, b); return [...pts.slice(0, -1), along(b, { x: (b.x - a.x) / d, y: (b.y - a.y) / d }, by)]; };
function overshot(pts, over) {
  if (!over) return pts;
  const out = [];
  for (let i = 0; i + 1 < pts.length; i += 2) {
    const a = pts[i], b = pts[i + 1], d = dist(a, b), u = { x: (b.x - a.x) / d, y: (b.y - a.y) / d };
    out.push(along(a, u, -over), along(b, u, over));
  }
  return out;
}
// LAB 3.0 · + idle 3.0 (the owner, the same day, OPM-N/IMG_2305, the owner's line in blue over a cell: "an idle run in five passes; it
// will knock down the first four furrows with the dips more aggressively"): as + idle 2.0, its idle run a track more, half a step
// aside: on the ridges the first run pushed out, between its tracks and outside the outer two.
// LAB 3.0 · + idle 4.0 (the owner, the same day, IMG_2308, blue arrows on the dry trail outside 3, 4, 5: "five idle passes that do
// NOT go past the module's SIDES; the snake of five fits in the cell's width"): as 3.0, the five shared out between the first
// run's outer tracks, over 1 … 5 at their ends as ever.
// LAB 3.0 · + idle 5.0 (the same, Screenshots 3.21.19, 3.21.38 PM, nos. 4 and 5: "the last of the four strokes with a dip reaches
// only the middle of the module, then rises before the brush gets to the end"; "make + idle 5.0 with the five pressed in"): 4.0,
// and the first run's last track pressed to the cell's end, its lift beyond, not 8 mm short of it with the carriage going back.
function sheet8(n = S3.tracks, five = null, reachEnd = false) {
  const W0 = (S2.tracks - 1) * S2.pitch, pitch = n > 1 ? W0 / (n - 1) : 0, down = { x: -1, y: 0 }, up = { x: 1, y: 0 }, right = { x: 0, y: 1 }, L = S8.len;
  const cell = (hue, at, u, v, over, way) => ({ kind: 'cell', hue, mm: S3.mm, every: L + S6.lap, lap: S6.lap, idle: true, over, pts: snakeOf(at, u, v, L, n, pitch),
    ...(five === 'ridges' ? { idleLine: snakeOf(along(at, v, -pitch / 2), u, v, L, n + 1, pitch) } : five === 'inside' ? { idleLine: snakeOf(at, u, v, L, n + 1, W0 / n) } : {}), reachEnd,
    say: `${way}, ${L} mm, a snake, four dips${reachEnd ? ', the last track pressed to its end' : ''}; then idle${five === 'ridges' ? `, ${n + 1} passes on the ridges` : five === 'inside' ? `, ${n + 1} passes within its width` : ''}, +${over} mm before its start and +${over} mm past its end` });
  return [...S8.overs.map((over, c) => cell('#3E8E5A', { x: S4.base + L, y: S8.left + c * S8.col }, down, right, over, 'Vertical ↓↑')),
    ...S8.overs.map((over, c) => cell('#2B6CB0', { x: c < 3 ? S4.high : S4.low, y: S8.left + (c < 3 ? c : c - 3) * S8.step }, right, up, over, 'Horizontal →←'))];
}
// LAB 3.0 · + idle 6.0 (the owner, 2026-11-05 evening, + idle 5.0 with a rubber brush, a Colour Shaper soft no. 2, OPM-N/IMG_2356:
// "the best quality, what I want from robotic painting: inhuman precision of the line"; IMG_2357, along Y dashes: "it cannot paint
// horizontally at all"; IDLE_6.0.jpg: "no horizontal lines at all, we build them from many flattened verticals; the brush never
// paints left-right, its lines only up and down"; IMG_2359, Screenshot 7.16.23 PM: "I chose 2, 3 and 4, this is canon"; "no. 5's
// tail is too long already"): + idle 5.0's verticals at over 2, 3, 4, in their places, and modules of the same 80 × 17.5 mm lying
// down: a snake of short legs along X, as far apart as a vertical's tracks and, idle, as its passes, fitted to the 80. Four legs a
// dip, as much line as a vertical's run: a run starts on a leg, never in a step, and is pressed to its last leg's end, its lift beyond.
// The diagonals (the same evening, Screenshot 7.36.26 PM, 7 and 8 in red in the sheet's free corner: "let us just add the diagonal
// ones"): parallelograms, about as the owner drew them, a flat top and bottom, sides at 45°, the same up-and-down legs, the sides cutting
// them short. A step between two legs cut by a side goes along that side; over +3, the canon's middle.
const S12 = { overs: [2, 3, 4], x: 50, diag: { base: 60, high: 30, y: 205, tops: [185, 135], over: 3 } };
function byLine(pts, most) {                     // a snake's legs into runs of at most so many mm, whole legs
  const out = [[]];
  let len = 0;
  for (let i = 0; i + 1 < pts.length; i += 2) {
    const run = out.at(-1), step = run.length ? dist(run.at(-1), pts[i]) : 0, leg = dist(pts[i], pts[i + 1]);
    if (run.length && len + step + leg > most) { out.push([pts[i], pts[i + 1]]); len = leg; } else { run.push(pts[i], pts[i + 1]); len += step + leg; }
  }
  return out;
}
// a snake of legs along X over a parallelogram: its top edge at x top, `y` where it starts; lean ↘ or ↗. A leg under 3 mm is left out: too short to land on.
function slantSnake(top, y, base, high, lean, step) {
  const span = base + high, gaps = Math.max(2, Math.round(span / step)), pts = [];
  for (let i = 1, odd = false; i < gaps; i++) {
    const s = i * span / gaps, t = lean > 0 ? s : span - s, a = { x: top - Math.max(0, t - base), y: y + s }, b = { x: top - Math.min(high, t), y: y + s };
    if (a.x - b.x < 3) continue;
    pts.push(...(odd ? [b, a] : [a, b])); odd = !odd;
  }
  return pts;
}
function sheet12(n = S3.tracks) {
  const W0 = (S2.tracks - 1) * S2.pitch, L = S8.len, most = L + S6.lap, down = { x: -1, y: 0 }, right = { x: 0, y: 1 }, step = n > 1 ? W0 / (n - 1) : W0, stepIdle = W0 / n;
  const legsAt = s => Math.round(L / s) + 1, legs = legsAt(step), idle = legsAt(stepIdle), tail = (count, over) => `a snake, a dip every ${most} mm of line at most, each run pressed to its last leg's end; then idle, ${count} verticals, +${over} mm before and past each`;
  const flat = (over, c) => {
    const at = { x: S12.x + W0, y: S8.left + c * S8.step }, pts = snakeOf(at, down, right, W0, legs, L / (legs - 1));
    return { kind: 'cell', hue: '#2B6CB0', mm: S3.mm, idle: true, over, pts, runs: byLine(pts, most).map(r => liftBeyond(r)), idleLine: snakeOf(at, down, right, W0, idle, L / (idle - 1)),
      say: `Lying down, ${L} mm, ${legs} short verticals ↓↑ of ${W0} mm, ${tail(idle, over)}, within its length` };
  };
  const D = S12.diag, slant = (lean, c) => {
    const pts = slantSnake(D.tops[c], D.y, D.base, D.high, lean, step), line = slantSnake(D.tops[c], D.y, D.base, D.high, lean, stepIdle);
    return { kind: 'cell', hue: '#7B3FA0', mm: S3.mm, idle: true, over: D.over, pts, runs: byLine(pts, most).map(r => liftBeyond(r)), idleLine: line,
      say: `Diagonal ${lean > 0 ? '↘' : '↗'}, ${D.base} mm wide, ${D.high} mm high, its sides at 45°: ${pts.length / 2} short verticals ↓↑ cut by its sides, ${tail(line.length / 2, D.over)}` };
  };
  return [...sheet8(n, 'inside', true).filter((q, i) => i < S8.overs.length && S12.overs.includes(q.over)), ...S12.overs.map(flat), slant(1, 0), slant(-1, 1)];
}
// LAB 3.0 · ladder (the owner, 2026-11-06, of OPM-G: "the ladder sheet before the tab, once you have read Kuzya's answer"; Kuzya the same
// day: "Your updated test A (5, 8, 12, 16, 24, 32 mm; alone and in a snake; a fresh DIP and the remainder) suits me", "two independent
// metrics: coverage and shape fidelity"): what a short leg really leaves, on the first canvas 12 of the 16 short legs OPM-G's second try
// keeps being Indigo's. No span of a composition is given to another paint (the owner, the same day), so a short one has to be laid short.
// One 20 × 20 canvas, every length left to right, all ↓ first, by the canon's module and its commands (idleplan.js): a table of the paint's
// state on the brush. The same length alone or in a snake; straight after a dip or so many mm of line later; first run alone or with its idle
// run; three short shapes, legs of different lengths side by side as OPM-G's columns would have them. The landing and the lift of 8 mm
// never fit a leg of 8 mm or less (a lone leg of 8 is never fully pressed), so 5, 8 and 12 also over 4 mm, this sheet's alone. All est.
const S13 = { size: 200, lengths: [5, 8, 12, 16, 24, 32], legs: [6, 5, 4, 4, 3, 3], ramp: 4, step: 5.83, pass: 4.38, every: 95, flat: 2, slant: 3,
  tops: [190, 143, 99, 54], low: 22, across: 14, left: 15, right: 105, snakeLeft: 12, snakeGap: 13,
  shapes: { pair: { y: 105, legs: 2, len: 12 }, wedge: { y: 122, W: 23.32, ends: [5, 21] }, diamond: { y: 156, W: 23.32, ends: [5, 21] } } };
// legs along X over a shape, top(t) and low(t) at t mm across it, as many as fit `step` apart, every other one ↑: as legsAcross in idleplan.js
function legsOver(y, W, top, low, step) {
  const gaps = Math.round(W / step), legs = [];
  for (let j = 0; j <= gaps; j++) {
    const t = j * W / gaps, a = { x: top(t), y: y + t }, b = { x: low(t), y: y + t };
    legs.push(j % 2 ? [b, a] : [a, b]);
  }
  return legs;
}
// the idle run's line as OPM-N's, idleLine in idleplan.js: every leg longer by over at both ends, the last only by end at its own
const idleOver = (legs, over, end) => legs.flatMap(([a, b], i) => { const d = dist(a, b), u = { x: (b.x - a.x) / d, y: (b.y - a.y) / d }; return [along(a, u, -over), along(b, u, i === legs.length - 1 ? end : over)]; });
function sheet13() {
  const { lengths, tops: [A, B, C, D] } = S13, one = [];
  const blue = '#2B6CB0', green = '#3E8E5A', purple = '#7B3FA0', red = '#D8453B';
  const mark = (hue, T, y, L, say, o = {}) => { const pts = [{ x: T, y }, { x: T - L, y }]; one.push({ kind: 'cell', hue, mm: S3.mm, pts, runs: [liftBeyond(pts, o.ramp ?? LAB.wide)], noDip: o.noDip, ramp: o.ramp, say }); };
  lengths.forEach((L, c) => mark(blue, A, S13.left + c * S13.across, L, `Alone ↓ ${L} mm, its own dip`));
  lengths.slice(0, 3).forEach((L, c) => mark(red, A - S13.low, S13.left + c * S13.across, L, `Alone ↓ ${L} mm, its own dip, landing and lifting over ${S13.ramp} mm, not 8`, { ramp: S13.ramp }));
  const ladder = (seq, T, left, name) => { let since = 0; seq.forEach(L => { const c = lengths.indexOf(L); mark(green, T, left + c * S13.across, L, since ? `Alone ↓ ${L} mm, ${name}, no dip: ${since} mm of line since it` : `Alone ↓ ${L} mm, ${name}: straight after it`, { noDip: since > 0 }); since += L; }); };
  ladder(lengths, A, S13.right, 'one dip, shortest first');
  ladder([...lengths].reverse(), B, S13.left, 'one dip, longest first');
  const module = (hue, T, y, W, top, low, slanted, idle, say) => {
    const legs = legsOver(y, W, top, low, S13.step), pts = legs.flat(), over = slanted ? S13.slant : S13.flat, line = idleOver(legsOver(y, W, top, low, S13.pass), over, slanted ? over : 0);
    const mm = lengthOf(pts), runs = byLine(pts, S13.every);
    one.push({ kind: 'cell', hue, mm: S3.mm, pts, runs: runs.map(r => liftBeyond(r)), ...(idle ? { idle: true, over, idleRun: line } : {}),
      say: `${say}, ${legs.length} legs, ${Math.round(mm)} mm of line, ${runs.length > 1 ? `${runs.length} dips` : 'one dip'}${idle ? `; then idle, ${line.length / 2} legs, +${over} mm${slanted ? '' : ', 0 at its very end'}` : ', no idle'}` });
  };
  const snakes = (T, hue, idle) => { let y = S13.snakeLeft; lengths.forEach((L, c) => { const W = (S13.legs[c] - 1) * S13.step; module(hue, T, y, W, () => T, () => T - L, false, idle, `A snake ↓↑ of ${L} mm`); y += W + S13.snakeGap; }); };
  snakes(C, blue, false);
  snakes(D, blue, true);
  const { pair, wedge, diamond } = S13.shapes, [e0, e1] = wedge.ends, mid = diamond.W / 2;
  module(purple, B, pair.y, (pair.legs - 1) * S13.step, () => B, () => B - pair.len, false, true, `A small detail, its plan ${((pair.legs - 1) * S13.step + 4).toFixed(1)} × ${pair.len} mm`);
  module(purple, B, wedge.y, wedge.W, () => B, t => B - e0 - (e1 - e0) * t / wedge.W, true, true, `A wedge, flat at the top, legs of ${e0} to ${e1} mm`);
  const half = t => (e0 + (e1 - e0) * (1 - Math.abs(t - mid) / mid)) / 2, c0 = B - e1 / 2;
  module(purple, B, diamond.y, diamond.W, t => c0 + half(t), t => c0 - half(t), true, true, `A diamond, legs of ${e0} to ${e1} mm`);
  return one;
}
// LAB 4.0 · real strokes (the owner, 2026-11-06, of the ladder's paper, IMG_2419, with `OPM-G/porsche_70x100_hyper.jpg` and `watch_60x80_hyper.jpg` before him: "we plan to make such
// works"; he does not accept a pool after a dip; "remove the short drops"; "a test of the real strokes that we will have in the realistic works"). Not lengths in a table but the pictures'
// own legs: two pieces of FORM-G's plans (labreal.js), every cell as there, its snake and at once its idle run, and a long leg with its dips in the middle of it.
// A dip never lands on a short leg: what the brush still holds paints those (the ladder: a leg of 5 mm 92 mm after a dip came out 4.5 × 6.5). Four ways of coming from the jar, the same legs:
// as today; out of the paint slowly, a thinner coat and no hanging drop (est.); landing inside the leg, back to its start, then along it, so the first of the paint goes into the leg's own line (est.); both.
const S14 = { size: 200, every: 95, lap: 15, pitch: 5, left: 13, band: 46, h: 84, tops: [194, 104], long: 20, slowTo: 22, inside: 16, insideShare: .6, insideMin: 16, shortLeg: 16, rideUnder: 30,
  ways: [{ say: 'the dip as today' }, { say: `out of the paint slowly`, slowAt: 3 }, { say: 'landing inside the leg, back to its start', inside: true }, { say: 'out slowly, landing inside the leg', slowAt: 3, inside: true }] };
// real strokes 2 (the owner, 2026-11-06, of the first canvas, OPM-N/IMG_2432, the first paint only: "the third came out best, shall we multiply it?"; "the first is not needed at all"; of no. 9: "I would start from this and take it
// as the canon"; "shall we fix at once what is already known from the first run?"). No. 9's way four times, its dips as they were, 95 mm, a lap of 15: so the long leg to the letter. Known from that canvas, the two fixes:
// a leg's landing inside costs 16 mm more of the load, and the legs that went on what the brush held came out pale and thin at their ends: they go on it only to 79 mm of plan; the rim's rope broke at its tail on all four: its own dip, landing inside its own line.
const S15_WAYS = [1, 2, 3, 4].map(k => ({ say: `no. 9's way, copy ${k}`, inside: true, ride: 79 }));
const lenXY = pts => pts.slice(1).reduce((t, q, i) => t + Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]), 0);
// longEndFirst, startOnLong, ridersOnLong: canon.js since OPM-G runs by them too (2026-11-07), the same code
export { longEndFirst, startOnLong, ridersOnLong };
// a colour's cells so that every dip falls on the longest piece left, and the short ones go on what the brush holds. → the cells in that order
export function dipsOnLong(cells, every, lap) {
  const rest = cells.map(c => { const rs = idleRunsOf([{ byCell: [c] }], every, lap).filter(r => !r.idle); return { c, rs, first: Math.hypot(rs[0].pts[1][0] - rs[0].pts[0][0], rs[0].pts[1][1] - rs[0].pts[0][1]) }; });
  const ride = (held, q) => { let h = held, dips = 0; q.rs.forEach((r, j) => { const L = lenXY(r.pts); if ((j && r.dip) || (q.c.runs && r.dip) || h + L > every + .5) { dips++; h = L; } else h += L; }); return { h, dips }; };
  const out = [], total = q => q.rs.reduce((t, r) => t + lenXY(r.pts), 0); let held = Infinity;
  const take = q => { rest.splice(rest.indexOf(q), 1); held = ride(held, q).h; out.push(q.c); };
  // a rope of short legs (a car's rim, a grille) has no long leg to land on: a dip's leg before it that leaves room for all of it
  const short = S14.shortLeg - 4;    // its pressed line, half the tip in from both ends
  for (const b of rest.filter(q => q.first < short && q.rs.length === 1 && total(q) > every / 4).sort((p, q) => total(q) - total(p))) {
    const fit = rest.filter(q => q !== b && q.first >= short && q.rs.length === 1 && total(q) + total(b) <= every + .5);
    if (!fit.length) continue;
    held = Infinity; take(fit.reduce((m, q) => total(q) > total(m) ? q : m)); take(b);
  }
  while (rest.length) {
    let k = held === Infinity ? -1 : rest.findIndex(q => ride(held, q).dips === 0);
    if (k < 0) k = rest.reduce((b, q, i) => q.first > rest[b].first ? i : b, 0);
    const [q] = rest.splice(k, 1);
    held = ride(held, q).h; out.push(q.c);
  }
  return out;
}
function sheetReal(ways) {
  const { pitch } = S14, one = [], everyOf = way => way.every ?? S14.every, lapOf = way => way.lap ?? S14.lap, optsOf = way => ({ every: everyOf(way), lap: lapOf(way) });
  const runsOf = (cells0, way, at) => {         // a piece's runs on the sheet, the real ones' dips, the way's landing
    const every = everyOf(way), lap = lapOf(way), ride = way.ride ?? every;
    // ride: a cell cut for its dips as ever, by `every`; what follows goes on what the brush holds only as far as `ride`
    const cells = way.ride ? cells0.map(c => c.runs ? c : { ...c, runs: idleRunsOf([{ byCell: [c] }], every, lap).filter(r => !r.idle).map((r, j) => ({ pts: r.pts, dip: j > 0, beyond: r.beyond })) }) : cells0;
    const seq = idleRunsOf([{ byCell: way.ride ? ridersOnLong(cells, ride) : dipsOnLong(cells, ride, lap) }], ride, lap), P = p => at(p);
    return seq.map(r => {
      const first = r.pts.map(P), a = first[0], b = first[1], d = dist(a, b);
      const long = r.dip && way.inside && d >= S14.insideMin, rope = r.dip && way.ride && !long && first.length > 2 && lengthOf(first) >= S14.inside * 2;
      // a rope of short legs lands inside its own line too, back along it to its start
      const pts = long ? [along(a, { x: (b.x - a.x) / d, y: (b.y - a.y) / d }, Math.min(S14.inside, d * S14.insideShare)), ...first] : rope ? [...sliceLine(first, 0, S14.inside).reverse(), ...first.slice(1)] : first;
      return { pts, dip: r.dip, idle: r.idle, beyond: r.beyond, leg: d };
    });
  };
  const cellsOf = (P, paint, way) => P.cells.filter(c => c.paint === paint).flatMap(startOnLong).map((c, i) => cellOf({ ...c, n: i + 1 }, { pitch }, i + 1, optsOf(way)));
  const push = (paint, way, say, seq, hold) => {
    if (!seq.length) return;
    one.push({ kind: 'real', c: paint, hue: paint ? '#2B6CB0' : '#3E8E5A', mm: S3.mm, way, say, seq, ...hold, pts: seq[0].pts });
  };
  [0, 1].forEach(paint => {
    let held = paint ? { pause: 'Wipe the brush, put the second paint, the darker, in the jar, then Continue' } : {};
    ways.forEach((way, k) => {
      const left = S14.left + k * S14.band;
      REAL_PIECES.forEach((P, r) => {
        const seq = runsOf(cellsOf(P, paint, way), way, ([x, y]) => ({ x: S14.tops[r] - S14.h + y, y: left + pitch + x }));
        if (!seq.length) return;
        push(paint, way, `${P.say}; ${way.say}; the ${paint ? 'second' : 'first'} paint: ${seq.filter(q => !q.idle).length} runs, ${seq.filter(q => q.dip).length} dips`, seq, held); held = {};
      });
      if (paint === 0) {
        const cell = cellOf({ legs: [[0, REAL_LONG.leg[0], REAL_LONG.leg[1]]] }, { pitch }, 1, optsOf(way));
        const seq = runsOf([cell], way, ([x, y]) => ({ x: S14.long + y, y: left + x }));
        push(0, way, `${REAL_LONG.say}, ${REAL_LONG.leg[0]} mm; ${way.say}: ${seq.filter(q => q.dip).length} dips`, seq, {});
      }
    });
  });
  return one;
}
// LAB 4.0 · real 3, the last sheet (the owner, 2026-11-08: "before painting the red Porsche on the 70 × 100 canvas, better make a fragment of it on 20 × 20 cm"; "I prepared
// for-LAB.png, it lies in FORM-G, it will suit real 3 perfectly"): not pieces of 30 × 84 in two paints any more, but the red 911's own piece round its left headlight,
// 180 × 172 mm at the picture's own size (labreal3.js), every jar of it in FORM-G's order, light to dark, and run as OPM-G runs: the canon of a long leg (canon.js),
// formgplan.js's own cells and runs, nothing of LAB's own. A number a jar; a pause before every jar but the first, for its paint. The jars of two coats once more, over the
// dry first layer, as FORM-G's list has them: on the sheet after it (17), at the same place.
const S16 = (() => {     // the frame's bottom on the sheet's X 22, as real 2's long leg; what it paints centred across the 200 mm
  const xs = REAL3.pic.jars.flatMap(j => j.cells.flatMap(c => c.legs.map(l => l[0]))), half = REAL3.pic.pitch / 2;
  return { bottom: 22, left: 100 - (Math.min(...xs) - half + Math.max(...xs) + half) / 2 };
})();
// the jars by the canon of the jars (canon.js): those with less line than the canvas's long side, 200 mm here, go into the nearest that stays, unless no jar is near
const R3 = (() => { const raw = REAL3.pic, lineOf = j => j.cells.reduce((t, c) => t + cellOf(c, raw, 1).mm, 0); return { ...jarsByCanvas(raw, S14.size, lineOf), lineOf }; })();
export const real3Jars = () => R3;
// what the canon of the jars did, in words for the page: which went where, which stay short
export function real3Note() {
  const name = id => R3.pic.jars.find(j => j.id === id)?.name ?? id, into = {};
  R3.out.forEach(o => (into[o.into] ??= []).push(o.name));
  const went = Object.entries(into).map(([id, ns]) => `${ns.join(', ')} → ${name(id)}`).join('; ');
  return `The canon of the jars: less line than the canvas's long side, ${S14.size} mm, ${R3.out.length ? `${R3.out.length} went into the nearest by colour (${went})` : 'none went'}`
    + `${R3.kept.length ? `; ${R3.kept.length} stay though short, no jar near them (ΔE over ${CANON.jarDE}): ${R3.kept.map(k => `${k.name} ${(k.line / 1000).toFixed(2)} m`).join(', ')}` : ''}. ${REAL3.pic.jars.length} jars → ${R3.pic.jars.length} (est.).`;
}
export function real3Of(layer = 1) {
  const pic = R3.pic, list = seqOf(pic), passes = passesOf(pic, { canon: true }), runs = canonRuns(passes);
  const at = ([x, y]) => ({ x: y - REAL3.frame.y0 + S16.bottom, y: x + S16.left });
  return passes.map((P, k) => ({ jar: list[k], cells: P.cells, line: P.mm, took: pic.jars.find(j => j.id === (list[k].jar ?? list[k].id))?.took ?? [], runs: runs.filter(r => r.pass === k).map(r => ({ pts: r.pts.map(at), dip: r.dip, idle: r.idle, beyond: r.beyond })) }))
    .filter(q => q.jar.layer === layer);
}
function sheetReal3(layer) {
  const jars = real3Of(layer);
  return jars.map((q, k) => {
    const j = q.jar, line = q.line, dips = q.runs.filter(r => r.dip).length, took = q.took.length ? `; takes ${q.took.map(t => `${t.name}'s`).join(', ')} cells` : '';
    const pause = k ? `Jar ${k + 1} of ${jars.length}, ${j.name} ${j.hex}: wipe the brush, put it in the cup, then Continue` : undefined;
    return { kind: 'real', c: k, hue: j.hex, jar: `${j.name} ${j.hex}`, wide: true, mm: S3.mm, way: {}, seq: q.runs, pts: q.runs[0].pts, ...(pause ? { pause } : {}),
      say: `${j.name} ${j.hex}${layer === 2 ? '' : j.coats === 2 ? ' (its second coat on layer 2)' : ''}: ${q.cells} cells, ${q.runs.filter(r => !r.idle).length} runs, ${dips} dips, ${(line / 1000).toFixed(2)} m${took}` };
  });
}
// LAB 4.0 · dry test (the owner, 2026-11-09, of real 3's preview: "the yellow is all but covered by the red: it will be mush, not a mix of yellow and red"; of the light
// under the dark by 3 mm: "a good rule, but the devil is in the details: what interval? how long is the light paint given to dry?"; "yes, make a small sheet 20 × 20, we test
// how long it dries, I never counted"): five yellow bands of short legs as the lamp's indicator, then the red, each band's at its own age, 5, 10, 20, 30, 45 min. On every band
// three touches: the red across it, over its whole height; from above, ending 3 mm in, as a darker cell over the lighter's under-lap, its idle run +2 mm past the ends as today;
// from below the same, its idle run 0 past the ends. The machine waits by itself, the brush parked in the jar so its tip does not dry; the one change of jar right after the
// yellow, at once (CHANGE assumed: a longer one makes every age as much older). Every cell by the canon, as real 3. All est.
const S18 = { ages: [45, 30, 20, 10, 5], lefts: [14, 50, 86, 122, 158], legs: 6, band: [95, 115], seen: [98, 112], across: [70, 140], above: 150, below: 60, change: 60,
  yellow: { name: 'Indicator', hex: '#EE8A22' }, red: { name: 'Jar 32', hex: '#7E0D0D' } };
const runS = seq => seq.reduce((t, r) => t + (r.dip ? 12 : 0) + 2 + lengthOf((r.beyond ? liftBeyond(r.pts) : r.pts)) / LAB.speed, 0);   // as labPlan2 counts its seconds
export function sheetDry() {
  const { legs, band: [b0, b1], seen: [v0, v1], across: [a0, a1], above, below } = S18, mini = { pitch: 5 };
  const at = ([x, y]) => ({ x: y, y: x });      // a leg [across, from, to]: across the sheet's Y, along its X
  const runsOf = (cells, over) => canonRuns([{ byCell: canonCellsOf(mini, { cells }, { over }) }]).map(r => ({ pts: r.pts.map(at), dip: r.dip, idle: r.idle, beyond: r.beyond }));
  const snake = (y0, n, from, to) => ({ n: 1, legs: Array.from({ length: n }, (_, k) => k % 2 ? [y0 + 5 * k, to, from] : [y0 + 5 * k, from, to]) });
  const yellow = S18.lefts.map(L => runsOf([snake(L, legs, b0, b1)], 2));
  const red = S18.lefts.map(L => [...runsOf([snake(L, 3, a0, a1)], 2), ...runsOf([snake(L + 15, 3, above, v1)], 2), ...runsOf([snake(L + 15, 3, below, v0)], 0)]);
  // the clock: the yellow bands one after another, the change, then every red at its band's age, the brush parked in the jar till then
  const ys = yellow.map(runS), mid = ys.map((d, k) => ys.slice(0, k).reduce((t, v) => t + v, 0) + d / 2);
  let t = ys.reduce((a, b) => a + b, 0) + S18.change;
  const order = [4, 3, 2, 1, 0], parks = [];
  for (const k of order) { const due = mid[k] + S18.ages[k] * 60; parks[k] = Math.max(0, due - t); t = Math.max(t, due) + runS(red[k]); }
  const name = k => String.fromCharCode(65 + k), Y = S18.yellow, Rd = S18.red;
  return [
    ...yellow.map((seq, k) => ({ kind: 'real', c: k, hue: Y.hex, jar: `${Y.name} ${Y.hex}`, wide: true, mm: S3.mm, way: {}, seq, pts: seq[0].pts,
      say: `Yellow band ${name(k)}, ${Y.name} ${Y.hex}: ${legs} legs of ${b1 - b0} mm, its red after ${S18.ages[k]} min` })),
    ...order.map((k, i) => ({ kind: 'real', c: 5 + i, hue: Rd.hex, jar: `${Rd.name} ${Rd.hex}`, wide: true, mm: S3.mm, way: {}, seq: red[k], pts: red[k][0].pts, parkS: Math.round(parks[k]),
      ...(i ? {} : { pause: `The yellow is done: wipe the brush, put the red, ${Rd.name} ${Rd.hex}, in the cup at once, then Continue: the bands' clocks are running` }),
      say: `Red on band ${name(k)} at ${S18.ages[k]} min (the brush ${Math.round(parks[k] / 60)} min in the jar before it): across the band; from above, 3 mm in, its idle run +2 mm; from below, 3 mm in, idle 0` })),
  ];
}
// the brush in the jar for so many seconds: a dip whose paint is a row of waits, as rembrandt.py takes them (10 s at most each)
function parkDip(c, row, s) {
  const d = handDip(c, row), waits = [];
  for (let left = s + c.dwell; left > 1e-6; left -= 10) waits.push({ kind: 'wait', s: +Math.min(10, left).toFixed(1), row, dip: true });
  return [...d.slice(0, 3), ...waits, ...d.slice(4)];
}
function labPlan2({ x0, y0, cup, press, sheet, tracks }) {
  const first = handDip(cup, 0), strokes = [], rows = [], tips = [], shift = p => ({ x: x0 + p.x, y: y0 + p.y }), name = sheet === 18 ? 'LAB 4.0 · dry test' : sheet === 17 ? 'LAB 4.0 · real 3 · layer 2' : sheet === 16 ? 'LAB 4.0 · real 3 · layer 1' : sheet === 15 ? 'LAB 4.0 · real strokes 2' : sheet === 14 ? 'LAB 4.0 · real strokes' : sheet === 13 ? 'LAB 3.0 · ladder' : sheet === 12 ? 'LAB 3.0 · + idle 6.0' : sheet === 11 ? 'LAB 3.0 · + idle 5.0' : sheet === 10 ? 'LAB 3.0 · + idle 4.0' : sheet === 9 ? 'LAB 3.0 · + idle 3.0' : sheet === 8 ? 'LAB 3.0 · + idle 2.0' : sheet === 7 ? 'LAB 3.0 · snake + idle' : sheet === 6 ? 'LAB 3.0 · long snake' : sheet === 5 ? 'LAB 3.0 · seam' : sheet === 4 ? 'LAB 3.0 · long' : sheet === 3 ? 'LAB 3.0' : 'LAB 2.0';
  const blocks = [{ ...first[0], dip: false }, { ...first[5], dip: false }, arm(3, 0, 0)];
  let dips = 0, mm = 0, slowS = 0;
  (sheet === 18 ? sheetDry() : sheet === 17 ? sheetReal3(2) : sheet === 16 ? sheetReal3(1) : sheet === 15 ? sheetReal(S15_WAYS) : sheet === 14 ? sheetReal(S14.ways) : sheet === 13 ? sheet13() : sheet === 12 ? sheet12(tracks) : sheet === 11 ? sheet8(tracks, 'inside', true) : sheet === 10 ? sheet8(tracks, 'inside') : sheet === 9 ? sheet8(tracks, 'ridges') : sheet === 8 ? sheet8(tracks) : sheet === 7 ? sheet7(tracks) : sheet === 6 ? sheet6(tracks) : sheet === 5 ? sheet5(tracks) : sheet === 4 ? sheet4(tracks) : sheet === 3 ? sheet3(tracks) : sheet2()).forEach((q, i) => {
    const n = i + 1, p = q.press ?? press, c = q.dip ? { ...cup, dip: q.dip, paint: [q.dip - 1, q.dip] } : cup;
    if (q.kind === 'real') {                         // LAB 4.0: runs in the plan's order, each its own dip or none, the idle ones as they come
      if (q.pause) blocks.push({ kind: 'pause', why: q.pause, row: 0 });
      q.seq.forEach((r, j) => {
        const parked = !j && r.dip && q.parkS > 0;     // the dry test: the brush waits in the jar till its time
        const pts = (r.beyond ? liftBeyond(r.pts) : r.pts).map(shift), row = rows.length + 1, R = rowPaint(pts, row, q.mm, p), dip = !r.dip ? [] : parked ? parkDip(c, row, q.parkS) : handDip(c, row);
        if (parked) slowS += q.parkS;
        // out of the paint slowly: the elbow from the paint to well above it, then as ever
        if (r.dip && q.way.slowAt) { dip.splice(4, 0, { kind: 'joint', joint: 'elbow', deg: S14.slowTo, speed: q.way.slowAt, fork: [S14.slowTo - 1, S14.slowTo + 1], row, dip: true }); slowS += (S14.slowTo - c.dip) / q.way.slowAt; }
        rows.push({ c: q.c, cells: [[n, 0]] }); tips.push({ n, pts: r.pts.map(shift), idle: !!r.idle, dip: !!r.dip });
        blocks.push(fly(R.start, row), ...dip, ...R.blocks);
        dips += r.dip ? 1 : 0; mm += lengthOf(pts);
      });
      const tip = q.seq[0].pts.map(shift);
      strokes.push({ n, kind: q.kind, hue: q.hue, say: q.say, ...(q.wide ? { wide: true, jar: q.jar } : {}), tip, from: tip[0], to: tip.at(-1), via: [], lines: q.seq.filter(r => !r.idle).flatMap(r => r.pts.slice(1).map((b, j) => [shift(r.pts[j]), shift(b)])) });
      return;
    }
    const runs = q.runs ?? (q.kind === 'cell' ? (q.every ? snakeRuns(q.pts, q.every, q.lap) : rowsOfCell(q.pts)) : q.kind === 'oneway' ? q.tracks : [q.pts]);
    runs.forEach((pts0, j) => {
      const pts = (q.reachEnd && j === runs.length - 1 ? liftBeyond(pts0) : pts0).map(shift), row = rows.length + 1, R = rowPaint(pts, row, q.mm, p, q.ramp), dip = !q.noDip && (q.kind !== 'oneway' || j % (q.every ?? 2) === 0);
      rows.push({ c: 0, cells: [[n, 0]] }); tips.push({ n, pts: pts0.map(shift), idle: false, dip });
      blocks.push(fly(R.start, row), ...(dip ? handDip(c, row) : []), ...R.blocks);
      dips += dip ? 1 : 0; mm += lengthOf(pts);
    });
    if (q.idle) {                                   // the elbow is up from the last run: the flight back, no shoulder, no jar
      const pts = (q.idleRun ? liftBeyond(q.idleRun) : q.over ? liftBeyond(overshot(q.idleLine ?? q.pts, q.over)) : q.pts).map(shift), row = rows.length + 1, R = rowPaint(pts, row, q.mm, p);
      rows.push({ c: 0, cells: [[n, 0]] }); tips.push({ n, pts, idle: true, dip: false });
      blocks.push(fly(R.start, row), ...R.blocks);
      mm += lengthOf(pts);
    }
    const tip = (q.kind === 'oneway' ? q.tracks.flat() : q.pts).map(shift);
    strokes.push({ n, kind: q.kind, hue: q.hue, say: q.say, tip, from: tip[0], to: tip.at(-1), via: [], ...(q.tracks ? { lines: q.tracks.map(l => l.map(shift)) } : {}), ...(q.over ? { over: q.over, idleTip: (q.idleRun ?? overshot(q.idleLine ?? q.pts, q.over)).map(shift) } : {}) });
  });
  const pts = blocks.flatMap(b => (b.cmds || []).filter(c => c[0] === 'L' || c[0] === 'M').map(c => c.split(' ').slice(1).map(Number)));
  // runs: every run's tip in the run's order, its number, idle or not: the page's ▶ Play walks them
  return { blocks, strokes, runs: tips, ...(sheet === 16 || sheet === 17 ? { note: real3Note() } : {}), seconds: dips * 12 + rows.length * 2 + Math.round(mm / LAB.speed + slowS),
    bounds: { x0: Math.min(...pts.map(p => p[0])), x1: Math.max(...pts.map(p => p[0])), y0: Math.min(...pts.map(p => p[1])), y1: Math.max(...pts.map(p => p[1])) },
    remote: { colours: sheet >= 16 ? strokes.map(q => ({ name: q.jar, hex: q.hue, code: '', cells: 1 })) : sheet === 14 || sheet === 15 ? [{ name: `${name} · the first paint`, hex: '#3E8E5A', code: '', cells: strokes.filter(q => q.hue === '#3E8E5A').length }, { name: `${name} · the second paint`, hex: '#2B6CB0', code: '', cells: strokes.filter(q => q.hue === '#2B6CB0').length }] : [{ name, hex: '#2B6CB0', code: '', cells: strokes.length }], rows } };
}

// the sheet at its bottom left corner (x0, y0), carriage mm: X up, Y right, as on every tab; at its end the
// brush up and the carriage home, as OPM-N's run (the owner, 2026-11-05: "it stops there, I go to OPM-N and lead
// it home from there"). bounds: the sheet's own, home is no part of them.
export function labPlan({ x0, y0, cup, press = LAB.press, sheet = 1, tracks }) {
  const P = sheet >= 2 ? labPlan2({ x0, y0, cup, press, sheet, tracks }) : labPlan1({ x0, y0, cup, press });
  return { ...P, blocks: [...P.blocks, ...homeBlocks(LAB.travel).map(b => ({ ...b, row: P.remote.rows.length }))] };
}
function labPlan1({ x0, y0, cup, press }) {
  const { h } = labSize(), first = handDip(cup, 0), strokes = [], rows = [];
  const blocks = [{ ...first[0], dip: false }, { ...first[5], dip: false }, arm(3, 0, 0)];
  LIST.forEach((q0, i) => {
    const n = i + 1, at = q0.kind === 'along' ? { x: x0, y: y0 + q0.c * LAB.step } : { x: x0 + h - q0.r * LAB.rowGap, y: y0 + q0.c * LAB.step };
    const q = { ...q0, n, at }, s = strokeBlocks(q, n, cup, press);
    blocks.push(...s.blocks);
    const len = q.kind === 'along' ? LAB.along : LAB.length;                       // on the screen the tip's line, the carriage off it in the air
    const tip = q.kind === 'along' ? [{ x: q.back ? at.x + len : at.x, y: at.y }, { x: q.back ? at.x : at.x + len, y: at.y }] : [{ x: at.x, y: q.back ? at.y + len : at.y }, { x: at.x, y: q.back ? at.y : at.y + len }];
    strokes.push({ n, kind: q.kind, say: q.say, from: s.from, to: s.to, via: s.via || [], tip: q.kind === 'snake' ? [s.from, ...s.via, s.to] : q.kind.startsWith('mark') ? [s.from] : tip });
    rows.push({ c: 0, cells: [[n, 0]] });
  });
  const pts = blocks.flatMap(b => (b.cmds || []).filter(c => c[0] === 'L' || c[0] === 'M').map(c => c.split(' ').slice(1).map(Number)));
  return { blocks, strokes, seconds: strokes.length * 16,
    bounds: { x0: Math.min(...pts.map(p => p[0])), x1: Math.max(...pts.map(p => p[0])), y0: Math.min(...pts.map(p => p[1])), y1: Math.max(...pts.map(p => p[1])) },
    remote: { colours: [{ name: 'LAB', hex: '#D8453B', code: '', cells: strokes.length }], rows } };
}
