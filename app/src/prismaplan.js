// PRISMA's plan — DACHE's Preview in coloured pencils, by the blend's own
// geometry (the owner, 2026-10-27, PRISMA/: "this geometry should have a
// rather simple construction. One part of the strokes goes clockwise, draws
// different circles. The other part are like spokes or rays, from the centre
// in different directions — so the rays make a cross hatching, a cross
// stroke. The rays are always short, the clockwise ones a little longer";
// IMAGE 15:30:57 the long ones round the loops, IMAGE 15:31:04 the rays).
// Before it, the same day: "take a cast of the Preview, give every shade its
// own pencil"; "a full pass across the sheet, as the brush used to go — it
// lifts here and lands there … the time goes only on the change of pencil".
//
// The Preview — BLEND's Result, inkaplan.js's simOf — the colour; every line
// its nearest pencil, the pencil's own colour, CIEDE2000; the paper where the
// Preview is next to white. Not DACHE's coats, tones and modules.
//
// Rings: in every band — a blend's between every two keys, its core's and a
// tile's rings — the pencil's lines PITCH apart round the shapes, clockwise
// from 12 o'clock, every line a whole round; on a side narrower than the
// widest, and round a corner as the band widens, as many as close every gap
// to a line's width (no white between two), the pencil up over it for the
// rest. Along a line the Preview a sample every half mm; a run of one pencil
// shorter than Shortest to its longer neighbour, the paper's too — no specks,
// no gaps a hair wide; or Mixed, the pencils intertwined, what one misses
// carried to the next. A run a stroke: it lands, draws, lifts.
// Rays: along every sausage — a piece of a spoke, where the paint lay thick
// and the brush's grooves crossed it (Screenshot 3.04.49 PM: "here are clearly
// red transverse stripes") — its width in lines PITCH apart, cut where it
// crosses a band's edge: a cell a band, the pencil of the Preview over it,
// up one line and down the next with the pencil on the paper, a mm across at
// the ends — a basket's staves over its rings; the next cell of the same
// pencil on along the spoke from where it ended, the pencil on the paper —
// short strokes still, turning at every band's edge as the Preview's squares.
// One pencil a pass, DACHE's run order, its pencil changes and p-pause: its
// strokes nearest next from where the last ended — a ring clockwise from its
// start, a ray from either end — on with the pencil on the paper to one
// JOIN_MM away.
//
// mm from the canvas's bottom left corner, x right, y up. Lines and arcs. No DOM.

import { regionsOf, shapeAt, pointOn, pieceLength, bandsOf, linesIn, lineOn, widthOn, chain, gridOf, lineLen, cleanPencils, PENCILS_NEW, PITCH, JOIN_MM, LEAST_MM, LEAST_SHARE } from './dacheplan.js';
import { de2000, labOf, sausagesOf, machinePiece, GROUND } from './inkaplan.js';
import { SAUSAGE_W } from './ccdplan.js';
import { linOf, toLin, toSrgb } from './color.js';

