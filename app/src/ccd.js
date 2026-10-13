// Rembrandt · CCD — after Carlos Cruz-Diez, not the camera's chip (the owner,
// 2026-10-11, Cruz-Diez/: "no trace, no marks — I just squeeze the paint at
// the bottom and the brush drives it from the bottom up. Evenly. What I need
// is the line-making tool itself — the same brush I paint the sausages with,
// but this time stretched left and right in width and up and down in height:
// a free-transform rectangle. And its lines not 18 at most, but all 218 —
// that is why a new tab: I do not want to disturb ALU-CUT. The direction I
// want to choose too — horizontal or vertical"). Its plan in ccdplan.js.
//
// ALU-CUT's page, its own module: the board, the canvas from home, PROGRESS,
// TEST and PAUSE, the LCD, the zoom, the reference, the Library; the shared
// modules imported, so a fix of the run reaches every tab, and ALU-CUT's
// alu.js untouched. No TRACE. Since 2026-10-13 TAPE's paints, straight: the
// sausages in rows across the lanes, MARKS where they go, DRAG in three keys,
// the Result.
//
// A rectangle's mm: from the canvas's bottom left corner, x right, y up, as a
// ruler reads them. The board's canvas mm from its centre, as ALU's: x right,
// y down; the board, as on Test: mm from Here — the canvas's centre — X up, Y
// right.

import { fmt } from './util.js';
import { reach, homeCorner } from './machine.js';
import { plotRun, homeBlocks, DEFAULTS, ELBOW_HOVER, SPEED_MAX, sweepOf } from './strokes.js';
import { cornerDots, TEST_MARGIN, NO_DIP } from './band.js';
import { cleanRect, planOf, dragRows, dragPasses, dragSvg, acrossOf, alongOf, pitchOf, LANES_MAX, LANES_NEW, OFF, MIN_SIDE, DIR_NAME, EDGE_NAME, MODES,
  ROWS_MAX, CCD_META, DENSITY_NEW, MARKS_DIP, MARK_SPEED, DS, newPattern, recolour, lanesKept, rowsOf, stripesAcross, sausagesOf, markOf, marksRows, mixRect, reachOf, placeOf } from './ccdplan.js';
import { TAPE_PAINTS, PAINT, newPalette } from './tapeplan.js';
import { CANVAS_FIELDS as FIELDS, canvasNow, setCanvas, onCanvas } from './canvas.js';
import { segments, sticks } from './lcd.js';
import { lampSwitch, themeColor } from './lamp.js';
import { cupOf, cupProblem, dipAt } from './ink.js';
import './ui.js';

const $ = s => document.querySelector(s);
const TAB = 'ccd', TAB_NAME = 'CCD', KEY = 'rembrandt.ccd.v01', REF_KEY = 'rembrandt.ccd.ref';
const fin = v => Number.isFinite(v);

// ---------- state ----------
// The rectangles in the order they run; the chosen one; the tool. The brush
// across the run, DRAG's speed, how far before the paint's edge it lands and
// past the far edge it lifts (est.); the flights and the tail as ALU's.
const S = {
  rects: [], sel: 0, tool: 'edit', mode: 'air',                                      // mode: the DRAG key last pressed, the LCD's numbers
  brush: 10, drag: 60, before: 0, past: 0, travel: 180, tail: 3,
  boardW: 500, boardH: 700, edgeLeft: 50, edgeBottom: 0,
  refOpacity: 30,
  view: 'drag', density: DENSITY_NEW, paint: 'black', ink: true,                   // the paints (2026-10-13): the view; the paint in a sausage; M's paint; INK, MARKS' watercolour and TEST's dip
};
const NUM = ['sel', 'brush', 'drag', 'before', 'past', 'boardW', 'boardH', 'edgeLeft', 'edgeBottom', 'refOpacity', 'density'];
const TOOLS = ['edit', 'rect', 'paint'], VIEWS = ['drag', 'result'];
let FRESH = true;   // nothing kept yet: a rectangle the whole canvas
function load() {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (!o) return;
    for (const k of NUM) if (fin(o[k])) S[k] = o[k];
    if (Array.isArray(o.rects)) S.rects = o.rects.map(cleanRect).filter(Boolean);
    if (TOOLS.includes(o.tool)) S.tool = o.tool;
    if (MODES.includes(o.mode)) S.mode = o.mode;
    if (VIEWS.includes(o.view)) S.view = o.view;
    if (typeof o.ink === 'boolean') S.ink = o.ink;
    if (PAINT[o.paint]) S.paint = o.paint;
    S.sel = Math.max(0, Math.min(S.rects.length - 1, Math.round(S.sel)));
    FRESH = false;
  } catch { }
}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { } };
const wholeCanvas = (o = {}) => cleanRect({ x: 0, y: 0, w: S.boardW, h: S.boardH, dir: o.dir, lanes: o.lanes });

// ---------- the plan (ccdplan.js) ----------
const po = () => ({ cw: S.boardW, ch: S.boardH, brush: S.brush, before: S.before, past: S.past });
let PL = null, plKey = '';
function planNow() {
  for (const r of S.rects) if (r.pat) r.lanes = lanesKept(r, S.brush);              // a pattern keeps its genesis's pitch: bigger, more lanes, the genesis repeated
  const key = JSON.stringify([S.rects, S.boardW, S.boardH, S.brush, S.before, S.past]);
  if (PL && key === plKey) return PL;
  plKey = key; PL = planOf(S.rects, po());
  return PL;
}

// ---------- the cup, for TEST, and the canvas from home ----------
let INK = {};
const cup = () => cupOf(INK);
async function loadInk() {
  try { const r = await fetch('/ink', { cache: 'no-store' }); INK = r.ok ? await r.json() : {}; } catch { INK = {}; }
}
const hereNow = () => { const R = reach(); return { x: R.x.min + S.edgeBottom + S.boardH / 2, y: R.y.min + S.edgeLeft + S.boardW / 2 }; };
const dipCup = () => { const c = cup(), d = dipAt(c); return d ? { ...c, x: d.x, y: d.y } : c; };

// ---------- the run: DRAG, the snake or through the air ----------
// Two keys (the owner, 2026-10-11: "two DRAG keys — the snake and through the
// air; on ALU-CUT we made a switch, here it is all simple"): the snake, a
// rectangle's lanes back and forth with the brush down; the air, a row a
// lane, one way. A pause before every next rectangle (ccdplan.js,
// dragPasses); PAUSE at a lane's end, never on the line, as ALU's DRAG.
const RUNS = {}, MODE_NAME = { snake: 'snake', air: 'air', duo: 'Duo' };   // the LCD's last line, short
let busy = false;
const EMPTY = { blocks: [], rows: [], seconds: 0, length: 0, carriage: null, runs: 0, mm: 0, stops: 0, fault: '' };
const runOpts = rows => ({ ...DEFAULTS, speed: S.drag, travel: S.travel, tail: S.tail, lift: false, ink: false, snake: true, pause: false, rows, here: hereNow(), cup: dipCup(), noDipUnder: NO_DIP, hover: ELBOW_HOVER });
function dragRun(mode = S.mode) {
  const P = planNow(), here = hereNow(), key = JSON.stringify([plKey, S.drag, S.travel, S.tail, here]);
  if (RUNS[mode]?.key === key) return RUNS[mode];
  const R = dragRows(P, { ...po(), mode });
  RUNS[mode] = { key, ...(R.ps.length ? { ...plotRun({ ...runOpts(R.ps.length), pauseAtEnds: true }, dragPasses(R)), rows: R.info, runs: R.runs, mm: R.length, stops: R.stops.length } : EMPTY) };
  return RUNS[mode];
}
// MARKS: a dash a sausage, with INK ON in watercolour from the cup (ccdplan.js, marksRows) — a dip every MARKS_DIP-th, its own
let MARKS_RUN = null;
function marksRun() {
  const P = planNow(), here = hereNow(), cupNow = dipCup(), key = JSON.stringify([plKey, S.ink, S.travel, here, cupNow]);
  if (MARKS_RUN?.key === key) return MARKS_RUN;
  const R = marksRows(P, { ...po(), ink: S.ink });
  MARKS_RUN = { key, ...(R.ps.length ? { ...plotRun({ ...runOpts(R.ps.length), speed: MARK_SPEED, ink: S.ink, noDipUnder: 0 }, [{ key: 'MARKS', ps: R.ps, why: null }]), rows: R.info, marks: R.marks } : { ...EMPTY, marks: 0 }) };
  return MARKS_RUN;
}

