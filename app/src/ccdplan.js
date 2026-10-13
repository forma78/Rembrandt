// CCD's plan — after Carlos Cruz-Diez, not the camera's chip (the owner,
// 2026-10-11, Cruz-Diez/: "no trace, no marks — I just squeeze the paint at
// the bottom and the brush drives it from the bottom up. Evenly"). Rectangles
// of straight lanes, each a free-transform box on the canvas: its place and
// size, its direction — Vertical, every lane from its bottom edge up;
// Horizontal, from its left edge to the right — and its lanes, 1 … 218 ("not
// 18 at most, but all 218"). A lane is one run of the dry brush, one way,
// from the edge the paint lies along to the far one: the brush lands in the
// paint, lifts past the far edge and flies back. No TRACE, no MARKS, no dip.
//
// A rectangle's mm: from the canvas's bottom left corner, x right, y up, as a
// ruler reads them (Left, Bottom, Width, Height). The runs for the machine
// from the canvas's centre (toMachine). Lines only. No DOM.
//
// The paints (the owner, 2026-10-13, Cruz-Diez/IMAGE 2026-10-13 14:47:37:
// TAPE's paints on CCD, "only here they go straight"): sausages squeezed in
// rows across the lanes, a stripe of lanes each, the brush dragging them on;
// the rows, the pattern, its genesis repeated, MARKS and the Result below.

import { toMachine } from './band.js';
import { pieceLen } from './strokes.js';
import { PAINT, TAPE_META, stripesOf } from './tapeplan.js';
import { linOf, toSrgb, pigmentMix, luminance } from './color.js';
import { rng } from './util.js';

export const LANES_MAX = 218;       // the owner, 2026-10-11
export const LANES_NEW = 40;        // a new rectangle's, Claude's
export const OFF = 60;              // mm: how far past the canvas's edge a rectangle may reach
export const MIN_SIDE = 1;          // mm
export const DIRS = ['up', 'right'], MODES = ['snake', 'air', 'duosnake', 'duo'];   // duo: Duo Air
// Duo Air's halves run OVER_NEW mm past the middle: the head comes off the
// canvas LIFT_EARLY before where it lifts (the owner, 2026-10-13: "add 5 mm
// at the lift, the head with the brush comes off before the centre")
export const OVER_NEW = 5, LIFT_EARLY = 5;
export const DIR_NAME = { up: 'vertical, bottom to top', right: 'horizontal, left to right' };
export const EDGE_NAME = { up: 'bottom', right: 'left' };      // where the paint is squeezed

const fin = Number.isFinite;
// a rectangle as it may be kept: whatever is wrong in it put right, or null
export function cleanRect(r) {
  if (!r || ![r.x, r.y, r.w, r.h].every(fin)) return null;
  const w = Math.max(MIN_SIDE, r.w), h = Math.max(MIN_SIDE, r.h), pat = cleanPat(r.pat);
  return { x: r.x, y: r.y, w, h, dir: r.dir === 'right' ? 'right' : 'up', lanes: fin(r.lanes) ? Math.round(Math.max(1, Math.min(LANES_MAX, r.lanes))) : LANES_NEW,
    rows: fin(r.rows) ? Math.round(Math.max(1, Math.min(ROWS_MAX, r.rows))) : ROWS_NEW, ...(pat ? { pat } : {}) };
}
const ids = a => Array.isArray(a) && a.every(id => PAINT[id]);
const cleanPalette = q => q && typeof q.name === 'string' && ids(q.core) && ids(q.accent) ? { name: q.name, core: q.core.slice(), accent: q.accent.slice() } : null;
// a pattern as it may be kept, or null
export function cleanPat(q) {
  if (!q || !Number.isInteger(q.lanes) || q.lanes < 1 || !(q.pitch >= 0) || !(q.along > 0) || !Array.isArray(q.stripes) || !Array.isArray(q.paint) || q.paint.length !== q.stripes.length) return null;
  if (!q.stripes.every(t => Array.isArray(t) && Number.isInteger(t[0]) && Number.isInteger(t[1]) && 0 <= t[0] && t[0] <= t[1] && t[1] < q.lanes)) return null;
  const paint = q.paint.map(row => Array.isArray(row) ? row.map(id => PAINT[id] ? id : null) : []);
  return { lanes: q.lanes, pitch: q.pitch, along: q.along, across: fin(q.across) ? q.across : q.lanes * q.pitch, stripes: q.stripes.map(t => [t[0], t[1]]), paint, palette: cleanPalette(q.palette), seed: fin(q.seed) ? q.seed : 0 };
}

