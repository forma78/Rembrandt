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

export const HOLO_LIB = ['holo-40-warm', 'holo-60-blue', 'holo-60-tiers'];   // the library: its json and jpgs in app/holo/
// est.: a dab MARKS' mark, a leg of 8 mm on a dip of its own; a batch of puddles laid, then dragged while wet (≈ 100 dabs, ≈ 15 min);
// 9 s a dab (the run journal's hand dip of ≈ 6 s, the way to the place and the mark); the brush along a drag, mm/s
export const HOLO = { gap: 40, mark: 8, batch: 100, sDab: 9, speed: 25, inset: 4, maxDabs: { fan: 3, tiers: 4 } };

// every leg of the picture: its x, its number across the field, its slat
export const legsOf = pic => pic.slats.flatMap(s => Array.from({ length: s.legs }, (_, j) => ({ x: s.x0 + (j + 0.5) * pic.pitch, n: Math.round((s.x0 - pic.field.x0) / pic.pitch) + j, slat: s })));
// run 1's puddles along a leg: evenly from `inset` in from the field's bottom to as far in from its top, `gap` apart at most (the study's)
export function puddlesY(pic, gap = HOLO.gap, inset = HOLO.inset) {
  const a = pic.field.y0 + inset, b = pic.field.y1 - inset, m = Math.ceil((pic.field.y1 - pic.field.y0 - 2 * inset) / gap) + 1;
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
  const gap = o.gap ?? HOLO.gap, batch = o.batch ?? HOLO.batch, lasts = o.lasts ?? null, ys = puddlesY(pic, gap);
  const legs = legsOf(pic), items = [];
  if (line.run === 1) {
    for (const g of legs) {
      if (g.slat.ground !== line.jar) continue;
      const down = g.n % 2 === 0, a = down ? pic.field.y1 : pic.field.y0, b = down ? pic.field.y0 : pic.field.y1;
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
// the whole list's work, every line its numbers and its time (est.: a dab sDab s, a stroke at `speed`)
export function planOf(pic, o = {}) {
  const sDab = o.sDab ?? HOLO.sDab, speed = o.speed ?? HOLO.speed;
  return seqOf(pic).map(line => { const w = workOf(pic, line, o); return { ...line, ...w, seconds: w.dabs * sDab + w.mm / speed }; });
}
// the moves in their order, for ▶ Play and the LCD: a batch's dabs, then its strokes; every move its length in "mm of run" so a dab
// weighs as much time as a stroke (est.: a dab sDab s = sDab × speed mm)
export function movesOf(lines, o = {}) {
  const sDab = o.sDab ?? HOLO.sDab, speed = o.speed ?? HOLO.speed, out = [];
  let t = 0;
  lines.forEach((L, li) => L.batches.forEach((B, bi) => {
    for (const p of B.puddles) { const s = p.dabs * sDab; out.push({ kind: 'dab', line: li, batch: bi, at: [p.x, p.y], dabs: p.dabs, from: t, to: (t += s) }); }
    for (const q of B.strokes) { const s = Math.abs(q.pts[1][1] - q.pts[0][1]) / speed; out.push({ kind: 'drag', line: li, batch: bi, pts: q.pts, fade: q.fade, from: t, to: (t += s) }); }
  }));
  return out;
}
// how much paint a run-2 stroke leaves at a point, 0 … 1, by its share of the way from its start (est., the study's: thick where it
// starts, gone where the band ends; on TIERS laid full over `full` of it, then giving out)
export const shadeAt = (u, full = 0) => u < 0 || u > 1 ? 0 : full ? (u <= full ? 1 : Math.max(0, 1 - (u - full) / (1 - full)) ** 1.3) : (1 - u) ** 1.5;

// where the canvas may lie, its left and bottom edges from home, mm: the outer legs' middles within the Y walls — the arm lies along X, the
// elbow sweeps the tip along a leg, never across it — and the legs' ends within the X walls, more room at the bottom, where the elbow
// sweeps the carriage past a leg's end, and at the top (MARKS' numbers, est.); walls: machine.js's reach(). A plotRun of the run gives
// the real range once the run is wired, as FORM-G's.
export const WALL = { side: 0, bottom: 25, top: 8 };
export function placeRange(pic, walls, w = WALL) {
  const Y = walls.y.max - walls.y.min, X = walls.x.max - walls.x.min, f = pic.field, h = pic.pitch / 2;
  return { left: [w.side - (f.x0 + h), Y - w.side - (f.x1 - h)], bottom: [w.bottom - f.y0, X - w.top - f.y1] };
}
