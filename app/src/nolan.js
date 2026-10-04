// Rembrandt · NOLAN — one ribbon in 3D, imprinted on the canvas (NOLAN.md
// §3.0; the owner, 2026-10-04: "yes, that is it — carry it into NOLAN"; "the
// words from TEST, so there is no mess: ROWS first, ROW TO ROW and so on;
// and TAIL"). The model is band.js; this page draws it on Test's board —
// the canvas from the cup — turns it with the mouse, edits its points with
// Create's Tools, and runs its imprint with Test's run (strokes.js, plotRun),
// layer by layer. 3D lives only in the drawing: the machine gets lines and
// arcs.
//
// Canvas mm from its centre: x right, y down, z towards the viewer. The
// board, as on Test: mm from Here — the canvas's centre — X up, Y right.

import { fmt } from './util.js';
import { reach, homeCorner } from './machine.js';
import { plotRun, DEFAULTS, TABLE_MM, WRIST_MAX, SPEED_MAX, ELBOW_LIFT } from './strokes.js';
import { SKETCH, ringBlank, bandOf, layersOf, imprintOf, bandPasses, rotation, transpose, apply, projector, lengthOf, DIP_RUN, ROWS_MAX } from './band.js';
import { segments, sticks } from './lcd.js';
import { lampSwitch, themeColor } from './lamp.js';
import { cupOf, cupProblem, drawCup, canvasFrom, dipAt } from './ink.js';
import './ui.js';

const $ = s => document.querySelector(s);
const KEY = 'rembrandt.nolan.v03', REF_KEY = 'rembrandt.nolan.ref';
const PALETTE = ['#F7F1E8', '#F9C38A', '#F28A2E', '#EF5E4E', '#D24FC4', '#7B4FE0', '#3D63D8', '#46A6EA', '#A6E3F8', '#EDE7F5'];   // IMG_9424's stripes, est. by eye
const LAYER = ['#A9A397', '#EB7A25', '#3D63D8', '#24221F'];
const DRAG_STEP = 4, STEP = 1.5;
// More than this past the walls is no longer a hair (Test's 2 mm of 2026-10-03):
// the canvas lies partly out of reach, said in red and before PLAY.
const PAST_MANY = 50;   // mm between the centre's points: coarse while the mouse turns it

// ---------- state ----------
const S = {
  anchors: SKETCH.map(a => ({ ...a })),
  rows: 16, pitch: 8, width: 5, stack: 6, twist: 0, squeeze: 0,                   // the band; Roll is a point's (band.js, squeezed)
  tilt: 0, swing: 0, spin: 0, zoom: 1, dx: 0, dy: 0, lens: 0,                     // the ribbon in space
  speed: 150, travel: 180, tail: 70, ink: false,                                  // the brush, as on Test (est.)
  boardW: 500, boardH: 700,
  look: 'colour', ground: 'black', refOpacity: 30, tool: 'select',
};
let pick = 8;
const NUM = ['rows', 'pitch', 'width', 'stack', 'twist', 'squeeze', 'tilt', 'swing', 'spin', 'zoom', 'dx', 'dy', 'lens', 'speed', 'travel', 'tail', 'boardW', 'boardH', 'refOpacity'];
function load() {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (!o) return;
    for (const k of NUM) if (Number.isFinite(o[k])) S[k] = o[k];
    if (typeof o.ink === 'boolean') S.ink = o.ink;
    for (const [k, ok] of [['look', ['geometry', 'colour', 'layers', 'imprint']], ['ground', ['white', 'black']], ['tool', ['select', 'pen']]]) if (ok.includes(o[k])) S[k] = o[k];
    const A = Array.isArray(o.anchors) ? o.anchors.filter(a => ['x', 'y', 'z', 'roll'].every(k => Number.isFinite(a?.[k]))) : [];
    if (A.length >= 2) S.anchors = A.map(a => ({ x: a.x, y: a.y, z: a.z, roll: a.roll }));
    // the whole band's Roll of before 2026-10-04 (two Rolls on the panel, the owner: "unprofessional"):
    // its angle goes into every point, so the ribbon keeps its shape
    if (Number.isFinite(o.roll) && o.roll) S.anchors.forEach(a => { a.roll += o.roll; });
  } catch { }
  pick = Math.min(pick, S.anchors.length - 1);
}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { } };
const bandOpts = step => ({ rows: S.rows, pitch: S.pitch, width: S.width, stack: S.stack, twist: S.twist, squeeze: S.squeeze, tilt: S.tilt, swing: S.swing, spin: S.spin, zoom: S.zoom, dx: S.dx, dy: S.dy, lens: S.lens, step });
const view3 = () => ({ tilt: S.tilt, swing: S.swing, spin: S.spin, zoom: S.zoom, dx: S.dx, dy: S.dy, lens: S.lens });

// ---------- the cup, and the canvas from it (Test's) ----------
let INK = {};
const cup = () => cupOf(INK);
// The Test tab's own Here (this browser's settings of the Test tab), until
// the canvas is measured from the cup — as the Test and Ink tabs do (the
// owner, 2026-10-04: INK "as on TEST, so the target shows where the cup is").
let TEST_HERE = null;
function readTestHere() {
  try { const t = JSON.parse(localStorage.getItem('rembrandt.test.v01') || '{}'); TEST_HERE = Number.isFinite(t.here?.x) && Number.isFinite(t.here?.y) ? { x: t.here.x, y: t.here.y } : null; } catch { TEST_HERE = null; }
}
async function loadInk() {
  readTestHere();
  try { const r = await fetch('/ink', { cache: 'no-store' }); INK = r.ok ? await r.json() : {}; } catch { INK = {}; }
}
const fromCup = () => canvasFrom(INK, S.boardW, S.boardH);
const hereNow = () => fromCup() || TEST_HERE;
const dipCup = () => { const c = cup(), d = dipAt(c); return d ? { ...c, x: d.x, y: d.y } : c; };

