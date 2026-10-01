// The test bench: rows of hairpins on a 30 × 30 board, drawn by the plotter
// — X and Y on their steppers, lines and arcs (the owner, 2026-10-02: the arm
// strokes were tried in the air and dropped, "not Instagram-worthy"; the
// patterns of references/Screenshot 2026-10-02 3DOF.png stay). A row: the
// brush down, a line to the right, a half circle down, a line back, the
// brush off with the wrist's hook; then the carriage to the next row.
//
// Machine mm: X up the picture, Y to the right. "Here" is where the carriage
// stands with the brush over the board's centre. No DOM.

import { arcSpeed } from './machine.js';

export const PATTERNS = {
  A: { rows: 8, turn: 10, pitch: 25, snake: false },   // tight, the owner's sketch A
  B: { rows: 5, turn: 20, pitch: 40, snake: false },   // loose, sketch B
  // C, the snake (the owner, 2026-10-02: references/Screenshot 2026-10-02
  // snake.png): one continuous line, row after row, turning round in a half
  // circle at either end; the brush stays down from the first row to the last
  C: { rows: 12, pitch: 20, snake: true },
};
export const DEFAULTS = {
  board: 300, margin: 30,     // mm: the 30 × 30 board
  length: 220,                // mm, the straight part of a row
  speed: 30,                  // mm/s with the brush on (est.)
  travel: 100,                // mm/s between rows, the brush off
  swing: -54,                 // the wrist's brush off
  pause: true,                // after every row: paint for the brush
  ...PATTERNS.A,
};

export function xyPlan(opts) {
  const o = { ...DEFAULTS, ...opts };
  if (o.snake) return snakePlan(o);
  const r = o.turn / 2;
  const width = o.length + r, height = (o.rows - 1) * o.pitch + o.turn;
  const room = o.board - 2 * o.margin, top = height / 2, left = -width / 2, right = left + o.length;
  const f = v => (Math.round(v * 100) / 100).toFixed(2);
  const X0 = o.here?.x ?? 0, Y0 = o.here?.y ?? 0, vArc = arcSpeed(o.speed, r);
  const blocks = [{ kind: 'arm', cmd: `J 3 ${o.swing}`, row: 0 }];
  const preview = [];
  for (let k = 0; k < o.rows; k++) {
    const x = top - k * o.pitch, row = k + 1, len = 2 * o.length + Math.PI * r;
    blocks.push(
      { kind: 'move', cmds: [`T ${o.travel}`, `M ${f(X0 + x)} ${f(Y0 + left)}`, 'G'], lengthMM: null, paintMM: 0, row },
      { kind: 'arm', cmd: 'J 3 0', row },                                        // the brush down
      { kind: 'move', row, lengthMM: len, paintMM: len, painted: [1, 1, 1],   // the pieces: line, arc, line
        cmds: [`F ${o.speed}`, `L ${f(X0 + x)} ${f(Y0 + right)}`,                // out
          ...(vArc === o.speed ? [] : [`F ${vArc}`]),
          `A ${f(X0 + x - r)} ${f(Y0 + right)} ${f(X0 + x - o.turn)} ${f(Y0 + right)} 1`,   // the half circle, round on the right
          ...(vArc === o.speed ? [] : [`F ${o.speed}`]),
          `L ${f(X0 + x - o.turn)} ${f(Y0 + left)}`, 'G'] },                      // back
      { kind: 'arm', cmd: `J 3 ${o.swing}`, row },                               // the brush off: the hook
    );
    if (o.pause && k < o.rows - 1) blocks.push({ kind: 'pause', why: `paint for the brush, then Continue: row ${row + 1} of ${o.rows}`, row });
    const pts = [{ x, y: left }, { x, y: right }];
    for (let i = 1; i < 24; i++) { const a = Math.PI * i / 24; pts.push({ x: x - r + r * Math.cos(a), y: right + r * Math.sin(a) }); }
    pts.push({ x: x - o.turn, y: right }, { x: x - o.turn, y: left });
    preview.push(pts);
  }
  blocks.push({ kind: 'move', cmds: [`T ${o.travel}`, `M ${f(X0)} ${f(Y0)}`, 'G'], lengthMM: null, paintMM: 0, row: o.rows });
  const seconds = o.rows * ((2 * o.length + Math.PI * r) / o.speed + o.pitch / o.travel + 5);   // the rows, the moves, the wrist (est.)
  // where the brush goes, mm from Here: the rows and the round turns
  const box = { x0: top - height, x1: top, y0: left, y1: right + r };
  return { blocks, preview, width, height, room, box, fits: width <= room + 1e-9 && height <= room + 1e-9, seconds, rows: o.rows, opts: o };
}

