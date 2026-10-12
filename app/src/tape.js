// Rembrandt · TAPE — a cassette in the centre, its tape wound round it, the
// first tab since 2026-10-12 (the owner, TAPE-Claude/: a hand-painted
// cassette in the centre, the tape painted by the machine with the brush,
// after Werner Bronkhorst; "only to restore Soumkine, on Etsy"). Its plan in
// tapeplan.js, chat-Claude's prototype v0.3 ported.
//
// On the table: TRACE, the cassette's outline — its shell — and the tape's
// guide with the brush, with INK ON in watercolour from the cup (the pencil
// tried the same day and dropped: "too long, that will not do … I will cut a
// stencil out of cardboard and draw round it in 30 seconds"); DRAG, the
// tape in one go, the snake or through the air ("two Drag — the snake, and
// there along the canvas, back through the air"), no stop for paint ("press
// it 27 times? What for?"), no segments ("this option must go, we have
// overcomplicated something"); the cassette drawn with a stencil and
// coloured by hand last. No MARKS ("Marks is not needed, we do not put it in
// the software").
//
// CCD's page, its own module: the board, the canvas from home — the cassette
// always in its centre, the size typed by hand ("just leave 200 × 200 by
// hand, as on ALU and CCD; I am fine changing the format") — PROGRESS, TEST
// and PAUSE, the LCD, the zoom, the Library; the shared modules imported, so
// a fix of the run reaches every tab.
//
// The plan's mm from the canvas's centre, x right, y down, as the board's:
// the board, as on Test: mm from Here — the canvas's centre — X up, Y right.

import { fmt } from './util.js';
import { reach, homeCorner } from './machine.js';
import { plotRun, DEFAULTS as RUN, ELBOW_HOVER, SPEED_MAX, sweepOf } from './strokes.js';
import { cornerDots, TEST_MARGIN, NO_DIP, DIP_RUN, LOOP_SHARE } from './band.js';
import { planOf, dragRows, traceRows, shellOf, cassetteLines, piecesOf, pathD, mixWalk, spokeLine, spokeHits, spokePoint, nearestSample, blockOf, dragLanes, newPalette, newSpokes, recolourSpokes, densityOf, RUN_MM, TAPE_PAINTS, PAINT, SPOKE_LANES, SPOKE_SIZES, DENSITY, DEFAULTS, DEFAULT_CASS, REAL, MODES, SEAMS, DIRS, BRUSH_TYPES, AIR_SPEED, LIFT_S } from './tapeplan.js';
import { CANVAS_FIELDS as FIELDS, canvasNow, setCanvas, onCanvas } from './canvas.js';
import { segments, sticks } from './lcd.js';
import { lampSwitch, themeColor } from './lamp.js';
import { cupOf, cupProblem, drawCup, dipAt } from './ink.js';
import './ui.js';

const $ = s => document.querySelector(s);
const TAB = 'tape', TAB_NAME = 'TAPE', KEY = 'rembrandt.tape.v01';
const fin = v => Number.isFinite(v), hex = v => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);

