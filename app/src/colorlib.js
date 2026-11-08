// COLORS, the library (the owner, 2026-11-08: "README — sorry, I do not quite understand. Build a COLORS tab next to LAB, so that our
// library is there. Kuzya proposed cards", his card: LAB/Screenshot 2026-11-08 at 10.59.47 PM.png; then: "put the recommendations
// right in the cards!"). Data only, no page: the paints on the owner's shelf, measured off his photographs (LAB/), and the recipe of
// every jar of LAB's real 3 with its advice. The jars themselves — names, hexes, coats, line — are LAB's own (labplan.js, real3Of):
// the page reads them there, so the two never part. Everything est.: the paper beside a swatch taken as L 95, the mixes by
// single-constant Kubelka–Munk with every paint of the same strength, ratios by volume.

// Where a paint was seen. The palette of 2026-10-12 in daylight is the more trusted; the sheets of 2026-11-08 were wet, under a lamp
// (the same paint on two of those photos 10 … 20 ΔE apart).
export const SOURCES = {
  palette: { name: 'Palette · 2026-10-12', say: 'daylight; LAB/colors-001 … 006', trust: 'the more trusted' },
  tubes: { name: 'Tubes · 2026-11-08', say: 'wet, under a lamp; LAB/IMG_2548, IMG_2549', trust: '± 10 … 20 ΔE' },
  swatches: { name: 'Swatches · Kuzya\'s numbers', say: 'the owner\'s trials for Kuzya\'s scale, 2026-11-08, wet, under a lamp; LAB/IMG_2543 … 2551', trust: '± 10 … 20 ΔE' },
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
  ['rougecad', 'Rouge Cadmium · Pébéo', 'tubes', '#A90913', [36, 58, 42], 'Red\'s stand-in, the same colour on the photos'],
  ['naphthol', 'Naphthol Crimson', 'tubes', '#8C000D', [27, 55, 36], 'near Jar 29 · Jar 30 as it is (ΔE 6)'],
  ['crimsonhue', 'Crimson Hue Permanent', 'tubes', '#8A0017', [27, 55, 29], ''],
  ['primaryred', 'Primary Red', 'tubes', '#8B0013', [28, 53, 32], ''],
  ['cadreddeep', 'Cadmium Red Deep Hue', 'tubes', '#91001D', [29, 56, 27], ''],
  ['magperm', 'Magenta Permanente · Pébéo', 'tubes', '#98122A', [32, 53, 24], ''],
  ['quinmagenta', 'Quinacridone Magenta', 'tubes', '#7E0D2A', [26, 47, 15], ''],
  ['magenta2', 'Magenta', 'tubes', '#84001F', [26, 54, 22], ''],
  ['dyna', 'Dyna Rouge Bleu Iridescent · Pébéo', 'tubes', '#DC0000', [45, 74, 61], 'iridescent: pink one way, red the other — not for a flat jar'],
  ['deepviolet', 'Deep Violet · Liquitex', 'tubes', '#410A2E', [13, 30, -9], ''],
  ['orientalviolet', 'Oriental Violet · Pébéo', 'tubes', '#5D205C', [24, 36, -23], ''],
  ['purpleshuttle', 'Purple · Shuttle Art', 'tubes', '#3A1C53', [17, 27, -28], ''],
  ['s1', '① Pink', 'swatches', '#E77084', [62, 48, 11], 'Kuzya\'s 1, Jar 5: too dark and too pink for it'],
  ['s2', '② magenta + white', 'swatches', '#EC6BA3', [62, 56, -6], 'Kuzya\'s 2, Jar 10: too blue for it'],
  ['s3', '③ Cadmium Red Light Hue', 'swatches', '#E12F11', [50, 66, 58], 'a tube; Kuzya\'s 3 (Jar 16, gone into Jar 23) within ΔE 7'],
  ['s4', '④ Red', 'swatches', '#B7293A', [41, 56, 26], 'Kuzya\'s 4, Jar 23: too cool for it'],
  ['s5', '⑤ Cadmium Red Medium Hue', 'swatches', '#AD0013', [36, 60, 42], 'a tube; Kuzya\'s 5, Jar 27, within ΔE 7 — and Red\'s stand-in'],
  ['s7', '⑦ Deep Red', 'swatches', '#961A33', [33, 51, 18], 'Kuzya\'s 7, Jar 31: too cool for it'],
  ['s8', '⑧ violet + red', 'swatches', '#94424A', [39, 35, 12], 'Purple · Shuttle Art and a red; Kuzya\'s 8, Jar 34: too light, too cool — but it mutes ③ well'],
  ['s10', '⑩ violet + red', 'swatches', '#591D2A', [21, 28, 6], 'Kuzya\'s 10, Jar 38: too cool for it'],
  ['s12', '⑫', 'swatches', '#381321', [12, 20, 0], 'Black, Purple and Deep Red; Kuzya\'s 12 (Seam, gone into Jar 43); in Dark Brown\'s place it darkens cooler (ΔE 7)'],
  ['s13', '⑬', 'swatches', '#201D24', [11, 3, -4], 'darker than ⑫, lighter and more violet than Ink'],
].map(([id, name, from, hex, lab, note]) => ({ id, name, from, hex, lab, note }));
export const paintOf = id => PAINTS.find(p => p.id === id);

