// COLORS' mixing model (2026-11-10): a jar of any picture from the paints on the owner's shelf, as COLORS' recipes for LAB's real 3 were
// worked out — single-constant Kubelka–Munk on every channel, every paint of the same strength, parts by volume — so that a new picture's
// jars get a recipe of their own, not a card written by hand (Kuzya's audit, Rembrandt_COLORS_FORM-G_Registry_Audit_Claude_2026-11-10.pdf:
// "ingest, do not copy by hand"). Every recipe here is a model's, est.: no dry swatch, no measured ΔE; Black is far stronger than the
// model's "same strength" says, so a recipe with Black is to be mixed by drops.

const M = [[3.2406, -1.5372, -0.4986], [-0.9689, 1.8758, 0.0415], [0.0557, -0.2040, 1.0570]];
const MI = [[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]];
const W = [0.95047, 1, 1.08883];
const f = t => t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116;
const fi = t => t > 6 / 29 ? t ** 3 : 3 * (6 / 29) ** 2 * (t - 4 / 29);

export const hexLin = hex => [1, 3, 5].map(i => { const v = parseInt(hex.slice(i, i + 2), 16) / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
export function linLab(c) {
  const x = MI.map(r => r[0] * c[0] + r[1] * c[1] + r[2] * c[2]);
  const [fx, fy, fz] = x.map((v, i) => f(v / W[i]));
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
export function labLin([L, a, b]) {
  const fy = (L + 16) / 116, x = [fi(a / 500 + fy) * W[0], fi(fy), fi(fy - b / 200) * W[2]];
  return M.map(r => r[0] * x[0] + r[1] * x[1] + r[2] * x[2]);
}
// a paint's reflectance, its floor (est.): 2 % was tried and took every dark jar out of reach (Black itself 7.6 off)
export const R_MIN = 0.002;
const clampR = v => Math.min(0.998, Math.max(R_MIN, v));
const ksOf = R => (1 - R) ** 2 / (2 * R);
const rOf = ks => 1 + ks - Math.sqrt(ks * ks + 2 * ks);

// CIEDE2000
export function de2000([L1, a1, b1], [L2, a2, b2]) {
  const r = Math.PI / 180, C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cm = (C1 + C2) / 2, G = 0.5 * (1 - Math.sqrt(Cm ** 7 / (Cm ** 7 + 25 ** 7)));
  const A1 = a1 * (1 + G), A2 = a2 * (1 + G), c1 = Math.hypot(A1, b1), c2 = Math.hypot(A2, b2);
  const h = (y, x) => { const v = Math.atan2(y, x) / r; return v < 0 ? v + 360 : v; };
  const h1 = h(b1, A1), h2 = h(b2, A2), dL = L2 - L1, dC = c2 - c1;
  let dh = h2 - h1; if (c1 * c2 === 0) dh = 0; else if (dh > 180) dh -= 360; else if (dh < -180) dh += 360;
  const dH = 2 * Math.sqrt(c1 * c2) * Math.sin(dh * r / 2), Lm = (L1 + L2) / 2, cm = (c1 + c2) / 2;
  let hm = h1 + h2; if (c1 * c2 !== 0) hm = Math.abs(h1 - h2) > 180 ? (h1 + h2 < 360 ? (h1 + h2 + 360) / 2 : (h1 + h2 - 360) / 2) : (h1 + h2) / 2;
  const T = 1 - 0.17 * Math.cos((hm - 30) * r) + 0.24 * Math.cos(2 * hm * r) + 0.32 * Math.cos((3 * hm + 6) * r) - 0.2 * Math.cos((4 * hm - 63) * r);
  const SL = 1 + 0.015 * (Lm - 50) ** 2 / Math.sqrt(20 + (Lm - 50) ** 2), SC = 1 + 0.045 * cm, SH = 1 + 0.015 * cm * T;
  const RT = -2 * Math.sqrt(cm ** 7 / (cm ** 7 + 25 ** 7)) * Math.sin(60 * Math.exp(-(((hm - 275) / 25) ** 2)) * r);
  return Math.sqrt((dL / SL) ** 2 + (dC / SC) ** 2 + (dH / SH) ** 2 + RT * (dC / SC) * (dH / SH));
}

// the paints a mix may take: the shelf's, not the owner's own trial mixes (①, ②, ⑧, ⑩, ⑫, ⑬), not ④ and ⑦ (Red and Deep Red again),
// not the iridescent (its colour by the angle)
export const NOT_MIXED = ['s1', 's2', 's4', 's7', 's8', 's10', 's12', 's13', 'dyna'];
// how strongly a paint scatters, against a plain one's 1 (est.): two-constant Kubelka–Munk, so that White is not the weakling the one-constant
// model makes it (a mid grey had come out White 200 : Black 1, a coral Sand Yellow with a touch of Red); the reds' recipes do not move
export const SCATTER = { white: 6, sandyellow: 2.5, ochre: 1.5, pink: 1.5 };
export const mixable = paints => paints.filter(p => !NOT_MIXED.includes(p.id)).map(p => ({ ...p, s: SCATTER[p.id] ?? 1, ks: labLin(p.lab).map(v => ksOf(clampR(v))) }));

// a mix of [paint, parts] … → its CIELAB: K and S each the parts' sum, K = (K/S)·S
export function mixLab(parts) {
  const S = parts.reduce((a, [p, w]) => a + (p.s ?? 1) * w, 0);
  return linLab([0, 1, 2].map(i => rOf(parts.reduce((a, [p, w]) => a + p.ks[i] * (p.s ?? 1) * w, 0) / S)));
}

// the painter's way (COLORS' recipes for real 3, the owner's and Kuzya's): the shelf's own named paints; the dark reds from two mothers —
// Red, and Red with Dark Brown half and half (real 3's Jar 43) — "darken with Dark Brown, not with Black: violet cools a red, black dulls
// it"; so a red jar takes no Black, no violet, no blue. The neon is the owner's fluorescent lemon as it comes (its plan colour; not
// measured), the olive in the neon's shade from it.
export const PREFER = ['red', 'darkbrown', 'white', 'black', 'pink', 'orange', 'orangeyellow', 'sandyellow', 'ochre', 'lemon', 'roseazo', 'deepred', 'ultramarine', 'skyblue', 's3'];
// the families, by the jar's own colour: a red takes no Black, no violet, no blue; an olive is the fluorescent lemon in its shade; a blue grey
// Ultramarine with Black and White; a grey White with Black by drops and a tint
export const FAMILIES = {
  red: ['red', 's3', 'deepred', 'orange', 'mother', 'darkbrown', 'white', 'pink', 'roseazo', 'sandyellow'],
  olive: ['fluo', 'lemon', 'orangeyellow', 'ochre', 'darkbrown', 'black', 'white', 'ultramarine'],
  blue: ['ultramarine', 'skyblue', 'black', 'white', 'darkbrown', 'sandyellow'],
  grey: ['white', 'black', 'darkbrown', 'sandyellow', 'ochre', 'red', 'skyblue'],
};
export const FLUO = { id: 'fluo', name: 'Fluorescent lemon, as it comes', hex: '#EEED08', note: 'the owner\'s fluorescent yellow ("lemon, really fierce"): its plan colour, not measured' };
export function shelfOf(paints) {
  const P = mixable(paints.filter(p => PREFER.includes(p.id)));
  const fluo = { ...FLUO, lab: linLab(hexLin(FLUO.hex)) };
  const red = P.find(p => p.id === 'red'), brown = P.find(p => p.id === 'darkbrown');
  const out = [...P, ...mixable([fluo])];
  if (red && brown) {
    const lab = mixLab([[red, 1], [brown, 1]]);
    out.push({ id: 'mother', name: 'Dark mother (Red + Dark Brown 1 : 1)', hex: null, lab, s: 1, ks: labLin(lab).map(v => ksOf(clampR(v))), mother: [['red', 1], ['darkbrown', 1]] });
  }
  return out;
}
const hue = ([, a, b]) => { const h = Math.atan2(b, a) * 180 / Math.PI; return h < 0 ? h + 360 : h; };
// a red of the body: a* well over 0, its hue from crimson to orange
export const isRed = t => t[1] > 20 && (hue(t) > 345 || hue(t) < 62);
export function familyOf(t) {
  const C = Math.hypot(t[1], t[2]), h = hue(t);
  if (isRed(t)) return 'red';
  if (C > 15 && h >= 62 && h < 135) return 'olive';
  if (C > 5 && h >= 180 && h < 320) return 'blue';
  return 'grey';
}
// a red so saturated that White would only take it to pink: no White in it — the reds, Pink and the mothers (the model, with every
// paint of the same strength, had put White into the fiercest reds)
export const SATURATED = 60;
export function jarRecipe(hex, shelf) {
  const t = linLab(hexLin(hex)), fam = familyOf(t), deep = fam === 'red' && Math.hypot(t[1], t[2]) > SATURATED;
  const ids = FAMILIES[fam].filter(id => !(deep && id === 'white')).concat(fam === 'grey' && t[0] > 55 ? ['pink'] : []);
  return { ...recipeOf(hex, shelf.filter(p => ids.includes(p.id))), family: fam };
}

const PAIR = [[1, 0], [200, 1], [100, 1], [60, 1], [40, 1], [30, 1], [20, 1], [15, 1], [12, 1], [10, 1], [8, 1], [6, 1], [5, 1], [4, 1], [3, 1], [5, 2], [2, 1], [3, 2], [4, 3], [1, 1]];
const SCALE = [1, 2, 3, 5, 8, 12, 20];
// the simplest recipe within SIMPLER of the best: one paint, then two, then three (the third one part)
export const SIMPLER = 2;
export function recipeOf(hex, paints) {
  const t = linLab(hexLin(hex)), score = parts => de2000(t, mixLab(parts));
  let one = null;
  for (const p of paints) { const d = score([[p, 1]]); if (!one || d < one.de) one = { parts: [[p, 1]], de: d }; }
  const pairs = [];
  for (let i = 0; i < paints.length; i++) for (let j = 0; j < paints.length; j++) {
    if (i === j) continue;
    for (const [a, b] of PAIR) { if (!b) continue; const parts = [[paints[i], a], [paints[j], b]]; pairs.push({ parts, de: score(parts) }); }
  }
  pairs.sort((u, v) => u.de - v.de);
  const two = pairs[0];
  let three = null;
  for (const q of pairs.slice(0, 12)) for (const p of paints) {
    if (q.parts.some(([x]) => x === p)) continue;
    for (const k of SCALE) {
      const parts = [[q.parts[0][0], q.parts[0][1] * k], [q.parts[1][0], q.parts[1][1] * k], [p, 1]], d = score(parts);
      if (!three || d < three.de) three = { parts, de: d };
    }
  }
  const best = Math.min(one.de, two.de, three?.de ?? 1e9);
  const pick = one.de <= best + SIMPLER ? one : two.de <= best + SIMPLER ? two : three;
  const g = (x, y) => y ? g(y, x % y) : x, d = pick.parts.reduce((a, [, w]) => g(a, w), 0);
  return { parts: pick.parts.map(([p, w]) => [p.id, w / d]).sort((u, v) => v[1] - u[1]), de: Math.round(pick.de * 10) / 10 };
}

// a CIELAB colour for the screen
export const labHex = lab => '#' + labLin(lab).map(v => { const c = Math.min(1, Math.max(0, v)); return Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)).toString(16).padStart(2, '0'); }).join('').toUpperCase();
