import test from 'node:test';
import assert from 'node:assert/strict';
import { PALETTES, HEX, recolour, newPipe, spineOf, planOf, paintWalk, paperTest, compose, lanesOf, crossT, traceOf, traceRows, marksRows, dragRows, traceSvg, marksSvg, dragSvg, paintMapSvg, planJson, EDGE_IN, MARKS_DIP, PAPER_MARKS, SNAKE_STEP } from '../src/aluplan.js';
import { plotRun, DEFAULTS, pieceLen } from '../src/strokes.js';

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

test('New composition: whole lanes only, no Across segments, no fans; in over an edge and out over one', () => {
  for (let seed = 1; seed <= 9; seed++) {
    const P = compose(seed, O);
    assert.ok(P.length >= 3 && P.length <= 6, `${P.length} pipes`);
    for (const st of P) {
      assert.equal(st.brush, 'lanes'); assert.equal(st.capA, 'flat'); assert.equal(st.capB, 'flat');
      assert.ok(st.segs.every(g => g.mode === 'along'));
      const out = p => p[0] < 0 || p[0] > O.cw || p[1] < 0 || p[1] > O.ch;
      assert.ok(out(st.pts[0]) && out(st.pts.at(-1)), 'it starts and ends past the panel');
    }
  }
  assert.deepEqual(compose(4, O), compose(4, O), 'a seed, the same composition');
});

test('Master Flo: every mark right across the whole pipe, one paint — no gradient across', () => {
  // the owner, 2026-10-08, ALU-Claude/paper-test/02_marks_black_white.jpg: "the lines always across the whole sausage"
  const drawn = { pts: [[80, 120], [420, 120], [420, 560], [120, 600]], w: 70, round: 0.9, capA: 'flat', capB: 'flat', seams: [0.5], segs: [{ mode: 'along', stops: ['navy', 'blue', 'ice', 'blue', 'navy'] }, { mode: 'along', stops: ['maroon', 'red'] }], brush: 'lanes', first: 'in', marks: [] };
  const edge = p => p[0] <= 1 + 1e-6 || p[0] >= O.cw - 1 - 1e-6 || p[1] <= 1 + 1e-6 || p[1] >= O.ch - 1 - 1e-6;
  let n = 0;
  for (const pipes of [[drawn], ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(seed => compose(seed, O))]) {
    const pl = planOf(pipes, O);
    for (const m of pl.sessions.flatMap(s => s.marks)) {
      if (m.kind === 'edge of panel') continue;
      const L = dist(m.pts[0], m.pts.at(-1)), w = pl.pipes[m.si].w;
      assert.ok(Math.abs(L - (w - 1)) < 1e-6 || m.pts.some(edge), `pipe ${m.si + 1}: a mark ${L.toFixed(1)} mm across a pipe ${w} wide`);
      n++;
    }
    const at = new Map();
    for (const m of pl.sessions.flatMap(s => s.marks)) if (m.kind !== 'edge of panel') { const key = `${m.si}:${m.s.toFixed(3)}`; assert.ok(!at.has(key) || at.get(key) === m.paint, 'one paint across'); at.set(key, m.paint); }
  }
  assert.ok(n > 100);
  const marks = planOf([drawn], O).sessions[0].marks;
  assert.deepEqual([...new Set(marks.map(m => m.paint))].sort(), ['blue', 'ice', 'maroon', 'navy', 'red'], 'the paints in turn along the pipe');
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
  const tight = { pts: [[100, 100], [300, 100], [300, 120]], w: 60, round: 1, capA: 'flat', capB: 'flat', seams: [], segs: [{ mode: 'along', stops: ['navy', 'ice'] }], brush: 'lanes', first: 'in', marks: [] };
  assert.equal(spineOf(tight).tight, 1);
  assert.equal(planOf([tight], O).tight, 1);
  assert.equal(spineOf({ ...tight, pts: [[100, 100], [300, 100], [300, 300]] }).tight, 0);
  const off = { ...tight, pts: [[-40, 300], [250, 300]] }, marks = planOf([off], O).sessions[0].marks.filter(m => m.kind === 'edge of panel');
  assert.ok(marks.length >= 1, 'a dash along the edge');
  assert.ok(marks.every(m => m.pts.every(p => Math.abs(p[0] - EDGE_IN) < 1e-9 && Math.abs(p[1] - 300) < 30)));
  assert.deepEqual([...new Set(marks.map(m => m.paint))], ['navy'], 'the paint the pipe has there, right across');
});

