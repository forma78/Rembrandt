// Rembrandt · ALU — pipes of paint (ALU-Claude/ALU.md; the prototype of
// Claude in chat, ALU-Claude/Rembrandt · ALU.html, its logic in aluplan.js).
// Each pipe a wide band along a line of points laid here, its corners
// rounded; brushed in whole lanes, Master Flo's way — every lane the whole
// pipe in one run, the inside lane first, a lift after each, as the owner's
// paper test of 2026-10-08 — or in Segments, Alu: cut by seams, each segment
// along the line or across it, fan ends. The passes are TYPE's — TRACE,
// MARKS, DRAG on the cassette deck — and Result mixes the paint as pigment.
// LOVE's page: its board, the canvas from home (here the panel), PROGRESS,
// the deck, INK and the cup, the LCD, the zoom; the shared modules imported,
// so a fix reaches every tab.
//
// SMKN (the owner, 2026-10-08: "a real palette with the colours we have now
// in stock, but the existing tab must stay too; let's call the second tab
// SMKN — the palette of my brand Soumkine"): this page and this plan with
// the paints in stock (aluplan.js, SMKN_TUBES), smkn.html's body naming it;
// its own keep in this browser and its own Library label.
//
// The panel's mm as the prototype's and its files: origin top left, x right,
// y down. The board's canvas mm from its centre, as LOVE's: x right, y down;
// the board, as on Test: mm from Here — the canvas's centre — X up, Y right.

import { fmt } from './util.js';
import { reach, homeCorner } from './machine.js';
import { plotRun, DEFAULTS, TABLE_MM, ELBOW_HOVER, SPEED_MAX, sweepOf, tailIn } from './strokes.js';
import { cornerDots, TEST_MARGIN, washOf, DIP_RUN, NO_DIP } from './band.js';
import {
  PALETTES, HEX, NAME, M, spineOf, frameAt, offsetRange, segsOf, isLanes, handMarks, pipesOf, compose, recolour, lettFamily, newPipe,
  planOf, paintWalk, lanesOf, paintAt, groupOf, ringOf, traceOf, traceRows, marksRows, dragRows, dragPasses, rgbOf, mixRGB,
  traceSvg, marksSvg, dragSvg, paintMapSvg, planJson, slugOf, MARKS_DIP, OVERLAPS,
} from './aluplan.js';
import { drawWash } from './wash.js';
import { CANVAS_FIELDS as FIELDS, canvasNow, setCanvas, onCanvas } from './canvas.js';
import { segments, sticks } from './lcd.js';
import { lampSwitch, themeColor } from './lamp.js';
import { cupOf, cupProblem, drawCup, dipAt } from './ink.js';
import { rng } from './util.js';
import './ui.js';

const $ = s => document.querySelector(s);
// ALU; SMKN, the paints in stock; or ALU-CUT, the first tab since 2026-10-11, ALU's palette and the new things — cuts (CUT)
const TAB = ['smkn', 'alucut'].includes(document.body.dataset.tab) ? document.body.dataset.tab : 'alu', CUT = TAB === 'alucut';
const TAB_NAME = { alu: 'ALU', smkn: 'SMKN', alucut: 'ALU-CUT' }[TAB], PAL = PALETTES[TAB === 'smkn' ? 'smkn' : 'alu'];
const OWN = new Set(PAL.tubes.map(t => t[0]));                                     // this tab's tubes
const KEY = `rembrandt.${TAB}.v01`, REF_KEY = `rembrandt.${TAB}.ref`;
const add = (a, b) => [a[0] + b[0], a[1] + b[1]], sub = (a, b) => [a[0] - b[0], a[1] - b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]), norm = a => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; }, perp = a => [-a[1], a[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];

// ---------- state ----------
// The pipes, as the prototype keeps them: points in panel mm, width, Corners
// (round), Largest corner radius (rad), the ends, seams as shares of the
// length, segments with their paints (tube keys), the brush (lanes or
// segments), inside or outside first, marks by hand (f a share along, a
// paint). cw, ch: the panel the points are laid on — the canvas from home;
// when it changes the points follow, as the prototype's panel keys did. The
// brush and its lanes, the marks, the simulation (est.); the trace's line
// and speeds, Tail and the drag's speed as on LOVE.
const S = {
  pipes: [], sel: 0, seg: 0, tool: 'edit', seed: 1, cw: 500, ch: 700,
  brush: 12, lanes: 7, xstep: 8, aorder: 'snake', over: 10, drag: 60,
  spacing: 60, width: 4, speed: 150, travel: 180, tail: 3, ink: true,
  run: 70, dryTail: 180, mix: 0.7, pick: 40, overlap: 'wet', look: 'relief',
  ground: 'white', markPaint: PAL.black,
  view: 'result', session: 0, next: { marks: 1, drag: 1 },
  boardW: 500, boardH: 700, edgeLeft: 50, edgeBottom: 0,
  refOpacity: 30,
  cutMark: 2,                                                                        // ALU-CUT: mm from a cut to its part's end marks, 0 … 3 (est.)
};
const NUM = ['cutMark', 'sel', 'seg', 'cw', 'ch', 'brush', 'lanes', 'xstep', 'over', 'drag', 'spacing', 'width', 'speed', 'travel', 'tail', 'run', 'dryTail', 'mix', 'pick', 'session', 'boardW', 'boardH', 'edgeLeft', 'edgeBottom', 'refOpacity'];
const VIEWS = ['design', 'trace', 'marks', 'drag', 'result'], TOOLS = ['edit', 'draw', 'seam', 'mark', ...(CUT ? ['cut'] : [])], GROUNDS = ['white', 'paper'];
const GROUND = { white: '#FBFAF7', paper: '#F1ECE1' };
const fin = v => Number.isFinite(v);
// a pipe as it may be kept: whatever is wrong in it put right, or null
function cleanPipe(st) {
  if (!st || !Array.isArray(st.pts)) return null;
  const tube = k => OWN.has(k), pts = st.pts.filter(p => Array.isArray(p) && fin(p[0]) && fin(p[1])).map(p => [p[0], p[1]]);
  const pairs = (Array.isArray(st.seams) ? st.seams : []).map((f, i) => [f, !!(Array.isArray(st.cuts) && st.cuts[i])]).filter(([f]) => fin(f) && f > 0 && f < 1).sort((a, b) => a[0] - b[0]);
  const seams = pairs.map(q => q[0]), cuts = pairs.map(q => q[1]);                  // cuts: which seams are ALU-CUT's, the brush stopping there
  const segs = (Array.isArray(st.segs) ? st.segs : []).map(g => ({ mode: g?.mode === 'across' ? 'across' : 'along', stops: (Array.isArray(g?.stops) ? g.stops : []).filter(tube).slice(0, 5) }))
    .map(g => g.stops.length ? g : { ...g, stops: PAL.families[0].slice() });
  while (segs.length < seams.length + 1) segs.push({ mode: 'along', stops: PAL.families[0].slice() });
  segs.length = seams.length + 1;
  return { pts, w: fin(st.w) ? Math.max(4, Math.min(300, st.w)) : 50, round: fin(st.round) ? Math.max(0, Math.min(1, st.round)) : 0.8, ...(fin(st.rad) && st.rad > 0 ? { rad: st.rad } : {}),
    capA: st.capA === 'fan' ? 'fan' : 'flat', capB: st.capB === 'fan' ? 'fan' : 'flat', seams, cuts, segs, brush: st.brush === 'segments' ? 'segments' : 'lanes', first: st.first === 'out' ? 'out' : 'in',
    marks: (Array.isArray(st.marks) ? st.marks : []).filter(m => fin(m?.f) && tube(m.paint)).map(m => ({ f: m.f, paint: m.paint })).sort((a, b) => a.f - b.f) };
}
let FRESH = true;   // nothing kept yet: New composition's first
function load() {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (!o) return;
    for (const k of NUM) if (fin(o[k])) S[k] = o[k];
    S.tail = tailIn(S.tail);
    S.lanes = Math.round(Math.max(1, Math.min(18, S.lanes)));
    S.cutMark = Math.max(0, Math.min(3, S.cutMark));
    if (Array.isArray(o.pipes)) S.pipes = o.pipes.map(cleanPipe).filter(Boolean);
    if (fin(o.seed) || o.seed === 'paper') S.seed = o.seed;
    if (OVERLAPS.includes(o.overlap)) S.overlap = o.overlap;
    if (typeof o.ink === 'boolean') S.ink = o.ink;
    if (['snake', 'one'].includes(o.aorder)) S.aorder = o.aorder;
    if (['relief', 'flat'].includes(o.look)) S.look = o.look;
    S.ground = GROUNDS.includes(o.ground) ? o.ground : 'white';   // a save made on the brushed aluminium opens on White (ALU.md)
    if (OWN.has(o.markPaint)) S.markPaint = o.markPaint;
    if (VIEWS.includes(o.view)) S.view = o.view;
    if (TOOLS.includes(o.tool)) S.tool = o.tool;
    for (const k of ['marks', 'drag']) if (Number.isInteger(o.next?.[k]) && o.next[k] >= 1) S.next[k] = o.next[k];
    S.sel = Math.max(0, Math.min(S.pipes.length - 1, Math.round(S.sel))); S.seg = Math.max(0, Math.round(S.seg));
    FRESH = false;
  } catch { }
}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { } };
// the panel is the canvas from home: changed (here, on another tab, by a save), the points follow it
function fitPanel() {
  if (S.cw === S.boardW && S.ch === S.boardH) return;
  const kx = S.boardW / S.cw, ky = S.boardH / S.ch;
  for (const st of S.pipes) st.pts = st.pts.map(p => [p[0] * kx, p[1] * ky]);
  S.cw = S.boardW; S.ch = S.boardH;
}

// ---------- the plan (aluplan.js) ----------
const po = () => ({ tab: TAB, pal: PAL, cw: S.cw, ch: S.ch, brush: S.brush, lanes: S.lanes, xstep: S.xstep, aorder: S.aorder, spacing: S.spacing, run: S.run, tail: S.dryTail, overlap: S.overlap, over: S.over,
  pick: S.pick, mix: S.mix, width: S.width, seed: S.seed, ground: S.ground, cuts: CUT, cutMark: S.cutMark });
let PL = null, plKey = '', WK = null, SP = null, spKey = '';
function planNow() {
  fitPanel();
  const key = JSON.stringify([S.pipes, S.cw, S.ch, S.brush, S.lanes, S.xstep, S.aorder, S.spacing, S.run, S.overlap, S.over, S.cutMark]);
  if (PL && key === plKey) return PL;
  plKey = key; PL = planOf(S.pipes, po());
  return PL;
}
// the pipes and their spines alone, for the design and the guides while a point is dragged
function spinesNow() {
  const key = JSON.stringify([S.pipes, S.cw, S.ch]);
  if (SP && key === spKey) return SP;
  spKey = key; SP = pipesOf(S.pipes, PAL.families[0], CUT);
  return SP;
}
function walkNow() {
  const P = planNow(), key = JSON.stringify([plKey, S.dryTail, S.pick, S.mix]);
  if (WK?.key !== key) { WK = { key, ...paintWalk(P, po()) }; stopPlay(); }
  return WK;
}
const nSes = () => planNow().sessions.length;
const paintNo = k => planNow().nums.indexOf(k) + 1;   // the paint's number, 1 the first; 0 none

