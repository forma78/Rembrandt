// TYPE: letters as bands of brush lanes, painted in three passes (the owner,
// 2026-10-06; TYPE-Claude/TYPE.md and the prototype of Claude in chat,
// TYPE-Claude/Rembrandt · TYPE.html — its logic ported, not called). Pass 1,
// the Trace: the outline of every band in watercolour, from the cup. Pass 2,
// the Marks, and pass 3, the Drag, come next.
//
// A letter is glyphs.json's, New Yuri's set (rings.js: skeletonOf, placed).
// Its band is the skeleton W wide, round at its ends, W a share of the
// letter's height H; a stroke is split at every corner sharper than
// CORNER_DEG, so V, M, Z, L are overlapping bands; O, 0 and 8 are closed
// bands; the dots of ! and % are discs.
//
// Canvas mm from its centre, x right, y down, as in rings.js. No DOM.

import { skeletonOf, placed, pieceLength } from './rings.js';
import { fitPieces, toMachine, lengthOf, LOOP_SHARE, DIP_RUN } from './band.js';
import { pieceLen } from './strokes.js';

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k], dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const len = a => Math.hypot(a[0], a[1]), norm = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };

export const CORNER_DEG = 25;   // a sharper corner splits a stroke into two bands (the prototype's)
const CORNER = CORNER_DEG * Math.PI / 180;
const SPACE = 0.35;             // a space, of the letters' height (the prototype's)
const SHORT = 0.25;             // a part shorter than this share of the band's width is no band of its own (the prototype's)

// ---------- the letters ----------
// a stroke of glyphs.json → its skeleton's points on the canvas, about every mm
function strokePts(st, x, base, H, R) {
  const h = H - 2 * R;
  if (st.dot) return [[x + R + st.start[0] * h, base - R - st.start[1] * h]];
  const pts = [];
  for (const g of placed(skeletonOf(st), x, base, H, R)) {
    if (g.t === 'L') { if (!pts.length) pts.push(g.a); pts.push(g.b); continue; }
    const on = a => [g.c[0] + g.r * Math.cos(a), g.c[1] + g.r * Math.sin(a)], k = Math.max(2, Math.ceil(pieceLength(g)));
    if (!pts.length) pts.push(on(g.a0));
    for (let i = 1; i <= k; i++) pts.push(on(g.a0 + (g.a1 - g.a0) * i / k));
  }
  const out = [];
  for (const p of pts) if (!out.length || len(sub(p, out.at(-1))) > 0.05) out.push(p);
  return out;
}
// an open polyline split at its sharp corners: every run between them a band of its own
function splitCorners(pts) {
  const parts = [];
  let cur = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    cur.push(pts[i]);
    if (i < pts.length - 1) {
      const a = norm(sub(pts[i], pts[i - 1])), b = norm(sub(pts[i + 1], pts[i]));
      if (Math.acos(Math.max(-1, Math.min(1, dot(a, b)))) > CORNER) { parts.push(cur); cur = [pts[i]]; }
    }
  }
  parts.push(cur);
  return parts;
}
function resample(pts, step, closed) {
  const P = closed ? [...pts, pts[0]] : pts, cum = [0];
  for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + len(sub(P[i], P[i - 1])));
  const total = cum.at(-1);
  if (!(total > 1e-6)) return { pts: [P[0]], L: 0 };
  const n = Math.max(1, Math.round(total / step)), out = [];
  let j = 1;
  for (let k = 0; k <= (closed ? n - 1 : n); k++) {
    const s = total * k / n;
    while (j < P.length - 1 && cum[j] < s) j++;
    const t = (s - cum[j - 1]) / ((cum[j] - cum[j - 1]) || 1);
    out.push(add(P[j - 1], mul(sub(P[j], P[j - 1]), Math.max(0, Math.min(1, t)))));
  }
  return { pts: out, L: total };
}
// a band: its centre line every mm — s along it, T its tangent, N its normal
function bandOf(pts, closed, isDot, meta) {
  const r = isDot ? { pts, L: 0 } : resample(pts, 1, closed), P = r.pts, n = P.length, s = [], T = [], N = [];
  let acc = 0;
  for (let i = 0; i < n; i++) {
    if (i) acc += len(sub(P[i], P[i - 1]));
    s.push(acc);
    const t = n === 1 ? [1, 0] : closed ? norm(sub(P[(i + 1) % n], P[(i - 1 + n) % n])) : norm(sub(P[Math.min(n - 1, i + 1)], P[Math.max(0, i - 1)]));
    T.push(t); N.push([-t[1], t[0]]);
  }
  return { ...meta, pts: P, s, T, N, L: closed ? r.L : acc, closed, dot: isDot };
}

