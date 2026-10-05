// Rembrandt · NOLAN — one ribbon in 3D, imprinted on the canvas (NOLAN.md
// §3.0; the owner, 2026-10-04: "yes, that is it — carry it into NOLAN"; "the
// words from TEST, so there is no mess: ROWS first, ROW TO ROW and so on;
// and TAIL"). The model is band.js; this page draws it on Test's board —
// the canvas from home — turns it with the mouse, edits its points with
// Create's Tools, and runs its imprint with Test's run (strokes.js, plotRun),
// layer by layer. 3D lives only in the drawing: the machine gets lines and
// arcs.
//
// Canvas mm from its centre: x right, y down, z towards the viewer. The
// board, as on Test: mm from Here — the canvas's centre — X up, Y right.

import { fmt } from './util.js';
import { reach, homeCorner } from './machine.js';
import { plotRun, DEFAULTS, TABLE_MM, WRIST_MAX, SPEED_MAX, ELBOW_LIFT, ELBOW_HOVER, TAIL_MIN, TAIL_MAX, tailIn } from './strokes.js';
import { SKETCH, ringBlank, bandOf, layeredOf, bandPasses, washOf, cornerDots, TEST_MARGIN, strokeAnchors, BRUSH_FIT, BRUSH_CLOSE, circleAnchors, rotation, transpose, apply, projector, lengthOf, DIP_RUN, NO_DIP, ROWS_MAX } from './band.js';
import { segments, sticks } from './lcd.js';
import { lampSwitch, themeColor } from './lamp.js';
import { cupOf, cupProblem, drawCup, dipAt } from './ink.js';
import './ui.js';

const $ = s => document.querySelector(s);
const KEY = 'rembrandt.nolan.v03', REF_KEY = 'rembrandt.nolan.ref';
const PALETTE = ['#F7F1E8', '#F9C38A', '#F28A2E', '#EF5E4E', '#D24FC4', '#7B4FE0', '#3D63D8', '#46A6EA', '#A6E3F8', '#EDE7F5'];   // IMG_9424's stripes, est. by eye
const LAYER = ['#A9A397', '#EB7A25', '#3D63D8', '#3FA7A0', '#B04FC4'];   // N1 … N5 on Layers
const DRAG_STEP = 4, STEP = 1.5;
// More than this past the walls is no longer a hair (Test's 2 mm of 2026-10-03):
// the canvas lies partly out of reach, said in red and before PLAY.
const PAST_MANY = 50;   // mm between the centre's points: coarse while the mouse turns it

// ---------- state ----------
// The figures (the owner, 2026-10-05, nolan-v2/Screenshot 2026-10-05 at
// 3.53.05 PM.png: "when I make a second figure with the brush, the first
// disappears; it must stay"): each its own ribbon — its points, its band, its
// place in space, its cuts — as objects in Illustrator. The panel edits the
// picked one, S.cur: S's keys of FIG read and write it. With none, S.tpl
// keeps the panel's numbers for the next.
const FIG_NUM = ['rows', 'pitch', 'width', 'stack', 'twist', 'squeeze', 'tilt', 'swing', 'spin', 'zoom', 'dx', 'dy', 'lens'];
const FIG = ['anchors', 'closed', 'cuts', ...FIG_NUM];
const newFig = (o = {}) => ({
  anchors: [], closed: false,                                                     // its points; closed: a loop (a circle)
  cuts: null,                                                                     // the layers' cuts, mm along the ribbon; null: as band.js suggests
  rows: 16, pitch: 8, width: 5, stack: 6, twist: 0, squeeze: 0,                   // the band; Roll is a point's (band.js, squeezed)
  tilt: 0, swing: 0, spin: 0, zoom: 1, dx: 0, dy: 0, lens: 0,                     // the ribbon in space
  ...o,
});
const S = {
  figs: [newFig({ anchors: SKETCH.map(a => ({ ...a })) })], cur: 0, tpl: newFig(),
  speed: 150, travel: 180, tail: 15, overlap: 4, ink: false,                      // the brush, as on Test (est.); overlap: under another part, mm (est.)
  through: false,                                                                 // Pass through: the rows run whole over and under the other parts
  boardW: 500, boardH: 700, edgeLeft: 50, edgeBottom: 0,                         // the canvas, and its edges from home (the owner's, 2026-10-05)
  look: 'colour', ground: 'black', refOpacity: 30, tool: 'select',
};
const figNow = () => S.figs[S.cur] || S.tpl;
for (const k2 of FIG) Object.defineProperty(S, k2, { get: () => figNow()[k2], set: v => { figNow()[k2] = v; }, enumerable: false });
// A figure to draw into: the picked one, or a new one with the panel's numbers.
function ensureFig() { if (!S.figs[S.cur]) { S.figs.push({ ...S.tpl, anchors: [], cuts: null, closed: false }); S.cur = S.figs.length - 1; } }
let pick = 8;   // the picked point of the picked figure; −1: the whole figure
const NUM = ['speed', 'travel', 'tail', 'overlap', 'boardW', 'boardH', 'edgeLeft', 'edgeBottom', 'refOpacity'];
// A figure as saved, checked. o.roll: the whole band's Roll of before
// 2026-10-04 (two Rolls on the panel, the owner: "unprofessional") — its angle
// goes into every point, so the ribbon keeps its shape.
function figOf(o) {
  const f = newFig();
  for (const k2 of FIG_NUM) if (Number.isFinite(o?.[k2])) f[k2] = o[k2];
  f.anchors = (Array.isArray(o?.anchors) ? o.anchors : []).filter(a => ['x', 'y', 'z', 'roll'].every(k2 => Number.isFinite(a?.[k2]))).map(a => ({ x: a.x, y: a.y, z: a.z, roll: a.roll }));
  f.closed = o?.closed === true && f.anchors.length >= 3;
  f.cuts = Array.isArray(o?.cuts) ? o.cuts.filter(Number.isFinite) : null;
  if (Number.isFinite(o?.roll) && o.roll) f.anchors.forEach(a => { a.roll += o.roll; });
  return f;
}
function load() {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (!o) return;
    for (const k of NUM) if (Number.isFinite(o[k])) S[k] = o[k];
    S.tail = tailIn(S.tail);                                                       // a save from before, Tail up to 200 (strokes.js)
    if (typeof o.ink === 'boolean') S.ink = o.ink;
    S.through = o.through === true;
    for (const [k, ok] of [['look', ['geometry', 'colour', 'layers', 'imprint']], ['ground', ['white', 'black']], ['tool', ['select', 'pen', 'brush', 'circle', 'cut']]]) if (ok.includes(o[k])) S[k] = o[k];
    if (Array.isArray(o.figs)) {
      S.figs = o.figs.map(figOf).filter(f => f.anchors.length);
      S.tpl = { ...figOf(o.tpl || o.figs[0]), anchors: [], cuts: null, closed: false };
      S.cur = Number.isInteger(o.cur) ? o.cur : 0;
    } else if (Array.isArray(o.anchors)) {                                         // a save of the one ribbon, before 2026-10-05
      const f = figOf(o);
      S.figs = f.anchors.length ? [f] : []; S.tpl = { ...f, anchors: [], cuts: null, closed: false }; S.cur = 0;   // none: the canvas cleared
    }
  } catch { }
  fixCur(); fixPick();
}
// The picked figure: one of them, or −1 with none (the canvas cleared); its
// picked point: one of its points, or −1 for the whole figure.
function fixCur() { S.cur = S.figs.length ? Math.max(0, Math.min(S.cur, S.figs.length - 1)) : -1; }
function fixPick() { pick = Math.max(-1, Math.min(pick, S.anchors.length - 1)); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { } };
const bandOpts = (f, step) => ({ rows: f.rows, pitch: f.pitch, width: f.width, stack: f.stack, twist: f.twist, squeeze: f.squeeze, tilt: f.tilt, swing: f.swing, spin: f.spin, zoom: f.zoom, dx: f.dx, dy: f.dy, lens: f.lens, closed: f.closed, step });
const view3 = (f = figNow()) => ({ tilt: f.tilt, swing: f.swing, spin: f.spin, zoom: f.zoom, dx: f.dx, dy: f.dy, lens: f.lens });

// ---------- the cup, and the canvas from home ----------
let INK = {};
const cup = () => cupOf(INK);
async function loadInk() {
  try { const r = await fetch('/ink', { cache: 'no-store' }); INK = r.ok ? await r.json() : {}; } catch { INK = {}; }
}
// The canvas lies from home, Calibration's, at the bottom left corner of the
// walls (the owner, 2026-10-05, adobe_ai/500x700_image_area.png: "the canvas
// must not slide down under the image area, but lie on it"): its bottom edge
// edgeBottom mm above home, its left edge edgeLeft mm to the right — 0 and 50
// on his drawing. Board width and height grow it up and to the right, its
// bottom left corner where it is. Here, the mm the board counts from, is its
// centre. Before, the Test tab's Here (X 226.2 · Y 333.8): the canvas lay
// 124 mm past the bottom wall, and TEST's dots landed off it.
const hereNow = () => { const R = reach(); return { x: R.x.min + S.edgeBottom + S.boardH / 2, y: R.y.min + S.edgeLeft + S.boardW / 2 }; };
const dipCup = () => { const c = cup(), d = dipAt(c); return d ? { ...c, x: d.x, y: d.y } : c; };

