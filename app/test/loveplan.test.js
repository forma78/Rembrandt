import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { layoutOf, sessionsOf, marksOf, dragOf, dragPaths, crossed, paintWalk, stripsOf, pitchOf } from '../src/loveplan.js';

// LOVE's plan, a copy of typeplan.js (its own tests there); here what LOVE
// adds: Result along the brush's own path (paintWalk).
const G = JSON.parse(fs.readFileSync(new URL('../glyphs.json', import.meta.url), 'utf8')).glyphs;
const o = { H: 160, band: 30, gap: -14, lead: 20 };
const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const lengthOf = pts => pts.reduce((a, q, j) => j ? a + dist(q.p, pts[j - 1].p) : 0, 0);
const COLOURS = [[245, 210, 26], [242, 138, 29], [226, 65, 42], [216, 36, 122], [107, 63, 160], [43, 79, 184], [22, 156, 156], [63, 163, 60]];
const plan = (text, brush = 12, pitch = 7) => {
  const L = layoutOf(G, { ...o, text }); sessionsOf(L, 'wet');
  marksOf(L, { paints: 8, per: 2, spacing: 90 }); dragOf(L, { brush, pitch, order: 'out' });
  return L;
};
const walkOf = (L, through = false, brush = 12, pitch = 7) => paintWalk(L, 0, through, { colours: COLOURS, run: 220, glaze: 0.8, brush, pitch });

test('Result along the path: DRAG\'s own path walked, its shades in the brush\'s order', () => {
  for (const through of [false, true]) {
    const L = plan('LOVE'), W = walkOf(L, through), paths = dragPaths(L, 0, through);
    const total = paths.reduce((a, d) => a + lengthOf(d.pts), 0);
    assert.ok(Math.abs(W.length - total) < 1e-6, `the walk ${W.length} mm, DRAG ${total} mm`);
    assert.ok(W.shades.length > 0);
    let last = 0;
    for (const sh of W.shades) {
      assert.ok(sh.at >= last - 1e-9 && sh.to >= sh.at && sh.to <= W.length + 1e-9, 'one after another, as the brush goes');
      assert.ok(sh.pts.length > 1 && sh.a > 0 && sh.a <= 1);
      last = sh.at;
    }
  }
});

test('the paint carried on round into the next lane, as DRAG runs non-stop', () => {
  const L = plan('I'), [I] = L.segs, P = I.spiral, W = walkOf(L);
  let mm = 0, change = null;
  for (let j = 1; j < P.length && change === null; j++) { mm += dist(P[j].p, P[j - 1].p); if (P[j].d !== P[0].d) change = mm; }
  assert.ok(change > 0, 'a second lane');
  assert.ok(W.shades.some(sh => sh.at < change - 1 && sh.to > change + 1), 'a shade goes on over the step into the second lane');
});

test('the first colour is the first mark\'s paint; the outermost strip out to the band\'s edge', () => {
  const L = plan('I'), [I] = L.segs, W = walkOf(L), first = I.spiral.findIndex((q, j) => j && crossed(I, I.spiral[j - 1].s, q.s).length);
  const m = crossed(I, I.spiral[first - 1].s, I.spiral[first].s)[0];
  assert.deepEqual(W.shades[0].rgb, COLOURS[m.paint].map(Math.round));
  const { inner, face } = stripsOf(12, 7), off = p => Math.min(...I.pts.map(q => dist(p, q)));
  const outer = W.shades.filter(sh => sh.w === face), rest = W.shades.filter(sh => sh.w !== face);
  assert.ok(outer.length && rest.length && rest.every(sh => Math.abs(sh.w - inner) < 1e-9));
  for (const sh of outer) for (const p of sh.pts.slice(1)) assert.ok(Math.abs(off(p) + face / 2 - L.R) < 0.8, `the colour to ${off(p) + face / 2}, the band ${L.R}`);
});

test('a dot takes up its paint at every ring; a closed band its two edges', () => {
  const L = plan('!O', 6, pitchOf(48, 6, 5)), W = walkOf(L, false, 6, pitchOf(48, 6, 5));
  const dot = L.segs.find(s => s.dot), O = L.segs.find(s => s.closed);
  assert.ok(W.shades.some(sh => sh.pts.every(p => dist(p, dot.pts[0]) <= L.R + 1)), 'the dot painted');
  const { face } = stripsOf(6, pitchOf(48, 6, 5)), off = p => Math.min(...O.pts.map(q => dist(p, q)));
  const c = O.pts.reduce((a, p) => [a[0] + p[0] / O.pts.length, a[1] + p[1] / O.pts.length], [0, 0]), rc = O.pts.reduce((a, p) => a + dist(p, c), 0) / O.pts.length;
  const edges = W.shades.filter(sh => sh.w === face && sh.pts.every(p => off(p) < L.R + 1)).flatMap(sh => sh.pts.slice(1)).filter(p => Math.abs(off(p) + face / 2 - L.R) < 0.8);
  assert.ok(edges.some(p => dist(p, c) > rc) && edges.some(p => dist(p, c) < rc), 'the O to its outer edge and to its hole\'s');
});
