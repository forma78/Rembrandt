// Rembrandt · INK-Y — the cup on the beam (the owner, 2026-11-03, OPM-N/
// IMG_2060…2062: "the jar somewhere near … the machine need not go across
// the whole table, it is enough to drive along Y. SHOULDER turns −25.1°, then
// ELBOW dips −5°, then up and back. All as now, only the jar not at a fixed
// point as on INK, but riding on the beam Y"). His jars, ⌀57, flat-bottomed,
// on a bracket of the beam in the 90 mm left of the 600 × 600 canvas. Its
// numbers: the carriage's Y and the shoulder's angle that put the brush over
// its centre — Here takes the two at once — and the elbow's, as on the Ink
// tab. Kept in app/ink.json's `beam` (rembrandt.py, /ink); once set, every
// dip of every page goes there (ink.js, cupOf), the Ink tab's cup left as it
// is. The jog of the Ink tab, the shoulder's handle with it.

import { fmt } from './util.js';
import { parsePing, toMm, reach, homeCorner } from './machine.js';
import { mountJog } from './jog.js';
import { ELBOW_MIN, ELBOW_MAX, RIM_MIN, DWELL_MAX, SHOULDER_MIN, SHOULDER_MAX, SWING_MIN, SWING_MAX, beamOf, cupProblem, drawCup } from './ink.js';
import { CANVAS_FIELDS, canvasNow, setCanvas, hereOf, onCanvas } from './canvas.js';
import { isNight, themeColor } from './lamp.js';
import './ui.js';

const $ = s => document.querySelector(s);
const INK_ = '#24221F', MUTE = '#7D776D', ORANGE = '#EB7A25', PAPER = '#FCFBF8';
const S = { ink: {}, pos: { x: null, y: null } };
const cup = () => beamOf(S.ink);
const sgn = v => `${v > 0 ? '+' : v < 0 ? '−' : ''}${fmt(Math.abs(v), 1)}`;

// ---------- ink.json ----------
// the whole file back, the Ink tab's cup in it as it was
async function load() {
  try { const r = await fetch('/ink', { cache: 'no-store' }); S.ink = r.ok ? await r.json() : {}; } catch { S.ink = {}; }
}
async function save(what) {
  try {
    const r = await fetch('/ink', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(S.ink, null, 2) });
    $('#saved').textContent = r.ok ? `saved · ${what}` : 'not saved';
  } catch { $('#saved').textContent = 'not saved · start rembrandt.py'; }
}

// ---------- the numbers ----------
// [key, label, unit, step, min, max]; empty: the default — the elbow's two as on the Ink tab
const DIP = [['shoulder', 'To the cup', '°', 0.1, SHOULDER_MIN, SHOULDER_MAX], ['swing', 'Shoulder speed', '°/s', 5, SWING_MIN, SWING_MAX],
  ['rim', 'Over the rim', '°', 1, RIM_MIN, ELBOW_MAX], ['dip', 'In the cup', '°', 1, ELBOW_MIN, ELBOW_MAX - 5], ['dwell', 'In the paint', 's', 0.1, 0, DWELL_MAX]];
const SIZE = [['y', 'Carriage Y', 'mm', 0.1, -100, 2000], ['diameter', 'Diameter', 'mm', 1, 10, 200], ['height', 'Height', 'mm', 1, 1, 100]];
const EST_OF = ['rim', 'dip', 'swing'];
function fields(el, list) {
  el.innerHTML = list.map(([k, label, unit, step, min, max]) =>
    `<label><span>${label}${EST_OF.includes(k) ? ` <span class="est" data-est="${k}">est.</span>` : ''}</span><input data-k="${k}" type="number" step="${step}" min="${min}" max="${max}"><em>${unit}</em></label>`).join('');
  el.querySelectorAll('input').forEach(inp => inp.onchange = () => {
    const k = inp.dataset.k, [, label, unit, , min, max] = list.find(f => f[0] === k);
    const b = { ...S.ink.beam };
    if (inp.value === '') delete b[k];                     // back to the default
    else b[k] = Math.max(min, Math.min(max, +inp.value));
    S.ink = { ...S.ink, beam: b };
    show(); draw();
    save(`${label} ${b[k] ?? cup()[k] ?? '—'} ${unit}`);
  });
}
fields($('#dip'), DIP);
fields($('#size'), SIZE);
// The canvas from home, as on the Ink tab — typed here or there, the same on every tab (canvas.js)
$('#canvas').innerHTML = CANVAS_FIELDS.map(([k, label, unit, step, title, any]) =>
  `<label title="${title}"><span>${label}</span><input data-canvas="${k}" type="number" step="${step}"${any ? '' : ` min="${step}"`}><em>${unit}</em></label>`).join('');
