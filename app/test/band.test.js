import test from 'node:test';
import assert from 'node:assert/strict';
import { plotRun, DEFAULTS, at, pieceLen, ELBOW_HOVER } from '../src/strokes.js';
import { SKETCH, ringBlank, centreOf, bandOf, layeredOf, cutsOf, imprintOf, fitPieces, offPiece, toMachine, dipParts, bandPasses, lengthOf, squeezed, DIP_RUN, NO_DIP, DIP_LAP } from '../src/band.js';

const close = (a, b, e = 1e-6) => Math.abs(a - b) < e;
const flat = { rows: 5, pitch: 8, width: 5, stack: 0, twist: 0, squeeze: 0 };
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
test('where the band crosses itself it is cut there, along it; the stretch lying over is painted after', () => {
  const b = bandOf(loop, { ...flat, rows: 4 }), L = layeredOf(b, { width: 5 });
  assert.equal(L.cuts.length, 1, 'one cut, where the far part goes under');
  assert.ok(L.auto);
  const [a, z] = L.stretches.sort((p, q) => p.s0 - q.s0);
  assert.ok(Math.abs(a.s1 - L.cuts[0]) < 2 && z.s0 >= L.cuts[0], 'two stretches, one each side of the cut');
  // each stretch one layer, the far one first: a stretch's own depth decides
  const depth = st => { let d = 0; for (let i = st.i0; i <= st.i1; i++) d += b.M[i][2]; return d / (st.i1 - st.i0 + 1); };
  const [far, near] = depth(a) < depth(z) ? [a, z] : [z, a];
  assert.equal(far.layer, 1); assert.equal(near.layer, 2);
  for (let i = 0; i < b.n - 1; i++) assert.equal(L.lay[i], b.s[i] < L.cuts[0] ? a.layer : z.layer);
  assert.ok(L.imp.byLayer[1] > 0 && L.imp.byLayer[2] > 0);
  assert.ok(L.imp.runs.length > 4, 'the far part has a gap where the near one crosses it');
  // the owner's own cut: kept as given
  const own = layeredOf(b, { width: 5, cuts: [100] });
  assert.deepEqual(own.cuts, [100]); assert.equal(own.auto, false);
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
  const o = { rows: 16, pitch: 8, width: 5, stack: 6, twist: 0, squeeze: 0 };
  const b = bandOf(SKETCH, o), L = layeredOf(b, o), imp = L.imp;
  assert.ok(L.cuts.length >= 1, 'the big band lies over the loop: cut');
  assert.ok(imp.red < 0.5);
  const { passes, rows } = bandPasses(imp.runs, { tail: 70 });
  assert.deepEqual(passes.map(p => p.key), L.stretches.map((_, j) => `N${j + 1}`), 'a pass a layer, in their order');
  assert.match(passes[1].why, /N2.*over N1.*dry/);
  const run = plotRun({ ...DEFAULTS, snake: true, pause: false, lift: false, tail: 70, speed: 150, travel: 180 }, passes);
  // no arc ends where it starts: the board would run it as a full circle
  let pos = null, circles = 0;
  for (const b2 of run.blocks) if (b2.kind === 'move') for (const c of b2.cmds) {
    const t = c.split(' ');
    if (t[0] === 'M' || t[0] === 'L') pos = [+t[1], +t[2]];
    if (t[0] === 'A') { const q = [+t[3], +t[4]]; if (pos && Math.hypot(q[0] - pos[0], q[1] - pos[1]) < 0.02) circles++; pos = q; }
  }
  assert.equal(circles, 0);
  assert.equal(run.blocks.filter(x => x.kind === 'pause').length, passes.length - 1, 'a pause between the layers');
  assert.ok(run.blocks.every(x => !(x.cmds || []).some(c => /NaN|undefined|Infinity/.test(c))));
  assert.ok(Math.abs(run.length - imp.total) / imp.total < 0.01, `painted ${run.length} of ${imp.total} mm`);
  assert.equal(rows.length, passes.reduce((a, p) => a + p.ps.length, 0));
  assert.equal(ringBlank().length, 13);
});

