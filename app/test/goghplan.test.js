// GOGH: a picture in dabs (the owner, 2026-11-22: "no long strokes! All of them drops of 2 cm, as on IMG_3377"; the second, idle run "takes the painted
// layer off completely"). Every dab 12 … 24 mm, about 20, one jar, upright on FORM-G's 5 mm columns; every dab a run of its own on a dip of its own,
// down the picture, nothing after it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { GEN, formatOf, fieldOf, fitOf, bareMask, boxOf, binsOf } from '../src/genfplan.js';
import { DAB, DAB_UI, DAB_BRUSH, dabOf, GENV_FORMATS, formatV, fieldV, wholeV, acrossV, MARGIN_UI, marginOf, dabsOf, stacksOf, sketchV, dabLeg, passesV, dabRunsOf, dabLine, fitV, dabOnScreen, dabGapOf, dabRunOf, dabWideOf, brushOf } from '../src/goghplan.js';
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

test('the sliders: gap −0.6 … +0.6 by 0.1, run −4 … 4 by 1, the width on the screen 1 … 8 by 0.1, the brush 2, 3 or 5', () => {
  assert.deepEqual(DAB_UI, { brush: [2, 3, 5], gap: [-0.6, 0.6, 0.1], wide: [1, 8, 0.1], run: [-4, 4, 1] });
  assert.equal(dabGapOf(undefined), 0.6); assert.equal(dabGapOf(-2), -0.6); assert.equal(dabGapOf(0.44), 0.4); assert.equal(dabGapOf(-0.05), 0);
  assert.equal(dabRunOf(undefined), 0); assert.equal(dabRunOf(9), 4); assert.equal(dabRunOf(2.4), 2); assert.equal(dabRunOf(-1), -1); assert.equal(dabRunOf(-9), -4);
  assert.equal(dabWideOf(undefined), 4.8, '0.96 of the 5 mm brush'); assert.equal(dabWideOf(undefined, 3), 2.9); assert.equal(dabWideOf(5.63), 5.6); assert.equal(dabWideOf(12), 8);
  assert.equal(brushOf(3), 3); assert.equal(brushOf('5'), 5); assert.equal(brushOf(2), 2); assert.equal(brushOf(4), GEN.pitch);
  // a brush's own gap: the 2 mm's −0.2 (the owner's), the 3 and the 5 0.6; its width 0.96 of it, 1.9 for the 2 mm
  assert.equal(dabGapOf(undefined, 2), -0.2); assert.equal(dabGapOf(undefined, 3), 0.6); assert.equal(dabGapOf(undefined, 5), 0.6); assert.equal(dabGapOf(0.3, 2), 0.3);
  assert.equal(dabWideOf(undefined, 2), 1.9); assert.equal(dabWideOf(0.4, 2), 1);
});