$('#canvas').querySelectorAll('input').forEach(inp => inp.onchange = () => {
  const k = inp.dataset.canvas, v = +inp.value, [, label, unit, , , any] = CANVAS_FIELDS.find(f => f[0] === k);
  if (inp.value !== '' && Number.isFinite(v) && (any || v > 0)) { setCanvas({ [k]: v }); $('#saved').textContent = `the canvas: ${label} ${v} ${unit} · on every tab`; }
  show(); draw();
});

function show() {
  const c = cup(), set = c.y !== null && c.shoulder !== null;
  $('#cupHelp').innerHTML = set
    ? `The carriage dips at <b>Y ${fmt(c.y, 1)} mm</b>, wherever the beam is in X; the shoulder turns <b>${sgn(c.shoulder)}°</b> to put the brush over the cup, ⌀${c.diameter}, ${c.height} mm high. Jog there and press Here again to change it.`
    : 'The cup on the beam is not set yet.';
  $('#cupRead').innerHTML = !set
    ? `Not set — every dip goes to the Ink tab's cup till it is. The elbow up over the rim first (+${c.rim}°); jog the carriage along Y and turn the shoulder until the brush is over the cup's centre; lower it into the paint to check; then press Here: the carriage's Y and the shoulder's angle, the two at once.`
    : 'Every dip goes here: the carriage along Y alone, the shoulder over the cup, the elbow in, up, the shoulder back to 0.';
  for (const inp of document.querySelectorAll('#dip input, #size input')) {
    const k = inp.dataset.k, typed = S.ink.beam || {};
    if (document.activeElement !== inp) inp.value = typed[k] ?? '';
    inp.placeholder = k === 'y' || k === 'shoulder' ? '—' : String(c[k]);   // the default: as on the Ink tab, or the jar's
  }
  const C = canvasNow(), h = hereOf(C);
  for (const inp of $('#canvas').querySelectorAll('input')) if (document.activeElement !== inp) inp.value = C[inp.dataset.canvas];
  $('#canvasRead').innerHTML = `The canvas from home, the same on every tab — typed here or there, it changes on all of them: <b>${C.boardW} × ${C.boardH} mm</b>, `
    + `its bottom left corner at carriage <b>X ${fmt(h.x - C.boardH / 2, 1)} · Y ${fmt(h.y - C.boardW / 2, 1)} mm</b>, its centre X ${fmt(h.x, 1)} · Y ${fmt(h.y, 1)}.`;
  document.querySelectorAll('[data-est]').forEach(el => { el.hidden = !c.est[el.dataset.est]; });
  const why = cupProblem({ ...c, y: c.y ?? 0, shoulder: c.shoulder ?? 0 });   // the numbers only: the place has its own line above
  $('#dipHelp').innerHTML = `To the cup: the carriage along Y with the brush over the rim, the elbow at <b>+${c.rim}°</b>${c.est.rim ? ' (est.)' : ''}; `
    + `the shoulder turns the brush over the cup, to <b>${c.shoulder === null ? '—' : sgn(c.shoulder)}°</b> at ${c.swing}°/s${c.est.swing ? ' (est.)' : ''}. `
    + `In the cup: down into the paint at <b>${c.dip > 0 ? '+' : ''}${c.dip}°</b>${c.est.dip ? ' (est.)' : ''}, <b>${c.dwell} s</b> there, up over the rim, the shoulder back to 0, the carriage back. `
    + `The elbow's numbers empty: the Ink tab's — the jar on the same level. The shoulder: 0° the working pose, minus to the left; ${SHOULDER_MIN}…+${SHOULDER_MAX}°.`;
  $('#dipRead').innerHTML = why ? `<span class="warn">${why}</span>` : '';
}
$('#dipInfo').onclick = () => { $('#dipHelp').hidden = !$('#dipHelp').hidden; $('#dipInfo').classList.toggle('on', !$('#dipHelp').hidden); };
$('#cupInfo').onclick = () => { $('#cupHelp').hidden = !$('#cupHelp').hidden; $('#cupInfo').classList.toggle('on', !$('#cupHelp').hidden); };
$('#canvasInfo').onclick = () => { $('#canvasRead').hidden = !$('#canvasRead').hidden; $('#canvasInfo').classList.toggle('on', !$('#canvasRead').hidden); };

