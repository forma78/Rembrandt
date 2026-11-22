// GOGH's plan: a picture in dabs (the owner, 2026-11-22: "painting in strokes, like real painting"; "in GOGH there will be no long strokes! All of them
// drops of 2 cm, as on IMG_3377"). FORM-G's way — a dip, the drop, then a second run with no dip — takes the paint off again: "the second idle run
// takes the painted layer off completely" (GOGH/01.png … 04.png: clots at the sides, bare canvas in the middle, 03.png nearly white); the MARKS' drops,
// a dip and one short leg, came out whole (GOGH/IMG_3377.jpg), and so did the short thick burgundy legs he circled (GOGH/IMG_3374.jpg): "they did not
// spread, because they are short — short legs, in your words".
//
// A dab: a dip, the brush down, one stroke of ≈ 20 mm along the machine's X, down the picture, the brush up. Nothing over it: no snake, no second run,
// no idle run, no drop before it. The only way this brush paints (README, "How to lay a module"): every dab upright, in FORM-G's columns 5 mm apart —
// Signac's mosaic of upright dabs; Van Gogh's curling strokes want the wrist turned and a LAB sheet first.
//
// A picture is FORM-G's json, every leg a dab: { …, kind: 'dabs', jars: [{ id, name, code, hex, coats: 1, cells: [{ n, legs: [[x, top, bottom]] }] }] },
// a cell a stack of a jar's dabs end to end in one column, the cells in the order the brush goes to them (the nearest next). Made by GEN-V (genv.js) and
// GOGH/generator/genvpic.py; run by FORM-G's page with data-tab="gogh" (formg.js).
import { GEN, paletteOf, hexOfLab } from './genfplan.js';
import { jarsByCanvas } from './canon.js';
import { seqOf, FORMG } from './formgplan.js';

export const GOGH_LIB = [];   // the library: a name here, its json and jpg in app/gogh/; this Mac's own pictures (gogh/local.json, gitignored) in front of it
// mm, est.: aim, min, max — a dab's length (the owner: "drops of 2 cm"; IMG_3377's measure 13 … 17 mm off an 8 mm mark), the shortest a column's stretch is
// cut into, the longest; crumb: a stretch of the picture shorter than this left bare; len: what a mm off `aim` costs, squared, in CIELAB ΔE² (a dab's
// colour against the picture's, summed a mm); stagger: what a dab's end costs `near` mm from one in the column to its left, so the dabs lie as bricks,
// not in rows; trim: the leg on the machine so many mm in from the dab's ends — the brush lands on the move, the J3 lands it 3 mm earlier and lifts it
// 3 mm later (canon.js, ELBOW_J3), the paint runs on past the leg (IMG_3377: 8 mm marks, J3's 14 mm on the machine, dabs of 13 … 17)
export const DAB = { aim: 20, min: 12, max: 24, crumb: 6, len: 3, stagger: 300, near: 2, trim: 3 };

