// FORM's page (the owner, 2026-10-30: "a new tab FORM on the basis of our
// flagship, OPM-P … let us go over to figurative painting and try to make the
// little car as here"). OPM-P's page, all of it — the pencil, DRAW BW, FRAME,
// DRAG, PAINTING MACHINE, ELBOW LIVE, Play — and the forms off a photo in the
// blends' place (formplan.js). inka.js's FORM: its hooks here, its state
// given (init): the forms and the chosen ones, the photo on the canvas, Auto
// forms, V a form chosen or its point dragged, K the knife, Merge, Delete,
// the materials, and the view turned (the owner: "Rotate Canvas CCW / CW next
// to the zoom − 100 % +", the 60 × 80 profile turned to draw it).
//
// mm from the canvas's bottom left corner, x right, y up.

import { autoForms, withMaterials, cutForms, mergeForms, reflectForms, readMoved, paletteForms, formPlan, formPreview, spokeThrough, MATERIALS, SMALLEST_NEW, SMALLEST_MIN, SMALLEST_MAX, STRAIGHT_NEW, STRAIGHT_MIN, STRAIGHT_MAX, CORNER_NEW, CORNER_MIN, CORNER_MAX, SPOKE_NEW, SPOKE_MIN, SPOKE_MAX } from './formplan.js';
import { areaOf, FRAME_MARK } from './opmplan.js';
import { fmt } from './util.js';
import { PAINT, newPalette } from './tapeplan.js';
import { INKA_META } from './inkaplan.js';
import { SAUSAGE_W } from './ccdplan.js';

const RES = 1;                      // mm, the photo read on the canvas a pixel so big
const PICK_PX = 7;                  // px: a form's point so near the pointer taken
export const FORM_STATE = { forms: [], fsel: [], fpal: null, fseed: 0, aseed: 0, background: false, cellsBy: 'photo', smallest: SMALLEST_NEW, straight: STRAIGHT_NEW, fcorner: CORNER_NEW, spoke: SPOKE_NEW, turn: 0, pturn: 0, formV: 1 };
export const FORM_NUM = ['smallest', 'straight', 'fcorner', 'spoke', 'turn', 'pturn', 'fseed', 'aseed'];
export const FORM_UNDO = ['forms', 'fsel', 'fpal', 'fseed', 'aseed', 'background', 'cellsBy', 'smallest', 'straight', 'fcorner', 'spoke', 'pturn'];
const MAT = { metal: 'Metal', glass: 'Glass', rubber: 'Rubber' };
const MAT_TINT = { metal: '#E07A5F', glass: '#5DA9E9', rubber: '#2B2B2B' };

// the forms as kept, every number finite, every loop three points at least
export const cleanForms = raw => !Array.isArray(raw) ? [] : raw.filter(F => F && Array.isArray(F.loops) && F.loops.length && F.loops.every(L => Array.isArray(L) && L.length >= 3 && L.every(p => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]))))
  .map((F, i) => { const loops = F.loops.map(L => L.map(p => [p[0], p[1]])); return { id: Number.isFinite(F.id) ? F.id : i, pencil: typeof F.pencil === 'string' ? F.pencil : null, loops, area: loops.reduce((a, L) => a + areaOf(L), 0), bg: F.bg === true, material: MATERIALS.includes(F.material) ? F.material : 'metal', colour: typeof F.colour === 'string' ? F.colour : null, flat: F.flat === true, read: Array.isArray(F.read) && F.read.length === 6 && F.read.every(Number.isFinite) ? F.read.slice() : okPt(F.shift) ? [1, 0, 0, 1, -F.shift[0], -F.shift[1]] : null,
    ...(Array.isArray(F.parts) && F.parts.length ? { parts: F.parts.filter(q => q && Array.isArray(q.loop) && q.loop.length >= 3 && q.loop.every(okPt)).map(q => ({ loop: q.loop.map(p => [p[0], p[1]]), read: Array.isArray(q.read) && q.read.length === 6 && q.read.every(Number.isFinite) ? q.read.slice() : null })) } : {}), ...(Array.isArray(F.ss) ? { ss: F.ss.filter(q => q && okPt(q.a) && okPt(q.b) && PAINT[q.paint]).map(q => ({ a: [q.a[0], q.a[1]], b: [q.b[0], q.b[1]], paint: q.paint })) } : {}) }; });
const okPt = p => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]);
export function loadForm(S, o) {
  S.forms = cleanForms(o.forms); S.fsel = Array.isArray(o.fsel) ? o.fsel.filter(Number.isFinite) : [];
  S.fpal = o.fpal && Array.isArray(o.fpal.core) && o.fpal.core.every(id => PAINT[id]) ? { name: String(o.fpal.name ?? ''), core: o.fpal.core.slice(), accent: (o.fpal.accent ?? []).filter(id => PAINT[id]) } : null;
  S.background = o.background === true; delete S.bricks;                              // Bricks gone (2026-10-30)
  S.cellsBy = o.cellsBy === 'preview' ? 'preview' : 'photo';
  const to = (v, a, b, d) => Number.isFinite(v) ? Math.max(a, Math.min(b, v)) : d;
  S.smallest = to(S.smallest, SMALLEST_MIN, SMALLEST_MAX, SMALLEST_NEW); S.straight = to(S.straight, STRAIGHT_MIN, STRAIGHT_MAX, STRAIGHT_NEW);
  S.fcorner = to(S.fcorner, CORNER_MIN, CORNER_MAX, CORNER_NEW); S.spoke = to(S.spoke, SPOKE_MIN, SPOKE_MAX, SPOKE_NEW);
  S.turn = ((Math.round((S.turn || 0) / 90) * 90) % 360 + 360) % 360; S.pturn = ((Math.round((S.pturn || 0) / 90) * 90) % 360 + 360) % 360;
  S.rects = []; S.nodes = [];                                                        // no tiles here: OPM-P's keep, the first visit's, its blends left
  if (!['edit', 'knife', 'frame'].includes(S.tool)) S.tool = 'edit';                 // OPM-P's B or R, out of sight here: V
}

