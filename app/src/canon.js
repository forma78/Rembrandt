// The canon of a long leg, README's "How a long leg is laid" — no. 9 (the owner, 2026-11-06: "I would start from this and take it as the canon").
// LAB's real strokes 2 laid it four times on canvas the night of 2026-11-06/07 (OPM-G/IMG_2435 … IMG_2486): the long legs, 48 … 174 mm, came out clean
// and alike in all four copies. LAB's sheets 14 and 15 and OPM-G's run take it from here.
//
//   * a dip's run lands inside its first leg, 16 mm along it (0.6 of a shorter one), pressed back to the leg's start, then along it;
//     a rope of short legs (a car's rim) lands inside its own line the same way, back along it to its start;
//   * a cell of several legs starts on its longer end; short end legs it cannot start on go on their own (startOnLong);
//   * legs under 30 mm go on what a longer one leaves, to 79 mm of plan, each after the one with the most room (ridersOnLong); the longer ones a dip each.
// All est., LAB's numbers.
export const CANON = { inside: 16, share: 0.6, insideMin: 16, shortLeg: 16, rideUnder: 30, ride: 79 };

const lenXY = pts => pts.slice(1).reduce((t, q, i) => t + Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]), 0);
// a cell of several legs the way round that starts on its longer end leg, as FORM-G's second layer turns one: the dip falls on that one
export const longEndFirst = c => { if (c.air || c.legs.length < 2) return c; const L = l => Math.abs(l[2] - l[1]); return L(c.legs[0]) >= L(c.legs.at(-1)) ? c : { ...c, legs: c.legs.slice().reverse().map(([x, a, b]) => [x, b, a]) }; };
// short end legs a cell of several cannot start on go on their own, on what the brush holds; the rest starts on its first long leg. → the cells it makes
export const startOnLong = c => { const t = longEndFirst(c), L = l => Math.abs(l[2] - l[1]), k = t.legs.findIndex(l => L(l) >= CANON.shortLeg); return t.air || k <= 0 ? [t] : [...t.legs.slice(0, k).map(l => ({ ...t, legs: [l] })), { ...t, legs: t.legs.slice(k) }]; };
// the legs under 30 mm on what the longer ones leave, each after the one with the most room for it; the longer ones a dip each, so the reckoning holds; what fits nowhere takes a dip of its own
export function ridersOnLong(cells, ride) {
  const all = cells.map(c => { const L = c.runs.map(r => lenXY(r.pts)); return { c, first: L[0], tail: L.at(-1), riders: [], rides: L[0] < CANON.rideUnder && !(c.legs.length > 1 && L.length > 1) }; });
  const room = b => ride - b.tail - b.riders.reduce((t, r) => t + r.first, 0), bins = all.filter(q => !q.rides);
  for (const q of all.filter(q => q.rides).sort((p, r) => (p.c.runs.length - r.c.runs.length) || r.first - p.first)) {
    const roomiest = () => bins.reduce((m, b) => b.c.runs.length === 1 && (!m || room(b) > room(m)) ? b : m, null);
    let best = roomiest();
    if ((!best || room(best) < q.first) && q.first < CANON.insideMin) {    // no room for a short one: the longest that rides lands inside a dip of its own instead, and leaves room
      const up = bins.flatMap(b => b.riders.map(r => [b, r])).filter(([, r]) => r.first >= CANON.insideMin).sort((a, b) => b[1].first - a[1].first)[0];
      if (up) { up[0].riders.splice(up[0].riders.indexOf(up[1]), 1); bins.push(up[1]); best = roomiest(); }
    }
    if (best && room(best) >= q.first) best.riders.push(q); else bins.push(q);
  }
  return bins.flatMap(b => [{ ...b.c, runs: b.c.runs.map((r, j) => j ? r : { ...r, dip: true }) }, ...b.riders.map(r => r.c)]);
}
function pointAt(pts, s) {
  let left = s;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (left <= d) { const f = d ? left / d : 0; return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f]; }
    left -= d;
  }
  return pts.at(-1);
}
// a run's points as the brush lays them after a dip: landing inside its first leg, back to its start; a rope inside its own line; a run on what the brush holds as it is
export function landInside(pts, dip) {
  if (!dip || pts.length < 2) return pts;
  const [a, b] = pts, d = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (d >= CANON.insideMin) { const s = Math.min(CANON.inside, d * CANON.share); return [[a[0] + (b[0] - a[0]) / d * s, a[1] + (b[1] - a[1]) / d * s], ...pts]; }
  if (pts.length > 2 && lenXY(pts) >= CANON.inside * 2) {
    const back = [pointAt(pts, CANON.inside)];
    for (let i = pts.length - 1, t = lenXY(pts); i >= 0; i--) { if (t < CANON.inside - 1e-6) back.push(pts[i]); if (i) t -= Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); }
    return [...back, ...pts.slice(1)];
  }
  return pts;
}
