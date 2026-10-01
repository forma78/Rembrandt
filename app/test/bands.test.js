import test from 'node:test';
import assert from 'node:assert/strict';
import { PT_MM } from '../src/config.js';
import { P, dist } from '../src/util.js';
import { segStart, segEnd, segLen } from '../src/geometry.js';
import { buildCurve } from '../src/curve.js';
import { clipSegs, cutPath, pathLength, pointAlong, buildLanes, steepest, paintLanes } from '../src/bands.js';
import { dropPlan, fromHome } from '../src/drops.js';
import { PAINT_EST, mlFor } from '../src/adjust.js';

const pt = mm => mm / PT_MM;
const sheet = () => buildCurve(P(0, pt(415)), 42, [['L', pt(241.2)], ['T', pt(247.8), 63], ['L', pt(144.3)]]);
const AREA = { x0: 0, y0: 0, x1: pt(568.5), y1: pt(865) };
const inArea = q => q.x > -1e-6 && q.x < AREA.x1 + 1e-6 && q.y > -1e-6 && q.y < AREA.y1 + 1e-6;
const joined = segs => segs.every((g, i) => !i || dist(segEnd(segs[i - 1]), segStart(g)) < 1e-6);

test('clipping: a line across the area keeps the part inside, an arc too, both exact', () => {
  const [l] = clipSegs([{ t: 'L', a: P(-10, 50), b: P(pt(600), 50) }], AREA);
  assert.equal(l.length, 1); assert.ok(Math.abs(l[0].a.x) < 1e-9 && Math.abs(l[0].b.x - AREA.x1) < 1e-9);
  const arc = { t: 'A', c: P(0, 0), r: 100, a0: -Math.PI / 2, s: Math.PI };       // from above the origin, round the right, to below it
  const pieces = clipSegs([arc], AREA);
  assert.equal(pieces.length, 1);
  assert.equal(pieces[0][0].t, 'A');
  assert.ok(dist(segStart(pieces[0][0]), P(100, 0)) < 1e-6 && dist(segEnd(pieces[0][0]), P(0, 100)) < 1e-6);
});

test('cutting a path between two lengths gives exact lines and arcs of that length', () => {
  const s = sheet(), L = pathLength(s), c = cutPath(s, 100, L - 100);
  assert.ok(Math.abs(pathLength(c) - (L - 200)) < 1e-6);
  assert.ok(joined(c) && c.every(g => g.t === 'L' || g.t === 'A'));
  assert.ok(dist(segStart(c[0]), pointAlong(s, 100)) < 1e-6);
});

test('the lines fill the image area: below the curve offsets, above it vertical copies; all inside', () => {
  const pitch = pt(8), lanes = buildLanes(sheet(), { pitch, area: AREA });
  const below = lanes.filter(l => l.side === 'below'), above = lanes.filter(l => l.side === 'above');
  assert.ok(below.length > 40 && above.length > 60, `${below.length} below, ${above.length} above`);
  for (const l of lanes) for (const p of l.pieces) { assert.ok(joined(p)); for (const g of p) { assert.ok(inArea(segStart(g)) && inArea(segEnd(g))); assert.ok(g.t === 'L' || g.t === 'A'); } }
  // line 1 below: its centre half a pitch from the curve, at the dip straight down
  const arc = sheet()[1], dip = P(arc.c.x, arc.c.y + arc.r), l1 = below.find(l => l.k === 1).pieces[0];   // the bottom of the curve's arc
  const near = l1.flatMap(g => [segStart(g), segEnd(g), g.t === 'A' ? P(g.c.x, g.c.y + g.r) : null]).filter(Boolean).sort((a, b) => dist(a, dip) - dist(b, dip))[0];
  assert.ok(Math.abs(near.y - dip.y - pitch / 2) < 1e-6 && Math.abs(near.x - dip.x) < 1e-6, `line 1 at the dip: ${(near.y - dip.y) * PT_MM} mm below`);
  // line 1 above: the curve moved up half a pitch
  const a1 = above.find(l => l.k === 1).pieces[0][0];
  assert.ok(Math.abs(segStart(a1).y - (pt(415) - pitch / 2)) < 1e-6);
  assert.ok(Math.abs(steepest(sheet()) - 42) < 1e-6);
});

