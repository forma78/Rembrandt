# GEN-F — the approved sketches

For Claude in VS Code, and for the owner. Started 2026-11-16.

The owner, 2026-11-16: "can we not make the generator a tab of its own, so that I see a first
sketch, approve it and give it to you for the final work? we would save a lot of tokens."

## The way of a new picture

1. The owner opens his illustration on **GEN-F** (`app/genf.html`): three screens side by side,
   each its own number of colours (17, 29, 45 at first); he chooses one by a click. He picks the format (90 × 120
   and 100 × 150 are for a new frame: a sketch to look at, nothing to run yet) and the
   colours, and looks at the sketch: Sketch, Drag, Picture; the jars; the time (est.).
2. **APPROVE** saves a json: `<picture> · GEN-F · <format> · <colours>.json`. It goes here.
   The illustration itself goes into `FORM-G/`, as before (others' pictures and renders stay out
   of git there, `.gitignore`).
3. The owner tells Claude: "GEN-F, <the file>". Claude reads it and makes the picture in
   `FORM-G/generator/` — a `*geo.py` for its form (the seams, the symmetry), the jars to measure
   by the brush model, the canon (Jar 6 in Layer 2, MARKS beside the canvas) — then FORM-G's
   card, as the generator's README says.

## Two more keys

- **GROUND**, white or black: the bare canvas's colour on the screen. Nothing is painted for it.
- **Motion blur**, 0 … 300 mm: a layer under the picture, painted first — every column smeared
  along itself in the picture's own jars, where the picture leaves the canvas bare. FORM-G does
  not run such a layer yet: the final work starts when the owner says so.
- **Opacity**, 10 … 100 %: OPM's raster — every stripe its jar's full colour, the share of the
  columns that paint it (50 %: every other column), fewer towards the tails. No jar thinned with
  medium, no new jar: the owner's jars stay as they are.

## What a sketch holds

- `format`, `colours` (asked), `made` (those that paint a leg), `picture_mm`, `columns`,
  `left` · `top` (the picture's place on the canvas, mm);
- `image`: the file's name, its pixels, the box of the picture in it, its ground;
- `jars`: name, hex, coats, line in m — after the canon of the jars; `out`: those that went,
  into which;
- `counts`: legs, legs under 12 mm, brush m, lines of the list, dips, minutes (est.);
- `ground`: white or black, as GROUND showed it;
- `blur_mm`, `under`, `under_counts`: the motion blur's layer, a plan in FORM-G's json of its own;
- `gen`, `blur`: GEN-F's numbers it was made with; `pic`: the whole plan in FORM-G's json.

A sketch's colours are named Colour 1 … n: no jar is mixed yet, no number on a lid. When the
picture is made, its jars get the owner's physical numbers (README, the jars are physical): the
same paint his jar already has, that jar's number.

## The sketches approved

| sketch | made into |
|---|---|
| `Classic Red Porsche Headlight Detail · GEN-F · 60x80 · 14.json` (2026-11-16, "I suddenly approved 60 × 80") | FORM-G's `porsche-headlight`, `FORM-G/generator/headlight.py`: 12 of its 14 colours the owner's jars of the red classic, 2 new |
| `Classic Red 911 Coupe Profile · GEN-F · 60x80 · 38.json` (2026-11-16) | waiting: its motion blur, the layer under it, tried on GEN-F first |
