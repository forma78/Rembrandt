// HOLO2's page (2026-11-20): HOLO's page — the library on the left, the picture, the panel on the right — for the ribbons: the brush back and
// forth along a ribbon's lanes, as a road's markings (the owner: "not as the boards of a fence or sleepers"), a few mm aside from one to the next,
// the brush down, whatever the way (the owner: "the horizontal lines are the most dangerous … we draw them all the same, but on paper in the
// canvas's place, and test"); HOLO's two layers, the blues and the white first, the
// red and the yellow once the first has dried. The plan by holo2plan.js; HOLO's machine keys as they are (holo.js), copied so HOLO stays as it
// was: TEST, PAUSE, DRAW BW, LAYER 1 · LAYER 2 (HOLO's RUN 1 · RUN 2), BACK ONE JAR, STOP, HOME, the iPhone's remote, ELBOW LIVE.
import { HOLO2, HOLO2_LIB, planOf, movesOf, along, lineLen, isFlat, placeRange, WALL, contourHolo2, besideOf, MARKS_BESIDE, runsOf } from './holo2plan.js';
import { PEN, j3Runs } from './formgplan.js';
import { ELBOW_J3 } from './canon.js';
import { idleRowsOf } from './idleplan.js';
import { wipeBlocks, WIPE_NEW } from './inkaplan.js';
import { plotRun, DEFAULTS, homeBlocks, ELBOW_HOVER, TAIL_MIN, handDip, landingCheck } from './strokes.js';
import { machinePiece } from './inkaplan.js';
import { cupOf, cupProblem, dipAt } from './ink.js';
import { NO_DIP, DOT_MM, cornerDots, testSay } from './band.js';
import { testPrefs } from './prefs.js';
import { reach } from './machine.js';
import { segments, sticks } from './lcd.js';
import { lampSwitch } from './lamp.js';
import { qrSvg } from './qr.js';
import './ui.js';

