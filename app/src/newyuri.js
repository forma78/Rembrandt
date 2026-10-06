// Rembrandt · New Yuri — letters as rings of circles (Rembrandt.md §1; the
// owner, 2026-10-05: "maybe make a New Yuri tab, so as not to mix all this
// into NOLAN? We have no 3D there, half the sliders are not needed"). The
// letters are rings.js's, the owner's set in glyphs.json: a circle of radius
// Weight every Step along each stroke's skeleton, RINGS or COIL. The page is
// NOLAN's without the 3D — its board, the canvas from home, PROGRESS, TEST,
// PLAY, INK, the brush — and the run is Test's (strokes.js, plotRun); the
// shared modules are imported, so a fix reaches both tabs.
//
// Canvas mm from its centre: x right, y down. The board, as on Test: mm from
// Here — the canvas's centre — X up, Y right.

import { fmt } from './util.js';
import { reach, homeCorner } from './machine.js';
import { plotRun, DEFAULTS, TABLE_MM, SPEED_MAX, ELBOW_HOVER, TAIL_MIN, TAIL_MAX, tailIn, pieceLen } from './strokes.js';
import { cornerDots, TEST_MARGIN, fitPieces, toMachine, dipParts, DIP_RUN, DIP_LAP, NO_DIP, LOOP_SHARE } from './band.js';
import { letterOf, coilOf, pointAt, pieceLength, nextX } from './rings.js';
import { segments, sticks } from './lcd.js';
import { lampSwitch, themeColor } from './lamp.js';
import { cupOf, cupProblem, drawCup, dipAt } from './ink.js';
import { CANVAS_FIELDS as FIELDS, canvasNow, setCanvas, onCanvas } from './canvas.js';
import './ui.js';

const $ = s => document.querySelector(s);
const KEY = 'rembrandt.newyuri.v04', REF_KEY = 'rembrandt.newyuri.ref';
const ORDER = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789%!'];
const CIRCLES_MAX = 400;   // circles in a stroke: more is named (the task's guard, est.)
const H_MIN = 20;          // mm: a shorter drag is a click
const R_SHARE = 0.45;      // the weight held under this share of the height: the skeleton keeps a box
let GLYPHS = null;

// ---------- state ----------
// The letters, each a figure (as NOLAN's): its glyph, where it stands — x
// its left edge, base its baseline — its height H, its weight R (the
// circle's radius), its Step, RINGS or COIL; strokes: a stroke's own Step
// (the task: "double-click a letter, its strokes selectable — a dense stem,
// a sparse crossbar"). The panel edits the picked one; with none, S.tpl
// keeps its numbers for the next. RAMP and a gap between letters are not
// here (the owner, 2026-10-06: "I don't need RAMP — better not to clutter
// the interface"; "I take the letters from the strip and put them on the
// canvas, as the circles").
const newLetter = (o = {}) => ({ ch: 'A', x: 0, base: 0, H: 280, R: 40, step: 10, mode: 'rings', strokes: [], ...o });
const S = {
  figs: [], cur: -1, tpl: newLetter(), glyph: 'A',
  width: 4, speed: 150, travel: 180, tail: 3, ink: false,                         // the brush (est.)
  boardW: 500, boardH: 700, edgeLeft: 50, edgeBottom: 0,                         // the canvas, and its edges from home, as on NOLAN
  refOpacity: 30, tool: 'select',
};
const figNow = () => S.figs[S.cur] || S.tpl;
let pickStroke = -1;   // the picked letter's picked stroke, after a double-click; −1 the whole letter
const NUM = ['width', 'speed', 'travel', 'tail', 'boardW', 'boardH', 'edgeLeft', 'edgeBottom', 'refOpacity'];
function letterIn(o) {
  const f = newLetter();
  if (ORDER.includes(o?.ch)) f.ch = o.ch;
  for (const k of ['x', 'base', 'H', 'R', 'step']) if (Number.isFinite(o?.[k])) f[k] = o[k];
  if (o?.mode === 'coil') f.mode = 'coil';
  f.strokes = Array.isArray(o?.strokes) ? o.strokes.map(s => Number.isFinite(s?.step) ? { step: s.step } : {}) : [];
  return f;
}
function load() {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (!o) return;
    for (const k of NUM) if (Number.isFinite(o[k])) S[k] = o[k];
    S.tail = tailIn(S.tail);
    if (typeof o.ink === 'boolean') S.ink = o.ink;
    if (['select', 'type'].includes(o.tool)) S.tool = o.tool;
    if (ORDER.includes(o.glyph)) S.glyph = o.glyph;
    if (Array.isArray(o.figs)) S.figs = o.figs.map(letterIn);
    if (o.tpl) S.tpl = letterIn(o.tpl);
    S.cur = Number.isInteger(o.cur) ? o.cur : -1;
  } catch { }
  fixCur();
}
function fixCur() { S.cur = S.figs.length ? Math.max(-1, Math.min(S.cur, S.figs.length - 1)) : -1; if (S.cur < 0) pickStroke = -1; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { } };

