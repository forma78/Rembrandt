// FORM-G's plan: a finished picture's cells into OPM-N's DRAG SNAKE (the owner, 2026-11-06: "a library of ready paintings"; "the colour we already
// developed, we can take it from OPM-N"; the brush fixed at 5 mm). A picture, app/formg/<id>.json, made by FORM-G/generator, no photo on the page:
//   { id, title, sub, w, h, pitch, image, columns, box: [x0, y0, x1, y1], jars: [{ id, name, code, hex, coats, cells: [{ n, legs: [[x, from y, to y]], air?, cuts? }] }] }
// mm from the canvas's bottom left corner, x right, y up, every leg along y — the machine's X, the only way this brush paints (README, "How to lay a module").
//
// A jar a colour; a cell a run of its legs that follow one another. Every cell as LAB's + idle 6.0: its snake, then at once its idle run, no dip (the owner: "the two passes
// come anyway; I would not divide it into a first pass, then a second"). idleplan.js's rows and strokes.js's plotRun, the very commands of OPM-N: only the cells differ.
//
// The dial's legs (air, cuts): a leg alone, the brush down from the top, a dip at every cut, so the columns' dips lie in rows across the dial: the watch's bands (est., untested).
//
// Two layers (the owner, 2026-11-06: "we make the order of the paints such that somewhere on the second day of work the first layer dries and one can go a second time over it"; "those paints
// that go as the second layer, let them go second in the list"): one list, the run's: every jar once, light to dark, then those that need it, `coats: 2`, in the same order, over the dry first
// layer. A jar there is a line of the list like any other, Start from reaches it on another day. The second time its cell the other way round, so that its dips and its bulbs do not fall on the first's (est.).
import { IDLE, idleLine, idleRowsOf, idleRunsOf } from './idleplan.js';

export const FORMG_LIB = ['porsche', 'watch'];       // the library: a name here, its json and jpg in app/formg/
export const FORMG = { tip: IDLE.tip, over: IDLE.over, every: IDLE.every, lap: IDLE.lap, minLeg: 3, firstDip: 30 };   // LAB's, est.; minLeg as idleplan.js's; firstDip: a dial's leg longer than this starts on a dip of its own (est.)
export const passOf = pitch => pitch * IDLE.pass / IDLE.step;   // the idle run's legs apart: LAB's 4.38 to its 5.83, on this grid (est.)

const lengthOf = pts => pts.slice(1).reduce((t, q, i) => t + Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]), 0);
// the run's list: every jar, then the jars of the second layer again
export const seqOf = pic => [...pic.jars.map(j => ({ ...j, layer: 1 })), ...pic.jars.filter(j => j.coats === 2).map(j => ({ ...j, id: `${j.id}:2`, jar: j.id, name: `${j.name} · layer 2`, layer: 2 }))];
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
// a cell as idleplan.js's byCell has them; the second layer's its legs from the last to the first, each the other way
export function cellOf(c, pic, n, o = {}, layer = 1) {
  const tip = o.tip ?? FORMG.tip, over = o.over ?? FORMG.over, lap = o.lap ?? FORMG.lap;
  const legs = (layer === 2 ? c.legs.slice().reverse().map(([x, a, b]) => [x, b, a]) : c.legs).map(([x, a, b]) => legOf(x, a, b, tip));
  const line = idleLine(idleLegsOf(legs, passOf(pic.pitch)), over, 0), xs = legs.map(l => l[0][0]);
  const first = lengthOf(legs.flat());
  return { num: n, k: legs.length, W: Math.max(...xs) - Math.min(...xs), C: first / legs.length, legs, line, over, end: 0, mm: first + lengthOf(line), ...(c.air ? { runs: airRuns(legs[0], c.cuts, lap) } : {}) };
}
// the run's colours, the list's lines in their order
export function passesOf(pic, o = {}) {
  return seqOf(pic).map(j => {
    const byCell = j.cells.map((c, i) => cellOf(c, pic, i + 1, o, j.layer));
    return { pencil: j.id, layer: j.layer, cells: byCell.length, byCell, tracks: byCell.reduce((a, q) => a + q.k, 0), rows: 0, rays: 0, rubs: 1, idle: true, strokes: [], mm: byCell.reduce((a, q) => a + q.mm, 0) };
  });
}
export const rowsOf = (pic, passes, every = FORMG.every, lap = FORMG.lap) => idleRowsOf(passes, seqOf(pic), { cw: pic.w, ch: pic.h }, every, lap);
export const brushRuns = (passes, every = FORMG.every, lap = FORMG.lap) => idleRunsOf(passes, every, lap);
// where the canvas may lie, its left and bottom edges from home, mm, so that the carriage keeps within the walls: from plotRun's own carriage, run with no Here (the elbow's sweep takes
// the carriage past a leg's end, about 20 mm at the bottom, less than none at the top; the walls press a path silently, so this is what counts)
export function placeRange(pic, carriage, walls) {
  const c = carriage, m = 0.2;
  return { left: [-(pic.w / 2 + c.y0) + m, walls.y.max - walls.y.min - pic.w / 2 - c.y1 - m], bottom: [-(pic.h / 2 + c.x0) + m, walls.x.max - walls.x.min - pic.h / 2 - c.x1 - m] };
}