test('the passes run on the machine: lines and arcs, TRACE and MARKS from the cup, DRAG dry and a landing a run', () => {
  const pl = planOf(compose(5, O), O), lines = R => R.ps.every(p => p.every(g => (g.t === 'L' || g.t === 'A') && Number.isFinite(g.a.x) && Number.isFinite(g.b.y)));
  const T = traceRows(traceOf(pl, O), true, O);
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
  assert.equal(new Set(r.blocks.filter(b => b.kind === 'move' && b.paintMM > 0).map(b => b.row)).size, D.runs, 'a landing and a lift a row');
  assert.equal(r.blocks.filter(b => b.kind === 'arm').length - 2, D.runs, 'the brush up after each row only');
  // a whole lane is lines and arcs exactly: as long fitted as laid
  const run = pl.sessions[0].runs[0], fitted = D.info[0].L;
  assert.ok(Math.abs(fitted - run.cum.at(-1)) < 0.01 * run.cum.at(-1), `${fitted} fitted, ${run.cum.at(-1)} laid`);
});

test('the paper test\'s loop: an outline whole on the panel runs round clockwise and on 60 % over its start', () => {
  const pl = planOf(PAPER.pipes, PAPER.o), [t] = traceOf(pl, PAPER.o);
  assert.ok(t.closed && t.lap > 0);
  const R = traceRows([t], false, PAPER.o);
  assert.equal(R.ps.length, 1);
  assert.ok(Math.abs(R.ps[0].at(-1).tailOut - t.lap) < 1e-9, 'the brush lifts off over the lap');
});

test('TRACE lies on lanes 1 and n, DRAG\'s own lines, whatever the brush and the line (the owner, 2026-10-10)', () => {
  const seg = (p, a, b) => { const ab = [b[0] - a[0], b[1] - a[1]], l2 = ab[0] ** 2 + ab[1] ** 2, t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1]) / l2)) : 0; return dist(p, [a[0] + ab[0] * t, a[1] + ab[1] * t]); };
  const off = (p, lines) => Math.min(...lines.flatMap(P => P.slice(1).map((q, i) => seg(p, P[i], q))));
  for (const [brush, width] of [[12, 4], [8, 2.5], [4.5, 1], [4, 12]]) {
    const o = { ...PAPER.o, brush, width, lanes: 12 }, pl = planOf(PAPER.pipes, o), [t] = traceOf(pl, o), runs = pl.sessions[0].runs;
    const [one, n] = [1, 12].map(k => runs.find(r => r.num === k).pts);
    assert.ok(t.closed);
    const lines = [one, n, [one[0], n[0]], [one.at(-1), n.at(-1)]];   // the two edge lanes, and across the pipe's two ends
    const worst = Math.max(...t.pts.map(p => off(p, lines)));
    assert.ok(worst < 1e-6, `brush ${brush}, line ${width}: the trace ${worst} mm off the lanes`);
    assert.ok(t.pts.some(p => off(p, [one]) < 1e-6) && t.pts.some(p => off(p, [n]) < 1e-6), 'along both edge lanes');
  }
});

