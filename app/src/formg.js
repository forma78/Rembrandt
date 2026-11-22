// FORM-G's page: the library, the picture, OPM-N's DRAG SNAKE (formgplan.js). inka.js's run as it is on OPM-N, its question with Start from, its LCD, BACK ONE CELL, the remote and ELBOW LIVE,
// copied here so that OPM-N stays as it was; no form to draw, no palette to choose, the brush fixed (the owner, 2026-11-06).
import { STROKE_DROPS, FORMG, FORMG_LIB, OPMG_LIB, PRESS_OK, pointsOf, seqOf, passesOf, rowsOf, brushRuns, placeRange, framedPic, cleanFrame, R3, contourOf, PEN, MARKS, stripsOf, marksOf, withMarks, myJarsOf, withJars, CLASSIC, JAR_NAME } from './formgplan.js';
import { deltaE } from './canon.js';
import { GOGH_LIB, passesV, dabRunsOf, DAB_UI, dabOf, dabGapOf, dabRunOf, dabWideOf, dabOnScreen } from './goghplan.js';
import { plotRun, DEFAULTS, homeBlocks, ELBOW_HOVER, TAIL_MIN, handDip, landingCheck, handDipS } from './strokes.js';
import { reach } from './machine.js';
import { wipeBlocks, WIPE_NEW, machinePiece } from './inkaplan.js';
import { cupOf, cupProblem, dipAt, SWING_MIN, SWING_MAX, ELBOW_V_MIN, ELBOW_V_MAX, ELBOW_V_NONE } from './ink.js';
import { DOT_MM, NO_DIP, cornerDots, testSay } from './band.js';
import { testPrefs } from './prefs.js';
import { segments, sticks } from './lcd.js';
import { lampSwitch } from './lamp.js';
import { qrSvg } from './qr.js';
import './ui.js';

