// LAB's page: where the sheet lies, its strokes numbered, RUN and STOP (labplan.js). Nothing is kept but where.
import { LAB, labPlan, labSize } from './labplan.js';
import { homeBlocks } from './strokes.js';
import { cupOf, cupProblem } from './ink.js';
import { reach, STEPS_PER_MM } from './machine.js';
import './ui.js';

const $ = s => document.querySelector(s), KEEP = 'rembrandt.lab.v01', LIVE = ['running', 'stopping', 'pausing', 'paused'];
const S = { x0: 200, y0: 150, press: LAB.press, sheet: 16, tracks: 4 };
try { Object.assign(S, JSON.parse(localStorage.getItem(KEEP) || '{}')); } catch { }
S.sheet = 16;                                // the sheet to run next, at every opening: real 3's first layer (the dry test run 2026-11-09)
const save = () => { try { localStorage.setItem(KEEP, JSON.stringify(S)); } catch { } };
let ink = null;
const say = (t, warn) => { $('#runRead').innerHTML = warn ? `<span class="warn">${t}</span>` : t; };
const fake = () => ({ hand: true, on: true, up: [30, 35], to: [30, 35], dip: 15, paint: [14, 16], dwell: 1, swing: 40 });
const planOf = (sheet, from = 1) => labPlan({ x0: S.x0, y0: S.y0, press: S.press, sheet, tracks: S.tracks, from, cup: ink ? cupOf(ink) : fake() });
const plan = () => planOf(S.sheet);
const sheetName = () => ({ 1: 'LAB', 2: 'LAB 2.0', 3: 'LAB 3.0', 4: 'LAB 3.0 · long', 5: 'LAB 3.0 · seam', 6: 'LAB 3.0 · long snake', 7: 'LAB 3.0 · snake + idle', 8: 'LAB 3.0 · + idle 2.0', 9: 'LAB 3.0 · + idle 3.0', 10: 'LAB 3.0 · + idle 4.0', 11: 'LAB 3.0 · + idle 5.0', 12: 'LAB 3.0 · + idle 6.0', 13: 'LAB 3.0 · ladder', 14: 'LAB 4.0 · real strokes', 15: 'LAB 4.0 · real strokes 2', 16: 'LAB 4.0 · real 3 · layer 1', 17: 'LAB 4.0 · real 3 · layer 2', 18: 'LAB 4.0 · dry test' })[S.sheet];