// Fifteen more Prismacolor Premiers (est., their colours Claude's guess till
// read off a stroke card), for the Preview's colours the box serves worst —
// the paint's mid blue, olive, vermilion, turquoise — and his red stripes'
// dark reds (the owner, 2026-10-27: "maybe there were not enough colours? We
// can add twenty more, dark, saturated … and tell me if more colours are
// needed for contrast"). Chosen one after another, each the one that took the
// most off the mean ΔE 2000 of his two Previews of the day (12:02 and 15:20
// in the Library): 9.1 with the 27 of DACHE's box, 6.5 with these.
export const BOX_5 = [
  { id: 'medblue', name: 'Mediterranean Blue', code: 'PC 1022', brand: 'Prismacolor', hex: '#2E7DB5' },
  { id: 'peacockblue', name: 'Peacock Blue', code: 'PC 1027', brand: 'Prismacolor', hex: '#1E6E9E' },
  { id: 'olive', name: 'Olive Green', code: 'PC 911', brand: 'Prismacolor', hex: '#6B7A2C' },
  { id: 'greenochre', name: 'Green Ochre', code: 'PC 1091', brand: 'Prismacolor', hex: '#8C8A4A' },
  { id: 'vermilion', name: 'Pale Vermilion', code: 'PC 921', brand: 'Prismacolor', hex: '#E8572A' },
  { id: 'poppy', name: 'Poppy Red', code: 'PC 922', brand: 'Prismacolor', hex: '#E03A2E' },
  { id: 'crimsonlake', name: 'Crimson Lake', code: 'PC 925', brand: 'Prismacolor', hex: '#A3203A' },
  { id: 'terracotta', name: 'Terra Cotta', code: 'PC 944', brand: 'Prismacolor', hex: '#B5523A' },
  { id: 'turquoise', name: 'Muted Turquoise', code: 'PC 1088', brand: 'Prismacolor', hex: '#4E8C8C' },
  { id: 'jade', name: 'Jade Green', code: 'PC 1021', brand: 'Prismacolor', hex: '#6FA58C' },
  { id: 'parrot', name: 'Parrot Green', code: 'PC 1006', brand: 'Prismacolor', hex: '#3DA35D' },
  { id: 'lightumber', name: 'Light Umber', code: 'PC 941', brand: 'Prismacolor', hex: '#9C7A5A' },
  { id: 'yellowedorange', name: 'Yellowed Orange', code: 'PC 1002', brand: 'Prismacolor', hex: '#F5A623' },
  { id: 'nectar', name: 'Nectar', code: 'PC 1092', brand: 'Prismacolor', hex: '#F4A27A' },
  { id: 'skylight', name: 'Sky Blue Light', code: 'PC 1086', brand: 'Prismacolor', hex: '#9FD3EA' },
];
// and twelve more for the owner's four transitions (2026-10-27, PRISMA/
// new_colors.png: "blue → turquoise → green … white → cream → peach → coral
// … yellow → gold → olive … red → terracotta → brown"). His twenty were the
// box's own, read off the screen, each within ΔE 1–4 of one in it: 50
// pencils, the look 8.56 → 8.40. These chosen as BOX_5, greedily, off his
// BLEND of 23:47 — 44 pencils, 2 h 46 min, the look 8.05; his choice.
// Prismacolor's, their colours est.
export const BOX_6 = [
  { id: 'salmonpink', name: 'Salmon Pink', code: 'PC 1001', brand: 'Prismacolor', hex: '#F2A595' },
  { id: 'jasmine', name: 'Jasmine', code: 'PC 1012', brand: 'Prismacolor', hex: '#F6D27A' },
  { id: 'palesage', name: 'Pale Sage', code: 'PC 1089', brand: 'Prismacolor', hex: '#B9C8A4' },
  { id: 'lightcerulean', name: 'Light Cerulean Blue', code: 'PC 904', brand: 'Prismacolor', hex: '#5FB3E0' },
  { id: 'mineralorange', name: 'Mineral Orange', code: 'PC 1033', brand: 'Prismacolor', hex: '#E8822A' },
  { id: 'kelpgreen', name: 'Kelp Green', code: 'PC 1090', brand: 'Prismacolor', hex: '#3E6B48' },
  { id: 'caribbean', name: 'Caribbean Sea', code: 'PC 1103', brand: 'Prismacolor', hex: '#1E8AB0' },
  { id: 'mossgreen', name: 'Moss Green', code: 'PC 1097', brand: 'Prismacolor', hex: '#6E7A45' },
  { id: 'beigesienna', name: 'Beige Sienna', code: 'PC 1080', brand: 'Prismacolor', hex: '#B78C6A' },
  { id: 'lightaqua', name: 'Light Aqua', code: 'PC 992', brand: 'Prismacolor', hex: '#A8DCCF' },
  { id: 'peacockgreen', name: 'Peacock Green', code: 'PC 907', brand: 'Prismacolor', hex: '#00796B' },
  { id: 'blushpink', name: 'Blush Pink', code: 'PC 928', brand: 'Prismacolor', hex: '#F4B6C2' },
];
export const PRISMA_PENCILS = [...PENCILS_NEW, ...BOX_5, ...BOX_6];
export const SHORTEST_NEW = 3, SHORTEST_MIN = 0.5, SHORTEST_MAX = 30;   // mm along a ring: a shorter run of one pencil to its neighbour (est.)
export const SPEED_NEW = 60;                                              // mm/s, the pencil round the rings, faster than DACHE's up and down (est.)
export const PAPER_DE = 4;                                                // the paper, not a pencil, where it is this much nearer the Preview (ΔE, est.)
export const RAY_MIN = 1;                                                 // mm: a ray's cell shorter than this goes on with the one before it
// The pencil rubbed, not touched (the owner, 2026-10-27, the first paper
// test, OPM/IMG_1621.MOV: "a pencil does not draw at one touch of the paper,
// it is not a felt pen. It is hard, and has to be rubbed like wood on
// sandpaper … 8 or 16 times a stroke for the dark, saturated colours, 16–32
// for the light ones; if not enough, 64. Let it draw seven hours"): every
// stroke so many times over, there and back, the pencil pressed — the
// darkest pencil RUBS_DARK, the lightest RUBS_LIGHT, between by its
// lightness (est.)
export const RUBS_DARK_NEW = 8, RUBS_LIGHT_NEW = 32, RUBS_MIN = 1, RUBS_MAX = 64;
// the elbow pressing it, and between strokes gliding on the paper, not up in
// the air (OPM/IMAGE 21:47:32 … 21:47:45: −0.1° it touches, next to no
// trace; −1.4° a pale line; +4.6° just off): degrees, minus down; −5° the
// elbow's reach (rembrandt.py), the reserve below −3.5 left alone
export const PRESS_NEW = -1.4, PRESS_MIN = -6, PRESS_MAX = 3;   // from Pencil in at; ELBOW LIVE either way (2026-10-28), the elbow never under ELBOW_MIN
export const ELBOW_MIN = -4.5;    // the elbow at most so low while it draws: −5° its reach, the rest the reserve (rembrandt.py's REACH)
export const GLIDE_NEW = -0.1, GLIDE_MIN = -0.5, GLIDE_MAX = 5;
// the pose every pencil goes in at, its tip on the paper or the canvas: Pressure
// and Between strokes from it. Up off the surface, so the elbow always gets
// there (2026-10-27, the night of OPM: "J 2 0: the elbow does not get to
// 0.0°" — at 0° something already touched; "can this rule be ignored?")
export const TOUCH_NEW = 5, TOUCH_MIN = 0, TOUCH_MAX = 15;
const L_DARK = 35, L_LIGHT = 90;                                          // CIELAB L* of the darkest pencil and the lightest, for the rubs between (est.)
export function rubsOf(pencil, dark = RUBS_DARK_NEW, light = RUBS_LIGHT_NEW) {
  if (!pencil) return 1;
  const L = labOf(linOf(pencil.hex))[0], s = clamp((L - L_DARK) / (L_LIGHT - L_DARK), 0, 1);
  return clamp(Math.round(2 ** (Math.log2(Math.max(1, dark)) + s * (Math.log2(Math.max(1, light)) - Math.log2(Math.max(1, dark))))), RUBS_MIN, RUBS_MAX);
}
const flip = g => ({ ...g, a: g.b, b: g.a, ...(g.t === 'A' ? { left: !g.left } : {}) });
// a stroke rubbed k times: there, back, there …, the pencil never up; a
// closed one (OPM's contour) round and round, never back
export const rubbed = (s, k) => {
  const closed = s.length > 1 && gap(s[0].a, s.at(-1).b) < 1e-6, back = closed ? s : s.slice().reverse().map(flip), out = [];
  for (let j = 0; j < Math.max(1, k); j++) out.push(...(j % 2 ? back : s));
  return out;
};
const SAMPLE_MM = 0.5;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const gap = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);

