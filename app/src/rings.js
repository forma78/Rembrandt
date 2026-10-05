// New Yuri's letters: rings along a skeleton (the owner, 2026-10-05; the
// task of Claude in chat, type_rings_mode/rings.py — its logic ported, not
// called). A letter is strokes; a stroke is a skeleton of lines and arcs
// (glyphs.json); a circle of radius R is laid every STEP along it, and the
// circles are what the machine draws: RINGS, each circle its own loop, or
// COIL, one line per stroke that makes a whole turn from one centre to the
// next.
//
// glyphs.json, as type_rings_mode/glyph_tool.py writes it: an inner box, y 0
// the skeleton's baseline, y 1 its capline, y up; x from 0 to the glyph's
// width, in units of the box's height. A stroke: start, nodes — { line:
// [x, y] } or { arc: { c, r, from, to } }, degrees, to > from anticlockwise,
// from the current point — and closed. List order is draw order. A dot (the
// owner's ! and %, NEW-YURI/890%!.png): dot true, its start the point, no
// nodes — a sphere: the circle there, and the circles under it every STEP
// down to 2R, each cut to the first one.
//
// Canvas mm here, as in band.js: x right, y down. No DOM.

const rad = d => d * Math.PI / 180;

// ---------- the skeleton ----------
// A stroke of glyphs.json → its pieces in the box: lines { t: 'L', a, b } and
// arcs { t: 'A', c, r, a0, a1 } (radians, y up, a1 > a0 anticlockwise).
export function skeletonOf(st) {
  const out = [];
  let p = st.start;
  for (const n of st.nodes) {
    if (n.line) {
      if (Math.hypot(n.line[0] - p[0], n.line[1] - p[1]) > 1e-9) out.push({ t: 'L', a: p, b: n.line });
      p = n.line;
    } else {
      const { c, r } = n.arc, a0 = rad(n.arc.from), a1 = rad(n.arc.to);
      out.push({ t: 'A', c, r, a0, a1 });
      p = [c[0] + r * Math.cos(a1), c[1] + r * Math.sin(a1)];
    }
  }
  return out;
}

// The inset (the task: "h = H − 2R, (x, y) → (left + R + x·h, base + R +
// y·h), so the outer edge of the circles touches baseline and capline
// exactly"). A letter at x (its left edge) and base (its baseline), canvas
// mm, H tall, its circles R: its pieces on the canvas, y down — an arc
// keeps a0, a1 as angles on the canvas, its way round in d (+1 clockwise on
// the screen, as y runs down).
export function placed(pieces, x, base, H, R) {
  const h = H - 2 * R, P = q => [x + R + q[0] * h, base - R - q[1] * h];
  return pieces.map(g => g.t === 'L' ? { t: 'L', a: P(g.a), b: P(g.b) }
    : { t: 'A', c: P(g.c), r: g.r * h, a0: -g.a0, a1: -g.a1, d: g.a1 >= g.a0 ? -1 : 1 });
}
export const pieceLength = g => g.t === 'L' ? Math.hypot(g.b[0] - g.a[0], g.b[1] - g.a[1]) : g.r * Math.abs(g.a1 - g.a0);
// the point s mm along the pieces
export function pointAt(pieces, s) {
  for (const g of pieces) {
    const L = pieceLength(g);
    if (s <= L + 1e-9 || g === pieces.at(-1)) {
      const t = L > 0 ? Math.max(0, Math.min(1, s / L)) : 0;
      if (g.t === 'L') return [g.a[0] + (g.b[0] - g.a[0]) * t, g.a[1] + (g.b[1] - g.a[1]) * t];
      const a = g.a0 + (g.a1 - g.a0) * t;
      return [g.c[0] + g.r * Math.cos(a), g.c[1] + g.r * Math.sin(a)];
    }
    s -= L;
  }
  return null;
}