// ---------- the band, and the plan of its run ----------
let BAND = null, bandKey = '';
function band(step) {
  const key = JSON.stringify([S.anchors, bandOpts(step)]);
  if (key !== bandKey) { bandKey = key; BAND = bandOf(S.anchors, bandOpts(step)); }
  return BAND;
}
// The slow part — what lies over what, the imprint, its fitting, Test's run —
// waits while the mouse turns the ribbon or a slider moves.
let PLAN = null, planKey = '', busy = false;
const EMPTY = { blocks: [], rows: [], passes: [], imp: null, lay: null, seconds: 0, length: 0, need: 0, pastWall: 0, gone: 0, dips: 0, carriage: null, air: [], ink: false };
function plan() {
  if (busy && PLAN) return PLAN;
  const here = hereNow(), key = JSON.stringify([S.anchors, bandOpts(STEP), S.speed, S.travel, S.tail, S.ink, here, S.ink ? dipCup() : null]);
  if (PLAN && key === planKey) return PLAN;
  planKey = key;
  const b = band(STEP);
  if (!b) { PLAN = EMPTY; return PLAN; }
  const lay = layersOf(b), imp = imprintOf(b, lay, { width: S.width });
  const { passes, rows } = bandPasses(imp.runs, { ink: S.ink, tail: S.tail });
  const o = { ...DEFAULTS, speed: S.speed, travel: S.travel, tail: S.tail, lift: false, ink: S.ink, snake: true, pause: false, rows: rows.length, here, cup: dipCup() };
  PLAN = { ...plotRun(o, passes), rows, passes: passes.map(p => p.key), ink: S.ink, imp, lay, opts: o };
  return PLAN;
}

