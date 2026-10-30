// FORM — figurative painting on OPM-P's geometry (the owner, 2026-10-30:
// "let us go over to figurative painting and try to make the little car as
// here", FORM/Screenshot 2026-10-30 at 11.22.18 AM.png, a red 911 in profile;
// of OPM-P's Fit the keys: "instead of how to make the brush fill this
// geometry perfectly I asked: why not change the geometry so the brush can
// fill it perfectly? — but with a car's silhouette that does not always
// work"). The silhouette stays; the brush gives way.
//
// Forms (his choice, "automatic, then I correct by hand"): the photo read on
// a grid, every square the nearest colour of the box (prismaplan.js's
// nearestOf), a speck smaller than Smallest form melted into the neighbour it
// shares most border with, every patch's border found once and straightened
// (Douglas–Peucker, Straighten) — two neighbours share it to the last digit.
//
// Rings (his choice, "rings inward, rays from the corners"): every side of a
// form moving in at once, parallel to itself — the straight skeleton — its
// rows the brush apart, OPM-P's blocks: a side's rows its own, ending on the
// rays, the corners' ways in. The form's depth over a whole number of rows,
// none wider than FIT of the brush (OPM-P's rowsIn): at its deepest the rings
// close exactly, in a narrow part the last one narrower. A convex corner
// sharp; a concave one in facets, OPM-W's, every one the same turn.
//
// Cells (his choice, "every cell the photo's colour"): a side's row in a band,
// cut square across where the photo's nearest colour changes along it — a
// piece Shortest cell long at least — every cell its colour, the nearest to
// the photo in it. Then OPM-P's own: the lines once (linesOf), DRAG a colour
// at a time (dragsOf).
//
// Bricks (the owner, the same morning, Porsche-911-3-2019.jpg: "let us make it as of LEGO bricks, nearer
// to Screenshot 11.15.13 AM", OPM-P's blend): here the geometry may give way after all, OPM-P's Fit the
// keys — the photo read on a grid two brushes wide, the borders its steps, every corner sharp: every row
// the brush exactly, the rows of two neighbours meeting, the rays at 45°, a row cut on the brush's grid,
// bricks of one brush by one, two, three.
//
// Materials (the owner, the same day, the window "smashed like glass, a black hole": "the tyres are rubber, the
// windows glass, the door and the wings metal — three materials may be solved differently"): metal, OPM-P's
// sharp rings; glass — the windows and the headlights — "as INKA and OPM-S, by way of an exception: half-round
// forms and curls, no sharp geometry": its outline as it is, its rings inside rounded more and more, a curl in
// the middle (roundRings), the adjacent glass pieces one form; rubber, the tyres, rounded too, one paint. Guessed
// off the photo, set by hand.
// Preview (his, "as in INKA and OPM-P: the trace with the sausages, winding — then the contour, our mesh — then
// the result, the mosaic as OPM-P's"): spokes across every form's rings from its outline in, every run of one
// paint along one a sausage, its paint the photo's nearest of the owner's; the brush round the rings from the
// outside in through them, INKA's Result (inkaplan.js's simOf). The cells' colours off the photo at first (its
// first try off the Preview lost the door's handle and the headlights), off the Preview by a switch.
//
// mm from the canvas's bottom left corner, x right, y up. No DOM.

