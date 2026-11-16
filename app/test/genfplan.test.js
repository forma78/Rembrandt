// GEN-F: a picture into FORM-G's legs, a sketch (the owner, 2026-11-16). The grid FORM-G's, the colours asked within 10 … 100, the canon of the jars on it,
// the plain ground bare canvas, the same picture the same sketch.
import test from 'node:test';
import assert from 'node:assert/strict';
import { GEN, GEN_FORMATS, formatOf, fieldOf, fitOf, bareMask, boxOf, binsOf, paletteOf, columnsOf, spansOf, sketchOf, hexOfLab, labOfHex, lineOf } from '../src/genfplan.js';
import { passesOf, seqOf } from '../src/formgplan.js';

// a picture W × H px: a white ground, a red disc with a dark band across it and a white highlight inside, the disc's left half lighter
function disc(W, H) {
  const px = new Uint8ClampedArray(W * H * 4).fill(255), cx = W / 2, cy = H / 2, r = Math.min(W, H) * 0.4;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = 4 * (y * W + x), d = Math.hypot(x - cx, y - cy);
    if (d > r) continue;
    let c = x < cx ? [220, 40, 30] : [160, 10, 15];
    if (Math.abs(y - cy) < r * 0.12) c = [30, 25, 28];
    if (Math.hypot(x - cx * 0.8, y - cy * 0.6) < r * 0.1) c = [255, 255, 255];
    px.set([...c, 255], i);
  }
  return px;
}
function sketch(fid = '60x60', K = 12, W = 300, H = 300) {
  const f = formatOf(fid), work = disc(W, H), { mask, ground } = bareMask(work, W, H), box = boxOf(mask, W, H), fit = fitOf(f, box.w, box.h);
  // the crop at 1 px a mm, nearest: what the page's drawImage does, without the smoothing
  const PW = fit.N * GEN.pitch, R = fit.R, rgba = new Uint8ClampedArray(PW * R * 4), m = new Uint8Array(PW * R);
  for (let y = 0; y < R; y++) for (let x = 0; x < PW; x++) {
    const sx = Math.min(W - 1, Math.floor(box.x + (x + 0.5) * box.w / PW)), sy = Math.min(H - 1, Math.floor(box.y + (y + 0.5) * box.h / R)), s = sy * W + sx;
    rgba.set(work.subarray(4 * s, 4 * s + 4), 4 * (y * PW + x)); m[y * PW + x] = mask[s];
  }
  return { f, fit, ground, box, mask, ...sketchOf(binsOf(rgba, m, fit.N, R), fit, f, K) };
}

test('the formats: three, FORM-G\'s way round, the field within the reach and 30 mm of canvas round it', () => {
  assert.deepEqual(GEN_FORMATS.map(f => f.id), ['60x60', '60x80', '70x100']);
  assert.deepEqual(GEN.colours, [10, 100]);
  for (const f of GEN_FORMATS) {
    const F = fieldOf(f);
    assert.ok(f.w <= f.h, `${f.id}: w across Y, the short side`);
    assert.ok(F.w <= 568.5 - 20 && F.h <= 865 - 20, `${f.id}: in the reach, est.`);
    assert.ok(F.w <= f.w - 2 * GEN.margin && F.h <= f.h - 2 * GEN.margin, `${f.id}: 30 mm of canvas round it`);
  }
  assert.deepEqual(fieldOf(formatOf('60x60')), { w: 540, h: 540 });
  assert.deepEqual(fieldOf(formatOf('70x100')), { w: 540, h: 843 });
  assert.equal(formatOf('nothing').id, '60x60');
});

test('the fit: as large as the field lets it, its aspect kept, a whole number of 5 mm columns, in the middle', () => {
  const wide = fitOf(formatOf('60x60'), 2000, 1000), tall = fitOf(formatOf('70x100'), 941, 1672);
  assert.equal(wide.N, 108); assert.equal(wide.R, 270); assert.equal(wide.left, 30); assert.equal(wide.top, 165);
  assert.ok(tall.R <= 843 && tall.N * 5 <= 540, 'the classic upright, along X');
  assert.ok(Math.abs(tall.N * 5 / tall.R - 941 / 1672) < 0.02, 'its aspect');
  assert.equal(tall.left, (700 - tall.N * 5) / 2);
});

test('the colour: a hex there and back, CIELAB', () => {
  for (const h of ['#E6E5DF', '#EE8A22', '#9D0D0D', '#0C0C0C', '#757C91']) assert.equal(hexOfLab(labOfHex(h)), h);
});

test('the ground: a plain border is bare canvas, a white highlight inside the picture is not', () => {
  const W = 200, H = 160, px = disc(W, H), { mask, ground } = bareMask(px, W, H);
  assert.equal(ground, '#FFFFFF');
  assert.equal(mask[0], 1, 'a corner bare');
  assert.equal(mask[Math.round(H * 0.6 / 2) * W + Math.round(W * 0.8 / 2)], 0, 'the highlight painted');
  const b = boxOf(mask, W, H);
  assert.ok(b.w < W && b.h < H && b.w > 0.75 * H * 0.8, 'the box round the disc');
  const noisy = new Uint8ClampedArray(W * H * 4).map((_, i) => i % 4 === 3 ? 255 : (i * 37) % 251);
  assert.equal(bareMask(noisy, W, H).ground, null, 'no plain ground: none bare');
  assert.equal(bareMask(noisy, W, H).mask.reduce((a, v) => a + v, 0), 0);
});

