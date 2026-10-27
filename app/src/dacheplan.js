// DACHE's plan — BLEND in coloured pencils, on paper (the owner, 2026-10-27,
// DACHE/, after CARAN D'ACHE: "I will not squeeze paint on the canvas, I will
// simply use coloured pencils"; "from the Result we make the base for the
// rendering that follows: many rectangles and cubes"; "an imitation of real
// drawing by hand, one line 1 mm"; "the lines go up and down, that is how the
// colour gains brightness on paper. It does not go back through the air. If
// the line is 4 mm, up and down four times").
//
// The Result — BLEND's digital painting, inkaplan.js's simOf — is the colour,
// BLEND's keys the geometry. Between every two keys of a blend, in its core
// and in a tile: bands, shapes evenly between the outer key and the inner one
// as the blend's own loops are, Stroke lines wide where the keys lie furthest
// apart (DACHE/stroke.png, 1 … 4). On every side and corner the lines PITCH
// apart across all of the keys' gap there, shared out to the bands — a narrow
// side's band has a line or none, never a sliver of paper left between them
// (the owner, 2026-10-27, Screenshot 12.09.03 PM: the top "sagged", 16.5 mm
// between his A and Key 2 there, 76 bands of 0.22 mm, none with a line). A
// band is cut along where the Result's
// colour turns to another pencil, and at its sides' and corners' ends: a
// module — on a side a trapezoid, its ends rays from key to key (the owner:
// "the blocks a kind of trapezoid, rays of a more global geometric figure"),
// in a corner a piece of a ring. In a module the pencil's lines PITCH apart,
// as many as its width holds, up and down with the pencil on the paper —
// Along it, Across it, or both, Cross — Coats times over. One pencil a pass,
// the lightest first, the order the owner's to change; the light ones, white,
// only over another pencil's module, last. Every pass ends with the pencil on
// the paper, a p-pause: the next one in the holder, its tip on the paper.
//
// mm from the canvas's bottom left corner, x right, y up. Lines and arcs. No DOM.

import { de2000, labOf, machinePiece, GROUND, CORNER_NEW } from './inkaplan.js';
import { isBlend, keysOf } from './blendplan.js';
import { linOf, toLin, toSrgb, isHex, normHex } from './color.js';

export const PITCH = 1;                                              // mm, a pencil's line and line to line (the owner: "one line 1 mm"; est.)
export const STROKE_NEW = 2, STROKE_MIN = 1, STROKE_MAX = 4;         // lines a band across where the keys lie furthest apart (stroke.png 1 … 4)
export const HATCHES = ['along', 'across', 'cross'];                 // stroke.png: horizontal, vertical, cross stroke
export const COATS_NEW = 1, COATS_MIN = 1, COATS_MAX = 4;            // a module's lines so many times over, up and down
export const SHORTEST_NEW = 4, SHORTEST_MIN = 1, SHORTEST_MAX = 30;  // mm along: a shorter piece of colour goes to its neighbour (est.)
export const SPEED_NEW = 40, SPEED_MIN = 5, SPEED_MAX = 120;         // mm/s with the pencil on the paper (est.)
export const COVER = 0.7;                                            // of the paper one coat of lines PITCH apart covers (est.)
export const LIGHT_OVER = 0.35;                                      // a light pencil over another: so much of the way to its own colour (est.)
export const JOIN_MM = 1.5;                                          // the next module this near: on to it, the pencil on the paper (est.)
const SAMPLE_MM = 1;                                                 // a colour every mm along a band
const ARC_MIN_R = 1, ARC_MIN_L = 0.5;                                // mm: a smaller arc goes as its chord
const fin = Number.isFinite, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;

