// Pencils: BLEND's composition drawn with a finite inventory of pencils.
// Colour boundaries are interleaved strokes, never a calculated mixed ink.
// All coordinates are paper mm, x right and y up. No DOM or machine commands.
import { cleanRect, planOf, dealFigure, sausagesOf } from './inkaplan.js';
import { shapesOf, BLEND } from './blendplan.js';
import { PAINT } from './tapeplan.js';
import { linOf, luminance } from './color.js';

export const PENCIL_KEY = 'rembrandt.pencils.v01';
// These swatches, trace width, pitch, tone and timing are est. until a paper test.
// Names and colours are editable inventory placeholders, not a particular brand.
export const PENCILS = [
  ['yellow', 'Lemon yellow', '#F4D522'], ['gold', 'Golden yellow', '#FAAA15'],
  ['orange', 'Orange', '#EA791F'], ['red', 'Vermilion', '#CC442D'],
  ['crimson', 'Crimson', '#A92B42'], ['ochre', 'Ochre', '#B78B35'],
  ['brown', 'Brown', '#704B35'], ['green', 'Leaf green', '#6E9843'],
  ['teal', 'Teal', '#348B88'], ['blue', 'Blue · 03', '#267CAB'],
].map(([id, name, hex]) => ({ id, name, hex, enabled: true, repeats: 2 }));
export const DEFAULTS = {
  paperW: 297, paperH: 420, margin: 15, nib: 0.45, pitch: 0.6, band: 3.6,
  transition: 9, cell: 6, speed: 25, travel: 80, liftSeconds: 0.8, tone: 0.56,
  seed: 261026, whitePaper: true, paper: '#FBF9F3',
};
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const number = (v, d, a, b) => Number.isFinite(v) ? clamp(v, a, b) : d;
const hex = v => typeof v === 'string' && /^#[\da-f]{6}$/i.test(v);
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const hash = (a, b, c) => { const n = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return n - Math.floor(n); };
const safe = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));

export function cleanSettings(raw = {}) {
  if (!raw || typeof raw !== 'object') raw = {};
  const d = DEFAULTS;
  const o = { paperW: number(raw.paperW, d.paperW, 50, 1000), paperH: number(raw.paperH, d.paperH, 50, 1000),
    margin: number(raw.margin, d.margin, 0, 100), nib: number(raw.nib, d.nib, 0.1, 2), pitch: number(raw.pitch, d.pitch, 0.25, 3),
    band: number(raw.band, d.band, 0.5, 15), transition: number(raw.transition, d.transition, 0, 40), cell: number(raw.cell, d.cell, 2, 20),
    speed: number(raw.speed, d.speed, 1, 100), travel: number(raw.travel, d.travel, 1, 200), liftSeconds: number(raw.liftSeconds, d.liftSeconds, 0, 5),
    tone: number(raw.tone, d.tone, 0.1, 1), seed: Math.round(number(raw.seed, d.seed, 0, 1e9)), whitePaper: raw.whitePaper !== false, paper: hex(raw.paper) ? raw.paper : d.paper };
  o.margin = Math.min(o.margin, (Math.min(o.paperW, o.paperH) - 10) / 2);
  const ps = Array.isArray(raw.pencils) ? raw.pencils.slice(0, 30) : PENCILS;
  const seen = new Set();
  o.pencils = ps.filter(p => p && hex(p.hex)).map((p, i) => {
    let id = typeof p.id === 'string' && /^[\w-]{1,40}$/.test(p.id) ? p.id : `pencil-${i + 1}`;
    while (seen.has(id)) id += '-x'; seen.add(id);
    return { id, name: String(p.name || `Pencil ${i + 1}`).slice(0, 80), hex: p.hex.toUpperCase(), enabled: p.enabled !== false, repeats: Math.round(number(p.repeats, 2, 1, 6)) };
  });
  o.rects = (Array.isArray(raw.rects) ? raw.rects : []).filter(r => r?.kind === BLEND).slice(0, 20).map(cleanRect).filter(Boolean).map(r => ({ ...r, keys: r.keys.slice(0, 8), corners: r.corners.slice(0, 9) }));
  o.assignments = Object.fromEntries(Object.entries(raw.assignments && typeof raw.assignments === 'object' ? raw.assignments : {}).filter(([id, p]) => PAINT[id] && (p === 'paper' || o.pencils.some(q => q.id === p))));
  o.colourSource = raw.colourSource === 'result' ? 'result' : 'placements';
  const ref = raw.referencePaint || {};
  o.referencePaint = { width: number(ref.width, 247, 1, 20000), brush: number(ref.brush, 3.5, 0.1, 100), swell: number(ref.swell, 5.5, 0, 100),
    edgeOut: number(ref.edgeOut, 0, 0, 50), density: number(ref.density, 50, 1, 100), corner: number(ref.corner, 4, 0.5, 500), change: number(ref.change, 30, 0, 500) };
  o.source = String(raw.source || 'Pencil study').slice(0, 120);
  return o;
}