// ---------- the colour: the Preview, every shade its pencil ----------
// res: { nx, ny, h, data: RGBA bytes, row 0 the canvas's top } — the Result's grid (simOf, rgba)
const LIN = Float32Array.from({ length: 256 }, (_, i) => toLin(i / 255));
function sample(res, x, y, acc) {
  const ix = Math.floor(x / res.h), iy = Math.floor(y / res.h);
  if (ix < 0 || iy < 0 || ix >= res.nx || iy >= res.ny) return 0;
  const q = 4 * ((res.ny - 1 - iy) * res.nx + ix);
  acc[0] += LIN[res.data[q]]; acc[1] += LIN[res.data[q + 1]]; acc[2] += LIN[res.data[q + 2]];
  return 1;
}
const PAPER_LAB = labOf(GROUND.map(v => toLin(v / 255)));
// The pencil nearest a colour (linear light), ΔE 2000, or null, the paper —
// kept by its 6-bit sRGB. The light ones (white) are no shade of their own on
// white paper: not chosen.
export function nearestOf(pencils, paperDE = PAPER_DE) {
  const own = pencils.filter(p => p.on && !p.light), labs = own.map(p => labOf(linOf(p.hex))), memo = new Map();
  return lin => {
    const s = lin.map(v => Math.round(clamp(toSrgb(clamp(v, 0, 1)), 0, 1) * 63)), key = (s[0] << 12) | (s[1] << 6) | s[2];
    let k = memo.get(key);
    if (k === undefined) {
      const lab = labOf(s.map(v => toLin(v / 63)));
      let bd = de2000(lab, PAPER_LAB) - paperDE; k = -1;
      labs.forEach((l, i) => { const d = de2000(lab, l); if (d < bd) { bd = d; k = i; } });
      memo.set(key, k);
    }
    return k < 0 ? null : own[k].id;
  };
}