test('Squeeze: the whole band towards edge-on (+) or flat (−), nothing jumping along it', () => {
  assert.equal(squeezed(30, 0), 30);
  assert.ok(squeezed(30, 100) > 85 && squeezed(30, 100) < 90, 'nearly edge-on');
  assert.ok(Math.abs(squeezed(30, 50) - 49.1) < 0.1, 'tan 30° doubled');
  assert.ok(squeezed(170, 100) > 90 && squeezed(170, 100) < 100, 'its back closes the other way round');
  assert.ok(squeezed(200, 100) > 265 && squeezed(200, 100) < 270, 'in the same turn');
  assert.ok(Math.abs(squeezed(30, -100)) < 1 && Math.abs(squeezed(120, -100) - 180) < 2, 'opened flat');
  assert.ok(Math.abs(squeezed(0, 80)) < 1e-9, 'flat stays flat');
  assert.ok(Math.abs(squeezed(90, -80) - 90) < 1e-9, 'edge-on stays edge-on');
  for (const pct of [-90, -40, 40, 90]) for (let d = -360; d < 360; d += 0.5) {
    assert.ok(Math.abs(squeezed(d + 0.5, pct) - squeezed(d, pct)) < 40, `a jump at ${d}° with ${pct} %`);
  }
  const o = { rows: 6, pitch: 8, width: 5, stack: 0, twist: 0 };
  assert.ok(Math.max(...bandOf(line(0, 30), { ...o, squeeze: 100 }).pitch) < 0.5, 'a level band nearly edge-on: the bundle closed');
  // a band climbing in depth cannot stand quite edge-on to you: it closes as far as it can
  const apart = q => bandOf(SKETCH, { ...o, squeeze: q }).pitch.reduce((a, v) => a + v, 0);
  assert.ok(apart(100) < apart(50) && apart(50) < apart(0) && apart(0) < apart(-50) && apart(-50) < apart(-100), 'the more Squeeze, the closer the rows');
});

// NOLAN's first run on the machine, 2026-10-04 12:58 (logs/runs.jsonl): the
// tails' cuts left arcs whose ends meet; pressed into the walls as full
// circles of up to 1.1 m, they ran along all four walls with the brush
// down, through the cup — the owner switched the machine off at step 66.
// The run's own settings, Here and cup.
const RUN_1258 = {
  anchors: [[232, -98, -10, 46], [207, -292, 152, 3], [86, -403, 40, -20], [-57, -255, -38, -32], [-140, -172, -40, -24], [-257, -142, -13, -4], [-172, 40, 20, 40], [-108, 62, 62, -14], [-38, -17, 95, -65], [35, -57, 52, 56], [217, -47, 22, 28], [239, 92, -124, -7], [111, 94, -110, -27], [-60, 168, -52, -32], [-92, 92, -72, -22], [-32, 54, -110, 3], [2, 80, -150, 38]].map(([x, y, z, roll]) => ({ x, y, z, roll })),
  band: { rows: 17, pitch: 8, width: 1.5, stack: 0, twist: -2, squeeze: -87, tilt: 21.276947021484375, swing: -9.675262451171875, spin: -52, zoom: 0.78, dx: -22, dy: 89, lens: 31, step: 1.5 },
  here: { x: 226.2375, y: 333.7875 },
  cup: { x: 390.18, y: 0.1, est: {}, diameter: 50, height: 20, rim: 30, dip: -3, dwell: 1 },
};
const planOf = (R, extra = {}) => {
  const b = bandOf(R.anchors, R.band), imp = layeredOf(b, { width: R.band.width, cuts: extra.cuts }).imp;
  const { passes } = bandPasses(imp.runs, { ink: true, tail: 155 });
  return { passes, run: plotRun({ ...DEFAULTS, speed: 137, travel: 180, tail: 155, lift: false, ink: true, snake: true, pause: false, here: R.here, cup: R.cup, ...extra }, passes) };
};

test('the run of 2026-10-04 12:58: the brush stays where the ribbon is, never along the walls round it', () => {
  const { passes, run } = planOf(RUN_1258);
  assert.equal(run.fault, '');
  // the box the ribbon covers on the machine, the walls cutting it
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const p of passes) for (const path of p.ps) for (const g of path) for (const q of [g.a, g.b]) {
    x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y);
  }
  const H = RUN_1258.here, inBox = (x, y) => x >= Math.max(0, H.x + x0) - 1 && x <= H.x + x1 + 1 && y >= H.y + y0 - 1 && y <= H.y + y1 + 1;
  let pieces = 0;
  for (const b of run.blocks.filter(b => b.kind === 'move' && b.paintMM > 0)) {
    for (const c of b.cmds) {
      const t = c.split(' ');
      if (t[0] !== 'L' && t[0] !== 'A') continue;
      const [x, y] = t[0] === 'L' ? [+t[1], +t[2]] : [+t[3], +t[4]];
      assert.ok(inBox(x, y), `${c}: past the ribbon`);
      pieces++;
    }
    assert.ok(b.lengthMM < 1000, `a piece of the ribbon ${Math.round(b.lengthMM)} mm long`);
  }
  assert.ok(pieces > 1000);
  assert.ok(run.length < 30000, `${Math.round(run.length / 1000)} m with the brush down, 26.5 m drawn`);
  // what lies past the bottom wall (this Here puts the canvas 124 mm past it) is all that is pressed
  assert.ok(run.pastWall < 2000, `${Math.round(run.pastWall)} mm pressed`);
});