// ---------- the text ----------
// Upper case, the letters glyphs.json has, a line a line of the text.
export function cleanText(text, G) {
  return String(text ?? '').toUpperCase().split('\n').map(l => [...l].filter(c => c === ' ' || G[c]).join('').trim()).filter((l, i, a) => l || a.length === 1);
}
// a letter's advance: its box, W, and the gap — box to box, below 0 they overlap
const advanceOf = (G, ch, H, W, gap) => ch === ' ' ? H * SPACE : G[ch] ? G[ch].width * (H - W) + W + gap : 0;
const lineWidth = (G, line, H, W, gap) => line.length ? [...line].reduce((a, ch) => a + advanceOf(G, ch, H, W, gap), 0) - gap : 0;
// The text laid out, a block centred on x, y (the canvas's centre unless
// moved). o: { text, H the letters' height, band its width in % of H, gap
// between letters, lead between lines, x, y, mm }. → { segs: the bands, each
// { li the letter, si its band, ch, pts, s, T, N, L, closed, dot }, H, W, R,
// letters, lines }
export function layoutOf(G, o) {
  const lines = cleanText(o.text, G), H = o.H, W = o.band / 100 * H, R = W / 2;
  const blockH = lines.length * H + Math.max(0, lines.length - 1) * o.lead;
  const segs = [];
  let li = 0;
  lines.forEach((line, row) => {
    let x = (o.x || 0) - lineWidth(G, line, H, W, o.gap) / 2;
    const base = (o.y || 0) - blockH / 2 + H + row * (H + o.lead);
    for (const ch of line) {
      if (ch !== ' ') {
        let si = 0;
        for (const st of G[ch].strokes) {
          const pts = strokePts(st, x, base, H, R), meta = () => ({ li, si: si++, ch });
          if (st.dot || pts.length === 1) { segs.push(bandOf([pts[0]], false, true, meta())); continue; }
          if (st.closed && len(sub(pts[0], pts.at(-1))) < 0.5) { segs.push(bandOf(pts.slice(0, -1), true, false, meta())); continue; }
          for (const part of splitCorners(pts)) if (lengthOf(part) >= SHORT * W) segs.push(bandOf(part, false, false, meta()));
        }
        li++;
      }
      x += advanceOf(G, ch, H, W, o.gap);
    }
  });
  return { segs, H, W, R, letters: li, lines };
}
// The tallest letters whose block fits the canvas w × h inside its margin.
export function fitHeight(G, o, w, h, margin) {
  const lines = cleanText(o.text, G);
  if (!lines.some(Boolean)) return o.H;
  let best = 20;
  for (let H = 20; H <= 2000; H++) {
    const W = o.band / 100 * H, wide = Math.max(...lines.map(l => lineWidth(G, l, H, W, o.gap)));
    if (wide <= w - 2 * margin && lines.length * H + (lines.length - 1) * o.lead <= h - 2 * margin) best = H; else break;
  }
  return best;
}

