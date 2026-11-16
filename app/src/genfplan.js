// GEN-F, the form's generator (the owner, 2026-11-16: "can we not make the generator a tab of its own, so that I see a first sketch, approve it and give it to
// you for the final work? we would save a lot of tokens. GEN-F, as the generator of the form :)"; "I do not need many sliders, only the number of colours from 10
// to 100 and the format 60 × 60, 60 × 80, 70 × 100 … three for now"). A picture in, a sketch out: FORM-G's grid of 5 mm columns, every column solved against the
// picture, what it could not reach carried on to the next (hyper2.py's way), its runs into paintrun.py's spans and snakes, FORM-G's json. A sketch, est.: the jars
// the picture's own colours (k-means in CIELAB), no brush model, no geometry by hand — the seams, the symmetry, the jars to measure stay the generator's
// (FORM-G/generator) once the owner approves. Pure: the page (genf.js) gives the pixels, 1 px a mm.
import { cellOf } from './formgplan.js';
import { jarsByCanvas } from './canon.js';

export const GEN_FORMATS = [{ id: '60x60', w: 600, h: 600 }, { id: '60x80', w: 600, h: 800 }, { id: '70x100', w: 700, h: 1000 }];   // w across (Y), h along (X): FORM-G's
// the field the brush reaches on a canvas, est.: across Y the race face's 540 (the reach 568.5, MARKS by the field), along X the classic's 843 (the reach 865, the
// elbow's sweep ~20 at the bottom); 30 mm of canvas at least round it. minSpan: the Porsche's shortest leg; lam: a cut's cost, CIELAB ΔE² (est.); carry: how much
// of a column's miss goes on to the next (est.); join, under, stepMax, crumb: paintrun.py's JOIN, UNDER, export's STEP_MAX, its crumbs
export const GEN = { pitch: 5, across: 540, along: 843, margin: 30, colours: [10, 100], minSpan: 8, crumb: 3, lam: 700, carry: 0.5, join: 45, under: 3, stepMax: 7, bareDE: 12, sample: 24000, iters: 12, twoL: 35 };
// the motion blur's layer under the picture (blurOf): the slider's range and step, mm; its legs no nearer the canvas's top and bottom than `edge`; run on under the
// picture's paint so far from where the picture ends, so no white seam between them (est.)
// the stripes the car's own colour (the owner: "stripes of the Porsche's own colour"): only the car's colours averaged, never mixed with the ground; no stripe where
// the car is under `least` of the window (est.)
// alpha: the layer's opacity as OPM's raster, optical pigment mixing (the owner, 2026-11-16: "the blur works superbly, but it is alpha 100 %; it needs a
// transparency channel too, so that it does not spoil the main layer's contour"; then, of a glaze with medium: "wait, it has to be OPM, optical pigment mixing:
// instead of a glaze with medium, as a raster if possible — more stripes or fewer … your opacity is for digital print, not for our brush"): every stripe its
// jar's full colour, the share of the columns that paint it the opacity — a column paints while the density, alpha (all of it where the window is `full` of the
// car, less towards the stripes' tails), is above the column's own threshold, spread evenly over the columns by the golden ratio; so 50 % every other column,
// and a lower one's stripes always among a higher one's (est.)
export const BLUR = { max: 300, step: 10, edge: 10, lap: 10, least: 0.1, full: 0.5, alpha: 0.5 };
export const rasterOf = c => ((c + 1) * 0.6180339887498949) % 1;   // a column's threshold: evenly spread for any share of the columns

