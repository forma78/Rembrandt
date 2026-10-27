// BLEND's Result is used only as the desired digital colour reference. The
// pencil model then selects actual inventory pencils and stroke coverage.
// This never claims that wet acrylic will reproduce the reference colours.
import { planOf, simOf } from './inkaplan.js';
export function blendReference(o) {
  if (!o.rects.length) return null;
  const r = o.referencePaint, width = Math.max(...o.rects.map(q => q.x + q.w)) - Math.min(...o.rects.map(q => q.x));
  const k = width / r.width, opt = { cw: o.paperW, ch: o.paperH, brush: r.brush * k, swell: r.swell * k,
    edgeOut: r.edgeOut * k, corner: r.corner * k, change: r.change * k, density: r.density, h: Math.max(0.65, Math.max(o.paperW, o.paperH) / 600) };
  const sim = simOf(planOf(o.rects, opt), o.rects, opt); sim.advance(Infinity);
  const pixels = new Uint8ClampedArray(sim.nx * sim.ny * 4); sim.rgba(pixels, true);
  return { nx: sim.nx, ny: sim.ny, h: sim.h, pixels };
}