// ---------- the board ----------
// The canvas and home, not the whole image area: a 20 × 20 canvas fills the
// stage; the walls drawn where they come into it.
const cv = $('#cv'), ctx = cv.getContext('2d'), stage = $('#stage'), board = $('#board');
let g = ctx;   // the context drawn on: the board's, or a PNG's for the Library
const PAD = 30;
function view() {
  const hw = S.boardW / 2, hh = S.boardH / 2, v = { x0: -hh - PAD, x1: hh + PAD, y0: -hw - PAD, y1: hw + PAD };
  for (const r of S.rects) {                                                         // a rectangle past the canvas's edge, its handles too
    v.y0 = Math.min(v.y0, r.x - hw - 12); v.y1 = Math.max(v.y1, r.x + r.w - hw + 12);
    v.x0 = Math.min(v.x0, r.y - hh - 12); v.x1 = Math.max(v.x1, r.y + r.h - hh + 12);
  }
  const h = hereNow(), hc = homeCorner(), q = { x: hc.x - h.x, y: hc.y - h.y };    // home: the canvas lies from it
  v.x0 = Math.min(v.x0, q.x - 24); v.x1 = Math.max(v.x1, q.x + 24); v.y0 = Math.min(v.y0, q.y - 24); v.y1 = Math.max(v.y1, q.y + 48);
  return v;
}
function areaNow() {
  const h = hereNow(), R = reach();
  return { x0: R.x.min - h.x, x1: R.x.max - h.x, y0: R.y.min - h.y, y1: R.y.max - h.y, R };
}
let V = view(), k = 1, dpr = 1, kFit = 1;
const sx = p => (p[0] - V.y0) * k, sy = p => (V.x1 + p[1]) * k;                   // canvas mm from its centre → the screen: across is Y, down the picture is −X
const scr = q => [sx([q[0] - S.boardW / 2]), sy([0, S.boardH / 2 - q[1]])];       // canvas mm from its bottom left corner, y up → the screen
const toCanvas = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / k + V.y0, (e.clientY - r.top) / k - V.x1]; };
const toMm = e => { const c = toCanvas(e); return [c[0] + S.boardW / 2, S.boardH / 2 - c[1]]; };
// a context set to draw in canvas mm from its bottom left corner, y up: its lines' widths in mm too (no text: it would stand on its head)
const inMm = c => { c.setTransform(k * dpr, 0, 0, -k * dpr, (-S.boardW / 2 - V.y0) * k * dpr, (V.x1 + S.boardH / 2) * k * dpr); return c; };
const ZOOMS = [0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8];
let Z = 1, ZC = null;   // the zoom; the window's centre, null: the canvas's
function layout() {
  const F = view(), r = stage.getBoundingClientRect(), m = r.width < 600 ? 10 : 36, sw = F.y1 - F.y0, sh = F.x1 - F.x0;
  const ps = $('#paints').getBoundingClientRect(), side = ps.height >= r.height - 1;          // the paints' strip by the Tools, or two rows of 12 under the board on an upright phone (style.css), as TAPE's
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
const ORANGE = '#EB7A25', GROUND = '#FBFAF7';
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
  g.fillStyle = GROUND; g.fillRect(sx([-hw]), sy([0, -hh]), S.boardW * k, S.boardH * k);   // the canvas
  g.save(); g.beginPath(); g.rect(sx([-hw]), sy([0, -hh]), S.boardW * k, S.boardH * k); g.clip();   // past the walls: hatched
  g.beginPath(); g.rect(0, 0, W, H); areaRect(); g.clip('evenodd');
  g.strokeStyle = 'rgba(179,71,12,.45)'; g.lineWidth = 1;
  for (let d = -H; d < W; d += 7) { g.beginPath(); g.moveTo(d, H); g.lineTo(d + H, 0); g.stroke(); }
  g.restore();
  if (S.view === 'result') drawResult(); else { drawLanes(); drawSausages(); }
  if (REF && S.refOpacity > 0) {                                                       // the reference as tracing paper
    const img = REF.img, s = Math.min(S.boardW / img.naturalWidth, S.boardH / img.naturalHeight), w = img.naturalWidth * s, h = img.naturalHeight * s;
    g.globalAlpha = S.refOpacity / 100; g.drawImage(img, sx([-w / 2]), sy([0, -h / 2]), w * k, h * k); g.globalAlpha = 1;
  }
  g.strokeStyle = 'rgba(36,34,31,.8)'; g.lineWidth = 1; g.strokeRect(sx([-hw]) + .5, sy([0, -hh]) + .5, S.boardW * k - 1, S.boardH * k - 1);
  {                                                                                    // the walls: dashed orange, where they come into the board
    g.save(); g.strokeStyle = ORANGE; g.lineWidth = 1.2; g.setLineDash([6, 4]); g.beginPath(); areaRect(); g.stroke(); g.restore();
  }
  g.font = font(10); g.fillStyle = '#B3470C'; g.textAlign = 'left';
  g.fillText(`canvas ${S.boardW} × ${S.boardH} mm`, sx([-hw]), sy([0, -hh]) - 6);
  const h = hereNow(), msx = q => (q.y - V.y0) * k, msy = q => (V.x1 - q.x) * k, ink = themeColor('--ink', '#24221F');
  g.save(); g.strokeStyle = 'rgba(36,34,31,.55)'; g.lineWidth = 1;                     // TEST's dots: a small cross each, 20 mm in from the corners
  for (const d of cornerDots(S.boardW, S.boardH).dots) { const X = msx(d.at), Y = msy(d.at); g.beginPath(); g.moveTo(X - 5, Y); g.lineTo(X + 5, Y); g.moveTo(X, Y - 5); g.lineTo(X, Y + 5); g.stroke(); }
  g.restore();
  const hc = homeCorner(), home = { x: hc.x - h.x, y: hc.y - h.y }, hX = msx(home), hY = msy(home);   // home: the canvas lies from it
  g.strokeStyle = ink; g.lineWidth = 1.2; g.strokeRect(hX - 4, hY - 4, 8, 8); g.fillStyle = ink; g.textAlign = 'left'; g.fillText('home', hX + 8, hY - 6);
  if (g === ctx) guides();
  drawTrail();
}

