// Rembrandt · Ink — where the brush takes its paint (the owner, 2026-10-03:
// "maybe one more tab, INK" — "just INK, it is clear anyway"), between Test
// and Adjustments. One cup for now: its centre, taken as Here on the Test
// tab — the carriage jogged until the brush is over it — its size, and how
// the elbow dips into it, the elbow's angle taken where it stands. Kept in
// app/ink.json (rembrandt.py, /ink); INK ON on the Test tab reads it. The
// jog of Calibration is here too (src/jog.js; the owner: "what do I move
// the machine with? add me the sliders from Calibration").

import { fmt } from './util.js';
import { parsePing, toMm, reach, homeCorner } from './machine.js';
import { mountJog } from './jog.js';
import { CUP, CUP_AIM, EST, ELBOW_MIN, ELBOW_MAX, RIM_MIN, DWELL_MAX, cupOf, cupProblem, drawCup, dipAt } from './ink.js';
import { CANVAS_FIELDS, canvasNow, setCanvas, hereOf, onCanvas } from './canvas.js';
import { isNight, themeColor } from './lamp.js';
import './ui.js';

const $ = s => document.querySelector(s);
const INK_ = '#24221F', MUTE = '#7D776D', ORANGE = '#EB7A25', PAPER = '#FCFBF8';
const S = { ink: {}, pos: { x: null, y: null } };
const cup = () => cupOf(S.ink);

// ---------- ink.json ----------
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
// [key, label, unit, step, min, max]; the elbow's two est. until typed
const SIZE = [['diameter', 'Diameter', 'mm', 1, 10, 200], ['height', 'Height', 'mm', 1, 1, 100]];
const DIP = [['rim', 'Over the rim', '°', 1, RIM_MIN, ELBOW_MAX], ['dip', 'In the cup', '°', 1, ELBOW_MIN, ELBOW_MAX - 5], ['dwell', 'In the paint', 's', 0.1, 0, DWELL_MAX]];
// part: where in ink.json — the cup's numbers
function fields(el, list, part = 'cup') {
  el.innerHTML = list.map(([k, label, unit, step, min, max]) =>
    `<label><span>${label}${EST.includes(k) ? ` <span class="est" data-est="${k}">est.</span>` : ''}</span><input data-part="${part}" data-k="${k}" type="number" step="${step}" min="${min}" max="${max}" placeholder="${part === 'cup' ? CUP[k] : '—'}"><em>${unit}</em></label>`).join('');
  el.querySelectorAll('input').forEach(inp => inp.onchange = () => {
    const k = inp.dataset.k, [, label, unit, , min, max] = list.find(f => f[0] === k);
    const c = { ...S.ink[part] };
    if (inp.value === '') delete c[k];                     // back to the default, est. again
    else c[k] = Math.max(min, Math.min(max, +inp.value));
    S.ink = { ...S.ink, [part]: c };
    show(); draw();
    save(`${label} ${c[k] ?? CUP[k] ?? '—'} ${unit}`);
  });
}
fields($('#size'), SIZE);
fields($('#dip'), DIP);
// The canvas from home, the one base of TYPE, NOLAN and New Yuri (canvas.js;
// the owner, 2026-10-06: "make it as on NOLAN and TYPE — one base"), in
// place of the canvas from the cup's ruler numbers of 2026-10-03.
$('#canvas').innerHTML = CANVAS_FIELDS.map(([k, label, unit, step, title, any]) =>
  `<label title="${title}"><span>${label}</span><input data-canvas="${k}" type="number" step="${step}"${any ? '' : ` min="${step}"`}><em>${unit}</em></label>`).join('');
$('#canvas').querySelectorAll('input').forEach(inp => inp.onchange = () => {
  const k = inp.dataset.canvas, v = +inp.value, [, label, unit, , , any] = CANVAS_FIELDS.find(f => f[0] === k);
  if (inp.value !== '' && Number.isFinite(v) && (any || v > 0)) { setCanvas({ [k]: v }); $('#saved').textContent = `the canvas: ${label} ${v} ${unit} · on every tab`; }
  show(); draw();
});

