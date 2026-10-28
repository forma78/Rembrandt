// Align, the Tools' four (the owner, 2026-10-28, OPM-S: "a primitive
// alignment to the centre, an even distance between three / two figures, in
// the TOOLS on the left"), as Illustrator's Align panel: the figures centred
// on the canvas, left to right or top to bottom; or the gaps between them
// made even, the outermost two where they are. Centred, figures in a row —
// none over or under another — each its own middle on the canvas's, so the
// row lines up; else their box, every one moved alike. Their places only —
// the sizes, a blend's keys and the sausages, all fractions of their box, go
// with them. x left to right, y bottom to top, in mm; to 0.01 mm.
const r100 = v => Math.round(v * 100) / 100;
export const ALIGNS = ['midX', 'midY', 'gapX', 'gapY'];
export const boxOf = rs => { const x0 = Math.min(...rs.map(r => r.x)), y0 = Math.min(...rs.map(r => r.y)); return { x: x0, y: y0, w: Math.max(...rs.map(r => r.x + r.w)) - x0, h: Math.max(...rs.map(r => r.y + r.h)) - y0 }; };
// no two of rs over one another across the axis: side by side for X false, one above another for X true
const apart = (rs, X) => rs.every((a, i) => rs.every((b, j) => j <= i || (X ? a.y + a.h <= b.y + 1e-9 || b.y + b.h <= a.y + 1e-9 : a.x + a.w <= b.x + 1e-9 || b.x + b.w <= a.x + 1e-9)));
// the places {x, y} of rs aligned so, in their order; with them the margin
// from either edge of the canvas, or the gap between every two; null when
// there is nothing to do it to: no figure, or fewer than three to space
export function aligned(rs, how, W, H) {
  if (!rs.length || !ALIGNS.includes(how)) return null;
  const X = how.endsWith('X'), at = r => X ? r.x : r.y, side = r => X ? r.w : r.h, put = (r, v) => X ? { x: r100(v), y: r.y } : { x: r.x, y: r100(v) };
  if (how.startsWith('mid')) {
    const L = X ? W : H, B = boxOf(rs), d = (L - (X ? B.w : B.h)) / 2 - (X ? B.x : B.y), each = rs.length > 1 && apart(rs, X);
    const out = rs.map(r => put(r, each ? (L - side(r)) / 2 : at(r) + d)), C = boxOf(rs.map((r, i) => ({ ...r, ...out[i] })));
    return { at: out, margin: r100(X ? C.x : C.y), each };
  }
  if (rs.length < 3) return null;
  const order = rs.map((r, i) => i).sort((i, j) => at(rs[i]) + side(rs[i]) / 2 - (at(rs[j]) + side(rs[j]) / 2) || i - j);   // by their middles, as Illustrator's
  const first = rs[order[0]], last = rs[order.at(-1)], inner = order.slice(1, -1);
  const gap = (at(last) - at(first) - side(first) - inner.reduce((s, i) => s + side(rs[i]), 0)) / (order.length - 1);
  const out = rs.map(r => put(r, at(r)));
  let v = at(first) + side(first);
  for (const i of inner) { out[i] = put(rs[i], v + gap); v += gap + side(rs[i]); }
  return { at: out, gap: r100(gap) };
}
