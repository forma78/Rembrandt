import test from 'node:test';
import assert from 'node:assert/strict';
import { caranPlan, colourMap, compileRun, snapshotOf, mapPixels, validateSnapshot } from '../src/caranplan.js';
import { cleanRect, GROUND } from '../src/inkaplan.js';

const box = [
  { id: 'red', name: 'Red', hex: '#D52B30', on: true },
  { id: 'blue', name: 'Blue', hex: '#246BB4', on: true },
  { id: 'cream', name: 'Cream', hex: '#F1E6CD', on: true, light: true },
];
const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
function raster(W = 20, H = 20, paint = () => GROUND) {
  const data = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) data.set([...paint(x, H - 1 - y), 255], (y * W + x) * 4);
  return { version: 1, width: W, height: H, nx: W, ny: H, h: 1, data,
    settings: { edgeLeft: 50, edgeBottom: 0, rects: [cleanRect({ id: 1, x: 1, y: 1, w: W - 2, h: H - 2, kind: 'blend', steps: 5, corners: [2, 1], keys: [{ x: 0.3, y: 0.3, w: 0.4, h: 0.4 }], core: true })] } };
}

test('each raster pixel selects one real pencil; pale colours are ordinary pencils', () => {
  const s = raster(12, 12, (x, y) => x < 4 ? rgb(box[0].hex) : x < 8 ? rgb(box[1].hex) : rgb(box[2].hex));
  const before = s.data.slice(), m = colourMap(s, box), p = caranPlan(s, box);
  assert.equal(m.colours, 3); assert.deepEqual([...m.counts], [48, 48, 48]);
  assert.equal(p.missing, 0); assert.equal(p.passes.length, 3);
  assert.deepEqual(mapPixels(s, p), before); assert.deepEqual(s.data, before);
  assert.ok(p.passes.every(q => q.strokes.length === 1));
});

test('an isolated square and a pale stripe survive, with or without perpendicular details', () => {
  const s = raster(20, 20, (x, y) => x === 10 && y === 10 ? rgb(box[0].hex) : y === 4 ? rgb(box[2].hex) : rgb(box[1].hex));
  for (const details of [true, false]) {
    const p = caranPlan(s, box, { details });
    assert.equal(p.counts[0], 1); assert.equal(p.counts[2], 20); assert.equal(p.missing, 0);
    assert.ok(p.passes.find(q => q.pencil === 'red').mm > 0);
    assert.deepEqual(mapPixels(s, p), s.data);
  }
});

test('a continuous colour route lifts across other colours and never joins them with a drawn connector', () => {
  const s = raster(24, 20, (x, y) => x < 7 || x > 16 ? rgb(box[0].hex) : rgb(box[1].hex));
  const p = caranPlan(s, box), red = p.passes.find(q => q.pencil === 'red');
  assert.ok(red.lifts > 0);
  for (const g of red.strokes[0].filter(g => !g.turn)) {
    const x = (g.a[0] + g.b[0]) / 2;
    assert.ok(x < 7.4 || x > 16.6, `Red crosses the blue region at ${x}`);
  }
});

test('coats are explicit repeats; a default run has no hidden extra layer', () => {
  const s = raster(20, 20, () => rgb(box[0].hex));
  const a = caranPlan(s, box, { coats: 1 }), b = caranPlan(s, box, { coats: 2 });
  assert.ok(Math.abs(b.mm - a.mm * 2) < 1e-6);
  assert.equal(a.passes.length, 1); assert.equal(b.passes.length, 1);
});

test('a frame retains real paper coordinates; no colour is discarded for having a short run', () => {
  const s = raster(20, 20, (x, y) => x === 10 && y === 10 ? rgb(box[0].hex) : rgb(box[1].hex));
  const p = caranPlan(s, box, { frame: { x0: 8, y0: 8, x1: 13, y1: 13 } });
  assert.equal(p.target, 25); assert.equal(p.missing, 0); assert.equal(p.counts[0], 1);
  assert.equal(p.passes.length, 2);
});