// C: the snake. Row k runs left to right when k is even, back when it is odd;
// between rows a half circle of the pitch, round on the right after a row to
// the right, round on the left after a row to the left. One path, one brush
// down, one hook at the end.
function snakePlan(o) {
  const r = o.pitch / 2, width = o.length + 2 * r, height = (o.rows - 1) * o.pitch;
  const room = o.board - 2 * o.margin, top = height / 2, left = -o.length / 2, right = o.length / 2;
  const f = v => (Math.round(v * 100) / 100).toFixed(2);
  const X0 = o.here?.x ?? 0, Y0 = o.here?.y ?? 0, vArc = arcSpeed(o.speed, r);
  const cmds = [`F ${o.speed}`], pts = [{ x: top, y: left }];
  let pieces = 0;
  for (let k = 0; k < o.rows; k++) {
    const x = top - k * o.pitch, toRight = k % 2 === 0, end = toRight ? right : left;
    cmds.push(`L ${f(X0 + x)} ${f(Y0 + end)}`); pieces++;
    pts.push({ x, y: end });
    if (k === o.rows - 1) break;
    if (vArc !== o.speed) cmds.push(`F ${vArc}`);
    // +1 turns from +X to +Y: round on the right; −1 round on the left
    cmds.push(`A ${f(X0 + x - r)} ${f(Y0 + end)} ${f(X0 + x - 2 * r)} ${f(Y0 + end)} ${toRight ? 1 : -1}`); pieces++;
    if (vArc !== o.speed) cmds.push(`F ${o.speed}`);
    for (let i = 1; i < 24; i++) { const a = Math.PI * i / 24; pts.push({ x: x - r + r * Math.cos(a), y: end + (toRight ? 1 : -1) * r * Math.sin(a) }); }
  }
  cmds.push('G');
  const len = o.rows * o.length + (o.rows - 1) * Math.PI * r;
  const blocks = [
    { kind: 'arm', cmd: `J 3 ${o.swing}`, row: 0 },
    { kind: 'move', cmds: [`T ${o.travel}`, `M ${f(X0 + top)} ${f(Y0 + left)}`, 'G'], lengthMM: null, paintMM: 0, row: 1 },
    { kind: 'arm', cmd: 'J 3 0', row: 1 },                                     // the brush down, once
    { kind: 'move', cmds, lengthMM: len, paintMM: len, painted: Array(pieces).fill(1), row: 1 },
    { kind: 'arm', cmd: `J 3 ${o.swing}`, row: o.rows },                       // the brush off at the end: the hook
    { kind: 'move', cmds: [`T ${o.travel}`, `M ${f(X0)} ${f(Y0)}`, 'G'], lengthMM: null, paintMM: 0, row: o.rows },
  ];
  const box = { x0: top - height, x1: top, y0: left - r, y1: right + r };
  return { blocks, preview: [pts], width, height, room, box, fits: width <= room + 1e-9 && height <= room + 1e-9,
    seconds: len / o.speed + 10, rows: o.rows, length: len, snake: true, opts: o };
}