// A study in the colours the owner singled out: yellow / orange, brown,
// green and blue; the white is the paper. BLEND's existing colour placement
// algorithm supplies the map. The page can also use its digital Result as a
// reference to separate into pencils (pencilreference.js), never as a claim
// about physical acrylic mixing.
export function pencilStudy() {
  const r = cleanRect({ id: 1, kind: BLEND, x: 25, y: 76, w: 247, h: 267, steps: 26, corners: [27, 27, 8],
    keys: [{ x: 0.205, y: 0.405, w: 0.59, h: 0.595 }, { x: 0.445, y: 0.61, w: 0.13, h: 0.17 }] });
  const o = { cw: 297, ch: 420, brush: 3.5, swell: 5.5, corner: 4, density: 50 }, P = planOf([r], o);
  const pal = { name: 'Pencil study', core: ['white', 'oyellow', 'forange', 'green', 'p03', 'sky', 'ochre'], accent: ['brown', 'red'],
    w: { white: 0.24, oyellow: 0.18, forange: 0.14, green: 0.13, p03: 0.15, sky: 0.1, ochre: 0.06 }, spot: 'p03' };
  const dealt = dealFigure([r], P.units, P.figs[0], pal, 26034, 'colours', o);
  r.ss = dealt.ss.get(0) || [];
  return cleanSettings({ rects: [r], source: 'Orange / green / blue study', colourSource: 'result' });
}

// Fit the entire drawing uniformly. Its proportions and the normalized colour
// map survive; pencil trace and pitch remain real paper mm, independent of fit.
export function fitDrawing(rects, o) {
  if (!rects.length) return [];
  const x0 = Math.min(...rects.map(r => r.x)), y0 = Math.min(...rects.map(r => r.y));
  const w = Math.max(...rects.map(r => r.x + r.w)) - x0, h = Math.max(...rects.map(r => r.y + r.h)) - y0;
  const k = Math.min((o.paperW - 2 * o.margin) / w, (o.paperH - 2 * o.margin) / h);
  return rects.map(r => cleanRect({ ...r, x: (o.paperW - w * k) / 2 + (r.x - x0) * k,
    y: (o.paperH - h * k) / 2 + (r.y - y0) * k, w: r.w * k, h: r.h * k, corners: r.corners.map(c => c * k) }));
}

export function fromBlend(settings, own = {}) {
  const rs = (settings?.rects || []).filter(r => r?.kind === BLEND).map(cleanRect).filter(Boolean);
  if (!rs.length) throw new Error('This drawing has no BLEND shapes.');
  const o = cleanSettings({ ...own, rects: rs, source: 'BLEND composition' });
  o.colourSource = 'result';
  o.referencePaint = cleanSettings({ referencePaint: { width: Math.max(...rs.map(r => r.x + r.w)) - Math.min(...rs.map(r => r.x)),
    brush: settings.brush, swell: settings.swell, edgeOut: settings.edgeOut, density: settings.density, corner: settings.corner, change: settings.change } }).referencePaint;
  o.rects = fitDrawing(rs, o);
  return o;
}