const $ = s => document.querySelector(s), KEEP = 'rembrandt.holo2.v01', HOLO_KEEP = 'rembrandt.holo.v01', FORMG_KEEP = 'rembrandt.formg.v02', LIVE = ['running', 'stopping', 'pausing', 'paused'];
const PRESS_MIN = -4, PRESS_MAX = 8, TRAVEL = 100;   // FORM-G's: the brush's elbow, ELBOW LIVE's range; the carriage's travel with the brush up, mm/s
const sgn = v => `${v >= 0 ? '+' : '−'}${fmt(Math.abs(v), 1)}°`;
const fmt = (v, d = 1) => Number(v).toFixed(d), esc = v => String(v ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const hm = t => { const m = Math.round((t || 0) / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`; };
const GROUND = '#F3F0E6';   // the primed canvas, as HOLO draws it
const LAYER = { 1: 'Layer 1 · the blues and the white', 2: 'Layer 2 · the reds and the yellow, on the dry first' };
const S = { pic: HOLO2_LIB[0], view: 'picture', lasts: HOLO2.lasts, group: HOLO2.group, sDab: HOLO2.sDab, speed: HOLO2.speed, place: {},
  penSpeed: PEN.speed, travel: TRAVEL, tail: 3, press: 0, bw: 'outline', flat: false };
try { Object.assign(S, JSON.parse(localStorage.getItem(KEEP) || 'null') ?? {}); } catch { }
const save = () => { try { localStorage.setItem(KEEP, JSON.stringify(S)); } catch { } };
if (!S.machine) {                                                                     // the machine's keys first seen: the brush as it is tuned on HOLO, else FORM-G, once
  for (const k of [HOLO_KEEP, FORMG_KEEP]) {
    try { const g = JSON.parse(localStorage.getItem(k) || 'null'); if (g) { for (const q of ['press', 'penSpeed', 'travel', 'tail']) if (Number.isFinite(g[q])) S[q] = g[q]; break; } } catch { }
  }
  S.machine = 1; save();
}

// ---------- the library ----------
const LIB = {}, IMG = {}, AFTER1 = {};
let PIC = null;
// MARKS (README's canon, 2026-11-14) wherever they fit within the walls: a 60 × 60 on the canvas's margins by the field
const opts = (pic = PIC) => ({ lasts: S.lasts, group: S.group, sDab: S.sDab, speed: S.speed, marks: !!pic && placeRange(pic, reach()).marks });
const PLANS = new Map();
function plan(pic = PIC) {
  const key = JSON.stringify([pic.id, opts(pic)]);
  if (!PLANS.has(key)) { if (PLANS.size > 8) PLANS.clear(); PLANS.set(key, planOf(pic, opts(pic))); }
  return PLANS.get(key);
}
const total = P => P.reduce((t, q) => t + q.seconds, 0);
const dabsIn = (P, run) => P.filter(q => !run || q.run === run).reduce((t, q) => t + q.dabs, 0);
const jarTag = j => j.number == null ? ' <em>no number</em>' : '';

// ---------- where the canvas lies ----------
const rangeOf = () => placeRange(PIC, reach());
const nearZero = ([lo, hi]) => lo > hi ? Math.round((lo + hi) / 2) : Math.round(Math.min(hi, Math.max(lo, 0)));
function placeNow() {
  if (!S.place[PIC.id]) { const r = rangeOf(); S.place[PIC.id] = { edgeLeft: nearZero(r.left), edgeBottom: nearZero(r.bottom) }; save(); }
  return S.place[PIC.id];
}
function wallsSay() {
  const r = rangeOf(), c = placeNow(), out = [];
  if (r.left[0] > r.left[1]) out.push(`the field, ${fmt(PIC.field.x1 - PIC.field.x0, 0)} mm across, is wider than the reach between the Y walls with their margins`);
  else if (c.edgeLeft < r.left[0] || c.edgeLeft > r.left[1]) out.push(`the left edge out of ${fmt(r.left[0], 0)} … ${fmt(r.left[1], 0)}${r.marks ? ', MARKS\' marks within the walls' : ''}`);
  if (c.edgeBottom < r.bottom[0] || c.edgeBottom > r.bottom[1]) out.push(`the bottom edge out of ${fmt(r.bottom[0], 0)} … ${fmt(r.bottom[1], 0)}`);
  return out.length ? `Past the walls: ${out.join('; ')}.` : '';
}

// ---------- the machine: HOLO's keys (holo.js), its moves as they are ----------
const hereNow = () => { const R = reach(), c = placeNow(); return { x: R.x.min + c.edgeBottom + PIC.h / 2, y: R.y.min + c.edgeLeft + PIC.w / 2 }; };
let INK = {};
async function loadInk() { try { const r = await fetch('/ink', { cache: 'no-store' }); INK = r.ok ? await r.json() : {}; } catch { INK = {}; } }
const cup = () => cupOf(INK);
const dipCup = () => { const c = cup(), d = dipAt(c); return d ? { ...c, x: d.x, y: d.y } : c; };
const cupName = () => cup().hand ? 'the cup at hand (INK-Y)' : 'the cup of the Ink tab';
const opts0 = () => ({ ...DEFAULTS, speed: S.speed, travel: S.travel, tail: S.tail, lift: true, ink: true, snake: true, pause: false, cup: dipCup(), hover: ELBOW_HOVER, press: S.press, noDipUnder: 0 });
const runOpts = rows => ({ ...opts0(), rows, here: hereNow(), noDipUnder: NO_DIP });
const EMPTY = { blocks: [], rows: [], seconds: 0, mm: 0, lines: 0 };
const pastMM = v => `${fmt(v, v < 10 ? 1 : 0)} mm of the brush's way`;
function walls(P_) {
  if (!P_) return '';
  if (P_.gone) return `${pastMM(P_.pastWall)} would lie past the walls, ${P_.gone} legs gone: move the canvas (The canvas).`;
  return P_.pastWall > 0.05 ? `${pastMM(P_.pastWall)} would lie past the walls: move the canvas (The canvas).` : '';
}
// DRAW BW, HOLO's: the generator's lines in one pen; once, over the first line's start, the holder down and a p-pause, the pen in with its tip on the
// paper. No dip, no jar. S.bw: 'outline', where the paint meets the bare canvas, to lay the canvas (or the paper) by — the default; 'all', every border
// between two colours, to study the picture
const PENRUNS = new Map(), BW_KINDS = { outline: 'The outline alone', all: 'Every border between two colours' };
const bwKind = k => (k ?? S.bw) === 'all' ? 'all' : 'outline';
const contour = k => contourHolo2(PIC, { outline: bwKind(k) === 'outline' });
const penAt = () => ({ press: S.press, glide: S.press + PEN.air, in: S.press + PEN.in });
function penRun(k) {
  if (!PIC) return EMPTY;
  const c = dipCup(), key = JSON.stringify([PIC.id, bwKind(k), S.press, S.penSpeed, S.travel, hereNow(), !!c.hand]);
  if (PENRUNS.has(key)) return PENRUNS.get(key);
  const C = contour(k), o = { cw: PIC.w, ch: PIC.h }, at = penAt();
  if (!C.lines.length) return EMPTY;
  const ps = C.lines.map((l, i) => l.slice(1).map((b, j) => ({ ...machinePiece({ t: 'L', a: l[j], b }, o), tilt: 0, row: i + 1 })));
  const r = plotRun({ ...DEFAULTS, speed: S.penSpeed, travel: S.travel, tail: TAIL_MIN, lift: true, ink: false, snake: false, pause: false, minPiece: 0.005, pencil: { press: at.press, glide: at.glide }, hover: at.glide, here: hereNow(), rows: ps.length }, [{ key: 'DRAW', ps, why: null }]);
  const H = c.hand ? handDip(c, 0) : null, blocks = H ? [{ ...H[0], dip: false }, { ...H[5], dip: false }, ...r.blocks.slice(1)] : r.blocks.slice();
  const first = blocks.findIndex(b => b.kind === 'move' && b.row === 1 && /^T /.test(b.cmds[0]));   // over the first line's start: down, the pen in
  if (first >= 0) blocks.splice(first + 1, 0, { kind: 'arm', cmd: `J 2 ${at.in}`, row: 1 }, { kind: 'p-pause', why: `DRAW BW: the brush out, the pen in the holder, its tip on the paper; then Continue`, row: 1 });
  const out = { key, ...r, blocks, rows: C.lines.map((l, i) => ({ label: `DRAW BW · ${bwKind(k) === 'outline' ? 'the outline · ' : ''}line ${i + 1} of ${C.lines.length}`, cells: [] })), mm: C.mm, lines: C.lines.length, kind: bwKind(k) };
  if (PENRUNS.size > 4) PENRUNS.clear();
  PENRUNS.set(key, out);
  return out;
}
let warnAt = 0;   // a warning stays WARN_S before the next look at the run writes over it
const WARN_S = 5, warn = t => { warnAt = Date.now(); $('#runState').innerHTML = `<span class="warn">${t}</span>`; };
let RUN = null, RUN_INFO = null, RUN_KEY = null, lastSt = null, paused = false;
const isLive = (st = lastSt) => !!st && LIVE.includes(st.state);
async function start(key, blocks, info, log) {
  playStop();
  if (blocks.some(b => b.fork)) {                                                     // only a rembrandt.py that knows the cup at hand takes its forks (inka.js's start)
    let st = null; try { st = await (await fetch('/run', { cache: 'no-store' })).json(); } catch { }
    if (st && !(st.hand >= 1)) { alert('The cup at hand (INK-Y): restart rembrandt.py first — the one running does not know it yet. Nothing was sent.'); return; }
  }
  try {
    RUN = blocks; RUN_INFO = info; RUN_KEY = key; S.runPic = S.pic; S.runKey = key; S.runBw = info.bw ?? null; S.runFrom = info.from ?? 0; S.runT = Date.now() / 1000; save();
    const r = await fetch('/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blocks, log }) });
    $('#runState').textContent = await r.text();
  } catch { $('#runState').textContent = 'start rembrandt.py'; }
}
// rembrandt.py knows the brush by its page, OPM-N's (PENCIL_PAGES), FORM-G's and HOLO's the same: the same brush, its own `tab` in the journal
const logOf = (o = {}) => ({ page: 'opmn', tab: 'holo2', label: `HOLO2 · ${PIC.title}`, here: hereNow(), ...o });
function bwCheck(R) {
  const at = penAt();
  if (!R.rows.length) return 'Nothing to draw.';
  if (R.fault) return `Not run: the plan is wrong — ${R.fault}.`;
  if (walls(R)) return walls(R).replace("the brush's way", "the pen's way");
  const dbg = landingCheck(R.blocks, at.press, at.glide);
  if (!dbg.ok) return `Not run — debug: ${dbg.bad.length} drawn piece${dbg.bad.length === 1 ? '' : 's'} with the pen not down${dbg.bad.length ? `, the first at carriage X ${fmt(dbg.bad[0].at[0], 1)} · Y ${fmt(dbg.bad[0].at[1], 1)}, the elbow at ${dbg.bad[0].deg === null ? 'nothing yet' : sgn(dbg.bad[0].deg)}, not ${sgn(at.press)}` : ''}.`;
  return { dbg };
}
function bwText(R, dbg) {
  const at = penAt(), all = R.kind === 'all';
  return `Debug ✓ ${dbg.lines} line${dbg.lines === 1 ? '' : 's'}: ${dbg.downs} down${dbg.downs === 1 ? '' : 's'} to ${sgn(at.press)}; ${fmt(dbg.pressed / 1000, 2)} m drawn, every mm of it with the pen down.\n\n`
    + (all ? `Every border between two colours of ${PIC.title} and its outline on the bare canvas, the strokes as the brush lays them — ${R.lines} lines, every one once`
      : `The outline of ${PIC.title} alone, where its paint meets the bare canvas, no line inside — ${R.lines} line${R.lines === 1 ? '' : 's'}`)
    + `, in one pen, no dip, no jar: ${fmt(R.mm / 1000, 2)} m at ${S.penSpeed} mm/s, ≈ ${hm(R.seconds)} (est.). `
    + `The carriage goes over the first line and puts the holder down, ${sgn(at.in)}: the brush out, the pen in, its tip on the paper, then Continue — no stop after it. The pen draws at the brush's elbow, ${sgn(at.press)} (Elbow live · brush, live while it draws), the carriage on the line, so it goes where the brush will paint; ${sgn(at.glide)} over a line's start, up between lines. `
    + `The paper where the canvas will lie: its left edge ${placeNow().edgeLeft} mm, its bottom edge ${placeNow().edgeBottom} mm from home — is it taped there?`;
}
$('#btnBw').onclick = async () => {
  await loadInk();
  if (!PIC) return;
  if (isLive()) return warn('A run is on: STOP it first.');
  const textOf = R => { const c = bwCheck(R); return typeof c === 'string' ? c : bwText(R, c.dbg); };
  const choice = { value: bwKind(), options: Object.entries(BW_KINDS).map(([v, t]) => ({ value: v, text: `${t} · ≈ ${hm(penRun(v).seconds)}` })), pick: v => { S.bw = v; save(); kick(); return textOf(penRun(v)); } };
  if (!await askDraw(textOf(penRun()), choice)) { showPanel(); return; }
  const R = penRun(), c = bwCheck(R);
  if (typeof c === 'string') return warn(c);
  const at = penAt();
  S.view = 'contour'; RUN_PRESS = S.press; save(); showKeys(); kick();
  await start('bw', R.blocks, { seconds: R.seconds, rows: R.rows, bw: R.kind },
    logOf({ pass: 'draw bw', label: `HOLO2 · ${PIC.title} · DRAW BW, the pen · ${R.kind === 'all' ? 'every border' : 'the outline'}`, settings: { ...S, place: placeNow() }, debug: { lines: c.dbg.lines, downs: c.dbg.downs, ups: c.dbg.ups, press: at.press, glide: at.glide }, estimate_s: Math.round(R.seconds) }));
};
function askDraw(text, choice) {
  const box = $('#drawAsk'), sel = $('#drawFrom');
  $('#drawAskTitle').textContent = `DRAW BW HOLO2 · ${PIC.title} · the lines in one pen`;
  $('#drawAskFirst').innerHTML = `<i class="sw" style="background:#24221F"></i><span class="pt"><span class="k">In the holder</span><b>The pen</b><span>its tip on the paper, the brush out</span></span>`;
  $('#drawAskText').textContent = text;
  sel.innerHTML = choice.options.map(q => `<option value="${q.value}">${esc(q.text)}</option>`).join('');
  sel.value = choice.value;
  sel.onchange = () => { $('#drawAskText').textContent = choice.pick(sel.value); };
  box.hidden = false; $('#drawGo').focus();
  return new Promise(ok => {
    const key = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); end(false); } };
    const end = v => { box.hidden = true; removeEventListener('keydown', key, true); ok(v); };
    addEventListener('keydown', key, true);
    $('#drawGo').onclick = () => end(true); $('#drawNo').onclick = () => end(false);
    box.onclick = e => { if (e.target === box) end(false); };
  });
}
// TEST, HOLO's: the canvas's own corners Preferences' margin in, TL twice as they say; a canvas wider than the reach (a 60 × 60), the field's
// corners. One dip, home.
const TEST_IN = 0.2;
function boxDots(b, o = testPrefs()) {
  const dots = [['TL', b.x1, b.y0], ['TR', b.x1, b.y1], ['BR', b.x0, b.y1], ['BL', b.x0, b.y0]].map(([name, x, y]) => {
    const d = Math.hypot(x, y) || 1, l = Math.min(DOT_MM, d); return { name, at: { x, y }, to: { x: x - x / d * l, y: y - y / d * l } };
  });
  if ((o.first ?? 1) >= 2) dots.splice(1, 0, { ...dots[0], name: 'TL again', wait: o.gap ?? 0 });
  return dots;
}
function testDots() {
  if (!PIC?.snakes.length) return null;
  const R = reach(), h = hereNow(), f = PIC.field;
  const past = q => { const x = h.x + q.x, y = h.y + q.y; return Math.max(R.x.min + TEST_IN - x, x - (R.x.max - TEST_IN), R.y.min + TEST_IN - y, y - (R.y.max - TEST_IN), 0); };
  const fits = PIC.w <= R.y.max - R.y.min - 2 * TEST_IN && PIC.h <= R.x.max - R.x.min - 2 * TEST_IN;
  if (fits) {
    const dots = cornerDots(PIC.w, PIC.h).dots;
    if (dots.length) return { dots, by: 'canvas', off: dots.filter(d => past(d.at) > 0 || past(d.to) > 0).map(d => ({ name: d.name, mm: Math.max(past(d.at), past(d.to)) })) };
  }
  return { dots: boxDots({ x0: f.y0 - PIC.h / 2, x1: f.y1 - PIC.h / 2, y0: f.x0 - PIC.w / 2, y1: f.x1 - PIC.w / 2 }), by: 'field', off: [] };
}
function testRun() {
  const D = testDots();
  if (!D) return null;
  const passes = [{ key: 'TEST', ps: D.dots.map((d, i) => [{ t: 'L', a: d.at, b: d.to, tilt: 0, row: i + 1, ...(d.wait !== undefined ? { wait: d.wait } : {}) }]), why: null }];
  return { ...plotRun(runOpts(D.dots.length), passes), ...D };
}
$('#btnTest').onclick = async () => {
  await loadInk();
  if (!PIC) return;
  if (isLive()) return warn('A run is on: STOP it first.');
  const here = hereNow(), T = testRun(), c = placeNow();
  if (!T) return warn('Nothing to paint.');
  if (T.off.length) return warn(`TEST: ${T.off.map(d => `${d.name} ${fmt(d.mm, 1)} mm`).join(', ')} past the walls — the canvas's corners out of the brush's reach: move the canvas (The canvas) by as much.`);
  if (cupProblem(cup())) return warn(`TEST dips in ${cupName()}: ${cupProblem(cup())}`);
  if (T.fault) return warn(`Not run: the test is wrong — ${T.fault}.`);
  if (walls(T)) return warn(walls(T));
  const at = d => `${d.name} X ${fmt(here.x + d.at.x, 1)} · Y ${fmt(here.y + d.at.y, 1)}`, P = testPrefs();
  if (!confirm(`TEST: one dip in the cup, then ${T.by === 'canvas' ? `${testSay()} of the ${PIC.w / 10} × ${PIC.h / 10} canvas (Preferences): TL to TR ${fmt(PIC.w - 2 * P.margin, 0)} mm, BL to TL ${fmt(PIC.h - 2 * P.margin, 0)} mm`
      : `a dot at each corner of the picture's field${P.first >= 2 ? `, two at TL ${P.gap} s apart (Preferences)` : ''} — the ${PIC.w / 10} × ${PIC.h / 10} canvas is wider than the reach, its corners past the walls`} — ${T.dots.map(at).join(', ')} — and home.\n\n`
    + `The canvas: its left edge ${c.edgeLeft} mm, its bottom edge ${c.edgeBottom} mm from home; its centre at carriage X ${fmt(here.x, 0)} · Y ${fmt(here.y, 0)}.`)) return;
  await start('test', T.blocks, { seconds: T.seconds, rows: T.dots.map(d => ({ label: `TEST · ${d.name}` })) }, logOf({ pass: 'test', cup: cup(), by: T.by, margin: T.by === 'canvas' ? testPrefs().margin : null, centre: { x: here.x, y: here.y }, dots: T.dots.map(d => ({ name: d.name, x: +(here.x + d.at.x).toFixed(1), y: +(here.y + d.at.y).toFixed(1) })), estimate_s: Math.round(T.seconds) }));
};
const post = async path => { try { const r = await fetch(path, { method: 'POST' }); return await r.text(); } catch { return 'start rembrandt.py'; } };
$('#btnHome').onclick = () => { if (PIC && !isLive()) start('home', homeBlocks(S.travel), { seconds: 0, rows: [{ label: 'HOME' }] }, logOf({ label: 'HOLO2 · HOME' })); };
$('#btnPause').onclick = () => post(paused ? '/run/continue' : '/run/pause');
$('#btnStop').onclick = () => post('/run/stop');
// BACK ONE JAR, FORM-G's and HOLO's, rembrandt.py's back_jar: a run's jars by its remote rows; DRAW BW and TEST have none, the key off in them
let backSaid = 0;
$('#btnBack').onclick = async () => {
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
  box.innerHTML = L?.url ? `${qrSvg(L.url)}<p>The iPhone's camera on it, on the same Wi-Fi; in Safari Share → <b>Add to Home Screen</b> for an icon. Pause · Continue and STOP there.</p><code>${esc(L.url)}</code>`
    : L ? '<p>rembrandt.py listens on this Mac only (REMBRANDT_LISTEN=127.0.0.1), or the Mac is on no Wi-Fi.</p>'
    : '<p>No answer from rembrandt.py: start it.</p>';
};
// ELBOW LIVE, FORM-G's: the brush pressed at so many degrees, 0° its pose, minus down; while DRAW BW draws, from the next stroke on, rembrandt.py's trim
let RUN_PRESS = null, elbowT = null;
const elbowLive = () => isLive() && RUN_KEY === 'bw';
function showElbow() {
  const sl = $('#brushSl'); sl.min = PRESS_MIN; sl.max = PRESS_MAX;
  if (document.activeElement !== sl) sl.value = S.press;
  $('#brushNow').textContent = sgn(S.press);
  $('#elbowBrush').classList.toggle('live', elbowLive());
}
function setElbow(deg) {
  const v = Math.max(PRESS_MIN, Math.min(PRESS_MAX, Math.round(deg * 10) / 10));
  if (v === S.press) return;
  const on = elbowLive();
  if (on && RUN_PRESS === null) RUN_PRESS = S.press - (lastSt.trim ?? 0);
  S.press = v; save(); showElbow();
  if (on) { clearTimeout(elbowT); elbowT = setTimeout(async () => {
    try { const r = await fetch(`/run/trim?deg=${Math.round((S.press - RUN_PRESS) * 10) / 10}`, { method: 'POST' }); $('#runState').innerHTML = r.ok ? '' : `<span class="warn">ELBOW LIVE: ${esc(await r.text())}</span>`; } catch { $('#runState').textContent = 'start rembrandt.py'; }
  }, 120); }
}
$('#brushSl').oninput = e => setElbow(+e.target.value);
document.querySelectorAll('#elbowBrush [data-btrim]').forEach(b => { b.onclick = () => setElbow(S.press + +b.dataset.btrim); });
// a run is this page's when it started as this page sent it (rembrandt.py's `started`); another page's is shown as such, its keys STOP and PAUSE alone
const ours = st => !!S.runT && Math.abs((st?.started ?? 0) - S.runT) < 15;
function runPicture(st) {
  if (isLive(st) && !ours(st)) { RUN = RUN_INFO = RUN_KEY = null; return; }
  if (!isLive(st) || !S.runPic || !LIB[S.runPic]) return;
  if (S.pic !== S.runPic) choose(S.runPic);
  if (!RUN_INFO && S.runKey === 'bw' && PIC) {
    const R = penRun(S.runBw ?? undefined);
    if (R.blocks.length === st.blocks) { RUN = R.blocks; RUN_KEY = 'bw'; RUN_INFO = { seconds: R.seconds, rows: R.rows, bw: R.kind }; }
  }
  if (!RUN_INFO && /^run[12]$/.test(S.runKey ?? '') && PIC) {                       // LAYER 1 · LAYER 2: its rows again when the plan gives the very blocks
    const R = layerRun(+S.runKey.slice(3), S.runFrom ?? 0);
    if (R.blocks.length === st.blocks) { RUN = R.blocks; RUN_KEY = S.runKey; RUN_INFO = { seconds: R.seconds, rows: R.rows, from: R.from }; }
  }
}
async function watch() {
  let st = null;
  try { st = await (await fetch('/run', { cache: 'no-store' })).json(); } catch { }
  lastSt = st;
  runPicture(st);
  lcd(st);
  if (Date.now() - warnAt > WARN_S * 1000) $('#runState').innerHTML = !st ? 'no server: start rembrandt.py' : st.message ? `<span class="${st.state === 'error' ? 'warn' : ''}">${esc(st.message)}</span>` : '';
}

// ---------- the screen ----------
const cv = $('#cv'), stage = $('#stage'), ctx = cv.getContext('2d');
let K = 1, OX = 0, OY = 0, fitted = '', only = null, PLAY = null, NOW = null;
const PLAY_MS = 18000;   // ▶ Play's whole run, HOLO's 18 s
const besideNow = () => { const w = PIC && opts().marks; return w ? besideOf(PIC, w) : null; };
function fit() { const r = stage.getBoundingClientRect(), m = 26, e = besideNow()?.where === 'off' ? MARKS_BESIDE.slip + 6 : 0, k = Math.min((r.width - 2 * m) / (PIC.w + 2 * e), (r.height - 2 * m) / PIC.h); K = k; OX = (r.width - PIC.w * k) / 2; OY = (r.height - PIC.h * k) / 2; }
const sx = x => OX + x * K, sy = y => OY + (PIC.h - y) * K;
function layout() {
  const r = stage.getBoundingClientRect(), d = devicePixelRatio || 1;
  cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
  const was = `${S.pic}|${Math.round(r.width)}|${Math.round(r.height)}`;
  if (PIC && fitted !== was) { fit(); fitted = was; }
  kick();
}
let drawT = 0;
function kick() { if (!drawT) drawT = requestAnimationFrame(() => { drawT = 0; draw(); }); }
// a puddle as HOLO draws it — a drop 4 mm wide, longer by its dabs, a light on it — laid along its lane (mm → px by `k`, at x, y px; u the lane's way, y up)
function puddle(g, x, y, dabs, hex, k, u = [0, 1]) {
  const rx = 2 * k, ry = (2.6 + 1.1 * dabs) * k;
  g.save(); g.translate(x, y); g.rotate(Math.atan2(u[0], u[1]));
  g.fillStyle = hex; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,255,255,.38)'; g.beginPath(); g.ellipse(-rx * 0.28, -ry * 0.25, rx * 0.25, ry * 0.25, 0, 0, 7); g.fill();
  g.restore();
}
const dim = id => only && only !== id ? 0.08 : 1;
function drawPuddles(g, run) {
  for (const L of plan()) if (L.run === run) { g.globalAlpha = dim(L.key); for (const p of L.puddles) puddle(g, sx(p.x), sy(p.y), p.dabs, L.hex, K, p.u); }
  g.globalAlpha = 1;
}
// a snake as the brush lays it: its polyline the brush wide, the brush down from leg to leg
function snakePath(g, pts, X, Y) { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1]))); }
const brushW = k => Math.max(0.5, PIC.pitch * k * 0.92);
// the picked jar's way: an arrowhead inside every leg's end
function wayHeads(g, L) {
  const h = PIC.pitch * K * 0.4;
  if (h < 1.5) return;
  g.fillStyle = 'rgba(36,34,31,.7)';
  for (const it of L.items) {
    const b = it.pts.at(-1), a = it.pts.at(-2), e = [sx(b[0]), sy(b[1])], d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / d, uy = -(b[1] - a[1]) / d;
    g.beginPath(); g.moveTo(e[0] - ux * h * 2.2 - uy * h, e[1] - uy * h * 2.2 + ux * h); g.lineTo(e[0] - ux * h * 2.2 + uy * h, e[1] - uy * h * 2.2 - ux * h); g.lineTo(e[0] - ux * h * 0.3, e[1] - uy * h * 0.3); g.closePath(); g.fill();
  }
}
function drawStrokes(g) {
  g.lineCap = 'butt'; g.lineJoin = 'round';
  for (const run of [1, 2]) for (const L of plan()) {
    if (L.run !== run) continue;
    g.globalAlpha = dim(L.key); g.strokeStyle = L.hex; g.lineWidth = brushW(K);
    for (const q of L.strokes) { snakePath(g, q.pts, sx, sy); g.stroke(); }
    if (only === L.key) { g.globalAlpha = 1; wayHeads(g, L); }
  }
  g.globalAlpha = 1;
}
// the horizontal strokes (the owner: "the most dangerous, our brush is flat"): every stretch of a leg within HOLO2.flat° of the canvas's horizontal
// dashed dark along its middle, steady, over any view — the ones to watch on the paper
function drawFlats(g) {
  if (!S.flat) return;
  g.save(); g.setLineDash([4, 3]); g.strokeStyle = 'rgba(20,18,16,.9)'; g.lineWidth = Math.max(1, 0.5 * K); g.lineCap = 'butt';
  for (const L of plan()) {
    if (only && only !== L.key) continue;
    g.beginPath();
    for (const it of L.items) if (it.flatMm) for (let i = 1; i < it.pts.length; i++) {
      const a = it.pts[i - 1], b = it.pts[i];
      if (isFlat(a, b)) { g.moveTo(sx(a[0]), sy(a[1])); g.lineTo(sx(b[0]), sy(b[1])); }
    }
    g.stroke();
  }
  g.restore();
}
function draw() {
  const d = devicePixelRatio || 1, r = stage.getBoundingClientRect(), g = ctx;
  g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, r.width, r.height);
  if (!PIC) return;
  g.fillStyle = GROUND; g.fillRect(sx(0), sy(PIC.h), PIC.w * K, PIC.h * K);
  g.strokeStyle = 'rgba(36,34,31,.35)'; g.lineWidth = 1; g.strokeRect(sx(0), sy(PIC.h), PIC.w * K, PIC.h * K);
  g.imageSmoothingQuality = 'high';
  const img = (im, a = 1) => { if (im?.complete) { g.globalAlpha = a; g.drawImage(im, sx(0), sy(PIC.h), PIC.w * K, PIC.h * K); g.globalAlpha = 1; } };
  if (PLAY) g.drawImage(PLAY.cv, sx(0), sy(PIC.h), PIC.w * K, PIC.h * K);
  else if (S.view === 'picture') { img(IMG[S.pic]); if (only) { g.fillStyle = 'rgba(243,240,230,.8)'; g.fillRect(sx(0), sy(PIC.h), PIC.w * K, PIC.h * K); drawStrokes(g); } }
  else if (S.view === 'p1') drawPuddles(g, 1);
  else if (S.view === 'p2') { img(AFTER1[S.pic]); drawPuddles(g, 2); }
  else if (S.view === 'contour') { img(IMG[S.pic], 0.28); drawContour(g); }
  else drawStrokes(g);
  if (!PLAY) drawFlats(g);
  drawMarks(g);
  const W = reach(), c = placeNow(), x0 = W.y.min - c.edgeLeft, x1 = W.y.max - c.edgeLeft, y0 = W.x.min - c.edgeBottom, y1 = W.x.max - c.edgeBottom;
  g.save(); g.setLineDash([6, 4]); g.strokeStyle = '#EB7A25'; g.lineWidth = 1.2; g.strokeRect(sx(x0), sy(y1), (x1 - x0) * K, (y1 - y0) * K); g.restore();
  g.save(); g.strokeStyle = '#EB7A25'; g.lineWidth = 1.2;
  for (const d of testDots()?.dots ?? []) { const X = sx(PIC.w / 2 + d.at.y), Y = sy(PIC.h / 2 + d.at.x); g.beginPath(); g.moveTo(X - 5, Y); g.lineTo(X + 5, Y); g.moveTo(X, Y - 5); g.lineTo(X, Y + 5); g.stroke(); }
  g.restore();
  if (NOW?.line) { g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = Math.max(2, 1.6 * K); g.strokeStyle = '#EB7A25'; linePath(g, NOW.line); g.stroke(); }
  if (PLAY?.tip) { const t = PLAY.tip; g.fillStyle = t.hex; g.strokeStyle = t.kind === 'dab' ? '#EB7A25' : '#24221F'; g.lineWidth = 2; g.beginPath(); g.arc(sx(t.at[0]), sy(t.at[1]), 5, 0, 7); g.fill(); g.stroke(); }
}
// MARKS: every slip the paper, its number; its cells, and the marks in their jars' colours where the view shows the paint (Picture, Drag), ▶ Play's as it lays them
function drawMarks(g) {
  const B = besideNow();
  if (!B) return;
  const o = MARKS_BESIDE, P = plan(), cellsOnly = ['p1', 'p2', 'contour'].includes(S.view) && !PLAY;
  g.save();
  for (const s of B.strips) {
    const [x0, y0, x1, y1] = s.slip;
    g.fillStyle = 'rgba(255,255,255,.92)'; g.strokeStyle = 'rgba(36,34,31,.45)'; g.lineWidth = 1;
    g.fillRect(sx(x0), sy(y1), (x1 - x0) * K, (y1 - y0) * K); g.strokeRect(sx(x0), sy(y1), (x1 - x0) * K, (y1 - y0) * K);
    g.fillStyle = '#B3470C'; g.font = '600 11px ui-monospace, Menlo, monospace'; g.textAlign = 'center'; g.fillText(String(s.no), sx((x0 + x1) / 2), sy(y1) - 5);
  }
  g.strokeStyle = 'rgba(36,34,31,.28)'; g.lineWidth = 1;
  for (const L of P) for (const m of L.marks) { const [x, y] = m.at; g.strokeRect(sx(x - o.trail / 2), sy(y + o.leg / 2), o.trail * K, o.leg * K); }
  if (!cellsOnly) {
    g.lineCap = 'round'; g.lineWidth = Math.max(0.5, o.trail * K * 0.92);
    const shown = PLAY ? PLAY.marks : P.flatMap(L => L.marks.map(m => ({ pts: m.pts, hex: L.hex, key: L.key })));
    for (const m of shown) { g.globalAlpha = dim(m.key); g.strokeStyle = m.hex; g.beginPath(); g.moveTo(sx(m.pts[0][0]), sy(m.pts[0][1])); g.lineTo(sx(m.pts[1][0]), sy(m.pts[1][1])); g.stroke(); }
  }
  g.restore();
}
const linePath = (c, l) => { c.beginPath(); l.forEach((q, i) => i ? c.lineTo(sx(q[0]), sy(q[1])) : c.moveTo(sx(q[0]), sy(q[1]))); };
function drawContour(c) {
  c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = Math.max(0.75, 0.5 * K); c.strokeStyle = '#24221F';
  for (const l of contour().lines) { linePath(c, l); c.stroke(); }
}
const toPt = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
cv.addEventListener('wheel', e => {
  e.preventDefault();
  if (!PIC) return;
  const [px, py] = toPt(e);
  if (e.ctrlKey || e.metaKey || Math.abs(e.deltaX) < 1) { const f = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0022)), k = Math.max(0.05, Math.min(30, K * f)); OX = px - (px - OX) * k / K; OY = py - (py - OY) * k / K; K = k; }
  else { OX -= e.deltaX; OY -= e.deltaY; }
  kick();
}, { passive: false });
let dragFrom = null;
cv.addEventListener('pointerdown', e => { dragFrom = [e.clientX, e.clientY, OX, OY]; cv.setPointerCapture(e.pointerId); cv.classList.add('drag'); });
cv.addEventListener('pointermove', e => { if (dragFrom) { OX = dragFrom[2] + e.clientX - dragFrom[0]; OY = dragFrom[3] + e.clientY - dragFrom[1]; kick(); } });
cv.addEventListener('pointerup', () => { dragFrom = null; cv.classList.remove('drag'); });
cv.addEventListener('dblclick', () => { if (PIC) { fit(); kick(); } });
new ResizeObserver(layout).observe(stage);
addEventListener('storage', e => { if (e.key === null || e.key === 'rembrandt.prefs.v01') kick(); });

