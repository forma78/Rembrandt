// CARAN, 2026-10-27: keep the digital Result, assign its pixels to actual
// pencils, then carry a pencil round long contours, lifting over other colours.
// Colour comes exclusively from the frozen raster. Geometry only supplies a
// direction of travel. No pigment mixing, inferred sausages, or dropped colours.
import { cleanRect, planOf, simOf, GROUND, labOf, de2000, machinePiece, atPiece, sausagesOf } from './inkaplan.js';
import { regionsOf, shapeAt, pointOn, pieceLength, lineLen, cleanPencils, PENCILS_NEW, withChanges } from './dacheplan.js';
import { linOf } from './color.js';
import { plotRun, DEFAULTS as RUN_DEFAULTS, ELBOW_HOVER, TAIL_MIN } from './strokes.js';
import { reach, lineCuts, arcCuts } from './machine.js';
import { SAUSAGE_W } from './ccdplan.js';

export const DEFAULTS = { pitch: 1, nib: 1, speed: 80, travel: 180, coats: 1, spokes: true, squares: true, details: true, detailSize: 6, liftSeconds: 0.18, frame: null };
// Pitch, trace width, speeds, detail size and lift timing are est. until paper tests.
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const num = (v, d, a, b) => Number.isFinite(v) ? clamp(v, a, b) : d;
const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const flip = g => ({ ...g, a: g.b, b: g.a, ...(g.t === 'A' ? { left: !g.left } : {}) });
const reverse = ps => ps.slice().reverse().map(flip);
export function settingsOf(o = {}) {
  const d = DEFAULTS, f = o.frame;
  return { pitch: num(o.pitch, d.pitch, 0.25, 3), nib: num(o.nib, d.nib, 0.25, 3), speed: num(o.speed, d.speed, 5, 120), travel: num(o.travel, d.travel, 10, 250),
    coats: Math.round(num(o.coats, d.coats, 1, 4)), spokes: o.spokes !== false, squares: o.squares !== false, details: o.details !== false, detailSize: num(o.detailSize, d.detailSize, 1, 15), liftSeconds: num(o.liftSeconds, d.liftSeconds, 0, 3),
    frame: f && [f.x0, f.y0, f.x1, f.y1].every(Number.isFinite) && f.x1 > f.x0 && f.y1 > f.y0 ? { x0: f.x0, y0: f.y0, x1: f.x1, y1: f.y1 } : null };
}

export function snapshotOf(raw, name = 'BLEND') {
  if (!raw || !Array.isArray(raw.rects) || !raw.rects.length) throw new Error(`No composition in ${name}. Open it there first, or import a saved project.`);
  const s = structuredClone(raw), W = s.boardW, H = s.boardH;
  if (![W, H].every(v => Number.isFinite(v) && v >= 10 && v <= 1500) || s.rects.length > 100) throw new Error('The source has invalid paper dimensions or too many figures.');
  s.rects = s.rects.map(cleanRect).filter(Boolean);
  if (!s.rects.length) throw new Error('No valid figures in the source.');
  const opts = { cw: W, ch: H, brush: s.brush, swell: s.swell, edgeOut: s.edgeOut, overlap: s.overlap, join: s.join, corner: s.corner, change: s.change, nodes: s.nodes, density: s.density };
  // Exactly the renderer and native resolution used by BLEND/DACHE's Result.
  const sim = simOf(planOf(s.rects, opts), s.rects, opts);
  sim.advance(Infinity);
  const data = new Uint8ClampedArray(sim.nx * sim.ny * 4); sim.rgba(data, true);
  return { version: 1, name, width: W, height: H, nx: sim.nx, ny: sim.ny, h: sim.h, data, settings: s };
}

export function validateSnapshot(s) {
  if (!s || ![s.width, s.height, s.h].every(v => Number.isFinite(v) && v > 0) || !Number.isInteger(s.nx) || !Number.isInteger(s.ny) || s.nx < 1 || s.ny < 1 || s.nx * s.ny > 2500000 || s.data?.length !== s.nx * s.ny * 4 || Math.abs(s.nx * s.h - s.width) > s.h * 1.01 || Math.abs(s.ny * s.h - s.height) > s.h * 1.01) throw new Error('Invalid CARAN snapshot.');
  return s;
}