// ---------- the bands, and the plan of their run ----------
const BANDS = new WeakMap();   // a figure → its band, while the figure stays as it is
function bandFor(f, step = STEP) {
  const key = JSON.stringify([f.anchors, bandOpts(f, step)]), c = BANDS.get(f);
  if (c?.key === key) return c.b;
  const b = bandOf(f.anchors, bandOpts(f, step));
  BANDS.set(f, { key, b });
  return b;
}
const band = step => bandFor(figNow(), step);   // the picked figure's
// The slow part — what lies over what, the imprint, its fitting, Test's run —
// waits while the mouse turns the ribbon or a slider moves.
let PLAN = null, planKey = '', busy = false;
const EMPTY = { blocks: [], rows: [], pieces: 0, passes: [], imp: null, figs: [], folds: [], seconds: 0, length: 0, need: 0, pastWall: 0, gone: 0, dips: 0, carriage: null, air: [], ink: false };
// Test's run, as PLAY and TEST take it: rows, the number of rows it runs.
const mineL = () => PLAN?.figs?.[S.cur]?.L;   // the picked figure's layers: its cuts, its stretches
const runOpts = rows => ({ ...DEFAULTS, speed: S.speed, travel: S.travel, tail: S.tail, lift: false, ink: S.ink, snake: true, pause: false, rows, here: hereNow(), cup: dipCup(), noDipUnder: NO_DIP, hover: ELBOW_HOVER });
function plan() {
  if (busy && PLAN) return PLAN;
  const here = hereNow(), key = JSON.stringify([S.figs, S.speed, S.travel, S.tail, S.ink, here, S.ink ? dipCup() : null, S.overlap, S.through]);
  if (PLAN && key === planKey) return PLAN;
  planKey = key;
  // each figure's layers, stretches between its cuts; its runs marked with it (f), its rows (n) and their width (w)
  const figs = S.figs.map((f, i) => {
    const b = bandFor(f, STEP);
    if (!b) return null;
    const L = layeredOf(b, { width: f.width, cuts: f.cuts, overlap: S.overlap, through: S.through });
    for (const r of L.imp.runs) Object.assign(r, { f: i, n: f.rows, w: f.width });
    return { b, L };
  });
  if (!figs.some(Boolean)) { PLAN = EMPTY; return PLAN; }
  const runs = figs.flatMap(x => x ? x.L.imp.runs : []), byLayer = {};
  for (const x of figs) if (x) for (const [l, m] of Object.entries(x.L.imp.byLayer)) byLayer[l] = (byLayer[l] || 0) + m;
  const total = figs.reduce((a, x) => a + (x ? x.L.imp.total : 0), 0);
  const imp = { runs, total, byLayer, red: figs.reduce((a, x) => a + (x ? x.L.imp.red * x.L.imp.total : 0), 0) / (total || 1) };
  // every layer runs, in its order, N1 of every figure before N2: no N1 · N2 · N3 keys since 2026-10-05 (the owner: "I do not press one first and then the other")
  const all = bandPasses(runs, { ink: S.ink, tail: S.tail }), rows = all.rows, passes = all.passes;
  const o = runOpts(rows.length);
  // rows: every piece of every layer, by its number (the LCD finds a block's there); pieces: those that run
  PLAN = { ...plotRun(o, passes), rows, pieces: passes.reduce((a, p) => a + p.ps.length, 0), passes: passes.map(p => p.key), ink: S.ink, imp, figs,
    folds: figs.flatMap((x, i) => x ? x.L.folds.map(fo => ({ ...fo, f: i })) : []), opts: o };
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
  const a = areaNow(), m = 16;                                                        // the image area, its walls and their names; the grid's names on the left,
  if (a) { v.x0 = Math.min(v.x0, a.x0 - 60); v.x1 = Math.max(v.x1, a.x1 + m); v.y0 = Math.min(v.y0, a.y0 - 34); v.y1 = Math.max(v.y1, a.y1 + 4); }   // under the bottom wall's names those of Y
  return v;
}
// The image area, the machine's reach between its walls (Calibration's), in
// mm from Here: where the canvas lies past it the brush is pressed along the
// wall (the owner, 2026-10-04, machine/2026-10-04 nolan on paper.jpg: "at the
// bottom there is no edge; I do not see the image area. But it is on
// Calibration — can you carry it over?"). The canvas of 22:17 lay 124 mm past
// the bottom wall, and its rows there ran along it in one flat stripe.
function areaNow() {
  const h = hereNow();
  if (!h) return null;
  const R = reach();
  return { x0: R.x.min - h.x, x1: R.x.max - h.x, y0: R.y.min - h.y, y1: R.y.max - h.y, R };
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
const colourOf = (kk, rows = S.rows) => PALETTE[Math.min(PALETTE.length - 1, Math.floor(kk / rows * PALETTE.length))];
const showPoints = () => ['pen', 'brush', 'circle'].includes(S.tool) || (S.tool !== 'cut' && (S.look === 'geometry' || S.look === 'layers'));
function draw() {
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const W = g.canvas.width / dpr, H = g.canvas.height / dpr, black = S.ground === 'black', ground = black ? '#0B0B0D' : '#FCFBF8';
  const hw = S.boardW / 2, hh = S.boardH / 2;
  g.fillStyle = themeColor('--stage', '#E2DED6'); g.fillRect(0, 0, W, H);   // the table
  const area = areaNow(), ax = y => (y - V.y0) * k, ay = x => (V.x1 - x) * k;     // machine mm from Here → the screen
  const areaRect = () => g.rect(ax(area.y0), ay(area.x1), (area.y1 - area.y0) * k, (area.x1 - area.x0) * k), night = document.documentElement.classList.contains('night');
  if (area) {                                                                          // the grid every 100 mm, machine mm, as on Calibration (the owner, 2026-10-04: "I see the image area, but no scale — add X 800 / Y 500")
    const h = hereNow();
    g.save(); g.strokeStyle = night ? 'rgba(255,255,255,.05)' : 'rgba(36,34,31,.07)'; g.lineWidth = 1; g.fillStyle = themeColor('--mute', '#7D776D'); g.font = font(10);
    for (let x = Math.ceil((h.x + V.x0) / 100) * 100; x <= h.x + V.x1; x += 100) {
      const Y = ay(x - h.x); g.beginPath(); g.moveTo(0, Y); g.lineTo(W, Y); g.stroke(); g.textAlign = 'left'; g.fillText(`X ${x}`, 4, Y + 3);
    }
    for (let y = Math.ceil((h.y + V.y0) / 100) * 100; y <= h.y + V.y1; y += 100) {
      const X = ax(y - h.y); g.beginPath(); g.moveTo(X, 0); g.lineTo(X, H); g.stroke(); g.textAlign = 'center'; g.fillText(`Y ${y}`, X, H - 5);
    }
    g.restore();
    g.fillStyle = night ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.35)'; g.beginPath(); areaRect(); g.fill();
  }
  g.fillStyle = ground; g.fillRect(sx([-hw]), sy([0, -hh]), S.boardW * k, S.boardH * k);
  if (area) {                                                                          // the canvas out of reach: hatched, as on Calibration
    g.save(); g.beginPath(); g.rect(sx([-hw]), sy([0, -hh]), S.boardW * k, S.boardH * k); g.clip();
    g.beginPath(); g.rect(0, 0, W, H); areaRect(); g.clip('evenodd');
    g.strokeStyle = 'rgba(179,71,12,.45)'; g.lineWidth = 1;
    for (let d = -H; d < W; d += 7) { g.beginPath(); g.moveTo(d, H); g.lineTo(d + H, 0); g.stroke(); }
    g.restore();
  }
  g.lineCap = 'round'; g.lineJoin = 'round';
  const step = busy && drag?.mode !== 'cut' ? DRAG_STEP : STEP;                     // a cut dragged: the ribbon as it is
  const bands = S.figs.map((f, i) => bandFor(f, i === S.cur ? step : STEP)), b = bands[S.cur] || null;   // the others stay as they are
  if (S.look === 'imprint' && !busy) drawImprint();
  else bands.forEach((bb, i) => bb && drawBand(bb, black, ground, i));               // in the order drawn: the last on top
  if (REF && S.refOpacity > 0) {                                                       // the reference as tracing paper
    const img = REF.img, s = Math.min(S.boardW / img.naturalWidth, S.boardH / img.naturalHeight), w = img.naturalWidth * s, h = img.naturalHeight * s;
    g.globalAlpha = S.refOpacity / 100; g.drawImage(img, sx([-w / 2]), sy([0, -h / 2]), w * k, h * k); g.globalAlpha = 1;
  }
  g.strokeStyle = black ? 'rgba(255,255,255,.35)' : 'rgba(36,34,31,.8)'; g.lineWidth = 1; g.strokeRect(sx([-hw]) + .5, sy([0, -hh]) + .5, S.boardW * k - 1, S.boardH * k - 1);
  if (area) {                                                                          // the walls: dashed orange, named, as on Calibration
    const R = area.R, A = area;
    g.save(); g.strokeStyle = '#EB7A25'; g.lineWidth = 1.2; g.setLineDash([6, 4]); g.beginPath(); areaRect(); g.stroke(); g.setLineDash([]);
    g.font = font(10); g.fillStyle = '#B3470C';
    g.textAlign = 'left'; g.fillText(`image area ${fmt(R.y.max - R.y.min)} × ${fmt(R.x.max - R.x.min)} mm`, ax(A.y0) + 4, ay(A.x1) - 5);
    g.textAlign = 'right'; g.fillText(`wall X +${fmt(R.x.max)}`, ax(A.y1) - 4, ay(A.x1) - 5);
    g.fillText(`wall X +${fmt(R.x.min)}`, ax(A.y1) - 4, ay(A.x0) + 13);
    g.textAlign = 'left'; g.fillText(`wall Y +${fmt(R.y.min)}`, ax(A.y0) + 4, ay(A.x0) + 13);
    g.textAlign = 'right'; g.fillText(`wall Y +${fmt(R.y.max)}`, ax(A.y1) - 4, ay(A.x0) + 25);
    g.restore();
  }
  g.strokeStyle = '#EB7A25'; g.lineWidth = 1.5;                                    // Here: the canvas's centre
  g.beginPath(); g.moveTo(sx([-8]), sy([0, 0])); g.lineTo(sx([8]), sy([0, 0])); g.moveTo(sx([0]), sy([0, -8])); g.lineTo(sx([0]), sy([0, 8])); g.stroke();
  g.font = font(10); g.fillStyle = '#B3470C'; g.textAlign = 'left';
  g.fillText(`canvas ${S.boardW} × ${S.boardH} mm`, sx([-hw]), sy([0, -hh]) - 6);
  const h = hereNow(), msx = q => (q.y - V.y0) * k, msy = q => (V.x1 - q.x) * k, ink = themeColor('--ink', '#24221F');
  g.save(); g.strokeStyle = black ? 'rgba(255,255,255,.55)' : 'rgba(36,34,31,.55)'; g.lineWidth = 1;   // TEST's dots: a small cross each, 20 mm in from the corners
  for (const d of cornerDots(S.boardW, S.boardH).dots) { const X = msx(d.at), Y = msy(d.at); g.beginPath(); g.moveTo(X - 5, Y); g.lineTo(X + 5, Y); g.moveTo(X, Y - 5); g.lineTo(X, Y + 5); g.stroke(); }
  g.restore();
  const hc = homeCorner(), home = { x: hc.x - h.x, y: hc.y - h.y }, hX = msx(home), hY = msy(home);   // home: the canvas lies from it
  g.strokeStyle = ink; g.lineWidth = 1.2; g.strokeRect(hX - 4, hY - 4, 8, 8); g.fillStyle = ink; g.textAlign = 'left'; g.fillText('home', hX + 8, hY - 6);
  if (S.ink) {                                                                         // INK ON, as on Test: the cup's red scope, the way in the air
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
  if (b && S.figs.length > 1) {                                                        // the picked figure, the one the panel edits: a dashed frame round it
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const q of [...b.E0, ...b.E1]) { x0 = Math.min(x0, sx(q)); x1 = Math.max(x1, sx(q)); y0 = Math.min(y0, sy(q)); y1 = Math.max(y1, sy(q)); }
    g.save(); g.setLineDash([4, 4]); g.strokeStyle = '#EB7A25'; g.lineWidth = 1; g.strokeRect(x0 - 6, y0 - 6, x1 - x0 + 12, y1 - y0 + 12); g.restore();
  }
  if (showPoints()) {                                                                  // the points: squares where they lie now
    const imp = projector(view3());
    S.anchors.forEach((a, i) => {
      const p = imp([a.x, a.y, a.z]), X = sx(p), Y = sy(p), s = i === pick ? 5 : 4;
      g.fillStyle = i === pick ? '#EB7A25' : '#fff'; g.strokeStyle = '#24221F'; g.lineWidth = 1.2;
      g.fillRect(X - s, Y - s, 2 * s, 2 * s); g.strokeRect(X - s, Y - s, 2 * s, 2 * s);
    });
  }
  if (drag?.mode === 'brush' && drag.stroke.length > 1) {                             // the Brush's stroke as it goes: its width, its centre
    const line = () => { g.beginPath(); drag.stroke.forEach((p, i) => i ? g.lineTo(sx(p), sy(p)) : g.moveTo(sx(p), sy(p))); };
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#EB7A25';
    g.globalAlpha = 0.25; g.lineWidth = ((S.rows - 1) * S.pitch + S.width) * k; line(); g.stroke();
    g.globalAlpha = 1; g.lineWidth = 1.5; line(); g.stroke(); g.restore();
  }
  if (drag?.mode === 'circle' && drag.r > 0) {                                         // the Circle as it is dragged: its width, its centre line
    g.save(); g.strokeStyle = '#EB7A25';
    g.globalAlpha = 0.25; g.lineWidth = ((S.rows - 1) * S.pitch + S.width) * k; g.beginPath(); g.arc(sx(drag.c), sy(drag.c), drag.r * k, 0, Math.PI * 2); g.stroke();
    g.globalAlpha = 1; g.lineWidth = 1.5; g.beginPath(); g.arc(sx(drag.c), sy(drag.c), drag.r * k, 0, Math.PI * 2); g.stroke();
    g.font = font(10); g.fillStyle = '#EB7A25'; g.textAlign = 'left'; g.fillText(`⌀ ${fmt(2 * drag.r, 0)} mm`, sx(drag.c) + drag.r * k + 8, sy(drag.c) + 3);
    g.restore();
  }
  if (b && cutting()) drawCuts(b, black);                                              // the cuts, with the Cut tool
  if (!busy) drawFolds();                                                              // where the rows fold: a red !
  drawTrail();
}
// Geometry, Colour, Layers: the band far to near, each piece covering what
// lies behind it, then its rows.
function drawBand(b, black, ground, f) {
  const lay = S.look === 'layers' ? (busy ? (drag?.mode === 'cut' ? PLAN?.figs?.[f]?.L.lay : null) : plan().figs[f]?.L.lay) : null, width = S.figs[f].width;
  for (const q of b.quads) {
    const i = q.i;
    g.beginPath(); q.poly.forEach((p, j) => j ? g.lineTo(sx(p), sy(p)) : g.moveTo(sx(p), sy(p))); g.closePath();
    g.fillStyle = ground; g.strokeStyle = ground; g.lineWidth = 0.8; g.fill(); g.stroke();
    g.lineWidth = width * k;
    for (let kk = 0; kk < b.rows; kk++) {
      g.strokeStyle = S.look === 'geometry' ? (b.pitch[i] < width ? '#D9481C' : black ? '#E9E5DD' : '#2A2826')
        : S.look === 'layers' ? LAYER[Math.min(LAYER.length - 1, (lay ? lay[i] : 1) - 1)]
        : b.back[i] ? shade(colourOf(kk, b.rows), 0.5) : colourOf(kk, b.rows);
      g.beginPath(); g.moveTo(sx(b.S[i][kk]), sy(b.S[i][kk])); g.lineTo(sx(b.S[i + 1][kk]), sy(b.S[i + 1][kk])); g.stroke();
    }
  }
}
// Layers: each stretch's name, and the cuts between them — a line across the
// ribbon, a handle on its centre to drag it along.
const cutsNow = () => S.cuts ?? mineL()?.cuts ?? [];
const indexAt = (b, v) => { let lo = 0, hi = b.n - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (b.s[m] < v) lo = m + 1; else hi = m; } return lo; };
function drawCuts(b, black) {
  const ink = black ? '#F2EEE6' : '#24221F';
  g.save(); g.font = font(11, 600); g.textAlign = 'center'; g.textBaseline = 'middle';
  if (!busy) for (const st of mineL()?.stretches || []) {                                 // N1 … at the middle of its stretch
    const p = b.M[indexAt(b, (st.s0 + st.s1) / 2)], X = sx(p), Y = sy(p), on = PLAN.passes.includes(`N${st.layer}`);
    g.globalAlpha = on ? 1 : 0.5;
    g.fillStyle = LAYER[Math.min(LAYER.length - 1, st.layer - 1)]; g.beginPath(); g.roundRect(X - 15, Y - 9, 30, 18, 9); g.fill();
    g.fillStyle = '#fff'; g.fillText(`N${st.layer}`, X, Y + 0.5);
  }
  g.globalAlpha = 1;
  cutsNow().forEach((v, c) => {
    const i = indexAt(b, v), a = b.E0[i], z = b.E1[i], m = b.M[i], picked = c === pickCut;
    g.setLineDash([5, 4]); g.strokeStyle = picked ? '#EB7A25' : ink; g.lineWidth = picked ? 2 : 1.4;
    g.beginPath(); g.moveTo(sx(a), sy(a)); g.lineTo(sx(z), sy(z)); g.stroke(); g.setLineDash([]);
    g.fillStyle = picked ? '#EB7A25' : black ? '#0B0B0D' : '#fff'; g.strokeStyle = picked ? '#EB7A25' : ink; g.lineWidth = 1.5;
    g.beginPath(); g.arc(sx(m), sy(m), 5.5, 0, Math.PI * 2); g.fill(); g.stroke();
  });
  g.restore();
}
// A red ! where the painted rows fold — run back against the ribbon: move a point there.
function drawFolds() {
  for (const f of PLAN?.folds || []) {
    const b = PLAN.figs[f.f]?.b; if (!b) continue;
    const m = b.M[indexAt(b, f.s)], X = sx(m), Y = sy(m);
    g.save(); g.fillStyle = '#D9481C'; g.strokeStyle = '#fff'; g.lineWidth = 1.5;
    g.beginPath(); g.arc(X, Y, 9, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#fff'; g.font = font(13, 700); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('!', X, Y + 0.5);
    g.restore();
  }
}
// Imprint: what the machine paints — the visible pieces, their ends thinning
// over Tail as the elbow lands and lifts the brush (strokes.js, rowLift);
// with INK ON the watercolour as it lies on the paper.
function drawImprint() {
  const P_ = plan();
  if (!P_.imp) return;
  if (P_.ink) { drawWash(P_); return; }
  for (const r of P_.imp.runs) {
    const L = lengthOf(r.pts), z = Math.min(S.tail, L / 2);
    let s = 0;
    g.strokeStyle = colourOf(r.k, r.n);
    for (let j = 1; j < r.pts.length; j++) {
      const a = r.pts[j - 1], c = r.pts[j], d = Math.hypot(c[0] - a[0], c[1] - a[1]), m = s + d / 2;
      const w = m < z ? (1 - Math.cos(Math.PI * m / z)) / 2 : m > L - z ? (1 - Math.cos(Math.PI * (L - m) / z)) / 2 : 1;
      g.lineWidth = Math.max(0.6, r.w * k * w);
      g.beginPath(); g.moveTo(sx(a), sy(a)); g.lineTo(sx(c), sy(c)); g.stroke();
      s += d;
    }
  }
  g.globalAlpha = 1;
}
// The Watercolour run on the paper (band.js, washOf; the owner, 2026-10-04:
// "I want to see on the screen more exactly what I paint with the brush"):
// each stroke in the wash, strongest fresh from the cup and paler along the
// dip run, a blot where it lands so; wet rows nearly touching run into one
// wash; strokes over one another darker — the board multiplies them, as the
// paper does. Each stroke a few paths of one shade, so it never darkens itself.
const WASH = [74, 16, 140];   // the violet wash in the cup on 2026-10-04, by eye from the photos, est.
const WASH_LIGHT = [205, 175, 245];   // the same on the black ground, lighter: the board adds there
const WASH_WET = 0.5, WASH_DRY = 0.14, WASH_BLOT = 0.8;   // its strength fresh from the cup, at the end of a dip run, in a blot (est., the trace of 18:11)
function drawWash(P_) {
  P_.wash ??= washOf(P_.preview, P_.figs.map(x => x?.b), P_.imp.runs, S.width, areaNow());   // pressed into the walls, as the run is; each figure's band
  const black = S.ground === 'black';
  const tone = a => black ? `rgb(${WASH_LIGHT.map(c => Math.round(c * a)).join(',')})` : `rgb(${WASH.map(c => Math.round(255 - (255 - c) * a)).join(',')})`;
  g.save(); g.globalCompositeOperation = black ? 'screen' : 'multiply'; g.lineCap = 'butt'; g.lineJoin = 'round';
  for (const st of P_.wash) {
    const q = st.pts;
    let from = 0, key = null;
    const flush = j => {                                                            // the points from..j, one shade, one width
      if (j <= from) return;
      const [a, w] = key.split(' ').map(Number);
      g.strokeStyle = tone(a); g.lineWidth = Math.max(0.6, w * k);
      g.beginPath(); g.moveTo(sx(q[from].p), sy(q[from].p));
      for (let m = from + 1; m <= j; m++) g.lineTo(sx(q[m].p), sy(q[m].p));
      g.stroke();
    };
    for (let j = 0; j < q.length; j++) {
      const a = WASH_DRY + (WASH_WET - WASH_DRY) * q[j].load, kk = `${(Math.round(a * 50) / 50).toFixed(2)} ${Math.round(q[j].w * 4) / 4}`;
      if (kk !== key) { if (key !== null) flush(j); from = j; key = kk; }   // the next path from the point this one ends on
    }
    if (key !== null) flush(q.length - 1);
    const land = st.dip && q.find(t => t.w >= 0.5 * S.width);                      // the blot: fresh from the cup, the brush lands
    if (land) { g.fillStyle = tone(WASH_BLOT); g.beginPath(); g.arc(sx(land.p), sy(land.p), 0.8 * S.width * k, 0, Math.PI * 2); g.fill(); }
  }
  g.restore();
}
// The run as it goes (Test's): where the carriage has been since PLAY —
// red where the brush paints, light blue in the air: to the cup, between the
// pieces, home (the owner, 2026-10-04: "everything is orange; I would leave
// grey what went through the air"; then, the orange lost in Layers: "red on
// the paper, light blue in the air"). Each point says how the way to it went.
let trail = [], trailOf = null, RUN = null, RUN_INFO = null;   // RUN: the blocks PLAY or TEST sent; RUN_INFO: their seconds and rows, for the LCD
const AIR = '#4FC3F7', PAPER = '#E5203A';   // light blue in the air, red on the paper: the orange was lost in Layers' N2 (the owner, 2026-10-04)
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
const snapshot = () => JSON.stringify({ figs: S.figs, cur: S.cur, tpl: S.tpl, pick });   // every figure: its points, band, place, cuts
function undoPush() { undoStack.push(snapshot()); if (undoStack.length > 200) undoStack.shift(); redoStack = []; }
function restore(js) { const o = JSON.parse(js); S.figs = o.figs; S.cur = o.cur; S.tpl = o.tpl; pick = o.pick ?? pick; pickCut = -1; fixCur(); fixPick(); settle(); }
function undo() { if (!undoStack.length) return; redoStack.push(snapshot()); restore(undoStack.pop()); }
function redo() { if (!redoStack.length) return; undoStack.push(snapshot()); restore(redoStack.pop()); }

// ---------- the mouse: turn the ribbon, move its points ----------
let drag = null, pickCut = -1;
const cutting = () => S.tool === 'cut';   // the Cut tool (the owner, 2026-10-04: the scissors into the Tools)
// a cut's handle under the mouse, or −1
function cutHit(p) {
  if (!cutting()) return -1;
  const b = band(STEP);
  let best = -1, bd = 9 / k;
  cutsNow().forEach((v, c) => { const m = b.M[indexAt(b, v)], d = Math.hypot(m[0] - p[0], m[1] - p[1]); if (d < bd) { bd = d; best = c; } });
  return best;
}
// The place along the ribbon under the mouse: the nearest piece of band
// covering it, or within a few px of the centre; near: only within ±near mm
// of s0 (a dragged cut keeps to its own part of the ribbon).
function ribbonAt(p, s0 = null, near = 150) {
  const b = band(STEP);
  let best = null, bo = -1;
  for (const q of b.quads) {
    if (s0 !== null && Math.abs(b.s[q.i] - s0) > near) continue;
    const P = q.poly, xs = P.map(v => v[0]), ys = P.map(v => v[1]);
    if (p[0] < Math.min(...xs) || p[0] > Math.max(...xs) || p[1] < Math.min(...ys) || p[1] > Math.max(...ys)) continue;
    let ins = false;
    for (let a = 0, j = 3; a < 4; j = a++) if ((P[a][1] > p[1]) !== (P[j][1] > p[1]) && p[0] < (P[j][0] - P[a][0]) * (p[1] - P[a][1]) / (P[j][1] - P[a][1]) + P[a][0]) ins = !ins;
    if (ins && q.o > bo) { bo = q.o; best = q.i; }
  }
  if (best === null) {
    let bd = (s0 === null ? 8 : 40) / k;
    b.M.forEach((m, i) => { if (s0 !== null && Math.abs(b.s[i] - s0) > near) return; const d = Math.hypot(m[0] - p[0], m[1] - p[1]); if (d < bd) { bd = d; best = i; } });
  }
  return best === null ? null : b.s[best];
}
// The figure under the mouse, the one drawn last on top: its band's pieces. −1: none.
function figAt(p) {
  for (let f = S.figs.length - 1; f >= 0; f--) {
    const b = bandFor(S.figs[f], STEP);
    if (!b) continue;
    for (const q of b.quads) {
      const P = q.poly;
      let ins = false;
      for (let a = 0, j = 3; a < 4; j = a++) if ((P[a][1] > p[1]) !== (P[j][1] > p[1]) && p[0] < (P[j][0] - P[a][0]) * (p[1] - P[a][1]) / (P[j][1] - P[a][1]) + P[a][0]) ins = !ins;
      if (ins) return f;
    }
  }
  return -1;
}
const CUT_MIN = 20;   // mm along the ribbon between two cuts, at least
function setCuts(list, picked) {
  S.cuts = list.slice().sort((a, b2) => a - b2); pickCut = picked === undefined ? -1 : S.cuts.indexOf(picked);
}
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
  undoPush(); ensureFig();                                                         // the canvas cleared: a new figure, its first point at the centre's depth
  const R = rotation(S.tilt, S.swing, S.spin), last = S.anchors.at(-1) || { x: 0, y: 0, z: 0, roll: 0 }, w = apply(R, [last.x, last.y, last.z]);
  const m = apply(transpose(R), [(p[0] - S.dx) / S.zoom, (p[1] - S.dy) / S.zoom, w[2]]);
  S.anchors.push({ x: Math.round(m[0]), y: Math.round(m[1]), z: Math.round(m[2]), roll: last.roll });
  pick = S.anchors.length - 1; settle();
}
cv.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  const p = toCanvas(e), cut = cutHit(p);
  if (cut >= 0) {                                                                      // a cut: picked, dragged along the ribbon
    undoPush(); pickCut = cut;
    drag = { x: e.clientX, y: e.clientY, moved: false, mode: 'cut' };
    cv.setPointerCapture(e.pointerId); stage.classList.add('drag'); kick(); return;
  }
  const hit = cutting() ? -1 : pointHit(p);
  if (pickCut >= 0) { pickCut = -1; kick(); }
  if (hit < 0 && S.tool === 'pen') { addPoint(p); return; }
  if (hit < 0 && (S.tool === 'brush' || S.tool === 'circle')) {                       // Brush: the stroke as the mouse goes; Circle: from its centre out
    drag = { x: e.clientX, y: e.clientY, moved: false, mode: S.tool, stroke: [p], c: p, r: 0 };
    cv.setPointerCapture(e.pointerId); stage.classList.add('drag'); return;
  }
  if (hit < 0) {                                                                       // a click on another figure picks it; on the picked one's body, the whole of it
    const f = figAt(p);
    if (f >= 0 && f !== S.cur) { S.cur = f; pick = -1; settle(); if (cutting()) return; }
    else if (f >= 0 && !cutting() && pick >= 0) { pick = -1; showPanel(); kick(); }
  }
  // Dragged, the figure moves in the canvas's plane, as in Illustrator (the
  // owner, 2026-10-05: "drag and drop turns it in 3D; I do not need 3D —
  // better to drag the circles over the plane"); ⇧ turns it in 3D, ⌥ spins it.
  // Dragged off every figure, nothing moves.
  undoPush();
  drag = { x: e.clientX, y: e.clientY, p, moved: false, mode: hit >= 0 ? 'point' : e.shiftKey ? 'turn' : e.altKey ? 'spin' : figAt(p) >= 0 ? 'move' : 'none' };
  if (hit >= 0) { pick = hit; showPanel(); }
  cv.setPointerCapture(e.pointerId); stage.classList.add('drag');
});
cv.addEventListener('pointermove', e => {
  if (!drag) { const p = toCanvas(e); cv.style.cursor = cutHit(p) >= 0 ? 'grab' : pointHit(p) >= 0 || (S.tool === 'select' && figAt(p) >= 0) ? 'move' : ''; return; }
  if (drag.mode === 'none') return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (!drag.moved && Math.hypot(dx, dy) < 2) return;
  if (drag.mode === 'brush') { drag.x = e.clientX; drag.y = e.clientY; drag.moved = true; busy = true; drag.stroke.push(toCanvas(e)); kick(); return; }
  if (drag.mode === 'circle') { const q = toCanvas(e); drag.moved = true; busy = true; drag.r = Math.hypot(q[0] - drag.c[0], q[1] - drag.c[1]); kick(); return; }
  if (drag.mode === 'cut') {                                                           // along the ribbon, between its neighbours
    if (!drag.moved && !S.cuts) setCuts(cutsNow(), cutsNow()[pickCut]);                // the suggested ones become the owner's
    drag.x = e.clientX; drag.y = e.clientY; drag.moved = true; busy = true;
    const v = ribbonAt(toCanvas(e), S.cuts[pickCut]);
    if (v !== null) {
      const L = band(STEP).L, lo = (S.cuts[pickCut - 1] ?? 0) + CUT_MIN, hi = (S.cuts[pickCut + 1] ?? L) - CUT_MIN;
      S.cuts[pickCut] = Math.max(lo, Math.min(hi, v)); kick();
    }
    return;
  }
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
  if (drag.mode === 'brush') {                                                       // back to its start: a loop
    const st = drag.stroke, closed = Math.hypot(st[0][0] - st.at(-1)[0], st[0][1] - st.at(-1)[1]) < BRUSH_CLOSE && lengthOf(st) > 4 * BRUSH_CLOSE;
    const A = strokeAnchors(st, BRUSH_FIT, closed); drag = null; stage.classList.remove('drag'); A ? born(A, closed) : settle(); return;
  }
  if (drag.mode === 'circle') { const { c, r } = drag; drag = null; stage.classList.remove('drag'); r >= CIRCLE_MIN ? born(circleAnchors(c[0], c[1], r), true) : settle(); return; }
  if (drag.mode === 'cut') { if (!drag.moved) undoStack.pop(); drag = null; stage.classList.remove('drag'); settle(); return; }
  if (!drag.moved && drag.mode !== 'point' && cutting()) {                           // a click on the ribbon: a cut there
    const v = ribbonAt(drag.p), L = band(STEP).L;
    if (v !== null && v > CUT_MIN && v < L - CUT_MIN && cutsNow().every(c => Math.abs(c - v) >= CUT_MIN)) { setCuts([...cutsNow(), v], v); drag = null; stage.classList.remove('drag'); settle(); return; }
  }
  if (!drag.moved) undoStack.pop();
  else if (drag.mode === 'point') { const a = S.anchors[pick]; a.x = Math.round(a.x); a.y = Math.round(a.y); a.z = Math.round(a.z); }
  else if (drag.mode === 'move') { S.dx = Math.round(S.dx); S.dy = Math.round(S.dy); }   // whole mm, as the fields show it
  drag = null; stage.classList.remove('drag'); settle();
});
// A new figure, flat (the owner, 2026-10-05: "with the brush only flat, no
// twisting into bundles by default"; "when I make a second figure, the first
// must stay"): beside the others, the panel's band — Rows, Row to row, Row
// width, Stack — facing you, as Face the canvas, Size 1× so it is Rows × Row
// to row wide in true mm; no Twist, no Squeeze; the cuts as suggested. Its
// points Depth 0, Roll 0: the Brush's stroke (band.js, strokeAnchors), the
// Circle's loop (circleAnchors). Picked whole; ⌘Z takes it away.
const CIRCLE_MIN = 5;   // mm: a smaller drag is a click
function born(A, closed = false) {
  undoPush();
  S.figs.push({ ...figNow(), anchors: A, closed, cuts: null, tilt: 0, swing: 0, spin: 0, zoom: 1, dx: 0, dy: 0, twist: 0, squeeze: 0 });
  S.cur = S.figs.length - 1; pick = -1; pickCut = -1; settle();
}
// ⌘C ⌘V (the owner, 2026-10-05: "draw one circle and copy it down, ⌘C and
// ⌘V — I am on a Mac"): the picked figure copied; pasted under the picked
// one, PASTE_GAP below it, and picked — ⌘V again, the next under that. ⌘X
// copies and takes it out. The arrows move the picked one, 1 mm, ⇧ 10 mm.
const PASTE_GAP = 10;   // mm (Claude's choice)
let CLIP = null;
function boxOf(f) {
  const b = bandFor(f, STEP);
  if (!b) return null;
  const P = [...b.E0, ...b.E1];
  return { y0: Math.min(...P.map(q => q[1])), y1: Math.max(...P.map(q => q[1])) };
}
function copyFig() { if (S.figs[S.cur]) CLIP = JSON.stringify(S.figs[S.cur]); }
function pasteFig() {
  if (!CLIP) return;
  undoPush();
  const f = JSON.parse(CLIP), over = S.figs[S.cur] && boxOf(S.figs[S.cur]), own = boxOf(f);
  if (over && own) f.dy += over.y1 + PASTE_GAP - own.y0;                              // the canvas's y down: under the picked one
  S.figs.push(f); S.cur = S.figs.length - 1; pick = -1; pickCut = -1; settle();
}
function moveFig(ddx, ddy) { if (!S.figs[S.cur]) return; undoPush(); S.dx += ddx; S.dy += ddy; settle(); }
let wheelT = 0;
cv.addEventListener('wheel', e => {
  e.preventDefault();
  if (!busy) undoPush();
  busy = true; S.zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, S.zoom * Math.exp(-e.deltaY * 0.001)));
  showSliders(); kick();
  clearTimeout(wheelT); wheelT = setTimeout(settle, 250);
}, { passive: false });

