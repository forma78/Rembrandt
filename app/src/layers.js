// Sonnet's layout for the Adjustments tab (`adjustments/`, 2026-10-01): SVG
// layers on the 500 × 700 canvas, in mm. A layer is <g id="layer-…">, a paint
// inside it <g id="paint-…" stroke="#…">, its lines the subpaths (M … L …)
// of one path. Read without a DOM, so the tests read the real files.
//
// And a line as the brush leaves it (the owner, 2026-10-01: not round-ended
// "sausages"): full width from its home, thinning into the tail, where the
// wrist lifts the brush (Rembrandt.md §1, home and tail; §7).

import { lightness } from './tubes.js';

const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));

// "dark-gray" → "Dark grey": the spec spells grey with an e.
export const paintName = key => (key[0].toUpperCase() + key.slice(1)).replace(/-/g, ' ').replace(/gray/gi, m => m[0] === 'G' ? 'Grey' : 'grey');

export function parseLayer(svg) {
  const vb = (/viewBox="([^"]+)"/.exec(svg)?.[1] || '0 0 500 700').split(/[\s,]+/).map(Number);
  const top = /<g\s[^>]*id="layer-[^"]*"[^>]*>/.exec(svg);
  const a = top ? attrs(top[0]) : {};
  const paints = [];
  for (const m of svg.matchAll(/<g\s[^>]*id="paint-([^"]+)"[^>]*>\s*<path\s[^>]*?\bd="([^"]+)"/g)) {
    const tag = /<g\s[^>]*id="paint-[^"]+"[^>]*>/.exec(m[0])[0], g = attrs(tag);
    const lines = m[2].split('M').map(s => s.trim()).filter(Boolean).map(sp => {
      const n = sp.match(/-?\d+(?:\.\d+)?/g).map(Number), pts = [];
      for (let i = 0; i + 1 < n.length; i += 2) pts.push({ x: n[i], y: n[i + 1] });
      return pts;
    }).filter(pts => pts.length > 1);
    paints.push({ key: m[1], name: paintName(m[1]), hex: (g.stroke || '#808080').toUpperCase(), lines });
  }
  return {
    id: a.id || 'layer', label: a['inkscape:label'] || a.id || 'layer',
    width: +a['stroke-width'] || 8, view: { w: vb[2], h: vb[3] }, paints,
  };
}

export const lineLength = pts => pts.reduce((s, q, i) => i ? s + Math.hypot(q.x - pts[i - 1].x, q.y - pts[i - 1].y) : 0, 0);
export const paintLength = p => p.lines.reduce((s, l) => s + lineLength(l), 0);
export const layerLength = L => L.paints.reduce((s, p) => s + paintLength(p), 0);

// Paints in the order they run: the lighter first (§1).
export const runOrderOf = paints => paints.map((p, i) => ({ p, i, L: lightness(p.hex) })).sort((a, b) => b.L - a.L || a.i - b.i).map(o => o.p);

// The width of a line at s mm from its home: W up to the tail, then
// thinning to an eighth of it at the end. The tail is the smear length (est.).
export function widthAt(s, L, W, tail) {
  const T = Math.min(tail, L), t0 = L - T;
  if (s <= t0 || T <= 0) return W;
  const u = Math.min(1, (s - t0) / T);
  return W * (0.12 + 0.88 * Math.pow(1 - u, 1.3));
}

// The outline of one line as the brush leaves it, a polygon in mm. home:
// 'start' or 'end' of the points as given. The home end is round — the brush
// lands there; the tail end is a thin point.
export function brushOutline(pts, W, home, tail) {
  const P = home === 'end' ? [...pts].reverse() : pts, n = P.length;
  const s = [0]; for (let i = 1; i < n; i++) s.push(s[i - 1] + Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y));
  const L = s[n - 1];
  const dir = i => {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    return { x: (b.x - a.x) / l, y: (b.y - a.y) / l };
  };
  const left = [], right = [];
  for (let i = 0; i < n; i++) {
    const d = dir(i), w = widthAt(s[i], L, W, tail) / 2;
    left.push({ x: P[i].x - d.y * w, y: P[i].y + d.x * w });
    right.push({ x: P[i].x + d.y * w, y: P[i].y - d.x * w });
  }
  const d0 = dir(0), a0 = Math.atan2(d0.y, d0.x), cap = [];
  for (let k = 1; k < 12; k++) {               // the home: half a circle, from the right side round to the left
    const t = a0 - Math.PI / 2 - Math.PI * k / 12;
    cap.push({ x: P[0].x + Math.cos(t) * W / 2, y: P[0].y + Math.sin(t) * W / 2 });
  }
  return [...left, ...right.reverse(), ...cap];
}
