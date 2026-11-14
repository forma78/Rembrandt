import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { HOLO, HOLO_LIB, HOLO_HIDDEN, legsOf, puddlesY, dabsOf, seqOf, workOf, planOf, movesOf, shadeAt, placeRange, contourHolo, besideOf, markCells, MARKS_BESIDE, bandOn } from '../src/holoplan.js';

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
    if (!p.version) assert.deepEqual(puddlesY(p), p.slats[0].puddles_y, `${id}: the puddles where the study laid them`);   // a v.2's or v.3's every leg its own
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
  assert.ok(t.left[1] - t.left[0] > 120 && t.bottom[1] - t.bottom[0] > 400, 'the 40 × 40 with its slips beside it');
});

test('MARKS beside the canvas (the canon of 2026-11-14): the 40 × 40 its two slips off the canvas, left and right, both within the Y walls; a 60 × 60 none', () => {
  const W = load('holo-40-warm'), B = besideOf(W), r = placeRange(W, WALLS), o = MARKS_BESIDE;
  assert.ok(r.marks && r.left[0] <= r.left[1]);
  assert.deepEqual(B.strips.map(s => [s.no, s.side]), [[1, 'left'], [3, 'right']]);
  assert.equal(B.n, W.jars.length, 'a jar a cell');
  for (const left of r.left) for (const L of B.marks) for (const m of L) {
    const y = left + m.at[0];                                                        // the mark's middle across Y, mm from home
    assert.ok(y - o.trail / 2 >= 0.2 - 1e-9 && y + o.trail / 2 <= WALLS.y.max - 0.2 + 1e-9, `left ${left}: a mark at Y ${y}`);
    assert.ok(m.side === 'left' ? m.at[0] + o.trail / 2 <= -o.gap + 1e-9 : m.at[0] - o.trail / 2 >= W.w + o.gap - 1e-9, 'off the canvas, the gap from its edge');
    assert.ok(m.at[1] > 0 && m.at[1] < W.h, 'about the edge\'s middle, along it');
  }
  const ys = B.marks.map(L => L[0].at[1]);
  assert.ok(ys.every((y, i) => !i || y <= ys[i - 1]), 'the first at the top');
  assert.ok(Math.abs((Math.max(...ys) + Math.min(...ys)) / 2 - W.h / 2) < 1e-6, 'about the middle of the edge');
  // the plan: every line its marks first, one dip's worth, then its puddles; ▶ Play the same
  const P = planOf(W, { marks: true }), P0 = planOf(W);
  assert.ok(P.every((L, i) => L.marks.length === 2 && L.seconds > P0[i].seconds) && P0.every(L => !L.marks.length));
  const M = movesOf(P);
  for (let i = 0; i < P.length; i++) { const own = M.filter(m => m.line === i); assert.deepEqual(own.slice(0, 2).map(m => [m.kind, m.no]), [['mark', 1], ['mark', 3]]); assert.equal(own[2].kind, 'dab'); }
  // the 60 × 60s: the canvas alone wider than the reach across Y — on it, by the field (IMG_2904, "right on the canvas, as with 70 × 100"),
  // where the field leaves the reach room: the tiers, 540 mm, one row; the blue, 560 mm and two rows, none — its place by the field as before
  assert.equal(r.marks, 'off', 'the 40 × 40 beside the canvas, the canon\'s photo');
  const T = load('holo-60-tiers'), q = placeRange(T, WALLS), TB = besideOf(T, 'on');
  assert.equal(q.marks, 'on'); assert.ok(q.left[0] <= q.left[1]);
  for (const left of q.left) for (const L of TB.marks) for (const m of L) {
    const y = left + m.at[0];
    assert.ok(y - o.trail / 2 >= 0.2 - 1e-9 && y + o.trail / 2 <= WALLS.y.max - 0.2 + 1e-9, `tiers, left ${left}: a mark at Y ${y}`);
    assert.ok(m.side === 'left' ? m.at[0] + o.trail / 2 <= T.field.x0 - o.clear + 1e-9 && m.at[0] - o.trail / 2 >= 0 : m.at[0] - o.trail / 2 >= T.field.x1 + o.clear - 1e-9 && m.at[0] + o.trail / 2 <= T.w, 'on the canvas\'s margin, clear of the field');
  }
  const b = placeRange(load('holo-60-blue'), WALLS);
  assert.ok(!b.marks && b.widest < 560 && b.widest > 500, `the blue: none, a field up to ${b.widest} would do`);
  assert.deepEqual(b.left, [-19, -12]);
});

