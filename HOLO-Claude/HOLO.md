# HOLO — the task

For Claude in VS Code. Written 2026-11-12 from the owner's talk with Claude
in the cloud chat. Read `README.md`, then `Rembrandt.md` (glossary first),
then this.

**HOLO**: a geometric painting of vertical legs alone, in two runs. The
brush first lays even puddles of paint from the cup at hand, then drags
them. Run 1 lays the light, run 2 the shadow on the dry first, so the
picture goes from near white to near black and reads as sheets in depth.

The name is the owner's ("let us call it HOLO, short as all our tabs in
Rembrandt"), after the 3D "holograms" he took as the colour reference.

**Nothing here has been run on the machine. Every number is est.** The
sheets in `HOLO/` are a model's, drawn by `HOLO/study/holo_study.py` in the
cloud; the first job is the LAB sheet below, not a painting.

## The owner's words, 2026-11-12 (for §1 when he confirms them)

- **Why.** FORM-G's first reels fell (81 views; the old macro reels of a
  brush through thick wet paint had 1.2 M). "I want to paint and post
  paintings, not mad inventions with motors." He asked for a painting that
  brings back that shot — macro, the brush in the frame, wet paint, one
  unbroken movement — with what the machine can do now.
- **Puddles first.** "First the brush dips into the paint and leaves even
  puddles of paint on the canvas. Unlike Florian Markus's method, all the
  drops are strictly dosed and placed on the canvas with perfect precision
  — no need to squeeze by hand." "There can be even 1000 of them, the hand
  will not wither, the machine does it all." He has not tested this way.
- **Geometry, no round turns.** "Like Florian, but without the round turns.
  No need to go on with figurative painting." "Better to return to
  geometry, and ours can have more complex forms thanks to the narrow
  brush." "The brush going only up and down is our feature."
- **Contrast.** Of Florian's palette: "like a paint display in an art shop.
  No contrast, no depth — compare the 3D 'holograms': look at the depth of
  colour from the contrast of light and dark." Of the model's range: "a
  lightness of L 5–92 is phenomenal."
- **Two runs.** "Maybe several runs over fresh paint, so that there is no
  mud. Even two are enough." "The medium works as a retarder, it dries
  longer than plain acrylic."
- **A fixed camera**, at the brush as before.
- **Formats**: 40 × 40 and 60 × 60 cm.
- Of the sheets in `HOLO/`: "Yes, all is excellent. I like it very much."

## Words

| term | meaning |
|---|---|
| **Leg** | As everywhere: one straight pass of the brush along X. HOLO has no other line. Legs are 5 mm apart, the rubber tip's. |
| **Slat** | Neighbouring legs painted alike: 1 to 14 legs, 5 to 70 mm wide. The picture is a row of slats. |
| **Band** | A piece of a slat along its legs, from edge to edge: one sheet of the picture. Run 2 shadows a band, or leaves it open. |
| **Puddle** | Paint laid on the canvas at a point for a later stroke to drag. One or more dabs. |
| **Dab** | One dip at the cup at hand, then the brush down at the puddle's place: MARKS' mark, a leg of 8 mm (est.). |
| **Ground** | A slat's light jar, laid in run 1 over its whole height. `null` in a plan: the bare primed canvas, no run 1 there. |
| **Shadow** | A band's dark jar, laid in run 2: one puddle at the band's edge, dragged away from the edge until it gives out. |
| **Horizon** | The point the picture's perspective runs to: slats narrowest at its x, bands shortest at its y. |

## How a picture is painted

**Run 1, the light.** A jar at a time, light to dark. Along every leg of a
slat, a puddle every 40 mm (est.), one dab each. Then one stroke the leg's
whole length through its puddles, no dip. One jar in a stroke, so nothing
mixes: there is no mud to make. This is the reel: a row of even dots, and
the brush taking them in one movement.

**The pause**, as FORM-G's before Layer 2: "the first layer is done: let it
dry". No timer (README). LAB's dry test of 2026-11-09 (sheet 18): at 5 and
20 min the second paint still mixes with the first, at 30 and 40 min it
holds.