// ---------- the tools (Create's) ----------
const HINTS = {
  select: 'Select — drag a figure to move it, a square to move a point; ⇧ drag turns it in 3D, ⌥ spins it; the wheel sizes it; ⌘C ⌘V copies it down, the arrows move it.',
  pen: 'Pen — click to add a point at the ribbon\'s end, at the depth of the last one; drag a square to move a point.',
  brush: 'Brush — paint a figure in one stroke, the others stay: flat, facing you, Rows × Row to row wide; back to its start, a loop; drag a square to move a point.',
  circle: 'Circle — press at the centre and drag out to the radius: a flat ring, Rows × Row to row wide; ⌘C ⌘V copies it down.',
  cut: 'Cut — click the ribbon to cut it; drag a circle along it; ⌫ takes the picked cut out; Auto: the cuts as suggested; Uncut: none.',
};
const hintNow = () => HINTS[S.tool];
function setTool(t) { S.tool = t; if (t !== 'cut') pickCut = -1; syncTools(); save(); kick(); }
function syncTools() {
  document.querySelectorAll('.tool[data-tool]').forEach(b2 => b2.classList.toggle('on', b2.dataset.tool === S.tool));
  stage.className = 'stage t-' + S.tool;
  $('#hint').textContent = hintNow();
}
document.querySelectorAll('.tool[data-tool]').forEach(b2 => b2.onclick = () => setTool(b2.dataset.tool));
$('#btnUndo').onclick = undo; $('#btnRedo').onclick = redo;
function deleteCut() { const v = cutsNow()[pickCut]; if (v === undefined) return; undoPush(); setCuts(cutsNow().filter(c => c !== v)); settle(); }
// ⌫: the picked point; the whole figure when it is picked whole, or down to
// its last two points (a loop's last three).
function deletePoint() {
  if (!S.figs[S.cur]) return;
  if (pick < 0 || S.anchors.length <= (S.closed ? 3 : 2)) { deleteFig(); return; }
  undoPush(); S.anchors.splice(pick, 1); fixPick(); settle();
}
function deleteFig() {
  if (!S.figs[S.cur]) return;
  undoPush();
  const [f] = S.figs.splice(S.cur, 1);
  if (!S.figs.length) S.tpl = { ...f, anchors: [], cuts: null, closed: false };     // its numbers for the next
  fixCur(); pick = -1; pickCut = -1; settle();
}
// The canvas cleared, no figure (the owner, 2026-10-05, nolan-v2/Screenshot
// 2026-10-05 at 3.45.43 PM.png: "I cannot clear the screen entirely, one tip
// is left" — ⌫ stopped at two points): Clear, as Create's. Then Brush, Circle
// or Pen paints a new one; ⌘Z brings them back.
function clearRibbon() {
  if (!S.figs.length) return;
  undoPush(); S.tpl = { ...figNow(), anchors: [], cuts: null, closed: false }; S.figs = []; S.cur = -1; pick = -1; pickCut = -1; settle();
}
$('#btnClear').onclick = clearRibbon;
$('#btnDel').onclick = () => cutting() ? deleteCut() : deletePoint();
const blank = A => { undoPush(); ensureFig(); S.anchors = A.map(a => ({ ...a })); S.closed = false; fixPick(); settle(); };
$('#btnDefault').onclick = () => blank(SKETCH);
$('#btnRing').onclick = () => blank(ringBlank());
$('#btnFront').onclick = () => { undoPush(); Object.assign(S, { tilt: 0, swing: 0, spin: 0, zoom: 1, dx: 0, dy: 0 }); settle(); };
// a shape from the prototype's "Copy the shape" (previous_research/nolan_3d_prototype.html)
$('#btnPaste').onclick = () => {
  const text = prompt('Paste the shape copied from the prototype:'); if (!text) return;
  try {
    const o = JSON.parse(text), A = (o.points || []).filter(a => ['x', 'y', 'z', 'roll'].every(k2 => Number.isFinite(a?.[k2])));
    if (A.length < 2) throw new Error('no points');
    undoPush(); ensureFig();
    const g = o.settings || {}, all = Number.isFinite(g.rollAll) ? g.rollAll : 0;   // the prototype's "Roll, all": into every point
    S.anchors = A.map(a => ({ x: a.x, y: a.y, z: a.z, roll: a.roll + all })); S.closed = false;
    const map = { lines: 'rows', pitch: 'pitch', brush: 'width', stack: 'stack', twist: 'twist', tilt: 'tilt', turn: 'swing', spin: 'spin', zoom: 'zoom', dx: 'dx', dy: 'dy', lens: 'lens' };
    for (const [from, to] of Object.entries(map)) if (Number.isFinite(g[from])) S[to] = g[from];
    fixPick(); settle();
  } catch { alert('That is not a shape from the prototype.'); }
};
addEventListener('keydown', e => {
  if (e.key === 'Escape') post('/run/stop');                                         // Esc = STOP, as on Test
  if (e.target.matches('input,select,textarea')) return;
  const cmd = e.metaKey || e.ctrlKey;
  if (cmd && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (cmd && ['c', 'v', 'x'].includes(e.key.toLowerCase()) && !getSelection().toString()) {   // a figure, not the page's text
    e.preventDefault(); const c = e.key.toLowerCase();
    if (c === 'c') copyFig(); else if (c === 'v') pasteFig(); else { copyFig(); deleteFig(); }
    return;
  }
  if (cmd) return;
  const arrow = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
  if (arrow) { e.preventDefault(); const d = e.shiftKey ? 10 : 1; moveFig(arrow[0] * d, arrow[1] * d); return; }
  if (e.key.toLowerCase() === 'v') setTool('select');
  else if (e.key.toLowerCase() === 'p') setTool('pen');
  else if (e.key.toLowerCase() === 'b') setTool('brush');
  else if (e.key.toLowerCase() === 'o') setTool('circle');
  else if (e.key.toLowerCase() === 'c') setTool('cut');
  else if (e.key === 'Backspace' || e.key === 'Delete') cutting() ? deleteCut() : deletePoint();
});

// ---------- the panel: Test's sliders and words ----------
const signed = v => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v)}`;
const BAND_SL = [['rows', 'Rows', '', 1, 2, ROWS_MAX], ['pitch', 'Row to row', 'mm', 0.5, 2, 16, { label: 2 }], ['width', 'Row width', 'mm', 0.5, 1, 12],
  ['stack', 'Stack', 'mm', 1, 0, 30], ['twist', 'Twist', 'half turns', 0.25, -4, 4], ['squeeze', 'Squeeze', '%', 1, -100, 100]];
const VIEW_SL = [['tilt', 'Rotate X', '°', 1, -180, 180], ['swing', 'Rotate Y', '°', 1, -180, 180], ['spin', '↻', '°', 1, -180, 180]];
const LENS_SL = [['lens', 'Lens', '', 1, 0, 100]];
// Size, X ↑ and Y →: fields with the arrows, as Board width and height (the
// owner, 2026-10-05: "X ↑ −250 is the limit, I cannot go lower; make them as
// in CANVAS, arrows up and down"). No limits but Size's. [key, label, unit,
// step, title, sign]; sign −1: X ↑ is up, the canvas's y down.
const ZOOM_MIN = 0.05, ZOOM_MAX = 10;
const VIEW_FIELDS = [['zoom', 'Size', '×', 0.01, 'The picked figure\'s size; the wheel too'], ['dy', 'X ↑', 'mm', 1, 'The picked figure moved up the canvas, mm; the arrows too', -1], ['dx', 'Y →', 'mm', 1, 'The picked figure moved to the right, mm; the arrows too']];
const POINT_SL = [['z', 'Depth', 'mm', 1, -250, 250], ['roll', 'Roll', '°', 1, -180, 360]];
const RUN_SL = [['speed', 'Brush on', 'mm/s', 1, 5, SPEED_MAX], ['travel', 'Between rows', 'mm/s', 5, 20, SPEED_MAX], ['tail', 'Tail', 'mm', 1, TAIL_MIN, TAIL_MAX], ['overlap', 'Overlap', 'mm', 1, 0, 10]];
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
    inp.oninput = () => { const o = objOf(); if (!o) return; if (!busy) undoPush(); busy = true; o[inp.dataset.k] = +inp.value * sign; showSliders(); kick(); };
    inp.onchange = () => settle();
  });
}
sliders($('#slBand'), BAND_SL, () => S);
sliders($('#slView'), VIEW_SL, () => S);
sliders($('#slLens'), LENS_SL, () => S);
$('#viewFields').innerHTML = VIEW_FIELDS.map(([key, label, unit, step, title]) => `<label title="${title}">${label} <input data-k="${key}" type="number" step="${step}"${key === 'zoom' ? ` min="${ZOOM_MIN}" max="${ZOOM_MAX}"` : ''}><em>${unit}</em></label>`).join('');
$('#viewFields').querySelectorAll('input').forEach(inp => {
  const [key, , , , , sign = 1] = VIEW_FIELDS.find(f => f[0] === inp.dataset.k);
  inp.oninput = () => {                                                           // each arrow's step at once, as a slider
    const v = +inp.value;
    if (inp.value === '' || !Number.isFinite(v) || !S.figs[S.cur] || (key === 'zoom' && !(v >= ZOOM_MIN && v <= ZOOM_MAX))) return;
    if (!busy) undoPush();
    busy = true; S[key] = v * sign; kick();
  };
  inp.onchange = () => settle();
});
sliders($('#slPoint'), POINT_SL, () => S.anchors[pick]);
sliders($('#slRun'), RUN_SL, () => S);
// The board's size, and where it lies: its edges from home, with a ruler
// (the owner, 2026-10-05) — any number, 0 and below too.
const FIELDS = [['boardW', 'Board width', 'mm', 10, 'The canvas across; it grows to the right'], ['boardH', 'Board height', 'mm', 10, 'The canvas up the machine; it grows upwards'],
  ['edgeLeft', 'Left edge →', 'mm', 1, 'The canvas\'s left edge, mm to the right of home', true], ['edgeBottom', 'Bottom edge ↑', 'mm', 1, 'The canvas\'s bottom edge, mm above home', true]];
$('#fields').innerHTML = FIELDS.map(([key, label, unit, step, title, any]) => `<label title="${title}">${label} <input data-k="${key}" type="number" step="${step}"${any ? '' : ` min="${step}"`}><em>${unit}</em></label>`).join('');
$('#fields').querySelectorAll('input').forEach(inp => inp.onchange = () => {
  const v = +inp.value, any = FIELDS.find(f => f[0] === inp.dataset.k)[5];
  if (inp.value !== '' && Number.isFinite(v) && (any || v > 0)) S[inp.dataset.k] = v;
  settle();
});
$('#planInfo').onclick = () => { $('#planRead').hidden = !$('#planRead').hidden; $('#planInfo').classList.toggle('on', !$('#planRead').hidden); };
$('#ink').onchange = e => { S.ink = e.target.checked; settle(); };
$('#inkOff').onclick = () => { S.ink = false; settle(); };
$('#inkOn').onclick = () => { S.ink = true; settle(); };
document.querySelectorAll('[data-look]').forEach(b2 => b2.onclick = () => { S.look = b2.dataset.look; $('#hint').textContent = hintNow(); showPanel(); save(); kick(); });
document.querySelectorAll('[data-ground]').forEach(b2 => b2.onclick = () => { S.ground = b2.dataset.ground; showPanel(); save(); kick(); });
// Each slider looked for in its own box: Roll is the band's and a point's
// both (the owner, 2026-10-04: "the ROLL slider does not move" — the band's
// was set back to the point's on every step where a slider takes no focus).
function showSliders() {
  $('#viewFields').querySelectorAll('input').forEach(inp => {
    const [key, , , , , sign = 1] = VIEW_FIELDS.find(f => f[0] === inp.dataset.k), v = S[key] * sign;
    if (document.activeElement !== inp) inp.value = key === 'zoom' ? Math.round(v * 100) / 100 : Math.round(v * 10) / 10;
  });
  for (const [list, box, objOf] of [[BAND_SL, '#slBand', () => S], [VIEW_SL, '#slView', () => S], [LENS_SL, '#slLens', () => S], [POINT_SL, '#slPoint', () => S.anchors[pick]], [RUN_SL, '#slRun', () => S]]) for (const [key, , unit, , , , , sign = 1] of list) {
    const obj = objOf(); if (!obj) continue;                                        // no point picked: the canvas cleared
    const inp = $(`${box} input[data-k="${key}"]`), v = obj[key] * sign;
    if (document.activeElement !== inp) inp.value = v;
    const shown = key === 'rows' ? `${S.rows} · ${fmt((S.rows - 1) * S.pitch + S.width, 0)} mm` : key === 'zoom' ? fmt(v, 2) : ['dx', 'dy', 'roll', 'twist', 'squeeze'].includes(key) ? signed(Math.round(v * 100) / 100) : Math.round(v * 100) / 100;
    $(`${box} [data-v="${key}"]`).textContent = `${shown}${unit && key !== 'rows' ? ' ' + unit : ''}`;
  }
  const n = S.anchors.length, fig = S.figs.length > 1 ? `Figure ${S.cur + 1} of ${S.figs.length} · ` : '';
  $('#ptHead').textContent = pick >= 0 ? `${fig}Point ${pick + 1} of ${n}` : n ? `${fig}${n} points — click a square` : 'No figure';
  $('#slPoint').hidden = pick < 0;
}
function showPanel() {
  showSliders();
  $('#fields').querySelectorAll('input').forEach(inp => { if (document.activeElement !== inp) inp.value = S[inp.dataset.k]; });
  $('#ink').checked = S.ink; $('#inkOff').classList.toggle('on', !S.ink); $('#inkOn').classList.toggle('on', S.ink);
  document.querySelectorAll('[data-look]').forEach(b2 => b2.classList.toggle('on', b2.dataset.look === S.look));
  document.querySelectorAll('[data-ground]').forEach(b2 => b2.classList.toggle('on', b2.dataset.ground === S.ground));
  showLayers();
}
// The cuts' keys: Auto and Uncut, then Pass through. The N1 · N2 · N3 keys
// before them, latching as D1 · D2 · D3 on Test (2026-10-04), are gone (the
// owner, 2026-10-05: "I do not press one first and then the other; these keys
// are not needed"): every layer runs, in its order.
const layersNow = () => PLAN?.imp ? Object.keys(PLAN.imp.byLayer).map(Number).sort((a, b2) => a - b2) : [];
// Uncut: no cuts at all, the ribbon one layer (the owner, 2026-10-04: "what if
// we add an option Uncut and do not cut at all?") — the suggested cuts lay on
// the pinches, and every row ended there. Pass through, after it, latches on
// its own: nothing hides (the owner, the same night: "maybe let it run
// straight through? Let's add a key after Uncut, Pass through").
const uncut = () => Array.isArray(S.cuts) && !S.cuts.length;
function showLayers() {
  const lays = layersNow();
  const html = (lays.length ? `<button class="tog cutkey${S.cuts ? '' : ' on'}" data-cuts title="The cuts as suggested: where the ribbon hides behind itself, turns over or edge-on${S.cuts?.length ? ' — yours are set by hand now' : ''}; the Cut tool on the left moves them">Auto</button>`
      + `<button class="tog cutkey${uncut() ? ' on' : ''}" data-uncut title="No cuts: the ribbon in one layer, every row whole from end to end, broken only where another part lies over it — one pass, no pause for the dry; the Cut tool cuts it again">Uncut</button>`
      + `<button class="tog cutkey through${S.through ? ' on' : ''}" data-through title="Pass through, on or off: nothing hides — every row runs whole over and under the other parts of the ribbon, as through glass">Pass through</button>` : '');
  const el = $('#layerKeys');
  if (el.dataset.html !== html) { el.innerHTML = html; el.dataset.html = html; }
  el.hidden = !lays.length;
}
$('#layerKeys').onclick = e => {
  if (e.target.closest('[data-cuts]')) { if (S.cuts) { undoPush(); S.cuts = null; pickCut = -1; settle(); } return; }
  if (e.target.closest('[data-uncut]')) { if (!uncut()) { undoPush(); S.cuts = []; pickCut = -1; settle(); } return; }
  if (e.target.closest('[data-through]')) { S.through = !S.through; settle(); }
};
// Settled: the mouse let go, a slider let go — the plan, the reading, the LCD.
function settle() {
  busy = false;
  const P_ = plan(), C = cup(), here = hereNow(), est = key => C.est?.[key] ? ' (est.)' : '';
  const lays = P_.imp ? Object.keys(P_.imp.byLayer).map(Number).sort((a, b2) => a - b2) : [];
  const inkWhy = S.ink ? cupProblem(C) : '';
  // The reading under the ⓘ of Canvas, what stops PLAY always (the owner,
  // 2026-10-05: "this text below we hide under (i)", as The dip on the Ink
  // tab); the folds have their red ! on the board.
  $('#planRead').innerHTML = (!P_.imp ? 'No figure: paint one with the Brush (B) or the Circle (O), or two points with the Pen (P).' :
    `The imprint: <b>${P_.imp.runs.length}</b> pieces of row, <b>${fmt(P_.imp.total / 1000, 1)} m</b> · `
    + `the layers by depth ${lays.map(l => `<span class="lay" style="background:${LAYER[Math.min(LAYER.length - 1, l - 1)]}"></span>N${l} ${fmt(P_.imp.byLayer[l] / 1000, 1)} m`).join(' · ')}${P_.passes.length > 1 ? (S.ink ? ', one after another, no pause: the watercolour only lays in the form' : ', a pause between them — CONTINUE when the one under is dry') : ''} · `
    + `closer than the row's width: <span class="${P_.imp.red > 0.35 ? 'warn' : ''}">${fmt(P_.imp.red * 100, 0)} %</span> · `
    + (S.ink ? `<b>Ink ON</b>, the Watercolour run: a dip every ${DIP_RUN} mm along a row (est.), none before a piece under ${NO_DIP} mm but a layer's first, ${P_.dips} dips; the elbow over the rim +${C.rim}°${est('rim')}, in the cup ${C.dip > 0 ? '+' : ''}${C.dip}°${est('dip')}, ${C.dwell} s in the paint · ` : 'the Paint run · ')
    + `${fmt(P_.length / 1000, 2)} m with the brush down, at ${S.speed} mm/s · ≈ ${fmt(P_.seconds / 60, 1)} min (est.) · the elbow lands and lifts the brush over ${S.tail} mm of each piece's ends, 0° pressed to +${ELBOW_LIFT}° off; up to ${fmt(P_.need, 0)}°/s (est.) · into lines and arcs, ≤ 0.1 mm: 3D only in the drawing`)
    + (P_.folds?.length ? ` <span class="warn">${P_.folds.length === 1 ? 'One place' : `${P_.folds.length} places`} where the rows fold, the red ! (${P_.folds.map(f => `${S.figs.length > 1 ? `figure ${f.f + 1} ` : ''}${fmt(f.s / (P_.figs[f.f]?.b.L || 1) * 100, 0)} %, ${f.rows} rows`).join(' · ')}): the ribbon turns there tighter than half its width — move or take out a point near it.</span>` : '')
    + (P_.pastWall > 0.05 && P_.pastWall <= PAST_MANY ? ` <span class="hint">${fmt(P_.pastWall, 0)} mm of the path past the machine's walls: pressed along them, as on the Job tab.</span>` : '')
    + ` · The canvas from home: its bottom left corner at carriage <b>X ${fmt(here.x - S.boardH / 2, 1)} · Y ${fmt(here.y - S.boardW / 2, 1)} mm</b>, its centre X ${fmt(here.x, 1)} · Y ${fmt(here.y, 1)}; TEST's dots ${TEST_MARGIN} mm in from its edges.`;
  const warn = [inkWhy, P_.fault && `The plan is wrong, PLAY will not run it: ${P_.fault}.`,
    P_.need > WRIST_MAX && `The elbow goes ${WRIST_MAX}°/s at most on the move: a longer Tail or a slower brush.`,
    P_.pastWall > PAST_MANY && `${fmt(P_.pastWall / 1000, 1)} m of the rows lie past the machine's walls and would be pressed along them: the canvas lies partly out of reach — check its edges from home, or move the ribbon.`,
    walls()].filter(Boolean);
  $('#planWarn').innerHTML = warn.map(w => `<span class="warn">${w}</span>`).join(' ');
  $('#planWarn').hidden = !warn.length;
  $('#stats').textContent = `${P_.blocks.length} steps · ${P_.passes.join(' + ') || 'nothing to paint'} · ${S.figs.length === 1 ? '1 figure' : `${S.figs.length} figures`} · ${S.figs.reduce((a, f) => a + f.anchors.length, 0)} points`;
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
  const meta = JSON.stringify({ rembrandt: '0.3', nolan: true, label: nolanLabel(), settings: S }).replace(/&/g, '\\u0026').replace(/</g, '\\u003c').replace(/--/g, '- -');
  const rows = (P_.imp?.runs || []).map(r => `  <path stroke="${colourOf(r.k, r.n)}" stroke-width="${f(r.w)}" data-layer="${r.layer}" data-figure="${r.f + 1}" d="M${r.pts.map(p => `${f(W / 2 + p[0])} ${f(H / 2 + p[1])}`).join(' L')}"/>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}">
<!-- Rembrandt v0.3 · ${nolanLabel()}; 1 unit = 1 mm -->
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
    if (!Array.isArray(o.settings?.anchors) && !Array.isArray(o.settings?.figs)) { $('#saveState').textContent = 'a NOLAN save of the flat ribbons, before 3D: it cannot open here'; return; }
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
  if (!P_.rows.length) { $('#runState').innerHTML = '<span class="warn">Nothing to paint.</span>'; return; }
  if (S.ink && cupProblem(cup())) { $('#runState').innerHTML = `<span class="warn">Ink ON: ${cupProblem(cup())}</span>`; return; }
  if (walls()) { $('#runState').innerHTML = `<span class="warn">${walls()}</span>`; return; }
  if (P_.fault) { $('#runState').innerHTML = `<span class="warn">Not run: the plan is wrong — ${P_.fault}.</span>`; return; }
  if (!confirm(`${P_.passes.join(' + ')}: ${P_.pieces} pieces of row will be run on the machine${S.ink ? `, ${P_.dips} dips in the cup` : ''}`
    + (P_.pastWall > PAST_MANY ? `\n\n${fmt(P_.pastWall / 1000, 1)} m of them lie past the machine's walls and will be pressed along them.` : ''))) return;
  try {
    RUN = P_.blocks; RUN_INFO = { seconds: P_.seconds, rows: P_.rows };
    const r = await fetch('/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blocks: P_.blocks,
      log: { page: 'nolan', label: nolanLabel(), settings: S, here: hereNow(), ...(S.ink ? { cup: cup() } : {}), estimate_s: Math.round(P_.seconds) } }) });   // the run journal, rembrandt.py
    $('#runState').textContent = await r.text();
  } catch { $('#runState').textContent = 'start rembrandt.py'; }
};
// TEST, before PLAY (the owner, 2026-10-04: "before PLAY I would like a test.
// The brush in the bottom left corner; I press TEST and it dips in the paint
// and puts dots at the farthest corners, TL TR / BL BR"): one dip in the cup,
// with INK ON or OFF, a dot TEST_MARGIN mm in from each corner of the board —
// TL, TR, BR, BL (2026-10-05: the board's, not the drawing's) — and home.
// Test's run, as PLAY's.
function testRun() {
  const T = cornerDots(S.boardW, S.boardH);   // the board's, so with no ribbon too
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
  try {
    RUN = T.blocks; RUN_INFO = { seconds: T.seconds, rows: T.dots.map(d => ({ label: `TEST · ${d.name}` })) };
    const r = await fetch('/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blocks: T.blocks,
      log: { page: 'nolan', label: 'NOLAN · TEST · the corners', here, dots: T.dots.map(d => ({ name: d.name, x: +(here.x + d.at.x).toFixed(1), y: +(here.y + d.at.y).toFixed(1) })), cup: cup(), estimate_s: Math.round(T.seconds) } }) });
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
  const R_ = live && RUN_INFO ? RUN_INFO : P_;                                      // what runs: PLAY's plan, or TEST's corners
  const total = R_.seconds, left = live && started && pct >= 3 ? (Date.now() / 1000 - started) * (100 - pct) / pct : total * (1 - pct / 100);
  const state = !st ? 'no server' : live ? (st.state === 'paused' ? 'paused' : 'live') : st.state === 'idle' ? 'plan' : st.state;
  const b2 = st && (RUN || P_.blocks)[st.block], row = b2 && R_.rows[b2.row - 1];   // the blocks PLAY sent: N1 · N2 may be switched since
  const what = row && (row.label ?? `${row.name} · ${S.figs.length > 1 ? `figure ${row.f + 1} · ` : ''}row ${row.row} of ${S.figs[row.f]?.rows ?? S.rows}`);
  const waiting = st?.state === 'paused' && st.message;
  paused = ['paused', 'pausing'].includes(st?.state);
  const keyEl = $('#btnPause');
  keyEl.textContent = paused ? 'CONTINUE' : 'PAUSE'; keyEl.classList.toggle('call', paused); keyEl.disabled = !live;
  const now = waiting ? `❚❚ ${st.message}`
    : live && b2?.home ? 'done · the carriage goes home, the brush off'
    : live && row && b2?.dip ? `${what} · the dip in the cup`
    : live && row ? what + (st.brush_on ? ' · brush on' : ' · brush off')
    : `${P_.pieces || 0} pieces · ${P_.passes.join('+') || 'nothing to paint'}`;
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
