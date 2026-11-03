// Rembrandt · INK-Y — the cup at hand (the owner, 2026-11-03, OPM-N/
// IMG_2108…2121: "not two jars at the sides of Y, but a jar right by the arm.
// No need to drive anywhere, neither right nor left. The jar is always at
// hand"). His jar, ⌀57, on a bracket bolted to the carriage by the arm, above
// the canvas; it rides the whole of Y with it. No place to take: the servos
// know their angles from power-on, the jar never moves against the arm. Its
// numbers are the five steps of README's How to dip, every one a fork the
// joint counts as there in, aimed at its middle. Kept in app/ink.json's
// `hand` (rembrandt.py, /ink); on, every dip of every page goes there (ink.js,
// cupOf), and rembrandt.py refuses a turn of the shoulder with the elbow
// down (hand_guard). The jog of the Ink tab, the shoulder's handle with it.

import { fmt } from './util.js';
import { mountJog } from './jog.js';
import { HAND, PAINT_LO, PAINT_HI, DWELL_MAX, SHOULDER_MIN, SHOULDER_MAX, SWING_MIN, SWING_MAX, ELBOW_MIN, ELBOW_MAX, handOf, cupProblem, mid } from './ink.js';
import { handDip, SHOULDER_WITHIN } from './strokes.js';
import { CANVAS_FIELDS, canvasNow, setCanvas, hereOf, onCanvas } from './canvas.js';
import { isNight, themeColor } from './lamp.js';
import './ui.js';

const $ = s => document.querySelector(s);
const INK_ = '#24221F', MUTE = '#7D776D', ORANGE = '#EB7A25', GREEN = '#3E8E5A', BLUE = '#3B6FB6', RED = '#C8321E', PAPER = '#FCFBF8';
const LIVE = ['running', 'stopping', 'pausing', 'paused'];
const S = { ink: {}, elbow: null, shoulder: null };
const cup = () => handOf(S.ink);
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
const setHand = (h, what) => { S.ink = { ...S.ink, hand: h }; show(); draw(); save(what); };

// ---------- on · off ----------
$('#onOff').innerHTML = '<button class="tog" data-on="1">ON · every dip here</button><button class="tog" data-on="0">OFF · the Ink tab\'s cup</button>';
$('#onOff').querySelectorAll('button').forEach(b => b.onclick = () => {
  const on = b.dataset.on === '1';
  if (on === cup().on) return;
  setHand({ ...S.ink.hand, on }, on ? 'the cup at hand ON: every dip goes here' : 'the cup at hand OFF: dips go to the Ink tab\'s cup');
});

// ---------- the five steps, README's How to dip ----------
// [key, i (a fork's end) or null, label, unit, step, min, max]; empty: his number (ink.js, HAND)
const F = {
  up: [['up', 0, 'from', '°', 0.5, PAINT_HI + 5, ELBOW_MAX], ['up', 1, 'to', '°', 0.5, PAINT_HI + 5, ELBOW_MAX]],
  to: [['to', 0, 'from', '°', 0.5, SHOULDER_MIN, SHOULDER_MAX], ['to', 1, 'to', '°', 0.5, SHOULDER_MIN, SHOULDER_MAX], ['swing', null, 'at', '°/s', 5, SWING_MIN, SWING_MAX]],
  dip: [['dip', null, 'down to', '°', 0.5, PAINT_LO, PAINT_HI], ['dwell', null, 'there', 's', 0.1, 0, DWELL_MAX]],
};
for (const [id, list] of Object.entries(F)) {
  const el = $(`#f-${id}`);
  el.innerHTML = list.map(([k, i, label, unit, step, min, max]) =>
    `<label><span>${label}${k === 'swing' ? ' <span class="est" data-est="swing">est.</span>' : ''}</span><input data-k="${k}" data-i="${i ?? ''}" type="number" step="${step}" min="${min}" max="${max}"><em>${unit}</em></label>`).join('');
  el.querySelectorAll('input').forEach(inp => inp.onchange = () => {
    const k = inp.dataset.k, i = inp.dataset.i === '' ? null : +inp.dataset.i, [, , label, unit, , min, max] = list.find(f => f[0] === k && (f[1] ?? null) === i);
    const h = { ...S.ink.hand }, v = inp.value === '' ? null : Math.max(min, Math.min(max, +inp.value));
    if (i === null) { if (v === null) delete h[k]; else h[k] = v; }
    else { const f = [...cup()[k]]; f[i] = v ?? HAND[k][i]; if (f[0] === HAND[k][0] && f[1] === HAND[k][1]) delete h[k]; else h[k] = f; }   // whole: rembrandt.py's guard reads the same fork
    setHand(h, `${{ up: 'ELBOW up', to: 'SHOULDER to the jar', swing: 'the shoulder', dip: 'ELBOW in the paint', dwell: 'in the paint' }[k]} ${label} ${v ?? '(his)'} ${unit}`);
  });
}
// The elbow in the paint taken where it stands: the paint in the jar goes down, the brush with it
$('#btnPaint').onclick = async () => {
  const d = await JOG.look();
  if (d === null) { $('#stepsRead').innerHTML = '<span class="warn">The elbow does not answer: rembrandt.py, the board, the 12 V?</span>'; return; }
  const v = Math.round(d * 2) / 2;
  if (v < PAINT_LO || v > PAINT_HI) { $('#stepsRead').innerHTML = `<span class="warn">The elbow at ${sgn(v)}°: in the paint it goes +${PAINT_LO}…+${PAINT_HI}° only — the jar stands over the canvas.</span>`; return; }
  setHand({ ...S.ink.hand, dip: v }, `ELBOW in the paint ${sgn(v)}°`);
};