**Run 2, the shadow.** A jar at a time, light to dark. For every shadowed
band of every leg: one puddle 5 mm in from the band's edge, 1 to 4 dabs by
the band's length, then one stroke from the puddle towards the band's far
end, no dip (a plan's `end`: 0.8 of the band on FAN, all of it on TIERS). The start is a sharp edge (a round bulb, the tip's); the far end
fades into the ground as the load falls off (`brushsim.py`: "short legs
come out solid, long ones as film"). Sharp against the next band, soft into
its own: that is the depth.

**Batches.** A puddle must be dragged while it is wet. So a jar's puddles
are laid and dragged in batches of about 100 dabs, ≈ 15 min (est.), the
same jar in the cup throughout: lay, drag, lay, drag. In run 1 a batch is
whole legs. A jar is changed once a run: about as many changes as jars, 10
to 12 a picture, where FORM-G's red classic has 31 … 62 lines.

**The machine does everything** (§1). The owner changes the jars and wipes
the tip at a change, as on FORM-G. No washing station is needed: no stroke
carries two paints.

## Two compositions

Both in `holo_study.py`; a plan's `composition` says which.

**FAN** (`holo-40-warm`, `holo-60-blue`). Slats 2 legs wide at the
horizon's x, wider away from it (2, 2, 2, 3, 3, 4, 4, 5, 5, 6 …). A slat's
bands all one length, `62 mm + slope × its distance from the horizon's x`,
their edges counted from the horizon's y: the edges of neighbouring slats
step apart, more the farther from the horizon, a fan. Every band is
shadowed. Neighbouring slats are dragged opposite ways (down, up, down …),
so they read as sheets tilted towards each other. Four kinds of slat in
turn, each a ground and two shadow jars by the band's parity; a few accent
slats in the other family.

**TIERS** (`holo-60-tiers`, the owner: "one more option for 60 × 60; you
may take the new references as the example"). The bands' edges are the same
for every slat, straight across: tiers, shortest at the horizon's y (54 mm)
and 1.32 times taller each step away. About half of a slat's bands are
shadowed, the rest left open. A shadow is laid full over 0.6 of its band,
then gives out. The tiers' strokes go down and up in turn, so the joints
between tiers are crisp, soft, crisp. Every slat is of a warm or a cool
family, never more than two alike in a row; some slats 4 legs or wider give one leg to a pinstripe, red or
bare canvas, its whole height, no shadow. Some grounds are the bare canvas.

## Rules the model found

- **A shadow only over a ground of its own family, or over white.** Blue
  over the cream `#EDDAC9` came out green in the model (two-constant
  Kubelka–Munk, est.). `holo-60-blue` keeps its blues on white and pale
  blue; TIERS has a warm and a cool family and never crosses them.
  `holo-40-warm`'s three blue slats lie on the cream `#F2E9DC`, nearly
  white: the model keeps them blue. LAB to confirm, else white under them.
- **The light does not survive a stroke through a dark.** A first try
  dragged light and dark puddles of one family in one stroke: the cream was
  gone, the picture orange-brown. Hence two runs, and one jar a stroke.
- **The value range.** Lightness of the painted area, 5th to 95th
  percentile: Florian Markus's two canvases in the owner's screenshots
  L 31–78; the "holograms" 4–96; the sheets 14–92 (40 warm), 5–90 (60
  blue), 11–94 (60 tiers). Off photographs and a model, not measured.

## The gaps rule, before the first run (README)

README, "The brush lands and lifts on the move": look for this before a new
tab's first run. On HOLO:

- A band's sharp edge is where a run-2 stroke starts. The brush lands and
  lifts on the move, and the tip touches late: `ELBOW_J3` at both ends, as
  FORM-G's run. If the starts still fall short, the fan's edges go ragged.
- The trail runs behind its puddle by some mm. The plan is to lay every
  puddle that much earlier on the brush's way, so legs dragged opposite
  ways shift opposite ways. The model draws no shift: LAB gives the number.
- A run-1 stroke starts before its first puddle and ends past its last;
  the puddles' first and last are 4 mm in from the field's edges.

## LAB first

One sheet on a 20 × 20, black or white ground, before any painting. It
gives the three numbers the plans stand on:

1. **A dab.** Does the rubber tip leave an even puddle? Its size for 1, 2
   and 3 dabs. Is a second dab the same 8 mm again, or the next 8 mm end to
   end?
2. **How far a puddle lasts.** A stroke from a puddle of 1, 2, 3, 4 dabs,
   until it gives out: mm laid full, mm of fade. The plans take 55 mm a dab
   on FAN and 45 on TIERS (est.; FORM-G's dip lasts 79 mm of thin film).
   The bands' lengths follow from this number, not the other way round.
3. **Open time.** The same puddle dragged at 5, 10, 20, 30 min. It sets
   the batch.

And two looks: a dark stroke over a dry light ground — a clean fade, or
stripes in the tip's grooves? — and a blue over cream.

## The three pictures

`HOLO/plans/*.json`; the sheets beside them show each in three steps.

| | `holo-40-warm` | `holo-60-blue` | `holo-60-tiers` |
|---|---|---|---|
| canvas | 40 × 40 | 60 × 60 | 60 × 60 |
| composition | FAN | FAN | TIERS |
| field, mm | 360 × 360 | 560 × 560 | 540 × 540 |
| legs · slats | 72 · 20 | 112 · 26 | 108 · 33 |
| bands, mm | 65 … 183 | 64 … 174 | 54 … 105, 7 tiers |
| jars | 10 | 11 | 11 |
| run 1 dabs | 720 | 1680 | 1395 |
| run 2 puddles · dabs | 298 · 490 | 676 · 1137 | 348 · 609 |
| dabs in all | 1210 | 2817 | 2004 |
| at 9 s a dab (est.) | ≈ 3 h | ≈ 7 h | ≈ 5 h |

9 s a dab: the run journal's hand dip of about 6 s, the way to the place
and the mark. The drags are short beside it: at most 26 m of line a run
on the 40 × 40, 58 … 63 m on the 60 × 60.

**`holo-60-blue` is 560 mm across.** One pose reaches 568.5 mm between the
Y walls (§1), and the image area comes from Calibration, never hardcoded:
`placeRange` decides. If it does not fit, or MARKS' strips need the room:
108 legs, 540 mm, as the racing face's 54 cm (`margin` 30 in the study).
`holo-60-tiers` is already 540.

**7 h is long.** The owner's way out, not decided: a wider rubber tip for
the 60 × 60 and the 40 × 40's plan at 1.5 times — the same 72 legs. LAB's
canon was measured for the 5 mm tip only.

## A plan's json

The picture's mm, x right, y up, as FORM-G's legs.

```
{ id, title, composition: "fan" | "tiers", w, h, pitch,
  field: { x0, x1, y0, y1 }, horizon: { x, y },
  est: { puddle_gap, a_dab_lasts, shadow_reach, shadow_full, mark_leg, s_per_dab },
  count: { legs, slats, run1_dabs, run2_puddles, run2_dabs, line_m },
  jars: [ { hex, L, run, run1_dabs, run2_dabs } ],          // light to dark
  slats: [ { x0, legs,                                      // its left edge, its legs 5 mm apart from x0 + 2.5
             ground,                                        // a jar's hex, or null: the bare canvas
             puddles_y: [ … ],                              // run 1: on every leg of the slat
             bands: [ { y0, y1, jar, dabs, start, end, way } ] } ] }   // run 2: the puddle at `start`, the stroke to `end`
```

The jars carry no numbers: the owner numbers his jars himself, and a jar
is never renumbered (Kuzya's audit). COLORS' registry finds the same hex
in other pictures (`colorreg.js`); `colormix.js`'s `jarRecipe` gives a
recipe, est. Its families were made for the 911's reds: check what it
gives for HOLO's yellows and blues before the owner mixes by it.

## What it reuses, what is new

Reused: the cup at hand and its five steps (`strokes.js`, `handDip`;
`rembrandt.py`, `hand_guard`); `plotRun`; `canon.js`'s `ELBOW_J3`; MARKS'
mark as the dab (`formgplan.js`, `marksOf`); FORM-G's page, its DRAG
question with Start from, BACK ONE CELL, the iPhone's remote and PROGRESS;
the pause between layers (`seqOf`, a jar's second layer); COLORS.

New: `src/holoplan.js` (a plan's json into rows: a jar's batches, lay then
drag), `src/holo.js`, `app/holo.html`, `app/holo/` for the plans, a LAB
sheet for the three numbers. No change to the firmware.

## Ask the owner before

- **Anything that moves the machine** (README): a dab is a new move in a
  run — a dip, then a mark with no line after it. He allows it, then it is
  written.
- **The idle run.** The canon lays an idle run at once after a snake. After
  a run-1 stroke: yes, no, or a switch? The sheets have none.
- **The paint.** FORM-G's is 1 : 1 with pouring medium, a thin film. Run 1
  is the shot he wants thick and wet: the same mix, or less medium?
- **The bare canvas** as TIERS' white: it saves about a quarter of run 1's
  dabs, but a shadow over bare primed canvas may not fade as over paint.
- **Which composition goes first**, and the tab's place in the top row.

## Files

```
HOLO.md                        this file (the root, beside OPM-N.md)
HOLO/
  sheets-40x40-warm.png        FAN, warm: the light puddles · run 1 dry and the dark puddles · run 2
  sheets-60x60-blue.png        FAN, blue
  sheets-60x60-tiers.png       TIERS
  plans/holo-40-warm.json      the three plans
  plans/holo-60-blue.json
  plans/holo-60-tiers.json
  study/holo_study.py          how they were made: numpy, pillow, scipy
                               python holo_study.py holo-60-tiers out/
```

The references — the "holograms" and the stripe paintings — are other
artists' works: they stay on the owner's Mac, out of git (README). Only
their colours are here, as hex in the plans.