// ---------- the geometry ----------
// t of a point in a region: the shape between its outer one (0) and inner (1)
// through it, by halving — the shapes nest; -1 outside, 2 inside the inner
const inShape = (s, x, y) => {
  const r = Math.max(0, Math.min(s.c, (s.x1 - s.x0) / 2, (s.y1 - s.y0) / 2)), cx = clamp(x, s.x0 + r, s.x1 - r), cy = clamp(y, s.y0 + r, s.y1 - r);
  return x >= s.x0 && x <= s.x1 && y >= s.y0 && y <= s.y1 && Math.hypot(x - cx, y - cy) <= r + 1e-9;
};
export function tOf(R, x, y) {
  if (!inShape(shapeAt(R, 0), x, y)) return -1;
  if (inShape(shapeAt(R, 1), x, y)) return 2;
  let lo = 0, hi = 1;
  for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (inShape(shapeAt(R, m), x, y)) lo = m; else hi = m; }
  return lo;
}
const inFrame = (F, p) => !F || (p[0] >= F.x0 && p[0] <= F.x1 && p[1] >= F.y0 && p[1] <= F.y1);
// Runs of one pencil along a line, the shortest first to its longer
// neighbour while shorter than `shortest` mm — the paper's too, so a hair's
// gap closes and a speck goes; undefined (not drawn there: a side lifted
// over, out of the frame) neither takes one nor goes to one.
// ids: a pencil, null or undefined a sample; L: mm a sample → [{ id, i0, i1, L }]
export function runsOf(ids, L, shortest) {
  const runs = [];
  ids.forEach((id, i) => { const q = runs.at(-1); if (q && q.id === id) { q.i1 = i; q.L += L[i]; } else runs.push({ id, i0: i, i1: i, L: L[i] }); });
  const fixed = new Set(runs.filter(q => q.id === undefined));
  for (;;) {
    let j = -1;
    runs.forEach((q, i) => { if (!fixed.has(q) && q.L < shortest - 1e-9 && (j < 0 || q.L < runs[j].L)) j = i; });
    if (j < 0) break;
    const ok = q => q && q.id !== undefined, A = runs[j - 1], B = runs[j + 1], to = ok(A) && ok(B) ? (A.L >= B.L ? A : B) : ok(A) ? A : ok(B) ? B : null;
    if (!to) { fixed.add(runs[j]); continue; }
    to.L += runs[j].L; to.i0 = Math.min(to.i0, runs[j].i0); to.i1 = Math.max(to.i1, runs[j].i1);
    runs.splice(j, 1);
    for (let i = runs.length - 1; i > 0; i--) if (runs[i].id === runs[i - 1].id) { runs[i - 1].i1 = runs[i].i1; runs[i - 1].L += runs[i].L; if (fixed.has(runs[i])) fixed.add(runs[i - 1]); runs.splice(i, 1); }
  }
  return runs;
}

