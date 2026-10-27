import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanSettings, fromBlend, fitDrawing, pencilPlan, colourMap, nearestPencil, svgOf, manifestOf, pathLength, swatchSvg } from '../src/pencilplan.js';

const rect = extra => ({ kind: 'blend', id: 1, x: 10, y: 10, w: 45, h: 50, keys: [{ x: 0.3, y: 0.35, w: 0.4, h: 0.4 }], corners: [5, 3], steps: 4, core: false,
  ss: [{ a: [0, 0], b: [0, 1], paint: 'p03' }, { a: [1, 0], b: [1, 1], paint: 'oyellow' }], ...extra });
const settings = extra => cleanSettings({ paperW: 70, paperH: 80, band: 1, pitch: 0.5, nib: 0.4, rects: [rect()], ...extra });

test('every separation uses an enabled real pencil; green is an explicit inventory colour', () => {
  const o = settings({ pencils: [{ id: 'b', name: 'Blue', hex: '#0E72B5', enabled: true, repeats: 2 }, { id: 'y', name: 'Yellow', hex: '#FA9B00', enabled: true, repeats: 1 }, { id: 'g', name: 'Green', hex: '#019430', enabled: false }] });
  const P = pencilPlan(o);
  assert.deepEqual(new Set(P.passes.map(p => p.id)), new Set(['b', 'y']));
  assert.ok(P.passes.every(p => p.hex === o.pencils.find(q => p.id === q.id).hex));
  assert.equal(nearestPencil('#019430', [{ id: 'green', hex: '#019430', enabled: true }]), 'green');
  assert.deepEqual(pencilPlan({ ...o, pencils: o.pencils.map(p => ({ ...p, enabled: false })) }).passes, []);
});

test('white means unmarked paper, including in the core; assignments can choose paper or a specific pencil', () => {
  const r = rect({ core: true, ss: [{ a: [0, 0], b: [1, 1], paint: 'white' }, { a: [0.3, 0.35], b: [0.7, 0.75], paint: 'white', core: true }] });
  const o = settings({ rects: [r] });
  assert.equal(pencilPlan(o).strokes, 0);
  assert.ok(pencilPlan({ ...o, whitePaper: false }).strokes > 0);
  const q = settings({ assignments: { p03: 'green', oyellow: 'paper' } });
  assert.equal(colourMap(q).p03, 'green'); assert.equal(colourMap(q).oyellow, null);
  assert.deepEqual(pencilPlan(q).passes.map(p => p.id), ['green']);
});

test('coats repeat exact paths, stay in one pass and are included in distance, lifts, time and SVG', () => {
  const o = settings({ pencils: [{ id: 'blue', name: 'Blue', hex: '#0E72B5', enabled: true, repeats: 3 }] }), P = pencilPlan(o), p = P.passes[0];
  assert.equal(P.passes.length, 1); assert.equal(p.strokes, p.paths.length * 3);
  assert.ok(Math.abs(p.length - p.paths.reduce((s, p) => s + pathLength(p), 0) * 3) < 1e-6);
  assert.ok(p.seconds >= p.length / o.speed + p.strokes * o.liftSeconds);
  const svg = svgOf(P), manifest = manifestOf(P);
  assert.equal((svg.match(/<path /g) || []).length, p.strokes);
  assert.equal((svg.match(/data-repeat=/g) || []).length, 3);
  assert.equal(manifest.passes[0].strokes, p.strokes); assert.equal(manifest.passes[0].file, '01-blue.svg');
  assert.ok(!svg.includes('<rect'), 'paper is not a plotted outline or fill');
});

test('each path and the full nib stay on the sheet when a design crosses all four edges', () => {
  const o = settings({ rects: [rect({ x: -10, y: -10, w: 90, h: 100, corners: [8, 3] })] }), P = pencilPlan(o);
  assert.ok(P.strokes > 0);
  for (const layer of P.layers) for (const pts of layer.paths) {
    assert.ok(pts.length >= 2);
    for (const [x, y] of pts) {
      assert.ok(Number.isFinite(x) && Number.isFinite(y));
      assert.ok(x >= o.nib / 2 - 1e-7 && x <= o.paperW - o.nib / 2 + 1e-7, `x ${x}`);
      assert.ok(y >= o.nib / 2 - 1e-7 && y <= o.paperH - o.nib / 2 + 1e-7, `y ${y}`);
    }
  }
});

