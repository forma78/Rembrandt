import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseLayer, paintLength, layerLength, runOrderOf, widthAt, brushOutline, paintName } from '../src/layers.js';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'adjustments');
const files = readdirSync(DIR).filter(f => /^layer\d.*\.svg$/.test(f)).sort();
const layers = files.map(f => parseLayer(readFileSync(join(DIR, f), 'utf8')));

test("Sonnet's layout: four layers, 13 paints, 500 × 700 mm, lines 8 mm", () => {
  assert.equal(layers.length, 4);
  assert.equal(layers.reduce((a, L) => a + L.paints.length, 0), 13);
  for (const L of layers) { assert.deepEqual(L.view, { w: 500, h: 700 }); assert.equal(L.width, 8); }
  assert.deepEqual(layers[0].paints.map(p => p.key), ['crimson', 'red', 'orange', 'yellow']);
  assert.equal(layers[0].paints[3].hex, '#E8A41C');
});

test('the lengths Sonnet gave: 6.4, 8.4, 15.0 and 16.7 m', () => {
  assert.deepEqual(layers.map(L => +(layerLength(L) / 1000).toFixed(1)), [6.4, 8.4, 15.0, 16.7]);
  assert.equal(layers[0].paints[0].lines.length, 29);
  assert.ok(Math.abs(paintLength(layers[0].paints[0]) / 1000 - 5.0) < 0.01);
});

test('the lighter paint runs first: yellow, orange, red, crimson; cream … dark grey', () => {
  assert.deepEqual(runOrderOf(layers[0].paints).map(p => p.key), ['yellow', 'orange', 'red', 'crimson']);
  assert.deepEqual(runOrderOf(layers[2].paints).map(p => p.key), ['cream', 'light-gray', 'mid-gray', 'dark-gray']);
  assert.equal(paintName('dark-gray'), 'Dark grey');
});

test('a line as the brush leaves it: full width at the home, an eighth of it at the end of the tail', () => {
  assert.equal(widthAt(0, 300, 8, 120), 8);
  assert.equal(widthAt(180, 300, 8, 120), 8);
  assert.ok(widthAt(240, 300, 8, 120) < 8 && widthAt(240, 300, 8, 120) > 1);
  assert.ok(Math.abs(widthAt(300, 300, 8, 120) - 0.96) < 1e-9);
  assert.ok(widthAt(0, 50, 8, 120) === 8 && widthAt(10, 50, 8, 120) < 8, 'a line shorter than the tail thins right from its home');
});

test('the outline: wide at the home end, thin at the tail end, either way round', () => {
  const pts = Array.from({ length: 31 }, (_, i) => ({ x: i * 10, y: 0 }));
  for (const home of ['start', 'end']) {
    const o = brushOutline(pts, 8, home, 120), at = x => o.filter(q => Math.abs(q.x - x) < 1e-6).map(q => q.y);
    const homeX = home === 'start' ? 0 : 300, tailX = 300 - homeX;
    const wHome = Math.max(...at(homeX)) - Math.min(...at(homeX)), wTail = Math.max(...at(tailX)) - Math.min(...at(tailX));
    assert.ok(Math.abs(wHome - 8) < 1e-9 && Math.abs(wTail - 0.96) < 1e-9, `${home}: ${wHome} at the home, ${wTail} at the tail`);
    assert.ok(o.some(q => (home === 'start' ? q.x < -3.9 : q.x > 303.9)), 'a round home behind the first point');
  }
});