// ---------- the lanes ----------
// Every lane as the brush lays it, its width a faint strip — where they
// overlap darker, white where they leave a gap; its centre line, an orange
// dot where the brush lands and the lanes' numbers when there is room; the
// edge the paint is squeezed along, and an arrow the way the brush goes.
function drawLanes() {
  const P = planNow();
  g.save(); inMm(g); g.lineCap = 'butt'; g.lineWidth = S.brush;
  for (const r of P.rects) {                                                         // fainter the deeper they overlap: a mid grey at most, the arrow over it read
    const deep = r.runs.length > 1 ? Math.max(1, S.brush / Math.max(r.pitch, 1e-3)) : 1;
    g.strokeStyle = `rgba(36,34,31,${Math.min(0.12, 0.45 / deep).toFixed(4)})`;
    for (const ln of r.runs) { g.beginPath(); g.moveTo(ln.a[0], ln.a[1]); g.lineTo(ln.b[0], ln.b[1]); g.stroke(); }
  }
  g.restore();
  g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (const r of P.rects) {
    const n = r.runs.length, ppx = (n > 1 ? r.pitch : acrossOf(r)) * k, up = r.dir === 'up';
    if (ppx >= 3) {                                                                    // the centre lines
      g.strokeStyle = 'rgba(36,34,31,.4)'; g.lineWidth = 1;
      for (const ln of r.runs) { const a = scr(ln.a), b = scr(ln.b); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    }
    {                                                                                  // the paint's edge, orange
      const a = scr([r.x, r.y]), b = scr(up ? [r.x + r.w, r.y] : [r.x, r.y + r.h]);
      g.strokeStyle = 'rgba(235,122,37,.75)'; g.lineWidth = 3; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
    }
    if (ppx >= 4) { g.fillStyle = ORANGE; for (const ln of r.runs) { const a = scr(ln.a); g.beginPath(); g.arc(a[0], a[1], 2, 0, 7); g.fill(); } }
    const step = ppx >= 14 ? 1 : ppx * 5 >= 16 ? 5 : ppx * 10 >= 16 ? 10 : ppx * 50 >= 16 ? 50 : 0;   // the lanes' numbers, as there is room
    g.fillStyle = themeColor('--mute', '#7D776D'); g.font = font(9); g.textAlign = up ? 'center' : 'right'; g.textBaseline = up ? 'top' : 'middle';
    for (const ln of r.runs) if (ln.n === 1 || ln.n === n || (step && ln.n % step === 0 && (n - ln.n) * ppx >= 14)) { const a = scr(ln.a); g.fillText(String(ln.n), a[0] - (up ? 0 : 6), a[1] + (up ? 6 : 0)); }
    const c = scr([r.x + r.w / 2, r.y + r.h / 2]), L = Math.min(44, 0.4 * (up ? r.h : r.w) * k);   // the way the brush goes
    if (L >= 14) {
      const d = up ? [0, -1] : [1, 0], t = [c[0] - d[0] * L / 2, c[1] - d[1] * L / 2], e = [c[0] + d[0] * L / 2, c[1] + d[1] * L / 2], w = Math.min(7, L / 3);
      g.strokeStyle = 'rgba(36,34,31,.55)'; g.lineWidth = 2; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(t[0], t[1]); g.lineTo(e[0], e[1]); g.moveTo(e[0] - d[0] * w - d[1] * w, e[1] - d[1] * w + d[0] * w); g.lineTo(e[0], e[1]); g.lineTo(e[0] - d[0] * w + d[1] * w, e[1] - d[1] * w - d[0] * w); g.stroke();
    }
  }
  g.restore();
}
// The sausages on Drag, where to squeeze them: each a box of its paint, a
// dark edge so a light one reads; MARKS' dashes under them in watercolour,
// as wide as the brush
const WATER = '#6F8FB8';
function drawSausages() {
  const P = planNow();
  g.save(); inMm(g); g.lineCap = 'round';
  for (const r of P.rects) {
    const ss = sausagesOf(r, S.brush); if (!ss.length) continue;
    g.strokeStyle = WATER; g.globalAlpha = 0.28; g.lineWidth = S.brush;
    for (const q of ss) { const m = markOf(q, S.brush), a = placeOf(r, m.t, m.c0), b = placeOf(r, m.t, m.c1); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    g.globalAlpha = 1; g.lineWidth = Math.max(0.25, 1 / k); g.strokeStyle = 'rgba(36,34,31,.75)';
    for (const q of ss) {
      const a = placeOf(r, q.a, q.c0), b = placeOf(r, q.b, q.c1), x = Math.min(a[0], b[0]), y = Math.min(a[1], b[1]), w = Math.abs(b[0] - a[0]), h = Math.abs(b[1] - a[1]);
      g.fillStyle = PAINT[q.paint].hex; g.fillRect(x, y, w, h); g.strokeRect(x, y, w, h);
    }
  }
  g.restore();
}
// The Result: every rectangle's sausages dragged as the DRAG key chosen runs
// them (ccdplan.js, mixRect), drawn once into a bitmap the canvas's size —
// every lane its grooves, a shade lighter or darker, each stretch its colour
// as covered as the paint got there, the dry brush's streaks wandering ±STREAK
// about every STREAK_MM; the ground where none did. Lanes in their order, the
// later over the earlier where they overlap.
let RESULT = null;
const STREAK = 0.12, STREAK_MM = 15;                                               // est., TAPE's
const RGROUND = [251, 250, 247];                                                   // GROUND
const hash = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const wave = (t, s) => { const u = t / STREAK_MM + hash(s, 7) * 50, f = Math.floor(u), x = u - f, e = x * x * (3 - 2 * x); return hash(f, s) * (1 - e) + hash(f + 1, s) * e; };
function resultBitmap() {
  const P = planNow(), key = JSON.stringify([plKey, S.density, S.mode]);
  if (RESULT?.key === key) return RESULT;
  const W = S.boardW, H = S.boardH, ppm = Math.min(8, 4096 / Math.max(W, H)), c2 = document.createElement('canvas');
  c2.width = Math.ceil(W * ppm); c2.height = Math.ceil(H * ppm);
  const c = c2.getContext('2d');
  c.setTransform(ppm, 0, 0, -ppm, 0, H * ppm);                                       // canvas mm from its bottom left corner, y up
  c.fillStyle = GROUND; c.fillRect(0, 0, W, H);
  c.lineCap = 'butt'; c.lineJoin = 'round';
  for (const r of P.rects) {
    if (!r.pat) continue;                                                            // no sausages, no paint
    const M = mixRect(r, { brush: S.brush, before: S.before, past: S.past, density: S.density, mode: S.mode });
    for (const ln of M.lanes) ln.grooves.forEach((q, j, Gs) => {
      const off = ((j + 0.5) / Gs.length - 0.5) * S.brush, kk = 1 + q.shade, seed = ln.k * 13 + j + r.i * 977;
      c.lineWidth = S.brush / Gs.length * 1.25;
      let style = null;
      for (let i = 0; i < M.n; i++) {
        const t = M.t0 + i * DS, cov = Math.min(1, q.cover[i]);
        if (cov < 0.03) { if (style) c.stroke(); style = null; continue; }
        const nz = kk * (1 + STREAK * (2 * wave(t, seed) - 1));
        const st = `rgb(${[0, 1, 2].map(m => Math.round(Math.max(0, Math.min(255, RGROUND[m] + (q.rgb[3 * i + m] * 255 * nz - RGROUND[m]) * cov)) / 4) * 4).join(',')})`;
        const p = placeOf(r, t, ln.c + off);
        if (st !== style) {
          const was = style; if (was) c.stroke();
          style = st; c.strokeStyle = st; c.beginPath();
          const p0 = was ? placeOf(r, t - DS, ln.c + off) : p; c.moveTo(p0[0], p0[1]);   // on from the stretch before, no seam
        }
        c.lineTo(p[0], p[1]);
      }
      if (style) c.stroke();
    });
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
// The guides: every rectangle's outline, the chosen one orange with its eight
// handles; its number and lanes; its size while it is drawn or stretched.
const HANDLE_PX = 9;
function handlesOf(r) {
  const out = [];
  for (const hx of [-1, 0, 1]) for (const hy of [-1, 0, 1]) if (hx || hy) out.push({ hx, hy, at: [r.x + (hx + 1) / 2 * r.w, r.y + (hy + 1) / 2 * r.h] });
  return out;
}
function guides() {
  g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.font = font(10); g.textBaseline = 'alphabetic';
  S.rects.forEach((r, i) => {
    const on = i === S.sel, a = scr([r.x, r.y + r.h]), b = scr([r.x + r.w, r.y]);
    g.strokeStyle = on ? ORANGE : 'rgba(36,34,31,.55)'; g.lineWidth = on ? 1.5 : 1; g.setLineDash(on ? [] : [4, 3]);
    g.strokeRect(a[0], a[1], b[0] - a[0], b[1] - a[1]); g.setLineDash([]);
    g.fillStyle = on ? '#B3470C' : themeColor('--mute', '#7D776D'); g.textAlign = 'left';    // inside its top left corner: the canvas's name stands over it
    g.fillText(`${i + 1} ${r.dir === 'right' ? '→' : '↑'} ${r.lanes}`, a[0] + 6, a[1] + 15);
    if (on && grab && grab.kind !== 'move') { g.textAlign = 'right'; g.fillText(`${fmt(r.w, 1)} × ${fmt(r.h, 1)} mm`, b[0], a[1] - 5); }
  });
  const r = S.rects[S.sel];
  if (r && !(grab?.kind === 'new')) for (const q of handlesOf(r)) {
    const s = scr(q.at); g.fillStyle = '#FBFAF7'; g.strokeStyle = ORANGE; g.lineWidth = 1.4; g.fillRect(s[0] - 3.5, s[1] - 3.5, 7, 7); g.strokeRect(s[0] - 3.5, s[1] - 3.5, 7, 7);
  }
  g.restore();
}

// ---------- the run as it goes (ALU's) ----------
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
  const B = RUN || dragRun().blocks, h = hereNow(), at = st.x_mm !== null && st.y_mm !== null ? { x: st.x_mm, y: st.y_mm } : null;
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
const UNDO_KEYS = ['rects', 'sel', 'brush', 'drag', 'before', 'past', 'density'];
let undoStack = [], redoStack = [];
const snapshot = () => JSON.stringify(Object.fromEntries(UNDO_KEYS.map(q => [q, S[q]])));
function undoPush() { undoStack.push(snapshot()); if (undoStack.length > 200) undoStack.shift(); redoStack = []; }
function restore(js) { Object.assign(S, JSON.parse(js)); settle(); }
function undo() { if (!undoStack.length) return; redoStack.push(snapshot()); restore(undoStack.pop()); }
function redo() { if (!redoStack.length) return; undoStack.push(snapshot()); restore(redoStack.pop()); }

// ---------- the tools on the board ----------
// Edit: a rectangle dragged moves, its handles stretch it — a corner both
// ways, a side one — a click chooses it. Rectangle: a drag lays a new one.
// The edges snap to the canvas's and to the other rectangles' within a few
// pixels, else to half a mm.
const SNAP_PX = 8, half = v => Math.round(v * 2) / 2;
const clampX = v => Math.max(-OFF, Math.min(S.boardW + OFF, v)), clampY = v => Math.max(-OFF, Math.min(S.boardH + OFF, v));
const edgesOf = (axis, skip) => [0, axis === 'x' ? S.boardW : S.boardH, ...S.rects.flatMap((r, i) => i === skip ? [] : axis === 'x' ? [r.x, r.x + r.w] : [r.y, r.y + r.h])];
function snapTo(v, axis, skip) {
  let best = null;
  for (const q of edgesOf(axis, skip)) if (Math.abs(q - v) <= SNAP_PX / k && (best === null || Math.abs(q - v) < Math.abs(best - v))) best = q;
  return best ?? half(v);
}
function snapMove(v, size, axis, skip) {                                           // a moved rectangle: either of its edges snaps
  let best = null;
  for (const q of edgesOf(axis, skip)) for (const d of [q - v, q - v - size]) if (Math.abs(d) <= SNAP_PX / k && (best === null || Math.abs(d) < Math.abs(best))) best = d;
  return best === null ? half(v) : v + best;
}
function nearHandle(e) {
  const r = S.rects[S.sel]; if (!r) return null;
  const rc = cv.getBoundingClientRect(), mx = e.clientX - rc.left, my = e.clientY - rc.top;
  let best = null;
  for (const q of handlesOf(r)) { const s = scr(q.at), d = Math.hypot(s[0] - mx, s[1] - my); if (d <= HANDLE_PX && (!best || d < best.d)) best = { ...q, d }; }
  return best;
}
const inRect = (r, p) => p[0] >= r.x && p[0] <= r.x + r.w && p[1] >= r.y && p[1] <= r.y + r.h;
function rectAt(p) {                                                               // the chosen one first, then the one on top
  if (S.rects[S.sel] && inRect(S.rects[S.sel], p)) return S.sel;
  for (let i = S.rects.length - 1; i >= 0; i--) if (inRect(S.rects[i], p)) return i;
  return -1;
}
const CURSOR = { '-1,-1': 'nesw-resize', '1,1': 'nesw-resize', '-1,1': 'nwse-resize', '1,-1': 'nwse-resize', '-1,0': 'ew-resize', '1,0': 'ew-resize', '0,-1': 'ns-resize', '0,1': 'ns-resize' };
let grab = null;
// M (the owner's sausages by hand): a click on a stripe at a row — the
// genesis's sausage there takes the chosen paint, so every repeat of it
// does; with that paint already, it goes. A rectangle with no pattern gets
// its stripes first, no paint in them.
const localOf = (r, p) => r.dir === 'right' ? { t: p[0] - r.x, c: p[1] - r.y } : { t: p[1] - r.y, c: p[0] - r.x };
function laneOfC(r, c) { const pp = pitchOf(r, S.brush); return r.lanes === 1 || acrossOf(r) <= S.brush || !pp ? 0 : Math.max(0, Math.min(r.lanes - 1, Math.round((c - S.brush / 2) / pp))); }
function paintAt(p) {
  const i = rectAt(p); if (i < 0) return;
  undoPush(); S.sel = i;
  const r = S.rects[i];
  if (!r.pat) r.pat = newPattern(r, S.brush, null, Math.floor(Math.random() * 1e9));
  const { t, c } = localOf(r, p), k = laneOfC(r, c), st = stripesAcross(r).find(q => q.k0 <= k && k <= q.k1), row = rowsOf(r).reduce((a, q) => Math.abs(q.t - t) < Math.abs(a.t - t) ? q : a);
  if (!st) { undoStack.pop(); return; }
  const cell = r.pat.paint[st.s];
  cell[row.j] = cell[row.j] === S.paint ? null : S.paint;
  settle();
}
// The sausage's name under the pointer on Drag, as TAPE's drops'
function sausageUnder(p) {
  const P = planNow();
  for (let i = P.rects.length - 1; i >= 0; i--) {
    const r = P.rects[i], { t, c } = localOf(r, p);
    for (const q of sausagesOf(r, S.brush)) if (t >= q.a - 1.5 && t <= q.b + 1.5 && c >= q.c0 && c <= q.c1) return q;
  }
  return null;
}
function showTip(e) {
  const tip = $('#spokeTip'), q = S.view === 'drag' && !grab ? sausageUnder(toMm(e)) : null;
  if (!q) { tip.hidden = true; return; }
  const pt = PAINT[q.paint], rb = board.getBoundingClientRect();
  tip.innerHTML = `<i style="background:${pt.hex}"></i>${pt.name}${q.thin ? ' <em>thin</em>' : ''} <em>· lanes ${q.k0 + 1}${q.k1 > q.k0 ? `–${q.k1 + 1}` : ''}</em>`;
  tip.hidden = false;
  const X = e.clientX - rb.left, Y = e.clientY - rb.top, w = tip.offsetWidth;
  tip.style.left = `${X + 14 + w > rb.width ? X - 14 - w : X + 14}px`; tip.style.top = `${Math.max(0, Y - 30)}px`;
}
cv.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') $('#spokeTip').hidden = true; });
cv.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'mouse') showTip(e);                                          // on the phone a tap names the sausage
  if (e.button !== 0) return;
  if (S.tool === 'paint') { paintAt(toMm(e)); return; }
  const p = toMm(e), hd = nearHandle(e);
  if (hd) { undoPush(); grab = { kind: 'size', hx: hd.hx, hy: hd.hy, r0: { ...S.rects[S.sel] }, moved: false }; cv.setPointerCapture(e.pointerId); return; }
  if (S.tool === 'rect') {
    undoPush();
    const x = clampX(snapTo(p[0], 'x', -1)), y = clampY(snapTo(p[1], 'y', -1)), was = S.rects[S.sel];
    S.rects.push(cleanRect({ x, y, w: MIN_SIDE, h: MIN_SIDE, dir: was?.dir, lanes: was?.lanes ?? LANES_NEW })); S.sel = S.rects.length - 1;
    grab = { kind: 'new', ax: x, ay: y, moved: false }; cv.setPointerCapture(e.pointerId); kick(); return;
  }
  const i = rectAt(p);
  if (i >= 0) { undoPush(); S.sel = i; grab = { kind: 'move', from: p, r0: { ...S.rects[i] }, moved: false }; cv.setPointerCapture(e.pointerId); showRects(); kick(); }
});
cv.addEventListener('pointermove', e => {
  if (!grab) {
    const hd = S.tool === 'paint' ? null : nearHandle(e);
    cv.style.cursor = hd ? CURSOR[`${hd.hx},${hd.hy}`] : S.tool === 'rect' || S.tool === 'paint' ? 'crosshair' : rectAt(toMm(e)) >= 0 ? 'move' : '';
    showTip(e);
    return;
  }
  grab.moved = true; busy = true;
  const p = toMm(e), r = S.rects[S.sel], r0 = grab.r0;
  if (grab.kind === 'move') {
    r.x = clampX(snapMove(r0.x + p[0] - grab.from[0], r.w, 'x', S.sel)); r.y = clampY(snapMove(r0.y + p[1] - grab.from[1], r.h, 'y', S.sel));
  } else {
    // the side or the corner under the pointer follows it, the other stays; through it, the box turns over
    const ax = grab.kind === 'new' ? grab.ax : grab.hx < 0 ? r0.x + r0.w : r0.x, ay = grab.kind === 'new' ? grab.ay : grab.hy < 0 ? r0.y + r0.h : r0.y;
    if (grab.kind === 'new' || grab.hx) { const x = clampX(snapTo(p[0], 'x', S.sel)); r.x = Math.min(ax, x); r.w = Math.max(MIN_SIDE, Math.abs(x - ax)); }
    if (grab.kind === 'new' || grab.hy) { const y = clampY(snapTo(p[1], 'y', S.sel)); r.y = Math.min(ay, y); r.h = Math.max(MIN_SIDE, Math.abs(y - ay)); }
  }
  kick();
});
const drop = () => {
  if (!grab) return;
  const was = grab; grab = null;
  if (was.kind === 'new') {
    const r = S.rects[S.sel];
    if (!was.moved || r.w < 2 || r.h < 2) { S.rects.pop(); S.sel = Math.max(0, S.rects.length - 1); undoStack.pop(); }   // a click, not a drag: nothing laid
    else S.tool = 'edit';                                                            // laid: its handles at once
  } else if (!was.moved) undoStack.pop();
  settle();
};
cv.addEventListener('pointerup', drop); cv.addEventListener('pointercancel', drop);
function moveRect(dx, dy) { const r = S.rects[S.sel]; if (!r) return; undoPush(); r.x = clampX(r.x + dx); r.y = clampY(r.y + dy); settle(); }
function deleteRect() { if (!S.rects[S.sel]) return; undoPush(); S.rects.splice(S.sel, 1); S.sel = Math.max(0, S.sel - 1); settle(); }
function clearAll() { if (!S.rects.length) return; undoPush(); S.rects = []; S.sel = 0; S.tool = 'rect'; settle(); }
function setTool(t) { S.tool = t; if (t === 'paint') S.view = 'drag'; settle(); }   // M: the sausages are on Drag

const HINT = {
  edit: 'Edit: drag a rectangle to move it, its handles to stretch it — left and right, up and down; a click chooses it; the arrows move it a mm, with ⇧ ten; ⌫ takes it away. Its edges snap to the canvas\'s and the other rectangles\'.',
  rect: 'Rectangle: drag on the canvas to lay a new one — it runs after the others, its lanes and direction the chosen one\'s; then its handles stretch it.',
  paint: 'M: a click on a stripe of lanes puts a sausage of the chosen paint at the row nearest — in the genesis, so on every repeat of it; a click with the paint it has takes it away. A paint: the strip on the left.',
};
$('#btnUndo').onclick = undo; $('#btnRedo').onclick = redo; $('#btnClear').onclick = clearAll;
document.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => setTool(b.dataset.tool));
addEventListener('keydown', e => {
  if (e.key === 'Escape') post('/run/stop');                                         // Esc = STOP, as on every tab with a run
  if (e.target.matches('input,select,textarea')) return;
  const cmd = e.metaKey || e.ctrlKey;
  if (cmd && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (cmd) return;
  if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); deleteRect(); return; }
  const tool = { v: 'edit', r: 'rect', m: 'paint' }[e.key.toLowerCase()];
  if (tool) { setTool(tool); return; }
  const arrow = { ArrowUp: [0, 1], ArrowDown: [0, -1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];   // y up: ↑ moves it up
  if (arrow) { e.preventDefault(); const d = e.shiftKey ? 10 : 1; moveRect(arrow[0] * d, arrow[1] * d); }
});

