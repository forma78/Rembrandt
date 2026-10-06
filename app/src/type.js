// Rembrandt · TYPE — letters as bands, in three passes (Rembrandt.md §1; the
// owner, 2026-10-06; TYPE-Claude/TYPE.md and the prototype of Claude in
// chat). The text is laid out as bands (typeplan.js, the letters New Yuri's
// set); TRACE runs the outline of every band in watercolour from the cup,
// and the board shows it as it lies on the paper (band.js washOf, wash.js) —
// the realistic wash of NOLAN's Imprint, not a schematic outline (the owner:
// "not schematic as here, but as yours — realistic"). MARKS and DRAG come
// next. The page is New Yuri's — its board, the canvas from home, PROGRESS,
// TEST, INK — with a cassette deck of keys instead of PLAY (the owner,
// 2026-10-06: "like on old cassette recorders"); the shared modules are
// imported, so a fix reaches every tab.
//
// Canvas mm from its centre: x right, y down. The board, as on Test: mm from
// Here — the canvas's centre — X up, Y right.

import { fmt } from './util.js';
import { reach, homeCorner } from './machine.js';
import { plotRun, DEFAULTS, TABLE_MM, ELBOW_HOVER, tailIn } from './strokes.js';
import { cornerDots, TEST_MARGIN, washOf, DIP_RUN, NO_DIP, LOOP_SHARE } from './band.js';
import { layoutOf, fitHeight, sessionsOf, traceOf, traceRows, OVERLAPS } from './typeplan.js';
import { drawWash } from './wash.js';
import { segments, sticks } from './lcd.js';
import { lampSwitch, themeColor } from './lamp.js';
import { cupOf, cupProblem, drawCup, dipAt } from './ink.js';
import './ui.js';

const $ = s => document.querySelector(s);
const KEY = 'rembrandt.type.v04', REF_KEY = 'rembrandt.type.ref';
let GLYPHS = null;

// ---------- state ----------
// The text and its bands: the letters' height H, the band's width in % of H,
// the gap between letters and the lines' spacing (the prototype's: box to
// box, below 0 they overlap), the margin Fit to canvas keeps; x, y where the
// block's centre lies, moved by Select. The trace's line width (the owner,
// 2026-10-04: "the line, as you see, is 4 mm"); the speeds and Tail are New
// Yuri's, off the panel (the owner, 2026-10-06: "simplify as far as we can").
const S = {
  text: 'AM\nOUR', H: 160, band: 30, gap: -14, lead: 20, margin: 40, x: 0, y: 0, overlap: 'letters',
  width: 4, speed: 150, travel: 180, tail: 3, ink: true,                          // the brush (est.)
  boardW: 500, boardH: 700, edgeLeft: 50, edgeBottom: 0,                          // the canvas, and its edges from home, as on NOLAN
  refOpacity: 30,
};
const NUM = ['H', 'band', 'gap', 'lead', 'margin', 'x', 'y', 'width', 'speed', 'travel', 'tail', 'boardW', 'boardH', 'edgeLeft', 'edgeBottom', 'refOpacity'];
let FRESH = true;   // nothing kept yet: the text fitted to the canvas once the letters load
function load() {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (!o) return;
    for (const k of NUM) if (Number.isFinite(o[k])) S[k] = o[k];
    S.tail = tailIn(S.tail);
    if (typeof o.text === 'string') S.text = o.text;
    if (OVERLAPS.includes(o.overlap)) S.overlap = o.overlap;
    if (typeof o.ink === 'boolean') S.ink = o.ink;
    FRESH = false;
  } catch { }
}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { } };

// ---------- the bands, the trace ----------
let LAY = null, layKey = '';
function layNow() {
  if (!GLYPHS) return null;
  const key = JSON.stringify([S.text, S.H, S.band, S.gap, S.lead, S.x, S.y, S.overlap]);
  if (LAY && key === layKey) return LAY;
  layKey = key;
  LAY = layoutOf(GLYPHS, S);
  LAY.sessions = sessionsOf(LAY, S.overlap);
  return LAY;
}
const textLabel = () => layNow()?.lines.filter(Boolean).join(' / ') || '';

// ---------- the cup, and the canvas from home (New Yuri's) ----------
let INK = {};
const cup = () => cupOf(INK);
async function loadInk() {
  try { const r = await fetch('/ink', { cache: 'no-store' }); INK = r.ok ? await r.json() : {}; } catch { INK = {}; }
}
const hereNow = () => { const R = reach(); return { x: R.x.min + S.edgeBottom + S.boardH / 2, y: R.y.min + S.edgeLeft + S.boardW / 2 }; };
const dipCup = () => { const c = cup(), d = dipAt(c); return d ? { ...c, x: d.x, y: d.y } : c; };

// ---------- the run: TRACE ----------
// Every band's outline, one after another (typeplan.js, traceOf): round
// clockwise, on LOOP_SHARE of itself over its start, lifting off over all of
// that. INK ON: a dip, then outlines on what the brush holds while they keep
// within a dip run, an outline never split.
let PLAN = null, planKey = '', busy = false;
const EMPTY = { blocks: [], rows: [], preview: [], trace: [], outlines: 0, seconds: 0, length: 0, dips: 0, carriage: null, air: [], ink: false, fault: '' };
const runOpts = rows => ({ ...DEFAULTS, speed: S.speed, travel: S.travel, tail: S.tail, lift: false, ink: S.ink, snake: true, pause: false, rows, here: hereNow(), cup: dipCup(), noDipUnder: NO_DIP, hover: ELBOW_HOVER });
function plan() {
  const here = hereNow(), L = layNow(), key = JSON.stringify([layKey, !!L, S.width, S.speed, S.travel, S.tail, S.ink, here, S.ink ? dipCup() : null]);
  if (PLAN && key === planKey) return PLAN;
  planKey = key;
  if (!L?.segs.length) { PLAN = { ...EMPTY, lay: L }; return PLAN; }
  const trace = traceOf(L), R = traceRows(trace, S.ink);
  if (!R.ps.length) { PLAN = { ...EMPTY, lay: L }; return PLAN; }
  const o = runOpts(R.ps.length);
  PLAN = { ...plotRun(o, [{ key: 'TRACE', ps: R.ps, why: null }]), rows: R.info, outlines: R.ps.length, trace, lay: L, ink: S.ink, opts: o };
  return PLAN;
}

