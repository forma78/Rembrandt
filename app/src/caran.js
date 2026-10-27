import { settingsOf, validateSnapshot, mapPixels } from './caranplan.js';
import { PENCILS_NEW, cleanPencils } from './dacheplan.js';
import { lenOf } from './inkaplan.js';
import { lampSwitch, themeColor } from './lamp.js';
import { homeBlocks } from './strokes.js';
import './ui.js';

const $ = s => document.querySelector(s), KEY = 'rembrandt.caran.v01';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const metres = n => `${((n || 0) / 1000).toFixed(1)} m`;
const duration = seconds => { const m = Math.max(0, Math.round((seconds || 0) / 60)); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`; };
const live = st => ['running', 'pausing', 'paused', 'stopping'].includes(st?.state);
const worker = new Worker(new URL('./caranworker.js', import.meta.url), { type: 'module' });
let snapshot = null, plan = null, run = null, pending = false, capturing = false, sequence = 0, timer = null, status = null, activeRun = null, playback = null;
let S = { options: settingsOf(), pencils: cleanPencils(PENCILS_NEW), order: [], only: '', view: 'map', compare: true };
try { const q = JSON.parse(localStorage.getItem(KEY) || 'null'); if (q) S = { ...S, ...q, options: settingsOf(q.options), pencils: cleanPencils(q.pencils) }; } catch { }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { $('#saveState').textContent = 'Settings could not be kept in this browser. Export the project to keep them.'; } }
function runIdentity() {
  if (!snapshot) return '';
  let hash = 2166136261; for (const byte of snapshot.data) hash = Math.imul(hash ^ byte, 16777619);
  return JSON.stringify([hash >>> 0, snapshot.width, snapshot.height, S.options, S.pencils, S.order]);
}
function restoreActiveRun() {
  if (!run || !plan || !status || activeRun?.started === status.started) return;
  try { const q = JSON.parse(sessionStorage.getItem(`${KEY}.run`) || 'null'); if (q?.started === status.started && q.identity === runIdentity()) activeRun = { run, plan, started: q.started }; } catch { }
}
// Separate database: no changes to DACHE's references or the shared canvas.
const db = new Promise((ok, no) => { const q = indexedDB.open('rembrandt-caran', 1); q.onupgradeneeded = () => q.result.createObjectStore('snapshots'); q.onsuccess = () => ok(q.result); q.onerror = () => no(q.error); });
async function stored(get, value) { const d = await db; return new Promise((ok, no) => { const t = d.transaction('snapshots', get ? 'readonly' : 'readwrite'), q = get ? t.objectStore('snapshots').get('current') : t.objectStore('snapshots').put(value, 'current'); t.oncomplete = () => ok(q.result); t.onerror = () => no(t.error); }); }

const sliders = [
  ['pitch', 'Line spacing', 0.25, 2, 0.05, 'mm'], ['nib', 'Pencil trace', 0.25, 2, 0.05, 'mm'],
  ['speed', 'Drawing speed', 5, 120, 5, 'mm/s'], ['coats', 'Coats', 1, 4, 1, '×'],
];
$('#sliders').innerHTML = sliders.map(([key, name, min, max, step, unit]) => `<label class="sl"><span class="slh"><span>${name}</span><output id="out-${key}"></output></span><input class="slider" data-key="${key}" type="range" min="${min}" max="${max}" step="${step}" aria-label="${name}"></label>`).join('');
$('#sliders').oninput = e => { if (!e.target.dataset.key || live(status)) return; S.options[e.target.dataset.key] = +e.target.value; controls(); rebuild(); };
$('#details').onchange = e => { S.options.details = e.target.checked; rebuild(); };
$('#spokes').onchange = e => { S.options.spokes = e.target.checked; rebuild(); };
$('#squares').onchange = e => { S.options.squares = e.target.checked; rebuild(); };
for (const k of ['liftSeconds', 'detailSize']) $(`#${k}`).onchange = e => { S.options[k] = +e.target.value; S.options = settingsOf(S.options); controls(); rebuild(); };
function controls() {
  sliders.forEach(([key, , , , , unit]) => { $(`[data-key="${key}"]`).value = S.options[key]; $(`#out-${key}`).textContent = `${S.options[key]} ${unit}${key === 'coats' ? '' : ' (est.)'}`; });
  $('#spokes').checked = S.options.spokes; $('#squares').checked = S.options.squares; $('#details').checked = S.options.details; $('#liftSeconds').value = S.options.liftSeconds; $('#detailSize').value = S.options.detailSize;
  $('#compare').checked = S.compare;
  document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('on', b.dataset.view === S.view));
  const F = S.options.frame;
  for (const [key, value] of Object.entries({ x: F?.x0 ?? 0, y: F?.y0 ?? 0, w: F ? F.x1 - F.x0 : snapshot?.width ?? 0, h: F ? F.y1 - F.y0 : snapshot?.height ?? 0 })) $(`[data-frame="${key}"]`).value = Math.round(value * 10) / 10;
}
function rebuild() {
  save(); stopPlay(); clearTimeout(timer); if (!snapshot || capturing || live(status)) return;
  pending = true; updateButtons(); $('#planRead').textContent = 'Planning long passes…';
  timer = setTimeout(() => request({ type: 'plan', snapshot }), 180);
}
function request(q) { pending = true; updateButtons(); worker.postMessage({ ...q, id: ++sequence, pencils: S.pencils, options: S.options, order: S.order }); }
worker.onmessage = async ({ data: q }) => {
  if (q.id !== sequence) return;
  pending = false; capturing = false;
  if (q.error) { plan = null; run = null; $('#planRead').textContent = q.error; $('#hint').textContent = q.error; updateButtons(); return; }
  if (q.snapshot) { snapshot = q.snapshot; sourceBitmap = canvasOf(snapshot.data); pan = [0, 0]; zoom = 1; try { await stored(false, snapshot); } catch { $('#saveState').textContent = 'Snapshot is here until reload. Export the project to keep it.'; } }
  plan = q.plan; run = q.run; mapBitmap = canvasOf(q.pixels); drawBitmap = drawingBitmap();
  if (S.only && !plan.pencils.some(p => p.id === S.only)) S.only = '';
  restoreActiveRun(); controls(); pencilBox(); readings(); updateButtons(); draw();
};
worker.onerror = e => { pending = capturing = false; $('#planRead').textContent = `Could not plan the drawing: ${e.message}`; updateButtons(); };

