// Tubes and the layers they go into (Rembrandt.md §1, §4, §9). No DOM.
//
// The inventory is a placeholder until the owner enters the shelf (Pebeo,
// 50 tubes; Liquitex, 80). The colours are Sonnet's (adjustments/,
// 2026-10-01), est. until the photos of the real tubes; White and its
// pigment codes are §9's. Grey N5 is Sonnet's mid grey.

import { linOf } from './color.js';

export const INVENTORY = [
  { id: 'yellow',     name: 'Yellow',     pigment: 'PY74',        hex: '#E8A41C' },
  { id: 'orange',     name: 'Orange',     pigment: 'PO73',        hex: '#D65C16' },
  { id: 'red',        name: 'Red',        pigment: 'PR254',       hex: '#BE160E' },
  { id: 'crimson',    name: 'Crimson',    pigment: '',            hex: '#9C0909' },
  { id: 'oxblood',    name: 'Oxblood',    pigment: '',            hex: '#7A0808' },
  { id: 'dark-red',   name: 'Dark red',   pigment: '',            hex: '#5C0808' },
  { id: 'maroon',     name: 'Maroon',     pigment: '',            hex: '#300606' },
  { id: 'black',      name: 'Black',      pigment: 'PBk11',       hex: '#080606' },
  { id: 'white',      name: 'White',      pigment: 'PW6',         hex: '#F3F1EA' },
  { id: 'cream',      name: 'Cream',      pigment: '',            hex: '#E2DFD2' },
  { id: 'light-gray', name: 'Light grey', pigment: '',            hex: '#B0B2B4' },
  { id: 'grey',       name: 'Grey N5',    pigment: 'PW6 + PBk11', hex: '#747983', premix: true },
  { id: 'dark-gray',  name: 'Dark grey',  pigment: '',            hex: '#464A52' },
];
export const tubeOf = id => INVENTORY.find(t => t.id === id) || null;

// Three layers in a fixed order (§1), each on its side of the curve; the
// first painting's tubes, as Sonnet laid them out: the light below, the sheet
// and the black at the top into its wet grey above, the dark reds and the
// black at the bottom last.
export const defaultLayers = () => [
  { n: 1, name: 'Light', where: 'below the curve', side: 'below', tubes: ['yellow', 'orange', 'red', 'crimson'] },
  { n: 2, name: 'Sheet', where: 'above the curve', side: 'above', tubes: ['white', 'cream', 'light-gray', 'grey', 'dark-gray', 'black'] },
  { n: 3, name: 'Black', where: 'below the curve, last', side: 'below', tubes: ['oxblood', 'dark-red', 'maroon', 'black'] },
];
// The defaults before (2026-10-01, morning and afternoon): a saved state
// with exactly these takes the new ones.
export const OLD_DEFAULTS = [
  [['yellow', 'orange', 'red'], ['white', 'grey'], ['black']],
  [['yellow', 'orange', 'red'], ['white', 'grey', 'black'], ['black']],
];

// sRGB 0…1 → OKLab [L, a, b].
export function oklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
export const labOf = hex => oklab(linOf(hex));
// OKLab lightness, 0 black … 1 white.
export const lightness = hex => labOf(hex)[0];

// A layer's tubes in the order they run: the lighter first (§1, "at art
// school we were taught to start with the lights"). The same tube twice
// keeps both places. Returns [{ id, i }], i — the place in layer.tubes.
export function runOrder(ids) {
  return ids.map((id, i) => ({ id, i, L: lightness(tubeOf(id)?.hex || '#808080') }))
    .sort((a, b) => b.L - a.L || a.i - b.i)
    .map(({ id, i }) => ({ id, i }));
}
