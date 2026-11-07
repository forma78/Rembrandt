// LAB 4.0's real strokes (the owner, 2026-11-06: "a test of the real strokes that we will have in the realistic works"): pieces cut out of FORM-G's own plans,
// the same legs in the same order, into app/src/labreal.js. Run from the repository's root: node FORM-G/generator/export_labreal.mjs
import fs from 'fs';
const lum = h => { const n = parseInt(h.slice(1), 16); return .2126 * (n >> 16) + .7152 * (n >> 8 & 255) + .0722 * (n & 255); };
const PIECES = [
  { id: 'porsche', say: 'the Porsche: the roof running into the windscreen\'s rim', x0: 342.5, y0: 542 },
  { id: 'watch', say: 'the watch: the dial by its 12 o\'clock baton', x0: 287.5, y0: 432 },
];
const W = 30, H = 84;      // mm: 7 columns, 5 mm apart
const out = PIECES.map(({ id, say, x0, y0 }) => {
  const pic = JSON.parse(fs.readFileSync(`app/formg/${id}.json`)), cells = [];
  pic.jars.forEach((j, jar) => j.cells.forEach(c => {
    let run = [];
    const flush = () => { if (run.length) cells.push({ jar, lum: lum(j.hex), legs: run, ...(c.air ? { air: true, cuts: (c.cuts ?? []).map(v => +(v - y0).toFixed(2)).filter(v => v > 0 && v < H) } : {}) }); run = []; };
    for (const [x, a, b] of c.legs) {
      const inside = x >= x0 - .01 && x <= x0 + W + .01 && Math.max(a, b) > y0 && Math.min(a, b) < y0 + H;
      if (!inside) { flush(); continue; }
      const clip = v => Math.max(y0, Math.min(y0 + H, v)), cut = clip(a) !== a || clip(b) !== b;
      if (cut && Math.abs(clip(a) - clip(b)) < 8) { flush(); continue; }   // the end of a leg that lies outside: not a stroke of the picture
      run.push([+(x - x0).toFixed(2), +(clip(a) - y0).toFixed(2), +(clip(b) - y0).toFixed(2)]);
    }
    flush();
  }));
  // two paints, the picture's order, light under dark: the line shared about evenly, a jar whole
  const byJar = new Map(); cells.forEach(c => byJar.set(c.jar, { lum: c.lum, mm: (byJar.get(c.jar)?.mm ?? 0) + c.legs.reduce((s, l) => s + Math.abs(l[2] - l[1]), 0) }));
  const order = [...byJar.entries()].sort((p, q) => q[1].lum - p[1].lum), all = order.reduce((s, e) => s + e[1].mm, 0); let sum = 0; const light = new Set();
  for (const [jar, v] of order) { if (sum >= all / 2) break; light.add(jar); sum += v.mm; }
  return { id, say, from: [x0, y0], w: W, h: H, cells: cells.map(c => ({ paint: light.has(c.jar) ? 0 : 1, jar: c.jar, legs: c.legs, ...(c.air ? { air: true, cuts: c.cuts } : {}) })) };
});
// a long leg as they are, its dips in the middle of it: the roof's, jar 6, 176 mm there, as much of it as the sheet has room for
const longLeg = { id: 'porsche', say: 'the Porsche: a long leg of the roof', from: [447.5, 665], jar: 6, leg: [174, 0] };
fs.writeFileSync('app/src/labreal.js', `// Cut out of FORM-G's plans by FORM-G/generator/export_labreal.mjs: mm in a piece from its bottom left, x right, y up, every leg [x, from y, to y] along y, the machine's X.\n// The picture's own legs and order, clipped at the piece's edges; two paints for a test: paint 0 the lighter jars, paint 1 the darker.\nexport const REAL_PIECES = ${JSON.stringify(out)};\nexport const REAL_LONG = ${JSON.stringify(longLeg)};\n`);
for (const p of out) { const L = p.cells.flatMap(c => c.legs.map(l => Math.abs(l[2] - l[1]))).sort((a, b) => a - b); console.log(p.id, 'cells', p.cells.length, 'legs', L.length, 'line', Math.round(L.reduce((a, b) => a + b, 0)), 'paints', [0, 1].map(k => p.cells.filter(c => c.paint === k).reduce((s, c) => s + c.legs.reduce((t, l) => t + Math.abs(l[2] - l[1]), 0), 0).toFixed(0)).join('/'), 'lens', L.map(v => v.toFixed(0)).join(' '), 'air', p.cells.filter(c => c.air).length, 'multi-leg', p.cells.filter(c => c.legs.length > 1).length); }