// ---------- colour ----------
const lin = v => (v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
const enc = v => Math.round(255 * Math.min(1, Math.max(0, v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)));
const LIN = Float32Array.from({ length: 256 }, (_, i) => lin(i));
const fL = t => t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116, iL = t => t ** 3 > 216 / 24389 ? t ** 3 : (116 * t - 16) / (24389 / 27);
export function labOfLin(r, g, b) {
  const X = fL((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047), Y = fL(0.2126 * r + 0.7152 * g + 0.0722 * b), Z = fL((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883);
  return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)];
}
export function hexOfLab([L, a, b]) {
  const fy = (L + 16) / 116, X = 0.95047 * iL(fy + a / 500), Y = iL(fy), Z = 1.08883 * iL(fy - b / 200);
  const rgb = [3.2406 * X - 1.5372 * Y - 0.4986 * Z, -0.9689 * X + 1.8758 * Y + 0.0415 * Z, 0.0557 * X - 0.2040 * Y + 1.0570 * Z].map(enc);
  return '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}
export const labOfHex = h => { const n = parseInt(h.slice(1), 16); return labOfLin(LIN[n >> 16], LIN[n >> 8 & 255], LIN[n & 255]); };
const d2 = (p, q) => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2;

// ---------- the ground: what is not the picture ----------
// the border's colour, if the border is one colour (a plain ground, as the owner's renders have): everything of it that the border reaches is bare canvas,
// a highlight inside the picture of the same white is not. Transparent pixels are bare. → Uint8Array, 1 bare; no plain ground, none bare but the transparent
export function bareMask(rgba, w, h, de = GEN.bareDE) {
  const n = w * h, lab = new Float32Array(n * 3), m = new Uint8Array(n);
  for (let i = 0; i < n; i++) { const [L, a, b] = labOfLin(LIN[rgba[4 * i]], LIN[rgba[4 * i + 1]], LIN[rgba[4 * i + 2]]); lab[3 * i] = L; lab[3 * i + 1] = a; lab[3 * i + 2] = b; }
  const edge = [];
  for (let x = 0; x < w; x++) edge.push(x, (h - 1) * w + x);
  for (let y = 1; y < h - 1; y++) edge.push(y * w, y * w + w - 1);
  const solid = edge.filter(i => rgba[4 * i + 3] >= 128), med = k => { const v = solid.map(i => lab[3 * i + k]).sort((p, q) => p - q); return v[v.length >> 1] ?? 0; };
  const g = [med(0), med(1), med(2)], near = i => d2([lab[3 * i], lab[3 * i + 1], lab[3 * i + 2]], g) < de * de;
  const plain = solid.length > 0 && solid.filter(near).length >= 0.7 * solid.length;
  const is = i => rgba[4 * i + 3] < 128 || (plain && near(i));
  const q = [];
  for (const i of edge) if (!m[i] && is(i)) { m[i] = 1; q.push(i); }
  for (let k = 0; k < q.length; k++) {
    const i = q[k], x = i % w, y = (i - x) / w;
    for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) if (j >= 0 && !m[j] && is(j)) { m[j] = 1; q.push(j); }
  }
  return { mask: m, ground: plain ? hexOfLab(g) : null };
}
// the picture's own box in the image, the bare ground round it off
export function boxOf(mask, w, h) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!mask[y * w + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return x1 < 0 ? { x: 0, y: 0, w, h } : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

// ---------- the picture on the canvas ----------
export const formatOf = id => GEN_FORMATS.find(f => f.id === id) ?? GEN_FORMATS[0];
export const fieldOf = f => ({ w: Math.min(f.w - 2 * GEN.margin, GEN.across), h: Math.min(f.h - 2 * GEN.margin, GEN.along) });
// as large as the field lets it, its aspect kept: N columns 5 mm apart across, R mm along; centred on the canvas (FORM-G's columns, export_formg.py's xs)
export function fitOf(f, iw, ih) {
  const F = fieldOf(f), N = Math.max(1, Math.floor(Math.min(F.w, F.h * iw / ih) / GEN.pitch)), R = Math.max(1, Math.min(F.h, Math.round(N * GEN.pitch * ih / iw)));
  return { N, R, left: (f.w - N * GEN.pitch) / 2, top: Math.round((f.h - R) / 2), field: F };
}

// ---------- the columns ----------
// the picture at 1 px a mm, N·5 × R: every column's 5 px averaged in linear light, a bin a mm; a bin bare when most of it is ground
export function binsOf(rgba, mask, N, R, pitch = GEN.pitch) {
  const W = N * pitch, lab = new Float32Array(N * R * 3), lin = new Float32Array(N * R * 3), on = new Uint8Array(N * R);
  for (let c = 0; c < N; c++) for (let r = 0; r < R; r++) {
    let s0 = 0, s1 = 0, s2 = 0, k = 0;
    for (let x = c * pitch; x < (c + 1) * pitch; x++) { const i = r * W + x; if (mask[i]) continue; s0 += LIN[rgba[4 * i]]; s1 += LIN[rgba[4 * i + 1]]; s2 += LIN[rgba[4 * i + 2]]; k++; }
    if (2 * k <= pitch) continue;
    const j = c * R + r, [L, a, b] = labOfLin(s0 / k, s1 / k, s2 / k);
    on[j] = 1; lab[3 * j] = L; lab[3 * j + 1] = a; lab[3 * j + 2] = b; lin[3 * j] = s0 / k; lin[3 * j + 1] = s1 / k; lin[3 * j + 2] = s2 / k;
  }
  return { N, R, lab, lin, on };
}
// the jars: K colours by k-means in CIELAB, k-means++ from a fixed seed, so the same picture and K give the same jars
export function paletteOf(B, K, o = {}) {
  const idx = []; for (let j = 0; j < B.on.length; j++) if (B.on[j]) idx.push(j);
  if (!idx.length) return [];
  let s = o.seed ?? 5164; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const step = Math.max(1, Math.floor(idx.length / (o.sample ?? GEN.sample))), pts = idx.filter((_, i) => i % step === 0).map(j => [B.lab[3 * j], B.lab[3 * j + 1], B.lab[3 * j + 2]]);
  K = Math.min(K, pts.length);
  const C = [pts[Math.floor(rnd() * pts.length)]], best = pts.map(p => d2(p, C[0]));
  while (C.length < K) {
    const tot = best.reduce((a, v) => a + v, 0); let t = rnd() * tot, i = 0;
    while (i < pts.length - 1 && (t -= best[i]) > 0) i++;
    C.push(pts[i]); for (let k = 0; k < pts.length; k++) best[k] = Math.min(best[k], d2(pts[k], pts[i]));
  }
  for (let it = 0; it < (o.iters ?? GEN.iters); it++) {
    const S = C.map(() => [0, 0, 0, 0]);
    for (const p of pts) { let bk = 0, bd = Infinity; for (let k = 0; k < C.length; k++) { const d = d2(p, C[k]); if (d < bd) { bd = d; bk = k; } } const q = S[bk]; q[0] += p[0]; q[1] += p[1]; q[2] += p[2]; q[3]++; }
    S.forEach((q, k) => { if (q[3]) C[k] = [q[0] / q[3], q[1] / q[3], q[2] / q[3]]; });
  }
  return C.map(p => labOfHex(hexOfLab(p)));                 // as a jar can be: the hex's own colour
}
// every column against the picture, its miss carried on to the next: in a column's painted stretch the jars by a dynamic programme (a bin's ΔE², a cut lam), then
// no run under minSpan (merged into its neighbour nearer in colour), an island under crumb mm left bare. → Int16Array, c·R + r: the jar, −1 bare
export function columnsOf(B, pal, o = {}) {
  const { N, R } = B, K = pal.length, lam = o.lam ?? GEN.lam, carry = o.carry ?? GEN.carry, minSpan = o.minSpan ?? GEN.minSpan, crumb = o.crumb ?? GEN.crumb;
  const grid = new Int16Array(N * R).fill(-1), miss = new Float32Array(R * 3), t = new Float32Array(R * 3), cost = new Float64Array(K), from = new Uint8Array(R * K), arg = new Int32Array(R);
  for (let c = 0; c < N; c++) {
    for (let r = 0; r < R; r++) { const j = c * R + r; for (let q = 0; q < 3; q++) t[3 * r + q] = B.on[j] ? B.lab[3 * j + q] + carry * miss[3 * r + q] : 0; }
    for (let a = 0; a < R;) {
      if (!B.on[c * R + a]) { a++; continue; }
      let b = a; while (b < R && B.on[c * R + b]) b++;
      // the programme over a … b
      let pb = 0, pv = Infinity;
      for (let r = a; r < b; r++) {
        let nb = 0, nv = Infinity;
        for (let k = 0; k < K; k++) {
          const e = (t[3 * r] - pal[k][0]) ** 2 + (t[3 * r + 1] - pal[k][1]) ** 2 + (t[3 * r + 2] - pal[k][2]) ** 2;
          let v;
          if (r === a) { v = e; from[r * K + k] = 0; } else if (cost[k] <= pv + lam) { v = cost[k] + e; from[r * K + k] = 0; } else { v = pv + lam + e; from[r * K + k] = 1; }
          cost[k] = v; if (v < nv) { nv = v; nb = k; }
        }
        arg[r] = pb; pb = nb; pv = nv;
      }
      const lab = new Int16Array(b - a);
      for (let r = b - 1, k = pb; r >= a; r--) { lab[r - a] = k; if (r > a && from[r * K + k]) k = arg[r]; }
      // runs, the short ones into a neighbour
      let runs = []; for (let i = 0; i < lab.length;) { let j = i; while (j < lab.length && lab[j] === lab[i]) j++; runs.push({ a: i, b: j, k: lab[i] }); i = j; }
      for (;;) {
        let s = -1; runs.forEach((q, i) => { if (q.b - q.a < minSpan && runs.length > 1 && (s < 0 || q.b - q.a < runs[s].b - runs[s].a)) s = i; });
        if (s < 0) break;
        const q = runs[s], nb = [runs[s - 1], runs[s + 1]].filter(Boolean).sort((u, v) => d2(pal[u.k], pal[q.k]) - d2(pal[v.k], pal[q.k]))[0];
        nb.a = Math.min(nb.a, q.a); nb.b = Math.max(nb.b, q.b); runs.splice(s, 1);
        runs = runs.reduce((m, u) => { const l = m.at(-1); if (l && l.k === u.k) l.b = u.b; else m.push(u); return m; }, []);
      }
      if (!(runs.length === 1 && b - a < crumb)) for (const q of runs) for (let r = q.a; r < q.b; r++) grid[c * R + a + r] = q.k;
      a = b;
    }
    for (let r = 0; r < R; r++) { const k = grid[c * R + r]; for (let q = 0; q < 3; q++) miss[3 * r + q] = k >= 0 ? t[3 * r + q] - pal[k][q] : 0; }
  }
  return grid;
}

// ---------- paintrun.py's spans and snakes ----------
// a column's runs: the same jar on joins, a light leg runs on under darker pieces up to `join` mm, the lighter `under` mm under the darker it butts
export function spansOf(grid, N, R, lum, o = {}) {
  const join = o.join ?? GEN.join, under = o.under ?? GEN.under, L = k => k < 0 ? 2e9 : lum[k], out = [];
  for (let c = 0; c < N; c++) {
    let sp = []; for (let i = 0; i < R;) { let j = i; while (j < R && grid[c * R + j] === grid[c * R + i]) j++; sp.push({ c, a: i, b: j, p: grid[c * R + i] }); i = j; }
    for (let i = 0; i < sp.length;) {
      let j = i + 1;
      while (j < sp.length && L(sp[j].p) < L(sp[i].p) && sp[j].p !== sp[i].p) j++;
      if (sp[i].p >= 0 && j < sp.length && j > i + 1 && sp[j].p === sp[i].p && sp[j].a - sp[i].b <= join) { sp[i].b = sp[j].b; sp[i].under = true; sp.splice(j, 1); continue; }
      i++;
    }
    sp.sort((s, t) => s.a - t.a);
    for (let k = 0; k < sp.length - 1; k++) {
      const s = sp[k], t = sp[k + 1];
      if (s.b <= t.a && s.p >= 0 && t.p >= 0) { if (L(s.p) > L(t.p)) s.b = Math.min(R, s.b + under); else if (L(t.p) > L(s.p)) t.a = Math.max(0, t.a - under); }
    }
    out.push(...sp.filter(s => s.p >= 0));
  }
  return out;
}
// a jar's spans into snakes, column after column, the next leg entered at its nearer end, a step on the paper `stepMax` at most (build_runs)
export function snakesOf(spans, K, o = {}) {
  const stepMax = o.stepMax ?? GEN.stepMax, runs = Array.from({ length: K }, () => []);
  for (let k = 0; k < K; k++) {
    const mine = spans.filter(s => s.p === k).sort((s, t) => s.c - t.c || s.a - t.a), byCol = new Map(), used = new Set();
    for (const s of mine) { if (!byCol.has(s.c)) byCol.set(s.c, []); byCol.get(s.c).push(s); }
    for (const s0 of mine) {
      if (used.has(s0)) continue;
      used.add(s0);
      const run = [[s0, 1]]; let cur = s0, d = 1;
      for (;;) {
        const end = d > 0 ? cur.b : cur.a; let best = null;
        for (const t of byCol.get(cur.c + 1) ?? []) {
          if (used.has(t)) continue;
          const da = Math.abs(t.a - end), db = Math.abs(t.b - end), m = Math.min(da, db);
          if (m <= stepMax && (!best || m < best[0])) best = [m, t, da <= db ? 1 : -1];
        }
        if (!best) break;
        used.add(best[1]); run.push([best[1], best[2]]); cur = best[1]; d = best[2];
      }
      runs[k].push(run);
    }
  }
  return runs;
}

// ---------- the sketch ----------
const chroma = p => Math.hypot(p[1], p[2]);
const coatsOf = p => p[0] < GEN.twoL && (chroma(p) > 12 || p[0] < 12) ? 2 : 1;   // the deep reds and the blacks two coats, as the classic's (est.)
export const lineOf = pic => j => j.cells.reduce((t, c) => t + cellOf(c, pic, 1).mm, 0);   // a jar's line as FORM-G's list counts it: legs and idle run (canon.js's jarsByCanvas)
// → { pic: FORM-G's json, the jars by the canon of the canvas's long side; raw: before it; out: the jars that went; asked, made: the colours asked, those that paint }
export function sketchOf(B, fit, f, K, o = {}) {
  const pal = paletteOf(B, K, o), grid = columnsOf(B, pal, o), lum = pal.map(p => p[0]);
  const spans = spansOf(grid, B.N, B.R, lum, o), snakes = snakesOf(spans, pal.length, o);
  const xs = c => +(fit.left + GEN.pitch * (c + 0.5)).toFixed(2), up = mm => +(f.h - fit.top - mm).toFixed(1);
  const order = pal.map((p, k) => k).filter(k => snakes[k].length).sort((p, q) => lum[q] - lum[p]);
  const jars = order.map((k, i) => ({
    id: `c${k}`, name: `Colour ${i + 1}`, code: '', hex: hexOfLab(pal[k]), coats: coatsOf(pal[k]),
    cells: snakes[k].map((run, n) => ({ n: n + 1, legs: run.map(([s, d]) => [xs(s.c), up(d > 0 ? s.a : s.b), up(d > 0 ? s.b : s.a)]) })),
  }));
  const all = jars.flatMap(j => j.cells.flatMap(c => c.legs)), X = all.map(l => l[0]), Y = all.flatMap(l => [l[1], l[2]]);
  const raw = { id: o.id ?? 'gen-f', title: o.title ?? 'GEN-F sketch', sub: `sketch, ${f.w / 10} × ${f.h / 10}, ${K} colours asked (est.)`, w: f.w, h: f.h, pitch: GEN.pitch, columns: B.N,
    box: all.length ? [Math.min(...X), Math.min(...Y), Math.max(...X), Math.max(...Y)] : [0, 0, 0, 0], jars };
  const C = o.canon === false ? { pic: raw, out: [], kept: [] } : jarsByCanvas(raw, Math.max(f.w, f.h), lineOf(raw));
  const pic = { ...C.pic, jars: C.pic.jars.map(({ took, ...j }, i) => ({ ...j, name: `Colour ${i + 1}` })) };   // a sketch's colours numbered again after the canon, no gaps: no jar mixed yet, no number on a lid
  return { pic, raw, out: C.out, kept: C.kept, asked: K, made: jars.length, grid, pal };
}

// ---------- the motion blur, a layer under the picture ----------
// The owner, 2026-11-16, of the red 911 in profile lying along X, its legs along the car, "as if it were going at high speed": "a second, BOTTOM layer … and a
// slider in GEN-F, motion blur. It adds stripes of the Porsche's own colour but does not break the geometry, as it lies UNDER the picture". Every column is
// the car's own section along its length, so the blur is each column's colours smeared along it, `mm` long, both ways (a camera's), over the canvas's colour
// (the ground); laid where the picture leaves the canvas bare and `lap` mm on under its paint, along X as far as the canvas and the reach let it (`edge` off its
// top and bottom); its colours the picture's own jars after the canon — the ground where it fades out — by the same programme, its miss carried.
// → { pic: FORM-G's json of that layer, its jars the picture's, one coat, `under` }, or null at nothing to blur
export function blurOf(B, fit, f, sk, mm, ground = '#FBFAF7', o = {}) {
  if (!(mm >= GEN.pitch) || !sk?.pic?.jars?.length) return null;
  const { N, R } = B, edge = Math.max(o.edge ?? BLUR.edge, (f.h - GEN.along) / 2), lap = o.lap ?? BLUR.lap, RR = Math.round(f.h - 2 * edge), off = Math.round(fit.top - edge);
  const n = parseInt(ground.slice(1), 16), G = [LIN[n >> 16], LIN[n >> 8 & 255], LIN[n & 255]], half = Math.round(mm / 2), span = 2 * half + 1;
  const lab = new Float32Array(N * RR * 3), on = new Uint8Array(N * RR), sum = new Float64Array((RR + 1) * 3), cnt = new Float64Array(RR + 1), bare = new Int32Array(RR);
  const least = o.least ?? BLUR.least, full = o.full ?? BLUR.full, alpha = Math.min(1, Math.max(0, o.alpha ?? BLUR.alpha));
  for (let c = 0; c < N; c++) {
    let any = false;
    for (let r = 0; r < RR; r++) {
      const pr = r - off, j = c * R + pr, inside = pr >= 0 && pr < R && B.on[j] === 1;
      for (let q = 0; q < 3; q++) sum[3 * (r + 1) + q] = sum[3 * r + q] + (inside ? B.lin[3 * j + q] : 0);
      cnt[r + 1] = cnt[r] + (inside ? 1 : 0);
      if (inside) any = true;
    }
    if (!any) continue;
    // how far every bin lies inside the picture's paint, along the column: 0 where the canvas is left bare
    const paint = r => { const pr = r - off; return pr >= 0 && pr < R && sk.grid[c * R + pr] >= 0; };
    for (let r = 0, d = 1e9; r < RR; r++) { d = paint(r) ? d + 1 : 0; bare[r] = d; }
    for (let r = RR - 1, d = 1e9; r >= 0; r--) { d = paint(r) ? d + 1 : 0; bare[r] = Math.min(bare[r], d); }
    for (let r = 0; r < RR; r++) {
      if (bare[r] > lap) continue;
      const a = Math.max(0, r - half), b = Math.min(RR, r + half + 1), k = cnt[b] - cnt[a], cover = k / span;   // past the canvas's ends, none of the car
      if (!k || cover < least || alpha * Math.min(1, cover / full) <= rasterOf(c)) continue;          // the raster: this column not here
      const m = [0, 1, 2].map(q => (sum[3 * b + q] - sum[3 * a + q]) / k), [L, A, Bb] = labOfLin(...m), j = c * RR + r;
      on[j] = 1; lab[3 * j] = L; lab[3 * j + 1] = A; lab[3 * j + 2] = Bb;
    }
  }
  // the ground first, so where a jar and the ground are alike the canvas stays bare (a black jar on a black ground)
  const jars0 = sk.pic.jars, pal = [labOfLin(...G), ...jars0.map(j => labOfHex(j.hex))], K = jars0.length;
  const grid = columnsOf({ N, R: RR, lab, on }, pal, o).map(k => k <= 0 ? -1 : k - 1);
  const spans = spansOf(grid, N, RR, jars0.map(j => labOfHex(j.hex)[0]), o), snakes = snakesOf(spans, K, o);
  const xs = c => +(fit.left + GEN.pitch * (c + 0.5)).toFixed(2), up = r => +(f.h - edge - r).toFixed(1);
  const jars = jars0.map((j, k) => ({ id: `u${j.id}`, name: j.name, code: '', hex: j.hex, coats: 1, under: true,
    cells: snakes[k].map((run, i) => ({ n: i + 1, legs: run.map(([s, d]) => [xs(s.c), up(d > 0 ? s.a : s.b), up(d > 0 ? s.b : s.a)]) })) })).filter(j => j.cells.length);
  if (!jars.length) return null;
  const all = jars.flatMap(j => j.cells.flatMap(c => c.legs)), X = all.map(l => l[0]), Y = all.flatMap(l => [l[1], l[2]]);
  return { mm, alpha, pic: { id: `${sk.pic.id}-under`, title: `${sk.pic.title} · under`, sub: `motion blur ${mm} mm, opacity ${Math.round(alpha * 100)} % as a raster, the layer under the picture (est.)`, w: f.w, h: f.h, pitch: GEN.pitch, columns: N,
    box: [Math.min(...X), Math.min(...Y), Math.max(...X), Math.max(...Y)], jars }, legs: all.length };
}
