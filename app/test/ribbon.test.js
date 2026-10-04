import test from 'node:test';
import assert from 'node:assert/strict';
import { PT_MM } from '../src/config.js';
import { P, dist } from '../src/util.js';
import { segStart, segEnd, segDirStart, segDirEnd } from '../src/geometry.js';
import { buildCurve } from '../src/curve.js';
import { plotRun, pieceLen, DEFAULTS } from '../src/strokes.js';
import { ribbonLines, lineOffset, widthLabel, clampLines, ribbonWidth, linesLength, ribbonName, sketchRibbons, wavedSegs,
  toMachine, toPieces, ribbonPasses, MAX_LINES } from '../src/ribbon.js';

const pt = mm => mm / PT_MM;
const mm = v => v * PT_MM;
let id = 0;
const ribbon = segs => ({ id: 'r' + ++id, segs });
function joined(segs) {
  for (let i = 1; i < segs.length; i++) assert.ok(dist(segEnd(segs[i - 1]), segStart(segs[i])) < 1e-6, `joint ${i} is open`);
}
const close = (a, b, e = 1e-6) => Math.abs(a - b) < e;

test('the width is a count of lines, and the readout says both', () => {
  assert.equal(widthLabel(12), '96 mm · 12 lines');
  assert.equal(widthLabel(1), '8 mm · 1 line');
  assert.equal(widthLabel(12, 5), '63 mm · 12 lines');
  assert.equal(ribbonWidth(12), 96);
  assert.equal(clampLines(0), 1);
  assert.equal(clampLines(12.4), 12);
  assert.equal(clampLines(999), MAX_LINES);
  assert.deepEqual([0, 1, 2].map(ribbonName), ['N1', 'N2', 'N3']);
});

test('a straight ribbon: N parallel lines a pitch apart, symmetric about the centre', () => {
  const L = ribbonLines(ribbon([{ t: 'L', a: P(pt(-200), pt(-100)), b: P(pt(200), pt(-100)) }]), { n: 12 });
  assert.equal(L.lines.length, 12);
  assert.deepEqual(L.lines.map(l => l.off), [-44, -36, -28, -20, -12, -4, 4, 12, 20, 28, 36, 44]);
  for (const l of L.lines) {
    const g = l.segs[0];
    assert.ok(close(mm(g.a.y), -100 + l.off), `line ${l.k} at ${mm(g.a.y)} mm`);   // + is to the right of travel: down, going right
    assert.ok(close(mm(g.b.x - g.a.x), 400), 'as long as the centre');
  }
  assert.equal(L.warn.length, 0);
  assert.ok(close(linesLength(L), 12 * 400));
  assert.deepEqual(ribbonLines(ribbon(L.centre), { n: 3, pitch: 5 }).lines.map(l => l.off), [-5, 0, 5]);
});

test('an odd count puts the middle line on the centre', () => {
  assert.equal(lineOffset(6, 13), 0);
  assert.equal(lineOffset(0, 13), -48);
  assert.equal(lineOffset(12, 13), 48);
});

test('a kink is rounded for the whole width: the inner line keeps the inner radius, nothing folds', () => {
  const segs = [{ t: 'L', a: P(pt(-200), pt(-200)), b: P(pt(50), pt(-200)) }, { t: 'L', a: P(pt(50), pt(-200)), b: P(pt(50), pt(100)) }];
  const L = ribbonLines(ribbon(segs), { n: 12, cornerR: 10 });
  assert.equal(L.warn.length, 0);
  const R = L.centre.find(g => g.t === 'A');
  assert.ok(R && close(mm(R.r), 48 + 10), 'the centre turns on W/2 + the inner radius');
  const inner = L.lines.find(l => l.off === 44).segs.find(g => g.t === 'A');   // a right turn: the inner side is the right
  assert.ok(inner && close(mm(inner.r), 14), `the inner line turns on ${inner && mm(inner.r)} mm`);
  for (const l of L.lines) joined(l.segs);
});

test('an arc drawn tighter than half the ribbon is marked', () => {
  const segs = buildCurve(P(0, 0), 0, [['L', pt(100)], ['R', pt(30), 180], ['L', pt(100)]]);
  assert.equal(ribbonLines(ribbon(segs), { n: 4 }).warn.length, 0, '32 mm wide: a 30 mm arc is enough');
  assert.ok(ribbonLines(ribbon(segs), { n: 12 }).warn.length > 0, '96 mm wide: a 30 mm arc is too tight');
});

test('the wave: its ends stay, the tangent continuous, the lines still a pitch apart', () => {
  const base = [{ t: 'L', a: P(0, 0), b: P(pt(400), 0) }], w = wavedSegs(base, 4);
  joined(w);
  assert.ok(dist(segStart(w[0]), base[0].a) < 1e-6 && dist(segEnd(w.at(-1)), base[0].b) < 1e-6, 'the ends where they were');
  for (let i = 1; i < w.length; i++) {
    const a = segDirEnd(w[i - 1]), b = segDirStart(w[i]);
    assert.ok(Math.hypot(a.x - b.x, a.y - b.y) < 1e-3, `a kink at joint ${i}`);
  }
  const ys = w.flatMap(g => [segStart(g).y, segEnd(g).y]).map(mm);
  assert.ok(Math.max(...ys) > 3.5 && Math.min(...ys) < -3.5, 'about 4 mm either side');
  const L = ribbonLines(ribbon(base), { n: 3, wave: 4 });
  assert.equal(L.warn.length, 0);
  const c0 = segStart(L.centre[0]);   // the wave tilts the start: a pitch along its normal
  assert.ok(close(mm(dist(segStart(L.lines[0].segs[0]), c0)), 8) && close(mm(dist(segStart(L.lines[2].segs[0]), c0)), 8), 'the outer lines a pitch off');
  const tight = ribbonLines(ribbon(base), { n: 12, wave: 30 }).warn;
  assert.ok(tight.length > 0, '30 mm waves bend tighter than 96 mm of lines can follow');
  for (const a of tight) for (const b of tight) assert.ok(a === b || mm(dist(a, b)) >= 20, 'one mark a place');
});

