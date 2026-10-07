# LOVE · RIBBON

> **Not built (the owner, 2026-10-07, 02:30): "No ribbon. The path will be
> rails. The main thing is that the train runs without stops."** LOVE runs
> on rails instead — every lane a rail, a switch where the lanes of touching
> letters lie together (Rembrandt.md §1, §8). Kept for its decisions that
> still hold: one cup, the trace split by dips, Play the run.

The spec of the ribbon on the LOVE tab, 2026-10-07 — TYPE's copy, where the
new things go so that TYPE stays as it is to go back to (the owner: "if
something goes wrong, we can roll back to TYPE"). First written as a mode of
TYPE. Rewritten by Claude
Code from the first draft of Claude in chat (2026-10-06), with the owner's
answers of 2026-10-07 and the LOVE prototype, `Rembrandt_RIBBON_LOVE.html`.
The owner, 2026-10-07: "Claude in chat brings us ideas, and we build them."

One ribbon carries the whole inscription. The brush paints it in one run:
lane 1 from the spine's start to its end, a half circle across into lane 2,
lane 2 back to the start, and so on. It lands once and lifts once. TRACE and
MARKS stay as on TYPE; DRAG becomes one path. LOVE starts as TYPE's copy,
letters as bands; the ribbon comes in beside them: BANDS · RIBBON.

## Decided (the owner, 2026-10-07)

- **No branches.** "I have decided to drop branches altogether. Let them be
  sort of inflated, pot-bellied, with no sharp corners." An arm (E, F, T …)
  is a fold: the ribbon goes out, turns, and comes back alongside itself. No
  lifts; no choice between Lift and Hairpin.
- **Self-contained, all in TYPE**: "everything must be autonomous, without
  Illustrator or Figma"; "everything is done in TYPE". The spine comes from
  the text typed on the tab. No SVG import.
- **One cup.** TRACE and MARKS dip in the Ink tab's cup; INK-2 stays
  cancelled (2026-10-06).
- **The turn between lanes is a half circle, no stop** ("yes, without
  stops"), as Test's snake C. Not the first draft's straight step: its two
  right angles stop the board twice.
- **The trace is split by dips** ("yes, great, let's do that").
- **DRAG is one row** for the board; the SVG with `data-part` goes only into
  the Library's save.
- **Paints along the ribbon, (a)**: the paint chips' order spread evenly by
  length; a click on a mark steps its paint.
- **Play the run**, from the LOVE prototype: "this preview shows how the
  paint will lie".

## The spine

The ribbon's centre line, lines and arcs only (Rembrandt.md §1), built in band
widths W and scaled onto the canvas from home.

- **From the text, letter by letter.** Every letter of a ribbon alphabet is a
  spine of its own: lines and arcs, an entry and an exit, every corner
  rounded — Corner roundness at least 0.55 W, so the inner lane never folds —
  and every arm a fold. Hooks join the letters, lines and arcs too.
- **The route goes round the block clockwise.** The owner: "in LO the tip of
  the L runs into the O, then the O into the E (the bottom right corner), and
  only then the V — the bottom left corner. As if going clockwise all the
  time." The text `LO / VE` runs L, O, a hook down, E, V: the first line left
  to right, the second right to left. *Claude's reading* for more lines: they
  keep alternating, as an ox ploughs.
- **The first letters are L, O, V, E**, the prototype's turtle
  (`turtleSpine`): the L's stem and foot, on into the O's bottom; the O once
  round, back along its own bottom; the E's top arm, its middle and lower arms
  folds; the V's right arm a fold. The rest of the alphabet follows letter by
  letter once LOVE has run on the machine, from New Yuri's skeletons
  (`app/glyphs.json`), rounded, their branches made folds. A letter with no
  ribbon spine yet is left out and named in the readout.
- Later, perhaps: a spine painted by hand with NOLAN's Brush and Pen.

## Inside and outside

A lane keeps its offset from the spine all the way. Lane 1 lies on one side of
it: inside every turn towards that side, outside every turn the other way.
Where one letter turns one way and the next the other, lane 1 draws the
first's outer contour and the second's inner — Florian's "inside, outside,
inside", with nothing set per letter (Claude in chat; the owner, 2026-10-07).

In the prototype's LOVE the L and the O turn anticlockwise (90° and 360°), the
E and the V mostly clockwise (538° against 360°, 256° against 180°). So lane 1
runs inside the L and the O and outside the E and the V — in pairs, the top
line one way and the bottom one the other. The Spine view shows it: lane 1's
side along the spine, orange where it is outside, grey where inside
(*Claude's choice*). See Open, 1.

## Geometry

- **Band width** W, **Brush width** b, **Lanes** n: even, 2 … 12, 6 by
  default (the owner, 2026-10-06: six instead of seven). The pitch
  p = (W − b) / (n − 1); a warning when p > b, white between lanes.
- The spine resampled every 1 mm; lane k at d_k = −(W − b)/2 + k·p along the
  normal; on the inside of a bend, points that would run backwards dropped
  (`offsetSide`, as now).
- **Round ends**: every lane runs on past the spine's end to the circle of
  radius (W − b)/2 round it, so the ribbon ends round, as TYPE's bands do (the
  prototype's).
- **Over itself**: where the ribbon passes a place twice — the O's bottom,
  painted as the L's foot and again closing the loop — the readout lists it:
  wet on wet, a choice and not an accident.
- LOVE on 500 × 700, margin 40, brush 10 (the prototype's numbers): W 42.5 mm,
  6 lanes 6.5 mm apart; the ribbon 2.84 m; the brush's path 17.2 m, 4.8 min at
  60 mm/s.

## Pass 1 · TRACE

The ribbon's outline in watercolour from the cup — its two edges and its round
ends, one line round the ribbon, the line's outer edge on the ribbon's edge,
as on TYPE now. Split by the dip run (720 mm, est.): after a dip the brush
lands a few mm (est.) back on the wet end of the piece before and goes on.
LOVE: about 5.8 m of outline, 9 pieces.

## Pass 2 · MARKS

- A mark across the band every **Mark spacing** mm along the spine, its ends
  at the trace's inner edge; none where the ribbon has passed already (the
  prototype's), so a place painted twice gets its paint once.
- The paints: the chips' order spread evenly by length; a click on a mark
  steps its paint to the next chip.
- The ticks as on TYPE: the paint's number as on an abacus.
- From the one cup, a dip every 4 marks (est.); the confirm names the paints
  to squeeze and how many marks each.
- The readout: ml a mark ≈ W × spacing × Paint layer / 1000, and ml a paint
  (the prototype's; Paint layer 0.5 mm, est.).

## Pass 3 · DRAG

- Lane 1 from the start to the end, a half circle of diameter p into lane 2,
  back to the start, and so on; the brush down all the way, the dry brush, no
  dip. One row, fitted into lines and arcs (`fitPieces`); the half circle
  keeps the tangent, so the board never stops.
- With n even the brush finishes at the start, the band's width across from
  where it landed (32.5 mm on LOVE). The board shows both: a dot where it
  lands, a ring where it lifts.
- The ends may lie on the canvas: on Florian's the lanes' half circles are
  part of the picture (IMG_9925, arrows 1 and 3).

## Result and Play the run

- **Result**, the prototype's simulation along the one path: the brush picks
  up the paint of every mark it crosses, mixed into what it carries, lays it
  paler and paler over the Paint run, and carries it on through the turn into
  the next lane; the lanes running back drag each mark's colour the other
  way. That mixing is the point of the mode and must show.
- **Play the run** (the owner, 2026-10-07) — **built on LOVE for the bands**:
  a key under the views. It lays the Result again in the order the brush
  goes, a ring for the brush, the whole run in 12 s (the prototype's);
  pressed again, it stops. A view, not a key of the deck. The Result it lays
  walks DRAG's own path, the paint carried on round the lanes (`paintWalk`).

## The panel in RIBBON

- **BANDS · RIBBON** at the top of the panel, kept with the Library's save.
- Hidden in RIBBON: OVERLAPS, Pass through, Rings, Letter gap, Outside first ·
  Inside first, the sessions, Paints per letter.
- **Text** (lines: `LO / VE`), **Band width** mm, **Margin**, **Fit to
  canvas** (the widest W that fits inside the margin).
- **Shape**, in band widths: **Corner roundness** (0.55 … 1.4, 0.75),
  **Fold gap** (0 … 0.6, 0.1; 0, the legs touching, as Florian's). The
  prototype's O corners and V lean belong to those letters, kept at 1.0 and
  12° in the alphabet, not in the panel.
- **Brush**: Brush width, Lanes, Drag speed. **Paint**: Mark spacing (70),
  Paint run, Paint layer (est.).
- **The readout**: W, lanes and pitch; the ribbon m; the brush's path m and
  min; marks and ml by paint; the places painted twice; the warning p > b.

## Florian's way, from the photos (IMG_9919 … 9932, 2026-10-06)

- His plotter first draws every lane as a thin grey line ("Brush plot");
  our TRACE draws only the outline, in watercolour.
- The marks are squeezed by hand straight from the bottle, dumbbells across
  the band and longer than it: after the drag their ends stand out of both
  edges as spikes (IMG_9930). At a turn, two marks in a V (IMG_9931).
- The first lane drags a line of each mark's colour along through all the
  marks (IMG_9923, 9925).
- The lanes of a turn are concentric; the snake's neighbouring turns touch
  (IMG_9919).
- IMG_9925, the owner's arrows, *Claude's reading*: at 1 and 3 the lanes turn
  by a tight half circle at a ribbon's end, in the picture; at 2 the ribbon
  runs against another wet one.

## Dropped from the first draft

- INK-2 → the one cup.
- A spine drawn in Illustrator or Figma, imported as SVG → the spine from the
  text, in TYPE.
- The straight step between lanes → the half circle.
- Branches as Lift or Hairpin, `data-part="branch"`, the lifts count → no
  branches; every arm a fold.
- Euler routes over the stroke graph → a ribbon alphabet, designed letter by
  letter.
- A file per pass → one DRAG row; the SVG with the Library's save.
- The prototype's "Always clockwise, lift between lanes" → not taken: no
  lifts.

## Build order

1. BANDS · RIBBON; LOVE's spine from the prototype; the Spine view with lane
   1's side.
2. The lanes and DRAG as one row; where it lands and lifts on the board.
3. MARKS: the marks, the paints by length, the click.
4. Result along the path, and Play the run — done for the bands, 2026-10-07.
5. TRACE split by dips.
6. On the machine with the owner: DRAG in the air first, then LOVE in paint.
7. The alphabet, letter by letter.

## Open

1. **LOVE's inside and outside.** The prototype's route gives the L and the O
   lane 1 inside, the E and the V outside — in pairs. The owner's "L outside,
   O inside, E outside, V inside" needs the O to run clockwise: another route.
   Which?
2. **IMG_9925**: is Claude's reading of arrows 1, 2, 3 right?
3. **More than two lines**: do the lines keep alternating direction?