// Perceptual nearest inventory colour: this selects an actual pencil. It does
// not manufacture an RGB colour between pencils. Linear RGB -> CIE Lab D65.
function lab(colour) {
  const [r, g, b] = linOf(colour), f = t => t > 216 / 24389 ? Math.cbrt(t) : t * 841 / 108 + 4 / 29;
  const x = f((0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047),
    y = f(0.2126729 * r + 0.7151522 * g + 0.072175 * b), z = f((0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
export function nearestPencil(colour, pencils) {
  const a = lab(colour); let best = null, bd = Infinity;
  for (const p of pencils) {
    if (!p.enabled) continue;
    const b = lab(p.hex), d = (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
    if (d < bd) { best = p.id; bd = d; }
  }
  return best;
}

export function colourMap(o) {
  return Object.fromEntries([...new Set(o.rects.flatMap(r => r.ss.map(q => q.paint)))].map(id => {
    const chosen = o.assignments?.[id];
    return [id, id === 'white' && o.whitePaper || chosen === 'paper' ? null : o.pencils.some(p => p.id === chosen && p.enabled) ? chosen : nearestPencil(PAINT[id].hex, o.pencils)];
  }));
}

function segmentDistance(p, q) {
  const dx = q.b[0] - q.a[0], dy = q.b[1] - q.a[1], d = dx * dx + dy * dy;
  const t = d ? clamp(((p[0] - q.a[0]) * dx + (p[1] - q.a[1]) * dy) / d, 0, 1) : 0;
  return Math.hypot(p[0] - q.a[0] - t * dx, p[1] - q.a[1] - t * dy);
}

// A coarse memoized spatial colour field. Every colour keeps its nearest
// placement; adjoining areas interleave within Transition mm (est.). White
// participates as an empty stroke so its area does not become another colour.
function colourField(anchors, mapping, transition, fallback) {
  const cache = new Map();
  return p => {
    const ix = Math.round(p[0]), iy = Math.round(p[1]), key = `${ix},${iy}`;
    if (cache.has(key)) return cache.get(key);
    const ds = new Map();
    for (const q of anchors) {
      const id = mapping[q.paint], d = segmentDistance([ix, iy], q);
      if (!ds.has(id) || d < ds.get(id)) ds.set(id, d);
    }
    const near = [...ds].sort((a, b) => a[1] - b[1]).slice(0, 3);
    const d0 = near[0]?.[1] ?? 0;
    const weights = near.length ? near.map(([id, d]) => [id, transition ? Math.exp(-3 * (d - d0) / transition) : +(d === d0)]) : [[fallback, 1]];
    const total = weights.reduce((s, q) => s + q[1], 0);
    let sum = 0;
    const result = weights.map(([id, w]) => [id, sum += w / total]);
    cache.set(key, result); return result;
  };
}

// Rounded rectangles as actual centre lines. A true offset changes both the
// box and its corner radius. Arc chords deviate by at most 0.02 mm (est.
// geometric tolerance); SVG exports these same polylines, in the same order.
function loopPoints(shape, inset, sample) {
  const x0 = shape.x0 + inset, y0 = shape.y0 + inset, x1 = shape.x1 - inset, y1 = shape.y1 - inset;
  if (x1 - x0 < 0.3 || y1 - y0 < 0.3) return [];
  const r = clamp(shape.c - inset, 0.15, Math.min(x1 - x0, y1 - y0) / 2), pts = [];
  const arc = (cx, cy, start) => {
    const n = Math.max(3, Math.ceil(Math.PI * r / (2 * sample)), Math.ceil(Math.PI / (4 * Math.acos(1 - Math.min(0.02 / r, 1)))));
    for (let k = 0; k <= n; k++) { const a = start - k * Math.PI / (2 * n); pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  };
  arc(x1 - r, y1 - r, Math.PI / 2); arc(x1 - r, y0 + r, 0);
  arc(x0 + r, y0 + r, -Math.PI / 2); arc(x0 + r, y1 - r, -Math.PI);
  pts.push(pts[0].slice());
  // Split long straight sides too: the colour may change midway along one.
  const out = [pts[0]];
  for (let k = 1; k < pts.length; k++) {
    const a = pts[k - 1], b = pts[k], n = Math.max(1, Math.ceil(distance(a, b) / sample));
    for (let j = 1; j <= n; j++) out.push([a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n]);
  }
  return out;
}

// Clip each drawn segment to a nib-radius-inset paper rectangle. An exit and
// reentry are separate pen-down strokes; no connecting line outside the sheet.
function clipLine(a, b, box) {
  let lo = 0, hi = 1;
  for (let k = 0; k < 2; k++) {
    const d = b[k] - a[k];
    if (Math.abs(d) < 1e-12) { if (a[k] < box[k] || a[k] > box[k + 2]) return null; continue; }
    let t0 = (box[k] - a[k]) / d, t1 = (box[k + 2] - a[k]) / d;
    if (t0 > t1) [t0, t1] = [t1, t0]; lo = Math.max(lo, t0); hi = Math.min(hi, t1);
    if (lo >= hi) return null;
  }
  return [[a[0] + (b[0] - a[0]) * lo, a[1] + (b[1] - a[1]) * lo], [a[0] + (b[0] - a[0]) * hi, a[1] + (b[1] - a[1]) * hi]];
}
export const pathLength = pts => pts.slice(1).reduce((s, b, k) => s + distance(pts[k], b), 0);

function simplify(pts) {
  const out = [];
  for (const p of pts) {
    if (out.length > 1) {
      const a = out[out.length - 2], b = out.at(-1), ux = b[0] - a[0], uy = b[1] - a[1], vx = p[0] - b[0], vy = p[1] - b[1];
      if (Math.abs(ux * vy - uy * vx) < 1e-9 && ux * vx + uy * vy >= 0) out.pop();
    }
    out.push(p);
  }
  return out;
}

// Approximate travel ordering by horizontal strips, alternating direction.
// This changes only pen-up moves. Each colour is mounted once, its repeats
// completed before changing pencils. No line joins two separate strokes.
function orderPaths(paths) {
  const band = p => Math.floor(p[0][1] / 12);
  paths.sort((a, b) => band(a) - band(b) || (band(a) % 2 ? -1 : 1) * (a[0][0] - b[0][0]));
  let prev = null;
  for (const p of paths) { if (prev && distance(prev, p.at(-1)) < distance(prev, p[0])) p.reverse(); prev = p.at(-1); }
  return paths;
}

export function pencilPlan(raw, reference = null) {
  const o = cleanSettings(raw), mapping = colourMap(o), active = o.pencils.filter(p => p.enabled);
  const targetField = reference ? referenceField(reference, o) : null;
  const layers = active.map(p => ({ ...p, paths: [], length: 0, travel: 0, strokes: 0, seconds: 0 }));
  const byId = new Map(layers.map(p => [p.id, p]));
  const box = [o.nib / 2, o.nib / 2, o.paperW - o.nib / 2, o.paperH - o.nib / 2];
  let track = 0, skipped = 0, samples = 0;
  // A bounded work limit keeps malformed imported drawings and extreme
  // settings reviewable instead of freezing the browser or silently truncating.
  const LIMIT = 1600000;
  for (let ri = 0; ri < o.rects.length && active.length; ri++) {
    const r = o.rects[ri], shapes = shapesOf(r), anchors = sausagesOf([r]);
    if (shapes.some(s => ![s.x0, s.x1, s.y0, s.y1, s.c].every(Number.isFinite) || Math.max(Math.abs(s.x0), Math.abs(s.x1), Math.abs(s.y0), Math.abs(s.y1)) > 10000)) throw new Error('A blend key is too large. Fit or resize the drawing first.');
    const ordinary = anchors.filter(q => !q.core), core = anchors.filter(q => q.core);
    const field = targetField || colourField(ordinary, mapping, o.transition, active[0]?.id);
    const coreField = targetField || colourField(core.length ? core : ordinary, mapping, o.transition, active[0]?.id);
    const tracks = [];
    for (const s of r.core ? shapes.slice(0, -1) : shapes) {
      const n = Math.max(1, Math.ceil(o.band / o.pitch));
      for (let j = 0; j < n; j++) tracks.push({ s, inset: o.nib / 2 + (j + 0.5) * o.band / n, field });
    }
    if (r.core) {
      const s = shapes.at(-1), D = Math.min(s.x1 - s.x0, s.y1 - s.y0) / 2;
      if (D / o.pitch > 5000) throw new Error('The core is too dense. Fit the drawing to paper first.');
      for (let d = o.nib / 2; d < D - 0.15; d += o.pitch) tracks.push({ s, inset: d, field: coreField });
    }
    for (const t of tracks) {
      const perimeter = 2 * (t.s.x1 - t.s.x0 + t.s.y1 - t.s.y0);
      if (samples + perimeter / 0.65 > LIMIT) throw new Error('This plan is too dense. Increase stroke spacing or reduce the blend steps.');
      const pts = loopPoints(t.s, t.inset, 0.65), key = track++;
      samples += pts.length; if (samples > LIMIT) throw new Error('This plan is too dense. Increase stroke spacing or reduce the blend steps.');
      let current = null, id = null, along = 0, colourCell = -1, chosen = null;
      for (let k = 1; k < pts.length; k++) {
        const a = pts[k - 1], b = pts[k], ds = distance(a, b), cell = Math.floor((along + ds / 2) / o.cell);
        if (cell !== colourCell) {
          colourCell = cell;
          // Hold one colour for an interleaving cell: sampling every raster
          // pixel would create thousands of tiny, unhelpful lift/lower cycles.
          let j = k, ahead = Math.max(0, (cell + 0.5) * o.cell - along - ds);
          while (j + 1 < pts.length && ahead > distance(pts[j], pts[j + 1])) { ahead -= distance(pts[j], pts[j + 1]); j++; }
          const weights = t.field(pts[j]), dice = hash(key, cell, o.seed);
          chosen = weights.find(q => dice <= q[1])?.[0] ?? null;
        }
        const next = chosen;
        const clipped = next ? clipLine(a, b, box) : null;
        if (!clipped || !byId.has(next)) { current = null; id = null; skipped++; }
        else if (id === next && current && distance(current.at(-1), clipped[0]) < 1e-6) current.push(clipped[1]);
        else { current = [clipped[0], clipped[1]]; byId.get(next).paths.push(current); id = next; }
        along += ds;
      }
    }
  }
  for (const p of layers) {
    p.paths = p.paths.map(simplify);
    orderPaths(p.paths);
    const once = p.paths.reduce((s, q) => s + pathLength(q), 0);
    const travel = p.paths.reduce((s, q, k) => s + (k ? distance(p.paths[k - 1].at(-1), q[0]) : 0), 0);
    p.length = once * p.repeats;
    p.travel = travel * p.repeats + (p.paths.length ? distance(p.paths.at(-1).at(-1), p.paths[0][0]) * (p.repeats - 1) : 0);
    p.strokes = p.paths.length * p.repeats;
    p.seconds = p.length / o.speed + p.travel / o.travel + p.strokes * o.liftSeconds; // est.; excludes changing/sharpening pencils
  }
  const passes = layers.filter(p => p.paths.length);
  return { settings: o, layers, mapping, passes, tracks: track, skipped, samples,
    length: layers.reduce((s, p) => s + p.length, 0), strokes: layers.reduce((s, p) => s + p.strokes, 0),
    seconds: layers.reduce((s, p) => s + p.seconds, 0) };
}

export function svgOf(plan, only = null, state = plan.settings) {
  const o = plan.settings, layers = only ? plan.passes.filter(p => p.id === only) : plan.passes;
  const f = v => String(Math.round(v * 1000) / 1000);
  const meta = JSON.stringify({ rembrandt: '1.1.0', pencils: true, label: `PENCILS · ${o.paperW} × ${o.paperH} mm · ${layers.length} colours`, settings: state }).replace(/&/g, '\\u0026').replace(/</g, '\\u003c');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="${o.paperW}mm" height="${o.paperH}mm" viewBox="0 0 ${o.paperW} ${o.paperH}">
<title>${safe(o.source)} · Pencils</title>
<desc>1 unit = 1 mm. Each path is a separate pen-down stroke; lift between paths. Layers are pencil changes. Trace width and tone est.; no paper rectangle is plotted.</desc>
<metadata id="rembrandt-test">${meta}</metadata>
${layers.map((p, k) => `<g id="pencil-${p.id}" inkscape:groupmode="layer" inkscape:label="${String(k + 1).padStart(2, '0')} ${safe(p.name)}" data-pencil="${safe(p.id)}" fill="none" stroke="${p.hex}" stroke-width="${o.nib}" stroke-linecap="round" stroke-linejoin="round">
${Array.from({ length: p.repeats }, (_, rep) => `<g data-repeat="${rep + 1}">\n${p.paths.map(pts => `<path d="M${pts.map(v => `${f(v[0])},${f(o.paperH - v[1])}`).join(' L')}"/>`).join('\n')}\n</g>`).join('\n')}
</g>`).join('\n')}
</svg>`;
}

export function manifestOf(plan) {
  const o = plan.settings;
  return { version: 1, kind: 'rembrandt-pencils', units: 'mm', origin: 'bottom-left', paper: { width: o.paperW, height: o.paperH },
    traceWidthEst: o.nib, spacing: o.pitch, speedEst: o.speed, travelSpeedEst: o.travel, liftSecondsEst: o.liftSeconds,
    estimatedSeconds: Math.round(plan.seconds), note: 'Planning files only. Lift between paths. Change pencils only between passes. Timing excludes tool changes and sharpening.',
    passes: plan.passes.map((p, i) => ({ order: i + 1, pencil: p.id, name: p.name, colour: p.hex, repeats: p.repeats,
      strokes: p.strokes, drawingMm: Math.round(p.length), travelMm: Math.round(p.travel), estimatedSeconds: Math.round(p.seconds),
      file: `${String(i + 1).padStart(2, '0')}-${p.id}.svg` })) };
}

// A compact real-scale test: the same pencil in one, two and three coats.
// It uses straight physical lines; labels are in a non-plotting SVG layer.
export function swatchSvg(raw) {
  const o = cleanSettings(raw), ps = o.pencils.filter(p => p.enabled), W = 190, H = 20 + ps.length * 16;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}">
<desc>Pencil test at 100%. Three patches per pencil: 1, 2, 3 coats. Draw only the strokes group; labels are for reference. Trace and pitch est.</desc>
<g id="labels" font-family="sans-serif" font-size="3" fill="#333"><text x="5" y="7">Pencil / coats</text>${[1, 2, 3].map((n, j) => `<text x="${70 + j * 38}" y="7">${n}</text>`).join('')}${ps.map((p, i) => `<text x="5" y="${22 + i * 16}">${safe(p.name)}</text>`).join('')}</g>
<g id="strokes" fill="none" stroke-width="${o.nib}" stroke-linecap="round">${ps.map((p, i) => `<g id="swatch-${p.id}" stroke="${p.hex}">${[1, 2, 3].map((coats, j) => Array.from({ length: coats }, () => Array.from({ length: Math.max(2, Math.floor(8 / o.pitch)) }, (_, k) => `<path d="M${63 + j * 38},${16 + i * 16 + k * o.pitch}h25"/>`).join('')).join('')).join('')}</g>`).join('')}</g></svg>`;
}

export const lightToDark = pencils => pencils.slice().sort((a, b) => luminance(b.hex) - luminance(a.hex));

// A digital reference is a colour brief, not a physical paint prediction.
// Match each sampled tint to ONE real pencil and paper coverage. A pale tint
// means fewer strokes, not an imaginary light-coloured tool or servo pressure.
function referenceField(ref, o) {
  const candidates = [], paperRgb = [0, 2, 4].map(i => parseInt(o.paper.slice(i + 1, i + 3), 16));
  const toHex = rgb => '#' + rgb.map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
  candidates.push({ id: null, coverage: 0, lab: lab(o.paper) });
  for (const p of o.pencils.filter(p => p.enabled)) {
    const rgb = [0, 2, 4].map(i => parseInt(p.hex.slice(i + 1, i + 3), 16));
    for (const coverage of [0.2, 0.4, 0.65, 0.85, 1]) candidates.push({ id: p.id, coverage, lab: lab(toHex(rgb.map((v, i) => paperRgb[i] + (v - paperRgb[i]) * coverage))) });
  }
  const cache = new Map();
  return p => {
    const ix = clamp(Math.floor(p[0] / ref.h), 0, ref.nx - 1), iy = clamp(Math.floor(p[1] / ref.h), 0, ref.ny - 1), cell = (ref.ny - 1 - iy) * ref.nx + ix;
    if (cache.has(cell)) return cache.get(cell);
    const at = cell * 4, a = lab(toHex([ref.pixels[at], ref.pixels[at + 1], ref.pixels[at + 2]]));
    let best = candidates[0], error = Infinity;
    for (const c of candidates) {
      const d = (a[0] - c.lab[0]) ** 2 + (a[1] - c.lab[1]) ** 2 + (a[2] - c.lab[2]) ** 2;
      if (d < error) { best = c; error = d; }
    }
    const weights = [[best.id, best.coverage], [null, 1]]; cache.set(cell, weights); return weights;
  };
}
