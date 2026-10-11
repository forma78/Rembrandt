# ALU tab

Pipes of paint, each a wide band along a line drawn on the tab. A pipe is brushed in one of two modes, named by the owner on 2026-10-08:

- **Whole lanes, Master Flo** (the default, and New composition's only one): every lane the whole pipe in one run.
- **Segments, Alu** (formerly "Segments, Lett"): cut by seams, each segment along the line or across it.

The working prototype is `Rembrandt · ALU.html` (single file, no dependencies); port its logic into Rembrandt as the ALU tab, do not call it. Start with the photographs in `paper-test/` (README.md there): they are the owner's hand-made run of the machine, and Whole lanes, Master Flo is built to match them.

**No brushed aluminium** (the owner, 2026-10-08: "remove Brushed aluminium, I do not plan it at all"). The tab keeps its name, ALU. Its grounds are **White** and **Paper**; a save made on the aluminium ground opens on White.

The first reference was Belem Lett: a colour-loaded brush, the stops and starts of the brush left visible so the colour breaks into segments. The owner, 2026-10-08: "he is a real artist; Florian is an architect and an inventor"; "combine two brush directions: in one place the brush runs parallel to the line, in others across it; that is unexpected and brings something new to plotter painting, something non-linear"; "no Illustrator: we do everything inside Rembrandt, that is what it was made for"; "the configuration we have now, three servos and two NEMA17; if it sells, I will build a second machine".

## Whole lanes: the paper test, 2026-10-08

The owner painted the machine's run by hand on an A5 page, "repeating the brush's way with absolute precision", because the earlier simulation stepped two lanes at a time where a pipe crossed itself ("they go in twos; it must be one"). The photographs are the reference for this section. What he did:

- A band of 8 lanes, numbered **1 on the outside of the turn to 8 on the inside**, comes in from the left, turns up into a loop and comes down across itself.
- Marks across the whole band, one paint each, squeezed before the run: black twice on the way in and once at the start of the turn; white four times round the loop (radial there), once just above the crossing and twice below it.
- **Lane 8 first, then 7, … 1**: each lane the whole way in one run, always from the left start, along, round the loop and down; the brush lifts at the end and goes back to the start in the air. It is not washed: it starts each lane with what it carried out of the last (the white streaks at the left ends of lanes 7 … 1).
- Where the band crosses itself, the lane painted later lies on top: one lane per step. Lane `k` lies over the crossing lanes `j > k` and under `j ≤ k`, its own included.
- A lane coming down through the crossing picks up the wet black of the rows it passes over: lane 1 crosses all eight and comes out black, lane 8 crosses one and stays light.

Why the earlier simulation stepped in twos: Segments' back-and-forth order runs lane `i` one way and lane `i+1` the other, so at a crossing the two pass in the order A, B, B, A; and a seam between the two passes of a crossing stops the stair altogether. Whole lanes fixes both.

The prototype's **Paper test, 8 Oct** loads it at 1 : 1 on a 148 × 210 page: the band 47 mm wide, a 6 mm brush, the marks at mm along the centre line read off the photographs (`est.`). Result reproduces the single stair, the black carried down lane 1, the grey loop lightening mark by mark, and the white at the left ends.

## Where it goes

- Top row after LOVE: TYPE · LOVE · ALU · NOLAN · Test · Ink · Calibration · Library (2026-10-08). Since 2026-10-11: ALU-CUT · ALU · SMKN · NOLAN · Test · Ink · Calibration · Library — ALU-CUT, below, first; TYPE and LOVE off the row.
- `alu.html`, its page module `src/alu.js` copied from `love.js`, its plan `src/aluplan.js`. Shared, imported, not copied: the run, the deck (TEST · PAUSE, TRACE · MARKS · DRAG), the canvas from home (`canvas.js`; here the panel), the cup (INK-1), the LCD. Saves labelled ALU and opened on it.
- The prototype's 148 × 210 (the paper test), 400 × 500, 500 × 700 and 560 × 800 are for the preview; 560 × 800 is the widest that fits the image area's 568.5 mm across.

## Glossary additions

- **Panel**: the board the pipes are painted on: the canvas from home (`canvas.js`). Ground White or Paper.
- **Pipe**: one band of paint along a line. Its points, clicked on the tab (they may lie up to 60 mm off the panel); its **Width**; its **Corners**, 0 to 1; its **Largest corner radius**, mm (none at 300, the slider's end), so a corner is rounded by `min(Corners × the shorter half-leg, radius × tan(θ/2))` as its tangent length; its **Brush**, Whole lanes, Master Flo or Segments, Alu; its two ends, **Flat** or **Fan** (Segments, Alu only).
- **Whole lanes, Master Flo** (a new pipe's default): `n` lanes at offsets from `−e` to `+e`, each one run from the spine's start to its end, one way, a lift after each. **Inside lane first** (default) or outside. The inside is the side the pipe turns to on the whole: the sign of its total signed turning. Lanes are numbered as on the owner's page, 1 the outside, `n` the inside, so inside first runs `n … 1`. **Reverse the way** turns the pipe round (points, seams, segments, marks). Seams do not stop the brush here; they only change the paints.
- **Marks across** (Whole lanes, Master Flo): a mark right across the whole pipe, from lane 1 to lane `n` — DRAG's own lines, where TRACE runs (2026-10-11; edge to edge less 0.5 mm before) — one paint, no ticks. **By hand**, with the Marks tool; or, with none by hand, every spacing (as Along's) from the segment's paints, in turn along the segment. **Never cut into a dash a paint across the pipe** (the owner, 2026-10-08, `Screenshot 2026-10-08 at 2.55.56 PM.png` and `paper-test/02_marks_black_white.jpg`: "Whole lanes, Master Flo and Segments, Alu — that is all the Australian style, Alu. I did not notice at first; it came over from chat-Claude, the prototype had the error from the start. But it can be fixed. The principle of Master Flo is as on 02_marks_black_white.jpg: the lines always across the whole sausage, they make no gradient at once"). The paints across the pipe, Lett's tubes, are Segments, Alu's: an Along segment. The prototype's `lay: 'across'` on whole lanes is gone; `lay` is not read.
  A pipe crossing the panel edge also gets the edge dashes, in the paint the pipe has there.
- **Spine**: the pipe's centre line. The points joined by lines, each corner rounded by an arc whose tangent length is Corners times the shorter of the two half-legs (the whole leg at the pipe's first and last corner). Lines and arcs only (Rembrandt.md §1), so every lane offset from it is lines and arcs too. A corner rounder than half the pipe's width is counted as tight: the inner lanes pinch there (points that would run backwards are dropped, as in RIBBON.md).
- **Seam**: a cut across the pipe, kept as a share of the spine's length, where the brush stops and starts again.
- **Segment**: the pipe between two seams, with a mode and one to five paints.
- **Along**: the segment brushed in `n` lanes parallel to the spine, at offsets from `−e` to `+e`, `e = W/2 − b/2` (`W` the pipe's width, `b` the brush's). The paints lie across the pipe: lane `i` takes paint `floor(i·K/n)` of the `K`. Back and forth, a step across at each end with the brush down (default), or one way with a lift after each lane.
- **Across**: the segment brushed in strokes over the pipe, from `−e` to `+e` and back, the brush down throughout; the next stroke where either end of it has moved Step across, so on a bend the strokes fan out and the outside never gapes. The paints lie along the segment in **rings** of three strokes, back and forth through them (a, b, c, b, a, b, …).
- **Fan end**: rays from the rim, radius `e`, to `b/4` from the end of the spine, Step across apart at the rim, a lift each. The end segment's paints round the rim.
- **Dash**: a mark of one paint, from INK-1. Along: a mark across the pipe 2 mm inside each end of the segment and each time the longer of the two edge lanes has run 0.97 of the spacing, cut into one dash per paint. Across: dashes along both edges, 3 mm inside the stroke ends, one per ring. Fan: an arc 3 mm inside the rim, one dash per paint, carried 0.12 rad past the end rays. Panel edge: where a pipe runs off the panel, a dash along the edge 3 mm in, its paint the lane group's (Along) or the ring's (Across) there.
- **Where pipes cross**: Wet on wet (default, one session, the drag below), or Dry between pipes (a pipe that touches an earlier one goes a session later).

## ALU-CUT, 2026-10-11

Chat-Claude's task, `ALU-cut-Claude/README.md`; the owner's sketch `ALU-cut-Claude/01-02-03_seams.png`. Master Flo's one drag through every paint at once muddies where dark runs into white — Florian Markus's way, and Plot Bot Studio's; the owner wants Belem Lett's clean palettes: "it may not be very Instagram-friendly… but this way we move away from Florian and his American clone".

- **The tab**: `index.html`, the first of the top row, in TYPE's and LOVE's place (the owner: "remove the TYPE and LOVE tabs — they do not work, they only distract; put ALU-CUT in their place, and every new thing there"). ALU's page module and plan, its body `data-tab="alucut"`; ALU's palette; its own keep and Library label. ALU and SMKN as they were.
- **Cut** (✂, C, in the Tools under the pencil — the owner: "S is taken, but C — cut"): a click on a pipe puts a cut there; the next part gets a family of paints of its own. A click on a seam makes it a cut, on a cut takes it away; with **Seams** (S) a click on a cut makes it a seam again — chat-Claude's way to compare with Florian's one run, no switch. Seams still only change the paints, the brush going on.
- **Part**: the pipe between two cuts, or between a cut and an end. DRAG paints a pipe part by part, in its way (Reverse the way turns it), every part in the pipe's lane numbers and order, inside first, as the snake or one way (the deck's switch). **At a cut the brush's edge never crosses it**: every lane ends, and the snake's step across runs, half a brush inside its part, measured from the cut's line along the pipe, on a bend too; lane `k` goes on as lane `k` on the other side.
- **The stop**: before every part but the first — at each cut, and before every next pipe ("a good idea") — the brush lifts at the part's end and a pause block holds the run there, over the canvas ("right over the canvas, I am careful"); the LCD: "Pipe 1, part 2 of 3: wipe or wash the brush, squeeze its paints, then Continue". None after the last part. PAUSE at a lane's end stays as it is inside a part.
- **Marks**: one MARKS pass for every part, as before; the owner squeezes the paint by hand a part at a time. A part's marks beside a cut lie **Marks from a cut** from it, 0 … 3 mm, 2 by default (est.; the owner: "a slider from 0 to 3 mm? If I go on when the paint has dried, neither 2 nor 3 mm is needed").
- **Result**: every part starts with a clean brush; wet on wet stays. A part that runs over another part's wet paint, or another pipe's, picks it up, and one ⚠ names it in the reading — no ban ("yes, OK!").
- **Time**: the stops are not counted; the DRAG confirm says how many there are.
- **Colours**: no New composition on ALU-CUT ("not needed at all"); **New colours** picks the chosen segment's family again, the rest as they are ("I would rather pick one segment and colour just it"). A click on a pipe chooses its segment.