// ---------- Try one dip: the five steps on the machine, nothing else ----------
$('#btnTry').onclick = async () => {
  const c = cup(), why = cupProblem(c), warn = t => { $('#tryRead').innerHTML = `<span class="warn">${t}</span>`; };
  if (!c.on) return warn('Switch the cup at hand ON first: only then does rembrandt.py guard the shoulder.');
  if (why) return warn(why);
  let st = null;
  try { st = await (await fetch('/run', { cache: 'no-store' })).json(); } catch { }
  if (!st) return warn('No server: start rembrandt.py.');
  if (!(st.hand >= 1)) return warn('Restart rembrandt.py first: the one running does not know the cup at hand. Nothing was sent.');
  if (LIVE.includes(st.state)) return warn(`A run is on (${st.state}): not now.`);
  if (!confirm(`ONE DIP into the jar at hand, the carriage where it stands:\n\n1. ELBOW up to ${sgn(mid(c.up))}° (${c.up[0]}…${c.up[1]})\n2. SHOULDER to ${sgn(mid(c.to))}° (${c.to[0]}…${c.to[1]}) at ${c.swing}°/s\n`
    + `3. ELBOW down to ${sgn(c.dip)}° in the paint, ${c.dwell} s\n4. ELBOW up to ${sgn(mid(c.up))}° first\n5. SHOULDER back to 0°\n\nIs the brush in, the jar on its bracket?`)) return;
  const blocks = handDip(c, 0);
  try {
    const r = await fetch('/run', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks, log: { page: 'inky', pass: 'dip', label: 'INK-Y · one dip at hand', cup: c } }) });
    $('#tryRead').textContent = await r.text();
    if (r.ok) setTimeout(watch, 600);
  } catch { warn('start rembrandt.py'); }
};
$('#btnTryStop').onclick = async () => {
  try { $('#tryRead').textContent = await (await fetch('/run/stop', { method: 'POST' })).text(); } catch { $('#tryRead').textContent = 'start rembrandt.py'; }
};
async function watch() {
  let st = null;
  try { st = await (await fetch('/run', { cache: 'no-store' })).json(); } catch { }
  if (!st) return;
  $('#tryRead').innerHTML = LIVE.includes(st.state) ? `${st.state} · block ${st.block + 1} of ${st.blocks}${st.message ? ` · ${st.message}` : ''}`
    : st.state === 'error' ? `<span class="warn">${st.message}</span>` : `${st.state}${st.message ? ` · ${st.message}` : ''}`;
  if (LIVE.includes(st.state)) setTimeout(watch, 500);
}