// ---------- the cup, and the canvas from home (LOVE's) ----------
let INK = {};
const cup = () => cupOf(INK);
async function loadInk() {
  try { const r = await fetch('/ink', { cache: 'no-store' }); INK = r.ok ? await r.json() : {}; } catch { INK = {}; }
}
const hereNow = () => { const R = reach(); return { x: R.x.min + S.edgeBottom + S.boardH / 2, y: R.y.min + S.edgeLeft + S.boardW / 2 }; };
const dipCup = () => { const c = cup(), d = dipAt(c); return d ? { ...c, x: d.x, y: d.y } : c; };

// ---------- the run: TRACE ----------
// Every pipe's outline on its lanes 1 and n, DRAG's own lines, cut to the panel
// (aluplan.js, traceOf); an outline whole on the panel round clockwise, on
// 60 % over its start. INK ON: a dip, then outlines on what the brush holds
// while they keep within a dip run, a loop never split, a long line cut where
// the dips fall.
let PLAN = null, planKey = '', busy = false;
const EMPTY = { blocks: [], rows: [], preview: [], trace: [], outlines: 0, seconds: 0, length: 0, dips: 0, carriage: null, air: [], ink: false, fault: '' };
const runOpts = rows => ({ ...DEFAULTS, speed: S.speed, travel: S.travel, tail: S.tail, lift: false, ink: S.ink, snake: true, pause: false, rows, here: hereNow(), cup: dipCup(), noDipUnder: NO_DIP, hover: ELBOW_HOVER });
function plan() {
  const here = hereNow(), P = planNow(), key = JSON.stringify([plKey, S.width, S.speed, S.travel, S.tail, S.ink, here, S.ink ? dipCup() : null]);
  if (PLAN && key === planKey) return PLAN;
  planKey = key;
  const trace = traceOf(P, po()), R = traceRows(trace, S.ink, po());
  if (!R.ps.length) { PLAN = { ...EMPTY, trace }; return PLAN; }
  const o = runOpts(R.ps.length);
  PLAN = { ...plotRun(o, [{ key: 'TRACE', ps: R.ps, why: null }]), rows: R.info, outlines: R.ps.length, trace, ink: S.ink, opts: o };
  return PLAN;
}