// OPM-G (2026-11-07): this page with its own library, app/opmg/, and its run by the canon of a long leg (canon.js); FORM-G's as it was
// LIBRARY-G (2026-11-19, data-tab="libg"; the owner: "while a picture is being painted I cannot switch between the pictures in the library at all … let us make,
// right after GEN-F, a tab LIBRARY-G, so that I can study the files in peace"): this page with FORM-G's pictures and no machine — it never asks rembrandt.py of a
// run nor sends it a thing (VIEW), so its library is free while FORM-G paints; its jars FORM-G's to start from, its own changes kept in this browser alone
// GOGH (2026-11-22, data-tab="gogh"; the owner: "in GOGH we copy FORM-G's functionality fully … the one difference: no long strokes, all of them drops of 2 cm"):
// this page with its own library, app/gogh/, made by GEN-V; every leg a dab, a run of its own on a dip of its own, nothing after it (goghplan.js, DABS)
// LIB-V (2026-11-22, the evening, data-tab="libv"; the owner: "I press APPROVE … and the picture appears in Library-V"): LIBRARY-G's for GOGH — GOGH's
// pictures to look at, while it paints or not, nothing sent (VIEW); a picture GEN-V's APPROVE 🐾 put in shown at once (BroadcastChannel rembrandt.genv)
const PAGE = document.body.dataset.tab, LIBV = PAGE === 'libv', TAB = PAGE === 'opmg' ? 'opmg' : PAGE === 'gogh' || LIBV ? 'gogh' : 'formg', CANON_RUN = TAB === 'opmg', VIEW = PAGE === 'libg' || LIBV, DABS = TAB === 'gogh';
const HOME = DABS ? 'GOGH' : 'FORM-G';   // the page a library to look at is of: its jars and its settings to start from
const NAME = CANON_RUN ? 'OPM-G' : VIEW ? (LIBV ? 'LIB-V' : 'LIBRARY-G') : DABS ? 'GOGH' : 'FORM-G', LIBRARY = [...(CANON_RUN ? OPMG_LIB : DABS ? GOGH_LIB : FORMG_LIB)];   // a copy: the local pictures go in front of it
const FORMG_KEEP = 'rembrandt.formg.v02';
const $ = s => document.querySelector(s), KEEP = CANON_RUN ? 'rembrandt.opmg.v01' : VIEW ? (LIBV ? 'rembrandt.libv.v01' : 'rembrandt.libg.v01') : DABS ? 'rembrandt.gogh.v01' : FORMG_KEEP, OPMN_KEEP = 'rembrandt.opmn.v01', LIVE = ['running', 'stopping', 'pausing', 'paused'];
const PRESS_MIN = -4, PRESS_MAX = 8, GESSO = '#FBFAF7';   // GESSO: the canvas, white (2026-11-16)   // as OPM-N's brush
const TRAVEL = 100;   // the carriage's travel with the brush up, mm/s: see where S is read
const fmt = (v, d = 1) => Number(v).toFixed(d), sgn = v => `${v >= 0 ? '+' : '−'}${fmt(Math.abs(v), 1)}°`, esc = v => String(v ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const hm = t => { const m = Math.round((t || 0) / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`; };
const S = { pic: LIBRARY[0], view: 'picture', speed: 25, penSpeed: PEN.speed, dipEvery: CANON_RUN ? FORMG.every : R3.every, dipLap: FORMG.lap, over: FORMG.over, wipe: WIPE_NEW, press: 0, travel: TRAVEL, tail: 3, place: {}, frames: {} };
const nums = o => ({ ...(Number.isFinite(o.pspeed) ? { speed: o.pspeed } : {}), ...(Number.isFinite(o.dipEvery) ? { dipEvery: o.dipEvery } : {}), ...(Number.isFinite(o.dipLap) ? { dipLap: o.dipLap } : {}), ...(Number.isFinite(o.idleOver) ? { over: o.idleOver } : {}), ...(Number.isFinite(o.wipe) ? { wipe: o.wipe } : {}), ...(Number.isFinite(o.brushPress) ? { press: o.brushPress } : {}), ...(Number.isFinite(o.travel) ? { travel: o.travel } : {}), ...(Number.isFinite(o.tail) ? { tail: o.tail } : {}) });
try {                                                                                 // a first visit: the brush as it is tuned on OPM-N
  // LIBRARY-G: the brush, the canvas's place and the frames FORM-G's as they are now, so its numbers are FORM-G's; only the picture and the view its own
  const mine = JSON.parse(localStorage.getItem(KEEP) || 'null'), base = VIEW ? JSON.parse(localStorage.getItem(LIBV ? 'rembrandt.gogh.v01' : FORMG_KEEP) || 'null') : mine;
  const opmn = base ? null : JSON.parse(localStorage.getItem(OPMN_KEEP) || 'null');
  Object.assign(S, base ?? nums(opmn ?? {}), VIEW && mine ? { ...(mine.pic ? { pic: mine.pic } : {}), ...(mine.view ? { view: mine.view } : {}) } : {});
} catch { }
const save = () => { try { localStorage.setItem(KEEP, JSON.stringify(S)); } catch { } };
// FORM-G's run as LAB's real 3 (formgplan.js, R3; the owner, 2026-11-10): a dip every 79 mm, not 95, once, where Dip every was still the old 95; the J3 compensation and no
// slack on the machine's path. OPM-G's run as it was, by the canon
const R3RUN = CANON_RUN ? {} : { slack: R3.slack, j3: R3.j3, ...(DABS ? { brush: dabRunsOf } : {}) };   // GOGH's: its dabs in brushRuns' place, the J3 on them
if (!CANON_RUN && !S.r3) { if (S.dipEvery === FORMG.every) S.dipEvery = R3.every; S.r3 = 1; save(); }
if (!Number.isFinite(S.penSpeed)) S.penSpeed = PEN.speed;
if (S.view === 'contour' && !document.querySelector('[data-view="contour"]')) S.view = 'picture';   // DRAW BW and its Contour view gone from FORM-G (2026-11-16)
// the carriage's travel, the brush up (the owner, 2026-11-10, the X belt slipped "with a crack" several times and the headlights came out in the canvas's middle:
// the run's first move, home to the top of a 70 × 100, ~830 mm at the 180 mm/s FORM-G had taken from OPM-N, the jar on the carriage; "we must lower it"):
// TRAVEL, the firmware's own default, once in place of the old 180 (OPM-G's too: the same carriage, the same jar); FORM-G's field of its own since (Travel,
// mm/s), the legs' Speed untouched (est.)
if (!S.travelV) { if (!(S.travel < 180)) S.travel = TRAVEL; S.travelV = 1; save(); }
// GOGH's sliders (goghplan.js, DAB_UI; the owner, 2026-11-22): the gap and the run its plan's, the width its screen's, a brush's own (est.)
// the gap a brush's own since 2026-11-22, the evening, as the width (the 2 mm's −0.2, the owner's): one gap before it, kept for the 3 and the 5 it was set on
if (DABS) {
  S.dabRun = dabRunOf(S.dabRun); S.dabWide = S.dabWide && typeof S.dabWide === 'object' ? S.dabWide : {}; S.dabGaps = S.dabGaps && typeof S.dabGaps === 'object' ? S.dabGaps : {};
  if (typeof S.dabGap === 'number') { S.dabGaps = { 3: S.dabGap, 5: S.dabGap, ...S.dabGaps }; delete S.dabGap; }
}
// a brush's own in this browser first, else the picture's look as GEN-V approved it (genvpic.py's `look`, 2026-11-22: the bear's width 2.3), else the brush's
const dabWide = () => dabWideOf(S.dabWide?.[PIC?.pitch] ?? PIC?.look?.wide, PIC?.pitch), dabGap = () => dabGapOf(S.dabGaps?.[PIC?.pitch] ?? PIC?.look?.gap, PIC?.pitch);
S.frames = Object.fromEntries(Object.entries(S.frames ?? {}).map(([k, f]) => [k, cleanFrame(f)]).filter(([, f]) => f));

// ---------- the library ----------
const LIB = {}, IMG = {};
let PIC = null, SEQ = [];
// THE JARS, the owner's 🔄 (2026-11-17; formgplan.js, withJars): app/formg/jars.json, rembrandt.py's /jars — { swaps: { pic: { jarId: { name, hex } } }, mine: { 'Jar 49': hex } };
// his jars COLORS' numbers, the red classic's plans (CLASSIC), and the ones he mixed since. FORM-G's and GOGH's (the same jars on the same shelf, every
// picture its own swaps in the one file)
const JARS_ON = TAB === 'formg' || DABS;
let JARS = { swaps: {}, mine: {} }, CLASSIC_PLANS = [];
// a picture as it is run: in its frame, F, when one is laid (formgplan.js's framedPic); the plan's and the run's keys by it, so the card's (i) keeps the whole picture's numbers
const picNow = id => framedPic(withJars(LIB[id], JARS.swaps[id]), S.frames[id]);
const pk = () => `${PIC.id}${PIC.jarsKey ? `|${PIC.jarsKey}` : ''}${PIC.frame ? `|${PIC.frame.x0},${PIC.frame.y0},${PIC.frame.x1},${PIC.frame.y1}` : ''}`;   // a picture's swapped jars its own plans (withJars)
const jarOf = id => SEQ.find(j => j.id === id);
const opts0 = () => ({ ...DEFAULTS, speed: S.speed, travel: S.travel, tail: S.tail, lift: true, ink: true, snake: true, pause: false, cup: dipCup(), hover: ELBOW_HOVER, press: S.press, noDipUnder: 0 });
// where the canvas may lie: from plotRun's carriage, the path not yet pressed into a wall
const RANGE = new Map();
function rangeOf() {
  const key = JSON.stringify([S.speed, S.tail, S.dipEvery, S.dipLap, S.over, S.press, DABS ? [dabGap(), S.dabRun] : 0]), had = RANGE.get(pk());
  if (had?.key === key) return had;
  const P = plan(), R = rowsOf(PIC, P, S.dipEvery, S.dipLap, CANON_RUN, R3RUN), r = plotRun({ ...opts0(), rows: R.ps.length }, R.groups.map(g => ({ key: 'DRAG', ps: g.map(i => R.ps[i]), why: null })));
  const out = { key, ...placeRange(PIC, r.carriage, reach()) };
  RANGE.set(pk(), out);
  return out;
}
const nearZero = ([lo, hi]) => lo > hi ? Math.round((lo + hi) / 2) : Math.round(Math.min(hi - Math.min(1, (hi - lo) / 2), Math.max(lo + Math.min(1, (hi - lo) / 2), 0)));
function placeNow() {
  // a picture with no room but its PRESS_OK: at first the canvas as high as the top wall lets it, so only the bottom is pressed (2026-11-16, the Targa)
  if (!S.place[PIC.id]) { const r = rangeOf(), low = r.bottom[0] > r.bottom[1] && PRESS_OK[PIC.id]; S.place[PIC.id] = { edgeLeft: nearZero(r.left), edgeBottom: low ? Math.floor(r.bottom[1]) : nearZero(r.bottom) }; save(); }
  return S.place[PIC.id];
}
const hereNow = () => { const R = reach(), c = placeNow(); return { x: R.x.min + c.edgeBottom + PIC.h / 2, y: R.y.min + c.edgeLeft + PIC.w / 2 }; };
// the frame's own canvas, from home: the picture's place and the frame's corner in it
const frameSize = () => `${fmt(PIC.frame.x1 - PIC.frame.x0, 0)} × ${fmt(PIC.frame.y1 - PIC.frame.y0, 0)}`;
const frameHome = () => ({ left: Math.round(placeNow().edgeLeft + PIC.frame.x0), bottom: Math.round(placeNow().edgeBottom + PIC.frame.y0) });

// MARKS (formgplan.js, the owner, 2026-11-11): every line's marks at the middles of the canvas's edges, where the brush reaches at the canvas's place; FORM-G's whole
// picture only — none in a frame (its own small canvas), none on OPM-G. S.marks: the switch, on at first
const MARKSNOW = new Map();
function marksNow() {
  if (CANON_RUN || !PIC || PIC.frame || S.marks === false) return null;
  const W = reach(), c = placeNow(), key = JSON.stringify([pk(), c, SEQ.length]);
  if (!MARKSNOW.has(key)) {
    const on = { x0: Math.max(0, -c.edgeLeft), x1: Math.min(PIC.w, W.y.max - W.y.min - c.edgeLeft), y0: Math.max(0, -c.edgeBottom), y1: Math.min(PIC.h, W.x.max - W.x.min - c.edgeBottom) };
    const n = SEQ.filter(j => j.coat !== 2 && !j.last).length, st = stripsOf(PIC, on, n);   // a jar `last` no cell (markCellsOf)
    if (MARKSNOW.size > 6) MARKSNOW.clear();
    MARKSNOW.set(key, { ...st, n, M: marksOf(SEQ, st) });
  }
  return MARKSNOW.get(key);
}
const sideSay = q => `${q.no} ${q.side}`;

// ---------- the run, as OPM-N's paintRun ----------
let INK = {};
async function loadInk() { try { const r = await fetch('/ink', { cache: 'no-store' }); INK = r.ok ? await r.json() : {}; } catch { INK = {}; } }
const cup = () => cupOf(INK);
const dipCup = () => { const c = cup(), d = dipAt(c); return d ? { ...c, x: d.x, y: d.y } : c; };
const cupName = () => cup().hand ? 'the cup at hand (INK-Y)' : 'the cup of the Ink tab';
const runOpts = rows => ({ ...opts0(), rows, here: hereNow(), noDipUnder: NO_DIP });
const EMPTY = { blocks: [], rows: [], seconds: 0, mm: 0, dips: 0, passes: [], fault: '' };
const PLAN = new Map(), RUNS = new Map();
// FORM-G's areas (formgplan.js, joinedCells; the owner, 2026-11-17, the evening): a zone's touching cells one area, a strokes jar's big ones too ('all', his "yes");
// written in the journal's DRAG (`join`), so FROM THE BREAK makes a run of before it again as it ran, its cells one by one
let JOIN_RUN = 'all', STROKE_RUN = STROKE_DROPS;   // and a long stroke's drops (formgplan.js, STROKE_DROPS, 2026-11-17's evening), the journal's `strokeDrops`
function plan() {                                                                     // the list's colours
  const key = JSON.stringify([S.over, S.dipLap, CANON_RUN ? S.dipEvery : 0, JOIN_RUN, STROKE_RUN, DABS ? [dabGap(), S.dabRun] : 0]);
  if (PLAN.get(pk())?.key !== key) PLAN.set(pk(), { key, passes: DABS ? passesV(PIC, { gap: dabGap(), run: S.dabRun }) : passesOf(PIC, { over: S.over, lap: S.dipLap, ...(CANON_RUN ? { canon: true, every: S.dipEvery } : { join: JOIN_RUN, strokeDrops: STROKE_RUN }) }) });
  return PLAN.get(pk()).passes;
}
// the run from a line of the list on; the pause before the second layer's first says what it is
function paintRun(from = 0) {
  if (!PIC) return EMPTY;
  const mk = marksNow(), key = JSON.stringify([pk(), S.speed, S.travel, S.tail, S.wipe, S.press, S.dipEvery, S.dipLap, S.over, hereNow(), dipCup(), from, mk ? mk.strips.map(q => q.no) : 0, JOIN_RUN, STROKE_RUN, DABS ? [dabGap(), S.dabRun] : 0]);
  if (RUNS.has(key)) return RUNS.get(key);
  const passes = plan().slice(from);
  if (!passes.length) return EMPTY;
  const R = rowsOf(PIC, passes, S.dipEvery, S.dipLap, CANON_RUN, { ...R3RUN, marks: mk?.M }), name = id => jarOf(id)?.name ?? id;
  const r = plotRun({ ...runOpts(R.ps.length), press: S.press, noDipUnder: 0 }, R.groups.map((g, k) => ({ key: 'DRAG', ps: g.map(i => R.ps[i]), why: !k ? null : passes[k].layer === 2 && passes[k - 1].layer === 1 ? `the first layer is done: let it dry. Then wipe the brush, put ${name(passes[k].pencil)} in the cup, Continue` : passes[k].layer === 1 && passes[k - 1].layer === 0 ? `the layer under is done: let it dry. Then wipe the brush, put ${name(passes[k].pencil)} in the cup, Continue` : `wipe the brush, put ${name(passes[k].pencil)} in the cup, then Continue` })));
  const n = plan().length, rows = from ? R.info.map(q => ({ ...q, label: q.label.replace(/^(\d+)\/\d+ · /, (_, k) => `${from + +k}/${n} · `) })) : R.info;   // a line's number in the whole list, a run from a later line too
  const out = { key, ...r, blocks: wipeBlocks(r.blocks, S.wipe), rows, lifts: R.lifts, mm: passes.reduce((a, q) => a + q.mm, 0), passes };
  if (RUNS.size > 6) RUNS.clear();
  RUNS.set(key, out);
  return out;
}
// plotRun presses a path past a wall into it, which here would change the picture (the owner's rule on the brush: "never silently"): such a run is not run
// — but for a picture in PRESS_OK, at the bottom wall alone, so many mm at most past it, its lowest legs' lift-outs pressed (said on the page, written in the
// journal). The owner, 2026-11-10, of the red classic at his calibrated place for the 70 × 100 canvas, left edge −60, bottom edge −68 ("the canon for the
// 70 × 100 canvas"; the pen found the canvas's centre, FORM-G/IMG_2643.jpg): asked whether to shorten the car, move it, or let the carriage press against the
// wall — "Yes", the last. There the carriage would go about 6 mm past the bottom wall, the stop 9.45 mm past it: the lift-outs of the rear bumper's tips and
// the diffuser pressed — the tip mostly off the canvas by then, the lift's last few mm of slide in the white under the car; a landing from below may lose ~2 mm
// of its touch (est.); no leg gone. (plotRun has pressed every path since 2026-10-03, the owner: "remove this restriction".)
// PRESS_OK: formgplan.js's, the tests' too (2026-11-16)
function pressOk() {
  const lim = PRESS_OK[PIC?.id];
  if (!lim || PIC.frame) return 0;
  const rg = rangeOf(), c = placeNow(), low = rg.bottom[0] - c.edgeBottom;
  return c.edgeLeft >= rg.left[0] && c.edgeLeft <= rg.left[1] && c.edgeBottom <= rg.bottom[1] && low > 0 && low <= lim ? low : 0;
}
function walls(P_) {
  if (!P_) return '';
  if (P_.gone) return `The brush would go ${fmt(P_.pastWall, 0)} mm past the walls, ${P_.gone} legs gone: move the canvas (The canvas, its i).`;
  return P_.pastWall > 0.05 && !pressOk() ? `The brush would go ${fmt(P_.pastWall, P_.pastWall < 1 ? 1 : 0)} mm past the walls: move the canvas (The canvas, its i).` : '';
}
// DRAW BW (the owner, 2026-11-10: "before working with the paints, a DRAW BW key as in OPM-N: I just put a pen in the brush's place and first trace on paper, the contour,
// to centre the canvas and study all the details"): formgplan.js's contourOf, every border between two colours once, in one pen, as OPM-N's DRAW BW: the pen pressed on
// its lines, the carriage on them, up between them; once, over the first line's start, the holder down and a p-pause, the pen in with its tip on the paper (rembrandt.py's
// p-pause: nothing lifted). No dip, no jar, no wipe. With the cup at hand the elbow up into its fork and the shoulder to 0 first, as every run of the brush
// S.bw: 'outline', the picture's outline alone, to lay the canvas by — the default (the owner, the same evening: "to centre it the Porsche's contour without the lines inside
// is enough"); 'all', every border between two colours, to study the picture
const CONTOURS = new Map(), PENRUNS = new Map(), BW_KINDS = { outline: 'The outline alone', all: 'Every border between two colours' };
const bwKind = k => (k ?? S.bw) === 'all' ? 'all' : 'outline';
const contour = k => { const key = `${pk()}|${bwKind(k)}`; return CONTOURS.get(key) ?? CONTOURS.set(key, contourOf(PIC, { outline: bwKind(k) === 'outline' })).get(key); };
const penAt = () => ({ press: S.press, glide: S.press + PEN.air, in: S.press + PEN.in });
function penRun(k) {
  if (!PIC) return EMPTY;
  const c = dipCup(), key = JSON.stringify([pk(), bwKind(k), S.press, S.penSpeed, S.travel, hereNow(), !!c.hand]);
  if (PENRUNS.has(key)) return PENRUNS.get(key);
  const C = contour(k), o = { cw: PIC.w, ch: PIC.h }, at = penAt();
  if (!C.lines.length) return EMPTY;
  const ps = C.lines.map((l, i) => l.slice(1).map((b, j) => ({ ...machinePiece({ t: 'L', a: l[j], b }, o), tilt: 0, row: i + 1 })));
  const r = plotRun({ ...DEFAULTS, speed: S.penSpeed, travel: S.travel, tail: TAIL_MIN, lift: true, ink: false, snake: false, pause: false, minPiece: 0.005, pencil: { press: at.press, glide: at.glide }, hover: at.glide, here: hereNow(), rows: ps.length }, [{ key: 'DRAW', ps, why: null }]);
  const H = c.hand ? handDip(c, 0) : null, blocks = H ? [{ ...H[0], dip: false }, { ...H[5], dip: false }, ...r.blocks.slice(1)] : r.blocks.slice();
  const first = blocks.findIndex(b => b.kind === 'move' && b.row === 1 && /^T /.test(b.cmds[0]));   // over the first line's start: down, the pen in
  if (first >= 0) blocks.splice(first + 1, 0, { kind: 'arm', cmd: `J 2 ${at.in}`, row: 1 }, { kind: 'p-pause', why: `DRAW BW: the brush out, the pen in the holder, its tip on the paper; then Continue`, row: 1 });
  const out = { key, ...r, blocks, rows: C.lines.map((l, i) => ({ label: `DRAW BW · ${bwKind(k) === 'outline' ? 'the outline · ' : ''}line ${i + 1} of ${C.lines.length}`, cells: [] })), mm: C.mm, lines: C.lines.length, kind: bwKind(k), passes: [] };
  if (PENRUNS.size > 4) PENRUNS.clear();
  PENRUNS.set(key, out);
  return out;
}
let warnAt = 0;   // a warning stays WARN_S before the next look at the run writes over it
const WARN_S = 5, warn = t => { warnAt = Date.now(); $('#runState').innerHTML = `<span class="warn">${t}</span>`; };
let RUN = null, RUN_INFO = null, RUN_KEY = null, lastSt = null;
async function start(key, blocks, info, log) {
  if (VIEW) return;                                                                   // LIBRARY-G sends the machine nothing
  playStop();
  if (blocks.some(b => b.fork)) {                                                     // only a rembrandt.py that knows the cup at hand takes its forks (inka.js's start)
    let st = null; try { st = await (await fetch('/run', { cache: 'no-store' })).json(); } catch { }
    if (st && !(st.hand >= 1)) { alert('The cup at hand (INK-Y): restart rembrandt.py first — the one running does not know it yet. Nothing was sent.'); return; }
  }
  try {
    RUN = blocks; RUN_INFO = info; RUN_KEY = key; S.runPic = S.pic; S.runFrom = info.from ?? 0; S.runCut = info.cut?.k ?? null; S.runKey = key; save();   // the picture this run is of: the page keeps to it while it runs (runPicture); the line it started from, for PROGRESS
    const r = await fetch('/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blocks, log }) });
    $('#runState').textContent = await r.text();
  } catch { $('#runState').textContent = 'start rembrandt.py'; }
}
// rembrandt.py knows OPM-N's brush by its page (PENCIL_PAGES: the elbow may rest on the canvas just above its aim): FORM-G's the same brush, so the same page, its own `tab` in the journal; rembrandt.py as it was
const logOf = (o = {}) => ({ page: 'opmn', tab: TAB, label: `${NAME} · ${PIC.title}${PIC.frame ? ` · frame ${frameSize()}` : ''}`, here: hereNow(), ...(PIC.frame ? { frame: { ...PIC.frame, edgeLeft: frameHome().left, edgeBottom: frameHome().bottom } } : {}), ...(CANON_RUN ? {} : { join: JOIN_RUN, strokeDrops: STROKE_RUN }), ...(DABS ? { dabs: { brush: PIC.pitch, gap: dabGap(), run: S.dabRun, wide: dabWide() } } : {}), ...o });
// the iPhone's rows; every colour its line in the whole list, n of `of`, and a run from a later line `whole`: the picture's mm before it, the run's, all of it, the whole's seconds —
// so the remote's PROGRESS reads the whole picture, as the page's (rembrandt.py passes a colour on as it is)
// A run from the break (C, cutOf): the board's per cent is of what is left after the cut, so `whole` takes the run's share before it into mm0 — linear, as the remote reads it
const remoteRows = (R, from = 0, C = null) => {
  const all = plan(), f = C?.paint ? C.before / C.paint : 0, mm0 = all.slice(0, from).reduce((a, q) => a + q.mm, 0);
  const W = from || C ? { mm0: Math.round(mm0 + f * R.mm), run: Math.round(R.mm * (1 - f)), all: Math.round(all.reduce((a, q) => a + q.mm, 0)), s: Math.round(paintRun().seconds) } : null;
  return { colours: R.passes.map((q, i) => { const j = jarOf(q.pencil); return { name: j?.name ?? q.pencil, hex: j?.hex ?? '#7F7F7F', code: j?.code || '', cells: q.cells, n: from + i + 1, of: all.length, ...(W ? { whole: W } : {}) }; }), rows: R.rows.map(q => ({ c: q.pass, cells: q.cells ?? [] })) };
};
$('#btnDrag').onclick = async () => {
  await loadInk();
  if (!PIC) return;
  let R = paintRun(), from = 0;
  if (lastSt && LIVE.includes(lastSt.state)) return warn('A run is on: STOP it first.');
  if (!R.rows.length) return warn('Nothing to paint.');
  if (R.fault) return warn(`Not run: the plan is wrong — ${R.fault}.`);
  if (walls(R)) return warn(walls(R));
  if (cupProblem(cup())) return warn(`DRAG dips in ${cupName()}: ${cupProblem(cup())}`);
  const whole = R.passes, B = await lastBreak(), BP = B ? breakPlan(B) : null;
  // no text under the list (the owner, 2026-11-16, of its paragraph: "it is not needed, it covers the buttons"): the title, the jar first, the list, Start from
  const brk = BP ? { label: BP.no ? '⤵ FROM THE BREAK · not here' : `⤵ FROM THE BREAK · ${BP.jar} · cell ${BP.cell ?? '—'} · ${fmt(BP.pct, 0)} %`, title: BP.no ? `The journal's last DRAG broke off, but not to go on with here: ${BP.no}.` : BP.say } : null;
  const a = await askDraw(R.passes, '', { from: whole.length > 1 ? { passes: whole, pick: i => { from = i; R = paintRun(i); return { passes: R.passes, text: '' }; } } : null, brk });
  if (!a) return;
  if (a === 'break') return fromBreak(BP);
  if (R.fault) return warn(`Not run: the plan is wrong — ${R.fault}.`);               // the run from a later jar: its own plan
  if (walls(R)) return warn(walls(R));
  S.view = 'drag'; RUN_PRESS = S.press; save(); showKeys(); kick();
  await start('drag', R.blocks, { seconds: R.seconds, rows: R.rows, passes: R.passes.map(q => q.pencil), from },
    logOf({ pass: 'drag', ...(pressOk() ? { pressed_bottom_mm: Math.round(pressOk() * 10) / 10 } : {}), settings: setNow(), cup: dipCup(), travel: S.travel, remote: remoteRows(R, from), from, full: R.blocks.length, ...(from ? { from_colour: jarOf(R.passes[0].pencil)?.name ?? R.passes[0].pencil } : {}), estimate_s: Math.round(R.seconds) }));
};

// ---------- FROM THE BREAK ----------
// The owner, 2026-11-17, Mickey at 54 %: the camera on the elbow knocked while filming, its bracket held the elbow at +29°, the cup at hand's guard stopped the run
// over the jar, the ears not painted; "we cannot start again, the thick black paint will change the texture. We have the journal: can you find by the coordinates
// where it stopped? … a second button, 'continue from the break'". The journal (rembrandt.py's logs/runs.jsonl): this tab's last DRAG, broken off — stopped, an
// error, or no end written. Its plan made again here (Start from's line, the journal's `from` or `from_colour`) and checked against it: as many steps, every dip
// the journal wrote on a dip of the plan, the canvas where it lay; else not run. On from the last flight to a row's start before the step it broke at — the
// carriage there from home, the brush up — so the row it was in comes again from its start, its dip first (README, the gaps: the part after a cut starts back over
// the part before it); a flight whose stretch had painted all before the break, the next one. Before it, the run's own opening (the elbow up, the shoulder at 0,
// the wrist at 0). Nothing before the cut is painted again; the jar the break was in goes in the cup first.
const ENDS = ['done', 'stopped', 'error'], PLAN_KEYS = ['speed', 'travel', 'tail', 'wipe', 'press', 'dipEvery', 'dipLap', 'over', 'dabGap', 'dabRun'];
// the settings a run is written with in the journal: the page's, its place, GOGH's gap the picture's brush's (a brush's own since 2026-11-22), so FROM THE BREAK compares it
const nowOf = q => q === 'dabGap' && DABS ? dabGap() : S[q], setNow = () => ({ ...S, place: placeNow(), ...(DABS ? { dabGap: dabGap() } : {}) });
async function lastBreak() {
  let text;
  try { const r = await fetch('/logs/runs.jsonl', { cache: 'no-store' }); if (!r.ok) return null; text = await r.text(); } catch { return null; }
  const lines = text.trimEnd().split('\n'), parse = l => { try { return JSON.parse(l); } catch { return null; } };
  let i = lines.length - 1;
  for (; i >= 0; i--) if (lines[i].includes('"event": "start"') && lines[i].includes('"pass": "drag"') && lines[i].includes(`"tab": "${TAB}"`)) break;
  const st = i >= 0 ? parse(lines[i]) : null;
  if (!st) return null;
  const after = [];
  for (let k = i + 1; k < lines.length; k++) { const q = parse(lines[k]); if (!q) continue; if (q.event === 'start') break; after.push(q); }
  const end = after.find(q => ENDS.includes(q.event));
  if (end?.event === 'done') return null;
  const last = end ?? after.findLast(q => Number.isInteger(q.block));
  if (!Number.isInteger(last?.block)) return null;
  return { st, end, block: last.block, at: end?.at ?? after.findLast(q => typeof q.at === 'string')?.at ?? st.at, why: end?.message || (end ? end.event : 'no end in the journal'),
    dips: after.filter(q => q.event === 'dip' && q.by === 'plan' && Number.isInteger(q.block)).map(q => q.block) };
}
const isFly = b => b?.kind === 'move' && /^T /.test(b.cmds?.[0] ?? '') && !(b.paintMM > 0) && !b.home;
const paintTo = (blocks, k) => blocks.slice(0, k).reduce((a, b) => a + (b.kind === 'move' ? b.paintMM || 0 : 0), 0);
// the plan R from its block k on, after its own opening (the arm blocks before its first move); a block s of the cut is the plan's s + offset
function cutOf(R, k) {
  const n = R.blocks.findIndex(b => b.kind === 'move'), pre = R.blocks.slice(0, Math.max(0, n)).map(b => ({ ...b }));
  const blocks = [...pre, ...R.blocks.slice(k)], paint = paintTo(R.blocks, R.blocks.length);
  return { k, pre: pre.length, offset: k - pre.length, blocks, before: paintTo(R.blocks, k), paint, seconds: R.seconds * (R.blocks.length - k) / Math.max(1, R.blocks.length) };
}
// the plan as the run of the journal had it: its areas (`join`) or none, a run before 2026-11-17's evening
function breakPlan(B) {
  const was = [JOIN_RUN, STROKE_RUN];
  if (!CANON_RUN) { JOIN_RUN = B.st.join ?? null; STROKE_RUN = B.st.strokeDrops ?? null; }
  try { return breakPlanAs(B); } finally { [JOIN_RUN, STROKE_RUN] = was; }
}
function breakPlanAs(B) {
  const st = B.st, set = st.settings ?? {}, pic = set.runPic ?? set.pic, no = t => ({ no: t });
  if (pic !== S.pic) return no(`it is of ${LIB[pic]?.title ?? pic}: choose it in the library`);
  const fr = q => q ? [q.x0, q.y0, q.x1, q.y1].join(',') : '';
  if (fr(st.frame) !== fr(PIC.frame)) return no(st.frame ? `it ran in the frame ${fmt(st.frame.x1 - st.frame.x0, 0)} × ${fmt(st.frame.y1 - st.frame.y0, 0)}: lay that frame again` : 'it ran the whole picture: take the frame away');
  const all = plan(), name = q => jarOf(q.pencil)?.name ?? q.pencil;
  const from = Number.isInteger(st.from) ? st.from : st.from_colour ? all.findIndex(q => name(q) === st.from_colour) : 0;
  if (from < 0 || from >= all.length) return no(`it started from ${st.from_colour}, not in the list here`);
  const here = hereNow();
  if (st.here && Math.hypot(here.x - st.here.x, here.y - st.here.y) > 0.05) return no(`the canvas lay elsewhere then (its centre X ${fmt(st.here.x, 1)} · Y ${fmt(st.here.y, 1)}, here X ${fmt(here.x, 1)} · Y ${fmt(here.y, 1)}): set The canvas as it was, left ${set.place?.edgeLeft} · bottom ${set.place?.edgeBottom}`);
  const R = paintRun(from), full = st.full ?? st.blocks, cut = st.cut ?? 0, pre = st.pre ?? 0;
  if (R.fault) return no(`the plan is wrong — ${R.fault}`);
  if (R.blocks.length !== full) return no(`the plan here is not the one that ran: ${full} steps then, ${R.blocks.length} here — the settings, THE JARS or the marks changed since`);
  const toFull = s => s < pre ? null : s + cut;
  const bad = B.dips.map(toFull).filter(s => s !== null && !R.blocks[s]?.dip);
  if (bad.length) return no(`the plan here is not the one that ran: ${bad.length} of its ${B.dips.length} dips fall on no dip here, the first at step ${bad[0] + 1}`);
  const at = B.block < pre ? cut + pre : B.block + cut;                               // the step it broke at, in the whole plan
  let k = -1;
  for (let s = Math.min(at, R.blocks.length - 1); s >= 0; s--) if (isFly(R.blocks[s])) { k = s; break; }
  const nextFly = s => { for (let q = s + 1; q < R.blocks.length; q++) if (isFly(R.blocks[q])) return q; return -1; };
  if (k >= 0) {                                                                       // the stretch from that flight painted all before the break: the next one
    const n = nextFly(k), stop = n < 0 ? R.blocks.length : n, painted = q => R.blocks[q].kind === 'move' && R.blocks[q].paintMM > 0;
    let before = false, rest = false;
    for (let q = k; q < stop; q++) if (painted(q)) { if (q < at) before = true; else rest = true; }
    if (before && !rest) k = n;
  }
  if (k < 0) return no('it broke off after the last row: nothing is left to paint');
  const C = cutOf(R, k), row = R.blocks[k].row, info = R.rows[row - 1] ?? {}, line = info.pass ?? 0, jar = name(R.passes[line]);
  const cell = info.cells?.[0]?.[0], later = R.passes.slice(line + 1).map(name);
  const diffs = PLAN_KEYS.filter(q => set[q] !== undefined && set[q] !== nowOf(q)).map(q => `${q} ${set[q]} then, ${nowOf(q)} now`);
  const pct = C.paint ? C.before / C.paint * 100 : 0;
  const say = `The journal: ${B.at}, ${B.why} — at step ${at + 1} of ${full}, ${R.rows[(R.blocks[at]?.row || row) - 1]?.label ?? info.label ?? ''}.`
    + `\n\nOn from step ${k + 1}: ${info.label ?? `row ${row}`}. Put ${jar} in the cup: the elbow up, the shoulder at 0, then the brush flies there from home, dips and paints on — ${jar} to its end${later.length ? `, then ${later.length} line${later.length === 1 ? '' : 's'} more: ${later.join(', ')}` : ''}. Nothing before it is painted again; ${fmt(pct, 0)} % of this run's paint lies behind it.`
    + (diffs.length ? `\n\nSince then: ${diffs.join('; ')} — run as it is now.` : '');
  return { B, R, C, from, at, k, row, line, jar, cell, pct, say, passes: R.passes.slice(line) };
}
async function fromBreak(BP) {
  if (BP.no) return alert(`FROM THE BREAK: not possible — ${BP.no}.`);
  if (lastSt && LIVE.includes(lastSt.state)) return warn('A run is on: STOP it first.');
  if (cupProblem(cup())) return warn(`DRAG dips in ${cupName()}: ${cupProblem(cup())}`);
  if (walls(BP.R)) return warn(walls(BP.R));
  if (!confirm(`FROM THE BREAK · ${PIC.title}\n\n${BP.say}`)) return;
  const { R, C, from, B } = BP;
  S.view = 'drag'; RUN_PRESS = S.press; save(); showKeys(); kick();
  await start('drag', C.blocks, { seconds: C.seconds, rows: R.rows, passes: R.passes.map(q => q.pencil), from, cut: C, full: R.blocks },
    logOf({ pass: 'drag', ...(pressOk() ? { pressed_bottom_mm: Math.round(pressOk() * 10) / 10 } : {}), settings: setNow(), cup: dipCup(), travel: S.travel, remote: remoteRows(R, from, C),
      from, full: R.blocks.length, cut: C.offset, pre: C.pre, ...(CANON_RUN ? {} : { join: B.st.join ?? null, strokeDrops: B.st.strokeDrops ?? null }), resume: { of: B.st.at, broke: B.at, at_block: BP.at, from_block: BP.k, row: BP.row, colour: BP.jar, cell: BP.cell ?? null },
      ...(from ? { from_colour: jarOf(R.passes[0].pencil)?.name ?? R.passes[0].pencil } : {}), estimate_s: Math.round(C.seconds) }));
}
// its checks, OPM-N's: the plan, the walls, the debug of the pen's downs (strokes.js, landingCheck): every mm of every line with the pen down → a warning, or the debug
function bwCheck(R) {
  const at = penAt();
  if (!R.rows.length) return 'Nothing to draw.';
  if (R.fault) return `Not run: the plan is wrong — ${R.fault}.`;
  if (walls(R)) return walls(R).replace('The brush', 'The pen');
  const dbg = landingCheck(R.blocks, at.press, at.glide);
  if (!dbg.ok) return `Not run — debug: ${dbg.bad.length} drawn piece${dbg.bad.length === 1 ? '' : 's'} with the pen not down${dbg.bad.length ? `, the first at carriage X ${fmt(dbg.bad[0].at[0], 1)} · Y ${fmt(dbg.bad[0].at[1], 1)}, the elbow at ${dbg.bad[0].deg === null ? 'nothing yet' : sgn(dbg.bad[0].deg)}, not ${sgn(at.press)}` : ''}.`;
  return { dbg };
}
function bwText(R, dbg) {
  const at = penAt(), all = R.kind === 'all';
  return `Debug ✓ ${dbg.lines} line${dbg.lines === 1 ? '' : 's'}: ${dbg.downs} down${dbg.downs === 1 ? '' : 's'} to ${sgn(at.press)}; ${fmt(dbg.pressed / 1000, 2)} m drawn, every mm of it with the pen down.\n\n`
    + (all ? `Every border between two colours of ${PIC.title} and its outline on the bare canvas, the steps of the ${fmt(PIC.pitch, 0)} mm columns as the brush lays them — ${R.lines} lines, every one once`
      : `The outline of ${PIC.title} alone, where its paint meets the bare canvas, the steps of the ${fmt(PIC.pitch, 0)} mm columns as the brush lays them, no line inside — ${R.lines} line${R.lines === 1 ? '' : 's'}`)
    + `, in one pen, no dip, no jar: ${fmt(R.mm / 1000, 2)} m at ${S.penSpeed} mm/s, ≈ ${hm(R.seconds)} (est.). `
    + `The carriage goes over the first line and puts the holder down, ${sgn(at.in)}: the brush out, the pen in, its tip on the paper, then Continue — no stop after it. The pen draws at the brush's elbow, ${sgn(at.press)} (Elbow live · brush, live while it draws), the carriage on the line, so it goes where the brush will paint; ${sgn(at.glide)} over a line's start, up between lines. `
    + (PIC.frame ? `Only the frame, ${frameSize()} mm, at its place in the picture: its paper's left edge ${frameHome().left} mm, its bottom edge ${frameHome().bottom} mm from home — is it taped there?` : `The paper where the canvas will lie: its left edge ${placeNow().edgeLeft} mm, its bottom edge ${placeNow().edgeBottom} mm from home — is it taped there?`);
}
if ($('#btnBw')) $('#btnBw').onclick = async () => {
  await loadInk();
  if (!PIC) return;
  if (lastSt && LIVE.includes(lastSt.state)) return warn('A run is on: STOP it first.');
  const textOf = R => { const c = bwCheck(R); return typeof c === 'string' ? c : bwText(R, c.dbg); };
  const choice = { label: 'Draw', value: bwKind(), options: Object.entries(BW_KINDS).map(([v, t]) => ({ value: v, text: `${t} · ≈ ${hm(penRun(v).seconds)}` })), pick: v => { S.bw = v; save(); kick(); return textOf(penRun(v)); } };
  if (!await askDraw(null, textOf(penRun()), { pen: true, choice })) { showPanel(); return; }
  const R = penRun(), c = bwCheck(R);                                                // the one picked: its own checks
  if (typeof c === 'string') return warn(c);
  const at = penAt();
  S.view = 'contour'; RUN_PRESS = S.press; save(); showKeys(); kick();
  await start('bw', R.blocks, { seconds: R.seconds, rows: R.rows, passes: [], bw: R.kind },
    logOf({ pass: 'draw bw', label: `${NAME} · ${PIC.title}${PIC.frame ? ` · frame ${frameSize()}` : ''} · DRAW BW, the pen · ${R.kind === 'all' ? 'every border' : 'the outline'}`, settings: setNow(), debug: { lines: c.dbg.lines, downs: c.dbg.downs, ups: c.dbg.ups, press: at.press, glide: at.glide }, estimate_s: Math.round(R.seconds) }));
};
// the second layer in words: a late jar first (the orange, Jar 6: README's canon, 2026-11-11), then the jars again
// and a jar `last` after them (v.4's shadow, 2026-11-13)
function layer2Say(passes) {
  const all = passes.filter(q => q.layer === 2), two = all.filter(q => !jarOf(q.pencil)?.last), end = all.filter(q => jarOf(q.pencil)?.last && jarOf(q.pencil)?.coat === 1).map(q => jarOf(q.pencil)?.name ?? q.pencil);
  const late = two.filter(q => jarOf(q.pencil)?.coat === 1).map(q => jarOf(q.pencil)?.name ?? q.pencil), again = two.length - late.length, k = all.length - two.length;
  return [late.length ? `${late.join(', ')} first` : '', again || !end.length ? `${again} of the jars again` : '', end.length ? `${end.join(', ')} last, ${k} line${k === 1 ? '' : 's'}` : ''].filter(Boolean).join(', then ');
}
// OPM-N's question: the first jar big, the order, the time, Start from; DRAG or Cancel, Esc Cancel
const runRows = passes => passes.map((q, i) => { const j = jarOf(q.pencil); return `<li><span class="no">${i + 1}</span><i class="sw" style="background:${j.hex}"></i><span class="nm">${esc(j.name)}${j.code ? ` <em>${esc(j.code)}</em>` : ''}</span><span class="tg">${q.fill ? `${q.fill === 'dabs' ? 'dabs' : q.fill === 'zone' ? 'zone' : 'strokes'} · ` : ''}${q.mm >= 1000 ? `${fmt(q.mm / 1000, 1)} m` : `${Math.round(q.mm)} mm`}</span></li>`; }).join('');
function askDraw(passes, text, o = {}) {
  const box = $('#drawAsk');
  const show = (passes, text) => {
    $('#drawAskText').textContent = text; $('#drawAskText').style.display = text ? '' : 'none';
    $('#drawGo').textContent = o.pen ? '✎ DRAW BW' : '▶ DRAG';
    $('#drawAskList').style.display = o.pen ? 'none' : '';                         // the class's display wins over hidden
    if (o.pen) {                                                                      // DRAW BW: the pen, no jar
      $('#drawAskTitle').textContent = `DRAW BW ${NAME} · ${PIC.title} · the contour in one pen`;
      $('#drawAskFirst').innerHTML = `<i class="sw" style="background:#24221F"></i><span class="pt"><span class="k">In the holder</span><b>The pen</b><span>its tip on the paper, the brush out</span></span>`;
      $('#drawAskList').innerHTML = '';
      return;
    }
    const first = jarOf(passes[0].pencil);
    $('#drawAskTitle').textContent = `DRAG ${NAME} · ${PIC.title} · ${passes.length} line${passes.length === 1 ? '' : 's'} of the list`;
    $('#drawAskFirst').innerHTML = `<i class="sw" style="background:${first.hex}"></i><span class="pt"><span class="k">In the cup first</span><b>${esc(first.name)}</b><span>${esc(first.code || '')}</span></span>`;
    $('#drawAskList').innerHTML = runRows(passes);
  };
  show(passes, text);
  const row = $('#drawAskFrom'), on = o.from || o.choice;
  row.hidden = !on; row.style.display = on ? '' : 'none';
  row.querySelector('span').textContent = o.choice ? o.choice.label : 'Start from';
  if (o.choice) {                                                                     // DRAW BW: the outline alone, or every border
    const sel = $('#drawFrom');
    sel.innerHTML = o.choice.options.map(q => `<option value="${q.value}">${esc(q.text)}</option>`).join('');
    sel.value = o.choice.value;
    sel.onchange = () => { $('#drawAskText').textContent = o.choice.pick(sel.value); };
  }
  if (o.from) {
    const sel = $('#drawFrom');
    sel.innerHTML = o.from.passes.map((q, i) => `<option value="${i}">${i + 1} · ${esc(jarOf(q.pencil)?.name ?? q.pencil)}</option>`).join('');
    sel.value = '0';
    sel.onchange = () => { const v = o.from.pick(+sel.value); show(v.passes, v.text); };
  }
  const bk = $('#drawBreak');                                                         // FROM THE BREAK: where the journal's last DRAG broke off
  if (bk) { bk.hidden = !o.brk; bk.style.display = o.brk ? '' : 'none'; if (o.brk) { bk.textContent = o.brk.label; bk.title = o.brk.title; } }
  box.hidden = false; $('#drawAskList').scrollTop = 0; $('#drawGo').focus();
  return new Promise(ok => {
    const key = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); end(false); } };
    const end = v => { box.hidden = true; removeEventListener('keydown', key, true); ok(v); };
    addEventListener('keydown', key, true);
    $('#drawGo').onclick = () => end(true); $('#drawNo').onclick = () => end(false);
    if (bk) bk.onclick = () => end('break');
    box.onclick = e => { if (e.target === box) end(false); };
  });
}
// TEST: a dot at each corner of the picture's box, the canvas laid by them; a 70 × 100's own corners are past the walls.
// GOGH's (the owner, 2026-11-22, the evening, of the 20 × 20, its TEST "TL X 195 · Y 7 … BR X 23 · Y 193": "strange coordinates. It must be TL X 200 Y 0 … TR
// 200, as in the picture" — Preferences' TEST, margin 0, "a dot at each corner itself … of the canvas"): HOLO's — band.js's cornerDots, the canvas's own corners
// Preferences' margin in (0 the corner itself), TL twice with its wait, where the canvas lies within the reach; a canvas past it the picture's box, as FORM-G's.
// A dot's mm: on the canvas, from its bottom left corner, [across, up]
const TEST_IN = 0;   // mm inside the walls: on a wall allowed, a 20 × 20 laid at home's Y 0 its corners there (margin 0); past it not (HOLO's 0.2, the place's)
function testRun() {
  let dots = null, by = 'box', off = [];
  if (DABS) {
    const R = reach(), h = hereNow(), fits = PIC.w <= R.y.max - R.y.min - 2 * TEST_IN && PIC.h <= R.x.max - R.x.min - 2 * TEST_IN;
    const past = q => { const x = h.x + q.x, y = h.y + q.y; return Math.max(R.x.min + TEST_IN - x, x - (R.x.max - TEST_IN), R.y.min + TEST_IN - y, y - (R.y.max - TEST_IN), 0); };
    const c = fits ? cornerDots(PIC.w, PIC.h).dots : [];
    if (c.length) {
      dots = c.map(d => ({ ...d, mm: [PIC.w / 2 + d.at.y, PIC.h / 2 + d.at.x] })); by = 'canvas';
      off = dots.filter(d => past(d.at) > 0 || past(d.to) > 0).map(d => ({ name: d.name, mm: Math.max(past(d.at), past(d.to)) }));
    }
  }
  if (!dots) {
    const b = plan().flatMap(q => q.byCell.flatMap(c => c.legs.flat())), xs = b.map(q => q[0]), ys = b.map(q => q[1]);
    if (!b.length) return null;
    const x0 = Math.min(...ys) - PIC.h / 2, x1 = Math.max(...ys) - PIC.h / 2, y0 = Math.min(...xs) - PIC.w / 2, y1 = Math.max(...xs) - PIC.w / 2;
    dots = [['TL', x1, y0], ['TR', x1, y1], ['BR', x0, y1], ['BL', x0, y0]].map(([name, x, y]) => { const d = Math.hypot(x, y) || 1, l = Math.min(DOT_MM, d); return { name, at: { x, y }, to: { x: x - x / d * l, y: y - y / d * l }, mm: [PIC.w / 2 + y, PIC.h / 2 + x] }; });
  }
  return { ...plotRun(runOpts(dots.length), [{ key: 'TEST', ps: dots.map((d, i) => [{ t: 'L', a: d.at, b: d.to, tilt: 0, row: i + 1, ...(d.wait !== undefined ? { wait: d.wait } : {}) }]), why: null }]), dots, by, off };
}
// POINTS · Jar 0 (formgplan.js's pointsOf): TEST's run, a dot at each of the picture's outermost points, in the white, to lay the canvas by and check it with a ruler
// and first a dot at the canvas's very middle, a short stroke along X across it (the owner, 2026-11-16: "maybe put a dot right in the centre? It will help me":
// from it a ruler to every edge, half the canvas)
function pointsRun() {
  const pts = pointsOf(PIC);
  if (!pts.length) return null;
  const centre = { name: 'C', mm: [PIC.w / 2, PIC.h / 2], at: { x: -DOT_MM / 2, y: 0 }, to: { x: DOT_MM / 2, y: 0 } };
  const dots = [centre, ...pts.map(([px, py], i) => { const x = py - PIC.h / 2, y = px - PIC.w / 2, d = Math.hypot(x, y) || 1, l = Math.min(DOT_MM, d); return { name: `P${i + 1}`, mm: [px, py], at: { x, y }, to: { x: x - x / d * l, y: y - y / d * l } }; })];
  return { ...plotRun(runOpts(dots.length), [{ key: 'POINTS', ps: dots.map((d, i) => [{ t: 'L', a: d.at, b: d.to, tilt: 0, row: i + 1 }]), why: null }]), dots };
}
let SHOW_PTS = false;
if ($('#btnPoints')) {                                                               // FORM-G's alone, not OPM-G's
$('#btnPoints').onmouseenter = () => { SHOW_PTS = true; kick(); };
$('#btnPoints').onmouseleave = () => { SHOW_PTS = false; kick(); };
$('#btnPoints').onclick = async () => {
  await loadInk();
  if (!PIC) return;
  const here = hereNow(), T = pointsRun();
  if (!T) return warn('Nothing to paint.');
  if (cupProblem(cup())) return warn(`POINTS dips in ${cupName()}: ${cupProblem(cup())}`);
  if (T.fault) return warn(`Not run: the points are wrong — ${T.fault}.`);
  if (walls(T)) return warn(walls(T));
  if (!confirm(`POINTS · Jar 0: put Jar 0, the white, in the cup — one dip, then a dot at the canvas's centre (C) and at each of the picture's ${T.dots.length - 1} outermost points (mm from the canvas's left and bottom edges): ${T.dots.map(d => `${d.name} ${fmt(d.mm[0], 0)} → · ${fmt(d.mm[1], 0)} ↑`).join(', ')} — and home.`)) return;
  await start('points', T.blocks, { seconds: T.seconds, rows: T.dots.map(d => ({ label: `POINTS · ${d.name}` })) }, logOf({ pass: 'points', cup: cup(), dots: T.dots.map(d => ({ name: d.name, mm: d.mm, x: +(here.x + d.at.x).toFixed(1), y: +(here.y + d.at.y).toFixed(1) })), estimate_s: Math.round(T.seconds) }));
};
}
$('#btnTest').onclick = async () => {
  await loadInk();
  if (!PIC) return;
  const here = hereNow(), T = testRun();
  if (!T) return warn('Nothing to paint.');
  if (cupProblem(cup())) return warn(`TEST dips in ${cupName()}: ${cupProblem(cup())}`);
  if (T.off.length) return warn(`TEST: ${T.off.map(d => `${d.name} ${fmt(d.mm, 1)} mm`).join(', ')} past the walls — the canvas's corners out of the brush's reach: move the canvas (The canvas) by as much.`);
  if (T.fault) return warn(`Not run: the test is wrong — ${T.fault}.`);
  if (walls(T)) return warn(walls(T));
  const P = testPrefs(), c = placeNow(), onCanvas = d => `${d.name} X ${fmt(d.mm[1], 0)} · Y ${fmt(d.mm[0], 0)}`;
  const say = T.by === 'canvas'
    ? `TEST: one dip in the cup, then ${testSay()} of the ${PIC.w / 10} × ${PIC.h / 10} canvas (Preferences) — on the canvas, mm from its bottom left corner, X up, Y across: ${T.dots.map(onCanvas).join(', ')}; TL to TR ${fmt(PIC.w - 2 * P.margin, 0)} mm, BL to TL ${fmt(PIC.h - 2 * P.margin, 0)} mm — and home.\n\n`
      + `On the machine: the canvas's left edge ${c.edgeLeft} mm, its bottom edge ${c.edgeBottom} mm from home (The canvas), so TL at X ${fmt(here.x + T.dots[0].at.x, 0)} · Y ${fmt(here.y + T.dots[0].at.y, 0)} from home.`
    : `TEST: one dip in the cup, then a dot at each corner of ${PIC.frame ? 'what the frame paints' : "the picture's box"} — ${T.dots.map(d => `${d.name} X ${fmt(here.x + d.at.x, 0)} · Y ${fmt(here.y + d.at.y, 0)}`).join(', ')} — and home.`;
  if (!confirm(say)) return;
  await start('test', T.blocks, { seconds: T.seconds, rows: T.dots.map(d => ({ label: `TEST · ${d.name}` })) }, logOf({ pass: 'test', cup: cup(), by: T.by, margin: T.by === 'canvas' ? testPrefs().margin : null, dots: T.dots.map(d => ({ name: d.name, mm: d.mm.map(v => +v.toFixed(1)), x: +(here.x + d.at.x).toFixed(1), y: +(here.y + d.at.y).toFixed(1) })), estimate_s: Math.round(T.seconds) }));
};
const post = async path => { if (VIEW) return ''; try { const r = await fetch(path, { method: 'POST' }); return await r.text(); } catch { return 'start rembrandt.py'; } };
$('#btnHome').onclick = () => start('home', homeBlocks(S.travel), { seconds: 0, rows: [{ label: 'HOME' }] }, logOf({ label: `${NAME} · HOME` }));
let paused = false;
$('#btnPause').onclick = () => post(paused ? '/run/continue' : '/run/pause');
$('#btnStop').onclick = () => post('/run/stop');
let backSaid = 0;
// BACK ONE JAR in BACK ONE CELL's place (the owner, 2026-11-13: "there are no cells in FORM-G … better BACK ONE JAR —
// I have just run the orange no. 6, so as to go over it once more without pressing STOP / HOME"), rembrandt.py's back_jar
$('#btnBack').onclick = async () => {
  if (VIEW) return;
  const press = async sure => { const r = await fetch('/run/backjar' + (sure ? '?sure=1' : ''), { method: 'POST' }); return r.status === 404 ? { old: true } : r.json(); };
  try {
    let a = await press(false);
    if (a.old) return alert('BACK ONE JAR did nothing: the rembrandt.py running is from before it. Start it again when no run is on — Ctrl+C in its window, then python3 rembrandt.py. The run in hand ends with it.');
    if (a.ask) {
      if (!confirm(`Back to ${a.ask.colour}, from its start. It flies there, dips and paints at once: is ${a.ask.colour} in the cup?`)) return;
      a = await press(true);
    }
    if (!a.ok) return alert(`BACK ONE JAR did nothing: ${a.message ?? a.state ?? 'not now'}.`);
    const b = $('#btnBack'); b.textContent = `⏮ ${a.message}`; b.classList.add('call');
    clearTimeout(backSaid); backSaid = setTimeout(() => { b.textContent = '⏮ BACK ONE JAR'; b.classList.remove('call'); }, 4000);
  } catch { alert('BACK ONE JAR did nothing: no answer from rembrandt.py.'); }
};
$('#btnRemote').onclick = async () => {
  const box = $('#remoteBox'), b = $('#btnRemote');
  if (!box.hidden) { box.hidden = true; b.classList.remove('on'); return; }
  box.hidden = false; b.classList.add('on'); box.textContent = '…';
  let L = null;
  try { const r = await fetch('/remote/link', { cache: 'no-store' }); if (r.ok) L = await r.json(); } catch { }
  box.innerHTML = L?.url ? `${qrSvg(L.url)}<p>The iPhone's camera on it, on the same Wi-Fi; in Safari Share → <b>Add to Home Screen</b> for an icon. DIP, Pause · Continue and STOP there, the colour and the cell.</p><code>${esc(L.url)}</code>`
    : L ? '<p>rembrandt.py listens on this Mac only (REMBRANDT_LISTEN=127.0.0.1), or the Mac is on no Wi-Fi.</p>'
    : '<p>No answer from rembrandt.py: start it.</p>';
};
// ELBOW LIVE, OPM-N's: the brush pressed at so many degrees, 0° its pose, minus down; in a DRAG from the next stroke on, rembrandt.py's trim
let RUN_PRESS = null, elbowT = null;
const dragLive = () => !!lastSt && LIVE.includes(lastSt.state) && ['drag', 'bw'].includes(RUN_KEY);   // DRAW BW's pen too: it draws at the brush's elbow
function showElbow() {
  const sl = $('#brushSl'); sl.min = PRESS_MIN; sl.max = PRESS_MAX;
  if (document.activeElement !== sl) sl.value = S.press;
  $('#brushNow').textContent = sgn(S.press);
  $('#elbowBrush').classList.toggle('live', dragLive());
}
function setElbow(deg) {
  if (VIEW) return;
  const v = Math.max(PRESS_MIN, Math.min(PRESS_MAX, Math.round(deg * 10) / 10));
  if (v === S.press) return;
  const live = dragLive();
  if (live && RUN_PRESS === null) RUN_PRESS = S.press - (lastSt.trim ?? 0);
  S.press = v; save(); showElbow();
  if (live) { clearTimeout(elbowT); elbowT = setTimeout(async () => {
    try { const r = await fetch(`/run/trim?deg=${Math.round((S.press - RUN_PRESS) * 10) / 10}`, { method: 'POST' }); $('#runState').innerHTML = r.ok ? '' : `<span class="warn">ELBOW LIVE: ${esc(await r.text())}</span>`; } catch { $('#runState').textContent = 'start rembrandt.py'; }
  }, 120); }
}
$('#brushSl').oninput = e => setElbow(+e.target.value);
// GOGH's sliders: the gap and the run into the plan (the next DRAG; a run on keeps its own), the width onto the screen
const DAB_SAY = { gap: v => `${v > 0 ? '+' : v < 0 ? '−' : ''}${fmt(Math.abs(v), 1)} mm`, wide: v => `${fmt(v, 1)} mm`, run: v => `${dabOf(PIC?.pitch).aim + 2 * v} mm` };   // a standard dab of the picture's brush with its run on
function showDabs() {
  if (!DABS || !$('#gapSl')) return;
  const v = { gap: dabGap(), wide: dabWide(), run: S.dabRun };
  for (const k of ['gap', 'wide', 'run']) { const sl = $(`#${k}Sl`); if (document.activeElement !== sl) sl.value = v[k]; $(`#${k}Now`).textContent = DAB_SAY[k](v[k]); }
  if ($('#runSay')) $('#runSay').textContent = `Run · a ${dabOf(PIC?.pitch).aim} mm dab`;   // the picture's brush's standard dab: 20, the 2 mm's 12
  $('#dabRead').innerHTML = PIC ? `The brush <b>${fmt(PIC.pitch, 0)} mm</b>, the picture's (GEN-V cuts it for one). Gap ${DAB_SAY.gap(dabGap())} and run +${S.dabRun} · +${S.dabRun} mm: live during a DRAG, from the next dab; the width is the screen's alone (est.).` : '';
}
function setDab(k, v) {
  if (!DABS) return;
  const was = k === 'gap' ? dabGap() : k === 'run' ? S.dabRun : dabWide();
  const now = k === 'gap' ? dabGapOf(v, PIC?.pitch) : k === 'run' ? dabRunOf(v) : dabWideOf(v, PIC?.pitch);
  if (now === was) return showDabs();
  if (k === 'gap') S.dabGaps = { ...S.dabGaps, [PIC.pitch]: now }; else if (k === 'run') S.dabRun = now; else S.dabWide = { ...S.dabWide, [PIC.pitch]: now };
  if (k === 'wide') { save(); showDabs(); kick(); return; }
  settle();
  if (lastSt && LIVE.includes(lastSt.state) && !swapLive(k)) warn(`${k === 'gap' ? 'Gap' : 'Run'}: from the next DRAG — the run on is not this page's DRAG.`);
}
// LIVE (the owner, 2026-11-22: "I allow changing rembrandt.py"): during a DRAG the plan made again with the slider — from the line the run started on, its cut
// if it ran from the break — and sent to rembrandt.py's /run/swap, which puts it in place of the run's own steps where only where the brush goes differs
// (swap_refuses); the dab painting now as it was sent, the next one on the new
let swapT = null;
function swapLive(k) {
  if (!DABS || VIEW || RUN_KEY !== 'drag' || !RUN_INFO || S.pic !== S.runPic) return false;
  clearTimeout(swapT);
  swapT = setTimeout(async () => {
    const what = k === 'gap' ? `Gap ${DAB_SAY.gap(dabGap())}` : `Run ${DAB_SAY.run(S.dabRun)}`;
    const R = paintRun(RUN_INFO.from ?? 0), C = RUN_INFO.cut ? cutOf(R, RUN_INFO.cut.k) : null, B = C ? C.blocks : R.blocks;
    if (!lastSt || !LIVE.includes(lastSt.state)) return;
    if (B.length !== lastSt.blocks) return warn(`${what}: not live — the plan here is not the one that runs (${B.length} steps, ${lastSt.blocks} there); from the next DRAG.`);
    try {
      const r = await fetch('/run/swap', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blocks: B, log: { by: k, dabs: { gap: dabGap(), run: S.dabRun } } }) });
      if (r.status === 404) return warn(`${what}: not live — restart rembrandt.py (it learnt /run/swap on 2026-11-22); from the next DRAG.`);
      const q = await r.json().catch(() => null);
      if (!r.ok || !q?.ok) return warn(`${what}: not live — ${esc(q?.message ?? r.status)}; from the next DRAG.`);
      RUN = B; if (C) RUN_INFO = { ...RUN_INFO, cut: C, full: R.blocks };
      warnAt = Date.now(); $('#runState').innerHTML = `${what}: live, from the next dab (step ${q.from}).`;
    } catch { warn('start rembrandt.py'); }
  }, 300);
  return true;
}
document.querySelectorAll('.dabsl input[data-dab]').forEach(sl => { sl.oninput = () => setDab(sl.dataset.dab, +sl.value); });
document.querySelectorAll('.dabsl button[data-dab]').forEach(b => { b.onclick = () => { const k = b.dataset.dab, v = k === 'gap' ? dabGap() : k === 'run' ? S.dabRun : dabWide(); setDab(k, v + +b.dataset.step); }; });
document.querySelectorAll('#elbowBrush [data-btrim]').forEach(b => { b.onclick = () => setElbow(S.press + +b.dataset.btrim); });