function read(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } }
async function capture(name, raw = null) {
  if (live(status) || capturing) return;
  clearTimeout(timer); stopPlay();
  const state = raw ?? read(`rembrandt.${name.toLowerCase()}.v01`);
  if (!state?.rects?.length) { $('#saveState').textContent = `No ${name} composition in this browser. Open ${name} first, or import its saved SVG.`; return; }
  if (Array.isArray(state.pencils)) {
    const own = cleanPencils(state.pencils); S.pencils = cleanPencils([...own, ...PENCILS_NEW.filter(p => !own.some(q => q.id === p.id))]);
    S.order = Array.isArray(state.order) ? state.order : [];
  }
  S.options.frame = null; S.only = ''; save(); capturing = true;
  $('#sourceName').textContent = `Capturing ${name} Result…`; $('#planRead').textContent = 'Capturing the native Result, then assigning its colours…';
  request({ type: 'capture', source: state, name });
}
$('#btnDache').onclick = () => capture('DACHE'); $('#btnBlend').onclick = () => capture('BLEND');

function pencilBox() {
  const ps = plan?.pencils ?? S.pencils.filter(p => p.on), passes = plan?.passes ?? [];
  $('#boxCount').textContent = `${passes.length || ps.length} in use`;
  $('#pencilBox').innerHTML = S.pencils.map(p => {
    const P = passes.find(q => q.pencil === p.id), n = P ? passes.indexOf(P) + 1 : '—';
    return `<div class="caran-pencil${S.only === p.id ? ' sel' : ''}${p.on ? '' : ' off'}"><input type="checkbox" data-enable="${esc(p.id)}" aria-label="Enable ${esc(p.name)}"${p.on ? ' checked' : ''}><button class="swatch" data-pencil="${esc(p.id)}" style="--swatch:${p.hex}" title="Show ${esc(p.name)}" aria-label="Show ${esc(p.name)}"></button><span class="pname">${esc(p.name)}<small>${esc(p.code || p.brand || p.hex)}</small></span><span class="pmetres">${P ? `${n} · ${metres(P.mm)}` : '—'}</span></div>`;
  }).join('');
  const p = S.pencils.find(p => p.id === S.only);
  $('#pencilEdit').innerHTML = p ? `<div class="caran-fields"><label>Name<input data-edit="name" value="${esc(p.name)}" maxlength="40"></label><label>Number<input data-edit="code" value="${esc(p.code)}" maxlength="20"></label><label>Swatch (est.)<input type="color" data-edit="hex" value="${p.hex}"></label><label>Brand<input data-edit="brand" value="${esc(p.brand)}" maxlength="40"></label></div><div class="caran-pair"><button class="btn" data-order="-1">↑ Earlier</button><button class="btn" data-order="1">↓ Later</button></div>` : '';
}
$('#pencilBox').onclick = e => {
  const p = e.target.closest('[data-pencil]')?.dataset.pencil; if (!p) return;
  stopPlay(); S.only = S.only === p ? '' : p; save(); pencilBox(); refreshMaps();
};
$('#pencilBox').onchange = e => { const p = S.pencils.find(p => p.id === e.target.dataset.enable); if (p) { p.on = e.target.checked; rebuild(); } };
$('#pencilEdit').onchange = e => { const p = S.pencils.find(p => p.id === S.only); if (p && e.target.dataset.edit) { p[e.target.dataset.edit] = e.target.value; rebuild(); } };
$('#pencilEdit').onclick = e => {
  const mv = e.target.dataset.order; if (!mv || !S.only) return;
  const ids = (plan?.passes ?? []).map(p => p.pencil), i = ids.indexOf(S.only), j = i + +mv;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]]; S.order = ids; rebuild();
};
$('#btnAll').onclick = () => { stopPlay(); S.only = ''; save(); pencilBox(); refreshMaps(); };
$('#btnAdd').onclick = () => {
  let n = 1; while (S.pencils.some(p => p.id === `caran-${n}`)) n++;
  S.pencils.push({ id: `caran-${n}`, name: `Pencil ${S.pencils.length + 1}`, code: '', brand: '', hex: '#777777', on: true, light: false }); S.only = `caran-${n}`; rebuild();
};
function updateButtons() {
  const busy = pending || capturing, running = live(status);
  $('#btnDraw').disabled = busy || running || !run?.blocks.length || !!run.fault || run.pastWall > 0.1 || !!plan?.missing;
  $('#btnPause').disabled = !running; $('#btnHome').disabled = running;
  for (const id of ['btnSvg', 'btnProject', 'btnSave', 'btnPlay']) $(`#${id}`).disabled = busy || !plan;
  for (const id of ['btnDache', 'btnBlend', 'btnOpen', 'btnAdd']) $(`#${id}`).disabled = busy || running;
  document.querySelectorAll('#passSettings input,#pencilBox input,#pencilEdit input,#frameFields input').forEach(e => e.disabled = running);
}
function readings() {
  if (!snapshot || !plan || !run) return;
  $('#sourceName').textContent = `${snapshot.name} · ${snapshot.width} × ${snapshot.height} mm · frozen`;
  $('#sheetRead').textContent = `${snapshot.width} × ${snapshot.height} mm${S.options.frame ? ' · original-size fragment' : ''} · ${snapshot.h.toFixed(2)} mm source cells`;
  $('#planRead').innerHTML = `<b>${plan.passes.length} pencils</b> · ${metres(plan.mm)} drawing · ${metres(plan.air)} lifted · ${plan.lifts.toLocaleString('en')} lift cycles (est.).<br>${plan.spokes ? `${plan.spokes} sausage guides · ${metres(plan.spokeMM)} cross strokes.<br>` : ''}${plan.squareCells ? `${plan.squareCells.toLocaleString('en')} source cells kept distinct at sausages (est.).<br>` : ''}${plan.colours.toLocaleString('en')} source colours → ${plan.passes.length} real pencils. ${plan.missing ? `${plan.missing} source cells have no path.` : 'Every target cell has a drawing path.'}`;
  $('#timeRead').innerHTML = `<div><span>Motion &amp; acceleration (est.)</span><b>${duration(run.motionSeconds)}</b></div><div><span>Lift allowance (est.)</span><b>${duration(run.liftSeconds)}</b></div><div><span>Pencil changes</span><b>${plan.passes.length} · time excluded</b></div>`;
  $('#stats').textContent = `${metres(plan.mm)} · ${plan.passes.length} pencils · ≈ ${duration(run.seconds)} (est.)`;
  $('#hint').textContent = 'One frozen Result · one actual pencil per area · continuous passes';
  if (run.fault) $('#runState').textContent = `Drawing unavailable: ${run.fault}`;
  else if (run.pastWall > 0.1) $('#runState').textContent = 'The planned paper lies past the machine’s reach. Adjust its placement in the source, then capture again.';
  progress();
}

