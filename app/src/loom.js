// Rembrandt · LOOM — Claude's own tab (the owner, 2026-10-16, Claude-Freedome/:
// "I offer you full freedom: study the result yourself and come up with a
// tab entirely your own"; "of everything we made the coolest is IMG_0924").
// Its plan in loomplan.js: the canvas one woven cloth of BIAS SNAKE's strips,
// the elbow hopping the brush over the strips a strip goes under — Plain,
// Twill, Basket, Lattice. Two layers (the owner, the same evening, on
// IMG_0921: "two independent runs, and that looks dearer than one: first a
// run with one drawing and a set of our paints, then a second run and another
// direction"), each its own drawing and paints, run on its own. A canvas past
// the reach in two halves, turned round 180° between.
//
// BIAS's page, its own module, no rectangles — the cloth is the canvas: the
// board, the canvas from home, PROGRESS, TEST and PAUSE, the LCD, the zoom,
// the reference, the Library, the paints; the shared modules imported, so a
// fix of the run reaches every tab, and BIAS's bias.js untouched.
//
// mm on the canvas: from its bottom left corner, x right, y up, as a ruler
// reads them. The board, as on BIAS: mm from Here — the canvas's centre — X up,
// Y right.

import { fmt } from './util.js';
import { reach, homeCorner } from './machine.js';
import { plotRun, homeBlocks, DEFAULTS, ELBOW_HOVER, SPEED_MAX, WRIST_MAX, TAIL_MIN, TAIL_MAX, sweepOf } from './strokes.js';
import { cornerDots, testMargin, testSay, NO_DIP } from './band.js';
import { cleanCloth, rectOf, planOf, piecesOf, toCanvas, bowsOf, dragRows, runPasses, dragSvg, marksRows, mixAll, windowOf, LOOM_TONES, WEAVE_NAME, HALVES, MODES,
  ANGLE_MIN, ANGLE_MAX, STEP_MIN, STEP_MAX, ROWS_MIN, ROWS_MAX, BRUSH_NEW, DRAG_NEW, HOP_NEW, TAIL_NEW, RUNOUT_NEW, MARGIN_NEW, CLEAR_NEW, OVERLAP_NEW, DENSITY_NEW, MARKS_DIP } from './loomplan.js';
import { newPattern, recolour, reRows, rowsOf, sausagesOf, stripeAt, markOf, rowName } from './biasplan.js';
import { MARK_SPEED, reachOf } from './ccdplan.js';
import { TAPE_PAINTS, PAINT, newPalette } from './tapeplan.js';
import { CANVAS_FIELDS as FIELDS, canvasNow, setCanvas, onCanvas } from './canvas.js';
import { segments, sticks } from './lcd.js';
import { lampSwitch, themeColor } from './lamp.js';
import { cupOf, cupProblem, dipAt } from './ink.js';
import './ui.js';

const $ = s => document.querySelector(s);
const TAB = 'loom', TAB_NAME = 'LOOM', KEY = 'rembrandt.loom.v01', REF_KEY = 'rembrandt.loom.ref';
const fin = v => Number.isFinite(v);
const along = (p, d, s) => [p[0] + d[0] * s, p[1] + d[1] * s];

// ---------- state ----------
// The two layers, the one chosen — edited, shown, run; the canvas past the
// reach in halves or not; the brush and DRAG: the hop's clearance and the
// tail — the pressure eased off before a lift and on after a landing — are
// LOOM's (est.), the rest BIAS's.
// Layer 2's own at first (Claude's): the strips twice as far apart, Lattice,
// the crossing ones from the bottom left — another way over layer 1's.
const LAYER_NEW = [{}, { step: 18, weave: 'lattice', from2: 'bl' }];
const S = {
  layers: LAYER_NEW.map(cleanCloth), layer: 0, halves: 'one', tool: 'paint', mode: 'snake',
  brush: BRUSH_NEW, drag: DRAG_NEW, hop: HOP_NEW, tail: TAIL_NEW, clear: CLEAR_NEW, runout: RUNOUT_NEW, margin: MARGIN_NEW, overlap: OVERLAP_NEW, travel: 180,
  boardW: 300, boardH: 300, edgeLeft: 50, edgeBottom: 0,
  refOpacity: 30, view: 'result', density: DENSITY_NEW, paint: 'magenta', ink: true,
};
const NUM = ['layer', 'brush', 'drag', 'hop', 'tail', 'clear', 'runout', 'margin', 'overlap', 'boardW', 'boardH', 'edgeLeft', 'edgeBottom', 'refOpacity', 'density'];
const VIEWS = ['drag', 'result'];
let FRESH = true;   // nothing kept yet: both layers in Crimson Ruby
function load() {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (!o) return;
    for (const k of NUM) if (fin(o[k])) S[k] = o[k];
    if (Array.isArray(o.layers) && o.layers.length === 2) S.layers = o.layers.map(cleanCloth);
    if (HALVES.includes(o.halves)) S.halves = o.halves;
    if (MODES.includes(o.mode)) S.mode = o.mode;
    if (VIEWS.includes(o.view)) S.view = o.view;
    if (typeof o.ink === 'boolean') S.ink = o.ink;
    if (PAINT[o.paint]) S.paint = o.paint;
    S.layer = S.layer === 1 ? 1 : 0;
    FRESH = false;
  } catch { }
}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { } };
const cl = () => S.layers[S.layer];
const rectNow = (li = S.layer) => rectOf(S.layers[li], S.boardW, S.boardH);
const layerName = (li = S.layer) => `Layer ${li + 1}`;

// ---------- the plan (loomplan.js), a layer each ----------
const po = () => ({ cw: S.boardW, ch: S.boardH, brush: S.brush, hop: S.hop, tail: S.tail, runout: S.runout, margin: S.margin, clear: S.clear, overlap: S.overlap });
const PL = [null, null], plKeys = ['', ''];
function planNow(li = S.layer) {
  const key = JSON.stringify([S.layers[li], S.halves, po()]);
  if (PL[li] && key === plKeys[li]) return PL[li];
  plKeys[li] = key; PL[li] = planOf({ ...S.layers[li], halves: S.halves }, po());
  return PL[li];
}

// ---------- the cup, for TEST and MARKS, and the canvas from home ----------
let INK = {};
const cup = () => cupOf(INK);
async function loadInk() {
  try { const r = await fetch('/ink', { cache: 'no-store' }); INK = r.ok ? await r.json() : {}; } catch { INK = {}; }
}
const hereNow = () => { const R = reach(); return { x: R.x.min + S.edgeBottom + S.boardH / 2, y: R.y.min + S.edgeLeft + S.boardW / 2 }; };
const dipCup = () => { const c = cup(), d = dipAt(c); return d ? { ...c, x: d.x, y: d.y } : c; };

// ---------- the runs: DRAG, the snake or through the air, MARKS ----------
// A layer at a time; on a halved canvas the near half, home, the pause for the
// turn, the far half (loomplan.js, runPasses). The elbow lifts the brush up
// through every hop: plotRun's lift on, the hops its turns.
const RUNS = {}, MODE_NAME = { snake: 'snake', air: 'air' };
let busy = false;
const EMPTY = { blocks: [], rows: [], seconds: 0, length: 0, carriage: null, runs: 0, mm: 0, need: 0, fault: '', halves: 0 };
const runOpts = rows => ({ ...DEFAULTS, speed: S.drag, travel: S.travel, tail: S.tail, lift: true, ink: false, snake: true, pause: false, rows, here: hereNow(), cup: dipCup(), noDipUnder: NO_DIP, hover: ELBOW_HOVER });
function dragRun(mode = S.mode, li = S.layer) {
  const P = planNow(li), here = hereNow(), id = `${li}:${mode}`, key = JSON.stringify([plKeys[li], mode, S.drag, S.travel, S.tail, here]);
  if (RUNS[id]?.key === key) return RUNS[id];
  const D = dragRows(P, { ...po(), mode }), R = D.passes.length ? runPasses(D.passes, { ...runOpts(D.runs), pauseAtEnds: true }) : null;
  RUNS[id] = { key, over: overWalls(D.passes), ...(R ? { ...R, rows: D.info, runs: D.runs, mm: D.length, halves: D.passes.length } : EMPTY) };
  return RUNS[id];
}
// How far the brush's way goes past each wall as planned, before plotRun
// presses it into them, and past the margin round the canvas (BIAS's; mm)
function overWalls(passes) {
  const h = hereNow(), W = reach(), out = { bottom: 0, top: 0, left: 0, right: 0, margin: 0 }, mx = S.boardH / 2 + S.margin, my = S.boardW / 2 + S.margin;
  for (const pass of passes) for (const p of pass.ps) for (const g of p) for (const q of [g.a, g.b]) {
    const x = h.x + q.x, y = h.y + q.y;
    out.bottom = Math.max(out.bottom, W.x.min - x); out.top = Math.max(out.top, x - W.x.max); out.left = Math.max(out.left, W.y.min - y); out.right = Math.max(out.right, y - W.y.max);
    out.margin = Math.max(out.margin, Math.max(Math.abs(q.x) - mx, Math.abs(q.y) - my) + S.brush / 2);
  }
  return out;
}
const MARKS_RUN = {};
function marksRun(li = S.layer) {
  const P = planNow(li), here = hereNow(), cupNow = dipCup(), key = JSON.stringify([plKeys[li], S.ink, S.travel, here, cupNow]);
  if (MARKS_RUN[li]?.key === key) return MARKS_RUN[li];
  const M = marksRows(P, { ...po(), ink: S.ink }), R = M.passes.length ? runPasses(M.passes, { ...runOpts(M.marks), lift: false, speed: MARK_SPEED, ink: S.ink, noDipUnder: 0 }) : null;
  MARKS_RUN[li] = { key, ...(R ? { ...R, rows: M.info, marks: M.marks, halves: M.passes.length } : { ...EMPTY, marks: 0 }) };
  return MARKS_RUN[li];
}

