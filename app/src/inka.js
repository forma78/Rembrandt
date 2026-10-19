// Rembrandt · INKA — Inca patterns (the owner, 2026-10-17, INKA/: "square,
// like Mexican rugs or chocolate bars"; "AIR is not needed, only DRAG, a
// solid line without a lift on one figure. If 6 tiles with beige, orange,
// ochre, pink and yellow — the brush goes on non-stop over the modules. First
// it paints the first square with a spiral, the second, the third … only when
// all six rectangles are painted the brush lifts and moves to the brown. Here
// the brush can be lifted up, so that I wipe it … then I press Continue and
// the brush paints the brown rectangle non-stop"). Its plan in inkaplan.js.
//
// CCD's page, its own module: the board, the canvas from home, the tiles as
// CCD's rectangles, PROGRESS, TEST and PAUSE, the LCD, the zoom, the paints'
// strip, MARKS, the reference, the Library; the shared modules imported, so
// a fix of the run reaches every tab, CCD's ccd.js untouched. DRAG one key;
// ▶ Play the run as ALU's ("add the button ■ Stop playing / Play the run,
// as it is made in ALU").
//
// ST-JOHN (stjohn.html, its body's data-tab): this page, and ⌘, St. John's
// Arms, in the Tools between R and N (the owner, 2026-10-19: "name the tab
// ST-JOHN and make it exactly like INKA, only in the tools between R and N
// we put ⌘"); its own keep and Library label.
//
// A tile's mm: from the canvas's bottom left corner, x right, y up, as a
// ruler reads them. The board's canvas mm from its centre, as CCD's.

import { fmt } from './util.js';
import { reach, homeCorner } from './machine.js';
import { plotRun, homeBlocks, DEFAULTS, ELBOW_HOVER, SPEED_MAX, sweepOf } from './strokes.js';
import { cornerDots, TEST_MARGIN, NO_DIP, DIP_LAP } from './band.js';
import { dragPasses, DENSITY_NEW, MARKS_DIP, MARK_SPEED, SAUSAGE_W, reachOf } from './ccdplan.js';
import { cleanRect, withIds, cleanNodes, snakeNodes, linksOf, planOf, dragRows, wipeBlocks, dragSvg, marksRows, markOf, simOf, sausagesOf, spokeAt, keepIn, dealFigure, dealFigures, paletteOfPixels, INKA_META, figName, lenOf, atPiece, JOHN as JOHN_KIND, isJohn, traceRows, TRACE_DIP, johnWidthNew, JOHN_W_MIN, JOHN_W_MAX,
  STEP_NEW, STEP_MIN, STEP_MAX, BRUSH_NEW, SWELL_NEW, trailOf as paintTrail, EDGE_OUT_NEW, edgeOf, OVERLAP_NEW, JOIN_NEW, CORNER_NEW, CHANGE_NEW, WIPE_NEW, OFF, MIN_SIDE } from './inkaplan.js';
import { TAPE_PAINTS, TO_BUY, PAINT, newPalette } from './tapeplan.js';
import { CANVAS_FIELDS as FIELDS, canvasNow, setCanvas, onCanvas } from './canvas.js';
import { segments, sticks } from './lcd.js';
import { lampSwitch, themeColor } from './lamp.js';
import { cupOf, cupProblem, dipAt, ELBOW_MAX } from './ink.js';
import './ui.js';

const $ = s => document.querySelector(s);
const JOHN = document.body.dataset.tab === 'stjohn';
const JOHN_CORNER = 100;   // ST-JOHN's Corners at first: a ⌘'s rings round, its windows too (the owner, 2026-10-19, Screenshot 9.27.36 PM: "the rings must be really round, not squares as now")
const TAB = JOHN ? 'stjohn' : 'inka', TAB_NAME = JOHN ? 'ST-JOHN' : 'INKA', KEY = `rembrandt.${TAB}.v01`, REF_KEY = `rembrandt.${TAB}.ref`;
const fin = v => Number.isFinite(v);

// ---------- state ----------
// The tiles in their order — a figure runs in the order of its first tile —
// the chosen one, the tool. The brush, and what the paint swells it by, DRAG's
// speed, the turns' radius, the S from ring to ring, how near tiles are one
// figure, how high the brush goes to be wiped; the flights and the tail as CCD's.
const S = {
  rects: [], sel: 0, tool: 'edit',
  brush: BRUSH_NEW, swell: SWELL_NEW, edgeOut: EDGE_OUT_NEW, overlap: OVERLAP_NEW, drag: 40, corner: JOHN ? JOHN_CORNER : CORNER_NEW, change: CHANGE_NEW, join: JOIN_NEW, wipe: WIPE_NEW, travel: 180, tail: 3,
  boardW: 500, boardH: 700, edgeLeft: 50, edgeBottom: 0,
  refOpacity: 30,
  view: 'drag', density: DENSITY_NEW, paint: 'brown', ink: true,                  // the view; the paint in a sausage; M's paint; INK, MARKS' watercolour and TEST's dip
  flights: false,                                                                    // the flights between figures on Drag (the owner, 2026-10-19: "I do not really need them")
  nodes: [], nodeSel: -1,                                                            // the brush's way by hand (inkaplan.js, linksOf); the node chosen
};
const NUM = ['sel', 'brush', 'swell', 'edgeOut', 'overlap', 'drag', 'corner', 'change', 'join', 'wipe', 'boardW', 'boardH', 'edgeLeft', 'edgeBottom', 'refOpacity', 'density'];
const TOOLS = ['edit', 'rect', ...(JOHN ? ['john'] : []), 'node', 'knife', 'paint'], VIEWS = ['drag', 'result'];
let FRESH = true, WIDTHLESS = false;   // nothing kept yet: the owner's paper test laid on the canvas
function load() {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (!o) return;
    for (const k of NUM) if (fin(o[k])) S[k] = o[k];
    if (Array.isArray(o.rects)) S.rects = withIds(o.rects.map(cleanRect).filter(Boolean));
    WIDTHLESS = Array.isArray(o.rects) && o.rects.some(r => isJohn(r) && !fin(r.width));   // a ⌘ kept before Width: its X laid again on its loop
    S.nodes = cleanNodes(o.nodes);
    if (TOOLS.includes(o.tool)) S.tool = o.tool;
    if (VIEWS.includes(o.view)) S.view = o.view;
    if (typeof o.ink === 'boolean') S.ink = o.ink;
    if (typeof o.flights === 'boolean') S.flights = o.flights;
    if (PAINT[o.paint]) S.paint = o.paint;
    S.sel = Math.max(0, Math.min(S.rects.length - 1, Math.round(S.sel)));
    FRESH = false;
  } catch { }
}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { } };
const newId = () => Math.max(0, ...S.rects.map(r => r.id ?? 0)) + 1;
const wholeCanvas = () => cleanRect({ id: newId(), x: 0, y: 0, w: S.boardW, h: S.boardH, step: S.rects[S.sel]?.step ?? STEP_NEW });
// The owner's paper test (personal_references/ IMG_1027, Screenshot 12.52.59
// PM) on the canvas: six tiles, two columns of three, and the "[" apart —
// four rectangles overlapping, one block — in the Inka palette
const r2 = v => Math.round(v * 2) / 2;
function paperTest() {
  const W = S.boardW, H = S.boardH, m = 0.1 * Math.min(W, H), t = Math.min((W - 2 * m) / 3.75, (H - 2 * m) / 3), x0 = (W - 3.75 * t) / 2, y0 = (H - 3 * t) / 2, bx = x0 + 2.45 * t, bw = 1.3 * t, bh = 3 * t;
  const rs = [];
  for (let c = 0; c < 2; c++) for (let r = 0; r < 3; r++) rs.push({ x: x0 + c * t, y: y0 + r * t, w: t, h: t });   // square tiles, two columns of three
  rs.push({ x: bx, y: y0, w: 0.42 * bw, h: bh }, { x: bx, y: y0 + 0.8 * bh, w: bw, h: 0.2 * bh }, { x: bx, y: y0, w: bw, h: 0.2 * bh }, { x: bx, y: y0 + 0.42 * bh, w: 0.7 * bw, h: 0.16 * bh });   // the "[": its bar, two arms, the tongue
  S.rects = withIds(rs.map(q => cleanRect({ x: r2(q.x), y: r2(q.y), w: r2(q.w), h: r2(q.h), step: STEP_NEW })));
  S.nodes = [];
  const P = planNow();
  for (const F of P.figs) dealOn(F, structuredClone(INKA_META.Inka), 1027 + F.n, 'colours');
  S.sel = 0;
}
// ST-JOHN's first visit: one ⌘ the whole canvas, in two paints of the Inka palette
function johnTest() {
  S.rects = withIds([cleanRect({ x: 0, y: 0, w: S.boardW, h: S.boardH, step: STEP_NEW, kind: JOHN_KIND })]);
  S.nodes = [];
  const F = planNow().figs[0];
  for (let seed = 1919; seed < 1960; seed++) { dealOn(F, structuredClone(INKA_META.Inka), seed, 'colours'); if (new Set(S.rects[0].ss.map(q => q.paint)).size > 1) break; }
  S.sel = 0;
}

// ---------- the plan (inkaplan.js) ----------
const po = () => ({ cw: S.boardW, ch: S.boardH, brush: S.brush, swell: S.swell, edgeOut: S.edgeOut, overlap: S.overlap, join: S.join, corner: S.corner, change: S.change, nodes: S.nodes });
const trail = () => paintTrail(po());   // what the brush lays with paint, swollen
let PL = null, plKey = '';
function planNow() {
  const key = JSON.stringify([S.rects.map(r => [r.id, r.x, r.y, r.w, r.h, r.step, r.turn, r.kind, r.width]), S.brush, S.swell, S.edgeOut, S.overlap, S.join, S.corner, S.change, S.nodes]);
  if (PL && key === plKey) return PL;
  plKey = key; PL = planOf(S.rects, po());
  return PL;
}
const figOfRect = i => planNow().figs.find(F => F.us.some(id => planNow().units[id].rs.includes(i)));
const unitOfRect = i => planNow().units.find(U => U.rs.includes(i));

// ---------- the cup, for TEST, and the canvas from home ----------
let INK = {};
const cup = () => cupOf(INK);
async function loadInk() {
  try { const r = await fetch('/ink', { cache: 'no-store' }); INK = r.ok ? await r.json() : {}; } catch { INK = {}; }
}
const hereNow = () => { const R = reach(); return { x: R.x.min + S.edgeBottom + S.boardH / 2, y: R.y.min + S.edgeLeft + S.boardW / 2 }; };
const dipCup = () => { const c = cup(), d = dipAt(c); return d ? { ...c, x: d.x, y: d.y } : c; };

// ---------- the run: DRAG, every figure one line ----------
// One key (the owner, 2026-10-17: "AIR is not needed, only DRAG"): a figure
// a row, one block, the brush down all the way, never a stop on it; before
// every next figure the brush up to S.wipe° over its start, a pause
// (inkaplan.js, wipeBlocks). PAUSE waits for the figure's end.
let busy = false;
const EMPTY = { blocks: [], rows: [], seconds: 0, length: 0, carriage: null, runs: 0, mm: 0, stops: 0, fault: '' };
const runOpts = rows => ({ ...DEFAULTS, speed: S.drag, travel: S.travel, tail: S.tail, lift: false, ink: false, snake: true, pause: false, rows, here: hereNow(), cup: dipCup(), noDipUnder: NO_DIP, hover: ELBOW_HOVER });
let DRAG_RUN = null;
function dragRun() {
  const P = planNow(), here = hereNow(), key = JSON.stringify([plKey, S.drag, S.travel, S.tail, S.wipe, here]);
  if (DRAG_RUN?.key === key) return DRAG_RUN;
  const R = dragRows(P, po());
  if (!R.ps.length) return (DRAG_RUN = { key, ...EMPTY });
  const r = plotRun({ ...runOpts(R.ps.length), pauseAtEnds: true }, dragPasses(R));
  DRAG_RUN = { key, ...r, blocks: wipeBlocks(r.blocks, S.wipe), rows: R.info, runs: R.runs, mm: R.length, stops: R.stops.length };
  return DRAG_RUN;
}
// MARKS: a dash along every sausage, with INK ON in watercolour from the cup — a dip every MARKS_DIP-th, CCD's
let MARKS_RUN = null;
function marksRun() {
  const P = planNow(), here = hereNow(), cupNow = dipCup(), key = JSON.stringify([plKey, S.rects.map(r => r.ss), S.ink, S.travel, here, cupNow]);
  if (MARKS_RUN?.key === key) return MARKS_RUN;
  const R = marksRows(P, S.rects, { ...po(), ink: S.ink });
  MARKS_RUN = { key, ...(R.ps.length ? { ...plotRun({ ...runOpts(R.ps.length), speed: MARK_SPEED, ink: S.ink, noDipUnder: 0 }, [{ key: 'MARKS', ps: R.ps, why: null }]), rows: R.info, marks: R.marks } : { ...EMPTY, marks: 0 }) };
  return MARKS_RUN;
}

// TRACE (ST-JOHN, in MARKS' place; inkaplan.js, traceRows): DRAG's own line,
// with INK ON in tinted water from the cup, a dip every TRACE_DIP mm, at
// DRAG's speed — the trace the owner squeezes the paint on, as Florian
let TRACE_RUN = null;
function traceRun() {
  const P = planNow(), here = hereNow(), cupNow = dipCup(), key = JSON.stringify([plKey, S.ink, S.drag, S.travel, S.tail, here, cupNow]);
  if (TRACE_RUN?.key === key) return TRACE_RUN;
  const R = traceRows(P, { ...po(), ink: S.ink, tail: S.tail });
  TRACE_RUN = { key, at: R.at, ...(R.ps.length ? { ...plotRun({ ...runOpts(R.ps.length), ink: S.ink, noDipUnder: 0 }, [{ key: 'TRACE', ps: R.ps, why: null }]), rows: R.info, stretches: R.ps.length, mm: R.info.reduce((a, q) => a + q.L, 0) } : { ...EMPTY, stretches: 0 }) };
  return TRACE_RUN;
}