import { nearestOf, PRISMA_PENCILS } from './prismaplan.js';
import { cleanPencils, LEAST_MM, LEAST_SHARE } from './dacheplan.js';
import { linesOf, dragsOf, sliversOf, rowsIn, areaOf, PITCH_NEW, MIN_W, FACETS_NEW } from './opmplan.js';
import { toLin } from './color.js';
import { labOf, de2000, simOf, GROUND } from './inkaplan.js';
import { PAINT } from './tapeplan.js';
import { SAUSAGE_W } from './ccdplan.js';
import { linOf } from './color.js';

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], add = (a, b) => [a[0] + b[0], a[1] + b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
const len = v => Math.hypot(v[0], v[1]), unit = v => { const l = len(v) || 1; return [v[0] / l, v[1] / l]; };
const cross = (a, b) => a[0] * b[1] - a[1] * b[0], dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const left = u => [-u[1], u[0]];
const keyOf = p => `${Math.round(p[0] * 1e5)},${Math.round(p[1] * 1e5)}`;
const RAY = Infinity, INNER = -1;   // a cell edge's kind: a ray (a cut across a row too, as OPM-P's), or, while the cells are made, the wavefront at an event
const HAIR = 1e-6;                  // mm: two points nearer, one

export const GRID_NEW = 2, GRID_MIN = 1, GRID_MAX = 6;                   // mm, the photo read on a grid so fine (est.)
export const SMALLEST_NEW = 24, SMALLEST_MIN = 6, SMALLEST_MAX = 120;     // mm: a form this squared at least, a speck smaller melts into its neighbour (est.)
export const STRAIGHT_NEW = 2, STRAIGHT_MIN = 0.5, STRAIGHT_MAX = 8;      // mm, a border straightened so far from the photo's at most (est.)
export const SHORTEST_NEW = 1, SHORTEST_MIN = 0.5, SHORTEST_MAX = 4;      // × the brush: a cell along its row so long at least, a colour shorter in with its neighbour (est.)
const SMOOTH = 2;                   // the grid's colours: a square to the most of its eight neighbours', twice — the photo's grain off
const SAMPLE = 1;                   // mm, a row read for its colours a step so long
export const BG_DE_NEW = 4, BG_DE_MIN = 0, BG_DE_MAX = 20;             // ΔE76: the background grown from the photo's rim to a square so near its neighbour at most (est.)
const BG_GRID = 2, BG_FAR = 15;    // mm, the background's grid; ΔE76, never farther from every colour of the rim
const BG = 1000;                    // a background square's label: its colour's and this, never one patch with the picture's
export const MATERIALS = ['metal', 'glass', 'rubber'];
export const CORNER_NEW = 40, CORNER_MIN = 0, CORNER_MAX = 200;          // mm, glass's and rubber's corners rounded so much at most (est.)
export const SPOKE_NEW = 40, SPOKE_MIN = 15, SPOKE_MAX = 120;             // mm, a spoke every so far round a form's outline (est.)
const ARC_DEG = 10;                 // a corner's arc a chord every so many degrees: the carriage on through every turn (strokes.js's KINK)

// ---------- the photo ----------
// labOf backwards (inkaplan.js's, D65): a colour's linear RGB, clamped
export function linOfLab([L, a, b]) {
  const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200, inv = t => t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787;
  const X = 0.95047 * inv(fx), Y = inv(fy), Z = 1.08883 * inv(fz), c = v => Math.max(0, Math.min(1, v));
  return [c(3.2406 * X - 1.5372 * Y - 0.4986 * Z), c(-0.9689 * X + 1.8758 * Y + 0.0415 * Z), c(0.0557 * X - 0.2040 * Y + 1.0570 * Z)];
}
const LIN = Float32Array.from({ length: 256 }, (_, i) => toLin(i / 255));
// img: { nx, ny, h (mm a pixel), data: RGBA, the top row first } over the canvas from its bottom left corner; a form
// moved since Auto forms (Align) or mirrored (Reflect) reads it where it came from: F.read, the photo's point of a point
// of the form, [m00, m01, m10, m11, tx, ty]
const affine = (m, x, y) => m ? [m[0] * x + m[1] * y + m[4], m[2] * x + m[3] * y + m[5]] : [x, y];
// a form united of forms that read it each their own way (U): F.parts, [{ loop, read }] — a point read as the part it lies in
const readOf = (img, F) => !img || !F ? img : F.parts?.length ? { ...img, tf: (x, y) => affine((F.parts.find(q => inPoly(q.loop, [x, y])) ?? F.parts[0]).read, x, y) } : F.read ? { ...img, tf: (x, y) => affine(F.read, x, y) } : img;
export const ID_READ = [1, 0, 0, 1, 0, 0];
// a form's read after it moved by d, or after a point q of it went to Hq + r: the photo where it came from
export const readMoved = (m0, d) => { const m = m0 ?? ID_READ; return [m[0], m[1], m[2], m[3], m[4] - (m[0] * d[0] + m[1] * d[1]), m[5] - (m[2] * d[0] + m[3] * d[1])]; };
const readThrough = (m0, H, r, m = m0 ?? ID_READ) => [m[0] * H[0] + m[1] * H[2], m[0] * H[1] + m[1] * H[3], m[2] * H[0] + m[3] * H[2], m[2] * H[1] + m[3] * H[3], m[0] * r[0] + m[1] * r[1] + m[4], m[2] * r[0] + m[3] * r[1] + m[5]];
function pix(img, x, y, acc) {
  if (img.tf) { const q = img.tf(x, y); x = q[0]; y = q[1]; }                       // a moved or a mirrored form: where the photo had it
  const ix = Math.floor(x / img.h), iy = Math.floor(y / img.h);
  if (ix < 0 || iy < 0 || ix >= img.nx || iy >= img.ny) return 0;
  const q = 4 * ((img.ny - 1 - iy) * img.nx + ix);
  if (img.data[q + 3] < 128) return 0;                                               // off the photo: none
  acc[0] += LIN[img.data[q]]; acc[1] += LIN[img.data[q + 1]]; acc[2] += LIN[img.data[q + 2]];
  return 1;
}

// the photo's mean in a polygon, linear light, on a SAMPLE grid; null off the photo
function meanOf(img, P) {
  const xs = P.map(p => p[0]), ys = P.map(p => p[1]), acc = [0, 0, 0];
  let got = 0;
  for (let y = Math.min(...ys) + SAMPLE / 2; y < Math.max(...ys); y += SAMPLE) for (let x = Math.min(...xs) + SAMPLE / 2; x < Math.max(...xs); x += SAMPLE) if (inPoly(P, [x, y])) got += pix(img, x, y, acc);
  if (!got) { const c = P.reduce((a, p) => add(a, mul(p, 1 / P.length)), [0, 0]); got = pix(img, c[0], c[1], acc); }
  return got ? acc.map(v => v / got) : null;
}

// ---------- the forms, off the photo ----------
// Douglas–Peucker, the ends kept
function straightened(P, tol) {
  if (P.length < 3) return P.slice();
  const keep = new Uint8Array(P.length); keep[0] = keep[P.length - 1] = 1;
  const st = [[0, P.length - 1]];
  while (st.length) {
    const [a, b] = st.pop(), ab = sub(P[b], P[a]), L = len(ab);
    let far = -1, fd = tol;
    for (let i = a + 1; i < b; i++) { const d = L < 1e-12 ? len(sub(P[i], P[a])) : Math.abs(cross(ab, sub(P[i], P[a]))) / L; if (d > fd) { fd = d; far = i; } }
    if (far >= 0) { keep[far] = 1; st.push([a, far], [far, b]); }
  }
  return P.filter((_, i) => keep[i]);
}
// The background on a fine grid: from every square of the photo's rim, to a neighbour no farther than step from
// it (ΔE76) and BG_FAR from the nearest colour of the rim. → { nx, ny, bg: Uint8Array }
function bgMask(img, W, H, step) {
  const nx = Math.ceil(W / BG_GRID - 1e-9), ny = Math.ceil(H / BG_GRID - 1e-9), L = new Float32Array(nx * ny * 3), seen = new Uint8Array(nx * ny), bg = new Uint8Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const acc = [0, 0, 0], st = Math.min(BG_GRID, img.h);
    let got = 0;
    for (let y = j * BG_GRID + st / 2; y < Math.min(H, (j + 1) * BG_GRID); y += st) for (let x = i * BG_GRID + st / 2; x < Math.min(W, (i + 1) * BG_GRID); x += st) got += pix(img, x, y, acc);
    if (got) { L.set(labOf(acc.map(v => v / got)), 3 * (j * nx + i)); seen[j * nx + i] = 1; }
  }
  const d2 = (m, n) => (L[3 * m] - L[3 * n]) ** 2 + (L[3 * m + 1] - L[3 * n + 1]) ** 2 + (L[3 * m + 2] - L[3 * n + 2]) ** 2;
  const rim = [];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const m = j * nx + i; if (seen[m] && (i === 0 || j === 0 || i === nx - 1 || j === ny - 1 || !seen[m - 1] || !seen[m + 1] || !seen[m - nx] || !seen[m + nx])) rim.push(m); }
  const ref = rim.filter((_, k) => k % Math.max(1, Math.floor(rim.length / 300)) === 0);
  const nearRim = m => ref.some(r => d2(m, r) <= BG_FAR * BG_FAR);
  const q = rim.slice(); q.forEach(m => { bg[m] = 1; });
  while (q.length) {
    const m = q.pop(), i = m % nx, j = (m - i) / nx;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= nx || b >= ny) continue; const n = b * nx + a; if (!bg[n] && seen[n] && d2(m, n) <= step * step && nearRim(n)) { bg[n] = 1; q.push(n); } }
  }
  return { nx, ny, bg, seen };
}
// The forms: [{ id, pencil, loops: [the outline anticlockwise, its holes clockwise], area, bg }] — the
// form on the left of every edge; bg, the background: the colours of the photo's rim reached from it, or no
// photo under it; o { pencils, grid, smallest, straight, bricks, bgDE }
export function autoForms(img, W, H, o = {}) {
  const g = o.grid ?? GRID_NEW, nx = Math.max(1, Math.ceil(W / g - 1e-9)), ny = Math.max(1, Math.ceil(H / g - 1e-9));
  const near = nearestOf(o.pencils ?? cleanPencils(PRISMA_PENCILS), -Infinity), names = [], idx = new Map();
  let lab = new Int32Array(nx * ny);
  const st = Math.min(g, img.h);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const x0 = i * g, x1 = Math.min(W, x0 + g), y0 = j * g, y1 = Math.min(H, y0 + g), acc = [0, 0, 0];
    let got = 0;
    for (let y = y0 + st / 2; y < y1; y += st) for (let x = x0 + st / 2; x < x1; x += st) got += pix(img, x, y, acc);
    if (!got) got = pix(img, (x0 + x1) / 2, (y0 + y1) / 2, acc);
    const id = got ? near(acc.map(v => v / got)) : null;
    lab[j * nx + i] = id === null ? -1 : idx.get(id) ?? (idx.set(id, names.length), names.push(id), names.length - 1);
  }
  const at = (L, i, j) => i < 0 || j < 0 || i >= nx || j >= ny ? -2 : L[j * nx + i];
  for (let pass = 0; pass < SMOOTH; pass++) {                                        // the grain off: a square to the most of its neighbours', its own on a tie
    const nl = lab.slice(), cnt = new Map();
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      cnt.clear();
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const v = at(lab, i + di, j + dj); if (v > -2) cnt.set(v, (cnt.get(v) ?? 0) + 1); }
      const own = lab[j * nx + i]; let best = own, bc = cnt.get(own);
      for (const [v, c] of cnt) if (c > bc) { best = v; bc = c; }
      nl[j * nx + i] = best;
    }
    lab = nl;
  }
  // the background (the owner, 2026-10-30, the first prototype: "we do not need the background, I think — you are
  // making a cast of the photo"; the silver one on its grey, Porsche-911-3-2019.jpg): grown from the photo's rim,
  // fine, square to square while the next is near its neighbour — a backdrop's gradient on, the picture's edge a
  // stop — a grid square the background where most of it is; a label of its own class
  if ((o.bgDE ?? BG_DE_NEW) > 0) {
    const M = bgMask(img, W, H, o.bgDE ?? BG_DE_NEW);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      let n = 0, b = 0;
      for (let y = j * g + BG_GRID / 2; y < Math.min(H, (j + 1) * g); y += BG_GRID) for (let x = i * g + BG_GRID / 2; x < Math.min(W, (i + 1) * g); x += BG_GRID) { const a = Math.floor(x / BG_GRID), c = Math.floor(y / BG_GRID); if (a < M.nx && c < M.ny && M.seen[c * M.nx + a]) { n++; b += M.bg[c * M.nx + a]; } }
      const m = j * nx + i;
      if (n && b * 2 > n && lab[m] >= 0) lab[m] += BG;
    }
  }
  // the patches, four-connected; the specks into the neighbour they share most border with, of their own class first
  const comp = new Int32Array(nx * ny).fill(-1), area = [], clab = [];
  for (let s = 0; s < nx * ny; s++) {
    if (comp[s] >= 0) continue;
    const c = area.length, q = [s]; comp[s] = c; area.push(0); clab.push(lab[s]);
    while (q.length) {
      const m = q.pop(), i = m % nx, j = (m - i) / nx; area[c]++;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= nx || b >= ny) continue; const n = b * nx + a; if (comp[n] < 0 && lab[n] === lab[s]) { comp[n] = c; q.push(n); } }
    }
  }
  const nb = area.map(() => new Map()), up = area.map((_, i) => i), find = i => up[i] === i ? i : (up[i] = find(up[i]));
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const a = comp[j * nx + i];
    for (const n of [i + 1 < nx ? j * nx + i + 1 : -1, j + 1 < ny ? (j + 1) * nx + i : -1]) { if (n < 0 || comp[n] === a) continue; const b = comp[n]; nb[a].set(b, (nb[a].get(b) ?? 0) + 1); nb[b].set(a, (nb[b].get(a) ?? 0) + 1); }
  }
  const least = (o.smallest ?? SMALLEST_NEW) ** 2 / (g * g);
  for (let moved = true; moved;) {
    moved = false;
    for (const c of area.map((_, i) => i).filter(i => find(i) === i && area[i] < least).sort((a, b) => area[a] - area[b])) {
      if (find(c) !== c || area[c] >= least) continue;
      let best = -1, bl = -1;
      const cls = v => v < 0 ? -1 : v >= BG ? 1 : 0;
      for (const mineFirst of [true, false]) {
        for (const [m, l] of nb[c]) { const r = find(m); if (r !== c && (!mineFirst || cls(clab[r]) === cls(clab[c])) && (l > bl || l === bl && area[r] > area[best])) { bl = l; best = r; } }
        if (best >= 0) break;
      }
      if (best < 0) continue;
      up[c] = best; area[best] += area[c];
      for (const [m, l] of nb[c]) { const r = find(m); if (r === best || r === c) continue; nb[best].set(r, (nb[best].get(r) ?? 0) + l); nb[r].set(best, (nb[r].get(best) ?? 0) + l); nb[r].delete(c); }
      nb[best].delete(c); nb[c] = new Map(); moved = true;
    }
  }
  const rid = new Map(), reg = new Int32Array(nx * ny);
  for (let s = 0; s < nx * ny; s++) { const r = find(comp[s]); reg[s] = rid.get(r) ?? (rid.set(r, rid.size), rid.size - 1); }
  const regLab = []; for (const [r, k] of rid) regLab[k] = clab[r];
  // the borders: cracks between squares of two regions, chains of them from junction to junction
  const R = (i, j) => i < 0 || j < 0 || i >= nx || j >= ny ? -1 : reg[j * nx + i];
  const X = i => Math.min(W, i * g), Y = j => Math.min(H, j * g), D = [[1, 0], [0, 1], [-1, 0], [0, -1]];   // E N W S
  const has = (i, j, k) => k === 0 ? R(i, j) !== R(i, j - 1) : k === 1 ? R(i - 1, j) !== R(i, j) : k === 2 ? R(i - 1, j) !== R(i - 1, j - 1) : R(i - 1, j - 1) !== R(i, j - 1);
  const leftOf = (i, j, k) => k === 0 ? R(i, j) : k === 1 ? R(i - 1, j) : k === 2 ? R(i - 1, j - 1) : R(i, j - 1);
  const rightOf = (i, j, k) => k === 0 ? R(i, j - 1) : k === 1 ? R(i, j) : k === 2 ? R(i - 1, j) : R(i - 1, j - 1);
  const NX = nx + 1, usedH = new Uint8Array(NX * (ny + 1)), usedV = new Uint8Array(NX * (ny + 1));
  const crack = (i, j, k) => k === 0 ? [usedH, j * NX + i] : k === 2 ? [usedH, j * NX + i - 1] : k === 1 ? [usedV, j * NX + i] : [usedV, (j - 1) * NX + i];
  const used = (i, j, k) => { const [A, n] = crack(i, j, k); return A[n] === 1; }, use = (i, j, k) => { const [A, n] = crack(i, j, k); A[n] = 1; };
  const deg = (i, j) => [0, 1, 2, 3].reduce((s, k) => s + (has(i, j, k) ? 1 : 0), 0);
  const isJ = (i, j) => { const d = deg(i, j); return d >= 3 || d === 2 && (i === 0 || i === nx) && (j === 0 || j === ny); };
  const chains = [];
  const walk = (i, j, k) => {
    const pts = [[i, j]], L = leftOf(i, j, k), Rr = rightOf(i, j, k), k0 = k;
    for (;;) {
      use(i, j, k); i += D[k][0]; j += D[k][1]; pts.push([i, j]);
      if (isJ(i, j)) break;
      let nk = -1; for (let m = 0; m < 4; m++) if (m !== (k + 2) % 4 && has(i, j, m)) { nk = m; break; }
      if (nk < 0 || used(i, j, nk)) break;
      k = nk;
    }
    chains.push({ pts, L, R: Rr, k0, k1: k });
  };
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) if (isJ(i, j)) for (let k = 0; k < 4; k++) if (has(i, j, k) && !used(i, j, k)) walk(i, j, k);
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) for (const k of [0, 1]) if (has(i, j, k) && !used(i, j, k)) walk(i, j, k);   // the islands: a loop, no junction
  const tol = o.bricks ? 1e-6 : o.straight ?? STRAIGHT_NEW;                       // Bricks: the grid's steps kept, LEGO's
  for (const C of chains) {
    let P = C.pts.map(([i, j]) => [X(i), Y(j)]);
    const closed = C.pts.length > 2 && C.pts[0][0] === C.pts.at(-1)[0] && C.pts[0][1] === C.pts.at(-1)[1];
    for (let it = 0; it < (o.bricks ? 0 : 2); it++) P = P.map((p, m) => m === 0 || m === P.length - 1 ? p : [(P[m - 1][0] + 2 * p[0] + P[m + 1][0]) / 4, (P[m - 1][1] + 2 * p[1] + P[m + 1][1]) / 4]);
    if (closed) { const far = P.reduce((b, p, m) => len(sub(p, P[0])) > len(sub(P[b], P[0])) ? m : b, 0); C.mm = [...straightened(P.slice(0, far + 1), tol), ...straightened(P.slice(far), tol).slice(1)]; }
    else C.mm = straightened(P, tol);
    C.a = `${C.pts[0][0]},${C.pts[0][1]}`; C.b = `${C.pts.at(-1)[0]},${C.pts.at(-1)[1]}`; C.closed = closed; C.smooth = P; C.tol = tol;
  }
  // two borders straightened across each other (the red one's floor, its outline through itself): those again, half as
  // straight, four times at most, then as they were
  for (let round = 0; round < 5; round++) {
    const bad = crossingChains(chains);
    if (!bad.size) break;
    for (const k of bad) {
      const C = chains[k], P = C.smooth;
      C.tol = round === 4 ? 0 : C.tol / 2;
      if (!C.tol) { C.mm = P; continue; }
      if (C.closed) { const far = P.reduce((b, p, m) => len(sub(p, P[0])) > len(sub(P[b], P[0])) ? m : b, 0); C.mm = [...straightened(P.slice(0, far + 1), C.tol), ...straightened(P.slice(far), C.tol).slice(1)]; }
      else C.mm = straightened(P, C.tol);
    }
  }
  // every region's loops: its chains with it on the left, end to end; at a junction it touches twice, the sharpest turn left
  const forms = [];
  for (let r = 0; r < rid.size; r++) {
    const mine = [];
    for (const C of chains) { if (C.L === r) mine.push({ pts: C.mm, a: C.a, b: C.b, k0: C.k0, k1: C.k1, closed: C.closed }); if (C.R === r) mine.push({ pts: C.mm.slice().reverse(), a: C.b, b: C.a, k0: (C.k1 + 2) % 4, k1: (C.k0 + 2) % 4, closed: C.closed }); }
    const from = new Map(); mine.forEach((c, n) => (from.get(c.a) ?? from.set(c.a, []).get(c.a)).push(n));
    const done = new Set(), loops = [];
    for (let n = 0; n < mine.length; n++) {
      if (done.has(n)) continue;
      done.add(n); let c = mine[n];
      const L = c.pts.slice(0, -1);
      for (let guard = 0; !c.closed && c.b !== mine[n].a && guard < mine.length; guard++) {
        const opts = (from.get(c.b) ?? []).filter(m => !done.has(m));
        if (!opts.length) break;
        const turn = m => { const a = D[c.k1], b = D[mine[m].k0], cr = cross(a, b), dt = dot(a, b); return Math.atan2(cr, dt); };
        const m = opts.reduce((x, y) => turn(y) > turn(x) ? y : x);
        done.add(m); c = mine[m]; L.push(...c.pts.slice(0, -1));
      }
      if (L.length >= 3) loops.push(L);
    }
    const outs = loops.filter(L => areaOf(L) > 0), holes = loops.filter(L => areaOf(L) < 0);
    for (const O of outs) {
      const hs = holes.filter(Hh => inPoly(O, mul(add(Hh[0], Hh[1]), 0.5)));
      const id = regLab[r] >= 0 ? names[regLab[r] % BG] : null;
      forms.push({ id: forms.length, pencil: id, loops: [O, ...hs], area: areaOf(O) + hs.reduce((s, Hh) => s + areaOf(Hh), 0), bg: id === null || regLab[r] >= BG });
    }
  }
  return forms;
}
// the chains whose straightened pieces cross another's, or their own (not at a shared end)
function crossingChains(chains) {
  const segs = [], B = 20, grid = new Map(), bad = new Set();
  chains.forEach((C, k) => C.mm.forEach((a, i) => { if (i + 1 < C.mm.length) segs.push({ k, i, a, b: C.mm[i + 1], n: C.mm.length - 1 }); }));
  segs.forEach((S, m) => { for (let x = Math.floor(Math.min(S.a[0], S.b[0]) / B); x <= Math.floor(Math.max(S.a[0], S.b[0]) / B); x++) for (let y = Math.floor(Math.min(S.a[1], S.b[1]) / B); y <= Math.floor(Math.max(S.a[1], S.b[1]) / B); y++) { const key = `${x},${y}`; (grid.get(key) ?? grid.set(key, []).get(key)).push(m); } });
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const done = new Set();
  for (const list of grid.values()) for (let x = 0; x < list.length; x++) for (let y = x + 1; y < list.length; y++) {
    const m = Math.min(list[x], list[y]), n = Math.max(list[x], list[y]), key = m * 1e6 + n;
    if (done.has(key)) continue; done.add(key);
    const S = segs[m], T = segs[n];
    if (S.k === T.k && Math.abs(S.i - T.i) <= 1) continue;
    const d1 = cr(S.a, S.b, T.a), d2 = cr(S.a, S.b, T.b), d3 = cr(T.a, T.b, S.a), d4 = cr(T.a, T.b, S.b), e = 1e-9;
    if ((d1 > e && d2 < -e || d1 < -e && d2 > e) && (d3 > e && d4 < -e || d3 < -e && d4 > e)) { bad.add(S.k); bad.add(T.k); }
  }
  return bad;
}
const inPoly = (P, q) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > q[1]) !== (b[1] > q[1]) && q[0] < (b[0] - a[0]) * (q[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };

// ---------- the knife ----------
const inForm = (F, q) => inPoly(F.loops[0], q) && !F.loops.slice(1).some(Hh => inPoly(Hh, q));
// A form cut by the knife, from a to b (the owner, 2026-10-30, the red one without its background: "shall we break
// the red body into separate elements that can be changed? the wings, the door, the frame, the headlights, the
// bumper"): every stretch of the stroke inside the form, from its border to its border, a cut — through a window
// too, from the outline to the hole and on — → its pieces, the border points the cut made (one piece: it cut nothing)
export function cutForm(F, a, b) {
  const snap = snapper(), ab = sub(b, a), hits = [];
  F.loops.forEach((L, li) => L.forEach((p, i) => {
    const q = L[(i + 1) % L.length], e = sub(q, p), den = cross(ab, e);
    if (Math.abs(den) < 1e-12) return;
    const t = cross(sub(p, a), e) / den, u = cross(sub(p, a), ab) / den;
    if (t > 1e-9 && t < 1 - 1e-9 && u >= 0 && u < 1) hits.push({ li, i, u, t, X: snap(u < 1e-9 ? p : add(p, mul(e, u))) });
  }));
  hits.sort((x, y) => x.t - y.t);
  const chords = [];
  for (let k = 0; k + 1 < hits.length; k++) if (hits[k].X !== hits[k + 1].X && inForm(F, add(a, mul(ab, (hits[k].t + hits[k + 1].t) / 2)))) chords.push([hits[k].X, hits[k + 1].X]);
  if (!chords.length) return { forms: [F], points: [] };
  const loops = F.loops.map((L, li) => L.flatMap((p, i) => [snap(p), ...hits.filter(h => h.li === li && h.i === i && h.u > 1e-9).sort((x, y) => x.u - y.u).map(h => h.X)]).filter((p, i, A) => p !== A[(i + 1) % A.length]));
  const E = [];
  for (const L of loops) L.forEach((p, i) => E.push({ a: p, b: L[(i + 1) % L.length] }));
  for (const [X, Y] of chords) E.push({ a: X, b: Y }, { a: Y, b: X });
  const out = new Map(); for (const e of E) (out.get(e.a) ?? out.set(e.a, []).get(e.a)).push(e);
  const used = new Set(), faces = [];
  for (const e0 of E) {
    if (used.has(e0)) continue;
    const P = [];
    for (let e = e0, guard = 0; e && !used.has(e) && guard < 1e5; guard++) {
      used.add(e); P.push(e.a);
      const d = unit(sub(e.b, e.a)), opts = (out.get(e.b) ?? []).filter(f => !used.has(f) && (f.b !== e.a || (out.get(e.b) ?? []).length === 1));
      const turn = f => { const v = unit(sub(f.b, f.a)); return Math.atan2(cross(d, v), dot(d, v)); };
      e = opts.length ? opts.reduce((x, y) => turn(y) > turn(x) ? y : x) : null;
    }
    if (P.length >= 3) faces.push(P);
  }
  const outs = faces.filter(P => areaOf(P) > 1e-6), holes = faces.filter(P => areaOf(P) < -1e-6);
  const forms = outs.map(O => {
    const hs = holes.filter(Hh => inPoly(O, mul(add(Hh[0], Hh[1]), 0.5)) && !holes.some(K => K !== Hh && false));
    return { ...F, loops: [O, ...hs], area: areaOf(O) + hs.reduce((s2, Hh) => s2 + areaOf(Hh), 0) };
  });
  return { forms, points: [...new Set(hits.map(h => h.X))] };
}
// the knife over the forms: every one it crosses cut — or those only(F) says — the border points it made put into
// every neighbour's edges too, so a shared border stays shared, point for point; the pieces new ids → the forms
export function cutForms(forms, a, b, only = () => true) {
  let next = Math.max(-1, ...forms.map(F => F.id)) + 1;
  const res = [], pts = [];
  for (const F of forms) {
    const { forms: parts, points } = only(F) ? cutForm(F, a, b) : { forms: [F], points: [] };
    if (parts.length < 2) { res.push(F); continue; }
    pts.push(...points);
    parts.sort((x, y) => y.area - x.area).forEach((P, k) => res.push(k ? { ...P, id: next++ } : P));
  }
  if (!pts.length) return forms;
  return res.map(F => ({ ...F, loops: F.loops.map(L => L.flatMap((p, i) => {
    const q = L[(i + 1) % L.length], e = sub(q, p), L2 = dot(e, e);
    if (L2 < 1e-12) return [p];
    const ins = pts.filter(X => { const u = dot(sub(X, p), e) / L2; return u > 1e-9 && u < 1 - 1e-9 && Math.abs(cross(e, sub(X, p))) / Math.sqrt(L2) < HAIR; }).sort((x, y) => dot(sub(x, p), e) - dot(sub(y, p), e));
    return [p, ...ins];
  })) }));
}

// Reflect (the owner, 2026-10-30, the car's front, its right mirror lost, Screenshot 1.16.15 PM: "a new tool, mirror — then the
// left part is simply mirrored; that is, the knife and the mirrored copy"): every form cut along the axis through a and b,
// the far side gone, the kept one (keep: +1 left of a → b, −1 right) and its mirror image; a point on the axis the same
// on both, the halves sharing it; the copy reading the photo through the mirror, its sausages mirrored. → the forms
export function reflectForms(forms, a, b, keep = 1) {
  const u = unit(sub(b, a)), nrm = left(u), far = 1e5, A = sub(a, mul(u, far)), B = add(a, mul(u, far));
  const cut = cutForms(forms, A, B), side = P => { const c = P.reduce((q, p) => add(q, mul(p, 1 / P.length)), [0, 0]); return Math.sign(dot(sub(c, a), nrm)); };
  const H = [1 - 2 * nrm[0] * nrm[0], -2 * nrm[0] * nrm[1], -2 * nrm[0] * nrm[1], 1 - 2 * nrm[1] * nrm[1]], r = mul(nrm, 2 * dot(a, nrm));
  const mir = q => Math.abs(dot(sub(q, a), nrm)) < 1e-7 ? q : [H[0] * q[0] + H[1] * q[1] + r[0], H[2] * q[0] + H[3] * q[1] + r[1]];
  const kept = cut.filter(F => side(F.loops[0]) === keep);
  let next = Math.max(-1, ...forms.map(F => F.id)) + 1;
  const copies = kept.map(F => ({ ...F, id: next++, loops: F.loops.map(L => L.map(mir).reverse()), read: readThrough(F.read, H, r), ...(F.parts?.length ? { parts: F.parts.map(q => ({ loop: q.loop.map(mir).reverse(), read: readThrough(q.read, H, r) })) } : {}), ...(Array.isArray(F.ss) ? { ss: F.ss.map(q => ({ ...q, a: mir(q.a), b: mir(q.b) })) } : {}) }));
  return kept.length ? [...kept, ...copies] : forms;
}

// ---------- the rings: the straight skeleton ----------
// a loop's points, the repeated, the straight on and the spikes out
function cleanLoop(P0) {
  let P = P0.filter((p, i) => len(sub(p, P0[(i + 1) % P0.length])) > 1e-7);
  for (let changed = true; changed && P.length >= 3;) {
    changed = false;
    for (let i = 0; i < P.length && P.length >= 3; i++) {
      const a = P[(i + P.length - 1) % P.length], b = P[i], c = P[(i + 1) % P.length], u = unit(sub(b, a)), v = unit(sub(c, b));
      if (Math.abs(cross(u, v)) < 1e-9) { P.splice(i, 1); i--; changed = true; }    // straight on, or a spike back
    }
  }
  return P;
}
// A form's lines — every edge of its loops, and at every concave corner its
// facets, OPM-W's: every one the same turn, 90° over Corner facets — each
// moving in a mm a mm of time, n·x = c + t; its corners, a vertex each.
function linesOf2(loops, facets) {
  const lines = [], starts = [];
  for (const P0 of loops) {
    const P = cleanLoop(P0), n = P.length;
    if (n < 3) continue;
    const base = lines.length, V = [];
    for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n], d = unit(sub(b, a)), nn = left(d); lines.push({ d, n: nn, c: dot(nn, a), at: mul(add(a, b), 0.5), a, b }); }
    for (let i = 0; i < n; i++) {
      const ea = base + (i + n - 1) % n, eb = base + i, A = lines[ea], B = lines[eb], turn = Math.atan2(cross(A.d, B.d), dot(A.d, B.d));   // < 0: concave
      const k = facets > 0 && turn < 0 ? Math.round(-turn / (Math.PI / 2 / facets)) : 0;
      if (!k) { V.push({ p: P[i], ea, eb }); continue; }
      let prev = ea;
      const th0 = Math.atan2(A.n[1], A.n[0]);
      for (let j = 0; j < k; j++) {
        const th = th0 + turn * (j + 0.5) / k, nn = [Math.cos(th), Math.sin(th)];
        lines.push({ d: [nn[1], -nn[0]], n: nn, c: dot(nn, P[i]), at: P[i], a: P[i], b: P[i], facet: true });
        V.push({ p: P[i], ea: prev, eb: lines.length - 1 }); prev = lines.length - 1;
      }
      V.push({ p: P[i], ea: prev, eb });
    }
    starts.push(V);
  }
  return { lines, starts };
}
// The wavefront from time 0 on: its events — a side shrunk to nothing, a
// concave corner running into a side — one after another; between two stops
// (the events and the rings' times) every side's piece sweeps a trapezoid.
// → { traps: [{ e, band, pts, kinds }], depth: the last event's time, ok }
function sweep(lines, starts, times = null, snaps = []) {
  const record = !!times; times = times ?? [];
  const live = new Set(), traps = [], shots = [];
  let si = 0;
  let uid = 0, ok = true;
  const make = (p, t, ea, eb) => { const v = { id: uid++, p, t, ea, eb, w: null, reflex: false, prev: null, next: null }; live.add(v); return v; };
  const at = (v, t) => v.w ? [v.p[0] + v.w[0] * (t - v.t), v.p[1] + v.w[1] * (t - v.t)] : v.p;
  const link = (a, b) => { a.next = b; b.prev = a; };
  const kill = v => live.delete(v);
  const killLoop = v => { for (let u = v, guard = 0; live.has(u) && guard < 1e5; u = u.next, guard++) kill(u); };
  const replace = (old, nu) => { link(old.prev, nu); link(nu, old.next); kill(old); };
  function fix(u, T) {                                                               // its speed, or out: one line on, a spike
    if (!live.has(u)) return;
    const A = lines[u.ea], B = lines[u.eb], det = cross(A.n, B.n);
    if (u.ea === u.eb || Math.abs(det) < 1e-9 && dot(A.n, B.n) > 0) {                // one line on: no corner
      const a = u.prev, b = u.next; kill(u);
      if (a === u || b === u || a === b) { killLoop(a); return; }
      link(a, b); b.ea = a.eb; return;
    }
    if (Math.abs(det) < 1e-9) {                                                      // a spike, the line back along itself: the shorter overlap off
      const a = u.prev, b = u.next; kill(u);
      if (a === b || a.prev === b) { killLoop(a); return; }
      link(a, b);
      if (len(sub(at(a, T), u.p)) >= len(sub(at(b, T), u.p))) { const nb = make(at(b, T), T, a.eb, b.eb); replace(b, nb); fix(nb, T); }
      else { const na = make(at(a, T), T, a.ea, b.ea); replace(a, na); fix(na, T); }
      return;
    }
    u.w = [(B.n[1] - A.n[1]) / det, (A.n[0] - B.n[0]) / det]; u.reflex = cross(A.d, B.d) < -1e-9;
  }
  function check(v, T) {                                                             // a loop of two, or of no area: gone
    if (!v || !live.has(v)) return;
    let n = 0, A = 0, u = v;
    do { const p = at(u, T), q = at(u.next, T); A += cross(p, q); n++; u = u.next; } while (u !== v && n < 1e5);
    if (n < 3 || Math.abs(A) / 2 < 1e-7) killLoop(v);
  }
  for (const V of starts) {
    const vs = V.map(q => make(q.p, 0, q.ea, q.eb));
    vs.forEach((v, i) => link(v, vs[(i + 1) % vs.length]));
    vs.forEach(v => fix(v, 0));
    check(vs.find(v => live.has(v)), 0);
  }
  function next(T) {
    let best = null;
    for (const v of live) {
      const nx = v.next, L = lines[v.eb], l0 = dot(L.d, sub(at(nx, T), at(v, T))), sl = dot(L.d, sub(nx.w, v.w));
      let t = Infinity;
      if (l0 < -1e-7) t = T; else if (sl < -1e-12) t = T + Math.max(0, l0) / -sl;
      if (t < (best?.t ?? Infinity)) best = { kind: 'edge', v, t };
      if (!v.reflex) continue;
      const pv = at(v, T);
      for (const a of live) {
        const j = a.eb;
        if (j === v.ea || j === v.eb || a === v || a.next === v) continue;
        const Lj = lines[j], Dd = dot(Lj.n, pv) - Lj.c - T, rate = dot(Lj.n, v.w) - 1;
        if (Dd < -1e-7 || rate > -1e-12) continue;
        const ts = T + Math.max(0, Dd) / -rate;
        if (ts >= (best?.t ?? Infinity) - 1e-10) continue;
        const q = at(v, ts), s0 = dot(Lj.d, at(a, ts)), s1 = dot(Lj.d, at(a.next, ts)), sq = dot(Lj.d, q);
        if (s1 < s0 - 1e-9 || sq < s0 - 1e-7 || sq > s1 + 1e-7) continue;
        best = { kind: 'split', v, a, t: ts, q };
      }
    }
    return best;
  }
  let T = 0, band = 0, ringAt = true, guard = 0;
  const limit = 15 * (lines.length + 10);                                           // a wavefront stuck: given up, not run for ever
  while (live.size) {
    if (++guard > limit) { ok = false; break; }
    const E = next(T), tE = E ? E.t : Infinity, tR = band < times.length ? times[band] : Infinity, tS = si < snaps.length ? snaps[si] : Infinity, tau = Math.min(tE, tR, tS);
    if (!isFinite(tau)) { ok = false; break; }
    if (tau > T + 1e-12) {
      if (record) {
      const ringTop = tR <= Math.min(tE, tS) + 1e-9;
      for (const v of live) {
        const nx = v.next;
        traps.push({ e: v.eb, band, pts: [at(v, T), at(nx, T), at(nx, tau), at(v, tau)], kinds: [ringAt ? band : INNER, RAY, ringTop ? band + 1 : INNER, RAY] });
      }
      }
      T = tau; ringAt = false;
    }
    if (tS <= T + 1e-9) {                                                            // a snapshot: the wavefront's loops here, every point its side's line
      const seen = new Set(), loops = [];
      for (const v of live) { if (seen.has(v)) continue; const pts = [], es = []; let u = v, gd = 0; do { seen.add(u); pts.push(at(u, T)); es.push(u.eb); u = u.next; } while (u !== v && ++gd < 1e5); loops.push({ pts, es }); }
      shots.push({ t: T, loops }); si++; continue;
    }
    if (tR <= tE + 1e-9 && tR <= T + 1e-9) { band++; ringAt = true; continue; }
    if (!E || tE > T + 1e-9) continue;
    if (E.kind === 'edge') {
      const v = E.v, nx = v.next, P = mul(add(at(v, T), at(nx, T)), 0.5), a = v.prev, b = nx.next;
      if (nx.next === v || a === nx) { killLoop(v); continue; }
      kill(v); kill(nx);
      if (a === b) { kill(a); continue; }
      const u = make(P, T, v.ea, nx.eb); link(a, u); link(u, b); fix(u, T);
      check(live.has(u) ? u : live.has(a) ? a : b, T);
    } else {
      const v = E.v, a = E.a, b = a.next, j = a.eb, pv = v.prev, nv = v.next;
      kill(v);
      const v1 = make(E.q, T, v.ea, j), v2 = make(E.q, T, j, v.eb);
      link(pv, v1); link(v1, b); link(a, v2); link(v2, nv);
      fix(v1, T); fix(v2, T);
      check(live.has(v1) ? v1 : b, T); check(live.has(v2) ? v2 : a, T);
    }
  }
  while (si < snaps.length) { shots.push({ t: snaps[si], loops: [] }); si++; }       // past the last event: nothing left
  return { traps, depth: T, ok, shots };
}

