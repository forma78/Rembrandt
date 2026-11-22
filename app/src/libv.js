// LIB-V (the owner, 2026-11-22, the evening: "make Library-V as here", Library's page; of THE JARS' 💾 SAVE in Downloads: "I need it in the library"):
// Library's look (librarypage.js), GOGH's pictures — this Mac's first, newest first (app/gogh/local.json: GEN-V's 🐾 APPROVE), then GOGH_LIB's — and
// below the line every picture's jars saved by 💾 SAVE on GOGH (app/gogh/jars/). A click opens it on GOGH (gogh.html#pic=…, &jars=… as 📂 LOAD); × moves
// one of this Mac's into app/gogh/.deleted/ after asking. Told by GEN-V and GOGH (BroadcastChannel rembrandt.genv) when one comes; nothing on the machine.
import { GOGH_LIB } from './goghplan.js';
import './lamp.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const when = iso => { const d = new Date(iso); return Number.isFinite(+d) ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : ''; };
const PICS = {};
let GEMS = {};   // 💎: { pic: [ { n, at, from, to, runs, dabs, jars, seconds } ] }, rembrandt.py's diamonds.json
const hm = s => `${Math.floor(s / 3600)} h ${String(Math.round(s / 60) % 60).padStart(2, '0')} min`;
const gemSay = g => `💎 №${g.n} · ${g.at} · ${g.dabs} dabs · ${g.jars?.length ?? 0} jars · ${hm(g.seconds)}${g.from ? ` · ${g.from} → ${g.to}` : ''}`;
async function pic(id) {
  if (!PICS[id]) try { const r = await fetch(`gogh/${encodeURIComponent(id)}.json`, { cache: 'no-store' }); PICS[id] = r.ok ? await r.json() : null; } catch { PICS[id] = null; }
  return PICS[id];
}

export async function load() {
  let lib = null;
  try { const r = await fetch('/gogh/library', { cache: 'no-store' }); lib = r.ok ? await r.json() : null; } catch { }
  GEMS = lib?.diamonds ?? {};
  const local = lib?.local ?? [], ids = [...local, ...GOGH_LIB.filter(id => !local.includes(id))];
  const cards = (await Promise.all(ids.map(async id => ({ id, p: await pic(id), mine: local.includes(id) })))).filter(q => q.p);
  $('#grid').innerHTML = cards.length ? cards.map(picCard).join('') : '<p class="none">Nothing yet: GEN-V, 🐾 APPROVE.</p>';
  const jars = lib?.jars ?? [];
  for (const j of jars) await pic(j.pic);
  $('#split').hidden = !jars.length;
  $('#jars').innerHTML = jars.map(jarsCard).join('');
  $('#count').textContent = lib ? `${cards.length} picture${cards.length === 1 ? '' : 's'} · ${jars.length} jars` : 'no server: start rembrandt.py';
}
function picCard({ id, p, mine }) {
  const dabs = p.jars.reduce((a, j) => a + j.cells.reduce((b, c) => b + c.legs.length, 0), 0);
  const name = p.approved ? when(p.approved) : p.title, sub = [p.approved ? p.title : '', `${p.w / 10} × ${p.h / 10} cm`, `brush ${p.pitch} mm`, `${p.jars.length} jars`, `${dabs} dabs`].filter(Boolean).join(' · ');
  return `<article class="card" data-pic="${esc(id)}" title="Open on GOGH">
      <div class="thumb"><img src="${esc(p.image)}" alt="" loading="lazy"></div>
      <div class="meta"><span class="name">${esc(name)}</span><span class="sub">${esc(sub)}</span>
        <span class="gems">${(GEMS[id] ?? []).map(g => `<b data-gem="${g.n}" title="${esc(gemSay(g))} — a click takes it away">💎</b>`).join('')}<button class="gem-add" data-gem-add title="A canvas of it finished: +💎, its passport from the journal">+💎</button></span></div>
      ${mine ? `<button class="del" data-del="pic" title="Delete" aria-label="Delete ${esc(name)}">×</button>` : ''}
    </article>`;
}
function jarsCard(j) {
  const p = PICS[j.pic], name = when(j.saved) || j.file;
  return `<article class="card" data-pic="${esc(j.pic)}" data-jars="${esc(j.file)}" title="Open on GOGH with these jars (📂 LOAD)">
      <div class="thumb">${p ? `<img src="${esc(p.image)}" alt="" loading="lazy">` : ''}</div>
      <div class="meta"><span class="name">${esc(name)}</span><span class="sub">${esc(`${j.title ?? j.pic} · ${j.swaps} of ${j.colours} colours by your jars`)}</span></div>
      <button class="del" data-del="jars" title="Delete" aria-label="Delete ${esc(name)}">×</button>
    </article>`;
}
async function onCard(e) {
  const el = e.target.closest('.card');
  if (!el) return;
  const name = el.querySelector('.name').textContent, del = e.target.closest('[data-del]'), pid = el.dataset.pic;
  // 💎 (the owner, 2026-11-22, the night: "a place as an NFT, with such an icon 💎 … painted two or three times, they are simply added: 💎💎💎")
  if (e.target.closest('[data-gem-add]')) {
    const n = (GEMS[pid]?.length ?? 0) + 1;
    if (!confirm(`💎 №${n} — a canvas of «${PICS[pid]?.title ?? pid}» finished?\n\nIts passport from the journal: the runs of it since the last 💎.`)) return;
    const r = await fetch('/gogh/diamond', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pic: pid }) }).catch(() => null);
    if (!r || !r.ok) alert(r ? (await r.json().catch(() => ({}))).message ?? r.status : 'No server: start rembrandt.py.');
    else { const g = (await r.json()).gem; alert(gemSay(g)); BC?.postMessage({ gem: pid }); }
    return load();
  }
  const gem = e.target.closest('[data-gem]');
  if (gem) {
    if (!confirm(`Take ${gem.title.split(' — ')[0]} away?\n\nMarked by mistake: the 💎 after it are numbered again.`)) return;
    const r = await fetch(`/gogh/diamond/${encodeURIComponent(pid)}/${gem.dataset.gem}`, { method: 'DELETE' }).catch(() => null);
    if (!r || !r.ok) alert(r ? await r.text() : 'No server: start rembrandt.py.');
    else BC?.postMessage({ gem: pid });
    return load();
  }
  if (del) {
    const kind = del.dataset.del, key = kind === 'pic' ? el.dataset.pic : el.dataset.jars;
    if (!confirm(`Delete «${name}» from LIB-V?\n\nIt goes to app/gogh/.deleted/ on this Mac.`)) return;
    const r = await fetch(`/gogh/${kind}/${encodeURIComponent(key)}`, { method: 'DELETE' }).catch(() => null);
    if (!r || !r.ok) alert(r ? await r.text() : 'No server: start rembrandt.py.');
    return load();
  }
  location.href = `gogh.html#pic=${encodeURIComponent(el.dataset.pic)}${el.dataset.jars ? `&jars=${encodeURIComponent(el.dataset.jars)}` : ''}`;
}
$('#grid').addEventListener('click', onCard);
$('#jars').addEventListener('click', onCard);
const BC = typeof BroadcastChannel === 'function' ? new BroadcastChannel('rembrandt.genv') : null;
if (BC) BC.onmessage = () => load();   // 🐾 APPROVE on GEN-V, 💾 SAVE on GOGH, a 💎 on another LIB-V
addEventListener('focus', load);
load();
