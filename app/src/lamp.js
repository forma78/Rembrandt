// Day and night (the owner, 2026-10-02): by day the cream Braun of RUBENS
// and the grey glass of the LCD; by night the whole page goes graphite, as
// references/braun_night-1.jpg and -2.webp, and the LCD glows warm yellow, a
// clock with its lamp on. A sun and a moon by the word PROGRESS (Job, Test);
// one switch for every tab, kept in this browser. style.css: html.night. An
// inline line in each page's head sets it before the page draws.

const KEY = 'rembrandt.lamp.v01';
const SUN = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"/></svg>';
const MOON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 10.2A5.5 5.5 0 0 1 5.8 3a5.5 5.5 0 1 0 7.2 7.2z"/></svg>';

const read = () => { try { return localStorage.getItem(KEY) === 'night'; } catch { return false; } };
export const isNight = () => document.documentElement.classList.contains('night');
function apply(night) {
  const was = isNight();
  document.documentElement.classList.toggle('night', night);
  document.querySelectorAll('.lampsw button').forEach(b => b.classList.toggle('on', (b.dataset.l === 'night') === night));
  if (was !== night) dispatchEvent(new Event('rembrandt-night'));   // the canvases draw their table again
}
// A colour of the theme, for what a canvas draws itself.
export const themeColor = (name, day) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || day;

// The switch, into the element el (a span by the heading).
export function lampSwitch(el) {
  el.classList.add('seg', 'side', 'lampsw');
  el.innerHTML = `<button data-l="day" title="Day: cream, the LCD's grey glass">${SUN}</button><button data-l="night" title="Night: graphite, a warm yellow lamp behind the LCD">${MOON}</button>`;
  el.querySelectorAll('button').forEach(b => b.onclick = () => {
    const night = b.dataset.l === 'night';
    try { localStorage.setItem(KEY, night ? 'night' : 'day'); } catch { }
    apply(night);
  });
  apply(read());
}
addEventListener('storage', e => { if (e.key === KEY) apply(read()); });   // switched on another tab
apply(read());
