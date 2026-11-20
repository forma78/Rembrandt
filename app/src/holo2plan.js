// HOLO2's plan (2026-11-20): HOLO's two layers, the brush along the owner's route, as ST-JOHN's loops. The owner: "the brush goes back and
// forth without a stop, now and then going down on a diagonal or a short way left or right. These horizontal lines are the most dangerous:
// the paint may not lay there, our brush is flat. We draw the horizontal lines all the same, but on paper in the canvas's place, and test";
// "the principle Layer 1, Layer 2 … the blues and the whites in one layer, the red and the yellow in the other"; of a plan of hundreds of
// short snakes read off the drawing: "this is complicated and long. Let us do it as in ST-JOHN … only we taught the machine to put the
// drops itself"; "the brush must drive without a stop"; "we need even lines".
//
// The brush is flat: a dab only upright, HOLO's mark along X, whatever the lane's way (the owner, the same day: "it can put the drops only as in
// the first HOLO"); and the dabs of one colour, then the machine drives over them, then another's ("there are a great many and they dry before
// the brush comes"): a colour's band of the route a group — its rows of dabs, then at once its snake over them, lane after lane.
//
// A picture, app/holo2/<id>.json, made by HOLO2/generator/holo2_route.py off his route (HOLO2/01.png … 05.png, drawn stage by stage) and the
// colours of his drawing (HOLO2/Untitled-19.png):
//   { id, title, sub, version, composition: 'route', w, h, pitch, field, image, after1, est, count,
//     jars: [{ id, name, number, hex, L, layer, seen, note, run1_dabs, run2_dabs, groups, band_mm, drag_mm }],   // run1_dabs: Layer 1's (HOLO's words)
//     route: [[x, y]], lanes: [[[x, y], …], …],            // the route's middle, smoothed; its lanes, the brush apart
//     groups: [{ jar, s0, s1,                             // a colour's band, mm along the route
//                legs: [[x0, y0, x1, y1, …], …],          // its lanes over it in the brush's order, a step aside from one to the next
//                dabs: [[x, y, way], …] }],               // its rows of dabs, upright, the mark up (1) or down (−1) the way its lane goes there
//     contour: { outline, all } }
// mm from the canvas's bottom left corner, x right (the machine's Y), y up (its X), as HOLO's.
//
// The list: Layer 1's jars light to dark, then Layer 2's on the dry first (holoplan.js's seqOf); a jar's groups along the route. HOLO's MARKS
// and place (holoplan.js). Every number est.

import { seqOf as jarSeqOf, besideOf, MARKS_BESIDE, placeRange, WALL } from './holoplan.js';
export { besideOf, MARKS_BESIDE, placeRange, WALL };

export const HOLO2_LIB = ['holo2-19'];
// est.: HOLO's mark of 8 mm a dab; 9 s a dab; the brush along the drag, mm/s; `flat`, the horizontal stretches within so many degrees of the
// canvas's horizontal (the machine's Y), the flat brush's danger; `lift`, a step from a lane to the next longer than this, mm, the brush up
export const HOLO2 = { mark: 8, sDab: 9, speed: 25, flat: 30, lift: 15 };

const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
export const lineLen = pts => pts.slice(1).reduce((t, p, i) => t + len(pts[i], p), 0);
// a stretch of line within `flat` degrees of the horizontal: along the machine's Y, where the flat brush may not lay the paint (the owner)
export const isFlat = (a, b, flat = HOLO2.flat) => Math.abs(b[1] - a[1]) < Math.sin(flat * Math.PI / 180) * (len(a, b) || 1);
const flatMmOf = (pts, flat) => pts.slice(1).reduce((t, q, i) => t + (isFlat(pts[i], q, flat) ? len(pts[i], q) : 0), 0);
// the lanes end to end (the whole route's, for the Drag view)
export const snakeOf = pic => pic.lanes.flat();
const pairs = flat => Array.from({ length: flat.length / 2 }, (_, i) => [flat[2 * i], flat[2 * i + 1]]);

// the list: Layer 1's jars light to dark, then Layer 2's (holoplan.js's seqOf, a jar a line, its key `${id}:${layer}`)
export const seqOf = pic => jarSeqOf(pic);

// a line of the list into its work: its groups along the route, each its dabs (upright puddles, u the mark's way along X), then its snake.
// → { dabs, cells, puddles: [{ x, y, dabs, u }], strokes: [{ pts, lane, cell, key }], batches: [{ puddles, strokes, items, dabs }],
//   items: [{ cell, pts, len, flatMm }], mm, flatMm, flats }
export function workOf(pic, line, o = {}) {
  const flat = o.flat ?? HOLO2.flat, items = [], batches = [];
  pic.groups.filter(g => g.jar === line.jar).sort((a, b) => a.s0 - b.s0).forEach((g, k) => {
    const its = g.legs.map(f => { const pts = pairs(f); return { cell: items.length, pts, len: lineLen(pts), flatMm: flatMmOf(pts, flat) }; });
    items.push(...its);
    const puddles = g.dabs.map(([x, y, way]) => ({ x, y, dabs: 1, u: [0, way] }));
    // its snake one run, the brush down from a lane's end to the next's start — but where that step is longer than `lift` (a lane cut at a tight
    // turn), the brush up there, a new run: no stroke across the band
    const strokes = [];
    for (const it of its) {
      const q = strokes.at(-1), e = q?.pts.at(-1);
      if (q && Math.hypot(it.pts[0][0] - e[0], it.pts[0][1] - e[1]) <= HOLO2.lift) q.pts.push(...it.pts);
      else strokes.push({ pts: it.pts.slice(), lane: pic.pitch, cell: it.cell, key: `${line.key}:${k}` });
    }
    batches.push({ puddles, items: its, dabs: puddles.length, strokes });
  });
  const puddles = batches.flatMap(B => B.puddles), strokes = batches.flatMap(B => B.strokes);
  return { dabs: puddles.length, cells: items.length, puddles, strokes, batches, items, mm: strokes.reduce((t, q) => t + lineLen(q.pts), 0),
    flatMm: items.reduce((t, it) => t + it.flatMm, 0), flats: items.filter(it => it.flatMm > it.len / 2).length };
}