// ---------- the board (New Yuri's) ----------
const cv = $('#cv'), ctx = cv.getContext('2d'), stage = $('#stage'), board = $('#board');
let g = ctx;   // the context drawn on: the board's, or a PNG's for the Library
const PAD_X = 20, PAD_Y = 20 + TABLE_MM;
function view() {
  const v = { x0: -S.boardH / 2 - PAD_X, x1: S.boardH / 2 + PAD_X, y0: -S.boardW / 2 - PAD_Y, y1: S.boardW / 2 + PAD_Y }, h = hereNow();
  if (S.ink && h) {                                                                   // the cup and home on the table too
    const c = cup(), hc = homeCorner(), e = (c.diameter || 50) / 2 * 1.7 + 6;
    const at = [...(Number.isFinite(c.x) ? [[{ x: c.x - h.x, y: c.y - h.y }, e]] : []), [{ x: hc.x - h.x, y: hc.y - h.y }, 24]];
    for (const [q, m] of at) { v.x0 = Math.min(v.x0, q.x - m); v.x1 = Math.max(v.x1, q.x + m); v.y0 = Math.min(v.y0, q.y - m); v.y1 = Math.max(v.y1, q.y + m); }
  }
  const a = areaNow(), m = 16;
  if (a) { v.x0 = Math.min(v.x0, a.x0 - 60); v.x1 = Math.max(v.x1, a.x1 + m); v.y0 = Math.min(v.y0, a.y0 - 34); v.y1 = Math.max(v.y1, a.y1 + 4); }
  return v;
}
function areaNow() {
  const h = hereNow(), R = reach();
  return { x0: R.x.min - h.x, x1: R.x.max - h.x, y0: R.y.min - h.y, y1: R.y.max - h.y, R };
}
let V = view(), k = 1, dpr = 1;
const sx = p => (p[0] - V.y0) * k, sy = p => (V.x1 + p[1]) * k;   // canvas mm → the screen: across is Y, down the picture is −X
const toCanvas = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / k + V.y0, (e.clientY - r.top) / k - V.x1]; };
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
const font = (px, w = '') => `${w} ${px}px ` + getComputedStyle(document.body).getPropertyValue('--mono');
const INK_DARK = '#2A2826', ORANGE = '#EB7A25';
function draw() {
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const W = g.canvas.width / dpr, H = g.canvas.height / dpr, hw = S.boardW / 2, hh = S.boardH / 2;
  g.fillStyle = themeColor('--stage', '#E2DED6'); g.fillRect(0, 0, W, H);   // the table
  const area = areaNow(), ax = y => (y - V.y0) * k, ay = x => (V.x1 - x) * k, night = document.documentElement.classList.contains('night');
  const areaRect = () => g.rect(ax(area.y0), ay(area.x1), (area.y1 - area.y0) * k, (area.x1 - area.x0) * k);
  {                                                                                    // the grid every 100 mm, machine mm, as on Calibration
    const h = hereNow();
    g.save(); g.strokeStyle = night ? 'rgba(255,255,255,.05)' : 'rgba(36,34,31,.07)'; g.lineWidth = 1; g.fillStyle = themeColor('--mute', '#7D776D'); g.font = font(10);
    for (let x = Math.ceil((h.x + V.x0) / 100) * 100; x <= h.x + V.x1; x += 100) { const Y = ay(x - h.x); g.beginPath(); g.moveTo(0, Y); g.lineTo(W, Y); g.stroke(); g.textAlign = 'left'; g.fillText(`X ${x}`, 4, Y + 3); }
    for (let y = Math.ceil((h.y + V.y0) / 100) * 100; y <= h.y + V.y1; y += 100) { const X = ax(y - h.y); g.beginPath(); g.moveTo(X, 0); g.lineTo(X, H); g.stroke(); g.textAlign = 'center'; g.fillText(`Y ${y}`, X, H - 5); }
    g.restore();
    g.fillStyle = night ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.35)'; g.beginPath(); areaRect(); g.fill();
  }
  g.fillStyle = '#FCFBF8'; g.fillRect(sx([-hw]), sy([0, -hh]), S.boardW * k, S.boardH * k);   // the white canvas
  g.save(); g.beginPath(); g.rect(sx([-hw]), sy([0, -hh]), S.boardW * k, S.boardH * k); g.clip();   // past the walls: hatched
  g.beginPath(); g.rect(0, 0, W, H); areaRect(); g.clip('evenodd');
  g.strokeStyle = 'rgba(179,71,12,.45)'; g.lineWidth = 1;
  for (let d = -H; d < W; d += 7) { g.beginPath(); g.moveTo(d, H); g.lineTo(d + H, 0); g.stroke(); }
  g.restore();
  if (S.margin > 0 && S.margin < Math.min(hw, hh)) {                                   // the margin Fit to canvas keeps
    g.save(); g.setLineDash([4, 4]); g.strokeStyle = 'rgba(36,34,31,.12)'; g.lineWidth = 1;
    g.strokeRect(sx([-hw + S.margin]), sy([0, -hh + S.margin]), (S.boardW - 2 * S.margin) * k, (S.boardH - 2 * S.margin) * k); g.restore();
  }
  drawTrace();
  if (REF && S.refOpacity > 0) {                                                       // the reference as tracing paper
    const img = REF.img, s = Math.min(S.boardW / img.naturalWidth, S.boardH / img.naturalHeight), w = img.naturalWidth * s, h = img.naturalHeight * s;
    g.globalAlpha = S.refOpacity / 100; g.drawImage(img, sx([-w / 2]), sy([0, -h / 2]), w * k, h * k); g.globalAlpha = 1;
  }
  g.strokeStyle = 'rgba(36,34,31,.8)'; g.lineWidth = 1; g.strokeRect(sx([-hw]) + .5, sy([0, -hh]) + .5, S.boardW * k - 1, S.boardH * k - 1);
  {                                                                                    // the walls: dashed orange, named, as on Calibration
    const R = area.R, A = area;
    g.save(); g.strokeStyle = ORANGE; g.lineWidth = 1.2; g.setLineDash([6, 4]); g.beginPath(); areaRect(); g.stroke(); g.setLineDash([]);
    g.font = font(10); g.fillStyle = '#B3470C';
    g.textAlign = 'left'; g.fillText(`image area ${fmt(R.y.max - R.y.min)} × ${fmt(R.x.max - R.x.min)} mm`, ax(A.y0) + 4, ay(A.x1) - 5);
    g.textAlign = 'right'; g.fillText(`wall X +${fmt(R.x.max)}`, ax(A.y1) - 4, ay(A.x1) - 5);
    g.fillText(`wall X +${fmt(R.x.min)}`, ax(A.y1) - 4, ay(A.x0) + 13);
    g.textAlign = 'left'; g.fillText(`wall Y +${fmt(R.y.min)}`, ax(A.y0) + 4, ay(A.x0) + 13);
    g.textAlign = 'right'; g.fillText(`wall Y +${fmt(R.y.max)}`, ax(A.y1) - 4, ay(A.x0) + 25);
    g.restore();
  }
  g.strokeStyle = ORANGE; g.lineWidth = 1.5;                                           // Here: the canvas's centre
  g.beginPath(); g.moveTo(sx([-8]), sy([0, 0])); g.lineTo(sx([8]), sy([0, 0])); g.moveTo(sx([0]), sy([0, -8])); g.lineTo(sx([0]), sy([0, 8])); g.stroke();
  g.font = font(10); g.fillStyle = '#B3470C'; g.textAlign = 'left';
  g.fillText(`canvas ${S.boardW} × ${S.boardH} mm`, sx([-hw]), sy([0, -hh]) - 6);
  const h = hereNow(), msx = q => (q.y - V.y0) * k, msy = q => (V.x1 - q.x) * k, ink = themeColor('--ink', '#24221F');
  g.save(); g.strokeStyle = 'rgba(36,34,31,.55)'; g.lineWidth = 1;                     // TEST's dots: a small cross each, 20 mm in from the corners
  for (const d of cornerDots(S.boardW, S.boardH).dots) { const X = msx(d.at), Y = msy(d.at); g.beginPath(); g.moveTo(X - 5, Y); g.lineTo(X + 5, Y); g.moveTo(X, Y - 5); g.lineTo(X, Y + 5); g.stroke(); }
  g.restore();
  const hc = homeCorner(), home = { x: hc.x - h.x, y: hc.y - h.y }, hX = msx(home), hY = msy(home);   // home: the canvas lies from it
  g.strokeStyle = ink; g.lineWidth = 1.2; g.strokeRect(hX - 4, hY - 4, 8, 8); g.fillStyle = ink; g.textAlign = 'left'; g.fillText('home', hX + 8, hY - 6);
  if (S.ink) {                                                                         // INK ON: the cup's red scope, the way in the air
    if (PLAN && !busy) {
      g.save(); g.setLineDash([3, 4]); g.strokeStyle = themeColor('--mute', '#7D776D'); g.lineWidth = 1;
      for (const [a, c] of PLAN.air) { g.beginPath(); g.moveTo(msx(a), msy(a)); g.lineTo(msx(c), msy(c)); g.stroke(); }
      g.restore();
    }
    const c = dipCup();
    if (Number.isFinite(c.x) && Number.isFinite(c.y)) {
      const at = { x: c.x - h.x, y: c.y - h.y }, r = (cup().diameter || 50) / 2 * k;
      drawCup(g, msx(at), msy(at), r); g.fillStyle = ink; g.textAlign = 'left'; g.fillText(`cup ⌀${cup().diameter || 50}`, msx(at) + r * 1.7 + 4, msy(at) + 3);
    }
  }
  if (drag?.moved) {                                                                   // Select: a dashed frame round the text as it moves
    const b = blockBox();
    if (b) { g.save(); g.setLineDash([4, 4]); g.strokeStyle = ORANGE; g.lineWidth = 1; g.strokeRect(sx([b[0]]) - 6, sy([0, b[1]]) - 6, (b[2] - b[0]) * k + 12, (b[3] - b[1]) * k + 12); g.restore(); }
  }
  drawTrail();
}
// TRACE as it lies on the paper. INK ON: the watercolour (band.js washOf,
// wash.js) — fresh from the cup and paler along the dip run, a blot where the
// brush lands, darker where outlines cross, as NOLAN's Imprint. INK OFF, no
// dip: the outlines as the brush runs them, the line's width in true mm.
function drawTrace() {
  const P_ = plan();
  if (!P_.trace.length) return;
  if (S.ink) {
    P_.wash ??= washOf(P_.preview, [], [], S.width, areaNow());                       // pressed into the walls, as the run is
    drawWash(g, P_.wash, { sx, sy, k, width: S.width, black: false });
    return;
  }
  g.save(); g.strokeStyle = INK_DARK; g.lineWidth = Math.max(0.6, S.width * k); g.lineCap = 'round'; g.lineJoin = 'round';
  for (const t of P_.trace) { g.beginPath(); t.pts.forEach((p, j) => j ? g.lineTo(sx(p), sy(p)) : g.moveTo(sx(p), sy(p))); g.stroke(); }
  g.restore();
}
// The run as it goes (New Yuri's): red where the brush paints, light blue in the air.
let trail = [], trailOf = null, RUN = null, RUN_INFO = null;
const AIR = '#4FC3F7', PAPER = '#E5203A';
function drawTrail() {
  if (trail.length < 1) return;
  const msx = q => (q.y - V.y0) * k, msy = q => (V.x1 - q.x) * k, last = trail.at(-1);
  g.save(); g.lineWidth = 1.2;
  for (let i = 1; i < trail.length;) {
    const air = trail[i].air;
    g.strokeStyle = air ? AIR : PAPER; g.beginPath(); g.moveTo(msx(trail[i - 1]), msy(trail[i - 1]));
    for (; i < trail.length && trail[i].air === air; i++) g.lineTo(msx(trail[i]), msy(trail[i]));
    g.stroke();
  }
  if (last.live) { g.fillStyle = last.air ? AIR : PAPER; g.beginPath(); g.arc(msx(last), msy(last), 4, 0, Math.PI * 2); g.fill(); }
  g.restore();
}
const paints = b => b?.kind === 'move' && b.paintMM > 0;
function endOf(b) {
  const c = (b?.cmds || []).filter(c => /^[LAM] /.test(c)).at(-1);
  if (!c) return null;
  const t = c.split(' ').map(Number);
  return c[0] === 'A' ? { x: t[3], y: t[4] } : { x: t[1], y: t[2] };
}
function startOf(B, i) {
  for (let j = i - 1; j >= 0; j--) { const e = endOf(B[j]); if (e) return e; }
  return null;
}

