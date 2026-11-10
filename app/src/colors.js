// Rembrandt · COLORS, the library (the owner, 2026-11-08: "build a COLORS tab next to LAB, so that our library is there. Kuzya
// proposed cards"; "put the recommendations right in the cards!"). A card a jar of LAB's real 3, in the tab's order: Kuzya's card —
// Target, Mix recipe, Medium, Dry LAB, ΔE, Coats — with the advice under the recipe; his scale; the paints on the shelf. The jars are
// LAB's own (labplan.js, real3Of), the recipes and the paints colorlib.js's. "Mixed" is a tick for this browser only, while mixing.
import './lamp.js';
import { real3Of } from './labplan.js';
import { PAINTS, paintOf, SOURCES, KUZYA, MEDIUM, RECIPES, ORDER, usesOf } from './colorlib.js';

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const KEY = 'rembrandt.colors.v01';
const kept = () => { try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); return v && typeof v.mixed === 'object' ? v : { mixed: {} }; } catch { return { mixed: {} }; } };
const keep = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { } };

const L1 = real3Of(1).map(q => ({ name: q.jar.name, hex: q.jar.hex, coats: q.jar.coats, line: q.line }));
const again = new Set(real3Of(2).map(q => q.jar.name.replace(/ · layer 2$/, '')));
const jarHex = name => L1.find(j => j.name === name)?.hex;
const chip = hex => `<i class="chip" style="background:${hex}"></i>`;

// a part of a recipe: its colour, its name, its share
function part([p, n]) {
  const paint = paintOf(p), hex = paint?.hex ?? jarHex(p), name = paint?.name ?? p;
  const share = typeof n === 'number' ? `<b>${n}</b>` : `<em>${esc(n)}</em>`;
  return `<span class="part">${hex ? chip(hex) : ''}${esc(name)} ${share}</span>`;
}
function recipe(r) {
  if (r.parts.length === 1 && r.parts[0][1] === 1) return `<span class="recipe">${part([r.parts[0][0], 'as it is'])}</span>`;
  const ratio = r.parts.every(([, n]) => typeof n === 'number');
  return `<span class="recipe">${r.parts.map(part).join(ratio ? '<span class="colon">:</span>' : '<span class="colon">+</span>')}</span>`;
}

function cards() {
  const M = kept().mixed, mixings = L1.length - L1.filter(j => RECIPES[j.name]?.pair && L1.findIndex(q => q.name === RECIPES[j.name].pair) < L1.indexOf(j)).length;
  $('#jarsHint').textContent = `${L1.length} jars · ${mixings} mixings · ${L1.filter(j => M[j.name]).length} mixed`;
  $('#cards').innerHTML = L1.map((j, i) => {
    const r = RECIPES[j.name] ?? { parts: [], advice: 'No recipe yet.' }, sw = r.swatch && paintOf(r.swatch), mixed = !!M[j.name];
    const badges = [mixed ? '<span class="badge done">Mixed ✓</span>' : '<span class="badge">Recipe est.</span>',
      r.mother ? `<span class="badge mother">Mother · ${r.parts.length === 1 ? 'from the tube' : 'mix it first'}</span>` : '',
      r.pair ? `<span class="badge">One mixing with ${esc(r.pair)}</span>` : ''].join('');
    const coats = j.coats === 2 && again.has(j.name) ? '2 — again on real 3 · layer 2, over the dry first: keep enough' : '1';
    const kz = r.kuzya ? `${r.kuzya}${sw ? ` · ${chip(sw.hex)}${esc(sw.name)}` : ''}` : sw ? `${chip(sw.hex)}${esc(sw.name)}` : '—';
    return `<article class="jcard${mixed ? ' mixed' : ''}" data-jar="${esc(j.name)}">
      <div class="jhead"><div class="jsw" style="background:${j.hex}"></div><div>
        <h4>${esc(j.name)}</h4>
        <p class="jsub">No. ${i + 1} of ${L1.length} on LAB · real 3 · ${(j.line / 1000).toFixed(2)} m of line</p>
        <div class="badges">${badges}</div></div></div>
      <dl class="jrows">
        <dt>Target</dt><dd>${chip(j.hex)} the colour on the screen</dd>
        <dt>Mix recipe</dt><dd>${recipe(r)}</dd>
        <dt>Advice</dt><dd class="advice">${esc(r.advice)}</dd>
        <dt>Medium</dt><dd>${esc(MEDIUM)}</dd>
        <dt>Dry LAB</dt><dd class="mute">${r.dry ? `${chip(r.dry)} measured dry` : 'Next: a swatch from the jar, dry, in daylight, its name beside it'}</dd>
        <dt>ΔE</dt><dd>${r.dryDE != null ? `${r.dryDE} measured · ` : ''}<span class="mute">model ${r.de ?? '—'} (est.)${r.dryDE != null ? '' : ' · measured after the swatch dries'}</span></dd>
        <dt>Coats</dt><dd>${coats}</dd>
        <dt>Kuzya · swatch</dt><dd>${kz}</dd>
      </dl>
      <button class="btn" data-mix="${esc(j.name)}" title="A tick in this browser only, while mixing">${mixed ? 'Mixed ✓ · undo' : 'Mark as mixed'}</button>
    </article>`;
  }).join('');
  $('#cards').querySelectorAll('[data-mix]').forEach(b => b.onclick = () => {
    const v = kept(), n = b.dataset.mix;
    if (v.mixed[n]) delete v.mixed[n]; else v.mixed[n] = true;
    keep(v); cards();
    $('#saved').textContent = `${n}: ${v.mixed[n] ? 'mixed' : 'not mixed yet'} (this browser)`;
  });
}