// ---------- the pencil box ----------
// Eleven at first (the owner, 2026-10-27): blue, sky blue, orange, yellow,
// two greens — grass and emerald — ochre, brown, grey, white "and black: we
// close the base at once". Their colours est., till read off a stroke card;
// brand and number his to fill (Caran d'Ache Museum Aquarelle, Winsor &
// Newton, Prismacolor). White a light one: "its effect only together with
// another colour", over another, last.
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
  { id: 'white', name: 'White', hex: '#FBFAF6', light: true },
];
// as kept: { id, name, hex, brand, code, light, on }
export function cleanPencils(raw) {
  const out = [], seen = new Set();
  for (const q of Array.isArray(raw) ? raw : []) {
    if (!q || typeof q.id !== 'string' || !q.id || seen.has(q.id) || !isHex(q.hex)) continue;
    seen.add(q.id);
    out.push({ id: q.id, name: String(q.name || q.id).slice(0, 40), hex: normHex(q.hex), brand: String(q.brand ?? '').slice(0, 40), code: String(q.code ?? '').slice(0, 20), light: !!q.light, on: q.on !== false });
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
// over it; a pencil and a light one over it (est.)
export function candidatesOf(pencils, coats = COATS_NEW) {
  const cov = 1 - (1 - COVER) ** coats, on = lin => PAPER.map((v, k) => v + (lin[k] - v) * cov);
  const own = pencils.filter(p => p.on && !p.light), lights = pencils.filter(p => p.on && p.light), out = [{ own: null, light: null, lin: PAPER }];
  for (const p of own) {
    const a = on(linOf(p.hex));
    out.push({ own: p.id, light: null, lin: a });
    for (const l of lights) { const L = linOf(l.hex); out.push({ own: p.id, light: l.id, lin: a.map((v, k) => v + (L[k] - v) * LIGHT_OVER) }); }
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
      for (let k = 0; k + 1 < K.length; k++) out.push({ rect: i, kind: 'blend', key: k, a: K[k], b: K[k + 1] });
      if (r.core) out.push({ rect: i, kind: 'core', key: K.length - 1, a: K.at(-1), b: middleOf(K.at(-1)) });
    } else {
      const s = boxOf({ ...r, c: o.corner ?? CORNER_NEW });
      out.push({ rect: i, kind: 'tile', key: 0, a: s, b: middleOf(s) });
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
function lineOn(s, p, f0, f1) {
  const a = pointOn(s, p, f0), b = pointOn(s, p, f1);
  if (p % 2 === 0) return { t: 'L', a, b };
  const r = rOf(s);
  if (r < ARC_MIN_R || r * Math.PI / 2 * Math.abs(f1 - f0) < ARC_MIN_L) return { t: 'L', a, b };
  return { t: 'A', a, b, c: centreOf(s, p), r, left: f1 > f0 };
}
// A band's width on a piece, mm: on a side the keys' sides' distance apart,
// in a corner across its middle
function widthOn(R, p, ta, tb) {
  const A = shapeAt(R, ta), B = shapeAt(R, tb);
  if (p === 0) return Math.abs(B.y0 - A.y0);
  if (p === 2) return Math.abs(B.x1 - A.x1);
  if (p === 4) return Math.abs(B.y1 - A.y1);
  if (p === 6) return Math.abs(B.x0 - A.x0);
  const u = pointOn(A, p, 0.5), v = pointOn(B, p, 0.5);
  return Math.hypot(v[0] - u[0], v[1] - u[1]);
}
const gapsOf = R => [Math.abs(R.b.y0 - R.a.y0), Math.abs(R.b.x1 - R.a.x1), Math.abs(R.b.y1 - R.a.y1), Math.abs(R.b.x0 - R.a.x0)];
export const bandsOf = (R, stroke) => Math.max(1, Math.round(Math.max(...gapsOf(R)) / (stroke * PITCH)));
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
// the nearest candidate to a colour (linear light), ΔE 2000, kept by its 5-bit sRGB
function nearestOf(C) {
  const memo = new Map();
  return lin => {
    const s = lin.map(v => Math.round(clamp(toSrgb(clamp(v, 0, 1)), 0, 1) * 31)), key = (s[0] << 10) | (s[1] << 5) | s[2];
    let k = memo.get(key);
    if (k === undefined) {
      const lab = labOf(s.map(v => toLin(v / 31)));
      let bd = Infinity; k = 0;
      C.forEach((q, i) => { const d = de2000(lab, q.lab); if (d < bd) { bd = d; k = i; } });
      memo.set(key, k);
    }
    return k;
  };
}
// Runs of one candidate along a piece; a run shorter than `shortest` mm goes
// to its longer neighbour, the shortest first. -1, outside the frame, never
// takes one nor goes to one. ks: a candidate a sample, L: mm a sample
export function runsOf(ks, L, shortest) {
  const runs = [];
  ks.forEach((k, i) => { const q = runs.at(-1); if (q && q.k === k) { q.i1 = i; q.L += L; } else runs.push({ k, i0: i, i1: i, L }); });
  const fixed = new Set();
  for (;;) {
    let j = -1;
    runs.forEach((q, i) => { if (q.k >= 0 && q.L < shortest - 1e-9 && !fixed.has(q) && (j < 0 || q.L < runs[j].L)) j = i; });
    if (j < 0) break;
    const A = runs[j - 1], B = runs[j + 1], ok = q => q && q.k >= 0, to = ok(A) && ok(B) ? (A.L >= B.L ? A : B) : ok(A) ? A : ok(B) ? B : null;
    if (!to) { fixed.add(runs[j]); continue; }
    to.L += runs[j].L; to.i0 = Math.min(to.i0, runs[j].i0); to.i1 = Math.max(to.i1, runs[j].i1);
    runs.splice(j, 1);
    for (let i = runs.length - 1; i > 0; i--) if (runs[i].k === runs[i - 1].k) { runs[i - 1].i1 = runs[i].i1; runs[i - 1].L += runs[i].L; if (fixed.has(runs[i])) fixed.add(runs[i - 1]); runs.splice(i, 1); }
  }
  return runs;
}

// ---------- the modules ----------
// o: { pencils, coats, stroke, shortest, frame: { x0, y0, x1, y1 } or null, corner }
// → { regions, candidates, modules: [{ reg, band, p, fa, fb, ta, tb (what its lines cover), ts (its lines), n, len, w, k, own, light }] }
export function modulesOf(rects, res, o = {}) {
  const pencils = o.pencils ?? cleanPencils(PENCILS_NEW), coats = o.coats ?? COATS_NEW, stroke = o.stroke ?? STROKE_NEW, shortest = o.shortest ?? SHORTEST_NEW, F = o.frame;
  const regions = regionsOf(rects, o), C = candidatesOf(pencils, coats), near = nearestOf(C), modules = [];
  const inFrame = (x, y) => !F || (x >= F.x0 && x <= F.x1 && y >= F.y0 && y <= F.y1);
  regions.forEach((R, reg) => {
    const nb = bandsOf(R, stroke);
    for (let p = 0; p < 8; p++) {
      const N = linesIn(widthOn(R, p, 0, 1)), all = Array.from({ length: N }, (_, j) => (j + 0.5) / N);   // the piece's lines across the whole gap
      for (let b = 0; b < nb; b++) {
        const ts = all.filter(t => t >= b / nb && t < (b + 1) / nb);
        if (!ts.length) continue;
        const ta = ts[0] - 0.5 / N, tb = ts.at(-1) + 0.5 / N, M = shapeAt(R, (ta + tb) / 2), T = [0.17, 0.5, 0.83].map(q => shapeAt(R, lerp(ta, tb, q)));   // what its lines cover
        const len = pieceLength(M, p);
        if (len < SAMPLE_MM / 2) continue;
        const ns = Math.max(1, Math.round(len / SAMPLE_MM)), ks = [];
        for (let i = 0; i < ns; i++) {
          const f = (i + 0.5) / ns, m = pointOn(M, p, f);
          if (!inFrame(m[0], m[1])) { ks.push(-1); continue; }
          const acc = [0, 0, 0]; let got = 0;
          for (const sh of T) { const q = pointOn(sh, p, f); got += sample(res, q[0], q[1], acc); }
          ks.push(got ? near(acc.map(v => v / got)) : 0);
        }
        for (const q of runsOf(ks, len / ns, shortest)) {
          const c = C[q.k];
          if (q.k <= 0 || !c?.own) continue;                                                // outside the frame, or the paper
          modules.push({ reg, band: b, p, fa: q.i0 / ns, fb: (q.i1 + 1) / ns, ta, tb, ts, n: ts.length, len: q.L, w: widthOn(R, p, ta, tb), k: q.k, own: c.own, light: c.light });
        }
      }
    }
  });
  return { regions, candidates: C, modules };
}
// A pencil with next to nothing to draw — less line than LEAST_MM, or than
// LEAST_SHARE of all of it on a small piece — is left out, its modules to the
// nearest of those with enough: no change of pencil for a few specks (on
// IMG_1554 in HDay warm, grey's 3 modules, emerald's 4; est.). Those keep
// what they had and only gain, so none of them falls short in its turn.
export const LEAST_MM = 300, LEAST_SHARE = 0.005;
export function pencilPlan(rects, res, o = {}) {
  const pencils = o.pencils ?? cleanPencils(PENCILS_NEW), D = modulesOf(rects, res, { ...o, pencils }), mm = new Map();
  for (const M of D.modules) for (const id of [M.own, M.light]) if (id) mm.set(id, (mm.get(id) ?? 0) + M.n * M.len * (o.coats ?? COATS_NEW));
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

// ---------- a module's hatch: the pencil up and down in it ----------
const flip = g => g.t === 'L' ? { t: 'L', a: g.b, b: g.a } : { ...g, a: g.b, b: g.a, left: !g.left };
const gap = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
export const lineLen = g => g.t === 'L' ? gap(g.a, g.b) : g.r * Math.abs(Math.atan2((g.a[0] - g.c[0]) * (g.b[1] - g.c[1]) - (g.a[1] - g.c[1]) * (g.b[0] - g.c[0]), (g.a[0] - g.c[0]) * (g.b[0] - g.c[0]) + (g.a[1] - g.c[1]) * (g.b[1] - g.c[1])));
// pieces one after another, a short line between where one ends and the next begins
function chain(list) {
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
  const hatch = o.hatch ?? 'along', coats = o.coats ?? COATS_NEW, passes = [];
  let at = [0, 0];                                                                          // home: the canvas's bottom left corner, near enough
  for (const pc of order) {
    const mine = plan.modules.filter(M => pc.light ? M.light === pc.id : M.own === pc.id);
    if (!mine.length) continue;
    const ends = mine.map(M => { const R = plan.regions[M.reg], s = shapeAt(R, M.ts?.[0] ?? M.ta + 0.5 / M.n * (M.tb - M.ta)); return [pointOn(s, M.p, M.fa), pointOn(s, M.p, M.fb)]; });
    const G = gridOf(ends), strokes = [];
    let cur = null, mm = 0;
    for (let left = mine.length; left > 0; left--) {
      const [i, e] = G.nearest(at);
      G.take(i);
      const pieces = hatchOf(plan.regions[mine[i].reg], mine[i], hatch, coats, e === 1);
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
function gridOf(ends, cell = 20) {
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
// pass, where the pencil stands on the paper, before it lifts — p-pause
export function withChanges(blocks, D, pencils, passes) {
  const firstRow = new Map(), lastRow = new Map();
  D.info.forEach((q, i) => { if (!firstRow.has(q.pass)) firstRow.set(q.pass, i + 1); lastRow.set(q.pass, i + 1); });
  const out = [], start = firstRow.get(0);
  let begun = false;
  blocks.forEach((b, i) => {
    const next = blocks[i + 1];
    if (b.kind === 'arm' && /^J 2 /.test(b.cmd) && blocks[i - 1]?.kind === 'move' && /^F /.test(blocks[i - 1].cmds[0])) {   // a row's lift, after its drawing move — not the hover after a travel
      const k = [...lastRow].find(([, r]) => r === b.row)?.[0];
      if (k !== undefined && k + 1 < passes.length && blocks[i - 1].row === b.row) out.push({ kind: 'p-pause', why: changeWhy(pencils, passes, k + 1), row: b.row, pencil: passes[k + 1].pencil });
    }
    out.push(b);
    if (!begun && b.kind === 'move' && b.row === start && /^T /.test(b.cmds[0]) && next) {   // over the first module's start: down, the first pencil in
      begun = true;
      out.push({ kind: 'arm', cmd: 'J 2 0', row: start }, { kind: 'p-pause', why: changeWhy(pencils, passes, 0), row: start, pencil: passes[0].pencil });
    }
  });
  return out;
}
// ---------- the reading ----------
export function tallyOf(passes) {
  return passes.map(P => ({ pencil: P.pencil, modules: P.modules, strokes: P.strokes.length, mm: P.mm }));
}
export const cleanFrame = f => f && [f.x0, f.y0, f.x1, f.y1].every(fin) && f.x1 - f.x0 >= 1 && f.y1 - f.y0 >= 1 ? { x0: f.x0, y0: f.y0, x1: f.x1, y1: f.y1 } : null;