// ---------- the rings: clockwise round the bands ----------
// N lines' ranks: the first n of them spread evenly over all N for any n —
// van der Corput's halves, quarters, eighths … of the band, each to its line
export function ranksOf(N) {
  const rank = new Int32Array(N).fill(-1);
  let r = 0;
  for (let k = 0; r < N && k < 64 * N; k++) {
    let x = 0, f = 0.5;
    for (let m = k; m; m >>= 1, f /= 2) if (m & 1) x += f;
    const i = Math.min(N - 1, Math.floor(x * N));
    if (rank[i] < 0) rank[i] = r++;
  }
  for (let i = 0; i < N; i++) if (rank[i] < 0) rank[i] = r++;
  return rank;
}
// A shape's pieces clockwise from 12 o'clock's left end: the top, the top
// right corner, the right … the top left corner — dacheplan.js's eight,
// anticlockwise, backwards
const CW = [4, 3, 2, 1, 0, 7, 6, 5];
// a ring's pieces over the samples of its ranges, a line or an arc a stretch of one piece
function ringPieces(L, S, ranges) {
  const out = [];
  let cur = null;
  for (const [i0, i1] of ranges) for (let i = i0; i <= i1; i++) {
    const q = S[i];
    if (cur && cur.p === q.p && Math.abs(cur.f1 - q.f0) < 1e-9) cur.f1 = q.f1;
    else out.push(cur = { p: q.p, f0: q.f0, f1: q.f1 });
  }
  return chain(out.map(q => lineOn(L, q.p, q.f0, q.f1)));
}
// The lines a band keeps (the owner, 2026-10-27, the top right corner beside
// the Preview: white gaps between the rings, a grid — "almost twice as
// accurate" with them closed): N across its widest side, PITCH apart; on
// every other side and round every corner the first n of them by rank, n the
// fewest whose widest gap — the band's edges taken for lines — is within a
// line's width there. The ranks nest: round a corner, as the band widens or
// narrows, a line starts or stops once. → { rank, nAt(p, f) }
const FN = 64;                                                                         // a corner's n read so many times along it
function coverOf(R, N) {
  const rank = ranksOf(N), byRank = [...rank.keys()].sort((a, b) => rank[a] - rank[b]), gapOf = new Float64Array(N + 1).fill(Infinity), pos = [-1, N];
  for (let m = 1; m <= N; m++) {
    const v = byRank[m - 1]; let j = pos.findIndex(x => x > v); pos.splice(j, 0, v);
    let g = 0; for (j = 1; j < pos.length; j++) g = Math.max(g, pos[j] - pos[j - 1]); gapOf[m] = g;
  }
  const need = w => { if (w <= 1e-6) return 0; const G = PITCH * N / w; for (let m = 1; m <= N; m++) if (gapOf[m] <= G + 1e-9) return m; return N; };
  const side = [0, 1, 2, 3, 4, 5, 6, 7].map(p => p % 2 ? 0 : need(widthOn(R, p, 0, 1))), O = shapeAt(R, 0), I = shapeAt(R, 1);
  const corner = [0, 1, 2, 3, 4, 5, 6, 7].map(p => {
    if (p % 2 === 0) return null;
    const na = side[(p + 7) % 8], nb = side[(p + 1) % 8], lo = Math.min(na, nb), hi = Math.max(na, nb);
    const g = Array.from({ length: FN + 1 }, (_, k) => { const a = pointOn(O, p, k / FN), b = pointOn(I, p, k / FN); return clamp(need(gap(a, b)), lo, hi); });
    if (nb >= na) for (let k = 1; k <= FN; k++) g[k] = Math.max(g[k], g[k - 1]); else for (let k = FN - 1; k >= 0; k--) g[k] = Math.max(g[k], g[k + 1]);
    g[0] = na; g[FN] = nb; return g;
  });
  return { rank, nAt: (p, f) => p % 2 === 0 ? side[p] : corner[p][clamp(Math.round(f * FN), 0, FN)] };
}
// Mixed (the owner, 2026-10-27, the corner gaps closed and the raster beside
// them: "maybe we keep it?"): along every line the Preview's colour and what
// the lines before it left over; the one of its MIX_CANDS nearest — the paper
// one of them — nearest that, kept Shortest at least; what it misses carried
// on, 7/16 along, 9/16 to the next line in (Floyd and Steinberg's error
// diffusion), so the pencils' mix is the Preview's colour, not each alone:
// green, orange and ochre intertwined where it is olive brown. Twice the
// strokes, painterly; the look as a whole further off.
const MIX_CANDS = 4, PAPER_LIN = GROUND.map(v => toLin(v / 255)), key6 = lin => lin.map(v => Math.round(clamp(toSrgb(clamp(v, 0, 1)), 0, 1) * 63));
function mixerOf(pencils) {
  const pal = [{ id: null, lin: PAPER_LIN, lab: PAPER_LAB }, ...pencils.filter(p => p.on && !p.light).map(p => ({ id: p.id, lin: linOf(p.hex), lab: labOf(linOf(p.hex)) }))], memo = new Map();
  const cands = lin => {
    const s = key6(lin), key = (s[0] << 12) | (s[1] << 6) | s[2];
    let c = memo.get(key);
    if (!c) { const lab = labOf(s.map(v => toLin(v / 63))); c = pal.map((q, i) => [de2000(lab, q.lab), i]).sort((a, b) => a[0] - b[0]).slice(0, MIX_CANDS).map(([, i]) => i); memo.set(key, c); }
    return c;
  };
  return { pal, cands };
}
// o: { shortest, frame, mix, pencils (Mixed's) } → [{ kind: 'ring', reg, t, pencil, pieces, mm }]
export function ringsOf(regions, res, near, o = {}) {
  const shortest = o.shortest ?? SHORTEST_NEW, F = o.frame, mix = o.mix ? mixerOf(o.pencils ?? cleanPencils(PRISMA_PENCILS)) : null, out = [];
  regions.forEach((R, reg) => {
    const N = Math.max(1, ...[0, 2, 4, 6].map(p => linesIn(widthOn(R, p, 0, 1)))), C = coverOf(R, N), lines = [];
    for (let i = 0; i < N; i++) {                                                       // every line's samples: its piece and f, the Preview's colour — undefined not drawn there, null off the Result
      const t = (i + 0.5) / N, L = shapeAt(R, t), S = [], first = {};
      for (const p of CW) {
        const len = pieceLength(L, p); if (len < 1e-6) continue;
        const ns = Math.max(1, Math.round(len / SAMPLE_MM)); first[p] = [S.length, ns];
        for (let k = 0; k < ns; k++) {
          const f0 = 1 - k / ns, f1 = 1 - (k + 1) / ns, f = (f0 + f1) / 2, n = C.nAt(p, f), h = 0.5 / Math.max(1, n);   // h: half a kept line's strip, of the band
          let lin;
          if (C.rank[i] < n && inFrame(F, pointOn(L, p, f))) {
            const acc = [0, 0, 0]; let got = 0;
            for (const d of [-2 / 3, 0, 2 / 3]) { const q = pointOn(shapeAt(R, clamp(t + d * h, 0, 1)), p, f); got += sample(res, q[0], q[1], acc); }
            lin = got ? acc.map(v => v / got) : null;
          }
          S.push({ p, f0, f1, f, lin, L: len / ns, err: [0, 0, 0] });
        }
      }
      lines.push({ t, L, S, first });
    }
    const at = (j, p, f) => { const fp = lines[j]?.first[p]; return fp ? fp[0] + clamp(Math.floor((1 - f) * fp[1]), 0, fp[1] - 1) : -1; };   // line j's sample of piece p at f
    lines.forEach(({ t, L, S }, i) => {
      let ids;
      if (!mix) ids = S.map(q => q.lin && near(q.lin) || (q.lin === undefined ? undefined : null));
      else {
        ids = []; let cur = -1, run = 0, carry = [0, 0, 0];
        for (const q of S) {
          if (!q.lin) { ids.push(q.lin === undefined ? undefined : null); cur = -1; run = 0; carry = [0, 0, 0]; continue; }
          const want = [0, 1, 2].map(m => q.lin[m] + carry[m] + q.err[m]);
          let c = cur;
          if (cur < 0 || run >= shortest - 1e-9) { const wl = labOf(want.map(v => clamp(v, 0, 1))); let bd = Infinity; for (const j of mix.cands(q.lin)) { const d = de2000(wl, mix.pal[j].lab); if (d < bd) { bd = d; c = j; } } }
          if (c !== cur) { cur = c; run = 0; }
          run += q.L; ids.push(mix.pal[c].id);
          const e = [0, 1, 2].map(m => clamp(want[m], 0, 1) - mix.pal[c].lin[m]);
          carry = e.map(v => v * 7 / 16);
          const k0 = at(i + 1, q.p, q.f);
          if (k0 >= 0) for (const [dk, w] of [[0, 5 / 16], [-1, 3 / 16], [1, 1 / 16]]) { const r = lines[i + 1].S[k0 + dk]; if (r) for (let m = 0; m < 3; m++) r.err[m] += e[m] * w; }
        }
      }
      const runs = runsOf(ids, S.map(q => q.L), mix ? 0 : shortest).filter(q => q.id);
      if (runs.length > 1 && runs[0].i0 === 0 && runs.at(-1).i1 === S.length - 1 && runs[0].id === runs.at(-1).id) {   // round past 12 o'clock: one stroke
        const a = runs.pop(), b = runs.shift();
        runs.push({ id: a.id, ranges: [[a.i0, a.i1], [b.i0, b.i1]], L: a.L + b.L });
      }
      for (const q of runs) out.push({ kind: 'ring', reg, t, pencil: q.id, pieces: ringPieces(L, S, q.ranges ?? [[q.i0, q.i1]]), mm: q.L });
    });
  });
  return out;
}