test('fractional frame edges clip drawn lines and arcs at the original location', () => {
  const s = raster(20, 20, () => rgb(box[1].hex)), frame = { x0: 3.2, y0: 4.3, x1: 14.7, y1: 17.8 };
  const p = caranPlan(s, box, { frame });
  for (const P of p.passes) for (const g of P.strokes[0]) if (!g.turn) for (const q of [g.a, g.b]) {
    assert.ok(q[0] >= frame.x0 - 1e-6 && q[0] <= frame.x1 + 1e-6);
    assert.ok(q[1] >= frame.y0 - 1e-6 && q[1] <= frame.y1 + 1e-6);
  }
  assert.equal(compileRun(p, s).fault, '');
  assert.ok(p.passes.every(P => !P.strokes[0][0].turn && !P.strokes[0].at(-1).turn));
});

test('a run uses a continuous move per pencil, on-path elbow lifts, and pencil changes before a lift', () => {
  const s = raster(24, 20, (x, y) => x < 7 || x > 16 ? rgb(box[0].hex) : rgb(box[1].hex));
  const p = caranPlan(s, box), r = compileRun(p, s);
  assert.equal(r.fault, '');
  assert.equal(r.blocks.filter(b => b.kind === 'move' && /^F /.test(b.cmds[0])).length, p.passes.length);
  assert.equal(r.blocks.filter(b => b.kind === 'p-pause').length, p.passes.length);
  assert.ok(r.blocks.some(b => b.cmds?.some(c => /^W 2 25 /.test(c))));
  for (let i = 0; i < r.blocks.length; i++) if (r.blocks[i].kind === 'p-pause' && i > 5) {
    assert.equal(r.blocks[i - 1].kind, 'move'); assert.match(r.blocks[i - 1].cmds[0], /^F /);
    assert.equal(r.blocks[i + 1].kind, 'arm');
  }
  assert.ok(r.seconds >= r.motionSeconds); assert.ok(r.liftSeconds > 0);
});

test('the frozen source is unchanged by pencil, speed and frame changes', () => {
  const state = { boardW: 30, boardH: 30, brush: 2, swell: 0, density: 50, corner: 2, change: 3, join: 0, nodes: [], rects: [cleanRect({ x: 2, y: 2, w: 26, h: 26, step: 3, ss: [] })] };
  const raw = JSON.stringify(state), s = snapshotOf(state), data = s.data.slice();
  caranPlan(s, box, { speed: 30 }); caranPlan(s, box.slice(0, 1), { speed: 100, coats: 2 });
  assert.deepEqual(s.data, data); assert.equal(JSON.stringify(state), raw);
});

function withSpokes(s) {
  s.settings.rects[0].ss = [
    { a: [0.35, 0], b: [0.35, 1], paint: 'red' },
    { a: [0, 0.75], b: [1, 0.75], paint: 'red' },
  ];
  return s;
}

test('sausage guides retain crosswise strokes and rings without changing frozen colours', () => {
  const s = withSpokes(raster(30, 30, () => rgb(box[1].hex))), before = s.data.slice();
  const p = caranPlan(s, box), route = p.passes[0].strokes[0], crosses = route.filter(g => !g.turn && g.spoke);
  assert.equal(p.spokes, 2); assert.ok(p.spokeMM > 0); assert.equal(p.missing, 0);
  assert.ok(crosses.some(g => Math.abs(g.b[0] - g.a[0]) < 1e-6 && Math.abs(g.b[1] - g.a[1]) > 8), 'Vertical boards cross the horizontal rings');
  assert.ok(crosses.some(g => Math.abs(g.b[1] - g.a[1]) < 1e-6 && Math.abs(g.b[0] - g.a[0]) > 8), 'Horizontal boards cross the vertical rings');
  assert.ok(route.some(g => !g.turn && !g.spoke && g.t === 'A'), 'Curved rings remain outside the sausage guides');
  assert.deepEqual(p.passes.map(P => P.pencil), ['blue'], 'The old red paint never replaces the actual blue Result');
  assert.deepEqual(mapPixels(s, p), before); assert.deepEqual(s.data, before);
});

