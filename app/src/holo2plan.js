// HOLO2's plan (2026-11-20): HOLO's two layers, the brush along ribbons, lane by lane, as a road's markings. The owner: "the brush goes back and forth without a stop, now and
// then going down on a diagonal or a short way left or right. These horizontal lines are the most dangerous: the paint may not lay there,
// our brush is flat. We draw the horizontal lines all the same, but on paper in the canvas's place, and test: we photograph, study and
// correct the fragments of the brush's way that fail." What stays from HOLO: "the principle Layer 1, Layer 2. Yellow mixes with blue and
// gives mud, so the blues and the whites go in one layer, the red and the yellow in the other"; the same day: "what matters is the
// principle of two layers, two runs — the blues and white, then the red and yellow, once the first has dried."
//
// A picture, app/holo2/<id>.json, made by HOLO2/generator/holo2_gen.py off the owner's drawing (HOLO2/Untitled-19.png):
//   { id, title, sub, version, w, h, pitch, field: { x0, x1, y0, y1 }, image, after1, est, count,
//     jars: [{ id, name, number, hex, L, layer, seen, note, run1_dabs, run2_dabs, mm }],   // run1_dabs: Layer 1's, run2_dabs: Layer 2's (HOLO's words)
//     snakes: [{ jar, legs: [[x0, y0, x1, y1, …], …] }],   // a colour's band of a ribbon: its lanes in the brush's order, each a line along the
//                                                          // ribbon, the brush down from one's end to the next's start, a few mm aside
//     contour: { outline: [[[x, y], …]], all: [[[x, y], …]] } }
// mm from the canvas's bottom left corner, x right (the machine's Y), y up (its X), as HOLO's.
//
// HOLO's list, MARKS and place (holoplan.js's seqOf, besideOf, placeRange): a line a jar, Layer 1's light to dark, then Layer 2's on the dry first.
// The owner, the same day, of the first try, its strokes across the ribbons: "the stripes must run along, as the markings of a road, not as the
// boards of a fence or sleepers" (HOLO2/Untitled-20.png). A line's work: its snakes a group at a time — its puddles first, a dab on a leg's start
// every so often, then the snake over them, no dip: along a lane, a few mm aside to the next, back along it. Every number est.

import { seqOf, besideOf, MARKS_BESIDE, placeRange, WALL } from './holoplan.js';
export { seqOf, besideOf, MARKS_BESIDE, placeRange, WALL };

export const HOLO2_LIB = ['holo2-19'];
// est.: a dab along the line (HOLO's 55 mm, its `a_dab_lasts`), HOLO's mark of 8 mm the dab, `inset` from the piece's start; a group a
// snake, `group` dabs at most (FORM-G's area: 80 drops, ≈ 14 min, under the owner's 20 of open time); 9 s a dab; the brush along a stroke;
// `flat` the horizontal strokes, within so many degrees of the canvas's horizontal (the machine's Y), the flat brush's danger
export const HOLO2 = { lasts: 55, mark: 8, inset: 4, group: 80, sDab: 9, speed: 25, flat: 30 };

const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
// a stretch of line within `flat` degrees of the horizontal: along the machine's Y, where the flat brush may not lay the paint (the owner)
export const isFlat = (a, b, flat = HOLO2.flat) => Math.abs(b[1] - a[1]) < Math.sin(flat * Math.PI / 180) * (len(a, b) || 1);
const pairs = flat => Array.from({ length: flat.length / 2 }, (_, i) => [flat[2 * i], flat[2 * i + 1]]);
// the point `s` mm along a line and its way there
function pointOn(pts, s) {
  for (let i = 1; i < pts.length; i++) {
    const d = len(pts[i - 1], pts[i]);
    if (s <= d || i === pts.length - 1) { const f = d ? Math.min(1, s / d) : 0, u = [(pts[i][0] - pts[i - 1][0]) / (d || 1), (pts[i][1] - pts[i - 1][1]) / (d || 1)];
      return { p: [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f], u }; }
    s -= d;
  }
  return { p: pts[0], u: [0, 1] };
}