// ---------- the board (Test's) ----------
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
  return v;
}
let V = view(), k = 1, dpr = 1;
// canvas mm → the screen: across is Y, down the picture is −X
const sx = p => (p[0] - V.y0) * k, sy = p => (V.x1 + p[1]) * k;
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
function shade(h, f) { const n = parseInt(h.slice(1), 16); return `rgb(${Math.round(((n >> 16) & 255) * f)},${Math.round(((n >> 8) & 255) * f)},${Math.round((n & 255) * f)})`; }
const colourOf = kk => PALETTE[Math.min(PALETTE.length - 1, Math.floor(kk / S.rows * PALETTE.length))];
const showPoints = () => S.tool === 'pen' || S.look === 'geometry' || S.look === 'layers';
function draw() {
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const W = g.canvas.width / dpr, H = g.canvas.height / dpr, black = S.ground === 'black', ground = black ? '#0B0B0D' : '#FCFBF8';
  const hw = S.boardW / 2, hh = S.boardH / 2;
  g.fillStyle = themeColor('--stage', '#E2DED6'); g.fillRect(0, 0, W, H);   // the table
  g.fillStyle = ground; g.fillRect(sx([-hw]), sy([0, -hh]), S.boardW * k, S.boardH * k);
  g.lineCap = 'round'; g.lineJoin = 'round';
  const b = band(busy ? DRAG_STEP : STEP);
  if (b) {
    if (S.look === 'imprint' && !busy) drawImprint();
    else drawBand(b, black, ground);
  }
  if (REF && S.refOpacity > 0) {                                                       // the reference as tracing paper
    const img = REF.img, s = Math.min(S.boardW / img.naturalWidth, S.boardH / img.naturalHeight), w = img.naturalWidth * s, h = img.naturalHeight * s;
    g.globalAlpha = S.refOpacity / 100; g.drawImage(img, sx([-w / 2]), sy([0, -h / 2]), w * k, h * k); g.globalAlpha = 1;
  }
  g.strokeStyle = black ? 'rgba(255,255,255,.35)' : 'rgba(36,34,31,.8)'; g.lineWidth = 1; g.strokeRect(sx([-hw]) + .5, sy([0, -hh]) + .5, S.boardW * k - 1, S.boardH * k - 1);
  g.strokeStyle = '#EB7A25'; g.lineWidth = 1.5;                                    // Here: the canvas's centre
  g.beginPath(); g.moveTo(sx([-8]), sy([0, 0])); g.lineTo(sx([8]), sy([0, 0])); g.moveTo(sx([0]), sy([0, -8])); g.lineTo(sx([0]), sy([0, 8])); g.stroke();
  g.font = font(10); g.fillStyle = '#B3470C'; g.textAlign = 'left';
  g.fillText(`canvas ${S.boardW} × ${S.boardH} mm`, sx([-hw]), sy([0, -hh]) - 6);
  const h = hereNow();
  if (S.ink && h) {                                                                    // INK ON, as on Test: the cup's red scope, home, the way in the air
    const msx = q => (q.y - V.y0) * k, msy = q => (V.x1 - q.x) * k, ink = themeColor('--ink', '#24221F');
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
    const hc = homeCorner(), home = { x: hc.x - h.x, y: hc.y - h.y }, hX = msx(home), hY = msy(home);
    g.strokeStyle = ink; g.lineWidth = 1.2; g.strokeRect(hX - 4, hY - 4, 8, 8); g.fillStyle = ink; g.fillText('home', hX + 8, hY - 6);
  }
  if (showPoints()) {                                                                  // the points: squares where they lie now
    const imp = projector(view3());
    S.anchors.forEach((a, i) => {
      const p = imp([a.x, a.y, a.z]), X = sx(p), Y = sy(p), s = i === pick ? 5 : 4;
      g.fillStyle = i === pick ? '#EB7A25' : '#fff'; g.strokeStyle = '#24221F'; g.lineWidth = 1.2;
      g.fillRect(X - s, Y - s, 2 * s, 2 * s); g.strokeRect(X - s, Y - s, 2 * s, 2 * s);
    });
  }
  drawTrail();
}
// Geometry, Colour, Layers: the band far to near, each piece covering what
// lies behind it, then its rows.
function drawBand(b, black, ground) {
  const lay = S.look === 'layers' ? (busy ? null : plan().lay) : null;
  for (const q of b.quads) {
    const i = q.i;
    g.beginPath(); q.poly.forEach((p, j) => j ? g.lineTo(sx(p), sy(p)) : g.moveTo(sx(p), sy(p))); g.closePath();
    g.fillStyle = ground; g.strokeStyle = ground; g.lineWidth = 0.8; g.fill(); g.stroke();
    g.lineWidth = S.width * k;
    for (let kk = 0; kk < b.rows; kk++) {
      g.strokeStyle = S.look === 'geometry' ? (b.pitch[i] < S.width ? '#D9481C' : black ? '#E9E5DD' : '#2A2826')
        : S.look === 'layers' ? LAYER[Math.min(LAYER.length - 1, (lay ? lay[i] : 1) - 1)]
        : b.back[i] ? shade(colourOf(kk), 0.5) : colourOf(kk);
      g.beginPath(); g.moveTo(sx(b.S[i][kk]), sy(b.S[i][kk])); g.lineTo(sx(b.S[i + 1][kk]), sy(b.S[i + 1][kk])); g.stroke();
    }
  }
}
// Imprint: what the machine paints — the visible pieces, their ends thinning
// over Tail as the elbow lands and lifts the brush (strokes.js, rowLift).
function drawImprint() {
  const P_ = plan();
  if (!P_.imp) return;
  for (const r of P_.imp.runs) {
    const L = lengthOf(r.pts), z = Math.min(S.tail, L / 2);
    let s = 0;
    g.strokeStyle = colourOf(r.k);
    for (let j = 1; j < r.pts.length; j++) {
      const a = r.pts[j - 1], c = r.pts[j], d = Math.hypot(c[0] - a[0], c[1] - a[1]), m = s + d / 2;
      const w = m < z ? (1 - Math.cos(Math.PI * m / z)) / 2 : m > L - z ? (1 - Math.cos(Math.PI * (L - m) / z)) / 2 : 1;
      g.lineWidth = Math.max(0.6, S.width * k * w);
      g.beginPath(); g.moveTo(sx(a), sy(a)); g.lineTo(sx(c), sy(c)); g.stroke();
      s += d;
    }
  }
}
// The run as it goes (Test's): where the carriage has been since PLAY —
// orange where the brush paints, grey in the air: to the cup, between the
// pieces, home (the owner, 2026-10-04: "everything is orange; I would leave
// grey what went through the air"). Each point says how the way to it went.
let trail = [], trailOf = null, RUN = null;   // RUN: the blocks PLAY sent
const AIR = '#8E9196';
function drawTrail() {
  if (!hereNow() || trail.length < 1) return;
  const msx = q => (q.y - V.y0) * k, msy = q => (V.x1 - q.x) * k, last = trail.at(-1);
  g.save(); g.lineWidth = 1.2;
  for (let i = 1; i < trail.length;) {
    const air = trail[i].air;
    g.strokeStyle = air ? AIR : '#EB7A25'; g.beginPath(); g.moveTo(msx(trail[i - 1]), msy(trail[i - 1]));
    for (; i < trail.length && trail[i].air === air; i++) g.lineTo(msx(trail[i]), msy(trail[i]));
    g.stroke();
  }
  if (last.live) { g.fillStyle = last.air ? AIR : '#EB7A25'; g.beginPath(); g.arc(msx(last), msy(last), 4, 0, Math.PI * 2); g.fill(); }
  g.restore();
}
// A block of the run paints, or goes through the air (a travel, the dip, an arm, a wait, home).
const paints = b => b?.kind === 'move' && b.paintMM > 0;
// Where a block leaves the carriage, machine mm: its last line, arc or move.
function endOf(b) {
  const c = (b?.cmds || []).filter(c => /^[LAM] /.test(c)).at(-1);
  if (!c) return null;
  const t = c.split(' ').map(Number);
  return c[0] === 'A' ? { x: t[3], y: t[4] } : { x: t[1], y: t[2] };
}
// Where block i starts: where the last move before it left the carriage.
function startOf(B, i) {
  for (let j = i - 1; j >= 0; j--) { const e = endOf(B[j]); if (e) return e; }
  return null;
}

// ---------- undo ----------
let undoStack = [], redoStack = [];
const SHAPE = ['anchors', 'tilt', 'swing', 'spin', 'zoom', 'dx', 'dy'];
const snapshot = () => JSON.stringify(Object.fromEntries(SHAPE.map(k2 => [k2, S[k2]])));
function undoPush() { undoStack.push(snapshot()); if (undoStack.length > 200) undoStack.shift(); redoStack = []; }
function restore(js) { Object.assign(S, JSON.parse(js)); pick = Math.min(pick, S.anchors.length - 1); settle(); }
function undo() { if (!undoStack.length) return; redoStack.push(snapshot()); restore(undoStack.pop()); }
function redo() { if (!redoStack.length) return; undoStack.push(snapshot()); restore(redoStack.pop()); }