// ---------- the cells ----------
// one point a place: a neighbour's the same object, to the last digit
function snapper() {
  const seen = new Map();
  return v => {
    const gx = Math.round(v[0] / (10 * HAIR)), gy = Math.round(v[1] / (10 * HAIR));
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const u of seen.get(`${gx + i},${gy + j}`) ?? []) if (Math.abs(u[0] - v[0]) <= HAIR && Math.abs(u[1] - v[1]) <= HAIR) return u;
    (seen.get(`${gx},${gy}`) ?? seen.set(`${gx},${gy}`, []).get(`${gx},${gy}`)).push(v);
    return v;
  };
}
// the trapezoids of one side in one band, one polygon or more: the edges two of them share off
function unionOf(polys, snap) {
  const P = polys.map(q => ({ pts: q.pts.map(snap), kinds: q.kinds })), pts = [...new Set(P.flatMap(q => q.pts))], E = new Map();
  const ek = (a, b) => `${keyOf(a)}>${keyOf(b)}`;
  for (const q of P) q.pts.forEach((a, m) => {
    const b = q.pts[(m + 1) % q.pts.length], ab = sub(b, a), L2 = dot(ab, ab);
    if (L2 < 1e-14) return;
    const ins = pts.filter(p => p !== a && p !== b).map(p => [dot(sub(p, a), ab) / L2, p]).filter(([u, p]) => u > 1e-9 && u < 1 - 1e-9 && Math.abs(cross(ab, sub(p, a))) / Math.sqrt(L2) < HAIR).sort((x, y) => x[0] - y[0]).map(x => x[1]);
    [a, ...ins, b].forEach((p, i, A) => {
      if (i === A.length - 1) return;
      const r = A[i + 1], k = ek(p, r), back = ek(r, p);
      if (E.has(back)) E.delete(back); else E.set(k, { a: p, b: r, kind: q.kinds[m] });
    });
  });
  const out = new Map();
  for (const e of E.values()) (out.get(keyOf(e.a)) ?? out.set(keyOf(e.a), []).get(keyOf(e.a))).push(e);
  const used = new Set(), loops = [];
  for (const e0 of E.values()) {
    if (used.has(e0)) continue;
    const pts2 = [], kinds = [];
    for (let e = e0, guard = 0; e && !used.has(e) && guard < 1e4; guard++) {
      used.add(e); pts2.push(e.a); kinds.push(e.kind);
      const opts = (out.get(keyOf(e.b)) ?? []).filter(f => !used.has(f)), d = unit(sub(e.b, e.a));
      e = opts.length < 2 ? opts[0] : opts.reduce((x, y) => { const tx = Math.atan2(cross(d, unit(sub(x.b, x.a))), dot(d, unit(sub(x.b, x.a)))), ty = Math.atan2(cross(d, unit(sub(y.b, y.a))), dot(d, unit(sub(y.b, y.a)))); return ty > tx ? y : x; });
    }
    // straight on with one kind: one edge
    for (let changed = true; changed && pts2.length > 3;) {
      changed = false;
      for (let i = 0; i < pts2.length && pts2.length > 3; i++) {
        const a = pts2[(i + pts2.length - 1) % pts2.length], b = pts2[i], c = pts2[(i + 1) % pts2.length], ka = kinds[(i + pts2.length - 1) % pts2.length];
        if (ka === kinds[i] && Math.abs(cross(unit(sub(b, a)), unit(sub(c, b)))) < 1e-9 && dot(sub(b, a), sub(c, b)) > 0) { pts2.splice(i, 1); kinds.splice(i, 1); i--; changed = true; }
      }
    }
    if (pts2.length >= 3 && areaOf(pts2) > 1e-6) loops.push({ pts: pts2, kinds: kinds.map(k => k === INNER ? RAY : k) });
  }
  return loops;
}
// a convex cell cut by the line d·x = s: its two pieces, the cut a ray's kind
function cutConvex(poly, kinds, d, s, snap) {
  const f = poly.map(p => dot(d, p) - s), A = { poly: [], kinds: [] }, B = { poly: [], kinds: [] };
  poly.forEach((p, i) => {
    const j = (i + 1) % poly.length, q = poly[j], fp = f[i], fq = f[j], k = kinds[i];
    const X = (fp < 0) !== (fq < 0) && Math.abs(fp - fq) > 1e-12 ? snap(add(p, mul(sub(q, p), fp / (fp - fq)))) : null;
    for (const [O, sg] of [[A, -1], [B, 1]]) {
      const inP = sg < 0 ? fp <= 1e-9 : fp >= -1e-9, inQ = sg < 0 ? fq <= 1e-9 : fq >= -1e-9;
      if (inP) { O.poly.push(p); O.kinds.push(inQ ? k : X ? k : RAY); if (!inQ && X) { O.poly.push(X); O.kinds.push(RAY); } }
      else if (inQ && X) { O.poly.push(X); O.kinds.push(k); }
    }
  });
  const tidy = O => { const P = [], K = []; O.poly.forEach((p, i) => { if (P.length && P.at(-1) === p) { K[K.length - 1] = O.kinds[i]; return; } P.push(p); K.push(O.kinds[i]); }); if (P.length > 1 && P[0] === P.at(-1)) { P.pop(); K.pop(); } return { poly: P, kinds: K }; };
  return [tidy(A), tidy(B)].filter(O => O.poly.length >= 3 && areaOf(O.poly) > 1e-6);
}
const convex = P => P.every((p, i) => cross(sub(P[(i + 1) % P.length], p), sub(P[(i + 2) % P.length], P[(i + 1) % P.length])) > -1e-9);
// a row's colours: square slices SAMPLE long, the photo's nearest in each, read across the band's middle half
function cutsOf(C, L, img, near, minLen, t0, t1, brick = 0) {
  const ss = C.poly.map(p => dot(L.d, p)), s0 = Math.min(...ss), s1 = Math.max(...ss);
  // where a square cut crosses from its outer row line to its inner one: both lines' common stretch
  const span = k => { const e = C.poly.flatMap((p, i) => C.kinds[i] === k ? [dot(L.d, p), dot(L.d, C.poly[(i + 1) % C.poly.length])] : []); return e.length ? [Math.min(...e), Math.max(...e)] : null; };
  const o = span(C.ring0), n = span(C.ring0 + 1);
  if (!o || !n) return [];
  const lo = Math.max(o[0], n[0]), hi = Math.min(o[1], n[1]);
  if (hi - lo < (brick ? minLen : 2 * minLen) - 1e-9) return [];
  // the row's pieces: SAMPLE long; Bricks, a brick each, from the brush's grid (o.brick, its length)
  const edges = brick ? [s0, ...Array.from({ length: Math.max(0, Math.ceil(s1 / brick - 1e-9) - Math.floor(s0 / brick + 1e-9) - 1) }, (_, m) => (Math.floor(s0 / brick + 1e-9) + 1 + m) * brick), s1] : Array.from({ length: Math.max(1, Math.round((s1 - s0) / SAMPLE)) + 1 }, (_, m) => s0 + (s1 - s0) * m / Math.max(1, Math.round((s1 - s0) / SAMPLE)));
  const ids = [];
  for (let m = 0; m + 1 < edges.length; m++) {
    const acc = [0, 0, 0], k = brick ? 3 : 1;
    let got = 0;
    for (let a = 0; a < k; a++) for (const f of [0.25, 0.5, 0.75]) { const sv = edges[m] + (edges[m + 1] - edges[m]) * (a + 0.5) / k, t = t0 + (t1 - t0) * f, q = add(mul(L.d, sv), mul(L.n, L.c + t)); got += pix(img, q[0], q[1], acc); }
    ids.push(got ? near(acc.map(v => v / got)) : null);
  }
  const runs = [];                                                                    // [{ id, a, b }] along the row
  ids.forEach((id, m) => { if (runs.length && runs.at(-1).id === id) runs.at(-1).b = edges[m + 1]; else runs.push({ id, a: edges[m], b: edges[m + 1] }); });
  for (let changed = true; changed && runs.length > 1;) {                            // a run shorter than minLen in with the longer neighbour
    changed = false;
    let mi = -1;
    runs.forEach((r, m) => { if (r.b - r.a < minLen && (mi < 0 || r.b - r.a < runs[mi].b - runs[mi].a)) mi = m; });
    if (mi < 0) break;
    const r = runs[mi], pv = runs[mi - 1], nx = runs[mi + 1], to = !pv ? nx : !nx ? pv : (pv.b - pv.a >= nx.b - nx.a ? pv : nx);
    if (to === pv) pv.b = r.b; else nx.a = r.a;
    runs.splice(mi, 1);
    for (let m = runs.length - 1; m > 0; m--) if (runs[m].id === runs[m - 1].id) { runs[m - 1].b = runs[m].b; runs.splice(m, 1); }
    changed = true;
  }
  return runs.slice(1).map(r => r.a).filter(s => brick ? s > lo + 1e-6 && s < hi - 1e-6 : s > lo + minLen / 2 && s < hi - minLen / 2);
}
// a row line's id, OPM-P's: its figure, its key (0), its block (the side's line), its depth
const rowId = (f, blk, k) => (f * 100 * 1000 + blk) * 1000 + k;
// Glass's and rubber's rings rounded (the owner, 2026-10-30: "half-round forms and curls, no sharp geometry"; then,
// its first try rounding the outline and the neighbours' with it: "the glass caught the whole geometry"): the form's
// outline as it is, shared with its neighbours, and every ring inside it, ring k, its convex corners an arc of k
// steps at most, Corners mm at most, no more than half of either side — sharp at the outline, half-round further
// in, a curl in the middle. The arc halved on the corner's ray: a half to the cell either side, the ray straight on.
function roundRings(cells, shots, lines, Rmax, s, snap) {
  const at = new Map(), plans = [];
  cells.forEach((c, ci) => c.poly.forEach((p, j) => (at.get(p) ?? at.set(p, []).get(p)).push([ci, j])));
  shots.forEach((sh, k0) => {
    for (const Lp of sh.loops) {
      const m = Lp.pts.length;
      for (let i = 0; i < m; i++) {
        const V = snap(Lp.pts[i]), A = lines[Lp.es[(i + m - 1) % m]], B = lines[Lp.es[i]], turn = Math.atan2(cross(A.d, B.d), dot(A.d, B.d));
        if (turn < ROUND_TURN) continue;
        const la = len(sub(Lp.pts[i], Lp.pts[(i + m - 1) % m])), lb = len(sub(Lp.pts[(i + 1) % m], Lp.pts[i])), R = Math.min(Rmax, (k0 + 1) * s, Math.min(la, lb) / 2 / Math.tan(turn / 2));
        if (R < 0.5) continue;
        const d = R * Math.tan(turn / 2), Tin = sub(V, mul(A.d, d)), cen = add(Tin, mul(left(A.d), R)), a0 = Math.atan2(Tin[1] - cen[1], Tin[0] - cen[0]), nk = 2 * Math.max(1, Math.ceil(turn / (ARC_DEG * Math.PI / 180) / 2));
        const arc = Array.from({ length: nk + 1 }, (_, j) => j === 0 ? Tin : j === nk ? add(V, mul(B.d, d)) : [cen[0] + R * Math.cos(a0 + turn * j / nk), cen[1] + R * Math.sin(a0 + turn * j / nk)]).map(snap);
        const toIn = arc.slice(0, nk / 2 + 1).reverse(), toOut = arc.slice(nk / 2), edits = [];   // from the ray's point on, to either side
        let fine = true;
        for (const [ci, j] of at.get(V) ?? []) {
          const c = cells[ci], n2 = c.poly.length, P = c.poly[(j + n2 - 1) % n2], N = c.poly[(j + 1) % n2], kin = c.kinds[(j + n2 - 1) % n2], kout = c.kinds[j];
          const sideOf = Q => { const u = unit(sub(Q, V)); return len(sub(Q, V)) < d - 1e-6 ? null : dot(u, A.d) < -0.5 ? toIn : dot(u, B.d) > 0.5 ? toOut : null; };
          if (kout !== RAY && kin === RAY) { const side = sideOf(N); if (!side) { fine = false; break; } edits.push({ ci, j, pts: side, kinds: side.map(() => kout) }); }
          else if (kin !== RAY && kout === RAY) { const side = sideOf(P); if (!side) { fine = false; break; } const pts = side.slice().reverse(); edits.push({ ci, j, pts, kinds: pts.map((_, z) => z === pts.length - 1 ? kout : kin) }); }
          else { fine = false; break; }
        }
        if (fine && edits.length) plans.push(...edits);
      }
    }
  });
  const byCell = new Map();
  for (const e of plans) (byCell.get(e.ci) ?? byCell.set(e.ci, []).get(e.ci)).push(e);
  for (const [ci, es] of byCell) { const c = cells[ci]; es.sort((x, y) => y.j - x.j); for (const e of es) { c.poly.splice(e.j, 1, ...e.pts); c.kinds.splice(e.j, 1, ...e.kinds); } }
}
// A form's cells: { region, cells: [{ reg, blk, row, p, poly, kinds, area, seq, mid, ends, ray }] }
function formCells(F, f, img0, near, o, snap) {
  const img = o.shifted === false ? img0 : readOf(img0, F);
  const pitch = o.pitch ?? PITCH_NEW, { lines, starts } = linesOf2(F.loops, o.bricks ? 0 : o.facets ?? FACETS_NEW);   // Bricks: every corner sharp, the rows square
  const round = !o.bricks && (F.material === 'glass' || F.material === 'rubber') ? o.corner ?? CORNER_NEW : 0;
  const box = F.loops[0].reduce((b, p) => ({ x0: Math.min(b.x0, p[0]), y0: Math.min(b.y0, p[1]), x1: Math.max(b.x1, p[0]), y1: Math.max(b.y1, p[1]) }), { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity });
  if (!starts.length || lines.length > 999) return null;
  const first = sweep(lines, starts), n = rowsIn(first.depth, pitch), s = first.depth / n;
  const times = Array.from({ length: n - 1 }, (_, k) => (k + 1) * s), { traps, ok, shots } = sweep(lines, starts, times, round > 0 ? times : []);
  const region = { rect: f, key: 0, kind: 'form', a: box, blocks: lines.map(L => ({ at: L.at, n })), bands: n, depth: first.depth, step: s, ok: ok && first.ok, lines, material: F.material ?? 'metal', colour: F.colour ?? null, flat: !!F.flat };
  if (!region.ok) return { region, cells: [] };                                       // the wavefront stuck: the form left empty, said, never cells of nothing
  const groups = new Map(), base = [];
  for (const q of traps) { const k = `${q.e}:${q.band}`; (groups.get(k) ?? groups.set(k, []).get(k)).push(q); }
  for (const list of groups.values()) for (const U of unionOf(list, snap)) base.push({ e: list[0].e, band: list[0].band, poly: U.pts, kinds: U.kinds });
  if (round > 0) roundRings(base, shots, lines, round, s, snap);
  const cells = [], minLen = (o.shortest ?? SHORTEST_NEW) * pitch;
  for (const { e, band, poly, kinds } of base) {
    const L = lines[e], t0 = band * s, t1 = Math.min(first.depth, (band + 1) * s);
    let pieces = [{ poly, kinds }];
    if (img && near && convex(poly)) {
      const cuts = cutsOf({ poly, kinds, ring0: band }, L, img, near, minLen, t0, t1, o.bricks ? pitch : 0);
      for (const c of cuts) pieces = pieces.flatMap(P => { const ss = P.poly.map(p => dot(L.d, p)); return c > Math.min(...ss) + 1e-6 && c < Math.max(...ss) - 1e-6 ? cutConvex(P.poly, P.kinds, L.d, c, snap) : [P]; });
    }
    for (const P of pieces) {
      const depth = p => dot(L.n, p) - L.c, ds = P.poly.map(depth), tm = (Math.min(...ds) + Math.max(...ds)) / 2;
      const xs = [];                                                                  // the row's middle through it: the line at depth tm, from its first crossing to its last
      P.poly.forEach((p, i) => { const q = P.poly[(i + 1) % P.poly.length], a = depth(p) - tm, b = depth(q) - tm; if ((a <= 0) !== (b <= 0)) xs.push(dot(L.d, add(p, mul(sub(q, p), a / (a - b))))); });
      const sa = xs.length ? Math.min(...xs) : Math.min(...P.poly.map(p => dot(L.d, p))), sb = xs.length ? Math.max(...xs) : sa, on = sv => add(mul(L.d, sv), mul(L.n, L.c + tm));
      cells.push({ reg: f, blk: e, row: band, p: 0, poly: P.poly, kinds: P.kinds.map(k => k === RAY ? RAY : rowId(f, e, k)), area: areaOf(P.poly), seq: sa, mid: [on(sa), on(sb)], ends: [P.poly, P.poly], ray: -1 });
    }
  }
  return { region, cells };
}
// every cell's edges through every point of another lying on them: two neighbours' edges the same pieces, drawn once
function conform(cells) {
  const B = 4, buckets = new Map(), bk = (i, j) => `${i},${j}`;
  for (const c of cells) for (const p of c.poly) { const k = bk(Math.floor(p[0] / B), Math.floor(p[1] / B)); (buckets.get(k) ?? buckets.set(k, new Set()).get(k)).add(p); }
  for (const c of cells) {
    const poly = [], kinds = [];
    c.poly.forEach((a, m) => {
      const b = c.poly[(m + 1) % c.poly.length], ab = sub(b, a), L2 = dot(ab, ab);
      poly.push(a); kinds.push(c.kinds[m]);
      if (L2 < 1e-12) return;
      const ins = [];
      for (let i = Math.floor((Math.min(a[0], b[0]) - HAIR) / B); i <= Math.floor((Math.max(a[0], b[0]) + HAIR) / B); i++)
        for (let j = Math.floor((Math.min(a[1], b[1]) - HAIR) / B); j <= Math.floor((Math.max(a[1], b[1]) + HAIR) / B); j++)
          for (const p of buckets.get(bk(i, j)) ?? []) {
            if (p === a || p === b) continue;
            const u = dot(sub(p, a), ab) / L2;
            if (u > 1e-9 && u < 1 - 1e-9 && Math.abs(cross(ab, sub(p, a))) / Math.sqrt(L2) < HAIR) ins.push([u, p]);
          }
      ins.sort((x, y) => x[0] - y[0]);
      for (const [, p] of ins) if (poly.at(-1) !== p) { poly.push(p); kinds.push(c.kinds[m]); }
    });
    c.poly = poly; c.kinds = kinds;
  }
}
// The cells of every form, no colour: { regions, cells }; o { pitch, facets, shortest }, img and near to cut the rows by the photo
export function formCellsOf(forms, o = {}, img = null, near = null) {
  const snap = snapper(), regions = [], cells = [];
  forms.forEach(F => {
    const reg = regions.length, R = formCells(F, reg, img, near, o, snap);
    if (!R) return;
    R.region.form = F.id; regions.push(R.region); cells.push(...R.cells);
  });
  conform(cells);
  return { regions, cells };
}