// ---------- the rays: along the sausages, a cell a band ----------
// a cell's lines: K of them PITCH apart across, up one and down the next, a
// mm across at the ends — from one side, or (flip) the other, so the next
// cell of the same pencil starts where this one ends
export function rayPieces(r) {
  const at = (s, off) => [r.a[0] + r.u[0] * s + r.n[0] * off, r.a[1] + r.u[1] * s + r.n[1] * off], lines = [];
  for (let k = 0; k < r.K; k++) {
    const j = r.flip ? r.K - 1 - k : k, off = (j - (r.K - 1) / 2) * PITCH;
    lines.push(k % 2 ? { t: 'L', a: at(r.s1, off), b: at(r.s0, off) } : { t: 'L', a: at(r.s0, off), b: at(r.s1, off) });
  }
  return chain(lines);
}
// o: { frame } → [{ kind: 'ray', reg, pencil, a, u, n, K, s0, s1, paint, pieces, mm }]
export function raysOf(rects, regions, res, near, o = {}) {
  const F = o.frame, K = linesIn(SAUSAGE_W), out = [];
  for (const q of sausagesOf(rects.map(r => ({ ...r, ss: r.ss ?? [] })))) {
    const v = [q.b[0] - q.a[0], q.b[1] - q.a[1]], len = Math.hypot(v[0], v[1]);
    if (len < SAMPLE_MM) continue;
    const u = [v[0] / len, v[1] / len], n = [-u[1], u[0]], mid = [(q.a[0] + q.b[0]) / 2, (q.a[1] + q.b[1]) / 2];
    const reg = regions.findIndex(R => R.rect === q.ri && (R.kind === 'core') === !!q.core && (R.kind !== 'blend' || (t => t >= 0 && t <= 1)(tOf(R, mid[0], mid[1]))));
    if (reg < 0) continue;
    const R = regions[reg], nb = bandsOf(R), ns = Math.max(1, Math.round(len / SAMPLE_MM)), cells = [];
    for (let k = 0; k < ns; k++) {                                                      // the band under every sample along its middle
      const c = [q.a[0] + v[0] * (k + 0.5) / ns, q.a[1] + v[1] * (k + 0.5) / ns], t = tOf(R, c[0], c[1]);
      const band = t < 0 || t > 1 || !inFrame(F, c) ? -1 : Math.min(nb - 1, Math.floor(t * nb)), acc = [0, 0, 0];
      let got = 0;
      if (band >= 0) for (let j = 0; j < K; j++) { const off = (j - (K - 1) / 2) * PITCH; got += sample(res, c[0] + n[0] * off, c[1] + n[1] * off, acc); }
      const last = cells.at(-1), s0 = k / ns * len, s1 = (k + 1) / ns * len;
      if (last && (last.band === band || (band >= 0 && last.band >= 0 && last.s1 - last.s0 < RAY_MIN))) { last.band = band; last.s1 = s1; for (let m = 0; m < 3; m++) last.acc[m] += acc[m]; last.got += got; }
      else cells.push({ band, s0, s1, acc, got });
    }
    let prev = null;
    for (const c of cells) {
      const id = c.band < 0 || !c.got ? null : near(c.acc.map(x => x / c.got));
      if (!id) { prev = null; continue; }
      const flip = !!prev && prev.pencil === id && K % 2 === 1 && !prev.flip;            // the same pencil on: from the side the last one ended on
      out.push(prev = { kind: 'ray', reg, pencil: id, a: q.a, u, n, K, s0: c.s0, s1: c.s1, paint: q.paint, ...(flip ? { flip } : {}) });
    }
  }
  for (const r of out) { r.pieces = rayPieces(r); r.mm = r.pieces.reduce((a, g) => a + lineLen(g), 0); }
  return out;
}

