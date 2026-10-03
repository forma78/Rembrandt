// Rembrandt · NOLAN — the ribbons, after nolan-images/IMG_9424.jpg (NOLAN.md).
// The first step is Geometry (§2): the ribbons' centres drawn with Pen and
// Arc as the curve on Create, their squares dragged, their widths counted
// in 8 mm lines; the lines drawn dark grey on the white canvas, a groove
// between neighbours. Never touches the hardware.
//
// Units as on Create: the document is in pt, 1 pt = 25.4/72 mm. Its origin is
// the canvas's top left corner, x across, y down. Where the canvas lies on
// the machine comes later, from the cup (NOLAN.md §3).

import { PT_MM, FORMATS } from './config.js';
import { P, sub, add, len, dist, TAU, fmt } from './util.js';
import { segEnd, segDirEnd, tangentArc, anchorsOf, applyAnchorMove } from './geometry.js';
import { makeLine, snapArc, pushSeg } from './gesture.js';
import { nearestSeg, moveSegBy, curveInfo } from './curve.js';
import { ribbonLines, ribbonName, widthLabel, clampLines, linesLength, ribbonWidth, PITCH_MM } from './ribbon.js';
import { themeColor } from './lamp.js';
import './ui.js';

const $ = s => document.querySelector(s);
const pt = mm => mm / PT_MM;
const NOLAN_FORMATS = ['c40x30', 'c40x60', 'c50x70', 'p60x80'];   // Create's
const MARGIN = 60;      // mm of table round the canvas: a ribbon may run past its edge
const GROOVE = 1.5;     // mm of white between two lines, so each reads on its own (NOLAN.md §2)
const KEY = 'rembrandt.nolan.v01', REF_KEY = 'rembrandt.nolan.ref';

// ---------- state ----------
const S = {
  format: 'c50x70',
  ribbons: [],          // [{ id, segs, n }] by painting order: N1, N2, N3 …
  pick: null,           // the picked ribbon's id
  selAnchors: [],       // its picked squares
  cornerR: 10,          // mm: the inner line turns on it at a kink
  lines: 12,            // a new ribbon's width: 96 mm, est.
  tool: 'pen', penArc: false, angleSnap: 15,
  view: { reference: true, grid: false },
  refOpacity: 45,
};
let REF = null;         // { img, name }
let idSeq = 0;
const newId = () => 'rb' + Date.now().toString(36) + (idSeq++).toString(36);
const byId = id => S.ribbons.find(r => r.id === id) || null;
const indexOf = id => S.ribbons.findIndex(r => r.id === id);
const F = () => FORMATS[S.format];

// The lines of every ribbon, built again only when it changes.
const built = new Map();
function linesOf(r) {
  const key = JSON.stringify([r.segs, r.n, S.cornerR]), hit = built.get(r.id);
  if (hit && hit.key === key) return hit.L;
  const L = ribbonLines(r, S.cornerR);
  built.set(r.id, { key, L });
  return L;
}

// ---------- screen ----------
const paintCv = $('#paint'), wireCv = $('#wire'), board = $('#board'), stage = $('#stage');
const pctx = paintCv.getContext('2d'), wctx = wireCv.getContext('2d');
let kMm = 1, dpr = 1, V = { x: 0, y: 0, w: 1, h: 1 };   // css px per mm; the view in mm
const kPt = () => kMm * PT_MM;
const mmR = (x, y, w, h) => [(x - V.x) * kMm, (y - V.y) * kMm, w * kMm, h * kMm];
const toScr = q => P((q.x * PT_MM - V.x) * kMm, (q.y * PT_MM - V.y) * kMm);
const scrT = c => c.setTransform(dpr, 0, 0, dpr, 0, 0);
const docT = c => c.setTransform(dpr * kPt(), 0, 0, dpr * kPt(), -V.x * kMm * dpr, -V.y * kMm * dpr);
const font = (px, w = '') => `${w} ${px}px ` + getComputedStyle(document.body).getPropertyValue('--mono');