// ---------- the materials ----------
const ROUND_TURN = 20 * Math.PI / 180;   // a corner turning so much at least rounded
const same = (p, q) => p[0] === q[0] && p[1] === q[1];
// forms side by side one (Merge, and glass's pieces): their borders inside off, the rest end to end
export function mergeForms(forms, ids) {
  const set = new Set(ids), mine = forms.filter(F => set.has(F.id));
  if (mine.length < 2) return forms;
  const E = new Map(), ek = (a, b) => `${keyOf(a)}>${keyOf(b)}`;
  for (const F of mine) for (const L of F.loops) L.forEach((a, i) => { const b = L[(i + 1) % L.length], back = ek(b, a); if (E.has(back)) E.delete(back); else E.set(ek(a, b), { a, b }); });
  const out = new Map(); for (const e of E.values()) (out.get(keyOf(e.a)) ?? out.set(keyOf(e.a), []).get(keyOf(e.a))).push(e);
  const used = new Set(), faces = [];
  for (const e0 of E.values()) {
    if (used.has(e0)) continue;
    const P = [];
    for (let e = e0, g = 0; e && !used.has(e) && g < 1e5; g++) {
      used.add(e); P.push(e.a);
      const d = unit(sub(e.b, e.a)), opts = (out.get(keyOf(e.b)) ?? []).filter(f => !used.has(f)), turn = f => { const v = unit(sub(f.b, f.a)); return Math.atan2(cross(d, v), dot(d, v)); };
      e = opts.length ? opts.reduce((x, y) => turn(y) > turn(x) ? y : x) : null;
    }
    if (P.length >= 3) faces.push(cleanLoop(P));
  }
  const outs = faces.filter(P => P.length >= 3 && areaOf(P) > 1e-6), holes = faces.filter(P => P.length >= 3 && areaOf(P) < -1e-6);
  if (outs.length !== 1) return forms;                                                // not side by side: nothing done
  const big = mine.reduce((x, y) => y.area > x.area ? y : x), merged = { ...big, loops: [outs[0], ...holes], area: areaOf(outs[0]) + holes.reduce((a, Hh) => a + areaOf(Hh), 0) };
  // the forms reading the photo each their own way — a mirror's copy, a moved one — every one a part of it, read as it was
  const parts = mine.flatMap(F => F.parts?.length ? F.parts : [{ loop: F.loops[0], read: F.read ?? null }]), key = q => JSON.stringify(q.read ?? ID_READ);
  if (new Set(parts.map(key)).size > 1) { merged.parts = parts; merged.read = null; } else { delete merged.parts; merged.read = parts[0].read; }
  return forms.flatMap(F => F === big ? [merged] : set.has(F.id) ? [] : [F]);
}
// A form's material, off the photo: dark and grey low down the tyres, up high the windows; a small round grey one
// a headlight; the rest metal. A guess, est.: the owner sets it by hand.
function guessMaterial(F, box, hexOf) {
  if (!F.pencil || F.bg) return 'metal';
  const lab = labOf(linOf(hexOf(F.pencil))), C = Math.hypot(lab[1], lab[2]), O = F.loops[0];
  const per = O.reduce((a, p, i) => a + len(sub(O[(i + 1) % O.length], p)), 0), round = 4 * Math.PI * Math.abs(areaOf(O)) / (per * per);
  const cy = O.reduce((a, p) => a + p[1], 0) / O.length, mid = (box.y0 + box.y1) / 2, area = (box.x1 - box.x0) * (box.y1 - box.y0);
  if (C >= 16) return 'metal';
  if (lab[0] < 30) return cy < mid ? 'rubber' : 'glass';
  if (round > 0.55 && F.area < 0.04 * area) return 'glass';
  return cy > mid + 0.15 * (box.y1 - box.y0) ? 'glass' : 'metal';
}
// every form its material guessed, the glass pieces side by side one form
export function withMaterials(forms, pencils) {
  const hex = Object.fromEntries(pencils.map(p => [p.id, p.hex])), fig = forms.filter(F => !F.bg && F.pencil);
  if (!fig.length) return forms;
  const box = fig.flatMap(F => F.loops[0]).reduce((b, p) => ({ x0: Math.min(b.x0, p[0]), y0: Math.min(b.y0, p[1]), x1: Math.max(b.x1, p[0]), y1: Math.max(b.y1, p[1]) }), { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity });
  let out = forms.map(F => ({ ...F, material: F.material ?? guessMaterial(F, box, id => hex[id] ?? '#808080') }));
  for (const T of out.filter(F => F.material === 'rubber' && F.loops.length > 1))     // in a tyre's hole: the wheel, metal
    for (const F of out) if (F !== T && F.material === 'glass' && T.loops.slice(1).some(Hh => inPoly(Hh, F.loops[0][0]) || F.loops[0].some(q => Hh.some(r => same(q, r))))) F.material = 'metal';
  for (let changed = true; changed;) {                                                 // the glass side by side: one
    changed = false;
    const glass = out.filter(F => F.material === 'glass' && !F.bg);
    for (const A of glass) {
      const keys = new Set(A.loops.flatMap(L => L.map(keyOf)));
      const B = glass.find(G => G !== A && G.loops.some(L => L.filter(p => keys.has(keyOf(p))).length >= 2));
      if (!B) continue;
      const m = mergeForms(out, [A.id, B.id]);
      if (m !== out) { out = m; changed = true; break; }
    }
  }
  return out;
}