test('cross strokes can be switched off independently of small details on an existing snapshot', () => {
  const s = withSpokes(raster(30, 30, () => rgb(box[1].hex)));
  const on = caranPlan(s, box, { details: false }), off = caranPlan(s, box, { spokes: false, details: false });
  assert.ok(on.spokeMM > 0); assert.equal(off.spokeMM, 0); assert.equal(off.spokes, 0);
  assert.ok(!off.passes.some(P => P.strokes[0].some(g => g.spoke)));
  assert.deepEqual(on.labels, off.labels); assert.deepEqual(mapPixels(s, on), mapPixels(s, off));
  assert.equal(on.missing, 0); assert.equal(off.missing, 0);
});

test('cross strokes respect the frame, explicit coats and the runner pencil changes', () => {
  const s = withSpokes(raster(30, 30, (x, y) => y < 14 ? rgb(box[0].hex) : rgb(box[1].hex)));
  const frame = { x0: 6.2, y0: 4.3, x1: 23.7, y1: 26.8 };
  const p = caranPlan(s, box, { frame }), twice = caranPlan(s, box, { frame, coats: 2 }), r = compileRun(p, s);
  assert.ok(p.spokeMM > 0); assert.ok(Math.abs(twice.spokeMM - p.spokeMM * 2) < 1e-6);
  assert.equal(r.fault, ''); assert.equal(p.missing, 0);
  assert.equal(r.blocks.filter(b => b.kind === 'p-pause').length, p.passes.length);
  for (const P of p.passes) for (const g of P.strokes[0]) if (!g.turn) for (const q of [g.a, g.b]) {
    assert.ok(q[0] >= frame.x0 - 1e-6 && q[0] <= frame.x1 + 1e-6);
    assert.ok(q[1] >= frame.y0 - 1e-6 && q[1] <= frame.y1 + 1e-6);
  }
});

test('a darker source square at a sausage keeps a distinct real pencil when ordinary matching merges it', () => {
  const pencils = [box[1], { id: 'deepblue', name: 'Deep blue', hex: '#153F78', on: true }];
  const s = withSpokes(raster(30, 30, (x, y) => x >= 9 && x <= 12 && y >= 8 && y <= 9 ? rgb('#205EA2') : rgb(box[1].hex))), frozen = s.data.slice();
  const plain = caranPlan(s, pencils, { squares: false }), preserved = caranPlan(s, pencils);
  assert.deepEqual(plain.passes.map(P => P.pencil), ['blue']);
  assert.equal(preserved.squareCells, 8);
  assert.equal(preserved.counts[preserved.pencils.findIndex(p => p.id === 'deepblue')], 8);
  assert.ok(preserved.passes.some(P => P.pencil === 'deepblue' && P.spokeMM > 0));
  assert.equal(preserved.missing, 0); assert.equal(compileRun(preserved, s).fault, '');
  assert.deepEqual(s.data, frozen);
  const twice = caranPlan(s, pencils, { coats: 2 });
  assert.ok(Math.abs(twice.mm - preserved.mm * 2) < 1e-6, 'Contrast uses a pencil, without hidden coats');
});

test('square preservation creates no marks on uniform sources, away from sausages, or without a suitable pencil', () => {
  const pencils = [box[1], { id: 'deepblue', name: 'Deep blue', hex: '#153F78', on: true }];
  const uniform = withSpokes(raster(30, 30, () => rgb(box[1].hex)));
  assert.equal(caranPlan(uniform, pencils).squareCells, 0);
  const away = raster(30, 30, (x, y) => x >= 9 && x <= 12 && y >= 8 && y <= 9 ? rgb('#205EA2') : rgb(box[1].hex));
  assert.equal(caranPlan(away, pencils).squareCells, 0);
  assert.equal(caranPlan(withSpokes(away), [box[1]]).squareCells, 0);
});

test('malformed or oversized snapshots fail before allocating a colour map', () => {
  assert.throws(() => validateSnapshot({ nx: 100000, ny: 100000, h: 1, width: 1, height: 1, data: [] }), /Invalid/);
  assert.throws(() => validateSnapshot({ ...raster(), data: [] }), /Invalid/);
  assert.throws(() => snapshotOf({ rects: [{}], boardW: Infinity, boardH: 40 }), /invalid/);
});