// ---------- the mouse: turn the ribbon, move its points ----------
let drag = null;
const wrap = v => ((v + 180) % 360 + 360) % 360 - 180;
function pointHit(p) {
  if (!showPoints()) return -1;
  const imp = projector(view3());
  let best = -1, bd = 8 / k;
  S.anchors.forEach((a, i) => { const q = imp([a.x, a.y, a.z]), d = Math.hypot(q[0] - p[0], q[1] - p[1]); if (d < bd) { bd = d; best = i; } });
  return best;
}
// A point put in the screen's plane, at the depth of the ribbon's last point.
function addPoint(p) {
  const R = rotation(S.tilt, S.swing, S.spin), last = S.anchors.at(-1), w = apply(R, [last.x, last.y, last.z]);
  const m = apply(transpose(R), [(p[0] - S.dx) / S.zoom, (p[1] - S.dy) / S.zoom, w[2]]);
  undoPush();
  S.anchors.push({ x: Math.round(m[0]), y: Math.round(m[1]), z: Math.round(m[2]), roll: last.roll });
  pick = S.anchors.length - 1; settle();
}
cv.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  const p = toCanvas(e), hit = pointHit(p);
  if (hit < 0 && S.tool === 'pen') { addPoint(p); return; }
  undoPush();
  drag = { x: e.clientX, y: e.clientY, moved: false, mode: hit >= 0 ? 'point' : e.shiftKey ? 'move' : e.altKey ? 'spin' : 'turn' };
  if (hit >= 0) { pick = hit; showPanel(); }
  cv.setPointerCapture(e.pointerId); stage.classList.add('drag');
});
cv.addEventListener('pointermove', e => {
  if (!drag) { cv.style.cursor = pointHit(toCanvas(e)) >= 0 ? 'move' : ''; return; }
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (!drag.moved && Math.hypot(dx, dy) < 2) return;
  drag.x = e.clientX; drag.y = e.clientY; drag.moved = true; busy = true;
  if (drag.mode === 'point') {                                                         // in the screen's plane, the depth along
    const d = apply(transpose(rotation(S.tilt, S.swing, S.spin)), [dx / k / S.zoom, dy / k / S.zoom, 0]), a = S.anchors[pick];
    a.x += d[0]; a.y += d[1]; a.z += d[2];
  } else if (drag.mode === 'move') { S.dx += dx / k; S.dy += dy / k; }
  else if (drag.mode === 'spin') S.spin = wrap(S.spin + dx * 0.5);
  else { S.swing = wrap(S.swing + dx * 0.5); S.tilt = wrap(S.tilt - dy * 0.5); }
  showSliders(); kick();
});
cv.addEventListener('pointerup', () => {
  if (!drag) return;
  if (!drag.moved) undoStack.pop();
  else { const a = S.anchors[pick]; if (drag.mode === 'point') { a.x = Math.round(a.x); a.y = Math.round(a.y); a.z = Math.round(a.z); } }
  drag = null; stage.classList.remove('drag'); settle();
});
let wheelT = 0;
cv.addEventListener('wheel', e => {
  e.preventDefault();
  if (!busy) undoPush();
  busy = true; S.zoom = Math.max(0.4, Math.min(2, S.zoom * Math.exp(-e.deltaY * 0.001)));
  showSliders(); kick();
  clearTimeout(wheelT); wheelT = setTimeout(settle, 250);
}, { passive: false });