// ---------- Preview: the brush through the sausages ----------
const STOCK = Object.values(PAINT).filter(q => !q.buy);
function paintNear() {
  const labs = STOCK.map(q => labOf(linOf(q.hex))), memo = new Map();
  return lin => {
    const s = lin.map(v => Math.round(Math.max(0, Math.min(1, v)) ** (1 / 2.2) * 63)), key = (s[0] << 12) | (s[1] << 6) | s[2];
    let k = memo.get(key);
    if (k === undefined) { const lab = labOf(s.map(v => (v / 63) ** 2.2)); let bd = Infinity; k = 0; labs.forEach((l, i) => { const d = de2000(lab, l); if (d < bd) { bd = d; k = i; } }); memo.set(key, k); }
    return STOCK[k].id;
  };
}
// a spoke from p0 on a form's outline, square in along nrm: its length — to the form's depth or its far border
function spokeLen(F, p0, nrm, depth) {
  let hit = depth * 2;
  for (const M of F.loops) M.forEach((q, j) => { const r = M[(j + 1) % M.length], e = sub(r, q), den = cross(nrm, e); if (Math.abs(den) < 1e-12) return; const t = cross(sub(q, p0), e) / den, v = cross(sub(q, p0), nrm) / den; if (t > 0.5 && v >= 0 && v <= 1) hit = Math.min(hit, t); });
  return Math.min(depth, hit - 0.3);
}
// a form's depth: the wavefront's last event
function depthOf(F, o = {}) { const { lines, starts } = linesOf2(F.loops, o.bricks ? 0 : o.facets ?? FACETS_NEW); if (!starts.length || lines.length > 999) return 0; const r = sweep(lines, starts); return r.ok ? r.depth : 0; }
// The algorithm's sausages of a form: spokes evenly round every loop, square in from its side, to its depth or its
// far border; every run of one paint along one a sausage — the photo's nearest of the owner's paints, no run shorter
// than a sausage is wide; rubber one paint, the most of its spokes'. → [{ a, b, paint }]
export function spokesOf(F, img, o = {}, depth = depthOf(F, o)) {
  const near = o.near ?? paintNear(), step = o.spoke ?? SPOKE_NEW, mine = [];
  if (!img || depth <= 0) return mine;
  for (const L of F.loops) {
    const per = L.reduce((a, q, i) => a + len(sub(L[(i + 1) % L.length], q)), 0), m = Math.max(1, Math.round(per / step));
    for (let k = 0; k < m; k++) {
      let at = (k + 0.5) * per / m, i = 0;
      for (; i < L.length; i++) { const l = len(sub(L[(i + 1) % L.length], L[i])); if (at <= l) break; at -= l; }
      const a = L[i % L.length], b = L[(i + 1) % L.length], u = unit(sub(b, a)), nrm = left(u), p0 = add(a, mul(u, at)), Lsp = spokeLen(F, p0, nrm, depth);
      if (Lsp < SAUSAGE_W) continue;
      const N = Math.max(1, Math.round(Lsp)), runs = [];
      for (let j = 0; j < N; j++) {
        const q = add(p0, mul(nrm, 0.3 + (j + 0.5) * Lsp / N)), acc = [0, 0, 0], id = pix(img, q[0], q[1], acc) ? near(acc) : null;
        const t0 = 0.3 + j * Lsp / N, t1 = 0.3 + (j + 1) * Lsp / N;
        if (runs.length && runs.at(-1).paint === id) runs.at(-1).t1 = t1; else runs.push({ paint: id, t0, t1 });
      }
      for (let changed = true; changed && runs.length > 1;) {                        // a run shorter than a sausage's width in with its neighbour
        changed = false;
        const mi = runs.findIndex(r => r.t1 - r.t0 < SAUSAGE_W);
        if (mi < 0) break;
        const r = runs[mi], to = runs[mi - 1] && (!runs[mi + 1] || runs[mi - 1].t1 - runs[mi - 1].t0 >= runs[mi + 1].t1 - runs[mi + 1].t0) ? runs[mi - 1] : runs[mi + 1];
        if (to === runs[mi - 1]) to.t1 = r.t1; else to.t0 = r.t0;
        runs.splice(mi, 1);
        for (let z = runs.length - 1; z > 0; z--) if (runs[z].paint === runs[z - 1].paint) { runs[z - 1].t1 = runs[z].t1; runs.splice(z, 1); }
        changed = true;
      }
      for (const r of runs) if (r.paint) mine.push({ a: add(p0, mul(nrm, r.t0)), b: add(p0, mul(nrm, r.t1)), paint: r.paint });
    }
  }
  if (F.material === 'rubber' && mine.length) {                                       // rubber: one paint, the most of its spokes'
    const cnt = new Map(); for (const q of mine) cnt.set(q.paint, (cnt.get(q.paint) ?? 0) + len(sub(q.b, q.a)));
    const one = [...cnt].sort((x, y) => y[1] - x[1])[0][0]; for (const q of mine) q.paint = one;
  }
  return mine;
}
// M's spoke through a point of a form: from the nearest point of its outline square in, to its depth or far border → { a, b }
export function spokeThrough(F, p, o = {}) {
  let best = null;
  for (const L of F.loops) L.forEach((a, i) => { const b = L[(i + 1) % L.length], e = sub(b, a), L2 = dot(e, e); if (L2 < 1e-12) return; const u = Math.max(0, Math.min(1, dot(sub(p, a), e) / L2)), q = add(a, mul(e, u)), d = len(sub(p, q)); if (!best || d < best.d) best = { d, q, nrm: left(unit(e)) }; });
  if (!best) return null;
  const Lsp = spokeLen(F, best.q, best.nrm, depthOf(F, o));
  return Lsp < 1 ? null : { a: add(best.q, mul(best.nrm, 0.3)), b: add(best.q, mul(best.nrm, Lsp)) };
}
// The Preview: every form a figure — the brush round its rings' middles from the outside in, every ring from its
// point nearest the brush — its spokes from its outline in, a sausage a run of one paint along one (rubber: its
// one paint); o { pitch, facets, bricks, spoke, density, h } → { img: the Preview as a photo, figs, sausages, sim }
export function formPreview(forms, img, o = {}) {
  const W = img.nx * img.h, H = img.ny * img.h, pitch = o.pitch ?? PITCH_NEW, near = paintNear(), figs = [], sausages = [], step = o.spoke ?? SPOKE_NEW;
  forms.forEach(F => {
    const { lines, starts } = linesOf2(F.loops, o.bricks ? 0 : o.facets ?? FACETS_NEW);
    if (!starts.length || lines.length > 999) return;
    const first = sweep(lines, starts);
    if (!first.ok || first.depth <= 1e-6) return;
    const n = rowsIn(first.depth, pitch), s = first.depth / n, { shots } = sweep(lines, starts, null, Array.from({ length: n }, (_, k) => Math.min(first.depth - 1e-6, (k + 0.5) * s)));
    const pts = [];
    for (const sh of shots) {
      const loops = sh.loops.filter(Lp => Lp.pts.length >= 2);
      while (loops.length) {
        const pen = pts.at(-1);
        let bi = 0, bj = 0, bd = Infinity;
        loops.forEach((Lp, i) => Lp.pts.forEach((q, j) => { const d = pen ? len(sub(q, pen)) : i + j; if (d < bd) { bd = d; bi = i; bj = j; } }));
        const Lp = loops.splice(bi, 1)[0].pts;
        pts.push(...Lp.slice(bj), ...Lp.slice(0, bj), Lp[bj]);
      }
    }
    const pieces2 = pts.slice(1).map((b, i) => ({ t: 'L', a: pts[i], b })).filter(g => len(sub(g.b, g.a)) > 1e-6);
    if (!pieces2.length) return;
    figs.push({ n: figs.length + 1, pieces: pieces2 });
    // the sausages: the owner's (M), or the algorithm's off the photo where the form came from
    const mine = Array.isArray(F.ss) ? F.ss.map(q => ({ ...q })) : spokesOf(F, readOf(img, F), { ...o, near }, first.depth);
    for (const q of mine) q.form = F.id;
    sausages.push(...mine);
  });
  const sim = simOf({ figs, sausages }, [], { cw: W, ch: H, brush: pitch, swell: 0, density: o.density ?? 50, ...(o.h ? { h: o.h } : {}) });
  sim.advance(Infinity);
  const data = new Uint8ClampedArray(sim.nx * sim.ny * 4);
  sim.rgba(data, true, GROUND);
  return { img: { nx: sim.nx, ny: sim.ny, h: sim.h, data }, figs, sausages, sim };
}