// The original bitmap, the finite-colour map, and the actual centre lines are
// separate views. No paper-tooth overlay or synthetic paint coverage.
const cv = $('#cv'), ctx = cv.getContext('2d');
let sourceBitmap = null, mapBitmap = null, drawBitmap = null, zoom = 1, pan = [0, 0], panels = [], tool = 'move', drag = null;
function canvasOf(data) { const c = document.createElement('canvas'); c.width = snapshot.nx; c.height = snapshot.ny; c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(data), c.width, c.height), 0, 0); return c; }
function path(g, c, scale = 1) {
  c.moveTo(g.a[0] * scale, (snapshot.ny * snapshot.h - g.a[1]) * scale);
  if (g.t === 'L') c.lineTo(g.b[0] * scale, (snapshot.ny * snapshot.h - g.b[1]) * scale);
  else c.arc(g.c[0] * scale, (snapshot.ny * snapshot.h - g.c[1]) * scale, g.r * scale, -Math.atan2(g.a[1] - g.c[1], g.a[0] - g.c[0]), -Math.atan2(g.b[1] - g.c[1], g.b[0] - g.c[0]), g.left);
}
function drawingBitmap() {
  if (!plan) return null;
  const c = document.createElement('canvas'); c.width = snapshot.nx; c.height = snapshot.ny;
  const g = c.getContext('2d'); g.fillStyle = '#FBFAF7'; g.fillRect(0, 0, c.width, c.height); g.lineWidth = S.options.nib / snapshot.h; g.lineCap = 'round'; g.lineJoin = 'round';
  for (const P of plan.passes) {
    if (S.only && P.pencil !== S.only) continue;
    g.strokeStyle = plan.pencils[P.index].hex; g.beginPath();
    for (const q of P.strokes[0]) if (!q.turn) path(q, g, 1 / snapshot.h);
    g.stroke();
  }
  return c;
}
function refreshMaps() { if (!plan) return; mapBitmap = canvasOf(mapPixels(snapshot, plan, S.only)); drawBitmap = drawingBitmap(); draw(); }
function draw() {
  const dpr = devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = themeColor('--stage', '#E2DED6'); ctx.fillRect(0, 0, W, H);
  $('#empty').hidden = !!snapshot; if (!snapshot) return;
  const compare = S.compare && S.view !== 'source', count = compare ? 2 : 1, gap = 18, paneW = W / count;
  const scale = Math.min((paneW - gap * 2) / snapshot.width, (H - 90) / snapshot.height) * zoom;
  panels = [];
  for (let i = 0; i < count; i++) {
    const left = i * paneW, x = left + (paneW - snapshot.width * scale) / 2 + pan[0], y = (H - snapshot.height * scale) / 2 + 12 + pan[1];
    panels.push({ left, right: left + paneW, x, y, scale });
    ctx.save(); ctx.beginPath(); ctx.rect(left, 0, paneW, H); ctx.clip();
    ctx.fillStyle = '#FBFAF7'; ctx.shadowColor = '#0002'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 5; ctx.fillRect(x, y, snapshot.width * scale, snapshot.height * scale); ctx.shadowColor = 'transparent';
    const bmp = (compare && i === 0) || S.view === 'source' ? sourceBitmap : playback?.bitmap ?? (S.view === 'paths' ? drawBitmap : mapBitmap);
    if (bmp) { ctx.imageSmoothingEnabled = false; ctx.drawImage(bmp, x, y + (snapshot.height - snapshot.ny * snapshot.h) * scale, snapshot.nx * snapshot.h * scale, snapshot.ny * snapshot.h * scale); }
    const f = drag?.frame ?? S.options.frame;
    if (f) {
      const fx = x + f.x0 * scale, fy = y + (snapshot.height - f.y1) * scale, fw = (f.x1 - f.x0) * scale, fh = (f.y1 - f.y0) * scale;
      ctx.fillStyle = '#0002'; ctx.beginPath(); ctx.rect(x, y, snapshot.width * scale, snapshot.height * scale); ctx.rect(fx, fy, fw, fh); ctx.fill('evenodd'); ctx.strokeStyle = '#EB7A25'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]); ctx.strokeRect(fx, fy, fw, fh); ctx.setLineDash([]);
    }
    if (playback?.tip && !(compare && i === 0)) { const p = playback.tip; ctx.strokeStyle = '#24221F'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x + p[0] * scale, y + (snapshot.height - p[1]) * scale, 4, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
  }
  $('#captions').classList.toggle('single', !compare);
  const selected = S.only ? plan?.pencils.find(p => p.id === S.only)?.name ?? '' : '';
  $('#rightCaption').textContent = S.view === 'source' ? 'SNAPSHOT · ORIGINAL RESULT' : `${S.view === 'paths' ? 'DRAWING · TRACE WIDTH EST.' : 'PENCILS · SWATCHES EST.'}${selected ? ` · ${selected.toUpperCase()}` : ''}`;
  $('#zoomRead').textContent = `${Math.round(zoom * 100)} %`;
}
document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { stopPlay(); S.view = b.dataset.view; controls(); save(); draw(); });
$('#compare').onchange = e => { S.compare = e.target.checked; save(); draw(); };
$('#zoomIn').onclick = () => { zoom = Math.min(15, zoom * 1.3); draw(); }; $('#zoomOut').onclick = () => { zoom = Math.max(0.4, zoom / 1.3); draw(); }; $('#zoomFit').onclick = () => { zoom = 1; pan = [0, 0]; draw(); };
function chooseTool(t) { tool = t; $('#toolFrame').classList.toggle('on', t === 'frame'); $('#toolMove').classList.toggle('on', t === 'move'); $('#stage').classList.toggle('frame', t === 'frame'); }
$('#toolMove').onclick = () => chooseTool('move'); $('#toolFrame').onclick = () => chooseTool('frame');
function pointer(e) {
  const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, P = panels.find(p => x >= p.left && x < p.right);
  return P ? { x, y, paper: [Math.max(0, Math.min(snapshot.width, (x - P.x) / P.scale)), Math.max(0, Math.min(snapshot.height, snapshot.height - (y - P.y) / P.scale))] } : null;
}
cv.onpointerdown = e => { if (e.button || !snapshot || pending || live(status)) return; stopPlay(); const p = pointer(e); if (!p) return; cv.setPointerCapture(e.pointerId); drag = { p, pan: [...pan], tool }; };
cv.onpointermove = e => { if (!drag) return; const p = pointer(e); if (!p) return; if (drag.tool === 'move') pan = [drag.pan[0] + p.x - drag.p.x, drag.pan[1] + p.y - drag.p.y]; else { const a = drag.p.paper, b = p.paper; drag.frame = { x0: Math.min(a[0], b[0]), y0: Math.min(a[1], b[1]), x1: Math.max(a[0], b[0]), y1: Math.max(a[1], b[1]) }; } draw(); };
cv.onpointerup = () => { const f = drag?.frame; drag = null; if (f && f.x1 - f.x0 >= 1 && f.y1 - f.y0 >= 1) { S.options.frame = f; controls(); rebuild(); } draw(); };
cv.onpointercancel = () => { drag = null; draw(); };
cv.onwheel = e => { e.preventDefault(); zoom = Math.max(0.4, Math.min(15, zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12))); draw(); };
$('#clearFrame').onclick = () => { if (live(status)) return; S.options.frame = null; controls(); rebuild(); };
$('#frameFields').onchange = () => {
  if (!snapshot || live(status)) return;
  const v = Object.fromEntries([...document.querySelectorAll('[data-frame]')].map(e => [e.dataset.frame, +e.value]));
  const x = Math.max(0, v.x), y = Math.max(0, v.y), x1 = Math.min(snapshot.width, x + v.w), y1 = Math.min(snapshot.height, y + v.h);
  if (![x, y, x1, y1].every(Number.isFinite) || x1 - x < 1 || y1 - y < 1) return;
  S.options.frame = { x0: x, y0: y, x1, y1 }; controls(); rebuild();
};
new ResizeObserver(draw).observe($('#stage')); addEventListener('rembrandt-night', draw);