test('MARKS\' cells: a jar a cell by its first line, a jar in both runs its run-2 line in a second row', () => {
  const seq = [{ jar: 'a', run: 1 }, { jar: 'b', run: 1 }, { jar: 'c', run: 2 }, { jar: 'a', run: 2 }];
  assert.deepEqual(markCells(seq), [{ k: 0, row: 0 }, { k: 1, row: 0 }, { k: 2, row: 0 }, { k: 0, row: 1 }]);
  const blue = load('holo-60-blue'), B = besideOf(blue);
  assert.equal(B.rows, 2, 'the blue: one jar in both runs'); assert.equal(B.n, blue.jars.length);
});

test('anywhere in the range the field\'s edges stay 0.2 mm inside the Y walls, in whole mm: the blue\'s TEST and DRAW BW no hair past Y\'s (2026-11-14)', () => {
  for (const id of HOLO_LIB) {
    const p = load(id), r = placeRange(p, WALLS), f = p.field, Y = WALLS.y.max, X = WALLS.x.max;
    for (const v of [...r.left, ...r.bottom]) assert.ok(Number.isInteger(v), `${id}: ${v} a whole mm`);
    for (const left of r.left) assert.ok(left + f.x0 >= 0.2 - 1e-9 && left + f.x1 <= Y - 0.2 + 1e-9, `${id}: left ${left}, the field ${left + f.x0} … ${left + f.x1}`);
    for (const bottom of r.bottom) assert.ok(bottom + f.y0 >= 25 && bottom + f.y1 <= X - 8, `${id}: bottom ${bottom}`);
    // DRAW BW's lines, the outline and every border, across Y no farther than the field's edges
    for (const outline of [true, false]) for (const [x] of contourHolo(p, { outline }).lines.flat()) assert.ok(x >= f.x0 - 1e-6 && x <= f.x1 + 1e-6, `${id}: a line at ${x}`);
  }
  assert.deepEqual(placeRange(load('holo-60-blue'), WALLS).left, [-19, -12], 'the blue: −9, its old place by the legs\' middles, put TEST\'s dots on the wall');
});

test('DRAW BW: the outline where the paint meets the bare canvas, every border once; a jar in both runs one colour', () => {
  const W = load('holo-40-warm'), O = contourHolo(W, { outline: true }), A = contourHolo(W), f = W.field;
  // the warm fan: every slat a ground, so the outline is the field's own rectangle, once round — a few shadows end up to 2.6 mm past its top
  // and bottom in the plan (cloud-Claude's), and the pen goes round them
  assert.equal(O.lines.length, 1);
  assert.ok(Math.abs(O.mm - 2 * ((f.x1 - f.x0) + (f.y1 - f.y0))) < 15, `outline ${O.mm} mm`);
  const near = (v, e) => Math.abs(v - e) <= 3;
  for (const l of O.lines) for (const [x, y] of l) assert.ok(near(x, f.x0) || near(x, f.x1) || near(y, f.y0) || near(y, f.y1), `${x},${y} by the field's edge`);
  assert.ok(A.mm > O.mm * 4 && A.lines.length > O.lines.length, 'every border more than the outline');
  // every run-2 stroke's start a border across its leg
  const starts = new Set(A.lines.flatMap(l => l.map(q => q[1])));
  for (const L of planOf(W).filter(q => q.run === 2)) for (const q of L.strokes) assert.ok(starts.has(Math.round(q.pts[0][1] * 100) / 100), `a shadow's start at ${q.pts[0][1]}`);
  // the blue fan's Sky Blue, a ground and a shadow: no line where it meets itself
  const B = load('holo-60-blue'), byJar = contourHolo(B), one = contourHolo(B, { outline: false });
  assert.equal(byJar.mm, one.mm);
  // the tiers: bare slats, so the outline goes in round them too
  const T = load('holo-60-tiers'), OT = contourHolo(T, { outline: true });
  assert.ok(OT.mm > 2 * ((T.field.x1 - T.field.x0) + (T.field.y1 - T.field.y0)) + 1, `tiers outline ${OT.mm} mm`);
});

test('the v.1s hidden (the owner, 2026-11-15): every hidden one in the library, its v.2 shown; only v.1s hidden', () => {
  assert.deepEqual([...HOLO_HIDDEN].sort(), ['holo-40-warm', 'holo-60-blue', 'holo-60-tiers']);
  for (const id of HOLO_HIDDEN) { assert.ok(HOLO_LIB.includes(id) && HOLO_LIB.includes(id + '-v2') && !HOLO_HIDDEN.has(id + '-v2'), id); assert.ok(!load(id).version, `${id} a v.1`); }
});

