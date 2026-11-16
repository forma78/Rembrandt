# GEN-F — the approved sketches

For Claude in VS Code, and for the owner. Started 2026-11-16.

The owner, 2026-11-16: "can we not make the generator a tab of its own, so that I see a first
sketch, approve it and give it to you for the final work? we would save a lot of tokens."

## The way of a new picture

1. The owner opens his illustration on **GEN-F** (`app/genf.html`), picks the format and the
   colours, and looks at the sketch: Sketch, Drag, Picture; the jars; the time (est.).
2. **APPROVE** saves a json: `<picture> · GEN-F · <format> · <colours>.json`. It goes here.
   The illustration itself goes into `FORM-G/`, as before (others' pictures and renders stay out
   of git there, `.gitignore`).
3. The owner tells Claude: "GEN-F, <the file>". Claude reads it and makes the picture in
   `FORM-G/generator/` — a `*geo.py` for its form (the seams, the symmetry), the jars to measure
   by the brush model, the canon (Jar 6 in Layer 2, MARKS beside the canvas) — then FORM-G's
   card, as the generator's README says.

## What a sketch holds

- `format`, `colours` (asked), `made` (those that paint a leg), `picture_mm`, `columns`,
  `left` · `top` (the picture's place on the canvas, mm);
- `image`: the file's name, its pixels, the box of the picture in it, its ground;
- `jars`: name, hex, coats, line in m — after the canon of the jars; `out`: those that went,
  into which;
- `counts`: legs, legs under 12 mm, brush m, lines of the list, dips, minutes (est.);
- `gen`: GEN-F's numbers it was made with; `pic`: the whole plan in FORM-G's json.

A sketch's colours are named Colour 1 … n: no jar is mixed yet, no number on a lid. When the
picture is made, its jars get the owner's physical numbers (README, the jars are physical): the
same paint his jar already has, that jar's number.

## The sketches approved

| sketch | made into |
|---|---|
| `Classic Red Porsche Headlight Detail · GEN-F · 60x80 · 14.json` (2026-11-16, "I suddenly approved 60 × 80") | FORM-G's `porsche-headlight`, `FORM-G/generator/headlight.py`: 12 of its 14 colours the owner's jars of the red classic, 2 new |
