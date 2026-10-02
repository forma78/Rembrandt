# REMBRANDT

Spec v0.1 · 2026-10-01 · owner: Yury Melnikau (Melnicomm) · machine: CNCDM-001

Rembrandt is the successor of RUBENS. RUBENS turns one hand-drawn stroke into
eight brush lanes. Rembrandt plans a whole painting: which tube, how much of
it, where, and in which layer — so that the machine paints the picture and
the owner's hand squeezes the drops.

The name: Rembrandt built light out of darkness. Here too: light against a
dark surround.

---

## 0. Glossary

Read this first. Every word below means exactly this, in code, UI and talk.

| term | meaning |
|---|---|
| **Rembrandt** | This program. |
| **RUBENS** | The previous program, repo `Forma78/Rubens`, frozen at v0.1.3. Source of the Calibration and Job code. |
| **Machine** | CNCDM-001: 2020 frame, two NEMA17 belt axes (X, Y), the arm on the carriage (shoulder J1, elbow J2, wrist J3), spring-mounted tool holder, camera on the bracket. |
| **Create** | The tab where a painting is planned. Never touches the hardware. |
| **Job** | The tab that runs one layer on the machine. Writes `job.json`; ⚡️ Do Job runs it. |
| **Calibration** | Machine settings: steps, home, canvas corners, reach, wrist zero. Called "Calibrate" in talk. It belongs to the machine, never to paint. |
| **Adjustments** | New tab. How each paint behaves: drop dose, smear length, swatches, muddy pairs. Everything about paint lives here. |
| **Library** | Saved paintings, as in RUBENS. |
| **Reference** | An image attached on the Create tab with **Add new reference**. Shown under the canvas, traced, sampled for colours. Never painted as is. |
| **Curve** | The one master path of a painting. Lines and arcs only. Every band is built from it. |
| **Band** | The part of a layer on one side of the curve, N lanes wide. |
| **Upper line** | A calm curve that a band on the concave side blends towards, so its lanes never fold (§3). |
| **Lane** | One brush width along a band, 20 mm by default. Same word as in RUBENS. |
| **Trip** | One run of the brush along a lane. A lane is painted in 2, 4 or 8 trips (RUBENS Job tab). In Rembrandt a trip runs one way, from a home to its tail; the brush lifts there and goes back in the air. |
| **Layer** | Everything painted in one session over the dry layer below it: a band, its tubes, its drops. Not "pass" — in RUBENS a pass is a brush run inside a lane. |
| **Hand layer** | None since 2026-10-01: the machine paints every layer, the black too. The hand only corrects. |
| **Ground** | What lies under the first layer: the white canvas. |
| **Image area** | What the machine paints: its whole reach between the walls (Calibration), now 568.5 × 865 mm (Y × X), about 57 × 86 cm — nearly the 2 : 3 of IMG_9422. The canvas lies inside it; paint past the canvas lands on the canvas underneath, on purpose. |
| **Tube** | One paint on the owner's shelf: name, pigment code, swatches. The **inventory** is the list of tubes. |
| **Drop** | One squeeze of paint across the lanes, at its tube's home, before a layer runs. Florian Markus's method, made exact. |
| **Standard drop** | The unit of dosing: fixed nozzle, fixed length, fixed ml. The amount of paint is set by the number of drops, never by squeezing harder. |
| **Drop plan** | Where each drop goes, from which tube, in what order, and the ml per tube. |
| **Pointer** | The lifted brush in the Job tab, showing where the next drop goes. |
| **Muddy pair** | Two tubes whose mix loses its colour (yellow + black → olive). Decided by Adjustments. |
| **⚠** | The only warning mark: a muddy pair comes closer than the keep-out. A hint. It never blocks a job. |
| **Keep-out** | The minimum distance between the two tubes of a muddy pair on the canvas. 40 mm until measured. |
| **Smear length** | How far one drop travels along a lane under the brush. Measured in Adjustments. |
| **Home** | Where a tube's trips start, with a full brush. Its drops lie there. |
| **Tail** | Where a trip runs dry in the neighbouring colour. Its length is the smear length; at its end the brush lifts. |
| **Swing mark** | The hook the wrist leaves where the wet brush lifts or lands (RUBENS's word, `Rubens_v2.md` §4.5). In Rembrandt an ornament, kept on purpose. |
| **Film · Brush keeps · Nozzle · Max drop** | The RUBENS paint fields, same meaning (`src/cnc.js`). |
| **est.** | Marks any number not yet measured in Adjustments, in the UI and in the code. |

---

## 1. Decided. Do not propose again

- **Everything in English**: UI, documents, code comments, commit messages.
  The RUBENS rule, confirmed by the owner 2026-10-01.
- **Braun style from RUBENS**: cream `#EDEAE4`, panel `#F5F3EF`, stage
  `#E2DED6`, line `#D5CFC4`, ink `#24221F`, one accent, orange `#EB7A25`.
  Green `#4F7A28` only on Open Job and Do Job. Raised neutral keys; the chosen
  key is pressed and carries an orange dot. Helvetica Neue; SF Mono for
  numbers.
- **Paths are lines and arcs only.** No Béziers. The RUBENS rule.
- **Calibration and Job come from RUBENS.** Rembrandt reuses them, it does
  not rewrite them.
- **During a job only X, Y and the wrist (J3) move.** Shoulder and elbow hold
  one static pose for the whole painting. Moving them during a job slows it
  down. (2026-10-01) One pose reaches 568.5 mm across, between the Y walls;
  the ~80 cm of `../Rubens/CALIBRATION.md` (2026-09-29) needs two poses, and
  Rembrandt uses one.
- **The image area is the machine's reach, not the canvas** (§0). The
  experiments are on 50 × 70 cm canvases laid on the 100 × 70 one; what runs
  past the small canvas (about 3.5 cm on each side, about 5 cm at the top)
  lands on the big one. On purpose. The owner, 2026-10-01: "We have 57 cm
  instead of 70 — so I lay a 50 × 70 canvas on the 100 × 70 one and let the
  machine think the image area is 57 cm. This is contemporary art: ±7 cm
  across may wander, that is even cooler. For experiments the precision of
  the edges does not matter at all." And: "If the 50 × 70 canvases sell, I
  buy 2000 × 1220 mm profile and rebuild the machine with a new frame. If
  they don't, the missing centimetres are not worth worrying about." So the
  size of the image area is never hardcoded: it comes from Calibration.
- **No machine-drawn outlines.** The pencil sits in the same spring holder as
  the MOLOTOW marker and drifts from run to run. **No projector.**
  (2026-10-01)
- **Paint goes on by eye for now, and the way ahead is the brush dipping
  into cups** at the edges of the frame (the owner, 2026-10-02). From the
  tube onto the canvas where Create's drop map shows, for the first tests.
  No pointer, no laser, no dosing syringe: they do not scale — "with ten
  machines it is 1100 drops in half a day, and as many again; filling 130
  cups with paint is still possible." The dip station moves from §11 into
  the plan. (Replaces the standard drops under the machine's pointer of
  2026-10-01.)
- **The firmware is Rembrandt's** (the owner, 2026-10-02: "RUBENS is closed,
  we make Rembrandt; we can change everything. Let's reflash the board!"):
  `firmware/CNCDM-001/`. Flashed only together with the owner.
- **The edge matters more than the fill** (Grok's review, the owner agreed,
  2026-10-02): the painting holds by the sheet's edge along the curve and by
  the places where the rule breaks, not by the fill.
- **Four layers in a fixed order, the same on Create and Adjustments** (the
  owner, 2026-10-01: "they must be the same"), as Sonnet laid them out:
  1 Light and 2 Dark below the curve, on the white ground (yellow dies on
  black); 3 Sheet over them when dry — its lane 1 along the curve makes the
  edge sharp; 4 Black at the top last, into the wet grey. The dark at the
  bottom now goes before the sheet, not last as on the morning of
  2026-10-01.
- **The machine paints everything, the black too**, from the edges inward,
  its tails into the red and the grey; the hand only corrects. The owner,
  2026-10-01: "Everything is done by the machine." At the top the black
  follows the U of the upper line, so the brush runs past the top of the
  canvas by about 5 cm: "it is a feature, deliberately."
- **Home and tail.** Every tube starts at its home with a full brush, runs
  towards its neighbour, dries out into a tail, and there the brush lifts and
  goes back to the home in the air. Colours meet tail to tail; a full brush
  never enters another colour. The owner, 2026-10-01: "The brush runs evenly
  over the transparent yellow and over the darker red; if it gets into the
  wet black — goodbye yellow, it turns grey. So the run can stop at the edge
  of the yellow patch, lift the brush and take it back to the yellow. It may
  catch a little red, but it will not stuff its cheeks." Sketches:
  `references/IMG_9422_direction.png`, `IMG_9422_direction-2.png`.
  **Untested** — the owner: "In theory. We have not tested it yet." This
  reverses, on purpose, the RUBENS rule that in Brush the brush never leaves
  the canvas within a stroke.
- **Swing marks are an ornament**, not a defect (answers `Rubens_v2.md` §9,
  question 1). The owner, 2026-10-01, on the RUBENS photo of 2026-09-29: "That
  was an emergency stop: no light patch, and two marks look like an
  accident. We will have a definite ornament." And: "We move further away
  from Florian and strengthen the advantage of our 3DOF design."
- **Within a layer the lighter tube runs first.** The owner, 2026-10-01: "At
  art school we were taught to start with the lights. If we start with the
  red, our yellow turns orange."
- **Stage by stage, one tube at a time.** A stage is one tube: its drops
  (pointer mode), then its runs; then the machine stops with the brush off
  and the carriage out of the way, and the owner looks. **Again** runs the
  same trips over that area once more; **Next** goes on to the next tube's
  drops. The next tube's drops are not on the canvas yet, so nothing else
  dries in the meantime. The owner, 2026-10-01: "I need time to understand
  and to see with my own eyes that every stage suits me. If the run from the
  yellow to the red is not good, I run the brush over that area again — so
  the paint in the other areas does not dry."
- **Muddy pairs go into different layers.** Where they still meet, one ⚠ —
  a hint, never a ban. No traffic lights (no ✅, no ⛔). (2026-09-30)
- **No drying timers, no drying warnings.** The owner starts the next layer
  when he says so. The RUBENS rule.
- **No brush washing station.** Several brushes on the quick-swap mount.
  The RUBENS rule.
- **The first painting is the minimalist sheet** (§9). Practise without
  paint-dipping first. Priority: sales and Instagram growth. (2026-10-01)

---

## 2. Scope of v0.1

1. Attach a reference; draw one curve over it.
2. Build the layers from the curve: Light (below), Sheet (above), Black (from
   the edges inward).
3. For each layer: lanes, trips, tubes, their homes and tails, the drop plan,
   ml per tube.
4. Check muddy pairs against the keep-out.
5. Job: pointer mode for the drops, then Do Job for the lanes.

Everything else is in §11 (later).

---

## 3. Geometry

- **Curve**: lines and arcs, inner corner radius from RUBENS (10 mm by
  default), clipped to the canvas and to the reach from Calibration.
- **Band on the convex side**: exact offsets of the curve, lane pitch = lane
  width, no gaps.
- **The lines in v0.1** (2026-10-01, from Sonnet's layout in `adjustments/`):
  8 mm wide, 8 mm apart centre to centre, over the whole image area. Below
  the curve: exact offsets. Above it: **vertical copies of the curve** — they
  never fold and stay exact lines and arcs, so the firmware gets them as
  they are; on a slope they lie closer than the pitch, and neighbours overlap
  by 1 − cos(slope): 26 % on the 42° of IMG_9422's curve. *Claude's
  decision.* The blend below is kept as the alternative.
- **Band on the concave side**: plain offsets fold once the band is wider than
  the curve's radius there. Instead, lane *k* of *N* blends from the curve to
  the upper line at the same curve parameter:
  `P_k(t) = C(t) + (k/N) · (U(t) − C(t))`. Lanes then widen (for example
  20–24 mm); the trips spread across a wider lane as in RUBENS (lane width /
  trips apart).
- **The upper line is built by the program** (the owner, 2026-10-01: "Yes,
  all by the program"): lines and arcs, no bend tighter than the band is
  wide, so no lane folds.
- **A blended lane is neither a line nor an arc**, and the firmware runs only
  `L` and `A`. Each one is fitted with lines and arcs, the tangent continuous
  at every joint, within 0.1 mm: the board does not stop at smooth joints,
  so a trip still runs without stops. *Claude's decision.*
- **The edge**: the curve is the boundary of both bands. The sheet is painted
  second, over the dry light, with its lane 1 running along the curve — that
  is what makes the edge sharp.

---

## 4. Tubes and the inventory

- A tube: `id`, name, pigment code(s), brand (optional), and three swatches —
  masstone, 1:1 with titanium white, thin over black. The bracket camera
  photographs them next to a grey card; colours are stored in linear sRGB.
- Mixing in v0.1: RUBENS `src/color.js` (pigment-like mixing). v0.2:
  Kubelka–Munk, K and S per tube from the masstone and tint swatches.
- **Muddy pair, until Adjustments measures it (est.)**: the 50/50 mix loses
  chroma — OKLCh chroma of the mix < 0.6 × the weaker tube's chroma.
- Prefer single-pigment tubes: their mixes are easier to predict.
- Recipes use only tubes in the inventory. A colour no tube reaches is
  reported, never invented.
- **The inventory is large, not six tubes.** The owner has a Pebeo set of
  50 tubes and a Liquitex set of 80. A gradient can be made of many real
  shades — five greys, twenty yellows — laid side by side, not premixed.
  The owner, 2026-10-01: "Paint makers have hundreds of shades. Don't get
  stuck on six tubes."
- **The tubes are edited on the Create tab** (Tubes in use; the owner,
  2026-10-01): a click on the shade or the name changes it — for the real
  tubes' names, "Primary Blue", "Ombre Brulée"; + adds a tube at the end of
  the list; the grip drags it elsewhere ("Lemon at the bottom by default, and
  I drag it up next to Yellow — I like order"). **Kept on this Mac**, in
  `app/tubes.json`, through `rembrandt.py` (`/tubes`), and shared with the
  Adjustments tab.
- **Two ways to mix on the canvas**: the tail (§1, home and tail) and
  **optical mixing** — neighbouring lines of neighbouring shades, the eye
  mixes them (Sonnet's layout, `adjustments/`, 2026-10-01). The test
  canvases show which, where.

---

## 5. Dosing — the drop plan

- **Volume**, the RUBENS formula (`cncPlan` in `src/cnc.js`):
  `ml = length_mm × width_mm × film_mm × (1 + brush_keeps / 100) / 1000`.
- **Standard drop** = RUBENS manual load: a fixed ml per drop,
  `drops = ceil(need / ml)`. Default: nozzle 6 mm, 100 mm long, ≈ 2.1 ml
  (est.).
- **Drops lie across the lanes** (perpendicular), each feeding up to 5 lanes,
  **at their tube's home** (§1): the brush picks them up there and drags them
  into the tail. Where the homes lie comes from the reference: v0.1 samples
  it along the lanes and picks the nearest tube, or "fade to ground".
- **Runs.** A tube's trips run one way, home → tail. The tail is the smear
  length (Adjustments; est. until measured — the spiral research used
  60 mm). At its end the brush lifts (J3 to brush off) and travels back to
  the home in the air. A home at the edge of the image area starts past the
  edge of a smaller canvas, so that landing's swing mark lies on the canvas
  underneath.
- **The paint of every line comes from the reference**, read every 4 mm:
  the nearest tube of its side (OKLab), and what it missed by goes on to the
  next line at the same place — so where the reference lies between two
  tubes, neighbouring lines take turns: optical mixing (§4). Runs shorter
  than 24 mm join a neighbour. The lines within 12 mm of the curve read the
  reference 12 mm from it, so its edge, a few mm off a drawn curve, does not
  colour them. *Claude's decision.*
- **Home and tail of a run**: the end at the edge of the image area, or next
  to a darker paint, is the home; the end next to a lighter paint is the
  tail. Where a run reaches the edge of the image area it does not thin: the
  brush goes out at full width and lifts past the canvas. *Claude's decision.*
- **The paint of a run is reckoned on its real gap** to the neighbour line,
  not on the line's width: on a slope above the curve the copies lie
  pitch × cos(slope) apart, and a full ration there would lay a double film
  (the outside review, 2026-10-01).
- **A drop feeds the neighbouring lines of one tube** whose homes lie within
  40 mm, as many as it is long (100 mm: 12 lines at 8 mm). A group that needs
  more than one drop gets them spaced along its shortest run.
- **The colour preview** of a layer uses the tail model of
  `previous_research/rembrandt_spiral_passes_simulation.html` (`sim`): every
  mm the brush lays part of what it carries and the rest fades over the tail
  length; colours mix by RUBENS `pigmentMix`. *Claude's decision.* (Not yet:
  v0.1 paints the lines in their tube's colour, thinning into the tail.)
- **Order**: one tube at a time, light to dark; within a tube, nearest
  neighbour from the last drop.
- Every ml stays **est.** until Adjustments has weighed that tube.

---

## 6. Pair check

- Each tube's footprint = its drops + smear length along their lanes.
- For every muddy pair the closest distance is measured, in the same layer
  or not: a thin black over a dry yellow still turns olive.
- Closer than the keep-out → ⚠ on the canvas at the closest point, and on
  its row in the Pairs section. The job still runs. Farther → the row has no
  mark: `Black ↔ Yellow · keep 40 · now 160 mm` (the owner, 2026-10-01).
- A pair can be marked **intended** (black into red → dark bordeaux, as in
  the first painting). Intended pairs show no ⚠.

---

## 7. Adjustments tab (new)

Per tube:

- **Drop dose**: squeeze 10 standard drops on foil, weigh on a 0.01 g scale,
  divide by 10.
- **Smear length**: one drop, one lane, one Job run; the bracket camera
  photographs the trace → length and width.
- **Swatches**: masstone, 1:1 with white, thin over black (§4).

Pairs: one test canvas, each pair of tubes side by side, one brush run, a
photo → muddy or not.

Everything is saved in `adjustments.json`. A measured value replaces the
est. one everywhere.

**The tab starts from Sonnet's layout** (the owner, 2026-10-01: "make the
tab from adjustments, keep the 13 colours"): `adjustments/`, four SVG layers
on the 500 × 700 canvas, made by Claude Sonnet without our spec, on purpose
— "a fresh look". 13 paints in four layers, lines 8 mm wide and 8 mm apart,
the gradients mixed optically; above the dip, vertical copies of the curve
instead of offsets. The tab shows the layers one by one and every paint with
its colour — est. until the owner's photos of the real tubes replace it.
**The lines are drawn as the brush leaves them**, thick at the home and
thinning into the tail — not as round-ended sausages (the owner: "when the
3DOF lifts, it will not end like that"; `references/IMG_9422_direction-2.png`).

---

## 8. UI

The first sketch is `design/create-tab.html` (five screens). Where it and
this section disagree, this section wins: the owner corrected the sketch on
2026-10-01.

- **Two rows, as in RUBENS.** The top row: the tabs **Create · Job ·
  Adjustments · Calibration · Library** and the green **Open Job**. The second
  row, centred (the owner: "this can go in the centre of the second row"):
  Format; the toggles **Reference · Lanes · Drops**, then **Reach · Grid**;
  then Import SVG, Export PNG, and **💾 SAVE** (the owner, 2026-10-01: in
  the second row, so the panel on the right stays as it is). SAVE puts a new
  painting in the Library every time, named by the date and time, as in
  RUBENS: an SVG of the image area — the canvas, the lines in their tubes'
  colours, the curve — with the whole painting, the reference included, in
  its metadata; a click in the Library opens it again. `app/library/`, on
  this Mac, not in git.
- **Format** — the canvas laid on the image area: **500 × 700** (default),
  **600 × 800**, **400 × 600** and **400 × 300** mm (the last two the owner's,
  2026-10-02); 700 × 1000 is out of reach and gone. Drawn as on the
  RUBENS Calibration tab (`references/Screenshot 2026-09-30
  calibration.png`): the canvas inside the image area, the walls dashed,
  hatched where the machine does not reach (600 > 568.5 mm across). The
  status bar names both: `Canvas 500 × 700 · image area 568.5 × 865 · …`.
- **Test**, a tab between Job and Adjustments (2026-10-02): the test bench —
  a 30 × 30 board ("the ideal format for tests", the owner), black only;
  rows of hairpins drawn by the plotter, X and Y, lines and arcs: a line
  out, a half circle, a line back, the wrist lifting the brush with its
  hook; a pause after each row for paint. Pattern C, the snake (the owner,
  2026-10-02, `references/Screenshot 2026-10-02 snake.png`): one continuous
  line, row after row, a half circle at either end, the brush down from the
  first row to the last. Placed by "Here" (the brush over
  the board's centre). The board's margins are a hint, not a limit ("too
  many limits — let it go past"); the machine's walls are, and the page
  says so before the run. It began as the arm-stroke bench "3DOF".
  Sliders for the rows, as on Calibration; the board's width and height two
  numbers. **💾 SAVE TEST** puts a test in the Library, on a second shelf
  under a line — paintings above, tests below — and the Library opens it
  on the Test tab (the owner, 2026-10-02).
  **The wrist on the board** (the owner, 2026-10-02, the 15-row snake in
  `test_results/`). At a turn the bristles flipped over: "+15° at the end
  of the right run, −15° at the end of the left one, so the bristles do not
  leave a fat mark and the brush is not spoilt"; upright again once the
  turn is done (**Wrist at a turn**, ±°, est.). The wrist goes to +15° at
  most now — the owner allowed it past the camera's +10°. Coming down from
  −54° the brush touches the board ~50 mm before the row (a ruler) and
  drags there. A carriage standing 50 mm into the row was tried and
  dropped the same day: the drag runs along Y only, a bowed row starts at a
  slant, and the row bent off its arc and left a gap — the owner: "fix it
  as it was". Open.
- **Tools on the left exactly as in RUBENS** (`references/Screenshot
  2026-09-30 create.png`): Gesture (G), Pen (P), Select (V) · Arc (A) ·
  Undo, Redo, Delete, Open default, Clear.
- Status bar at the bottom, in mono.

1. **Create — reference and curve.** Reference under the canvas at 45 %,
   **Add new reference** (📎; not "Replace", the owner) and an opacity slider;
   Trace curve, Sample colours. Panel:
   - **Curve — every number editable** (the owner: "maybe I want an inner
     corner radius of 500 mm"). The inner corner radius in whole mm, from 0
     with no upper limit; where the rounding does not fit between two kinks,
     "!" as in RUBENS. A segment picked on the canvas shows its own numbers
     to type, as in Illustrator: a line its length and angle, an arc its
     radius and sweep. The segment count and the length follow.
   - **Layers** — three rows, fixed order. Each lists its tubes in run order
     (lighter first, §1) with their homes, and has **[+]** to add a tube from
     the inventory: a second yellow, a second white, an orange — the same
     tube twice gives it two homes. × takes one out. (The owner, 2026-10-01.)
   - Tubes in use.
2. **Create — layer 1, light.** Lanes below the curve and the drop plan.
   Panel: side of the curve (Below | Above), lanes, trips per lane (2 | 4 | 8),
   ground; Drops: film, brush keeps, nozzle, drop size, a row per tube
   (drops, ml), the total, the est. note.
3. **Create — layer 2, sheet.** Layer 1 shown dry, in colour. Blended lanes
   above the curve, the curve highlighted as lane 1. Drops: white left, grey
   right.
4. **Create — layer 3, black.** Lanes from the edges inward, homes at the
   edges, tails into the red and the grey. (The design still shows the hand
   version, hatched; to redo: nothing is drawn by hand, the owner.) Pairs:
   a row per muddy pair — tubes, keep-out, the measured distance; ⚠ only when
   closer than the keep-out; the intended row (black into red).
5. **Job — as in RUBENS** (`references/Screenshot 2026-09-30 JOB-1.png`,
   `JOB-2.png`; the owner: "just carry it over"): the plan on the canvas with
   TL TR BL BR and the walls; Save job.json and ⚡️ Do Job at the top right;
   Progress with the LCD, Pause, and **• STOP · •• HARD STOP under Pause, in
   the Progress panel** — not in the top bar as in the sketch; Job; Machine.
   Rembrandt adds the drops: an LCD counter (`05 / 19`), the current tube
   and drop, **Next drop** (Space or a USB foot pedal that sends Space),
   Back, Skip. The layer's tubes in run order, one stage each (§1): the
   tube's drops, then ⚡️ Do Job runs that tube's trips; then the machine
   waits, brush off, out of the way: **Again** or **Next tube**.

**Pointer mode and the hover pose are dropped** (the owner, 2026-10-02):
the drops go on by eye from Create's drop map, and later the brush dips
(§1).

**Day and night** (the owner, 2026-10-02: "when I pick the moon, everything
goes dark", `references/braun_night-1.jpg`, `braun_night-2.webp`): a sun and
a moon by PROGRESS on Job and Test. Night turns every tab graphite — raised
dark keys, light type, the one orange — and the LCD glows warm yellow behind
its glass; the canvas and the board stay the colour they are. One switch for
all tabs, kept in this browser. On Test, PROGRESS sits at the top of the
panel, as on Job.

---

## 9. The first painting — the sheet

Canvas 50 × 70 cm, portrait, white ground, laid on the 100 × 70 one. The
reference covers the whole image area (§0), the canvas is a window in it.
One curve; a white sheet over a warm glow; black around.

| layer | where | tube: home → tail | order |
|---|---|---|---|
| 1 Light | below the curve | Yellow: the right edge → left, into the red. Orange: the right edge, behind the yellow. Red, Crimson: from the left, towards the yellow | Yellow, Orange, Red, Crimson |
| 2 Dark | below the curve | Oxblood, Dark red, Maroon, Black: the left edge → right, into the red | the lighter first |
| 3 Sheet | above the curve | White, Cream: the left edge → right, into the greys. Light grey, Grey N5, Dark grey: the right edge → left, into the white | the lighter first |
| 4 Black | above the curve, along the U | Black: into the wet grey | — |

The sketches: `references/IMG_9422_direction.png` and `IMG_9422_direction-2.png`
(the owner, 2026-10-01). Lanes, trips, drops, ml and machine time are computed
by the program from the curve on the image area. The numbers of the first
version of this table (13 and 15 lanes, 19 and 21 drops, ≈ 40 and 44 ml) were
for 70 × 100 cm and are gone.

- Yellow lies next to the curve on the right; red on the left and outermost.
  Yellow needs the white ground under it.
- **Orange is in by default** (the owner, 2026-10-01). The sketches give it
  no home; the program takes it from the reference, where IMG_9422 has the
  orange: at the right edge, behind the yellow.
- The grey is its own tube between the white and the black (the owner,
  2026-10-01).
- **The black at the top goes into the wet grey**, in the sheet's session,
  after the grey (the owner, 2026-10-01: "I like it better on the wet
  grey"); it draws into the grey softly instead of leaving a stripe. The
  black at the bottom, into the red, stays a layer of its own.
- The top of the sheet is left for the black.
- Keep-out yellow ↔ black: 40 mm. On the sketch the black's tails reach the
  middle of the lanes, near the end of the yellow's: expect a ⚠ there and
  decide where the black stops.
- The tube names and pigment codes (PY74, PO73, PR254, PW6, PBk11, Grey N5 as
  a premix) are placeholders: replace them with the tubes on the shelf.

---

## 10. Build order

1. **Create**: attach a reference, the curve, the layers, the bands (convex
   offsets and blended lanes), the lanes preview.
2. **Drop plan and inventory**: tubes entered by hand, the drop plan, the ml
   table.
3. **Job**: pointer mode, then Do Job per layer through RUBENS `jobToMachine`,
   with one-way runs: home → tail, brush off, back in the air (§5; the
   owner's idea, 2026-10-01); stage by stage, one tube at a time, Again or
   Next (§1).
4. **Adjustments**: drop dose, smear length, swatches, pairs.
5. **Pair check** with measured numbers.

Target: about three weeks from 2026-10-01 (the owner agreed on three weeks,
2026-09-30).

---

## 11. Later (not in v0.1)

- **Spiral texture and separations**: a rectangular spiral from the centre
  (core length = canvas height − width, 20 mm pitch); up to three tubes per
  layer; layers chosen as a graph colouring of the muddy pairs that touch —
  every grouping of the tubes is enumerated (877 for seven tubes).
- **The order of runs, worked out by the program**: tubes grouped into
  layers and runs from the muddy pairs, as the spiral research did (it put
  the lightest first too). Not developed yet; v0.1 follows the art-school
  rule of §1.
- **Reference → direction field** (structure tensor), so the lanes follow
  the threads of the reference.
- **Own dispersion**: seeded bundles of spectral lanes, offsets by Cauchy's
  law `n(λ) = A + B / λ²` (A = 1.5046, B = 0.00420 µm²); the seed goes on the
  certificate.
- **Dip station** — in the plan now (§1): cups with paint level flush with
  the canvas, a wire to wipe on. (Water and a sponge clash with "no
  washing station" in §1: to settle when it is designed.)
- **Arm strokes — tried and dropped** (2026-10-02): the shoulder drawing an
  arc, the gantry stepping on, the arc again (the arm's drawings of
  2026-09-13 and 09-14 in `previous_research/`). Run in the air on the
  3DOF bench the same night; the owner: "Not Instagram-worthy, even
  unsettling. Let's not scatter: back to the main X Y method with the
  steppers." The firmware keeps `J` with a speed and `H`; "only X, Y and
  the wrist move during a job" (§1) stands.
- **Shoulder and elbow effects**: turn a flat or fan brush by turning the arm
  while the gantry holds the tip still (width and twist). First test: a
  pencil must leave a dot, not a scribble.
- **Closed loop** with the bracket camera.

---

## 12. Materials — advice, not decided

- Gloss: gel medium instead of water; a heavy gel keeps the grooves, a pouring
  medium levels them away.
- No silicone oil: varnish and resin do not hold on it.
- Finish: gloss varnish (the relief stays tactile) or epoxy resin (a layer of
  real glass over the relief).
