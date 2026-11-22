// GOGH: a picture in dabs (the owner, 2026-11-22: "no long strokes! All of them drops of 2 cm, as on IMG_3377"; the second, idle run "takes the painted
// layer off completely"). Every dab 12 … 24 mm, about 20, one jar, upright on FORM-G's 5 mm columns; every dab a run of its own on a dip of its own,
// down the picture, nothing after it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { GEN, formatOf, fieldOf, fitOf, bareMask, boxOf, binsOf } from '../src/genfplan.js';
import { DAB, DAB_UI, DAB_BRUSH, dabOf, GENV_FORMATS, formatV, fieldV, wholeV, dabsOf, stacksOf, sketchV, dabLeg, passesV, dabRunsOf, dabLine, fitV, dabOnScreen, dabGapOf, dabRunOf, dabWideOf, brushOf } from '../src/goghplan.js';
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
function sketch(fid = '40x40', K = 12, W = 300, H = 300, pitch = GEN.pitch) {
  const f = formatV(fid), work = disc(W, H), { mask } = bareMask(work, W, H), box = boxOf(mask, W, H), fit = pitch === GEN.pitch ? fitOf(f, box.w, box.h) : fitV(f, box.w, box.h, pitch);
  const PW = fit.N * pitch, R = fit.R, rgba = new Uint8ClampedArray(PW * R * 4), m = new Uint8Array(PW * R);
  for (let y = 0; y < R; y++) for (let x = 0; x < PW; x++) {
    const sx = Math.min(W - 1, Math.floor(box.x + (x + 0.5) * box.w / PW)), sy = Math.min(H - 1, Math.floor(box.y + (y + 0.5) * box.h / R)), s = sy * W + sx;
    rgba.set(work.subarray(4 * s, 4 * s + 4), 4 * (y * PW + x)); m[y * PW + x] = mask[s];
  }
  const B = binsOf(rgba, m, fit.N, R, pitch);
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

test('a dab on the machine: 3 mm in from its ends, top to bottom; the J3 gives them back; the gap off its ends, 0.6 at first', () => {
  assert.deepEqual(dabLeg(7.5, 300, 280, { gap: 0 }), [[7.5, 297], [7.5, 283]]);
  assert.deepEqual(dabLeg(7.5, 280, 300, { gap: 0 }), [[7.5, 297], [7.5, 283]], 'always down');
  assert.deepEqual(dabLeg(7.5, 300, 294, { gap: 0 }), [[7.5, 298.5], [7.5, 295.5]], 'short: the shortest leg, in its middle');
  assert.deepEqual(dabLeg(7.5, 300, 280), [[7.5, 296.7], [7.5, 283.3]], 'the hair GEN-V drew, 0.3 off each end');
  assert.deepEqual(dabLeg(7.5, 300, 280, { gap: -0.6 }), [[7.5, 297.3], [7.5, 282.7]], 'squeezed: 0.3 longer at each end');
});

test('the sliders: gap −0.6 … +0.6 by 0.1, run 0 … 4 by 1, the width on the screen 1 … 8 by 0.1, the brush 2, 3 or 5', () => {
  assert.deepEqual(DAB_UI, { brush: [2, 3, 5], gap: [-0.6, 0.6, 0.1], wide: [1, 8, 0.1], run: [0, 4, 1] });
  assert.equal(dabGapOf(undefined), 0.6); assert.equal(dabGapOf(-2), -0.6); assert.equal(dabGapOf(0.44), 0.4); assert.equal(dabGapOf(-0.05), 0);
  assert.equal(dabRunOf(undefined), 0); assert.equal(dabRunOf(9), 4); assert.equal(dabRunOf(2.4), 2); assert.equal(dabRunOf(-1), 0);
  assert.equal(dabWideOf(undefined), 4.8, '0.96 of the 5 mm brush'); assert.equal(dabWideOf(undefined, 3), 2.9); assert.equal(dabWideOf(5.63), 5.6); assert.equal(dabWideOf(12), 8);
  assert.equal(brushOf(3), 3); assert.equal(brushOf('5'), 5); assert.equal(brushOf(2), 2); assert.equal(brushOf(4), GEN.pitch);
  // a brush's own gap: the 2 mm's −0.2 (the owner's), the 3 and the 5 0.6; its width 0.96 of it, 1.9 for the 2 mm
  assert.equal(dabGapOf(undefined, 2), -0.2); assert.equal(dabGapOf(undefined, 3), 0.6); assert.equal(dabGapOf(undefined, 5), 0.6); assert.equal(dabGapOf(0.3, 2), 0.3);
  assert.equal(dabWideOf(undefined, 2), 1.9); assert.equal(dabWideOf(0.4, 2), 1);
});

test('the run: a 20 mm dab runs 20, 22, 24, 26, 28 mm on the machine — 1 mm earlier at its top and 1 later at its bottom a step; the picture as it is', () => {
  const pic = { id: 't', w: 400, h: 400, pitch: 5, columns: 1, kind: 'dabs', box: [0, 0, 400, 400], jars: [{ id: 'c0', name: 'C1', hex: '#CC2222', coats: 1, cells: [{ n: 1, legs: [[7.5, 300, 280], [7.5, 280, 260]] }] }] };
  const was = JSON.stringify(pic), J = { slack: R3.slack, j3: R3.j3, brush: dabRunsOf };
  const run = (o, k = 0) => { const R = rowsOf(pic, passesV(pic, o), R3.every, FORMG.lap, false, J), m = R.ps[k][0]; return { L: +Math.hypot(m.b.x - m.a.x, m.b.y - m.a.y).toFixed(3), a: m.a, b: m.b }; };
  assert.deepEqual([0, 1, 2, 3, 4].map(r => run({ gap: 0, run: r }).L), [20, 22, 24, 26, 28]);
  for (const r of [1, 2, 3, 4]) {                                  // the same middle: as much on at the top as at the bottom
    const q = run({ gap: 0, run: r }), z = run({ gap: 0, run: 0 });
    assert.ok(Math.abs((q.a.x + q.b.x) / 2 - (z.a.x + z.b.x) / 2) < 1e-6 && Math.abs(q.a.y - q.b.y) < 1e-6, `run ${r}: about the dab's middle, along X`);
  }
  assert.deepEqual([-0.6, 0, 0.6].map(g => run({ gap: g }).L), [20.6, 20, 19.4], 'the gap: the dab shorter by it');
  assert.equal(run({ gap: 0.6, run: 4 }).L, 27.4);
  assert.equal(JSON.stringify(pic), was, 'the picture untouched');
  assert.equal(rowsOf(pic, passesV(pic, { run: 4 }), R3.every, FORMG.lap, false, J).ps.length, 2, 'a dab a run still');
});

test('the brush 3 mm: GEN-V\'s columns 3 mm apart, more dabs, the same 12 … 24 mm', () => {
  const S3 = sketch('40x40', 12, 300, 300, 3), legs = S3.pic.jars.flatMap(j => j.cells.flatMap(c => c.legs));
  assert.equal(S3.pic.pitch, 3); assert.equal(S3.pic.dab.brush, 3);
  const xs = [...new Set(legs.map(l => l[0]))].sort((a, b) => a - b);
  xs.slice(1).forEach((x, i) => assert.ok(Math.abs((x - xs[i]) % 3) < 1e-6 || Math.abs((x - xs[i]) % 3 - 3) < 1e-6, 'on the 3 mm grid'));
  assert.ok(S3.dabs > SK.dabs * 1.4, `${S3.dabs} dabs against ${SK.dabs}`);
  assert.ok(legs.every(([, a, b]) => a - b <= DAB.max + 0.11));
});

test('a dab on the screen: the gap off its ends, round ends the width across', () => {
  assert.deepEqual(dabOnScreen(300, 280, 0.6, 4.8), [297.3, 282.7]);
  assert.deepEqual(dabOnScreen(300, 280, -0.6, 4.8).map(v => +v.toFixed(3)), [297.9, 282.1]);
  const [a, b] = dabOnScreen(300, 296, 0, 4.8); assert.equal(a, b, 'shorter than wide: a round dot');
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

// GOGH's live sliders (2026-11-22, the owner: "I allow changing rembrandt.py"): rembrandt.py's /run/swap takes the plan made again only where nothing but where
// the brush goes changed (swap_refuses, SWAP_MM 5) — so every gap and run must give the same steps, the elbow's, the dips', the pauses' as they were
test('the sliders change only where the brush goes: the same steps, every L and M 4.6 mm at most apart — what /run/swap takes live', async () => {
  const { plotRun, DEFAULTS, ELBOW_HOVER } = await import('../src/strokes.js'), { cupOf } = await import('../src/ink.js'), { reach } = await import('../src/machine.js');
  const pic = { ...SK.pic, jars: SK.pic.jars.slice(0, 3) }, W = reach(), here = { x: (W.x.min + W.x.max) / 2, y: (W.y.min + W.y.max) / 2 };
  const steps = (gap, run) => {
    const R = rowsOf(pic, passesV(pic, { gap, run }), R3.every, FORMG.lap, false, { slack: R3.slack, j3: R3.j3, brush: dabRunsOf });
    return plotRun({ ...DEFAULTS, speed: 25, travel: 100, tail: 3, lift: true, ink: true, snake: true, pause: false, cup: cupOf({ hand: { on: true } }), hover: ELBOW_HOVER, press: 0, noDipUnder: 0, rows: R.ps.length, here },
      R.groups.map((g, k) => ({ key: 'DRAG', ps: g.map(i => R.ps[i]), why: k ? 'the next jar' : null }))).blocks;
  };
  const a = steps(0.6, 0), rest = q => JSON.stringify({ ...q, cmds: 0, paintMM: 0, painted: 0, lengthMM: 0 });
  for (const [gap, run] of [[0.6, 4], [-0.6, 0], [-0.6, 4], [0, 2], [0.6, 1]]) {
    const b = steps(gap, run);
    assert.equal(b.length, a.length, `${gap} · ${run}: as many steps`);
    let most = 0;
    a.forEach((p, i) => {
      const q = b[i];
      assert.equal(q.kind, p.kind);
      if (p.kind !== 'move') return assert.deepEqual(q, p, 'an arm, a joint, a wait, a pause the same');
      assert.equal(rest(q), rest(p)); assert.equal(q.cmds.length, p.cmds.length);
      p.cmds.forEach((c, j) => {
        const d = q.cmds[j];
        assert.equal(d[0], c[0]);
        if (!'LMA'.includes(c[0])) return assert.equal(d, c, 'F, T, W, G the same');
        const x = c.split(' ').slice(1).map(Number), y = d.split(' ').slice(1).map(Number);
        x.forEach((v, k) => { most = Math.max(most, Math.abs(v - y[k])); });
      });
    });
    assert.ok(most <= 4.6 + 1e-6 && most <= 5, `${gap} · ${run}: ${most} mm`);
  }
});

// The 2 mm (the owner, 2026-11-22, the evening, the new brushes, GOGH/IMG_3395.jpg; IMG_3390.jpg: "the longest stroke is 15 mm. But that is enough for us"),
// and a 20 × 20 for tests ("a 20 × 20 cm format for tests")
test('the brush 2 mm: columns 2 mm apart, its dabs 8 … 15 mm, ≈ 12 — none longer than the 15 it can paint', () => {
  assert.deepEqual(DAB_BRUSH[2], { aim: 12, min: 8, max: 15, gap: -0.2 });
  assert.deepEqual([3, 5].map(b => [dabOf(b).min, dabOf(b).max, dabOf(b).aim]), [[12, 24, 20], [12, 24, 20]], 'the 3 and the 5 as they were');
  const S2 = sketch('40x40', 12, 300, 300, 2), legs = S2.pic.jars.flatMap(j => j.cells.flatMap(c => c.legs)), L = legs.map(([, a, b]) => a - b);
  assert.equal(S2.pic.pitch, 2); assert.deepEqual(S2.pic.dab, { aim: 12, min: 8, max: 15, brush: 2 });
  assert.ok(L.every(v => v <= 15 + 0.11), `the longest ${Math.max(...L)} mm`);
  const mean = L.reduce((a, v) => a + v, 0) / L.length;
  assert.ok(mean >= 10 && mean <= 14, `mean ${mean.toFixed(1)} mm`);
  assert.ok(S2.dabs > SK.dabs * 3, `${S2.dabs} dabs against ${SK.dabs} of the 5 mm`);
  // on the machine the same trim: a 15 mm dab sent 9 mm, at its gap −0.2 9.2, the J3 giving the 3 + 3 back
  assert.deepEqual(dabLeg(5, 300, 285, { gap: dabGapOf(undefined, 2) }), [[5, 297.1], [5, 287.9]]);
});

test('GEN-V\'s formats: a 20 × 20 for tests in front of GEN-F\'s; the 20 × 20 and the 40 × 40 edge to edge, no margin; GEN-F\'s own untouched', () => {
  assert.deepEqual(GENV_FORMATS.map(f => f.id), ['20x20', '40x40', '60x60', '60x80', '70x100', '90x120', '100x150']);
  assert.ok(formatV('20x20').test); assert.equal(formatV('nope').id, '40x40', 'an unknown one: the 40 × 40, as before');
  // the field the whole canvas where the canvas lies within the reach (the owner: "margins only for 60 × 60 and up … 200 × 200 mm we print without
  // trouble … 40 × 40 too, without the limiting contour"); 60 × 60 and up GEN-F's, 30 mm in
  assert.deepEqual(fieldV(formatV('20x20')), { w: 200, h: 200 }); assert.deepEqual(fieldV(formatV('40x40')), { w: 400, h: 400 });
  assert.deepEqual(['20x20', '40x40', '60x60', '60x80', '70x100', '90x120'].map(id => wholeV(formatV(id))), [true, true, false, false, false, false]);
  for (const id of ['60x60', '60x80', '70x100', '90x120', '100x150']) assert.deepEqual(fieldV(formatV(id)), fieldOf(formatOf(id)), `${id}: GEN-F's field`);
  assert.ok(!formatOf('20x20').test, 'GEN-F has no 20 × 20');
  const T = sketch('20x20', 12, 300, 300, 2);
  assert.equal(T.pic.w, 200); assert.equal(T.pic.h, 200);
  const [x0, y0, x1, y1] = T.pic.box;
  assert.ok(x0 >= -1e-6 && y0 >= -1e-6 && x1 <= 200 + 1e-6 && y1 <= 200 + 1e-6, `on the canvas: ${T.pic.box}`);
  assert.ok(Math.max(x1 - x0, y1 - y0) > 190, `edge to edge on its long side: ${T.pic.box}`);
  assert.ok(T.dabs > 100, `${T.dabs} dabs`);
});