// ---------- the letters ----------
const LETTERS = new WeakMap();   // a figure → its letter (rings.js), while it stays as it is
const weightOf = f => Math.min(f.R, R_SHARE * f.H);
function letterNow(f) {
  if (!GLYPHS?.[f.ch]) return null;
  const key = JSON.stringify([f, S.width]), c = LETTERS.get(f);
  if (c?.key === key) return c.l;
  const l = letterOf(GLYPHS[f.ch], { x: f.x, base: f.base, H: f.H, R: weightOf(f), step: f.step, ramp: 0, min: S.width, strokes: f.strokes });
  l.R = weightOf(f);
  LETTERS.set(f, { key, l });
  return l;
}
// the skeleton's points every 2 mm: the letter under the mouse, its stroke
function skeletonPts(st) {
  if (st.dot) return [st.centres[0]];
  const L = st.pieces.reduce((a, g) => a + pieceLength(g), 0), n = Math.max(1, Math.ceil(L / 2));
  return Array.from({ length: n + 1 }, (_, j) => pointAt(st.pieces, L * j / n));
}
function strokeAt(l, p) {
  let best = -1, bd = Infinity;
  l.strokes.forEach((st, j) => { for (const q of skeletonPts(st)) { const d = Math.hypot(q[0] - p[0], q[1] - p[1]); if (d < bd) { bd = d; best = j; } } });
  return bd <= l.R + S.width / 2 ? best : -1;
}
function figAt(p) {
  for (let i = S.figs.length - 1; i >= 0; i--) { const l = letterNow(S.figs[i]); if (l && strokeAt(l, p) >= 0) return i; }
  return -1;
}

// ---------- the cup, and the canvas from home (NOLAN's) ----------
let INK = {};
const cup = () => cupOf(INK);
async function loadInk() {
  try { const r = await fetch('/ink', { cache: 'no-store' }); INK = r.ok ? await r.json() : {}; } catch { INK = {}; }
}
const hereNow = () => { const R = reach(); return { x: R.x.min + S.edgeBottom + S.boardH / 2, y: R.y.min + S.edgeLeft + S.boardW / 2 }; };
const dipCup = () => { const c = cup(), d = dipAt(c); return d ? { ...c, x: d.x, y: d.y } : c; };

// ---------- the run ----------
// Every ring a row, in order: letter by letter, stroke by stroke, along it.
// A ring lands where the last one ended — the point of it nearest to there
// (the task: "start each circle at the point nearest to where the previous
// one ended, one rotation for the whole letter") — goes round clockwise on
// the canvas, on LOOP_SHARE of itself over its start, and lifts off over all
// of that, as NOLAN's rings (the owner, 2026-10-05: "a 60 % lap will do"). A
// letter's first ring from 12 o'clock. A dot's cut circles run as they are,
// over the top. COIL: a stroke one line, fitted into lines and arcs (≤ 0.1
// mm), split for a dip as NOLAN's lines are. INK ON: several rings to a
// dip, as long as a dip carries, DIP_RUN — a ring never split (the owner:
// "yes"; NOLAN's rule of 23:57).
const QUARTER = Math.PI / 2;
function arcPieces(c, r, a0, sweep) {                     // canvas, clockwise on the screen from a0 → machine pieces
  const n = Math.max(1, Math.ceil(sweep / QUARTER - 1e-9)), P = t => toMachine([c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)]), out = [];
  for (let i = 0; i < n; i++) out.push({ t: 'A', a: P(a0 + sweep * i / n), b: P(a0 + sweep * (i + 1) / n), c: toMachine(c), r, d: 1 });
  return out;
}
function rowsOf() {
  const rows = [], info = [];
  let end = null, circles = 0;
  S.figs.forEach((f, li) => {
    const l = letterNow(f); if (!l) return;
    end = null;                                                                   // a letter's first ring from 12 o'clock
    l.strokes.forEach((st, j) => {
      const name = `${f.ch} · stroke ${j + 1} of ${l.strokes.length}`;
      if (f.mode === 'coil' && !st.dot) {
        const pts = coilOf(st.centres, l.R, st.closed, 48), parts = S.ink ? dipParts(pts, 0, DIP_RUN, Math.max(S.tail, DIP_LAP)) : [pts];
        circles += st.centres.length;
        parts.forEach((part, pi) => { const ps = fitPieces(part); if (ps.length) { rows.push(ps); info.push({ label: `${name} · coil${parts.length > 1 ? ` ${pi + 1} of ${parts.length}` : ''}`, f: li }); } });
        end = pts.at(-1);
        return;
      }
      st.rings.forEach((q, i) => {
        circles++;
        const whole = q.a1 - q.a0 > 2 * Math.PI - 1e-6;
        if (whole) {
          const a0 = end ? Math.atan2(end[1] - q.c[1], end[0] - q.c[0]) : -QUARTER, sweep = 2 * Math.PI * (1 + LOOP_SHARE);
          rows.push(arcPieces(q.c, q.r, a0, sweep).map(g => ({ ...g, tailOut: LOOP_SHARE * 2 * Math.PI * q.r })));
          end = [q.c[0] + q.r * Math.cos(a0 + sweep), q.c[1] + q.r * Math.sin(a0 + sweep)];
        } else {
          rows.push(arcPieces(q.c, q.r, q.a0, q.a1 - q.a0));
          end = [q.c[0] + q.r * Math.cos(q.a1), q.c[1] + q.r * Math.sin(q.a1)];
        }
        info.push({ label: `${name} · ${st.dot ? 'the dot' : 'ring'} ${i + 1} of ${st.rings.length}`, f: li });
      });
    });
  });
  // INK ON: a dip, then rings on what the brush holds until the next would pass the dip run
  let since = Infinity;
  const ps = rows.map((pieces, i) => {
    const len = pieces.reduce((a, g) => a + pieceLen(g), 0), nodip = S.ink && since + len <= DIP_RUN;
    since = nodip ? since + len : len;
    return pieces.map(g => ({ ...g, tilt: 0, row: i + 1, ...(nodip ? { nodip: true } : {}) }));
  });
  return { ps, info, circles };
}
let PLAN = null, planKey = '', busy = false;
const EMPTY = { blocks: [], rows: [], pieces: 0, passes: [], seconds: 0, length: 0, need: 0, pastWall: 0, gone: 0, dips: 0, carriage: null, air: [], ink: false, circles: 0, fault: '' };
const runOpts = rows => ({ ...DEFAULTS, speed: S.speed, travel: S.travel, tail: S.tail, lift: false, ink: S.ink, snake: true, pause: false, rows, here: hereNow(), cup: dipCup(), noDipUnder: NO_DIP, hover: ELBOW_HOVER });
function plan() {
  if (busy && PLAN) return PLAN;
  const here = hereNow(), key = JSON.stringify([S.figs, S.width, S.speed, S.travel, S.tail, S.ink, here, S.ink ? dipCup() : null, !!GLYPHS]);
  if (PLAN && key === planKey) return PLAN;
  planKey = key;
  const R = rowsOf();
  if (!R.ps.length) { PLAN = EMPTY; return PLAN; }
  const o = runOpts(R.ps.length);
  PLAN = { ...plotRun(o, [{ key: 'Y', ps: R.ps, why: null }]), rows: R.info, pieces: R.ps.length, passes: ['Y'], ink: S.ink, circles: R.circles, opts: o };
  return PLAN;
}

