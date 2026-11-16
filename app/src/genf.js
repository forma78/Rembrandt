// GEN-F's page: a picture in, its sketch in FORM-G's legs, APPROVE (genfplan.js). The owner, 2026-11-16: "so that I see a first sketch, approve it and give it to
// you for the final work". Two keys alone — the format, the number of colours; the rest FORM-G's own. Moves nothing on the machine: FORM-G's plotRun only counts
// the run's time, the cup at hand, the canvas in the middle of the reach (est.).
import { GEN, GEN_FORMATS, formatOf, fieldOf, fitOf, bareMask, boxOf, binsOf, sketchOf, lineOf } from './genfplan.js';
import { passesOf, rowsOf, R3, FORMG } from './formgplan.js';
import { plotRun, DEFAULTS, ELBOW_HOVER } from './strokes.js';
import { reach } from './machine.js';
import { cupOf } from './ink.js';
import { lampSwitch, themeColor } from './lamp.js';
import './ui.js';

const $ = s => document.querySelector(s), KEEP = 'rembrandt.genf.v01';
const fmt = (v, d = 1) => Number(v).toFixed(d), esc = v => String(v ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const hm = t => { const m = Math.round((t || 0) / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`; };
const S = { format: GEN_FORMATS[0].id, k: 40, view: 'sketch' };
try { Object.assign(S, JSON.parse(localStorage.getItem(KEEP) || 'null') ?? {}); } catch { }
if (!GEN_FORMATS.some(f => f.id === S.format)) S.format = GEN_FORMATS[0].id;
S.k = Math.min(GEN.colours[1], Math.max(GEN.colours[0], Math.round(+S.k) || 40));
const save = () => { try { localStorage.setItem(KEEP, JSON.stringify(S)); } catch { } };

// ---------- the picture, kept in this browser so a reload keeps it ----------
const idb = () => new Promise((ok, no) => { const r = indexedDB.open('rembrandt.genf', 1); r.onupgradeneeded = () => r.result.createObjectStore('pic'); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
async function keepPic(blob, name) { try { (await idb()).transaction('pic', 'readwrite').objectStore('pic').put({ blob, name }, 'last'); } catch { } }
async function lastPic() { try { const db = await idb(); return await new Promise(ok => { const r = db.transaction('pic').objectStore('pic').get('last'); r.onsuccess = () => ok(r.result ?? null); r.onerror = () => ok(null); }); } catch { return null; } }
const canvasOf = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

let SRC = null, SK = null, only = null, THUMB = null;
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
  V.fit = true;
  build();
}

// ---------- the sketch ----------
function build() {
  if (!SRC) { SK = null; panel(); draw(); return; }
  const f = formatOf(S.format), fit = fitOf(f, SRC.box.w, SRC.box.h), W = fit.N * GEN.pitch, R = fit.R;
  const g = canvasOf(W, R).getContext('2d', { willReadFrequently: true });
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(SRC.img, SRC.box.x, SRC.box.y, SRC.box.w, SRC.box.h, 0, 0, W, R);
  const img = g.getImageData(0, 0, W, R), rgba = img.data, mask = new Uint8Array(W * R), wk = SRC.work, wb = SRC.wb;
  for (let y = 0; y < R; y++) for (let x = 0; x < W; x++) {                    // the ground as the whole picture had it, not as the crop's border would
    const wx = Math.min(wk.w - 1, Math.floor(wb.x + (x + 0.5) * wb.w / W)), wy = Math.min(wk.h - 1, Math.floor(wb.y + (y + 0.5) * wb.h / R)), i = y * W + x;
    mask[i] = wk.mask[wy * wk.w + wx] || rgba[4 * i + 3] < 128 ? 1 : 0;
  }
  const B = binsOf(rgba, mask, fit.N, R), base = SRC.name.replace(/\.[^.]+$/, '');
  SK = { f, fit, W, R, ...sketchOf(B, fit, f, S.k, { id: 'gen-f', title: base }), est: null };
  for (let i = 0; i < W * R; i++) if (mask[i]) rgba[4 * i + 3] = 0;           // the Picture view: the ground off
  SK.photo = canvasOf(W, R); SK.photo.getContext('2d').putImageData(img, 0, 0);
  const all = SK.pic.jars.flatMap(j => j.cells.flatMap(c => c.legs)), line = lineOf(SK.pic);
  SK.legs = all.length; SK.short = all.filter(l => Math.abs(l[2] - l[1]) < 12).length;
  SK.lines = Object.fromEntries(SK.pic.jars.map(j => [j.id, line(j)]));
  only = null;
  panel(); draw();
  setTimeout(estimate, 20);
}
// FORM-G's run of it, counted: its list, its rows as real 3's, plotRun — the time, the dips (est.); nothing sent
function estimate() {
  const sk = SK; if (!sk) return;
  try {
    const P = passesOf(sk.pic), R = rowsOf(sk.pic, P, R3.every, FORMG.lap, false, { slack: R3.slack, j3: R3.j3 }), W = reach();
    const here = { x: (W.x.min + W.x.max) / 2, y: (W.y.min + W.y.max) / 2 };
    const r = plotRun({ ...DEFAULTS, speed: 25, travel: 100, tail: 3, lift: true, ink: true, snake: true, pause: false, cup: cupOf({ hand: { on: true } }), hover: ELBOW_HOVER, press: 0, noDipUnder: 0, rows: R.ps.length, here },
      R.groups.map((g, k) => ({ key: 'DRAG', ps: g.map(i => R.ps[i]), why: k ? 'the next jar' : null })));
    sk.est = { seconds: r.seconds, dips: r.dips, lines: P.length, n1: P.filter(q => q.layer === 1).length, mm: P.reduce((a, q) => a + q.mm, 0) };
  } catch (e) { sk.est = { fail: String(e?.message || e) }; }
  if (sk === SK) panel();
}

// ---------- the panel ----------
function panel() {
  const f = formatOf(S.format), F = fieldOf(f);
  $('#formats').innerHTML = GEN_FORMATS.map(q => `<button class="btn${q.id === S.format ? ' on' : ''}" data-f="${q.id}" title="A canvas ${q.w / 10} × ${q.h / 10} cm: ${q.w / 10} across Y, ${q.h / 10} along X, as FORM-G lays it">${q.w / 10} × ${q.h / 10}</button>`).join('');
  $('#fieldRead').innerHTML = `The field the brush reaches on it: ${F.w} × ${F.h} mm (est.)`
    + (SK ? `; the picture <b>${SK.W} × ${SK.R} mm</b>, ${SK.fit.N} columns 5 mm apart, in the middle.` : '.');
  $('#kNow').textContent = S.k; $('#kSl').value = S.k;
  $('#kSay').textContent = SK ? `→ ${SK.pic.jars.length} jars` : '';
  [...$('#views').children].forEach(b => b.classList.toggle('on', b.dataset.view === S.view));
  $('#btnApprove').disabled = !SK;
  if (!SK) { $('#sketchRead').innerHTML = 'Open a picture on the left.'; $('#jarList').innerHTML = ''; $('#jarsHint').textContent = ''; $('#stats').textContent = `${f.w / 10} × ${f.h / 10} cm`; return; }
  const long = Math.max(f.w, f.h), e = SK.est, n = SK.pic.jars.length, two = SK.pic.jars.filter(j => j.coats === 2).length;
  $('#sketchRead').innerHTML = `<b>${SK.asked}</b> colours asked, ${SK.made} paint a leg; <b>${n} jars</b> by the canon of the jars (a jar with less line than the canvas's long side, ${long / 10} cm, into its nearest; ΔE 25 at most)`
    + `${SK.kept.length ? `, ${SK.kept.length} short kept, nothing near` : ''}. ${SK.legs} legs, ${SK.short} under 12 mm; `
    + (e ? (e.fail ? `<span class="warn">the time not counted: ${esc(e.fail)}</span>` : `${fmt(e.mm / 1000, 1)} m of brush, ${e.lines} lines of the list (${e.n1} the first layer, ${two} jars two coats), ${e.dips} dips, <b>≈ ${hm(e.seconds)}</b> on the machine, the jars' changes by hand apart.`) : 'counting the time …')
    + ' A sketch: flat colours, no brush model (est.).';
  $('#jarsHint').textContent = `${n}, light to dark`;
  const by = Object.fromEntries(SK.pic.jars.map(j => [j.id, j]));
  $('#jarList').innerHTML = SK.pic.jars.map((j, i) => `<li data-id="${j.id}"${j.id === only ? ' class="only"' : ''} title="${esc(j.name)} ${j.hex}: ${j.cells.length} cells, ${j.cells.reduce((a, c) => a + c.legs.length, 0)} legs, ${fmt(SK.lines[j.id] / 1000, 2)} m${j.coats === 2 ? ', two coats' : ''}">`
    + `<span class="no">${i + 1}</span><span class="sw" style="background:${j.hex}"></span><span class="nm">${esc(j.name)} <em>${j.hex}</em></span><span class="tg">${fmt(SK.lines[j.id] / 1000, 1)} m${j.coats === 2 ? ' ×2' : ''}</span></li>`).join('')
    + (SK.out.length ? `<li class="sep">Into another jar, the canon · ${SK.out.length}</li>` + SK.out.map(q => `<li class="gone" title="${q.hex}:${fmt(q.line / 1000, 2)} m, under ${long / 10} cm — its legs to ${esc(by[q.into]?.name)}, ΔE ${fmt(q.de, 1)}">`
      + `<span class="no"></span><span class="sw" style="background:${q.hex}"></span><span class="nm">→ ${esc(by[q.into]?.name)} <em>ΔE ${fmt(q.de, 0)}</em></span><span class="tg">${fmt(q.line / 1000, 2)} m</span></li>`).join('') : '');
  $('#stats').textContent = `${f.w / 10} × ${f.h / 10} cm · ${n} jars · ${SK.legs} legs`;
}

// ---------- the stage ----------
const V = { s: 1, x: 0, y: 0, fit: true };
function draw() {
  const cv = $('#cv'), dpr = devicePixelRatio || 1, rc = cv.getBoundingClientRect();
  if (!rc.width || !rc.height) return;
  cv.width = Math.round(rc.width * dpr); cv.height = Math.round(rc.height * dpr);
  const g = cv.getContext('2d'), f = formatOf(S.format);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = themeColor('--table', '#D9D4CA'); g.fillRect(0, 0, rc.width, rc.height);
  if (V.fit) { const pad = 28; V.s = Math.min((rc.width - 2 * pad) / f.w, (rc.height - 2 * pad) / f.h); V.x = (rc.width - f.w * V.s) / 2; V.y = (rc.height - f.h * V.s) / 2; }
  const X = x => V.x + x * V.s, Y = y => V.y + (f.h - y) * V.s;
  g.save(); g.shadowColor = 'rgba(0,0,0,.22)'; g.shadowBlur = 14; g.shadowOffsetY = 3; g.fillStyle = '#F6F3EC'; g.fillRect(X(0), Y(f.h), f.w * V.s, f.h * V.s); g.restore();
  const F = fieldOf(f);
  g.save(); g.setLineDash([5, 4]); g.strokeStyle = 'rgba(125,119,109,.55)'; g.lineWidth = 1;
  g.strokeRect(X((f.w - F.w) / 2), Y((f.h + F.h) / 2), F.w * V.s, F.h * V.s); g.restore();
  if (!SK) {
    g.fillStyle = themeColor('--mute', '#7D776D'); g.font = '13px "Helvetica Neue", Arial, sans-serif'; g.textAlign = 'center';
    g.fillText(`${f.w / 10} × ${f.h / 10} cm — open a picture on the left`, X(f.w / 2), Y(f.h / 2)); return;
  }
  if (S.view === 'picture') { g.imageSmoothingEnabled = true; g.drawImage(SK.photo, X(SK.fit.left), Y(f.h - SK.fit.top), SK.W * V.s, SK.R * V.s); return; }
  const legs = (j, w, a) => {
    g.globalAlpha = a; g.strokeStyle = j.hex; g.lineWidth = w; g.lineCap = 'butt';
    g.beginPath();
    for (const c of j.cells) for (const [x, y1, y2] of c.legs) { g.moveTo(X(x), Y(y1)); g.lineTo(X(x), Y(y2)); }
    g.stroke();
  };
  const snake = (j, a) => {
    g.globalAlpha = a; g.strokeStyle = j.hex; g.lineWidth = Math.max(1, 0.35 * V.s); g.lineCap = 'round'; g.lineJoin = 'round';
    for (const c of j.cells) { g.beginPath(); c.legs.forEach(([x, y1, y2], i) => { if (i) g.lineTo(X(x), Y(y1)); else g.moveTo(X(x), Y(y1)); g.lineTo(X(x), Y(y2)); }); g.stroke(); }
  };
  const W5 = GEN.pitch * V.s + 0.4;
  if (S.view === 'drag') { for (const j of SK.pic.jars) legs(j, W5, 0.16); for (const j of SK.pic.jars) if (!only || j.id === only) snake(j, 1); }
  else { for (const j of SK.pic.jars) legs(j, W5, only && j.id !== only ? 0.16 : 1); if (only) legs(SK.pic.jars.find(j => j.id === only), W5, 1); }
  g.globalAlpha = 1;
}
let raf = 0;
const kick = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; draw(); }); };
addEventListener('resize', kick);
addEventListener('rembrandt-night', kick);
const cv = $('#cv');
cv.addEventListener('wheel', e => {
  e.preventDefault();
  const r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, k = Math.exp(-e.deltaY * 0.0015);
  V.fit = false; V.x = mx - (mx - V.x) * k; V.y = my - (my - V.y) * k; V.s *= k; kick();
}, { passive: false });
let pan = null;
cv.addEventListener('pointerdown', e => { pan = { x: e.clientX, y: e.clientY, vx: V.x, vy: V.y }; cv.setPointerCapture(e.pointerId); cv.classList.add('drag'); });
cv.addEventListener('pointermove', e => { if (!pan) return; V.fit = false; V.x = pan.vx + e.clientX - pan.x; V.y = pan.vy + e.clientY - pan.y; kick(); });
cv.addEventListener('pointerup', () => { pan = null; cv.classList.remove('drag'); });
cv.addEventListener('dblclick', () => { V.fit = true; kick(); });

