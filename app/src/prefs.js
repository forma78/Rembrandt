// Preferences (the owner, 2026-10-20: "after Ink / Calib. / Library make a
// gear — this will be Preferences"): what holds for every tab, kept in this
// browser as the lamp's day and night. Nothing here moves the machine by
// itself; TEST reads it on every tab — how far in from the board's edges its
// dots go ("too big a margin, 20 mm — let's make it 10"), and its first one,
// TL, one dot or two with a wait between ("on the first top point I need two
// touches of the brush 5 seconds apart. When I put a new canvas I do not
// understand where to put it … one or two points can go into Preferences").
// No window (node, the tests): the defaults.

export const PREFS_KEY = 'rembrandt.prefs.v01';
export const PREFS_NEW = { testMargin: 10, testFirst: 2, testGap: 5 };
// the limits: the margin mm, TL's dots, the wait s — no longer than a wait rembrandt.py takes (WAIT_MAX_S)
export const PREFS_LIM = { testMargin: [1, 100], testFirst: [1, 2], testGap: [0, 10] };

export function cleanPrefs(p = {}) {
  const out = { ...PREFS_NEW };
  for (const [k, [lo, hi]] of Object.entries(PREFS_LIM)) if (Number.isFinite(p?.[k])) out[k] = Math.max(lo, Math.min(hi, p[k]));
  out.testFirst = Math.round(out.testFirst);
  return out;
}
const store = () => { try { return typeof window === 'undefined' ? null : window.localStorage; } catch { return null; } };
export function prefs() {
  try { return cleanPrefs(JSON.parse(store()?.getItem(PREFS_KEY) ?? 'null') ?? {}); } catch { return { ...PREFS_NEW }; }
}
export function savePrefs(p) {
  const out = cleanPrefs(p);
  try { store()?.setItem(PREFS_KEY, JSON.stringify(out)); } catch { }
  return out;
}

// TEST's, as cornerDots takes them
export const testPrefs = (p = prefs()) => ({ margin: p.testMargin, first: p.testFirst, gap: p.testGap });
