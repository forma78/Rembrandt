// OPM-N's DRAG SNAKE by LAB's + idle 6.0 (the owner, 2026-11-05, OPM-N/IMG_2363: "+ IDLE 6.0 is to go into OPM-N's painting
// algorithm"; README, "How to lay a module"). A cell of any shape, by a rubber brush that paints only up and down, along the
// machine's X ("the brush never paints left-right"): a snake of legs along X, cut short by the cell's contour, a dip when the
// brush has gone so far; then at once an idle run, no dip, closer together, its legs out past the ends to catch the bulbs from
// behind. LAB's modules to the letter (test/idleplan.test.js): its nos. 1, 4, 7 and 8, each with a contour half a brush tip out.
//
// The owner's verdict on that sheet, nos. 1 and 4: "+2 mm … at the end not needed, just 0 mm": the idle run +2 at every turn and at its
// start, its last leg ending on the module's end, no tail. Nos. 7 and 8, sides at 45°, +3: "we leave them as they are".
import { insetOf, chordAlong, areaOf } from './opmplan.js';
import { machinePiece } from './inkaplan.js';
import { SWEEP_MM } from './strokes.js';

export const IDLE = {
  step: 5.83, pass: 4.38,      // mm between two legs, the first run's and the idle run's: LAB's 17.5 mm module in 4 tracks and 5 passes, shared out evenly over a cell's width (est.)
  tip: 4,                      // mm, the rubber tip's track on the paper, IMG_2356 (est.): the outer legs half of it in from the contour, and the first run's ends
  over: 2, slant: 3,           // mm past the ends: the idle run, flat ends (0 at its very end), a slanted side (the same at its end), IMG_2363 (est.)
  every: 95, lap: 15,          // mm of line a dip, mm back after a dip in the middle of a leg: LAB's (est.)
};
export const IDLE_STEP_MIN = 2, IDLE_STEP_MAX = 12, IDLE_TIP_MIN = 1, IDLE_TIP_MAX = 12, IDLE_OVER_MAX = 8;
const MIN_LEG = 3;             // mm: a shorter leg is left out, too short to land on (unless the corners took so many that the cell's legs are laid again, legsAcross)
const NEAR = 1e-6;