// ---------- state ----------
// The prototype's settings, the owner's; INK, the view, TRACE's speed (the
// prototype's 40 mm/s, est.), the flights and the tail as CCD's; the Result's
// colours; a loaded cassette's SVG (null: the built-in one).
const S = {
  ...DEFAULTS, ink: false, view: 'result', traceSpeed: 40, travel: 180, tail: 3,
  ground: '#efe9de', tape: '#3a2a1f', cassSvg: null, cassName: '',
  spokes: [], paint: 'black', tool: '',                                            // the paint's map: spokes across the lanes; the chosen paint; M, the spoke tool
  palette: null, seed: 0,                                                          // New colours' last palette and seed (tapeplan.js, newPalette)
  density: DENSITY, spokeLanes: SPOKE_LANES,                                       // the paint in a spoke, 0 … 100 %; a spoke's lanes, 1, 2 or 6
  boardW: 200, boardH: 200, edgeLeft: 50, edgeBottom: 0,
};
const NUM = ['density', 'brush', 'speed', 'gap', 'corners', 'cassScale', 'clear', 'step', 'strokes', 'overrun', 'brushAngle', 'traceSpeed', 'boardW', 'boardH', 'edgeLeft', 'edgeBottom'];
const ONE_OF = { mode: MODES, seam: SEAMS, dir: DIRS, brushType: BRUSH_TYPES, view: ['trace', 'drag', 'result'] };
const BOOL = ['ink', 'traceCass', 'traceTape'];
function take(o) {
  if (!o) return;
  for (const k of NUM) if (fin(o[k])) S[k] = o[k];
  for (const [k, of] of Object.entries(ONE_OF)) if (of.includes(o[k])) S[k] = o[k];
  for (const k of BOOL) if (typeof o[k] === 'boolean') S[k] = o[k];
  for (const k of ['ground', 'tape']) if (hex(o[k])) S[k] = o[k];
  S.cassSvg = typeof o.cassSvg === 'string' ? o.cassSvg : null; S.cassName = typeof o.cassName === 'string' ? o.cassName : '';
  S.spokes = Array.isArray(o.spokes) ? o.spokes.filter(q => q && fin(q.u) && fin(q.k0) && fin(q.k1) && PAINT[q.paint]).map(q => ({ u: q.u, k0: q.k0, k1: q.k1, paint: q.paint })) : [];
  if (PAINT[o.paint]) S.paint = o.paint;
  S.tool = o.tool === 'spoke' ? 'spoke' : '';
  const okIds = a => Array.isArray(a) && a.every(id => PAINT[id]);
  S.palette = o.palette && typeof o.palette.name === 'string' && okIds(o.palette.core) && okIds(o.palette.accent) ? { name: o.palette.name, core: o.palette.core, accent: o.palette.accent } : null;
  S.seed = fin(o.seed) ? o.seed : 0;
  if (SPOKE_SIZES.includes(o.spokeLanes)) S.spokeLanes = o.spokeLanes;
}
function load() { try { take(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch { } }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { } };

// ---------- the cassette: its SVG's outlines ----------
// The built-in one cassette_trace.svg (the owner's, a real shell 100.4 ×
// 63.8 mm, Inkscape layers), or one loaded for this tape. Every outline as
// path data and the matrix of its transforms; its size its width in mm or
// cm, else a real cassette's.
let CASS = null, BUILTIN = '';
function elToD(el) {
  const g = n => parseFloat(el.getAttribute(n)) || 0;
  switch (el.nodeName.toLowerCase()) {
    case 'path': return el.getAttribute('d');
    case 'rect': { const x = g('x'), y = g('y'), w = g('width'), h = g('height'), rx = Math.min(g('rx') || g('ry'), w / 2, h / 2);
      if (!rx) return `M${x},${y}H${x + w}V${y + h}H${x}Z`;
      return `M${x + rx},${y}H${x + w - rx}A${rx},${rx} 0 0 1 ${x + w},${y + rx}V${y + h - rx}A${rx},${rx} 0 0 1 ${x + w - rx},${y + h}H${x + rx}A${rx},${rx} 0 0 1 ${x},${y + h - rx}V${y + rx}A${rx},${rx} 0 0 1 ${x + rx},${y}Z`; }
    case 'circle': { const cx = g('cx'), cy = g('cy'), r = g('r'); return `M${cx - r},${cy}A${r},${r} 0 1 0 ${cx + r},${cy}A${r},${r} 0 1 0 ${cx - r},${cy}Z`; }
    case 'ellipse': { const cx = g('cx'), cy = g('cy'), rx = g('rx'), ry = g('ry'); return `M${cx - rx},${cy}A${rx},${ry} 0 1 0 ${cx + rx},${cy}A${rx},${ry} 0 1 0 ${cx - rx},${cy}Z`; }
    case 'line': return `M${g('x1')},${g('y1')}L${g('x2')},${g('y2')}`;
    case 'polyline': case 'polygon': { const p = (el.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number); if (p.length < 4) return null;
      let d = `M${p[0]},${p[1]}`; for (let i = 2; i + 1 < p.length; i += 2) d += `L${p[i]},${p[i + 1]}`; return el.nodeName.toLowerCase() === 'polygon' ? d + 'Z' : d; }
  }
  return null;
}
const mul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
function transformOf(t) {
  let M = [1, 0, 0, 1, 0, 0];
  for (const [, fn, args] of t.matchAll(/(\w+)\s*\(([^)]*)\)/g)) {
    const a = args.trim().split(/[\s,]+/).map(Number), r = (a[0] || 0) * Math.PI / 180;
    const T = { matrix: a.slice(0, 6), translate: [1, 0, 0, 1, a[0] || 0, a[1] || 0], scale: [a[0], 0, 0, a[1] ?? a[0], 0, 0],
      rotate: a.length > 2 ? mul(mul([1, 0, 0, 1, a[1], a[2]], [Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0]), [1, 0, 0, 1, -a[1], -a[2]]) : [Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0],
      skewX: [1, 0, Math.tan(r), 1, 0, 0], skewY: [1, Math.tan(r), 0, 1, 0, 0] }[fn];
    if (T && T.every(fin)) M = mul(M, T);
  }
  return M;
}
function parseCassette(text, name) {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml'), root = doc.documentElement;
  if (!root || root.nodeName.toLowerCase() !== 'svg' || doc.querySelector('parsererror')) return null;
  let vx = 0, vy = 0, vw, vh;
  const vb = (root.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
  if (vb.length === 4 && vb[2] > 0 && vb[3] > 0) [vx, vy, vw, vh] = vb;
  else { vw = parseFloat(root.getAttribute('width')) || REAL.cassW; vh = parseFloat(root.getAttribute('height')) || REAL.cassH; }
  const m = (root.getAttribute('width') || '').trim().match(/^([\d.]+)\s*(mm|cm)$/), mmW = m ? parseFloat(m[1]) * (m[2] === 'cm' ? 10 : 1) : null;
  const items = [];
  root.querySelectorAll('path,rect,circle,ellipse,line,polyline,polygon').forEach(el => {
    if (el.closest('defs,clipPath,mask,symbol,pattern,marker')) return;
    const d = elToD(el); if (!d) return;
    let M = [1, 0, 0, 1, 0, 0];
    for (let n = el; n && n !== root; n = n.parentNode) { const t = n.getAttribute?.('transform'); if (t) M = mul(transformOf(t), M); }
    items.push({ d, m: M, id: el.getAttribute('id') || '' });
  });
  return items.length ? { text, name, vx, vy, vw, vh, mmW, items } : null;
}
function useCassette() {
  CASS = (S.cassSvg && parseCassette(S.cassSvg, S.cassName || 'loaded SVG')) || (BUILTIN && parseCassette(BUILTIN, 'cassette_trace.svg')) || null;
  plKey = ''; settle();
}
async function loadBuiltin() {
  try { const r = await fetch('cassette_trace.svg', { cache: 'no-store' }); BUILTIN = r.ok ? await r.text() : ''; } catch { BUILTIN = ''; }
}

// ---------- the plan (tapeplan.js) ----------
const PLAN_KEYS = ['brush', 'speed', 'gap', 'corners', 'seam', 'dir', 'mode', 'cassScale', 'clear', 'step', 'strokes', 'overrun'];
const po = () => ({ ...Object.fromEntries(PLAN_KEYS.map(q => [q, S[q]])), segLen: Infinity, cw: S.boardW, ch: S.boardH, cass: CASS ? { vx: CASS.vx, vy: CASS.vy, vw: CASS.vw, vh: CASS.vh, mmW: CASS.mmW } : DEFAULT_CASS });
let PL = null, plKey = '', LINES = [];
function planNow() {
  const o = po(), key = JSON.stringify([o, CASS?.name, CASS?.text.length]);
  if (PL && key === plKey) return PL;
  plKey = key; PL = planOf(o); LINES = CASS ? cassetteLines(CASS.items, PL.cb, CASS) : []; RESULT = null;
  return PL;
}

// ---------- the cup, for TEST and TRACE with INK ON; the canvas from home ----------
let INK = {};
const cup = () => cupOf(INK);
async function loadInk() {
  try { const r = await fetch('/ink', { cache: 'no-store' }); INK = r.ok ? await r.json() : {}; } catch { INK = {}; }
}
const hereNow = () => { const R = reach(); return { x: R.x.min + S.edgeBottom + S.boardH / 2, y: R.y.min + S.edgeLeft + S.boardW / 2 }; };
const dipCup = () => { const c = cup(), d = dipAt(c); return d ? { ...c, x: d.x, y: d.y } : c; };

// ---------- the runs: TRACE, DRAG the snake or through the air ----------
// DRAG: the tape in one go, no stop; PAUSE where the tape passes the seam
// or at a stroke's end, never on a lap (pauseAtEnds).
// TRACE: the brush, with INK ON from the cup, as ALU's TRACE.
const EMPTY = { blocks: [], rows: [], seconds: 0, length: 0, carriage: null, air: [], dips: 0, mm: 0, landings: 0, lines: 0, fault: '' };
const runOpts = rows => ({ ...RUN, speed: S.speed, travel: S.travel, tail: S.tail, lift: false, ink: false, snake: true, pause: false, rows, here: hereNow(), cup: dipCup(), noDipUnder: NO_DIP, hover: ELBOW_HOVER });
const RUNS = {}, MODE_NAME = { snake: 'the snake', air: 'through the air' };
let TRACE = null, busy = false;
function dragRun(mode = S.mode) {
  const G = planNow(), key = JSON.stringify([plKey, S.speed, S.travel, S.tail, hereNow()]);
  if (RUNS[mode]?.key === key) return RUNS[mode];
  const D = dragRows(G, mode);
  RUNS[mode] = { key, ...(D.passes.length ? { ...plotRun({ ...runOpts(D.info.length), pauseAtEnds: true }, D.passes), rows: D.info, mm: D.length, landings: D.runs } : EMPTY) };
  return RUNS[mode];
}
function traceRun() {
  const G = planNow(), key = JSON.stringify([plKey, S.traceSpeed, S.travel, S.tail, S.ink, hereNow(), S.ink ? dipCup() : null, S.traceCass, S.traceTape]);
  if (TRACE?.key === key) return TRACE;
  const R = traceRows(G, { traceCass: S.traceCass, traceTape: S.traceTape, ink: S.ink });
  TRACE = { key, ...(R.ps.length ? { ...plotRun({ ...runOpts(R.ps.length), speed: S.traceSpeed, ink: S.ink }, [{ key: 'TRACE', ps: R.ps, why: null }]), rows: R.info, lines: R.ps.length } : EMPTY) };
  return TRACE;
}

// ---------- the board (CCD's) ----------
// The canvas and home, not the whole image area: a 20 × 20 canvas fills the
// stage; the walls drawn where they come into it.
const cv = $('#cv'), ctx = cv.getContext('2d'), stage = $('#stage'), board = $('#board');
let g = ctx;   // the context drawn on: the board's, or a PNG's for the Library
const PAD = 30;
function view() {
  const hw = S.boardW / 2, hh = S.boardH / 2, v = { x0: -hh - PAD, x1: hh + PAD, y0: -hw - PAD, y1: hw + PAD };
  const h = hereNow(), hc = homeCorner(), q = { x: hc.x - h.x, y: hc.y - h.y };    // home: the canvas lies from it
  v.x0 = Math.min(v.x0, q.x - 24); v.x1 = Math.max(v.x1, q.x + 24); v.y0 = Math.min(v.y0, q.y - 24); v.y1 = Math.max(v.y1, q.y + 48);
  if (S.ink && S.view === 'trace') {                                                 // the cup on the table too
    const c = cup(), e = (c.diameter || 50) / 2 * 1.7 + 6;
    if (fin(c.x)) { const at = { x: c.x - h.x, y: c.y - h.y }; v.x0 = Math.min(v.x0, at.x - e); v.x1 = Math.max(v.x1, at.x + e); v.y0 = Math.min(v.y0, at.y - e); v.y1 = Math.max(v.y1, at.y + e); }
  }
  return v;
}
function areaNow() {
  const h = hereNow(), R = reach();
  return { x0: R.x.min - h.x, x1: R.x.max - h.x, y0: R.y.min - h.y, y1: R.y.max - h.y, R };
}
let V = view(), k = 1, dpr = 1, kFit = 1;
const sx = p => (p[0] - V.y0) * k, sy = p => (V.x1 + p[1]) * k;                   // canvas mm from its centre → the screen: across is Y, down the picture is −X
const toCanvas = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / k + V.y0, (e.clientY - r.top) / k - V.x1]; };
// a context set to draw in canvas mm from its centre, y down: its lines' widths in mm too
const inMm = c => { c.setTransform(k * dpr, 0, 0, k * dpr, -V.y0 * k * dpr, V.x1 * k * dpr); return c; };
const clipCanvas = c => { c.beginPath(); c.rect(-S.boardW / 2, -S.boardH / 2, S.boardW, S.boardH); c.clip(); };
const ZOOMS = [0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8];
let Z = 1, ZC = null;   // the zoom; the window's centre, null: the canvas's
function layout() {
  const F = view(), r = stage.getBoundingClientRect(), m = 36, sw = F.y1 - F.y0, sh = F.x1 - F.x0, strip = 78;   // the paints' strip by the Tools, two columns of 12 (style.css)
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
const ORANGE = '#EB7A25', GROUND = '#FBFAF7', DRY = '#7D7A74', WATER = '#6F8FB8', RUST = '#C0603D';
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
  const result = S.view === 'result' || PLAY;
  g.fillStyle = result ? S.ground : GROUND; g.fillRect(sx([-hw]), sy([0, -hh]), S.boardW * k, S.boardH * k);   // the canvas
  if (PLAY) drawPlay();
  else if (S.view === 'result') drawResult();
  else if (S.view === 'drag') drawDrag();
  else drawTrace();
  if (g === ctx && !PLAY && (S.view !== 'result' || S.tool === 'spoke')) drawSpokes();   // the paint's map; over the Result while M is on
  g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.beginPath(); g.rect(sx([-hw]), sy([0, -hh]), S.boardW * k, S.boardH * k); g.clip();   // past the walls: hatched
  g.beginPath(); g.rect(0, 0, W, H); areaRect(); g.clip('evenodd');
  g.strokeStyle = 'rgba(179,71,12,.45)'; g.lineWidth = 1;
  for (let d = -H; d < W; d += 7) { g.beginPath(); g.moveTo(d, H); g.lineTo(d + H, 0); g.stroke(); }
  g.restore();
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.strokeStyle = 'rgba(36,34,31,.8)'; g.lineWidth = 1; g.strokeRect(sx([-hw]) + .5, sy([0, -hh]) + .5, S.boardW * k - 1, S.boardH * k - 1);
  g.save(); g.strokeStyle = ORANGE; g.lineWidth = 1.2; g.setLineDash([6, 4]); g.beginPath(); areaRect(); g.stroke(); g.restore();   // the walls
  g.font = font(10); g.fillStyle = '#B3470C'; g.textAlign = 'left';
  g.fillText(`canvas ${S.boardW} × ${S.boardH} mm`, sx([-hw]), sy([0, -hh]) - 6);
  const h = hereNow(), msx = q => (q.y - V.y0) * k, msy = q => (V.x1 - q.x) * k, ink = themeColor('--ink', '#24221F');
  g.save(); g.strokeStyle = 'rgba(36,34,31,.55)'; g.lineWidth = 1;                     // TEST's dots: a small cross each, 20 mm in from the corners
  for (const d of cornerDots(S.boardW, S.boardH).dots) { const X = msx(d.at), Y = msy(d.at); g.beginPath(); g.moveTo(X - 5, Y); g.lineTo(X + 5, Y); g.moveTo(X, Y - 5); g.lineTo(X, Y + 5); g.stroke(); }
  g.restore();
  const hc = homeCorner(), home = { x: hc.x - h.x, y: hc.y - h.y }, hX = msx(home), hY = msy(home);   // home: the canvas lies from it
  g.strokeStyle = ink; g.lineWidth = 1.2; g.strokeRect(hX - 4, hY - 4, 8, 8); g.fillStyle = ink; g.textAlign = 'left'; g.fillText('home', hX + 8, hY - 6);
  if (S.ink && S.view === 'trace' && !PLAY) {                                           // INK ON: the cup's red scope
    const c = dipCup();
    if (fin(c.x) && fin(c.y)) {
      const at = { x: c.x - h.x, y: c.y - h.y }, r = (cup().diameter || 50) / 2 * k;
      drawCup(g, msx(at), msy(at), r); g.fillStyle = ink; g.textAlign = 'left'; g.fillText(`cup ⌀${cup().diameter || 50}`, msx(at) + r * 1.7 + 4, msy(at) + 3);
    }
  }
  drawTrail();
}

