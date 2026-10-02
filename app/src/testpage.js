// Rembrandt · Test — rows of hairpins on a board (strokes.js), run
// on the machine by rembrandt.py's runner: the plotter draws each row, the
// wrist tilts the brush through the turns and lifts it with its hook, a
// pause for paint. The page only plans
// and watches; STOP and HARD STOP stop the carriage (and the arm).

import { fmt } from './util.js';
import { parsePing, toMm, reach } from './machine.js';
import { xyPlan, PATTERNS, PASSES, DEFAULTS, DRAG_MM } from './strokes.js';
import { segments, sticks } from './lcd.js';
import { lampSwitch, themeColor } from './lamp.js';
import './ui.js';

const $ = s => document.querySelector(s);
const KEY = 'rembrandt.test.v01';
const S = { ...DEFAULTS, pattern: 'A', here: null };
try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { }
for (const k of ['sweep', 'reach', 'fast', 'turnSpeed', 'land']) delete S[k];   // the arm strokes' settings, dropped 2026-10-02; the landing shift, tried and dropped the same day
if (S.board) { S.boardW = S.boardH = S.board; delete S.board; }          // one size for both before; width and height apart since 2026-10-02
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { } };

// Sliders, as on the Calibration tab (the owner, 2026-10-02); the board's
// size stays two numbers.
// Row to row in half millimetres, 4…30, a scale under it (the owner,
// 2026-10-02: "a scale in 0.5 mm steps, the range down from 80 mm to 30");
// the brush to 200 mm/s, the board's most (firmware F, 1…200).
const SLIDERS = [
  ['rows', 'Rows', '', 1, 1, 40], ['turn', 'Turn', 'mm', 1, 2, 60], ['pitch', 'Row to row', 'mm', 0.5, 4, 30, { label: 5 }],
  ['length', 'Row length', 'mm', 5, 20, 800], ['bow', 'Bow', 'mm', 1, -100, 100],   // the middle of a row below its ends (2026-10-02)
  ['wave', 'Wave', 'mm', 1, 0, 30],   // 0: the row as it is; more: waves along it (the owner, 2026-10-02)
  ['speed', 'Brush on', 'mm/s', 1, 5, 200], ['travel', 'Between rows', 'mm/s', 5, 20, 200],
  // the wrist through a turn, + on the right, − on the left; the brush leaves the board at ±45°,
  // the rest is reserve (2026-10-02; rembrandt.py: +60° at most)
  ['tilt', 'Wrist at a turn', '±°', 1, 0, 60],
];
// a dot every step, a bigger one with its number every `label`, as on
// Calibration; a scale across zero signs its numbers
const signed = v => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v)}`;
function scale(step, min, max, label) {
  let h = '';
  for (let i = 0; min + i * step <= max + 1e-9; i++) {
    const v = min + i * step, lab = Math.abs(v / label - Math.round(v / label)) < 1e-9;
    h += `<i class="${lab ? 'major' : ''}" style="left:calc(9px + (100% - 18px) * ${(v - min) / (max - min)})">${lab ? `<span>${min < 0 ? signed(v) : v}</span>` : ''}</i>`;
  }
  return `<div class="ticks">${h}</div>`;
}
const shown = (k, unit) => unit === '±°' ? (S[k] ? `±${S[k]}°` : '0°') : `${S[k]}${unit ? ' ' + unit : ''}`;
const FIELDS = [['boardW', 'Board width', 'mm', 10], ['boardH', 'Board height', 'mm', 10]];
// D: where each pass lies, moved off the board's centre (the owner,
// 2026-10-02: "the rows, the length, the bow and the wave go to all three —
// but where they lie I want to change"). A row of X, a row of Y, a slider a
// pass; X up the board, Y to the right, as on Calibration. Then a row that
// turns each pass ±90° from its own angle, plus clockwise as the wrist,
// with a scale (the owner, the same day).
const SHIFT_AX = [
  ['x', 'X ↑', 'moved up the board, mm', 200, ''],
  ['y', 'Y →', 'moved to the right, mm', 200, ''],
  ['a', '↻', 'turned, degrees, plus clockwise', 90, '°', { step: 15, label: 45 }],
];
const shiftOf = (k, ax) => +(S.shift?.[k]?.[ax]) || 0;
// the row's sign stands before D1, in the line of the names, so the sliders
// keep the whole width (the owner, 2026-10-02)
$('#shifts').innerHTML = SHIFT_AX.map(([ax, label, what, max, , sc]) => Object.keys(PASSES).map((k, i) =>
  `<label class="sl"><span class="slh"><span>${i ? '' : `<span class="ax" title="${what}">${label}</span>`}${k}</span><span class="val" data-sv="${k}${ax}"></span></span><input class="slider" type="range" data-pass="${k}" data-ax="${ax}" min="${-max}" max="${max}" step="1" title="${k}: ${what}">${sc ? scale(sc.step, -max, max, sc.label) : ''}</label>`).join('')).join('');
$('#shifts').querySelectorAll('input').forEach(inp => inp.oninput = () => {
  const k = inp.dataset.pass, ax = inp.dataset.ax;
  S.shift = { ...S.shift, [k]: { ...S.shift?.[k], [ax]: +inp.value } };   // a new object: DEFAULTS.shift stays empty
  update();
});
$('#sliders').innerHTML = SLIDERS.map(([k, label, , step, min, max, sc]) => `<label class="sl"><span class="slh"><span>${label}</span><span class="val" data-v="${k}"></span></span><input class="slider" type="range" data-k="${k}" min="${min}" max="${max}" step="${step}">${sc ? scale(step, min, max, sc.label) : ''}</label>`).join('');
$('#sliders').querySelectorAll('input').forEach(inp => inp.oninput = () => { S[inp.dataset.k] = +inp.value; update(); });
$('#fields').innerHTML = FIELDS.map(([k, label, unit, step]) => `<label>${label} <input data-k="${k}" type="number" step="${step}" min="${step}"><em>${unit}</em></label>`).join('');
$('#fields').querySelectorAll('input').forEach(inp => inp.onchange = () => { const v = +inp.value; if (v > 0) S[inp.dataset.k] = v; update(); });
$('#pat').querySelectorAll('button').forEach(b => b.onclick = () => { S.pattern = b.dataset.p; Object.assign(S, PATTERNS[S.pattern]); update(); });
// D1, D2, D3 latch like Reference · Lanes · Drops on Create: one, two or all
// three, run in their order (the owner, 2026-10-02); the last one stays on.
$('#patD').querySelectorAll('button').forEach(b => b.onclick = () => {
  const k = b.dataset.d, on = S.pattern === 'D' ? (S.passes || []) : [];
  if (S.pattern !== 'D') { S.pattern = 'D'; Object.assign(S, PATTERNS.D); }
  S.passes = on.includes(k) ? (on.length > 1 ? on.filter(x => x !== k) : on) : [...on, k];
  update();
});
$('#pause').onchange = e => { S.pause = e.target.checked; update(); };

// ---------- the plan, drawn on the board ----------
const cv = $('#cv'), ctx = cv.getContext('2d'), stage = $('#stage'), board = $('#board');
// the table round the board, mm: wider across, where the wrist drags the brush past the rows' ends
const PAD_X = 20, PAD_Y = 20 + DRAG_MM, tableW = () => S.boardW + 2 * PAD_Y, tableH = () => S.boardH + 2 * PAD_X;
let P = xyPlan(S), k = 1, dpr = 1;
function layout() {
  const r = stage.getBoundingClientRect(), m = 36, sw = tableW(), sh = tableH();
  k = Math.max(0.2, Math.min((r.width - 2 * m) / sw, (r.height - 2 * m) / sh));
  dpr = window.devicePixelRatio || 1;
  const w = Math.round(sw * k), h = Math.round(sh * k);
  board.style.width = w + 'px'; board.style.height = h + 'px';
  cv.style.width = w + 'px'; cv.style.height = h + 'px'; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  draw();
}
// screen: Y to the right, X up; the board's centre in the middle (drawOn)
function draw() { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); drawOn(ctx, k, cv.width, cv.height); }
// The board and the rows on c, kk px a mm (the caller sets the transform).
function drawOn(c, kk, W, H) {
  const sx = y => (tableW() / 2 + y) * kk, sy = x => (tableH() / 2 - x) * kk, k = kk;
  const hw = S.boardW / 2, hh = S.boardH / 2, m = S.margin;
  c.fillStyle = themeColor('--stage', '#E2DED6'); c.fillRect(0, 0, W, H);   // the table, dark by night
  c.fillStyle = '#FCFBF8'; c.fillRect(sx(-hw), sy(hh), S.boardW * k, S.boardH * k);
  c.strokeStyle = 'rgba(36,34,31,.8)'; c.lineWidth = 1; c.strokeRect(sx(-hw) + .5, sy(hh) + .5, S.boardW * k - 1, S.boardH * k - 1);
  c.setLineDash([4, 4]); c.strokeStyle = 'rgba(179,71,12,.6)'; c.strokeRect(sx(-hw + m), sy(hh - m), (S.boardW - 2 * m) * k, (S.boardH - 2 * m) * k); c.setLineDash([]);
  c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 10 * k;   // a round brush, about 10 mm (est.)
  for (const line of P.preview) {   // black; D's passes in their paints
    c.strokeStyle = line.pass ? PASSES[line.pass].color : '#1B1A19';
    c.beginPath(); line.forEach((q, i) => i ? c.lineTo(sx(q.y), sy(q.x)) : c.moveTo(sx(q.y), sy(q.x))); c.stroke();
  }
  c.strokeStyle = '#EB7A25'; c.lineWidth = 1.5;                                             // Here: the board's centre
  c.beginPath(); c.moveTo(sx(-8), sy(0)); c.lineTo(sx(8), sy(0)); c.moveTo(sx(0), sy(-8)); c.lineTo(sx(0), sy(8)); c.stroke();
  c.font = '10px ' + getComputedStyle(document.body).getPropertyValue('--mono'); c.fillStyle = '#B3470C';
  c.fillText(`board ${S.boardW} × ${S.boardH} mm · margin ${S.margin}`, sx(-hw), sy(hh) - 6);
}

function update() {
  P = xyPlan(S);
  document.querySelectorAll('#pat button').forEach(b => b.classList.toggle('on', b.dataset.p === S.pattern));
  document.querySelectorAll('#patD button').forEach(b => b.classList.toggle('on', S.pattern === 'D' && (S.passes || []).includes(b.dataset.d)));
  $('#fields').querySelectorAll('input').forEach(inp => { if (document.activeElement !== inp) inp.value = S[inp.dataset.k]; });
  $('#pause').checked = S.pause && !S.snake;
  // C, the snake: the turn is the row to row, and a continuous line has no pause
  $('#sliders input[data-k="turn"]').disabled = !!S.snake;
  for (const [k, , unit] of SLIDERS) {
    const inp = $(`#sliders input[data-k="${k}"]`);
    if (document.activeElement !== inp) inp.value = S[k];
    $(`#sliders [data-v="${k}"]`).textContent = shown(k, unit);
  }
  $('#pause').disabled = !!S.snake; $('#pause').parentElement.classList.toggle('off', !!S.snake);
  $('#shifts').querySelectorAll('input').forEach(inp => {
    const k = inp.dataset.pass, ax = inp.dataset.ax, v = shiftOf(k, ax);
    inp.disabled = S.pattern !== 'D' || !(S.passes || []).includes(k);   // only a pass that runs
    if (document.activeElement !== inp) inp.value = v;
    $(`#shifts [data-sv="${k}${ax}"]`).textContent = signed(v) + SHIFT_AX.find(a => a[0] === ax)[4];
  });
  $('#planRead').innerHTML = (P.passes.length ? `${P.passes.join(' + ')}: ${P.passes.length > 1 ? `${P.passes.length} passes, a pause between them for the paint · ` : ''}` : '') + (P.snake
    ? `${P.rows} rows in one line · <b>${fmt(P.width / 10, 1)} × ${fmt(P.height / 10, 1)} cm</b> · ${fmt(P.length / 1000, 2)} m with the brush down${P.lifts ? '' : ' all the way'}, at ${S.speed} mm/s · ≈ ${fmt(P.seconds / 60, 1)} min (est.)`
    : `${P.rows} rows · <b>${fmt(P.width / 10, 1)} × ${fmt(P.height / 10, 1)} cm</b> · the brush at ${S.speed} mm/s · ≈ ${fmt(P.seconds / 60, 1)} min without the pauses (est.)`)
    + (P.turns ? ` · the wrist ±${S.tilt}° through ${P.turns} turns` + (P.lifts ? ', the brush off the board there' : '') : '')
    + ` · drawn as the brush paints: the wrist drags it ${DRAG_MM} mm along the rows as it lands and lifts (est.)`
    + (P.fits ? '' : ` <span class="hint">Past the ${P.room.w} × ${P.room.h} mm inside the margins — allowed (the owner, 2026-10-02); only the machine's walls stop it.</span>`)
    + (walls() ? ` <span class="warn">${walls()}</span>` : '');
  $('#stats').textContent = `${P.blocks.length} steps · pattern ${S.pattern === 'D' ? P.passes.join('+') : S.pattern}`;
  showHere(); save(); layout();
}

