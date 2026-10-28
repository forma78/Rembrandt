// DACHE's plan — BLEND in coloured pencils, on paper (the owner, 2026-10-27,
// DACHE/, after CARAN D'ACHE: "I will not squeeze paint on the canvas, I will
// simply use coloured pencils"; "from the Result we make the base for the
// rendering that follows: many rectangles and cubes"; "an imitation of real
// drawing by hand, one line 1 mm"; "the lines go up and down, that is how the
// colour gains brightness on paper. It does not go back through the air. If
// the line is 4 mm, up and down four times").
//
// The Result — BLEND's digital painting, inkaplan.js's simOf, the Preview on
// DACHE — is the colour, BLEND's keys the geometry. Between every two keys
// of a blend, in its core and in a tile: the pencil's lines PITCH apart
// across all of the gap on every side and corner (the owner, 2026-10-27,
// Screenshot 12.09.03 PM: the top "sagged" where 16.5 mm lay between A and
// Key 2), every line its own colour off the Preview a sample every half mm —
// the brush's grooves, the stripes of the old television's grid — a piece
// shorter than the Shortest to its neighbour. The bands: the blend's own
// loops, Steps of them between every two keys; a core's and a tile's rings,
// Step apart. Where a line crosses a sausage, the sausage's own paint, a
// coat more: its square, as the Preview shows the paint thick there (the
// owner, the same day, Screenshot 12.36.17 PM: "these small squares are the
// sausages' traces from Drag — you need not invent them, only take them
// into the algorithm; the squares lie exactly where the sausages are").
// A module: a stretch of a line of one pencil — on a side a piece of a
// trapezoid, its ends the rays from key to key (the owner: "rays of a more
// global geometric figure"), in a corner a piece of a ring; for Across and
// Cross, the lines of one band side by side over the same stretch, one
// module. The pencil up and down with it on the paper — Along, from a line
// on to its neighbour where they touch; Across; Cross, both — Coats times
// over. One pencil a pass, the lightest first, the order the owner's to
// change; the light ones, white, only over another pencil's module, last.
// Every pass ends with the pencil on the paper, a p-pause: the next one in
// the holder, its tip on the paper.
//
// mm from the canvas's bottom left corner, x right, y up. Lines and arcs. No DOM.

import { de2000, labOf, machinePiece, sausagesOf, GROUND, CORNER_NEW, STEP_NEW } from './inkaplan.js';
import { PAINT } from './tapeplan.js';
import { SAUSAGE_W } from './ccdplan.js';
import { isBlend, keysOf } from './blendplan.js';
import { linOf, toLin, toSrgb, isHex, normHex } from './color.js';

export const PITCH = 1;                                              // mm, a pencil's line and line to line (the owner: "one line 1 mm"; est.)
export const HATCHES = ['along', 'across', 'cross'];                 // stroke.png: horizontal, vertical, cross stroke
export const COATS_NEW = 1, COATS_MIN = 1, COATS_MAX = 4;            // a module's lines so many times over, up and down
export const SHORTEST_NEW = 2, SHORTEST_MIN = 0.5, SHORTEST_MAX = 30;  // mm along a line: a shorter piece of colour goes to its neighbour; 2, a sausage's square stays (est.)
export const SPEED_NEW = 40, SPEED_MIN = 5, SPEED_MAX = 120;         // mm/s with the pencil on the paper (est.)
export const COVER = 0.7;                                            // of the paper one coat of lines PITCH apart covers (est.)
export const KL = 2;                                                 // which pencil: by hue and chroma first, the lightness half (CIEDE2000's kL, est.); its tone then by all of it
export const LIGHT_OVER = 0.35;                                      // a light pencil over another: so much of the way to its own colour (est.)
export const JOIN_MM = 1.5;                                          // the next module this near: on to it, the pencil on the paper (est.)
const SAMPLE_MM = 0.5;                                               // a colour every half mm along a line
const ARC_MIN_R = 1, ARC_MIN_L = 0.5;                                // mm: a smaller arc goes as its chord
const fin = Number.isFinite, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;