export function colourMap(snapshot, rawPencils, frame = null) {
  const s = validateSnapshot(snapshot), pencils = cleanPencils(rawPencils ?? PENCILS_NEW).filter(p => p.on);
  if (!pencils.length) throw new Error('Enable at least one pencil.');
  if (pencils.length > 128) throw new Error('Use at most 128 pencils in one run.');
  const labs = pencils.map(p => labOf(linOf(p.hex))), memo = new Map(), labels = new Int16Array(s.nx * s.ny).fill(-1), counts = new Uint32Array(pencils.length);
  // Full 24-bit keys: no 5-bit colour rounding, averaging, or white threshold.
  for (let i = 0; i < labels.length; i++) {
    const x = (i % s.nx + 0.5) * s.h, y = (s.ny - 1 - Math.floor(i / s.nx) + 0.5) * s.h, at = i * 4;
    if (x > s.width || y > s.height || (frame && (x < frame.x0 || x > frame.x1 || y < frame.y0 || y > frame.y1))) continue;
    if (s.data[at + 3] === 0 || GROUND.every((v, j) => s.data[at + j] === v)) continue;
    const key = (s.data[at] << 16) | (s.data[at + 1] << 8) | s.data[at + 2];
    let k = memo.get(key);
    if (k === undefined) {
      const hex = '#' + key.toString(16).padStart(6, '0'), lab = labOf(linOf(hex));
      let best = Infinity; k = 0;
      labs.forEach((l, j) => { const d = de2000(lab, l); if (d < best) { best = d; k = j; } });
      memo.set(key, k);
    }
    labels[i] = k; counts[k]++;
  }
  return { pencils, labels, counts, colours: memo.size };
}

// Small connected patches already in the raster get one perpendicular fill.
// They are never guessed from the paint-placement map and never darkened.
function detailMap(s, labels, o) {
  const dirs = new Uint8Array(labels.length);
  if (!o.details) return dirs;
  const seen = new Uint8Array(labels.length), queue = new Int32Array(labels.length), W = s.nx;
  const keys = (s.settings?.rects ?? []).flatMap(r => regionsOf([r], s.settings).map(R => R.a));
  for (let i = 0; i < labels.length; i++) {
    if (labels[i] < 0 || seen[i]) continue;
    let n = 1, head = 0, x0 = i % W, x1 = x0, y0 = Math.floor(i / W), y1 = y0;
    queue[0] = i; seen[i] = 1;
    while (head < n) {
      const at = queue[head++], x = at % W, y = Math.floor(at / W);
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      for (const q of [x ? at - 1 : -1, x + 1 < W ? at + 1 : -1, at - W, at + W]) if (q >= 0 && q < labels.length && !seen[q] && labels[q] === labels[i]) { seen[q] = 1; queue[n++] = q; }
    }
    if ((x1 - x0 + 1) * s.h > o.detailSize || (y1 - y0 + 1) * s.h > o.detailSize) continue;
    const x = (x0 + x1 + 1) / 2 * s.h, y = (s.ny - (y0 + y1 + 1) / 2) * s.h;
    let dir = 1, nearest = Infinity;
    for (const K of keys) for (const [d, axis] of [[Math.abs(x - K.x0), 2], [Math.abs(x - K.x1), 2], [Math.abs(y - K.y0), 1], [Math.abs(y - K.y1), 1]]) if (d < nearest) { nearest = d; dir = axis; }
    for (let j = 0; j < n; j++) dirs[queue[j]] = dir;
  }
  return dirs;
}