// ---------- sessions ----------
// Bands that overlap a band of an earlier session go to a later one: the
// earlier must dry before the next marks go down (TYPE.md). OVERLAPS: 'wet'
// one session, wet on wet; 'letters' dry between letters — a letter's own
// bands overlap wet; 'all' dry every overlap. Sets seg.session. → how many.
const BOX = (seg, pad) => seg.pts.reduce((b, p) => [Math.min(b[0], p[0] - pad), Math.min(b[1], p[1] - pad), Math.max(b[2], p[0] + pad), Math.max(b[3], p[1] + pad)], [Infinity, Infinity, -Infinity, -Infinity]);
function touches(a, b, lim) {
  for (let i = 0; i < a.pts.length; i += 3) for (let j = 0; j < b.pts.length; j += 3) if (len(sub(a.pts[i], b.pts[j])) < lim) return true;
  return false;
}
export const OVERLAPS = ['wet', 'letters', 'all'];
export function sessionsOf(plan, overlap) {
  const { segs, W, R } = plan, boxes = segs.map(s => BOX(s, R));
  segs.forEach((s, i) => {
    s.session = 0;
    if (overlap === 'wet') return;
    const used = new Set();
    for (let j = 0; j < i; j++) {
      const o = segs[j], a = boxes[i], b = boxes[j];
      if (overlap === 'letters' && o.li === s.li) continue;
      if (a[2] < b[0] || b[2] < a[0] || a[3] < b[1] || b[3] < a[1]) continue;
      if (touches(s, o, W * 0.98)) used.add(o.session);
    }
    while (used.has(s.session)) s.session++;
  });
  return segs.length ? Math.max(...segs.map(s => s.session)) + 1 : 0;
}