// ---------- the plan ----------
// A pencil with next to nothing to draw (DACHE's LEAST_MM, LEAST_SHARE) is
// left out, its strokes to the nearest of the rest: no change of pencil for
// a few specks.
// o: { pencils, shortest, frame, corner, mix } → { regions, rings, rays, modules: rings and rays, few }
export function prismaPlan(rects, res, o = {}) {
  const pencils = o.pencils ?? cleanPencils(PRISMA_PENCILS), regions = regionsOf(rects, o);
  const once = ps => { const near = nearestOf(ps), rings = ringsOf(regions, res, near, { ...o, pencils: ps }), rays = raysOf(rects, regions, res, near, o); return { regions, rings, rays, modules: [...rings, ...rays] }; };
  const D = once(pencils), mm = new Map();
  for (const M of D.modules) mm.set(M.pencil, (mm.get(M.pencil) ?? 0) + M.mm);
  const least = Math.min(o.least ?? LEAST_MM, LEAST_SHARE * [...mm.values()].reduce((a, v) => a + v, 0)), few = [...mm].filter(([, v]) => v < least).map(([id]) => id);
  if (!few.length) return { ...D, few };
  return { ...once(pencils.map(p => few.includes(p.id) ? { ...p, on: false } : p)), few };
}
// The passes, a pencil each in the run's order: its strokes nearest next from
// where the last ended — a ring from its start, clockwise; a ray from either
// end — on with the pencil on the paper to one JOIN_MM away, else up and over.
// Rubbed (o.rubs, a pencil's id → times), every module a stroke of its own,
// the next from where the rubbing left the pencil — back at its start after
// an even number; mm the line rubbed, every time over.
// → [{ pencil, strokes: [canvas pieces], modules, rings, rays, mm, rubs }]
export function passesOf(plan, order, o = {}) {
  const passes = [], all = plan.modules;
  let at = [0, 0];                                                                          // home: the canvas's bottom left corner, near enough
  for (const pc of order) {
    const mine = all.filter(M => M.pencil === pc.id && M.pieces.length), rubs = o.rubs ? o.rubs(pc.id) : 1;
    if (!mine.length) continue;
    const G = gridOf(mine.map(M => M.kind === 'ring' ? [M.pieces[0].a, M.pieces[0].a] : [M.pieces[0].a, M.pieces.at(-1).b])), strokes = [];
    let cur = null, mm = 0;
    for (let left = mine.length; left > 0; left--) {
      const [i, e] = G.nearest(at), M = mine[i];
      G.take(i);
      const pieces = M.kind === 'ray' && e === 1 ? M.pieces.slice().reverse().map(g => ({ t: 'L', a: g.b, b: g.a })) : M.pieces;
      if (rubs === 1 && cur && gap(at, pieces[0].a) <= JOIN_MM) cur.push(...chain([{ t: 'L', a: at, b: pieces[0].a }]), ...pieces);
      else strokes.push(cur = [...pieces]);
      at = rubs > 1 && rubs % 2 === 0 ? pieces[0].a : pieces.at(-1).b;
    }
    for (const s of strokes) for (const g of s) mm += lineLen(g) * rubs;
    passes.push({ pencil: pc.id, strokes: strokes.map(chain), modules: mine.length, rings: mine.filter(M => M.kind === 'ring').length, rays: mine.filter(M => M.kind === 'ray').length, mm, rubs });
  }
  return passes;
}
// The rows for strokes.js's plotRun, machine mm from Here: a pass a row, one
// path — its strokes one after another, from the end of one to the start of
// the next straight, the pencil up on the move (a turn, the elbow up through
// it, down to land: "it lifts here and lands there", no stop); the last of
// every pass but the last ending with the pencil on the paper (tailOut 0), its
// change. info: a row's pencil, for the LCD and its swatch; lifts: how many.
export const LIFT_S = 0.18;                                                                 // s a lift and a landing take more than the move (CARAN's, est.)
export function drawRows(passes, pencils, o) {
  const ps = [], info = [], byId = Object.fromEntries(pencils.map(p => [p.id, p]));
  let lifts = 0;
  passes.forEach((P, k) => {
    const row = k + 1, path = [];
    P.strokes.forEach((s, j) => { const r = rubbed(s, P.rubs ?? 1); if (j) { path.push({ t: 'L', a: path.at(-1).b, b: r[0].a, turn: true }); lifts++; } path.push(...r); });
    ps.push(path.map((g, i) => ({ ...machinePiece(g, o), tilt: 0, row, ...(g.turn ? { turn: true } : {}), ...(i === path.length - 1 && k < passes.length - 1 ? { tailOut: 0 } : {}) })));
    info.push({ label: `${row}/${passes.length} · ${byId[P.pencil]?.name ?? P.pencil}`, pencil: P.pencil, pass: k, L: P.mm });
  });
  return { ps, info, lifts };
}