// ---------- Here: the brush over the cup's centre ----------
// the carriage's Y from the board, the shoulder's angle from the arm
$('#btnCup').onclick = async () => {
  let t = null;
  try { const r = await fetch('/machine/ping', { cache: 'no-store' }); t = r.ok ? await r.text() : null; } catch { }
  const p = parsePing(t);
  if (!p) { $('#cupRead').innerHTML = '<span class="warn">No board: start rembrandt.py, the board on USB.</span>'; return; }
  if (p.y === null) { $('#cupRead').innerHTML = '<span class="warn">No zero on the axes: home and Set home on Calibration first.</span>'; return; }
  await JOG.look();
  const sh = JOG.state.shoulder;
  if (sh === null) { $('#cupRead').innerHTML = '<span class="warn">The shoulder does not answer: rembrandt.py, the board, the 12 V?</span>'; return; }
  const y = Math.round(toMm('y', p.y) * 100) / 100, s = Math.round(sh * 10) / 10;
  S.ink = { ...S.ink, beam: { ...S.ink.beam, y, shoulder: s, at: new Date().toISOString() } };
  show(); draw();
  save(`the cup on the beam: Y ${fmt(y, 1)}, the shoulder ${sgn(s)}°`);
};

// ---------- the elbow's angle, taken where it stands ----------
async function takeElbow(k, label) {
  const d = await JOG.look();
  if (d === null) { $('#dipRead').innerHTML = '<span class="warn">The elbow does not answer: rembrandt.py, the board, the 12 V?</span>'; return; }
  const [, , , , min, max] = DIP.find(f => f[0] === k), v = Math.round(d);
  if (v < min || v > max) { $('#dipRead').innerHTML = `<span class="warn">${label} ${v}°: it goes ${min}…+${max}° there.</span>`; return; }
  S.ink = { ...S.ink, beam: { ...S.ink.beam, [k]: v } };
  show(); draw();
  save(`${label} ${v > 0 ? '+' : ''}${v}°`);
}
$('#btnRim').onclick = () => takeElbow('rim', 'Over the rim');
$('#btnDip').onclick = () => takeElbow('dip', 'In the cup');

// ---------- the jog, the shoulder's handle with it ----------
const JOG = mountJog($('#jog'), { link: $('#linkState'), onPing: st => { S.pos = st.pos; draw(); }, shoulder: true });