// The zoom (ALU's): − 100% +, ⌘− ⌘0 ⌘+; a pinch zooms where it is, two fingers move the board.
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
// The rectangles and the chosen one's: its direction, its lanes, its place and
// size by the ruler; the brush; the canvas from home; the file.
const BRUSH_SL = [['brush', 'Brush width', 'mm', 0.5, 0.5, 50], ['drag', 'Drag speed', 'mm/s', 5, 10, SPEED_MAX], ['before', 'Lands before the paint\'s edge', 'mm', 0.5, 0, 30], ['past', 'Lifts past the far edge', 'mm', 0.5, 0, 30]];
const SL_TITLE = { brush: 'The brush across the run: a lane\'s width', drag: 'The dry brush along a lane', before: 'How far outside the rectangle, before the edge the paint is squeezed along, the brush lands', past: 'How far past the rectangle\'s far edge it runs before it lifts' };
const valOf = key => key === 'drag' ? `${S.drag} mm/s` : `${fmt(S[key], 1)} mm`;
$('#slBrush').innerHTML = BRUSH_SL.map(([key, label, , step, min, max]) => `<label class="sl" title="${SL_TITLE[key]}"><span class="slh"><span>${label}</span><span class="val" data-v="${key}"></span></span><input class="slider" type="range" data-k="${key}" min="${min}" max="${max}" step="${step}"></label>`).join('');
$('#slBrush').querySelectorAll('input').forEach(inp => {
  inp.oninput = () => { if (!busy) undoPush(); busy = true; S[inp.dataset.k] = +inp.value; showPanel(); showRect(); kick(); };
  inp.onchange = () => settle();
});
const gapText = r => r.runs.length < 2 ? 'one lane' : r.gap > 0.05 ? `white <b>${fmt(r.gap, 2)} mm</b> between them` : r.gap < -0.05 ? `overlapping by <b>${fmt(-r.gap, 2)} mm</b>` : 'edge to edge';
// the rows' reading: how many, how far apart — the genesis's spacing when it repeats
const rowsText = r => r.rows === 1 ? '1 · the paint\'s edge only' : `${r.rows} · ${fmt((r.pat?.along ?? alongOf(r)) / (r.rows - 1), 1)} mm apart`;
// the genesis and its repeat on this rectangle
function genesisText(r) {
  const q = r.pat; if (!q) return '';
  const nx = r.lanes / q.lanes, ny = alongOf(r) / q.along, times = v => Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : fmt(v, 1);
  return `<br>Genesis ${fmt(q.across, 0)} × ${fmt(q.along, 0)} mm, ${q.lanes} lanes${nx > 1.02 || ny > 1.02 ? ` — here ×${times(nx)} across, ×${times(ny)} along, at its scale` : ''}`;
}
// a pattern's rows changed: its paints dealt again, its stripes kept; none to deal, its sausages kept where the rows still are
function reRows(r) {
  if (!r.pat) return;
  const pal = palOf(r);
  r.pat = pal ? recolour(r.pat, r.rows, pal, r.pat.seed) : { ...r.pat, paint: r.pat.paint.map(row => Array.from({ length: r.rows }, (_, j) => row[j] ?? null)) };
}
// The rectangles, in the order they run, a key each; the chosen one's editor
function showRects() {
  $('#rects').innerHTML = S.rects.length ? S.rects.map((r, i) => `<button class="tog${i === S.sel ? ' on' : ''}" data-sel="${i}" title="${DIR_NAME[r.dir]}, ${r.lanes} lanes, ${fmt(r.w, 1)} × ${fmt(r.h, 1)} mm">${r.dir === 'right' ? '→' : '↑'} Rect ${i + 1} · ${r.lanes}</button>`).join('') : '<span class="none">No rectangles: New, or the R tool and a drag on the canvas.</span>';
  $('#rects').querySelectorAll('[data-sel]').forEach(b => b.onclick = () => { S.sel = +b.dataset.sel; save(); showRects(); kick(); });
  showRect();
}
const R_FIELDS = [['x', 'Left →', 'Its left edge, mm right of the canvas\'s'], ['y', 'Bottom ↑', 'Its bottom edge, mm above the canvas\'s'], ['w', 'Width', 'Left to right'], ['h', 'Height', 'Bottom to top']];
function showRect() {
  const box = $('#rectEdit'), r = S.rects[S.sel];
  if (!r) { box.innerHTML = ''; return; }
  const pl = planNow().rects[S.sel];
  box.innerHTML = `
    <h4>Rectangle ${S.sel + 1} · ${fmt(r.w, 1)} × ${fmt(r.h, 1)} mm</h4>
    <div class="toggles looks"><button class="tog${r.dir === 'up' ? ' on' : ''}" data-dir="up" title="Every lane from the bottom edge up: the paint squeezed along the bottom edge">Vertical ↑</button><button class="tog${r.dir === 'right' ? ' on' : ''}" data-dir="right" title="Every lane from the left edge to the right: the paint squeezed along the left edge">Horizontal →</button></div>
    <div class="sliders"><label class="sl" title="How many lanes the brush runs across the rectangle, edge to edge, 1 … ${LANES_MAX}; the pitch follows${r.pat ? ' — with sausages, their pattern laid anew on the rectangle as it is: its genesis' : ''}"><span class="slh"><span>Lanes</span><span class="val" id="o-rL">${r.lanes} · ${fmt(pl?.pitch ?? 0, 2)} mm apart</span></span><input class="slider" type="range" id="rL" min="1" max="${LANES_MAX}" step="1" value="${r.lanes}"></label>
      <label class="sl" title="The rows of sausages along the lanes, evenly from the paint's edge to the far one, both edges in; one: the paint's edge only (the owner, 2026-10-13: four on the 20 × 20, two in the middle and at both edges)"><span class="slh"><span>Rows</span><span class="val" id="o-rR">${rowsText(r)}</span></span><input class="slider" type="range" id="rR" min="1" max="${ROWS_MAX}" step="1" value="${r.rows}"></label></div>
    <p class="read" id="rGap">${pl ? gapText(pl) : ''}${pl && pl.runs.length > 1 && acrossOf(r) <= S.brush ? ' — the brush is as wide as the rectangle: every lane on its middle' : ''}${genesisText(r)}</p>
    <div class="grid4">${R_FIELDS.map(([q, l, t]) => `<label title="${t}">${l} <input data-r="${q}" type="number" step="0.5"${q === 'w' || q === 'h' ? ` min="${MIN_SIDE}"` : ''}><em>mm</em></label>`).join('')}</div>
    <div class="grid4 keys"><button class="btn" id="rFit" title="This rectangle the whole canvas">Whole canvas</button><button class="btn" id="rDup" title="A copy of it, run after the others">Duplicate</button></div>
    <div class="grid4 keys three"><button class="btn" id="rEarly"${S.sel === 0 ? ' disabled' : ''} title="Run before the one before it">Run earlier</button><button class="btn" id="rLate"${S.sel === S.rects.length - 1 ? ' disabled' : ''} title="Run after the one after it">Run later</button><button class="btn" id="rDel" title="Take it away — or ⌫ on the keyboard; ⌘Z brings it back">Delete</button></div>`;
  box.querySelectorAll('[data-r]').forEach(inp => { inp.value = Math.round(r[inp.dataset.r] * 100) / 100; inp.onchange = () => {
    const v = +inp.value; if (inp.value === '' || !fin(v)) return settle();
    undoPush(); r[inp.dataset.r] = inp.dataset.r === 'x' ? clampX(v) : inp.dataset.r === 'y' ? clampY(v) : v; Object.assign(r, cleanRect(r)); settle();
  }; });
  const inp = $('#rL'), rows = $('#rR');
  inp.oninput = () => {
    if (!busy) undoPush(); busy = true; r.lanes = +inp.value;
    if (r.pat) r.pat = newPattern(r, S.brush, palOf(r), r.pat.seed);                  // the genesis anew, on the rectangle as it is
    const q = planNow().rects[S.sel]; $('#o-rL').textContent = `${r.lanes} · ${fmt(q.pitch, 2)} mm apart`; $('#rGap').innerHTML = gapText(q) + genesisText(r); kick();
  };
  inp.onchange = () => settle();
  rows.oninput = () => { if (!busy) undoPush(); busy = true; r.rows = +rows.value; reRows(r); $('#o-rR').textContent = rowsText(r); kick(); };
  rows.onchange = () => settle();
  const act = (sel, fn) => box.querySelectorAll(sel).forEach(b => b.onclick = () => { undoPush(); fn(b); settle(); });
  act('[data-dir]', b => { r.dir = b.dataset.dir; });
  act('#rFit', () => { Object.assign(r, { x: 0, y: 0, w: S.boardW, h: S.boardH }); });
  act('#rDup', () => { S.rects.push(structuredClone(r)); S.sel = S.rects.length - 1; });   // its pattern its own
  act('#rEarly', () => { const i = S.sel; [S.rects[i], S.rects[i - 1]] = [S.rects[i - 1], S.rects[i]]; S.sel--; });
  act('#rLate', () => { const i = S.sel; [S.rects[i], S.rects[i + 1]] = [S.rects[i + 1], S.rects[i]]; S.sel++; });
  $('#rDel').onclick = deleteRect;
}
$('#btnNew').onclick = () => { undoPush(); const was = S.rects[S.sel]; S.rects.push(wholeCanvas({ dir: was?.dir, lanes: was?.lanes })); S.sel = S.rects.length - 1; S.tool = 'edit'; settle(); };
$('#btnDraw').onclick = () => setTool('rect');