test('on the machine: X up, Y to the right of the canvas centre; arcs turn the same way', () => {
  assert.deepEqual(toMachine(P(pt(10), pt(-20))), { x: 20, y: 10 });
  // a right turn on the screen, going right then down: on the machine Y+ then X−, clockwise from +X to +Y
  const segs = buildCurve(P(0, 0), 0, [['L', pt(50)], ['R', pt(40), 90], ['L', pt(50)]]), ps = toPieces(segs);
  assert.equal(ps.length, 3);
  assert.equal(ps[1].d, 1);
  for (let i = 1; i < ps.length; i++) assert.ok(Math.hypot(ps[i].a.x - ps[i - 1].b.x, ps[i].a.y - ps[i - 1].b.y) < 1e-9);
  assert.ok(close(ps[2].b.x, -90) && close(ps[2].b.y, 90), `ends at X ${ps[2].b.x} · Y ${ps[2].b.y}`);
});

test('the Paint run: a ribbon is one snake, a turn in the air between lines', () => {
  const r = ribbon(buildCurve(P(pt(-150), 0), 0, [['L', pt(300)]]));
  const { passes, rows } = ribbonPasses([r, r], { n: 4 });
  assert.equal(passes.length, 2);
  assert.equal(rows.length, 8);
  assert.deepEqual(rows[5], { ribbon: 1, name: 'N2', line: 2, of: 4 });
  assert.match(passes[1].why, /N2.*CONTINUE when N1 is dry/);
  const path = passes[0].ps[0];
  assert.equal(passes[0].ps.length, 1);
  for (let i = 1; i < path.length; i++) assert.ok(Math.hypot(path[i].a.x - path[i - 1].b.x, path[i].a.y - path[i - 1].b.y) < 1e-6, `the snake breaks at ${i}`);
  assert.equal(path.filter(g => g.turn).length, 3);
  for (const g of path.filter(g => g.turn)) assert.ok(close(g.r, 4), 'a half circle a pitch across');
  const run = plotRun({ ...DEFAULTS, snake: true, pause: false, lift: true }, passes);
  assert.equal(run.turns, 6);
  assert.ok(close(run.length, 8 * 300, 1e-3), `${run.length} mm painted`);
  assert.equal(run.blocks.filter(b => b.kind === 'pause').length, 1);
  assert.ok(run.blocks.every(b => !(b.cmds || []).some(c => /NaN|undefined/.test(c))));
});

test('the Watercolour run: every line on its own, one way, a dip before each', () => {
  const r = ribbon(buildCurve(P(pt(-150), 0), 0, [['L', pt(300)]]));
  const { passes } = ribbonPasses([r], { n: 4, ink: true });
  assert.equal(passes[0].ps.length, 4);
  for (const p of passes[0].ps) assert.ok(p[0].a.y < p.at(-1).b.y, 'each the same way, from the first anchor');
  const cup = { x: 390, y: -0.4, rim: 34, dip: -3, dwell: 1, diameter: 50, est: {} };
  const run = plotRun({ ...DEFAULTS, ink: true, snake: true, pause: false, here: { x: 400, y: 280 }, cup }, passes);
  assert.equal(run.dips, 4);
  assert.ok(close(pieceLen(passes[0].ps[0][0]), 300));
});

test("the owner's three ribbons: on the 500 × 700 canvas, no bend too tight", () => {
  const rs = sketchRibbons();
  assert.equal(rs.length, 3);
  for (const [i, r] of rs.entries()) {
    const L = ribbonLines({ id: 'sketch' + i, ...r }, { n: 12 });
    assert.equal(L.warn.length, 0, `${ribbonName(i)} has a bend too tight`);
    joined(L.centre);
    for (const l of L.lines) for (const g of l.segs) {
      const pts = g.t === 'L' ? [g.a, g.b] : Array.from({ length: 33 }, (_, j) => P(g.c.x + g.r * Math.cos(g.a0 + g.s * j / 32), g.c.y + g.r * Math.sin(g.a0 + g.s * j / 32)));
      for (const q of pts) assert.ok(Math.abs(mm(q.x)) < 250 && Math.abs(mm(q.y)) < 350, `${ribbonName(i)} runs off the canvas at ${mm(q.x).toFixed(0)}, ${mm(q.y).toFixed(0)} mm`);
    }
  }
});

test('no centre, no lines', () => {
  assert.deepEqual(ribbonLines(ribbon([]), { n: 12 }), { centre: [], warn: [], lines: [] });
});