function layout() {
  const f = F();
  V = { x: -MARGIN, y: -MARGIN, w: f.w + 2 * MARGIN, h: f.h + 2 * MARGIN };
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
  drawWire();
}

// ---------- the paint layer: the canvas, the reference, the lines ----------
function tracePath(c, segs) {
  let first = true;
  for (const g of segs) {
    if (g.t === 'L') { if (first) c.moveTo(g.a.x, g.a.y); c.lineTo(g.b.x, g.b.y); }
    else { if (first) c.moveTo(g.c.x + g.r * Math.cos(g.a0), g.c.y + g.r * Math.sin(g.a0)); c.arc(g.c.x, g.c.y, g.r, g.a0, g.a0 + g.s, g.s < 0); }
    first = false;
  }
}
function pathOf(c, segs) { c.beginPath(); c.save(); docT(c); tracePath(c, segs); c.restore(); }
// The reference fits inside the canvas, whole: nothing of it is cut off to trace.
function drawRef(c) {
  if (!REF || !S.view.reference) return;
  const f = F(), img = REF.img, s = Math.min(f.w / img.naturalWidth, f.h / img.naturalHeight);
  const w = img.naturalWidth * s, h = img.naturalHeight * s;
  c.save(); c.globalAlpha = S.refOpacity / 100;
  c.drawImage(img, ...mmR((f.w - w) / 2, (f.h - h) / 2, w, h));
  c.restore();
}
function drawGrid(c) {
  const f = F();
  c.save(); c.beginPath(); c.rect(...mmR(0, 0, f.w, f.h)); c.clip(); c.lineWidth = 1;
  for (let i = 0, x = 0; x <= f.w; i++, x += 10) { c.strokeStyle = i % 10 ? 'rgba(61,107,255,.08)' : 'rgba(61,107,255,.22)'; const X = Math.round((x - V.x) * kMm) + .5; c.beginPath(); c.moveTo(X, -V.y * kMm); c.lineTo(X, (f.h - V.y) * kMm); c.stroke(); }
  for (let i = 0, y = 0; y <= f.h; i++, y += 10) { c.strokeStyle = i % 10 ? 'rgba(61,107,255,.08)' : 'rgba(61,107,255,.22)'; const Y = Math.round((y - V.y) * kMm) + .5; c.beginPath(); c.moveTo(-V.x * kMm, Y); c.lineTo((f.w - V.x) * kMm, Y); c.stroke(); }
  c.restore();
}
// Geometry: every line dark grey, 8 mm less the groove, so the lines read
// one by one; the reference shows through them to trace it.
function drawLines(c) {
  c.lineCap = 'butt'; c.lineJoin = 'round';
  c.strokeStyle = 'rgba(58,56,53,.6)'; c.lineWidth = (PITCH_MM - GROOVE) * kMm;
  for (const r of S.ribbons) for (const l of linesOf(r).lines) { pathOf(c, l.segs); c.stroke(); }
}
function drawPaint(c, W, H) {
  scrT(c);
  c.clearRect(0, 0, W, H);
  c.fillStyle = themeColor('--table', '#D9D4CA'); c.fillRect(0, 0, W, H);   // the table, dark by night
  const f = F(), win = mmR(0, 0, f.w, f.h);
  c.fillStyle = '#FCFBF8'; c.fillRect(...win);                            // the canvas: white in Geometry
  drawRef(c);
  if (S.view.grid) drawGrid(c);
  drawLines(c);
  c.save(); c.shadowColor = 'rgba(40,30,20,.18)'; c.shadowBlur = 10; c.shadowOffsetY = 2;
  c.strokeStyle = 'rgba(36,34,31,.85)'; c.lineWidth = 1; c.strokeRect(win[0] + .5, win[1] + .5, win[2] - 1, win[3] - 1);
  c.restore();
  c.font = font(10); c.fillStyle = '#B3470C';
  c.fillText(`canvas ${f.w} × ${f.h} mm`, win[0] + 2, win[1] - 5);
}