test('paint from the reference: yellow from the right edge into the red, the red from the left towards it', () => {
  const lanes = buildLanes(sheet(), { pitch: pt(8), area: AREA }).filter(l => l.side === 'below' && l.k <= 6);
  const lab = { yellow: [0.8, 0.02, 0.15], red: [0.5, 0.2, 0.1] };
  const runs = paintLanes(lanes, {
    sample: x => x > pt(400) ? lab.yellow : lab.red,
    tubes: { below: [{ id: 'yellow', lab: lab.yellow }, { id: 'red', lab: lab.red }] },
    step: pt(4), minRun: pt(24), bucket: pt(5), lightness: id => lab[id][0],
  });
  const y = runs.filter(r => r.tube === 'yellow'), r = runs.filter(r => r.tube === 'red');
  assert.ok(y.length && r.length);
  assert.ok(y.every(q => q.home === 'end' && !q.tailAtEdge), 'yellow starts at the right edge and thins into the red');
  assert.ok(r.every(q => q.home === 'start'), 'red starts on the left and runs towards the yellow');
  for (const q of runs) assert.ok(Math.abs(pathLength(q.segs) - q.len) < 1e-6);
});

test('alternation: where the reference lies between two tubes, neighbouring lines take turns', () => {
  const lanes = buildLanes(sheet(), { pitch: pt(8), area: AREA }).filter(l => l.side === 'above' && l.k <= 8);
  const runs = paintLanes(lanes, {
    sample: () => [0.5, 0, 0],                                    // a mid grey, between white and black
    tubes: { above: [{ id: 'white', lab: [1, 0, 0] }, { id: 'black', lab: [0, 0, 0] }] },
    step: pt(4), minRun: pt(24), bucket: pt(5), lightness: id => id === 'white' ? 1 : 0,
  });
  const len = id => runs.filter(r => r.tube === id).reduce((a, r) => a + r.len, 0);
  assert.ok(Math.abs(len('white') / (len('white') + len('black')) - 0.5) < 0.15, 'about half and half');
});

test('the drop plan: one drop feeds at most 100 mm of lines; ml in whole standard drops; lighter tube first', () => {
  const lanes = buildLanes(sheet(), { pitch: pt(8), area: AREA }).filter(l => l.side === 'below' && l.k <= 30);
  const lab = { yellow: [0.8, 0.02, 0.15], red: [0.5, 0.2, 0.1] }, lightness = id => lab[id][0];
  const runs = paintLanes(lanes, { sample: x => x > pt(400) ? lab.yellow : lab.red, tubes: { below: [{ id: 'yellow', lab: lab.yellow }, { id: 'red', lab: lab.red }] }, step: pt(4), minRun: pt(24), bucket: pt(5), lightness });
  const plan = dropPlan(runs, PAINT_EST, { pitch: pt(8), near: pt(40), lightness });
  assert.ok(plan.drops.every(d => d.lines <= 12), 'a 100 mm drop across 8 mm lines feeds 12 of them');
  assert.equal(plan.drops[0].tube, 'yellow');
  const need = runs.reduce((a, r) => a + mlFor(r.len * PT_MM, PAINT_EST), 0);
  assert.ok(plan.total.ml >= need && Math.abs(plan.total.ml - plan.total.drops * 2.1) < 1e-9);
  const r0 = runs[0]; assert.ok(dist(fromHome(r0, 0), r0.home === 'start' ? segStart(r0.segs[0]) : segEnd(r0.segs[r0.segs.length - 1])) < 1e-6);
});
