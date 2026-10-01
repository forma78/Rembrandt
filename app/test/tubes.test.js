import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_INVENTORY, inventory, setInventory, cleanInventory, addTube, moveTube, removeTube, tubeOf, defaultLayers, layersFrom, LAYERS, runOrder, lightness, readEnds, writeEnds } from '../src/tubes.js';

const fresh = () => setInventory(DEFAULT_INVENTORY);

test('four layers, the same as on Adjustments: Light, Dark below; Sheet, Black above', () => {
  assert.deepEqual(defaultLayers().map(l => [l.n, l.name, l.side]), [[1, 'Light', 'below'], [2, 'Dark', 'below'], [3, 'Sheet', 'above'], [4, 'Black', 'above']]);
  assert.deepEqual(LAYERS.map(l => l.n), [1, 2, 3, 4]);
});

test('inside a layer the lighter tube runs first', () => {
  fresh();
  const [light, dark, sheet] = defaultLayers();
  assert.deepEqual(runOrder(light.tubes).map(t => t.id), ['yellow', 'orange', 'red', 'crimson']);
  assert.deepEqual(runOrder(dark.tubes).map(t => t.id), ['oxblood', 'dark-red', 'maroon', 'black']);
  assert.deepEqual(runOrder(sheet.tubes).map(t => t.id), ['white', 'cream', 'light-gray', 'grey', 'dark-gray']);
});

test('the same tube twice keeps both places, in the order they were added', () => {
  fresh();
  const o = runOrder(['red', 'yellow', 'orange', 'yellow']);
  assert.deepEqual(o, [{ id: 'yellow', i: 1 }, { id: 'yellow', i: 3 }, { id: 'orange', i: 2 }, { id: 'red', i: 0 }]);
});

test('a saved three-layer state goes over to the four; the old defaults take the new ones', () => {
  const mine = [{ tubes: ['yellow', 'red'] }, { tubes: ['white', 'grey', 'black'] }, { tubes: ['maroon', 'black'] }];
  assert.deepEqual(layersFrom(mine).map(l => l.tubes), [['yellow', 'red'], ['maroon', 'black'], ['white', 'grey'], ['black']]);
  const old = [{ tubes: ['yellow', 'orange', 'red'] }, { tubes: ['white', 'grey', 'black'] }, { tubes: ['black'] }];
  assert.deepEqual(layersFrom(old), defaultLayers());
  assert.deepEqual(layersFrom(null), defaultLayers());
});

test('the inventory: a new tube at the end, dragged next to Yellow; renamed; checked when read', () => {
  fresh();
  const lemon = addTube('#f5e52a', 'Lemon');
  assert.equal(inventory().at(-1).id, lemon.id);
  moveTube(lemon.id, 'orange');
  assert.deepEqual(inventory().slice(0, 3).map(t => t.name), ['Yellow', 'Lemon', 'Orange']);
  tubeOf(lemon.id).name = 'Citron Pebeo';
  assert.equal(tubeOf(lemon.id).name, 'Citron Pebeo');
  removeTube(lemon.id); assert.equal(tubeOf(lemon.id), null);
  assert.equal(cleanInventory([{ id: 'a', hex: 'red' }, { id: 'b', hex: '#00ff00', name: 'Ombre Brulée' }, { id: 'b', hex: '#000000' }]).length, 1);
  assert.equal(setInventory([]), false, 'an empty list leaves the inventory as it was');
  assert.equal(tubeOf('mid-gray').id, 'grey', "Sonnet's mid grey is Grey N5");
});

test('ends per layer are shared, Round for the black at the top by default', () => {
  const store = new Map(), storage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  assert.equal(readEnds(storage)[4], 'round');
  writeEnds(storage, { ...readEnds(storage), 1: 'round' });
  assert.deepEqual(readEnds(storage), { 1: 'round', 4: 'round' });
  assert.ok(lightness('#FFFFFF') > 0.99);
});
