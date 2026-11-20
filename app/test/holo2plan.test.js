import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { HOLO2, HOLO2_LIB, isFlat, seqOf, workOf, planOf, movesOf, runsOf, contourHolo2, placeRange, besideOf, along } from '../src/holo2plan.js';

// HOLO2 (2026-11-20): the owner's route, its lanes as ST-JOHN's loops, HOLO's two layers — the blues and the white, then the reds and the yellow.
const load = id => JSON.parse(fs.readFileSync(new URL(`../holo2/${id}.json`, import.meta.url)));
const WALLS = { x: { min: 0, max: 865 }, y: { min: 0, max: 568.5 } };

test('the library: every picture its json and two renders, ten jars at most, every jar the owner\'s, every group\'s jar one of them', () => {
  for (const id of HOLO2_LIB) {
    const p = load(id), ids = new Set(p.jars.map(j => j.id));
    for (const f of [p.image, p.after1]) assert.ok(fs.existsSync(new URL(`../${f}`, import.meta.url)), f);
    assert.ok(p.jars.length <= 10, `${id}: ${p.jars.length} jars — the owner: no more than 10`);
    for (const j of p.jars) {
      assert.match(j.hex, /^#[0-9A-F]{6}$/);
      if (j.number != null) assert.equal(j.name, `Jar ${j.number}`, 'a numbered jar by its number, never renumbered');
      else assert.ok(!/^Jar \d/.test(j.name), 'no number given to a jar the owner has not numbered');
    }
    for (const g of p.groups) assert.ok(ids.has(g.jar), g.jar);
  }
});

test('the list: Layer 1\'s jars light to dark, then Layer 2\'s; the blues and the white Layer 1, the reds and the yellow Layer 2', () => {
  const p = load('holo2-19'), S = seqOf(p), i2 = S.findIndex(q => q.run === 2);
  assert.ok(i2 > 0 && S.slice(i2).every(q => q.run === 2));
  for (const q of S) {
    const [r, , b] = [1, 3, 5].map(k => parseInt(q.hex.slice(k, k + 2), 16));
    assert.equal(q.run, r > b + 30 ? 2 : 1, `${q.name} ${q.hex}: warm in Layer 2, cool or white in Layer 1`);
  }
  for (const run of [1, 2]) { const J = S.filter(q => q.run === run); J.slice(1).forEach((q, i) => assert.ok(q.L <= J[i].L, 'light to dark')); }
});

test('a group: its band\'s lanes, a step aside from one to the next; its dabs upright, on its lanes, within its band', () => {
  const p = load('holo2-19');
  for (const g of p.groups) {
    const legs = g.legs.map(f => Array.from({ length: f.length / 2 }, (_, i) => [f[2 * i], f[2 * i + 1]]));
    const steps = legs.slice(1).map((l, k) => Math.hypot(l[0][0] - legs[k].at(-1)[0], l[0][1] - legs[k].at(-1)[1]));
    assert.ok(steps.filter(d => d > 3 * p.pitch).length <= 1, `steps ${steps.map(d => d.toFixed(0))}`);   // a lane cut at a tight turn: one lift at most
    for (const [x, y, way] of g.dabs) {
      assert.ok(way === 1 || way === -1);
      const seg = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(a[0] + dx * t - x, a[1] + dy * t - y); };
      const near = Math.min(...legs.flatMap(l => l.slice(1).map((q, i) => seg(l[i], q))));
      assert.ok(near < 0.5, `a dab ${near.toFixed(2)} mm off its lane`);
    }
  }
  const L1 = p.lanes[0], L2 = p.lanes[1], ds = [];
  for (let i = 0; i < L1.length; i += Math.ceil(L1.length / 60)) { const m = L1[i]; ds.push(Math.min(...L2.map(q => Math.hypot(q[0] - m[0], q[1] - m[1])))); }
  assert.ok(Math.abs(ds.sort((a, b) => a - b)[Math.floor(ds.length / 2)] - p.pitch) < 0.8, 'the lanes the brush apart');
});

