// How the paint behaves, est. until the Adjustments tab measures it
// (Rembrandt.md §5, §7; README: "Paint behaviour goes into Adjustments,
// never hardcoded"). The Adjustments tab keeps it in this browser; Create
// reads it from there. No DOM: the storage is passed in.

export const PAINT_EST = {
  line: 8,        // mm, the width of one brush line (Sonnet's layout, 2026-10-01)
  film: 0.30,     // mm of paint on the canvas (RUBENS)
  keeps: 25,      // % the brush keeps (RUBENS)
  dropMl: 2.1,    // ml in one standard drop (§5: nozzle 6 mm, 100 mm long)
  dropLen: 100,   // mm, how long a standard drop lies across the lines
  nozzle: 6,      // mm
  tail: 120,      // mm, the smear length: how far a line thins out
};
export const PAINT_FIELDS = [
  ['line', 'Line width', 'mm', 1], ['film', 'Film', 'mm', 0.05], ['keeps', 'Brush keeps', '%', 5],
  ['dropMl', 'Drop', 'ml', 0.1], ['dropLen', 'Drop length', 'mm', 5], ['nozzle', 'Nozzle', 'mm', 0.5],
];
const KEY = 'rembrandt.adjust.v01';

export function readPaint(storage) {
  try {
    const o = JSON.parse(storage?.getItem(KEY) || '{}'), p = { ...PAINT_EST, ...(o.paint || {}) };
    if (Number.isFinite(o.tail)) p.tail = o.tail;
    for (const k of Object.keys(PAINT_EST)) if (!(Number.isFinite(p[k]) && p[k] > 0)) p[k] = PAINT_EST[k];
    return p;
  } catch { return { ...PAINT_EST }; }
}

// ml of paint for a line L mm long (the RUBENS formula, cncPlan in cnc.js).
export const mlFor = (L, p) => L * p.line * p.film * (1 + p.keeps / 100) / 1000;
