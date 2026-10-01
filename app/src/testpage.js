// Rembrandt · Test — rows of hairpins on a board (strokes.js), run
// on the machine by rembrandt.py's runner: the plotter draws each row, the
// wrist lifts the brush with its hook, a pause for paint. The page only plans
// and watches; STOP and HARD STOP stop the carriage (and the arm).

import { fmt } from './util.js';
import { parsePing, toMm, reach } from './machine.js';
import { xyPlan, PATTERNS, DEFAULTS } from './strokes.js';
import './ui.js';

const $ = s => document.querySelector(s);
const KEY = 'rembrandt.test.v01';
const S = { ...DEFAULTS, pattern: 'A', here: null };
try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { }
for (const k of ['sweep', 'reach', 'fast', 'turnSpeed']) delete S[k];   // the arm strokes' settings, dropped 2026-10-02
if (S.board) { S.boardW = S.boardH = S.board; delete S.board; }          // one size for both before; width and height apart since 2026-10-02
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { } };

const FIELDS = [
  ['rows', 'Rows', '', 1], ['turn', 'Turn', 'mm', 1], ['pitch', 'Row to row', 'mm', 1], ['length', 'Row length', 'mm', 5],
  ['speed', 'Brush on', 'mm/s', 1], ['travel', 'Between rows', 'mm/s', 5],
  ['boardW', 'Board width', 'mm', 10], ['boardH', 'Board height', 'mm', 10],
];
$('#fields').innerHTML = FIELDS.map(([k, label, unit, step]) => `<label>${label} <input data-k="${k}" type="number" step="${step}" min="${step}"><em>${unit}</em></label>`).join('');
$('#fields').querySelectorAll('input').forEach(inp => inp.onchange = () => { const v = +inp.value; if (v > 0) S[inp.dataset.k] = v; update(); });
$('#pat').querySelectorAll('button').forEach(b => b.onclick = () => { S.pattern = b.dataset.p; Object.assign(S, PATTERNS[S.pattern]); update(); });
$('#pause').onchange = e => { S.pause = e.target.checked; update(); };

// ---------- the plan, drawn on the board ----------
const cv = $('#cv'), ctx = cv.getContext('2d'), stage = $('#stage'), board = $('#board');
let P = xyPlan(S), k = 1, dpr = 1;
function layout() {
  const r = stage.getBoundingClientRect(), m = 36, sw = S.boardW + 40, sh = S.boardH + 40;
  k = Math.max(0.2, Math.min((r.width - 2 * m) / sw, (r.height - 2 * m) / sh));
  dpr = window.devicePixelRatio || 1;
  const w = Math.round(sw * k), h = Math.round(sh * k);
  board.style.width = w + 'px'; board.style.height = h + 'px';
  cv.style.width = w + 'px'; cv.style.height = h + 'px'; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  draw();
}
// screen: Y to the right, X up; the board's centre in the middle
const sx = y => ((S.boardW + 40) / 2 + y) * k, sy = x => ((S.boardH + 40) / 2 - x) * k;
function draw() {
  const c = ctx, hw = S.boardW / 2, hh = S.boardH / 2, m = S.margin;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.fillStyle = '#E2DED6'; c.fillRect(0, 0, cv.width, cv.height);
  c.fillStyle = '#FCFBF8'; c.fillRect(sx(-hw), sy(hh), S.boardW * k, S.boardH * k);
  c.strokeStyle = 'rgba(36,34,31,.8)'; c.lineWidth = 1; c.strokeRect(sx(-hw) + .5, sy(hh) + .5, S.boardW * k - 1, S.boardH * k - 1);
  c.setLineDash([4, 4]); c.strokeStyle = 'rgba(179,71,12,.6)'; c.strokeRect(sx(-hw + m), sy(hh - m), (S.boardW - 2 * m) * k, (S.boardH - 2 * m) * k); c.setLineDash([]);
  c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#1B1A19'; c.lineWidth = 10 * k;   // a round brush, about 10 mm (est.)
  for (const line of P.preview) { c.beginPath(); line.forEach((q, i) => i ? c.lineTo(sx(q.y), sy(q.x)) : c.moveTo(sx(q.y), sy(q.x))); c.stroke(); }
  c.strokeStyle = '#EB7A25'; c.lineWidth = 1.5;                                             // Here: the board's centre
  c.beginPath(); c.moveTo(sx(-8), sy(0)); c.lineTo(sx(8), sy(0)); c.moveTo(sx(0), sy(-8)); c.lineTo(sx(0), sy(8)); c.stroke();
  c.font = '10px ' + getComputedStyle(document.body).getPropertyValue('--mono'); c.fillStyle = '#B3470C';
  c.fillText(`board ${S.boardW} × ${S.boardH} mm · margin ${S.margin}`, sx(-hw), sy(hh) - 6);
}

