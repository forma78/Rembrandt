# Changelog

Rembrandt, the successor of RUBENS, for CNCDM-001. Newest first.
Machine measurements stay in RUBENS: `../Rubens/CALIBRATION.md`.

## Unreleased

- **New Yuri: the letters as rings — `rings.js` and the owner's set in
  `app/glyphs.json`** (the owner, 2026-10-05: "maybe make a New Yuri tab,
  so as not to mix all this into NOLAN? We have no 3D there, half the
  sliders are not needed"). A letter is strokes, a stroke a skeleton of
  lines and arcs; a circle of radius R lies every STEP along it, RAMP
  spreading the spacing from dense to sparse — RINGS, each circle its own
  loop from 12 o'clock clockwise, or COIL, one line a stroke, a whole turn
  from centre to centre (the logic of `type_rings_mode/rings.py`, Claude in
  chat, ported). A circle on both ends of a stroke and on every corner of
  its skeleton, the spacing even between them: the V's bottom fell between
  two circles and stood 2.6 mm off the baseline (*Claude's choice*). Dots,
  as the owner's ! and %: a sphere — circles every STEP down, cut to the
  first. The gap between letters is between their outlines, 0 touching,
  below 0 overlapping (the first task). The skeletons are the owner's set,
  `NEW-YURI/*.png` — A–Z, 0–9, % and ! — fitted by Claude to the pictures'
  silhouettes, 96 … 99.7 % overlap a letter (the owner: "transfer them
  yourself then"; `type_rings_mode/glyphs_v3.json` was v2 again); the A
  of `ABCD.png` the canon ("the only correct A"). The tab itself is next.
  Seen in the browser on a page of its own; no machine.

- **Ink: 🙋‍♂️ and 🙇‍♂️ on The dip's keys** (the owner, 2026-10-05: "two
  emoji icons here"): 🙋‍♂️ Over the rim ← elbow — the arm up; 🙇‍♂️ In the
  cup ← elbow — the bow down into the paint.

- **Rembrandt.md §0: o'clock** — a place on a ring as on a clock face over
  the canvas: 12 at the top, 3 right, 6 bottom, 9 left by the cup; the
  Circle's seam at 12, its rows clockwise (the owner, 2026-10-05: "the
  clock face — I guessed it; write about it on GitHub").

- **NOLAN: a ring's lap is half its own length** (the owner, 2026-10-05,
  `nolan-v2/IMAGE 2026-10-05 17:48:32.jpg`, `17:48:35.jpg`, after the run
  of 17:21, 8 rings, 25 min: "maybe lap each circle by 50 %, not just
  75 mm — a wide ring uses its paint otherwise than the smallest, so an
  equal lap of some mm is not fair"; "the lap is needed"). `LOOP_SHARE`
  0.5 in place of `LOOP_LAP` 75 mm: the 12 rings of a figure of 17:21 lap
  51 … 293 mm, the brush lifting off over all of it as before. The plan of
  17:21 so: 120 pieces, 120 dips — the outer rings over 720 mm now split
  for a second dip — 49.9 m, ≈ 29 min. The little tail over the seam at
  12 o'clock, the brush landing at speed, stays: the press is not
  calibrated yet, and on a dry run without the watercolour it does not
  matter (the owner). Tried in the browser; not run on the machine from here.

- **NOLAN: the rings painted whole again — the fit never spans a point back
  to itself** (the owner, 2026-10-05, `nolan-v2/Screenshot 2026-10-05
  issue.png`: "something is wrong — it does not draw the circle, only the
  tails; please fix it"). The run of 17:13, stopped at 9 %: of every ring
  only its 75 mm lap went to the board. A lapped run passes its own seam
  point, and `fitPieces` tried a span of one whole turn, its two ends on one
  point: the biarc between them NaN, which every check let through, and the
  pieces of no length were dropped — the turn with them. Now a span whose
  ends meet round a loop is refused before its biarc, every check fails on a
  NaN, and the pieces must be as long as the run they stand for (0.5 mm or
  0.5 %). The 17:13 plan from the journal: its first ring 176.1 mm fitted of
  176.5 (74.9 before); 8 rings, 96 rows, 96 dips. A test from that run fails
  on the old fit. Not run on the machine from here.

- **NOLAN: a loop's lap 75 mm, the brush lifting off over all of it; Tail
  0.05 … 5 mm** (the owner, 2026-10-05: "a smooth one? then increase it
  from 50 to 75 mm, the lap and the lift-off"; and of Tail: "I do not use
  it, to be honest — past 3 mm it starts to play up; cut it to 0.05 …
  5 mm"). A ring's row now runs 75 mm over its start, and the elbow eases
  the brush off over the whole lap, a half cosine from pressed to +10° —
  a long fade on wet paint, not the hook of a short tail: `lapLoops` marks
  the run's lap, `bandPasses` hands it to the row's last piece as
  `tailOut`, and `strokes.js` lifts over it; the landing stays on Tail.
  Imprint draws it so. Tail on NOLAN and Test 0.05 … 5 mm, in 0.05 mm
  steps, 3 by default (3 … 20 and 15 before; a saved 15 opens as 5); a
  tail under 0.05 mm is a sliver, never sent, its elbow command riding on
  the next piece. The elbow's 211°/s note, which so short a tail always
  raises and which never stops PLAY, goes under the ⓘ. Planned in node and
  tried in the browser; not run on the machine from here.

- **NOLAN: a loop's rows run on 50 mm over their own start** (the owner,
  2026-10-05, `nolan-v2/IMAGE 2026-10-05 16:56:15 … 16:56:33.jpg`: "the
  ring does not close, the brush paints a tulip on the canvas"; "if it is a
  perfect circle, run on round it 50 mm further, though it has turned its
  360°"). The rings of 16:38 started at their seam, at the top, with the
  thin landing and ended there with the lift curling up, the two apart: an
  onion dome on every ring. `lapLoops` (`band.js`): a row that runs whole
  round a closed figure — a Circle, a Brush loop — goes on `LOOP_LAP` 50 mm
  over its start, so the landing is painted over at full pressure and the
  brush lifts on wet paint; a row broken by a cut or by another part is no
  loop. The wash shows the lap darker, as the paper will. Planned in node:
  7 rings, one piece each, 50 mm longer; INK ON, 9 pieces, the two outer
  rings over 720 mm with a dip between. Not run on the machine from here.
  The rings crossing where they overlap stay as they are (the owner: "all
  perfect here, nothing needed").

- **NOLAN: a figure dragged moves in the plane; Size, X ↑, Y → as fields**
  (the owner, 2026-10-05: "X ↑ −250 is the limit, the slider blocks, though
  it can go lower"; "drag and drop turns it in 3D — I do not need 3D;
  better to drag the circles over the plane, as in Adobe Illustrator"; "as
  in CANVAS, Board width / Board height: arrows down and up for Size,
  X ↑ / Y →"). Select: a figure dragged moves, whole mm, picked as it is
  taken; ⇧ turns it in 3D (Shift moved it before), ⌥ spins it; dragged off
  every figure nothing moves; the same under the Cut tool, whose click still
  cuts. Size, X ↑ and Y → are number fields with their arrows, each step at
  once, X ↑ and Y → with no limit, Size 0.05 … 10 × (the wheel too; 0.4 … 2
  before); Rotate X, Rotate Y, ↻ and Lens stay sliders. Tried in the
  browser: a ring dragged by its band, its points as they were; ⇧ drag;
  X ↑ −400, two ↓ to −402; Size 1.5; ⌘Z.

- **NOLAN: figures — a second stays; the Circle (O); ⌘C ⌘V copies down**
  (the owner, 2026-10-05, `nolan-v2/Screenshot 2026-10-05 at 3.53.05 PM.png`:
  "when I make a second figure with the brush, the first disappears — it
  must stay"; "I need to draw circles: draw one and copy it down, ⌘C and
  ⌘V, I am on a Mac — can you make one more tool in Tools"). The tab holds
  figures now, objects as in Illustrator, not the one ribbon: each its
  points, band, place in space and cuts; the panel edits the picked one,
  framed dashed orange; a click on another picks it, a click on the picked
  one's body picks it whole, and ⌫ then takes the whole figure out. Brush
  and Circle add a figure with the panel's band, flat, facing you; a
  Brush stroke back to its start (within 20 mm) is a loop. **Circle** (O):
  press at the centre, drag to the radius — its width and ⌀ shown as it
  goes — a closed ring of 8 points; `centreOf` takes loops, the centre
  then the circle itself within 0.01 mm, every row a ring. **⌘C ⌘V**: the
  copy 10 mm under the picked figure, picked, so ⌘V again lays the next
  under it; ⌘X cuts; the arrows move the picked one 1 mm, ⇧ 10 mm. The run:
  N1 of every figure, figure by figure, then N2; the LCD names the figure.
  Figures do not hide one another; each its own over-and-under. A save of
  the one ribbon opens as one figure. Clear empties every figure. Tried in
  the browser: a migrated save, Brush, Circle, two pastes, a click to pick,
  ⌫, ⌘Z, the arrows, Layers, Imprint with INK ON, Uncut, PLAY's question,
  a reload.

- **NOLAN: Clear — the canvas empty, no ribbon** (the owner, 2026-10-05,
  `nolan-v2/Screenshot 2026-10-05 at 3.45.43 PM.png`: "I cannot clear the
  screen entirely, one tip is left" — ⌫ stopped at two points). Clear in
  the Tools, as Create's, after the ring; ⌫ on the last two points takes
  the whole ribbon too; ⌘Z brings it back. An empty canvas stays empty
  through a reload; Point's sliders hide; Brush or Pen paints a new ribbon
  from nothing, Pen's first point at the canvas's depth. TEST needs no
  ribbon: its dots are the board's. Tried in the browser.

- **NOLAN: Brush (B) — the ribbon in one stroke, flat** (the owner,
  2026-10-05, `nolan-v2/Screenshot 2026-10-05 at 3.07.42 … 3.09.39 PM.png`:
  "I cannot make it flat — they twist at once"; "how about a new tool in
  Tools, Brush — we have Pen P, it will be B — and with the brush only flat,
  no twisting into bundles by default. It is very hard with Pen; the lines
  are born twisted. Brevity is the sister of talent, and everything
  ingenious is simple"). Why Pen twisted them: at Rotate X −84° the screen's
  plane runs nearly along the ribbon's depth, so the points Pen put there
  climbed in depth and the band, flat in its own plane, turned edge-on and
  its back to you — Twist was 0. Brush: drag a stroke, the brush's width
  shown as it goes; let go, and a new ribbon lies along it — the canvas
  faced, Size 1×, Twist and Squeeze 0, the cuts as suggested, every point
  Depth 0 and Roll 0, the fewest points whose centre keeps within 3 mm of
  the stroke (`strokeAnchors` in `band.js`). The rows parallel, Row to row
  apart in true mm; a turn tighter than half the band folds, the red !.
  ⌘Z brings the ribbon before back (Twist and Squeeze in the undo now).
  Tried in the browser at the owner's view of 3.07 PM.

## v0.3 — 2026-10-05

- **v0.3 after the name** (the owner, 2026-10-05: "REMBRANDT v0.3
  already :)"), on every tab and in the saved SVGs.

- **NOLAN: no N1 · N2 · N3 keys — every layer runs** (the owner,
  2026-10-05: "remove the N1 and N2 keys; I do not press one first and
  then the other. These keys are not needed"). The layers run in their
  order, a pause between them as before; Auto, Uncut and Pass through fill
  the row. A layer switched off in a save of before runs again. **Canvas**
  stands off its fields as The brush off Brush on ("now it is pressed to
  Board width / Board height"). Tried in the browser.

- **Ink: the Cup's reading under the ⓘ, as The dip's** (the owner,
  2026-10-05: "let's do it so everywhere"): the cup's centre, its size and
  where the brush dips inside the walls behind the ⓘ of Cup; The canvas
  from the cup likewise. What needs doing stays out: the cup not set, too
  near the rim, no board. An empty reading leaves no gap. Tried in the
  browser.

- **NOLAN: the canvas from home, TEST's dots 20 mm in from the board's
  corners** (the owner, 2026-10-05, `adobe_ai/500x700_image_area.png`:
  "the test dabs at four edges, but the edges depend on the shape, and they
  must depend on the board's width and height"; "the canvas must not slide
  down under the image area, but lie on it"; "home in Calibration is the
  bottom left corner … the TEST points keep a 20 mm margin … so I can make
  the board 400 × 600 mm"). The canvas's bottom left corner lies from
  home — its bottom edge level with it, its left edge 50 mm to the right,
  **Left edge →** and **Bottom edge ↑** on the tab — and Board width and
  height grow it up and to the right: 500 × 700 at X 0 … 700, Y 50 … 550.
  Before, it was centred on the Test tab's Here (X 226.2 · Y 333.8), 124 mm
  past the bottom wall. `cornerDots` (`band.js`) takes the board's size:
  a dot `TEST_MARGIN` 20 mm in from both edges of each corner, round the
  board TL, TR, BR, BL, then home ("so a neat square is cut"; before, BL
  TL TR BR, at the corners of the drawing's box, and the way home crossed
  the square — the last TEST, 14:04, put them at X 21.8 … 538.1,
  Y 126 … 528). The board draws home and the four dots. **Canvas** heads
  the fields ("the word CANVAS is missing at the bottom"); the plan's
  reading goes under its ⓘ ("this text below we hide under (i)"), what
  stops PLAY stays out. The owner ran TEST at 14:55 on it: TL X 680 · Y 70,
  TR X 680 · Y 530, BR X 20 · Y 530, BL X 20 · Y 70, home; 32 s. In the
  canon, Rembrandt.md §1. A test.

## v0.2 — 2026-10-04

- **NOLAN: TEST before PLAY — a dot at each corner of the drawing** (the
  owner, 2026-10-04: "before pressing PLAY I would like to do a test. The
  brush in the bottom left corner; I press TEST and it dips in the paint and
  puts dots at the farthest corners, TL TR / BL BR. A TEST key next to PLAY,
  three in a row: TEST / PLAY / PAUSE"). One dip in the cup, INK ON or OFF;
  a dot, a stroke `DOT_MM` 6 mm (est.) from each corner of the box round
  what PLAY paints — the layers that are on — into it, from home: BL, TL,
  TR, BR; then home. The other three dots, shorter than `NO_DIP`, go on what
  the brush holds. `cornerDots` in `band.js`, then Test's run (`plotRun`)
  to `/run`, as PLAY: no new kind of block. The confirm names the corners
  in machine mm and any past a wall — its dot goes on the wall. The LCD
  reads TEST · BL … and the test's own time. 22:17: BL and BR at X −45,
  45 mm past the bottom wall; one dip, ≈ 35 s. Not run on the machine from
  here: planned in node, the keys seen in the browser. A test.

- **NOLAN: the grid every 100 mm, as on Calibration** (the owner,
  2026-10-04: "I see the image area, but there is no scale — add X 800 /
  Y 500, please"). Machine mm: X on the left, Y along the bottom, faint on
  the table, under the canvas; the board a little wider on the left for the
  names. Tried in the browser.

- **NOLAN: Pass through — nothing hides** (the owner, 2026-10-04,
  `machine/2026-10-04 nolan on paper.jpg`: "maybe let it run straight
  through? At the bottom, you see, a break again. Let's add a key after
  Uncut, Pass through"). A
  latch after Uncut: every row whole, over and under the other parts of
  the ribbon, as through glass; the cuts — Auto, Uncut or the owner's — as
  they are. 22:17 with it: 655 steps of 827. Kept with the ribbon. Tried in
  the browser. A test.

- **NOLAN: the image area on the board, as on Calibration** (the owner,
  2026-10-04, `machine/2026-10-04 nolan on paper.jpg`: "at the bottom there
  is no edge of the canvas; I do not see the image area. But it is on
  Calibration — can you carry it over, please"). The walls dashed orange
  and named, the canvas past them hatched; the board widens to take them
  in. The canvas of 22:17, centred on the Test tab's Here (X 226), lay
  124 mm past the bottom wall and 15 mm past the right one: the rows there
  ran along the bottom wall, the flat dark stripe of the photo. The wash of
  Imprint is pressed into the walls as the run is, and shows that stripe.
  Tried in the browser.

- **NOLAN: Imprint with INK ON — the watercolour as it lies on the paper**
  (the owner, 2026-10-04: "I would like to see on the screen a more exact
  drawing of what I paint with the brush on paper and canvas"; the photos
  with a ruler, `machine/photo_2026-10-04 21.43.54 … 21.44.15.jpeg`: "the
  line, as you see, is 4 mm"). The trace of 18:11 beside its plan at 4 mm:
  dark blots and hooks where the brush landed fresh from the cup; every
  stroke paler along its dip run; the left loop one wash, where the white
  between two wet rows was under 1 mm (the middle band, 1–2 mm, kept it);
  the pinches darkest. Now `washOf` (`band.js`) gives each stroke of the
  plan its strength — 1 after a dip, fading over `WASH_FADE` 350 mm (est.)
  — and its width, the row's, widened to its neighbour where the white is
  under `WASH_MERGE` 1 mm (est.); the board multiplies the strokes, as the
  paper does, in the cup's violet (est., by eye), a blot where the brush
  lands after a dip. With no canvas placed, no dips are known: the wash as
  fresh. `plotRun` marks the stroke after a dip on its preview; the blocks
  as before. Row width stays the owner's slider ("I can do it myself with
  the slider"): every run of the day had 1.5 mm. Tried in the browser on
  18:11 and 22:17 (the owner: "even the paint is like mine"). A test.

- **NOLAN: Uncut — no cuts, the ribbon one layer** (the owner, 2026-10-04:
  "what if we add an option Uncut and do not cut at all?"). A key after
  Auto in the N row: every row whole from end to end, broken only where
  another part lies over it; one pass, no pause for the dry. The suggested
  cuts of 18:37 lay on both pinches — every row ended there and the next
  layer landed there with a fresh dip. Uncut on 18:37: 88 pieces of 140,
  23–26 of 26 rows through each pinch (0 cut); the watercolour 83 dips,
  ≈ 24 min (113, ≈ 31 min); the paint with no pause. Kept as `cuts: []`
  with the ribbon; Auto brings the suggestion back, the Cut tool cuts it
  again. Tried in the browser: Uncut, N1 alone, Auto again, Imprint.
  Overlap is within a layer, so with Uncut a row goes on under every part
  over it — on the Paint run that part may still be wet. A test.

- **NOLAN: the rows run through a pinch — the band no longer hides its own
  rows there** (the owner, 2026-10-04, the trace of 18:11,
  `machine/photo_2026-10-04 21.43.54.jpeg`: "on the right the bundles did
  not come together into lines as in the drawing — the main flaw"; and "the
  intent was to print in four passes, but not to break the lines"). Where
  the ribbon twists, turns over or is seen end-on, its projection is a bow
  tie, and `imprintOf` took one side of it for a part lying over the other:
  at the pinches of 18:11 only 4 rows of 17 stayed in sight, 0 ran through.
  Now a piece of band nearer along the ribbon than the band is wide, with
  the band narrowed to 0.4 of its width between (`NECK`, est.), hides
  nothing; a part that went away and came back, or a fold facing you, hides
  as before. With the cuts off the pinches, rows through each: 18:11, 17
  and 17 of 17 (9 and 11 before); the save of 18:37 (26 rows), 25 and 23 of
  26 (8 and 11 before). A twisted band of 17 rows: 17 pieces, 43 before. The first
  run's ribbon keeps its four layers. Not yet: the suggested cuts still lie
  on the pinches (22 % and 77 % of 18:37) — every row ends there, the next
  layer lands there with a fresh dip, the puddles of the photo; until they
  are moved, the Cut tool drags them off. Tests.

- **NOLAN: the run's trace red on the paper, light blue in the air** (the
  owner, 2026-10-04, `machine/2026-10-04 orange.png`: "the orange way
  merges with Layers. I could set Geometry, but better make the way on the
  paper red, and light blue in the air"). Orange and grey before.
- **NOLAN: a red ! where the rows fold** (the owner, 2026-10-04: "turn the
  construction and there is a gap; on the 2D it must not be — the imprint
  must be smooth. I killed one point"; of the red "!" of NOLAN.md §3:
  "yes, a great idea"). `foldsOf`: where two or more rows run back against
  the ribbon on the canvas, the ribbon painted there — the rows a fold hides
  count too, for the gap is what shows. The board marks each with a red !,
  the reading says where and how many rows: move or take out a point near
  it. The save of 18:00 (14 points): five, the worst at the pinch top left,
  18 %, 6 rows — the puddle and the white of the last runs. Tried in the
  browser. A test: a hairpin found, a gentle turn not.
- **NOLAN: no white between the bundles — the strokes overlap** (the owner,
  2026-10-04, `machine/2026-10-04 Nolan-v3-both.png`: "any ideas how to fix
  it? If the brush goes in overlapping, even better — only not these awful
  white gaps; the small overlap in green is OK"; in blue "a break, though
  there should be none"). Three causes, three changes. **Overlap** (a
  slider, 0 … 10 mm, 4, est.): where a row goes under another part or comes
  out from under it, `layeredOf` carries its stroke on under it, within its
  layer, never across a cut. **The brush waits just over the canvas**,
  `ELBOW_HOVER` +12° (est.), before each stroke, not at +25°: the elbow was
  still coming down when the carriage set off, the lines began 5–10 mm late
  (`plotRun`'s `hover`, NOLAN only). **A dip's split laps 20 mm**
  (`DIP_LAP`, est.), not the 3 of Tail: the odd rows split at 360 mm ran
  dry before it. The last ribbon: 29.1 m, 68 dips, ≈ 19 min as before.
  Test's plans as before (18). Tests.
- **NOLAN: INK ON runs the layers one after another, no pause** (the owner,
  2026-10-04: "can the watercolour do all 3 layers at once, N1+N2+N3? What
  are the options — a non-stop key?"). Decided that morning (NOLAN.md §5:
  "all three layers can safely run together"), never built: no key needed.
  `bandPasses` gives the watercolour's layers no pause, `plotRun` pauses
  only where a pass says why. INK OFF, the paint, pauses for the dry as
  before. Each layer still starts with a dip. Test's plans as before (18).
  A test.
- **NOLAN: the lines go on — through a moment's hiding, across a cut, to
  their ends** (the owner, 2026-10-04, `machine/2026-10-04 Nolan-v2-details.jpg`:
  "the line breaks at the tips. Is it Tail too? Lower it to 10 or 8 mm?
  The line must go on"). Of the second ribbon's 83 pieces, 66 breaks
  inside rows: 34 at the cuts (a row visible there ended one point, 1.5 mm,
  before the next layer began), 17 hidden for under 10 mm (edge-on, a
  pinch), and every piece's end lifted ~7 mm early: the elbow went at the
  brush's speed, but the carriage stops at a piece's end and is slow there.
  Now `layeredOf` paints a row hidden for under 6 mm on the canvas through
  (`BRIDGE_MM`, est.), and a row parted by a cut gives both parts the cut's
  point; `onTheMove` paces the elbow by the carriage, at rest at a path's
  start and end (`ACCEL`), so it lifts at the end and not before. Tail
  3 … 20 mm, on Test too: at 3 the brush is fully pressed on 98 % of the
  ribbon, the elbow at 72°/s of 211. Test: 12 plans of 18 as before, 6 with
  slower W at their paths' ends (891 commands), the paths the same. Tests.
- **Test: Tail 10 … 20 mm too, 15 by default** (the owner, 2026-10-04: "on
  Test it can be replaced too"). `TAIL_MIN`, `TAIL_MAX` and `tailIn` in
  `strokes.js`, shared by Test and NOLAN; `DEFAULTS.tail` 15, 100 before. A
  Tail up to 200 kept in the browser or a Library save opens at 20. Tried in
  the browser: both sliders 10 … 20, an old 155 at 20.
- **NOLAN: Tail 10 … 20 mm, 15 by default** (the owner, 2026-10-04: "set
  it to 15, yes. Take it away past 20 mm altogether, it is not needed, so
  there is no temptation"). Every run of the day had Tail 155 mm: the
  elbow eased the brush down and up over 155 mm at each end of a piece, so
  on the last ribbon it was fully pressed on 30 % of 28.9 m — the lines did
  not reach, no shape closed (`machine/2026-10-04-test_on_paper.png`,
  `-test_both.png`); at 15 mm on 92 %, the elbow at 143°/s of 211. A save
  with a longer Tail opens at 20. Test's Tail as it was.
- **NOLAN: the cuts are a tool, Cut (C), the scissors in the Tools** (the
  owner, 2026-10-04: "maybe move the scissors into TOOLS on the left?").
  With it the cuts and the stretches' names show in any look; a click on
  the ribbon cuts it, a circle drags along it, ⌫ or the bin takes the picked
  one out. The points' squares stay away meanwhile. **Auto** in the N row
  brings the suggestion back (✂ there before). Tried in the browser.
- **NOLAN: the layers are stretches of the ribbon, cut along it** (the
  owner, 2026-10-04, `machine/layers selected.png`, `layers how to
  cut.png`: "continuous bundles, where the line goes naturally … I do not
  know how to cut it in code — can we?"; Claude in chat agreed). Not by
  depth any more: N2 came in patches where the ribbon lies over itself.
  `band.js`: `cutsOf` suggests the cuts — where the ribbon hides behind
  itself, turns over or edge-on, so a layer's edge is the line where it goes
  under; `stretchesOf` paints a stretch after every one it lies over;
  `layeredOf` gives the imprint in its layers; `imprintOf` says what hides
  what and how many rows show at each place; `layersOf` is gone. The tab:
  on Layers, each cut a dashed line and a circle — dragged along the
  ribbon, a click on the ribbon adds one, ⌫ takes it out, ⌘Z; each stretch
  named where it lies; ✂ by the N keys brings the suggestion back; the
  cuts kept with the ribbon. Layers N4, N5 coloured. The first run's
  ribbon: cuts at 20, 54, 75 % — the owner's four bundles, ≈ 7 m each.
  Tried in the browser: dragged, added, taken out, undone, ✂. Test's plans
  as before (18). Tests.
- **NOLAN: N1 · N2 · N3 keys, as D1 · D2 · D3 on Test** (the owner,
  2026-10-04: "let's take N1 and N2 now. I do not see the keys as on TEST";
  earlier, of PLAY's question: "it says N1 and N2 — how to part them?").
  A key for each layer the imprint has, above INK: one, two or all, run in
  their order, a pause between them, the last one stays on; kept with the
  ribbon (`off`). A layer off is faint on Imprint and Layers, "(off)" in
  the reading; PLAY's question and the LCD count the pieces that run. The
  LCD reads the blocks PLAY sent, as the trace does. Tried in the browser:
  the first run's ribbon, N1 off — N2 alone, 495 steps of 1664.
- **NOLAN: no dip before a piece under 75 mm**, 50 before (the owner,
  2026-10-04: "50 mm without a dip works. Let's raise it to 75 mm — it
  should go faster still. The trace is quite clear"). The first run's
  ribbon: 139 dips of 276, ≈ 42 min.
- **NOLAN: a layer starts on its first piece of 50 mm or more**, with its
  dip, the others after it in their order: a full brush never lands on a
  dot (the drops of 2026-10-04 13:38, four rows' dots, four puddles). N2 of
  the first run began on a 21.8 mm piece. NOLAN only (the owner: "no, only
  in NOLAN, thank you"); Test's plans as before (18 compared). 166 dips,
  ≈ 45 min. The test runs the pieces in the order sent.
- **NOLAN: no dip before a piece under 50 mm** (the owner, 2026-10-04: "a
  stroke under 50 mm — do not dip in the paint, work with what is on the
  brush. It should be enough. Even if the paint runs out, I will see it by
  the density of the other lines"; before a dot under 1 cm the dip "just
  pours water, and there is a puddle"). `NO_DIP` in `band.js`, `noDipUnder`
  for `plotRun`, asked by NOLAN only; a layer's first piece dips all the
  same. The first run's ribbon: 167 dips of 276, ≈ 46 min of 60. Test's
  plans as before (18 compared). A test.
- **The repo is public** (the owner, 2026-10-04: "I opened it for Claude in
  chat. You may push, I allow it, and leave it public"). README's working
  rule and NOLAN.md say so; nothing is pushed without his word still.
- **NOLAN: the run's trace grey in the air, orange on the canvas** (the
  owner, 2026-10-04: "the trajectories are unclear — the lines from the cup
  through the air and those the brush painted are all orange; I would leave
  grey what went through the air"). The board does not say, inside a block,
  whether the brush is down, so the run's own blocks do: a piece with paint
  is orange, a travel, the dip, the arm, home are grey; the colours part
  where the plan lands and lifts the brush, and a piece run between two
  pings (22 mm is 0.16 s) is drawn from its start to its end.
- **The run never presses a sliver into the walls — the brush ran along all
  four, through the cup** (NOLAN's first run, 2026-10-04 12:58; the owner:
  "the brush goes past the canvas and does not lift; it does not see the
  cup and nearly knocked it to the floor. I switched the machine off";
  "an exceptional blunder — the machine nearly killed itself"). The tails'
  cuts left arcs whose ends meet, and `sweepOf`, as the firmware, takes such
  an arc for a full circle, up to 1.1 m across. `plotRun` left slivers out
  only after `pressed`, which had already cut the circles at the walls into
  lines along them: in 236 of 276 pieces, 22 mm of ribbon became up to 7 m,
  the elbow at 0°; steps 16, 40 and 64 ran along the left wall at Y 0, where
  the cup stands (the "215.3 m past the walls" of the PLAY question). The
  same fault as Test's D1 of 2026-10-03 14:49; the fix of 4d0dfae put the
  filter in the wrong place. Now `pressed` never presses a sliver: inside the
  walls it stays and is not sent, past them it is a point, its W riding on.
  The run's plan is 26.5 m with the brush down, pressed only along the
  bottom wall (1.5 m, the Test tab's Here; measure the canvas from the cup).
  **A guard**: the plan checks every row — the tails never change its
  length, the board is never sent more than was drawn, every piece runs on
  the board as long as planned, taken as the firmware takes it from where
  the carriage stands; otherwise `fault`, said in red, and PLAY refuses, on
  NOLAN and Test. Test's commands byte for byte as before (18 plans; two
  near the walls carry one `painted` mark a piece sent now, as
  `rembrandt.py` counts them). Tests: this run, and a plan longer on the
  board than drawn refused.
- **Calibration: Home at the top; Ink: The dip at the top, its text under
  ⓘ** (the owner, 2026-10-04: "put the HOME button at the top — it is
  awkward to scroll down every time"; on Ink, of the dip's explanation: "it
  makes noise, it is hard enough to work as it is — I know it anyway"). The
  dip's numbers stay in their fields; its warnings stay in sight.
- **NOLAN: the elbow's 211°/s, as it is** (the owner, 2026-10-04: "we leave
  it as it is and do the first test"). Of the 92 visible pieces 33 are
  shorter than 40 mm, the shortest 4.6 mm; at 150 mm/s the elbow lands and
  lifts the brush in time only on a piece from about 22 mm, and lags on a
  shorter one. Not slowed down, nothing left out: the first test shows what
  it does. NOLAN.md §3; no code changed.
- **NOLAN: INK shows the cup, as on Test** (the owner, 2026-10-04: "the INK
  switch does not work — it must be as on TEST, so the target shows where the
  cup of paint is"). The canvas lay only from the cup's two ruler numbers,
  and `ink.json` has none yet: no Here, no scope, no dips. Now, as the Test
  and Ink tabs do, the Test tab's own Here until the canvas is measured from
  the cup; the cup's red scope, home and the brush's way in the air drawn
  whenever INK is on. With that Here the 500 × 700 canvas reaches 124 mm
  past the bottom wall: 16.2 m of the rows would be pressed along it. More
  than 50 mm past the walls is said in red now, and PLAY asks.
- **NOLAN: one Roll on the panel — the band's lever is Squeeze** (the owner,
  2026-10-04: "why do we need a glossary, if the panel has two Rolls? That
  is unprofessional, it does not happen"; "the second one — Squeeze?"). Roll
  is a point's alone. Squeeze presses the whole band towards edge-on (+,
  the bundles close up) or flat (−, they open): tan(roll) over (1 −
  Squeeze), so a slanted place moves most, a flat one stays flat, and
  nothing jumps where the roll passes flat — a first try towards "the
  nearest edge-on" left a step there. The band's Roll kept from before goes
  into every point, so the ribbon keeps its shape; the prototype's "Roll,
  all" too, when a shape is pasted. Glossary and tests.
- **NOLAN: the Roll sliders move again** (the owner, 2026-10-04: "the ROLL
  slider does not move"). Roll is the band's and a point's both, and the
  panel found every slider by its name in the whole page: the band's Roll
  was set back to the picked point's on every step where a slider takes no
  focus (Safari), and the point's showed nothing. Each slider is now looked
  for in its own box; both drag in WebKit.
- **No slivers to the board, for Test too** (the owner, 2026-10-04: "all
  correct! Of course, no need to send such noise to the board"). `plotRun`
  leaves out every piece under 0.05 mm (`MIN_PIECE`), a W before one riding
  on the next: the firmware takes an arc ending where it starts for a full
  circle. Test's plans change only where such pieces were — of six compared,
  the D1 with INK ON (28 arcs ending where they start) and the C with Wave
  and Bow (24 under 0.05 mm); the other four byte for byte as before. A test.
- **NOLAN: the one ribbon in 3D, on the tab** (the owner, 2026-10-04: "yes,
  that is it — it can go into NOLAN"; "the words from TEST: ROWS first, ROW
  TO ROW and so on; and TAIL"). `src/band.js` and its tests: the ribbon
  through IMG_9424's 17 points (and the ring), the band with its rows and
  stack, the construction turned, the imprint with the near covering the
  far, the layers N1, N2 by depth, each visible piece fitted into lines and
  arcs within 0.1 mm, a dip every 720 mm with INK ON (est.). The tab: the
  ribbon turned with the mouse, points moved and added with Create's Tools;
  Geometry · Colour · Layers · Imprint; Rows, Row to row, Row width, Stack,
  Twist, Roll; Rotate X, Rotate Y, ↻, Size, X ↑, Y →, Lens; a point's Depth
  and Roll; Brush on, Between rows, Tail — the tails thinning on the
  Imprint; Paste a shape from the prototype. PLAY runs it with Test's run,
  layer by layer, a pause between. The flat ribbons of the morning
  (`src/ribbon.js`) are gone.
- **strokes.js: no slivers for NOLAN.** A tail's cut can leave a piece a
  thousandth of a mm long, and the firmware takes an arc ending where it
  starts for a full circle (`path.h`). `plotRun` leaves such pieces out when
  asked (`minPiece`, 0.05 mm), a W before one riding on the next; NOLAN asks.
  Test's plans byte for byte as before, until the owner's word: its journal
  holds one such arc (D1, 2026-10-03 14:49, pressed into the bottom wall).
- **NOLAN in 3D: one ribbon, imprinted — a prototype and the decision**
  (the owner, 2026-10-04: the parallel lines "stand like idols, a rake";
  "let's make one construction that turns, something like IMG_9424").
  `previous_research/nolan_3d_prototype.html`: one flat band along one
  curve in space through IMG_9424 — the curl, the arch, the big band in
  front, the fold, the lower loop into its vortex — 17 points with their
  depth and roll; the whole turned with the mouse; the canvas its imprint,
  the near part covering the far; the layers N1, N2 from depth; red where
  the lines lie closer than the brush; the back darker, for the glazes; a
  ring as a second blank. It replaces the same day's three rings. The
  chat's prototype beside the pictures, `nolan-images/nolan-band-prototype.html`.
  NOLAN.md §3.0 and the glossary: the model, and "the machine still gets
  flat lines and arcs: 3D lives only in the drawing".
  The prototype keeps the points and the settings in the browser, and
  "Copy the shape" hands them over as text.
- **NOLAN built on Test** (the owner, 2026-10-04: "Stop. We are copying
  CREATE, which did not work for us. Let's go back to TEST as the base.").
  Test's board — the canvas from the cup, the table round it, the run's
  trail — PROGRESS with the LCD and the sun and the moon, PLAY · PAUSE ·
  STOP · HARD STOP; 💾 SAVE NOLAN (with the tests in the Library, which
  opens it on NOLAN); INK OFF · ON under it — OFF the Paint run, each
  ribbon a snake, the brush up through the turns; ON the Watercolour run,
  a dip in the cup before every line, one way. Test's sliders: Rows (the
  lines across a ribbon), Row to row, Wave, Brush on, Between rows, Tail;
  Board width · height; Lift at the turns. Test's pattern keys not drawn
  yet ("do not draw the buttons for now"). From Create the Tools on the
  left, the three ribbons by default, the house; the second row gone. The
  run is Test's own (`plotRun`): the elbow lands and lifts on the move,
  the walls press the path, home at the end; N1, N2, N3 a pause between.
  The ribbons now keep to the canvas's centre, so they stay put when the
  board's size changes; the drawings of the first draft are not carried
  over.
- **strokes.js: the run of the paths apart from Test's patterns**
  (`plotRun`), for NOLAN to run its ribbons the same way (the owner,
  2026-10-04: "let's go back to TEST as the base"). Test's plans come out
  byte for byte as before (six settings compared, INK ON and the walls
  among them).
- **NOLAN opens with the owner's three ribbons** (the owner, 2026-10-04: "I
  would start these three ribbons by default"). His green paths of
  `nolan-images/IMG_9424-N1_N2_N3_paths.webp` — the sketch is IMG_9424 at
  0.7475, 238 px down, found by matching the two — as lines and arcs on
  the 500 × 700 canvas: N1 the upper arc (12 lines), N2 the lower loop
  (12), N3 the middle ribbon (14). N1's hook is wider than the sketch's:
  96 mm of lines turn no tighter than 48 mm, and the canvas ends at 500.
  No bend marked "!", every line on the canvas (a test). The tab opens with
  them when it keeps no ribbons; the house brings them back.
  And a round × on the reference's picture takes it away (the owner:
  "a little circle with a cross in the top right corner is enough").
- **previous_research: the chat's NOLAN prototype** (2026-10-03, added by
  the owner on 2026-10-04: "primitive"). Kept as history: its look — dark
  lines with a groove, the centre dashed orange, squares to drag — went
  into the Geometry step; its Catmull-Rom curves, widths per anchor and
  twist did not.
- **NOLAN: Geometry, the first step** (NOLAN.md §2, §3; the owner,
  2026-10-04: "yes, start!"). The ribbons' centres drawn with Pen and Arc
  as the curve on Create — a click on a ribbon's end goes on with it,
  elsewhere starts the next N; Select drags a ribbon or its squares. The
  width a count of 8 mm lines for the whole ribbon (`96 mm · 12 lines`,
  [ and ]); the lines dark grey on the white canvas, a 1.5 mm groove
  between them, the centre dashed orange. Every kink is rounded for the
  whole width (`filleted`, the inner line on the inner corner radius) and
  the lines are `offsetSegs` of it (`src/ribbon.js`, its tests); a bend
  still too tight is marked "!". N1 · N2 · N3 in the panel, dragged into
  a new order. The reference fits whole inside the canvas, kept apart from
  Create's. Palette is the next step.
- **NOLAN.md: the dip run 720 mm (est.), the canvas from the cup** (the
  owner, 2026-10-04: "I think all 720 mm will go easily; the photo shows
  well it is not the limit" — 330 mm measured with paint to spare). The
  canvas lies by the Ink tab's two ruler numbers, as the Test board. Every
  question of NOLAN.md §8 is answered.
- **NOLAN: all the drops of a layer before PLAY** (the owner, 2026-10-04:
  "yes, all correct"). The brush goes line by line through them, no pause
  between tubes, as in `references/preview.webp`; stage by stage and the
  lighter tube first stay the rules of the other tabs (Rembrandt.md §1).
- **NOLAN.md: a line changes tube along the ribbon** (the owner,
  2026-10-04), as the strands of IMG_9424 and Florian Markus's drops
  (`references/preview.webp`): a drop at the start of every stretch, the
  brush dragging each into the next; Palette shows the drop map. Hence the
  full trace — "definitely the full trace in watercolour".
- **NOLAN.md: the Watercolour run traces all the lines** (the owner,
  2026-10-04: "I need all the lines, or I will get lost"). Edges stays on
  the switch as the faster trace.
- **Photos: the first wash from the cup** (2026-10-03, added by the owner
  on 2026-10-04): `machine/photo_2026-10-04 01.29.23–25.jpeg`, the run of
  13:30 in the journal — D1, 14 rows of 330 mm, INK ON, 14 dips, a red
  wash. Every row reaches its end on one dip, paler into the tail. And
  `machine/2026-10-03 rows.png`, which the Rows to 200 line names.
- **NOLAN in Create's place; v0.2 after the name** (the owner, 2026-10-04:
  "I would hide Create for now"). The top row of every page reads
  REMBRANDT v0.2, then NOLAN · Job · Test · Ink · Adjustments ·
  Calibration · Library. `nolan.html` says the tab is being built;
  `start.command` opens it. Create's page stays, and the Library still
  opens a painting on it. A saved SVG says v0.2.

## v0.1 — 2026-10-01 … 10-04

- **The owner's decisions for NOLAN, in the spec** (`NOLAN.md` §0). The
  ribbon collection comes first; NOLAN is the one tab where the hand
  paints too — the black around the ribbons, the glazes in glazing medium,
  the airbrush glow (the owner, 2026-10-03: "Who said the machine has to
  do everything?"); Create hidden and NOLAN in its place, v0.2 next to the
  name (2026-10-04: "It just isn't working — a pile-up of colours");
  Test's pattern D is for the style of `nolan-images/Untitled-7.png`.
- **NOLAN.md: the task for the NOLAN tab, and its pictures** (written
  with the owner in chat on 2026-10-03, corrected in VS Code on
  2026-10-04). `nolan-images/`: `IMG_9424.jpg`, the ribbon render NOLAN is
  made for, the owner's N1 · N2 · N3 paths over it, his AI tries, and
  `Untitled-7`/`-8`, the style of Test's pattern D ("Untitled-7 is
  directly tied to Test, D1 / D2 / D3"). The corrections: a ribbon is
  8 mm strokes one way, one width for the whole ribbon, no twist and no
  pinch; the ribbons N1 · N2 · N3, so as not to be taken for Test's D;
  the modes Geometry · Palette; the Watercolour run traces all three
  first. In git since the repo went private again (the owner, 2026-10-04).
- **Test: Rows to 200** (the owner, 2026-10-03, `machine/2026-10-03
  rows.png`: "now 40, I want 200 — in case the format is 500 × 700, or
  700 × 1000"). The plan's boxes were `Math.min(...points)`, out of stack
  past about 100 rows of 600 mm: a loop now. The board draws a stretch of
  one width as one stroke, and a slider plans once a frame, so 200 rows
  still move under the hand.
- **Test: INK named as the sliders, OFF · switch · ON** (the owner,
  2026-10-03: the green INK ON "stuck to the A B D row"). The switch lower,
  named INK in the sliders' small capitals, as Rows and Row to row; OFF to
  its left, ON to its right, the one in force in ink, either pressable.
  "A dip in the cup before every row" gone from beside it. Then ("the
  button is wonderful"): INK and OFF · switch · ON on one line, the name
  left, the switch right, as a slider's name and its number.
- **The first runs with the cup** (the owner, 2026-10-03: "tested, all
  fine"; "everything works great, thanks"). The cup taped down by the left
  wall, taken at X 390.18 · Y −0.37 (`app/ink.json`), the elbow +34° over
  the rim and −3° in the cup — in the reserve: the paint lies lower than
  the canvas, until the cup sits level with it. D1 with INK ON, 14 rows:
  14 dips, every row top to bottom, back to the cup, home; 218 s against
  209 estimated. Then D1, 20 rows, INK ON: 334 s against 317; D2, 20 rows:
  95 against 93; D1, 23 rows, pressed 2 mm into the bottom wall: 84 against
  78 (the run journal).
- **Test: the walls press the path, no more refusal** (the owner,
  2026-10-03, D1 without the cup: "remove this restriction — The brush
  would go 2 mm past the bottom wall"; D2 fitted). The board takes no piece
  past a wall, so dropping the page's check alone would have stopped the
  run mid-row. The rows are pressed into the walls as the Job tab presses
  a job: what lies past one runs along it, a straight line, the elbow's
  `W` kept; a row wholly past one across it is left out. The page says how
  many mm, as a hint. `lineCuts` and `arcCuts` exported from `machine.js`.
- **The cup a hair past the wall: the brush dips just inside it.** The
  owner's first cup, taken at 13:13, X 390.18 · Y −0.37, lies 0.37 mm past
  the left wall, and the board takes no path past one: the first dip would
  have stopped the run. The brush dips at the nearest point 0.1 mm inside
  the walls, 0.47 mm from the centre; a cup more than a quarter of its
  ⌀ past them is refused, and the Ink tab says so.
- **The canvas from the cup: Here found, not aimed at** (the owner,
  2026-10-03: "I do not see where the centre of 500 × 700 is, there is no
  laser"; "a great solution, much handier"). On the Ink tab two ruler
  numbers from the cup's centre: the canvas's left edge, mm to the right,
  and its bottom edge, mm down. The Test tab lays its board from them and
  takes its centre for Here; its Here key shows only until both are
  typed. The Ink tab draws the canvas there too.
- **Test: INK ON — a dip in the cup before every row** (the owner,
  2026-10-03: "PLAY: the machine goes to the cup first, dips the brush
  right in the centre, then paints D1. 14 passes, so the brush dips 14
  times, each before a line top to bottom. Then not up but back to the
  cup; at the end home"). A green switch under the pattern keys; OFF is
  every test as it was. ON: to the cup over its rim, `J 2` into the
  paint, a `wait` of 1 s, up; to the row, down to +25° in the air, the row
  as before; back over the rim. C's and D's rows one way each, top to bottom
  on D1, no turns, no pause. The board draws the cup's red scope, the way
  in the air dashed, home, and the carriage's trail during a run. PLAY
  refuses without the cup's centre. D1 at 14 rows: ≈ 3.4 min (est.).
- **Ink: the jog of Calibration, and a scope for the cup** (the owner,
  2026-10-03: "what do I move the machine with? add me the sliders from
  Calibration"; "and a target for the cup, I will aim there"). X and Y as a
  throttle, the elbow 1° a step, STOP and HARD STOP, Esc (`src/jog.js`, a
  copy of Calibration's jog, which keeps its own). The cup drawn as a red
  scope, ⌀ to scale; until its centre is taken, dashed at X 400 · Y 0, est.
  — the owner's sketch — and the carriage says how far it is from it.
  **Over the rim ← elbow** and **In the cup ← elbow** take the elbow's angle
  where it stands.
- **rembrandt.py: a wait block** (2026-10-03, for INK ON on Test; the owner:
  "1 second is perfect"). `{"kind": "wait", "s": 1}`: everything stands that
  long, the brush in the cup's paint; the runner pings meanwhile, so STOP
  gets through. 0…10 s, checked before anything moves.
- **Ink, a new tab between Test and Adjustments** (the owner, 2026-10-03:
  "maybe one more tab, INK"; "just INK, it is clear anyway"). Where the
  brush takes its paint: one cup, ⌀50 and 20 mm high, by the left edge of
  the canvas. **Here: the brush is over the cup's centre** takes the
  carriage's place, as Here on Test; the elbow over the rim (+35°) and in
  the cup (+5°) est. until typed, 1 s in the paint. The machine from above
  with the cup, home and the Test board; `app/ink.json` through
  `rembrandt.py` (`/ink`, as `/tubes`). The page moves nothing.
- **The first painting of the new arm** (the owner, 2026-10-03, 01:11: "It!!!
  Not for nothing we tested all day. Beauty"; `test_results/IMAGE
  2026-10-03 01:11:11.jpg`). C, 13 rows, then D1, 14 rows, crossing in a
  plaid of blue watercolour: 7 and 6.5 mm apart, 210 mm long, bow 20, wave
  5, at 200 mm/s, Tail 80, Lift at the turns. Every row lands softly and
  runs out in a fine point where the elbow eases off; no flag, no dark band,
  no blot at a turn; the grooves between the rows hold. 38 and 41 s against
  37 and 39 estimated (the run journal). The slow crawl and the odd Y of
  the check before did not come back: it was most likely that check's own
  look at the arm ten times a second.
- **The elbow's zero raised 4.7°; −5…0° the reserve** (the owner,
  2026-10-03, after midnight: "I overdid it, +4.7° presses it too hard into
  the canvas — knock it down to zero"; "+4.7° is the fuel tank, remember?
  The reserve you may use, but better not"). `calibration.json` elbow 3008;
  the lift-off, +15° from the first zero, is +10° now (`ELBOW_LIFT_DEG`,
  `ELBOW_LIFT`); the old zero lies in the reserve, at −4.7°.
- **Test: the elbow lands and lifts the brush on the move** (the owner,
  2026-10-02, night: "on the move — the tail a smooth easing of the
  pressure, no stops"; "let's work properly"). Over the first and the last
  Tail mm of a row the elbow goes from the lift-off (+15°) to pressed (0°)
  and back on a half cosine, a `W 2` every 16 mm; through a turn it goes up
  to +25° (est.) and down to the lift-off by its end. No carriage aside,
  no wrist: the wrist stands at 0° (a `J 3 0` before the first row, in the
  air). **Lift at the turns** replaces Wrist at a turn: off, a snake's turns
  are painted too; a test saved with the wrist at ±45° or more opens with
  it on. The last D2 + D3 would take about 4.3 min (est.).
- **rembrandt.py: the brush on and off by the elbow** (the new arm). A run's
  `J` and `W` name their joint, 2 the elbow or 3 the wrist, each checked
  against its reach; the brush is on the canvas below the elbow's +15°;
  Pause lifts it to +25° and Continue puts the elbow back where a `W` had
  left it; `/brush/off` and `/brush/on` turn the elbow. A job that puts the
  brush away with the wrist (−54°, the Job tab as it is) is refused: it
  would only turn the brush on the canvas now.
- **Firmware: `W <j> <deg> [<deg/s>]`** — the elbow on the path too, not
  only the wrist (2026-10-02, built and host-tested, to be flashed).
- **Calibration: the wrist's scale every 30°** (the owner, 2026-10-02:
  "why a +80 on its own next to +90 — forgot it? Let it be −90, −60, −30,
  0, and the same to the plus"): −120 · −90 · … · +90; the shoulder and
  the elbow keep 15°.
- **The wrist −120° at most** (the owner, 2026-10-02: "cut it to −120°
  max, no need for −180"). `REACH` −120…+90°, the handle too.
- **The elbow −5° at most** (the owner, 2026-10-02: "−5 max, or it tears
  the canvas or breaks the brush"). `REACH` −5…+45°, the handle too; a
  move past it is refused before anything is sent.
- **The wrist to +90° at most; where the brush leaves the canvas** (the
  owner, 2026-10-02, night: "cut the WRIST boldly to +90°, no further —
  that is the limit"; "the angle for painting, when it lifts off, is +60°,
  but mind that gives us the broom again"; "the elbow lifts off at +15°").
  `REACH` −180…+90°, the handle too; `ELBOW_LIFT_DEG` 15 and
  `WRIST_LIFT_DEG` 60 in `rembrandt.py`, measured.
- **The new arm's working pose: zero is the active mode** (the owner,
  2026-10-02, night: "zero is the active mode, the brush pressed to the
  canvas", the arm perfectly straight, `machine/IMAGE 2026-10-02
  machine-active mode.jpg`). All three joints read 0° there
  (`calibration.json`, "arm": 3119 · 3062 · 2546). The wrist's reach is
  now −180…+130° round it, the servo's own ends: +180° from the old zero
  was +309° past this one. The elbow: 0° pressed, plus up, minus harder
  into the canvas.
- **Calibration: the wrist to +180°** (the owner, 2026-10-02, the new arm:
  "give me the WRIST slider more to the plus, to +180 — there is nowhere to
  grip on the left to lower the brush, bristles to the canvas"). `REACH`
  −90…+180°, the handle and its scale too; the handle itself had still
  stopped at +10°, the camera's limit of 2026-09-30, while its scale read
  +60. A move past the firmware's 150° step goes in two.
- **The new arm's signs** (the owner, 2026-10-02, on Calibration: "you
  guessed the shoulder, even minus and plus"; "in the ELBOW swap minus and
  plus — at −19.8 it goes up"; "the WRIST says +9.4 — it lies, that is its
  +60; keep the scale, knock the +9.4 off"). The elbow's plus is up now
  (`TURN` in `rembrandt.py`, −1); the wrist's zero is set so that pose reads
  +60°. The shoulder's handle: plus, the brush goes right.
- **Calibration: the shoulder's and the elbow's handles back** (the owner,
  2026-10-02, the same night: "I only see WRIST — bring the sliders back, I
  have nothing to turn them with"). Which way each plus goes is to be found
  on the machine, 5° at a time. The new servos, ids 14 and 15 from the
  factory, are 1 and 2 now (`I`), the wrist kept 3. The arm's zero in
  `calibration.json` is, for now, where they stood after power-on — under
  the old servos' zero the handles read +59° and +70°, and one pull could
  have driven the elbow 100° into the canvas; the working pose is to be
  taken.
- **Firmware `B` and `I`: the servo bus scanned, an id changed** (2026-10-02,
  the new ST3235s: with the 12 V on only id 3 answered, 1 and 2 were silent).
  `B` lists the ids that answer, 0…253, nothing moving; `I <from> <to>`
  writes a servo's new id to its EEPROM, refused if `<to>` answers already.
  `rembrandt.py`: `/machine/scan` and `/machine/servo-id?from=&to=`. Built
  and host-tested, to be flashed with `W`.
- **Calibration: the shoulder's and the elbow's handles gone** (the owner,
  2026-10-02: new ST3235 servos, the elbow remounted to lift the brush up —
  "they no longer exist, throw them out"). The wrist's stays; its zero is
  the old servo's until the working pose is taken again.
- **Test: the brush lands and lifts on the move — (a) + (b)** (the owner,
  2026-10-02, after D2 + D3: "the brush starts to lift while the carriage
  still runs out the row"; "a + b, let's test"). Before, the carriage stood
  at every turn while the wrist lifted and landed the brush — 5.4 s a turn,
  and the tip dragged 50 mm across the rows' ends: the flags, the dark band
  in `test_results/photo_2026-10-02 D2+D3 final.jpeg`. Now a pass is one
  move. Over the first and the last **Tail** mm of a row (100 by default, a
  new slider) the wrist goes between upright and ±45° on a half cosine, and
  the carriage moves the other way along Y as it does, so the tip keeps to
  the row — a tail along it, the brush lightening; through a turn the brush
  is in the air, the carriage 50 mm aside. The wrist goes by place: a `W`
  rides on every 16 mm of a tail, and the board turns it as the carriage
  gets there, whatever the speed or a pause. The tip keeps the brush's
  speed in a tail, the carriage faster or slower as its way there is longer
  or shorter; a tail grows where the wrist would not keep up (211°/s at
  most). The preview draws the tip, thinner in the tails; the walls check
  takes the carriage's way. The time comes from the board's planner run on
  the page: about 5 min for the last D2 + D3, which took 10. Until the
  flash, the board answers `W` with "?" and nothing moves.
- **Test: Brush on and Between rows to 250 mm/s** (the owner, 2026-10-02:
  "at least 250 — we are testing"), the firmware's new most. On a wavy row
  the board's queue of 16 short pieces holds it nearer 170 mm/s.
- **Test: Turn hidden on C and D** (the owner, 2026-10-02: "it only takes
  room"): there the turn is the row to row.
- **rembrandt.py: `W` through the runner** (the owner, 2026-10-02: "I allow
  changing the runner"). A move with `W` lines takes the wrist's zero where
  it stands (`Z`, before any piece is queued) and sends RUBENS's degrees as
  steps from it; a pause or a stop in a tail finds the wrist as the last `W`
  on a piece the carriage reached left it, lifts from there, and Continue
  goes on with the `W`s still to come; a `W` past the reach is refused
  before anything moves. The wrist's step limit 150° (was 90), as the
  firmware's. A wrist angle in tenths no longer breaks Continue.
- **Firmware: `W`, the wrist on the path; F and T to 250 mm/s** (2026-10-02,
  built and host-tested, not yet flashed). `W <deg> [<deg/s>]` rides on the
  next piece queued; the planner gives it out as the point reaches that
  piece, and the board turns the wrist when the motors get there (the
  planner runs 120 ms ahead). Up to 211°/s with the servo's acceleration at
  150 (est.; `J` keeps 53°/s and 30). K drops the turns waiting, Z and a
  `J` off a path too. The wrist's step limit 150°: from −90° to +60° in one.
- **Test: the time from the run journal.** The two D2 + D3 runs of
  2026-10-02 took 338 s and 602 s, the pauses aside, against 239 s and 338 s
  estimated: a turn took 3.8 s at ±10° and 5.4 s at ±55°, not 2. A turn is
  now 3.4 s plus the wrist out and back at 55°/s (est.); both runs come out
  within 4 s — fitted on those two, so the next runs will tell.
- **Test: the brush drawn 3.5 mm wide, not 10** (the owner, 2026-10-02,
  `test_results/IMAGE 2026-10-02 19:20:53.jpg`: "Row to row is 4.5 mm and
  everything ran together, though the photo of the real strokes has
  grooves. I would make it thinner"). On the canvas rows 4.5 mm apart left
  grooves of about 1 mm (`IMAGE 2026-10-02 17:12:24.jpg`,
  `photo_2026-10-02 D2+D3.jpeg`), so the trace is about 3.5 mm (est.,
  `BRUSH_MM` in `strokes.js`); the preview and the test's SVG draw it so.
- **Test: at 100 % the carriage goes home** (the owner, 2026-10-02, after
  D2 + D3 stopped over the board's centre:
  `test_results/photo_2026-10-02 D2+D3 final.jpeg` — "when the operations
  are over, 100 % done, let it drive off to the corner where home is set;
  then Play / Pause have their match not only on the screen but in the real
  world"). The last move, the brush off, goes to the corner of the walls by
  the home stops, 0.1 mm inside, as a job ends (`homeCorner` in
  `machine.js`); before, it went back to Here. The LCD says so meanwhile.
- **Test: PLAY, and one key for Pause and Continue** (the owner, 2026-10-02:
  "put Continue in one row with Do Test, grey too; call Do Test PLAY; Pause
  and Continue are one key with two states — when the machine has run its
  part, Pause goes down by itself and says Continue; four keys in two rows,
  not five in three"). PLAY · PAUSE, then • STOP · •• HARD STOP. The run
  waiting — paused by hand, or by the plan between D's passes — the key is
  down, dark, CONTINUE; idle, it is greyed.
- **The run journal, and a pause you cannot miss** (the owner, 2026-10-02,
  after D2 + D3: `test_results/IMAGE 2026-10-02 17:12:*.jpg`). The run had
  painted D2 first — in black, the paint on the brush — and stood paused at
  50 %, "D3, dark grey: its paint on the brush, then Continue"; the pause
  showed only in a small line. Now, paused, the LCD's last line says what
  to do, whole, and Continue is lit dark until pressed. And "maybe keep
  logs, a journal of the settings?": `rembrandt.py` appends a JSON line to
  `app/logs/runs.jsonl` (on this Mac, not in git) at each start — every
  setting of the Test tab, Here, the estimate —, each pause and Continue,
  and the end: done, stopped or error, its message, the percent, the time.
- **Test: Do Test asks in one line** (the owner, 2026-10-02): "8 rows of
  pattern D1 will be run on the machine", Cancel / OK — no margins note, no
  "in the air" note.
- **Test: ↻ turns each D pass ±90°** (the owner, 2026-10-02: "another row
  D1, D2, D3, the slider at the centre, −90 and +90 either way", a scale
  −90 / −45 / 0 / +45 / +90 as on Row to row). It adds to the pass's own
  angle, plus clockwise like the wrist; D1 turned −90° is C itself (tested).
  The signs X ↑, Y →, ↻ now stand in the line of the names, before D1, so
  the sliders keep the whole width (the owner); the scale's end numbers sit
  out at the ends, so all five read in a third of the panel.
- **Test: no "Pattern" word** before A B C · D1 D2 D3 (the owner,
  2026-10-02): the keys speak for themselves, and the two groups fit one line.
- **Test: each D pass where you put it** (the owner, 2026-10-02: "the rows,
  the length, the bow and the wave go to all three — fine, as planned; but
  where they lie on the canvas I want to change"). Under the pattern keys,
  above Rows: a row of X ↑ and a row of Y → sliders, one for D1, D2 and D3,
  ±200 mm off the board's centre (machine axes, as on Calibration); a pass
  that is off has its pair greyed. The walls check and the margins take the
  passes where they lie. And every turn of a D pass lifts the brush now: a
  row running straight up or down the board turned no side before, and its
  turn stayed on the board.
- **Test: pattern D and the Wave** (the owner, 2026-10-02: the key frame
  `references/IMG_9455.JPG` in three passes, `PATTERN-D1…3.jpg`; "keep the
  geometry of C"; "if you can make such waves, let their curvature be set,
  from a perfectly straight pass to waves"). D1 · D2 · D3 latch like
  Reference · Lanes · Drops; each is C's snake turned 90°, 50° or 120°
  (Claude's reading of the sketches), the sliders shared; the passes on run
  in their order with a pause for the paint between, and the preview draws
  them orange, red and dark grey. Wave, 0…30 mm, on every pattern: a sine
  along the row, a whole number of half waves so the ends stay put, laid as
  biarcs — lines and arcs only, no kink. With no wave A, B and C are what
  they were, block for block (tested).
- **Sliders dark grey and thin; Do Test dark grey; two phrases gone** (the
  owner, 2026-10-02). On every tab the sliders lose their orange — the fill,
  the knob's mark, the value — for dark grey (`--slide`, light grey by
  night), and the slot is 4 px instead of 8; orange stays on the STOP dots.
  Do Test is dark grey, not green (Do Job keeps its green). Test drops "The
  first run in the air…" and "black on a board, 30 × 30 by default".
- **Test: the panel after the run the owner liked** (2026-10-02,
  `test_results/IMAGE 2026-10-02 14:20:16.jpg`). Row to row in 0.5 mm
  steps, 4…30 mm (was 1 mm, up to 80), with a scale under it as on
  Calibration; pattern B's rows 30 mm apart (was 40) to stay on it. Brush
  on up to 200 mm/s, the board's most. Wrist at a turn up to ±60°, and
  `REACH` and the Wrist handle on Calibration to +60° — the owner: "add a
  reserve, ±60°, the camera will take it"; 45° stays the default. Between
  rows stays at 200 mm/s: the firmware takes no more, and X at 300 mm/s
  would turn its motor past what 12 V drives well (est.).
- **Firmware flashed with the owner** (2026-10-02, 13:47, the 12 V off, on
  USB alone): the two entries below. The board answered at once: no axis
  zero, 0 faults, 0 retries. The carriage's place before the flash (X −295,
  Y −46 steps, read from the board) is in `park.json` for Restore.
- **Firmware: HARD STOP at once on a path too** (the owner,
  2026-10-02: "yes, add it"). K called the library's `forceStop()`, which
  stops only its ramp generator; a path does not use it, so the path's
  queue ran on for up to 120 ms — 12 mm at 100 mm/s. Now
  `forceStopAndNewPosition()` at the motor's own count: the pulses stop at
  the end of the one in hand, the queue is emptied, the count a step off at
  most.
- **Firmware: a path after a HARD STOP runs again, and the wrist may turn on
  a path** (2026-10-02). The Test tab stopped with "the
  carriage did not get there: X 332.8 Y 362.2 mm instead of X 321.4 Y
  243.8" — the carriage had not moved at all. FastAccelStepper 1.3.4's
  `forceStop()` (a K, or any path fault) leaves its queue ignoring
  commands, and in path mode nothing clears it: every tick of the next
  path went nowhere with an "ok". `G` clears it now, so a restart of the
  board is no longer needed; it is the "такт не берётся" of 2026-09-27 too.
  And `J 3` is taken while a path runs, the path going on — the owner,
  2026-10-02, "maybe we combine this with the firmware?": the ground for
  landing and lifting the brush in place, the carriage moving back under
  it as the wrist turns. Host tests pass, the build too.
- **Test: the turns at ±45°, and the preview draws what the brush paints**
  (the owner, 2026-10-02: the brush leaves the board at ±45°, measured on
  Calibration). The wrist is +45° at a right end and −45° at a left one by
  default, and a turn runs in the air: its move counts no paint. The board
  is drawn with the brush's own trace — the wrist moves the tip along Y
  only, by 50 mm between touching the board and upright (a ruler), so the
  landing and the lift drag 50 mm along the rows, and a tilted stretch
  short of 45° is painted shifted along Y (18 mm at 15°). The table round
  the board, and the test's SVG, are 50 mm wider either side for it.
- **The wrist up to +45°; the brush leaves the canvas at ±45°** (the owner,
  on Calibration, 2026-10-02: +15° was not enough, the brush stayed on the
  canvas; it leaves at −45°, and "the camera lets it squeeze past to +45°
  the other way; I was careful, there is room up to +45"). `REACH` and the
  Wrist handle go −90…+45°; for the runner the brush is on the canvas short
  of ±45° (`LIFT_DEG`), so a pause in a lifted turn waits for its end.
- **Test: the landing shift dropped, the rows as they were** (the owner,
  2026-10-02, the second snake: `test_results/photo_2026-10-02 11.56.38.jpeg`,
  `2026-10-02 50mm.png` — "fix it as it was"). The blob was at the row's
  start, but the drag runs along Y only and a bowed row starts at a slant:
  the first row bent off its arc by up to 22 mm and left a gap. The path is
  again exactly the one before, point for point; the broom at the turns
  stays.
- **Test: the landing and the broom** (the owner, 2026-10-02, the 15-row
  snake, `test_results/`). The brush, laid down from −54°, touched the board
  50 mm before the row and left a blob there (a ruler): the carriage now
  stands 50 mm into the row as the wrist comes down, so the drag is the
  row's first 50 mm; on a bowed row the rest goes on as an arc to the row's
  end, leaving it as the row did. At a turn the bristles flipped over: the
  wrist goes +15° at the end of a row to the right, −15° at the end of a row
  to the left, and upright again once the turn is done (the owner: "back to
  0° after the turn"). Two sliders, **Landing** (mm) and **Wrist at a turn**
  (±°, est.); 0 gives the old continuous snake. SAVE TEST keeps both.
- **The wrist up to +15°** (the owner, 2026-10-02, asked whether the camera
  on the holder clears it: "Allow up to +15°"): `REACH` in `rembrandt.py`
  and the Wrist handle on Calibration go −90…+15° (+10° since the camera,
  2026-09-30). For the runner a brush tilted up to ±15° (`TILT_DEG`) is
  still on the canvas: Pause lifts it, and Continue puts it back at its
  tilt, not upright.
- **Night: the whole page** (the owner, 2026-10-02, `references/braun_night-1.jpg`,
  `-2.webp`): the moon by PROGRESS turns every tab graphite — panels, keys,
  fields, the tables the canvases draw on — and the LCD glows warm yellow;
  the canvas and the test board stay cream. A line in each page's head sets
  it before the page draws, so no flash. On Test, PROGRESS moves to the top
  of the panel, as on Job.
- **Test: the PROGRESS LCD, as on Job** (the owner, 2026-10-02: "I came to
  love that screen"): the percent by painted length, LEFT, TOTAL, the
  sticks, the row in hand. **The lamp**: a sun and a moon by PROGRESS, on
  Job and Test, instead of "the plan, by painted length" — by night the
  LCD's glass glows warm yellow, as a clock with its lamp on; one switch for
  both tabs, kept in this browser.
- **Test: Bow** (the owner, 2026-10-02, the snake's reference): a row can be
  an arc, its middle so many mm below its ends (above, when minus). The
  turns of a bowed row are a half circle and a short straight line, so the
  path stays smooth — no kink for the board to stop at; tested at every
  joint.
- **Test: sliders and 💾 SAVE TEST** (the owner, 2026-10-02): the rows, the
  turn, the row to row, the length and the speeds on sliders as on
  Calibration, the board's size two numbers; SAVE TEST puts the test in the
  Library — an SVG of the board with the rows and the settings, and its
  preview. **The Library has two shelves**: paintings, then a line, then the
  tests; a test opens on the Test tab. `rembrandt.py` takes a test into the
  Library (`rembrandt-test`) and tells it from a painting.
- **Test: the board's width and height apart** (the owner, 2026-10-02: 40 × 60
  too); a size saved before reads as both.
- **Test: pattern C, the snake** (the owner, 2026-10-02): one continuous line,
  12 rows 20 mm apart, a half circle at either end, the brush down all the
  way; no pause.
- **The arm strokes are dropped; the tab is Test** (the owner, 2026-10-02,
  after the run in the air): the same 30 × 30 board and patterns A and B,
  drawn by the plotter — a line, a half circle, a line back, the brush
  lifted with its hook. The board's margins are a hint now; the machine's
  walls are checked on the page before a run.
- **Formats 40 × 60 and 40 × 30 cm** on Create and Calibration (the owner,
  2026-10-02).
- **The 3DOF tab** (the owner, 2026-10-02): arm strokes on a 30 × 30 board —
  pattern A (8 rows, tight) or B (5 rows, loose), every number editable, a
  preview in mm, Here, ⚡️ Do 3DOF, Pause, Continue, STOP and HARD STOP that
  stop the arm too. The runner in `rembrandt.py` learnt two blocks: a joint
  at its speed, and a pause for paint. New module `strokes.js`, tested.
- **Firmware: a slow arm, and STOP for it** (flashed 2026-10-02 with the
  owner, the 12 V off; the board answers P, V and the new H). `J <j> <deg> [<deg/s>]`: tenths of a degree, and a speed —
  for the arm strokes, a slow arc of the brush instead of the fixed ~53°/s.
  `H`: the arm holds where it stands. The server passes the speed
  (`/arm?…&v=`), waits as long as a slow stroke takes, and STOP and HARD
  STOP on the Calibration tab stop the arm too; an "Arm speed" field there.
  The wrist's +10° stays the server's: in the firmware it would limit a
  step, not the angle (the old note said otherwise).
- **The owner's decisions after the outside review** (2026-10-02): paint by
  eye for now, the brush dipping into cups later — no pointer, no laser, no
  syringe; the firmware is Rembrandt's; the edge matters more than the fill;
  arm strokes under study. Sonnet's layout stays in Adjustments, on hold.
- **The firmware in Rembrandt**: `firmware/CNCDM-001/`, from RUBENS
  `a143fbc`, unchanged.
- **`python3 rembrandt.py` in the project's root** starts the server too.
- **The paint is reckoned on the real gap between the lines** (Claude in the
  chat, in the outside review of 2026-10-01): above the curve the vertical
  copies lie closer on a slope, pitch × cos(slope), and a line there gets
  paint for that gap only — no double film, no ridges. IMG_9422's default
  curve: 195 → 189 drops, 409 → 397 ml (est.).
- **💾 SAVE on the Create tab**, in the second row after Export PNG (the
  owner): every save a new painting in the Library, named by the time; a
  click there opens it again, the reference and the layers with it.
  `rembrandt.py` takes Rembrandt's paintings into the Library as it took
  RUBENS's drawings; nothing else in it changed.
- **The owner's palette**, `app/tubes.json`, in git.
- **`README-review.md`**: the project for an outside view (the owner shares it
  with other AI models): the intent, the machine, the method, the dosing, the
  constraints, and the questions we want answered.
- **Four layers, the same on Create and Adjustments** (the owner,
  2026-10-01): Light, Dark below the curve; Sheet, Black above it, the black
  into the wet grey. A saved three-layer state goes over to the four. Tails
  or Round per layer is one setting for both tabs.
- **Only the chosen layer is a key** (the owner): the others are flat.
- **The tubes are the owner's**: on the Create tab a click on the shade or
  the name changes it, + adds a tube at the end, ⋮⋮ drags it in the list,
  × deletes one no layer uses; ⌘Z undoes it. **Kept on this Mac** in
  `app/tubes.json` — `rembrandt.py` serves and saves it at `/tubes`, as it
  does `calibration.json`; nothing else in it changed. Adjustments shows
  Sonnet's paints in the owner's shades and names.
- **Lanes and Drops on the Create tab** (build order steps 1 and 2, first
  cut): lines 8 mm wide and 8 mm apart over the whole image area — offsets
  below the curve, vertical copies above it, Sonnet's way; each line's paint
  read from the reference, neighbouring lines taking turns where it lies
  between two tubes; every run from its home into its tail; the drops across
  the lines at the homes, one tube at a time, the lighter first, with drops
  and ml per tube, est. Tails or Round per layer; a layer click shows the
  layers up to it. The paint numbers (line width, film, brush keeps, drop,
  nozzle, tail) live on the Adjustments tab, est. The inventory is Sonnet's
  13 shades with White; the layers as Sonnet laid them out. New modules
  `bands.js`, `drops.js`, `adjust.js`, with tests.
- **Adjustments: one row on top**, as on Job and Calibration (the owner): the
  layers 1–4 and Export PNG moved into the Layout block, the canvas rose.
- **Adjustments: Tails or Round per layer** (the owner, 2026-10-01: the top is
  solid black), in each layer's card; the top row keeps the layers 1–4 and
  Export PNG. The black U of layer 4 is Round by default, the rest Tails.
- **The Adjustments tab, first cut**: Sonnet's layout read from
  `adjustments/` — layers 1 to 4 one by one, 13 paints in the order they run,
  each line drawn as the brush leaves it: full width at its home, thinning
  into a tail (120 mm est., a slider), or round-ended as Sonnet drew them.
  Each paint's home, left or right, can be switched. 46.5 m of line, ≈ 19 min
  at 40 mm/s est. New module `layers.js`, tested against the real files.
- **The inventory is large** (the owner, 2026-10-01: a Pebeo set of 50 tubes,
  a Liquitex set of 80): gradients of many real shades side by side —
  **optical mixing**, Sonnet's way — next to the tail. **The top black goes
  into the wet grey**, after it in the sheet's session; Create's layer 2 is
  White, Grey, Black. The Adjustments tab starts from Sonnet's layout in
  `adjustments/`, 13 paints, the lines drawn with tails.
- **Rembrandt runs on its own** (the owner, 2026-10-01: "run everything in
  Rembrandt, so there is order from day one"): the pages say "start
  rembrandt.py" where they said rubens.py; nothing reads from `../Rubens`.
- **The Create tab, first cut** (build order step 1, without the bands yet):
  the image area 568.5 × 865 mm with the canvas in it, 50 × 70 or 60 × 80,
  placed from Calibration or, until then, 50 mm under the top wall; the
  reference covering the image area, with its opacity; one curve drawn with
  RUBENS's Gesture, Pen and Select; every Curve number typed in place — a
  segment's own numbers, the length (scales the curve), the inner corner
  radius; the three layers with [+] and ×, the lighter tube first; the tubes
  in use. The house opens the curve of IMG_9422. New modules `curve.js` and
  `tubes.js`, with tests; Calibration offers 50 × 70 too. Adjustments has its
  tab, empty until step 4.
- **`rembrandt.py` on port 5164**, `rubens.py` renamed and nothing else changed
  in how it talks to the board; the tabs in the spec's order, Create · Job ·
  Adjustments · Calibration · Library, on every page.
- **Stage by stage, one tube at a time** (the owner, 2026-10-01): the tube's
  drops, its runs, then the machine waits for the owner's look — Again or
  Next. **Orange is in by default**, its home from the reference.
- **The owner's corrections of the UI sketch** (2026-10-01), in §8, which now
  wins over the sketch: two rows as in RUBENS, the view toggles centred in
  the second; formats 500 × 700 and 600 × 800 drawn on the image area as on
  the Calibration tab; the RUBENS tools on the left; Add new reference; every
  Curve number editable, the inner corner radius with no upper limit; [+] a
  tube in each layer; the Job tab as in RUBENS, STOP and HARD STOP under
  Pause; ⚠ only closer than the keep-out.
- **Port 5164**, the owner's lucky number (2026-10-01), instead of 8767.
- **The upper line is built by the program** (the owner, 2026-10-01); the
  blended lanes are fitted with lines and arcs within 0.1 mm, tangent
  continuous, for the firmware's `L` and `A`.
- **The machine paints everything, the black too** (the owner, 2026-10-01):
  from the edges inward, tails into the red and the grey; at the top along
  the U of the upper line, past the canvas by about 5 cm on purpose. The
  first painting's table now lists homes, tails and order; its numbers are
  computed, the old ones for 70 × 100 are gone. Orange is open.
- **Home and tail** (the owner, 2026-10-01, untested): every tube starts at
  its home with a full brush and dries out into its neighbour; the brush
  lifts at the end of the tail and goes back in the air. Swing marks are an
  ornament. Within a layer the lighter tube runs first. Drops lie at the
  homes; the colour preview uses the tail model of the spiral research.
- **The image area is the machine's reach** (the owner, 2026-10-01): one arm
  pose, 568.5 × 865 mm, a 50 × 70 canvas inside it on the 100 × 70 one; the
  paint past the small canvas is on purpose. The "57 → ~80 cm" of §1 was
  two poses; Rembrandt uses one.
- **Rembrandt is private** (the owner, 2026-10-01). **The copy from RUBENS**
  is from commit `a143fbc`, not the tag v0.1.3, and takes every module the
  listed ones import (`config.js`, `cnc.js`, `paint.js`, `gesture.js`,
  `librarypage.js`, `test/shapes.js`).
- **The start.** The spec v0.1, the design (five screens), the key image
  IMG_9422, the references and the earlier research from the chat, as the
  owner set them up on 2026-10-01.
