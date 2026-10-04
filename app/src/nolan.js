// Rembrandt · NOLAN — the ribbons, after nolan-images/IMG_9424.jpg (NOLAN.md).
// Built on the Test tab (the owner, 2026-10-04: "we are copying CREATE, which
// did not work for us — let's go back to TEST as the base"): its board, the
// canvas placed from the cup; its PROGRESS, keys, INK and sliders; its run,
// strokes.js's plotRun. From Create only the Tools on the left: the ribbons'
// centres drawn with Pen and Arc, their squares dragged.
//
// The ribbons are in pt from the canvas's centre, x across, y down
// (ribbon.js); the board, as on Test, in mm from Here — the canvas's centre
// — X up, Y to the right. Rows are the lines across a ribbon, the same for
// all of them, as Test's sliders go to all its passes.

import { PT_MM } from './config.js';
import { P, sub, add, len, dist, TAU, fmt } from './util.js';
import { segEnd, segDirEnd, tangentArc, anchorsOf, applyAnchorMove } from './geometry.js';
import { makeLine, snapArc, pushSeg } from './gesture.js';
import { nearestSeg, moveSegBy } from './curve.js';
import { reach } from './machine.js';
import { plotRun, DEFAULTS, TABLE_MM, WRIST_MAX, SPEED_MAX, ELBOW_LIFT } from './strokes.js';
import { ribbonLines, ribbonPasses, ribbonName, widthLabel, ribbonWidth, clampLines, linesLength, sketchRibbons, LINE_MM, MAX_LINES } from './ribbon.js';
import { segments, sticks } from './lcd.js';
import { lampSwitch, themeColor } from './lamp.js';
import { cupOf, cupProblem, drawCup, canvasFrom, dipAt } from './ink.js';
import './ui.js';

const $ = s => document.querySelector(s);
const KEY = 'rembrandt.nolan.v02', REF_KEY = 'rembrandt.nolan.ref';
const GROOVE = 1.5;     // mm of white between two lines on the board, so each reads on its own
const DIP_RUN = 720;    // mm a dip carries along a line (the owner, 2026-10-04: "all 720 mm will go easily"), est.

// ---------- state ----------
const S = {
  ribbons: [],          // [{ id, segs }] by painting order: N1, N2, N3 …
  rows: 12, pitch: 8, wave: 0, cornerR: 10,
  speed: 150, travel: 180, tail: 70, lift: true, ink: false,   // the brush as on the owner's Test of 2026-10-04 (est.)
  boardW: 500, boardH: 700,
  tool: 'pen', penArc: false, angleSnap: 15, refOpacity: 45,
};
let pick = null, selAnchors = [];   // the picked ribbon's id, its picked squares
let REF = null;                      // { img, name }
let idSeq = 0;
const newId = () => 'rb' + Date.now().toString(36) + (idSeq++).toString(36);
const byId = id => S.ribbons.find(r => r.id === id) || null;
const indexOf = id => S.ribbons.findIndex(r => r.id === id);
const sketch = () => sketchRibbons().map(r => ({ id: newId(), ...r }));
const lineOpts = () => ({ n: S.rows, pitch: S.pitch, wave: S.wave, cornerR: S.cornerR });
function load() {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (!o) return;
    for (const k of ['rows', 'pitch', 'wave', 'cornerR', 'speed', 'travel', 'tail', 'boardW', 'boardH', 'angleSnap', 'refOpacity']) if (Number.isFinite(o[k])) S[k] = o[k];
    for (const k of ['lift', 'ink']) if (typeof o[k] === 'boolean') S[k] = o[k];
    if (o.tool === 'pen' || o.tool === 'select') S.tool = o.tool;
    if (Array.isArray(o.ribbons)) S.ribbons = o.ribbons.filter(r => r && r.id && Array.isArray(r.segs) && r.segs.length).map(r => ({ id: r.id, segs: r.segs }));
  } catch { }
  S.rows = clampLines(S.rows);
}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { } };

// the lines of every ribbon, built again only when it changes
const built = new Map();
function linesOf(r) {
  const key = JSON.stringify([r.segs, lineOpts()]), hit = built.get(r.id);
  if (hit && hit.key === key) return hit.L;
  const L = ribbonLines(r, lineOpts());
  built.set(r.id, { key, L });
  return L;
}

// ---------- the cup and the canvas from it (Test's) ----------
let INK = {};
const cup = () => cupOf(INK);
async function loadInk() {
  try { const r = await fetch('/ink', { cache: 'no-store' }); INK = r.ok ? await r.json() : {}; } catch { INK = {}; }
}
// Here: the canvas's centre, from the cup and the two ruler numbers of the Ink tab (NOLAN.md §3)
const hereNow = () => canvasFrom(INK, S.boardW, S.boardH);
const dipCup = () => { const c = cup(), d = dipAt(c); return d ? { ...c, x: d.x, y: d.y } : c; };

// ---------- the plan: the ribbons as Test's run ----------
let PLAN = null, planKey = '';
function plan() {
  const here = hereNow(), key = JSON.stringify([S.ribbons, lineOpts(), S.speed, S.travel, S.tail, S.lift, S.ink, here, S.ink ? dipCup() : null]);
  if (PLAN && key === planKey) return PLAN;
  planKey = key;
  const { passes, rows } = ribbonPasses(S.ribbons, { ...lineOpts(), ink: S.ink });
  const o = { ...DEFAULTS, speed: S.speed, travel: S.travel, tail: S.tail, lift: S.lift, ink: S.ink, snake: true, pause: false, rows: rows.length, here, cup: dipCup() };
  PLAN = { ...plotRun(o, passes), rows, passes: passes.map(p => p.key), ink: S.ink, opts: o };
  return PLAN;
}

