import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { HOLO2, HOLO2_LIB, isFlat, lineLen, snakeOf, seqOf, workOf, planOf, movesOf, runsOf, contourHolo2, placeRange, besideOf, along } from '../src/holo2plan.js';

// HOLO2 (2026-11-20): the owner's route, its lanes as ST-JOHN's loops, HOLO's two layers — the blues and the white, then the reds and the yellow.
const load = id => JSON.parse(fs.readFileSync(new URL(`../holo2/${id}.json`, import.meta.url)));
const WALLS = { x: { min: 0, max: 865 }, y: { min: 0, max: 568.5 } };

test('the library: every picture its json and two renders, ten jars at most, every jar the owner\'s, every spoke\'s jar one of them', () => {
  for (const id of HOLO2_LIB) {
    const p = load(id), ids = new Set(p.jars.map(j => j.id));
    for (const f of [p.image, p.after1]) assert.ok(fs.existsSync(new URL(`../${f}`, import.meta.url)), f);
    assert.ok(p.jars.length <= 10, `${id}: ${p.jars.length} jars — the owner: no more than 10`);
    for (const j of p.jars) {
      assert.match(j.hex, /^#[0-9A-F]{6}$/);
      if (j.number != null) assert.equal(j.name, `Jar ${j.number}`, 'a numbered jar by its number, never renumbered');
      else assert.ok(!/^Jar \d/.test(j.name), 'no number given to a jar the owner has not numbered');
    }
    for (const sp of p.spokes) assert.ok(ids.has(sp.jar), sp.jar);
  }
});

test('the list: a layer\'s jars light to dark, then its DRAG; the blues and the white Layer 1, the reds and the yellow Layer 2', () => {
  const p = load('holo2-19'), S = seqOf(p);
  assert.deepEqual(S.filter(q => q.kind === 'drag').map(q => q.run), [1, 2]);
  const i1 = S.findIndex(q => q.kind === 'drag');
  assert.ok(S.slice(0, i1).every(q => q.run === 1 && q.kind === 'dabs') && S.slice(i1 + 1).every(q => q.run === 2), 'Layer 1 whole, then Layer 2');
  assert.equal(S.at(-1).kind, 'drag');
  for (const q of S.filter(q => q.kind === 'dabs')) {
    const [r, , b] = [1, 3, 5].map(k => parseInt(q.hex.slice(k, k + 2), 16));
    assert.equal(q.run, r > b + 30 ? 2 : 1, `${q.name} ${q.hex}: warm in Layer 2, cool or white in Layer 1`);
  }
  for (const run of [1, 2]) { const J = S.filter(q => q.run === run && q.kind === 'dabs'); J.slice(1).forEach((q, i) => assert.ok(q.L <= J[i].L, 'light to dark')); }
});

test('the lanes: even, the brush apart, as the route; the snake one line, a lane forward, the next back, a short step between', () => {
  const p = load('holo2-19');
  assert.equal(p.lanes.length, p.count.lanes);
  for (let k = 1; k < p.lanes.length; k++) {
    const a = p.lanes[k - 1].at(-1), b = p.lanes[k][0];
    assert.ok(Math.hypot(b[0] - a[0], b[1] - a[1]) < 3 * p.pitch, `lane ${k} → ${k + 1}: a step of ${Math.hypot(b[0] - a[0], b[1] - a[1]).toFixed(1)} mm`);
  }
  // a lane a pitch from its neighbour: the nearest of lane 2's points to lane 1's, the median of many (the route crosses itself)
  const L1 = p.lanes[0], L2 = p.lanes[1], ds = [];
  for (let i = 0; i < L1.length; i += Math.ceil(L1.length / 60)) { const m = L1[i]; ds.push(Math.min(...L2.map(q => Math.hypot(q[0] - m[0], q[1] - m[1])))); }
  const near = ds.sort((a, b) => a - b)[Math.floor(ds.length / 2)];
  assert.ok(Math.abs(near - p.pitch) < 0.8, `the lanes ${near.toFixed(2)} mm apart`);
  assert.ok(Math.abs(lineLen(snakeOf(p)) / 1000 - p.count.line_m) < 1);
  for (const q of snakeOf(p)) assert.ok(q[0] >= p.field.x0 - 0.1 && q[0] <= p.field.x1 + 0.1 && q[1] >= p.field.y0 - 0.1 && q[1] <= p.field.y1 + 0.1);
});

test('the work: a jar its rows of dabs, a DRAG the snake; the plan as the generator counted', () => {
  const p = load('holo2-19'), P = planOf(p);
  for (const L of P.filter(q => q.kind === 'dabs')) {
    const j = p.jars.find(q => q.id === L.jar);
    assert.equal(L.dabs, j.run1_dabs + j.run2_dabs, L.name);
    assert.equal(L.strokes.length, 0);
    for (const d of L.puddles) assert.ok(Math.abs(Math.hypot(...d.u) - 1) < 0.01);
  }
  for (const L of P.filter(q => q.kind === 'drag')) { assert.equal(L.dabs, 0); assert.equal(L.strokes.length, 1); assert.equal(L.items.length, p.count.lanes); }
  assert.equal(P.reduce((t, q) => t + q.dabs, 0), p.count.dabs);
  const M = movesOf(P);
  M.slice(1).forEach((m, i) => assert.ok(m.from >= M[i].to - 1e-9));
  for (const run of [1, 2]) {
    const li = P.findIndex(q => q.kind === 'drag' && q.run === run);
    assert.ok(M.filter(m => m.kind === 'dab' && P[m.line].run === run).every(m => m.line < li), 'a layer\'s dabs all before its drag');
  }
});

test('the run: a dab a dip and a mark along its lane; the DRAG one run, no dip; marks on the canvas by the field of a 60 × 60', () => {
  const p = load('holo2-19'), pr = placeRange(p, WALLS);
  assert.equal(pr.marks, 'on', 'the 60 × 60 wider than the reach: MARKS on its margins');
  assert.ok(pr.left[0] <= pr.left[1], 'the field fits the reach across Y');
  assert.ok(p.field.x1 - p.field.x0 <= 550);
  const P = planOf(p, { marks: pr.marks }), R = runsOf(P.filter(q => q.run === 1));
  const dabs = R.filter(r => r.dab), drags = R.filter(r => !r.dab && !r.mark);
  assert.ok(dabs.every(r => r.dip && Math.abs(Math.hypot(r.pts[1][0] - r.pts[0][0], r.pts[1][1] - r.pts[0][1]) - HOLO2.mark) < 0.05));
  assert.equal(drags.length, 1); assert.ok(!drags[0].dip);
  assert.equal(R.filter(r => r.mark).length, 2 * P.filter(q => q.run === 1 && q.kind === 'dabs').length, 'every jar its mark on 1 and on 3');
  assert.equal(besideOf(p, 'on').rows, 1, 'no jar in both layers: one row of marks');
});

test('the horizontal stretches: within 30° of the canvas\'s horizontal, the machine\'s Y', () => {
  assert.ok(isFlat([0, 0], [10, 2]));
  assert.ok(!isFlat([0, 0], [10, 7]));
  assert.ok(!isFlat([0, 0], [0, 10]));
  const p = load('holo2-19'), d = planOf(p).find(q => q.kind === 'drag');
  assert.ok(Math.abs(d.flatMm / 1000 - p.count.horizontal_m) < 1.5, `${d.flatMm} mm, the generator ${p.count.horizontal_m} m`);
});

test('DRAW BW\'s lines and Play\'s way along a line', () => {
  const p = load('holo2-19'), O = contourHolo2(p, { outline: true }), A = contourHolo2(p);
  assert.ok(O.lines.length > 0 && A.lines.length >= O.lines.length);
  assert.deepEqual(along([[0, 0], [10, 0], [10, 10]], 15), [[0, 0], [10, 0], [10, 5]]);
  assert.ok(workOf(p, seqOf(p)[0]).items.length > 0);
});
