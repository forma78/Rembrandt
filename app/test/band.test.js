import test from 'node:test';
import assert from 'node:assert/strict';
import { plotRun, DEFAULTS, at, pieceLen } from '../src/strokes.js';
import { SKETCH, ringBlank, centreOf, bandOf, layersOf, imprintOf, fitPieces, offPiece, toMachine, dipParts, bandPasses, lengthOf, DIP_RUN, MIN_PIECE } from '../src/band.js';

const close = (a, b, e = 1e-6) => Math.abs(a - b) < e;
const flat = { rows: 5, pitch: 8, width: 5, stack: 0, twist: 0, roll: 0 };
const line = (z = 0, roll = 0) => [{ x: -150, y: 0, z, roll }, { x: 0, y: 0, z, roll }, { x: 150, y: 0, z, roll }];

test('the centre runs through its anchors, depth and roll there as set', () => {
  const A = [{ x: -100, y: 50, z: 10, roll: 0 }, { x: 0, y: -40, z: 60, roll: 45 }, { x: 120, y: 30, z: -20, roll: 90 }];
  const C = centreOf(A, 1);
  for (const a of A) {
    const c = C.reduce((b, q) => Math.hypot(q.p[0] - a.x, q.p[1] - a.y) < Math.hypot(b.p[0] - a.x, b.p[1] - a.y) ? q : b);
    assert.ok(Math.hypot(c.p[0] - a.x, c.p[1] - a.y) < 1e-6, `misses ${a.x}, ${a.y}`);
    assert.ok(close(c.p[2], a.z, 1e-6) && close(c.roll, a.roll, 1e-6));
  }
  for (let i = 1; i < C.length; i++) assert.ok(Math.hypot(C[i].p[0] - C[i - 1].p[0], C[i].p[1] - C[i - 1].p[1]) < 1.5, 'no jump');
});

test('flat, the rows lie a pitch apart; edge-on they close up; the stack fans them', () => {
  const face = bandOf(line(), flat), mid = Math.floor(face.n / 2);
  assert.ok(close(face.pitch[mid], 8, 1e-6));
  const ys = face.S[mid].map(p => p[1]);
  for (let k = 1; k < 5; k++) assert.ok(close(Math.abs(ys[k] - ys[k - 1]), 8, 1e-6));
  assert.equal(face.back[mid], false, 'roll 0: its face towards you');
  const edge = bandOf(line(0, 90), flat);
  assert.ok(edge.pitch[mid] < 1e-6, 'edge-on, nothing apart');
  const deck = bandOf(line(0, 90), { ...flat, stack: 8 });
  assert.ok(Math.abs(deck.S[mid][4][1] - deck.S[mid][0][1]) > 7, 'the deck fans out');
  assert.equal(bandOf(line(0, 180), flat).back[mid], true, 'roll 180: its back');
});

test('the construction turns: tipped 90° about X a flat band is seen edge-on', () => {
  const mid = Math.floor(bandOf(line(), flat).n / 2);
  assert.ok(bandOf(line(), { ...flat, tilt: 90 }).pitch[mid] < 1e-6);
  assert.ok(close(bandOf(line(), { ...flat, swing: 60 }).pitch[mid], 8, 1e-6), 'turned about Y the rows keep apart');
  const b = bandOf(line(), { ...flat, zoom: 0.5, dx: 20, dy: -10 });
  assert.ok(close(b.M[mid][0], 20, 1e-6) && close(b.M[mid][1], -10, 1e-6), 'moved');
  assert.ok(close(b.pitch[mid], 4, 1e-6), 'sized');
});

// a loop: out to the right, round, back across itself nearer to you
const loop = [
  { x: -160, y: 40, z: -40, roll: 0 }, { x: 60, y: 40, z: -30, roll: 0 }, { x: 120, y: -60, z: 0, roll: 0 },
  { x: 20, y: -140, z: 20, roll: 0 }, { x: -40, y: -60, z: 40, roll: 0 }, { x: -20, y: 120, z: 60, roll: 0 },
];
test('where the band crosses itself, the near part is a layer up and covers the far one', () => {
  const b = bandOf(loop, { ...flat, rows: 4 }), lay = layersOf(b);
  assert.equal(Math.max(...lay), 2);
  const near = lay.findIndex(l => l === 2);
  assert.ok(b.M[near][2] > 0, 'the part lying over is the near one');
  const imp = imprintOf(b, lay, { width: 5 });
  assert.ok(imp.byLayer[1] > 0 && imp.byLayer[2] > 0);
  // the far part has a gap where the near one crosses it: more runs than rows
  assert.ok(imp.runs.length > 4);
});