// a line of the list into its work. → { dabs, cells, puddles: [{ x, y, dabs, u }], strokes: [{ pts, cell, key, lane }], batches: [{ puddles,
// strokes, items, dabs }], items: [{ cell, pts, len, flatMm, puddles }], mm, flatMm, flats }
// A snake's legs in its order; a dab on a leg's start, `inset` in, on a group's first leg and then whenever `lasts` mm of line has gone since
// the last (half the leg counted, `lasts` at most), and every `lasts` mm along a long leg; a group closes when its dabs reach `group`, the next
// leg a group of its own, on a dab. A group's stroke: its legs end to end, the brush down from one to the next.
export function workOf(pic, line, o = {}) {
  const lasts = o.lasts ?? pic.est?.a_dab_lasts ?? HOLO2.lasts, group = o.group ?? HOLO2.group, inset = HOLO2.inset, flat = o.flat ?? HOLO2.flat;
  const items = [], batches = [];
  const dab = (it, s) => { const q = pointOn(it.pts, s); it.puddles.push({ x: Math.round(q.p[0] * 100) / 100, y: Math.round(q.p[1] * 100) / 100, dabs: 1, u: q.u }); };
  for (const S of pic.snakes) {
    if (S.jar !== line.jar) continue;
    let B = null, since = 0;
    for (const leg of S.legs) {
      const pts = pairs(leg), L = lineLen(pts);
      const it = { cell: items.length, pts, len: L, flatMm: pts.slice(1).reduce((t, q, i) => t + (isFlat(pts[i], q, flat) ? len(pts[i], q) : 0), 0), puddles: [] };
      // its dabs: on its start when due, then every `lasts` mm along it; a leg whose dabs would take its group past `group` starts the next
      const at = from => { const first = from === null || from + Math.min(L, lasts) / 2 >= lasts, s0 = first ? 0 : from, out = first ? [Math.min(inset, L / 2)] : [];
        for (let s = lasts - s0; s < L - 1e-9; s += lasts) out.push(s); return { first, s0, out }; };
      let D = at(B ? since : null);
      if (B && D.out.length && B.dabs + D.out.length > group) { B = null; D = at(null); }
      if (!B) { batches.push(B = { puddles: [], items: [], dabs: 0 }); }
      for (const s of D.out) dab(it, s);
      since = D.s0;
      since = (since + L) % lasts;
      B.items.push(it); B.puddles.push(...it.puddles); B.dabs += it.puddles.length;
      items.push(it);
    }
  }
  batches.forEach((B, k) => { B.strokes = [{ pts: B.items.flatMap(it => it.pts), cell: B.items[0].cell, key: `${line.key}:${k}`, lane: pic.pitch }]; });
  const puddles = items.flatMap(it => it.puddles), strokes = batches.flatMap(B => B.strokes);
  return { dabs: puddles.length, cells: items.length, puddles, strokes, batches, items, mm: strokes.reduce((t, s) => t + lineLen(s.pts), 0),
    flatMm: items.reduce((t, it) => t + it.flatMm, 0), flats: items.filter(it => it.flatMm > it.len / 2).length };
}
export const lineLen = pts => pts.slice(1).reduce((t, p, i) => t + len(pts[i], p), 0);

// the whole list's work, every line its numbers and its time (est.: a dab sDab s, a stroke at `speed`); o.marks: every line its MARKS first
// (besideOf's, 'off' or 'on' the canvas), a dip and its marks, sDab s the first, MARKS_BESIDE.sMark every next — HOLO's
export function planOf(pic, o = {}) {
  const sDab = o.sDab ?? HOLO2.sDab, speed = o.speed ?? HOLO2.speed, M = o.marks ? besideOf(pic, o.marks === true ? 'off' : o.marks).marks : null;
  return seqOf(pic).map((line, i) => {
    const w = workOf(pic, line, o), marks = M?.[i] ?? [], sm = marks.length ? sDab + (marks.length - 1) * MARKS_BESIDE.sMark : 0;
    return { ...line, ...w, marks, seconds: w.dabs * sDab + w.mm / speed + sm };
  });
}