// ---------- the paints (the owner, 2026-10-13: TAPE's, "only here they go straight") ----------
// The strip of the owner's 24 paints by the Tools, as TAPE's: a click picks
// the paint and takes up M. The chosen rectangle's palette in hand: a paint
// in the list, then one in the strip — it takes its place; + then a paint —
// it joins, the sausages dealt again in their places; × — out.
$('#paints').innerHTML = TAPE_PAINTS.map(([id, name, hex]) => `<div class="chip" data-paint="${id}"><button class="sw" style="background:${hex}" aria-label="${name}"></button><span class="cnt"></span></div>`).join('');
$('#paints').querySelectorAll('[data-paint]').forEach(ch => ch.querySelector('.sw').onclick = () => {
  if (EDIT) { editPaint(ch.dataset.paint); return; }
  S.paint = ch.dataset.paint; setTool('paint');
});
let EDIT = null;                                                                   // { mode: 'change', id } | { mode: 'add' }
const seedNew = () => Math.floor(Math.random() * 1e9);
const usedOf = r => [...new Set((r?.pat?.paint || []).flat().filter(Boolean))];
const palOf = r => r?.pat?.palette ? structuredClone(r.pat.palette) : usedOf(r).length ? { name: 'Own', core: usedOf(r), accent: [] } : null;
// a rectangle's sausages dealt again in a palette, their places kept — or, none lying or anew, the pattern laid on it as it is: its genesis
function dealOn(r, pal, seed, anew = false) { r.pat = r.pat && !anew ? recolour(r.pat, r.rows, pal, seed) : newPattern(r, S.brush, pal, seed); }
function editPaint(id) {
  const e = EDIT, r = S.rects[S.sel]; EDIT = null;
  if (!r?.pat) { showPanel(); return; }
  undoPush();
  if (e.mode === 'change' && e.id !== id) {
    const swap = a => [...new Set(a.map(q => q === e.id ? id : q))], pal = r.pat.palette;
    r.pat.paint = r.pat.paint.map(row => row.map(q => q === e.id ? id : q));
    if (pal) { const core = swap(pal.core); r.pat.palette = { ...pal, core, accent: swap(pal.accent).filter(q => !core.includes(q)) }; }
  } else if (e.mode === 'add') {
    const pal = palOf(r) || { name: 'Own', core: [], accent: [] };
    if (![...pal.core, ...pal.accent].includes(id)) { pal.core.push(id); dealOn(r, pal, r.pat.seed || 1); }
  }
  settle();
}
function dropPaint(id) {
  const r = S.rects[S.sel]; if (!r?.pat) return;
  undoPush();
  const pal = palOf(r); pal.core = pal.core.filter(q => q !== id); pal.accent = pal.accent.filter(q => q !== id);
  if (!pal.core.length && pal.accent.length) pal.core = pal.accent.splice(0);
  if (pal.core.length) dealOn(r, pal, r.pat.seed || 1);
  else { r.pat.palette = null; r.pat.paint = r.pat.paint.map(row => row.map(q => q === id ? null : q)); }
  settle();
}
$('#paintList').onclick = e => {
  const x = e.target.closest('[data-x]'), add = e.target.closest('[data-add]'), pl = e.target.closest('[data-pl]');
  if (x) { EDIT = null; dropPaint(x.dataset.x); return; }
  if (add) EDIT = EDIT?.mode === 'add' ? null : { mode: 'add' };
  else if (pl) EDIT = EDIT?.mode === 'change' && EDIT.id === pl.dataset.pl ? null : { mode: 'change', id: pl.dataset.pl };
  showPanel();
};
$('#paintInfo').onclick = () => { $('#paintRead').hidden = !$('#paintRead').hidden; $('#paintInfo').classList.toggle('on', !$('#paintRead').hidden); };
$('#btnPaintsClear').onclick = () => { const r = S.rects[S.sel]; if (!r?.pat) return; undoPush(); delete r.pat; settle(); };
// New colours, TAPE's: a palette at random, another family than the last; the sausages lying there take it, or the pattern is laid
$('#btnNewColours').onclick = () => { const r = S.rects[S.sel]; if (!r) return; undoPush(); const seed = seedNew(); dealOn(r, newPalette(seed, r.pat?.palette?.name), seed); S.view = 'result'; settle(); };
// New spokes: the pattern anew on the rectangle as it is — its genesis — in the palette as it is
$('#btnNewSpokes').onclick = () => { const r = S.rects[S.sel]; if (!r) return; undoPush(); const seed = seedNew(); dealOn(r, palOf(r) || newPalette(seed), seed, true); S.view = 'result'; settle(); };
// meta 1 … 4: the owner's ideals as palettes (ccdplan.js, CCD_META) — a press a new deal in it, the sausages in their places
document.querySelectorAll('#metaKeys [data-meta]').forEach(b => b.onclick = () => { const r = S.rects[S.sel]; if (!r) return; undoPush(); const seed = seedNew(); dealOn(r, structuredClone(CCD_META[b.dataset.meta]), seed); S.view = 'result'; settle(); });
// Density: the paint in a sausage, as far as it carries the line (ccdplan.js, reachOf)
const REACH = new Map(), reachAt = d => { if (!REACH.has(d)) REACH.set(d, reachOf(d)); return REACH.get(d); };
const densityText = () => `${S.density} % · full ≈ ${fmt(reachAt(S.density).full, 0)} mm`;
$('#slPaint').innerHTML = `<label class="sl" title="The paint in a sausage: at 50 % the measured one — the line full 70 mm, then fading (TAPE-colors/IMAGE 2026-10-12 19:23:33); twice as much every 25 % (the Result; est.)"><span class="slh"><span>Density</span><span class="val" id="o-dens"></span></span><input class="slider" type="range" id="dens" min="0" max="100" step="1"></label>`;
$('#dens').oninput = e => { if (!busy) undoPush(); busy = true; S.density = +e.target.value; $('#o-dens').textContent = densityText(); kick(); };
$('#dens').onchange = () => settle();
document.querySelectorAll('#views [data-view]').forEach(b => b.onclick = () => { S.view = b.dataset.view; $('#spokeTip').hidden = true; save(); showPanel(); kick(); });
document.querySelectorAll('#modeKeys [data-mode]').forEach(b => b.onclick = () => { S.mode = b.dataset.mode; settle(); });
$('#ink').onchange = e => { S.ink = e.target.checked; settle(); };
$('#inkOff').onclick = () => { S.ink = false; settle(); };
$('#inkOn').onclick = () => { S.ink = true; settle(); };
// the chosen rectangle's paints in sight: the strip's counts, the list, the keys
function showPaints() {
  const r = S.rects[S.sel], ss = r ? sausagesOf(planNow().rects[S.sel], S.brush) : [], pal = r?.pat?.palette, count = {};
  for (const q of ss) count[q.paint] = (count[q.paint] || 0) + 1;
  $('#paintsOf').textContent = r ? `Rect ${S.sel + 1}` : '';
  $('#paints').querySelectorAll('[data-paint]').forEach(ch => {
    const q = PAINT[ch.dataset.paint], n = count[q.id] || 0;
    ch.querySelector('.cnt').textContent = n || '';
    ch.classList.toggle('pick', S.tool === 'paint' && q.id === S.paint);
    ch.title = `${q.name} — its colour off your swatch (est.)${n ? `, ${n} sausage${n === 1 ? '' : 's'} on rectangle ${S.sel + 1}` : ''} — a click: the paint of the next sausage (M)`;
  });
  const inUse = [...new Set([...(pal ? [...pal.core, ...pal.accent] : []), ...usedOf(r)])], thin = id => pal?.accent.includes(id) && !pal.core.includes(id);
  $('#paintList').innerHTML = inUse.map(id => `<span class="pl${count[id] ? '' : ' none'}${EDIT?.id === id ? ' on' : ''}" data-pl="${id}" title="${PAINT[id].name}${thin(id) ? ', thin' : ''} — a click, then a paint in the strip: it takes its place"><i style="background:${PAINT[id].hex}"></i>${PAINT[id].name}${thin(id) ? ' <em>thin</em>' : ''}${count[id] ? ` <em>×${count[id]}</em>` : ''}<b class="x" data-x="${id}" title="Take ${PAINT[id].name} out">×</b></span>`).join('')
    + (inUse.length ? `<span class="pl add${EDIT?.mode === 'add' ? ' on' : ''}" data-add title="Add a paint: then click it in the strip on the left">+</span>` : '');
  $('#paints').classList.toggle('editing', !!EDIT);
  document.querySelectorAll('#metaKeys [data-meta]').forEach(b => b.classList.toggle('on', pal?.name === b.dataset.meta));
  if (document.activeElement !== $('#dens')) $('#dens').value = S.density;
  $('#o-dens').textContent = densityText();
  const rowsN = r ? rowsOf(r).length : 0;
  $('#paintRead').innerHTML = [
    'The sausages, where you squeeze the paints: in rows across the lanes, a stripe of 1, 2, 3 or 6 lanes each. New colours: a palette at random, the sausages staying in their places — or, none lying, the pattern laid. New spokes: the pattern anew on the rectangle as it is, its genesis. M and a paint in the strip: a click on a stripe at a row. A bigger rectangle repeats the genesis at its scale: its pitch kept, its lanes more.',
    r?.pat && `<b>${ss.length}</b> sausage${ss.length === 1 ? '' : 's'} on rectangle ${S.sel + 1}, ${rowsN} row${rowsN === 1 ? '' : 's'} along it${genesisText(r)}`,
    `Density ${S.density} %: a sausage keeps the line full about ${fmt(reachAt(S.density).full, 0)} mm, gone by ${fmt(reachAt(S.density).gone, 0)}${S.density === DENSITY_NEW ? ' — the measure, TAPE-colors/IMAGE 2026-10-12 19:23:33' : ' (est.; 50 % the measure)'}`,
    pal && `Palette <b>${pal.name}</b>: ${pal.core.map(id => PAINT[id].name).join(', ')}${pal.accent.length ? `; thin: ${pal.accent.map(id => PAINT[id].name).join(', ')}` : ''} · seed ${r.pat.seed}`,
    !r?.pat && 'No sausages yet: New colours, New spokes, a meta key, or M.',
  ].filter(Boolean).join('<br>');
}
$('#fields').innerHTML = FIELDS.map(([key, label, unit, step, title, any]) => `<label title="${title}">${label} <input data-k="${key}" type="number" step="${step}"${any ? '' : ` min="${step}"`}><em>${unit}</em></label>`).join('');
$('#fields').querySelectorAll('input').forEach(inp => inp.onchange = () => {
  const v = +inp.value, any = FIELDS.find(f => f[0] === inp.dataset.k)[5];
  if (inp.value !== '' && fin(v) && (any || v > 0)) { S[inp.dataset.k] = v; setCanvas(S); }   // the canvas: one base for every tab (canvas.js)
  settle();
});
$('#planInfo').onclick = () => { $('#planRead').hidden = !$('#planRead').hidden; $('#planInfo').classList.toggle('on', !$('#planRead').hidden); };
function showPanel() {
  for (const [key] of BRUSH_SL) {
    const inp = $(`#slBrush input[data-k="${key}"]`); if (document.activeElement !== inp) inp.value = S[key];
    $(`#slBrush [data-v="${key}"]`).textContent = valOf(key);
  }
  document.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === S.tool));
  $('#fields').querySelectorAll('input').forEach(inp => { if (document.activeElement !== inp) inp.value = S[inp.dataset.k]; });
  $('#hint').textContent = EDIT ? (EDIT.mode === 'add' ? 'Add a paint to the palette: click it in the strip on the left (+ again: leave it).' : `Change ${PAINT[EDIT.id].name}: click the paint to put in its place in the strip on the left (${PAINT[EDIT.id].name} in the list again: leave it).`) : HINT[S.tool];
  const on = (sel, attr, v) => document.querySelectorAll(sel).forEach(b => b.classList.toggle('on', b.dataset[attr] === v));
  on('#views [data-view]', 'view', S.view); on('#modeKeys [data-mode]', 'mode', S.mode);
  $('#ink').checked = S.ink; $('#inkOff').classList.toggle('on', !S.ink); $('#inkOn').classList.toggle('on', S.ink);
  showPaints();
}
const what = () => `${S.rects.length} rectangle${S.rects.length === 1 ? '' : 's'}`;
// Settled: the mouse let go, a slider let go — the plan, the reading, the LCD.
function settle() {
  busy = false;
  if (S.sel >= S.rects.length) S.sel = Math.max(0, S.rects.length - 1);
  const P = planNow(), D = dragRun('air'), Ds = dragRun('snake'), Dd = dragRun('duo'), Mk = marksRun(), here = hereNow(), lines = [];
  lines.push(!P.rects.length ? 'No rectangles: New, or the R tool and a drag on the canvas.' : `<b>${P.rects.length}</b> rectangle${P.rects.length === 1 ? '' : 's'} · <b>${P.runs}</b> lanes at ${S.drag} mm/s · DRAG <b>Snake</b>: the brush landing ${Ds.runs} time${Ds.runs === 1 ? '' : 's'}, ${fmt(Ds.mm / 1000, 1)} m with the steps across, ≈ ${fmt(Ds.seconds / 60, 0)} min (est.) · DRAG <b>Air</b>: landing ${D.runs} times, ${fmt(D.mm / 1000, 1)} m, ≈ ${fmt(D.seconds / 60, 0)} min with the flights back (est.) · DRAG <b>Duo</b>: landing ${Dd.runs} times, ${fmt(Dd.mm / 1000, 1)} m, ≈ ${fmt(Dd.seconds / 60, 0)} min (est.)`);
  if (Mk.marks) lines.push(`MARKS: <b>${Mk.marks}</b> dash${Mk.marks === 1 ? '' : 'es'}, a sausage each, ${S.ink ? `in watercolour, ${Mk.dips} dip${Mk.dips === 1 ? '' : 's'} (one every ${MARKS_DIP})` : 'Ink OFF: no dip'}, at ${MARK_SPEED} mm/s, ≈ ${fmt(Mk.seconds / 60, 1)} min (est.)`);
  for (const r of P.rects) lines.push(`Rect ${r.i + 1}: ${DIR_NAME[r.dir]}, <b>${r.runs.length}</b> lanes ${fmt(r.pitch, 2)} mm apart, ${gapText(r)}; the paint along its ${EDGE_NAME[r.dir]} edge, ${fmt(acrossOf(r), 1)} mm`);
  if (D.stops) lines.push(`DRAG stops <b>${D.stops}</b> time${D.stops === 1 ? '' : 's'}, before every next rectangle: wipe the brush, squeeze its paint, Continue`);
  lines.push(`The canvas from home: its bottom left corner at carriage <b>X ${fmt(here.x - S.boardH / 2, 1)} · Y ${fmt(here.y - S.boardW / 2, 1)} mm</b>; TEST's dots ${TEST_MARGIN} mm in from its edges.`);
  $('#planRead').innerHTML = lines.join(' · ');
  const warn = [D.fault && `The plan is wrong, DRAG Air will not run it: ${D.fault}.`, Ds.fault && `The plan is wrong, DRAG Snake will not run it: ${Ds.fault}.`, Dd.fault && `The plan is wrong, DRAG Duo will not run it: ${Dd.fault}.`, Mk.fault && `The plan is wrong, MARKS will not run it: ${Mk.fault}.`, walls(D), walls(Mk)].filter(Boolean);
  $('#planWarn').innerHTML = warn.map(w => `<span class="warn">${w}</span>`).join(' ');
  $('#planWarn').hidden = !warn.length;
  $('#stats').textContent = !P.rects.length ? 'no rectangles' : `${what()} · ${P.runs} lanes${Mk.marks ? ` · ${Mk.marks} sausages · MARKS ≈ ${fmt(Mk.seconds / 60, 1)} min` : ''} · DRAG Snake ≈ ${fmt(Ds.seconds / 60, 0)} min · Air ≈ ${fmt(D.seconds / 60, 0)} min · Duo ≈ ${fmt(Dd.seconds / 60, 0)} min (est.)`;
  showFiles();
  showPanel(); showRects(); save(); layout(); lastLcd && lcd(lastLcd);
}
function walls(P_) {
  const h = hereNow();
  if (!P_?.carriage || !P_.rows.length) return '';
  const R = reach(), b = P_.carriage, x0 = h.x + b.x0, x1 = h.x + b.x1, y0 = h.y + b.y0, y1 = h.y + b.y1;
  const out = [x0 < R.x.min && `${fmt(R.x.min - x0, 0)} mm past the bottom wall`, x1 > R.x.max && `${fmt(x1 - R.x.max, 0)} mm past the top wall`,
    y0 < R.y.min && `${fmt(R.y.min - y0, 0)} mm past the left wall`, y1 > R.y.max && `${fmt(y1 - R.y.max, 0)} mm past the right wall`].filter(Boolean);
  return out.length ? `The brush would go ${out.join(', ')}: move the canvas or the rectangles.` : '';
}
// The file, as ALU's: the lanes as an SVG in canvas mm, a <path> a lane in running order. Saved to Downloads.
function showFiles() {
  const name = `ccd_drag.svg`, box = $('#files');
  box.innerHTML = `<button class="tog" data-file="drag" title="${name}">Drag</button>`;
  box.querySelector('[data-file]').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([dragSvg(planNow(), po())], { type: 'image/svg+xml' })); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000); $('#fileRead').textContent = `saved ${name}`;
  };
}