// ---------- the wire layer: centres, squares, names, the pen ----------
function drawWire() {
  const c = wctx; scrT(c);
  c.clearRect(0, 0, wireCv.width, wireCv.height);
  S.ribbons.forEach((r, i) => {
    if (!r.segs.length) return;
    const on = r.id === S.pick, L = linesOf(r);
    pathOf(c, L.centre); c.strokeStyle = on ? '#EB7A25' : 'rgba(235,122,37,.7)'; c.lineWidth = on ? 1.8 : 1.2;
    c.setLineDash([6, 5]); c.stroke(); c.setLineDash([]);
    const as = anchorsOf(r);
    as.forEach((q, k) => {
      const s = toScr(q), picked = on && S.selAnchors.includes(k), h = on ? 5 : 4;
      c.fillStyle = picked ? '#EB7A25' : '#fff'; c.strokeStyle = on ? '#24221F' : 'rgba(36,34,31,.55)'; c.lineWidth = on ? 1.5 : 1;
      c.fillRect(s.x - h, s.y - h, 2 * h, 2 * h); c.strokeRect(s.x - h, s.y - h, 2 * h, 2 * h);
    });
    const a = toScr(as[0]);
    c.font = font(13, '600'); c.fillStyle = '#EB7A25'; c.fillText(ribbonName(i), a.x + 9, a.y - 9);
    for (const q of L.warn) {                                           // the bend is too tight for the width here
      const s = toScr(q);
      c.beginPath(); c.arc(s.x, s.y, 13, 0, TAU); c.strokeStyle = '#D9481C'; c.lineWidth = 2; c.setLineDash([3, 3]); c.stroke(); c.setLineDash([]);
      c.fillStyle = '#D9481C'; c.font = '600 11px ' + getComputedStyle(document.body).getPropertyValue('--sans');
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('!', s.x, s.y); c.textAlign = 'start'; c.textBaseline = 'alphabetic';
    }
  });
  if (PEN) {
    const a = toScr(PEN.anchor);
    c.fillStyle = '#EB7A25'; c.fillRect(a.x - 3.5, a.y - 3.5, 7, 7);
    if (PEN.prov) {
      pathOf(c, [PEN.prov]); c.strokeStyle = '#EB7A25'; c.lineWidth = 1.6; c.setLineDash([6, 4]); c.stroke(); c.setLineDash([]);
      const e = toScr(segEnd(PEN.prov)), label = segLabel(PEN.prov);
      c.font = font(11);
      const tw = c.measureText(label).width;
      c.fillStyle = 'rgba(36,34,31,.85)'; c.fillRect(e.x + 12, e.y + 10, tw + 12, 19);
      c.fillStyle = '#fff'; c.fillText(label, e.x + 18, e.y + 23);
    }
  }
}
function segLabel(g) {
  if (g.t === 'L') return `Line ${fmt(Math.atan2(g.b.y - g.a.y, g.b.x - g.a.x) * 180 / Math.PI, 0)}° · ${fmt(dist(g.a, g.b) * PT_MM / 10, 1)} cm`;
  return `Arc ${fmt(Math.abs(g.s) * 180 / Math.PI, 0)}° · r ${fmt(g.r * PT_MM / 10, 1)} cm`;
}

// ---------- undo ----------
let undoStack = [], redoStack = [];
const snapshot = () => JSON.stringify({ ribbons: S.ribbons, cornerR: S.cornerR, pick: S.pick });
function undoPush() { undoStack.push(snapshot()); if (undoStack.length > 200) undoStack.shift(); redoStack = []; }
let lastSoft = 0;
function undoPushSoft() { const t = performance.now(); if (t - lastSoft > 700) undoPush(); lastSoft = t; }
function restore(js) {
  const o = JSON.parse(js);
  S.ribbons = o.ribbons; S.cornerR = o.cornerR;
  S.pick = byId(o.pick) ? o.pick : null; S.selAnchors = [];
  invalidate();
}
function undo() { finishAll(); if (!undoStack.length) return; redoStack.push(snapshot()); restore(undoStack.pop()); }
function redo() { if (!redoStack.length) return; undoStack.push(snapshot()); restore(redoStack.pop()); }

