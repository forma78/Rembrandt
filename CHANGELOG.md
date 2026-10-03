# Changelog

Rembrandt, the successor of RUBENS, for CNCDM-001. Newest first.
Machine measurements stay in RUBENS: `../Rubens/CALIBRATION.md`.

## Unreleased

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
