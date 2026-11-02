// A QR code (ISO/IEC 18004, after Project Nayuki's QR Code generator): the
// iPhone's remote address with its key, for OPM-N's page to show and the
// iPhone's camera to read (the owner, 2026-11-02: "yes, with the key"). Byte
// mode, error correction M, versions 1 … 10 — an address of 200 bytes at most.
// → { size, dark(x, y) }; qrSvg(text) an SVG of it, its quiet zone round it.

// version → [data codewords a block, blocks] for M, the short blocks first; error correction codewords a block
const BLOCKS = [null, [[16, 1]], [[28, 1]], [[44, 1]], [[32, 2]], [[43, 2]], [[27, 4]], [[31, 4]], [[38, 2], [39, 2]], [[36, 3], [37, 2]], [[43, 4], [44, 1]]];
const ECC = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
const ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];
const M_BITS = 0;   // error correction M in the format bits

const gmul = (x, y) => { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z & 0xFF; };
function divisor(n) {
  const r = new Array(n).fill(0); r[n - 1] = 1;
  let root = 1;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) { r[j] = gmul(r[j], root); if (j + 1 < n) r[j] ^= r[j + 1]; }
    root = gmul(root, 0x02);
  }
  return r;
}
function remainder(data, div) {
  const r = new Array(div.length).fill(0);
  for (const b of data) { const f = b ^ r.shift(); r.push(0); div.forEach((d, i) => { r[i] ^= gmul(d, f); }); }
  return r;
}

export function qrOf(text) {
  const bytes = [...new TextEncoder().encode(text)];
  let ver = 1;
  const capacity = v => BLOCKS[v].reduce((a, [n, k]) => a + n * k, 0);
  while (ver <= 10 && 4 + (ver < 10 ? 8 : 16) + 8 * bytes.length > 8 * capacity(ver)) ver++;
  if (ver > 10) throw new Error('too long for a QR code of version 10');
  // the bits: byte mode, its count, the bytes, the end, padded
  const bits = [], put = (v, n) => { for (let i = n - 1; i >= 0; i--) bits.push((v >>> i) & 1); };
  put(4, 4); put(bytes.length, ver < 10 ? 8 : 16); bytes.forEach(b => put(b, 8));
  const cap = 8 * capacity(ver);
  put(0, Math.min(4, cap - bits.length)); put(0, (8 - bits.length % 8) % 8);
  for (let p = 0xEC; bits.length < cap; p ^= 0xEC ^ 0x11) put(p, 8);
  const data = []; for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
  // the blocks, their error correction, interleaved
  const div = divisor(ECC[ver]), blocks = [];
  let at = 0;
  for (const [n, k] of BLOCKS[ver]) for (let j = 0; j < k; j++) { const d = data.slice(at, at + n); at += n; blocks.push({ d, e: remainder(d, div) }); }
  const words = [], most = Math.max(...blocks.map(b => b.d.length));
  for (let i = 0; i < most; i++) for (const b of blocks) if (i < b.d.length) words.push(b.d[i]);
  for (let i = 0; i < ECC[ver]; i++) for (const b of blocks) words.push(b.e[i]);
  // the modules: the patterns, the codewords, the best mask
  const size = 17 + 4 * ver, mod = [...Array(size)].map(() => new Array(size).fill(false)), fn = [...Array(size)].map(() => new Array(size).fill(false));
  const set = (x, y, d) => { mod[y][x] = d; fn[y][x] = true; };
  for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  const finder = (cx, cy) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const x = cx + dx, y = cy + dy, d = Math.max(Math.abs(dx), Math.abs(dy)); if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, d !== 2 && d !== 4); } };
  finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
  const A = ALIGN[ver];
  A.forEach((ay, i) => A.forEach((ax, j) => { if (i === 0 && j === 0 || i === 0 && j === A.length - 1 || i === A.length - 1 && j === 0) return; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); }));
  const format = mask => {
    const d = M_BITS << 3 | mask; let r = d; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
    const b = (d << 10 | r) ^ 0x5412, bit = i => ((b >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i));
    set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
    set(8, size - 8, true);
  };
  format(0);
  if (ver >= 7) {
    let r = ver; for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1F25);
    const b = ver << 12 | r;
    for (let i = 0; i < 18; i++) { const d = ((b >>> i) & 1) === 1, a = size - 11 + i % 3, c = Math.floor(i / 3); set(a, c, d); set(c, a, d); }
  }
  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let v = 0; v < size; v++) for (let j = 0; j < 2; j++) {
      const x = right - j, y = ((right + 1) & 2) === 0 ? size - 1 - v : v;
      if (!fn[y][x] && i < words.length * 8) { mod[y][x] = ((words[i >>> 3] >>> (7 - (i & 7))) & 1) === 1; i++; }
    }
  }
  const MASKS = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, x => x % 3 === 0, (x, y) => (x + y) % 3 === 0, (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
    (x, y) => x * y % 2 + x * y % 3 === 0, (x, y) => (x * y % 2 + x * y % 3) % 2 === 0, (x, y) => ((x + y) % 2 + x * y % 3) % 2 === 0];
  const apply = m => { for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && MASKS[m](x, y)) mod[y][x] = !mod[y][x]; };
  let best = 0, least = Infinity;
  for (let m = 0; m < 8; m++) { apply(m); format(m); const p = penalty(mod, size); if (p < least) { least = p; best = m; } apply(m); }
  apply(best); format(best);
  return { size, version: ver, mask: best, dark: (x, y) => mod[y][x] };
}
// the standard's penalty: runs of five and more, 2 × 2 boxes, finder-like runs, the dark share off a half
function penalty(m, n) {
  let p = 0;
  const line = get => {
    let run = 1;
    for (let i = 1; i <= n; i++) { if (i < n && get(i) === get(i - 1)) run++; else { if (run >= 5) p += run - 2; run = 1; } }
    for (let i = 0; i + 7 <= n; i++) {
      const s = [0, 1, 2, 3, 4, 5, 6].map(k => get(i + k)), core = s[0] && !s[1] && s[2] && s[3] && s[4] && !s[5] && s[6];
      if (!core) continue;
      const clear = (a, b) => { for (let k = a; k < b; k++) if (k >= 0 && k < n && get(k)) return false; return true; };
      if (clear(i - 4, i) || clear(i + 7, i + 11)) p += 40;
    }
  };
  for (let y = 0; y < n; y++) line(x => m[y][x]);
  for (let x = 0; x < n; x++) line(y => m[y][x]);
  let dark = 0;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (m[y][x]) dark++;
    if (x + 1 < n && y + 1 < n && m[y][x] === m[y][x + 1] && m[y][x] === m[y + 1][x] && m[y][x] === m[y + 1][x + 1]) p += 3;
  }
  return p + 10 * Math.max(0, Math.ceil(Math.abs(dark * 20 - n * n * 10) / (n * n)) - 1);
}
export function qrSvg(text, quiet = 4) {
  const q = qrOf(text), W = q.size + 2 * quiet;
  let d = '';
  for (let y = 0; y < q.size; y++) for (let x = 0; x < q.size; x++) if (q.dark(x, y)) d += `M${x + quiet} ${y + quiet}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}" shape-rendering="crispEdges"><rect width="${W}" height="${W}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}