// ---------- the keys ----------
$('#formats').onclick = e => { const b = e.target.closest('[data-f]'); if (!b || b.dataset.f === S.format) return; S.format = b.dataset.f; save(); V.fit = true; build(); };
$('#kSl').oninput = () => { $('#kNow').textContent = $('#kSl').value; };
$('#kSl').onchange = () => { S.k = +$('#kSl').value; save(); build(); };
$('#views').onclick = e => { const b = e.target.closest('[data-view]'); if (!b) return; S.view = b.dataset.view; save(); panel(); kick(); };
$('#jarList').onclick = e => { const li = e.target.closest('li[data-id]'); if (!li) return; only = only === li.dataset.id ? null : li.dataset.id; [...$('#jarList').children].forEach(q => q.classList.toggle('only', q.dataset.id === only)); kick(); };
$('#file').onchange = e => { const f = e.target.files?.[0]; if (f) { keepPic(f, f.name); openPic(f, f.name); } e.target.value = ''; };
for (const el of [$('#drop'), $('#stage')]) {
  el.addEventListener('dragover', e => { e.preventDefault(); $('#drop').classList.add('over'); });
  el.addEventListener('dragleave', () => $('#drop').classList.remove('over'));
  el.addEventListener('drop', e => { e.preventDefault(); $('#drop').classList.remove('over'); const f = e.dataTransfer?.files?.[0]; if (f && /^image\//.test(f.type)) { keepPic(f, f.name); openPic(f, f.name); } });
}

// APPROVE: the sketch as a file, for the generator's final work — FORM-G's json (pic) and what made it; the owner saves it in Rembrandt/GEN-F/
export function approvalOf(src, sk, s, when = new Date()) {
  const by = Object.fromEntries(sk.pic.jars.map(j => [j.id, j.name]));
  return {
    tool: 'GEN-F', note: 'A sketch the owner approved, for the final work in FORM-G/generator: the format, the colours, the jars and every leg. Flat colours, no brush model (est.).',
    approved: when.toISOString(), image: { name: src.name, w: src.w, h: src.h, box: [src.box.x, src.box.y, src.box.w, src.box.h].map(v => Math.round(v)), ground: src.ground },
    format: s.format, colours: s.k, made: sk.made, picture_mm: [sk.W, sk.R], columns: sk.fit.N, left: sk.fit.left, top: sk.fit.top,
    jars: sk.pic.jars.map(j => ({ name: j.name, hex: j.hex, coats: j.coats, line_m: +(sk.lines[j.id] / 1000).toFixed(2) })),
    out: sk.out.map(q => ({ hex: q.hex, line_m: +(q.line / 1000).toFixed(2), into: by[q.into], de: +q.de.toFixed(1) })),
    counts: { legs: sk.legs, under_12mm: sk.short, ...(sk.est && !sk.est.fail ? { brush_m: +(sk.est.mm / 1000).toFixed(1), lines: sk.est.lines, dips: sk.est.dips, minutes_est: Math.round(sk.est.seconds / 60) } : {}) },
    gen: GEN, pic: sk.pic,
  };
}
$('#btnApprove').onclick = async () => {
  if (!SK) return;
  const name = `${SRC.name.replace(/\.[^.]+$/, '')} · GEN-F · ${S.format} · ${S.k}.json`, body = JSON.stringify(approvalOf(SRC, SK, S), null, 1);
  const said = t => { $('#approveRead').innerHTML = t; };
  if (window.showSaveFilePicker) {
    try {
      const h = await showSaveFilePicker({ id: 'genf', suggestedName: name, types: [{ description: 'GEN-F sketch', accept: { 'application/json': ['.json'] } }] }), w = await h.createWritable();
      await w.write(body); await w.close();
      return said(`Approved: <b>${esc(h.name)}</b>. Tell Claude: "GEN-F, ${esc(h.name)}" — and the picture itself in FORM-G/.`);
    } catch (e) { if (e?.name === 'AbortError') return; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body], { type: 'application/json' })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  said(`Approved: <b>${esc(name)}</b> in Downloads — put it in Rembrandt/GEN-F/ and tell Claude.`);
};

lampSwitch($('#lamp'));
panel(); draw();
lastPic().then(p => { if (p?.blob && !SRC) openPic(p.blob, p.name); });
