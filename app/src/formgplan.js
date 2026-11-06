// FORM-G's plan: a finished picture's cells into OPM-N's DRAG SNAKE (the owner, 2026-11-06: "a library of ready paintings"; "the colour we already
// developed, we can take it from OPM-N"; the brush fixed at 5 mm). A picture, app/formg/<id>.json, made by FORM-G/generator, no photo on the page:
//   { id, title, sub, w, h, pitch, image, columns, box: [x0, y0, x1, y1], jars: [{ id, name, code, hex, cells: [{ n, legs: [[x, from y, to y]], part?, air?, cuts? }] }] }
// mm from the canvas's bottom left corner, x right, y up, every leg along y — the machine's X, the only way this brush paints (README, "How to lay a module").
//
// A jar a colour; a cell a run of its legs that follow one another. Every cell as LAB's + idle 6.0: its snake, then at once its idle run, no dip (the owner: "the two passes
// come anyway; I would not divide it into a first pass, then a second"). idleplan.js's rows and strokes.js's plotRun, the very commands of OPM-N: only the cells differ.
//
// The dial's legs (air, cuts): a leg alone, the brush down from the top, a dip at every cut, so the columns' dips lie in rows across the dial: the watch's bands (est., untested).
//
// A picture past the machine's reach: part 2, the canvas turned 180° by hand into the same place (LOOM's halves, the owner's, 2026-10-16), p ↦ (w − x, h − y). A cell goes whole to one
// part, so no seam crosses a leg; the screen and the machine see the canvas as it lies then.
import { IDLE, idleLine, idleRowsOf, idleRunsOf } from './idleplan.js';

export const FORMG_LIB = ['porsche', 'watch'];       // the library: a name here, its json and jpg in app/formg/
export const FORMG = { tip: IDLE.tip, over: IDLE.over, every: IDLE.every, lap: IDLE.lap, minLeg: 3, firstDip: 30 };   // LAB's, est.; minLeg as idleplan.js's; firstDip: a dial's leg longer than this starts on a dip of its own (est.)
export const passOf = pitch => pitch * IDLE.pass / IDLE.step;   // the idle run's legs apart: LAB's 4.38 to its 5.83, on this grid (est.)

const lengthOf = pts => pts.slice(1).reduce((t, q, i) => t + Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]), 0);
export const partsOf = pic => pic.jars.some(j => j.cells.some(c => c.part === 2)) ? [1, 2] : [1];
const turned = (pic, part) => part === 2 ? { x: v => pic.w - v, y: v => pic.h - v } : { x: v => v, y: v => v };
// a leg's points: half the tip in from both ends of its span, as idleCellOf; too short for that, the shortest it can land on, in the middle of its span
function legOf(x, a, b, tip) {
  const d = b >= a ? 1 : -1, L = Math.abs(b - a), m = FORMG.minLeg;
  if (L < m) { const c = (a + b) / 2; return [[x, c - d * m / 2], [x, c + d * m / 2]]; }
  const t = Math.min(tip / 2, (L - m) / 2);
  return [[x, a + d * t], [x, b - d * t]];
}
// the idle run's legs, as idleCellOf's: evenly over the cell's width, the pass apart, each as long as the column it lies nearest, back and forth
export function idleLegsOf(legs, pass) {
  if (legs.length < 2) return legs;
  const xa = legs[0][0][0], xb = legs.at(-1)[0][0], gaps = Math.max(1, Math.round(Math.abs(xb - xa) / pass)), up = legs[0][1][1] >= legs[0][0][1], out = [];
  for (let j = 0; j <= gaps; j++) {
    const x = xa + (xb - xa) * j / gaps, near = legs.reduce((p, q) => Math.abs(q[0][0] - x) < Math.abs(p[0][0] - x) ? q : p), lo = Math.min(near[0][1], near[1][1]), hi = Math.max(near[0][1], near[1][1]);
    out.push((j % 2 === 0) === up ? [[x, lo], [x, hi]] : [[x, hi], [x, lo]]);
  }
  return out;
}
// a dial's leg in its runs: to every cut, a dip there and on from the lap back (README, "the brush lands and lifts on the move"), the last with its lift beyond
export function airRuns(leg, cuts, lap, firstDip = FORMG.firstDip) {
  const x = leg[0][0], a = leg[0][1], b = leg[1][1], d = b >= a ? 1 : -1, on = cuts.filter(c => (c - a) * d > 0 && (b - c) * d > 0).sort((p, q) => (p - q) * d), out = [];
  let from = a;
  on.forEach((c, i) => { out.push({ pts: [[x, from], [x, c]], dip: i > 0 || Math.abs(c - a) > firstDip, beyond: false }); from = (c - a) * d > lap ? c - d * lap : a; });
  out.push({ pts: [[x, from], [x, b]], dip: on.length > 0 || Math.abs(b - a) > firstDip, beyond: true });
  return out;
}
// a cell as idleplan.js's byCell has them
export function cellOf(c, pic, part, n, o = {}) {
  const T = turned(pic, part), tip = o.tip ?? FORMG.tip, over = o.over ?? FORMG.over, lap = o.lap ?? FORMG.lap;
  const legs = c.legs.map(([x, a, b]) => legOf(T.x(x), T.y(a), T.y(b), tip));
  const line = idleLine(idleLegsOf(legs, passOf(pic.pitch)), over, 0), xs = legs.map(l => l[0][0]);
  const first = lengthOf(legs.flat());
  return { num: n, k: legs.length, W: Math.max(...xs) - Math.min(...xs), C: first / legs.length, legs, line, over, end: 0, mm: first + lengthOf(line), ...(c.air ? { runs: airRuns(legs[0], c.cuts.map(T.y), lap) } : {}) };
}
// the run's colours, a jar after another, light to dark as the picture's file has them, only those with cells in this part
export function passesOf(pic, part = 1, o = {}) {
  const out = [];
  for (const j of pic.jars) {
    const cells = j.cells.filter(c => (c.part ?? 1) === part);
    if (!cells.length) continue;
    const byCell = cells.map((c, i) => cellOf(c, pic, part, i + 1, o));
    out.push({ pencil: j.id, cells: byCell.length, byCell, tracks: byCell.reduce((a, q) => a + q.k, 0), rows: 0, rays: 0, rubs: 1, idle: true, strokes: [], mm: byCell.reduce((a, q) => a + q.mm, 0) });
  }
  return out;
}
export const rowsOf = (pic, passes, every = FORMG.every, lap = FORMG.lap) => idleRowsOf(passes, pic.jars, { cw: pic.w, ch: pic.h }, every, lap);
export const brushRuns = (passes, every = FORMG.every, lap = FORMG.lap) => idleRunsOf(passes, every, lap);
// what a canvas placement may be for this part, so that the brush keeps within the walls: its left and bottom edges from home, mm
// (along X the carriage runs on past a leg's end to land and lift, about 19 mm on a plotRun of these, est.; along Y it keeps to the legs)
export function placeRange(pic, part, walls, pastX = 20, pastY = 1) {
  const T = turned(pic, part), b = [];
  for (const j of pic.jars) for (const c of j.cells) if ((c.part ?? 1) === part) for (const [x, p, q] of c.legs) b.push([T.x(x), T.y(p)], [T.x(x), T.y(q)]);
  const xs = b.map(q => q[0]), ys = b.map(q => q[1]);
  return { left: [walls.y.min - Math.min(...xs) + pastY, walls.y.max - Math.max(...xs) - pastY], bottom: [walls.x.min - Math.min(...ys) + pastX, walls.x.max - Math.max(...ys) - pastX] };
}
