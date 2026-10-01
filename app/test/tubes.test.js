import test from 'node:test';
import assert from 'node:assert/strict';
import { INVENTORY, tubeOf, defaultLayers, runOrder, lightness } from '../src/tubes.js';

test('inside a layer the lighter tube runs first: yellow, orange, red; white, grey', () => {
  const [light, sheet] = defaultLayers();
  assert.deepEqual(runOrder(light.tubes).map(t => t.id), ['yellow', 'orange', 'red']);
  assert.deepEqual(runOrder(['grey', 'white']).map(t => t.id), ['white', 'grey']);
});

test('the same tube twice keeps both places, in the order they were added', () => {
  const o = runOrder(['red', 'yellow', 'orange', 'yellow']);
  assert.deepEqual(o, [{ id: 'yellow', i: 1 }, { id: 'yellow', i: 3 }, { id: 'orange', i: 2 }, { id: 'red', i: 0 }]);
});

test('the inventory: every tube of the layers is in it, lightness from white to black', () => {
  for (const L of defaultLayers()) for (const id of L.tubes) assert.ok(tubeOf(id), id);
  assert.ok(lightness(tubeOf('white').hex) > 0.9 && lightness(tubeOf('black').hex) < 0.25);
  assert.equal(new Set(INVENTORY.map(t => t.id)).size, INVENTORY.length);
});

test('the default layers are fresh copies', () => {
  const a = defaultLayers(); a[0].tubes.push('white');
  assert.deepEqual(defaultLayers()[0].tubes, ['yellow', 'orange', 'red']);
});
