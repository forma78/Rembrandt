import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { skeletonOf, placed, pieceLength, pointAt, centresOf, letterOf, ringsOf, dotCentres, coilOf, nextX, setText, RAMP_MAX } from '../src/rings.js';

const G = JSON.parse(fs.readFileSync(new URL('../glyphs.json', import.meta.url), 'utf8')).glyphs;
const close = (a, b, e = 1e-6) => Math.abs(a - b) < e;
const o = { x: 10, base: 200, H: 120, R: 18, step: 6, ramp: 0 };
const lenOf = ps => ps.reduce((a, g) => a + pieceLength(g), 0);
const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);

test('glyphs.json: A–Z, 0–9, % and !, every skeleton in its box', () => {
  const want = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789%!'];
  assert.deepEqual(Object.keys(G).sort(), want.sort());
  for (const [ch, g] of Object.entries(G)) for (const st of g.strokes) {
    const ps = placed(skeletonOf(st), 0, 0, 1, 0), L = lenOf(ps);
    for (let j = 0; j <= 50; j++) {
      const q = st.dot ? [st.start[0], -st.start[1]] : pointAt(ps, L * j / 50);
      assert.ok(q[0] > -1e-3 && q[0] < g.width + 1e-3 && -q[1] > -0.02 && -q[1] < 1.02, `${ch} leaves its box at ${q}`);
    }
  }
});

test('the inset: the outer edge of the circles touches the baseline and the capline', () => {
  for (const ch of 'IHEOV8') {
    const l = letterOf(G[ch], o), ys = l.strokes.flatMap(st => st.rings.map(g => [g.c[1] - g.r, g.c[1] + g.r])).flat();
    assert.ok(close(Math.min(...ys), o.base - o.H, 0.5), `${ch} top ${Math.min(...ys)}`);
    assert.ok(close(Math.max(...ys), o.base, 0.5), `${ch} bottom ${Math.max(...ys)}`);
  }
});

test('an open stroke: a circle on each end, the spacing even, near the step', () => {
  const st = letterOf(G.I, o).strokes[0], c = st.centres, L = lenOf(st.pieces);
  assert.ok(close(dist(c[0], pointAt(st.pieces, 0)), 0) && close(dist(c.at(-1), pointAt(st.pieces, L)), 0));
  const gaps = c.slice(1).map((q, i) => dist(q, c[i]));
  for (const g of gaps) assert.ok(close(g, gaps[0], 1e-6));
  assert.ok(Math.abs(gaps[0] - o.step) <= o.step / 2);
});

test('a closed stroke goes round evenly, no second circle on its seam', () => {
  const st = letterOf(G.O, o).strokes[0], c = st.centres;
  assert.ok(dist(c[0], c.at(-1)) > o.step / 2);
  const L = lenOf(st.pieces);
  assert.ok(close(c.length * dist(c[0], c[1]), L, L * 0.01));
});

test('RAMP: the spacing grows along the stroke, dense to sparse', () => {
  const ps = placed(skeletonOf(G.I.strokes[0]), 0, 300, 300, 0), c = centresOf(ps, false, 10, 0.8);
  const gaps = c.slice(1).map((q, i) => dist(q, c[i]));
  for (let i = 1; i < gaps.length; i++) assert.ok(gaps[i] > gaps[i - 1]);
  assert.ok(gaps.at(-1) / gaps[0] > 5);
  const back = centresOf(ps, false, 10, -0.8).slice(1).map((q, i, a) => i ? dist(q, a[i - 1]) : null).filter(Boolean);
  assert.ok(back[0] > back.at(-1), 'minus: sparse to dense');
  assert.ok(centresOf(ps, false, 10, 1).length < 1e4, `held at ±${RAMP_MAX}`);
});

test('never closer than the brush', () => {
  const ps = placed(skeletonOf(G.I.strokes[0]), 0, 300, 300, 0), c = centresOf(ps, false, 1, 0, 4);
  for (let i = 1; i < c.length; i++) assert.ok(dist(c[i], c[i - 1]) >= 4 - 1e-6);
});

test('a ring runs from 12 o\'clock clockwise; a dot is a sphere, its circles cut to the first', () => {
  const [g] = ringsOf([[0, 0]], 10);
  assert.ok(close(g.a0, -Math.PI / 2) && close(g.a1 - g.a0, 2 * Math.PI));
  const c = dotCentres([0, 0], 10, 4), r = ringsOf(c, 10, true);
  assert.equal(c.length, 5);                     // 0, 4, 8, 12, 16 — under 2R
  for (const q of r.slice(1)) for (const t of [q.a0, (q.a0 + q.a1) / 2, q.a1]) assert.ok(Math.hypot(q.c[0] + 10 * Math.cos(t), q.c[1] + 10 * Math.sin(t)) <= 10 + 1e-6);
  const l = letterOf(G['!'], o);
  assert.ok(l.strokes[1].dot && l.strokes[1].rings.length > 1);
});

test('COIL: one line, a whole turn from one centre to the next, a last circle on the end', () => {
  const cs = [[0, 0], [10, 0], [20, 0]], p = coilOf(cs, 5, false, 40);
  assert.equal(p.length, 2 * 40 + 41);
  assert.ok(close(p[0][0], 0) && close(p[0][1], -5), 'from 12 o\'clock');
  assert.ok(close(p.at(-1)[0], 20) && close(p.at(-1)[1], -5));
  const ring = coilOf([[0, 0], [10, 0], [10, 10]], 5, true, 40);
  assert.ok(close(ring.at(-1)[0], 0) && close(ring.at(-1)[1], -5), 'a closed stroke comes back to its first centre');
});

test('the gap is between the outlines: 0 touches, below 0 overlaps', () => {
  const A = letterOf(G.L, o), x = nextX(A, G.T, o, 0), T = letterOf(G.T, { ...o, x });
  assert.ok(x < A.x1, 'T tucks over L\'s bar');
  let min = Infinity;
  const pts = l => l.strokes.flatMap(st => { const L = lenOf(st.pieces); return Array.from({ length: 200 }, (_, j) => pointAt(st.pieces, L * j / 199)); });
  for (const p of pts(A)) for (const q of pts(T)) min = Math.min(min, dist(p, q) - 2 * o.R);
  assert.ok(Math.abs(min) < 0.6, `touching: ${min}`);
  assert.ok(nextX(A, G.T, o, -10) < x - 9.9);
  const line = setText(G, 'AMOUR', o, 4);
  assert.equal(line.length, 5);
  for (let i = 1; i < 5; i++) assert.ok(line[i].letter.x0 > line[i - 1].letter.x0);
  const wrapped = setText(G, 'AMOUR', o, 4, 300, 20);
  assert.ok(wrapped.some(q => q.letter.strokes[0].centres[0][1] > o.base + o.H), 'past the edge, onto the next line');
});

test('a corner of the skeleton has its circle: the V\'s bottom on the baseline', () => {
  for (const ch of 'VW4Z') {
    const l = letterOf(G[ch], o), ys = l.strokes.flatMap(st => st.rings.map(g => g.c[1] + g.r));
    assert.ok(close(Math.max(...ys), o.base, 1e-6), `${ch} bottom ${Math.max(...ys)}`);
  }
  const v = letterOf(G.V, o).strokes[0], tip = v.centres.reduce((a, c) => c[1] > a[1] ? c : a);
  assert.ok(close(tip[1], o.base - o.R, 1e-6));
});
