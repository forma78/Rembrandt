import { snapshotOf, caranPlan, compileRun, mapPixels } from './caranplan.js';
let snapshot = null;
self.onmessage = ({ data: q }) => {
  try {
    if (q.type === 'capture') snapshot = snapshotOf(q.source, q.name);
    else if (q.snapshot) snapshot = q.snapshot;
    if (!snapshot) throw new Error('Capture a Preview first.');
    const plan = caranPlan(snapshot, q.pencils, q.options, q.order), run = compileRun(plan, snapshot), pixels = mapPixels(snapshot, plan);
    self.postMessage({ id: q.id, snapshot: q.type === 'capture' ? snapshot : undefined, plan, run, pixels });
  } catch (error) { self.postMessage({ id: q.id, error: error.message }); }
};