// ▶ Play: the two layers as they will go, a group's puddles laid, then its snake, on an offscreen canvas at 2 px a mm; HOLO's clock, slow at first
// (the clock squared), 18 s; the LCD follows it. A view: it moves nothing
function playStop() {
  if (!PLAY) return;
  cancelAnimationFrame(PLAY.raf); clearTimeout(PLAY.end); PLAY = null;
  $('#btnPlay').textContent = '▶ Play'; $('#btnPlay').classList.remove('on');
  markRun(-1); lcd(); kick();
}
$('#btnPlay').onclick = () => {
  if (PLAY) return playStop();
  if (!PIC) return;
  const P = plan(), M = movesOf(P, opts()), s = 2, off = document.createElement('canvas'), c = off.getContext('2d');
  if (!M.length) return;
  off.width = PIC.w * s; off.height = PIC.h * s; c.fillStyle = GROUND; c.fillRect(0, 0, off.width, off.height);
  const X = x => x * s, Y = y => (PIC.h - y) * s, end = M.at(-1).to;
  const Q = PLAY = { cv: off, end, want: 0, i: 0, at: 0, tip: null, line: 0, t0: performance.now(), said: 0, P, M, marks: [] };
  $('#btnPlay').textContent = '■ Stop'; $('#btnPlay').classList.add('on');
  const step = () => {
    if (PLAY !== Q) return;
    const t = performance.now(), u = Math.min(1, (t - Q.t0) / PLAY_MS);
    Q.want = u < 1 ? end * u * u : end;
    while (Q.i < M.length && M[Q.i].from <= Q.want) {
      const m = M[Q.i], L = P[m.line], f = Math.min(1, (Q.want - m.from) / (m.to - m.from || 1));
      if (m.kind === 'mark') { if (f >= 1) Q.marks.push({ pts: m.pts, hex: L.hex, key: L.key }); Q.tip = { kind: 'dab', at: m.at, hex: L.hex }; }
      else if (m.kind === 'dab') { if (f >= 1) puddle(c, X(m.at[0]), Y(m.at[1]), m.dabs, L.hex, s, m.u); Q.tip = { kind: 'dab', at: m.at, hex: L.hex }; }
      else {
        const a = along(m.pts, m.mm * Q.at), b = along(m.pts, m.mm * f), part = a.length > 1 ? b.slice(a.length - 2) : b;   // the snake from where it was to where it is
        part[0] = a.at(-1);
        c.strokeStyle = L.hex; c.lineWidth = PIC.pitch * s * 0.92; c.lineCap = 'butt'; c.lineJoin = 'round';
        snakePath(c, part, X, Y); c.stroke();
        Q.tip = { kind: 'drag', at: b.at(-1), hex: L.hex };
      }
      Q.line = m.line;
      if (f < 1) { Q.at = f; break; }
      Q.at = 0; Q.i++;
    }
    if (t - Q.said > 120 || u === 1) { Q.said = t; lcd(); }
    kick();
    if (Q.i < M.length) Q.raf = requestAnimationFrame(step); else { Q.tip = null; Q.end = setTimeout(playStop, 1500); }
  };
  lcd(); Q.raf = requestAnimationFrame(step);
};

