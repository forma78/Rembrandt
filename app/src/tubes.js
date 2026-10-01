// Tubes and the layers they go into (Rembrandt.md §1, §4, §9). No DOM.
//
// The inventory is a placeholder until the owner enters the shelf: names,
// pigment codes and colours are those of §9, the colours picked by eye.

import { linOf } from './color.js';

export const INVENTORY = [
  { id: 'yellow', name: 'Yellow',  pigment: 'PY74',        hex: '#F1B31C' },
  { id: 'orange', name: 'Orange',  pigment: 'PO73',        hex: '#E8641B' },
  { id: 'red',    name: 'Red',     pigment: 'PR254',       hex: '#B8161B' },
  { id: 'white',  name: 'White',   pigment: 'PW6',         hex: '#F3F1EA' },
  { id: 'grey',   name: 'Grey N5', pigment: 'PW6 + PBk11', hex: '#77787A', premix: true },
  { id: 'black',  name: 'Black',   pigment: 'PBk11',       hex: '#1B1A19' },
];
export const tubeOf = id => INVENTORY.find(t => t.id === id) || null;

// Three layers in a fixed order (§1); the first painting's tubes (§9).
export const defaultLayers = () => [
  { n: 1, name: 'Light', where: 'below the curve',       tubes: ['yellow', 'orange', 'red'] },
  { n: 2, name: 'Sheet', where: 'above the curve',       tubes: ['white', 'grey'] },
  { n: 3, name: 'Black', where: 'from the edges inward', tubes: ['black'] },
];

// OKLab lightness, 0 black … 1 white.
export function lightness(hex) {
  const [r, g, b] = linOf(hex);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
}

// A layer's tubes in the order they run: the lighter first (§1, "at art
// school we were taught to start with the lights"). The same tube twice
// keeps both places. Returns [{ id, i }], i — the place in layer.tubes.
export function runOrder(ids) {
  return ids.map((id, i) => ({ id, i, L: lightness(tubeOf(id)?.hex || '#808080') }))
    .sort((a, b) => b.L - a.L || a.i - b.i)
    .map(({ id, i }) => ({ id, i }));
}