test('BLEND import preserves all normalized colour placements and fits uniformly on A3', () => {
  const source = { rects: [rect({ x: 100, y: 200, w: 400, h: 600 })] }, before = JSON.stringify(source);
  const o = fromBlend(source), r = o.rects[0];
  assert.equal(JSON.stringify(source), before, 'the source is untouched');
  assert.deepEqual(r.ss.map(s => [s.a, s.b, s.paint]), source.rects[0].ss.map(s => [s.a, s.b, s.paint]));
  assert.ok(Math.abs(r.w / r.h - 2 / 3) < 1e-9);
  assert.ok(r.x >= o.margin && r.y >= o.margin && r.x + r.w <= o.paperW - o.margin + 1e-7 && r.y + r.h <= o.paperH - o.margin + 1e-7);
  assert.deepEqual(fitDrawing([], o), []);
  assert.throws(() => fromBlend({ rects: [] }), /no BLEND/);
});

test('SVG separation is one pencil only; metadata round-trips names, paper, geometry and inventory', () => {
  const o = settings({ source: 'Study <&>', pencils: [{ id: 'blue', name: 'Blue <&> "03"', hex: '#0E72B5', enabled: true, repeats: 1 }, { id: 'gold', name: 'Gold', hex: '#FA9B00', enabled: true, repeats: 1 }] });
  const P = pencilPlan(o), svg = svgOf(P, 'blue');
  assert.ok(svg.includes('width="70mm" height="80mm"')); assert.ok(svg.includes('Blue &lt;&amp;&gt; &quot;03&quot;'));
  assert.ok(svg.includes('data-pencil="blue"')); assert.ok(!svg.includes('data-pencil="gold"'));
  const metadata = JSON.parse(svg.match(/<metadata id="rembrandt-test">(.*?)<\/metadata>/s)[1]);
  assert.deepEqual(cleanSettings(metadata.settings), o);
  assert.ok(swatchSvg(o).includes('id="labels"')); assert.ok(swatchSvg(o).includes('id="strokes"'));
});

test('the same study makes stable paths; invalid values are bounded and oversized geometry fails clearly', () => {
  const o = settings(), a = pencilPlan(o), b = pencilPlan(o);
  assert.deepEqual(a.layers.map(p => p.paths), b.layers.map(p => p.paths));
  const clamped = cleanSettings({ pitch: 0, nib: Infinity, paperW: -10, pencils: [{ id: '../bad', hex: '#123456', repeats: 200 }] });
  assert.equal(clamped.pitch, 0.25); assert.equal(clamped.paperW, 50); assert.equal(clamped.pencils[0].repeats, 6); assert.match(clamped.pencils[0].id, /^pencil-/);
  assert.doesNotThrow(() => cleanSettings(null));
  assert.throws(() => pencilPlan(settings({ rects: [rect({ w: 1e8 })] })), /too large/);
});

test('a green digital reference uses a real green pencil; its blank paper produces no marks', () => {
  const o = settings({ pencils: [{ id: 'blue', name: 'Blue', hex: '#0E72B5', enabled: true, repeats: 1 },
    { id: 'yellow', name: 'Yellow', hex: '#FA9B00', enabled: true, repeats: 1 }, { id: 'green', name: 'Green', hex: '#019430', enabled: true, repeats: 1 }] });
  const ref = { nx: 1, ny: 1, h: 100, pixels: new Uint8ClampedArray([1, 148, 48, 255]) };
  assert.deepEqual(pencilPlan(o, ref).passes.map(p => p.id), ['green']);
  ref.pixels.set([251, 249, 243, 255]);
  assert.equal(pencilPlan(o, ref).strokes, 0);
});