function update() {
  P = xyPlan(S);
  document.querySelectorAll('#pat button').forEach(b => b.classList.toggle('on', b.dataset.p === S.pattern));
  $('#fields').querySelectorAll('input').forEach(inp => { if (document.activeElement !== inp) inp.value = S[inp.dataset.k]; });
  $('#pause').checked = S.pause && !S.snake;
  // C, the snake: the turn is the row to row, and a continuous line has no pause
  $('#fields input[data-k="turn"]').disabled = !!S.snake;
  $('#pause').disabled = !!S.snake; $('#pause').parentElement.classList.toggle('off', !!S.snake);
  $('#planRead').innerHTML = (P.snake
    ? `${P.rows} rows in one line · <b>${fmt(P.width / 10, 1)} × ${fmt(P.height / 10, 1)} cm</b> · ${fmt(P.length / 1000, 2)} m with the brush down all the way, at ${S.speed} mm/s · ≈ ${fmt(P.seconds / 60, 1)} min (est.)`
    : `${P.rows} rows · <b>${fmt(P.width / 10, 1)} × ${fmt(P.height / 10, 1)} cm</b> · the brush at ${S.speed} mm/s · ≈ ${fmt(P.seconds / 60, 1)} min without the pauses (est.)`)
    + (P.fits ? '' : ` <span class="hint">Past the ${P.room.w} × ${P.room.h} mm inside the margins — allowed (the owner, 2026-10-02); only the machine's walls stop it.</span>`)
    + (walls() ? ` <span class="warn">${walls()}</span>` : '');
  $('#stats').textContent = `${P.blocks.length} steps · pattern ${S.pattern}`;
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

// ---------- the run ----------
const post = async path => { try { const r = await fetch(path, { method: 'POST' }); return await r.text(); } catch { return 'start rembrandt.py'; } };
$('#btnDoJob').onclick = async () => {
  if (!S.here) { $('#runState').innerHTML = '<span class="warn">Set Here first.</span>'; return; }
  if (walls()) { $('#runState').innerHTML = `<span class="warn">${walls()}</span>`; return; }
  if (!confirm(`Run ${P.rows} rows of pattern ${S.pattern} on the machine?` + (P.fits ? '' : '\nIt goes past the board\'s margins.') + `\n\nThe first time: in the air — the brush off, no board under it.`)) return;
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

async function watch() {
  try {
    const st = await (await fetch('/run', { cache: 'no-store' })).json();
    const b = P.blocks[st.block], live = ['running', 'stopping', 'pausing', 'paused'].includes(st.state);
    $('#runState').innerHTML = `<b>${st.state.toUpperCase()}</b>` + (live && b ? ` · row ${Math.min(b.row, P.rows)} of ${P.rows} · step ${st.block + 1} of ${st.blocks}` : '')
      + (st.message ? `<br><span class="${st.state === 'error' ? 'warn' : ''}">${st.message}</span>` : '');
    $('#runHint').textContent = st.brush_on ? 'the brush on the board' : '';
  } catch { $('#runState').textContent = 'no server: start rembrandt.py'; }
}
setInterval(watch, 500);
new ResizeObserver(layout).observe(stage);
update(); watch();
