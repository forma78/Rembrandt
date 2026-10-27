import { pencilPlan, cleanSettings } from './pencilplan.js';
import { blendReference } from './pencilreference.js';
let cached = null;
self.onmessage = ({ data }) => {
  try {
    const o = cleanSettings(data.settings), key = JSON.stringify([o.rects, o.paperW, o.paperH, o.referencePaint]);
    if (o.colourSource === 'result' && cached?.key !== key) {
      // Validate density and geometry before the reference renderer allocates.
      pencilPlan({ ...o, pencils: [{ id: 'check', name: 'Check', hex: '#222222', enabled: true, repeats: 1 }] });
      cached = { key, reference: blendReference(o) };
    }
    self.postMessage({ id: data.id, plan: pencilPlan(o, o.colourSource === 'result' ? cached?.reference : null) });
  }
  catch (error) { self.postMessage({ id: data.id, error: error.message }); }
};