// across: the side the lanes are laid across (the width of a vertical one); along: the side they run
export const acrossOf = r => r.dir === 'right' ? r.h : r.w;
export const alongOf = r => r.dir === 'right' ? r.w : r.h;
// Lane centre to lane centre: the outer lanes' brush edges on the rectangle's
// sides, as ALU's; a brush as wide as the rectangle or wider, every lane on its middle
export function pitchOf(r, brush) { return r.lanes > 1 ? Math.max(0, acrossOf(r) - brush) / (r.lanes - 1) : 0; }
// the white between two neighbouring lanes (> 0), or how far they overlap (< 0)
export const gapOf = (r, brush) => r.lanes > 1 ? pitchOf(r, brush) - brush : 0;

// The lanes: [{ n, a, b }] canvas mm, lane 1 the left one (vertical) or the
// bottom one (horizontal), as they run; a `before` mm outside the paint's
// edge, b `past` mm past the far one
export function lanesOf(r, o) {
  const A = acrossOf(r), p = pitchOf(r, o.brush), mid = r.lanes === 1 || A <= o.brush, before = o.before || 0, past = o.past || 0, out = [];
  for (let i = 0; i < r.lanes; i++) {
    const d = mid ? A / 2 : o.brush / 2 + i * p;
    out.push(r.dir === 'right'
      ? { n: i + 1, a: [r.x - before, r.y + d], b: [r.x + r.w + past, r.y + d] }
      : { n: i + 1, a: [r.x + d, r.y - before], b: [r.x + d, r.y + r.h + past] });
  }
  return out;
}

// The plan: every rectangle with its lanes, in the order they run
export function planOf(rects, o) {
  const out = rects.map((r, i) => ({ ...r, i, runs: lanesOf(r, o), pitch: pitchOf(r, o.brush), gap: gapOf(r, o.brush) }));
  const runs = out.reduce((a, r) => a + r.runs.length, 0), length = out.reduce((a, r) => a + r.runs.length * (alongOf(r) + (o.before || 0) + (o.past || 0)), 0);
  return { rects: out, runs, length };
}