function show() {
  const c = cup();
  // Under the ⓘ, as The dip (the owner, 2026-10-05: "let's do it so
  // everywhere"); what needs doing stays out: not set, too near the rim.
  const off = c.x !== null ? dipAt(c).off : 0, rim = off > c.diameter / 4;
  $('#cupHelp').innerHTML = c.x !== null
    ? `The cup's centre: carriage <b>X ${fmt(c.x, 1)} · Y ${fmt(c.y, 1)} mm</b> · ⌀${c.diameter}, ${c.height} mm high. Jog there and press again to change it.`
      + (off > 0 && !rim ? ` It lies ${fmt(off, 1)} mm past the machine's walls, where the board takes no path: the brush dips at X ${fmt(dipAt(c).x, 1)} · Y ${fmt(dipAt(c).y, 1)}, inside them, well within the cup.` : '')
    : 'The cup is not set yet.';
  $('#cupRead').innerHTML = c.x === null
    ? 'Not set. The elbow up over the rim first (+35° or more), or the brush knocks the cup over; jog the brush over the red scope, the cup\'s centre; lower it into the paint to check; then press here.'
    : rim ? `<span class="warn">It lies ${fmt(off, 1)} mm past the machine's walls, where the board takes no path: the brush dips at X ${fmt(dipAt(c).x, 1)} · Y ${fmt(dipAt(c).y, 1)}, inside them — too near the rim: move the cup in.</span>` : '';
  for (const inp of document.querySelectorAll('.grid4 input[data-part]')) {
    const k = inp.dataset.k, typed = S.ink[inp.dataset.part] || {};
    if (document.activeElement !== inp) inp.value = typed[k] ?? '';
  }
  const C = canvasNow(), h = hereOf(C);
  for (const inp of $('#canvas').querySelectorAll('input')) if (document.activeElement !== inp) inp.value = C[inp.dataset.canvas];
  $('#canvasRead').innerHTML = `The canvas from home, the same on TYPE, NOLAN and New Yuri — typed here or there, it changes on all of them: <b>${C.boardW} × ${C.boardH} mm</b>, `
    + `its bottom left corner at carriage <b>X ${fmt(h.x - C.boardH / 2, 1)} · Y ${fmt(h.y - C.boardW / 2, 1)} mm</b>, its centre — their Here — X ${fmt(h.x, 1)} · Y ${fmt(h.y, 1)}. The Test tab lays its own board from its own Here.`;
  document.querySelectorAll('[data-est]').forEach(el => { el.hidden = !c.est[el.dataset.est]; });
  const why = cupProblem({ ...c, x: 0, y: 0 });   // the numbers only: the centre has its own line above
  // The explanation under the ⓘ, the warning always (the owner, 2026-10-04: "it makes noise, I know it").
  $('#dipHelp').innerHTML = `Over the rim: the brush flies to the cup and away from it this high, the elbow at <b>+${c.rim}°</b>${c.est.rim ? ' (est.)' : ''}. `
    + `In the cup: down into the paint at <b>${c.dip > 0 ? '+' : ''}${c.dip}°</b>${c.est.dip ? ' (est.)' : ''}, <b>${c.dwell} s</b> there, then up again. `
    + `The elbow: 0° presses the brush to the canvas, off it at +10°, +${ELBOW_MAX}° at most. Measure both with the elbow's handle below, the brush over the cup, and take them with ← elbow; empty — the default.`;
  $('#dipRead').innerHTML = why ? `<span class="warn">${why}</span>` : '';
}
$('#dipInfo').onclick = () => { $('#dipHelp').hidden = !$('#dipHelp').hidden; $('#dipInfo').classList.toggle('on', !$('#dipHelp').hidden); };
$('#cupInfo').onclick = () => { $('#cupHelp').hidden = !$('#cupHelp').hidden; $('#cupInfo').classList.toggle('on', !$('#cupHelp').hidden); };
$('#canvasInfo').onclick = () => { $('#canvasRead').hidden = !$('#canvasRead').hidden; $('#canvasInfo').classList.toggle('on', !$('#canvasRead').hidden); };

// ---------- Here: the brush over the cup's centre ----------
$('#btnCup').onclick = async () => {
  let t = null;
  try { const r = await fetch('/machine/ping', { cache: 'no-store' }); t = r.ok ? await r.text() : null; } catch { }
  const p = parsePing(t);
  if (!p) { $('#cupRead').innerHTML = '<span class="warn">No board: start rembrandt.py, the board on USB.</span>'; return; }
  if (p.x === null || p.y === null) { $('#cupRead').innerHTML = '<span class="warn">No zero on the axes: home and Set home on Calibration first.</span>'; return; }
  const x = Math.round(toMm('x', p.x) * 100) / 100, y = Math.round(toMm('y', p.y) * 100) / 100;
  S.ink = { ...S.ink, cup: { ...S.ink.cup, x, y, at: new Date().toISOString() } };
  show(); draw();
  save(`the cup at X ${fmt(x, 1)} · Y ${fmt(y, 1)}`);
};

