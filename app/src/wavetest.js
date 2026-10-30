// The wave test (the owner, 2026-10-29, OPM/IMAGE 19:31:30: OPM-P's pencil
// rays waved, the most at one end; IMAGE 20:00:33: "the X motor pulls the
// two carriages from the right only — a sharp start drags the right one, the
// left one comes a moment later"). On the canvas of every tab, in pencil, the
// same lines on its left and on its right: a pair along Y alone (the beam
// standing), a pair down each diagonal, and in the middle a pair along X
// alone — every pair one line each way, the first → ↘ ↗ ↑, the second back.
// Read on the paper: the Y pair waving too — not the beam, the pencil's
// holder; the diagonals only, more on the left, far from the motor — the
// beam; one line of a pair only — the way it goes.

import { plotRun, DEFAULTS, TAIL_MIN } from './strokes.js';

export const WAVE_MARGIN = 20;   // mm in from the canvas's edges
export const WAVE_GAP = 10;      // mm between a pair's two lines
export const WAVE_SPACE = 15;    // mm between two pairs
export const WAVE_MIN = 40;      // mm: a diagonal shorter across is no test

// The lines, canvas mm from its bottom left corner, [across, up]: { side,
// pair, dir, a, b } in the order drawn — the left column top down, the middle,
// the right column bottom up, so the pencil never flies across the canvas.
export function waveLines(W, H) {
  const m = WAVE_MARGIN, g = WAVE_GAP, G = WAVE_SPACE, d = g * Math.SQRT2;   // d: across, two diagonals g apart
  const w = (W - 2 * m - g - 2 * G) / 2, b = Math.min(w - d, (H - 2 * m - g - 2 * G) / 2);
  if (!(b >= WAVE_MIN)) return { lines: [], why: `the canvas ${W} × ${H} mm is too small for it: ${Math.ceil(2 * (WAVE_MIN + d) + 2 * m + g + 2 * G)} ×${2 * WAVE_MIN + 2 * m + g + 2 * G} mm at least` };
  const top = H - m, t = top - g - G, u = t - b - G, mid = W / 2;
  const column = (side, y0) => [
    { side, pair: 'Y', dir: '→', a: [y0, top], b: [y0 + w, top] },
    { side, pair: 'Y', dir: '←', a: [y0 + w, top - g], b: [y0, top - g] },
    { side, pair: '\\', dir: '↘', a: [y0, t], b: [y0 + b, t - b] },
    { side, pair: '\\', dir: '↖', a: [y0 + d + b, t - b], b: [y0 + d, t] },
    { side, pair: '/', dir: '↗', a: [y0, u - b], b: [y0 + b, u] },
    { side, pair: '/', dir: '↙', a: [y0 + d + b, u], b: [y0 + d, u - b] }];
  const left = column('left', m), right = column('right', W - m - w);
  const middle = [{ side: 'middle', pair: 'X', dir: '↑', a: [mid - g / 2, m], b: [mid - g / 2, top] },
    { side: 'middle', pair: 'X', dir: '↓', a: [mid + g / 2, top], b: [mid + g / 2, m] }];
  return { lines: [...left, ...middle, ...right.slice(4), ...right.slice(2, 4), ...right.slice(0, 2)], w, b };
}

// The run, as OPM-P's DRAW BW runs its lines (inka.js, prismaRun): one path,
// the pencil pressed at o.press on a line, up at o.glide between two, on the
// move; o { here, speed, travel, press, glide }. The carriage goes home at the end.
export function waveRun(W, H, o) {
  const T = waveLines(W, H);
  if (!T.lines.length) return { ...T, blocks: [] };
  const toM = q => ({ x: q[1] - H / 2, y: q[0] - W / 2 }), path = [];
  T.lines.forEach((l, i) => {
    if (i) path.push({ t: 'L', a: path.at(-1).b, b: toM(l.a), row: 1, tilt: 0, turn: true });
    path.push({ t: 'L', a: toM(l.a), b: toM(l.b), row: 1, tilt: 0 });
  });
  const r = plotRun({ ...DEFAULTS, speed: o.speed, travel: o.travel, tail: TAIL_MIN, lift: true, ink: false, snake: true, pause: false, rows: 1, minPiece: 0.005, here: o.here,
    pencil: { press: o.press, glide: o.glide }, hover: o.glide }, [{ key: 'WAVE', ps: [path], why: null }]);
  return { ...T, ...r, mm: T.lines.reduce((s, l) => s + Math.hypot(l.b[0] - l.a[0], l.b[1] - l.a[1]), 0) };
}
