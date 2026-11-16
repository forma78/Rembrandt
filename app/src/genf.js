// GEN-F's page: a picture in, its sketch in FORM-G's legs, APPROVE (genfplan.js). The owner, 2026-11-16: "so that I see a first sketch, approve it and give it to
// you for the final work". Two keys alone — the format, the number of colours; the rest FORM-G's own. Moves nothing on the machine: FORM-G's plotRun only counts
// the run's time, the cup at hand, the canvas in the middle of the reach (est.).
// Three screens side by side, each its own number of colours (the owner, 2026-11-16, `GEN-F/Screenshot 2026-11-16 at 2.16.12 PM.png`, 1 · 2 · 3 marked on the
// stage and on the slider: "as I move the colours' slider I want to see a table to compare, screens 1, 2 and 3; and APPROVE only when one of the three is
// selected … I simply cannot tell: 17 colours, say, 29 or 45?"): a click on a screen or its mark selects it, the slider moves the selected one's colours, the
// zoom and the drag the same on all three; APPROVE that screen's sketch.
import { GEN, BLUR, GEN_FORMATS, formatOf, fieldOf, fitOf, bareMask, boxOf, binsOf, sketchOf, blurOf, lineOf } from './genfplan.js';
import { passesOf, rowsOf, brushRuns, R3, FORMG } from './formgplan.js';
import { plotRun, DEFAULTS, ELBOW_HOVER } from './strokes.js';
import { reach } from './machine.js';
import { cupOf } from './ink.js';
import { lampSwitch, themeColor } from './lamp.js';
import './ui.js';

