// HOLO's page (HOLO-Claude/HOLO.md, 2026-11-12): FORM-G's page — the library on the left, the picture, the panel on the right (the owner: "so
// as not to reinvent the wheel, we take the ready examples of 40 × 40 and 60 × 60 and set them as FORM-G") — the plan by holoplan.js, its two
// runs on the screen, ▶ Play and its LCD. Nothing here moves the machine yet: RUN 1 · RUN 2 ask their question and wait for the owner's word.
import { HOLO, HOLO_LIB, planOf, movesOf, shadeAt, placeRange, legsOf, puddlesY, WALL } from './holoplan.js';
import { reach } from './machine.js';
import { segments, sticks } from './lcd.js';
import { lampSwitch } from './lamp.js';
import './ui.js';

const $ = s => document.querySelector(s), KEEP = 'rembrandt.holo.v01';
const fmt = (v, d = 1) => Number(v).toFixed(d), esc = v => String(v ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const hm = t => { const m = Math.round((t || 0) / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`; };
const GROUND = '#F3F0E6';   // the primed canvas, as the study draws it
const S = { pic: HOLO_LIB[0], view: 'picture', gap: HOLO.gap, lasts: null, batch: HOLO.batch, sDab: HOLO.sDab, speed: HOLO.speed, place: {} };
try { Object.assign(S, JSON.parse(localStorage.getItem(KEEP) || 'null') ?? {}); } catch { }
const save = () => { try { localStorage.setItem(KEEP, JSON.stringify(S)); } catch { } };

// ---------- the library ----------
const LIB = {}, IMG = {}, AFTER1 = {};
let PIC = null;
const jarOf = id => PIC.jars.find(j => j.id === id);
const opts = () => ({ gap: S.gap, lasts: S.lasts, batch: S.batch, sDab: S.sDab, speed: S.speed });
const PLANS = new Map();
function plan(pic = PIC) {
  const key = JSON.stringify([pic.id, opts()]);
  if (!PLANS.has(key)) { if (PLANS.size > 8) PLANS.clear(); PLANS.set(key, planOf(pic, opts())); }
  return PLANS.get(key);
}
const total = P => P.reduce((t, q) => t + q.seconds, 0);
const dabsIn = (P, run) => P.filter(q => !run || q.run === run).reduce((t, q) => t + q.dabs, 0);
const jarTag = j => j.new ? ' <span class="new">NEW</span>' : j.number == null ? ' <em>no number</em>' : '';

// ---------- where the canvas lies ----------
const rangeOf = () => placeRange(PIC, reach());
const nearZero = ([lo, hi]) => lo > hi ? Math.round((lo + hi) / 2) : Math.round(Math.min(hi, Math.max(lo, 0)));
function placeNow() {
  if (!S.place[PIC.id]) { const r = rangeOf(); S.place[PIC.id] = { edgeLeft: nearZero(r.left), edgeBottom: nearZero(r.bottom) }; save(); }
  return S.place[PIC.id];
}
function wallsSay() {
  const r = rangeOf(), c = placeNow(), out = [];
  if (r.left[0] > r.left[1]) out.push(`the field, ${fmt(PIC.field.x1 - PIC.field.x0, 0)} mm across, is wider than the reach between the Y walls with their margins`);
  else if (c.edgeLeft < r.left[0] || c.edgeLeft > r.left[1]) out.push(`the left edge out of ${fmt(r.left[0], 0)} … ${fmt(r.left[1], 0)}`);
  if (c.edgeBottom < r.bottom[0] || c.edgeBottom > r.bottom[1]) out.push(`the bottom edge out of ${fmt(r.bottom[0], 0)} … ${fmt(r.bottom[1], 0)}`);
  return out.length ? `Past the walls: ${out.join('; ')}.` : '';
}

// ---------- the screen ----------
const cv = $('#cv'), stage = $('#stage'), ctx = cv.getContext('2d');
let K = 1, OX = 0, OY = 0, fitted = '', only = null, PLAY = null;
const PLAY_MS = 180000;
function fit() { const r = stage.getBoundingClientRect(), m = 26, k = Math.min((r.width - 2 * m) / PIC.w, (r.height - 2 * m) / PIC.h); K = k; OX = (r.width - PIC.w * k) / 2; OY = (r.height - PIC.h * k) / 2; }
const sx = x => OX + x * K, sy = y => OY + (PIC.h - y) * K;
function layout() {
  const r = stage.getBoundingClientRect(), d = devicePixelRatio || 1;
  cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
  const was = `${S.pic}|${Math.round(r.width)}|${Math.round(r.height)}`;
  if (PIC && fitted !== was) { fit(); fitted = was; }
  kick();
}
let drawT = 0;
function kick() { if (!drawT) drawT = requestAnimationFrame(() => { drawT = 0; draw(); }); }
// a puddle as the study draws it: an upright drop, 4 mm wide, longer by its dabs, a light on it (mm → px by `k`, at x, y px)
function puddle(g, x, y, dabs, hex, k) {
  const rx = 2 * k, ry = (2.6 + 1.1 * dabs) * k;
  g.fillStyle = hex; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,255,255,.38)'; g.beginPath(); g.ellipse(x - rx * 0.28, y - ry * 0.25, rx * 0.25, ry * 0.25, 0, 0, 7); g.fill();
}
// a run-2 stroke: the brush's width, its paint falling off from its puddle (shadeAt) — one line, its colour a gradient along it
const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(',');
function shadow(g, q, hex, X, Y, w) {
  const [a, b] = [q.pts[0][1], q.pts[1][1]], full = q.fade?.full ?? 0, c = rgb(hex), y0 = Y(a), y1 = Y(b);
  if (Math.abs(y1 - y0) < 0.5) return;
  const gr = g.createLinearGradient(0, y0, 0, y1);
  for (let i = 0; i <= 16; i++) { const u = i / 16; gr.addColorStop(u, `rgba(${c},${Math.min(1, shadeAt(u, full) * 1.1)})`); }
  if (full) gr.addColorStop(full, `rgba(${c},1)`);
  g.strokeStyle = gr; g.lineWidth = w; g.lineCap = 'butt';
  g.beginPath(); g.moveTo(X(q.x), y0); g.lineTo(X(q.x), y1); g.stroke();
}
const dim = id => only && only !== id ? 0.08 : 1;
function drawPuddles(g, run) {
  for (const L of plan()) if (L.run === run) { g.globalAlpha = dim(L.key); for (const p of L.puddles) puddle(g, sx(p.x), sy(p.y), p.dabs, L.hex, K); }
  g.globalAlpha = 1;
}
function drawStrokes(g) {
  const w = Math.max(0.5, PIC.pitch * K * 0.92);
  for (const L of plan()) {
    if (L.run === 1) { g.strokeStyle = L.hex; g.lineWidth = w; g.lineCap = 'butt'; g.globalAlpha = dim(L.key); for (const q of L.strokes) { g.beginPath(); g.moveTo(sx(q.x), sy(q.pts[0][1])); g.lineTo(sx(q.x), sy(q.pts[1][1])); g.stroke(); } }
  }
  for (const L of plan()) if (L.run === 2) for (const q of L.strokes) { if (only && only !== L.key) continue; shadow(g, q, L.hex, sx, sy, w); }
  g.globalAlpha = 1;
}
function draw() {
  const d = devicePixelRatio || 1, r = stage.getBoundingClientRect(), g = ctx;
  g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, r.width, r.height);
  if (!PIC) return;
  g.fillStyle = GROUND; g.fillRect(sx(0), sy(PIC.h), PIC.w * K, PIC.h * K);
  g.strokeStyle = 'rgba(36,34,31,.35)'; g.lineWidth = 1; g.strokeRect(sx(0), sy(PIC.h), PIC.w * K, PIC.h * K);
  g.imageSmoothingQuality = 'high';
  const img = (im, a = 1) => { if (im?.complete) { g.globalAlpha = a; g.drawImage(im, sx(0), sy(PIC.h), PIC.w * K, PIC.h * K); g.globalAlpha = 1; } };
  if (PLAY) g.drawImage(PLAY.cv, sx(0), sy(PIC.h), PIC.w * K, PIC.h * K);
  else if (S.view === 'picture') { img(IMG[S.pic]); if (only) { g.fillStyle = 'rgba(243,240,230,.8)'; g.fillRect(sx(0), sy(PIC.h), PIC.w * K, PIC.h * K); drawStrokes(g); } }
  else if (S.view === 'p1') drawPuddles(g, 1);
  else if (S.view === 'p2') { img(AFTER1[S.pic]); drawPuddles(g, 2); }
  else drawStrokes(g);
  // the brush's reach, the walls, with the canvas as it lies
  const W = reach(), c = placeNow(), x0 = W.y.min - c.edgeLeft, x1 = W.y.max - c.edgeLeft, y0 = W.x.min - c.edgeBottom, y1 = W.x.max - c.edgeBottom;
  g.save(); g.setLineDash([6, 4]); g.strokeStyle = '#EB7A25'; g.lineWidth = 1.2; g.strokeRect(sx(x0), sy(y1), (x1 - x0) * K, (y1 - y0) * K); g.restore();
  if (PLAY?.tip) { const t = PLAY.tip; g.fillStyle = t.hex; g.strokeStyle = t.kind === 'dab' ? '#EB7A25' : '#24221F'; g.lineWidth = 2; g.beginPath(); g.arc(sx(t.at[0]), sy(t.at[1]), 5, 0, 7); g.fill(); g.stroke(); }
}
const toPt = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
cv.addEventListener('wheel', e => {
  e.preventDefault();
  if (!PIC) return;
  const [px, py] = toPt(e);
  if (e.ctrlKey || e.metaKey || Math.abs(e.deltaX) < 1) { const f = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0022)), k = Math.max(0.05, Math.min(30, K * f)); OX = px - (px - OX) * k / K; OY = py - (py - OY) * k / K; K = k; }
  else { OX -= e.deltaX; OY -= e.deltaY; }
  kick();
}, { passive: false });
let dragFrom = null;
cv.addEventListener('pointerdown', e => { dragFrom = [e.clientX, e.clientY, OX, OY]; cv.setPointerCapture(e.pointerId); cv.classList.add('drag'); });
cv.addEventListener('pointermove', e => { if (dragFrom) { OX = dragFrom[2] + e.clientX - dragFrom[0]; OY = dragFrom[3] + e.clientY - dragFrom[1]; kick(); } });
cv.addEventListener('pointerup', () => { dragFrom = null; cv.classList.remove('drag'); });
cv.addEventListener('dblclick', () => { if (PIC) { fit(); kick(); } });
new ResizeObserver(layout).observe(stage);

// ▶ Play: the two runs as they will go, a batch's puddles laid, then dragged, on an offscreen canvas at 2 px a mm; FORM-G's clock, slow at first
// (the clock squared), three minutes; the LCD follows it. A view: it moves nothing
function playStop() {
  if (!PLAY) return;
  cancelAnimationFrame(PLAY.raf); clearTimeout(PLAY.end); PLAY = null;
  $('#btnPlay').textContent = '▶ Play'; $('#btnPlay').classList.remove('on');
  markRun(-1); lcd(); kick();
}
$('#btnPlay').onclick = () => {
  if (PLAY) return playStop();
  if (!PIC) return;
  const P = plan(), M = movesOf(P, opts()), s = 2, off = document.createElement('canvas'), c = off.getContext('2d');
  if (!M.length) return;
  off.width = PIC.w * s; off.height = PIC.h * s; c.fillStyle = GROUND; c.fillRect(0, 0, off.width, off.height);
  const X = x => x * s, Y = y => (PIC.h - y) * s, w = PIC.pitch * s * 0.92, end = M.at(-1).to;
  const Q = PLAY = { cv: off, end, want: 0, i: 0, at: 0, tip: null, line: 0, t0: performance.now(), said: 0, P, M };
  $('#btnPlay').textContent = '■ Stop'; $('#btnPlay').classList.add('on');
  const step = () => {
    if (PLAY !== Q) return;
    const t = performance.now(), u = Math.min(1, (t - Q.t0) / PLAY_MS);
    Q.want = u < 1 ? end * u * u : end;
    while (Q.i < M.length && M[Q.i].from <= Q.want) {
      const m = M[Q.i], L = P[m.line], f = Math.min(1, (Q.want - m.from) / (m.to - m.from || 1));
      if (m.kind === 'dab') { if (f >= 1) puddle(c, X(m.at[0]), Y(m.at[1]), m.dabs, L.hex, s); Q.tip = { kind: 'dab', at: m.at, hex: L.hex }; }
      else {
        const [a, b] = [m.pts[0][1], m.pts[1][1]], y = a + (b - a) * f, y0 = a + (b - a) * Q.at;
        if (L.run === 1) { c.strokeStyle = L.hex; c.lineWidth = w; c.lineCap = 'butt'; c.beginPath(); c.moveTo(X(m.pts[0][0]), Y(y0)); c.lineTo(X(m.pts[0][0]), Y(y)); c.stroke(); }
        else if (f >= 1) shadow(c, { x: m.pts[0][0], pts: m.pts, fade: m.fade }, L.hex, X, Y, w);
        Q.tip = { kind: 'drag', at: [m.pts[0][0], y], hex: L.hex };
      }
      Q.line = m.line;
      if (f < 1) { Q.at = f; break; }
      Q.at = 0; Q.i++;
    }
    if (t - Q.said > 120 || u === 1) { Q.said = t; lcd(); }
    kick();
    if (Q.i < M.length) Q.raf = requestAnimationFrame(step); else { Q.tip = null; Q.end = setTimeout(playStop, 1500); }
  };
  lcd(); Q.raf = requestAnimationFrame(step);
};

// ---------- the LCD, FORM-G's look: ▶ Play's run, or the plan ----------
const mmss = t => { t = Math.max(0, Math.round(t || 0)); return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
const lcdTime = t => (t || 0) < 3600 ? segments(mmss(t), 17) : `<span class="hm">${segments(String(Math.floor(t / 3600)), 17)}<span class="tu">h</span>${segments(String(Math.floor(t % 3600 / 60)).padStart(2, '0'), 17)}<span class="tu">min</span></span>`;
function lcd() {
  if (!PIC) return;
  const P = plan(), Q = PLAY, all = total(P), pct = Q ? Q.want / Q.end * 100 : 0, at = Q ? Q.line : 0, j = P[at], nx = P[at + 1];
  if (Q) markRun(at);
  const m = Q?.M[Math.min(Q.i, Q.M.length - 1)], B = j?.batches.length ?? 0;
  const now = Q && m ? `${j.run === 1 ? 'Run 1' : 'Run 2'} · batch ${m.batch + 1} of ${B} · ${m.kind === 'dab' ? 'laying the puddles' : 'dragging them'} · est.` : `${PIC.title} · ${dabsIn(P)} dabs · ${fmt(P.reduce((t, q) => t + q.mm, 0) / 1000, 1)} m of strokes`;
  $('#lcd').innerHTML = `
    <div class="lcd-top"><span>${Q ? '▶ play' : 'plan'}</span><span>${Q ? `line ${at + 1}/${P.length}` : `${P.length} lines`}</span></div>
    <div class="lcd-mid">
      <div class="lcd-big">${segments(String(Math.min(100, Math.floor(pct))).padStart(2, ' '), 46)}<span class="u">%</span></div>
      <div class="lcd-times"><span class="k">left</span>${lcdTime(all * (1 - pct / 100))}<span class="k">total</span>${lcdTime(all)}</div>
    </div>
    ${sticks(pct / 100)}
    ${j ? `<div class="lcd-pencil"><i class="sw" style="background:${j.hex}"></i><span class="pt"><span class="pn">${esc(j.name)}</span><span class="pk">${Q ? 'painting' : 'first'} · ${at + 1}/${P.length} · run ${j.run}</span></span>${nx ? `<span class="nx"><span class="pk">next</span><span class="nn"><i style="background:${nx.hex}"></i><span>${esc(nx.name)}</span></span></span>` : '<span class="nx"><span class="pk">the last</span></span>'}</div>` : ''}
    <div class="lcd-now">${now}</div>`;
}
function markRun(at) { [...$('#runList').children].forEach(q => { const i = q.dataset.i === undefined ? -2 : +q.dataset.i; q.classList.toggle('now', i === at); q.classList.toggle('done', at >= 0 && i >= 0 && i < at); }); }

// ---------- RUN 1 · RUN 2: the question, as FORM-G's; nothing sent ----------
const runRows = lines => lines.map((q, i) => `<li><span class="no">${i + 1}</span><i class="sw" style="background:${q.hex}"></i><span class="nm">${esc(q.name)}</span><span class="tg">${q.dabs} dabs</span></li>`).join('');
function runText(run, lines) {
  const d = lines.reduce((t, q) => t + q.dabs, 0), mm = lines.reduce((t, q) => t + q.mm, 0), b = lines.reduce((t, q) => t + q.batches.length, 0), c = placeNow();
  return (run === 1
    ? `Run 1, the light: ${lines.length} jar${lines.length === 1 ? '' : 's'}, light to dark. Along every leg of a slat of its ground a puddle every ${S.gap} mm at most, one dab each — a dip at the cup at hand, then the brush down there, a mark of ${HOLO.mark} mm; then one stroke the leg's whole field through them, no dip, even legs from the top down, odd ones up. `
    : `Run 2, the shadow, on the dry first run: ${lines.length} jar${lines.length === 1 ? '' : 's'}, light to dark. For every shadowed band of every leg one puddle 5 mm in from its edge, 1 … ${HOLO.maxDabs[PIC.composition]} dabs by its length, then one stroke towards its far end, no dip, till it gives out. `)
    + `${d} dabs in ${b} batches of about ${S.batch}, every batch laid, then dragged while wet; ${fmt(mm / 1000, 1)} m of strokes; ≈ ${hm(lines.reduce((t, q) => t + q.seconds, 0))} at ${S.sDab} s a dab (est.). Between two jars a pause: wipe the brush, put the next jar in the cup. `
    + `The canvas's left edge ${c.edgeLeft} mm, its bottom edge ${c.edgeBottom} mm from home.`;
}
function askRun(run) {
  const all = plan().filter(q => q.run === run);
  if (!all.length) return;
  const show = from => {
    const lines = all.slice(from), first = lines[0];
    $('#runAskTitle').textContent = `RUN ${run} · ${run === 1 ? 'LIGHT' : 'SHADOW'} · ${PIC.title} · ${lines.length} jar${lines.length === 1 ? '' : 's'}`;
    $('#runAskFirst').innerHTML = `<i class="sw" style="background:${first.hex}"></i><span class="pt"><span class="k">In the cup first</span><b>${esc(first.name)}</b><span>${esc(first.new ? 'new: ' + first.note : first.note)}</span></span>`;
    $('#runAskList').innerHTML = runRows(lines);
    $('#runAskText').textContent = runText(run, lines);
  };
  const sel = $('#runFrom');
  sel.innerHTML = all.map((q, i) => `<option value="${i}">${i + 1} · ${esc(q.name)}</option>`).join(''); sel.value = '0';
  sel.onchange = () => show(+sel.value);
  show(0);
  const box = $('#runAsk'); box.hidden = false; $('#runNo').focus();
  const key = e => { if (e.key === 'Escape') { e.preventDefault(); end(); } };
  const end = () => { box.hidden = true; removeEventListener('keydown', key, true); };
  addEventListener('keydown', key, true);
  $('#runNo').onclick = end; box.onclick = e => { if (e.target === box) end(); };
}
$('#btnRun1').onclick = () => askRun(1);
$('#btnRun2').onclick = () => askRun(2);

// ---------- the panel ----------
function showKeys() {
  document.querySelectorAll('#views [data-view]').forEach(b => b.classList.toggle('on', b.dataset.view === S.view));
  document.querySelectorAll('#lib .fg-card').forEach(b => b.classList.toggle('on', b.dataset.id === S.pic));
}
function showPanel() {
  if (!PIC) return;
  const P = plan(), c = placeNow(), rg = rangeOf(), bad = wallsSay();
  const Lf = $('#fLeft'), Bf = $('#fBottom');
  if (document.activeElement !== Lf) Lf.value = c.edgeLeft;
  if (document.activeElement !== Bf) Bf.value = c.edgeBottom;
  const f = PIC.field;
  $('#placeRead').innerHTML = `${bad ? `<span class="warn">${esc(bad)}</span><br>` : ''}The field ${fmt(f.x1 - f.x0, 0)} × ${fmt(f.y1 - f.y0, 0)} mm, ${fmt(f.x0, 0)} mm in from the canvas's edges. Within the walls for it: left edge ${fmt(rg.left[0], 0)} … ${fmt(rg.left[1], 0)}, bottom edge ${fmt(rg.bottom[0], 0)} … ${fmt(rg.bottom[1], 0)} mm (the dashed line; est., the elbow's sweep at the bottom ${WALL.bottom} mm).`;
  canvasReads();
  for (const [id, k] of [['#fGap', 'gap'], ['#fBatch', 'batch'], ['#fSDab', 'sDab'], ['#fSpeed', 'speed']]) if (document.activeElement !== $(id)) $(id).value = S[k];
  if (document.activeElement !== $('#fLasts')) $('#fLasts').value = S.lasts ?? '';
  $('#fMark').value = HOLO.mark;
  const n1 = puddlesY(PIC, S.gap).length, legs = legsOf(PIC).length;
  $('#puddleRead').innerHTML = `${legs} legs ${fmt(PIC.pitch, 0)} mm apart in ${PIC.slats.length} slats; run 1 ${n1} puddles a leg, ${dabsIn(P, 1)} dabs; run 2 ${P.filter(q => q.run === 2).reduce((t, q) => t + q.puddles.length, 0)} puddles, ${dabsIn(P, 2)} dabs${S.lasts ? ` (a dab every ${S.lasts} mm of band)` : ` (the plan's: ${PIC.est.a_dab_lasts} mm a dab)`}. ${dabsIn(P)} dabs in all, ${P.reduce((t, q) => t + q.batches.length, 0)} batches, ≈ ${hm(total(P))} (est.).`;
  $('#runList').innerHTML = P.map((q, i) => `${!i || q.run !== P[i - 1].run ? `<li class="fg-sep">${q.run === 1 ? 'Run 1 · the light' : 'Run 2 · the shadow, on the dry first'}</li>` : ''}<li data-key="${esc(q.key)}" data-i="${i}" class="${only === q.key ? 'only' : ''}" title="${esc(q.name)}${q.note ? ` — ${esc(q.note)}` : ''}: ${q.dabs} dabs in ${q.batches.length} batch${q.batches.length === 1 ? '' : 'es'}, ${q.strokes.length} strokes, ${fmt(q.mm / 1000, 1)} m, ≈ ${hm(q.seconds)} (est.). A click shows its strokes"><span class="no">${i + 1}</span><i class="sw" style="background:${q.hex}"></i><span class="nm">${esc(q.name)}${jarTag(q)}</span><span class="tg">${q.dabs} dabs</span></li>`).join('');
  $('#jarsHint').textContent = `${P.length} lines, ${PIC.jars.length} jars, light to dark`;
  const fresh = PIC.jars.filter(j => j.new), none = PIC.jars.filter(j => !j.new && j.number == null), photo = PIC.jars.filter(j => j.number != null && j.seen === 'photo');
  $('#newJars').innerHTML = fresh.length ? `<li style="display:block;font-weight:600;color:var(--ink)">New jars, from the empty four</li>` + fresh.map(j => `<li><i class="sw" style="background:${j.hex}"></i><span><b>${esc(j.name.replace('New · ', ''))}</b> <span>— ${esc(j.note)}, 1 : 1 with pouring medium</span></span></li>`).join('') : '';
  $('#jarNote').innerHTML = [none.length ? `${none.map(j => esc(j.name)).join(', ')}: no number on the lid yet, their colours off the photo (est.).` : '', ...photo.map(j => `${esc(j.name)}: ${esc(j.note)}.`)].filter(Boolean).join(' ');
  $('#stats').textContent = `${PIC.w / 10} × ${PIC.h / 10} cm · ${PIC.composition}`;
  lcd();
}
let CANVAS_INFO = false;
function canvasReads() { const p = $('#placeRead'); p.hidden = !CANVAS_INFO && !p.querySelector('.warn'); $('#canvasInfo').classList.toggle('on', CANVAS_INFO); }
$('#canvasInfo').onclick = () => { CANVAS_INFO = !CANVAS_INFO; canvasReads(); };
function settle() { PLANS.clear(); READS.clear(); save(); showKeys(); showPanel(); kick(); }
for (const [id, k, lo, hi] of [['#fGap', 'gap', 15, 120], ['#fBatch', 'batch', 10, 400], ['#fSDab', 'sDab', 2, 30], ['#fSpeed', 'speed', 5, 120]]) {
  $(id).onchange = e => { const v = +e.target.value; if (Number.isFinite(v) && e.target.value !== '') S[k] = Math.max(lo, Math.min(hi, v)); e.target.value = S[k]; playStop(); settle(); };
}
$('#fLasts').onchange = e => { const v = +e.target.value; S.lasts = e.target.value === '' || !Number.isFinite(v) ? null : Math.max(20, Math.min(150, v)); playStop(); settle(); };
for (const [id, k] of [['#fLeft', 'edgeLeft'], ['#fBottom', 'edgeBottom']]) {
  $(id).onchange = e => { const v = +e.target.value; if (Number.isFinite(v)) placeNow()[k] = Math.round(v); e.target.value = placeNow()[k]; settle(); };
}
$('#views').onclick = e => { const b = e.target.closest('[data-view]'); if (!b) return; playStop(); S.view = b.dataset.view; save(); showKeys(); kick(); };
$('#runList').onclick = e => { const li = e.target.closest('li[data-key]'); if (!li) return; only = only === li.dataset.key ? null : li.dataset.key; [...$('#runList').children].forEach(q => q.classList.toggle('only', q.dataset.key === only)); kick(); };

// a card's (i): that picture's numbers, by its own plan
const READS = new Map();
function readOf(id) {
  if (READS.has(id)) return READS.get(id);
  const pic = LIB[id], P = plan(pic), n1 = P.filter(q => q.run === 1), n2 = P.filter(q => q.run === 2), fresh = pic.jars.filter(j => j.new).length;
  const out = `<b>${esc(pic.title)}</b>, in our jars: ${pic.count.legs} legs ${fmt(pic.pitch, 0)} mm apart, ${pic.count.slats} slats, the field ${fmt(pic.field.x1 - pic.field.x0, 0)} mm. ${pic.jars.length} jars${fresh ? `, ${fresh} of them new` : ''}. `
    + `<b>Run 1</b>, the light: ${n1.length} jars, ${dabsIn(P, 1)} dabs, ≈ ${hm(total(n1))}; the run to dry; <b>run 2</b>, the shadow: ${n2.length} jars, ${dabsIn(P, 2)} dabs, ≈ ${hm(total(n2))} (est.). A model, not a photo: nothing run yet.`;
  READS.set(id, out);
  return out;
}
function popShow(el) {
  const pop = $('#libPop'), r = el.getBoundingClientRect();
  pop.innerHTML = readOf(el.dataset.read); pop.hidden = false;
  const w = pop.offsetWidth, h = pop.offsetHeight, x = $('.fg-shelf').getBoundingClientRect().right + 8, side = x + w <= innerWidth - 8 && innerWidth > 760;
  pop.style.left = `${side ? x : Math.max(8, Math.min(innerWidth - w - 8, r.right - w))}px`;
  pop.style.top = `${Math.max(8, Math.min(innerHeight - h - 8, side ? r.top - h + 24 : r.bottom + 6))}px`;
}
const popHide = () => { $('#libPop').hidden = true; };
{
  const lib = $('#lib'), inf = e => e.target.closest('.info');
  lib.addEventListener('mouseover', e => { if (inf(e)) popShow(inf(e)); });
  lib.addEventListener('mouseout', e => { if (inf(e)) popHide(); });
  lib.addEventListener('click', e => { if (inf(e)) popShow(inf(e)); });
  addEventListener('pointerdown', e => { if (!inf(e)) popHide(); });
}
function choose(id) { playStop(); popHide(); only = null; S.pic = id; PIC = LIB[id]; fitted = ''; layout(); showKeys(); showPanel(); save(); }
$('#lib').onclick = e => { const b = e.target.closest('.fg-card'); if (b) choose(b.dataset.id); };

// ---------- start ----------
lampSwitch($('#lamp'));
(async () => {
  for (const id of HOLO_LIB) {
    const pic = await (await fetch(`holo/${id}.json`, { cache: 'no-store' })).json();
    LIB[id] = pic;
    const im = new Image(); im.onload = kick; im.src = pic.image; IMG[id] = im;
    const a1 = new Image(); a1.onload = kick; a1.src = pic.after1; AFTER1[id] = a1;
  }
  $('#lib').innerHTML = HOLO_LIB.map(id => `<div class="fg-item"><button class="fg-card" data-id="${id}"><img src="${LIB[id].image}" alt=""><b>${esc(LIB[id].title.split(', ').slice(1).join(', '))}</b><span class="sz">${LIB[id].w / 10} × ${LIB[id].h / 10} cm</span></button><button class="info" data-read="${id}" aria-label="About ${esc(LIB[id].title)}">i</button></div>`).join('');
  if (!LIB[S.pic]) S.pic = HOLO_LIB[0];
  PIC = LIB[S.pic];
  layout(); settle();
})();