// ---------- the board ----------
const cv = $('#cv'), ctx = cv.getContext('2d'), stage = $('#stage'), board = $('#board');
let g = ctx;
const PAD = 30;
function view() {
  const hw = S.boardW / 2 + S.margin, hh = S.boardH / 2 + S.margin, v = { x0: -hh - PAD, x1: hh + PAD, y0: -hw - PAD, y1: hw + PAD };
  const h = hereNow(), hc = homeCorner(), q = { x: hc.x - h.x, y: hc.y - h.y };
  v.x0 = Math.min(v.x0, q.x - 24); v.x1 = Math.max(v.x1, q.x + 24); v.y0 = Math.min(v.y0, q.y - 24); v.y1 = Math.max(v.y1, q.y + 48);
  return v;
}
function areaNow() {
  const h = hereNow(), R = reach();
  return { x0: R.x.min - h.x, x1: R.x.max - h.x, y0: R.y.min - h.y, y1: R.y.max - h.y, R };
}
let V = view(), k = 1, dpr = 1, kFit = 1;
const sx = p => (p[0] - V.y0) * k, sy = p => (V.x1 + p[1]) * k;
const scr = q => [sx([q[0] - S.boardW / 2]), sy([0, S.boardH / 2 - q[1]])];
const toCanvasPt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / k + V.y0, (e.clientY - r.top) / k - V.x1]; };
const toMm = e => { const c = toCanvasPt(e); return [c[0] + S.boardW / 2, S.boardH / 2 - c[1]]; };
const inMm = c => { c.setTransform(k * dpr, 0, 0, -k * dpr, (-S.boardW / 2 - V.y0) * k * dpr, (V.x1 + S.boardH / 2) * k * dpr); return c; };
const ZOOMS = [0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8];
let Z = 1, ZC = null;
function layout() {
  const F = view(), r = stage.getBoundingClientRect(), m = r.width < 600 ? 10 : 36, sw = F.y1 - F.y0, sh = F.x1 - F.x0;
  const ps = $('#paints').getBoundingClientRect(), side = ps.height >= r.height - 1;
  const stripW = side ? ps.width : 0, stripH = side ? 0 : ps.height;
  kFit = Math.max(0.2, Math.min((r.width - stripW - 2 * m) / sw, (r.height - stripH - 2 * m) / sh));
  k = kFit * Z;
  dpr = window.devicePixelRatio || 1;
  const w = Math.round(Math.min(sw * k, r.width - stripW)), h = Math.round(Math.min(sh * k, r.height - stripH)), ww = w / k, hh = h / k;
  const mid = { x: (F.x0 + F.x1) / 2, y: (F.y0 + F.y1) / 2 }, c = ZC || mid;
  const cy = ww >= sw - 1e-6 ? mid.y : Math.max(F.y0 + ww / 2, Math.min(F.y1 - ww / 2, c.y));
  const cx = hh >= sh - 1e-6 ? mid.x : Math.max(F.x0 + hh / 2, Math.min(F.x1 - hh / 2, c.x));
  if (ZC) ZC = { x: cx, y: cy };
  V = { y0: cy - ww / 2, y1: cy + ww / 2, x0: cx - hh / 2, x1: cx + hh / 2 };
  board.style.width = w + 'px'; board.style.height = h + 'px'; board.style.marginLeft = stripW + 'px'; board.style.marginBottom = stripH + 'px';
  cv.style.width = w + 'px'; cv.style.height = h + 'px'; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  draw();
}
let drawSoon = 0;
const kick = () => { if (!drawSoon) drawSoon = requestAnimationFrame(() => { drawSoon = 0; draw(); }); };
const font = (px, w = '') => `${w} ${px}px ` + getComputedStyle(document.body).getPropertyValue('--mono');
const ORANGE = '#EB7A25', GROUND = '#FBFAF7', SECOND = '#B3470C';
function draw() {
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const W = g.canvas.width / dpr, H = g.canvas.height / dpr, hw = S.boardW / 2, hh = S.boardH / 2;
  g.fillStyle = themeColor('--stage', '#E2DED6'); g.fillRect(0, 0, W, H);
  const area = areaNow(), ax = y => (y - V.y0) * k, ay = x => (V.x1 - x) * k, night = document.documentElement.classList.contains('night');
  const areaRect = () => g.rect(ax(area.y0), ay(area.x1), (area.y1 - area.y0) * k, (area.x1 - area.x0) * k);
  {                                                                                    // the grid every 100 mm, machine mm
    const h = hereNow();
    g.save(); g.strokeStyle = night ? 'rgba(255,255,255,.05)' : 'rgba(36,34,31,.07)'; g.lineWidth = 1; g.fillStyle = themeColor('--mute', '#7D776D'); g.font = font(10);
    for (let x = Math.ceil((h.x + V.x0) / 100) * 100; x <= h.x + V.x1; x += 100) { const Y = ay(x - h.x); g.beginPath(); g.moveTo(0, Y); g.lineTo(W, Y); g.stroke(); g.textAlign = 'left'; g.fillText(`X ${x}`, 4, Y + 3); }
    for (let y = Math.ceil((h.y + V.y0) / 100) * 100; y <= h.y + V.y1; y += 100) { const X = ax(y - h.y); g.beginPath(); g.moveTo(X, 0); g.lineTo(X, H); g.stroke(); g.textAlign = 'center'; g.fillText(`Y ${y}`, X, H - 5); }
    g.restore();
    g.fillStyle = night ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.35)'; g.beginPath(); areaRect(); g.fill();
  }
  if (S.margin > 0) {                                                                 // the margin round the canvas, where the brush turns
    const m = S.margin, X0 = sx([-hw - m]), Y0 = sy([0, -hh - m]), MW = (S.boardW + 2 * m) * k, MH = (S.boardH + 2 * m) * k;
    g.save(); g.fillStyle = night ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.55)'; g.fillRect(X0, Y0, MW, MH);
    g.strokeStyle = night ? 'rgba(255,255,255,.35)' : 'rgba(36,34,31,.35)'; g.lineWidth = 1; g.setLineDash([3, 4]); g.strokeRect(X0 + .5, Y0 + .5, MW - 1, MH - 1); g.restore();
  }
  g.fillStyle = GROUND; g.fillRect(sx([-hw]), sy([0, -hh]), S.boardW * k, S.boardH * k);   // the canvas
  if (S.view === 'result') drawResult(); else { drawLanes(); drawSausages(); }
  if (S.halves !== 'one') drawSeam();
  g.save(); g.beginPath(); g.rect(sx([-hw]), sy([0, -hh]), S.boardW * k, S.boardH * k); g.clip();   // past the walls: hatched
  g.beginPath(); g.rect(0, 0, W, H); areaRect(); g.clip('evenodd');
  g.strokeStyle = 'rgba(179,71,12,.45)'; g.lineWidth = 1;
  for (let d = -H; d < W; d += 7) { g.beginPath(); g.moveTo(d, H); g.lineTo(d + H, 0); g.stroke(); }
  g.restore();
  if (REF && S.refOpacity > 0) {
    const img = REF.img, s = Math.min(S.boardW / img.naturalWidth, S.boardH / img.naturalHeight), w = img.naturalWidth * s, h = img.naturalHeight * s;
    g.globalAlpha = S.refOpacity / 100; g.drawImage(img, sx([-w / 2]), sy([0, -h / 2]), w * k, h * k); g.globalAlpha = 1;
  }
  g.strokeStyle = 'rgba(36,34,31,.8)'; g.lineWidth = 1; g.strokeRect(sx([-hw]) + .5, sy([0, -hh]) + .5, S.boardW * k - 1, S.boardH * k - 1);
  { g.save(); g.strokeStyle = ORANGE; g.lineWidth = 1.2; g.setLineDash([6, 4]); g.beginPath(); areaRect(); g.stroke(); g.restore(); }   // the walls
  g.font = font(10); g.fillStyle = '#B3470C'; g.textAlign = 'left';
  g.fillText(`canvas ${S.boardW} × ${S.boardH} mm · ${layerName()} · ${WEAVE_NAME[cl().weave]} ${fmt(cl().angle, 1)}° · ${fmt(cl().step, 1)} mm`, sx([-hw]), sy([0, -hh]) - 6);
  if (S.margin > 0) { g.fillStyle = themeColor('--mute', '#7D776D'); g.fillText(`margin ${fmt(S.margin, 0)} mm`, sx([-hw - S.margin]), sy([0, hh + S.margin]) + 13); }
  const h = hereNow(), msx = q => (q.y - V.y0) * k, msy = q => (V.x1 - q.x) * k, ink = themeColor('--ink', '#24221F');
  const T = testDots();
  g.save(); g.strokeStyle = 'rgba(36,34,31,.55)'; g.lineWidth = 1;                     // TEST's dots: a small cross each
  for (const d of T?.dots || []) { const X = msx(d.at), Y = msy(d.at); g.beginPath(); g.moveTo(X - 5, Y); g.lineTo(X + 5, Y); g.moveTo(X, Y - 5); g.lineTo(X, Y + 5); g.stroke(); }
  g.restore();
  const hc = homeCorner(), home = { x: hc.x - h.x, y: hc.y - h.y }, hX = msx(home), hY = msy(home);
  g.strokeStyle = ink; g.lineWidth = 1.2; g.strokeRect(hX - 4, hY - 4, 8, 8); g.fillStyle = ink; g.textAlign = 'left'; g.fillText('home', hX + 8, hY - 6);
  drawTrail();
}