// the moves in their order, for ▶ Play and the LCD: a line's marks, then a group's dabs, then its snake; every move its time, s (est.)
export function movesOf(lines, o = {}) {
  const sDab = o.sDab ?? HOLO2.sDab, speed = o.speed ?? HOLO2.speed, out = [];
  let t = 0;
  lines.forEach((L, li) => {
    (L.marks ?? []).forEach((m, i) => out.push({ kind: 'mark', line: li, batch: 0, no: m.no, side: m.side, at: m.at, pts: m.pts, from: t, to: (t += i ? MARKS_BESIDE.sMark : sDab) }));
    L.batches.forEach((B, bi) => {
      for (const p of B.puddles) out.push({ kind: 'dab', line: li, batch: bi, at: [p.x, p.y], u: p.u, dabs: p.dabs, from: t, to: (t += p.dabs * sDab) });
      for (const q of B.strokes) out.push({ kind: 'drag', line: li, batch: bi, pts: q.pts, mm: lineLen(q.pts), lane: q.lane, from: t, to: (t += lineLen(q.pts) / speed) });
    });
  });
  return out;
}
// a point `s` mm along a polyline, and the polyline up to it
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
// A line: after a change of jar its MARKS, one dip for them all; then a group at a time its puddles, every dab a dip of its own and HOLO's
// mark — the brush down there, HOLO2.mark mm along the lane, centred on the puddle, the way the snake will go — then that group's snake,
// no dip, one run: along a lane, a few mm aside to the next, back along it … the brush down from end to end, whatever the way (the owner's
// horizontal strokes on paper first). No idle run. The J3 compensation and the moves are the page's (holo2.js).
// lines: planOf's, from Start from on → [{ pass, num, pts, say, dip, idle: false, beyond, mark?, dab? }]
export function runsOf(lines, o = {}) {
  const leg = o.mark ?? HOLO2.mark, out = [];
  lines.forEach((L, k) => {
    (L.marks ?? []).forEach((m, i) => out.push({ pass: k, num: 0, pts: m.pts, say: `mark ${m.no}, the ${m.side} slip`, dip: i === 0, idle: false, beyond: true, mark: m.no }));
    let num = 0;
    L.batches.forEach((B, bi) => {
      const tag = `group ${bi + 1}/${L.batches.length}`, first = num + 1;
      for (const it of B.items) {
        num++;
        for (const p of it.puddles) out.push({ pass: k, num, pts: [[p.x - p.u[0] * leg / 2, p.y - p.u[1] * leg / 2], [p.x + p.u[0] * leg / 2, p.y + p.u[1] * leg / 2]],
          say: `${tag} · leg ${num} · a dab`, dip: true, idle: false, beyond: true, dab: true });
      }
      const n = B.items.length, flats = B.items.filter(it => it.flatMm > it.len / 2).length;
      out.push({ pass: k, num: first, pts: B.strokes[0].pts, say: `${tag} · legs ${first}–${num} · the snake, ${n} leg${n === 1 ? '' : 's'}${flats ? `, ${flats} horizontal` : ''}, no dip`, dip: false, idle: false, beyond: true });
    });
  });
  return out;
}

// DRAW BW's lines (HOLO's): the generator's — where the paint meets the bare canvas, or every border between two colours too, each once
export function contourHolo2(pic, o = {}) {
  const lines = (o.outline ? pic.contour?.outline : pic.contour?.all) ?? [];
  return { lines, mm: lines.reduce((t, l) => t + lineLen(l), 0), pieces: lines.length };
}