// ---------- the reference: tracing paper over the canvas (ALU's) ----------
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
  $('#refRead').innerHTML = REF ? `${esc(REF.name)} · <b>${S.refOpacity} %</b>` : 'Over the canvas, the whole of it inside, to lay the rectangles to.';
}
$('#btnRef').onclick = () => $('#refIn').click();
$('#refIn').onchange = e => { const f = e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => setRef(rd.result, f.name, true); rd.readAsDataURL(f); e.target.value = ''; };
$('#refOp').oninput = e => { S.refOpacity = +e.target.value; syncRef(); save(); kick(); };
function loadRef() { try { const o = JSON.parse(localStorage.getItem(REF_KEY) || 'null'); if (o && o.src) setRef(o.src, o.name || 'reference', false); } catch { } }

// ---------- 💾 SAVE CCD ----------
// As ALU's: an SVG of the canvas in mm — the rectangles and their lanes — the
// whole state in its metadata, a PNG preview; on the tests' shelf, its label
// CCD: the Library opens it here.
const label = () => `${TAB_NAME} · ${what()} · ${planNow().runs} lanes · ${S.boardW} × ${S.boardH} mm · brush ${fmt(S.brush, 1)} mm`;
function svgOf() {
  const W = S.boardW, H = S.boardH, f = v => (Math.round(v * 100) / 100).toFixed(2), P = planNow();
  const meta = JSON.stringify({ rembrandt: '1.0.7', [TAB]: true, label: label(), settings: S }).replace(/&/g, '\\u0026').replace(/</g, '\\u003c').replace(/--/g, '- -');
  const rects = P.rects.map(r => `  <rect x="${f(r.x)}" y="${f(H - r.y - r.h)}" width="${f(r.w)}" height="${f(r.h)}" data-dir="${r.dir}" data-lanes="${r.runs.length}"/>`).join('\n');
  const lanes = P.rects.flatMap(r => r.runs.map(ln => `  <line x1="${f(ln.a[0])}" y1="${f(H - ln.a[1])}" x2="${f(ln.b[0])}" y2="${f(H - ln.b[1])}"/>`)).join('\n');
  const sausages = P.rects.flatMap(r => sausagesOf(r, S.brush).map(q => { const a = placeOf(r, q.a, q.c0), b = placeOf(r, q.b, q.c1); return `  <rect x="${f(Math.min(a[0], b[0]))}" y="${f(H - Math.max(a[1], b[1]))}" width="${f(Math.abs(b[0] - a[0]))}" height="${f(Math.abs(b[1] - a[1]))}" fill="${PAINT[q.paint].hex}" data-paint="${q.paint}" data-rect="${r.i + 1}"${q.thin ? ' data-thin="1"' : ''}/>`; })).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}">