// Preserve the actual sausages in the frozen source as crosswise guides.
// Their original paint is never used: the Result's assigned pixels supply
// every pencil. The last guide owns an overlap, as in the source placement.
function sausageGuides(s, labels, enabled) {
  const owners = new Int32Array(labels.length), guides = [];
  if (!enabled) return { owners, guides };
  const rects = (s.settings?.rects ?? []).map(r => ({ ...r, ss: Array.isArray(r.ss) ? r.ss : [] }));
  for (const q of sausagesOf(rects)) {
    if (![...q.a, ...q.b].every(Number.isFinite)) continue;
    const L = dist(q.a, q.b); if (L < 0.05) continue;
    const u = [(q.b[0] - q.a[0]) / L, (q.b[1] - q.a[1]) / L], radius = SAUSAGE_W / 2;
    const x0 = Math.max(0, Math.floor((Math.min(q.a[0], q.b[0]) - radius) / s.h)), x1 = Math.min(s.nx - 1, Math.floor((Math.max(q.a[0], q.b[0]) + radius) / s.h));
    const y0 = Math.max(0, Math.floor((Math.min(q.a[1], q.b[1]) - radius) / s.h)), y1 = Math.min(s.ny - 1, Math.floor((Math.max(q.a[1], q.b[1]) + radius) / s.h));
    const id = guides.length + 1;
    guides.push({ a: q.a, b: q.b, u, L, radius });
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const at = (s.ny - 1 - y) * s.nx + x; if (labels[at] < 0) continue;
      const dx = (x + 0.5) * s.h - q.a[0], dy = (y + 0.5) * s.h - q.a[1], along = clamp(dx * u[0] + dy * u[1], 0, L);
      if (Math.hypot(dx - along * u[0], dy - along * u[1]) <= radius) owners[at] = id;
    }
  }
  return { owners, guides };
}

// Keep the small darker cells visible in the Result at the sausage/ring
// crossings (owner's hand-marked Screenshot 2026-10-27 at 12.36.17 PM).
// Independent nearest-colour rounding can give the cell and BOTH surrounding
// sides the same pencil. Only that loss of existing contrast is corrected.
// No mark is created on a uniform source, no paint-placement colour is used,
// and no extra coat or simulated mixture is added.
const SQUARE_SOURCE_DL = 3, SQUARE_PENCIL_DL = 4, SQUARE_MAX_DE = 25, SQUARE_MAX_HUE = Math.PI / 5; // L*, L*, ΔE, radians; est. visual matching thresholds
function preserveSquares(s, map, owners, guides) {
  const original = map.labels.slice(), labs = map.pencils.map(p => labOf(linOf(p.hex))), cache = new Map(), matches = new Map();
  const atPoint = p => { const x = Math.floor(p[0] / s.h), y = s.ny - 1 - Math.floor(p[1] / s.h); return x >= 0 && x < s.nx && y >= 0 && y < s.ny ? y * s.nx + x : -1; };
  const colour = at => {
    const a = at * 4, key = (s.data[a] << 16) | (s.data[a + 1] << 8) | s.data[a + 2];
    if (!cache.has(key)) cache.set(key, labOf(linOf('#' + key.toString(16).padStart(6, '0'))));
    return { key, lab: cache.get(key) };
  };
  let changed = 0;
  for (let at = 0; at < owners.length; at++) {
    const k = original[at]; if (!owners[at] || k < 0) continue;
    const q = guides[owners[at] - 1], x = (at % s.nx + 0.5) * s.h, y = (s.ny - 1 - Math.floor(at / s.nx) + 0.5) * s.h;
    const along = clamp((x - q.a[0]) * q.u[0] + (y - q.a[1]) * q.u[1], 0, q.L), p = [q.a[0] + along * q.u[0], q.a[1] + along * q.u[1]], d = q.radius + s.h * 1.5;
    const A = atPoint([p[0] - q.u[1] * d, p[1] + q.u[0] * d]), B = atPoint([p[0] + q.u[1] * d, p[1] - q.u[0] * d]);
    if (A < 0 || B < 0 || original[A] !== k || original[B] !== k || owners[A] || owners[B]) continue;
    const src = colour(at), left = colour(A).lab, right = colour(B).lab;
    if (Math.min(left[0], right[0]) - src.lab[0] < SQUARE_SOURCE_DL) continue;
    const key = `${src.key}/${k}`;
    if (!matches.has(key)) {
      const hue = Math.atan2(src.lab[2], src.lab[1]), chroma = Math.hypot(src.lab[1], src.lab[2]);
      let best = k, error = SQUARE_MAX_DE;
      labs.forEach((lab, j) => {
        if (lab[0] > labs[k][0] - SQUARE_PENCIL_DL) return;
        const C = Math.hypot(lab[1], lab[2]), diff = Math.abs(Math.atan2(Math.sin(Math.atan2(lab[2], lab[1]) - hue), Math.cos(Math.atan2(lab[2], lab[1]) - hue)));
        if (chroma > 12 && (C < chroma * 0.4 || diff > SQUARE_MAX_HUE)) return; // est.; retain the cell's hue family
        const delta = de2000(src.lab, lab); if (delta < error) { error = delta; best = j; }
      });
      matches.set(key, best);
    }
    const next = matches.get(key);
    if (next !== k) { map.labels[at] = next; map.counts[k]--; map.counts[next]++; changed++; }
  }
  return changed;
}

