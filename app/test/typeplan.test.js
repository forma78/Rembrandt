import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { layoutOf, fitHeight, sessionsOf, outlinesOf, traceOf, traceRows, cleanText, marksOf, markPaths, ticksOf, lanesOf, dragOf, crossed, DRAG_ON, JOG, marksRows, dragRows, MARKS_DIP } from '../src/typeplan.js';
import { offPiece, toMachine, washOf, lengthOf, LOOP_SHARE, DIP_RUN, FIT_MM, NO_DIP } from '../src/band.js';
import { plotRun, DEFAULTS, pieceLen } from '../src/strokes.js';

const G = JSON.parse(fs.readFileSync(new URL('../glyphs.json', import.meta.url), 'utf8')).glyphs;
const o = { text: 'AM\nOUR', H: 160, band: 30, gap: -14, lead: 20 };
const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const area = P => P.reduce((a, p, i) => { const q = P[(i + 1) % P.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
const boxOf = L => L.segs.reduce((b, s) => s.pts.reduce((c, p) => [Math.min(c[0], p[0] - L.R), Math.min(c[1], p[1] - L.R), Math.max(c[2], p[0] + L.R), Math.max(c[3], p[1] + L.R)], b), [Infinity, Infinity, -Infinity, -Infinity]);

test('the text: upper case, only the letters there are, a line a line', () => {
  assert.deepEqual(cleanText('am\nour', G), ['AM', 'OUR']);
  assert.deepEqual(cleanText('a~b\n\nc', G), ['AB', 'C']);
});

test('the bands: a stroke split at its sharp corners, O closed, the dot of ! a disc', () => {
  const at = text => layoutOf(G, { ...o, text }).segs;
  assert.equal(at('I').length, 1);
  assert.equal(at('V').length, 2);                       // one stroke, its corner at the bottom
  assert.equal(at('L').length, 2);
  const O = at('O');
  assert.equal(O.length, 1); assert.ok(O[0].closed);
  const bang = at('!');
  assert.equal(bang.length, 2); assert.ok(bang[1].dot);
  assert.equal(layoutOf(G, o).letters, 5);
});

test('the block: the letters H tall, the lines lead apart, centred on x, y', () => {
  for (const [x, y] of [[0, 0], [30, -45]]) {
    const L = layoutOf(G, { ...o, x, y }), b = boxOf(L);
    assert.ok(Math.abs(b[3] - b[1] - (2 * o.H + o.lead)) < 0.6, `the block ${b[3] - b[1]} tall`);
    assert.ok(Math.abs((b[1] + b[3]) / 2 - y) < 0.6, 'centred up and down');
    assert.ok(Math.abs((b[0] + b[2]) / 2 - x) < 0.25 * o.H, 'about centred across');   // the widest line centred, its glyphs' sides not quite even
  }
});

test('Fit to canvas: the tallest letters inside the margin', () => {
  const H = fitHeight(G, o, 500, 700, 40), b = boxOf(layoutOf(G, { ...o, H })), b2 = boxOf(layoutOf(G, { ...o, H: H + 1 }));
  assert.ok(b[0] >= -250 + 40 - 1 && b[2] <= 250 - 40 + 1 && b[1] >= -350 + 40 - 1 && b[3] <= 350 - 40 + 1, `${b}`);
  assert.ok(b2[0] < -250 + 40 + 0.5 || b2[2] > 250 - 40 - 0.5, 'a mm taller is too wide');
});

test('an outline: every point the band\'s half width from its centre line, a closed band two loops', () => {
  const L = layoutOf(G, { ...o, text: 'IO' });
  const [I, O] = L.segs;
  for (const p of outlinesOf(I, L.R)[0].pts) {
    const d = Math.min(...I.pts.map(q => dist(p, q)));
    assert.ok(Math.abs(d - L.R) < 0.6, `${d} from the stem`);
  }
  const loops = outlinesOf(O, L.R);
  assert.deepEqual(loops.map(l => l.part), ['outside', 'inside']);
  assert.ok(Math.abs(area(loops[0].pts)) > Math.abs(area(loops[1].pts)));
});

test('the trace: every outline clockwise, a letter\'s first from its top, the next from nearest the last end, on 60 % over its start', () => {
  const L = layoutOf(G, o), T = traceOf(L);
  assert.equal(T.length, 13);                            // 12 bands, the O two loops
  let li = -1, end = null;
  for (const t of T) {
    const once = [];
    let s = 0;
    for (let j = 0; j < t.pts.length && s <= t.C + 1e-6; j++) { once.push(t.pts[j]); if (j) s += dist(t.pts[j], t.pts[j - 1]); }
    assert.ok(area(once) > 0, `${t.ch} ${t.part} clockwise on the canvas`);
    assert.ok(Math.abs(t.lap - LOOP_SHARE * t.C) < 1e-6, 'the lap');
    assert.ok(Math.abs(lengthOf(t.pts) - t.C - t.lap) < 1e-6, 'round once, and the lap');
    if (t.li !== li) assert.ok(Math.abs(t.pts[0][1] - Math.min(...once.map(p => p[1]))) < 1e-9, `${t.ch} lands at its top`);
    else {
      const best = Math.min(...once.map(p => dist(p, end)));
      assert.ok(dist(t.pts[0], end) <= best + 1e-9, `${t.ch} from the point nearest the last end`);
    }
    li = t.li; end = t.pts.at(-1);
  }
});

test('the rows: each outline in lines and arcs within FIT_MM, the lap its lift-off; a dip run never splits one', () => {
  const T = traceOf(layoutOf(G, { ...o, text: 'AMOUR', H: 90 })), R = traceRows(T, true);
  assert.equal(R.ps.length, T.length);
  R.ps.forEach((ps, i) => {
    for (const p of T[i].pts.filter((_, j) => j % 7 === 0)) assert.ok(Math.min(...ps.map(g => offPiece(g, toMachine(p)))) <= FIT_MM + 1e-6);
    assert.ok(ps.every(g => g.tailOut === T[i].lap && g.row === i + 1));
  });
  let run = 0;
  R.ps.forEach(ps => {
    const L = ps.reduce((a, g) => a + pieceLen(g), 0);
    if (ps[0].nodip) { run += L; assert.ok(run <= DIP_RUN + 1e-6, 'within one dip run'); } else run = L;
  });
  assert.ok(R.ps.some(ps => ps[0].nodip), 'small outlines share a dip');
  assert.ok(traceRows(T, false).ps.every(ps => !ps[0].nodip));
});

test('sessions: wet on wet one, dry between letters more where letters overlap, dry every overlap no fewer', () => {
  const L = layoutOf(G, o);
  assert.equal(sessionsOf(L, 'wet'), 1);
  const letters = sessionsOf(L, 'letters');
  assert.ok(letters >= 2, `${letters}`);
  assert.ok(sessionsOf(L, 'all') >= letters);
  assert.equal(sessionsOf(layoutOf(G, { ...o, text: 'I I', gap: 40 }), 'all'), 1);
});

test('TRACE on the machine: no fault, a dip before a row that does not share one, the wash a stroke a row', () => {
  const T = traceOf(layoutOf(G, o)), R = traceRows(T, true);
  const r = plotRun({ ...DEFAULTS, ink: true, snake: true, pause: false, lift: false, tail: 3, speed: 150, travel: 180, rows: R.ps.length, here: { x: 350, y: 300 },
    cup: { x: 400, y: 0, rim: 35, dip: 5, dwell: 1 }, noDipUnder: NO_DIP }, [{ key: 'TRACE', ps: R.ps, why: null }]);
  assert.equal(r.fault, '');
  assert.equal(r.dips, R.ps.filter(ps => !ps[0].nodip).length);
  const w = washOf(r.preview, [], [], 4);
  assert.equal(w.filter(s => s.dip).length, r.dips);
  assert.ok(w.every(s => s.pts.every(q => q.load > 0 && q.load <= 1)));
});

const paintPlan = (over = {}, per = 2, P = 8) => { const L = layoutOf(G, o); marksOf(L, { paints: P, per, spacing: 90, over }); dragOf(L, { brush: 12, pitch: 7, order: 'out' }); return L; };

test('the marks: one or more on every band, a letter its own paints, a click steps a band\'s', () => {
  const L = paintPlan();
  for (const s of L.segs) {
    assert.ok(s.marks.length >= 1);
    for (const m of s.marks) assert.ok(m.paint >= 0 && m.paint < 8 && m.s >= 0 && m.s <= s.L + 1e-9);
  }
  const one = paintPlan({}, 1);
  for (const s of one.segs) assert.ok(s.marks.every(m => m.paint === s.li % 8), `${s.ch}: a letter one paint`);
  const before = paintPlan().segs[3].marks[0].paint, s3 = paintPlan().segs[3];
  assert.equal(paintPlan({ [`${s3.li}:${s3.si}`]: 1 }).segs[3].marks[0].paint, (before + 1) % 8);
});

test('a mark\'s ticks: the paint\'s number as on an abacus — a long one five, a short one one — a line and a line\'s white apart', () => {
  assert.deepEqual(ticksOf(0), [false]);
  assert.deepEqual(ticksOf(3), [false, false, false, false]);
  assert.deepEqual(ticksOf(4), [true]);
  assert.deepEqual(ticksOf(7), [true, false, false, false]);       // paint 8: a long and three short
  assert.deepEqual(ticksOf(9), [true, true]);
  const L = paintPlan(), s = L.segs[0], ps = markPaths(s, L.R, 4);
  const marks = ps.filter(q => !q.tick), ticks = ps.filter(q => q.tick);
  assert.equal(marks.length, s.marks.length);
  assert.equal(ticks.length, s.marks.reduce((a, m) => a + ticksOf(m.paint).length, 0));
  for (const t of ticks) assert.ok(Math.abs(dist(t.pts[0], t.pts[1]) - (t.long ? 24 : 12)) < 1e-6, 'a long tick twice a short one');
  const t = ticks.filter(q => q.paint === s.marks[0].paint).slice(0, 2);
  if (t.length === 2) assert.ok(Math.abs(dist(t[0].pts[0], t[1].pts[0]) - 8) < 1e-6 || t[0].long !== t[1].long, 'ticks 2 × the line apart');
  const narrow = { ...s, marks: [{ ...s.marks[0], paint: 3 }] };
  assert.ok(markPaths(narrow, 8, 4).some(q => q.tick && !q.fits), 'four ticks do not fit a 10 mm mark');
  assert.ok(markPaths({ ...s, marks: [{ ...s.marks[0], paint: 7 }] }, L.R, 4).every(q => !q.tick || q.fits), 'paint 8 fits a 45 mm mark now');
});

test('the lanes: the outermost the brush\'s half width inside the band, a pitch apart, inside first reversed', () => {
  const L = layoutOf(G, { ...o, text: 'IO' }), [I, O] = L.segs, Rc = L.W / 2 - 6;
  const out = lanesOf(I, L.W, { brush: 12, pitch: 7, order: 'out' }), inn = lanesOf(I, L.W, { brush: 12, pitch: 7, order: 'in' });
  assert.ok(Math.abs(out[0].d - Rc) < 1e-9 && Math.abs(out.at(-1).d) < 1e-9);
  assert.deepEqual(inn.map(l => l.d), out.map(l => l.d).reverse());
  const ring = lanesOf(O, L.W, { brush: 12, pitch: 7, order: 'out' });
  assert.ok(ring.some(l => l.d > 0) && ring.some(l => l.d < 0), 'a closed band: lanes either side of its centre line');
});

test('the drag: every lane lands just before its band\'s first mark and runs on past its own start', () => {
  const L = paintPlan();
  for (const s of L.segs) for (const l of s.lanes) {
    const P = l.path;
    if (!s.dot && !s.closed) assert.ok(P[0].s >= Math.max(0, s.marks[0].s - 4) - 1e-9);
    let on = 0, i = P.length - 1;
    while (i > 0 && dist(P[i].p, P[0].p) > 1e-9) { on += dist(P[i].p, P[i - 1].p); i--; }
    assert.ok(i > 0 && on >= DRAG_ON - 2 && on <= DRAG_ON + 2, `${s.ch}: ${on} mm past its start`);
  }
});

test('crossed: the marks between two places along a band, round a closed band\'s seam too', () => {
  const L = paintPlan(), O = L.segs.find(s => s.closed), m = O.marks[0];
  assert.deepEqual(crossed(O, m.s - 1, m.s + 1), [m]);
  assert.equal(crossed(O, m.s + 1, m.s + 2).length, 0);
  const last = O.marks.at(-1);
  assert.ok(crossed(O, O.L - 1, 1).length === (O.marks.some(q => q.s > O.L - 1 || q.s <= 1) ? 1 : 0));
  assert.ok(crossed(O, last.s - 0.5, last.s + 0.5).includes(last));
});

test('the trace and the colour meet at the band\'s edge: the line inset half its width, the outermost lane\'s strip out to the edge', () => {
  const L = layoutOf(G, { ...o, text: 'IO' }), [I, O] = L.segs, w = 6;
  const T = traceOf(L, LOOP_SHARE, w / 2);
  const off = (seg, p) => Math.min(...seg.pts.map(q => dist(p, q)));
  for (const p of T[0].pts.filter((_, j) => j % 5 === 0)) assert.ok(Math.abs(off(I, p) + w / 2 - L.R) < 0.6, 'the stem\'s line, its outer edge on the band\'s');
  marksOf(L, { paints: 8, per: 2, spacing: 90 }); dragOf(L, { brush: 12, pitch: 7, order: 'out' });
  for (const seg of [I, O]) {
    const outer = seg.lanes.filter(l => l.face);
    assert.ok(outer.length >= 1 && outer.length <= 2, 'an open band one outermost lane, a closed one two');
    for (const l of outer) {
      assert.ok(Math.abs(l.w - (6 + 3.5 * 0.94 * 2 / 2)) < 1e-9, 'half the brush and half the inner strip');
      const p = l.face[3].p, edge = Math.abs(off(seg, p)) + l.w / 2;
      assert.ok(Math.abs(edge - L.R) < 0.6, `${seg.ch}: the colour to ${edge}, the band ${L.R}`);
    }
    for (const l of seg.lanes.filter(l => !l.face)) assert.ok(Math.abs(l.w - 7 * 0.94) < 1e-9);
  }
  const marks = markPaths(I, L.R, w).filter(m => !m.tick);
  for (const m of marks) assert.ok(Math.abs(dist(m.pts[0], m.pts[1]) / 2 + w / 2 - (L.R - w / 2)) < 1e-6, 'a mark\'s round end at the trace\'s inner edge');
});

const RUN = { ...DEFAULTS, snake: true, pause: false, lift: false, tail: 3, speed: 150, travel: 180, here: { x: 350, y: 300 }, cup: { x: 400, y: 0, rim: 35, dip: 5, dwell: 1 } };
test('MARKS on the machine: a stroke a mark and a tick, a session at a time, a dip every four marks', () => {
  const L = paintPlan(), ses = sessionsOf(L, 'letters');
  let all = 0;
  for (let k = 0; k < ses; k++) {
    const R = marksRows(L, k, 4, true), segs = L.segs.filter(s => s.session === k);
    assert.equal(R.marks, segs.reduce((a, s) => a + s.marks.length, 0));
    assert.equal(R.ps.length, segs.reduce((a, s) => a + markPaths(s, L.R, 4).length, 0));
    assert.ok(R.ps.every(p => p.length === 1 && p[0].t === 'L'));
    const r = plotRun({ ...RUN, ink: true, rows: R.ps.length, noDipUnder: 0 }, [{ key: 'MARKS', ps: R.ps, why: null }]);
    assert.equal(r.fault, '');
    assert.equal(r.dips, Math.ceil(R.marks / MARKS_DIP), `session ${k + 1}: ${R.marks} marks`);
    all += R.marks;
  }
  assert.equal(all, L.segs.reduce((a, s) => a + s.marks.length, 0), 'every mark in one session or another');
  assert.ok(marksRows(L, 0, 4, false).ps.every(p => !p[0].nodip));
});

test('DRAG on the machine: a band\'s lanes one path, non-stop, the dry brush, no dip', () => {
  const L = paintPlan(), R = dragRows(L, 0), segs = L.segs.filter(s => s.session === 0);
  assert.equal(R.bands, segs.length, 'a row a band');
  assert.equal(R.lanes, segs.reduce((a, s) => a + s.lanes.length, 0));
  const r = plotRun({ ...RUN, ink: false, speed: 60, rows: R.ps.length, noDipUnder: NO_DIP }, [{ key: 'DRAG', ps: R.ps, why: null }]);
  assert.equal(r.fault, '');
  assert.equal(r.dips, 0);
  assert.equal(r.blocks.filter(b => b.kind === 'move' && b.paintMM > 0).length, R.bands, 'the brush down once a band');
  assert.ok(Math.abs(r.length - R.length) < 0.01 * R.length + 5, `${r.length} painted, ${R.length} laid`);
});

test('the spiral: every lane round once, each next one a short diagonal step in, the last on past its start', () => {
  const L = paintPlan(), I = L.segs[0], P = I.spiral;
  let steps = 0;
  for (const seg of L.segs) for (let j = 1; j < seg.spiral.length; j++) assert.ok(dist(seg.spiral[j].p, seg.spiral[j - 1].p) < 7 * JOG + 7 + 3, `${seg.ch}: a step of ${dist(seg.spiral[j].p, seg.spiral[j - 1].p)} mm`);
  for (let j = 1; j < P.length; j++) { const d = dist(P[j].p, P[j - 1].p); if (d > 3) steps++; }
  assert.ok(steps >= I.lanes.length - 1 - 1, `${steps} steps for ${I.lanes.length} lanes`);
  const lengths = I.lanes.reduce((a, l) => a + lengthOf(l.path.map(q => q.p)) - DRAG_ON, 0);
  assert.ok(Math.abs(lengthOf(P.map(q => q.p)) - lengths - DRAG_ON) < 0.1 * lengths, 'about every lane once round');
  const O = layoutOf(G, { ...o, text: 'O' }); marksOf(O, { paints: 8, per: 2, spacing: 90 }); dragOf(O, { brush: 12, pitch: 7, order: 'out' });
  const ds = O.segs[0].lanes.map(l => l.d);
  assert.deepEqual(ds, [...ds].sort((a, b) => b - a), 'a closed band from its outer edge across to its hole');
});
