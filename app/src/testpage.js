// Rembrandt · Test — rows of hairpins on a board (strokes.js), run
// on the machine by rembrandt.py's runner: the plotter draws each row, the
// elbow lands and lifts the brush on the move (the new arm, 2026-10-02), a
// pause for paint. The page only plans
// and watches; STOP and HARD STOP stop the carriage (and the arm).

import { fmt } from './util.js';
import { parsePing, toMm, reach } from './machine.js';
import { xyPlan, PATTERNS, PASSES, DEFAULTS, TABLE_MM, BRUSH_MM, WRIST_MAX, SPEED_MAX, ELBOW_LIFT } from './strokes.js';
import { segments, sticks } from './lcd.js';
import { lampSwitch, themeColor } from './lamp.js';
import { cupOf, cupProblem, drawCup, canvasFrom, dipAt } from './ink.js';
import './ui.js';

const $ = s => document.querySelector(s);
const KEY = 'rembrandt.test.v01';
const S = { ...DEFAULTS, pattern: 'A', here: null };
try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { }
for (const k of ['sweep', 'reach', 'fast', 'turnSpeed', 'land']) delete S[k];   // the arm strokes' settings, dropped 2026-10-02; the landing shift, tried and dropped the same day
if (S.board) { S.boardW = S.boardH = S.board; delete S.board; }
if (S.lift === undefined && S.tilt !== undefined) S.lift = S.tilt >= 45;   // the wrist off the board at a turn, before the new arm: the brush up there now          // one size for both before; width and height apart since 2026-10-02
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { } };
// INK ON (the owner, 2026-10-03): the cup of the Ink tab, app/ink.json —
// read when the page opens and again whenever it is come back to
let INK = {};
const cup = () => cupOf(INK);
async function loadInk() {
  try { const r = await fetch('/ink', { cache: 'no-store' }); INK = r.ok ? await r.json() : {}; } catch { INK = {}; }
}
// Here: the canvas's centre from the cup, once the Ink tab has the canvas
// measured from it with a ruler (the owner, 2026-10-03: "I do not see where
// the centre of 500 × 700 is, there is no laser"); else the Here taken by hand
const fromCup = () => canvasFrom(INK, S.boardW, S.boardH);
const hereNow = () => fromCup() || S.here;
// the cup as the plan dips into it: inside the walls (ink.js, dipAt)
const dipCup = () => { const c = cup(), d = dipAt(c); return d ? { ...c, x: d.x, y: d.y } : c; };
const plan = () => xyPlan({ ...S, here: hereNow(), cup: dipCup() });