// DRAG's rows for plotRun, mm from the canvas's centre, in one of three ways
// (the owner, 2026-10-11: "two DRAG keys — the snake and through the air"):
// in the air, a row a lane, one way, the brush lifting at the far edge and
// flying back; the snake (o.mode 'snake'), a rectangle one row, its lanes back and
// forth with the brush down, a step across at each end — stopsAt the lanes'
// ends, so a PAUSE falls there, never on a lane, as ALU's snake; Duo (o.mode
// 'duo', the owner, 2026-10-13, TAPE-colors/IMAGE 2026-10-12 18:44:00: "a run
// to the centre, a lift, back — so the first part of the canvas from the top
// down, then from the other edge to the centre"), every lane from the far
// edge to the middle, the brush lifting there and flying back to the next,
// then every lane from the paint's edge to the middle — the top half first on
// a vertical rectangle, the right half on a horizontal one; each half o.over
// mm past the middle, as the head lifts before it. Duo Snake (o.mode
// 'duosnake', the owner, the same day: "two DUO — DUO SNAKE and DUO AIR …
// DUO SNAKE, when the brush reaches the centre, turns and goes back"): a
// half the snake, its lanes from its edge to the middle and back with the
// brush down, turning at the middle itself — no lift there; a step across
// at each end; the far edge's half first. A stop
// before every next rectangle — the brush wiped, its paint squeezed along
// its edge. A round brush: no flat one to turn (the owner, 2026-10-13: "we
// do not take the flat brush, the tests showed it is useless")
export const stopWhy = r => `Rectangle ${r.i + 1}, ${DIR_NAME[r.dir]}: wipe the brush, squeeze its paint along its ${EDGE_NAME[r.dir]} edge, then Continue`;
export const midOf = (r, ln, d = 0) => r.dir === 'right' ? [r.x + r.w / 2 + d, ln.a[1]] : [ln.a[0], r.y + r.h / 2 + d];   // a lane's middle, where Duo's halves meet, d mm on towards the far edge
// the snake through lanes [[a, b]]: every other one the other way, a step across between → its pieces, where its lanes end, its length
function snakeOf(pairs, at) {
  const pieces = [], stopsAt = [];
  let acc = 0, end = null;
  pairs.forEach(([a0, b0], j) => {
    const [a, b] = j % 2 ? [b0, a0] : [a0, b0];
    for (const [p, q] of [[end, a], [a, b]]) {
      if (!p || Math.hypot(q[0] - p[0], q[1] - p[1]) < 1e-6) continue;              // no step across when the lanes lie on one line
      const g = { t: 'L', a: at(p), b: at(q) }; pieces.push(g); acc += pieceLen(g);
    }
    if (j < pairs.length - 1) stopsAt.push(acc);
    end = b;
  });
  return { pieces, stopsAt, L: acc };
}
export function dragRows(pl, o) {
  const ps = [], info = [], stops = [], at = q => toMachine([q[0] - o.cw / 2, o.ch / 2 - q[1]]), mode = o.mode ?? (o.snake ? 'snake' : 'air');
  let length = 0;
  for (const r of pl.rects) {
    if (!r.runs.length) continue;
    if (ps.length) stops.push({ at: ps.length, why: stopWhy(r) });
    const n = r.runs.length, snakeRow = (q, label) => {
      const row = ps.length + 1;
      ps.push(q.pieces.map((g, i) => ({ ...g, tilt: 0, row, ...(!i && q.stopsAt.length ? { stopsAt: q.stopsAt } : {}) })));
      info.push({ label, ri: r.i, L: q.L }); length += q.L;
    };
    if (mode === 'duo' || mode === 'duosnake') {
      const over = mode === 'duo' ? o.over || 0 : 0;                                // past the middle where the brush lifts; the snake turns on it
      for (const [half, from, d] of [['the far edge', ln => ln.b, -over], ['the paint\'s edge', ln => ln.a, over]]) {
        if (mode === 'duosnake') { snakeRow(snakeOf(r.runs.map(ln => [from(ln), midOf(r, ln, d)]), at), `Rectangle ${r.i + 1} · ${n} lane${n === 1 ? '' : 's'} from ${half} to the middle and back, the snake`); continue; }
        for (const ln of r.runs) {
          const g = { t: 'L', a: at(from(ln)), b: at(midOf(r, ln, d)) }, L = pieceLen(g), row = ps.length + 1;
          ps.push([{ ...g, tilt: 0, row }]);
          info.push({ label: `Rectangle ${r.i + 1} · lane ${ln.n} of ${n}, from ${half} to the middle`, ri: r.i, L });
          length += L;
        }
      }
      continue;
    }
    if (mode === 'snake') {
      snakeRow(snakeOf(r.runs.map(ln => [ln.a, ln.b]), at), `Rectangle ${r.i + 1} · ${n > 1 ? `${n} lanes, the snake` : 'one lane'}`);
      continue;
    }
    for (const ln of r.runs) {
      const g = { t: 'L', a: at(ln.a), b: at(ln.b) }, L = pieceLen(g), row = ps.length + 1;
      ps.push([{ ...g, tilt: 0, row }]);
      info.push({ label: `Rectangle ${r.i + 1} · lane ${ln.n} of ${r.runs.length}`, ri: r.i, L });
      length += L;
    }
  }
  return { ps, info, stops, runs: ps.length, length };
}
// DRAG's rows as plotRun's passes: a pass a rectangle, its why the stop's,
// so plotRun lays a pause block before it — none before the first
export function dragPasses(R) {
  const cuts = [0, ...R.stops.map(q => q.at), R.ps.length];
  return cuts.slice(0, -1).map((a, k) => ({ key: 'DRAG', ps: R.ps.slice(a, cuts[k + 1]), why: k ? R.stops[k - 1].why : null })).filter(q => q.ps.length);
}

