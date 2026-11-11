# Changelog

Rembrandt, the successor of RUBENS, for CNCDM-001. Newest first.
Machine measurements stay in RUBENS: `../Rubens/CALIBRATION.md`.

## After v.1.2.3 — 2026-11-10

- **FORM-G: the front indicators' orange whole on the classic's v.2** (the owner, 2026-11-11, `FORM-G/details-2-3.png`, the photo beside the Drag view: "trim
  the red on the bumper a little, so that it does not climb onto the orange at all; on the left the photo, as in the original — it will be neater"). paintrun.py
  runs a lighter span UNDER, 3 mm, under the darker one it butts, for the darker comes after it; the orange is the first of Layer 2 since the same day, and the
  bumper's dark reds' second coats come after it again. Now in every column of a front indicator a leg of another jar on the bumper's side starts where the
  orange ends: 26 legs 3 mm shorter (Jars 17, 20, 21, 22, 24, 27, 30, 34, 36, 37, 39), 3 left with under 3 mm out (Jar 36 and Jar 43 at x 267.5, Jar 37 at
  432.5), their cells broken there; 1576 legs, 946 cells. The wing's side behind the orange as it was. `FORM-G/generator/amber_trim.py`, in `export_formg.py`
  for v.2; the render's bulbs moved up the same 3 mm by hand, the orange under them. Not run.
- **rembrandt.py: a silent arm pauses the run; the servos' volts in the journal** (the owner, 2026-11-11, of all three servos silent at once mid-run,
  back when the carriage was moved, and the STOP, HOME and Start from it took: asked whether a silent arm should pause the run, Continue the same move
  again, and whether the servos' volts should go into the journal: "Yes. I allow it"). Silent past SILENT_WAIT (90 s, as before) at a joint's move, at
  the zero of all three, or at a stroke's W on the path: the run **paused** where it is, `ARM SILENT: … — the servos' 12 V or ground is off. Check the
  board's 12 V terminal and its switch, the servo cable's plugs …`; asked every 2 s, "The arm answers again (11.6 V): Continue"; Continue makes the
  same move again — the carriage, jogged meanwhile, first back where the arm went silent, the brush up if it was over the canvas (the shoulder at 0);
  STOP ends it as stopped, not an error, in the 90 s wait too. No DIP, Back or Go to while it is silent; the iPhone's remote says "The arm is silent" in
  red, not a change of paint. The journal: every dip and the "silent" note with every servo's volts and °C at the last look (`volts`, `temp_c`, the
  look's `V` read them all along), "arm back" with them again, "back to" for the carriage. A silent arm at a run's start: an error, said plainly.
  Restart rembrandt.py with no run on. Not run on the machine.
- **FORM-G: the library on the left, the panel in the right corner** (the owner, 2026-11-11, of the panel moved to the left the same day: "the other way round:
  the panel on the RIGHT, the library on the LEFT, please"). THE LIBRARY a column left of the picture, PROGRESS and the keys in the right corner as before;
  a card's (i) opens to the right of the library, over the picture.
- **FORM-G and the iPhone's remote: PROGRESS of the whole picture after a Start from** (the owner, 2026-11-11, of the arm gone silent on the red classic's run: "I take
  them home by Stop, Home. That puts PROGRESS back to zero, the % on the screen go off"). A DRAG from a later line of the list counts the lines before it done: the %, the
  sticks, the jar's "7/62" and the row's, the total the picture's, the time left the run's; the remote the same (every colour of the run its line in the whole list and the
  picture's mm, `whole`, passed on by rembrandt.py as it is). A page opened during such a run finds its run's lines again when its plan gives the very blocks the board has.
  rembrandt.py untouched. The journal of the night and the day: all three servos silent at once at 02:59, 03:39, 03:40 and 13:24, 76 … 100 s each, all over the canvas
  (Y 130 … 480, X 55 … 805), while the carriage still moved (the owner) — the servos' own branch of the 12 V, the board's terminal and switch, the servo cable, not the
  supply; the firmware README's note of 2026-09-22 too: "the whole bus silent at once is the ground, not the servos".
- **FORM-G: the panel on the left** (the owner, 2026-11-11: "move the panel from the right corner to the left, please"): PROGRESS, the keys, the canvas, the brush and the
  jars in a column on the left under the tabs, the picture in the middle, THE LIBRARY on the right as before. A phone as before.
- **FORM-G: each 911's v.2 alone in THE LIBRARY, no "Kuzya" on the cards** (the owner, 2026-11-11: "remove the cards Porsche GT, red — leave only v.2 in THE LIBRARY.
  The same with the classic's v.2. Remove the words Kuzya, they only make noise"). `FORMG_LIB`: Porsche GT, red · v.2; Porsche, red · v.2; the white; the watch. Their v.1,
  `porsche-race.json` and `porsche-red.json`, stay on the disk (the tests, v.2's names). A page left on a v.1 opens its v.2; the classic's place, the owner's canon for
  the 70 × 100 (left −60, bottom −68), carried to its v.2 once — the same outline to the mm, the same PRESS_OK.
- **FORM-G: Jar 6 by its number, the first of Layer 2 (canon)** (the owner, 2026-11-11, the red classic's v.1 on canvas, the orange between the greys: "call the orange
  Jar 6; the swatch is next to it, I see it anyway. Calling a colour Indicator is strange — we do not call the black Wheels"; "Jar 6, the orange, is sensitive to the grey next
  to it. Before it Jar 3, right after it Jar 7 — I propose to take the orange to the very start of Layer 2 and put it into the canon: Jar 6 always at the start of Layer 2. In
  the Porsche's v.2 it will be line 41, for it leaves Layer 1 and the last, #41 Black, becomes #40"). The red classic's jars by their numbers alone, Black the one word: the
  orange Jar 6, the tail light Jar 14, the carbon Jar 40, the seam Jar 45 — their places in v.1's list, v.2 under the same (`porsche-red.json`, `porsche-red-k.json`,
  `export_formg.py`). A jar `late` in a plan: out of the first layer, the first line of the second, once, its cells as a first coat's; the orange on the red classic, v.2 and
  v.1, and on the white. v.2's list: 40 lines, Black the 40th, Jar 6 the 41st, then the 21 second coats, 62 in all as before; the pause before it "the first layer is done:
  let it dry". COLORS lists a late jar after the first layer's. README: **The orange, Jar 6, first in Layer 2 (canon)**. The red Jar 21's second coat, the orange's chief
  neighbour (18 legs touching), comes ≈ 22 min of painting after it (est.; LAB: dry ≈ 30 min).
- **rembrandt.py: a silent arm's wait by the clock** (the night of 2026-11-11, 02:59: all three servos silent at an elbow move after Jar 19's
  cell 18, the journal's "50 s of 90" at 86 s — a read of a silent bus is slower than its gaps, so the count of sleeps ran slow and the 90 s would
  have been about 150; the owner: "put it on the real clock"). `Arm.patient` and `Arm.rezero_patient` by `Arm.clock` (time.monotonic; with a sleep
  not the real one, the tests, the time slept), the journal's note every 10 s by it. Not run on the machine.
- **rembrandt.py: the elbow lifts slower in the air; a silent arm waited for** (the owner, 2026-11-11, the arm silent at the elbow's lifts on the classic's
  run — 00:34 `J 2 12`, all three servos silent about 80 s, then answering by themselves; 01:36 `J 2 32.5`, a dip: "it looks like there is no [lack of] 12 V,
  just a heavy load; I touch nothing, the wire is well in"; asked to lift slower and wait longer: "both, yes"). `Arm.move_to`: the elbow up in the air — a
  dip's lifts, the brush up after a row, the page's jog — at `ELBOW_UP_SPEED` 28 °/s, not the firmware's ~53 (est.); down as before; the lift on the move
  (W on the path) untouched, the stroke's own. A joint silent at a move, or a zero the board could not take of all three, waited for `SILENT_WAIT` 90 s, asked
  every second, noted in the journal, before the error it was (est.). About 1 s more a dip: some 20 minutes on a 12-hour run (est.). Restart rembrandt.py.
- **The classic's v.2 Kuzya under v.1's jar numbers, from v.1's paints alone** (the owner, 2026-11-11, COLORS' Indicator "No. 6 of 49" on the red and "No. 7
  of 42" on its v.2: "why did you do that? I have 36 jars with numbers; on the orange No. 6, the canon. I cannot keep a jar for every picture of the very same
  paint under another number … the v.2's numbering must not differ"). v.2 had started from the generator's kept jars, kept one v.1's prune had taken out
  (#F6BEB0), and the export numbered every jar again by its place. Now `redcark.py` starts from v.1's 49 as painted (`porsche-red-k.jars.json`, made from
  `app/formg/porsche-red.json`), so the plan, its prune and the merge only take out; `export_formg.py` names every jar of it as v.1 does, paint for paint.
  41 jars, 21 of two layers; gone the eight steps of dark red the audit had pointed at (Jars 23, 26, 29, 32, 33, 35, 38, 41); every other jar its v.1 number.
  COLORS: a card's place in its run's list no longer reads as a jar's number ("line 6 of 49 in the run of …"); the yellow family's words fit an amber too.
- **FORM-G keeps to the running picture** (the owner, 2026-11-11, the classic's v.1 on the machine, its v.2 card clicked to look at it: the LCD read the
  board's steps by v.2's plan — "Jar 1 · 1/63", 0 % — and v.2's jar numbers, one ahead of v.1's from its Jar 2 on, were taken for the run's: "Jar 8 is in the
  machine, I have Jar 9 ready, but Rembrandt says put Jar 8"; "the 7th is orange and the 8th grey"). The run's picture is kept (`S.runPic`, at every start);
  while a run is on, a click on another card is refused with why, and a page opened during a run goes back to the run's picture. A warning stays 5 s before
  the next look at the run writes over it. Nothing on the canvas went wrong: the grey was run again with the grey (from the journal).
- **FORM-G: the red classic's v.2 Kuzya, a card of its own** (the owner, 2026-11-11: "can what Kuzya wrote be applied to the classic Porsche, 100 × 70?
  Maybe make a v.2 to compare?"). `porsche-red-k` after the red, which stays as it is (he paints it): `redcark.py`, RedCar's form, target and kept jars, and
  the GT audit's B, C, D as on the GT's face — no hue apart on the body, a cut by the form, jars the brush model cannot tell apart one (eight merged); the
  GT's gloss not, it was not the audit's. 42 jars (49), 21 of two layers (29), 63 lines of the list (78), 1576 legs, 354 under 12 mm (341), 63.3 m of line;
  the outline to the mm the red's, so its pen outline and its place (−60, −68, `PRESS_OK`) the same. Against the picture, the body's macro L* spread 17.4 (the
  red's 17.7, the photo's 18.8), its correlation 0.970 (0.972): the same picture, fewer jars. Not run.
- **FORM-G: the carriage's travel 100 mm/s, a field of its own** (the owner, the same night: "the belt slipped several times; when it spins idle along X
  with a crack it cannot guess the coordinates, it starts the headlights in the canvas's middle though they are at the top … FORM-G says 25 mm/s, in fact it is
  125"; on hearing that the travels went at 180: "we must lower it"). The legs were at 25 (`F 25`, the journal's three runs of 23:18 … 23:23 too); the moves
  with the brush up — home to a run's start, to a dip, between runs, home — at the Travel FORM-G had taken from OPM-N, 180 mm/s (`T 180`): the run's first,
  home to the headlights at the top of a 70 × 100, ~830 mm with the jar on the carriage. Now 100 (the firmware's own default), the old 180 replaced once
  (OPM-G's too, the same carriage), and **Travel, mm/s** under The brush, 20 … 180. Lost steps are the belt's: the owner checks the GT2 clamps.
- **FORM-G: the red classic at the owner's place, its lowest lift-outs pressed against the bottom wall** (the owner, the same night: left edge −60, bottom
  edge −68 "is the canon for the 70 × 100 canvas"; "I calibrated it perfectly — fit the car to the physics"; the pen's outline found the canvas's centre,
  `FORM-G/IMG_2643.HEIC`; asked: shorten the car's rear, move it up, or let the carriage press against the wall — "Yes", the last, "not 6 mm above the pen's
  outline"). There the carriage would go about 6 mm past the bottom wall (the stop 9.45 mm past it); the page's "16 mm" was plotRun's sum over every piece
  pressed, not a depth. `PRESS_OK` in `formg.js`: for the red classic only, at the bottom wall only, 8 mm at most, no leg gone — the page says so above the
  place and the journal's DRAG start carries `pressed_bottom_mm`; anything else as before, refused. What it costs (est.): the lift-outs of the rear bumper's
  tips and the diffuser stop at the wall, the tip mostly off the canvas by then; a landing from below may lose ~2 mm of its touch. Not run.
- **GT v.2 Kuzya: the canon of the jars, 43 → 35** (the owner, the same night, of the canon's nine — every jar with less line than the canvas's long side,
  60 cm, into the jar nearest in colour: "Jar 9, Jar 29 and Jar 19 go into other jars — these may. Better not touch 22, 10 and 31"). Eight moved: Jar 28 → 27,
  Jar 11 → 12, Jar 9 → 15, Jar 5 → 4, Jar 2 → 4, Jar 40 → Seam, Jar 29 → 25, Jar 19 → 20; Jar 32 stays, it would have gone into 31. No jar renumbered (Kuzya's
  audit): the names as they were, a gap where a jar went. Every leg still painted, none moved; 24 of the 35 two layers. `FORM-G/generator/jarcanon.py` does it
  on the finished plan, the render painted again from the generator's grid with the same moves.
- **COLORS: every picture's jars, and a recipe for each from the model** (the owner, the same night, at the table with the jars: "I am a little lost;
  I do not know where to start … 43 against 49 is good. But how to mix them?"; Kuzya's audit `FORM-G/Rembrandt_COLORS_FORM-G_Registry_Audit_Claude_2026-11-10.pdf`:
  "COLORS needs a registry, not 170 manual cards"). A row of pictures over the jars: LAB · real 3 as it was (its hand recipes, its ticks), and every picture of
  FORM-G's and OPM-G's libraries read from its own plan (`colorreg.js`), a jar's key its picture's and its own (`porsche-race-k:j12`: "Jar 5" is another paint
  in every picture); the plans untouched. A picture's jar its recipe from `colormix.js`: Kubelka–Munk on the paints of the shelf as real 3's recipes were worked
  out, two-constant now (White scatters 6 times a plain paint, Sand Yellow 2.5, est.: one-constant made White a weakling, a mid grey White 200 : Black 1), and the
  painter's families by the jar's colour — a red from the reds, Pink and the dark mother (Red + Dark Brown 1 : 1, real 3's Jar 43), no Black, no violet, no
  blue, no White in a fierce red; an olive from the fluorescent lemon; a blue grey Ultramarine, Black, White; a grey White with Black by drops. Real 3's dark
  reds come out as the hand recipes, within ΔE 2 (test). Parts in words when one is under a fortieth ("White most, Black by drops"); a jar the model is unsure
  of, Check by eye; Dry LAB "Target · recipe pending"; the same hex in another picture a candidate, never one jar. The lead: the dark mother first, the
  tubes the picture takes and in how many jars. 7 pictures, 276 jars, 214 hexes in this tree.
- **FORM-G: v.2 Kuzya first** (the owner, the same night, the two side by side, `FORM-G/Screenshot 2026-11-10 at 10.25.08 PM.png`: "I like v.2 more, though
  I admit I do not know who would see the difference with the naked eye. In Kuzya's version the headlights and the hood's passage at the border hood + lower
  front are better worked out, so I would take v.2"). `porsche-race-k` the first card; the first version the second, kept.
- **FORM-G: the racing 911's face, v.2 Kuzya, a card of its own** (the owner, the same night, of Kuzya's audit
  `FORM-G/Rembrandt_FORM-G_GT_Color_Tone_Audit_2026-11-10.pdf`: "honestly I do not quite see the problem between what we have now and what Kuzya proposes. What
  if it gets worse? So it is safer to make v.2 Kuzya"). `porsche-race-k`, after the first, which stays as it is: `racecark.py`, the first's target, geometry and
  starting jars, and the audit's B, C and D — no hue apart on the red body (`JIT` 0 there); a cut's cost by the form, 2800 where the body's light is flat, 700
  where it turns (its slope 0.4 … 1.4 L* a mm, `segment_var`); jars whose dried legs the brush model cannot tell apart, dE under 2.5, one (the audit: 26 of the
  first's 49 jars on the 0D floor, 13 pairs under dE 3). 43 jars (the first 49), 28 of them two layers (34), 1873 legs, 453 under 12 mm (456). By the audit's
  own measures against the picture (macro L* spread, sigma 25 px): the hood 5.4 → 7.6 (the first 8.5), the lower front 12.3 → 14.7 (14.9), its texture 6.8 (7.0).
  The first's planner takes the audit's B and C as switches, off for it (`JIT_BODY`, `SURFACE`). Not run.
- **FORM-G: the red racing 911's face on 60 × 60, in the green's place; every card its canvas** (the owner, the same evening: "the frontal racing
  Porsche's face … in place of the green Porsche in FORM-G"; "we make the face right now"; "better to sign them: I thought our red Porsche was 60 × 80, and it is
  70 × 100"). `porsche-race`, "Porsche GT, red", 54 cm across, first in the library; the green out of it (`porsche.json` stays, the tests' and LAB's). Its
  generator `racegeo.py` + `racecar.py`: the red classic's `RedCar` on a geometry read off `FORM-G/Red Porsche GT Race Car.png`, symmetric about the axis — the
  wing, the glass, the mirrors, the headlights, the bonnet's vents, the neon, the intakes and the splitter each a part; the body's seams the picture's own thin
  lines, by colour. The stickers and the crest off, a grey mark of two columns in the crest's place. PORSCHE on the banner a hint, as the owner asked ("the letters
  as if not there, but you know what is written"; his LEGO/ Mona Lisa: "OPM in its purest form"): a band the letters' height, every column one leg — an upright
  light grey, the bars a darker grey, the gaps black. The neon the owner's fluorescent lemon, a jar as it comes. After Kuzya's read of the first try ("a rather
  flat graphic illustration"; "for a glossy body not only steps of red: cool reflections, light coral and pink shades, near-neutral highlights"; the owner: "I
  agree with Kuzya completely, we were taught this at art school"): the picture's body is flat itself, 70 % within L* 32 … 48, so on the body its light and shade
  between 6 and 40 mm made stronger (`VOLUME`) and its colour laid by L* as gloss (`GLOSS`, `HUES`: shadows crimson, light coral, a highlight's fringe pink to
  lilac, the highlight near neutral), the chroma down to the gamut (else a clip turns every hue back to the same red); the jars clustered over every tone evenly;
  `LAM` 1400 and `JIT` 2/3 (Kuzya's), the glass read sharp. The volume's band against the photo's on the body: correlation 0.853 → 0.914, spread 0.90 → 1.18;
  49 jars, 34 of them two layers, 1894 legs, 75 m of line (all est.). On the cards the canvas, cm, under the title (FORM-G and OPM-G). Not run.
- **FORM-G: DRAW BW, the outline alone** (the owner, the same evening, DRAW BW's whole contour ≈ 1 h: "a long time; to centre it the Porsche's contour without
  the lines inside is enough; four crosses as TEST's are not"). DRAW BW's question now picks what it draws, **Draw**: the outline alone, where the paint meets the
  bare canvas (`contourOf(pic, { outline: true })`) — the red 911 one line, 2.63 m, ≈ 2 min (est.), the default — or every border between two colours, 713 lines,
  ≈ 1 h; Contour shows the one picked. Its run as before. The first run of the whole contour stopped at 9.5 % on "J 2 25: the elbow does not answer: is the 12 V
  on?": the journal has the elbow silent, then the shoulder, the elbow and the wrist together — the arm's power or its bus, not the plan.
- **FORM-G's red 911: the indicators as bright as the original's, and a black mark for the crest** (the owner, 2026-11-10, `FORM-G/geometry.png`, the white 911
  for the example: "maybe strengthen the yellow as in the original? And a black badge on the bonnet, so that VW or Audi do not take us to court: no Porsche logo, but
  a mark one cannot read"; "the red ate the indicators, so I took the white Porsche as the example"). The red picture's amber is 1–3 mm deep, the white's 6–7 mm;
  in the plan the Indicator's legs were 7–11 mm, a sliver once its red neighbours spill over it. Now every column of the strip 10 mm deep from its front edge
  (est.), its missing column filled: the Indicator 227 → 418 mm of line, its legs 16–17 mm with the light's run under the dark. Where the crest was, off since
  2026-11-08, two columns of Black about the axis, 10 × 17 mm, no shape of anything. `redcar.py`, `touch`, `AMBER_MM`, `BADGE`: laid on the finished grid, so not
  a leg of the rest moves (the plan made again first came out byte for byte the one in FORM-G); the white 911 as it was. 49 jars as before; the red jars round the
  strips a few mm less. DRAW BW 713 lines, 40.1 m; DRAG 2663 dips, ≈ 13 h 10 (est.). LAB's real 3 stays the piece it painted (`labreal3.js` not made again).
- **FORM-G: DRAW BW, the contour in a pen** (the owner, 2026-11-10, before the red 911 on 70 × 100, ≈ 12 h of paint: "before working with the paints I need a
  DRAW BW key as in OPM-N: I just put a pen in the brush's place and first trace on paper, the contour, to centre the canvas and study all the details").
  `contourOf` (`formgplan.js`): every border the brush leaves between two colours, and the outline on the bare canvas — a column's colours one over another in the
  list's order, the darker on top; a line across a column where its colour changes, a line between two columns where they differ: the steps of the 5 mm columns,
  every piece once, joined into as few lines as go on without a lift, each next the nearest. The run as OPM-N's DRAW BW: the elbow up into the cup's fork and the
  shoulder to 0 first; over the first line's start the holder down at the brush's pose + 1.4° and a p-pause — the brush out, the pen in, its tip on the paper,
  Continue; the pen pressed at the brush's elbow (Elbow live · brush, live while it draws), the carriage on the line, so it goes where the brush will paint; +3° over a
  line's start, up between lines; no dip, no jar, home at the end. The debug of the pen's downs before it runs (`landingCheck`). Contour, a view: the lines over the
  picture veiled, the line the pen is on in orange. Pen, mm/s, 40 (est.). The red 911: 716 lines, 40.2 m, ≈ 1 h 01 (est.). FORM-G's page alone; OPM-G as it was.
- **FORM-G: the run as LAB's real 3, a dip every 79 mm and the J3 compensation** (the owner, 2026-11-10: "take into account the latest changes of LAB / real 3: we
  made the dab-legs longer"; "3 + 3, yes"). Real 3's last changes (2026-11-10, above v.1.2.3) on FORM-G's DRAG SNAKE: no run longer than Dip every, now 79 mm (the
  canon's, what one dip holds; once, where it was still the old 95), no slack at a leg's end; every paint run's way on the machine 3 mm before its first point and
  3 mm past its last (`ELBOW_J3`, now `canon.js`'s, LAB's from there; `R3`, `j3Runs`); the screen, ▶ Play and the idle runs as they were. The red 911, the cup at
  hand: 2381 → 2659 dips, ≈ 12 h 10 → 13 h 10 (est.); the canvas's bottom edge −61 … −58 mm from home (was −60 … −57). FORM-G's run is still not by the canon
  no. 9 (no landing inside), real 3's was. OPM-G and LAB as they were.

## v.1.2.3 — 2026-11-10 · Colours by number

- **A jar is its number; no hex** (the owner, 2026-11-10, on real 3's last jar: "paints have no RGB, and it is strange to mix Liquitex and Pebeo by
  0C0C0C: let us take them out so they do not mislead"; "without 0C0C0C, just Black"; "I do not like hue dark / medium / light: there are not three of
  them but 6 or 7. The jar's number does it: Jar 35, Jar 32, and that is all, without #7e0d0d"). The shades' grades go by their jar's number, its place in
  the picture's list, light to dark: on the red 911 Chrome, Chrome mid and Chrome dark are Jar 1, Jar 3 and Jar 7 (the white: Jar 9, 22, 34; the green
  Jar 6, 10, 13, its creases Jar 5 and Jar 44; the G-wagon Jar 1, 2, 3), the ink is Black, and the generator names them so. No hex in a jar's words on
  LAB (the list, the pauses, Start from, the remote), COLORS (the cards: the colour as a chip) or FORM-G and OPM-G (a paint's own code only, if it has
  one). A pause tells the number in the list from the jar: "Number 10 of 19: wipe the brush, put Jar 29 in the cup". Real 3's runs as they were.
- **v.1.2.3 on every tab and in the saved SVGs.** The code and the notes; the photos of `LAB/` of 2026-11-09 night and 11-10 stay on this Mac.

- **LAB: real 3's J3 compensation, and a dip every 79 mm** (the owner, 2026-11-10, real 3 on canvas, `LAB/IMG_2614` … `2616`: Jar 22 run again over
  itself, its dip there now, "but the dabs stay"; "5–6 mm are cut off absolutely every leg … the machine must come in to land 3 mm earlier along X and leave
  the canvas 3 mm later; only then do the dabs turn into full legs, as on the screen"; and of Jar 27's long leg in two pieces: "as L 12; we chose L 9").
  The elbow lowers the brush over the first 8 mm of a run, the tip touching late, and a leg under 16 mm lands on its own start. Now every paint run's way on
  the machine starts 3 mm before its first point, back along its first piece, and ends 3 mm past its last (`ELBOW_J3`, `elbowEnds`), 1 mm past the piece's
  bottom at most; the plan, the screen and the idle runs as they were. Jar 27's 154 mm leg: its first run, 95 mm on one dip, gave out at ≈ 78 mm (est., the
  photo's scale from the legs) and the second began there; real 3's long legs now a dip every 79 mm, the canon's (what one dip holds), no run longer (no
  slack at a leg's end, `idleRunsOf`'s new `slack`, 0.25 elsewhere as ever), so the next starts 15 mm back over paint still laid. Layer 1: 128 dips, ≈ 42 min;
  from 10 (Jar 29): 85 dips, ≈ 28 min; layer 2: 109, ≈ 36 min (est.). FORM-G, OPM-G and LAB's other sheets as they were.
- **FORM-G and OPM-G: the dose, real 3's** (the owner, 2026-11-09: "FORM-G and OPM-G need fixing too"). The dose is the canon's now, `canon.js`
  (`DOSE`, `dosed`): every run on a dip of its own, no cell on what another one left; a leg under 30 mm after 60 mm of line since the dip, a dip of its own at
  its start; the idle runs as they were. OPM-G's new dips land inside as the canon's; FORM-G's, not on the canon, at the run's start as its other dips, its
  points as they were. The cup at hand, the canvas in the middle of its range (est.): FORM-G's porsche 1357 → 2100 dips, ≈ 9 h 46 → 11 h 03; the red 911
  1473 → 2381, ≈ 10 h 33 → 12 h 10; the white 962 → 1784, ≈ 7 h 46 → 9 h 08; the watch 734 → 1554, ≈ 6 h 34 → 7 h 53; OPM-G's G-wagon 931 → 1459,
  ≈ 5 h 48 → 7 h 00; the black one in modules, its legs alone, 1551 → 4521, ≈ 17 h 43 → 22 h 27. LAB's sheets as they were, real 3 with it.
- **LAB: real 3's dose — every run on a dip of its own** (the owner, 2026-11-09, real 3 on canvas, `LAB/IMG_2606`, `IMG_2609`: Jar 22's short cells came
  out dabs of ≈ 8 mm for 17 and 13 mm, the 20 mm tail of its long leg pale: "a real problem: not short legs but very short"; "clearly it needs a second
  dip"; "can we fix it in the process?"). By the canon a leg under 30 mm rode on what a longer one left (13, 9 and 4 mm after one dip for 15 mm), and the
  tail went on after 79 mm of leg. Now on real 3 every run starts on its own dip, and a short leg after 60 mm of line since the dip gets a dip at its start;
  each lands inside as the canon's do; the idle runs, so every leg, as they were. Layer 1 66 → 119 dips (≈ + 12 min), layer 2 57 → 100 (est.). LAB's real 3
  alone at first; FORM-G and OPM-G the same day, above. The page alone: rembrandt.py and the board as they are.
- **LAB: Start from** (the owner, 2026-11-09, real 3 stopped on its second jar: "even in a test I need a key to go back and repeat; the same choice as in
  FORM-G"). Over RUN, a choice of the sheet's numbers, `2 · Jar 5`, as FORM-G's: RUN starts on it, its jar in the cup first and no pause before it, the
  numbers before it left out (grey in the list), every other pause and run as in the whole; back to an earlier number to repeat it. Kept till another sheet
  is picked; the state line counts the numbers of the run that was sent. Real 3 from 2: 196 of 210 runs, 17 pauses, ≈ 27 min (est.). The page alone:
  rembrandt.py and the board as they are.
- **LAB: a jar is one film on the sheet** (the owner, 2026-11-09, of real 3's layer 1: "black strokes on the lamp, and we have no black run"; "layer 2's
  strokes still stay in the first"). Every line of a number was its own film of 72 %, so wherever the same brush goes twice (back to the leg's start, canon
  no. 9; the 15 mm lap after a dip; every corner) it drew darker: 31 % of layer 1's area. Now a number's lines sit whole in one group that holds the
  opacity, on the layers, the dry test and Result alike; only two different jars over each other come out deeper. The black that stays is real: number 19,
  Ink (Black since v.1.2.3), 3 cells at the lamp, kept by the jar canon (no jar within ΔE 25). Layer 1: 19 jars, layer 2: the 14 of two coats again. A view: the runs
  are as they were.
- **LAB 4.0 · dry test: how long the yellow dries before the red** (2026-11-09). The owner, of real 3's preview: "the yellow is all but covered by the
  red: it will be mush"; of the light under the dark: "what interval? how long is the light paint given to dry?"; "make a small sheet 20 × 20, we test how long
  it dries, I never counted". Five yellow bands (Indicator), one change of jar, then the red (Jar 32) on each at 5, 10, 20, 30, 45 min: across the band, from
  above 3 mm in with the idle run +2 mm as today, from below with idle 0. The machine waits by itself, the brush parked in the jar (rows of 10 s waits, as
  rembrandt.py takes them). ≈ 47 min (est.). Read on real 3 first: the darker jars after the yellow in the same run leave 32 % of it seen, their idle runs
  most of it (0 past the ends: 70 %); the second layer little. **Run the same evening** (LAB/IMG_2593 … 2599, `LAB/claude-grid-dry.jpg`,
  `claude-numbering-dry.jpg`): at 5 and 20 min the red's turns mix with the yellow and it runs into the red, at 30 and 40 min it holds: the yellow, with
  pouring medium, dries in ≈ 30 min. Along X the strokes lie where the plan has them within ≈ 1 mm (idle +2: the red 2 mm past the border; idle 0: on it);
  across Y the track is ≈ 8 mm, not 4: the bands 32 … 35 mm wide for 29 (est., no ruler). LAB opens on real 3 · layer 1 again.
- **LAB: real 3's first layer back on its key, `real 3 · layer 1`** (the owner, 2026-11-09: "we have layer 2 and Result, the two layers together, but
  layer 1 went missing somewhere; can you restore it, please"). It had never gone: sheet 16 was `real 3 · Porsche`, and Result, once on, stayed on at
  a pick of a sheet, so both keys showed the two layers together. Now the key says layer 1, and picking a sheet shows that sheet, Result off.
  Then the owner: "layer 1 is the same as Result". It was: the plan drew every stroke at 92 %, and two coats of 72 % make 92 % too. Real 3's
  layers now draw one coat each, a film of 72 % as Result's (est.): layer 1 lighter, Result deeper where a jar has two coats.

## v.1.2.2 — 2026-11-09 · COLORS

- **COLORS: the owner's sheets of 2026-11-08 again, dry, in daylight** (2026-11-09, the owner: "I added to LAB photos of the dried paint in
  daylight"; `LAB/IMG_2557 … 2570`). Every tube and every swatch ① … ⑬ measured again against the paper beside it in the same light. Wet under the
  lamp they had read 5 … 28 ΔE off: ④ Red is Jar 23's Red after all (ΔE 6; the palette's Red within 5), not "too cool"; ⑦ is the palette's Deep
  Red within 3 and redder than Jar 31; ⑤ lighter than Jar 27 (ΔE 14), no check for it; Naphthol Crimson a stand-in for Red, not near Jar 30;
  ⑧ and ⑩ still cool. On the dry readings Jar 13 and Jar 22 (③ with ⑧) come out darker and redder in the model (ΔE 15 and 14, est.): their cards
  say to look at their swatches first. The close-ups in low sun shine (8 … 17 ΔE lighter): not measured; ⑫ and ⑬ too dark for a photo (L under 5).
  The jars already mixed: their own swatches, dry, fill Dry LAB next.
- **v.1.2.2 on every tab and in the saved SVGs** (the owner, 2026-11-09: "thank you, it came out great. It can be pushed to GitHub;
  just a couple of words about COLORS, and this is already v.1.2.2"). The code and the notes; the photos of `LAB/` stay on this Mac.
- **COLORS, the library, a tab next to LAB** (2026-11-08). The owner: "README — sorry, I do not quite understand. Build a COLORS tab next to
  LAB, so that our library is there. Kuzya proposed cards"; "put the recommendations right in the cards!". A card a jar of LAB's real 3, in the tab's
  order and by its name there ("the names on the physical jars as on LAB / real 3"): Kuzya's card — Target, Mix recipe, Medium, Dry LAB, ΔE, Coats —
  and the Advice under the recipe; a pair of the same colour one mixing (29 · 30, 31 · 32, 35 · 36: 16 mixings); "Mark as mixed", a tick in this browser.
  The dark reds two mothers, Kuzya's way: Red from the tube (Jar 23) and Jar 43, Red with Dark Brown, every jar between of those two — the brown keeps
  the red warm where the owner's violet mixes (⑦ ⑧ ⑩ ⑫) cool it. Kuzya's scale 1 … 12 is real 3's own jars, to the digit. The paints on the shelf
  measured off the owner's photos (`LAB/`; the palette of 2026-10-12 in daylight, the sheets of 2026-11-08 wet under a lamp), in CIELAB unclipped,
  the paper beside each taken as L 95; the recipes by single-constant Kubelka–Munk, every paint of the same strength: all est., to be checked dry in
  daylight. `colors.html`, `src/colorlib.js` (the data), `src/colors.js`; the jars read from `labplan.js`'s `real3Of`, so the two never part.
- **LAB: Result, real 3's two layers together** (2026-11-08). The owner: "a result key, to see the whole result of the two passes". On real 3 and
  its layer 2: the first layer and the second coats over it, every coat a film of about 72 % of its paint (est.), so a jar of two coats comes out deeper; a jar
  picked in the list lit in both. A view of the plan, not a measurement; ▶ Play turns it off.
- **The canon of the jars: no jar with less line than the canvas's long side** (2026-11-08). The owner: "I do not have so many jars, nor do I see the
  point of nuances of RGB … take out the jars with less than the canvas's own long side, if they do not change the look; so under 20 cm. It can go into the
  canon." README, "How many jars"; `canon.js`'s `jarsByCanvas`: a short jar's cells to the nearest by colour that stays, no paint mixed ("simply find a
  neighbour a little farther, not merging the colour"); as a last resort it stays ("at worst, yes"), its nearest over ΔE 25 (est.). LAB's real 3, 200 mm:
  33 jars → 19, two stay short (Jar 5 the wing's pink, the lamp's ink), layer 2 14 jars; the page says which went where. FORM-G not yet: with the canon's
  switch, after real 3.
- **LAB: a jar picked in the list, and ▶ Play** (2026-11-08). The owner, of FORM-G's list (`FORM-G/for-lab2.png`): "the paints' selection, so that I study
  and get ready where which paint goes"; "and I need a play button as in OPM-G". A line of the list shows its strokes alone, the rest veiled, a dark rim under them
  (a light jar on the white); ↑ ↓ the next, Esc all. ▶ Play walks the sheet as it will run, number after number, the tip a dot, the idle runs walked not drawn,
  the number now lit in the list, how far and the time left (est.); 90 s, slow at first, as FORM-G's. `labPlan` gives its runs' tips for it.
- **The red 911's steering wheel** (the owner, 2026-11-08, asked whether the red should have the white's: "yes, I thought so too; the wheel must be added"): the oval
  ring of ink through the glass is the canon's now (`RedCar.WHEEL`), every colour's. The red: 49 jars, 936 cells, 119.9 m. Not run on the machine.

- **LAB 4.0 · real 3, the last sheet: a piece of the red 911** (2026-11-08). The owner: "before painting the red Porsche on the 70 × 100 canvas, better make a
  fragment of it on 20 × 20 cm"; "I prepared for-LAB.png … it will suit real 3 perfectly". `FORM-G/for-LAB.png` found in the red's picture (x 58 … 415, y 25 … 366 px),
  cut by F's frame (`framedPic`) 180 × 172 mm at its own size, round the left headlight: 33 jars, 24 of them two coats, 144 legs (29 under 10 mm), 210 runs, ≈ 30 min
  (est.) and 32 changes of paint; its second coats on `real 3 · layer 2`, ≈ 24 min (the red with its steering wheel, 1417e5b). A number a jar in FORM-G's order, the runs `formgplan.js`'s canon runs as OPM-G's,
  the strokes drawn 4.6 mm wide in their jars' colours, a swatch by each in the list. `src/labreal3.js` a snapshot (`FORM-G/generator/export_labreal3.mjs`).
  Before it, real 2's canvas read against its plan: `OPM-G/claude-numbering-real2.jpg`, `OPM-G/claude-grid-real2.jpg` (photos IMG_2438, IMG_2484 … 2486).
- **FORM-G: the white 911 in the canon's form, and thin lines by colour** (2026-11-08). `whitecar.py`: the red's `RedCar`, all of its geometry, its tones off the
  picture the owner and Kuzya made, `White Vintage Porsche 911, Saddle-Tan Interior.png` (asked which white: "the new, saddle-tan"; of a first try off a Singer-style
  picture, squeezed to 0.53: "the white must be built at 0.46, the red is the canon"; "the steering wheel is good"), laid on the canon along the car by the landmarks
  both pictures have and across every row by the two outlines, the glass and the louvres by their own boxes; its own jars, kept in `porsche-white.jars.json`; the
  steering wheel an oval ring of ink. 63 jars, 12 a second layer, 1219 cells, 154.7 m, ≈ 5 h 21 min + 54 min (est.).
  **The canon 4 % wider** (the new white is 0.475 width to length against the red's 0.458, every part along within 0.5 %; the owner: "its proportions are tasty",
  asked: "as the new, +4 %"): `WIDEN`, the red too. **The tail's lettering**, PORSCHE, seven red pieces of 4 columns, a column of the body between, 5 mm high
  (`porsche-logo.png`: "not a solid line … they read as sticks - - - -, the gaps white"). **Thin lines by colour** (`lines-.png`, the owner: "your line is for a
  drawing in very thin brushes; ours is almost 5 mm; solve it with several colours and the optical effect of a line"; "no more fat lines"; Kuzya, the owner agreeing:
  "the mechanics stay … what is thinner than the brush is given not by a line of its own but by the difference of neighbouring shades and a stroke's end"): no seam is a
  stroke any more; every column is cut where a seam crosses it, and the side the picture has darker is taken down next to it, across the car over its legs' last 10 mm,
  along it a column; the grille a dark mass, the louvres' block the carbon's grey, a hint, the slats and the intake's chrome pieces not strokes (Kuzya's (b): "the grille
  first one dark area; the louvres only hinted"). The mechanics untouched: the 5 mm brush, legs along X, canon.js no. 9, LAB 4.0, snake and idle, the dips. The red
  again: 49 jars, 940 cells, 119.4 m. Simulated and driven in headless Chrome; not run on the machine.

- **FORM-G: the red classic 911, `porsche-red`** (the owner, 2026-11-08: "a new classic Porsche for FORM-G, red; will you draw it on 70 × 100 cm?"; "do not
  spare the colours, 60 or 70 shades can be; the main thing is to make the geometry perfect"; "and we have the limit of 850 mm in height"). `FORM-G/generator/redgeo.py`,
  `redcar.py`: the green's technique (`hyper2.py`) on a geometry read off the picture itself and made symmetric about the car's axis — the outline; the glass, the louvres,
  the lights, the tail's bar, the carbon and the chrome tips found as regions of their own kind of pixel (black is dark and neutral: the body is a dark red, L* 27); the
  panels' seams fitted to the picture's own thin lines; no leg across a part's edge or a seam, no colour carried over one. Off, under the brush: the crest, the wiper.
  His comments on the first version (`comments-1.jpg`, `lights.png`, `roof-1-2.png`, on this Mac): 1, the fuel cap off ("take the black tank off the bonnet"); 2, the black
  shadow right of the bonnet's middle carried up ("a little further"), a column; 3, the bonnet's back edge arched, parallel to the glass ("it is straight now"); 4, the
  mirrors alike ("they are equal, symmetric"), the left one's light as the right's; 5, the rear window's two arcs of light ("I like the two arcs there"); 6, a thin white
  light along the rear wings' edge, both sides ("not as fat as on the right … a more pronounced, symmetric form"); the headlights' metal round the lens, a grey rim and
  crescent ("not just glass but a metal contour too … the volume comes at once"), the lens white with two or three black strokes ("the lenses must be white"); and the
  palette kept, `porsche-red.jars.json`, the first version's ("the roof was neater there"): an edit re-made the jars, 52 to 61, and with them every column. 843 mm long,
  not 850: at 850 the carriage ran 4 mm past the bottom wall, so the whole car 0.8 % smaller rather than its tips cut. 51 jars, 31 of them a second layer; 900 cells,
  1675 legs, 238.5 m, ≈ 4 h 35 min + 3 h 38 min (est.). Simulated and driven in headless Chrome; not run on the machine. The picture is another's: `.gitignore`.
  **The red is the canon of the 911's form** (the owner, the same night: "I would take the red one as the canon"; "can we fix the way this Porsche is made, to change the
  colours but not the form? We fussed long over the glass, redid the mirrors"; of the green: "it has some form an AI drew from memory").

- **F, the frame, on FORM-G** (the owner, 2026-11-08, after a talk with Kuzya: "go back to the Porsche 911 and stop the work on the G-wagon; it is not going for us, and the
  Porsche comes out well"; "test a 20 × 20 cm piece, how many paints mix, and then go back to the G-wagon"; "the G-wagon needs the format widened to 120 × 120 cm anyway, that is
  easier with the first sales"; then: "in OPM-W's Tools I found how to cut a fragment out, frame [ F ]; it can be carried into FORM-G"). OPM-W's F on FORM-G's page (and so on
  OPM-G's): a drag round a piece, or a click, a 200 × 200 there; with F on, a drag in the frame moves it, a click in it takes it away; **Whole picture** under The canvas. Only the
  legs in it are run, at their place from home, the page saying where its canvas's left and bottom edges lie; the frame on the pitch, a column in it when its whole track is, a
  leg cut at its top and bottom (under 3 mm there not painted), a cell broken where a leg falls out, a jar with nothing in it out of the list, the second layer's jars still last
  (`framedPic`). Kept per picture in this browser; the card's (i) still the whole picture's. The Porsche's richest 20 × 20, at 310 → 630 ↑ (the windscreen's right and the roof's
  edge): 51 of its 55 jars, 75 lines of the list with the second layer's, 26.1 m, ≈ 1 h 03 min (est.). Driven in headless Chrome; not run on the machine. The G-wagon's work
  (OPM-G's black G-wagon in modules) stays on this Mac, not committed, till then.

- **OPM-G, the G-wagon on 60 × 60** (the owner, 2026-11-07: "start with g-wagon.JPG, on a 60 × 60 canvas, with the new data of LAB / real 2"; "my one request: cut the colours
  from 60 to 36 … in the Porsche Jar 9 #E5E0CF is only 833 mm, I do not even see where it is on the canvas … merge them with others, so that every colour has some minimum of
  strokes, for example 1 metre at least"). FORM-G's page with its own library, `opmg.html` after FORM-G; FORM-G as it was. The picture by `FORM-G/generator/gwagon.py`, the Porsche's
  technique: a jar under 1 m of line as the list counts it is taken out and the picture planned again, at most 36 stay; the G-wagon kept **15**, the smallest 1.2 m, 7 of them a second
  layer: 22 lines, 141.6 m, 931 dips, ≈ 5 h 48 min (est.). From LAB's real strokes 2: no span under 12 mm (the Porsche's 8), a cut dearer; legs median 24 mm, 10 % under 12.
  By geometry, told to the owner, not hidden: the badges off (the star on the bonnet, the star and the plate on the grille), so the grille is its slats on the grid, every third
  column from the middle one, 15 of them; the bull bar's tubes 14 mm at least across a column (the photo's about 13); the headlights' bezels 9 mm at the top and bottom; the seats'
  red a little richer than through the glass, its own jar; the deepest black lifted to L* 13; the floor's shadow left out. Simulated only; `OPM-G/gwagon_60x60_hyper.jpg`,
  `gwagon_60x60_hyper_distance.jpg`. The photo is another's: `.gitignore`.
- **OPM-G's run by the canon of a long leg, no. 9** (README): `src/canon.js`, LAB's own code moved there (`startOnLong`, `ridersOnLong`, LAB's sheets as they were) and the
  landing inside a leg for FORM-G's plans; `idleRowsOf` takes runs laid already. Run through plotRun on the stand-in board, not on the machine.

- **LAB 4.0 · real strokes 2**, LAB opens on it, and **no. 9 is the canon** (the owner, 2026-11-06, of the first canvas, `OPM-N/IMG_2432`: "the third came out best, shall we multiply it?"; "the first is
  not needed at all"; of no. 9, "I would start from this and take it as the canon"; "shall we fix at once what is already known from the first run?"). README, "How a long leg is laid". No. 9's way four times, the long leg to the letter;
  a leg goes on what the brush holds only to 79 mm of plan, as the landing inside costs 16 more (`ridersOnLong`); a rope of short legs its own dip, landing inside its own line. 96 dips, ≈ 41 min (est.). Not run.
- **PAUSE / CONTINUE on LAB's page** (the owner, the same night, the run waiting for its second paint and the page with no key for it: "I did not even realise where to press"): the key goes orange, a yellow line says what to do; RUN's question says it will stop.
- **LAB 4.0 · real strokes** (the owner, 2026-11-06, of the ladder's paper `OPM-N/IMG_2419` with `OPM-G/porsche_70x100_hyper.jpg` and
  `watch_60x80_hyper.jpg` before him: "we plan to make such works"; he does not accept a pool after a dip; "remove the short drops"; "a test of the real strokes that
  we will have in the realistic works"). Two pieces of FORM-G's own plans (`src/labreal.js`, cut by `FORM-G/generator/export_labreal.mjs`) and a long leg with its dips in
  the middle of it, every cell with its idle run, two paints. No dip on a short leg: `startOnLong`, `dipsOnLong`. Four ways of coming from the jar, the same strokes: as today;
  out of the paint slowly, 3°/s to +22° (est.); landing inside the leg, back to its start (est.); both. 20 numbers, ≈ 39 min (est.). FORM-G's plan itself not changed. Not run.
- **FORM-G, a library of finished paintings** (the owner, 2026-11-06: "FORM-G is such a library of ready paintings"; "there will be no
  adding photos for an algorithm to redraw them somehow; only two pictures for now, I will simply ask you to add something else"; "the
  colour we already developed, we can take it from OPM-N"; "the only thing not in FORM-G is a different brush width, it is fixed at 5 mm";
  "no circles and squares to draw in the Tools, the palette is given"). `formg.html`, after OPM-N in the top row; `src/formgplan.js`,
  `src/formg.js`; its pictures in `app/formg/`, the Porsche on 70 × 100 and the watch on 60 × 80, made by `FORM-G/generator/`. OPM-N's DRAG
  SNAKE to the command: `idleplan.js`'s rows, `plotRun`, the question with Start from, the LCD, BACK ONE CELL, the iPhone's remote, ELBOW
  LIVE; OPM-N as it was but for one hook in `idleRunsOf`, a cell's own runs. **rembrandt.py as it was**: the run's note says `page: opmn`,
  the same brush, `tab: formg` for the journal.
  **The Porsche 85 cm long** (the owner: "more white background, the Porsche 850 mm"): 95 cm was past the machine's reach, 86.5 cm along X.
  Its plan solved again, 55 jars. The exhaust's tip 9 mm shorter than the photo's: with it the carriage, past a leg's end by the elbow's
  sweep, would go 6 mm past the wall. It lies with its bottom edge about 64 mm below home, as `calibration.json`'s 70 × 100 at 83.
  **Two layers, one list** (the owner: "we make the order of the paints such that somewhere on the second day of work the first layer dries
  and one can go a second time over it"; "those paints that go as the second layer, let them go second in the list"; "90 changes of jars by
  hand is natural work, several hours over 2-3 days, maybe 4-5"): every jar once, light to dark, then the 27 that need it in the same order,
  each a line of the list, reached by Start from on another day; the pause between the layers says to let it dry. The second time a cell runs the
  other way round, so that its dips do not fall on the first's (est.). A cell's own module as OPM-N's in both: its snake, at once its idle run.
  A canvas placed so that the brush would go past a wall is refused, not pressed into it; the range comes from `plotRun`'s own carriage.
  The Porsche 216.6 m, 82 lines, ≈ 6 h 00 + 3 h 47; the watch 109.2 m, 37 lines, one layer as its picture, ≈ 6 h 34; all est., the jars' changes apart.
  The real Runner took a posted run to its end on the fake board, the cup at hand's guard on; not run on the machine.
  Red and black Porsches: later, a new entry in the library, the jars solved again.
  **The library by the picture, on the right** (the owner: "I would not put THE LIBRARY before PROGRESS; better on the right, there is plenty
  of room there; one picture to a row, not two, and a little smaller"), PROGRESS first in the panel; a picture's numbers in its card's (i), on
  hover ("we do in an (i), on hover"), by a tap on a phone. **▶ Play with PROGRESS** ("an interaction with PROGRESS, so that the colours and the
  % show on the screen"): the %, the time left (est.), the jar now and the next, the list's marks, as OPM-N's Play; OPM-N's clock too, three
  minutes, for 82 lines in some 20 s could not be read; the idle runs walked but not drawn, so that the % is the run's; a run on the machine
  goes before it on the LCD, and starting one stops it.

- **OPM-N's DRAG SNAKE: a small pointed cell's legs no longer stand in its corners** (the owner, 2026-11-06: "you can
  fix the legs"). Laid evenly from edge to edge, a cell's outer legs fell into its sharp corners, with no length; it was
  painted by the pressed step between them, or by one short leg alone (p14 of the first canvas: 3.1 mm in a 149 mm² cell). When the corners
  take legs and fewer than three stay, as many legs stand each in the middle of its own equal strip of the width, the idle
  run's too. Cells keeping three or more, LAB's modules among them, are laid as before, to the letter. On the first canvas's plan 22 of
  58 cells change: the tip's track over 92 then 93 % of all, over 80 then 90 % of the cells under 3 cm², 11.35 then 11.97 m,
  62 then 66 dips (est.). Seven small cells lose their one diagonal stroke to a short zigzag. Not run on the machine.
- **The artist decides what, the brush how: a working rule in `README.md`** (Kuzya, 2026-11-06; the owner, asked
  if it goes into the README: "yes"): an algorithm may adapt a painting to the machine, but it must never silently
  change the artist's intent.
- **LAB 3.0 · ladder**, the next sheet on THE SHEET, before OPM-G's tab (the owner, 2026-11-06: same-colour
  cells "may be joined", and the ladder sheet "only after you read Kuzya's answer"; Kuzya: test A "suits me", coverage
  and shape fidelity as two metrics). One 20 × 20 canvas, 36 numbers, 47 runs, ≈ 9 min (est.): 5, 8, 12, 16,
  24, 32 mm alone by their own dips, one dip shortest first and longest first (the line since it in each number's
  words), 5, 8, 12 over a 4 mm landing and lift, snakes with no idle and with it, three short shapes. Its snakes are
  what OPM-N's DRAG SNAKE lays for that rectangle (`test/labplan.test.js`). Not run on the machine.
- **Kuzya's research note on the first canvas and OPM-G**, `OPM-G/docs-6-11-2026/Rembrandt_OPM-G_Analysis_EN_2026-11-06.pdf`
  (the owner, 2026-11-06: "there is a PDF, Kuzya made it. It can go on GitHub just as it is").
  Six pages, written before OPM-G's second try. No code changed; OPM-G itself is not built.

## v.1.2.1 — 2026-11-05 · LAB and the rubber brush

- **v.1.2.1 on every tab and in the saved SVGs** (the owner, 2026-11-05: "it can be committed, by
  the way; we have not pushed to GitHub for a long time. Let this version be v.1.2.1, and please
  write something about LAB and what is new"). The code and the notes; the photos stay on this
  Mac until the owner's word.
- **OPM-N: BACK ONE CELL and Start from** (the owner, 2026-11-05, `OPM-N/IMG_2367`, the third
  paint come out badly at 86 %: a key before STOP and HOME; "I meant to say back one cell"). The key, as a
  player's ⏮: the brush already painting a cell, this cell again; not yet (in the air, in the cup,
  at a colour's pause), the cell before it, across a colour too. A colour's first cell goes by its
  own pause; any other cell of another colour asks whether its paint is in the cup. `rembrandt.py`:
  `back_one`, `POST /run/back`; a restart when no run is on. Pressed, the key says for 4 s where it
  goes and the LCD's % goes back with the jump ("the % should rewind"); a refusal is an alert. The
  iPhone's Back is unchanged. DRAG's
  question has **Start from**, the run from a later colour on, this question only, the first by
  default: for a run already stopped, whose jumps are gone.
- **OPM-N's DRAG SNAKE is LAB's + idle 6.0** (the owner, 2026-11-05, `OPM-N/IMG_2363`: "LAB may
  count as work successfully finished"; "+ IDLE 6.0 is to go into OPM-N's painting algorithm";
  of nos. 1 and 4, "at the end +2 mm is not needed, just 0 mm"; of 7 and 8, "we leave them as
  they are"). Every cell, whatever its shape: legs only up and down, cut by its contour, half
  the brush tip in from it, a dip every 95 mm of line; then at once an idle run, no dip, closer
  together, +2 mm past the ends, 0 at its very end; with a slanted side +3 to the end. Landing and
  lift by the carriage against the elbow (`strokes.js`, `sweptMove`, on a row's `sweep`). A small
  cell goes on what the brush holds while Dip every lasts. `src/idleplan.js`; a test holds it to
  LAB's commands, nos. 1, 4, 7, 8. New sliders: Track step, Idle step, Brush tip, Idle past the
  ends, Idle past on a slant; a save from before takes the canon once (Dip every 95, overlap 15,
  25 mm/s, pressed 0°). DRAG AIR as it was, with Track width and Rubs. LAB unchanged, finished.
  Tests, headless and a fake board only, not run.
- **▶ Play Drag Snake**, OPM-N's third Play key (the owner, the same evening: "so that it is clear
  how it paints"): run by run, the first in its colour, a black dot at every landing from the
  jar, the idle run a thin orange line, slowly at first, three minutes at most.
- **LAB 3.0 · + idle 6.0**, a third row on THE SHEET (the owner, 2026-11-05 evening, a rubber
  brush, a Colour Shaper soft no. 2: `OPM-N/IMG_2356`, "the best quality, what I want from
  robotic painting: inhuman precision of the line"; `IMG_2357`, along Y dashes, "it cannot
  paint horizontally at all"; `IDLE_6.0.jpg`, "no horizontal lines at all, we build them from
  many flattened verticals; the brush never paints left-right"): + idle 5.0's verticals at +2,
  +3, +4, to the letter, and three modules of the same 80 × 17.5 mm lying down: 15 legs of
  17.5 mm along X, 5.71 mm apart, a snake, four legs a dip, each run landing on a leg and
  pressed to its last leg's end; idle, 19 legs, 4.44 mm apart, within the 80, +2 … +4 mm past
  both ends. The steps at the turns remain, 5.71 and 4.44 mm sideways, the brush down. Then the
  diagonals (Screenshot 7.36.26 PM, "let us just add the diagonal ones"), 7 and 8 in the free
  corner, as the owner drew them: parallelograms, a flat top and bottom, 60 mm wide, 30 high, sides at
  45°, leaning ↘ and ↗, the same legs along X cut short by the sides, 6 mm apart, five dips,
  a step between two cut legs going along the side; idle, 20 legs, +3 mm. 8 numbers, 42 runs;
  the page opens on it. Tests, headless and a fake board only, not run.
- **The canon: a module with the rubber brush** (README, the owner, `IMG_2359`, Screenshot
  7.16.23 PM: "I chose 2, 3 and 4, this is canon"; of no. 5, "its tail is too long already"):
  + idle 5.0, 19:00:31 … 19:13:06, 755 s, no error, its verticals at +2 … +4.
- **LAB 3.0 · + idle 4.0 and + idle 5.0** (the owner, 2026-11-05, `OPM-N/IMG_2308`, Screenshots
  3.21.19 and 3.21.38 PM): 4.0, "five idle passes that do NOT go past the module's SIDES; the
  snake of five fits in the cell's width": the five shared out between the first run's outer
  tracks, over 1 … 5 at their ends. 5.0, "the last of the four strokes with a dip reaches only
  the middle of the module, then rises before the brush gets to the end; make + idle 5.0 with
  the five pressed in": 4.0, and that last track pressed to the cell's end, its lift beyond
  (it stopped pressing 8 mm short, the carriage going back). The second row a well of its
  own, four keys; the page opens on 5.0. Tests, headless and a fake board only, not run.
- **LAB 3.0 · + idle 3.0** (the owner, 2026-11-05, `OPM-N/IMG_2305`, a blue line over a cell: "an
  idle run in five passes; it will knock down the first four furrows with the dips more
  aggressively"; "exactly the same button"): + idle 2.0's cells, first runs and overs, its
  idle run a track more, half a step aside, on the ridges: between the first run's tracks and
  outside the outer two. Tests, headless and a fake board only, not run. The fixed + idle 2.0
  ran at 14:29: the last track reaches the corner, dry, about 3 … 4 mm short (est.), was 10 … 13.
- **LAB 3.0 · + idle 2.0**, a second row on THE SHEET (the owner, 2026-11-05, `OPM-N/Idle+.png`,
  after `+ idle` ran at 13:14: "it starts a little earlier, to catch the bulb of paint from
  behind, not to poke the brush into its centre"; "poked in the centre the paint stays a
  drop and does not drag the trace to the middle", `IMG_2294`; "+1 mm at the start and +1 mm
  further at the end"; a ruler, `IMG_2299`: "here one can take all 5 mm"): the idle run off
  the first's line, every track longer by 1 … 5 mm at both ends, its turns out beyond the
  cell, the first run as the long snake's. Five 80 mm verticals, five horizontals, 50 runs,
  40 dips; three and two horizontals, five with their bulbs not fitting A3's 420 mm in a
  row. The idle run in orange on the page. It ran at 14:12 on A3 (`IMG_2302`, `IMG_2303`): the
  starts better, "but there is no past its end +5, all as on no. 1": the plan pressed the
  last track only to 8 mm short of the end it named, the lift taking the rest (no. 5: to
  177, a cell's end at 180). Fixed the same hour: the line 8 mm longer, pressed to the end +
  over, the lift beyond it; the sheet 10 mm to the right to stay in reach. Not yet run again.
- **LAB 3.0 · snake + idle** (the owner, 2026-11-05, of the long snake on the flat Da Vinci
  no. 2, `OPM-N/IMG_2270` … `2276`: giant bulbs at the ends, the paint gathered there, then
  a bald patch, the small brush out of paint; "a second run without a dip, that spreads
  the paint gathered at the edges"; `Screenshot 12.50.03 PM`: "first the run with the
  dips, then the idle one"): the long snake's ten cells in their places, each painted with
  its dips, then at once its whole line again from its start, one run, no jar, no shoulder.
  60 runs, 50 dips, about 13 min real (est.). A seventh switch, `+ idle`; the page opens on
  it. Tests, headless and a fake board only, not run on the machine yet.
- **LAB 3.0, cells one way** (the owner, 2026-11-05, of the pink sheet's 23, a cell
  one way, with the fur: "my favourite"; "yes, do LAB 3.0"): eight cells, every track
  one way with its own landing and lift, the carriage 1.25 mm/°: across → and ←, along
  ↓ as a control and with a dip before every track, the four diagonals. A short sheet,
  242 × 120 mm, the last ran out of paper. Four tracks a cell at first, a field to 8, the
  cell's width kept (a ruler at 01:23, `OPM-N/IMG_2237`: "the stroke is almost 1 cm; 8
  strokes lie one on the other; let us make 4"). **Every LAB sheet ends at home now**
  ("it stops there, I go to OPM-N and lead it home from there"), the brush up first, as
  OPM-N's run, and a HOME key on the page. The 8-track sheet ran on its first two cells
  and was stopped by the owner; the 4-track one ran whole at 01:30, 4 min 40, no error: "a
  much better result, excellent strokes". **LAB 3.0 · long** the same night ("but what
  about the length? we have long ones … 60 mm 4 strokes, 80 and 100, and 40 of course"):
  on a new sheet ("the vertical ones, but add the horizontal too, the same system of
  sizes"), tracks 40, 60, 80, 100 mm, vertical and horizontal, every track on one dip
  to show how far a dip carries, and a 100 of each with a second dip at 60, its seam
  5 mm over. OPM-N's Track width still stops at 4 mm (TRACK_MAX): to be raised for 5.8.
  It ran at 01:52, 9 min 50, no error (`OPM-N/IMG_2242` … `2247`): a dip carries a cell
  of 40 mm whole, 60 nearly, 100 "a reject"; the 5 mm lap left the parts end to end.
  **LAB 3.0 · seam**: 80 mm, a second dip at 45, on from 10, 15, 20 mm back, both ways.
  **LAB 3.0 · long snake**, to run first (the owner, the same night: "all your tests were
  in the style of Drag Air, and I never use it; my guess is that with Drag Snake 4, 8 and
  9 get right; make long-snake, Seam afterwards; we compare where the stroke is neater"):
  the long sheet's cells, places and numbers, a snake, the brush down at its turns, cut
  as OPM-N's `dragRowsOf` cuts it (`snakeRuns`, a test against it), as much paint as the
  long sheet: four dips a cell, 5 and 10 a dip every 60 mm, the lap 15 mm.
- **LAB 2.0, the second sheet** (the owner, 2026-11-04, of the first: "yes, I agree
  with you; a second sheet round 10, 11 and 12 too"; "21 goes with the fur, 20
  against it"): 24 numbers, 43 runs of the brush, about 11 min. The carriage against
  the elbow at 0.5 … 1.5 mm/°, → and ←, the four diagonals, along, pressed +1 … +3°, a
  shallow dip; five real cells, tracks 2.5 mm apart, a dip every 75 mm, a 5 mm lap: a
  snake across as tonight and against the elbow, along, on the diagonal, and along
  one way, every track with the fur. A switch on LAB's page, the first sheet kept.
- **LAB, a sheet of trial strokes** (the owner, 2026-11-04, "yes, you may stop and
  start again"): 21 numbered strokes on a scrap, about 6 min, what can be told in
  minutes what a run tells in hours. `lab.html`, `src/labplan.js`; W 3 on the path
  needs no flash, one W on a piece, the wrist straight again before every dip.
  On the fake board with the guard on, the whole sheet to its end. Not run on the
  machine yet: the wrist's strokes the hand on STOP.
- **A late or lost reply no longer stops a run** (the owner, 2026-11-04: "you may
  stop and start again; I am ready to restart rembrandt.py", after two stops of a
  six-hour run, at 1.7 % and 48 %, the arm fine both times). The board's replies
  carry no number, so a reply past its wait was taken for the next command's:
  "shoulder: ok Z 3", and very likely "the shoulder does not answer" too.
  `Board.send` now waits for its own line, V, P, Z, H and J, or the board's refusal,
  a late one passing by; none in time, `NO_REPLY`. J and Z wait up to 1 s. A silent
  read is read again, about 1 s in all before "does not answer"; Z is asked again
  until all three are read (`ok Z 3`, before any step); no answer to J is looked at,
  not a stop, the step sent again if the joint is not there; a ping lost is asked
  again. Every such event a line `bus` in the journal. The path's own lines as they were.
- **OPM-N the home page** (the owner, 2026-11-04: "I would make OPM-N the index;
  INKA is in the archive anyway"): `/` goes on to OPM-N, the first of the top row;
  its page stays `opmn.html`, so its saves, its tick and a tab open during a run
  keep their address. INKA's page is `inka.html`, off the row, its Preferences
  tick and its saves as before.
- **The red trail after a reload** (the owner, 2026-11-04: "the red trace goes in
  a spiral, with rounded edges"): a page reloaded during a run keeps no copy of
  the run's blocks, and `drawTrail` fell back on `dragRun()`, INKA's spiral, under
  the run's block numbers. Now the plan with as many blocks as the run, OPM-P's
  `paintRun` on its tabs, or none at all. The machine was never on that spiral.
- **The iPhone's Progress tab** (the owner, 2026-11-04, the first run with
  paint: "add to the iPhone's screen a tab with the yellow PROGRESS and a
  mini-screen with the picture; in six and a half hours I may be anywhere").
  `remote.html`: Remote, the keys as they were, and Progress, looks only: the
  page's LCD (step, per cent, LEFT, TOTAL, ENDS by the clock, the colour and
  the next, cell and dip); the next paint change, its colour and its time; the
  canvas as the page shows it, X up, Y along, painted solid, the colour now
  bright, the rest faint, the brush a dot. LEFT goes by the paint this phone
  sees laid while the machine runs: a Go to or a pause counts for nothing, the
  stops for the paint on top. `rembrandt.py`: `plan_picture`, `GET /remote/plan`
  behind the key, reading the blocks of the run, 44 ms and 127 KB for tonight's
  18842 blocks; nothing moves. 2 tests more.

## v.1.2.0 — 2026-11-03 · The cup at hand

- **v.1.2.0 on every tab and in the saved SVGs** (the owner, 2026-11-03:
  "yes, you may push the code and the README. It is a full update, v.1.2.0
  — write a couple of lines on GitHub and leave it open; chat-Claude and
  Kuzya read it"). The last 60 × 60 of the Library (2026-11-02 21:11, the
  night's SNAKE and Dip overlap 5), OPM-N's own estimate: ≈ 8 h 33 min with
  the Ink tab's cup, 7 h 28 on the beam (02:15), **6 h 31 at hand** (est.;
  1880 dips, 129 m of brush) — the model within ~3 % of the 02:15 run's
  measured pace. As saved (AIR): 9 h 36 → 7 h 35.
- **INK-Y: the cup at hand, in the beam's place** (the owner, 2026-11-03,
  `OPM-N/IMG_2108…2121`: "not two jars at the sides of Y, but a jar right
  by the arm. No need to drive anywhere … the jar is always at hand"; his
  rules in README, **How to dip**, "and this is the canon"). The jar on a
  bracket bolted to the carriage by the arm, above the canvas. plotRun
  (`handDip`): the carriage to the line's start, then the five steps there —
  `J 2 32.5` in the elbow's fork +30 … +35°, the shoulder to +32.5° in its
  fork +30 … +35°, `J 2 15` in the paint (+14 … +16), the dwell, the elbow
  up, the shoulder back within 1.5° of 0 — the carriage standing; a run
  starts with the elbow up and the shoulder at 0 before the wrist. A block's
  `fork` (checked before a run): there anywhere in it, every whole step
  landing in it (`Arm.move_to(…, fork)`), aimed at its middle — the servo
  stops up to ~1° short. **The guard** (`hand_guard`, `hand_refuses`):
  while `ink.json`'s `hand` is on, every turn of the arm — a run's, a jog's,
  /brush — is refused when the shoulder would turn with the elbow out of its
  fork up, the elbow go below +14° or the wrist turn with the shoulder off
  0; a fork it cannot read is his. `_unswing` lifts the elbow into its fork
  before the shoulder goes back (a jump, the next run after a stop over the
  jar); the iPhone's DIP the same five steps, no flight. The beam's flights
  and the turns on them gone (`moving`, `_start_turn`, `_turned`);
  `wipeBlocks` without the beam's turn. The tab: ON · OFF, the steps'
  forks, Try one dip, Now (may the shoulder turn?), the elbow from the side
  and the shoulder from above. `/run` says `hand: 1`; an older
  `rembrandt.py` gets an alert, no run — he restarts it. Tests 451, the
  runner's 108; a D1 plan through the runner: 16 turns of the shoulder, the
  elbow at +32 … +33° at every one.
## v.1.1.9 — 2026-11-03 · INK-Y

- **INK-Y: the shoulder turns on the flights** (the owner, 2026-11-03,
  `OPM-N/IMG_2073.MOV`, 20 s a stroke: "the machine drives to the cup and
  at the same time the shoulder turns −24° … back to the cell, and on the
  way the shoulder to 0°"). The board takes no J once a path runs, but runs
  a path while a joint turns: a joint block marked `moving` is sent and not
  waited for (`Arm.move_to(…, wait=False)`), the flight after it at once;
  the runner sees it there — or finishes it — before the arm's next command,
  a wait or a paint move (`_turned`), never during the flight (a Z then
  would brake it). plotRun: the turn out before the flight to the cup, the
  turn back before the flight to the row; `wipeBlocks` moves the pair. No
  firmware change. On the 23:53 run ≈ 7 h 53 → 7 h 14 min (est.). Tests
  452, the runner's 106.
- **INK-Y: the shoulder's dip turns let off 1.5°** (the owner, 2026-11-03,
  the first run with INK-Y, `OPM-N/Screenshot 2026-11-03 at 1.35.26 AM`:
  after the second dip "shoulder to 0°: the shoulder does not get to 0.0°",
  INK-Y read −0.6° — "maybe just ignore such deviations?"). The firmware
  turns whole degrees; the servo stood 0.6° short and a 1° nudge did not
  move it, six times. `Arm.move_to(…, within)`, a joint block's `within`
  (0.6 … 2°, checked before a run), plotRun's shoulder blocks 1.5
  (`SHOULDER_WITHIN`, est.), the runner's own turns `DIP_WITHIN`; a turn
  that stops 0.6° or more off goes on and is written to the journal,
  `near`. `/run` says `beam: 2`; an older `rembrandt.py` gets an alert, no
  run. Tests 452 and the runner's 106.
- **INK-Y: the cup on the beam; v.1.1.9 on every tab and in the saved
  SVGs** (the owner, 2026-11-03, `OPM-N/IMG_2060…2062`: "the jar somewhere
  near … it is enough to drive along Y. SHOULDER turns −25.1°, then ELBOW
  dips −5°. Then up and back. All as now, only the jar not at a fixed point
  as on INK, but riding on the beam Y"; "let us write a tab INK-Y for it,
  the old one with the fixed jar I will hide … and this is 1.1.9"). A new
  tab after Ink: the cup's Y and the shoulder's angle, taken at once by
  Here, its elbow's numbers the Ink tab's till typed, Shoulder speed 40°/s
  (est.), the jog with a SHOULDER handle, the beam and the cup drawn from
  above; kept in `ink.json`'s `beam`. Once set, every dip goes there
  (`ink.js`: `cupOf` the beam's, `tableOf` the Ink tab's, `beamOf`):
  `plotRun` flies along Y alone from where the brush left off, a
  shoulder `joint` block over the cup and one back round the elbow's dip,
  the arm straight at the run's start; `wipeBlocks` keeps the brush over
  the cup at a colour's pause. `rembrandt.py`: `cup_of` takes the cup on
  the beam, the iPhone's DIP goes there (or only in and up when the brush
  is over it already), the shoulder turned back by itself before ⏮ Back,
  ⏭ Skip, ▶️ Go to and at the next run after a stop over the cup; `/run`
  says `beam`, and the pages refuse such a run on an older `rembrandt.py`
  — he restarts it. On the 23:53 run: the flights to the cup 919 → 498 m,
  ≈ 8 h 33 → 7 h 53 min (est.). His red pen run of 23:53 was DRAG SNAKE;
  its diagonal cells' tracks in pairs on paper, the plan's even (OPM-N.md,
  2026-11-03). Tests 452 and the runner's 105.

## v.1.1.8 — 2026-10-30 · 11-02 · OPM-N

- **OPM-N: 🖌️ Dip overlap, its slider green** (the owner, 2026-11-02:
  "add a brush emoji at its start, please — a million settings there, but I
  will see it at once; and the slider itself green, as ELBOW LIVE ·
  PENCIL"). The label and the groove only.
- **OPM-N: Dip overlap — after a dip in a track the brush starts 5 mm back
  over it** (the owner, 2026-11-02, the first DRAG on paper, `OPM-N/IMG_2056`:
  a 5–6 mm gap at every such dip; "maybe count in the coordinates not the
  literal landing of the brush but with a compensating −5 mm"). The plan,
  rebuilt from the journal's settings (17089 blocks, as run), went on from
  the very point: the gap is the brush landing and lifting on the move.
  `dragRowsOf`'s `lap`: a row after a dip in a stroke starts its last lap
  mm again, half a dip at most, `info.lap`; between strokes none. A slider
  in Painting machine, 0 … 15 mm, 5 (est.). On his run: 17225 blocks, ≈ 3
  min more.
- **README: the brush lands and lifts on the move** (the owner, 2026-11-02:
  "we have this all the time; I would write it in the README, because it
  has been more than once"): the cause, NOLAN's, TAPE's, INKA's and OPM-N's
  cases, and the rule — a line cut for a dip, a segment or a stop goes on
  from back over itself.
- **OPM-N: the blend in Construction, the core always filled, no list or
  Nodes** (the owner, 2026-11-02: "into the CONSTRUCTION module at once
  … take away Core filled, Core empty — I never leave it empty"; of Blends
  and tiles and Nodes: "I do not use it, it only makes noise"). The chosen
  blend's editor first in Construction; Core filled · Core empty gone, a
  blend's core filled at every load; the list, New, Draw one, Nodes, From
  the snake and Clear nodes off the page — `inka.js` sets them only where
  they are.
- **OPM-N: the rows' step up to 45 mm** (the owner, 2026-11-02: "I need it
  up to 45 mm. It is important for big formats"). `PITCH_MAX_N` in
  `opmplan.js`; OPM-P's brush width 20 at most, as it was.
- **OPM-N: 🟥 STOP and ▶️ Go to on the iPhone** (the owner, 2026-11-02:
  "on the iPhone let us replace the Stop icon with 🟥 and add ▶️ Go to,
  without №"). The labels only; `remote.html` is read at every request, so
  a refresh on the iPhone shows them, no restart.
- **OPM-N: ⏮ Back, ⏭ Skip, Go to № on the iPhone** (the end of step 5 of
  `OPM-N.md`; the owner, 2026-11-02, the remote open on his iPhone: "let us
  make ⏮ Back, ⏭ Skip and Go to №, the next step"). The runner's `goto`
  (`/remote/goto?n=`, a cell of the colour now), `back` (this cell again,
  `/remote/back`) and `skip` (the next one; after the colour's last, on to
  its pause, `/remote/skip`): the brush up at once — a pass braked on its
  line as for Pause — through the air to the cell's first track, the elbow
  as the plan has it there, down as the plan lands it, on; a cell that
  starts its row by the row's own flight; no dip by itself; the per cent
  where the cell is; every one in the journal. Where a cell starts, by the
  page's rows: right after a turn through the air, the landing nearest its
  mm, else the first piece at its mm. `from_piece`: a block from a piece
  on, the W of that piece too. On the iPhone a row ⏮ Back · ⏭ Skip · Go to
  №, Go to a number pad, 1 … the colour's cells; a refusal's why for three
  seconds. Checked on the page's real blocks (plotRun, a dip every 75 mm):
  all 1033 cells of the test blend found, Snake and Air, 0.08 mm off at
  most. Its tests: Back in the middle of a cell, Go to a cell that starts
  its row, Skip after the colour's last cell, no such cell.

- **OPM-N: the iPhone remote — DIP, Pause · Continue, STOP, the colour and
  the cell — with a key** (step 5 of `OPM-N.md`; the owner, 2026-11-02:
  "I am ready to test, but for the iPhone I need the Wi-Fi address"; asked
  whether `rembrandt.py` may listen on the home Wi-Fi with a key: "yes,
  with the key"). `rembrandt.py` listens on the Wi-Fi too
  (`REMBRANDT_LISTEN=127.0.0.1` keeps it on the Mac): from any address but
  this Mac's only `/remote` and its calls, those with the key of
  `app/remote.key` (made at the first start, kept off git). `remote.html`,
  `/remote` on the iPhone: the colour's swatch and name, **Cell 3 / 8**,
  the colour of so many, the per cent; **DIP** the biggest; ⏸ Pause · ▶
  Continue; ■ STOP, a second tap within 3 s; at a colour's pause "Next: … —
  wipe the brush, change the cup, ▶"; the dips so far. The runner's
  **DIP** (`Runner.dip`, POST `/run/dip`, `/remote/dip`): a pass brakes on
  its line as for Pause, the brush over the cup's rim, to the cup the run
  was started with, into its paint for its dwell, back to the same point,
  down, on; paused, it dips and stays paused; every dip in
  `logs/runs.jsonl` with its colour and cell, the plan's own too ("by":
  "plan" or "hand") — the journal's raw. OPM-N sends the cup, the travel
  and its rows' colours and cells with DRAG; **iPhone remote** under
  Painting machine shows the address with the key as a QR code (`qr.js`,
  byte mode, M, versions 1 … 10 — every one read back by macOS's own
  CoreImage). Verified on a second server on port 5199, no board: the
  iPhone's page and the QR. Back, Skip and Go to № next. `rembrandt.py`
  takes all this at its next start. Its tests: DIP on a pass and paused,
  no cup no dip, the colour and the cell, the gate and the key.

- **v.1.1.8 on every tab and in the saved SVGs** (`rembrandt: '1.1.8'` in
  their metadata; the owner, 2026-11-02: "and we are 1.1.8! :)"). Not
  pushed.
- **OPM-N: the paint from the cup — a dip at every colour's start, then
  every 75 mm of track, for now** (step 4 of `OPM-N.md`; the owner,
  2026-11-02, asked how to paint till DIP comes from the iPhone: "every
  75 mm, for now"). `dragRowsOf`'s `every`: a colour's row cut where the
  brush has painted so much — between two strokes when it has painted half
  of it at least and the next would go past, else in the stroke, back to
  the same point; never for the last quarter of it — and plotRun dips in
  the Ink tab's cup before every one, its pause between colours only, the
  brush up over the cup to wipe it and put the next colour in. **Dip
  every** in Painting machine, 75 mm (0 … 200, est.; 0 a colour's first
  alone); DRAG asks for the first colour in the cup and stops if the cup
  is not set. No runner change. On his save of 14-53: 1983 dips, 10 h 28
  min where 3 h 22 without them — the cup 867 mm along X, far from the
  canvas. Its test: every mm painted still, every row within 75 mm (the
  last 25 % more), a dip before every row, no fault.

- **OPM-N: DRAG SNAKE · DRAG AIR in the deck; the views Drag · Preview ·
  Contour · Numbers · Result** (the owner, 2026-11-02: "Painting machine is
  not very handy; let us make DRAG Snake / DRAG Air keys"; "Paint replaced
  by Numbers, where the numbers are, and the last one Result — it has to be
  added — the final version, without numbers"). DRAW BW · DRAG SNAKE · DRAG
  AIR in a row, the Snake · Air switch gone from Painting machine; the key
  pressed sets the way, the views and ▶ Play Drag go by it; the one running
  lit. Numbers is Paint as it was; Result every cell in its colour, no
  number, no contour, where a deal of new colours goes. Verified headless
  on his save of 2026-11-02 14-53 (21 colours).

- **OPM-N: no colour in fewer than five cells but one, the accent, in
  one** (the owner, 2026-11-02, Crimson Lake in one cell, Salmon Pink in
  two, Sky Blue and Sky Blue Light in one each, 29 colours: "one colour in
  one cell; then at once five cells at least … not two colours of one cell
  each in one picture, not three"; "change the brush for one stroke?").
  `opmpPlan`'s `fewCells` (5, `FEW_CELLS`), OPM-N's alone, in place of
  next to nothing to paint: a colour in fewer cells left out, its cells to
  the nearest of the rest, again till none is; one in a single cell stays,
  the accent — of those, the one its nearest would change most (ΔE 2000).
  The accent `1 · accent` in the box; the left out under Painting
  machine's (i). On his save of 2026-11-01 20-50, where 20% Warm Grey had
  3 cells and Brown 1: every colour five at least, 20% French Grey the
  accent in one, 26 colours as before. Its test.

- **OPM-N: a cell's tracks, Snake · Air, Track width** (step 3 of
  `OPM-N.md`; the owner, 2026-11-01: "the tracks laid by the track's
  width, not the brush's size"; "two options: back and forth, and through
  the air"). `tracksOf` and `cellDragsOf` in `opmplan.js`: a cell on its
  own, its tracks along its row — a ray's cell's along its strip, a wedge
  shorter along its row than across along its long edges — k = ⌈W / T⌉,
  the outer ones T/2 in, none further from the next than T (a cell within
  5 % of T one, in its middle), cut by the contour, a trapezoid's ending on
  its rays; Snake back and forth with the brush down, Air every track one
  way, the brush up and back; every track Rubs times. DRAG, Drag and ▶ Play
  Drag by them: a colour's cells by their numbers, up through the air from
  cell to cell, a pause between colours. Painting machine: **Snake · Air**,
  **Track width** 2.5 mm (2 … 4 in 0.5, est.), Brush speed 25 mm/s on
  OPM-N's first visit since (the owner's); the rows' step in Construction
  (it makes the cells now, not the brush). DRAG's question: no dip from the
  cup yet (step 4), the brush loaded by hand. Its tests: the tracks of every
  cell of two blends, and DRAG by cells on the machine, no fault.

- **OPM-N: every colour's cells numbered** (the owner, 2026-11-01: "not
  continuous numbering but by colours … the numbering goes from the centre
  clockwise … 1 — by the clock face it is midnight"). `numbersOf` in
  `opmplan.js`, step 2 of `OPM-N.md`: every painted cell its ring (the
  blend's bands from the middle out, the core's first) and its hour (round
  its band's own middle from 12 o'clock clockwise, one across 12 o'clock
  the first); a colour's cells by figure, ring, hour, 1 … n. On Paint and
  Contour in the cell's middle, as big as it holds, none under 6 px; the
  chosen colour's strong, the rest faint; a line under Painting machine's
  (i). Its test: 1 … n a colour, the middle out, clockwise, a figure after
  another, every label in its cell.

- **OPM-N: the brush's elbow may rest on the paper; acrylic and pouring
  medium ≈ 1 : 1** (the owner, 2026-11-01: "yes, may and even must"; "I
  have no scales … probably 15 g of acrylic + 15 g of pouring medium" in a
  50 g jar). `opmn` in `rembrandt.py`'s `PENCIL_PAGES`, as OPM-P's and
  FORM's: a run on OPM-N goes on when the brush lands and the elbow stays
  up to 10° above its pose; its runner test with OPM-B, S, W and P. The
  ratio, by eye, in `OPM-N.md` and §1. `rembrandt.py` takes it at its next
  start.

- **OPM-N, a new tab before FORM: OPM-P's page under its own name** (the
  owner, 2026-11-01: "I propose to call the tab OPM-N (Numbers)"; "OPM-N is
  now v.1.1.8"; "before FORM, please"). The first of `OPM-N.md`'s steps:
  `opmn.html`, `OPMN` within `OPMP` in `inka.js`, every stylesheet rule
  naming OPM-P naming OPM-N too; its own keep, SAVE OPM-N and Library
  label, LOAD and ⌘V among OPM-P's tabs; its first visit OPM-P's
  composition and references. The numbers, a cell's tracks, the run by
  cells, the remote and the journal next. Its decisions in §1 and
  `OPM-N.md`, after his hand tests on paper (`RoArte/`): one brush, 0
  Raphaël Textura 860 round, its track 2.5–3 mm; a dip ≈ 30 mm of track in
  pure acrylic, 75–80 mm mixed with pouring medium — the acrylic thinned
  with it; a track's bulb its start, the fork its end.

- **FORM: P, R and L always draw; the box with V and E** (Claude's
  hand redrawing of the blue 911 from the front, the owner's "can you
  redraw this blue Porsche by hand?", Library 22:09): the roof's first
  point lay on the body's box handle, just drawn, and the pen took the
  handle — the figure never began, the next ones ran together. Now, as
  Illustrator's, the drawing tools draw wherever they are clicked; the box
  of the figure just drawn or pasted shows, and its handles take, with V
  and E only.

- **FORM: AUTO calmer — Merge colours, softer borders, Straighten never
  doubled** (the owner, the same evening, Screenshot 9.49.11 and 9.49.17
  PM, the blue 911 from the front, `images.jpeg`, Smallest form 6 mm,
  Straighten 5: "the little car comes out crooked and skewed, all its
  geometry goes to pieces — can it be broken less aggressively, or is it
  better redrawn by hand?"). The forms followed the paint's reflections, a
  blob each (157 forms on his photo), and AUTO's variation stretched
  Straighten up to twice the slider — the borders cut across in skewed
  chords. **Merge colours** (ΔE 12 at first, 0 … 40, est.) under
  Straighten: neighbours of colours so near one form — the hood one panel,
  its light and dark left to its cells, off the photo (18 … 30 forms on
  his photo); a border's grid steps smoothed six times before it is
  straightened, not twice; a variation's Straighten up to the slider's,
  never past it.

## v.1.1.7 — 2026-10-30 · Tools

- **v.1.1.7 after the name, Tools** (the owner, 2026-10-30, the evening:
  "a commit after the fixes and a push as v.1.1.7, with a little
  explanation about the tools"), on every tab and in the saved SVGs
  (`rembrandt: '1.1.7'` in their metadata).
- **FORM: four things from Claude's own drawing** (the owner, the same
  evening, having asked Claude to draw on an empty FORM — "you love vector
  … and tell me your experience after"; the teal coupé, Library 21:34; on
  the four found: "yes, let us do it"; "I had that with the wheels"):
  - **the pen's snap seen**: a ring round the form's point a click will
    land on, as near as 7 px; **⌥** none, the hand's half mm only (a
    ducktail's point was caught by the body's, 6.9 px off, unseen);
  - **a drawn form Flat at first**: its colour one click, a pencil in the
    strip, no Flat after it;
  - **a thin form chosen**: V's and E's click takes the smallest form it
    lies in or 7 px from the border of (the ducktail, a wedge, never
    caught by a click in it);
  - **E leaves no scrap**: the place a form laid long ago leaves goes to
    the neighbour it shares most border with, as if what lay under it
    showed again, its colour and all; with none, the ground
    (formplan.js's `settleLeft`). The sun made bigger left slivers, his
    wheels moved left crescents.

- **The hand: the space held, the view dragged; FORM's turned board kept
  in the middle at a zoom** (the owner, the same evening, Screenshot
  9.03.37 PM, the 911 turned at 187 %: "can the screen be fixed at a zoom?
  it goes down somewhere, maybe because I turn it"; "it would be handy to
  drag the picture with the space held: space, a paw appears, a click on
  the picture and move it, zoomed in, to the corner you need"). The turned
  board, taller than the stage before its turn, was laid from the stage's
  top, its middle lower by half the difference: now put back on the
  stage's. The space held: the hand, Illustrator's — a drag moves the view,
  no tool touched; the space never presses a button with the focus (DRAG
  and DRAW among them). On every tab of INKA's page. The trackpad's scroll
  and pinch on FORM's turned board go the way the fingers go.

## v.1.1.6 — 2026-10-30 · Drawing

- **v.1.1.6 after the name, Drawing** (the owner, 2026-10-30, the
  evening: "this is a full v.1.1.6 — a couple of words on GitHub about the
  drawing tools may be written"), on every tab and in the saved SVGs
  (`rembrandt: '1.1.6'` in their metadata).

- **FORM: Bricks out, Free the basis** (the owner, the same afternoon,
  his reference 11.22.04 in Bricks and in Free side by side: "here it is no
  good at all, just a mess — let us take Bricks away altogether, they do
  not suit our concept; Free is much better, we keep it and take it as the
  basis, not to get confused").
- **FORM: the forms' block in order** (the owner: "Brush width · the rows'
  step is the key tool, its place is not in PAINTING MACHINE"; "FORMS and
  FORM confused — some icons by the sliders, so it is clear what is for
  what"; "Add new reference next to the Auto key, without the word FORMS,
  not to make it two lines"). Right under SAVE: **AUTO** and **Add new
  reference** side by side, the photo's thumb and opacity under them,
  then Smallest form, Straighten and **Brush · rows' step** — moved out of
  Painting machine — every slider its icon; then the materials, the
  colour, Unite, the sausages, the background, the cells, Glass corners,
  Spokes every. The old FORM block now **Canvas · files**; the Preview's
  INKA brush, which the Preview never used, out of sight.
- **FORM: AUTO a variation every press** (the owner: "random generations
  on Auto, so it gives a different geometry"): every press its seed — the
  photo's grid laid off by a random part of a square, Smallest form and
  Straighten about the sliders' (0.6 … 1.6, 0.6 … 2 times), the grain
  smoothed once to three times, neighbours of near colours now and then
  one form; the variation's number on the panel, ⌘Z the one before.
- **FORM: OPM-P's paints back, and Density** (the owner: "I miss the
  colours — PAINTS, New colours, New spokes, meta 1 … 4, Inka, HDay warm,
  HDay blue — and DENSITY, so the sausages paint"): in the forms' block,
  Paints. A palette's key: the chosen forms', or every form's, sausages in
  its paints by lightness — the photo's darkest the palette's darkest, its
  lightest the lightest, now and then an accent thread, rubber the darkest
  — the picture as it was in other paints; New colours the palette dealt
  anew (none chosen, one at random in his paints); New spokes the photo's
  sausages again, the palette over them; Density the paint in a sausage.
  The cells off the Preview then, so Paint shows it.
- **FORM: Undo seen on the panel** (the owner: "please check Redo Undo,
  they seem not to work"): they worked — AUTO, the background, the
  materials, a slider, by the keys and by ⌘Z · ⇧⌘Z — but an undone slider
  left its number on the panel as it was, the plan unchanged; the panel
  now drawn anew after every change. A slider let go gives ⌘Z back to the
  page.
- **FORM: a new point on a form's border** (the owner, the evening,
  Screenshot 7.16.24 PM, the pillars by the window: "where I want to add
  points to modify the form — now a triangle, I want a rectangle by adding
  a new point"): V, a chosen form, a click on its border between two
  points — a dashed square and + under the pointer — puts a point there,
  dragged at once, as Illustrator's Add Anchor Point; in every form whose
  border it lies on, so a shared border stays shared. ⌘Z takes it back.
- **FORM: a border crossing itself painted all the same** (the owner, the
  same evening, Screenshot 7.17.25 PM: the window's glass left empty,
  meta 1 · 2 and the sausages by hand dead on it). A point dragged a third
  of a mm past a neighbour's edge — the hand's half-mm grid — crossed the
  glass's border with itself; its rings never closed, so it had no cells,
  no spokes and no sausages. The plan now cuts such a loop at its
  crossings: the slip's hair (under 1 mm, est.) off, a bow-tie's both
  lobes painted, as the board shows them; the form as kept untouched. The
  five forms of his save of 19:17 left empty all painted. And the cells'
  colours, by the photo or by the Preview, read from a keep again (lost in
  a comment when Bricks went).
- **Rembrandt private on GitHub again** (the owner, 2026-10-30, the
  evening: "you may push, and close it please; it will be private
  again"), after a day public. The others' works stay out of it and of its
  history, as before.
- **FORM: + and −, a form's points in and out** (the owner, the same
  evening, Screenshot 7.53.56 PM, a point pulled out too far: "how about
  a ( − ) too, to take a point away? Only let us make a full pen, the pen
  with + and the pen with −, as in Adobe Illustrator"): **+**, Add Anchor
  Point, a click on a chosen form's border puts a point there, dragged at
  once; **−**, Delete Anchor Point, a click on its point takes it out of
  every form that has it, the border straight on — never a loop left under
  three points, a note says so. Illustrator's keys and cursors, the nib
  with + or −. V chooses and drags only again, as Illustrator's Direct
  Selection.
- **FORM: drawing — P the pen, R a rectangle, L an ellipse; the Tools in
  three columns** (the owner, the same evening, his save of 20:05, the
  wheels taken out: "simpler to draw them from scratch than an automatic
  trace … the gentleman's set of vector drawing — a square, a circle, free
  drawing: the pen chosen, a click on the canvas, a line follows, a click,
  the points stay, and so you build a figure — a mirror, a door; the
  spoiler at the back too"; "round headlights too … and they must have
  points for free transform"; "three columns, there is plenty of room on
  the left"). **P**: a click a point, the line after the pointer, a click
  on the first point or ⏎ closes it, ⌫ the last point back, ⇧ at 45°, a
  click near a form's point lands on it. **R**, **L**: dragged, ⇧ a square
  or a circle, ⌥ from the middle, the corners on the half mm; an ellipse a
  side every 10 mm, 12 … 64 (est.). The figure a new form on top, as
  Illustrator's: every form under it less that piece, the borders shared
  point for point (formplan.js's drawForms) — a tyre's circle, the wheel's
  in it, a ring and a disc; its colour off the photo, chosen, its material
  next. **Free transform**: while it is the last thing drawn, its box's
  eight handles stretch it, ⇧ in proportion, and with V a drag in it moves
  it, laid anew over the forms as they were before it, so what it leaves
  comes back. The Tools in three columns: V and the rest as they were; P,
  +, −, R, L; Align and the ground. ⌘Z takes any of it back.
- **FORM: E, Free Transform; ⌘C ⌘V** (the owner, the same evening,
  Screenshot 8.25.06 PM, the 911 with its two wheels drawn: "let us add
  free transform to the Tools, to drag and modify. And the wheels are the
  same — I would like copy-paste, cmd+C and cmd+V"). **E**: a click
  chooses a form, ⇧ one more; the box round the chosen and what lies in
  their holes — a tyre and its wheel — its eight handles stretch them, ⇧ in
  proportion, a drag in them moves them; laid again on top
  (formplan.js's layForms), every one its id, material, colour and
  sausages, looking as it did (`transformForms`, its photo read through the
  move); the place a form laid long ago leaves out, the ground there, ⌫
  brings it in. **⌘C** the chosen forms and what lies in their holes;
  **⌘V** a copy 20 mm beside, on top, chosen, the box on it — dragged to the
  other wheel, what it covered on the way back again; **⇧⌘V** in place.
  The copy kept in this browser too. ⌘Z takes it back.

## v.1.1.5 — 2026-10-30 · FORM

- **v.1.1.5 after the name, FORM** (the owner, 2026-10-30: "FORM is
  v.1.1.5"; "yes, add it please, and it can be pushed"), on every tab and
  in the saved SVGs (`rembrandt: '1.1.5'` in their metadata).
- **rembrandt.py: FORM among the pencil pages** (the owner, 2026-10-30:
  "yes, add it please, and it can be pushed"): FORM's FRAME and DRAW BW as
  OPM-P's — a pencil's elbow may rest on the paper there.
- **FORM, a new tab after OPM-P: figurative painting** (the owner,
  2026-10-30: "a new tab FORM on the basis of our flagship, the leading tab
  OPM-P … let us go over to figurative painting and try to make the little
  car as here", FORM/Screenshot 2026-10-30 at 11.22.18 AM.png; "FORM is
  v.1.1.5"). `form.html`, OPM-P's page, all of it — the pencil, DRAW BW,
  FRAME, DRAG, PAINTING MACHINE, ELBOW LIVE, Play — and the forms off a
  photo in the blends' place (`src/formplan.js`, `src/form.js`, `FORM`
  within `OPMP` in `inka.js`). **Auto forms** (his choice, "automatic, then
  I correct by hand"): the reference on a grid in the box's pencils, the
  specks melted (Smallest form), the borders found once and straightened,
  two neighbours sharing them point for point, a border straightened across
  another straightened again, softer. Every form **OPM-P's rings and rays**
  (his choice): the straight skeleton — every side moving in, a side's rows
  its own block ending on the rays — its depth over a whole number of rows,
  none wider than the brush by 5 %, a concave corner in facets; a form the
  wavefront cannot run left empty, said. **Cells** cut square across where
  the photo's nearest colour changes along a row (his choice, "every cell
  the photo's colour"), then OPM-P's lines once and DRAG. On his red 911,
  800 × 600: 19 forms, about a thousand cells, a second.
- **FORM: no background** (the owner, the first prototype: "we do not need
  the background, I think — you are making a cast of the photo"; the silver
  one on its grey, Porsche-911-3-2019.jpg): grown from the photo's rim on a
  2 mm grid, a square to the next while the colour steps little (ΔE 4) and
  stays near the rim's (ΔE 15) — the backdrop's gradient on, the car's edge
  a stop (est.); left out, the ground there; **Background** brings it back.
- **FORM: Bricks, as of LEGO** (the owner: "Porsche-911-3-2019.jpg — as of
  LEGO bricks, nearer to Screenshot 11.15.13 AM"): the photo on a grid two
  brushes wide, the borders its steps, every corner sharp — every row the
  brush exactly, the rays at 45°, the cells bricks on the brush's grid.
- **FORM: the knife, Merge, Out · in, a point dragged** (the owner: "shall
  we break the red body into separate elements that can be changed? the
  wings, the door, the frame, the headlights, the bumper"): K, a line across
  cuts every form it crosses from border to border, the chosen only if any,
  through a window too, every piece its own rings; V a form chosen, ⇧ more,
  its points dragged with every form's there; ⌫ out or in; Merge.
- **FORM: metal, glass, rubber** (the owner, the window "smashed like glass,
  a black hole": "the tyres are rubber, the windows glass, the door and the
  wings metal — three materials may be solved differently"; glass "as INKA
  and OPM-S, by way of an exception: half-round forms and curls, no sharp
  geometry"; "we have the headlights too"): metal OPM-P's rings; glass its
  outline as it is, every ring inside rounded more, a curl in the middle,
  the adjacent glass pieces one form; rubber rounded, one paint. Guessed
  off the photo, set by the Metal · Glass · Rubber keys. Its first try
  rounded the outline and the neighbours' with it ("the glass caught the
  whole geometry", the door in fans): now the rings inside only.
- **FORM: the Preview, the brush through the sausages** (the owner: "as in
  INKA and OPM: the trace with the sausages, winding — then the contour, our
  mesh — then the result, the mosaic as OPM-P's"; his choice, asked):
  spokes from every form's outline in, every run of one paint along one a
  sausage, the photo's nearest of his paints; the brush round the rings from
  the outside in, INKA's Result (`simOf` takes FORM's sausages,
  `P.sausages`). The cells off the photo at first — the Preview's first try
  lost the door's handle and the headlights ("in the earlier version there
  were the handle on the door and the headlights") — off the Preview by
  **Cells by Preview**.
- **FORM: Rotate Canvas CCW · CW** by the zoom (the owner: "we have 60 × 60
  canvases, the front with the headlights, and 60 × 80, the Porsche's
  profile with its little wheels — that one I would turn, to draw more
  comfortably"): the board a quarter turn on the screen, the canvas and its
  forms with it, the pointer turned back; the photo upright as the view
  stood at Auto forms.

- **FORM: a form's own colour** (the owner, the tab's first look,
  Screenshot 1.08.13 PM: "wow! and how do I set the colour?"): a form
  chosen (V), a pencil in the strip by the Tools, a click — the form takes
  it, a pencil out of the box back in. **Shaded** at first: the photo's
  light and dark kept, every cell the pencil nearest the colour as much
  lighter or darker as the photo there than in the form — the highlights,
  the handle, in the new colour's family; **Flat**, one pencil every cell;
  **Photo**, the photo's colours again.
- **FORM: U, Unite in the Tools** (the owner, the front mirrored, its two
  halves chosen: "we can merge the chosen objects here — not as
  Construction's Cells / Merged — a new key in the Tools, next to O; give
  it a letter yourself"): the chosen forms side by side one form,
  Illustrator's Pathfinder Unite, its rings anew as one; the forms that
  read the photo each their own way — a mirror's copy, a moved one — its
  parts, every one read as it was, so a mirrored half stays mirrored. The
  panel's Merge the same.
- **FORM: Play, Flights and the ground working** (the owner: "Play Pencil,
  Play Drag, Flights do not work, and the ground switch — I choose black,
  it stays white"; "on OPM-W / P all works beautifully"): the DRAG reading
  under Painting machine's (i) asked a form for a blend's sides and threw
  after every change, the redraw never reached; FORM's own reading now —
  its forms, their rings. The Forms view on the ground too. Found in a
  headless Chrome over the DevTools protocol, the page driven as by hand.
- **FORM: [x] Clear the canvas** (the owner: "add [x] clear canvas as in
  OPM-P"): no forms, the photo as it lies, Auto forms makes them again;
  ⌘Z brings them back.
- **FORM: O, Reflect — the knife and the mirrored copy** (the owner, the
  car's front, its right mirror lost to the background, Screenshot 1.16.15
  PM: "a new tool, mirror — then the left part is simply mirrored; that is,
  the knife and the mirrored duplicate"): a line drawn, the axis across the
  canvas; every form cut along it, the side with more painted kept — ⌥ the
  other — and mirrored onto the far one; a point on the axis the same in
  both halves; the copy reading the photo through the mirror, its
  highlights the kept side's, its sausages mirrored. Illustrator's key, O
  (M the sausages'). A form's photo read since an affine of its own, `read`
  — a move by Align, a mirror by Reflect — the shift of the hour before it
  read into it.
- **FORM: Align in the Tools, and the sausages by hand, M** (the owner:
  "wait — let us bring the alignments back from OPM-P into the TOOLS menu
  on the left, then the sausages [M] — to change the colour myself, to
  correct what the algorithm makes"). Align, OPM-S's four: the chosen
  forms, or every one, as one — Centre — or every group of forms side by
  side a figure — Even gaps; a form moved reads the photo where it came
  from (its shift), its sausages with it, the photo under them when they
  all moved alike. M: a form's sausages the algorithm's off the photo till
  it is touched, then its own — a click on one in the chosen paint takes it
  away, in another repaints it, a drag lays one, a click elsewhere in a
  form a spoke through it from its outline in; the cells off the Preview
  from then on; **New spokes**, the algorithm's again. The knife shares a
  form's sausages out to its pieces, Merge puts them together.
- **FORM looks as OPM-P** (the owner: "fix the UI at once — the pencils on
  the left in three columns; on the right TEST / FRAME / PAUSE on one line,
  three buttons"): every rule of the stylesheet naming OPM-P names FORM too.

## v.1.1.4 — 2026-10-30 · Elbow live

- **v.1.1.4 after the name** (the owner, 2026-10-30: "commit v.1.1.4 and
  write a couple of lines on GitHub about ELBOW LIVE. Yes, you may push"),
  on every tab and in the saved SVGs (`rembrandt: '1.1.4'` in their
  metadata): everything below, after v.1.1.3 on 2026-10-29.
- **The elbow's degrees under ELBOW LIVE** (the owner, 2026-10-29, after
  the redraw's gaps — Pressure 2.5° under where the tip met the canvas:
  "gather all the settings for the drawing's tilt next to ELBOW LIVE ·
  PENCIL, the slider green only for the elbow's degree"). Pencil in at,
  Pressure and Between strokes moved from Drawing machine to right under
  it, plain sliders, on OPM, OPM-B, OPM-S, OPM-W, OPM-P and PRISMA.
  Between strokes on OPM-P says the elbow it really goes to, PEN_AIR over
  pressing when that is higher (it said Pencil in at + Between strokes).
  The three with ELBOW LIVE's ▼ ▲, a step each ("handy, and all in one
  style"); ELBOW LIVE's slider as thin as every slider, its knob with the
  mark, only its groove green ("too wide"). OPM-P: ▶ Play Pencil before
  ▶ Play Drag ("the pencil comes first").
- **DRAW BW and FRAME: the debug of the pencil's downs** (the owner,
  2026-10-29, the redraw at 82 %: the pencil up over several rings, then
  drawing again — "before DRAW BW, a debug of the runner, looking for
  exactly the «down» commands"). Before a run is sent, its blocks are read
  as the board takes them (a W rides on the next piece, the last of
  several; a piece under 0.001 mm takes none): every drawn piece must have
  the elbow at Pressure. The question says "Debug ✓ 12 lines: 12 downs to
  +1.4°, 12 ups to +4.4° …"; a piece not down — no run, where it is said
  (`strokes.js`, `landingCheck`). His run was clean: the downs were all
  sent; the elbow read +3.9° from the servo on a line told +1.4°.
- **Calibration: the wave test** (the owner, OPM/IMAGE 2026-10-29
  19:31:30 and 20:00:33: OPM-P's rays waved, the most at one end; "the X
  motor pulls the two carriages from the right only — a sharp start drags
  the right one, the left one comes a moment later"). The second module
  after Home, with the canvas every tab lays from home (Board width, Board
  height, the edges): in pencil, the same lines on the canvas's left and
  right — a pair along Y alone (the beam standing), a pair down each
  diagonal — and in the middle a pair along X; every pair one line each
  way, the first → ↘ ↗ ↑. The pencil as OPM-P has it (pressed, PEN_AIR
  over it between), its speed or one typed. Read on the paper: the Y pair
  waving too — the pencil's holder; the diagonals only, more on the left —
  the beam; one line of a pair — the way it goes (`wavetest.js`).
- **OPM-P: the pencil up between lines, a short way from one to the
  next** (the owner, the third test on paper, OPM/IMAGE 2026-10-29
  19:31:25 and 19:32:39, Screenshot 7.30.41 PM: "it does not lift, our
  pencil; it draws the lines without a break, though Flights is ON" —
  Flights only shows the flights on Drag). His run: Pressure +0.4° (left
  by ELBOW LIVE), Between strokes +1° — the elbow 2.4° drawing, 3.0°
  between, no lift. Now the pencil between strokes PEN_AIR 3° above where
  it presses at least (est.). And the order: a band at a time, its ring
  from its point nearest the pencil, its pieces — a C where a block has
  fewer rows — the nearest next, every one from its end nearer the pencil
  (before, every C clockwise from its far end, across the gap); the rays
  from the end nearer. On his 400 × 400 the pencil in the air 4.8 m for
  18.4 m drawn, 13.7 m before.
- **OPM-P: the rays straight, no key's side a point** (the owner, the
  second test on paper, OPM/IMAGE 2026-10-29 17:58:29, Screenshot 6.00.41
  PM, a video of the run: "better already; only the first row at the
  bottom, at 6 o'clock, crooked as on the first … there one could simply
  draw a ray from the centre; I do not know how to solve it as a system,
  that is for you, the figure may change"). His Key 2's corners (60 mm on a
  key 118.6 wide) had eaten its bottom side: the block there a triangle,
  its rows short at its point, the rays from Key 1 meeting in it, and the
  ray from the core bending on through it, drawn as one stroke. Now a ray
  is drawn straight, a bend sharper than 2° a new stroke; and Fit the keys
  leaves no key's side a point — every key's corner so much less that
  every side is the brush long at least (his: Key 2 60 → 50, the core 29 →
  10) — and moves Key 1 to a whole number of brushes, a quarter of one an
  edge at most, where it moved two brushes' worth before (his 188 grew to
  the canvas's 200 at a 20 mm step).
- **OPM-P: DRAW BW's rows as long as they go on, rings round the figure**
  (the owner, the first test on paper, OPM/IMAGE 2026-10-29 17:38:27 and
  29, Screenshot 5.44.03 PM, the pencil from short piece to short piece:
  "we spoke of continuous rings, remember? … short pieces may be, but not
  all"). One block's line and the next one's, where they meet on a ray, one
  line; Bound, every band all round the figure one ring, through the
  bevels; the outermost first, every one clockwise from 12 o'clock; short
  pieces only where a row ends on a ray. On his blend 150 row lines, 30 of
  them rings, where every block's line was a stroke of its own — far fewer
  landings and lifts of the pencil. The rays as before.
- **OPM-P: FRAME four marks, not the whole contour** (the owner, the same
  evening: "in Frame I do not need the whole contour drawn as now; four
  lines are enough, one on every side, so there are no needless traces on
  the canvas — 8 cm or so at most"). One mark in the middle of every side
  of Key 1 · A, 80 mm at most (FRAME_MARK, his), on its line, clockwise
  from the top, the pencil up between them; FRAME's question gives the
  contour's distances to the canvas's edges as before. OPM-S and OPM-W
  draw the whole contour still.

## v.1.1.3 — 2026-10-29 · OPM-P

- **v.1.1.3 after the name, OPM-P** (the owner, 2026-10-29: "today we make
  version 1.1.3"), on every tab and in the saved SVGs (`rembrandt: '1.1.3'`
  in their metadata).
- **OPM-P, OPM-W for paint** (the owner, 2026-10-29: "a new tab, OPM-P
  (Paint). This time without cardboard and without sticks; the straight
  lines and the sharp corners stay"). `opmp.html`, after OPM-W in the top
  row; OPM-W's page, all of it — FRAME, DRAW BW, Align, the ground, Corner
  facets — `OPMP` within `OPMW` in `inka.js`, OPM-W untouched. Kuzya, of it,
  in the owner's favour: "we are going from drawing contours to the
  algorithmic control of laying the material".
- **OPM-P: every block its own rows, bound by the blend's bands**
  (OPM/Screenshot 2026-10-28 at 10.58.14 PM, the pink bevel top left: "it
  exists as a separate object, not bound to the blocks beside it; the
  rectangles in every block another thickness — that is what we change.
  Back to INKA's and ST-JOHN's logic, the distance from one line to the
  next the brush's thickness", Screenshot 2026-10-29 at 1.01.38 PM). Asked
  how, with Key 2 off the middle, he chose INKA's rings first ("keep the
  perspective Key 1 → Key 2 … do not put 45° diagonals in place of the
  perspective's edges"); built so, its corners left big cells without rows
  where a short side ended — "white gaps, there must be none" (Screenshot
  3.05.15 PM) — and he took the third variant, "every block its own rows: a
  side and a bevel filled with their own rows exactly the brush, parallel to
  their own edge; the rows end on the rays, the diagonals from Key 1's
  corner to Key 2's; a row does not go over the corner" (2.12.27 PM), then
  the compromise ("we cannot make the exact number of lines on the sides
  and at the top and bottom … 6 mm one strip, the least; two such strips can
  equal one the other way, 12 mm vertical = 6 mm horizontal"; 3.24.37 PM,
  OPM-W's blocks not meeting: "we had this already"). A block, a side or a
  facet of a bevel between its two rays; **Bound** (at first): the blend's
  loops the bands, as many as the narrowest block holds strips of the
  brush, every block's band in a whole number of rows — the bands' lines go
  on over the corners, the rows between end on the rays; **Own**: every
  block its own count. Rows never wider than Brush width · the rows' step
  (6 mm, est.) and 5 %, so no white between (`blocksIn`, `blockCellsOf`,
  `opmplan.js`). Checked on his OPM-W blend of 2026-10-28 23:18. Every
  cell's points one with its neighbours', so a shared line is one line.
  A band 1, 2, 4 … rows, never three against four (Screenshot 3.28.26 PM,
  two lines not meeting), so every line of the coarser block meets one of
  the finer.
- **OPM-P: Fit the keys · 12 = 6 + 6** (the owner: "let us look for the
  compromise not in the lines but globally in the geometry: we may change
  the size of Key 1, Key 2 and the core for the rule 12 = 6 + 6"; seeing it,
  "great! hurray!"). A key in Construction: Key 2 and the core moved so
  every side's gap is the brush times the bands times 1, 2, 4 … — every row
  of a side the brush exactly — the bands as many as move the keys least;
  Key 1 a whole number of two brushes about its middle, so the core's rings
  come out exact too; a tile so; the sausages where they lie; ⌘Z back
  (`fitKeys`). The bevels as their corners make them — one corner a key.
  On his blend: Key 1 2.5 mm an edge, Key 2 26.9 at most, the core 13.9.
- **OPM-P: every line once, the rings round first, then the rays**
  (Screenshot 1.04.11 PM, Play drawing the cells a colour at a time;
  IMG_1678, "much dirt from passing the same segments again and again"; "at
  RUBS = 1 every piece once"): DRAW BW's lines every cell's edge, once — the
  rows block after block round the figure from 12 o'clock, ↻ CW or ↺ CCW,
  every block's from its outer edge in, then the rays by their place round
  the figure (`linesOf`); FRAME and DRAW BW stay in one
  pencil (his choice, asked), one Rubs.
- **OPM-P: DRAG in DRAW CLR's place, a colour at a time** (the owner: "DRAG
  comes back … the painting of one colour after another, but with one brush
  and the different paints squeezed onto the canvas; not as DRAW CLR and —
  important — not as the old ST-JOHN or INKA: the brush has its number of
  passes, RUBS, 1× or 8×"; "the brush must not go through a neighbouring
  piece of another colour"): along the middles of a colour's rows, block
  after block, never through a cell of another colour, every stroke on to
  where the brush covers its cells' ends — no white where a row meets a ray
  at a slant; then along its rays' strips; every stroke Rubs times; up on the move between strokes;
  between two colours the brush up to Wipe over the next one's start, the
  run's pause to wipe it and squeeze that colour (his choice, asked)
  (`dragsOf`, `dragRowsOf`). ▶ Play Drag and ▶ Play Pencil show the two.
- **OPM-P: PAINTING MACHINE** (the owner: "on the right we need a new tab,
  PAINTING MACHINE … RUBS, one, as there are no light or dark pencils any
  more; and ELBOW LIVE, the degrees of the pressure while it draws"): ↻ CW ·
  ↺ CCW, Brush width · the rows' step, Rubs, Brush speed, and ELBOW LIVE ·
  brush — the brush pressed at so many degrees, pulled during DRAG,
  rembrandt.py's trim as the pencil's. strokes.js's plotRun takes `press`,
  the brush's degrees pressed; without it 0°, every other tab as it was.
- **rembrandt.py: OPM-P among the pencil pages** (the owner, asked,
  2026-10-29: FRAME and DRAW BW stay, "lines once"): its pencil's elbow,
  as OPM-W's, may rest on the canvas up to 10° above its pose. The running
  server needs a restart to know it.
- PAUSE and STOP during OPM-P's DRAG the brush's, lifted, as INKA's; a DRAW
  BW or DRAG question cancelled puts the page's reading back.

## v.1.1.2 — 2026-10-28 · OPM-W

- **v.1.1.2 after the name, OPM-W** (the owner, 2026-10-28, the night:
  "this will be a new update, v.1.1.2"), on every tab and in the saved
  SVGs (`rembrandt: '1.1.2'` in their metadata).
- **OPM-W, OPM-S for wood: straight pieces, no arc** (the owner,
  2026-10-28, the night: "I need a new tab on the basis of our very
  latest, OPM-S … we will call it OPM-W (wood); all of the last OPM-Small's
  functions in it, the black ground and the rest. The main difference: no
  smooth semicircles and no rounded corners — all as in Screenshot
  2.34.42 PM, straight lines at different slants. Why straight corners
  now: I want to try cutting wooden sticks and gluing them straight onto
  the canvas or a sheet of plywood. For now I experiment with paper angles,
  IMAGE 22:12:25, but they do not look the part; I will try strips of foam
  board"). `opmw.html`, after OPM-S in the top row; OPM-S's page, all of it
  — FRAME, DRAW BW · CLR, Align, the ground, ELBOW LIVE — `OPMW` within
  `OPMS` in `inka.js`, OPM-S untouched. Every corner — the blend's loops
  and keys, a tile's rings, the core — **Corner facets** straight pieces
  (`o.facets` in `opmplan.js`'s `cellsOf` and `outerOf`), every one the
  same turn, every row's at the same slants: three at first, the
  screenshot's 75°, 45° and 15°; 1 … 6 in Construction, in Corners
  rounded's place — the contours' corners sharp, always. The keys'
  outlines on the screen in the same pieces; the Preview as it was, the
  colour the cells go by. Its own keep, a first visit OPM-S's composition
  and references; SAVE OPM-W, its own Library label; LOAD and ⌘C ⌘V to and
  from the other INKA-page tabs. Tests: the cells, the contours and FRAME
  in straight pieces at the facets' slants (`opmplan.test.js`).
- **rembrandt.py: OPM-W among the pencil pages** (the owner, asked,
  2026-10-28: "yes, add it"): its elbow, as OPM-S's, may rest on the canvas
  up to 10° above its pose and the run goes on. The running server needs a
  restart to know it.

## v.1.1.1 — 2026-10-28 · OPM

- **v.1.1.1 after the name, OPM** (the owner, 2026-10-28, the evening of
  OPM-S's ground: "let us call it v.1.1.1, and it can go up to GitHub …
  a couple of lines there about today's update with the black background.
  It can be pushed"), on every tab and in the saved SVGs (`rembrandt:
  '1.1.1'` in their metadata).

- **OPM-S: the ground, in a second column of the Tools** (the owner,
  2026-10-28, Screenshot 8.25.31 PM: "how do you like the idea of making
  it on a black background (choosing the background in general)? In
  TOOLS again, but in a second row. A choice of background, white by
  default, but any colour may be set"). The Tools in two columns on
  OPM-S: the drawing tools; Align and GROUND — White, Black, and a chip
  for any colour. Preview, Contour, Paint and both Plays show it; Drag
  stays on the white, its lines drawn for it. The pencils and the cells
  as they were: they go by the Preview on the white, so a new ground
  re-lays nothing. DRAW BW and FRAME take the pencil that shows best on
  it, its lightness the farthest from the ground's — the darkest on the
  white, as before, the lightest on black (`boldestOf`, opmplan.js).
- **OPM-S: a new palette shows in Paint** (the owner, 2026-10-28: "when
  I work with PAINTS, Figure 1, New colours / Inka, the screen goes to
  Preview by itself … for OPM-S, when I choose a colour, as the palette
  changes, let the result show as the fourth key, Paint"). New colours,
  New spokes, the palettes (Inka …) and the reference's OK go to Paint on
  OPM-S, the cells in their pencils' colours; Preview on every other tab.
- **OPM-S: Align in the Tools** (the owner, 2026-10-28, Screenshot
  7.17.39 PM, three blends on a 600 × 800: "I need a primitive alignment to
  the centre, an even distance between three / two figures. In the left
  vertical menu, TOOLS, please, for OPM-S"). Four keys under the
  sausages', as Illustrator's: Centre left to right, Centre top to bottom,
  Even gaps left to right, Even gaps top to bottom — on the figures chosen
  together (⇧ and a click, ⌘A), or else on all of them. Centre moves their
  box into the middle of the canvas; figures side by side (one above
  another) each its own middle on the canvas's, so they line up. Even gaps:
  the outermost two stay, every gap the same; two figures have one gap, as
  it is. ⌘Z takes it back; the hint says the mm. `src/align.js`, its tests.
- **OPM-S: Construction and Drawing machine, two blocks** (the owner,
  2026-10-28, Screenshot 5.01.58 PM, playing with the settings: "let us
  separate the construction and adjustment from the drawing machine's
  functions — two blocks, so that it is clear what is on the screen and
  what on the canvas"; of DRAW's reading: "all this into an (i) icon").
  Construction, on the screen: Cells · Merged and the cells' four sliders.
  Drawing machine, on the canvas: the Rubs, Pencil in at, Pressure, Between
  strokes, Pencil speed and the frame laid with F; DRAW's numbers under
  its (i), as Paints' and Canvas'. Shortest stroke gone from OPM-S: PRISMA's
  rings', it changed nothing there. The Pencils block the box alone.

- **OPM-S: the mosaic pressed together, its corners sharp** (the owner,
  2026-10-28, after OPM-S's first sheets, OPM/IMAGE 15:21:52 … 15:22:04 and
  IMG_1678, Screenshot 4.09.27 PM circled in red: "big distances between
  the cells and rounded corners on the contours — in the colour there are
  sharp corners everywhere. I would keep the mosaic, many squares and
  rectangles inside one colour, but press the borders together as far as
  they go and take the rounding off the corners"). Every contour on its
  cell's own edge (opmPlan's o.inset 0: no inset, nothing lost), two
  neighbours one line, its corners sharp (o.round 0). Two sliders under
  Contours, Contour in from the edge (0 … 1.5 mm) and Corners rounded
  (0 … 3 mm), est.; OPM and OPM-B 0.7 and 1.5 as they were. The carriage
  stops at every corner: on IMG_1554's blend on a 200 × 200, 133 contours,
  38.2 m, ≈ 17.8 min (rounded 33.0 m, ≈ 15.6 min).

- **OPM-S, a third OPM tab after OPM-B: FRAME, DRAW BW and DRAW CLR**
  (the owner, 2026-10-28, OPM/Screenshot 2.19.43 PM, a 200 × 200: "a third
  tab, OPM-S (Small) … a second test: next to it a button Frame, it draws
  only the outer big frame, so that I can lay the canvas perfectly
  straight; only after this we draw with the pencils … instead of one Draw
  button two in a row: DRAW BW, without a change of pencils, at once, and
  DRAW CLR, colour, with the change of pencils as now"; asked, the same
  day: the picture's outer contour, not the canvas's edges; OPM as it is).
  OPM's page, all of it. TEST · FRAME · PAUSE: FRAME every blend's Key 1 ·
  A on its own line (opmplan.js's outerOf), in the darkest pencil in the box
  (darkestOf, Black), rubbed as its contours, its question how far in from
  the canvas's four edges it lies. DRAW BW · DRAW CLR: BW every contour
  CLR draws in that one pencil, one path nearest next, the pencil in once
  — on the 500 × 700's first visit 698 contours, 142 m, ≈ 1 h 11 min
  (est.), FRAME 6 m, ≈ 2 min. ELBOW LIVE in all three. Its own keep, a
  first visit OPM's; SAVE OPM-S, its own Library label; in the top row
  after OPM-B. rembrandt.py: OPM-B and OPM-S pencil pages too, the elbow
  resting on the paper as on OPM (OPM-B was left out of it).

- **OPM: OPM-B's cells in the rim of Key 1 · A alone** (the owner,
  2026-10-28, OPM and OPM-B side by side on a 600 × 600, Screenshot 1.37.23
  AM: "you made every contour bigger. Back to the old OPM, and take from
  OPM-B only the rim of Key 1 · A … I tried fewer Steps, the drawing fell
  apart; I like how it came out after five tries, only the rectangles of
  Key 1 · A are left to do"). opmplan.js's o.rim: the blend's outer band,
  from Key 1 · A to Key 2, its rows 6 mm at least, its rays 10 mm, a sliver
  under 2.5 mm in with its neighbour — Key 2 to the core and the core cell
  for cell as before. Two sliders on OPM, Key 1 · A: rows at least, Key 1 ·
  A: rays wide. On his BLEND of 23:47: 2071 contours (2718), ≈ 2 h 13 min
  at Rubs 4. OPM-B as it was.

- **OPM-B, a new tab after OPM: OPM bigger** (the owner, 2026-10-28, OPM's
  first contours on paper, "a little victory", OPM/IMAGE 01:04:01 … 05 and
  Screenshot 1.11.33 AM: "lift the pencil a little, let it go through the
  air — the lines show a lot"; "the side lines … about 8 rounds? down to
  four"; "I cannot draw such thin lines with a pencil — the rectangles
  bigger, there is no white inside for the paint, the strips come out filled";
  "the rays come out as dots, a brush cannot get into them: wider, the
  clockwise rims pressed a little, room for the rays"; "a reserve tab — OPM
  untouched — OPM-B, as big: the 60 × 60 cm canvases come tomorrow").
  OPM's page, all of it, its plan opmplan.js with o.minRow, o.stripW and
  o.minW: Rows at least 6 mm (OPM 2.5), Rays wide 10 mm (OPM 5), a sliver
  under 2.5 mm in with its neighbour (OPM 1.2); four rounds; Between
  strokes +3° from Pencil in at, the elbow +8° (OPM +1°: the thin lines
  from contour to contour). On his BLEND of 23:47: 1025 contours, ≈ 1 h 36
  min at Rubs 4 (OPM 2718, 2 h 45 min). Its own keep, a first visit OPM's
  (its rounds, lift and cells OPM-B's); SAVE OPM-B; in the top row after
  OPM. FLIGHTS lifts nothing: Drag's view of the flights only.

- **rembrandt.py: a pencil's elbow may rest on the paper** (2026-10-28,
  OPM: "J 2 5: the elbow does not get to 5.0°" — it stood at +6.1°, a pencil
  left in the holder already on the paper above the pose a pencil goes in
  at; the owner, of that check, the night before: "can this rule be
  ignored?", and "rembrandt.py may be changed"). On a pencil's run (its
  page DACHE, PRISMA or OPM) the elbow going down and stopped 10° above
  where it was sent at most rests on what is under it: the run goes on, the
  journal says where ("rests") — at the pencil's pause the old one out, the
  elbow down to its pose. The brush and every other J as before: it gets
  there or the run stops. Tests: a pencil resting a degree above goes on;
  the brush, or 18° above, stops.

- **PROGRESS: NEXT over the next pencil** (the owner, 2026-10-28: "next
  runs into DRAWING 1/18 — next on one line, to the right as STEP 6/100, on
  the second the dot and SALMON PINK"), on DACHE, PRISMA and OPM.

- **ELBOW LIVE on PRISMA and OPM; rembrandt.py's trim** (the owner,
  2026-10-28, OPM on the machine, the elbow's degrees on Calibration not
  as he expected: "isn't it time to think of an elbow adjustment right
  while it draws? Quicker to pull a slider than to switch the machine off,
  take a screwdriver, re-set the pencil or put card under the canvas, then
  DRAW again — +4.2° +5.1° +5.7°, or the other way; set it apart"; "yes,
  do it, rembrandt.py may be changed"). Under PROGRESS, in the LCD's
  yellow — then at PROGRESS's foot, before SAVE, a green slider ("before
  SAVE OPM, and green", Screenshots 12.18.57 and 12.20.01 AM) — the elbow
  while the pencil draws, as Calibration shows it
  (Pencil in at and Pressure), ▼ ▲ by 0.1° and a slider. Nothing running,
  it is Pressure; in a DRAW, from the next stroke on: rembrandt.py adds
  the change since DRAW to every W 2 it sends (POST /run/trim?deg=, ±6° at
  most, the elbow within its reach, 0 at every start; never a J — a pencil
  goes in where it always does), and Pressure keeps it for the next DRAW.
  Between strokes goes with it. A red dot by its name while it acts on a
  run, the trim on the LCD's top line, rembrandt.py's own: "LIVE · DRAW
  +2.7°" (the owner: "we have a screen — just add it there").
  Pressure −6 … +3° from Pencil in at now, the elbow never under −4.5°.
  rembrandt.py to be started again once. Tests: the trim on every W 2, its
  reach, 0 at a start.

- **CARAN taken out** (the owner, 2026-10-27, the night of OPM: "CARAN can
  go altogether, it is a useless tab now"): its page, plan, worker, styles,
  test and CARAN.md; its place in the top row and the Library. Kuzya's work,
  in git's history (8033754). PRISMA after DACHE in the row.

- **PRISMA and OPM: every pencil in at Pencil in at, +5°; Pressure from
  there** (2026-10-27, the night of OPM, the machine stopping at "J 2 0: the
  elbow does not get to 0.0°", reloaded, again; the owner: "can this rule be
  ignored?"). The pencil went in with the holder down at 0°, a move the
  server checks — something on the surface before it, it never got there.
  Now every pencil goes in with the elbow at **Pencil in at** (+5°, a
  slider 0 … 15°, est.), up off the paper or the canvas, its tip let down
  onto it and tightened there; Pressure and Between strokes count from that
  pose (−1.4° pressed = +3.6°, +1° between = +6°). At every change the
  elbow comes back up to it first: the next pencil went in at the pressed
  pose before and drew with no pressure. The server's check kept: it keeps
  a servo from pushing into something for good.

- **OPM, a new tab after PRISMA: contours in coloured pencils, the paints by
  hand** (the owner, 2026-10-27, after the rubbed pencil on paper: "rubbed
  like sandpaper the 40 × 40 takes thirty hours — impossible … back to the
  paints, painted by hand along a contour drawn beforehand in pencils, every
  pencil's colour its paint's"; "use the original geometry of the colour
  strokes, not the screenshot; white areas with a thin contour of their
  colour"; OPM/Rainbow Perspective Tile Grid.png, Kuzya's, "I like it most";
  "columns — the sausages' strips 5 mm and the gaps between: yes, exactly";
  "a switch: merge one colour's cells, or cells as Kuzya's"; "the whole
  canvas painted, right?"). PRISMA's page, all of it, its plan
  `opmplan.js`: the loops' bands a row 2.5 mm at least (a narrow side's
  loops 0.6 mm apart — at first they merged into one snake of 740 cells, a V
  with no contour), on a side cut by every sausage's strip; a corner's arc a
  cell; every cell the pencil nearest the Preview in it, next to white the
  lightest, none left bare. A corner's rows as the narrower side it runs
  into (a sheared corner's band thins to it: the top right of
  OPM/opm-cells.png had no contours, "a little is left in the top right
  corner"). Its contour 0.7 mm in — a sharp tip cut across where its sides
  are 2.1 mm apart, a short edge the inset turns back gone, as a true offset
  — its corners rounded 1.5 mm, a closed stroke rubbed round and round
  (Rubs 4), never back, lifted +1° between. Cells or Merged under Contours;
  views Contour and Paint. On his BLEND of 23:47: 3038 cells, 2718
  contours, none lost, ≈ 2 h 45 min at Rubs 4 (Merged: 524 contours, ≈ 1 h
  17 min). Its own keep, a first visit PRISMA's; SAVE OPM, the Library
  opening it there; in the top row after PRISMA. Tests for the cells, the
  strip, the contours in their cells, Merged and the rubbing round.

- **F: a click in the frame takes it away** (the owner, 2026-10-27: "a
  frame can be set but not taken away. The simplest: F again and a click on
  it, and it is gone"), on DACHE and PRISMA; ⌘Z brings it back, a click
  outside it leaves it. Whole canvas under Pencils as before.

- **PRISMA: the pencil rubbed, pressed, gliding** (the owner, 2026-10-27,
  the first paper test, stopped at 43 %, OPM/IMG_1621.MOV and the photos:
  "a pencil does not draw at one touch of the paper, it is not a felt pen …
  it has to be rubbed like wood on sandpaper"; "the head keeps leaving the
  paper and spends 60 % of its moves in the air"; the holder at −0.1° touches,
  next to no trace, at −1.4° a pale line, at +4.6° just off; "8 or 16 times a
  stroke for the dark, saturated colours, 16–32 for the light ones; if not
  enough, 64. Let it draw seven hours"). The run pressed the pencil at 0°,
  as the brush, and lifted it to +25° between strokes. Now: every stroke
  **rubbed** there and back so many times — Rubs, the darkest pencil (8)
  and the lightest (32), a pencil between by its lightness, by twos 1 … 64;
  pressed at **Pressure** (−1.4°, down to −3.5°, the elbow's reach −5°);
  from stroke to stroke **gliding** on the paper at **Between strokes**
  (−0.1°), never up; it comes down to the paper the carriage standing. All
  est. The time is the carriage's braking at every turn back (250 mm/s²,
  the firmware's), not its speed: on his BLEND of 23:47, the 100 × 100 frame
  ≈ 2 h 30 min at 8 … 32, the whole sheet 20 … 40 h. No rembrandt.py or
  firmware change: −5 … +45° is the elbow's reach a run may use. The first
  rubbed run (OPM/IMAGE 22:26:42; the owner: "now that is what I call it!"):
  the red dense and bright; gliding at −0.1° the sharp, waxed tip leaves a
  thin line from stroke to stroke — Between strokes +0.5 … +1° next, a lift
  of a hair; its label says on the paper or just off.

- **PRISMA: the run in the panel; DRAW asks with swatches** (the owner,
  2026-10-27, Screenshot 9.09.17 PM: "a quite useless palette of sausages
  … we need beside it, above, the list of the pencils used … I do not
  understand which pencil to put in the machine now, which to have ready
  next. The first colour could go into the window DRAW opens, as a swatch";
  OPM/Screenshot 9.16.11 PM). Pencils on PRISMA starts with **the run**: every
  pencil that draws in its order, two columns, its number, swatch and name;
  a click chooses it. While DRAW runs, or Play Pencil plays, the one in the
  machine is ringed — now, or put in at a change — the next marked, the done
  ones dim; nothing running, the first. DRAW, on DACHE and PRISMA, asks in a
  window of its own, no more the browser's text: the first pencil big, Put
  in first, its name, number and brand; the run's order a swatch each with
  its metres; the time and the paper; DRAW or Cancel, Esc Cancel. (A DRAW
  refused with "from before the pencil's pause" was a rembrandt.py started
  the night before p-pause: restarted, it draws.)

- **PRISMA: no white between the rings; Nearest · Mixed** (the owner,
  2026-10-27, the top right corner, Pencil beside the Preview: "I thought
  more colours would bring Pencil nearer the Preview, but it still is not
  right … I do not know how to fix it"; Kuzya: "an almost technical scheme
  … many white gaps … a grid"). The gaps were the rings', not the colours':
  a side narrower than the widest kept as many lines as it holds on
  average, 0.7 and 1.3 mm apart in turn, and round a corner the lines came
  in evenly while the band widened unevenly — white fans. Now on every side
  and round every corner the first so many lines by rank that no gap is
  wider than a line (1 mm), nested, every line starting or stopping once. On
  his BLEND of 23:47 the look (2 mm cells, ΔE 2000 to the Preview) 8.05 →
  5.79, the top right corner 12.9 → 6.8 ("wow, almost twice as accurate");
  the lines 1.2 times the area where a side is narrow, DRAW 2 h 46 → 3 h 38
  min at 60 mm/s. **Mixed** beside **Nearest** under Rings and rays ("maybe
  we keep it?" — the raster, PRISMA/compare-corner.png): along every line
  the Preview's colour and what the lines before it left over, the one of
  its four nearest pencils, the paper one of them, nearest that, kept
  Shortest at least, what it misses carried on (Floyd–Steinberg) — green,
  orange and ochre intertwined; 6 h 26 min at Shortest 5, the look 6.8.
  Tried and left: two pencils across the lines in shares (no better, +0.6
  h); rays off (no better, the red stripes gone). Tests: no point of the
  blend over half a line from one; Mixed's mix near the Preview's olive.

- **PRISMA: twelve more Prismacolors for the four transitions** (the owner,
  2026-10-27, PRISMA/new_colors.png: "blue → turquoise → green … white →
  cream → peach → coral … yellow → gold → olive … red → terracotta → brown
  — they need more half-tones"). His twenty there were the box's own pencils
  read off the screen, each within ΔE 1–4 of one in it, numbered by the
  strip: on his BLEND of 23:47 they made 50 pencils, 2 h 52 min, and the look
  (2 mm cells, ΔE 2000 to the Preview) 8.56 → 8.40. Chosen instead, as the
  fifteen before, one at a time off that Preview: Salmon Pink PC 1001,
  Jasmine 1012, Pale Sage 1089, Light Cerulean Blue 904, Mineral Orange
  1033, Kelp Green 1090, Caribbean Sea 1103, Moss Green 1097, Beige Sienna
  1080, Light Aqua 992, Peacock Green 907, Blush Pink 928 (est.) — 44
  pencils, 2 h 46 min, the look 8.05; the transitions 7.0 → 5.9, 5.9 → 5.4,
  6.8 → 5.9, 6.4 → 6.0 (his choice). A kept box takes them once (`boxV` 6),
  his own edits and ticks as they were; those he has not, In the box off.

- **Play Pencil in PROGRESS** on DACHE and PRISMA (the owner, 2026-10-27,
  PRISMA/Screenshot 7.32.59 PM: "the drawing builds, but the progress on the
  screen does not change, and the build does not take the change of the
  swatches. It would be great if, with Play Pencil, Progress showed which
  pencil we draw with now"). While it plays and nothing runs, the LCD plays
  the run: ▶ play · Pencil, the per cent, the time left and the total of
  the run (est., by the metres drawn), the swatch of the pencil drawing,
  its number of all and the next; the pencil ringed by the Tools (PRISMA)
  or in the box (DACHE). A real run comes first on the LCD.

- **📂 LOAD beside 💾 SAVE, and ⌘C ⌘V from tab to tab** on INKA, ST-JOHN,
  BLEND, DACHE and PRISMA (the owner, 2026-10-27, the composition of BLEND
  and DACHE deleted by chance: "we have SAVE BLEND — can't we just make LOAD
  BLEND? I need this one (PRISMA/Screenshot 7.24.22 PM) on PRISMA. So LOAD
  PRISMA, or ⌘C on BLEND and ⌘V on PRISMA"). LOAD lists the Library's saves
  the tab draws, newest first, a picture each; its own save opens whole, as
  from the Library, another tab's lays its composition — the tiles, the
  nodes, the canvas, the brush and Density — the tab's own pencils, frame
  and view kept. ⌘C is kept in this browser too: ⌘V on another tab lays
  the tiles where they were there, every next one beside; INKA takes no
  blends. ⌘Z takes either back. The Library's open on a tab takes the same
  saves.

- **SMKN, BIAS and ALU off the top row; every tab ticked in or out in
  Preferences** (the owner, 2026-10-27: "hide the SMKN and BIAS tabs,
  please — and in Preferences put all the hidden tabs, so that I do not ask
  you every time: a check-box there, to hide them and bring them back. ALU
  can be hidden too"). Preferences' new **Tabs**: every tab in its place in
  the row, the hidden ones of before too (TAPE, BASF, LOOM, NOLAN, New Yuri,
  TYPE, LOVE, Pencils, Test, Job, Create, Adjustments), a tick each, kept in
  this browser with TEST's; The top row as at first. `src/tabs.js` draws the
  row right after every page's nav, and again when Preferences change it on
  another tab; Calibration and Library always; a page opened off the row
  shows its own tab. Tests for the row at first, the ticks and every page.

- **PRISMA, a new tab after CARAN: DACHE's Preview in rings and rays** (the
  owner, 2026-10-27, PRISMA/ IMAGE 15:30:57 and 15:31:04: "this geometry
  should have a rather simple construction. One part of the strokes goes
  clockwise, draws different circles. The other part are like spokes or
  rays, from the centre in different directions — the rays make a cross
  hatching, a cross stroke. The rays are always short, the clockwise ones a
  little longer"; Screenshot 3.04.49 PM, the red transverse stripes lost by
  DACHE and CARAN; "maybe there were not enough colours? We can add twenty
  more, dark, saturated"). DACHE's page, its plan `prismaplan.js`: the
  pencil's lines 1 mm apart clockwise round every band, runs of one pencil
  3 mm at least (Shortest, est.); along every sausage short zigzags a band
  long, the Preview's pencil over each — the stripes. Every shade the nearest
  pencil, its own colour; no coats or tones. A pencil one path, the pencil up
  and down on the move (CARAN's `turn` pieces and `minPiece`), 60 mm/s (est.)
  and 0.18 s a lift (est.): ≈ 2 h 39 min on the 12:02 composition, 2 h 46
  min on 15:20 (≈ 0.7 h of it drawing), the pencil changes not counted —
  not 17–21 h. Fifteen more Prismacolors in its box (est.):
  Mediterranean Blue, Peacock Blue, Olive Green, Green Ochre, Pale
  Vermilion, Poppy Red, Crimson Lake, Terra Cotta, Muted Turquoise, Jade
  Green, Parrot Green, Light Umber, Yellowed Orange, Nectar, Sky Blue Light —
  the mean ΔE 2000 of his two Previews of the day 9.1 → 6.5. DACHE and CARAN
  untouched; `dacheplan.js` only exports four helpers. Tests for the box, the
  ranks, the runs, the rings' way, the rays, the passes and the run.
  DACHE's look too, every one of its style rules (the owner, the same day:
  "there is the DRAG key for the brush … we need DRAW for the pencils —
  Cream 914 is first, where do I press?"): DRAW alone, MARKS, DRAG and Ink
  hidden, the paints in two columns. Then the pencils by the Tools (the
  owner, the same day: "let us move all the pencils to the left, where the
  tools are; they can be in three rows. And unload the panel on the right —
  many say none there. If a pencil is not used, its colour should be
  hidden"): in the paints' place three columns, only the pencils that draw,
  in the run's order, its number under each; + the rest, to bring one back;
  Paints, and M, the sausages' strip, Pencils back. On the right only the
  chosen one, ↑ ↓ and its fields.

- **CARAN: preserve the individual sausage squares' contrast** (the owner,
  2026-10-27, Screenshot 12.36.17 PM: “I even drew these little squares on
  the right; they are where the sausages are”). Preserve sausage squares,
  on by default: if a genuinely darker source cell and both surrounding
  sides would round to one pencil, assign a suitable darker pencil in its
  hue family. Actual source contrast is required; flat areas gain nothing.
  The frozen raster, coat count and old paint colours stay unchanged.
  Independent switch, source-cell count and tests for preserved cells,
  uniform sources, missing pencils and explicit coats.

- **CARAN: the sausages as crosswise spokes, with the contour rings** (the
  owner, 2026-10-27: “can we keep the sausages, so there are transverse
  strokes”; Play Drawing showed a barrel's metal rings “without the wooden
  boards”). Cross strokes on sausages, on by default, reserves the real
  sausage footprints from the frozen source for strokes along their spokes.
  Colours remain those assigned from the Result; explicit coats stay the
  same. Existing snapshots work without recapture. The switch is independent
  of small-detail hatching. Playback marks cross strokes, the plan reports
  their metres, and SVG and DRAW use the same paths. Source-colour, direction,
  frame, coats and runner tests cover the change.

- **CARAN beside DACHE: frozen Result, continuous pencil passes** (the owner,
  2026-10-27: “take a cast of the Preview, assign each shade its own pencil”;
  “a full pass across the sheet … it lifts here and lands there”; small
  squares perpendicular, “like weaving a basket”). The original native raster
  is kept independently. Its pixels select actual pencils directly, with no
  pigment mixing, inferred overlays, short-colour merging or omitted pencils.
  Contour directions, local lifted flights and a perpendicular raster detail
  pass feed one continuous path per pencil into the existing runner. Compare
  the original, assigned palette and actual paths. Explicit coats, real-size
  fragments, editable inventory, playback, Library saves and project/SVG
  exports. Motion and lift estimates are shown separately; pencil changes are
  excluded. Server and firmware unchanged; no physical run. See `CARAN.md`.

- **DACHE: ▶ Play Preview · ▶ Play Pencil, one row** (the owner, 2026-10-27:
  "much better! Let's put two Play the run buttons in one row — Play Preview
  and Play Pencil. We need to watch how our picture is drawn in pencil").
  Play Pencil lays DRAW's passes in the run's order on a bitmap of the
  canvas, every piece of every stroke — the lines up and down, the coats
  back over them, Cross across — no longer than 4 mm a step, multiplied in
  at COVER, white over; the tip a ring in the pencil's colour; the status
  line its pencil, number of passes, percent and metres. 6 s and 0.15 ms a
  mm, 40 s at most; pressed again, a view chosen or a click on the canvas,
  it stops; on its end the Pencil view. Play Preview, the old Play the run.

- **DACHE after Preview: every line its own colour, the bands the blend's
  loops, the sausages' squares, darker and lighter pencils** (the owner,
  2026-10-27, Screenshots 12.24.10 and 12.36.17 PM: "I cannot accept this
  work yet"; "the small squares from the sausages have gone … they lie
  exactly where the sausages are"; "it is not paint — just give the squares
  darker pencils"; "something near white can be taken from the 72"). Every 1
  mm line samples the Preview every half mm, the Shortest 2 mm, so its
  grooves — the television's grid — stay; the bands the loops (Stroke gone).
  The pencil by hue and chroma against every pencil's colour and tones, its
  tone by the lightness against the pencil's own — a coat more where
  darker, white over where lighter: the stripes no longer one block, a dark
  olive an ochre, not black, a pale peach Light Peach, not grey. The paper
  only next to white. Where a line crosses a sausage and the Preview is
  darker there, a square: never merged away, a darker pencil — Squares with,
  or the nearest darker — hatched Cross (one line: along and back twice).
  COVER est. 0.7. The box 27: his eleven (White PC 938), five darker
  Prismacolors and Carmine Red, eleven of his light ones; added once into a
  box kept before. Pencil drawn by module and tone. Four new tests. His
  blend: ≈ 230 m, 25 pencils, ≈ 16 h (est.).

- **DACHE: a narrow side's lines too; PROGRESS's type as everywhere, the
  next pencil, the hours in h and min; Preview** (the owner, 2026-10-27,
  Screenshot 12.09.03 PM, a red arrow over the blend's top: "why did the top
  sag?"; "bring back the original font sizes as everywhere"; "243 minutes …
  an hour has 60 minutes — 4 hours 59 minutes"; "I would add next and a
  small circle of Sky Blue"; "rename Result to Preview"). The top was 16.5
  mm between his A and Key 2, cut into 76 bands of 0.22 mm, none with a
  line: paper. Now every side's lines 1 mm apart across all of its gap,
  shared out to the bands — the top 17 lines. PROGRESS: the digits back to
  46 and 17, the big swatch kept, next with a small circle; left and total
  from an hour on as 2 h 58 min; h and min in the reading and DRAW's
  question too. The Result's key on DACHE is Preview. A test for the top.

- **DACHE's pencils on the page: DRAW, Modules · Pencil, the box, the frame;
  PROGRESS bigger with the pencil's swatch; STOP asks** (the owner,
  2026-10-27, on Claude's plan: "I am used to our yellow PROGRESS screen.
  Can it be made bigger and show right there the swatch of the colour being
  drawn now … for DACHE only"; "continue drawing, or go back home?"; "first
  we test on paper"). DRAW in MARKS' and DRAG's place, the pencils listed in
  the run's order to lay out left to right, a pencil change at the start and
  every colour's end with the pencil on the paper; PAUSE and STOP the
  pencil's pause, STOP then ▶ Continue drawing · ⌂ Go home. The views
  Modules and Pencil (est.), sharp at every zoom; a pencil's pass alone. The
  Pencils block: the box, its order, its fields, + Pencil; Along · Across ·
  Cross, Stroke, Coats, Shortest module, Pencil speed; F, the frame, a piece
  on paper first. No Ink row on DACHE. Not run on the machine yet:
  `rembrandt.py` must be restarted for p-pause, DRAW refuses an older one.

- **dacheplan.js, DACHE's plan: the Result cut into modules, a pass a
  pencil** (the owner, 2026-10-27: "from the Result we make the base for
  the rendering that follows: many rectangles and cubes"; "one line 1 mm";
  "the lines go up and down … it does not go back through the air. If the
  line is 4 mm, up and down four times"). The pencil box, eleven, white the
  light one; the run light to dark, his order over it, the light last. Bands
  between a blend's keys, in its core and a tile, Stroke lines wide where
  widest; a band cut where the Result's colour turns to another pencil
  (CIEDE2000; a pencil COVER 70 % a coat, white over another 35 %, est.), a
  stretch shorter than Shortest module to its neighbour: modules, trapezoids
  on the sides, rings in the corners. A module's hatch: Along · Across ·
  Cross, Coats, one continuous line. The passes: nearest module next, on
  without a lift within 1.5 mm. A pencil with next to nothing left out
  (under 300 mm, or 0.5 % of all). Rows for plotRun, the last of a pass
  ending on the paper; a p-pause over the first start and at every change.
  Twelve tests. On IMG_1554 in HDay warm: ≈ 130 m, 8 pencils, ≈ 3 h (est.).

- **p-pause, the pencil's pause, in the runner** (the owner, 2026-10-27, for
  DACHE: "the pencil has to be changed, its tip resting on the paper, not
  going in the air"; "it can be split … or keep pause as it is, and p-pause
  a new kind for the pencil"; "p-pause is better"). A block of kind
  `p-pause`, and POST `/run/p-pause`: Pause as ever — a pass brakes on its
  line, the rest goes on from there — but nothing lifted and nothing put
  back, the new pencil in the holder with its tip on the paper. The brush's
  pause, `/run/pause`, as it was. The journal marks the pencil's pauses.
  `rembrandt.py` takes it after a restart.

- **DACHE, a new tab after BLEND: BLEND in coloured pencils, on paper** (the
  owner, 2026-10-27, `DACHE/`: "we will create the tab DACHE and move all
  the functions of BLEND there"; "I will not squeeze paint on the canvas, I
  will simply use coloured pencils"). `dache.html`, its body
  `data-tab="dache"`: BLEND's page and module, every panel of it; its own
  keep, 💾 SAVE DACHE and Library label; a first visit BLEND's composition
  and references, copied, BLEND's own untouched. DACHE after BLEND in every
  page's top row. The pencils themselves next.

- **Pencils, a separate paper model after BLEND** (the owner, 2026-10-26:
  “Take BLEND as the base, call the new tab Pencils”; “10 pencils — 10
  passes”; “at least test it on A3”). BLEND's keys and colour placements
  become narrow pencil tracks, one mounted pencil per colour, all its coats
  together. Digital BLEND Result as a colour reference, or the original
  placement map. Editable pencil inventory, explicit green, white as paper,
  colour interleaving, A3 fit, individual passes and paper texture (est.).
  Project/colour/layered SVGs, swatch sheet, pass manifest and Library saves.
  Planning/export only; machine execution unchanged. See `PENCILS.md`.
  Off the top row since 2026-10-27, DACHE in its place (the owner: "it can
  be hidden, and its ideas taken"); the page stays, at its address.

## v.1.1.0 — 2026-10-26 · Blend

- **v.1.1.0 after the name, Blend** (the owner, 2026-10-26, the night after
  BLEND's first run in paint: "it can be pushed to GitHub, and version
  1.1.0"), on every tab and in the saved SVGs (`rembrandt: '1.1.0'` in
  their metadata).

- **BLEND: Key 2's loops from 6 o'clock** (the owner, 2026-10-26: "your
  join is OVER the yellow cross, just where an even line is needed … start
  at 6 in the evening! Then the brush's lifts hide under the yellow cross").
  In turn, every series lands where its own loops meet: Key 1's at 12 on
  A's top, Key 2's at 6 on Key 2's bottom, under the core.

- **BLEND: K1 · K2 in turn, every contour once, the brush in the air
  between** (the owner, 2026-10-26, after the first run in paint: "with
  paint it gathers in little hills at the top … one line of Key 1, then one
  line of Key 2, then K1 again, and so in turn"; "the brush must lift, to
  draw this going over in the air"; "every contour of the blend drawn once,
  K1 and K2 in turn, the moves between them in the air"). Every loop a
  stroke of its own from the middle of its top, round once, the brush up and
  on in the air to the next: DRAG a row a loop, no wipe till the core. Key
  after key, one line by S's, as before, a key in the blend's panel. Not run
  on the machine yet.

- **A blend's Spokes its own; the core's Step moves the core alone** (the
  owner, 2026-10-26, his Density 86 %: "I added rings to the core … and all
  the spokes fell apart"; "the outer spokes, their pieces and their paints
  must stay"). Spokes in the blend's panel, none set one every ≈ 95 mm; the
  Density never moves them. The core's Step lays the core's X alone, its
  paint kept, every spoke as it lies. A run of one paint along a spoke one
  sausage.

- **BLEND's sausages all round, its paints in patches; several references**
  (the owner, 2026-10-26: "a plain X will not do here. Too much empty space
  stays unpainted"; IMAGE 2026-10-26 11:55:05: "an algorithm that turns it
  at random into such a colour range"; "I like how you made Blend 1 / Key 1
  / Key 2 / Key 3 — REFERENCE needs the same"). Spokes all round a blend, no
  further apart than the paint carries at the Density (≈ 95 mm at 50 %,
  est.), each across every loop, in pieces; the palette in patches, every
  paint its share; New spokes moves them on along the sides. OK reads the
  reference in tints on BLEND — a pale pink Rose Azo and White, not White.
  A phone's status bar off every reference. Reference 1, 2 … on INKA,
  ST-JOHN and BLEND, the chosen one's palette in sight; kept in IndexedDB.

- **BLEND's page styled as INKA's**: every rule of `style.css` INKA and
  ST-JOHN share now BLEND's too — the paints' strip, the paints in use, MARKS
  · DRAG, the typed numbers; `data-tab="blend"` had been left out of them.

- **BLEND, a new tab after ST-JOHN: Illustrator's blend** (the owner,
  2026-10-26: "we start a new tab with you, BLEND, as in Adobe Illustrator,
  but for our machine. Until now we made figures whose lines did not cross
  but lay side by side"; "for BLEND take INKA as the base, it has all the
  menu panels we need"; the key image `BLEND/IMG_1554.PNG`). `blend.html`,
  INKA's page and module, `src/blendplan.js`. B lays a blend: keys —
  IMG_1554's three, read off the picture — and Steps shapes between every
  two, 13; a click in a key chooses it, its own handles. Every shape a loop
  of the brush, the outermost first and every next over it, one line, the S
  on the side where the loops lie nearest; the core filled, a figure of its
  own after a wipe. An X along every corner's way through the loops, the
  outer half one paint, the inner half another. On a 40 × 40: 28 loops,
  16.3 m, ≈ 7 min (est.). Not run on the machine yet.

## v.1.0.9 — 2026-10-19

- **v.1.0.9 after the name** (the owner, 2026-10-19, with the cleanup:
  "this will be the v.1.0.9 update"), on every tab and in the saved SVGs
  (`rembrandt: '1.0.9'` in their metadata).

- **Preferences, a gear after Library; TEST 10 mm in, two dots at TL** (the
  owner, 2026-10-20: "too big a margin — 20 mm … or better, after INK /
  Calib. / Library create a gear, that will be Preferences. Second, on the
  first top point I need two touches of the brush 5 seconds apart. When I
  put a new canvas, I do not understand where to put it"). `prefs.html` and
  `src/prefs.js`, the gear on every page, kept in this browser. TEST on
  every tab: Margin 10 mm (20 before), at TL one dot or two — two at first,
  5 s apart, the brush up between — then TR, BR, BL, home. The wait a
  `wait` block, as the cup's dwell; `rembrandt.py` untouched.

- **ST-JOHN: the ⌘ from the top left lobe's window out** (the owner,
  2026-10-20, the first tests, St_John/ IMG_1215 and Screenshot 10.14.40
  AM: "our main flaw — now it starts from the middle and as it goes it goes
  to the lobes. We need it the other way round"; Screenshot 10.29.11 AM and
  on: "first the top left lobe, from there it pushes the paint into the
  bottom left. Then into the bottom right"). The lobes in the brush's
  order, 1 the top left, 2 the bottom left, 3 the bottom right, 4 the top
  right, each clockwise as before; the brush lands on lobe 1's innermost
  ring and goes loop after loop outward, the ring change an S on lobe 1's
  bottom, landing in its middle, the S's one under another. ↺ mirrored,
  from the top right. On his 40 × 40, Width 76, Corners 100: 49.4 m, 35
  dips of TRACE (est.).

- **ST-JOHN: TRACE a dip every 1440 mm** (the owner, 2026-10-19, the same
  evening, testing, on 720 between dips: "1440 can easily be done — it is
  all water here :)"). TRACE_DIP, ST-JOHN's TRACE's own; NOLAN's, ALU's and
  TAPE's dips 720 (DIP_RUN) as they were. On his 40 × 40, Width 76, Corners
  100: 34 dips, not 69, ≈ 27 min, not 34 (est.).

- **ST-JOHN: TRACE in MARKS' place, DRAG's very line in tinted water** (the
  owner, 2026-10-19, the same evening, St_John/ Screenshot 8.50.53 PM,
  Florian's canvas, his lanes traced faint and the sausages over them:
  "we remove MARKS and put TRACE in its place. But see that it coincides
  perfectly with DRAG, because I will dip the same brush in water, only the
  water slightly tinted, so the brush leaves a trail — that is the trace I
  see and can squeeze the paint on, as Florian"). The deck TRACE · DRAG:
  TRACE runs every figure's path, the pieces DRAG runs, at DRAG's speed;
  with INK ON from the cup of the Ink tab, cut only where the dips fall,
  every 720 mm (DIP_RUN, est.), each next stretch on from 20 mm back
  (DIP_LAP) so no gap at the dip — a line or an arc cut where it lies, so
  every stretch lies on DRAG's line; without ink the very rows of DRAG. On
  Drag a blue ring where TRACE goes on after a dip, no MARKS dashes; the
  reading its length, dips and time — on his 40 × 40, Width 76, Corners
  100: 50.6 m, 69 dips, ≈ 34 min (est.).

- **INKA: Corners under Step, the tile's reading under i** (the owner,
  the same evening: "you can, thanks for reminding — they are alike"), as
  on ST-JOHN.

- **ST-JOHN: Corners by Width; the chosen one's reading under i** (the
  owner, 2026-10-19, the same evening: "great! now that is another matter,
  much better. Could you move Corners nearer Width — it is the construction,
  not the Brush section"; "this text we hide under (i)"). On ST-JOHN Corners
  under the chosen one's Step and Width, typed or by the slider, out of
  Brush, DRAG — one value for the whole canvas, as before; the reading of
  the chosen tile or ⌘ hidden under an i by its name. INKA as it was. The
  tooltips of Corners and Wipe whole again: a straight quote in them cut
  them short, now «».

- **ST-JOHN: Corners up to 100 mm; a ⌘'s rings round** (the owner,
  2026-10-19, the same evening, Screenshot 9.24.56 PM, the roundings drawn
  in blue: "much better already, but Corners can be turned up to 100 mm";
  Screenshot 9.27.36 PM: "the optimal width came out 74! … I circled the
  rings in blue — they must be really round, not squares as now"). Corners
  0.5 … 100 mm on INKA and ST-JOHN, ST-JOHN's 100 at first, INKA's 4 as
  before. A ⌘'s turn no more than half its ring's side, so at 100 every ring
  round — three quarters of a circle and its straight inner sides — its
  window a teardrop pointing to the middle; on his 387 × 387.5, Step 7,
  Width 74: the turns 25 … 94.6 mm. Its X from where the outer ring's paint
  begins round its turn to the innermost ring's middle round its own. A new
  ⌘'s Width a fifth of its box, as his 74 on 387.

- **ST-JOHN: a ⌘'s Width, and Corners up to 50 mm** (the owner,
  2026-10-19, the same evening, on the lobes filled to their middles: "I
  lack CORNERS … it must go up to 50 mm. And we need a slider as in ALU-CUT
  called WIDTH — there the loop's thickness can be raised. Now the figure
  came out somehow strange"). **Width** under a ⌘'s Step, as ALU-CUT's
  pipe: the loop edge to edge, the rings only so far in from the sign's
  outline — a window in every lobe, the grid in the middle 2 Width across;
  at half a lobe the lobes filled as before; a new one's an eighth of its
  box, 50 mm on his 40 × 40: 17 loops, 43.5 m. **Corners** 0.5 … 50 mm, on
  INKA too. On a ⌘ the turns concentric, as a pipe's lanes: the outer
  ring's Corners, each ring inside its depth less, never under 4 mm — the
  loop as thick round a turn as along a side; its X from where the paint
  begins round the turn. Its X laid again on its loop, the paints kept,
  after its Width, Corners or size change, and once for a ⌘ kept before.

- **ST-JOHN, a new tab after INKA: ⌘, St. John's Arms** (the owner,
  2026-10-19, the evening, `St_John/`: "name the tab ST-JOHN and make it
  exactly like INKA, only in the tools between R and N we put ⌘ (Command,
  St. John's Arms)"; the old sign, Screenshot 8.23.36 PM, "an interesting
  solution for us, how the brush will go", his arrows in … PM 2; "it is just
  how the brush goes over the canvas. There may be 25 of them, it depends on
  the size of the canvas"; "the ⌘ sign goes from the centre"). `stjohn.html`
  on INKA's `inka.js` and `inkaplan.js`, its own keep and Library label;
  INKA as it was. **⌘** (J) in the Tools between R and N lays the sign by a
  drag: its box in four lobes — 1 the bottom right, 2 the top right, 3 the
  top left, 4 the bottom left, his numbers — every lobe's rings a tile's;
  every loop one ring of each, round lobe 1 clockwise, its inner side
  straight on through the middle into lobe 2, and so on round, so the
  inner sides cross in the middle — the grid of his drawing, IMAGE
  2026-10-19 20:22:20. The brush lands in the middle, the outermost loop
  first, then loop after loop inward, the ring change an S on lobe 4's top;
  ↺ mirrors it. A figure of its own: no block, no figure with tiles, no
  node. An X on every lobe; one paint or two, the second on lobes 2 and 4.
  On his 40 × 40 at Step 3, brush 3.5 and 9 with paint: 32 loops, 64.6 m,
  ≈ 27 min (est.). ST-JOHN in every page's top row after INKA; the Library
  opens its saves there. Not run on the machine.

- **INKA: Overlap, one more ring round every tile, onto its neighbour**
  (the owner, 2026-10-19, the third canvas of the evening, the DRAG of
  18:40, IMG_1203 … 1208 with a ruler: "better already, but maybe one more
  pass on every square — let it go overlapping"). By the ruler 2 … 4 mm of
  white between touching tiles, from 7 … 11 before, Edge: out at 0.
  **Overlap**, under Edge: out, 0 — none — by default: a ring outside the
  outer one, the outermost, its brush's edge that far past the tile's —
  at half the brush its middle on the tile's edge; on the outline grown,
  so a block's too. The spiral comes in by it or goes out by it; its
  magnets on it. On his twelve at Overlap 3, brush 5: the paint 3 mm onto
  every neighbour, 41.1 m of DRAG, not 35.9.

- **INKA: the outer ring whole along the edge; Edge: out, an optical
  compensation** (the owner, 2026-10-19, the second canvas of the evening,
  the DRAG of 18:05, IMG_1200 … 1202, tiles 9 … 12 marked: "some came
  nearer, but the last squares still have white borders, though the brush
  spreads quite wide by the end … even half-round corners should leave a
  gap only at the corners, the sides must be flush. Maybe we make an
  optical compensation?"). The plan at the dry brush's width fills every
  tile to its edge but at a ring change: from a side's middle the outer
  ring drifted in before its seam, a white crescent on the tile's edge up
  to a step deep and Ring change long. Now every ring goes whole round to
  its seam and the S comes after it, over the side ahead — TAPE's way, one
  stretch for every ring — before it only where the side ahead is short.
  **Edge: out by** under With paint, 0 by default: the outer ring that
  much nearer the tile's edge, up to its middle on it (0.25 mm in), for
  where the brush lays less than its width (est.; half the gap the ruler
  finds between two tiles).

- **INKA: the outer ring by the dry brush's half again; touching tiles
  meet** (the owner, 2026-10-19, his first canvas of the evening, the DRAG
  of 17:42, `INKA/update-19-10-2026-1.0.9/` IMG_1197 … 1199, the squares'
  outlines drawn in blue: "they must adjoin one another, as on the screen
  … I am surprised at such gigantic gaps between the squares. Maybe I
  knocked some setting off?"). He had not: the outer ring stood the
  trail's half in — Brush width 5 and With paint +5, 5 mm — and his thin
  paint laid far less than 10 mm, so every tile lost 3 … 4 mm a side, the
  tall one 81 mm wide of its 88.5, 7 … 11 mm of white between neighbours.
  The outer ring at the brush's own half (2.5 mm at 5), as on 2026-10-17;
  a thick paint swells past the edge onto its neighbour, as the Drag strip
  shows. With paint — the trail — keeps the Drag strip, the Result and the
  core; the tile's edge no longer.

- **INKA: the reference's spot, its brightest speck, on one tile only**
  (the owner, 2026-10-19, Screenshot 5.10.28 PM, IMG_1522's bright red
  band and little red square gone from the tiles: "I pressed several
  times, it never came. We need an algorithm not by which colour has the
  most area, but by which is the brightest speck in the picture, and let it
  go on one square only, never two or three"). Of the paints not in the
  core, nor like one of it, the one whose pixels are the most colourful
  (mean C* 45 at least, 0.1 % of the painting or more) is the **spot**: OK
  gives it one tile, all four arms, a new tile at every press; no other tile
  takes it, not even thin, and the paints like it (CIEDE2000 under 12 — the
  band's orange edge) leave the accents. IMG_1522: Viridian, Black, Dark
  Brown, the spot Fluo Red; his red canvases with the lime stroke, the spot
  Fluo Lime (their red is core). The palette's line under the Paints' i
  names it. A deal with two touching tiles of one paint dealt again, 20
  times at most, the first without kept.

- **INKA: the reference's OK, dealt anew at every press** (the owner,
  2026-10-19: "when I press Reference nothing happens … there is no random
  going through the colours, as in meta"; "that key has no place there.
  Let us shrink the opacity slider and put an OK button beside it — it can
  be big, in the style of MARKS / DRAG at the top"). The Reference key out
  of the palette keys; **OK** in the Reference block, a deck key beside the
  opacity, now shorter. Its deal at random as from an urn of the tiles,
  each paint its share of them — every press another, the picture's order
  on average (pink 5 of 12 at 51 %, its navy 4.3 at 31 %, white 2.7 at
  15 %: the neighbours apart even it out a little); before, the paint
  furthest under its share every time, so a press dealt the same again.

- **INKA: Reference under Paints, then Brush, DRAG** (the owner,
  2026-10-19: "let us put the Reference block up, near Paints, so that
  BRUSH, DRAG come after it — so it is all logical"). Its own section at
  the foot of the panel gone; New spokes' tip says the X.

- **INKA: Reference reads the painting, not the wall; fluorescent paints
  to buy, a red dot •** (the owner, 2026-10-19, `INKA/references/`, twelve
  of his canvases photographed on a wall: the reference "broke"; "we have
  fluorescent colours there, intense, but I can buy such … add squares with
  marks, a square of the new 'acid' paint, and in its cell on the left in
  the TOOLS, where all the colours are, a red dot • — to buy, or not in
  stock yet"). The wall had been the largest paint — White up to 63 % — the
  frame Sand, the shadows Brown and Black, his neon pink the dark 05.
  - **The painting only**: the background the median of the picture's
    outer ring, the painting the box of what differs from it, in 4 % on
    every side, the frame off; a picture all painting whole.
  - **CIEDE2000** in place of Lab at half lightness: a pink his Pink, a
    teal Sky Blue, a lighter navy Ultramarine.
  - **To buy**: Fluo Red #F30502, Fluo Pink #FA0350, Fluo Orange #F07B10,
    Fluo Lime #C3DB04 — the vivid colours of his twelve clustered, as the
    photographs show them (est.) — under the two columns of his 24 in
    INKA's strip, two each, a red dot on each; a paint to buy wins only 1.5
    times nearer than his nearest in stock. In the paints in use a red •;
    under the Paints' i, "To buy, not in stock yet: …". The other tabs'
    strips as they were.
  - The reference kept at 1 400 px (was 2 000); when this browser has no
    room for it, the Reference panel says so — it was lost on a reload
    without a word.
  On his twelve: the pink canvas Black, Fluo Pink, Red, Yellow Ochre; the
  red one with lime Purple, Fluo Red, Dark Brown, Viridian, thin Fluo Lime.

- **INKA: the knife, K, cuts nodes** (the owner, 2026-10-19: "next to
  Nodes (N) we need a knife (K) that cuts the nodes … the arrows got mixed
  up, and they do not always land the way needed"; "we have Clear nodes,
  but that is a sledgehammer, and I need a scalpel :)"). In the Tools under
  N: a line dragged across the canvas cuts every node it crosses, orange
  while it is drawn; a click on a node cuts that one; the chain falls apart
  there, a tile no node touches a figure of its own; ⌘Z brings them back.
  The M key's tip says the X's arm, as its hint did.

- **INKA: Reference, the palette off a picture in his paints, on every
  tile** (the owner, 2026-10-19, Screenshot 4.15.26 PM: "only up to the 6th
  tile; put 10 and there are no colours :)"; "below we have REFERENCE,
  📎 Add new reference — pictures with a colour range can go there, and it
  appears on all 10 squares. Important: the reference's analysis must match
  the colours we have in stock"; asked, he chose the range dealt on all the
  tiles, not each tile the colour under it). Why the colours stopped: the
  palette keys dealt the chosen tile's figure only, and tiles no node links
  are a figure each. **Reference** after HDay blue: every pixel of the
  reference to the nearest of his 24 paints — in Lab, lightness at half
  weight, as a photograph dulls a paint — counted; the six with the most of
  the picture the core (4 % of it at least), the next three thin (1.5 %);
  dealt on every tile in the picture's shares, a tile never its touching
  neighbour's in any figure, a lone figure one paint; the shares in the
  palette's line under the Paints' i. **The keys with tiles chosen
  together** (⌘A, ⇧ and a click): New colours, New spokes, the meta and
  INKA keys and Clear act on every figure of theirs, the paints spread over
  them the same way. On the owner's canvas photograph IMG_1188: Yellow
  Ochre 36 %, White 27 (the canvas), Deep Red 14, Red 10, Pink 6; on Heather
  Day's color_02: White, Sky Blue, Ultramarine, 03, 04, Viridian (est.).

- **INKA: Flights, a switch, OFF by default** (the owner, 2026-10-19,
  Screenshot 4.08.23 PM, on the dashed blue lines from figure to figure:
  "they magnetise by themselves. Maybe a switch to turn them off? I do not
  really need them"; "I just use NODES"). Under Drag · Result, Off · On as
  INK's, its dot orange: ON, the brush's flight through the air from a
  figure's end to the next one's start on Drag, as before; OFF, none. ❚❚
  wipe stays by every landing; the live trail of a run, and the run itself,
  as they were.

- **INKA: the brush with paint, the core, the ring change, the X** (the
  owner, 2026-10-19, `INKA/update-19-10-2026-1.0.9/`, his canvas of
  2026-10-17 photographed with a ruler: "study the results and make the
  adjustment yourself"; "the brush is not a felt-tip or a Posca marker. It
  takes up paint … and swells in volume").
  - **The trail**: Brush width and **With paint**, +5.5 mm — set at 3.5,
    the brush laid 9 on that canvas (the strip between tiles 8.5 … 9 mm,
    a tile's paint 2.8 mm past its outline on average). The outer ring
    the trail's half in, so the paint ends on the tile's edge; the Drag
    strip and the Result as wide; the tile's reading the rings' paint
    overlapping by the trail less the step.
  - **The core** ("in the centre it has no room left to turn … with a
    9 mm pass it starts to fidget in place"): the rings a step apart until
    the paint meets in the middle, the innermost the trail wide, none
    narrower — on his 64 × 63.5 tile nine rings, the last 9 mm across,
    where eleven went down to 1.75; his six tiles 6.9 m of DRAG, not 8.5.
  - **The ring change** (Screenshot 2.21.20 PM: "too sharp … let the
    transition be as in TAPE or BASF"): from a side's middle — a node
    there — an S of two arcs over the side's last stretch, **Ring change**
    30 mm or as much as the side has (est.); from a corner the square
    spiral as before.
  - **The X** ("a cross X — logical and simple; at the corners eight
    times turned out of no use in practice"): New spokes and a first
    visit lay four arms a tile, corner along the diagonal to the innermost
    ring; a block's from every corner of its outline at 45°; M a click the
    arm nearest it, repainted, never laid twice. The sausages lying stay
    as they are until New spokes.
  - Brush 3.5 mm and Step 3 a new tile's and a first visit's — his;
    `INKA/update-19-10-2026-1.0.9/` his photographs as JPEG, the HEIC gone
    (his word). Not run on the machine yet.

- **INKA, the first tab; TAPE, BASF, LOOM, NOLAN and Test off the top row**
  (the owner, 2026-10-19: "let us do a general cleanup. We need to remove
  the TAPE, BASF, LOOM, NOLAN and TEST tabs"; INKA "is the most
  essential"). The row: INKA · ALU-CUT · CCD · BIAS · ALU · SMKN · Ink ·
  Calibration · Library. INKA is `index.html`, the server's first page and
  `start.command`'s; TAPE's page moves to `tape.html`. The five pages stay,
  as TYPE's and LOVE's did, the Library opening their saves there.

- **INKA: ⌘A, every tile chosen; ⇧ and a click, one more** (the owner,
  2026-10-17, Screenshot 5.11.30 PM: "I need a selection that takes every
  figure on the canvas, cmd+A"). The tiles chosen together are outlined
  orange in a dashed box with their size; a drag of one moves them all,
  their box snapping as one tile does; the arrows move them a mm (⇧ ten);
  ⌫ takes them away with their nodes; ⌘C ⌘V copies them with their
  sausages, turns and the nodes between them, laid beside, touching, the
  pasted chosen together. A click on the canvas, or Esc, lets them go.

- **INKA: ! on a tile its nodes both in its middle, or both on its edge**
  (the owner, 2026-10-17, Screenshot 3.54.39 PM: "maybe such a square
  should be marked with the sign !"). The brush crosses its rings to leave
  there — out round and back to the middle, or in and across to the edge:
  a red ! by its place in the run, in its key, and a line under Nodes
  saying which; a hint, the run as it is.

- **INKA: nodes, the brush's way by hand; a tile's turn; ⌘C ⌘V** (the
  owner, 2026-10-17, `INKA/result/`: "you have the brush's way and the
  colour quite out of control … we need to set its direction"; IMG_1033:
  "let us make nodes … N is free … round points on every square, magnets
  the nodes hold to … set as one wishes, there is no algorithm"). **N** in
  the Tools: every tile's magnets — its middle, its outer ring's corners and
  sides' middles — and a drag from one to one of another tile lays a node,
  his red marker's. Into a tile's middle the brush spirals out, the outer
  ring turned to end where the next node leaves — a side's middle too, the
  rings stepping in square to it there; into its edge it spirals in from
  there. One way out of a tile and one in, a later node in the place of
  the one before, none closing a loop; a tile no node touches a figure of
  its own. N with no nodes lays the snake as nodes, to change; Nodes in the
  panel: From the snake, Clear nodes. **↻ Clockwise · ↺ Anticlockwise** a
  tile. **⌘C ⌘V**: a tile copied with its sausages, laid beside, touching.

- **INKA, a new tab after LOOM: Inca patterns** (the owner, 2026-10-17,
  `INKA/`: "I came up with a new tab, INKA … Inca patterns, square, like
  Mexican rugs or chocolate bars"; Florian Markus's way with the paint, not
  his race tracks; Heather Day's pure colour). Tiles laid with R as CCD's
  rectangles; laid over one another they are one block, one outline — the
  owner's "[" — side by side one figure. DRAG every figure one line, the
  brush down from its landing to its lift: a spiral a tile, the first from
  its middle out, the next from its outside in, middle to middle across the
  rings, the tiles in a snake from the bottom left — his scheme; every turn
  a tangent arc, so the board never stops on the way ("braking to zero is
  not Instagrammable … a stop kills the mesmerising effect"). Before every
  next figure the brush flies over its start and goes up to +45° to be
  wiped, a pause, Continue ("here the brush can be lifted up, so that I
  wipe it"). No Air, no TRACE; MARKS a dash along every sausage. CCD's
  paints — New colours, New spokes, meta 1 … 4 — and Inka (his paper test),
  HDay warm, HDay blue; the sausages spokes from a tile's side across its
  rings to the middle, a tile its paint, never its neighbour's, a lone
  figure one pure paint; M lays a spoke, or one dragged. The Result a walk
  of the brush's grooves on a grid of the canvas (est.); ▶ Play the run and
  ■ Stop playing, as ALU's. A first visit lays the owner's paper test: on
  200 × 200 two figures, 2.4 m, ≈ 1.3 min at 40 mm/s (est.), the wipe at
  68 % on the LCD. The Library opens an INKA save on INKA, and says LOOM
  on LOOM's cards. Not run on the machine yet.

- **BIAS: the deck's pairs the whole width** (the owner, 2026-10-16: "let
  us stretch the keys as STOP and HOME, the space hangs there untidily").
  Under MARKS · 45 SNAKE · 45 AIR, SNAKE PLAIN → · ↑, 90 SNAKE · 90 AIR and
  BIAS SNAKE · BIAS AIR two halves each, no empty first column.

- **BIAS: SNAKE PLAIN → and SNAKE PLAIN ↑, straight stripes as CCD's** (the
  owner, 2026-10-16, the same evening, on 90 tried: "eh … some kind of
  parquet :)) Let us simply do it as in CCD, straight stripes. Snake Plain →,
  Snake Plain ↑. And add them before the 90 SNAKE 90 AIR keys"). Two keys,
  a row of their own between 45 and 90: one family, every lane in turn, the
  snake with the brush down — → every lane across from the bottom up, → then
  ←; ↑ every lane upright from the left, ↑ then ↓ — turning off the
  rectangle as BIAS's snake does; 90's lanes, Step apart. Plain → and
  Plain ↑ among the views. On 220 × 220 at a 16 mm step: 14 lanes each way,
  ≈ 1.3 min at 60 mm/s (est.).

- **BIAS: 90 SNAKE and 90 AIR, the counter check at a right angle** (the
  owner, 2026-10-16, BIAS-plaid/ Screenshot 9.08.29 PM, straight lanes drawn
  over the bias: "here the counter check is at a right angle … 45 SNAKE /
  45 AIR, and add 90 SNAKE / 90 AIR, before the BIAS SNAKE // BIAS AIR
  keys"). Snake and Air are **45 SNAKE · 45 AIR** now, as they were, at the
  rectangle's Angle. **90 SNAKE · 90 AIR**, a row of their own between them
  and the BIAS keys: the same four runs, the lanes upright ↑ and across →
  whatever the Angle — 1 upright every other lane from the right edge, 2
  across from the top, 3 and 4 the lanes skipped — Step apart, centred on
  the rectangle, none down its middle, the brush wholly on it. The views
  two rows, 45 · 90 · Bias, the snakes over the airs; the reading and the
  LCD count 90's lanes its own. On the owner's 220 × 220 at a 16 mm step:
  28 lanes, at 60 mm/s 90 SNAKE ≈ 3 min, 90 AIR ≈ 4 (est.).

- **LOOM, a new tab: Claude's own, a woven cloth** (the owner, 2026-10-16,
  Claude-Freedome/: "full freedom: study the result yourself and come up
  with a tab entirely your own"; IMG_0924 "the coolest", "a texture like
  Bottega Veneta's"). After BIAS in the top row. The canvas one cloth of
  strips at 45°, square to each other, laid in turn as BIAS SNAKE lays them,
  30 mm off the canvas at both ends; where a strip goes under one painted
  before it, the elbow lifts the brush over it on the move — Plain (the
  intrecciato), Twill, Basket — or Lattice, no hop, as IMG_0924. Two layers,
  each its own drawing and paints, run on their own (the owner, on IMG_0921:
  "two independent runs, and it looks dearer than one"). A canvas past the
  reach in two halves: half 1, home, a pause to turn the canvas round 180°,
  half 2. The tones Crimson Ruby, Fall, Azure, Dusk. On a 30 × 30 in Plain:
  93 strips, 563 hops, ≈ 23 min at 30 mm/s; a 60 × 80 ≈ 2 h a layer (est.).
  Not yet tried on the machine. `LOOM.md`: how to run it.

- **BIAS SNAKE and BIAS AIR: fewer idle moves** (the owner, 2026-10-15,
  BIAS-plaid/ Screenshot 2.27.09 PM and 2.27.43 PM: "only one diagonal
  starts from the right side and goes sideways down; then an idle pass over
  the canvas up, and straight from there a pass along the opposite diagonal
  to the right side; from there down through the air …"). The rising lanes
  each run down ↙ from the right or the top, the crossing ones ↘ to the
  right side (↖ from the bottom left), every lane its way — no longer from
  the end nearer. Between two, BIAS SNAKE keeps the brush down off the
  canvas where that is at most 1.25 times straight across — along the side
  it left by — else lifts and flies over the canvas; BIAS AIR always flies.
  Drag dashes the flights blue, as the run's trail. On 350 × 350 at a 12 mm
  step BIAS SNAKE ≈ 13 min, ≈ 17 before (est.).

- **BIAS: a margin round the canvas** (the owner, 2026-10-15: "the canvas is
  really 30 × 30 … 25 mm on every side to let the brush turn … a margin on
  the screen, so that it is all professional"). Margin round the canvas,
  25 mm, a slider: the canvas stays the real one, the margin drawn round it,
  a pale band, its outer edge dashed. BIAS SNAKE's and BIAS AIR's 30 mm off
  the canvas stop where the brush's edge would leave the margin (at 45° the
  30 mm fit); the reading warns when any way goes past it.

- **BIAS SNAKE and BIAS AIR: the two families in turn** (the owner,
  2026-10-15, on the first try, BIAS-plaid/ 2.13.26 PM and 14:17:03: "after
  the first diagonal the brush makes only one line, then goes the other way
  to make a pass in the opposite direction"; "7 lines one way and not one
  across"). A rising lane, a crossing one, a rising one … — the rising from
  the bottom right corner up, the crossing from the top right corner or the
  bottom left — every lane once, 30 mm off the canvas at both ends. BIAS
  SNAKE one landing: every lane from its end nearer, the way between round
  the canvas off it, round two corners if it must; BIAS AIR every lane its
  family's way. Drag numbers the lanes in their turn, rising in ink,
  crossing in rust. Before, every rising lane, then every crossing one.

- **BIAS: BIAS SNAKE and BIAS AIR, two runs** (the owner, 2026-10-15, the
  afternoon, after the four runs on the machine, BIAS-plaid/ 12.57.38 …
  13:04:33: "in the first two passes it takes all the paint, leaving none for
  the third and fourth — mud"; "two runs, not four"; "call the brush BIAS
  SNAKE // BIAS AIR"). Two keys under Snake and Air, which stay: 1 every
  rising lane from the bottom right corner, 2 every crossing lane, from the
  top right corner (strokes ↘) or the bottom left (strokes ↖, the paint
  dragged from the other edge) — a key on the rectangle. Every lane starts
  and ends **30 mm off the canvas** ("our construction allows simply going
  +30 mm aside, so the brush straightens out off the canvas and reaches the
  edge evenly"), a slider; Drag shows it dashed. The Result, Bias Snake and
  Bias Air among the views, to compare how the paints mix. The walls'
  warning now names the Bottom and Left edge the canvas needs.

- **BIAS, a new tab: CCD on the bias** (the owner, 2026-10-15, BIAS-plaid/:
  "a new way of painting, on the base of the CCD tab: absolutely the same
  palette and the same principle — DRAG Snake / DRAG Air. The only
  difference: the stripes not straight but diagonal"). After CCD in the top
  row. Every rectangle two families of diagonal lanes, rising ↗ at Angle
  (26.6°, his sketches') and descending ↘ square to them (✕ Mirror a key),
  Step apart (32 mm, his), one of each through the bottom left corner.
  DRAG in four runs, no stop between them: 1 rising every other lane from
  the bottom right corner up to the top left, 2 descending every other lane
  from the top right corner down, 3 and 4 the lanes skipped ("the brush
  must not drive over the ones already painted"; his schemes 10:52:26 and
  10:52:30). Snake: a run one landing, its lanes forward and back, turning
  2 mm clear of the canvas (est.), round a corner if it must; a lift and a
  flight between the runs. Air: every lane one way, left to right. CCD's
  paints, squeezed along the four edges and vertical rows inside (Rows 3:
  the middle, his hand test), New colours, New spokes, meta 1 … 4, Density,
  M, MARKS; the Result run after run, the later lanes dragging the earlier
  ones' wet paint. A warning when the canvas lies on a wall: the snake's
  turns there would run along its edge — lay it a brush's half and the
  clearance off (Bottom edge ↑ 6 mm with the 6 mm brush). CCD untouched.

- **CCD: Lanes a field with arrows** (the owner, 2026-10-13: "I do not
  need '7.26 mm apart', only 32; arrows up and down as LEFT and BOTTOM,
  for a finer setting"). The lanes typed or stepped one by one, the slider
  under it as before; the pitch stays in the reading under Rows (the gap or
  overlap) and in the plan's (i).
- **CCD: Snake back to the next lane, as it was** (the owner, 2026-10-13,
  after a canvas, Cruz-Diez/IMAGE 2026-10-13 19:02:03: "let us bring SNAKE
  back with the return along the opposite lane, as it was"). Snake: the
  lanes back and forth again, a step across at each end. Duo Snake stays
  there and back along the same lane.
- **Sand Yellow lighter: #FBE7BC** (the owner, 2026-10-13: "your Sand
  Yellow is too yellow — FBE7BC, in life it is a little lighter"; #F3C06D,
  read off the swatch, before). One paint list, so on TAPE, BASF and CCD
  alike.
- **CCD: Snake and Duo Snake back along the same lane** (the owner,
  2026-10-13: "yes, listen, along the same lane. Redo it here and in Snake.
  I am testing it live; sometimes in practice our ideas do not work as in
  theory"). Every lane there and back along itself with the brush down,
  then a step across to the next one's start — at the paint's edge on
  Snake, at each half's edge on Duo Snake; PAUSE at a lane's end as before.
  Before, the next lane back. Snake now takes about twice as long. The
  Result drags every lane both ways.
- **CCD: Duo Snake and Duo Air; Duo Air 5 mm past the middle** (the owner,
  2026-10-13, testing Duo: "add 5 mm at the lift, the head with the brush
  comes off before the centre"; "I need two DUO — DUO SNAKE and DUO AIR …
  DUO SNAKE, when the brush reaches the centre, turns and goes back; the
  extra key will not fit in the row of SNAKE and AIR, it can be split").
  The deck in two rows: MARKS · Snake · Air, under them Duo Snake · Duo
  Air. Duo Air as Duo was, each half **Duo Air: past the middle** mm on
  before it lifts — a slider under Brush, 5 mm by default; its Result's
  paint ending 5 mm before the lift (LIFT_EARLY, the owner's observation),
  at the middle. Duo Snake: each half the snake, from its edge to the middle
  and back with the brush down, a step across at each end, turning at the
  middle itself (no lift there, so no 5 mm); every other lane starts at the
  middle and takes its paint from the rows inside, so with the edges' rows
  only those lanes stay dry (the run's question says so). The Result as
  Snake, Air, Duo Snake or Duo Air.

## v.1.0.8 — 2026-10-13 · Genesis

- **v.1.0.8, CCD in colour** (the owner, 2026-10-13: "hooray!!! thank
  you! all great. Now we can push and make an update on GitHub, it is
  REMBRANDT v.1.0.8"), on every tab and in the saved SVGs (`rembrandt:
  '1.0.8'`). Named Genesis (*Claude's name*), after the pattern born on a
  20 × 20 and repeated on the bigger canvases. What is new:
  - **CCD paints like TAPE, in straight rows.** The owner's 24 paints by
    the Tools; sausages squeezed in rows across the lanes, a stripe of 1,
    2, 3 or 6 lanes each; New colours, New spokes, meta 1 … 4, Density,
    the paints in use with their counts. **Rows** 1 … 12, evenly from edge
    to edge — four on the 20 × 20.
  - **Density in millimetres.** At 50 % the measured sausage: the line
    full 70 mm, then fading; twice the paint every 25 %.
  - **The genesis repeated.** A pattern laid on 20 × 20 repeats at the same
    scale on 30 × 30 and 40 × 40: the pitch kept, more lanes, the stripes
    and rows again and again.
  - **MARKS** on CCD: a watercolour dash where every sausage goes. **Duo**:
    every lane from the far edge to the middle and back in the air, then
    from the other edge. **Drag · Result**: where to squeeze, and the
    painting as Snake, Air or Duo would leave it (est.).
  - **Black arrows**: a paint clicked in the list shows its places,
    numbered in the order MARKS goes.
  - **HOME** next to STOP on CCD, TAPE and BASF: the brush up, the
    carriage home. CCD's brush round, the flat one gone.

- **CCD: a paint's places under black arrows** (the owner, 2026-10-13,
  Cruz-Diez/Screenshot 3.48.15 PM: "highlight with black arrows where to add
  the paint — I am a human, in the physical world my eyes run wild at so
  much paint; I click Purple and it shows its seven places"). A paint
  clicked in the list: Drag shows its sausages outlined black, the others
  faint, a black arrow to each along its lane, numbered as MARKS goes — row
  by row from the paint's edge; a white halo so they read on the dark table.
  Clicked again, gone. Changing it by the strip stays as it was.
- **CCD: the paints on the page** (the owner, 2026-10-13: "PAINTS i, New
  colours, New spokes, meta 1, meta 2 (presets) and DENSITY, and the set of
  paints in use — only ours go straight"). TAPE's strip of 24 paints by the
  Tools and M: a click on a stripe at a row puts a sausage of the chosen
  paint there, in the genesis, so on every repeat; again, it goes. The
  chosen rectangle's Paints: New colours, New spokes, meta 1 … 4, Density
  (its reading the mm the line stays full), the paints in use with their
  counts, change, + and ×. **Rows** under Lanes, 1 … 12. A bigger rectangle
  repeats its genesis at its scale, its lanes following the genesis's pitch
  ("Genesis 200 × 200 mm, 40 lanes — here ×2 across, ×2 along"). **The
  deck**: TEST · PAUSE, MARKS · Snake · Air · Duo, STOP · HOME; **INK** for
  MARKS' watercolour and TEST's dip (ON by default, as TEST dipped before).
  **Views Drag · Result**, and the Result as Snake, Air or Duo: on Drag the
  sausages in their paints, MARKS' dashes under them, a sausage's name under
  the pointer; the Result every lane in five grooves, the paints mixed as
  pigments, the dry brush's streaks; the snake's bead left at a lane's end,
  the bristles carrying a little over (est.). The Library save keeps the
  sausages.
- **CCD's plan: the paints** (`ccdplan.js`, the owner, 2026-10-13:
  TAPE's paints on CCD, "only here they go straight", Cruz-Diez/IMAGE
  2026-10-13 14:47:37). Sausages in rows across the lanes, a stripe of 1, 2,
  3 or 6 lanes each (TAPE's stripes); the rows evenly from the paint's edge
  to the far one, both in — four on the owner's 20 × 20; the paints dealt as
  TAPE's, never two alike along a stripe or across a row. **The genesis
  repeated at the same scale** (the owner: "a repeat at the same scale, not
  bigger"): a bigger rectangle keeps its pitch, its lanes grow, the stripes
  and rows again and again, cut at its sides. **Duo** (TAPE-colors/IMAGE
  2026-10-12 18:44:00): every lane from the far edge to the middle, a lift,
  back in the air, then from the paint's edge — the top half first, the
  right one on a horizontal rectangle. **MARKS**: a watercolour dash a
  sausage, a dip every fourth (ALU's). **The Result** a lane at a time, the
  paints mixed as pigments; a sausage at Density 50 % keeps the line full
  70 mm, the measure (TAPE-colors/IMAGE 2026-10-12 19:23:33), gone by about
  120; twice the paint every 25 % (est.). meta 3 and meta 4 from
  TAPE-colors/ 18:43:57 and 18:43:59 (Claude's reading). TAPE untouched:
  its paints, families and stripes imported.
- **CCD: HOME next to STOP** (the owner, 2026-10-13: "next to STOP make a
  HOME, so that the arm with the brush goes back to the bottom left
  corner"). The brush up, the carriage to home: the two blocks every run
  ends with, sent as a run of its own; `rembrandt.py` untouched. Pressable
  when nothing runs — after STOP, or after a run.
- **TAPE · BASF: HOME next to STOP**, as CCD's (the owner, 2026-10-13:
  "yes, it can go on TAPE and BASF, thank you"); the two blocks shared,
  `homeBlocks` in `strokes.js`.
- **CCD: a round brush, no flat one** (the owner, 2026-10-13: "we do not
  take the flat brush, the tests showed it is useless — it does not work at
  all"). The stop before a rectangle that runs the other way no longer asks
  to turn the brush; the page no longer names a wide side.

## v.1.0.7 — 2026-10-13 · Phone

- **v.1.0.7, Rembrandt on the phone** (the owner, 2026-10-13: "all great.
  We can push. Make it v.1.0.7, write an update about the mobile
  version"), on every tab and in the saved SVGs (`rembrandt: '1.0.7'`).
  Named Phone (*Claude's name*). The paintings can now be looked at on the
  iPhone, whose screen shows the colours better than the old monitor by
  the Mac (the owner: "the colours are not as juicy there"):
  - **How to open it.** The iPhone on the same Wi-Fi as the Mac, Safari at
    `http://<the Mac's address>:5165/` (on 2026-10-13
    `http://192.168.0.227:5165/`; the router may give the Mac another
    after a restart). A small bridge on the Mac passes the pages from
    `rembrandt.py`, which still listens on this Mac only, untouched. It is
    Claude's, outside the repo for now, and runs while the Mac is awake.
  - **To look, not to run.** The bridge passes reading only: no TEST,
    TRACE, SNAKE or AIR, no SAVE and no deleting in the Library from the
    phone. To see a painting from the Mac as it is: 💾 SAVE on the Mac,
    then open it from the Library on the phone (the phone keeps its own
    settings; the Mac's palette and spokes do not travel by themselves).
  - **What the phone shows.** The page one column: the tabs a row that
    slides sideways, the board the screen's width, TAPE's paints two rows
    of 12 under it, the tools, then PROGRESS and the settings, scrolled
    down. Lying down, the board the screen's height. A tap on a drop on
    Drag names its paint.

- **The phone** (the owner, 2026-10-13, on the iPhone over the home Wi-Fi:
  "better make a mobile version, if you can — the right panel with the
  clock covers the screen. The top row of tabs does not scroll"). Up to
  760 px wide, or 500 px high lying down, every page one column that
  scrolls: the tabs a row that slides sideways, this tab brought into sight
  (`lamp.js`, loaded on every page); the zoom; the board the screen's width
  (lying down its height); the tools in a row; then the panel — PROGRESS,
  the keys, the settings — and the status, wrapped. Upright, TAPE's and
  BASF's 24 paints two rows of 12 under the board; `layout()` measures the
  strip instead of its 78 px. A tap on a drop on Drag names it, as the
  pointer does on the Mac. The Mac's page as it was.

- **TAPE · BASF: a drop's name under the pointer on Drag** (the owner,
  2026-10-13: "make tooltips on Drag — when I bring the pointer to a
  colour, the drop's name pops up; on the small drops I cannot tell Black
  from Purple"). A cloud by the pointer: the paint's chip, its name, *thin*
  for an accent; the spoke nearest within its dark edge (1.8 mm, 4 px at
  least), the one drawn last when two meet. Drag only, not during Play.

- **TAPE · BASF: Drag's lanes grey 15 %** (the owner, 2026-10-13,
  `TAPE-colors/Screenshot 2026-10-13 at 12.51.57 PM.png`: "the outline in
  DRAG is too black. Make it grey please, 30 % — it will be easier for me
  to see the drops of colour there"; then, of the 30 %: "looks like 60 %.
  Let's have 15 % grey then"). The lanes on the Drag view the ink at 15 %
  instead of the tape's colour; the spokes' paints read on them. The
  Result and Play as they were.

## v.1.0.6 — 2026-10-12 · Tape

- **v.1.0.6 after the name** (the owner, 2026-10-12: "great! thank you very
  much! we set v.1.0.6 and can push it to GitHub"), on every tab and in the
  saved SVGs (`rembrandt: '1.0.6'`). Named Tape, after the day's two tabs
  (*Claude's name*). With it go up the CCD tab of 2026-10-11, not pushed
  before.

- **BASF: rounded squares from the middle** (the owner, 2026-10-12,
  `TAPE-colors/Screenshot 2026-10-12 at 8.15.45 PM.png`, the short
  rectangle in the middle ringed: "our canvas is 20 × 20, and with no
  cassette there is no need to break the width and height in its memory.
  You can make a square with round corners at once; such sharp corners I
  will not make with a brush anyway"). BASF's lanes no longer the
  cassette's offsets inwards: every lane a rounded square, all of one
  shape, the innermost half a brush across at the middle; Corners the
  corner's share of the half-size — half at the middle of the slider,
  squares at Angle, circles at Round. The sides one pitch apart, the
  corners 0.41 of the straight share of a pitch wider (0.8 mm at a 4 mm
  pitch and the default; none for circles). The lane change reckoned on the
  lane about 40 mm out (`BASF_REF`, est.). Cassette size and First lane off
  BASF's panel; its Corners scale Square · Rounded · Circle. TAPE as it was.

- **BASF, a new tab: the tape wound to the middle** (the owner, 2026-10-12:
  "let's call the new tab BASF, in honour of the cassettes gone … leave the
  winding at 100 % where the cassette is now … just grow the spiral
  inwards, so that without touching Cassette size the spiral winds on to the
  middle of the canvas. Then on Drag we lead the sausages to the centre, and
  in the Result the same proportion, but the wound tape in the centre").
  `basf.html`, after TAPE in every page's row; TAPE's page module with its
  body's `data-tab="basf"`, its own keep, 💾 SAVE BASF labelled BASF and
  opened there. The plan's `inner`: lanes inside the cassette's lane 1,
  true offsets inwards, one pitch apart, the first at the middle — 8 lanes
  inside a 100 % cassette at a 4 mm pitch — the lane change as the
  cassette's lane has it, sampled on the outer lane of each change. No
  cassette drawn, none in TRACE, its section off the panel. Tests: the
  cassette's lane as TAPE's, the inner lanes one pitch apart to the middle,
  one path, the machine's pieces within 0.1 mm.

- **TAPE: Cassette size from 0 % — the cassette may go** (the owner,
  2026-10-12, `TAPE-colors/Screenshot-2026-10-12-.png`: "OMG!!! Claude, this
  is incredibly beautiful!!! We did it"; then "why do we need the cassette at
  all now? … the limit there is 80 % — take it to 0 %? … It came out so
  cool that the cassette only cheapens it. Without the cassette,
  contemporary art of an amazing shape"). Cassette size 0 … 130 %: at 0 %
  no cassette drawn, no outline in TRACE, the tape wound from the centre,
  its shape as Corners says — circles at Cassette, squares at Angle; a small
  one a window, the inner lanes round, the outer near circles. A corner's
  two spots that coincide, the sides gone, are one (`spotsOf`).

- **TAPE: meta 1 and meta 2, the owner's two ideals as palettes** (the
  owner, 2026-10-12, `TAPE-colors/meta-tape-01.jpg` and `-02.jpg`: "maybe
  you can take something from them for new keys, meta 1 and meta 2"). Two
  keys under New colours: meta 1 the blues — ultramarine, 04, sky, white,
  black, 03 — with orange, orange yellow and purple flecks, its first ring
  white and sky; meta 2 the plums — purple, black, pink, sand, white,
  orange — with ochre, ultramarine, red and rose azo threads, its first ring
  ochre and orange, gold. A press deals the preset anew, the spokes staying
  in their places; the key of the palette on stays down. A palette may carry
  its first ring's paints (`inner`), kept through the list's changes.

- **TAPE: the Result streaky, as the owner's ideal; the spokes on Drag
  only; the palette in hand** (the owner, 2026-10-12,
  `TAPE-colors/meta-tape-01.jpg`: "much better already! but I would take the
  sausages themselves off the Result, let them be on Drag only"; "take away
  1 lane, 2 lanes, 6 lanes — better an option to add or change a colour
  among those chosen"). The Result draws every lane as five grooves, each
  its own pick and breath (`mixGrooves`), its colour dragged forward 5 … 45
  mm, lane by lane, its brightness wandering ±12 % about every 15 mm: the
  changes torn into streaks (all est.). The pattern's rings hold their tone,
  dark and light in turn; an accent a fleck, a third of the paint (`FLECK`).
  The spokes drawn on Drag only; picking a paint for M goes to Drag. The
  lane keys gone: M lays the pattern's stripe under the pointer, else six
  lanes. In the paints' list a click, then a paint in the strip, changes it
  on every spoke; + then a paint adds it to the palette, the spokes
  repainted in their places; × takes one out.

- **TAPE: the spokes a pattern, not a daisy** (the owner, 2026-10-12, his
  collage `TAPE-colors/Screenshot-…6.51.00 PM-.png`, the 8 October paper
  test photographed again: "strictly on every corner two spokes"; "the
  nearer the cassette, the richer the colours; the farther, the colour comes
  to nothing. So the number of spokes must not be random. Only the palette
  changes, the sausages stay in their places … the brush runs out after 7
  cm; the pattern must be made with that"). New spokes lays stripes of 6,
  3, 2 or 1 lanes, mixed, each through spots at both ends of every corner
  and more where its outer lane would go 70 mm without paint, 60 mm apart
  at most (the paper test's, `ALU-Claude/paper-test/`), so the outer lanes
  get more; along a stripe the paint changes at every spot, a thin stripe an
  accent more often. New colours repaints the spokes in their places. The
  random four to eight radial spots gone; 1 · 2 · 6 lanes for M only.

- **TAPE: Density; spokes of 1, 2 or 6 lanes; the paints in use in sight**
  (the owner, 2026-10-12, `TAPE-colors/Screenshot … 6.49 … 6.52 PM.png`, a
  reference laid beside the Result: "they are somehow thin. The reference
  has rich colours, grown-up. We need a density of colour slider"; "not only
  over 6 lanes but over 2; I would try 1 lane at all"; "what is useful to
  see here is the chosen colours with numbers or names", the rest "under the
  i"). Density 0 … 100 % multiplies the paint in a spoke ½ … 64 times (50 %
  by default, est.; before, about 14 %): on 230 × 230, 4 → 56 → 80 % of the
  tape a whole film. Spoke 1 lane · 2 lanes · 6 lanes for a click and New
  spokes; a dash of one or two lanes an accent now and then. The paints in
  use a list of chips, names, spokes and "thin"; the how-to, the palette, its
  seed and the spokes' count under the Paints' i.

- **TAPE: New colours and New spokes, as ALU's** (the owner, 2026-10-12,
  `TAPE-colors/`, eleven striped canvases: "I need an algorithm as for ALU,
  so that I click a key and the palette changes at random … with our own
  paints and the spiral round the cassette"). Eight families read off the
  references in his paints — Ice, Ember, Signal, Cream, Blush, Sky and
  rust, Carnival, Dusk — a core and thin accents. New colours: another
  family than the last, three to five of its core paints and one or two
  accents; the spokes lying there take them, or new ones are laid. New
  spokes: four to eight spots round the cassette, about evenly apart, a dash
  a block of six lanes out to the canvas's edge, a block's last two lanes an
  accent now and then; two dashes on a radius, or on the same lanes at
  neighbouring spots, never one paint. The view goes to the Result; the
  palette and its seed are kept, ⌘Z goes back. Tests: the families his
  paints, the spots and the dashes, a seed the same spokes.

- **TAPE: a spoke six lanes at most, dash after dash** (the owner,
  2026-10-12: "I do not lay the colour as an even sausage over the whole
  length. It wants breaking into 6 lines at most; I will make 12 myself, one
  after another, as a dashed line — and 18 too; then one fragment at the
  bottom may have one colour, or two, or three"). A click with M lays the
  block of six lanes under the pointer — 1 … 6, 7 … 12, 13 … 18 — lined up
  with a spoke lying within 5 mm there, so the dashes run on along one
  radius; a drag lane to lane, six at most (`blockOf`, `dragLanes`).

- **TAPE: every paint off its swatch; two columns of 12** (the owner,
  2026-10-12, `colors-004…006.jpg`: the second sheet — "the Chinese are
  circus artists, of course: Green, White, Purple, no fuss" — and "White
  again, specially for you — you are calibrating something there"; "maybe
  in two rows of 12"). The nine paints read off the maker's chart before now
  off his swatches, the second sheet calibrated on its White to read as the
  first; Rose Azo added, 24 paints. The strip two columns, light and warm
  in the first, cool and dark in the second.

- **TAPE: the owner's paints, the spokes, the Result mixing them** (the
  owner, 2026-10-12, `TAPE-images/`: "I try to make a mix as Florian does,
  but I lack a layout of the real paints I have"; Florian's software "really
  mixes the colours on the computer … we can make such a thing too, right?";
  "can these colours go in the TOOLS on the left, as in ALU"). A strip by
  the Tools of his 23 paints — the 18 Shuttle Art and his own 01 … 05 — the
  colours off his daylight swatches, the paper taken for white, or off the
  maker's chart where not swatched yet (est.). M lays a spoke of the chosen
  paint across the lanes — a click all of them, a drag lane to lane — on the
  canvas only; a click on a spoke takes it away; Clear the spokes in the
  Tools. The Result mixes them along DRAG's own walk: at every step the
  brush picks up PICK of what lies there and lays down what it carries over
  SMEAR mm, the paints mixed as pigments (`mixWalk`, est.); the ground mixed
  in where the paint thins, drawn opaque. Play the run shows the mixed paint
  where the brush has been; the spokes saved and in the save's SVG. Tests
  for the paints, the spokes and the mixing; `window.__tape` for the
  console, as the prototype's.

- **TAPE: no paint stops, no segments** (the owner, 2026-10-12, on the
  first DRAG: "I press Snake and the pause comes at once, right on the
  first segment. Not on the first — not at all. Press it 27 times? What
  for?"; then on Segment at 40 mm, 269 of them: "this option must go, we
  have overcomplicated something"). DRAG paints the tape in one go: Snake,
  the run's strokes forward, back, forward with the brush down, the brush
  landing once; Air, each stroke from the start and a flight back. PAUSE
  waits where the tape passes the seam, a lap's end, or at a turn, never on
  a lap. The Segment slider gone; the reading, the confirm, the keys' titles
  and Play the run without a stop. `plotRun`'s pauseOver removed: `strokes.js`
  as it was before TAPE.

- **TAPE: no pencil; TRACE the cassette's outline only** (the owner,
  2026-10-12: "too long, that will not do. I will just mark the rectangle
  with the brush"; "so we take the cassette away and keep its outline — the
  cassette can stay in the Result. I will cut a stencil out of cardboard and
  draw round it in 30 seconds; why wait 16 minutes?"). TRACE: the shell, the
  box the lanes hug, round from 12 o'clock — the other way with Counter —
  and on 60 % over its start, the brush lifting off over the lap, as every
  loop of Rembrandt's TRACE; ≈ 20 s at 40 mm/s; and the tape's guide as
  before. The rest of the cassette faint on Trace, whole in the Result. In
  parts gone with the pencil (commit 2392c00 keeps it); the pencil gone from
  the titles, the reading and the confirm. The save's layers: cassette, its
  SVG; trace-cassette, its outline. A run under a minute reads in seconds.
  DRAG untouched.

- **TAPE: TRACE in parts, the pencil never going up** (the owner,
  2026-10-12, `TAPE-images/` 15:21: Counter moved the cut from the top left
  corner to the top right — wherever the line had gone up; the holder
  15:21:49: "it is the spring — a construction for the brush, and sitting
  down to change it all now is a lot of time. Let's draw not continuously
  but in parts, stick, stick, cucumber"; "the springs matter, otherwise the
  pencil's point can hole the canvas; the brush has no trouble at all"). A
  line is cut where it starts up the picture steeper than 20° (est.); every
  rising stretch drawn top to bottom, a stroke of its own; a rise under 3 mm
  goes on with the rest; the strokes 4 mm over each other at their joints
  (est.), so a landing and a lift-off fall on a line drawn. The shell is the
  owner's П and its fourth side; a circle two halves; the guide about four
  strokes a lane. **In parts** in the Trace keys, ON by default; OFF, every
  line in one go, a closed one round twice. TRACE on 230 × 230: 26 lines,
  ≈ 11 min → 107 strokes, ≈ 16 min (est.).

- **Rembrandt.md: TAPE after the pencil's first traces** — §1: closed
  outlines round twice, no lift at the canvas's edges, Counter for the
  cassette too, with the owner's words of 2026-10-12.

- **TAPE: Counter takes TRACE's cassette the other way round too** (the
  owner, 2026-10-12, `TAPE-images/` 15:03: every loop's top left corner cut
  by the pencil, the left sides drawn in several strokes, while the screen
  draws them round — "the pencil is drawn like a bow with an arrow …";
  "before changing anything globally, run it the other way round: let's see
  whether the springs tilt the pencil so that it shoots up from the middle
  of the left side and cuts the top left corner, or it is really the
  motors"). Counter mirrored the tape's spiral already; now the cassette's
  outlines go the other way round from their file's too, so all of TRACE
  runs backwards.

- **TAPE: no lift at the canvas's edges** (the owner, 2026-10-12: "on the
  corners there is no need at all to lift the head — the canvas sits firm
  on its supports on the table, the brush just goes through the air and
  fits into the corners smoothly; we only lose time on the lifts"; and on
  Claude's offer to lift past 100 mm off the canvas: "no, really, let it
  just go without a lift, I will be calmer"). A path is one run from its
  first sample on the canvas to its last, the stretches off it with the
  brush down, in the air: the spiral one run, a closed ring one. The paint
  stops cut equal lengths of the tape on the canvas, so every one falls on
  it. At the defaults 72 stops → 49, 71 lifts → 48, DRAG Snake ≈ 23 → 29
  min (the outer lanes go round in the air at the brush's speed). The
  prototype's runs kept for its acceptance (`keepDown: false`).

- **TAPE: TRACE takes a closed outline round twice** (the owner,
  2026-10-12, the pencil's first trace, `TAPE-images/`: the screws' circles
  and the holes in the trapezoid a short stroke, "a quarter of a circle at
  most, then it goes up"; the shell's last corner not drawn — "draw the
  circle double, so it surely goes the full 360 degrees on the canvas with
  the pencil"). The landing and the lift-off, 3 mm each on the move, ate
  half of a 12.6 mm screw, and the pencil touches only at the bottom of
  them; now they fall on a line already drawn. Open lines once, as before.

- **Rembrandt.md and README: TAPE.** The glossary's TAPE, and its words —
  lane and pitch, seam, lane change and closed rings, run, segment, paint
  stop and overrun, its Snake and Air — marked "on TAPE" where ALU or CCD
  use the word otherwise; §1 TAPE first with the owner's words of the day,
  the pencil for TAPE's TRACE an exception to "no pencils any more"; §8 its
  page and the top row; README's layout and modules.

- **TAPE, the first tab: a cassette in the centre, its tape wound round it**
  (the owner, 2026-10-12: "TAPE first tab, all correct. index."). TAPE ·
  ALU-CUT · CCD · ALU · SMKN · NOLAN · Test · Ink · Calibration · Library on
  every page; TAPE is `index.html` (`src/tape.js`), ALU-CUT moved to
  `alucut.html`, the Library opening each one's saves there. CCD's page:
  the board, the canvas from home — the cassette always in its centre, the
  size typed by hand ("just leave 200 × 200 by hand, as on ALU and CCD"; no
  format keys, 60 × 60 not refused: "motivation to buy the cross rails") —
  the zoom, the LCD. The deck TEST · PAUSE, **TRACE · Snake · Air**, STOP
  ("Marks is not needed"; "two Drag — the snake, and there along the canvas,
  back through the air"). TRACE the cassette's outline and the tape's guide
  with the pencil; **INK** as on ALU: ON, in watercolour from the cup ("maybe
  a pale watercolour trace with a thin brush will do"); TEST dips only with
  INK ON. DRAG a stop before every segment, the first too, the brush up over
  its start to show where to squeeze ("yes, absolutely fine"); PAUSE at a
  segment's end. The panel: the views Trace · Drag · Result and ▶ Play the
  run ("of course, the views ours, that is the canon"); the cassette,
  Default or Load SVG… (its transforms applied, its size from its width in
  mm or cm); Trace: Cassette outline, Tape guide, Trace speed (est.); the
  prototype's sliders and keys, its readouts and one ⚠ line a warning; the
  Result's ground and tape colours in the Tools. 💾 SAVE TAPE: an SVG
  centred on the canvas with the prototype's layers — trace-cassette,
  trace-tape, drag-tape — lines and arcs, the state in its metadata; no
  separate Export SVG. Checked in a headless browser with the runs blocked:
  the three views, Play, the confirms, TEST, a save and its opening, a
  loaded SVG; ALU-CUT, CCD, ALU and the Library open without an error.

- **TAPE: the plan, the tape wound round a cassette** (the owner,
  2026-10-12, `TAPE-Claude/`: chat-Claude's prototype v0.3, "everything is
  super now"). `src/tapeplan.js` and its tests: the prototype's geometry —
  every lane a rounded rectangle one pitch outside the last, the lane change
  one smoothstep for every lane, the runs on the canvas, the segments — its
  numbers equal to `TAPE-Claude/reference/acceptance.json` in all ten
  cases. For the machine lines and arcs: a lane's sides and corners exact, a
  lane change fitted with biarcs within 0.1 mm, the cassette's outlines
  (any SVG path) within 0.02 mm. DRAG a pass a segment, the snake one path
  of its strokes, air a path a stroke; TRACE the cassette and the tape's
  guide, with INK a dip as ALU's TRACE. `plotRun` takes `pauseOver`: the
  brush goes over a pass's start and the pause waits there, the first pass
  too — TAPE's alone, every other tab as it was. The owner's
  `cassette_trace.svg` in `app/`, the tab's built-in cassette.

- **CCD: DRAG in two keys, Snake and Air** (the owner, 2026-10-11: "two
  DRAG keys — the snake and through the air; on ALU-CUT we made a switch,
  here it is all simple"). Snake: a rectangle one row, its lanes back and
  forth with the brush down, a step across at each end, the brush landing
  once a rectangle; PAUSE at a lane's end, as ALU's snake. Air: as before,
  every lane one way and a flight back. The plan reads both times; the LCD
  the key last pressed.

- **CCD, a new tab after ALU-CUT: rectangles of straight lanes, after
  Carlos Cruz-Diez** (the owner, 2026-10-11, `Cruz-Diez/`: "no trace, no
  marks — I just squeeze the paint at the bottom and the brush drives it
  from the bottom up. Evenly … a free-transform rectangle … the lines not 18
  at most, but all 218 — that is why a new tab: I do not want to mix up
  ALU-cut"). `ccd.html`, `src/ccd.js`, `src/ccdplan.js` and its tests. V
  moves a rectangle and stretches it by its eight handles, its edges
  snapping to the canvas's and the others'; R lays a new one with a drag.
  The chosen one's Vertical ↑ · Horizontal →; Lanes 1 … 218, the pitch and
  the white or the overlap between lanes read under it; Left · Bottom ·
  Width · Height by the ruler from the canvas's bottom left corner; Whole
  canvas, Duplicate, Run earlier, Run later, Delete. Brush width up to
  50 mm, Drag speed, Lands before the paint's edge, Lifts past the far edge.
  The deck TEST · PAUSE, DRAG alone, STOP: every lane one way, the brush
  lifting past the far edge and flying back; PAUSE at a lane's end; a stop
  before every next rectangle, to wipe the brush, squeeze its paint and turn
  the flat brush where the direction turns. The board the canvas and home,
  not the whole image area, so a 20 × 20 canvas fills it. 💾 SAVE CCD, the
  Library opening it there; the lanes as an SVG. CCD in every page's top
  row; ALU-CUT, ALU and SMKN untouched.

## v.1.0.5 — 2026-10-11 · Cut

- **ALU-CUT: the orange guides over the Result too; the views without
  numbers** (the owner, 2026-10-11: "with Result on, the same orange guides
  as in Trace / Marks, please; there are numbers there for some reason, 1
  Trace, 2 Marks — I would take them out, only noise"). The chosen pipe, its
  points, its chosen segment and the cuts with ❚❚ drawn over the Result, but
  for Play the run; Design · Trace · Marks · Drag · Result. ALU and SMKN as
  they were; the files keep their pass numbers.

- **ALU-CUT: New colours for the chosen segment; no New composition** (the
  owner, 2026-10-11: "it is not clear now what COMPOSITION is for. New
  composition — not needed at all; we remove it. New colours is needed, but
  it changes every colour as before, even when the sausage is cut into three
  segments; I would rather pick one segment and colour just it"). On ALU-CUT
  New colours picks the chosen segment's family again (`recolourSeg`), a
  family it has not, a tube on a whole-lane pipe; the other segments as they
  are. The line under it names the segment, "For pipe 1, segment 2 of 3"; a
  click on a pipe chooses its segment and now refreshes the panel at once
  (on ALU and SMKN too). ALU-CUT's saves no longer say "composition N". ALU
  and SMKN keep both keys, New colours for every pipe.

- **v.1.0.5 after the name** (the owner, 2026-10-11: "we will have a small
  update to v.1.0.5 now … yes, of course 1.0.5!"), on every tab and in the
  saved SVGs (`rembrandt: '1.0.5'`). Named Cut, after ALU-CUT (*Claude's
  name*).

- **ALU-CUT: cuts with the scissors, the brush stopping at each** (the
  owner, 2026-10-11, chat-Claude's task `ALU-cut-Claude/README.md`, his
  sketch `01-02-03_seams.png`: "it may not be very Instagram-friendly… but
  this way we move away from Florian and his American clone"; then, of the
  ways offered: "A — it is simpler", chat-Claude agreeing). ✂ **Cut (C)** in
  the Tools under the pencil ("S is taken, but C — cut"): a click puts a cut,
  the next part a family of its own; on a seam it makes a cut, on a cut takes
  it away; with S a click on a cut makes it a seam. A pipe's `cuts` beside
  its `seams`; ALU and SMKN keep them and read them as seams. DRAG on ALU-CUT
  paints part by part (`partsOf`), the pipe's lane numbers and order going on
  across a cut, the snake within a part; every lane and step across half a
  brush clear of the cut's line (`clearOf`, on a bend too). Before every part
  but the first — at a cut and before every next pipe ("a good idea") — the
  brush up over the canvas ("right over the canvas, I am careful") and a
  pause block (`dragRows`' stops, `dragPasses`), the LCD: "Pipe 1, part 2 of
  3: wipe or wash the brush, squeeze its paints, then Continue"; none after
  the last; no server change, the pause block is the runner's own. MARKS one
  pass; **Marks from a cut** 0 … 3 mm, 2 by default (est.; "if I go on when
  the paint has dried, neither 2 nor 3 mm is needed"). Result: a clean brush
  every part; a part over another's wet paint flagged by one ⚠ ("yes, OK!").
  The DRAG confirm: the parts, the stops, the first part's paints only. A
  cut drawn solid with ❚❚. Tested on the owner's composition of that night,
  cut where his sketch's seams are: ALU, and ALU-CUT with seams only, give
  today's blocks to the byte; with the cuts, 3 landings and 2 pauses (36 and
  2 one way); every brush centre half a brush (2.000 mm) from a cut on its
  own side; lane k on both sides at its offset; the paint 2 × 12 × 4 mm less;
  Marks from a cut 0, 1.5, 3 mm; no mud there, mud named where a part runs
  over an earlier one. Its real blocks through the runner on the fake board:
  held twice, the brush up, the stop named, every piece once, 100 %; in a
  headless browser the scissors and S both ways. Not run on the machine.

- **ALU-CUT, the first tab; TYPE and LOVE off the top row** (the owner,
  2026-10-11: "remove the TYPE and LOVE tabs — they do not work, they only
  distract; put ALU-CUT in their place, and every new thing there"). ALU-CUT ·
  ALU · SMKN · NOLAN · Test · Ink · Calibration · Library on every page.
  ALU-CUT is `index.html`, the server's first page (`start.command` opens
  it): ALU's page with its body `data-tab="alucut"`, ALU's module and plan
  and palette, its own keep in this browser, 💾 SAVE ALU-CUT labelled
  ALU-CUT and opened on it. TYPE's page moved to `type.html`, the Library's
  TYPE saves going there; LOVE's stays `love.html`; both off the row, kept.
  The server untouched. Checked in a headless browser: the first page,
  TYPE, LOVE, ALU, SMKN, NOLAN and the Library open without an error, the
  same row on each.

- **ALU and SMKN: MARKS from lane 1 to lane n, no ticks** (the owner,
  2026-10-11: "we have not fixed MARKS. It has the same trouble TRACE had —
  the strokes stick out a lot, they do not meet DRAG's way. And while we are
  at it — the ticks turned out unnecessary; the lines are enough for me, even
  if they fall 2–3 mm short of the first (outer) and last (inner) lanes").
  Master Flo's marks and Segments' dashes across end on lanes 1 and n, DRAG's
  lines, where TRACE runs since yesterday — before, the pipe's edge less
  0.5 mm (Master Flo) or 2 mm (Segments); the dashes along a canvas edge only
  where the lanes reach it. A stroke a mark: no abacus ticks on the canvas,
  in the files or on the map, their warning gone; a dip every 4 marks still
  (est.). Result takes up a mark's paint where the brush's edge meets its
  end, half a brush out, so lanes 1 and n are not left dry by a hair.

- **ALU and SMKN: up to 18 lanes along** (the owner, 2026-10-11: "I have
  put on a finer brush; now Lanes along 12 · 3.7 mm apart — a maximum of 12
  is not enough. It can go right up to 18! But most likely I will use 14 or
  16 with this brush"). The slider 2 … 18, a save kept to 18.

- **Private on GitHub again, with ALU-cut-Claude/** (the owner, 2026-10-11:
  "put all the works in and close access; we will open it later if
  chat-Claude needs to be shown again"): chat-Claude's task for ALU-CUT, the
  owner's sketch `01-02-03_seams.png`, his three variants, and the
  references — Florian Markus, Plot Bot Studio, Belem Lett — in git; the
  repository private first, then pushed.

- **Public on GitHub** (the owner, 2026-10-11: "unfortunately GitHub
  cannot be closed: private repos do not work for chat-Claude"): README's
  rule says so; it had said private since 2026-10-05.

## v.1.0.4 — 2026-10-11 · Snake

- **v.1.0.4 after the name** (the owner, 2026-10-11, sending the day to
  GitHub: "push it, please … and name today's update somehow, v.1.0.4
  already — we have not updated for a while"), on every tab and in the
  saved SVGs (`rembrandt: '1.0.4'`). Named Snake, after DRAG's back and
  forth (*Claude's name*). v.1.0.3 skipped, as the owner counted.

- **ALU and SMKN: PAUSE on DRAG at a lane's end** (the owner, 2026-10-10:
  "check PAUSE too; it must work while DRAG runs, so as not to use STOP, or
  everything starts over"; then: "simpler: the pause works only at the ends
  of a line — it comes on only when the brush stands at the start of the
  sausage or at its end"). `rembrandt.py`, one condition: a move block
  marked `pauseAtEnd` is never braked on its line — a pause asked on it
  waits for its end, then holds before the next block, the brush lifted,
  and Continue presses it again. `plotRun` marks its passes so with
  `o.pauseAtEnds` (DRAG on ALU only) and cuts a row where its first piece's
  `stopsAt` says, the next block going on with the brush down; ALU's snake
  is fitted lane by lane and cut at each lane's end, so it is a block a
  lane, one landing and one lift still. Other tabs and TRACE and MARKS as
  before: no stopsAt, no mark, the blocks to the byte. Checked: the server
  pauses mid-snake today without the mark too, on its own lane (a test
  now); with it, the day's "6" — 12 lanes, its real blocks — through the
  runner on the fake board, paused mid-lane: held at that lane's end, the
  brush up, no braking, every piece once and in order, 100 %. Takes effect
  once `rembrandt.py` is started again; until then the old one brakes on
  the line, as it did.

- **ALU and SMKN: no Paper test key** (the owner, 2026-10-10: "Remove
  Paper test. What 8 Oct? I do not need this key :)"). New composition and
  New colours stay; a save of the paper test still opens, and `paperTest`
  stays the fixture of the tests, the snake off as the paper was brushed.
  The Paper ground in the Tools is another thing and stays.

- **ALU and SMKN: STOP alone, the snake's Off and On** (the owner,
  2026-10-10: "remove the dots of • STOP and •• HARD STOP — they give you
  room for on / off as on INK. No green highlight, the knob there is
  orange. Or let us remove HARD STOP altogether! I do not use it"). HARD
  STOP gone from the deck; STOP without its orange dot, the row's width
  left of the switch; the switch the repeat icon, then Off and On as INK's
  — a click on a word sets it, on the icon turns it over — its knob's dot
  orange. Esc is STOP still; the other tabs keep both stops.

- **ALU and SMKN: the snake for DRAG** (the owner, 2026-10-10: "I need a
  run as a snake, back and forth, the brush going non-stop, without flying
  back to the start through the air. This one is needed too, but let there
  be a switch … STOP, HARD STOP — there is room to the right of them …
  shaped like INK on / off, so it is near the DRAG key; no words, just an
  icon as in iTunes, ↻, the loop, ON by default"; "🔁, that is the icon I
  meant — maybe you can draw it yourself"). A switch right of the stops,
  under DRAG: INK's shape, the repeat icon drawn as an SVG in the deck's
  lines, grey when off; ON by default (the old `aorder`, 'snake' already).
  ON, a whole-lane pipe's lanes alternate their way and `snakeOf` joins a
  lane's end to the next one's start, within 3 pitches (est.), with a step
  across, the brush down: across the flat end on the canvas, on the trace's
  line; along the edge past the canvas where the lanes are cut. So a pipe
  is one DRAG row, one landing: the day's "6", 12 lanes, 1 run for 12.
  Where a lane leaves the canvas and comes back, a lift there as before.
  3 Drag colours and numbers each lane of a snake at its own start and
  draws no flight; Result and Play the run walk it as the brush goes; the
  DRAG confirm and the SVG (`data-lane="8 7 … 1"`) say so. The switch is
  the old "Segments: back and forth · One way, lift" keys, gone from under
  the brush's sliders (*Claude's choice*: one setting, one control).
  Paper test, 8 Oct turns it off, as the paper was brushed. On ALU the deck's
  stops lay in `.alu .stops`, the segment paints' rule — why they were
  narrow, leaving the room; now `.deckstops` of their own. Tested: the
  paper test's pipe one run, its lanes on their lines back and forth, each
  step one pitch, one landing on the machine; compositions 1–6, fewer
  landings, every lane run once, every step past the canvas's edge; OFF as
  before; in a headless browser, the switch both ways and Result.

- **ALU and SMKN: TRACE on the lanes DRAG runs** (the owner, 2026-10-10,
  `alu-result/`: "Trace goes a few millimetres further, outside the
  sausage's outline, and makes a fat frame. Drag goes inside this frame,
  not touching the outline, though it should lie on top of it … I brush
  first, do the trace, and think Drag will go along this outline, but it
  goes quite otherwise, inside the trace's outline … if there are settings
  somewhere to make the gap between trace and drag smaller or bigger, they
  only distract: remove the slider and make a strict correspondence").
  The outline now runs on lanes 1 and n, the same offset from the spine as
  DRAG's edge lanes, `lanesOf`'s e; before, the line's outer edge lay on the
  pipe's, TYPE's way, so it ran (Brush width − Line width) / 2 outside them:
  1.75 mm at 4.5 and 1, the settings of the day in the run journal, 4 mm
  at 12 and 4. No slider of its own; now neither Brush width nor Line width
  moves them apart. Tested: the trace on the edge lanes to 1e-6 mm at four
  brushes and lines; on the day's composition from `logs/runs.jsonl`, 0 mm
  off the nearest lane (1.75 before). TYPE and LOVE keep their way.

- **SMKN, ALU with the paints in stock** (the owner, 2026-10-08: "Great!
  Now everything is right! We only need to make a real palette with the
  colours we have in stock, but the existing tab must stay too. Let's call
  the second tab SMKN — it is the palette of my brand Soumkine, so the
  colours are unusual :)"; his photographs, `ALU-Claude/Screenshot
  2026-10-08 at 3.12.15 PM.png` and `3.12.23 PM.png`, now in git). After
  ALU in the top row, on every page. Fourteen tubes: Sennelier Abstract 116
  Titanium White, 029 Iridescent Silver, 250 Light Rose Ochre, 543 Cadmium
  Yellow Deep Hue, 640 Saturn Orange, 208 Raw Sienna, 645 Chinese Orange,
  613 Cadmium Red Light Hue, 686 Primary Red, 921 Light Violet, 323
  Cerulean Blue Hue, 070 Iridescent Black; Lukas Cryl Terzia 4982 Ivory
  Black; Pébéo Studio Acrylics Azo Pink. Their colours est.: the mean of a
  patch of each swatch on the photographs, the light ones put right by the
  white wall behind them (it came out grey), the strong ones as they are;
  the iridescent two as their colour, no shine. Fourteen families of three
  for New composition and New colours, Claude's by eye; the paper test in
  Ivory Black and Titanium White. ALU's page and plan shared, not copied —
  only the palette differs, so a fix reaches both: `aluplan.js` keeps a
  palette a tab (PALETTES), `alu.js` reads `smkn.html`'s `data-tab`; its
  own keep in this browser, 💾 SAVE SMKN labelled SMKN and opened on it.
  ALU checked unchanged: compositions 1–9, their plans and Results, New
  colours, the paper test, the same to the byte. Tested: SMKN's
  compositions, colours, new pipes and paper test only in its tubes; in a
  headless browser, a save through `library_save` and back on SMKN, and
  ALU refusing it.

- **ALU: Master Flo's marks right across the whole pipe** (the owner,
  2026-10-08, `ALU-Claude/Screenshot 2026-10-08 at 2.55.56 PM.png`: "Whole
  lanes, Master Flo and Segments, Alu — that is all the Australian style,
  Alu. I did not notice at first; it came over from chat-Claude, the
  prototype had the error from the start. But it can be fixed. The
  principle of Master Flo is as on 02_marks_black_white.jpg: the lines
  always across the whole sausage, they make no gradient at once"; then,
  of the plan: "yes, exactly so"). A whole-lane pipe's every mark is one
  paint edge to edge, the paints in turn along the segment; the
  prototype's "Paints across the pipe" — each mark cut into a dash a paint,
  a gradient across — is gone from Whole lanes (`lay` no longer read). The
  paints across stay Segments, Alu's, its Along segments. New composition
  and New colours lay a tube's paints along each pipe; composition 1 has 59
  marks now, not 248. Its edge dashes one paint, the pipe's there. The
  segment editor of a whole-lane pipe says so instead of the two keys;
  Design draws its paints along. `ALU-Claude/ALU.md` corrected. Tested:
  every mark of a drawn pipe and of compositions 1–9 the pipe's whole width
  or cut by the canvas's edge, one paint at a place.

- **ALU: ⌫ takes the chosen pipe away** (the owner, 2026-10-08: "great
  result! There is Delete pipe, but the sausage could simply go with a
  press of the delete key"). ⌫ or Delete, with the board or a key in
  focus — not in a field, where it still rubs out a figure; ⌘Z brings it
  back. Delete pipe stays.

## v.1.0.2 — 2026-10-08

- **v.1.0.2 after the name** (the owner, 2026-10-08, as ALU came in: "this
  will already be REMBRANDT v.1.0.2 :)"), on every tab and in the saved
  SVGs (`rembrandt: '1.0.2'` in their metadata).

- **ALU, the tab: pipes of paint** (the owner, 2026-10-08: "we have a new
  tab, ALU-Claude, in the root of Rembrandt — study it, please, and let's
  add it in our style next to TYPE and YURI"). After LOVE in the top row,
  as `ALU.md` has it: TYPE · LOVE · ALU · NOLAN · Test · Ink · Calibration ·
  Library; on every page. `alu.html` and `src/alu.js` from LOVE's page —
  the board, the canvas from home, PROGRESS and the LCD, the cassette deck,
  INK and the cup, the zoom, the Reference — the run, the canvas, the cup
  and the LCD shared. The prototype's tools on the left (Edit, Draw, Seams,
  Marks; Undo, Redo, Clear; the ground, White · Paper); its tubes a strip by
  the Tools, as LOVE's paints; its settings in LOVE's panel, the pipe and
  segment editors under the pipes; the views Design · 1 Trace · 2 Marks ·
  3 Drag · Result and ▶ Play the run; the files it wrote. TRACE, MARKS
  (a dip every 4 marks, est.) and DRAG (whole lanes n … 1, a lift after
  each) run on the deck, session by session. 💾 SAVE ALU puts it in the
  Library, labelled ALU, and the Library opens it here. The prototype's
  panel keys left out, as on TYPE: the panel is the canvas from home, and
  its points follow it when it changes; Paper test, 8 Oct makes it
  148 × 210, the canvas of every tab, as a save opened from the Library
  does. Tried in a headless browser — composition 1 and the paper test in
  every view, Play, a Segments pipe with a fan and an Across segment, a save
  through the server's `library_save` in a scratch folder and back on the
  tab; not run on the machine: air first.

- **ALU: the plan, `aluplan.js`** (`ALU-Claude/ALU.md`: "port the logic;
  do not call the prototype"). The pipes, their spines of lines and corner
  arcs, Whole lanes, Master Flo and Segments, Alu, the marks across, the
  edge dashes, New composition and New colours, the paper test, sessions,
  and Result — paint mixed as pigment, the brush not washed between lanes,
  wet paint loaded where a lane passes over it, its own track laid behind
  it — then the passes as rows of the run, TYPE's shapes: `traceRows`,
  `marksRows`, `dragRows` (a run cut at its sharp turns before `fitPieces`,
  so no arc rounds a corner the brush takes). Checked against the
  prototype's own code: compositions 1–9, their plan and their Result the
  same to the colour. The paper test the fixture (`test/aluplan.test.js`):
  eight whole lanes, 8 … 1; where the band crosses itself the lane painted
  later lies on top, one lane per step; lane 1 comes out of the crossing
  black, lane 8 light; white at the left ends of 7 … 1. And `ALU.md`'s
  checks: a dash at least every spacing on every lane, the outer one on a
  bend too; every Across stroke over its edge's dash within 4 mm of
  landing; every fan ray over the rim's arc; a tight corner counted; a pipe
  off the panel its dash along that edge; `data-ink` in every file. Claude's
  choices: TRACE's line with its outer edge on the pipe's (the owner's rule
  of 2026-10-06 on TYPE: "the brush is the same, in paint and dry"), not
  1 mm inside; the ticks TYPE's, two line widths apart, not 4 mm; New
  composition's count of what the pipes cover laid out on its grid, the
  same compositions in 0.1 s, not 2.5.

- **ALU-Claude: the prototype, the spec and the paper test** (Claude in
  chat with the owner, 2026-10-08): `ALU.md`, the ALU tab's spec; the
  prototype, `Rembrandt · ALU.html`; `paper-test/`, the owner's hand-made
  run of the machine on an A5 page in black and white acrylic, "repeating
  the brush's way with absolute precision" — fifteen photographs and their
  README, the reference for Whole lanes, Master Flo; New composition 1–9 as
  the prototype draws them. In git as `TYPE-Claude/` is; the other artists'
  works `ALU.md` names are not in it.

- **LOVE: the Ground in the Tools** (the owner, 2026-10-07, on a cyan to
  pink gradient, `TYPE-Claude/Screenshot 2026-10-07 at 2.55.30 AM.png`:
  "Wow! Beauty. Maybe put the gradients in the left corner, closer to the
  colour palette, so as not to scroll down the block?"; at the foot of the
  paints' strip, "it is cramped down there — right in the tools, where the
  arrows and the cross are, after the cross"). After Clear: GROUND, a
  swatch a ground — white, the gradient in its own colours, black — the
  chosen one with the orange dot; with the gradient, its top and bottom
  chips under them. Gone from the panel.

- **LOVE: the Ground — white, a gradient or black** (the owner, 2026-10-07:
  "the ground a light gradient, I am not afraid of the brush; or black —
  depth, mystery, magic"; "you wanted to swap the white for a gradient,
  remember? I could use it"). White · Gradient · Black under Simulation;
  a gradient top to bottom, its two colours chips as the paints' (cream to
  pale blue to start, by eye). A click shows it in Result; Play the run,
  the Library's picture and the saved SVG carry it; the passes' views keep
  the white. Over black the paint is laid on top, not multiplied.

- **TYPE: 💾 SAVE TYPE saves again** (the owner, 2026-10-07: "of course, fix
  it"). The fault LOVE had: since the zoom (0ef9d85) the PNG preview's
  `const view` hid the `view()` it calls, so SAVE threw before sending and
  said "start rembrandt.py". Renamed, as on LOVE; nothing else in TYPE.

- **LOVE: 💾 SAVE LOVE saves again** (the owner, 2026-10-07: "SAVE LOVE —
  not saved · start rembrandt.py; the new figures do not appear in the
  Library"). Not the server: the PNG preview threw before anything was
  sent — its `const view` hid the `view()` it calls a line above (since the
  zoom, 0ef9d85, copied from TYPE), and the catch said "start rembrandt.py".
  Renamed. Tried headless and through the server's library_save in a
  scratch folder: the save is listed as LOVE and opens on LOVE. TYPE has
  the same fault, left for the owner's word.

- **LOVE, rails: one session, and the nearest train next** (the owner,
  2026-10-07, on Play the run: "the circles were cut into three sessions —
  are there scissors somewhere in an old algorithm? I would like a
  continuous train, as Florian's"; "after the first circle the machine
  starts drawing at the bottom — it is more logical to go on to the
  neighbour"). The scissors were OVERLAPS: Dry between letters and Dry
  every overlap put touching letters in sessions apart, and a switch is
  only within one. Rails ON is one session now, wet on wet, OVERLAPS
  greyed till Rails is off. The trains went in the text's order; now every
  next one is the train, and the landing on it, nearest to where the last
  lifted — a landing 4 mm before a mark, so the brush takes up paint at
  once (`loveplan.js`, landingsOf).

- **LOVE: Rails — the train without stops** (the owner, 2026-10-07, on
  four zeros laid over one another: "the algorithm takes an imprint of the
  pattern and works out the path as on rails"; "No ribbon. The path will
  be rails. The main thing is that the train runs without stops"). Rails
  OFF · ON under Pass through, ON by default. Every lane a rail
  (`loveplan.js`, railsOf); where the rails of two bands lie together —
  within 0.35 of the pitch and parallel, along a side, or kissing at a
  curve: the hole's ring of a 0 is a few mm round — a switch (switchesOf);
  the switches that join two trains taken, the longest first, at the
  stretch's closest point, and each train walked round once (trainsOf):
  an 8 round two letters side by side, inside and outside taking turns by
  themselves; no step across the lanes. DRAG runs the trains, a row each;
  Result and Play the run follow them; 3 Drag colours them and rings the
  switches; the reading counts them — six zeros of 7 lanes, 5 rows on 5
  across and 7 down: `1 train — the train goes non-stop`, 42 lanes, 41
  switches. Odd lane counts stay (the owner: "let's keep the odd ones, of
  course"): the overlap decides, not the parity. Tried in the tests and a
  headless browser; not run on the machine yet.

- **LOVE: Result along the brush's own path, and Play the run** (the
  owner, 2026-10-07, on `TYPE-Claude/Rembrandt_RIBBON_LOVE.html`: "we need
  Play the run from there — this preview shows how the paint will lie";
  "can you apply this system to TYPE?" — on LOVE, TYPE kept). Result walks
  DRAG's own paths (`loveplan.js`, paintWalk): the brush carries its paint
  on round into the next lane and, with Pass through, along the centre
  lines into the next band, as the non-stop DRAG does; TYPE's starts every
  lane clean. The seam shows now: the 45° steps between a band's lanes
  line up into a diagonal across it, in the paint the brush carries there.
  ▶ Play the run under the views lays the Result again in the brush's
  order, the whole run in 12 s (the prototype's), a ring the brush's
  width where it is; ■ stops it; a change, or another view, stops it too.
  Tried in the tests and a headless browser; TYPE untouched.

- **LOVE, a copy of TYPE for the new things** (the owner, 2026-10-07: "I
  would duplicate TYPE's functionality but make a new tab, LOVE, and bring
  the new changes there"; "because if something goes wrong, we can roll
  back to TYPE"). `love.html` and `src/love.js`, TYPE's page; its plan
  `src/loveplan.js`, a copy of `typeplan.js` — what changes for LOVE
  changes there, TYPE's own files stay. Its own keep in this browser
  (`rembrandt.love.v01`), the text LO / VE to start with, 💾 SAVE LOVE: a
  save labelled LOVE that the Library opens on LOVE. After TYPE in the top
  row of every page. As TYPE for now; Play the run next.

- **TYPE: Rings, and Pass through — a letter one DRAG path** (the owner,
  2026-10-06, `TYPE-Machine/IMAGE 2026-10-06 15:50:01.jpg`: "how to cut the
  number of passes? The E has 7 rings — a slider, 5 for example; and a
  switch as on NOLAN, Pass through — maybe an interesting effect"). Rings
  2 … 12 in place of Lane pitch, the pitch following (`typeplan.js`,
  pitchOf): a 50 mm band, a 6 mm brush, 5 rings — 5.5 mm apart; the warning
  when the rings lie wider apart than the brush. Pass through OFF · ON
  under OVERLAPS (dragPaths): ON, a letter's bands one path — the brush
  goes from a band's spiral to its centre line, along it to where the next
  band meets it, through any between, into that band's spiral, every other
  one from its centre out; it never runs over the canvas between bands
  (every letter and digit checked: the E's middle bar reaches its bottom
  one by way of the stem; a straight hop crossed the white between them).
  Parts apart lift: !, %. 3 Drag draws it; the reading counts the brush
  down. Not run on the machine yet.

- **TYPE: DRAG non-stop, a band's lanes one spiral** (the owner, 2026-10-06,
  `TYPE-Machine/` — the first drags, NEW / YURI and Z, pink over the
  watercolour: "must the brush lift off the canvas every time? Maybe let it
  go on non-stop"; the task from the start: "the dry brush rides the canvas
  non-stop, as Florian's"). Every lane had landed and lifted on its own,
  and each lift left a knob of paint in the band (`IMAGE 2026-10-06
  15:37:51.jpg`). Now a band's lanes are one path (`typeplan.js`,
  spiralOf): round a lane, then a step in to the next one, a pitch along
  the band — a short 45° seam by the landing — the last lane on 14 mm past
  its start; a closed band from its outer edge across to its hole's, the
  lanes no longer alternating sides. The brush lands once a band, lifts
  once; 3 Drag draws the spiral, a dot where it lands. Result keeps its
  strips lane by lane. Tried in the tests and a headless browser; not run
  on the machine yet.

- **TYPE: the zoom over the board; the panel, the LCD with it, from the
  top** (the owner, 2026-10-06, `TYPE-Claude/Screenshot 2026-10-06
  zoom.png`: "I need a panel at the top that zooms the screen; the LCD up").
  − 100% + in a strip under the header, 50 … 800 %; ⌘− ⌘0 ⌘+; a pinch on the
  trackpad zooms round the pointer, two fingers move the board. 100 % is the
  whole table as before; closer, the board fills the stage and shows a
  window of the table — the canvas stays the stage's size, so a close look
  costs nothing. The panel from the top of the window, the header and the
  zoom over the tools and the board: PROGRESS the header's height higher. The
  Library's preview stays the whole table, whatever the zoom.

- **TYPE: MARKS and DRAG run; the run's trace along the plan** (the owner,
  2026-10-06, after the first TRACE on the machine, NEW / YURI, 343 s: "I
  cannot press MARKS (it is not active)"; `TYPE-Claude/Screenshot
  2026-10-06 trace.png`: "it draws crooked somehow — lower the speed, or
  for the dry brush it does not matter?"). MARKS: the session's marks and
  their ticks, a stroke each, from the cup, a dip every 4 marks (est.,
  the prototype's); its confirm lists the paints to squeeze. DRAG: the
  session's lanes, the dry brush, never a dip, at Drag speed (60 mm/s, the
  prototype's). Each key runs its next session, `Marks 1/2`, and goes on to
  the next once the run is done on this page; the board shows the pass
  running. Line speed (TRACE, MARKS) and Drag speed are sliders now. The
  crooked line was the page, not the brush: the carriage's place every
  0.5 s joined by straight lines — 75 mm chords at 150 mm/s; the board
  runs the plan's arcs. The trace now draws each move of the run as the
  plan lays it, the one going on up to the carriage. Tried in a headless
  browser against a stand-in /run, nothing sent to the machine.

- **The canvas, one base for every tab** (the owner, 2026-10-06,
  `TYPE-Claude/Screenshot 2026-10-06 INK.png`: the Ink tab's white board
  under the image area — "make it as on NOLAN and TYPE, let them have one
  base we carry the parameters to"). `src/canvas.js`: Board width, Board
  height, Left edge →, Bottom edge ↑ from home, kept once in this browser;
  TYPE, NOLAN, New Yuri and Ink read and write the same four numbers, a tab
  in another window follows, a save opened from the Library brings its
  canvas. The base starts from the first tab opened with its own numbers.
  The Ink tab draws that canvas from home, where it drew the Test tab's
  board from its Here (400 × 700, 124 mm under the bottom wall), and shows
  its four fields in place of the canvas from the cup's. The Test tab
  keeps its own Here. Tried in a headless browser: typed on Ink, followed
  on TYPE and NOLAN.

- **TYPE: the trace and the colour meet at the band's edge** (the owner,
  2026-10-06, `TYPE-Claude/Screenshot 2026-10-06 preview-issue.png`, 1 Trace
  over Result in Photoshop: "the coloured letters go inside the outline of
  1 Trace — it must not be so: the brush is the same, in paint and dry;
  either pull the violet trace in, or widen the colour"). Both: TRACE runs
  its outlines half the line's width inside the band's edge, so the line's
  outer edge is the band's — the machine's path too; Result paints each
  band's outermost lane out to the edge, where the brush's own edge runs,
  half the brush and half a strip wide (it stopped 2.7 mm short at a 12 mm
  brush, 7 mm pitch); a mark's round ends stop at the trace's inner edge.
  Tried: NEW / YURI, 1 Trace over Result multiplied, no violet outside the
  colour.

## v.1.0.1 — 2026-10-06

- **v.1.0.1 after the name** (the owner, 2026-10-06: "replace REMBRANDT
  v0.4 with v.1.0.1; push it to GitHub and make the update today's date"),
  on every tab and in the saved SVGs (`rembrandt: '1.0.1'` in their
  metadata).

- **TYPE first; Job and New Yuri off the top row** (the owner, 2026-10-06:
  "remove the JOB and NEW YURI tabs, please; put TYPE first, it is the new
  index.html"): TYPE · NOLAN · Test · Ink · Calibration · Library on every
  page. TYPE is `index.html` now, the server's first page, and
  `start.command` opens it; Create moves to `create.html`, the Library opens
  paintings there and TYPE saves on `index.html`. Job's and New Yuri's
  pages stay, the Library still opens New Yuri's saves.

- **TYPE: the paints a strip by the Tools, colours with no names; the
  ticks as on an abacus** (the owner, 2026-10-06: "colours without names,
  moved to the second column, where the TOOLS are"; of the ticks, "(a)"). A
  chip a paint, its number on it, its marks under it; a click changes its
  colour, × takes it out, + and ↺ at the end (Add paint, Reset colour
  clicks). A long tick is five, a short one one: paint 8 a long and three
  short, 32 mm of ticks where it was 64 — every paint of the eight fits a
  51 mm band's mark at a 4 mm line.

- **TYPE: the views, Result and the paints** (the owner, 2026-10-06,
  `TYPE-Claude/2026-10-06 1978.png`: "for the preliminary work I need to
  understand what the result will be — as Claude in chat had it. The Result
  key is needed, and the paints"). 1 Trace · 2 Marks · 3 Drag · Result under
  INK, All · Session 1 · … under 2 and 3; the deck still runs the passes.
  The prototype's marks, lanes and simulation (`typeplan.js`: marksOf,
  markPaths, lanesOf, dragOf, crossed): Brush width, Lane pitch, Outside ·
  Inside first, Mark spacing, Paints per letter, Paint run and Glaze (est.);
  Paints in stock, each its count of marks, Add paint, Reset colour clicks;
  a click on a band in 2 Marks or Result steps its paint. The ticks two line
  widths apart, at the line's width (Claude's choice), the ones past their
  mark named. 💾 SAVE TYPE keeps the palette — names, colours, the clicks —
  and the Library opens it with them ("so the new palette is kept with the
  name in the Library"); its preview is the Result, the SVG has the marks in
  their paints. Tried in a headless browser, the Library's save caught
  there, nothing written.

- **TYPE, the tab: TRACE in watercolour** (the owner, 2026-10-06: "we
  start work on the new TYPE tab"; the first of three stages, "the brush
  draws the trace in watercolour"), after New Yuri in the top row. The text
  typed in a field, laid out as bands after the prototype of Claude in chat
  (`TYPE-Claude/`; `src/typeplan.js`, the letters New Yuri's set): Letter
  height, Band width, Letter gap, Line spacing, Margin, Fit to canvas;
  Select (V) moves the text. TRACE runs every band's outline, round
  clockwise, on 60 % over its start, with INK ON several to a dip, an
  outline never split; the board shows it as the paper will — NOLAN's wash,
  not the prototype's hairline ("not schematic as here, but as yours —
  realistic"). The page agreed before the code: a cassette deck instead of
  PLAY — TEST · PAUSE, TRACE · MARKS · DRAG, the stops, an icon and a small
  name a key ("like on old cassette recorders"; "maybe three rows"); no
  Result; OVERLAPS, then INK; our canvas from home; one cup, the
  prototype's INK-2 cancelled ("why complicate"). MARKS and DRAG are on the
  deck, not yet working. AM / OUR at 169 mm: 12 bands, 13 outlines, 13
  dips, 8.9 m, ≈ 4 min (est.). Tried in a headless browser on
  rembrandt.py, no machine.

- **The wash shared: `wash.js`** — NOLAN's watercolour drawing taken out of
  `nolan.js`, so TYPE's trace is drawn by the same code. NOLAN as before.

- **New Yuri, the tab** (the owner, 2026-10-05/06: "let's make the tab, and
  we'll see there"), after NOLAN in the top row. NOLAN's page without the
  3D: its board, the canvas from home, PROGRESS, TEST, PLAY, INK, the
  brush, Canvas, Reference, 💾 SAVE NEW YURI — the Library shelves it with
  the tests and opens it here. **T** (T): the letters' strip by the Tools;
  a letter picked, pressed on the canvas at its baseline, dragged up to its
  height. Select: a click picks, a drag moves, the wheel sizes, a
  double-click picks a stroke for its own Step; ⌘C ⌘V lays a copy beside
  it. The panel: Rings · Coil, Weight, Step, Height and place, Row width;
  no RAMP, no gap (the owner, 2026-10-06: "I don't need RAMP — better not
  to clutter the interface"; "I take the letters from the strip and put
  them on the canvas, as the circles"). The run: ring by ring, each from
  the point nearest the last one's end, clockwise, on 60 % over its start,
  lifting over all of it; Coil one line a stroke, fitted into lines and
  arcs. With INK ON a dip, then rings on what the brush holds up to 720 mm
  (est.), a ring never split: AMOUR at 100 mm, Weight 15, Step 4 — 292
  circles, ≈ 26 min (est.). Letters past the canvas, a stroke over 400
  circles, the walls: named. Tried in a headless browser on rembrandt.py,
  no machine.

- **Test's run: a row may go on what the brush holds** (`nodip`, for New
  Yuri's rings, several to a dip; the owner, 2026-10-05: "yes"). NOLAN and
  Test never mark one, their runs as before.

- **NOLAN: a ring runs whole on one dip** (the owner, 2026-10-05,
  `nolan-v2/IMAGE 2026-10-05 23:57:03.jpg`, `23:57:07.jpg`: "some rings did
  not turn the full 360 degrees but went in two goes"). With INK ON a
  lapped ring longer than the dip run, 720 mm, was split for a second dip,
  the odd rows already at 360 mm — 206° of a ring of 100 mm radius — and
  the fresh brush landed mid-ring in a dark blot, the photos' 2–3 and 9–10
  o'clock. Now a ring is never split: whole, its lap too, on one dip (the
  owner: "I agree"); a ring wider than 229 mm, one turn longer than the
  dip run, is named under the ⓘ. Open lines split as before. Tried in the
  tests; not run on the machine from here.

- **NOLAN: a ring's lap 60 % of its length** (the owner, 2026-10-05,
  23:57: New Yuri's letters by the brush, "a 60 % lap will do"; the
  Circle's, "60 % too"). `LOOP_SHARE` 0.6, 0.5 before.

- **Rembrandt private on GitHub again** (the owner, 2026-10-05: "close it,
  please, make it private"): the references hold other artists' works.
  README's rule says so.

## v0.4 — 2026-10-05

- **v0.4 after the name** (the owner, 2026-10-05: "publish the update on
  GitHub and make it v0.4 :)"), on every tab and in the saved SVGs.

- **Adjustments off the top row** (the owner, 2026-10-05: "the Adjustments
  tab can go now — it only gets in the way"): NOLAN · Job · Test · Ink ·
  Calibration · Library. Its page stays, as Create's does.

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
