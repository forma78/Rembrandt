// HOLO2's plan (2026-11-20): HOLO's two layers, the brush along the owner's route, as ST-JOHN's loops. The owner: "the brush goes back and
// forth without a stop, now and then going down on a diagonal or a short way left or right. These horizontal lines are the most dangerous:
// the paint may not lay there, our brush is flat. We draw the horizontal lines all the same, but on paper in the canvas's place, and test";
// "the principle Layer 1, Layer 2 … the blues and the whites in one layer, the red and the yellow in the other"; of a plan of hundreds of
// short snakes read off the drawing: "this is complicated and long. Let us do it as in ST-JOHN … only we taught the machine to put the
// drops itself"; "the brush must drive without a stop"; "we need even lines".
//
// A picture, app/holo2/<id>.json, made by HOLO2/generator/holo2_route.py off his route (HOLO2/01.png … 05.png, drawn stage by stage) and the
// colours of his drawing (HOLO2/Untitled-19.png):
//   { id, title, sub, version, composition: 'route', w, h, pitch, field, image, after1, est, count,
//     jars: [{ id, name, number, hex, L, layer, seen, note, run1_dabs, run2_dabs, spokes, band_mm }],   // run1_dabs: Layer 1's (HOLO's words)
//     route: [[x, y]],                       // the route's middle, smoothed
//     lanes: [[[x, y], …], …],               // the brush's way: lane 1 forward, lane 2 back … each the route moved a pitch aside, in that order
//     bands: [{ jar, s0, s1 }],              // the colours along the route, mm from its start
//     spokes: [{ s, jar, dabs: [[x, y, ux, uy], …] }],   // a row of dabs across the ribbon, one a lane, the lane's way at it
//     contour: { outline, all } }
// mm from the canvas's bottom left corner, x right (the machine's Y), y up (its X), as HOLO's.
//
// The list: Layer 1's jars light to dark, each its spokes' dabs (a dip and HOLO's mark a dab), then Layer 1's DRAG — the whole snake, no dip,
// the brush down from its start to its end; Layer 2 the same on the dry first. HOLO's MARKS and place (holoplan.js). Every number est.

import { seqOf as jarSeqOf, besideOf, MARKS_BESIDE, placeRange, WALL } from './holoplan.js';
export { besideOf, MARKS_BESIDE, placeRange, WALL };

export const HOLO2_LIB = ['holo2-19'];
// est.: HOLO's mark of 8 mm a dab; 9 s a dab; the brush along the drag, mm/s; `flat`, the horizontal stretches within so many degrees of the
// canvas's horizontal (the machine's Y), the flat brush's danger
export const HOLO2 = { mark: 8, sDab: 9, speed: 25, flat: 30 };

const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
export const lineLen = pts => pts.slice(1).reduce((t, p, i) => t + len(pts[i], p), 0);
// a stretch of line within `flat` degrees of the horizontal: along the machine's Y, where the flat brush may not lay the paint (the owner)
export const isFlat = (a, b, flat = HOLO2.flat) => Math.abs(b[1] - a[1]) < Math.sin(flat * Math.PI / 180) * (len(a, b) || 1);
const flatMmOf = (pts, flat) => pts.slice(1).reduce((t, q, i) => t + (isFlat(pts[i], q, flat) ? len(pts[i], q) : 0), 0);
// the lanes end to end, the brush down from one's end to the next's start
export const snakeOf = pic => pic.lanes.flat();

// the list: a layer's jars light to dark (holoplan.js's seqOf, a jar a line, its key `${id}:${layer}`), then its DRAG
export function seqOf(pic) {
  const out = [];
  for (const run of [1, 2]) {
    const J = jarSeqOf(pic).filter(q => q.run === run);
    if (!J.length) continue;
    out.push(...J.map(q => ({ ...q, kind: 'dabs' })), { kind: 'drag', key: `drag:${run}`, jar: null, run, name: `Layer ${run} · DRAG`, hex: '#24221F', L: 0,
      note: 'the whole snake, no dip: lane after lane through the puddles, the brush down from start to end' });
  }
  return out;
}