// ---------- the views ----------
// The cassette's lines, as its SVG draws them (cassetteLines)
function cassettePath(c) { c.beginPath(); for (const l of LINES) { l.pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); if (l.closed) c.closePath(); } }
function bodyPath(c, cb) {                                                            // the shell: its body outline, else its box
  const body = LINES.find(l => /^body/i.test(l.id) && l.closed);
  c.beginPath();
  if (body) body.pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); else c.rect(-cb.w / 2, -cb.h / 2, cb.w, cb.h);
}
const poly = (c, P, i0, i1) => { c.beginPath(); c.moveTo(P[i0].x, P[i0].y); for (let i = i0 + 1; i <= i1; i++) c.lineTo(P[i].x, P[i].y); };
// TRACE: the cassette's outline and the guide, the watercolour's with INK ON;
// the rest of the cassette faint — it is drawn by hand, with a stencil
function drawTrace() {
  const G = planNow();
  g.save(); inMm(g); clipCanvas(g); g.lineJoin = 'round'; g.lineCap = 'round';
  g.strokeStyle = 'rgba(120,115,108,.35)'; g.lineWidth = 0.25; cassettePath(g); g.stroke();
  g.strokeStyle = S.ink ? WATER : DRY; g.lineWidth = S.ink ? 0.8 : 0.5;
  if (S.traceTape) for (const r of G.runs) { poly(g, G.pts, r.c0, r.c1); g.stroke(); }
  if (S.traceCass && G.fits) { const cb = G.cb; g.beginPath(); g.roundRect(-cb.w / 2, -cb.h / 2, cb.w, cb.h, cb.r); g.stroke(); }
  g.restore();
  if (!S.traceTape && !S.traceCass) { g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = themeColor('--mute', '#7D776D'); g.font = font(12); g.textAlign = 'center'; g.fillText('TRACE is off: neither the outline nor the guide', sx([0]), sy([0, 0])); g.restore(); }
}
// DRAG: the tape's centre line, a colour a run in turn; dashed where the brush flies; a run numbered at its start
function drawDrag() {
  const G = planNow(), P = G.pts;
  g.save(); inMm(g);
  g.strokeStyle = 'rgba(120,115,108,.6)'; g.lineWidth = 0.3; cassettePath(g); g.stroke();
  g.lineJoin = 'round'; g.lineCap = 'round'; g.lineWidth = Math.max(0.7, S.brush * 0.2);
  G.segs.forEach((sg, i) => { g.strokeStyle = i % 2 ? RUST : S.tape; poly(g, P, sg.i0, sg.i1); g.stroke(); });
  g.setLineDash([2.5, 2]); g.lineWidth = Math.max(0.35, 1 / k);
  for (const m of G.moves) if (m.type === 'air') { g.strokeStyle = m.ret ? 'rgba(80,80,80,.22)' : 'rgba(80,80,80,.6)'; g.beginPath(); g.moveTo(m.pts[0].x, m.pts[0].y); g.lineTo(m.pts[1].x, m.pts[1].y); g.stroke(); }
  g.restore();
  g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const many = G.segs.length > 90 || k < 2.2;                                         // the numbers, as there is room
  G.segs.forEach((sg, i) => {
    const p = P[sg.i0], X = sx([p.x]), Y = sy([0, p.y]), r = many ? 2.5 : 7;
    g.beginPath(); g.arc(X, Y, r, 0, Math.PI * 2); g.fillStyle = many ? ORANGE : '#fff'; g.fill();
    if (!many) { g.lineWidth = 1; g.strokeStyle = '#333'; g.stroke(); g.fillStyle = '#222'; g.font = font(8, 600); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(i + 1), X, Y + 0.5); }
  });
  g.restore();
}
// Result: the prototype's painted look, drawn once into a bitmap of its own
// and laid on the board — the tape's grooves and ridges, the dry brush; the
// lanes past the canvas a faint ghost; the cassette filled light, its lines in ink
let RESULT = null;
const hex2rgb = h => [0, 2, 4].map(i => parseInt(h.slice(1).substr(i, 2), 16));
const rgbs = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mix = (c, d, t) => c.map((v, i) => v + (d[i] - v) * t);
const shade = (c, l) => l >= 0 ? mix(c, [255, 255, 255], l) : mix(c, [0, 0, 0], -l);
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function resultBitmap() {
  const G = planNow(), key = JSON.stringify([plKey, S.ground, S.tape, S.brushType, S.brushAngle, S.spokes, S.mode, S.density]);
  if (RESULT?.key === key) return RESULT;
  let ex = S.boardW / 2, ey = S.boardH / 2;
  for (const p of G.pts) { ex = Math.max(ex, Math.abs(p.x) + S.brush); ey = Math.max(ey, Math.abs(p.y) + S.brush); }
  ex = Math.min(ex, S.boardW / 2 + PAD + 40); ey = Math.min(ey, S.boardH / 2 + PAD + 40);   // the ghost past the board's edge is never seen
  const ppm = Math.min(8, 4096 / (2 * Math.max(ex, ey))), c2 = document.createElement('canvas');
  c2.width = Math.ceil(2 * ex * ppm); c2.height = Math.ceil(2 * ey * ppm);
  const c = c2.getContext('2d'), w = S.brush, P = G.pts;
  c.setTransform(ppm, 0, 0, ppm, ex * ppm, ey * ppm);
  if (P.length > 1) {                                                                 // the ghost of the lanes past the canvas
    c.save(); c.globalAlpha = 0.13; c.strokeStyle = S.tape; c.lineWidth = w; c.lineJoin = 'round'; c.lineCap = 'round';
    c.beginPath(); P.forEach((p, i) => (i && !p.brk) ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.stroke(); c.restore();
  }
  c.fillStyle = S.ground; c.fillRect(-S.boardW / 2, -S.boardH / 2, S.boardW, S.boardH);
  c.save(); clipCanvas(c); if (S.spokes.length) paintMixed(c, G, mixNow(), 0, G.pts.length - 1); else paintTape(c, G);
  c.fillStyle = rgbs(mix(hex2rgb(S.ground), [255, 255, 255], 0.55)); bodyPath(c, G.cb); c.fill();
  c.strokeStyle = '#2B2724'; c.lineWidth = 0.35; c.lineJoin = 'round'; c.lineCap = 'round'; cassettePath(c); c.stroke();
  c.restore();
  RESULT = { key, c: c2, ex, ey };
  return RESULT;
}
function paintTape(c, G) {
  const w = S.brush, base = hex2rgb(S.tape), gr = hex2rgb(S.ground), R = rng(11), P = G.pts;
  const K = Math.max(6, Math.min(26, Math.round(w * 1.7))), gro = [];
  for (let q = 0; q < K; q++) { const hi = R() < 0.22; gro.push({ f: (q + 0.5) / K - 0.5 + (R() - 0.5) * 0.4 / K, l: hi ? 0.22 + R() * 0.35 : (R() - 0.5) * 0.3, a: 0.35 + R() * 0.45, lw: 0.35 + R() * 0.6 }); }
  const flat = S.brushType === 'flat', al = S.brushAngle * Math.PI / 180;
  const eW = p => flat ? Math.max(1.6, w * Math.abs(Math.sin(Math.atan2(p.ty, p.tx) - al))) : w;   // a flat brush, no servo turning it
  const dry = s => S.mode === 'snake' ? 0.08 + 0.025 * S.strokes + 0.07 * Math.abs(2 * s - 1) : 0.05 + 0.02 * S.strokes + 0.5 * s * s;
  const offPoly = (i0, i1, fn) => { c.beginPath(); for (let i = i0; i <= i1; i++) { const p = P[i], o = fn(p), x = p.x - p.ty * o, y = p.y + p.tx * o; i === i0 ? c.moveTo(x, y) : c.lineTo(x, y); } };
  c.lineJoin = 'round'; c.lineCap = 'round'; c.globalAlpha = 1; c.fillStyle = c.strokeStyle = rgbs(base);
  for (const sg of G.segs) {                                                          // the paint of every segment first: no round cap on a neighbour's texture
    if (!flat) { c.lineWidth = w; poly(c, P, sg.i0, sg.i1); c.stroke(); continue; }
    c.beginPath();
    for (let i = sg.i0; i <= sg.i1; i++) { const p = P[i], e = eW(p) / 2, x = p.x - p.ty * e, y = p.y + p.tx * e; i === sg.i0 ? c.moveTo(x, y) : c.lineTo(x, y); }
    for (let i = sg.i1; i >= sg.i0; i--) { const p = P[i], e = eW(p) / 2; c.lineTo(p.x + p.ty * e, p.y - p.tx * e); }
    c.closePath(); c.fill(); c.lineWidth = 1.6; poly(c, P, sg.i0, sg.i1); c.stroke();
  }
  c.lineCap = 'butt';
  for (const sg of G.segs) {
    const i0 = sg.i0, i1 = sg.i1;
    for (const q of gro) { c.strokeStyle = rgbs(shade(base, q.l)); c.globalAlpha = q.a; c.lineWidth = w / K * q.lw; offPoly(i0, i1, p => q.f * eW(p)); c.stroke(); }   // the bristles' grooves
    c.lineWidth = Math.max(0.15, w * 0.06);                                           // the ridges along both edges: the light catches one, the other in shadow
    c.globalAlpha = 0.45; c.strokeStyle = rgbs(shade(base, 0.5)); offPoly(i0, i1, p => -0.46 * eW(p)); c.stroke();
    c.globalAlpha = 0.5; c.strokeStyle = rgbs(shade(base, -0.65)); offPoly(i0, i1, p => 0.47 * eW(p)); c.stroke();
    const n = i1 - i0, C = 4; c.strokeStyle = rgbs(gr);                               // the dry brush: one way runs out of paint towards the end, the snake stays even
    for (let q = 0; q < C; q++) {
      const a = i0 + Math.floor(q * n / C), b = Math.min(i1, i0 + Math.floor((q + 1) * n / C) + 1); if (b <= a) continue;
      const d = dry((q + 0.5) / C);
      for (let j = 1; j < K; j += 3) { const gq = gro[j]; c.globalAlpha = Math.min(0.9, d * (0.55 + 0.5 * gq.a)); c.lineWidth = w / K * 0.45; offPoly(a, b, p => (gq.f + 0.5 / K) * eW(p)); c.stroke(); }
    }
  }
  c.globalAlpha = 1; c.lineCap = 'round';
}
// The paints mixed by the brush (tapeplan.js, mixWalk): every stretch of the
// tape its colour, as covered as the paint got there; the ground where none
// did. Neighbouring stretches of one colour drawn as one line.
let MIX = null;
function mixNow() {
  const G = planNow(), key = JSON.stringify([plKey, S.spokes, S.mode, S.density]);
  if (MIX?.key !== key) MIX = { key, ...mixWalk(G, S.spokes, S.mode, S.density) };
  return MIX;
}
function paintMixed(c, G, M, i0, i1) {
  const P = G.pts, gr = hex2rgb(S.ground), q = Math.round;                            // opaque, the ground mixed in as the paint thins, round ends: no seams where the pieces meet
  c.save(); c.lineWidth = S.brush; c.lineCap = 'round'; c.lineJoin = 'round';
  let style = null;
  const flush = () => { if (style) c.stroke(); };
  for (let i = Math.max(1, i0); i <= i1; i++) {
    if (P[i].brk || M.cover[i] < 0.03) { flush(); style = null; continue; }
    const t = Math.min(1, M.cover[i]), st = `rgb(${[0, 1, 2].map(j => q(gr[j] + (M.rgb[3 * i + j] * 255 - gr[j]) * t)).join(',')})`;
    if (st !== style) { flush(); style = st; c.strokeStyle = st; c.beginPath(); c.moveTo(P[i - 1].x, P[i - 1].y); }
    c.lineTo(P[i].x, P[i].y);
  }
  flush();
  c.lineWidth = Math.max(0.15, S.brush * 0.06);                                      // the ridges along the lanes' edges, the light on one, the shadow on the other
  for (const [side, colr] of [[-0.46, 'rgba(255,255,255,.18)'], [0.47, 'rgba(0,0,0,.22)']]) {
    c.strokeStyle = colr; c.beginPath();
    for (let i = Math.max(1, i0); i <= i1; i++) { const p = P[i], o = side * S.brush, x = p.x - p.ty * o, y = p.y + p.tx * o; (P[i].brk || M.cover[i] < 0.03 || i === Math.max(1, i0)) ? c.moveTo(x, y) : c.lineTo(x, y); }
    c.stroke();
  }
  c.restore();
}
// The spokes, the paint's map: each a line of its paint across the lanes it crosses, a dark edge so a light paint reads
function drawSpokes() {
  if (!S.spokes.length && !grab) return;
  const G = planNow();
  g.save(); inMm(g); clipCanvas(g); g.lineCap = 'round'; g.lineJoin = 'round';   // squeezed on the canvas only
  for (const sp of grab ? [...S.spokes, spokeOfGrab()] : S.spokes) {
    const L = spokeLine(G, sp); if (!L.length) continue;
    const line = () => { g.beginPath(); L.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); if (L.length === 1) g.lineTo(L[0][0] + 0.01, L[0][1]); };
    g.strokeStyle = 'rgba(36,34,31,.75)'; g.lineWidth = 3.6; line(); g.stroke();
    g.strokeStyle = PAINT[sp.paint].hex; g.lineWidth = 2.8; line(); g.stroke();
  }
  g.restore();
}
function drawResult() {
  const B = resultBitmap();
  g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.imageSmoothingQuality = 'high';
  g.drawImage(B.c, sx([-B.ex]), sy([0, -B.ey]), 2 * B.ex * k, 2 * B.ey * k);
  g.restore();
}