// ---------- the board (NOLAN's) ----------
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
  const r = stage.getBoundingClientRect(), m = 36, sw = V.y1 - V.y0, sh = V.x1 - V.x0, strip = S.tool === 'type' ? 46 : 0;
  k = Math.max(0.2, Math.min((r.width - strip - 2 * m) / sw, (r.height - 2 * m) / sh));
  dpr = window.devicePixelRatio || 1;
  const w = Math.round(sw * k), h = Math.round(sh * k);
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
  g.lineCap = 'round'; g.lineJoin = 'round';
  S.figs.forEach((f, i) => drawLetter(f, i));
  if (drag?.mode === 'type' && drag.H >= H_MIN) drawLetter(drag.f, -1, true);   // T: the letter as it is dragged up
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
  const l = S.figs[S.cur] && letterNow(S.figs[S.cur]);
  if (l) {                                                                              // the picked letter: a dashed frame round it
    const f = S.figs[S.cur], x0 = sx([l.x0]), x1 = sx([l.x1]), y0 = sy([0, f.base - f.H]), y1 = sy([0, f.base]);
    g.save(); g.setLineDash([4, 4]); g.strokeStyle = ORANGE; g.lineWidth = 1; g.strokeRect(x0 - 6, y0 - 6, x1 - x0 + 12, y1 - y0 + 12); g.restore();
  }
  drawTrail();
}
// A letter as the brush paints it: every ring, or the coil, the row's width in true mm.
function drawLetter(f, i, ghost = false) {
  const l = letterNow(f); if (!l) return;
  g.save();
  l.strokes.forEach((st, j) => {
    g.strokeStyle = ghost || (i === S.cur && j === pickStroke) ? ORANGE : INK_DARK;
    g.lineWidth = Math.max(0.6, S.width * k);
    if (f.mode === 'coil' && !st.dot) {
      const pts = coilOf(st.centres, l.R, st.closed, 48);
      g.beginPath(); pts.forEach((p, m) => m ? g.lineTo(sx(p), sy(p)) : g.moveTo(sx(p), sy(p))); g.stroke();
    } else for (const q of st.rings) { g.beginPath(); g.arc(sx(q.c), sy(q.c), q.r * k, q.a0, q.a1); g.stroke(); }
  });
  g.restore();
}
// The run as it goes (NOLAN's): red where the brush paints, light blue in the air.
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
let undoStack = [], redoStack = [];
const snapshot = () => JSON.stringify({ figs: S.figs, cur: S.cur, tpl: S.tpl, pickStroke });
function undoPush() { undoStack.push(snapshot()); if (undoStack.length > 200) undoStack.shift(); redoStack = []; }
function restore(js) { const o = JSON.parse(js); S.figs = o.figs.map(letterIn); S.cur = o.cur; S.tpl = letterIn(o.tpl); pickStroke = o.pickStroke ?? -1; fixCur(); settle(); }
function undo() { if (!undoStack.length) return; redoStack.push(snapshot()); restore(undoStack.pop()); }
function redo() { if (!redoStack.length) return; undoStack.push(snapshot()); restore(redoStack.pop()); }

