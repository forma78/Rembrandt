import test from 'node:test';
import assert from 'node:assert/strict';
import { autoForms, formCellsOf, formPlan } from '../src/formplan.js';
import { cleanPencils } from '../src/dacheplan.js';
import { PRISMA_PENCILS } from '../src/prismaplan.js';

// FORM (the owner, 2026-10-30): OPM-P's rings in any form, the photo's colours
const area = P => P.reduce((s, p, i) => s + (p[0] * P[(i + 1) % P.length][1] - P[(i + 1) % P.length][0] * p[1]), 0) / 2;
const R = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
const SHAPES = {
  square: [R(0, 0, 60, 60)],
  L: [[[0, 0], [100, 0], [100, 40], [40, 40], [40, 100], [0, 100]]],
  frame: [R(0, 0, 100, 100), R(30, 30, 40, 40).reverse()],
  dumbbell: [[[0, 0], [60, 0], [60, 25], [140, 25], [140, 0], [200, 0], [200, 70], [140, 70], [140, 45], [60, 45], [60, 70], [0, 70]]],
  star: [Array.from({ length: 10 }, (_, i) => { const r = i % 2 ? 30 : 80, a = Math.PI / 2 + i * Math.PI / 5; return [100 + r * Math.cos(a), 100 + r * Math.sin(a)]; })],
  strip: [R(0, 0, 300, 5)],
};
const key = p => `${p[0].toFixed(4)},${p[1].toFixed(4)}`;
const edgesOf = cells => { const E = new Map(); for (const c of cells) c.poly.forEach((a, i) => { const b = c.poly[(i + 1) % c.poly.length], k = key(a) < key(b) ? `${key(a)}|${key(b)}` : `${key(b)}|${key(a)}`; E.set(k, (E.get(k) ?? 0) + 1); }); return E; };

test('FORM rings: every form tiled by its cells, no area lost, no edge shared by three', () => {
  for (const [name, loops] of Object.entries(SHAPES)) {
    const { regions, cells } = formCellsOf([{ id: 0, loops }], { pitch: 6 });
    const A = loops.reduce((s, L) => s + area(L), 0), sum = cells.reduce((s, c) => s + c.area, 0);
    assert.ok(Math.abs(sum - A) < 1e-6 * A, `${name}: ${sum} of ${A}`);
    assert.ok(regions[0].ok, `${name}: the wavefront ran to its end`);
    assert.ok([...edgesOf(cells).values()].every(v => v <= 2), `${name}: an edge three times`);
  }
});

test('FORM rings: the form\'s depth over a whole number of rows, none wider than the brush by more than 5 %', () => {
  const sq = formCellsOf([{ id: 0, loops: SHAPES.square }], { pitch: 6 }).regions[0];
  assert.equal(sq.depth, 30); assert.equal(sq.bands, 5); assert.equal(sq.step, 6);
  const L = formCellsOf([{ id: 0, loops: SHAPES.L }], { pitch: 6 }).regions[0];
  assert.equal(L.depth, 20); assert.ok(L.step <= 6 * 1.05 + 1e-9);
  // a square's cells: four sides, a band each ring, every side's rows parallel to it
  const { cells } = formCellsOf([{ id: 0, loops: SHAPES.square }], { pitch: 6 });
  assert.equal(cells.length, 20);
});

test('FORM rings: a concave corner in facets, OPM-W\'s — a 90° corner three blocks more', () => {
  const plain = formCellsOf([{ id: 0, loops: SHAPES.L }], { pitch: 6, facets: 0 }).regions[0];
  const three = formCellsOf([{ id: 0, loops: SHAPES.L }], { pitch: 6, facets: 3 }).regions[0];
  assert.equal(three.lines.length - plain.lines.length, 3);
  assert.equal(three.lines.filter(L => L.facet).length, 3);
});

test('FORM rings: a border crossing itself still its cells — a slip past a neighbour\'s edge off, a bow-tie both lobes (the owner\'s glass left empty, 2026-10-30)', () => {
  const slip = formCellsOf([{ id: 0, loops: [[[0, 0], [60, 0], [60, 60], [60.4, 45], [0, 60]]] }], { pitch: 6 });
  assert.ok(slip.regions[0].ok, 'the wavefront ran to its end');
  const kept = 60 * 60 - 60 * (60 - 45.1) / 2, got = slip.cells.reduce((s, c) => s + c.area, 0);
  assert.ok(Math.abs(got - kept) < 1, `${got} of ${kept}`);
  const bow = formCellsOf([{ id: 0, loops: [[[0, 0], [40, 40], [40, 0], [0, 40]]] }], { pitch: 6 });
  assert.ok(bow.regions[0].ok);
  assert.ok(Math.abs(bow.cells.reduce((s, c) => s + c.area, 0) - 800) < 1e-6);
});

