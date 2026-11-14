// LAB-H's page (the owner, 2026-11-14: "copy what LAB has and make a separate tab LAB-H so as not to get confused. All those keys of the old LAB we
// do not need in the new one for HOLO"): lab.js's page with HOLO's one sheet (labplan.js, sheetHolo) — where it lies, its jar, its numbers, ▶ Play,
// RUN, PAUSE, STOP, HOME; no other sheet, no tracks, no Start from, no Result. Nothing is kept but where, the press and the jar.
import { LAB, labPlan, SH } from './labplan.js';
import { homeBlocks } from './strokes.js';
import { cupOf, cupProblem } from './ink.js';
import { reach, STEPS_PER_MM } from './machine.js';
import './ui.js';

const $ = s => document.querySelector(s), KEEP = 'rembrandt.labh.v01', LAB_KEEP = 'rembrandt.lab.v01', LIVE = ['running', 'stopping', 'pausing', 'paused'];
const SHEET = 19, NAME = 'LAB-H · HOLO', PIC = 'holo-40-warm';   // the jars of the 40 × 40, the first picture after this sheet (the owner: "first LAB, then the 40 × 40 first")
const S = { x0: 200, y0: 150, press: LAB.press, jar: 'j39' };          // Jar 39: the 40 × 40's shadow of the most dabs (193), a dark on the white
try { const mine = JSON.parse(localStorage.getItem(KEEP) || 'null'); if (mine) Object.assign(S, mine); else { const l = JSON.parse(localStorage.getItem(LAB_KEEP) || '{}'); for (const k of ['x0', 'y0', 'press']) if (Number.isFinite(l[k])) S[k] = l[k]; } } catch { }
const save = () => { try { localStorage.setItem(KEEP, JSON.stringify(S)); } catch { } };
let ink = null, JARS = [{ id: 'j39', name: 'Jar 39', hex: '#5A0D0D', run1_dabs: 0, run2_dabs: 193 }];
const jar = () => JARS.find(j => j.id === S.jar) ?? JARS[0];
const esc = v => String(v ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const say = (t, warn) => { $('#runRead').innerHTML = warn ? `<span class="warn">${t}</span>` : t; };
const fake = () => ({ hand: true, on: true, up: [30, 35], to: [30, 35], dip: 15, paint: [14, 16], dwell: 1, swing: 40 });
const plan = () => labPlan({ x0: S.x0, y0: S.y0, press: S.press, sheet: SHEET, cup: ink ? cupOf(ink) : fake(), jar: { name: jar().name, hex: jar().hex } });

function outOfReach(P) {
  const R = reach(), B = P.bounds;
  return B.x0 < R.x.min || B.x1 > R.x.max || B.y0 < R.y.min || B.y1 > R.y.max ? `past the walls: X ${B.x0.toFixed(0)} … ${B.x1.toFixed(0)}, Y ${B.y0.toFixed(0)} … ${B.y1.toFixed(0)} mm` : '';
}
// the stage's mm → its SVG: X up, Y right, as every tab; the scrap 200 × 200
function geom() {
  const w = SH.size, h = SH.size, m = 16;
  return { w, h, m, W: w + 2 * m, H: h + 2 * m, X: q => (q.y - S.y0 + m).toFixed(1), Y: q => (S.x0 + h - q.x + m).toFixed(1) };
}
// a dab solid, as wide as the tip and its 8 mm; a stroke from a puddle a thin line of the brush's way — how much paint it leaves is what the sheet measures
let SEL = null, PLAY = null;
function draw() {
  const P = plan(), { w, h, m, W, H, X, Y } = geom(), sel = P.strokes.some(q => q.n === SEL) ? SEL : null;
  const ln = (a, b, col, wd, op, cap = 'round') => `<line x1="${X(a)}" y1="${Y(a)}" x2="${X(b)}" y2="${Y(b)}" stroke="${col}" stroke-width="${wd}" stroke-linecap="${cap}" opacity="${op}"/>`;
  const one = q => {
    const on = q.n === sel, dim = sel && !on ? .08 : 1, c = q.hue;
    const runs = q.holo.map(r => r.dab ? ln(r.pts[0], r.pts.at(-1), c, 5, .92 * dim) : ln(r.pts[0], r.pts.at(-1), c, on ? 2 : 1.2, .55 * dim, 'butt')).join('');
    const rim = on ? q.holo.filter(r => r.dab).map(r => ln(r.pts[0], r.pts.at(-1), '#24221F', 6.2, 1)).join('') : '';
    const o = q.holo[0].pts[0], num = sel && !on ? '' : `<text x="${(+X(o) + 3.4).toFixed(1)}" y="${(+Y(o) + 1.2).toFixed(1)}" font-size="${on ? 4.6 : 3.6}" font-weight="700" fill="currentColor" stroke="#fff" stroke-width=".6" paint-order="stroke">${q.n}</text>${q.age ? `<text x="${(+X(o) + 3.4).toFixed(1)}" y="${(+Y(o) + 5.4).toFixed(1)}" font-size="3.2" fill="#8A857C">${q.age}′</text>` : ''}`;   // D's its age under it
    return `${rim}${runs}${num}`;
  };
  const order = sel ? [...P.strokes.filter(q => q.n !== sel), ...P.strokes.filter(q => q.n === sel)] : P.strokes;
  // the four parts named over their columns, A at the foot
  const cap = (txt, y, x) => `<text x="${(y + m).toFixed(1)}" y="${(h - x + m).toFixed(1)}" font-size="4" font-weight="700" letter-spacing=".3" fill="#8A857C">${txt}</text>`;
  const caps = cap('A · A DAB', SH.cols.A[0] - 3, 2.5) + cap('B · HOW FAR', SH.cols.B[0] - 3, 197.5) + cap('C · RUN 1', SH.cols.C[0] + 6, SH.foot + 2) + cap('D · OPEN TIME', SH.cols.D[0] - 3, 197.5);
  $('#stage').innerHTML = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:100%;display:block;background:#fff;color:#24221F" role="img" aria-label="HOLO's LAB sheet">
    <rect x="${m}" y="${m}" width="${w}" height="${h}" fill="none" stroke="#C9C5BD" stroke-dasharray="3 3"/>
    <text x="${m}" y="${H - 5}" font-size="4" fill="#8A857C">X ${S.x0}, Y ${S.y0} · ${w} × ${h} mm · X up, Y right · ${esc(jar().name)}</text>${caps}${PLAY ? '<g id="playG"></g><circle id="playTip" r="2.2" fill="none" stroke-width=".9" visibility="hidden"/>' : order.map(one).join('')}</svg>`;
  $('#list').innerHTML = P.strokes.map(q => `<li value="${q.n}" data-n="${q.n}"${q.n === sel ? ' class="on"' : ''}>${esc(q.say)}</li>`).join('');
  const dabs = P.runs.filter(r => r.dip).length;
  $('#planRead').textContent = `${P.strokes.length} numbers, ${P.remote.rows.length} runs of the brush, ${dabs} dabs, one jar, no pause; ≈ ${Math.round(P.seconds / 60)} min (est.), then home.`;
  $('#noteRead').textContent = 'Tell me: A, every puddle\'s length and width — the same 8 mm or end to end; B, from the puddle, mm laid full, then mm till it gives out; C, an even leg or a bead at every puddle; D, the age at which the stroke no longer takes its puddle (it sets the batch). The D clock runs by itself from number 13: no PAUSE then, if it can be helped.';
  const q = sel && P.strokes.find(x => x.n === sel);
  $('#selRead').textContent = q ? `${q.n}. ${q.say.split(':')[0]}: its strokes alone, the rest veiled. ↑ ↓ the next, the same line or Esc for all.` : !PLAY ? 'A line of the list: its strokes alone on the sheet.' : '';
  const bad = outOfReach(P); if (bad) say(bad, true);
}
const redraw = () => PLAY ? playStop() : draw();
$('#list').onclick = e => { const li = e.target.closest('li[data-n]'); if (!li || PLAY) return; SEL = SEL === +li.dataset.n ? null : +li.dataset.n; draw(); };
document.addEventListener('keydown', e => {
  if (e.target.closest('input, select') || PLAY) return;
  if (e.key === 'Escape' && SEL) { SEL = null; draw(); return; }
  if (!SEL || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
  const ns = plan().strokes.map(q => q.n), k = ns.indexOf(SEL) + (e.key === 'ArrowDown' ? 1 : -1);
  if (k < 0 || k >= ns.length) return;
  e.preventDefault(); SEL = ns[k]; draw(); $(`#list li[data-n="${SEL}"]`)?.scrollIntoView({ block: 'nearest' });
});

