// The top row (the owner, 2026-10-27: "hide SMKN and BIAS, please — and in
// Preferences, the gear, put all the hidden tabs, so that I do not ask you
// every time: a check-box there, to hide them and bring them back. ALU can
// be hidden too, its box unticked"). Every tab in its place, on: in the row
// at first; the owner's ticks in Preferences over it, kept in this browser
// (prefs.js, PREFS_KEY, its tabs). Calibration and Library always, the gear
// last; the page open is in the row whatever, its tab pressed. A classic
// script right after every page's nav — the row drawn once, as it is to be,
// before the page shows — and again when Preferences change it in another
// tab of this browser. No document (node, the tests): the list only.
(function () {
  const TABS = [
    ['index.html', 'INKA', true], ['stjohn.html', 'ST-JOHN', true], ['blend.html', 'BLEND', true], ['dache.html', 'DACHE', true], ['caran.html', 'CARAN', true], ['prisma.html', 'PRISMA', true], ['opm.html', 'OPM', true],
    ['alucut.html', 'ALU-CUT', true], ['ccd.html', 'CCD', true], ['bias.html', 'BIAS', false], ['alu.html', 'ALU', false], ['smkn.html', 'SMKN', false],
    ['tape.html', 'TAPE', false], ['basf.html', 'BASF', false], ['loom.html', 'LOOM', false], ['nolan.html', 'NOLAN', false], ['newyuri.html', 'New Yuri', false],
    ['type.html', 'TYPE', false], ['love.html', 'LOVE', false], ['pencils.html', 'Pencils', false], ['test.html', 'Test', false], ['job.html', 'Job', false],
    ['create.html', 'Create', false], ['adjustments.html', 'Adjustments', false],
    ['ink.html', 'Ink', true], ['calibration.html', 'Calibration', true, true], ['library.html', 'Library', true, true],
  ].map(([href, name, on, always]) => ({ href, name, on, always: !!always }));
  const KEY = 'rembrandt.prefs.v01';
  const ticks = () => { try { const t = JSON.parse(localStorage.getItem(KEY) || 'null')?.tabs; return t && typeof t === 'object' ? t : {}; } catch { return {}; } };
  // every tab and whether it is in the row: always, the owner's tick, or as at first
  const shown = (t = ticks()) => TABS.map(q => ({ ...q, shown: q.always || (typeof t[q.href] === 'boolean' ? t[q.href] : q.on) }));
  const here = () => location.pathname.split('/').pop() || 'index.html';
  function render(nav = document.querySelector('nav.tabs')) {
    if (!nav) return;
    const at = here();
    nav.innerHTML = shown().filter(q => q.shown || q.href === at).map(q => `<a href="${q.href}"${q.href === at ? ' class="on"' : ''}>${q.name}</a>`).join('')
      + `<a href="prefs.html" class="gear${at === 'prefs.html' ? ' on' : ''}" title="Preferences" aria-label="Preferences"></a>`;
  }
  globalThis.RembrandtTabs = { TABS, shown, render };
  if (typeof document !== 'undefined') {
    render();
    addEventListener('storage', e => { if (e.key === null || e.key === KEY) render(); });
  }
})();