test('a run fitted into lines and arcs: within 0.1 mm, joined, the tangent continuous', () => {
  const pts = [];
  for (let s = 0; s <= 400; s += 1.5) pts.push([s - 200, 40 * Math.sin(s / 50) + 0.002 * s * s]);
  const ps = fitPieces(pts);
  assert.ok(ps.length > 2 && ps.length < 120, `${ps.length} pieces`);
  for (let i = 1; i < ps.length; i++) {
    assert.ok(Math.hypot(ps[i].a.x - ps[i - 1].b.x, ps[i].a.y - ps[i - 1].b.y) < 1e-9, `open at ${i}`);
    const t0 = at(ps[i - 1], pieceLen(ps[i - 1])).t, t1 = at(ps[i], 0).t;
    assert.ok(Math.hypot(t0.x - t1.x, t0.y - t1.y) < 0.01, `a kink at ${i}`);   // under half a degree, where a flat arc went as a line
  }
  for (const p of pts.map(toMachine)) {
    const d = Math.min(...ps.map(g => offPiece(g, p)));
    assert.ok(d <= 0.1 + 1e-9, `${d} mm off`);
  }
  for (const g of ps) assert.ok(g.t === 'L' || g.r <= 2000, `an arc of ${g.r} mm`);
  assert.deepEqual(toMachine([10, -20]), { x: 20, y: 10 });   // right of the centre → Y+; up → X+
});

test('the Watercolour run: a dip every dip run, the next landing where the tail began, neighbours half apart', () => {
  const pts = Array.from({ length: 1201 }, (_, i) => [i * 1.5, 0]);   // 1800 mm
  const even = dipParts(pts, 0, DIP_RUN, 70), odd = dipParts(pts, 1, DIP_RUN, 70);
  assert.equal(even.length, 3);
  assert.ok(close(lengthOf(even[0]), DIP_RUN, 1e-6) && close(even[1][0][0], DIP_RUN - 70, 1e-6), 'lands where the tail began');
  assert.ok(close(lengthOf(odd[0]), DIP_RUN / 2, 1e-6), 'the next row cut half a dip run on');
  for (const p of [...even, ...odd]) assert.ok(lengthOf(p) <= DIP_RUN + 70 + 1e-6);
  assert.equal(dipParts(pts.slice(0, 300), 0).length, 1, 'short enough: one dip');
});

test("the owner's ribbon runs: layers in order, a pause between, no gaps in the paint", () => {
  const o = { rows: 16, pitch: 8, width: 5, stack: 6, twist: 0, roll: 0 };
  const b = bandOf(SKETCH, o), lay = layersOf(b), imp = imprintOf(b, lay, o);
  assert.ok(Math.max(...lay) >= 2, 'the big band lies over the loop');
  assert.ok(imp.red < 0.5);
  const { passes, rows } = bandPasses(imp.runs, { tail: 70 });
  assert.deepEqual(passes.map(p => p.key), ['N1', 'N2']);
  assert.match(passes[1].why, /N2.*over N1.*dry/);
  const run = plotRun({ ...DEFAULTS, snake: true, pause: false, lift: false, tail: 70, speed: 150, travel: 180, minPiece: MIN_PIECE }, passes);
  // no arc ends where it starts: the board would run it as a full circle
  let pos = null, circles = 0;
  for (const b2 of run.blocks) if (b2.kind === 'move') for (const c of b2.cmds) {
    const t = c.split(' ');
    if (t[0] === 'M' || t[0] === 'L') pos = [+t[1], +t[2]];
    if (t[0] === 'A') { const q = [+t[3], +t[4]]; if (pos && Math.hypot(q[0] - pos[0], q[1] - pos[1]) < 0.02) circles++; pos = q; }
  }
  assert.equal(circles, 0);
  assert.equal(run.blocks.filter(x => x.kind === 'pause').length, 1);
  assert.ok(run.blocks.every(x => !(x.cmds || []).some(c => /NaN|undefined|Infinity/.test(c))));
  assert.ok(Math.abs(run.length - imp.total) / imp.total < 0.01, `painted ${run.length} of ${imp.total} mm`);
  assert.equal(rows.length, passes.reduce((a, p) => a + p.ps.length, 0));
  assert.equal(ringBlank().length, 13);
});