function outOfReach(P) {
  const R = reach(), B = P.bounds;
  return B.x0 < R.x.min || B.x1 > R.x.max || B.y0 < R.y.min || B.y1 > R.y.max ? `past the walls: X ${B.x0.toFixed(0)} … ${B.x1.toFixed(0)}, Y ${B.y0.toFixed(0)} … ${B.y1.toFixed(0)} mm` : '';
}
// the stage's mm → its SVG: X up, Y right, as every tab
function geom() {
  const { w, h } = labSize(S.sheet), m = 16;
  return { w, h, m, W: w + 2 * m, H: h + 2 * m + LAB.rowGap, X: q => (q.y - S.y0 + m).toFixed(1), Y: q => (S.x0 + h + LAB.rowGap - q.x + m).toFixed(1) };
}
const HUE = { markElbow: '#8A5A00', markWrist: '#8A5A00', today: '#D8453B', shallow: '#D8453B', snake: '#D8453B', along: '#3E8E5A', comp: '#2B6CB0', wrist: '#7B3FA0' };
const hueOf = q => q.hue || HUE[q.kind] || '#D8453B';
// a number picked in the list (the owner, 2026-11-08, of FORM-G's list, for-lab2.png: "the paints' selection, so that I study and get ready where which paint goes"): its strokes alone, the rest veiled
let SEL = null, PLAY = null, RESULT = false;
// Result (the owner, 2026-11-08: "a result key, to see the whole result of the two passes"): real 3's first layer and its second coats over it, every coat a film about
// COAT of the paint's own colour (est.), so a jar of two coats comes out deeper; the idle runs not drawn. A view of the plan, not a measurement.
const COAT = 0.72, hasResult = () => S.sheet === 16 || S.sheet === 17;
function draw() {
  const P = plan(), { w, h, m, W, H, X, Y } = geom(), sel = P.strokes.some(q => q.n === SEL) ? SEL : null;
  const one = q => {
    const c = hueOf(q), o = q.tip[0], up = q.kind === 'along', thin = q.kind === 'cell' || q.kind === 'oneway', on = q.n === sel, dim = sel && !on ? .07 : 1;
    const line = (l, col, wd, op) => `<line x1="${X(l[0])}" y1="${Y(l[0])}" x2="${X(l[1])}" y2="${Y(l[1])}" stroke="${col}" stroke-width="${wd}" stroke-linecap="round" opacity="${op}"/>`;
    const wd = q.wide ? 4.6 : 1.6 * (on ? 1.6 : 1);
    // a wide (real) number is one film of its jar: its lines drawn whole inside a group that holds the opacity, so where the same brush goes twice (back to the
    // leg's start, the lap after a dip, a corner) it is not drawn darker (the owner, 2026-11-09: "black strokes on the lamp, and we have no black run")
    const shape = q.lines ? (on ? q.lines.map(l => line(l, '#24221F', wd + .9, 1)).join('') : '') + (q.wide ? `<g opacity="${(hasResult() ? COAT : .92) * dim}">${q.lines.map(l => line(l, c, wd, 1)).join('')}</g>` : q.lines.map(l => line(l, c, wd, .8 * dim)).join(''))   // picked: a dark rim under it, a light jar seen on the white; real 3's layer one coat, a film as Result's (else layer 1 drew as deep as the two together)
      : q.tip.length < 2 ? `<circle cx="${X(o)}" cy="${Y(o)}" r="3" fill="${c}" opacity="${dim}"/>` : `<polyline points="${q.tip.map(p => `${X(p)},${Y(p)}`).join(' ')}" fill="none" stroke="${c}" stroke-width="${thin ? 1.6 : 5}" stroke-linecap="round" stroke-linejoin="round" opacity="${(thin ? .8 : .55) * dim}"/>`;
    const idle = q.idleTip && !(sel && !on) ? `<polyline points="${q.idleTip.map(p => `${X(p)},${Y(p)}`).join(' ')}" fill="none" stroke="#E8751A" stroke-width=".8" stroke-linejoin="round"/>` : '';   // the idle run, off the first's line
    const num = sel && !on ? '' : `<text x="${(+X(o) + (up ? -13 : q.wide ? -1 : -3)).toFixed(1)}" y="${(+Y(o) + (up ? 2 : q.wide ? -3 : -6)).toFixed(1)}" font-size="${q.wide ? (on ? 5 : 3.6) : 8}" font-weight="700" fill="currentColor"${q.wide ? ' stroke="#fff" stroke-width=".8" paint-order="stroke"' : ''}>${q.n}</text>`;
    return `${shape}${idle}${num}`;
  };
  const order = sel ? [...P.strokes.filter(q => q.n !== sel), ...P.strokes.filter(q => q.n === sel)] : P.strokes;   // the picked one on top
  const result = RESULT && hasResult() && !PLAY, hueSel = sel && P.strokes.find(x => x.n === sel)?.hue;
  const coats = () => [16, 17].flatMap(n => planOf(n).strokes).map(q => `<g opacity="${hueSel && q.hue !== hueSel ? .05 : COAT}">${q.lines.map(l => `<line x1="${X(l[0])}" y1="${Y(l[0])}" x2="${X(l[1])}" y2="${Y(l[1])}" stroke="${q.hue}" stroke-width="4.6" stroke-linecap="round"/>`).join('')}</g>`).join('');   // a coat a jar a layer, one film each
  $('#stage').innerHTML = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:100%;display:block;background:#fff;color:#24221F" role="img" aria-label="The sheet of trial strokes">
    <rect x="${m}" y="${m}" width="${w}" height="${h + LAB.rowGap}" fill="none" stroke="#C9C5BD" stroke-dasharray="3 3"/>
    <text x="${m}" y="${H - 3}" font-size="7" fill="#8A857C">${result ? `Result · the two layers, a coat ≈ ${Math.round(COAT * 100)} % (est.) · X ${S.x0}, Y ${S.y0}` : `X ${S.x0}, Y ${S.y0} · ${w} × ${h + LAB.rowGap} mm · X up, Y right`}</text>${PLAY ? '<g id="playG"></g><circle id="playTip" r="2.2" fill="none" stroke-width=".9" visibility="hidden"/>' : result ? coats() : order.map(one).join('')}</svg>`;
  $('#list').innerHTML = P.strokes.map(q => `<li value="${q.n}" data-n="${q.n}"${q.n === sel ? ' class="on"' : ''}>${q.wide ? `<span class="sw" style="background:${q.hue}"></span>` : ''}${q.say}</li>`).join('');
  // Start from (as FORM-G's): every number of the sheet, its jar's name where it has one; the numbers before it shown in the list as left out
  const fromEl = $('#fFrom'); S.from = Math.min(Math.max(1, S.from || 1), P.strokes.length);
  fromEl.innerHTML = P.strokes.map(x => `<option value="${x.n}"${x.n === S.from ? ' selected' : ''}>${x.n} · ${x.jar ? x.jar.replace(/ #\w+$/, '') : x.say.split(':')[0].slice(0, 48)}</option>`).join('');
  fromEl.disabled = S.sheet < 2; fromEl.classList.toggle('on', S.from > 1);
  document.querySelectorAll('#list li').forEach(li => li.classList.toggle('before', +li.dataset.n < S.from));
  $('#planRead').textContent = S.sheet >= 2 ? `${P.strokes.length} numbers, ${P.remote.rows.length} runs of the brush, ≈ ${Math.round(P.seconds / 60)} min (est.), then home.` : `${P.strokes.length} strokes, a dip before each, ≈ ${Math.round(P.seconds / 60)} min (est.), then home.`;
  $('#noteRead').textContent = P.note ?? '';
  const q = sel && P.strokes.find(x => x.n === sel), len = q?.lines ? q.lines.reduce((t, [a, b]) => t + Math.hypot(b.x - a.x, b.y - a.y), 0) : 0;
  $('#selRead').textContent = q ? `${q.n}. ${q.jar ?? q.say.split(':')[0]}: where it goes${len ? `, ${(len / 1000).toFixed(2)} m of line` : ''}, the rest veiled. ↑ ↓ the next, the same line or Esc for all.` : P.strokes.length > 1 && !PLAY ? 'A line of the list: its strokes alone on the sheet.' : '';
  document.querySelectorAll('#sheets button').forEach(b => b.classList.toggle('on', +b.dataset.sheet === S.sheet));
  const rb = $('#btnResult'); rb.disabled = !hasResult(); rb.classList.toggle('on', result);
  const bad = outOfReach(P); if (bad) say(bad, true);
}
// anything that changes the sheet stops ▶ Play first: its drawing is of the plan it started with
const redraw = () => PLAY ? playStop() : draw();
$('#list').onclick = e => { const li = e.target.closest('li[data-n]'); if (!li || PLAY) return; SEL = SEL === +li.dataset.n ? null : +li.dataset.n; draw(); };
document.addEventListener('keydown', e => {
  if (e.target.closest('input') || PLAY) return;
  if (e.key === 'Escape' && SEL) { SEL = null; draw(); return; }
  if (!SEL || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
  const ns = plan().strokes.map(q => q.n), k = ns.indexOf(SEL) + (e.key === 'ArrowDown' ? 1 : -1);
  if (k < 0 || k >= ns.length) return;
  e.preventDefault(); SEL = ns[k]; draw(); $(`#list li[data-n="${SEL}"]`)?.scrollIntoView({ block: 'nearest' });
});

// ▶ Play, as FORM-G's and OPM-G's (the owner, 2026-11-08: "and I need a play button as in OPM-G"): the sheet as it will run, number after number, run after run, the brush's tip
// a dot, slow at first, faster as it goes (the clock squared), a minute and a half; the idle runs walked, not drawn, so the % and the time are the run's. A view: it moves nothing.
const PLAY_MS = 90000, NS = 'http://www.w3.org/2000/svg';
function playStop() {
  if (!PLAY) return;
  cancelAnimationFrame(PLAY.raf); clearTimeout(PLAY.end); PLAY = null;
  $('#btnPlay').textContent = '▶ Play'; $('#btnPlay').classList.remove('on'); $('#playRead').textContent = '';
  draw();
}
$('#btnResult').onclick = () => { if (!hasResult() || PLAY) return; RESULT = !RESULT; draw(); };
$('#btnPlay').onclick = () => {
  if (PLAY) return playStop();
  RESULT = false;
  const P = plan(), runs = P.runs ?? P.strokes.map(q => ({ n: q.n, pts: q.tip, idle: false })), byN = Object.fromEntries(P.strokes.map(q => [q.n, q])), list = [];
  let mm = 0;
  for (const r of runs) r.pts.slice(1).forEach((b, i) => { const a = r.pts[i], L = Math.hypot(b.x - a.x, b.y - a.y); if (L > 0) list.push({ a, b, from: mm, to: (mm += L), n: r.n, idle: r.idle }); });
  if (!list.length) return;
  SEL = null;
  const Q = PLAY = { list, mm, i: 0, el: null, n: 0, t0: performance.now(), said: 0 };
  $('#btnPlay').textContent = '■ Stop'; $('#btnPlay').classList.add('on');
  draw();
  const G = geom(), g = $('#playG'), tip = $('#playTip'), nums = P.strokes.map(q => q.n);
  const seg = q => {
    const s = byN[q.n], el = document.createElementNS(NS, 'line');
    for (const [k, v] of Object.entries({ x1: G.X(q.a), y1: G.Y(q.a), x2: G.X(q.a), y2: G.Y(q.a), stroke: hueOf(s), 'stroke-width': s.wide ? 4.6 : 1.6, 'stroke-linecap': 'round', opacity: s.wide ? .92 : .8 })) el.setAttribute(k, v);
    g.appendChild(el); return el;
  };
  const read = (q, u) => {
    const s = byN[q.n], k = nums.indexOf(q.n) + 1, left = Math.max(0, Math.round(P.seconds * (1 - Q.want / Q.mm) / 60));
    $('#playRead').textContent = `▶ ${k} of ${nums.length} · ${s.jar ?? `no. ${q.n}`}${q.idle ? ' · idle run, no dip' : ''} · ${Math.round(100 * Q.want / Q.mm)} % · ≈ ${left} min left (est.)${u === 1 ? ' · done' : ''}`;
  };
  const step = () => {
    if (PLAY !== Q) return;
    const t = performance.now(), u = Math.min(1, (t - Q.t0) / PLAY_MS);
    Q.want = u < 1 ? Q.mm * u * u : Q.mm;
    let q = Q.list[Math.min(Q.i, Q.list.length - 1)], p = q.a;
    while (Q.i < Q.list.length && Q.list[Q.i].from <= Q.want) {
      q = Q.list[Q.i];
      const f = Math.min(1, (Q.want - q.from) / (q.to - q.from));
      p = { x: q.a.x + (q.b.x - q.a.x) * f, y: q.a.y + (q.b.y - q.a.y) * f };
      if (!q.idle) { Q.el ??= seg(q); Q.el.setAttribute('x2', G.X(p)); Q.el.setAttribute('y2', G.Y(p)); }
      if (f < 1) break;
      Q.el = null; Q.i++;
    }
    tip.setAttribute('cx', G.X(p)); tip.setAttribute('cy', G.Y(p)); tip.setAttribute('stroke', q.idle ? '#E8751A' : '#24221F'); tip.setAttribute('visibility', 'visible');
    if (q.n !== Q.n) {                               // the number now, in the list
      Q.n = q.n;
      document.querySelectorAll('#list li.now').forEach(li => li.classList.remove('now'));
      const li = $(`#list li[data-n="${q.n}"]`); if (li) { li.classList.add('now'); li.scrollIntoView({ block: 'nearest' }); }
    }
    if (t - Q.said > 150 || u === 1) { Q.said = t; read(q, u); }
    if (Q.i < Q.list.length) Q.raf = requestAnimationFrame(step); else { tip.setAttribute('visibility', 'hidden'); read(q, 1); Q.end = setTimeout(playStop, 2500); }
  };
  Q.raf = requestAnimationFrame(step);
};
async function loadInk() {
  try { ink = await (await fetch('/ink', { cache: 'no-store' })).json(); } catch { ink = null; }
  redraw();
}
for (const [id, key] of [['#fX', 'x0'], ['#fY', 'y0'], ['#fPress', 'press'], ['#fTracks', 'tracks']]) {
  const el = $(id); el.value = S[key];
  el.onchange = () => { let v = +el.value; if (Number.isFinite(v)) { if (key === 'tracks') v = Math.max(1, Math.min(8, Math.round(v))); S[key] = v; save(); say(''); redraw(); } el.value = S[key]; };
}
$('#sheets').onclick = e => { const b = e.target.closest('[data-sheet]'); if (!b) return; S.sheet = +b.dataset.sheet; S.from = 1; RESULT = false; save(); say(''); redraw(); };   // a sheet picked shows that sheet: Result off (2026-11-09, layer 1 was hidden under it)
$('#fFrom').onchange = e => { S.from = +e.target.value || 1; save(); say(S.from > 1 ? `RUN starts from number ${S.from}: the ones before it left out, its jar in the cup first.` : ''); redraw(); };   // Start from, kept till another sheet is picked
$('#btnHere').onclick = async () => {
  let t = ''; try { t = await (await fetch('/machine/ping', { cache: 'no-store' })).text(); } catch { }
  const m = /^ok P X (-?\d+)(?: край)? Y (-?\d+)/.exec(t);
  if (!m) return say('No place from the board: the axes\' zero, rembrandt.py?', true);
  S.x0 = Math.round(+m[1] / STEPS_PER_MM.x); S.y0 = Math.round(+m[2] / STEPS_PER_MM.y);
  $('#fX').value = S.x0; $('#fY').value = S.y0; save(); say(''); redraw();
};
$('#btnRun').onclick = async () => {
  await loadInk();
  const c = ink ? cupOf(ink) : null;
  if (!c || !c.hand || !c.on) return say('Switch the cup at hand ON on INK-Y first.', true);
  const why = cupProblem(c); if (why) return say(why, true);
  const from = S.sheet >= 2 ? S.from || 1 : 1, P = planOf(S.sheet, from), N = P.strokes.length, bad = outOfReach(P); if (bad) return say(bad, true);
  let st = null; try { st = await (await fetch('/run', { cache: 'no-store' })).json(); } catch { }
  if (!st) return say('No server: start rembrandt.py.', true);
  if (!(st.hand >= 1)) return say('Restart rembrandt.py first.', true);
  if (LIVE.includes(st.state)) return say(`A run is on (${st.state}): not now.`, true);
  const { w, h } = labSize(S.sheet), wr = P.strokes.filter(q => q.kind === 'wrist' || q.kind === 'markWrist').map(q => q.n);
  if (!confirm(`${sheetName()}: ${from > 1 ? `FROM NUMBER ${from} ON, ${N - from + 1} of its ${N} numbers (${from - 1} before it left out)` : `${N} numbers`} on a scrap ${w} × ${h + LAB.rowGap} mm, its bottom left at X ${S.x0}, Y ${S.y0}, ≈ ${Math.round(P.seconds / 60)} min.\n\n${wr.length ? `The wrist turns on strokes ${wr.join(', ')}: the hand on STOP.` : 'The elbow as ever, the carriage against it near the paper: the first strokes, the hand on STOP.'}${S.sheet === 18 ? `\n\nThe yellow, ${P.strokes[0].jar}, in the cup first. After the five yellow bands it stops: wipe the brush, put the red, ${P.strokes.at(-1).jar}, in the cup AT ONCE, then CONTINUE: the bands' clocks run from their painting. Then it waits by itself, the brush parked in the jar, ≈ ${Math.round(P.seconds / 60)} min in all.` : S.sheet >= 16 ? `\n\nThe first jar in the cup: ${P.strokes[from - 1].jar}. It stops before each of the other ${N - from}: wipe the brush, put that jar in the cup, then press CONTINUE on this page.${S.sheet === 17 ? ' Over real 3\'s first layer, dry, at the same place.' : ''}` : P.blocks.some(b => b.kind === 'pause') ? '\n\nIt stops for the second paint: wipe the brush, change the paint, then press CONTINUE on this page.' : ''}\n\nIs the scrap there, the jar on its bracket?`)) return;
  try {
    const r = await fetch('/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blocks: P.blocks,
      log: { page: 'lab', pass: 'lab', label: `${sheetName()} · ${from > 1 ? `from number ${from}, ` : ''}${P.strokes.length} numbers${S.sheet >= 3 && S.sheet < 13 ? `, ${S.tracks} tracks` : ''} at X ${S.x0}, Y ${S.y0} · pressed ${S.press}°`, here: { x: S.x0, y: S.y0 }, cup: c, travel: LAB.travel, remote: P.remote, estimate_s: P.seconds } }) });
    const t = await r.text(); if (r.ok) { S.ran = { sheet: S.sheet, from }; save(); } say(t);
  } catch { say('start rembrandt.py', true); }
};
// HOME (the owner, 2026-11-05: "I go to OPM-N and lead it home from there"): the brush up, the carriage home, as there
$('#btnLabHome').onclick = async () => {
  let st = null; try { st = await (await fetch('/run', { cache: 'no-store' })).json(); } catch { }
  if (!st) return say('No server: start rembrandt.py.', true);
  if (LIVE.includes(st.state)) return say(`A run is on (${st.state}): STOP first.`, true);
  try {
    const r = await fetch('/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blocks: homeBlocks(LAB.travel), log: { page: 'lab', label: 'LAB · HOME', here: { x: S.x0, y: S.y0 } } }) });
    say(await r.text());
  } catch { say('start rembrandt.py', true); }
};
$('#btnStop').onclick = async () => { try { say(await (await fetch('/run/stop', { method: 'POST' })).text()); } catch { say('start rembrandt.py', true); } };
// PAUSE and CONTINUE on the page (the owner, 2026-11-06, the run waiting for its second paint: "I did not even realise where to press"): the key goes orange and says so
let held = false;
$('#btnPause').onclick = async () => { try { say(await (await fetch(held ? '/run/continue' : '/run/pause', { method: 'POST' })).text()); } catch { say('start rembrandt.py', true); } };
function showHold(st) {
  const key = $('#btnPause'), call = $('#labCall'), waits = st?.state === 'paused';
  held = st?.state === 'paused' || st?.state === 'pausing';
  key.disabled = !st || !LIVE.includes(st.state) || st.state === 'stopping';
  key.textContent = held ? '▶ CONTINUE' : 'PAUSE';
  key.classList.toggle('call', waits);
  call.hidden = !(waits && st.message);
  if (!call.hidden) call.textContent = `${st.message.replace(/,? then Continue$/, '')}, then press ▶ CONTINUE below.`;
}
let was = '';
setInterval(async () => {
  let st = null; try { st = await (await fetch('/run', { cache: 'no-store' })).json(); } catch { }
  showHold(st);
  const sent = S.ran ? planOf(S.ran.sheet, S.ran.from) : plan();   // the run's own rows: started from a number, its row 1 is that number's
  const line = !st ? 'no server: start rembrandt.py' : st.state === 'idle' ? '' : `${st.state}${st.row && sent.remote.rows[st.row - 1] ? ` · number ${sent.remote.rows[st.row - 1].cells[0][0]}` : ''}${st.message ? ` · ${st.message}` : ''}`;
  if (line !== was) { was = line; $('#stateRead').textContent = line; }
}, 700);
loadInk();
