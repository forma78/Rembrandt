// COLORS, the library (the owner, 2026-11-08: "README — sorry, I do not quite understand. Build a COLORS tab next to LAB, so that our
// library is there. Kuzya proposed cards", his card: LAB/Screenshot 2026-11-08 at 10.59.47 PM.png; then: "put the recommendations
// right in the cards!"). Data only, no page: the paints on the owner's shelf, measured off his photographs (LAB/), and the recipe of
// every jar of LAB's real 3 with its advice. The jars themselves — names, hexes, coats, line — are LAB's own (labplan.js, real3Of):
// the page reads them there, so the two never part. Everything est.: the paper beside a swatch taken as L 95, the mixes by
// single-constant Kubelka–Munk with every paint of the same strength, ratios by volume.

// Where a paint was seen. The palette of 2026-10-12, in daylight. The sheets of 2026-11-08 again on 2026-11-09, dry, in daylight
// (LAB/IMG_2557 … 2570): wet under the lamp the night before, the same paint had read 5 … 28 ΔE off — ④ Red "too cool" among them.
// Two checks hold: ④ Red against the palette's Red ΔE 5, ⑦ Deep Red against its Deep Red 3; ⑤ on two photos 0.6 apart. The close-ups
// in low sun (IMG_2565 … 2568, 2570) shine: 8 … 17 ΔE lighter, not measured. Under L 5 (⑫, ⑬) a photo cannot tell the darks apart.
export const SOURCES = {
  palette: { name: 'Palette · 2026-10-12', say: 'daylight; LAB/colors-001 … 006', trust: '± 5 ΔE' },
  tubes: { name: 'Tubes · dry, 2026-11-09', say: 'the sheet of 2026-11-08 again, dry, in daylight; LAB/IMG_2557, IMG_2559 … 2561', trust: '± 5 ΔE' },
  swatches: { name: 'Swatches · Kuzya\'s numbers', say: 'the owner\'s trials for Kuzya\'s scale, 2026-11-08, again dry in daylight 2026-11-09; LAB/IMG_2557 … 2564, IMG_2569', trust: '± 5 ΔE; under L 5 not readable' },
};