// ---------- the screen: the canvas as it lies on the machine, the reach over it ----------
const cv = $('#cv'), stage = $('#stage'), ctx = cv.getContext('2d');
let K = 1, OX = 0, OY = 0, fitted = '', only = null, PLAY = null, NOW = null;
// GOGH's 20 times faster, 9 s (the owner, 2026-11-22, the evening: "▶ Play — please make the drawing speed 20 times faster :) In GOGH it goes very slowly")
const PLAY_MS = DABS ? 180000 / 20 : 180000;
function fit() {
  const r = stage.getBoundingClientRect(), m = 26, k = Math.min((r.width - 2 * m) / PIC.w, (r.height - 2 * m) / PIC.h);
  K = k; OX = (r.width - PIC.w * k) / 2; OY = (r.height - PIC.h * k) / 2;
}
const sx = x => OX + x * K, sy = y => OY + (PIC.h - y) * K;
function layout() {
  const r = stage.getBoundingClientRect(), d = devicePixelRatio || 1;
  cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
  const was = `${S.pic}|${Math.round(r.width)}|${Math.round(r.height)}`;              // a window or a phone turned: the picture fitted again
  if (PIC && fitted !== was) { fit(); fitted = was; }
  kick();
}
let drawT = 0;
function kick() { if (!drawT) drawT = requestAnimationFrame(() => { drawT = 0; draw(); }); }
function legsPath(c, q) {                                                             // a cell's first run, its steps between legs on the paper
  c.beginPath();
  q.legs.forEach((l, i) => { const a = [sx(l[0][0]), sy(l[0][1])], b = [sx(l[1][0]), sy(l[1][1])]; if (i && !DABS) c.lineTo(a[0], a[1]); else c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); });   // GOGH's dabs each its own, the brush up between them
}
function drawLegs(c, passes, dim = 1) {
  c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = Math.max(0.5, PIC.pitch * K * 0.92);
  for (const P of passes) {
    const j = jarOf(P.pencil);
    c.strokeStyle = j.hex; c.globalAlpha = dim * (!only || only === P.pencil ? 1 : 0.07);
    for (const q of P.byCell) { legsPath(c, q); c.stroke(); }
  }
  c.globalAlpha = 1;
}
// GOGH's Picture (2026-11-22): every dab as it will lie, from the plan, not the card's jpg — the gap off its ends, the width the slider's, round ends; the
// list's order, the later over the earlier; a jar's row: the others veiled
function drawDabs(c) {
  const w = dabWide();
  c.lineCap = 'round'; c.lineWidth = Math.max(0.5, w * K);
  for (const P of plan()) {
    const j = jarOf(P.pencil), own = PIC.jars.find(q => q.id === (j.jar ?? j.id)) ?? j;
    c.strokeStyle = j.hex; c.globalAlpha = !only || only === P.pencil ? 1 : 0.1;
    c.beginPath();
    for (const q of own.cells) for (const [x, a, b] of q.legs) { const [t, u] = dabOnScreen(Math.max(a, b), Math.min(a, b), dabGap(), w); c.moveTo(sx(x), sy(t)); c.lineTo(sx(x), sy(u)); }
    c.stroke();
  }
  c.globalAlpha = 1;
}
// Contour: DRAW BW's lines as the pen draws them, over the picture veiled
const linePath = (c, l) => { c.beginPath(); l.forEach((q, i) => i ? c.lineTo(sx(q[0]), sy(q[1])) : c.moveTo(sx(q[0]), sy(q[1]))); };
function drawContour(c) {
  const im = PIC.layers ? null : IMG[S.pic];
  if (im?.complete) { c.save(); c.globalAlpha = 0.28; c.imageSmoothingQuality = 'high'; c.drawImage(im, sx(0), sy(PIC.h), PIC.w * K, PIC.h * K); c.restore(); }
  c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = Math.max(0.75, 0.5 * K); c.strokeStyle = '#24221F';
  for (const l of contour().lines) { linePath(c, l); c.stroke(); }
}
function draw() {
  const d = devicePixelRatio || 1, r = stage.getBoundingClientRect(), g = ctx;
  g.setTransform(d, 0, 0, d, 0, 0);
  g.clearRect(0, 0, r.width, r.height);
  if (!PIC) return;
  // the canvas white, gesso (the owner, 2026-11-16: "why is our ground cream on FORM-G? I take a canvas, the gesso there is white"): OPM-N's and GEN-F's white
  g.fillStyle = GESSO; g.fillRect(sx(0), sy(PIC.h), PIC.w * K, PIC.h * K);
  g.strokeStyle = 'rgba(36,34,31,.35)'; g.lineWidth = 1; g.strokeRect(sx(0), sy(PIC.h), PIC.w * K, PIC.h * K);
  if (PLAY) { g.drawImage(PLAY.cv, sx(0), sy(PIC.h), PIC.w * K, PIC.h * K); }
  else if (DABS && S.view === 'picture') drawDabs(g);
  else if (S.view === 'picture' && IMG[S.pic]?.complete) {
    g.imageSmoothingQuality = 'high'; g.drawImage(IMG[S.pic], sx(0), sy(PIC.h), PIC.w * K, PIC.h * K);
    if (only) { g.fillStyle = 'rgba(251,250,247,.82)'; g.fillRect(sx(0), sy(PIC.h), PIC.w * K, PIC.h * K); drawLegs(g, plan().filter(q => q.pencil === only)); }
  } else if (S.view === 'contour') drawContour(g);
  else drawLegs(g, plan());
  drawMarks(g);
  if (SHOW_PTS) drawPoints(g);
  // F, the frame, as OPM-W's, its size by it, the picture round it veiled; the one being dragged while it is. Solid, not dashed: the walls' line here is dashed
  const F = fgrab?.f ?? S.frames[S.pic];
  if (F) {
    const fx = sx(F.x0), fy = sy(F.y1), fw = (F.x1 - F.x0) * K, fh = (F.y1 - F.y0) * K;
    g.save(); g.fillStyle = 'rgba(251,250,247,.74)'; g.beginPath(); g.rect(sx(0), sy(PIC.h), PIC.w * K, PIC.h * K); g.rect(fx, fy, fw, fh); g.fill('evenodd');
    g.strokeStyle = '#EB7A25'; g.lineWidth = 2; g.strokeRect(fx, fy, fw, fh);
    g.fillStyle = '#B3470C'; g.font = '600 11px ui-monospace, Menlo, monospace'; g.textAlign = 'left';
    g.fillText(`frame ${fmt(F.x1 - F.x0, 0)} × ${fmt(F.y1 - F.y0, 0)} mm`, fx, fy - 6); g.restore();
  }
  // the brush's reach, the walls, with the canvas as it lies
  const W = reach(), c = placeNow(), x0 = W.y.min - c.edgeLeft, x1 = W.y.max - c.edgeLeft, y0 = W.x.min - c.edgeBottom, y1 = W.x.max - c.edgeBottom;
  g.save(); g.setLineDash([6, 4]); g.strokeStyle = '#EB7A25'; g.lineWidth = 1.2; g.strokeRect(sx(x0), sy(y1), (x1 - x0) * K, (y1 - y0) * K); g.restore();
  // the line the pen is on, DRAW BW's
  if (NOW?.line) { g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = Math.max(2, 1.6 * K); g.strokeStyle = '#EB7A25'; linePath(g, NOW.line); g.stroke(); }
  // the cell the brush is on
  if (NOW?.cell) { g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = Math.max(2, 1.6 * K); g.strokeStyle = '#EB7A25'; legsPath(g, NOW.cell); g.stroke(); }
  // ▶ Play's brush, a ring in its jar's colour, orange on the idle run
  if (PLAY?.tip) { g.fillStyle = PLAY.q.hex; g.strokeStyle = PLAY.q.idle ? '#EB7A25' : '#24221F'; g.lineWidth = PLAY.q.idle ? 2.5 : 1.5; g.beginPath(); g.arc(sx(PLAY.tip[0]), sy(PLAY.tip[1]), 5, 0, 7); g.fill(); g.stroke(); }
}
// MARKS on the screen: every strip the paper to tape there, its cells' grid, and on Drag every line's marks in its jar's colour, as wide as the brush
// the outermost points, green crosses, while the pointer is on POINTS (his own green crosses, mickey-1.png)
function drawPoints(g) {
  g.save(); g.strokeStyle = '#21C23B'; g.lineWidth = 2; g.font = '600 11px "SF Mono", ui-monospace, Menlo, monospace'; g.fillStyle = '#1C9A31';
  [[PIC.w / 2, PIC.h / 2, 'C'], ...pointsOf(PIC).map(([x, y], i) => [x, y, `P${i + 1}`])].forEach(([x, y, t]) => { const X = sx(x), Y = sy(y), r = 9; g.beginPath(); g.moveTo(X - r, Y); g.lineTo(X + r, Y); g.moveTo(X, Y - r); g.lineTo(X, Y + r); g.stroke(); g.fillText(t, X + 6, Y - 6); });   // C the canvas's centre
  g.restore();
}
function drawMarks(g) {
  const mk = marksNow();
  if (!mk?.strips.length) return;
  g.save();
  for (const s of mk.strips) {
    const [x0, y0, x1, y1] = s.box, p = 3;
    g.fillStyle = 'rgba(255,255,255,.9)'; g.strokeStyle = 'rgba(36,34,31,.45)'; g.lineWidth = 1;
    if (!PLAY) g.fillRect(sx(x0 - p), sy(y1 + p), (x1 - x0 + 2 * p) * K, (y1 - y0 + 2 * p) * K);   // ▶ Play paints the marks itself, under it
    g.strokeRect(sx(x0 - p), sy(y1 + p), (x1 - x0 + 2 * p) * K, (y1 - y0 + 2 * p) * K);
    g.fillStyle = '#B3470C'; g.font = '600 11px ui-monospace, Menlo, monospace'; g.textAlign = 'center'; g.fillText(String(s.no), sx((x0 + x1) / 2), sy(y1 + p) - 5);
  }
  if (PLAY) { g.restore(); return; }
  if (S.view === 'drag' || (lastSt && LIVE.includes(lastSt.state) && RUN_KEY === 'drag')) {
    g.lineCap = 'round'; g.lineWidth = Math.max(0.5, MARKS.trail * K * 0.92);
    for (const m of mk.M) { const j = m && SEQ[m.pass]; /* a jar `last` none: v.4's shadow */ if (!j) continue; g.strokeStyle = j.hex; for (const q of m.marks) { g.beginPath(); g.moveTo(sx(q.pts[0][0]), sy(q.pts[0][1])); g.lineTo(sx(q.pts[1][0]), sy(q.pts[1][1])); g.stroke(); } }
  } else {
    g.strokeStyle = 'rgba(36,34,31,.28)'; g.lineWidth = 1;
    for (const s of mk.strips) for (let k = 0; k < mk.n; k++) for (const row of [0, 1]) { const [x, y] = s.cell(k, row), w = MARKS.trail, h = MARKS.leg; g.strokeRect(sx(x - w / 2), sy(y + h / 2), w * K, h * K); }
  }
  g.restore();
}
const toPt = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
cv.addEventListener('wheel', e => {
  e.preventDefault();
  if (!PIC) return;
  const [px, py] = toPt(e);
  if (e.ctrlKey || e.metaKey || Math.abs(e.deltaX) < 1) {
    const f = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0022)), k = Math.max(0.05, Math.min(30, K * f));
    OX = px - (px - OX) * k / K; OY = py - (py - OY) * k / K; K = k;
  } else { OX -= e.deltaX; OY -= e.deltaY; }
  kick();
}, { passive: false });
let dragFrom = null;
// F, the frame (OPM-W's, the owner, 2026-11-08): a drag round a piece lays it, on the pitch so no column is cut down its length; a click a 200 × 200 there (a 20 × 20 canvas);
// with F on, a drag in the frame moves it, a click in it takes it away, the whole picture again. Then the hand again, the view dragged as before.
let frameOn = false, fgrab = null;
const HINT0 = $('#hint').textContent;
const FRAME_CLICK = 200;   // mm, the frame a click lays: the owner's 20 × 20 cm canvas
const toMm = e => { const [px, py] = toPt(e); return [(px - OX) / K, PIC.h - (py - OY) / K]; };
const onPitch = v => Math.round(v / PIC.pitch) * PIC.pitch, within = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const inFrame = (F, p) => !!F && p[0] >= F.x0 && p[0] <= F.x1 && p[1] >= F.y0 && p[1] <= F.y1;
function frameTool(on) {
  frameOn = on; cv.classList.toggle('frame', on); $('#btnFrame')?.classList.toggle('on', on);
  $('#hint').textContent = on ? 'F, the frame: a drag round the piece, or a click — a 200 × 200 there; a drag in the frame moves it, a click in it takes it away. Esc: the hand again.' : HINT0;
}
function setFrame(F, said) {
  if (lastSt && LIVE.includes(lastSt.state)) { warn('A run is on: the frame stays as it is till it ends or stops.'); kick(); return; }
  if (F) S.frames[S.pic] = F; else delete S.frames[S.pic];
  playStop(); only = null; PIC = picNow(S.pic); SEQ = seqOf(PIC); settle();
  if (said) $('#hint').textContent = said;
}
cv.addEventListener('pointerdown', e => {
  if (frameOn && PIC) { const p = toMm(e), F = S.frames[S.pic] ?? null; fgrab = { a: p, f0: F, move: inFrame(F, p), moved: false, f: F }; cv.setPointerCapture(e.pointerId); return; }
  dragFrom = [e.clientX, e.clientY, OX, OY]; cv.setPointerCapture(e.pointerId); cv.classList.add('drag');
});
cv.addEventListener('pointermove', e => {
  if (fgrab) {
    const p = toMm(e), a = fgrab.a;
    if (!fgrab.moved && Math.hypot(p[0] - a[0], p[1] - a[1]) * K < 4) return;
    fgrab.moved = true;
    if (fgrab.move) { const F = fgrab.f0, w = F.x1 - F.x0, h = F.y1 - F.y0, x0 = within(onPitch(F.x0 + p[0] - a[0]), 0, PIC.w - w), y0 = within(onPitch(F.y0 + p[1] - a[1]), 0, PIC.h - h); fgrab.f = { x0, y0, x1: x0 + w, y1: y0 + h }; }
    else { const cx = v => within(onPitch(v), 0, PIC.w), cy = v => within(onPitch(v), 0, PIC.h); fgrab.f = { x0: Math.min(cx(a[0]), cx(p[0])), y0: Math.min(cy(a[1]), cy(p[1])), x1: Math.max(cx(a[0]), cx(p[0])), y1: Math.max(cy(a[1]), cy(p[1])) }; }
    kick(); return;
  }
  if (dragFrom) { OX = dragFrom[2] + e.clientX - dragFrom[0]; OY = dragFrom[3] + e.clientY - dragFrom[1]; kick(); }
});
cv.addEventListener('pointerup', () => {
  dragFrom = null; cv.classList.remove('drag');
  if (!fgrab) return;
  const q = fgrab; fgrab = null; frameTool(false);
  if (!q.moved && q.move) return setFrame(null, 'Frame taken away: the whole picture. F lays another.');
  if (!q.moved) { const w = Math.min(FRAME_CLICK, PIC.w), h = Math.min(FRAME_CLICK, PIC.h), x0 = within(onPitch(q.a[0] - w / 2), 0, PIC.w - w), y0 = within(onPitch(q.a[1] - h / 2), 0, PIC.h - h); return setFrame({ x0, y0, x1: x0 + w, y1: y0 + h }); }
  const F = cleanFrame(q.f, PIC.pitch);
  if (F) setFrame(F); else kick();
});
addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.('input, select, textarea') || !$('#drawAsk').hidden) return;
  if (e.key.toLowerCase() === 'f') { e.preventDefault(); frameTool(!frameOn); }
  else if (e.key === 'Escape' && frameOn) frameTool(false);
});
cv.addEventListener('dblclick', () => { if (PIC) { fit(); kick(); } });
new ResizeObserver(layout).observe(stage);