const $ = s => document.querySelector(s), KEEP = 'rembrandt.genf.v01';
const fmt = (v, d = 1) => Number(v).toFixed(d), esc = v => String(v ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const hm = t => { const m = Math.round((t || 0) / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`; };
const S = { format: GEN_FORMATS[0].id, slots: [17, 29, 45], focus: 1, view: 'sketch', ground: 'white', blur: 0, alpha: BLUR.alpha * 100 };   // the owner's own three
// the ground, OPM-N's (inka.js, BG): the bare canvas's colour on the screen, not painted (the owner, 2026-11-16: "only the preview on a black ground, as an option")
const BG = { white: '#FBFAF7', black: '#161514' };
try { Object.assign(S, JSON.parse(localStorage.getItem(KEEP) || 'null') ?? {}); } catch { }
if (!GEN_FORMATS.some(f => f.id === S.format)) S.format = GEN_FORMATS[0].id;
if (!BG[S.ground]) S.ground = 'white';
const kOf = v => Math.min(GEN.colours[1], Math.max(GEN.colours[0], Math.round(+v) || 29));
S.slots = [0, 1, 2].map(i => kOf(Array.isArray(S.slots) ? S.slots[i] : [17, 29, 45][i]));
S.focus = [0, 1, 2].includes(S.focus) ? S.focus : 1;
delete S.k;
S.blur = Math.min(BLUR.max, Math.max(0, Math.round((+S.blur || 0) / BLUR.step) * BLUR.step));
S.alpha = Math.min(100, Math.max(10, Math.round((+S.alpha || BLUR.alpha * 100) / 10) * 10));
const save = () => { try { localStorage.setItem(KEEP, JSON.stringify(S)); } catch { } };

// ---------- the picture, kept in this browser so a reload keeps it ----------
const idb = () => new Promise((ok, no) => { const r = indexedDB.open('rembrandt.genf', 1); r.onupgradeneeded = () => r.result.createObjectStore('pic'); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
async function keepPic(blob, name) { try { (await idb()).transaction('pic', 'readwrite').objectStore('pic').put({ blob, name }, 'last'); } catch { } }
async function lastPic() { try { const db = await idb(); return await new Promise(ok => { const r = db.transaction('pic').objectStore('pic').get('last'); r.onsuccess = () => ok(r.result ?? null); r.onerror = () => ok(null); }); } catch { return null; } }
const canvasOf = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

let SRC = null, BASE = null, SL = [null, null, null], pick = null, only = null, THUMB = null;   // the picture on the canvas; the three screens' sketches; the one chosen, for APPROVE
const cur = () => SL[S.focus];   // the screen the slider and the panel are on
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
  V.fit = true; pick = null;   // a new picture: no screen chosen yet
  build();
}

// ---------- the sketches ----------
// the picture at 1 px a mm on the canvas, once for the three screens
function build() {
  if (!SRC) { BASE = null; SL = [null, null, null]; panel(); draw(); return; }
  const f = formatOf(S.format), fit = fitOf(f, SRC.box.w, SRC.box.h), W = fit.N * GEN.pitch, R = fit.R;
  const g = canvasOf(W, R).getContext('2d', { willReadFrequently: true });
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(SRC.img, SRC.box.x, SRC.box.y, SRC.box.w, SRC.box.h, 0, 0, W, R);
  const img = g.getImageData(0, 0, W, R), rgba = img.data, mask = new Uint8Array(W * R), wk = SRC.work, wb = SRC.wb;
  for (let y = 0; y < R; y++) for (let x = 0; x < W; x++) {                    // the ground as the whole picture had it, not as the crop's border would
    const wx = Math.min(wk.w - 1, Math.floor(wb.x + (x + 0.5) * wb.w / W)), wy = Math.min(wk.h - 1, Math.floor(wb.y + (y + 0.5) * wb.h / R)), i = y * W + x;
    mask[i] = wk.mask[wy * wk.w + wx] || rgba[4 * i + 3] < 128 ? 1 : 0;
  }
  BASE = { f, fit, W, R, B: binsOf(rgba, mask, fit.N, R), title: SRC.name.replace(/\.[^.]+$/, '') };
  for (let i = 0; i < W * R; i++) if (mask[i]) rgba[4 * i + 3] = 0;           // the Picture view: the ground off
  BASE.photo = canvasOf(W, R); BASE.photo.getContext('2d').putImageData(img, 0, 0);
  only = null;
  SL = [0, 1, 2].map(slotOf);
  blurNow();
}
// a screen's sketch: its own number of colours, on the same picture
function slotOf(i) {
  const k = S.slots[i], sk = { ...BASE, k, ...sketchOf(BASE.B, BASE.fit, BASE.f, k, { id: 'gen-f', title: BASE.title }), est: null, uest: null };
  const all = sk.pic.jars.flatMap(j => j.cells.flatMap(c => c.legs)), line = lineOf(sk.pic);
  sk.legs = all.length; sk.short = all.filter(l => Math.abs(l[2] - l[1]) < 12).length;
  sk.lines = Object.fromEntries(sk.pic.jars.map(j => [j.id, line(j)]));
  return sk;
}
function blurOne(sk) {
  sk.under = blurOf(sk.B, sk.fit, sk.f, sk, S.blur, BG[S.ground], { alpha: S.alpha / 100 });
  if (sk.under) { const line = lineOf(sk.under.pic); sk.ulines = Object.fromEntries(sk.under.pic.jars.map(j => [j.id, line(j)])); }
  sk.est = null; sk.uest = null;
}
// the motion blur, a layer under the picture (genfplan.js, blurOf): again on its slider or the ground, on every screen
function blurNow() {
  if (!BASE) return;
  SL.forEach(blurOne);
  if (only && !cur()?.pic.jars.concat(cur()?.under?.pic.jars ?? []).some(j => j.id === only)) only = null;
  panel(); draw();
  estimateAll();
}
// one screen again, its slider moved
function buildSlot(i) {
  if (!BASE) return;
  SL[i] = slotOf(i); blurOne(SL[i]); only = null;
  panel(); draw();
  estimateAll();
}
// FORM-G's run of it, counted: its list, its rows as real 3's, plotRun — the time, the dips (est.); nothing sent
// a dip from the cup at hand, s: what a dip adds to FORM-G's own run, measured on it for the racing face, the classic's v.3 and the headlight (5.2 … 5.6, est.)
const DIP_S = 5.5;
function runOf(pic, frame = formatOf(S.format).frame) {   // a new frame's canvas: no Here, so nothing pressed into today's walls — and then no dip counted, so its dips added
  try {
    const P = passesOf(pic), R = rowsOf(pic, P, R3.every, FORMG.lap, false, { slack: R3.slack, j3: R3.j3 }), W = reach();
    const here = { x: (W.x.min + W.x.max) / 2, y: (W.y.min + W.y.max) / 2 };
    const r = plotRun({ ...DEFAULTS, speed: 25, travel: 100, tail: 3, lift: true, ink: true, snake: true, pause: false, cup: cupOf({ hand: { on: true } }), hover: ELBOW_HOVER, press: 0, noDipUnder: 0, rows: R.ps.length, ...(frame ? {} : { here }) },
      R.groups.map((g, k) => ({ key: 'DRAG', ps: g.map(i => R.ps[i]), why: k ? 'the next jar' : null })));
    const dips = frame ? brushRuns(P, R3.every, FORMG.lap, false, R3.slack).filter(q => q.dip).length : r.dips;
    return { seconds: r.seconds + (frame ? dips * DIP_S : 0), dips, lines: P.length, n1: P.filter(q => q.layer === 1).length, mm: P.reduce((a, q) => a + q.mm, 0) };
  } catch (e) { return { fail: String(e?.message || e) }; }
}
let ESTQ = 0;
function estimateAll() {
  const q = ++ESTQ, order = [S.focus, ...[0, 1, 2].filter(i => i !== S.focus)];   // the slider's screen first
  const next = n => {
    if (q !== ESTQ || n >= order.length) return;
    const sk = SL[order[n]];
    if (sk && !sk.est) { sk.est = runOf(sk.pic); sk.uest = sk.under ? runOf(sk.under.pic) : null; panel(); draw(); }
    setTimeout(() => next(n + 1), 10);
  };
  setTimeout(() => next(0), 20);
}

// ---------- the panel ----------
function panel() {
  const f = formatOf(S.format), F = fieldOf(f), SK = cur();
  $('#formats').innerHTML = GEN_FORMATS.map(q => `<button class="btn${q.id === S.format ? ' on' : ''}${q.frame ? ' frame' : ''}" data-f="${q.id}" title="A canvas ${q.w / 10} × ${q.h / 10} cm: ${q.w / 10} across Y, ${q.h / 10} along X, as FORM-G lays it${q.frame ? ' — for a new frame: today the brush reaches ${GEN.across} × ${GEN.along} mm; a sketch to look at, nothing to run' : ''}">${q.w / 10} × ${q.h / 10}${q.frame ? '<i>new frame</i>' : ''}</button>`).join('');
  $('#fieldRead').innerHTML = (f.frame ? `<span class="warn">For a new frame:</span> today the brush reaches ${GEN.across} × ${GEN.along} mm; the field here the canvas itself, 30 mm in, ${F.w} × ${F.h} mm (est.)` : `The field the brush reaches on it: ${F.w} × ${F.h} mm (est.)`)
    + (SK ? `; the picture <b>${SK.W} × ${SK.R} mm</b>, ${SK.fit.N} columns 5 mm apart, in the middle.` : '.');
  $('#kNow').textContent = S.slots[S.focus]; $('#kSl').value = S.slots[S.focus];
  $('#kSay').textContent = `screen ${S.focus + 1}${SK ? ` → ${SK.pic.jars.length} jars` : ''}`;
  // the three screens' marks under the slider, 1 2 3 (his drawing): each at its own number of colours; a click selects that screen
  const lo = GEN.colours[0], hi = GEN.colours[1];
  $('#kMarks').innerHTML = S.slots.map((k, i) => `<b data-slot="${i}" class="${i === S.focus ? 'on' : ''}${i === pick ? ' pick' : ''}" style="left:calc(9px + (100% - 18px) * ${(k - lo) / (hi - lo)})" title="Screen ${i + 1}: ${k} colours${SL[i] ? ` → ${SL[i].pic.jars.length} jars` : ''} — a click selects it">${i + 1}</b>`).join('');
  $('#bNow').textContent = S.blur ? `${S.blur} mm` : 'off'; $('#bSl').value = S.blur;
  $('#aNow').textContent = `${S.alpha} %`; $('#aSl').value = S.alpha; $('#aSl').disabled = !S.blur;
  [...$('#views').children].forEach(b => b.classList.toggle('on', b.dataset.view === S.view));
  document.querySelectorAll('[data-bg]').forEach(b => b.classList.toggle('on', b.dataset.bg === S.ground));
  const ok = pick !== null && !!SL[pick];
  $('#btnApprove').disabled = !ok;
  $('#btnApprove').textContent = ok ? `APPROVE ${pick + 1} · ${SL[pick].k} colours` : 'APPROVE';
  if (BASE && !ok && !/Approved/.test($('#approveRead').textContent)) $('#approveRead').innerHTML = 'Choose a screen first — 1, 2 or 3: a click on it, or on its mark under the slider.';
  if (!SK) { $('#sketchRead').innerHTML = 'Open a picture on the left.'; $('#jarList').innerHTML = ''; $('#jarsHint').textContent = ''; $('#stats').textContent = `${f.w / 10} × ${f.h / 10} cm`; return; }
  const long = Math.max(f.w, f.h), e = SK.est, n = SK.pic.jars.length, two = SK.pic.jars.filter(j => j.coats === 2).length;
  $('#sketchRead').innerHTML = `<b>Screen ${S.focus + 1}:</b> <b>${SK.asked}</b> colours asked, ${SK.made} paint a leg; <b>${n} jars</b> by the canon of the jars (a jar with less line than the canvas's long side, ${long / 10} cm, into its nearest; ΔE 25 at most)`
    + `${SK.kept.length ? `, ${SK.kept.length} short kept, nothing near` : ''}. ${SK.legs} legs, ${SK.short} under 12 mm; `
    + (e ? (e.fail ? `<span class="warn">the time not counted: ${esc(e.fail)}</span>` : `${fmt(e.mm / 1000, 1)} m of brush, ${e.lines} lines of the list (${e.n1} the first layer, ${two} jars two coats), ${e.dips} dips, <b>≈ ${hm(e.seconds)}</b> on the machine, the jars' changes by hand apart.`) : 'counting the time …')
    + ' A sketch: flat colours, no brush model (est.).';
  const U = SK.under, ue = SK.uest;
  $('#blurRead').innerHTML = !S.blur ? 'Motion blur off: no layer under the picture.' : !U ? 'Motion blur: nothing to blur along the columns.'
    : `<b>Under the picture, first:</b> the motion blur ${S.blur} mm, opacity ${S.alpha} % as a raster, ${U.pic.jars.length} of its jars, one coat, ${U.legs} legs`
      + (ue ? (ue.fail ? ` <span class="warn">the time not counted: ${esc(ue.fail)}</span>` : `, ${fmt(ue.mm / 1000, 1)} m, ≈ ${hm(ue.seconds)}. On FORM-G its stripes go with their own jars, in the same turn as the picture's — no jar changed for them.`) : ' …');
  $('#jarsHint').textContent = `${n}, light to dark`;
  const by = Object.fromEntries(SK.pic.jars.map(j => [j.id, j]));
  $('#jarList').innerHTML = SK.pic.jars.map((j, i) => `<li data-id="${j.id}"${j.id === only ? ' class="only"' : ''} title="${esc(j.name)} ${j.hex}: ${j.cells.length} cells, ${j.cells.reduce((a, c) => a + c.legs.length, 0)} legs, ${fmt(SK.lines[j.id] / 1000, 2)} m${j.coats === 2 ? ', two coats' : ''}">`
    + `<span class="no">${i + 1}</span><span class="sw" style="background:${j.hex}"></span><span class="nm">${esc(j.name)} <em>${j.hex}</em></span><span class="tg">${fmt(SK.lines[j.id] / 1000, 1)} m${j.coats === 2 ? ' ×2' : ''}</span></li>`).join('')
    + (SK.out.length ? `<li class="sep">Into another jar, the canon · ${SK.out.length}</li>` + SK.out.map(q => `<li class="gone" title="${q.hex}:${fmt(q.line / 1000, 2)} m, under ${long / 10} cm — its legs to ${esc(by[q.into]?.name)}, ΔE ${fmt(q.de, 1)}">`
      + `<span class="no"></span><span class="sw" style="background:${q.hex}"></span><span class="nm">→ ${esc(by[q.into]?.name)} <em>ΔE ${fmt(q.de, 0)}</em></span><span class="tg">${fmt(q.line / 1000, 2)} m</span></li>`).join('') : '');
  if (U) $('#jarList').innerHTML += `<li class="sep">Under · motion blur ${S.blur} mm, first · ${U.pic.jars.length}</li>` + U.pic.jars.map(j => `<li data-id="${j.id}"${j.id === only ? ' class="only"' : ''} title="${esc(j.name)} ${j.hex} under the picture: ${j.cells.length} cells, ${j.cells.reduce((a, c) => a + c.legs.length, 0)} legs, ${fmt(SK.ulines[j.id] / 1000, 2)} m, one coat">`
    + `<span class="no"></span><span class="sw" style="background:${j.hex}"></span><span class="nm">${esc(j.name)} <em>under</em></span><span class="tg">${fmt(SK.ulines[j.id] / 1000, 1)} m</span></li>`).join('');
  $('#stats').textContent = `${f.w / 10} × ${f.h / 10} cm · screen ${S.focus + 1}${pick !== null ? `, ${pick + 1} chosen` : ''} · ${n} jars · ${SK.legs} legs${U ? ` · under ${U.legs}` : ''}`;
}

// ---------- the stage ----------
// three screens side by side (one in the Picture view); V the zoom and the drag within a screen, the same on all of them
const V = { s: 1, x: 0, y: 0, fit: true }, HEAD = 22;
const cellsOf = rc => { const n = BASE && S.view !== 'picture' ? 3 : 1, w = rc.width / n; return Array.from({ length: n }, (_, i) => ({ i, x: i * w, w, h: rc.height })); };
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
      const here = c.i === S.focus, legs = (j, w, a) => {
        g.globalAlpha = a; g.strokeStyle = j.hex; g.lineWidth = w; g.lineCap = 'butt';
        g.beginPath();
        for (const q of j.cells) for (const [x, y1, y2] of q.legs) { g.moveTo(X(x), Y(y1)); g.lineTo(X(x), Y(y2)); }
        g.stroke();
      };
      const snake = (j, a) => {
        g.globalAlpha = a; g.strokeStyle = j.hex; g.lineWidth = Math.max(1, 0.35 * V.s); g.lineCap = 'round'; g.lineJoin = 'round';
        for (const q of j.cells) { g.beginPath(); q.legs.forEach(([x, y1, y2], i) => { if (i) g.lineTo(X(x), Y(y1)); else g.moveTo(X(x), Y(y1)); g.lineTo(X(x), Y(y2)); }); g.stroke(); }
      };
      const W5 = GEN.pitch * V.s + 0.4, all = [...(sk.under?.pic.jars ?? []), ...sk.pic.jars], o = here ? only : null;   // the motion blur's layer under the picture, first
      if (S.view === 'drag') { for (const j of all) legs(j, W5, 0.16); for (const j of all) if (!o || j.id === o) snake(j, 1); }
      else { for (const j of all) legs(j, W5, o && j.id !== o ? 0.16 : 1); if (o) legs(all.find(j => j.id === o), W5, 1); }
      g.globalAlpha = 1;
    }
    g.restore();
    if (cells.length < 3) continue;
    // the screen's head: its number, colours, jars, time; the chosen one in orange, the slider's in ink
    const chosen = c.i === pick, e = sk?.est, t = e && !e.fail ? ` · ≈ ${hm(e.seconds + (sk.uest && !sk.uest.fail ? sk.uest.seconds : 0))}` : '';
    g.font = `${c.i === S.focus ? 600 : 400} 12px "SF Mono", ui-monospace, Menlo, monospace`; g.textAlign = 'left';
    g.fillStyle = chosen ? '#EB7A25' : c.i === S.focus ? themeColor('--ink', '#24221F') : themeColor('--mute', '#7D776D');
    g.fillText(`${c.i + 1} · ${S.slots[c.i]} colours${sk ? ` → ${sk.pic.jars.length} jars${t}` : ''}${chosen ? ' · chosen' : ''}`, c.x + 12, 16);
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
// a screen chosen: the one APPROVE takes, the slider on it
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
$('#bSl').oninput = () => { const v = +$('#bSl').value; $('#bNow').textContent = v ? `${v} mm` : 'off'; };
$('#bSl').onchange = () => { S.blur = +$('#bSl').value; save(); blurNow(); };
$('#aSl').oninput = () => { $('#aNow').textContent = `${$('#aSl').value} %`; };
$('#aSl').onchange = () => { S.alpha = +$('#aSl').value; save(); blurNow(); };
document.querySelectorAll('[data-bg]').forEach(b => b.onclick = () => { S.ground = b.dataset.bg; save(); if (S.blur) blurNow(); else { panel(); kick(); } });   // the blur fades into the ground
$('#views').onclick = e => { const b = e.target.closest('[data-view]'); if (!b) return; S.view = b.dataset.view; save(); V.fit = true; panel(); kick(); };
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
    format: s.format, colours: sk.k, screen: s.screen, ground: s.ground, made: sk.made, picture_mm: [sk.W, sk.R], columns: sk.fit.N, left: sk.fit.left, top: sk.fit.top,
    jars: sk.pic.jars.map(j => ({ name: j.name, hex: j.hex, coats: j.coats, line_m: +(sk.lines[j.id] / 1000).toFixed(2) })),
    out: sk.out.map(q => ({ hex: q.hex, line_m: +(q.line / 1000).toFixed(2), into: by[q.into], de: +q.de.toFixed(1) })),
    counts: { legs: sk.legs, under_12mm: sk.short, ...(sk.est && !sk.est.fail ? { brush_m: +(sk.est.mm / 1000).toFixed(1), lines: sk.est.lines, dips: sk.est.dips, minutes_est: Math.round(sk.est.seconds / 60) } : {}) },
    ...(sk.under ? { blur_mm: s.blur, blur_alpha: s.alpha / 100, under: sk.under.pic, under_counts: { legs: sk.under.legs, ...(sk.uest && !sk.uest.fail ? { brush_m: +(sk.uest.mm / 1000).toFixed(1), minutes_est: Math.round(sk.uest.seconds / 60) } : {}) } } : {}),
    gen: GEN, blur: BLUR, pic: sk.pic,
  };
}
$('#btnApprove').onclick = async () => {
  const SK = pick !== null ? SL[pick] : null;
  if (!SK) return;
  const name = `${SRC.name.replace(/\.[^.]+$/, '')} · GEN-F · ${S.format} · ${SK.k}${SK.under ? ` · blur ${S.blur} · ${S.alpha}%` : ''}.json`, body = JSON.stringify(approvalOf(SRC, SK, { ...S, screen: pick + 1 }), null, 1);
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
