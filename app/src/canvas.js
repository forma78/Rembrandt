// The canvas on the machine, one for every tab (the owner, 2026-10-06, on
// the Ink tab's white board below the image area: "make it as on NOLAN and
// TYPE — let them have one base we carry the parameters to"). It lies from
// home (Rembrandt.md §1, 2026-10-05): its bottom left corner level with
// home, its left edge edgeLeft mm to the right of it, its bottom edge
// edgeBottom mm above; Board width and Board height grow it up and to the
// right. The four numbers are kept in this browser under one key: TYPE,
// NOLAN, New Yuri and Ink read and write the same ones, and a tab open in
// another window follows (the storage event). No DOM but localStorage.

import { reach } from './machine.js';

export const CANVAS_KEY = 'rembrandt.canvas.v1';
export const CANVAS = { boardW: 500, boardH: 700, edgeLeft: 50, edgeBottom: 0 };   // the owner's, 2026-10-05
// the fields, as every tab shows them: [key, label, unit, step, title, any — below 0 too]
export const CANVAS_FIELDS = [['boardW', 'Board width', 'mm', 10, 'The canvas across; it grows to the right'], ['boardH', 'Board height', 'mm', 10, 'The canvas up the machine; it grows upwards'],
  ['edgeLeft', 'Left edge →', 'mm', 1, 'The canvas\'s left edge, mm to the right of home', true], ['edgeBottom', 'Bottom edge ↑', 'mm', 1, 'The canvas\'s bottom edge, mm above home', true]];
const fine = (k, v) => Number.isFinite(v) && (k.startsWith('edge') || v > 0);
const read = () => { try { return JSON.parse(localStorage.getItem(CANVAS_KEY) || 'null'); } catch { return null; } };
// The base's numbers. Before there is one, a tab's own (`own`, kept before
// 2026-10-06) start it, else the defaults.
export function canvasNow(own) {
  const c = read(), from = c || own || {}, out = { ...CANVAS };
  for (const k of Object.keys(CANVAS)) if (fine(k, from[k])) out[k] = from[k];
  if (!c) setCanvas(out);
  return out;
}
// The base takes the numbers of `o` that make sense (a save from the Library,
// a field typed); the rest stay as they are. → the base.
export function setCanvas(o) {
  const out = { ...CANVAS, ...(read() || {}) };
  for (const k of Object.keys(CANVAS)) if (fine(k, o?.[k])) out[k] = o[k];
  try { localStorage.setItem(CANVAS_KEY, JSON.stringify(out)); } catch { }
  return out;
}
// Its centre, carriage mm: Here for the run.
export function hereOf(c) {
  const R = reach();
  return { x: R.x.min + c.edgeBottom + c.boardH / 2, y: R.y.min + c.edgeLeft + c.boardW / 2 };
}
// fn(the base) when another window changes it
export function onCanvas(fn) {
  addEventListener('storage', e => { if (e.key === CANVAS_KEY) fn(canvasNow()); });
}