// Kuzya's scale (LAB/colors-from-Kuzya.png), light to dark, read off the picture: real 3's own jars, to the digit. 3 and 12 went
// into others by the canon of the jars (Jar 16 → Jar 23, Seam → Jar 43).
export const KUZYA = [['#F29B8B', 'Jar 5'], ['#ED3F58', 'Jar 10'], ['#E20D0D', 'Jar 16'], ['#B40D0D', 'Jar 23'], ['#9D0D0D', 'Jar 27'], ['#8D0D0D', 'Jar 30'],
  ['#800D0D', 'Jar 31'], ['#760D0D', 'Jar 34'], ['#6C0D0D', 'Jar 36'], ['#5F0D0D', 'Jar 38'], ['#510D0D', 'Jar 43'], ['#3D080A', 'Seam']];

// The medium (Rembrandt.md, OPM-N's first paint: "probably 15 g of acrylic + 15 g of pouring medium"; Kuzya's card: "50 %, the first trial")
export const MEDIUM = '≈ 1 : 1 with pouring medium: 15 g + 15 g in a 50 g jar (est.)';

// Why Dark Brown darkens the reds and not ⑫ (the owner, 2026-11-08: "put the recommendations right in the cards")
const DARK = 'Darken with Dark Brown, not with ⑫ or Black: these jars are a warm red made darker (b stays about 0.7 of a all the way down). Violet cools a red — ⑦ ⑧ ⑩ ⑫ came out with a third of the warmth they need — and black dulls it; a warm brown keeps it warm.';
const MOTHERS = 'Not a mixing of its own: Red and Jar 43, the two mothers, by these parts — they hold however strong the brown turned out in Jar 43. The dark comes from Jar 43\'s Dark Brown, not from ⑫ or Black: violet cools a red, black dulls it.';

