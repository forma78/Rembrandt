// Columns dragged by their edge, as a table's in Excel (the owner, 2026-11-25: "a way to stretch the tab COLORS horizontally, wide; now it is fixed"; "THE
// LIBRARY with the pictures on the left too, I bring the cursor to the vertical frame and can pull it, as a column's width in a table in Excel"): the library
// on the left of GOGH, FORM-G, LIB-G and HOLO, GOGH's THE JARS beside it, and COLORS' page by either edge of its sections. A double click on the edge: its
// width as at first. Kept in this browser, a tab's own; the machine, a run and a plan know nothing of it. A classic script in a page's head, so the page
// draws at its widths at once. No document (node, the tests): the numbers only.
(function () {
  const KEY = 'rembrandt.cols.v01', PANEL = 340, STAGE = 280;                          // the panel's width; the picture keeps so much at least, px
  const LIB = { id: 'lib', sel: '.fg-shelf', css: '--lib-w', at: 132, lo: 96, hi: 480 }, JARS = { id: 'jars', sel: '.fg-jarside', css: '--jars-w', at: 236, lo: 190, hi: 700 };
  const PAGES = { 'gogh.html': [LIB, JARS], 'formg.html': [LIB], 'libg.html': [LIB], 'holo.html': [LIB] };
  const COLORS = { page: 'colors.html', id: 'page', sel: 'main.colors > .sec', css: '--colors-w', lo: 480, pad: 32 };   // none kept: as wide as the window
  // what a page's columns are in a window so wide: each its own (or as at first) within its limits, the last narrowed first so the picture keeps STAGE
  function widths(cols, kept, win) {
    const w = cols.map(c => Math.round(Math.min(c.hi, Math.max(c.lo, Number.isFinite(kept?.[c.id]) ? kept[c.id] : c.at))));
    let over = w.reduce((a, v) => a + v, 0) - (win - PANEL - STAGE);
    for (let i = cols.length - 1; i >= 0 && over > 0; i--) { const cut = Math.min(over, w[i] - cols[i].lo); w[i] -= cut; over -= cut; }
    return w;
  }
  // COLORS' page: no wider than the window; pulled to the window's own width it follows the window again (null)
  const pageWidth = (v, win) => !Number.isFinite(v) || v >= win - COLORS.pad ? null : Math.round(Math.max(COLORS.lo, v));
  globalThis.RembrandtCols = { PAGES, COLORS, widths, pageWidth, KEY, STAGE, PANEL };
  if (typeof document === 'undefined') return;

  const file = location.pathname.split('/').pop(), cols = PAGES[file] ?? null, isColors = file === COLORS.page, root = document.documentElement;
  const all = () => { try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); return v && typeof v === 'object' ? v : {}; } catch { return {}; } };
  const kept = () => all()[file] ?? {};
  function keep(id, v) {
    const a = all(), m = { ...(a[file] ?? {}) };
    if (v === null) delete m[id]; else m[id] = v;
    try { localStorage.setItem(KEY, JSON.stringify({ ...a, [file]: m })); } catch { }
    lay();
  }
  function lay() {
    if (cols) widths(cols, kept(), innerWidth).forEach((v, i) => root.style.setProperty(cols[i].css, `${v}px`));
    if (isColors) { const v = pageWidth(kept().page, innerWidth); if (v === null) root.style.removeProperty(COLORS.css); else root.style.setProperty(COLORS.css, `${v}px`); }
  }
  if (!cols && !isColors) return;
  lay();
  addEventListener('resize', lay);

  function grip(say, now, set) {                                                      // now(): its width, set(x): the pointer at x, set(null): as at first
    const g = document.createElement('div');
    g.className = 'colgrip'; g.tabIndex = 0; g.title = say;
    g.setAttribute('role', 'separator'); g.setAttribute('aria-orientation', 'vertical'); g.setAttribute('aria-label', say);
    g.addEventListener('pointerdown', e => { if (e.button) return; e.preventDefault(); g.setPointerCapture(e.pointerId); g.classList.add('on'); root.classList.add('colpull'); });
    g.addEventListener('pointermove', e => { if (g.classList.contains('on')) set(e.clientX); });
    const done = () => { g.classList.remove('on'); root.classList.remove('colpull'); };
    g.addEventListener('pointerup', done); g.addEventListener('pointercancel', done); g.addEventListener('lostpointercapture', done);
    g.addEventListener('dblclick', () => set(null));
    g.addEventListener('keydown', e => { const d = e.key === 'ArrowRight' ? 10 : e.key === 'ArrowLeft' ? -10 : 0; if (d) { e.preventDefault(); set(now() + d, true); } });
    return g;
  }
  addEventListener('DOMContentLoaded', () => {
    for (const c of cols ?? []) {
      const el = document.querySelector(c.sel);
      if (!el) continue;
      const g = grip('Pull: the column wider or narrower. A double click: its width as at first', () => el.getBoundingClientRect().width,
        (x, width) => keep(c.id, x === null ? null : Math.round(Math.min(c.hi, Math.max(c.lo, width ? x : x - el.getBoundingClientRect().left)))));
      g.style.gridColumn = getComputedStyle(el).gridColumnStart;
      el.after(g);
    }
    if (isColors) for (const el of document.querySelectorAll(COLORS.sel)) for (const side of ['left', 'right']) {
      const box = () => el.getBoundingClientRect(), g = grip('Pull: the page wider or narrower. A double click: as wide as the window', () => box().width,
        (x, width) => keep('page', x === null ? null : pageWidth(width ? x : 2 * Math.abs(x - (box().left + box().right) / 2), innerWidth)));
      g.classList.add(side);
      el.append(g);
    }
  });
})();
