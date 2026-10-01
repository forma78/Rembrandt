import test from 'node:test';
import assert from 'node:assert/strict';
import { PT_MM } from '../src/config.js';
import { P, dist, rad, wrapA } from '../src/util.js';
import { segStart, segEnd, segLen, segDirStart, segDirEnd } from '../src/geometry.js';
import { segNumbers, setSegNumbers, scaleCurve, curveInfo, nearestSeg, buildCurve } from '../src/curve.js';

const pt = mm => mm / PT_MM;
const angle = d => Math.atan2(d.y, d.x);
// every joint connected and, where it was smooth, still smooth
function joined(segs) {
  for (let i = 1; i < segs.length; i++) {
    assert.ok(dist(segEnd(segs[i - 1]), segStart(segs[i])) < 1e-6, `joint ${i} is open`);
  }
}
function smooth(segs) {
  for (let i = 1; i < segs.length; i++) {
    assert.ok(Math.abs(wrapA(angle(segDirEnd(segs[i - 1])) - angle(segDirStart(segs[i])))) < 1e-9, `kink at joint ${i}`);
  }
}
// IMG_9422's curve, as create.js opens it
const sheet = () => buildCurve(P(0, pt(415)), 42, [['L', pt(241.2)], ['T', pt(247.8), 63], ['L', pt(144.3)]]);

test('the default curve crosses the image area: in at the left edge, out at the right', () => {
  const s = sheet(), a = segStart(s[0]), b = segEnd(s[s.length - 1]);
  joined(s); smooth(s);
  assert.ok(Math.abs(a.x) < 1e-9 && Math.abs(a.y * PT_MM - 415) < 1e-6);
  assert.ok(Math.abs(b.x * PT_MM - 568.5) < 1, `ends at ${b.x * PT_MM} mm across`);
  assert.ok(Math.abs(b.y * PT_MM - 572) < 1, `ends ${b.y * PT_MM} mm down`);
  const low = Math.max(...s.flatMap(g => [segStart(g).y, segEnd(g).y, g.t === 'A' ? g.c.y + g.r : -Infinity]));
  assert.ok(Math.abs(low * PT_MM - 640) < 1, `the dip at ${low * PT_MM} mm`);
});

test('a line typed longer: the rest of the curve moves along, its shape kept', () => {
  const s = sheet(), t = setSegNumbers(s, 0, { length: pt(300) });
  joined(t); smooth(t);
  assert.ok(Math.abs(segLen(t[0]) - pt(300)) < 1e-6);
  for (let i = 1; i < s.length; i++) assert.ok(Math.abs(segLen(t[i]) - segLen(s[i])) < 1e-6);
  assert.equal(segNumbers(t[1]).sweep.toFixed(6), segNumbers(s[1]).sweep.toFixed(6));
  assert.ok(s[0].b.x !== t[0].b.x, 'the list given is not changed');
});

test('a line turned: the segments after it turn as much, the joint after it stays smooth', () => {
  const s = sheet(), t = setSegNumbers(s, 0, { angle: 300 });   // 60° down to the right
  joined(t);
  assert.ok(Math.abs(segNumbers(t[0]).angle - 300) < 1e-9);
  assert.ok(Math.abs(wrapA(angle(segDirEnd(t[0])) - angle(segDirStart(t[1])))) < 1e-9);
  assert.ok(Math.abs(wrapA((angle(segDirEnd(t[2])) - angle(segDirEnd(s[2]))) - rad(18))) < 1e-9, 'the last line turned 18° too');
});

test('an arc typed: it stays tangent to the line before it, the curve stays smooth', () => {
  const s = sheet();
  for (const nums of [{ radius: pt(500) }, { sweep: 90 }, { side: 'right' }]) {
    const t = setSegNumbers(s, 1, nums); joined(t); smooth(t);
  }
  const t = setSegNumbers(s, 1, { radius: pt(500), sweep: 30 });
  assert.ok(Math.abs(t[1].r - pt(500)) < 1e-6 && Math.abs(segNumbers(t[1]).sweep - 30) < 1e-9 && segNumbers(t[1]).side === 'left');
});

test('a new length scales the whole curve about its start', () => {
  const s = sheet(), L = curveInfo(s).length, t = scaleCurve(s, 1.5);
  joined(t); smooth(t);
  assert.ok(Math.abs(curveInfo(t).length - 1.5 * L) < 1e-6);
  assert.ok(dist(segStart(t[0]), segStart(s[0])) < 1e-9);
  assert.equal(segNumbers(t[1]).sweep.toFixed(6), segNumbers(s[1]).sweep.toFixed(6));
  assert.deepEqual(curveInfo(t), { lines: 2, arcs: 1, length: curveInfo(t).length });
});

test('a click finds the segment under it', () => {
  const s = sheet(), mid = g => { const a = segStart(g), b = segEnd(g); return P((a.x + b.x) / 2, (a.y + b.y) / 2); };
  assert.equal(nearestSeg(s, mid(s[0]), pt(3)), 0);
  assert.equal(nearestSeg(s, mid(s[2]), pt(3)), 2);
  assert.equal(nearestSeg(s, P(pt(500), pt(100)), pt(3)), null);
});
