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
  A: { rows: 8, turn: 10, pitch: 25 },   // tight, the owner's sketch A
  B: { rows: 5, turn: 20, pitch: 40 },   // loose, sketch B
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
  const o = { ...DEFAULTS, ...opts }, r = o.turn / 2, half = o.length / 2;
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