function lead() {
  const order = [...ORDER, ...L1.map(j => j.name).filter(n => RECIPES[n]?.parts.some(([p]) => p === 'Jar 43') && !ORDER.includes(n))];
  $('#lead').innerHTML = `On the jar: <b>its name, big</b>, the run asks for it by that name: a number, Jar 32, Jar 35; the number tells the shade, light to dark, no hex (a paint has no RGB). `
    + `The dark reds are <b>two mothers</b>, Red and Jar 43 (Red and Dark Brown), the rest of them mixed of those two; then the light ones on their own.`;
  const shown = order.filter(n => !RECIPES[n]?.pair || order.indexOf(RECIPES[n].pair) > order.indexOf(n));   // a pair once: one mixing
  $('#order').innerHTML = shown.map(n => `<li>${chip(jarHex(n))}${esc(RECIPES[n]?.pair ? `${n} · ${RECIPES[n].pair}` : n)}</li>`).join('') + '<li>the light ones, as their cards say</li>';
}

function kuzya() {
  $('#kscale').innerHTML = KUZYA.map(([hex, jar], i) => {
    const there = L1.some(j => j.name === jar), into = jar === 'Jar 16' ? 'Jar 23' : jar === 'Seam' ? 'Jar 43' : '';
    return `<div><i style="background:${hex}"></i><b>${i + 1}</b>${there ? esc(jar) : `${esc(jar)} → ${esc(into)}`}</div>`;
  }).join('');
}

function paints() {
  $('#pgroups').innerHTML = Object.entries(SOURCES).map(([k, s]) => `<div class="pgroup"><h4>${esc(s.name)} <span class="hint">${esc(s.say)} · ${esc(s.trust)}</span></h4><div class="pcards">${
    PAINTS.filter(p => p.from === k).map(p => {
      const u = usesOf(p.id), use = u.direct.length ? `In: ${u.direct.join(', ')}${u.via.length ? `; through them: ${u.via.join(', ')}` : ''}` : 'Not in real 3';
      return `<div class="pcard${u.direct.length ? '' : ' idle'}"><div class="jsw" style="background:${p.hex}"></div><div><b>${esc(p.name)}</b>`
        + `<span class="lab">L ${p.lab[0]} · a ${p.lab[1]} · b ${p.lab[2]}</span><div class="use">${esc(use)}</div>${p.note ? `<div class="note">${esc(p.note)}</div>` : ''}</div></div>`;
    }).join('')}</div></div>`).join('');
}

lead(); cards(); kuzya(); paints();
addEventListener('storage', e => { if (e.key === KEY) cards(); });   // ticked on another tab
