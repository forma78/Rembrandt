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
//
// OPM-G (the owner, 2026-11-07: "start with g-wagon.JPG, on a 60 x 60 canvas, with the new data of LAB / real 2"): FORM-G's page with its own library, app/opmg/, and its run by
// the canon of a long leg (canon.js, README "How a long leg is laid"): a dip's run lands inside its first leg and goes back to its start; short end legs off a cell on their own;
// legs under 30 mm on what a longer one leaves, to 79 mm of plan. FORM-G's own run as it was.
import { IDLE, idleLine, idleRowsOf, idleRunsOf } from './idleplan.js';
import { CANON, startOnLong, ridersOnLong, landInside } from './canon.js';

export const FORMG_LIB = ['porsche', 'watch'];       // the library: a name here, its json and jpg in app/formg/
export const OPMG_LIB = ['gwagon'];                  // OPM-G's: its json and jpg in app/opmg/
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
// a jar's cells by the canon (OPM-G): the second layer's every cell the other way round first, then a short end leg it cannot start on off on its own; every cell cut for its
// dips by `every`, on from `lap` back; the short ones after the long ones with room for them. Numbered in the run's order, as BACK ONE CELL and the LCD count them.
export function canonCellsOf(pic, jar, o = {}, layer = 1) {
  const every = o.every ?? FORMG.every, lap = o.lap ?? FORMG.lap, ride = o.ride ?? CANON.ride;
  const raw = layer === 2 ? jar.cells.map(c => c.air ? c : { ...c, legs: c.legs.slice().reverse().map(([x, a, b]) => [x, b, a]) }) : jar.cells;
  const cells = raw.flatMap(c => c.air ? [c] : startOnLong(c)).map((c, i) => cellOf(c, pic, i + 1, o));
  const cut = cells.map(c => c.runs ? c : { ...c, runs: idleRunsOf([{ byCell: [c] }], every, lap).filter(r => !r.idle).map((r, j) => ({ pts: r.pts, dip: j > 0, beyond: r.beyond })) });
  return ridersOnLong(cut, ride).map((c, i) => ({ ...c, num: i + 1 }));
}
// the run's colours, the list's lines in their order; o.canon: OPM-G's
export function passesOf(pic, o = {}) {
  return seqOf(pic).map(j => {
    const byCell = o.canon ? canonCellsOf(pic, j, o, j.layer) : j.cells.map((c, i) => cellOf(c, pic, i + 1, o, j.layer));
    return { pencil: j.id, layer: j.layer, cells: byCell.length, byCell, tracks: byCell.reduce((a, q) => a + q.k, 0), rows: 0, rays: 0, rubs: 1, idle: true, strokes: [], mm: byCell.reduce((a, q) => a + q.mm, 0) };
  });
}
// F, the frame (the owner, 2026-11-08: "back to the Porsche: test a 20 × 20 cm piece, how many paints mix"; "in OPM-W's Tools, frame [ F ] cuts a piece out, it can be carried
// into FORM-G"): a rectangle on the picture, mm from the canvas's bottom left corner as the legs, and only what lies in it is run, at its place from home — the small canvas laid there.
// A column in it when its whole track is (the edges on the pitch fall between columns); a leg cut at the frame's top and bottom, what is left under minLeg there not painted;
// a cell broken where a leg falls out, so no step crosses the gap; a jar with nothing in it out of the list. Its coats as they were: the second layer's jars still last.
export const cleanFrame = (f, pitch = 5) => f && [f.x0, f.y0, f.x1, f.y1].every(Number.isFinite) && f.x1 - f.x0 >= pitch && f.y1 - f.y0 >= pitch ? { x0: f.x0, y0: f.y0, x1: f.x1, y1: f.y1 } : null;
export function framedPic(pic, F) {
  F = cleanFrame(F, pic.pitch);
  if (!F) return pic;
  const half = pic.pitch / 2, e = 1e-6, inX = x => x - half >= F.x0 - e && x + half <= F.x1 + e;
  const clip = ([x, a, b]) => {
    const lo = Math.max(Math.min(a, b), F.y0), hi = Math.min(Math.max(a, b), F.y1), cut = lo > Math.min(a, b) + e || hi < Math.max(a, b) - e;
    if (!inX(x) || hi <= lo || (cut && hi - lo < FORMG.minLeg)) return null;
    return b >= a ? [x, lo, hi] : [x, hi, lo];
  };
  const jars = pic.jars.map(j => {
    const cells = [];
    for (const c of j.cells) {
      let run = [];
      const flush = () => { if (run.length) cells.push({ ...c, legs: run, ...(c.cuts ? { cuts: c.cuts.filter(y => y > F.y0 && y < F.y1) } : {}) }); run = []; };
      for (const l of c.legs) { const k = clip(l); if (k) run.push(k); else flush(); }
      flush();
    }
    return { ...j, cells: cells.map((c, i) => ({ ...c, n: i + 1 })) };
  }).filter(j => j.cells.length);
  return { ...pic, jars, frame: F };
}
// OPM-G's runs: what the brush holds counted to the canon's 79 mm (the cells' own dips already in their runs), every run after a dip landing inside
export const canonRuns = (passes, lap = FORMG.lap, ride = CANON.ride) => idleRunsOf(passes, ride, lap).map(r => r.idle || !r.dip ? r : { ...r, pts: landInside(r.pts, true) });
export const rowsOf = (pic, passes, every = FORMG.every, lap = FORMG.lap, canon = false) => idleRowsOf(passes, seqOf(pic), { cw: pic.w, ch: pic.h }, every, lap, canon ? canonRuns(passes, lap) : null);
export const brushRuns = (passes, every = FORMG.every, lap = FORMG.lap, canon = false) => canon ? canonRuns(passes, lap) : idleRunsOf(passes, every, lap);
// where the canvas may lie, its left and bottom edges from home, mm, so that the carriage keeps within the walls: from plotRun's own carriage, run with no Here (the elbow's sweep takes
// the carriage past a leg's end, about 20 mm at the bottom, less than none at the top; the walls press a path silently, so this is what counts)
export function placeRange(pic, carriage, walls) {
  const c = carriage, m = 0.2;
  return { left: [-(pic.w / 2 + c.y0) + m, walls.y.max - walls.y.min - pic.w / 2 - c.y1 - m], bottom: [-(pic.h / 2 + c.x0) + m, walls.x.max - walls.x.min - pic.h / 2 - c.x1 - m] };
}