// ---------- the board (CCD's) ----------
const cv = $('#cv'), ctx = cv.getContext('2d'), stage = $('#stage'), board = $('#board');
let g = ctx;   // the context drawn on: the board's, or a PNG's for the Library
const PAD = 30;
function view() {
  const hw = S.boardW / 2, hh = S.boardH / 2, v = { x0: -hh - PAD, x1: hh + PAD, y0: -hw - PAD, y1: hw + PAD };
  for (const r of S.rects) {
    v.y0 = Math.min(v.y0, r.x - hw - 12); v.y1 = Math.max(v.y1, r.x + r.w - hw + 12);
    v.x0 = Math.min(v.x0, r.y - hh - 12); v.x1 = Math.max(v.x1, r.y + r.h - hh + 12);
  }
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
const scr = q => [sx([q[0] - S.boardW / 2]), sy([0, S.boardH / 2 - q[1]])];       // canvas mm from its bottom left corner, y up → the screen
const toCanvas = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / k + V.y0, (e.clientY - r.top) / k - V.x1]; };
const toMm = e => { const c = toCanvas(e); return [c[0] + S.boardW / 2, S.boardH / 2 - c[1]]; };
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
const ORANGE = '#EB7A25', GROUND = '#FBFAF7', AIR = '#4FC3F7', PAPER = '#E5203A';
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
  g.fillStyle = GROUND; g.fillRect(sx([-hw]), sy([0, -hh]), S.boardW * k, S.boardH * k);   // the canvas
  g.save(); g.beginPath(); g.rect(sx([-hw]), sy([0, -hh]), S.boardW * k, S.boardH * k); g.clip();   // past the walls: hatched
  g.beginPath(); g.rect(0, 0, W, H); areaRect(); g.clip('evenodd');
  g.strokeStyle = 'rgba(179,71,12,.45)'; g.lineWidth = 1;
  for (let d = -H; d < W; d += 7) { g.beginPath(); g.moveTo(d, H); g.lineTo(d + H, 0); g.stroke(); }
  g.restore();
  if (S.view === 'result') drawResult(); else { drawPaths(); drawDips(); drawSausages(); drawOrder(); drawNodes(); }
  if (REF && S.refOpacity > 0) {
    const img = REF.img, s = Math.min(S.boardW / img.naturalWidth, S.boardH / img.naturalHeight), w = img.naturalWidth * s, h = img.naturalHeight * s;
    g.globalAlpha = S.refOpacity / 100; g.drawImage(img, sx([-w / 2]), sy([0, -h / 2]), w * k, h * k); g.globalAlpha = 1;
  }
  g.strokeStyle = 'rgba(36,34,31,.8)'; g.lineWidth = 1; g.strokeRect(sx([-hw]) + .5, sy([0, -hh]) + .5, S.boardW * k - 1, S.boardH * k - 1);
  { g.save(); g.strokeStyle = ORANGE; g.lineWidth = 1.2; g.setLineDash([6, 4]); g.beginPath(); areaRect(); g.stroke(); g.restore(); }
  g.font = font(10); g.fillStyle = '#B3470C'; g.textAlign = 'left';
  g.fillText(`canvas ${S.boardW} × ${S.boardH} mm`, sx([-hw]), sy([0, -hh]) - 6);
  const h = hereNow(), msx = q => (q.y - V.y0) * k, msy = q => (V.x1 - q.x) * k, ink = themeColor('--ink', '#24221F');
  g.save(); g.strokeStyle = 'rgba(36,34,31,.55)'; g.lineWidth = 1;                     // TEST's dots
  for (const d of cornerDots(S.boardW, S.boardH).dots) { const X = msx(d.at), Y = msy(d.at); g.beginPath(); g.moveTo(X - 5, Y); g.lineTo(X + 5, Y); g.moveTo(X, Y - 5); g.lineTo(X, Y + 5); g.stroke(); }
  g.restore();
  const hc = homeCorner(), home = { x: hc.x - h.x, y: hc.y - h.y }, hX = msx(home), hY = msy(home);
  g.strokeStyle = ink; g.lineWidth = 1.2; g.strokeRect(hX - 4, hY - 4, 8, 8); g.fillStyle = ink; g.textAlign = 'left'; g.fillText('home', hX + 8, hY - 6);
  if (g === ctx && !PLAY) guides();
  drawTrail();
}

