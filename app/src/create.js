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
import { segStart, segEnd, segDirEnd, tangentArc, anchorsOf, applyAnchorMove } from './geometry.js';
import { makeLine, snapArc, fitSegment, pushSeg } from './gesture.js';
import { filleted } from './fillet.js';
import { reach } from './machine.js';
import { simplify } from './svg.js';
import { segNumbers, setSegNumbers, scaleCurve, curveInfo, nearestSeg, buildCurve, moveSegBy } from './curve.js';
import { INVENTORY, tubeOf, defaultLayers, runOrder } from './tubes.js';
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
const CREATE_FORMATS = ['c50x70', 'p60x80'];   // 70 × 100 is out of reach (the owner, 2026-10-01)

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
  layer: 1,
  tool: 'gesture', penArc: false, angleSnap: 15,
  sel: false, selSeg: null, selAnchors: [],
  view: { reference: true, reach: true, grid: false },
  refOpacity: 45,
};
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
function drawPaint(c, W, H, forExport) {
  scrT(c); if (forExport) c.setTransform(forExport, 0, 0, forExport, 0, 0);
  c.clearRect(0, 0, W, H);
  c.fillStyle = '#D9D4CA'; c.fillRect(0, 0, W, H);                      // the table
  const ia = mmR(0, 0, IA.w, IA.h), cr = canvasRect(), win = mmR(cr.x, cr.y, cr.w, cr.h);
  c.fillStyle = '#F2F0EB'; c.fillRect(...ia);                           // the canvas underneath, in the image area
  c.fillStyle = '#FCFBF8'; c.fillRect(...win);                          // the canvas
  drawRef(c);
  c.save();                                                             // past the canvas: a veil
  c.beginPath(); c.rect(...ia); c.rect(...win); c.clip('evenodd');
  c.fillStyle = 'rgba(217,212,202,.55)'; c.fillRect(...ia);
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
const snapshot = () => JSON.stringify({ segs: S.curve.segs, cornerR: S.cornerR, layers: S.layers });
function undoPush() { undoStack.push(snapshot()); if (undoStack.length > 200) undoStack.shift(); redoStack = []; }
let lastSoft = 0;
function undoPushSoft() { const t = performance.now(); if (t - lastSoft > 700) undoPush(); lastSoft = t; }
function restore(js) {
  const o = JSON.parse(js);
  S.curve.segs = o.segs; S.cornerR = o.cornerR; S.layers = o.layers;
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
wireCv.addEventListener('pointerup', () => { if (AD) { anchorUp(); return; } if (S.tool === 'gesture') gUp(); if (S.tool === 'select') selUp(); });
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
  renderLayers(); renderTubes(); stats();
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

// Layers: three, in a fixed order; [+] puts a tube into one (the owner,
// 2026-10-01: a second yellow, a white, an orange), × takes it out.
function renderLayers() {
  $('#layers').innerHTML = S.layers.map(L => `
    <div class="layer ${L.n === S.layer ? 'on' : ''}" data-n="${L.n}">
      <div class="lhead"><span class="ln">${L.n}</span><span class="lname"><b>${L.name}</b><small>${L.where}</small></span></div>
      <div class="ltubes">${runOrder(L.tubes).map(({ id, i }) => { const t = tubeOf(id); return t ? `
        <span class="tchip" title="${t.name} · ${t.pigment}"><i style="background:${t.hex}"></i>${t.name}<button class="x" data-n="${L.n}" data-i="${i}" title="Take ${t.name} out of this layer">×</button></span>` : ''; }).join('')}
        <button class="plus" data-n="${L.n}" title="Add a tube to this layer">+</button>
      </div>
    </div>`).join('');
  document.querySelectorAll('.layer').forEach(el => el.onclick = e => { if (e.target.closest('button')) return; S.layer = +el.dataset.n; renderLayers(); });
  document.querySelectorAll('.tchip .x').forEach(b => b.onclick = () => {
    const L = S.layers.find(l => l.n === +b.dataset.n); undoPush(); L.tubes.splice(+b.dataset.i, 1); invalidate();
  });
  document.querySelectorAll('.layer .plus').forEach(b => b.onclick = e => { e.stopPropagation(); openMenu(b, +b.dataset.n); });
}
const menu = $('#tubeMenu');
function openMenu(btn, n) {
  menu.innerHTML = `<p class="mhead">Add to layer ${n}</p>` + INVENTORY.map(t => `<button data-id="${t.id}"><i style="background:${t.hex}"></i>${t.name}<span>${t.pigment}</span></button>`).join('');
  const r = btn.getBoundingClientRect();
  menu.hidden = false;
  menu.style.left = Math.min(r.left, innerWidth - menu.offsetWidth - 8) + 'px';
  menu.style.top = Math.min(r.bottom + 6, innerHeight - menu.offsetHeight - 8) + 'px';
  menu.querySelectorAll('button').forEach(b => b.onclick = () => {
    const L = S.layers.find(l => l.n === n); undoPush(); L.tubes.push(b.dataset.id); menu.hidden = true; invalidate();
  });
}
addEventListener('pointerdown', e => { if (!menu.hidden && !e.target.closest('#tubeMenu')) menu.hidden = true; });

function usedTubes() { return [...new Set(S.layers.flatMap(l => l.tubes))].map(tubeOf).filter(Boolean); }
function renderTubes() {
  const used = usedTubes();
  $('#tubeCount').textContent = `${used.length} / ${INVENTORY.length}`;
  $('#tubes').innerHTML = '<table>' + used.map(t => `<tr><td><span class="chip" style="background:${t.hex}"></span>${t.name}</td><td class="r">${t.pigment}</td></tr>`).join('') + '</table>';
}
function stats() {
  const cr = canvasRect(), F = FORMATS[S.format], kind = F.label.split(' ')[0];
  const nTubes = usedTubes().length;
  $('#stats').textContent = `${kind} ${fmt(cr.w, 0)} × ${fmt(cr.h, 0)} mm${cr.cal ? '' : ' (placed by default)'} · image area ${fmt(IA.w, 1)} × ${fmt(IA.h, 0)} mm · ${S.curve.segs.length ? 1 : 0} curve · ${S.layers.length} layers · ${nTubes} tube${nTubes === 1 ? '' : 's'}`;
}

// ---------- export and import ----------
function stamp() { const d = new Date(), z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}-${z(d.getHours())}${z(d.getMinutes())}`; }
function download(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
// The board as on screen, 4000 px on its long side.
$('#btnPng').onclick = () => {
  finishAll();
  const cssW = V.w * kMm, cssH = V.h * kMm, s = 4000 / Math.max(cssW, cssH);
  const cv = document.createElement('canvas'); cv.width = Math.round(cssW * s); cv.height = Math.round(cssH * s);
  const c = cv.getContext('2d'), keep = dpr;
  drawPaint(c, cssW, cssH, s);
  dpr = s; const sel = S.sel; S.sel = false;
  c.setTransform(s, 0, 0, s, 0, 0); drawCurve(c);
  dpr = keep; S.sel = sel;
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

// ---------- kept in this browser ----------
let saveT = 0;
function save() { clearTimeout(saveT); saveT = setTimeout(saveNow, 300); }
function saveNow() {
  clearTimeout(saveT);
  try { localStorage.setItem('rembrandt.v01', JSON.stringify({ format: S.format, segs: S.curve.segs, cornerR: S.cornerR, layers: S.layers, layer: S.layer, view: S.view, refOpacity: S.refOpacity, angleSnap: S.angleSnap })); } catch { }
}
function load() {
  try {
    const o = JSON.parse(localStorage.getItem('rembrandt.v01') || 'null'); if (!o) return false;
    if (CREATE_FORMATS.includes(o.format)) S.format = o.format;
    if (Array.isArray(o.segs)) S.curve.segs = o.segs;
    if (Number.isFinite(o.cornerR)) S.cornerR = o.cornerR;
    if (Array.isArray(o.layers) && o.layers.length === 3) S.layers = o.layers;
    if (o.layer) S.layer = o.layer;
    if (o.view) Object.assign(S.view, o.view);
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
syncTools(); syncView(); syncRef(); loadRef();
new ResizeObserver(layout).observe(stage);
addEventListener('focus', loadCal);   // back from the Calibration tab: the canvas may lie elsewhere
loadCal();
