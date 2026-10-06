// The watercolour on the paper (band.js, washOf; the owner, 2026-10-04: "I
// want to see on the screen more exactly what I paint with the brush"),
// drawn on a board: NOLAN's Imprint with INK ON, TYPE's Trace. Each stroke
// in the wash, strongest fresh from the cup and paler along the dip run, a
// blot where it lands so; wet rows nearly touching run into one wash;
// strokes over one another darker — the board multiplies them, as the paper
// does. Each stroke a few paths of one shade, so it never darkens itself.
// Shared, so a fix reaches every tab. Draws on the context it is given.

export const WASH = [74, 16, 140];   // the violet wash in the cup on 2026-10-04, by eye from the photos, est.
export const WASH_LIGHT = [205, 175, 245];   // the same on the black ground, lighter: the board adds there
export const WASH_WET = 0.5, WASH_DRY = 0.14, WASH_BLOT = 0.8;   // its strength fresh from the cup, at the end of a dip run, in a blot (est., the trace of 18:11)
// g: the context; wash: washOf's strokes, canvas mm; o: { sx, sy } canvas mm
// → the screen, k px a mm, width the row's mm, black: the black ground
export function drawWash(g, wash, o) {
  const { sx, sy, k, width, black } = o;
  const tone = a => black ? `rgb(${WASH_LIGHT.map(c => Math.round(c * a)).join(',')})` : `rgb(${WASH.map(c => Math.round(255 - (255 - c) * a)).join(',')})`;
  g.save(); g.globalCompositeOperation = black ? 'screen' : 'multiply'; g.lineCap = 'butt'; g.lineJoin = 'round';
  for (const st of wash) {
    const q = st.pts;
    let from = 0, key = null;
    const flush = j => {                                                            // the points from..j, one shade, one width
      if (j <= from) return;
      const [a, w] = key.split(' ').map(Number);
      g.strokeStyle = tone(a); g.lineWidth = Math.max(0.6, w * k);
      g.beginPath(); g.moveTo(sx(q[from].p), sy(q[from].p));
      for (let m = from + 1; m <= j; m++) g.lineTo(sx(q[m].p), sy(q[m].p));
      g.stroke();
    };
    for (let j = 0; j < q.length; j++) {
      const a = WASH_DRY + (WASH_WET - WASH_DRY) * q[j].load, kk = `${(Math.round(a * 50) / 50).toFixed(2)} ${Math.round(q[j].w * 4) / 4}`;
      if (kk !== key) { if (key !== null) flush(j); from = j; key = kk; }   // the next path from the point this one ends on
    }
    if (key !== null) flush(q.length - 1);
    const land = st.dip && q.find(t => t.w >= 0.5 * width);                        // the blot: fresh from the cup, the brush lands
    if (land) { g.fillStyle = tone(WASH_BLOT); g.beginPath(); g.arc(sx(land.p), sy(land.p), 0.8 * width * k, 0, Math.PI * 2); g.fill(); }
  }
  g.restore();
}