// ▶ Play: the run as it will go, OPM-N's clock, slow at first, the first cells to be read, faster as it goes (the clock squared), three minutes; the idle runs walked but not drawn, so that the % and the time are the run's.
// The LCD follows it (the owner, 2026-11-06: "Play: an interaction with PROGRESS, so that the colours and the % show on the screen"), a run on the machine before it. A view: it moves nothing.
function playStop() {
  if (!PLAY) return;
  cancelAnimationFrame(PLAY.raf); clearTimeout(PLAY.end); PLAY = null;
  $('#btnPlay').textContent = '▶ Play'; $('#btnPlay').classList.remove('on');
  markRun(-1); lcd(lastSt); kick();
}
$('#btnPlay').onclick = () => {
  if (PLAY) return playStop();
  if (!PIC) return;
  const passes = plan(), list = [], s = 2, off = document.createElement('canvas'), c = off.getContext('2d');
  let mm = 0;
  for (const r of withMarks(DABS ? dabRunsOf(passes) : brushRuns(passes, S.dipEvery, S.dipLap, CANON_RUN, R3RUN.slack), passes, SEQ, marksNow()?.M)) {
    const hex = jarOf(passes[r.pass].pencil).hex;
    r.pts.slice(1).forEach((b, i) => { const a = r.pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L > 0) list.push({ a, b, from: mm, to: (mm += L), hex, n: r.pass, num: r.num, idle: r.idle, dab: !!r.dab, mark: r.mark ? r.say : null }); });
  }
  if (!list.length) return;
  off.width = PIC.w * s; off.height = PIC.h * s; c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = PIC.pitch * s * 0.92;
  const spans = {}; for (const q of list) { const w = spans[q.n] ??= [q.from, q.to]; w[1] = q.to; }   // every line's mm, from its first piece to its last: THE JAR's bar
  const Q = PLAY = { cv: off, mm, want: 0, n: 0, q: list[0], tip: null, at: null, i: 0, t0: performance.now(), said: 0, ids: passes.map(q => q.pencil), seconds: paintRun().seconds, metres: passes.reduce((a, q) => a + q.mm, 0), spans };
  $('#btnPlay').textContent = '■ Stop'; $('#btnPlay').classList.add('on');
  const step = () => {
    if (PLAY !== Q) return;
    const t = performance.now(), u = Math.min(1, (t - Q.t0) / PLAY_MS);
    Q.want = u < 1 ? mm * u * u : mm;
    while (Q.i < list.length && list[Q.i].from <= Q.want) {
      const q = list[Q.i], f = Math.min(1, (Q.want - q.from) / (q.to - q.from)), p = [q.a[0] + (q.b[0] - q.a[0]) * f, q.a[1] + (q.b[1] - q.a[1]) * f], o = Q.at ?? q.a;
      if (q.dab) { if (f >= 1) { c.fillStyle = q.hex; c.beginPath(); c.ellipse((q.a[0] + q.b[0]) / 2 * s, (PIC.h - (q.a[1] + q.b[1]) / 2) * s, PIC.pitch * 0.6 * s, (Math.abs(q.b[1] - q.a[1]) / 2 + PIC.pitch * 0.3) * s, 0, 0, 7); c.fill(); } }   // a drop, as HOLO draws a puddle
      else if (!q.idle) { c.strokeStyle = q.hex; c.beginPath(); c.moveTo(o[0] * s, (PIC.h - o[1]) * s); c.lineTo(p[0] * s, (PIC.h - p[1]) * s); c.stroke(); }
      Q.q = q; Q.tip = p;
      if (f < 1) { Q.at = p; break; }
      Q.at = null; Q.i++;
    }
    const jar = Q.q.n !== Q.n;
    Q.n = Q.q.n;
    if (jar || t - Q.said > 120 || u === 1) { Q.said = t; lcd(lastSt); }
    kick();
    if (Q.i < list.length) Q.raf = requestAnimationFrame(step); else { Q.tip = null; Q.end = setTimeout(playStop, 1200); }
  };
  lcd(lastSt);
  Q.raf = requestAnimationFrame(step);
};