// ---------- the mouse ----------
// T: the letter picked in the strip, pressed on the canvas at its baseline's
// left end and dragged up to its height (the task: "like Circle: press at
// the centre, drag to the radius"); Select: a click picks a letter, a drag
// moves it, a double-click picks its stroke; off every letter, the whole
// letter again (Esc stays STOP).
let drag = null;
cv.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  const p = toCanvas(e);
  if (S.tool === 'type' && GLYPHS) {
    drag = { mode: 'type', p, H: 0, f: { ...S.tpl, ch: S.glyph, strokes: [], x: p[0], base: p[1], H: 0 } };
    cv.setPointerCapture(e.pointerId); stage.classList.add('drag'); return;
  }
  const f = figAt(p);
  if (f < 0) { if (S.cur >= 0 || pickStroke >= 0) { S.cur = -1; pickStroke = -1; settle(); } return; }
  if (f !== S.cur) { S.cur = f; pickStroke = -1; settle(); }
  else if (pickStroke >= 0) { const j = strokeAt(letterNow(S.figs[f]), p); if (j >= 0 && j !== pickStroke) { pickStroke = j; showPanel(); kick(); } }
  undoPush();
  drag = { mode: 'move', x: e.clientX, y: e.clientY, moved: false };
  cv.setPointerCapture(e.pointerId); stage.classList.add('drag');
});
cv.addEventListener('dblclick', e => {
  const p = toCanvas(e), f = figAt(p);
  if (f < 0) return;
  S.cur = f; pickStroke = strokeAt(letterNow(S.figs[f]), p); showPanel(); kick();
});
cv.addEventListener('pointermove', e => {
  if (!drag) { const p = toCanvas(e); cv.style.cursor = S.tool === 'type' ? 'crosshair' : figAt(p) >= 0 ? 'move' : ''; return; }
  if (drag.mode === 'type') {
    const q = toCanvas(e); drag.H = Math.max(0, drag.p[1] - q[1]); drag.f.H = drag.H; busy = true;
    $('#hint').textContent = `${drag.f.ch}: ${fmt(drag.H, 0)} mm tall, weight ${fmt(weightOf(drag.f), 1)} mm${drag.H < H_MIN ? ` — at least ${H_MIN} mm` : ''}`;
    kick(); return;
  }
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (!drag.moved && Math.hypot(dx, dy) < 2) return;
  drag.x = e.clientX; drag.y = e.clientY; drag.moved = true; busy = true;
  const f = S.figs[S.cur]; f.x += dx / k; f.base += dy / k;
  showFields(); kick();
});
cv.addEventListener('pointerup', () => {
  if (!drag) return;
  const d = drag; drag = null; stage.classList.remove('drag');
  if (d.mode === 'type') {
    if (d.H >= H_MIN) { undoPush(); S.figs.push({ ...d.f, x: Math.round(d.f.x), base: Math.round(d.f.base), H: Math.round(d.H) }); S.cur = S.figs.length - 1; pickStroke = -1; }
    $('#hint').textContent = hintNow(); settle(); return;
  }
  if (!d.moved) undoStack.pop();
  else { const f = S.figs[S.cur]; f.x = Math.round(f.x); f.base = Math.round(f.base); }
  settle();
});
// the wheel: the picked letter taller or shorter, its baseline and left edge where they are
let wheelT = 0;
cv.addEventListener('wheel', e => {
  const f = S.figs[S.cur]; if (!f) return;
  e.preventDefault();
  if (!busy) undoPush();
  busy = true; f.H = Math.max(H_MIN, Math.round(f.H * Math.exp(-e.deltaY * 0.001)));
  showFields(); kick();
  clearTimeout(wheelT); wheelT = setTimeout(settle, 250);
}, { passive: false });
// ⌘C ⌘V: the picked letter copied, pasted beside it — its outline touching
// the picked one's (rings.js, nextX) — and picked, so ⌘V again lays the next.
let CLIP = null;
function copyFig() { if (S.figs[S.cur]) CLIP = JSON.stringify(S.figs[S.cur]); }
function pasteFig() {
  if (!CLIP || !GLYPHS) return;
  undoPush();
  const f = letterIn(JSON.parse(CLIP)), prev = S.figs[S.cur];
  if (prev) {                                                                       // on the picked one's baseline, its height, beside it
    f.base = prev.base; f.H = prev.H;
    f.x = Math.round(nextX(letterNow(prev), GLYPHS[f.ch], { x: 0, base: f.base, H: f.H, R: weightOf(f), step: f.step, ramp: 0, min: S.width, strokes: f.strokes }, 0));
  }
  S.figs.push(f); S.cur = S.figs.length - 1; pickStroke = -1; settle();
}
function moveFig(ddx, ddy) { const f = S.figs[S.cur]; if (!f) return; undoPush(); f.x += ddx; f.base += ddy; settle(); }
function deleteFig() {
  if (!S.figs[S.cur]) return;
  undoPush(); S.figs.splice(S.cur, 1); S.cur = -1; pickStroke = -1; settle();
}
function clearAll() { if (!S.figs.length) return; undoPush(); S.figs = []; S.cur = -1; pickStroke = -1; settle(); }

