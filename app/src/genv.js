// GEN-V's page: a picture in, its sketch in GOGH's dabs, APPROVE (goghplan.js's sketchV). The owner, 2026-11-22: "we will also need a new picture generator as
// GEN-F, with the same functionality … let us call it GEN-V (as Vincent :)". GEN-F's page (genf.js) as it is — the format, the colours, three screens side by
// side, the ground, APPROVE — its sketch GOGH's: every column cut into dabs of ≈ 20 mm, one jar each, upright, as bricks. No motion blur: a dab is a dab.
// Moves nothing on the machine: GOGH's plotRun only counts the run's time, the cup at hand, the canvas in the middle of the reach (est.).
import { GEN, GEN_FORMATS, formatOf, fieldOf, fitOf, bareMask, boxOf, binsOf } from './genfplan.js';
import { DAB, sketchV, passesV, dabRunsOf, dabLine } from './goghplan.js';
import { rowsOf, R3, FORMG } from './formgplan.js';
import { plotRun, DEFAULTS, ELBOW_HOVER } from './strokes.js';
import { reach } from './machine.js';
import { cupOf } from './ink.js';
import { lampSwitch, themeColor } from './lamp.js';
import './ui.js';

const $ = s => document.querySelector(s), KEEP = 'rembrandt.genv.v01';
const fmt = (v, d = 1) => Number(v).toFixed(d), esc = v => String(v ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const hm = t => { const m = Math.round((t || 0) / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`; };
const SLOTS = [12, 20, 30];   // fewer than GEN-F's: a dab is a whole dip of one jar, the eye mixes them (est.)
const S = { format: GEN_FORMATS[0].id, slots: SLOTS, focus: 1, view: 'sketch', ground: 'white' };
const BG = { white: '#FBFAF7', black: '#161514' };   // OPM-N's ground, GEN-F's: the bare canvas on the screen, not painted
try { Object.assign(S, JSON.parse(localStorage.getItem(KEEP) || 'null') ?? {}); } catch { }
if (!GEN_FORMATS.some(f => f.id === S.format)) S.format = GEN_FORMATS[0].id;
if (!BG[S.ground]) S.ground = 'white';
const kOf = v => Math.min(GEN.colours[1], Math.max(GEN.colours[0], Math.round(+v) || 20));
S.slots = [0, 1, 2].map(i => kOf(Array.isArray(S.slots) ? S.slots[i] : SLOTS[i]));
S.focus = [0, 1, 2].includes(S.focus) ? S.focus : 1;
const save = () => { try { localStorage.setItem(KEEP, JSON.stringify(S)); } catch { } };

// ---------- the picture, kept in this browser so a reload keeps it (GEN-F's its own) ----------
const idb = () => new Promise((ok, no) => { const r = indexedDB.open('rembrandt.genv', 1); r.onupgradeneeded = () => r.result.createObjectStore('pic'); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
async function keepPic(blob, name) { try { (await idb()).transaction('pic', 'readwrite').objectStore('pic').put({ blob, name }, 'last'); } catch { } }
async function lastPic() { try { const db = await idb(); return await new Promise(ok => { const r = db.transaction('pic').objectStore('pic').get('last'); r.onsuccess = () => ok(r.result ?? null); r.onerror = () => ok(null); }); } catch { return null; } }
const canvasOf = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

let SRC = null, BASE = null, SL = [null, null, null], pick = null, only = null, THUMB = null;
const cur = () => SL[S.focus];
async function openPic(blob, name) {
  let img;
  try { img = await createImageBitmap(blob); } catch { $('#srcRead').innerHTML = `<span class="warn">${esc(name)}: this browser cannot read it. JPG or PNG, please (a HEIC: export it as JPG first).</span>`; return; }
  const sc = Math.min(1, 900 / Math.max(img.width, img.height)), w = Math.max(1, Math.round(img.width * sc)), h = Math.max(1, Math.round(img.height * sc));
  const g = canvasOf(w, h).getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0, w, h);
  const { mask, ground } = bareMask(g.getImageData(0, 0, w, h).data, w, h), wb = boxOf(mask, w, h);
  SRC = { img, name, w: img.width, h: img.height, work: { mask, w, h }, wb, box: { x: wb.x / sc, y: wb.y / sc, w: wb.w / sc, h: wb.h / sc }, ground };
  if (THUMB) URL.revokeObjectURL(THUMB);
  THUMB = URL.createObjectURL(blob);
  $('#dropText').innerHTML = `<img src="${THUMB}" alt="">`;
  $('#srcRead').innerHTML = `${esc(name)}<br>${img.width} × ${img.height} px<br>`
    + (ground ? `ground <span style="display:inline-block;width:9px;height:9px;border-radius:2px;vertical-align:-1px;background:${ground};box-shadow:inset 0 0 0 1px rgba(0,0,0,.25)"></span> ${ground}: bare canvas, the picture ${Math.round(SRC.box.w)} × ${Math.round(SRC.box.h)} px in it`
      : 'no plain ground: all of it painted');
  V.fit = true; pick = null;
  build();
}

// ---------- the sketches ----------
function build() {
  if (!SRC) { BASE = null; SL = [null, null, null]; panel(); draw(); return; }
  const f = formatOf(S.format), fit = fitOf(f, SRC.box.w, SRC.box.h), W = fit.N * GEN.pitch, R = fit.R;
  const g = canvasOf(W, R).getContext('2d', { willReadFrequently: true });
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(SRC.img, SRC.box.x, SRC.box.y, SRC.box.w, SRC.box.h, 0, 0, W, R);
  const img = g.getImageData(0, 0, W, R), rgba = img.data, mask = new Uint8Array(W * R), wk = SRC.work, wb = SRC.wb;
  for (let y = 0; y < R; y++) for (let x = 0; x < W; x++) {
    const wx = Math.min(wk.w - 1, Math.floor(wb.x + (x + 0.5) * wb.w / W)), wy = Math.min(wk.h - 1, Math.floor(wb.y + (y + 0.5) * wb.h / R)), i = y * W + x;
    mask[i] = wk.mask[wy * wk.w + wx] || rgba[4 * i + 3] < 128 ? 1 : 0;
  }
  BASE = { f, fit, W, R, B: binsOf(rgba, mask, fit.N, R), title: SRC.name.replace(/\.[^.]+$/, '') };
  for (let i = 0; i < W * R; i++) if (mask[i]) rgba[4 * i + 3] = 0;
  BASE.photo = canvasOf(W, R); BASE.photo.getContext('2d').putImageData(img, 0, 0);
  only = null;
  SL = [0, 1, 2].map(slotOf);
  panel(); draw();
  estimateAll();
}
function slotOf(i) {
  const k = S.slots[i], sk = { ...BASE, k, ...sketchV(BASE.B, BASE.fit, BASE.f, k, { id: 'gen-v', title: BASE.title }), est: null };
  sk.lines = Object.fromEntries(sk.pic.jars.map(j => [j.id, dabLine(j)]));
  sk.cells = sk.pic.jars.reduce((a, j) => a + j.cells.length, 0);
  return sk;
}
function buildSlot(i) {
  if (!BASE) return;
  SL[i] = slotOf(i); only = null;
  panel(); draw();
  estimateAll();
}
// GOGH's run of it, counted: its list, a dab a run on a dip of its own, the J3, plotRun — the time, the dips (est.); nothing sent
const DIP_S = 5.5;   // a dip from the cup at hand, s (GEN-F's, est.): a new frame's canvas has no Here, its dips added
function runOf(pic, frame = formatOf(S.format).frame) {
  try {
    const P = passesV(pic), R = rowsOf(pic, P, R3.every, FORMG.lap, false, { slack: R3.slack, j3: R3.j3, brush: dabRunsOf }), W = reach();
    const here = { x: (W.x.min + W.x.max) / 2, y: (W.y.min + W.y.max) / 2 };
    const r = plotRun({ ...DEFAULTS, speed: 25, travel: 100, tail: 3, lift: true, ink: true, snake: true, pause: false, cup: cupOf({ hand: { on: true } }), hover: ELBOW_HOVER, press: 0, noDipUnder: 0, rows: R.ps.length, ...(frame ? {} : { here }) },
      R.groups.map((g, k) => ({ key: 'DRAG', ps: g.map(i => R.ps[i]), why: k ? 'the next jar' : null })));
    const dips = frame ? R.ps.length : r.dips;
    return { seconds: r.seconds + (frame ? dips * DIP_S : 0), dips, lines: P.length, mm: P.reduce((a, q) => a + q.mm, 0) };
  } catch (e) { return { fail: String(e?.message || e) }; }
}
let ESTQ = 0;
function estimateAll() {
  const q = ++ESTQ, order = [S.focus, ...[0, 1, 2].filter(i => i !== S.focus)];
  const next = n => {
    if (q !== ESTQ || n >= order.length) return;
    const sk = SL[order[n]];
    if (sk && !sk.est) { sk.est = runOf(sk.pic); panel(); draw(); }
    setTimeout(() => next(n + 1), 10);
  };
  setTimeout(() => next(0), 20);
}

// ---------- the panel ----------
function panel() {
  const f = formatOf(S.format), F = fieldOf(f), SK = cur();
  $('#formats').innerHTML = GEN_FORMATS.map(q => `<button class="btn${q.id === S.format ? ' on' : ''}${q.frame ? ' frame' : ''}" data-f="${q.id}" title="A canvas ${q.w / 10} × ${q.h / 10} cm: ${q.w / 10} across Y, ${q.h / 10} along X, as GOGH lays it${q.frame ? ` — for a new frame: today the brush reaches ${GEN.across} × ${GEN.along} mm; a sketch to look at, nothing to run` : ''}">${q.w / 10} × ${q.h / 10}${q.frame ? '<i>new frame</i>' : ''}</button>`).join('');
  $('#fieldRead').innerHTML = (f.frame ? `<span class="warn">For a new frame:</span> today the brush reaches ${GEN.across} × ${GEN.along} mm; the field here the canvas itself, 30 mm in, ${F.w} × ${F.h} mm (est.)` : `The field the brush reaches on it: ${F.w} × ${F.h} mm (est.)`)
    + (SK ? `; the picture <b>${SK.W} × ${SK.R} mm</b>, ${SK.fit.N} columns 5 mm apart, in the middle.` : '.');
  $('#kNow').textContent = S.slots[S.focus]; $('#kSl').value = S.slots[S.focus];
  $('#kSay').textContent = `screen ${S.focus + 1}${SK ? ` → ${SK.pic.jars.length} jars` : ''}`;
  const lo = GEN.colours[0], hi = GEN.colours[1];
  $('#kMarks').innerHTML = S.slots.map((k, i) => `<b data-slot="${i}" class="${i === S.focus ? 'on' : ''}${i === pick ? ' pick' : ''}" style="left:calc(9px + (100% - 18px) * ${(k - lo) / (hi - lo)})" title="Screen ${i + 1}: ${k} colours${SL[i] ? ` → ${SL[i].pic.jars.length} jars` : ''} — a click selects it">${i + 1}</b>`).join('');
  [...$('#views').children].forEach(b => b.classList.toggle('on', b.dataset.view === S.view));
  document.querySelectorAll('[data-bg]').forEach(b => b.classList.toggle('on', b.dataset.bg === S.ground));
  const ok = pick !== null && !!SL[pick];
  $('#btnApprove').disabled = !ok;
  $('#btnApprove').textContent = ok ? `APPROVE ${pick + 1} · ${SL[pick].k} colours` : 'APPROVE';
  if (BASE && !ok && !/Approved/.test($('#approveRead').textContent)) $('#approveRead').innerHTML = 'Choose a screen first — 1, 2 or 3: a click on it, or on its mark under the slider.';
  if (!SK) { $('#sketchRead').innerHTML = 'Open a picture on the left.'; $('#jarList').innerHTML = ''; $('#jarsHint').textContent = ''; $('#stats').textContent = `${f.w / 10} × ${f.h / 10} cm`; return; }
  const long = Math.max(f.w, f.h), e = SK.est, n = SK.pic.jars.length;
  $('#sketchRead').innerHTML = `<b>Screen ${S.focus + 1}:</b> <b>${SK.asked}</b> colours asked, ${SK.made} paint a dab; <b>${n} jars</b> by the canon of the jars (a jar with less line than the canvas's long side, ${long / 10} cm, into its nearest; ΔE 25 at most)`
    + `${SK.kept.length ? `, ${SK.kept.length} short kept, nothing near` : ''}. <b>${SK.dabs} dabs</b>, ${DAB.min} … ${DAB.max} mm, ≈ ${DAB.aim}, a dip each; `
    + (e ? (e.fail ? `<span class="warn">the time not counted: ${esc(e.fail)}</span>` : `${fmt(e.mm / 1000, 1)} m of brush, ${e.lines} lines of the list, ${e.dips} dips, <b>≈ ${hm(e.seconds)}</b> on the machine, the jars' changes by hand apart.`) : 'counting the time …')
    + ' A sketch: every dab flat in its jar\'s colour, no brush model (est.).';
  $('#jarsHint').textContent = `${n}, light to dark`;
  const by = Object.fromEntries(SK.pic.jars.map(j => [j.id, j])), dabs = j => j.cells.reduce((a, c) => a + c.legs.length, 0);
  $('#jarList').innerHTML = SK.pic.jars.map((j, i) => `<li data-id="${j.id}"${j.id === only ? ' class="only"' : ''} title="${esc(j.name)} ${j.hex}: ${dabs(j)} dabs, ${j.cells.length} stacks, ${fmt(SK.lines[j.id] / 1000, 2)} m">`
    + `<span class="no">${i + 1}</span><span class="sw" style="background:${j.hex}"></span><span class="nm">${esc(j.name)} <em>${j.hex}</em></span><span class="tg">${dabs(j)} · ${fmt(SK.lines[j.id] / 1000, 1)} m</span></li>`).join('')
    + (SK.out.length ? `<li class="sep">Into another jar, the canon · ${SK.out.length}</li>` + SK.out.map(q => `<li class="gone" title="${q.hex}: ${fmt(q.line / 1000, 2)} m, under ${long / 10} cm — its dabs to ${esc(by[q.into]?.name)}, ΔE ${fmt(q.de, 1)}">`
      + `<span class="no"></span><span class="sw" style="background:${q.hex}"></span><span class="nm">→ ${esc(by[q.into]?.name)} <em>ΔE ${fmt(q.de, 0)}</em></span><span class="tg">${fmt(q.line / 1000, 2)} m</span></li>`).join('') : '');
  $('#stats').textContent = `${f.w / 10} × ${f.h / 10} cm · screen ${S.focus + 1}${pick !== null ? `, ${pick + 1} chosen` : ''} · ${n} jars · ${SK.dabs} dabs`;
}

// ---------- the stage ----------
const V = { s: 1, x: 0, y: 0, fit: true }, HEAD = 22;
const cellsOf = rc => { const n = BASE && S.view !== 'picture' ? 3 : 1, w = rc.width / n; return Array.from({ length: n }, (_, i) => ({ i, x: i * w, w, h: rc.height })); };
// a dab as GOGH lays it, flat: the brush's width, its ends round, a hair of the canvas between two in a column (est.)
const GAP = 0.6;
function dabsPath(g, j, X, Y, w) {
  g.beginPath();
  for (const c of j.cells) for (const [x, top, bot] of c.legs) {
    const L = top - bot - GAP, r = Math.min(w, L) / 2, m = (top + bot) / 2, a = Y(m + L / 2 - r), b = Y(m - L / 2 + r);
    g.moveTo(X(x), a); g.lineTo(X(x), b);
  }
}
function draw() {
  const cv = $('#cv'), dpr = devicePixelRatio || 1, rc = cv.getBoundingClientRect();
  if (!rc.width || !rc.height) return;
  cv.width = Math.round(rc.width * dpr); cv.height = Math.round(rc.height * dpr);
  const g = cv.getContext('2d'), f = formatOf(S.format), cells = cellsOf(rc), dark = S.ground === 'black', F = fieldOf(f);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = themeColor('--table', '#D9D4CA'); g.fillRect(0, 0, rc.width, rc.height);
  if (V.fit) { const pad = 18, c = cells[0]; V.s = Math.min((c.w - 2 * pad) / f.w, (c.h - 2 * pad - HEAD) / f.h); V.x = (c.w - f.w * V.s) / 2; V.y = HEAD + (c.h - HEAD - f.h * V.s) / 2; }
  for (const c of cells) {
    const sk = cells.length === 3 ? SL[c.i] : cur(), X = x => c.x + V.x + x * V.s, Y = y => V.y + (f.h - y) * V.s;
    g.save(); g.beginPath(); g.rect(c.x, 0, c.w, c.h); g.clip();
    g.save(); g.shadowColor = 'rgba(0,0,0,.22)'; g.shadowBlur = 14; g.shadowOffsetY = 3; g.fillStyle = BG[S.ground]; g.fillRect(X(0), Y(f.h), f.w * V.s, f.h * V.s); g.restore();
    g.save(); g.setLineDash([5, 4]); g.strokeStyle = dark ? 'rgba(236,232,225,.35)' : 'rgba(125,119,109,.55)'; g.lineWidth = 1;
    g.strokeRect(X((f.w - F.w) / 2), Y((f.h + F.h) / 2), F.w * V.s, F.h * V.s); g.restore();
    if (!BASE) {
      g.fillStyle = dark ? 'rgba(236,232,225,.6)' : themeColor('--mute', '#7D776D'); g.font = '13px "Helvetica Neue", Arial, sans-serif'; g.textAlign = 'center';
      g.fillText(`${f.w / 10} × ${f.h / 10} cm — open a picture on the left`, X(f.w / 2), Y(f.h / 2)); g.restore(); continue;
    }
    if (S.view === 'picture') { g.imageSmoothingEnabled = true; g.drawImage(BASE.photo, X(BASE.fit.left), Y(f.h - BASE.fit.top), BASE.W * V.s, BASE.R * V.s); g.restore(); continue; }
    if (sk) {
      const here = c.i === S.focus, o = here ? only : null, w = GEN.pitch * 0.96 * V.s;
      g.lineCap = 'round';
      if (S.view === 'drag') {                                     // the dabs thin, in their order: the brush's way through a jar's stacks, the air between them dotted
        for (const j of sk.pic.jars) { g.globalAlpha = 0.16; g.strokeStyle = j.hex; g.lineWidth = w; dabsPath(g, j, X, Y, GEN.pitch * 0.96); g.stroke(); }
        for (const j of sk.pic.jars) {
          if (o && j.id !== o) continue;
          g.globalAlpha = 1; g.strokeStyle = j.hex; g.lineWidth = Math.max(1, 0.5 * V.s); g.setLineDash([]); dabsPath(g, j, X, Y, 0); g.stroke();
          g.globalAlpha = 0.5; g.lineWidth = 1; g.setLineDash([2, 3]); g.beginPath();
          j.cells.forEach((q, i) => { const l = q.legs[0], p = j.cells[i - 1]?.legs.at(-1); if (p) { g.moveTo(X(p[0]), Y(p[2])); g.lineTo(X(l[0]), Y(l[1])); } });
          g.stroke(); g.setLineDash([]);
        }
      } else for (const j of sk.pic.jars) { g.globalAlpha = o && j.id !== o ? 0.16 : 1; g.strokeStyle = j.hex; g.lineWidth = w; dabsPath(g, j, X, Y, GEN.pitch * 0.96); g.stroke(); }
      g.globalAlpha = 1;
    }
    g.restore();
    if (cells.length < 3) continue;
    const chosen = c.i === pick, e = sk?.est, t = e && !e.fail ? ` · ≈ ${hm(e.seconds)}` : '';
    g.font = `${c.i === S.focus ? 600 : 400} 12px "SF Mono", ui-monospace, Menlo, monospace`; g.textAlign = 'left';
    g.fillStyle = chosen ? '#EB7A25' : c.i === S.focus ? themeColor('--ink', '#24221F') : themeColor('--mute', '#7D776D');
    g.fillText(`${c.i + 1} · ${S.slots[c.i]} colours${sk ? ` → ${sk.pic.jars.length} jars · ${sk.dabs} dabs${t}` : ''}${chosen ? ' · chosen' : ''}`, c.x + 12, 16);
    if (chosen) { g.save(); g.strokeStyle = '#EB7A25'; g.lineWidth = 2.5; g.strokeRect(c.x + 3, 3, c.w - 6, c.h - 6); g.restore(); }
    else if (c.i === S.focus) { g.save(); g.strokeStyle = 'rgba(125,119,109,.5)'; g.lineWidth = 1; g.setLineDash([4, 4]); g.strokeRect(c.x + 3.5, 3.5, c.w - 7, c.h - 7); g.restore(); }
  }
}
let raf = 0;
const kick = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; draw(); }); };
addEventListener('resize', kick);
addEventListener('rembrandt-night', kick);
const cv = $('#cv');
cv.addEventListener('wheel', e => {
  e.preventDefault();
  const r = cv.getBoundingClientRect(), cw = r.width / cellsOf(r).length, mx = (e.clientX - r.left) % cw, my = e.clientY - r.top, k = Math.exp(-e.deltaY * 0.0015);
  V.fit = false; V.x = mx - (mx - V.x) * k; V.y = my - (my - V.y) * k; V.s *= k; kick();
}, { passive: false });
let pan = null;
cv.addEventListener('pointerdown', e => { pan = { x: e.clientX, y: e.clientY, vx: V.x, vy: V.y }; cv.setPointerCapture(e.pointerId); cv.classList.add('drag'); });
cv.addEventListener('pointermove', e => { if (!pan || Math.hypot(e.clientX - pan.x, e.clientY - pan.y) < 4) return; V.fit = false; V.x = pan.vx + e.clientX - pan.x; V.y = pan.vy + e.clientY - pan.y; kick(); });
cv.addEventListener('pointerup', e => {
  const p = pan; pan = null; cv.classList.remove('drag');
  if (!p || Math.hypot(e.clientX - p.x, e.clientY - p.y) > 4 || !BASE || S.view === 'picture') return;
  const r = cv.getBoundingClientRect(), i = Math.min(2, Math.floor((e.clientX - r.left) / (r.width / 3)));
  choose(i);
});
function choose(i) {
  if (pick === i) { kick(); return; }
  pick = i; S.focus = i; only = null; save();
  $('#approveRead').innerHTML = '';
  panel(); kick();
}
cv.addEventListener('dblclick', () => { V.fit = true; kick(); });

