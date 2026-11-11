// COLORS' registry of the pictures' jars (Kuzya's audit, FORM-G/Rembrandt_COLORS_FORM-G_Registry_Audit_Claude_2026-11-10.pdf, the owner
// handing it over: "I sit here with the jars and I am a little lost; I do not know where to start … how to mix them?"). Read from the plans
// themselves, app/formg/*.json and app/opmg/*.json, never copied by hand; a jar's key its picture's and its own id, "porsche-race-k:j12",
// for "Jar 5" is another paint in every picture. The plans are not touched: no jar renamed, no hex changed.

// a jar's line, mm: its legs, each from end to end (the audit's measure), once — a second coat paints it again
export const lineOf = jar => jar.cells.reduce((t, c) => t + c.legs.reduce((u, l) => u + Math.abs(l[1] - l[2]), 0), 0);

// every jar of every picture: { key, art, title, size, no, name, hex, coats, line }, in each picture's own list order — a `late` jar after the first layer's,
// as the run has it (the orange, Jar 6, the first of Layer 2: README's canon, 2026-11-11)
export function entriesOf(plans) {
  return plans.flatMap(p => [...p.jars.filter(j => !j.late), ...p.jars.filter(j => j.late)].map((j, i) => ({
    key: `${p.id}:${j.id}`, art: p.id, title: p.title, size: `${p.w / 10} × ${p.h / 10}`, no: i + 1, name: j.name, hex: j.hex.toUpperCase(), coats: j.coats ?? 1, line: lineOf(j),
  })));
}

// the same hex in other pictures: a candidate to share a mix, never a merge (the audit: "a shared HEX alone is not an approved merge")
export function sameHex(entries) {
  const by = new Map();
  for (const e of entries) by.set(e.hex, [...(by.get(e.hex) ?? []), e]);
  return e => (by.get(e.hex) ?? []).filter(q => q.art !== e.art);
}

// a recipe's parts as the hand mixes them: small whole numbers; when a part is under a fortieth of the largest, all of them in words — no one
// weighs 1 : 1600, and "White most, Black 5" says nothing
export function partsSay(parts) {
  const top = Math.max(...parts.map(([, w]) => w));
  if (!parts.some(([, w]) => w / top < 1 / 40)) return parts;
  return parts.map(([p, w]) => { const r = w / top; return [p, r >= 0.5 ? 'most' : r >= 0.1 ? 'some' : r >= 1 / 40 ? 'a little' : p === 'black' ? 'by drops' : 'a touch']; });
}