// ▶ Play, LAB's: the sheet as it will run, number after number, run after run, the brush's tip a dot, slow at first, faster as it goes (the clock squared),
// a minute and a half; the parks in the jar not walked. A view: it moves nothing
const PLAY_MS = 90000, NS = 'http://www.w3.org/2000/svg';
function playStop() {
  if (!PLAY) return;
  cancelAnimationFrame(PLAY.raf); clearTimeout(PLAY.end); PLAY = null;
  $('#btnPlay').textContent = '▶ Play'; $('#btnPlay').classList.remove('on'); $('#playRead').textContent = '';
  draw();
}
$('#btnPlay').onclick = () => {
  if (PLAY) return playStop();
  const P = plan(), byN = Object.fromEntries(P.strokes.map(q => [q.n, q])), list = [];
  let mm = 0;
  for (const r of P.runs) r.pts.slice(1).forEach((b, i) => { const a = r.pts[i], L = Math.hypot(b.x - a.x, b.y - a.y); if (L > 0) list.push({ a, b, from: mm, to: (mm += L), n: r.n, dab: r.dip }); });
  if (!list.length) return;
  SEL = null;
  const Q = PLAY = { list, mm, i: 0, el: null, n: 0, t0: performance.now(), said: 0 };
  $('#btnPlay').textContent = '■ Stop'; $('#btnPlay').classList.add('on');
  draw();
  const G = geom(), g = $('#playG'), tip = $('#playTip'), nums = P.strokes.map(q => q.n);
  const seg = q => {
    const el = document.createElementNS(NS, 'line');
    for (const [k, v] of Object.entries({ x1: G.X(q.a), y1: G.Y(q.a), x2: G.X(q.a), y2: G.Y(q.a), stroke: byN[q.n].hue, 'stroke-width': q.dab ? 5 : 1.2, 'stroke-linecap': q.dab ? 'round' : 'butt', opacity: q.dab ? .92 : .55 })) el.setAttribute(k, v);
    g.appendChild(el); return el;
  };
  const read = (q, u) => {
    const k = nums.indexOf(q.n) + 1, left = Math.max(0, Math.round(P.seconds * (1 - Q.want / Q.mm) / 60));
    $('#playRead').textContent = `▶ ${k} of ${nums.length} · ${byN[q.n].say.split(':')[0]}${q.dab ? ' · a dab' : ' · the stroke, no dip'} · ${Math.round(100 * Q.want / Q.mm)} % · ≈ ${left} min left (est.)${u === 1 ? ' · done' : ''}`;
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
      Q.el ??= seg(q); Q.el.setAttribute('x2', G.X(p)); Q.el.setAttribute('y2', G.Y(p));
      if (f < 1) break;
      Q.el = null; Q.i++;
    }
    tip.setAttribute('cx', G.X(p)); tip.setAttribute('cy', G.Y(p)); tip.setAttribute('stroke', q.dab ? '#E8751A' : '#24221F'); tip.setAttribute('visibility', 'visible');
    if (q.n !== Q.n) {
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
for (const [id, key] of [['#fX', 'x0'], ['#fY', 'y0'], ['#fPress', 'press']]) {
  const el = $(id); el.value = S[key];
  el.onchange = () => { const v = +el.value; if (Number.isFinite(v) && el.value !== '') { S[key] = v; save(); say(''); redraw(); } el.value = S[key]; };
}
$('#fJar').onchange = e => { S.jar = e.target.value; save(); say(''); redraw(); };
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
  const P = plan(), bad = outOfReach(P); if (bad) return say(bad, true);
  let st = null; try { st = await (await fetch('/run', { cache: 'no-store' })).json(); } catch { }
  if (!st) return say('No server: start rembrandt.py.', true);
  if (!(st.hand >= 1)) return say('Restart rembrandt.py first.', true);
  if (LIVE.includes(st.state)) return say(`A run is on (${st.state}): not now.`, true);
  const J = jar(), dabs = P.runs.filter(r => r.dip).length;
  if (!confirm(`${NAME}: ${P.strokes.length} numbers, ${dabs} dabs, on a scrap ${SH.size} × ${SH.size} mm, its bottom left at X ${S.x0}, Y ${S.y0}, ≈ ${Math.round(P.seconds / 60)} min.\n\nOne jar the whole sheet, no pause: ${J.name} in the cup now.\n\nFrom number 13 on the open time's clock runs: four puddles laid 30, 20, 10, 5 min before their strokes at the end, the brush waiting in the jar by itself between them — no PAUSE then, if it can be helped: it makes every age older.\n\nThe first strokes, the hand on STOP. Is the scrap there, the jar on its bracket?`)) return;
  try {
    const r = await fetch('/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blocks: P.blocks,
      log: { page: 'lab', tab: 'labh', pass: 'lab', label: `${NAME} · ${J.name} · ${P.strokes.length} numbers at X ${S.x0}, Y ${S.y0} · pressed ${S.press}°`, here: { x: S.x0, y: S.y0 }, cup: c, travel: LAB.travel, remote: P.remote, estimate_s: P.seconds } }) });
    say(await r.text());
  } catch { say('start rembrandt.py', true); }
};
// HOME, LAB's: the brush up, the carriage home
$('#btnLabHome').onclick = async () => {
  let st = null; try { st = await (await fetch('/run', { cache: 'no-store' })).json(); } catch { }
  if (!st) return say('No server: start rembrandt.py.', true);
  if (LIVE.includes(st.state)) return say(`A run is on (${st.state}): STOP first.`, true);
  try {
    const r = await fetch('/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blocks: homeBlocks(LAB.travel), log: { page: 'lab', tab: 'labh', label: `${NAME} · HOME`, here: { x: S.x0, y: S.y0 } } }) });
    say(await r.text());
  } catch { say('start rembrandt.py', true); }
};
$('#btnStop').onclick = async () => { try { say(await (await fetch('/run/stop', { method: 'POST' })).text()); } catch { say('start rembrandt.py', true); } };
// PAUSE and CONTINUE on the page, LAB's: the key goes orange and says so
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
  const P = plan(), row = st?.row ? P.remote.rows[st.row - 1] : null;
  const line = !st ? 'no server: start rembrandt.py' : st.state === 'idle' ? '' : `${st.state}${row ? ` · number ${row.cells[0][0]}` : ''}${st.message ? ` · ${st.message}` : ''}`;
  if (line !== was) { was = line; $('#stateRead').textContent = line; }
}, 700);

// the jars of the 40 × 40, light to dark, the run each is in
(async () => {
  try { const p = await (await fetch(`holo/${PIC}.json`, { cache: 'no-store' })).json(); if (p.jars?.length) JARS = p.jars; } catch { }
  if (!JARS.some(j => j.id === S.jar)) S.jar = JARS.find(j => j.id === 'j39')?.id ?? JARS[0].id;
  $('#fJar').innerHTML = JARS.map(j => `<option value="${esc(j.id)}">${esc(j.name.replace('New · ', ''))} · ${j.run1_dabs ? 'run 1' : 'run 2'}</option>`).join('');
  $('#fJar').value = S.jar;
  loadInk();
})();