// ---------- the board (LOVE's) ----------
const cv = $('#cv'), ctx = cv.getContext('2d'), stage = $('#stage'), board = $('#board');
let g = ctx;   // the context drawn on: the board's, or a PNG's for the Library
const PAD_X = M + 6, PAD_Y = M + 10;   // round the canvas: the pipes' points may lie M mm off it
function view() {
  const v = { x0: -S.boardH / 2 - PAD_X, x1: S.boardH / 2 + PAD_X, y0: -S.boardW / 2 - PAD_Y, y1: S.boardW / 2 + PAD_Y }, h = hereNow();
  if (S.ink && h) {                                                                   // the cup and home on the table too
    const c = cup(), hc = homeCorner(), e = (c.diameter || 50) / 2 * 1.7 + 6;
    const at = [...(fin(c.x) ? [[{ x: c.x - h.x, y: c.y - h.y }, e]] : []), [{ x: hc.x - h.x, y: hc.y - h.y }, 24]];
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
const toPanel = e => { const c = toCanvas(e); return [c[0] + S.cw / 2, c[1] + S.ch / 2]; };
// a context set to draw in panel mm, as the prototype drew: its lines' widths in mm too
const inPanel = c => { c.setTransform(k * dpr, 0, 0, k * dpr, (-S.cw / 2 - V.y0) * k * dpr, (V.x1 - S.ch / 2) * k * dpr); return c; };
const clipPanel = c => { c.beginPath(); c.rect(0, 0, S.cw, S.ch); c.clip(); };
const ZOOMS = [0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8];
let Z = 1, ZC = null;   // the zoom; the window's centre, null: the table's
function layout() {
  const F = view(), r = stage.getBoundingClientRect(), m = 36, sw = F.y1 - F.y0, sh = F.x1 - F.x0, strip = 46;   // the tubes' strip by the Tools
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
  g.fillStyle = GROUND[S.ground]; g.fillRect(sx([-hw]), sy([0, -hh]), S.boardW * k, S.boardH * k);   // the panel, its ground
  g.save(); g.beginPath(); g.rect(sx([-hw]), sy([0, -hh]), S.boardW * k, S.boardH * k); g.clip();   // past the walls: hatched
  g.beginPath(); g.rect(0, 0, W, H); areaRect(); g.clip('evenodd');
  g.strokeStyle = 'rgba(179,71,12,.45)'; g.lineWidth = 1;
  for (let d = -H; d < W; d += 7) { g.beginPath(); g.moveTo(d, H); g.lineTo(d + H, 0); g.stroke(); }
  g.restore();
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
    if (fin(c.x) && fin(c.y)) {
      const at = { x: c.x - h.x, y: c.y - h.y }, r = (cup().diameter || 50) / 2 * k;
      drawCup(g, msx(at), msy(at), r); g.fillStyle = ink; g.textAlign = 'left'; g.fillText(`cup ⌀${cup().diameter || 50}`, msx(at) + r * 1.7 + 4, msy(at) + 3);
    }
  }
  if (g === ctx && (S.view !== 'result' || grab)) guides();
  drawTrail();
}

// ---------- the views ----------
// Design (the prototype's): each segment's paints laid flat. 1 Trace, 2 Marks,
// 3 Drag, Result as on LOVE; while a point is dragged, the design, quick.
function drawView() {
  if (grab) { panelDraw(c => drawDesign(c, spinesNow())); return; }
  if (S.view === 'design') { panelDraw(c => drawDesign(c, spinesNow())); return; }
  if (S.view === 'result') { drawResult(); return; }
  if (S.view === 'trace') { drawTrace(1); return; }
  panelDraw(c => drawDesign(c, spinesNow(), S.view === 'drag' ? 0.18 : 0.14));
  drawTrace(0.35);
  if (S.view === 'marks') panelDraw(drawMarkMap);
  if (S.view === 'drag') panelDraw(drawLanes);
}
// fn(c) in panel mm, clipped to the panel
function panelDraw(fn, c = g) { c.save(); inPanel(c); clipPanel(c); c.lineJoin = 'round'; fn(c); c.restore(); }
const ln = (c, pts) => { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); };
const shown = s => !S.session || s === S.session;   // a session picked, or all
function drawDesign(c, pipes, alpha = 1) {
  c.save(); c.globalAlpha = alpha; c.lineCap = 'butt';
  const n = S.lanes, o = po();
  for (const st of pipes) {
    if (!st.sp) continue;
    const sp = st.sp, W = st.w, e = Math.max(0, W / 2 - S.brush / 2), pitch = n > 1 ? 2 * e / (n - 1) : 0, segs = segsOf(st);
    const lanesIn = (sg, groupFn, b) => {                                              // the paints across the pipe, a strip a lane, the edge ones out to its edge
      const K = sg.stops.length, w = n > 1 ? Math.max(pitch, 0.5) * 1.02 : W;
      for (let i = 0; i < n; i++) {
        const d = n > 1 ? -e + i * pitch : 0, edge = n > 1 && (i === 0 || i === n - 1), ww = n === 1 ? W : edge ? W / 2 - e + pitch / 2 : w, dd = edge ? Math.sign(d) * (W / 2 - ww / 2) : d;
        c.strokeStyle = HEX[sg.stops[groupFn(i, n, K)]]; c.lineWidth = ww; ln(c, offsetRange(sp, sg.a, b, dd)); c.stroke();
      }
    };
    const quad = (s0, s1, col) => { const f0 = frameAt(sp, s0), f1 = frameAt(sp, s1 + 0.3); c.fillStyle = col; ln(c, [add(f0.p, mul(f0.N, -W / 2)), add(f0.p, mul(f0.N, W / 2)), add(f1.p, mul(f1.N, W / 2)), add(f1.p, mul(f1.N, -W / 2))]); c.closePath(); c.fill(); };
    if (isLanes(st)) {                                                                // Master Flo: the paints along the pipe, each right across it
      for (let s0 = 0; s0 < sp.L; s0 += 1) { const s1 = Math.min(sp.L, s0 + 1); quad(s0, s1, HEX[paintAt(st, (s0 + s1) / 2)]); }
      c.strokeStyle = 'rgba(36,34,31,.25)'; c.lineWidth = 0.3;                         // the lanes' seams, faint
      for (let i = 1; i < n; i++) { ln(c, offsetRange(sp, 0, sp.L, -e + (i - 0.5) * pitch)); c.stroke(); }
      continue;
    }
    for (const sg of segs) {
      if (sg.mode === 'along') { lanesIn(sg, groupOf, sg.b); continue; }
      const L = sg.b - sg.a, steps = Math.max(1, Math.ceil(L));
      for (let q = 0; q < steps; q++) { const s0 = sg.a + L * q / steps, s1 = sg.a + L * (q + 1) / steps; quad(s0, s1, HEX[sg.stops[ringOf(sg, (s0 + s1) / 2, o)]]); }
    }
    for (const [atEnd, cap] of [[false, st.capA], [true, st.capB]]) if (cap === 'fan') {   // from the −N side round through the outward tangent to the +N side
      const sg = segs[atEnd ? segs.length - 1 : 0], f = frameAt(sp, atEnd ? sp.L : 0), out = atEnd ? f.T : mul(f.T, -1), K = sg.stops.length;
      const a0 = Math.atan2(-f.N[1], -f.N[0]), del = (Math.sign(-f.N[0] * out[1] + f.N[1] * out[0]) || 1) * Math.PI;
      for (let q = 0; q < K; q++) { c.fillStyle = HEX[sg.stops[q]]; c.beginPath(); c.moveTo(f.p[0], f.p[1]); c.arc(f.p[0], f.p[1], W / 2, a0 + del * q / K, a0 + del * (q + 1) / K, del < 0); c.closePath(); c.fill(); }
    }
  }
  c.restore();
}
// TRACE as it lies on the paper (LOVE's): INK ON the watercolour from the cup,
// paler along the dip run, a blot where the brush lands; OFF the line as the
// brush runs it, its true width
function drawTrace(alpha = 1) {
  const P_ = plan();
  if (!P_.trace.length) return;
  g.save(); g.globalAlpha = alpha;
  if (S.ink && P_.preview?.length) {
    P_.wash ??= washOf(P_.preview, [], [], S.width, areaNow());                       // pressed into the walls, as the run is
    drawWash(g, P_.wash, { sx, sy, k, width: S.width, black: false });
  } else {
    inPanel(g); g.strokeStyle = INK_DARK; g.lineWidth = S.width; g.lineCap = 'round'; g.lineJoin = 'round';
    for (const t of P_.trace) { ln(g, t.pts); g.stroke(); }
  }
  g.restore();
}
// MARKS: each mark in its paint, lane 1 to lane n, a fine dark edge so white reads — the painter's map; no ticks since 2026-10-11
function drawMarkMap(c) {
  const P = planNow();
  c.lineCap = 'round';
  for (const s of P.sessions) if (shown(s.n)) for (const m of s.marks) {
    c.strokeStyle = 'rgba(36,34,31,.55)'; c.lineWidth = S.width + 0.6; ln(c, m.pts); c.stroke();
    c.strokeStyle = HEX[m.paint]; c.lineWidth = S.width; ln(c, m.pts); c.stroke();
  }
}
// DRAG: the brush's path, a colour a lane (the prototype's), dashed between
// the runs where it flies; an orange dot where it lands, the owner's lane
// numbers at the starts, 1 outside … n inside — a snake's at each lane's
// start, its step across in the colour of the lane it leads to
function drawLanes(c) {
  const P = planNow();
  c.lineCap = 'round';
  let prev = null;
  for (const s of P.sessions) if (shown(s.n)) for (const r of s.runs) {
    if (prev) { c.save(); c.strokeStyle = 'rgba(36,34,31,.3)'; c.lineWidth = 0.5; c.setLineDash([2, 3]); ln(c, [prev, r.pts[0]]); c.stroke(); c.restore(); }
    if (r.mode === 'lanes') {
      const starts = r.starts || [0], fs = Math.max(2.4, Math.min(8, (r.pitch || S.brush) * 0.75));
      starts.forEach((at, k) => {
        const num = r.nums?.[k] ?? r.num, lane = r.pts.slice(Math.max(0, at - 1), starts[k + 1] ?? r.pts.length);
        c.strokeStyle = `hsla(${(205 + num * 37) % 360},55%,36%,.9)`; c.lineWidth = Math.max(0.6, S.brush * 0.08); ln(c, lane); c.stroke();
        if (at + 1 >= r.pts.length) return;
        const t = norm(sub(r.pts[at + 1], r.pts[at])), q = sub(r.pts[at], mul(t, fs * 0.9));
        c.fillStyle = 'rgba(36,34,31,.85)'; c.font = `${fs}px "Helvetica Neue", Helvetica, Arial, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(num), q[0], q[1]);
      });
    } else {
      c.strokeStyle = r.mode === 'along' ? 'rgba(30,80,150,.85)' : r.mode === 'across' ? 'rgba(170,40,90,.85)' : 'rgba(40,120,60,.85)';
      c.lineWidth = 0.6; ln(c, r.pts); c.stroke();
    }
  }
    c.fillStyle = ORANGE; c.beginPath(); c.arc(r.pts[0][0], r.pts[0][1], Math.max(0.6, Math.min(1.4, S.brush * 0.15)), 0, 7); c.fill(); prev = r.pts.at(-1);
}
// The guides (the prototype's): every pipe's centre line, the chosen one
// orange with its points and its segment's edges dashed; the seams across.
// Over the table, not clipped: a point may lie off the panel.
function guides() {
  const pipes = spinesNow(), px = v => v / k;
  g.save(); inPanel(g); g.lineCap = 'round';
  pipes.forEach((st, i) => {
    if (!st.sp) { if (st.pts.length === 1) { g.fillStyle = ORANGE; g.beginPath(); g.arc(st.pts[0][0], st.pts[0][1], px(3.5), 0, 7); g.fill(); } return; }
    const on = i === S.sel;
    g.strokeStyle = on ? 'rgba(235,122,37,.95)' : 'rgba(36,34,31,.35)'; g.lineWidth = px(on ? 1.2 : 1); g.setLineDash(on ? [] : [px(3), px(3)]); ln(g, st.sp.P); g.stroke(); g.setLineDash([]);
    if (on) { g.strokeStyle = 'rgba(235,122,37,.45)'; g.lineWidth = px(1); ln(g, st.pts); g.stroke(); }
    for (const sg of segsOf(st)) if (sg.j > 0 && sg.cutA) {                           // ALU-CUT: a cut — solid, wider, ❚❚ where DRAG stops
      const f = frameAt(st.sp, sg.a), a = add(f.p, mul(f.N, -st.w / 2 - 7)), b = add(f.p, mul(f.N, st.w / 2 + 7));
      g.strokeStyle = on ? ORANGE : 'rgba(36,34,31,.85)'; g.lineWidth = px(2.6); ln(g, [a, b]); g.stroke();
      g.fillStyle = on ? ORANGE : 'rgba(36,34,31,.85)'; g.font = `600 ${px(12)}px "Helvetica Neue", Helvetica, Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      const q = add(b, mul(f.N, px(9))); g.fillText('❚❚', q[0], q[1]);
    }
    for (const sg of segsOf(st)) if (sg.j > 0 && !sg.cutA) { const f = frameAt(st.sp, sg.a); g.strokeStyle = on ? ORANGE : 'rgba(36,34,31,.5)'; g.lineWidth = px(1.6); ln(g, [add(f.p, mul(f.N, -st.w / 2 - 4)), add(f.p, mul(f.N, st.w / 2 + 4))]); g.stroke(); }
    if (on) {
      const sg = segsOf(st)[S.seg];
      if (sg && st.segs.length > 1) { g.strokeStyle = ORANGE; g.lineWidth = px(1.6); g.setLineDash([px(4), px(3)]); ln(g, offsetRange(st.sp, sg.a, sg.b, -st.w / 2 - 2)); g.stroke(); ln(g, offsetRange(st.sp, sg.a, sg.b, st.w / 2 + 2)); g.stroke(); g.setLineDash([]); }
    }
  });
  const st = pipes[S.sel];
  if (st) for (const p of st.pts) { g.fillStyle = '#FBFAF7'; g.strokeStyle = ORANGE; g.lineWidth = px(1.4); g.beginPath(); g.arc(p[0], p[1], px(4), 0, 7); g.fill(); g.stroke(); }
  g.restore();
}

// ---------- Result, and Play the run ----------
// The prototype's: the marks under the runs as raised lines of paint, MARK_W
// wide (est.), so what the brush leaves of them shows between the lanes; each
// run as beads — dark at the sides, its colour, two bristle hairlines, a
// light ridge towards the light from the top left — or flat strips. Kept as
// a layer while nothing changes, so a frame only lays it again.
const MARK_W = 3;                                  // mm, a squeezed line of paint, est.
const LIGHT = norm([-0.55, -0.83]);                // the light from the top left
const rgba = (c, a) => `rgba(${c.map(Math.round).join(',')},${a.toFixed(3)})`;
const normalsOf = P => P.map((p, i) => perp(norm(sub(P[Math.min(P.length - 1, i + 1)], P[Math.max(0, i - 1)]))));
function drawBead(c, pts, w, sh, rgb, alpha) {
  const N = normalsOf(pts), P = sh ? pts.map((p, i) => add(p, mul(N[i], sh))) : pts, dark = mixRGB(rgb, [0, 0, 0], 0.42), lite = mixRGB(rgb, [255, 255, 255], 0.55);
  c.strokeStyle = rgba(dark, alpha); c.lineWidth = w; ln(c, P); c.stroke();
  c.strokeStyle = rgba(rgb, alpha); c.lineWidth = w * 0.7; ln(c, P); c.stroke();
  c.strokeStyle = rgba(mixRGB(rgb, [0, 0, 0], 0.18), alpha * 0.35); c.lineWidth = Math.min(0.35, w * 0.06);
  for (const f of [-0.2, 0.2]) { ln(c, P.map((p, i) => add(p, mul(N[i], w * f)))); c.stroke(); }
  c.strokeStyle = rgba(lite, alpha * 0.9); c.lineWidth = w * 0.16; ln(c, P.map((p, i) => add(p, mul(N[i], dot(N[i], LIGHT) * w * 0.2)))); c.stroke();
}
function drawBeads(c, segs, w, square) {
  c.lineCap = 'butt'; c.lineJoin = 'round';
  const q6 = col => col.map(v => Math.round(v / 6) * 6);
  let cur = null, pts = [];
  const flush = () => {
    if (cur && pts.length > 1) {
      if (square) { const t0 = norm(sub(pts[1], pts[0])), t1 = norm(sub(pts.at(-1), pts.at(-2))); pts[0] = sub(pts[0], mul(t0, w / 2)); pts[pts.length - 1] = add(pts.at(-1), mul(t1, w / 2)); }
      drawBead(c, pts, (cur.bw || w) * (cur.thin || 1), cur.sh || 0, cur.col, cur.alpha);
    }
    cur = null; pts = [];
  };
  for (const sg of segs) {
    if (!sg.col) { flush(); continue; }
    const col = q6(sg.col), same = cur && sg.alpha === cur.alpha && sg.thin === cur.thin && sg.lane === cur.lane && col.every((v, i) => v === cur.col[i]) && pts.length && pts.at(-1) === sg.a;
    if (!same) { flush(); cur = { ...sg, col }; pts = [sg.a]; }
    pts.push(sg.b);
  }
  flush();
}
function drawFlat(c, segs, w, square) {
  c.lineCap = square ? 'square' : 'butt'; c.lineJoin = square ? 'miter' : 'round';
  let cur = null, pts = [];
  const flush = () => {
    if (cur && pts.length > 1) {
      c.strokeStyle = rgba(cur.col, cur.alpha); c.lineWidth = w * (cur.thin || 1); ln(c, pts); c.stroke();
      c.strokeStyle = rgba(mixRGB(cur.col, [0, 0, 0], 0.35), cur.alpha * 0.28); c.lineWidth = w * 0.12; ln(c, pts); c.stroke();
    }
    cur = null; pts = [];
  };
  for (const sg of segs) {
    if (!sg.col) { flush(); continue; }
    const same = cur && sg.alpha === cur.alpha && sg.thin === cur.thin && sg.col.every((v, i) => Math.round(v) === Math.round(cur.col[i])) && pts.length && pts.at(-1) === sg.a;
    if (!same) { flush(); cur = sg; pts = [sg.a]; }
    pts.push(sg.b);
  }
  flush();
}
function drawMarkBeads(c) {
  c.lineCap = 'round';
  for (const s of planNow().sessions) for (const m of s.marks) {
    if (S.look === 'relief') drawBead(c, m.pts, MARK_W, 0, rgbOf(HEX[m.paint]), 0.95);
    else { c.strokeStyle = HEX[m.paint]; c.lineWidth = MARK_W; ln(c, m.pts); c.stroke(); }
  }
}
const layerOf = () => { const l = document.createElement('canvas'); l.width = g.canvas.width; l.height = g.canvas.height; return l; };
let RES = null, PLAY = null;
function drawResult() {
  const Wk = walkNow(), P = planNow(), vkey = JSON.stringify([Wk.key, S.look, k, dpr, V, g.canvas.width, g.canvas.height, S.cw, S.ch]);
  if (PLAY && g === ctx) {
    if (PLAY.vkey !== vkey) {                                                       // zoomed or moved: laid again up to now
      const l = layerOf(); panelDraw(drawMarkBeads, l.getContext('2d'));
      Object.assign(PLAY, { vkey, layer: l, done: 0 });
    }
    const upto = Math.min(PLAY.flat.length, Math.floor((performance.now() - PLAY.t0) / PLAY.ms * PLAY.flat.length));
    if (upto > PLAY.done) {
      panelDraw(c => {
        c.lineCap = 'round';
        for (; PLAY.done < upto; PLAY.done++) { const sg = PLAY.flat[PLAY.done]; if (!sg.col) continue; c.strokeStyle = rgba(sg.col, sg.alpha); c.lineWidth = S.brush * (sg.thin || 1); ln(c, [sg.a, sg.b]); c.stroke(); PLAY.brush = sg.b; }
      }, PLAY.layer.getContext('2d'));
    }
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(PLAY.layer, 0, 0); g.restore();
    if (PLAY.brush) {                                                                // the brush, its true width
      const b = [PLAY.brush[0] - S.cw / 2, PLAY.brush[1] - S.ch / 2];
      g.save(); g.strokeStyle = INK_DARK; g.fillStyle = INK_DARK; g.lineWidth = 1.2;
      g.beginPath(); g.arc(sx(b), sy(b), Math.max(3, S.brush / 2 * k), 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.arc(sx(b), sy(b), 1.8, 0, Math.PI * 2); g.fill(); g.restore();
    }
    return;
  }
  if (RES?.key !== vkey || RES.g !== g) {
    const l = layerOf();
    panelDraw(c => {
      drawMarkBeads(c);
      let i = 0;
      for (const s of P.sessions) for (const r of s.runs) (S.look === 'relief' ? drawBeads : drawFlat)(c, Wk.runs[i++], S.brush, !(r.mode === 'along' || r.mode === 'lanes'));
    }, l.getContext('2d'));
    RES = { key: vkey, g, layer: l };
  }
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(RES.layer, 0, 0); g.restore();
}
// Play the run (the owner, 2026-10-07, on LOVE: "this preview shows how the
// paint will lie"): the Result laid again in the brush's order, lane after
// lane, as long as the prototype's — 6 s and an eighth of a second for every
// piece, 26 s at most — a ring the brush's width where it is.
function play() {
  if (PLAY) { stopPlay(); kick(); return; }                                          // pressed again: it stops, the Result whole
  const Wk = walkNow(), flat = Wk.runs.flat();
  if (!flat.length) return;
  PLAY = { t0: performance.now(), flat, ms: Math.min(26000, 6000 + flat.length / 8), brush: null, vkey: null };
  if (S.view !== 'result') { S.view = 'result'; save(); showPanel(); }
  showPlay();
  const tick = () => {
    if (!PLAY) return;
    draw();
    if (PLAY.done >= PLAY.flat.length) { stopPlay(); kick(); return; }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function stopPlay() { if (!PLAY) return; PLAY = null; showPlay(); }
function showPlay() { const b = $('#btnPlay'); b.classList.toggle('on', !!PLAY); b.textContent = PLAY ? '■ Stop playing' : '▶ Play the run'; }

// ---------- the run as it goes (LOVE's) ----------
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
const UNDO_KEYS = ['cutMark', 'pipes', 'sel', 'seg', 'seed', 'cw', 'ch', 'brush', 'lanes', 'xstep', 'aorder', 'over', 'drag', 'spacing', 'width', 'speed', 'run', 'dryTail', 'mix', 'pick', 'overlap', 'look', 'ground', 'markPaint'];
let undoStack = [], redoStack = [];
const snapshot = () => JSON.stringify(Object.fromEntries(UNDO_KEYS.map(q => [q, S[q]])));
function undoPush() { undoStack.push(snapshot()); if (undoStack.length > 200) undoStack.shift(); redoStack = []; }
function restore(js) { Object.assign(S, JSON.parse(js)); if (S.cw !== S.boardW || S.ch !== S.boardH) setCanvas({ boardW: S.cw, boardH: S.ch }), Object.assign(S, canvasNow(S)); settle(); }
function undo() { if (!undoStack.length) return; redoStack.push(snapshot()); restore(undoStack.pop()); }
function redo() { if (!redoStack.length) return; undoStack.push(snapshot()); restore(redoStack.pop()); }

// ---------- the tools on the board (the prototype's) ----------
// Edit: drag a point, double-click it away, a click on a pipe chooses it and
// the segment under the click. Draw: a click adds a point to the chosen pipe.
// Seams: a click cuts the pipe there — the new segment the other way, its
// paints reversed, so the cut shows at once — a click on a seam takes it
// away. Marks: a click lays a mark of the chosen paint right across, a click
// on one takes it away; the pipe goes to whole lanes, its marks by hand.
const tolPt = () => Math.max(3, 9 / k);                                            // mm: as near as a point is taken
const clampPt = p => [Math.max(-M + 2, Math.min(S.cw + M - 2, p[0])), Math.max(-M + 2, Math.min(S.ch + M - 2, p[1]))];
function nearPoint(p) {                                                           // the chosen pipe's points first, then the nearest
  let best = null;
  S.pipes.forEach((st, i) => st.pts.forEach((q, j) => {
    const d = dist(p, q), mine = i === S.sel;
    if (d < tolPt() && (!best || (mine !== best.mine ? mine : d < best.d))) best = { i, j, d, mine };
  }));
  return best;
}
function nearPipe(p) {
  let best = null;
  spinesNow().forEach((st, i) => { if (!st.sp) return; for (let q = 0; q < st.sp.P.length; q++) { const d = dist(p, st.sp.P[q]); if (d < st.w / 2 + 3 && (!best || d < best.d)) best = { i, d, s: st.sp.s[q], st }; } });
  if (best) best.seg = Math.max(0, segsOf(best.st).findIndex(x => best.s >= x.a && best.s <= x.b));
  return best;
}
let grab = null;
cv.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  const p = toPanel(e);
  if (S.tool === 'draw') {
    undoPush();
    if (!S.pipes[S.sel]) { S.pipes.push(newPipe(Math.round(Math.min(50, S.cw / 3)), Date.now() >>> 0, PAL)); S.sel = S.pipes.length - 1; S.seg = 0; }
    S.pipes[S.sel].pts.push(clampPt(p)); settle(); return;
  }
  if (S.tool === 'mark') {
    const h = nearPipe(p); if (!h) return;
    undoPush();
    const st = S.pipes[h.i], L = h.st.sp.L; st.brush = 'lanes'; st.marks = (st.marks || []).slice();
    const near = st.marks.findIndex(m => Math.abs(m.f * L - h.s) < Math.max(4, S.brush * 0.6));
    if (near >= 0) st.marks.splice(near, 1); else { st.marks.push({ f: h.s / L, paint: S.markPaint }); st.marks.sort((a, b) => a.f - b.f); }
    S.sel = h.i; settle(); return;
  }
  if (S.tool === 'seam' || S.tool === 'cut') {
    // Seams (S): a click cuts the pipe's paints there, on a seam takes it away. Cuts (C, ALU-CUT; the owner,
    // 2026-10-11, chat-Claude's way to compare with Florian's one run): a click puts a cut, the brush stopping
    // there, the next part its own family of paints; on a seam it makes it a cut, on a cut takes it away —
    // and with S a click on a cut makes it a seam again
    const h = nearPipe(p); if (!h) return;
    const st = S.pipes[h.i], L = h.st.sp.L, near = st.seams.findIndex(f => Math.abs(f * L - h.s) < 10), cut = S.tool === 'cut';
    st.cuts = st.seams.map((f, i) => !!(st.cuts || [])[i]);
    if (near >= 0) {
      undoPush();
      if (CUT && st.cuts[near] !== cut) st.cuts[near] = cut;                         // a seam made a cut, a cut a seam
      else { st.seams.splice(near, 1); st.cuts.splice(near, 1); st.segs.splice(near + 1, 1); }
    } else if (h.s > 15 && h.s < L - 15) {
      undoPush();
      const j = segsOf(h.st).findIndex(x => h.s >= x.a && h.s <= x.b), was = st.segs[j];
      st.seams.splice(j, 0, h.s / L); st.cuts.splice(j, 0, cut);
      const fresh = () => { const r = rng(Date.now() >>> 0), F = PAL.families.filter(f => !f.every(k => was.stops.includes(k))); return lettFamily(r, F.length ? F : PAL.families); };
      st.segs.splice(j + 1, 0, cut ? { mode: was.mode === 'across' ? 'across' : 'along', stops: fresh() } : isLanes(st) ? { mode: 'along', stops: was.stops.slice().reverse() } : { mode: was.mode === 'along' ? 'across' : 'along', stops: was.stops.slice().reverse() });
      S.seg = j + 1;
    }
    S.sel = h.i; settle(); return;
  }
  const pt = nearPoint(p);
  if (pt) { undoPush(); S.sel = pt.i; grab = { ...pt, moved: false }; cv.setPointerCapture(e.pointerId); showPipes(); kick(); return; }
  const h = nearPipe(p); if (h) { S.sel = h.i; S.seg = h.seg; save(); showPipes(); kick(); }
});
cv.addEventListener('pointermove', e => {
  if (!grab) { cv.style.cursor = S.tool === 'edit' ? (nearPoint(toPanel(e)) ? 'move' : nearPipe(toPanel(e)) ? 'pointer' : '') : S.tool === 'draw' ? 'crosshair' : nearPipe(toPanel(e)) ? 'col-resize' : ''; return; }
  grab.moved = true; busy = true;
  S.pipes[grab.i].pts[grab.j] = clampPt(toPanel(e));
  kick();
});
const drop = () => { if (!grab) return; const was = grab; grab = null; if (!was.moved) undoStack.pop(); settle(); };
cv.addEventListener('pointerup', drop); cv.addEventListener('pointercancel', drop);
cv.addEventListener('dblclick', e => {
  if (S.tool !== 'edit') return;
  const pt = nearPoint(toPanel(e)); if (!pt) return;
  undoPush(); S.pipes[pt.i].pts.splice(pt.j, 1); settle();
});
function movePipe(dx, dy) { const st = S.pipes[S.sel]; if (!st?.pts.length) return; undoPush(); st.pts = st.pts.map(p => [p[0] + dx, p[1] + dy]); settle(); }
// the chosen pipe taken away (the owner, 2026-10-08: "there is Delete pipe, but the sausage could simply go with the delete key"): ⌫ or Delete, ⌘Z brings it back
function deletePipe() { if (!S.pipes[S.sel]) return; undoPush(); S.pipes.splice(S.sel, 1); S.sel = Math.max(0, S.sel - 1); S.seg = 0; settle(); }
function clearAll() { if (!S.pipes.length) return; undoPush(); S.pipes = []; S.sel = 0; S.seg = 0; S.tool = 'draw'; settle(); }
function setTool(t) { S.tool = t; if (t === 'mark' && S.view === 'result') S.view = 'marks'; settle(); }

const HINT = {
  edit: 'Edit: drag a point to move it, double-click a point to take it away, click a pipe to choose it and its segment; the arrows move the chosen pipe a mm, with ⇧ ten; ⌫ takes it away.',
  draw: 'Draw: a click adds a point to the chosen pipe; New pipe starts another. Lines and arcs only: the corners rounded by Corners.',
  seam: CUT ? 'Seams: a click on a pipe changes its paints there, the brush going on; a click on a seam takes it away, on a cut makes it a seam.' : 'Seams: a click on a pipe cuts it there; a click on a seam takes it away.',
  cut: 'Cut: a click on a pipe cuts it there — DRAG stops, you wipe the brush and squeeze the next part\'s paints; a click on a seam makes it a cut, on a cut takes it away.',
  mark: 'Marks: a click on a pipe lays a mark of the chosen tube right across it — pick the tube in the strip; a click on a mark takes it away. The pipe then runs in whole lanes.',
};
$('#btnUndo').onclick = undo; $('#btnRedo').onclick = redo; $('#btnClear').onclick = clearAll;
document.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => setTool(b.dataset.tool));
addEventListener('keydown', e => {
  if (e.key === 'Escape') post('/run/stop');                                         // Esc = STOP, as on Test, NOLAN and TYPE
  if (e.target.matches('input,select,textarea')) return;
  const cmd = e.metaKey || e.ctrlKey;
  if (cmd && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (cmd) return;
  if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); deletePipe(); return; }
  const tool = { v: 'edit', p: 'draw', s: 'seam', m: 'mark', ...(CUT ? { c: 'cut' } : {}) }[e.key.toLowerCase()];
  if (tool) { setTool(tool); return; }
  const arrow = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
  if (arrow) { e.preventDefault(); const d = e.shiftKey ? 10 : 1; movePipe(arrow[0] * d, arrow[1] * d); }
});