// a photo: its left half red, its right half blue, a small green speck in the red
function photo(W, H, h = 1) {
  const nx = W / h, ny = H / h, data = new Uint8ClampedArray(nx * ny * 4);
  for (let iy = 0; iy < ny; iy++) for (let ix = 0; ix < nx; ix++) {
    const x = (ix + 0.5) * h, y = (iy + 0.5) * h, q = 4 * ((ny - 1 - iy) * nx + ix);
    const c = Math.hypot(x - 40, y - 50) < 4 ? [40, 160, 60] : x < W / 2 ? [210, 40, 40] : [40, 60, 200];
    data[q] = c[0]; data[q + 1] = c[1]; data[q + 2] = c[2]; data[q + 3] = 255;
  }
  return { nx, ny, h, data };
}

test('FORM forms: the photo\'s patches, a speck melted, two neighbours share their border to the last digit', () => {
  const pencils = cleanPencils(PRISMA_PENCILS), forms = autoForms(photo(160, 100), 160, 100, { pencils, smallest: 20 });
  assert.equal(forms.length, 2);
  assert.ok(Math.abs(forms.reduce((s, F) => s + F.area, 0) - 160 * 100) < 1e-6);
  assert.notEqual(forms[0].pencil, forms[1].pencil);
  const pts = F => new Set(F.loops.flat().map(key)), a = pts(forms[0]), b = pts(forms[1]);
  assert.ok([...a].filter(k => b.has(k)).length >= 2, 'the border\'s ends shared');
});

test('FORM plan: every line once, DRAG a colour at a time, every cell a colour', () => {
  const pencils = cleanPencils(PRISMA_PENCILS), img = photo(160, 100), forms = autoForms(img, 160, 100, { pencils, smallest: 20 });
  const D = formPlan(forms, img, { pencils, pitch: 6, background: true });
  assert.ok(D.cells.length > 20 && D.cells.every(c => c.pencil));
  assert.ok(D.drags.length >= 2);   // the red and the blue; the speck's cell its own colour, as the photo has it
  const seen = new Set();
  for (const L of D.lines) for (let i = 1; i < L.pts.length; i++) {
    const a = key(L.pts[i - 1]), b = key(L.pts[i]), k = a < b ? `${a}|${b}` : `${b}|${a}`;
    assert.ok(!seen.has(k), 'a piece drawn twice'); seen.add(k);
  }
  assert.ok(D.lines.some(L => L.kind === 'row') && D.lines.some(L => L.kind === 'ray'));
});

// a photo: a dark ground, a light car-ish block in its middle, off the edges
function onGround(W, H) {
  const nx = W, ny = H, data = new Uint8ClampedArray(nx * ny * 4);
  for (let iy = 0; iy < ny; iy++) for (let ix = 0; ix < nx; ix++) {
    const x = ix + 0.5, y = iy + 0.5, q = 4 * ((ny - 1 - iy) * nx + ix), c = x > 40 && x < 160 && y > 30 && y < 90 ? (x < 100 ? [200, 200, 205] : [210, 40, 40]) : [40, 40, 45];
    data[q] = c[0]; data[q + 1] = c[1]; data[q + 2] = c[2]; data[q + 3] = 255;
  }
  return { nx, ny, h: 1, data };
}

test('FORM background: a form touching the photo\'s edge left out, the ground there (the owner: "we do not need the background")', () => {
  const pencils = cleanPencils(PRISMA_PENCILS), img = onGround(200, 120), forms = autoForms(img, 200, 120, { pencils, smallest: 20 });
  assert.equal(forms.filter(F => F.bg).length, 1);
  const D = formPlan(forms, img, { pencils, pitch: 6 }), A = D.cells.reduce((s, c) => s + c.area, 0);
  assert.ok(Math.abs(A - 120 * 60) < 0.05 * 120 * 60, `the block alone: ${A}`);   // its corners a little cut by Straighten
});

test('FORM colour: a form its own pencil — Flat every cell it, Shaded the photo\'s light and dark in its family (the owner: "and how do I set the colour?")', () => {
  const pencils = cleanPencils(PRISMA_PENCILS), W = 200, H = 120, nx = W, ny = H, data = new Uint8ClampedArray(nx * ny * 4);
  for (let iy = 0; iy < ny; iy++) for (let ix = 0; ix < nx; ix++) {                 // a grey block, lighter at its top: a highlight
    const x = ix + 0.5, y = iy + 0.5, q = 4 * ((ny - 1 - iy) * nx + ix), v = x > 40 && x < 160 && y > 30 && y < 90 ? (y > 70 ? 225 : 120) : 30;
    data[q] = data[q + 1] = data[q + 2] = v; data[q + 3] = 255;
  }
  const img = { nx, ny, h: 1, data }, forms = autoForms(img, W, H, { pencils, smallest: 60 }), F = forms.filter(G => !G.bg).sort((a, b) => b.area - a.area)[0];
  const red = pencils.find(p => /red/i.test(p.name) && p.on).id;
  const flat = formPlan(forms.map(G => G === F ? { ...G, colour: red, flat: true } : G), img, { pencils, pitch: 6 });
  const mine = D => D.cells.filter(c => D.regions[c.reg].form === F.id);
  assert.ok(mine(flat).length && mine(flat).every(c => c.pencil === red));
  const shaded = formPlan(forms.map(G => G === F ? { ...G, colour: red } : G), img, { pencils, pitch: 6 });
  assert.ok(new Set(mine(shaded).map(c => c.pencil)).size >= 2, 'the highlight a lighter pencil');
});

