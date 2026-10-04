// NOLAN's ribbons (NOLAN.md §3): a centre path of lines and arcs, and N
// lines across it, each one stroke — the same N along the whole ribbon (the
// owner, 2026-10-04). No taper, no pinch, no twist: those are the style of
// the Test tab's pattern D, not NOLAN's.
//
// The document is in pt, 1 pt = 25.4/72 mm, its origin the canvas's centre,
// x across, y down — so a ribbon stays where it is when the board's size
// changes. On the machine (Test's way, strokes.js): mm from Here, the
// canvas's centre, X up, Y to the right. No DOM here.

import { PT_MM } from './config.js';
import { P, sub, add, dot, cross, norm } from './util.js';
import { tangentArc, segStart, segEnd } from './geometry.js';
import { filleted, offsetSegs } from './fillet.js';
import { pathLength, pointAlong } from './bands.js';
import { buildCurve } from './curve.js';
import { turn, reverse, pieceLen } from './strokes.js';

export const PITCH_MM = 8;      // the lines' centres apart, by default (Rembrandt.md §3)
export const LINE_MM = 8;       // a line as wide as the brush leaves it (est.)
export const MIN_LINES = 1;
export const MAX_LINES = 40;
export const WAVE_LEN = 100;    // mm, about a wave along the ribbon, as on Test (est.)

const pt = mm => mm / PT_MM;
const num = v => String(Math.round(v * 10) / 10);
// The ribbon across, mm: the outer lines' centres apart, and a line's width.
export const ribbonWidth = (n, pitch = PITCH_MM) => (n - 1) * pitch + LINE_MM;
export const clampLines = n => Math.max(MIN_LINES, Math.min(MAX_LINES, Math.round(n) || MIN_LINES));
// The readout of the width: "96 mm · 12 lines".
export const widthLabel = (n, pitch = PITCH_MM) => `${num(ribbonWidth(n, pitch))} mm · ${n} line${n === 1 ? '' : 's'}`;

// Line k (0 … N−1, from the left of the brush's travel) lies off the centre
// by (k − (N − 1) / 2) · pitch.
export const lineOffset = (k, n, pitch = PITCH_MM) => (k - (n - 1) / 2) * pitch;   // mm, + to the right of travel

// ---------- the wave (Test's Wave, the owner, 2026-10-04) ----------
// The centre waves `amp` mm either side, a whole number of half waves so
// its ends stay where they are, about WAVE_LEN a wave; the lines are offsets
// of the waved centre, so they wave together and stay apart. Laid as biarcs,
// the tangent continuous: the board runs lines and arcs only (strokes.js).
function arcOrLine(p, t, q) {
  if (Math.abs(cross(t, sub(q, p))) < 0.05) return { t: 'L', a: p, b: q };
  const g = tangentArc(p, t, q);
  if (!g) return { t: 'L', a: p, b: q };
  delete g.tangent;
  return g;
}
function biarc(p0, t0, p1, t1) {
  const v = sub(p1, p0), vt = dot(v, add(t0, t1)), c = 2 * (1 - dot(t0, t1)), vv = dot(v, v);
  const d = c < 1e-9 ? vv / (2 * vt) : (-vt + Math.sqrt(vt * vt + c * vv)) / c;
  const q0 = P(p0.x + t0.x * d, p0.y + t0.y * d), q1 = P(p1.x - t1.x * d, p1.y - t1.y * d), j = P((q0.x + q1.x) / 2, (q0.y + q1.y) / 2);
  return [arcOrLine(p0, t0, j), arcOrLine(j, norm(sub(q1, q0)), p1)];
}
export function wavedSegs(segs, ampMm, waveLenMm = WAVE_LEN) {
  const L = pathLength(segs);
  if (!(ampMm > 0) || !(L > 0)) return segs;
  const A = pt(ampMm), m = Math.max(1, Math.round(2 * L / pt(waveLenMm))), n = 4 * m;
  const on = s => { const q = pointAlong(segs, s), w = A * Math.sin(Math.PI * m * s / L); return P(q.x - q.dy * w, q.y + q.dx * w); };
  const dir = s => norm(sub(on(Math.min(L, s + 1e-3)), on(Math.max(0, s - 1e-3))));
  const out = [];
  for (let i = 0; i < n; i++) out.push(...biarc(on(L * i / n), dir(L * i / n), on(L * (i + 1) / n), dir(L * (i + 1) / n)));
  return out;
}

// The ribbon's lines. Every kink of the centre is rounded for the whole
// width, as RUBENS rounds a stroke (fillet.js: radius W/2 + the inner corner
// radius), so the inner line keeps that inner radius and nothing crosses.
// warn: the places where the bend is still too tight for the width — a kink
// with no room for its rounding, or an arc under W/2 — marked "!" on the
// tab; there offsetSegs cuts the inner lines into a sharp point.
// o: { n, pitch, cornerR, wave, waveLen }, mm.
export function ribbonLines(r, o) {
  const { n, pitch = PITCH_MM, cornerR = 10, wave = 0, waveLen = WAVE_LEN } = o;
  if (!r.segs.length) return { centre: [], warn: [], lines: [] };
  const f = filleted({ id: r.id, segs: r.segs, style: { weight: pt(ribbonWidth(n, pitch)) } }, cornerR);
  const centre = wavedSegs(f.segs, wave, waveLen);
  const w = wave > 0 ? filleted({ id: r.id + '~', segs: centre, style: { weight: pt(ribbonWidth(n, pitch)) } }, 0).warn : [];
  const lines = [];
  for (let k = 0; k < n; k++) {
    const off = lineOffset(k, n, pitch);
    lines.push({ k, off, segs: offsetSegs(centre, pt(off)) });
  }
  return { centre, warn: oneMark([...f.warn, ...w]), lines };
}
// Marks closer than 20 mm are one place: a wave's arcs would each leave one.
function oneMark(qs) {
  const out = [];
  for (const q of qs) if (!out.some(o => Math.hypot(o.x - q.x, o.y - q.y) < pt(20))) out.push(q);
  return out;
}