// The zoom (LOVE's): − 100% +, ⌘− ⌘0 ⌘+; a pinch zooms where it is, two fingers move the board.
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
// The prototype's settings in LOVE's panel: where pipes cross, INK, the view;
// the composition; the pipes and the chosen one's pipe and segment; the
// brush, the marks, the simulation (est.); the canvas from home; the files.
const BRUSH_SL = [['brush', 'Brush width', 'mm', 0.5, 4, 24], ['lanes', 'Lanes along', '', 1, 2, 18], ['xstep', 'Step across', 'mm', 0.5, 3, 20], ['over', 'Past the panel edge', 'mm', 1, 0, 30], ['drag', 'Drag speed', 'mm/s', 5, 10, SPEED_MAX]];
const PAINT_SL = [['spacing', 'Mark spacing', 'mm', 5, 30, 120], ...(CUT ? [['cutMark', 'Marks from a cut', 'mm', 0.5, 0, 3]] : []), ['width', 'Line width', 'mm', 0.5, 1, 12], ['speed', 'Line speed', 'mm/s', 5, 20, SPEED_MAX]];
const SIM_SL = [['run', 'Dense run', 'mm', 5, 30, 150], ['dryTail', 'Dry tail', 'mm', 10, 0, 300], ['mix', 'A mark\'s share in the brush', '%', 0.05, 0.1, 0.9], ['pick', 'Wet paint loads the brush in', 'mm', 1, 5, 120]];
const ALL_SL = [['#slBrush', BRUSH_SL], ['#slPaint', PAINT_SL], ['#slSim', SIM_SL]];
const valOf = key => key === 'lanes' ? `${S.lanes} · ${fmt(S.lanes > 1 ? 2 * Math.max(0, (S.pipes[S.sel]?.w || 50) / 2 - S.brush / 2) / (S.lanes - 1) : 0, 1)} mm apart` : key === 'mix' ? `${Math.round(S.mix * 100)} % (est.)`
  : key === 'pick' ? `${S.pick} mm (est.)` : key === 'run' || key === 'dryTail' ? `${S[key]} mm (est.)` : key === 'speed' || key === 'drag' ? `${S[key]} mm/s` : `${Math.round(S[key] * 100) / 100} mm`;