// ---------- the tools (Create's) ----------
const HINTS = {
  select: 'Select — drag a square to move a point; drag elsewhere to turn the ribbon, Shift to move it, Alt to spin it; the wheel sizes it.',
  pen: 'Pen — click to add a point at the ribbon\'s end, at the depth of the last one; drag a square to move a point.',
};
function setTool(t) { S.tool = t; syncTools(); save(); kick(); }
function syncTools() {
  document.querySelectorAll('.tool[data-tool]').forEach(b2 => b2.classList.toggle('on', b2.dataset.tool === S.tool));
  stage.className = 'stage t-' + S.tool;
  $('#hint').textContent = HINTS[S.tool];
}
document.querySelectorAll('.tool[data-tool]').forEach(b2 => b2.onclick = () => setTool(b2.dataset.tool));
$('#btnUndo').onclick = undo; $('#btnRedo').onclick = redo;
function deletePoint() { if (S.anchors.length <= 2) return; undoPush(); S.anchors.splice(pick, 1); pick = Math.min(pick, S.anchors.length - 1); settle(); }
$('#btnDel').onclick = deletePoint;
const blank = A => { undoPush(); S.anchors = A.map(a => ({ ...a })); pick = Math.min(pick, S.anchors.length - 1); settle(); };
$('#btnDefault').onclick = () => blank(SKETCH);
$('#btnRing').onclick = () => blank(ringBlank());
$('#btnFront').onclick = () => { undoPush(); Object.assign(S, { tilt: 0, swing: 0, spin: 0, zoom: 1, dx: 0, dy: 0 }); settle(); };
// a shape from the prototype's "Copy the shape" (previous_research/nolan_3d_prototype.html)
$('#btnPaste').onclick = () => {
  const text = prompt('Paste the shape copied from the prototype:'); if (!text) return;
  try {
    const o = JSON.parse(text), A = (o.points || []).filter(a => ['x', 'y', 'z', 'roll'].every(k2 => Number.isFinite(a?.[k2])));
    if (A.length < 2) throw new Error('no points');
    undoPush();
    const g = o.settings || {}, all = Number.isFinite(g.rollAll) ? g.rollAll : 0;   // the prototype's "Roll, all": into every point
    S.anchors = A.map(a => ({ x: a.x, y: a.y, z: a.z, roll: a.roll + all }));
    const map = { lines: 'rows', pitch: 'pitch', brush: 'width', stack: 'stack', twist: 'twist', tilt: 'tilt', turn: 'swing', spin: 'spin', zoom: 'zoom', dx: 'dx', dy: 'dy', lens: 'lens' };
    for (const [from, to] of Object.entries(map)) if (Number.isFinite(g[from])) S[to] = g[from];
    pick = Math.min(pick, S.anchors.length - 1); settle();
  } catch { alert('That is not a shape from the prototype.'); }
};
addEventListener('keydown', e => {
  if (e.key === 'Escape') post('/run/stop');                                         // Esc = STOP, as on Test
  if (e.target.matches('input,select,textarea')) return;
  const cmd = e.metaKey || e.ctrlKey;
  if (cmd && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (cmd) return;
  if (e.key.toLowerCase() === 'v') setTool('select');
  else if (e.key.toLowerCase() === 'p') setTool('pen');
  else if (e.key === 'Backspace' || e.key === 'Delete') deletePoint();
});

// ---------- the panel: Test's sliders and words ----------
const signed = v => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v)}`;
const BAND_SL = [['rows', 'Rows', '', 1, 2, ROWS_MAX], ['pitch', 'Row to row', 'mm', 0.5, 2, 16, { label: 2 }], ['width', 'Row width', 'mm', 0.5, 1, 12],
  ['stack', 'Stack', 'mm', 1, 0, 30], ['twist', 'Twist', 'half turns', 0.25, -4, 4], ['squeeze', 'Squeeze', '%', 1, -100, 100]];
const VIEW_SL = [['tilt', 'Rotate X', '°', 1, -180, 180], ['swing', 'Rotate Y', '°', 1, -180, 180], ['spin', '↻', '°', 1, -180, 180],
  ['zoom', 'Size', '×', 0.01, 0.4, 2], ['dy', 'X ↑', 'mm', 1, -250, 250, null, -1], ['dx', 'Y →', 'mm', 1, -250, 250], ['lens', 'Lens', '', 1, 0, 100]];
const POINT_SL = [['z', 'Depth', 'mm', 1, -250, 250], ['roll', 'Roll', '°', 1, -180, 360]];
const RUN_SL = [['speed', 'Brush on', 'mm/s', 1, 5, SPEED_MAX], ['travel', 'Between rows', 'mm/s', 5, 20, SPEED_MAX], ['tail', 'Tail', 'mm', 5, 10, 200]];
function scale(step, min, max, label) {
  let h = '';
  for (let i = 0; min + i * step <= max + 1e-9; i++) {
    const v = min + i * step, lab = Math.abs(v / label - Math.round(v / label)) < 1e-9;
    h += `<i class="${lab ? 'major' : ''}" style="left:calc(9px + (100% - 18px) * ${(v - min) / (max - min)})">${lab ? `<span>${v}</span>` : ''}</i>`;
  }
  return `<div class="ticks">${h}</div>`;
}
// each slider: [key, label, unit, step, min, max, scale, sign]; sign −1: shown the other way round (X ↑ is up, the canvas's y down)
function sliders(box, list, objOf) {
  box.innerHTML = list.map(([key, label, , step, min, max, sc]) => `<label class="sl"><span class="slh"><span>${label}</span><span class="val" data-v="${key}"></span></span><input class="slider" type="range" data-k="${key}" min="${min}" max="${max}" step="${step}">${sc ? scale(step, min, max, sc.label) : ''}</label>`).join('');
  box.querySelectorAll('input').forEach(inp => {
    const row = list.find(r => r[0] === inp.dataset.k), sign = row[7] || 1;
    inp.oninput = () => { if (!busy) undoPush(); busy = true; objOf()[inp.dataset.k] = +inp.value * sign; showSliders(); kick(); };
    inp.onchange = () => settle();
  });
}
sliders($('#slBand'), BAND_SL, () => S);
sliders($('#slView'), VIEW_SL, () => S);
sliders($('#slPoint'), POINT_SL, () => S.anchors[pick]);
sliders($('#slRun'), RUN_SL, () => S);
const FIELDS = [['boardW', 'Board width', 'mm', 10], ['boardH', 'Board height', 'mm', 10]];
$('#fields').innerHTML = FIELDS.map(([key, label, unit, step]) => `<label>${label} <input data-k="${key}" type="number" step="${step}" min="${step}"><em>${unit}</em></label>`).join('');
$('#fields').querySelectorAll('input').forEach(inp => inp.onchange = () => { const v = +inp.value; if (v > 0) S[inp.dataset.k] = v; settle(); });
$('#ink').onchange = e => { S.ink = e.target.checked; settle(); };
$('#inkOff').onclick = () => { S.ink = false; settle(); };
$('#inkOn').onclick = () => { S.ink = true; settle(); };
document.querySelectorAll('[data-look]').forEach(b2 => b2.onclick = () => { S.look = b2.dataset.look; showPanel(); save(); kick(); });
document.querySelectorAll('[data-ground]').forEach(b2 => b2.onclick = () => { S.ground = b2.dataset.ground; showPanel(); save(); kick(); });
// Each slider looked for in its own box: Roll is the band's and a point's
// both (the owner, 2026-10-04: "the ROLL slider does not move" — the band's
// was set back to the point's on every step where a slider takes no focus).
function showSliders() {
  for (const [list, box, objOf] of [[BAND_SL, '#slBand', () => S], [VIEW_SL, '#slView', () => S], [POINT_SL, '#slPoint', () => S.anchors[pick]], [RUN_SL, '#slRun', () => S]]) for (const [key, , unit, , , , , sign = 1] of list) {
    const obj = objOf(), inp = $(`${box} input[data-k="${key}"]`), v = obj[key] * sign;
    if (document.activeElement !== inp) inp.value = v;
    const shown = key === 'rows' ? `${S.rows} · ${fmt((S.rows - 1) * S.pitch + S.width, 0)} mm` : key === 'zoom' ? fmt(v, 2) : ['dx', 'dy', 'roll', 'twist', 'squeeze'].includes(key) ? signed(Math.round(v * 100) / 100) : Math.round(v * 100) / 100;
    $(`${box} [data-v="${key}"]`).textContent = `${shown}${unit && key !== 'rows' ? ' ' + unit : ''}`;
  }
  $('#ptHead').textContent = `Point ${pick + 1} of ${S.anchors.length}`;
}
function showPanel() {
  showSliders();
  $('#fields').querySelectorAll('input').forEach(inp => { if (document.activeElement !== inp) inp.value = S[inp.dataset.k]; });
  $('#ink').checked = S.ink; $('#inkOff').classList.toggle('on', !S.ink); $('#inkOn').classList.toggle('on', S.ink);
  document.querySelectorAll('[data-look]').forEach(b2 => b2.classList.toggle('on', b2.dataset.look === S.look));
  document.querySelectorAll('[data-ground]').forEach(b2 => b2.classList.toggle('on', b2.dataset.ground === S.ground));
}
// Settled: the mouse let go, a slider let go — the plan, the reading, the LCD.
function settle() {
  busy = false;
  const P_ = plan(), C = cup(), here = hereNow(), est = key => C.est?.[key] ? ' (est.)' : '';
  const lays = P_.imp ? Object.keys(P_.imp.byLayer).map(Number).sort((a, b2) => a - b2) : [];
  const inkWhy = S.ink ? cupProblem(C) : '';
  $('#planRead').innerHTML = (!P_.imp ? 'No ribbon: two points at least.' :
    `The imprint: <b>${P_.imp.runs.length}</b> pieces of row, <b>${fmt(P_.imp.total / 1000, 1)} m</b> · `
    + `the layers by depth ${lays.map(l => `<span class="lay" style="background:${LAYER[Math.min(LAYER.length - 1, l - 1)]}"></span>N${l} ${fmt(P_.imp.byLayer[l] / 1000, 1)} m`).join(' · ')}${lays.length > 1 ? ', a pause between them — CONTINUE when the one under is dry' : ''} · `
    + `closer than the row's width: <span class="${P_.imp.red > 0.35 ? 'warn' : ''}">${fmt(P_.imp.red * 100, 0)} %</span> · `
    + (S.ink ? `<b>Ink ON</b>, the Watercolour run: a dip every ${DIP_RUN} mm along a row (est.), ${P_.dips} dips; the elbow over the rim +${C.rim}°${est('rim')}, in the cup ${C.dip > 0 ? '+' : ''}${C.dip}°${est('dip')}, ${C.dwell} s in the paint · ` : 'the Paint run · ')
    + `${fmt(P_.length / 1000, 2)} m with the brush down, at ${S.speed} mm/s · ≈ ${fmt(P_.seconds / 60, 1)} min (est.) · the elbow lands and lifts the brush over ${S.tail} mm of each piece's ends, 0° pressed to +${ELBOW_LIFT}° off; up to ${fmt(P_.need, 0)}°/s (est.) · into lines and arcs, ≤ 0.1 mm: 3D only in the drawing`)
    + (inkWhy ? ` <span class="warn">${inkWhy}</span>` : '')
    + (P_.fault ? ` <span class="warn">The plan is wrong, PLAY will not run it: ${P_.fault}.</span>` : '')
    + (P_.need > WRIST_MAX ? ` <span class="warn">The elbow goes ${WRIST_MAX}°/s at most on the move: a longer Tail or a slower brush.</span>` : '')
    + (P_.pastWall > PAST_MANY ? ` <span class="warn">${fmt(P_.pastWall / 1000, 1)} m of the rows lie past the machine's walls and would be pressed along them: the canvas lies partly out of reach — measure it from the cup on the Ink tab, or move the ribbon.</span>`
      : P_.pastWall > 0.05 ? ` <span class="hint">${fmt(P_.pastWall, 0)} mm of the path past the machine's walls: pressed along them, as on the Job tab.</span>` : '')
    + (walls() ? ` <span class="warn">${walls()}</span>` : '')
    + (here ? ` · The canvas's centre, ${fromCup() ? 'from the cup' : 'the Test tab\'s Here — until the canvas is measured from the cup on the Ink tab'}: carriage <b>X ${fmt(here.x, 1)} · Y ${fmt(here.y, 1)} mm</b>.`
      : ' <span class="warn">Where the canvas lies: measure it from the cup on the Ink tab — its left edge and its bottom edge, two ruler numbers.</span>');
  $('#stats').textContent = `${P_.blocks.length} steps · ${P_.passes.join(' + ') || 'nothing to paint'} · ${S.anchors.length} points`;
  showPanel(); save(); layout(); lastLcd && lcd(lastLcd);
}
function walls() {
  const h = hereNow(), P_ = PLAN;
  if (!h || !P_?.carriage || !P_.rows.length) return '';
  const R = reach(), b2 = P_.carriage, x0 = h.x + b2.x0, x1 = h.x + b2.x1, y0 = h.y + b2.y0, y1 = h.y + b2.y1;
  const out = [x0 < R.x.min && `${fmt(R.x.min - x0, 0)} mm past the bottom wall`, x1 > R.x.max && `${fmt(x1 - R.x.max, 0)} mm past the top wall`,
    y0 < R.y.min && `${fmt(R.y.min - y0, 0)} mm past the left wall`, y1 > R.y.max && `${fmt(y1 - R.y.max, 0)} mm past the right wall`].filter(Boolean);
  return out.length ? `The brush would go ${out.join(', ')}: move the canvas or the ribbon.` : '';
}