// the whole list's work, every line its numbers and its time (est.: a dab sDab s, the drag at `speed`); o.marks: every jar's line its MARKS
// first (besideOf's, 'off' or 'on' the canvas), a dip and its marks, sDab s the first, MARKS_BESIDE.sMark every next — HOLO's
export function planOf(pic, o = {}) {
  const sDab = o.sDab ?? HOLO2.sDab, speed = o.speed ?? HOLO2.speed;
  const M = o.marks ? besideOf(pic, o.marks === true ? 'off' : o.marks).marks : null;
  return seqOf(pic).map((line, i) => {
    const w = workOf(pic, line, o), marks = M?.[i] ?? [], sm = marks.length ? sDab + (marks.length - 1) * MARKS_BESIDE.sMark : 0;
    return { ...line, ...w, marks, seconds: w.dabs * sDab + w.mm / speed + sm };
  });
}

// the moves in their order, for ▶ Play and the LCD: a jar's marks, then a group's dabs, then its snake; every move its time, s (est.)
export function movesOf(lines, o = {}) {
  const sDab = o.sDab ?? HOLO2.sDab, speed = o.speed ?? HOLO2.speed, out = [];
  let t = 0;
  lines.forEach((L, li) => {
    (L.marks ?? []).forEach((m, i) => out.push({ kind: 'mark', line: li, batch: 0, no: m.no, side: m.side, at: m.at, pts: m.pts, from: t, to: (t += i ? MARKS_BESIDE.sMark : sDab) }));
    L.batches.forEach((B, bi) => {
      for (const p of B.puddles) out.push({ kind: 'dab', line: li, batch: bi, at: [p.x, p.y], u: p.u, dabs: p.dabs, from: t, to: (t += p.dabs * sDab) });
      for (const q of B.strokes) out.push({ kind: 'drag', line: li, batch: bi, run: L.run, pts: q.pts, mm: lineLen(q.pts), lane: q.lane, from: t, to: (t += lineLen(q.pts) / speed) });
    });
  });
  return out;
}
// the polyline from its start to `s` mm along it
export function along(pts, s) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const d = len(pts[i - 1], pts[i]);
    if (s <= d) { const f = d ? s / d : 0; out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f]); return out; }
    s -= d; out.push(pts[i]);
  }
  return out;
}

// ---------- LAYER 1 · LAYER 2 on the machine, as HOLO's RUN 1 · RUN 2 (holoplan.js's runsOf) ----------
// A line: after the change of jar its MARKS, one dip for them all; then a group at a time: its dabs, every one a dip of its own and HOLO's mark —
// the brush down there, HOLO2.mark mm along X, upright, centred on the puddle, the way its lane goes there — then its snake, no dip, one run,
// the brush down from end to end, whatever the way (the owner's horizontal strokes on paper first). The J3 compensation and the moves the page's.
// lines: planOf's, from Start from on → [{ pass, num, pts, say, dip, idle: false, beyond, mark?, dab? }]
export function runsOf(lines, o = {}) {
  const leg = o.mark ?? HOLO2.mark, out = [];
  lines.forEach((L, k) => {
    (L.marks ?? []).forEach((m, i) => out.push({ pass: k, num: 0, pts: m.pts, say: `mark ${m.no}, the ${m.side} slip`, dip: i === 0, idle: false, beyond: true, mark: m.no }));
    let num = 0;
    L.batches.forEach((B, bi) => {
      const tag = `group ${bi + 1}/${L.batches.length}`, first = num + 1;
      B.puddles.forEach((p, j) => out.push({ pass: k, num: first, pts: [[p.x, p.y - p.u[1] * leg / 2], [p.x, p.y + p.u[1] * leg / 2]], say: `${tag} · a dab ${j + 1}/${B.puddles.length}`, dip: true, idle: false, beyond: true, dab: true }));
      num += B.items.length;
      const flats = B.items.filter(it => it.flatMm > it.len / 2).length;
      B.strokes.forEach((q, j) => out.push({ pass: k, num: first, pts: q.pts, say: `${tag} · the snake${B.strokes.length > 1 ? ` ${j + 1}/${B.strokes.length}` : ''}, ${B.items.length} lanes${flats ? `, ${flats} mostly horizontal` : ''}, no dip`, dip: false, idle: false, beyond: true }));
    });
  });
  return out;
}

// DRAW BW's lines: the generator's — where the paint meets the bare canvas, or the bands' ends across the ribbon too
export function contourHolo2(pic, o = {}) {
  const lines = (o.outline ? pic.contour?.outline : pic.contour?.all) ?? [];
  return { lines, mm: lines.reduce((t, l) => t + lineLen(l), 0), pieces: lines.length };
}