const SL_TITLE = { brush: 'The dry brush of DRAG', lanes: 'How many lanes the brush runs along a pipe, edge to edge; the pitch between them follows (on the chosen pipe)', xstep: 'Segments, Alu: the step between the strokes of an Across segment, and between a fan\'s rays at the rim',
  over: 'How far a run goes past the canvas\'s edge, onto the board under it', drag: 'The dry brush along a lane of DRAG', spacing: 'A mark across the pipe every so many mm along it, where no marks are laid by hand',
  cutMark: 'How far a part\'s first and last mark lie from its cut (est.): 0 when the next part goes on over dry paint (the owner, 2026-10-11: &quot;a slider from 0 to 3 mm? If I go on when the paint has dried, neither 2 nor 3 mm is needed&quot;)',
  width: 'The watercolour line of TRACE and MARKS on the canvas (the owner, 2026-10-04: &quot;the line is 4 mm&quot;)', speed: 'The brush along a line of TRACE and MARKS',
  run: 'How far the brush lays solid paint after a mark (RIBBON.md, measured on paper; est. on the canvas)', dryTail: 'How far it then runs dry, the paint thinning to nothing (est. on the canvas)',
  mix: 'How much of a mark\'s paint goes into what the brush carries, weighted by the paints\' strengths: dark takes over light at once (est.)', pick: 'A lane over wet paint loads half of it in 0.7 × this many mm and carries it on (est.)' };