// Sliders, as on the Calibration tab (the owner, 2026-10-02); the board's
// size stays two numbers.
// Row to row in half millimetres, 4…30, a scale under it (the owner,
// 2026-10-02: "a scale in 0.5 mm steps, the range down from 80 mm to 30");
// the brush to 250 mm/s, the board's most (firmware F, 1…250 since 2026-10-02; the owner: "at least 250").
const SLIDERS = [
  ['rows', 'Rows', '', 1, 1, 40], ['turn', 'Turn', 'mm', 1, 2, 60], ['pitch', 'Row to row', 'mm', 0.5, 4, 30, { label: 5 }],
  ['length', 'Row length', 'mm', 5, 20, 800], ['bow', 'Bow', 'mm', 1, -100, 100],   // the middle of a row below its ends (2026-10-02)
  ['wave', 'Wave', 'mm', 1, 0, 30],   // 0: the row as it is; more: waves along it (the owner, 2026-10-02)
  ['speed', 'Brush on', 'mm/s', 1, 5, SPEED_MAX], ['travel', 'Between rows', 'mm/s', 5, 20, SPEED_MAX],
  // along the first and the last of a row the elbow eases the brush on and off on the move (2026-10-02);
  // "Wrist at a turn" went with the new arm: the wrist lifting the brush was the broom
  ['tail', 'Tail', 'mm', 5, 20, 200],
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
$('#lift').onchange = e => { S.lift = e.target.checked; update(); };
$('#ink').onchange = e => { S.ink = e.target.checked; update(); };

// ---------- the plan, drawn on the board ----------
const cv = $('#cv'), ctx = cv.getContext('2d'), stage = $('#stage'), board = $('#board');
// the table round the board, mm: wider across, where rows may run past it;
// with INK ON the cup and home too, and the brush's way between them
const PAD_X = 20, PAD_Y = 20 + TABLE_MM;
function view() {
  const v = { x0: -S.boardH / 2 - PAD_X, x1: S.boardH / 2 + PAD_X, y0: -S.boardW / 2 - PAD_Y, y1: S.boardW / 2 + PAD_Y };
  if (P.ink && hereNow()) {
    const e = cup().diameter / 2 * 1.7 + 6, home = 24;
    const at = [...(P.cupAt ? [[P.cupAt, e]] : []), [P.homeAt, home]];
    for (const [q, m] of at) { v.x0 = Math.min(v.x0, q.x - m); v.x1 = Math.max(v.x1, q.x + m); v.y0 = Math.min(v.y0, q.y - m); v.y1 = Math.max(v.y1, q.y + m); }
  }
  return v;
}
const tableW = () => { const v = view(); return v.y1 - v.y0; }, tableH = () => { const v = view(); return v.x1 - v.x0; };
let P = plan(), k = 1, dpr = 1;
function layout() {
  const r = stage.getBoundingClientRect(), m = 36, sw = tableW(), sh = tableH();
  k = Math.max(0.2, Math.min((r.width - 2 * m) / sw, (r.height - 2 * m) / sh));
  dpr = window.devicePixelRatio || 1;
  const w = Math.round(sw * k), h = Math.round(sh * k);
  board.style.width = w + 'px'; board.style.height = h + 'px';
  cv.style.width = w + 'px'; cv.style.height = h + 'px'; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  draw();
}
// screen: Y to the right, X up; mm from Here, the board's centre (drawOn)
function draw() { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); drawOn(ctx, k, cv.width, cv.height); drawTrail(ctx, k); }
// The board and the rows on c, kk px a mm (the caller sets the transform).
function drawOn(c, kk, W, H) {
  const V = view(), sx = y => (y - V.y0) * kk, sy = x => (V.x1 - x) * kk, k = kk;
  const hw = S.boardW / 2, hh = S.boardH / 2, m = S.margin;
  c.fillStyle = themeColor('--stage', '#E2DED6'); c.fillRect(0, 0, W, H);   // the table, dark by night
  c.fillStyle = '#FCFBF8'; c.fillRect(sx(-hw), sy(hh), S.boardW * k, S.boardH * k);
  c.strokeStyle = 'rgba(36,34,31,.8)'; c.lineWidth = 1; c.strokeRect(sx(-hw) + .5, sy(hh) + .5, S.boardW * k - 1, S.boardH * k - 1);
  c.setLineDash([4, 4]); c.strokeStyle = 'rgba(179,71,12,.6)'; c.strokeRect(sx(-hw + m), sy(hh - m), (S.boardW - 2 * m) * k, (S.boardH - 2 * m) * k); c.setLineDash([]);
  c.lineCap = 'round'; c.lineJoin = 'round';
  // INK ON: the brush's way in the air, dashed — to the cup, to the row, back to the cup, home at the end
  if (P.ink && hereNow()) {
    c.save(); c.setLineDash([3, 4]); c.strokeStyle = themeColor('--mute', '#7D776D'); c.lineWidth = 1;
    for (const [a, b] of P.air) { c.beginPath(); c.moveTo(sx(a.y), sy(a.x)); c.lineTo(sx(b.y), sy(b.x)); c.stroke(); }
    c.restore();
  }
  for (const line of P.preview) {   // black; D's passes in their paints; the brush's trace (est.), thinner as it lifts in a tail
    c.strokeStyle = line.pass ? PASSES[line.pass].color : '#1B1A19';
    for (let i = 1; i < line.length; i++) {
      c.lineWidth = BRUSH_MM * k * Math.max(0.15, (line[i - 1].k + line[i].k) / 2);
      c.beginPath(); c.moveTo(sx(line[i - 1].y), sy(line[i - 1].x)); c.lineTo(sx(line[i].y), sy(line[i].x)); c.stroke();
    }
  }
  c.strokeStyle = '#EB7A25'; c.lineWidth = 1.5;                                             // Here: the board's centre
  c.beginPath(); c.moveTo(sx(-8), sy(0)); c.lineTo(sx(8), sy(0)); c.moveTo(sx(0), sy(-8)); c.lineTo(sx(0), sy(8)); c.stroke();
  c.font = '10px ' + getComputedStyle(document.body).getPropertyValue('--mono'); c.fillStyle = '#B3470C';
  c.fillText(`board ${S.boardW} × ${S.boardH} mm · margin ${S.margin}`, sx(-hw), sy(hh) - 6);
  if (P.ink && hereNow()) {                                                                 // the cup, the red scope of the Ink tab; home
    const ink = themeColor('--ink', '#24221F');
    if (P.cupAt) {
      const X = sx(P.cupAt.y), Y = sy(P.cupAt.x), r = cup().diameter / 2 * k;
      drawCup(c, X, Y, r);
      c.fillStyle = ink; c.textAlign = 'left'; c.fillText(`cup ⌀${cup().diameter}`, X + r * 1.7 + 4, Y + 3);
    }
    const hX = sx(P.homeAt.y), hY = sy(P.homeAt.x);
    c.strokeStyle = ink; c.lineWidth = 1.2; c.strokeRect(hX - 4, hY - 4, 8, 8);
    c.fillStyle = ink; c.textAlign = 'left'; c.fillText('home', hX + 8, hY - 6);
  }
}
// The run as it goes (the owner, 2026-10-03: "so I follow the trajectory"):
// where the carriage has been since PLAY, from the runner's pings, and where
// it is now. On the screen only, not in a saved test.
let trail = [], trailOf = null;
function drawTrail(c, kk) {
  if (!hereNow() || !trail.length) return;
  const V = view(), sx = y => (y - V.y0) * kk, sy = x => (V.x1 - x) * kk, last = trail.at(-1);
  c.save(); c.strokeStyle = '#EB7A25'; c.lineWidth = 1.2; c.lineJoin = 'round';
  c.beginPath(); trail.forEach((q, i) => (i ? c.lineTo : c.moveTo).call(c, sx(q.y), sy(q.x))); c.stroke();
  if (last.live) { c.fillStyle = '#EB7A25'; c.beginPath(); c.arc(sx(last.y), sy(last.x), 4, 0, Math.PI * 2); c.fill(); }
  c.restore();
}