let A = null, S = null;
export function initForm(api) { A = api; S = api.S; panel(); turnKeys(); }

// ---------- the photo on the canvas ----------
// the chosen reference, fitted whole into the canvas as the view stood when the forms were made (pturn): upright on
// the screen then, turned with the canvas since; { nx, ny, h, data: RGBA, the top row first } or null
let PHOTO = null;
export function photo() {
  if (!A) return null;
  const R = A.ref(), img = R?.img, key = [R?.src?.length ?? 0, R?.name ?? '', S.ref, S.boardW, S.boardH, S.pturn].join('|');
  if (PHOTO?.key === key) return PHOTO.img;
  if (!img) return (PHOTO = { key, img: null }).img;
  const c = document.createElement('canvas'), W = Math.round(S.boardW / RES), H = Math.round(S.boardH / RES);
  c.width = W; c.height = H;
  const x = c.getContext('2d', { willReadFrequently: true }), t = S.pturn, bw = t % 180 ? H : W, bh = t % 180 ? W : H, s = Math.min(bw / img.naturalWidth, bh / img.naturalHeight);
  x.translate(W / 2, H / 2); x.rotate(-t * Math.PI / 180);
  x.drawImage(img, -img.naturalWidth * s / 2, -img.naturalHeight * s / 2, img.naturalWidth * s, img.naturalHeight * s);
  PHOTO = { key, img: { nx: W, ny: H, h: RES, data: x.getImageData(0, 0, W, H).data } };
  return PHOTO.img;
}
export const photoKey = () => (photo(), PHOTO?.key ?? '');
const shownForms = () => S.background ? S.forms.filter(F => F.pencil) : S.forms.filter(F => !F.bg);

// ---------- the plan and the Preview ----------
export function plan(o) {
  const img = A ? photo() : null;
  if (!img) return null;
  return formPlan(S.forms, img, { ...o, background: S.background, cells: S.cellsBy, corner: S.fcorner, spoke: S.spoke, density: S.density });
}
export const planKey = () => JSON.stringify([photoKey(), S.forms, S.background, S.cellsBy, S.fcorner, S.spoke, S.density]);
let PV = null;
const NONE = { nx: 1, ny: 1, h: 1, rgba(d) { d[0] = d[1] = d[2] = d[3] = 0; } };   // no Preview yet: nothing over the canvas
export function preview(ground) {
  const key = JSON.stringify([photoKey(), shownForms(), S.pitch, S.spoke, S.density, S.facets]);
  if (PV?.key !== key) {
    const img = photo(), P = img && S.forms.length ? formPreview(shownForms(), img, { pitch: S.pitch, facets: S.facets, spoke: S.spoke, density: S.density }) : null;
    PV = { key, sim: P ? P.sim : { ...NONE, nx: 1, ny: 1, h: Math.max(S.boardW, S.boardH) }, n: P ? P.sausages.length : 0, ss: P ? P.sausages : [] };
    PV.B = A.bitmapOf(PV.sim, ground);
  }
  return { key: PV.key, sim: PV.sim, ss: PV.ss, ...PV.B };
}

// ---------- FRAME: four marks round the forms painted ----------
// one in the middle of every side of their box, FRAME_MARK at most, on its line — the canvas laid straight by them
export function frameMods(pencil) {
  const pts = shownForms().flatMap(F => F.loops[0]);
  if (!pts.length) return [];
  const x0 = Math.min(...pts.map(p => p[0])), x1 = Math.max(...pts.map(p => p[0])), y0 = Math.min(...pts.map(p => p[1])), y1 = Math.max(...pts.map(p => p[1]));
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, hx = Math.min(FRAME_MARK, x1 - x0) / 2, hy = Math.min(FRAME_MARK, y1 - y0) / 2;
  return [[[mx - hx, y0], [mx + hx, y0]], [[x1, my - hy], [x1, my + hy]], [[mx + hx, y1], [mx - hx, y1]], [[x0, my + hy], [x0, my - hy]]]
    .map(([a, b]) => ({ kind: 'cell', mark: true, line: 'row', pencil, pieces: [{ t: 'L', a, b }], mm: Math.hypot(b[0] - a[0], b[1] - a[1]) }));
}

