import test from 'node:test';
import assert from 'node:assert/strict';
import { PT_MM } from '../src/config.js';
import { P, dist } from '../src/util.js';
import { segStart, segEnd } from '../src/geometry.js';
import { buildCurve } from '../src/curve.js';
import { ribbonLines, lineOffset, widthLabel, clampLines, ribbonWidth, linesLength, ribbonName, sketchRibbons, MAX_LINES } from '../src/ribbon.js';

const pt = mm => mm / PT_MM;
const mm = v => v * PT_MM;
let id = 0;
const ribbon = (segs, n) => ({ id: 'r' + ++id, segs, n });
function joined(segs) {
  for (let i = 1; i < segs.length; i++) assert.ok(dist(segEnd(segs[i - 1]), segStart(segs[i])) < 1e-6, `joint ${i} is open`);
}

test('the width is a count of 8 mm lines, and the readout says both', () => {
  assert.equal(widthLabel(12), '96 mm · 12 lines');
  assert.equal(widthLabel(1), '8 mm · 1 line');
  assert.equal(ribbonWidth({ n: 12 }), 96);
  assert.equal(clampLines(0), 1);
  assert.equal(clampLines(12.4), 12);
  assert.equal(clampLines(999), MAX_LINES);
  assert.deepEqual([0, 1, 2].map(ribbonName), ['N1', 'N2', 'N3']);
});

test('a straight ribbon: N parallel lines 8 mm apart, symmetric about the centre', () => {
  const r = ribbon([{ t: 'L', a: P(pt(50), pt(100)), b: P(pt(450), pt(100)) }], 12);
  const L = ribbonLines(r, 10);
  assert.equal(L.lines.length, 12);
  assert.deepEqual(L.lines.map(l => l.off), [-44, -36, -28, -20, -12, -4, 4, 12, 20, 28, 36, 44]);
  for (const l of L.lines) {
    assert.equal(l.segs.length, 1);
    const g = l.segs[0];
    assert.ok(Math.abs(mm(g.a.y) - (100 + l.off)) < 1e-9, `line ${l.k} at ${mm(g.a.y)} mm`);   // + is to the right of travel: down, going right
    assert.ok(Math.abs(mm(g.b.x - g.a.x) - 400) < 1e-9, 'as long as the centre');
  }
  assert.equal(L.warn.length, 0);
  assert.ok(Math.abs(linesLength(L) - 12 * 400) < 1e-6);
});

test('an odd count puts the middle line on the centre', () => {
  assert.equal(lineOffset(6, 13), 0);
  assert.equal(lineOffset(0, 13), -48);
  assert.equal(lineOffset(12, 13), 48);
});

test('a kink is rounded for the whole width: the inner line keeps the inner radius, nothing folds', () => {
  const segs = [{ t: 'L', a: P(pt(50), pt(100)), b: P(pt(300), pt(100)) }, { t: 'L', a: P(pt(300), pt(100)), b: P(pt(300), pt(400)) }];
  const L = ribbonLines(ribbon(segs, 12), 10);
  assert.equal(L.warn.length, 0);
  const R = L.centre.find(g => g.t === 'A');
  assert.ok(R && Math.abs(mm(R.r) - (48 + 10)) < 1e-6, 'the centre turns on W/2 + the inner radius');
  const inner = L.lines.find(l => l.off === 44).segs.find(g => g.t === 'A');   // a right turn: the inner side is the right
  assert.ok(inner && Math.abs(mm(inner.r) - 14) < 1e-6, `the inner line turns on ${inner && mm(inner.r)} mm`);
  for (const l of L.lines) joined(l.segs);
});

test('an arc drawn tighter than half the ribbon is marked', () => {
  const segs = buildCurve(P(pt(100), pt(300)), 0, [['L', pt(100)], ['R', pt(30), 180], ['L', pt(100)]]);
  assert.equal(ribbonLines(ribbon(segs, 4), 10).warn.length, 0, '32 mm wide: a 30 mm arc is enough');
  assert.ok(ribbonLines(ribbon(segs, 12), 10).warn.length > 0, '96 mm wide: a 30 mm arc is too tight');
});

test('no centre, no lines', () => {
  assert.deepEqual(ribbonLines(ribbon([], 12), 10), { centre: [], warn: [], lines: [] });
});

test("the owner's three ribbons: on the 500 × 700 canvas, no bend too tight", () => {
  const rs = sketchRibbons();
  assert.deepEqual(rs.map(r => r.n), [12, 12, 14]);
  for (const [i, r] of rs.entries()) {
    const L = ribbonLines({ id: 'sketch' + i, ...r }, 10);
    assert.equal(L.warn.length, 0, `${ribbonName(i)} has a bend too tight`);
    joined(L.centre);
    for (const l of L.lines) for (const g of l.segs) {
      const pts = g.t === 'L' ? [g.a, g.b] : Array.from({ length: 33 }, (_, j) => P(g.c.x + g.r * Math.cos(g.a0 + g.s * j / 32), g.c.y + g.r * Math.sin(g.a0 + g.s * j / 32)));
      for (const q of pts) assert.ok(mm(q.x) > 0 && mm(q.x) < 500 && mm(q.y) > 0 && mm(q.y) < 700, `${ribbonName(i)} runs off the canvas at ${mm(q.x).toFixed(0)}, ${mm(q.y).toFixed(0)} mm`);
    }
  }
});