test('the snake (the owner, 2026-10-10): a pipe whole on the canvas one run, its lanes back and forth, a step across its end each', () => {
  const o = { ...PAPER.o, aorder: 'snake' }, one = planOf(PAPER.pipes, PAPER.o).sessions[0].runs, [r, ...rest] = planOf(PAPER.pipes, o).sessions[0].runs;
  assert.equal(rest.length, 0, 'one run, one landing');
  assert.deepEqual(r.nums, [8, 7, 6, 5, 4, 3, 2, 1]);
  const { pitch } = lanesOf(planOf(PAPER.pipes, o).pipes[0], o);
  r.starts.forEach((at, k) => {
    const end = r.starts[k + 1] ?? r.pts.length, lane = r.pts.slice(at, end), was = one[k].pts.map(p => p.slice(0, 2));
    assert.deepEqual(lane.map(p => p.slice(0, 2)), k % 2 ? was.slice().reverse() : was, `lane ${r.nums[k]} on its line, ${k % 2 ? 'back' : 'forth'}`);
    assert.ok(lane.every(p => p[3] === (k % 2 ? -1 : 1)));
    if (k) assert.ok(Math.abs(dist(r.pts[at - 1], r.pts[at]) - pitch) < 1e-6, 'the step across one pitch');
  });
  const D = dragRows(planOf(PAPER.pipes, o), 0, o), run = plotRun({ ...RUN, ink: false, speed: 60, rows: D.ps.length, pauseAtEnds: true }, [{ key: 'DRAG', ps: D.ps, why: null }]);
  assert.equal(run.fault, '');
  // a block a lane for rembrandt.py (the owner, 2026-10-10: the pause only at the ends of a line), the brush down between them
  const B = run.blocks, i0 = B.findIndex(b => b.kind === 'move' && b.paintMM > 0), lanesB = B.slice(i0, i0 + 8);
  assert.equal(B.filter(b => b.kind === 'move' && b.paintMM > 0).length, 8, 'a block a lane');
  assert.ok(lanesB.every(b => b.kind === 'move' && b.pauseAtEnd), 'one after another, nothing between them, each paused at its end');
  const ws = lanesB.map(b => b.cmds.filter(c => c[0] === 'W').length);
  assert.ok(ws[0] > 0 && ws.at(-1) > 0 && ws.slice(1, -1).every(n => n === 0), `the brush lands in the first, lifts in the last: ${ws}`);
  const endOf = b => { const c = b.cmds.filter(q => q[0] === 'L' || q[0] === 'A').at(-1).split(' '); return c[0] === 'L' ? c.slice(1, 3).map(Number) : c.slice(3, 5).map(Number); };
  const P0 = D.ps[0], at = []; let acc = 0;   // where each lane's fitted pieces end, from the row's stopsAt
  P0.forEach(g => { acc += pieceLen(g); if (P0[0].stopsAt.some(x => Math.abs(x - acc) < 1e-6)) at.push(g.b); });
  assert.equal(at.length, 7);
  lanesB.slice(0, -1).map(endOf).forEach((e, k) => assert.ok(Math.hypot(e[0] - RUN.here.x - at[k].x, e[1] - RUN.here.y - at[k].y) < 0.02, `block ${k + 1} ends at lane ${r.nums[k]}'s end`));
  const whole = plotRun({ ...RUN, ink: false, speed: 60, rows: D.ps.length }, [{ key: 'DRAG', ps: D.ps.map(p => p.map(({ stopsAt, ...g }) => g)), why: null }]);
  assert.ok(Math.abs(lanesB.reduce((a, b) => a + b.paintMM, 0) - whole.length) < 0.01, 'the same paint, cut or whole');
  assert.match(D.info[0].label, /lanes 8 → 7 → .* → 1, back and forth/);
  assert.match(dragSvg(planOf(PAPER.pipes, o).sessions[0], o), /data-lane="8 7 6 5 4 3 2 1"/);
});