// ---------- the board ----------
const cv = $('#cv'), ctx = cv.getContext('2d'), stage = $('#stage'), board = $('#board');
const PAD_X = 20, PAD_Y = 20 + TABLE_MM;   // the table round the canvas, as on Test
function view() {
  const P_ = plan(), v = { x0: -S.boardH / 2 - PAD_X, x1: S.boardH / 2 + PAD_X, y0: -S.boardW / 2 - PAD_Y, y1: S.boardW / 2 + PAD_Y };
  if (P_.ink && hereNow()) {
    const e = cup().diameter / 2 * 1.7 + 6, home = 24;
    for (const [q, m] of [...(P_.cupAt ? [[P_.cupAt, e]] : []), [P_.homeAt, home]]) { v.x0 = Math.min(v.x0, q.x - m); v.x1 = Math.max(v.x1, q.x + m); v.y0 = Math.min(v.y0, q.y - m); v.y1 = Math.max(v.y1, q.y + m); }
  }
  return v;
}
let V = view(), k = 1, dpr = 1;
const kPt = () => k * PT_MM;
// the ribbons' pt → the screen: across is Y, down the picture is −X
const toScr = q => P((q.x * PT_MM - V.y0) * k, (V.x1 + q.y * PT_MM) * k);
const docT = c => c.setTransform(dpr * kPt(), 0, 0, dpr * kPt(), -V.y0 * k * dpr, V.x1 * k * dpr);
const scrT = c => c.setTransform(dpr, 0, 0, dpr, 0, 0);
const font = (px, w = '') => `${w} ${px}px ` + getComputedStyle(document.body).getPropertyValue('--mono');
function layout() {
  V = view();
  const r = stage.getBoundingClientRect(), m = 36, sw = V.y1 - V.y0, sh = V.x1 - V.x0;
  k = Math.max(0.2, Math.min((r.width - 2 * m) / sw, (r.height - 2 * m) / sh));
  dpr = window.devicePixelRatio || 1;
  const w = Math.round(sw * k), h = Math.round(sh * k);
  board.style.width = w + 'px'; board.style.height = h + 'px';
  cv.style.width = w + 'px'; cv.style.height = h + 'px'; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  draw();
}
let drawSoon = 0;
const kick = () => { if (!drawSoon) drawSoon = requestAnimationFrame(() => { drawSoon = 0; draw(); }); };
function tracePath(c, segs) {
  let first = true;
  for (const g of segs) {
    if (g.t === 'L') { if (first) c.moveTo(g.a.x, g.a.y); c.lineTo(g.b.x, g.b.y); }
    else { if (first) c.moveTo(g.c.x + g.r * Math.cos(g.a0), g.c.y + g.r * Math.sin(g.a0)); c.arc(g.c.x, g.c.y, g.r, g.a0, g.a0 + g.s, g.s < 0); }
    first = false;
  }
}
function pathOf(c, segs) { c.beginPath(); c.save(); docT(c); tracePath(c, segs); c.restore(); }
function draw() { scrT(ctx); drawOn(ctx, k, cv.width / dpr, cv.height / dpr, true); drawTrail(ctx); }
// The board on c, kk px a mm; wire: the centres, the squares and the pen too.
function drawOn(c, kk, W, H, wire) {
  const P_ = plan(), sx = y => (y - V.y0) * kk, sy = x => (V.x1 - x) * kk, hw = S.boardW / 2, hh = S.boardH / 2;
  c.fillStyle = themeColor('--stage', '#E2DED6'); c.fillRect(0, 0, W, H);   // the table, dark by night
  c.fillStyle = '#FCFBF8'; c.fillRect(sx(-hw), sy(hh), S.boardW * kk, S.boardH * kk);
  if (REF) {                                                                // the reference, the whole of it inside the canvas
    const img = REF.img, s = Math.min(S.boardW / img.naturalWidth, S.boardH / img.naturalHeight), w = img.naturalWidth * s, h = img.naturalHeight * s;
    c.save(); c.globalAlpha = S.refOpacity / 100; c.drawImage(img, sx(-w / 2), sy(h / 2), w * kk, h * kk); c.restore();
  }
  c.strokeStyle = 'rgba(36,34,31,.8)'; c.lineWidth = 1; c.strokeRect(sx(-hw) + .5, sy(hh) + .5, S.boardW * kk - 1, S.boardH * kk - 1);
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (P_.ink && hereNow()) {                                                // INK ON: the brush's way in the air, dashed
    c.save(); c.setLineDash([3, 4]); c.strokeStyle = themeColor('--mute', '#7D776D'); c.lineWidth = 1;
    for (const [a, b] of P_.air) { c.beginPath(); c.moveTo(sx(a.y), sy(a.x)); c.lineTo(sx(b.y), sy(b.x)); c.stroke(); }
    c.restore();
  }
  // the lines as the brush leaves them, thinner in the tails; a groove between neighbours
  const wMm = Math.max(1, Math.min(LINE_MM, S.pitch) - GROOVE);
  c.strokeStyle = 'rgba(40,38,35,.62)'; c.lineCap = 'butt';
  for (const line of P_.preview) {
    const wd = i => Math.round(10 * Math.max(0.15, (line[i - 1].k + line[i].k) / 2)) / 10;
    for (let i = 1; i < line.length;) {
      const w = wd(i);
      c.lineWidth = wMm * kk * w;
      c.beginPath(); c.moveTo(sx(line[i - 1].y), sy(line[i - 1].x));
      while (i < line.length && wd(i) === w) { c.lineTo(sx(line[i].y), sy(line[i].x)); i++; }
      c.stroke();
    }
  }
  c.lineCap = 'round';
  c.strokeStyle = '#EB7A25'; c.lineWidth = 1.5;                            // Here: the canvas's centre
  c.beginPath(); c.moveTo(sx(-8), sy(0)); c.lineTo(sx(8), sy(0)); c.moveTo(sx(0), sy(-8)); c.lineTo(sx(0), sy(8)); c.stroke();
  c.font = font(10); c.fillStyle = '#B3470C';
  c.fillText(`canvas ${S.boardW} × ${S.boardH} mm`, sx(-hw), sy(hh) - 6);
  if (P_.ink && hereNow()) {                                                // the cup, the red scope of the Ink tab; home
    const ink = themeColor('--ink', '#24221F');
    if (P_.cupAt) {
      const X = sx(P_.cupAt.y), Y = sy(P_.cupAt.x), r = cup().diameter / 2 * kk;
      drawCup(c, X, Y, r);
      c.fillStyle = ink; c.textAlign = 'left'; c.fillText(`cup ⌀${cup().diameter}`, X + r * 1.7 + 4, Y + 3);
    }
    const hX = sx(P_.homeAt.y), hY = sy(P_.homeAt.x);
    c.strokeStyle = ink; c.lineWidth = 1.2; c.strokeRect(hX - 4, hY - 4, 8, 8);
    c.fillStyle = ink; c.textAlign = 'left'; c.fillText('home', hX + 8, hY - 6);
  }
  if (wire) drawWire(c);
}
// The centres dashed orange, the squares, the names, a bend too tight; the pen.
function drawWire(c) {
  S.ribbons.forEach((r, i) => {
    if (!r.segs.length) return;
    const on = r.id === pick, L = linesOf(r);
    pathOf(c, L.centre); c.strokeStyle = on ? '#EB7A25' : 'rgba(235,122,37,.7)'; c.lineWidth = on ? 1.8 : 1.2;
    c.setLineDash([6, 5]); c.stroke(); c.setLineDash([]);
    const as = anchorsOf(r);
    as.forEach((q, j) => {
      const s = toScr(q), picked = on && selAnchors.includes(j), h = on ? 5 : 4;
      c.fillStyle = picked ? '#EB7A25' : '#fff'; c.strokeStyle = on ? '#24221F' : 'rgba(36,34,31,.55)'; c.lineWidth = on ? 1.5 : 1;
      c.fillRect(s.x - h, s.y - h, 2 * h, 2 * h); c.strokeRect(s.x - h, s.y - h, 2 * h, 2 * h);
    });
    const a = toScr(as[0]);
    c.font = font(13, '600'); c.fillStyle = '#EB7A25'; c.textAlign = 'left'; c.fillText(ribbonName(i), a.x + 9, a.y - 9);
    for (const q of L.warn) {
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
  if (g.t === 'L') return `Line ${fmt(Math.atan2(-(g.b.y - g.a.y), g.b.x - g.a.x) * 180 / Math.PI, 0)}° · ${fmt(dist(g.a, g.b) * PT_MM / 10, 1)} cm`;
  return `Arc ${fmt(Math.abs(g.s) * 180 / Math.PI, 0)}° · r ${fmt(g.r * PT_MM / 10, 1)} cm`;
}
// The run as it goes (Test's): where the carriage has been since PLAY.
let trail = [], trailOf = null;
function drawTrail(c) {
  if (!hereNow() || !trail.length) return;
  const sx = y => (y - V.y0) * k, sy = x => (V.x1 - x) * k, last = trail.at(-1);
  c.save(); c.strokeStyle = '#EB7A25'; c.lineWidth = 1.2; c.lineJoin = 'round';
  c.beginPath(); trail.forEach((q, i) => (i ? c.lineTo : c.moveTo).call(c, sx(q.y), sy(q.x))); c.stroke();
  if (last.live) { c.fillStyle = '#EB7A25'; c.beginPath(); c.arc(sx(last.y), sy(last.x), 4, 0, Math.PI * 2); c.fill(); }
  c.restore();
}

// ---------- the ribbons: drawn and edited (Create's Tools) ----------
let undoStack = [], redoStack = [];
const snapshot = () => JSON.stringify({ ribbons: S.ribbons, pick });
function undoPush() { undoStack.push(snapshot()); if (undoStack.length > 200) undoStack.shift(); redoStack = []; }
let lastSoft = 0;
function undoPushSoft() { const t = performance.now(); if (t - lastSoft > 700) undoPush(); lastSoft = t; }
function restore(js) { const o = JSON.parse(js); S.ribbons = o.ribbons; pick = byId(o.pick) ? o.pick : null; selAnchors = []; update(); }
function undo() { finishAll(); if (!undoStack.length) return; redoStack.push(snapshot()); restore(undoStack.pop()); }
function redo() { if (!redoStack.length) return; undoStack.push(snapshot()); restore(redoStack.pop()); }

function evPt(e) {
  const r = cv.getBoundingClientRect(), Y = (e.clientX - r.left) / k + V.y0, X = V.x1 - (e.clientY - r.top) / k;
  return P(Y / PT_MM, -X / PT_MM);
}
const tol = () => 5 / kPt(), near = () => 8 / kPt();
function anchorHit(q) {                                   // a square, the topmost ribbon first: { id, i }
  for (let j = S.ribbons.length - 1; j >= 0; j--) {
    const r = S.ribbons[j];
    let best = null, bd = near();
    anchorsOf(r).forEach((a, i) => { const d = dist(a, q); if (d < bd) { bd = d; best = i; } });
    if (best !== null) return { id: r.id, i: best };
  }
  return null;
}
function endHit(q) {                                      // a ribbon's end: the pen goes on with it
  for (let j = S.ribbons.length - 1; j >= 0; j--) {
    const r = S.ribbons[j], last = r.segs.at(-1);
    if (last && dist(q, segEnd(last)) < near()) return r.id;
  }
  return null;
}
function ribbonHit(q) {                                   // anywhere across its width, the topmost first
  for (let j = S.ribbons.length - 1; j >= 0; j--) {
    const r = S.ribbons[j];
    if (r.segs.length && nearestSeg(r.segs, q, Math.max(tol(), (ribbonWidth(S.rows, S.pitch) / 2) / PT_MM)) !== null) return r.id;
  }
  return null;
}
// Pen: click — a point; A or Alt — a tangent arc. On a ribbon's end it goes
// on with that ribbon; elsewhere it starts the next N.
let PEN = null;
function penSeg(q, e) {
  if ((S.penArc !== !!e.altKey) && PEN.tan) { const g = tangentArc(PEN.anchor, PEN.tan, q); if (g) return snapArc(g); }
  if (dist(q, PEN.anchor) < tol()) return null;
  return makeLine(PEN.anchor, q, PEN.tan, S.angleSnap);
}
function penStart(id, q) {
  undoPush();
  let r = byId(id);
  if (!r) { r = { id: newId(), segs: [] }; S.ribbons.push(r); }
  const last = r.segs.at(-1);
  PEN = last ? { id: r.id, anchor: segEnd(last), tan: segDirEnd(last), prov: null, added: 0 } : { id: r.id, anchor: q, tan: null, prov: null, added: 0 };
  pick = r.id; selAnchors = [];
  update();
}
function penDown(e, q) {
  const g = penSeg(q, e); if (!g) return;
  pushSeg(byId(PEN.id), g); PEN.added++;
  PEN.anchor = segEnd(g); PEN.tan = segDirEnd(g); PEN.prov = null;
  update();
}
function penFinish() {
  if (!PEN) return;
  const added = PEN.added; PEN = null;
  if (!added) { const was = undoStack.pop(); if (was) restore(was); }   // nothing drawn: as it was
  update();
}
const finishAll = () => penFinish();
let DRAG = null, AD = null;
function selDown(q) {
  const id = ribbonHit(q);
  pick = id; selAnchors = [];
  if (id) { undoPush(); DRAG = { id, last: q, moved: false }; }
  update();
}
function anchorDown(e, hit) {
  if (pick !== hit.id) { pick = hit.id; selAnchors = []; }
  if (e.shiftKey) {
    const j = selAnchors.indexOf(hit.i);
    if (j >= 0) { selAnchors.splice(j, 1); kick(); return; }
    selAnchors.push(hit.i);
  } else if (!selAnchors.includes(hit.i)) selAnchors = [hit.i];
  const r = byId(hit.id);
  undoPush();
  AD = { id: hit.id, orig: JSON.parse(JSON.stringify(r.segs)), start: anchorsOf(r)[hit.i], from: null, moved: false };
  kick();
}
function nudgeAnchors(dx, dy) {
  const r = byId(pick); if (!r || !selAnchors.length) return;
  undoPushSoft();
  applyAnchorMove(r, JSON.parse(JSON.stringify(r.segs)), selAnchors, P(dx, dy));
  update();
}
cv.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  cv.setPointerCapture(e.pointerId);
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
  selDown(q);
});
cv.addEventListener('pointermove', e => {
  const q = evPt(e);
  if (AD) {
    if (!AD.from) AD.from = q;
    const delta = sub(add(AD.start, sub(q, AD.from)), AD.start);
    if (!AD.moved && len(delta) * kPt() < 1) return;
    AD.moved = true;
    applyAnchorMove(byId(AD.id), AD.orig, selAnchors, delta);
    updateSoon(); return;
  }
  cv.style.cursor = !PEN && anchorHit(q) ? 'move' : '';
  if (PEN) { PEN.prov = penSeg(q, e); kick(); return; }
  if (DRAG) {
    const d = sub(q, DRAG.last), r = byId(DRAG.id); DRAG.last = q; DRAG.moved = true;
    r.segs = r.segs.map(g => moveSegBy(g, d)); updateSoon();
  }
});
cv.addEventListener('pointerup', () => {
  if (AD) { if (!AD.moved) undoStack.pop(); AD = null; update(); return; }
  if (DRAG) { if (!DRAG.moved) undoStack.pop(); DRAG = null; update(); }
});
cv.addEventListener('dblclick', () => { if (S.tool === 'pen') penFinish(); });

const HINTS = {
  pen: 'Pen — click to place points; Alt-click or A for a tangent arc; double-click or Enter to finish. Click a ribbon\'s end to go on with it, elsewhere to start the next N.',
  select: 'Select — click a ribbon to pick it and drag it; drag a square to move one point, Shift-click for more. Arrows nudge 1 mm (Shift 10 mm).',
};
function setTool(t) { finishAll(); S.tool = t; syncTools(); save(); }
function syncTools() {
  document.querySelectorAll('.tool[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === S.tool));
  $('#btnArc').classList.toggle('armed', S.penArc);
  stage.className = 'stage t-' + S.tool;
  $('#hint').textContent = HINTS[S.tool];
}
function deleteRibbon(id) {
  if (!byId(id)) return;
  finishAll(); undoPush();
  S.ribbons = S.ribbons.filter(r => r.id !== id); built.delete(id);
  if (pick === id) { pick = null; selAnchors = []; }
  update();
}
document.querySelectorAll('.tool[data-tool]').forEach(b => b.onclick = () => setTool(b.dataset.tool));
$('#btnArc').onclick = () => { S.penArc = !S.penArc; syncTools(); };
$('#btnUndo').onclick = undo; $('#btnRedo').onclick = redo;
$('#btnDel').onclick = () => deleteRibbon(pick);
$('#btnDefault').onclick = () => { finishAll(); undoPush(); S.ribbons = sketch(); pick = null; selAnchors = []; update(); };
addEventListener('keydown', e => {
  if (e.key === 'Escape') post('/run/stop');              // Esc = STOP, as on Test and Calibration
  if (e.target.matches('input,select,textarea')) return;
  const cmd = e.metaKey || e.ctrlKey;
  if (cmd && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (cmd) return;
  const key = e.key.toLowerCase();
  if (key === 'p') setTool('pen');
  else if (key === 'v') setTool('select');
  else if (key === 'a') { S.penArc = !S.penArc; syncTools(); if (PEN) kick(); }
  else if (e.key.startsWith('Arrow') && selAnchors.length) {
    e.preventDefault();
    const st = (e.shiftKey ? 10 : 1) / PT_MM, v = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    nudgeAnchors(v[0] * st, v[1] * st);
  }
  else if (e.key === 'Enter' || e.key === 'Escape') { penFinish(); if (e.key === 'Escape') { pick = null; selAnchors = []; kick(); } }
  else if ((e.key === 'Backspace' || e.key === 'Delete') && pick && !PEN) deleteRibbon(pick);
});

// ---------- the panel: Test's sliders ----------
// Rows: the lines across a ribbon; Row to row: their pitch; Wave: the
// ribbon waving; then the brush as on Test.
const SLIDERS = [
  ['rows', 'Rows', '', 1, 1, MAX_LINES], ['pitch', 'Row to row', 'mm', 0.5, 4, 30, { label: 5 }],
  ['wave', 'Wave', 'mm', 1, 0, 30],
  ['speed', 'Brush on', 'mm/s', 1, 5, SPEED_MAX], ['travel', 'Between rows', 'mm/s', 5, 20, SPEED_MAX],
  ['tail', 'Tail', 'mm', 5, 20, 200],
];
function scale(step, min, max, label) {
  let h = '';
  for (let i = 0; min + i * step <= max + 1e-9; i++) {
    const v = min + i * step, lab = Math.abs(v / label - Math.round(v / label)) < 1e-9;
    h += `<i class="${lab ? 'major' : ''}" style="left:calc(9px + (100% - 18px) * ${(v - min) / (max - min)})">${lab ? `<span>${v}</span>` : ''}</i>`;
  }
  return `<div class="ticks">${h}</div>`;
}
const shown = (key, unit) => key === 'rows' ? `${S.rows} · ${widthLabel(S.rows, S.pitch).split(' · ')[0]}` : `${S[key]}${unit ? ' ' + unit : ''}`;
$('#sliders').innerHTML = SLIDERS.map(([key, label, , step, min, max, sc]) => `<label class="sl"><span class="slh"><span>${label}</span><span class="val" data-v="${key}"></span></span><input class="slider" type="range" data-k="${key}" min="${min}" max="${max}" step="${step}">${sc ? scale(step, min, max, sc.label) : ''}</label>`).join('');
let soon = 0;
const updateSoon = () => { if (!soon) soon = requestAnimationFrame(() => { soon = 0; update(); }); };
$('#sliders').querySelectorAll('input').forEach(inp => inp.oninput = () => { S[inp.dataset.k] = +inp.value; updateSoon(); });
const FIELDS = [['boardW', 'Board width', 'mm', 10], ['boardH', 'Board height', 'mm', 10]];
$('#fields').innerHTML = FIELDS.map(([key, label, unit, step]) => `<label>${label} <input data-k="${key}" type="number" step="${step}" min="${step}"><em>${unit}</em></label>`).join('');
$('#fields').querySelectorAll('input').forEach(inp => inp.onchange = () => { const v = +inp.value; if (v > 0) S[inp.dataset.k] = v; update(); });
$('#lift').onchange = e => { S.lift = e.target.checked; update(); };
$('#ink').onchange = e => { S.ink = e.target.checked; update(); };
$('#inkOff').onclick = () => { S.ink = false; update(); };
$('#inkOn').onclick = () => { S.ink = true; update(); };

function update() {
  const P_ = plan();
  for (const [key, , unit] of SLIDERS) {
    const inp = $(`#sliders input[data-k="${key}"]`);
    if (document.activeElement !== inp) inp.value = S[key];
    $(`#sliders [data-v="${key}"]`).textContent = shown(key, unit);
  }
  $('#fields').querySelectorAll('input').forEach(inp => { if (document.activeElement !== inp) inp.value = S[inp.dataset.k]; });
  $('#lift').checked = !!S.lift; $('#ink').checked = !!S.ink;
  $('#inkOff').classList.toggle('on', !S.ink); $('#inkOn').classList.toggle('on', !!S.ink);
  $('#lift').disabled = !!S.ink; $('#lift').parentElement.classList.toggle('off', !!S.ink);   // INK ON: every line on its own, no turns
  const C = cup(), est = key => C.est[key] ? ' (est.)' : '', inkWhy = S.ink ? cupProblem(C) : '';
  const nLines = P_.rows.length, names = P_.passes.join(' + ');
  const tight = S.ribbons.map((r, i) => linesOf(r).warn.length ? ribbonName(i) : null).filter(Boolean);
  const long = S.ink ? S.ribbons.reduce((a, r) => a + linesOf(r).lines.filter(l => linesLength({ lines: [l] }) > DIP_RUN).length, 0) : 0;
  const here = hereNow();
  $('#planRead').innerHTML = (names ? `${names}: ${P_.passes.length > 1 ? `${P_.passes.length} ribbons, a pause between them${S.ink ? '' : ' — CONTINUE when the one below is dry'} · ` : ''}` : 'No ribbons: draw one with Pen (P), or the house opens the three of the sketch. ')
    + (!nLines ? '' : P_.ink
      ? `<b>Ink ON</b>, the Watercolour run · ${nLines} lines, each on its own, a dip in the cup before every one — ${P_.dips || 'no'} dips, back to the cup after each line, home at the end · ${fmt(P_.length / 1000, 2)} m with the brush down, at ${S.speed} mm/s · ≈ ${fmt(P_.seconds / 60, 1)} min (est.) · the elbow over the rim +${C.rim}°${est('rim')}, in the cup ${C.dip > 0 ? '+' : ''}${C.dip}°${est('dip')}, ${C.dwell} s in the paint`
        + (inkWhy ? ` <span class="warn">${inkWhy}</span>` : '')
      : `the Paint run · each ribbon a snake of its ${S.rows} lines${S.lift ? ', the brush up through the turns' : ', the turns painted'} · ${fmt(P_.length / 1000, 2)} m with the brush down, at ${S.speed} mm/s · ≈ ${fmt(P_.seconds / 60, 1)} min (est.)`)
    + (nLines ? ` · the elbow eases the brush on and off over ${S.tail} mm of each line's ends, on the move, 0° pressed to +${ELBOW_LIFT}° off; up to ${fmt(P_.need, 0)}°/s (est.)` : '')
    + (P_.need > WRIST_MAX ? ` <span class="warn">The elbow goes ${WRIST_MAX}°/s at most on the move: a longer Tail or a slower brush.</span>` : '')
    + (tight.length ? ` <span class="warn">Too tight a bend for ${widthLabel(S.rows, S.pitch).split(' · ')[0]} in ${tight.join(', ')}: marked ! on the canvas — open the bend, fewer rows or less wave.</span>` : '')
    + (long ? ` <span class="hint">${long} line${long > 1 ? 's' : ''} longer than a dip carries (${DIP_RUN} mm, est.): split into runs is the next step.</span>` : '')
    + (P_.pastWall > 0.05 ? ` <span class="hint">${fmt(P_.pastWall, 0)} mm of the path past the machine's walls: pressed along them, as on the Job tab${P_.gone ? `; ${P_.gone} line${P_.gone > 1 ? 's' : ''} wholly past, left out` : ''}.</span>` : '')
    + (walls() ? ` <span class="warn">${walls()}</span>` : '')
    + (here ? ` · The canvas's centre, from the cup: carriage <b>X ${fmt(here.x, 1)} · Y ${fmt(here.y, 1)} mm</b>.`
      : ' <span class="warn">Where the canvas lies: measure it from the cup on the Ink tab — its left edge and its bottom edge, two ruler numbers.</span>');
  $('#stats').textContent = `${P_.blocks.length} steps · ${names || 'no ribbons'} · ${nLines} lines`;
  save(); layout();
}
// The machine's walls: the last guard before a run (Test's).
function walls() {
  const h = hereNow(), P_ = plan();
  if (!h || !P_.rows.length) return '';
  const R = reach(), b = P_.carriage, x0 = h.x + b.x0, x1 = h.x + b.x1, y0 = h.y + b.y0, y1 = h.y + b.y1;
  const out = [x0 < R.x.min && `${fmt(R.x.min - x0, 0)} mm past the bottom wall`, x1 > R.x.max && `${fmt(x1 - R.x.max, 0)} mm past the top wall`,
    y0 < R.y.min && `${fmt(R.y.min - y0, 0)} mm past the left wall`, y1 > R.y.max && `${fmt(y1 - R.y.max, 0)} mm past the right wall`].filter(Boolean);
  return out.length ? `The brush would go ${out.join(', ')}: move the canvas or the ribbons.` : '';
}

// ---------- the reference: under the canvas, the whole of it inside ----------
function setRef(src, name, store) {
  const img = new Image();
  img.onload = () => {
    REF = { img, name };
    if (store) {
      const kk = Math.min(1, 2000 / Math.max(img.naturalWidth, img.naturalHeight));
      const c2 = document.createElement('canvas'); c2.width = Math.round(img.naturalWidth * kk); c2.height = Math.round(img.naturalHeight * kk);
      c2.getContext('2d').drawImage(img, 0, 0, c2.width, c2.height);
      try { localStorage.setItem(REF_KEY, JSON.stringify({ name, src: c2.toDataURL('image/jpeg', 0.9) })); } catch { }
    }
    syncRef(); kick();
  };
  img.src = src;
}
// the round × on the picture takes the reference away (the owner, 2026-10-04)
function deleteRef() { REF = null; try { localStorage.removeItem(REF_KEY); } catch { } syncRef(); kick(); }
const esc = v => String(v ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
function syncRef() {
  $('#refThumb').innerHTML = REF ? `<img src="${REF.img.src}" alt=""><button class="refdel" title="Delete the reference">×</button>` : '<span>no reference yet</span>';
  if (REF) $('#refThumb .refdel').onclick = deleteRef;
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
$('#refOp').oninput = e => { S.refOpacity = +e.target.value; syncRef(); save(); kick(); };
function loadRef() { try { const o = JSON.parse(localStorage.getItem(REF_KEY) || 'null'); if (o && o.src) setRef(o.src, o.name || 'reference', false); } catch { } }

// ---------- 💾 SAVE NOLAN: into the Library ----------
// As SAVE TEST does: an SVG of the canvas in mm with its lines, the whole
// state in its metadata, a PNG preview. It sits on the tests' shelf for now
// (rembrandt.py knows paintings and tests); the Library opens it here.
const settingsNow = () => ({ ...S });
const nolanLabel = () => `NOLAN · ${plan().passes.join('+') || 'no ribbons'} · ${S.boardW} × ${S.boardH} mm · ${S.rows} rows${S.ink ? ' · ink' : ''}`;
function nolanSvg() {
  const W = S.boardW, H = S.boardH, f = v => (Math.round(v * 100) / 100).toFixed(2), wMm = Math.max(1, Math.min(LINE_MM, S.pitch) - GROOVE);
  const meta = JSON.stringify({ rembrandt: '0.2', nolan: true, label: nolanLabel(), settings: settingsNow() }).replace(/&/g, '\\u0026').replace(/</g, '\\u003c').replace(/--/g, '- -');
  const lines = plan().preview.flatMap(line => {
    const out = [], wd = i => Math.round(10 * Math.max(0.15, (line[i - 1].k + line[i].k) / 2)) / 10;
    for (let i = 1; i < line.length;) {
      const w = wd(i), pts = [line[i - 1]];
      while (i < line.length && wd(i) === w) pts.push(line[i++]);
      out.push(`  <path stroke-width="${f(wMm * w)}" d="M${pts.map(q => `${f(W / 2 + q.y)} ${f(H / 2 - q.x)}`).join(' L')}"/>`);
    }
    return out;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}">
<!-- Rembrandt v0.2 · ${nolanLabel()}; 1 unit = 1 mm -->
<metadata id="rembrandt-test">${meta}</metadata>
<rect width="${W}" height="${H}" fill="#FCFBF8" stroke="#24221F" stroke-width="0.5"/>
<g fill="none" stroke="#1B1A19" stroke-linecap="butt" stroke-linejoin="round">
${lines}
</g>
</svg>`;
}
function nolanPng() {
  const sw = V.y1 - V.y0, sh = V.x1 - V.x0, kk = 800 / Math.max(sw, sh), c2 = document.createElement('canvas');
  c2.width = Math.round(sw * kk); c2.height = Math.round(sh * kk);
  const keep = [k, dpr]; k = kk; dpr = 1;
  const c = c2.getContext('2d'); drawOn(c, kk, c2.width, c2.height, false);
  [k, dpr] = keep;
  return c2.toDataURL('image/png');
}
$('#btnSave').onclick = async () => {
  const st = $('#saveState'), b = $('#btnSave');
  b.disabled = true; st.textContent = 'saving…';
  try {
    const r = await fetch('/library', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ svg: nolanSvg(), png: nolanPng() }) });
    const o = await r.json();
    st.textContent = o.ok ? `saved · ${o.name}` : `not saved · ${o.message}`;
  } catch { st.textContent = 'not saved · start rembrandt.py'; }
  b.disabled = false;
};
// Opened from the Library (library.html → nolan.html?open=<file>).
async function openFromLibrary(file) {
  history.replaceState(null, '', location.pathname);
  try {
    const r = await fetch('library/' + encodeURIComponent(file) + '.svg', { cache: 'no-store' });
    if (!r.ok) throw new Error(r.status);
    const meta = new DOMParser().parseFromString(await r.text(), 'image/svg+xml').querySelector('metadata#rembrandt-test');
    const o = meta ? JSON.parse(meta.textContent.replace(/- -/g, '--')) : null;
    if (!o?.nolan) { $('#saveState').textContent = 'not a NOLAN save: open it on Test'; return; }
    undoPush();
    localStorage.setItem(KEY, JSON.stringify(o.settings || {})); load();
    update();
    $('#saveState').textContent = `opened · ${file.slice(0, 13)}:${file.slice(14)}`;
  } catch { $('#saveState').textContent = 'could not open it from the Library'; }
}

// ---------- the run (Test's) ----------
const post = async path => { try { const r = await fetch(path, { method: 'POST' }); return await r.text(); } catch { return 'start rembrandt.py'; } };
$('#btnDoJob').onclick = async () => {
  finishAll();
  await loadInk(); update();
  const P_ = plan();
  if (!hereNow()) { $('#runState').innerHTML = '<span class="warn">Where the canvas lies: measure it from the cup on the Ink tab first.</span>'; return; }
  if (!P_.rows.length) { $('#runState').innerHTML = '<span class="warn">No ribbons to run.</span>'; return; }
  if (S.ink && cupProblem(cup())) { $('#runState').innerHTML = `<span class="warn">Ink ON: ${cupProblem(cup())}</span>`; return; }
  if (walls()) { $('#runState').innerHTML = `<span class="warn">${walls()}</span>`; return; }
  if (!confirm(`${P_.passes.join(' + ')}: ${P_.rows.length} lines will be run on the machine${S.ink ? `, a dip in the cup before each: ${P_.dips} dips` : ''}`)) return;
  try {
    const r = await fetch('/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blocks: P_.blocks,
      log: { page: 'nolan', label: nolanLabel(), settings: settingsNow(), here: hereNow(), fromCup: INK.canvas, ...(S.ink ? { cup: cup() } : {}), estimate_s: Math.round(P_.seconds) } }) });   // the run journal, rembrandt.py
    $('#runState').textContent = await r.text();
  } catch { $('#runState').textContent = 'start rembrandt.py'; }
};
let paused = false;
$('#btnPause').onclick = () => post(paused ? '/run/continue' : '/run/pause');
$('#btnStop').onclick = () => post('/run/stop');
$('#btnKill').onclick = () => post('/run/kill');

// The LCD, as on Test: the percent by painted length, the time left and the total, where it is.
const mmss = t => { t = Math.max(0, Math.round(t || 0)); return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
let started = null;
function lcd(st) {
  const P_ = plan(), live = st && ['running', 'stopping', 'pausing', 'paused'].includes(st.state);
  const pct = st && st.state !== 'idle' ? (st.state === 'done' ? 100 : st.percent || 0) : 0;
  if (live && !started) started = st.started || Date.now() / 1000;
  if (!live) started = null;
  const total = P_.seconds, left = live && started && pct >= 3 ? (Date.now() / 1000 - started) * (100 - pct) / pct : total * (1 - pct / 100);
  const state = !st ? 'no server' : live ? (st.state === 'paused' ? 'paused' : 'live') : st.state === 'idle' ? 'plan' : st.state;
  const b = st && P_.blocks[st.block], row = b && P_.rows[b.row - 1];
  const waiting = st?.state === 'paused' && st.message;
  paused = ['paused', 'pausing'].includes(st?.state);
  const keyEl = $('#btnPause');
  keyEl.textContent = paused ? 'CONTINUE' : 'PAUSE';
  keyEl.classList.toggle('call', paused);
  keyEl.disabled = !live;
  const now = waiting ? `❚❚ ${st.message}`
    : live && b?.home ? 'done · the carriage goes home, the brush off'
    : live && row && b?.dip ? `${row.name} · line ${row.line} of ${row.of} · the dip in the cup`
    : live && row ? (P_.ink ? `${row.name} · line ${row.line} of ${row.of}` : `${row.name} · ${fmt(st.painted_mm / 10, 0)} of ${fmt(st.paint_mm / 10, 0)} cm`) + (st.brush_on ? ' · brush on' : ' · brush off')
    : `${P_.rows.length} lines · ${P_.passes.join('+') || 'no ribbons'}`;
  $('#lcd').innerHTML = `
    <div class="lcd-top"><span>${state === 'live' ? '▶ ' : state === 'paused' ? '❚❚ ' : ''}${state}</span><span>${live && st.blocks ? `step ${st.block + 1}/${st.blocks}` : `${fmt(P_.length / 1000, 2)} m`}</span></div>
    <div class="lcd-mid">
      <div class="lcd-big">${segments(String(Math.min(100, Math.floor(pct))).padStart(2, ' '), 46)}<span class="u">%</span></div>
      <div class="lcd-times">
        <span class="k">left</span>${segments(mmss(left), 17)}
        <span class="k">total</span>${segments(mmss(total), 17)}
      </div>
    </div>
    ${sticks(pct / 100)}
    <div class="lcd-now${waiting ? ' wait' : ''}">${now}</div>`;
}
async function watch() {
  let st = null;
  try { st = await (await fetch('/run', { cache: 'no-store' })).json(); } catch { }
  lcd(st);
  const live = st && ['running', 'stopping', 'pausing', 'paused'].includes(st.state);
  if (live && st.started !== trailOf) { trailOf = st.started; trail = []; }
  const h = hereNow();
  if (h && st && trailOf && st.started === trailOf && st.x_mm !== null && st.y_mm !== null) {
    const q = { x: st.x_mm - h.x, y: st.y_mm - h.y, live }, l = trail.at(-1);
    if (!l || Math.hypot(q.x - l.x, q.y - l.y) > 0.5 || l.live !== live) { trail.push(q); kick(); }
  }
  $('#runState').innerHTML = !st ? 'no server: start rembrandt.py' : st.message ? `<span class="${st.state === 'error' ? 'warn' : ''}">${st.message}</span>` : '';
}

// ---------- start ----------
load();
if (!S.ribbons.length) S.ribbons = sketch();
syncTools(); syncRef(); loadRef();
lampSwitch($('#lamp'));
addEventListener('rembrandt-night', () => kick());
setInterval(watch, 500);
new ResizeObserver(layout).observe(stage);
update(); watch();
loadInk().then(update);
addEventListener('focus', () => loadInk().then(update));   // back from the Ink tab
const opening = new URLSearchParams(location.search).get('open');   // from the Library
if (opening) openFromLibrary(opening);
