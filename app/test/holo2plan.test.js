import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { HOLO2, HOLO2_LIB, isFlat, lineLen, seqOf, workOf, planOf, movesOf, runsOf, contourHolo2, placeRange, besideOf, along } from '../src/holo2plan.js';

// HOLO2 (2026-11-20): the owner's ribbons, lanes along them as a road's markings, HOLO's two layers — the blues and the white, then the reds and the yellow.
const load = id => JSON.parse(fs.readFileSync(new URL(`../holo2/${id}.json`, import.meta.url)));
const WALLS = { x: { min: 0, max: 865 }, y: { min: 0, max: 568.5 } };
const pairs = f => Array.from({ length: f.length / 2 }, (_, i) => [f[2 * i], f[2 * i + 1]]);

test('the library: every picture its json and two renders, ten jars at most, every jar the owner\'s, every snake\'s jar one of them', () => {
  for (const id of HOLO2_LIB) {
    const p = load(id), ids = new Set(p.jars.map(j => j.id));
    for (const f of [p.image, p.after1]) assert.ok(fs.existsSync(new URL(`../${f}`, import.meta.url)), f);
    assert.ok(p.jars.length <= 10, `${id}: ${p.jars.length} jars — the owner: no more than 10`);
    for (const j of p.jars) {
      assert.match(j.hex, /^#[0-9A-F]{6}$/);
      assert.ok(j.layer === 1 || j.layer === 2);
      if (j.number != null) assert.equal(j.name, `Jar ${j.number}`, 'a numbered jar by its number, never renumbered');
      else assert.ok(!/^Jar \d/.test(j.name), 'no number given to a jar the owner has not numbered');
      assert.ok(j.mm >= Math.max(p.w, p.h) || p.gone.every(g => g.to !== j.name) , `${j.name}: the canon of the jars`);
    }
    for (const s of p.snakes) { assert.ok(ids.has(s.jar), s.jar); for (const g of s.legs) assert.ok(g.length >= 4 && g.length % 2 === 0); }
  }
});

test('the two layers: the blues and the white in Layer 1, the reds and the yellow in Layer 2, never a jar in both', () => {
  const p = load('holo2-19'), S = seqOf(p), i2 = S.findIndex(q => q.run === 2);
  assert.ok(i2 > 0 && S.slice(i2).every(q => q.run === 2), 'Layer 1 first, then Layer 2 on the dry first');
  for (const q of S) {
    const [r, , b] = [1, 3, 5].map(k => parseInt(q.hex.slice(k, k + 2), 16));
    assert.equal(q.run, r > b + 30 ? 2 : 1, `${q.name} ${q.hex}: warm in Layer 2, cool or white in Layer 1`);
  }
  for (const part of [S.slice(0, i2), S.slice(i2)]) part.slice(1).forEach((q, i) => assert.ok(q.L <= part[i].L, `${q.name} after ${part[i].name}: light to dark`));
  assert.equal(new Set(S.map(q => q.jar)).size, S.length);
});

test('the lanes run along the ribbons, the pitch apart; a snake\'s step from a lane to the next a few mm, the brush down', () => {
  const p = load('holo2-19');
  for (const s of p.snakes) for (let i = 1; i < s.legs.length; i++) {
    const a = pairs(s.legs[i - 1]).at(-1), b = pairs(s.legs[i])[0];
    assert.ok(Math.hypot(b[0] - a[0], b[1] - a[1]) <= 2.4 * p.pitch + 0.2, `a step of ${Math.hypot(b[0] - a[0], b[1] - a[1]).toFixed(1)} mm`);
  }
  // every leg within the canvas and the field
  for (const s of p.snakes) for (const g of s.legs) for (const [x, y] of pairs(g)) assert.ok(x >= p.field.x0 && x <= p.field.x1 && y >= p.field.y0 && y <= p.field.y1);
});

test('the work: a snake\'s puddles, then its stroke; the dabs as the generator counted them; a group never over its dabs', () => {
  const p = load('holo2-19'), P = planOf(p);
  for (const L of P) {
    const j = p.jars.find(q => q.id === L.jar);
    assert.ok(Math.abs(L.dabs - (j.run1_dabs + j.run2_dabs)) <= 2, `${L.name}: ${L.dabs} dabs, the generator ${j.run1_dabs + j.run2_dabs}`);
    for (const B of L.batches) {
      assert.ok(B.dabs <= HOLO2.group, `${L.name}: ${B.dabs}`);
      assert.ok(B.items[0].puddles.length >= 1, 'a group starts on a dab');
      assert.equal(B.strokes.length, 1);
      assert.equal(B.strokes[0].pts.length, B.items.reduce((t, it) => t + it.pts.length, 0), 'the stroke its legs end to end');
    }
  }
  const small = planOf(p, { group: 10 });
  for (const L of small) for (const B of L.batches) assert.ok(B.dabs <= 10);
  const M = movesOf(P);
  M.slice(1).forEach((m, i) => assert.ok(m.from >= M[i].to - 1e-9));
  for (let i = 1; i < M.length; i++) if (M[i].kind === 'dab' && M[i - 1].kind === 'drag') assert.ok(M[i].batch !== M[i - 1].batch || M[i].line !== M[i - 1].line, 'a group: its dabs, then its snake');
});

test('the run: a dab a dip and a mark along its lane, a snake no dip; marks on the canvas by the field of a 60 × 60', () => {
  const p = load('holo2-19'), pr = placeRange(p, WALLS);
  assert.equal(pr.marks, 'on', 'the 60 × 60 wider than the reach: MARKS on its margins');
  assert.ok(pr.left[0] <= pr.left[1], 'the field fits the reach across Y');
  const P = planOf(p, { marks: pr.marks }), R = runsOf(P.filter(q => q.run === 1));
  const dabs = R.filter(r => r.dab), snakes = R.filter(r => !r.dab && !r.mark);
  assert.ok(dabs.every(r => r.dip && Math.abs(Math.hypot(r.pts[1][0] - r.pts[0][0], r.pts[1][1] - r.pts[0][1]) - HOLO2.mark) < 1e-6));
  assert.ok(snakes.every(r => !r.dip));
  assert.equal(snakes.length, P.filter(q => q.run === 1).reduce((t, q) => t + q.batches.length, 0));
  assert.equal(R.filter(r => r.mark).length, 2 * P.filter(q => q.run === 1).length, 'every jar its mark on 1 and on 3');
  assert.equal(besideOf(p, 'on').rows, 1, 'no jar in both layers: one row of marks');
});

test('the horizontal stretches: within 30° of the canvas\'s horizontal, the machine\'s Y', () => {
  assert.ok(isFlat([0, 0], [10, 2]));
  assert.ok(!isFlat([0, 0], [10, 7]));
  assert.ok(!isFlat([0, 0], [0, 10]));
  const p = load('holo2-19'), P = planOf(p), flat = P.reduce((t, q) => t + q.flatMm, 0);
  assert.ok(Math.abs(flat / 1000 - p.count.horizontal_m) < 0.2, `${flat} mm, the generator ${p.count.horizontal_m} m`);
});

test('DRAW BW\'s lines and Play\'s way along a line', () => {
  const p = load('holo2-19'), O = contourHolo2(p, { outline: true }), A = contourHolo2(p);
  assert.ok(O.lines.length > 0 && A.lines.length >= O.lines.length);
  assert.ok(Math.abs(O.mm - O.lines.reduce((t, l) => t + lineLen(l), 0)) < 1e-6);
  assert.deepEqual(along([[0, 0], [10, 0], [10, 10]], 15), [[0, 0], [10, 0], [10, 5]]);
  assert.deepEqual(workOf(p, seqOf(p)[0]).items.length > 0, true);
});