// Playback follows the same drawn/air pieces that the runner will receive.
function stopPlay() { if (!playback) return; playback = null; $('#btnPlay').textContent = '▶ Play drawing'; draw(); }
$('#btnPlay').onclick = () => {
  if (playback) return stopPlay(); if (!plan || pending) return;
  S.view = 'paths'; controls();
  const bitmap = document.createElement('canvas'); bitmap.width = snapshot.nx; bitmap.height = snapshot.ny;
  const c = bitmap.getContext('2d'); c.fillStyle = '#FBFAF7'; c.fillRect(0, 0, bitmap.width, bitmap.height); c.lineWidth = S.options.nib / snapshot.h; c.lineCap = 'round';
  const list = [];
  for (const P of plan.passes) if (!S.only || P.pencil === S.only) for (const g of P.strokes[0]) list.push({ g, L: lenOf(g), hex: plan.pencils[P.index].hex, name: plan.pencils[P.index].name });
  const total = list.reduce((a, q) => a + q.L, 0);
  if (!total) return;
  playback = { bitmap, list, i: 0, done: 0, t: performance.now(), duration: 25000, tip: null };
  $('#btnPlay').textContent = '■ Stop playing';
  function tick(t) {
    const p = playback; if (!p) return;
    const until = total * Math.min(1, (t - p.t) / p.duration), start = performance.now();
    while (p.i < list.length && p.done < until && performance.now() - start < 12) {
      const q = list[p.i++]; c.strokeStyle = q.hex; if (!q.g.turn) { c.beginPath(); path(q.g, c, 1 / snapshot.h); c.stroke(); }
      p.tip = q.g.b; p.done += q.L;
      $('#hint').textContent = `Play drawing · ${q.name} · ${Math.min(100, Math.round(p.done / total * 100))} %${q.g.turn ? ' · pencil up' : q.g.spoke ? ' · cross strokes' : ' · contours'}`;
    }
    draw(); if (p.i >= list.length) { stopPlay(); return; } requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
};

// Local files keep the exact raster, not a recipe which may render differently
// after a future change of BLEND. Library uses its existing SVG metadata contract.
function encode(data) { let text = ''; for (let i = 0; i < data.length; i += 16384) text += String.fromCharCode(...data.subarray(i, i + 16384)); return btoa(text); }
function decode(text) { const raw = atob(text); return Uint8ClampedArray.from(raw, c => c.charCodeAt(0)); }
function project() { return { version: 1, caran: true, state: S, snapshot: { ...snapshot, data: encode(snapshot.data) } }; }
function svg() {
  const f = n => String(Math.round(n * 1000) / 1000), meta = JSON.stringify({ caran: true, label: `CARAN · ${snapshot.width} × ${snapshot.height} mm · ${plan.passes.length} pencils`, project: project() }).replace(/&/g, '\\u0026').replace(/</g, '\\u003c').replace(/--/g, '- -');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${snapshot.width}mm" height="${snapshot.height}mm" viewBox="0 0 ${snapshot.width} ${snapshot.height}"><metadata id="rembrandt-test">${meta}</metadata><desc>Actual pencil centre lines. Lift between subpaths. Trace width and swatches est. Air paths and paper are not drawn.</desc>${plan.passes.map(P => {
    const d = P.strokes[0].filter(g => !g.turn).map(g => `M${f(g.a[0])},${f(snapshot.height - g.a[1])} ` + (g.t === 'L' ? `L${f(g.b[0])},${f(snapshot.height - g.b[1])}` : `A${f(g.r)},${f(g.r)} 0 0 ${g.left ? 0 : 1} ${f(g.b[0])},${f(snapshot.height - g.b[1])}`)).join(' '), pc = plan.pencils[P.index];
    return `<g id="pencil-${P.index + 1}" data-pencil="${esc(P.pencil)}" aria-label="${esc(pc.name)}" fill="none" stroke="${pc.hex}" stroke-width="${S.options.nib}" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></g>`;
  }).join('')}</svg>`;
}
function download(name, text, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
$('#btnProject').onclick = () => download('caran-project.json', JSON.stringify(project()), 'application/json');
$('#btnSvg').onclick = () => download('caran-drawing.svg', svg(), 'image/svg+xml');
$('#btnSave').onclick = async () => {
  if (!plan) return; $('#btnSave').disabled = true;
  try { const r = await fetch('/library', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ svg: svg(), png: mapBitmap.toDataURL('image/png') }) }), q = await r.json(); if (!r.ok || !q.ok) throw new Error(q.message || 'Could not save'); $('#saveState').textContent = `Saved · ${q.name || q.file}`; }
  catch (e) { $('#saveState').textContent = e.message; } finally { updateButtons(); }
};
async function openText(text, name) {
  if (live(status)) return;
  const doc = text.trim().startsWith('<') ? new DOMParser().parseFromString(text, 'image/svg+xml') : null;
  const q = doc ? JSON.parse(doc.querySelector('#rembrandt-test')?.textContent.replace(/- -/g, '--') || 'null') : JSON.parse(text);
  const own = q?.project ?? (q?.caran && q?.snapshot ? q : null);
  if (own) {
    const snap = { ...own.snapshot, data: decode(own.snapshot.data) }; validateSnapshot(snap);
    if (!own.state || !Array.isArray(own.state.pencils)) throw new Error('No pencil box in the project.');
    S = { ...S, ...own.state, pencils: cleanPencils(own.state.pencils), options: settingsOf(own.state.options) };
    snapshot = snap; sourceBitmap = canvasOf(snapshot.data); zoom = 1; pan = [0, 0];
    await stored(false, snapshot); save(); controls(); request({ type: 'plan', snapshot });
  } else if (q?.settings?.rects) await capture(name, q.settings);
  else throw new Error('Open a CARAN project, or a saved DACHE / BLEND SVG.');
}
$('#btnOpen').onclick = () => $('#projectIn').click();
$('#projectIn').onchange = async e => { const f = e.target.files[0]; if (!f) return; try { await openText(await f.text(), f.name); } catch (error) { $('#saveState').textContent = error.message; } e.target.value = ''; };

async function post(path, body) { const r = await fetch(path, { method: 'POST', ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) }); const text = await r.text(); if (!r.ok) throw new Error(text || `HTTP ${r.status}`); return text; }
function progress() {
  const running = live(status), own = activeRun && status?.started === activeRun.started, r = own ? activeRun.run : run, p = own ? activeRun.plan : plan;
  $('#runMode').textContent = running ? (own ? status.state : 'Another run') : pending ? 'Planning' : 'Plan';
  const pct = own ? status.percent || 0 : 0;
  $('#runPercent').textContent = `${Math.floor(pct)} %`; $('#progress').value = pct;
  $('#totalTime').textContent = r ? `≈ ${duration(r.seconds)}` : '—';
  const b = own ? r.blocks[status.block] : null, id = b?.pencil ?? (b ? r.rows[b.row - 1]?.pencil : running ? null : p?.passes[0]?.pencil), pc = p?.pencils.find(q => q.id === id);
  $('#currentName').textContent = pc ? `${pc.name}${pc.code ? ` · ${pc.code}` : ''}` : running ? 'Run in progress' : 'Choose a snapshot';
  $('#currentSwatch').style.background = pc?.hex ?? 'var(--well)';
  const ids = p?.passes.map(q => q.pencil) ?? [], next = p?.pencils.find(q => q.id === ids[ids.indexOf(id) + 1]);
  $('#nextName').textContent = running && status.message ? status.message : next ? `Next · ${next.name}` : pc ? 'Last pencil' : 'Long passes · one pencil at a time';
  $('#btnPause').textContent = ['paused', 'pausing'].includes(status?.state) ? '▶ CONTINUE' : 'Ⅱ PAUSE';
}
async function poll() {
  try { const r = await fetch('/run', { cache: 'no-store' }); status = r.ok ? await r.json() : null; } catch { status = null; }
  restoreActiveRun(); progress(); updateButtons();
}
async function drawingStart() {
  if (!run?.blocks.length || pending) return;
  await poll(); if (!status) { $('#runState').textContent = 'Start rembrandt.py to draw.'; return; }
  if (live(status)) { $('#runState').textContent = 'A run is already in progress.'; return; }
  const list = plan.passes.map((P, i) => { const p = plan.pencils[P.index]; return `${i + 1}. ${p.name}${p.code ? ` ${p.code}` : ''} · ${metres(P.mm)}`; }).join('\n');
  if (!confirm(`DRAW CARAN\n\n${list}\n\nLay out the pencils in this order. At every change, fit the next pencil with its tip on the paper, then Continue.\n\n${metres(plan.mm)} drawn, ${metres(plan.air)} lifted; ≈ ${duration(run.seconds)} (est.), pencil changes excluded.${S.options.frame ? '\nOnly the selected fragment, at its original position on the sheet.' : ''}`)) return;
  stopPlay();
  try {
    // A capability probe while idle never moves the machine. An old server
    // responds 404, a server with p-pause responds 409 because it is idle.
    const probe = await fetch('/run/p-pause', { method: 'POST' });
    if (probe.status !== 409) throw new Error(probe.status === 404 ? 'Restart rembrandt.py for pencil pauses before drawing.' : 'Machine state changed. Check it before starting.');
    const r = run, p = plan;
    await post('/run', { blocks: r.blocks, log: { page: 'caran', pass: 'draw', label: `CARAN · ${snapshot.name}`, settings: S, estimate_s: Math.round(r.seconds) } });
    await poll(); activeRun = { run: r, plan: p, started: status?.started };
    try { sessionStorage.setItem(`${KEY}.run`, JSON.stringify({ started: activeRun.started, identity: runIdentity() })); } catch { }
    progress(); $('#runState').textContent = 'Drawing started.';
  } catch (e) { $('#runState').textContent = e.message; }
}
$('#btnDraw').onclick = drawingStart;
$('#btnPause').onclick = async () => { try { await post(['paused', 'pausing'].includes(status?.state) ? '/run/continue' : '/run/p-pause'); await poll(); } catch (e) { $('#runState').textContent = e.message; } };
$('#btnStop').onclick = async () => {
  try {
    if (!live(status)) { await post('/run/stop'); return; }
    if (status.state === 'paused') { $('#stopAsk').showModal(); return; }
    if (status.state === 'running') await post('/run/p-pause');
    // Show Continue only after the server acknowledges an actual standstill.
    for (let i = 0; i < 100; i++) { await poll(); if (status?.state === 'paused') { $('#stopAsk').showModal(); return; } if (!live(status)) return; await new Promise(ok => setTimeout(ok, 100)); }
    $('#runState').textContent = 'Waiting for the machine to pause.';
  } catch (e) { $('#runState').textContent = e.message; }
};
$('#askContinue').onclick = async () => { $('#stopAsk').close(); try { await post('/run/continue'); await poll(); } catch (e) { $('#runState').textContent = e.message; } };
async function goHome() { try { await poll(); if (live(status)) return; await post('/run', { blocks: homeBlocks(S.options.travel), log: { page: 'caran', label: 'CARAN · HOME' } }); } catch (e) { $('#runState').textContent = e.message; } }
$('#btnHome').onclick = goHome;
$('#askHome').onclick = async () => {
  $('#stopAsk').close();
  try { await post('/run/stop'); for (let i = 0; i < 100; i++) { await poll(); if (!live(status)) { await goHome(); return; } await new Promise(ok => setTimeout(ok, 100)); } $('#runState').textContent = 'Waiting for STOP before HOME.'; } catch (e) { $('#runState').textContent = e.message; }
};
$('#stopAsk').oncancel = e => { e.preventDefault(); $('#stopAsk').close(); post('/run/stop').catch(() => {}); };
addEventListener('keydown', e => {
  if (e.target.matches('input,textarea,select')) return;
  if (e.key === 'Escape') { stopPlay(); post('/run/stop').catch(() => {}); }
  if (e.key.toLowerCase() === 'f') chooseTool('frame'); if (e.key.toLowerCase() === 'v') chooseTool('move');
});

lampSwitch($('#lamp')); controls(); pencilBox(); draw(); poll(); setInterval(poll, 750);
async function init() {
  try {
    const file = new URLSearchParams(location.search).get('open');
    if (file) { const r = await fetch(`library/${encodeURIComponent(file)}.svg`, { cache: 'no-store' }); if (!r.ok) throw new Error('Could not open the Library project.'); await openText(await r.text(), file); return; }
    const kept = await stored(true);
    if (kept) { validateSnapshot(kept); snapshot = kept; sourceBitmap = canvasOf(snapshot.data); request({ type: 'plan', snapshot }); return; }
    for (const name of ['DACHE', 'BLEND']) if (read(`rembrandt.${name.toLowerCase()}.v01`)?.rects?.length) { await capture(name); return; }
    const r = await fetch('/library', { cache: 'no-store' });
    if (r.ok) {
      const list = await r.json(), file = list.find(q => /^DACHE\b/.test(q.label)) ?? list.find(q => /^BLEND\b/.test(q.label));
      if (file) { const saved = await fetch(`library/${encodeURIComponent(file.file)}.svg`); if (saved.ok) { await openText(await saved.text(), file.label); return; } }
    }
    $('#planRead').textContent = 'Capture a DACHE or BLEND Result, or open its saved project.';
  } catch (e) { $('#saveState').textContent = e.message; }
}
init();
