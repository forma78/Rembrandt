// LAB 4.0's real 3 (the owner, 2026-11-08: "before painting the red Porsche on the 70 × 100 canvas, better make a fragment of it on 20 × 20 cm"; "I prepared for-LAB.png,
// it lies in FORM-G, it will suit real 3 perfectly"): the red 911's piece round its left headlight, FORM-G/for-LAB.png, at the picture's own size, cut by F's frame as
// FORM-G cuts one (framedPic, formgplan.js), every jar of it as the list has them, into app/src/labreal3.js. A snapshot: the red goes on changing in FORM-G, the test does not.
// Run from the repository's root: node FORM-G/generator/export_labreal3.mjs
//
// for-LAB.png found in `Top-Down Classic Red Porsche 911.png` by matching (0.996): x 58 … 415, y 25 … 366 px; by redcar.py's own scale (843 mm long, 4 % wider) that is
// x 119 … 321, y 753 … 940 mm on the 70 × 100. The frame keeps its right edge and its bottom, and leaves out the white on its left and the top above the car's nose:
// 180 × 172 mm, so it lies on a 20 × 20 canvas as real 2's sheet did, X 22 … 194.
import fs from 'fs';
import { framedPic, seqOf } from '../../app/src/formgplan.js';

const FRAME = { x0: 142, y0: 753, x1: 322, y1: 925 };
const pic = JSON.parse(fs.readFileSync('app/formg/porsche-red.json'));
const cut = framedPic(pic, FRAME);
const jars = cut.jars.map(j => ({ id: j.id, name: j.name, hex: j.hex, coats: j.coats, cells: j.cells.map(c => ({ n: c.n, legs: c.legs, ...(c.air ? { air: true, cuts: c.cuts } : {}) })) }));
const out = { id: pic.id, title: pic.title, say: 'the red 911: its left headlight, the indicator, the wing and the bonnet\'s seam (FORM-G/for-LAB.png)', frame: FRAME,
  pic: { id: pic.id, w: pic.w, h: pic.h, pitch: pic.pitch, jars } };
fs.writeFileSync('app/src/labreal3.js', `// Cut out of FORM-G's red 911 (app/formg/porsche-red.json, ${new Date().toISOString().slice(0, 10)}) by FORM-G/generator/export_labreal3.mjs: the owner's FORM-G/for-LAB.png
// in F's frame (framedPic), at the picture's own size. mm as the picture's: x right (the machine's Y), y up (its X), from the 70 × 100's bottom left; frame: where the piece lies on it.
export const REAL3 = ${JSON.stringify(out)};\n`);
const legs = jars.flatMap(j => j.cells.flatMap(c => c.legs.map(l => Math.abs(l[2] - l[1]))));
console.log('jars', jars.length, 'of them two coats', jars.filter(j => j.coats === 2).length, 'list', seqOf(cut).length, 'cells', jars.reduce((t, j) => t + j.cells.length, 0), 'legs', legs.length, 'line', Math.round(legs.reduce((a, b) => a + b, 0)), 'mm',
  'under 10 mm', legs.filter(v => v < 10).length);
