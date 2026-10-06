// Rembrandt · LOVE — a copy of TYPE where the new things go, TYPE kept as it
// is to go back to (the owner, 2026-10-07: "I would duplicate TYPE's
// functionality but make a new tab, LOVE, and bring the new changes there —
// if something goes wrong, we can roll back to TYPE"). Its own plan,
// loveplan.js, its own keep in this browser and its own Library label; the
// rest — the run, the canvas from home, the cup, the LCD — shared. TYPE's
// words follow.
//
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
import { plotRun, DEFAULTS, TABLE_MM, ELBOW_HOVER, SPEED_MAX, sweepOf, tailIn } from './strokes.js';
import { cornerDots, TEST_MARGIN, washOf, DIP_RUN, NO_DIP, LOOP_SHARE } from './band.js';
import { layoutOf, fitHeight, sessionsOf, traceOf, traceRows, marksOf, markPaths, dragOf, dragPaths, paintWalk, marksRows, dragRows, pitchOf, MARKS_DIP, RINGS_MIN, RINGS_MAX, OVERLAPS } from './loveplan.js';
import { drawWash } from './wash.js';
import { CANVAS_FIELDS as FIELDS, canvasNow, setCanvas, onCanvas } from './canvas.js';
import { segments, sticks } from './lcd.js';
import { lampSwitch, themeColor } from './lamp.js';
import { cupOf, cupProblem, drawCup, dipAt } from './ink.js';
import './ui.js';

const $ = s => document.querySelector(s);
const KEY = 'rembrandt.love.v01', REF_KEY = 'rembrandt.love.ref';
let GLYPHS = null;