// ---------- the panel ----------
function showKeys() {
  document.querySelectorAll('#views [data-view]').forEach(b => b.classList.toggle('on', b.dataset.view === S.view));
  document.querySelectorAll('#lib .fg-card').forEach(b => b.classList.toggle('on', b.dataset.id === S.pic));
}
function showPanel() {
  if (!PIC) return;
  const P = plan(), R = paintRun(), c = placeNow(), rg = rangeOf(), bad = walls(R), two = P.filter(q => q.layer === 2).length;
  const L = $('#fLeft'), B = $('#fBottom');
  if (document.activeElement !== L) L.value = c.edgeLeft;
  if (document.activeElement !== B) B.value = c.edgeBottom;
  $('#placeRead').innerHTML = `${bad ? `<span class="warn">${esc(bad)}</span><br>` : ''}Within the walls for this picture: left edge ${fmt(rg.left[0], 0)} … ${fmt(rg.left[1], 0)}, bottom edge ${fmt(rg.bottom[0], 0)} … ${fmt(rg.bottom[1], 0)} mm (the dashed line on the screen).`;
  if (pressOk()) $('#placeRead').insertAdjacentHTML('afterbegin', `<b>The lowest legs' lift-outs pressed against the bottom wall</b>: the carriage would go ${fmt(pressOk(), 1)} mm past it (${fmt(PRESS_OK[PIC.id], 0)} at most for this picture, the stop 9.45), so it stops at the wall; no leg gone (the owner's word: ${PIC.id === 'porsche-targa' ? '“keep 853 mm”, 2026-11-16' : '“yes”, 2026-11-10'}, est.).<br>`);
  showMarks();
  const F = PIC.frame, all = LIB[S.pic].jars.length, nb = $('#btnNoFrame');
  if (nb) nb.disabled = !F;
  if ($('#frameRead')) $('#frameRead').innerHTML = F ? `<b>Frame ${frameSize()} mm</b>, its bottom left corner ${fmt(F.x0, 0)} → ${fmt(F.y0, 0)} ↑ mm from the picture's: lay its canvas with the left edge <b>${frameHome().left}</b> and the bottom edge <b>${frameHome().bottom}</b> mm from home. ${PIC.jars.length} of the ${all} jars in it, ${P.length} lines of the list, ${fmt(R.mm / 1000, 1)} m of brush, ≈ ${hm(R.seconds)} (est.).`
    : 'No frame: the whole picture. F, or Frame, lays one round a piece to try first, at its place from home: a click a 200 × 200 there, a drag any size.';
  for (const [id, k] of [['#fSpeed', 'speed'], ['#fEvery', 'dipEvery'], ['#fLap', 'dipLap'], ['#fOver', 'over'], ['#fPen', 'penSpeed'], ['#fTravel', 'travel']]) if ($(id) && document.activeElement !== $(id)) $(id).value = S[k];
  if ($('#bwRead')) { const O = penRun('outline'), A = penRun('all'); $('#bwRead').innerHTML = O.lines ? `DRAW BW: the outline alone ${fmt(O.mm / 1000, 1)} m, ≈ ${hm(O.seconds)}; every border ${A.lines} lines, ${fmt(A.mm / 1000, 1)} m, ≈ ${hm(A.seconds)} (est.).` : ''; }
  $('#runList').innerHTML = P.map((q, i) => { const j = jarOf(q.pencil); return `${q.layer === 0 && !i ? '<li class="fg-sep">Under · the motion blur, first</li>' : ''}${q.layer === 1 && P[i - 1]?.layer === 0 ? '<li class="fg-sep">The picture · over the dry layer under</li>' : ''}${q.layer === 2 && P[i - 1].layer === 1 ? '<li class="fg-sep">Layer 2 · over the dry first layer</li>' : ''}${j.last && !jarOf(P[i - 1]?.pencil)?.last ? '<li class="fg-sep">Last · over the finished picture</li>' : ''}<li data-id="${esc(j.id)}" data-i="${i}" class="${only === j.id ? 'only' : ''}" title="${esc(j.name)}${j.was ? ` in place of ${esc(j.was.name)}` : ''}:${q.cells} cells, ${q.tracks} legs, ${fmt(q.mm / 1000, 1)} m of brush${q.fill ? `; ${FILL_SAY[q.fill]}` : ''}. A click shows its legs"><span class="no">${i + 1}</span><i class="sw" style="background:${j.hex}"></i><span class="nm">${esc(j.name)}${j.was ? ` <em>${esc(j.was.name)}</em>` : ''}${j.code ? ` <em>${esc(j.code)}</em>` : ''}</span><span class="tg">${q.fill ? `${FILL_WORD[q.fill]} · ` : ''}${q.mm >= 1000 ? `${fmt(q.mm / 1000, 1)} m` : `${Math.round(q.mm)} mm`}</span>${JARS_ON ? `<button class="swap" data-swap="${esc(j.jar ?? j.id)}" title="🔄 Replace: paint ${esc(j.was?.name ?? j.name)} with one of your jars, or name the new jar you mixed for it" aria-label="Replace ${esc(j.name)}">🔄</button>` : ''}</li>`; }).join('');
  $('#jarsHint').textContent = two ? `${P.length} lines, ${PIC.jars.length} jars, light to dark` : `${P.length}, light to dark`;
  $('#stats').textContent = `${PIC.w / 10} × ${PIC.h / 10} cm${PIC.frame ? ` · frame ${frameSize()} mm` : ''}`;
  jarsRead();
  showBrush();
}
// MARKS: where to tape the paper, mm from the canvas's own edges; what has no room, and why
function showMarks() {
  const b = $('#btnMarks'), r = $('#marksRead');
  if (!b || !r) return;
  b.classList.toggle('on', S.marks !== false); b.setAttribute('aria-pressed', String(S.marks !== false));
  if (S.marks === false) { r.innerHTML = 'MARKS off: no marks at the edges.'; return canvasReads(); }
  if (PIC.frame) { r.innerHTML = 'MARKS: none in a frame — the whole picture only.'; return canvasReads(); }
  const mk = marksNow(), mm = v => fmt(v, 0);
  r.innerHTML = (mk.strips.length ? `<b>MARKS</b>, ${mk.n} cells a strip, a jar's first coat at the edge's side, its second next to it; after every jar change one dip, then its marks in this order. Tape the paper: `
    + mk.strips.map(s => `<b>${sideSay(s)}</b> ${mm(s.box[0])}–${mm(s.box[2])} → · ${mm(s.box[1])}–${mm(s.box[3])} ↑${Math.abs(s.shift) >= 0.5 ? ` (${mm(Math.abs(s.shift))} mm ${s.side === 'left' || s.side === 'right' ? (s.shift > 0 ? 'above' : 'below') : (s.shift > 0 ? 'right of' : 'left of')} the middle: the reach)` : ''}`).join('; ') + ' mm from the canvas\'s left and bottom edges (the white strips on the screen; est.). ' : '<span class="warn">MARKS: no room for a strip anywhere.</span> ')
    + mk.missing.map(q => `No ${q.side} strip (${q.no}): ${q.why}.`).join(' ');
  canvasReads();
}
// The canvas's reads, the walls, the frame and MARKS, behind its (i) (the owner, 2026-11-11: "hide these two poems, about the canvas and
// the Marks, under an (i)"); since 2026-11-22, the evening, a warning too (README, "The panel: no notes on it": "it is forbidden to make noise and mush in
// the control panel … all of it is needed, but under the pop-up info button (i)"): the (i) its colour, steady, the text behind it
let CANVAS_INFO = false;
function canvasReads() {
  const ids = ['#placeRead', '#frameRead', '#marksRead'];
  for (const id of ids) { const p = $(id); if (p) p.hidden = !CANVAS_INFO; }
  $('#canvasInfo')?.classList.toggle('on', CANVAS_INFO);
  $('#canvasInfo')?.classList.toggle('warn', !!$('#placeRead')?.querySelector('.warn'));   // past the walls alone: MARKS with no room is no fault, it would colour it always
}
// any other read behind its own (i): <button class="info" data-for="#dabRead">
document.querySelectorAll('.info[data-for]').forEach(b => { b.onclick = () => { const t = $(b.dataset.for); if (!t) return; t.hidden = !t.hidden; b.classList.toggle('on', !t.hidden); }; });
if ($('#canvasInfo')) $('#canvasInfo').onclick = () => { CANVAS_INFO = !CANVAS_INFO; canvasReads(); };
if ($('#btnMarks')) $('#btnMarks').onclick = () => {
  if (lastSt && LIVE.includes(lastSt.state)) return warn('A run is on: MARKS stay as they are till it ends or stops.');
  S.marks = S.marks === false; settle();
};
// a card's (i), on hover (the owner, 2026-11-06: under the preview's text "we do in an (i), on hover"): that picture's numbers, by its own plan and its own place on the canvas, once for the numbers as they are
const READS = new Map();
function readOf(id) {
  if (READS.has(id)) return READS.get(id);
  const was = [PIC, SEQ];
  PIC = withJars(LIB[id], JARS.swaps[id]); SEQ = seqOf(PIC);
  try {
    const all = PIC.jars.flatMap(j => j.cells), P = plan(), R = paintRun(), n0 = P.filter(q => q.layer === 0).length, n1 = P.filter(q => q.layer <= 1).length, two = P.length - n1, t2 = two ? paintRun(n1).seconds : 0;
    const out = `<b>${esc(PIC.title)}</b>, ${esc(PIC.sub)}: ${PIC.columns} columns ${fmt(PIC.pitch, 0)} mm apart, ${PIC.jars.length} jars, ${all.length} cells, ${all.reduce((a, q) => a + q.legs.length, 0)} legs.`
      + (n0 ? ` <b>Under first:</b> the motion blur, ${n0} lines, to dry before the picture.` : '') + (DABS ? ` Dabs: every leg a dab of its own, ≈ ${PIC.dab?.aim ?? 20} mm, the brush ${fmt(PIC.pitch, 0)} mm, a dip each, one stroke down, nothing after it; gap ${DAB_SAY.gap(dabGap())}, run +${S.dabRun} · +${S.dabRun} mm.` : '') + (DABS ? '' : ` Drops first: ${P.filter(q => q.fill === 'zone').length} zone lines, their drops on dips of their own, then one snake a cell and back; ${P.filter(q => q.fill === 'strokes').length} stroke lines, a dip a leg, each leg again the same way${P.some(q => q.fill === 'mixed') ? `; ${P.filter(q => q.fill === 'mixed').length} lines of both, each cell its own colour's` : ''}.`)
      + (two ? ` <b>Two layers:</b> ${n1} lines of the list, ≈ ${hm(R.seconds - t2)} (est.), the first layer to dry, then ${layer2Say(P)}, ≈ ${hm(t2)} (est.).` : ` One layer, ≈ ${hm(R.seconds)} (est.).`)
      + ` ${fmt(R.mm / 1000, 1)} m of brush, ${R.dips} dips, the jars' changes by hand apart.`;
    READS.set(id, out);
    return out;
  } finally { [PIC, SEQ] = was; }
}
function popShow(el) {
  const pop = $('#libPop'), r = el.getBoundingClientRect();
  pop.innerHTML = readOf(el.dataset.read); pop.hidden = false;
  const w = pop.offsetWidth, h = pop.offsetHeight, x = $('.fg-shelf').getBoundingClientRect().right + 8, side = x + w <= innerWidth - 8 && innerWidth > 760;   // to the right of the library, over the picture's free room (the library on the left since 2026-11-11); on a phone under the (i)
  pop.style.left = `${side ? x : Math.max(8, Math.min(innerWidth - w - 8, r.right - w))}px`;
  pop.style.top = `${Math.max(8, Math.min(innerHeight - h - 8, side ? r.top - h + 24 : r.bottom + 6))}px`;
}
const popHide = () => { $('#libPop').hidden = true; };
{
  const lib = $('#lib'), inf = e => e.target.closest('.info');
  lib.addEventListener('mouseover', e => { if (inf(e)) popShow(inf(e)); });
  lib.addEventListener('mouseout', e => { if (inf(e)) popHide(); });
  lib.addEventListener('focusin', e => { if (inf(e)) popShow(inf(e)); });
  lib.addEventListener('click', e => { if (inf(e)) popShow(inf(e)); });
  lib.addEventListener('focusout', popHide);
  addEventListener('pointerdown', e => { if (!inf(e)) popHide(); });                  // a finger has no hover: a tap on the (i) shows it, a tap elsewhere takes it away
}
function markRun(at) { [...$('#runList').children].forEach(q => { const i = q.dataset.i === undefined ? -2 : +q.dataset.i; q.classList.toggle('now', i === at); q.classList.toggle('done', at >= 0 && i >= 0 && i < at); }); }
function settle() { RUNS.clear(); PLAN.clear(); RANGE.clear(); READS.clear(); PENRUNS.clear(); MARKSNOW.clear(); save(); showKeys(); showPanel(); showDabs(); kick(); }
$('#lib').onclick = async e => {
  const b = e.target.closest('.fg-card'); if (!b) return;
  if (lastSt && LIVE.includes(lastSt.state) && S.runPic && b.dataset.id !== S.runPic) return warn(`A run of ${esc(LIB[S.runPic]?.title ?? S.runPic)} is on: the library stays on it till the run ends or stops — the board's steps are read by its plan, its jars by its names.`);
  choose(b.dataset.id);
};
// a picture chosen in the library; while a run is on, the page keeps to the run's own (the owner, 2026-11-11: the classic's v.1 running, its v.2 card clicked to
// look at it — the LCD read the board's steps by v.2's plan, "Jar 1 · 1/63", 0 %, and v.2's jar numbers, one ahead of v.1's from its Jar 2 on, were taken for
// the run's: "the 7th is orange and the 8th grey")
function choose(id) { playStop(); popHide(); only = null; S.pic = id; PIC = picNow(S.pic); SEQ = seqOf(PIC); frameTool(false); fitted = ''; layout(); showKeys(); showPanel(); showDabs(); save(); }
function runPicture(st) {                                                             // a page opened during a run: back on its picture
  if (st && LIVE.includes(st.state) && S.runPic && S.pic !== S.runPic && LIB[S.runPic]) choose(S.runPic);
  // and its run's lines, the line it started from with them (PROGRESS, the LCD's jar), when the plan here gives the very blocks the board has
  if (st && LIVE.includes(st.state) && !RUN_INFO && S.runKey === 'drag' && S.pic === S.runPic && PIC) {
    const R = paintRun(S.runFrom ?? 0), C = Number.isInteger(S.runCut) ? cutOf(R, S.runCut) : null, B = C ? C.blocks : R.blocks;   // a run from the break: its own cut of the plan
    if (B.length === st.blocks) { RUN = B; RUN_KEY = 'drag'; RUN_INFO = { seconds: C ? C.seconds : R.seconds, rows: R.rows, passes: R.passes.map(q => q.pencil), from: S.runFrom ?? 0, ...(C ? { cut: C, full: R.blocks } : {}) }; }
  }
}
$('#views').onclick = e => { const b = e.target.closest('[data-view]'); if (!b) return; playStop(); S.view = b.dataset.view; save(); showKeys(); kick(); };
$('#runList').onclick = e => { const sw = e.target.closest('[data-swap]'); if (sw) { e.stopPropagation(); return swapShow(sw); } const li = e.target.closest('li[data-id]'); if (!li) return; only = only === li.dataset.id ? null : li.dataset.id; [...$('#runList').children].forEach(q => q.classList.toggle('only', q.dataset.id === only)); kick(); };
for (const [id, k, lo, hi] of [['#fSpeed', 'speed', 5, 120], ['#fEvery', 'dipEvery', 0, 200], ['#fLap', 'dipLap', 0, 30], ['#fOver', 'over', 0, 8], ['#fPen', 'penSpeed', 5, 120], ['#fTravel', 'travel', 20, 180]]) {
  if ($(id)) $(id).onchange = e => { const v = +e.target.value; if (Number.isFinite(v)) S[k] = Math.max(lo, Math.min(hi, v)); e.target.value = S[k]; settle(); };
}
// GOGH's THE BRUSH as sliders (the owner, 2026-11-22, the evening: "can this block be made as sliders … I want to try a faster dip"): the brush's speed and the
// carriage's travel the page's own (S), from the next DRAG; the dip's shoulder (swing, °/s) and its time in the paint (dwell, s) INK-Y's own, ink.json by
// /ink as INK-Y writes it, so every tab dips alike — not while a run is on (rembrandt.py's own dips read it). The elbow turns at the firmware's own, ≈ 53°/s
// the elbow's in a dip (2026-11-22: "220 is the ceiling … test 70, then step by step"): none at first, the firmware's own down and ELBOW_UP_SPEED, 28, up — shown 28
const BRUSH_SL = { speed: [5, 120, 1, 'mm/s'], travel: [20, 180, 5, 'mm/s'], swing: [SWING_MIN, SWING_MAX, 5, '°/s'], elbow: [ELBOW_V_MIN, ELBOW_V_MAX, 5, '°/s'], dwell: [0, 3, 0.1, 's'] };
const INK_KEYS = ['swing', 'elbow', 'dwell'];
const brushNow = k => k === 'elbow' ? cup().elbow ?? ELBOW_V_NONE : INK_KEYS.includes(k) ? cup()[k] : S[k];
function showBrush() {
  if (!$('#speedSl')) return;
  for (const [k, [, , st, u]] of Object.entries(BRUSH_SL)) { const sl = $(`#${k}Sl`), v = brushNow(k); if (document.activeElement !== sl) sl.value = v; $(`#${k}Now`).textContent = `${fmt(v, st < 1 ? 1 : 0)} ${u}`; }
  const c = cup(), d = handDipS(c);
  $('#brushRead').innerHTML = `Speed: the brush along a dab. Travel: the carriage with the brush up — 180 slipped the X belt with the jar on the carriage (2026-11-10). The dip, INK-Y's, every tab's: `
    + `the shoulder to ${fmt(Math.abs((c.to[0] + c.to[1]) / 2), 1)}° and back at ${fmt(c.swing, 0)}°/s${c.est?.swing ? ' (est.)' : ''}, the brush ${fmt(c.dwell, 1)} s in the paint, the elbow's three turns ${c.elbow ? `at ${fmt(c.elbow, 0)}°/s` : 'at 28°/s up, the firmware\'s 53 down'}: ≈ ${fmt(d, 1)} s a dip (est.). The firmware's J since 2026-11-22 as fast as 220°/s, its acceleration by its speed; a board not flashed since stops at 105. `
    + `From the next DRAG; the dip's two not while a run is on.`;
}
let inkT = null;
async function setBrush(k, v) {
  const [lo, hi, st] = BRUSH_SL[k], now = Math.round(Math.min(hi, Math.max(lo, +v || 0)) / st) * st, q = +now.toFixed(2);
  if (INK_KEYS.includes(k)) {
    if (lastSt && LIVE.includes(lastSt.state)) { warn('A run is on: the dip stays as it is till it ends or stops — INK-Y\'s, rembrandt.py dips by it.'); return showBrush(); }
    INK = { ...INK, hand: { ...(INK.hand ?? {}), [k]: q } }; showBrush(); settle();
    clearTimeout(inkT); inkT = setTimeout(async () => {
      try { const r = await fetch('/ink', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(INK, null, 2) }); if (!r.ok) warn(`The dip not saved: ${await r.text()}`); } catch { warn('The dip not saved: start rembrandt.py'); }
    }, 400);
    return;
  }
  S[k] = q; save(); showBrush(); settle();
}
document.querySelectorAll('.brushsl input[data-bk]').forEach(sl => { sl.oninput = () => { const k = sl.dataset.bk, [, , st, u] = BRUSH_SL[k]; $(`#${k}Now`).textContent = `${fmt(+sl.value, st < 1 ? 1 : 0)} ${u}`; }; sl.onchange = () => setBrush(sl.dataset.bk, +sl.value); });
document.querySelectorAll('.brushsl button[data-bk]').forEach(b => { b.onclick = () => setBrush(b.dataset.bk, brushNow(b.dataset.bk) + +b.dataset.step); });
if ($('#btnFrame')) $('#btnFrame').onclick = () => frameTool(!frameOn);
if ($('#btnNoFrame')) $('#btnNoFrame').onclick = () => { frameTool(false); if (S.frames[S.pic]) setFrame(null, 'Frame taken away: the whole picture. F lays another.'); };
for (const [id, k] of [['#fLeft', 'edgeLeft'], ['#fBottom', 'edgeBottom']]) {
  $(id).onchange = e => { const v = +e.target.value; if (Number.isFinite(v)) placeNow()[k] = Math.round(v); e.target.value = placeNow()[k]; settle(); };
}

