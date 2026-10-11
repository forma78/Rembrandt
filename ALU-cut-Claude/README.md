# ALU-cut: seams that stop the brush

ALU (and SMKN, which shares it): one segment at a time, a clean brush each.

Base: HEAD 8346790 (v.1.0.4, Snake). Read ALU-Claude/ALU.md, the ALU section of
Rembrandt.md, and the last two commits (the snake; PAUSE at a lane's end) first.

## The references in this folder

| File | What it is |
|---|---|
| `01-02-03_seams.png` | **The owner's sketch for this task.** One pipe, two seams drawn in pink, three segments numbered 1, 2, 3. |
| `rembrandt-variants/01.png`, `02.png`, `03.png` | Three colour variants of the same composition from Rembrandt's ALU tab, Master Flo: one pipe, one drag, Florian Markus's way. What we are moving away from. |
| `plotbot-clone/florian-markus_instagram.png` | Florian Markus's work as reposted on Instagram. |
| `plotbot-clone/plotbotstudio_neon-pulse-7_40x50_225eur.png` | Plot Bot Studio (plotbotstudio.com), a US clone of Florian's process: 40 × 50 cm at €225.95. |
| `plotbot-clone/video-frame_01 … 05.png` | Frames from Plot Bot Studio's process video: one brush through every paint at once, the blue ploughing into the white. The mud the owner does not want. |
| `belem-lett/belem-lett_01.png`, `_02.png` | Belem Lett: clean palettes, the pipe changing colour in segments. The target for colour. |

## Why

The owner's three colour variants of one composition (01, 02, 03) are Master Flo
runs: one pipe, all its paint squeezed at once, one drag. Florian Markus does it
that way, and so does Plot Bot Studio. Where a dark paint runs into white, the
whole pipe goes muddy. The owner wants Belem Lett's clean palettes instead. The
way: cut the pipe into segments with seams, each segment its own palette, painted
on its own:

1. he squeezes the paint for segment 1 only;
2. DRAG paints segment 1 (the snake, its lanes back and forth) and stops at the
   seam, the brush lifted;
3. he wipes the brush, or washes it, squeezes segment 2's paint, Continue;
4. segment 2, stop; segment 3, the last, with no stop after it.

In his sketch (`01-02-03_seams.png`) the three segments are light blue with
yellow; navy into purple; red into maroon. He put the seams so that every
crossing of the pipe with itself lies inside one segment: the stair of crossings
stays Master Flo's, and only the colour is cut.

The owner, 2026-10-11: "It may not be very Instagram-friendly… but this way we
move away from Florian and his American clone."

## What to build

- ~~A switch STOP AT SEAMS on the deck~~ — dropped, 2026-10-11 (the owner and
  chat-Claude chose A): **✂ is a tool under the pencil, C its key**: a click on
  a pipe puts a cut there, the brush always stops at a cut and starts the next
  part clean. S seams stay as they are now: the paints change, the brush goes
  on. With ✂ chosen, a click on an existing S seam turns it into a cut, and
  with S chosen, a click on a cut turns it back into a seam — the way to
  compare with Florian's one run, no switch needed. A new tab, ALU-CUT, in
  TYPE's and LOVE's place, carries it; ALU and SMKN stay as they are.
- **At a cut:** DRAG runs a Whole lanes pipe segment by segment, in the pipe's order.
  Each segment is one snake (or one-way lanes with the snake Off), from its start
  seam to its end seam. The lane numbering and the inside-first order are the
  **pipe's**, not the segment's, so lane k on one side of a seam continues as
  lane k on the other.
- **At a seam the brush's edge never crosses it.** The lanes end, and the snake's
  step across runs, b/2 inside the segment (b the brush width). The next segment
  starts the same distance on its side. No gap, no smear into the wet neighbour.
- **Between segments** the brush lifts at the end of the segment and a pause
  block goes in (kind `'pause'`, the existing one). The LCD and the deck say:
  "Segment 2 of 3: wipe or wash the brush, squeeze its paint, then Continue".
  There is none after the last segment. This is a hard stop, not the lane-end
  PAUSE; that one stays as it is, inside a segment.
- **Simulation (Result):** the brush starts every segment clean, as a Segments,
  Alu segment does now. Wet on wet stays on. A segment that crosses an
  **earlier** segment's wet paint picks it up in the preview, as the model already
  does: that is the mud he wants to see coming. If you flag it, use one ⚠️ only:
  no traffic lights, no ban.
- **MARKS unchanged:** all segments' marks in one pass from the cup, as now. He
  squeezes the real paint by hand, one segment at a time.
- **Time estimate:** the pauses are not counted (he is the one waiting), but the
  estimate says "+ N stops".
- **Saves:** the cuts are kept with the pipe (`cuts` beside `seams`); an old save has none.

## Tests

Add them to `aluplan.test.js` / `runner_test.py` as fits.

- The owner's 01-02-03 shape (one pipe, two seams):
  - Off gives today's blocks to the byte.
  - On gives 3 landings and 2 pause blocks, one between each pair of segments,
    none at the end.
  - On's paint total equals Off's, less the b/2 trimmed at the seams.
- No brush centre comes within b/2 of a seam from the wrong side. Every snake
  step across at a seam lies b/2 inside its own segment.
- Lane k ends at seam s and lane k starts at seam s on the other side, at the same
  offset from the spine.
- The runner holds at each pause block with the brush up and goes on with
  Continue. Nothing in a segment runs twice.

## Rules (README.md)

- English everywhere.
- No drying timers.
- Ask the owner before changing anything that moves the machine. This change
  does, so show him the block list of the 01-02-03 shape (On) before the first
  run on the table.
- Update CHANGELOG.md, Rembrandt.md and ALU-Claude/ALU.md, quoting the owner in
  his words as you do.
