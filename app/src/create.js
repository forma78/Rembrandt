// Rembrandt · Create — one curve over the reference, the layers built from it
// (Rembrandt.md §8). Never touches the hardware.
//
// Units as in RUBENS: the document is in pt, 1 pt = 25.4/72 mm, 1:1 with the
// machine. Its origin is the top left corner of the image area, the
// machine's reach between the walls (§0): x across the picture (the
// machine's Y), y down the picture (the machine's X, from the top wall). The
// canvas is a window in the image area. The curve is lines (L) and arcs (A)
// only; drawing it is RUBENS's Gesture, Pen and Select, for one curve.

import { PT_MM, FORMATS, HOLD_MS } from './config.js';
import { clamp, P, sub, add, len, dist, TAU, fmt } from './util.js';
import { segStart, segEnd, segDirEnd, tangentArc, anchorsOf, applyAnchorMove, pathD } from './geometry.js';
import { makeLine, snapArc, fitSegment, pushSeg } from './gesture.js';
import { filleted } from './fillet.js';
import { reach } from './machine.js';
import { simplify } from './svg.js';
import { segNumbers, setSegNumbers, scaleCurve, curveInfo, nearestSeg, buildCurve, moveSegBy } from './curve.js';
import { inventory, setInventory, addTube, moveTube, removeTube, tubeOf, defaultLayers, layersFrom, runOrder, labOf, oklab, lightness, readEnds, writeEnds } from './tubes.js';
import { toLin } from './color.js';
import { buildLanes, paintLanes, steepest, pathLength, pointAlong } from './bands.js';
import { dropPlan } from './drops.js';
import { readPaint } from './adjust.js';
import { brushOutline } from './layers.js';
import { themeColor } from './lamp.js';
import './ui.js';

const $ = s => document.querySelector(s);
const pt = mm => mm / PT_MM;

// ---------- the image area, and the canvas on it ----------
const R = reach();
const IA = { w: R.y.max - R.y.min, h: R.x.max - R.x.min };   // mm, 568.5 × 865 now
// Until the Calibration tab records a canvas of this format, it lies across
// the middle, its top 50 mm under the top wall (the owner, 2026-10-01: the
// brush runs past the top of the canvas by about 5 cm).
const TOP_GAP = 50;
const CREATE_FORMATS = ['c40x30', 'c40x60', 'c50x70', 'p60x80'];   // 70 × 100 is out of reach (the owner, 2026-10-01); 40 × 30 and 40 × 60 since 2026-10-02

let CAL = null;
async function loadCal() {
  try { const r = await fetch('/calibration', { cache: 'no-store' }); CAL = r.ok ? await r.json() : null; } catch { CAL = null; }
  layout();
}
// The canvas in the image area, mm.
function canvasRect() {
  const F = FORMATS[S.format];
  const cs = CAL && CAL.format === S.format && CAL.corners
    ? Object.values(CAL.corners).filter(c => c && Number.isFinite(c.x) && Number.isFinite(c.y)) : [];
  if (cs.length === 4) {
    const xs = cs.map(c => c.x), ys = cs.map(c => c.y);
    return { x: Math.min(...ys) - R.y.min, y: R.x.max - Math.max(...xs), w: Math.max(...ys) - Math.min(...ys), h: Math.max(...xs) - Math.min(...xs), cal: true };
  }
  return { x: (IA.w - F.w) / 2, y: TOP_GAP, w: F.w, h: F.h, cal: false };
}

// ---------- state ----------
const S = {
  format: 'c50x70',
  curve: { id: 'curve', segs: [], style: { weight: 0 } },   // weight 0: filleted() rounds kinks with the inner radius alone
  cornerR: 10,
  layers: defaultLayers(),
  layer: 4,      // the layers shown: up to this one
  tool: 'gesture', penArc: false, angleSnap: 15,
  sel: false, selSeg: null, selAnchors: [],
  view: { reference: true, lanes: true, drops: true, reach: true, grid: false },
  refOpacity: 45,
  pitch: 8,       // mm between the lines' centres: 8, edge to edge with 8 mm lines (Sonnet, 2026-10-01)
  ends: readEnds(localStorage),   // per layer, shared with the Adjustments tab: 'tails' or 'round'
};
let PAINT = readPaint(localStorage);   // est., from the Adjustments tab
let REF = null;   // { img, name }

// The curve of IMG_9422, measured on the picture laid over the image area:
// in from the left edge 415 mm down, the dip 640 mm down at 345 mm across,
// out at the right edge 572 mm down. Two lines and one arc.
const defaultCurve = () => buildCurve(P(0, pt(415)), 42, [['L', pt(241.2)], ['T', pt(247.8), 63], ['L', pt(144.3)]]);

// ---------- screen ----------
const paintCv = $('#paint'), wireCv = $('#wire'), board = $('#board'), stage = $('#stage');
const pctx = paintCv.getContext('2d'), wctx = wireCv.getContext('2d');
let kMm = 1, dpr = 1, V = { x: 0, y: 0, w: 1, h: 1 };   // css px per mm; the view in mm
const kPt = () => kMm * PT_MM;                          // css px per pt
const mmR = (x, y, w, h) => [(x - V.x) * kMm, (y - V.y) * kMm, w * kMm, h * kMm];
const toScr = q => P((q.x * PT_MM - V.x) * kMm, (q.y * PT_MM - V.y) * kMm);
const scrT = c => c.setTransform(dpr, 0, 0, dpr, 0, 0);
const docT = c => c.setTransform(dpr * kPt(), 0, 0, dpr * kPt(), -V.x * kMm * dpr, -V.y * kMm * dpr);

