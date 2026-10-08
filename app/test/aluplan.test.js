import test from 'node:test';
import assert from 'node:assert/strict';
import { spineOf, planOf, paintWalk, paperTest, compose, lanesOf, crossT, traceOf, traceRows, marksRows, dragRows, traceSvg, marksSvg, dragSvg, paintMapSvg, planJson, EDGE_IN, MARKS_DIP, PAPER_MARKS } from '../src/aluplan.js';
import { plotRun, DEFAULTS } from '../src/strokes.js';

// ALU's plan (ALU-Claude/ALU.md): the prototype's logic, ported. Whole lanes,
// Master Flo first — the owner's paper test of 2026-10-08 is the fixture.
const O = { cw: 500, ch: 700, brush: 12, lanes: 7, xstep: 8, aorder: 'snake', spacing: 60, run: 70, tail: 180, overlap: 'wet', over: 10, pick: 40, mix: 0.7, width: 4 };
const PAPER = (() => { const p = paperTest(); return { pipes: p.pipes, o: { ...O, cw: p.cw, ch: p.ch, ...p.settings, tail: p.settings.dryTail } }; })();
const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const lum = c => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
const hits = (A, B) => { const out = []; for (let i = 1; i < A.length; i++) for (let j = 1; j < B.length; j++) { if (A === B && Math.abs(i - j) < 3) continue; const t = crossT(A[i - 1], A[i], B[j - 1], B[j]); if (t !== null) out.push({ i, t, p: [A[i - 1][0] + (A[i][0] - A[i - 1][0]) * t, A[i - 1][1] + (A[i][1] - A[i - 1][1]) * t] }); } return out; };
const RUN = { ...DEFAULTS, snake: true, pause: false, lift: false, tail: 3, speed: 150, travel: 180, here: { x: 350, y: 300 }, cup: { x: 400, y: 0, rim: 35, dip: 5, dwell: 1 } };

test('the paper test: eight whole lanes, the inside one first, 8 … 1, each the whole pipe one way', () => {
  const pl = planOf(PAPER.pipes, PAPER.o), [s] = pl.sessions, st = pl.pipes[0];
  assert.equal(pl.sessions.length, 1);
  assert.deepEqual(s.runs.map(r => r.num), [8, 7, 6, 5, 4, 3, 2, 1]);
  const { d } = lanesOf(st, PAPER.o);
  for (const r of s.runs) {
    assert.equal(r.mode, 'lanes');
    const a = st.sp.P[0], b = st.sp.P.at(-1), off = d(r.lane);
    assert.ok(dist(r.pts[0], [a[0] + st.sp.N[0][0] * off, a[1] + st.sp.N[0][1] * off]) < 1e-6, `lane ${r.num} starts at the pipe's start`);
    assert.ok(dist(r.pts.at(-1), [b[0] + st.sp.N.at(-1)[0] * off, b[1] + st.sp.N.at(-1)[1] * off]) < 1e-6, `lane ${r.num} ends at its end`);
  }
  // lane 8 on the inside of the turn
  const inner = s.runs[0], outer = s.runs.at(-1), C = [86, 83];   // inside the loop
  assert.ok(Math.min(...inner.pts.map(p => dist(p, C))) < Math.min(...outer.pts.map(p => dist(p, C))));
  assert.equal(s.marks.length, PAPER_MARKS.length, 'the marks by hand, one paint each, right across');
  assert.deepEqual(pl.nums, ['black', 'white']);
  assert.deepEqual(pl.crossings[0].length, 1, 'the pipe crosses itself once');
});

test('the paper test\'s crossing: one lane per step — lane k over the crossing lanes j > k, under j ≤ k', () => {
  const pl = planOf(PAPER.pipes, PAPER.o), W = paintWalk(pl, PAPER.o), runs = pl.sessions[0].runs, id = r => runs.indexOf(r) + 1;
  let n = 0;
  for (const A of runs) for (const B of runs) {
    for (const h of hits(A.pts, B.pts)) {
      const along = A.pts[h.i], prev = A.pts[h.i - 1];
      if (Math.abs(along[0] - prev[0]) < Math.abs(along[1] - prev[1])) continue;   // A's way in (across the page), B's way down
      // the later lane on top: lane k = A.num over B.num > k (painted before it), under B.num ≤ k, its own way down included
      const top = A.num < B.num ? id(A) : id(B);
      assert.equal(W.at(h.p), top, `lane ${A.num} in, lane ${B.num} down: run ${W.at(h.p)} on top`);
      n++;
    }
  }
  assert.equal(n, 64, 'eight lanes in, eight down');
});