// ---------- undo ----------
const UNDO_KEYS = ['text', 'H', 'band', 'gap', 'lead', 'margin', 'x', 'y', 'overlap', 'width'];
let undoStack = [], redoStack = [];
const snapshot = () => JSON.stringify(Object.fromEntries(UNDO_KEYS.map(k => [k, S[k]])));
function undoPush() { undoStack.push(snapshot()); if (undoStack.length > 200) undoStack.shift(); redoStack = []; }
function restore(js) { Object.assign(S, JSON.parse(js)); $('#text').value = S.text; settle(); }
function undo() { if (!undoStack.length) return; redoStack.push(snapshot()); restore(undoStack.pop()); }
function redo() { if (!redoStack.length) return; undoStack.push(snapshot()); restore(redoStack.pop()); }

// ---------- Select: the text moved as one block ----------
// The text is typed in its field and stands in the middle of the canvas; a
// drag on it moves it, the arrows a mm at a time, with ⇧ ten (the owner,
// 2026-10-06: the field and Select, as Claude in chat had it, plus the mouse).
function blockBox() {
  const L = layNow(); if (!L?.segs.length) return null;
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  for (const s of L.segs) for (const p of s.pts) { b[0] = Math.min(b[0], p[0] - L.R); b[1] = Math.min(b[1], p[1] - L.R); b[2] = Math.max(b[2], p[0] + L.R); b[3] = Math.max(b[3], p[1] + L.R); }
  return b;
}
function onBlock(p) {
  const L = layNow(); if (!L) return false;
  const r = L.R + S.width / 2;
  return L.segs.some(s => s.pts.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) <= r));
}
let drag = null;
cv.addEventListener('pointerdown', e => {
  if (e.button !== 0 || !onBlock(toCanvas(e))) return;
  undoPush();
  drag = { x: e.clientX, y: e.clientY, moved: false };
  cv.setPointerCapture(e.pointerId); stage.classList.add('drag');
});
cv.addEventListener('pointermove', e => {
  if (!drag) { cv.style.cursor = onBlock(toCanvas(e)) ? 'move' : ''; return; }
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (!drag.moved && Math.hypot(dx, dy) < 2) return;
  drag.x = e.clientX; drag.y = e.clientY; drag.moved = true; busy = true;
  S.x += dx / k; S.y += dy / k;
  kick();
});
cv.addEventListener('pointerup', () => {
  if (!drag) return;
  const d = drag; drag = null; stage.classList.remove('drag');
  if (!d.moved) undoStack.pop(); else { S.x = Math.round(S.x); S.y = Math.round(S.y); }
  settle();
});
function moveBlock(ddx, ddy) { if (!layNow()?.segs.length) return; undoPush(); S.x += ddx; S.y += ddy; settle(); }
function clearAll() { if (!S.text) return; undoPush(); S.text = ''; $('#text').value = ''; settle(); }
function fit() { if (!GLYPHS) return; S.H = fitHeight(GLYPHS, S, S.boardW, S.boardH, S.margin); S.x = 0; S.y = 0; }