// ---------- the centres ----------
// Every step mm along the skeleton (rings.py, centres): RAMP −1 … +1 makes the
// spacing grow along the stroke, from step · (1 − ramp) to step · (1 + ramp);
// 0 even. Never closer than min (the brush's width: no circle drawn on top
// of the last). An open stroke has a circle on its start and one on its end,
// the spacing stretched or squeezed evenly so that the last lands there —
// both ends alike (rings.py meant it, and appended a short last gap); a
// closed one goes round evenly, no second circle on its seam. A corner of
// the skeleton gets a circle too, and the spacing evens out between the
// corners: else the bottom of a V fell between two circles and stood 2.6 mm
// off the baseline (Claude's choice). A fillet tighter than CORNER_R mm is a
// corner, its circle in its middle.
export const RAMP_MAX = 0.95;   // at ±1 the spacing reaches 0 at one end
const CORNER = 5 * Math.PI / 180, CORNER_R = 2;
const tangent = (g, end) => {
  if (g.t === 'L') { const l = Math.hypot(g.b[0] - g.a[0], g.b[1] - g.a[1]) || 1; return [(g.b[0] - g.a[0]) / l, (g.b[1] - g.a[1]) / l]; }
  const a = end ? g.a1 : g.a0; return [-g.d * Math.sin(a), g.d * Math.cos(a)];
};
// the corners, mm along the pieces
function cornersOf(pieces, closed) {
  const out = [];
  let s = 0;
  pieces.forEach((g, i) => {
    const L = pieceLength(g);
    if (g.t === 'A' && g.r < CORNER_R) out.push(s + L / 2);
    s += L;
    const next = pieces[i + 1] || (closed ? pieces[0] : null);
    if (next) { const u = tangent(g, true), v = tangent(next, false); if (Math.acos(Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1]))) > CORNER) out.push(i + 1 < pieces.length ? s : 0); }
  });
  return out;
}
export function centresOf(pieces, closed, step, ramp = 0, min = 0) {
  const L = pieces.reduce((a, g) => a + pieceLength(g), 0);
  if (!(L > 1e-6)) return pieces.length ? [pointAt(pieces, 0)] : [];
  const k = Math.max(-RAMP_MAX, Math.min(RAMP_MAX, ramp || 0)), gap = s => Math.max(min, step * (1 - k + 2 * k * (closed ? ((s % L) + L) % L : s) / L), 1e-3);
  // from a to b: a circle on each, the spacing evened between them
  const run = (a, b) => {
    const pos = [a];
    while (pos.at(-1) < b) pos.push(pos.at(-1) + gap(pos.at(-1)));
    if (pos.length > 2 && b - pos.at(-2) < pos.at(-1) - b) pos.pop();
    const f = (b - a) / (pos.at(-1) - a);
    return pos.map(s => a + (s - a) * f);
  };
  const cs = [...new Set(cornersOf(pieces, closed).filter(s => s > 1e-6 && s < L - 1e-6 || (closed && s === 0)))].sort((p, q) => p - q);
  let at;
  if (closed) {
    const starts = cs.length ? cs : [0], s0 = starts[0], marks = [...starts.map(s => s - s0), L];
    at = marks.slice(1).flatMap((b, i) => run(marks[i], b).slice(1)).map(s => s + s0);
    at.pop();                                   // the seam's circle once
    at.unshift(s0);
  } else {
    const marks = [0, ...cs, L];
    at = [0, ...marks.slice(1).flatMap((b, i) => run(marks[i], b).slice(1))];
  }
  return at.map(s => pointAt(pieces, closed ? ((s % L) + L) % L : s));
}

// ---------- the rings ----------
// What the machine draws of a stroke in RINGS: a whole circle round every
// centre, from 12 o'clock clockwise on the canvas (Rembrandt.md §0, o'clock;
// as Circle's rows run) — a0 … a1 radians, y down, a1 > a0. A dot's circles
// under its first are cut to it: only their tops, over the first one's
// inside (two circles of radius R, d apart: the lower one's points within
// the upper are those with sin t ≤ −d / 2R).
export function ringsOf(centres, R, dot = false) {
  return centres.map((c, k) => {
    if (!dot || !k) return { c, r: R, a0: -Math.PI / 2, a1: 1.5 * Math.PI };
    const al = Math.asin(Math.min(1, Math.hypot(c[0] - centres[0][0], c[1] - centres[0][1]) / (2 * R)));
    return { c, r: R, a0: Math.PI + al, a1: 2 * Math.PI - al };
  }).filter(g => g.a1 - g.a0 > 1e-6);
}
// a dot's centres: its point, then every step down while the circle still shows
export function dotCentres(p, R, step) {
  const out = [p];
  for (let d = step; d < 2 * R - 1e-6 && step > 0; d += step) out.push([p[0], p[1] + d]);
  return out;
}