test('the snake on pipes cut by the canvas: the steps past its edge, never over it; OFF as before, a lift a lane', () => {
  const inside = (p, o) => p[0] > 0.5 && p[0] < o.cw - 0.5 && p[1] > 0.5 && p[1] < o.ch - 0.5;
  for (let seed = 1; seed <= 6; seed++) {
    const pipes = compose(seed, O), snake = planOf(pipes, { ...O, aorder: 'snake' }), one = planOf(pipes, { ...O, aorder: 'one' });
    const runs = snake.sessions.flatMap(s => s.runs), ones = one.sessions.flatMap(s => s.runs);
    assert.ok(ones.every(r => !r.nums && r.pts.every(p => p[3] === 1)), 'OFF: every lane one way, a run of its own');
    assert.equal(runs.reduce((a, r) => a + r.nums.length, 0), ones.length, 'every lane piece run once');
    assert.ok(runs.length < ones.length, `seed ${seed}: fewer landings, ${runs.length} for ${ones.length}`);
    const D = dragRows(snake, 0, { ...O, aorder: 'snake' }), run = plotRun({ ...RUN, ink: false, speed: 60, rows: D.ps.length, pauseAtEnds: true }, [{ key: 'DRAG', ps: D.ps, why: null }]);
    assert.equal(run.fault, '');
    assert.ok(run.blocks.filter(b => b.kind === 'move' && b.paintMM > 0).every(b => b.pauseAtEnd), 'every pass paused at its end');
    assert.equal(run.blocks.filter(b => b.kind === 'move' && b.paintMM > 0).length, ones.length, 'a block a lane piece');
    for (const r of runs) for (const at of r.starts.slice(1)) {
      const a = r.pts[at - 1], b = r.pts[at], { pitch } = lanesOf(snake.pipes[r.si], O);
      assert.ok(dist(a, b) <= SNAKE_STEP * pitch + 0.5, 'a short step');
      assert.ok(!inside(a, O) && !inside(b, O), `seed ${seed}: the step past the canvas's edge`);
    }
  }
});

test('every file carries data-ink', () => {
  const pl = planOf(compose(1, O), O), o = { ...O, seed: 1, ground: 'white' };
  assert.match(traceSvg(pl, o), /data-ink="INK-1"/);
  for (const s of pl.sessions) { assert.match(marksSvg(pl, s, o), /data-ink="INK-1"/); assert.match(dragSvg(s, o), /data-ink="none"/); }
  assert.match(paintMapSvg(pl, o), /<svg /);
  assert.equal(JSON.parse(planJson(pl, o)).tab, 'ALU');
});

test('SMKN: the paints in stock — its compositions, colours, paper test and new pipes only in them; ALU\'s untouched', () => {
  const P = PALETTES.smkn, own = new Set(P.tubes.map(t => t[0])), alu = new Set(PALETTES.alu.tubes.map(t => t[0]));
  assert.equal(P.tubes.length, 14);
  assert.ok(P.tubes.every(([k, name, hex]) => /^#[0-9A-F]{6}$/.test(hex) && HEX[k] === hex && name.length && !alu.has(k)), 'its own keys and colours');
  assert.ok(P.families.every(f => f.length === 3 && f.every(k => own.has(k))) && P.solo.flat().every(k => own.has(k)));
  const o = { ...O, pal: P }, stops = pipes => pipes.flatMap(st => st.segs.flatMap(g => g.stops));
  for (let seed = 1; seed <= 9; seed++) {
    const C = compose(seed, o);
    assert.ok(stops(C).every(k => own.has(k)), `composition ${seed}`);
    assert.ok(stops(recolour(C, seed * 7, P)).every(k => own.has(k)), `new colours ${seed}`);
    assert.ok(planOf(C, o).nums.every(k => own.has(k)));
  }
  assert.ok(stops([newPipe(40, 3, P)]).every(k => own.has(k)));
  const t = paperTest(P);
  assert.deepEqual([...new Set(t.pipes[0].marks.map(m => m.paint))], ['lk4982', 'sa116'], 'the paper test in Ivory Black and Titanium White');
  assert.deepEqual(planOf(t.pipes, { ...PAPER.o, pal: P }).sessions[0].runs.map(r => r.num), [8, 7, 6, 5, 4, 3, 2, 1]);
  assert.ok(stops(compose(1, O)).every(k => alu.has(k)), 'ALU keeps its tubes');
});