## Drawing on the tab

- **Draw**: a click adds a point to the chosen pipe; New pipe starts another.
- **Edit**: drag a point; double-click a point to remove it; a click on a pipe chooses it and the segment under the click.
- **Seams**: a click on a pipe cuts it there; a click on a seam removes it. The new segment takes the other mode and the paints reversed, so a cut shows at once.
- **Marks**: a click on a pipe lays a mark of the chosen paint right across it (the paints show as chips under the tools); a click on a mark (within 4 mm or 0.6 of the brush) takes it away. The pipe goes to Whole lanes, its marks by hand; **Back to marks every spacing** clears them. The view turns to Marks.
- **Brush path** shows each whole lane's number at its start, as on the owner's page.
- **New composition** (the owner, 2026-10-08, after the earlier generator gave across strokes and fans: "take out the across ones, just stripes in parallel"; his references: Belem Lett's *Sunsets From My Window*, *Drainage*, *Burnouts in Blue* and *Burnouts*, 2021): a seeded proposal to start from, never the painting itself. **Whole lanes only — Master Flo's, so a tube's paints lie along each pipe, a mark right across in each — no Across segments, no fan ends.**
  - Pipes: three, one time in three four; then more, six at most, until they cover about 45 % of the panel (counted on a 10 mm grid).
  - Each pipe comes in over a panel edge, starting half its width plus 12 mm outside it, heading in on the 45° grid, and goes out over the nearest edge it can reach without turning back.
  - Two to four legs inside, each 18–50 % of the panel's height (a diagonal 1.2 times that), every leg's end at least 0.6 of the width inside the panel. Turns of 90° (most often), 45° or 135°, and hairpins: two right angles round a leg one width long, so the pipe folds back beside itself (Lett's U).
  - Width 72–100 % of the widest pipe the lanes cover without white gaps, `b + (n − 1)·0.92·b`. To make Lett's wide pipes, raise Lanes or the brush first.
  - Corners: Corners 1 and Largest corner radius 0.55–1 of the width: Lett's tight corners, the inner lanes drawn nearly to a point.
  - A pipe lying for more than 22 % of its length within 0.85 of the two half-widths of an earlier pipe is drawn again; the limit grows by 1.5 % a try after the 25th, so a composition always finishes. At least 55 % of its centre line must lie on the panel.
  - Colours: three families a composition (FAMILIES, with four after Lett's references added: pink–yellow–pale blue, red–maroon–acid green, navy–pink–pale blue, pink–magenta–navy). A pipe's tube: a family, reversed half the time, laid a, b, c, b, a two times in three. Six pipes in ten change colour along the way once or twice (seams from 30–55 % of the length, then every 220–420 mm), and the next segment stays in the family: the tube turned inside out (c, b, a, b, c), or a new paint in its middle.
  - **New colours** re-picks the families and keeps the lines, a tube's paints along each whole-lane pipe. Each segment's paints are changed by hand: Make it a tube, Reverse, Same on the whole pipe.

## Brush and paint

- The machine as it is: X, Y and the elbow's lift. The brush does not turn; turning it with the line, as Lett twists his, would need a servo on the holder (the owner: a second machine, if the panels sell).
- The simulation draws every run the brush's width in every direction, `est.` With a flat brush fixed on the holder an Across stroke and an Along lane do not leave the same width: measure both in Adjustments, or use a round brush.
- RIBBON.md's measured step model for the brush running dry, unchanged. Dense run and dry tail are 2026-10-07's, on paper; measure them again on the canvas.
- **Paint mixes as pigment**: in linear light, geometrically (Kubelka–Munk in a line), so white lightens black step by step. A paint's **strength** runs from 0.5 for white to 3 for black with its lightness, so dark paint takes over a light brush at once. A mark's paint goes into the brush with **A mark's share in the brush** (70 % est.), weighted by the two strengths. Tuned on the paper test: black, then dark grey after the first white mark, grey, light grey after the fourth.
- **The brush is not washed** between the lanes of a whole-lane pipe: it starts the next lane with what it carried out of the last. A new pipe, or a Segments, Alu segment, starts clean.
- **Beads** (the owner, 2026-10-08: "an imitation of the crossed lines, the sausages, as Florian's; I will drive the brush as Florian does"). Result draws every lane as a rounded bead of paint as wide as its pitch, the two edge lanes out to the pipe's edge: dark at its sides, its colour, two faint bristle hairlines, a light ridge offset towards the light from the top left. An Across stroke is a bead as wide as the step. **Flat** keeps the plain strips.
- **Wet on wet**, the default where pipes cross: the panel is kept as a grid (1 mm, 0.5 mm on panels under 300 mm) of the paint last laid, with its run and session. A run passing over wet paint of another run, or of itself more than 30 mm back, in the same session loads it into the brush: a share `1 − e^(−l / p)` for `l` mm of wet paint, `p` = **Wet paint loads the brush in** (40 mm est.), weighted by strength as above, and the brush's paint is renewed by the same share. So a lane comes out of a wet crossing in that colour and carries it on. A lane leaves a track 0.4 of its pitch wide, so the lane beside it does not count as wet paint under it. **The brush's own track is laid behind it**, once it has moved on by more than that width, so it never hides the wet paint just ahead (the bug that kept the paper test's lanes white through the crossing). Dry between pipes turns it off between pipes; within a pipe it is always wet.
- Solid paint is drawn at 0.9 opacity (`est.`); the marks are drawn under the runs as raised lines 3 mm wide in their paint (`est.`), so what the brush leaves of them shows between the lanes and past the edges, as on the page.
- The reading counts runs that cross the panel (more than 4 mm in from its edge) for longer than the dense run with no dash behind them; zero on the compositions tried.

## Files the prototype writes

TYPE.md's format: SVG in panel mm, y down, origin top left, `width`/`height` in mm; each `<path>` one brush-down run, in drawing order. Rembrandt's plans work in mm from the centre (`loveplan.js`): subtract half the board.

| File | Group id | `data-ink` | Extra attributes |
|---|---|---|---|
| `alu_<seed>_1_trace.svg` | `pass1-trace` | `INK-1` | `data-dip-every-mm`; per path `data-pipe`. Each pipe's outline 1 mm inside its edge, Fan ends round. |
| `…_2_marks[_sN].svg` | `pass2-marks-sN` | `INK-1` | `data-dip-every-marks`; per dash `data-paint`, `data-pipe`, `data-segment`, `data-kind` (`across`, `edge`, `rim`, `edge of panel`); per tick `data-paint`, `data-tick` |
| `…_3_drag[_sN].svg` | `pass3-drag-sN` | `none` | `data-brush-mm`; per path `data-pipe`, `data-mode` (`lanes`, `along`, `across`, `fan`), `data-lane` (the owner's number, whole lanes) or `data-segment` (segments). Whole lanes in painting order, each one path. |
| `…_paint_map.svg` | | | For the painter only, not for the machine |
| `…_plan.json` | | | The pipes (brush, lane order, marks by hand at mm along the centre line, points, width, corners, ends, seams, segments with paints by number), the settings, the sessions |

Ticks are TYPE's abacus (`ticksOf`), along the dash from its start, 4 mm apart.

## For Claude Code

- `aluplan.js` exports what the deck calls on LOVE, with the same shapes: `traceOf` / `traceRows`, `marksRows`, `dragRows`, `paintWalk`. Build the spine with what `fillet.js` and `geometry.js` already do before writing anything new; the offsets of a line are lines and of an arc arcs, so the drag rows come out of `fitPieces` as exactly lines and arcs.
- Mark the numbers `est.` in the UI and the code: the mark's share 70 %, strength 0.5 to 3, 40 mm to load the brush, the 0.4 track, 0.9 opacity, the 3 mm marks, the paper test's mark positions, three strokes a ring, the 2 mm end marks, the 3 mm edge dashes, 0.97 of the spacing, the fan's `b/4`, the 0.12 rad. Claude's choices, not measured.
- Whole lanes, Master Flo first: it is the owner's way. Port the paper test as a test fixture and check that at its crossing lane `k` lies on top of crossing lanes `j > k` and under `j ≤ k` (one lane per step), and that lane 1 comes out of the crossing darker than lane 8.
- Tests: every Along lane, the outer one on a bend included, meets a dash at least every spacing; every Across stroke crosses its starting edge's dash within 4 mm of landing; every fan ray crosses the rim's arc; a corner tighter than `W/2` is counted; a pipe that runs off the panel gets a dash along that edge; every file carries `data-ink`.
- The rules of README.md stand: English everywhere; no drying timers; ask before changing anything that moves the machine.