// All the lines of a ribbon end to end, mm.
export const linesLength = L => L.lines.reduce((a, l) => a + pathLength(l.segs), 0) * PT_MM;

// The ribbons by painting order: N1, N2, N3 … (NOLAN.md §1).
export const ribbonName = i => `N${i + 1}`;

// ---------- on the machine ----------
// A point of the document → mm from Here, the canvas's centre: X up, Y right.
export const toMachine = q => ({ x: -q.y * PT_MM, y: q.x * PT_MM });
// A line of segments → Test's pieces: { t: 'L', a, b } or { t: 'A', a, b, c, r, d },
// d = +1 turning from +X towards +Y — clockwise on the screen, as s > 0.
export function toPieces(segs) {
  return segs.map(g => g.t === 'L'
    ? { t: 'L', a: toMachine(g.a), b: toMachine(g.b) }
    : { t: 'A', a: toMachine(segStart(g)), b: toMachine(segEnd(g)), c: toMachine(g.c), r: g.r * PT_MM, d: Math.sign(g.s) || 1 })
    .filter(g => pieceLen(g) > 1e-6);
}
const endDir = g => {
  if (g.t === 'L') { const l = Math.hypot(g.b.x - g.a.x, g.b.y - g.a.y) || 1; return { x: (g.b.x - g.a.x) / l, y: (g.b.y - g.a.y) / l }; }
  return { x: -g.d * (g.b.y - g.c.y) / g.r, y: g.d * (g.b.x - g.c.x) / g.r };
};
// The ribbons as the passes of a run (strokes.js, plotRun), in their order,
// a pause before each after the first. Paint run (ink off): a ribbon is one
// snake — down a line, a turn, up the next, from its first anchor; with
// "Lift at the turns" the brush goes up through them, no flags (NOLAN.md
// §5.2). Watercolour (ink on): every line on its own, one way, a dip in the
// cup before it (§5.1). rows: what each row of the run is — its ribbon, its
// line.
export function ribbonPasses(ribbons, o) {
  const rows = [];
  const passes = ribbons.map((r, i) => {
    const name = ribbonName(i), lines = ribbonLines(r, o).lines.map(l => toPieces(l.segs)).filter(p => p.length);
    const ps = [], path = [];
    lines.forEach((p, k) => {
      rows.push({ ribbon: i, name, line: k + 1, of: lines.length });
      const row = rows.length;
      if (o.ink) { ps.push(p.map(g => ({ ...g, tilt: 0, row }))); return; }
      const q = (k % 2 ? reverse(p) : p).map(g => ({ ...g, tilt: 0, row }));
      if (path.length) {
        const last = path.at(-1), D = { x: q[0].a.x - last.b.x, y: q[0].a.y - last.b.y };
        path.push(...turn(last.b, endDir(last), D).map(g => ({ ...g, tilt: 0, row: row - 1, turn: true })));
      }
      path.push(...q);
    });
    if (path.length) ps.push(path);
    const why = o.ink ? `${name}: its wash in the cup, then CONTINUE` : `${name}: its paint on the canvas — CONTINUE when ${ribbonName(i - 1)} is dry`;
    return { key: name, ps, why };
  }).filter(p => p.ps.length);
  return { passes, rows };
}

// The owner's three ribbons, the tab's default (the owner, 2026-10-04: "I
// would start these three ribbons by default"): his green paths of
// nolan-images/IMG_9424-N1_N2_N3_paths.webp — IMG_9424 at 0.7475, 238 px
// down — in mm on the 500 × 700 canvas, IMG_9424 fitted whole inside it,
// from its top left corner. Lines and arcs as turtle steps (curve.js):
// start, heading (degrees, clockwise), then ['L', mm] or ['R' | 'T',
// radius mm, degrees]. N1 the upper arc, its hook wider than the sketch's so
// 96 mm of lines turn without folding and stay on the canvas; N2 the lower
// loop; N3 the middle ribbon lying over both.
const SKETCH = [
  { at: [107, 318], dir: -88, ops: [['L', 30], ['R', 115, 88], ['L', 25], ['R', 95, 80], ['L', 50], ['T', 50, 230]] },
  { at: [377, 368], dir: 100, ops: [['L', 80], ['R', 70, 100], ['L', 40], ['R', 60, 45]] },
  { at: [62, 342], dir: 95, ops: [['L', 10], ['T', 60, 95], ['L', 40], ['T', 80, 65], ['L', 95]] },
];
export const sketchRibbons = () => SKETCH.map(s => ({
  segs: buildCurve(P(pt(s.at[0] - 250), pt(s.at[1] - 350)), s.dir, s.ops.map(([op, a, b]) => [op, pt(a), b])),
}));
