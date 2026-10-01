// Arm strokes — the 3DOF test (Rembrandt.md §11, the owner, 2026-10-02:
// references/Screenshot 2026-10-02 3DOF.png). Rows of hairpins on a small
// board: the shoulder draws an arc, the carriage steps down with the brush
// on, the shoulder draws it back; the wrist lifts the brush with its hook;
// the carriage goes down to the next row. The arm and the rail never move
// together (the firmware), so a hairpin is three moves.
//
// Machine mm: X up the picture, Y to the right. "Here" is where the carriage
// stands with the shoulder at 0° and the brush over the board's centre. The
// tip turns round the shoulder's axis at `reach` mm (est.); the shoulder's
// plus takes the brush to the right. No DOM.

const rad = d => d * Math.PI / 180;

export const PATTERNS = {
  A: { rows: 8, turn: 10, pitch: 25 },   // tight, the owner's sketch A: 217 mm high with the arc's sag
  B: { rows: 5, turn: 20, pitch: 40 },   // loose, sketch B: 212 mm
};
export const DEFAULTS = {
  board: 300, margin: 30,     // mm: the 30 × 30 board
  reach: 208,                 // mm from the shoulder's axis to the tip, est. (120 + 90 mm, the elbow a little bent)
  sweep: 32,                  // ° each way from the middle
  speed: 10,                  // °/s with the brush on: about 36 mm/s at 208 mm
  fast: 53,                   // °/s in the air
  turnSpeed: 30, travel: 100, // mm/s: the carriage in the turn (brush on), and between rows (off)
  swing: -54,                 // the wrist's brush off
  pause: true,                // after every row: paint for the brush
  ...PATTERNS.A,
};

// The tip with the carriage moved by (dx, dy) from Here and the shoulder at phi.
export const tipAt = (o, dx, dy, phi) => ({ x: dx + o.reach * (Math.cos(rad(phi)) - 1), y: dy + o.reach * Math.sin(rad(phi)) });

export function armPlan(opts) {
  const o = { ...DEFAULTS, ...opts }, th = o.sweep;
  const sag = o.reach * (1 - Math.cos(rad(th)));                 // how much lower the ends lie than the middle
  const width = 2 * o.reach * Math.sin(rad(th));
  const height = (o.rows - 1) * o.pitch + o.turn + sag;
  const room = o.board - 2 * o.margin;
  const top = height / 2;                                         // the pattern centred on the board
  const f = v => (Math.round(v * 10) / 10).toFixed(1);
  const X0 = o.here?.x ?? 0, Y0 = o.here?.y ?? 0;
  const blocks = [{ kind: 'arm', cmd: `J 3 ${o.swing}`, row: 0 }];
  const preview = [];
  const arc = (dx, a, b) => { const n = 48, pts = []; for (let i = 0; i <= n; i++) pts.push(tipAt(o, dx, 0, a + (b - a) * i / n)); return pts; };
  for (let k = 0; k < o.rows; k++) {
    const dx = top - k * o.pitch, row = k + 1;
    blocks.push(
      { kind: 'joint', joint: 'shoulder', deg: -th, speed: o.fast, row },                       // in the air, to the left end
      { kind: 'move', cmds: [`T ${o.travel}`, `M ${f(X0 + dx)} ${f(Y0)}`, 'G'], row },          // the carriage to the row
      { kind: 'arm', cmd: 'J 3 0', row },                                                       // the brush down: the landing hook
      { kind: 'joint', joint: 'shoulder', deg: th, speed: o.speed, row },                       // the stroke out
      { kind: 'move', cmds: [`T ${o.turnSpeed}`, `M ${f(X0 + dx - o.turn)} ${f(Y0)}`, 'G'], row }, // the turn, the brush on
      { kind: 'joint', joint: 'shoulder', deg: -th, speed: o.speed, row },                      // the stroke back
      { kind: 'arm', cmd: `J 3 ${o.swing}`, row },                                              // the brush up: the hook
    );
    if (o.pause && k < o.rows - 1) blocks.push({ kind: 'pause', why: `paint for the brush, then Continue: row ${row + 1} of ${o.rows}`, row });
    const out = arc(dx, -th, th), back = arc(dx - o.turn, th, -th);
    preview.push([...out, ...back]);
  }
  blocks.push(
    { kind: 'joint', joint: 'shoulder', deg: 0, speed: o.fast, row: o.rows },
    { kind: 'move', cmds: [`T ${o.travel}`, `M ${f(X0)} ${f(Y0)}`, 'G'], row: o.rows },
  );
  const seconds = o.rows * (2 * 2 * th / o.speed + 2 * th / o.fast + 6) ;   // the strokes, the arm in the air, the wrist and the carriage (est.)
  return { blocks, preview, width, height, sag, room, fits: width <= room + 1e-9 && height <= room + 1e-9, seconds, rows: o.rows, opts: o };
}