// ---------- the elbow's angle, taken where it stands ----------
// Down until the bristles are in the paint: In the cup; up until the brush
// clears the rim, with room: Over the rim.
async function takeElbow(k, label) {
  const d = await JOG.look();
  if (d === null) { $('#dipRead').innerHTML = '<span class="warn">The elbow does not answer: rembrandt.py, the board, the 12 V?</span>'; return; }
  const [, , , , min, max] = DIP.find(f => f[0] === k), v = Math.round(d);
  if (v < min || v > max) { $('#dipRead').innerHTML = `<span class="warn">${label} ${v}°: it goes ${min}…+${max}° there.</span>`; return; }
  S.ink = { ...S.ink, cup: { ...S.ink.cup, [k]: v } };
  show(); draw();
  save(`${label} ${v > 0 ? '+' : ''}${v}°`);
}
$('#btnRim').onclick = () => takeElbow('rim', 'Over the rim');
$('#btnDip').onclick = () => takeElbow('dip', 'In the cup');

// ---------- the jog, and where the carriage is ----------
const JOG = mountJog($('#jog'), { link: $('#linkState'), onPing: st => { S.pos = st.pos; draw(); } });

// The canvas from home, as TYPE and NOLAN lay it (canvas.js): drawn round
// the cup, so the two are seen together.
function theCanvas() { const C = canvasNow(), h = hereOf(C); return { x: h.x, y: h.y, w: C.boardW, h: C.boardH }; }

// ---------- the view from above ----------
// As on Calibration: the bottom of the picture at the bottom, X up, Y to the
// right, machine mm — the carriage's, so the cup lies where the carriage
// stands with the brush over it.
const cv = $('#top'), ctx = cv.getContext('2d');
function draw() {
  const st = $('#stage'), dpr = devicePixelRatio || 1, W = st.clientWidth, H = st.clientHeight;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const night = isNight(), ink = themeColor('--ink', INK_), mute = themeColor('--mute', MUTE);
  const R = reach(), c = cup(), B = theCanvas(), home = homeCorner();
  const pts = [{ x: R.x.min, y: R.y.min }, { x: R.x.max, y: R.y.max }];
  if (B) pts.push({ x: B.x - B.h / 2, y: B.y - B.w / 2 }, { x: B.x + B.h / 2, y: B.y + B.w / 2 });
  const at = c.x !== null ? c : CUP_AIM, aimed = c.x === null, e = c.diameter / 2 * 1.7;   // the cup, or the scope where it is aimed at
  pts.push({ x: at.x - e, y: at.y - e }, { x: at.x + e, y: at.y + e });
  const x0 = Math.min(...pts.map(p => p.x)) - 25, x1 = Math.max(...pts.map(p => p.x)) + 25;
  const y0 = Math.min(...pts.map(p => p.y)) - 25, y1 = Math.max(...pts.map(p => p.y)) + 25;
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
  if (B) {
    ctx.fillStyle = PAPER; ctx.fillRect(sx(B.y - B.w / 2), sy(B.x + B.h / 2), B.w * k, B.h * k);
    ctx.strokeStyle = 'rgba(36,34,31,.8)'; ctx.lineWidth = 1; ctx.strokeRect(sx(B.y - B.w / 2), sy(B.x + B.h / 2), B.w * k, B.h * k);
    ctx.fillStyle = '#B3470C'; ctx.textAlign = 'left';
    ctx.fillText(`canvas ${B.w} × ${B.h} mm · from home, as on TYPE and NOLAN`, sx(B.y - B.w / 2), sy(B.x + B.h / 2) - 6);
  }
  // home, where every run ends
  ctx.strokeStyle = ink; ctx.lineWidth = 1.2;
  ctx.strokeRect(sx(home.y) - 4, sy(home.x) - 4, 8, 8);
  ctx.fillStyle = ink; ctx.textAlign = 'left'; ctx.fillText('home', sx(home.y) + 9, sy(home.x) - 6);

  // the cup as a scope: where it was taken, or dashed where it is aimed at
  {
    const X = sx(at.y), Y = sy(at.x), r = c.diameter / 2 * k;
    drawCup(ctx, X, Y, r, aimed);
    ctx.fillStyle = ink; ctx.textAlign = 'left';
    ctx.fillText(aimed ? `the cup? X ${CUP_AIM.x} · Y ${CUP_AIM.y} (est.) · aim here, then Here` : `cup ⌀${c.diameter} · X ${fmt(c.x)} · Y ${fmt(c.y)}`, X + r * 1.7 + 6, Y + 3);
  }
  // the carriage, and how far the brush is from the scope's centre
  if (S.pos.x !== null) {
    const X = sx(S.pos.y), Y = sy(S.pos.x), off = Math.hypot(S.pos.x - at.x, S.pos.y - at.y);
    ctx.fillStyle = ORANGE; ctx.beginPath(); ctx.arc(X, Y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = ORANGE; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(X, Y, 9, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = ink; ctx.textAlign = 'right';
    ctx.fillText(`X ${fmt(S.pos.x)} · Y ${fmt(S.pos.y)} · ${fmt(off, 0)} mm to the ${aimed ? 'scope' : 'cup'}`, X - 13, Y - 10);
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
