// Rembrandt · Adjustments — Sonnet's layout (`adjustments/`) painted as the
// brush would: layer by layer, the lighter paint first, every line from its
// home into its tail (Rembrandt.md §7). Never touches the hardware.

import { fmt } from './util.js';
import { parseLayer, paintLength, layerLength, runOrderOf, brushOutline } from './layers.js';
import './ui.js';

const $ = s => document.querySelector(s);
const SPEED = 40;   // mm/s, est. (§9: 13 lanes × 4 trips at 40 mm/s)

// Where each paint starts with a full brush. Every line in the files runs
// left to right; the homes follow §9 and the owner's sketches: the light
// from the right edge, the reds and the darks from the left, the white from
// the left, the greys from the right, the top black along the U from the left.
const HOME = { yellow: 'end', orange: 'end', red: 'start', crimson: 'start', black: 'start', maroon: 'start', 'dark-red': 'start', oxblood: 'start', cream: 'start', 'light-gray': 'start', 'mid-gray': 'end', 'dark-gray': 'end' };

const S = { layers: [], upTo: 0, ends: 'tails', tail: 120, home: {} };
// A layer by its paints, lightest to darkest: "Yellow → Crimson".
const layerName = L => { const o = runOrderOf(L.paints); return o.length > 1 ? `${o[0].name} → ${o[o.length - 1].name}` : o[0]?.name || L.label; };
const homeOf = (L, p) => S.home[`${L.id}/${p.key}`] || HOME[p.key] || 'start';

// ---------- the files ----------
async function loadLayers() {
  try {
    const list = await (await fetch('adjustments/', { cache: 'no-store' })).text();
    const files = [...list.matchAll(/href="(layer\d[^"]*\.svg)"/g)].map(m => decodeURIComponent(m[1])).sort();
    S.layers = await Promise.all(files.map(async f => ({ file: f, ...parseLayer(await (await fetch('adjustments/' + encodeURIComponent(f), { cache: 'no-store' })).text()) })));
  } catch { S.layers = []; }
  if (!S.upTo || S.upTo > S.layers.length) S.upTo = S.layers.length;
  build(); layout();
}

// ---------- screen ----------
const cv = $('#paint'), ctx = cv.getContext('2d'), board = $('#board'), stage = $('#stage');
let k = 1, dpr = 1;
const view = () => S.layers[0]?.view || { w: 500, h: 700 };
function layout() {
  const r = stage.getBoundingClientRect(), m = 30, V = view();
  k = Math.max(0.1, Math.min((r.width - 2 * m) / V.w, (r.height - 2 * m) / V.h));
  dpr = window.devicePixelRatio || 1;
  const w = Math.round(V.w * k), h = Math.round(V.h * k);
  board.style.width = w + 'px'; board.style.height = h + 'px';
  cv.style.width = w + 'px'; cv.style.height = h + 'px'; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  draw(ctx, k * dpr);
}
// Paint the layers up to S.upTo on c, s device px per mm.
function draw(c, s) {
  const V = view();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = '#FCFBF8'; c.fillRect(0, 0, V.w * s, V.h * s);
  c.setTransform(s, 0, 0, s, 0, 0);
  for (const L of S.layers.slice(0, S.upTo)) {
    for (const p of runOrderOf(L.paints)) {
      c.fillStyle = p.hex; c.strokeStyle = p.hex;
      for (const pts of p.lines) {
        c.beginPath();
        if (S.ends === 'round') {
          pts.forEach((q, i) => i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y));
          c.lineWidth = L.width; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke();
        } else {
          brushOutline(pts, L.width, homeOf(L, p), S.tail).forEach((q, i) => i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y));
          c.closePath(); c.fill();
        }
      }
    }
  }
  c.setTransform(1, 0, 0, 1, 0, 0);
}

