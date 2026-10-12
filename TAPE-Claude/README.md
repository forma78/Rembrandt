# TAPE-Claude — hand-off for the new TAPE tab in Rembrandt

## What's in the folder

| Path | What it is |
|---|---|
| `TAPE.md` | The spec. Start here. |
| `assets/cassette_trace.svg` | Default cassette, real size 100.4 × 63.8 mm, Inkscape layers. Goes into the repo as the tab's built-in cassette. |
| `reference/TAPE-prototype.html` | Approved prototype v0.3. Open it in a browser to see every control live. `window.__tape` exposes S (settings) and G (geometry) for poking around. |
| `reference/acceptance.json` | Numbers for 10 settings cases, produced by the prototype. |
| `reference/renders/*.png` | What those 10 cases look like. |
| `reference/tape_20x20_snake_default.svg` | The prototype's SVG export at default settings. |

## How to port

1. Read the repo's README, CLAUDE.md, Rembrandt.md (glossary) and one existing tab spec (ALU.md or NOLAN.md) to match conventions. Then read `TAPE.md`.
2. Add `TAPE.md` to the repo next to the other tab specs. Add the new terms to the glossary in Rembrandt.md: lane, pitch, seam, lane change, closed rings, paint stop, overrun.
3. Add the TAPE tab with the controls and defaults from `TAPE.md`. English UI.
4. Port the geometry (`family()`, `rrGeo()`, `rrU()`, `lToU()`, `uToL()`, `uSamples()`, `build()` in the prototype) into the repo's code style. Keep the "same f(u) for every lane" rule exactly. It is what keeps the lanes touching.
5. Feed the result into the existing Job pipeline.
   - Pencil for Trace, then a tool-change pause, then the brush for Drag.
   - Brush lift on J3, as the other tabs do.
   - A paint stop before every segment.
   - Convert from centre-origin, y-down mm to the repo's canvas coordinates via Calibrate.
6. Preview / Path / Trace / Play as in the prototype.
7. Check against `reference/acceptance.json` and the renders. Then commit with this README's changelog entry.

Do not add a Marks pass. Warnings stay a single ⚠️ line each.

## Changelog — Yury's decisions, in his words

**12 Oct 2026**
- Idea: hand-painted cassette in the centre, the tape painted by the machine with the brush, after Werner Bronkhorst's mix of textured ground and tiny figures. "Это только для восстановления Soumkine, на etsy."
- "Давай сделаем вкладку tape и вернем карандаш … для trace! Я бы точную кассету использовал."
- "Trace (рисовать в центре кассету и пленку: кассету я обведу красочкой как раскраску, пленка уже плоттер наш с кисточкой, идеальный рисунок и текстура)."
- "Marks не нужен, не ставим в софт."
- "Но два Drag (змейка и туда по холсту, назад по воздуху)."
- Brush slider = tape width: "она будет 100% как размер пленки в аудиокассете. Так что там незначительные расхождения для аджастмента / adjustments."
- Corners slider from angle to rounded: "когда углы острые, просто пленка влезает идеально в квадрат … Поэтому переход бегунком добавляем до круглых углов, но тогда на вылет."
- "кассета всегда по центру и когда меняется формат, 20 х 20, 30х30, 50х50 см она автоматически по центру становится."
- Scale fixed to real cassettes laid on 20 × 20 canvases: "давай только исправим масштаб, у меня есть кассеты."
- "Внизу волны не нужно … после первого круга линия прям врезается снова в первую, и где-то сбоку справа перестраивается на новый ряд, но без зазора, они идут как у Флориана." Lane 1 tight against the cassette, following its rounded corner (sketch).
- Lane change: "давай только х24 или даже x 48! Пусть невидимо, элегантно так спиралькой закручиватется." Default set to ×48.
- Cassette replaced by his own `cassette_trace.svg`.
- v0.3 approved: "все супер теперь".