// ---------- the strips, as the brush lays them ----------
// Every stretch with the brush down a strip of its own colour — the rising
// ones grey, the crossing ones rust — laid in running order, opaque, so the
// later lies on top and a hop leaves the earlier one whole: the weave reads
// on Drag as it will on the canvas. Layer 2 over layer 1's, faint. Where the
// brush lands an orange dot and the strip's turn; an arrow its way; the
// snake's way off the canvas dashed, the flights dashed blue.
const STRIP = { A: ['#D8D2C7', 'rgba(36,34,31,.55)'], B: ['#EBC5AA', 'rgba(179,71,12,.6)'] }, FAINT = { A: ['#EEEBE5', 'rgba(36,34,31,.12)'], B: ['#F3E6DC', 'rgba(179,71,12,.14)'] };
function strips(P, look) {
  const o = po(), bw = S.brush / 2, edge = Math.max(0.15, 0.9 / k);
  g.save(); inMm(g); g.lineJoin = 'miter';
  for (const run of P.runs) for (const st of run.strokes) {
    if (!st) continue;
    const [fill, line] = look[st.lane.fam], u = run.turned ? [-st.u[0], -st.u[1]] : st.u, n = [-u[1] * bw, u[0] * bw];
    g.fillStyle = fill; g.strokeStyle = line; g.lineWidth = edge;
    for (const [a, b, hop] of piecesOf(st)) {
      if (hop) continue;
      const p = toCanvas(run, along(st.P0, st.u, a), o), q = toCanvas(run, along(st.P0, st.u, b), o);
      g.beginPath(); g.moveTo(p[0] + n[0], p[1] + n[1]); g.lineTo(q[0] + n[0], q[1] + n[1]); g.lineTo(q[0] - n[0], q[1] - n[1]); g.lineTo(p[0] - n[0], p[1] - n[1]); g.closePath();
      g.fill(); g.stroke();
    }
  }
  g.restore();
}
function drawLanes() {
  const P = planNow(), o = po(), snake = S.mode !== 'air';
  g.save(); g.beginPath(); g.rect(sx([-S.boardW / 2 - S.margin]), sy([0, -S.boardH / 2 - S.margin]), (S.boardW + 2 * S.margin) * k, (S.boardH + 2 * S.margin) * k); g.clip();
  if (S.layer === 1) strips(planNow(0), FAINT);
  strips(P, STRIP);
  g.restore();
  const ppx = P.cloth.step * k;
  if (ppx < 2) return;
  g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.lineCap = 'round'; g.lineJoin = 'round';
  for (const run of P.runs) {
    const W = bowsOf(run, o, snake), pt = q => scr(toCanvas(run, q, o)), line = pts => { g.beginPath(); pts.forEach((q, i) => { const s = pt(q); i ? g.lineTo(s[0], s[1]) : g.moveTo(s[0], s[1]); }); g.stroke(); };
    g.strokeStyle = 'rgba(36,34,31,.4)'; g.lineWidth = 1; g.setLineDash([3, 3]);
    for (const w of W) w.pieces.forEach(q => { if (!q.hop) line([q.a, q.b]); });
    g.strokeStyle = 'rgba(79,195,247,.85)'; g.lineWidth = 1.2; g.setLineDash([5, 4]);
    W.slice(1).forEach((w, i) => line([W[i].pieces.at(-1).b, w.pieces[0].a]));
    g.setLineDash([]);
    const lands = new Set(W.map(w => w.lanes[0]));
    run.strokes.forEach((st, j) => {
      if (!st || ppx < 4) return;
      const a = pt(st.P0), b = pt(st.P1), col = st.lane.fam === 'A' ? themeColor('--ink', '#24221F') : SECOND;
      const d = [b[0] - a[0], b[1] - a[1]], L = Math.hypot(d[0], d[1]) || 1, e = [d[0] / L, d[1] / L], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], w = Math.min(6, ppx / 3);
      if (L >= 18) { g.strokeStyle = col; g.lineWidth = 1.6; g.beginPath(); g.moveTo(m[0] - e[0] * w - e[1] * w, m[1] - e[1] * w + e[0] * w); g.lineTo(m[0], m[1]); g.lineTo(m[0] - e[0] * w + e[1] * w, m[1] - e[1] * w - e[0] * w); g.stroke(); }
      const land = lands.has(j);
      g.fillStyle = land ? ORANGE : 'rgba(235,122,37,.45)'; g.beginPath(); g.arc(a[0], a[1], land ? 3.5 : 2, 0, 7); g.fill();
      if (ppx >= 11) { g.fillStyle = col; g.font = font(!j ? 11 : 9, !j ? 700 : ''); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(`${run.turned ? '↻' : ''}${j + 1}`, a[0] - e[0] * 9, a[1] - e[1] * 9); }
    });
  }
  g.restore();
}
// The middle of a halved canvas: the overlap both halves paint, shaded, the
// middle dashed; the halves' numbers — 2 after the turn
function drawSeam() {
  const W = windowOf(S.halves, S.boardW, S.boardH, S.overlap), lr = S.halves === 'lr', mid = lr ? S.boardW / 2 : S.boardH / 2, ov = lr ? W.x1 - mid : W.y1 - mid;
  const box = lr ? [mid - ov, 0, 2 * ov, S.boardH] : [0, mid - ov, S.boardW, 2 * ov];
  g.save(); inMm(g); g.fillStyle = 'rgba(235,122,37,.10)'; g.fillRect(...box); g.restore();
  g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.strokeStyle = ORANGE; g.lineWidth = 1.2; g.setLineDash([8, 5]);
  const a = scr(lr ? [mid, 0] : [0, mid]), b = scr(lr ? [mid, S.boardH] : [S.boardW, mid]);
  g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.setLineDash([]);
  g.font = font(12, 700); g.fillStyle = '#B3470C'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const c1 = scr(lr ? [mid / 2, S.boardH - 12] : [S.boardW - 40, mid / 2]), c2 = scr(lr ? [mid * 1.5, S.boardH - 12] : [S.boardW - 40, mid * 1.5]);
  g.fillText('half 1', c1[0], c1[1]); g.fillText('half 2 · after the turn ↻', c2[0], c2[1]);
  g.restore();
}
// The sausages on Drag, BIAS's: each a box of its paint, MARKS' dashes under them; a paint chosen in the list, its own outlined
const WATER = '#6F8FB8';
const shown = () => EDIT?.mode === 'change' ? EDIT.id : null;
function drawSausages() {
  const ss = sausagesOf(rectNow()), show = shown();
  if (!ss.length) return;
  g.save(); inMm(g); g.lineCap = 'round';
  g.strokeStyle = WATER; g.globalAlpha = show ? 0.12 : 0.28; g.lineWidth = S.brush;
  for (const q of ss) { const m = markOf(q, S.brush); g.beginPath(); g.moveTo(m.a[0], m.a[1]); g.lineTo(m.b[0], m.b[1]); g.stroke(); }
  g.lineWidth = Math.max(0.25, 1 / k); g.strokeStyle = 'rgba(36,34,31,.75)';
  for (const q of ss) { g.globalAlpha = show && q.paint !== show ? 0.22 : 1; g.fillStyle = PAINT[q.paint].hex; g.fillRect(...q.box); g.strokeRect(...q.box); }
  g.globalAlpha = 1;
  if (show) { g.strokeStyle = '#000'; g.lineWidth = Math.max(0.5, 2 / k); for (const q of ss) if (q.paint === show) g.strokeRect(...q.box); }
  g.restore();
}
// The Result: layer 1, and on Layer 2 the second over it as it set — each
// its sausages, then its strips' grooves as the DRAG key chosen runs them
// (loomplan.js, mixAll), the brush up over the hops; where a strip dives
// under another a soft shadow across it, the tuck. Drawn once into a bitmap
// the canvas's size, BIAS's streaks.
let RESULT = null;
const STREAK = 0.12, STREAK_MM = 15, TUCK = 0.6;                                    // est., BIAS's; the tuck's shadow mm
const RGROUND = [251, 250, 247];
const hash = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const wave = (t, s) => { const u = t / STREAK_MM + hash(s, 7) * 50, f = Math.floor(u), x = u - f, e = x * x * (3 - 2 * x); return hash(f, s) * (1 - e) + hash(f + 1, s) * e; };
function resultBitmap() {
  const layers = S.layer === 1 ? [0, 1] : [0], key = JSON.stringify([layers.map(li => planNow(li) && plKeys[li]), S.density, S.mode]);
  if (RESULT?.key === key) return RESULT;
  const W = S.boardW, H = S.boardH, ppm = Math.min(8, 4096 / Math.max(W, H)), c2 = document.createElement('canvas');
  c2.width = Math.ceil(W * ppm); c2.height = Math.ceil(H * ppm);
  const c = c2.getContext('2d');
  c.setTransform(ppm, 0, 0, -ppm, 0, H * ppm);
  c.fillStyle = GROUND; c.fillRect(0, 0, W, H);
  for (const li of layers) {
    const P = planNow(li);
    for (const q of sausagesOf(P.rect)) { c.fillStyle = PAINT[q.paint].hex; c.fillRect(...q.box); }
    c.lineCap = 'butt'; c.lineJoin = 'round';
    const M = mixAll(P, { ...po(), density: S.density, mode: S.mode });
    for (const q of M.strokes) {
      const kk = 1 + q.shade, seed = q.j * 13 + q.g + q.run * 101 + li * 977, at = i => [q.start[0] + q.u[0] * i * q.h, q.start[1] + q.u[1] * i * q.h];
      c.lineWidth = q.w * 1.25;
      let style = null;
      for (let i = 0; i < q.n; i++) {
        const t = i * q.h, cov = Math.min(1, q.cover[i]);
        if (cov < 0.03) { if (style) c.stroke(); style = null; continue; }
        const nz = kk * (1 + STREAK * (2 * wave(t, seed) - 1));
        const st = `rgb(${[0, 1, 2].map(m => Math.round(Math.max(0, Math.min(255, RGROUND[m] + (q.rgb[3 * i + m] * 255 * nz - RGROUND[m]) * cov)) / 4) * 4).join(',')})`;
        const p = at(i);
        if (st !== style) {
          const was = style; if (was) c.stroke();
          style = st; c.strokeStyle = st; c.beginPath();
          const p0 = was ? at(i - 1) : p; c.moveTo(p0[0], p0[1]);
        }
        c.lineTo(p[0], p[1]);
      }
      if (style) c.stroke();
    }
    c.lineCap = 'round'; c.strokeStyle = 'rgba(30,12,12,.28)'; c.lineWidth = TUCK;   // the tucks
    for (const t of M.tucks) {
      const n = [-t.u[1] * t.w / 2, t.u[0] * t.w / 2], p = along(t.p, t.u, t.out ? -TUCK / 2 : TUCK / 2);
      c.beginPath(); c.moveTo(p[0] - n[0], p[1] - n[1]); c.lineTo(p[0] + n[0], p[1] + n[1]); c.stroke();
    }
  }
  RESULT = { key, c: c2 };
  return RESULT;
}
function drawResult() {
  const B = resultBitmap();
  g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.imageSmoothingQuality = 'high';
  g.drawImage(B.c, sx([-S.boardW / 2]), sy([0, -S.boardH / 2]), S.boardW * k, S.boardH * k);
  g.restore();
}

