// HOLO's plan (HOLO-Claude/HOLO.md, 2026-11-12): a geometric painting of vertical legs alone, in two runs. The brush first lays even
// puddles of paint from the cup at hand, then drags them: run 1 the light, every slat's ground along its legs; run 2, on the dry first,
// the shadow, one puddle at a band's edge dragged away from it till it gives out. The owner: "first the brush dips into the paint and
// leaves even puddles of paint on the canvas … all the drops strictly dosed and placed with perfect precision"; "the brush going only
// up and down is our feature".
//
// A picture, app/holo/<id>.json, made by HOLO-Claude/generator/holo_jars.py — cloud-Claude's composition in the owner's jars (the owner,
// the same day: "stay within the range where our jars are already mixed and there is paint"):
//   { id, title, sub, composition: 'fan' | 'tiers', w, h, pitch, field: { x0, x1, y0, y1 }, horizon, est, count, image, after1,
//     jars: [{ id, name, number, hex, L, seen, new, note, run1_dabs, run2_dabs }],
//     slats: [{ x0, legs, ground: a jar's id | null, puddles_y, bands: [{ y0, y1, jar, dabs, start, end, way }] }] }
// mm from the canvas's bottom left corner, x right, y up, every leg along y, the machine's X, as FORM-G's.
//
// Nothing here moves the machine: the plan, its numbers and ▶ Play. A dab is a new move in a run — a dip, then a mark with no line after
// it — and is wired on the owner's word (HOLO.md, "Ask the owner before"). Every number est.

import { contourOf } from './formgplan.js';

// the library: its json and jpgs in app/holo/; every v.2 after its v.1, the same composition and jars, its edges ragged (the owner,
// 2026-11-14: "'ragged' edges, with no clear frame, will help us technically … keep the first ones too! The new ones then v.2";
// HOLO-Claude/generator/holo_v2.py)
export const HOLO_LIB = ['holo-40-warm', 'holo-40-warm-v2', 'holo-60-blue', 'holo-60-blue-v2', 'holo-60-tiers', 'holo-60-tiers-v2'];
// est.: a dab MARKS' mark, a leg of 8 mm on a dip of its own; a batch of puddles laid, then dragged while wet (≈ 100 dabs, ≈ 15 min);
// 9 s a dab (the run journal's hand dip of ≈ 6 s, the way to the place and the mark); the brush along a drag, mm/s
export const HOLO = { gap: 40, mark: 8, batch: 100, sDab: 9, speed: 25, inset: 4, maxDabs: { fan: 3, tiers: 4 } };

// every leg of the picture: its x, its number across the field, its slat, its ends y0 … y1 — the field's, or a v.2's own (slat.ends)
export const legsOf = pic => pic.slats.flatMap(s => Array.from({ length: s.legs }, (_, j) => ({ x: s.x0 + (j + 0.5) * pic.pitch, n: Math.round((s.x0 - pic.field.x0) / pic.pitch) + j, slat: s,
  y0: s.ends?.[j]?.[0] ?? pic.field.y0, y1: s.ends?.[j]?.[1] ?? pic.field.y1 })));
// run 1's puddles along a leg: evenly from `inset` in from the field's bottom to as far in from its top, `gap` apart at most (the study's)
export const puddlesY = (pic, gap = HOLO.gap, inset = HOLO.inset) => puddlesAlong(pic.field.y0, pic.field.y1, gap, inset);
// the same along a leg's own ends (a v.2's)
export function puddlesAlong(y0, y1, gap = HOLO.gap, inset = HOLO.inset) {
  const a = y0 + inset, b = y1 - inset, m = Math.ceil((y1 - y0 - 2 * inset) / gap) + 1;
  return Array.from({ length: m }, (_, i) => Math.round((b - (b - a) * i / (m - 1)) * 10) / 10);
}
// a shadow's dabs by its band's length: one every `lasts` mm of band, 1 … the composition's most (the study's: 55 mm a dab on FAN, 45 on TIERS)
export const dabsOf = (pic, band, lasts) => lasts ? Math.max(1, Math.min(HOLO.maxDabs[pic.composition] ?? 3, Math.round((band.y1 - band.y0) / lasts))) : band.dabs;