// The recipe of every jar of real 3, by its name on the tab: parts [paint id or a jar's name, parts, or words for "a little"], the model's
// ΔE against the hex (est.), the advice; pair: the jar mixed once with it; mother: mixed before the jars that take it.
export const RECIPES = {
  'Chrome': { parts: [['white', 'most'], ['black', 'a speck'], ['sandyellow', 'a speck']], de: 7,
    advice: 'A warm light grey. White, then the black on a knife\'s tip, then a speck of Sand Yellow for the warmth. Black is far stronger than white: add it last and little — too grey, and only a lot more white brings it back.' },
  'Jar 5': { parts: [['pink', 1], ['white', 3], ['sandyellow', 2]], de: 2, kuzya: 1, swatch: 's1',
    advice: 'Not ① as it is: ① is darker and pinker (L 62 against 72). Pink lightened with White; Sand Yellow takes the pink towards salmon. The yellow last, a little at a time.' },
  'Indicator': { parts: [['orangeyellow', 50], ['orange', 1]], de: 5,
    advice: 'Orange Yellow from the tube is nearly it; a touch of Orange reddens it to the indicator\'s amber. Too red: more Orange Yellow.' },
  'Chrome, dark': { parts: [['white', 'most'], ['black', 'by drops']], de: 4,
    advice: 'A neutral mid grey (L 64). Start from white, the black a drop at a time, stir and look between drops: one drop moves it far.' },
  'Jar 10': { parts: [['pink', 25], ['red', 1]], de: 8, kuzya: 2, swatch: 's2',
    advice: 'Pink from the tube is close; a touch of Red makes it deeper and redder. Not ② (magenta + white): magenta pulls it towards violet, the jar is a warm raspberry. The hardest of the light ones: check it dry in daylight.' },
  'Jar 13': { parts: [['s3', 3], ['s8', 1]], de: 8,
    advice: '③ with a little ⑧: ⑧ takes the orange down to a brick red. From tubes alone — Orange, a third of White, a speck of Dark Brown — it comes out farther (ΔE 13, est.).' },
  'Jar 22': { parts: [['s3', 1], ['s8', 2]], de: 3,
    advice: 'Rust: ③ with twice as much ⑧. From tubes alone, Orange with a twelfth of Dark Brown (ΔE 11, est.).' },
  'Jar 23': { parts: [['red', 1]], de: 3, kuzya: 4, swatch: 's4', mother: true,
    advice: 'Red straight from the tube: the first mother of every dark red, so keep plenty. Not ④ (too cool). If Red runs short: Rouge Cadmium (Pébéo) or ⑤ Cadmium Red Medium Hue, the same colour on the photos, with the same Dark Brown.' },
  'Jar 27': { parts: [['red', 15], ['Jar 43', 1]], de: 3, kuzya: 5, swatch: 's5',
    advice: `Almost Red: one part of Jar 43 to fifteen. ⑤ is close to it too (ΔE 7): a check, not a jar. ${MOTHERS}` },
  'Jar 29': { parts: [['red', 7], ['Jar 43', 1]], de: 3, pair: 'Jar 30', advice: MOTHERS },
  'Jar 30': { parts: [['red', 7], ['Jar 43', 1]], de: 3, kuzya: 6, pair: 'Jar 29', advice: `The longest line of real 3 (2.24 m, two coats): make plenty. Naphthol Crimson as it is lands near too (ΔE 6). ${MOTHERS}` },
  'Jar 31': { parts: [['red', 7], ['Jar 43', 2]], de: 3, kuzya: 7, swatch: 's7', pair: 'Jar 32', advice: `Not ⑦ (Deep Red): too cool. ${MOTHERS}` },
  'Jar 32': { parts: [['red', 7], ['Jar 43', 2]], de: 3, pair: 'Jar 31', advice: MOTHERS },
  'Jar 34': { parts: [['red', 7], ['Jar 43', 3]], de: 3, kuzya: 8, swatch: 's8', advice: `Not ⑧ (violet + red): too light and too cool. ${MOTHERS}` },
  'Jar 35': { parts: [['red', 5], ['Jar 43', 3]], de: 3, pair: 'Jar 36', advice: MOTHERS },
  'Jar 36': { parts: [['red', 5], ['Jar 43', 3]], de: 3, kuzya: 9, pair: 'Jar 35', advice: MOTHERS },
  'Jar 38': { parts: [['red', 3], ['Jar 43', 5]], de: 4, kuzya: 10, swatch: 's10', advice: `More Jar 43 than Red now. Not ⑩ (violet + red): too cool. ${MOTHERS}` },
  'Jar 43': { parts: [['red', 1], ['darkbrown', 1]], de: 4, kuzya: 11, mother: true,
    advice: `Mix it first: with Red, one of the two mothers of every dark red. Red, then Dark Brown a little at a time until it matches the hex — about half and half; make plenty, nine jars take it. ${DARK} ⑫ in the brown's place comes out cooler (ΔE 7).` },
  'Ink': { parts: [['black', 1]], de: 2, swatch: 's13', advice: 'Black from the tube. Not ⑬: lighter and violet.' },
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