// ---------- a band's loops ----------
// The band's side at d from its centre line (−d the other side), its points
// that would run backwards on a tight bend dropped; s: where along the band.
function offsetSide(seg, d) {
  const out = [];
  for (let i = 0; i < seg.pts.length; i++) {
    const q = add(seg.pts[i], mul(seg.N[i], d));
    if (out.length && dot(sub(q, out.at(-1).p), seg.T[i]) <= 0.05) continue;
    out.push({ p: q, s: seg.s[i] });
  }
  return out;
}
function capPoints(c, T, N, d, s, flip) {
  const out = [], k = Math.max(4, Math.ceil(Math.PI * d / 1.2)), f = flip ? -1 : 1;
  for (let i = 1; i < k; i++) { const th = Math.PI * i / k; out.push({ p: add(c, add(mul(N, f * d * Math.cos(th)), mul(T, f * d * Math.sin(th)))), s }); }
  return out;
}
// One loop at d from a band's centre line, a closed ring of { p, s }: an open
// band's a stadium — out on one side, round the end, back on the other, round
// the start; a closed band's an offset of it; a dot's a circle.
export function loopAt(seg, d) {
  if (seg.dot) {
    const c = seg.pts[0], k = Math.max(8, Math.ceil(2 * Math.PI * Math.abs(d) / 1.2));
    return Array.from({ length: k }, (_, i) => { const a = 2 * Math.PI * i / k; return { p: [c[0] + d * Math.cos(a), c[1] + d * Math.sin(a)], s: 0 }; });
  }
  if (seg.closed) return offsetSide(seg, d);
  const fwd = offsetSide(seg, d), back = offsetSide(seg, -d).reverse(), n = seg.pts.length - 1;
  if (d < 0.3) return [...fwd, ...back.slice(1, -1)];
  return [...fwd, ...capPoints(seg.pts[n], seg.T[n], seg.N[n], d, seg.L, false), ...back, ...capPoints(seg.pts[0], seg.T[0], seg.N[0], d, 0, true)];
}
// a band's outline at its full width: one loop, a closed band's two — outside and inside
export function outlinesOf(seg, R) {
  if (seg.closed && !seg.dot) return [{ part: 'outside', pts: loopAt(seg, R).map(q => q.p) }, { part: 'inside', pts: loopAt(seg, -R).map(q => q.p) }];
  return [{ part: seg.dot ? 'dot' : 'outline', pts: loopAt(seg, R).map(q => q.p) }];
}
// Clockwise on the canvas, as every ring of Rembrandt runs (Rembrandt.md §0,
// o'clock): with y down, a positive area is clockwise on the screen.
const areaOf = P => P.reduce((a, p, i) => { const q = P[(i + 1) % P.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
export const clockwise = P => areaOf(P) >= 0 ? P : P.slice().reverse();

// ---------- pass 1, the Trace ----------
// Every band's outline, band by band, letter by letter. A letter's first
// outline lands at its top, 12 o'clock (as a Circle's seam, Rembrandt.md §0),
// the next ones where the last one ended — the point of them nearest to there
// (New Yuri's rings). Each goes round clockwise, on `share` of itself over its
// start, the brush lifting off over all of that lap, as every loop of NOLAN
// and New Yuri (band.js, lapLoops; the owner, 2026-10-05: "60 %"). inset:
// the outline that far inside the band's edge — half the line's width, so
// the line's outer edge is the band's, as the drag's outermost lane's is
// (the owner, 2026-10-06, TYPE-Claude/Screenshot 2026-10-06 preview-issue.png:
// "the coloured letters go inside the outline of 1 Trace — it must not be
// so: the brush is the same, in paint and dry"). → [{ pts, C its length
// once round, lap mm, ch, li, si, part }]
export function traceOf(plan, share = LOOP_SHARE, inset = 0) {
  const out = [];
  let end = null, li = -1;
  for (const seg of plan.segs) {
    for (const { part, pts } of outlinesOf(seg, Math.max(0.5, plan.R - inset))) {
      const P = clockwise(pts);
      if (P.length < 3) continue;
      let i0 = 0;
      if (seg.li !== li || !end) P.forEach((p, i) => { if (p[1] < P[i0][1] - 1e-9) i0 = i; });
      else P.forEach((p, i) => { if (len(sub(p, end)) < len(sub(P[i0], end))) i0 = i; });
      li = seg.li;
      const ring = [...P.slice(i0), ...P.slice(0, i0), P[i0]], C = lengthOf(ring), lap = share * C, run = ring.slice();
      let d = 0;
      for (let j = 1; j < ring.length && d < lap; j++) {
        const p = ring[j], q = ring[j - 1], step = len(sub(p, q));
        if (d + step > lap) { run.push(add(q, mul(sub(p, q), (lap - d) / step))); d = lap; break; }
        run.push(p); d += step;
      }
      out.push({ pts: run, C, lap: d, ch: seg.ch, li: seg.li, si: seg.si, part });
      end = run.at(-1);
    }
  }
  return out;
}
// The Trace as rows of Test's run (strokes.js, plotRun): each outline fitted
// into lines and arcs, its lap the lift-off (tailOut). With ink, a dip, then
// outlines on what the brush holds while they keep within a dip run — an
// outline never split, as a ring is never (NOLAN, 2026-10-05: "I agree").
// → { ps, info: [{ label, li, L }] }
export function traceRows(trace, ink, dipRun = DIP_RUN) {
  const ps = [], info = [];
  let since = Infinity;
  for (const t of trace) {
    const pieces = fitPieces(t.pts);
    if (!pieces.length) continue;
    const L = pieces.reduce((a, g) => a + pieceLen(g), 0), nodip = !!ink && since + L <= dipRun;
    since = nodip ? since + L : L;
    const row = ps.length + 1;
    ps.push(pieces.map(g => ({ ...g, tilt: 0, row, tailOut: t.lap, ...(nodip ? { nodip: true } : {}) })));
    info.push({ label: `${t.ch} · band ${t.si + 1} · ${t.part === 'outline' ? 'its outline' : t.part === 'dot' ? 'the dot' : `the ${t.part}`}`, li: t.li, L });
  }
  return { ps, info };
}

// ---------- pass 2, the Marks ----------
// Each band's paints along its letter (the prototype's): a letter `per`
// paints from the palette, the next letter the next ones; a band clicked on
// steps its own (over, 'li:si' → how many steps). A mark every `spacing` mm
// along a band, in the middle of its stretch; a dot one. Sets seg.marks:
// [{ s, paint, p, N, T }] — paint the palette's index.
export function marksOf(plan, o) {
  const { segs, W } = plan, P = Math.max(1, o.paints), per = Math.max(1, o.per), total = {}, acc = {};
  for (const s of segs) total[s.li] = (total[s.li] || 0) + Math.max(s.L, W);
  for (const s of segs) {
    const first = (s.li * per + (o.over?.[`${s.li}:${s.si}`] || 0)) % P, n = s.dot ? 1 : Math.max(1, Math.round(s.L / o.spacing));
    const before = acc[s.li] || 0, span = Math.max(s.L, W);
    acc[s.li] = before + span;
    s.marks = [];
    for (let j = 0; j < n; j++) {
      const sm = s.dot ? 0 : s.L * (j + 0.5) / n, t = (before + (s.dot ? 0.5 : (j + 0.5) / n) * span) / total[s.li];
      let i = s.s.findIndex(v => v >= sm); if (i < 0) i = s.pts.length - 1;
      s.marks.push({ s: sm, paint: (first + Math.min(per - 1, Math.floor(t * per))) % P, p: s.pts[i], N: s.N[i], T: s.T[i] });
    }
  }
}
// A mark as the brush draws it: a stroke across the band, its round ends at
// the trace's inner edge (the trace's line `width` inside the band's edge);
// its ticks the paint's number, as on an abacus (the owner,
// 2026-10-06: "(a)") — a long one five, a short one one, so 8 is a long and
// three short — short strokes along the band from the mark's outer end in, a
// line and a line's white apart, so a wet line of `width` keeps them apart
// (Claude's choice: the prototype's 3.5 mm would run together at 4).
// → [{ pts, paint, tick, long }]; fits: false where the ticks pass the
// mark's other end.
export const ticksOf = paint => [...Array(Math.floor((paint + 1) / 5)).fill(true), ...Array((paint + 1) % 5).fill(false)];   // long?, in order
export function markPaths(seg, R, width) {
  const out = [], half = Math.max(2, R - width), pitch = 2 * width;
  for (const m of seg.marks) {
    const N = seg.dot ? [1, 0] : m.N, T = seg.dot ? [0, 1] : m.T;
    out.push({ pts: [add(m.p, mul(N, -half)), add(m.p, mul(N, half))], paint: m.paint, tick: false });
    ticksOf(m.paint).forEach((long, k) => {
      const at = half - width / 2 - pitch * k, c = add(m.p, mul(N, at)), l = (long ? 3 : 1.5) * width;
      out.push({ pts: [add(c, mul(T, -l)), add(c, mul(T, l))], paint: m.paint, tick: true, long, fits: at >= -half });
    });
  }
  return out;
}

// ---------- pass 3, the Drag ----------
// The pitch for `rings` lanes in a band W wide (the owner, 2026-10-06: "the
// E has 7 rings on the photo — I would make a slider, 5 for example"): an
// open band's rings from the brush's half width inside its edge to its
// centre line, rings − 1 pitches; a closed band's the same pitch, so
// 2·rings − 1 across it.
export const RINGS_MIN = 2, RINGS_MAX = 12;
export const pitchOf = (W, brush, rings) => Math.max(0.1, Math.max(0, W / 2 - brush / 2) / Math.max(1, rings - 1));
// Lanes: brush-down loops in a band, the brush's width inside its edge, a
// pitch apart, to its centre line (TYPE.md): an open band's concentric
// stadiums, a closed band's rings either side, a dot's circles. Outside
// first: from the edge in — a closed band's from its outer edge across to
// its hole's, in one sweep, so the non-stop path never jumps across the band
// (it went edge, hole, edge … before); inside first, the other way. → [{ d,
// ring }]
export function lanesOf(seg, W, o) {
  const Rc = Math.max(0, W / 2 - o.brush / 2);
  let ds = [];
  if (seg.closed) {
    const n = Math.max(1, Math.round(2 * Rc / o.pitch) + 1);
    for (let k = 0; k < n; k++) ds.push(n === 1 ? 0 : Rc - 2 * Rc * k / (n - 1));
  } else {
    const n = Math.max(1, Math.round(Rc / o.pitch) + 1);
    for (let k = 0; k < n; k++) ds.push(n === 1 ? Rc : Rc * (1 - k / (n - 1)));
  }
  if (o.order === 'in') ds.reverse();
  return ds.map(d => ({ d, ring: loopAt(seg, d) })).filter(l => l.ring.length > 1);
}
// a lane opened where the brush lands — just before the band's first mark —
// and run on DRAG_ON past its own start, so it closes without a seam (the prototype's)
export const DRAG_ON = 14;   // mm
function openRing(ring, startS, closed, L) {
  let i0 = 0;
  for (let i = 0; i < ring.length; i++) { const s = ring[i].s; if (closed ? ((s - startS + L) % L) < 2 : s >= startS) { i0 = i; break; } }
  const r = [...ring.slice(i0), ...ring.slice(0, i0)], tail = [r[0]];
  let acc = 0;
  for (let i = 1; i < r.length && acc < DRAG_ON; i++) { acc += len(sub(r[i].p, r[i - 1].p)); tail.push(r[i]); }
  return [...r, ...tail];
}
// DRAG non-stop (the owner, 2026-10-06, TYPE-Machine/, the first drag: "must
// the brush lift off the canvas every time? Maybe let it go on non-stop" —
// and from the start: "the dry brush rides the canvas non-stop, as
// Florian's"): a band's lanes one path, a spiral — round a lane, then on
// into the next one, JOG pitches along the band, the brush down all the
// way; the last lane runs on DRAG_ON past its own start. It lands once a
// band and lifts once: each lift and landing left a knob of paint in the
// band. → [{ p, s }]
export const JOG = 1;   // pitches along the band a step to the next lane takes: 45°, a short seam by the landing (Claude's choice; 3, 18°, cut long chords across a short band)
const ahead = (R, i, mm) => { let acc = 0, j = i; while (acc < mm) { const n = (j + 1) % R.length; acc += len(sub(R[n].p, R[j].p)); j = n; if (j === i) break; } return j; };
// from: where the brush comes from, still down (Pass through): the first lane
// from its point nearest to there, not from the band's landing.
export function spiralOf(seg, lanes, startS, pitch, from = null) {
  const out = [];
  let end = null, last = null;
  for (const { ring: R } of lanes) {
    if (R.length < 2) continue;
    let i0 = 0;
    if (!end && from) R.forEach((q, i) => { if (len(sub(q.p, from)) < len(sub(R[i0].p, from))) i0 = i; });
    else if (!end) { for (let i = 0; i < R.length; i++) { const s = R[i].s; if (seg.closed ? ((s - startS + seg.L) % seg.L) < 2 : s >= startS) { i0 = i; break; } } }
    else {
      R.forEach((q, i) => { if (len(sub(q.p, end)) < len(sub(R[i0].p, end))) i0 = i; });
      i0 = ahead(R, i0, JOG * pitch);
    }
    const r = [...R.slice(i0), ...R.slice(0, i0)];
    out.push(...r); end = r.at(-1).p; last = r;
  }
  if (last) {                                                                      // the last lane round to its own start, then on DRAG_ON past it
    out.push(last[0]);
    for (let i = 1, acc = 0; i < last.length && acc < DRAG_ON; i++) { acc += len(sub(last[i].p, last[i - 1].p)); out.push(last[i]); }
  }
  return out;
}
// Sets seg.lanes: [{ d, path: [{ p, s }], w, face? }], each lane on its own —
// Result's strips — and seg.spiral, the band's lanes as DRAG runs them, one
// path, after marksOf. For Result, the strip of the band each lane paints, w
// wide: the prototype's, a pitch less STRIP's groove — and the outermost
// one's out to the band's edge, where the brush's own edge runs (face: the
// strip's middle), so the colour reaches the trace's outer edge and covers
// it (the owner, 2026-10-06: "either pull the violet trace in, or widen the
// colour" — both: the trace inset, this).
export const STRIP = 0.94;   // of the lane's share: a hair of white between strips, the groove (the prototype's)
export function dragOf(plan, o) {
  const inner = Math.min(o.brush, o.pitch) * STRIP, R = plan.W / 2;
  plan.pitch = o.pitch;
  for (const s of plan.segs) {
    const startS = s.dot ? 0 : s.closed ? (s.marks[0].s - 4 + s.L) % s.L : Math.max(0, s.marks[0].s - 4);
    const open = ring => s.dot ? [...ring, ring[0]] : openRing(ring, startS, s.closed, s.L);
    const lanes = lanesOf(s, plan.W, o), edge = Math.max(0, ...lanes.map(l => Math.abs(l.d)));
    s.lanes = lanes.map(l => {
      const lane = { d: l.d, path: open(l.ring), w: inner };
      if (edge > 1e-9 && Math.abs(Math.abs(l.d) - edge) < 1e-9) {
        const w = o.brush / 2 + inner / 2, ring = loopAt(s, Math.sign(l.d) * (R - w / 2));
        if (ring.length > 1) Object.assign(lane, { w, face: open(ring) });
      }
      return lane;
    });
    s.spiral = spiralOf(s, lanes, startS, o.pitch);
    Object.assign(s, { rings: lanes, startS });
  }
}
// The marks a lane crosses going from s0 to s1 along its band (for Result).
export function crossed(seg, s0, s1) {
  if (seg.dot) return [];
  let a = s0, b = s1;
  if (seg.closed && Math.abs(b - a) > seg.L / 2) { if (b < a) b += seg.L; else a += seg.L; }
  if (a === b) return [];
  const lo = Math.min(a, b), hi = Math.max(a, b), hits = [];
  for (const m of seg.marks) for (const sm of seg.closed ? [m.s, m.s + seg.L] : [m.s]) if (sm > lo && sm <= hi) hits.push(m);
  return hits;
}

// ---------- the runs of MARKS and DRAG, a session at a time ----------
// MARKS (the owner, 2026-10-06: "I made the first trace; I cannot press
// MARKS"): every mark of the session's bands and its ticks, each a stroke of
// its own, mark then ticks, band by band; from the same cup as TRACE, a dip
// before every MARKS_DIP-th mark, its ticks on the same dip (the prototype's
// "dip every 4 marks"). → { ps, info: [{ label, li, L }], marks, count:
// marks per paint }
export const MARKS_DIP = 4;   // marks a dip carries, each with its ticks, est.
export function marksRows(plan, session, width, ink) {
  const ps = [], info = [], count = {};
  let n = 0;
  for (const s of plan.segs) {
    if (s.session !== session) continue;
    let mi = -1, ti = 0;
    for (const m of markPaths(s, plan.R, width)) {
      if (!m.tick) { mi++; n++; ti = 0; count[m.paint] = (count[m.paint] || 0) + 1; } else ti++;
      const dip = !m.tick && (n - 1) % MARKS_DIP === 0, row = ps.length + 1;
      ps.push([{ t: 'L', a: toMachine(m.pts[0]), b: toMachine(m.pts[1]), tilt: 0, row, ...(ink && !dip ? { nodip: true } : {}) }]);
      info.push({ label: `${s.ch} · band ${s.si + 1} · ${m.tick ? `paint ${m.paint + 1}, its ${m.long ? 'long' : 'short'} tick ${ti}` : `mark ${mi + 1}, paint ${m.paint + 1}`}`, li: s.li, L: lengthOf(m.pts) });
    }
  }
  return { ps, info, marks: n, count };
}
// DRAG's paths in a session: a band a path, its lanes non-stop (spiralOf);
// with `through`, Pass through (the owner, 2026-10-06: "a switch as on NOLAN
// — Pass through; maybe an interesting effect"; "(a)"): a letter a path, its
// bands one after another with the brush down. From one band to the next it
// goes inside the letter, never over the canvas between: to its band's centre
// line, along it to where the next band meets it, band to band through those
// meeting points — the E's middle bar to its bottom one by way of the stem —
// then into the next band's spiral, every other one from its centre out.
// Parts of a letter that do not meet (the dot of !, the rings of %) the brush
// lifts between. → [{ pts: [{ p, s }], ch, li, bands, lanes }]
function meetings(G, R) {                                                          // where the letter's bands meet: their centre lines within R
  const J = G.map(() => G.map(() => null));
  for (let i = 0; i < G.length; i++) for (let j = i + 1; j < G.length; j++) {
    let best = Infinity, at = null;
    for (const p of G[i].pts) for (const q of G[j].pts) { const d = len(sub(p, q)); if (d < best) { best = d; at = mul(add(p, q), 0.5); } }
    if (best <= R) J[i][j] = J[j][i] = at;
  }
  return J;
}
function routeOf(J, from, to) {                                                    // the bands from one to another through their meetings, fewest hops
  const prev = new Map([[from, -1]]), queue = [from];
  while (queue.length) {
    const i = queue.shift();
    if (i === to) break;
    J[i].forEach((m, j) => { if (m && !prev.has(j)) { prev.set(j, i); queue.push(j); } });
  }
  if (!prev.has(to)) return null;
  const out = [to];
  while (out[0] !== from) out.unshift(prev.get(out[0]));
  return out;
}
function along(seg, p, q) {                                                        // the centre line from nearest p to nearest q, the shorter way round a loop
  const near = x => seg.pts.reduce((b, c, i) => len(sub(c, x)) < len(sub(seg.pts[b], x)) ? i : b, 0);
  const a = near(p), b = near(q), n = seg.pts.length, out = [];
  if (!seg.closed || Math.abs(b - a) <= n / 2) { const st = b >= a ? 1 : -1; for (let i = a; i !== b + st; i += st) out.push(seg.pts[i]); }
  else { const st = b > a ? -1 : 1; for (let i = a; i !== b; i = (i + st + n) % n) out.push(seg.pts[i]); out.push(seg.pts[b]); }
  return out;
}
export function dragPaths(plan, session, through = false) {
  const segs = plan.segs.filter(s => s.session === session && s.spiral?.length), out = [];
  if (!through) return segs.map(s => ({ pts: [...s.spiral], ch: s.ch, li: s.li, bands: 1, lanes: s.lanes.length }));
  for (const li of [...new Set(segs.map(s => s.li))]) {
    const G = segs.filter(s => s.li === li), J = meetings(G, plan.R), done = new Set([0]);
    const fresh = i => ({ pts: [...G[i].spiral], ch: G[i].ch, li, bands: 1, lanes: G[i].lanes.length });
    let d = fresh(0), cur = 0;
    while (done.size < G.length) {
      const at = d.pts.at(-1).p, near = s => Math.min(...s.pts.map(q => len(sub(q, at))));
      let best = null;
      G.forEach((s, j) => {
        if (done.has(j)) return;
        const r = routeOf(J, cur, j); if (!r) return;
        const cost = r.length * 1e4 + near(s);
        if (!best || cost < best.cost) best = { j, r, cost };
      });
      if (!best) { out.push(d); const j = G.findIndex((_, i) => !done.has(i)); d = fresh(j); done.add(j); cur = j; continue; }   // a part apart: the brush lifts
      let p = at;
      for (let k = 1; k < best.r.length; k++) {                                     // along the centre lines, meeting to meeting
        const m = J[best.r[k - 1]][best.r[k]];
        d.pts.push(...along(G[best.r[k - 1]], p, m).map(q => ({ p: q, s: null })), { p: m, s: null });
        p = m;
      }
      const s = G[best.j], rings = d.bands % 2 ? [...s.rings].reverse() : s.rings;
      d.pts.push(...spiralOf(s, rings, s.startS, plan.pitch, p));
      d.bands++; d.lanes += s.lanes.length; done.add(best.j); cur = best.j;
    }
    out.push(d);
  }
  return out;
}
// DRAG: the session's paths one after another, a row a path; the dry brush,
// no dip ever (TYPE.md: "pass 3 never dips"). → { ps, info, lanes, bands, paths, length }
export function dragRows(plan, session, through = false) {
  const ps = [], info = [];
  let length = 0, lanes = 0, bands = 0;
  for (const d of dragPaths(plan, session, through)) {
    const pts = d.pts.map(q => q.p), pieces = fitPieces(pts);
    if (!pieces.length) continue;
    const row = ps.length + 1, L = lengthOf(pts);
    ps.push(pieces.map(g => ({ ...g, tilt: 0, row })));
    info.push({ label: d.bands > 1 ? `${d.ch} · ${d.bands} bands, ${d.lanes} lanes non-stop` : `${d.ch} · ${d.lanes} lanes non-stop`, li: d.li, L });
    length += L; lanes += d.lanes; bands += d.bands;
  }
  return { ps, info, lanes, bands, paths: ps.length, length };
}