// the run's list: run 1's jars light to dark, then run 2's, on the dry first; a jar in both runs a line in each
export function seqOf(pic) {
  const by = (a, b) => b.L - a.L;
  return [...pic.jars.filter(j => j.run1_dabs > 0).sort(by).map(j => ({ ...j, key: `${j.id}:1`, jar: j.id, run: 1 })),
    ...pic.jars.filter(j => j.run2_dabs > 0).sort(by).map(j => ({ ...j, key: `${j.id}:2`, jar: j.id, run: 2 }))];
}

// a line of the list into its work: puddles laid a batch at a time, then that batch's strokes, the same jar in the cup throughout.
// → { dabs, puddles: [{ x, y, dabs }], strokes: [{ x, pts: [[x, a], [x, b]], fade }], batches: [{ puddles, strokes }], mm }
// Run 1: along every leg of a slat of this ground, its puddles; one stroke the leg's whole field through them, no dip — even legs
// from the top down, odd ones up (the study's), from the field's edge to the other. Run 2: every band of this jar on every leg of its
// slat: one puddle at its start, `dabs` dabs, then one stroke from it towards its end, no dip (the band's own way).
export function workOf(pic, line, o = {}) {
  const gap = o.gap ?? HOLO.gap, batch = o.batch ?? HOLO.batch, lasts = o.lasts ?? null;
  const legs = legsOf(pic), items = [];
  if (line.run === 1) {
    for (const g of legs) {
      if (g.slat.ground !== line.jar) continue;
      const down = g.n % 2 === 0, a = down ? g.y1 : g.y0, b = down ? g.y0 : g.y1, ys = puddlesAlong(g.y0, g.y1, gap);
      items.push({ puddles: ys.map(y => ({ x: g.x, y, dabs: 1 })), stroke: { x: g.x, pts: [[g.x, a], [g.x, b]], fade: null } });
    }
  } else {
    for (const g of legs) for (const band of g.slat.bands) {
      if (band.jar !== line.jar) continue;
      const d = dabsOf(pic, band, lasts);
      items.push({ puddles: [{ x: g.x, y: band.start, dabs: d }], stroke: { x: g.x, pts: [[g.x, band.start], [g.x, band.end]], fade: { full: pic.est.shadow_full ?? 0, band } } });
    }
  }
  // batches: whole items, about `batch` dabs each; a run-1 leg never split
  const batches = [];
  let cur = null;
  for (const it of items) {
    const n = it.puddles.reduce((t, p) => t + p.dabs, 0);
    if (!cur || (cur.dabs + n > batch && cur.dabs > 0)) batches.push(cur = { puddles: [], strokes: [], dabs: 0 });
    cur.puddles.push(...it.puddles); cur.strokes.push(it.stroke); cur.dabs += n;
  }
  const puddles = items.flatMap(q => q.puddles), strokes = items.map(q => q.stroke);
  return { dabs: puddles.reduce((t, p) => t + p.dabs, 0), puddles, strokes, batches, mm: strokes.reduce((t, s) => t + Math.abs(s.pts[1][1] - s.pts[0][1]), 0) };
}
// ---------- MARKS beside the canvas (README's canon, 2026-11-14) ----------
// The owner, 2026-11-14 (HOLO-Claude/IMG_2903.jpg, two places circled in green; color_marks.png, FORM-G's strips 1 and 3): "the places where the
// papers will lie, so that the machine dips as in color_marks.png — this is the new canon. All the new pictures come with such tables." Paper
// slips on the metal plates by the middles of the canvas's left and right edges, off the canvas, FORM-G's MARKS on them: after every change of
// jar one dip, then its mark on the left slip (1), then on the right (3), then its first puddle on a dip of its own. A jar's cell by its place
// among the list's jars, the first at the top; a jar in both runs its run-2 line in a second row, farther out (FORM-G's second coat).
// Where: 'off' the canvas, as above, where the reach across Y has room for them beside it (the 40 × 40); else 'on' it, the slips taped over the
// canvas's margins by the field's edges — the owner, the same day, of a 60 × 60 wider than the reach (HOLO-Claude/IMG_2904.jpg, the red classic's
// two strips on a 60 × 60, their marks the machine's): "we will put them right on the canvas, as with 70 × 100" — where the field leaves the
// reach room for them (the tiers, 540 mm; not the blue, 560).
// mm, est.: leg, along, across FORM-G's MARKS; trail, the brush's own 5 mm (the owner, the same day: "IMPORTANT — the brush is 5 mm"; LAB's
// real 3 dry test measured a track ≈ 8 mm across Y, 2026-11-09); gap, the canvas's edge to the nearer row's trail off it; clear, the field's
// edge to it on the canvas, and paper, the slip's edge short of the field there; slip, the paper across Y ("3 cm left and 3 cm right is
// enough"); a mark after the line's first sMark s more, the way across the canvas to the other slip
export const MARKS_BESIDE = { leg: 8, along: 14, across: 12, trail: 5, gap: 8, clear: 4, paper: 2, slip: 30, sMark: 5 };
export function markCells(seq) {
  const k = new Map(), run1 = new Set(seq.filter(q => q.run === 1).map(q => q.jar));
  for (const q of seq) if (!k.has(q.jar)) k.set(q.jar, k.size);
  return seq.map(q => ({ k: k.get(q.jar), row: q.run === 2 && run1.has(q.jar) ? 1 : 0 }));
}
// where: 'off' | 'on' → { where, n cells a slip, rows, x0 x1: the marks' outer edges across Y, strips: [{ no, side, box: [x0, y0, x1, y1], slip: [x0, y0,
// x1, y1] }], marks: a line of the list → [{ no, side, at: [x, y], pts }], a mark from its bottom up }; the picture's mm, off it the left slip at x < 0
export function besideOf(pic, where = 'off', o = MARKS_BESIDE) {
  const cells = markCells(seqOf(pic)), n = Math.max(0, ...cells.map(c => c.k + 1)), rows = cells.some(c => c.row) ? 2 : 1, f = pic.field, on = where === 'on';
  const top = pic.h / 2 + (n - 1) * o.along / 2, bottom = top - (n - 1) * o.along;
  // off: from the canvas's edges outward; on: from the field's edges outward, over the canvas's margins
  const xOf = (side, row) => { const d = (on ? o.clear : o.gap) + o.trail / 2 + row * o.across; return side === 'left' ? (on ? f.x0 : 0) - d : (on ? f.x1 : pic.w) + d; };
  const strips = [{ no: 1, side: 'left' }, { no: 3, side: 'right' }].map(s => {
    const xs = [xOf(s.side, 0), xOf(s.side, rows - 1)], L = s.side === 'left';
    const [a, b] = on ? (L ? [0, f.x0 - o.paper] : [f.x1 + o.paper, pic.w]) : (L ? [-o.slip, 0] : [pic.w, pic.w + o.slip]);
    return { ...s, box: [Math.min(...xs) - o.trail / 2, bottom - o.leg / 2, Math.max(...xs) + o.trail / 2, top + o.leg / 2],
      slip: [Math.min(a, ...xs.map(x => x - o.trail / 2)), bottom - o.leg / 2 - o.leg, Math.max(b, ...xs.map(x => x + o.trail / 2)), top + o.leg / 2 + o.leg] };
  });
  const marks = cells.map(({ k, row }) => strips.map(s => { const x = xOf(s.side, row), y = top - k * o.along; return { no: s.no, side: s.side, at: [x, y], pts: [[x, y - o.leg / 2], [x, y + o.leg / 2]] }; }));
  return { where, n, rows, x0: strips[0].box[0], x1: strips[1].box[2], strips, marks };
}