// ---------- ▶ Play the run (the prototype's) ----------
// The brush through the moves, about 30 times as fast: the segments laid one
// after another, the brush a ring — dashed in the air.
let PLAY = null;
const clock = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
function startPlay() {
  const G = planNow(), dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  if (!G.moves.length) return;
  const dur = m => m.type === 'paint' ? m.len / S.speed : m.type === 'air' ? m.len / AIR_SPEED + LIFT_S : 0;
  const real = G.moves.reduce((a, m) => a + dur(m), 0), kk = Math.max(10, real / 45), T = [];
  let r = 0, s = 0;
  for (const m of G.moves.filter(m => m.type !== 'stop')) {                         // no stop for paint
    const d = dur(m), ds = d / kk;
    if (m.pts) { const c = [0]; for (let i = 1; i < m.pts.length; i++) c[i] = c[i - 1] + dist(m.pts[i - 1], m.pts[i]); m.cl = c; }
    T.push({ m, r0: r, r: d, s0: s, s: ds }); r += d; s += ds;
  }
  PLAY = { T, total: real, simTotal: s, k: kk, t0: performance.now(), idx: 0, raf: 0 };
  $('#btnPlay').textContent = '■ Stop';
  const frame = () => { if (!PLAY) return; if ((performance.now() - PLAY.t0) / 1000 >= PLAY.simTotal) { stopPlay(); return; } draw(); PLAY.raf = requestAnimationFrame(frame); };
  PLAY.raf = requestAnimationFrame(frame);
}
function stopPlay() {
  if (!PLAY) return;
  cancelAnimationFrame(PLAY.raf); PLAY = null;
  $('#btnPlay').textContent = '▶ Play the run'; $('#playRead').textContent = ''; kick();
}
function drawPlay() {
  const G = planNow(), T = PLAY.T, el = (performance.now() - PLAY.t0) / 1000;
  while (PLAY.idx < T.length - 1 && el >= T[PLAY.idx].s0 + T[PLAY.idx].s) PLAY.idx++;
  const e = T[PLAY.idx], m = e.m, f = e.s > 0 ? Math.min(1, (el - e.s0) / e.s) : 1;
  let pos = m.at || m.pts[0], part = null;
  if (m.pts) {
    const L = f * m.cl.at(-1); let i = 1;
    while (i < m.cl.length - 1 && m.cl[i] < L) i++;
    const a = m.pts[i - 1], b = m.pts[i], q = Math.max(0, Math.min(1, (L - m.cl[i - 1]) / ((m.cl[i] - m.cl[i - 1]) || 1)));
    pos = { x: a.x + (b.x - a.x) * q, y: a.y + (b.y - a.y) * q };
    if (m.type === 'paint') part = [...m.pts.slice(0, i), pos];
  }
  const done = new Set(T.slice(0, PLAY.idx).filter(x => x.m.type === 'paint').map(x => x.m.seg));   // a run painted once stays painted, the snake's way back too
  g.save(); inMm(g); clipCanvas(g); g.lineJoin = 'round'; g.lineCap = 'round'; g.lineWidth = S.brush; g.strokeStyle = S.tape;
  if (S.spokes.length) {                                                            // the paints as the brush leaves them, where it has been
    const M = mixNow(), at = PLAY.at ??= new Map(G.pts.map((p, i) => [p, i]));
    for (const j of done) paintMixed(g, G, M, G.segs[j].i0, G.segs[j].i1);
    if (part && !done.has(m.seg)) { const a = at.get(m.pts[0]), b = at.get(part.at(-2) ?? m.pts[0]); paintMixed(g, G, M, Math.min(a, b), Math.max(a, b)); }
  } else {
    for (const j of done) { poly(g, G.pts, G.segs[j].i0, G.segs[j].i1); g.stroke(); }
    if (part) { g.beginPath(); part.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.stroke(); }
  }
  g.fillStyle = rgbs(mix(hex2rgb(S.ground), [255, 255, 255], 0.55)); bodyPath(g, G.cb); g.fill();
  g.strokeStyle = '#2B2724'; g.lineWidth = 0.35; cassettePath(g); g.stroke();
  g.restore();
  g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const X = sx([pos.x]), Y = sy([0, pos.y]), r = Math.max(S.brush / 2 * k, 5);
  g.beginPath(); g.arc(X, Y, r, 0, Math.PI * 2);
  if (m.type === 'paint') { g.fillStyle = S.tape; g.fill(); g.lineWidth = 1.5; g.strokeStyle = '#fff'; g.stroke(); }
  else { g.setLineDash([3, 3]); g.lineWidth = 2; g.strokeStyle = '#555'; g.stroke(); g.setLineDash([]); }
  g.restore();
  $('#playRead').textContent = `${clock(e.r0 + f * e.r)} / ${clock(PLAY.total)} · ×${Math.round(PLAY.k)} · ${m.type === 'paint' ? 'painting' : 'in the air'} (the prototype's reckoning, est.)`;
}
$('#btnPlay').onclick = () => PLAY ? stopPlay() : startPlay();