// ---------- Drag: every figure's path ----------
// The path as the brush lays it, a faint strip as wide as its paint — the
// brush swollen, its trail (the owner, 2026-10-19) — where the rings overlap
// darker, white where they leave a gap; and its centre line; an
// orange dot where the brush lands, a ring where it lifts; every tile's
// place in the run, a number where the brush comes onto it, an arrow its
// way; the flight to the next figure dashed blue, with Flights ON (OFF
// by default, the owner, 2026-10-19: "I do not really need them"); ❚❚ where
// the brush is wiped.
function trace(c, pieces) {
  c.beginPath(); c.moveTo(pieces[0].a[0], pieces[0].a[1]);
  for (const q of pieces) {
    if (q.t === 'L') c.lineTo(q.b[0], q.b[1]);
    else c.arc(q.c[0], q.c[1], q.r, Math.atan2(q.a[1] - q.c[1], q.a[0] - q.c[0]), Math.atan2(q.b[1] - q.c[1], q.b[0] - q.c[0]), !q.left);
  }
}
function atAlong(pieces, s) {
  for (const q of pieces) { const L = lenOf(q); if (s <= L + 1e-9) return atPiece(q, Math.max(0, s)); s -= L; }
  const q = pieces.at(-1); return atPiece(q, lenOf(q));
}
function drawPaths() {
  const P = planNow();
  g.save(); inMm(g); g.lineCap = 'round'; g.lineJoin = 'round';
  for (const F of P.figs) {
    if (!F.pieces.length) continue;
    g.strokeStyle = 'rgba(36,34,31,.11)'; g.lineWidth = trail(); trace(g, F.pieces); g.stroke();
    g.strokeStyle = 'rgba(36,34,31,.42)'; g.lineWidth = 1 / k; trace(g, F.pieces); g.stroke();
  }
  g.restore();
  g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.lineCap = 'round'; g.lineJoin = 'round';
  let was = null;
  for (const F of P.figs) {
    if (!F.pieces.length) continue;
    if (was) {                                                                         // the flight, the wipe
      const a = scr(was.end), b = scr(F.start);
      if (S.flights) { g.strokeStyle = AIR; g.lineWidth = 1.4; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.setLineDash([]); }
      g.fillStyle = '#1F6FA8'; g.font = font(11, 600); g.textAlign = 'left'; g.fillText('❚❚ wipe', b[0] + 9, b[1] - 9);
    }
    const s = scr(F.start), e = scr(F.end);
    g.fillStyle = ORANGE; g.beginPath(); g.arc(s[0], s[1], 4, 0, 7); g.fill();
    g.strokeStyle = themeColor('--ink', '#24221F'); g.lineWidth = 1.4; g.beginPath(); g.arc(e[0], e[1], 4, 0, 7); g.stroke();
    F.along.forEach((at, j) => {                                                       // where the brush comes onto each tile: its number, an arrow its way
      const q = atAlong(F.pieces, at + Math.min(6, F.length / 50)), p = scr(q.p), d = [q.t[0], -q.t[1]], L = 10, w = 4;
      g.strokeStyle = 'rgba(36,34,31,.7)'; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(p[0] - d[0] * L, p[1] - d[1] * L); g.lineTo(p[0], p[1]); g.moveTo(p[0] - d[0] * w - d[1] * w, p[1] - d[1] * w + d[0] * w); g.lineTo(p[0], p[1]); g.lineTo(p[0] - d[0] * w + d[1] * w, p[1] - d[1] * w - d[0] * w); g.stroke();
    });
    was = F;
  }
  g.restore();
}
// ST-JOHN with INK ON: where TRACE goes to the cup — a blue ring where every
// stretch after a dip begins, DIP_LAP back from where the one before lifted
function drawDips() {
  if (!JOHN || !S.ink) return;
  const T = traceRun(), first = new Set(planNow().figs.filter(F => F.pieces.length).map(F => F.start.join()));
  g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.strokeStyle = WATER; g.lineWidth = 1.5;
  for (const q of T.at || []) { if (first.has(q.join())) continue; const p = scr(q); g.beginPath(); g.arc(p[0], p[1], 3.5, 0, 7); g.stroke(); }
  g.restore();
}
// every tile's place in the run, in its top right corner, over the sausages too
function drawOrder() {
  const P = planNow();
  g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.font = font(11, 600); g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const F of P.figs) F.us.forEach((id, j) => {
    const b = P.units[id].box, tr = scr([b.x + b.w, b.y + b.h]), lab = P.figs.length > 1 ? `${F.n}·${j + 1}` : String(j + 1), tw = g.measureText(lab).width + 10, c = [tr[0] - tw / 2 - 4, tr[1] + 13];   // in its top right corner: its middle is the nodes'
    g.fillStyle = 'rgba(251,250,247,.9)'; g.strokeStyle = 'rgba(179,71,12,.55)'; g.lineWidth = 1; g.beginPath(); g.roundRect(c[0] - tw / 2, c[1] - 9, tw, 18, 9); g.fill(); g.stroke();
    g.fillStyle = '#B3470C'; g.fillText(lab, c[0], c[1] + 0.5);
    if (F.cross[j]) {                                                                // ! — its nodes both in its middle, or both on its edge
      const q = [c[0] - tw / 2 - 13, c[1]];
      g.fillStyle = NODE; g.beginPath(); g.arc(q[0], q[1], 9, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.font = font(13, 700); g.fillText('!', q[0], q[1] + 0.5); g.font = font(11, 600);
    }
  });
  g.restore();
}
const mid = b => [b.x + b.w / 2, b.y + b.h / 2];
// The nodes, the owner's red marker (IMG_1033): a line from magnet to magnet
// over the paths, a dot at each end, an arrow the way the brush goes; the
// chosen one thicker on orange. With N the magnets: every unit's middle a
// dot, its outer ring's corners and sides' middles rings; the one under the
// pointer orange.
const NODE = '#E5203A';
function drawNodes() {
  const P = planNow(), on = S.tool === 'node';
  g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.lineCap = 'round'; g.lineJoin = 'round';
  if (on) for (const U of P.units) for (const q of U.M) {
    const p = scr(q.p), hot = grab?.kind === 'node' ? grab.snap && grab.snap.u === U.id && grab.snap.m === q.m && grab.snap.id === q.id : HOT && HOT.u === U.id && HOT.m === q.m && HOT.id === q.id;
    g.fillStyle = q.c ? themeColor('--ink', '#24221F') : '#FBFAF7'; g.strokeStyle = hot ? ORANGE : 'rgba(36,34,31,.8)'; g.lineWidth = hot ? 2.5 : 1.3;
    g.beginPath(); g.arc(p[0], p[1], q.c ? 4 : 3.6, 0, 7); g.fill(); g.stroke();
    if (hot) { g.beginPath(); g.arc(p[0], p[1], 8, 0, 7); g.stroke(); }
  }
  P.links.forEach(l => {
    const a = scr(l.a.p), b = scr(l.b.p), sel = l.i === S.nodeSel, d = [b[0] - a[0], b[1] - a[1]], L = Math.hypot(...d) || 1, u = [d[0] / L, d[1] / L], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], w = 6;
    if (sel) { g.strokeStyle = ORANGE; g.lineWidth = 8; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    g.strokeStyle = NODE; g.lineWidth = sel ? 4 : 3; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
    g.beginPath(); g.moveTo(m[0] - u[0] * w - u[1] * w * 0.7, m[1] - u[1] * w + u[0] * w * 0.7); g.lineTo(m[0] + u[0] * 2, m[1] + u[1] * 2); g.lineTo(m[0] - u[0] * w + u[1] * w * 0.7, m[1] - u[1] * w - u[0] * w * 0.7); g.stroke();
    g.fillStyle = '#24221F'; for (const q of [a, b]) { g.beginPath(); g.arc(q[0], q[1], 3.2, 0, 7); g.fill(); }
  });
  if (grab?.kind === 'knife') {                                                     // the knife's line; the nodes it would cut, orange
    const cut = new Set(grab.pts.length > 1 ? knifeCuts(grab.pts) : []);
    for (const l of P.links) if (cut.has(l.i)) { const a = scr(l.a.p), b = scr(l.b.p); g.strokeStyle = ORANGE; g.lineWidth = 9; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    g.strokeStyle = themeColor('--ink', '#24221F'); g.lineWidth = 1.5; g.setLineDash([4, 3]); g.beginPath();
    grab.pts.forEach((q, j) => { const s = scr(q); if (j) g.lineTo(s[0], s[1]); else g.moveTo(s[0], s[1]); }); g.stroke(); g.setLineDash([]);
  }
  if (grab?.kind === 'node') {                                                      // a node being drawn
    const a = scr(grab.from.p), b = grab.snap ? scr(grab.snap.p) : scr(grab.to);
    g.strokeStyle = NODE; g.lineWidth = 3; g.setLineDash(grab.snap ? [] : [6, 5]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.setLineDash([]);
  }
  g.restore();
}
// The sausages on Drag, where to squeeze them: each its paint, a dark edge so
// a light one reads; MARKS' dashes under them in watercolour, the brush's
// width. A paint chosen in the list (CCD's black arrows): its sausages
// outlined black and numbered in MARKS' order, the others faint.
const WATER = '#6F8FB8';
const shown = () => EDIT?.mode === 'change' ? EDIT.id : null;
function marksOrder() {
  const P = planNow(), out = [];
  for (const F of P.figs) for (const id of F.us) for (const i of P.units[id].rs) for (const q of sausagesOf(S.rects, i)) out.push(q);
  return out;
}
function drawSausages() {
  const ss = marksOrder(), show = shown();
  if (!ss.length) return;
  g.save(); inMm(g); g.lineCap = 'round';
  g.strokeStyle = WATER; g.globalAlpha = show ? 0.1 : 0.26; g.lineWidth = S.brush;
  if (!JOHN) for (const q of ss) { const m = markOf(q, S.brush); g.beginPath(); g.moveTo(m.a[0], m.a[1]); g.lineTo(m.b[0], m.b[1]); g.stroke(); }   // MARKS' dashes; ST-JOHN has none
  for (const q of ss) {
    const on = q.paint === show;
    g.globalAlpha = show && !on ? 0.22 : 1;
    g.strokeStyle = on ? '#000' : 'rgba(36,34,31,.75)'; g.lineWidth = (q.thin ? SAUSAGE_W * 0.6 : SAUSAGE_W) + (on ? 3 : 1.2) / k;
    g.beginPath(); g.moveTo(q.a[0], q.a[1]); g.lineTo(q.b[0], q.b[1]); g.stroke();
    g.strokeStyle = PAINT[q.paint].hex; g.lineWidth = q.thin ? SAUSAGE_W * 0.6 : SAUSAGE_W;
    g.beginPath(); g.moveTo(q.a[0], q.a[1]); g.lineTo(q.b[0], q.b[1]); g.stroke();
  }
  g.restore();
  if (!show) return;
  g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.font = font(11, 600); g.textAlign = 'center'; g.textBaseline = 'middle';
  ss.filter(q => q.paint === show).forEach((q, n) => {
    const a = scr(q.a), b = scr(q.b), d = [b[0] - a[0], b[1] - a[1]], L = Math.hypot(...d) || 1, at = [a[0] - d[0] / L * 14, a[1] - d[1] / L * 14];
    g.fillStyle = 'rgba(255,255,255,.92)'; g.beginPath(); g.arc(at[0], at[1], 8, 0, 7); g.fill();
    g.fillStyle = '#000'; g.fillText(String(n + 1), at[0], at[1] + 0.5);
  });
  g.restore();
}

// ---------- the Result, and Play the run ----------
// The brush through the sausages, figure by figure, as DRAG runs (inkaplan.js,
// simOf), on a grid of the canvas, drawn once into a bitmap while nothing
// changes. Play the run (ALU's): the same walk again from the squeezed
// sausages on, a mm a step, the bitmap laid as it goes, a ring its paint's
// width where it is; 6 s and 2 ms a mm, 26 s at most; pressed again, it stops.
let RESULT = null, PLAY = null;
const resultKey = () => JSON.stringify([plKey, S.rects.map(r => r.ss), S.density, S.brush, S.swell, S.boardW, S.boardH]);
function bitmapOf(sim) {
  const c2 = document.createElement('canvas'); c2.width = sim.nx; c2.height = sim.ny;
  const c = c2.getContext('2d'), img = c.createImageData(sim.nx, sim.ny);
  sim.rgba(img.data, true); c.putImageData(img, 0, 0);
  return { c2, c, img };
}
function resultBitmap() {
  const key = resultKey();
  if (RESULT?.key === key) return RESULT;
  const sim = simOf(planNow(), S.rects, { ...po(), density: S.density });
  sim.advance(Infinity);
  RESULT = { key, sim, ...bitmapOf(sim) };
  return RESULT;
}
function drawBitmap(B, sim) {
  const a = scr([0, sim.ny * sim.h]);
  g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(B.c2, a[0], a[1], sim.nx * sim.h * k, sim.ny * sim.h * k);
  g.restore();
}
function drawResult() {
  if (PLAY && g === ctx) {
    drawBitmap(PLAY, PLAY.sim);
    if (PLAY.sim.at) {
      const p = scr(PLAY.sim.at);
      g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.strokeStyle = '#24221F'; g.fillStyle = '#24221F'; g.lineWidth = 1.2;
      g.beginPath(); g.arc(p[0], p[1], Math.max(3, trail() / 2 * k), 0, 7); g.stroke();
      g.beginPath(); g.arc(p[0], p[1], 1.8, 0, 7); g.fill(); g.restore();
    }
    return;
  }
  const B = resultBitmap();
  drawBitmap(B, B.sim);
}
function play() {
  if (PLAY) { stopPlay(); kick(); return; }
  const sim = simOf(planNow(), S.rects, { ...po(), density: S.density });
  if (!sim.steps) return;
  PLAY = { sim, t0: performance.now(), ms: Math.min(26000, 6000 + sim.steps * 2), ...bitmapOf(sim) };
  if (S.view !== 'result') { S.view = 'result'; save(); showPanel(); }
  showPlay();
  const tick = () => {
    if (!PLAY) return;
    const want = Math.min(PLAY.sim.steps, Math.floor((performance.now() - PLAY.t0) / PLAY.ms * PLAY.sim.steps)), done = PLAY.sim.advance(want - PLAY.sim.i);
    PLAY.sim.rgba(PLAY.img.data); PLAY.c.putImageData(PLAY.img, 0, 0);
    draw();
    if (done) { stopPlay(); kick(); return; }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function stopPlay() { if (!PLAY) return; PLAY = null; showPlay(); }
function showPlay() { const b = $('#btnPlay'); b.classList.toggle('on', !!PLAY); b.textContent = PLAY ? '■ Stop playing' : '▶ Play the run'; }
$('#btnPlay').onclick = play;

// The guides: every tile's outline, the chosen one orange with its eight
// handles; its number and step; its size while it is drawn or stretched
const HANDLE_PX = 9;
function handlesOf(r) {
  const out = [];
  for (const hx of [-1, 0, 1]) for (const hy of [-1, 0, 1]) if (hx || hy) out.push({ hx, hy, at: [r.x + (hx + 1) / 2 * r.w, r.y + (hy + 1) / 2 * r.h] });
  return out;
}
function guides() {
  g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.font = font(10); g.textBaseline = 'alphabetic';
  S.rects.forEach((r, i) => {
    const on = isPicked(i), a = scr([r.x, r.y + r.h]), b = scr([r.x + r.w, r.y]);
    g.strokeStyle = on ? ORANGE : 'rgba(36,34,31,.45)'; g.lineWidth = on ? 1.5 : 1; g.setLineDash(on ? [] : [4, 3]);
    g.strokeRect(a[0], a[1], b[0] - a[0], b[1] - a[1]); g.setLineDash([]);
    if (isJohn(r)) {                                                                 // a ⌘: its four lobes, dashed
      const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      g.setLineDash([2, 4]); g.beginPath(); g.moveTo(m[0], a[1]); g.lineTo(m[0], b[1]); g.moveTo(a[0], m[1]); g.lineTo(b[0], m[1]); g.stroke(); g.setLineDash([]);
    }
    g.fillStyle = on ? '#B3470C' : themeColor('--mute', '#7D776D'); g.textAlign = 'left';
    if (b[0] - a[0] > 34 && b[1] - a[1] > 20) g.fillText(`${isJohn(r) ? '⌘ ' : ''}${i + 1}`, a[0] + 5, a[1] + 13);
    if (on && grab && grab.kind !== 'move' && grab.kind !== 'paint' && grab.kind !== 'node') { g.textAlign = 'right'; g.fillText(`${fmt(r.w, 1)} × ${fmt(r.h, 1)} mm`, b[0], a[1] - 5); }
  });
  if (MANY.size > 1) {                                                              // the tiles chosen together: their box, its size
    const B = boxOfIdx(picked()), a = scr([B.x, B.y + B.h]), b = scr([B.x + B.w, B.y]);
    g.strokeStyle = ORANGE; g.lineWidth = 1; g.setLineDash([6, 4]); g.strokeRect(a[0] - 4, a[1] - 4, b[0] - a[0] + 8, b[1] - a[1] + 8); g.setLineDash([]);
    g.fillStyle = '#B3470C'; g.textAlign = 'left'; g.fillText(`${MANY.size} tiles · ${fmt(B.w, 1)} × ${fmt(B.h, 1)} mm`, a[0] - 4, a[1] - 9);
  }
  const r = S.rects[S.sel];
  if (r && MANY.size < 2 && !(grab?.kind === 'new') && S.tool !== 'paint' && S.tool !== 'node') for (const q of handlesOf(r)) {
    const s = scr(q.at); g.fillStyle = '#FBFAF7'; g.strokeStyle = ORANGE; g.lineWidth = 1.4; g.fillRect(s[0] - 3.5, s[1] - 3.5, 7, 7); g.strokeRect(s[0] - 3.5, s[1] - 3.5, 7, 7);
  }
  if (grab?.kind === 'paint' && grab.moved && grab.to) {                              // a sausage being laid by hand
    const a = scr(grab.from), b = scr(grab.to);
    g.strokeStyle = PAINT[S.paint].hex; g.lineCap = 'round'; g.lineWidth = Math.max(3, SAUSAGE_W * k); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
  }
  g.restore();
}

// ---------- the run as it goes (CCD's) ----------
let trailOf = null, lastSt = null, RUN = null, RUN_INFO = null;
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
  for (let j = 0; j <= Math.min(st.block, B.length - 1); j++) {
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
const UNDO_KEYS = ['rects', 'sel', 'brush', 'swell', 'edgeOut', 'overlap', 'drag', 'corner', 'change', 'join', 'wipe', 'density', 'nodes'];
let undoStack = [], redoStack = [];
const snapshot = () => JSON.stringify(Object.fromEntries(UNDO_KEYS.map(q => [q, S[q]])));
function undoPush() { undoStack.push(snapshot()); if (undoStack.length > 200) undoStack.shift(); redoStack = []; }
function restore(js) { Object.assign(S, JSON.parse(js)); const ids = new Set(S.rects.map(r => r.id)); for (const id of [...MANY]) if (!ids.has(id)) MANY.delete(id); if (MANY.size < 2) MANY.clear(); settle(); }
function undo() { if (!undoStack.length) return; redoStack.push(snapshot()); restore(undoStack.pop()); }
function redo() { if (!redoStack.length) return; undoStack.push(snapshot()); restore(redoStack.pop()); }

// ---------- the tools on the board ----------
// Edit and Tile, CCD's: a tile dragged moves, its handles stretch it, a drag
// with R lays a new one; the edges snap to the canvas's and the other tiles'.
// M: a click on a tile lays a spoke of the chosen paint from its nearest
// side to the middle; on a sausage, with its paint it goes, with another it
// takes it; a drag lays one where it is dragged.
const SNAP_PX = 8, half = v => Math.round(v * 2) / 2;
const clampX = v => Math.max(-OFF, Math.min(S.boardW + OFF, v)), clampY = v => Math.max(-OFF, Math.min(S.boardH + OFF, v));
const edgesOf = (axis, skip) => [0, axis === 'x' ? S.boardW : S.boardH, ...S.rects.flatMap((r, i) => (skip instanceof Set ? skip.has(i) : i === skip) ? [] : axis === 'x' ? [r.x, r.x + r.w] : [r.y, r.y + r.h])];
// The tiles chosen together — ⌘A all of them, ⇧ and a click one more or one
// less (the owner, 2026-10-17: "I need a selection that takes every figure
// on the canvas, cmd+A"): their ids; fewer than two, the chosen one alone
let MANY = new Set();
const picked = () => MANY.size > 1 ? S.rects.map((r, i) => MANY.has(r.id) ? i : -1).filter(i => i >= 0) : S.rects[S.sel] ? [S.sel] : [];
const isPicked = i => MANY.size > 1 ? MANY.has(S.rects[i]?.id) : i === S.sel;
const boxOfIdx = idx => { const rs = idx.map(i => S.rects[i]), x0 = Math.min(...rs.map(r => r.x)), y0 = Math.min(...rs.map(r => r.y)); return { x: x0, y: y0, w: Math.max(...rs.map(r => r.x + r.w)) - x0, h: Math.max(...rs.map(r => r.y + r.h)) - y0 }; };
function letGo() { if (!MANY.size) return; MANY.clear(); showRects(); kick(); }
function snapTo(v, axis, skip) {
  let best = null;
  for (const q of edgesOf(axis, skip)) if (Math.abs(q - v) <= SNAP_PX / k && (best === null || Math.abs(q - v) < Math.abs(best - v))) best = q;
  return best ?? half(v);
}
function snapMove(v, size, axis, skip) {
  let best = null;
  for (const q of edgesOf(axis, skip)) for (const d of [q - v, q - v - size]) if (Math.abs(d) <= SNAP_PX / k && (best === null || Math.abs(d) < Math.abs(best))) best = d;
  return best === null ? half(v) : v + best;
}
function nearHandle(e) {
  const r = S.rects[S.sel]; if (!r || MANY.size > 1) return null;
  const rc = cv.getBoundingClientRect(), mx = e.clientX - rc.left, my = e.clientY - rc.top;
  let best = null;
  for (const q of handlesOf(r)) { const s = scr(q.at), d = Math.hypot(s[0] - mx, s[1] - my); if (d <= HANDLE_PX && (!best || d < best.d)) best = { ...q, d }; }
  return best;
}
const inRect = (r, p) => p[0] >= r.x && p[0] <= r.x + r.w && p[1] >= r.y && p[1] <= r.y + r.h;
function rectAt(p) {
  if (S.rects[S.sel] && inRect(S.rects[S.sel], p)) return S.sel;
  for (let i = S.rects.length - 1; i >= 0; i--) if (inRect(S.rects[i], p)) return i;
  return -1;
}
const CURSOR = { '-1,-1': 'nesw-resize', '1,1': 'nesw-resize', '-1,1': 'nwse-resize', '1,-1': 'nwse-resize', '-1,0': 'ew-resize', '1,0': 'ew-resize', '0,-1': 'ns-resize', '0,1': 'ns-resize' };
let grab = null;
const segDist = (p, a, b) => { const v = [b[0] - a[0], b[1] - a[1]], l2 = v[0] * v[0] + v[1] * v[1], t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * v[0] + (p[1] - a[1]) * v[1]) / l2)) : 0; return Math.hypot(p[0] - a[0] - t * v[0], p[1] - a[1] - t * v[1]); };
function paintAt(p) {
  const i = rectAt(p); if (i < 0) return;
  const U = unitOfRect(i); if (!U) return;
  undoPush(); S.sel = i;
  const arm = spokeAt(U, S.rects, p, po()), same = q => arm && Math.hypot(q.a[0] - arm.a[0], q.a[1] - arm.a[1]) < 0.5 && Math.hypot(q.b[0] - arm.b[0], q.b[1] - arm.b[1]) < 0.5;
  const on = sausagesOf(S.rects).find(q => segDist(p, q.a, q.b) <= SAUSAGE_W / 2 + 1), hit = on ?? sausagesOf(S.rects).find(same);   // on a sausage, or its X's arm there lying already: repainted, never twice
  if (hit) {
    const ss = S.rects[hit.ri].ss;
    if (ss[hit.k].paint === S.paint) { if (!on) { undoStack.pop(); return; } ss.splice(hit.k, 1); } else { ss[hit.k].paint = S.paint; delete ss[hit.k].thin; }
  } else {
    if (!arm) { undoStack.pop(); return; }
    const { i: j, s } = keepIn(U, S.rects, { ...arm, paint: S.paint }); S.rects[j].ss.push(s);
  }
  settle();
}
function paintAlong(a, b) {
  const i = rectAt(a); if (i < 0) return;
  const U = unitOfRect(i); if (!U) return;
  undoPush(); S.sel = i;
  const { i: j, s } = keepIn(U, S.rects, { a, b, paint: S.paint }); S.rects[j].ss.push(s);
  settle();
}
function sausageUnder(p) {
  for (const q of sausagesOf(S.rects)) if (segDist(p, q.a, q.b) <= SAUSAGE_W / 2 + 1) return q;
  return null;
}
function showTip(e) {
  const tip = $('#spokeTip'), q = S.view === 'drag' && !grab ? sausageUnder(toMm(e)) : null;
  if (!q) { tip.hidden = true; return; }
  const pt = PAINT[q.paint], rb = board.getBoundingClientRect(), F = figOfRect(q.ri);
  tip.innerHTML = `<i style="background:${pt.hex}"></i>${pt.name}${q.thin ? ' <em>thin</em>' : ''} <em>· ${fmt(Math.hypot(q.b[0] - q.a[0], q.b[1] - q.a[1]), 0)} mm${F ? ` · figure ${F.n}` : ''}</em>`;
  tip.hidden = false;
  const X = e.clientX - rb.left, Y = e.clientY - rb.top, w = tip.offsetWidth;
  tip.style.left = `${X + 14 + w > rb.width ? X - 14 - w : X + 14}px`; tip.style.top = `${Math.max(0, Y - 30)}px`;
}
cv.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') $('#spokeTip').hidden = true; });
cv.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'mouse') showTip(e);
  if (e.button !== 0) return;
  if (PLAY) { stopPlay(); kick(); }
  const p = toMm(e);
  if (S.tool === 'paint') { grab = { kind: 'paint', from: p, to: p, moved: false }; cv.setPointerCapture(e.pointerId); return; }
  if (S.tool === 'knife') { grab = { kind: 'knife', pts: [p], hit: nodeAt(e) }; cv.setPointerCapture(e.pointerId); kick(); return; }   // K: a line drawn across the nodes
  if (S.tool === 'node') {                                                          // from a magnet: a node drawn; on a node: it is chosen
    const mg = magnetAt(e);
    if (mg) { grab = { kind: 'node', from: mg, to: mg.p, snap: null }; cv.setPointerCapture(e.pointerId); kick(); return; }
    S.nodeSel = nodeAt(e); showNodes(); kick(); return;
  }
  const hd = nearHandle(e);
  if (hd) { undoPush(); grab = { kind: 'size', hx: hd.hx, hy: hd.hy, r0: { ...S.rects[S.sel] }, moved: false }; cv.setPointerCapture(e.pointerId); return; }
  if (S.tool === 'rect' || S.tool === 'john') {                                      // R a tile, ⌘ a sign
    undoPush();
    const x = clampX(snapTo(p[0], 'x', -1)), y = clampY(snapTo(p[1], 'y', -1)), was = S.rects[S.sel];
    S.rects.push(cleanRect({ id: newId(), x, y, w: MIN_SIDE, h: MIN_SIDE, step: was?.step ?? STEP_NEW, turn: was?.turn, ...(S.tool === 'john' ? { kind: JOHN_KIND } : {}) })); S.sel = S.rects.length - 1;
    grab = { kind: 'new', ax: x, ay: y, moved: false }; cv.setPointerCapture(e.pointerId); kick(); return;
  }
  const i = rectAt(p);
  if (i < 0) { letGo(); return; }
  if (e.shiftKey) {                                                                  // ⇧: one more, or one less
    if (MANY.size < 2) MANY = new Set(S.rects[S.sel] ? [S.rects[S.sel].id] : []);
    const id = S.rects[i].id; if (MANY.has(id)) MANY.delete(id); else MANY.add(id);
    if (MANY.size < 2) MANY.clear(); S.sel = i; showRects(); kick(); return;
  }
  if (MANY.size > 1 && MANY.has(S.rects[i].id)) {                                   // one of the tiles chosen together: all of them move
    undoPush(); S.sel = i; const idx = picked();
    grab = { kind: 'moveAll', from: p, r0s: idx.map(j => ({ j, x: S.rects[j].x, y: S.rects[j].y })), box: boxOfIdx(idx), skip: new Set(idx), moved: false };
    cv.setPointerCapture(e.pointerId); showRects(); kick(); return;
  }
  MANY.clear(); undoPush(); S.sel = i; grab = { kind: 'move', from: p, r0: { ...S.rects[i] }, moved: false }; cv.setPointerCapture(e.pointerId); showRects(); kick();
});
cv.addEventListener('pointermove', e => {
  if (!grab) {
    const hd = S.tool === 'paint' ? null : nearHandle(e);
    if (S.tool === 'node') { const was = HOT; HOT = magnetAt(e); cv.style.cursor = HOT ? 'crosshair' : nodeAt(e) >= 0 ? 'pointer' : ''; if (was !== HOT) kick(); return; }
    if (S.tool === 'knife') { cv.style.cursor = 'crosshair'; return; }
    cv.style.cursor = hd ? CURSOR[`${hd.hx},${hd.hy}`] : S.tool === 'rect' || S.tool === 'john' || S.tool === 'paint' ? 'crosshair' : rectAt(toMm(e)) >= 0 ? 'move' : '';
    showTip(e);
    return;
  }
  const p = toMm(e);
  if (grab.kind === 'node') { grab.to = p; const mg = magnetAt(e); grab.snap = mg && mg.u !== grab.from.u ? mg : null; kick(); return; }
  if (grab.kind === 'knife') { const q = grab.pts.at(-1); if (Math.hypot(p[0] - q[0], p[1] - q[1]) * k > 2) { grab.pts.push(p); kick(); } return; }
  if (grab.kind === 'paint') { grab.to = p; grab.moved = grab.moved || Math.hypot(p[0] - grab.from[0], p[1] - grab.from[1]) > 3; kick(); return; }
  grab.moved = true; busy = true;
  if (grab.kind === 'moveAll') {                                                     // the box of them snapping as one tile does
    const B = grab.box, X = snapMove(B.x + p[0] - grab.from[0], B.w, 'x', grab.skip), Y = snapMove(B.y + p[1] - grab.from[1], B.h, 'y', grab.skip);
    const dx = Math.max(-OFF, Math.min(S.boardW + OFF, X)) - B.x, dy = Math.max(-OFF, Math.min(S.boardH + OFF, Y)) - B.y;
    for (const q of grab.r0s) { S.rects[q.j].x = q.x + dx; S.rects[q.j].y = q.y + dy; }
    kick(); return;
  }
  const r = S.rects[S.sel], r0 = grab.r0;
  if (grab.kind === 'move') {
    r.x = clampX(snapMove(r0.x + p[0] - grab.from[0], r.w, 'x', S.sel)); r.y = clampY(snapMove(r0.y + p[1] - grab.from[1], r.h, 'y', S.sel));
  } else {
    const ax = grab.kind === 'new' ? grab.ax : grab.hx < 0 ? r0.x + r0.w : r0.x, ay = grab.kind === 'new' ? grab.ay : grab.hy < 0 ? r0.y + r0.h : r0.y;
    if (grab.kind === 'new' || grab.hx) { const x = clampX(snapTo(p[0], 'x', S.sel)); r.x = Math.min(ax, x); r.w = Math.max(MIN_SIDE, Math.abs(x - ax)); }
    if (grab.kind === 'new' || grab.hy) { const y = clampY(snapTo(p[1], 'y', S.sel)); r.y = Math.min(ay, y); r.h = Math.max(MIN_SIDE, Math.abs(y - ay)); }
  }
  kick();
});
const drop = () => {
  if (!grab) return;
  const was = grab; grab = null;
  if (was.kind === 'paint') { if (was.moved) paintAlong(was.from, was.to); else paintAt(was.from); kick(); return; }
  if (was.kind === 'node') { if (was.snap) addNode(was.from, was.snap); else kick(); return; }
  if (was.kind === 'knife') { cutNodes(was.pts.length > 1 ? knifeCuts(was.pts) : was.hit >= 0 ? [was.hit] : []); return; }
  if (was.kind === 'new') {
    const r = S.rects[S.sel];
    if (!was.moved || r.w < 2 || r.h < 2) { S.rects.pop(); S.sel = Math.max(0, S.rects.length - 1); undoStack.pop(); }
    else { if (isJohn(r)) r.width = johnWidthNew(r); S.tool = 'edit'; }               // a new ⌘'s loop as the owner found it best, a fifth of its box
  } else if (!was.moved) undoStack.pop();
  else if (was.kind === 'size' && isJohn(S.rects[S.sel])) relayJohn(S.sel);        // a ⌘ stretched: its X on its loop again
  settle();
};
cv.addEventListener('pointerup', drop); cv.addEventListener('pointercancel', drop);
// N: the magnet under the pointer, within MAGNET_PX on the screen; the node under it
const MAGNET_PX = 13;
let HOT = null;
function magnetAt(e) {
  const rc = cv.getBoundingClientRect(), mx = e.clientX - rc.left, my = e.clientY - rc.top;
  let best = null, bd = MAGNET_PX;
  for (const U of planNow().units) for (const q of U.M) { const s = scr(q.p), d = Math.hypot(s[0] - mx, s[1] - my); if (d < bd) { bd = d; best = { ...q, u: U.id }; } }
  return best;
}
function nodeAt(e) {
  const rc = cv.getBoundingClientRect(), m = [e.clientX - rc.left, e.clientY - rc.top];
  let best = -1, bd = 7;
  for (const l of planNow().links) { const d = segDist(m, scr(l.a.p), scr(l.b.p)); if (d < bd) { bd = d; best = l.i; } }
  return best;
}
// a node from a magnet to a magnet: the tile's way out before it, and the next one's way in, give way to it; one that would close a loop, refused
function addNode(a, b) {
  const nodes = [...S.nodes, { a: { id: a.id, m: a.m }, b: { id: b.id, m: b.m } }];
  if (!linksOf(nodes, S.rects, planNow().units).some(l => l.i === nodes.length - 1)) { $('#hint').textContent = 'That node would close a loop: the brush would come back to a tile it has painted. Not laid.'; kick(); return; }
  undoPush(); S.nodes = nodes; S.nodeSel = nodes.length - 1; settle();
}
// K, the knife (the owner, 2026-10-19: "a knife that cuts the nodes"): every node its line crosses, or the one clicked
const crossSeg = (a, b, c, d) => { const o = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]), d1 = o(c, d, a), d2 = o(c, d, b), d3 = o(a, b, c), d4 = o(a, b, d); return d1 * d2 < 0 && d3 * d4 < 0; };
function knifeCuts(pts) {
  return planNow().links.filter(l => pts.some((q, j) => j && crossSeg(pts[j - 1], q, l.a.p, l.b.p))).map(l => l.i);
}
function cutNodes(idx) {
  if (!idx.length) { kick(); return; }
  undoPush(); const cut = new Set(idx); S.nodes = S.nodes.filter((_, i) => !cut.has(i)); S.nodeSel = -1;
  $('#hint').textContent = `Cut ${idx.length} node${idx.length === 1 ? '' : 's'}: the chains apart, a tile no node touches a figure of its own (⌘Z brings ${idx.length === 1 ? 'it' : 'them'} back).`;
  settle();
}
function deleteNode() { if (S.nodeSel < 0 || !S.nodes[S.nodeSel]) return; undoPush(); S.nodes.splice(S.nodeSel, 1); S.nodeSel = -1; settle(); }
function moveRect(dx, dy) { const idx = picked(); if (!idx.length) return; undoPush(); for (const i of idx) { const r = S.rects[i]; r.x = clampX(r.x + dx); r.y = clampY(r.y + dy); } settle(); }
function deleteRect() {
  const idx = picked(); if (!idx.length) return;
  undoPush();
  const gone = new Set(idx.map(i => S.rects[i].id));
  S.rects = S.rects.filter(r => !gone.has(r.id)); S.nodes = S.nodes.filter(q => !gone.has(q.a.id) && !gone.has(q.b.id));
  MANY.clear(); S.sel = Math.max(0, Math.min(S.rects.length - 1, Math.min(...idx) - 1)); settle();
}
function clearAll() { if (!S.rects.length) return; undoPush(); S.rects = []; S.nodes = []; MANY.clear(); S.sel = 0; S.tool = 'rect'; settle(); }
// N with no nodes yet: the snake laid as nodes, the way the brush runs now, to change
function setTool(t) {
  S.tool = t; S.view = t === 'paint' || t === 'node' || t === 'knife' ? 'drag' : S.view;
  if (t === 'node' && !S.nodes.length && planNow().figs.some(F => F.us.length > 1)) { undoPush(); S.nodes = snakeNodes(planNow(), S.rects); }
  settle();
}
const HINT = {
  edit: 'Edit: drag a tile to move it, its handles to stretch it; a click chooses it, ⇧ and a click one more; ⌘A all of them; the arrows move it a mm, with ⇧ ten; ⌫ takes it away. Its edges snap to the canvas\'s and the other tiles\' — side by side they are one figure; laid over one another, one block.',
  rect: 'Tile: drag on the canvas to lay one, its step the chosen one\'s. Side by side with others it joins their figure, the brush on through it; over another it melts into it, one block, one outline — the "[".',
  john: '⌘, St. John\'s Arms: drag on the canvas to lay one, its step the chosen one\'s — four lobes, every lobe\'s rings as a tile\'s. The brush lands in its middle and goes loop after loop inward, every loop round the lobes 1 ↘ 2 ↗ 3 ↖ 4 ↙, each clockwise, their inner sides on across the middle — the grid. A figure of its own: it joins no tile, no node holds on it.',
  node: 'N: drag from a magnet of a tile — its middle, a corner, a side\'s middle — to one of the next: the brush\'s way. Into a tile\'s middle it spirals out to where its next node leaves; into its edge it spirals in from there to its middle. A tile one way out and one in: a new node takes the old one\'s place. A click on a node chooses it, ⌫ takes it away.',
  knife: 'K, the knife: drag a line across the nodes — every one it crosses is cut, the chain apart there; a click on a node cuts it. ⌘Z brings them back. N lays them again.',
  paint: 'M: a click on a tile lays the arm of its X nearest it in the chosen paint, from the corner along the diagonal in to the innermost ring; a drag lays one where you drag it; a click on a sausage with its paint takes it away, with another repaints it. A paint: the strip on the left.',
};
$('#btnUndo').onclick = undo; $('#btnRedo').onclick = redo; $('#btnClear').onclick = clearAll;
document.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => setTool(b.dataset.tool));
addEventListener('keydown', e => {
  if (e.key === 'Escape') { post('/run/stop'); letGo(); }
  if (e.target.matches('input,select,textarea')) return;
  const cmd = e.metaKey || e.ctrlKey;
  if (cmd && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (cmd && e.key.toLowerCase() === 'a') {                                          // every tile on the canvas
    e.preventDefault(); if (S.rects.length < 2) return;
    MANY = new Set(S.rects.map(r => r.id)); S.tool = 'edit'; settle();
    $('#hint').textContent = `All ${S.rects.length} tiles chosen: a drag moves them together, the arrows a mm (⇧ ten), ⌫ takes them away, ⌘C ⌘V copies them with their nodes. A click on the canvas, or Esc, lets them go.`;
    return;
  }
  if (cmd && e.key.toLowerCase() === 'c') {
    const idx = picked(); if (!idx.length) return;
    e.preventDefault();
    const ids = new Set(idx.map(i => S.rects[i].id));
    COPY = { rects: idx.map(i => structuredClone(S.rects[i])), nodes: S.nodes.filter(q => ids.has(q.a.id) && ids.has(q.b.id)).map(q => structuredClone(q)) }; PASTED = null;
    $('#hint').textContent = idx.length > 1 ? `${idx.length} tiles copied, ${COPY.nodes.length} node${COPY.nodes.length === 1 ? '' : 's'} between them: ⌘V lays them beside, touching.` : `Tile ${idx[0] + 1} copied: ⌘V lays it beside, touching.`;
    return;
  }
  if (cmd && e.key.toLowerCase() === 'v') { if (COPY) { e.preventDefault(); paste(); } return; }
  if (cmd) return;
  if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); if (S.tool === 'node' && S.nodeSel >= 0) deleteNode(); else deleteRect(); return; }
  const tool = { v: 'edit', r: 'rect', ...(JOHN ? { j: 'john' } : {}), n: 'node', k: 'knife', m: 'paint' }[e.key.toLowerCase()];
  if (tool) { setTool(tool); return; }
  const arrow = { ArrowUp: [0, 1], ArrowDown: [0, -1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
  if (arrow) { e.preventDefault(); const d = e.shiftKey ? 10 : 1; moveRect(arrow[0] * d, arrow[1] * d); }
});

// ⌘C ⌘V (the owner, 2026-10-17: "Duplicate is not very handy"): the tile
// chosen, or the tiles chosen together, copied with their sausages, turns
// and the nodes between them; a paste lays them beside the ones copied,
// touching on the right — the next paste beside that — or above when the
// right runs past the canvas; the pasted chosen together, to be moved
let COPY = null, PASTED = null;
function paste() {
  const was = PASTED ?? { off: [0, 0] }, B0 = (() => { const rs = COPY.rects, x0 = Math.min(...rs.map(r => r.x)), y0 = Math.min(...rs.map(r => r.y)); return { x: x0, y: y0, w: Math.max(...rs.map(r => r.x + r.w)) - x0, h: Math.max(...rs.map(r => r.y + r.h)) - y0 }; })();
  let off = [was.off[0] + B0.w, was.off[1]];
  if (B0.x + off[0] + B0.w > S.boardW + OFF) off = [was.off[0], was.off[1] + B0.h];
  undoPush();
  let id = newId();
  const map = new Map(), rs = COPY.rects.map(r => { const c = structuredClone(r); map.set(r.id, id); c.id = id++; c.x = clampX(r.x + off[0]); c.y = clampY(r.y + off[1]); return c; });
  S.rects.push(...rs);
  S.nodes.push(...COPY.nodes.map(q => ({ a: { id: map.get(q.a.id), m: q.a.m }, b: { id: map.get(q.b.id), m: q.b.m } })));
  S.sel = S.rects.length - 1; MANY = rs.length > 1 ? new Set(rs.map(r => r.id)) : new Set(); PASTED = { off }; S.tool = 'edit'; settle();
}
// The zoom (CCD's)
function zoomTo(z, e) {
  z = Math.max(ZOOMS[0], Math.min(ZOOMS.at(-1), z));
  if (Math.abs(z - 1) < 1e-6) { Z = 1; ZC = null; layout(); showZoom(); return; }
  const at = e ? toCanvas(e) : null, r = cv.getBoundingClientRect();
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

// ---------- the panel ----------
const CORNER_SL = ['corner', 'Corners', 'mm', 0.5, 0.5, 100];
// Corners by the chosen one's Step (and a ⌘'s Width), not the brush's — first on ST-JOHN, then on INKA too (the owner, 2026-10-19: "move Corners nearer Width — it is the construction, not the Brush section"; "on INKA too — they are alike")
const BRUSH_SL = [['brush', 'Brush width', 'mm', 0.5, 0.5, 50], ['swell', 'With paint', 'mm', 0.5, 0, 20], ['edgeOut', 'Edge: out by', 'mm', 0.25, 0, 10], ['overlap', 'Overlap', 'mm', 0.5, 0, 15], ['drag', 'Drag speed', 'mm/s', 5, 10, SPEED_MAX], ['change', 'Ring change', 'mm', 1, 0, 80], ['join', 'One figure: tiles apart up to', 'mm', 0.5, 0, 50], ['wipe', 'Wipe: the brush up to', '°', 1, 25, ELBOW_MAX]];
const SL_TITLE = {
  brush: 'The round brush as set, dry; with paint it lays wider — With paint below. MARKS\' dashes go by it',
  swell: 'The brush is no felt-tip: it takes up the paint and swells (the owner, 2026-10-19: «the brush is not a felt-tip or a Posca marker … it swells in volume»). Its trail this much wider than Brush width — 9 mm at 3.5 by the ruler on his canvas of 2026-10-17, so 5.5 (est. at other widths). The rings, the Drag strip and the Result go by the trail: the outer ring its half in from the tile\'s edge, so the paint ends on it; the innermost the trail wide, its paint meeting in the middle',
  drag: 'The dry brush along the path; slower through the turns, never to a stop',
  edgeOut: 'Optical compensation: the outer ring moved out towards the tile\'s edge by this much, where the brush lays less than its width and leaves white between touching tiles (the owner, 2026-10-19, IMG_1201: «even round corners should leave a gap only at the corners — the sides must be flush»). 0: its edge on the tile\'s; at the brush\'s half, its middle on it, never past (est.; measure the gap with a ruler, half of it here)',
  overlap: 'One more ring round every tile, the outermost, its brush\'s edge this far past the tile\'s — onto its neighbour, the two over one another, so no white between them (the owner, 2026-10-19: «maybe one more pass on every square — let it go overlapping»). 0: none. At half the brush its middle on the tile\'s edge (est.)',
  change: 'Where a ring\'s seam is a side\'s middle — a node there — the brush goes in to the next ring by an S this long, or as long as the side lets it, as TAPE\'s lane change (the owner, 2026-10-19: «let the transition be as in TAPE or BASF»); 0, as short as a step (est.)',
  corner: 'Every turn of the path a tangent arc this round, or as round as its sides let it — so the board runs through it and never stops (the owner, 2026-10-17: «rounded corners … a stop of the brush during the process kills the effect»); on it ≈ √(250 · r) mm/s at most (est.). On a ⌘ the outer ring\'s, the rings inside it concentric, each its depth less, never under 4 mm — the loop as thick round a turn as along a side; past half a ring\'s side, that ring a circle. Up to 100 mm (the owner, 2026-10-19, Screenshot 9.24.56 PM, the roundings drawn in blue: «Corners up to 100 mm»)',
  join: 'Tiles this near each other, side by side, are one figure — the brush on through them without a lift; farther apart, a figure each, a wipe between (est.)',
  wipe: 'Before every next figure the brush flies over its start and goes up this far at the elbow — +45° its highest — for you to wipe it; Continue brings it down (the owner, 2026-10-17: «here the brush can be lifted up, so that I wipe it»; est.)',
};
const valOf = key => key === 'drag' ? `${S.drag} mm/s` : key === 'wipe' ? `+${S.wipe}°` : key === 'swell' ? `+${fmt(S.swell, 1)} mm · ${fmt(trail(), 1)} mm on the canvas` : key === 'edgeOut' ? `+${fmt(S.edgeOut, 2)} mm · the outer ring ${fmt(edgeOf(po()), 2)} mm in` : key === 'overlap' ? (S.overlap > 0 ? `${fmt(S.overlap, 1)} mm past · a ring, its middle ${fmt(Math.abs(S.overlap - S.brush / 2), 1)} mm ${S.overlap >= S.brush / 2 ? 'out' : 'in'}` : 'off') : key === 'corner' ? `${fmt(S.corner, 1)} mm · ≈ ${Math.min(S.drag, Math.floor(Math.sqrt(250 * S.corner)))} mm/s` : `${fmt(S[key], 1)} mm`;
$('#slBrush').innerHTML = BRUSH_SL.map(([key, label, , step, min, max]) => `<label class="sl" title="${SL_TITLE[key]}"><span class="slh"><span>${label}</span><span class="val" data-v="${key}"></span></span><input class="slider" type="range" data-k="${key}" min="${min}" max="${max}" step="${step}"></label>`).join('');
$('#slBrush').querySelectorAll('input').forEach(inp => {
  inp.oninput = () => { if (!busy) undoPush(); busy = true; S[inp.dataset.k] = +inp.value; showPanel(); kick(); };
  inp.onchange = () => { if (inp.dataset.k === 'corner') relayJohn(); settle(); };   // a ⌘'s round turns: its X from where the paint now begins
});
// a tile's place: its figure, its turn in it, its rings, its way
function tileText(i) {
  const P = planNow(), U = unitOfRect(i), F = figOfRect(i); if (!U || !F) return '';
  if (U.john) {
    const r = S.rects[i], win = [r.w / 2 - 2 * U.width, r.h / 2 - 2 * U.width];
    return `⌘, St. John's Arms · figure ${F.n} of ${P.figs.length}, a figure of its own · <b>${U.R.levels}</b> loop${U.R.levels === 1 ? '' : 's'} from its middle in, every one round the lobes ${U.turn === 'ccw' ? '1 ↙ 2 ↖ 3 ↗ 4 ↘, each ↺ — the sign mirrored' : '1 ↘ 2 ↗ 3 ↖ 4 ↙, each ↻'}, their inner sides on across the middle · Width <b>${fmt(U.width, 0)} mm</b>: ${win[0] > 0.5 && win[1] > 0.5 ? `a window ${fmt(win[0], 0)} × ${fmt(win[1], 0)} mm in every lobe, the grid in the middle ${fmt(2 * U.width, 0)} mm across` : 'the lobes filled to their middles'}`;
  }
  const j = F.us.indexOf(U.id), block = U.rs.length > 1, rings = U.R.levels;
  const e = F.ends[j], inward = Math.hypot(e.b[0] - U.M[0].p[0], e.b[1] - U.M[0].p[1]) < Math.hypot(e.a[0] - U.M[0].p[0], e.a[1] - U.M[0].p[1]);
  return `${block ? `In a block of ${U.rs.length} rectangles, one outline` : 'A tile'} · figure ${F.n} of ${P.figs.length}, ${j + 1} of ${F.us.length} in its run${P.manual ? ', by the nodes' : ''} · <b>${rings}</b> ring${rings === 1 ? '' : 's'}, ${inward ? 'from its outside in' : 'from its middle out'}, ${U.turn === 'ccw' ? '↺' : '↻'}${block && U.rs[0] !== i ? ` · its step and turn the block's first rectangle's` : ''}`;
}
function showRects() {
  const P = planNow();
  $('#rects').innerHTML = S.rects.length ? S.rects.map((r, i) => { const F = figOfRect(i), U = unitOfRect(i), x = F && U ? F.cross[F.us.indexOf(U.id)] : null; return `<button class="tog${isPicked(i) ? ' on' : ''}" data-sel="${i}" title="${fmt(r.w, 1)} × ${fmt(r.h, 1)} mm, step ${fmt(r.step, 1)} mm${U?.rs.length > 1 ? ', in a block' : ''}${x ? ` — ! ${CROSS[x]}` : ''}">${x ? '<b class="bang">!</b> ' : ''}${isJohn(r) ? '⌘' : U?.rs.length > 1 ? '▣' : '□'} ${i + 1}${P.figs.length > 1 && F ? ` · F${F.n}` : ''}</button>`; }).join('') : '<span class="none">No tiles: New, or the R tool and a drag on the canvas.</span>';
  $('#rects').querySelectorAll('[data-sel]').forEach(b => b.onclick = e => {
    const i = +b.dataset.sel;
    if (e.shiftKey) { if (MANY.size < 2) MANY = new Set(S.rects[S.sel] ? [S.rects[S.sel].id] : []); const id = S.rects[i].id; if (MANY.has(id)) MANY.delete(id); else MANY.add(id); if (MANY.size < 2) MANY.clear(); }
    else MANY.clear();
    S.sel = i; EDIT = null; save(); showRects(); showPanel(); kick();
  });
  showRect();
}
let TILE_INFO = false;   // the chosen one's reading open under its i
const R_FIELDS = [['x', 'Left →', 'Its left edge, mm right of the canvas\'s'], ['y', 'Bottom ↑', 'Its bottom edge, mm above the canvas\'s'], ['w', 'Width', 'Left to right'], ['h', 'Height', 'Bottom to top']];
function showRect() {
  const box = $('#rectEdit'), r = S.rects[S.sel];
  if (!r) { box.innerHTML = ''; return; }
  const many = MANY.size > 1 ? `<p class="read"><b>${MANY.size} tiles chosen together</b>: a drag moves them all, the arrows a mm (⇧ ten), ⌫ takes them away, ⌘C ⌘V copies them with their nodes; a click on the canvas or Esc lets them go.</p>` : '';
  box.innerHTML = `${many}
    <h4>${isJohn(r) ? '⌘' : 'Tile'} ${S.sel + 1} · ${fmt(r.w, 1)} × ${fmt(r.h, 1)} mm <button class="info${TILE_INFO ? ' on' : ''}" id="tileInfo" title="Its reading: its figure, its rings or loops, a ⌘'s Width, the white between the rings">i</button></h4>
    <div class="toggles looks" id="turnKeys"><button class="tog${r.turn !== 'ccw' ? ' on' : ''}" data-turn="cw" title="The brush goes round this tile clockwise as it paints it, in or out">↻ Clockwise</button><button class="tog${r.turn === 'ccw' ? ' on' : ''}" data-turn="ccw" title="The brush goes round this tile anticlockwise as it paints it, in or out">↺ Anticlockwise</button></div>
    <div class="sliders"><label class="sl" title="Ring to ring, centre to centre, ${STEP_MIN} … ${STEP_MAX} mm: wider than the brush's trail with paint, white ridges between the rings, Florian's; narrower, they overlap. The innermost one nearer, where its paint meets in the middle"><span class="slh"><span>Step</span><input class="num" type="number" id="rSn" min="${STEP_MIN}" max="${STEP_MAX}" step="0.5" value="${r.step}" aria-label="Step"></span><input class="slider" type="range" id="rS" min="${STEP_MIN}" max="40" step="0.5" value="${Math.min(40, r.step)}"></label>${isJohn(r) ? (() => { const wMax = Math.max(10, Math.ceil(Math.min(r.w, r.h) / 4)); return `<label class="sl" title="The loop's thickness, its paint edge to edge, from the sign's outline in, as ALU-CUT's pipe Width (the owner, 2026-10-19): the rings only so far in, a window in the middle of every lobe, the grid in the middle of the sign twice as wide; at the slider's end the lobes filled to their middles"><span class="slh"><span>Width</span><input class="num" type="number" id="rWn" min="${JOHN_W_MIN}" max="${JOHN_W_MAX}" step="1" value="${r.width}" aria-label="Width"></span><input class="slider" type="range" id="rW" min="${JOHN_W_MIN}" max="${wMax}" step="1" value="${Math.min(wMax, r.width)}"></label>`; })() : ''}<label class="sl" title="${SL_TITLE.corner} — for every tile and ⌘ on the canvas"><span class="slh"><span>Corners</span><input class="num" type="number" id="rCn" min="${CORNER_SL[4]}" max="${CORNER_SL[5]}" step="${CORNER_SL[3]}" value="${S.corner}" aria-label="Corners"></span><input class="slider" type="range" id="rC" min="${CORNER_SL[4]}" max="${CORNER_SL[5]}" step="${CORNER_SL[3]}" value="${S.corner}"></label></div>
    <p class="read" id="rGap"${TILE_INFO ? '' : ' hidden'}>${tileText(S.sel)} · ${r.step > trail() + 0.05 ? `white <b>${fmt(r.step - trail(), 1)} mm</b> between the rings` : r.step < trail() - 0.05 ? `the rings' paint overlapping by <b>${fmt(trail() - r.step, 1)} mm</b>` : 'ring to ring'}</p>
    <div class="grid4">${R_FIELDS.map(([q, l, t]) => `<label title="${t}">${l} <input data-r="${q}" type="number" step="0.5"${q === 'w' || q === 'h' ? ` min="${MIN_SIDE}"` : ''}><em>mm</em></label>`).join('')}</div>
    <div class="grid4 keys"><button class="btn" id="rFit" title="This tile the whole canvas">Whole canvas</button><button class="btn" id="rDup" title="A copy of it beside it on the right, touching: the same figure">Duplicate</button></div>
    <div class="grid4 keys three"><button class="btn" id="rEarly"${S.sel === 0 ? ' disabled' : ''} title="Earlier in the list: a figure runs in the order of its first tile">Run earlier</button><button class="btn" id="rLate"${S.sel === S.rects.length - 1 ? ' disabled' : ''} title="Later in the list">Run later</button><button class="btn" id="rDel" title="Take it away — or ⌫ on the keyboard; ⌘Z brings it back">Delete</button></div>`;
  box.querySelectorAll('[data-r]').forEach(inp => { inp.value = Math.round(r[inp.dataset.r] * 100) / 100; inp.onchange = () => {
    const v = +inp.value; if (inp.value === '' || !fin(v)) return settle();
    undoPush(); r[inp.dataset.r] = inp.dataset.r === 'x' ? clampX(v) : inp.dataset.r === 'y' ? clampY(v) : v; Object.assign(r, cleanRect(r)); settle();
  }; });
  const inp = $('#rS'), num = $('#rSn');
  const stepTo = v => {
    if (!fin(v)) return;
    if (!busy) undoPush(); busy = true; r.step = Math.max(STEP_MIN, Math.min(STEP_MAX, v));
    if (document.activeElement !== num) num.value = r.step;
    inp.value = Math.min(40, r.step); kick();
  };
  inp.oninput = () => stepTo(+inp.value);
  inp.onchange = () => settle();
  num.oninput = () => { if (num.value !== '') stepTo(+num.value); };
  num.onchange = () => { num.value = r.step; settle(); };
  const cIn = $('#rC'), cNum = $('#rCn');                                            // Corners, here by Step and Width: the whole canvas's
  if (cIn) {
    const cornerTo = v => {
      if (!fin(v)) return;
      if (!busy) undoPush(); busy = true; S.corner = Math.max(CORNER_SL[4], Math.min(CORNER_SL[5], v));
      if (document.activeElement !== cNum) cNum.value = S.corner;
      cIn.value = S.corner; kick();
    };
    cIn.oninput = () => cornerTo(+cIn.value);
    cIn.onchange = () => { relayJohn(); settle(); };
    cNum.oninput = () => { if (cNum.value !== '') cornerTo(+cNum.value); };
    cNum.onchange = () => { cNum.value = S.corner; relayJohn(); settle(); };
  }
  const info = $('#tileInfo');                                                       // its reading under i (the owner, 2026-10-19: "this text we hide under (i)")
  if (info) info.onclick = () => { TILE_INFO = !TILE_INFO; $('#rGap').hidden = !TILE_INFO; info.classList.toggle('on', TILE_INFO); };
  const wIn = $('#rW'), wNum = $('#rWn');                                            // a ⌘'s Width, as Step
  if (wIn) {
    const widthTo = v => {
      if (!fin(v)) return;
      if (!busy) undoPush(); busy = true; r.width = Math.max(JOHN_W_MIN, Math.min(JOHN_W_MAX, Math.round(v)));
      if (document.activeElement !== wNum) wNum.value = r.width;
      wIn.value = Math.min(+wIn.max, r.width); kick();
    };
    wIn.oninput = () => widthTo(+wIn.value);
    wIn.onchange = () => { relayJohn(S.sel); settle(); };
    wNum.oninput = () => { if (wNum.value !== '') widthTo(+wNum.value); };
    wNum.onchange = () => { wNum.value = r.width; relayJohn(S.sel); settle(); };
  }
  const act = (sel, fn) => box.querySelectorAll(sel).forEach(b => b.onclick = () => { undoPush(); fn(b); settle(); });
  act('#rFit', () => { Object.assign(r, { x: 0, y: 0, w: S.boardW, h: S.boardH }); if (isJohn(r)) relayJohn(S.sel); });
  act('#rDup', () => { const c = structuredClone(r); c.id = newId(); c.x = clampX(r.x + r.w); S.rects.push(c); S.sel = S.rects.length - 1; });
  act('[data-turn]', b => { const U = unitOfRect(S.sel); for (const i of U ? U.rs : [S.sel]) S.rects[i].turn = b.dataset.turn; });
  act('#rEarly', () => { const i = S.sel; [S.rects[i], S.rects[i - 1]] = [S.rects[i - 1], S.rects[i]]; S.sel--; });
  act('#rLate', () => { const i = S.sel; [S.rects[i], S.rects[i + 1]] = [S.rects[i + 1], S.rects[i]]; S.sel++; });
  $('#rDel').onclick = deleteRect;
}
// The nodes' reading and keys; a tile marked ! named
const CROSS = { middle: 'its nodes in and out both at its middle: the brush goes out round it and back across its rings to leave — one of them to its edge?', edge: 'its nodes in and out both on its edge: the brush goes in round it and across its rings from the middle to leave — one of them to its middle?' };
function showNodes() {
  const P = planNow(), bang = P.figs.flatMap(F => F.us.map((u, j) => F.cross[j] ? `<span class="warn">! Tile ${P.units[u].rs.map(i => i + 1).join('+')}: ${CROSS[F.cross[j]]}</span>` : '').filter(Boolean)), alone = P.manual ? P.figs.filter(F => F.us.length === 1).map(F => P.units[F.us[0]].rs.map(i => i + 1).join('+')) : [];
  $('#nodesOf').textContent = P.manual ? `${P.links.length} · by hand` : 'none · the snake';
  $('#nodeRead').innerHTML = !S.rects.length ? '' : P.manual
    ? `<b>${P.links.length}</b> node${P.links.length === 1 ? '' : 's'}: ${P.figs.filter(F => F.us.length > 1).length} chain${P.figs.filter(F => F.us.length > 1).length === 1 ? '' : 's'}, the brush down along each${alone.length ? ` · alone, a figure each: tile${alone.length === 1 ? '' : 's'} ${alone.join(', ')}` : ''}${S.nodeSel >= 0 && S.nodes[S.nodeSel] ? ' · a node chosen: ⌫ takes it away' : ''}`
    : 'No nodes: the brush runs the snake by itself — tiles side by side one figure, from the bottom left up. N lays it as nodes, to change.';
  if (bang.length) $('#nodeRead').innerHTML += '<br>' + bang.join('<br>');
  $('#btnClearNodes').disabled = !S.nodes.length;
}
$('#btnSnakeNodes').onclick = () => { undoPush(); const keep = S.nodes; S.nodes = []; PL = null; const P = planNow(); S.nodes = snakeNodes(P, S.rects); if (!S.nodes.length) S.nodes = keep; S.tool = 'node'; S.view = 'drag'; settle(); };
$('#btnClearNodes').onclick = () => { if (!S.nodes.length) return; undoPush(); S.nodes = []; S.nodeSel = -1; settle(); };
$('#btnNew').onclick = () => { undoPush(); S.rects.push(wholeCanvas()); S.sel = S.rects.length - 1; S.tool = 'edit'; settle(); };
$('#btnDraw').onclick = () => setTool('rect');

// ---------- the paints (TAPE's, CCD's, BIAS's: one palette) ----------
// The strip of the owner's 24 paints by the Tools: a click picks the paint
// and takes up M. The chosen figure's palette in hand: a paint in the list,
// then one in the strip — it takes its place; + then a paint — it joins, the
// tiles dealt again; × — out. New colours, New spokes, the meta keys and
// INKA's own act on the chosen tile's figure.
// his 24, two columns of 12, and under each column two to buy, a red dot • (the owner, 2026-10-19: "a red dot • — to buy, or not in stock yet")
const STRIP = [...TAPE_PAINTS.slice(0, 12), ...TO_BUY.slice(0, 2), ...TAPE_PAINTS.slice(12), ...TO_BUY.slice(2)];
$('#paints').innerHTML = STRIP.map(([id, name, hex]) => `<div class="chip${PAINT[id].buy ? ' buy' : ''}" data-paint="${id}"><button class="sw" style="background:${hex}" aria-label="${name}"></button><span class="cnt"></span></div>`).join('');
$('#paints').querySelectorAll('[data-paint]').forEach(ch => ch.querySelector('.sw').onclick = () => {
  if (EDIT) { editPaint(ch.dataset.paint); return; }
  S.paint = ch.dataset.paint; setTool('paint');
});
let EDIT = null;                                                                   // { mode: 'change', id } | { mode: 'add' }
const seedNew = () => Math.floor(Math.random() * 1e9);
const figRects = F => F ? F.us.flatMap(id => planNow().units[id].rs).sort((a, b) => a - b) : [];
const figSausages = F => figRects(F).flatMap(i => sausagesOf(S.rects, i));
const usedOf = F => [...new Set(figSausages(F).map(q => q.paint))];
function palOf(F) {
  const r = figRects(F).map(i => S.rects[i]).find(q => q.pal);
  return r ? structuredClone(r.pal) : usedOf(F).length ? { name: 'Own', core: usedOf(F), accent: [], seed: 1 } : null;
}
// a figure's sausages dealt: 'colours', new paints in their places (none lying, the spokes laid); 'spokes', new places, the paints kept;
// figures, many at once (dealFigures): the paints spread over them all, a tile never its neighbour's
function dealOn(F, pal, seed, mode) {
  const Fs = Array.isArray(F) ? F : [F], d = Fs.length > 1 ? dealFigures(S.rects, planNow().units, Fs, pal, seed, mode, po()) : dealFigure(S.rects, planNow().units, Fs[0], pal, seed, mode, po());
  for (const [i, ss] of d.ss) { S.rects[i].ss = ss; S.rects[i].pal = d.pal; }
}
const chosenFig = () => figOfRect(S.sel);
// A ⌘'s X laid again where its loop now is, its paints kept — after its
// Width, Corners or size changed, so no sausage lies in a lobe's window or
// a box's corner the brush never comes to; i, the ⌘'s rectangle, or all
function relayJohn(i = null) {
  const P = planNow();
  for (const F of P.figs) {
    const U = P.units[F.us[0]];
    if (!U.john || (i !== null && !U.rs.includes(i)) || !figSausages(F).length) continue;
    const pal = palOf(F); dealOn(F, pal, pal.seed ?? 1, 'spokes');
  }
}
// the figures the keys act on: the chosen tile's, or with tiles chosen together (⌘A, ⇧) every one of theirs
const chosenFigs = () => { const P = planNow(), on = new Set(picked()); return MANY.size > 1 ? P.figs.filter(F => F.us.some(id => P.units[id].rs.some(i => on.has(i)))) : [chosenFig()].filter(Boolean); };
function editPaint(id) {
  const e = EDIT, F = chosenFig(); EDIT = null;
  if (!F || !figSausages(F).length) { showPanel(); return; }
  undoPush();
  if (e.mode === 'change' && e.id !== id) {
    const swap = a => [...new Set(a.map(q => q === e.id ? id : q))];
    for (const i of figRects(F)) {
      const r = S.rects[i];
      r.ss = r.ss.map(q => q.paint === e.id ? { ...q, paint: id } : q);
      if (r.pal) { const core = swap(r.pal.core); r.pal = { ...r.pal, core, accent: swap(r.pal.accent).filter(q => !core.includes(q)), ...(r.pal.pure === e.id ? { pure: id } : {}) }; }
    }
  } else if (e.mode === 'add') {
    const pal = palOf(F) || { name: 'Own', core: [], accent: [], seed: 1 };
    if (![...pal.core, ...pal.accent].includes(id)) { pal.core.push(id); dealOn(F, pal, pal.seed || 1, 'colours'); }
  }
  settle();
}
function dropPaint(id) {
  const F = chosenFig(); if (!F) return;
  undoPush();
  const pal = palOf(F); pal.core = pal.core.filter(q => q !== id); pal.accent = pal.accent.filter(q => q !== id); if (pal.pure === id) delete pal.pure;
  if (!pal.core.length && pal.accent.length) pal.core = pal.accent.splice(0);
  if (pal.core.length) dealOn(F, pal, pal.seed || 1, 'colours');
  else for (const i of figRects(F)) { S.rects[i].ss = S.rects[i].ss.filter(q => q.paint !== id); delete S.rects[i].pal; }
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
$('#btnPaintsClear').onclick = () => { const Fs = chosenFigs(); if (!Fs.some(F => figSausages(F).length)) return; undoPush(); for (const F of Fs) for (const i of figRects(F)) S.rects[i].ss = []; settle(); };
$('#btnNewColours').onclick = () => { const Fs = chosenFigs(); if (!Fs.length) return; undoPush(); const seed = seedNew(); dealOn(Fs, newPalette(seed, palOf(Fs[0])?.name), seed, 'colours'); S.view = 'result'; settle(); };
$('#btnNewSpokes').onclick = () => { const Fs = chosenFigs(); if (!Fs.length) return; undoPush(); const seed = seedNew(); dealOn(Fs, palOf(Fs[0]) || newPalette(seed), seed, 'spokes'); S.view = 'result'; settle(); };
document.querySelectorAll('[data-meta]').forEach(b => b.onclick = () => { const Fs = chosenFigs(); if (!Fs.length) return; undoPush(); const seed = seedNew(); dealOn(Fs, structuredClone(INKA_META[b.dataset.meta]), seed, 'colours'); S.view = 'result'; settle(); });
// Reference (the owner, 2026-10-19, Screenshot 4.15.26 PM: "pictures with the colour range there, appearing on all ten squares … the analysis must
// match the colours we have in stock"): the palette off the reference, in his paints only (inkaplan.js, paletteOfPixels), dealt on every tile
function refPixels() {
  const img = REF.img, kk = Math.min(1, 160 / Math.max(img.naturalWidth, img.naturalHeight)), c2 = document.createElement('canvas');
  c2.width = Math.max(1, Math.round(img.naturalWidth * kk)); c2.height = Math.max(1, Math.round(img.naturalHeight * kk));
  const c = c2.getContext('2d', { willReadFrequently: true }); c.drawImage(img, 0, 0, c2.width, c2.height);
  return { px: c.getImageData(0, 0, c2.width, c2.height).data, w: c2.width, h: c2.height };
}
$('#btnRefOk').onclick = () => {
  if (!REF) { $('#hint').textContent = 'No reference yet: 📎 Add new reference — its colours come in your paints.'; return; }
  const P = planNow(), R = refPixels(), pal = paletteOfPixels(R.px, R.w, R.h); if (!pal || !P.figs.length) return;
  undoPush(); const seed = seedNew(); dealOn(P.figs, pal, seed, 'colours'); S.view = 'result'; settle();
};
// Density: the paint in a sausage, as far as it carries the line (CCD's reachOf)
const REACH = new Map(), reachAt = d => { if (!REACH.has(d)) REACH.set(d, reachOf(d)); return REACH.get(d); };
const densityText = () => `${S.density} % · full ≈ ${fmt(reachAt(S.density).full, 0)} mm`;
$('#slPaint').innerHTML = `<label class="sl" title="The paint in a sausage: at 50 % the measured one — the line full 70 mm, then fading (TAPE-colors/IMAGE 2026-10-12 19:23:33); twice as much every 25 % (the Result; est.)"><span class="slh"><span>Density</span><span class="val" id="o-dens"></span></span><input class="slider" type="range" id="dens" min="0" max="100" step="1"></label>`;
$('#dens').oninput = e => { if (!busy) undoPush(); busy = true; S.density = +e.target.value; $('#o-dens').textContent = densityText(); kick(); };
$('#dens').onchange = () => settle();
document.querySelectorAll('#views [data-view]').forEach(b => b.onclick = () => { S.view = b.dataset.view; if (S.view !== 'result') stopPlay(); $('#spokeTip').hidden = true; save(); showPanel(); kick(); });
$('#ink').onchange = e => { S.ink = e.target.checked; settle(); };
$('#inkOff').onclick = () => { S.ink = false; settle(); };
$('#inkOn').onclick = () => { S.ink = true; settle(); };
$('#flights').onchange = e => { S.flights = e.target.checked; save(); showPanel(); kick(); };
$('#flightsOff').onclick = () => { S.flights = false; save(); showPanel(); kick(); };
$('#flightsOn').onclick = () => { S.flights = true; save(); showPanel(); kick(); };
function showPaints() {
  const F = chosenFig(), ss = figSausages(F), pal = palOf(F), count = {};
  for (const q of ss) count[q.paint] = (count[q.paint] || 0) + 1;
  const Fs = chosenFigs();
  $('#paintsOf').textContent = Fs.length > 1 ? `${Fs.length} figures, chosen together` : F ? `Figure ${F.n}` : '';
  $('#paints').querySelectorAll('[data-paint]').forEach(ch => {
    const q = PAINT[ch.dataset.paint], n = count[q.id] || 0;
    ch.querySelector('.cnt').textContent = n || '';
    ch.classList.toggle('pick', S.tool === 'paint' && q.id === S.paint);
    ch.title = `${q.name}${q.buy ? ' • to buy, not in stock yet — its colour off your photographs, INKA/references/' : ' — its colour off your swatch'} (est.)${n ? `, ${n} sausage${n === 1 ? '' : 's'} in figure ${F.n}` : ''} — a click: the paint of the next sausage (M)`;
  });
  const inUse = [...new Set([...(pal && pal.name !== 'Own' ? [...pal.core, ...pal.accent, ...(pal.pure ? [pal.pure] : []), ...(pal.spot ? [pal.spot] : [])] : []), ...usedOf(F)])], thin = id => pal?.accent.includes(id) && !pal.core.includes(id);
  $('#paintList').innerHTML = inUse.map(id => `<span class="pl${count[id] ? '' : ' none'}${EDIT?.id === id ? ' on' : ''}" data-pl="${id}" title="${PAINT[id].name}${thin(id) ? ', thin' : ''}${pal?.pure === id ? ', the lone figure\'s pure paint' : ''}${pal?.spot === id ? ', the spot: one tile only' : ''} — a click shows its places; then a paint in the strip: it takes its place"><i style="background:${PAINT[id].hex}"></i>${PAINT[id].name}${PAINT[id].buy ? ' <b class="buydot" title="To buy: not in stock yet">•</b>' : ''}${thin(id) ? ' <em>thin</em>' : ''}${count[id] ? ` <em>×${count[id]}</em>` : ''}<b class="x" data-x="${id}" title="Take ${PAINT[id].name} out">×</b></span>`).join('')
    + (inUse.length ? `<span class="pl add${EDIT?.mode === 'add' ? ' on' : ''}" data-add title="Add a paint: then click it in the strip on the left">+</span>` : '');
  $('#paints').classList.toggle('editing', !!EDIT);
  document.querySelectorAll('[data-meta]').forEach(b => b.classList.toggle('on', pal?.name === b.dataset.meta));
  $('#btnRefOk').classList.toggle('on', pal?.name === 'Reference'); $('#btnRefOk').disabled = !REF;
  if (document.activeElement !== $('#dens')) $('#dens').value = S.density;
  $('#o-dens').textContent = densityText();
  $('#paintRead').innerHTML = [
    'The sausages, where you squeeze the paints: a cross, X, on every tile — from each corner along the diagonal in to the innermost ring (the owner, 2026-10-19: «logical and simple»), as Florian squeezes his across every lane, so every ring takes the paint up as the brush passes; a block, from every corner of its outline. A tile its paint, never its neighbour\'s, now and then a second; a figure of one tile or block one pure paint, as Heather Day\'s flat blue. New colours: a palette at random, the sausages in their places — or, none lying, the spokes laid. New spokes: new places, the paints kept. The keys act on the chosen tile\'s figure — with tiles chosen together (⌘A, ⇧ and a click) on all of theirs, the paints spread over them, a tile never its neighbour\'s. Reference, OK: the palette off the reference, in your paints only, on every tile, dealt anew at every press in the picture\'s shares. M and a paint in the strip: a click on a tile.',
    F && `<b>${ss.length}</b> sausage${ss.length === 1 ? '' : 's'} in figure ${F.n}, ${F.us.length} tile${F.us.length === 1 ? '' : 's'}`,
    `Density ${S.density} %: a sausage keeps the line full about ${fmt(reachAt(S.density).full, 0)} mm, gone by ${fmt(reachAt(S.density).gone, 0)}${S.density === DENSITY_NEW ? ' — the measure, TAPE-colors/IMAGE 2026-10-12 19:23:33' : ' (est.; 50 % the measure)'}`,
    pal && pal.name !== 'Own' && `Palette <b>${pal.name}</b>: ${pal.core.map(id => PAINT[id].name + (pal.w?.[id] ? ` ${Math.round(pal.w[id] * 100)} %` : '')).join(', ')}${pal.accent.length ? `; thin: ${pal.accent.map(id => PAINT[id].name).join(', ')}` : ''}${pal.pure ? `; a lone figure ${PAINT[pal.pure].name}` : ''}${pal.spot ? `; <b>the spot ${PAINT[pal.spot].name}</b>, the picture's brightest speck — one tile only` : ''} · seed ${pal.seed}`,
    F && !ss.length && 'No sausages yet: New colours, New spokes, a palette key, or M.',
    (() => { const b = [...new Set(ss.map(q => q.paint))].filter(id => PAINT[id].buy); return b.length ? `<span class="warn">• To buy, not in stock yet: ${b.map(id => PAINT[id].name).join(', ')}</span>` : ''; })(),
  ].filter(Boolean).join('<br>');
}
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
  document.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === S.tool));
  $('#fields').querySelectorAll('input').forEach(inp => { if (document.activeElement !== inp) inp.value = S[inp.dataset.k]; });
  $('#hint').textContent = EDIT ? (EDIT.mode === 'add' ? 'Add a paint to the figure\'s palette: click it in the strip on the left (+ again: leave it).' : `${PAINT[EDIT.id].name}: its sausages outlined black, numbered in MARKS' order. To change it, click the paint to put in its place in the strip on the left; ${PAINT[EDIT.id].name} in the list again: leave it.`) : HINT[S.tool];
  document.querySelectorAll('#views [data-view]').forEach(b => b.classList.toggle('on', b.dataset.view === S.view));
  $('#ink').checked = S.ink; $('#inkOff').classList.toggle('on', !S.ink); $('#inkOn').classList.toggle('on', S.ink);
  $('#flights').checked = S.flights; $('#flightsOff').classList.toggle('on', !S.flights); $('#flightsOn').classList.toggle('on', S.flights);
  showPaints();
}
const what = () => {
  const P = planNow(), j = S.rects.filter(isJohn).length, t = S.rects.length - j;
  return `${P.figs.length} figure${P.figs.length === 1 ? '' : 's'}, ${[(t || !j) && `${t} tile${t === 1 ? '' : 's'}`, j && `${j} ⌘`].filter(Boolean).join(', ')}`;
};
// Settled: the mouse let go, a slider let go — the plan, the reading, the LCD.
function settle() {
  busy = false;
  if (S.sel >= S.rects.length) S.sel = Math.max(0, S.rects.length - 1);
  {                                                                                    // the nodes the plan takes, in their order: one given way, or refused, gone
    const L = planNow().links;
    if (S.nodes.length && L.length !== S.nodes.length) { const sel = S.nodes[S.nodeSel]; S.nodes = L.map(l => S.nodes[l.i]); S.nodeSel = S.nodes.indexOf(sel); }
    if (S.nodeSel >= S.nodes.length) S.nodeSel = -1;
  }
  const P = planNow(), D = dragRun(), Mk = marksRun(), Tr = JOHN ? traceRun() : null, here = hereNow(), lines = [];
  lines.push(!P.figs.length ? 'No tiles: New, or the R tool and a drag on the canvas.' : `<b>${P.figs.length}</b> figure${P.figs.length === 1 ? '' : 's'} · ${S.rects.length} tile${S.rects.length === 1 ? '' : 's'} · DRAG: every figure one line, the brush down all the way, ${fmt(D.mm / 1000, 2)} m at ${S.drag} mm/s, ≈ ${fmt(D.seconds / 60, 1)} min (est.)`);
  for (const F of P.figs) lines.push(`${figName(F, P.units)}: ${fmt(F.length / 1000, 2)} m, ${F.us.map(id => P.units[id].R.levels).reduce((a, b) => a + b, 0)} rings`);
  if (D.stops) {                                                                     // the LCD's percent goes by the length painted: where it stands at each wipe
    const at = P.figs.slice(1).map((_, j) => Math.round(P.figs.slice(0, j + 1).reduce((a, F) => a + F.length, 0) / P.length * 100));
    lines.push(`DRAG stops <b>${D.stops}</b> time${D.stops === 1 ? '' : 's'}, before every next figure: the brush up +${S.wipe}° over its start, wipe it, squeeze its sausages, Continue — the LCD at ${at.map(v => `${v} %`).join(', ')}`);
  }
  if (Tr?.stretches) lines.push(`TRACE: DRAG's own line, ${fmt(Tr.mm / 1000, 2)} m, ${S.ink ? `in tinted water from the cup, <b>${Tr.dips}</b> dip${Tr.dips === 1 ? '' : 's'}, one every ${TRACE_DIP} mm, each next stretch on from ${DIP_LAP} mm back` : 'Ink OFF: no dip, the brush as it is'}, at ${S.drag} mm/s, ≈ ${fmt(Tr.seconds / 60, 1)} min (est.)`);
  if (!JOHN && Mk.marks) lines.push(`MARKS: <b>${Mk.marks}</b> dash${Mk.marks === 1 ? '' : 'es'}, a sausage each, ${S.ink ? `in watercolour, ${Mk.dips} dip${Mk.dips === 1 ? '' : 's'} (one every ${MARKS_DIP})` : 'Ink OFF: no dip'}, at ${MARK_SPEED} mm/s, ≈ ${fmt(Mk.seconds / 60, 1)} min (est.)`);
  lines.push(`The canvas from home: its bottom left corner at carriage <b>X ${fmt(here.x - S.boardH / 2, 1)} · Y ${fmt(here.y - S.boardW / 2, 1)} mm</b>; TEST's dots ${TEST_MARGIN} mm in from its edges.`);
  $('#planRead').innerHTML = lines.join(' · ');
  const warn = [D.fault && `The plan is wrong, DRAG will not run it: ${D.fault}.`, !JOHN && Mk.fault && `The plan is wrong, MARKS will not run it: ${Mk.fault}.`, Tr?.fault && `The plan is wrong, TRACE will not run it: ${Tr.fault}.`, walls(D), JOHN ? walls(Tr) : walls(Mk)].filter(Boolean);
  $('#planWarn').innerHTML = warn.map(w => `<span class="warn">${w}</span>`).join(' ');
  $('#planWarn').hidden = !warn.length;
  $('#stats').textContent = !P.figs.length ? 'no tiles' : `${what()}${JOHN ? (Tr.stretches ? ` · TRACE ≈ ${fmt(Tr.seconds / 60, 1)} min${S.ink ? `, ${Tr.dips} dips` : ''}` : '') : Mk.marks ? ` · ${Mk.marks} sausages · MARKS ≈ ${fmt(Mk.seconds / 60, 1)} min` : ''} · DRAG ${fmt(D.mm / 1000, 2)} m ≈ ${fmt(D.seconds / 60, 1)} min${D.stops ? `, ${D.stops} wipe${D.stops === 1 ? '' : 's'}` : ''} (est.)`;
  showFiles();
  showPanel(); showRects(); showNodes(); save(); layout(); lastLcd && lcd(lastLcd);
}
function walls(P_) {
  const h = hereNow();
  if (!P_?.carriage || !P_.rows.length) return '';
  const R = reach(), b = P_.carriage, x0 = h.x + b.x0, x1 = h.x + b.x1, y0 = h.y + b.y0, y1 = h.y + b.y1;
  const out = [x0 < R.x.min && `${fmt(R.x.min - x0, 0)} mm past the bottom wall`, x1 > R.x.max && `${fmt(x1 - R.x.max, 0)} mm past the top wall`,
    y0 < R.y.min && `${fmt(R.y.min - y0, 0)} mm past the left wall`, y1 > R.y.max && `${fmt(y1 - R.y.max, 0)} mm past the right wall`].filter(Boolean);
  return out.length ? `The brush would go ${out.join(', ')}: move the canvas or the tiles.` : '';
}
function showFiles() {
  const name = `${TAB}_drag.svg`, box = $('#files');
  box.innerHTML = `<button class="tog" data-file="drag" title="${name}">Drag</button>`;
  box.querySelector('[data-file]').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([dragSvg(planNow(), po())], { type: 'image/svg+xml' })); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000); $('#fileRead').textContent = `saved ${name}`;
  };
}