// the whole list's work, every line its numbers and its time (est.: a dab sDab s, a stroke at `speed`); o.marks: every line its MARKS
// first (besideOf's, 'off' or 'on' the canvas; true 'off'), a dip and its marks, sDab s the first, MARKS_BESIDE.sMark every next
export function planOf(pic, o = {}) {
  const sDab = o.sDab ?? HOLO.sDab, speed = o.speed ?? HOLO.speed, M = o.marks ? besideOf(pic, o.marks === true ? 'off' : o.marks).marks : null;
  return seqOf(pic).map((line, i) => {
    const w = workOf(pic, line, o), marks = M?.[i] ?? [], sm = marks.length ? sDab + (marks.length - 1) * MARKS_BESIDE.sMark : 0;
    return { ...line, ...w, marks, seconds: w.dabs * sDab + w.mm / speed + sm };
  });
}
// the moves in their order, for ▶ Play and the LCD: a line's marks, then a batch's dabs, then its strokes; every move its length in
// "mm of run" so a dab weighs as much time as a stroke (est.: a dab sDab s = sDab × speed mm)
export function movesOf(lines, o = {}) {
  const sDab = o.sDab ?? HOLO.sDab, speed = o.speed ?? HOLO.speed, out = [];
  let t = 0;
  lines.forEach((L, li) => {
    (L.marks ?? []).forEach((m, i) => out.push({ kind: 'mark', line: li, batch: 0, no: m.no, side: m.side, at: m.at, pts: m.pts, from: t, to: (t += i ? MARKS_BESIDE.sMark : sDab) }));
    L.batches.forEach((B, bi) => {
      for (const p of B.puddles) { const s = p.dabs * sDab; out.push({ kind: 'dab', line: li, batch: bi, at: [p.x, p.y], dabs: p.dabs, from: t, to: (t += s) }); }
      for (const q of B.strokes) { const s = Math.abs(q.pts[1][1] - q.pts[0][1]) / speed; out.push({ kind: 'drag', line: li, batch: bi, pts: q.pts, fade: q.fade, from: t, to: (t += s) }); }
    });
  });
  return out;
}
// how much paint a run-2 stroke leaves at a point, 0 … 1, by its share of the way from its start (est., the study's: thick where it
// starts, gone where the band ends; on TIERS laid full over `full` of it, then giving out)
export const shadeAt = (u, full = 0) => u < 0 || u > 1 ? 0 : full ? (u <= full ? 1 : Math.max(0, 1 - (u - full) / (1 - full)) ** 1.3) : (1 - u) ** 1.5;

