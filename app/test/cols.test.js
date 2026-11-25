import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import '../src/cols.js';

// Columns dragged by their edge (the owner, 2026-11-25: "a way to stretch the tab COLORS horizontally"; "THE LIBRARY … I bring the cursor to the vertical
// frame and can pull it, as a column's width in a table in Excel")
const { PAGES, widths, pageWidth, STAGE, PANEL } = globalThis.RembrandtCols;
const APP = new URL('../', import.meta.url), page = f => fs.readFileSync(new URL(f, APP), 'utf8');

test('a column its own width within its limits, at first as it was; the picture keeps its room, the last column narrowed first', () => {
  const G = PAGES['gogh.html'];
  assert.deepEqual(widths(G, {}, 1600), [132, 236], 'as it was');
  assert.deepEqual(widths(G, { lib: 260, jars: 420 }, 1600), [260, 420]);
  assert.deepEqual(widths(G, { lib: 5, jars: 5000 }, 3000), [G[0].lo, G[1].hi]);
  assert.deepEqual(widths(G, { lib: 'x', jars: null }, 1600), [132, 236], 'nothing kept: as it was');
  const w = widths(G, { lib: 460, jars: 600 }, 1400);
  assert.equal(w[0] + w[1], 1400 - PANEL - STAGE); assert.equal(w[0], 460, 'the jars first');
  assert.deepEqual(widths(G, { lib: 460, jars: 600 }, 700), G.map(c => c.lo), 'never under their least');
});

test('COLORS: as wide as the window, or as its edges were pulled', () => {
  assert.equal(pageWidth(undefined, 1600), null); assert.equal(pageWidth(1240, 1600), 1240);
  assert.equal(pageWidth(1590, 1600), null, 'pulled to the window: the window\'s again'); assert.equal(pageWidth(100, 1600), 480);
});

test('the pages with a library on the left, and COLORS, have the script in their head and its widths in their grid', () => {
  for (const f of Object.keys(PAGES)) {
    const s = page(f);
    assert.ok(s.indexOf('src="src/cols.js"') > 0 && s.indexOf('src="src/cols.js"') < s.indexOf('</head>'), f);
    for (const c of PAGES[f]) { assert.ok(s.includes(`var(${c.css},${c.at}px)`), `${f}: ${c.css}`); assert.ok(s.includes(`class="${c.sel.slice(1)}"`), `${f}: ${c.sel}`); }
  }
  assert.ok(page('colors.html').includes('max-width:var(--colors-w,none)'));
});
