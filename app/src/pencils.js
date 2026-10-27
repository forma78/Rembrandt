// Pencils has its own state and paper format. It reads BLEND's composition;
// neither the shared machine canvas nor the source drawing is changed.
import { cleanSettings, pencilStudy, fromBlend, fitDrawing, colourMap, svgOf, manifestOf, swatchSvg, lightToDark, PENCIL_KEY } from './pencilplan.js';
import { keysOf, keyIn } from './blendplan.js';
import { PAINT } from './tapeplan.js';
import { lampSwitch, themeColor } from './lamp.js';
import './ui.js';

const $ = s => document.querySelector(s), esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n, d = 1) => n.toLocaleString('en-GB', { maximumFractionDigits: d, minimumFractionDigits: d });
const read = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
let S;
try { S = read(PENCIL_KEY) ? cleanSettings(read(PENCIL_KEY)) : read('rembrandt.blend.v01') ? fromBlend(read('rembrandt.blend.v01')) : pencilStudy(); }
catch { S = pencilStudy(); }
let selected = null, view = 'paper', blend = 0, key = 0, editing = false, zoom = 1, pan = [0, 0];
let plan = null, pending = true, revision = 0, bitmap = null, bitmapKey = '', timer = null, play = null;
const undo = [], redo = [], worker = new Worker(new URL('./pencilworker.js', import.meta.url), { type: 'module' });
const save = () => { try { localStorage.setItem(PENCIL_KEY, JSON.stringify(S)); } catch { $('#saveState').textContent = 'browser storage full · use Save'; } };
const snapshot = () => { undo.push(JSON.stringify(S)); if (undo.length > 60) undo.shift(); redo.length = 0; };
function change(fn, history = true) {
  stopPlay(); if (history) snapshot(); fn(); S = cleanSettings(S); save(); renderControls(); generate();
}
function generate() {
  pending = true; revision++; const id = revision;
  clearTimeout(timer); $('#hint').textContent = 'Planning pencil strokes…'; exportEnabled();
  timer = setTimeout(() => worker.postMessage({ id, settings: S }), 100);
}
worker.onmessage = ({ data }) => {
  if (data.id !== revision) return;
  pending = false; plan = data.plan || null; bitmap = null;
  $('#stageMessage').hidden = !data.error;
  $('#stageMessage').textContent = data.error || '';
  $('#hint').textContent = data.error || 'Pencils · V edits keys · drag to pan · pinch to zoom';
  renderPlan(); draw();
};
worker.onerror = () => {
  pending = false; plan = null; $('#hint').textContent = 'Could not plan pencil strokes. Reload this page through rembrandt.py.'; exportEnabled();
};
function undoState(backwards) {
  const from = backwards ? undo : redo, to = backwards ? redo : undo;
  if (!from.length) return; stopPlay(); to.push(JSON.stringify(S)); S = cleanSettings(JSON.parse(from.pop()));
  blend = Math.min(blend, S.rects.length - 1); key = 0; save(); renderControls(); generate();
}
$('#btnUndo').onclick = () => undoState(true); $('#btnRedo').onclick = () => undoState(false);