// ---------- the reference: tracing paper over the canvas ----------
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
function deleteRef() { REF = null; try { localStorage.removeItem(REF_KEY); } catch { } syncRef(); kick(); }   // the round × (the owner, 2026-10-04)
const esc = v => String(v ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
function syncRef() {
  $('#refThumb').innerHTML = REF ? `<img src="${REF.img.src}" alt=""><button class="refdel" title="Delete the reference">×</button>` : '<span>no reference yet</span>';
  if (REF) $('#refThumb .refdel').onclick = deleteRef;
  $('#refOp').value = S.refOpacity;
  $('#refRead').innerHTML = REF ? `${esc(REF.name)} · <b>${S.refOpacity} %</b>` : 'Over the canvas, the whole of it inside, to fit the ribbon to.';
}
$('#btnRef').onclick = () => $('#refIn').click();
$('#refIn').onchange = e => { const f = e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => setRef(rd.result, f.name, true); rd.readAsDataURL(f); e.target.value = ''; };
$('#refOp').oninput = e => { S.refOpacity = +e.target.value; syncRef(); save(); kick(); };
function loadRef() { try { const o = JSON.parse(localStorage.getItem(REF_KEY) || 'null'); if (o && o.src) setRef(o.src, o.name || 'reference', false); } catch { } }

// ---------- 💾 SAVE NOLAN ----------
// As SAVE TEST does: an SVG of the canvas in mm with the imprint, the whole
// state in its metadata, a PNG preview. With the tests in the Library, which
// opens it here.
const nolanLabel = () => `NOLAN · ${PLAN?.passes.join('+') || 'no ribbon'} · ${S.boardW} × ${S.boardH} mm · ${S.rows} rows${S.ink ? ' · ink' : ''}`;
function nolanSvg() {
  const W = S.boardW, H = S.boardH, f = v => (Math.round(v * 100) / 100).toFixed(2), P_ = plan();
  const meta = JSON.stringify({ rembrandt: '0.2', nolan: true, label: nolanLabel(), settings: S }).replace(/&/g, '\\u0026').replace(/</g, '\\u003c').replace(/--/g, '- -');
  const rows = (P_.imp?.runs || []).map(r => `  <path stroke="${colourOf(r.k)}" data-layer="${r.layer}" d="M${r.pts.map(p => `${f(W / 2 + p[0])} ${f(H / 2 + p[1])}`).join(' L')}"/>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}">
<!-- Rembrandt v0.2 · ${nolanLabel()}; 1 unit = 1 mm -->
<metadata id="rembrandt-test">${meta}</metadata>
<rect width="${W}" height="${H}" fill="${S.ground === 'black' ? '#0B0B0D' : '#FCFBF8'}" stroke="#24221F" stroke-width="0.5"/>
<g fill="none" stroke-width="${f(S.width)}" stroke-linecap="round" stroke-linejoin="round">
${rows}
</g>
</svg>`;
}
function nolanPng() {
  const keep = [g, k, dpr], sw = V.y1 - V.y0, sh = V.x1 - V.x0, kk = 800 / Math.max(sw, sh), c2 = document.createElement('canvas');
  c2.width = Math.round(sw * kk); c2.height = Math.round(sh * kk);
  g = c2.getContext('2d'); k = kk; dpr = 1;
  try { draw(); } finally { [g, k, dpr] = keep; }
  return c2.toDataURL('image/png');
}
$('#btnSave').onclick = async () => {
  const st = $('#saveState'), b2 = $('#btnSave');
  b2.disabled = true; st.textContent = 'saving…';
  try {
    const r = await fetch('/library', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ svg: nolanSvg(), png: nolanPng() }) });
    const o = await r.json();
    st.textContent = o.ok ? `saved · ${o.name}` : `not saved · ${o.message}`;
  } catch { st.textContent = 'not saved · start rembrandt.py'; }
  b2.disabled = false;
};
async function openFromLibrary(file) {
  history.replaceState(null, '', location.pathname);
  try {
    const r = await fetch('library/' + encodeURIComponent(file) + '.svg', { cache: 'no-store' });
    if (!r.ok) throw new Error(r.status);
    const meta = new DOMParser().parseFromString(await r.text(), 'image/svg+xml').querySelector('metadata#rembrandt-test');
    const o = meta ? JSON.parse(meta.textContent.replace(/- -/g, '--')) : null;
    if (!o?.nolan) { $('#saveState').textContent = 'not a NOLAN save: open it on Test'; return; }
    if (!Array.isArray(o.settings?.anchors)) { $('#saveState').textContent = 'a NOLAN save of the flat ribbons, before 3D: it cannot open here'; return; }
    undoPush();
    localStorage.setItem(KEY, JSON.stringify(o.settings)); load(); settle();
    $('#saveState').textContent = `opened · ${file.slice(0, 13)}:${file.slice(14)}`;
  } catch { $('#saveState').textContent = 'could not open it from the Library'; }
}

