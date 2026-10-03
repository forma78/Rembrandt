// The ink: where the brush takes its paint (the owner, 2026-10-03: "maybe
// one more tab, INK"). One cup for now, by the left edge of the canvas;
// later the dip station's cups at the edges of the frame (Rembrandt.md §1).
// Kept in app/ink.json through rembrandt.py (/ink); the Ink tab sets it,
// INK ON on the Test tab dips into it. No DOM; drawCup draws on a canvas
// it is given.
//
// The cup's centre is where the carriage stands with the brush over it, as
// Here on the Test tab: machine mm, X up, Y to the right.

import { ELBOW_LIFT } from './strokes.js';
import { reach } from './machine.js';

// The cup, ⌀50 and 20 mm high (the owner, 2026-10-03); a second in the
// paint ("1 second is perfect"). The elbow over the rim and in the cup is
// est. until typed on the Ink tab: 0° presses the brush to the canvas, it
// leaves at +10°, +45° at most (Calibration).
export const CUP = { diameter: 50, height: 20, rim: 35, dip: 5, dwell: 1 };
export const EST = ['rim', 'dip'];
export const ELBOW_MIN = -5, ELBOW_MAX = 45;
export const RIM_MIN = ELBOW_LIFT + 5;   // over the rim the brush is well off the canvas
export const DWELL_MAX = 10;
// Where the cup stands until its centre is taken: 400 mm up from the bottom
// left corner, at the left wall (the owner, 2026-10-03, a red scope drawn
// there on the Ink tab: "I will aim there"). est.
export const CUP_AIM = { x: 400, y: 0 };
const SCOPE = '#E2321B';   // the owner's red scope

// The cup as a scope, its centre at X, Y px, its rim r px: a red ring and a
// cross through it, past the rim (the owner: "a target for the cup, I will
// aim there"); dashed while only aimed at, not yet taken.
export function drawCup(ctx, X, Y, r, aimed = false) {
  ctx.save();
  ctx.strokeStyle = SCOPE; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  if (aimed) { ctx.setLineDash([5, 4]); ctx.globalAlpha = 0.8; }
  ctx.beginPath(); ctx.arc(X, Y, r, 0, Math.PI * 2); ctx.stroke();
  const e = r * 1.7;
  ctx.beginPath(); ctx.moveTo(X - e, Y); ctx.lineTo(X + e, Y); ctx.moveTo(X, Y - e); ctx.lineTo(X, Y + e); ctx.stroke();
  ctx.restore();
}

const num = v => (v === null || v === undefined || v === '' || !Number.isFinite(+v) ? null : +v);

// The cup as the plan takes it: its numbers, the defaults where none was
// typed, and which of them are still est.
export function cupOf(ink) {
  const c = ink?.cup || {}, set = num(c.x) !== null && num(c.y) !== null;
  const out = { x: set ? +c.x : null, y: set ? +c.y : null, at: c.at || null, est: {} };
  for (const k of Object.keys(CUP)) {
    const v = num(c[k]);
    out[k] = v ?? CUP[k];
    if (v === null && EST.includes(k)) out.est[k] = true;
  }
  return out;
}

// The canvas from the cup (the owner, 2026-10-03: "I do not see where the
// centre of 500 × 700 is, there is no laser"; every point found by hand
// adds its own error). The cup is the one point found on the machine; the
// canvas lies from it by two ruler numbers — its left edge `left` mm to the
// right of the cup's centre, its bottom edge `bottom` mm below it ("the
// bottom is easier to measure"). With the canvas's size, its centre: Here
// for the Test tab. null until all is known.
export function canvasFrom(ink, w, h) {
  const c = cupOf(ink), e = ink?.canvas || {}, left = num(e.left), bottom = num(e.bottom);
  if (c.x === null || left === null || bottom === null || !(w > 0) || !(h > 0)) return null;
  const r = v => Math.round(v * 100) / 100;
  return { x: r(c.x - bottom + h / 2), y: r(c.y + left + w / 2), left, bottom };
}

// Where the brush dips: the cup's centre, or, when that lies past a wall —
// the owner's first cup, 0.37 mm past the left one (2026-10-03) — the
// nearest point inside the walls: the board takes no path past them. off:
// how far that is from the centre, mm. null until the cup is set.
const EDGE_IN = 0.1;   // inside the walls, as home (machine.js)
export function dipAt(c) {
  if (!c || c.x === null || c.y === null) return null;
  const R = reach(), into = (v, lo, hi) => Math.min(hi - EDGE_IN, Math.max(lo + EDGE_IN, v));
  const x = c.x >= R.x.min && c.x <= R.x.max ? c.x : into(c.x, R.x.min, R.x.max);
  const y = c.y >= R.y.min && c.y <= R.y.max ? c.y : into(c.y, R.y.min, R.y.max);
  const r = v => Math.round(v * 100) / 100;
  return { x: r(x), y: r(y), off: Math.hypot(x - c.x, y - c.y) };
}

// Why the brush cannot dip into this cup, or ''.
export function cupProblem(c) {
  if (!c || c.x === null || c.y === null) return 'The cup is not set: on the Ink tab, the brush over its centre, press Here.';
  const off = dipAt(c).off;
  if (off > c.diameter / 4) return `The cup's centre lies ${off.toFixed(1)} mm past the machine's walls: the brush would dip too near its rim. Move the cup in and take it again.`;
  if (c.rim < RIM_MIN || c.rim > ELBOW_MAX) return `Over the rim ${c.rim}°: the elbow goes +${RIM_MIN}…+${ELBOW_MAX}° there.`;
  if (c.dip < ELBOW_MIN || c.dip > c.rim - 5) return `In the cup ${c.dip}°: the elbow goes ${ELBOW_MIN}…+${c.rim - 5}° there, below Over the rim.`;
  if (c.dwell < 0 || c.dwell > DWELL_MAX) return `In the paint ${c.dwell} s: 0…${DWELL_MAX} s.`;
  return '';
}