const HINT = 'TYPE — type the text in its field; drag it on the canvas to move it, the arrows a mm, with ⇧ ten; TRACE runs its outlines in watercolour from the cup.';
$('#btnUndo').onclick = undo; $('#btnRedo').onclick = redo; $('#btnClear').onclick = clearAll;
addEventListener('keydown', e => {
  if (e.key === 'Escape') post('/run/stop');                                         // Esc = STOP, as on Test and NOLAN
  if (e.target.matches('input,select,textarea')) return;
  const cmd = e.metaKey || e.ctrlKey;
  if (cmd && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (cmd) return;
  const arrow = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
  if (arrow) { e.preventDefault(); const d = e.shiftKey ? 10 : 1; moveBlock(arrow[0] * d, arrow[1] * d); }
});

// ---------- the panel ----------
// OVERLAPS, INK; the text, its letters (the prototype's sliders); the line's
// width; Fit to canvas; the canvas from home, as New Yuri's.
const LETTER_SL = [['H', 'Letter height', 'mm', 1, 20, 700], ['band', 'Band width', '%', 0.5, 10, 45], ['gap', 'Letter gap', 'mm', 1, -120, 80],
  ['lead', 'Line spacing', 'mm', 1, -120, 120], ['margin', 'Margin', 'mm', 1, 0, 150], ['width', 'Line width', 'mm', 0.5, 1, 12]];
const FIELDS = [['boardW', 'Board width', 'mm', 10, 'The canvas across; it grows to the right'], ['boardH', 'Board height', 'mm', 10, 'The canvas up the machine; it grows upwards'],
  ['edgeLeft', 'Left edge →', 'mm', 1, 'The canvas\'s left edge, mm to the right of home', true], ['edgeBottom', 'Bottom edge ↑', 'mm', 1, 'The canvas\'s bottom edge, mm above home', true]];
$('#slLetters').innerHTML = LETTER_SL.map(([key, label, , step, min, max]) => `<label class="sl"${key === 'width' ? ' title="The watercolour line on the canvas (the owner, 2026-10-04: &quot;the line is 4 mm&quot;)"' : ''}><span class="slh"><span>${label}</span><span class="val" data-v="${key}"></span></span><input class="slider" type="range" data-k="${key}" min="${min}" max="${max}" step="${step}"></label>`).join('');
$('#slLetters').querySelectorAll('input').forEach(inp => {
  inp.oninput = () => { if (!busy) undoPush(); busy = true; S[inp.dataset.k] = +inp.value; showPanel(); kick(); };
  inp.onchange = () => settle();
});
$('#fields').innerHTML = FIELDS.map(([key, label, unit, step, title, any]) => `<label title="${title}">${label} <input data-k="${key}" type="number" step="${step}"${any ? '' : ` min="${step}"`}><em>${unit}</em></label>`).join('');
$('#fields').querySelectorAll('input').forEach(inp => inp.onchange = () => {
  const v = +inp.value, any = FIELDS.find(f => f[0] === inp.dataset.k)[5];
  if (inp.value !== '' && Number.isFinite(v) && (any || v > 0)) S[inp.dataset.k] = v;
  settle();
});
// the text: a new text is fitted to the canvas, in its middle (the prototype's)
let typing = 0;
$('#text').oninput = e => {
  if (!typing) undoPush();
  clearTimeout(typing);
  typing = setTimeout(() => { typing = 0; S.text = e.target.value; fit(); settle(); }, 250);
};
$('#btnFit').onclick = () => { undoPush(); fit(); settle(); };
document.querySelectorAll('[data-overlap]').forEach(b => b.onclick = () => { if (S.overlap === b.dataset.overlap) return; undoPush(); S.overlap = b.dataset.overlap; settle(); });
$('#planInfo').onclick = () => { $('#planRead').hidden = !$('#planRead').hidden; $('#planInfo').classList.toggle('on', !$('#planRead').hidden); };
$('#ink').onchange = e => { S.ink = e.target.checked; settle(); };
$('#inkOff').onclick = () => { S.ink = false; settle(); };
$('#inkOn').onclick = () => { S.ink = true; settle(); };
function showPanel() {
  for (const [key, , unit] of LETTER_SL) {
    const inp = $(`#slLetters input[data-k="${key}"]`); if (document.activeElement !== inp) inp.value = S[key];
    $(`#slLetters [data-v="${key}"]`).textContent = key === 'band' ? `${fmt(S.band, 1)} % · ${fmt(S.band / 100 * S.H, 0)} mm` : `${Math.round(S[key] * 100) / 100} ${unit}`;
  }
  document.querySelectorAll('[data-overlap]').forEach(b => b.classList.toggle('on', b.dataset.overlap === S.overlap));
  $('#fields').querySelectorAll('input').forEach(inp => { if (document.activeElement !== inp) inp.value = S[inp.dataset.k]; });
  if (document.activeElement !== $('#text') && !typing) $('#text').value = S.text;
  $('#ink').checked = S.ink; $('#inkOff').classList.toggle('on', !S.ink); $('#inkOn').classList.toggle('on', S.ink);
}
// Settled: the mouse let go, a slider let go — the plan, the reading, the LCD.
function settle() {
  busy = false;
  const P_ = plan(), L = P_.lay, C = cup(), est = key => C.est?.[key] ? ' (est.)' : '', here = hereNow();
  const ses = L?.sessions || 0, long = S.ink ? P_.rows.filter(r => r.L > DIP_RUN) : [];
  $('#planRead').innerHTML = (!GLYPHS ? 'The letters are loading.' : !L?.segs.length ? 'No text: type it in the Text field.' :
    `<b>${L.letters}</b> letter${L.letters === 1 ? '' : 's'}, <b>${L.segs.length}</b> bands, band <b>${fmt(L.W, 0)} mm</b> wide, letters <b>${fmt(S.H, 0)} mm</b> tall; `
    + `<b>${ses}</b> session${ses === 1 ? '' : 's'} for MARKS and DRAG${ses > 1 ? ', each dry before the next' : ''} · `
    + `TRACE: <b>${P_.outlines}</b> outlines in watercolour, each round clockwise and on ${LOOP_SHARE * 100} % over its start, the brush lifting off over all of that · `
    + (S.ink ? `<b>Ink ON</b>: a dip, then outlines on what the brush holds up to ${DIP_RUN} mm (est.), an outline never split, ${P_.dips} dips; the elbow over the rim +${C.rim}°${est('rim')}, in the cup ${C.dip > 0 ? '+' : ''}${C.dip}°${est('dip')}, ${C.dwell} s in the paint · ` : 'Ink OFF: no dip · ')
    + `${fmt(P_.length / 1000, 2)} m with the brush down, at ${S.speed} mm/s · ≈ ${fmt(P_.seconds / 60, 1)} min (est.)`
    + (long.length ? ` · Longer than a dip run with their lap, each on one dip, the wash paling before it ends: ${long.map(r => `${r.label.split(' · ').slice(0, 2).join(' ')} (${fmt(r.L, 0)} mm)`).join(', ')}` : ''))
    + ` · The canvas from home: its bottom left corner at carriage <b>X ${fmt(here.x - S.boardH / 2, 1)} · Y ${fmt(here.y - S.boardW / 2, 1)} mm</b>; TEST's dots ${TEST_MARGIN} mm in from its edges.`;
  const warn = [S.ink ? cupProblem(C) : '', P_.fault && `The plan is wrong, TRACE will not run it: ${P_.fault}.`, offCanvas(), walls()].filter(Boolean);
  $('#planWarn').innerHTML = warn.map(w => `<span class="warn">${w}</span>`).join(' ');
  $('#planWarn').hidden = !warn.length;
  $('#stats').textContent = !P_.outlines ? 'no text' : `${P_.outlines} outlines · ${fmt(P_.length / 1000, 1)} m of line · ≈ ${fmt(P_.seconds / 60, 1)} min (est.) · ${ses} session${ses === 1 ? '' : 's'} · ${P_.blocks.length} steps`;
  showPanel(); save(); layout(); lastLcd && lcd(lastLcd);
}
// letters past the canvas's edges
function offCanvas() {
  const hw = S.boardW / 2, hh = S.boardH / 2, e = S.width / 2, out = new Set();
  for (const t of PLAN?.trace || []) if (t.pts.some(p => p[0] - e < -hw || p[0] + e > hw || p[1] - e < -hh || p[1] + e > hh)) out.add(t.ch);
  return out.size ? `${[...out].join(', ')}: past the canvas's edge — the trace goes on the board under it.` : '';
}
function walls() {
  const h = hereNow(), P_ = PLAN;
  if (!P_?.carriage || !P_.rows.length) return '';
  const R = reach(), b = P_.carriage, x0 = h.x + b.x0, x1 = h.x + b.x1, y0 = h.y + b.y0, y1 = h.y + b.y1;
  const out = [x0 < R.x.min && `${fmt(R.x.min - x0, 0)} mm past the bottom wall`, x1 > R.x.max && `${fmt(x1 - R.x.max, 0)} mm past the top wall`,
    y0 < R.y.min && `${fmt(R.y.min - y0, 0)} mm past the left wall`, y1 > R.y.max && `${fmt(y1 - R.y.max, 0)} mm past the right wall`].filter(Boolean);
  return out.length ? `The brush would go ${out.join(', ')}: move the canvas or the text.` : '';
}

// ---------- the reference: tracing paper over the canvas (New Yuri's) ----------
let REF = null;
function setRef(src, name, store) {
  const img = new Image();
  img.onload = () => {
    REF = { img, name };
    if (store) {
      const kk = Math.min(1, 2000 / Math.max(img.naturalWidth, img.naturalHeight)), c2 = document.createElement('canvas');
      c2.width = Math.round(img.naturalWidth * kk); c2.height = Math.round(img.naturalHeight * kk);
      c2.getContext('2d').drawImage(img, 0, 0, c2.width, c2.height);
      try { localStorage.setItem(REF_KEY, JSON.stringify({ name, src: c2.toDataURL('image/jpeg', 0.9) })); } catch { }
    }
    syncRef(); kick();
  };
  img.src = src;
}
function deleteRef() { REF = null; try { localStorage.removeItem(REF_KEY); } catch { } syncRef(); kick(); }
const esc = v => String(v ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
function syncRef() {
  $('#refThumb').innerHTML = REF ? `<img src="${REF.img.src}" alt=""><button class="refdel" title="Delete the reference">×</button>` : '<span>no reference yet</span>';
  if (REF) $('#refThumb .refdel').onclick = deleteRef;
  $('#refOp').value = S.refOpacity;
  $('#refRead').innerHTML = REF ? `${esc(REF.name)} · <b>${S.refOpacity} %</b>` : 'Over the canvas, the whole of it inside, to set the letters to.';
}
$('#btnRef').onclick = () => $('#refIn').click();
$('#refIn').onchange = e => { const f = e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => setRef(rd.result, f.name, true); rd.readAsDataURL(f); e.target.value = ''; };
$('#refOp').oninput = e => { S.refOpacity = +e.target.value; syncRef(); save(); kick(); };
function loadRef() { try { const o = JSON.parse(localStorage.getItem(REF_KEY) || 'null'); if (o && o.src) setRef(o.src, o.name || 'reference', false); } catch { } }

// ---------- 💾 SAVE TYPE ----------
// As SAVE NEW YURI: an SVG of the canvas in mm, the trace's outlines in it,
// the whole state in its metadata, a PNG preview; on the tests' shelf, its
// label TYPE — the Library opens it here.
const label = () => `TYPE · ${textLabel() || 'no text'} · ${S.boardW} × ${S.boardH} mm${S.ink ? ' · ink' : ''}`;
function svgOf() {
  const W = S.boardW, H = S.boardH, f = v => (Math.round(v * 100) / 100).toFixed(2);
  const meta = JSON.stringify({ rembrandt: '0.4', type: true, label: label(), settings: S }).replace(/&/g, '\\u0026').replace(/</g, '\\u003c').replace(/--/g, '- -');
  const lines = (plan().trace || []).map(t => `  <polyline points="${t.pts.slice(0, t.pts.length).map(p => `${f(W / 2 + p[0])},${f(H / 2 + p[1])}`).join(' ')}"/>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}">
<!-- Rembrandt v0.4 · ${esc(label())}; 1 unit = 1 mm; TRACE, each outline with its lap -->
<metadata id="rembrandt-test">${meta}</metadata>
<rect width="${W}" height="${H}" fill="#FCFBF8" stroke="#24221F" stroke-width="0.5"/>
<g fill="none" stroke="#4A108C" stroke-opacity="0.5" stroke-width="${f(S.width)}" stroke-linejoin="round">
${lines}
</g>
</svg>`;
}
function pngOf() {
  const keep = [g, k, dpr], sw = V.y1 - V.y0, sh = V.x1 - V.x0, kk = 800 / Math.max(sw, sh), c2 = document.createElement('canvas');
  c2.width = Math.round(sw * kk); c2.height = Math.round(sh * kk);
  g = c2.getContext('2d'); k = kk; dpr = 1;
  try { draw(); } finally { [g, k, dpr] = keep; }
  return c2.toDataURL('image/png');
}
$('#btnSave').onclick = async () => {
  const st = $('#saveState'), b = $('#btnSave');
  b.disabled = true; st.textContent = 'saving…';
  try {
    const r = await fetch('/library', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ svg: svgOf(), png: pngOf() }) });
    const o = await r.json();
    st.textContent = o.ok ? `saved · ${o.name}` : `not saved · ${o.message}`;
  } catch { st.textContent = 'not saved · start rembrandt.py'; }
  b.disabled = false;
};
async function openFromLibrary(file) {
  history.replaceState(null, '', location.pathname);
  try {
    const r = await fetch('library/' + encodeURIComponent(file) + '.svg', { cache: 'no-store' });
    if (!r.ok) throw new Error(r.status);
    const meta = new DOMParser().parseFromString(await r.text(), 'image/svg+xml').querySelector('metadata#rembrandt-test');
    const o = meta ? JSON.parse(meta.textContent.replace(/- -/g, '--')) : null;
    if (!o?.type) { $('#saveState').textContent = 'not a TYPE save: open it on its own tab'; return; }
    undoPush();
    localStorage.setItem(KEY, JSON.stringify(o.settings)); load(); settle();
    $('#saveState').textContent = `opened · ${file.slice(0, 13)}:${file.slice(14)}`;
  } catch { $('#saveState').textContent = 'could not open it from the Library'; }
}