function update() {
  P = plan();
  document.querySelectorAll('#pat button').forEach(b => b.classList.toggle('on', b.dataset.p === S.pattern));
  document.querySelectorAll('#patD button').forEach(b => b.classList.toggle('on', S.pattern === 'D' && (S.passes || []).includes(b.dataset.d)));
  $('#fields').querySelectorAll('input').forEach(inp => { if (document.activeElement !== inp) inp.value = S[inp.dataset.k]; });
  // INK ON: the cup gives the paint, so no pause for it; C's and D's rows run on their own, no turns to lift through
  $('#pause').checked = S.pause && !S.snake && !S.ink;
  $('#lift').checked = !!S.lift;
  $('#ink').checked = !!S.ink;
  $('#inkWord').textContent = S.ink ? 'Ink ON' : 'Ink OFF';
  $('#inkWhat').textContent = S.ink ? ': a dip in the cup before every row' : '';
  $('#lift').disabled = !!(S.ink && S.snake); $('#lift').parentElement.classList.toggle('off', !!(S.ink && S.snake));
  // C, the snake: the turn is the row to row, and a continuous line has no pause; its Turn
  // slider hidden, not greyed (the owner, 2026-10-02: "it only takes room")
  $('#sliders input[data-k="turn"]').closest('label').hidden = !!S.snake;
  for (const [k, , unit] of SLIDERS) {
    const inp = $(`#sliders input[data-k="${k}"]`);
    if (document.activeElement !== inp) inp.value = S[k];
    $(`#sliders [data-v="${k}"]`).textContent = shown(k, unit);
  }
  $('#pause').disabled = !!S.snake || !!S.ink; $('#pause').parentElement.classList.toggle('off', !!S.snake || !!S.ink);
  $('#shifts').querySelectorAll('input').forEach(inp => {
    const k = inp.dataset.pass, ax = inp.dataset.ax, v = shiftOf(k, ax);
    inp.disabled = S.pattern !== 'D' || !(S.passes || []).includes(k);   // only a pass that runs
    if (document.activeElement !== inp) inp.value = v;
    $(`#shifts [data-sv="${k}${ax}"]`).textContent = signed(v) + SHIFT_AX.find(a => a[0] === ax)[4];
  });
  const C = cup(), est = k => C.est[k] ? ' (est.)' : '', inkWhy = S.ink ? cupProblem(C) : '';
  $('#planRead').innerHTML = (P.passes.length ? `${P.passes.join(' + ')}: ${P.passes.length > 1 ? `${P.passes.length} passes, a pause between them for the paint · ` : ''}` : '') + (P.ink
    ? `<b>Ink ON</b> · ${P.rows} rows, each on its own${P.snake ? ', one way' : ''}, a dip in the cup before every one — ${P.dips || 'no'} dips${P.passes.length > 1 ? ' in all' : ''}, back to the cup after each row, home at the end · <b>${fmt(P.width / 10, 1)} × ${fmt(P.height / 10, 1)} cm</b> · ${fmt(P.length / 1000, 2)} m with the brush down, at ${S.speed} mm/s · ≈ ${fmt(P.seconds / 60, 1)} min (est.) · the elbow over the rim +${C.rim}°${est('rim')}, in the cup ${C.dip > 0 ? '+' : ''}${C.dip}°${est('dip')}, ${C.dwell} s in the paint`
      + (inkWhy ? ` <span class="warn">${inkWhy}</span>` : '')
    : P.snake
    ? `${P.rows} rows in one line · <b>${fmt(P.width / 10, 1)} × ${fmt(P.height / 10, 1)} cm</b> · ${fmt(P.length / 1000, 2)} m with the brush down${P.turns ? '' : ' all the way'}, at ${S.speed} mm/s · ≈ ${fmt(P.seconds / 60, 1)} min (est.)`
    : `${P.rows} rows · <b>${fmt(P.width / 10, 1)} × ${fmt(P.height / 10, 1)} cm</b> · the brush at ${S.speed} mm/s · ≈ ${fmt(P.seconds / 60, 1)} min without the pauses (est.)`)
    + (P.turns ? ` · the brush up through ${P.turns} turns` : '')
    + ` · the elbow eases the brush on and off over ${S.tail} mm of each row's ends, on the move, 0° pressed to +${ELBOW_LIFT}° off; up to ${fmt(P.need, 0)}°/s (est.)`
    + (P.need > WRIST_MAX ? ` <span class="warn">The elbow goes ${WRIST_MAX}°/s at most on the move: a longer Tail or a slower brush.</span>` : '')
    + (P.fits ? '' : ` <span class="hint">Past the ${P.room.w} × ${P.room.h} mm inside the margins — allowed (the owner, 2026-10-02); only the machine's walls stop it.</span>`)
    + (walls() ? ` <span class="warn">${walls()}</span>` : '');
  $('#stats').textContent = `${P.blocks.length} steps · pattern ${S.pattern === 'D' ? P.passes.join('+') : S.pattern}`;
  showHere(); save(); layout();
}

