// FORM-G's page: the library, the picture, OPM-N's DRAG SNAKE (formgplan.js). inka.js's run as it is on OPM-N, its question with Start from, its LCD, BACK ONE CELL, the remote and ELBOW LIVE,
// copied here so that OPM-N stays as it was; no form to draw, no palette to choose, the brush fixed (the owner, 2026-11-06).
import { FORMG, FORMG_LIB, OPMG_LIB, seqOf, passesOf, rowsOf, brushRuns, placeRange, framedPic, cleanFrame, R3, contourOf, PEN, MARKS, stripsOf, marksOf, withMarks } from './formgplan.js';
import { plotRun, DEFAULTS, homeBlocks, ELBOW_HOVER, TAIL_MIN, handDip, landingCheck } from './strokes.js';
import { reach } from './machine.js';
import { wipeBlocks, WIPE_NEW, machinePiece } from './inkaplan.js';
import { cupOf, cupProblem, dipAt } from './ink.js';
import { DOT_MM, NO_DIP } from './band.js';
import { segments, sticks } from './lcd.js';
import { lampSwitch } from './lamp.js';
import { qrSvg } from './qr.js';
import './ui.js';

// OPM-G (2026-11-07): this page with its own library, app/opmg/, and its run by the canon of a long leg (canon.js); FORM-G's as it was
const TAB = document.body.dataset.tab === 'opmg' ? 'opmg' : 'formg', CANON_RUN = TAB === 'opmg', NAME = CANON_RUN ? 'OPM-G' : 'FORM-G', LIBRARY = CANON_RUN ? OPMG_LIB : FORMG_LIB;
const $ = s => document.querySelector(s), KEEP = CANON_RUN ? 'rembrandt.opmg.v01' : 'rembrandt.formg.v02', OPMN_KEEP = 'rembrandt.opmn.v01', LIVE = ['running', 'stopping', 'pausing', 'paused'];
const PRESS_MIN = -4, PRESS_MAX = 8;   // as OPM-N's brush
const TRAVEL = 100;   // the carriage's travel with the brush up, mm/s: see where S is read
const fmt = (v, d = 1) => Number(v).toFixed(d), sgn = v => `${v >= 0 ? '+' : '−'}${fmt(Math.abs(v), 1)}°`, esc = v => String(v ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const hm = t => { const m = Math.round((t || 0) / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`; };
const S = { pic: LIBRARY[0], view: 'picture', speed: 25, penSpeed: PEN.speed, dipEvery: CANON_RUN ? FORMG.every : R3.every, dipLap: FORMG.lap, over: FORMG.over, wipe: WIPE_NEW, press: 0, travel: TRAVEL, tail: 3, place: {}, frames: {} };
const nums = o => ({ ...(Number.isFinite(o.pspeed) ? { speed: o.pspeed } : {}), ...(Number.isFinite(o.dipEvery) ? { dipEvery: o.dipEvery } : {}), ...(Number.isFinite(o.dipLap) ? { dipLap: o.dipLap } : {}), ...(Number.isFinite(o.idleOver) ? { over: o.idleOver } : {}), ...(Number.isFinite(o.wipe) ? { wipe: o.wipe } : {}), ...(Number.isFinite(o.brushPress) ? { press: o.brushPress } : {}), ...(Number.isFinite(o.travel) ? { travel: o.travel } : {}), ...(Number.isFinite(o.tail) ? { tail: o.tail } : {}) });
try {                                                                                 // a first visit: the brush as it is tuned on OPM-N
  const mine = JSON.parse(localStorage.getItem(KEEP) || 'null'), opmn = mine ? null : JSON.parse(localStorage.getItem(OPMN_KEEP) || 'null');
  Object.assign(S, mine ?? nums(opmn ?? {}));
} catch { }
const save = () => { try { localStorage.setItem(KEEP, JSON.stringify(S)); } catch { } };
// FORM-G's run as LAB's real 3 (formgplan.js, R3; the owner, 2026-11-10): a dip every 79 mm, not 95, once, where Dip every was still the old 95; the J3 compensation and no
// slack on the machine's path. OPM-G's run as it was, by the canon
const R3RUN = CANON_RUN ? {} : { slack: R3.slack, j3: R3.j3 };
if (!CANON_RUN && !S.r3) { if (S.dipEvery === FORMG.every) S.dipEvery = R3.every; S.r3 = 1; save(); }
if (!Number.isFinite(S.penSpeed)) S.penSpeed = PEN.speed;
// the carriage's travel, the brush up (the owner, 2026-11-10, the X belt slipped "with a crack" several times and the headlights came out in the canvas's middle:
// the run's first move, home to the top of a 70 × 100, ~830 mm at the 180 mm/s FORM-G had taken from OPM-N, the jar on the carriage; "we must lower it"):
// TRAVEL, the firmware's own default, once in place of the old 180 (OPM-G's too: the same carriage, the same jar); FORM-G's field of its own since (Travel,
// mm/s), the legs' Speed untouched (est.)
if (!S.travelV) { if (!(S.travel < 180)) S.travel = TRAVEL; S.travelV = 1; save(); }
S.frames = Object.fromEntries(Object.entries(S.frames ?? {}).map(([k, f]) => [k, cleanFrame(f)]).filter(([, f]) => f));

// ---------- the library ----------
const LIB = {}, IMG = {};
let PIC = null, SEQ = [];
// a picture as it is run: in its frame, F, when one is laid (formgplan.js's framedPic); the plan's and the run's keys by it, so the card's (i) keeps the whole picture's numbers
const picNow = id => framedPic(LIB[id], S.frames[id]);
const pk = () => PIC.frame ? `${PIC.id}|${PIC.frame.x0},${PIC.frame.y0},${PIC.frame.x1},${PIC.frame.y1}` : PIC.id;
const jarOf = id => SEQ.find(j => j.id === id);
const opts0 = () => ({ ...DEFAULTS, speed: S.speed, travel: S.travel, tail: S.tail, lift: true, ink: true, snake: true, pause: false, cup: dipCup(), hover: ELBOW_HOVER, press: S.press, noDipUnder: 0 });
// where the canvas may lie: from plotRun's carriage, the path not yet pressed into a wall
const RANGE = new Map();
function rangeOf() {
  const key = JSON.stringify([S.speed, S.tail, S.dipEvery, S.dipLap, S.over, S.press]), had = RANGE.get(pk());
  if (had?.key === key) return had;
  const P = plan(), R = rowsOf(PIC, P, S.dipEvery, S.dipLap, CANON_RUN, R3RUN), r = plotRun({ ...opts0(), rows: R.ps.length }, R.groups.map(g => ({ key: 'DRAG', ps: g.map(i => R.ps[i]), why: null })));
  const out = { key, ...placeRange(PIC, r.carriage, reach()) };
  RANGE.set(pk(), out);
  return out;
}
const nearZero = ([lo, hi]) => lo > hi ? Math.round((lo + hi) / 2) : Math.round(Math.min(hi - Math.min(1, (hi - lo) / 2), Math.max(lo + Math.min(1, (hi - lo) / 2), 0)));
function placeNow() {
  if (!S.place[PIC.id]) { const r = rangeOf(); S.place[PIC.id] = { edgeLeft: nearZero(r.left), edgeBottom: nearZero(r.bottom) }; save(); }
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
    const n = SEQ.filter(j => j.coat !== 2).length, st = stripsOf(PIC, on, n);
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
function plan() {                                                                     // the list's colours
  const key = JSON.stringify([S.over, S.dipLap, CANON_RUN ? S.dipEvery : 0]);
  if (PLAN.get(pk())?.key !== key) PLAN.set(pk(), { key, passes: passesOf(PIC, { over: S.over, lap: S.dipLap, ...(CANON_RUN ? { canon: true, every: S.dipEvery } : {}) }) });
  return PLAN.get(pk()).passes;
}
// the run from a line of the list on; the pause before the second layer's first says what it is
function paintRun(from = 0) {
  if (!PIC) return EMPTY;
  const mk = marksNow(), key = JSON.stringify([pk(), S.speed, S.travel, S.tail, S.wipe, S.press, S.dipEvery, S.dipLap, S.over, hereNow(), dipCup(), from, mk ? mk.strips.map(q => q.no) : 0]);
  if (RUNS.has(key)) return RUNS.get(key);
  const passes = plan().slice(from);
  if (!passes.length) return EMPTY;
  const R = rowsOf(PIC, passes, S.dipEvery, S.dipLap, CANON_RUN, { ...R3RUN, marks: mk?.M }), name = id => jarOf(id)?.name ?? id;
  const r = plotRun({ ...runOpts(R.ps.length), press: S.press, noDipUnder: 0 }, R.groups.map((g, k) => ({ key: 'DRAG', ps: g.map(i => R.ps[i]), why: !k ? null : passes[k].layer === 2 && passes[k - 1].layer === 1 ? `the first layer is done: let it dry. Then wipe the brush, put ${name(passes[k].pencil)} in the cup, Continue` : `wipe the brush, put ${name(passes[k].pencil)} in the cup, then Continue` })));
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
const PRESS_OK = { 'porsche-red': 8, 'porsche-red-k': 8, 'porsche-red-v3': 8 };   // its v.2 Kuzya the same form at the same place (2026-11-11), its v.3 too, the same outline to the mm
function pressOk() {
  const lim = PRESS_OK[PIC?.id];
  if (!lim || PIC.frame) return 0;
  const rg = rangeOf(), c = placeNow(), low = rg.bottom[0] - c.edgeBottom;
  return c.edgeLeft >= rg.left[0] && c.edgeLeft <= rg.left[1] && c.edgeBottom <= rg.bottom[1] && low > 0 && low <= lim ? low : 0;
}
function walls(P_) {
  if (!P_) return '';
  if (P_.gone) return `The brush would go ${fmt(P_.pastWall, 0)} mm past the walls, ${P_.gone} legs gone: move the canvas, as below.`;
  return P_.pastWall > 0.05 && !pressOk() ? `The brush would go ${fmt(P_.pastWall, 0)} mm past the walls: move the canvas, as below.` : '';
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
  playStop();
  if (blocks.some(b => b.fork)) {                                                     // only a rembrandt.py that knows the cup at hand takes its forks (inka.js's start)
    let st = null; try { st = await (await fetch('/run', { cache: 'no-store' })).json(); } catch { }
    if (st && !(st.hand >= 1)) { alert('The cup at hand (INK-Y): restart rembrandt.py first — the one running does not know it yet. Nothing was sent.'); return; }
  }
  try {
    RUN = blocks; RUN_INFO = info; RUN_KEY = key; S.runPic = S.pic; S.runFrom = info.from ?? 0; S.runKey = key; save();   // the picture this run is of: the page keeps to it while it runs (runPicture); the line it started from, for PROGRESS
    const r = await fetch('/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blocks, log }) });
    $('#runState').textContent = await r.text();
  } catch { $('#runState').textContent = 'start rembrandt.py'; }
}
// rembrandt.py knows OPM-N's brush by its page (PENCIL_PAGES: the elbow may rest on the canvas just above its aim): FORM-G's the same brush, so the same page, its own `tab` in the journal; rembrandt.py as it was
const logOf = (o = {}) => ({ page: 'opmn', tab: TAB, label: `${NAME} · ${PIC.title}${PIC.frame ? ` · frame ${frameSize()}` : ''}`, here: hereNow(), ...(PIC.frame ? { frame: { ...PIC.frame, edgeLeft: frameHome().left, edgeBottom: frameHome().bottom } } : {}), ...o });
// the iPhone's rows; every colour its line in the whole list, n of `of`, and a run from a later line `whole`: the picture's mm before it, the run's, all of it, the whole's seconds —
// so the remote's PROGRESS reads the whole picture, as the page's (rembrandt.py passes a colour on as it is)
const remoteRows = (R, from = 0) => {
  const all = plan(), W = from ? { mm0: Math.round(all.slice(0, from).reduce((a, q) => a + q.mm, 0)), run: Math.round(R.mm), all: Math.round(all.reduce((a, q) => a + q.mm, 0)), s: Math.round(paintRun().seconds) } : null;
  return { colours: R.passes.map((q, i) => { const j = jarOf(q.pencil); return { name: j?.name ?? q.pencil, hex: j?.hex ?? '#7F7F7F', code: j?.code || '', cells: q.cells, n: from + i + 1, of: all.length, ...(W ? { whole: W } : {}) }; }), rows: R.rows.map(q => ({ c: q.pass, cells: q.cells ?? [] })) };
};
const dragWay = tracks => `${tracks} legs in all, only up and down, ${fmt(PIC.pitch, 0)} mm apart, the snake back and forth with the brush down; then at once an idle run over the cell, no dip, +${fmt(S.over, 1)} mm past the ends and none at its very end`
  + (CANON_RUN ? `. A long leg by the canon, no. 9: after every dip the brush lands inside the leg, 16 mm along it, back to its start, then along it` : '')
  + `. The dose: every run on a dip of its own, none on what another left; a leg under 30 mm after 60 mm of line since the dip, a dip of its own at its start`
  + (R3RUN.j3 ? `. As LAB's real 3: no run longer than Dip every, and the J3 compensation, every run on the machine landing ${R3RUN.j3.early} mm earlier and lifting ${R3RUN.j3.late} mm later than on the screen` : '');
$('#btnDrag').onclick = async () => {
  await loadInk();
  if (!PIC) return;
  let R = paintRun(), from = 0;
  if (lastSt && LIVE.includes(lastSt.state)) return warn('A run is on: STOP it first.');
  if (!R.rows.length) return warn('Nothing to paint.');
  if (R.fault) return warn(`Not run: the plan is wrong — ${R.fault}.`);
  if (walls(R)) return warn(walls(R));
  if (cupProblem(cup())) return warn(`DRAG dips in ${cupName()}: ${cupProblem(cup())}`);
  const whole = R.passes;
  const say = () => { const n = R.passes.length, first = jarOf(R.passes[0].pencil); const two = R.passes.filter(q => q.layer === 2).length; return (two ? `Two layers, one list: ${n - two ? `${n - two} jars, then ` : ''}${layer2Say(R.passes)} over the dry first layer, the last in the list; Start from reaches them on another day. ` : '') + `One brush, ${n} line${n === 1 ? '' : 's'} of the list, in this order, light to dark. Every jar's cells by their numbers, 1, 2, 3 …, every one on its own: ${dragWay(R.passes.reduce((a, q) => a + q.tracks, 0))}; from cell to cell up through the air. `
    + `The paint from ${cupName()}: put ${first?.name ?? 'the first'} in it now — a dip at every cell's start, ${S.dipEvery ? `then every ${S.dipEvery} mm of line` : 'none in it'} and before a short leg after 60 mm, ${R.dips} dips. `
    + (marksNow()?.strips.length ? `After every change of jar, before its first cell: one dip, then its marks, ${marksNow().strips.map(sideSay).join(', ')} — the paper strips taped there (MARKS, The canvas). ` : '')
    + (n > 1 ? `Between two lines it stops ${n - 1} time${n > 2 ? 's' : ''}: the brush up +${S.wipe}° over the cup — wipe it, put the next jar in the cup, Continue. ` : '')
    + `${fmt(R.mm / 1000, 1)} m of brush at ${S.speed} mm/s, ≈ ${hm(R.seconds)} (est.). ` + (PIC.frame ? `Only the frame, ${frameSize()} mm, at its place in the picture: its canvas's left edge ${frameHome().left} mm, its bottom edge ${frameHome().bottom} mm from home — is it laid there?` : `The canvas's left edge ${placeNow().edgeLeft} mm, its bottom edge ${placeNow().edgeBottom} mm from home.`); };
  if (!await askDraw(R.passes, say(), { from: whole.length > 1 ? { passes: whole, pick: i => { from = i; R = paintRun(i); return { passes: R.passes, text: say() }; } } : null })) return;
  if (R.fault) return warn(`Not run: the plan is wrong — ${R.fault}.`);               // the run from a later jar: its own plan
  if (walls(R)) return warn(walls(R));
  S.view = 'drag'; RUN_PRESS = S.press; save(); showKeys(); kick();
  await start('drag', R.blocks, { seconds: R.seconds, rows: R.rows, passes: R.passes.map(q => q.pencil), from },
    logOf({ pass: 'drag', ...(pressOk() ? { pressed_bottom_mm: Math.round(pressOk() * 10) / 10 } : {}), settings: { ...S, place: placeNow() }, cup: dipCup(), travel: S.travel, remote: remoteRows(R, from), ...(from ? { from_colour: jarOf(R.passes[0].pencil)?.name ?? R.passes[0].pencil } : {}), estimate_s: Math.round(R.seconds) }));
};
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
    logOf({ pass: 'draw bw', label: `${NAME} · ${PIC.title}${PIC.frame ? ` · frame ${frameSize()}` : ''} · DRAW BW, the pen · ${R.kind === 'all' ? 'every border' : 'the outline'}`, settings: { ...S, place: placeNow() }, debug: { lines: c.dbg.lines, downs: c.dbg.downs, ups: c.dbg.ups, press: at.press, glide: at.glide }, estimate_s: Math.round(R.seconds) }));
};
// the second layer in words: a late jar first (the orange, Jar 6: README's canon, 2026-11-11), then the jars again
function layer2Say(passes) {
  const two = passes.filter(q => q.layer === 2), late = two.filter(q => jarOf(q.pencil)?.coat === 1).map(q => jarOf(q.pencil)?.name ?? q.pencil), again = two.length - late.length;
  return `${late.length ? `${late.join(', ')} first, then ` : ''}${again} of the jars again`;
}
// OPM-N's question: the first jar big, the order, the time, Start from; DRAG or Cancel, Esc Cancel
const runRows = passes => passes.map((q, i) => { const j = jarOf(q.pencil); return `<li><span class="no">${i + 1}</span><i class="sw" style="background:${j.hex}"></i><span class="nm">${esc(j.name)}${j.code ? ` <em>${esc(j.code)}</em>` : ''}</span><span class="tg">${q.mm >= 1000 ? `${fmt(q.mm / 1000, 1)} m` : `${Math.round(q.mm)} mm`}</span></li>`; }).join('');
function askDraw(passes, text, o = {}) {
  const box = $('#drawAsk');
  const show = (passes, text) => {
    $('#drawAskText').textContent = text;
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
  box.hidden = false; $('#drawAskList').scrollTop = 0; $('#drawGo').focus();
  return new Promise(ok => {
    const key = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); end(false); } };
    const end = v => { box.hidden = true; removeEventListener('keydown', key, true); ok(v); };
    addEventListener('keydown', key, true);
    $('#drawGo').onclick = () => end(true); $('#drawNo').onclick = () => end(false);
    box.onclick = e => { if (e.target === box) end(false); };
  });
}
// TEST: a dot at each corner of the picture's box, the canvas laid by them; a 70 × 100's own corners are past the walls
function testRun() {
  const b = plan().flatMap(q => q.byCell.flatMap(c => c.legs.flat())), xs = b.map(q => q[0]), ys = b.map(q => q[1]);
  if (!b.length) return null;
  const x0 = Math.min(...ys) - PIC.h / 2, x1 = Math.max(...ys) - PIC.h / 2, y0 = Math.min(...xs) - PIC.w / 2, y1 = Math.max(...xs) - PIC.w / 2;
  const dots = [['TL', x1, y0], ['TR', x1, y1], ['BR', x0, y1], ['BL', x0, y0]].map(([name, x, y]) => { const d = Math.hypot(x, y) || 1, l = Math.min(DOT_MM, d); return { name, at: { x, y }, to: { x: x - x / d * l, y: y - y / d * l } }; });
  return { ...plotRun(runOpts(dots.length), [{ key: 'TEST', ps: dots.map((d, i) => [{ t: 'L', a: d.at, b: d.to, tilt: 0, row: i + 1 }]), why: null }]), dots };
}
$('#btnTest').onclick = async () => {
  await loadInk();
  if (!PIC) return;
  const here = hereNow(), T = testRun();
  if (!T) return warn('Nothing to paint.');
  if (cupProblem(cup())) return warn(`TEST dips in ${cupName()}: ${cupProblem(cup())}`);
  if (T.fault) return warn(`Not run: the test is wrong — ${T.fault}.`);
  if (walls(T)) return warn(walls(T));
  if (!confirm(`TEST: one dip in the cup, then a dot at each corner of ${PIC.frame ? 'what the frame paints' : "the picture's box"} — ${T.dots.map(d => `${d.name} X ${fmt(here.x + d.at.x, 0)} · Y ${fmt(here.y + d.at.y, 0)}`).join(', ')} — and home.`)) return;
  await start('test', T.blocks, { seconds: T.seconds, rows: T.dots.map(d => ({ label: `TEST · ${d.name}` })) }, logOf({ pass: 'test', cup: cup(), dots: T.dots.map(d => ({ name: d.name, x: +(here.x + d.at.x).toFixed(1), y: +(here.y + d.at.y).toFixed(1) })), estimate_s: Math.round(T.seconds) }));
};
const post = async path => { try { const r = await fetch(path, { method: 'POST' }); return await r.text(); } catch { return 'start rembrandt.py'; } };
$('#btnHome').onclick = () => start('home', homeBlocks(S.travel), { seconds: 0, rows: [{ label: 'HOME' }] }, logOf({ label: `${NAME} · HOME` }));
let paused = false;
$('#btnPause').onclick = () => post(paused ? '/run/continue' : '/run/pause');
$('#btnStop').onclick = () => post('/run/stop');
let backSaid = 0;
$('#btnBack').onclick = async () => {                                                 // OPM-N's BACK ONE CELL, rembrandt.py's back_one
  const press = async sure => { const r = await fetch('/run/back' + (sure ? '?sure=1' : ''), { method: 'POST' }); return r.status === 404 ? { old: true } : r.json(); };
  try {
    let a = await press(false);
    if (a.old) return alert('BACK ONE CELL did nothing: the rembrandt.py running is from before it. Start it again when no run is on — Ctrl+C in its window, then python3 rembrandt.py. The run in hand ends with it.');
    if (a.ask) {
      if (!confirm(`Back to ${a.ask.colour}, cell ${a.ask.cell}. It flies there, dips and paints at once: is ${a.ask.colour} in the cup?`)) return;
      a = await press(true);
    }
    if (!a.ok) return alert(`BACK ONE CELL did nothing: ${a.message ?? a.state ?? 'not now'}.`);
    const b = $('#btnBack'); b.textContent = `⏮ ${a.message}`; b.classList.add('call');
    clearTimeout(backSaid); backSaid = setTimeout(() => { b.textContent = '⏮ BACK ONE CELL'; b.classList.remove('call'); }, 4000);
  } catch { alert('BACK ONE CELL did nothing: no answer from rembrandt.py.'); }
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
document.querySelectorAll('#elbowBrush [data-btrim]').forEach(b => { b.onclick = () => setElbow(S.press + +b.dataset.btrim); });

// ---------- the screen: the canvas as it lies on the machine, the reach over it ----------
const cv = $('#cv'), stage = $('#stage'), ctx = cv.getContext('2d');
let K = 1, OX = 0, OY = 0, fitted = '', only = null, PLAY = null, NOW = null;
const PLAY_MS = 180000;
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
  q.legs.forEach((l, i) => { const a = [sx(l[0][0]), sy(l[0][1])], b = [sx(l[1][0]), sy(l[1][1])]; if (i) c.lineTo(a[0], a[1]); else c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); });
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
  g.fillStyle = '#F3F0E6'; g.fillRect(sx(0), sy(PIC.h), PIC.w * K, PIC.h * K);
  g.strokeStyle = 'rgba(36,34,31,.35)'; g.lineWidth = 1; g.strokeRect(sx(0), sy(PIC.h), PIC.w * K, PIC.h * K);
  if (PLAY) { g.drawImage(PLAY.cv, sx(0), sy(PIC.h), PIC.w * K, PIC.h * K); }
  else if (S.view === 'picture' && IMG[S.pic]?.complete) {
    g.imageSmoothingQuality = 'high'; g.drawImage(IMG[S.pic], sx(0), sy(PIC.h), PIC.w * K, PIC.h * K);
    if (only) { g.fillStyle = 'rgba(243,240,230,.82)'; g.fillRect(sx(0), sy(PIC.h), PIC.w * K, PIC.h * K); drawLegs(g, plan().filter(q => q.pencil === only)); }
  } else if (S.view === 'contour') drawContour(g);
  else drawLegs(g, plan());
  drawMarks(g);
  // F, the frame, as OPM-W's, its size by it, the picture round it veiled; the one being dragged while it is. Solid, not dashed: the walls' line here is dashed
  const F = fgrab?.f ?? S.frames[S.pic];
  if (F) {
    const fx = sx(F.x0), fy = sy(F.y1), fw = (F.x1 - F.x0) * K, fh = (F.y1 - F.y0) * K;
    g.save(); g.fillStyle = 'rgba(243,240,230,.74)'; g.beginPath(); g.rect(sx(0), sy(PIC.h), PIC.w * K, PIC.h * K); g.rect(fx, fy, fw, fh); g.fill('evenodd');
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
    for (const m of mk.M) { const j = SEQ[m.pass]; if (!j) continue; g.strokeStyle = j.hex; for (const q of m.marks) { g.beginPath(); g.moveTo(sx(q.pts[0][0]), sy(q.pts[0][1])); g.lineTo(sx(q.pts[1][0]), sy(q.pts[1][1])); g.stroke(); } }
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
  for (const r of withMarks(brushRuns(passes, S.dipEvery, S.dipLap, CANON_RUN, R3RUN.slack), passes, SEQ, marksNow()?.M)) {
    const hex = jarOf(passes[r.pass].pencil).hex;
    r.pts.slice(1).forEach((b, i) => { const a = r.pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L > 0) list.push({ a, b, from: mm, to: (mm += L), hex, n: r.pass, num: r.num, idle: r.idle, mark: r.mark ? r.say : null }); });
  }
  if (!list.length) return;
  off.width = PIC.w * s; off.height = PIC.h * s; c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = PIC.pitch * s * 0.92;
  const Q = PLAY = { cv: off, mm, want: 0, n: 0, q: list[0], tip: null, at: null, i: 0, t0: performance.now(), said: 0, ids: passes.map(q => q.pencil), seconds: paintRun().seconds, metres: passes.reduce((a, q) => a + q.mm, 0) };
  $('#btnPlay').textContent = '■ Stop'; $('#btnPlay').classList.add('on');
  const step = () => {
    if (PLAY !== Q) return;
    const t = performance.now(), u = Math.min(1, (t - Q.t0) / PLAY_MS);
    Q.want = u < 1 ? mm * u * u : mm;
    while (Q.i < list.length && list[Q.i].from <= Q.want) {
      const q = list[Q.i], f = Math.min(1, (Q.want - q.from) / (q.to - q.from)), p = [q.a[0] + (q.b[0] - q.a[0]) * f, q.a[1] + (q.b[1] - q.a[1]) * f], o = Q.at ?? q.a;
      if (!q.idle) { c.strokeStyle = q.hex; c.beginPath(); c.moveTo(o[0] * s, (PIC.h - o[1]) * s); c.lineTo(p[0] * s, (PIC.h - p[1]) * s); c.stroke(); }
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
  if (pressOk()) $('#placeRead').insertAdjacentHTML('afterbegin', `<b>The lowest legs' lift-outs pressed against the bottom wall</b>: the carriage would go ${fmt(pressOk(), 1)} mm past it (${fmt(PRESS_OK[PIC.id], 0)} at most for this picture, the stop 9.45), so it stops at the wall; no leg gone (the owner's “yes”, 2026-11-10, est.).<br>`);
  showMarks();
  const F = PIC.frame, all = LIB[S.pic].jars.length, nb = $('#btnNoFrame');
  if (nb) nb.disabled = !F;
  if ($('#frameRead')) $('#frameRead').innerHTML = F ? `<b>Frame ${frameSize()} mm</b>, its bottom left corner ${fmt(F.x0, 0)} → ${fmt(F.y0, 0)} ↑ mm from the picture's: lay its canvas with the left edge <b>${frameHome().left}</b> and the bottom edge <b>${frameHome().bottom}</b> mm from home. ${PIC.jars.length} of the ${all} jars in it, ${P.length} lines of the list, ${fmt(R.mm / 1000, 1)} m of brush, ≈ ${hm(R.seconds)} (est.).`
    : 'No frame: the whole picture. F, or Frame, lays one round a piece to try first, at its place from home: a click a 200 × 200 there, a drag any size.';
  for (const [id, k] of [['#fSpeed', 'speed'], ['#fEvery', 'dipEvery'], ['#fLap', 'dipLap'], ['#fOver', 'over'], ['#fPen', 'penSpeed'], ['#fTravel', 'travel']]) if ($(id) && document.activeElement !== $(id)) $(id).value = S[k];
  if ($('#bwRead')) { const O = penRun('outline'), A = penRun('all'); $('#bwRead').innerHTML = O.lines ? `DRAW BW: the outline alone ${fmt(O.mm / 1000, 1)} m, ≈ ${hm(O.seconds)}; every border ${A.lines} lines, ${fmt(A.mm / 1000, 1)} m, ≈ ${hm(A.seconds)} (est.).` : ''; }
  $('#runList').innerHTML = P.map((q, i) => { const j = jarOf(q.pencil); return `${q.layer === 2 && P[i - 1].layer === 1 ? '<li class="fg-sep">Layer 2 · over the dry first layer</li>' : ''}<li data-id="${esc(j.id)}" data-i="${i}" class="${only === j.id ? 'only' : ''}" title="${esc(j.name)}: ${q.cells} cells, ${q.tracks} legs, ${fmt(q.mm / 1000, 1)} m of brush. A click shows its legs"><span class="no">${i + 1}</span><i class="sw" style="background:${j.hex}"></i><span class="nm">${esc(j.name)}${j.code ? ` <em>${esc(j.code)}</em>` : ''}</span><span class="tg">${q.mm >= 1000 ? `${fmt(q.mm / 1000, 1)} m` : `${Math.round(q.mm)} mm`}</span></li>`; }).join('');
  $('#jarsHint').textContent = two ? `${P.length} lines, ${PIC.jars.length} jars, light to dark` : `${P.length}, light to dark`;
  $('#stats').textContent = `${PIC.w / 10} × ${PIC.h / 10} cm${PIC.frame ? ` · frame ${frameSize()} mm` : ''}`;
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
// The canvas's two reads, the walls and MARKS, behind its (i) (the owner, 2026-11-11: "hide these two poems, about the canvas and
// the Marks, under an (i)"); one with a warning shows all the same
let CANVAS_INFO = false;
function canvasReads() {
  for (const id of ['#placeRead', '#marksRead']) { const p = $(id); if (p) p.hidden = !CANVAS_INFO && !p.querySelector('.warn'); }
  $('#canvasInfo')?.classList.toggle('on', CANVAS_INFO);
}
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
  PIC = LIB[id]; SEQ = seqOf(PIC);
  try {
    const all = PIC.jars.flatMap(j => j.cells), P = plan(), R = paintRun(), n1 = P.filter(q => q.layer === 1).length, two = P.length - n1, t2 = two ? paintRun(n1).seconds : 0;
    const out = `<b>${esc(PIC.title)}</b>, ${esc(PIC.sub)}: ${PIC.columns} columns ${fmt(PIC.pitch, 0)} mm apart, ${PIC.jars.length} jars, ${all.length} cells, ${all.reduce((a, q) => a + q.legs.length, 0)} legs.`
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
function settle() { RUNS.clear(); PLAN.clear(); RANGE.clear(); READS.clear(); PENRUNS.clear(); MARKSNOW.clear(); save(); showKeys(); showPanel(); kick(); }
$('#lib').onclick = async e => {
  const b = e.target.closest('.fg-card'); if (!b) return;
  if (lastSt && LIVE.includes(lastSt.state) && S.runPic && b.dataset.id !== S.runPic) return warn(`A run of ${esc(LIB[S.runPic]?.title ?? S.runPic)} is on: the library stays on it till the run ends or stops — the board's steps are read by its plan, its jars by its names.`);
  choose(b.dataset.id);
};
// a picture chosen in the library; while a run is on, the page keeps to the run's own (the owner, 2026-11-11: the classic's v.1 running, its v.2 card clicked to
// look at it — the LCD read the board's steps by v.2's plan, "Jar 1 · 1/63", 0 %, and v.2's jar numbers, one ahead of v.1's from its Jar 2 on, were taken for
// the run's: "the 7th is orange and the 8th grey")
function choose(id) { playStop(); popHide(); only = null; S.pic = id; PIC = picNow(S.pic); SEQ = seqOf(PIC); frameTool(false); fitted = ''; layout(); showKeys(); showPanel(); save(); }
function runPicture(st) {                                                             // a page opened during a run: back on its picture
  if (st && LIVE.includes(st.state) && S.runPic && S.pic !== S.runPic && LIB[S.runPic]) choose(S.runPic);
  // and its run's lines, the line it started from with them (PROGRESS, the LCD's jar), when the plan here gives the very blocks the board has
  if (st && LIVE.includes(st.state) && !RUN_INFO && S.runKey === 'drag' && S.pic === S.runPic && PIC) {
    const R = paintRun(S.runFrom ?? 0);
    if (R.blocks.length === st.blocks) { RUN = R.blocks; RUN_KEY = 'drag'; RUN_INFO = { seconds: R.seconds, rows: R.rows, passes: R.passes.map(q => q.pencil), from: S.runFrom ?? 0 }; }
  }
}
$('#views').onclick = e => { const b = e.target.closest('[data-view]'); if (!b) return; playStop(); S.view = b.dataset.view; save(); showKeys(); kick(); };
$('#runList').onclick = e => { const li = e.target.closest('li[data-id]'); if (!li) return; only = only === li.dataset.id ? null : li.dataset.id; [...$('#runList').children].forEach(q => q.classList.toggle('only', q.dataset.id === only)); kick(); };
for (const [id, k, lo, hi] of [['#fSpeed', 'speed', 5, 120], ['#fEvery', 'dipEvery', 0, 200], ['#fLap', 'dipLap', 0, 30], ['#fOver', 'over', 0, 8], ['#fPen', 'penSpeed', 5, 120], ['#fTravel', 'travel', 20, 180]]) {
  if ($(id)) $(id).onchange = e => { const v = +e.target.value; if (Number.isFinite(v)) S[k] = Math.max(lo, Math.min(hi, v)); e.target.value = S[k]; settle(); };
}
if ($('#btnFrame')) $('#btnFrame').onclick = () => frameTool(!frameOn);
if ($('#btnNoFrame')) $('#btnNoFrame').onclick = () => { frameTool(false); if (S.frames[S.pic]) setFrame(null, 'Frame taken away: the whole picture. F lays another.'); };
for (const [id, k] of [['#fLeft', 'edgeLeft'], ['#fBottom', 'edgeBottom']]) {
  $(id).onchange = e => { const v = +e.target.value; if (Number.isFinite(v)) placeNow()[k] = Math.round(v); e.target.value = placeNow()[k]; settle(); };
}

// ---------- the LCD, OPM-N's ----------
const mmss = t => { t = Math.max(0, Math.round(t || 0)); return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
const lcdTime = t => (t || 0) < 3600 ? segments(mmss(t), 17) : `<span class="hm">${segments(String(Math.floor(t / 3600)), 17)}<span class="tu">h</span>${segments(String(Math.floor(t % 3600 / 60)).padStart(2, '0'), 17)}<span class="tu">min</span></span>`;
function lcd(st) {
  const P_ = paintRun(), live = st && LIVE.includes(st.state);
  const Q = PLAY && !live ? PLAY : null;                                              // ▶ Play, nothing running: the run as it would go — how far, the time left (est.), its jar now
  const runPct = Q ? Q.want / Q.mm * 100 : st && st.state !== 'idle' ? (st.state === 'done' ? 100 : st.percent || 0) : 0;
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
  const state = Q ? 'play' : !st ? 'no server' : live ? (st.state === 'paused' ? 'paused' : 'live') : st.state === 'idle' ? 'plan' : st.state;
  const b = st && RUN?.[st.block], row = live && st.row ? R_.rows?.[st.row - 1] : null;
  const waiting = st?.state === 'paused' && st.message;
  paused = ['paused', 'pausing'].includes(st?.state);
  const keyEl = $('#btnPause');
  keyEl.querySelector('span').textContent = paused ? 'Cont.' : 'Pause'; keyEl.classList.toggle('call', paused); keyEl.disabled = !live;
  $('#btnHome').disabled = !!live; $('#btnBack').disabled = !live || RUN_KEY === 'bw';   // DRAW BW has no cells to go back to
  $('#btnDrag').classList.toggle('on', !!live && RUN_KEY === 'drag'); $('#btnTest').classList.toggle('on', !!live && RUN_KEY === 'test'); $('#btnBw')?.classList.toggle('on', !!live && RUN_KEY === 'bw');
  showElbow();
  const ids = Q ? Q.ids : (live && RUN_INFO?.passes) || P_.passes.map(q => q.pencil), pid = Q ? Q.ids[Q.n] : row?.pencil ?? (!live ? ids[0] : null), j = pid && jarOf(pid), nx = j && jarOf(ids[ids.indexOf(pid) + 1]);
  const cellNow = row?.cells?.[0]?.[0];
  const list = all, at = pid ? list.findIndex(q => q.pencil === pid) : -1;   // the line's place in the whole list, a run from a later line too
  if (live || Q) markRun(at);
  if (live) { NOW = RUN_KEY === 'bw' ? { line: st.row ? contour(RUN_INFO?.bw).lines[st.row - 1] : null } : row?.mark ? {} : { cell: list[at]?.byCell[(cellNow ?? 1) - 1] }; kick(); } else if (NOW?.cell) { NOW = null; if (!Q) markRun(-1); kick(); }
  const now = Q ? `${Q.q.mark ? `${Q.q.mark[0].toUpperCase()}${Q.q.mark.slice(1)}` : `Cell ${Q.q.num}${Q.q.idle ? ', idle' : ''}`} · ${fmt(pct / 100 * Q.metres / 1000, 1)} of ${fmt(Q.metres / 1000, 1)} m · est.` : waiting ? `❚❚ ${st.message}` : live && b?.home ? (RUN_KEY === 'home' ? 'HOME · the brush up, the carriage to home' : 'done · the carriage goes home, the brush off') : live && b?.wipe ? `${row?.label ?? ''} · the brush up to be wiped` : live && row && b?.dip ? `${row.label} · the dip in the cup` : live && row ? row.label + (RUN_KEY === 'bw' ? (st.brush_on ? ' · the pen on' : ' · the pen up') : st.brush_on ? ' · brush on' : ' · brush off') : PIC ? `${PIC.title} · ${fmt(P_.mm / 1000, 2)} m` : '';
  $('#lcd').innerHTML = `
    <div class="lcd-top"><span>${state === 'live' || Q ? '▶ ' : state === 'paused' ? '❚❚ ' : ''}${state}${live && RUN_KEY ? ` · ${{ test: 'TEST', home: 'HOME', drag: 'DRAG', bw: 'DRAW BW' }[RUN_KEY]}${st.trim ? ` ${sgn(st.trim)}` : ''}` : ''}</span><span>${Q ? `${fmt(pct / 100 * Q.metres / 1000, 2)} m` : live && st.blocks ? `step ${st.block + 1}/${st.blocks}` : `${fmt(P_.mm / 1000, 2)} m`}</span></div>
    <div class="lcd-mid">
      <div class="lcd-big">${segments(String(Math.min(100, Math.floor(pct))).padStart(2, ' '), 46)}<span class="u">%</span></div>
      <div class="lcd-times"><span class="k">left</span>${lcdTime(left)}<span class="k">total</span>${lcdTime(total)}</div>
    </div>
    ${sticks(pct / 100)}
    ${j ? `<div class="lcd-pencil"><i class="sw" style="background:${j.hex}"></i><span class="pt"><span class="pn">${esc(j.name)}</span><span class="pk">${live || Q ? 'painting' : 'first'} · ${Math.max(0, at) + 1}/${list.length}</span></span>${nx ? `<span class="nx"><span class="pk">next</span><span class="nn"><i style="background:${nx.hex}"></i><span>${esc(nx.name)}</span></span></span>` : '<span class="nx"><span class="pk">the last</span></span>'}</div>` : ''}
    <div class="lcd-now${waiting ? ' wait' : ''}">${now}</div>`;
}
async function watch() {
  let st = null;
  try { st = await (await fetch('/run', { cache: 'no-store' })).json(); } catch { }
  lastSt = st;
  runPicture(st);
  lcd(st);
  if (Date.now() - warnAt > WARN_S * 1000) $('#runState').innerHTML = !st ? 'no server: start rembrandt.py' : st.message ? `<span class="${st.state === 'error' ? 'warn' : ''}">${esc(st.message)}</span>` : '';
}

// ---------- start ----------
lampSwitch($('#lamp'));
(async () => {
  for (const id of LIBRARY) {
    const pic = await (await fetch(`${TAB}/${id}.json`, { cache: 'no-store' })).json();
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
  PIC = picNow(S.pic); SEQ = seqOf(PIC);
  await loadInk();
  layout(); settle(); watch();
  setInterval(watch, 500);
})();