// [id, name as on the owner's sheet, source, measured colour for the screen (sRGB, clipped), CIELAB est., a note]
export const PAINTS = [
  ['red', 'Red', 'palette', '#B10111', [37, 61, 44], 'Jar 23 straight from the tube (ΔE 3), the mother of every dark red'],
  ['darkbrown', 'Dark Brown', 'palette', '#39170A', [12, 16, 15], 'the warm darkener: Jar 43 with Red'],
  ['pink', 'Pink', 'palette', '#E65B68', [57, 55, 21], ''],
  ['white', 'White', 'palette', '#FDFDF9', [99, -1, 2], ''],
  ['black', 'Black', 'palette', '#050707', [2, -1, 0], 'very strong: by drops'],
  ['orange', 'Orange', 'palette', '#D42A02', [46, 63, 59], ''],
  ['orangeyellow', 'Orange Yellow', 'palette', '#ED9405', [69, 25, 73], ''],
  ['sandyellow', 'Sand Yellow', 'palette', '#E6BA73', [78, 7, 42], 'warms a pink or a grey'],
  ['lemon', 'Lemon Yellow', 'palette', '#FFF92F', [96, -16, 88], ''],
  ['ochre', 'Yellow Ochre', 'palette', '#D2950B', [66, 14, 69], ''],
  ['deepred', 'Deep Red', 'palette', '#97071F', [32, 54, 30], ''],
  ['p05', '05', 'palette', '#B82138', [41, 59, 27], 'a red, its name not written'],
  ['magenta', 'magenta', 'palette', '#9F054E', [34, 59, 3], ''],
  ['roseazo', 'Rose Azo', 'palette', '#BB025E', [40, 67, 2], ''],
  ['purple', 'Purple', 'palette', '#402058', [19, 27, -28], ''],
  ['p02', '02', 'palette', '#F3D71D', [86, -7, 82], 'a yellow, its name not written'],
  ['p01', '01', 'palette', '#B9DB83', [83, -26, 40], 'a light green, its name not written'],
  ['green', 'Green', 'palette', '#029733', [54, -55, 42], ''],
  ['viridian', 'Viridian', 'palette', '#02454D', [26, -16, -10], ''],
  ['turquoise', 'Turquoise', 'palette', '#26F0DD', [86, -50, -4], ''],
  ['skyblue', 'Sky Blue', 'palette', '#4090C0', [57, -9, -32], ''],
  ['p03', '03', 'palette', '#0865AA', [42, 3, -44], 'a blue, its name not written'],
  ['p04', '04', 'palette', '#1653AA', [36, 15, -52], 'a blue, its name not written'],
  ['ultramarine', 'Ultramarine', 'palette', '#101F7E', [18, 32, -54], ''],
  ['rougecad', 'Rouge Cadmium · Pébéo', 'tubes', '#B31020', [38, 60, 38], 'Red\'s stand-in (ΔE 7)'],
  ['naphthol', 'Naphthol Crimson', 'tubes', '#B40008', [36, 66, 48], 'dry, the tube nearest Jar 23 (ΔE 6): Red\'s stand-in; not near Jar 30 (that was the wet reading)'],
  ['crimsonhue', 'Crimson Hue Permanent', 'tubes', '#A20017', [32, 62, 36], ''],
  ['primaryred', 'Primary Red', 'tubes', '#B00018', [36, 63, 40], ''],
  ['cadreddeep', 'Cadmium Red Deep Hue', 'tubes', '#9E152F', [34, 54, 23], ''],
  ['magperm', 'Magenta Permanente · Pébéo', 'tubes', '#9C0019', [31, 59, 33], ''],
  ['quinmagenta', 'Quinacridone Magenta', 'tubes', '#7C0020', [24, 51, 19], ''],
  ['magenta2', 'Magenta', 'tubes', '#850027', [26, 54, 17], ''],
  ['crimsonx', 'a crimson, its name not written', 'tubes', '#92002E', [30, 55, 18], 'top right of the tubes sheet, mottled'],
  ['magentax', 'a magenta, its name not written', 'tubes', '#980036', [31, 58, 14], 'beside Rouge Cadmium on the tubes sheet'],
  ['dyna', 'Dyna Rouge Bleu Iridescent · Pébéo', 'tubes', '#BD0028', [39, 66, 35], 'iridescent: pink one way, red the other, its colour by the angle — not for a flat jar'],
  ['deepviolet', 'Deep Violet · Liquitex', 'tubes', '#54153A', [19, 33, -8], ''],
  ['orientalviolet', 'Oriental Violet · Pébéo', 'tubes', '#7F3B78', [36, 38, -22], ''],
  ['purpleshuttle', 'Purple · Shuttle Art', 'tubes', '#381F4B', [17, 22, -23], ''],
  ['s1', '① Pink', 'swatches', '#F27B94', [66, 48, 8], 'Kuzya\'s 1, Jar 5: darker, pinker and cooler than it (ΔE 23); its coral edge L 47'],
  ['s2', '② magenta + white', 'swatches', '#CF6E9F', [59, 44, -9], 'Kuzya\'s 2, Jar 10: too blue for it (ΔE 43)'],
  ['s3', '③ Cadmium Red Light Hue', 'swatches', '#E81200', [49, 73, 64], 'a tube; Kuzya\'s 3 (Jar 16, gone into Jar 23) within ΔE 7'],
  ['s4', '④ Red', 'swatches', '#A20006', [32, 61, 44], 'Kuzya\'s 4, Jar 23, within ΔE 6, and the palette\'s Red within 5: the same Red (wet, under the lamp, it had read too cool)'],
  ['s5', '⑤ Cadmium Red Medium Hue', 'swatches', '#C40222', [41, 66, 41], 'a tube; lighter and redder than Kuzya\'s 5, Jar 27 (ΔE 14); Red\'s stand-in (ΔE 7)'],
  ['s7', '⑦ Deep Red', 'swatches', '#95001C', [30, 56, 30], 'Kuzya\'s 7, Jar 31: redder than it (ΔE 12); the palette\'s Deep Red within 3'],
  ['s8', '⑧ violet + red', 'swatches', '#882E40', [33, 40, 10], 'Purple · Shuttle Art and a red; Kuzya\'s 8, Jar 34: too light, too cool (ΔE 23) — but it mutes ③'],
  ['s10', '⑩ violet + red', 'swatches', '#520314', [15, 35, 14], 'Kuzya\'s 10, Jar 38: darker and cooler than it (ΔE 11)'],
  ['s12', '⑫', 'swatches', '#100407', [2, 4, 0], 'Black, Purple and Deep Red; Kuzya\'s 12 (Seam, gone into Jar 43): too dark for a photo to read (L under 5)'],
  ['s13', '⑬', 'swatches', '#111014', [5, 1, -2], 'near black on the photo, as Black: a photo cannot tell the darkest apart'],
].map(([id, name, from, hex, lab, note]) => ({ id, name, from, hex, lab, note }));
export const paintOf = id => PAINTS.find(p => p.id === id);

