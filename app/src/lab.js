// LAB's page: where the sheet lies, its strokes numbered, RUN and STOP (labplan.js). Nothing is kept but where.
import { LAB, labPlan, labSize } from './labplan.js';
import { homeBlocks } from './strokes.js';
import { cupOf, cupProblem } from './ink.js';
import { reach, STEPS_PER_MM } from './machine.js';
import './ui.js';

const $ = s => document.querySelector(s), KEEP = 'rembrandt.lab.v01', LIVE = ['running', 'stopping', 'pausing', 'paused'];
const S = { x0: 200, y0: 150, press: LAB.press, sheet: 12, tracks: 4 };
try { Object.assign(S, JSON.parse(localStorage.getItem(KEEP) || '{}')); } catch { }
S.sheet = 12;                                // the sheet to run next, at every opening
const save = () => { try { localStorage.setItem(KEEP, JSON.stringify(S)); } catch { } };
let ink = null;
const say = (t, warn) => { $('#runRead').innerHTML = warn ? `<span class="warn">${t}</span>` : t; };
const fake = () => ({ hand: true, on: true, up: [30, 35], to: [30, 35], dip: 15, paint: [14, 16], dwell: 1, swing: 40 });
const plan = () => labPlan({ x0: S.x0, y0: S.y0, press: S.press, sheet: S.sheet, tracks: S.tracks, cup: ink ? cupOf(ink) : fake() });
const sheetName = () => ({ 1: 'LAB', 2: 'LAB 2.0', 3: 'LAB 3.0', 4: 'LAB 3.0 · long', 5: 'LAB 3.0 · seam', 6: 'LAB 3.0 · long snake', 7: 'LAB 3.0 · snake + idle', 8: 'LAB 3.0 · + idle 2.0', 9: 'LAB 3.0 · + idle 3.0', 10: 'LAB 3.0 · + idle 4.0', 11: 'LAB 3.0 · + idle 5.0', 12: 'LAB 3.0 · + idle 6.0' })[S.sheet];