test('the work: a jar its groups along the route, each its dabs then its snake; the plan as the generator counted', () => {
  const p = load('holo2-19'), P = planOf(p);
  for (const L of P) {
    const j = p.jars.find(q => q.id === L.jar);
    assert.equal(L.dabs, j.run1_dabs + j.run2_dabs, L.name);
    assert.equal(L.batches.length, j.groups);
    for (const B of L.batches) {
      const long = B.items.slice(1).filter((it, i) => Math.hypot(it.pts[0][0] - B.items[i].pts.at(-1)[0], it.pts[0][1] - B.items[i].pts.at(-1)[1]) > HOLO2.lift).length;
      assert.equal(B.strokes.length, 1 + long, 'the brush up only where a step is longer than `lift`: no stroke across a band');
      for (const d of B.puddles) assert.equal(d.u[0], 0, 'upright: the flat brush');
    }
    L.batches.slice(1).forEach((B, i) => assert.ok(p.groups.find(g => g.jar === L.jar) !== undefined));
  }
  assert.equal(P.reduce((t, q) => t + q.dabs, 0), p.count.dabs);
  const M = movesOf(P);
  M.slice(1).forEach((m, i) => assert.ok(m.from >= M[i].to - 1e-9));
  for (let i = 1; i < M.length; i++) if (M[i].kind === 'dab' && M[i - 1].kind === 'drag') assert.ok(M[i].batch !== M[i - 1].batch || M[i].line !== M[i - 1].line, 'a group: its dabs, then its snake');
});

test('the run: a dab a dip and an upright mark; a group\'s snake one run, no dip; marks on the canvas by the field of a 60 × 60', () => {
  const p = load('holo2-19'), pr = placeRange(p, WALLS);
  assert.equal(pr.marks, 'on', 'the 60 × 60 wider than the reach: MARKS on its margins');
  assert.ok(pr.left[0] <= pr.left[1], 'the field fits the reach across Y');
  assert.ok(p.field.x1 - p.field.x0 <= 550);
  const P = planOf(p, { marks: pr.marks }), L1 = P.filter(q => q.run === 1), R = runsOf(L1);
  const dabs = R.filter(r => r.dab), snakes = R.filter(r => !r.dab && !r.mark);
  assert.ok(dabs.every(r => r.dip && r.pts[0][0] === r.pts[1][0] && Math.abs(Math.abs(r.pts[1][1] - r.pts[0][1]) - HOLO2.mark) < 1e-6), 'upright, along X');
  assert.equal(snakes.length, L1.reduce((t, q) => t + q.batches.reduce((u, B) => u + B.strokes.length, 0), 0)); assert.ok(snakes.every(r => !r.dip));
  assert.equal(R.filter(r => r.mark).length, 2 * L1.length, 'every jar its mark on 1 and on 3');
  assert.equal(besideOf(p, 'on').rows, 1, 'no jar in both layers: one row of marks');
});

test('the horizontal stretches: within 30° of the canvas\'s horizontal, the machine\'s Y', () => {
  assert.ok(isFlat([0, 0], [10, 2]));
  assert.ok(!isFlat([0, 0], [10, 7]));
  assert.ok(!isFlat([0, 0], [0, 10]));
  const p = load('holo2-19'), f = planOf(p).reduce((t, q) => t + q.flatMm, 0);
  assert.ok(Math.abs(f / 1000 - p.count.horizontal_m) < 1.5, `${f} mm, the generator ${p.count.horizontal_m} m`);
});

test('DRAW BW\'s lines and Play\'s way along a line', () => {
  const p = load('holo2-19'), O = contourHolo2(p, { outline: true }), A = contourHolo2(p);
  assert.ok(O.lines.length > 0 && A.lines.length >= O.lines.length);
  assert.deepEqual(along([[0, 0], [10, 0], [10, 10]], 15), [[0, 0], [10, 0], [10, 5]]);
  assert.ok(workOf(p, seqOf(p)[0]).items.length > 0);
});