function layout() {
  const cr = canvasRect(), M = 18;
  const x0 = Math.min(0, cr.x) - M, y0 = Math.min(0, cr.y) - M;
  const x1 = Math.max(IA.w, cr.x + cr.w) + M, y1 = Math.max(IA.h, cr.y + cr.h) + M;
  V = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  const r = stage.getBoundingClientRect(), m = 26;
  kMm = Math.max(0.05, Math.min((r.width - 2 * m) / V.w, (r.height - 2 * m) / V.h));
  dpr = window.devicePixelRatio || 1;
  const w = Math.round(V.w * kMm), h = Math.round(V.h * kMm);
  board.style.width = w + 'px'; board.style.height = h + 'px';
  for (const c of [paintCv, wireCv]) { c.style.width = w + 'px'; c.style.height = h + 'px'; c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
  invalidate();
}
let dirty = true, rafOn = false;
function invalidate() { dirty = true; kick(); }
function kick() { if (!rafOn) { rafOn = true; requestAnimationFrame(frame); } }
function frame() {
  rafOn = false;
  if (dirty) { dirty = false; drawPaint(pctx, paintCv.width / dpr, paintCv.height / dpr); updatePanel(); save(); }
  if (G) holdTick();
  drawWire();
  if (G) kick();
}

// ---------- the paint layer: the image area, the reference, the canvas ----------
function hatch(c, W, H) {
  c.strokeStyle = 'rgba(179,71,12,.3)'; c.lineWidth = 1;
  for (let d = -H; d < W; d += 7) { c.beginPath(); c.moveTo(d, H); c.lineTo(d + H, 0); c.stroke(); }
}
function drawRef(c) {
  if (!REF || !S.view.reference) return;
  const img = REF.img, s = Math.max(IA.w / img.naturalWidth, IA.h / img.naturalHeight);   // cover the image area
  const w = img.naturalWidth * s, h = img.naturalHeight * s;
  c.save();
  c.beginPath(); c.rect(...mmR(0, 0, IA.w, IA.h)); c.clip();
  c.globalAlpha = S.refOpacity / 100;
  c.drawImage(img, ...mmR((IA.w - w) / 2, (IA.h - h) / 2, w, h));
  c.restore();
}
function drawPaint(c, W, H) {
  scrT(c);
  c.clearRect(0, 0, W, H);
  c.fillStyle = themeColor('--table', '#D9D4CA'); c.fillRect(0, 0, W, H);   // the table, dark by night
  const ia = mmR(0, 0, IA.w, IA.h), cr = canvasRect(), win = mmR(cr.x, cr.y, cr.w, cr.h);
  c.fillStyle = '#F2F0EB'; c.fillRect(...ia);                           // the canvas underneath, in the image area
  c.fillStyle = '#FCFBF8'; c.fillRect(...win);                          // the canvas
  drawRef(c);
  if (S.curve.segs.length && (S.view.lanes || S.view.drops) && !busy()) drawPlan(c);
  c.save();                                                             // past the canvas: a veil
  c.beginPath(); c.rect(...ia); c.rect(...win); c.clip('evenodd');
  c.fillStyle = themeColor('--veil', 'rgba(217,212,202,.55)'); c.fillRect(...ia);
  c.restore();
  c.save(); c.shadowColor = 'rgba(40,30,20,.18)'; c.shadowBlur = 10; c.shadowOffsetY = 2;
  c.strokeStyle = 'rgba(36,34,31,.85)'; c.lineWidth = 1; c.strokeRect(win[0] + .5, win[1] + .5, win[2] - 1, win[3] - 1);
  c.restore();
  if (S.view.grid) drawGrid(c);
  if (S.view.reach) {
    c.save();                                                           // the canvas past the walls: out of reach
    c.beginPath(); c.rect(...win); c.clip();
    c.beginPath(); c.rect(0, 0, W, H); c.rect(...ia); c.clip('evenodd');
    hatch(c, W, H);
    c.restore();
    c.save(); c.strokeStyle = '#EB7A25'; c.lineWidth = 1.2; c.setLineDash([6, 4]);
    c.strokeRect(ia[0], ia[1], ia[2], ia[3]); c.restore();
    c.font = '10px ' + getComputedStyle(document.body).getPropertyValue('--mono');
    c.fillStyle = '#B3470C';
    c.fillText(`walls · image area ${fmt(IA.w, 1)} × ${fmt(IA.h, 0)} mm`, ia[0] + 2, ia[1] - 5);
  }
}
function drawGrid(c) {
  c.save(); c.beginPath(); c.rect(...mmR(0, 0, IA.w, IA.h)); c.clip(); c.lineWidth = 1;
  for (let i = 0, x = 0; x <= IA.w; i++, x += 10) { c.strokeStyle = i % 10 ? 'rgba(61,107,255,.08)' : 'rgba(61,107,255,.22)'; const X = Math.round((x - V.x) * kMm) + .5; c.beginPath(); c.moveTo(X, (0 - V.y) * kMm); c.lineTo(X, (IA.h - V.y) * kMm); c.stroke(); }
  for (let i = 0, y = 0; y <= IA.h; i++, y += 10) { c.strokeStyle = i % 10 ? 'rgba(61,107,255,.08)' : 'rgba(61,107,255,.22)'; const Y = Math.round((y - V.y) * kMm) + .5; c.beginPath(); c.moveTo((0 - V.x) * kMm, Y); c.lineTo((IA.w - V.x) * kMm, Y); c.stroke(); }
  c.restore();
}

// ---------- the lines and the drops (Rembrandt.md §3, §5) ----------
// The reference read at 2 mm a pixel over the image area, in OKLab: the lines
// take their paint from it (bands.js).
let SAMPLER = null;
function makeSampler() {
  SAMPLER = null; if (!REF) return;
  const img = REF.img, px = 2, w = Math.ceil(IA.w / px), h = Math.ceil(IA.h / px);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const c = cv.getContext('2d', { willReadFrequently: true });
  const s = Math.max(IA.w / img.naturalWidth, IA.h / img.naturalHeight), iw = img.naturalWidth * s, ih = img.naturalHeight * s;
  c.drawImage(img, (IA.w - iw) / 2 / px, (IA.h - ih) / 2 / px, iw / px, ih / px);
  const d = c.getImageData(0, 0, w, h).data, lab = new Float32Array(w * h * 3);
  for (let i = 0; i < w * h; i++) {
    const o = oklab([toLin(d[4 * i] / 255), toLin(d[4 * i + 1] / 255), toLin(d[4 * i + 2] / 255)]);
    lab[3 * i] = o[0]; lab[3 * i + 1] = o[1]; lab[3 * i + 2] = o[2];
  }
  SAMPLER = (x, y) => {
    const X = Math.floor(x * PT_MM / px), Y = Math.floor(y * PT_MM / px);
    if (X < 0 || Y < 0 || X >= w || Y >= h) return null;
    const i = 3 * (Y * w + X); return [lab[i], lab[i + 1], lab[i + 2]];
  };
}
// While a point or the curve is being dragged the plan waits for the release.
const busy = () => !!(AD || DRAG || G || PEN);
const layerOf = (side, id) => S.layers.find(l => l.side === side && l.tubes.includes(id))?.n ?? null;
const lightOf = id => lightness(tubeOf(id)?.hex || '#808080');
let PLAN = null, planKey = '';
function plan() {
  const key = JSON.stringify([S.curve.segs, S.cornerR, S.pitch, S.layers.map(l => [l.side, l.tubes]), REF?.name, !!SAMPLER, PAINT, inventory().map(t => t.hex)]);
  if (key === planKey && PLAN) return PLAN;
  planKey = key;
  const segs = S.curve.segs.length ? filleted(S.curve, S.cornerR).segs : [];
  const lanes = buildLanes(segs, { pitch: pt(S.pitch), area: { x0: 0, y0: 0, x1: pt(IA.w), y1: pt(IA.h) } });
  let runs = [], drops = null;
  if (SAMPLER && lanes.length) {
    const tubes = {};
    for (const side of ['below', 'above']) tubes[side] = [...new Set(S.layers.filter(l => l.side === side).flatMap(l => l.tubes))].map(tubeOf).filter(Boolean).map(t => ({ id: t.id, lab: labOf(t.hex) }));
    runs = paintLanes(lanes, { sample: SAMPLER, tubes, step: pt(4), minRun: pt(24), bucket: pt(5), lightness: lightOf, guard: pt(12) });
    for (const r of runs) { r.layer = layerOf(r.side, r.tube); r.pts = ptsOf(r.segs); }
    runs.sort((a, b) => a.layer - b.layer || lightOf(b.tube) - lightOf(a.tube));   // layer by layer, the lighter first
    drops = dropPlan(runs, PAINT, { pitch: pt(S.pitch), near: pt(40), lightness: lightOf });
    for (const d of drops.drops) d.layer = layerOf(d.side, d.tube);
  }
  const length = lanes.reduce((a, l) => a + l.pieces.reduce((b, p) => b + pathLength(p), 0), 0) * PT_MM;   // mm
  PLAN = { lanes, runs, drops, length, steep: segs.length ? steepest(segs) : 0 };
  return PLAN;
}
function ptsOf(segs) {
  const L = pathLength(segs), n = Math.max(2, Math.ceil(L * PT_MM / 2));
  return Array.from({ length: n + 1 }, (_, i) => { const q = pointAlong(segs, L * i / n); return { x: q.x, y: q.y }; });
}
const endsOf = n => S.ends[n] || 'tails';
// The lines as the brush leaves them: from the home, thinning into the tail
// where the run meets another paint; at the edge of the image area the brush
// goes out at full width (the lift is past the canvas). Up to the chosen layer.
function drawPlan(c) {
  const P_ = plan(), W = pt(PAINT.line), tail = pt(PAINT.tail);
  if (S.view.lanes) {
    if (!P_.runs.length) {
      c.strokeStyle = 'rgba(36,34,31,.25)'; c.lineWidth = 0.8;
      for (const l of P_.lanes) for (const p of l.pieces) { pathOf(c, p); c.stroke(); }
    } else for (const r of P_.runs) {
      if (r.layer === null || r.layer > S.layer) continue;
      const hex = tubeOf(r.tube).hex;
      if (endsOf(r.layer) === 'round') {
        pathOf(c, r.segs); c.strokeStyle = hex; c.lineWidth = W * kPt(); c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke();
      } else {
        const o = brushOutline(r.pts, W, r.home, r.tailAtEdge ? 0 : tail);
        c.beginPath(); c.save(); docT(c); o.forEach((q, i) => i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y)); c.closePath(); c.restore();
        c.fillStyle = hex; c.fill();
      }
    }
  }
  if (S.view.drops && P_.drops) {
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (const d of P_.drops.drops) {
      if (d.layer > S.layer) continue;
      c.beginPath(); c.save(); docT(c); c.moveTo(d.a.x, d.a.y); c.lineTo(d.b.x, d.b.y); c.restore();
      c.strokeStyle = 'rgba(36,34,31,.85)'; c.lineWidth = PAINT.nozzle * kMm + 2.4; c.stroke();
      c.strokeStyle = tubeOf(d.tube).hex; c.lineWidth = PAINT.nozzle * kMm; c.stroke();
    }
  }
}