// ---------- the LCD, OPM-N's ----------
const mmss = t => { t = Math.max(0, Math.round(t || 0)); return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
// THE JAR's bar, the second (the owner, 2026-11-17, FORM-G/Screenshot 2026-11-17 at 12.39.10 PM.png: "a second scale, which counts the % of the current paint and when
// to prepare a new jar"; "both thin: the first's sticks half as high, and the second the same, neat"): the line now — its jar — its paint done of its own, by the
// steps' painted mm, its % where PAINTING was, and the time to its last step, the next jar's pause, by the steps left in it, as LEFT and the iPhone's remote count
// them (pace_s). Nothing blinks (the owner, the same hour: "can the blinking go? with my ADHD it raises anxiety"). ▶ Play by its mm, the time the plan's; no run,
// the first line's whole time
let SPANS = null;
function spansOf(blocks, rows) {
  if (SPANS?.blocks === blocks && SPANS.rows === rows) return SPANS;
  const by = new Map(), line = new Array(blocks.length), cum = new Array(blocks.length);
  for (let i = blocks.length - 1, k = -1; i >= 0; i--) { const r = blocks[i].row > 0 ? rows?.[blocks[i].row - 1] : null; if (r) k = r.pass; line[i] = k; }   // a jar's pause before it is its own
  blocks.forEach((b, i) => { const k = line[i]; if (k < 0) return; const w = by.get(k) ?? { first: i, last: i, mm: 0 }; cum[i] = w.mm; w.mm += b.paintMM || 0; w.last = i; by.set(k, w); });
  return (SPANS = { blocks, rows, by, cum });
}
function jarBar(o) {
  const { Q, live, st, k, R, sps } = o;
  if (!R?.blocks?.length || k < 0) return null;
  const S_ = spansOf(R.blocks, R.rows), w = S_.by.get(k);
  if (!w) return null;
  const whole = (w.last - w.first + 1) * sps;   // the line's time by its steps, the plan's seconds a step (est.)
  if (Q) { const m = Q.spans?.[Q.n], f = m ? Math.max(0, Math.min(1, (Q.want - m[0]) / Math.max(1e-6, m[1] - m[0]))) : 0; return { f, left: whole * (1 - f) }; }   // ▶ Play: its mm, the time the plan's
  if (!live) return { f: 0, left: whole };
  const b = st.block, done = b < w.first ? 0 : b > w.last ? w.mm : S_.cum[b] ?? 0;
  return { f: w.mm > 0 ? done / w.mm : (b - w.first) / Math.max(1, w.last - w.first + 1), left: Math.max(0, w.last + 1 - Math.max(b, w.first)) * sps };
}
const inMin = t => t < 60 ? 'under a min' : t < 3600 ? `${Math.round(t / 60)} min` : `${Math.floor(t / 3600)} h ${String(Math.round(t % 3600 / 60)).padStart(2, '0')}`;
const lcdTime = t => (t || 0) < 3600 ? segments(mmss(t), 17) : `<span class="hm">${segments(String(Math.floor(t / 3600)), 17)}<span class="tu">h</span>${segments(String(Math.floor(t % 3600 / 60)).padStart(2, '0'), 17)}<span class="tu">min</span></span>`;
function lcd(st) {
  const P_ = paintRun(), live = st && LIVE.includes(st.state);
  const Q = PLAY && !live ? PLAY : null;                                              // ▶ Play, nothing running: the run as it would go — how far, the time left (est.), its jar now
  const runPct0 = Q ? Q.want / Q.mm * 100 : st && st.state !== 'idle' ? (st.state === 'done' ? 100 : st.percent || 0) : 0;
  // a run from the break (cutOf): the board's per cent is of what was left after the cut — the run's share before it added, so PROGRESS goes on where it broke off
  const cut = !Q && st && st.state !== 'idle' && RUN_KEY === 'drag' ? RUN_INFO?.cut ?? null : null, off = cut ? cut.offset : 0;
  const runPct = cut?.paint ? (cut.before + runPct0 / 100 * (cut.paint - cut.before)) / cut.paint * 100 : runPct0;
  const R_ = live && RUN_INFO ? RUN_INFO : P_;
  // a DRAG from a later line of the list (Start from, after a STOP or on another day): PROGRESS the whole picture's, the lines before it done, the run's own share after them
  // (the owner, 2026-11-11: "I take them home by Stop, Home. That puts PROGRESS back to zero, the % on the screen go off"); the time left the run's, the total the picture's
  const from = !Q && st && st.state !== 'idle' && RUN_KEY === 'drag' ? RUN_INFO?.from ?? 0 : 0, all = plan();
  const mm0 = from ? all.slice(0, from).reduce((a, q) => a + q.mm, 0) : 0, mmAll = from ? all.reduce((a, q) => a + q.mm, 0) : 0;
  const pct = from && mmAll ? (mm0 + runPct / 100 * (mmAll - mm0)) / mmAll * 100 : runPct;
  // the time left by steps (the owner, 2026-11-12: "measuring by steps is a great idea"; rembrandt.py, PACE_MIN_S): the steps left, each
  // its seconds on the runner's own clock, a pause's time out (pace_s) — before there are enough of them, the plan's over its steps
  const runTotal = Q ? Q.seconds : R_.seconds, total = from ? P_.seconds : runTotal, steps = !Q && live && st.blocks ? Math.max(0, st.blocks - st.block) : 0;
  const left = !Q && live && st.blocks ? steps * (st.pace_s > 0 ? st.pace_s : runTotal / st.blocks) : runTotal * (1 - runPct / 100);
  const state = Q ? 'play' : !st ? (VIEW ? 'library' : 'no server') : live ? (st.state === 'paused' ? 'paused' : 'live') : st.state === 'idle' ? 'plan' : st.state;
  const b = st && RUN?.[st.block], row = live && st.row ? R_.rows?.[st.row - 1] : null;
  const waiting = st?.state === 'paused' && st.message;
  paused = ['paused', 'pausing'].includes(st?.state);
  const keyEl = $('#btnPause');
  keyEl.querySelector('span').textContent = paused ? 'Cont.' : 'Pause'; keyEl.classList.toggle('call', paused); keyEl.disabled = !live;
  $('#btnHome').disabled = !!live; $('#btnBack').disabled = !live || RUN_KEY === 'bw';   // DRAW BW has no cells to go back to
  $('#btnDrag').classList.toggle('on', !!live && RUN_KEY === 'drag'); $('#btnTest').classList.toggle('on', !!live && RUN_KEY === 'test'); $('#btnPoints')?.classList.toggle('on', !!live && RUN_KEY === 'points'); $('#btnBw')?.classList.toggle('on', !!live && RUN_KEY === 'bw');
  showElbow();
  const ids = Q ? Q.ids : (live && RUN_INFO?.passes) || P_.passes.map(q => q.pencil), pid = Q ? Q.ids[Q.n] : row?.pencil ?? (!live ? ids[0] : null), j = pid && jarOf(pid), nx = j && jarOf(ids[ids.indexOf(pid) + 1]);
  const cellNow = row?.cells?.[0]?.[0];
  const runRows = live ? R_.rows : P_.rows, J = !j ? null : jarBar({ Q, live, st: off && st ? { ...st, block: st.block + off } : st, k: Q ? Q.n : (live ? ids : P_.passes.map(q => q.pencil)).indexOf(pid), R: live ? { blocks: RUN_INFO?.full ?? RUN, rows: runRows } : P_, sps: live && st.blocks ? (st.pace_s > 0 ? st.pace_s : runTotal / st.blocks) : (P_.blocks?.length ? P_.seconds / P_.blocks.length : 0) });
  const list = all, at = pid ? list.findIndex(q => q.pencil === pid) : -1;   // the line's place in the whole list, a run from a later line too
  if (live || Q) markRun(at);
  if (live) { NOW = RUN_KEY === 'bw' ? { line: st.row ? contour(RUN_INFO?.bw).lines[st.row - 1] : null } : row?.mark ? {} : { cell: list[at]?.byCell[(cellNow ?? 1) - 1] }; kick(); } else if (NOW?.cell) { NOW = null; if (!Q) markRun(-1); kick(); }
  const now = Q ? `${Q.q.mark ? `${Q.q.mark[0].toUpperCase()}${Q.q.mark.slice(1)}` : `Cell ${Q.q.num}${Q.q.idle ? ', idle' : ''}`} · ${fmt(pct / 100 * Q.metres / 1000, 1)} of ${fmt(Q.metres / 1000, 1)} m · est.` : waiting ? `❚❚ ${st.message}` : live && b?.home ? (RUN_KEY === 'home' ? 'HOME · the brush up, the carriage to home' : 'done · the carriage goes home, the brush off') : live && b?.wipe ? `${row?.label ?? ''} · the brush up to be wiped` : live && row && b?.dip ? `${row.label} · the dip in the cup` : live && row ? row.label + (RUN_KEY === 'bw' ? (st.brush_on ? ' · the pen on' : ' · the pen up') : st.brush_on ? ' · brush on' : ' · brush off') : PIC ? `${PIC.title} · ${fmt(P_.mm / 1000, 2)} m` : '';
  $('#lcd').innerHTML = `
    <div class="lcd-top"><span>${state === 'live' || Q ? '▶ ' : state === 'paused' ? '❚❚ ' : ''}${state}${live && RUN_KEY ? ` · ${{ test: 'TEST', points: 'POINTS', home: 'HOME', drag: 'DRAG', bw: 'DRAW BW' }[RUN_KEY]}${st.trim ? ` ${sgn(st.trim)}` : ''}` : ''}</span><span>${Q ? `${fmt(pct / 100 * Q.metres / 1000, 2)} m` : live && st.blocks ? `step ${st.block + 1 + off}/${st.blocks + off}` : `${fmt(P_.mm / 1000, 2)} m`}</span></div>
    <div class="lcd-mid">
      <div class="lcd-big">${segments(String(Math.min(100, Math.floor(pct))).padStart(2, ' '), 46)}<span class="u">%</span></div>
      <div class="lcd-times"><span class="k">left</span>${lcdTime(left)}<span class="k">total</span>${lcdTime(total)}</div>
    </div>
    ${sticks(pct / 100)}
    ${j ? `<div class="lcd-pencil"><i class="sw" style="background:${j.hex}"></i><span class="pt"><span class="pn">${esc(j.name)}</span><span class="pk">${J && (live || Q) ? `${Math.min(100, Math.floor(J.f * 100))} %` : live || Q ? 'painting' : 'first'} · ${Math.max(0, at) + 1}/${list.length}</span></span>${nx ? `<span class="nx"><span class="pk">${J ? `next · ${inMin(J.left)}` : 'next'}</span><span class="nn"><i style="background:${nx.hex}"></i><span>${esc(nx.name)}</span></span></span>` : `<span class="nx"><span class="pk">the last${J ? ` · ${inMin(J.left)}` : ''}</span></span>`}</div>${J ? `<div class="lcd-jar" title="${esc(j.name)}: ${Math.floor(J.f * 100)} % of its paint; ${nx ? `${esc(nx.name)} in ≈ ${inMin(J.left)} (est.)` : 'the last jar'}">${sticks(J.f)}</div>` : ''}` : ''}
    <div class="lcd-now${waiting ? ' wait' : ''}">${now}</div>`;
}
async function watch() {
  let st = null;
  if (!VIEW) try { st = await (await fetch('/run', { cache: 'no-store' })).json(); } catch { }   // LIBRARY-G never looks at the run: its library free while FORM-G paints
  lastSt = st;
  if (!VIEW) runPicture(st);
  if (HASH) { const h = HASH; HASH = null; openHash(h, st); }   // LIB-V's link, once the run is known
  lcd(st);
  if (Date.now() - warnAt > WARN_S * 1000) $('#runState').innerHTML = VIEW ? '' : !st ? 'no server: start rembrandt.py' : st.message ? `<span class="${st.state === 'error' ? 'warn' : ''}">${esc(st.message)}</span>` : '';
}

// ---------- THE JARS: 🔄, a colour painted by one of the owner's jars (2026-11-17) ----------
const FILL_WORD = { zone: 'zone', strokes: 'strokes', mixed: 'zone · strokes', dabs: 'dabs' };
const FILL_SAY = { zone: 'a zone: its drops first, then one snake and back', strokes: 'strokes: a dip a leg, one over 45 mm its drops first, then the drag; then the leg again the same way', mixed: 'its cells a zone or strokes, each its own colour\'s', dabs: 'dabs: a dip a dab, one stroke ≈ 2 cm down, nothing after it' };
async function jarsLoad() {
  const get = async u => { try { const r = await fetch(u, { cache: 'no-store' }); return r.ok ? await r.json() : null; } catch { return null; } };
  const j = await get('/jars') ?? await get('formg/jars.json') ?? {};   // GOGH's too: the one file, rembrandt.py's /jars
  JARS = { swaps: j.swaps ?? {}, mine: j.mine ?? {}, ...(j.note ? { note: j.note } : {}) };
  CLASSIC_PLANS = (await Promise.all(CLASSIC.map(id => (DABS ? null : LIB[id]) ?? get(`formg/${id}.json`)))).filter(Boolean);
  if (VIEW) { FG_JARS = JSON.parse(JSON.stringify(JARS)); try { VER = { swaps: {}, mine: {}, label: {}, ...JSON.parse(localStorage.getItem(VER_KEY) || '{}') }; } catch { } JARS = viewJars(); }
}
// LIBRARY-G's jars: FORM-G's (jars.json) as they are; a picture changed here — by 🔄 or 📂 LOAD — its own swaps in this browser alone (VER), never written to
// jars.json: FORM-G's run and its pauses name FORM-G's jars. A picture in VER with no swaps: its own colours here, whatever FORM-G has
const VER_KEY = LIBV ? 'rembrandt.libv.jars.v01' : 'rembrandt.libg.jars.v01';
let FG_JARS = { swaps: {}, mine: {} }, VER = { swaps: {}, mine: {}, label: {} };
function viewJars() {
  const swaps = { ...FG_JARS.swaps };
  for (const [p, sw] of Object.entries(VER.swaps)) { if (Object.keys(sw).length) swaps[p] = sw; else delete swaps[p]; }
  return { swaps, mine: { ...FG_JARS.mine, ...VER.mine } };
}
const verKeep = () => { try { localStorage.setItem(VER_KEY, JSON.stringify(VER)); } catch { } };
async function jarsSave(label = 'changed here') {
  if (VIEW) {
    VER.swaps[S.pic] = { ...(JARS.swaps[S.pic] ?? {}) }; VER.label[S.pic] = label;
    VER.mine = Object.fromEntries(Object.entries(JARS.mine).filter(([k, h]) => FG_JARS.mine[k] !== h));
    verKeep(); jarsRead(); return true;
  }
  try { const r = await fetch('/jars', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(JARS, null, 1) }); if (r.ok) return true; } catch { }
  warn('THE JARS: not saved to app/formg/jars.json — restart rembrandt.py (it learnt /jars on 2026-11-17); this page keeps the change till it is reloaded.');
  return false;
}
function jarsApply() { playStop(); only = null; PIC = picNow(S.pic); SEQ = seqOf(PIC); settle(); }
const swapHide = () => { const p = $('#jarPop'); if (p) p.hidden = true; };
function swapShow(btn) {
  const pop = $('#jarPop'); if (!pop) return;
  if (lastSt && LIVE.includes(lastSt.state)) return warn('A run is on: THE JARS stay as they are till it ends or stops — the run\'s pauses name its jars.');
  const id = btn.dataset.swap, own = LIB[S.pic].jars.find(q => q.id === id), now = JARS.swaps[S.pic]?.[id];
  if (!own) return;
  const mine = myJarsOf(CLASSIC_PLANS, JARS.mine).map(q => ({ ...q, d: deltaE(own.hex, q.hex) })).sort((a, b) => a.d - b.d);
  const taken = new Set(Object.entries(JARS.swaps[S.pic] ?? {}).filter(([k]) => k !== id).map(([, v]) => v.name).concat(LIB[S.pic].jars.filter(q => q.id !== id && JAR_NAME.test(q.name) && !JARS.swaps[S.pic]?.[q.id]).map(q => q.name)));
  pop.innerHTML = `<div class="jp-head"><i class="sw" style="background:${own.hex}"></i><b>${esc(own.name)}</b> <em>${own.hex}</em>${now ? ` → <b>${esc(now.name)}</b>` : ''}<button class="jp-x" data-x aria-label="Close">✕</button></div>`
    + `<p class="jp-say">Paint it with one of your jars, the nearest in colour first (ΔE, est.). A jar already in this picture's list (•) is not merged: this colour keeps its own line at its own place, the jar a second time.</p>`
    + `<div class="jp-grid">${mine.map(q => `<button class="jp-jar${now?.name === q.name ? ' on' : ''}" data-name="${esc(q.name)}" data-hex="${q.hex}" title="${esc(q.name)} ${q.hex}${q.mine ? ', mixed since the classic' : ''}${taken.has(q.name) ? ' — in this picture already: this colour its own line all the same' : ''}"><i class="sw" style="background:${q.hex}"></i><span>${esc(q.name.replace('Jar ', ''))}${taken.has(q.name) ? '•' : ''}</span><em>${Math.round(q.d)}</em></button>`).join('')}</div>`
    + `<form class="jp-new" data-new><span>A new jar, mixed to this colour: Jar</span><input type="number" min="1" max="999" step="1" placeholder="${Math.max(48, ...Object.keys(JARS.mine).map(n => +n.slice(4) || 0)) + 1}" aria-label="The new jar's number"><button type="submit">Name it</button></form>`
    + (now ? `<button class="jp-back" data-back>↩ Back to the picture's own: ${esc(own.name)}</button>` : '');
  pop.hidden = false;
  const r = btn.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
  pop.style.left = `${Math.max(8, Math.min(innerWidth - w - 8, r.left - w - 8 > 8 ? r.left - w - 8 : r.right - w))}px`;
  pop.style.top = `${Math.max(8, Math.min(innerHeight - h - 8, r.top - 12))}px`;
  pop.dataset.id = id;
}
async function swapTo(id, name, hex) {
  const sw = { ...(JARS.swaps[S.pic] ?? {}) };
  if (name) sw[id] = { name, hex: hex.toUpperCase() }; else delete sw[id];
  if (Object.keys(sw).length) JARS.swaps[S.pic] = sw; else delete JARS.swaps[S.pic];
  swapHide(); jarsApply();
  const where = VIEW ? `, here in ${NAME} alone (${HOME} paints by its own; 💾 SAVE keeps it as a file)` : ', saved';
  if (!VIEW) { delete JARS_FILE[S.pic]; jarsRead(); }                                  // changed since the file it was loaded from
  if (await jarsSave()) { warnAt = Date.now(); $('#runState').innerHTML = name ? `THE JARS: ${esc(LIB[S.pic].jars.find(q => q.id === id)?.name ?? id)} → <b>${esc(name)}</b>${where}.` : `THE JARS: back to the picture's own colour${where}.`; }
}

