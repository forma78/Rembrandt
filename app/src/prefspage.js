// Rembrandt · Preferences (the owner, 2026-10-20): what holds for every tab,
// kept in this browser (prefs.js). TEST's dots: the margin in from the
// board's edges, and TL, the first, one dot or two with a wait between.
import './lamp.js';
import { prefs, savePrefs, PREFS_NEW, PREFS_LIM } from './prefs.js';

const $ = s => document.querySelector(s);
let P = prefs();
const NUMS = [['testMargin', 'Margin', 'mm', 1, 'How far in from the board\'s edges, both of them, every dot of TEST is'], ['testGap', 'Between', 's', 0.5, 'At TL, the wait between the two dots, the brush up; no more than 10 s, the longest wait rembrandt.py takes']];

$('#testNums').innerHTML = NUMS.map(([k, label, unit, step, title]) =>
  `<label title="${title}"><span>${label}</span><input data-k="${k}" type="number" step="${step}" min="${PREFS_LIM[k][0]}" max="${PREFS_LIM[k][1]}"><em>${unit}</em></label>`).join('');
$('#testNums').querySelectorAll('input').forEach(inp => inp.onchange = () => {
  const k = inp.dataset.k, [, label, unit] = NUMS.find(f => f[0] === k);
  set({ [k]: inp.value === '' ? PREFS_NEW[k] : +inp.value }, () => `${label} ${P[k]} ${unit}`);
});
$('#testFirst').querySelectorAll('button').forEach(b => b.onclick = () => set({ testFirst: +b.dataset.first }, +b.dataset.first === 2 ? 'Two dots at TL' : 'One dot at TL'));
$('#btnDefaults').onclick = () => set({ ...PREFS_NEW }, 'Defaults');

function set(change, what) {
  P = savePrefs({ ...P, ...change });
  show();
  $('#saved').textContent = `Saved: ${typeof what === 'function' ? what() : what}`;
}
// on another tab of this browser too
addEventListener('storage', e => { if (e.key === null || e.key === 'rembrandt.prefs.v01') { P = prefs(); show(); } });

function show() {
  for (const inp of $('#testNums').querySelectorAll('input')) if (document.activeElement !== inp) inp.value = P[inp.dataset.k];
  $('#testNums').querySelector('[data-k="testGap"]').disabled = P.testFirst < 2;
  $('#testFirst').querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.first === P.testFirst));
  board();
  const two = P.testFirst >= 2;
  $('#testRead').innerHTML = `TEST puts a dot <b>${P.testMargin} mm</b> in from each corner of the canvas, round it TL, TR, BR, BL, then home`
    + (two ? `; at TL <b>two dots, ${P.testGap} s apart</b>, the brush up between — time to see where the new canvas goes.` : `; at TL <b>one dot</b>.`)
    + ' With INK ON, one dip in the cup before the first. 20 mm and one dot until 2026-10-20.';
}
// the board as on his 40 × 40 canvas, the dots where TEST puts them, in their order
function board() {
  const W = 400, s = 200 / W, o = 10, m = Math.min(P.testMargin, W / 2 - 1) * s, a = o + m, b = o + 200 - m;
  const at = [[a, a, '1'], [b, a, '2'], [b, b, '3'], [a, b, '4']];
  $('#board').innerHTML = `<rect x="${o}" y="${o}" width="200" height="200" rx="1"/>`
    + at.map(([x, y]) => `<circle class="dot" cx="${x}" cy="${y}" r="2.4"/>`).join('')
    + (P.testFirst >= 2 ? `<circle class="twice" cx="${a}" cy="${a}" r="6"/><text x="${a + 9}" y="${a + 3}">×2 · ${P.testGap} s</text>` : '')
    + at.map(([x, y, n], k) => `<text x="${k === 1 || k === 2 ? x - 12 : x + 7}" y="${k < 2 ? y + 16 : y - 8}">${n}</text>`).join('')
    + `<text x="${o + 100}" y="${o + 104}" text-anchor="middle">400 × 400 mm</text>`;
}
show();
