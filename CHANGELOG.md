# Changelog

Rembrandt, the successor of RUBENS, for CNCDM-001. Newest first.
Machine measurements stay in RUBENS: `../Rubens/CALIBRATION.md`.

## Unreleased

- **Firmware, not flashed yet: a path after a HARD STOP runs again, and the
  wrist may turn on a path** (2026-10-02). The Test tab stopped with "the
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