// ---------- the LCD, HOLO's: ▶ Play's run, or the plan; a run on the machine ----------
const mmss = t => { t = Math.max(0, Math.round(t || 0)); return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
const lcdTime = t => (t || 0) < 3600 ? segments(mmss(t), 17) : `<span class="hm">${segments(String(Math.floor(t / 3600)), 17)}<span class="tu">h</span>${segments(String(Math.floor(t % 3600 / 60)).padStart(2, '0'), 17)}<span class="tu">min</span></span>`;
function lcd(st = lastSt) {
  if (!PIC) return;
  const on = isLive(st), P = plan(), Q = PLAY && !on ? PLAY : null, all = total(P);
  paused = ['paused', 'pausing'].includes(st?.state);
  const kp = $('#btnPause'); kp.querySelector('span').textContent = paused ? 'Cont.' : 'Pause'; kp.classList.toggle('call', paused); kp.disabled = !on;
  $('#btnHome').disabled = on; $('#btnBack').disabled = !on || !RUN_KEY || ['bw', 'test', 'home'].includes(RUN_KEY);
  $('#btnBw').classList.toggle('on', on && RUN_KEY === 'bw'); $('#btnTest').classList.toggle('on', on && RUN_KEY === 'test');
  showElbow();
  if (on) {
    const was = NOW?.line;
    NOW = RUN_KEY === 'bw' && st.row ? { line: contour(RUN_INFO?.bw).lines[st.row - 1] ?? null } : null;
    if ((NOW?.line ?? null) !== (was ?? null)) kick();
    const pct = st.percent || 0, runTotal = RUN_INFO?.seconds ?? 0, steps = st.blocks ? Math.max(0, st.blocks - st.block) : 0;
    const left = st.blocks ? steps * (st.pace_s > 0 ? st.pace_s : runTotal / st.blocks) : runTotal * (1 - pct / 100);
    const b = RUN?.[st.block], row = st.row ? RUN_INFO?.rows?.[st.row - 1] : null, waiting = st.state === 'paused' && st.message;
    const now = waiting ? `❚❚ ${st.message}` : b?.home ? (RUN_KEY === 'home' ? 'HOME · the brush up, the carriage to home' : 'done · the carriage goes home, the brush off') : row && b?.dip ? `${row.label} · the dip in the cup` : row ? row.label + (RUN_KEY === 'bw' ? (st.brush_on ? ' · the pen on' : ' · the pen up') : st.brush_on ? ' · brush on' : ' · brush off') : RUN_KEY ? '' : 'a run of another page';
    const state = st.state === 'paused' ? 'paused' : 'live', name = { test: 'TEST', home: 'HOME', bw: 'DRAW BW', run1: 'LAYER 1', run2: 'LAYER 2' }[RUN_KEY];
    $('#lcd').innerHTML = `
    <div class="lcd-top"><span>${state === 'live' ? '▶ ' : '❚❚ '}${state}${name ? ` · ${name}` : ''}${st.trim ? ` ${sgn(st.trim)}` : ''}</span><span>${st.blocks ? `step ${st.block + 1}/${st.blocks}` : ''}</span></div>
    <div class="lcd-mid">
      <div class="lcd-big">${segments(String(Math.min(100, Math.floor(pct))).padStart(2, ' '), 46)}<span class="u">%</span></div>
      <div class="lcd-times"><span class="k">left</span>${lcdTime(left)}<span class="k">total</span>${lcdTime(runTotal)}</div>
    </div>
    ${sticks(pct / 100)}
    <div class="lcd-now${waiting ? ' wait' : ''}">${esc(now)}</div>`;
    return;
  }
  if (NOW) { NOW = null; kick(); }
  const ended = !Q && st && st.state !== 'idle', pct = Q ? Q.want / Q.end * 100 : ended ? (st.state === 'done' ? 100 : st.percent || 0) : 0, at = Q ? Q.line : 0, j = P[at], nx = P[at + 1];
  if (Q) markRun(at);
  const m = Q?.M[Math.min(Q.i, Q.M.length - 1)], B = j?.batches.length ?? 0;
  const now = Q && m ? `Layer ${j.run} · ${m.kind === 'mark' ? `a new jar: one dip, its marks · ${m.no}, the ${m.side} slip` : `group ${m.batch + 1} of ${B} · ${m.kind === 'dab' ? 'laying the puddles' : 'the snake'}`} · est.` : `${PIC.title} · ${dabsIn(P)} dabs · ${fmt(P.reduce((t, q) => t + q.mm, 0) / 1000, 1)} m of strokes`;
  $('#lcd').innerHTML = `
    <div class="lcd-top"><span>${Q ? '▶ play' : !st ? 'no server' : ended ? st.state : 'plan'}</span><span>${Q ? `line ${at + 1}/${P.length}` : `${P.length} lines`}</span></div>
    <div class="lcd-mid">
      <div class="lcd-big">${segments(String(Math.min(100, Math.floor(pct))).padStart(2, ' '), 46)}<span class="u">%</span></div>
      <div class="lcd-times"><span class="k">left</span>${lcdTime(Q ? all * (1 - pct / 100) : ended ? 0 : all)}<span class="k">total</span>${lcdTime(all)}</div>
    </div>
    ${sticks(pct / 100)}
    ${j ? `<div class="lcd-pencil"><i class="sw" style="background:${j.hex}"></i><span class="pt"><span class="pn">${esc(j.name)}</span><span class="pk">${Q ? 'painting' : 'first'} · ${at + 1}/${P.length} · layer ${j.run}</span></span>${nx ? `<span class="nx"><span class="pk">next</span><span class="nn"><i style="background:${nx.hex}"></i><span>${esc(nx.name)}</span></span></span>` : '<span class="nx"><span class="pk">the last</span></span>'}</div>` : ''}
    <div class="lcd-now">${now}</div>`;
}
function markRun(at) { [...$('#runList').children].forEach(q => { const i = q.dataset.i === undefined ? -2 : +q.dataset.i; q.classList.toggle('now', i === at); q.classList.toggle('done', at >= 0 && i >= 0 && i < at); }); }

// ---------- LAYER 1 · LAYER 2: the question, as HOLO's RUN 1 · RUN 2, and the run ----------
// holo2plan.js's runsOf, idleRowsOf's rows, plotRun's moves, between two jars a pause (the brush up to wipe it, the next jar in the cup, Continue),
// the J3 compensation on every run's way (formgplan.js, j3Runs); a dab a row of its own on a dip of its own, a snake on what the puddles left (no dip).
// Start from: the lines before it not painted again.
const HRUNS = new Map();
function layerRun(run, from = 0) {
  if (!PIC) return EMPTY;
  const all = plan().filter(q => q.run === run), lines = all.slice(from);
  if (!lines.length) return EMPTY;
  const key = JSON.stringify([PIC.id, run, from, opts(), S.press, S.travel, S.tail, hereNow(), dipCup()]);
  if (HRUNS.has(key)) return HRUNS.get(key);
  const runs = runsOf(lines), R = idleRowsOf(lines.map(L => ({ pencil: L.key })), lines.map(L => ({ id: L.key, name: L.name })), { cw: PIC.w, ch: PIC.h }, 0, 0, j3Runs(runs));
  const r = plotRun({ ...runOpts(R.ps.length), press: S.press, noDipUnder: 0 }, R.groups.map((g, k) => ({ key: 'DRAG', ps: g.map(i => R.ps[i]), why: k ? `wipe the brush, put ${lines[k].name} in the cup, then Continue` : null })));
  const rows = R.info.map((q, i) => ({ ...q, label: `${from + q.pass + 1}/${all.length} · ${lines[q.pass].name} · ${runs[i].say}` }));
  const out = { key, ...r, blocks: wipeBlocks(r.blocks, WIPE_NEW), rows, run, from, all, lines, mm: lines.reduce((t, q) => t + q.mm, 0),
    dabs: runs.filter(q => q.dab).length, dips: runs.filter(q => q.dip).length, strokes: runs.filter(q => !q.dab && !q.mark).length, marks: runs.filter(q => q.mark).length,
    flats: lines.reduce((t, q) => t + q.flats, 0), flatMm: lines.reduce((t, q) => t + q.flatMm, 0) };
  if (HRUNS.size > 4) HRUNS.clear();
  HRUNS.set(key, out);
  return out;
}
const holoRemote = R => ({ colours: R.lines.map((L, i) => ({ name: L.name, hex: L.hex, code: '', cells: L.cells, n: R.from + i + 1, of: R.all.length })), rows: R.rows.map(q => ({ c: q.pass, cells: q.cells ?? [] })) });
function runBad(R) {
  if (isLive()) return 'A run is on: STOP it first.';
  if (!R.rows.length) return 'Nothing to paint.';
  if (R.fault) return `Not run: the plan is wrong — ${R.fault}.`;
  if (walls(R)) return walls(R);
  if (cupProblem(cup())) return `LAYER dips in ${cupName()}: ${cupProblem(cup())}`;
  return '';
}
const runRows = lines => lines.map((q, i) => `<li><span class="no">${i + 1}</span><i class="sw" style="background:${q.hex}"></i><span class="nm">${esc(q.name)}</span><span class="tg">${q.dabs} dabs</span></li>`).join('');
function runText(run, lines, R) {
  const d = lines.reduce((t, q) => t + q.dabs, 0), b = lines.reduce((t, q) => t + q.batches.length, 0), c = placeNow();
  return `${run === 1 ? 'Layer 1, the blues and the white' : 'Layer 2, the reds and the yellow, on the dry first layer'}: ${lines.length} jar${lines.length === 1 ? '' : 's'}, light to dark. `
    + `A colour's band of a ribbon a snake at a time: its puddles first — a dab on a leg's start every ${S.lasts} mm of line or so, a dip at the cup at hand, then the brush down there, a mark of ${HOLO2.mark} mm along the lane, the way the snake will go — `
    + `then at once the snake over them, no dip: along a lane, a few mm aside to the next, back along it, the brush down from end to end, whatever the way. `
    + `${d} dabs in ${b} snake${b === 1 ? '' : 's'} of ${S.group} dabs at most; ${R.strokes} snakes, ${fmt(R.mm / 1000, 1)} m; no idle run. `
    + `${fmt(R.flatMm / 1000, 1)} m of the line, ${R.flats} legs mostly, lie within ${HOLO2.flat}° of the horizontal, along the machine's Y: the flat brush may not lay them — on paper first, the owner's test (⚠ Horizontal shows them). `
    + (R.marks ? `After every change of jar, before its first puddle: one dip, then its MARKS, 1 the left slip, 3 the right — ${besideNow()?.where === 'on' ? 'the paper taped over the canvas\'s margins' : 'the paper on the plates beside the canvas'} (The canvas). ` : '')
    + `On the machine ${R.dips} dips, every run's way landing ${ELBOW_J3.early} mm earlier and lifting ${ELBOW_J3.late} mm later than on the screen (J3), the brush at ${S.speed} mm/s; ≈ ${hm(R.seconds)} (est.). `
    + (lines.length > 1 ? `Between two jars it stops ${lines.length - 1} time${lines.length > 2 ? 's' : ''}: the brush up over the cup — wipe it, put the next jar in the cup, Continue. ` : '')
    + `Put ${lines[0].name} in ${cupName()} now. The canvas's (or the paper's) left edge ${c.edgeLeft} mm, its bottom edge ${c.edgeBottom} mm from home.`;
}
async function askRun(run) {
  await loadInk();
  if (!PIC) return;
  const all = plan().filter(q => q.run === run);
  if (!all.length) return;
  let from = 0, R = layerRun(run, 0);
  const bad = runBad(R);
  if (bad) return warn(bad);
  const show = () => {
    const lines = all.slice(from), first = lines[0];
    $('#runAskTitle').textContent = `LAYER ${run} · ${run === 1 ? 'COOL' : 'WARM'} · ${PIC.title} · ${lines.length} jar${lines.length === 1 ? '' : 's'}`;
    $('#runAskFirst').innerHTML = `<i class="sw" style="background:${first.hex}"></i><span class="pt"><span class="k">In the cup first</span><b>${esc(first.name)}</b><span>${esc(first.note)}</span></span>`;
    $('#runAskList').innerHTML = runRows(lines);
    $('#runAskText').textContent = runText(run, lines, R);
  };
  const sel = $('#runFrom');
  sel.innerHTML = all.map((q, i) => `<option value="${i}">${i + 1} · ${esc(q.name)}</option>`).join(''); sel.value = '0';
  sel.onchange = () => { from = +sel.value; R = layerRun(run, from); show(); };
  show();
  const box = $('#runAsk'); box.hidden = false; $('#runNo').focus();
  const key = e => { if (e.key === 'Escape') { e.preventDefault(); end(); } };
  const end = () => { box.hidden = true; removeEventListener('keydown', key, true); };
  addEventListener('keydown', key, true);
  $('#runNo').onclick = end; box.onclick = e => { if (e.target === box) end(); };
  $('#runGo').onclick = async () => {
    end();
    const bad = runBad(R);
    if (bad) return warn(bad);
    RUN_PRESS = S.press; save(); showKeys(); kick();
    await start(`run${run}`, R.blocks, { seconds: R.seconds, rows: R.rows, from },
      logOf({ pass: `layer ${run}`, label: `HOLO2 · ${PIC.title} · LAYER ${run} · ${run === 1 ? 'COOL' : 'WARM'}`, settings: { ...S, place: placeNow() }, cup: dipCup(), travel: S.travel,
        remote: holoRemote(R), ...(from ? { from_colour: R.lines[0].name } : {}), counts: { dabs: R.dabs, snakes: R.strokes, marks: R.marks, dips: R.dips, horizontal: R.flats }, estimate_s: Math.round(R.seconds) }));
  };
}
$('#btnRun1').onclick = () => askRun(1);
$('#btnRun2').onclick = () => askRun(2);

// ---------- the panel ----------
function showKeys() {
  document.querySelectorAll('#views [data-view]').forEach(b => b.classList.toggle('on', b.dataset.view === S.view));
  document.querySelectorAll('#lib .fg-card').forEach(b => b.classList.toggle('on', b.dataset.id === S.pic));
  $('#btnFlat').classList.toggle('on', !!S.flat);
}
function showPanel() {
  if (!PIC) return;
  const P = plan(), c = placeNow(), rg = rangeOf(), bad = wallsSay();
  const Lf = $('#fLeft'), Bf = $('#fBottom');
  if (document.activeElement !== Lf) Lf.value = c.edgeLeft;
  if (document.activeElement !== Bf) Bf.value = c.edgeBottom;
  const f = PIC.field;
  $('#placeRead').innerHTML = `${bad ? `<span class="warn">${esc(bad)}</span><br>` : ''}The field ${fmt(f.x1 - f.x0, 0)} × ${fmt(f.y1 - f.y0, 0)} mm, ${fmt(f.x0, 0)} mm in from the canvas's left edge (the drawing at ${fmt(PIC.scale * 100, 1)} %, so the marks fit by it). Within the walls for it: left edge ${fmt(rg.left[0], 0)} … ${fmt(rg.left[1], 0)}, bottom edge ${fmt(rg.bottom[0], 0)} … ${fmt(rg.bottom[1], 0)} mm (the dashed line; est., the elbow's sweep at the bottom ${WALL.bottom} mm).` + marksSay(rg);
  canvasReads();
  for (const [id, k] of [['#fLasts', 'lasts'], ['#fGroup', 'group'], ['#fSDab', 'sDab'], ['#fSpeed', 'speed']]) if (document.activeElement !== $(id)) $(id).value = S[k];
  for (const [id, k] of [['#fPen', 'penSpeed'], ['#fTravel', 'travel']]) if (document.activeElement !== $(id)) $(id).value = S[k];
  { const O = penRun('outline'), A = penRun('all'); $('#bwRead').innerHTML = O.lines ? `DRAW BW: the outline alone ${O.lines} lines, ${fmt(O.mm / 1000, 1)} m, ≈ ${hm(O.seconds)}; every border ${A.lines} lines, ${fmt(A.mm / 1000, 1)} m, ≈ ${hm(A.seconds)} (est.).` : ''; }
  $('#fMark').value = HOLO2.mark;
  const run = r => P.filter(q => q.run === r), sum = (A, k) => A.reduce((t, q) => t + q[k], 0), groups = A => A.reduce((t, q) => t + q.batches.length, 0);
  const say = r => { const A = run(r); return `<b>Layer ${r}</b> ${A.length} jars, ${sum(A, 'cells')} legs, ${sum(A, 'dabs')} dabs in ${groups(A)} snakes, ${fmt(sum(A, 'mm') / 1000, 1)} m, ≈ ${hm(total(A))}`; };
  $('#puddleRead').innerHTML = `${say(1)}; the layer to dry; ${say(2)} (est.). A snake, a colour's band of a ribbon: its puddles, a dab on a leg's start every ${S.lasts} mm of line or so, then the brush along a lane, a few mm aside to the next, back along it, no dip, no lift — the lanes as a road's markings; a new snake where the colour ends or the ribbon goes under another. ${dabsIn(P)} dabs in all, ≈ ${hm(total(P))} (est.).`;
  const fl = P.reduce((t, q) => t + q.flats, 0), flm = P.reduce((t, q) => t + q.flatMm, 0), cm = P.reduce((t, q) => t + q.cells, 0);
  $('#flatRead').innerHTML = `<b>${fmt(flm / 1000, 1)} m</b> of ${fmt(P.reduce((t, q) => t + q.items.reduce((s, it) => s + it.len, 0), 0) / 1000, 1)} m of line (${fl} of ${cm} legs mostly) lie within ${HOLO2.flat}° of the horizontal — along the machine's Y, where the flat brush may break into dashes (README, "How to lay a module"). Drawn all the same, on paper first: photograph them, then we correct the ones that fail.`;
  $('#runList').innerHTML = P.map((q, i) => `${!i || q.run !== P[i - 1].run ? `<li class="fg-sep">${LAYER[q.run]}</li>` : ''}<li data-key="${esc(q.key)}" data-i="${i}" class="${only === q.key ? 'only' : ''}" title="${esc(q.name)}${q.note ? ` — ${esc(q.note)}` : ''}: ${q.dabs} dabs in ${q.batches.length} snake${q.batches.length === 1 ? '' : 's'}, ${q.cells} legs (${q.flats} mostly horizontal), ${fmt(q.mm / 1000, 1)} m, ≈ ${hm(q.seconds)} (est.). A click shows its strokes and their way"><span class="no">${i + 1}</span><i class="sw" style="background:${q.hex}"></i><span class="nm">${esc(q.name)}${jarTag(q)}</span><span class="tg">${q.dabs} dabs</span></li>`).join('');
  $('#jarsHint').textContent = `${P.length} lines, ${PIC.jars.length} jars, light to dark`;
  const gone = PIC.gone ?? [];
  $('#jarNote').innerHTML = `Every jar one of his: the numbered ones as FORM-G knows them, the others HOLO's (est.) — no new jar to mix.`
    + (gone.length ? ` The canon of the jars: ${gone.map(g => `${esc(g.name)} had ${g.mm} mm of line, under the canvas's 600, so its lanes went to ${esc(g.to)}`).join('; ')}.` : '');
  $('#stats').textContent = `${PIC.w / 10} × ${PIC.h / 10} cm · the ribbons · ${PIC.count.legs} legs in ${PIC.count.lanes} lanes`;
  lcd();
}
function marksSay(rg) {
  const o = MARKS_BESIDE, f = PIC.field;
  if (!rg.marks) return `<br><b>MARKS</b>: none — the field, ${fmt(f.x1 - f.x0, 0)} mm across Y, leaves the reach no room for the marks on the canvas's margins by it, nor beside the canvas; they fit by a field up to ${rg.widest} mm across.`;
  const B = besideNow(), s = B.strips[0].slip, r = B.strips[1].slip, on = B.where === 'on';
  return `<br><b>MARKS</b> ${on ? 'on the canvas, as the 70 × 100\'s' : 'beside the canvas'}: a paper slip ${on ? 'taped over each margin' : 'on each plate'}, <b>1</b> by the middle of the left edge, <b>3</b> by the right — `
    + (on ? `across the canvas the left ${fmt(Math.max(0, s[0]), 0)}–${fmt(s[2], 0)} mm, the right ${fmt(r[0], 0)}–${fmt(Math.min(PIC.w, r[2]), 0)}, ${o.paper} mm short of the field` : `against the edge, ${o.slip} mm out from it`)
    + `, ${fmt(s[1], 0)}–${fmt(s[3], 0)} mm up from the canvas's bottom edge; ${B.n} cells, a jar a cell, the first at the top, the marks ${on ? `${o.clear} mm off the field` : `${o.gap} mm off the canvas's edge`}. `
    + `After every change of jar one dip, then its mark on 1, then on 3, then its first puddle on a dip of its own (est.).`;
}
let CANVAS_INFO = false;
function canvasReads() { const p = $('#placeRead'); p.hidden = !CANVAS_INFO && !p.querySelector('.warn'); $('#canvasInfo').classList.toggle('on', CANVAS_INFO); }
$('#canvasInfo').onclick = () => { CANVAS_INFO = !CANVAS_INFO; canvasReads(); };
function settle() { PLANS.clear(); READS.clear(); PENRUNS.clear(); HRUNS.clear(); save(); showKeys(); showPanel(); kick(); }
for (const [id, k, lo, hi] of [['#fLasts', 'lasts', 20, 150], ['#fGroup', 'group', 10, 200], ['#fSDab', 'sDab', 2, 30], ['#fSpeed', 'speed', 5, 120]]) {
  $(id).onchange = e => { const v = +e.target.value; if (Number.isFinite(v) && e.target.value !== '') S[k] = Math.max(lo, Math.min(hi, v)); e.target.value = S[k]; playStop(); settle(); };
}
for (const [id, k, lo, hi] of [['#fPen', 'penSpeed', 5, 120], ['#fTravel', 'travel', 20, 180]]) {
  $(id).onchange = e => { const v = +e.target.value; if (Number.isFinite(v) && e.target.value !== '') S[k] = Math.max(lo, Math.min(hi, v)); e.target.value = S[k]; settle(); };
}
for (const [id, k] of [['#fLeft', 'edgeLeft'], ['#fBottom', 'edgeBottom']]) {
  $(id).onchange = e => { const v = +e.target.value; if (isLive()) { e.target.value = placeNow()[k]; return warn('A run is on: the canvas stays where it is till it ends or stops.'); } if (Number.isFinite(v)) placeNow()[k] = Math.round(v); e.target.value = placeNow()[k]; settle(); };
}
$('#views').onclick = e => { const b = e.target.closest('[data-view]'); if (!b) return; playStop(); S.view = b.dataset.view; save(); showKeys(); kick(); };
$('#btnFlat').onclick = () => { S.flat = !S.flat; save(); showKeys(); kick(); };
$('#runList').onclick = e => { const li = e.target.closest('li[data-key]'); if (!li) return; only = only === li.dataset.key ? null : li.dataset.key; [...$('#runList').children].forEach(q => q.classList.toggle('only', q.dataset.key === only)); kick(); };

// a card's (i): that picture's numbers, by its own plan
const READS = new Map();
function readOf(id) {
  if (READS.has(id)) return READS.get(id);
  const pic = LIB[id], P = plan(pic), n1 = P.filter(q => q.run === 1), n2 = P.filter(q => q.run === 2);
  const out = `<b>${esc(pic.title)}</b>, off the owner's ${esc(pic.source.split('/').pop())}, in his jars: ${pic.count.lanes} lanes, ${pic.count.legs} legs in ${pic.count.snakes} snakes, ${fmt(pic.count.line_m, 1)} m, the field ${fmt(pic.field.x1 - pic.field.x0, 0)} mm. ${pic.jars.length} jars. `
    + `<b>Layer 1</b>, the blues and the white: ${n1.length} jars, ${dabsIn(P, 1)} dabs, ≈ ${hm(total(n1))}; the layer to dry; <b>Layer 2</b>, the reds and the yellow: ${n2.length} jars, ${dabsIn(P, 2)} dabs, ≈ ${hm(total(n2))} (est.). `
    + `${fmt(pic.count.horizontal_m, 1)} m of the line within ${HOLO2.flat}° of the horizontal. A model, not a photo: nothing run yet.`;
  READS.set(id, out);
  return out;
}
function popShow(el) {
  const pop = $('#libPop'), r = el.getBoundingClientRect();
  pop.innerHTML = readOf(el.dataset.read); pop.hidden = false;
  const w = pop.offsetWidth, h = pop.offsetHeight, x = $('.fg-shelf').getBoundingClientRect().right + 8, side = x + w <= innerWidth - 8 && innerWidth > 760;
  pop.style.left = `${side ? x : Math.max(8, Math.min(innerWidth - w - 8, r.right - w))}px`;
  pop.style.top = `${Math.max(8, Math.min(innerHeight - h - 8, side ? r.top - h + 24 : r.bottom + 6))}px`;
}
const popHide = () => { $('#libPop').hidden = true; };
{
  const lib = $('#lib'), inf = e => e.target.closest('.info');
  lib.addEventListener('mouseover', e => { if (inf(e)) popShow(inf(e)); });
  lib.addEventListener('mouseout', e => { if (inf(e)) popHide(); });
  lib.addEventListener('click', e => { if (inf(e)) popShow(inf(e)); });
  addEventListener('pointerdown', e => { if (!inf(e)) popHide(); });
}
function choose(id) { playStop(); popHide(); only = null; S.pic = id; PIC = LIB[id]; fitted = ''; layout(); showKeys(); showPanel(); save(); }
$('#lib').onclick = e => {
  const b = e.target.closest('.fg-card'); if (!b) return;
  if (isLive() && RUN_KEY && S.runPic && b.dataset.id !== S.runPic) return warn(`A run of ${esc(LIB[S.runPic]?.title ?? S.runPic)} is on: the library stays on it till the run ends or stops.`);
  choose(b.dataset.id);
};

// ---------- start ----------
lampSwitch($('#lamp'));
(async () => {
  for (const id of HOLO2_LIB) {
    const pic = await (await fetch(`holo2/${id}.json`, { cache: 'no-store' })).json();
    LIB[id] = pic;
    const im = new Image(); im.onload = kick; im.src = pic.image; IMG[id] = im;
    const a1 = new Image(); a1.onload = kick; a1.src = pic.after1; AFTER1[id] = a1;
  }
  $('#lib').innerHTML = HOLO2_LIB.map(id => `<div class="fg-item"><button class="fg-card" data-id="${id}"><img src="${LIB[id].image}" alt=""><b>${esc(LIB[id].title.split(', ').slice(1).join(', '))}</b><span class="sz">${LIB[id].w / 10} × ${LIB[id].h / 10} cm</span></button><button class="info" data-read="${id}" aria-label="About ${esc(LIB[id].title)}">i</button></div>`).join('');
  if (!LIB[S.pic]) S.pic = HOLO2_LIB[0];
  PIC = LIB[S.pic];
  await loadInk();
  layout(); settle(); watch();
  setInterval(watch, 500);
})();