// ---------- the dabs: every column cut into dabs of one jar each ----------
// B: genfplan.js's binsOf (N columns, R mm along from the picture's top), pal: the jars in CIELAB. Every stretch of a column the picture paints cut by a
// dynamic programme into dabs `min` … `max` mm, each the jar nearest its own mean colour: the cuts where the picture's colour changes, the lengths about
// `aim`, the ends off the left column's; what a dab misses carried on to the next column (genfplan.js's columnsOf, GEN.carry). → [{ c, a, b, k }]: the
// column, the dab from a to b mm from the picture's top, its jar
export function dabsOf(B, pal, o = {}) {
  const { N, R } = B, K = pal.length, d = { ...DAB, ...(o.dab ?? {}) }, carry = o.carry ?? GEN.carry, out = [];
  if (!K) return out;
  const P2 = pal.map(p => p[0] * p[0] + p[1] * p[1] + p[2] * p[2]), t = new Float64Array(R * 3), miss = new Float64Array(R * 3);
  const S = new Float64Array((R + 1) * 3), Q = new Float64Array(R + 1), best = new Float64Array(R + 1), from = new Int32Array(R + 1), jar = new Int32Array(R + 1);
  let prev = new Uint8Array(R + 1), next = new Uint8Array(R + 1);
  const seg = (s, e) => {                                     // the jar for bins s … e − 1 and what it misses there, ΔE² summed
    const n = e - s, s0 = S[3 * e] - S[3 * s], s1 = S[3 * e + 1] - S[3 * s + 1], s2 = S[3 * e + 2] - S[3 * s + 2], q = Q[e] - Q[s];
    let bk = 0, bv = Infinity;
    for (let k = 0; k < K; k++) { const p = pal[k], v = q - 2 * (p[0] * s0 + p[1] * s1 + p[2] * s2) + n * P2[k]; if (v < bv) { bv = v; bk = k; } }
    return [bk, Math.max(0, bv)];
  };
  const nearPrev = s => { for (let r = Math.max(0, s - d.near); r <= Math.min(R, s + d.near); r++) if (prev[r]) return true; return false; };
  for (let c = 0; c < N; c++) {
    next.fill(0);
    const on = r => B.on[c * R + r] === 1;
    for (let r = 0; r < R; r++) {
      const j = c * R + r;
      for (let q = 0; q < 3; q++) t[3 * r + q] = on(r) ? B.lab[3 * j + q] + carry * miss[3 * r + q] : 0;
      for (let q = 0; q < 3; q++) S[3 * (r + 1) + q] = S[3 * r + q] + t[3 * r + q];
      Q[r + 1] = Q[r] + t[3 * r] ** 2 + t[3 * r + 1] ** 2 + t[3 * r + 2] ** 2;
    }
    miss.fill(0);
    for (let a = 0; a < R;) {
      if (!on(a)) { a++; continue; }
      let b = a; while (b < R && on(b)) b++;
      const n = b - a, mine = [];
      if (n < d.crumb) { a = b; continue; }                    // too short to land a dab on: bare
      if (n < d.min) mine.push([a, b, seg(a, b)[0]]);
      else {
        best[a] = 0; for (let e = a + 1; e <= b; e++) best[e] = Infinity;
        for (let e = a + d.min; e <= b; e++) for (let L = d.min; L <= d.max && e - L >= a; L++) {
          const s = e - L;
          if (best[s] === Infinity) continue;
          const [k, v] = seg(s, e), cost = best[s] + v + d.len * (L - d.aim) ** 2 + (s > a && nearPrev(s) ? d.stagger : 0);
          if (cost < best[e]) { best[e] = cost; from[e] = s; jar[e] = k; }
        }
        if (best[b] < Infinity) for (let e = b; e > a; e = from[e]) mine.unshift([from[e], e, jar[e]]);
        else { const m = Math.ceil(n / d.max); for (let i = 0; i < m; i++) { const s = a + Math.round(i * n / m), e = a + Math.round((i + 1) * n / m); mine.push([s, e, seg(s, e)[0]]); } }
      }
      for (const [s, e, k] of mine) {
        out.push({ c, a: s, b: e, k });
        if (s > a) next[s] = 1;
        for (let r = s; r < e; r++) for (let q = 0; q < 3; q++) miss[3 * r + q] = t[3 * r + q] - pal[k][q];
      }
      a = b;
    }
    [prev, next] = [next, prev];
  }
  return out;
}

// ---------- a jar's dabs into cells, the order the brush goes ----------
// its legs [x, top, bottom] → stacks: a column's dabs end to end, top first; then the stacks the nearest next, from the top left one on: from where one
// ends, the stack whose top lies nearest (the carriage in the air, a dip at every dab anyway)
export function stacksOf(legs) {
  const L = legs.map(l => [l[0], Math.max(l[1], l[2]), Math.min(l[1], l[2])]).sort((p, q) => p[0] - q[0] || q[1] - p[1]), st = [];
  for (const l of L) { const s = st.at(-1), z = s?.at(-1); if (z && Math.abs(z[0] - l[0]) < 1e-6 && Math.abs(z[2] - l[1]) < 1e-6) s.push(l); else st.push([l]); }
  if (!st.length) return st;
  const left = st.slice(), out = [];
  let k = 0;
  left.forEach((s, i) => { if (s[0][0] < left[k][0][0] - 1e-6 || (Math.abs(s[0][0] - left[k][0][0]) < 1e-6 && s[0][1] > left[k][0][1])) k = i; });
  for (;;) {
    const s = left.splice(k, 1)[0];
    out.push(s);
    if (!left.length) return out;
    const [x, , y] = s.at(-1);
    let bd = Infinity;
    left.forEach((q, i) => { const dd = Math.hypot(q[0][0] - x, q[0][1] - y); if (dd < bd) { bd = dd; k = i; } });
  }
}
export const dabLine = j => j.cells.reduce((t, c) => t + c.legs.reduce((a, l) => a + Math.abs(l[2] - l[1]), 0), 0);   // a jar's line: its dabs' length, mm