// ---------- the run as it goes (CCD's) ----------
let trailOf = null, lastSt = null, RUN_BLOCKS = null, RUN_INFO = null;
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
  if (!st || !trailOf || st.started !== trailOf || !RUN_BLOCKS) return;
  const B = RUN_BLOCKS, h = hereNow(), at = st.x_mm !== null && st.y_mm !== null ? { x: st.x_mm, y: st.y_mm } : null;
  const live = ['running', 'stopping', 'pausing', 'paused'].includes(st.state);
  const X = q => (q.y - h.y - V.y0) * k, Y = q => (V.x1 - q.x + h.x) * k;
  g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.lineWidth = 1.2; g.lineJoin = 'round';
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
const UNDO_KEYS = [...PLAN_KEYS, 'brushType', 'brushAngle', 'traceCass', 'traceTape', 'traceSpeed', 'ground', 'tape', 'cassSvg', 'cassName', 'spokes', 'palette', 'seed', 'density', 'spokeLanes'];
let undoStack = [], redoStack = [];
const snapshot = () => JSON.stringify(Object.fromEntries(UNDO_KEYS.map(q => [q, S[q]])));
function undoPush() { undoStack.push(snapshot()); if (undoStack.length > 200) undoStack.shift(); redoStack = []; }
function restore(js) { const was = S.cassSvg; Object.assign(S, JSON.parse(js)); if (S.cassSvg !== was) useCassette(); else settle(); }
function undo() { if (!undoStack.length) return; redoStack.push(snapshot()); restore(undoStack.pop()); }
function redo() { if (!redoStack.length) return; undoStack.push(snapshot()); restore(redoStack.pop()); }
$('#btnUndo').onclick = undo; $('#btnRedo').onclick = redo;