function show() {
  const c = cup(), typed = S.ink.hand || {};
  $('#onOff').querySelectorAll('button').forEach(b => b.classList.toggle('on', (b.dataset.on === '1') === c.on));
  $('#onRead').innerHTML = c.on
    ? 'ON: every dip of every page goes into the jar at hand — the carriage over the line\'s start, the arm dips there. rembrandt.py turns the shoulder only with the elbow up in its fork, and keeps the elbow over the paint\'s floor while the shoulder is off 0 — a jog too.'
    : '<span class="warn">OFF: dips go to the Ink tab\'s cup, and nothing guards the shoulder.</span> Switch it ON with the jar on its bracket.';
  for (const inp of document.querySelectorAll('.steps input')) {
    const k = inp.dataset.k, i = inp.dataset.i === '' ? null : +inp.dataset.i, v = i === null ? typed[k] : Array.isArray(typed[k]) ? typed[k][i] : null;
    if (document.activeElement !== inp) inp.value = v ?? '';
    inp.placeholder = String(i === null ? HAND[k] : HAND[k][i]);   // his number
  }
  document.querySelectorAll('[data-est]').forEach(el => { el.hidden = !c.est[el.dataset.est]; });
  $('#aim-up').textContent = `aims at ${sgn(mid(c.up))}°`;
  $('#aim-to').textContent = `aims at ${sgn(mid(c.to))}° · ${fmt(Math.abs(mid(c.to)) / c.swing, 1)} s`;
  $('#aim-dip').textContent = `there ${sgn(c.paint[0])}…${sgn(c.paint[1])}°`;
  $('#aim-back').textContent = `the elbow to ${sgn(mid(c.up))}° first, then the shoulder within ${SHOULDER_WITHIN}° of 0`;
  const why = cupProblem(c);
  $('#stepsRead').innerHTML = why ? `<span class="warn">${why}</span>` : '';
  const C = canvasNow(), h = hereOf(C);
  for (const inp of $('#canvas').querySelectorAll('input')) if (document.activeElement !== inp) inp.value = C[inp.dataset.canvas];
  $('#canvasRead').innerHTML = `The canvas from home, the same on every tab — typed here or there, it changes on all of them: <b>${C.boardW} × ${C.boardH} mm</b>, `
    + `its bottom left corner at carriage <b>X ${fmt(h.x - C.boardH / 2, 1)} · Y ${fmt(h.y - C.boardW / 2, 1)} mm</b>, its centre X ${fmt(h.x, 1)} · Y ${fmt(h.y, 1)}.`;
  now();
}
// what the arm may do now, by its angles: the guard rembrandt.py keeps, read out
function now() {
  const c = cup(), e = S.elbow, s = S.shoulder, up = e !== null && e >= c.up[0] - 0.2 && e <= c.up[1] + 0.2, off = s === null || Math.abs(s) > SHOULDER_WITHIN;
  $('#nowRead').innerHTML = e === null || s === null ? 'The arm does not answer yet: rembrandt.py, the board, the 12 V?'
    : `ELBOW <b>${sgn(e)}°</b> · SHOULDER <b>${sgn(s)}°</b> — `
      + (up ? '<span class="ok">the shoulder may turn: the elbow is up</span>' : `<span class="warn">the shoulder must not turn: the elbow up to +${c.up[0]}…+${c.up[1]}° first</span>`)
      + (off ? ` · <span class="warn">the shoulder off 0: the elbow no lower than +${PAINT_LO}°, the wrist still</span>` : '');
}
$('#canvas').innerHTML = CANVAS_FIELDS.map(([k, label, unit, step, title, any]) =>
  `<label title="${title}"><span>${label}</span><input data-canvas="${k}" type="number" step="${step}"${any ? '' : ` min="${step}"`}><em>${unit}</em></label>`).join('');
$('#canvas').querySelectorAll('input').forEach(inp => inp.onchange = () => {
  const k = inp.dataset.canvas, v = +inp.value, [, label, unit, , , any] = CANVAS_FIELDS.find(f => f[0] === k);
  if (inp.value !== '' && Number.isFinite(v) && (any || v > 0)) { setCanvas({ [k]: v }); $('#saved').textContent = `the canvas: ${label} ${v} ${unit} · on every tab`; }
  show(); draw();
});
$('#canvasInfo').onclick = () => { $('#canvasRead').hidden = !$('#canvasRead').hidden; $('#canvasInfo').classList.toggle('on', !$('#canvasRead').hidden); };

// ---------- the jog, the shoulder's handle with it ----------
const JOG = mountJog($('#jog'), {
  link: $('#linkState'), shoulder: true,
  onPing: st => { if (st.elbow !== S.elbow || st.shoulder !== S.shoulder) { S.elbow = st.elbow; S.shoulder = st.shoulder; now(); draw(); } },
});