// a line of the list into its work. A jar's: its spokes in the route's order, a spoke's dabs across the ribbon in turn this way and that,
// every dab a puddle — one batch, no stroke. A DRAG: one stroke, the snake; its lanes the items (BACK ONE JAR's and the remote's cells).
// → { dabs, cells, puddles: [{ x, y, dabs, u }], strokes: [{ pts, lane }], batches: [{ puddles, strokes, items, dabs }], items, mm, flatMm }
export function workOf(pic, line, o = {}) {
  const flat = o.flat ?? HOLO2.flat;
  if (line.kind === 'drag') {
    const items = pic.lanes.map((pts, cell) => ({ cell, pts, len: lineLen(pts), flatMm: flatMmOf(pts, flat), puddles: [] }));
    const stroke = { pts: snakeOf(pic), lane: pic.pitch, cell: 0, key: line.key };
    return { dabs: 0, cells: items.length, puddles: [], strokes: [stroke], batches: [{ puddles: [], strokes: [stroke], items, dabs: 0 }], items,
      mm: lineLen(stroke.pts), flatMm: items.reduce((t, it) => t + it.flatMm, 0), flats: items.filter(it => it.flatMm > it.len / 2).length };
  }
  const items = pic.spokes.filter(sp => sp.jar === line.jar).sort((a, b) => a.s - b.s).map((sp, cell) => {
    const ds = cell % 2 ? sp.dabs.slice().reverse() : sp.dabs;
    return { cell, s: sp.s, pts: ds.map(d => [d[0], d[1]]), len: 0, flatMm: 0, puddles: ds.map(([x, y, ux, uy]) => ({ x, y, dabs: 1, u: [ux, uy] })) };
  });
  const puddles = items.flatMap(it => it.puddles);
  return { dabs: puddles.length, cells: items.length, puddles, strokes: [], batches: [{ puddles, strokes: [], items, dabs: puddles.length }], items, mm: 0, flatMm: 0, flats: 0 };
}

// the whole list's work, every line its numbers and its time (est.: a dab sDab s, the drag at `speed`); o.marks: every jar's line its MARKS
// first (besideOf's, 'off' or 'on' the canvas), a dip and its marks, sDab s the first, MARKS_BESIDE.sMark every next — HOLO's
export function planOf(pic, o = {}) {
  const sDab = o.sDab ?? HOLO2.sDab, speed = o.speed ?? HOLO2.speed;
  const M = o.marks ? besideOf(pic, o.marks === true ? 'off' : o.marks).marks : null, byKey = new Map(jarSeqOf(pic).map((q, i) => [q.key, M?.[i] ?? []]));
  return seqOf(pic).map(line => {
    const w = workOf(pic, line, o), marks = line.kind === 'dabs' ? byKey.get(line.key) ?? [] : [], sm = marks.length ? sDab + (marks.length - 1) * MARKS_BESIDE.sMark : 0;
    return { ...line, ...w, marks, seconds: w.dabs * sDab + w.mm / speed + sm };
  });
}

// the moves in their order, for ▶ Play and the LCD: a jar's marks, then its dabs; a DRAG its snake; every move its time, s (est.)
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
// A jar's line: after the change of jar its MARKS, one dip for them all; then every dab a dip of its own and HOLO's mark — the brush down
// there, HOLO2.mark mm along its lane, centred on the puddle, the way the drag will go. The DRAG's line: the snake, one run, no dip, the brush
// down from end to end, whatever the way (the owner's horizontal strokes on paper first). The J3 compensation and the moves are the page's.
// lines: planOf's, from Start from on → [{ pass, num, pts, say, dip, idle: false, beyond, mark?, dab? }]
export function runsOf(lines, o = {}) {
  const leg = o.mark ?? HOLO2.mark, out = [];
  lines.forEach((L, k) => {
    (L.marks ?? []).forEach((m, i) => out.push({ pass: k, num: 0, pts: m.pts, say: `mark ${m.no}, the ${m.side} slip`, dip: i === 0, idle: false, beyond: true, mark: m.no }));
    if (L.kind === 'drag') {
      const n = L.items.length;
      out.push({ pass: k, num: 1, pts: L.strokes[0].pts, say: `the snake, ${n} lanes, ${(L.mm / 1000).toFixed(1)} m, no dip`, dip: false, idle: false, beyond: true });
      return;
    }
    L.items.forEach((it, i) => it.puddles.forEach((p, j) => out.push({ pass: k, num: i + 1, pts: [[p.x - p.u[0] * leg / 2, p.y - p.u[1] * leg / 2], [p.x + p.u[0] * leg / 2, p.y + p.u[1] * leg / 2]],
      say: `row ${i + 1}/${L.items.length} · a dab ${j + 1}/${it.puddles.length}`, dip: true, idle: false, beyond: true, dab: true })));
  });
  return out;
}

// DRAW BW's lines: the generator's — where the paint meets the bare canvas, or the bands' ends across the ribbon too
export function contourHolo2(pic, o = {}) {
  const lines = (o.outline ? pic.contour?.outline : pic.contour?.all) ?? [];
  return { lines, mm: lines.reduce((t, l) => t + lineLen(l), 0), pieces: lines.length };
}
