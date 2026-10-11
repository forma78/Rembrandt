// CCD's plan — after Carlos Cruz-Diez, not the camera's chip (the owner,
// 2026-10-11, Cruz-Diez/: "no trace, no marks — I just squeeze the paint at
// the bottom and the brush drives it from the bottom up. Evenly"). Rectangles
// of straight lanes, each a free-transform box on the canvas: its place and
// size, its direction — Vertical, every lane from its bottom edge up;
// Horizontal, from its left edge to the right — and its lanes, 1 … 218 ("not
// 18 at most, but all 218"). A lane is one run of the dry brush, one way,
// from the edge the paint lies along to the far one: the brush lands in the
// paint, lifts past the far edge and flies back. No TRACE, no MARKS, no dip.
//
// A rectangle's mm: from the canvas's bottom left corner, x right, y up, as a
// ruler reads them (Left, Bottom, Width, Height). The runs for the machine
// from the canvas's centre (toMachine). Lines only. No DOM.

import { toMachine } from './band.js';
import { pieceLen } from './strokes.js';

export const LANES_MAX = 218;       // the owner, 2026-10-11
export const LANES_NEW = 40;        // a new rectangle's, Claude's
export const OFF = 60;              // mm: how far past the canvas's edge a rectangle may reach
export const MIN_SIDE = 1;          // mm
export const DIRS = ['up', 'right'];
export const DIR_NAME = { up: 'vertical, bottom to top', right: 'horizontal, left to right' };
export const EDGE_NAME = { up: 'bottom', right: 'left' };      // where the paint is squeezed
export const SIDE_NAME = { up: 'left to right', right: 'bottom to top' };   // the flat brush's wide side, across the run

const fin = Number.isFinite;
// a rectangle as it may be kept: whatever is wrong in it put right, or null
export function cleanRect(r) {
  if (!r || ![r.x, r.y, r.w, r.h].every(fin)) return null;
  const w = Math.max(MIN_SIDE, r.w), h = Math.max(MIN_SIDE, r.h);
  return { x: r.x, y: r.y, w, h, dir: r.dir === 'right' ? 'right' : 'up', lanes: fin(r.lanes) ? Math.round(Math.max(1, Math.min(LANES_MAX, r.lanes))) : LANES_NEW };
}

// across: the side the lanes are laid across (the width of a vertical one); along: the side they run
export const acrossOf = r => r.dir === 'right' ? r.h : r.w;
export const alongOf = r => r.dir === 'right' ? r.w : r.h;
// Lane centre to lane centre: the outer lanes' brush edges on the rectangle's
// sides, as ALU's; a brush as wide as the rectangle or wider, every lane on its middle
export function pitchOf(r, brush) { return r.lanes > 1 ? Math.max(0, acrossOf(r) - brush) / (r.lanes - 1) : 0; }
// the white between two neighbouring lanes (> 0), or how far they overlap (< 0)
export const gapOf = (r, brush) => r.lanes > 1 ? pitchOf(r, brush) - brush : 0;

// The lanes: [{ n, a, b }] canvas mm, lane 1 the left one (vertical) or the
// bottom one (horizontal), as they run; a `before` mm outside the paint's
// edge, b `past` mm past the far one
export function lanesOf(r, o) {
  const A = acrossOf(r), p = pitchOf(r, o.brush), mid = r.lanes === 1 || A <= o.brush, before = o.before || 0, past = o.past || 0, out = [];
  for (let i = 0; i < r.lanes; i++) {
    const d = mid ? A / 2 : o.brush / 2 + i * p;
    out.push(r.dir === 'right'
      ? { n: i + 1, a: [r.x - before, r.y + d], b: [r.x + r.w + past, r.y + d] }
      : { n: i + 1, a: [r.x + d, r.y - before], b: [r.x + d, r.y + r.h + past] });
  }
  return out;
}

// The plan: every rectangle with its lanes, in the order they run
export function planOf(rects, o) {
  const out = rects.map((r, i) => ({ ...r, i, runs: lanesOf(r, o), pitch: pitchOf(r, o.brush), gap: gapOf(r, o.brush) }));
  const runs = out.reduce((a, r) => a + r.runs.length, 0), length = out.reduce((a, r) => a + r.runs.length * (alongOf(r) + (o.before || 0) + (o.past || 0)), 0);
  return { rects: out, runs, length };
}