// ---------- state ----------
// The text and its bands: the letters' height H, the band's width in % of H,
// the gap between letters and the lines' spacing (the prototype's: box to
// box, below 0 they overlap), the margin Fit to canvas keeps; x, y where the
// block's centre lies, moved by Select. The trace's line width (the owner,
// 2026-10-04: "the line, as you see, is 4 mm"); the speeds and Tail are New
// Yuri's, off the panel (the owner, 2026-10-06: "simplify as far as we can").
// The prototype's for MARKS, DRAG and Result: the dry brush and its lanes'
// pitch, outside or inside first; a mark every `spacing` mm, `per` paints a
// letter; how far a lane carries a paint (run) and how a session glazes the
// one under it (est., the simulation's); the paints in stock, and the bands
// clicked to another paint (over, 'letter:band' → steps).
const PAINTS = ['#F5D21A', '#F28A1D', '#E2412A', '#D8247A', '#6B3FA0', '#2B4FB8', '#169C9C', '#3FA33C'];   // the prototype's, by eye: lemon yellow … leaf green
const PAINTS_MAX = 12;
const VIEWS = ['trace', 'marks', 'drag', 'result'];
const S = {
  text: 'LO\nVE', H: 160, band: 30, gap: -14, lead: 20, margin: 40, x: 0, y: 0, overlap: 'letters',
  width: 4, speed: 150, travel: 180, tail: 3, ink: true,                          // the brush (est.)
  brush: 12, rings: 5, order: 'out', through: false, spacing: 90, per: 2, run: 220, glaze: 0.8,   // MARKS, DRAG, Result; rings a band, Pass through
  drag: 60, next: { marks: 1, drag: 1 },                                          // DRAG's speed (the prototype's 60 mm/s); the session each key runs next
  paints: PAINTS.map(hex => ({ hex })), over: {},                                // colours, no names (the owner, 2026-10-06)
  view: 'trace', session: 0,
  boardW: 500, boardH: 700, edgeLeft: 50, edgeBottom: 0,                          // the canvas, and its edges from home, as on NOLAN
  refOpacity: 30,
};
const NUM = ['H', 'band', 'gap', 'lead', 'margin', 'x', 'y', 'width', 'speed', 'travel', 'tail', 'brush', 'rings', 'spacing', 'per', 'run', 'glaze', 'drag', 'session', 'boardW', 'boardH', 'edgeLeft', 'edgeBottom', 'refOpacity'];
const HEX = /^#[0-9a-f]{6}$/i;
let FRESH = true;   // nothing kept yet: the text fitted to the canvas once the letters load
function load() {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (!o) return;
    for (const k of NUM) if (Number.isFinite(o[k])) S[k] = o[k];
    S.tail = tailIn(S.tail);
    if (typeof o.text === 'string') S.text = o.text;
    if (OVERLAPS.includes(o.overlap)) S.overlap = o.overlap;
    if (typeof o.ink === 'boolean') S.ink = o.ink;
    if (typeof o.through === 'boolean') S.through = o.through;
    S.rings = Math.round(Math.max(RINGS_MIN, Math.min(RINGS_MAX, S.rings)));
    if (['out', 'in'].includes(o.order)) S.order = o.order;
    if (VIEWS.includes(o.view)) S.view = o.view;
    for (const k of ['marks', 'drag']) if (Number.isInteger(o.next?.[k]) && o.next[k] >= 1) S.next[k] = o.next[k];
    if (Array.isArray(o.paints) && o.paints.length) S.paints = o.paints.filter(q => HEX.test(q?.hex)).slice(0, PAINTS_MAX).map(q => ({ hex: q.hex }));
    if (!S.paints.length) S.paints = PAINTS.map(hex => ({ hex }));
    S.over = o.over && typeof o.over === 'object' ? Object.fromEntries(Object.entries(o.over).filter(([, v]) => Number.isInteger(v))) : {};
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
// MARKS and DRAG on the bands (typeplan.js): each band's marks and paints, its lanes
let painted = '';
// the lanes' pitch for Rings (typeplan.js, pitchOf): W the band's width
const pitchNow = () => pitchOf(S.band / 100 * S.H, S.brush, S.rings);
function paintNow() {
  const L = layNow(); if (!L) return null;
  const key = JSON.stringify([layKey, S.paints.length, S.per, S.spacing, S.over, S.brush, S.rings, S.order]);
  if (key !== painted || !L.segs.every(s => s.lanes)) {
    painted = key;
    marksOf(L, { paints: S.paints.length, per: S.per, spacing: S.spacing, over: S.over });
    dragOf(L, { brush: S.brush, pitch: pitchNow(), order: S.order });
  }
  return L;
}

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
  const trace = traceOf(L, LOOP_SHARE, S.width / 2), R = traceRows(trace, S.ink);   // the line's outer edge on the band's
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
let V = view(), k = 1, dpr = 1, kFit = 1;
const sx = p => (p[0] - V.y0) * k, sy = p => (V.x1 + p[1]) * k;   // canvas mm → the screen: across is Y, down the picture is −X
const toCanvas = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / k + V.y0, (e.clientY - r.top) / k - V.x1]; };
// The zoom (the owner, 2026-10-06: "I need a panel at the top that zooms the
// screen"): 100 % the whole table in the stage, as before; closer, the board
// fills the stage and shows a window of the table round ZC, its centre (board
// mm, X up, Y right) — kept inside the table. The canvas stays the stage's
// size, whatever the zoom.
const ZOOMS = [0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8];
let Z = 1, ZC = null;   // the zoom; the window's centre, null: the table's
function layout() {
  const F = view(), r = stage.getBoundingClientRect(), m = 36, sw = F.y1 - F.y0, sh = F.x1 - F.x0, strip = 46;   // the paints' strip by the Tools
  kFit = Math.max(0.2, Math.min((r.width - strip - 2 * m) / sw, (r.height - 2 * m) / sh));
  k = kFit * Z;
  dpr = window.devicePixelRatio || 1;
  const w = Math.round(Math.min(sw * k, r.width - strip)), h = Math.round(Math.min(sh * k, r.height)), ww = w / k, hh = h / k;
  const mid = { x: (F.x0 + F.x1) / 2, y: (F.y0 + F.y1) / 2 }, c = ZC || mid;
  const cy = ww >= sw - 1e-6 ? mid.y : Math.max(F.y0 + ww / 2, Math.min(F.y1 - ww / 2, c.y));
  const cx = hh >= sh - 1e-6 ? mid.x : Math.max(F.x0 + hh / 2, Math.min(F.x1 - hh / 2, c.x));
  if (ZC) ZC = { x: cx, y: cy };
  V = { y0: cy - ww / 2, y1: cy + ww / 2, x0: cx - hh / 2, x1: cx + hh / 2 };
  board.style.width = w + 'px'; board.style.height = h + 'px'; board.style.marginLeft = strip + 'px';
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
  drawView();
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
  if (S.ink) {                                                                         // INK ON: the cup's red scope, TRACE's way in the air
    if (PLAN && !busy && S.view === 'trace') {
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
// The view (the owner, 2026-10-06: "for the preliminary work I need to
// understand what the result will be"): each pass as it will look, the deck
// running them. 1 Trace; 2 Marks and 3 Drag over the trace, pale; Result.
function drawView() {
  if (S.view === 'result') { drawResult(); return; }
  drawTrace(S.view === 'trace' ? 1 : 0.35);
  if (S.view === 'marks') drawMarks();
  if (S.view === 'drag') drawLanes();
}
const shown = s => !S.session || s.session === S.session - 1;   // a session picked, or all
// TRACE as it lies on the paper. INK ON: the watercolour (band.js washOf,
// wash.js) — fresh from the cup and paler along the dip run, a blot where the
// brush lands, darker where outlines cross, as NOLAN's Imprint. INK OFF, no
// dip: the outlines as the brush runs them, the line's width in true mm.
function drawTrace(alpha = 1) {
  const P_ = plan();
  if (!P_.trace.length) return;
  g.save(); g.globalAlpha = alpha;
  if (S.ink) {
    P_.wash ??= washOf(P_.preview, [], [], S.width, areaNow());                       // pressed into the walls, as the run is
    drawWash(g, P_.wash, { sx, sy, k, width: S.width, black: false });
  } else {
    g.strokeStyle = INK_DARK; g.lineWidth = Math.max(0.6, S.width * k); g.lineCap = 'round'; g.lineJoin = 'round';
    for (const t of P_.trace) { g.beginPath(); t.pts.forEach((p, j) => j ? g.lineTo(sx(p), sy(p)) : g.moveTo(sx(p), sy(p))); g.stroke(); }
  }
  g.restore();
}
const hexOf = i => S.paints[i]?.hex || '#000000';
const line = pts => { g.beginPath(); pts.forEach((p, j) => j ? g.lineTo(sx(p), sy(p)) : g.moveTo(sx(p), sy(p))); g.stroke(); };
// MARKS: each mark in its paint's colour — the painter's map; on the canvas
// they are the cup's — the line's true width, its ticks the paint's number.
function drawMarks() {
  const L = paintNow(); if (!L) return;
  g.save(); g.lineCap = 'round'; g.lineWidth = Math.max(0.8, S.width * k);
  for (const s of L.segs) if (shown(s)) for (const m of markPaths(s, L.R, S.width)) { g.strokeStyle = hexOf(m.paint); line(m.pts); }
  g.restore();
}
// DRAG: the paths as the brush runs them, non-stop — a band each, or with
// Pass through a letter each; an orange dot where it lands.
function drawLanes() {
  const L = paintNow(); if (!L) return;
  const paths = Array.from({ length: L.sessions }, (_, ss) => ss).filter(ss => !S.session || ss === S.session - 1).flatMap(ss => dragPaths(L, ss, S.through));
  g.save(); g.lineJoin = 'round'; g.strokeStyle = 'rgba(36,34,31,.55)'; g.lineWidth = 0.8;
  for (const d of paths) line(d.pts.map(q => q.p));
  g.fillStyle = ORANGE;
  for (const d of paths) { g.beginPath(); g.arc(sx(d.pts[0].p), sy(d.pts[0].p), Math.max(1.5, 1.6 * k), 0, Math.PI * 2); g.fill(); }
  g.restore();
}
// Result: the paint along the brush's own path (loveplan.js, paintWalk; the
// LOVE prototype's way): it carries what it picked up on round into the next
// lane, and with Pass through into the next band, as DRAG runs non-stop; a
// lane its pitch wide with a groove down it, the outermost out to the band's
// edge; a session on a layer of its own, the layers multiplied as glazes.
// Kept while nothing changes, so a frame only lays the layers again.
// Play the run (the owner, 2026-10-07: "this preview shows how the paint will
// lie"): the same Result laid again in the brush's order, session after
// session, the whole run in PLAY_MS, a ring the brush's width where it is.
const rgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const PLAY_MS = 12000;   // the whole run, the prototype's
let WALK = null, SIM = null, PLAY = null;
function walkNow() {
  const L = paintNow(); if (!L?.segs.length) return null;
  const key = JSON.stringify([painted, S.paints, S.run, S.glaze, S.through]);
  if (WALK?.key !== key) {
    const o = { colours: S.paints.map(q => rgb(q.hex)), run: S.run, glaze: S.glaze, brush: S.brush, pitch: pitchNow() };
    let from = 0;
    const sessions = Array.from({ length: L.sessions }, (_, ss) => { const w = paintWalk(L, ss, S.through, o); w.from = from; from += w.length; return w; });
    WALK = { key, sessions, length: from };
    stopPlay();                                                                      // a change stops the play: the Result whole
  }
  return WALK;
}
function shade(lg, sh, pts = sh.pts) {                                               // a shade's strip and its groove
  const groove = mix(sh.rgb, [0, 0, 0], 0.25).map(Math.round).join(',');
  for (const [style, width] of [[`rgba(${sh.rgb.join(',')},${sh.a})`, sh.w], [`rgba(${groove},${(sh.a * 0.35).toFixed(3)})`, sh.w * 0.18]]) {
    lg.strokeStyle = style; lg.lineWidth = width; lg.beginPath(); pts.forEach((p, j) => j ? lg.lineTo(p[0], p[1]) : lg.moveTo(p[0], p[1])); lg.stroke();
  }
}
const inMM = lg => { lg.setTransform(k * dpr, 0, 0, k * dpr, -V.y0 * k * dpr, V.x1 * k * dpr); lg.lineCap = 'butt'; lg.lineJoin = 'round'; return lg; };   // canvas mm, as sx, sy; butt: a shade meets the next edge to edge
const layersOf = n => Array.from({ length: n }, () => { const c = document.createElement('canvas'); c.width = g.canvas.width; c.height = g.canvas.height; return inMM(c.getContext('2d')); });
function partOf(sh, mm) {                                                            // a shade as far as mm of the walk, by its own length
  const P = sh.pts, cum = [0];
  for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const want = (mm - sh.at) / ((sh.to - sh.at) || 1) * cum.at(-1), out = [P[0]];
  for (let i = 1; i < P.length; i++) {
    if (cum[i] <= want) { out.push(P[i]); continue; }
    const t = (want - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1);
    out.push([P[i - 1][0] + (P[i][0] - P[i - 1][0]) * t, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * t]); break;
  }
  return out;
}
function drawResult() {
  const Wk = walkNow(); if (!Wk) return;
  const vkey = JSON.stringify([Wk.key, k, dpr, V, g.canvas.width, g.canvas.height]);
  let lgs, part = null;
  if (PLAY && g === ctx) {
    if (PLAY.vkey !== vkey) Object.assign(PLAY, { vkey, lgs: layersOf(Wk.sessions.length), next: Wk.sessions.map(() => 0) });   // zoomed or moved: laid again up to now
    const mm = Math.min(Wk.length, (performance.now() - PLAY.t0) / PLAY_MS * Wk.length);
    Wk.sessions.forEach((w, ss) => {
      const sh = w.shades;
      let i = PLAY.next[ss];
      for (; i < sh.length && w.from + sh[i].to <= mm; i++) { shade(PLAY.lgs[ss], sh[i]); PLAY.brush = sh[i].pts.at(-1); }
      PLAY.next[ss] = i;
      if (i < sh.length && w.from + sh[i].at < mm) { part = { sh: sh[i], pts: partOf(sh[i], mm - w.from) }; PLAY.brush = part.pts.at(-1); }
    });
    lgs = PLAY.lgs;
  } else {
    if (SIM?.key !== vkey || SIM.g !== g) { const L2 = layersOf(Wk.sessions.length); Wk.sessions.forEach((w, ss) => w.shades.forEach(sh => shade(L2[ss], sh))); SIM = { key: vkey, g, lgs: L2 }; }
    lgs = SIM.lgs;
  }
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'multiply';
  for (const lg of lgs) g.drawImage(lg.canvas, 0, 0);
  g.restore();
  if (part) { g.save(); inMM(g); g.globalCompositeOperation = 'multiply'; shade(g, part.sh, part.pts); g.restore(); }
  if (PLAY?.brush && g === ctx) {                                                    // the brush, its true width
    const b = PLAY.brush;
    g.save(); g.strokeStyle = INK_DARK; g.fillStyle = INK_DARK; g.lineWidth = 1.2;
    g.beginPath(); g.arc(sx(b), sy(b), Math.max(3, S.brush / 2 * k), 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(sx(b), sy(b), 1.8, 0, Math.PI * 2); g.fill(); g.restore();
  }
}
function play() {
  if (PLAY) { stopPlay(); kick(); return; }                                          // pressed again: it stops, the Result whole
  if (!walkNow()?.length) return;
  PLAY = { t0: performance.now(), brush: null };
  if (S.view !== 'result') { S.view = 'result'; save(); showPanel(); }
  showPlay();
  const tick = () => {
    if (!PLAY) return;
    draw();
    if (performance.now() - PLAY.t0 >= PLAY_MS) { stopPlay(); kick(); return; }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function stopPlay() { if (!PLAY) return; PLAY = null; showPlay(); }
function showPlay() { const b = $('#btnPlay'); b.classList.toggle('on', !!PLAY); b.textContent = PLAY ? '■ Stop playing' : '▶ Play the run'; }
// The run as it goes: each move of the run as the plan lays it — its lines
// and arcs — red where the brush paints, light blue through the air, the one
// going on up to where the carriage is. Not the carriage's place every half
// second joined by straight lines, as before: at 150 mm/s those cut an
// outline into chords 75 mm long (the owner, 2026-10-06, TYPE-Claude/
// Screenshot 2026-10-06 trace.png: "it draws crooked somehow"); the board
// runs the arcs.
let trailOf = null, lastSt = null, RUN = null, RUN_INFO = null;
const AIR = '#4FC3F7', PAPER = '#E5203A';
function pathOf(B, i) {                                                             // a move's path, carriage mm, from where the one before it ended
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
  const B = RUN || PLAN?.blocks || [], h = hereNow(), at = st.x_mm !== null && st.y_mm !== null ? { x: st.x_mm, y: st.y_mm } : null;
  const live = ['running', 'stopping', 'pausing', 'paused'].includes(st.state);
  const X = q => (q.y - h.y - V.y0) * k, Y = q => (V.x1 - q.x + h.x) * k;
  g.save(); g.lineWidth = 1.2; g.lineJoin = 'round';
  for (let j = 0; j <= Math.min(st.block, B.length - 1); j++) {
    if (B[j]?.kind !== 'move') continue;
    let pts = pathOf(B, j);
    if (j === st.block && st.state !== 'done' && at && pts.length > 1) {          // going on: up to the carriage
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
const UNDO_KEYS = ['text', 'H', 'band', 'gap', 'lead', 'margin', 'x', 'y', 'overlap', 'width', 'speed', 'brush', 'rings', 'through', 'drag', 'order', 'spacing', 'per', 'run', 'glaze', 'paints', 'over'];
let undoStack = [], redoStack = [];
const snapshot = () => JSON.stringify(Object.fromEntries(UNDO_KEYS.map(k => [k, S[k]])));
function undoPush() { undoStack.push(snapshot()); if (undoStack.length > 200) undoStack.shift(); redoStack = []; }
function restore(js) { Object.assign(S, JSON.parse(js)); $('#text').value = S.text; palette(); settle(); }
function undo() { if (!undoStack.length) return; redoStack.push(snapshot()); restore(undoStack.pop()); }
function redo() { if (!redoStack.length) return; undoStack.push(snapshot()); restore(redoStack.pop()); }

// ---------- Select: the text moved as one block ----------
// The text is typed in its field and stands in the middle of the canvas; a
// drag on it moves it, the arrows a mm at a time, with ⇧ ten (the owner,
// 2026-10-06: the field and Select, as Claude in chat had it, plus the mouse).
// In 2 Marks and Result a click on a band steps its paint to the next one in
// stock (the prototype's), the topmost session's band where they overlap.
function blockBox() {
  const L = layNow(); if (!L?.segs.length) return null;
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  for (const s of L.segs) for (const p of s.pts) { b[0] = Math.min(b[0], p[0] - L.R); b[1] = Math.min(b[1], p[1] - L.R); b[2] = Math.max(b[2], p[0] + L.R); b[3] = Math.max(b[3], p[1] + L.R); }
  return b;
}
function onBlock(p) {
  const L = layNow(); if (!L) return false;
  const r = L.R;                                                                     // the band's edge: the trace's and the colour's outer edge
  return L.segs.some(s => s.pts.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) <= r));
}
let drag = null;
cv.addEventListener('pointerdown', e => {
  if (e.button !== 0 || !onBlock(toCanvas(e))) return;
  undoPush();
  drag = { x: e.clientX, y: e.clientY, p: toCanvas(e), moved: false };
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
  if (!d.moved) { undoStack.pop(); if (S.view === 'marks' || S.view === 'result') stepPaint(d.p); }
  else { S.x = Math.round(S.x); S.y = Math.round(S.y); }
  settle();
});
function stepPaint(p) {
  const L = paintNow(); if (!L) return;
  let hit = null;
  for (const s of L.segs) if (shown(s) && s.pts.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < L.R) && (!hit || s.session >= hit.session)) hit = s;
  if (!hit) return;
  undoPush();
  const key = `${hit.li}:${hit.si}`;
  S.over[key] = ((S.over[key] || 0) + 1) % S.paints.length;
}
function moveBlock(ddx, ddy) { if (!layNow()?.segs.length) return; undoPush(); S.x += ddx; S.y += ddy; settle(); }
function clearAll() { if (!S.text) return; undoPush(); S.text = ''; $('#text').value = ''; settle(); }
function fit() { if (!GLYPHS) return; S.H = fitHeight(GLYPHS, S, S.boardW, S.boardH, S.margin); S.x = 0; S.y = 0; }

const HINT = 'LOVE, a copy of TYPE for the new things — type the text in its field; drag it on the canvas to move it, the arrows a mm, with ⇧ ten; TRACE runs its outlines in watercolour from the cup.';
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

// The zoom's keys: − 100% +, ⌘− ⌘0 ⌘+; a pinch on the trackpad zooms where
// it is, two fingers move the board when it is closer than 100 %.
function zoomTo(z, e) {
  z = Math.max(ZOOMS[0], Math.min(ZOOMS.at(-1), z));
  if (Math.abs(z - 1) < 1e-6) { Z = 1; ZC = null; layout(); showZoom(); return; }
  const F = view(), at = e ? toCanvas(e) : null, r = cv.getBoundingClientRect();
  if (at) {                                                                          // the point under the pointer stays under it
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
  if (e.ctrlKey) { zoomTo(Z * Math.exp(-e.deltaY * 0.01), e); return; }             // a pinch
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

// ---------- the panel ----------
// OVERLAPS, INK, the view and its session; the text, its letters (the
// prototype's sliders); the line's width; Fit to canvas; the brush of DRAG,
// the marks, the simulation, the paints in stock (the prototype's); the
// canvas from home, as New Yuri's.
const LETTER_SL = [['H', 'Letter height', 'mm', 1, 20, 700], ['band', 'Band width', '%', 0.5, 10, 45], ['gap', 'Letter gap', 'mm', 1, -120, 80],
  ['lead', 'Line spacing', 'mm', 1, -120, 120], ['margin', 'Margin', 'mm', 1, 0, 150], ['width', 'Line width', 'mm', 0.5, 1, 12], ['speed', 'Line speed', 'mm/s', 5, 20, SPEED_MAX]];
const BRUSH_SL = [['brush', 'Brush width', 'mm', 0.5, 4, 30], ['rings', 'Rings', '', 1, RINGS_MIN, RINGS_MAX], ['drag', 'Drag speed', 'mm/s', 5, 10, SPEED_MAX]];
const PAINT_SL = [['spacing', 'Mark spacing', 'mm', 5, 30, 300], ['per', 'Paints per letter', '', 1, 1, 4]];
const SIM_SL = [['run', 'Paint run', 'mm', 10, 40, 600], ['glaze', 'Glaze', '', 0.05, 0.3, 1]];
const ALL_SL = [['#slLetters', LETTER_SL], ['#slBrush', BRUSH_SL], ['#slPaint', PAINT_SL], ['#slSim', SIM_SL]];
const valOf = key => key === 'band' ? `${fmt(S.band, 1)} % · ${fmt(S.band / 100 * S.H, 0)} mm` : key === 'per' ? `${S.per}` : key === 'rings' ? `${S.rings} rings · ${fmt(pitchNow(), 1)} mm apart` : key === 'glaze' ? `${S.glaze.toFixed(2)} (est.)`
  : key === 'run' ? `${S.run} mm (est.)` : key === 'speed' || key === 'drag' ? `${S[key]} mm/s` : `${Math.round(S[key] * 100) / 100} mm`;
const SL_TITLE = { width: 'The watercolour line of TRACE and MARKS on the canvas (the owner, 2026-10-04: &quot;the line is 4 mm&quot;)', speed: 'The brush along a line of TRACE and MARKS', drag: 'The dry brush along a lane of DRAG', brush: 'The dry brush of DRAG',
  rings: 'How many rings the dry brush runs in a band, edge to centre; the pitch between them follows. O, 0 and 8 the same pitch, 2 × rings − 1 across', spacing: 'A mark every so many mm along a band', per: 'How many paints along a letter', run: 'How far a lane carries a paint, in the simulation (est.)', glaze: 'How strongly a session covers the one under it, in the simulation (est.)' };
for (const [box, list] of ALL_SL) {
  $(box).innerHTML = list.map(([key, label, , step, min, max]) => `<label class="sl"${SL_TITLE[key] ? ` title="${SL_TITLE[key]}"` : ''}><span class="slh"><span>${label}</span><span class="val" data-v="${key}"></span></span><input class="slider" type="range" data-k="${key}" min="${min}" max="${max}" step="${step}"></label>`).join('');
  $(box).querySelectorAll('input').forEach(inp => {
    inp.oninput = () => { if (!busy) undoPush(); busy = true; S[inp.dataset.k] = +inp.value; showPanel(); kick(); };
    inp.onchange = () => settle();
  });
}
// The paints in stock, a strip by the Tools (the owner, 2026-10-06: "the
// colours without names, moved to the second column by the TOOLS"): a chip
// a paint, its number on it — the ticks' number — a click changes its colour,
// × on it takes it out; under it how many marks it has; + one more, ↺ every
// band back to its letter's paints.
const inkOn = hex => { const [r, gg, b] = rgb(hex); return 0.299 * r + 0.587 * gg + 0.114 * b > 150 ? '#24221F' : '#FFFFFF'; };
function palette() {
  $('#paints').innerHTML = S.paints.map((q, i) => `<div class="chip" title="Paint ${i + 1} — a click changes its colour"><span class="sw" style="background:${q.hex};color:${inkOn(q.hex)}">${i + 1}</span><input type="color" value="${q.hex}" aria-label="Colour of paint ${i + 1}"><span class="cnt" data-cnt="${i}"></span><button class="x" title="Take paint ${i + 1} out" aria-label="Remove paint ${i + 1}">×</button></div>`).join('')
    + `<button class="pbtn first" id="btnAddPaint" title="Add paint: one more at the end, up to ${PAINTS_MAX}">+</button><button class="pbtn" id="btnResetClicks" title="Reset colour clicks: every band back to its letter's paints">↺</button>`;
  $('#paints').querySelectorAll('.chip').forEach((chip, i) => {
    const c = chip.querySelector('input'), sw = chip.querySelector('.sw');
    c.oninput = () => { if (!busy) undoPush(); busy = true; S.paints[i].hex = c.value; sw.style.background = c.value; sw.style.color = inkOn(c.value); kick(); };
    c.onchange = () => settle();
    chip.querySelector('.x').onclick = () => { if (S.paints.length < 2) return; undoPush(); S.paints.splice(i, 1); S.over = {}; palette(); settle(); };
  });
  $('#btnAddPaint').disabled = S.paints.length >= PAINTS_MAX;
  $('#btnAddPaint').onclick = () => { if (S.paints.length >= PAINTS_MAX) return; undoPush(); S.paints.push({ hex: '#888888' }); palette(); settle(); };
  $('#btnResetClicks').onclick = () => { if (!Object.keys(S.over).length) return; undoPush(); S.over = {}; settle(); };
}
document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { S.view = b.dataset.view; if (S.view !== 'result') stopPlay(); settle(); });
$('#btnPlay').onclick = play;
document.querySelectorAll('[data-order]').forEach(b => b.onclick = () => { if (S.order === b.dataset.order) return; undoPush(); S.order = b.dataset.order; settle(); });
$('#fields').innerHTML = FIELDS.map(([key, label, unit, step, title, any]) => `<label title="${title}">${label} <input data-k="${key}" type="number" step="${step}"${any ? '' : ` min="${step}"`}><em>${unit}</em></label>`).join('');
$('#fields').querySelectorAll('input').forEach(inp => inp.onchange = () => {
  const v = +inp.value, any = FIELDS.find(f => f[0] === inp.dataset.k)[5];
  if (inp.value !== '' && Number.isFinite(v) && (any || v > 0)) { S[inp.dataset.k] = v; setCanvas(S); }   // the canvas: one base for every tab (canvas.js)
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
document.querySelectorAll('[data-overlap]').forEach(b => b.onclick = () => { if (S.overlap === b.dataset.overlap) return; undoPush(); S.overlap = b.dataset.overlap; S.session = 0; settle(); });
$('#planInfo').onclick = () => { $('#planRead').hidden = !$('#planRead').hidden; $('#planInfo').classList.toggle('on', !$('#planRead').hidden); };
$('#ink').onchange = e => { S.ink = e.target.checked; settle(); };
$('#through').onchange = e => { undoPush(); S.through = e.target.checked; settle(); };
$('#throughOff').onclick = () => { if (!S.through) return; undoPush(); S.through = false; settle(); };
$('#throughOn').onclick = () => { if (S.through) return; undoPush(); S.through = true; settle(); };
$('#inkOff').onclick = () => { S.ink = false; settle(); };
$('#inkOn').onclick = () => { S.ink = true; settle(); };
function showPanel() {
  for (const [box, list] of ALL_SL) for (const [key] of list) {
    const inp = $(`${box} input[data-k="${key}"]`); if (document.activeElement !== inp) inp.value = S[key];
    $(`${box} [data-v="${key}"]`).textContent = valOf(key);
  }
  document.querySelectorAll('[data-overlap]').forEach(b => b.classList.toggle('on', b.dataset.overlap === S.overlap));
  document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('on', b.dataset.view === S.view));
  document.querySelectorAll('[data-order]').forEach(b => b.classList.toggle('on', b.dataset.order === S.order));
  $('#fields').querySelectorAll('input').forEach(inp => { if (document.activeElement !== inp) inp.value = S[inp.dataset.k]; });
  if (document.activeElement !== $('#text') && !typing) $('#text').value = S.text;
  $('#ink').checked = S.ink; $('#inkOff').classList.toggle('on', !S.ink); $('#inkOn').classList.toggle('on', S.ink);
  $('#through').checked = S.through; $('#throughOff').classList.toggle('on', !S.through); $('#throughOn').classList.toggle('on', S.through);
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
  // MARKS and DRAG, session by session (the prototype's reading); DRAG's time at its speed
  const Lp = paintNow(), per = [], count = S.paints.map(() => 0);
  if (Lp?.segs.length) for (let ss = 0; ss < ses; ss++) {
    const segs = Lp.segs.filter(q => q.session === ss), marks = segs.reduce((a, q) => a + q.marks.length, 0), lanes = segs.reduce((a, q) => a + q.lanes.length, 0);
    const dp = dragPaths(Lp, ss, S.through), mm = dp.reduce((a, d) => a + d.pts.reduce((c, t, j, P) => j ? c + Math.hypot(t.p[0] - P[j - 1].p[0], t.p[1] - P[j - 1].p[1]) : 0, 0), 0);
    for (const q of segs) for (const m of q.marks) count[m.paint]++;
    per.push(`${ses > 1 ? `Session ${ss + 1}: ` : ''}MARKS <b>${marks}</b> from the cup · DRAG <b>${lanes}</b> lanes, ${S.through ? 'a letter' : 'a band'} non-stop, the brush down <b>${dp.length}</b> time${dp.length === 1 ? "" : "s"}, <b>${fmt(mm / 1000, 1)} m</b>, ≈ ${fmt(mm / S.drag / 60, 1)} min at ${S.drag} mm/s (est.)`);
  }
  if (per.length) $('#planRead').innerHTML += ' · ' + per.join(' · ');
  $('#paints').querySelectorAll('[data-cnt]').forEach(el => { const n = count[+el.dataset.cnt] || 0; el.textContent = n || ''; el.parentNode.title = `Paint ${+el.dataset.cnt + 1}: ${n} mark${n === 1 ? '' : 's'} — a click changes its colour`; });
  const Rc = L ? L.W / 2 - S.brush / 2 : 1, tight = Lp?.segs.some(q => markPaths(q, L.R, S.width).some(m => m.tick && !m.fits));
  const warn = [S.ink ? cupProblem(C) : '', P_.fault && `The plan is wrong, TRACE will not run it: ${P_.fault}.`, offCanvas(), walls(),
    L?.segs.length && Rc <= 0 && 'The brush is as wide as the band: one lane, no grooves. Widen the band or take a narrower brush.',
    L?.segs.length && pitchNow() > S.brush && `${S.rings} rings ${fmt(pitchNow(), 1)} mm apart, the brush ${S.brush} mm: white gaps between them — more rings or a wider brush.`,
    L?.segs.length && S.spacing > S.run * 0.8 && 'Marks are far apart for this paint run: the brush runs dry between them.',
    tight && 'A paint\'s ticks are longer than its mark: widen the band, a thinner line, or fewer paints.'].filter(Boolean);   // the ticks as on an abacus (typeplan.js, ticksOf)
  $('#planWarn').innerHTML = warn.map(w => `<span class="warn">${w}</span>`).join(' ');
  $('#planWarn').hidden = !warn.length;
  // the sessions under the view, in 2 Marks and 3 Drag, when there are more than one
  if (S.session > ses) S.session = 0;
  const showSes = ses > 1 && (S.view === 'marks' || S.view === 'drag');
  $('#sessions').hidden = !showSes;
  $('#sessions').innerHTML = showSes ? ['All', ...Array.from({ length: ses }, (_, i) => `Session ${i + 1}`)].map((t, i) => `<button class="tog${S.session === i ? ' on' : ''}" data-ses="${i}">${t}</button>`).join('') : '';
  $('#sessions').querySelectorAll('[data-ses]').forEach(b => b.onclick = () => { S.session = +b.dataset.ses; settle(); });
  $('#stats').textContent = !P_.outlines ? 'no text' : `${P_.outlines} outlines · ${fmt(P_.length / 1000, 1)} m of line · ≈ ${fmt(P_.seconds / 60, 1)} min (est.) · ${ses} session${ses === 1 ? '' : 's'} · ${P_.blocks.length} steps`;
  showPanel(); showDeck(); save(); layout(); lastLcd && lcd(lastLcd);
}
// letters past the canvas's edges
function offCanvas() {
  const hw = S.boardW / 2, hh = S.boardH / 2, e = S.width / 2, out = new Set();
  for (const t of PLAN?.trace || []) if (t.pts.some(p => p[0] - e < -hw || p[0] + e > hw || p[1] - e < -hh || p[1] + e > hh)) out.add(t.ch);
  return out.size ? `${[...out].join(', ')}: past the canvas's edge — the trace goes on the board under it.` : '';
}
function walls(P_ = PLAN) {
  const h = hereNow();
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
// As SAVE NEW YURI: an SVG of the canvas in mm, the trace's outlines and the
// marks in their paints in it, the whole state in its metadata — the paints
// in stock with their names and colours, the bands clicked to another (the
// owner, 2026-10-06: "so the new palette is kept with the name in the
// Library") — and a PNG preview, the Result; on the tests' shelf, its label
// TYPE — the Library opens it here.
const used = () => [...new Set((paintNow()?.segs || []).flatMap(s => s.marks.map(m => m.paint)))].sort((a, b) => a - b);
const label = () => `LOVE · ${textLabel() || 'no text'} · ${S.boardW} × ${S.boardH} mm · ${used().length} paints${S.ink ? ' · ink' : ''}`;
function svgOf() {
  const W = S.boardW, H = S.boardH, f = v => (Math.round(v * 100) / 100).toFixed(2);
  const meta = JSON.stringify({ rembrandt: '1.0.1', love: true, label: label(), settings: S }).replace(/&/g, '\\u0026').replace(/</g, '\\u003c').replace(/--/g, '- -');
  const pts = q => q.map(p => `${f(W / 2 + p[0])},${f(H / 2 + p[1])}`).join(' ');
  const lines = (plan().trace || []).map(t => `  <polyline points="${pts(t.pts)}"/>`).join('\n');
  const L = paintNow(), marks = (L?.segs || []).flatMap(q => markPaths(q, L.R, S.width).map(m => `  <polyline points="${pts(m.pts)}" stroke="${hexOf(m.paint)}" data-paint="${m.paint + 1}"${m.tick ? ' data-tick="1"' : ''}/>`)).join('\n');
  const paints = S.paints.map((q, i) => `${i + 1} ${q.hex}`).join(' · ');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}">
<!-- Rembrandt v.1.0.1 · ${esc(label())}; 1 unit = 1 mm; TRACE, each outline with its lap -->
<desc>Paints in stock: ${esc(paints)}</desc>
<metadata id="rembrandt-test">${meta}</metadata>
<rect width="${W}" height="${H}" fill="#FCFBF8" stroke="#24221F" stroke-width="0.5"/>
<g fill="none" stroke="#4A108C" stroke-opacity="0.5" stroke-width="${f(S.width)}" stroke-linejoin="round">
${lines}
</g>
<g id="marks" fill="none" stroke-width="${f(S.width)}" stroke-linecap="round">
${marks}
</g>
</svg>`;
}
function pngOf() {
  const keep = [g, k, dpr, V]; V = view();                                           // the whole table, whatever the zoom
  const sw = V.y1 - V.y0, sh = V.x1 - V.x0, kk = 800 / Math.max(sw, sh), c2 = document.createElement('canvas');
  c2.width = Math.round(sw * kk); c2.height = Math.round(sh * kk);
  g = c2.getContext('2d'); k = kk; dpr = 1;
  const view = S.view; S.view = 'result';                                            // the Library shows the painting
  try { draw(); } finally { [g, k, dpr, V] = keep; S.view = view; }
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
    if (!o?.love) { $('#saveState').textContent = 'not a LOVE save: open it on its own tab'; return; }
    undoPush();
    localStorage.setItem(KEY, JSON.stringify(o.settings)); setCanvas(o.settings); load(); Object.assign(S, canvasNow(S)); settle();   // the save's canvas becomes the base
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
let RUN_KEY = null, RUN_SES = 1, counted = null;
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
    { page: 'love', pass: 'trace', label: label(), settings: S, here: hereNow(), ...(S.ink ? { cup: cup() } : {}), estimate_s: Math.round(P_.seconds) });
};
// MARKS and DRAG, a session a press (the owner, 2026-10-06: "the sessions
// go by themselves, press by press"): the key runs its next session and,
// once that is done, goes on to the one after; one session, always it.
// MARKS from the cup as TRACE, a dip every MARKS_DIP marks; DRAG dry, never
// a dip, at its own speed.
const nextOf = key => Math.min(Math.max(1, S.next[key] || 1), paintNow()?.sessions || 1);
function showDeck() {
  const n = paintNow()?.sessions || 0;
  for (const [id, key, name, what] of [['#btnMarks', 'marks', 'Marks', 'MARKS, pass 2: a mark across each band where its paint goes, its ticks the paint\'s number, from the same cup as TRACE'],
    ['#btnDrag', 'drag', 'Drag', 'DRAG, pass 3: the dry brush through the paint, every lane non-stop, no dip']]) {
    const el = $(id), ses = nextOf(key);
    el.querySelector('span').textContent = n > 1 ? `${name} ${ses}/${n}` : name;
    el.title = what + (n > 1 ? `; next session ${ses} of ${n}` : '');
  }
}
function marksRun(ses) {
  const L = paintNow(); if (!L?.segs.length) return null;
  const R = marksRows(L, ses - 1, S.width, S.ink); if (!R.ps.length) return null;
  return { ...plotRun({ ...runOpts(R.ps.length), noDipUnder: 0 }, [{ key: 'MARKS', ps: R.ps, why: null }]), rows: R.info, marks: R.marks, count: R.count };   // noDipUnder 0: a mark's dip is its own (typeplan.js)
}
function dragRun(ses) {
  const L = paintNow(); if (!L?.segs.length) return null;
  const R = dragRows(L, ses - 1, S.through); if (!R.ps.length) return null;
  return { ...plotRun({ ...runOpts(R.ps.length), ink: false, speed: S.drag }, [{ key: 'DRAG', ps: R.ps, why: null }]), rows: R.info, lanes: R.lanes, bands: R.bands, paths: R.paths, mm: R.length };
}
async function runPass(key) {
  await loadInk(); settle();
  const n = paintNow()?.sessions || 0, ses = nextOf(key), P_ = key === 'marks' ? marksRun(ses) : dragRun(ses), of = n > 1 ? ` · session ${ses} of ${n}` : '';
  if (!P_) { $('#runState').innerHTML = '<span class="warn">Nothing to run: type the text.</span>'; return; }
  if (key === 'marks' && S.ink && cupProblem(cup())) { $('#runState').innerHTML = `<span class="warn">Ink ON: ${cupProblem(cup())}</span>`; return; }
  if (walls(P_)) { $('#runState').innerHTML = `<span class="warn">${walls(P_)}</span>`; return; }
  if (P_.fault) { $('#runState').innerHTML = `<span class="warn">Not run: the plan is wrong — ${P_.fault}.</span>`; return; }
  const min = fmt(P_.seconds / 60, 0), what = key === 'marks'
    ? `${P_.marks} marks and their ticks, ${P_.rows.length} strokes${S.ink ? `, ${P_.dips} dips in the cup, one every ${MARKS_DIP} marks` : ', no dip'}, ≈ ${min} min (est.).\n\nThen squeeze the paints onto the marks — ${Object.entries(P_.count).sort((a, b) => a[0] - b[0]).map(([i, c]) => `paint ${+i + 1} × ${c}`).join(', ')} — and press DRAG.`
    : `${P_.lanes} lanes in ${P_.bands} bands, ${S.through ? 'Pass through: each letter non-stop, its bands one after another' : 'each band non-stop'} — the brush lands ${P_.paths} times — ${fmt(P_.mm / 1000, 1)} m with the dry brush, no dip, at ${S.drag} mm/s, ≈ ${min} min (est.). Are the paints on the marks?`;
  if (!confirm(`${key.toUpperCase()} ${textLabel()}${of}: ${what}`)) return;
  S.view = key; S.session = n > 1 ? ses : 0; RUN_SES = ses; settle();                // the board shows the pass running
  await start(key, P_.blocks, { seconds: P_.seconds, rows: P_.rows },
    { page: 'love', pass: key, session: ses, sessions: n, label: label(), settings: S, here: hereNow(), ...(key === 'marks' && S.ink ? { cup: cup() } : {}), estimate_s: Math.round(P_.seconds) });
}
$('#btnMarks').onclick = () => runPass('marks');
$('#btnDrag').onclick = () => runPass('drag');
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
    { page: 'love', label: 'LOVE · TEST · the corners', here, dots: T.dots.map(d => ({ name: d.name, x: +(here.x + d.at.x).toFixed(1), y: +(here.y + d.at.y).toFixed(1) })), cup: cup(), estimate_s: Math.round(T.seconds) });
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
  if (live && st.started !== trailOf) trailOf = st.started;
  const moved = !lastSt || !st || lastSt.block !== st.block || lastSt.state !== st.state || lastSt.x_mm !== st.x_mm || lastSt.y_mm !== st.y_mm;
  lastSt = st;
  if (st && trailOf && st.started === trailOf && moved) kick();
  // MARKS or DRAG run to its end on this page: the key goes on to the next session
  if (st?.state === 'done' && trailOf && st.started === trailOf && st.started !== counted && (RUN_KEY === 'marks' || RUN_KEY === 'drag')) {
    counted = st.started;
    const n = paintNow()?.sessions || 1;
    S.next[RUN_KEY] = RUN_SES % n + 1; save(); showDeck();
  }
  $('#runState').innerHTML = !st ? 'no server: start rembrandt.py' : st.message ? `<span class="${st.state === 'error' ? 'warn' : ''}">${st.message}</span>` : '';
}

// ---------- start ----------
load(); Object.assign(S, canvasNow(S));                                          // the canvas from the base, every tab's (canvas.js)
onCanvas(c => { Object.assign(S, c); settle(); });                               // changed in another window
$('#text').value = S.text;
$('#hint').textContent = HINT;
palette();
syncRef(); loadRef();
lampSwitch($('#lamp'));
showZoom();
addEventListener('rembrandt-night', () => kick());
setInterval(watch, 500);
new ResizeObserver(layout).observe(stage);
settle(); watch();
fetch('glyphs.json', { cache: 'no-store' }).then(r => r.json()).then(o => { GLYPHS = o.glyphs; if (FRESH) fit(); settle(); }).catch(() => { $('#hint').textContent = 'glyphs.json did not load: start rembrandt.py'; });
loadInk().then(settle);
addEventListener('focus', () => loadInk().then(settle));
const opening = new URLSearchParams(location.search).get('open');
if (opening) openFromLibrary(opening);