for (const [box, list] of ALL_SL) {
  $(box).innerHTML = list.map(([key, label, , step, min, max]) => `<label class="sl"${SL_TITLE[key] ? ` title="${SL_TITLE[key]}"` : ''}><span class="slh"><span>${label}</span><span class="val" data-v="${key}"></span></span><input class="slider" type="range" data-k="${key}" min="${min}" max="${max}" step="${step}"></label>`).join('');
  $(box).querySelectorAll('input').forEach(inp => {
    inp.oninput = () => { if (!busy) undoPush(); busy = true; S[inp.dataset.k] = +inp.value; showPanel(); kick(); };
    inp.onchange = () => settle();
  });
}
// The tubes, a strip by the Tools (LOVE's paints, the prototype's tubes): a
// chip a tube, its name on hover; its number (its order among the marks) once it has
// marks, the marks under it. A click puts it in the chosen segment or takes
// it out (five at most), as the prototype's chips; with Marks, or on a pipe
// whose marks are laid by hand, it is the paint the next mark takes.
const inkOn = hex => { const [r, gg, b] = rgbOf(hex); return 0.299 * r + 0.587 * gg + 0.114 * b > 150 ? '#24221F' : '#FFFFFF'; };
$('#paints').innerHTML = PAL.tubes.map(([key, name, hex]) => `<div class="chip" data-tube="${key}"><button class="sw" style="background:${hex};color:${inkOn(hex)}" aria-label="${name}"></button><span class="cnt"></span></div>`).join('');
$('#paints').querySelectorAll('[data-tube]').forEach(chip => chip.querySelector('.sw').onclick = () => {
  const key = chip.dataset.tube, st = S.pipes[S.sel], sg = st?.segs[S.seg];
  undoPush();
  if (S.tool === 'mark' || !sg || handMarks(st)) { S.markPaint = key; settle(); return; }
  const i = sg.stops.lastIndexOf(key);
  if (i >= 0 && sg.stops.length > 1) sg.stops.splice(i, 1); else if (i < 0) { if (sg.stops.length >= 5) sg.stops.shift(); sg.stops.push(key); }
  settle();
});
function showTubes() {
  const P = planNow(), st = S.pipes[S.sel], sg = st?.segs[S.seg], marks = S.tool === 'mark' || !sg || handMarks(st), count = {};
  for (const s of P.sessions) for (const m of s.marks) count[m.paint] = (count[m.paint] || 0) + 1;
  $('#paints').querySelectorAll('[data-tube]').forEach(chip => {
    const key = chip.dataset.tube, n = paintNo(key), c = count[key] || 0, sw = chip.querySelector('.sw'), at = sg ? sg.stops.map((x, i) => x === key ? i + 1 : 0).filter(Boolean) : [];
    sw.textContent = n || '';
    chip.querySelector('.cnt').textContent = c || '';
    chip.classList.toggle('in', !marks && at.length > 0);
    chip.classList.toggle('pick', marks && key === S.markPaint);
    chip.title = `${NAME[key]}${n ? ` — paint ${n}, ${c} mark${c === 1 ? '' : 's'}` : ''}${marks ? ' — a click: the paint of the next mark' : at.length ? ` — in the segment, ${at.join(', ')} of ${sg.stops.length}; a click takes it out` : ' — a click puts it in the chosen segment'}`;
  });
}
// The pipes, bottom to top, a key each; the chosen one's editor and its segment's
function showPipes() {
  $('#pipes').innerHTML = S.pipes.length ? S.pipes.map((st, i) => { const c = (st.segs[0]?.stops || ['white']).map(q => HEX[q]); return `<button class="tog${i === S.sel ? ' on' : ''}" data-sel="${i}"><i style="background:linear-gradient(90deg,${c.join(',')})"></i>Pipe ${i + 1}</button>`; }).join('') : '<span class="none">No pipes: New composition, or New pipe and draw.</span>';
  $('#pipes').querySelectorAll('[data-sel]').forEach(b => b.onclick = () => { S.sel = +b.dataset.sel; S.seg = 0; save(); showPipes(); kick(); });
  showPipe(); showSeg(); showTubes();
}
function showPipe() {
  const box = $('#pipeEdit'), st = S.pipes[S.sel];
  if (!st) { box.innerHTML = ''; return; }
  const wl = isLanes(st), hand = handMarks(st), slider = (id, label, min, max, step, v, val, title) => `<label class="sl" title="${title}"><span class="slh"><span>${label}</span><span class="val" id="o-${id}">${val}</span></span><input class="slider" type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${v}"></label>`;
  box.innerHTML = `
    <h4>Pipe ${S.sel + 1} · ${st.pts.length} point${st.pts.length === 1 ? '' : 's'}</h4>
    <div class="toggles looks"><button class="tog${wl ? ' on' : ''}" data-pbrush="lanes" title="Every lane the whole pipe in one run, the inside lane first — a lift after each, as on the owner's paper test, or back and forth with the snake under DRAG">Whole lanes, Master Flo</button><button class="tog${wl ? '' : ' on'}" data-pbrush="segments" title="Cut by seams, each segment along the line or across it; fan ends">Segments, Alu</button></div>
    ${wl ? `<div class="toggles looks"><button class="tog${st.first === 'out' ? '' : ' on'}" data-first="in" title="The lane on the side the pipe turns to first, then out: n … 1">Inside lane first</button><button class="tog${st.first === 'out' ? ' on' : ''}" data-first="out" title="The outside lane first, then in: 1 … n">Outside lane first</button></div>
    <div class="grid4 keys"><button class="btn" id="pRev" title="The pipe turned round: its points, seams, segments and marks">Reverse the way</button>${hand ? '<button class="btn" id="pAuto" title="The marks laid by hand cleared: a mark every spacing from the segments\' paints">Back to marks every spacing</button>' : '<button class="btn" id="pHand" title="The Marks tool, to lay marks across this pipe by hand, each with its own paint">Lay marks by hand</button>'}</div>
    <p class="read">Marks: ${hand ? `<b>${st.marks.length}</b> by hand` : 'every spacing, from the segments\' paints'}</p>` : ''}
    <div class="sliders">
      ${slider('pW', 'Width', 20, 120, 1, st.w, `${st.w} mm`, 'The pipe edge to edge')}
      ${slider('pR', 'Corners', 0, 1, 0.01, st.round, st.round.toFixed(2), 'How round a corner is: the share of the shorter half-leg its arc takes')}
      ${slider('pK', 'Largest corner radius', 5, 300, 1, st.rad || 300, st.rad ? `${st.rad} mm` : 'any', 'No corner rounder than this; at the end of the slider, any')}
    </div>
    ${wl ? '' : `<div class="toggles looks"><button class="tog${st.capA === 'fan' ? ' on' : ''}" id="pA" title="The start brushed in rays to the end of the line">Start: fan</button><button class="tog${st.capB === 'fan' ? ' on' : ''}" id="pB" title="The end brushed in rays to the end of the line">End: fan</button></div>`}
    <div class="grid4 keys three"><button class="btn" id="pUp"${S.sel === S.pipes.length - 1 ? ' disabled' : ''} title="Painted later, over the one above it">Bring up</button><button class="btn" id="pDown"${S.sel === 0 ? ' disabled' : ''} title="Painted earlier, under the one below it">Send down</button><button class="btn" id="pDel" title="Take the pipe away — or ⌫ on the keyboard; ⌘Z brings it back">Delete pipe</button></div>`;
  const live = (id, fn, out) => { const inp = $('#' + id); inp.oninput = () => { if (!busy) undoPush(); busy = true; fn(+inp.value); $('#o-' + id).textContent = out(); kick(); }; inp.onchange = () => settle(); };
  live('pW', v => { st.w = v; }, () => `${st.w} mm`);
  live('pR', v => { st.round = v; }, () => st.round.toFixed(2));
  live('pK', v => { if (v >= 300) delete st.rad; else st.rad = v; }, () => st.rad ? `${st.rad} mm` : 'any');
  const act = (sel, fn) => box.querySelectorAll(sel).forEach(b => b.onclick = () => { undoPush(); fn(b); settle(); });
  act('[data-pbrush]', b => { st.brush = b.dataset.pbrush; });
  act('[data-first]', b => { st.first = b.dataset.first; });
  act('#pRev', () => { st.pts.reverse(); st.seams = st.seams.map(f => 1 - f).reverse(); st.cuts = st.seams.map((f, i) => !!(st.cuts || [])[st.seams.length - 1 - i]); st.segs.reverse(); st.marks = (st.marks || []).map(m => ({ ...m, f: 1 - m.f })).reverse(); [st.capA, st.capB] = [st.capB, st.capA]; S.seg = 0; });
  act('#pAuto', () => { st.marks = []; });
  act('#pA', () => { st.capA = st.capA === 'fan' ? 'flat' : 'fan'; });
  act('#pB', () => { st.capB = st.capB === 'fan' ? 'flat' : 'fan'; });
  act('#pUp', () => { const i = S.sel; [S.pipes[i], S.pipes[i + 1]] = [S.pipes[i + 1], S.pipes[i]]; S.sel++; });
  act('#pDown', () => { const i = S.sel; [S.pipes[i], S.pipes[i - 1]] = [S.pipes[i - 1], S.pipes[i]]; S.sel--; });
  $('#pDel').onclick = deletePipe;
  if ($('#pHand')) $('#pHand').onclick = () => { S.tool = 'mark'; S.view = 'marks'; settle(); };
}
function showSeg() {
  const box = $('#segEdit'), st = S.pipes[S.sel], sg = st?.segs[S.seg];
  if (!sg) { box.innerHTML = ''; return; }
  const wl = isLanes(st);
  if (wl && handMarks(st)) { box.innerHTML = '<p class="read">This pipe\'s marks are laid by hand, each with its own paint — a tube in the strip is the next one\'s; the segments\' paints wait until it goes back to marks every spacing.</p>'; return; }
  box.innerHTML = `
    <h4>Segment ${S.seg + 1} of ${st.segs.length}${st.segs.length > 1 ? ' · a click on the pipe chooses one' : ''}</h4>
    ${wl ? '<p class="read">Master Flo: a mark right across the whole pipe in one paint, the paints in turn along the segment — never across it.</p>'
      : `<div class="toggles looks"><button class="tog${sg.mode === 'along' ? ' on' : ''}" data-mode="along" title="Lanes along the line, the paints across the pipe — Lett's tubes, the Australian style">Along the line</button><button class="tog${sg.mode === 'across' ? ' on' : ''}" data-mode="across" title="Strokes across the pipe, back and forth, the paints along it in rings">Across it</button></div>`}
    <div class="stops" title="The segment's paints in their order; a tube in the strip puts one in or takes it out, five at most">${sg.stops.map((q, i) => `<span class="stop" style="background:${HEX[q]};color:${inkOn(HEX[q])}" title="${NAME[q]}">${i + 1}</span>`).join('')}<span class="hint">tubes in the strip, up to five</span></div>
    <div class="grid4 keys three"><button class="btn" id="gTube" title="a, b, c, b, a: the first three as a tube">Make it a tube</button><button class="btn" id="gFlip" title="The paints the other way">Reverse</button><button class="btn" id="gAll" title="These paints on every segment of the pipe">Same on the whole pipe</button></div>`;
  const act = (sel, fn) => box.querySelectorAll(sel).forEach(b => b.onclick = () => { undoPush(); fn(b); settle(); });
  act('[data-mode]', b => { sg.mode = b.dataset.mode; });
  act('#gTube', () => { const s = sg.stops.slice(0, 3); sg.stops = s.length >= 2 ? [...s, ...s.slice(0, -1).reverse()] : s; });
  act('#gFlip', () => { sg.stops.reverse(); });
  act('#gAll', () => { st.segs = st.segs.map(() => ({ mode: sg.mode, stops: sg.stops.slice() })); });
}
document.querySelectorAll('[data-ground]').forEach(b => b.onclick = () => { if (S.ground === b.dataset.ground) return; undoPush(); S.ground = b.dataset.ground; settle(); });
document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { S.view = b.dataset.view; if (S.view !== 'result') stopPlay(); settle(); });
$('#btnPlay').onclick = play;
document.querySelectorAll('[data-overlap]').forEach(b => b.onclick = () => { if (S.overlap === b.dataset.overlap) return; undoPush(); S.overlap = b.dataset.overlap; S.session = 0; settle(); });
// the snake, under DRAG (the owner, 2026-10-10): ON a pipe's lanes back and forth, the brush down; OFF one way, a lift each. Segments' Along too
const setSnake = on => { if ((S.aorder === 'snake') === on) return showPanel(); undoPush(); S.aorder = on ? 'snake' : 'one'; settle(); };
$('#snake').onchange = e => setSnake(e.target.checked);
$('#snakeOff').onclick = () => setSnake(false);
$('#snakeOn').onclick = () => setSnake(true);
$('#snakeIcon').onclick = () => setSnake(S.aorder !== 'snake');
document.querySelectorAll('[data-look]').forEach(b => b.onclick = () => { if (S.look === b.dataset.look) return; S.look = b.dataset.look; settle(); });
$('#fields').innerHTML = FIELDS.map(([key, label, unit, step, title, any]) => `<label title="${title}">${label} <input data-k="${key}" type="number" step="${step}"${any ? '' : ` min="${step}"`}><em>${unit}</em></label>`).join('');
$('#fields').querySelectorAll('input').forEach(inp => inp.onchange = () => {
  const v = +inp.value, any = FIELDS.find(f => f[0] === inp.dataset.k)[5];
  if (inp.value !== '' && fin(v) && (any || v > 0)) { undoPush(); S[inp.dataset.k] = v; setCanvas(S); }   // the canvas: one base for every tab (canvas.js)
  settle();
});
$('#planInfo').onclick = () => { $('#planRead').hidden = !$('#planRead').hidden; $('#planInfo').classList.toggle('on', !$('#planRead').hidden); };
$('#ink').onchange = e => { S.ink = e.target.checked; settle(); };
$('#inkOff').onclick = () => { S.ink = false; settle(); };
$('#inkOn').onclick = () => { S.ink = true; settle(); };
// the composition: a new seed, the families again. No Paper test key since 2026-10-10 (the owner: "I do not need this key");
// a save of it still opens, and paperTest stays the tests' fixture
$('#btnCompose').onclick = () => { undoPush(); S.seed = 1 + Math.floor(Math.random() * 9999); S.pipes = compose(S.seed, po()); S.sel = 0; S.seg = 0; settle(); };
$('#btnRecolour').onclick = () => { if (!S.pipes.length) return; undoPush(); recolour(S.pipes, Math.floor(Math.random() * 1e9), PAL); settle(); };
$('#btnNewPipe').onclick = () => { undoPush(); S.pipes.push(newPipe(Math.round(Math.min(50, S.cw / 3)), Date.now() >>> 0, PAL)); S.sel = S.pipes.length - 1; S.seg = 0; S.tool = 'draw'; settle(); };
$('#btnUndoPt').onclick = () => { const st = S.pipes[S.sel]; if (!st?.pts.length) return; undoPush(); st.pts.pop(); settle(); };
function showPanel() {
  for (const [box, list] of ALL_SL) for (const [key] of list) {
    const inp = $(`${box} input[data-k="${key}"]`); if (document.activeElement !== inp) inp.value = S[key];
    $(`${box} [data-v="${key}"]`).textContent = valOf(key);
  }
  document.querySelectorAll('[data-overlap]').forEach(b => b.classList.toggle('on', b.dataset.overlap === S.overlap));
  document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('on', b.dataset.view === S.view));
  document.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === S.tool));
  $('#snake').checked = S.aorder === 'snake'; $('#snakeOff').classList.toggle('on', S.aorder !== 'snake'); $('#snakeOn').classList.toggle('on', S.aorder === 'snake');
  document.querySelectorAll('[data-look]').forEach(b => b.classList.toggle('on', b.dataset.look === S.look));
  document.querySelectorAll('[data-ground]').forEach(b => b.classList.toggle('on', b.dataset.ground === S.ground));
  $('#fields').querySelectorAll('input').forEach(inp => { if (document.activeElement !== inp) inp.value = S[inp.dataset.k]; });
  $('#ink').checked = S.ink; $('#inkOff').classList.toggle('on', !S.ink); $('#inkOn').classList.toggle('on', S.ink);
  $('#seedRead').innerHTML = S.seed === 'paper' ? 'The paper test of 8 October, 1 : 1 on A5' : `Composition <b>${S.seed}</b>`;
  $('#hint').textContent = HINT[S.tool];
}
// Settled: the mouse let go, a slider let go — the plan, the reading, the LCD.
function settle() {
  busy = false;
  fitPanel();
  if (S.sel >= S.pipes.length) S.sel = Math.max(0, S.pipes.length - 1);
  if (S.seg >= (S.pipes[S.sel]?.segs.length || 1)) S.seg = 0;
  const P = planNow(), P_ = plan(), C = cup(), est = key => C.est?.[key] ? ' (est.)' : '', here = hereNow(), ses = P.sessions.length;
  const live = P.pipes.filter(st => st.sp), runs = P.sessions.flatMap(s => s.runs), marks = P.sessions.flatMap(s => s.marks), path = runs.reduce((a, r) => a + r.cum.at(-1), 0);
  const segs = live.filter(st => !isLanes(st)).flatMap(st => st.segs), nA = segs.filter(x => x.mode === 'along').length, nW = live.filter(isLanes).length;
  const lines = [];
  lines.push(!live.length ? 'No pipes: New composition, or New pipe and Draw.' : `<b>${live.length}</b> pipe${live.length === 1 ? '' : 's'}${nW ? ` · <b>${nW}</b> in whole lanes` : ''}${segs.length ? ` · ${segs.length} segments, <b>${nA}</b> along, <b>${segs.length - nA}</b> across` : ''} · DRAG <b>${fmt(path / 1000, 1)} m</b> with the dry brush, ≈ ${fmt(path / S.drag / 60, 0)} min at ${S.drag} mm/s (est.), the brush down <b>${runs.length}</b> times`);
  P.pipes.forEach((st, i) => {
    if (!st.sp || !isLanes(st)) return;
    const o = lanesOf(st, po()), c = (P.crossings[i] || []).length;
    lines.push(`Pipe ${i + 1}, whole lanes, ${st.first === 'out' ? 'outside' : 'inside'} lane first: <b>${o.order.map(j => o.num[j]).join(' → ')}</b> · marks ${handMarks(st) ? `by hand, <b>${st.marks.length}</b>` : 'from the segments'} · ${c ? `crosses itself <b>${c}</b>×: one lane per step` : 'does not cross itself'}`);
  });
  if (marks.length) lines.push(`MARKS <b>${marks.length}</b> dashes from the cup · ` + P.nums.map((q, i) => `${i + 1} ${NAME[q]} × ${marks.filter(m => m.paint === q).length}`).join(' · '));
  lines.push(ses === 1 ? 'One session, everything wet' : `<b>${ses}</b> sessions: a pipe that crosses an earlier one waits for it to dry`);
  if (CUT && live.length) {                                                          // ALU-CUT: the cuts, DRAG's stops, and mud where a part runs over another's wet paint
    const nCuts = live.reduce((a, st) => a + st.cutS.length, 0);
    let stops = 0; for (const sx of P.sessions) sx.runs.forEach((r, i) => { const q = sx.runs[i - 1]; if (q && (q.si !== r.si || (q.part ?? 0) !== (r.part ?? 0))) stops++; });
    lines.push(`Cuts <b>${nCuts}</b> · DRAG stops <b>${stops}</b> time${stops === 1 ? '' : 's'}, at every cut and before every next pipe: a clean brush and its own paints each part`);
    const mud = walkNow().mud, nm = q => `pipe ${q.si + 1}${live[q.si]?.cutS.length ? `, part ${q.part + 1}` : ''}`;
    if (mud.length) lines.push(`⚠ ${mud.map(q => `${nm(q)} runs over the wet paint of ${nm(q.from)}`).join('; ')} — mud there in the Result`);
  }
  if (P_.outlines) lines.push(`TRACE: <b>${P_.outlines}</b> outlines in watercolour, ${S.ink ? `<b>Ink ON</b>: a dip, then outlines on what the brush holds up to ${DIP_RUN} mm (est.), ${P_.dips} dips; the elbow over the rim +${C.rim}°${est('rim')}, in the cup ${C.dip > 0 ? '+' : ''}${C.dip}°${est('dip')}, ${C.dwell} s in the paint` : 'Ink OFF: no dip'} · ${fmt(P_.length / 1000, 2)} m at ${S.speed} mm/s, ≈ ${fmt(P_.seconds / 60, 1)} min (est.)`);
  lines.push(`The canvas from home: its bottom left corner at carriage <b>X ${fmt(here.x - S.boardH / 2, 1)} · Y ${fmt(here.y - S.boardW / 2, 1)} mm</b>; TEST's dots ${TEST_MARGIN} mm in from its edges.`);
  $('#planRead').innerHTML = lines.join(' · ');
  const pitch = S.lanes > 1 ? 2 * Math.max(0, (S.pipes[S.sel]?.w || 50) / 2 - S.brush / 2) / (S.lanes - 1) : 0;
  const warn = [S.ink ? cupProblem(C) : '', P_.fault && `The plan is wrong, TRACE will not run it: ${P_.fault}.`, walls(),
    live.length && S.spacing > S.run && `Mark spacing ${S.spacing} mm is longer than the dense run ${S.run} mm: dry patches before every mark.`,
    live.length && pitch > S.brush && `The lanes are ${fmt(pitch, 1)} mm apart, wider than the brush: white gaps between them — more lanes or a wider brush.`,
    S.xstep > S.brush && segs.some(x => x.mode === 'across') && 'Across, the step is wider than the brush: white gaps between the strokes.',
    P.tight && `${P.tight} corner${P.tight > 1 ? 's' : ''} tighter than half the pipe: the inner lanes pinch there.`,
    P.dry && `${P.dry} run${P.dry > 1 ? 's' : ''} cross the panel dry for longer than the dense run.`].filter(Boolean);
  $('#planWarn').innerHTML = warn.map(w => `<span class="warn">${w}</span>`).join(' ');
  $('#planWarn').hidden = !warn.length;
  if (S.session > ses) S.session = 0;                                                // the sessions under the view, in 2 Marks and 3 Drag, when more than one
  const showSes = ses > 1 && (S.view === 'marks' || S.view === 'drag');
  $('#sessions').hidden = !showSes;
  $('#sessions').innerHTML = showSes ? ['All', ...Array.from({ length: ses }, (_, i) => `Session ${i + 1}`)].map((t, i) => `<button class="tog${S.session === i ? ' on' : ''}" data-ses="${i}">${t}</button>`).join('') : '';
  $('#sessions').querySelectorAll('[data-ses]').forEach(b => b.onclick = () => { S.session = +b.dataset.ses; settle(); });
  $('#stats').textContent = !live.length ? 'no pipes' : `${live.length} pipes · ${runs.length} runs · ${marks.length} marks · ${P.nums.length} paints · ${ses} session${ses === 1 ? '' : 's'} · TRACE ≈ ${fmt(P_.seconds / 60, 1)} min (est.)`;
  showFiles();
  showPanel(); showPipes(); showDeck(); save(); layout(); lastLcd && lcd(lastLcd);
}
function walls(P_ = PLAN) {
  const h = hereNow();
  if (!P_?.carriage || !P_.rows.length) return '';
  const R = reach(), b = P_.carriage, x0 = h.x + b.x0, x1 = h.x + b.x1, y0 = h.y + b.y0, y1 = h.y + b.y1;
  const out = [x0 < R.x.min && `${fmt(R.x.min - x0, 0)} mm past the bottom wall`, x1 > R.x.max && `${fmt(x1 - R.x.max, 0)} mm past the top wall`,
    y0 < R.y.min && `${fmt(R.y.min - y0, 0)} mm past the left wall`, y1 > R.y.max && `${fmt(y1 - R.y.max, 0)} mm past the right wall`].filter(Boolean);
  return out.length ? `The brush would go ${out.join(', ')}: move the canvas or the pipes.` : '';
}
// The files of the prototype (ALU.md, TYPE.md's format): SVG in panel mm, a
// <path> a brush-down run in drawing order; the paint map for the painter;
// the plan. Saved to Downloads, as the browser saves.
function showFiles() {
  const P = planNow(), o = po(), many = P.sessions.length > 1, slug = slugOf(o), list = [['1 Trace', `${slug}_1_trace.svg`, () => traceSvg(P, o)]];
  for (const s of P.sessions) list.push([`2 Marks${many ? ' s' + s.n : ''}`, `${slug}_2_marks${many ? '_s' + s.n : ''}.svg`, () => marksSvg(P, s, o)]);
  for (const s of P.sessions) list.push([`3 Drag${many ? ' s' + s.n : ''}`, `${slug}_3_drag${many ? '_s' + s.n : ''}.svg`, () => dragSvg(s, o)]);
  list.push(['Paint map', `${slug}_paint_map.svg`, () => paintMapSvg(P, o)], ['Plan', `${slug}_plan.json`, () => planJson(P, o)]);
  const box = $('#files');
  box.innerHTML = list.map(([label, name], i) => `<button class="tog" data-file="${i}" title="${name}">${label}</button>`).join('');
  box.querySelectorAll('[data-file]').forEach(b => b.onclick = () => {
    const [, name, make] = list[+b.dataset.file], a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([make()], { type: name.endsWith('.json') ? 'application/json' : 'image/svg+xml' })); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000); $('#fileRead').textContent = `saved ${name}`;
  });
}