// ---------- the run as it goes (BIAS's) ----------
let trailOf = null, lastSt = null, RUN = null, RUN_INFO = null;
const AIR = '#4FC3F7', PAPER = '#E5203A';
function pathOf(B, i) {
  let p = startOf(B, i);
  const out = p ? [p] : [];
  for (const c of B[i]?.cmds || []) {
    const t = c.split(' '), v = t.slice(1).map(Number);
    if (t[0] === 'L' || t[0] === 'M') { p = { x: v[0], y: v[1] }; out.push(p); }
    else if (t[0] === 'A' && p) {
      const c0 = { x: v[0], y: v[1] }, e = { x: v[2], y: v[3] }, d = v[4], r = Math.hypot(p.x - c0.x, p.y - c0.y);
      const sw = sweepOf({ a: p, b: e, c: c0, d }), a0 = Math.atan2(p.y - c0.y, p.x - c0.x), n = Math.max(2, Math.ceil(sw * r / 2));
      for (let j = 1; j <= n; j++) out.push({ x: c0.x + r * Math.cos(a0 + d * sw * j / n), y: c0.y + r * Math.sin(a0 + d * sw * j / n) });
      p = e;
    }
  }
  return out;
}
function drawTrail() {
  const st = lastSt;
  if (!st || !trailOf || st.started !== trailOf) return;
  const B = RUN || dragRun().blocks, h = hereNow(), at = st.x_mm !== null && st.y_mm !== null ? { x: st.x_mm, y: st.y_mm } : null;
  const live = ['running', 'stopping', 'pausing', 'paused'].includes(st.state);
  const X = q => (q.y - h.y - V.y0) * k, Y = q => (V.x1 - q.x + h.x) * k;
  g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.lineWidth = 1.2; g.lineJoin = 'round';
  // on a halved canvas the trail since the turn only: the first half's lies on the canvas as it was
  const from = B.findLastIndex((b, j) => b.kind === 'pause' && j <= st.block) + 1;
  for (let j = from; j <= Math.min(st.block, B.length - 1); j++) {
    if (B[j]?.kind !== 'move') continue;
    let pts = pathOf(B, j);
    if (j === st.block && st.state !== 'done' && at && pts.length > 1) {
      let best = 0, bd = Infinity;
      pts.forEach((q, m) => { const d = Math.hypot(q.x - at.x, q.y - at.y); if (d < bd) { bd = d; best = m; } });
      pts = [...pts.slice(0, best + 1), at];
    }
    if (pts.length < 2) continue;
    g.strokeStyle = paints(B[j]) ? PAPER : AIR; g.beginPath();
    pts.forEach((q, m) => m ? g.lineTo(X(q), Y(q)) : g.moveTo(X(q), Y(q))); g.stroke();
  }
  if (live && at) { g.fillStyle = paints(B[st.block]) ? PAPER : AIR; g.beginPath(); g.arc(X(at), Y(at), 4, 0, Math.PI * 2); g.fill(); }
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
const UNDO_KEYS = ['layers', 'layer', 'halves', 'brush', 'drag', 'hop', 'tail', 'clear', 'runout', 'margin', 'overlap', 'density'];
let undoStack = [], redoStack = [];
const snapshot = () => JSON.stringify(Object.fromEntries(UNDO_KEYS.map(q => [q, S[q]])));
function undoPush() { undoStack.push(snapshot()); if (undoStack.length > 200) undoStack.shift(); redoStack = []; }
function restore(js) { Object.assign(S, JSON.parse(js)); settle(); }
function undo() { if (!undoStack.length) return; redoStack.push(snapshot()); restore(undoStack.pop()); }
function redo() { if (!redoStack.length) return; undoStack.push(snapshot()); restore(redoStack.pop()); }

// ---------- M: the sausages by hand (BIAS's) ----------
// A click on a stripe of an edge or a row of the layer chosen: it takes the
// chosen paint; with that paint already, it goes. A layer with no pattern
// gets its stripes first, no paint in them.
const SEG_PX = 12;
const seedNew = () => Math.floor(Math.random() * 1e9);
function paintAt(p) {
  const c = cl(), r = rectNow();
  if (p[0] < -SAUSAGE_REACH || p[1] < -SAUSAGE_REACH || p[0] > S.boardW + SAUSAGE_REACH || p[1] > S.boardH + SAUSAGE_REACH) return;
  undoPush();
  if (!c.pat) c.pat = newPattern(r, null, seedNew());
  const st = stripeAt({ ...r, pat: c.pat }, p, Math.max(5, SEG_PX / k));
  if (!st || st.s < 0) { undoStack.pop(); return; }
  const seg = c.pat.segs[st.key][st.s];
  seg[2] = seg[2] === S.paint ? null : S.paint;
  settle();
}
const SAUSAGE_REACH = 10;
function sausageUnder(p) {
  for (const q of sausagesOf(rectNow())) { const [x, y, w, h] = q.box; if (p[0] >= x - 1.5 && p[0] <= x + w + 1.5 && p[1] >= y - 1.5 && p[1] <= y + h + 1.5) return q; }
  return null;
}
function showTip(e) {
  const tip = $('#spokeTip'), q = S.view === 'drag' ? sausageUnder(toMm(e)) : null;
  if (!q) { tip.hidden = true; return; }
  const pt = PAINT[q.paint], rb = board.getBoundingClientRect();
  tip.innerHTML = `<i style="background:${pt.hex}"></i>${pt.name}${q.thin ? ' <em>thin</em>' : ''} <em>· ${layerName()} · ${rowName(q.key)}, ${fmt(q.len, 0)} mm</em>`;
  tip.hidden = false;
  const X = e.clientX - rb.left, Y = e.clientY - rb.top, w = tip.offsetWidth;
  tip.style.left = `${X + 14 + w > rb.width ? X - 14 - w : X + 14}px`; tip.style.top = `${Math.max(0, Y - 30)}px`;
}
cv.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') $('#spokeTip').hidden = true; });
cv.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'mouse') showTip(e);
  if (e.button !== 0) return;
  if (S.tool === 'paint') { if (S.view !== 'drag') { S.view = 'drag'; settle(); return; } paintAt(toMm(e)); }
});
cv.addEventListener('pointermove', e => { cv.style.cursor = S.tool === 'paint' && S.view === 'drag' ? 'crosshair' : ''; showTip(e); });
function setTool(t) { S.tool = t; if (t === 'paint') S.view = 'drag'; settle(); }
const HINT = {
  paint: 'M: a click on a stripe of an edge or a row puts a sausage of the chosen paint there, on the layer chosen; a click with the paint it has takes it away. A paint: the strip on the left. On the Result a click goes to Drag.',
};
$('#btnUndo').onclick = undo; $('#btnRedo').onclick = redo;
document.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => setTool(b.dataset.tool));
addEventListener('keydown', e => {
  if (e.key === 'Escape') post('/run/stop');                                         // Esc = STOP, as on every tab with a run
  if (e.target.matches('input,select,textarea')) return;
  const cmd = e.metaKey || e.ctrlKey;
  if (cmd && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (cmd) return;
  if (e.key.toLowerCase() === 'm') setTool('paint');
  if (e.key === '1' || e.key === '2') { S.layer = +e.key - 1; settle(); }
});

// The zoom (BIAS's)
function zoomTo(z, e) {
  z = Math.max(ZOOMS[0], Math.min(ZOOMS.at(-1), z));
  if (Math.abs(z - 1) < 1e-6) { Z = 1; ZC = null; layout(); showZoom(); return; }
  const at = e ? toCanvasPt(e) : null, r = cv.getBoundingClientRect();
  if (at) {
    const kz = kFit * z, ox = e.clientX - r.left - r.width / 2, oy = e.clientY - r.top - r.height / 2;
    ZC = { y: at[0] - ox / kz, x: -at[1] + oy / kz };
  } else ZC = ZC || { x: (V.x0 + V.x1) / 2, y: (V.y0 + V.y1) / 2 };
  Z = z; layout(); showZoom();
}
const zoomStep = up => zoomTo(up ? ZOOMS.find(q => q > Z + 1e-6) ?? Z : [...ZOOMS].reverse().find(q => q < Z - 1e-6) ?? Z);
function showZoom() {
  $('#zoomFit').textContent = `${Math.round(Z * 100)}%`;
  $('#zoomOut').disabled = Z <= ZOOMS[0] + 1e-6; $('#zoomIn').disabled = Z >= ZOOMS.at(-1) - 1e-6;
}
$('#zoomIn').onclick = () => zoomStep(true);
$('#zoomOut').onclick = () => zoomStep(false);
$('#zoomFit').onclick = () => zoomTo(1);
cv.addEventListener('wheel', e => {
  e.preventDefault();
  if (e.ctrlKey) { zoomTo(Z * Math.exp(-e.deltaY * 0.01), e); return; }
  if (Z <= 1) return;
  const c = ZC || { x: (V.x0 + V.x1) / 2, y: (V.y0 + V.y1) / 2 };
  ZC = { x: c.x - e.deltaY / k, y: c.y + e.deltaX / k }; layout();
}, { passive: false });
addEventListener('keydown', e => {
  if (!(e.metaKey || e.ctrlKey) || e.target.matches('input,textarea')) return;
  if (e.key === '=' || e.key === '+') { e.preventDefault(); zoomStep(true); }
  else if (e.key === '-') { e.preventDefault(); zoomStep(false); }
  else if (e.key === '0') { e.preventDefault(); zoomTo(1); }
});

// ---------- the panel: the layer, its weave and drawing ----------
const gapOf = () => cl().step - S.brush;
const gapText = () => gapOf() > 0.05 ? `white <b>${fmt(gapOf(), 1)} mm</b> between neighbours` : gapOf() < -0.05 ? `neighbours overlapping by <b>${fmt(-gapOf(), 1)} mm</b>` : 'neighbours edge to edge';
const rowsText = c => c.rows === 2 ? '2 · the edges' : `${c.rows} · ${fmt(S.boardW / (c.rows - 1), 1)} mm apart`;
$('#clothSl').innerHTML = `
  <label class="sl" title="The rising strips above the horizontal, ${ANGLE_MIN} … ${ANGLE_MAX}°; the crossing ones square to them. 45°: the intrecciato's, and IMG_0924's"><span class="slh"><span>Angle, °</span><input class="num" type="number" id="cAn" min="${ANGLE_MIN}" max="${ANGLE_MAX}" step="0.5" aria-label="Angle"></span><input class="slider" type="range" id="cA" min="${ANGLE_MIN}" max="${ANGLE_MAX}" step="0.5"></label>
  <label class="sl" title="Strip centre to strip centre, ${STEP_MIN} … ${STEP_MAX} mm, one strip of each family through the canvas's centre. IMG_0924: 8 mm with the 6 mm brush; a hop needs the strip and its clearance either side, so 9"><span class="slh"><span>Step, mm</span><input class="num" type="number" id="cSn" min="${STEP_MIN}" max="${STEP_MAX}" step="0.5" aria-label="Step"></span><input class="slider" type="range" id="cS" min="${STEP_MIN}" max="${STEP_MAX}" step="0.5"></label>
  <label class="sl" title="Where the sausages lie, BIAS's: the four edges, where every strip lands, and vertical rows inside, evenly — Rows counts the sides. Three: the middle row, IMG_0924's fold"><span class="slh"><span>Rows</span><span class="val" id="o-cR"></span></span><input class="slider" type="range" id="cR" min="${ROWS_MIN}" max="${ROWS_MAX}" step="1"></label>`;
{
  const pair = (sl, num, key, lo, hi) => {
    const to = v => {
      if (!fin(v)) return;
      if (!busy) undoPush(); busy = true; cl()[key] = Math.max(lo, Math.min(hi, v));
      if (document.activeElement !== num) num.value = cl()[key];
      sl.value = cl()[key]; showCloth(); kick();
    };
    sl.oninput = () => to(+sl.value); sl.onchange = () => settle();
    num.oninput = () => { if (num.value !== '') to(+num.value); };
    num.onchange = () => { num.value = cl()[key]; settle(); };
  };
  pair($('#cA'), $('#cAn'), 'angle', ANGLE_MIN, ANGLE_MAX);
  pair($('#cS'), $('#cSn'), 'step', STEP_MIN, STEP_MAX);
  const rows = $('#cR');
  rows.oninput = () => { if (!busy) undoPush(); busy = true; const c = cl(); c.rows = +rows.value; const p = reRows(rectNow()); if (p) c.pat = p; else delete c.pat; showCloth(); kick(); };
  rows.onchange = () => settle();
}
// The chosen layer's numbers in sight: the strips, the hops, the gaps
function showCloth() {
  const c = cl(), P = planNow();
  for (const [id, key] of [['cA', 'angle'], ['cS', 'step']]) { const sl = $('#' + id), num = $('#' + id + 'n'); if (document.activeElement !== num) num.value = c[key]; sl.value = c[key]; }
  $('#cR').value = c.rows; $('#o-cR').textContent = rowsText(c);
  $('#weaveOf').textContent = layerName();
  const per = P.runs.length > 1 ? ` in two halves (${P.runs.map(r => r.strokes.filter(Boolean).length).join(' + ')})` : '';
  $('#clothRead').innerHTML = `<b>${P.lanes}</b> strips${per}, ${gapText()} · ${c.weave === 'lattice' ? 'no hop: the later strip on top' : `<b>${P.hops}</b> hops — the elbow lifts the brush ${P.hops} times on the move`} · ${fmt(P.length / 1000, 1)} m with the brush down on the canvas`;
}
const on = (sel, attr, v) => document.querySelectorAll(sel).forEach(b => b.classList.toggle('on', b.dataset[attr] === String(v)));
document.querySelectorAll('#layerKeys [data-layer]').forEach(b => b.onclick = () => { S.layer = +b.dataset.layer; EDIT = null; settle(); });
document.querySelectorAll('#weaveKeys [data-weave]').forEach(b => b.onclick = () => { undoPush(); cl().weave = b.dataset.weave; settle(); });
document.querySelectorAll('#fromKeys [data-from]').forEach(b => b.onclick = () => { undoPush(); cl().from2 = b.dataset.from; settle(); });
document.querySelectorAll('#halfKeys [data-halves]').forEach(b => b.onclick = () => { undoPush(); S.halves = b.dataset.halves; settle(); });
$('#loomInfo').onclick = () => { $('#loomRead').hidden = !$('#loomRead').hidden; $('#loomInfo').classList.toggle('on', !$('#loomRead').hidden); };
$('#loomRead').innerHTML = [
  'The canvas is one cloth: two families of strips square to each other, a rising one and a crossing one in turn, as BIAS SNAKE laid IMG_0924 — every strip 30 mm off the canvas at both its ends.',
  'The weave: on BIAS the later strip always lies on top. Here, where a strip should go under one laid before it, the elbow lifts the brush on the move just before that strip and lands it just past — a hop — so the earlier strip stays on top there. Plain: one over, one under, the intrecciato. Twill: two and two, ribs straight across at 45°. Basket: the strips in pairs. Lattice: no hop, IMG_0924.',
  'Two layers, two runs: layer 1 its own drawing and paints on the white canvas; layer 2 another way over it, its own paints — once layer 1 has set. Each layer\'s MARKS and DRAG run when you press them.',
  'A canvas past the reach in two halves: the near half and the overlap, home, the pause — turn the canvas round 180°, corner C, the far one, on the stop where corner A was — then the far half.',
].map(t => `<span>${t}</span>`).join('<br>');

// ---------- the paints (BIAS's): the strip, the tones, the list ----------
$('#paints').innerHTML = TAPE_PAINTS.map(([id, name, hex]) => `<div class="chip" data-paint="${id}"><button class="sw" style="background:${hex}" aria-label="${name}"></button><span class="cnt"></span></div>`).join('');
$('#paints').querySelectorAll('[data-paint]').forEach(ch => ch.querySelector('.sw').onclick = () => {
  if (EDIT) { editPaint(ch.dataset.paint); return; }
  S.paint = ch.dataset.paint; setTool('paint');
});
let EDIT = null;
const usedOf = c => [...new Set(Object.values(c?.pat?.segs || {}).flat().map(s => s[2]).filter(Boolean))];
const palOf = c => c?.pat?.palette ? structuredClone(c.pat.palette) : usedOf(c).length ? { name: 'Own', core: usedOf(c), accent: [] } : null;
function dealOn(c, pal, seed, anew = false) { const r = rectOf(c, S.boardW, S.boardH); c.pat = c.pat && !anew ? recolour(r, c.pat, pal, seed) : newPattern(r, pal, seed); }
function editPaint(id) {
  const e = EDIT, c = cl(); EDIT = null;
  if (!c.pat) { showPanel(); return; }
  undoPush();
  if (e.mode === 'change' && e.id !== id) {
    const swap = a => [...new Set(a.map(q => q === e.id ? id : q))], pal = c.pat.palette;
    for (const segs of Object.values(c.pat.segs)) for (const s of segs) if (s[2] === e.id) s[2] = id;
    if (pal) { const core = swap(pal.core); c.pat.palette = { ...pal, core, accent: swap(pal.accent).filter(q => !core.includes(q)) }; }
  } else if (e.mode === 'add') {
    const pal = palOf(c) || { name: 'Own', core: [], accent: [] };
    if (![...pal.core, ...pal.accent].includes(id)) { pal.core.push(id); dealOn(c, pal, c.pat.seed || 1); }
  }
  settle();
}
function dropPaint(id) {
  const c = cl(); if (!c.pat) return;
  undoPush();
  const pal = palOf(c); pal.core = pal.core.filter(q => q !== id); pal.accent = pal.accent.filter(q => q !== id);
  if (!pal.core.length && pal.accent.length) pal.core = pal.accent.splice(0);
  if (pal.core.length) dealOn(c, pal, c.pat.seed || 1);
  else { c.pat.palette = null; for (const segs of Object.values(c.pat.segs)) for (const s of segs) if (s[2] === id) s[2] = null; }
  settle();
}
$('#paintList').onclick = e => {
  const x = e.target.closest('[data-x]'), add = e.target.closest('[data-add]'), pl = e.target.closest('[data-pl]');
  if (x) { EDIT = null; dropPaint(x.dataset.x); return; }
  if (add) EDIT = EDIT?.mode === 'add' ? null : { mode: 'add' };
  else if (pl) { EDIT = EDIT?.mode === 'change' && EDIT.id === pl.dataset.pl ? null : { mode: 'change', id: pl.dataset.pl }; if (EDIT) S.view = 'drag'; }
  showPanel(); kick();
};
$('#paintInfo').onclick = () => { $('#paintRead').hidden = !$('#paintRead').hidden; $('#paintInfo').classList.toggle('on', !$('#paintRead').hidden); };
$('#btnPaintsClear').onclick = () => { const c = cl(); if (!c.pat) return; undoPush(); delete c.pat; settle(); };
$('#btnNewColours').onclick = () => { const c = cl(); undoPush(); const seed = seedNew(); dealOn(c, newPalette(seed, c.pat?.palette?.name), seed); S.view = 'result'; settle(); };
$('#btnNewSpokes').onclick = () => { const c = cl(); undoPush(); const seed = seedNew(); dealOn(c, palOf(c) || structuredClone(LOOM_TONES['Crimson Ruby']), seed, true); S.view = 'result'; settle(); };
// the tones: one colour in its shades, a press a new deal in it, the sausages in their places
const TONE_TITLE = { 'Crimson Ruby': 'IMG_0924\'s: magenta, rose azo, 05, red, pink, deep red; a purple thread', 'Fall': 'After your BOTTEGA FALL 001: orange, red, pink, orange yellow, 05; purple and ochre threads', 'Azure': 'After AZURE HORIZON: 04, 03, sky, ultramarine, white; a turquoise thread', 'Dusk': 'After CHROMATIC DUSK: purple, magenta, pink, sand, rose azo; an ochre thread' };
$('#toneKeys').innerHTML = Object.keys(LOOM_TONES).map(n => `<button class="tog" data-tone="${n}" title="${TONE_TITLE[n]}">${n}</button>`).join('');
document.querySelectorAll('#toneKeys [data-tone]').forEach(b => b.onclick = () => { const c = cl(); undoPush(); const seed = seedNew(); dealOn(c, structuredClone(LOOM_TONES[b.dataset.tone]), seed); S.view = 'result'; settle(); });
const REACH = new Map(), reachAt = d => { if (!REACH.has(d)) REACH.set(d, reachOf(d)); return REACH.get(d); };
const densityText = () => `${S.density} % · full ≈ ${fmt(reachAt(S.density).full, 0)} mm`;
$('#slPaint').innerHTML = `<label class="sl" title="The paint in a sausage: at 50 % the measured one — the line full 70 mm, then fading (TAPE-colors/IMAGE 2026-10-12 19:23:33); the Result's (est.)"><span class="slh"><span>Density</span><span class="val" id="o-dens"></span></span><input class="slider" type="range" id="dens" min="0" max="100" step="1"></label>`;
$('#dens').oninput = e => { if (!busy) undoPush(); busy = true; S.density = +e.target.value; $('#o-dens').textContent = densityText(); kick(); };
$('#dens').onchange = () => settle();
document.querySelectorAll('#views [data-view]').forEach(b => b.onclick = () => { S.view = b.dataset.view; $('#spokeTip').hidden = true; save(); showPanel(); kick(); });
document.querySelectorAll('#modeKeys [data-mode]').forEach(b => b.onclick = () => { S.mode = b.dataset.mode; settle(); });
$('#ink').onchange = e => { S.ink = e.target.checked; settle(); };
$('#inkOff').onclick = () => { S.ink = false; settle(); };
$('#inkOn').onclick = () => { S.ink = true; settle(); };
function showPaints() {
  const c = cl(), ss = sausagesOf(rectNow()), pal = c.pat?.palette, count = {};
  for (const q of ss) count[q.paint] = (count[q.paint] || 0) + 1;
  $('#paintsOf').textContent = layerName();
  $('#paints').querySelectorAll('[data-paint]').forEach(ch => {
    const q = PAINT[ch.dataset.paint], n = count[q.id] || 0;
    ch.querySelector('.cnt').textContent = n || '';
    ch.classList.toggle('pick', S.tool === 'paint' && q.id === S.paint);
    ch.title = `${q.name} — its colour off your swatch (est.)${n ? `, ${n} sausage${n === 1 ? '' : 's'} on ${layerName()}` : ''} — a click: the paint of the next sausage (M)`;
  });
  const inUse = [...new Set([...(pal ? [...pal.core, ...pal.accent] : []), ...usedOf(c)])], thin = id => pal?.accent.includes(id) && !pal.core.includes(id);
  $('#paintList').innerHTML = inUse.map(id => `<span class="pl${count[id] ? '' : ' none'}${EDIT?.id === id ? ' on' : ''}" data-pl="${id}" title="${PAINT[id].name}${thin(id) ? ', thin' : ''} — a click, then a paint in the strip: it takes its place"><i style="background:${PAINT[id].hex}"></i>${PAINT[id].name}${thin(id) ? ' <em>thin</em>' : ''}${count[id] ? ` <em>×${count[id]}</em>` : ''}<b class="x" data-x="${id}" title="Take ${PAINT[id].name} out">×</b></span>`).join('')
    + (inUse.length ? `<span class="pl add${EDIT?.mode === 'add' ? ' on' : ''}" data-add title="Add a paint: then click it in the strip on the left">+</span>` : '');
  $('#paints').classList.toggle('editing', !!EDIT);
  on('#toneKeys [data-tone]', 'tone', pal?.name);
  if (document.activeElement !== $('#dens')) $('#dens').value = S.density;
  $('#o-dens').textContent = densityText();
  $('#paintRead').innerHTML = [
    'The sausages, BIAS\'s: along the canvas\'s four edges, where every strip lands, and along the vertical rows inside — each cut into stripes of 1, 2, 3 or 6 half-steps, a paint each. Each layer has its own. A tone: one colour in its shades, so the strips never muddy — IMG_0924 was crimson only.',
    c.pat && `<b>${ss.length}</b> sausage${ss.length === 1 ? '' : 's'} on ${layerName()}, on ${rowsOf(rectNow()).length} edges and rows`,
    `Density ${S.density} %: a sausage keeps the line full about ${fmt(reachAt(S.density).full, 0)} mm${S.density === DENSITY_NEW ? ' — the measure' : ' (est.)'}`,
    pal && `Palette <b>${pal.name}</b>: ${pal.core.map(id => PAINT[id].name).join(', ')}${pal.accent.length ? `; thin: ${pal.accent.map(id => PAINT[id].name).join(', ')}` : ''} · seed ${c.pat.seed}`,
    !c.pat && 'No sausages on this layer yet: a tone, New colours, New spokes, or M.',
  ].filter(Boolean).join('<br>');
}

// ---------- the brush, DRAG ----------
const BRUSH_SL = [['brush', 'Brush width', 'mm', 0.5, 1, 20], ['drag', 'Drag speed', 'mm/s', 5, 10, SPEED_MAX], ['hop', 'Hop: clear of the strip', 'mm', 0.25, 0, 5], ['tail', 'Lands and lifts over', 'mm', 0.25, TAIL_MIN, TAIL_MAX],
  ['clear', 'Snake: turns off the canvas', 'mm', 0.5, 0, 20], ['runout', 'Off the canvas', 'mm', 1, 0, 60], ['margin', 'Margin round the canvas', 'mm', 1, 0, 80], ['overlap', 'Halves: past the middle', 'mm', 1, 0, 100]];
const SL_TITLE = {
  brush: 'The brush across a strip (the owner\'s round brush, 6 mm)',
  drag: 'The dry brush along a strip. A hop wants it slow: at 30 mm/s the elbow lifts the brush within about 1.5 mm (est.); Lattice has no hop and runs at BIAS\'s 90',
  hop: 'A hop: the brush up this far before the strip it goes under and down this far past it (est.: try it on a scrap first)',
  tail: 'The pressure eased off over this much before every lift — a hop\'s and a strip\'s end — and on over this much after every landing (strokes.js\'s tail; est.)',
  clear: 'The snake: from a strip\'s end to the next one\'s start the brush stays down off the canvas, its edge this far clear of it (est.)',
  runout: 'Every strip starts and ends this far along it off the canvas, so the brush crosses the edge at an even pressure (the owner\'s +30 mm) — no farther than the margin',
  margin: 'The room round the canvas on every side where the brush may run off and turn (the owner\'s 25 mm)',
  overlap: 'Two halves: each half\'s strips run on this far past the middle, over the other\'s, so the turn leaves no seam (Claude\'s: the owner\'s +30 again)',
};
const valOf = key => key === 'drag' ? `${S.drag} mm/s` : `${fmt(S[key], key === 'tail' ? 2 : 1)} mm`;
$('#slBrush').innerHTML = BRUSH_SL.map(([key, label, , step, min, max]) => `<label class="sl" title="${SL_TITLE[key]}"><span class="slh"><span>${label}</span><span class="val" data-v="${key}"></span></span><input class="slider" type="range" data-k="${key}" min="${min}" max="${max}" step="${step}"></label>`).join('');
$('#slBrush').querySelectorAll('input').forEach(inp => {
  inp.oninput = () => { if (!busy) undoPush(); busy = true; S[inp.dataset.k] = +inp.value; showPanel(); showCloth(); kick(); };
  inp.onchange = () => settle();
});
$('#fields').innerHTML = FIELDS.map(([key, label, unit, step, title, any]) => `<label title="${title}">${label} <input data-k="${key}" type="number" step="${step}"${any ? '' : ` min="${step}"`}><em>${unit}</em></label>`).join('');
$('#fields').querySelectorAll('input').forEach(inp => inp.onchange = () => {
  const v = +inp.value, any = FIELDS.find(f => f[0] === inp.dataset.k)[5];
  if (inp.value !== '' && fin(v) && (any || v > 0)) { S[inp.dataset.k] = v; setCanvas(S); }
  settle();
});
$('#planInfo').onclick = () => { $('#planRead').hidden = !$('#planRead').hidden; $('#planInfo').classList.toggle('on', !$('#planRead').hidden); };
function showPanel() {
  for (const [key] of BRUSH_SL) {
    const inp = $(`#slBrush input[data-k="${key}"]`); if (document.activeElement !== inp) inp.value = S[key];
    $(`#slBrush [data-v="${key}"]`).textContent = valOf(key);
  }
  $(`#slBrush label:has([data-k="overlap"])`).hidden = S.halves === 'one';
  document.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === S.tool));
  $('#fields').querySelectorAll('input').forEach(inp => { if (document.activeElement !== inp) inp.value = S[inp.dataset.k]; });
  $('#hint').textContent = EDIT ? (EDIT.mode === 'add' ? 'Add a paint to the palette: click it in the strip on the left (+ again: leave it).' : `${PAINT[EDIT.id].name}: its sausages outlined on Drag. To change it, click the paint to put in its place in the strip on the left; ${PAINT[EDIT.id].name} in the list again: leave it.`) : HINT[S.tool];
  on('#views [data-view]', 'view', S.view); on('#modeKeys [data-mode]', 'mode', S.mode);
  on('#layerKeys [data-layer]', 'layer', S.layer); on('#weaveKeys [data-weave]', 'weave', cl().weave); on('#fromKeys [data-from]', 'from', cl().from2); on('#halfKeys [data-halves]', 'halves', S.halves);
  $('#ink').checked = S.ink; $('#inkOff').classList.toggle('on', !S.ink); $('#inkOn').classList.toggle('on', S.ink);
  showPaints();
}
// The canvas and the reach: does it fit with its margin — across (Y) and up (X) — and where it lies past a wall
function fitNow() {
  const R = reach(), across = R.y.max - R.y.min, up = R.x.max - R.x.min, m = S.margin;
  const needW = S.boardW + 2 * m, needH = S.boardH + 2 * m, half = (n, ov) => n / 2 + ov + 2 * m;
  return { across, up, needW, needH, wide: needW > across + 1e-6, tall: needH > up + 1e-6, halfW: half(S.boardW, S.overlap), halfH: half(S.boardH, S.overlap) };
}
function showHalves() {
  const F = fitNow(), suggest = F.wide && !F.tall ? 'lr' : F.tall && !F.wide ? 'bt' : F.wide && F.tall ? 'both' : 'one';
  const lines = [`The canvas and its margin: <b>${fmt(F.needW, 0)} × ${fmt(F.needH, 0)} mm</b>; the machine reaches ${fmt(F.across, 1)} across and ${fmt(F.up, 1)} up.`];
  if (suggest === 'one') lines.push(S.halves === 'one' ? 'It fits: one run.' : 'It fits in one run; the halves still work — the fold of the turn in the middle, if you want it.');
  else if (suggest === 'both') lines.push('<span class="warn">Too wide and too tall: two halves will not reach it all — lay it the other way round, or a smaller canvas.</span>');
  else if (S.halves === 'one') lines.push(`<span class="warn">Too ${suggest === 'lr' ? 'wide' : 'tall'} for one run: ${suggest === 'lr' ? 'Halves ↔' : 'Halves ↕'}.</span>`);
  if (S.halves !== 'one') {
    const lr = S.halves === 'lr', need = lr ? F.halfW : F.halfH, reachIt = lr ? F.across : F.up;
    lines.push(`Half 1: the ${lr ? 'left' : 'bottom'} half and ${fmt(S.overlap, 0)} mm past the middle, ${fmt(need, 0)} mm with the margins ${need <= reachIt + 1e-6 ? `— within the ${fmt(reachIt, 1)}` : `<span class="warn">— past the ${fmt(reachIt, 1)} the machine reaches: less overlap or margin</span>`}. Then the carriage goes home and the run waits: turn the canvas round 180°: corner C, the far one, on the stop where corner A — the one by home — was; then Continue for half 2.`);
    lines.push(`The far half lies past the ${lr ? 'right' : 'top'} wall while half 1 runs: the canvas must be free to lie there.`);
  }
  $('#halfRead').innerHTML = lines.join(' ');
}
const what = () => `${layerName()}${S.halves !== 'one' ? ', two halves' : ''}`;
function settle() {
  busy = false;
  const P = planNow(), Ds = dragRun('snake'), Da = dragRun('air'), Mk = marksRun(), here = hereNow(), c = cl(), lines = [];
  lines.push(`${layerName()}: <b>${P.lanes}</b> strips, ${WEAVE_NAME[c.weave]}, ${fmt(c.angle, 1)}°, step ${fmt(c.step, 1)} mm, ${gapText()}${P.hops ? `, <b>${P.hops}</b> hops` : ''} · DRAG <b>Snake</b>: the brush landing ${Ds.runs} time${Ds.runs === 1 ? '' : 's'}, ${fmt(Ds.mm / 1000, 1)} m, ≈ ${fmt(Ds.seconds / 60, 0)} min at ${S.drag} mm/s (est.) · <b>Air</b>: landing ${Da.runs} times, ${fmt(Da.mm / 1000, 1)} m, ≈ ${fmt(Da.seconds / 60, 0)} min (est.)`);
  if (Mk.marks) lines.push(`MARKS: <b>${Mk.marks}</b> dash${Mk.marks === 1 ? '' : 'es'}, a sausage each, ${S.ink ? `in watercolour, ${Mk.dips} dip${Mk.dips === 1 ? '' : 's'} (one every ${MARKS_DIP})` : 'Ink OFF: no dip'}, ≈ ${fmt(Mk.seconds / 60, 1)} min (est.)`);
  if (P.runs.length > 1) lines.push(`Two halves: DRAG and MARKS each run half 1, go home and wait for the turn, then run half 2`);
  lines.push(`The canvas from home: its bottom left corner at carriage <b>X ${fmt(here.x - S.boardH / 2, 1)} · Y ${fmt(here.y - S.boardW / 2, 1)} mm</b>; TEST's dots ${testMargin()} mm in from the corners of what a run paints${S.margin > 0 ? `; a margin of ${fmt(S.margin, 0)} mm round it` : ''}.`);
  $('#planRead').innerHTML = lines.join(' · ');
  const keys = [[Ds, 'DRAG Snake'], [Da, 'DRAG Air']];
  const warn = [...keys.map(([D, name]) => D.fault && `The plan is wrong, ${name} will not run it: ${D.fault}.`), Mk.fault && `The plan is wrong, MARKS will not run it: ${Mk.fault}.`,
    ...keys.map(([D, name]) => pressedText(D, name)), walls(Mk, 'MARKS'), elbowText(Ds)].filter(Boolean);
  $('#planWarn').innerHTML = warn.map(w => `<span class="warn">${w}</span>`).join(' ');
  $('#planWarn').hidden = !warn.length;
  $('#stats').textContent = `${what()} · ${P.lanes} strips · ${P.hops} hops${Mk.marks ? ` · ${Mk.marks} sausages · MARKS ≈ ${fmt(Mk.seconds / 60, 1)} min` : ''} · Snake ≈ ${fmt(Ds.seconds / 60, 0)} min · Air ≈ ${fmt(Da.seconds / 60, 0)} (est.)`;
  showFiles(); showHalves(); showCloth();
  showPanel(); save(); layout(); lastLcd && lcd(lastLcd);
}
// The elbow at the hops: plotRun's need, the fastest it would have to turn
// over a tail; past what it makes, the brush lifts late and lands late
function elbowText(D) {
  if (!(D.need > WRIST_MAX + 1e-6)) return '';
  const v = Math.floor(S.drag * WRIST_MAX / D.need / 5) * 5;
  return `The elbow would have to turn ${fmt(D.need, 0)}°/s over a tail of ${fmt(S.tail, 2)} mm at ${S.drag} mm/s; it makes about ${WRIST_MAX}: the brush would lift late and land late at every hop — slow DRAG to ${v} mm/s, or lengthen Lands and lifts over.`;
}
function walls(P_, name = '') {
  const h = hereNow();
  if (!P_?.carriage || !P_.rows.length) return '';
  const R = reach(), b = P_.carriage, x0 = h.x + b.x0, x1 = h.x + b.x1, y0 = h.y + b.y0, y1 = h.y + b.y1;
  const out = [x0 < R.x.min && `${fmt(R.x.min - x0, 0)} mm past the bottom wall`, x1 > R.x.max && `${fmt(x1 - R.x.max, 0)} mm past the top wall`,
    y0 < R.y.min && `${fmt(R.y.min - y0, 0)} mm past the left wall`, y1 > R.y.max && `${fmt(y1 - R.y.max, 0)} mm past the right wall`].filter(Boolean);
  return out.length ? `${name ? `${name}: ` : ''}the brush would go ${out.join(', ')}: move the canvas (Bottom edge ↑, Left edge →)${S.halves === 'one' ? ', or run it in two halves' : ''}.` : '';
}
function pressedText(P_, name) {
  const o = P_?.over; if (!o || !P_.rows.length) return '';
  const margin = o.margin > 0.5 && S.margin > 0 ? `${name}: the brush goes ${fmt(o.margin, 0)} mm past the margin round the canvas — widen the margin or shorten Off the canvas, Snake: turns off the canvas.` : '';
  const need = [o.bottom > 0.5 && `Bottom edge ↑ ${Math.ceil(S.edgeBottom + o.bottom + 0.5)} mm`, o.left > 0.5 && `Left edge → ${Math.ceil(S.edgeLeft + o.left + 0.5)} mm`].filter(Boolean);
  const past = [o.bottom > 0.5 && `${fmt(o.bottom, 0)} mm past the bottom wall`, o.left > 0.5 && `${fmt(o.left, 0)} mm past the left wall`, o.top > 0.5 && `${fmt(o.top, 0)} mm past the top wall`, o.right > 0.5 && `${fmt(o.right, 0)} mm past the right wall`].filter(Boolean);
  return [margin, past.length ? `${name}: its way goes ${past.join(', ')} — there the brush would run along the wall, along the canvas's edge.${need.length ? ` Lay the canvas off the walls: ${need.join(', ')} at least.` : S.halves === 'one' ? ' Move the canvas, or run it in two halves.' : ' Move the canvas, or less overlap.'}` : ''].filter(Boolean).join(' ');
}
// The file: the chosen layer's strips as an SVG in canvas mm, a <path> a stretch with the brush down. Saved to Downloads.
function showFiles() {
  const name = `loom_layer${S.layer + 1}_drag.svg`, box = $('#files');
  box.innerHTML = `<button class="tog" data-file="drag" title="${name}">Drag</button>`;
  box.querySelector('[data-file]').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([dragSvg(planNow(), po())], { type: 'image/svg+xml' })); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000); $('#fileRead').textContent = `saved ${name}`;
  };
}