// DRAG's rows for plotRun, mm from the canvas's centre, in one of two ways
// (the owner, 2026-10-11: "two DRAG keys — the snake and through the air"):
// in the air, a row a lane, one way, the brush lifting at the far edge and
// flying back; the snake (o.snake), a rectangle one row, its lanes back and
// forth with the brush down, a step across at each end — stopsAt the lanes'
// ends, so a PAUSE falls there, never on a lane, as ALU's snake. A stop
// before every next rectangle — the brush wiped, its paint squeezed along
// its edge, the flat brush turned when the direction turns
export const stopWhy = (r, prev) => `Rectangle ${r.i + 1}, ${DIR_NAME[r.dir]}: wipe the brush${prev && prev.dir !== r.dir ? `, turn the flat brush — its wide side ${SIDE_NAME[r.dir]}` : ''}, squeeze its paint along its ${EDGE_NAME[r.dir]} edge, then Continue`;
export function dragRows(pl, o) {
  const ps = [], info = [], stops = [], at = q => toMachine([q[0] - o.cw / 2, o.ch / 2 - q[1]]);
  let length = 0, prev = null;
  for (const r of pl.rects) {
    if (!r.runs.length) continue;
    if (ps.length) stops.push({ at: ps.length, why: stopWhy(r, prev) });
    if (o.snake) {
      const pieces = [], stopsAt = [], row = ps.length + 1, n = r.runs.length;
      let acc = 0, end = null;
      r.runs.forEach((ln, j) => {
        const [a, b] = j % 2 ? [ln.b, ln.a] : [ln.a, ln.b];
        for (const [p, q] of [[end, a], [a, b]]) {
          if (!p || Math.hypot(q[0] - p[0], q[1] - p[1]) < 1e-6) continue;          // no step across when the lanes lie on one line
          const g = { t: 'L', a: at(p), b: at(q) }; pieces.push(g); acc += pieceLen(g);
        }
        if (j < n - 1) stopsAt.push(acc);
        end = b;
      });
      ps.push(pieces.map((g, i) => ({ ...g, tilt: 0, row, ...(!i && stopsAt.length ? { stopsAt } : {}) })));
      info.push({ label: `Rectangle ${r.i + 1} · ${n > 1 ? `${n} lanes, the snake` : 'one lane'}`, ri: r.i, L: acc });
      length += acc; prev = r;
      continue;
    }
    for (const ln of r.runs) {
      const g = { t: 'L', a: at(ln.a), b: at(ln.b) }, L = pieceLen(g), row = ps.length + 1;
      ps.push([{ ...g, tilt: 0, row }]);
      info.push({ label: `Rectangle ${r.i + 1} · lane ${ln.n} of ${r.runs.length}`, ri: r.i, L });
      length += L;
    }
    prev = r;
  }
  return { ps, info, stops, runs: ps.length, length };
}
// DRAG's rows as plotRun's passes: a pass a rectangle, its why the stop's,
// so plotRun lays a pause block before it — none before the first
export function dragPasses(R) {
  const cuts = [0, ...R.stops.map(q => q.at), R.ps.length];
  return cuts.slice(0, -1).map((a, k) => ({ key: 'DRAG', ps: R.ps.slice(a, cuts[k + 1]), why: k ? R.stops[k - 1].why : null })).filter(q => q.ps.length);
}

// The lanes as an SVG in canvas mm, y down, origin top left, as ALU's files:
// a <path> a lane in running order
const f2 = v => (Math.round(v * 100) / 100).toString();
export function dragSvg(pl, o) {
  const y = v => o.ch - v, rows = pl.rects.flatMap(r => r.runs.map(ln => `  <path d="M${f2(ln.a[0])} ${f2(y(ln.a[1]))} L${f2(ln.b[0])} ${f2(y(ln.b[1]))}" data-rect="${r.i + 1}" data-lane="${ln.n}" data-dir="${r.dir}"/>`));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<!-- Rembrandt CCD · drag · canvas ${o.cw}x${o.ch} mm, y down, origin top left. Each <path> is one brush-down lane, in running order. -->\n<svg xmlns="http://www.w3.org/2000/svg" width="${o.cw}mm" height="${o.ch}mm" viewBox="0 0 ${o.cw} ${o.ch}">\n<g id="drag" data-ink="none" data-brush-mm="${o.brush}" fill="none" stroke="#24221F" stroke-width="1">\n${rows.join('\n')}\n</g>\n</svg>\n`;
}