// Kuzya's scale (LAB/colors-from-Kuzya.png), light to dark, read off the picture: real 3's own jars, to the digit. 3 and 12 went
// into others by the canon of the jars (Jar 16 → Jar 23, Seam → Jar 43).
export const KUZYA = [['#F29B8B', 'Jar 5'], ['#ED3F58', 'Jar 10'], ['#E20D0D', 'Jar 16'], ['#B40D0D', 'Jar 23'], ['#9D0D0D', 'Jar 27'], ['#8D0D0D', 'Jar 30'],
  ['#800D0D', 'Jar 31'], ['#760D0D', 'Jar 34'], ['#6C0D0D', 'Jar 36'], ['#5F0D0D', 'Jar 38'], ['#510D0D', 'Jar 43'], ['#3D080A', 'Seam']];

// The medium (Rembrandt.md, OPM-N's first paint: "probably 15 g of acrylic + 15 g of pouring medium"; Kuzya's card: "50 %, the first trial")
export const MEDIUM = '≈ 1 : 1 with pouring medium: 15 g + 15 g in a 50 g jar (est.)';

// Why Dark Brown darkens the reds and not ⑫ (the owner, 2026-11-08: "put the recommendations right in the cards")
const DARK = 'Darken with Dark Brown, not with ⑫ or Black: these jars are a warm red made darker (b stays about 0.7 of a all the way down). Violet cools a red — dry in daylight ⑧ and ⑩, violet with a red, keep b at 10 and 14 where Jar 34 and Jar 38 want 31 and 24 — and black dulls it; a warm brown keeps it warm.';
const MOTHERS = 'Not a mixing of its own: Red and Jar 43, the two mothers, by these parts — they hold however strong the brown turned out in Jar 43. The dark comes from Jar 43\'s Dark Brown, not from ⑫ or Black: violet cools a red, black dulls it.';

