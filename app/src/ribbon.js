// NOLAN's ribbons (NOLAN.md §3): a centre path of lines and arcs, and N
// lines across it, 8 mm wide and 8 mm apart — one stroke each, one way. The
// width is a count of lines, the same along the whole ribbon (the owner,
// 2026-10-04). No taper, no pinch, no twist: those are the style of the
// Test tab's pattern D, not NOLAN's.
//
// Units as everywhere: pt, 1 pt = 25.4/72 mm. No DOM here.

import { PT_MM } from './config.js';
import { P } from './util.js';
import { filleted, offsetSegs } from './fillet.js';
import { pathLength } from './bands.js';
import { buildCurve } from './curve.js';

export const PITCH_MM = 8;      // the lines' centres apart, and their width (Rembrandt.md §3)
export const MIN_LINES = 1;
export const MAX_LINES = 40;    // 320 mm, wider than any ribbon of IMG_9424

const pt = mm => mm / PT_MM;
export const ribbonWidth = r => r.n * PITCH_MM;                        // mm
export const clampLines = n => Math.max(MIN_LINES, Math.min(MAX_LINES, Math.round(n) || MIN_LINES));
// The readout of the width: "96 mm · 12 lines".
export const widthLabel = n => `${n * PITCH_MM} mm · ${n} line${n === 1 ? '' : 's'}`;

// Line k (0 … N−1, from the left of the brush's travel) lies off the centre
// by (k − (N − 1) / 2) · 8 mm.
export const lineOffset = (k, n) => (k - (n - 1) / 2) * PITCH_MM;      // mm, + to the right of travel

// The ribbon's lines. Every kink of the centre is rounded for the whole
// width, as RUBENS rounds a stroke (fillet.js: radius W/2 + the inner corner
// radius), so the inner line keeps that inner radius and nothing crosses.
// warn: the places where the bend is still too tight for the width — a kink
// with no room for its rounding, or an arc drawn under W/2 — marked "!" on
// the tab; there offsetSegs cuts the inner lines into a sharp point.
export function ribbonLines(r, cornerRmm) {
  if (!r.segs.length) return { centre: [], warn: [], lines: [] };
  const f = filleted({ id: r.id, segs: r.segs, style: { weight: pt(ribbonWidth(r)) } }, cornerRmm);
  const lines = [];
  for (let k = 0; k < r.n; k++) {
    const off = lineOffset(k, r.n);
    lines.push({ k, off, segs: offsetSegs(f.segs, pt(off)) });
  }
  return { centre: f.segs, warn: f.warn, lines };
}

// All the lines of a ribbon end to end, mm.
export const linesLength = L => L.lines.reduce((a, l) => a + pathLength(l.segs), 0) * PT_MM;

// The ribbons by painting order: N1, N2, N3 … (NOLAN.md §1).
export const ribbonName = i => `N${i + 1}`;

// The owner's three ribbons, the tab's default (the owner, 2026-10-04: "I
// would start these three ribbons by default"): his green paths of
// nolan-images/IMG_9424-N1_N2_N3_paths.webp — IMG_9424 at 0.7475, 238 px
// down — in mm on the 500 × 700 canvas, IMG_9424 fitted whole inside it.
// Lines and arcs as turtle steps (curve.js): start, heading (degrees,
// clockwise), then ['L', mm] or ['R' | 'T', radius mm, degrees]. N1 the
// upper arc, its hook wider than the sketch's so 96 mm of lines turn
// without folding and stay on the canvas; N2 the lower loop; N3 the middle
// ribbon lying over both.
const SKETCH = [
  { n: 12, at: [107, 318], dir: -88, ops: [['L', 30], ['R', 115, 88], ['L', 25], ['R', 95, 80], ['L', 50], ['T', 50, 230]] },
  { n: 12, at: [377, 368], dir: 100, ops: [['L', 80], ['R', 70, 100], ['L', 40], ['R', 60, 45]] },
  { n: 14, at: [62, 342], dir: 95, ops: [['L', 10], ['T', 60, 95], ['L', 40], ['T', 80, 65], ['L', 95]] },
];
export const sketchRibbons = () => SKETCH.map(s => ({
  n: s.n,
  segs: buildCurve(P(pt(s.at[0]), pt(s.at[1])), s.dir, s.ops.map(([op, a, b]) => [op, pt(a), b])),
}));