test('a plan longer on the board than drawn is refused: the fault PLAY reads', () => {
  const { run } = planOf(RUN_1258, { minPiece: 0 });   // the slivers let through: each a full circle on the board
  assert.match(run.fault, /^row \d+: /);
});

// The owner, 2026-10-04: a dip before a dot under 1 cm left a puddle of water —
// "under 50 mm, do not dip, work with what is on the brush".
test('INK ON: no dip before a piece under NO_DIP mm; a layer starts on its first piece long enough, with a dip', () => {
  const { passes, run } = planOf(RUN_1258, { noDipUnder: NO_DIP });
  assert.equal(run.gone, 0);
  const drawn = new Map(passes.flatMap(p => p.ps.map(path => [path[0].row, path.reduce((s, g) => s + pieceLen(g), 0)])));
  const passOf = new Map(passes.flatMap((p, n) => p.ps.map(path => [path[0].row, n])));
  const ran = passes.map(() => []);   // for each pass, its pieces in the order run: { L, dip }
  let dip = false;
  for (const b of run.blocks) {
    if (b.dip && b.kind === 'move') dip = true;
    if (b.kind === 'move' && b.paintMM > 0) { ran[passOf.get(b.row)].push({ L: drawn.get(b.row), dip }); dip = false; }
  }
  assert.equal(run.blocks.filter(b => b.kind === 'pause').length, 0, 'the watercolour: the layers one after another, no pause');
  let short = 0;
  ran.forEach((d, n) => {
    assert.equal(d.length, passes[n].ps.length, 'every piece run once');
    assert.ok(d[0].dip && d[0].L >= NO_DIP, `${passes[n].key} starts on a dot: ${d[0].L.toFixed(1)} mm`);
    d.forEach(({ L, dip: had }, i) => {
      const want = i === 0 || L >= NO_DIP;
      assert.equal(had, want, `${passes[n].key}, piece ${i + 1}: ${L.toFixed(1)} mm`);
      if (!want) short++;
    });
  });
  assert.ok(short > 40, `${short} pieces without a dip`);   // 110 under 50 mm when the depth broke the rows into patches
  assert.equal(run.dips, drawn.size - short);
  assert.equal(planOf(RUN_1258).run.dips, drawn.size, 'without the rule a dip before every piece');
});

// The owner, 2026-10-04 (machine/layers selected.png, layers how to cut.png):
// the layers are whole bundles, stretches of the ribbon cut along it — four
// on the first run's ribbon, cut where it turns over at the top left, at the
// pinch and at the right tip.
test('the layers of the first run\'s ribbon: four stretches, cut as the owner drew them', () => {
  const b = bandOf(RUN_1258.anchors, RUN_1258.band), L = layeredOf(b, { width: RUN_1258.band.width });
  const at = L.cuts.map(v => v / b.L * 100);
  assert.equal(at.length, 3);
  for (const [got, want] of at.map((v, j) => [v, [20, 54, 75][j]])) assert.ok(Math.abs(got - want) < 2.5, `a cut at ${got.toFixed(1)} %, ${want} % wanted`);
  // painted under first: the loop at the end, the left side, the fan at the start, the middle band over them all
  const byPlace = L.stretches.slice().sort((p, q) => p.s0 - q.s0).map(st => st.layer);
  assert.deepEqual(byPlace, [3, 2, 4, 1]);
  // a run keeps to its stretch: it never crosses a cut
  for (const r of L.imp.runs) {
    const s0 = b.s[r.i0], s1 = b.s[r.i0 + r.pts.length - 1];
    assert.ok(L.cuts.every(c => !(s0 < c && s1 > c)), `row ${r.k + 1} crosses a cut`);
  }
  for (const l of [1, 2, 3, 4]) assert.ok(L.imp.byLayer[l] > 5000, `N${l}: ${Math.round(L.imp.byLayer[l])} mm`);
  // the suggestion alone, from the imprint
  assert.deepEqual(cutsOf(b, imprintOf(b, null, { width: RUN_1258.band.width })), L.cuts);
});