test('the run: a 20 mm dab runs 14 … 28 mm on the machine — 1 mm earlier at its top and 1 later at its bottom a step, below 0 later and earlier; the picture as it is', () => {
  const pic = { id: 't', w: 400, h: 400, pitch: 5, columns: 1, kind: 'dabs', box: [0, 0, 400, 400], jars: [{ id: 'c0', name: 'C1', hex: '#CC2222', coats: 1, cells: [{ n: 1, legs: [[7.5, 300, 280], [7.5, 280, 260]] }] }] };
  const was = JSON.stringify(pic), J = { slack: R3.slack, j3: R3.j3, brush: dabRunsOf };
  const run = (o, k = 0) => { const R = rowsOf(pic, passesV(pic, o), R3.every, FORMG.lap, false, J), m = R.ps[k][0]; return { L: +Math.hypot(m.b.x - m.a.x, m.b.y - m.a.y).toFixed(3), a: m.a, b: m.b }; };
  assert.deepEqual([0, 1, 2, 3, 4].map(r => run({ gap: 0, run: r }).L), [20, 22, 24, 26, 28]);
  // below 0 (the owner, 2026-11-23, the new brush: "I need a smaller stroke … can we bring the slider down to 6 mm?"): later down, earlier up
  assert.deepEqual([-3, -2, -1].map(r => run({ gap: 0, run: r }).L), [14, 16, 18]);
  for (const r of [-3, -2, -1, 1, 2, 3, 4]) {                                  // the same middle: as much on at the top as at the bottom
    const q = run({ gap: 0, run: r }), z = run({ gap: 0, run: 0 });
    assert.ok(Math.abs((q.a.x + q.b.x) / 2 - (z.a.x + z.b.x) / 2) < 1e-6 && Math.abs(q.a.y - q.b.y) < 1e-6, `run ${r}: about the dab's middle, along X`);
  }
  assert.deepEqual([-0.6, 0, 0.6].map(g => run({ gap: g }).L), [20.6, 20, 19.4], 'the gap: the dab shorter by it');
  assert.equal(run({ gap: 0.6, run: 4 }).L, 27.4);
  assert.equal(JSON.stringify(pic), was, 'the picture untouched');
  assert.equal(rowsOf(pic, passesV(pic, { run: 4 }), R3.every, FORMG.lap, false, J).ps.length, 2, 'a dab a run still');
  // the 2 mm brush's standard 12 mm dab: 12 at 0, 6 at −3 — its leg no shorter than DAB_LEG, the J3's 3 + 3 on it, still down the picture
  const leg = r => dabLeg(10, 112, 100, { gap: 0, run: r }), len = r => leg(r)[0][1] - leg(r)[1][1];
  assert.deepEqual([0, -1, -2, -3].map(r => +(len(r) + 6).toFixed(3)), [12, 10, 8, 6.2]);
  assert.ok(len(-3) > 0 && Math.abs((leg(-3)[0][1] + leg(-3)[1][1]) / 2 - 106) < 1e-9, 'about the dab\'s middle, top over bottom');
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

test('GEN-V\'s formats: a 20 × 20 for tests and a 30 × 30 in front of GEN-F\'s; the 20 × 20, the 30 × 30 and the 40 × 40 edge to edge, no margin; GEN-F\'s own untouched', () => {
  assert.deepEqual(GENV_FORMATS.map(f => f.id), ['20x20', '30x30', '40x40', '60x60', '60x80', '70x100', '90x120', '100x150']);
  assert.ok(formatV('20x20').test); assert.ok(!formatV('30x30').test, 'the 30 × 30 a canvas, not a test (2026-11-25)'); assert.deepEqual(fieldV(formatV('30x30'), 2), { w: 300, h: 300 }); assert.equal(formatV('nope').id, '40x40', 'an unknown one: the 40 × 40, as before');
  // the field the whole canvas where the canvas lies within the reach (the owner: "margins only for 60 × 60 and up … 200 × 200 mm we print without
  // trouble … 40 × 40 too, without the limiting contour"); 60 × 60 and up GEN-F's, 30 mm in
  assert.deepEqual(fieldV(formatV('20x20')), { w: 200, h: 200 }); assert.deepEqual(fieldV(formatV('40x40')), { w: 400, h: 400 });
  assert.deepEqual(['20x20', '30x30', '40x40', '60x60', '60x80', '70x100', '90x120'].map(id => wholeV(formatV(id))), [true, true, true, false, false, false, false]);
  for (const id of ['90x120', '100x150']) assert.deepEqual(fieldV(formatV(id)), fieldOf(formatOf(id)), `${id}: a new frame's, GEN-F's field`);
  // past the reach the canvas as far as the brush reaches it, across Y its brush's: 540, the 2 mm's 556 ("add 16 mm, 8 mm a side"; "only for GEN-V")
  assert.deepEqual(fieldV(formatV('60x60')), { w: 540, h: 600 }); assert.deepEqual(fieldV(formatV('60x60'), 2), { w: 556, h: 600 }); assert.deepEqual(fieldV(formatV('70x100'), 2), { w: 556, h: 855 });
  assert.equal(acrossV(2), 556); assert.equal(acrossV(3), 540); assert.equal(acrossV(5), 540); assert.equal(GEN.across, 540, 'GEN-F\'s own as it was');
  // Margins · zoom, 0 … 20 mm off the field's every side ("a zoom for the picture, from 0 to 20 mm")
  assert.deepEqual(MARGIN_UI, [0, 20, 1]); assert.equal(marginOf(25), 20); assert.equal(marginOf(-3), 0); assert.equal(marginOf(7.4), 7); assert.equal(marginOf(undefined), 0);
  assert.deepEqual(fieldV(formatV('20x20'), 2, 10), { w: 180, h: 180 }); assert.deepEqual(fieldV(formatV('60x60'), 2, 8), { w: 540, h: 584 });
  const Z = sketch('20x20', 12, 300, 300, 2), Zm = (() => { const f = formatV('20x20'), F = fitV(f, 300, 300, 2, 20); return F; })();
  assert.ok(Zm.N * 2 <= 160 && Zm.R <= 160 && Zm.left >= 20 - 1e-6 && Zm.top >= 20, `20 mm in: ${Zm.N * 2} × ${Zm.R}, left ${Zm.left}, top ${Zm.top}`);
  assert.ok(Z.fit.N > Zm.N, 'smaller with the margins');
  assert.ok(!formatOf('20x20').test, 'GEN-F has no 20 × 20'); assert.notEqual(formatOf('30x30').id, '30x30', 'nor a 30 × 30');
  const T = sketch('20x20', 12, 300, 300, 2);
  assert.equal(T.pic.w, 200); assert.equal(T.pic.h, 200);
  const [x0, y0, x1, y1] = T.pic.box;
  assert.ok(x0 >= -1e-6 && y0 >= -1e-6 && x1 <= 200 + 1e-6 && y1 <= 200 + 1e-6, `on the canvas: ${T.pic.box}`);
  assert.ok(Math.max(x1 - x0, y1 - y0) > 190, `edge to edge on its long side: ${T.pic.box}`);
  assert.ok(T.dabs > 100, `${T.dabs} dabs`);
});

// APPROVE 🐾 (2026-11-22, the evening: "I press APPROVE … and the picture appears in Library-V"): the page makes the card as genvpic.py makes it
test('APPROVE 🐾: the card off the sketch as genvpic.py makes it — the plan untouched, the same ≈ Jar hints, the look', async () => {
  const fs = await import('node:fs'), path = await import('node:path'), { fileURLToPath } = await import('node:url');
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const { cardOfSketch, idOfSketch } = await import('../src/goghplan.js');
  const shelf = JSON.parse(fs.readFileSync(path.join(root, 'app/formg/porsche-red-k.json'), 'utf8')).jars;
  for (const [file, id] of [['GOGH/orange-bear-details 2 · GEN-V · 20x20 · 2 mm · 14.json', 'orange-bear-20'], ['GOGH/Glossy Red-Orange Gummy Bear · GEN-V · 40x40 · 2 mm · 10.json', 'orange-bear']]) {
    const sk = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')), py = JSON.parse(fs.readFileSync(path.join(root, `app/gogh/${id}.json`), 'utf8'));
    const js = cardOfSketch(sk, shelf, { id, title: py.title, sub: py.sub });
    assert.deepEqual(js, py, `${id}: the same card as genvpic.py's`);
    assert.deepEqual(sk.pic.jars.map(j => j.code), sk.pic.jars.map(() => ''), 'the sketch itself untouched');
  }
  assert.equal(idOfSketch('orange-bear-details 2', '20x20', 2, 14), 'orange-bear-details-2-20x20-2mm-14');
  assert.equal(idOfSketch('Glossy Red-Orange Gummy Bear', '40x40', 2, 10), 'glossy-red-orange-gummy-bear-40x40-2mm-10');
  assert.equal(idOfSketch('Café · №5!', '60x60', 5, 20), 'cafe-no5-60x60-5mm-20');
  assert.equal(idOfSketch('', '20x20', 2, 12), 'gen-v-20x20-2mm-12');
  assert.match(idOfSketch('x'.repeat(200), '100x150', 3, 100), /^[a-z0-9][a-z0-9-]{0,79}$/, 'rembrandt.py\'s GENV_ID');
});

// Press test 3 (the owner, 2026-11-23: "do not draw the ideal even sausages any more. Take the red contour and leave the pink inside"; "the master … and
// the pink drop with its red contour its phantom slave. So we can correct that drop of 1.5 mm and its tip 13 mm past the end"): the slave hung on the
// master by two numbers — its top under the machine's way's start, its tip past its end (a dab longer than the floor: the master's), the RUN's 2 mm a step
test('a drop, the slave, the new brush\'s: its top 0.5 under the way\'s start, its tip 2 past its end, the RUN\'s 2 mm a step; 2.8 mm wide, a pill — a round head, a blunt end', async () => {
  const { dropOf, DROP, dropTopOf, dropTipOf } = await import('../src/goghplan.js');
  const ys = q => q.map(p => p[1]), xs = q => q.map(p => p[0]), len = q => Math.max(...ys(q)) - Math.min(...ys(q));
  // [mm, run, the way's start, the drop's length]; GOGH/IMG_3466 and IMG_3467 at RUN 12: 4 … 10 mm 8.2 … 13.3, 12 mm 13.3 … 15.2, 15 mm 17.9 … 20.6 (est.)
  const close = [[4, 0, 102.5, 10.5], [10, 0, 99.9, 11.3], [12, 0, 99.9, 13.3], [15, 0, 99.9, 16.3], [4, 1, 102.5, 12.5]];
  for (const [L, run, start, want] of close) {
    const q = dropOf(50, 100, 100 - L, { gap: 0.2, run });
    assert.ok(Math.abs(Math.max(...ys(q)) - (start - DROP.top)) < 1e-9, `top: ${L} mm, run ${run}: ${Math.max(...ys(q))}`);
    assert.ok(Math.abs(len(q) - want) < 0.051, `${L} mm at RUN ${12 + 2 * run}: ${len(q)}`);
    assert.ok(Math.abs(Math.max(...xs(q)) - Math.min(...xs(q)) - DROP.wide) < 1e-9, 'the widest');
    assert.deepEqual(q[0], q[q.length - 1], 'closed, its tip at the top');
  }
  // the sliders move the slave alone: the top down, the tip on, the master where it is
  const q0 = dropOf(50, 100, 85, { gap: 0.2 }), q1 = dropOf(50, 100, 85, { gap: 0.2, top: 3, tip: 10 });
  assert.ok(Math.abs(Math.max(...ys(q0)) - Math.max(...ys(q1)) - 2.5) < 1e-9 && Math.abs(Math.min(...ys(q0)) - Math.min(...ys(q1)) - 8) < 1e-9, 'the top 2.5 lower, the tip 8 longer');
  assert.equal(dropTopOf(9), 5); assert.equal(dropTopOf(-1), 0); assert.equal(dropTipOf(13.3), 13.5); assert.equal(dropTipOf(), 2);
  // the shape off the photos: the head round, the widest a third down, still ≈ 0.9 of it at half, the end blunt; a card's own width
  const at = (q, d) => { const top = Math.max(...ys(q)); return 2 * Math.max(...q.filter(p => Math.abs(top - p[1] - d) < 0.13).map(p => p[0] - 50)); };
  const q = dropOf(50, 100, 88, { gap: 0.2 }), P = len(q);
  assert.ok(at(q, 0.05 * P) < at(q, 0.15 * P) && at(q, 0.15 * P) < at(q, 0.3 * P), 'the head');
  assert.ok(Math.abs(at(q, 0.3 * P) - DROP.wide) < 0.06 && at(q, 0.5 * P) > 0.88 * DROP.wide, 'the widest a third down, ≈ 0.9 at half');
  assert.ok(at(q, P - 0.1) > 0.5 && at(q, P - 0.1) < 1.2, `the end blunt: ${at(q, P - 0.1)}`);
  const w = dropOf(50, 100, 88, { gap: 0.2, wide: 4.6 }).map(p => p[0]); assert.ok(Math.abs(Math.max(...w) - Math.min(...w) - 4.6) < 1e-9, 'a card\'s own width');
});

test('Press test 3: three paints a column each, Jar 28 · Jar 6 · Jar 14, two blocks a paint, their patches 5 mm apart (block 6 4 mm, the new brush), drops on the screen, none touching another block', async () => {
  const fs = await import('node:fs'), path = await import('node:path'), { fileURLToPath } = await import('node:url');
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const { GOGH_LIB, dropOf, passesV } = await import('../src/goghplan.js');
  const pic = JSON.parse(fs.readFileSync(path.join(root, 'app/gogh/press-paints-20.json'), 'utf8'));
  assert.ok(GOGH_LIB.includes('press-paints-20'));
  assert.ok(pic.drop && pic.kind === 'dabs' && pic.pitch === 2);
  assert.deepEqual(pic.jars.map(j => j.name), ['Jar 28', 'Jar 28', 'Jar 6', 'Jar 6', 'Jar 14', 'Jar 14']);
  assert.deepEqual(passesV(pic).map(P => P.pencil), ['b1', 'b2', 'b3', 'b4', 'b5', 'b6'], 'run in the card\'s order, a block a line');
  for (const j of pic.jars) {
    const lone = j.cells.slice(0, 6).map(c => c.legs[0]), patch = j.cells.slice(6).map(c => c.legs);
    assert.deepEqual(lone.map(([, a, b]) => a - b), [4, 6, 8, 10, 12, 15]);
    assert.deepEqual(lone.slice(1).map((l, i) => l[0] - lone[i][0]), [6, 6, 6, 6, 6]);
    assert.equal(patch.length, 10);
    assert.deepEqual(patch.slice(1).map((l, i) => l[0][0] - patch[i][0][0]), Array(9).fill(j.id === 'b6' ? 4 : 5), 'the patch 5 mm apart, block 6\'s 4 (the new brush; 6 before)');
    // RUN 16 at most: the longest lone drop's tail still 3 mm over the patch's top
    const tail = Math.min(...dropOf(...lone[5], { gap: pic.look.gap, run: 2 }).map(p => p[1])), head = Math.max(...dropOf(...patch[0][0], { gap: pic.look.gap, run: 2 }).map(p => p[1]));
    assert.ok(tail - head > 3, `${j.id}: ${tail} over ${head}`);
  }
  const all = pic.jars.flatMap(j => j.cells.flatMap(c => c.legs.map(l => dropOf(...l, { gap: pic.look.gap, run: 2 })))).flat();
  assert.ok(Math.min(...all.map(p => p[0])) > 10 && Math.max(...all.map(p => p[0])) < 190 && Math.min(...all.map(p => p[1])) > 10 && Math.max(...all.map(p => p[1])) < 190, 'within TEST\'s 10 mm margin');
});

test('Press test 5: the new brush, Press test 2\'s six blocks in one jar — lone dabs 4 … 15 mm, a patch 10 × 2 dabs 5 mm apart; its drops the new brush\'s on the screen', async () => {
  const fs = await import('node:fs'), path = await import('node:path'), { fileURLToPath } = await import('node:url');
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const { GOGH_LIB, dropOf, passesV } = await import('../src/goghplan.js');
  const pic = JSON.parse(fs.readFileSync(path.join(root, 'app/gogh/press-short-20.json'), 'utf8'));
  assert.ok(GOGH_LIB.includes('press-short-20'));
  assert.ok(pic.drop === true && pic.dropWide === undefined, 'the new brush\'s drop, DROP\'s own');
  assert.deepEqual(passesV(pic).map(P => P.pencil), ['b1', 'b2', 'b3', 'b4', 'b5', 'b6']);
  for (const j of pic.jars) {
    assert.equal(j.name, 'Jar 19');
    assert.deepEqual(j.cells.slice(0, 6).map(c => c.legs[0][1] - c.legs[0][2]), [4, 6, 8, 10, 12, 15]);
    const pat = j.cells.slice(6).map(c => c.legs); assert.equal(pat.length, 10);
    assert.deepEqual(pat.slice(1).map((l, i) => l[0][0] - pat[i][0][0]), Array(9).fill(5));
    assert.ok(pat.every(l => l.length === 2 && l[0][2] === l[1][1]), 'two dabs end to end a column');
  }
  const q = dropOf(50, 100, 88, { gap: 0.2 }), xs = q.map(p => p[0]);
  assert.ok(Math.abs(Math.max(...xs) - Math.min(...xs) - 2.8) < 1e-9, 'the new brush\'s 2.8 mm');
});

test('a drop at RUN 6: a seed, 7 mm long and 3.5 wide whatever the plan\'s length (IMG_3469, IMG_3470); between RUN 12 and 6 the pill turns into it', async () => {
  const { dropOf, DROP, SEED } = await import('../src/goghplan.js');
  const ys = q => q.map(p => p[1]), xs = q => q.map(p => p[0]), len = q => Math.max(...ys(q)) - Math.min(...ys(q)), wid = q => Math.max(...xs(q)) - Math.min(...xs(q));
  for (const L of [4, 6, 8, 10, 12, 15]) {
    const q = dropOf(50, 100, 100 - L, { gap: 0.2, run: -3 }), p = dropOf(50, 100, 100 - L, { gap: 0.2, run: 0 });
    assert.ok(Math.abs(len(q) - SEED.len) < 1e-6 && Math.abs(wid(q) - SEED.wide) < 1e-6, `${L} mm at RUN 6: ${len(q)} × ${wid(q)}`);
    assert.ok(Math.abs(Math.max(...ys(q)) - Math.max(...ys(p))) < 1e-9, 'its top the pill\'s');
    assert.ok(Math.abs(wid(p) - DROP.wide) < 1e-6, 'RUN 12 still the pill');
  }
  const w = r => wid(dropOf(50, 100, 88, { gap: 0.2, run: r }));
  assert.ok(w(0) < w(-1) && w(-1) < w(-2) && w(-2) < w(-3), 'wider step by step to the seed');
  assert.ok(Math.abs(wid(dropOf(50, 100, 88, { gap: 0.2, run: -3, wide: 5.6 })) - 7) < 1e-6, 'a card\'s own width scaled alike');
});

// "1 and ½" (the owner, 2026-11-23: "if a headlight or some small detail, ½ a seed; if a fill as the bonnet, there 1 leg"): a card's dab.seed makes a dab no
// longer than it a seed whatever the RUN — its leg DAB_LEG, its way the J3's alone — and leaves a longer one a leg
test('1 and ½: a card\'s dab.seed — a dab of ½ a seed on the machine and on the screen, a dab of 1 a leg, the RUN its own', async () => {
  const { dabLeg, dropOf, passesV, isSeed, DAB_LEG, SEED, DROP } = await import('../src/goghplan.js');
  const len = l => +(l[0][1] - l[1][1]).toFixed(3);
  assert.ok(isSeed(106, 100, { seed: 6, gap: 0.2 }) && !isSeed(112, 100, { seed: 6, gap: 0.2 }) && !isSeed(106, 100, { gap: 0.2 }));
  for (const run of [0, 2, -1]) {
    assert.equal(len(dabLeg(10, 106, 100, { gap: 0.2, run, seed: 6 })), DAB_LEG, `½ at run ${run}: the seed's leg`);
    assert.equal(len(dabLeg(10, 112, 100, { gap: 0.2, run, seed: 6 })), len(dabLeg(10, 112, 100, { gap: 0.2, run })), `1 at run ${run}: a leg as ever`);
  }
  const ys = q => q.map(p => p[1]), xs = q => q.map(p => p[0]);
  const s = dropOf(10, 106, 100, { gap: 0.2, seed: 6 }), l = dropOf(10, 112, 100, { gap: 0.2, seed: 6 });
  assert.ok(Math.abs(Math.max(...ys(s)) - Math.min(...ys(s)) - SEED.len) < 1e-6 && Math.abs(Math.max(...xs(s)) - Math.min(...xs(s)) - SEED.wide) < 1e-6, 'the seed on the screen');
  assert.ok(Math.abs(Math.max(...xs(l)) - Math.min(...xs(l)) - DROP.wide) < 1e-6, 'the leg a pill');
  const pic = { id: 't', w: 200, h: 200, pitch: 2, columns: 1, kind: 'dabs', dab: { seed: 6 }, jars: [{ id: 'c0', name: 'C1', hex: '#CC2222', coats: 1, cells: [{ n: 1, legs: [[10, 112, 106], [10, 106, 100]] }, { n: 2, legs: [[14, 112, 100]] }] }] };
  const P = passesV(pic, { gap: 0.2 });
  assert.deepEqual(P[0].byCell.map(c => c.legs.map(len)), [[DAB_LEG, DAB_LEG], [len(dabLeg(14, 112, 100, { gap: 0.2 }))]], 'passesV: two seeds, one leg');
});

// 1 and ½ the other way round (the owner, 2026-11-23, of the gummy bear's head: "last we lay only the seeds of the lightest and the darkest. Properly as Layer 2.
// Then the wet on wet is solved too"): the card's Layer 2 the seeds alone of the two lightest and the two darkest jars, the darks first, the lightest last
test('the gummy bear in 1 and ½, two layers: Layer 2 the seeds of the two lightest and the two darkest jars alone, on the dry first, the lightest last', async () => {
  const fs = await import('node:fs'), path = await import('node:path'), { fileURLToPath } = await import('node:url');
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const { GOGH_LIB, passesV, isSeed, labOfHex } = { ...(await import('../src/goghplan.js')), labOfHex: (await import('../src/genfplan.js')).labOfHex };
  for (const id of ['bear-led-30-3', 'bear-led-30-4']) {
    const pic = JSON.parse(fs.readFileSync(path.join(root, `app/gogh/${id}.json`), 'utf8'));
    assert.ok(GOGH_LIB.includes(id) && pic.w === 300 && pic.dab.seed === 6);
    const P = passesV(pic), one = P.filter(q => q.layer === 1), two = P.filter(q => q.layer === 2);
    assert.ok(one.length && two.length && P.indexOf(two[0]) === one.length, `${id}: Layer 2 after the whole first`);
    const L = hex => labOfHex(hex)[0], hexOf = q => pic.jars.find(j => j.id === q.pencil).hex;
    const lights = [...new Set(pic.jars.map(j => j.hex))].sort((a, b) => L(b) - L(a)), ext = new Set([...lights.slice(0, 2), ...lights.slice(-2)]);
    for (const q of two) {
      assert.ok(ext.has(hexOf(q)), `${id}: ${q.pencil} one of the extremes`);
      assert.ok(pic.jars.find(j => j.id === q.pencil).cells.every(c => c.legs.every(([, a, b]) => isSeed(a, b, { seed: 6, gap: pic.look.gap }))), 'seeds alone');
    }
    assert.equal(hexOf(two.at(-1)), lights[0], 'the lightest the very last');
  }
});

// ¼ (the owner, 2026-11-23, the evening: "can we make ¼ at all? 6 mm and 4 mm?"): below RUN 6 the J3 gives what the leg cannot — the way on the machine the dab's
// length + 2 · run, the 2 mm brush's 12 mm dab 8 · 6 · 4 at RUN 8 · 6 · 4
test('RUN down to 4: what the leg cannot give the J3 gives — the 12 mm dab runs 6 and 4 on the machine; a long dab as before, a seed shorter at RUN 4 alone', async () => {
  const { dabJ3, dabLeg, passesV, dabRunsOf } = await import('../src/goghplan.js');
  const { rowsOf, R3, FORMG } = await import('../src/formgplan.js');
  const pic = { id: 't', w: 200, h: 200, pitch: 2, columns: 1, kind: 'dabs', jars: [{ id: 'c0', name: 'C1', hex: '#CC2222', coats: 1, cells: [{ n: 1, legs: [[10, 112, 100]] }, { n: 2, legs: [[20, 150, 130]] }] }] };
  const way = (run, k) => { const R = rowsOf(pic, passesV(pic, { gap: 0, run }), R3.every, FORMG.lap, false, { slack: R3.slack, j3: R3.j3, brush: dabRunsOf }), m = R.ps[k][0]; return +Math.hypot(m.b.x - m.a.x, m.b.y - m.a.y).toFixed(3); };
  assert.deepEqual([0, -1, -2, -3, -4].map(r => way(r, 0)), [12, 10, 8, 6, 4], 'the 12 mm dab');
  assert.deepEqual([0, -2, -4].map(r => way(r, 1)), [20, 16, 12], 'a 20 mm dab: the leg gives it all, the J3 as ever');
  assert.equal(dabJ3(112, 100, { gap: 0, run: -2 }), null);
  assert.deepEqual(dabJ3(112, 100, { gap: 0, run: -4 }), { early: 1.9, late: 1.9 }, "the leg 0.2 + 1.9 + 1.9 = 4");
  assert.equal(dabJ3(106, 100, { gap: 0.2, run: -3, seed: 6 }), null, 'a seed at RUN 6 as RUN 6 lays it');
  assert.deepEqual(dabJ3(106, 100, { gap: 0.2, run: -4, seed: 6 }), { early: 2, late: 2 }, 'a seed at RUN 4 its J3 a mm shorter at each end (the nib, v.6)');
  assert.ok(Math.abs(dabLeg(10, 112, 100, { gap: 0, run: -4 })[0][1] - dabLeg(10, 112, 100, { gap: 0, run: -3 })[0][1]) < 1e-9, 'the leg at its floor');
});

// a jar's seeds (the owner, 2026-11-23, the night: "make short drops for the sixth module"): Press test 5's block 6 every dab a seed, whatever the RUN
test('a jar\'s seeds: Press test 5\'s block 6 every dab a seed at any RUN — its leg DAB_LEG, the J3 the canon\'s; blocks 1 … 5 their RUN\'s', async () => {
  const fs = await import('node:fs'), path = await import('node:path'), { fileURLToPath } = await import('node:url');
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const { passesV, DAB_LEG } = await import('../src/goghplan.js');
  const pic = JSON.parse(fs.readFileSync(path.join(root, 'app/gogh/press-short-20.json'), 'utf8'));
  assert.deepEqual(pic.jars.map(j => !!j.seeds), [false, false, false, false, false, true]);
  for (const run of [4, 0, -2, -4]) {
    const P = passesV(pic, { gap: 0.2, run }), len = l => +(l[0][1] - l[1][1]).toFixed(3);
    assert.ok(P[5].byCell.every(c => c.legs.every(l => len(l) === DAB_LEG) && (!c.j3 || run < -3)), `block 6 seeds at run ${run}`);
    assert.ok(P[0].byCell.some(c => c.legs.some(l => len(l) > DAB_LEG)) || run <= -3, `block 1 its RUN's at run ${run}`);
  }
});

// Press test 5 v.6 (the owner, 2026-11-23, the night, the spatula nib: "make a new test picture v.6 and only the last, sixth module … let them be preset"): block
// 6 alone, its seeds stamps — no lift beyond, the tip's way the dab's own — RUN 4 preset: the way 4.2 mm
test('Press test 5 v.6: block 6 alone, seeds as stamps — no lift beyond, the way 4.2 mm at its preset RUN 4; the preset on the card', async () => {
  const fs = await import('node:fs'), path = await import('node:path'), { fileURLToPath } = await import('node:url');
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const { GOGH_LIB, passesV, dabRunsOf } = await import('../src/goghplan.js');
  const { rowsOf, R3, FORMG } = await import('../src/formgplan.js');
  const pic = JSON.parse(fs.readFileSync(path.join(root, 'app/gogh/press-stamps-20.json'), 'utf8')), b5 = JSON.parse(fs.readFileSync(path.join(root, 'app/gogh/press-short-20.json'), 'utf8')).jars[5];
  assert.ok(GOGH_LIB.includes('press-stamps-20'));
  assert.deepEqual(pic.preset, { run: -4, gap: 0.2, press: 0.8, top: 0.5, tip: 2 });
  assert.equal(pic.jars.length, 1); assert.deepEqual(pic.jars[0].cells, b5.cells, 'block 6 at its own place');
  const P = passesV(pic, { gap: pic.preset.gap, run: pic.preset.run }), runs = dabRunsOf(P);
  assert.ok(runs.length === 26 && runs.every(r => r.beyond === false), 'stamps: no lift beyond');
  const R = rowsOf(pic, P, R3.every, FORMG.lap, false, { slack: R3.slack, j3: R3.j3, brush: dabRunsOf });
  for (const g of R.ps) { const m = g[0]; assert.ok(Math.abs(Math.hypot(m.b.x - m.a.x, m.b.y - m.a.y) - 4.2) < 1e-6, `the way ${Math.hypot(m.b.x - m.a.x, m.b.y - m.a.y)}`); }
  const R0 = rowsOf(pic, passesV(pic, { gap: 0.2, run: 0 }), R3.every, FORMG.lap, false, { slack: R3.slack, j3: R3.j3, brush: dabRunsOf }), m0 = R0.ps[0][0];
  assert.ok(Math.abs(Math.hypot(m0.b.x - m0.a.x, m0.b.y - m0.a.y) - 6.2) < 1e-6, 'at RUN 12 a seed\'s 6.2 as ever');
});

// the headlight for the nib (2026-11-23, the night): 1 and ½ in stamps — the legs the fill, the stamps the detail, their way 4.2 by the card's seedJ3; two layers
test('the headlight for the nib: every dab a stamp, the stamps\' way 4.2 (seedJ3 2), the legs the RUN\'s; Layer 2 the extremes\' stamps; its preset', async () => {
  const fs = await import('node:fs'), path = await import('node:path'), { fileURLToPath } = await import('node:url');
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const { GOGH_LIB, passesV, dabRunsOf, isSeed } = await import('../src/goghplan.js');
  const { rowsOf, R3, FORMG } = await import('../src/formgplan.js');
  const pic = JSON.parse(fs.readFileSync(path.join(root, 'app/gogh/headlight-nib-20.json'), 'utf8'));
  assert.ok(GOGH_LIB.includes('headlight-nib-20'));
  assert.ok(pic.jars.every(j => j.stamp) && pic.dab.seed === 6 && pic.dab.seedJ3 === 2 && pic.preset.run === -1);
  const P = passesV(pic, { gap: pic.preset.gap, run: pic.preset.run }), runs = dabRunsOf(P);
  assert.ok(runs.every(r => r.beyond === false), 'stamps');
  const jar = q => pic.jars.find(j => j.id === q.pencil), two = P.filter(q => q.layer === 2);
  assert.equal(jar(two[0]).name, 'Jar 6', 'Jar 6, the orange, first in Layer 2 (its canon)');
  assert.ok(two.slice(1).every(q => jar(q).cells.every(c => c.legs.every(([, a, b]) => isSeed(a, b, { seed: 6, gap: 0.2 })))), 'then the extremes\' stamps alone');
  const own = ['Jar 1', 'Jar 5', 'Jar 6', 'Jar 7', 'Jar 10', 'Jar 13', 'Jar 22', 'Jar 23', 'Jar 27', 'Jar 29', 'Jar 30', 'Jar 31', 'Jar 32', 'Jar 34', 'Jar 35', 'Jar 36', 'Jar 38', 'Jar 43', 'Black'];
  assert.ok(pic.jars.every(j => own.includes(j.name)), 'his named jars of the red classic alone');
  const R = rowsOf(pic, P, R3.every, FORMG.lap, false, { slack: R3.slack, j3: R3.j3, brush: dabRunsOf });
  const ways = R.ps.map(g => +Math.hypot(g[0].b.x - g[0].a.x, g[0].b.y - g[0].a.y).toFixed(2));
  assert.ok(ways.filter(w => Math.abs(w - 4.2) < 1e-6).length >= 180, 'the stamps 4.2 mm');
  assert.ok(Math.max(...ways) <= 10.01, `a leg at most 12 − 2 at RUN 10: ${Math.max(...ways)}`);
});

// a drop's profile read past its end by rounding (2026-11-23, the night: a 38 mm wide line across the headlight's picture): never wider than its own width
test('a drop never wider than its width — the profile clamped at its ends', async () => {
  const { dropOf } = await import('../src/goghplan.js');
  const q = dropOf(45, 113.88, 103, { gap: 0.2, run: 0, seed: 6, seedJ3: 2, wide: 3.5 }), xs = q.map(p => p[0]);
  assert.ok(Math.max(...xs) - Math.min(...xs) <= 3.5 + 1e-9, `${Math.max(...xs) - Math.min(...xs)}`);
});

test('the headlight v.2: his 13 jars as he set them by 🔄, a line each a layer, columns 4 mm apart, Jar 6 first in Layer 2', async () => {
  const fs = await import('node:fs'), path = await import('node:path'), { fileURLToPath } = await import('node:url');
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const { GOGH_LIB, passesV } = await import('../src/goghplan.js');
  const pic = JSON.parse(fs.readFileSync(path.join(root, 'app/gogh/headlight-nib-20-v2.json'), 'utf8'));
  assert.equal(GOGH_LIB[0], 'headlight-nib-20-v2');
  const P = passesV(pic, { gap: 0.2, run: -1 }), name = q => pic.jars.find(j => j.id === q.pencil).name, one = P.filter(q => q.layer === 1).map(name), two = P.filter(q => q.layer === 2).map(name);
  assert.deepEqual(one, ['Jar 1', 'Jar 5', 'Jar 7', 'Jar 22', 'Jar 23', 'Jar 29', 'Jar 30', 'Jar 31', 'Jar 34', 'Jar 38', 'Jar 43', 'Black'], 'a line each');
  assert.equal(two[0], 'Jar 6');
  const xs = [...new Set(pic.jars.flatMap(j => j.cells.flatMap(c => c.legs.map(l => l[0]))))].sort((a, b) => a - b);
  assert.ok(xs.slice(1).every((x, i) => Math.abs(x - xs[i] - 4) < 1e-6), 'columns 4 mm apart');
  assert.ok(pic.jars.every(j => j.stamp) && pic.preset.run === -1);
});

// the nib's stone (the owner, 2026-11-24, the night: "trim the drops a little to the new nib … neat as mosaic stones"): a rounded rectangle 4.3 mm wide, the way's own
test('the nib\'s stone: 4.3 mm wide, a stamp 5.7 mm (v.6 on canvas ≈ 6), a leg the way + 1.5 at the preset\'s top 0.5 and tip 2; square sides, round corners', async () => {
  const { dropOf, NIB } = await import('../src/goghplan.js');
  const ys = q => q.map(p => p[1]), xs = q => q.map(p => p[0]), len = q => Math.max(...ys(q)) - Math.min(...ys(q));
  const o = { gap: 0.2, seed: 6, seedJ3: 2, nib: true, wide: NIB.wide, top: 0.5, tip: 2 };
  const st = dropOf(50, 106, 100, { ...o, run: 0 }), lg = dropOf(50, 112, 100, { ...o, run: 0 }), l10 = dropOf(50, 112, 100, { ...o, run: -1 });
  assert.ok(Math.abs(len(st) - 5.7) < 1e-6 && Math.abs(len(lg) - 13.3) < 1e-6 && Math.abs(len(l10) - 11.3) < 1e-6, `${len(st)} ${len(lg)} ${len(l10)}`);
  for (const q of [st, lg]) assert.ok(Math.abs(Math.max(...xs(q)) - Math.min(...xs(q)) - 4.3) < 1e-9, 'the width');
  const mid = (Math.max(...ys(lg)) + Math.min(...ys(lg))) / 2, at = y => Math.max(...lg.filter(p => Math.abs(p[1] - y) < 0.15).map(p => p[0] - 50));
  assert.ok(Math.abs(at(mid) - 2.15) < 1e-6 && at(Math.max(...ys(lg)) - 0.1) < 1.8, 'square in the middle, round at the corners');
});

// the piglet, 2026-11-25 ("add to the new pictures from GEN-V / LIB-V the function Drop TIP + Drop TOP"): a drop by its profiles' own points, the same shape
test('a drop drawn by its profiles\' points alone, as many at any length; top and tip move its two ends on a GEN-V picture\'s dab', async () => {
  const { dropOf, DROP, SEED } = await import('../src/goghplan.js');
  const at = new Set([...DROP.profile, ...SEED.profile].map(q => q[0])).size;
  for (const L of [8, 12, 15]) assert.equal(dropOf(50, 100, 100 - L, { gap: -0.1 }).length, 2 * at);
  const ends = o => { const y = dropOf(50, 100, 88, { gap: -0.1, wide: 2.4, ...o }).map(q => q[1]); return [Math.max(...y), Math.min(...y)]; };
  const [t0, b0] = ends({ top: 0.5, tip: 2 }), [t1, b1] = ends({ top: 4, tip: 12 });
  assert.ok(Math.abs(t0 - t1 - 3.5) < 1e-9 && Math.abs(b0 - b1 - 10) < 1e-9);
});