// ---------- the wire layer: the curve, its points, the tools ----------
function tracePath(c, segs) {
  let first = true;
  for (const g of segs) {
    const a = segStart(g);
    if (first) { c.moveTo(a.x, a.y); first = false; }
    if (g.t === 'L') c.lineTo(g.b.x, g.b.y);
    else c.arc(g.c.x, g.c.y, g.r, g.a0, g.a0 + g.s, g.s < 0);
  }
}
function pathOf(c, segs) { c.beginPath(); c.save(); docT(c); tracePath(c, segs); c.restore(); }
function drawCurve(c) {
  const segs = S.curve.segs; if (!segs.length) return;
  const f = filleted(S.curve, S.cornerR);
  pathOf(c, f.segs); c.strokeStyle = '#24221F'; c.lineWidth = 1.8; c.lineJoin = 'round'; c.stroke();
  for (const q of f.warn) {                                             // the rounding does not fit here
    const s = toScr(q);
    c.beginPath(); c.arc(s.x, s.y, 13, 0, TAU); c.strokeStyle = '#D9481C'; c.lineWidth = 2; c.setLineDash([3, 3]); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#D9481C'; c.font = '600 11px ' + getComputedStyle(document.body).getPropertyValue('--sans');
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('!', s.x, s.y); c.textAlign = 'start'; c.textBaseline = 'alphabetic';
  }
}
function drawWire() {
  const c = wctx; scrT(c);
  c.clearRect(0, 0, wireCv.width, wireCv.height);
  drawCurve(c);
  const segs = S.curve.segs;
  if (S.sel && segs.length) {
    pathOf(c, segs); c.strokeStyle = 'rgba(61,107,255,.7)'; c.lineWidth = 1; c.stroke();
    if (S.selSeg !== null && segs[S.selSeg]) { pathOf(c, [segs[S.selSeg]]); c.strokeStyle = '#EB7A25'; c.lineWidth = 3; c.stroke(); }
    anchorsOf(S.curve).forEach((q, i) => {
      const s = toScr(q), on = S.selAnchors.includes(i), h = on ? 4 : 3;
      c.fillStyle = on ? '#3D6BFF' : '#fff'; c.strokeStyle = '#3D6BFF'; c.lineWidth = 1;
      c.fillRect(s.x - h, s.y - h, 2 * h, 2 * h); c.strokeRect(s.x - h, s.y - h, 2 * h, 2 * h);
    });
  }
  const act = G || PEN;
  if (act) {
    const a = toScr(act.anchor);
    c.fillStyle = '#EB7A25'; c.fillRect(a.x - 3.5, a.y - 3.5, 7, 7);
    if (G && G.raw.length > 1) {
      c.beginPath(); G.raw.forEach((q, i) => { const s = toScr(q); i ? c.lineTo(s.x, s.y) : c.moveTo(s.x, s.y); });
      c.strokeStyle = 'rgba(36,34,31,.35)'; c.lineWidth = 1; c.setLineDash([2, 3]); c.stroke(); c.setLineDash([]);
    }
    if (act.prov) {
      pathOf(c, [act.prov]); c.strokeStyle = '#EB7A25'; c.lineWidth = 1.6; c.setLineDash([6, 4]); c.stroke(); c.setLineDash([]);
      const e = toScr(segEnd(act.prov)), label = segLabel(act.prov);
      c.font = '11px ' + getComputedStyle(document.body).getPropertyValue('--mono');
      const tw = c.measureText(label).width;
      c.fillStyle = 'rgba(36,34,31,.85)'; c.fillRect(e.x + 12, e.y + 10, tw + 12, 19);
      c.fillStyle = '#fff'; c.fillText(label, e.x + 18, e.y + 23);
    }
    if (G && G.cursor && G.holdFrac > 0) {
      const q = toScr(G.cursor); c.beginPath(); c.arc(q.x, q.y, 11, -Math.PI / 2, -Math.PI / 2 + TAU * G.holdFrac);
      c.strokeStyle = '#EB7A25'; c.lineWidth = 2.5; c.stroke();
    }
  }
}
function segLabel(g) {
  const n = segNumbers(g);
  return g.t === 'L' ? `Line ${fmt(n.angle, 0)}° · ${fmt(n.length * PT_MM / 10, 1)} cm` : `Arc ${fmt(n.sweep, 0)}° · r ${fmt(n.radius * PT_MM / 10, 1)} cm`;
}

// ---------- input ----------
function evPt(e) { const r = wireCv.getBoundingClientRect(); return P(((e.clientX - r.left) / kMm + V.x) / PT_MM, ((e.clientY - r.top) / kMm + V.y) / PT_MM); }
const tol = () => 5 / kPt();

let undoStack = [], redoStack = [];
const snapshot = () => JSON.stringify({ segs: S.curve.segs, cornerR: S.cornerR, layers: S.layers, tubes: inventory() });
function undoPush() { undoStack.push(snapshot()); if (undoStack.length > 200) undoStack.shift(); redoStack = []; }
let lastSoft = 0;
function undoPushSoft() { const t = performance.now(); if (t - lastSoft > 700) undoPush(); lastSoft = t; }
function restore(js) {
  const o = JSON.parse(js);
  S.curve.segs = o.segs; S.cornerR = o.cornerR; S.layers = o.layers;
  if (o.tubes && JSON.stringify(o.tubes) !== JSON.stringify(inventory())) { setInventory(o.tubes); saveTubes(); }
  if (S.selSeg !== null && S.selSeg >= S.curve.segs.length) S.selSeg = null;
  S.selAnchors = S.selAnchors.filter(i => i <= S.curve.segs.length);
  invalidate();
}
function undo() { finishAll(); if (!undoStack.length) return; redoStack.push(snapshot()); restore(undoStack.pop()); }
function redo() { if (!redoStack.length) return; undoStack.push(snapshot()); restore(redoStack.pop()); }

// A drawing tool starts a new curve — or goes on from the end of this one
// when it starts on that end. One curve per painting (§0).
function startCurve(q) {
  const segs = S.curve.segs, last = segs[segs.length - 1];
  if (last && dist(q, segEnd(last)) * kPt() < 10) return { anchor: segEnd(last), tan: segDirEnd(last) };
  S.curve.segs = [];
  return { anchor: q, tan: null };
}
// Nothing drawn after all: the curve as it was.
function nothingDrawn() { const was = undoStack.pop(); if (was) restore(was); }