// ---------- the tools, the strip ----------
const HINTS = {
  select: 'Select — click a letter to pick it, drag it to move it; double-click it for its strokes, a stroke its own Step; the wheel sizes it; ⌘C ⌘V lays a copy beside it; the arrows move it.',
  type: 'Type — pick a letter in the strip, press on the canvas at its baseline and drag up to its height; the panel\'s Weight and Step go with it.',
};
const hintNow = () => HINTS[S.tool];
function setTool(t) { S.tool = t; syncTools(); save(); layout(); }
function syncTools() {
  document.querySelectorAll('.tool[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === S.tool));
  stage.className = 'stage t-' + S.tool;
  $('#glyphs').hidden = S.tool !== 'type';
  $('#glyphs').querySelectorAll('[data-g]').forEach(b => b.classList.toggle('on', b.dataset.g === S.glyph));
  $('#hint').textContent = hintNow();
}
$('#glyphs').innerHTML = ORDER.map(c => `<button data-g="${c}" title="${c}">${c}</button>`).join('');
$('#glyphs').onclick = e => { const b = e.target.closest('[data-g]'); if (!b) return; S.glyph = b.dataset.g; syncTools(); save(); };
document.querySelectorAll('.tool[data-tool]').forEach(b => b.onclick = () => setTool(b.dataset.tool));
$('#btnUndo').onclick = undo; $('#btnRedo').onclick = redo;
$('#btnDel').onclick = deleteFig; $('#btnClear').onclick = clearAll;
addEventListener('keydown', e => {
  if (e.key === 'Escape') post('/run/stop');                                         // Esc = STOP, as on Test and NOLAN
  if (e.target.matches('input,select,textarea')) return;
  const cmd = e.metaKey || e.ctrlKey;
  if (cmd && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (cmd && ['c', 'v', 'x'].includes(e.key.toLowerCase()) && !getSelection().toString()) {
    e.preventDefault(); const c = e.key.toLowerCase();
    if (c === 'c') copyFig(); else if (c === 'v') pasteFig(); else { copyFig(); deleteFig(); }
    return;
  }
  if (cmd) return;
  const arrow = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
  if (arrow) { e.preventDefault(); const d = e.shiftKey ? 10 : 1; moveFig(arrow[0] * d, arrow[1] * d); return; }
  if (e.key.toLowerCase() === 'v') setTool('select');
  else if (e.key.toLowerCase() === 't') setTool('type');
  else if (e.key === 'Backspace' || e.key === 'Delete') deleteFig();
});

// ---------- the panel ----------
// The letter: Weight, Step (a picked stroke's own Step); RINGS · COIL; its
// Height and place. The brush: Row width — no Step under it — Brush on,
// Between rows, Tail. The canvas from home, as NOLAN's.
const LETTER_SL = [['R', 'Weight', 'mm', 0.5, 2, 80], ['step', 'Step', 'mm', 0.1, 1, 40]];
const RUN_SL = [['width', 'Row width', 'mm', 0.5, 1, 12], ['speed', 'Brush on', 'mm/s', 1, 5, SPEED_MAX], ['travel', 'Between rows', 'mm/s', 5, 20, SPEED_MAX], ['tail', 'Tail', 'mm', 0.05, TAIL_MIN, TAIL_MAX]];
const LETTER_FIELDS = [['H', 'Height', 'mm', 1, 'The picked letter\'s height, baseline to capline; the wheel too'], ['up', 'X ↑', 'mm', 1, 'The picked letter\'s baseline, mm up from the canvas\'s centre; the arrows too'], ['x', 'Y →', 'mm', 1, 'The picked letter\'s left edge, mm right of the canvas\'s centre; the arrows too']];
// what a letter slider moves: the picked stroke's own Step, else the letter (or the next one)
const stepOwner = () => { const f = S.figs[S.cur]; return f && pickStroke >= 0 ? (f.strokes[pickStroke] ||= {}) : null; };
function sliders(box, list, get, set) {
  box.innerHTML = list.map(([key, label, , step, min, max]) => `<label class="sl"><span class="slh"><span>${label}</span><span class="val" data-v="${key}"></span></span><input class="slider" type="range" data-k="${key}" min="${min}" max="${max}" step="${step}"></label>`).join('');
  box.querySelectorAll('input').forEach(inp => {
    inp.oninput = () => { if (!busy) undoPush(); busy = true; set(inp.dataset.k, +inp.value); showPanel(); kick(); };
    inp.onchange = () => settle();
  });
}
sliders($('#slLetter'), LETTER_SL, key => key === 'step' && stepOwner() ? stepOwner().step ?? figNow().step : figNow()[key],
  (key, v) => { if (key === 'step' && stepOwner()) stepOwner().step = v; else figNow()[key] = v; });
sliders($('#slRun'), RUN_SL, key => S[key], (key, v) => { S[key] = v; });
$('#letterFields').innerHTML = LETTER_FIELDS.map(([key, label, unit, step, title]) => `<label title="${title}">${label} <input data-k="${key}" type="number" step="${step}"><em>${unit}</em></label>`).join('');
$('#letterFields').querySelectorAll('input').forEach(inp => {
  inp.oninput = () => {
    const f = S.figs[S.cur], v = +inp.value, key = inp.dataset.k;
    if (!f || inp.value === '' || !Number.isFinite(v) || (key === 'H' && v < H_MIN)) return;
    if (!busy) undoPush();
    busy = true; if (key === 'up') f.base = -v; else f[key] = v; kick();
  };
  inp.onchange = () => settle();
});
$('#fields').innerHTML = FIELDS.map(([key, label, unit, step, title, any]) => `<label title="${title}">${label} <input data-k="${key}" type="number" step="${step}"${any ? '' : ` min="${step}"`}><em>${unit}</em></label>`).join('');
$('#fields').querySelectorAll('input').forEach(inp => inp.onchange = () => {
  const v = +inp.value, any = FIELDS.find(f => f[0] === inp.dataset.k)[5];
  if (inp.value !== '' && Number.isFinite(v) && (any || v > 0)) { S[inp.dataset.k] = v; setCanvas(S); }   // the canvas: one base for every tab (canvas.js)
  settle();
});
document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { undoPush(); figNow().mode = b.dataset.mode; settle(); });
$('#btnOwnStep').onclick = () => { const f = S.figs[S.cur]; if (!f || pickStroke < 0) return; undoPush(); f.strokes[pickStroke] = {}; settle(); };
$('#btnLetter').onclick = () => { pickStroke = -1; showPanel(); kick(); };
$('#planInfo').onclick = () => { $('#planRead').hidden = !$('#planRead').hidden; $('#planInfo').classList.toggle('on', !$('#planRead').hidden); };
$('#ink').onchange = e => { S.ink = e.target.checked; settle(); };
$('#inkOff').onclick = () => { S.ink = false; settle(); };
$('#inkOn').onclick = () => { S.ink = true; settle(); };
function showFields() {
  const f = S.figs[S.cur];
  $('#letterFields').hidden = !f;
  if (f) $('#letterFields').querySelectorAll('input').forEach(inp => { if (document.activeElement !== inp) inp.value = inp.dataset.k === 'up' ? -f.base : f[inp.dataset.k]; });
}
function showPanel() {
  const f = figNow(), own = stepOwner(), l = S.figs[S.cur] && letterNow(S.figs[S.cur]);
  const val = { R: f.R, step: own?.step ?? f.step };
  for (const [key, , unit] of LETTER_SL) {
    const inp = $(`#slLetter input[data-k="${key}"]`); if (document.activeElement !== inp) inp.value = val[key];
    const held = key === 'R' && f.R > R_SHARE * f.H ? ` · held at ${fmt(R_SHARE * f.H, 1)}` : key === 'step' && val.step < S.width ? ` · held at the row width, ${S.width}` : '';
    $(`#slLetter [data-v="${key}"]`).textContent = `${fmt(val[key], 1)} ${unit}${held}${key === 'step' && own && own.step === undefined ? ' · the letter\'s' : ''}`;
  }
  for (const [key, , unit] of RUN_SL) {
    const inp = $(`#slRun input[data-k="${key}"]`); if (document.activeElement !== inp) inp.value = S[key];
    $(`#slRun [data-v="${key}"]`).textContent = `${Math.round(S[key] * 100) / 100} ${unit}`;
  }
  const circles = l ? l.strokes.reduce((a, st) => a + st.rings.length, 0) : 0;
  $('#letterHead').textContent = !S.figs[S.cur] ? `Next letter: ${S.glyph}` : pickStroke >= 0 ? `Letter ${f.ch} · stroke ${pickStroke + 1} of ${l?.strokes.length ?? 0} · its own Step` : `Letter ${f.ch} · ${l?.strokes.length ?? 0} strokes · ${circles} circles`;
  $('#strokeKeys').hidden = pickStroke < 0;
  document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('on', b.dataset.mode === f.mode));
  showFields();
  $('#fields').querySelectorAll('input').forEach(inp => { if (document.activeElement !== inp) inp.value = S[inp.dataset.k]; });
  $('#ink').checked = S.ink; $('#inkOff').classList.toggle('on', !S.ink); $('#inkOn').classList.toggle('on', S.ink);
}
// Settled: the mouse let go, a slider let go — the plan, the reading, the LCD.
function settle() {
  busy = false;
  const P_ = plan(), C = cup(), here = hereNow(), est = key => C.est?.[key] ? ' (est.)' : '';
  const many = S.figs.flatMap(f => { const l = letterNow(f); return l ? l.strokes.map((st, j) => [f.ch, j, st.rings.length]) : []; }).filter(q => q[2] > CIRCLES_MAX);
  $('#planRead').innerHTML = (!S.figs.length ? 'No letter: pick one in the strip with T and drag it up on the canvas.' :
    `<b>${S.figs.length}</b> letter${S.figs.length === 1 ? '' : 's'}, <b>${P_.circles}</b> circles, ${P_.pieces} rows · `
    + (S.ink ? `<b>Ink ON</b>: a dip, then rings on what the brush holds up to ${DIP_RUN} mm (est.), a ring never split, ${P_.dips} dips; the elbow over the rim +${C.rim}°${est('rim')}, in the cup ${C.dip > 0 ? '+' : ''}${C.dip}°${est('dip')}, ${C.dwell} s in the paint · ` : 'the paint on the canvas · ')
    + `${fmt(P_.length / 1000, 2)} m with the brush down, at ${S.speed} mm/s · ≈ ${fmt(P_.seconds / 60, 1)} min (est.) · every ring on ${LOOP_SHARE * 100} % over its start`)
    + ` · The canvas from home: its bottom left corner at carriage <b>X ${fmt(here.x - S.boardH / 2, 1)} · Y ${fmt(here.y - S.boardW / 2, 1)} mm</b>; TEST's dots ${TEST_MARGIN} mm in from its edges.`;
  const warn = [S.ink ? cupProblem(C) : '', P_.fault && `The plan is wrong, PLAY will not run it: ${P_.fault}.`, offCanvas(), walls(),
    many.length && `${many.map(([c, j, n]) => `${c}'s stroke ${j + 1}: ${n} circles`).join(', ')} — more than ${CIRCLES_MAX}: a longer Step paints it faster.`].filter(Boolean);
  $('#planWarn').innerHTML = warn.map(w => `<span class="warn">${w}</span>`).join(' ');
  $('#planWarn').hidden = !warn.length;
  $('#stats').textContent = !S.figs.length ? 'no letters' : `${P_.circles} circles · ${fmt(P_.length / 1000, 1)} m of line · ≈ ${fmt(P_.seconds / 60, 1)} min (est.) · ${P_.blocks.length} steps`;
  showPanel(); save(); layout(); lastLcd && lcd(lastLcd);
}
// letters past the canvas's edges (the task: "warn if a letter's circles go outside the canvas")
function offCanvas() {
  const hw = S.boardW / 2, hh = S.boardH / 2, out = [];
  S.figs.forEach(f => {
    const l = letterNow(f); if (!l) return;
    const off = l.strokes.some(st => st.rings.some(q => q.c[0] - q.r < -hw || q.c[0] + q.r > hw || q.c[1] - q.r < -hh || q.c[1] + q.r > hh));
    if (off) out.push(f.ch);
  });
  return out.length ? `${out.join(', ')}: past the canvas's edge — the rings go on the board under it.` : '';
}
function walls() {
  const h = hereNow(), P_ = PLAN;
  if (!P_?.carriage || !P_.rows.length) return '';
  const R = reach(), b = P_.carriage, x0 = h.x + b.x0, x1 = h.x + b.x1, y0 = h.y + b.y0, y1 = h.y + b.y1;
  const out = [x0 < R.x.min && `${fmt(R.x.min - x0, 0)} mm past the bottom wall`, x1 > R.x.max && `${fmt(x1 - R.x.max, 0)} mm past the top wall`,
    y0 < R.y.min && `${fmt(R.y.min - y0, 0)} mm past the left wall`, y1 > R.y.max && `${fmt(y1 - R.y.max, 0)} mm past the right wall`].filter(Boolean);
  return out.length ? `The brush would go ${out.join(', ')}: move the canvas or the letters.` : '';
}

// ---------- the reference: tracing paper over the canvas (NOLAN's) ----------
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

// ---------- 💾 SAVE NEW YURI ----------
// As SAVE NOLAN: an SVG of the canvas in mm, the rings in it, the whole state
// in its metadata, a PNG preview; on the tests' shelf, its label NEW YURI —
// the Library opens it here.
const label = () => `NEW YURI · ${S.figs.map(f => f.ch).join('') || 'no letters'} · ${S.boardW} × ${S.boardH} mm${S.ink ? ' · ink' : ''}`;
function svgOf() {
  const W = S.boardW, H = S.boardH, f = v => (Math.round(v * 100) / 100).toFixed(2);
  const meta = JSON.stringify({ rembrandt: '1.0.1', newyuri: true, label: label(), settings: S }).replace(/&/g, '\\u0026').replace(/</g, '\\u003c').replace(/--/g, '- -');
  const rings = S.figs.flatMap(fg => {
    const l = letterNow(fg); if (!l) return [];
    return l.strokes.flatMap(st => fg.mode === 'coil' && !st.dot
      ? [`  <polyline points="${coilOf(st.centres, l.R, st.closed, 48).map(p => `${f(W / 2 + p[0])},${f(H / 2 + p[1])}`).join(' ')}"/>`]
      : st.rings.map(q => q.a1 - q.a0 > 2 * Math.PI - 1e-6 ? `  <circle cx="${f(W / 2 + q.c[0])}" cy="${f(H / 2 + q.c[1])}" r="${f(q.r)}"/>`
        : `  <path d="M${f(W / 2 + q.c[0] + q.r * Math.cos(q.a0))} ${f(H / 2 + q.c[1] + q.r * Math.sin(q.a0))} A${f(q.r)} ${f(q.r)} 0 0 1 ${f(W / 2 + q.c[0] + q.r * Math.cos(q.a1))} ${f(H / 2 + q.c[1] + q.r * Math.sin(q.a1))}"/>`));
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}">
<!-- Rembrandt v.1.0.1 · ${label()}; 1 unit = 1 mm -->
<metadata id="rembrandt-test">${meta}</metadata>
<rect width="${W}" height="${H}" fill="#FCFBF8" stroke="#24221F" stroke-width="0.5"/>
<g fill="none" stroke="#2A2826" stroke-width="${f(S.width)}">
${rings}
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
    if (!o?.newyuri) { $('#saveState').textContent = 'not a New Yuri save: open it on its own tab'; return; }
    undoPush();
    localStorage.setItem(KEY, JSON.stringify(o.settings)); setCanvas(o.settings); load(); Object.assign(S, canvasNow(S)); settle();   // the save's canvas becomes the base
    $('#saveState').textContent = `opened · ${file.slice(0, 13)}:${file.slice(14)}`;
  } catch { $('#saveState').textContent = 'could not open it from the Library'; }
}

// ---------- the run (NOLAN's) ----------
const post = async path => { try { const r = await fetch(path, { method: 'POST' }); return await r.text(); } catch { return 'start rembrandt.py'; } };
$('#btnDoJob').onclick = async () => {
  await loadInk(); settle();
  const P_ = plan();
  if (!P_.rows.length) { $('#runState').innerHTML = '<span class="warn">Nothing to paint.</span>'; return; }
  if (S.ink && cupProblem(cup())) { $('#runState').innerHTML = `<span class="warn">Ink ON: ${cupProblem(cup())}</span>`; return; }
  if (walls()) { $('#runState').innerHTML = `<span class="warn">${walls()}</span>`; return; }
  if (P_.fault) { $('#runState').innerHTML = `<span class="warn">Not run: the plan is wrong — ${P_.fault}.</span>`; return; }
  if (!confirm(`${S.figs.map(f => f.ch).join('')}: ${P_.circles} circles, ${P_.pieces} rows will be run on the machine${S.ink ? `, ${P_.dips} dips in the cup` : ''}, ≈ ${fmt(P_.seconds / 60, 0)} min (est.)`)) return;
  try {
    RUN = P_.blocks; RUN_INFO = { seconds: P_.seconds, rows: P_.rows };
    const r = await fetch('/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blocks: P_.blocks,
      log: { page: 'newyuri', label: label(), settings: S, here: hereNow(), ...(S.ink ? { cup: cup() } : {}), estimate_s: Math.round(P_.seconds) } }) });   // the run journal, rembrandt.py
    $('#runState').textContent = await r.text();
  } catch { $('#runState').textContent = 'start rembrandt.py'; }
};
// TEST, before PLAY (NOLAN's): one dip in the cup, a dot 20 mm in from each corner of the board, and home.
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
  try {
    RUN = T.blocks; RUN_INFO = { seconds: T.seconds, rows: T.dots.map(d => ({ label: `TEST · ${d.name}` })) };
    const r = await fetch('/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blocks: T.blocks,
      log: { page: 'newyuri', label: 'NEW YURI · TEST · the corners', here, dots: T.dots.map(d => ({ name: d.name, x: +(here.x + d.at.x).toFixed(1), y: +(here.y + d.at.y).toFixed(1) })), cup: cup(), estimate_s: Math.round(T.seconds) } }) });
    $('#runState').textContent = await r.text();
  } catch { $('#runState').textContent = 'start rembrandt.py'; }
};
let paused = false;
$('#btnPause').onclick = () => post(paused ? '/run/continue' : '/run/pause');
$('#btnStop').onclick = () => post('/run/stop');
$('#btnKill').onclick = () => post('/run/kill');