test('the sketch: FORM-G\'s json — its grid, legs along X within the field, every jar its cells, light to dark', () => {
  const s = sketch(), { pic, f, fit } = s, F = fieldOf(f);
  assert.equal(pic.w, 600); assert.equal(pic.h, 600); assert.equal(pic.pitch, 5); assert.equal(pic.columns, fit.N);
  assert.ok(pic.jars.length >= 3 && pic.jars.length <= 12, `${pic.jars.length} jars of 12 asked`);
  const L = j => labOfHex(j.hex)[0];
  for (let i = 1; i < pic.jars.length; i++) assert.ok(L(pic.jars[i - 1]) >= L(pic.jars[i]), 'light to dark');
  for (const j of pic.jars) {
    assert.match(j.hex, /^#[0-9A-F]{6}$/); assert.ok(j.coats === 1 || j.coats === 2); assert.ok(j.cells.length);
    j.cells.forEach((c, i) => assert.equal(c.n, i + 1, 'cells numbered'));
    for (const c of j.cells) for (const [x, a, b] of c.legs) {
      assert.ok(Math.abs((x - fit.left) / 5 - 0.5 - Math.round((x - fit.left) / 5 - 0.5)) < 1e-6, 'on a column');
      assert.ok(x > (600 - F.w) / 2 && x < (600 + F.w) / 2, 'across, in the field');
      for (const y of [a, b]) assert.ok(y >= (600 - F.h) / 2 - 0.05 && y <= (600 + F.h) / 2 + 0.05, `along, in the field: ${y}`);
      assert.ok(Math.abs(b - a) >= GEN.crumb, 'no leg under 3 mm');
    }
    for (const c of j.cells) for (let k = 1; k < c.legs.length; k++) {
      assert.equal(c.legs[k][0] - c.legs[k - 1][0], 5, 'a snake: the next column');
      assert.ok(Math.abs(c.legs[k][1] - c.legs[k - 1][2]) <= GEN.stepMax + 1e-6, 'its step on the paper short');
    }
  }
  assert.ok(seqOf(pic).length >= pic.jars.length && passesOf(pic).length === seqOf(pic).length, 'FORM-G reads it');
});

test('the ground stays bare; the disc is painted', () => {
  const { pic, fit, f } = sketch();
  const at = (x, y) => pic.jars.some(j => j.cells.some(c => c.legs.some(([lx, a, b]) => Math.abs(lx - x) < 2.6 && y >= Math.min(a, b) && y <= Math.max(a, b))));
  assert.ok(at(300, 300), 'the middle painted');
  assert.ok(!at(fit.left + 3, f.h - fit.top - 3), 'the box\'s corner, outside the disc, bare');
});

test('the same picture and colours, the same sketch; more colours asked, never fewer jars painting', () => {
  const a = sketch('60x60', 20), b = sketch('60x60', 20);
  assert.deepEqual(a.pic, b.pic);
  assert.ok(sketch('60x60', 40).made >= sketch('60x60', 10).made);
});

test('the canon of the jars: none with less line than the canvas\'s long side, but those with nothing near; its legs kept', () => {
  const s = sketch('60x60', 30), line = lineOf(s.raw), side = 600, legs = p => p.jars.reduce((a, j) => a + j.cells.reduce((u, c) => u + c.legs.length, 0), 0);
  assert.equal(legs(s.pic), legs(s.raw), 'every leg painted');
  const kept = new Set(s.kept.map(q => q.id));
  for (const j of s.pic.jars) assert.ok(line(j) >= side || kept.has(j.id), `${j.name}: ${line(j)} mm`);
  for (const q of s.out) assert.ok(q.de <= 25 && s.pic.jars.some(j => j.id === q.into));
});

test('a column\'s programme: runs at least minSpan, the miss carried to the next column', () => {
  const N = 4, R = 60, lab = new Float32Array(N * R * 3), on = new Uint8Array(N * R).fill(1);
  for (let c = 0; c < N; c++) for (let r = 0; r < R; r++) { const j = c * R + r; lab[3 * j] = r < 30 ? 70 : 30; lab[3 * j + 1] = r === 40 ? 60 : 0; }   // a 1 mm spike at 40: no jar for it
  const pal = [[70, 0, 0], [30, 0, 0], [30, 60, 0]], g = columnsOf({ N, R, lab, on }, pal);
  const col = [...g.slice(0, R)];
  assert.deepEqual([...new Set(col)], [0, 1], 'the spike under minSpan into its neighbour');
  assert.equal(col.indexOf(1), 30, 'the cut where the picture turns');
  const sp = spansOf(g, N, R, pal.map(p => p[0]));
  assert.ok(sp.every(s => s.b - s.a >= GEN.minSpan));
  assert.ok(sp.some(s => s.p === 0 && s.b === 33), 'the lighter 3 mm under the darker it butts');
  assert.ok(paletteOf({ N, R, lab, on }, 2).length === 2);
});

test('a sketch\'s colours numbered 1 … n after the canon, no gaps', () => {
  const s = sketch('60x60', 30);
  assert.ok(s.out.length, 'the canon took some out');
  assert.deepEqual(s.pic.jars.map(j => j.name), s.pic.jars.map((_, i) => `Colour ${i + 1}`));
});