test('INK ON with the rule: a layer drawn starting on a dot starts on its first long piece, with the dip', () => {
  const line = (x, y, L, row) => [{ t: 'L', a: { x, y }, b: { x, y: y + L }, row }];
  const ps = [line(0, 0, 20, 1), line(10, 0, 200, 2), line(20, 0, 30, 3), line(30, 0, 150, 4)];
  const cup = { x: 390.18, y: 0.1, est: {}, diameter: 50, height: 20, rim: 30, dip: -3, dwell: 1 };
  const run = plotRun({ ...DEFAULTS, ink: true, snake: true, pause: false, lift: false, tail: 15, here: { x: 400, y: 280 }, cup, noDipUnder: NO_DIP }, [{ key: 'N1', ps }]);
  const order = [], dips = [];
  let dip = false;
  for (const b of run.blocks) {
    if (b.kind === 'move' && b.dip) dip = true;
    if (b.kind === 'move' && b.paintMM > 0) { order.push(b.row); dips.push(dip); dip = false; }
  }
  assert.deepEqual(order, [2, 1, 3, 4], 'the 200 mm row first, the others in their order');
  assert.deepEqual(dips, [true, false, false, true], 'a dip before the long ones only');
});

// The owner, 2026-10-04: "on watercolour all 3 layers at once" (NOLAN.md §5:
// "all three layers can safely run together"); the paint waits for the dry.
test('NOLAN: INK ON runs the layers one after another, INK OFF pauses between them', () => {
  const b = bandOf(RUN_1258.anchors, RUN_1258.band), imp = layeredOf(b, { width: RUN_1258.band.width }).imp;
  for (const ink of [true, false]) {
    const { passes } = bandPasses(imp.runs, { ink, tail: 15 });
    const run = plotRun({ ...DEFAULTS, ink, snake: true, pause: false, lift: false, tail: 15, here: RUN_1258.here, cup: RUN_1258.cup }, passes);
    assert.equal(passes.length, 4);
    assert.equal(run.blocks.filter(x => x.kind === 'pause').length, ink ? 0 : 3, ink ? 'INK ON' : 'INK OFF');
  }
});

// The owner, 2026-10-04 (machine/2026-10-04 Nolan-v3-both.png): white gaps
// where a row goes under another part — "if the brush goes in overlapping,
// even better"; the brush landing late; the dip's split left a gap.
test('the overlap: a row goes on under the part over it, within its layer', () => {
  const b = bandOf(RUN_1258.anchors, RUN_1258.band), w = RUN_1258.band.width;
  const plain = layeredOf(b, { width: w }), lapped = layeredOf(b, { width: w, overlap: 4 });
  assert.ok(lapped.imp.total > plain.imp.total + 100, `${Math.round(lapped.imp.total - plain.imp.total)} mm more`);
  for (const r of lapped.imp.runs) {
    for (let j = 0; j < r.pts.length - 1; j++) assert.equal(lapped.lay[Math.min(r.i0 + j, b.n - 2)], r.layer, 'within its layer');   // its last may be the cut's, shared
    const s0 = b.s[r.i0], s1 = b.s[r.i0 + r.pts.length - 1];
    assert.ok(lapped.cuts.every(c => !(s0 < c && s1 > c)), 'never across a cut');
  }
  // a row that comes out from under another part starts under it: before the point where it showed
  const byRow = k => plain.imp.runs.filter(r => r.k === k), started = lapped.imp.runs.filter(r => byRow(r.k).some(q => q.layer === r.layer && q.i0 > r.i0 && q.i0 - r.i0 <= 4 / b.step + 2));
  assert.ok(started.length > 10, `${started.length} rows start under another part`);
});
test('a stroke starts with the brush just over the canvas (NOLAN), and a dip\'s split laps DIP_LAP back', () => {
  const line = (x, L, row) => [{ t: 'L', a: { x, y: 0 }, b: { x, y: L }, row }];
  const run = plotRun({ ...DEFAULTS, snake: true, pause: false, lift: false, tail: 3, here: { x: 400, y: 280 }, hover: ELBOW_HOVER }, [{ key: 'N1', ps: [line(0, 100, 1), line(10, 100, 2)] }]);
  const before = run.blocks.flatMap((b2, i) => b2.kind === 'move' && b2.paintMM > 0 ? [run.blocks[i - 1]] : []);
  assert.deepEqual(before.map(b2 => b2.cmd), [`J 2 ${ELBOW_HOVER}`, `J 2 ${ELBOW_HOVER}`]);
  const pts = []; for (let y = 0; y <= 1000; y += 1.5) pts.push([0, y]);
  const parts = dipParts(pts, 0, DIP_RUN, DIP_LAP);
  assert.equal(parts.length, 2);
  assert.ok(Math.abs(parts[0].at(-1)[1] - parts[1][0][1] - DIP_LAP) < 1.6, 'the second part starts DIP_LAP mm back');
});
