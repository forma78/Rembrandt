import test from 'node:test';
import assert from 'node:assert/strict';
import { aligned, boxOf } from '../src/align.js';

// The three blends of OPM/Screenshot 2026-10-28 at 7.17.39 PM.png, about: a
// 600 × 800 canvas, the row 52 mm in from the left, 30 from the right, its
// gaps 14 and 11 mm, its bottom 39 mm up, its top 98 down
const ROW = [{ x: 52, y: 39, w: 165, h: 663 }, { x: 231, y: 39, w: 165, h: 663 }, { x: 407, y: 40, w: 163, h: 662 }];
const moved = (rs, A) => rs.map((r, i) => ({ ...r, ...A.at[i] }));

test('Centre left to right: the box of them in the middle, every one moved alike, the sizes as they were', () => {
  const A = aligned(ROW, 'midX', 600, 800), rs = moved(ROW, A), B = boxOf(rs);
  assert.equal(B.x, 600 - B.x - B.w, 'as far in from the left as from the right');
  assert.equal(A.margin, B.x);
  rs.forEach((r, i) => { assert.equal(r.x - ROW[i].x, rs[0].x - ROW[0].x, 'every one moved alike'); assert.equal(r.y, ROW[i].y); assert.equal(r.w, ROW[i].w); });
});

test('Centre top to bottom: a row, every one its middle on the canvas\'s, lined up; a grid, moved as one', () => {
  const A = aligned(ROW, 'midY', 600, 800), rs = moved(ROW, A), B = boxOf(rs);
  assert.ok(A.each); assert.equal(B.y, 800 - B.y - B.h);
  rs.forEach(r => assert.equal(r.y + r.h / 2, 400, 'the row on the middle line'));
  assert.deepEqual(A.at.map(q => q.x), ROW.map(r => r.x), 'left to right where they were');
  const grid = [{ x: 10, y: 10, w: 40, h: 40 }, { x: 60, y: 12, w: 40, h: 40 }, { x: 10, y: 60, w: 40, h: 40 }, { x: 60, y: 62, w: 40, h: 40 }], G = aligned(grid, 'midY', 200, 200);
  assert.ok(!G.each); assert.deepEqual(G.at.map(q => q.y), [54, 56, 104, 106], 'the box in the middle, the rows as they were');
  const col = [{ x: 10, y: 0, w: 40, h: 20 }, { x: 30, y: 30, w: 60, h: 20 }], C = aligned(col, 'midX', 200, 100);
  assert.ok(C.each); assert.deepEqual(C.at.map(q => q.x), [80, 70], 'a column lined up on the middle');
});

test('Even gaps: the outermost two stay, the one between them the same gap from either; then centred, the row as asked', () => {
  const A = aligned(ROW, 'gapX', 600, 800), rs = moved(ROW, A);
  assert.equal(rs[0].x, 52); assert.equal(rs[2].x, 407);
  assert.equal(rs[1].x - (rs[0].x + rs[0].w), A.gap); assert.equal(rs[2].x - (rs[1].x + rs[1].w), A.gap);
  assert.equal(A.gap, 12.5);
  const C = moved(rs, aligned(rs, 'midX', 600, 800)), B = boxOf(C);
  assert.equal(B.x, 600 - B.x - B.w); assert.equal(C[1].x - (C[0].x + C[0].w), 12.5, 'centring keeps the gaps');
});

test('Even gaps by the figures\' middles, in any order kept; top to bottom too; two or none, nothing to space', () => {
  const rs = [ROW[2], ROW[0], ROW[1]], A = aligned(rs, 'gapX', 600, 800);
  assert.deepEqual(A.at[0], { x: 407, y: 40 }); assert.deepEqual(A.at[1], { x: 52, y: 39 }); assert.equal(A.at[2].x, 229.5);
  const col = [{ x: 0, y: 0, w: 10, h: 10 }, { x: 0, y: 13, w: 10, h: 20 }, { x: 0, y: 50, w: 10, h: 10 }], V = aligned(col, 'gapY', 100, 100);
  assert.equal(V.gap, 10); assert.deepEqual(V.at[1], { x: 0, y: 20 });
  assert.equal(aligned(ROW.slice(0, 2), 'gapX', 600, 800), null);
  assert.equal(aligned([], 'midX', 600, 800), null);
  assert.equal(aligned(ROW, 'left', 600, 800), null);
});
