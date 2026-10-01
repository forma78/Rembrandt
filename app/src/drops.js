// The drop plan (Rembrandt.md §5): where each drop goes, from which tube, in
// what order, and the ml per tube. A drop lies across the lines at the home
// of the runs it feeds — neighbouring lines of one tube whose homes lie close,
// as many as one drop is long. A group that needs more than one standard drop
// gets them spaced along its shortest run, so the brush picks up fresh paint
// on the way ("along the band they are spaced by need"). Every ml is est.
// No DOM.

import { PT_MM } from './config.js';
import { dist } from './util.js';
import { pointAlong } from './bands.js';
import { mlFor } from './adjust.js';

// The point d (pt) from a run's home.
export const fromHome = (r, d) => pointAlong(r.segs, r.home === 'start' ? Math.min(d, r.len) : Math.max(0, r.len - d));
const middle = d => d.points[Math.floor(d.points.length / 2)];

// runs: from paintLanes (bands.js); paint: adjust.js; pitch and near in pt.
export function dropPlan(runs, paint, { pitch, near, lightness }) {
  const across = Math.max(1, Math.floor(paint.dropLen / (pitch * PT_MM)));   // lines one drop feeds
  const groups = [];
  const sorted = [...runs].sort((a, b) => a.tube.localeCompare(b.tube) || a.side.localeCompare(b.side) || a.k - b.k || a.s0 - b.s0);
  for (const r of sorted) {
    const h = fromHome(r, 0);
    const g = groups.find(g => g.tube === r.tube && g.side === r.side && g.lastK === r.k - 1 && g.runs.length < across && dist(g.lastHome, h) <= near);
    if (g) { g.runs.push(r); g.lastK = r.k; g.lastHome = h; }
    else groups.push({ tube: r.tube, side: r.side, runs: [r], lastK: r.k, lastHome: h });
  }
  const drops = [];
  for (const g of groups) {
    const need = g.runs.reduce((a, r) => a + mlFor(r.len * PT_MM, paint), 0);
    const n = Math.max(1, Math.ceil(need / paint.dropMl - 1e-9));
    const short = Math.min(...g.runs.map(r => r.len));
    for (let j = 0; j < n; j++) {
      const points = g.runs.map(r => fromHome(r, short * j / n)), q = points[0];
      // a drop is a straight bead across the lines: from the first home to the
      // last; across a single line, as wide as the line
      const a = points.length > 1 ? points[0] : { x: q.x + q.dy * pitch / 2, y: q.y - q.dx * pitch / 2 };
      const b = points.length > 1 ? points[points.length - 1] : { x: q.x - q.dy * pitch / 2, y: q.y + q.dx * pitch / 2 };
      drops.push({ tube: g.tube, side: g.side, lines: g.runs.length, need: need / n, points, a, b });
    }
  }
  // one tube at a time, the lighter first (§5); within a tube, the nearest drop next
  const tubes = [...new Set(drops.map(d => d.tube))].sort((a, b) => lightness(b) - lightness(a));
  const ordered = []; let last = null;
  for (const t of tubes) {
    const left = drops.filter(d => d.tube === t);
    while (left.length) {
      let bi = 0, bd = Infinity;
      if (last) left.forEach((d, i) => { const dd = dist(middle(d), last); if (dd < bd) { bd = dd; bi = i; } });
      const d = left.splice(bi, 1)[0]; ordered.push(d); last = middle(d);
    }
  }
  // what is squeezed: whole standard drops
  const byTube = tubes.map(id => { const n = ordered.filter(d => d.tube === id).length; return { id, drops: n, ml: n * paint.dropMl }; });
  return { drops: ordered, byTube, total: { drops: ordered.length, ml: ordered.length * paint.dropMl } };
}