// ---------- forms ----------
const keyBox = () => S.rects[blend] ? keysOf(S.rects[blend])[key] : null;
function putKey(q) {
  const r = S.rects[blend]; if (!r) return;
  if (!key) Object.assign(r, { x: q.x, y: q.y, w: q.w, h: q.h });
  else r.keys[key - 1] = keyIn(r, q);
  r.corners[key] = q.c;
}
function field(el, values, fn) {
  $(el).innerHTML = values.map(([id, name, v, min, step, unit]) => `<label>${name}<input type="number" data-field="${id}" value="${v}" ${min === null ? '' : `min="${min}"`} step="${step}"><em>${unit || 'mm'}</em></label>`).join('');
  $(el).querySelectorAll('input').forEach(e => e.onchange = () => {
    const n = +e.value; if (!Number.isFinite(n) || e.value === '') { renderControls(); return; }
    change(() => fn(e.dataset.field, n));
  });
}
function renderControls() {
  blend = Math.max(0, Math.min(blend, S.rects.length - 1)); key = Math.max(0, Math.min(key, S.rects[blend]?.keys.length || 0));
  if (selected && !S.pencils.some(p => p.id === selected && p.enabled)) selected = null;
  $('#sourceRead').textContent = S.source;
  $('#colourSources').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.colours === S.colourSource));
  $('#colourSourceRead').textContent = S.colourSource === 'result' ? 'The digital Result is a colour reference. Its tints become strokes of real pencils, with paper between them.' : 'Your original colour placements define the pencil areas. Assign their pencils below.';
  $('#mappingHeading').hidden = $('#mapping').hidden = S.colourSource === 'result';
  $('#whitePaper').closest('label').hidden = S.colourSource === 'result';
  $('#btnUndo').disabled = !undo.length; $('#btnRedo').disabled = !redo.length;
  $('#btnEdit').classList.toggle('on', editing); $('#btnEdit').setAttribute('aria-pressed', String(editing));
  $('#views').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.view === view));
  $('#blendKeys').innerHTML = S.rects.map((r, i) => `<button class="tog${i === blend ? ' on' : ''}" data-blend="${i}">Blend ${i + 1}</button>`).join('');
  $('#blendKeys').querySelectorAll('button').forEach(b => b.onclick = () => { blend = +b.dataset.blend; key = 0; editing = true; renderControls(); draw(); });
  const r = S.rects[blend], K = r ? keysOf(r) : [];
  $('#keyKeys').innerHTML = K.map((_, i) => `<button class="tog${i === key ? ' on' : ''}" data-key="${i}">Key ${i + 1}</button>`).join('');
  $('#keyKeys').querySelectorAll('button').forEach(b => b.onclick = () => { key = +b.dataset.key; editing = true; renderControls(); draw(); });
  const q = keyBox();
  field('#keyFields', q ? [['x', 'Left →', +q.x.toFixed(2), null, 1], ['y', 'Bottom ↑', +q.y.toFixed(2), null, 1],
    ['w', 'Width', +q.w.toFixed(2), 1, 1], ['h', 'Height', +q.h.toFixed(2), 1, 1], ['c', 'Corners', +q.c.toFixed(2), 0.5, 0.5]] : [],
    (k, v) => { const box = keyBox(); box[k] = ['w', 'h'].includes(k) ? Math.max(1, v) : k === 'c' ? Math.max(0.5, v) : v; putKey(box); });
  $('#blendSteps').value = r?.steps || 1; $('#blendSteps').disabled = !r;
  $('#fillCore').checked = r?.core || false; $('#fillCore').disabled = !r;
  $('#btnAddKey').disabled = !r || r.keys.length >= 8; $('#btnDeleteKey').disabled = !r || key === 0 || r.keys.length <= 1;
  field('#paperFields', [['paperW', 'Width', S.paperW, 50, 1], ['paperH', 'Height', S.paperH, 50, 1], ['margin', 'Fit margin', S.margin, 0, 1]], (k, v) => { S[k] = v; zoom = 1; pan = [0, 0]; });
  $('#paperFormats').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.size === `${S.paperW},${S.paperH}`));
  const format = (S.paperW === 297 && S.paperH === 420) || (S.paperW === 420 && S.paperH === 297) ? 'A3' : S.paperW === 210 && S.paperH === 297 ? 'A4' : 'Paper';
  $('#paperLabel').textContent = `${format} · ${S.paperW} × ${S.paperH} mm`;
  $('#boxCount').textContent = `${S.pencils.filter(p => p.enabled).length} in use`;
  $('#pencilBox').innerHTML = S.pencils.map((p, i) => `<div class="pencil-row${p.enabled ? '' : ' disabled'}" data-pencil="${i}">
    <input type="checkbox" data-prop="enabled" ${p.enabled ? 'checked' : ''} aria-label="Use ${esc(p.name)}">
    <input type="color" data-prop="hex" value="${p.hex}" aria-label="Swatch for ${esc(p.name)}">
    <input type="text" data-prop="name" value="${esc(p.name)}" aria-label="Name of pencil ${i + 1}">
    <input type="number" data-prop="repeats" min="1" max="6" value="${p.repeats}" title="Coats: complete repeats with this pencil" aria-label="Coats for ${esc(p.name)}">
    <button data-remove="${i}" title="Remove ${esc(p.name)}" aria-label="Remove ${esc(p.name)}">×</button></div>`).join('');
  $('#pencilBox').querySelectorAll('input').forEach(e => e.onchange = () => change(() => {
    const p = S.pencils[+e.closest('[data-pencil]').dataset.pencil], prop = e.dataset.prop;
    p[prop] = prop === 'enabled' ? e.checked : prop === 'repeats' ? +e.value : e.value;
  }));
  $('#pencilBox').querySelectorAll('[data-remove]').forEach(b => b.onclick = () => change(() => S.pencils.splice(+b.dataset.remove, 1)));
  $('#btnAddPencil').disabled = S.pencils.length >= 30; $('#whitePaper').checked = S.whitePaper;
  renderMarkFields(); renderMapping(); renderStrip(); draw();
}
const MARK_FIELDS = [
  ['nib', 'Pencil trace · est.', 0.1, 2, 0.05, 'mm'], ['pitch', 'Stroke spacing', 0.25, 3, 0.05, 'mm'],
  ['band', 'Contour band width', 0.5, 15, 0.1, 'mm'], ['transition', 'Colour transition · est.', 0, 40, 1, 'mm'],
  ['cell', 'Interleaving length', 2, 20, 1, 'mm'], ['tone', 'Preview tone · est.', 0.1, 1, 0.05, ''],
  ['speed', 'Drawing speed · est.', 5, 100, 1, 'mm/s'],
];
function renderMarkFields() {
  $('#markFields').innerHTML = MARK_FIELDS.map(([id, name, min, max, step, unit]) => `<div class="mark-field"><label for="mark-${id}">${name}<output id="value-${id}">${fmt(S[id], step < 1 ? 2 : 0)} ${unit}</output></label>
    <input class="slider" type="range" id="mark-${id}" min="${min}" max="${max}" step="${step}" value="${S[id]}"></div>`).join('');
  MARK_FIELDS.forEach(([id, , , , step, unit]) => {
    const el = $(`#mark-${id}`); let started = false;
    if (id === 'transition') el.closest('.mark-field').hidden = S.colourSource === 'result';
    el.oninput = () => { if (!started) { stopPlay(); snapshot(); started = true; } S[id] = +el.value; $(`#value-${id}`).textContent = `${fmt(S[id], step < 1 ? 2 : 0)} ${unit}`; save(); generate(); };
    el.onchange = () => { started = false; $('#btnUndo').disabled = false; };
  });
}
function renderMapping() {
  const m = colourMap(S);
  $('#mapping').innerHTML = Object.entries(m).map(([id, pencil]) => {
    const p = S.pencils.find(p => p.id === pencil);
    return `<label class="map-pair" title="${esc(PAINT[id].name)} → ${esc(p?.name || 'Paper')}"><i style="background:${PAINT[id].hex}"></i><select data-source="${id}" aria-label="Pencil for ${esc(PAINT[id].name)}" ${id === 'white' && S.whitePaper ? 'disabled' : ''}><option value="">Auto · ${esc(p?.name || 'Paper')}</option><option value="paper" ${S.assignments[id] === 'paper' ? 'selected' : ''}>Paper</option>${S.pencils.filter(p => p.enabled).map(p => `<option value="${p.id}" ${S.assignments[id] === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label>`;
  }).join('');
  $('#mapping').querySelectorAll('select').forEach(e => {
    e.disabled ||= S.colourSource === 'result';
    e.onchange = () => change(() => { if (e.value) S.assignments[e.dataset.source] = e.value; else delete S.assignments[e.dataset.source]; });
  });
}
function choosePass(id) {
  stopPlay(); selected = id; bitmap = null; renderStrip(); renderPlan(); draw();
}
function renderStrip() {
  $('#pencilStrip').innerHTML = `<button class="pencil-chip all${selected ? '' : ' on'}" data-pass="" title="All colours">ALL</button>` + S.pencils.filter(p => p.enabled).map((p, i) => {
    const empty = plan && !plan.passes.some(l => l.id === p.id);
    return `<button class="pencil-chip${p.id === selected ? ' on' : ''}${empty ? ' empty' : ''}" data-pass="${p.id}" style="background:${p.hex}" title="${esc(p.name)}${empty ? ' · no strokes' : ''}" aria-label="Show ${esc(p.name)}">${i + 1}</button>`;
  }).join('');
  $('#pencilStrip').querySelectorAll('button').forEach(b => b.onclick = () => choosePass(b.dataset.pass || null));
}
function exportEnabled() {
  for (const id of ['btnSave', 'btnExport', 'btnManifest', 'btnPlay']) $(`#${id}`).disabled = pending || !plan?.passes.length;
  $('#separations').querySelectorAll('button').forEach(b => b.disabled = pending);
}
function renderPlan() {
  $('#passCount').textContent = plan?.passes.length ?? '—'; $('#drawLength').textContent = plan ? fmt(plan.length / 1000) : '—';
  $('#runTime').textContent = plan ? fmt(plan.seconds / 60, 0) : '—';
  $('#stats').textContent = plan ? `${plan.strokes.toLocaleString('en-GB')} strokes · ${S.nib} mm trace (est.) · ${S.pitch} mm spacing` : '';
  const p = plan?.layers.find(p => p.id === selected);
  $('#passRead').textContent = p ? `${p.name} · ${p.repeats} coats · ${p.strokes} strokes · ${fmt(p.length / 1000)} m · ${fmt(p.seconds / 60, 0)} min (est.)` : plan?.passes.length ? `${plan.passes.length} colours · ${plan.passes.length - 1} pencil changes · timing includes travel and lifts (est.).` : 'No strokes. Enable a pencil or open a BLEND composition.';
  $('#separations').innerHTML = plan?.passes.map((p, i) => `<div class="separation${p.id === selected ? ' on' : ''}">
    <button class="colour" style="background:${p.hex}" data-show="${p.id}" aria-label="Show ${esc(p.name)}"></button>
    <div><button class="pass-name" data-show="${p.id}">${String(i + 1).padStart(2, '0')} · ${esc(p.name)}</button><small>${p.repeats} coats · ${fmt(p.length / 1000)} m · ${p.strokes} strokes</small></div>
    <button class="btn" data-export="${p.id}">SVG ↓</button></div>`).join('') || '<p class="read">No colour separations yet.</p>';
  $('#separations').querySelectorAll('[data-show]').forEach(b => b.onclick = () => choosePass(b.dataset.show));
  $('#separations').querySelectorAll('[data-export]').forEach(b => b.onclick = () => {
    if (!ready()) return; const i = plan.passes.findIndex(p => p.id === b.dataset.export);
    download(`${String(i + 1).padStart(2, '0')}-${b.dataset.export}.svg`, svgOf(plan, b.dataset.export, S), 'image/svg+xml');
  });
  renderStrip(); exportEnabled();
}
$('#btnEdit').onclick = () => { editing = !editing; renderControls(); };
$('#views').querySelectorAll('button').forEach(b => b.onclick = () => { stopPlay(); view = b.dataset.view; bitmap = null; renderControls(); draw(); });
$('#btnAll').onclick = () => choosePass(null);
$('#colourSources').querySelectorAll('button').forEach(b => b.onclick = () => change(() => { S.colourSource = b.dataset.colours; }));
$('#blendSteps').onchange = e => change(() => { if (S.rects[blend]) S.rects[blend].steps = +e.target.value; });
$('#fillCore').onchange = e => change(() => { if (S.rects[blend]) S.rects[blend].core = e.target.checked; });
$('#btnAddKey').onclick = () => change(() => {
  const r = S.rects[blend], q = r.keys.at(-1); r.keys.push({ x: q.x + q.w * 0.2, y: q.y + q.h * 0.2, w: q.w * 0.6, h: q.h * 0.6 });
  r.corners.push(Math.max(0.5, r.corners.at(-1) * 0.6)); key = r.keys.length; editing = true;
});
$('#btnDeleteKey').onclick = () => change(() => { const r = S.rects[blend]; r.keys.splice(key - 1, 1); r.corners.splice(key, 1); key--; });
$('#paperFormats').querySelectorAll('button').forEach(b => b.onclick = () => change(() => {
  [S.paperW, S.paperH] = b.dataset.size.split(',').map(Number); S.rects = fitDrawing(S.rects, S); zoom = 1; pan = [0, 0];
}));
$('#btnFit').onclick = () => change(() => { S.rects = fitDrawing(S.rects, S); zoom = 1; pan = [0, 0]; });
$('#btnStudy').onclick = () => change(() => {
  const study = pencilStudy(); S.rects = fitDrawing(study.rects, S); S.source = study.source; S.colourSource = study.colourSource; S.referencePaint = study.referencePaint; blend = key = 0;
});
$('#btnBlend').onclick = () => {
  try { const next = fromBlend(read('rembrandt.blend.v01'), S); change(() => { S = next; blend = key = 0; }); }
  catch (e) { $('#sourceRead').textContent = `${e.message} Open BLEND and create a blend first, or choose a Library save.`; }
};
$('#btnAddPencil').onclick = () => change(() => {
  let n = 1; while (S.pencils.some(p => p.id === `pencil-${n}`)) n++;
  S.pencils.push({ id: `pencil-${n}`, name: `Pencil ${n}`, hex: '#4B7052', repeats: 2, enabled: true });
});
$('#btnSort').onclick = () => change(() => { S.pencils = lightToDark(S.pencils); });
$('#whitePaper').onchange = e => change(() => { S.whitePaper = e.target.checked; });
$('#btnSeed').onclick = () => change(() => { S.seed = (S.seed + 1709) % 1e9; });

// ---------- paper preview: the same paths as the SVG ----------
const cv = $('#cv'), ctx = cv.getContext('2d'); let vport = { x: 0, y: 0, k: 1 }, drag = null;
function stroke(c, pts) {
  c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], S.paperH - p[1]) : c.moveTo(p[0], S.paperH - p[1])); c.stroke();
}
function paperBitmap(progress = null) {
  const cacheKey = `${revision},${view},${selected},${progress === null ? '' : Math.floor(progress * 12)}`;
  if (bitmap && bitmapKey === cacheKey) return bitmap;
  const c = document.createElement('canvas'), k = Math.min(5, 1600 / Math.max(S.paperW, S.paperH));
  c.width = Math.ceil(S.paperW * k); c.height = Math.ceil(S.paperH * k);
  const g = c.getContext('2d'); g.scale(k, k); g.fillStyle = S.paper; g.fillRect(0, 0, S.paperW, S.paperH);
  g.lineCap = 'round'; g.lineJoin = 'round';
  if (plan) {
    for (let i = 0; i < plan.passes.length; i++) {
      const p = plan.passes[i]; if (selected && p.id !== selected) continue;
      const count = progress === null ? p.paths.length : Math.floor(p.paths.length * Math.max(0, Math.min(1, progress - i)));
      if (!count) continue;
      g.strokeStyle = p.hex; g.lineWidth = S.nib;
      const coats = view === 'paths' ? 1 : p.repeats;
      for (let rep = 0; rep < coats; rep++) {
        g.globalAlpha = view === 'paths' ? 1 : S.tone * 0.8;
        for (let j = 0; j < count; j++) stroke(g, p.paths[j]);
      }
    }
    if (view === 'map') {
      g.lineWidth = 1.5; g.globalAlpha = 0.9;
      S.rects.forEach(r => r.ss.forEach(q => {
        const mapped = plan.mapping[q.paint]; if (selected && mapped !== selected) return;
        g.strokeStyle = PAINT[q.paint].hex;
        stroke(g, [[r.x + q.a[0] * r.w, r.y + q.a[1] * r.h], [r.x + q.b[0] * r.w, r.y + q.b[1] * r.h]]);
      }));
    }
    if (view === 'paper') {
      // Paper tooth is a preview overlay only. No extra marks or zigzags are
      // added to the physical paths. Tone is deliberately labelled est.
      g.fillStyle = S.paper; g.globalAlpha = 0.32;
      let seed = 713;
      for (let i = 0; i < c.width * c.height / 14; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; const x = seed / 4294967296 * S.paperW;
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; const y = seed / 4294967296 * S.paperH;
        g.fillRect(x, y, 0.12, 0.19);
      }
    }
  }
  g.globalAlpha = 1; bitmap = c; bitmapKey = cacheKey; return c;
}
function draw() {
  const W = $('#stage').clientWidth, H = $('#stage').clientHeight; if (!W || !H) return;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = themeColor('--stage', '#E2DED6'); ctx.fillRect(0, 0, W, H);
  const k = Math.min((W - 80) / S.paperW, (H - 70) / S.paperH) * zoom;
  const x = (W - S.paperW * k) / 2 + pan[0], y = (H - S.paperH * k) / 2 + pan[1]; vport = { x, y, k };
  ctx.save(); ctx.shadowColor = '#0003'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 9;
  ctx.fillStyle = S.paper; ctx.fillRect(x, y, S.paperW * k, S.paperH * k); ctx.restore();
  const progress = play ? (performance.now() - play.start) / 1500 : null;
  ctx.drawImage(paperBitmap(progress), x, y, S.paperW * k, S.paperH * k);
  ctx.strokeStyle = '#0002'; ctx.lineWidth = 0.7; ctx.strokeRect(x, y, S.paperW * k, S.paperH * k);
  ctx.fillStyle = themeColor('--mute', '#7D776D'); ctx.font = '9px Menlo, monospace';
  ctx.fillText(`0`, x - 11, y + S.paperH * k + 13);
  for (let n = 50; n <= S.paperW; n += 50) ctx.fillText(`${n}`, x + n * k - 7, y + S.paperH * k + 13);
  if (editing || view === 'map') drawKeys(ctx);
  $('#zoomFit').textContent = `${Math.round(zoom * 100)}%`;
  $('#viewTag').textContent = `${view === 'paper' ? 'PAPER · TEXTURE est.' : view === 'map' ? 'COLOUR PLACEMENTS' : 'ACTUAL STROKE PATHS'}${selected ? ` · ${S.pencils.find(p => p.id === selected)?.name || ''}` : ''}`;
}
const screen = p => [vport.x + p[0] * vport.k, vport.y + (S.paperH - p[1]) * vport.k];
const onPaper = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left - vport.x) / vport.k, S.paperH - (e.clientY - r.top - vport.y) / vport.k]; };
function drawKeys(c) {
  S.rects.forEach((r, i) => keysOf(r).forEach((q, j) => {
    const a = screen([q.x, q.y + q.h]), b = screen([q.x + q.w, q.y]);
    c.strokeStyle = i === blend && j === key ? '#EB7A25' : '#EB7A2580'; c.lineWidth = i === blend && j === key ? 1.2 : 0.6;
    c.strokeRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
    c.fillStyle = '#EB7A25'; c.fillText(`${i + 1}·${j + 1}`, a[0] + 4, a[1] - 5);
    if (editing && i === blend && j === key) for (const p of [[q.x, q.y], [q.x + q.w, q.y], [q.x, q.y + q.h], [q.x + q.w, q.y + q.h]]) {
      const [x, y] = screen(p); c.fillStyle = S.paper; c.fillRect(x - 3, y - 3, 6, 6); c.strokeRect(x - 3, y - 3, 6, 6);
    }
  }));
}
function zoomAt(factor, cx = $('#stage').clientWidth / 2, cy = $('#stage').clientHeight / 2) {
  const old = zoom, next = Math.max(0.3, Math.min(8, zoom * factor)), W = $('#stage').clientWidth, H = $('#stage').clientHeight;
  pan = [cx - W / 2 - (cx - W / 2 - pan[0]) * next / old, cy - H / 2 - (cy - H / 2 - pan[1]) * next / old]; zoom = next; draw();
}
$('#zoomIn').onclick = () => zoomAt(1.25); $('#zoomOut').onclick = () => zoomAt(0.8);
$('#zoomFit').onclick = () => { zoom = 1; pan = [0, 0]; draw(); };
cv.addEventListener('wheel', e => {
  e.preventDefault(); const r = cv.getBoundingClientRect();
  if (e.ctrlKey || e.metaKey) zoomAt(Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top);
  else { pan[0] -= e.deltaX; pan[1] -= e.deltaY; draw(); }
}, { passive: false });
cv.onpointerdown = e => {
  if (e.button !== 0) return; stopPlay(); const p = onPaper(e); cv.setPointerCapture(e.pointerId);
  const q = keyBox(), near = (x, y) => Math.hypot(p[0] - x, p[1] - y) < 8 / vport.k;
  if (editing && q) {
    const handle = [[0, 0], [1, 0], [0, 1], [1, 1]].find(([x, y]) => near(q.x + x * q.w, q.y + y * q.h));
    if (handle) { drag = { kind: 'resize', p, q: { ...q }, handle, saved: false }; return; }
    for (let i = S.rects.length - 1; i >= 0; i--) {
      const K = keysOf(S.rects[i]);
      for (let j = K.length - 1; j >= 0; j--) {
        const b = K[j]; if (p[0] >= b.x && p[0] <= b.x + b.w && p[1] >= b.y && p[1] <= b.y + b.h) {
          blend = i; key = j; drag = { kind: 'move', p, q: { ...b }, saved: false }; renderControls(); return;
        }
      }
    }
  }
  drag = { kind: 'pan', x: e.clientX, y: e.clientY, pan: pan.slice() };
};
cv.onpointermove = e => {
  if (!drag) return;
  if (drag.kind === 'pan') { pan = [drag.pan[0] + e.clientX - drag.x, drag.pan[1] + e.clientY - drag.y]; draw(); return; }
  const p = onPaper(e), dx = p[0] - drag.p[0], dy = p[1] - drag.p[1];
  if (Math.hypot(dx, dy) < 0.05) return;
  if (!drag.saved) { snapshot(); drag.saved = true; }
  const q = { ...drag.q };
  if (drag.kind === 'move') { q.x += dx; q.y += dy; }
  else {
    if (drag.handle[0]) q.w = Math.max(1, q.w + dx); else { q.w = Math.max(1, q.w - dx); q.x += drag.q.w - q.w; }
    if (drag.handle[1]) q.h = Math.max(1, q.h + dy); else { q.h = Math.max(1, q.h - dy); q.y += drag.q.h - q.h; }
  }
  putKey(q); draw();
};
function endDrag() {
  if (!drag) return; const changed = drag.saved; drag = null;
  if (changed) { S = cleanSettings(S); save(); renderControls(); generate(); }
}
cv.onpointerup = endDrag; cv.onpointercancel = endDrag;
new ResizeObserver(draw).observe($('#stage')); addEventListener('rembrandt-night', draw);

