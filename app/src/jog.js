// The jog of the Calibration tab for a page that needs the carriage moved by
// hand: the Ink tab (the owner, 2026-10-03: "what do I move the machine with?
// add me the sliders from Calibration"). A copy of calibration.js's jog
// (RUBENS a143fbc), which keeps its own.
//
// X and Y like a throttle, the pendant's rule: the slider stays where it is
// put, 10 mm/s a level. The elbow moves when its handle is let go, 1° a
// step, in RUBENS's degrees from the working pose (rembrandt.py, class Arm):
// 0° pressed, off the canvas at +10°, −5…+45°. STOP and HARD STOP stop the
// axes and the arm; Esc is STOP; a page hidden or left stops the axes. The
// ping, five times a second, feeds the board's watchdog and brings the
// carriage's place.

import { fmt } from './util.js';
import { parsePing, toMm } from './machine.js';

const label = v => v ? `${v > 0 ? '+' : '−'}${Math.abs(v)} · ${Math.abs(v) * 10} mm/s` : 'IDLE';
const signed = v => (v > 0 ? '+' : v < 0 ? '−' : '') + fmt(Math.abs(v)) + '°';
// Signed scales like the pendant: a tick a level, a number every `every`.
function ticks(lo, hi, step, every) {
  let h = '';
  for (let v = lo; v <= hi; v += step) {
    const left = `calc(9px + (100% - 18px) * ${(v - lo) / (hi - lo)})`;
    const lab = v % every === 0 || v === lo || v === hi ? `<span>${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v)}</span>` : '';
    h += `<i class="${lab ? 'major' : ''}" style="left:${left}">${lab}</i>`;
  }
  return `<div class="ticks">${h}</div>`;
}
const ELBOW = { lo: -5, hi: 45 };