// DRAW BW's lines (FORM-G's, the owner, 2026-11-14: HOLO "has no STOP and HOME", and DRAW BW and ⏮ BACK ONE JAR as FORM-G's): formgplan.js's
// contourOf over the strokes as the brush lays them, every line of the list in its order — run 1's grounds the field's height, run 2's shadows
// from their puddle to where they end, over them; a jar in both runs one colour. o.outline: where the paint meets the bare canvas alone.
// → { lines: [[[x, y], …]], mm, pieces }, the picture's mm
export function contourHolo(pic, o = {}) {
  const jars = seqOf(pic).map(line => ({ id: line.jar, cells: [{ legs: workOf(pic, line).strokes.map(q => [q.x, q.pts[0][1], q.pts[1][1]]) }] }));
  return contourOf({ pitch: pic.pitch, jars }, { outline: !!o.outline, key: j => j.id });
}

// where the canvas may lie, its left and bottom edges from home, whole mm: the field's own edges within the Y walls — DRAW BW's pen goes
// round them, half a pitch past the outer legs' middles, and the paper laid by it is the canvas the brush paints on (2026-11-14: the 60 ×
// 60s' places by the legs' middles put the pen up to 2.5 mm past the Y wall, and the blue's TEST dots on it) — and the legs' ends within the
// X walls, more room at the bottom, where the elbow sweeps the carriage past a leg's end, and at the top (MARKS' numbers, est.); EDGE_IN,
// plotRun's own 0.1 mm inside, and FORM-G's 0.2 mm more; walls: machine.js's reach(). A plotRun of the run gives the real range once the
// run is wired, as FORM-G's. With MARKS (besideOf) both slips' marks within the Y walls too: off the canvas where they fit so, else on it,
// else none; `marks` says which ('off', 'on' or false), `widest` the widest field across Y they fit beside on the canvas.
export const WALL = { side: 0, bottom: 25, top: 8 }, WALL_IN = 0.2;
export function placeRange(pic, walls, w = WALL, o = MARKS_BESIDE) {
  const Y = walls.y.max - walls.y.min, X = walls.x.max - walls.x.min, f = pic.field;
  const r = (lo, hi, m = 0) => [Math.ceil(lo + m - 1e-9), Math.floor(hi - m + 1e-9)];   // whole mm, as the page takes them, rounded inward
  const left = r(w.side - f.x0, Y - w.side - f.x1, WALL_IN), bottom = r(w.bottom - f.y0, X - w.top - f.y1);   // X's margins are room enough
  const B = besideOf(pic, 'off', o);
  if (!B.n) return { left, bottom, marks: false, widest: null };
  const widest = Math.floor(Y - 2 * (WALL_IN + o.clear + o.trail + (B.rows - 1) * o.across));
  for (const where of ['off', 'on']) {
    const M = besideOf(pic, where, o), m = r(-M.x0, Y - M.x1, WALL_IN), both = [Math.max(left[0], m[0]), Math.min(left[1], m[1])];
    if (both[0] <= both[1]) return { left: both, bottom, marks: where, widest };
  }
  return { left, bottom, marks: false, widest };
}
