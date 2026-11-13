// HOLO's page (HOLO-Claude/HOLO.md, 2026-11-12): FORM-G's page — the library on the left, the picture, the panel on the right (the owner: "so
// as not to reinvent the wheel, we take the ready examples of 40 × 40 and 60 × 60 and set them as FORM-G") — the plan by holoplan.js, its two
// runs on the screen, ▶ Play and its LCD. FORM-G's machine keys (the owner, 2026-11-14, HOLO-Claude/ux-ui.png: "HOLO has no STOP and HOME";
// "add DRAW BW and ⏮ BACK ONE JAR"): TEST, PAUSE, DRAW BW, BACK ONE JAR, STOP, HOME, the iPhone's remote and ELBOW LIVE, formg.js's as they are,
// copied so that FORM-G stays as it was. RUN 1 · RUN 2 still ask their question and send nothing: a dab is a new move, wired after LAB's sheet
// (the owner, the same night: "first LAB, then the 40 × 40 first").
import { HOLO, HOLO_LIB, planOf, movesOf, shadeAt, placeRange, legsOf, puddlesY, WALL, contourHolo } from './holoplan.js';
import { PEN } from './formgplan.js';
import { plotRun, DEFAULTS, homeBlocks, ELBOW_HOVER, TAIL_MIN, handDip, landingCheck } from './strokes.js';
import { machinePiece } from './inkaplan.js';
import { cupOf, cupProblem, dipAt } from './ink.js';
import { DOT_MM, NO_DIP } from './band.js';
import { reach } from './machine.js';
import { segments, sticks } from './lcd.js';
import { lampSwitch } from './lamp.js';
import { qrSvg } from './qr.js';
import './ui.js';