// ---------- preview playback ----------
function stopPlay() {
  if (!play) return; cancelAnimationFrame(play.frame); selected = play.selection; play = null; bitmap = null;
  $('#btnPlay').textContent = '▶ Play the passes'; renderStrip();
}
$('#btnPlay').onclick = () => {
  if (play) { stopPlay(); renderPlan(); draw(); return; }
  if (!ready()) return;
  play = { start: performance.now(), selection: selected, last: 0, frame: null }; selected = null; bitmap = null;
  $('#btnPlay').textContent = '■ Stop playing';
  const frame = now => {
    if (!play) return;
    const progress = (now - play.start) / 1500;
    if (progress >= plan.passes.length) { stopPlay(); renderPlan(); draw(); return; }
    if (now - play.last > 85) {
      play.last = now; const p = plan.passes[Math.floor(progress)]; $('#passRead').textContent = `Preview · pass ${Math.floor(progress) + 1} of ${plan.passes.length} · ${p.name}`; draw();
    }
    play.frame = requestAnimationFrame(frame);
  };
  play.frame = requestAnimationFrame(frame);
};

// ---------- files and Library (the existing read/save endpoints only) ----------
function ready() { return !pending && plan?.passes.length; }
function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type })), a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000); $('#exportRead').textContent = `Exported · ${name}`;
}
$('#btnExport').onclick = () => { if (ready()) download('pencils-layers.svg', svgOf(plan, null, S), 'image/svg+xml'); };
$('#btnManifest').onclick = () => { if (ready()) download('pencils-passes.json', JSON.stringify(manifestOf(plan), null, 2), 'application/json'); };
$('#btnSwatch').onclick = () => download('pencils-swatch-test.svg', swatchSvg(S), 'image/svg+xml');
$('#btnSave').onclick = async () => {
  if (!ready()) return; $('#btnSave').disabled = true; $('#saveState').textContent = 'saving…';
  try {
    const keep = selected; selected = null; bitmap = null; const png = paperBitmap().toDataURL('image/png'); selected = keep; bitmap = null;
    const r = await fetch('/library', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ svg: svgOf(plan, null, S), png }) });
    if (!r.ok) throw new Error('save failed'); const o = await r.json();
    $('#saveState').textContent = o.ok ? `saved · ${o.name}` : `not saved · ${o.message || 'try again'}`;
  } catch { $('#saveState').textContent = 'not saved · start rembrandt.py'; }
  exportEnabled();
};
function metadata(text) {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const el = doc.querySelector('metadata#rembrandt-test'); if (!el) throw new Error('Choose a Rembrandt BLEND or Pencils project SVG.');
  const o = JSON.parse(el.textContent.replace(/- -/g, '--'));
  if (o.pencils) return cleanSettings(o.settings);
  if (o.blend) return fromBlend(o.settings, S);
  throw new Error('This is not a BLEND or Pencils project.');
}
async function openProject(text, name) {
  try { const next = metadata(text); change(() => { S = next; S.source = name; blend = key = 0; selected = null; zoom = 1; pan = [0, 0]; }); }
  catch (e) { $('#sourceRead').textContent = e.message; }
}
$('#btnImport').onclick = () => $('#projectIn').click();
$('#projectIn').onchange = async e => { const f = e.target.files[0]; if (!f) return; await openProject(await f.text(), f.name); e.target.value = ''; };
async function libraryList() {
  try {
    const r = await fetch('/library', { cache: 'no-store' }); if (!r.ok) return; const rows = await r.json(); if (!Array.isArray(rows)) return;
    const opts = rows.filter(d => /^BLEND\b/.test(d.label || ''));
    $('#blendLibrary').innerHTML = '<option value="">BLEND in the Library…</option>' + opts.map(d => `<option value="${esc(d.file)}">${esc(d.name)}</option>`).join('');
  } catch { }
}
$('#blendLibrary').onchange = e => { $('#btnLibrary').disabled = !e.target.value; };
$('#btnLibrary').onclick = async () => {
  const file = $('#blendLibrary').value; if (!file) return;
  try { const r = await fetch(`library/${encodeURIComponent(file)}.svg`); if (!r.ok) throw new Error(); await openProject(await r.text(), `BLEND · ${file}`); }
  catch { $('#sourceRead').textContent = 'Could not open the Library drawing.'; }
};
addEventListener('keydown', e => {
  if (e.target.closest('input,select,textarea')) return;
  const mod = e.metaKey || e.ctrlKey;
  if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); undoState(!e.shiftKey); }
  else if (mod && e.key === '0') { e.preventDefault(); $('#zoomFit').click(); }
  else if (mod && ['=', '+', '-'].includes(e.key)) { e.preventDefault(); zoomAt(e.key === '-' ? 0.8 : 1.25); }
  else if (e.key.toLowerCase() === 'v') $('#btnEdit').click();
  else if (e.key === 'Escape') { stopPlay(); editing = false; renderControls(); draw(); }
});
lampSwitch($('#lamp'));
async function init() {
  const file = new URLSearchParams(location.search).get('open');
  if (file) {
    // Load the requested project before planning or enabling editing, so a
    // late Library response cannot replace edits made just after navigation.
    history.replaceState(null, '', location.pathname); $('main').inert = true; exportEnabled();
    try {
      const r = await fetch(`library/${encodeURIComponent(file)}.svg`); if (!r.ok) throw new Error();
      S = metadata(await r.text()); S.source = `Pencils · ${file}`; save();
    } catch { $('#saveState').textContent = 'could not open Library drawing'; }
    finally { $('main').inert = false; }
  }
  renderControls(); generate(); libraryList();
}
init();