test('the paper test\'s paint: lane 1 comes out of the crossing black, lane 8 light; white at the left ends of 7 … 1', () => {
  const pl = planOf(PAPER.pipes, PAPER.o), W = paintWalk(pl, PAPER.o), runs = pl.sessions[0].runs;
  const avg = (k, f) => { const L = W.runs[k].filter(s => s.col && f(s.a)); return L.reduce((a, s) => a + lum(s.col), 0) / L.length; };
  const below = runs.map((r, k) => avg(k, p => p[1] > 155 && p[1] < 165 && Math.abs(p[0] - 58) < 25));   // on the way down, past the crossing
  assert.ok(below.every((v, k) => !k || v < below[k - 1]), `darker lane by lane, 8 … 1: ${below.map(Math.round)}`);
  assert.ok(below.at(-1) < 100 && below[0] > 150, `lane 1 ${Math.round(below.at(-1))}, lane 8 ${Math.round(below[0])}`);
  for (let k = 1; k < runs.length; k++) {   // not washed: each lane starts with what the last one carried out, then the black
    assert.ok(avg(k, p => p[0] < 6) > avg(k, p => p[0] > 18 && p[0] < 26 && p[1] > 90) + 80, `lane ${runs[k].num}: white at its left end`);
  }
});

test('New composition: whole lanes only, paints across, no Across segments, no fans; in over an edge and out over one', () => {
  for (let seed = 1; seed <= 9; seed++) {
    const P = compose(seed, O);
    assert.ok(P.length >= 3 && P.length <= 6, `${P.length} pipes`);
    for (const st of P) {
      assert.equal(st.brush, 'lanes'); assert.equal(st.capA, 'flat'); assert.equal(st.capB, 'flat');
      assert.ok(st.segs.every(g => g.mode === 'along' && g.lay === 'across'));
      const out = p => p[0] < 0 || p[0] > O.cw || p[1] < 0 || p[1] > O.ch;
      assert.ok(out(st.pts[0]) && out(st.pts.at(-1)), 'it starts and ends past the panel');
    }
  }
  assert.deepEqual(compose(4, O), compose(4, O), 'a seed, the same composition');
});

test('every lane meets a dash at least every spacing, the outer one on a bend included', () => {
  const along = { pts: [[80, 120], [420, 120], [420, 560], [120, 600]], w: 70, round: 0.9, capA: 'flat', capB: 'flat', seams: [0.5], segs: [{ mode: 'along', stops: ['navy', 'blue', 'ice'] }, { mode: 'along', stops: ['maroon', 'red'] }], brush: 'segments' };
  for (const [pipes, o] of [[[along], { ...O, aorder: 'one' }], [compose(2, O), O]]) {
    const pl = planOf(pipes, o);
    let lanes = 0;
    for (const r of pl.sessions.flatMap(s => s.runs)) {
      if (r.mode !== 'along' && r.mode !== 'lanes') continue;
      const on = r.pts.map((p, i) => p[0] >= 1 && p[0] <= o.cw - 1 && p[1] >= 1 && p[1] <= o.ch - 1 ? r.cum[i] : null).filter(v => v !== null);
      const stops = [Math.min(...on), ...r.cross.map(c => c.s).filter(s => s >= Math.min(...on) && s <= Math.max(...on)), Math.max(...on)];
      for (let i = 1; i < stops.length; i++) assert.ok(stops[i] - stops[i - 1] <= o.spacing + 2, `${r.mode} lane: ${(stops[i] - stops[i - 1]).toFixed(1)} mm without a dash`);
      lanes++;
    }
    assert.ok(lanes > 3);
  }
});

test('Segments, Alu: every Across stroke crosses its starting edge\'s dash within 4 mm; every fan ray the rim\'s arc', () => {
  const st = { pts: [[100, 150], [400, 150], [400, 500], [150, 550]], w: 60, round: 0.8, capA: 'fan', capB: 'fan', seams: [0.45], segs: [{ mode: 'along', stops: ['navy', 'blue', 'ice'] }, { mode: 'across', stops: ['maroon', 'red', 'rose'] }], brush: 'segments' };
  const pl = planOf([st], O), [s] = pl.sessions, X = s.runs.find(r => r.mode === 'across'), edges = s.marks.filter(m => m.kind === 'edge' && m.j === X.j);
  assert.ok(X.strokes > 20 && edges.length > 4);
  for (let k = 0; k + 1 < X.pts.length; k += 2) {
    const a = X.pts[k], b = X.pts[k + 1], near = edges.flatMap(m => hits([a, b], m.pts)).map(h => dist(a, h.p));
    assert.ok(near.length && Math.min(...near) <= 4, `stroke ${k / 2 + 1}: its first dash ${Math.min(...near).toFixed(1)} mm in`);
  }
  const rays = s.runs.filter(r => r.mode === 'fan'), rims = s.marks.filter(m => m.kind === 'rim');
  assert.ok(rays.length > 10 && rims.length === 6);
  for (const r of rays) assert.ok(rims.some(m => hits(r.pts, m.pts).length), 'a fan ray crosses the rim\'s arc');
});

