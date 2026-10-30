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
// (its label TYPE, 2026-10-06), a LOVE save on LOVE (its label LOVE, 2026-10-07),
// an ALU save on ALU (its label ALU, 2026-10-08), an SMKN save on SMKN (its
// label SMKN, the same day), a CCD save on CCD (its label CCD, 2026-10-11), a
// TAPE save on TAPE, the first tab (its label TAPE, 2026-10-12), a BASF save on
// BASF (its label BASF, the same day), a BIAS save on BIAS (its label BIAS,
// 2026-10-15), a LOOM save on LOOM (2026-10-16), an INKA save on INKA
// (its label INKA, 2026-10-17), a ST-JOHN save on ST-JOHN (its label
// ST-JOHN, 2026-10-19), a BLEND save on BLEND (its label BLEND, 2026-10-26).
const isNolan = d => d.kind === 'test' && /^NOLAN\b/.test(d.label || '');
const isNewYuri = d => d.kind === 'test' && /^NEW YURI\b/.test(d.label || '');
const isType = d => d.kind === 'test' && /^TYPE\b/.test(d.label || '');
const isLove = d => d.kind === 'test' && /^LOVE\b/.test(d.label || '');
const isAluCut = d => d.kind === 'test' && /^ALU-CUT\b/.test(d.label || '');   // the first tab since 2026-10-11
const isAlu = d => d.kind === 'test' && /^ALU\b/.test(d.label || '') && !isAluCut(d);
const isSmkn = d => d.kind === 'test' && /^SMKN\b/.test(d.label || '');
const isCcd = d => d.kind === 'test' && /^CCD\b/.test(d.label || '');
const isTape = d => d.kind === 'test' && /^TAPE\b/.test(d.label || '');   // the first tab since 2026-10-12
const isBasf = d => d.kind === 'test' && /^BASF\b/.test(d.label || '');   // TAPE wound to the middle, 2026-10-12
const isBias = d => d.kind === 'test' && /^BIAS\b/.test(d.label || '');   // CCD's on the bias, 2026-10-15
const isLoom = d => d.kind === 'test' && /^LOOM\b/.test(d.label || '');   // Claude's woven cloth, 2026-10-16
const isInka = d => d.kind === 'test' && /^INKA\b/.test(d.label || '');   // Inca tiles, 2026-10-17
const isStJohn = d => d.kind === 'test' && /^ST-JOHN\b/.test(d.label || '');   // INKA and ⌘, St. John's Arms, 2026-10-19
const isBlend = d => d.kind === 'test' && /^BLEND\b/.test(d.label || '');      // INKA and Illustrator's blend, 2026-10-26
const isDache = d => d.kind === 'test' && /^DACHE\b/.test(d.label || '');      // BLEND in coloured pencils, 2026-10-27
const isPrisma = d => d.kind === 'test' && /^PRISMA\b/.test(d.label || '');    // DACHE in rings and rays, 2026-10-27
const isOpmB = d => d.kind === 'test' && /^OPM-B\b/.test(d.label || '');      // OPM bigger, 2026-10-28
const isOpmS = d => d.kind === 'test' && /^OPM-S\b/.test(d.label || '');      // OPM with FRAME and DRAW BW · CLR, 2026-10-28
const isOpmW = d => d.kind === 'test' && /^OPM-W\b/.test(d.label || '');      // OPM-S for wood, straight pieces, 2026-10-28
const isOpmP = d => d.kind === 'test' && /^OPM-P\b/.test(d.label || '');      // OPM-W for paint, the brush's rings and DRAG, 2026-10-29
const isForm = d => d.kind === 'test' && /^FORM\b/.test(d.label || '');       // OPM-P for figurative painting, the forms off a photo, 2026-10-30
const isOpm = d => d.kind === 'test' && !isOpmB(d) && !isOpmS(d) && !isOpmW(d) && !isOpmP(d) && /^OPM\b/.test(d.label || '');   // the contours for the paints by hand, 2026-10-27
const isPencils = d => d.kind === 'test' && /^PENCILS\b/.test(d.label || '');
const kindOf = d => isForm(d) ? 'form' : isOpmB(d) ? 'opmb' : isOpmS(d) ? 'opms' : isOpmW(d) ? 'opmw' : isOpmP(d) ? 'opmp' : isOpm(d) ? 'opm' : isPrisma(d) ? 'prisma' : isDache(d) ? 'dache' : isPencils(d) ? 'pencils' : isNolan(d) ? 'nolan' : isNewYuri(d) ? 'newyuri' : isType(d) ? 'type' : isLove(d) ? 'love' : isAluCut(d) ? 'alucut' : isAlu(d) ? 'alu' : isSmkn(d) ? 'smkn' : isCcd(d) ? 'ccd' : isTape(d) ? 'tape' : isBasf(d) ? 'basf' : isBias(d) ? 'bias' : isLoom(d) ? 'loom' : isInka(d) ? 'inka' : isStJohn(d) ? 'stjohn' : isBlend(d) ? 'blend' : d.kind || 'painting';
const tabOf = d => isForm(d) ? 'FORM' : isOpmB(d) ? 'OPM-B' : isOpmS(d) ? 'OPM-S' : isOpmW(d) ? 'OPM-W' : isOpmP(d) ? 'OPM-P' : isOpm(d) ? 'OPM' : isPrisma(d) ? 'PRISMA' : isDache(d) ? 'DACHE' : isPencils(d) ? 'Pencils' : isNolan(d) ? 'NOLAN' : isNewYuri(d) ? 'New Yuri' : isType(d) ? 'TYPE' : isLove(d) ? 'LOVE' : isAluCut(d) ? 'ALU-CUT' : isAlu(d) ? 'ALU' : isSmkn(d) ? 'SMKN' : isCcd(d) ? 'CCD' : isTape(d) ? 'TAPE' : isBasf(d) ? 'BASF' : isBias(d) ? 'BIAS' : isLoom(d) ? 'LOOM' : isInka(d) ? 'INKA' : isStJohn(d) ? 'ST-JOHN' : isBlend(d) ? 'BLEND' : d.kind === 'test' ? 'Test' : 'Create';
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
  location.href = ({ test: 'test.html', nolan: 'nolan.html', newyuri: 'newyuri.html', type: 'type.html', love: 'love.html', alucut: 'alucut.html', alu: 'alu.html', smkn: 'smkn.html', ccd: 'ccd.html', tape: 'tape.html', basf: 'basf.html', bias: 'bias.html', loom: 'loom.html', inka: 'index.html', stjohn: 'stjohn.html', blend: 'blend.html', dache: 'dache.html', prisma: 'prisma.html', opm: 'opm.html', opmb: 'opmb.html', opms: 'opms.html', opmw: 'opmw.html', opmp: 'opmp.html', form: 'form.html', pencils: 'pencils.html' }[el.dataset.kind] || 'create.html') + '?open=' + encodeURIComponent(file);
}
$('#grid').addEventListener('click', onCard);
$('#tests').addEventListener('click', onCard);

addEventListener('focus', load);   // saved on the Create tab meanwhile
load();