let G = null;   // gesture: drag slowly, stop — it straightens (RUBENS)
function gDown(e, q) {
  undoPush();
  const st = startCurve(q);
  S.sel = false; S.selSeg = null; S.selAnchors = [];
  G = { anchor: st.anchor, tan: st.tan, raw: [st.anchor], stillPt: q, stillAt: performance.now(), prov: null, cursor: q, holdFrac: 0, mode: null, added: 0 };
  invalidate();
}
function gMove(e, q) {
  G.mode = e.shiftKey ? 'line' : e.altKey ? 'arc' : null;
  G.cursor = q;
  if (dist(q, G.raw[G.raw.length - 1]) > 0.5 / kPt()) G.raw.push(q);
  if (dist(q, G.stillPt) > 3 / kPt()) { G.stillPt = q; G.stillAt = performance.now(); }
  G.prov = fitSegment(G.raw, G.anchor, G.tan, G.mode, tol(), S.angleSnap);
  kick();
}
function holdTick() {
  if (!G.prov) { G.holdFrac = 0; return; }
  const t = performance.now() - G.stillAt;
  G.holdFrac = clamp(t / HOLD_MS, 0, 1);
  if (t >= HOLD_MS) gCommit();
}
function gCommit() {
  const g = G.prov; if (!g) return;
  pushSeg(S.curve, g); G.added++;
  G.anchor = segEnd(g); G.tan = segDirEnd(g);
  G.raw = [G.anchor]; G.prov = null; G.holdFrac = 0; G.stillAt = Infinity;
  invalidate();
}
function gUp() {
  if (!G) return;
  if (G.prov) gCommit();
  const added = G.added; G = null;
  if (!added) nothingDrawn();
  invalidate();
}

let PEN = null;  // pen: click — a point; A or Alt — a tangent arc (RUBENS)
function penSeg(q, e) {
  if ((S.penArc !== !!e.altKey) && PEN.tan) { const g = tangentArc(PEN.anchor, PEN.tan, q); if (g) return snapArc(g); }
  if (dist(q, PEN.anchor) < tol()) return null;
  return makeLine(PEN.anchor, q, PEN.tan, S.angleSnap);
}
function penDown(e, q) {
  if (!PEN) {
    undoPush();
    const st = startCurve(q);
    S.sel = false; S.selSeg = null; S.selAnchors = [];
    PEN = { anchor: st.anchor, tan: st.tan, prov: null, added: 0 };
    invalidate(); return;
  }
  const g = penSeg(q, e); if (!g) return;
  pushSeg(S.curve, g); PEN.added++;
  PEN.anchor = segEnd(g); PEN.tan = segDirEnd(g); PEN.prov = null;
  invalidate();
}
function penMove(e, q) { if (!PEN) return; PEN.prov = penSeg(q, e); kick(); }
function penFinish() {
  if (!PEN) return;
  const added = PEN.added; PEN = null;
  if (!added) nothingDrawn();
  invalidate();
}
function finishAll() { gUp(); penFinish(); }

let DRAG = null;  // the whole curve
function selDown(e, q) {
  const i = nearestSeg(S.curve.segs, q, 6 / kPt());
  S.sel = i !== null; S.selSeg = i; S.selAnchors = [];
  if (i !== null) { undoPush(); DRAG = { last: q, moved: false }; }
  invalidate();
}
function selMove(e, q) {
  if (!DRAG) return;
  const d = sub(q, DRAG.last); DRAG.last = q; DRAG.moved = true;
  S.curve.segs = S.curve.segs.map(g => moveSegBy(g, d)); invalidate();
}
function selUp() { if (DRAG && !DRAG.moved) undoStack.pop(); DRAG = null; }

let AD = null;    // one point, or several with Shift (RUBENS's anchor editing)
function anchorHit(q) {
  if (!S.sel) return null;
  let best = null, bd = 7 / kPt();
  anchorsOf(S.curve).forEach((a, i) => { const d = dist(a, q); if (d < bd) { bd = d; best = i; } });
  return best;
}
function anchorDown(e, i) {
  if (e.shiftKey) {
    const k = S.selAnchors.indexOf(i);
    if (k >= 0) { S.selAnchors.splice(k, 1); kick(); return; }
    S.selAnchors.push(i);
  } else if (!S.selAnchors.includes(i)) S.selAnchors = [i];
  undoPush();
  AD = { orig: JSON.parse(JSON.stringify(S.curve.segs)), start: anchorsOf(S.curve)[i], from: null, moved: false };
  kick();
}
function anchorMove(e, q) {
  if (!AD.from) AD.from = q;
  const delta = sub(add(AD.start, sub(q, AD.from)), AD.start);
  if (!AD.moved && len(delta) * kPt() < 1) return;
  AD.moved = true;
  applyAnchorMove(S.curve, AD.orig, S.selAnchors, delta);
  invalidate();
}
function anchorUp() { if (AD && !AD.moved) undoStack.pop(); AD = null; }
function nudgeAnchors(dx, dy) {
  if (!S.selAnchors.length) return;
  undoPushSoft();
  applyAnchorMove(S.curve, JSON.parse(JSON.stringify(S.curve.segs)), S.selAnchors, P(dx, dy));
  invalidate();
}

wireCv.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  wireCv.setPointerCapture(e.pointerId);
  const q = evPt(e);
  if (!G && !PEN) { const i = anchorHit(q); if (i !== null) { anchorDown(e, i); return; } }
  if (S.selAnchors.length) { S.selAnchors = []; kick(); }
  if (S.tool === 'gesture') gDown(e, q);
  else if (S.tool === 'pen') penDown(e, q);
  else selDown(e, q);
});
wireCv.addEventListener('pointermove', e => {
  const q = evPt(e), mm = P(q.x * PT_MM, q.y * PT_MM);
  // the machine's own axes, as on the Calibration tab
  $('#coords').textContent = `Y ${fmt(mm.x + R.y.min, 1)} · X ${fmt(R.x.max - mm.y, 1)} mm`;
  if (AD) { anchorMove(e, q); return; }
  wireCv.style.cursor = (!G && !PEN && anchorHit(q) !== null) ? 'move' : '';
  if (S.tool === 'gesture' && G) gMove(e, q);
  else if (S.tool === 'pen') penMove(e, q);
  else if (S.tool === 'select') selMove(e, q);
});
wireCv.addEventListener('pointerup', () => { if (AD) { anchorUp(); invalidate(); return; } if (S.tool === 'gesture') gUp(); if (S.tool === 'select') selUp(); invalidate(); });
wireCv.addEventListener('dblclick', () => { if (S.tool === 'pen') penFinish(); });
wireCv.addEventListener('pointerleave', () => { $('#coords').textContent = ''; });