const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const lengthOf = pts => pts.slice(1).reduce((t, q, i) => t + dist(pts[i], q), 0);
const toward = (a, b, s) => { const d = dist(a, b) || 1; return [a[0] + (b[0] - a[0]) / d * s, a[1] + (b[1] - a[1]) / d * s]; };
const piecesOf = pts => pts.slice(1).map((b, i) => ({ t: 'L', a: pts[i], b }));
function pointAt(pts, s) {
  let left = s;
  for (let i = 1; i < pts.length; i++) {
    const d = dist(pts[i - 1], pts[i]);
    if (left <= d) return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * (d ? left / d : 0), pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * (d ? left / d : 0)];
    left -= d;
  }
  return pts.at(-1);
}
function sliceLine(pts, s0, s1) {
  const out = [pointAt(pts, s0)];
  let t = 0;
  for (let i = 1; i < pts.length; i++) { t += dist(pts[i - 1], pts[i]); if (t > s0 + NEAR && t < s1 - NEAR) out.push(pts[i]); }
  out.push(pointAt(pts, s1));
  return out;
}
// the legs over a polygon, along plan y (the machine's X): as many as fit `step` apart, evenly from its left edge to its right, top first, then every other one
// bottom first; a leg under MIN_LEG, at a sharp corner, left out; a polygon under half a step wide one, in its middle; plan x, y, the machine's Y, X (band.js, toMachine).
// margin: so far in from its left and right edges, where the polygon itself could not be inset (a thin row).
// A small pointed cell (the owner, 2026-11-06, "you can fix the legs"): evenly from edge to edge its outer legs stand in its corners, with no length, and it was painted by
// the step between them, or by one short leg alone. So when the corners take legs and fewer than three stay, as many legs stand each in the middle of its own equal
// strip of the cell's width, short ones too: inside a run they are no landing. Cells that keep three or more, LAB's modules among them, are laid as they were.
function legsAcross(Q, step, margin = 0) {
  const xs = Q.map(q => q[0]), ys = Q.map(q => q[1]), xa = Math.min(...xs), xb = Math.max(...xs), room = xb - xa - 2 * margin, x0 = room >= 0 ? xa + margin : (xa + xb) / 2, x1 = room >= 0 ? xb - margin : x0, D = x1 - x0, gaps = Math.round(D / step), mid = (Math.min(...ys) + Math.max(...ys)) / 2;
  const legAt = x => { const c = chordAlong(Q, [Math.max(xa + NEAR, Math.min(xb - NEAR, x)), mid], [0, -1]); return c ? [[x, c[0][1]], [x, c[1][1]]] : null; };
  const all = Array.from({ length: gaps + 1 }, (_, j) => legAt(gaps ? x0 + j * D / gaps : x0 + D / 2)).filter(Boolean);
  const long = all.filter(l => dist(l[0], l[1]) >= MIN_LEG);
  const legs = all.length > long.length && long.length < 3 ? Array.from({ length: gaps + 1 }, (_, j) => legAt(x0 + (j + .5) * D / (gaps + 1))).filter(Boolean) : long.length ? long : all;
  return legs.map((l, i) => i % 2 ? [l[1], l[0]] : l);
}
// a side that cuts the legs at a slant, nearer to LAB's 45° than to flat or along them
export const slantedOf = P => P.some((a, i) => {
  const b = P[(i + 1) % P.length], dx = Math.abs(b[0] - a[0]), dy = Math.abs(b[1] - a[1]), deg = Math.atan2(dy, dx) * 180 / Math.PI;
  return Math.hypot(dx, dy) >= MIN_LEG && deg > 22.5 && deg < 67.5;
});
// the idle run's line: every leg longer by over at both ends, the last only by end at its own
export function idleLine(legs, over, end) {
  return legs.flatMap(([a, b], i) => [toward(a, b, -over), toward(b, a, -(i === legs.length - 1 ? end : over))]);
}
// a cell: { k, W (across), C (a leg's mean length), legs: [[start, end]], line (the idle run's points), over, end, strokes: [first run's pieces, idle run's], mm }
export function idleCellOf(C, o = {}) {
  const P = C.poly, tip = o.tip ?? IDLE.tip, slant = slantedOf(P), over = slant ? o.slant ?? IDLE.slant : o.over ?? IDLE.over, end = slant ? over : 0;
  const Q = insetOf(P, tip / 2) ?? insetOf(P.slice().reverse(), tip / 2);
  const trim = l => Q ? l : ((t => [toward(l[0], l[1], t), toward(l[1], l[0], t)])(Math.max(0, Math.min(tip / 2, (dist(l[0], l[1]) - MIN_LEG) / 2))));   // no room for the inset: its one or two legs in from the ends all the same
  const across = s => legsAcross(Q ?? P, s, Q ? 0 : tip / 2).map(trim), legs = across(o.step ?? IDLE.step);
  if (!legs.length) return null;
  const passes = across(o.pass ?? IDLE.pass), line = idleLine(passes.length ? passes : legs, over, end), pts = legs.flat();
  const xs = P.map(q => q[0]), W = Math.max(...xs) - Math.min(...xs), first = lengthOf(pts), idle = lengthOf(line);
  return { k: legs.length, W, C: legs.reduce((a, l) => a + dist(l[0], l[1]), 0) / legs.length, legs, line, over, end, first, strokes: [piecesOf(pts), piecesOf(line)], mm: first + idle };
}
// as cellDragsOf: a colour after another in the run's order, in a colour its cells by their numbers
export function idleDragsOf(cells, order, o = {}) {
  const passes = [];
  for (const pc of order) {
    const list = cells.map((C, i) => [C, i]).filter(([C]) => C.num && C.pencil === pc).sort((x, y) => x[0].num - y[0].num), strokes = [], byCell = [];
    let tracks = 0, rows = 0, rays = 0, mm = 0;
    for (const [C, i] of list) {
      const t = idleCellOf(C, o);
      if (!t) continue;
      byCell.push({ i, num: C.num, k: t.k, W: t.W, C: t.C, mm: t.mm, from: strokes.length, to: strokes.length + t.strokes.length, legs: t.legs, line: t.line, over: t.over, end: t.end });
      strokes.push(...t.strokes); tracks += t.k; mm += t.mm;
      if (C.ray >= 0) rays += t.strokes.length; else rows += t.strokes.length;
    }
    if (strokes.length) passes.push({ pencil: pc, strokes, cells: byCell.length, byCell, tracks, rows, rays, rubs: 1, mm, idle: true });
  }
  return passes;
}
// a first run cut for its dips. Short legs (LAB's nos. 4, 7, 8): whole legs, as many as go into `every`, each run pressed to its last leg's end, its lift beyond.
// Long ones (its no. 1): `every` mm a run at most, a leg and the lap, as OPM-N's dragRowsOf and LAB's snakeRuns, the next from the lap back; the last alone with its lift beyond.
function runsOfCell(legs, every, lap) {
  const pts = legs.flat();
  if (!every) return [{ pts, beyond: true }];
  const longest = Math.max(...legs.map(l => dist(l[0], l[1])));
  if (longest <= every / 2) {
    const out = [[]];
    let len = 0;
    for (const [a, b] of legs) {
      const run = out.at(-1), step = run.length ? dist(run.at(-1), a) : 0, leg = dist(a, b);
      if (run.length && len + step + leg > every) { out.push([a, b]); len = leg; } else { run.push(a, b); len += step + leg; }
    }
    return out.map(p => ({ pts: p, beyond: true }));
  }
  const most = Math.min(every, longest + lap), all = lengthOf(pts), back = Math.min(lap, most / 2), out = [];
  for (let from = 0, done = 0; ;) {
    const room = most - (done - from);
    if (all - done - Math.max(0, room) <= most / 4) { out.push({ pts: sliceLine(pts, from, all), beyond: true }); return out; }
    done += room; out.push({ pts: sliceLine(pts, from, done), beyond: false }); from = done - back;
  }
}
// the brush's runs in their order, for the machine and for ▶ Play Drag Snake: every `every` mm of line a dip, a colour's first always, so a small cell does not
// take a brush's load of its own; the others go on what the brush holds, the idle ones on none of it. → [{ pass, num, pts, say, dip, idle, beyond }]
export function idleRunsOf(passes, every = 0, lap = 0) {
  const out = [];
  passes.forEach((P, k) => {
    let held = 0, fresh = true;
    for (const c of P.byCell) {
      const runs = c.runs ?? runsOfCell(c.legs, every, lap);                         // FORM-G's dial brings its own: its dips in rows, formgplan.js
      runs.forEach((r, j) => {
        const L = lengthOf(r.pts), dip = fresh || !!r.dip || (every > 0 && held + L > every + 0.5);
        held = dip ? L : held + L; fresh = false;
        out.push({ pass: k, num: c.num, pts: r.pts, say: runs.length > 1 ? `run ${j + 1}/${runs.length}` : 'its run', dip, idle: false, beyond: r.beyond });
      });
      out.push({ pass: k, num: c.num, pts: c.line, say: 'idle, no dip', dip: false, idle: true, beyond: true });
    }
  });
  return out;
}
// the rows for strokes.js's plotRun, as dragRowsOf's: a run a row, sweep on its first piece for plotRun's landing and lift, nodip where it goes on what the brush holds
// runs: the brush's runs already laid (OPM-G's, the canon's landing inside, formgplan.js), else idleRunsOf's
export function idleRowsOf(passes, pencils, o, every = 0, lap = 0, runs = null) {
  const ps = [], info = [], groups = passes.map(() => []), byId = Object.fromEntries(pencils.map(p => [p.id, p]));
  for (const r of runs ?? idleRunsOf(passes, every, lap)) {
    const row = ps.length + 1, P = passes[r.pass];
    ps.push(piecesOf(r.pts).map((g, i) => ({ ...machinePiece(g, o), tilt: 0, row, ...(i ? {} : { sweep: SWEEP_MM, beyond: r.beyond, nodip: !r.dip }) })));
    info.push({ label: `${r.pass + 1}/${passes.length} · ${byId[P.pencil]?.name ?? P.pencil} · cell ${r.num} · ${r.say}`, pencil: P.pencil, pass: r.pass, L: lengthOf(r.pts), cells: [[r.num, 0]] });
    groups[r.pass].push(ps.length - 1);
  }
  return { ps, info, lifts: Math.max(0, ps.length - passes.length), groups };
}