// ---------- the pencil box ----------
// Eleven at first (the owner, 2026-10-27): blue, sky blue, orange, yellow,
// two greens — grass and emerald — ochre, brown, grey, white "and black: we
// close the base at once". Their colours est., till read off a stroke card;
// brand and number his to fill (Caran d'Ache Museum Aquarelle, Winsor &
// Newton, Prismacolor). White a light one: "its effect only together with
// another colour", over another, last.
export const BOX_2 = [
  { id: 'carmine', name: 'Carmine Red', code: 'PC 926', brand: 'Prismacolor', hex: '#C2213A' },
  { id: 'tuscan', name: 'Tuscan Red', code: 'PC 937', brand: 'Prismacolor', hex: '#7A2D2E' },
  { id: 'darkgreen', name: 'Dark Green', code: 'PC 908', brand: 'Prismacolor', hex: '#1F5A3E' },
  { id: 'burntochre', name: 'Burnt Ochre', code: 'PC 943', brand: 'Prismacolor', hex: '#9B5530' },
  { id: 'indigo', name: 'Indigo Blue', code: 'PC 901', brand: 'Prismacolor', hex: '#2E3060' },
];
// light ones, near white, for the Preview's white paint and its pale grooves —
// cream, pale peach, pale aqua, about a quarter of his blend (the owner,
// 2026-10-27: "I am sure something near white can be taken from the 72";
// his choice) — Prismacolor's, their colours est.
export const BOX_3 = [
  { id: 'peach', name: 'Peach', code: 'PC 939', brand: 'Prismacolor', hex: '#F2B48F' },
  { id: 'lightpeach', name: 'Light Peach', code: 'PC 927', brand: 'Prismacolor', hex: '#F5D5C0' },
  { id: 'sand', name: 'Sand', code: 'PC 940', brand: 'Prismacolor', hex: '#E6CFA6' },
  { id: 'coolgrey20', name: '20% Cool Grey', code: 'PC 1060', brand: 'Prismacolor', hex: '#C9CDD0' },
  { id: 'warmgrey20', name: '20% Warm Grey', code: 'PC 1051', brand: 'Prismacolor', hex: '#CFC9BF' },
];
// and the next of his light ones, the same day — his White is PC 938
export const BOX_4 = [
  { id: 'chartreuse', name: 'Yellow Chartreuse', code: 'PC 1004', brand: 'Prismacolor', hex: '#D9DC45' },
  { id: 'cloudblue', name: 'Cloud Blue', code: 'PC 1023', brand: 'Prismacolor', hex: '#C3DAEA' },
  { id: 'puttybeige', name: 'Putty Beige', code: 'PC 1083', brand: 'Prismacolor', hex: '#D3C4AA' },
  { id: 'gingerroot', name: 'Ginger Root', code: 'PC 1084', brand: 'Prismacolor', hex: '#E3C6A2' },
  { id: 'cream', name: 'Cream', code: 'PC 914', brand: 'Prismacolor', hex: '#F3E5B9' },
  { id: 'frenchgrey20', name: '20% French Grey', code: 'PC 1069', brand: 'Prismacolor', hex: '#CEC8BC' },
];
export const PENCILS_NEW = [
  { id: 'yellow', name: 'Yellow', hex: '#F2C21E' },
  { id: 'ochre', name: 'Ochre', hex: '#C68F36' },
  { id: 'orange', name: 'Orange', hex: '#EB7325' },
  { id: 'grass', name: 'Grass Green', hex: '#5E9D3B' },
  { id: 'sky', name: 'Sky Blue', hex: '#58A5D7' },
  { id: 'emerald', name: 'Emerald Green', hex: '#13866A' },
  { id: 'grey', name: 'Grey', hex: '#8B8A86' },
  { id: 'blue', name: 'Blue', hex: '#244F9D' },
  { id: 'brown', name: 'Brown', hex: '#6A3D28' },
  { id: 'black', name: 'Black', hex: '#232323' },
  { id: 'white', name: 'White', code: 'PC 938', brand: 'Prismacolor', hex: '#FBFAF6', light: true },
  // darker ones, for the sausages' squares above all (the owner, 2026-10-27:
  // "we can take another pencil for the squares … we have 72 colours, just
  // give the squares darker pencils"), and his red — Prismacolor's names
  // and numbers, their colours est.
  ...BOX_2,
  ...BOX_3,
  ...BOX_4,
];
// as kept: { id, name, hex, brand, code, light, on, dark: the pencil its squares are drawn with, '' to choose }
export function cleanPencils(raw) {
  const out = [], seen = new Set();
  for (const q of Array.isArray(raw) ? raw : []) {
    if (!q || typeof q.id !== 'string' || !q.id || seen.has(q.id) || !isHex(q.hex)) continue;
    seen.add(q.id);
    out.push({ id: q.id, name: String(q.name || q.id).slice(0, 40), hex: normHex(q.hex), brand: String(q.brand ?? '').slice(0, 40), code: String(q.code ?? '').slice(0, 20), light: !!q.light, on: q.on !== false, dark: typeof q.dark === 'string' ? q.dark : '' });
  }
  return out.length ? out : PENCILS_NEW.map(q => cleanPencils([q])[0]);
}
export const lightnessOf = hex => labOf(linOf(hex))[0];
// The pencils in use in the run's order: the owner's, those he has not
// placed light to dark after them; the light ones always last, over the rest
export function runOrder(pencils, order = []) {
  const on = pencils.filter(p => p.on), at = id => { const i = order.indexOf(id); return i < 0 ? Infinity : i; };
  const sort = list => list.sort((a, b) => at(a.id) - at(b.id) || lightnessOf(b.hex) - lightnessOf(a.hex));
  return [...sort(on.filter(p => !p.light)), ...sort(on.filter(p => p.light))];
}
const hexOf = lin => '#' + lin.map(v => Math.round(clamp(toSrgb(clamp(v, 0, 1)), 0, 1) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
export const PAPER = GROUND.map(v => toLin(v / 255));
// What a module may look like: the paper; a pencil, Coats coats of COVER
// over it, or a coat more — its two tones, the Preview's stripes lighter and
// darker in one colour (the owner, 2026-10-27: "no colour goes as a solid
// block"); a pencil and a light one over it (est.)
export function candidatesOf(pencils, coats = COATS_NEW, cover = COVER) {
  const on = (lin, c) => { const cov = 1 - (1 - cover) ** c; return PAPER.map((v, k) => v + (lin[k] - v) * cov); };
  const own = pencils.filter(p => p.on && !p.light), lights = pencils.filter(p => p.on && p.light), out = [{ own: null, light: null, coats: 0, lin: PAPER }];
  for (const p of own) {
    const a = on(linOf(p.hex), coats);
    out.push({ own: p.id, light: null, coats, lin: a }, { own: p.id, light: null, coats: coats + 1, lin: on(linOf(p.hex), coats + 1) });
    for (const l of lights) { const L = linOf(l.hex); out.push({ own: p.id, light: l.id, coats, lin: a.map((v, k) => v + (L[k] - v) * LIGHT_OVER) }); }
  }
  return out.map(q => ({ ...q, lab: labOf(q.lin), hex: hexOf(q.lin) }));
}

// ---------- the geometry: regions, shapes between their keys ----------
// A region: an outer shape a and an inner one b, rounded rectangles
// { x0, y0, x1, y1, c }; a shape at t between them, as the blend's steps. A
// blend's every two keys; its core, filled, and a tile, down to their middle
// line — every side the same way in, the rings concentric.
const boxOf = q => ({ x0: q.x, y0: q.y, x1: q.x + q.w, y1: q.y + q.h, c: q.c });
const middleOf = s => { const m = Math.min(s.x1 - s.x0, s.y1 - s.y0) / 2; return { x0: s.x0 + m, y0: s.y0 + m, x1: s.x1 - m, y1: s.y1 - m, c: 0 }; };
export function regionsOf(rects, o = {}) {
  const out = [];
  rects.forEach((r, i) => {
    if (isBlend(r)) {
      const K = keysOf(r).map(boxOf);
      for (let k = 0; k + 1 < K.length; k++) out.push({ rect: i, kind: 'blend', key: k, a: K[k], b: K[k + 1], loops: r.steps + 1 });
      if (r.core) out.push({ rect: i, kind: 'core', key: K.length - 1, a: K.at(-1), b: middleOf(K.at(-1)), step: r.step ?? STEP_NEW });
    } else {
      const s = boxOf({ ...r, c: o.corner ?? CORNER_NEW });
      out.push({ rect: i, kind: 'tile', key: 0, a: s, b: middleOf(s), step: r.step ?? STEP_NEW });
    }
  });
  return out;
}
export const shapeAt = (R, t) => ({ x0: lerp(R.a.x0, R.b.x0, t), y0: lerp(R.a.y0, R.b.y0, t), x1: lerp(R.a.x1, R.b.x1, t), y1: lerp(R.a.y1, R.b.y1, t), c: lerp(R.a.c, R.b.c, t) });
const rOf = s => Math.max(0, Math.min(s.c, (s.x1 - s.x0) / 2, (s.y1 - s.y0) / 2));
// A shape's eight pieces, anticlockwise from the bottom side's left end: the
// sides 0 bottom, 2 right, 4 top, 6 left; the corners 1 bottom right, 3 top
// right, 5 top left, 7 bottom left — f from 0 to 1 along each
const CORNER = { 1: [1, 0, -90], 3: [1, 1, 0], 5: [0, 1, 90], 7: [0, 0, 180] };
const centreOf = (s, p) => { const r = rOf(s), [ix, iy] = CORNER[p]; return [ix ? s.x1 - r : s.x0 + r, iy ? s.y1 - r : s.y0 + r]; };
export function pointOn(s, p, f) {
  const r = rOf(s);
  if (p === 0) return [lerp(s.x0 + r, s.x1 - r, f), s.y0];
  if (p === 2) return [s.x1, lerp(s.y0 + r, s.y1 - r, f)];
  if (p === 4) return [lerp(s.x1 - r, s.x0 + r, f), s.y1];
  if (p === 6) return [s.x0, lerp(s.y1 - r, s.y0 + r, f)];
  const c = centreOf(s, p), a = (CORNER[p][2] + 90 * f) * Math.PI / 180;
  return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];
}
export function pieceLength(s, p) {
  const r = rOf(s);
  return p === 0 || p === 4 ? Math.max(0, s.x1 - s.x0 - 2 * r) : p === 2 || p === 6 ? Math.max(0, s.y1 - s.y0 - 2 * r) : r * Math.PI / 2;
}
// A shape's line on piece p from f0 to f1, as inkaplan.js's pieces: a line,
// or an arc — its chord where too small to send as one
export function lineOn(s, p, f0, f1) {
  const a = pointOn(s, p, f0), b = pointOn(s, p, f1);
  if (p % 2 === 0) return { t: 'L', a, b };
  const r = rOf(s);
  if (r < ARC_MIN_R || r * Math.PI / 2 * Math.abs(f1 - f0) < ARC_MIN_L) return { t: 'L', a, b };
  return { t: 'A', a, b, c: centreOf(s, p), r, left: f1 > f0 };
}
// A band's width on a piece, mm: on a side the keys' sides' distance apart,
// in a corner across its middle
export function widthOn(R, p, ta, tb) {
  const A = shapeAt(R, ta), B = shapeAt(R, tb);
  if (p === 0) return Math.abs(B.y0 - A.y0);
  if (p === 2) return Math.abs(B.x1 - A.x1);
  if (p === 4) return Math.abs(B.y1 - A.y1);
  if (p === 6) return Math.abs(B.x0 - A.x0);
  const u = pointOn(A, p, 0.5), v = pointOn(B, p, 0.5);
  return Math.hypot(v[0] - u[0], v[1] - u[1]);
}
const gapsOf = R => [Math.abs(R.b.y0 - R.a.y0), Math.abs(R.b.x1 - R.a.x1), Math.abs(R.b.y1 - R.a.y1), Math.abs(R.b.x0 - R.a.x0)];
// the bands: a blend's loops between two keys, a core's or a tile's rings Step apart
export const bandsOf = R => R.loops ?? Math.max(1, Math.round(Math.max(...gapsOf(R)) / R.step));
// lines in a band so wide: as many as it holds PITCH apart, one in half a pitch, none in less
export const linesIn = w => w < PITCH / 2 ? 0 : Math.max(1, Math.round(w / PITCH));

// ---------- the colour: the Result, sampled ----------
// res: { nx, ny, h, data: RGBA bytes, row 0 the canvas's top } — the Result's grid (simOf, rgba)
const LIN = Float32Array.from({ length: 256 }, (_, i) => toLin(i / 255));
function sample(res, x, y, acc) {
  const ix = Math.floor(x / res.h), iy = Math.floor(y / res.h);
  if (ix < 0 || iy < 0 || ix >= res.nx || iy >= res.ny) return 0;
  const q = 4 * ((res.ny - 1 - iy) * res.nx + ix);
  acc[0] += LIN[res.data[q]]; acc[1] += LIN[res.data[q + 1]]; acc[2] += LIN[res.data[q + 2]];
  return 1;
}
// The nearest candidate to a colour (linear light), kept by its 5-bit sRGB.
// Which pencil — or the paper — by the nearest of the pencil's own colour
// and its tones on the paper, ΔE 2000 with kL: its hue and chroma first, so
// a dark olive is an ochre, not black (the owner's first look, 2026-10-27),
// and a pale peach an orange, not grey. Then its tone by the lightness against the
// pencil's own: the Preview's paint is darker and fuller than any pencil on
// paper, so its stripes go by how much darker or lighter than the pencil they
// are — darker by DARK_DL a coat more, lighter by TINT_DL the light one over
// it — not all into the darkest tone, one block (the same day, 12.24.10 PM).
// The paper only where the Preview is next to white — within PAPER_DE, or
// lighter than PAPER_L with less chroma than PAPER_C: the white paint's
// lightest stripes; its faint cream, grey and blue grooves the light
// pencils' (the same day, 12.24.10 PM, fragment 2: the white U round the
// core went bare; then the owner's light ones from his 72).
export const DARK_DL = 4, TINT_DL = 14, PAPER_DE = 6, PAPER_L = 94, PAPER_C = 12;            // L*, L*, ΔE, L*, C* (est.)
function nearestOf(C, kL = KL, pencils = []) {
  const memo = new Map(), own = [...new Set(C.filter(q => q.own).map(q => q.own))], base = Math.min(...C.filter(q => q.own).map(q => q.coats));
  const ids = [null, ...own], labs = ids.map(id => id ? labOf(linOf(pencils.find(p => p.id === id)?.hex ?? C.find(q => q.own === id).hex)) : C[0].lab);
  const sets = ids.map((id, i) => id ? [labs[i], ...C.filter(q => q.own === id).map(q => q.lab)] : [labs[0]]);
  const tone = (id, c, light) => C.findIndex(q => q.own === id && q.coats === c && !!q.light === light);
  return lin => {
    const s = lin.map(v => Math.round(clamp(toSrgb(clamp(v, 0, 1)), 0, 1) * 31)), key = (s[0] << 10) | (s[1] << 5) | s[2];
    let k = memo.get(key);
    if (k === undefined) {
      const lab = labOf(s.map(v => toLin(v / 31)));
      let bd = Infinity, b = 0;
      if (!(de2000(lab, labs[0]) < PAPER_DE || (lab[0] >= PAPER_L && Math.hypot(lab[1], lab[2]) < PAPER_C)) || own.length === 0) sets.forEach((set, i) => { if (!i && own.length) return; for (const l of set) { const d = de2000(lab, l, kL); if (d < bd) { bd = d; b = i; } } });
      const id = ids[b], dL = id ? lab[0] - labs[b][0] : 0;
      k = !id ? 0 : dL < -DARK_DL ? tone(id, base + 1, false) : dL > TINT_DL && tone(id, base, true) >= 0 ? tone(id, base, true) : tone(id, base, false);
      memo.set(key, k);
    }
    return k;
  };
}
// Runs of one candidate along a line; a run shorter than `shortest` mm goes
// to its longer neighbour, the shortest first. -1, outside the frame, never
// takes one nor goes to one; nor does a sausage's square (sq, a flag a
// sample), a run of its own whatever its length. ks: a candidate a sample, L: mm a sample
export function runsOf(ks, L, shortest, sq = null) {
  const runs = [];
  ks.forEach((k, i) => { const q = runs.at(-1), s = !!sq?.[i]; if (q && q.k === k && q.sq === s) { q.i1 = i; q.L += L; } else runs.push({ k, sq: s, i0: i, i1: i, L }); });
  const fixed = new Set(runs.filter(q => q.sq));
  for (;;) {
    let j = -1;
    runs.forEach((q, i) => { if (q.k >= 0 && q.L < shortest - 1e-9 && !fixed.has(q) && (j < 0 || q.L < runs[j].L)) j = i; });
    if (j < 0) break;
    const A = runs[j - 1], B = runs[j + 1], ok = q => q && q.k >= 0 && !q.sq, to = ok(A) && ok(B) ? (A.L >= B.L ? A : B) : ok(A) ? A : ok(B) ? B : null;
    if (!to) { fixed.add(runs[j]); continue; }
    to.L += runs[j].L; to.i0 = Math.min(to.i0, runs[j].i0); to.i1 = Math.max(to.i1, runs[j].i1);
    runs.splice(j, 1);
    for (let i = runs.length - 1; i > 0; i--) if (runs[i].k === runs[i - 1].k && runs[i].sq === runs[i - 1].sq) { runs[i - 1].i1 = runs[i].i1; runs[i - 1].L += runs[i].L; if (fixed.has(runs[i])) fixed.add(runs[i - 1]); runs.splice(i, 1); }
  }
  return runs;
}

// ---------- the modules ----------
// The sausages, in cells of a grid: is a point under one, and whose paint
function sausageGrid(rects, cell = 10) {
  const cells = new Map(), R = SAUSAGE_W / 2, list = rects.some(r => Array.isArray(r.ss)) ? sausagesOf(rects.map(r => ({ ...r, ss: r.ss ?? [] }))) : [];
  list.forEach((q, i) => {
    for (let x = Math.floor((Math.min(q.a[0], q.b[0]) - R) / cell); x <= Math.floor((Math.max(q.a[0], q.b[0]) + R) / cell); x++)
      for (let y = Math.floor((Math.min(q.a[1], q.b[1]) - R) / cell); y <= Math.floor((Math.max(q.a[1], q.b[1]) + R) / cell); y++) { const k = `${x},${y}`; if (!cells.has(k)) cells.set(k, []); cells.get(k).push(i); }
  });
  return {
    list,
    at(x, y) {                                                                              // the last laid on top
      let got = null;
      for (const i of cells.get(`${Math.floor(x / cell)},${Math.floor(y / cell)}`) ?? []) {
        const q = list[i], v = [q.b[0] - q.a[0], q.b[1] - q.a[1]], l2 = v[0] ** 2 + v[1] ** 2, t = l2 ? clamp(((x - q.a[0]) * v[0] + (y - q.a[1]) * v[1]) / l2, 0, 1) : 0;
        if (Math.hypot(x - q.a[0] - t * v[0], y - q.a[1] - t * v[1]) <= R && (got === null || i > got)) got = i;
      }
      return got === null ? null : list[got];
    },
  };
}
// A sausage's squares (the owner, 2026-10-27: "the squares lie exactly
// where the sausages are"): on a line, where it crosses a sausage, the
// samples darker than the line just outside it, or of another colour — the
// paint left thick under the brush's grooves, as the Preview shows it, about
// half of every loop — a run of their own, never merged away. Drawn with a
// darker pencil (the owner, the same day: "it is not paint — just give the
// squares darker pencils"): the one set for the line's pencil (Squares
// with), else of those SQ_DARKER darker than it the nearest to the square in
// the Preview, ΔE 2000 as it is; none within SQ_FAR, the line's own. Hatched Cross, whatever the
// lines' hatch: along and back, then across, the pencil on the paper; one
// line wide, along and back twice (the owner, the same day: "a cross stroke,
// as stroke.png — first back and forth without a lift, then left and right;
// or just back and forth not 4 times but 8. A double hatch for the squares,
// more intense").
export const SQUARE_DL = 4, SQ_DARKER = 6, SQ_FAR = 30;                                  // L*, L*, ΔE (est.)
// o: { pencils, coats, shortest, frame: { x0, y0, x1, y1 } or null, corner, cover, kL }
// → { regions, candidates, modules: [{ reg, band, p, j, fa, fb, ta, tb (what its line covers), ts: [its line], n: 1, len, w, k, own, light, coats, sq }], paints }
export function modulesOf(rects, res, o = {}) {
  const pencils = o.pencils ?? cleanPencils(PENCILS_NEW), coats = o.coats ?? COATS_NEW, shortest = o.shortest ?? SHORTEST_NEW, F = o.frame;
  const regions = regionsOf(rects, o), C = candidatesOf(pencils, coats, o.cover ?? COVER), near = nearestOf(C, o.kL ?? KL, pencils), modules = [], G = sausageGrid(rects);
  const solid = id => C.findIndex(q => q.own === id && !q.light && q.coats === coats), pL = id => labOf(linOf(pencils.find(p => p.id === id).hex)), own = pencils.filter(p => p.on && !p.light);
  const squareK = (lin, refK) => {                                                          // a square's pencil: set, or the nearest darker one
    const ref = C[refK]?.own, set = ref && pencils.find(p => p.id === ref)?.dark;
    if (set && solid(set) >= 0) return solid(set);
    const lab = labOf(lin), Lr = ref ? pL(ref)[0] : 101;
    let b = null, bd = SQ_FAR;
    for (const p of own) { const l = pL(p.id); if (l[0] > Lr - SQ_DARKER) continue; const d = de2000(lab, l); if (d < bd) { bd = d; b = p.id; } }
    return b ? solid(b) : refK;
  };
  const inFrame = (x, y) => !F || (x >= F.x0 && x <= F.x1 && y >= F.y0 && y <= F.y1);
  regions.forEach((R, reg) => {
    const nb = bandsOf(R);
    for (let p = 0; p < 8; p++) {
      const N = linesIn(widthOn(R, p, 0, 1)), ns = Math.max(1, Math.round(Math.max(pieceLength(R.a, p), pieceLength(R.b, p)) / SAMPLE_MM));   // one grid along for all its lines: their pieces' ends on the same rays
      for (let j = 0; j < N; j++) {
        const t = (j + 0.5) / N, L = shapeAt(R, t), len = pieceLength(L, p);
        if (len < SAMPLE_MM) continue;
        const T = [shapeAt(R, t - 0.25 / N), shapeAt(R, t + 0.25 / N)], ks = [], ls = [], lins = [], under = [], sq = [];
        for (let i = 0; i < ns; i++) {
          const f = (i + 0.5) / ns, m = pointOn(L, p, f);
          under.push(G.at(m[0], m[1]) ? 1 : 0);
          if (!inFrame(m[0], m[1])) { ks.push(-1); ls.push(0); continue; }
          const acc = [0, 0, 0]; let got = 0;
          for (const sh of T) { const q = pointOn(sh, p, f); got += sample(res, q[0], q[1], acc); }
          const lin = got ? acc.map(v => v / got) : PAPER;
          ks.push(near(lin)); ls.push(labOf(lin)[0]); lins[i] = lin;
        }
        for (let i = 0; i < ns;) {                                                          // every stretch under a sausage against the line just outside it
          if (!under[i]) { sq.push(0); i++; continue; }
          let e = i; while (e < ns && under[e]) e++;
          const out = [...Array.from({ length: 4 }, (_, q) => i - 1 - q), ...Array.from({ length: 4 }, (_, q) => e + q)].filter(q => q >= 0 && q < ns && !under[q] && ks[q] >= 0);
          const refL = out.length ? out.reduce((a, q) => a + ls[q], 0) / out.length : null, refK = out.length ? ks[out[0]] : null;
          for (let q = i; q < e; q++) {
            const is = ks[q] >= 0 && refL !== null && (ls[q] < refL - SQUARE_DL || ks[q] !== refK);
            if (is && ls[q] < refL - SQUARE_DL) ks[q] = squareK(lins[q], refK);                // darker than the line round it: a darker pencil
            sq.push(is ? 1 : 0);
          }
          i = e;
        }
        for (const q of runsOf(ks, len / ns, shortest, sq)) {
          const c = C[q.k];
          if (q.k <= 0 || !c?.own) continue;                                                // outside the frame, or the paper
          modules.push({ reg, band: Math.min(nb - 1, Math.floor(t * nb)), p, j, fa: q.i0 / ns, fb: (q.i1 + 1) / ns, ta: t - 0.5 / N, tb: t + 0.5 / N, ts: [t], n: 1, len: q.L, w: widthOn(R, p, 0, 1) / N, k: q.k, own: c.own, light: c.light, coats: c.coats, sq: q.sq });
        }
      }
    }
  });
  const used = [...new Set(G.list.map(q => q.paint))], paintK = id => near(linOf(PAINT[id]?.hex ?? '#FFFFFF'));
  return { regions, candidates: C, modules, paints: used.map(id => ({ paint: id, own: C[paintK(id)].own, de: de2000(labOf(linOf(PAINT[id]?.hex ?? '#FFFFFF')), C[paintK(id)].lab) })) };
}
// For Across and Cross, a module of several lines: a band's lines of one
// pencil side by side over the same stretch — its stretches where no line's
// colour changes, joined on along while the lines stay the same
export function cellsOf(modules) {
  const groups = new Map(), out = [];
  for (const M of modules) { const key = `${M.reg}/${M.band}/${M.p}`; if (!groups.has(key)) groups.set(key, []); groups.get(key).push(M); }
  for (const list of groups.values()) {
    const cuts = [...new Set(list.flatMap(M => [M.fa, M.fb]))].sort((a, b) => a - b);
    let open = new Map();
    for (let c = 0; c + 1 < cuts.length; c++) {
      const f0 = cuts[c], f1 = cuts[c + 1], mid = (f0 + f1) / 2, here = list.filter(M => M.fa < mid && M.fb > mid).sort((a, b) => a.j - b.j), sets = [], next = new Map();
      for (const M of here) { const g = sets.at(-1); if (g && g.M.k === M.k && g.M.sq === M.sq && M.j === g.js.at(-1) + 1) { g.js.push(M.j); g.ts.push(M.ts[0]); } else sets.push({ M, js: [M.j], ts: [M.ts[0]] }); }
      for (const g of sets) {
        const key = `${g.M.k}|${g.M.sq}|${g.js.join(',')}`, was = open.get(key), per = g.M.len / (g.M.fb - g.M.fa);
        if (was && Math.abs(was.fb - f0) < 1e-12) { was.fb = f1; was.len += per * (f1 - f0); next.set(key, was); continue; }
        const half = (g.M.tb - g.M.ta) / 2, m = { ...g.M, j: g.js[0], fa: f0, fb: f1, ts: g.ts, n: g.ts.length, ta: g.ts[0] - half, tb: g.ts.at(-1) + half, len: per * (f1 - f0) };
        out.push(m); next.set(key, m);
      }
      open = next;
    }
  }
  return out;
}
// A pencil with next to nothing to draw — less line than LEAST_MM, or than
// LEAST_SHARE of all of it on a small piece — is left out, its modules to the
// nearest of those with enough: no change of pencil for a few specks (on
// IMG_1554 in HDay warm, grey's 3 modules, emerald's 4; est.). Those keep
// what they had and only gain, so none of them falls short in its turn.
export const LEAST_MM = 300, LEAST_SHARE = 0.005;
export function pencilPlan(rects, res, o = {}) {
  const pencils = o.pencils ?? cleanPencils(PENCILS_NEW), D = modulesOf(rects, res, { ...o, pencils }), mm = new Map();
  for (const M of D.modules) for (const id of [M.own, M.light]) if (id) mm.set(id, (mm.get(id) ?? 0) + M.n * M.len * (M.coats ?? o.coats ?? COATS_NEW));
  const least = Math.min(o.least ?? LEAST_MM, LEAST_SHARE * [...mm.values()].reduce((a, v) => a + v, 0)), few = [...mm].filter(([, v]) => v < least).map(([id]) => id);
  if (!few.length) return { ...D, few };
  return { ...modulesOf(rects, res, { ...o, pencils: pencils.map(p => (mm.get(p.id) ?? 0) >= least ? p : { ...p, on: false }) }), few };
}
// a module's outline, for the Modules view: its inner side, its end, its outer side back, canvas mm
export function outlineOf(R, M) {
  const A = shapeAt(R, M.ta), B = shapeAt(R, M.tb), n = M.p % 2 ? Math.max(2, Math.ceil(M.len / 2)) : 1, pts = [];
  for (let i = 0; i <= n; i++) pts.push(pointOn(A, M.p, lerp(M.fa, M.fb, i / n)));
  for (let i = n; i >= 0; i--) pts.push(pointOn(B, M.p, lerp(M.fa, M.fb, i / n)));
  return pts;
}

// a module's lines, as the Pencil view draws them: every one of its lines from its fa end to its fb end
export const moduleLines = (R, M) => M.ts.map(t => lineOn(shapeAt(R, t), M.p, M.fa, M.fb));
// ---------- a module's hatch: the pencil up and down in it ----------
const flip = g => g.t === 'L' ? { t: 'L', a: g.b, b: g.a } : { ...g, a: g.b, b: g.a, left: !g.left };
const gap = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
export const lineLen = g => g.t === 'L' ? gap(g.a, g.b) : g.r * Math.abs(Math.atan2((g.a[0] - g.c[0]) * (g.b[1] - g.c[1]) - (g.a[1] - g.c[1]) * (g.b[0] - g.c[0]), (g.a[0] - g.c[0]) * (g.b[0] - g.c[0]) + (g.a[1] - g.c[1]) * (g.b[1] - g.c[1])));
// pieces one after another, a short line between where one ends and the next begins
export function chain(list) {
  const out = [];
  for (const g of list) {
    const e = out.at(-1)?.b;
    if (e && gap(e, g.a) > 1e-6) out.push({ t: 'L', a: e, b: g.a });
    out.push(g);
  }
  return out.filter(g => lineLen(g) > 1e-6);
}
// Along: every line the module's length, the next back, PITCH over; Across:
// strokes from its inner line to its outer, PITCH apart along it, the next
// back (a band of one line has none: Along); Cross: Along, then Across from
// where it ended. Coats: the whole again, back over itself. From the module's
// fa end, or its fb end. → canvas pieces, continuous
export function hatchOf(R, M, hatch = 'along', coats = 1, fromB = false) {
  const ts = M.ts ?? Array.from({ length: M.n }, (_, m) => M.ta + (m + 0.5) / M.n * (M.tb - M.ta)), S = ts.map(t => shapeAt(R, t));
  const [f0, f1] = fromB ? [M.fb, M.fa] : [M.fa, M.fb];
  const along = () => S.map((s, m) => m % 2 ? lineOn(s, M.p, f1, f0) : lineOn(s, M.p, f0, f1));
  const across = (start, fwd) => {
    const cnt = Math.max(1, Math.round(M.len / PITCH)), out = [], first = S[0], last = S.at(-1);
    for (let k = 0; k < cnt; k++) {
      const f = lerp(fwd ? f0 : f1, fwd ? f1 : f0, (k + 0.5) / cnt), a = pointOn(first, M.p, f), b = pointOn(last, M.p, f);
      out.push((k % 2 === 0) === start ? { t: 'L', a, b } : { t: 'L', a: b, b: a });
    }
    return out;
  };
  let one;
  if (hatch === 'across' && M.n > 1) one = across(true, true);
  else if (hatch === 'cross' && M.n > 1) one = [...along(), ...across(false, M.n % 2 === 0)];   // Along ends on its last line, at f0 (n even) or f1: Across from there
  else one = along();
  if (hatch === 'cross' && M.n === 1) coats *= 2;                                         // one line: Cross is along it and back, twice over
  const once = chain(one), all = [...once];
  for (let c = 1; c < coats; c++) all.push(...(c % 2 ? once.slice().reverse().map(flip) : once));
  return chain(all);
}

// ---------- the run: a pass a pencil ----------
// Its modules, the light ones' too, nearest next from where the last ended —
// either end first — on with the pencil on the paper to one JOIN_MM away,
// else up and over to it; a stroke the pencil down from landing to lift.
// o: { hatch, coats, cw, ch } → { passes: [{ pencil, strokes: [canvas pieces], modules, mm }] }
export function passesOf(plan, order, o = {}) {
  const hatch = o.hatch ?? 'along', coats = o.coats ?? COATS_NEW, passes = [], lines = plan.modules.filter(M => !M.sq);
  const all = [...(hatch === 'along' ? lines : cellsOf(lines)), ...cellsOf(plan.modules.filter(M => M.sq)).map(M => ({ ...M, hatch: 'cross', coats }))];   // a sausage's square Cross, at Coats
  let at = [0, 0];                                                                          // home: the canvas's bottom left corner, near enough
  for (const pc of order) {
    const mine = all.filter(M => pc.light ? M.light === pc.id : M.own === pc.id);
    if (!mine.length) continue;
    const ends = mine.map(M => { const R = plan.regions[M.reg], s = shapeAt(R, M.ts?.[0] ?? M.ta + 0.5 / M.n * (M.tb - M.ta)); return [pointOn(s, M.p, M.fa), pointOn(s, M.p, M.fb)]; });
    const G = gridOf(ends), strokes = [];
    let cur = null, mm = 0;
    for (let left = mine.length; left > 0; left--) {
      const [i, e] = G.nearest(at);
      G.take(i);
      const pieces = hatchOf(plan.regions[mine[i].reg], mine[i], mine[i].hatch ?? hatch, mine[i].coats ?? coats, e === 1);   // its tone: Coats, or a coat more
      if (cur && gap(at, pieces[0].a) <= JOIN_MM) cur.push(...chain([{ t: 'L', a: at, b: pieces[0].a }]), ...pieces);
      else strokes.push(cur = [...pieces]);
      at = pieces.at(-1).b;
    }
    for (const s of strokes) for (const g of s) mm += lineLen(g);
    passes.push({ pencil: pc.id, strokes: strokes.map(chain), modules: mine.length, mm });
  }
  return passes;
}
// The modules' ends in cells of a grid, the nearest one found ring by ring
export function gridOf(ends, cell = 20) {
  const cells = new Map(), key = (x, y) => `${Math.floor(x / cell)},${Math.floor(y / cell)}`, taken = new Uint8Array(ends.length);
  ends.forEach((E, i) => E.forEach((p, e) => { const k = key(p[0], p[1]); if (!cells.has(k)) cells.set(k, []); cells.get(k).push([i, e]); }));
  let left = ends.length;
  return {
    take: i => { if (!taken[i]) { taken[i] = 1; left--; } },
    nearest(p) {
      const cx = Math.floor(p[0] / cell), cy = Math.floor(p[1] / cell);
      let best = null, bd = Infinity;
      for (let r = 0; left > 0; r++) {
        if (best && (r - 1) * cell > bd) break;
        for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          for (const [i, e] of cells.get(`${cx + dx},${cy + dy}`) ?? []) {
            if (taken[i]) continue;
            const d = gap(p, ends[i][e]);
            if (d < bd) { bd = d; best = [i, e]; }
          }
        }
        if (r > 4000) break;
      }
      return best;
    },
  };
}
// The rows for strokes.js's plotRun, machine mm from Here, a stroke a row,
// the last of every pass but the last ending with the pencil on the paper
// (tailOut 0); info: a row's pencil, for the LCD and its swatch
export function drawRows(passes, pencils, o) {
  const ps = [], info = [], byId = Object.fromEntries(pencils.map(p => [p.id, p]));
  passes.forEach((P, k) => P.strokes.forEach((s, j) => {
    const row = ps.length + 1, last = j === P.strokes.length - 1 && k < passes.length - 1;
    ps.push(s.map((g, i) => ({ ...machinePiece(g, o), tilt: 0, row, ...(last && i === s.length - 1 ? { tailOut: 0 } : {}) })));
    info.push({ label: `${k + 1}/${passes.length} · ${byId[P.pencil]?.name ?? P.pencil}`, pencil: P.pencil, pass: k, L: s.reduce((a, g) => a + lineLen(g), 0) });
  }));
  return { ps, info };
}
export const changeWhy = (pencils, passes, k) => {
  const p = pencils.find(q => q.id === passes[k].pencil), was = k ? pencils.find(q => q.id === passes[k - 1].pencil) : null, nm = q => `${q.name}${q.code ? ` ${q.code}` : ''}`;
  return `Pencil ${k + 1} of ${passes.length}: ${nm(p)} — ${was ? `${nm(was)} out, ${nm(p)} in,` : 'in the holder,'} its tip on the paper; then Continue`;
};
// plotRun's blocks with the pencil changes: before the first row, the pencil
// down over its start for the first one to go in; after the last row of every
// pass, where the pencil stands on the paper, before it lifts — p-pause. Every
// pencil goes in with the elbow at the same pose, o.at (0° at first), its tip
// on the paper: o.press, a pass pressed below it (PRISMA's and OPM's
// Pressure, -1.4°), comes back up to it first, or the next pencil went in
// pressed and drew with no pressure at all (2026-10-27, the night of OPM)
export function withChanges(blocks, D, pencils, passes, o = {}) {
  const IN = `J 2 ${o.at ?? 0}`;
  const firstRow = new Map(), lastRow = new Map();
  D.info.forEach((q, i) => { if (!firstRow.has(q.pass)) firstRow.set(q.pass, i + 1); lastRow.set(q.pass, i + 1); });
  const out = [], start = firstRow.get(0);
  let begun = false;
  blocks.forEach((b, i) => {
    const next = blocks[i + 1];
    if (b.kind === 'arm' && /^J 2 /.test(b.cmd) && blocks[i - 1]?.kind === 'move' && /^F /.test(blocks[i - 1].cmds[0])) {   // a row's lift, after its drawing move — not the hover after a travel
      const k = [...lastRow].find(([, r]) => r === b.row)?.[0];
      if (k !== undefined && k + 1 < passes.length && blocks[i - 1].row === b.row) out.push(...(o.press ? [{ kind: 'arm', cmd: IN, row: b.row }] : []), { kind: 'p-pause', why: changeWhy(pencils, passes, k + 1), row: b.row, pencil: passes[k + 1].pencil });
    }
    out.push(b);
    if (!begun && b.kind === 'move' && b.row === start && /^T /.test(b.cmds[0]) && next) {   // over the first module's start: down, the first pencil in
      begun = true;
      out.push({ kind: 'arm', cmd: IN, row: start }, { kind: 'p-pause', why: changeWhy(pencils, passes, 0), row: start, pencil: passes[0].pencil });
    }
  });
  return out;
}
// ---------- the reading ----------
export function tallyOf(passes) {
  return passes.map(P => ({ pencil: P.pencil, modules: P.modules, strokes: P.strokes.length, mm: P.mm }));
}
export const cleanFrame = f => f && [f.x0, f.y0, f.x1, f.y1].every(fin) && f.x1 - f.x0 >= 1 && f.y1 - f.y0 >= 1 ? { x0: f.x0, y0: f.y0, x1: f.x1, y1: f.y1 } : null;
