import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { layoutOf, sessionsOf, marksOf, dragOf, dragPaths, dragRows, crossed, paintWalk, stripsOf, pitchOf, trainsOf, RAIL_TOL } from '../src/loveplan.js';
import { plotRun, DEFAULTS } from '../src/strokes.js';

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

// Zeros laid rows on rows (the owner's, TYPE-Claude/Screenshot 2026-10-07 at
// 1.50.09 AM.png and 2.16.21 AM.png): the letter gap and the line spacing that
// put the first 0's outer lane on the next one's `across`-th, and the upper
// row's on the lower's `down`-th.
const box = P => P.reduce((b, q) => [Math.min(b[0], q.p[0]), Math.min(b[1], q.p[1]), Math.max(b[2], q.p[0]), Math.max(b[3], q.p[1])], [Infinity, Infinity, -Infinity, -Infinity]);
function zeros(text, rings, across, down) {
  const H = 300, band = 30, brush = 12, pitch = pitchOf(band / 100 * H, brush, rings), o = { text, H, band, gap: -40, lead: -40 };
  const make = () => { const L = layoutOf(G, o); sessionsOf(L, 'wet'); marksOf(L, { paints: 8, per: 2, spacing: 90 }); dragOf(L, { brush, pitch, order: 'out' }); return L; };
  const outer = s => [...s.rings].sort((x, y) => (box(y.ring)[2] - box(y.ring)[0]) - (box(x.ring)[2] - box(x.ring)[0]));
  for (let it = 0; it < 3; it++) {
    const L = make(), A = outer(L.segs[0]), B = outer(L.segs[1]), mid = (box(A[0].ring)[1] + box(A[0].ring)[3]) / 2;
    const x = (r, side) => { const n = r.ring.filter(q => Math.abs(q.p[1] - mid) < 2).map(q => q.p[0]); return side > 0 ? Math.max(...n) : Math.min(...n); };
    o.gap -= x(B[across - 1], -1) - x(A[0], 1);
    if (text.includes('\n')) { const C = outer(L.segs[text.indexOf('\n')]); o.lead -= box(C[down - 1].ring)[1] - box(A[0].ring)[3]; }
  }
  return { L: make(), pitch, brush };
}
const steps = pts => pts.slice(1).map((q, j) => dist(q.p, pts[j].p));

test('Rails: two zeros rows on rows — a switch a row, each an 8 round both, no step across the lanes', () => {
  const { L, pitch } = zeros('00', 5, 3), T = trainsOf(L, 0), lanes = L.segs.reduce((a, s) => a + s.rings.length, 0);
  assert.equal(T.rails.length, lanes, 'every lane a rail');
  assert.equal(T.switches.length, 3, 'the three rows that lie on one another');
  assert.equal(T.trains.length, lanes - 3, 'each switch joins two rails into one train');
  for (const tr of T.trains) {
    assert.ok(Math.max(...steps(tr.pts)) < RAIL_TOL * pitch + 1.5, `${tr.ch}: a step of ${Math.max(...steps(tr.pts))} mm — no jump across the lanes`);
    if (tr.switches) assert.equal(new Set(tr.pts.map(q => q.band)).size, 2, 'an 8 round both zeros');
  }
});

test('Rails: six zeros of 7 lanes, 5 rows on 5 across and 7 down — one train, the brush down once', () => {
  const { L, pitch } = zeros('000\n000', 4, 5, 7), T = trainsOf(L, 0);
  assert.equal(T.trains.length, 1, `${T.trains.length} trains`);
  assert.equal(T.trains[0].lanes, 42);
  assert.ok(Math.max(...steps(T.trains[0].pts)) < RAIL_TOL * pitch + 1.5);
  const R = dragRows(L, 0, 'rails'), r = plotRun({ ...DEFAULTS, snake: true, pause: false, lift: false, tail: 3, speed: 60, travel: 180, ink: false, rows: R.ps.length, here: { x: 350, y: 300 }, cup: { x: 400, y: 0 } }, [{ key: 'DRAG', ps: R.ps, why: null }]);
  assert.equal(r.fault, '');
  assert.equal(r.blocks.filter(b => b.kind === 'move' && b.paintMM > 0).length, 1, 'the brush down once');
  const W = paintWalk(L, 0, 'rails', { colours: COLOURS, run: 220, glaze: 0.8, brush: 12, pitch });
  assert.ok(Math.abs(W.length - R.length) < 1e-6 * R.length + 1e-6, 'Result walks the train');
});

test('Rails: a letter that touches nothing — every lane a train of its own, round once', () => {
  const L = plan('I'), [I] = L.segs, T = trainsOf(L, 0);
  assert.equal(T.switches.length, 0);
  assert.equal(T.trains.length, I.rings.length);
  for (const tr of T.trains) { const r = I.rings.find(l => l.d === tr.pts[0].d).ring; assert.ok(Math.abs(lengthOf(tr.pts) - lengthOf([...r, r[0]])) < 16, 'round once, on 14 mm past the landing'); }
});

test('Rails: each next train lands nearest to where the last lifted, just before a mark; none left out', () => {
  const L = plan('O O\nO O'), T = trainsOf(L, 0), lanes = L.segs.reduce((a, s) => a + s.rings.length, 0);
  assert.equal(T.trains.length, lanes, 'the O\'s apart: every lane a train');
  for (const tr of T.trains) {                                                       // paint at once: a mark crossed within a few mm of the landing
    let mm = 0, hit = false;
    for (let j = 1; j < tr.pts.length && !hit && mm < 6; j++) { const a = tr.pts[j - 1], b = tr.pts[j]; mm += dist(a.p, b.p); hit = a.band === b.band && crossed(a.band, a.s, b.s).length > 0; }
    assert.ok(hit, 'a mark within 6 mm of the landing');
  }
  const hops = T.trains.slice(1).map((tr, j) => dist(T.trains[j].pts.at(-1).p, tr.pts[0].p));
  const byO = T.trains.map(tr => L.segs.indexOf(tr.pts[0].band));
  assert.ok(byO.every((o, j) => !j || o === byO[j - 1] || byO.slice(0, j).filter(x => x === byO[j - 1]).length === L.segs[byO[j - 1]].rings.length), 'an O\'s rings one after another, then the next O');
  assert.ok(Math.max(...hops.filter((_, j) => byO[j] === byO[j + 1])) < 3 * L.pitch, 'ring to ring a step, not across the canvas');
});