// ---------- the reference: tracing paper over the canvas (CCD's) ----------
let REF = null;
function setRef(src, name, store) {
  const img = new Image();
  img.onload = () => {
    REF = { img, name };
    if (store) {
      const kk = Math.min(1, 1400 / Math.max(img.naturalWidth, img.naturalHeight)), c2 = document.createElement('canvas');
      c2.width = Math.round(img.naturalWidth * kk); c2.height = Math.round(img.naturalHeight * kk);
      c2.getContext('2d').drawImage(img, 0, 0, c2.width, c2.height);
      REF.kept = true;
      try { localStorage.setItem(REF_KEY, JSON.stringify({ name, src: c2.toDataURL('image/jpeg', 0.85) })); } catch { REF.kept = false; }   // the browser's room full: here till a reload
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
  $('#btnRefOk').disabled = !REF;
  $('#refOp').value = S.refOpacity;
  $('#refRead').innerHTML = REF ? `${esc(REF.name)} · <b>${S.refOpacity} %</b>${REF.kept === false ? ' · <span class="warn">this browser has no room to keep it: gone after a reload</span>' : ''}` : 'Over the canvas, the whole of it inside, to lay the tiles to.';
}
$('#btnRef').onclick = () => $('#refIn').click();
$('#refIn').onchange = e => { const f = e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => setRef(rd.result, f.name, true); rd.readAsDataURL(f); e.target.value = ''; };
$('#refOp').oninput = e => { S.refOpacity = +e.target.value; syncRef(); save(); kick(); };
function loadRef() { try { const o = JSON.parse(localStorage.getItem(REF_KEY) || 'null'); if (o && o.src) setRef(o.src, o.name || 'reference', false); } catch { } }

// ---------- 💾 SAVE INKA ----------
// As CCD's: an SVG of the canvas in mm — the tiles, the figures' paths, the
// sausages — the whole state in its metadata, a PNG preview; its label
// INKA: the Library opens it here.
const label = () => `${TAB_NAME} · ${what()} · ${S.boardW} × ${S.boardH} mm · brush ${fmt(S.brush, 1)} mm, ${fmt(trail(), 1)} with paint`;
function svgOf() {
  const W = S.boardW, H = S.boardH, f = v => (Math.round(v * 100) / 100).toFixed(2), P = planNow();
  const meta = JSON.stringify({ rembrandt: '1.0.9', [TAB]: true, label: label(), settings: S }).replace(/&/g, '\\u0026').replace(/</g, '\\u003c').replace(/--/g, '- -');
  const rects = S.rects.map((r, i) => `  <rect x="${f(r.x)}" y="${f(H - r.y - r.h)}" width="${f(r.w)}" height="${f(r.h)}" data-tile="${i + 1}" data-step="${f(r.step)}"${isJohn(r) ? ' data-kind="john"' : ''}/>`).join('\n');
  const paths = dragSvg(P, po()).match(/ {2}<path [^\n]*\/>/g) || [];
  const sausages = sausagesOf(S.rects).map(q => `  <line x1="${f(q.a[0])}" y1="${f(H - q.a[1])}" x2="${f(q.b[0])}" y2="${f(H - q.b[1])}" stroke="${PAINT[q.paint].hex}" data-paint="${q.paint}"${q.thin ? ' data-thin="1"' : ''}/>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}">
<!-- Rembrandt v.1.0.9 · ${esc(label())}; 1 unit = 1 mm, y down; DRAG's figures in running order -->
<metadata id="rembrandt-test">${meta}</metadata>
<rect width="${W}" height="${H}" fill="${GROUND}" stroke="#24221F" stroke-width="0.5"/>
<g id="paths" fill="none" stroke="#24221F" stroke-opacity="0.12" stroke-width="${f(trail())}" stroke-linejoin="round" stroke-linecap="round">
${paths.join('\n')}
</g>
<g id="tiles" fill="none" stroke="#EB7A25" stroke-width="0.5">
${rects}
</g>
<g id="sausages" stroke-width="${SAUSAGE_W}" stroke-linecap="round">
${sausages}
</g>
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

// ---------- the deck: TEST, MARKS, DRAG, PAUSE (CCD's) ----------
const post = async path => { try { const r = await fetch(path, { method: 'POST' }); return await r.text(); } catch { return 'start rembrandt.py'; } };
let RUN_KEY = null;
async function start(key, blocks, info, log) {
  try {
    RUN = blocks; RUN_INFO = info; RUN_KEY = key;
    const r = await fetch('/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blocks, log }) });
    $('#runState').textContent = await r.text();
  } catch { $('#runState').textContent = 'start rembrandt.py'; }
}
$('#btnDrag').onclick = async () => {
  settle();
  const D = dragRun(), P = planNow(), sausages = sausagesOf(S.rects).length;
  if (!D.rows.length) { $('#runState').innerHTML = '<span class="warn">Nothing to run: no tiles on the canvas.</span>'; return; }
  if (walls(D)) { $('#runState').innerHTML = `<span class="warn">${walls(D)}</span>`; return; }
  if (D.fault) { $('#runState').innerHTML = `<span class="warn">Not run: the plan is wrong — ${D.fault}.</span>`; return; }
  const text = (D.stops ? `${P.figs.length} figures: squeeze the first one's sausages only now. DRAG stops ${D.stops} time${D.stops > 1 ? 's' : ''}, before every next figure: the brush up +${S.wipe}° over its start, for you to wipe it and squeeze that figure's sausages, then Continue.\n\n` : '')
    + `Every figure one line, tile after tile, the brush down all the way — no stop, no PAUSE but at a figure's end; ${fmt(D.mm / 1000, 2)} m with the dry brush, no dip, at ${S.drag} mm/s, ≈ ${fmt(D.seconds / 60, 1)} min (est.).`
    + `\n\n${sausages ? 'Are the sausages squeezed on their marks, as Drag shows them?' : 'No sausages planned: is the paint on the canvas?'}`;
  if (!confirm(`DRAG ${TAB_NAME}, ${what()}: ${text}`)) return;
  await start('drag', D.blocks, { seconds: D.seconds, rows: D.rows },
    { page: TAB, pass: 'drag', label: label(), settings: S, here: hereNow(), estimate_s: Math.round(D.seconds) });
};
// TRACE (ST-JOHN): DRAG's own line in tinted water, the trace to squeeze the paint on
if (JOHN) $('#btnTrace').onclick = async () => {
  await loadInk(); settle();
  const T = traceRun(), P = planNow();
  if (!T.stretches) { $('#runState').innerHTML = '<span class="warn">Nothing to trace: no tiles, no ⌘ on the canvas.</span>'; return; }
  if (S.ink && cupProblem(cup())) { $('#runState').innerHTML = `<span class="warn">TRACE dips in the cup with INK ON: ${cupProblem(cup())}</span>`; return; }
  if (T.fault) { $('#runState').innerHTML = `<span class="warn">Not run: the plan is wrong — ${T.fault}.</span>`; return; }
  if (walls(T)) { $('#runState').innerHTML = `<span class="warn">${walls(T)}</span>`; return; }
  if (!confirm(`TRACE ${TAB_NAME}, ${what()}: every figure's path, the very line DRAG runs, ${fmt(T.mm / 1000, 2)} m at ${S.drag} mm/s — ${S.ink ? `in tinted water from the cup, a dip every ${TRACE_DIP} mm, ${T.dips} dip${T.dips === 1 ? '' : 's'}` : 'Ink OFF: no dip, the brush as it is'}, ≈ ${fmt(T.seconds / 60, 1)} min (est.).\n\nThen squeeze the paint on the trace, as Florian, and DRAG with the brush dry. Is the brush in the holder?`)) return;
  S.view = 'drag'; settle();
  await start('trace', T.blocks, { seconds: T.seconds, rows: T.rows },
    { page: TAB, pass: 'trace', label: label(), settings: S, here: hereNow(), ...(S.ink ? { cup: cup() } : {}), estimate_s: Math.round(T.seconds) });
};
if (!JOHN) $('#btnMarks').onclick = async () => {
  await loadInk(); settle();
  const M = marksRun();
  if (!M.marks) { $('#runState').innerHTML = '<span class="warn">Nothing to mark: no sausages — New colours, New spokes, a palette key, or M.</span>'; return; }
  if (S.ink && cupProblem(cup())) { $('#runState').innerHTML = `<span class="warn">MARKS dips in the cup with INK ON: ${cupProblem(cup())}</span>`; return; }
  if (M.fault) { $('#runState').innerHTML = `<span class="warn">Not run: the plan is wrong — ${M.fault}.</span>`; return; }
  if (walls(M)) { $('#runState').innerHTML = `<span class="warn">${walls(M)}</span>`; return; }
  if (!confirm(`MARKS ${TAB_NAME}: ${M.marks} dashes, a sausage each — ${S.ink ? `in watercolour from the cup, a dip every ${MARKS_DIP}, ${M.dips} dip${M.dips === 1 ? '' : 's'}` : 'Ink OFF: no dip, the dry brush'} — at ${MARK_SPEED} mm/s, ≈ ${fmt(M.seconds / 60, 1)} min (est.).\n\nThen squeeze the sausages on the dashes, as Drag shows them. Is the brush in the holder?`)) return;
  S.view = 'drag'; settle();
  await start('marks', M.blocks, { seconds: M.seconds, rows: M.rows },
    { page: TAB, pass: 'marks', label: label(), settings: S, here: hereNow(), ...(S.ink ? { cup: cup() } : {}), estimate_s: Math.round(M.seconds) });
};
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
$('#btnHome').onclick = () => start('home', homeBlocks(S.travel), { seconds: 0, rows: [{ label: 'HOME' }] }, { page: TAB, label: `${TAB_NAME} · HOME`, here: hereNow() });
let paused = false;
$('#btnPause').onclick = () => post(paused ? '/run/continue' : '/run/pause');
$('#btnStop').onclick = () => post('/run/stop');

// The LCD, as CCD's: DRAG's numbers while nothing runs.
const mmss = t => { t = Math.max(0, Math.round(t || 0)); return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
let started = null, lastLcd = null;
const KEY_NAME = { test: 'TEST', home: 'HOME', marks: 'MARKS', trace: 'TRACE', drag: 'DRAG' };
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
    : live && b?.home ? (RUN_KEY === 'home' ? 'HOME · the brush up, the carriage to home' : 'done · the carriage goes home, the brush off')
    : live && b?.wipe ? `${now0} · the brush up to be wiped`
    : live && now0 && b?.dip ? `${now0} · the dip in the cup`
    : live && now0 ? now0 + (st.brush_on ? ' · brush on' : ' · brush off')
    : `${what()} · ${fmt(P_.mm / 1000, 2)} m`;
  $('#lcd').innerHTML = `
    <div class="lcd-top"><span>${state === 'live' ? '▶ ' : state === 'paused' ? '❚❚ ' : ''}${state}${live && RUN_KEY ? ` · ${KEY_NAME[RUN_KEY]}` : ''}</span><span>${live && st.blocks ? `step ${st.block + 1}/${st.blocks}` : `${fmt(P_.mm / 1000, 2)} m`}</span></div>
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
if (FRESH) JOHN ? johnTest() : paperTest();                                      // a first visit: the owner's paper test on the canvas, on ST-JOHN a ⌘
else if (WIDTHLESS) relayJohn();
onCanvas(c => { Object.assign(S, c); settle(); });
syncRef(); loadRef();
lampSwitch($('#lamp'));
showZoom();
addEventListener('rembrandt-night', () => kick());
setInterval(watch, 500);
new ResizeObserver(layout).observe(stage);
settle(); watch();
loadInk().then(() => settle());                                                  // the cup known: MARKS' dips in the reading
const opening = new URLSearchParams(location.search).get('open');
if (opening) openFromLibrary(opening);