// ---------- Here ----------
function showHere() {
  $('#hereRead').innerHTML = S.here ? `The board's centre: carriage <b>X ${fmt(S.here.x, 1)} · Y ${fmt(S.here.y, 1)} mm</b>. Jog there on Calibration and press again to change it.`
    : 'Not set. On Calibration jog the carriage until the brush is over the board\'s centre; then press here.';
}
$('#btnHere').onclick = async () => {
  let t = null;
  try { const r = await fetch('/machine/ping', { cache: 'no-store' }); t = r.ok ? await r.text() : null; } catch { }
  const p = parsePing(t);
  if (!p) { $('#hereRead').innerHTML = '<span class="warn">No board: start rembrandt.py, the board on USB.</span>'; return; }
  if (p.x == null || p.y == null) { $('#hereRead').innerHTML = '<span class="warn">No zero on the axes: home and Set home on Calibration first.</span>'; return; }
  S.here = { x: toMm('x', p.x), y: toMm('y', p.y) };
  update();
};

// The machine's walls are the one hard limit (the board refuses a piece past
// one): said here before the run, not as "did not get there" after it.
function walls() {
  if (!S.here) return '';
  const R = reach(), b = P.box, x0 = S.here.x + b.x0, x1 = S.here.x + b.x1, y0 = S.here.y + b.y0, y1 = S.here.y + b.y1;
  const out = [x0 < R.x.min && `${fmt(R.x.min - x0, 0)} mm past the bottom wall`, x1 > R.x.max && `${fmt(x1 - R.x.max, 0)} mm past the top wall`,
    y0 < R.y.min && `${fmt(R.y.min - y0, 0)} mm past the left wall`, y1 > R.y.max && `${fmt(y1 - R.y.max, 0)} mm past the right wall`].filter(Boolean);
  return out.length ? `The brush would go ${out.join(', ')}: move Here or make the pattern smaller.` : '';
}