// ---------- Here ----------
function showHere() {
  const c = fromCup();
  $('#btnHere').hidden = !!c;                     // found from the cup: nothing to find by hand
  if (c) {
    $('#hereRead').innerHTML = `The canvas's centre, from the cup: carriage <b>X ${fmt(c.x, 1)} · Y ${fmt(c.y, 1)} mm</b> — the canvas's left edge ${c.left} mm to the right of the cup's centre, its bottom ${c.bottom} mm below it, half the ${S.boardW} × ${S.boardH} board on (the Ink tab).`;
    return;
  }
  $('#hereRead').innerHTML = S.here ? `The board's centre: carriage <b>X ${fmt(S.here.x, 1)} · Y ${fmt(S.here.y, 1)} mm</b>. Jog there on Calibration and press again to change it; or measure the canvas from the cup on the Ink tab.`
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
  const h = hereNow();
  if (!h) return '';
  const R = reach(), b = P.carriage, x0 = h.x + b.x0, x1 = h.x + b.x1, y0 = h.y + b.y0, y1 = h.y + b.y1;
  const out = [x0 < R.x.min && `${fmt(R.x.min - x0, 0)} mm past the bottom wall`, x1 > R.x.max && `${fmt(x1 - R.x.max, 0)} mm past the top wall`,
    y0 < R.y.min && `${fmt(R.y.min - y0, 0)} mm past the left wall`, y1 > R.y.max && `${fmt(y1 - R.y.max, 0)} mm past the right wall`].filter(Boolean);
  return out.length ? `The brush would go ${out.join(', ')}: move Here or make the pattern smaller.` : '';
}