// ---------- the plan ----------
const pieces = pts => pts.slice(1).map((b, i) => ({ t: 'L', a: pts[i], b }));
// The plan, opmpPlan's: o { pencils, order, frame, merge, pitch, facets, shortest, cw, rubs, background: the background's forms too,
// corner (glass's and rubber's rings), spoke, density, cells: 'photo' (at first) or 'preview', the cells' colours off it }
// → { regions, cells (every one its colour), lines (DRAW BW's, once each), drags (DRAG's, a colour each),
// modules (the lines, for DRAW BW's pencil), few: the colours with next to nothing to paint, their cells to the nearest of the rest }
export function formPlan(forms, photo, o = {}) {
  const pencils = o.pencils ?? cleanPencils(PRISMA_PENCILS), F = o.frame, nearAll = nearestOf(pencils, -Infinity);
  const shown = o.background ? forms.filter(F => F.pencil !== null) : forms.filter(F => !F.bg);   // the background left out, the ground there
  // the cells' colours off the photo — the door's handle, the headlights (the owner, 2026-10-30, the Preview's first
  // try: "in the earlier version there were the handle on the door and the headlights") — or off the Preview, o.cells
  const pv = o.cells === 'preview' ? formPreview(shown, photo, o) : null, img = pv ? pv.img : photo;
  const { regions, cells: all } = formCellsOf(shown, { ...o, shifted: !pv }, img, nearAll);
  const byId = new Map(shown.map(F => [F.id, F])), imgOf = c => pv ? img : readOf(img, byId.get(regions[c.reg].form));
  const inF = P => { if (!F) return true; const c = P.reduce((a, p) => add(a, mul(p, 1 / P.length)), [0, 0]); return c[0] >= F.x0 && c[0] <= F.x1 && c[1] >= F.y0 && c[1] <= F.y1; };
  const cells0 = all.filter(c => inF(c.poly)).map(c => ({ ...c, lin: meanOf(imgOf(c), c.poly) })), slv = sliversOf(cells0, () => o.minW ?? MIN_W), cells = cells0;
  const find = i => regions[cells[i].reg].colour ? -1e6 - i : regions[cells[i].reg].material === 'rubber' ? -1 - cells[i].reg : slv(i);   // rubber: the whole form one colour; a form's own colour: every cell its own
  // a form's own colour (the owner, 2026-10-30, the tab's first look: "and how do I set the colour?"): Flat, its pencil in every cell; Shaded,
  // the photo's light and dark kept — every cell the pencil nearest the colour as much lighter or darker as the photo there than in the form
  const tone = new Map();
  cells.forEach(c => { const R = regions[c.reg]; if (!R.colour || R.flat || !c.lin) return; const t = tone.get(c.reg) ?? tone.set(c.reg, { a: 0, L: 0 }).get(c.reg); t.a += c.area; t.L += labOf(c.lin)[0] * c.area; });
  const hexOf = Object.fromEntries(pencils.map(p => [p.id, p.hex]));
  const glin = new Map();
  cells.forEach((c, i) => { if (!c.lin) return; const r = find(i), g = glin.get(r) ?? glin.set(r, { a: 0, v: [0, 0, 0] }).get(r); g.a += c.area; c.lin.forEach((v, m) => { g.v[m] += v * c.area; }); });
  const once = ps => {
    const near = nearestOf(ps, -Infinity), gp = new Map([...glin].map(([r, g]) => [r, near(g.v.map(v => v / g.a))]));
    const own = (c, ps2) => {                                                        // a form's own colour, Flat or Shaded
      const R = regions[c.reg], hex = hexOf[R.colour];
      if (!hex) return null;
      if (R.flat || !c.lin || !tone.get(c.reg)?.a) return R.colour;
      const t = tone.get(c.reg), C = labOf(linOf(hex)), L = Math.max(0, Math.min(100, C[0] + labOf(c.lin)[0] - t.L / t.a));
      return nearestOf(ps2, -Infinity)(linOfLab([L, C[1], C[2]])) ?? R.colour;
    };
    const mine = cells.map((c, i) => ({ ...c, group: find(i), pencil: regions[c.reg].colour ? own(c, ps) : gp.get(find(i)) ?? null }));
    const ids = (o.order ?? ps.filter(p => p.on !== false).map(p => p.id)).filter(id => mine.some(c => c.pencil === id));
    const lines = linesOf(mine, regions, o), drags = dragsOf(mine, regions, ids, o);
    const modules = lines.map(L => { const ps2 = pieces(L.pts); return { kind: 'cell', line: L.kind, pencil: null, pieces: ps2, mm: ps2.reduce((s, g) => s + len(sub(g.b, g.a)), 0) }; });
    return { regions, cells: mine, lines, drags, modules, areas: [], lost: 0, forms: shown, preview: pv };
  };
  const D = once(pencils), total = D.drags.reduce((a, q) => a + q.mm, 0);
  const least = Math.min(o.least ?? LEAST_MM, LEAST_SHARE * total), few = D.drags.filter(q => q.mm < least).map(q => q.pencil);
  if (!few.length) return { ...D, few, rings: [], rays: [] };
  return { ...once(pencils.map(p => few.includes(p.id) ? { ...p, on: false } : p)), few, rings: [], rays: [] };
}
