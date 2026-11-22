// GOGH: a picture in dabs (the owner, 2026-11-22: "no long strokes! All of them drops of 2 cm, as on IMG_3377"; the second, idle run "takes the painted
// layer off completely"). Every dab 12 … 24 mm, about 20, one jar, upright on FORM-G's 5 mm columns; every dab a run of its own on a dip of its own,
// down the picture, nothing after it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { GEN, formatOf, fitOf, bareMask, boxOf, binsOf } from '../src/genfplan.js';
import { DAB, dabsOf, stacksOf, sketchV, dabLeg, passesV, dabRunsOf, dabLine } from '../src/goghplan.js';
import { rowsOf, R3, FORMG } from '../src/formgplan.js';

// a picture W × H px: a white ground, a red disc with a dark band across it, its left half lighter (genfplan.test.js's)
function disc(W, H) {
  const px = new Uint8ClampedArray(W * H * 4).fill(255), cx = W / 2, cy = H / 2, r = Math.min(W, H) * 0.4;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.hypot(x - cx, y - cy);
    if (d > r) continue;
    let c = x < cx ? [220, 40, 30] : [160, 10, 15];
    if (Math.abs(y - cy) < r * 0.12) c = [30, 25, 28];
    px.set([...c, 255], 4 * (y * W + x));
  }
  return px;
}
function sketch(fid = '40x40', K = 12, W = 300, H = 300) {
  const f = formatOf(fid), work = disc(W, H), { mask } = bareMask(work, W, H), box = boxOf(mask, W, H), fit = fitOf(f, box.w, box.h);
  const PW = fit.N * GEN.pitch, R = fit.R, rgba = new Uint8ClampedArray(PW * R * 4), m = new Uint8Array(PW * R);
  for (let y = 0; y < R; y++) for (let x = 0; x < PW; x++) {
    const sx = Math.min(W - 1, Math.floor(box.x + (x + 0.5) * box.w / PW)), sy = Math.min(H - 1, Math.floor(box.y + (y + 0.5) * box.h / R)), s = sy * W + sx;
    rgba.set(work.subarray(4 * s, 4 * s + 4), 4 * (y * PW + x)); m[y * PW + x] = mask[s];
  }
  const B = binsOf(rgba, m, fit.N, R);
  return { f, fit, B, ...sketchV(B, fit, f, K) };
}
const SK = sketch();

test('every dab 12 … 24 mm, about 20; only a stretch of the picture shorter than 12 one dab of its own, none under 6', () => {
  const D = dabsOf(SK.B, SK.pal), L = D.map(q => q.b - q.a);
  assert.ok(D.length > 300, `${D.length} dabs`);
  assert.ok(L.every(v => v >= DAB.crumb && v <= DAB.max), 'within crumb … max');
  const mean = L.reduce((a, v) => a + v, 0) / L.length;
  assert.ok(mean >= 17 && mean <= 23, `mean ${mean.toFixed(1)} mm`);
  // in a column, the dabs one after another, never over each other
  const byCol = new Map(); for (const q of D) (byCol.get(q.c) ?? byCol.set(q.c, []).get(q.c)).push(q);
  for (const qs of byCol.values()) { qs.sort((p, q) => p.a - q.a); qs.slice(1).forEach((q, i) => assert.ok(q.a >= qs[i].b)); }
});

test('the dabs lie as bricks: few ends level with an end in the column to the left', () => {
  const D = dabsOf(SK.B, SK.pal), starts = new Map();
  for (const q of D) (starts.get(q.c) ?? starts.set(q.c, new Set()).get(q.c)).add(q.a);
  let level = 0, all = 0;
  for (const q of D) { const p = starts.get(q.c - 1); if (!p || !starts.get(q.c).has(q.a) || q.a === Math.min(...starts.get(q.c))) continue; all++; if ([...p].some(v => Math.abs(v - q.a) <= DAB.near)) level++; }
  assert.ok(all > 50 && level / all < 0.3, `${level} of ${all} level`);
});

test('the sketch: FORM-G\'s json, every leg a dab down the picture, a jar\'s cells its stacks, the canon of the jars on it', () => {
  const { pic } = SK;
  assert.equal(pic.kind, 'dabs');
  assert.ok(pic.jars.length >= 2 && pic.jars.length <= 12);
  for (const j of pic.jars) {
    assert.equal(j.coats, 1, 'a thick dab covers: one coat');
    assert.ok(dabLine(j) >= 400 || SK.kept.some(q => q.id === j.id), `${j.name}: the canon of the canvas's long side, 40 cm`);
    for (const c of j.cells) {
      for (const [x, top, bot] of c.legs) { assert.ok(top > bot, 'down the picture'); assert.ok(top - bot <= DAB.max + 0.11); assert.ok(Number.isFinite(x)); }
      c.legs.slice(1).forEach((l, i) => { assert.equal(l[0], c.legs[i][0], 'a stack, one column'); assert.ok(Math.abs(l[1] - c.legs[i][2]) < 1e-6, 'end to end'); });
    }
  }
  const legs = pic.jars.flatMap(j => j.cells.flatMap(c => c.legs));
  assert.equal(legs.length, SK.dabs, 'no dab lost to the canon');
  const L = pic.jars.map(j => j.hex);
  assert.equal(new Set(L).size, L.length);
});

test('stacks: a column\'s dabs end to end one cell, the nearest next', () => {
  const S = stacksOf([[10, 100, 80], [10, 80, 60], [10, 40, 20], [15, 70, 50], [5, 90, 70]]);
  // from the top left; from where one ends, the nearest top: 10 mm to the right, then 11 mm, then back up its column
  assert.deepEqual(S, [[[5, 90, 70]], [[15, 70, 50]], [[10, 40, 20]], [[10, 100, 80], [10, 80, 60]]]);
});

test('a dab on the machine: 3 mm in from its ends, top to bottom; the J3 gives them back', () => {
  assert.deepEqual(dabLeg(7.5, 300, 280), [[7.5, 297], [7.5, 283]]);
  assert.deepEqual(dabLeg(7.5, 280, 300), [[7.5, 297], [7.5, 283]], 'always down');
  assert.deepEqual(dabLeg(7.5, 300, 294), [[7.5, 298.5], [7.5, 295.5]], 'short: the shortest leg, in its middle');
});

test('the run: every dab a run of its own on a dip of its own, nothing after it — no snake, no second run, no idle run', () => {
  const P = passesV(SK.pic), runs = dabRunsOf(P);
  assert.equal(runs.length, SK.dabs);
  assert.ok(runs.every(r => r.dip && r.dab && !r.idle && !r.snake && r.pts.length === 2 && r.pts[0][1] > r.pts[1][1]));
  assert.ok(P.every(q => q.fill === 'dabs' && q.layer === 1));
  const R = rowsOf(SK.pic, P, R3.every, FORMG.lap, false, { brush: dabRunsOf, slack: R3.slack, j3: R3.j3 });
  assert.equal(R.ps.length, SK.dabs, 'a row a dab');
  assert.ok(R.ps.every(p => p.length === 1 && !p[0].nodip), 'one piece, on a dip');
  // the J3: the leg 14 mm of a 20 mm dab, 20 on the machine
  const one = P[0].byCell[0].legs[0], L = Math.abs(one[1][1] - one[0][1]), m = R.ps[0][0], Lm = Math.hypot(m.b.x - m.a.x, m.b.y - m.a.y);
  assert.ok(Math.abs(Lm - L - 6) < 0.01, `${L} → ${Lm}`);
});
