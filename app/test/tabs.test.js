import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { cleanPrefs, PREFS_NEW } from '../src/prefs.js';
import '../src/tabs.js';

// The top row (the owner, 2026-10-27: "hide SMKN and BIAS … in Preferences
// all the hidden tabs, a check-box to hide them and bring them back. ALU can
// be hidden too").
const { TABS, shown } = globalThis.RembrandtTabs;
const APP = new URL('../', import.meta.url);

test('the row at first: SMKN, BIAS and ALU off with the tabs hidden before; Calibration and Library always', () => {
  const row = shown({}).filter(q => q.shown).map(q => q.name);
  assert.deepEqual(row, ['OPM-N', 'FORM-G', 'OPM-G', 'ST-JOHN', 'BLEND', 'DACHE', 'PRISMA', 'OPM', 'OPM-B', 'OPM-S', 'OPM-W', 'OPM-P', 'FORM', 'ALU-CUT', 'CCD', 'Ink', 'INK-Y', 'LAB', 'COLORS', 'Calibration', 'Library']);
  assert.deepEqual(TABS.filter(q => q.always).map(q => q.href), ['calibration.html', 'library.html']);
  const mine = shown({ 'bias.html': true, 'ink.html': false, 'library.html': false });
  assert.ok(mine.find(q => q.href === 'bias.html').shown && !mine.find(q => q.href === 'ink.html').shown, 'the owner\'s ticks over it');
  assert.ok(mine.find(q => q.href === 'library.html').shown, 'Library never out');
});

test('every tab a page of the app, every page the row\'s script right after its nav', () => {
  for (const q of TABS) assert.ok(fs.existsSync(new URL(q.href, APP)), q.href);
  const pages = fs.readdirSync(APP).filter(f => f.endsWith('.html') && f !== 'remote.html' && f !== 'index.html');   // the iPhone's remote, /remote: no row of tabs (2026-11-02)
  for (const f of pages) {
    const s = fs.readFileSync(new URL(f, APP), 'utf8'), i = s.indexOf('class="tabs"'), j = s.indexOf('</nav>', i);
    assert.ok(i > 0 && /^\s*<script src="src\/tabs\.js"><\/script>/.test(s.slice(j + 6)), `${f}: tabs.js after the nav`);
    if (f !== 'prefs.html') assert.ok(TABS.some(q => q.href === f), `${f} in the list, so Preferences can show it`);
  }
});

test('Preferences keep the ticks, a page and in or out, nothing else; TEST\'s as they were', () => {
  const p = cleanPrefs({ testMargin: 12, tabs: { 'smkn.html': true, 'bias.html': false, 'x': true, 'alu.html': 'yes', '../a.html': false } });
  assert.deepEqual(p.tabs, { 'smkn.html': true, 'bias.html': false });
  assert.equal(p.testMargin, 12);
  assert.deepEqual(cleanPrefs({}).tabs, {}); assert.deepEqual(cleanPrefs(null).tabs, {});
  assert.deepEqual({ ...cleanPrefs({}), tabs: undefined }, { ...PREFS_NEW, tabs: undefined });
});

test('the home page goes on to OPM-N, a save\'s address with it; INKA off the row, its page kept (2026-11-04)', () => {
  const s = fs.readFileSync(new URL('index.html', APP), 'utf8');
  assert.match(s, /location\.replace\('opmn\.html' \+ location\.search \+ location\.hash\)/);
  assert.ok(!s.includes('class="tabs"'), 'no page of its own');
  assert.equal(TABS[0].href, 'opmn.html');
  assert.equal(TABS.find(q => q.href === 'inka.html').on, false);
  assert.ok(fs.readFileSync(new URL('inka.html', APP), 'utf8').includes('data-tab="inka"'));
});