// ---------- the reference (BIAS's) ----------
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
  $('#refRead').innerHTML = REF ? `${esc(REF.name)} · <b>${S.refOpacity} %</b>` : 'Over the canvas, the whole of it inside.';
}
$('#btnRef').onclick = () => $('#refIn').click();
$('#refIn').onchange = e => { const f = e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => setRef(rd.result, f.name, true); rd.readAsDataURL(f); e.target.value = ''; };
$('#refOp').oninput = e => { S.refOpacity = +e.target.value; syncRef(); save(); kick(); };
function loadRef() { try { const o = JSON.parse(localStorage.getItem(REF_KEY) || 'null'); if (o && o.src) setRef(o.src, o.name || 'reference', false); } catch { } }

// ---------- 💾 SAVE LOOM ----------
// As BIAS's: an SVG of the canvas in mm — both layers' strips and sausages —
// the whole state in its metadata, a PNG preview (the view as it is: the
// Result, Instagram's square); on the tests' shelf, its label LOOM.
const label = () => `${TAB_NAME} · ${S.layers.map((c, i) => `${i + 1}: ${WEAVE_NAME[c.weave]} ${fmt(c.angle, 1)}° ${fmt(c.step, 1)} mm${c.pat?.palette ? ` ${c.pat.palette.name}` : ''}`).join(' · ')} · ${S.boardW} × ${S.boardH} mm · brush ${fmt(S.brush, 1)} mm`;
function svgOf() {
  const W = S.boardW, H = S.boardH, f = v => (Math.round(v * 100) / 100).toFixed(2), o = po();
  const meta = JSON.stringify({ rembrandt: '1.1.0', [TAB]: true, label: label(), settings: S }).replace(/&/g, '\\u0026').replace(/</g, '\\u003c').replace(/--/g, '- -');
  const layer = li => {
    const P = planNow(li), lanes = [];
    for (const run of P.runs) for (const st of run.strokes) if (st) for (const [a, b, hop] of piecesOf(st)) if (!hop) {
      const p = toCanvas(run, along(st.P0, st.u, a), o), q = toCanvas(run, along(st.P0, st.u, b), o);
      lanes.push(`  <line x1="${f(p[0])}" y1="${f(H - p[1])}" x2="${f(q[0])}" y2="${f(H - q[1])}" data-fam="${st.lane.fam}" data-half="${run.n}"/>`);
    }
    const ss = sausagesOf(P.rect).map(q => { const [x, y, w, h] = q.box; return `  <rect x="${f(x)}" y="${f(H - y - h)}" width="${f(w)}" height="${f(h)}" fill="${PAINT[q.paint].hex}" data-paint="${q.paint}"${q.thin ? ' data-thin="1"' : ''}/>`; });
    return `<g id="layer${li + 1}" data-weave="${P.cloth.weave}" data-angle="${P.cloth.angle}" data-step="${P.cloth.step}">\n<g class="strips" stroke="#24221F" stroke-opacity="0.12" stroke-width="${f(S.brush)}">\n${lanes.join('\n')}\n</g>\n<g class="sausages" stroke="#24221F" stroke-width="0.2">\n${ss.join('\n')}\n</g>\n</g>`;
  };
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}">
<!-- Rembrandt v.1.1.0 · ${esc(label())}; 1 unit = 1 mm, y down; the strips with the brush down, the gaps the hops -->
<metadata id="rembrandt-test">${meta}</metadata>
<rect width="${W}" height="${H}" fill="${GROUND}" stroke="#24221F" stroke-width="0.5"/>
${[0, 1].map(layer).join('\n')}
</svg>`;
}
function pngOf() {
  const keep = [g, k, dpr, V]; V = view();
  const sw = V.y1 - V.y0, sh = V.x1 - V.x0, kk = 800 / Math.max(sw, sh), c2 = document.createElement('canvas');
  c2.width = Math.round(sw * kk); c2.height = Math.round(sh * kk);
  g = c2.getContext('2d'); k = kk; dpr = 1;
  try { draw(); } finally { [g, k, dpr, V] = keep; }
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
    if (!o?.[TAB]) { $('#saveState').textContent = `not a ${TAB_NAME} save: open it on its own tab`; return; }
    undoPush();
    localStorage.setItem(KEY, JSON.stringify(o.settings)); setCanvas(o.settings); load(); Object.assign(S, canvasNow(S)); settle();
    $('#saveState').textContent = `opened · ${file.slice(0, 13)}:${file.slice(14)}`;
  } catch { $('#saveState').textContent = 'could not open it from the Library'; }
}

// ---------- the deck: TEST, MARKS, DRAG, PAUSE (BIAS's) ----------
const post = async path => { try { const r = await fetch(path, { method: 'POST' }); return await r.text(); } catch { return 'start rembrandt.py'; } };
let RUN_KEY = null;
async function start(key, blocks, info, log) {
  try {
    RUN = blocks; RUN_INFO = info; RUN_KEY = key;
    const r = await fetch('/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blocks, log }) });
    $('#runState').textContent = await r.text();
  } catch { $('#runState').textContent = 'start rembrandt.py'; }
}
const halvesText = n => n > 1 ? `\n\nTwo halves: the canvas as you laid it first, corner A — the one by home — on the stop. Half 1 runs, the carriage goes home and the run waits — then turn the canvas round 180°, corner C, the far one, on the stop where A was, and Continue for half 2.` : '';
async function runDrag(mode) {
  settle();
  const D = dragRun(mode), P = planNow(), c = cl(), sausages = !!c.pat;
  if (!D.rows.length) { $('#runState').innerHTML = '<span class="warn">Nothing to run: no strips on the canvas.</span>'; return; }
  if (walls(D)) { $('#runState').innerHTML = `<span class="warn">${walls(D, `DRAG ${MODE_NAME[mode]}`)}</span>`; return; }
  if (D.fault) { $('#runState').innerHTML = `<span class="warn">Not run: the plan is wrong — ${D.fault}.</span>`; return; }
  const text = `${P.lanes} strips, ${WEAVE_NAME[c.weave]} at ${fmt(c.angle, 1)}°, a rising one and a crossing one in turn — the rising from the bottom right corner, each down ↙; the crossing from ${c.from2 === 'bl' ? 'the bottom left, each ↖' : 'the top right, each ↘'} — every one ${fmt(S.runout, 0)} mm off the canvas at both its ends; `
    + (P.hops ? `over ${P.hops} strips the elbow lifts the brush on the move and lands it past (est.: ${fmt(S.hop, 2)} mm clear) — the weave; ` : 'no hop, the later strip on top; ')
    + (mode === 'snake' ? `the brush down off the canvas between two where it can go round, else up and over — it lands ${D.runs} time${D.runs === 1 ? '' : 's'}` : `every strip one way, landing and lifting off the canvas — ${D.runs} landings`)
    + `; ${fmt(D.mm / 1000, 1)} m with the dry brush, no dip, at ${S.drag} mm/s, ≈ ${fmt(D.seconds / 60, 0)} min (est.).${pressedText(D, '\n\n⚠ DRAG ' + MODE_NAME[mode])}${elbowText(D) ? `\n\n⚠ ${elbowText(D)}` : ''}${halvesText(D.halves)}\n\n${sausages ? `Are ${layerName()}'s sausages squeezed on their marks, as Drag shows them?` : 'Is the paint squeezed along the canvas\'s edges and rows?'}`;
  if (!confirm(`DRAG ${MODE_NAME[mode].toUpperCase()} ${TAB_NAME}, ${what()}: ${text}`)) return;
  S.mode = mode; settle();
  await start(mode, D.blocks, { seconds: D.seconds, rows: D.rows },
    { page: TAB, pass: 'drag', mode, layer: S.layer + 1, label: label(), settings: S, here: hereNow(), estimate_s: Math.round(D.seconds) });
}
$('#btnSnake').onclick = () => runDrag('snake');
$('#btnAir').onclick = () => runDrag('air');
$('#btnMarks').onclick = async () => {
  await loadInk(); settle();
  const M = marksRun();
  if (!M.marks) { $('#runState').innerHTML = `<span class="warn">Nothing to mark: no sausages on ${layerName()} — a tone, New colours, New spokes, or M.</span>`; return; }
  if (S.ink && cupProblem(cup())) { $('#runState').innerHTML = `<span class="warn">MARKS dips in the cup with INK ON: ${cupProblem(cup())}</span>`; return; }
  if (M.fault) { $('#runState').innerHTML = `<span class="warn">Not run: the plan is wrong — ${M.fault}.</span>`; return; }
  if (walls(M)) { $('#runState').innerHTML = `<span class="warn">${walls(M, 'MARKS')}</span>`; return; }
  if (!confirm(`MARKS ${TAB_NAME}, ${what()}: ${M.marks} dashes, a sausage each — ${S.ink ? `in watercolour from the cup, a dip every ${MARKS_DIP}, ${M.dips} dip${M.dips === 1 ? '' : 's'}` : 'Ink OFF: no dip, the dry brush'} — at ${MARK_SPEED} mm/s, ≈ ${fmt(M.seconds / 60, 1)} min (est.).${halvesText(M.halves)}\n\nThen squeeze the sausages on the dashes, as Drag shows them. Is the brush in the holder?`)) return;
  S.view = 'drag'; settle();
  await start('marks', M.blocks, { seconds: M.seconds, rows: M.rows },
    { page: TAB, pass: 'marks', layer: S.layer + 1, label: label(), settings: S, here: hereNow(), ...(S.ink ? { cup: cup() } : {}), estimate_s: Math.round(M.seconds) });
};
// TEST: a dot Preferences' margin in from each corner of what a run paints — the canvas, or its near half and the overlap
function testDots() {
  const W = windowOf(S.halves, S.boardW, S.boardH, S.overlap), T = cornerDots(W.x1 - W.x0, W.y1 - W.y0);
  if (!T.dots.length) return null;
  const off = { x: (W.y0 + W.y1) / 2 - S.boardH / 2, y: (W.x0 + W.x1) / 2 - S.boardW / 2 }, sh = q => ({ x: q.x + off.x, y: q.y + off.y });
  return { dots: T.dots.map(d => ({ ...d, at: sh(d.at), to: sh(d.to) })), passes: T.passes.map(p => ({ ...p, ps: p.ps.map(path => path.map(q => ({ ...q, a: sh(q.a), b: sh(q.b) }))) })) };
}
function testRun() {
  const T = testDots();
  return T ? { ...plotRun({ ...runOpts(T.dots.length), lift: false, ink: S.ink }, T.passes), dots: T.dots } : null;
}
$('#btnTest').onclick = async () => {
  await loadInk(); settle();
  const here = hereNow(), T = testRun();
  if (!T) { $('#runState').innerHTML = `<span class="warn">No corners: the canvas is ${2 * testMargin()} mm or less across.</span>`; return; }
  if (S.ink && cupProblem(cup())) { $('#runState').innerHTML = `<span class="warn">TEST dips in the cup with INK ON: ${cupProblem(cup())}</span>`; return; }
  if (T.fault) { $('#runState').innerHTML = `<span class="warn">Not run: the test is wrong — ${T.fault}.</span>`; return; }
  const R = reach(), past = d => { const x = here.x + d.at.x, y = here.y + d.at.y; return [x < R.x.min && `${fmt(R.x.min - x, 0)} mm past the bottom wall`, x > R.x.max && `${fmt(x - R.x.max, 0)} mm past the top wall`, y < R.y.min && `${fmt(R.y.min - y, 0)} mm past the left wall`, y > R.y.max && `${fmt(y - R.y.max, 0)} mm past the right wall`].filter(Boolean).join(', '); };
  const out = T.dots.filter(d => past(d));
  if (!confirm(`TEST: ${S.ink ? 'one dip in the cup, then ' : ''}${testSay()} of ${S.halves === 'one' ? `the ${S.boardW} × ${S.boardH} canvas` : 'half 1 and its overlap'} — ${T.dots.map(d => `${d.name} X ${fmt(here.x + d.at.x, 0)} · Y ${fmt(here.y + d.at.y, 0)}`).join(', ')} — and home.`
    + (out.length ? `\n\n${out.map(d => `${d.name}: ${past(d)}`).join('; ')} — its dot goes on the wall.` : ''))) return;
  await start('test', T.blocks, { seconds: T.seconds, rows: T.dots.map(d => ({ label: `TEST · ${d.name}` })) },
    { page: TAB, label: `${TAB_NAME} · TEST · the corners`, here, dots: T.dots.map(d => ({ name: d.name, x: +(here.x + d.at.x).toFixed(1), y: +(here.y + d.at.y).toFixed(1) })), ...(S.ink ? { cup: cup() } : {}), estimate_s: Math.round(T.seconds) });
};
$('#btnHome').onclick = () => start('home', homeBlocks(S.travel), { seconds: 0, rows: [{ label: 'HOME' }] }, { page: TAB, label: `${TAB_NAME} · HOME`, here: hereNow() });
let paused = false;
$('#btnPause').onclick = () => post(paused ? '/run/continue' : '/run/pause');
$('#btnStop').onclick = () => post('/run/stop');

// The LCD, as on BIAS: DRAG's numbers while nothing runs.
const mmss = t => { t = Math.max(0, Math.round(t || 0)); return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
let started = null, lastLcd = null;
const KEY_NAME = { test: 'TEST', home: 'HOME', marks: 'MARKS', snake: 'DRAG SNAKE', air: 'DRAG AIR' };
function lcd(st) {
  lastLcd = st;
  const P_ = dragRun(), live = st && ['running', 'stopping', 'pausing', 'paused'].includes(st.state);
  const pct = st && st.state !== 'idle' ? (st.state === 'done' ? 100 : st.percent || 0) : 0;
  if (live && !started) started = st.started || Date.now() / 1000;
  if (!live) started = null;
  const R_ = live && RUN_INFO ? RUN_INFO : P_;
  const total = R_.seconds, left = live && started && pct >= 3 ? (Date.now() / 1000 - started) * (100 - pct) / pct : total * (1 - pct / 100);
  const state = !st ? 'no server' : live ? (st.state === 'paused' ? 'paused' : 'live') : st.state === 'idle' ? 'plan' : st.state;
  const b = st && (RUN || P_.blocks)[st.block], row = b && R_.rows[b.row - 1], now0 = row?.label;
  const waiting = st?.state === 'paused' && st.message;
  paused = ['paused', 'pausing'].includes(st?.state);
  const keyEl = $('#btnPause');
  keyEl.querySelector('span').textContent = paused ? 'Cont.' : 'Pause'; keyEl.classList.toggle('call', paused); keyEl.disabled = !live;
  $('#btnHome').disabled = !!live;
  document.querySelectorAll('.deck [data-pass], #btnTest').forEach(el => el.classList.toggle('on', !!live && (el.dataset.pass || 'test') === RUN_KEY));
  const now = waiting ? `❚❚ ${st.message}`
    : live && b?.home ? (RUN_KEY === 'home' ? 'HOME · the brush up, the carriage to home' : 'the carriage goes home, the brush off')
    : live && now0 && b?.dip ? `${now0} · the dip in the cup`
    : live && now0 ? now0 + (st.brush_on ? ' · brush on' : ' · brush off')
    : `${planNow().lanes} strips · ${WEAVE_NAME[cl().weave]} · ${what()} · ${MODE_NAME[S.mode]}`;
  $('#lcd').innerHTML = `
    <div class="lcd-top"><span>${state === 'live' ? '▶ ' : state === 'paused' ? '❚❚ ' : ''}${state}${live && RUN_KEY ? ` · ${KEY_NAME[RUN_KEY]}` : ''}</span><span>${live && st.blocks ? `step ${st.block + 1}/${st.blocks}` : `${fmt(P_.length / 1000, 2)} m`}</span></div>
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
  if (live && st.started !== trailOf) trailOf = st.started;
  const moved = !lastSt || !st || lastSt.block !== st.block || lastSt.state !== st.state || lastSt.x_mm !== st.x_mm || lastSt.y_mm !== st.y_mm;
  lastSt = st;
  if (st && trailOf && st.started === trailOf && moved) kick();
  $('#runState').innerHTML = !st ? 'no server: start rembrandt.py' : st.message ? `<span class="${st.state === 'error' ? 'warn' : ''}">${st.message}</span>` : '';
}

// ---------- start ----------
load(); Object.assign(S, canvasNow(S));
if (FRESH) S.layers.forEach((c, i) => dealOn(c, structuredClone(LOOM_TONES['Crimson Ruby']), 924 + i));   // a first visit: IMG_0924's tone on both layers
onCanvas(c => { Object.assign(S, c); settle(); });
syncRef(); loadRef();
lampSwitch($('#lamp'));
showZoom();
addEventListener('rembrandt-night', () => kick());
setInterval(watch, 500);
new ResizeObserver(layout).observe(stage);
settle(); watch();
loadInk();
const opening = new URLSearchParams(location.search).get('open');
if (opening) openFromLibrary(opening);