// ---------- 💾 SAVE TEST: into the Library, its second shelf ----------
// (the owner, 2026-10-02). An SVG of the board in mm with the rows, the
// settings in its metadata, and a PNG preview; the Library opens it here.
function testLabel() { return `${S.pattern === 'D' ? (S.passes || []).join('+') : S.pattern} · ${S.boardW} × ${S.boardH} mm · ${S.rows} rows`; }
function testSvg() {
  const W = S.boardW, H = S.boardH, f = v => (Math.round(v * 100) / 100).toFixed(2);
  const settings = Object.fromEntries(['pattern', 'passes', 'shift', 'rows', 'turn', 'pitch', 'length', 'bow', 'wave', 'speed', 'travel', 'tilt', 'boardW', 'boardH', 'margin', 'pause', 'snake'].map(k => [k, S[k]]));
  const meta = JSON.stringify({ rembrandt: '0.1', label: testLabel(), settings }).replace(/&/g, '\\u0026').replace(/</g, '\\u003c').replace(/--/g, '- -');
  const rows = P.preview.map(line => `  <path${line.pass ? ` stroke="${PASSES[line.pass].color}"` : ''} d="M${line.map(q => `${f(W / 2 + q.y)} ${f(H / 2 - q.x)}`).join(' L')}"/>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W + 2 * DRAG_MM}mm" height="${H}mm" viewBox="${-DRAG_MM} 0 ${W + 2 * DRAG_MM} ${H}">
<!-- Rembrandt v0.1 · Test · ${testLabel()}; 1 unit = 1 mm; ${DRAG_MM} mm either side of the board for the wrist's drags -->
<metadata id="rembrandt-test">${meta}</metadata>
<rect width="${W}" height="${H}" fill="#FCFBF8" stroke="#24221F" stroke-width="0.5"/>
<g fill="none" stroke="#1B1A19" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
${rows}
</g>
</svg>`;
}
function testPng() {
  const kk = 800 / Math.max(tableW(), tableH()), c2 = document.createElement('canvas');
  c2.width = Math.round(tableW() * kk); c2.height = Math.round(tableH() * kk);
  drawOn(c2.getContext('2d'), kk, c2.width, c2.height);
  return c2.toDataURL('image/png');
}
$('#btnSave').onclick = async () => {
  const st = $('#saveState'), b = $('#btnSave');
  b.disabled = true; st.textContent = 'saving…';
  try {
    const r = await fetch('/library', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ svg: testSvg(), png: testPng() }) });
    const o = await r.json();
    st.textContent = o.ok ? `saved · ${o.name}` : `not saved · ${o.message}`;
  } catch { st.textContent = 'not saved · start rembrandt.py'; }
  b.disabled = false;
};
// Opened from the Library (library.html → test.html?open=<file>).
async function openFromLibrary(file) {
  history.replaceState(null, '', location.pathname);
  try {
    const r = await fetch('library/' + encodeURIComponent(file) + '.svg', { cache: 'no-store' });
    if (!r.ok) throw new Error(r.status);
    const meta = new DOMParser().parseFromString(await r.text(), 'image/svg+xml').querySelector('metadata#rembrandt-test');
    if (!meta) { $('#saveState').textContent = 'not a test: open it on Create'; return; }
    Object.assign(S, JSON.parse(meta.textContent.replace(/- -/g, '--')).settings || {});
    update();
    $('#saveState').textContent = `opened · ${file.slice(0, 13)}:${file.slice(14)}`;
  } catch { $('#saveState').textContent = 'could not open it from the Library'; }
}

