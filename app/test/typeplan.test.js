import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { layoutOf, fitHeight, sessionsOf, outlinesOf, clockwise, traceOf, traceRows, cleanText } from '../src/typeplan.js';
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
  for (const s of L.segs) for (const q of L.segs) if (s !== q && s.li === q.li) continue;   // a letter's own bands may share a session
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