// The lanes as an SVG in canvas mm, y down, origin top left, as ALU's files:
// a <path> a lane in running order
const f2 = v => (Math.round(v * 100) / 100).toString();
export function dragSvg(pl, o) {
  const y = v => o.ch - v, rows = pl.rects.flatMap(r => r.runs.map(ln => `  <path d="M${f2(ln.a[0])} ${f2(y(ln.a[1]))} L${f2(ln.b[0])} ${f2(y(ln.b[1]))}" data-rect="${r.i + 1}" data-lane="${ln.n}" data-dir="${r.dir}"/>`));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<!-- Rembrandt CCD · drag · canvas ${o.cw}x${o.ch} mm, y down, origin top left. Each <path> is one brush-down lane, in running order. -->\n<svg xmlns="http://www.w3.org/2000/svg" width="${o.cw}mm" height="${o.ch}mm" viewBox="0 0 ${o.cw} ${o.ch}">\n<g id="drag" data-ink="none" data-brush-mm="${o.brush}" fill="none" stroke="#24221F" stroke-width="1">\n${rows.join('\n')}\n</g>\n</svg>\n`;
}

// ---------- the paints: sausages in rows across the lanes ----------
// A pattern (the genesis): its lanes in stripes of 1, 2, 3 or 6 (TAPE's
// stripesOf), its rows along them evenly from the paint's edge to the far one
// — the owner's 20 × 20 had four, "two in the middle, and at the edges, left
// and right" — and a paint a stripe a row, or none. Born on a rectangle as it
// is; on a bigger one repeated at the same scale (the owner, 2026-10-13: "on
// 40 × 40 they are copied as a pattern … from the genesis 20 × 20 we then
// enlarge it as an ornament"; "a repeat at the same scale, not bigger"): its
// pitch kept, so the lanes grow in number, its stripes again every
// pat.lanes lanes, its rows again every along/(rows − 1) mm, the far edge's
// row its last; cut where the rectangle ends.
// pat: { lanes, pitch, along, across, stripes: [[k0, k1]], paint: [[id | null] a stripe's, row by row], palette, seed }
export const ROWS_NEW = 4, ROWS_MAX = 12;
export const SAUSAGE_W = 5;              // mm along a lane a sausage lies over, est.
// The palettes of TAPE's meta keys without their first ring, and two more
// (the owner, 2026-10-13: "study IMAGE 2026-10-12 18:43:57, 18:43:59 in
// TAPE-colors — you could make meta 3 and meta 4 of them, beautiful
// combinations"; Claude's reading in the owner's paints): 18:43:57 orange,
// ochre and sky over cream and pink, navy, threads of red; 18:43:59 the blues,
// lavender, white and grey, threads of orange and red
export const CCD_META = {
  ...Object.fromEntries(Object.entries(TAPE_META).map(([k, q]) => [k, { name: q.name, core: q.core, accent: q.accent }])),
  'meta 3': { name: 'meta 3', core: ['oyellow', 'ochre', 'sky', 'white', 'pink', 'ultramarine'], accent: ['red', 'brown', 'p03'] },
  'meta 4': { name: 'meta 4', core: ['ultramarine', 'p04', 'sky', 'white', 'purple', 'black'], accent: ['orange', 'red', 'oyellow'] },
};
export const isThin = (pal, id) => !!pal && pal.accent.includes(id) && !pal.core.includes(id);   // an accent a fleck, as TAPE's

// The paints of a pattern, stripe by stripe, row by row (TAPE's way): a
// stripe's tone dark or light in turn, now and then two alike; never the
// paint of the row before on the stripe, nor of the stripe beside it on the
// row — nor, the genesis repeated, of its first row after its last but one,
// of its first stripe after its last; a thin stripe an accent more often
export const TONE_KEEP = 0.25, OWN_TONE = 0.8, ACCENT_THIN = 0.35, ACCENT_WIDE = 0.05;   // Claude's, TAPE's
export function dealPaints(stripes, rows, pal, seed) {
  const r = rng(seed ^ 0x27d4eb2f), all = [...pal.core, ...pal.accent], out = [];
  const lum = pal.core.map(id => [id, luminance(PAINT[id].hex)]).sort((a, b) => a[1] - b[1]), half = Math.ceil(lum.length / 2);
  const tones = [lum.slice(0, half).map(q => q[0]), lum.slice(half).map(q => q[0])];
  let tone = r() < 0.5 ? 0 : 1;
  stripes.forEach(([k0, k1], si) => {
    const thin = k1 - k0 + 1 <= 2, row = [];
    tone = r() < TONE_KEEP ? tone : 1 - tone;
    const own = tones[tone].length ? tones[tone] : pal.core;
    for (let j = 0; j < rows; j++) {
      const avoid = [row[j - 1], out[si - 1]?.[j], rows >= 3 && j === rows - 2 ? row[0] : null, si && si === stripes.length - 1 ? out[0][j] : null];
      const accent = pal.accent.length && r() < (thin ? ACCENT_THIN : ACCENT_WIDE), from = accent ? pal.accent : r() < OWN_TONE ? own : pal.core;
      let ok = from.filter(p => !avoid.includes(p));
      if (!ok.length) ok = all.filter(p => !avoid.includes(p));
      if (!ok.length) ok = all.filter(p => p !== row[j - 1]);
      row.push(ok.length ? ok[Math.floor(r() * ok.length)] : from[0] ?? null);
    }
    out.push(row);
  });
  return out;
}
// A new pattern on a rectangle as it is: its stripes anew, its paints dealt
export function newPattern(r, brush, pal, seed) {
  const stripes = stripesOf(r.lanes, seed);
  return { lanes: r.lanes, pitch: pitchOf(r, brush), along: alongOf(r), across: acrossOf(r), stripes, paint: pal ? dealPaints(stripes, r.rows, pal, seed) : stripes.map(() => Array(r.rows).fill(null)), palette: pal, seed };
}
// Its paints dealt again — another palette, or its rows changed — its stripes kept
export const recolour = (pat, rows, pal, seed) => ({ ...pat, paint: dealPaints(pat.stripes, rows, pal, seed), palette: pal, seed });
// A rectangle with a pattern keeps its genesis's pitch: bigger, more lanes
export function lanesKept(r, brush) {
  if (!r.pat || !(r.pat.pitch > 0)) return r.lanes;
  return Math.max(1, Math.min(LANES_MAX, Math.round((acrossOf(r) - brush) / r.pat.pitch) + 1));
}
// The rows along a rectangle, mm from the paint's edge, and which of the genesis's each is
export function rowsOf(r, pat = r.pat) {
  const L = alongOf(r), n = r.rows ?? ROWS_NEW;
  if (n <= 1) return [{ t: 0, j: 0 }];
  const s = (pat?.along ?? L) / (n - 1), out = [{ t: 0, j: 0 }];
  for (let j = 1; j * s <= L - s / 4 + 1e-9; j++) out.push({ t: j * s, j: j % (n - 1) });
  out.push({ t: L, j: n - 1 });
  return out;
}
// The genesis's stripes across a rectangle, again every pat.lanes lanes, the last cut at its side
export function stripesAcross(r, pat = r.pat) {
  const out = [];
  for (let base = 0; base < r.lanes; base += pat.lanes) pat.stripes.forEach(([k0, k1], s) => { if (base + k0 < r.lanes) out.push({ s, k0: base + k0, k1: Math.min(r.lanes - 1, base + k1) }); });
  return out;
}
// lane k's centre across a rectangle, mm from its left (vertical) or bottom (horizontal) side, as lanesOf's
export function laneAt(r, brush, k) {
  const A = acrossOf(r);
  return r.lanes === 1 || A <= brush ? A / 2 : brush / 2 + k * pitchOf(r, brush);
}
// a place on a rectangle, t along its lanes from the paint's edge, c across → canvas mm
export const placeOf = (r, t, c) => r.dir === 'right' ? [r.x + t, r.y + c] : [r.x + c, r.y + t];
// The sausages on a rectangle: a stripe's lanes across, SAUSAGE_W along at
// its row — the edges' rows inside the rectangle. [{ t, j, s, k0, k1, paint,
// thin, a, b: along, c0, c1: across, mm }]
export function sausagesOf(r, brush) {
  if (!r.pat) return [];
  const L = alongOf(r), A = acrossOf(r), p = r.lanes > 1 && A > brush ? pitchOf(r, brush) : 0, out = [];
  const W = Math.min(SAUSAGE_W, L), edge0 = k => !p || k === 0 ? 0 : laneAt(r, brush, k) - p / 2, edge1 = k => !p || k === r.lanes - 1 ? A : laneAt(r, brush, k) + p / 2;
  const across = stripesAcross(r);
  for (const row of rowsOf(r)) {
    const a = Math.max(0, Math.min(L - W, row.t - W / 2));
    for (const st of across) {
      const paint = r.pat.paint[st.s]?.[row.j];
      if (paint) out.push({ t: row.t, j: row.j, s: st.s, k0: st.k0, k1: st.k1, paint, thin: isThin(r.pat.palette, paint), a, b: a + W, c0: edge0(st.k0), c1: edge1(st.k1) });
    }
  }
  return out;
}

// ---------- MARKS: where the sausages go ----------
// (the owner, 2026-10-13: "CCD will need MARKS (no trace), Snake and Air
// stay"): a sausage a dash across its stripe at its row, in watercolour from
// the cup as ALU's MARKS, a dip before every MARKS_DIP-th; a round brush, so
// a dash's ends brush half and MARK_GAP in from its stripe's sides — the
// dashes of neighbouring stripes apart; a stripe narrower, a dot. Row by row
// from the paint's edge, back and forth across, rectangle by rectangle.
export const MARKS_DIP = 4, MARK_GAP = 1, MARK_DOT = 1, MARK_SPEED = 40;   // marks a dip, mm, mm, mm/s; est.
export function markOf(q, brush) {
  const m = (q.c0 + q.c1) / 2, h = Math.max(MARK_DOT / 2, (q.c1 - q.c0) / 2 - brush / 2 - MARK_GAP);
  return { t: (q.a + q.b) / 2, c0: m - h, c1: m + h };
}
export function marksRows(pl, o) {
  const ps = [], info = [], at = q => toMachine([q[0] - o.cw / 2, o.ch / 2 - q[1]]);
  let n = 0;
  for (const r of pl.rects) {
    const ss = sausagesOf(r, o.brush), rows = [...new Set(ss.map(q => q.t))];
    rows.forEach((t, j) => {
      const row = ss.filter(q => q.t === t).sort((a, b) => j % 2 ? b.c0 - a.c0 : a.c0 - b.c0);
      for (const q of row) {
        const m = markOf(q, o.brush), [c0, c1] = j % 2 ? [m.c1, m.c0] : [m.c0, m.c1];
        const g = { t: 'L', a: at(placeOf(r, m.t, c0)), b: at(placeOf(r, m.t, c1)) }, dip = n % MARKS_DIP === 0;
        n++; ps.push([{ ...g, tilt: 0, row: ps.length + 1, ...(o.ink && !dip ? { nodip: true } : {}) }]);
        info.push({ label: `Rectangle ${r.i + 1} · row ${j + 1} · ${PAINT[q.paint].name}, lanes ${q.k0 + 1}–${q.k1 + 1}`, ri: r.i, L: pieceLen(g) });
      }
    });
  }
  return { ps, info, marks: n };
}

// ---------- the Result: the brush through the sausages (est.) ----------
// A lane at a time, a sample a mm from where the brush lands to where it
// lifts. A sausage lies on every lane of its stripe; the brush pushes most of
// it on (PICK_BULK of what is more than a film), picks up some of a film
// (PICK_FILM), and lays a film as long as it carries paint, the film thinning
// as it runs dry over about DRY mm. The paints mix as pigments (color.js).
// Density, the paint in a sausage: at 50 % the measured one — the line full
// about 70 mm, then fading (the owner, 2026-10-13, TAPE-colors/IMAGE
// 2026-10-12 19:23:33: "at a run there is enough for 70 mm on average, then
// it starts to fade"); twice as much every 25 %. All est. but the 70 mm.
export const FILM = 1, PICK_BULK = 0.9, PICK_FILM = 0.3, DRY = 12, THIN = 0.35, DS = 1;
// the snake's step across: the bristles keep HOLD of what the brush carries,
// the bead it pushed stays at the lane's end — the drips (the owner,
// 2026-10-13: "the drops show it is not a digital print")
export const HOLD = 12;
export const DENSITY_NEW = 50, REACH_50 = 70;
export const PAINT_50 = 108;             // a sausage's paint on a lane at 50 %, in FILM mm: the line full REACH_50, half gone ≈ 96, gone ≈ 120 (test)
export const paintOf = d => PAINT_50 * Math.pow(2, (Math.max(0, Math.min(100, d)) - 50) / 25);
// a groove's paint ×, its breath ×, its shade: the bristles, each a little apart (Claude's, est.)
export const GROOVE_K = [[1, 1, 0.03], [0.86, 0.8, -0.05], [1.12, 1.2, 0.02], [0.74, 0.7, -0.08], [1.26, 1.35, 0.05]];
// One lane: deposits [[i, rgb, amount]], strokes [[i0, i1, from]] — from:
// true, a clean brush; false, the brush as the stroke before left it; { b,
// bc }, the brush carried in across the step (the snake) → its samples, the
// brush after every stroke
export function laneWalk(n, deps, strokes, kd = 1) {
  const amt = new Float32Array(n), col = new Float32Array(3 * n), dry = DRY * kd;
  const put = (i, c, a) => { if (a <= 0) return; const t = a / (amt[i] + a); col.set(amt[i] > 0 ? pigmentMix([col[3 * i], col[3 * i + 1], col[3 * i + 2]], c, t) : c, 3 * i); amt[i] += a; };
  for (const [i, c, a] of deps) put(i, c, a);
  let b = 0, bc = [0, 0, 0];
  const outs = [];
  for (const [i0, i1, from] of strokes) {
    if (from === true) b = 0;
    else if (from) { b = from.b; bc = from.bc; }
    for (let i = i0, d = i1 >= i0 ? 1 : -1; ; i += d) {
      const a = amt[i], film = FILM * DS, take = Math.min(a, film) * PICK_FILM + Math.max(0, a - film) * PICK_BULK;
      const give = Math.min(b, film * (1 - Math.exp(-b / dry))), was = [col[3 * i], col[3 * i + 1], col[3 * i + 2]];
      amt[i] = a - take; put(i, bc, give);
      const nb = b - give + take;
      if (take > 0) bc = b - give > 1e-9 ? pigmentMix(bc, was, take / nb) : was;
      b = nb;
      if (i === i1) break;
    }
    outs.push({ b, bc });
  }
  const rgb = new Float32Array(3 * n), cover = new Float32Array(n);
  for (let i = 0; i < n; i++) { cover[i] = Math.min(1, amt[i] / (FILM * DS)); if (amt[i] > 0) for (let q = 0; q < 3; q++) rgb[3 * i + q] = toSrgb(col[3 * i + q]); }
  return { rgb, cover, outs };
}
// A rectangle's Result: every lane its grooves, as DRAG runs them — Air every
// lane from the paint's edge, the snake back and forth the brush carried
// across, Duo Air from the far edge to the middle, then from the paint's
// edge, its paint ending LIFT_EARLY before where the brush lifts, o.over
// past the middle; Duo Snake each half back and forth, turning at the middle.
// → { t0 (mm, sample 0, before the paint's edge), n, lanes: [{ k, c, grooves: [{ rgb, cover, shade }] }] }
export function mixRect(r, o) {
  const L = alongOf(r), before = o.before || 0, past = o.past || 0, n = Math.max(2, Math.round((L + before + past) / DS) + 1), iOf = t => Math.max(0, Math.min(n - 1, Math.round((t + before) / DS)));
  const ss = sausagesOf(r, o.brush), V = paintOf(o.density ?? DENSITY_NEW), lanes = [];
  const over = o.mode === 'duo' ? (o.over || 0) - LIFT_EARLY : 0, m1 = iOf(L / 2 - over), m2 = iOf(L / 2 + over);   // where each half's paint ends
  const snaky = o.mode === 'snake' || o.mode === 'duosnake';
  const byLane = Array.from({ length: r.lanes }, () => []);
  for (const q of ss) { const c = linOf(PAINT[q.paint].hex), i0 = iOf(q.a), i1 = Math.max(i0, iOf(q.b) - 1); for (let k = q.k0; k <= q.k1; k++) byLane[k].push([i0, i1, c, V * (q.thin ? THIN : 1)]); }
  const carry = GROOVE_K.map(() => [true, true]);                                  // the brush across the step, a half each; a clean one at first
  for (let k = 0; k < r.lanes; k++) {
    const odd = k % 2, way = (a, b) => odd ? [b, a] : [a, b];
    const strokesOf = c => o.mode === 'duo' ? [[n - 1, m1, true], [0, m2, true]]
      : o.mode === 'duosnake' ? [[...way(n - 1, m1), c[0]], [...way(0, m2), c[1]]]
      : o.mode === 'snake' ? [[...way(0, n - 1), c[0]]] : [[0, n - 1, true]];
    const grooves = GROOVE_K.map(([kv, kd, shade], g) => {
      const deps = byLane[k].flatMap(([i0, i1, c, v]) => Array.from({ length: i1 - i0 + 1 }, (_, j) => [i0 + j, c, v * kv / (i1 - i0 + 1)]));
      const w = laneWalk(n, deps, strokesOf(carry[g]), kd);
      if (snaky) carry[g] = w.outs.map(q => ({ b: Math.min(q.b, HOLD), bc: q.bc }));
      return { rgb: w.rgb, cover: w.cover, shade };
    });
    lanes.push({ k, c: laneAt(r, o.brush, k), grooves });
  }
  return { t0: -before, n, lanes };
}
// How far a sausage carries the line full at a Density — one lane, one stroke, till it is under FULL covered — and where it is gone
export const FULL = 0.9, GONE = 0.1;
export function reachOf(density) {
  const n = 2000, w = laneWalk(n, Array.from({ length: SAUSAGE_W }, (_, j) => [j, [0.01, 0.01, 0.01], paintOf(density) / SAUSAGE_W]), [[0, n - 1, true]]);
  let full = 0;
  for (let i = SAUSAGE_W; i < n; i++) { if (!full && w.cover[i] < FULL) full = i * DS; if (w.cover[i] < GONE) return { full, gone: i * DS }; }
  return { full: full || n * DS, gone: n * DS };
}