// The LCD, as on NOLAN.
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
  keyEl.textContent = paused ? 'CONTINUE' : 'PAUSE'; keyEl.classList.toggle('call', paused); keyEl.disabled = !live;
  const now = waiting ? `❚❚ ${st.message}`
    : live && b?.home ? 'done · the carriage goes home, the brush off'
    : live && what && b?.dip ? `${what} · the dip in the cup`
    : live && what ? what + (st.brush_on ? ' · brush on' : ' · brush off')
    : `${P_.circles || 0} circles · ${S.figs.map(f => f.ch).join('') || 'no letters'}`;
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
load(); Object.assign(S, canvasNow(S));                                          // the canvas from the base, every tab's (canvas.js)
onCanvas(c => { Object.assign(S, c); settle(); });                               // changed in another window
syncTools(); syncRef(); loadRef();
lampSwitch($('#lamp'));
addEventListener('rembrandt-night', () => kick());
setInterval(watch, 500);
new ResizeObserver(layout).observe(stage);
settle(); watch();
fetch('glyphs.json', { cache: 'no-store' }).then(r => r.json()).then(o => { GLYPHS = o.glyphs; settle(); }).catch(() => { $('#hint').textContent = 'glyphs.json did not load: start rembrandt.py'; });
loadInk().then(settle);
addEventListener('focus', () => loadInk().then(settle));
const opening = new URLSearchParams(location.search).get('open');
if (opening) openFromLibrary(opening);