// ---------- the deck: TEST, TRACE, (MARKS, DRAG), PAUSE ----------
// A key a pass (the owner, 2026-10-06: "PLAY is no longer needed, it splits
// in three — a panel as on old cassette recorders"): an icon on each, its
// name under it in the sliders' letters (the owner: "the font of ROW TO ROW,
// the keys with icons as on a tape recorder"); PAUSE turns to CONT. while the
// run waits. The one running stays down, as a deck's key does, till the end.
const post = async path => { try { const r = await fetch(path, { method: 'POST' }); return await r.text(); } catch { return 'start rembrandt.py'; } };
let RUN_KEY = null;
async function start(key, blocks, info, log) {
  try {
    RUN = blocks; RUN_INFO = info; RUN_KEY = key;
    const r = await fetch('/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blocks, log }) });   // the run journal, rembrandt.py
    $('#runState').textContent = await r.text();
  } catch { $('#runState').textContent = 'start rembrandt.py'; }
}
$('#btnTrace').onclick = async () => {
  await loadInk(); settle();
  const P_ = plan();
  if (!P_.rows.length) { $('#runState').innerHTML = '<span class="warn">Nothing to trace: type the text.</span>'; return; }
  if (S.ink && cupProblem(cup())) { $('#runState').innerHTML = `<span class="warn">Ink ON: ${cupProblem(cup())}</span>`; return; }
  if (walls()) { $('#runState').innerHTML = `<span class="warn">${walls()}</span>`; return; }
  if (P_.fault) { $('#runState').innerHTML = `<span class="warn">Not run: the plan is wrong — ${P_.fault}.</span>`; return; }
  if (!confirm(`TRACE ${textLabel()}: ${P_.outlines} outlines in watercolour will be run on the machine${S.ink ? `, ${P_.dips} dips in the cup` : ', no dip'}, ≈ ${fmt(P_.seconds / 60, 0)} min (est.)`)) return;
  await start('trace', P_.blocks, { seconds: P_.seconds, rows: P_.rows },
    { page: 'type', pass: 'trace', label: label(), settings: S, here: hereNow(), ...(S.ink ? { cup: cup() } : {}), estimate_s: Math.round(P_.seconds) });
};
// TEST, before the passes (New Yuri's): one dip in the cup, a dot 20 mm in from each corner of the board, and home.
function testRun() {
  const T = cornerDots(S.boardW, S.boardH);
  return T.dots.length ? { ...plotRun({ ...runOpts(T.dots.length), ink: true }, T.passes), dots: T.dots } : null;
}
$('#btnTest').onclick = async () => {
  await loadInk(); settle();
  const here = hereNow(), T = testRun();
  if (!T) { $('#runState').innerHTML = `<span class="warn">No corners: the board is ${2 * TEST_MARGIN} mm or less across.</span>`; return; }
  if (cupProblem(cup())) { $('#runState').innerHTML = `<span class="warn">TEST dips in the cup: ${cupProblem(cup())}</span>`; return; }
  if (T.fault) { $('#runState').innerHTML = `<span class="warn">Not run: the test is wrong — ${T.fault}.</span>`; return; }
  const R = reach(), past = d => { const x = here.x + d.at.x, y = here.y + d.at.y; return [x < R.x.min && `${fmt(R.x.min - x, 0)} mm past the bottom wall`, x > R.x.max && `${fmt(x - R.x.max, 0)} mm past the top wall`, y < R.y.min && `${fmt(R.y.min - y, 0)} mm past the left wall`, y > R.y.max && `${fmt(y - R.y.max, 0)} mm past the right wall`].filter(Boolean).join(', '); };
  const out = T.dots.filter(d => past(d));
  if (!confirm(`TEST: one dip in the cup, then a dot ${TEST_MARGIN} mm in from each corner of the ${S.boardW} × ${S.boardH} board — ${T.dots.map(d => `${d.name} X ${fmt(here.x + d.at.x, 0)} · Y ${fmt(here.y + d.at.y, 0)}`).join(', ')} — and home.`
    + (out.length ? `\n\n${out.map(d => `${d.name}: ${past(d)}`).join('; ')} — its dot goes on the wall.` : ''))) return;
  await start('test', T.blocks, { seconds: T.seconds, rows: T.dots.map(d => ({ label: `TEST · ${d.name}` })) },
    { page: 'type', label: 'TYPE · TEST · the corners', here, dots: T.dots.map(d => ({ name: d.name, x: +(here.x + d.at.x).toFixed(1), y: +(here.y + d.at.y).toFixed(1) })), cup: cup(), estimate_s: Math.round(T.seconds) });
};
let paused = false;
$('#btnPause').onclick = () => post(paused ? '/run/continue' : '/run/pause');
$('#btnStop').onclick = () => post('/run/stop');
$('#btnKill').onclick = () => post('/run/kill');

// The LCD, as on New Yuri.
const mmss = t => { t = Math.max(0, Math.round(t || 0)); return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
let started = null, lastLcd = null;
function lcd(st) {
  lastLcd = st;
  const P_ = PLAN || EMPTY, live = st && ['running', 'stopping', 'pausing', 'paused'].includes(st.state);
  const pct = st && st.state !== 'idle' ? (st.state === 'done' ? 100 : st.percent || 0) : 0;
  if (live && !started) started = st.started || Date.now() / 1000;
  if (!live) started = null;
  const R_ = live && RUN_INFO ? RUN_INFO : P_;
  const total = R_.seconds, left = live && started && pct >= 3 ? (Date.now() / 1000 - started) * (100 - pct) / pct : total * (1 - pct / 100);
  const state = !st ? 'no server' : live ? (st.state === 'paused' ? 'paused' : 'live') : st.state === 'idle' ? 'plan' : st.state;
  const b = st && (RUN || P_.blocks)[st.block], row = b && R_.rows[b.row - 1], what = row?.label;
  const waiting = st?.state === 'paused' && st.message;
  paused = ['paused', 'pausing'].includes(st?.state);
  const keyEl = $('#btnPause');
  keyEl.querySelector('span').textContent = paused ? 'Cont.' : 'Pause'; keyEl.classList.toggle('call', paused); keyEl.disabled = !live;
  document.querySelectorAll('.deck [data-pass], #btnTest').forEach(el => el.classList.toggle('on', !!live && (el.dataset.pass || 'test') === RUN_KEY));   // the running key stays down
  const now = waiting ? `❚❚ ${st.message}`
    : live && b?.home ? 'done · the carriage goes home, the brush off'
    : live && what && b?.dip ? `${what} · the dip in the cup`
    : live && what ? what + (st.brush_on ? ' · brush on' : ' · brush off')
    : `${P_.outlines || 0} outlines · ${textLabel() || 'no text'}`;
  $('#lcd').innerHTML = `
    <div class="lcd-top"><span>${state === 'live' ? '▶ ' : state === 'paused' ? '❚❚ ' : ''}${state}${live && RUN_KEY ? ` · ${RUN_KEY.toUpperCase()}` : ''}</span><span>${live && st.blocks ? `step ${st.block + 1}/${st.blocks}` : `${fmt(P_.length / 1000, 2)} m`}</span></div>
    <div class="lcd-mid">
      <div class="lcd-big">${segments(String(Math.min(100, Math.floor(pct))).padStart(2, ' '), 46)}<span class="u">%</span></div>
      <div class="lcd-times"><span class="k">left</span>${segments(mmss(left), 17)}<span class="k">total</span>${segments(mmss(total), 17)}</div>
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
  if (st && trailOf && st.started === trailOf && st.x_mm !== null && st.y_mm !== null) {
    const B = RUN || PLAN?.blocks || [], i = st.block, air = !(live && paints(B[i]));
    const q = { x: st.x_mm - h.x, y: st.y_mm - h.y, live, air, i }, l = trail.at(-1);
    const put = (p, a, j) => p && trail.push({ x: p.x - h.x, y: p.y - h.y, live: false, air: a, i: j });
    if (l && l.i !== i) {
      if (!l.air) put(endOf(B[l.i]), false, l.i);
      for (let j = l.i + 1; j < i; j++) if (paints(B[j])) { put(startOf(B, j), true, j); put(endOf(B[j]), false, j); }
      if (!air) put(startOf(B, i), true, i);
    }
    if (!l || Math.hypot(q.x - l.x, q.y - l.y) > 0.5 || l.live !== live || l.air !== air || l.i !== i) { trail.push(q); kick(); }
  }
  $('#runState').innerHTML = !st ? 'no server: start rembrandt.py' : st.message ? `<span class="${st.state === 'error' ? 'warn' : ''}">${st.message}</span>` : '';
}

// ---------- start ----------
load();
$('#text').value = S.text;
$('#hint').textContent = HINT;
syncRef(); loadRef();
lampSwitch($('#lamp'));
addEventListener('rembrandt-night', () => kick());
setInterval(watch, 500);
new ResizeObserver(layout).observe(stage);
settle(); watch();
fetch('glyphs.json', { cache: 'no-store' }).then(r => r.json()).then(o => { GLYPHS = o.glyphs; if (FRESH) fit(); settle(); }).catch(() => { $('#hint').textContent = 'glyphs.json did not load: start rembrandt.py'; });
loadInk().then(settle);
addEventListener('focus', () => loadInk().then(settle));
const opening = new URLSearchParams(location.search).get('open');
if (opening) openFromLibrary(opening);