// ---------- the run (Test's) ----------
const post = async path => { try { const r = await fetch(path, { method: 'POST' }); return await r.text(); } catch { return 'start rembrandt.py'; } };
$('#btnDoJob').onclick = async () => {
  await loadInk(); settle();
  const P_ = plan();
  if (!hereNow()) { $('#runState').innerHTML = '<span class="warn">Where the canvas lies: measure it from the cup on the Ink tab first.</span>'; return; }
  if (!P_.rows.length) { $('#runState').innerHTML = '<span class="warn">Nothing to paint.</span>'; return; }
  if (S.ink && cupProblem(cup())) { $('#runState').innerHTML = `<span class="warn">Ink ON: ${cupProblem(cup())}</span>`; return; }
  if (walls()) { $('#runState').innerHTML = `<span class="warn">${walls()}</span>`; return; }
  if (P_.fault) { $('#runState').innerHTML = `<span class="warn">Not run: the plan is wrong — ${P_.fault}.</span>`; return; }
  if (!confirm(`${P_.passes.join(' + ')}: ${P_.rows.length} pieces of row will be run on the machine${S.ink ? `, ${P_.dips} dips in the cup` : ''}`
    + (P_.pastWall > PAST_MANY ? `\n\n${fmt(P_.pastWall / 1000, 1)} m of them lie past the machine's walls and will be pressed along them.` : ''))) return;
  try {
    RUN = P_.blocks;
    const r = await fetch('/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blocks: P_.blocks,
      log: { page: 'nolan', label: nolanLabel(), settings: S, here: hereNow(), fromCup: INK.canvas, ...(S.ink ? { cup: cup() } : {}), estimate_s: Math.round(P_.seconds) } }) });   // the run journal, rembrandt.py
    $('#runState').textContent = await r.text();
  } catch { $('#runState').textContent = 'start rembrandt.py'; }
};
let paused = false;
$('#btnPause').onclick = () => post(paused ? '/run/continue' : '/run/pause');
$('#btnStop').onclick = () => post('/run/stop');
$('#btnKill').onclick = () => post('/run/kill');

