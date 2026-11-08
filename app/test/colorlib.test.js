import test from 'node:test';
import assert from 'node:assert/strict';
import { PAINTS, paintOf, KUZYA, RECIPES, ORDER, usesOf, SOURCES } from '../src/colorlib.js';
import { real3Of } from '../src/labplan.js';
import { REAL3 } from '../src/labreal3.js';
import { deltaE } from '../src/canon.js';

// COLORS, the library (the owner, 2026-11-08: "build a COLORS tab next to LAB, so that our library is there. Kuzya proposed cards";
// "put the recommendations right in the cards!").
const JARS = real3Of(1).map(q => q.jar);

test('every jar of real 3 a card: a recipe and its advice, by its name on LAB', () => {
  for (const j of JARS) {
    const r = RECIPES[j.name];
    assert.ok(r, `${j.name} has a recipe`);
    assert.ok(r.parts.length && r.advice.length > 20, `${j.name}: parts and advice`);
    assert.ok(typeof r.de === 'number', `${j.name}: the model's ΔE, est.`);
  }
  assert.deepEqual(Object.keys(RECIPES).sort(), JARS.map(j => j.name).sort(), 'no recipe for a jar LAB has not');
});

test('every part a paint on the shelf or a jar mixed before it; the mothers first', () => {
  const names = new Set(JARS.map(j => j.name));
  for (const [jar, r] of Object.entries(RECIPES)) for (const [p] of r.parts) {
    assert.ok(paintOf(p) || names.has(p), `${jar}: ${p}`);
    if (names.has(p)) assert.ok(ORDER.includes(p) && RECIPES[p].mother, `${jar} takes ${p}: a mother, mixed first`);
  }
  assert.equal(ORDER[0], 'Jar 43', 'Jar 43 first: every dark one takes it');
});

test('a pair is one mixing: the same parts, each the other\'s pair, the same colour within ΔE 1.5', () => {
  const pairs = Object.entries(RECIPES).filter(([, r]) => r.pair);
  assert.equal(pairs.length, 6);
  for (const [j, r] of pairs) {
    assert.equal(RECIPES[r.pair].pair, j);
    assert.deepEqual(RECIPES[r.pair].parts, r.parts);
    const hex = n => JARS.find(q => q.name === n).hex;
    assert.ok(deltaE(hex(j), hex(r.pair)) < 1.5, `${j} · ${r.pair}`);
  }
});

test('the dark ones darken by Dark Brown, through Jar 43, never by ⑫ or Black', () => {
  assert.deepEqual(RECIPES['Jar 43'].parts.map(([p]) => p), ['red', 'darkbrown']);
  for (const [jar, r] of Object.entries(RECIPES)) if (r.parts.some(([p]) => p === 'Jar 43')) {
    assert.deepEqual(r.parts.map(([p]) => p), ['red', 'Jar 43'], jar);
    assert.match(r.advice, /Dark Brown/, `${jar}: the advice says why`);
  }
  assert.ok(usesOf('darkbrown').via.includes('Jar 38'));
});

test('Kuzya\'s scale is real 3\'s own jars, to the digit; 3 and 12 went into others', () => {
  const raw = new Map(REAL3.pic.jars.map(j => [j.name, j.hex]));
  KUZYA.slice(0, 11).forEach(([hex, jar]) => assert.equal(hex, raw.get(jar), jar));
  assert.ok(!JARS.some(j => j.name === 'Jar 16') && !JARS.some(j => j.name === 'Seam'));
  for (const [jar, r] of Object.entries(RECIPES)) if (r.kuzya) assert.equal(KUZYA[r.kuzya - 1][1], jar);
});

test('every paint a source, a colour and its CIELAB; the ids once', () => {
  assert.equal(new Set(PAINTS.map(p => p.id)).size, PAINTS.length);
  for (const p of PAINTS) {
    assert.ok(SOURCES[p.from], p.id);
    assert.match(p.hex, /^#[0-9A-F]{6}$/, p.id);
    assert.equal(p.lab.length, 3, p.id);
  }
});