// ---------- 💾 SAVE · 📂 LOAD: a picture's jars as a file (2026-11-19) ----------
// The owner: "what else the library is good for — I can keep there different versions of the colours with different sets of paints … then it needs a panel 💾 SAVE
// 📂 LOAD". A version: a picture's colours by his numbered jars, THE JARS' swaps, and the jars he named for it; a file of its own, wherever he keeps it. LIBRARY-G
// loads it to look at and change; FORM-G loads it to paint by — into jars.json, as 🔄 does, so not while a run is on
const FILE_KIND = 'FORM-G jars';
const stamp = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')}`;
function jarsFileOf(id) {
  const own = LIB[id], sw = JARS.swaps[id] ?? {}, used = new Set(Object.values(sw).map(v => v.name));
  return { tool: NAME, kind: FILE_KIND, note: 'A version of a FORM-G picture\'s jars: every colour of the picture and the owner\'s numbered jar it is painted by (THE JARS). 📂 LOAD on LIBRARY-G or FORM-G.',
    pic: id, title: own.title, saved: new Date().toISOString(), swaps: sw, mine: Object.fromEntries(Object.entries(JARS.mine).filter(([k]) => used.has(k))),
    colours: own.jars.map(j => ({ id: j.id, colour: j.name, hex: j.hex, ...(sw[j.id] ? { jar: sw[j.id].name, jar_hex: sw[j.id].hex } : {}) })) };
}
async function jarsFileSave() {
  if (!PIC) return;
  const name = `${LIB[S.pic].title} · jars · ${stamp()}.json`, body = JSON.stringify(jarsFileOf(S.pic), null, 1);
  const said = n => { warnAt = Date.now(); $('#runState').innerHTML = `💾 <b>${esc(n)}</b>: ${Object.keys(JARS.swaps[S.pic] ?? {}).length} of ${LIB[S.pic].jars.length} colours by your jars.`; if (VIEW) { VER.label[S.pic] = n; verKeep(); } jarsRead(n); };
  // GOGH's into LIB-V (the owner, 2026-11-22, the evening, of the file in Downloads: "what do I do with it? I need it in the library"): rembrandt.py's
  // /gogh/jars keeps it in app/gogh/jars/; a rembrandt.py of before (404) — the file as till then
  if (DABS && !VIEW) {
    try {
      const r = await fetch('/gogh/jars', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      if (r.ok) { const o = await r.json(); warnAt = Date.now(); $('#runState').innerHTML = `💾 → <a href="libv.html">LIB-V</a>`; jarsRead(o.file); LIBV_BC?.postMessage({ saved: o.file }); return; }
      if (r.status !== 404) return warn(`💾 not saved: ${esc((await r.json().catch(() => ({}))).message ?? r.status)}`);
    } catch { }
  }
  if (window.showSaveFilePicker) {
    try {
      const h = await showSaveFilePicker({ id: 'formg-jars', suggestedName: name, types: [{ description: 'FORM-G jars', accept: { 'application/json': ['.json'] } }] }), w = await h.createWritable();
      await w.write(body); await w.close();
      return said(h.name);
    } catch (e) { if (e?.name === 'AbortError') return; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body], { type: 'application/json' })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  said(`${name} (Downloads)`);
}
async function jarsFileLoad(file) {
  let f = null;
  try { f = JSON.parse(await file.text()); } catch { }
  if (!f || f.kind !== FILE_KIND || !f.pic) return warn(`📂 ${esc(file.name)}: not a picture's jars (💾 SAVE makes them).`);
  if (!LIB[f.pic]) return warn(`📂 ${esc(file.name)}: its picture, ${esc(f.title ?? f.pic)}, is not in this library.`);
  if (!VIEW && lastSt && LIVE.includes(lastSt.state)) return warn(`A run is on: THE JARS stay as they are till it ends or stops — the run's pauses name its jars. ${DABS ? 'LIB-V' : 'LIBRARY-G'} loads it to look at.`);
  // the jars are physical (README): a number the file gives another colour than his jar of that number has — nothing loaded
  const have = myJarsOf(CLASSIC_PLANS, JARS.mine), named = [...Object.entries(f.mine ?? {}), ...Object.values(f.swaps ?? {}).map(v => [v?.name, v?.hex])];
  const clash = [...new Map(named.filter(([n, h]) => { const q = have.find(o => o.name === n); return q && q.hex.toUpperCase() !== String(h).toUpperCase(); })).entries()];
  if (clash.length) return warn(`📂 ${esc(file.name)}: ${clash.map(([n, h]) => `${esc(n)} is ${esc(h)} there, ${have.find(o => o.name === n).hex} on your shelf`).join('; ')} — nothing loaded.`);
  const ids = new Set(LIB[f.pic].jars.map(j => j.id)), all = Object.entries(f.swaps ?? {});
  const sw = Object.fromEntries(all.filter(([k, v]) => ids.has(k) && v?.name && /^#[0-9A-F]{6}$/i.test(v.hex ?? '')).map(([k, v]) => [k, { name: v.name, hex: v.hex.toUpperCase() }]));
  if (!VIEW && !confirm(`📂 ${file.name}\n\n${LIB[f.pic].title}: ${Object.keys(sw).length} of its ${ids.size} colours by your jars, the rest its own. ${HOME} paints by it from now on (jars.json) — load it?`)) return;
  if (f.pic !== S.pic) choose(f.pic);
  if (Object.keys(sw).length) JARS.swaps[f.pic] = sw; else delete JARS.swaps[f.pic];
  JARS.mine = { ...JARS.mine, ...Object.fromEntries(Object.entries(f.mine ?? {}).map(([n, h]) => [n, String(h).toUpperCase()])) };
  jarsApply();
  if (await jarsSave(file.name)) { warnAt = Date.now(); $('#runState').innerHTML = `📂 <b>${esc(file.name)}</b>: ${Object.keys(sw).length} of ${ids.size} colours by your jars${all.length > Object.keys(sw).length ? ` (${all.length - Object.keys(sw).length} not of this picture, left out)` : ''}${VIEW ? ', here in LIBRARY-G alone' : ', FORM-G paints by it'}.`; jarsRead(file.name); }
}
// the version on the page: LIBRARY-G's own or FORM-G's; FORM-G's last file
const JARS_FILE = {}, cols = n => `${n} colour${n === 1 ? '' : 's'}`;
function jarsRead(name) {
  const r = $('#jarsRead'); if (!r || !PIC) return;
  if (name !== undefined && !VIEW) JARS_FILE[S.pic] = name;
  const n = Object.keys(JARS.swaps[S.pic] ?? {}).length, mine = VIEW && VER.swaps[S.pic] !== undefined;
  r.innerHTML = VIEW ? (mine ? `<b>${esc(VER.label[S.pic] ?? 'changed here')}</b> · ${cols(n)} by your jars · here alone, not ${HOME}'s` : `${HOME}'s jars, as it paints them · ${cols(n)} by your jars`)
    : `${cols(n)} by your jars${JARS_FILE[S.pic] ? ` · <b>${esc(JARS_FILE[S.pic])}</b>` : ''}`;
  if ($('#btnJarsBack')) $('#btnJarsBack').disabled = !mine;
}
if ($('#btnJarsSave')) $('#btnJarsSave').onclick = jarsFileSave;
if ($('#btnJarsLoad')) $('#btnJarsLoad').onclick = () => $('#jarsFile').click();
if ($('#jarsFile')) $('#jarsFile').onchange = e => { const f = e.target.files?.[0]; if (f) jarsFileLoad(f); e.target.value = ''; };
// LIBRARY-G: back to FORM-G's jars for this picture, its own changes here dropped
if ($('#btnJarsBack')) $('#btnJarsBack').onclick = () => {
  if (!VIEW || VER.swaps[S.pic] === undefined) return;
  delete VER.swaps[S.pic]; delete VER.label[S.pic]; verKeep();
  JARS = viewJars(); jarsApply(); jarsRead();
  warnAt = Date.now(); $('#runState').innerHTML = 'THE JARS: FORM-G\'s again, as it paints them.';
};
if ($('#jarPop')) {
  $('#jarPop').addEventListener('click', e => {
    const pop = $('#jarPop'), id = pop.dataset.id;
    if (e.target.closest('[data-x]')) return swapHide();
    if (e.target.closest('[data-back]')) return swapTo(id, null);
    const b = e.target.closest('.jp-jar'); if (b) return swapTo(id, b.dataset.name, b.dataset.hex);
  });
  $('#jarPop').addEventListener('submit', e => {
    e.preventDefault();
    const pop = $('#jarPop'), id = pop.dataset.id, own = LIB[S.pic].jars.find(q => q.id === id), v = Math.round(+e.target.querySelector('input').value), name = `Jar ${v}`;
    if (!own || !(v >= 1 && v <= 999)) return warn('A new jar: its number, 1 … 999.');
    const had = myJarsOf(CLASSIC_PLANS, JARS.mine).find(q => q.name === name);
    if (had && had.hex !== own.hex.toUpperCase()) return warn(`${name} is your ${had.hex} already${had.mine ? '' : ' (COLORS, the classic\'s)'}: choose it in the list, or give the new jar another number.`);
    JARS.mine = { ...JARS.mine, [name]: own.hex.toUpperCase() };
    swapTo(id, name, own.hex);
  });
  addEventListener('keydown', e => { if (e.key === 'Escape') swapHide(); });
  addEventListener('pointerdown', e => { if (!e.target.closest('#jarPop') && !e.target.closest('[data-swap]')) swapHide(); });
}

// ---------- LIB-V's links (2026-11-22, the evening): gogh.html#pic=<id>, a picture; &jars=<file>, its jars saved by 💾 SAVE, 📂 LOAD's way ----------
let HASH = DABS && !VIEW && location.hash.length > 1 ? new URLSearchParams(location.hash.slice(1)) : null;
const LIBV_BC = DABS && typeof BroadcastChannel === 'function' ? new BroadcastChannel('rembrandt.genv') : null;
async function openHash(h, st) {
  history.replaceState(null, '', location.pathname);
  const id = h.get('pic'), file = h.get('jars');
  if (!id || !LIB[id]) return id && warn(`LIB-V: ${esc(id)} is not in GOGH's library.`);
  if (st && LIVE.includes(st.state) && S.runPic && id !== S.runPic) return warn(`A run of ${esc(LIB[S.runPic]?.title ?? S.runPic)} is on: GOGH stays on it till the run ends or stops — LIB-V shows the others.`);
  if (id !== S.pic) choose(id);
  if (!file) return;
  try { const r = await fetch(`gogh/jars/${encodeURIComponent(file)}`, { cache: 'no-store' }); if (!r.ok) throw new Error(r.status); jarsFileLoad(new File([await r.text()], file)); }
  catch (e) { warn(`LIB-V: ${esc(file)} not read (${esc(e?.message ?? e)}).`); }
}

// ---------- start ----------
lampSwitch($('#lamp'));
(async () => {
  // the pictures on this Mac alone (others' works, out of git: README), first: formg/local.json { "ids": [...] }, gitignored
  try { const r = await fetch(`${TAB}/local.json`, { cache: 'no-store' }); if (r.ok) LIBRARY.unshift(...((await r.json()).ids ?? []).filter(id => !LIBRARY.includes(id))); } catch { }
  // LIB-V: a picture GEN-V's APPROVE 🐾 just put in, shown at once — the page made again on it (it sends nothing, so nothing is cut off)
  if (LIBV && typeof BroadcastChannel === 'function') new BroadcastChannel('rembrandt.genv').onmessage = e => { const id = e.data?.approved; if (typeof id === 'string') { S.pic = id; save(); location.reload(); } };
  // GOGH's library empty — its pictures come from GEN-V, the cards of this Mac in gogh/local.json: the page says so and waits
  if (!LIBRARY.length) {
    $('#lib').innerHTML = `<p class="read">No picture yet. A picture in: GEN-V, 🐾 APPROVE.</p>`;
    $('#hint').textContent = `${NAME} — the library is empty: GEN-V makes its pictures.`;
    return;                                                                           // no picture, no plan: PROGRESS waits for one
  }
  for (const id of LIBRARY) {
    const pic = await (await fetch(`${TAB}/${id}.json`, { cache: 'no-store' })).json();
    // GEN-F's colours short on the page, C5 for Colour 5 (the owner, 2026-11-17, THE JARS' rows with their 🔄: "let us replace Colour N by CN, or it does not fit")
    for (const j of pic.jars ?? []) j.name = j.name.replace(/^Colour (\d+)/, 'C$1');
    LIB[id] = pic;
    const im = new Image(); im.onload = kick; im.src = pic.image; IMG[id] = im;
  }
  // every card its canvas (the owner, 2026-11-10: "better to sign them: I thought our red Porsche was 60 × 80, and it is 70 × 100"; a picture is planned for its own size, never scaled)
  $('#lib').innerHTML = LIBRARY.map(id => `<div class="fg-item"><button class="fg-card" data-id="${id}"><img src="${LIB[id].image}" alt=""><b>${esc(LIB[id].title)}</b><span class="sz">${LIB[id].w / 10} × ${LIB[id].h / 10} cm</span></button><button class="info" data-read="${id}" aria-label="About ${esc(LIB[id].title)}">i</button></div>`).join('');
  // each 911's v.1 off the library (the owner, 2026-11-11: "leave only v.2"): a page left on a v.1 opens its v.2; the classic's place on the canvas, the owner's canon for
  // the 70 × 100 (left −60, bottom −68), carried to its v.2 once — the same outline to the mm, the same pen outline and PRESS_OK
  const GONE = { 'porsche-red': 'porsche-red-k', 'porsche-race': 'porsche-race-k' };
  if (!LIB[S.pic]) S.pic = LIB[GONE[S.pic]] ? GONE[S.pic] : LIBRARY[0];
  if (!CANON_RUN && !S.v2place) { if (S.place['porsche-red']) S.place['porsche-red-k'] = { ...S.place['porsche-red'] }; S.v2place = 1; save(); }
  // the classic's v.3 (2026-11-11), v.2's form and outline to the mm: v.2's place on the canvas once, the owner's canon for the 70 × 100
  if (!CANON_RUN && !S.v3place) { const was = S.place['porsche-red-k'] ?? S.place['porsche-red']; if (was && !S.place['porsche-red-v3']) S.place['porsche-red-v3'] = { ...was }; S.v3place = 1; save(); }
  // its v.4 (2026-11-13), v.3 to the leg and its shadow, on the canvas v.3 painted: v.3's place once
  if (!CANON_RUN && !S.v4place) { const was = S.place['porsche-red-v3']; if (was && !S.place['porsche-red-v4']) S.place['porsche-red-v4'] = { ...was }; S.v4place = 1; save(); }
  if (JARS_ON) await jarsLoad();
  PIC = picNow(S.pic); SEQ = seqOf(PIC);
  await loadInk();
  layout(); settle(); watch();
  setInterval(watch, 500);
})();
