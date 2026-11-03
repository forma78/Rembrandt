// The ink: where the brush takes its paint (the owner, 2026-10-03: "maybe
// one more tab, INK"). One cup for now, by the left edge of the canvas;
// later the dip station's cups at the edges of the frame (Rembrandt.md §1).
// Kept in app/ink.json through rembrandt.py (/ink); the Ink tab sets it,
// INK ON on the Test tab dips into it. Since 2026-11-03 the cup on the beam
// too, INK-Y's (BEAM, below). No DOM; drawCup draws on a canvas it is given.
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
// INK-Y (the owner, 2026-11-03, OPM-N/IMG_2060…2062: "the jar somewhere near
// … the machine need not go across the whole table, it is enough to drive
// along Y"): the cup on a bracket of the beam, in the 90 mm left of the
// canvas, riding with the beam in X. The carriage goes along Y only, to where
// the shoulder, turned (−25.1° on his machine), puts the brush over the cup's
// centre; the elbow dips as on the Ink tab; up over the rim, the shoulder back
// to 0, back. Kept in ink.json's `beam`; once set, every dip goes there. His
// twelve flat-bottomed jars, ⌀57; the shoulder's speed est.
export const BEAM = { diameter: 57, swing: 40 };
export const SHOULDER_MIN = -45, SHOULDER_MAX = 45, SWING_MIN = 5, SWING_MAX = 100;
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

// The cup every dip goes to: INK-Y's on the beam once it is set, else the
// Ink tab's on the table.
export function cupOf(ink) {
  const b = beamOf(ink);
  return b.y !== null && b.shoulder !== null ? b : tableOf(ink);
}

// The Ink tab's cup as the plan takes it: its numbers, the defaults where
// none was typed, and which of them are still est.
export function tableOf(ink) {
  const c = ink?.cup || {}, set = num(c.x) !== null && num(c.y) !== null;
  const out = { x: set ? +c.x : null, y: set ? +c.y : null, at: c.at || null, est: {} };
  for (const k of Object.keys(CUP)) {
    const v = num(c[k]);
    out[k] = v ?? CUP[k];
    if (v === null && EST.includes(k)) out.est[k] = true;
  }
  return out;
}

// INK-Y's cup: the carriage's Y and the shoulder's angle that put the brush
// over its centre, its X the beam's wherever it is (x null). The elbow over
// the rim, in the cup and the dwell as typed on INK-Y, else as on the Ink
// tab — "the jar on the same level as now on INK" (the owner).
export function beamOf(ink) {
  const b = ink?.beam || {}, t = ink?.cup || {}, set = num(b.y) !== null && num(b.shoulder) !== null;
  const out = { beam: true, x: null, y: set ? +b.y : null, shoulder: set ? +b.shoulder : null, at: b.at || null, est: {} };
  for (const k of Object.keys(CUP)) {
    const v = num(b[k]) ?? (k === 'rim' || k === 'dip' || k === 'dwell' ? num(t[k]) : null);
    out[k] = v ?? BEAM[k] ?? CUP[k];
    if (v === null && EST.includes(k)) out.est[k] = true;
  }
  out.swing = num(b.swing) ?? BEAM.swing;
  if (num(b.swing) === null) out.est.swing = true;
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
  const c = tableOf(ink), e = ink?.canvas || {}, left = num(e.left), bottom = num(e.bottom);
  if (c.x === null || left === null || bottom === null || !(w > 0) || !(h > 0)) return null;
  const r = v => Math.round(v * 100) / 100;
  return { x: r(c.x - bottom + h / 2), y: r(c.y + left + w / 2), left, bottom };
}

// Where the brush dips: the cup's centre, or, when that lies past a wall —
// the owner's first cup, 0.37 mm past the left one (2026-10-03) — the
// nearest point inside the walls: the board takes no path past them. off:
// how far that is from the centre, mm. null until the cup is set. The cup
// on the beam: its Y alone, x null — the carriage dips where the beam is.
const EDGE_IN = 0.1;   // inside the walls, as home (machine.js)
export function dipAt(c) {
  if (!c || c.y === null || (c.beam ? c.shoulder === null : c.x === null)) return null;
  const R = reach(), into = (v, lo, hi) => Math.min(hi - EDGE_IN, Math.max(lo + EDGE_IN, v));
  const x = c.beam || (c.x >= R.x.min && c.x <= R.x.max) ? c.x : into(c.x, R.x.min, R.x.max);
  const y = c.y >= R.y.min && c.y <= R.y.max ? c.y : into(c.y, R.y.min, R.y.max);
  const r = v => Math.round(v * 100) / 100;
  return { x: c.beam ? null : r(x), y: r(y), off: c.beam ? Math.abs(y - c.y) : Math.hypot(x - c.x, y - c.y) };
}

// Why the brush cannot dip into this cup, or ''.
export function cupProblem(c) {
  if (c?.beam) {
    if (c.y === null || c.shoulder === null) return 'The cup on the beam is not set: on the INK-Y tab, the brush over its centre, press Here.';
    if (c.shoulder < SHOULDER_MIN || c.shoulder > SHOULDER_MAX) return `To the cup ${c.shoulder}°: the shoulder goes ${SHOULDER_MIN}…+${SHOULDER_MAX}°.`;
    if (!(c.swing >= SWING_MIN && c.swing <= SWING_MAX)) return `The shoulder at ${c.swing}°/s: ${SWING_MIN}…${SWING_MAX}°/s.`;
  } else if (!c || c.x === null || c.y === null) return 'The cup is not set: on the Ink tab, the brush over its centre, press Here.';
  const off = dipAt(c).off;
  if (off > c.diameter / 4) return `The cup's centre lies ${off.toFixed(1)} mm past the machine's walls: the brush would dip too near its rim. Move the cup in and take it again.`;
  if (c.rim < RIM_MIN || c.rim > ELBOW_MAX) return `Over the rim ${c.rim}°: the elbow goes +${RIM_MIN}…+${ELBOW_MAX}° there.`;
  if (c.dip < ELBOW_MIN || c.dip > c.rim - 5) return `In the cup ${c.dip}°: the elbow goes ${ELBOW_MIN}…+${c.rim - 5}° there, below Over the rim.`;
  if (c.dwell < 0 || c.dwell > DWELL_MAX) return `In the paint ${c.dwell} s: 0…${DWELL_MAX} s.`;
  return '';
}