// ---------- the letter ----------
// glyph: glyphs.json's; o: { x, base, H, R, step, ramp, min, strokes } —
// strokes: per stroke { step, ramp } over the letter's (the task: "a dense
// stem, a sparse crossbar"). → { strokes: [{ pieces, closed, dot, centres,
// rings }], w: its width, x0, x1 }
export function letterOf(glyph, o) {
  const h = o.H - 2 * o.R;
  const strokes = glyph.strokes.map((st, i) => {
    const own = o.strokes?.[i] || {}, step = Math.max(own.step ?? o.step, o.min || 0), pieces = placed(skeletonOf(st), o.x, o.base, o.H, o.R);
    const centres = st.dot ? dotCentres([o.x + o.R + st.start[0] * h, o.base - o.R - st.start[1] * h], o.R, step)
      : centresOf(pieces, st.closed, step, own.ramp ?? o.ramp ?? 0, o.min || 0);
    return { pieces, closed: !!st.closed, dot: !!st.dot, centres, rings: ringsOf(centres, o.R, !!st.dot) };
  });
  const w = glyph.width * h + 2 * o.R;
  return { strokes, w, x0: o.x, x1: o.x + w };
}

// ---------- COIL ----------
// One line per stroke (rings.py, coil): a whole turn while the centre goes
// from one to the next — a prolate trochoid, no lift in the stroke; a last
// whole circle on the end. Round as Circle's rows run, clockwise on the
// canvas from 12 o'clock (Rembrandt.md §0, o'clock). A closed stroke comes
// back to its first centre. per: points a turn. → [[x, y]]
export function coilOf(centres, R, closed = false, per = 48) {
  const cs = closed && centres.length > 1 ? [...centres, centres[0]] : centres, out = [];
  const on = (c, t) => [c[0] + R * Math.cos(-Math.PI / 2 + 2 * Math.PI * t), c[1] + R * Math.sin(-Math.PI / 2 + 2 * Math.PI * t)];
  for (let i = 0; i < cs.length - 1; i++)
    for (let j = 0; j < per; j++) {
      const t = j / per, c = [cs[i][0] + (cs[i + 1][0] - cs[i][0]) * t, cs[i][1] + (cs[i + 1][1] - cs[i][1]) * t];
      out.push(on(c, t));
    }
  const e = cs.at(-1);
  if (e) for (let j = 0; j <= per; j++) out.push(on(e, j / per));
  return out;
}

// ---------- one letter after another ----------
// The gap is measured between the letters' outlines, not their boxes (the
// first task: "contour to contour, default 0 = touching, so AV, LT space
// correctly"); below 0 they overlap, as in the owner's LOVE pictures. The
// outline is the circles' along the skeleton — every mm of it, whatever the
// STEP — and a dot's first circle.
const discsOf = l => l.strokes.flatMap(st => {
  if (st.dot) return [st.centres[0]];
  const L = st.pieces.reduce((a, g) => a + pieceLength(g), 0), n = Math.max(1, Math.ceil(L));
  return Array.from({ length: n + 1 }, (_, j) => pointAt(st.pieces, L * j / n));
});
// the outline's left and right edge at height y, or null
function across(discs, R, y) {
  let lo = Infinity, hi = -Infinity;
  for (const c of discs) { const d = R * R - (y - c[1]) ** 2; if (d >= 0) { const s = Math.sqrt(d); lo = Math.min(lo, c[0] - s); hi = Math.max(hi, c[0] + s); } }
  return hi >= lo ? [lo, hi] : null;
}
// x for the next letter so that its outline keeps gap mm from prev's
export function nextX(prev, glyph, o, gap = 0) {
  const R = o.R, A = discsOf(prev), probe = letterOf(glyph, { ...o, x: 0 }), B = discsOf(probe);
  let need = -Infinity;
  for (let y = o.base - o.H; y <= o.base + 1e-9; y += 0.5) {
    const a = across(A, R, y), b = across(B, R, y);
    if (a && b) need = Math.max(need, a[1] - b[0]);
  }
  return Number.isFinite(need) ? need + gap : prev.x1 + gap;
}
// a line of text from x on base: its letters, each placed after the last; a
// space is a third of H. wrap: the right edge a line may not pass — the next
// letter goes under the first, a line H + lead lower. → [{ ch, letter }]
export function setText(G, text, o, gap = 0, wrap = Infinity, lead = 0) {
  const out = [];
  let x = o.x, base = o.base, prev = null, space = 0;
  for (const ch of text) {
    if (ch === ' ') { space += o.H / 3; continue; }
    if (ch === '\n') { x = o.x; base += o.H + lead; prev = null; space = 0; continue; }
    const glyph = G[ch]; if (!glyph) continue;
    const at = { ...o, base };
    let lx = prev ? nextX(prev, glyph, at, gap) + space : x;
    let letter = letterOf(glyph, { ...at, x: lx });
    if (prev && letter.x1 > wrap) { base += o.H + lead; letter = letterOf(glyph, { ...o, base, x: o.x }); }
    out.push({ ch, letter });
    prev = letter; space = 0;
  }
  return out;
}
