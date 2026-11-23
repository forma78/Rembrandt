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
import { GEN, GEN_FORMATS, paletteOf, hexOfLab, labOfHex, fieldOf } from './genfplan.js';
import { jarsByCanvas, ELBOW_J3 } from './canon.js';
import { seqOf, FORMG } from './formgplan.js';

// orange-bear: a gummy bear, 40 × 40, the 2 mm brush's test (the owner, 2026-11-22, the evening: "the bear can be made as orange_bear.png — for the GOGH
// tab"; "it is a 40 × 40 test"), GEN-V's screen 1, 10 colours, 2683 dabs
// orange-bear-20: the bear's head, 20 × 20, the 2 mm brush's first test on the machine (the owner, the same evening: "add 20 × 20 cm to GOGH and we make the
// first test"), GEN-V's screen 2, 14 colours → 13 jars, margins 6, 1285 dabs
// press-test-20: Jar 19's thickest cluster of the bear's head, its flood (2026-11-22, the night), six times on a 20 × 20 — the owner: "draw right in GOGH a test
// screen 20 × 20 and for one paint repeat the cluster … in different variations … the press. Such a block fits on the canvas six times"; a line a block
// press-lengths-20, the press test made again (the owner, 2026-11-23, the night: "just redraw the Press test from zero, with legs of different lengths, so we
// check the length too"): six blocks, each its lone dabs 4 … 15 mm and a patch of dabs side by side; press-test-20 (Jar 19's cluster six times) its place before
// press-paints-20, Press test 3 (the owner, 2026-11-23: "take the grey paint Jar 28 … the orange Jar 6 and the red TAIL LIGHT 14"; "six modules again, but in
// groups as No. 5 and No. 6"; of their patches: "I would set them a little wider still"): a paint a column, two blocks each, the patches 5 mm apart; on the
// screen its drops (DROP), not the ideal dabs
// press-short-20, Press test 5 (the owner, 2026-11-23, the brush changed after Kuzya's report: "I need a smaller stroke now … can we bring the slider down
// to 6 mm? Then just make Press test 5"): Press test 2's six blocks, one jar, a RUN a block; its drops the new brush's (DROP)
// porsche-led-20-4, -3, -2, the porsche with its headlight in 1 and ½ (GOGH-2's start, the owner, 2026-11-23: "by the principle of 1 and ½ … if a headlight or some
// small detail, ½ a seed; if a fill as the bonnet, there 1 leg"), columns 4, 3 and 2 mm apart (GOGH/generator/led.py); the 4 mm the one painted first
// bear-led-30-3, -4, the gummy bear's head in 1 and ½ on 30 × 30, two layers (the owner, 2026-11-23: "our principle of 1 and ½ the other way round, on the gummy
// bear head's portrait … last we lay only the seeds of the lightest and the darkest. Properly as Layer 2. Then the wet on wet is solved too"): Layer 2 the seeds
// of the two lightest and the two darkest jars, on the dry first; a fill's near shades one leg (GOGH/generator/led.py, ext, near 12)
// press-stamps-20, Press test 5 v.6 (the owner, 2026-11-23, the night, the spatula nib: "make a new test picture v.6 and only the last, sixth module. No settings
// to set at all. Let them be preset"): block 6 alone at its place, seeds as stamps (`stamp`, no lift beyond), its `preset` put on the sliders when chosen
// headlight-nib-20, the headlight for the spatula nib (the owner, 2026-11-23, the night, the stamps a victory: "shall we make a new picture for the headlight
// test?"; Kuzya's "an enlarged headlight with a bit of the wing on 20 × 20"): for-LAB's crop in 1 and ½, columns 5 mm, every dab a stamp, two layers, preset
// headlight-nib-20-v2 (the owner, 2026-11-23, the night: "make v.2 of the headlight … not changing the colours … we do not need so many shades for the test"; "no,
// the other way, closer!"): his jars as he set them by 🔄, a line each, 13 jars; columns 4 mm apart
export const GOGH_LIB = ['headlight-nib-20-v2', 'headlight-nib-20', 'press-stamps-20', 'bear-led-30-3', 'bear-led-30-4', 'porsche-led-20-4', 'porsche-led-20-3', 'porsche-led-20-2', 'press-short-20', 'press-paints-20', 'press-lengths-20', 'orange-bear-20', 'orange-bear'];   // the library: a name here, its json and jpg in app/gogh/; this Mac's own pictures (gogh/local.json, gitignored) in front of it
// mm, est.: aim, min, max — a dab's length (the owner: "drops of 2 cm"; IMG_3377's measure 13 … 17 mm off an 8 mm mark), the shortest a column's stretch is
// cut into, the longest; crumb: a stretch of the picture shorter than this left bare; len: what a mm off `aim` costs, squared, in CIELAB ΔE² (a dab's
// colour against the picture's, summed a mm); stagger: what a dab's end costs `near` mm from one in the column to its left, so the dabs lie as bricks,
// not in rows; trim: the leg on the machine so many mm in from the dab's ends — the brush lands on the move, the J3 lands it 3 mm earlier and lifts it
// 3 mm later (canon.js, ELBOW_J3), the paint runs on past the leg (IMG_3377: 8 mm marks, J3's 14 mm on the machine, dabs of 13 … 17)
export const DAB = { aim: 20, min: 12, max: 24, crumb: 6, len: 3, stagger: 300, near: 2, trim: 3, gap: 0.6, run: 0, wide: 0.96 };
// a brush's own dab over DAB. The 2 mm (the owner, 2026-11-22, the evening, the new brushes come, the sharpest circled in green, GOGH/IMG_3395.jpg; his
// strokes by a ruler, IMG_3390.jpg: "I could not stretch it to 20 mm. All as you warned: a brush this narrow does not hold much paint, so the longest stroke
// is 15 mm. But that is enough for us"): its dabs 8 … 15 mm, ≈ 12 (est.); its gap −0.2, his own setting for it ("I make the adjustment for exactly the new
// 2 mm brush")
export const DAB_BRUSH = { 2: { aim: 12, min: 8, max: 15, gap: -0.2 } };
export const dabOf = (pitch = GEN.pitch) => ({ ...DAB, ...(DAB_BRUSH[pitch] ?? {}) });
// GEN-V's formats: GEN-F's, and a 20 × 20 for tests in front (the owner, 2026-11-22: "a 20 × 20 cm format for tests"), LAB's canvas; its field 30 mm in
export const GENV_FORMATS = [{ id: '20x20', w: 200, h: 200, test: true }, ...GEN_FORMATS];
export const formatV = id => GENV_FORMATS.find(f => f.id === id) ?? GENV_FORMATS.find(f => f.id === '40x40');
// GEN-V's field: the whole canvas where the canvas lies within the reach (the owner, the same evening, of a 20 × 20 test, "the field 140 × 140": "you
// made margins … there must be none. Margins only for 60 × 60 and up, our limit is physical, 550 mm. But 200 × 200 mm we print without trouble … 40 × 40
// too, without the limiting contour"): the 20 × 20 and the 40 × 40 edge to edge; a canvas past the reach (GEN.across × GEN.along) GEN-F's field, 30 mm in
// Across Y a brush's own (the owner, the same evening: "540 — there we are being careful. Yes, it held while the brush was 5 mm. But for the 2 mm brush it is far
// too big a reserve. Why? We can easily make 556 mm — add 16 mm, 8 mm a side"; "only for GEN-V"): the 2 mm 556, the others GEN.across, 540. Along X GEN.along.
export const ACROSS_V = { 2: 556 };
export const acrossV = (pitch = GEN.pitch) => ACROSS_V[pitch] ?? GEN.across;
// Margins · zoom (the owner, the same evening: "I would like to place the picture on 20 × 20 and 40 × 40 myself … a margins slider on all the formats, on
// 60 × 60 and 70 × 100 too! Make such a zoom for the picture, from 0 to 20 mm"; "Scale, or call it as you like"; of "Margins · zoom": "yes, great"): mm off the field's every side, the picture
// as large as the rest lets it, in the middle; a format's own
export const MARGIN_UI = [0, 20, 1];
export const marginOf = v => inRange(v ?? 0, MARGIN_UI);
export const wholeV = (f, pitch = GEN.pitch) => !f.frame && f.w <= acrossV(pitch) && f.h <= GEN.along;
// the field before the margins: the canvas as far as the brush reaches it, across Y its brush's; a new frame's GEN-F's, 30 mm in
export const reachV = (f, pitch = GEN.pitch) => f.frame ? fieldOf(f) : { w: Math.min(f.w, acrossV(pitch)), h: Math.min(f.h, GEN.along) };
export const fieldV = (f, pitch = GEN.pitch, margin = 0) => { const F = reachV(f, pitch), m = marginOf(margin); return { w: F.w - 2 * m, h: F.h - 2 * m }; };
// The owner's four sliders (2026-11-22: "three sliders on the principle of ELBOW LIVE · BRUSH … Oh, I need a fourth"), mm, [min, max, step]:
//   brush: the brush's width, GEN-V's — a picture's columns are its brush apart ("now always 5 mm, but I ordered new brushes, there is a 3 mm"); the 2 mm
//        since the evening ("add a 2 mm button to GEN-V");
//   gap: dab to dab in a column, the plan's and the screen's — every dab gap / 2 shorter at both ends, minus longer ("from −0.6 to +0.6 mm, so your
//        default hair can be squeezed in tests"); 0.6 the hair GEN-V drew; a brush's own, −0.2 the 2 mm's (DAB_BRUSH);
//   wide: a dab's width on the screen alone, of the brush at first ("we cannot simply widen the dab, it depends on how thick the paint is and how much of it
//        hangs on the brush … this slider will just show approximately what we will see on the canvas"), est.; a brush's own, from 1 mm for the 2 mm;
//   run: mm the brush runs on past a dab at both ends, the machine's alone — it lands earlier and lifts later, the picture as it is ("+1 mm at the top and
//        +1 mm at the bottom … a standard dab 20 mm … 22, 24, 26 and 28 mm, four options"); below 0 since 2026-11-23, the new brush (the owner: "I need a
//        smaller stroke now … can we bring the slider down to 6 mm?"): it lands later and lifts earlier, the 2 mm's 12 mm dab running 6, 8, 10 at −3, −2, −1;
//        a leg no shorter than DAB_LEG (the J3's 3 + 3 still on it); down to −4 since the same evening (the owner: "can we make ¼ at all? 6 mm and 4 mm?"):
//        what the leg cannot give the J3 gives — its 3 mm at each end less by it (dabJ3), the 12 mm dab running 4
export const DAB_UI = { brush: [2, 3, 5], gap: [-0.6, 0.6, 0.1], wide: [1, 8, 0.1], run: [-4, 4, 1] };
export const DAB_LEG = 0.2;   // mm, the shortest leg a negative run leaves, so it keeps its way down (est.)
const inRange = (v, [lo, hi, st]) => { const q = Math.round(Math.min(hi, Math.max(lo, +v || 0)) / st) * st; return +q.toFixed(2) || 0; };
export const dabGapOf = (v, pitch = GEN.pitch) => inRange(v ?? dabOf(pitch).gap, DAB_UI.gap), dabRunOf = v => inRange(v ?? DAB.run, DAB_UI.run), dabWideOf = (v, pitch = GEN.pitch) => inRange(v ?? DAB.wide * pitch, DAB_UI.wide);
export const brushOf = v => DAB_UI.brush.includes(+v) ? +v : GEN.pitch;
// genfplan.js's fitOf on a brush's columns: as large as the field lets it (GEN-V's, fieldV), its aspect kept, N columns `pitch` apart, R mm along, centred on
// the canvas
export function fitV(f, iw, ih, pitch = GEN.pitch, margin = 0) {
  const F = fieldV(f, pitch, margin), N = Math.max(1, Math.floor(Math.min(F.w, F.h * iw / ih) / pitch)), R = Math.max(1, Math.min(F.h, Math.round(N * pitch * ih / iw)));
  return { N, R, pitch, left: (f.w - N * pitch) / 2, top: Math.round((f.h - R) / 2), field: F };
}
// a dab on the screen, GEN-V's Sketch and GOGH's Picture: its painted span `gap` shorter, a round-ended line `wide` mm across → the line's ends, top and bottom
export function dabOnScreen(top, bot, gap = DAB.gap, wide = DAB.wide * GEN.pitch) { const L = Math.max(0, top - bot - gap), r = Math.min(wide, L) / 2, m = (top + bot) / 2; return [m + L / 2 - r, m - L / 2 + r]; }
// A drop, the dab as the brush lays it (the owner, 2026-11-23: "do not draw the ideal even sausages any more. Take the red contour and leave the pink
// inside"; then: "a barely visible yellow contour of the sausage, the master, and the pink drop with its red contour its phantom slave. So we can correct
// that drop of 1.5 mm and its tip 13 mm past the end"): the master the plan's dab as the screen draws it (dabOnScreen), the slave the paint, hung on it by
// two numbers of the screen's alone. On a card with `drop`. Both by the machine's way at RUN 12, the leg and the J3's 3 + 3: on a dab longer than the floor
// the master's own span, a shorter one's the floor's 9 mm about its middle:
//   top: the paint's top so far under the way's start; tip: the paint's tip so far past the way's end, and the RUN's 2 mm a step once more;
//   wide: the widest; profile: the half-width down the drop, [share of its length, share of the widest].
// The new brush (the owner, 2026-11-23, after Kuzya's report; "look how beautiful it comes out … shall we redraw the drops?"), off GOGH/IMG_3466 and
// IMG_3467 at RUN 12, scaled by the lone dabs' 6 mm, est.: ≈ 2.8 mm wide (2.5 … 3.1), a pill — the head round, the widest a third down, a slight taper,
// the end blunt; the paint ≈ the way + 1 … 3 mm (4 … 10 mm dabs 8.2 … 13.3 mm, 12 mm 13.3 … 15.2, 15 mm 17.9 … 20.6, a patch's 12 mm 12.0 … 14.0); top 0.5
// the owner's on the screen. The old 2 mm brush's of Press test 2 (IMG_3435, IMG_3438, IMG_3441): 4.6 mm, a leaf — the top pointed, the widest 6 mm down,
// a needle's tail — top 1.5, tip 12.
export const DROP = { top: 0.5, tip: 2, wide: 2.8, profile: [[0, 0], [0.05, 0.55], [0.15, 0.85], [0.3, 1], [0.5, 0.93], [0.7, 0.87], [0.85, 0.78], [0.95, 0.55], [1, 0.3]] };
// RUN 6, the run −3 (Press test 3 again, GOGH/IMG_3469, IMG_3470, blocks 4 … 6): every dab a seed, whatever the plan's length — 4 … 15 mm all 6.4 … 7.6 mm
// long, 3.4 … 3.7 wide, an almond, the head round, the tail pointed; its top where the pill's is. Between RUN 12 and 6 the pill turns into the seed by the
// run (est., RUN 10 and 8 not measured yet)
export const SEED = { len: 7, wide: 3.5, profile: [[0, 0], [0.08, 0.6], [0.2, 0.88], [0.4, 1], [0.6, 0.95], [0.8, 0.72], [0.93, 0.4], [1, 0.1]] };
export const DROP_UI = { top: [0, 5, 0.5], tip: [0, 25, 0.5] };   // the sliders, mm [min, max, step]
export const dropTopOf = v => inRange(v ?? DROP.top, DROP_UI.top), dropTipOf = v => inRange(v ?? DROP.tip, DROP_UI.tip);
// The spatula nib's drop (the owner, 2026-11-24, the night: "maybe trim the drops a little to the new nib? They are as FORM-G, only now neat as mosaic stones, no
// more seeds"; GOGH/IMG_3495, IMG_3504): a card's `nib` — a stone, a rounded rectangle NIB.wide across, its corners NIB.r, from the machine's way's start less
// the drop's top to its end and the tip past it, the way its own (the RUN's, the stamps' seedJ3); est. by v.6 on canvas, a stamp ≈ 4.3 × 6 mm
export const NIB = { wide: 4.3, r: 1.4 };
function stoneOf(x, a, b, o) {
  const seed = isSeed(a, b, o), [[, s], [, e]] = dabLeg(x, a, b, o), j = dabJ3(a, b, o) ?? (seed && Number.isFinite(o.seedJ3) ? { early: o.seedJ3, late: o.seedJ3 } : ELBOW_J3);
  const top = s + j.early - dropTopOf(o.top), bot = e - j.late - dropTipOf(o.tip), P = Math.max(1, top - bot), half = (o.wide ?? NIB.wide) / 2, r = Math.min(NIB.r, half, P / 2);
  const h = d => d < r ? half - r + Math.sqrt(Math.max(0, r * r - (r - d) ** 2)) : d > P - r ? half - r + Math.sqrt(Math.max(0, r * r - (d - P + r) ** 2)) : half;
  const n = Math.max(12, Math.ceil(P / 0.25)), ds = [...new Set([...Array.from({ length: n + 1 }, (_, i) => P * i / n), ...Array.from({ length: 9 }, (_, i) => r * i / 8), ...Array.from({ length: 9 }, (_, i) => P - r * i / 8)])].filter(d => d >= 0 && d <= P).sort((p, q) => p - q);
  const side = ds.map(d => [d, h(d)]);
  return [...side.map(([d, w]) => [x + w, top - d]), ...side.reverse().map(([d, w]) => [x - w, top - d])];
}
// a dab's drop → its outline, [[x, y]] clockwise from its top; o.nib: the nib's stone; o: { gap, run, top, tip } — the sliders'; wide, a card's own brush (`dropWide`, est.)
export function dropOf(x, a, b, o = {}) {
  if (o.nib) return stoneOf(x, a, b, o);
  const run = isSeed(a, b, o) ? -3 : dabRunOf(o.run), [[, s], [, e]] = dabLeg(x, a, b, { ...o, run: 0, seed: 0 });
  const k = Math.min(1, Math.max(0, -run / 3)), base = o.wide ?? DROP.wide;                  // 0 at RUN 12 and over, 1 at RUN 6: the pill to the seed
  const pill = Math.max(1, (s + ELBOW_J3.early - dropTopOf(o.top)) - (e - ELBOW_J3.late - dropTipOf(o.tip) - 2 * run));
  const top = s + ELBOW_J3.early - dropTopOf(o.top), P = pill + (SEED.len + 2 * Math.min(0, run + 3) - (isSeed(a, b, o) && Number.isFinite(o.seedJ3) ? ELBOW_J3.early - o.seedJ3 : 0) - pill) * k, half = (base + (SEED.wide * base / DROP.wide - base) * k) / 2;   // RUN 4: the seed 2 mm shorter (est.)
  const at = (pr, f) => { f = Math.min(1, Math.max(0, f)); const i = Math.max(1, pr.findIndex(q => q[0] >= f)),   // f clamped: a hair past 1 by rounding drew a 38 mm wide drop (2026-11-23)
    [f0, w0] = pr[i - 1], [f1, w1] = pr[i]; return w0 + (w1 - w0) * (f1 > f0 ? (f - f0) / (f1 - f0) : 0); };
  const h = d => half * ((1 - k) * at(DROP.profile, d / P) + k * at(SEED.profile, d / P));
  const n = Math.max(8, Math.ceil(P / 0.25)), ds = [...new Set([...Array.from({ length: n + 1 }, (_, i) => P * i / n), ...DROP.profile.map(q => q[0] * P), ...SEED.profile.map(q => q[0] * P)])].sort((p, q) => p - q);
  const side = ds.map(d => [d, h(d)]);
  return [...side.map(([d, w]) => [x + w, top - d]), ...side.reverse().map(([d, w]) => [x - w, top - d])];
}

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
  const pitch = fit.pitch ?? GEN.pitch, D = { ...dabOf(pitch), ...(o.dab ?? {}) };   // the brush's own dab: the 2 mm's 8 … 15
  const pal = o.pal ?? paletteOf(B, K, o), dabs = dabsOf(B, pal, { ...o, dab: D }), lum = pal.map(p => p[0]);
  const xs = c => +(fit.left + pitch * (c + 0.5)).toFixed(2), up = mm => +(f.h - fit.top - mm).toFixed(1);
  const by = pal.map(() => []);
  for (const q of dabs) by[q.k].push([xs(q.c), up(q.a), up(q.b)]);
  const order = pal.map((_, k) => k).filter(k => by[k].length).sort((p, q) => lum[q] - lum[p]);
  const jars = order.map((k, i) => ({ id: `c${k}`, name: o.names?.[k] ?? `Colour ${i + 1}`, code: '', hex: o.hexes?.[k] ?? hexOfLab(pal[k]), coats: 1, cells: stacksOf(by[k]).map((s, n) => ({ n: n + 1, legs: s })) }));
  const all = dabs.map(q => [xs(q.c), up(q.a), up(q.b)]), X = all.map(l => l[0]), Y = all.flatMap(l => [l[1], l[2]]);
  const raw = { id: o.id ?? 'gen-v', title: o.title ?? 'GEN-V sketch', sub: `sketch in dabs, ${f.w / 10} × ${f.h / 10}, the brush ${pitch} mm, ${K} colours asked (est.)`, w: f.w, h: f.h, pitch, columns: B.N, kind: 'dabs',
    dab: { aim: D.aim, min: D.min, max: D.max, brush: pitch }, box: all.length ? [Math.min(...X) - pitch / 2, Math.min(...Y), Math.max(...X) + pitch / 2, Math.max(...Y)] : [0, 0, 0, 0], jars };
  const C = o.canon === false ? { pic: raw, out: [], kept: [] } : jarsByCanvas(raw, Math.max(f.w, f.h), dabLine);
  let n = 0;   // a jar that took another's dabs: its cells laid again, so its stacks and its order are its own
  const pic = { ...C.pic, jars: C.pic.jars.map(({ took, ...j }) => ({ ...j, name: o.names ? j.name : `Colour ${++n}`, cells: stacksOf(j.cells.flatMap(c => c.legs)).map((s, i) => ({ n: i + 1, legs: s })) })) };
  return { pic, raw, out: C.out, kept: C.kept, asked: K, made: jars.length, dabs: dabs.length, pal };
}