// The recipe of every jar of real 3, by its name on the tab: parts [paint id or a jar's name, parts, or words for "a little"], the model's
// ΔE against the hex (est.), the advice; pair: the jar mixed once with it; mother: mixed before the jars that take it.
export const RECIPES = {
  'Jar 1': { parts: [['white', 'most'], ['black', 'a speck'], ['sandyellow', 'a speck']], de: 7,
    advice: 'A warm light grey. White, then the black on a knife\'s tip, then a speck of Sand Yellow for the warmth. Black is far stronger than white: add it last and little — too grey, and only a lot more white brings it back.' },
  'Jar 5': { parts: [['pink', 1], ['white', 3], ['sandyellow', 2]], de: 2, kuzya: 1, swatch: 's1',
    advice: 'Not ① as it is: dry in daylight ① is darker, pinker and cooler (L 66 against 72). Pink lightened with White; Sand Yellow takes the pink towards salmon. The yellow last, a little at a time.' },
  'Indicator': { parts: [['orangeyellow', 50], ['orange', 1]], de: 5,
    advice: 'Orange Yellow from the tube is nearly it; a touch of Orange reddens it to the indicator\'s amber. Too red: more Orange Yellow.' },
  'Jar 7': { parts: [['white', 'most'], ['black', 'by drops']], de: 4,
    advice: 'A neutral mid grey (L 64). Start from white, the black a drop at a time, stir and look between drops: one drop moves it far.' },
  'Jar 10': { parts: [['pink', 25], ['red', 1]], de: 8, kuzya: 2, swatch: 's2',
    advice: 'Pink from the tube is close; a touch of Red makes it deeper and redder. Not ② (magenta + white): magenta pulls it towards violet, the jar is a warm raspberry. The hardest of the light ones: check it dry in daylight.' },
  'Jar 13': { parts: [['s3', 3], ['s8', 1]], de: 15,
    advice: '③ with a little ⑧: ⑧ takes the orange down to a brick red. Dry in daylight ③ is fierier than it read wet (a 73, b 64 against the jar\'s 55, 44) and ⑧ cooler, so the model now puts this mix darker and redder (ΔE 15, est.; it was 8 on the wet readings): look at its dry swatch first. Too fiery: a little more ⑧, then a touch of White back to the lightness. From tubes alone — Orange, a third of White, a speck of Dark Brown — it comes out about as far (ΔE 13, est.).' },
  'Jar 22': { parts: [['s3', 1], ['s8', 2]], de: 14,
    advice: 'Rust: ③ with twice as much ⑧. On the dry readings the model puts it darker and redder than the jar (ΔE 14, est.; 3 on the wet ones): look at its dry swatch first; too red — a little more ⑧. From tubes alone, Orange with a twelfth of Dark Brown (ΔE 11, est.).' },
  'Jar 23': { parts: [['red', 1]], de: 3, kuzya: 4, swatch: 's4', mother: true,
    advice: 'Red straight from the tube: the first mother of every dark red, so keep plenty. ④ on the owner\'s sheet is this Red (ΔE 6 from the jar, dry in daylight). If Red runs short: Naphthol Crimson (ΔE 6), Rouge Cadmium (Pébéo) or ⑤ Cadmium Red Medium Hue (ΔE 7 from Red each), with the same Dark Brown.' },
  'Jar 27': { parts: [['red', 15], ['Jar 43', 1]], de: 3, kuzya: 5, swatch: 's5',
    advice: `Almost Red: one part of Jar 43 to fifteen. Not ⑤: dry in daylight it is lighter and redder (ΔE 14). ${MOTHERS}` },
  'Jar 29': { parts: [['red', 7], ['Jar 43', 1]], de: 3, pair: 'Jar 30', advice: MOTHERS },
  'Jar 30': { parts: [['red', 7], ['Jar 43', 1]], de: 3, kuzya: 6, pair: 'Jar 29', advice: `The longest line of real 3 (2.24 m, two coats): make plenty. ${MOTHERS}` },
  'Jar 31': { parts: [['red', 7], ['Jar 43', 2]], de: 3, kuzya: 7, swatch: 's7', pair: 'Jar 32', advice: `Not ⑦ (Deep Red): redder and a little lighter (ΔE 12, dry). ${MOTHERS}` },
  'Jar 32': { parts: [['red', 7], ['Jar 43', 2]], de: 3, pair: 'Jar 31', advice: MOTHERS },
  'Jar 34': { parts: [['red', 7], ['Jar 43', 3]], de: 3, kuzya: 8, swatch: 's8', advice: `Not ⑧ (violet + red): too light and too cool. ${MOTHERS}` },
  'Jar 35': { parts: [['red', 5], ['Jar 43', 3]], de: 3, pair: 'Jar 36', advice: MOTHERS },
  'Jar 36': { parts: [['red', 5], ['Jar 43', 3]], de: 3, kuzya: 9, pair: 'Jar 35', advice: MOTHERS },
  'Jar 38': { parts: [['red', 3], ['Jar 43', 5]], de: 4, kuzya: 10, swatch: 's10', advice: `More Jar 43 than Red now. Not ⑩ (violet + red): darker and cooler (ΔE 11, dry). ${MOTHERS}` },
  'Jar 43': { parts: [['red', 1], ['darkbrown', 1]], de: 4, kuzya: 11, mother: true,
    advice: `Mix it first: with Red, one of the two mothers of every dark red. Red, then Dark Brown a little at a time until it matches its card's colour — about half and half; make plenty, nine jars take it. ${DARK} ⑫ in the brown's place comes out cooler.` },
  'Black': { parts: [['black', 1]], de: 2, swatch: 's13', advice: 'Black from the tube. ⑬ dries near black too, but a photo cannot tell the darkest apart (L under 5): Black is the sure one.' },
};

// The order to mix in: the two mothers, then every jar that takes them, then the rest
export const ORDER = ['Jar 43', 'Jar 23'];

// A part in words: "Red 7", "Black a speck", "Jar 43 2"
export const partSay = ([p, n]) => `${paintOf(p)?.name ?? p}${typeof n === 'number' ? (n === 1 ? '' : ` ${n}`) : ` ${n}`}`.trim();
// the jars of real 3 that take a paint, straight or by a jar that takes it
export function usesOf(id) {
  const direct = Object.entries(RECIPES).filter(([, r]) => r.parts.some(([p]) => p === id)).map(([j]) => j);
  const via = Object.entries(RECIPES).filter(([j, r]) => !direct.includes(j) && r.parts.some(([p]) => direct.includes(p))).map(([j]) => j);
  return { direct, via };
}
