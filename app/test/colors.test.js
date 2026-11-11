// COLORS' registry of the pictures' jars and its mixing model (Kuzya's audit, 2026-11-10): every picture of the libraries read from its plan,
// a jar's key its own, the plans untouched; the model's recipes the painter's way, the dark reds as real 3's hand recipes say.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { FORMG_LIB, OPMG_LIB } from '../src/formgplan.js';
import { entriesOf, sameHex, partsSay, lineOf } from '../src/colorreg.js';
import { shelfOf, jarRecipe, familyOf, hexLin, linLab, mixLab, de2000 } from '../src/colormix.js';
import { PAINTS, RECIPES } from '../src/colorlib.js';
import { real3Of } from '../src/labplan.js';

const plans = [...FORMG_LIB.map(id => ['formg', id]), ...OPMG_LIB.map(id => ['opmg', id])].map(([d, id]) => JSON.parse(fs.readFileSync(new URL(`../${d}/${id}.json`, import.meta.url))));
const shelf = shelfOf(PAINTS);

test('the registry: every jar of every picture, its key its own, in the plan\'s order', () => {
  const E = entriesOf(plans);
  assert.equal(E.length, plans.reduce((a, p) => a + p.jars.length, 0));
  assert.equal(new Set(E.map(e => e.key)).size, E.length, 'a key twice');
  for (const p of plans) assert.deepEqual(E.filter(e => e.art === p.id).map(e => e.name), [...p.jars.filter(j => !j.late), ...p.jars.filter(j => j.late)].map(j => j.name), `${p.id}: the list's order, a late jar after the first layer's`);
  const red = E.filter(e => e.art === 'porsche-red-k');
  assert.deepEqual([red.at(-2).name, red.at(-1).name, red.at(-1).no], ['Black', 'Jar 6', 41], 'the orange the first of Layer 2, its line 41');
  const five = E.filter(e => e.name === 'Jar 5');
  assert.ok(new Set(five.map(e => e.hex)).size > 1 && new Set(five.map(e => e.key)).size === five.length, '"Jar 5" is another paint in every picture, and another key');
  const v2 = E.filter(e => e.art === 'porsche-race-k');
  assert.equal(v2.length, 35);   // 43, then the jar canon on the owner's word (2026-11-10): eight jars under 60 cm into their nearest, not 22, 10, 31
  assert.equal(v2.filter(e => e.coats === 2).length, 24);
  console.log(`registry: ${plans.length} pictures, ${E.length} jars, ${new Set(E.map(e => e.hex)).size} hexes`);
});

test('the same hex elsewhere is a candidate, of another picture only', () => {
  const E = entriesOf(plans), same = sameHex(E), black = E.find(e => e.art === 'porsche-race-k' && e.name === 'Black');
  const other = same(black);
  assert.ok(other.length >= 2 && other.every(q => q.art !== 'porsche-race-k' && q.hex === black.hex));
});

test('a jar\'s line is its legs end to end', () => {
  assert.equal(lineOf({ cells: [{ legs: [[2.5, 10, 30], [7.5, 30, 12]] }, { legs: [[12.5, 5, 0]] }] }), 20 + 18 + 5);
});

test('the parts in words when a part is under a fortieth: no 1 : 1600', () => {
  assert.deepEqual(partsSay([['red', 3], ['mother', 1]]), [['red', 3], ['mother', 1]]);
  assert.deepEqual(partsSay([['white', 480], ['black', 16], ['red', 1]]), [['white', 'most'], ['black', 'a little'], ['red', 'a touch']]);
  assert.deepEqual(partsSay([['white', 200], ['black', 1]]), [['white', 'most'], ['black', 'by drops']]);
});

test('the model: real 3\'s dark reds from Red and the dark mother, as the hand recipes, within ΔE 2', () => {
  for (const q of real3Of(1)) {
    const h = RECIPES[q.jar.name];
    if (!h || !h.parts.some(([p]) => p === 'Jar 43' || p === 'darkbrown')) continue;
    const r = jarRecipe(q.jar.hex, shelf);
    assert.equal(r.family, 'red', q.jar.name);
    assert.ok(r.de <= 2, `${q.jar.name}: ΔE ${r.de}`);
    assert.ok(r.parts.every(([p]) => !['black', 'ultramarine', 'skyblue'].includes(p)), `${q.jar.name}: a red with no Black, no blue`);
  }
});

test('the model: the families by the jar\'s colour, and no White in a fierce red', () => {
  assert.equal(familyOf(linLab(hexLin('#B60D0D'))), 'red');
  assert.equal(familyOf(linLab(hexLin('#9B9C9A'))), 'grey');
  assert.equal(familyOf(linLab(hexLin('#162637'))), 'blue');
  assert.equal(familyOf(linLab(hexLin('#3F410F'))), 'olive');
  for (const hex of ['#FD0D0D', '#DC0D0D', '#C00D0D']) assert.ok(!jarRecipe(hex, shelf).parts.some(([p]) => p === 'white'), hex);
  const neon = jarRecipe('#EEED08', shelf);
  assert.deepEqual(neon.parts.map(([p]) => p), ['fluo']);
});

test('the model: White lightens a grey as a painter expects, by drops of Black, not 1 : 1600', () => {
  const white = shelf.find(p => p.id === 'white'), black = shelf.find(p => p.id === 'black');
  const L = mixLab([[white, 30], [black, 1]])[0];
  assert.ok(L > 40 && L < 90, `White 30 : Black 1 → L ${L.toFixed(1)}`);
  assert.ok(de2000(linLab(hexLin('#9B9C9A')), mixLab([[white, 480], [black, 8]])) < 5);
});