// ---------- the run, GOGH's ----------
// a dab's leg on the machine: painted top to bottom; `gap` / 2 off both its ends (the slider, the plan's), then `trim` in from them (DAB.trim, the J3 gives
// them back), then `run` on past them (the slider, the machine's alone: the brush lands earlier and lifts later, or, below 0, later and earlier, the leg
// no shorter than DAB_LEG); a dab too short for the trim, the shortest the brush lands on, about its middle, the run on past it the same
// A seed in the plan (the owner, 2026-11-23, of a picture in "1 and ½": "if a headlight or some small detail, ½ a seed; if a fill as the bonnet, there 1
// leg"): a card's `dab.seed`, mm — a dab no longer than it laid as RUN 6 lays every dab, its leg DAB_LEG whatever the RUN, its way the J3's 3 + 3 alone,
// a seed ≈ 7 × 3.5 mm (SEED); a longer one a leg as before, the RUN its own. o.seed: that threshold, none on a card without it
// a jar's `seeds` (the owner, 2026-11-23, the night: "make short drops for the sixth module … IMG_3470, we did it in the day"): every dab of it a seed, as RUN 6
// lays it, whatever the RUN and its length — a test block of seeds beside blocks of legs (o.allSeeds)
export const isSeed = (a, b, o = {}) => !!o.allSeeds || (!!o.seed && Math.abs(a - b) - dabGapOf(o.gap) <= o.seed + 1e-9);
// the J3 a dab's own (the owner, 2026-11-23, the evening: "can we make ¼ at all? 6 mm and 4 mm?"): a run so far below 0 that the leg is at its floor, DAB_LEG,
// takes the rest off the J3's 3 + 3 — at most all of it — so the way on the machine is the dab's length + 2 · run; null, the canon's J3 (ELBOW_J3), else and
// for a seed, as RUN 6 lays it
export function dabJ3(a, b, o = {}) {
  if (isSeed(a, b, o)) {                                                             // a seed below RUN 6 shorter too; a card's own seedJ3 first (the nib's stamp)
    if (Number.isFinite(o.seedJ3)) return { early: o.seedJ3, late: o.seedJ3 };
    const k = Math.min(ELBOW_J3.early, ELBOW_J3.late, -3 - dabRunOf(o.run)); return k > 0 ? { early: ELBOW_J3.early - k, late: ELBOW_J3.late - k } : null;
  }
  const trim = o.trim ?? DAB.trim, gap = dabGapOf(o.gap), run = dabRunOf(o.run), m = FORMG.minLeg, L = Math.max(a, b) - Math.min(a, b) - gap;
  const half = L < m + 2e-9 ? m / 2 : L / 2 - Math.max(0, Math.min(trim, (L - m) / 2)), d = DAB_LEG / 2 - (half + run);
  if (d <= 1e-9 || run >= 0) return null;
  const k = Math.min(ELBOW_J3.early, ELBOW_J3.late, d), r3 = v => Math.round(v * 1000) / 1000;
  return { early: r3(ELBOW_J3.early - k), late: r3(ELBOW_J3.late - k) };
}
export function dabLeg(x, a, b, o = {}) {
  const trim = o.trim ?? DAB.trim, gap = dabGapOf(o.gap), run = dabRunOf(o.run), m = FORMG.minLeg, r3 = v => Math.round(v * 1000) / 1000;
  const top = Math.max(a, b) - gap / 2, bot = Math.min(a, b) + gap / 2, L = top - bot, c = (top + bot) / 2;
  const half = L < m + 2e-9 ? m / 2 : L / 2 - Math.max(0, Math.min(trim, (L - m) / 2));
  const h = isSeed(a, b, o) ? DAB_LEG / 2 : Math.max(DAB_LEG / 2, half + run);
  return [[x, r3(c + h)], [x, r3(c - h)]];
}
// the list: FORM-G's (formgplan.js, seqOf) — every jar once, light to dark; a pass a jar, its cells as the picture has them, every leg a dab
// o: { gap, run, trim } — the sliders'
export function passesV(pic, o = {}) {
  return seqOf(pic).map(j => {
    const byCell = j.cells.map((c, i) => { const so = { ...o, seed: pic.dab?.seed, seedJ3: pic.dab?.seedJ3, allSeeds: !!j.seeds }, legs = c.legs.map(([x, a, b]) => dabLeg(x, a, b, so)), j3 = c.legs.map(([, a, b]) => dabJ3(a, b, so)); return { num: i + 1, k: legs.length, legs, ...(j3.some(Boolean) ? { j3 } : {}), ...(j.stamp ? { stamp: true } : {}), line: [], over: 0, end: 0, mm: legs.reduce((t, l) => t + Math.abs(l[1][1] - l[0][1]), 0) }; });
    return { pencil: j.id, layer: j.layer, fill: 'dabs', cells: byCell.length, byCell, tracks: byCell.reduce((a, q) => a + q.k, 0), rows: 0, rays: 0, rubs: 1, idle: false, strokes: [], mm: byCell.reduce((a, q) => a + q.mm, 0) };
  });
}
// the brush's runs: every dab a run of its own, on a dip of its own at its top, down to its bottom and the lift beyond — nothing after it. A jar's `stamp` (the
// owner, 2026-11-23, the night, the spatula nib: "somewhere a bug … old settings do not let the short drops through"): no lift beyond — the brush lands over
// the first half of its way and lifts over the last, not 8 mm past it (strokes.js, SWEEP_TAIL): a springy nib touches all the way down and up
export const dabRunsOf = passes => passes.flatMap((P, k) => P.byCell.flatMap(c => c.legs.map((l, i) => ({ pass: k, num: c.num, pts: l, say: `dab${c.legs.length > 1 ? ` ${i + 1}/${c.legs.length}` : ''}`, dip: true, idle: false, beyond: !c.stamp, dab: true, ...(c.j3?.[i] ? { j3: c.j3[i] } : {}) }))));   // a dab's own J3 (dabJ3); a stamp no lift beyond