function outOfReach(P) {
  const R = reach(), B = P.bounds;
  return B.x0 < R.x.min || B.x1 > R.x.max || B.y0 < R.y.min || B.y1 > R.y.max ? `past the walls: X ${B.x0.toFixed(0)} … ${B.x1.toFixed(0)}, Y ${B.y0.toFixed(0)} … ${B.y1.toFixed(0)} mm` : '';
}
function draw() {
  const P = plan(), { w, h } = labSize(S.sheet), m = 16, W = w + 2 * m, H = h + 2 * m + LAB.rowGap;
  const X = q => (q.y - S.y0 + m).toFixed(1), Y = q => (S.x0 + h + LAB.rowGap - q.x + m).toFixed(1);
  const hue = { markElbow: '#8A5A00', markWrist: '#8A5A00', today: '#D8453B', shallow: '#D8453B', snake: '#D8453B', along: '#3E8E5A', comp: '#2B6CB0', wrist: '#7B3FA0' };
  const lines = P.strokes.map(q => {
    const c = q.hue || hue[q.kind] || '#D8453B', o = q.tip[0], up = q.kind === 'along', thin = q.kind === 'cell' || q.kind === 'oneway';
    const shape = q.lines ? q.lines.map(l => `<line x1="${X(l[0])}" y1="${Y(l[0])}" x2="${X(l[1])}" y2="${Y(l[1])}" stroke="${c}" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>`).join('') : q.tip.length < 2 ? `<circle cx="${X(o)}" cy="${Y(o)}" r="3" fill="${c}"/>` : `<polyline points="${q.tip.map(p => `${X(p)},${Y(p)}`).join(' ')}" fill="none" stroke="${c}" stroke-width="${thin ? 1.6 : 5}" stroke-linecap="round" stroke-linejoin="round" opacity="${thin ? .8 : .55}"/>`;
    const idle = q.idleTip ? `<polyline points="${q.idleTip.map(p => `${X(p)},${Y(p)}`).join(' ')}" fill="none" stroke="#E8751A" stroke-width=".8" stroke-linejoin="round"/>` : '';   // the idle run, off the first's line
    return `${shape}${idle}<text x="${(+X(o) + (up ? -13 : -3)).toFixed(1)}" y="${(+Y(o) + (up ? 2 : -6)).toFixed(1)}" font-size="8" font-weight="700" fill="currentColor">${q.n}</text>`;
  }).join('');
  $('#stage').innerHTML = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:100%;display:block;background:#fff;color:#24221F" role="img" aria-label="The sheet of trial strokes">
    <rect x="${m}" y="${m}" width="${w}" height="${h + LAB.rowGap}" fill="none" stroke="#C9C5BD" stroke-dasharray="3 3"/>
    <text x="${m}" y="${H - 3}" font-size="7" fill="#8A857C">X ${S.x0}, Y ${S.y0} · ${w} × ${h + LAB.rowGap} mm · X up, Y right</text>${lines}</svg>`;
  $('#list').innerHTML = P.strokes.map(q => `<li value="${q.n}">${q.say}</li>`).join('');
  $('#planRead').textContent = S.sheet >= 2 ? `${P.strokes.length} numbers, ${P.remote.rows.length} runs of the brush, ≈ ${Math.round(P.seconds / 60)} min (est.), then home.` : `${P.strokes.length} strokes, a dip before each, ≈ ${Math.round(P.seconds / 60)} min (est.), then home.`;
  document.querySelectorAll('#sheets button').forEach(b => b.classList.toggle('on', +b.dataset.sheet === S.sheet));
  const bad = outOfReach(P); if (bad) say(bad, true);
}
async function loadInk() {
  try { ink = await (await fetch('/ink', { cache: 'no-store' })).json(); } catch { ink = null; }
  draw();
}
for (const [id, key] of [['#fX', 'x0'], ['#fY', 'y0'], ['#fPress', 'press'], ['#fTracks', 'tracks']]) {
  const el = $(id); el.value = S[key];
  el.onchange = () => { let v = +el.value; if (Number.isFinite(v)) { if (key === 'tracks') v = Math.max(1, Math.min(8, Math.round(v))); S[key] = v; save(); say(''); draw(); } el.value = S[key]; };
}
$('#sheets').onclick = e => { const b = e.target.closest('[data-sheet]'); if (!b) return; S.sheet = +b.dataset.sheet; save(); say(''); draw(); };
$('#btnHere').onclick = async () => {
  let t = ''; try { t = await (await fetch('/machine/ping', { cache: 'no-store' })).text(); } catch { }
  const m = /^ok P X (-?\d+)(?: край)? Y (-?\d+)/.exec(t);
  if (!m) return say('No place from the board: the axes\' zero, rembrandt.py?', true);
  S.x0 = Math.round(+m[1] / STEPS_PER_MM.x); S.y0 = Math.round(+m[2] / STEPS_PER_MM.y);
  $('#fX').value = S.x0; $('#fY').value = S.y0; save(); say(''); draw();
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
  const { w, h } = labSize(S.sheet), wr = P.strokes.filter(q => q.kind === 'wrist' || q.kind === 'markWrist').map(q => q.n);
  if (!confirm(`${sheetName()}: ${P.strokes.length} numbers on a scrap ${w} × ${h + LAB.rowGap} mm, its bottom left at X ${S.x0}, Y ${S.y0}, ≈ ${Math.round(P.seconds / 60)} min.\n\n${wr.length ? `The wrist turns on strokes ${wr.join(', ')}: the hand on STOP.` : 'The elbow as ever, the carriage against it near the paper: the first strokes, the hand on STOP.'}\n\nIs the scrap there, the jar on its bracket?`)) return;
  try {
    const r = await fetch('/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blocks: P.blocks,
      log: { page: 'lab', pass: 'lab', label: `${sheetName()} · ${P.strokes.length} numbers${S.sheet >= 3 ? `, ${S.tracks} tracks` : ''} at X ${S.x0}, Y ${S.y0} · pressed ${S.press}°`, here: { x: S.x0, y: S.y0 }, cup: c, travel: LAB.travel, remote: P.remote, estimate_s: P.seconds } }) });
    say(await r.text());
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
let was = '';
setInterval(async () => {
  let st = null; try { st = await (await fetch('/run', { cache: 'no-store' })).json(); } catch { }
  const line = !st ? 'no server: start rembrandt.py' : st.state === 'idle' ? '' : `${st.state}${st.row && plan().remote.rows[st.row - 1] ? ` · number ${plan().remote.rows[st.row - 1].cells[0][0]}` : ''}${st.message ? ` · ${st.message}` : ''}`;
  if (line !== was) { was = line; $('#stateRead').textContent = line; }
}, 700);
loadInk();