// ---------- the paints and the spokes (M) ----------
// The owner's paints a strip by the Tools, as ALU's tubes (the owner,
// 2026-10-12: "can these colours go in the TOOLS on the left, as in ALU");
// a click picks the paint and takes up M. With M a click on the tape lays a
// spoke of it across all the lanes at that spot, round the cassette; a drag
// from lane to lane a short one, as the owner's spokes on paper; a click on
// a spoke takes it away.
$('#paints').innerHTML = TAPE_PAINTS.map(([id, name, hex]) => `<div class="chip" data-paint="${id}"><button class="sw" style="background:${hex}" aria-label="${name}"></button><span class="cnt"></span></div>`).join('');
$('#paints').querySelectorAll('[data-paint]').forEach(ch => ch.querySelector('.sw').onclick = () => { S.paint = ch.dataset.paint; S.tool = 'spoke'; save(); showPanel(); kick(); });
document.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => { S.tool = S.tool === b.dataset.tool ? '' : b.dataset.tool; save(); showPanel(); kick(); });
document.querySelectorAll('#laneKeys [data-lanes]').forEach(b => b.onclick = () => { S.spokeLanes = +b.dataset.lanes; save(); showPanel(); });
$('#paintInfo').onclick = () => { $('#paintRead').hidden = !$('#paintRead').hidden; $('#paintInfo').classList.toggle('on', !$('#paintRead').hidden); };
$('#btnSpokesClear').onclick = () => { if (!S.spokes.length) return; undoPush(); S.spokes = []; settle(); };
// New colours, as ALU's: a palette at random, another family than the last; the spokes lying there take it, or new ones are laid
$('#btnNewColours').onclick = () => {
  undoPush(); stopPlay();
  S.seed = Math.floor(Math.random() * 1e9); S.palette = newPalette(S.seed, S.palette?.name);
  S.spokes = S.spokes.length ? recolourSpokes(S.spokes, S.palette, S.seed) : newSpokes(planNow(), S.palette, S.seed);   // the sausages stay in their places
  S.view = 'result'; settle();
};
// New spokes: the pattern — the corners' spots and the brush's breath — its stripes mixed anew, in the palette as it is
$('#btnNewSpokes').onclick = () => {
  undoPush(); stopPlay();
  S.seed = Math.floor(Math.random() * 1e9); S.palette ||= newPalette(S.seed);
  S.spokes = newSpokes(planNow(), S.palette, S.seed);
  S.view = 'result'; settle();
};
let grab = null;
const spokeOfGrab = () => {                                                       // a click: the block of six under the pointer; a drag: lane to lane, six at most
  if (!grab) return null;
  const [k0, k1] = grab.moved ? dragLanes(grab.l0, grab.l1, S.spokeLanes) : blockOf(grab.l0, S.spokeLanes);
  return { u: grab.u, k0, k1, paint: S.paint };
};
cv.addEventListener('pointerdown', e => {
  if (e.button !== 0 || S.tool !== 'spoke' || PLAY) return;
  const G = planNow(), [x, y] = toCanvas(e);
  const hit = S.spokes.findIndex(sp => spokeLine(G, sp).some(p => Math.hypot(p[0] - x, p[1] - y) < Math.max(1.5, 6 / k)));
  if (hit >= 0) { undoPush(); S.spokes.splice(hit, 1); settle(); return; }
  const i = nearestSample(G, x, y, Math.max(3, 10 / k));
  if (i < 0) return;
  // a dash lines up with a spoke lying there, so they run on along one radius
  const k0 = Math.max(0, Math.round(G.pts[i].l)), near = S.spokes.map(sp => ({ sp, d: Math.hypot(...spokePoint(G, sp.u, k0).map((v, j) => v - [x, y][j])) })).filter(q => q.d < 5).sort((a, b) => a.d - b.d)[0];
  grab = { u: near ? near.sp.u : G.pts[i].u, l0: G.pts[i].l, l1: G.pts[i].l, moved: false }; cv.setPointerCapture(e.pointerId); kick();
});
cv.addEventListener('pointermove', e => {
  cv.style.cursor = S.tool === 'spoke' ? 'crosshair' : '';
  if (!grab) return;
  const G = planNow(), [x, y] = toCanvas(e), i = nearestSample(G, x, y);
  if (i >= 0) { grab.l1 = G.pts[i].l; grab.moved = grab.moved || Math.abs(grab.l1 - grab.l0) >= 0.5; }
  kick();
});
const drop = () => { if (!grab) return; const sp = spokeOfGrab(); grab = null; undoPush(); S.spokes.push(sp); settle(); };
cv.addEventListener('pointerup', drop); cv.addEventListener('pointercancel', () => { grab = null; kick(); });
addEventListener('keydown', e => {
  if (e.key === 'Escape') post('/run/stop');                                         // Esc = STOP, as on every tab with a run
  if (e.target.matches('input,select,textarea')) return;
  const cmd = e.metaKey || e.ctrlKey;
  if (cmd && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (!cmd && e.key.toLowerCase() === 'm') { S.tool = S.tool === 'spoke' ? '' : 'spoke'; save(); showPanel(); kick(); }   // M: the spokes
});

// The zoom (CCD's): − 100% +, ⌘− ⌘0 ⌘+; a pinch zooms where it is, two fingers move the board.
function zoomTo(z, e) {
  z = Math.max(ZOOMS[0], Math.min(ZOOMS.at(-1), z));
  if (Math.abs(z - 1) < 1e-6) { Z = 1; ZC = null; layout(); showZoom(); return; }
  const at = e ? toCanvas(e) : null, r = cv.getBoundingClientRect();
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
// The sliders, TAPE.md's ranges and the owner's defaults; est. where nothing measured them
const SL = {
  slTrace: [['traceSpeed', 'Trace speed', 5, 10, 150, 'The brush along the cassette\'s outline and the guide, mm/s (est.)']],
  slBrush: [['brush', 'Brush = tape', 0.5, 2, 20, 'The brush is the tape: as wide as a cassette\'s, 3.81 mm; the small differences for the adjustments'],
    ['speed', 'Speed', 1, 5, Math.min(80, SPEED_MAX), 'The brush along the tape, mm/s'],
    ['gap', 'Gap', 0.5, 0, 10, 'Between neighbouring lanes; 0, they touch'],
    ['corners', 'Corners', 1, -50, 50, 'From sharp, the tape fitting the square, through the cassette\'s own corners, to round — then on the fly']],
  slAdjust: [['cassScale', 'Cassette size', 1, 80, 130, '100 % the real shell'],
    ['clear', 'First lane', 0.5, 0, 10, 'Between the cassette and lane 1'],
    ['step', 'Lane change', 1, 4, 120, 'How long the tape takes to move out to the next lane, in brush widths; longer than lane 1, one continuous spiral'],
    ['strokes', 'Strokes', 1, 1, 6, 'How many times the brush goes over the tape: the snake back and forth with the brush down, air each time from the start'],
    ['overrun', 'Edge overrun', 1, 0, 15, 'How far the brush runs on past the canvas\'s edge before it lifts']],
  slFlat: [['brushAngle', 'Flat angle', 5, 0, 90, 'The flat brush\'s angle on the holder: no servo turns it']],
  slPaint: [['density', 'Density', 1, 0, 100, 'The paint in a spoke: the more, the farther the brush carries it as a whole film (the Result; est.)']],
};
function valOf(key) {
  const v = S[key], G = PL;
  switch (key) {
    case 'brush': return `${fmt(v, 1)} mm · tape ${REAL.tape}`;
    case 'speed': case 'traceSpeed': return `${v} mm/s${key === 'traceSpeed' ? ' (est.)' : ''}`;
    case 'gap': return v ? `${fmt(v, 1)} mm` : '0 · touching';
    case 'corners': return `${v > 0 ? '+' : ''}${v}`;
    case 'cassScale': return `${v} %${v === 100 ? ' · real' : ''}`;
    case 'clear': case 'overrun': return `${fmt(v, 1)} mm`;
    case 'step': return G?.full && S.seam === 'shift' ? `×${v} · spiral` : `×${v} · ${fmt(Math.min(v * S.brush, G?.P0 ?? Infinity), 0)} mm`;
    case 'strokes': return String(v);
    case 'brushAngle': return `${v}°`;
    case 'density': return `${v} % · ×${fmt(densityOf(v), densityOf(v) < 10 ? 1 : 0)} paint (est.)`;
  }
  return String(v);
}
for (const [box, list] of Object.entries(SL)) {
  $('#' + box).innerHTML = list.map(([key, label, step, min, max, title]) => `<label class="sl" title="${title}"><span class="slh"><span>${label}</span><span class="val" data-v="${key}"></span></span><input class="slider" type="range" data-k="${key}" min="${min}" max="${max}" step="${step}"></label>`).join('');
  $('#' + box).querySelectorAll('input').forEach(inp => {
    inp.oninput = () => { if (!busy) undoPush(); busy = true; S[inp.dataset.k] = +inp.value; stopPlay(); planNow(); showPanel(); kick(); };
    inp.onchange = () => settle();
  });
}
const latch = (sel, fn) => document.querySelectorAll(sel).forEach(b => b.onclick = () => { undoPush(); fn(b); stopPlay(); settle(); });
latch('#seamKeys [data-seam]', b => { S.seam = b.dataset.seam; });
latch('#dirKeys [data-dir]', b => { S.dir = b.dataset.dir; });
latch('#typeKeys [data-btype]', b => { S.brushType = b.dataset.btype; });
latch('#traceKeys [data-trace]', b => { S[b.dataset.trace] = !S[b.dataset.trace]; });
document.querySelectorAll('#views [data-view]').forEach(b => b.onclick = () => { S.view = b.dataset.view; stopPlay(); save(); showPanel(); layout(); });
$('#ink').onchange = e => { S.ink = e.target.checked; settle(); };
$('#inkOff').onclick = () => { S.ink = false; settle(); };
$('#inkOn').onclick = () => { S.ink = true; settle(); };
for (const [id, key] of [['#colGround', 'ground'], ['#colTape', 'tape']]) {
  $(id).oninput = e => { S[key] = e.target.value; showPanel(); kick(); };
  $(id).onchange = e => { undoPush(); S[key] = e.target.value; settle(); };
}
// the cassette: the built-in one, or another's SVG for this tape
$('#btnCassDefault').onclick = () => { if (!S.cassSvg) return; undoPush(); S.cassSvg = null; S.cassName = ''; useCassette(); };
$('#btnCassLoad').onclick = () => $('#cassIn').click();
$('#cassIn').onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  const rd = new FileReader();
  rd.onload = () => {
    const text = String(rd.result);
    if (!parseCassette(text, f.name)) { $('#cassRead').innerHTML = `<span class="warn">${esc(f.name)}: no outlines found in it.</span>`; return; }
    undoPush(); S.cassSvg = text; S.cassName = f.name; useCassette();
  };
  rd.readAsText(f); e.target.value = '';
};
$('#fields').innerHTML = FIELDS.map(([key, label, unit, step, title, any]) => `<label title="${title}">${label} <input data-k="${key}" type="number" step="${step}"${any ? '' : ` min="${step}"`}><em>${unit}</em></label>`).join('');
$('#fields').querySelectorAll('input').forEach(inp => inp.onchange = () => {
  const v = +inp.value, any = FIELDS.find(f => f[0] === inp.dataset.k)[5];
  if (inp.value !== '' && fin(v) && (any || v > 0)) { S[inp.dataset.k] = v; setCanvas(S); }   // the canvas: one base for every tab (canvas.js)
  settle();
});
$('#planInfo').onclick = () => { $('#planMore').hidden = !$('#planMore').hidden; $('#planInfo').classList.toggle('on', !$('#planMore').hidden); };
const esc = v => String(v ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const HINT = 'TAPE: the cassette in the centre of the canvas, real size, the tape wound round it. TRACE its outline and the tape\'s guide with the brush (INK ON: watercolour), then DRAG, the tape in one go, the snake or through the air; the cassette drawn with a stencil and coloured by hand last.';
function showPanel() {
  for (const list of Object.values(SL)) for (const [key] of list) {
    const inp = $(`input[data-k="${key}"]`); if (document.activeElement !== inp) inp.value = S[key];
    $(`[data-v="${key}"]`).textContent = valOf(key);
  }
  const on = (sel, attr, v) => document.querySelectorAll(sel).forEach(b => b.classList.toggle('on', b.dataset[attr] === v));
  on('#views [data-view]', 'view', S.view); on('#seamKeys [data-seam]', 'seam', S.seam); on('#dirKeys [data-dir]', 'dir', S.dir); on('#typeKeys [data-btype]', 'btype', S.brushType);
  document.querySelectorAll('#traceKeys [data-trace]').forEach(b => b.classList.toggle('on', !!S[b.dataset.trace]));
  $('input[data-k="step"]').closest('.sl').hidden = S.seam !== 'shift';
  $('#slFlat').hidden = S.brushType !== 'flat';
  $('#ink').checked = S.ink; $('#inkOff').classList.toggle('on', !S.ink); $('#inkOn').classList.toggle('on', S.ink);
  $('#swGround').style.background = S.ground; $('#swTape').style.background = S.tape;
  if (document.activeElement !== $('#colGround')) $('#colGround').value = S.ground;
  if (document.activeElement !== $('#colTape')) $('#colTape').value = S.tape;
  $('#fields').querySelectorAll('input').forEach(inp => { if (document.activeElement !== inp) inp.value = S[inp.dataset.k]; });
  const cb = PL?.cb;
  $('#cassRead').innerHTML = !CASS ? '<span class="warn">No cassette: start rembrandt.py, or load an SVG.</span>'
    : `${esc(CASS.name)} · <b>${fmt(cb?.w ?? 0, 1)} × ${fmt(cb?.h ?? 0, 1)} mm</b> on the canvas, ${S.cassScale === 100 ? 'real size' : `${S.cassScale} % of real`} · ${CASS.items.length} outlines`;
  $('#btnCassDefault').classList.toggle('on', !S.cassSvg);
  $('#hint').textContent = S.tool === 'spoke' ? `M, ${PAINT[S.paint].name}: a click on the tape lays a spoke over the ${S.spokeLanes === 1 ? 'lane' : `${S.spokeLanes} lanes`} there, lined up with one lying there; a drag from lane to lane, ${S.spokeLanes} at most; a click on a spoke takes it away. The Result mixes them as the brush goes (est.).` : HINT;
  document.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === S.tool));
  const count = {}; for (const sp of S.spokes) count[sp.paint] = (count[sp.paint] || 0) + 1;
  $('#paints').querySelectorAll('[data-paint]').forEach(ch => {
    const q = PAINT[ch.dataset.paint], n = count[q.id] || 0;
    ch.querySelector('.cnt').textContent = n || '';
    ch.classList.toggle('pick', S.tool === 'spoke' && q.id === S.paint);
    ch.title = `${q.name} — ${q.from === 'chart' ? 'its colour off the maker\'s chart' : 'its colour off your swatch'} (est.)${n ? `, ${n} spoke${n === 1 ? '' : 's'}` : ''} — a click: the paint of the next spoke (M)`;
  });
  // the paints in use, as the owner wants them in sight: the palette's, then any other a spoke has; a chip, its name, its spokes
  const inUse = [...new Set([...(S.palette ? [...S.palette.core, ...S.palette.accent] : []), ...S.spokes.map(sp => sp.paint)])];
  $('#paintList').innerHTML = inUse.map(id => `<span class="pl${count[id] ? '' : ' none'}" title="${PAINT[id].name}${S.palette?.accent.includes(id) ? ', thin' : ''}"><i style="background:${PAINT[id].hex}"></i>${PAINT[id].name}${S.palette?.accent.includes(id) ? ' <em>thin</em>' : ''}${count[id] ? ` <em>×${count[id]}</em>` : ''}</span>`).join('');
  document.querySelectorAll('#laneKeys [data-lanes]').forEach(b => b.classList.toggle('on', +b.dataset.lanes === S.spokeLanes));
  $('#paintRead').innerHTML = [
    `The spokes, where you squeeze the paints. New colours: a palette at random, the spokes staying in their places — or, none lying, the pattern laid. New spokes: the pattern, its stripes of lanes mixed anew — two spots at every corner, and more where a lane would go ${RUN_MM} mm without paint, the brush running out there (the paper test of 8 October, ALU-Claude/paper-test/). M and a paint in the strip: a click lays a spoke over 1, 2 or 6 lanes there, a drag from lane to lane, a click on a spoke takes it away.`,
    S.palette && `Palette <b>${S.palette.name}</b>: ${S.palette.core.map(id => PAINT[id].name).join(', ')}; thin: ${S.palette.accent.map(id => PAINT[id].name).join(', ')} · seed ${S.seed}`,
    S.spokes.length ? `<b>${S.spokes.length}</b> spoke${S.spokes.length === 1 ? '' : 's'} — the Result mixes them as the brush goes, ${S.strokes} stroke${S.strokes === 1 ? '' : 's'} ${MODE_NAME[S.mode]}, Density ${S.density} % (est.)` : 'No spokes yet.',
  ].filter(Boolean).join('<br>');
}
const took = s => s < 59.5 ? `${Math.max(1, Math.round(s))} s` : `${fmt(s / 60, 0)} min`;   // a short run in seconds
// Settled: a slider let go, a key pressed — the plan, the reading, the LCD.
function settle() {
  busy = false;
  const G = planNow(), D = dragRun('snake'), A = dragRun('air'), T = traceRun(), here = hereNow(), w = S.brush, lines = [], more = [];
  if (G.fits) {
    lines.push(`Tape lane: <b>${fmt(w, 1)} mm</b> brush · real tape ${REAL.tape} mm (×${fmt(w / REAL.tape, 2)}) · pitch ${fmt(G.F.p, 1)} mm${S.gap ? '' : ' · lanes touching'}`);
    lines.push(`Lanes: <b>${G.kSide}</b> to the side edges · <b>${G.kTop}</b> to top and bottom · <b>${G.K}</b> to fill the corners`);
    lines.push(`Seam: ${S.seam === 'shift' ? (G.full ? 'none — the lane change over the whole turn, <b>one continuous spiral</b>' : `from the middle of the right side, the lane change over <b>${fmt(G.Lb, 0)} mm</b> (${Math.round(G.Lb / G.P0 * 100)} % of lane 1)`) : 'the middle of the right side; each ring closes on itself, the brush lifting to the next'}`);
    lines.push(`DRAG: the tape ${fmt(D.mm / S.strokes / 1000, 1)} m${G.runs.length > 1 ? ` in ${G.runs.length} runs` : ', one run'} × ${S.strokes} stroke${S.strokes === 1 ? '' : 's'}, no stop · Snake ≈ ${took(D.seconds)}, the brush landing ${D.landings} time${D.landings === 1 ? '' : 's'}; Air ≈ ${took(A.seconds)}, ${A.landings} landings · at ${S.speed} mm/s (est.)`);
    lines.push(`TRACE: <b>${T.lines}</b> line${T.lines === 1 ? '' : 's'}${S.traceCass ? `, the cassette's outline ${fmt(shellOf(G, 0).P, 0)} mm and ${Math.round(LOOP_SHARE * 100)} % over its start` : ''}${S.traceTape ? `, the guide ${fmt(G.guideLen / 1000, 1)} m` : ''} · ${S.ink ? `<b>Ink ON</b>: watercolour, ${T.dips} dip${T.dips === 1 ? '' : 's'}` : 'no dip'} · ≈ ${took(T.seconds)} at ${S.traceSpeed} mm/s (est.)`);
  }
  more.push(`The prototype's reckoning, ${MODE_NAME[S.mode]}: paint ${fmt(G.paintLen / 1000, 1)} m · air ${fmt(G.airLen / 1000, 1)} m · ${G.lifts} lifts · ≈ ${fmt(G.tMachine / 60, 1)} min (est.)`);
  more.push(`The canvas from home: its bottom left corner at carriage <b>X ${fmt(here.x - S.boardH / 2, 1)} · Y ${fmt(here.y - S.boardW / 2, 1)} mm</b>; the cassette in its centre; TEST's dots ${TEST_MARGIN} mm in from its edges`);
  $('#planRead').innerHTML = lines.join('<br>');
  $('#planMore').innerHTML = more.join('<br>');
  const warn = [
    !G.fits && `⚠ The cassette does not fit on ${S.boardW} × ${S.boardH} with a ${fmt(w, 1)} mm lane: a smaller cassette or a bigger canvas.`,
    S.brushType === 'flat' && '⚠ A flat brush, no servo turning it: the tape\'s width changes with the way it runs (see the Result).',
    S.ink && cupProblem(cup()) && `⚠ Ink ON: ${cupProblem(cup())}`,
    D.fault && `⚠ The plan is wrong, DRAG will not run it: ${D.fault}.`, T.fault && `⚠ The plan is wrong, TRACE will not run it: ${T.fault}.`,
    walls(D) || walls(T),
  ].filter(Boolean);
  $('#planWarn').innerHTML = warn.map(q => `<span class="warn">${q}</span>`).join('<br>');
  $('#planWarn').hidden = !warn.length;
  $('#stats').textContent = !G.fits ? 'the cassette does not fit' : `${G.K} lanes · DRAG Snake ≈ ${took(D.seconds)} · Air ≈ ${took(A.seconds)} · TRACE ≈ ${took(T.seconds)} (est.)`;
  showPanel(); save(); layout(); lastLcd && lcd(lastLcd);
}
function walls(P_) {
  const h = hereNow();
  if (!P_?.carriage || !P_.rows.length) return '';
  const R = reach(), b = P_.carriage, x0 = h.x + b.x0, x1 = h.x + b.x1, y0 = h.y + b.y0, y1 = h.y + b.y1;
  const out = [x0 < R.x.min && `${fmt(R.x.min - x0, 0)} mm past the bottom wall`, x1 > R.x.max && `${fmt(x1 - R.x.max, 0)} mm past the top wall`,
    y0 < R.y.min && `${fmt(R.y.min - y0, 0)} mm past the left wall`, y1 > R.y.max && `${fmt(y1 - R.y.max, 0)} mm past the right wall`].filter(Boolean);
  return out.length ? `⚠ The brush would go ${out.join(', ')}: what lies past a wall runs along it.` : '';
}

// ---------- 💾 SAVE TAPE ----------
// An SVG of the canvas in mm, centred (TAPE.md, Export): the cassette's SVG
// nested as it is, Inkscape's layers kept; the tape's guide a path a run;
// DRAG's segments a path each, in their order; the whole state in its
// metadata, a PNG preview; on the tests' shelf, its label TAPE: the Library
// opens it here.
const label = () => `${TAB_NAME} · ${PL?.K ?? 0} lanes · ${S.boardW} × ${S.boardH} mm · brush ${fmt(S.brush, 1)} mm`;
function svgOf() {
  const W = S.boardW, H = S.boardH, G = planNow(), f = v => (Math.round(v * 100) / 100).toString(), cb = G.cb;
  const meta = JSON.stringify({ rembrandt: '1.0.5', [TAB]: true, label: label(), settings: S }).replace(/&/g, '\\u0026').replace(/</g, '\\u003c').replace(/--/g, '- -');
  let cass = '';
  if (CASS) {
    const doc = new DOMParser().parseFromString(CASS.text, 'image/svg+xml'), root = doc.documentElement;
    root.setAttribute('x', f(-cb.w / 2)); root.setAttribute('y', f(-cb.h / 2)); root.setAttribute('width', f(cb.w)); root.setAttribute('height', f(cb.h));
    if (!root.getAttribute('viewBox')) root.setAttribute('viewBox', `${CASS.vx} ${CASS.vy} ${CASS.vw} ${CASS.vh}`);
    cass = new XMLSerializer().serializeToString(root);
  }
  const guides = G.runs.map((r, i) => `<path id="guide-${i + 1}" d="${pathD(piecesOf(G, r.c0, r.c1))}"/>`).join('\n');
  const segs = G.segs.map((sg, i) => `<path id="seg-${String(i + 1).padStart(3, '0')}" d="${pathD(piecesOf(G, sg.i0, sg.i1))}"/>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="${f(-W / 2)} ${f(-H / 2)} ${W} ${H}">
<!-- Rembrandt v.1.0.5 · ${esc(label())}; 1 unit = 1 mm from the canvas's centre, y down -->
<metadata id="rembrandt-test">${meta}</metadata>
<rect id="canvas" x="${f(-W / 2)}" y="${f(-H / 2)}" width="${W}" height="${H}" fill="${S.ground}" stroke="#24221F" stroke-width="0.5"/>
<g id="cassette">${cass}</g>
<g id="spokes" fill="none" stroke-width="2.8" stroke-linecap="round">${S.spokes.map(sp => { const L = spokeLine(G, sp); return L.length ? `<path d="M${L.map(p => `${f(p[0])} ${f(p[1])}`).join('L')}" stroke="${PAINT[sp.paint].hex}" data-paint="${PAINT[sp.paint].name}"/>` : ''; }).join('')}</g>
<g id="trace-cassette" fill="none" stroke="#999" stroke-width="0.5">${G.fits ? `<path id="outline" d="${pathD(shellOf(G, 0).pieces)}"/>` : ''}</g>
<g id="trace-tape" fill="none" stroke="#999" stroke-width="0.5">
${guides}
</g>
<g id="drag-tape" data-mode="${S.mode}" data-strokes="${S.strokes}" data-brush-mm="${S.brush}" data-speed-mm-s="${S.speed}" fill="none" stroke="${S.tape}" stroke-width="${S.brush}" stroke-linecap="round" stroke-linejoin="round">
${segs}
</g>
</svg>`;
}
function pngOf() {
  const keep = [g, k, dpr, V]; V = view();                                           // the whole board, whatever the zoom
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
    take(o.settings); setCanvas(o.settings); Object.assign(S, canvasNow(S)); useCassette();   // the save's canvas becomes the base
    $('#saveState').textContent = `opened · ${file.slice(0, 13)}:${file.slice(14)}`;
  } catch { $('#saveState').textContent = 'could not open it from the Library'; }
}

// ---------- the deck: TEST, TRACE, DRAG, PAUSE ----------
const post = async path => { try { const r = await fetch(path, { method: 'POST' }); return await r.text(); } catch { return 'start rembrandt.py'; } };
let RUN_KEY = null;
async function start(key, blocks, info, log) {
  try {
    RUN_BLOCKS = blocks; RUN_INFO = info; RUN_KEY = key;
    const r = await fetch('/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blocks, log }) });   // the run journal, rembrandt.py
    $('#runState').textContent = await r.text();
  } catch { $('#runState').textContent = 'start rembrandt.py'; }
}
const refuse = text => { $('#runState').innerHTML = `<span class="warn">${text}</span>`; };
$('#btnTrace').onclick = async () => {
  await loadInk(); settle();
  const G = planNow(), T = traceRun();
  if (!G.fits) return refuse('Nothing to trace: the cassette does not fit on the canvas.');
  if (!T.rows.length) return refuse('Nothing to trace: the cassette\'s outline and the guide are both off.');
  if (S.ink && cupProblem(cup())) return refuse(`Ink ON: ${cupProblem(cup())}`);
  if (T.fault) return refuse(`Not run: the plan is wrong — ${T.fault}.`);
  const what = [S.traceCass && 'the cassette\'s outline', S.traceTape && `the tape's guide, ${G.runs.length} run${G.runs.length === 1 ? '' : 's'}`].filter(Boolean).join(' and ');
  if (!confirm(`TRACE ${TAB_NAME}: ${what}, ${T.lines} line${T.lines === 1 ? '' : 's'} at ${S.traceSpeed} mm/s, ≈ ${took(T.seconds)} (est.).\n\n${S.ink ? `Ink ON: watercolour from the cup, ${T.dips} dip${T.dips === 1 ? '' : 's'}.` : 'Ink OFF: no dip.'} Is the brush in the holder?${walls(T) ? `\n\n${walls(T)}` : ''}`)) return;
  S.view = 'trace'; stopPlay(); settle();
  await start('trace', T.blocks, { seconds: T.seconds, rows: T.rows },
    { page: TAB, pass: 'trace', label: label(), settings: { ...S, cassSvg: S.cassSvg ? '(loaded)' : null }, here: hereNow(), ...(S.ink ? { cup: cup() } : {}), estimate_s: Math.round(T.seconds) });
};
async function runDrag(mode) {
  settle();
  const G = planNow(), D = dragRun(mode), snake = mode === 'snake';
  if (!G.fits || !D.rows.length) return refuse('Nothing to run: the cassette does not fit on the canvas.');
  if (D.fault) return refuse(`Not run: the plan is wrong — ${D.fault}.`);
  const text = `the tape ${fmt(D.mm / S.strokes / 1000, 1)} m${G.runs.length > 1 ? ` in ${G.runs.length} runs` : ''}, ${S.strokes} stroke${S.strokes === 1 ? '' : 's'} — ${snake ? 'forward, back, forward … with the brush down' : 'forward on the canvas, the brush lifting at the end and flying back to the start'} — at ${S.speed} mm/s, ≈ ${took(D.seconds)} (est.), no stop.`
    + `\n\nIs the paint on the canvas, the brush in the holder?${walls(D) ? `\n\n${walls(D)}` : ''}`;
  if (!confirm(`DRAG ${snake ? 'SNAKE' : 'AIR'} ${TAB_NAME}: ${text}`)) return;
  S.mode = mode; S.view = 'drag'; stopPlay(); settle();
  await start(mode, D.blocks, { seconds: D.seconds, rows: D.rows },
    { page: TAB, pass: 'drag', mode, label: label(), settings: { ...S, cassSvg: S.cassSvg ? '(loaded)' : null }, here: hereNow(), estimate_s: Math.round(D.seconds) });
}
$('#btnSnake').onclick = () => runDrag('snake');
$('#btnAir').onclick = () => runDrag('air');
// TEST, before the passes: a dot 20 mm in from each corner of the board, and home; with INK ON one dip in the cup first
function testRun() {
  const T = cornerDots(S.boardW, S.boardH);
  return T.dots.length ? { ...plotRun({ ...runOpts(T.dots.length), ink: S.ink }, T.passes), dots: T.dots } : null;
}
$('#btnTest').onclick = async () => {
  await loadInk(); settle();
  const here = hereNow(), T = testRun();
  if (!T) return refuse(`No corners: the board is ${2 * TEST_MARGIN} mm or less across.`);
  if (S.ink && cupProblem(cup())) return refuse(`TEST dips in the cup with INK ON: ${cupProblem(cup())}`);
  if (T.fault) return refuse(`Not run: the test is wrong — ${T.fault}.`);
  const R = reach(), past = d => { const x = here.x + d.at.x, y = here.y + d.at.y; return [x < R.x.min && `${fmt(R.x.min - x, 0)} mm past the bottom wall`, x > R.x.max && `${fmt(x - R.x.max, 0)} mm past the top wall`, y < R.y.min && `${fmt(R.y.min - y, 0)} mm past the left wall`, y > R.y.max && `${fmt(y - R.y.max, 0)} mm past the right wall`].filter(Boolean).join(', '); };
  const out = T.dots.filter(d => past(d));
  if (!confirm(`TEST: ${S.ink ? 'one dip in the cup, then ' : ''}a dot ${TEST_MARGIN} mm in from each corner of the ${S.boardW} × ${S.boardH} board — ${T.dots.map(d => `${d.name} X ${fmt(here.x + d.at.x, 0)} · Y ${fmt(here.y + d.at.y, 0)}`).join(', ')} — and home.`
    + (out.length ? `\n\n${out.map(d => `${d.name}: ${past(d)}`).join('; ')} — its dot goes on the wall.` : ''))) return;
  await start('test', T.blocks, { seconds: T.seconds, rows: T.dots.map(d => ({ label: `TEST · ${d.name}` })) },
    { page: TAB, label: `${TAB_NAME} · TEST · the corners`, here, dots: T.dots.map(d => ({ name: d.name, x: +(here.x + d.at.x).toFixed(1), y: +(here.y + d.at.y).toFixed(1) })), ...(S.ink ? { cup: cup() } : {}), estimate_s: Math.round(T.seconds) });
};
let paused = false;
$('#btnPause').onclick = () => post(paused ? '/run/continue' : '/run/pause');
$('#btnStop').onclick = () => post('/run/stop');

// The LCD, as on CCD: DRAG's numbers while nothing runs.
const mmss = t => { t = Math.max(0, Math.round(t || 0)); return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
let started = null, lastLcd = null;
const KEY_NAME = { test: 'TEST', trace: 'TRACE', snake: 'DRAG SNAKE', air: 'DRAG AIR' };
function lcd(st) {
  lastLcd = st;
  const P_ = dragRun(), live = st && ['running', 'stopping', 'pausing', 'paused'].includes(st.state);
  const pct = st && st.state !== 'idle' ? (st.state === 'done' ? 100 : st.percent || 0) : 0;
  if (live && !started) started = st.started || Date.now() / 1000;
  if (!live) started = null;
  const R_ = live && RUN_INFO ? RUN_INFO : P_;
  const total = R_.seconds, left = live && started && pct >= 3 ? (Date.now() / 1000 - started) * (100 - pct) / pct : total * (1 - pct / 100);
  const state = !st ? 'no server' : live ? (st.state === 'paused' ? 'paused' : 'live') : st.state === 'idle' ? 'plan' : st.state;
  const b = st && (RUN_BLOCKS || P_.blocks)[st.block], row = b && R_.rows[b.row - 1], now0 = row?.label;
  const waiting = st?.state === 'paused' && st.message;
  paused = ['paused', 'pausing'].includes(st?.state);
  const keyEl = $('#btnPause');
  keyEl.querySelector('span').textContent = paused ? 'Cont.' : 'Pause'; keyEl.classList.toggle('call', paused); keyEl.disabled = !live;
  document.querySelectorAll('.deck [data-pass], #btnTest').forEach(el => el.classList.toggle('on', !!live && (el.dataset.pass || 'test') === RUN_KEY));   // the running key stays down
  const G = PL;
  const now = waiting ? `❚❚ ${st.message}`
    : live && b?.home ? 'done · the carriage goes home, the brush off'
    : live && now0 && b?.dip ? `${now0} · the dip in the cup`
    : live && now0 ? now0 + (st.brush_on ? ' · brush on' : ' · brush off')
    : `${G?.K ?? 0} lanes · ${S.strokes} stroke${S.strokes === 1 ? '' : 's'} · ${MODE_NAME[S.mode]}`;
  $('#lcd').innerHTML = `
    <div class="lcd-top"><span>${state === 'live' ? '▶ ' : state === 'paused' ? '❚❚ ' : ''}${state}${live && RUN_KEY ? ` · ${KEY_NAME[RUN_KEY]}` : ''}</span><span>${live && st.blocks ? `step ${st.block + 1}/${st.blocks}` : `${fmt((P_.mm || 0) / 1000, 2)} m`}</span></div>
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
  $('#runState').innerHTML = !st ? 'no server: start rembrandt.py' : st.message ? `<span class="${st.state === 'error' ? 'warn' : ''}">${esc(st.message)}</span>` : '';
}

// ---------- start ----------
load(); Object.assign(S, canvasNow(S));                                          // the canvas from the base, every tab's (canvas.js)
onCanvas(c => { Object.assign(S, c); settle(); });                               // changed in another window
lampSwitch($('#lamp'));
showZoom();
addEventListener('rembrandt-night', () => kick());
new ResizeObserver(layout).observe(stage);
(async () => {
  await loadBuiltin(); useCassette();
  setInterval(watch, 500); watch();
  await loadInk(); settle();
  const opening = new URLSearchParams(location.search).get('open');
  if (opening) openFromLibrary(opening);
})();
// for poking around in the console, as the prototype's window.__tape: the state, the plan, mm → the board's pixels
window.__tape = { S, get G() { return planNow(); }, px: (x, y) => [sx([x]), sy([0, y])] };