// ---------- APPROVE 🐾: the card, GEN-V's page making it (2026-11-22, the evening) ----------
// The owner: "why do I download to the desktop at all … I press APPROVE (add a paw 🐾, by the way) and the picture appears in Library-V". GOGH/generator/
// genvpic.py's make, here: the plan as it is — its jars, names, colours, dabs and their order untouched — its id, title, sub and image set; beside a colour
// with no jar of his yet, as its code, his own numbered jar of the red classic's shelf (app/formg/porsche-red-k.json) within NEAR_JAR of it, "≈ Jar 16", a
// hint, nothing changed; its look, the gap and the width GEN-V's sliders had (GOGH's to start from). rembrandt.py's /genv/approve writes the files.
export const NEAR_JAR = 8;   // CIELAB ΔE76, genvpic.py's NEAR (est.)
const dE76 = (p, q) => { const a = labOfHex(p), b = labOfHex(q); return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); };
export function cardOfSketch(sk, shelf = [], o = {}) {
  const pic = JSON.parse(JSON.stringify(sk.pic));
  if (pic.kind !== 'dabs') throw new Error('not a GEN-V sketch');
  const pairs = [];
  pic.jars.forEach((j, i) => { if (!j.name.startsWith('Jar ') && !j.code) shelf.forEach((q, k) => pairs.push([dE76(j.hex, q.hex), i, k])); });
  pairs.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
  const got = new Map(), taken = new Set();
  for (const [d, i, k] of pairs) if (d <= NEAR_JAR && !got.has(i) && !taken.has(k)) { got.set(i, k); taken.add(k); }
  for (const [i, k] of got) pic.jars[i].code = `≈ ${shelf[k].name}`;
  Object.assign(pic, { id: o.id, title: o.title, sub: o.sub, image: `gogh/${o.id}.jpg` });
  const look = Object.fromEntries(['gap', 'wide'].filter(k => typeof sk[k] === 'number').map(k => [k, sk[k]]));
  if (Object.keys(look).length) pic.look = look;
  return pic;
}
// a card's id off the picture's name: "orange-bear-details 2" on 20 × 20, the 2 mm, 14 colours → orange-bear-details-2-20x20-2mm-14 (rembrandt.py makes it free)
export const idOfSketch = (name, format, pitch, k) => `${String(name).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'gen-v'}-${format}-${pitch}mm-${k}`.replace(/--+/g, '-');