// ---------- the view from above ----------
// As on the Ink tab: X up, Y to the right, machine mm — the carriage's. The
// beam a line across at the carriage's X; the cup on it where the carriage
// stands to dip, Y the cup's — it rides up and down with the beam.
const cv = $('#top'), ctx = cv.getContext('2d');
function draw() {
  const st = $('#stage'), dpr = devicePixelRatio || 1, W = st.clientWidth, H = st.clientHeight;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const night = isNight(), ink = themeColor('--ink', INK_), mute = themeColor('--mute', MUTE);
  const R = reach(), c = cup(), C = canvasNow(), h = hereOf(C), home = homeCorner();
  const B = { x: h.x, y: h.y, w: C.boardW, h: C.boardH };
  const pts = [{ x: R.x.min, y: R.y.min }, { x: R.x.max, y: R.y.max }, { x: B.x - B.h / 2, y: B.y - B.w / 2 }, { x: B.x + B.h / 2, y: B.y + B.w / 2 }];
  const x0 = Math.min(...pts.map(p => p.x)) - 25, x1 = Math.max(...pts.map(p => p.x)) + 25;
  const y0 = Math.min(...pts.map(p => p.y)) - 60, y1 = Math.max(...pts.map(p => p.y)) + 25;
  const pad = 44, k = Math.min((W - 2 * pad) / (y1 - y0), (H - 2 * pad) / (x1 - x0));
  const ox = (W - (y1 - y0) * k) / 2, oy = (H - (x1 - x0) * k) / 2;
  const sx = y => ox + (y - y0) * k, sy = x => oy + (x1 - x) * k;
  ctx.font = '10px "SF Mono", ui-monospace, Menlo, monospace';

  // grid every 100 mm
  ctx.strokeStyle = night ? 'rgba(255,255,255,.05)' : 'rgba(36,34,31,.07)'; ctx.lineWidth = 1; ctx.fillStyle = mute;
  for (let x = Math.ceil(x0 / 100) * 100; x <= x1; x += 100) {
    ctx.beginPath(); ctx.moveTo(sx(y0), sy(x)); ctx.lineTo(sx(y1), sy(x)); ctx.stroke();
    ctx.textAlign = 'right'; ctx.fillText(`X ${x}`, sx(y0) - 4, sy(x) + 3);
  }
  for (let y = Math.ceil(y0 / 100) * 100; y <= y1; y += 100) {
    ctx.beginPath(); ctx.moveTo(sx(y), sy(x0)); ctx.lineTo(sx(y), sy(x1)); ctx.stroke();
    ctx.textAlign = 'center'; ctx.fillText(`Y ${y}`, sx(y), sy(x0) + 14);
  }
  // the reach, between the walls; dashed orange as on Calibration
  ctx.fillStyle = night ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.35)';
  ctx.fillRect(sx(R.y.min), sy(R.x.max), (R.y.max - R.y.min) * k, (R.x.max - R.x.min) * k);
  ctx.save(); ctx.strokeStyle = ORANGE; ctx.lineWidth = 1.2; ctx.setLineDash([6, 4]);
  ctx.strokeRect(sx(R.y.min), sy(R.x.max), (R.y.max - R.y.min) * k, (R.x.max - R.x.min) * k); ctx.restore();

  // the canvas, from home
  ctx.fillStyle = PAPER; ctx.fillRect(sx(B.y - B.w / 2), sy(B.x + B.h / 2), B.w * k, B.h * k);
  ctx.strokeStyle = 'rgba(36,34,31,.8)'; ctx.lineWidth = 1; ctx.strokeRect(sx(B.y - B.w / 2), sy(B.x + B.h / 2), B.w * k, B.h * k);
  ctx.fillStyle = '#B3470C'; ctx.textAlign = 'left';
  ctx.fillText(`canvas ${B.w} × ${B.h} mm · from home`, sx(B.y - B.w / 2), sy(B.x + B.h / 2) - 6);
  // home, where every run ends
  ctx.strokeStyle = ink; ctx.lineWidth = 1.2;
  ctx.strokeRect(sx(home.y) - 4, sy(home.x) - 4, 8, 8);
  ctx.fillStyle = ink; ctx.textAlign = 'left'; ctx.fillText('home', sx(home.y) + 9, sy(home.x) - 6);

  // the beam, at the carriage's X (Here's till the board answers), wall to wall
  const bx = S.pos.x ?? B.x;
  ctx.strokeStyle = mute; ctx.lineWidth = 3; ctx.globalAlpha = 0.5;
  ctx.beginPath(); ctx.moveTo(sx(R.y.min - 50), sy(bx)); ctx.lineTo(sx(R.y.max), sy(bx)); ctx.stroke(); ctx.globalAlpha = 1;
  ctx.fillStyle = mute; ctx.textAlign = 'right'; ctx.fillText('the beam', sx(R.y.max) - 4, sy(bx) - 6);
  // the cup on it, where the carriage stands to dip: a scope; dashed at the left wall till it is taken
  {
    const set = c.y !== null && c.shoulder !== null, cy = set ? c.y : R.y.min, X = sx(cy), Y = sy(bx), r = c.diameter / 2 * k;
    drawCup(ctx, X, Y, r, !set);
    ctx.fillStyle = ink; ctx.textAlign = 'left';
    ctx.fillText(set ? `cup ⌀${c.diameter} · the carriage at Y ${fmt(c.y)}, the shoulder ${sgn(c.shoulder)}°` : 'the cup on the beam? jog there, then Here', X + r * 1.7 + 6, Y - 8);
  }
  // the carriage
  if (S.pos.x !== null) {
    const X = sx(S.pos.y), Y = sy(S.pos.x);
    ctx.fillStyle = ORANGE; ctx.beginPath(); ctx.arc(X, Y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = ORANGE; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(X, Y, 9, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = ink; ctx.textAlign = 'left';
    ctx.fillText(`X ${fmt(S.pos.x)} · Y ${fmt(S.pos.y)}${c.y !== null ? ` · ${fmt(Math.abs(S.pos.y - c.y), 0)} mm along Y to the cup` : ''}`, X + 13, Y + 18);
  }
  ctx.fillStyle = mute; ctx.textAlign = 'left';
  ctx.fillText('↑ top of the picture · X+', 10, 16);
  ctx.textAlign = 'right'; ctx.fillText('Y+ →', W - 10, 16);
}
addEventListener('resize', draw);
addEventListener('rembrandt-night', draw);
onCanvas(() => { show(); draw(); });   // the canvas typed on another tab

await load();
show(); draw();