function segment(shape, p, a, b) {
  const A = pointOn(shape, p, a), B = pointOn(shape, p, b);
  if (!(p % 2)) return { t: 'L', a: A, b: B };
  const r = Math.max(0, Math.min(shape.c, (shape.x1 - shape.x0) / 2, (shape.y1 - shape.y0) / 2));
  if (r < 1 || pieceLength(shape, p) * Math.abs(b - a) < 0.1) return { t: 'L', a: A, b: B };
  const mid = pointOn(shape, p, 0.5), signs = { 1: [1, -1], 3: [1, 1], 5: [-1, 1], 7: [-1, -1] }[p];
  return { t: 'A', a: A, b: B, c: [mid[0] - signs[0] * r / Math.SQRT2, mid[1] - signs[1] * r / Math.SQRT2], r, left: true };
}

function trimOrbit(list, pencil) {
  const wanted = list.flatMap((q, i) => q.k === pencil ? [i] : []);
  if (!wanted.length) return [];
  // Cut away the longest unused part of a circle, rather than running a whole
  // sheet-sized circle for every colour. Keep the remaining contour order.
  let first = wanted[0], last = wanted.at(-1), longest = -1;
  wanted.forEach((a, j) => {
    const b = wanted[(j + 1) % wanted.length]; let L = 0;
    for (let i = (a + 1) % list.length; i !== b; i = (i + 1) % list.length) L += lineLen(list[i].g);
    if (L > longest) { longest = L; first = b; last = a; }
  });
  const out = [];
  for (let i = first;; i = (i + 1) % list.length) { out.push({ ...list[i].g, turn: list[i].k !== pencil }); if (i === last) break; }
  // The pencil is up over these gaps. A direct flight saves circling through
  // a large empty part; its start and end, and all drawn marks, stay exact.
  const short = [];
  for (let i = 0; i < out.length;) {
    if (!out[i].turn) { short.push(out[i++]); continue; }
    const a = out[i].a; let b = out[i].b, L = 0;
    while (i < out.length && out[i].turn) { L += lineLen(out[i]); b = out[i++].b; }
    if (dist(a, b) >= 0.05) short.push({ t: 'L', a, b, turn: true });
  }
  return short;
}

function framedPieces(g, F) {
  if (!F || g.turn) return [g];
  const A = { x: g.a[0], y: g.a[1] }, B = { x: g.b[0], y: g.b[1] }, L = lineLen(g);
  const cuts = g.t === 'L' ? lineCuts(A, B, F) : arcCuts({ x: g.c[0], y: g.c[1] }, g.r, Math.atan2(g.a[1] - g.c[1], g.a[0] - g.c[0]), (g.left ? 1 : -1) * L / g.r, F);
  const out = [];
  for (let i = 1; i < cuts.length; i++) {
    const a = atPiece(g, cuts[i - 1] * L).p, b = atPiece(g, cuts[i] * L).p, m = atPiece(g, (cuts[i - 1] + cuts[i]) / 2 * L).p;
    if (dist(a, b) < 0.005) continue;
    out.push({ ...g, a, b, turn: m[0] < F.x0 - 1e-8 || m[0] > F.x1 + 1e-8 || m[1] < F.y0 - 1e-8 || m[1] > F.y1 + 1e-8 });
  }
  return out;
}