import { reflectForms } from '../src/formplan.js';
test('FORM Reflect: every form cut along the axis, the kept side and its mirror, the axis\'s points shared, the copy reading the photo through the mirror (the owner: "the knife and the mirrored copy")', () => {
  // a car's front, 200 wide: its body across the axis x = 100, a mirror on the left only, a stray speck on the right
  const body = { id: 0, loops: [R(20, 0, 160, 80)], pencil: 'red' }, left = { id: 1, loops: [R(0, 60, 20, 15)], pencil: 'black' }, right = { id: 2, loops: [R(185, 10, 10, 10)], pencil: 'grey' };
  const out = reflectForms([body, left, right], [100, -10], [100, 90], 1);              // a → b upward: +1, the left of it kept
  const area2 = out.reduce((s, F) => s + area(F.loops[0]), 0);
  assert.equal(out.length, 4);                                                         // the body's left half and its mirror, the mirror and its mirror; the speck gone
  assert.ok(Math.abs(area2 - (160 * 80 + 2 * 20 * 15)) < 1e-6, `${area2}`);
  const onAxis = F => new Set(F.loops[0].filter(p => p[0] === 100).map(p => p.join()));
  const halves = out.filter(F => F.loops[0].some(p => p[0] === 100));
  assert.equal(halves.length, 2); assert.deepEqual([...onAxis(halves[0])].sort(), [...onAxis(halves[1])].sort());
  const copy = out.find(F => F.id !== 1 && F.loops[0].some(p => Math.abs(p[0] - 200) < 1e-9 && Math.abs(p[1] - 60) < 1e-9)), m = copy.read;   // the left mirror's copy, at x 180 … 200
  const at = q => [m[0] * q[0] + m[1] * q[1] + m[4], m[2] * q[0] + m[3] * q[1] + m[5]];
  assert.deepEqual(at([190, 60]).map(v => Math.round(v * 1e9) / 1e9), [10, 60]);       // read where its original lies: x 190 ← 10
  assert.ok(out.every(F => area(F.loops[0]) > 0), 'every outline anticlockwise');
});

import { mergeForms } from '../src/formplan.js';
test('FORM Unite: a form and its mirror one form, the mirrored half still reading the photo through the mirror (the owner: "merge the chosen objects — a new key next to O")', () => {
  const pencils = cleanPencils(PRISMA_PENCILS), W = 200, H = 100, data = new Uint8ClampedArray(W * H * 4);
  for (let iy = 0; iy < H; iy++) for (let ix = 0; ix < W; ix++) { const q = 4 * ((H - 1 - iy) * W + ix), c = ix < 100 ? [210, 40, 40] : [40, 60, 200]; data.set([...c, 255], q); }
  const img = { nx: W, ny: H, h: 1, data }, body = { id: 0, loops: [R(20, 20, 160, 60)], pencil: 'red' };
  const halves = reflectForms([body], [100, 0], [100, 100], 1), one = mergeForms(halves, halves.map(F => F.id));
  assert.equal(one.length, 1); assert.equal(one[0].parts.length, 2);
  assert.ok(Math.abs(area(one[0].loops[0]) - 160 * 60) < 1e-6);
  const D = formPlan(one, img, { pencils, pitch: 6 }), ids = new Set(D.cells.map(c => c.pencil));
  assert.equal(ids.size, 1, [...ids].join());                                          // the right half red too, read through the mirror
});

import { paletteForms } from '../src/formplan.js';
import { PAINT } from '../src/tapeplan.js';
import { INKA_META, labOf } from '../src/inkaplan.js';
import { linOf } from '../src/color.js';
test('FORM AUTO a variation every press, and a palette over the sausages by lightness (the owner: "random generations on Auto"; "I miss the colours")', () => {
  const pencils = cleanPencils(PRISMA_PENCILS), img = photo(160, 100);
  const sig = fs => fs.map(F => F.loops[0].length + ':' + Math.round(F.area)).sort().join();
  assert.equal(sig(autoForms(img, 160, 100, { pencils, smallest: 20 })), sig(autoForms(img, 160, 100, { pencils, smallest: 20 })));   // no seed: the same
  assert.notEqual(sig(autoForms(img, 160, 100, { pencils, smallest: 20, seed: 7 })), sig(autoForms(img, 160, 100, { pencils, smallest: 20, seed: 8 })));
  const L = id => labOf(linOf(PAINT[id].hex))[0], dark = { id: 0, loops: [R(0, 0, 60, 60)], ss: [{ a: [5, 30], b: [25, 30], paint: 'black' }] }, light = { id: 1, loops: [R(60, 0, 60, 60)], ss: [{ a: [70, 30], b: [90, 30], paint: 'white' }] };
  const pal = INKA_META.Inka, out = paletteForms([dark, light], null, { ...pal, accent: [] }, 3);
  assert.ok(out.every(F => F.ss.every(q => pal.core.includes(q.paint))));
  assert.ok(L(out[0].ss[0].paint) <= L(out[1].ss[0].paint) + 25, 'the dark one the darker paint, near enough');
});