// ---------- the view: the elbow from the side, the shoulder from above ----------
// Their forks as wedges — the elbow's up green, in the paint blue, on the
// canvas grey; the shoulder's to the jar green, 0 its line — and where the
// joint stands now, orange. No lengths: the angles alone, as the servos tell.
const cv = $('#top'), ctx = cv.getContext('2d');
function draw() {
  const st = $('#stage'), dpr = devicePixelRatio || 1, W = st.clientWidth, H = st.clientHeight;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const night = isNight(), ink = themeColor('--ink', INK_), mute = themeColor('--mute', MUTE), c = cup();
  const wide = W > H * 1.3, R = Math.max(60, Math.min(wide ? W / 4.6 : W / 2.6, wide ? H / 1.9 : H / 4.4));
  ctx.font = '11px "SF Mono", ui-monospace, Menlo, monospace';
  const rad = d => d * Math.PI / 180;
  const wedge = (X, Y, a0, a1, col, r = R) => { ctx.fillStyle = col; ctx.globalAlpha = 0.22; ctx.beginPath(); ctx.moveTo(X, Y); ctx.arc(X, Y, r, Math.min(a0, a1), Math.max(a0, a1)); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; };
  const ray = (X, Y, a, col, w = 1, r = R, dash) => { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; if (dash) ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X + r * Math.cos(a), Y + r * Math.sin(a)); ctx.stroke(); ctx.restore(); };
  const say = (t, x, y, col = mute, al = 'left') => { ctx.fillStyle = col; ctx.textAlign = al; ctx.fillText(t, x, y); };

  // the elbow from the side: 0° along the canvas to the right, plus up (screen angle −deg)
  const EX = wide ? W * 0.12 : W * 0.18, EY = wide ? H * 0.62 : H * 0.36, E = d => rad(-d);
  say('ELBOW — from the side', EX, EY - R - 18, ink);
  ctx.strokeStyle = night ? 'rgba(255,255,255,.35)' : 'rgba(36,34,31,.5)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(EX - 20, EY + 0.5); ctx.lineTo(EX + R + 10, EY + 0.5); ctx.stroke();
  say('the canvas', EX + R + 10, EY + 16, mute, 'right');
  wedge(EX, EY, E(ELBOW_MIN), E(10), mute);
  wedge(EX, EY, E(c.paint[0]), E(c.paint[1]), BLUE);
  wedge(EX, EY, E(c.up[0]), E(c.up[1]), GREEN);
  for (const [d, t, col] of [[mid(c.up), `up ${sgn(c.up[0])}…${sgn(c.up[1])}°`, GREEN], [c.dip, `in the paint ${sgn(c.dip)}°`, BLUE], [10, 'off the canvas +10°', mute]]) {
    ray(EX, EY, E(d), col, 1, R, [4, 3]);
    say(t, EX + (R + 8) * Math.cos(E(d)), EY + (R + 8) * Math.sin(E(d)) + 4, col);
  }
  if (S.elbow !== null) { ray(EX, EY, E(S.elbow), ORANGE, 3, R * 0.92); say(`now ${sgn(S.elbow)}°`, EX, EY + 32, ORANGE); }
  ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(EX, EY, 4, 0, Math.PI * 2); ctx.fill();

  // the shoulder from above: 0° the working pose, up the screen; plus to the right
  const SX = wide ? W * 0.68 : W * 0.5, SY = wide ? H * 0.72 : H * 0.88, A = d => rad(-90 + d);
  say('SHOULDER — from above', SX - R, SY - R - 18, ink);
  wedge(SX, SY, A(c.to[0]), A(c.to[1]), GREEN);
  ray(SX, SY, A(0), ink, 1.2, R, [4, 3]); say('0° · painting', SX, SY - R - 4, ink, 'center');
  const jm = A(mid(c.to)), jx = SX + R * 0.86 * Math.cos(jm), jy = SY + R * 0.86 * Math.sin(jm), jr = Math.max(9, R * 0.16);
  ctx.save(); ctx.strokeStyle = RED; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(jx, jy, jr, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  say(`the jar ${sgn(c.to[0])}…${sgn(c.to[1])}°`, jx + jr + 6, jy + 4, RED);
  if (S.shoulder !== null) { ray(SX, SY, A(S.shoulder), ORANGE, 3, R * 0.92); say(`now ${sgn(S.shoulder)}°`, SX + 10, SY + 18, ORANGE); }
  ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(SX, SY, 4, 0, Math.PI * 2); ctx.fill();
  const ok = S.elbow !== null && S.elbow >= c.up[0] - 0.2 && S.elbow <= c.up[1] + 0.2;
  if (S.elbow !== null) say(ok ? 'may turn: the elbow is up' : 'must not turn: the elbow is down', SX, SY + 34, ok ? GREEN : RED, 'center');
}
addEventListener('resize', draw);
addEventListener('rembrandt-night', draw);
onCanvas(() => { show(); draw(); });   // the canvas typed on another tab

await load();
show(); draw();