// ---------- 💾 SAVE TEST: into the Library, its second shelf ----------
// (the owner, 2026-10-02). An SVG of the board in mm with the rows, the
// settings in its metadata, and a PNG preview; the Library opens it here.
// every setting of the test: SAVE TEST keeps them, and each run writes them to the journal
const settingsNow = () => Object.fromEntries(['pattern', 'passes', 'shift', 'rows', 'turn', 'pitch', 'length', 'bow', 'wave', 'speed', 'travel', 'lift', 'tail', 'boardW', 'boardH', 'margin', 'pause', 'snake', 'ink'].map(k => [k, S[k]]));
function testLabel() { return `${S.pattern === 'D' ? (S.passes || []).join('+') : S.pattern} · ${S.boardW} × ${S.boardH} mm · ${S.rows} rows${S.ink ? ' · ink' : ''}`; }
function testSvg() {
  const W = S.boardW, H = S.boardH, f = v => (Math.round(v * 100) / 100).toFixed(2);
  const settings = settingsNow();
  const meta = JSON.stringify({ rembrandt: '0.1', label: testLabel(), settings }).replace(/&/g, '\\u0026').replace(/</g, '\\u003c').replace(/--/g, '- -');
  // a path for every stretch of one width: the brush's weight, in tenths, thinner in the tails
  const rows = P.preview.flatMap(line => {
    const out = [], wd = i => Math.round(10 * Math.max(0.15, (line[i - 1].k + line[i].k) / 2)) / 10;
    for (let i = 1; i < line.length;) {
      const w = wd(i), pts = [line[i - 1]];
      while (i < line.length && wd(i) === w) pts.push(line[i++]);
      out.push(`  <path${line.pass ? ` stroke="${PASSES[line.pass].color}"` : ''} stroke-width="${f(BRUSH_MM * w)}" d="M${pts.map(q => `${f(W / 2 + q.y)} ${f(H / 2 - q.x)}`).join(' L')}"/>`);
    }
    return out;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W + 2 * TABLE_MM}mm" height="${H}mm" viewBox="${-TABLE_MM} 0 ${W + 2 * TABLE_MM} ${H}">
<!-- Rembrandt v0.1 · Test · ${testLabel()}; 1 unit = 1 mm; ${TABLE_MM} mm either side of the board, where rows may run past it -->
<metadata id="rembrandt-test">${meta}</metadata>
<rect width="${W}" height="${H}" fill="#FCFBF8" stroke="#24221F" stroke-width="0.5"/>
<g fill="none" stroke="#1B1A19" stroke-linecap="round" stroke-linejoin="round">
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
  if (!hereNow()) { $('#runState').innerHTML = '<span class="warn">Set Here first, or the canvas from the cup on the Ink tab.</span>'; return; }
  if (S.ink) {                                    // the cup as the Ink tab has it now
    await loadInk(); update();
    if (cupProblem(cup())) { $('#runState').innerHTML = `<span class="warn">Ink ON: ${cupProblem(cup())}</span>`; return; }
  }
  if (walls()) { $('#runState').innerHTML = `<span class="warn">${walls()}</span>`; return; }
  // one line, Cancel or OK (the owner, 2026-10-02: no more than that)
  if (!confirm(`${P.rows} rows of pattern ${S.pattern === 'D' ? P.passes.join(' + ') : S.pattern} will be run on the machine${S.ink ? `, a dip in the cup before each: ${P.dips} dips` : ''}`)) return;
  try {
    const r = await fetch('/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blocks: P.blocks,
      log: { page: 'test', label: testLabel(), settings: settingsNow(), here: hereNow(), ...(fromCup() ? { fromCup: INK.canvas } : {}), ...(S.ink ? { cup: cup() } : {}), estimate_s: Math.round(P.seconds) } }) });   // the run journal, rembrandt.py
    $('#runState').textContent = await r.text();
  } catch { $('#runState').textContent = 'start rembrandt.py'; }
};
// one key, two states (the owner, 2026-10-02): Pause while it runs; pressed
// when the run waits — paused by hand or by the plan, for the paint — and
// then it says Continue
let paused = false;
$('#btnPause').onclick = () => post(paused ? '/run/continue' : '/run/pause');
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
  // paused for the paint: what to do, on the LCD itself, and the key down
  // and lit, saying Continue (2026-10-02: the D3 pause went unseen)
  const waiting = st?.state === 'paused' && st.message;
  paused = ['paused', 'pausing'].includes(st?.state);
  const key = $('#btnPause');
  key.textContent = paused ? 'CONTINUE' : 'PAUSE';
  key.classList.toggle('call', paused);
  key.disabled = !live;
  const now = waiting ? `❚❚ ${st.message}`
    : live && b?.home ? 'done · the carriage goes home, the brush off'
    : live && b?.dip ? `row ${Math.min(b.row, P.rows)} of ${P.rows} · the dip in the cup`
    : live && b ? (P.snake && !P.ink ? `the snake · ${fmt(st.painted_mm / 10, 0)} of ${fmt(st.paint_mm / 10, 0)} cm` : `row ${Math.min(b.row, P.rows)} of ${P.rows}`) + (st.brush_on ? ' · brush on' : ' · brush off')
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
    <div class="lcd-now${waiting ? ' wait' : ''}">${now}</div>`;
}
async function watch() {
  let st = null;
  try { st = await (await fetch('/run', { cache: 'no-store' })).json(); } catch { }
  lcd(st);
  // the trail: a new one at every PLAY; kept when the run is over, until the next
  const live = st && ['running', 'stopping', 'pausing', 'paused'].includes(st.state);
  if (live && st.started !== trailOf) { trailOf = st.started; trail = []; }
  const h = hereNow();
  if (h && st && trailOf && st.started === trailOf && st.x_mm !== null && st.y_mm !== null) {
    const q = { x: st.x_mm - h.x, y: st.y_mm - h.y, live }, l = trail.at(-1);
    if (!l || Math.hypot(q.x - l.x, q.y - l.y) > 0.5 || l.live !== live) { trail.push(q); draw(); }
  }
  $('#runState').innerHTML = !st ? 'no server: start rembrandt.py' : st.message ? `<span class="${st.state === 'error' ? 'warn' : ''}">${st.message}</span>` : '';
}
lampSwitch($('#lamp'));
addEventListener('rembrandt-night', () => draw());
setInterval(watch, 500);
new ResizeObserver(layout).observe(stage);
update(); watch();
loadInk().then(update);
addEventListener('focus', () => loadInk().then(update));   // back from the Ink tab in another window
const opening = new URLSearchParams(location.search).get('open');   // from the Library
if (opening) openFromLibrary(opening);