// ---------- input ----------
function evPt(e) { const r = wireCv.getBoundingClientRect(); return P(((e.clientX - r.left) / kMm + V.x) / PT_MM, ((e.clientY - r.top) / kMm + V.y) / PT_MM); }
const tol = () => 5 / kPt();
const near = () => 8 / kPt();

// A square under the pointer, the topmost ribbon first: { id, i }.
function anchorHit(q) {
  for (let j = S.ribbons.length - 1; j >= 0; j--) {
    const r = S.ribbons[j], as = anchorsOf(r);
    let best = null, bd = near();
    as.forEach((a, i) => { const d = dist(a, q); if (d < bd) { bd = d; best = i; } });
    if (best !== null) return { id: r.id, i: best };
  }
  return null;
}
// The end of a ribbon under the pointer: the pen goes on with it.
function endHit(q) {
  for (let j = S.ribbons.length - 1; j >= 0; j--) {
    const r = S.ribbons[j], last = r.segs[r.segs.length - 1];
    if (last && dist(q, segEnd(last)) < near()) return r.id;
  }
  return null;
}
// The ribbon under the pointer — anywhere across its width — the topmost first.
function ribbonHit(q) {
  for (let j = S.ribbons.length - 1; j >= 0; j--) {
    const r = S.ribbons[j];
    if (r.segs.length && nearestSeg(r.segs, q, Math.max(tol(), pt(ribbonWidth(r) / 2))) !== null) return r.id;
  }
  return null;
}

// Pen: click — a point; A or Alt — a tangent arc (RUBENS, as on Create).
// Clicked on a ribbon's end it goes on with that ribbon; elsewhere it starts
// a new one, the next N.
let PEN = null;
function penSeg(q, e) {
  if ((S.penArc !== !!e.altKey) && PEN.tan) { const g = tangentArc(PEN.anchor, PEN.tan, q); if (g) return snapArc(g); }
  if (dist(q, PEN.anchor) < tol()) return null;
  return makeLine(PEN.anchor, q, PEN.tan, S.angleSnap);
}
function penStart(id, q) {
  undoPush();
  let r = byId(id);
  if (!r) { r = { id: newId(), segs: [], n: S.lines }; S.ribbons.push(r); }
  const last = r.segs[r.segs.length - 1];
  PEN = last ? { id: r.id, anchor: segEnd(last), tan: segDirEnd(last), prov: null, added: 0 } : { id: r.id, anchor: q, tan: null, prov: null, added: 0 };
  S.pick = r.id; S.selAnchors = [];
  invalidate();
}
function penDown(e, q) {
  const g = penSeg(q, e); if (!g) return;
  pushSeg(byId(PEN.id), g); PEN.added++;
  PEN.anchor = segEnd(g); PEN.tan = segDirEnd(g); PEN.prov = null;
  invalidate();
}
function penMove(e, q) { if (!PEN) return; PEN.prov = penSeg(q, e); kick(); }
function penFinish() {
  if (!PEN) return;
  const added = PEN.added; PEN = null;
  if (!added) { const was = undoStack.pop(); if (was) restore(was); }   // nothing drawn: as it was
  invalidate();
}
const finishAll = () => penFinish();