window.addEventListener('keydown', e => {
  if (e.target.matches('input,select,textarea')) return;
  const cmd = e.metaKey || e.ctrlKey;
  if (cmd && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (cmd) return;
  const k = e.key.toLowerCase();
  if (k === 'g') setTool('gesture');
  else if (k === 'p') setTool('pen');
  else if (k === 'v') setTool('select');
  else if (k === 'a') { S.penArc = !S.penArc; syncTools(); if (PEN) kick(); }
  else if (e.key.startsWith('Arrow') && S.selAnchors.length) {
    e.preventDefault();
    const st = pt(e.shiftKey ? 10 : 1), v = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    nudgeAnchors(v[0] * st, v[1] * st);
  }
  else if (e.key === 'Escape' && S.selAnchors.length) { S.selAnchors = []; kick(); }
  else if (e.key === 'Enter' || e.key === 'Escape') { penFinish(); if (e.key === 'Escape') { S.sel = false; S.selSeg = null; invalidate(); } }
  else if ((e.key === 'Backspace' || e.key === 'Delete') && S.sel && !G && !PEN) deleteCurve();
});

// ---------- tools and view ----------
const HINTS = {
  gesture: 'Gesture — press and drag slowly. Hold still ~0.35 s and the segment snaps to a straight line or a clean arc. Start on the end of the curve to go on with it. Shift = line only, Alt = arc only.',
  pen: 'Pen — click to place points (straight segments). Alt-click or press A for a tangent arc. Double-click or Enter to finish.',
  select: 'Select — click the curve to pick a segment and type its numbers in the panel; drag to move the curve. Click a square to move one point, Shift-click to add more. Arrows nudge 1 mm (Shift 10 mm).',
};
function setTool(t) { finishAll(); S.tool = t; syncTools(); }
function syncTools() {
  document.querySelectorAll('.tool[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === S.tool));
  $('#btnArc').classList.toggle('armed', S.penArc);
  stage.className = 'stage t-' + S.tool;
  $('#hint').textContent = HINTS[S.tool];
}
function syncView() { document.querySelectorAll('.tog').forEach(b => b.classList.toggle('on', !!S.view[b.dataset.view])); }
function deleteCurve() { if (!S.curve.segs.length) return; finishAll(); undoPush(); S.curve.segs = []; S.sel = false; S.selSeg = null; S.selAnchors = []; invalidate(); }
document.querySelectorAll('.tool[data-tool]').forEach(b => b.onclick = () => setTool(b.dataset.tool));
document.querySelectorAll('.tog').forEach(b => b.onclick = () => { if (b.disabled) return; S.view[b.dataset.view] = !S.view[b.dataset.view]; syncView(); invalidate(); });
$('#btnArc').onclick = () => { S.penArc = !S.penArc; syncTools(); };
$('#btnUndo').onclick = undo; $('#btnRedo').onclick = redo;
$('#btnDel').onclick = deleteCurve;
$('#btnClear').onclick = deleteCurve;
$('#btnDefault').onclick = () => { finishAll(); undoPush(); S.curve.segs = defaultCurve(); S.sel = false; S.selSeg = null; invalidate(); };
$('#format').innerHTML = CREATE_FORMATS.map(k => `<option value="${k}">${FORMATS[k].label}</option>`).join('');
$('#format').onchange = e => { S.format = e.target.value; layout(); };
$('#btnJob').onclick = () => { finishAll(); saveNow(); location.href = 'job.html'; };

// ---------- the panel ----------
// The reference: an image under the canvas, covering the image area (§9).
// Kept in this browser, smaller: 2000 px on its long side.
function setRef(src, name, store) {
  const img = new Image();
  img.onload = () => {
    REF = { img, name };
    makeSampler();
    if (store) {
      const k = Math.min(1, 2000 / Math.max(img.naturalWidth, img.naturalHeight));
      const cv = document.createElement('canvas'); cv.width = Math.round(img.naturalWidth * k); cv.height = Math.round(img.naturalHeight * k);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      try { localStorage.setItem('rembrandt.ref', JSON.stringify({ name, src: cv.toDataURL('image/jpeg', 0.9) })); } catch { }
    }
    syncRef(); invalidate();
  };
  img.src = src;
}
function syncRef() {
  $('#refThumb').innerHTML = REF ? `<img src="${REF.img.src}" alt="">` : '<span>no reference yet</span>';
  $('#refThumb').title = REF ? REF.name : '';
  $('#refOp').value = S.refOpacity;
  $('#refRead').innerHTML = REF ? `${REF.name} · <b>${S.refOpacity} %</b>` : 'Under the canvas, over the whole image area.';
}
$('#btnRef').onclick = () => $('#refIn').click();
$('#refIn').onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  const rd = new FileReader(); rd.onload = () => setRef(rd.result, f.name, true); rd.readAsDataURL(f);
  e.target.value = '';
};
$('#refOp').oninput = e => { S.refOpacity = +e.target.value; syncRef(); invalidate(); };

// The curve: every number can be typed (the owner, 2026-10-01).
const num = (v, d) => (+v).toFixed(d).replace(/\.0+$/, '');
const setIf = (id, v) => { const el = $(id); if (el && document.activeElement !== el) el.value = v; };
function updatePanel() {
  const segs = S.curve.segs, info = curveInfo(segs);
  $('#cSegs').textContent = segs.length ? `${segs.length} · ${[info.lines && `${info.lines} line${info.lines > 1 ? 's' : ''}`, info.arcs && `${info.arcs} arc${info.arcs > 1 ? 's' : ''}`].filter(Boolean).join(' + ')}` : '—';
  setIf('#cLen', segs.length ? num(info.length * PT_MM / 10, 1) : '');
  $('#cLen').disabled = !segs.length;
  setIf('#cR', S.cornerR);
  const box = $('#segBox'), g = S.selSeg !== null ? segs[S.selSeg] : null;
  if (!g) box.innerHTML = `<p class="none">${segs.length ? 'Pick a segment with Select (V) to type its numbers.' : 'Draw the curve: Gesture (G) or Pen (P). The house opens the curve of IMG_9422.'}</p>`;
  else {
    const n = segNumbers(g), head = `<h4>Segment ${S.selSeg + 1} of ${segs.length} · ${g.t === 'L' ? 'line' : 'arc'}</h4>`;
    const want = box.dataset.seg !== `${S.selSeg}:${g.t}`;
    if (want) {
      box.dataset.seg = `${S.selSeg}:${g.t}`;
      box.innerHTML = head + (g.t === 'L'
        ? `<table><tr><td>Length</td><td class="r"><input data-k="length" type="number" step="1" min="1"> mm</td></tr>
           <tr><td>Angle</td><td class="r"><input data-k="angle" type="number" step="1"> °</td></tr></table>`
        : `<table><tr><td>Radius</td><td class="r"><input data-k="radius" type="number" step="1" min="1"> mm</td></tr>
           <tr><td>Sweep</td><td class="r"><input data-k="sweep" type="number" step="1" min="1" max="359"> °</td></tr>
           <tr><td>Turns</td><td class="r"><span class="seg side"><button data-side="left">Left</button><button data-side="right">Right</button></span></td></tr></table>`)
        + '<p class="none">The segments after it follow.</p>';
      box.querySelectorAll('input[data-k]').forEach(inp => inp.onchange = () => editSeg({ [inp.dataset.k]: inp.dataset.k === 'angle' ? +inp.value : pt0(inp.dataset.k, +inp.value) }));
      box.querySelectorAll('[data-side]').forEach(b => b.onclick = () => editSeg({ side: b.dataset.side }));
    }
    for (const inp of box.querySelectorAll('input[data-k]')) {
      const k = inp.dataset.k, v = k === 'length' || k === 'radius' ? n[k] * PT_MM : n[k];
      if (document.activeElement !== inp) inp.value = num(v, 1);
    }
    box.querySelectorAll('[data-side]').forEach(b => b.classList.toggle('on', b.dataset.side === n.side));
  }
  if (!g) delete box.dataset.seg;
  const f = segs.length ? filleted(S.curve, S.cornerR) : { warn: [] };
  $('#cWarn').innerHTML = f.warn.length ? `<p class="warn">${f.warn.length} kink${f.warn.length > 1 ? 's are' : ' is'} too tight for a ${S.cornerR} mm radius: marked ! on the canvas.</p>` : '';
  renderLayers(); renderLanes(); renderDrops(); renderTubes(); stats();
}
const pt0 = (k, v) => (k === 'length' || k === 'radius') ? pt(Math.max(1, v)) : Math.max(1, Math.min(359, v));
function editSeg(nums) {
  if (S.selSeg === null) return;
  undoPush();
  S.curve.segs = setSegNumbers(S.curve.segs, S.selSeg, nums);
  invalidate();
}
$('#cLen').onchange = e => {
  const L = curveInfo(S.curve.segs).length * PT_MM / 10, want = +e.target.value;
  if (!(want > 0) || !(L > 0)) return;
  undoPush(); S.curve.segs = scaleCurve(S.curve.segs, want / L); invalidate();
};
$('#cR').onchange = e => { undoPush(); S.cornerR = Math.max(0, Math.round(+e.target.value || 0)); invalidate(); };

// Layers: four, the same as on the Adjustments tab, in a fixed order; [+]
// puts a tube into one (the owner, 2026-10-01: a second yellow, a white, an
// orange), × takes it out.
function renderLayers() {
  $('#layers').innerHTML = S.layers.map(L => `
    <div class="layer ${L.n === S.layer ? 'on' : ''}" data-n="${L.n}">
      <div class="lhead"><span class="ln">${L.n}</span><span class="lname"><b>${L.name}</b><small>${L.where}</small></span>
        <span class="seg side ends">${['tails', 'round'].map(e => `<button data-ends="${L.n}" data-v="${e}" class="${endsOf(L.n) === e ? 'on' : ''}" title="${e === 'tails' ? 'Thick at the home, thinning into the tail' : 'Round ends: for solid paint'}">${e === 'tails' ? 'Tails' : 'Round'}</button>`).join('')}</span></div>
      <div class="ltubes">${runOrder(L.tubes).map(({ id, i }) => { const t = tubeOf(id); return t ? `
        <span class="tchip" title="${esc(t.name)}${t.pigment ? ' · ' + esc(t.pigment) : ''}"><i style="background:${t.hex}"></i>${t.name}<button class="x" data-n="${L.n}" data-i="${i}" title="Take ${t.name} out of this layer">×</button></span>` : ''; }).join('')}
        <button class="plus" data-n="${L.n}" title="Add a tube to this layer">+</button>
      </div>
    </div>`).join('');
  document.querySelectorAll('.layer').forEach(el => el.onclick = e => { if (e.target.closest('button')) return; S.layer = +el.dataset.n; invalidate(); });
  document.querySelectorAll('.layer [data-ends]').forEach(b => b.onclick = () => { S.ends[b.dataset.ends] = b.dataset.v; writeEnds(localStorage, S.ends); invalidate(); });
  document.querySelectorAll('.tchip .x').forEach(b => b.onclick = () => {
    const L = S.layers.find(l => l.n === +b.dataset.n); undoPush(); L.tubes.splice(+b.dataset.i, 1); invalidate();
  });
  document.querySelectorAll('.layer .plus').forEach(b => b.onclick = e => { e.stopPropagation(); openMenu(b, +b.dataset.n); });
}
const menu = $('#tubeMenu');
function openMenu(btn, n) {
  menu.innerHTML = `<p class="mhead">Add to layer ${n}</p>` + inventory().map(t => `<button data-id="${t.id}"><i style="background:${t.hex}"></i>${esc(t.name)}<span>${esc(t.pigment)}</span></button>`).join('');
  const r = btn.getBoundingClientRect();
  menu.hidden = false;
  menu.style.left = Math.min(r.left, innerWidth - menu.offsetWidth - 8) + 'px';
  menu.style.top = Math.min(r.bottom + 6, innerHeight - menu.offsetHeight - 8) + 'px';
  menu.querySelectorAll('button').forEach(b => b.onclick = () => {
    const L = S.layers.find(l => l.n === n); undoPush(); L.tubes.push(b.dataset.id); menu.hidden = true; invalidate();
  });
}
addEventListener('pointerdown', e => { if (!menu.hidden && !e.target.closest('#tubeMenu')) menu.hidden = true; });

const minsAt = mm => mm / 40 / 60;   // 40 mm/s, est. (§9)
function renderLanes() {
  const P_ = S.curve.segs.length ? plan() : { lanes: [], length: 0, steep: 0, runs: [] };
  const n = side => P_.lanes.filter(l => l.side === side).length;
  $('#lnW').textContent = `${num(PAINT.line, 1)} mm est.`;
  setIf('#lnPitch', S.pitch);
  $('#lnCount').textContent = P_.lanes.length ? `${n('below')} · ${n('above')}` : '—';
  $('#lnLen').textContent = P_.lanes.length ? `${fmt(P_.length / 1000, 1)} m · ≈ ${fmt(minsAt(P_.length), 0)} min` : '—';
  const over = Math.round((1 - S.pitch * Math.cos(P_.steep * Math.PI / 180) / PAINT.line) * 100);   // the copies lie pitch × cos(slope) apart
  const notes = [];
  if (P_.lanes.length) notes.push(`Below the curve: offsets. Above it: vertical copies of the curve; where it is steepest (${fmt(P_.steep, 0)}°) neighbours overlap by about ${Math.max(0, over)} %.`);
  if (P_.lanes.length && !SAMPLER) notes.push('Add the reference: the lines take their paint from it.');
  $('#lnNote').innerHTML = notes.map(t => `<p class="none">${t}</p>`).join('');
}
$('#lnPitch').onchange = e => { const v = Math.round(+e.target.value); if (v >= 2) { undoPush(); S.pitch = v; } invalidate(); };
function renderDrops() {
  const D = S.curve.segs.length && SAMPLER ? plan().drops : null;
  if (!D) { $('#drops').innerHTML = `<p class="none">${SAMPLER ? 'Draw the curve first.' : 'The drops come with the lines\' paint: add the reference.'}</p>`; $('#dropNote').textContent = ''; return; }
  $('#drops').innerHTML = S.layers.map(L => {
    const rows = runOrder(L.tubes).map(({ id }) => id).filter((id, i, a) => a.indexOf(id) === i).map(id => {
      const ds = D.drops.filter(d => d.tube === id && d.layer === L.n), t = tubeOf(id);
      return ds.length ? `<tr><td><span class="chip" style="background:${t.hex}"></span>${t.name}</td><td class="r">${ds.length} drop${ds.length > 1 ? 's' : ''}</td><td class="r">${fmt(ds.length * PAINT.dropMl, 1)} ml</td></tr>` : '';
    }).join('');
    return rows ? `<h4>${L.n} · ${L.name}</h4><table>${rows}</table>` : '';
  }).join('') + `<table class="total"><tr><td><b>Total</b></td><td class="r">${D.total.drops} drops</td><td class="r"><b>${fmt(D.total.ml, 0)} ml</b></td></tr></table>`;
  $('#dropNote').innerHTML = `Film ${num(PAINT.film, 2)} mm · brush keeps ${num(PAINT.keeps, 0)} % · a drop ${num(PAINT.dropMl, 1)} ml, ${num(PAINT.dropLen, 0)} mm long, across up to ${Math.floor(PAINT.dropLen / S.pitch)} lines. <b>Estimate</b>: Adjustments has not weighed these paints yet.`;
}
function usedTubes() { return [...new Set(S.layers.flatMap(l => l.tubes))].map(tubeOf).filter(Boolean); }
// The tubes: a click on the shade or the name changes it, + adds a tube at
// the end, the grip drags it elsewhere in the list (the owner, 2026-10-01:
// "Lemon at the bottom by default, and I drag it up next to Yellow"; the
// real tubes' names: "Primary Blue", "Ombre Brulée"). Kept on this Mac.
const esc = v => String(v ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
let tubesShown = '', dragId = null;
function renderTubes() {
  const usedIds = new Set(S.layers.flatMap(l => l.tubes)), inv = inventory(), box = $('#tubes');
  $('#tubeCount').textContent = `${usedTubes().length} / ${inv.length}`;
  const sig = JSON.stringify([inv, S.layers.map(l => l.tubes)]);
  if (sig === tubesShown || box.contains(document.activeElement)) return;   // not from under the typing hand
  tubesShown = sig;
  const where = id => S.layers.filter(l => l.tubes.includes(id)).map(l => l.n).join(' · ');
  box.innerHTML = inv.map(t => `
    <div class="trow${usedIds.has(t.id) ? '' : ' unused'}" data-id="${t.id}">
      <span class="grip" title="Drag it up or down the list">⋮⋮</span>
      <label class="tsw" style="background:${t.hex}" title="The shade: ${t.hex}"><input type="color" value="${t.hex.toLowerCase()}"></label>
      <input class="tname" value="${esc(t.name)}" spellcheck="false" title="The name on the tube">
      <input class="tpig" value="${esc(t.pigment)}" placeholder="pigment" spellcheck="false" title="Pigment code(s)">
      <span class="tuse" title="In these layers">${where(t.id) || '—'}</span>
      ${usedIds.has(t.id) ? '<span class="x"></span>' : '<button class="x" title="Delete this tube">×</button>'}
    </div>`).join('');
  box.querySelectorAll('.trow').forEach(row => {
    const t = tubeOf(row.dataset.id), sw = row.querySelector('.tsw'), col = sw.querySelector('input');
    let picking = false;
    col.oninput = () => { if (!picking) { undoPush(); picking = true; } t.hex = col.value.toUpperCase(); sw.style.background = t.hex; sw.title = 'The shade: ' + t.hex; invalidate(); };
    col.onchange = () => { picking = false; saveTubes(); };
    for (const [sel, key, empty] of [['.tname', 'name', 'Tube'], ['.tpig', 'pigment', '']]) {
      const inp = row.querySelector(sel);
      inp.onkeydown = e => { if (e.key === 'Enter') inp.blur(); if (e.key === 'Escape') { inp.value = t[key]; inp.blur(); } };
      inp.onchange = () => { const v = inp.value.trim() || empty; if (v === t[key]) return; undoPush(); t[key] = v; inp.value = v; saveTubes(); invalidate(); };
    }
    const del = row.querySelector('button.x');
    if (del) del.onclick = () => { undoPush(); removeTube(t.id); saveTubes(); invalidate(); };
    const grip = row.querySelector('.grip');
    grip.onpointerdown = () => { row.draggable = true; };
    row.ondragstart = e => { dragId = t.id; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', t.id); row.classList.add('dragging'); };
    row.ondragend = () => { row.draggable = false; dragId = null; box.querySelectorAll('.trow').forEach(r => r.classList.remove('dragging', 'drop-before', 'drop-after')); };
    row.ondragover = e => {
      if (!dragId || dragId === t.id) return;
      e.preventDefault();
      const r = row.getBoundingClientRect(), before = e.clientY < r.top + r.height / 2;
      box.querySelectorAll('.trow').forEach(x => x.classList.remove('drop-before', 'drop-after'));
      row.classList.add(before ? 'drop-before' : 'drop-after');
    };
    row.ondrop = e => {
      e.preventDefault(); if (!dragId || dragId === t.id) return;
      const before = row.classList.contains('drop-before'), next = row.nextElementSibling?.dataset.id ?? null;
      undoPush(); moveTube(dragId, before ? t.id : (next === dragId ? row.nextElementSibling.nextElementSibling?.dataset.id ?? null : next));
      saveTubes(); invalidate();
    };
  });
}
$('#btnAddTube').onclick = () => {
  undoPush(); const t = addTube(); saveTubes(); invalidate();
  requestAnimationFrame(() => requestAnimationFrame(() => { const inp = document.querySelector(`.trow[data-id="${t.id}"] .tname`); if (inp) { inp.focus(); inp.select(); inp.scrollIntoView({ block: 'nearest' }); } }));
};
// On this Mac: app/tubes.json through rembrandt.py (/tubes); in this browser
// too, so the page opens with them at once.
let tubeSaveT = 0, tubeState = '';
function showTubeState() {
  $('#tubeSave').innerHTML = tubeState === 'saved' ? 'Kept on this Mac: <span class="mono">app/tubes.json</span>'
    : tubeState === 'unsaved' ? '<span class="warn">Not saved on the Mac: start rembrandt.py.</span>' : '';
}
function saveTubes() {
  try { localStorage.setItem('rembrandt.tubes.v01', JSON.stringify(inventory())); } catch { }
  clearTimeout(tubeSaveT);
  tubeSaveT = setTimeout(async () => {
    try { const r = await fetch('/tubes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tubes: inventory() }, null, 2) }); tubeState = r.ok ? 'saved' : 'unsaved'; }
    catch { tubeState = 'unsaved'; }
    showTubeState();
  }, 400);
}
async function loadTubes() {
  try { setInventory(JSON.parse(localStorage.getItem('rembrandt.tubes.v01') || 'null')); } catch { }
  try {
    const r = await fetch('/tubes', { cache: 'no-store' }), o = r.ok ? await r.json() : null;
    if (o && setInventory(o.tubes)) tubeState = 'saved';
    else if (r.ok) saveTubes();                   // no file yet: write the first one
    else tubeState = 'unsaved';
  } catch { tubeState = 'unsaved'; }
  tubesShown = ''; showTubeState(); invalidate();
}
function stats() {
  const cr = canvasRect(), F = FORMATS[S.format], kind = F.label.split(' ')[0];
  const nTubes = usedTubes().length;
  const P_ = S.curve.segs.length ? plan() : null, nd = P_?.drops?.total.drops;
  $('#stats').textContent = `${kind} ${fmt(cr.w, 0)} × ${fmt(cr.h, 0)} mm${cr.cal ? '' : ' (placed by default)'} · image area ${fmt(IA.w, 1)} × ${fmt(IA.h, 0)} mm · ${S.layers.length} layers · ${nTubes} tubes` + (P_ ? ` · ${P_.lanes.length} lanes, ${fmt(P_.length / 1000, 1)} m` : '') + (nd ? ` · ${nd} drops` : '');
}

// ---------- export and import ----------
function stamp() { const d = new Date(), z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}-${z(d.getHours())}${z(d.getMinutes())}`; }
function download(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
// The board as on screen, 4000 px on its long side.
$('#btnPng').onclick = () => {
  const cv = boardCanvas(4000);
  cv.toBlob(b => download(b, `rembrandt-${stamp()}.png`), 'image/png');
};
// A foreign SVG: its longest path becomes the curve, fitted into the image
// area and cut into short straight lines.
$('#btnImport').onclick = () => $('#fileIn').click();
$('#fileIn').onchange = async e => { const f = e.target.files[0]; if (!f) return; importSVG(await f.text()); e.target.value = ''; };
function importSVG(text) {
  finishAll();
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const holder = document.createElement('div');
  holder.style.cssText = 'position:absolute;left:-100000px;top:0;visibility:hidden';
  const svg = document.importNode(doc.documentElement, true);
  holder.appendChild(svg); document.body.appendChild(holder);
  let best = null;
  svg.querySelectorAll('path,line,polyline,polygon,rect,circle,ellipse').forEach(el => {
    if (el.closest('defs,clipPath,mask,symbol,marker')) return;
    let L = 0; try { L = el.getTotalLength(); } catch { return; }
    if (!L || (best && best.L >= L)) return;
    const m = el.getCTM(), step = Math.max(L / 3000, 0.25), pts = [];
    for (let d = 0; d <= L + 1e-6; d += step) { const q = el.getPointAtLength(Math.min(d, L)).matrixTransform(m); pts.push(P(q.x, q.y)); }
    best = { L, pts };
  });
  holder.remove();
  if (!best) return;
  const xs = best.pts.map(q => q.x), ys = best.pts.map(q => q.y);
  const x0 = Math.min(...xs), y0 = Math.min(...ys), w = Math.max(...xs) - x0 || 1, h = Math.max(...ys) - y0 || 1;
  const s = Math.min(pt(IA.w) / w, pt(IA.h) / h), ox = (pt(IA.w) - w * s) / 2, oy = (pt(IA.h) - h * s) / 2;
  const pts = simplify(best.pts.map(q => P((q.x - x0) * s + ox, (q.y - y0) * s + oy)), pt(0.3));
  undoPush();
  S.curve.segs = [];
  for (let i = 1; i < pts.length; i++) if (dist(pts[i], pts[i - 1]) > 1e-3) S.curve.segs.push({ t: 'L', a: pts[i - 1], b: pts[i] });
  S.sel = false; S.selSeg = null; invalidate();
}

// ---------- 💾 SAVE: the painting into the Library ----------
// As in RUBENS (the owner, 2026-09-30): every save is a new painting named by
// the date and time, never over an older one; rembrandt.py keeps it in
// app/library/ on this Mac, not in git. The SVG is the image area in pt: the
// canvas, the lines in their tubes' colours, the curve — and in its metadata
// the whole painting, the reference included, so the Library opens it again.
function paintingState() {
  return { rembrandt: '0.1', format: S.format, segs: S.curve.segs, cornerR: S.cornerR, pitch: S.pitch, layers: S.layers, ends: S.ends, tubes: inventory(), refOpacity: S.refOpacity, ref: REF ? { name: REF.name, src: REF.img.src } : null };
}
function drawingText() {
  const P_ = S.curve.segs.length ? plan() : null, cr = canvasRect();
  const meta = JSON.stringify(paintingState()).replace(/&/g, '\\u0026').replace(/</g, '\\u003c').replace(/--/g, '- -');
  const lines = (P_?.runs || []).map(r => `  <path d="${pathD({ segs: r.segs })}" stroke="${tubeOf(r.tube)?.hex || '#808080'}" data-tube="${r.tube}" data-layer="${r.layer}" data-home="${r.home}"/>`).join('\n');
  const curve = S.curve.segs.length ? `<path id="curve" d="${pathD(filleted(S.curve, S.cornerR))}" fill="none" stroke="#24221F" stroke-width="1"/>` : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${fmt(IA.w, 1)}mm" height="${fmt(IA.h, 1)}mm" viewBox="0 0 ${fmt(pt(IA.w), 3)} ${fmt(pt(IA.h), 3)}">
<!-- Rembrandt v0.3 · ${FORMATS[S.format].label} · the image area ${fmt(IA.w, 1)} × ${fmt(IA.h, 1)} mm; 1 unit = 1 pt = 25.4/72 mm -->
<metadata id="rembrandt-state">${meta}</metadata>
<rect id="canvas" x="${fmt(pt(cr.x), 3)}" y="${fmt(pt(cr.y), 3)}" width="${fmt(pt(cr.w), 3)}" height="${fmt(pt(cr.h), 3)}" fill="none" stroke="#24221F" stroke-width="1"/>
<g id="lanes" fill="none" stroke-width="${fmt(pt(PAINT.line), 3)}" stroke-linecap="round" stroke-linejoin="round">
${lines}
</g>
${curve}
</svg>`;
}
// The board as on screen, long px on its long side.
function boardCanvas(long) {
  finishAll();
  const cssW = V.w * kMm, cssH = V.h * kMm, s = long / Math.max(cssW, cssH);
  const cv = document.createElement('canvas'); cv.width = Math.round(cssW * s); cv.height = Math.round(cssH * s);
  const c = cv.getContext('2d'), keep = dpr, sel = S.sel;
  dpr = s; S.sel = false;
  drawPaint(c, cssW, cssH); scrT(c); drawCurve(c);
  dpr = keep; S.sel = sel;
  return cv;
}
const libraryName = file => file.slice(0, 13) + ':' + file.slice(14);   // '2026-10-01 21-15' → '… 21:15'
async function saveToLibrary() {
  const st = $('#saveState'), b = $('#btnSave');
  if (!S.curve.segs.length) { st.textContent = 'nothing drawn yet'; return; }
  b.disabled = true; st.textContent = 'saving…';
  try {
    const r = await fetch('/library', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ svg: drawingText(), png: boardCanvas(800).toDataURL('image/png') }) });
    const o = await r.json();
    st.textContent = o.ok ? `saved · ${o.name}` : `not saved · ${o.message}`;
  } catch { st.textContent = 'not saved · start rembrandt.py'; }
  b.disabled = false;
}
$('#btnSave').onclick = saveToLibrary;
// Opened from the Library (library.html → index.html?open=<file>): the
// painting takes the place of the one here; ⌘Z brings that one back.
async function openFromLibrary(file) {
  history.replaceState(null, '', location.pathname);
  const st = $('#saveState');
  try {
    const r = await fetch('library/' + encodeURIComponent(file) + '.svg', { cache: 'no-store' });
    if (!r.ok) throw new Error(r.status);
    const doc = new DOMParser().parseFromString(await r.text(), 'image/svg+xml'), meta = doc.querySelector('metadata#rembrandt-state');
    if (!meta) { st.textContent = 'a RUBENS drawing: open it in RUBENS'; return; }
    const o = JSON.parse(meta.textContent.replace(/- -/g, '--'));
    undoPush();
    if (CREATE_FORMATS.includes(o.format)) { S.format = o.format; $('#format').value = S.format; }
    S.curve.segs = o.segs || []; S.cornerR = o.cornerR ?? S.cornerR; S.pitch = o.pitch ?? S.pitch;
    S.layers = layersFrom(o.layers);
    if (o.ends) { S.ends = { ...S.ends, ...o.ends }; writeEnds(localStorage, S.ends); }
    // the painting's tubes the inventory does not have go to its end; the others stay as they are now
    const missing = (o.tubes || []).filter(t => !tubeOf(t.id));
    if (missing.length) { setInventory([...inventory(), ...missing]); saveTubes(); }
    if (Number.isFinite(o.refOpacity)) S.refOpacity = o.refOpacity;
    if (o.ref?.src) setRef(o.ref.src, o.ref.name || 'reference', true);
    S.sel = false; S.selSeg = null; saveNow(); layout(); syncRef();
    st.textContent = `opened · ${libraryName(file)}`;
  } catch { st.textContent = 'could not open it from the Library'; }
}

// ---------- kept in this browser ----------
let saveT = 0;
function save() { clearTimeout(saveT); saveT = setTimeout(saveNow, 300); }
function saveNow() {
  clearTimeout(saveT);
  try { localStorage.setItem('rembrandt.v01', JSON.stringify({ format: S.format, segs: S.curve.segs, cornerR: S.cornerR, layers: S.layers, layer: S.layer, view: S.view, refOpacity: S.refOpacity, angleSnap: S.angleSnap, pitch: S.pitch })); } catch { }
}
function load() {
  try {
    const o = JSON.parse(localStorage.getItem('rembrandt.v01') || 'null'); if (!o) return false;
    if (CREATE_FORMATS.includes(o.format)) S.format = o.format;
    if (Array.isArray(o.segs)) S.curve.segs = o.segs;
    if (Number.isFinite(o.cornerR)) S.cornerR = o.cornerR;
    S.layers = layersFrom(o.layers);
    if (Number.isFinite(o.pitch) && o.pitch > 0) S.pitch = o.pitch;
    if (o.layer && o.layers?.length === 4) S.layer = o.layer;
    if (o.view) Object.assign(S.view, o.view, { lanes: o.view.lanes ?? true, drops: o.view.drops ?? true });
    if (Number.isFinite(o.refOpacity)) S.refOpacity = o.refOpacity;
    if (o.angleSnap !== undefined) S.angleSnap = o.angleSnap;
    return true;
  } catch { return false; }
}
function loadRef() {
  try { const o = JSON.parse(localStorage.getItem('rembrandt.ref') || 'null'); if (o && o.src) setRef(o.src, o.name || 'reference', false); } catch { }
}

// ---------- start ----------
if (!load()) S.curve.segs = defaultCurve();
$('#format').value = S.format;
syncTools(); syncView(); syncRef(); loadRef(); loadTubes();
const opening = new URLSearchParams(location.search).get('open');   // from the Library tab
if (opening) openFromLibrary(opening);
new ResizeObserver(layout).observe(stage);
addEventListener('focus', () => { loadCal(); PAINT = readPaint(localStorage); invalidate(); });
addEventListener('rembrandt-night', () => invalidate());   // back from Calibration or Adjustments
loadCal();