test('v.2, ragged edges (the owner, 2026-11-14): every v.1 kept, its v.2 after it; every leg its own ends within the field\'s box, run 1 along them, run 2 within them', () => {
  for (const id of ['holo-40-warm', 'holo-60-blue', 'holo-60-tiers']) {
    const i = HOLO_LIB.indexOf(id), v2 = load(id + '-v2'), v1 = load(id);
    assert.ok(i >= 0 && HOLO_LIB[i + 1] === id + '-v2', `${id}: its v.2 right after it`);
    assert.equal(v2.version, 2); assert.equal(v2.of, id); assert.equal(v2.w, v1.w);
    assert.deepEqual(new Set(v2.jars.map(j => j.id)).size <= new Set(v1.jars.map(j => j.id)).size + 0, true, 'no jar v.1 has not');
    for (const j of v2.jars) assert.ok(v1.jars.some(q => q.id === j.id), `${id}-v2: ${j.name} a v.1 jar`);
    const L = legsOf(v2), f = v2.field;
    assert.ok(L.every(g => g.y0 >= f.y0 - 1e-6 && g.y1 <= f.y1 + 1e-6 && g.y1 - g.y0 > 100), 'within the box, no stub');
    assert.ok(new Set(L.map(g => g.y1)).size > 10 && new Set(L.map(g => g.y0)).size > 10, 'ragged: no even edge');
    assert.ok(Math.abs(Math.min(...L.map(g => g.y0)) - f.y0) < 0.05 && Math.abs(Math.max(...L.map(g => g.y1)) - f.y1) < 0.05, 'the box the legs\' own');
    const at = x => L.find(g => Math.abs(g.x - x) < 1e-6);
    for (const line of seqOf(v2)) {
      const w = workOf(v2, line);
      for (const q of w.strokes) {
        const g = at(q.x), [a, b] = [q.pts[0][1], q.pts[1][1]];
        assert.ok(Math.min(a, b) >= g.y0 - 1e-6 && Math.max(a, b) <= g.y1 + 1e-6, `${id}-v2 run ${line.run}: a stroke ${a} … ${b} past its leg ${g.y0} … ${g.y1}`);
        if (line.run === 1) assert.ok(Math.abs(Math.abs(b - a) - (g.y1 - g.y0)) < 1e-6, 'run 1 its leg end to end');
      }
      for (const p of w.puddles) { const g = at(p.x); assert.ok(p.y >= g.y0 && p.y <= g.y1, 'a puddle on its leg'); }
    }
    // MARKS: the 40 × 40 beside the canvas, the 60 × 60s on it — the v.2's 520 mm leave the blue room too
    assert.equal(placeRange(v2, WALLS).marks, id === 'holo-40-warm' ? 'off' : 'on', `${id}-v2 MARKS`);
    // DRAW BW's outline round the ragged edge: every point of it on a leg's end or side
    const O = contourHolo(v2, { outline: true });
    assert.ok(O.lines.length >= 1 && O.mm > 2 * ((f.x1 - f.x0) + (f.y1 - f.y0)), `${id}-v2: the outline longer than the box's, ${O.mm}`);
  }
  // one rhythm for both runs: a band sits on every leg of its slat at the same share of the leg's own length, as run 1's puddles do
  for (const id of ['holo-40-warm-v2', 'holo-60-tiers-v2']) {
    const p = load(id), L = legsOf(p), sl = p.slats.find(s => s.bands.length && s.legs > 2 && new Set(s.ends.map(e => e[1])).size > 1);
    const own = L.filter(g => g.slat === sl), share = (g, y) => (y - g.y0) / (g.y1 - g.y0);
    for (const b of sl.bands) {
      const at = own.map(g => share(g, bandOn(p, g, b).start));
      assert.ok(Math.max(...at) - Math.min(...at) < 1e-9, `${id}: a band's start at one share of every leg, ${at}`);
      const tops = own.map(g => bandOn(p, g, b).y1); assert.ok(new Set(tops.map(v => v.toFixed(3))).size > 1, 'its edge dances with the legs\' ends');
    }
  }
  // v.1 as it was: every leg the field's whole height
  const v1 = load('holo-40-warm'); assert.ok(legsOf(v1).every(g => g.y0 === v1.field.y0 && g.y1 === v1.field.y1));
});