// Select: a ribbon is picked and dragged whole; a square moves one point,
// Shift-click adds more of the same ribbon (RUBENS's anchor editing).
let DRAG = null, AD = null;
function selDown(e, q) {
  const id = ribbonHit(q);
  S.pick = id; S.selAnchors = [];
  if (id) { undoPush(); DRAG = { id, last: q, moved: false }; }
  invalidate();
}
function selMove(q) {
  if (!DRAG) return;
  const d = sub(q, DRAG.last), r = byId(DRAG.id); DRAG.last = q; DRAG.moved = true;
  r.segs = r.segs.map(g => moveSegBy(g, d)); invalidate();
}
function selUp() { if (DRAG && !DRAG.moved) undoStack.pop(); DRAG = null; }
function anchorDown(e, hit) {
  if (S.pick !== hit.id) { S.pick = hit.id; S.selAnchors = []; }
  if (e.shiftKey) {
    const k = S.selAnchors.indexOf(hit.i);
    if (k >= 0) { S.selAnchors.splice(k, 1); invalidate(); return; }
    S.selAnchors.push(hit.i);
  } else if (!S.selAnchors.includes(hit.i)) S.selAnchors = [hit.i];
  const r = byId(hit.id);
  undoPush();
  AD = { id: hit.id, orig: JSON.parse(JSON.stringify(r.segs)), start: anchorsOf(r)[hit.i], from: null, moved: false };
  invalidate();
}
function anchorMove(q) {
  if (!AD.from) AD.from = q;
  const delta = sub(add(AD.start, sub(q, AD.from)), AD.start);
  if (!AD.moved && len(delta) * kPt() < 1) return;
  AD.moved = true;
  applyAnchorMove(byId(AD.id), AD.orig, S.selAnchors, delta);
  invalidate();
}
function anchorUp() { if (AD && !AD.moved) undoStack.pop(); AD = null; }
function nudgeAnchors(dx, dy) {
  const r = byId(S.pick); if (!r || !S.selAnchors.length) return;
  undoPushSoft();
  applyAnchorMove(r, JSON.parse(JSON.stringify(r.segs)), S.selAnchors, P(dx, dy));
  invalidate();
}

wireCv.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  wireCv.setPointerCapture(e.pointerId);
  const q = evPt(e);
  if (S.tool === 'pen') {
    if (PEN) { penDown(e, q); return; }
    const end = endHit(q);
    if (end) { penStart(end, q); return; }
    const a = anchorHit(q);
    if (a) { anchorDown(e, a); return; }
    penStart(null, q); return;
  }
  const a = anchorHit(q);
  if (a) { anchorDown(e, a); return; }
  selDown(e, q);
});
wireCv.addEventListener('pointermove', e => {
  const q = evPt(e);
  $('#coords').textContent = `x ${fmt(q.x * PT_MM, 1)} · y ${fmt(q.y * PT_MM, 1)} mm on the canvas`;
  if (AD) { anchorMove(q); return; }
  wireCv.style.cursor = !PEN && anchorHit(q) ? 'move' : '';
  if (S.tool === 'pen') penMove(e, q);
  else selMove(q);
});
wireCv.addEventListener('pointerup', () => { if (AD) { anchorUp(); invalidate(); return; } if (S.tool === 'select') selUp(); invalidate(); });
wireCv.addEventListener('dblclick', () => { if (S.tool === 'pen') penFinish(); });
wireCv.addEventListener('pointerleave', () => { $('#coords').textContent = ''; });