export function caranPlan(snapshot, rawPencils, rawOptions = {}, order = []) {
  const s = validateSnapshot(snapshot), o = settingsOf(rawOptions), map = colourMap(s, rawPencils, o.frame), { labels, pencils } = map;
  const geometry = sausageGuides(s, labels, o.spokes || o.squares);
  const squareCells = o.squares ? preserveSquares(s, map, geometry.owners, geometry.guides) : 0;
  const covered = new Uint8Array(labels.length), details = detailMap(s, labels, o), tracks = pencils.map(() => []), radius = o.nib / 2;
  const { owners, guides } = o.spokes ? geometry : { owners: new Int32Array(labels.length), guides: [] }, usedGuides = new Set();
  // Any tiny raster gaps left between guide lines keep the guide's direction
  // in the coverage pass instead of falling back to the surrounding rings.
  for (let at = 0; at < owners.length; at++) if (owners[at]) { const q = guides[owners[at] - 1]; details[at] = Math.abs(q.u[1]) >= Math.abs(q.u[0]) ? 1 : 2; }
  const cellAt = (x, y) => { const ix = Math.floor(x / s.h), iy = s.ny - 1 - Math.floor(y / s.h); return ix >= 0 && ix < s.nx && iy >= 0 && iy < s.ny ? iy * s.nx + ix : -1; };
  const mark = (x, y, k) => {
    const x0 = Math.max(0, Math.floor((x - radius) / s.h)), x1 = Math.min(s.nx - 1, Math.floor((x + radius) / s.h));
    const y0 = Math.max(0, Math.floor((y - radius) / s.h)), y1 = Math.min(s.ny - 1, Math.floor((y + radius) / s.h));
    for (let iy = y0; iy <= y1; iy++) for (let ix = x0; ix <= x1; ix++) {
      const at = (s.ny - 1 - iy) * s.nx + ix;
      if (labels[at] === k && Math.hypot((ix + 0.5) * s.h - x, (iy + 0.5) * s.h - y) <= radius + 1e-8) covered[at] = 1;
    }
  };
  const step = Math.min(s.h / 2, o.pitch / 3, 0.3), regions = regionsOf(s.settings?.rects ?? [], s.settings ?? {});
  let contourCount = 0, samples = 0;
  guides.forEach((q, guide) => {
    const width = q.radius * 2, N = Math.max(1, Math.ceil(width / Math.min(o.pitch, o.nib))), normal = [-q.u[1], q.u[0]];
    for (let j = 0; j < N; j++) {
      const offset = ((j + 0.5) / N - 0.5) * width, cap = Math.sqrt(Math.max(0, q.radius ** 2 - offset ** 2));
      const a = [q.a[0] - q.u[0] * cap + normal[0] * offset, q.a[1] - q.u[1] * cap + normal[1] * offset];
      const b = [q.b[0] + q.u[0] * cap + normal[0] * offset, q.b[1] + q.u[1] * cap + normal[1] * offset];
      const n = Math.max(1, Math.ceil(dist(a, b) / step)), list = [], pending = [];
      samples += n; if (samples > 12000000) throw new Error('The plan is too dense. Increase line spacing or select a smaller frame.');
      const point = t => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      let k0 = -1, begin = 0;
      for (let i = 0; i <= n; i++) {
        const p = i < n ? point((i + 0.5) / n) : null, at = p ? cellAt(...p) : -1;
        const k = at >= 0 && owners[at] === guide + 1 ? labels[at] : -1;
        if (i === 0) k0 = k;
        if (k !== k0 || i === n) {
          const g = { t: 'L', a: point(begin / n), b: point(i / n), spoke: true, guide };
          if (lineLen(g) >= 0.05) list.push({ k: k0, g }); begin = i; k0 = k;
        }
        if (k >= 0) pending.push([p[0], p[1], k]);
      }
      for (const k of new Set(list.filter(q => q.k >= 0).map(q => q.k))) {
        const first = list.findIndex(q => q.k === k), last = list.findLastIndex(q => q.k === k);
        tracks[k].push({ pieces: list.slice(first, last + 1).map(q => ({ ...q.g, turn: q.k !== k })), detail: false, spoke: true });
      }
      for (const p of pending) mark(...p);
    }
  });
  for (const R of regions) {
    const gap = Math.max(Math.abs(R.b.x0 - R.a.x0), Math.abs(R.b.x1 - R.a.x1), Math.abs(R.b.y0 - R.a.y0), Math.abs(R.b.y1 - R.a.y1));
    const N = Math.max(1, Math.ceil(gap / Math.min(o.pitch, o.nib)));
    if (N > 5000) throw new Error('The contour spacing is too dense.');
    for (let j = 0; j < N; j++) {
      const shape = shapeAt(R, (j + 0.5) / N), list = [], pending = [], needed = new Set();
      for (let p = 0; p < 8; p++) {
        const L = pieceLength(shape, p), n = Math.ceil(L / step);
        if (!n) continue;
        samples += n; if (samples > 12000000) throw new Error('The plan is too dense. Increase line spacing or select a smaller frame.');
        let k0 = -2, begin = 0;
        for (let i = 0; i <= n; i++) {
          const q = i < n ? pointOn(shape, p, (i + 0.5) / n) : null, at = q ? cellAt(...q) : -1;
          const k = at >= 0 && !details[at] ? labels[at] : -1;
          if (k >= 0 && !covered[at]) needed.add(k);
          if (i === 0) k0 = k;
          if (k !== k0 || i === n) { const g = segment(shape, p, begin / n, i / n); if (lineLen(g) >= 0.05) list.push({ k: k0, g }); begin = i; k0 = k; }
          if (k >= 0) pending.push([q[0], q[1], k]);
        }
      }
      // Already covered pixels of this SAME pencil do not punch thousands
      // of tiny lift holes into a long contour. A wholly covered contour is
      // skipped; a useful one remains continuous across its matching colour.
      for (const k of needed) { const path = trimOrbit(list, k); if (path.length) tracks[k].push({ pieces: path, detail: false }); }
      for (const q of pending) mark(...q);
      contourCount++;
    }
  }
  // Raster coverage is authoritative: fill every remaining target cell,
  // including isolated squares, narrow gaps and places outside the contours.
  // The line is sampled without averaging and never assigned a neighbour's hue.
  function scan(vertical, detailOnly) {
    const outer = vertical ? s.nx : s.ny, inner = vertical ? s.ny : s.nx;
    for (let a = 0; a < outer; a++) {
      const runs = []; let k0 = -1, begin = 0;
      for (let b = 0; b <= inner; b++) {
        const at = b < inner ? (vertical ? b * s.nx + a : a * s.nx + b) : -1;
        const eligible = at >= 0 && !covered[at] && (detailOnly ? details[at] === (vertical ? 1 : 2) : !details[at]);
        const k = eligible ? labels[at] : -1;
        if (k !== k0) { if (k0 >= 0) runs.push({ k: k0, begin, end: b }); k0 = k; begin = b; }
      }
      for (const q of runs) {
        const a0 = vertical ? [(a + 0.5) * s.h, (s.ny - q.end + 0.15) * s.h] : [(q.begin + 0.15) * s.h, (s.ny - a - 0.5) * s.h];
        const b0 = vertical ? [(a + 0.5) * s.h, (s.ny - q.begin - 0.15) * s.h] : [(q.end - 0.15) * s.h, (s.ny - a - 0.5) * s.h];
        if (o.frame) for (const p of [a0, b0]) { p[0] = clamp(p[0], o.frame.x0, o.frame.x1); p[1] = clamp(p[1], o.frame.y0, o.frame.y1); }
        const firstAt = vertical ? q.begin * s.nx + a : a * s.nx + q.begin;
        const g = { t: 'L', a: a0, b: b0, turn: false, ...(owners[firstAt] ? { spoke: true, guide: owners[firstAt] - 1 } : {}) };
        if (lineLen(g) < 0.05) continue;
        tracks[q.k].push({ pieces: [g], detail: true });
        const count = Math.ceil(lineLen(g) / step);
        for (let j = 0; j <= count; j++) mark(a0[0] + (b0[0] - a0[0]) * j / count, a0[1] + (b0[1] - a0[1]) * j / count, q.k);
      }
    }
  }
  scan(true, true); scan(false, true); scan(false, false);
  const ordered = pencils.map((p, i) => ({ p, i })).sort((a, b) => {
    const x = order.indexOf(a.p.id), y = order.indexOf(b.p.id);
    return (x < 0 ? 10000 : x) - (y < 0 ? 10000 : y) || labOf(linOf(b.p.hex))[0] - labOf(linOf(a.p.hex))[0];
  });
  const passes = []; let at = [0, 0];
  for (const { p, i } of ordered) {
    if (!tracks[i].length) continue;
    const detailCount = tracks[i].filter(t => t.detail).length, fine = [], route = [];
    // A long empty arc need not be flown on every neighbouring contour.
    // Split only lifted gaps, then visit nearby stretches together. Their
    // drawn geometry stays exactly the same and remains long contour strokes.
    for (const t of tracks[i]) {
      let pieces = [];
      for (const g of t.pieces) {
        if (g.turn && lineLen(g) > 8) { if (pieces.length) fine.push({ ...t, pieces }); pieces = []; }
        else pieces.push(g);
      }
      if (pieces.length) fine.push({ ...t, pieces });
    }
    function sameColour(a, b) {
      const L = dist(a, b);
      if (L > Math.max(o.nib, o.pitch) * 3) return false;
      const n = Math.max(1, Math.ceil(L / step));
      for (let j = 0; j <= n; j++) {
        const cell = cellAt(a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n);
        if (cell < 0 || labels[cell] !== i) return false;
      }
      return true;
    }
    function append(path) {
      if (dist(at, path.at(-1).b) < dist(at, path[0].a)) path = reverse(path);
      if (route.length && dist(at, path[0].a) >= 0.05) route.push({ t: 'L', a: at, b: path[0].a, turn: !sameColour(at, path[0].a) });
      route.push(...path); at = path.at(-1).b;
    }
    // Index both ends: the next perpendicular patch is local, not a jump
    // across a whole eight-millimetre strip. Work stays bounded on large maps.
    const cellSize = 4, cells = new Map(), taken = new Uint8Array(fine.length);
    fine.forEach((t, n) => { for (const p of [t.pieces[0].a, t.pieces.at(-1).b]) { const key = `${Math.floor(p[0] / cellSize)},${Math.floor(p[1] / cellSize)}`; if (!cells.has(key)) cells.set(key, []); cells.get(key).push(n); } });
    for (let left = fine.length; left > 0; left--) {
      const cx = Math.floor(at[0] / cellSize), cy = Math.floor(at[1] / cellSize);
      let best = -1, nearest = Infinity;
      for (let ring = 0; ring <= Math.ceil(Math.max(s.width, s.height) / cellSize) + 2; ring++) {
        for (let dx = -ring; dx <= ring; dx++) for (let dy = -ring; dy <= ring; dy++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
          for (const n of cells.get(`${cx + dx},${cy + dy}`) ?? []) if (!taken[n]) {
            const t = fine[n], L = Math.min(dist(at, t.pieces[0].a), dist(at, t.pieces.at(-1).b));
            if (L < nearest) { best = n; nearest = L; }
          }
        }
        if (best >= 0 && (ring - 1) * cellSize > nearest) break;
      }
      if (best < 0) throw new Error('Could not order the remaining detail paths.');
      taken[best] = 1; append(fine[best].pieces);
    }
    if (o.frame) { const clipped = route.flatMap(g => framedPieces(g, o.frame)); route.length = 0; route.push(...clipped); }
    // Exact frame clipping can leave a short lifted tail at either end.
    // A pencil change must finish on the last drawn point, never in that tail.
    while (route.length && route.at(-1).turn) route.pop();
    while (route.length && route[0].turn) route.shift();
    if (!route.length) continue;
    const once = route.slice();
    for (let c = 1; c < o.coats; c++) route.push(...(c % 2 ? reverse(once) : once));
    at = route.at(-1).b;
    let drawing = 0, air = 0, lifts = 0, spokeMM = 0, wasUp = false;
    for (const g of route) { if (g.turn) { air += lineLen(g); if (!wasUp) lifts++; } else { drawing += lineLen(g); if (g.spoke) { spokeMM += lineLen(g); usedGuides.add(g.guide); } } wasUp = !!g.turn; }
    passes.push({ pencil: p.id, index: i, strokes: [route], modules: tracks[i].length, mm: drawing, air, lifts, details: detailCount, spokeMM });
  }
  let target = 0, missing = 0;
  for (let i = 0; i < labels.length; i++) if (labels[i] >= 0) { target++; if (!covered[i]) missing++; }
  return { options: o, pencils, labels, counts: map.counts, colours: map.colours, passes, contourCount, target, missing, spokes: usedGuides.size, squareCells,
    spokeMM: passes.reduce((n, p) => n + p.spokeMM, 0),
    mm: passes.reduce((n, p) => n + p.mm, 0), air: passes.reduce((n, p) => n + p.air, 0), lifts: passes.reduce((n, p) => n + p.lifts, 0), details: passes.reduce((n, p) => n + p.details, 0) };
}