// ---------- the sketch, GEN-V's ----------
// → { pic: the picture's json, the jars by the canon of the canvas's long side (canon.js); raw: before it; out, kept: the canon's; asked, made; dabs; pal }
// o.pal: the jars given (CIELAB) in place of k-means; o.names, o.hexes: their names and colours, by the palette's index
export function sketchV(B, fit, f, K, o = {}) {
  const pal = o.pal ?? paletteOf(B, K, o), dabs = dabsOf(B, pal, o), lum = pal.map(p => p[0]);
  const xs = c => +(fit.left + GEN.pitch * (c + 0.5)).toFixed(2), up = mm => +(f.h - fit.top - mm).toFixed(1);
  const by = pal.map(() => []);
  for (const q of dabs) by[q.k].push([xs(q.c), up(q.a), up(q.b)]);
  const order = pal.map((_, k) => k).filter(k => by[k].length).sort((p, q) => lum[q] - lum[p]);
  const jars = order.map((k, i) => ({ id: `c${k}`, name: o.names?.[k] ?? `Colour ${i + 1}`, code: '', hex: o.hexes?.[k] ?? hexOfLab(pal[k]), coats: 1, cells: stacksOf(by[k]).map((s, n) => ({ n: n + 1, legs: s })) }));
  const all = dabs.map(q => [xs(q.c), up(q.a), up(q.b)]), X = all.map(l => l[0]), Y = all.flatMap(l => [l[1], l[2]]);
  const raw = { id: o.id ?? 'gen-v', title: o.title ?? 'GEN-V sketch', sub: `sketch in dabs, ${f.w / 10} × ${f.h / 10}, ${K} colours asked (est.)`, w: f.w, h: f.h, pitch: GEN.pitch, columns: B.N, kind: 'dabs',
    dab: { aim: DAB.aim, min: DAB.min, max: DAB.max }, box: all.length ? [Math.min(...X) - GEN.pitch / 2, Math.min(...Y), Math.max(...X) + GEN.pitch / 2, Math.max(...Y)] : [0, 0, 0, 0], jars };
  const C = o.canon === false ? { pic: raw, out: [], kept: [] } : jarsByCanvas(raw, Math.max(f.w, f.h), dabLine);
  let n = 0;   // a jar that took another's dabs: its cells laid again, so its stacks and its order are its own
  const pic = { ...C.pic, jars: C.pic.jars.map(({ took, ...j }) => ({ ...j, name: o.names ? j.name : `Colour ${++n}`, cells: stacksOf(j.cells.flatMap(c => c.legs)).map((s, i) => ({ n: i + 1, legs: s })) })) };
  return { pic, raw, out: C.out, kept: C.kept, asked: K, made: jars.length, dabs: dabs.length, pal };
}

// ---------- the run, GOGH's ----------
// a dab's leg on the machine: painted top to bottom, `trim` in from both its ends (DAB.trim); a dab too short for that, the shortest the brush lands on, about its middle
export function dabLeg(x, a, b, trim = DAB.trim) {
  const top = Math.max(a, b), bot = Math.min(a, b), L = top - bot, m = FORMG.minLeg;
  if (L < m + 2 * 1e-9) { const c = (top + bot) / 2; return [[x, c + m / 2], [x, c - m / 2]]; }
  const t = Math.max(0, Math.min(trim, (L - m) / 2));
  return [[x, top - t], [x, bot + t]];
}
// the list: FORM-G's (formgplan.js, seqOf) — every jar once, light to dark; a pass a jar, its cells as the picture has them, every leg a dab
export function passesV(pic, o = {}) {
  const trim = o.trim ?? DAB.trim;
  return seqOf(pic).map(j => {
    const byCell = j.cells.map((c, i) => { const legs = c.legs.map(([x, a, b]) => dabLeg(x, a, b, trim)); return { num: i + 1, k: legs.length, legs, line: [], over: 0, end: 0, mm: legs.reduce((t, l) => t + Math.abs(l[1][1] - l[0][1]), 0) }; });
    return { pencil: j.id, layer: j.layer, fill: 'dabs', cells: byCell.length, byCell, tracks: byCell.reduce((a, q) => a + q.k, 0), rows: 0, rays: 0, rubs: 1, idle: false, strokes: [], mm: byCell.reduce((a, q) => a + q.mm, 0) };
  });
}
// the brush's runs: every dab a run of its own, on a dip of its own at its top, down to its bottom and the lift beyond — nothing after it
export const dabRunsOf = passes => passes.flatMap((P, k) => P.byCell.flatMap(c => c.legs.map((l, i) => ({ pass: k, num: c.num, pts: l, say: `dab${c.legs.length > 1 ? ` ${i + 1}/${c.legs.length}` : ''}`, dip: true, idle: false, beyond: true, dab: true }))));
