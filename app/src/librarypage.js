// Library page: the drawings saved with 💾 SAVE on the Create tab (rubens.py
// keeps them in library/ on this Mac, not in git), newest first. A click
// opens a drawing on the Create tab (index.html?open=<file>), from where it
// goes to the Job tab and the machine; the red × moves it to
// library/.deleted/ after asking (the owner, 2026-09-30).

import { FORMATS } from './config.js';

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
// One card; a test opens on the Test tab, a painting on Create.
function card(d) {
  const fmt = d.kind === 'test' ? (d.label || 'test') : FORMATS[d.format]?.label || '';
  const strokes = d.strokes == null ? '' : `${d.strokes} stroke${d.strokes === 1 ? '' : 's'}`;
  return `<article class="card" data-file="${esc(d.file)}" data-kind="${d.kind || 'painting'}" title="Open on the ${d.kind === 'test' ? 'Test' : 'Create'} tab">
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
  location.href = (el.dataset.kind === 'test' ? 'test.html' : 'index.html') + '?open=' + encodeURIComponent(file);
}
$('#grid').addEventListener('click', onCard);
$('#tests').addEventListener('click', onCard);

addEventListener('focus', load);   // saved on the Create tab meanwhile
load();