const $ = s => document.querySelector(s), KEEP = 'rembrandt.holo.v01', FORMG_KEEP = 'rembrandt.formg.v02', LIVE = ['running', 'stopping', 'pausing', 'paused'];
const PRESS_MIN = -4, PRESS_MAX = 8, TRAVEL = 100;   // FORM-G's: the brush's elbow, ELBOW LIVE's range; the carriage's travel with the brush up, mm/s
const sgn = v => `${v >= 0 ? '+' : '−'}${fmt(Math.abs(v), 1)}°`;
const fmt = (v, d = 1) => Number(v).toFixed(d), esc = v => String(v ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const hm = t => { const m = Math.round((t || 0) / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`; };
const GROUND = '#F3F0E6';   // the primed canvas, as the study draws it
const S = { pic: HOLO_LIB[0], view: 'picture', gap: HOLO.gap, lasts: null, batch: HOLO.batch, sDab: HOLO.sDab, speed: HOLO.speed, place: {},
  penSpeed: PEN.speed, travel: TRAVEL, tail: 3, press: 0, bw: 'outline' };
try { Object.assign(S, JSON.parse(localStorage.getItem(KEEP) || 'null') ?? {}); } catch { }
const save = () => { try { localStorage.setItem(KEEP, JSON.stringify(S)); } catch { } };
if (!S.machine) {                                                                     // the machine's keys first seen: the brush as it is tuned on FORM-G, once
  try { const g = JSON.parse(localStorage.getItem(FORMG_KEEP) || 'null') ?? {}; for (const k of ['press', 'penSpeed', 'travel', 'tail']) if (Number.isFinite(g[k])) S[k] = g[k]; } catch { }
  S.machine = 1; save();
}

// ---------- the library ----------
const LIB = {}, IMG = {}, AFTER1 = {};
let PIC = null;
const jarOf = id => PIC.jars.find(j => j.id === id);
const opts = () => ({ gap: S.gap, lasts: S.lasts, batch: S.batch, sDab: S.sDab, speed: S.speed });
const PLANS = new Map();
function plan(pic = PIC) {
  const key = JSON.stringify([pic.id, opts()]);
  if (!PLANS.has(key)) { if (PLANS.size > 8) PLANS.clear(); PLANS.set(key, planOf(pic, opts())); }
  return PLANS.get(key);
}
const total = P => P.reduce((t, q) => t + q.seconds, 0);
const dabsIn = (P, run) => P.filter(q => !run || q.run === run).reduce((t, q) => t + q.dabs, 0);
const jarTag = j => j.new ? ' <span class="new">NEW</span>' : j.number == null ? ' <em>no number</em>' : '';

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
  else if (c.edgeLeft < r.left[0] || c.edgeLeft > r.left[1]) out.push(`the left edge out of ${fmt(r.left[0], 0)} … ${fmt(r.left[1], 0)}`);
  if (c.edgeBottom < r.bottom[0] || c.edgeBottom > r.bottom[1]) out.push(`the bottom edge out of ${fmt(r.bottom[0], 0)} … ${fmt(r.bottom[1], 0)}`);
  return out.length ? `Past the walls: ${out.join('; ')}.` : '';
}

// ---------- the machine: FORM-G's keys (formg.js), its moves as they are ----------
const hereNow = () => { const R = reach(), c = placeNow(); return { x: R.x.min + c.edgeBottom + PIC.h / 2, y: R.y.min + c.edgeLeft + PIC.w / 2 }; };
let INK = {};
async function loadInk() { try { const r = await fetch('/ink', { cache: 'no-store' }); INK = r.ok ? await r.json() : {}; } catch { INK = {}; } }
const cup = () => cupOf(INK);
const dipCup = () => { const c = cup(), d = dipAt(c); return d ? { ...c, x: d.x, y: d.y } : c; };
const cupName = () => cup().hand ? 'the cup at hand (INK-Y)' : 'the cup of the Ink tab';
const opts0 = () => ({ ...DEFAULTS, speed: S.speed, travel: S.travel, tail: S.tail, lift: true, ink: true, snake: true, pause: false, cup: dipCup(), hover: ELBOW_HOVER, press: S.press, noDipUnder: 0 });
const runOpts = rows => ({ ...opts0(), rows, here: hereNow(), noDipUnder: NO_DIP });
const EMPTY = { blocks: [], rows: [], seconds: 0, mm: 0, lines: 0 };
// plotRun presses a path past a wall into it, which here would change the picture: such a run is not run (FORM-G's, without its pressed bottom)
function walls(P_) {
  if (!P_) return '';
  if (P_.gone) return `The brush would go ${fmt(P_.pastWall, 0)} mm past the walls, ${P_.gone} legs gone: move the canvas (The canvas).`;
  return P_.pastWall > 0.05 ? `The brush would go ${fmt(P_.pastWall, 0)} mm past the walls: move the canvas (The canvas).` : '';
}
// DRAW BW, FORM-G's (the owner, 2026-11-10: "I just put a pen in the brush's place and first trace on paper, the contour, to centre the canvas and study all the
// details"): holoplan.js's contourHolo in one pen; once, over the first line's start, the holder down and a p-pause, the pen in with its tip on the paper. No dip, no jar.
// S.bw: 'outline', where the paint meets the bare canvas, to lay the canvas by — the default; 'all', every border between two colours, to study the picture
const CONTOURS = new Map(), PENRUNS = new Map(), BW_KINDS = { outline: 'The outline alone', all: 'Every border between two colours' };
const bwKind = k => (k ?? S.bw) === 'all' ? 'all' : 'outline';
const contour = k => { const key = `${PIC.id}|${bwKind(k)}`; return CONTOURS.get(key) ?? CONTOURS.set(key, contourHolo(PIC, { outline: bwKind(k) === 'outline' })).get(key); };
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
    RUN = blocks; RUN_INFO = info; RUN_KEY = key; S.runPic = S.pic; S.runKey = key; S.runBw = info.bw ?? null; S.runT = Date.now() / 1000; save();   // the picture this run is of, and when: the page keeps to it while it runs
    const r = await fetch('/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blocks, log }) });
    $('#runState').textContent = await r.text();
  } catch { $('#runState').textContent = 'start rembrandt.py'; }
}
// rembrandt.py knows the brush by its page, OPM-N's (PENCIL_PAGES), FORM-G's the same: HOLO's the same brush, so the same page, its own `tab` in the journal
const logOf = (o = {}) => ({ page: 'opmn', tab: 'holo', label: `HOLO · ${PIC.title}`, here: hereNow(), ...o });
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
    + (all ? `Every border between two colours of ${PIC.title} and its outline on the bare canvas, the strokes as the brush lays them — run 1's grounds, run 2's shadows from their puddle to where they end — ${R.lines} lines, every one once`
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
  const R = penRun(), c = bwCheck(R);                                                // the one picked: its own checks
  if (typeof c === 'string') return warn(c);
  const at = penAt();
  S.view = 'contour'; RUN_PRESS = S.press; save(); showKeys(); kick();
  await start('bw', R.blocks, { seconds: R.seconds, rows: R.rows, bw: R.kind },
    logOf({ pass: 'draw bw', label: `HOLO · ${PIC.title} · DRAW BW, the pen · ${R.kind === 'all' ? 'every border' : 'the outline'}`, settings: { ...S, place: placeNow() }, debug: { lines: c.dbg.lines, downs: c.dbg.downs, ups: c.dbg.ups, press: at.press, glide: at.glide }, estimate_s: Math.round(R.seconds) }));
};
// DRAW BW's question, FORM-G's: the pen, the outline or every border, the text; DRAW BW or Cancel, Esc Cancel
function askDraw(text, choice) {
  const box = $('#drawAsk'), sel = $('#drawFrom');
  $('#drawAskTitle').textContent = `DRAW BW HOLO · ${PIC.title} · the lines in one pen`;
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
// TEST, FORM-G's: one dip in the cup, a dot at each corner of the legs' box — the field — the canvas laid by them, and home
function testRun() {
  const L = legsOf(PIC);
  if (!L.length) return null;
  const xs = L.map(g => g.x), x0 = PIC.field.y0 - PIC.h / 2, x1 = PIC.field.y1 - PIC.h / 2, y0 = Math.min(...xs) - PIC.w / 2, y1 = Math.max(...xs) - PIC.w / 2;
  const dots = [['TL', x1, y0], ['TR', x1, y1], ['BR', x0, y1], ['BL', x0, y0]].map(([name, x, y]) => { const d = Math.hypot(x, y) || 1, l = Math.min(DOT_MM, d); return { name, at: { x, y }, to: { x: x - x / d * l, y: y - y / d * l } }; });
  return { ...plotRun(runOpts(dots.length), [{ key: 'TEST', ps: dots.map((d, i) => [{ t: 'L', a: d.at, b: d.to, tilt: 0, row: i + 1 }]), why: null }]), dots };
}
$('#btnTest').onclick = async () => {
  await loadInk();
  if (!PIC) return;
  if (isLive()) return warn('A run is on: STOP it first.');
  const here = hereNow(), T = testRun();
  if (!T) return warn('Nothing to paint.');
  if (cupProblem(cup())) return warn(`TEST dips in ${cupName()}: ${cupProblem(cup())}`);
  if (T.fault) return warn(`Not run: the test is wrong — ${T.fault}.`);
  if (walls(T)) return warn(walls(T));
  if (!confirm(`TEST: one dip in the cup, then a dot at each corner of the field — ${T.dots.map(d => `${d.name} X ${fmt(here.x + d.at.x, 0)} · Y ${fmt(here.y + d.at.y, 0)}`).join(', ')} — and home.`)) return;
  await start('test', T.blocks, { seconds: T.seconds, rows: T.dots.map(d => ({ label: `TEST · ${d.name}` })) }, logOf({ pass: 'test', cup: cup(), dots: T.dots.map(d => ({ name: d.name, x: +(here.x + d.at.x).toFixed(1), y: +(here.y + d.at.y).toFixed(1) })), estimate_s: Math.round(T.seconds) }));
};
const post = async path => { try { const r = await fetch(path, { method: 'POST' }); return await r.text(); } catch { return 'start rembrandt.py'; } };
$('#btnHome').onclick = () => { if (PIC && !isLive()) start('home', homeBlocks(S.travel), { seconds: 0, rows: [{ label: 'HOME' }] }, logOf({ label: 'HOLO · HOME' })); };
$('#btnPause').onclick = () => post(paused ? '/run/continue' : '/run/pause');
$('#btnStop').onclick = () => post('/run/stop');
// BACK ONE JAR, FORM-G's (the owner, 2026-11-13: "… so as to go over it once more without pressing STOP / HOME"), rembrandt.py's back_jar: a run's jars
// by its remote rows, so RUN 1 · RUN 2's once they run on the machine; DRAW BW and TEST have none, the key off in them
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
// a run is this page's when it started as this page sent it (rembrandt.py's `started`, this Mac's clock); another page's (FORM-G's) is shown as such,
// its keys STOP and PAUSE alone. A page opened during its own run: back on its picture, and DRAW BW's lines again when the plan here gives the very
// blocks the board has
const ours = st => !!S.runT && Math.abs((st?.started ?? 0) - S.runT) < 15;
function runPicture(st) {
  if (isLive(st) && !ours(st)) { RUN = RUN_INFO = RUN_KEY = null; return; }
  if (!isLive(st) || !S.runPic || !LIB[S.runPic]) return;
  if (S.pic !== S.runPic) choose(S.runPic);
  if (!RUN_INFO && S.runKey === 'bw' && PIC) {
    const R = penRun(S.runBw ?? undefined);
    if (R.blocks.length === st.blocks) { RUN = R.blocks; RUN_KEY = 'bw'; RUN_INFO = { seconds: R.seconds, rows: R.rows, bw: R.kind }; }
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
const PLAY_MS = 180000;
function fit() { const r = stage.getBoundingClientRect(), m = 26, k = Math.min((r.width - 2 * m) / PIC.w, (r.height - 2 * m) / PIC.h); K = k; OX = (r.width - PIC.w * k) / 2; OY = (r.height - PIC.h * k) / 2; }
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
// a puddle as the study draws it: an upright drop, 4 mm wide, longer by its dabs, a light on it (mm → px by `k`, at x, y px)
function puddle(g, x, y, dabs, hex, k) {
  const rx = 2 * k, ry = (2.6 + 1.1 * dabs) * k;
  g.fillStyle = hex; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,255,255,.38)'; g.beginPath(); g.ellipse(x - rx * 0.28, y - ry * 0.25, rx * 0.25, ry * 0.25, 0, 0, 7); g.fill();
}
// a run-2 stroke: the brush's width, its paint falling off from its puddle (shadeAt) — one line, its colour a gradient along it
const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(',');
function shadow(g, q, hex, X, Y, w) {
  const [a, b] = [q.pts[0][1], q.pts[1][1]], full = q.fade?.full ?? 0, c = rgb(hex), y0 = Y(a), y1 = Y(b);
  if (Math.abs(y1 - y0) < 0.5) return;
  const gr = g.createLinearGradient(0, y0, 0, y1);
  for (let i = 0; i <= 16; i++) { const u = i / 16; gr.addColorStop(u, `rgba(${c},${Math.min(1, shadeAt(u, full) * 1.1)})`); }
  if (full) gr.addColorStop(full, `rgba(${c},1)`);
  g.strokeStyle = gr; g.lineWidth = w; g.lineCap = 'butt';
  g.beginPath(); g.moveTo(X(q.x), y0); g.lineTo(X(q.x), y1); g.stroke();
}
const dim = id => only && only !== id ? 0.08 : 1;
function drawPuddles(g, run) {
  for (const L of plan()) if (L.run === run) { g.globalAlpha = dim(L.key); for (const p of L.puddles) puddle(g, sx(p.x), sy(p.y), p.dabs, L.hex, K); }
  g.globalAlpha = 1;
}
function drawStrokes(g) {
  const w = Math.max(0.5, PIC.pitch * K * 0.92);
  for (const L of plan()) {
    if (L.run === 1) { g.strokeStyle = L.hex; g.lineWidth = w; g.lineCap = 'butt'; g.globalAlpha = dim(L.key); for (const q of L.strokes) { g.beginPath(); g.moveTo(sx(q.x), sy(q.pts[0][1])); g.lineTo(sx(q.x), sy(q.pts[1][1])); g.stroke(); } }
  }
  for (const L of plan()) if (L.run === 2) for (const q of L.strokes) { if (only && only !== L.key) continue; shadow(g, q, L.hex, sx, sy, w); }
  g.globalAlpha = 1;
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
  // the brush's reach, the walls, with the canvas as it lies
  const W = reach(), c = placeNow(), x0 = W.y.min - c.edgeLeft, x1 = W.y.max - c.edgeLeft, y0 = W.x.min - c.edgeBottom, y1 = W.x.max - c.edgeBottom;
  g.save(); g.setLineDash([6, 4]); g.strokeStyle = '#EB7A25'; g.lineWidth = 1.2; g.strokeRect(sx(x0), sy(y1), (x1 - x0) * K, (y1 - y0) * K); g.restore();
  // the line the pen is on, DRAW BW's
  if (NOW?.line) { g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = Math.max(2, 1.6 * K); g.strokeStyle = '#EB7A25'; linePath(g, NOW.line); g.stroke(); }
  if (PLAY?.tip) { const t = PLAY.tip; g.fillStyle = t.hex; g.strokeStyle = t.kind === 'dab' ? '#EB7A25' : '#24221F'; g.lineWidth = 2; g.beginPath(); g.arc(sx(t.at[0]), sy(t.at[1]), 5, 0, 7); g.fill(); g.stroke(); }
}
// Contour: DRAW BW's lines as the pen draws them, over the picture veiled
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

// ▶ Play: the two runs as they will go, a batch's puddles laid, then dragged, on an offscreen canvas at 2 px a mm; FORM-G's clock, slow at first
// (the clock squared), three minutes; the LCD follows it. A view: it moves nothing
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
  const X = x => x * s, Y = y => (PIC.h - y) * s, w = PIC.pitch * s * 0.92, end = M.at(-1).to;
  const Q = PLAY = { cv: off, end, want: 0, i: 0, at: 0, tip: null, line: 0, t0: performance.now(), said: 0, P, M };
  $('#btnPlay').textContent = '■ Stop'; $('#btnPlay').classList.add('on');
  const step = () => {
    if (PLAY !== Q) return;
    const t = performance.now(), u = Math.min(1, (t - Q.t0) / PLAY_MS);
    Q.want = u < 1 ? end * u * u : end;
    while (Q.i < M.length && M[Q.i].from <= Q.want) {
      const m = M[Q.i], L = P[m.line], f = Math.min(1, (Q.want - m.from) / (m.to - m.from || 1));
      if (m.kind === 'dab') { if (f >= 1) puddle(c, X(m.at[0]), Y(m.at[1]), m.dabs, L.hex, s); Q.tip = { kind: 'dab', at: m.at, hex: L.hex }; }
      else {
        const [a, b] = [m.pts[0][1], m.pts[1][1]], y = a + (b - a) * f, y0 = a + (b - a) * Q.at;
        if (L.run === 1) { c.strokeStyle = L.hex; c.lineWidth = w; c.lineCap = 'butt'; c.beginPath(); c.moveTo(X(m.pts[0][0]), Y(y0)); c.lineTo(X(m.pts[0][0]), Y(y)); c.stroke(); }
        else if (f >= 1) shadow(c, { x: m.pts[0][0], pts: m.pts, fade: m.fade }, L.hex, X, Y, w);
        Q.tip = { kind: 'drag', at: [m.pts[0][0], y], hex: L.hex };
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

// ---------- the LCD, FORM-G's look: ▶ Play's run, or the plan ----------
const mmss = t => { t = Math.max(0, Math.round(t || 0)); return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
const lcdTime = t => (t || 0) < 3600 ? segments(mmss(t), 17) : `<span class="hm">${segments(String(Math.floor(t / 3600)), 17)}<span class="tu">h</span>${segments(String(Math.floor(t % 3600 / 60)).padStart(2, '0'), 17)}<span class="tu">min</span></span>`;
// the LCD, FORM-G's: a run on the machine (DRAW BW, TEST, HOME — its steps, the time left by the runner's pace), ▶ Play's run, or the plan; the
// machine's keys by the run's state as FORM-G's
function lcd(st = lastSt) {
  if (!PIC) return;
  const on = isLive(st), P = plan(), Q = PLAY && !on ? PLAY : null, all = total(P);
  paused = ['paused', 'pausing'].includes(st?.state);
  const kp = $('#btnPause'); kp.querySelector('span').textContent = paused ? 'Cont.' : 'Pause'; kp.classList.toggle('call', paused); kp.disabled = !on;
  $('#btnHome').disabled = on; $('#btnBack').disabled = !on || !RUN_KEY || ['bw', 'test', 'home'].includes(RUN_KEY);   // DRAW BW and TEST have no jars to go back to
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
    const state = st.state === 'paused' ? 'paused' : 'live', name = { test: 'TEST', home: 'HOME', bw: 'DRAW BW' }[RUN_KEY];
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
  // ▶ Play, or the plan; a run just ended (done, stopped) its state and its %, as FORM-G's
  const ended = !Q && st && st.state !== 'idle', pct = Q ? Q.want / Q.end * 100 : ended ? (st.state === 'done' ? 100 : st.percent || 0) : 0, at = Q ? Q.line : 0, j = P[at], nx = P[at + 1];
  if (Q) markRun(at);
  const m = Q?.M[Math.min(Q.i, Q.M.length - 1)], B = j?.batches.length ?? 0;
  const now = Q && m ? `${j.run === 1 ? 'Run 1' : 'Run 2'} · batch ${m.batch + 1} of ${B} · ${m.kind === 'dab' ? 'laying the puddles' : 'dragging them'} · est.` : `${PIC.title} · ${dabsIn(P)} dabs · ${fmt(P.reduce((t, q) => t + q.mm, 0) / 1000, 1)} m of strokes`;
  $('#lcd').innerHTML = `
    <div class="lcd-top"><span>${Q ? '▶ play' : !st ? 'no server' : ended ? st.state : 'plan'}</span><span>${Q ? `line ${at + 1}/${P.length}` : `${P.length} lines`}</span></div>
    <div class="lcd-mid">
      <div class="lcd-big">${segments(String(Math.min(100, Math.floor(pct))).padStart(2, ' '), 46)}<span class="u">%</span></div>
      <div class="lcd-times"><span class="k">left</span>${lcdTime(Q ? all * (1 - pct / 100) : ended ? 0 : all)}<span class="k">total</span>${lcdTime(all)}</div>
    </div>
    ${sticks(pct / 100)}
    ${j ? `<div class="lcd-pencil"><i class="sw" style="background:${j.hex}"></i><span class="pt"><span class="pn">${esc(j.name)}</span><span class="pk">${Q ? 'painting' : 'first'} · ${at + 1}/${P.length} · run ${j.run}</span></span>${nx ? `<span class="nx"><span class="pk">next</span><span class="nn"><i style="background:${nx.hex}"></i><span>${esc(nx.name)}</span></span></span>` : '<span class="nx"><span class="pk">the last</span></span>'}</div>` : ''}
    <div class="lcd-now">${now}</div>`;
}
function markRun(at) { [...$('#runList').children].forEach(q => { const i = q.dataset.i === undefined ? -2 : +q.dataset.i; q.classList.toggle('now', i === at); q.classList.toggle('done', at >= 0 && i >= 0 && i < at); }); }

// ---------- RUN 1 · RUN 2: the question, as FORM-G's; nothing sent ----------
const runRows = lines => lines.map((q, i) => `<li><span class="no">${i + 1}</span><i class="sw" style="background:${q.hex}"></i><span class="nm">${esc(q.name)}</span><span class="tg">${q.dabs} dabs</span></li>`).join('');
function runText(run, lines) {
  const d = lines.reduce((t, q) => t + q.dabs, 0), mm = lines.reduce((t, q) => t + q.mm, 0), b = lines.reduce((t, q) => t + q.batches.length, 0), c = placeNow();
  return (run === 1
    ? `Run 1, the light: ${lines.length} jar${lines.length === 1 ? '' : 's'}, light to dark. Along every leg of a slat of its ground a puddle every ${S.gap} mm at most, one dab each — a dip at the cup at hand, then the brush down there, a mark of ${HOLO.mark} mm; then one stroke the leg's whole field through them, no dip, even legs from the top down, odd ones up. `
    : `Run 2, the shadow, on the dry first run: ${lines.length} jar${lines.length === 1 ? '' : 's'}, light to dark. For every shadowed band of every leg one puddle 5 mm in from its edge, 1 … ${HOLO.maxDabs[PIC.composition]} dabs by its length, then one stroke towards its far end, no dip, till it gives out. `)
    + `${d} dabs in ${b} batches of about ${S.batch}, every batch laid, then dragged while wet; ${fmt(mm / 1000, 1)} m of strokes; ≈ ${hm(lines.reduce((t, q) => t + q.seconds, 0))} at ${S.sDab} s a dab (est.). Between two jars a pause: wipe the brush, put the next jar in the cup. `
    + `The canvas's left edge ${c.edgeLeft} mm, its bottom edge ${c.edgeBottom} mm from home.`;
}
function askRun(run) {
  const all = plan().filter(q => q.run === run);
  if (!all.length) return;
  const show = from => {
    const lines = all.slice(from), first = lines[0];
    $('#runAskTitle').textContent = `RUN ${run} · ${run === 1 ? 'LIGHT' : 'SHADOW'} · ${PIC.title} · ${lines.length} jar${lines.length === 1 ? '' : 's'}`;
    $('#runAskFirst').innerHTML = `<i class="sw" style="background:${first.hex}"></i><span class="pt"><span class="k">In the cup first</span><b>${esc(first.name)}</b><span>${esc(first.new ? 'new: ' + first.note : first.note)}</span></span>`;
    $('#runAskList').innerHTML = runRows(lines);
    $('#runAskText').textContent = runText(run, lines);
  };
  const sel = $('#runFrom');
  sel.innerHTML = all.map((q, i) => `<option value="${i}">${i + 1} · ${esc(q.name)}</option>`).join(''); sel.value = '0';
  sel.onchange = () => show(+sel.value);
  show(0);
  const box = $('#runAsk'); box.hidden = false; $('#runNo').focus();
  const key = e => { if (e.key === 'Escape') { e.preventDefault(); end(); } };
  const end = () => { box.hidden = true; removeEventListener('keydown', key, true); };
  addEventListener('keydown', key, true);
  $('#runNo').onclick = end; box.onclick = e => { if (e.target === box) end(); };
}
$('#btnRun1').onclick = () => askRun(1);
$('#btnRun2').onclick = () => askRun(2);

// ---------- the panel ----------
function showKeys() {
  document.querySelectorAll('#views [data-view]').forEach(b => b.classList.toggle('on', b.dataset.view === S.view));
  document.querySelectorAll('#lib .fg-card').forEach(b => b.classList.toggle('on', b.dataset.id === S.pic));
}
function showPanel() {
  if (!PIC) return;
  const P = plan(), c = placeNow(), rg = rangeOf(), bad = wallsSay();
  const Lf = $('#fLeft'), Bf = $('#fBottom');
  if (document.activeElement !== Lf) Lf.value = c.edgeLeft;
  if (document.activeElement !== Bf) Bf.value = c.edgeBottom;
  const f = PIC.field;
  $('#placeRead').innerHTML = `${bad ? `<span class="warn">${esc(bad)}</span><br>` : ''}The field ${fmt(f.x1 - f.x0, 0)} × ${fmt(f.y1 - f.y0, 0)} mm, ${fmt(f.x0, 0)} mm in from the canvas's edges. Within the walls for it: left edge ${fmt(rg.left[0], 0)} … ${fmt(rg.left[1], 0)}, bottom edge ${fmt(rg.bottom[0], 0)} … ${fmt(rg.bottom[1], 0)} mm (the dashed line; est., the elbow's sweep at the bottom ${WALL.bottom} mm).`;
  canvasReads();
  for (const [id, k] of [['#fGap', 'gap'], ['#fBatch', 'batch'], ['#fSDab', 'sDab'], ['#fSpeed', 'speed']]) if (document.activeElement !== $(id)) $(id).value = S[k];
  if (document.activeElement !== $('#fLasts')) $('#fLasts').value = S.lasts ?? '';
  for (const [id, k] of [['#fPen', 'penSpeed'], ['#fTravel', 'travel']]) if (document.activeElement !== $(id)) $(id).value = S[k];
  { const O = penRun('outline'), A = penRun('all'); $('#bwRead').innerHTML = O.lines ? `DRAW BW: the outline alone ${fmt(O.mm / 1000, 1)} m, ≈ ${hm(O.seconds)}; every border ${A.lines} lines, ${fmt(A.mm / 1000, 1)} m, ≈ ${hm(A.seconds)} (est.).` : ''; }
  $('#fMark').value = HOLO.mark;
  const n1 = puddlesY(PIC, S.gap).length, legs = legsOf(PIC).length;
  $('#puddleRead').innerHTML = `${legs} legs ${fmt(PIC.pitch, 0)} mm apart in ${PIC.slats.length} slats; run 1 ${n1} puddles a leg, ${dabsIn(P, 1)} dabs; run 2 ${P.filter(q => q.run === 2).reduce((t, q) => t + q.puddles.length, 0)} puddles, ${dabsIn(P, 2)} dabs${S.lasts ? ` (a dab every ${S.lasts} mm of band)` : ` (the plan's: ${PIC.est.a_dab_lasts} mm a dab)`}. ${dabsIn(P)} dabs in all, ${P.reduce((t, q) => t + q.batches.length, 0)} batches, ≈ ${hm(total(P))} (est.).`;
  $('#runList').innerHTML = P.map((q, i) => `${!i || q.run !== P[i - 1].run ? `<li class="fg-sep">${q.run === 1 ? 'Run 1 · the light' : 'Run 2 · the shadow, on the dry first'}</li>` : ''}<li data-key="${esc(q.key)}" data-i="${i}" class="${only === q.key ? 'only' : ''}" title="${esc(q.name)}${q.note ? ` — ${esc(q.note)}` : ''}: ${q.dabs} dabs in ${q.batches.length} batch${q.batches.length === 1 ? '' : 'es'}, ${q.strokes.length} strokes, ${fmt(q.mm / 1000, 1)} m, ≈ ${hm(q.seconds)} (est.). A click shows its strokes"><span class="no">${i + 1}</span><i class="sw" style="background:${q.hex}"></i><span class="nm">${esc(q.name)}${jarTag(q)}</span><span class="tg">${q.dabs} dabs</span></li>`).join('');
  $('#jarsHint').textContent = `${P.length} lines, ${PIC.jars.length} jars, light to dark`;
  const fresh = PIC.jars.filter(j => j.new), none = PIC.jars.filter(j => !j.new && j.number == null), photo = PIC.jars.filter(j => j.number != null && j.seen === 'photo');
  $('#newJars').innerHTML = fresh.length ? `<li style="display:block;font-weight:600;color:var(--ink)">New jars, from the empty four</li>` + fresh.map(j => `<li><i class="sw" style="background:${j.hex}"></i><span><b>${esc(j.name.replace('New · ', ''))}</b> <span>— ${esc(j.note)}, 1 : 1 with pouring medium</span></span></li>`).join('') : '';
  $('#jarNote').innerHTML = [none.length ? `${none.map(j => esc(j.name)).join(', ')}: no number on the lid yet, their colours off the photo (est.).` : '', ...photo.map(j => `${esc(j.name)}: ${esc(j.note)}.`)].filter(Boolean).join(' ');
  $('#stats').textContent = `${PIC.w / 10} × ${PIC.h / 10} cm · ${PIC.composition}`;
  lcd();
}
let CANVAS_INFO = false;
function canvasReads() { const p = $('#placeRead'); p.hidden = !CANVAS_INFO && !p.querySelector('.warn'); $('#canvasInfo').classList.toggle('on', CANVAS_INFO); }
$('#canvasInfo').onclick = () => { CANVAS_INFO = !CANVAS_INFO; canvasReads(); };
function settle() { PLANS.clear(); READS.clear(); CONTOURS.clear(); PENRUNS.clear(); save(); showKeys(); showPanel(); kick(); }
for (const [id, k, lo, hi] of [['#fGap', 'gap', 15, 120], ['#fBatch', 'batch', 10, 400], ['#fSDab', 'sDab', 2, 30], ['#fSpeed', 'speed', 5, 120]]) {
  $(id).onchange = e => { const v = +e.target.value; if (Number.isFinite(v) && e.target.value !== '') S[k] = Math.max(lo, Math.min(hi, v)); e.target.value = S[k]; playStop(); settle(); };
}
for (const [id, k, lo, hi] of [['#fPen', 'penSpeed', 5, 120], ['#fTravel', 'travel', 20, 180]]) {
  $(id).onchange = e => { const v = +e.target.value; if (Number.isFinite(v) && e.target.value !== '') S[k] = Math.max(lo, Math.min(hi, v)); e.target.value = S[k]; settle(); };
}
$('#fLasts').onchange = e => { const v = +e.target.value; S.lasts = e.target.value === '' || !Number.isFinite(v) ? null : Math.max(20, Math.min(150, v)); playStop(); settle(); };
for (const [id, k] of [['#fLeft', 'edgeLeft'], ['#fBottom', 'edgeBottom']]) {
  $(id).onchange = e => { const v = +e.target.value; if (isLive()) { e.target.value = placeNow()[k]; return warn('A run is on: the canvas stays where it is till it ends or stops.'); } if (Number.isFinite(v)) placeNow()[k] = Math.round(v); e.target.value = placeNow()[k]; settle(); };
}
$('#views').onclick = e => { const b = e.target.closest('[data-view]'); if (!b) return; playStop(); S.view = b.dataset.view; save(); showKeys(); kick(); };
$('#runList').onclick = e => { const li = e.target.closest('li[data-key]'); if (!li) return; only = only === li.dataset.key ? null : li.dataset.key; [...$('#runList').children].forEach(q => q.classList.toggle('only', q.dataset.key === only)); kick(); };

// a card's (i): that picture's numbers, by its own plan
const READS = new Map();
function readOf(id) {
  if (READS.has(id)) return READS.get(id);
  const pic = LIB[id], P = plan(pic), n1 = P.filter(q => q.run === 1), n2 = P.filter(q => q.run === 2), fresh = pic.jars.filter(j => j.new).length;
  const out = `<b>${esc(pic.title)}</b>, in our jars: ${pic.count.legs} legs ${fmt(pic.pitch, 0)} mm apart, ${pic.count.slats} slats, the field ${fmt(pic.field.x1 - pic.field.x0, 0)} mm. ${pic.jars.length} jars${fresh ? `, ${fresh} of them new` : ''}. `
    + `<b>Run 1</b>, the light: ${n1.length} jars, ${dabsIn(P, 1)} dabs, ≈ ${hm(total(n1))}; the run to dry; <b>run 2</b>, the shadow: ${n2.length} jars, ${dabsIn(P, 2)} dabs, ≈ ${hm(total(n2))} (est.). A model, not a photo: nothing run yet.`;
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
  for (const id of HOLO_LIB) {
    const pic = await (await fetch(`holo/${id}.json`, { cache: 'no-store' })).json();
    LIB[id] = pic;
    const im = new Image(); im.onload = kick; im.src = pic.image; IMG[id] = im;
    const a1 = new Image(); a1.onload = kick; a1.src = pic.after1; AFTER1[id] = a1;
  }
  $('#lib').innerHTML = HOLO_LIB.map(id => `<div class="fg-item"><button class="fg-card" data-id="${id}"><img src="${LIB[id].image}" alt=""><b>${esc(LIB[id].title.split(', ').slice(1).join(', '))}</b><span class="sz">${LIB[id].w / 10} × ${LIB[id].h / 10} cm</span></button><button class="info" data-read="${id}" aria-label="About ${esc(LIB[id].title)}">i</button></div>`).join('');
  if (!LIB[S.pic]) S.pic = HOLO_LIB[0];
  PIC = LIB[S.pic];
  await loadInk();
  layout(); settle(); watch();
  setInterval(watch, 500);
})();