<!-- Rembrandt v.1.0.7 · ${esc(label())}; 1 unit = 1 mm, y down; DRAG's lanes in running order -->
<metadata id="rembrandt-test">${meta}</metadata>
<rect width="${W}" height="${H}" fill="${GROUND}" stroke="#24221F" stroke-width="0.5"/>
<g id="lanes" stroke="#24221F" stroke-opacity="0.12" stroke-width="${f(S.brush)}">
${lanes}
</g>
<g id="rects" fill="none" stroke="#EB7A25" stroke-width="0.5">
${rects}
</g>
<g id="sausages" stroke="#24221F" stroke-width="0.2">
${sausages}
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
    localStorage.setItem(KEY, JSON.stringify(o.settings)); setCanvas(o.settings); load(); Object.assign(S, canvasNow(S)); settle();   // the save's canvas becomes the base
    $('#saveState').textContent = `opened · ${file.slice(0, 13)}:${file.slice(14)}`;
  } catch { $('#saveState').textContent = 'could not open it from the Library'; }
}

// ---------- the deck: TEST, DRAG, PAUSE (ALU's) ----------
const post = async path => { try { const r = await fetch(path, { method: 'POST' }); return await r.text(); } catch { return 'start rembrandt.py'; } };
let RUN_KEY = null;
async function start(key, blocks, info, log) {
  try {
    RUN = blocks; RUN_INFO = info; RUN_KEY = key;
    const r = await fetch('/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blocks, log }) });   // the run journal, rembrandt.py
    $('#runState').textContent = await r.text();
  } catch { $('#runState').textContent = 'start rembrandt.py'; }
}
async function runDrag(mode) {
  settle();
  const D = dragRun(mode), P = planNow(), first = P.rects[0], snake = mode === 'snake', sausages = P.rects.some(r => r.pat);
  if (!D.rows.length) { $('#runState').innerHTML = '<span class="warn">Nothing to run: no rectangles on the canvas.</span>'; return; }
  if (walls(D)) { $('#runState').innerHTML = `<span class="warn">${walls(D)}</span>`; return; }
  if (D.fault) { $('#runState').innerHTML = `<span class="warn">Not run: the plan is wrong — ${D.fault}.</span>`; return; }
  const text = `${D.stops ? `${D.stops + 1} rectangles: squeeze the first one's paint only now; DRAG stops ${D.stops} time${D.stops > 1 ? 's' : ''}, before every next rectangle, for you to wipe the brush and squeeze its paint, then Continue.\n\n` : ''}`
    + (snake ? `${P.runs} lanes back and forth with the brush down, a step across at each end: the brush lands ${D.runs} time${D.runs === 1 ? '' : 's'}, once a rectangle; ${fmt(D.mm / 1000, 1)} m with the dry brush, no dip`
      : mode === 'duo' ? `${P.runs} lanes, each in two halves: from the far edge to the middle, the brush lifting there and flying back to the next lane — the ${first.dir === 'right' ? 'right' : 'top'} half first — then from the paint's edge to the middle; the brush lands ${D.runs} times, ${fmt(D.mm / 1000, 1)} m with the dry brush, no dip`
      : `${P.runs} lanes, each one way: the brush lands at the paint's edge, runs to the far edge, lifts and flies back; ${fmt(D.mm / 1000, 1)} m with the dry brush, no dip`)
    + `, at ${S.drag} mm/s, ≈ ${fmt(D.seconds / 60, 0)} min (est.).\n\n${sausages ? 'Are the sausages squeezed on their marks, as Drag shows them?' : `Is the paint squeezed along rectangle 1's ${EDGE_NAME[first.dir]} edge?`}`;
  if (!confirm(`DRAG ${mode.toUpperCase()} ${TAB_NAME}, ${what()}: ${text}`)) return;
  S.mode = mode; settle();
  await start(mode, D.blocks, { seconds: D.seconds, rows: D.rows },
    { page: TAB, pass: 'drag', mode, label: label(), settings: S, here: hereNow(), estimate_s: Math.round(D.seconds) });
}
$('#btnSnake').onclick = () => runDrag('snake');
$('#btnAir').onclick = () => runDrag('air');
$('#btnDuo').onclick = () => runDrag('duo');
// MARKS: a dash a sausage, then the owner squeezes them on the dashes
$('#btnMarks').onclick = async () => {
  await loadInk(); settle();
  const M = marksRun(), P = planNow();
  if (!M.marks) { $('#runState').innerHTML = '<span class="warn">Nothing to mark: no sausages — New colours, New spokes, a meta key, or M.</span>'; return; }
  if (S.ink && cupProblem(cup())) { $('#runState').innerHTML = `<span class="warn">MARKS dips in the cup with INK ON: ${cupProblem(cup())}</span>`; return; }
  if (M.fault) { $('#runState').innerHTML = `<span class="warn">Not run: the plan is wrong — ${M.fault}.</span>`; return; }
  if (walls(M)) { $('#runState').innerHTML = `<span class="warn">${walls(M)}</span>`; return; }
  const rows = P.rects.reduce((a, r) => a + (r.pat ? rowsOf(r).length : 0), 0);
  if (!confirm(`MARKS ${TAB_NAME}: ${M.marks} dashes, a sausage each, in ${rows} row${rows === 1 ? '' : 's'} — ${S.ink ? `in watercolour from the cup, a dip every ${MARKS_DIP}, ${M.dips} dip${M.dips === 1 ? '' : 's'}` : 'Ink OFF: no dip, the dry brush'} — at ${MARK_SPEED} mm/s, ≈ ${fmt(M.seconds / 60, 1)} min (est.).\n\nThen squeeze the sausages on the dashes, as Drag shows them. Is the brush in the holder?`)) return;
  S.view = 'drag'; settle();
  await start('marks', M.blocks, { seconds: M.seconds, rows: M.rows },
    { page: TAB, pass: 'marks', label: label(), settings: S, here: hereNow(), ...(S.ink ? { cup: cup() } : {}), estimate_s: Math.round(M.seconds) });
};
// TEST, before the runs (ALU's): with INK ON one dip in the cup, a dot 20 mm in from each corner of the board, and home.
function testRun() {
  const T = cornerDots(S.boardW, S.boardH);
  return T.dots.length ? { ...plotRun({ ...runOpts(T.dots.length), ink: S.ink }, T.passes), dots: T.dots } : null;
}
$('#btnTest').onclick = async () => {
  await loadInk(); settle();
  const here = hereNow(), T = testRun();
  if (!T) { $('#runState').innerHTML = `<span class="warn">No corners: the board is ${2 * TEST_MARGIN} mm or less across.</span>`; return; }
  if (S.ink && cupProblem(cup())) { $('#runState').innerHTML = `<span class="warn">TEST dips in the cup with INK ON: ${cupProblem(cup())}</span>`; return; }
  if (T.fault) { $('#runState').innerHTML = `<span class="warn">Not run: the test is wrong — ${T.fault}.</span>`; return; }
  const R = reach(), past = d => { const x = here.x + d.at.x, y = here.y + d.at.y; return [x < R.x.min && `${fmt(R.x.min - x, 0)} mm past the bottom wall`, x > R.x.max && `${fmt(x - R.x.max, 0)} mm past the top wall`, y < R.y.min && `${fmt(R.y.min - y, 0)} mm past the left wall`, y > R.y.max && `${fmt(y - R.y.max, 0)} mm past the right wall`].filter(Boolean).join(', '); };
  const out = T.dots.filter(d => past(d));
  if (!confirm(`TEST: ${S.ink ? 'one dip in the cup, then ' : ''}a dot ${TEST_MARGIN} mm in from each corner of the ${S.boardW} × ${S.boardH} board — ${T.dots.map(d => `${d.name} X ${fmt(here.x + d.at.x, 0)} · Y ${fmt(here.y + d.at.y, 0)}`).join(', ')} — and home.`
    + (out.length ? `\n\n${out.map(d => `${d.name}: ${past(d)}`).join('; ')} — its dot goes on the wall.` : ''))) return;
  await start('test', T.blocks, { seconds: T.seconds, rows: T.dots.map(d => ({ label: `TEST · ${d.name}` })) },
    { page: TAB, label: `${TAB_NAME} · TEST · the corners`, here, dots: T.dots.map(d => ({ name: d.name, x: +(here.x + d.at.x).toFixed(1), y: +(here.y + d.at.y).toFixed(1) })), ...(S.ink ? { cup: cup() } : {}), estimate_s: Math.round(T.seconds) });
};
// HOME: the brush up, the carriage home (strokes.js, homeBlocks)
$('#btnHome').onclick = () => start('home', homeBlocks(S.travel), { seconds: 0, rows: [{ label: 'HOME' }] }, { page: TAB, label: `${TAB_NAME} · HOME`, here: hereNow() });
let paused = false;
$('#btnPause').onclick = () => post(paused ? '/run/continue' : '/run/pause');
$('#btnStop').onclick = () => post('/run/stop');

// The LCD, as on ALU: DRAG's numbers while nothing runs.
const mmss = t => { t = Math.max(0, Math.round(t || 0)); return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
let started = null, lastLcd = null;
const KEY_NAME = { test: 'TEST', home: 'HOME', marks: 'MARKS', snake: 'DRAG SNAKE', air: 'DRAG AIR', duo: 'DRAG DUO' };
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
  $('#btnHome').disabled = !!live;                                                    // HOME when nothing runs: after STOP, or at the end
  document.querySelectorAll('.deck [data-pass], #btnTest').forEach(el => el.classList.toggle('on', !!live && (el.dataset.pass || 'test') === RUN_KEY));   // the running key stays down
  const now = waiting ? `❚❚ ${st.message}`
    : live && b?.home ? (RUN_KEY === 'home' ? 'HOME · the brush up, the carriage to home' : 'done · the carriage goes home, the brush off')
    : live && now0 && b?.dip ? `${now0} · the dip in the cup`
    : live && now0 ? now0 + (st.brush_on ? ' · brush on' : ' · brush off')
    : `${planNow().runs} lanes · ${what()} · ${MODE_NAME[S.mode]}`;
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
load(); Object.assign(S, canvasNow(S));                                          // the canvas from the base, every tab's (canvas.js)
if (FRESH) S.rects = [wholeCanvas()];                                             // a first visit: one rectangle, the whole canvas, vertical
onCanvas(c => { Object.assign(S, c); settle(); });                               // changed in another window
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