// ---------- the keys ----------
$('#formats').onclick = e => { const b = e.target.closest('[data-f]'); if (!b || b.dataset.f === S.format) return; S.format = b.dataset.f; save(); V.fit = true; build(); };
$('#kSl').oninput = () => { $('#kNow').textContent = $('#kSl').value; };
$('#kSl').onchange = () => { S.slots[S.focus] = kOf($('#kSl').value); save(); buildSlot(S.focus); };
$('#kMarks').onclick = e => { const b = e.target.closest('[data-slot]'); if (b) choose(+b.dataset.slot); };
document.querySelectorAll('[data-bg]').forEach(b => b.onclick = () => { S.ground = b.dataset.bg; save(); panel(); kick(); });
$('#views').onclick = e => { const b = e.target.closest('[data-view]'); if (!b) return; S.view = b.dataset.view; save(); V.fit = true; panel(); kick(); };
$('#jarList').onclick = e => { const li = e.target.closest('li[data-id]'); if (!li) return; only = only === li.dataset.id ? null : li.dataset.id; [...$('#jarList').children].forEach(q => q.classList.toggle('only', q.dataset.id === only)); kick(); };
$('#file').onchange = e => { const f = e.target.files?.[0]; if (f) { keepPic(f, f.name); openPic(f, f.name); } e.target.value = ''; };
for (const el of [$('#drop'), $('#stage')]) {
  el.addEventListener('dragover', e => { e.preventDefault(); $('#drop').classList.add('over'); });
  el.addEventListener('dragleave', () => $('#drop').classList.remove('over'));
  el.addEventListener('drop', e => { e.preventDefault(); $('#drop').classList.remove('over'); const f = e.dataTransfer?.files?.[0]; if (f && /^image\//.test(f.type)) { keepPic(f, f.name); openPic(f, f.name); } });
}

// APPROVE: the sketch as a file, for the final work — GOGH's json (pic) and what made it; the owner saves it in Rembrandt/GOGH/
export function approvalOf(src, sk, s, when = new Date()) {
  const by = Object.fromEntries(sk.pic.jars.map(j => [j.id, j.name]));
  return {
    tool: 'GEN-V', note: 'A sketch in dabs the owner approved, for GOGH: the format, the colours, the jars and every dab. Flat colours, no brush model (est.). GOGH/generator/genvpic.py makes it a card of GOGH\'s library.',
    approved: when.toISOString(), image: { name: src.name, w: src.w, h: src.h, box: [src.box.x, src.box.y, src.box.w, src.box.h].map(v => Math.round(v)), ground: src.ground },
    format: s.format, colours: sk.k, screen: s.screen, ground: s.ground, made: sk.made, picture_mm: [sk.W, sk.R], columns: sk.fit.N, left: sk.fit.left, top: sk.fit.top,
    jars: sk.pic.jars.map(j => ({ name: j.name, hex: j.hex, dabs: j.cells.reduce((a, c) => a + c.legs.length, 0), line_m: +(sk.lines[j.id] / 1000).toFixed(2) })),
    out: sk.out.map(q => ({ hex: q.hex, line_m: +(q.line / 1000).toFixed(2), into: by[q.into], de: +q.de.toFixed(1) })),
    counts: { dabs: sk.dabs, stacks: sk.cells, ...(sk.est && !sk.est.fail ? { brush_m: +(sk.est.mm / 1000).toFixed(1), lines: sk.est.lines, dips: sk.est.dips, minutes_est: Math.round(sk.est.seconds / 60) } : {}) },
    gen: GEN, dab: DAB, pic: sk.pic,
  };
}
$('#btnApprove').onclick = async () => {
  const SK = pick !== null ? SL[pick] : null;
  if (!SK) return;
  const name = `${SRC.name.replace(/\.[^.]+$/, '')} · GEN-V · ${S.format} · ${SK.k}.json`, body = JSON.stringify(approvalOf(SRC, SK, { ...S, screen: pick + 1 }), null, 1);
  const said = t => { $('#approveRead').innerHTML = t; };
  if (window.showSaveFilePicker) {
    try {
      const h = await showSaveFilePicker({ id: 'genv', suggestedName: name, types: [{ description: 'GEN-V sketch', accept: { 'application/json': ['.json'] } }] }), w = await h.createWritable();
      await w.write(body); await w.close();
      return said(`Approved: <b>${esc(h.name)}</b>. Tell Claude: "GEN-V, ${esc(h.name)}" — and the picture itself in GOGH/.`);
    } catch (e) { if (e?.name === 'AbortError') return; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body], { type: 'application/json' })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  said(`Approved: <b>${esc(name)}</b> in Downloads — put it in Rembrandt/GOGH/ and tell Claude.`);
};

lampSwitch($('#lamp'));
panel(); draw();
lastPic().then(p => { if (p?.blob && !SRC) openPic(p.blob, p.name); });
// headless checks and the final work: the page's state (Claude's, never a run)
globalThis.__GENV = { get SRC() { return SRC; }, get BASE() { return BASE; }, get SL() { return SL; }, S, build, approvalOf };
