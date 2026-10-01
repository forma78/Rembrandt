// Tubes and the layers they go into (Rembrandt.md §1, §4, §9). No DOM.
//
// The inventory is the owner's: names, shades, pigment codes and their order
// are edited on the Create tab (Tubes in use) and kept on this Mac in
// app/tubes.json through rembrandt.py. Until then the defaults: Sonnet's
// shades (adjustments/, 2026-10-01), est. until the photos of the real
// tubes, and §9's White; Grey N5 is Sonnet's mid grey.

import { linOf } from './color.js';

export const DEFAULT_INVENTORY = [
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
  { id: 'grey',       name: 'Grey N5',    pigment: 'PW6 + PBk11', hex: '#747983' },
  { id: 'dark-gray',  name: 'Dark grey',  pigment: '',            hex: '#464A52' },
];
// Sonnet's paint names that are a tube of another id here.
export const ALIAS = { 'mid-gray': 'grey' };

let INV = DEFAULT_INVENTORY.map(t => ({ ...t }));
export const inventory = () => INV;
export const tubeOf = id => INV.find(t => t.id === (ALIAS[id] || id)) || null;
// A list from a file or from the browser, checked: ids unique, shades #RRGGBB.
export function cleanInventory(list) {
  if (!Array.isArray(list)) return null;
  const seen = new Set(), out = [];
  for (const t of list) {
    if (!t || typeof t.id !== 'string' || !t.id || seen.has(t.id) || !/^#[0-9a-f]{6}$/i.test(t.hex || '')) continue;
    seen.add(t.id);
    out.push({ id: t.id, name: String(t.name ?? '').slice(0, 60) || 'Tube', pigment: String(t.pigment ?? '').slice(0, 60), hex: t.hex.toUpperCase() });
  }
  return out.length ? out : null;
}
export function setInventory(list) { const c = cleanInventory(list); if (c) INV = c; return !!c; }
// A new tube goes to the end of the list (the owner, 2026-10-01: "Lemon at
// the bottom by default, and I drag it up next to Yellow").
export function addTube(hex = '#808080', name = 'New tube') {
  let id; do id = 'tube-' + Math.random().toString(36).slice(2, 8); while (INV.some(t => t.id === id));
  const t = { id, name, pigment: '', hex: hex.toUpperCase() }; INV = [...INV, t]; return t;
}
export function moveTube(id, beforeId) {
  const t = INV.find(x => x.id === id); if (!t || id === beforeId) return;
  const rest = INV.filter(x => x.id !== id), i = beforeId ? rest.findIndex(x => x.id === beforeId) : -1;
  INV = i < 0 ? [...rest, t] : [...rest.slice(0, i), t, ...rest.slice(i)];
}
export function removeTube(id) { INV = INV.filter(t => t.id !== id); }

// The four layers, the same on the Create and Adjustments tabs (the owner,
// 2026-10-01), as Sonnet laid them out: everything below the curve first,
// dry under the sheet's edge; the black at the top last, into the wet grey.
export const LAYERS = [
  { n: 1, name: 'Light', where: 'below the curve',                    side: 'below' },
  { n: 2, name: 'Dark',  where: 'below the curve, into the light',    side: 'below' },
  { n: 3, name: 'Sheet', where: 'above the curve',                    side: 'above' },
  { n: 4, name: 'Black', where: 'above the curve, into the wet grey', side: 'above' },
];
export const defaultLayers = () => [
  { ...LAYERS[0], tubes: ['yellow', 'orange', 'red', 'crimson'] },
  { ...LAYERS[1], tubes: ['oxblood', 'dark-red', 'maroon', 'black'] },
  { ...LAYERS[2], tubes: ['white', 'cream', 'light-gray', 'grey', 'dark-gray'] },
  { ...LAYERS[3], tubes: ['black'] },
];
// Ends per layer, shared by both tabs: Tails, or Round for solid paint — the
// black at the top (the owner, 2026-10-01).
export const ENDS_DEFAULT = { 4: 'round' };
const ENDS_KEY = 'rembrandt.ends.v01';
export function readEnds(storage) { try { return { ...ENDS_DEFAULT, ...JSON.parse(storage?.getItem(ENDS_KEY) || '{}') }; } catch { return { ...ENDS_DEFAULT }; } }
export function writeEnds(storage, ends) { try { storage?.setItem(ENDS_KEY, JSON.stringify(ends)); } catch { } }

// The defaults before (2026-10-01): a saved state with exactly these takes
// the new ones; another three-layer state is carried over to the four —
// Light, Sheet, Black became Light, Dark, Sheet, Black, the sheet's black
// going to layer 4.
export const OLD_DEFAULTS = [
  [['yellow', 'orange', 'red'], ['white', 'grey'], ['black']],
  [['yellow', 'orange', 'red'], ['white', 'grey', 'black'], ['black']],
  [['yellow', 'orange', 'red', 'crimson'], ['white', 'cream', 'light-gray', 'grey', 'dark-gray', 'black'], ['oxblood', 'dark-red', 'maroon', 'black']],
];
export function layersFrom(saved) {
  if (!Array.isArray(saved) || !saved.every(l => l && Array.isArray(l.tubes))) return defaultLayers();
  const t = saved.map(l => l.tubes);
  if (saved.length === 4) return LAYERS.map((L, i) => ({ ...L, tubes: [...t[i]] }));
  if (saved.length !== 3 || OLD_DEFAULTS.some(d => JSON.stringify(d) === JSON.stringify(t))) return defaultLayers();
  return [
    { ...LAYERS[0], tubes: [...t[0]] },
    { ...LAYERS[1], tubes: [...t[2]] },
    { ...LAYERS[2], tubes: t[1].filter(id => id !== 'black') },
    { ...LAYERS[3], tubes: t[1].includes('black') ? ['black'] : [] },
  ];
}

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