// ---------- the panel ----------
const mins = mm => mm / SPEED / 60;
function build() {
  const tot = S.layers.reduce((a, L) => a + layerLength(L), 0), nPaints = S.layers.reduce((a, L) => a + L.paints.length, 0);
  $('#layoutRead').innerHTML = S.layers.length
    ? `${S.layers.length} layers on the ${view().w} × ${view().h} mm canvas, lines <b>${S.layers[0].width} mm</b> wide, 8 mm apart; the gradients mixed optically, neighbouring lines of neighbouring shades. <span class="mono">adjustments/</span>`
    : 'No layers: <span class="mono">adjustments/</span> holds none, or start rembrandt.py.';
  $('#upTo').innerHTML = S.layers.map((L, i) => `<button class="tog" data-n="${i + 1}" title="${layerName(L)}">${i + 1}</button>`).join('');
  $('#upTo').querySelectorAll('button').forEach(b => b.onclick = () => { S.upTo = +b.dataset.n; sync(); });
  $('#paintCount').textContent = nPaints;
  $('#stats').textContent = `${S.layers.length} layers · ${nPaints} paints · ${fmt(tot / 1000, 1)} m of line · ≈ ${fmt(mins(tot), 0)} min at ${SPEED} mm/s, est.`;
  sync();
}
function sync() {
  $('#upTo').querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.n === S.upTo));
  $('#ends').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.ends === S.ends));
  $('#tail').value = S.tail; $('#tailVal').textContent = `${S.tail} mm est.`;
  $('#tail').disabled = S.ends !== 'tails';
  $('#layers').innerHTML = S.layers.map((L, i) => {
    const len = layerLength(L);
    return `<div class="layer ${i + 1 === S.upTo ? 'on' : ''}" data-n="${i + 1}">
      <div class="lhead"><span class="ln">${i + 1}</span><span class="lname"><b>${layerName(L)}</b><small>${fmt(len / 1000, 1)} m · ≈ ${fmt(mins(len), 0)} min est.${i === 3 ? ' · into the wet grey' : ''}</small></span></div>
      <div class="ltubes">${runOrderOf(L.paints).map(p => `<span class="tchip"><i style="background:${p.hex}"></i>${p.name}</span>`).join('')}</div>
    </div>`;
  }).join('');
  $('#layers').querySelectorAll('.layer').forEach(el => el.onclick = () => { S.upTo = +el.dataset.n; sync(); });
  $('#paints').innerHTML = S.layers.map((L, i) => `<h4>${i + 1} · ${layerName(L)}</h4><table>` + runOrderOf(L.paints).map(p => {
    const h = homeOf(L, p), id = `${L.id}/${p.key}`;
    return `<tr><td><span class="chip" style="background:${p.hex}"></span>${p.name}</td>
      <td class="r">${fmt(paintLength(p) / 1000, 2)} m</td>
      <td class="r"><span class="seg side"><button data-home="${id}" data-v="start" class="${h === 'start' ? 'on' : ''}" title="Home at the left end">L</button><button data-home="${id}" data-v="end" class="${h === 'end' ? 'on' : ''}" title="Home at the right end">R</button></span></td>
      <td class="r mono">${p.hex}</td></tr>`;
  }).join('') + '</table>').join('');
  $('#paints').querySelectorAll('[data-home]').forEach(b => b.onclick = () => { S.home[b.dataset.home] = b.dataset.v; sync(); });
  draw(ctx, k * dpr); save();
}
$('#ends').querySelectorAll('button').forEach(b => b.onclick = () => { S.ends = b.dataset.ends; sync(); });
$('#tail').oninput = e => { S.tail = +e.target.value; sync(); };

// Export PNG: the layers shown, 4000 px on the long side.
$('#btnPng').onclick = () => {
  const V = view(), s = 4000 / Math.max(V.w, V.h), out = document.createElement('canvas');
  out.width = Math.round(V.w * s); out.height = Math.round(V.h * s);
  draw(out.getContext('2d'), s);
  out.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `rembrandt-adjustments-${S.upTo}.png`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 500); }, 'image/png');
};

// ---------- kept in this browser ----------
function save() { try { localStorage.setItem('rembrandt.adjust.v01', JSON.stringify({ upTo: S.upTo, ends: S.ends, tail: S.tail, home: S.home })); } catch { } }
try { Object.assign(S, JSON.parse(localStorage.getItem('rembrandt.adjust.v01') || '{}')); } catch { }

new ResizeObserver(layout).observe(stage);
loadLayers();