export function compileRun(plan, snapshot) {
  const s = validateSnapshot(snapshot), o = plan.options, base = s.settings ?? {}, R = reach();
  const here = { x: R.x.min + (base.edgeBottom ?? 0) + s.height / 2, y: R.y.min + (base.edgeLeft ?? 50) + s.width / 2 };
  const ps = [], info = [];
  plan.passes.forEach((P, k) => {
    const row = k + 1, route = P.strokes[0];
    ps.push(route.map((g, j) => ({ ...machinePiece(g, { cw: s.width, ch: s.height }), row, turn: !!g.turn, ...(j === route.length - 1 && k < plan.passes.length - 1 ? { tailOut: 0 } : {}) })));
    info.push({ label: `${row}/${plan.passes.length} · ${plan.pencils[P.index].name}`, pencil: P.pencil, pass: k, L: P.mm });
  });
  if (!ps.length) return { blocks: [], rows: [], seconds: 0, motionSeconds: 0, liftSeconds: 0, here, fault: '' };
  // A 0.05 mm landing is cut into shorter tail pieces by the shared planner.
  // Keep those line pieces; dropping half of every tiny landing accumulates
  // millimetres of missing detail. Rounded zero-length arcs are refused below.
  const result = plotRun({ ...RUN_DEFAULTS, here, rows: ps.length, speed: o.speed, travel: o.travel, ink: false, lift: true, snake: true, pause: false, tail: TAIL_MIN, minPiece: 0.005, hover: ELBOW_HOVER }, [{ key: 'CARAN', ps }]);
  const liftSeconds = plan.lifts * o.liftSeconds;
  return { ...result, blocks: withChanges(result.blocks, { info }, plan.pencils, plan.passes), rows: info, here,
    motionSeconds: result.seconds, liftSeconds, seconds: result.seconds + liftSeconds };
}

export function mapPixels(snapshot, plan, only = '') {
  const data = new Uint8ClampedArray(snapshot.data.length), rgb = plan.pencils.map(p => [1, 3, 5].map(i => parseInt(p.hex.slice(i, i + 2), 16)));
  for (let i = 0; i < plan.labels.length; i++) {
    const k = plan.labels[i], c = k >= 0 && (!only || plan.pencils[k].id === only) ? rgb[k] : GROUND;
    data.set([...c, 255], i * 4);
  }
  return data;
}
