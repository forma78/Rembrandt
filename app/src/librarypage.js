// Library page: the drawings saved with 💾 SAVE on the Create tab (rubens.py
// keeps them in library/ on this Mac, not in git), newest first. A click
// opens a drawing on the Create tab (create.html?open=<file>), from where it
// goes to the Job tab and the machine; the red × moves it to
// library/.deleted/ after asking (the owner, 2026-09-30).

import { FORMATS } from './config.js';
import './lamp.js';   // day or night, switched on another tab

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const url = (file, ext) => 'library/' + encodeURIComponent(file) + ext;

async function load() {
  const grid = $('#grid');
  let list;
  try {
    const r = await fetch('/library', { cache: 'no-store' });
    list = r.ok ? await r.json() : null;
  } catch { list = null; }
  if (!list) { grid.innerHTML = '<p class="none">No server: start rembrandt.py.</p>'; $('#count').textContent = ''; return; }
  const tests = list.filter(d => d.kind === 'test'), paintings = list.filter(d => d.kind !== 'test');
  $('#count').textContent = `${paintings.length} painting${paintings.length === 1 ? '' : 's'} · ${tests.length} test${tests.length === 1 ? '' : 's'}`;
  $('#split').hidden = !tests.length;
  $('#tests').innerHTML = tests.map(card).join('');
  if (!paintings.length) { grid.innerHTML = '<p class="none">Nothing saved yet: 💾 SAVE on the Create tab.</p>'; return; }
  grid.innerHTML = paintings.map(card).join('');
}
// One card; a test opens on the Test tab, a painting on Create, a NOLAN save
// on NOLAN (it sits with the tests: its label says NOLAN, 2026-10-04), a New
// Yuri save on New Yuri (its label NEW YURI, 2026-10-06), a TYPE save on TYPE
// (its label TYPE, 2026-10-06).
const isNolan = d => d.kind === 'test' && /^NOLAN\b/.test(d.label || '');
const isNewYuri = d => d.kind === 'test' && /^NEW YURI\b/.test(d.label || '');
const isType = d => d.kind === 'test' && /^TYPE\b/.test(d.label || '');
const kindOf = d => isNolan(d) ? 'nolan' : isNewYuri(d) ? 'newyuri' : isType(d) ? 'type' : d.kind || 'painting';
const tabOf = d => isNolan(d) ? 'NOLAN' : isNewYuri(d) ? 'New Yuri' : isType(d) ? 'TYPE' : d.kind === 'test' ? 'Test' : 'Create';
function card(d) {
  const fmt = d.kind === 'test' ? (d.label || 'test') : FORMATS[d.format]?.label || '';
  const strokes = d.strokes == null ? '' : `${d.strokes} stroke${d.strokes === 1 ? '' : 's'}`;
  return `<article class="card" data-file="${esc(d.file)}" data-kind="${kindOf(d)}" title="Open on the ${tabOf(d)} tab">
      <div class="thumb">${d.png ? `<img src="${url(d.file, '.png')}" alt="" loading="lazy">` : ''}</div>
      <div class="meta"><span class="name">${esc(d.name)}</span><span class="sub">${esc([fmt, strokes].filter(Boolean).join(' · '))}</span></div>
      <button class="del" title="Delete" aria-label="Delete ${esc(d.name)}">×</button>
    </article>`;
}

async function onCard(e) {
  const el = e.target.closest('.card');
  if (!el) return;
  const file = el.dataset.file, name = el.querySelector('.name').textContent;
  if (e.target.closest('.del')) {
    if (!confirm(`Delete «${name}» from the Library?\n\nIt goes to library/.deleted/ on this Mac.`)) return;
    const r = await fetch(url(file, ''), { method: 'DELETE' }).catch(() => null);
    if (!r || !r.ok) alert(r ? await r.text() : 'No server: start rembrandt.py.');
    return load();
  }
  location.href = ({ test: 'test.html', nolan: 'nolan.html', newyuri: 'newyuri.html', type: 'index.html' }[el.dataset.kind] || 'create.html') + '?open=' + encodeURIComponent(file);
}
$('#grid').addEventListener('click', onCard);
$('#tests').addEventListener('click', onCard);

addEventListener('focus', load);   // saved on the Create tab meanwhile
load();