// ---------- the board ----------
const inLoop = (P, q) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > q[1]) !== (b[1] > q[1]) && q[0] < (b[0] - a[0]) * (q[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
const inForm = (F, q) => inLoop(F.loops[0], q) && !F.loops.slice(1).some(L => inLoop(L, q));
const formAt = q => S.forms.filter(F => (S.background || !F.bg) && inForm(F, q)).sort((a, b) => Math.abs(a.area) - Math.abs(b.area))[0] ?? null;
function pointAt(q) {
  const r = PICK_PX / A.k();
  let best = null, bd = r;
  for (const F of S.forms) if (S.fsel.includes(F.id)) for (const L of F.loops) for (const p of L) { const d = Math.hypot(p[0] - q[0], p[1] - q[1]); if (d < bd) { bd = d; best = [p[0], p[1]]; } }
  return best;
}
// A new point on a chosen form's border (the owner, 2026-10-30, the pillars by the window, Screenshot 7.16.24 PM: "where I want
// to add points to modify the form — now a triangle, I want a rectangle by adding a new point"): V, a click on its border between
// two points, as Illustrator's Add Anchor Point — the point there, dragged at once; in every form's border it lies on, so a
// shared one stays shared. → the point on the border nearest q, or null
function edgeAt(q) {
  const r = PICK_PX / A.k();
  let best = null, bd = r;
  for (const F of S.forms) if (S.fsel.includes(F.id)) for (const L of F.loops) L.forEach((a, i) => {
    const b = L[(i + 1) % L.length], e = [b[0] - a[0], b[1] - a[1]], L2 = e[0] * e[0] + e[1] * e[1];
    if (!L2) return;
    const u = ((q[0] - a[0]) * e[0] + (q[1] - a[1]) * e[1]) / L2, at = [a[0] + u * e[0], a[1] + u * e[1]], d = Math.hypot(q[0] - at[0], q[1] - at[1]);
    if (u > 0 && u < 1 && d < bd) { bd = d; best = at; }
  });
  return best;
}
function addPoint(at) {
  for (const F of S.forms) for (const L of F.loops) for (let i = 0; i < L.length; i++) {
    const a = L[i], b = L[(i + 1) % L.length], e = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(e[0], e[1]), u = l ? ((at[0] - a[0]) * e[0] + (at[1] - a[1]) * e[1]) / (l * l) : -1;
    if (u > 1e-9 && u < 1 - 1e-9 && Math.abs(e[0] * (at[1] - a[1]) - e[1] * (at[0] - a[0])) / l < 1e-6) { L.splice(i + 1, 0, at.slice()); break; }
  }
}
// the photo, upright as the forms were made, over the canvas as tracing paper; the forms' outlines, the chosen ones
// thick and their points; the knife's line
let grab = null, hover = null;
export function draw(g, live) {
  const R = A.ref(), img = R?.img, c = A.scr([S.boardW / 2, S.boardH / 2]), k = A.k();
  g.save(); g.setTransform(A.dpr(), 0, 0, A.dpr(), 0, 0);
  if (img && S.refOpacity > 0) {
    const t = S.pturn, bw = (t % 180 ? S.boardH : S.boardW), bh = (t % 180 ? S.boardW : S.boardH), s = Math.min(bw / img.naturalWidth, bh / img.naturalHeight);
    const r0 = S.forms[0]?.read ?? [1, 0, 0, 1, 0, 0], alike = S.forms.length && r0[0] === 1 && r0[1] === 0 && r0[2] === 0 && r0[3] === 1 && S.forms.every(F => JSON.stringify(F.read ?? [1, 0, 0, 1, 0, 0]) === JSON.stringify(r0)), sh = alike ? [-r0[4], -r0[5]] : [0, 0];   // moved alike: the photo with them
    const c2 = A.scr([S.boardW / 2 + sh[0], S.boardH / 2 + sh[1]]);
    g.save(); g.translate(c2[0], c2[1]); g.rotate(-t * Math.PI / 180); g.globalAlpha = S.refOpacity / 100;
    g.drawImage(img, -img.naturalWidth * s * k / 2, -img.naturalHeight * s * k / 2, img.naturalWidth * s * k, img.naturalHeight * s * k);
    g.restore();
  }
  if (live) {
    const path = F => { g.beginPath(); for (const L of F.loops) L.forEach((p, i) => { const q = A.scr(p); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.closePath(); };
    g.lineJoin = 'round';
    for (const F of S.forms) {
      const on = S.fsel.includes(F.id), hide = F.bg && !S.background;
      if (hide && !on) continue;
      path(F);
      if (S.view === 'forms' && !hide) { g.fillStyle = MAT_TINT[F.material] + '88'; g.fill('evenodd'); }
      g.setLineDash(hide ? [4, 3] : []); g.lineWidth = on ? 2 : 0.8; g.strokeStyle = on ? '#EB7A25' : 'rgba(36,34,31,.55)'; g.stroke();
    }
    g.setLineDash([]);
    for (const F of S.forms) if (S.fsel.includes(F.id)) for (const L of F.loops) for (const p of L) { const q = A.scr(p); g.fillStyle = '#FFF'; g.strokeStyle = '#EB7A25'; g.lineWidth = 1; g.fillRect(q[0] - 2.5, q[1] - 2.5, 5, 5); g.strokeRect(q[0] - 2.5, q[1] - 2.5, 5, 5); }
    if (hover && !grab && S.tool === 'edit') { const q = A.scr(hover); g.strokeStyle = '#EB7A25'; g.lineWidth = 1; g.setLineDash([2, 2]); g.strokeRect(q[0] - 3.5, q[1] - 3.5, 7, 7); g.setLineDash([]); g.beginPath(); g.moveTo(q[0] + 6, q[1] - 6); g.lineTo(q[0] + 12, q[1] - 6); g.moveTo(q[0] + 9, q[1] - 9); g.lineTo(q[0] + 9, q[1] - 3); g.stroke(); }   // a new point here: +
    if (S.tool === 'paint' || S.view === 'result') {                                 // the sausages: a capsule each in its paint
      g.lineCap = 'round';
      for (const q of preview().ss ?? []) { const a = A.scr(q.a), b = A.scr(q.b); g.strokeStyle = 'rgba(20,18,16,.75)'; g.lineWidth = SAUSAGE_W * k + 2; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.strokeStyle = PAINT[q.paint]?.hex ?? '#888'; g.lineWidth = SAUSAGE_W * k; g.stroke(); }
      if (grab?.kind === 'sausage') { const a = A.scr(grab.a), b = A.scr(grab.b); g.strokeStyle = PAINT[S.paint]?.hex ?? '#888'; g.lineWidth = SAUSAGE_W * k; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
      g.lineCap = 'butt';
    }
    if (grab?.kind === 'mirror') {                                                   // the axis, across the canvas; the side kept, a note by it
      const d = [grab.b[0] - grab.a[0], grab.b[1] - grab.a[1]], L = Math.hypot(...d) || 1, far = Math.hypot(S.boardW, S.boardH), u = [d[0] / L, d[1] / L];
      const a = A.scr([grab.a[0] - u[0] * far, grab.a[1] - u[1] * far]), b = A.scr([grab.a[0] + u[0] * far, grab.a[1] + u[1] * far]);
      g.strokeStyle = '#0A7'; g.lineWidth = 1.5; g.setLineDash([10, 4, 2, 4]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.setLineDash([]);
      const keep = paintedSide(grab.a, grab.b) * (grab.alt ? -1 : 1), q = A.scr([grab.b[0] - u[1] * keep * 30 / k, grab.b[1] + u[0] * keep * 30 / k]);
      g.fillStyle = '#0A7'; g.font = '600 11px ui-monospace, monospace'; g.textAlign = 'center'; g.fillText('kept · ⌥ the other', q[0], q[1]);
    }
    if (grab?.kind === 'knife') { const a = A.scr(grab.a), b = A.scr(grab.b); g.strokeStyle = '#0A7'; g.lineWidth = 1.5; g.setLineDash([6, 4]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
  }
  g.restore();
}
// V: a click a form chosen (⇧ one more or less), a chosen form's point dragged — every form's point there with it,
// a border two forms share stays shared; K: a line drawn across, every form it crosses cut — the chosen only, if any
export function pointer(type, e) {
  if (S.tool === 'paint') return sausage(type, e);
  if (S.tool === 'mirror') return mirror(type, e);
  if (S.tool !== 'edit' && S.tool !== 'knife') return false;
  const p = A.toMm(e);
  if (type === 'down') {
    if (S.tool === 'knife') { grab = { kind: 'knife', a: p, b: p }; A.capture(e); A.kick(); return true; }
    const hit = S.fsel.length ? pointAt(p) : null;
    if (hit) { A.undoPush(); grab = { kind: 'point', at: hit, moved: false }; A.capture(e); return true; }
    const at = S.fsel.length && !e.shiftKey ? edgeAt(p) : null;
    if (at) { A.undoPush(); addPoint(at); grab = { kind: 'point', at, moved: false }; hover = null; A.capture(e); A.kick(); return true; }
    const F = formAt(p);
    if (e.shiftKey && F) S.fsel = S.fsel.includes(F.id) ? S.fsel.filter(id => id !== F.id) : [...S.fsel, F.id];
    else S.fsel = F ? [F.id] : [];
    A.save(); showForm(); A.kick(); return true;
  }
  if (type === 'move') {
    if (!grab) {
      const pt = S.tool === 'edit' && S.fsel.length ? pointAt(p) : null, h = S.tool === 'edit' && S.fsel.length && !pt && !e.shiftKey ? edgeAt(p) : null;
      if (h || hover) { hover = h; A.kick(); }
      A.cursor(S.tool === 'knife' ? 'crosshair' : pt ? 'grab' : h ? 'copy' : formAt(p) ? 'pointer' : ''); return true;
    }
    if (grab.kind === 'knife') { grab.b = p; A.kick(); return true; }
    const to = [Math.round(p[0] * 2) / 2, Math.round(p[1] * 2) / 2];               // half a mm, the grid of a hand
    for (const F of S.forms) for (const L of F.loops) for (const q of L) if (q[0] === grab.at[0] && q[1] === grab.at[1]) { q[0] = to[0]; q[1] = to[1]; }
    grab.at = to; grab.moved = true; A.kick(); return true;
  }
  if (type === 'up') {
    const G = grab; grab = null;
    if (G?.kind === 'knife' && Math.hypot(G.b[0] - G.a[0], G.b[1] - G.a[1]) * A.k() > 4) {
      const sel = new Set(S.fsel), next = cutForms(S.forms, G.a, G.b, F => (sel.size ? sel.has(F.id) : true) && (S.background || !F.bg));
      if (next !== S.forms) { A.undoPush(); S.forms = next.map(F => Array.isArray(F.ss) ? { ...F, ss: F.ss.filter(q => inForm(F, [(q.a[0] + q.b[0]) / 2, (q.a[1] + q.b[1]) / 2])) } : F); S.fsel = S.fsel.filter(id => S.forms.some(F => F.id === id)); }
    }
    if (G?.kind === 'point') for (const F of S.forms) F.area = F.loops.reduce((a, L) => a + areaOf(L), 0);
    A.settle(); return true;
  }
  return false;
}
// M, the sausages by hand (the owner, 2026-10-30: "then the sausages [M] — to change the colour myself, to correct what the
// algorithm makes"): a form's sausages the algorithm's off the photo till it is touched, then its own — a click on one in the
// chosen paint takes it away, in another repaints it; a drag lays one; a click elsewhere in a form a spoke through it, from
// its outline in. The cells off the Preview from then on, so the Paint shows it.
const sausagesNow = () => preview().ss ?? [];
const segDist = (p, a, b) => { const e = [b[0] - a[0], b[1] - a[1]], L2 = e[0] * e[0] + e[1] * e[1], u = L2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * e[0] + (p[1] - a[1]) * e[1]) / L2)) : 0; return Math.hypot(p[0] - a[0] - u * e[0], p[1] - a[1] - u * e[1]); };
function own(F) { if (!Array.isArray(F.ss)) F.ss = sausagesNow().filter(q => q.form === F.id).map(q => ({ a: q.a.slice(), b: q.b.slice(), paint: q.paint })); return F.ss; }
function sausage(type, e) {
  const p = A.toMm(e);
  if (type === 'down') { grab = { kind: 'sausage', a: p, b: p }; A.capture(e); return true; }
  if (type === 'move') { if (grab?.kind === 'sausage') { grab.b = p; A.kick(); } else A.cursor('crosshair'); return true; }
  const G = grab; grab = null;
  if (G?.kind !== 'sausage') return true;
  const F = formAt(G.a);
  if (!F || !PAINT[S.paint]) { A.kick(); return true; }
  const drag = Math.hypot(G.b[0] - G.a[0], G.b[1] - G.a[1]) * A.k() > 4;
  A.undoPush();
  const ss = own(F);
  if (drag) ss.push({ a: G.a, b: G.b, paint: S.paint });
  else {
    const r = SAUSAGE_W / 2 + 4 / A.k(), hit = ss.map((q, i) => [segDist(G.a, q.a, q.b), i]).filter(([d]) => d <= r).sort((x, y) => x[0] - y[0])[0];
    if (hit) { const q = ss[hit[1]]; if (q.paint === S.paint) ss.splice(hit[1], 1); else q.paint = S.paint; }
    else { const sp = spokeThrough(F, G.a, { facets: S.facets }); if (sp) ss.push({ ...sp, paint: S.paint }); }
  }
  S.cellsBy = 'preview'; S.fsel = [F.id];
  A.settle(); return true;
}
// O, Reflect, as Illustrator's (the owner, 2026-10-30, the right mirror lost, Screenshot 1.16.15 PM: "a new tool, mirror — the
// left part simply mirrored; the knife and the mirrored copy"): a line drawn, the axis across the canvas; every form cut along
// it, the side with more painted kept — ⌥ the other — and mirrored onto the far one, its colours off the photo through the mirror
// the painted area either side of the axis: every form's loops clipped to the left half-plane (Sutherland–Hodgman), the rest the right's
const paintedSide = (a, b) => {
  const n = [-(b[1] - a[1]), b[0] - a[0]], sd = p => (p[0] - a[0]) * n[0] + (p[1] - a[1]) * n[1];
  const clip = P => P.flatMap((p, i) => { const q = P[(i + 1) % P.length], sp = sd(p), sq = sd(q), X = (sp > 0) !== (sq > 0) ? [[p[0] + (q[0] - p[0]) * sp / (sp - sq), p[1] + (q[1] - p[1]) * sp / (sp - sq)]] : []; return sp > 0 ? [p, ...X] : X; });
  let l = 0, all = 0;
  for (const F of shownForms()) for (const L of F.loops) { const c = clip(L); l += c.length >= 3 ? areaOf(c) : 0; all += areaOf(L); }
  return l >= all - l ? 1 : -1;
};
function mirror(type, e) {
  const p = A.toMm(e);
  if (type === 'down') { grab = { kind: 'mirror', a: p, b: p }; A.capture(e); A.kick(); return true; }
  if (type === 'move') { if (grab?.kind === 'mirror') { grab.b = p; grab.alt = e.altKey; A.kick(); } else A.cursor('crosshair'); return true; }
  const G = grab; grab = null;
  if (G?.kind !== 'mirror' || Math.hypot(G.b[0] - G.a[0], G.b[1] - G.a[1]) * A.k() < 8) { A.kick(); return true; }
  const keep = paintedSide(G.a, G.b) * (e.altKey ? -1 : 1), next = reflectForms(S.forms, G.a, G.b, keep);
  if (next === S.forms) { A.kick(); return true; }
  A.undoPush(); S.forms = next.map(F => Array.isArray(F.ss) ? { ...F, ss: F.ss.filter(q => inForm(F, [(q.a[0] + q.b[0]) / 2, (q.a[1] + q.b[1]) / 2])) } : F); S.fsel = [];
  A.settle(); return true;
}
// Align, OPM-S's four in the Tools (the owner: "bring the alignments back from OPM-P into the TOOLS"): the chosen forms, or
// every one, as one or — Even gaps — every group of forms side by side a figure; a form moved reads the photo where it came
// from (its read), its sausages with it
export function align(kind) {
  const set = S.fsel.length ? S.forms.filter(F => S.fsel.includes(F.id)) : S.forms.slice();
  if (!set.length) return;
  const boxOf = Fs => { const pts = Fs.flatMap(F => F.loops[0]); return { x0: Math.min(...pts.map(q => q[0])), x1: Math.max(...pts.map(q => q[0])), y0: Math.min(...pts.map(q => q[1])), y1: Math.max(...pts.map(q => q[1])) }; };
  const shown = set.filter(F => S.background || !F.bg), keys = F => new Set(F.loops.flatMap(L => L.map(q => `${q[0]},${q[1]}`)));
  const groups = [];                                                                 // forms sharing a point: one figure
  for (const F of set) { const k = keys(F), g = groups.filter(G => G.some(H => H.k.some(x => k.has(x)))); const merged = [{ F, k: [...k] }, ...g.flat()]; for (const G of g) groups.splice(groups.indexOf(G), 1); groups.push(merged); }
  const figs = groups.map(G => G.map(x => x.F)), round = v => Math.round(v * 2) / 2, moves = new Map();
  const fit = figs.filter(Fs => Fs.some(F => shown.includes(F)));
  if (kind === 'midX' || kind === 'midY') {
    const b = boxOf(shown.length ? shown : set), d = kind === 'midX' ? [round(S.boardW / 2 - (b.x0 + b.x1) / 2), 0] : [0, round(S.boardH / 2 - (b.y0 + b.y1) / 2)];
    for (const F of set) moves.set(F, d);
  } else {
    const ax = kind === 'gapX' ? 0 : 1, bs = fit.map(Fs => ({ Fs, b: boxOf(Fs.filter(F => shown.includes(F))) })).sort((x, y) => (ax ? x.b.y0 - y.b.y0 : x.b.x0 - y.b.x0));
    if (bs.length < 3) return;
    const lo = ax ? bs[0].b.y0 : bs[0].b.x0, hi = ax ? bs.at(-1).b.y1 : bs.at(-1).b.x1, sizes = bs.reduce((a, q) => a + (ax ? q.b.y1 - q.b.y0 : q.b.x1 - q.b.x0), 0), gap = (hi - lo - sizes) / (bs.length - 1);
    let at = lo;
    for (const q of bs) { const d = round(at - (ax ? q.b.y0 : q.b.x0)); for (const F of q.Fs) moves.set(F, ax ? [0, d] : [d, 0]); at += (ax ? q.b.y1 - q.b.y0 : q.b.x1 - q.b.x0) + gap; }
  }
  if (![...moves.values()].some(d => d[0] || d[1])) return;
  A.undoPush();
  S.forms = S.forms.map(F => {
    const d = moves.get(F); if (!d || !d[0] && !d[1]) return F;
    const mv = q => [q[0] + d[0], q[1] + d[1]];
    return { ...F, loops: F.loops.map(L => L.map(mv)), read: readMoved(F.read ?? undefined, d), ...(F.parts?.length ? { parts: F.parts.map(q => ({ loop: q.loop.map(mv), read: readMoved(q.read, d) })) } : {}), ...(Array.isArray(F.ss) ? { ss: F.ss.map(q => ({ ...q, a: mv(q.a), b: mv(q.b) })) } : {}) };
  });
  A.settle();
}
// ⌫ the chosen forms out — the ground there — or, out already, back in; ⌘A every form
export function key(e) {
  if (!e.metaKey && !e.ctrlKey && /^[rbnj]$/i.test(e.key || '')) return true;        // the tiles', blends', nodes' keys: not here
  if (!e.metaKey && !e.ctrlKey && (e.key || '').toLowerCase() === 'o') { A.setTool('mirror'); return true; }   // O, Reflect
  if (!e.metaKey && !e.ctrlKey && (e.key || '').toLowerCase() === 'u') { unite(); return true; }                // U, Unite
  if ((e.key === 'Backspace' || e.key === 'Delete') && S.fsel.length) { e.preventDefault(); A.undoPush(); const out = S.forms.filter(F => S.fsel.includes(F.id)).every(F => F.bg); for (const F of S.forms) if (S.fsel.includes(F.id)) F.bg = !out; A.settle(); return true; }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a' && S.tool === 'edit') { e.preventDefault(); S.fsel = S.forms.filter(F => S.background || !F.bg).map(F => F.id); showForm(); A.kick(); return true; }
  return false;
}

// a pencil in the strip by the Tools, a form chosen: its colour (the owner, 2026-10-30: "and how do I set the colour?") —
// Shaded at first, the photo's light and dark kept; a pencil out of the box taken back into it
export function colour(e) {
  const chip = e.target.closest?.('[data-id]');
  if (!chip || !S.fsel.length) return false;
  const id = chip.dataset.id, p = S.pencils.find(q => q.id === id);
  if (!p) return false;
  A.undoPush(); p.on = true;
  for (const F of S.forms) if (S.fsel.includes(F.id)) F.colour = id;
  A.settle(); return true;
}

// ---------- the panel ----------
// every slider its icon (the owner, 2026-10-30: "FORMS and FORM confused — some icons by the sliders, so it is clear what is for what")
const IC = {
  pitch: '<path d="M3 5h18M3 12h18M3 19h18"/><path d="M19.5 6.5v4M19.5 13.5v4" class="thin"/>',
  smallest: '<rect x="3" y="7" width="12" height="13" rx="0.5"/><rect x="16.5" y="3.5" width="4.5" height="4.5" rx="0.5" stroke-dasharray="2 1.5"/>',
  straight: '<path d="M3 17c2.5-5 4.5 3 7-2.5"/><path d="M13 12.5h8"/>',
  fcorner: '<path d="M5 20v-8a7 7 0 0 1 7-7h7"/><path d="M9 20v-6a5 5 0 0 1 5-5h5" class="thin"/>',
  spoke: '<path d="M6 5v14M12 5v14M18 5v14" stroke-width="3" stroke-linecap="round"/>',
};
export const icon = k => `<i class="slic"><svg viewBox="0 0 24 24">${IC[k]}</svg></i>`;
const SL = [['smallest', 'Smallest form', 1, SMALLEST_MIN, SMALLEST_MAX, v => `${fmt(v, 0)} mm (est.)`, 'At AUTO: a patch of the photo smaller than this squared melts into its neighbour — bigger, fewer and simpler forms (est.)'],
  ['straight', 'Straighten', 0.5, STRAIGHT_MIN, STRAIGHT_MAX, v => `${fmt(v, 1)} mm (est.)`, 'At AUTO: a border straightened so far from the photo\'s at most — more, straighter lines (est.)'],
  ['fcorner', 'Glass corners', 1, CORNER_MIN, CORNER_MAX, v => v ? `${fmt(v, 0)} mm (est.)` : 'sharp', 'Glass\'s and rubber\'s rings rounded so much at most: the outline as it is, every ring inside it more round, a curl in the middle (est.)'],
  ['spoke', 'Spokes every', 1, SPOKE_MIN, SPOKE_MAX, v => `${fmt(v, 0)} mm (est.)`, 'The Preview\'s sausages: a spoke every so far round a form\'s outline, from it in, every run of one paint along it a sausage (est.)']];
const slider = ([k2, label, step, min, max, , tip]) => `<label class="sl" title="${tip}"><span class="slh"><span>${icon(k2)}${label}</span><span class="val" data-fv="${k2}"></span></span><input class="slider" type="range" data-fk="${k2}" min="${min}" max="${max}" step="${step}"></label>`;
function panel() {
  const top = A.$('#formTop'), box = A.$('#formPanel');
  if (!top || !box) return;
  // the top: AUTO and the photo side by side (the owner: "Add new reference next to the Auto key — without the word FORMS, not to make it two
  // lines"), the photo's thumb and its opacity under them, Auto's sliders; the brush's step between (inka.js, #slFormPitch)
  top.innerHTML = `<h3>Forms <span class="hint">off the photo, by hand after</span></h3>
    <div class="formkeys deck" id="formKeys"><button class="btn pass" id="btnAuto" title="AUTO: the forms off the chosen reference, upright as the view stands now — its colours in the box's pencils, the specks melted (Smallest form), the borders straightened (Straighten), the background left out, every material guessed; the forms you made go (⌘Z brings them back)"><svg viewBox="0 0 24 24"><path d="M4 18l5-9 4 6 3-4 4 7z" class="fill"/><circle cx="17" cy="6.5" r="2" class="dot"/></svg><span>Auto</span></button></div>
    <div id="formRef"></div>
    <div class="sliders" id="slAuto">${SL.slice(0, 2).map(slider).join('')}</div>`;
  const keys = A.$('#formKeys'), ref = A.$('#formRef'), add = A.$('#btnRef');
  if (add) { add.classList.add('pass'); add.innerHTML = '<svg viewBox="0 0 24 24"><path d="M15.5 7.5l-6.8 6.8a2 2 0 0 0 2.8 2.8l7.2-7.2a3.6 3.6 0 0 0-5.1-5.1L6.4 12a5.2 5.2 0 0 0 7.4 7.4l5.7-5.7"/></svg><span>Add new reference</span>'; keys.append(add); }
  for (const sel of ['#refKeys', '.refrow']) { const el = A.$(sel); if (el) ref.append(el); }
  const pitch = A.$('#slFormPitch .slh > span');
  if (pitch && !pitch.querySelector('.slic')) { pitch.textContent = 'Brush · rows\' step'; pitch.insertAdjacentHTML('afterbegin', icon('pitch')); }   // one line, the brush's own icon
  box.innerHTML = `<p class="read" id="formRead"></p>
    <div class="toggles looks" id="formMat">${MATERIALS.map(m => `<button class="tog" data-mat="${m}" title="${MAT[m]}: ${m === 'metal' ? 'OPM-P\'s sharp rings, every side its own rows' : m === 'glass' ? 'the windows and the headlights, as INKA and OPM-S: the rings rounded more and more inside, a curl in the middle' : 'the tyres: rounded rings, one paint'} — the chosen forms">${MAT[m]}</button>`).join('')}</div>
    <div class="toggles looks" id="formTone"><button class="tog" data-tone="photo" title="The chosen forms in the photo's colours, every cell its nearest pencil">Photo</button><button class="tog" data-tone="shaded" title="The chosen forms in their own colour — a pencil in the strip by the Tools, a click — the photo's light and dark kept: every cell the pencil nearest the colour as much lighter or darker as the photo there">Shaded</button><button class="tog" data-tone="flat" title="The chosen forms in their own colour, one pencil every cell">Flat</button></div>
    <div class="grid4 keys"><button class="btn" id="btnMerge" title="Unite, U: the chosen forms side by side one form (⇧ and a click to choose more); ⌘Z takes it back">Unite (U)</button><button class="btn" id="btnFormOut" title="The chosen forms out, the ground there — or back in (⌫)">Out · in</button></div>
    <div class="toggles looks" id="formBg"><button class="tog" data-bg2="0" title="No background: the forms grown from the photo's rim left out, the ground there (the owner: &quot;we do not need the background&quot;)">No background</button><button class="tog" data-bg2="1" title="The background's forms painted too">Background</button></div>
    <div class="toggles looks" id="formCells"><button class="tog" data-cells="photo" title="Every cell the photo's colour in it, its nearest pencil — the door's handle, the headlights">Cells by photo</button><button class="tog" data-cells="preview" title="Every cell the Preview's colour in it — the brush through the sausages, as OPM-P's">Cells by Preview</button></div>
    <div class="sliders" id="slForm">${SL.slice(2).map(slider).join('')}</div>
    <div id="formPaints"><h4>Paints <span class="hint">the sausages' colours — the chosen forms, or every one</span></h4></div>`;
  // OPM-P's Paints here (the owner: "I miss the colours … and DENSITY"): New colours · New spokes, the palettes, Density — FORM's
  const paints = A.$('#formPaints'), nc = A.$('#btnNewColours');
  for (const el of [nc?.parentElement, A.$('#metaKeys'), A.$('#inkaKeys'), A.$('#slPaint')]) if (el) paints.append(el);
  paints.insertAdjacentHTML('beforeend', `<div class="grid4 keys"><button class="btn" id="btnFormM" title="M, the sausages by hand: a paint in the strip by the Tools; a click on a sausage in it takes it away, in another repaints it; a drag lays one; a click in a form a spoke through it from its outline in — the cells off the Preview from then on">Sausages by hand (M)</button></div>`);
  A.$('#btnAuto').onclick = auto;
  box.querySelectorAll('[data-mat]').forEach(b => b.onclick = () => { if (!S.fsel.length) return; A.undoPush(); for (const F of S.forms) if (S.fsel.includes(F.id)) F.material = b.dataset.mat; A.settle(); });
  box.querySelectorAll('[data-tone]').forEach(b => b.onclick = () => {
    const sel = S.forms.filter(F => S.fsel.includes(F.id)), t = b.dataset.tone;
    if (!sel.length) return;
    if (t !== 'photo' && !sel.some(F => F.colour)) { A.$('#formRead').innerHTML = 'First its colour: a pencil in the strip by the Tools, a click — the chosen forms take it.'; return; }
    A.undoPush();
    for (const F of sel) { if (t === 'photo') F.colour = null; else if (F.colour) F.flat = t === 'flat'; }
    A.settle();
  });
  A.$('#btnMerge').onclick = unite;
  const u = A.$('#btnUnite'); if (u) u.onclick = unite;
  A.$('#btnFormOut').onclick = () => key({ key: 'Delete', preventDefault() { } });
  A.$('#btnFormM').onclick = () => A.setTool('paint');
  // a palette's key: the chosen forms', or every form's, sausages in its paints, a new deal; New colours the same palette dealt anew
  // (none chosen, one at random in his paints); New spokes the photo's sausages again, the palette over them as it was dealt
  const targets = () => { const sel = S.fsel.length ? new Set(S.fsel) : null; return S.forms.filter(F => (!sel || sel.has(F.id)) && (S.background || !F.bg)); };
  const deal = (pal, seed, fresh = false) => {
    const T = targets(); if (!T.length || !pal) return;
    A.undoPush();
    S.fpal = { name: pal.name ?? '', core: pal.core.slice(), accent: (pal.accent ?? []).slice() }; S.fseed = seed;
    const base = fresh ? T.map(F => (({ ss, ...rest }) => rest)(F)) : T, done = new Map(paletteForms(base, photo(), S.fpal, seed, { pitch: S.pitch, facets: S.facets, spoke: S.spoke }).map(F => [F.id, F]));
    S.forms = S.forms.map(F => done.get(F.id) ?? F); S.cellsBy = 'preview'; A.settle();
  };
  document.querySelectorAll('#formPaints [data-meta]').forEach(b => b.onclick = () => deal(INKA_META[b.dataset.meta], newSeed()));
  if (nc) nc.onclick = () => { const seed = newSeed(); deal(S.fpal ?? newPalette(seed), seed); };
  const ns = A.$('#btnNewSpokes');
  if (ns) ns.onclick = () => {
    if (S.fpal) return deal(S.fpal, S.fseed || newSeed(), true);
    const T = new Set(targets().map(F => F.id)); if (!S.forms.some(F => T.has(F.id) && Array.isArray(F.ss))) return;
    A.undoPush(); S.forms = S.forms.map(F => T.has(F.id) && Array.isArray(F.ss) ? (({ ss, ...rest }) => rest)(F) : F); A.settle();
  };
  box.querySelectorAll('[data-bg2]').forEach(b => b.onclick = () => { const v = b.dataset.bg2 === '1'; if (S.background === v) return; A.undoPush(); S.background = v; A.settle(); });
  box.querySelectorAll('[data-cells]').forEach(b => b.onclick = () => { if (S.cellsBy === b.dataset.cells) return; A.undoPush(); S.cellsBy = b.dataset.cells; A.settle(); });
  A.$('#formSec').querySelectorAll('[data-fk]').forEach(inp => {
    let busy = false;
    inp.oninput = () => { if (!busy) A.undoPush(); busy = true; S[inp.dataset.fk] = +inp.value; showForm(); };
    inp.onchange = () => { busy = false; inp.blur(); A.settle(); };                     // let go: ⌘Z the page's again, not the slider's
  });
}
// U, Unite (the owner, 2026-10-30, the car's front mirrored, its two halves chosen: "we can merge the chosen objects here — not as
// Construction's Cells / Merged — a new key in the Tools, next to O; give it a letter yourself"): the chosen forms side by side
// one form, Illustrator's Pathfinder Unite — its rings anew as one; a mirrored half or a moved one still reading the photo its way
export function unite() {
  if (S.fsel.length < 2) { const r = A.$('#formRead'); if (r) r.innerHTML = 'Unite: choose two forms or more side by side first — V, a click, ⇧ and a click.'; return; }
  const was = S.forms.filter(F => S.fsel.includes(F.id)), next = mergeForms(S.forms, S.fsel);
  if (next === S.forms) { const r = A.$('#formRead'); if (r) r.textContent = 'Not united: the chosen forms are not side by side.'; return; }
  A.undoPush();
  S.forms = next.map(F => S.fsel.includes(F.id) && was.some(G => Array.isArray(G.ss)) ? { ...F, ss: was.flatMap(G => G.ss ?? []) } : F);
  S.fsel = S.fsel.filter(id => S.forms.some(F => F.id === id));
  A.settle();
}
const newSeed = () => 1 + Math.floor(Math.random() * 2 ** 30);
// Auto forms: the photo as the view stands, its forms
function auto() {
  S.pturn = S.turn; PHOTO = null;
  const img = photo();
  if (!img) { A.$('#formRead').textContent = 'No photo: 📎 Add new reference first, then AUTO.'; return; }
  A.undoPush();
  S.aseed = newSeed();                                                               // a variation every press: ⌘Z the one before
  S.forms = withMaterials(autoForms(img, S.boardW, S.boardH, { pencils: S.pencils, smallest: S.smallest, straight: S.straight, seed: S.aseed }), S.pencils);
  S.fsel = []; A.settle();
}
export function showForm(D) {
  if (!A?.$('#formSec')) return;
  for (const [k2, , , , , say] of SL) { const inp = A.$(`[data-fk="${k2}"]`), v = A.$(`[data-fv="${k2}"]`); if (inp && document.activeElement !== inp) inp.value = S[k2]; if (v) v.textContent = say(S[k2]); }
  A.$('#formSec').querySelectorAll('[data-bg2]').forEach(b => b.classList.toggle('on', (b.dataset.bg2 === '1') === S.background));
  A.$('#formSec').querySelectorAll('[data-cells]').forEach(b => b.classList.toggle('on', b.dataset.cells === S.cellsBy));
  const sel = S.forms.filter(F => S.fsel.includes(F.id)), mats = new Set(sel.map(F => F.material));
  A.$('#formSec').querySelectorAll('[data-mat]').forEach(b => { b.classList.toggle('on', mats.has(b.dataset.mat)); b.disabled = !sel.length; });
  document.querySelectorAll('#formPaints [data-meta]').forEach(b => b.classList.toggle('on', S.fpal?.name === b.dataset.meta));
  const tones = new Set(sel.map(F => !F.colour ? 'photo' : F.flat ? 'flat' : 'shaded'));
  A.$('#formSec').querySelectorAll('[data-tone]').forEach(b => { b.classList.toggle('on', tones.has(b.dataset.tone)); b.disabled = !sel.length; });
  A.$('#btnMerge').disabled = sel.length < 2; A.$('#btnFormOut').disabled = !sel.length;
  const shown = shownForms(), count = m => shown.filter(F => F.material === m).length, stuck = D?.regions?.filter(R => !R.ok).length ?? 0;
  A.$('#formRead').innerHTML = !A.ref() ? 'No photo yet: 📎 Add new reference, then <b>AUTO</b>.'
    : !S.forms.length ? 'The photo over the canvas: <b>AUTO</b> makes its forms.'
    : `${S.aseed ? `Variation <b>${S.aseed % 1000}</b> · ` : ''}${S.fpal ? `paints <b>${S.fpal.name || 'new'}</b> · ` : ''}<b>${shown.length}</b> form${shown.length === 1 ? '' : 's'} painted — ${MATERIALS.map(m => `${count(m)} ${m}`).join(', ')}${S.forms.length > shown.length ? `; ${S.forms.length - shown.length} out (the background, or ⌫)` : ''}${D ? ` · ${D.cells.length} cells` : ''}${stuck ? ` · <span class="warn">${stuck} left empty: its border crosses itself, move a point (V)</span>` : ''}${sel.length ? `<br>Chosen: ${sel.length} — ${[...mats].map(m => MAT[m]).join(', ')}${sel.some(F => F.colour) ? ` · ${[...new Set(sel.filter(F => F.colour).map(F => F.colour))].map(id => { const p = S.pencils.find(q => q.id === id); return p ? `<span class="pl"><i style="background:${p.hex}"></i>${p.name}</span>` : id; }).join(' ')}` : ''}. Its colour: a pencil in the strip by the Tools, a click.` : '<br>V and a click chooses a form, ⇧ one more; its points dragged, a click on its border a new point; K a line across cuts; a pencil in the strip by the Tools its colour.'}`;
}

// ---------- the view turned ----------
// Rotate Canvas CCW · CW by the zoom: the board turned a quarter, the canvas and its forms with it, the machine's as it is
function turnKeys() {
  const ccw = A.$('#turnCcw'), cw = A.$('#turnCw');
  if (!ccw || !cw) return;
  const go = d => { S.turn = ((S.turn + d) % 360 + 360) % 360; A.save(); A.layout(); };
  ccw.onclick = () => go(-90); cw.onclick = () => go(90);
}
export const turned = () => !!S && S.turn % 180 !== 0;