// ---------- the run ----------
const post = async path => { try { const r = await fetch(path, { method: 'POST' }); return await r.text(); } catch { return 'start rembrandt.py'; } };
$('#btnDoJob').onclick = async () => {
  if (!S.here) { $('#runState').innerHTML = '<span class="warn">Set Here first.</span>'; return; }
  if (walls()) { $('#runState').innerHTML = `<span class="warn">${walls()}</span>`; return; }
  if (!confirm(`Run ${P.rows} rows of pattern ${S.pattern === 'D' ? P.passes.join(' + ') : S.pattern} on the machine?` + (P.fits ? '' : '\nIt goes past the board\'s margins.') + `\n\nThe first time: in the air — the brush off, no board under it.`)) return;
  try {
    const r = await fetch('/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blocks: P.blocks }) });
    $('#runState').textContent = await r.text();
  } catch { $('#runState').textContent = 'start rembrandt.py'; }
};
$('#btnPause').onclick = () => post('/run/pause');
$('#btnCont').onclick = () => post('/run/continue');
$('#btnStop').onclick = () => post('/run/stop');
$('#btnKill').onclick = () => post('/run/kill');
addEventListener('keydown', e => { if (e.key === 'Escape') post('/run/stop'); });   // Esc = STOP, as on Calibration

// The LCD, as on the Job tab (the owner, 2026-10-02): the percent by painted
// length, the time left and the total, the sticks, where it is.
const mmss = t => { t = Math.max(0, Math.round(t || 0)); return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
let started = null;
function lcd(st) {
  const live = st && ['running', 'stopping', 'pausing', 'paused'].includes(st.state);
  const pct = st && st.state !== 'idle' ? (st.state === 'done' ? 100 : st.percent || 0) : 0;
  if (live && !started) started = st.started || Date.now() / 1000;
  if (!live) started = null;
  const total = P.seconds, left = live && started && pct >= 3 ? (Date.now() / 1000 - started) * (100 - pct) / pct : total * (1 - pct / 100);
  const state = !st ? 'no server' : live ? (st.state === 'paused' ? 'paused' : 'live') : st.state === 'idle' ? 'plan' : st.state;
  const b = st && P.blocks[st.block];
  const now = live && b ? (P.snake ? `the snake · ${fmt(st.painted_mm / 10, 0)} of ${fmt(st.paint_mm / 10, 0)} cm` : `row ${Math.min(b.row, P.rows)} of ${P.rows}`) + (st.brush_on ? ' · brush on' : ' · brush off')
    : `${P.rows} rows · pattern ${S.pattern === 'D' ? P.passes.join('+') : S.pattern}`;
  $('#lcd').innerHTML = `
    <div class="lcd-top"><span>${state === 'live' ? '▶ ' : state === 'paused' ? '❚❚ ' : ''}${state}</span><span>${live && st.blocks ? `step ${st.block + 1}/${st.blocks}` : `${fmt(P.length / 1000, 2)} m`}</span></div>
    <div class="lcd-mid">
      <div class="lcd-big">${segments(String(Math.min(100, Math.floor(pct))).padStart(2, ' '), 46)}<span class="u">%</span></div>
      <div class="lcd-times">
        <span class="k">left</span>${segments(mmss(left), 17)}
        <span class="k">total</span>${segments(mmss(total), 17)}
      </div>
    </div>
    ${sticks(pct / 100)}
    <div class="lcd-now">${now}</div>`;
}
async function watch() {
  let st = null;
  try { st = await (await fetch('/run', { cache: 'no-store' })).json(); } catch { }
  lcd(st);
  $('#runState').innerHTML = !st ? 'no server: start rembrandt.py' : st.message ? `<span class="${st.state === 'error' ? 'warn' : ''}">${st.message}</span>` : '';
}
lampSwitch($('#lamp'));
addEventListener('rembrandt-night', () => draw());
setInterval(watch, 500);
new ResizeObserver(layout).observe(stage);
update(); watch();
const opening = new URLSearchParams(location.search).get('open');   // from the Library
if (opening) openFromLibrary(opening);
