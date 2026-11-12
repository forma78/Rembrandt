import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { HOLO, HOLO_LIB, legsOf, puddlesY, dabsOf, seqOf, workOf, planOf, movesOf, shadeAt, placeRange } from '../src/holoplan.js';

// HOLO (HOLO-Claude/HOLO.md, 2026-11-12): cloud-Claude's three pictures in the owner's jars, two runs of puddles laid, then dragged.
const load = id => JSON.parse(fs.readFileSync(new URL(`../holo/${id}.json`, import.meta.url)));
const WALLS = { x: { min: 0, max: 865 }, y: { min: 0, max: 568.5 } };

test('the library: every picture its json and two renders, its jars the owner\'s, every slat\'s and band\'s jar one of them', () => {
  for (const id of HOLO_LIB) {
    const p = load(id), ids = new Set(p.jars.map(j => j.id));
    for (const f of [p.image, p.after1]) assert.ok(fs.existsSync(new URL(`../${f}`, import.meta.url)), f);
    assert.ok(p.jars.length <= 12, `${id}: ${p.jars.length} jars`);
    assert.ok(p.jars.filter(j => j.new).length <= 4, 'four empty jars at most');
    for (const j of p.jars) {
      assert.match(j.hex, /^#[0-9A-F]{6}$/);
      if (j.number != null) assert.equal(j.name, `Jar ${j.number}`, 'a numbered jar by its number, never renumbered');
      else assert.ok(!/^Jar \d/.test(j.name), 'no number given to a jar the owner has not numbered');
    }
    for (const s of p.slats) {
      assert.ok(s.ground === null || ids.has(s.ground), `${id}: ground ${s.ground}`);
      for (const b of s.bands) assert.ok(ids.has(b.jar), `${id}: band ${b.jar}`);
    }
  }
});

test('the plan counts what the study counted: run 1\'s dabs, run 2\'s puddles and dabs, the legs', () => {
  for (const id of HOLO_LIB) {
    const p = load(id), P = planOf(p), r = run => P.filter(q => q.run === run);
    assert.equal(legsOf(p).length, p.count.legs, id);
    assert.equal(r(1).reduce((t, q) => t + q.dabs, 0), p.count.run1_dabs, id);
    assert.equal(r(2).reduce((t, q) => t + q.puddles.length, 0), p.count.run2_puddles, id);
    assert.equal(r(2).reduce((t, q) => t + q.dabs, 0), p.count.run2_dabs, id);
    assert.deepEqual(puddlesY(p), p.slats[0].puddles_y, `${id}: the puddles where the study laid them`);
    // every jar's dabs, run by run, as the json's
    for (const j of p.jars) for (const run of [1, 2]) assert.equal(P.find(q => q.jar === j.id && q.run === run)?.dabs ?? 0, j[`run${run}_dabs`], `${id} ${j.name} run ${run}`);
  }
});

test('the list: run 1\'s jars light to dark, then run 2\'s; a jar in both runs a line in each', () => {
  const p = load('holo-60-blue'), S = seqOf(p), i2 = S.findIndex(q => q.run === 2);
  assert.ok(i2 > 0 && S.slice(i2).every(q => q.run === 2));
  for (const part of [S.slice(0, i2), S.slice(i2)]) part.slice(1).forEach((q, i) => assert.ok(q.L <= part[i].L, `${q.name} after ${part[i].name}`));
  assert.equal(S.filter(q => q.jar === 'skyblue').length, 2, 'New · Sky Blue a ground and a shadow');
});

test('batches: about `batch` dabs, a run-1 leg never split; every stroke in its batch after its puddles', () => {
  const p = load('holo-40-warm');
  for (const L of planOf(p, { batch: 100 })) {
    for (const B of L.batches) assert.ok(B.dabs <= 100 || B.strokes.length === 1, `${L.name}: ${B.dabs}`);
    if (L.run === 1) for (const B of L.batches) assert.equal(B.puddles.length, B.strokes.length * puddlesY(p).length);
  }
  const M = movesOf(planOf(p));
  M.slice(1).forEach((m, i) => assert.ok(m.from >= M[i].to - 1e-9));
  for (let i = 1; i < M.length; i++) if (M[i].kind === 'dab' && M[i - 1].kind === 'drag') assert.ok(M[i].batch !== M[i - 1].batch || M[i].line !== M[i - 1].line, 'a batch: its dabs, then its strokes');
});

test('run 1\'s strokes the field\'s whole height, even legs down, odd up; run 2\'s from its puddle', () => {
  const p = load('holo-60-tiers'), P = planOf(p);
  const L1 = P.find(q => q.run === 1), s = L1.strokes[0];
  assert.deepEqual([Math.max(...s.pts.map(q => q[1])), Math.min(...s.pts.map(q => q[1]))], [p.field.y1, p.field.y0]);
  for (const L of P.filter(q => q.run === 2)) L.strokes.forEach((q, i) => assert.equal(q.pts[0][1], L.puddles[i].y));
});

test('a dab lasts: the shadows\' dabs by their bands, 1 … 3 on the fan, 1 … 4 on the tiers; none given, the plan\'s', () => {
  const p = load('holo-60-tiers'), b = p.slats[0].bands[0];
  assert.equal(dabsOf(p, b, null), b.dabs);
  assert.equal(dabsOf(p, { y0: 0, y1: 500 }, 45), HOLO.maxDabs.tiers);
  assert.equal(dabsOf(load('holo-40-warm'), { y0: 0, y1: 500 }, 45), HOLO.maxDabs.fan);
  assert.equal(dabsOf(p, { y0: 0, y1: 10 }, 45), 1);
});

test('the shadow falls off from its puddle: full at its start, gone at its end; on the tiers full over 0.6', () => {
  assert.equal(shadeAt(0), 1); assert.equal(shadeAt(1), 0); assert.ok(shadeAt(0.5) < 0.5);
  assert.equal(shadeAt(0.5, 0.6), 1); assert.equal(shadeAt(1, 0.6), 0); assert.equal(shadeAt(1.2), 0);
});

test('where the canvas may lie: the field within the walls; the 60 × 60 blue\'s 560 mm field just fits between Y\'s', () => {
  const r = placeRange(load('holo-60-blue'), WALLS);
  assert.ok(r.left[0] <= r.left[1] && r.left[1] - r.left[0] < 15, `${r.left}: its outer legs' middles 555 mm apart, the walls 568.5`);
  const t = placeRange(load('holo-40-warm'), WALLS);
  assert.ok(t.left[1] - t.left[0] > 150 && t.bottom[1] - t.bottom[0] > 400);
});