// Into el: the X and Y handles, the elbow's, STOP and HARD STOP. link: the
// header's machine light. onPing(state) after every ping.
export function mountJog(el, { link, onPing = () => { } } = {}) {
  el.innerHTML = `
    <div class="axis" data-ax="x">
      <div class="axis-head"><span class="k">X</span><span class="pos" data-pos="x">—</span><span class="speed" data-v="x">IDLE</span></div>
      <div class="dir">↑ top of the picture · carriage, from the bottom wall</div>
      <input class="jog-slider" data-jog="x" type="range" min="-20" max="20" step="1" value="0" aria-label="X level">
      ${ticks(-20, 20, 1, 5)}
    </div>
    <div class="axis" data-ax="y">
      <div class="axis-head"><span class="k">Y</span><span class="pos" data-pos="y">—</span><span class="speed" data-v="y">IDLE</span></div>
      <div class="dir">→ right, from the left wall</div>
      <input class="jog-slider" data-jog="y" type="range" min="-9" max="9" step="1" value="0" aria-label="Y level">
      ${ticks(-9, 9, 1, 1)}
    </div>
    <div class="axis servo" data-ax="elbow">
      <div class="axis-head"><span class="k">ELBOW</span><span class="pos" data-pos="elbow">—</span><span class="speed" data-v="elbow"></span></div>
      <div class="dir">0°: the brush pressed to the canvas · plus: up, off the canvas at +10° · −5…0°: the reserve</div>
      <input class="jog-slider" data-arm="elbow" type="range" min="${ELBOW.lo}" max="${ELBOW.hi}" step="1" value="0" aria-label="Elbow, degrees">
      ${ticks(ELBOW.lo, ELBOW.hi, 5, 15)}
    </div>
    <p class="read" data-note></p>
    <div class="stops">
      <button class="btn" data-stop title="Stop both axes, braking, and the arm (Esc)">STOP</button>
      <button class="btn danger" data-kill title="Stop both axes at once, no braking, and the arm">HARD STOP</button>
    </div>`;
  const q = s => el.querySelector(s);
  const S = { link: 'wait', pos: { x: null, y: null }, edge: { x: false, y: false }, elbow: null };

  async function machine(cmd) {
    try {
      const r = await fetch('/machine' + cmd, { cache: 'no-store' });
      S.link = r.status === 404 ? 'server' : r.headers.get('X-Board') === 'lost' || !r.ok ? 'lost' : 'ok';
      return r.ok ? await r.text() : null;
    } catch { S.link = 'server'; return null; }
  }

  // ---------- X and Y ----------
  const JOG = { x: { level: 0 }, y: { level: 0 } };
  const show = (a, html, live) => { q(`[data-v="${a}"]`).innerHTML = html; q(`[data-ax="${a}"]`).classList.toggle('live', live); };
  for (const a of ['x', 'y']) {
    const input = q(`[data-jog="${a}"]`);
    input.addEventListener('input', () => {
      const v = +input.value;
      if (v === JOG[a].level) return;
      JOG[a].level = v;
      show(a, label(v), v !== 0);
      machine(`/cmd?a=${a.toUpperCase()}&n=${v}`).then(t => { if (t && /^край/.test(t)) atEdge(a); });
    });
  }
  // at a wall the board stops the axis itself; the screen must not say it moves
  function atEdge(a) {
    if (JOG[a].level === 0) return;
    JOG[a].level = 0; q(`[data-jog="${a}"]`).value = 0; show(a, '<span class="warn">EDGE</span>', false);
  }
  function idle() { for (const a of ['x', 'y']) { JOG[a].level = 0; q(`[data-jog="${a}"]`).value = 0; show(a, 'IDLE', false); } }
  const moving = () => JOG.x.level !== 0 || JOG.y.level !== 0;
  const holdArm = () => fetch('/arm/hold', { method: 'POST' }).catch(() => null);
  function stop() { idle(); machine('/cmd?a=S&n=0'); holdArm(); }
  q('[data-stop]').onclick = stop;
  q('[data-kill]').onclick = () => { idle(); machine('/cmd?a=K&n=0'); holdArm(); };
  addEventListener('keydown', e => { if (e.key === 'Escape') stop(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && moving()) stop(); });
  addEventListener('pagehide', () => { if (moving()) fetch('/machine/cmd?a=S&n=0', { keepalive: true }); });

  // ---------- the place ----------
  let pinging = false;
  async function ping() {
    if (pinging) return;
    pinging = true;
    const p = parsePing(await machine('/ping'));
    pinging = false;
    if (p) {
      S.pos = { x: p.x === null ? null : toMm('x', p.x), y: p.y === null ? null : toMm('y', p.y) };
      S.edge = { x: p.edgeX, y: p.edgeY };
      if (p.edgeX) atEdge('x');
      if (p.edgeY) atEdge('y');
    } else S.pos = { x: null, y: null };
    for (const a of ['x', 'y']) {
      const e = q(`[data-pos="${a}"]`), v = S.pos[a];
      e.className = 'pos' + (v === null ? ' none' : '');
      e.textContent = v === null ? (S.link === 'ok' ? 'NO ZERO' : '—') : (v < 0 && fmt(Math.abs(v)) !== '0.0' ? '−' : '') + fmt(Math.abs(v)) + ' mm' + (S.edge[a] ? ' · EDGE' : '');
    }
    q('[data-note]').innerHTML = S.link === 'ok' && (S.pos.x === null || S.pos.y === null)
      ? '<span class="warn">No zero: home and Set home on Calibration first.</span>' : '';
    if (link) {
      link.textContent = { ok: '● MACHINE', lost: 'NO BOARD · USB and 12 V?', server: 'NO SERVER · start rembrandt.py', wait: '…' }[S.link];
      link.className = 'link-state ' + (S.link === 'ok' ? 'ok' : 'bad');
    }
    onPing(S);
  }

  // ---------- the elbow ----------
  const arm = q('[data-arm="elbow"]');
  let busy = false;
  async function look() {
    if (busy) return S.elbow;
    let a = null;
    try { const r = await fetch('/arm', { cache: 'no-store' }); if (r.ok) a = (await r.json()).angles; } catch { }
    S.elbow = a?.elbow ?? null;
    const e = q('[data-pos="elbow"]');
    e.textContent = S.elbow === null ? '—' : signed(S.elbow);
    e.className = 'pos' + (S.elbow === null ? ' none' : '');
    // the handle shows where the joint is, unless it is being held
    if (S.elbow !== null && document.activeElement !== arm) arm.value = Math.max(ELBOW.lo, Math.min(ELBOW.hi, Math.round(S.elbow)));
    return S.elbow;
  }
  arm.addEventListener('change', async () => {
    const d = +arm.value, ax = q('[data-ax="elbow"]'), out = q('[data-v="elbow"]');
    busy = true; ax.classList.add('busy'); out.textContent = `→ ${signed(d)}`;
    let msg = '';
    try {
      const r = await fetch(`/arm?j=elbow&d=${d}`, { method: 'POST' }), t = await r.text();
      let o; try { o = JSON.parse(t); } catch { o = { ok: false, message: t }; }
      if (!r.ok || !o.ok) msg = o.message || t;
    } catch { msg = 'start rembrandt.py'; }
    busy = false; ax.classList.remove('busy'); arm.blur();
    out.innerHTML = msg ? `<span class="warn">${msg}</span>` : '';
    look();
  });

  ping(); look();
  setInterval(ping, 200);
  setInterval(() => { if (!document.hidden) look(); }, 1000);
  return { state: S, stop, look };
}