// ---------- the reference: tracing paper over the canvas (LOVE's) ----------
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
  $('#refRead').innerHTML = REF ? `${esc(REF.name)} · <b>${S.refOpacity} %</b>` : 'Over the canvas, the whole of it inside, to draw the pipes to.';
}
$('#btnRef').onclick = () => $('#refIn').click();
$('#refIn').onchange = e => { const f = e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => setRef(rd.result, f.name, true); rd.readAsDataURL(f); e.target.value = ''; };
$('#refOp').oninput = e => { S.refOpacity = +e.target.value; syncRef(); save(); kick(); };
function loadRef() { try { const o = JSON.parse(localStorage.getItem(REF_KEY) || 'null'); if (o && o.src) setRef(o.src, o.name || 'reference', false); } catch { } }

// ---------- 💾 SAVE ALU, SAVE SMKN ----------
// As SAVE LOVE: an SVG of the canvas in mm — the trace's outlines, the marks
// in their tubes' colours — the whole state in its metadata, a PNG preview of
// the Result; on the tests' shelf, its label ALU or SMKN — the Library opens it on its tab.
const label = () => `${TAB_NAME} · ${S.seed === 'paper' ? 'the paper test' : `composition ${S.seed}`} · ${S.pipes.length} pipe${S.pipes.length === 1 ? '' : 's'} · ${S.boardW} × ${S.boardH} mm · ${planNow().nums.length} paints${S.ink ? ' · ink' : ''}`;
function svgOf() {
  const W = S.boardW, H = S.boardH, f = v => (Math.round(v * 100) / 100).toFixed(2), P = planNow();
  const meta = JSON.stringify({ rembrandt: '1.0.5', [TAB]: true, label: label(), settings: S }).replace(/&/g, '\\u0026').replace(/</g, '\\u003c').replace(/--/g, '- -');
  const pts = q => q.map(p => `${f(p[0])},${f(p[1])}`).join(' ');
  const lines = (plan().trace || []).map(t => `  <polyline points="${pts(t.pts)}"/>`).join('\n');
  const marks = P.sessions.flatMap(s => s.marks).map(m => `  <polyline points="${pts(m.pts)}" stroke="${HEX[m.paint]}" data-paint="${paintNo(m.paint)}"/>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}">
<!-- Rembrandt v.1.0.5 · ${esc(label())}; 1 unit = 1 mm; TRACE, each outline with its lap -->
<desc>Paints: ${esc(P.nums.map((q, i) => `${i + 1} ${NAME[q]} ${HEX[q]}`).join(' · '))}</desc>
<metadata id="rembrandt-test">${meta}</metadata>
<rect width="${W}" height="${H}" fill="${GROUND[S.ground]}" stroke="#24221F" stroke-width="0.5"/>
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
  const was = S.view; S.view = 'result';                                             // the Library shows the painting
  try { draw(); } finally { [g, k, dpr, V] = keep; S.view = was; }
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
    if (!o?.[TAB]) { $('#saveState').textContent = `not an ${TAB_NAME} save: open it on its own tab`; return; }
    undoPush();
    localStorage.setItem(KEY, JSON.stringify(o.settings)); setCanvas(o.settings); load(); Object.assign(S, canvasNow(S)); settle();   // the save's canvas becomes the base
    $('#saveState').textContent = `opened · ${file.slice(0, 13)}:${file.slice(14)}`;
  } catch { $('#saveState').textContent = 'could not open it from the Library'; }
}

// ---------- the deck: TEST, TRACE, MARKS, DRAG, PAUSE (LOVE's) ----------
const post = async path => { try { const r = await fetch(path, { method: 'POST' }); return await r.text(); } catch { return 'start rembrandt.py'; } };
let RUN_KEY = null, RUN_SES = 1, counted = null;
async function start(key, blocks, info, log) {
  try {
    RUN = blocks; RUN_INFO = info; RUN_KEY = key;
    const r = await fetch('/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blocks, log }) });   // the run journal, rembrandt.py
    $('#runState').textContent = await r.text();
  } catch { $('#runState').textContent = 'start rembrandt.py'; }
}
const what = () => S.seed === 'paper' ? 'the paper test' : `${S.pipes.length} pipe${S.pipes.length === 1 ? '' : 's'}`;
$('#btnTrace').onclick = async () => {
  await loadInk(); settle();
  const P_ = plan();
  if (!P_.rows.length) { $('#runState').innerHTML = '<span class="warn">Nothing to trace: no pipes on the canvas.</span>'; return; }
  if (S.ink && cupProblem(cup())) { $('#runState').innerHTML = `<span class="warn">Ink ON: ${cupProblem(cup())}</span>`; return; }
  if (walls()) { $('#runState').innerHTML = `<span class="warn">${walls()}</span>`; return; }
  if (P_.fault) { $('#runState').innerHTML = `<span class="warn">Not run: the plan is wrong — ${P_.fault}.</span>`; return; }
  if (!confirm(`TRACE ${TAB_NAME}, ${what()}: ${P_.outlines} outlines in watercolour will be run on the machine${S.ink ? `, ${P_.dips} dips in the cup` : ', no dip'}, ≈ ${fmt(P_.seconds / 60, 0)} min (est.)`)) return;
  S.view = 'trace'; settle();
  await start('trace', P_.blocks, { seconds: P_.seconds, rows: P_.rows },
    { page: TAB, pass: 'trace', label: label(), settings: S, here: hereNow(), ...(S.ink ? { cup: cup() } : {}), estimate_s: Math.round(P_.seconds) });
};
// MARKS and DRAG, a session a press, as on LOVE: MARKS from the cup as TRACE,
// a dip every MARKS_DIP marks; DRAG dry, never a dip, at its own speed.
const nextOf = key => Math.min(Math.max(1, S.next[key] || 1), nSes());
function showDeck() {
  const n = nSes();
  for (const [id, key, name, title] of [['#btnMarks', 'marks', 'Marks', 'MARKS, pass 2: a mark across the pipe where each paint goes, lane 1 to lane n, from the same cup as TRACE'],
    ['#btnDrag', 'drag', 'Drag', 'DRAG, pass 3: the dry brush through the paint, every lane the whole pipe, no dip']]) {
    const el = $(id), ses = nextOf(key);
    el.querySelector('span').textContent = n > 1 ? `${name} ${ses}/${n}` : name;
    el.title = title + (n > 1 ? `; next session ${ses} of ${n}` : '');
  }
}
function marksRun(ses) {
  const R = marksRows(planNow(), ses - 1, { ...po(), ink: S.ink }); if (!R.ps.length) return null;
  return { ...plotRun({ ...runOpts(R.ps.length), noDipUnder: 0 }, [{ key: 'MARKS', ps: R.ps, why: null }]), rows: R.info, marks: R.marks, count: R.count };   // noDipUnder 0: a mark's dip is its own
}
function dragRun(ses) {
  const R = dragRows(planNow(), ses - 1, po()); if (!R.ps.length) return null;
  // PAUSE at a lane's end, never on the line (the owner, 2026-10-10); on ALU-CUT a stop before every next part and pipe, a pass each
  return { ...plotRun({ ...runOpts(R.ps.length), ink: false, speed: S.drag, pauseAtEnds: true }, dragPasses(R)), rows: R.info, runs: R.runs, mm: R.length, stops: R.stops.length };
}
async function runPass(key) {
  await loadInk(); settle();
  const n = nSes(), ses = nextOf(key), P_ = key === 'marks' ? marksRun(ses) : dragRun(ses), of = n > 1 ? ` · session ${ses} of ${n}` : '';
  if (!P_) { $('#runState').innerHTML = '<span class="warn">Nothing to run: no pipes on the canvas.</span>'; return; }
  if (key === 'marks' && S.ink && cupProblem(cup())) { $('#runState').innerHTML = `<span class="warn">Ink ON: ${cupProblem(cup())}</span>`; return; }
  if (walls(P_)) { $('#runState').innerHTML = `<span class="warn">${walls(P_)}</span>`; return; }
  if (P_.fault) { $('#runState').innerHTML = `<span class="warn">Not run: the plan is wrong — ${P_.fault}.</span>`; return; }
  const min = fmt(P_.seconds / 60, 0), text = key === 'marks'
    ? `${P_.marks} marks, ${P_.rows.length} strokes${S.ink ? `, ${P_.dips} dips in the cup, one every ${MARKS_DIP} marks` : ', no dip'}, ≈ ${min} min (est.).\n\nThen squeeze the paints onto the marks — ${Object.entries(P_.count).sort((a, b) => paintNo(a[0]) - paintNo(b[0])).map(([q, c]) => `${paintNo(q)} ${NAME[q]} × ${c}`).join(', ')} — and press DRAG.`
    : `${P_.stops ? `${P_.stops + 1} parts, a clean brush each: squeeze the first part\'s paints only now; DRAG stops ${P_.stops} time${P_.stops > 1 ? 's' : ''} — at every cut and before every next pipe — for you to wipe or wash the brush and squeeze the next part\'s paints, then Continue.\n\n` : ''}${P_.runs} runs, ${S.aorder === 'snake' ? 'the snake: a pipe\'s lanes back and forth with the brush down, a step across at each end' : 'each lane the whole pipe'}, the brush landing ${P_.runs} times and lifting at each end, ${fmt(P_.mm / 1000, 1)} m with the dry brush, no dip, at ${S.drag} mm/s, ≈ ${min} min (est.). Are the paints on the marks?`;
  if (!confirm(`${key.toUpperCase()} ${TAB_NAME}, ${what()}${of}: ${text}`)) return;
  S.view = key; S.session = n > 1 ? ses : 0; RUN_SES = ses; settle();                // the board shows the pass running
  await start(key, P_.blocks, { seconds: P_.seconds, rows: P_.rows },
    { page: TAB, pass: key, session: ses, sessions: n, label: label(), settings: S, here: hereNow(), ...(key === 'marks' && S.ink ? { cup: cup() } : {}), estimate_s: Math.round(P_.seconds) });
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
    { page: TAB, label: `${TAB_NAME} · TEST · the corners`, here, dots: T.dots.map(d => ({ name: d.name, x: +(here.x + d.at.x).toFixed(1), y: +(here.y + d.at.y).toFixed(1) })), cup: cup(), estimate_s: Math.round(T.seconds) });
};
let paused = false;
$('#btnPause').onclick = () => post(paused ? '/run/continue' : '/run/pause');
$('#btnStop').onclick = () => post('/run/stop');

// The LCD, as on LOVE.
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
  const b = st && (RUN || P_.blocks)[st.block], row = b && R_.rows[b.row - 1], now0 = row?.label;
  const waiting = st?.state === 'paused' && st.message;
  paused = ['paused', 'pausing'].includes(st?.state);
  const keyEl = $('#btnPause');
  keyEl.querySelector('span').textContent = paused ? 'Cont.' : 'Pause'; keyEl.classList.toggle('call', paused); keyEl.disabled = !live;
  document.querySelectorAll('.deck [data-pass], #btnTest').forEach(el => el.classList.toggle('on', !!live && (el.dataset.pass || 'test') === RUN_KEY));   // the running key stays down
  const now = waiting ? `❚❚ ${st.message}`
    : live && b?.home ? 'done · the carriage goes home, the brush off'
    : live && now0 && b?.dip ? `${now0} · the dip in the cup`
    : live && now0 ? now0 + (st.brush_on ? ' · brush on' : ' · brush off')
    : `${P_.outlines || 0} outlines · ${what()}`;
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
    S.next[RUN_KEY] = RUN_SES % nSes() + 1; save(); showDeck();
  }
  $('#runState').innerHTML = !st ? 'no server: start rembrandt.py' : st.message ? `<span class="${st.state === 'error' ? 'warn' : ''}">${st.message}</span>` : '';
}

// ---------- start ----------
load(); Object.assign(S, canvasNow(S));                                          // the canvas from the base, every tab's (canvas.js)
if (FRESH) { S.cw = S.boardW; S.ch = S.boardH; S.pipes = compose(S.seed, po()); }   // a first visit: composition 1
onCanvas(c => { Object.assign(S, c); settle(); });                               // changed in another window
syncRef(); loadRef();
lampSwitch($('#lamp'));
showZoom();
addEventListener('rembrandt-night', () => kick());
setInterval(watch, 500);
new ResizeObserver(layout).observe(stage);
settle(); watch();
loadInk().then(settle);
addEventListener('focus', () => loadInk().then(settle));
const opening = new URLSearchParams(location.search).get('open');
if (opening) openFromLibrary(opening);