test('a corner tighter than half the pipe is counted; a pipe off the panel gets a dash along that edge', () => {
  const tight = { pts: [[100, 100], [300, 100], [300, 120]], w: 60, round: 1, capA: 'flat', capB: 'flat', seams: [], segs: [{ mode: 'along', lay: 'across', stops: ['navy', 'ice'] }], brush: 'lanes', first: 'in', marks: [] };
  assert.equal(spineOf(tight).tight, 1);
  assert.equal(planOf([tight], O).tight, 1);
  assert.equal(spineOf({ ...tight, pts: [[100, 100], [300, 100], [300, 300]] }).tight, 0);
  const off = { ...tight, pts: [[-40, 300], [250, 300]] }, marks = planOf([off], O).sessions[0].marks.filter(m => m.kind === 'edge of panel');
  assert.ok(marks.length >= 2, 'the edge dashes, a paint each');
  assert.ok(marks.every(m => m.pts.every(p => Math.abs(p[0] - EDGE_IN) < 1e-9 && Math.abs(p[1] - 300) < 30)));
  assert.deepEqual([...new Set(marks.map(m => m.paint))].sort(), ['ice', 'navy']);
});

test('the passes run on the machine: lines and arcs, TRACE and MARKS from the cup, DRAG dry and a landing a run', () => {
  const pl = planOf(compose(5, O), O), lines = R => R.ps.every(p => p.every(g => (g.t === 'L' || g.t === 'A') && Number.isFinite(g.a.x) && Number.isFinite(g.b.y)));
  const T = traceRows(traceOf(pl, O, O.width / 2), true, O);
  assert.ok(T.ps.length && lines(T));
  let r = plotRun({ ...RUN, ink: true, rows: T.ps.length, noDipUnder: 0 }, [{ key: 'TRACE', ps: T.ps, why: null }]);
  assert.equal(r.fault, '');
  const M = marksRows(pl, 0, { ...O, ink: true });
  assert.ok(lines(M) && M.marks === pl.sessions[0].marks.length);
  r = plotRun({ ...RUN, ink: true, rows: M.ps.length, noDipUnder: 0 }, [{ key: 'MARKS', ps: M.ps, why: null }]);
  assert.equal(r.fault, '');
  assert.equal(r.dips, Math.ceil(M.marks / MARKS_DIP));
  const D = dragRows(pl, 0, O);
  assert.ok(lines(D) && D.runs === pl.sessions[0].runs.length);
  r = plotRun({ ...RUN, ink: false, speed: 60, rows: D.ps.length }, [{ key: 'DRAG', ps: D.ps, why: null }]);
  assert.equal(r.fault, '');
  assert.equal(r.dips, 0);
  assert.equal(r.blocks.filter(b => b.kind === 'move' && b.paintMM > 0).length, D.runs, 'a lift after each lane');
  // a whole lane is lines and arcs exactly: as long fitted as laid
  const run = pl.sessions[0].runs[0], fitted = D.info[0].L;
  assert.ok(Math.abs(fitted - run.cum.at(-1)) < 0.01 * run.cum.at(-1), `${fitted} fitted, ${run.cum.at(-1)} laid`);
});

test('the paper test\'s loop: an outline whole on the panel runs round clockwise and on 60 % over its start', () => {
  const pl = planOf(PAPER.pipes, PAPER.o), [t] = traceOf(pl, PAPER.o, 2);
  assert.ok(t.closed && t.lap > 0);
  const R = traceRows([t], false, PAPER.o);
  assert.equal(R.ps.length, 1);
  assert.ok(Math.abs(R.ps[0].at(-1).tailOut - t.lap) < 1e-9, 'the brush lifts off over the lap');
});

test('every file carries data-ink', () => {
  const pl = planOf(compose(1, O), O), o = { ...O, seed: 1, ground: 'white' };
  assert.match(traceSvg(pl, o), /data-ink="INK-1"/);
  for (const s of pl.sessions) { assert.match(marksSvg(pl, s, o), /data-ink="INK-1"/); assert.match(dragSvg(s, o), /data-ink="none"/); }
  assert.match(paintMapSvg(pl, o), /<svg /);
  assert.equal(JSON.parse(planJson(pl, o)).tab, 'ALU');
});