window.addEventListener('keydown', e => {
  if (e.target.matches('input,select,textarea')) return;
  const cmd = e.metaKey || e.ctrlKey;
  if (cmd && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (cmd) return;
  const k = e.key.toLowerCase();
  if (k === 'p') setTool('pen');
  else if (k === 'v') setTool('select');
  else if (k === 'a') { S.penArc = !S.penArc; syncTools(); if (PEN) kick(); }
  else if (e.key === '[' || e.key === ']') widen(e.key === ']' ? 1 : -1);
  else if (e.key.startsWith('Arrow') && S.selAnchors.length) {
    e.preventDefault();
    const st = pt(e.shiftKey ? 10 : 1), v = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    nudgeAnchors(v[0] * st, v[1] * st);
  }
  else if (e.key === 'Escape' && S.selAnchors.length) { S.selAnchors = []; kick(); }
  else if (e.key === 'Enter' || e.key === 'Escape') { penFinish(); if (e.key === 'Escape') { S.pick = null; invalidate(); } }
  else if ((e.key === 'Backspace' || e.key === 'Delete') && S.pick && !PEN) deleteRibbon(S.pick);
});

// ---------- tools and view ----------
const HINTS = {
  pen: 'Pen — click to place points; Alt-click or A for a tangent arc; double-click or Enter to finish. Click a ribbon\'s end to go on with it, elsewhere to start the next N.',
  select: 'Select — click a ribbon to pick it and drag it; drag a square to move one point, Shift-click for more. Arrows nudge 1 mm (Shift 10 mm); [ and ] narrow and widen it by a line.',
};
function setTool(t) { finishAll(); S.tool = t; syncTools(); save(); }
function syncTools() {
  document.querySelectorAll('.tool[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === S.tool));
  $('#btnArc').classList.toggle('armed', S.penArc);
  stage.className = 'stage t-' + S.tool;
  $('#hint').textContent = HINTS[S.tool];
}
function syncView() {
  document.querySelectorAll('.tog[data-view]').forEach(b => b.classList.toggle('on', !!S.view[b.dataset.view]));
  document.querySelectorAll('.tog.mode').forEach(b => b.classList.toggle('on', b.dataset.mode === 'geometry'));
}
function deleteRibbon(id) {
  if (!byId(id)) return;
  finishAll(); undoPush();
  S.ribbons = S.ribbons.filter(r => r.id !== id); built.delete(id);
  if (S.pick === id) { S.pick = null; S.selAnchors = []; }
  invalidate();
}
// One line more or less: 8 mm, the readout says both (NOLAN.md §2).
function widen(d) {
  const r = byId(S.pick); if (!r) return;
  const n = clampLines(r.n + d); if (n === r.n) return;
  undoPushSoft(); r.n = n; S.lines = n; invalidate();
}
document.querySelectorAll('.tool[data-tool]').forEach(b => b.onclick = () => setTool(b.dataset.tool));
document.querySelectorAll('.tog[data-view]').forEach(b => b.onclick = () => { S.view[b.dataset.view] = !S.view[b.dataset.view]; syncView(); invalidate(); });
$('#btnArc').onclick = () => { S.penArc = !S.penArc; syncTools(); };
$('#btnUndo').onclick = undo; $('#btnRedo').onclick = redo;
$('#btnDel').onclick = () => deleteRibbon(S.pick);
$('#format').innerHTML = NOLAN_FORMATS.map(k => `<option value="${k}">${FORMATS[k].label}</option>`).join('');
$('#format').onchange = e => { S.format = e.target.value; layout(); };

// ---------- the reference ----------
// An image under the canvas, the whole of it inside: traced, never painted
// as is. Kept in this browser, apart from Create's, 2000 px on its long side.
function setRef(src, name, store) {
  const img = new Image();
  img.onload = () => {
    REF = { img, name };
    if (store) {
      const k = Math.min(1, 2000 / Math.max(img.naturalWidth, img.naturalHeight));
      const cv = document.createElement('canvas'); cv.width = Math.round(img.naturalWidth * k); cv.height = Math.round(img.naturalHeight * k);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      try { localStorage.setItem(REF_KEY, JSON.stringify({ name, src: cv.toDataURL('image/jpeg', 0.9) })); } catch { }
    }
    syncRef(); invalidate();
  };
  img.src = src;
}
function syncRef() {
  $('#refThumb').innerHTML = REF ? `<img src="${REF.img.src}" alt="">` : '<span>no reference yet</span>';
  $('#refThumb').title = REF ? REF.name : '';
  $('#refOp').value = S.refOpacity;
  $('#refRead').innerHTML = REF ? `${esc(REF.name)} · <b>${S.refOpacity} %</b>` : 'Under the canvas, the whole of it inside.';
}
$('#btnRef').onclick = () => $('#refIn').click();
$('#refIn').onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  const rd = new FileReader(); rd.onload = () => setRef(rd.result, f.name, true); rd.readAsDataURL(f);
  e.target.value = '';
};
$('#refOp').oninput = e => { S.refOpacity = +e.target.value; syncRef(); invalidate(); };

// ---------- the panel ----------
const esc = v => String(v ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const setIf = (id, v) => { const el = $(id); if (el && document.activeElement !== el) el.value = v; };
let listShown = '', dragId = null;
// The ribbons by painting order; the grip drags one elsewhere and the names
// follow the new order (NOLAN.md §2: N1, N2, N3).
function renderRibbons() {
  const box = $('#ribbons');
  const sig = JSON.stringify([S.ribbons.map(r => [r.id, r.n, r.segs.length, Math.round(linesLength(linesOf(r)))]), S.pick]);
  if (sig === listShown) return;
  listShown = sig;
  if (!S.ribbons.length) { box.innerHTML = '<p class="none">No ribbons yet: draw the first with Pen (P).</p>'; return; }
  box.innerHTML = S.ribbons.map((r, i) => `
    <div class="rrow${r.id === S.pick ? ' on' : ''}" data-id="${r.id}">
      <span class="grip" title="Drag it up or down: the painting order">⋮⋮</span>
      <span class="rn">${ribbonName(i)}</span>
      <span class="rw">${widthLabel(r.n)}</span>
      <span class="rl">${fmt(linesLength(linesOf(r)) / 1000, 1)} m</span>
      <button class="x" title="Delete ${ribbonName(i)}">×</button>
    </div>`).join('');
  box.querySelectorAll('.rrow').forEach(row => {
    const id = row.dataset.id;
    row.onclick = e => { if (e.target.closest('button')) return; finishAll(); S.pick = id; S.selAnchors = []; invalidate(); };
    row.querySelector('.x').onclick = () => deleteRibbon(id);
    row.querySelector('.grip').onpointerdown = () => { row.draggable = true; };
    row.ondragstart = e => { dragId = id; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id); row.classList.add('dragging'); };
    row.ondragend = () => { row.draggable = false; dragId = null; box.querySelectorAll('.rrow').forEach(x => x.classList.remove('dragging', 'drop-before', 'drop-after')); };
    row.ondragover = e => {
      if (!dragId || dragId === id) return;
      e.preventDefault();
      const b = row.getBoundingClientRect(), before = e.clientY < b.top + b.height / 2;
      box.querySelectorAll('.rrow').forEach(x => x.classList.remove('drop-before', 'drop-after'));
      row.classList.add(before ? 'drop-before' : 'drop-after');
    };
    row.ondrop = e => {
      e.preventDefault(); if (!dragId || dragId === id) return;
      const before = row.classList.contains('drop-before');
      undoPush();
      const moving = byId(dragId); S.ribbons = S.ribbons.filter(r => r.id !== dragId);
      S.ribbons.splice(indexOf(id) + (before ? 0 : 1), 0, moving);
      invalidate();
    };
  });
}
function renderRibbon() {
  const r = byId(S.pick), box = $('#ribbonBox');
  $('#rName').textContent = r ? ribbonName(indexOf(r.id)) : '';
  if (!r) { box.innerHTML = '<p class="none">Pick a ribbon: click it with Select (V), or its row above.</p>'; delete box.dataset.id; return; }
  if (box.dataset.id !== r.id) {
    box.dataset.id = r.id;
    box.innerHTML = `<table>
      <tr><td>Width</td><td class="r"><span class="wstep"><button class="plus" data-w="-1" title="One line less ([)">−</button><span id="rWidth"></span><button class="plus" data-w="1" title="One line more (])">+</button></span></td></tr>
      <tr><td>Centre</td><td class="r" id="rSegs"></td></tr>
      <tr><td>Centre length</td><td class="r" id="rLen"></td></tr>
      <tr><td>All its lines</td><td class="r" id="rLines"></td></tr>
    </table><div id="rWarn"></div>`;
    box.querySelectorAll('[data-w]').forEach(b => b.onclick = () => widen(+b.dataset.w));
  }
  const L = linesOf(r), info = curveInfo(r.segs);
  $('#rWidth').textContent = widthLabel(r.n);
  $('#rSegs').textContent = r.segs.length ? [info.lines && `${info.lines} line${info.lines > 1 ? 's' : ''}`, info.arcs && `${info.arcs} arc${info.arcs > 1 ? 's' : ''}`].filter(Boolean).join(' + ') : '—';
  $('#rLen').textContent = r.segs.length ? `${fmt(info.length * PT_MM / 10, 1)} cm` : '—';
  $('#rLines').textContent = r.segs.length ? `${r.n} · ${fmt(linesLength(L) / 1000, 2)} m` : '—';
  $('#rWarn').innerHTML = L.warn.length ? `<p class="warn">${L.warn.length} bend${L.warn.length > 1 ? 's are' : ' is'} too tight for ${ribbonWidth(r)} mm: marked ! on the canvas. Open the bend or narrow the ribbon.</p>` : '';
}
function updatePanel() {
  renderRibbons(); renderRibbon();
  setIf('#cR', S.cornerR);
  const n = S.ribbons.reduce((a, r) => a + (r.segs.length ? r.n : 0), 0), m = S.ribbons.reduce((a, r) => a + linesLength(linesOf(r)), 0);
  $('#allLines').textContent = S.ribbons.length ? `${n} lines · ${fmt(m / 1000, 1)} m` : '—';
  const bad = S.ribbons.map((r, i) => linesOf(r).warn.length ? ribbonName(i) : null).filter(Boolean);
  $('#warn').innerHTML = bad.length ? `<p class="warn">Too tight a bend in ${bad.join(', ')}: marked ! on the canvas.</p>` : '';
  const f = F();
  $('#stats').textContent = `${f.label.split(' ')[0]} ${f.w} × ${f.h} mm · ${S.ribbons.length} ribbon${S.ribbons.length === 1 ? '' : 's'} · ${n} lines · ${fmt(m / 1000, 1)} m`;
}
$('#cR').onchange = e => { undoPush(); S.cornerR = Math.max(0, Math.round(+e.target.value || 0)); invalidate(); };

// ---------- kept in this browser ----------
let saveT = 0;
function save() { clearTimeout(saveT); saveT = setTimeout(saveNow, 300); }
function saveNow() {
  clearTimeout(saveT);
  try { localStorage.setItem(KEY, JSON.stringify({ format: S.format, ribbons: S.ribbons, cornerR: S.cornerR, lines: S.lines, tool: S.tool, view: S.view, refOpacity: S.refOpacity, angleSnap: S.angleSnap })); } catch { }
}
function load() {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (!o) return;
    if (NOLAN_FORMATS.includes(o.format)) S.format = o.format;
    if (Array.isArray(o.ribbons)) S.ribbons = o.ribbons.filter(r => r && r.id && Array.isArray(r.segs) && r.segs.length).map(r => ({ id: r.id, segs: r.segs, n: clampLines(r.n) }));
    if (Number.isFinite(o.cornerR)) S.cornerR = o.cornerR;
    if (Number.isFinite(o.lines)) S.lines = clampLines(o.lines);
    if (o.tool === 'pen' || o.tool === 'select') S.tool = o.tool;
    if (o.view) Object.assign(S.view, o.view);
    if (Number.isFinite(o.refOpacity)) S.refOpacity = o.refOpacity;
    if (o.angleSnap !== undefined) S.angleSnap = o.angleSnap;
  } catch { }
}
function loadRef() {
  try { const o = JSON.parse(localStorage.getItem(REF_KEY) || 'null'); if (o && o.src) setRef(o.src, o.name || 'reference', false); } catch { }
}

// ---------- start ----------
load();
$('#format').value = S.format;
syncTools(); syncView(); syncRef(); loadRef();
new ResizeObserver(layout).observe(stage);
addEventListener('rembrandt-night', () => invalidate());
addEventListener('beforeunload', saveNow);
layout();
