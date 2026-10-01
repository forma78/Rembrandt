// Rembrandt · 3DOF — the arm strokes on a small board (strokes.js), run on
// the machine by rembrandt.py's runner: joint blocks at their speed, the
// carriage for the turns and the rows, the wrist for the hooks, a pause for
// paint. The page only plans and watches; STOP and HARD STOP stop the
// carriage and the arm.

import { fmt } from './util.js';
import { parsePing, toMm } from './machine.js';
import { armPlan, PATTERNS, DEFAULTS } from './strokes.js';
import './ui.js';

const $ = s => document.querySelector(s);
const KEY = 'rembrandt.3dof.v01';
const S = { ...DEFAULTS, pattern: 'A', here: null };
try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { } };

const FIELDS = [
  ['rows', 'Rows', '', 1], ['turn', 'Turn', 'mm', 1], ['pitch', 'Row to row', 'mm', 1], ['sweep', 'Arc, each way', '°', 1],
  ['speed', 'Brush on', '°/s', 1], ['fast', 'In the air', '°/s', 1], ['reach', 'Reach, est.', 'mm', 1], ['board', 'Board', 'mm', 10],
];
$('#fields').innerHTML = FIELDS.map(([k, label, unit, step]) => `<label>${label} <input data-k="${k}" type="number" step="${step}" min="${step}"><em>${unit}</em></label>`).join('');
$('#fields').querySelectorAll('input').forEach(inp => inp.onchange = () => { const v = +inp.value; if (v > 0) S[inp.dataset.k] = v; update(); });
$('#pat').querySelectorAll('button').forEach(b => b.onclick = () => { S.pattern = b.dataset.p; Object.assign(S, PATTERNS[S.pattern]); update(); });
$('#pause').onchange = e => { S.pause = e.target.checked; update(); };

// ---------- the plan, drawn on the board ----------
const cv = $('#cv'), ctx = cv.getContext('2d'), stage = $('#stage'), board = $('#board');
let P = armPlan(S), k = 1, dpr = 1;
function layout() {
  const r = stage.getBoundingClientRect(), m = 36, side = S.board + 40;
  k = Math.max(0.2, Math.min((r.width - 2 * m) / side, (r.height - 2 * m) / side));
  dpr = window.devicePixelRatio || 1;
  const w = Math.round(side * k);
  board.style.width = board.style.height = w + 'px';
  cv.style.width = cv.style.height = w + 'px'; cv.width = cv.height = Math.round(w * dpr);
  draw();
}
// screen: Y to the right, X up; the board's centre in the middle
const sx = y => ((S.board + 40) / 2 + y) * k, sy = x => ((S.board + 40) / 2 - x) * k;
function draw() {
  const c = ctx, h = S.board / 2, m = S.margin;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.fillStyle = '#E2DED6'; c.fillRect(0, 0, cv.width, cv.height);
  c.fillStyle = '#FCFBF8'; c.fillRect(sx(-h), sy(h), S.board * k, S.board * k);
  c.strokeStyle = 'rgba(36,34,31,.8)'; c.lineWidth = 1; c.strokeRect(sx(-h) + .5, sy(h) + .5, S.board * k - 1, S.board * k - 1);
  c.setLineDash([4, 4]); c.strokeStyle = 'rgba(179,71,12,.6)'; c.strokeRect(sx(-h + m), sy(h - m), (S.board - 2 * m) * k, (S.board - 2 * m) * k); c.setLineDash([]);
  c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#1B1A19'; c.lineWidth = 10 * k;   // a round brush, about 10 mm (est.)
  for (const line of P.preview) { c.beginPath(); line.forEach((q, i) => i ? c.lineTo(sx(q.y), sy(q.x)) : c.moveTo(sx(q.y), sy(q.x))); c.stroke(); }
  c.strokeStyle = '#EB7A25'; c.lineWidth = 1.5;                                             // Here: the shoulder at 0°
  c.beginPath(); c.moveTo(sx(-8), sy(0)); c.lineTo(sx(8), sy(0)); c.moveTo(sx(0), sy(-8)); c.lineTo(sx(0), sy(8)); c.stroke();
  c.font = '10px ' + getComputedStyle(document.body).getPropertyValue('--mono'); c.fillStyle = '#B3470C';
  c.fillText(`board ${S.board} × ${S.board} mm · margin ${S.margin}`, sx(-h), sy(h) - 6);
}

function update() {
  P = armPlan(S);
  document.querySelectorAll('#pat button').forEach(b => b.classList.toggle('on', b.dataset.p === S.pattern));
  $('#fields').querySelectorAll('input').forEach(inp => { if (document.activeElement !== inp) inp.value = S[inp.dataset.k]; });
  $('#pause').checked = S.pause;
  const mmps = S.reach * S.speed * Math.PI / 180;
  $('#planRead').innerHTML = `${P.rows} rows · <b>${fmt(P.width / 10, 1)} × ${fmt(P.height / 10, 1)} cm</b> · the ends ${fmt(P.sag, 0)} mm below the middle · the brush ≈ ${fmt(mmps, 0)} mm/s · ≈ ${fmt(P.seconds / 60, 1)} min without the pauses (est.)`
    + (P.fits ? '' : ` <span class="warn">Does not fit the ${P.room} mm inside the margins: fewer rows, a smaller arc or turn.</span>`);
  $('#stats').textContent = `${P.blocks.length} steps · pattern ${S.pattern}`;
  showHere(); save(); layout();
}

// ---------- Here ----------
function showHere() {
  $('#hereRead').innerHTML = S.here ? `The board's centre: carriage <b>X ${fmt(S.here.x, 1)} · Y ${fmt(S.here.y, 1)} mm</b>. Jog there on Calibration and press again to change it.`
    : 'Not set. On Calibration: the shoulder at 0°, jog the carriage until the brush is over the board\'s centre; then press here.';
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

// ---------- the run ----------
const post = async path => { try { const r = await fetch(path, { method: 'POST' }); return await r.text(); } catch { return 'start rembrandt.py'; } };
$('#btnDoJob').onclick = async () => {
  if (!S.here) { $('#runState').innerHTML = '<span class="warn">Set Here first.</span>'; return; }
  if (!P.fits) { $('#runState').innerHTML = '<span class="warn">The pattern does not fit the board.</span>'; return; }
  if (!confirm(`Run ${P.rows} rows of pattern ${S.pattern} on the machine?\n\nThe first time: in the air — the brush off, no board under it.`)) return;
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