// The LCD, as on Test.
const mmss = t => { t = Math.max(0, Math.round(t || 0)); return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
let started = null, lastLcd = null;
function lcd(st) {
  lastLcd = st;
  const P_ = PLAN || EMPTY, live = st && ['running', 'stopping', 'pausing', 'paused'].includes(st.state);
  const pct = st && st.state !== 'idle' ? (st.state === 'done' ? 100 : st.percent || 0) : 0;
  if (live && !started) started = st.started || Date.now() / 1000;
  if (!live) started = null;
  const total = P_.seconds, left = live && started && pct >= 3 ? (Date.now() / 1000 - started) * (100 - pct) / pct : total * (1 - pct / 100);
  const state = !st ? 'no server' : live ? (st.state === 'paused' ? 'paused' : 'live') : st.state === 'idle' ? 'plan' : st.state;
  const b2 = st && P_.blocks[st.block], row = b2 && P_.rows[b2.row - 1];
  const waiting = st?.state === 'paused' && st.message;
  paused = ['paused', 'pausing'].includes(st?.state);
  const keyEl = $('#btnPause');
  keyEl.textContent = paused ? 'CONTINUE' : 'PAUSE'; keyEl.classList.toggle('call', paused); keyEl.disabled = !live;
  const now = waiting ? `❚❚ ${st.message}`
    : live && b2?.home ? 'done · the carriage goes home, the brush off'
    : live && row && b2?.dip ? `${row.name} · row ${row.row} of ${S.rows} · the dip in the cup`
    : live && row ? `${row.name} · row ${row.row} of ${S.rows}` + (st.brush_on ? ' · brush on' : ' · brush off')
    : `${P_.rows.length} pieces · ${P_.passes.join('+') || 'nothing to paint'}`;
  $('#lcd').innerHTML = `
    <div class="lcd-top"><span>${state === 'live' ? '▶ ' : state === 'paused' ? '❚❚ ' : ''}${state}</span><span>${live && st.blocks ? `step ${st.block + 1}/${st.blocks}` : `${fmt(P_.length / 1000, 2)} m`}</span></div>
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
  if (h && st && trailOf && st.started === trailOf && st.x_mm !== null && st.y_mm !== null) {
    const B = RUN || PLAN?.blocks || [], i = st.block, air = !(live && paints(B[i]));
    const q = { x: st.x_mm - h.x, y: st.y_mm - h.y, live, air, i }, l = trail.at(-1);
    const put = (p, a, j) => p && trail.push({ x: p.x - h.x, y: p.y - h.y, live: false, air: a, i: j });
    // Where the brush lands and lifts, from the plan, so the colours part
    // there and not a ping later; a piece run between two pings (22 mm is
    // 0.16 s) from its start to its end.
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
syncTools(); syncRef(); loadRef();
lampSwitch($('#lamp'));
addEventListener('rembrandt-night', () => kick());
setInterval(watch, 500);
new ResizeObserver(layout).observe(stage);
settle(); watch();
loadInk().then(settle);
addEventListener('focus', () => loadInk().then(settle));
const opening = new URLSearchParams(location.search).get('open');
if (opening) openFromLibrary(opening);
