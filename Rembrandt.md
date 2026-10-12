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
| **Create** | The tab where a painting is planned. Never touches the hardware. Hidden from the top row since 2026-10-04, NOLAN in its place (§1); the page stays, `create.html` since 2026-10-06 (`index.html` is TYPE), and the Library still opens a painting on it. |
| **NOLAN** | The tab that paints ribbons, in Create's place since 2026-10-04. Its task: `NOLAN.md`. The only tab where the hand works too (§1). |
| **New Yuri** | The tab that paints letters as rings of circles, after NOLAN on 2026-10-06, off the top row the same day (§1, §8); the page stays, and the Library opens its saves there. Named by the owner. |
| **Letter** | On New Yuri: one glyph of `app/glyphs.json` on the canvas, a figure of its own — its baseline and left edge, its height, Weight and Step, Rings or Coil. |
| **Skeleton** | A letter stroke's centre line, lines and arcs, in a box from the baseline to the capline inset by the Weight; the circles' centres walk along it. |
| **Weight · Step** | New Yuri: a letter's circle radius, and the distance between neighbouring circles along a skeleton, mm. |
| **Rings · Coil** | New Yuri's two ways to draw a stroke: every circle a ring of its own — it lands, goes round, on 60 % over its start, lifts; or one line a stroke, a whole turn from circle to circle. |
| **TYPE** | The tab that paints letters as bands, the first of the top row and `index.html` from 2026-10-06 to 10-11, then off the row, `type.html` (§1, §8): TRACE, MARKS, DRAG. After the prototype of Claude in chat, `TYPE-Claude/`. |
| **LOVE** | TYPE's copy, after it in the top row from 2026-10-07 to 10-11, then off it (§1), where the new things go — Play the run, then the ribbon of `TYPE-Claude/RIBBON-new.md` — so that TYPE stays as it is to go back to. `love.html`, its plan `loveplan.js`. |
| **ALU** | The tab that paints pipes of paint, after LOVE in the top row since 2026-10-08 (§1, §8): TYPE's passes, TRACE · MARKS · DRAG, on pipes. `alu.html`, its plan `aluplan.js`, after the spec and the prototype of Claude in chat, `ALU-Claude/`; the rest of its words in `ALU-Claude/ALU.md`. |
| **TAPE** | The tab of a cassette and its tape, the first tab since 2026-10-12 (§1, §8): a compact cassette at real size in the centre of the canvas, its outline traced by the machine, the rest drawn with a stencil and coloured by hand last; its tape wound round it by the brush, lane after lane, touching, off the canvas's edges — after chat-Claude's prototype v0.3 (`TAPE-Claude/`, its words in `TAPE-Claude/TAPE.md`). TRACE the cassette's outline and the tape's guide with the brush, with INK ON in watercolour; DRAG in two keys, Snake and Air; no MARKS. `index.html`, its plan `tapeplan.js`, its page module `tape.js`. |
| **Lane · pitch (on TAPE)** | A lane: one loop of the tape round the cassette, one brush wide, a rounded rectangle whose four corner arcs share one centre, so the next lies one pitch outside it all the way round; lane 1 the one touching the cassette. The pitch: lane centre to lane centre, the brush and the Gap; at Gap 0 the lanes touch. |
| **Seam · lane change · closed rings (on TAPE)** | The seam: where the tape moves out to the next lane, the middle of the right side. The lane change: the stretch from the seam over which it drifts out one pitch, Lane change brush widths long, one smoothstep for every lane, so neighbours never bunch or part; longer than lane 1, one continuous spiral and no seam seen. Closed rings instead: every lane closing on itself, the brush lifting to the next. Not ALU's seam. |
| **Run · overrun (on TAPE)** | A run: the tape whole, from where it comes out from under the cassette to its last lane, the brush down off the canvas too (a closed ring a run of its own). The overrun: how far the brush carries on past the canvas's edge at a run's end before it lifts. No segments and no paint stops since 2026-10-12, the evening (§1). |
| **Spoke (on TAPE)** | Paint squeezed across the lanes at one spot round the cassette, from it outwards, as the owner laid it on paper (`TAPE-images/` 17:22): one of his paints, all the lanes or from lane to lane, on the canvas only; the tape passes it lap after lap and the brush drags it along. Laid with M; the Result mixes them as the brush goes. A map for the hand, never run on the machine. |
| **Snake · Air (on TAPE)** | DRAG's two keys on TAPE: the snake, the run's strokes forward, back, forward … with the brush down; air, forward on the canvas, the brush lifting at the end and flying back to its start, the strokes over. Not CCD's snake, lane after lane. |
| **ALU-CUT** | ALU with the new things, the first tab from 2026-10-11 to 10-12, in TYPE's and LOVE's place, then after TAPE (§1): cuts made with the scissors, ✂ (C), the brush stopping at each, every part its own palette and a clean brush (chat-Claude's task, `ALU-cut-Claude/`). `alucut.html` since 2026-10-12 (`index.html` before), its body `data-tab="alucut"`; ALU's page module and plan, ALU's palette, its own keep and Library label. |
| **Cut · part** | On ALU-CUT: a seam made with the scissors, ✂ (C), where DRAG stops — the brush lifted, wiped or washed, the next part's paints squeezed, Continue; a part, the pipe between two cuts or a cut and an end, painted on its own with a clean brush, its lanes half a brush clear of a cut, the pipe's lane numbers going on across it (2026-10-11, §8). A seam (S) only changes the paints. |
| **SMKN** | ALU with the paints in stock, after it in the top row since 2026-10-08 (§1, §8): the palette of the owner's brand Soumkine, fourteen tubes — Sennelier Abstract, Lukas Cryl Terzia, Pébéo Studio Acrylics — their colours read off his photographs (est.). `smkn.html`; ALU's page module and plan, its own keep and Library label. |
| **CCD** | The tab of rectangles of straight lanes, after Carlos Cruz-Diez — not the camera's chip — after ALU-CUT in the top row since 2026-10-11 (§1): the paint squeezed by hand along one edge, the dry brush driving it across, lane after lane; DRAG alone, no TRACE, no MARKS, in two keys — Snake, the lanes back and forth with the brush down, and Air, each lane one way and a flight back. `ccd.html`, its plan `ccdplan.js`, its own page module `ccd.js`; ALU-CUT's untouched. |
| **Rectangle (on CCD)** | A free-transform box on the canvas — dragged, stretched by its eight handles, or typed by the ruler from the canvas's bottom left corner (Left, Bottom, Width, Height) — Vertical, every lane from its bottom edge up, or Horizontal, from its left edge to the right; 1 … 218 lanes, the outer lanes' brush edges on its sides. DRAG stops before every next one. |
| **Pipe** | On ALU: one wide band of paint along a line of points laid on the tab, its corners rounded by arcs (Corners, Largest corner radius), so every lane of it is lines and arcs. |
| **Whole lanes, Master Flo · Segments, Alu** | ALU's two brushes, named by the owner on 2026-10-08. Whole lanes: every lane the whole pipe in one run, the inside lane first — the owner's numbers, 1 the outside lane, n the inside one, run n … 1 — a lift after each, or the snake, back and forth with the brush down (2026-10-10, §8), the brush not washed between them; every mark right across the whole pipe in one paint, the paints along it, never across (2026-10-08, §1). Segments: the pipe cut by seams, each segment brushed along the line — its paints across the pipe, Lett's tubes, the Australian style — or across it; fan ends. |
| **Paper test** | The owner's hand-made run of the machine on an A5 page, 2026-10-08, in black and white acrylic (`ALU-Claude/paper-test/`): eight whole lanes crossing their own way in one lane per step. The reference for Whole lanes, the fixture of its tests; its key on ALU gone since 2026-10-10 (the owner: "Remove Paper test. What 8 Oct? I do not need this key :)"). |
| **Band (on TYPE)** | A letter's stroke as the brush fills it: its skeleton (New Yuri's set) a share of the letter's height wide, round at its ends; split at every corner sharper than 25°, so V, M, Z, L are overlapping bands; O, 0, 8 closed bands; the dots of ! and % discs. Not Create's band. |
| **TRACE · MARKS · DRAG** | TYPE's three passes and their keys. TRACE: the outline of every band in watercolour from the cup. MARKS: a stroke across a band where a paint goes, its ticks (the owner's "grooves") the paint's number as on an abacus — a long one five, a short one one — from the same cup; the owner squeezes the paints onto them by hand. DRAG: the dry brush through the paint, every lane non-stop, no dip — Florian Markus's way. |
| **Session** | On TYPE: the bands marked and dragged together. A band over a band of an earlier session goes to a later one, the earlier dry first; OVERLAPS: wet on wet, dry between letters, dry every overlap. |
| **Job** | The tab that runs one layer on the machine. Writes `job.json`; ⚡️ Do Job runs it. Off the top row since 2026-10-06 (§1); the page stays, Create's Open Job goes there. |
| **Calibration** | Machine settings: steps, home, canvas corners, reach, wrist zero. Called "Calibrate" in talk. It belongs to the machine, never to paint. |
| **Adjustments** | New tab. How each paint behaves: drop dose, smear length, swatches, muddy pairs. Everything about paint lives here. Off the top row since 2026-10-05 (§1); the page stays. |
| **Library** | Saved paintings, as in RUBENS. |
| **Reference** | An image attached on the Create tab with **Add new reference**. Shown under the canvas, traced, sampled for colours. Never painted as is. |
| **Curve** | The one master path of a painting. Lines and arcs only. Every band is built from it. |
| **Band** | The part of a layer on one side of the curve, N lanes wide. |
| **Upper line** | A calm curve that a band on the concave side blends towards, so its lanes never fold (§3). |
| **Lane** | One brush width along a band, 20 mm by default. Same word as in RUBENS. |
| **Trip** | One run of the brush along a lane. A lane is painted in 2, 4 or 8 trips (RUBENS Job tab). In Rembrandt a trip runs one way, from a home to its tail; the brush lifts there and goes back in the air. |
| **Layer** | Everything painted in one session over the dry layer below it: a band, its tubes, its drops. Not "pass" — in RUBENS a pass is a brush run inside a lane. |
| **Hand layer** | None since 2026-10-01: the machine paints every layer, the black too. The hand only corrects. **Except on NOLAN** (2026-10-03, §1): there the owner paints the black around the ribbons, the dark glazes and the airbrush glow. |
| **Ground** | What lies under the first layer: the white canvas. |
| **The canvas from home** | The canvas on the machine: its bottom left corner level with home, its left edge so many mm to the right of it; Board width and height grow it up and to the right (§1). One base for TYPE, NOLAN, New Yuri and Ink since 2026-10-06 (`src/canvas.js`): typed on one, it changes on all. |
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
| **o'clock** | A place on a ring or a loop, read as a clock face over the canvas as it lies on the machine: 12 at the top, towards the top wall (machine +X); 3 to the right (+Y); 6 at the bottom, by home; 9 to the left, the cup's side. A Circle's seam — where every row lands and its lap begins — is at 12 o'clock, and its rows run clockwise (the owner, 2026-10-05: "the clock face — I guessed it"). |

---

## 1. Decided. Do not propose again

- **Everything in English**: UI, documents, code comments, commit messages.
  The RUBENS rule, confirmed by the owner 2026-10-01.
- **Braun style from RUBENS**: cream `#EDEAE4`, panel `#F5F3EF`, stage
  `#E2DED6`, line `#D5CFC4`, ink `#24221F`, one accent, orange `#EB7A25`.
  Green `#4F7A28` only on Open Job, Do Job and the INK switch on Test (the
  owner, 2026-10-03: "the button green, not orange"). Raised neutral keys; the chosen
  key is pressed and carries an orange dot. Helvetica Neue; SF Mono for
  numbers. **The sliders are dark grey**, their slot 4 px, no orange on them
  — orange stays on the STOP dots; **Do Test is dark grey**, not green (the
  owner, 2026-10-02).
- **Paths are lines and arcs only.** No Béziers. The RUBENS rule.
- **Calibration and Job come from RUBENS.** Rembrandt reuses them, it does
  not rewrite them.
- **The elbow lifts the brush, as a hand does** (the owner, 2026-10-02:
  "the shoulder and the elbow are useless as they are — and the flags and
  the broom are a real problem; I swap the elbow from useless arcs left and
  right to a proper lift. People do not move the brush aside, they lift it
  off the canvas, the human way. The 3DOF stays."). Three new ST3235
  servos; the shoulder's and the elbow's handles to the right are gone from
  Calibration. The rule below changes once the lift is measured: the elbow
  will move during a job.
- **During a job X, Y and the elbow move** since the new arm (the owner,
  2026-10-02: "on the move — the tail a smooth easing of the pressure, no
  stops; let's work properly"): the elbow presses the brush (0°), eases it
  off to +15° and lifts it to +25° through a turn, by `W` on the path; the
  wrist stands at 0°, the shoulder holds. What follows was the rule before.
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
- **No pencils any more: watercolour** (the owner, 2026-10-02, "first the
  canon"). The machine lays a light trace of the line in watercolour before
  the main run in thick acrylic. Drops are an alternative to a stroke, but
  the brush itself follows the contour on the canvas more exactly. "The
  more water, the better." TAPE tried the pencil for its TRACE on
  2026-10-12 and dropped it the same day (below).
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
- **NOLAN is the one exception** (the owner, 2026-10-03: "Who said the
  machine has to do everything?" and "I am not Florian, not an architect —
  I am not afraid to move a brush over the canvas"). On the NOLAN tab the
  machine paints the ribbons on the white ground; the owner paints the
  black around them by hand at the end, the dark glazes, and the glow with
  an airbrush. The glazes go in glazing medium, not water (the owner
  agreed): water-thinned acrylic loses its binder and goes patchy; the
  medium keeps the lines showing through the shadow. Nor does NOLAN go
  stage by stage, lighter tube first: all the drops of a layer go on
  before the run, and the brush goes line by line through them (the owner,
  2026-10-04). The rules stand on every other tab; nothing of the
  exception leaks into them.
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
  Since 2026-10-03 the ribbon collection comes before it (below).
- **The ribbon collection comes first** (the owner, 2026-10-03): ordinary
  canvas, Florian Markus's way, on a black background, after a glowing
  render of ribbons (`nolan-images/IMG_9424.jpg`) whose geometry and
  colours the owner changes: "I just need to change the colours and the
  geometry." Painted on the NOLAN tab, by `NOLAN.md`.
- **Create is hidden, NOLAN takes its place** (the owner, 2026-10-04: "I
  would hide Create for now. It just isn't working — a pile-up of
  colours"). The version, **v0.2**, moves next to the name; **v0.3**
  since 2026-10-05 (the owner: "REMBRANDT v0.3 already :)"); **v0.4** the
  same evening (the owner: "publish the update on GitHub and make it
  v0.4 :)"); **v.1.0.1** on 2026-10-06, with TYPE first (the owner:
  "replace REMBRANDT v0.4 with v.1.0.1; push it to GitHub and make the
  update today's date"); **v.1.0.2** on 2026-10-08, with ALU (the owner:
  "this will already be REMBRANDT v.1.0.2 :)"); **v.1.0.4**, Snake, on
  2026-10-11, with SMKN, TRACE on the lanes, the snake and PAUSE at a
  lane's end (the owner: "name today's update somehow, v.1.0.4 already —
  we have not updated for a while"); **v.1.0.5**, Cut, the same day, with
  ALU-CUT first, its cuts, MARKS on the lanes and up to 18 lanes (the owner:
  "a small update to v.1.0.5").
- **The canvas lies from home; TEST's dots 20 mm in from its edges** (the
  owner, 2026-10-05, `adobe_ai/500x700_image_area.png`: "home in
  Calibration is the bottom left corner"; "the canvas must not slide down
  under the image area, but lie on it"). On NOLAN the canvas's bottom left
  corner is fixed from the machine's home — its bottom edge level with
  home, its left edge 50 mm to the right, two ruler numbers on the tab —
  and **Board width** and **Board height** grow it up and to the right.
  TEST's four dots stand 20 mm in from both edges of their corner at any
  board size: "the bottom left point, for example: from the left edge to
  the point and from the bottom edge to the point, always 20 mm. The same
  at every corner … so I can make the board 400 × 600 mm, and the points
  keep their 20 mm from the edge." The brush goes round the board in one
  go — TL, TR, BR, BL — and home ("so a neat square is cut"). Before, the
  dots stood at the corners of the drawing ("they depend on the shape, and
  they must depend on the board's width and height"), BL first, and the
  canvas at the Test tab's Here, 124 mm past the bottom wall. On NOLAN
  this replaces the canvas from the cup of 2026-10-04. **One base since
  2026-10-06** (the owner, `TYPE-Claude/Screenshot 2026-10-06 INK.png`, the
  Ink tab's white board under the image area: "make it as on NOLAN and
  TYPE — let them have one base we carry the parameters to"): the four
  numbers kept once, in this browser; TYPE, NOLAN, New Yuri and Ink read
  and write them, and the Ink tab draws that canvas in place of the Test
  tab's board, its fields in place of the canvas from the cup's. The Test
  tab keeps its own Here.
- **New Yuri, a tab of its own for letters** (the owner, 2026-10-05:
  "maybe make a New Yuri tab, so as not to mix all this into NOLAN? We have
  no 3D there, half the sliders are not needed"). Letters drawn as rings of
  circles along a skeleton, RINGS or COIL (`app/src/rings.js`, after
  `type_rings_mode/rings.py` of Claude in chat). The skeletons are the
  owner's set, `NEW-YURI/*.png`, fitted by Claude (`app/glyphs.json`); the
  A of `ABCD.png` is the canon ("the only correct A"). The page is copied
  from NOLAN; the run, TEST, the lap, the LCD and the cup stay in the shared
  modules and are imported, so a fix reaches both tabs (the owner agreed).
- **Adjustments off the top row** (the owner, 2026-10-05: "the Adjustments
  tab can go now — it only gets in the way"). Its page stays, as Create's
  does.
- **TYPE, a tab of its own: letters as bands in three passes** (the owner,
  2026-10-06: "we start work on the new TYPE tab"): "first the brush draws
  the trace in watercolour; second it marks where each paint goes, with
  grooves — the marks with the brush itself are my idea, Claude came up with
  the grooves; third a dry brush run, as Florian's." The prototype of Claude
  in chat, `TYPE-Claude/`, gives the bands, the marks and the drag; the trace
  is drawn as it lies on the paper, NOLAN's wash ("not schematic as here, but
  as yours — realistic"). The page agreed before the code, the same day: **no
  PLAY** — a cassette deck, TEST · PAUSE, TRACE · MARKS · DRAG, the stops
  ("PLAY is no longer needed, it splits in three: a panel as on old cassette
  recorders"; an icon on each key, its name in the sliders' letters, "maybe
  three rows"); PAUSE turns to CONT.; the canvas ours, from home, not the prototype's formats
  (past the reach); OVERLAPS in NOLAN's Auto · Uncut row, then INK; the text
  typed in a field, Select to move it; the ticks always on ("simplify as far
  as we can"); MARKS and DRAG go session by session, a press each. **One
  cup**: TRACE and MARKS dip in the Ink tab's cup, DRAG never; the
  prototype's second cup, INK-2, is cancelled ("I would keep one cup. Why
  complicate"). **The views back, and Result** (the owner, the same
  afternoon, `TYPE-Claude/2026-10-06 1978.png`: "we moved the action into
  the cassette keys, but for the preliminary work I need to understand what
  the result will be — so they must be repeated in the simulation, as Claude
  in chat had it. The Result key is needed, and the paints"): 1 Trace · 2
  Marks · 3 Drag · Result show, the deck runs; the paints in stock, and the
  bands clicked to another, are kept with the save in the Library ("so the
  new palette is kept with the name in the Library"). Before, no Result and
  the board showing every pass at once.
- **LOVE, a copy of TYPE for the new things** (the owner, 2026-10-07: "I
  would duplicate TYPE's functionality but make a new tab, LOVE, and bring
  the new changes there"; "because if something goes wrong, we can roll
  back to TYPE"). After TYPE in the top row: TYPE · LOVE · NOLAN · Test ·
  Ink · Calibration · Library. Its page `love.html`, its plan `loveplan.js`,
  a copy of `typeplan.js` changed there and not in TYPE; its own keep in
  this browser, its saves labelled LOVE and opened on it; the run, the
  canvas from home, the cup and the LCD shared, as New Yuri's are.
- **LOVE runs on rails; no ribbon** (the owner, 2026-10-07, on four zeros
  laid over one another, `TYPE-Claude/Screenshot 2026-10-07 at 1.50.09
  AM.png`: where the rows of two letters close on one another, "the
  algorithm takes an imprint of the pattern and works out the path as on
  rails"; then: "No ribbon. The path will be rails. The main thing is that
  the train runs without stops"). Every lane a rail; where the lanes of
  touching letters lie together, a switch; the train goes round them as an
  8, inside and outside taking turns by themselves. The ribbon of one spine
  (`TYPE-Claude/RIBBON-new.md`) is not built. **Odd lane counts stay**: the
  owner had asked to forbid 5 and 7, an even count "excluding hairpins";
  counted on six zeros, the overlap decides, not the parity (7 lanes, 5 rows
  across and 7 down: one train; 6 and 8 at best two), and the reading shows
  the trains instead (the owner: "great! let's keep the odd ones, of
  course"). More than one train is more than one pass, each non-stop (the
  owner: "can we go through twice?"). The look wanted: abstractions of
  overlapping 0 and O, not words (the owner: "LOVE or AMOUR is a cheap
  poster for 50 euros, the magic is gone").
- **ALU, a tab of its own: pipes of paint** (the owner, 2026-10-08: "we
  have a new tab, ALU-Claude, in the root of Rembrandt — study it, please,
  and let's add it in our style next to TYPE and YURI"). The spec and the
  prototype of Claude in chat, `ALU-Claude/`, ported into `aluplan.js` and
  LOVE's page; after LOVE in the top row: TYPE · LOVE · ALU · NOLAN · Test ·
  Ink · Calibration · Library. The owner's words of the day, said to Claude
  in chat (`ALU-Claude/README.md`): "We do everything inside Rembrandt,
  that is what it was made for" — no Illustrator; "The configuration we
  have now: three servos and two NEMA17. If it sells, I will build a second
  machine" — no servo turns the brush; "I will drive the brush as Florian
  does": the beads, and the crossings as stairs; on the paper test, one
  lane per step where the pipe crosses itself, "not in twos"; New
  composition: "take out the across ones, just stripes in parallel"; the
  brushes named **Whole lanes, Master Flo** and **Segments, Alu**; "Remove
  Brushed aluminium, I do not plan it at all" — the grounds White and
  Paper. The panel is the canvas from home, not the prototype's formats, as
  on TYPE (*Claude's choice*); Paper test, 8 Oct made it 148 × 210, until
  the key went on 2026-10-10.
  **Master Flo's marks right across the whole pipe** (the owner, the same
  day, `ALU-Claude/Screenshot 2026-10-08 at 2.55.56 PM.png`: "Whole lanes,
  Master Flo and Segments, Alu — that is all the Australian style, Alu. I
  did not notice at first; it came over from chat-Claude, the prototype had
  the error from the start. But it can be fixed. The principle of Master Flo
  is as on 02_marks_black_white.jpg: the lines always across the whole
  sausage, they make no gradient at once"): a mark one paint, edge to edge,
  the paints in turn along the pipe — never cut into a dash a paint across
  it. The paints across, Lett's tubes, are Segments, Alu's. New composition
  draws Master Flo's: a tube's paints along each pipe.
- **ALU-CUT first; TYPE and LOVE off the top row** (the owner, 2026-10-11:
  "remove the TYPE and LOVE tabs — they do not work, they only distract;
  put ALU-CUT in their place, and every new thing there"): ALU-CUT · ALU ·
  SMKN · NOLAN · Test · Ink · Calibration · Library. ALU-CUT is
  `index.html`, the server's first page, `start.command` opens it; TYPE's
  page `type.html` (as Create's went to `create.html`), LOVE's `love.html`,
  both kept, the Library opening their saves there. ALU-CUT shares ALU's page
  module and plan, as SMKN does, the new things on it alone (*Claude's
  choice*: a fix reaches all three, ALU as it was); ALU's palette, the
  owner's sketch's.
- **CCD, a tab of its own: rectangles of straight lanes** (the owner,
  2026-10-11, `Cruz-Diez/`: "I happened upon Carlos Cruz-Diez and want to
  drive the brush that way; it should go especially well on 20 × 20 cm
  canvases"; "CCD — not as in video cameras, but in honour of Carlos
  Cruz-Diez :)"; "no trace, no marks are needed here — I just squeeze the
  paint at the bottom and the brush drives it from the bottom up. Evenly";
  "the same brush I paint the sausages with, but stretched left and right in
  width and up and down in height — a free-transform rectangle"; "the lines
  not 18 at most, but all 218 — that is why a new tab: I do not want to mix
  up ALU-cut, where the sausages are"; "the direction I want to choose too —
  horizontal or vertical"; "most likely I will take a flat brush, so its
  position depends on the direction the machine moves"). After ALU-CUT:
  ALU-CUT · CCD · ALU · SMKN · NOLAN · Test · Ink · Calibration · Library.
  Its own page module and plan (*Claude's choice*: ALU-CUT untouched; the
  run, the canvas from home, the LCD and TEST shared); the deck TEST ·
  PAUSE, DRAG alone, STOP. **DRAG in two keys, Snake and Air** (the owner,
  the same day: "two DRAG keys — the snake and through the air; on ALU-CUT
  we made a switch, here it is all simple"): Snake, a rectangle's lanes back
  and forth with the brush down, a step across at each end, one landing a
  rectangle; Air, every lane one way, the brush lifting past the far edge
  and flying back (before, Air alone: "the paint lies along one edge only",
  *Claude's*). Vertical from the bottom up, Horizontal from the left; a stop before every
  next rectangle, the flat brush turned by hand where the direction turns,
  as no servo turns it (2026-10-08); the board the canvas and home, not the
  whole image area (all *Claude's*).
- **TAPE, the first tab: a cassette and its tape** (the owner, 2026-10-12,
  `TAPE-Claude/`, said to chat-Claude: a hand-painted cassette in the
  centre, the tape painted by the machine with the brush, after Werner
  Bronkhorst's textured grounds and tiny figures — "only to restore
  Soumkine, on Etsy"; "let's make a TAPE tab and bring back the pencil …
  for trace! I would use an exact cassette"; "Trace — draw the cassette and
  the tape in the centre: the cassette I will outline with paint like a
  colouring book, the tape is our plotter with the brush, a perfect drawing
  and texture"; "Marks is not needed, we do not put it in the software";
  "but two Drag — the snake, and there along the canvas, back through the
  air"; the brush the tape: "it will be 100 % the size of the tape in an
  audio cassette, so the small differences are for the adjustments"; the
  corners from sharp to round: "when the corners are sharp, the tape fits
  the square perfectly … so we add a slider transition to round corners,
  but then on the fly"; "the cassette always in the centre, and when the
  format changes, 20 × 20, 30 × 30, 50 × 50 cm, it moves to the centre by
  itself"; the lane change: "only ×24 or even ×48! Let it curl invisibly,
  elegantly, as a spiral" — ×48 by default; his own `cassette_trace.svg`;
  "everything is super now", prototype v0.3 approved). Then to Claude, the
  same day: **TAPE first** ("TAPE first tab, all correct. index."): TAPE ·
  ALU-CUT · CCD · ALU · SMKN · NOLAN · Test · Ink · Calibration · Library,
  ALU-CUT's page `alucut.html`. **No format keys; 60 × 60 not refused**:
  the canvas from home, typed by hand ("just leave 200 × 200 mm by hand, as
  on ALU / CCD, I am fine changing the format"), the cassette in its centre;
  60 × 60 is past the reach across, 568.5 mm, and stays ("no, I do not
  agree, because it is the motivation to buy the cross rails and make X go
  800 mm at all. 518.5 mm is a temporary measure … the table's width allows
  it"). **The pencil in the brush's holder**, swapped by hand between TRACE
  and DRAG; their zeros unmeasured ("we do not know yet, the machine is
  home-made, DIY, so better to test; I can touch up the tape with a brush
  too"). **INK** as on ALU ("remember we have the test, and there may be a
  cup there, so a switch may be needed … maybe a pale watercolour trace
  with a thin brush will do, not necessarily the pencil"): OFF the pencil,
  ON the watercolour from the cup; DRAG never dips. **The paint stop**: the
  brush waits up over the segment's start ("yes, absolutely fine; do not
  worry, if it needs to go back home I will tell you") — gone the same
  evening, with the segments (below). **The views ours**,
  Trace · Drag · Result and ▶ Play the run ("of course, the views ours, that
  is the canon"); no Export SVG, the save carries the prototype's layers.
  The deck TEST · PAUSE, TRACE · Snake · Air, STOP, as CCD's (the owner:
  "yes, all as on CCD"). *Claude's choices*: INK off by default; TEST dips
  only with INK ON; the cassette's outlines fitted within 0.02 mm, a lane
  change within 0.1 mm, a lane's own sides and corners exact; the times the
  board's planner's, the prototype's reckoning under the plan's i; no
  Reference panel.
  **After the pencil's first traces** (the same day, `TAPE-images/`): a
  closed outline **round twice** ("draw the circle double, so it surely goes
  the full 360 degrees on the canvas") — the screws' circles had come out a
  short stroke, the landing and the lift-off eating them; **no lift at the
  canvas's edges** ("the canvas sits firm on its supports on the table, the
  brush just goes through the air and fits into the corners smoothly; we
  only lose time on the lifts"; on Claude's offer to lift past 100 mm off
  the canvas: "no, really, let it just go without a lift, I will be
  calmer"): a path one run; **Counter takes the cassette backwards too**, to tell the
  pencil's springs from the motors — every loop's top left corner cut ("the
  pencil is drawn like a bow with an arrow"; if the fault moves to the
  bottom right, three sides in one go and the fourth after a lift, "the
  letter П", is the owner's next step). It moved to the top **right**:
  wherever the line had gone up. **TRACE in parts** ("it is the spring — a
  construction for the brush … let's draw not continuously but in parts,
  stick, stick, cucumber"; the springs stay: "otherwise the pencil's point
  can hole the canvas; the brush has no trouble at all, its bristles make up
  for the spring"): the pencil never up the picture steeper than 20° (est.),
  every rise a stroke of its own top to bottom, the strokes 4 mm over each
  other (est.); In parts in the Trace keys, ON by default — gone with the
  pencil the same day. **The pencil dropped; TRACE the cassette's outline
  only** (the owner, the same afternoon, on "16 minutes" for TRACE in parts:
  "too long, that will not do. I will just mark the rectangle with the
  brush. Two weeks ago we took the pencil away … this construction does not
  draw that way"; "so we take the cassette away and keep its outline — the
  cassette can stay in the Result, to see what comes out. I will cut a
  stencil out of cardboard and draw round it in 30 seconds; why wait 16
  minutes?"; "the springs matter, otherwise the pencil's point can hole the
  canvas; with the brush there is no trouble at all — its bristles make up
  for the spring"): TRACE the shell, the box the lanes hug, round from 12
  o'clock and on 60 % over its start, the brush lifting off over the lap,
  as every loop of Rembrandt's TRACE (*Claude's*: the brush's canon in
  place of the pencil's round twice), ≈ 20 s; and the tape's guide; the
  rest of the cassette in the Result, faint on Trace and Drag. DRAG
  untouched (the owner: "in Drag there is no cassette, it draws the tape
  at once, so the system is not hurt much").
  **No paint stops, no segments** (the owner, the same evening, on the
  first DRAG: "I press Snake and the pause comes at once, right on the first
  segment. Not on the first — not at all. Press it 27 times? What for?";
  then on Segment at 40 mm, 269 of them: "this option must go, we have
  overcomplicated something"): the tape one run, Snake its strokes forward,
  back, forward with the brush down, the brush landing once; Air each
  stroke from the start, a flight back between; PAUSE where the tape passes
  the seam, a lap's end, or at a turn; the Segment slider gone, and
  `plotRun`'s pauseOver with it.
  **The paints and the spokes** (the owner, the same evening, `TAPE-images/`:
  his sheets on paper 17:22, the paint squeezed across the lanes and dragged
  round; Florian Markus's IMG_0467 and his software IMG_0480 — "he really
  mixes the colours on the computer, for me that is a revelation. But we
  can make such a thing too, right?"; "I try to make a mix as Florian does,
  but I lack a layout of the real paints I have"; "can these colours go in
  the TOOLS on the left, as in ALU"): his paints a strip by the Tools, two
  columns of 12 ("maybe in two rows of 12") — the 18 Shuttle Art acrylics
  of `18-colors.jpg`, his own 01 … 05 and Rose Azo — their colours off his
  swatches in daylight (`colors-001…006.jpg`), the first sheet against its
  paper, the second against its White, swatched again to calibrate ("White
  again, specially for you — you are calibrating something there"), all
  est.;
  **M** lays a spoke of the chosen paint — a click across all the lanes, a
  drag from lane to lane, a click on one takes it away; the **Result mixes
  them as the brush goes**, DRAG's own walk — the snake's strokes or air's —
  the brush picking up and laying down paint at every step, the paints
  mixed as pigments (*Claude's*: the walk, not Florian's gradient between
  marks, so Snake, Air and Strokes show; its numbers est.). Play the run
  shows the mixed paint where the brush has been. Not run on the machine:
  the owner squeezes by hand, "Marks is not needed".
- **SMKN, ALU with the paints in stock** (the owner, 2026-10-08: "now we
  only need to make a real palette with the colours we have in stock, but
  the existing tab must stay too. Let's call the second tab SMKN — it is the
  palette of my brand Soumkine, so the colours are unusual :)";
  `ALU-Claude/Screenshot 2026-10-08 at 3.12.15 PM.png`, `3.12.23 PM.png`).
  After ALU: TYPE · LOVE · ALU · SMKN · NOLAN · Test · Ink · Calibration ·
  Library. Its fourteen tubes in place of the prototype's seventeen; its
  families of three, and its black and white for the paper test (Ivory
  Black, Titanium White), Claude's by eye. ALU's page and plan shared, not
  copied (*Claude's choice*: only the palette differs), so a fix reaches
  both; ALU as it was.
- **TYPE first; Job and New Yuri off the top row** (the owner, 2026-10-06:
  "remove the JOB and NEW YURI tabs, please; put TYPE first, it is the new
  index.html"): TYPE · NOLAN · Test · Ink · Calibration · Library. TYPE's
  page is `index.html` — the server's first page, `start.command` opens it
  — and Create's `create.html`. Job's and New Yuri's pages stay, as
  Create's and Adjustments' do.

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

- **Two rows, as in RUBENS.** The top row: REMBRANDT and its version,
  **v.1.0.5**, then the tabs **TAPE · ALU-CUT · CCD · ALU · SMKN · NOLAN ·
  Test · Ink · Calibration · Library** (TAPE first since 2026-10-12; ALU-CUT
  first from 2026-10-11, TYPE and LOVE off the row then, CCD after it; LOVE since 2026-10-07, ALU and SMKN since
  2026-10-08; Create hidden since 2026-10-04, Adjustments since 2026-10-05,
  Job and New Yuri since 2026-10-06, §1), and on
  Create the green **Open Job**. The second
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
- **NOLAN**, the first tab, in Create's place (2026-10-04): ribbons of
  8 mm strokes after `nolan-images/IMG_9424.jpg`, the ribbons N1 · N2 · N3,
  a Watercolour run and a Paint run. Built on Test — its board, PROGRESS,
  keys, INK and sliders — with Create's Tools on the left (the owner,
  2026-10-04: "let's go back to TEST as the base"). Its task, its terms and
  the owner's words are in `NOLAN.md`.
- **New Yuri**, after NOLAN (2026-10-06, §1): letters as rings of circles,
  the owner's set (`app/glyphs.json`, `app/src/rings.js`). NOLAN's page
  without the 3D — its board, the canvas from home, PROGRESS, TEST, PLAY,
  INK, the brush, Canvas, Reference, 💾 SAVE NEW YURI (the Library opens it
  here). On the left Select (V) and **T** (T): with T a strip of the
  letters by the Tools, A–Z, 0–9, % and ! (the owner's sketch,
  `NEW-YURI/2026-10-05 type.png`); a letter picked there, pressed on the
  canvas at its baseline and dragged up to its height. Select picks a
  letter, drags it, the wheel sizes it; a double-click picks a stroke, its
  own Step; ⌘C ⌘V lays a copy beside it, the outlines touching; Esc is
  STOP. The panel: Ink, **Rings · Coil**, the letter's **Weight** and
  **Step**, its Height and place; the brush's **Row width** — no Step
  under it — Brush on, Between rows, Tail. With INK ON a dip, then rings on
  what the brush holds up to the dip run, a ring never split. No RAMP and
  no gap between letters (the owner, 2026-10-06: "I don't need RAMP —
  better not to clutter the interface"; "I take the letters from the strip
  and put them on the canvas, as the circles").
- **TYPE**, the first tab (2026-10-06, §1): letters as bands in three
  passes (`app/index.html`, `app/src/typeplan.js`). New Yuri's page — its
  board, the canvas from home, PROGRESS, INK, the Reference, 💾 SAVE TYPE
  (the Library opens it here) — with a cassette deck for PLAY: **TEST ·
  PAUSE**, **TRACE · MARKS · DRAG**, • STOP · •• HARD STOP, an icon and a
  small name on each key, the running one down. The panel: OVERLAPS (Wet on
  wet · Dry between letters · Dry every overlap), INK, the view — **1 Trace ·
  2 Marks · 3 Drag · Result**, and All · Session 1 · … under 2 and 3 — the
  Text, Letter height, Band width (% of the height), Letter gap, Line
  spacing, Margin, Line width (the watercolour's, 4 mm), Fit to canvas;
  Brush, pass 3: Brush width, Lane pitch, Outside first · Inside first;
  Paint layout, pass 2: Mark spacing, Paints per letter; Simulation: Paint
  run, Glaze (est.); a click on a band in 2 Marks or Result steps
  its paint; the Canvas. The paints in stock a strip by the Tools, colours
  with no names (the owner, 2026-10-06): a chip a paint, its number on it,
  its marks under it, + and ↺ at the end. A mark's ticks are the paint's
  number as on an abacus, a long one five, a short one one (the owner:
  "(a)"), two line widths apart (Claude's choice: the prototype's 3.5 mm run
  together at a 4 mm line); a paint whose ticks pass its mark's end is
  named. On the
  left Select (V): a drag moves the text, the arrows a mm. TRACE: every
  band's outline, the line's outer edge on the band's (the owner,
  2026-10-06: "the brush is the same, in paint and dry"), as the
  outermost lane's strip of Result is; round clockwise from its letter's top, the next from
  nearest the last end, on 60 % over its start, lifting off over all of
  that; with INK ON a dip, then outlines on what the brush holds up to the
  dip run, an outline never split; 1 Trace shows the wash (`src/wash.js`,
  NOLAN's). Result is the prototype's simulation. MARKS (the owner,
  2026-10-06, after the first trace: "I cannot press MARKS"): every mark of
  the session and its ticks, a stroke each, a dip every 4 marks (est.); the
  confirm names the paints to squeeze, paint by paint. DRAG: every lane of
  the session, the dry brush, no dip, at its own **Drag speed** (60 mm/s,
  the prototype's); **a band's lanes non-stop** since the first drag (the
  owner, 2026-10-06, `TYPE-Machine/`: "must the brush lift off the canvas
  every time? Maybe let it go on non-stop"): one path a band, a spiral —
  round a lane, a short 45° step in to the next, the brush down all the
  way; a closed band from its outer edge across to its hole's. It lands
  once a band and lifts once; each lift had left a knob of paint. **Rings**
  in place of Lane pitch (the owner, 2026-10-06: "the E has 7 rings — a
  slider, 5 for example"; "a great idea"): 2 … 12 rings a band, the pitch
  following, `5 rings · 5.5 mm apart`; O, 0 and 8 at the same pitch.
  **Pass through** OFF · ON under OVERLAPS (the owner: "a switch as on
  NOLAN — Pass through, maybe an interesting effect"; "(a)"): ON, DRAG runs
  a letter's bands one after another with the brush down — from a band's
  spiral along its centre line to where the next band meets it, through the
  others between (the E's middle bar to its bottom one by way of the stem),
  never over the canvas between them; every other band from its centre
  out. Parts of a letter apart, the dot of ! and the rings of %, still
  lift. Each key runs its next session and, once that is done,
  shows the one after (`Marks 1/2` → `2/2`); **Line speed** for TRACE and
  MARKS (150 mm/s). The run's trace on the board follows the plan's lines
  and arcs, the carriage's place only for the move going on (the owner:
  "it draws crooked somehow" — the place every half second, joined by
  chords). **The zoom and the panel up** (the owner, 2026-10-06,
  `TYPE-Claude/Screenshot 2026-10-06 zoom.png`: "I need a panel at the top
  that zooms the screen, and the LCD raised"): − 100% + over the board,
  ⌘− ⌘0 ⌘+, a pinch on the trackpad zooms where it is, two fingers move the
  board; the panel runs from the top of the window, the header and the
  zoom over the tools and the board only.
- **LOVE**, after TYPE (2026-10-07, §1): TYPE's page, its plan copied to
  `loveplan.js`; the new things go here first. **Result along the brush's
  own path** (`paintWalk`, the LOVE prototype's,
  `TYPE-Claude/Rembrandt_RIBBON_LOVE.html`): the brush walks DRAG's paths
  in their order and carries what it picked up on — round into the next
  lane, with Pass through into the next band — where TYPE's Result starts
  every lane clean. So the seam shows: a band's lanes start a 45° step
  apart, and the steps line up into a diagonal across the band, in the
  paint the brush carries there. **Play the run** under the views (the
  owner: "this preview shows how the paint will lie"): the Result laid
  again in the brush's order, session after session, the whole run in
  12 s, a ring the brush's width where it is; pressed again, it stops. A
  view, not a key of the deck.
  **Rails** under Pass through, ON by default (§1; `loveplan.js`,
  trainsOf): every lane a rail; where the rails of two bands lie within
  0.35 of the pitch and parallel — along a side, or kissing at a curve — a
  switch, the train coming along one going on along the other. The
  switches that join two trains are taken, the longest stretch first, so
  the fewest trains run; each is a DRAG row, round once and on 14 mm past
  its landing, no step across the lanes. A lane nothing touches is a train
  of its own. **On rails one session**, wet on wet, OVERLAPS greyed (the
  owner, 2026-10-07: "the circles were cut into three sessions … I would
  like a continuous train, as Florian's"). **The next train the nearest**
  (the owner: "after the first circle the machine starts drawing at the
  bottom — it is more logical to go on to the neighbour"): it lands where
  the last one lifted nearest, 4 mm before a mark, so it takes up paint at
  once. 3 Drag colours the trains and rings every switch; the reading:
  `1 train — the train goes non-stop`.
  **Ground** in the Tools, after Clear (moved there from under Simulation
  the same night, the owner: "put the gradients in the left corner, so as
  not to scroll down"; at the foot of the paints' strip "it is cramped —
  right in the tools, after the cross"): a swatch a ground, the chosen one with the orange dot (the owner: "the ground a light
  gradient — I am not afraid of the brush; or black: depth appears,
  mystery, magic — no longer a drawing but conceptual art"): White ·
  Gradient · Black, painted by hand; a gradient top to bottom, its two
  colours chips under it, top and bottom (by eye). Result, Play the run, the Library's picture and
  the saved SVG show it; the passes' views keep the white, so their lines
  read. Over black the paint lies on top (multiplied, it would vanish).
  Open: the ground before the rails or after them — on black, the
  watercolour TRACE and the cup's marks would not show.
- **ALU**, after LOVE (2026-10-08, §1): pipes of paint (`app/alu.html`,
  `app/src/aluplan.js`; `ALU-Claude/ALU.md`). LOVE's page — its board, the
  canvas from home, PROGRESS, the deck (TEST · PAUSE, TRACE · MARKS · DRAG,
  the stops), INK and the cup, the zoom, the Reference, 💾 SAVE ALU (the
  Library opens it here) — with the prototype's tools on the left: **Edit
  (V)**, **Draw (P)**, **Seams (S)**, **Marks (M)**, Undo, Redo, Clear,
  and the ground, White · Paper. The tubes a strip by the Tools, as LOVE's
  paints: the prototype's seventeen, a name on hover, the number their ticks
  carry once they have marks and the marks under it; a click puts one in
  the chosen segment or takes it out, or, with Marks, is the next mark's
  paint. The panel: Where pipes cross (Wet on wet · Dry between pipes), INK,
  the view — **Design · 1 Trace · 2 Marks · 3 Drag · Result** — and ▶ Play
  the run; New composition · New colours (Paper test, 8 Oct gone since
  2026-10-10: "Remove Paper test. What 8 Oct? I do not need this key :)"); the pipes,
  bottom to top, and the chosen one's brush, inside or outside lane first,
  Reverse the way, marks by hand, Width, Corners, Largest corner radius,
  the fans, Bring up · Send down · Delete — or ⌫ (the owner, 2026-10-08:
  "the sausage could simply go with the delete key"); its segment's paints —
  on Whole lanes along the pipe, a mark right across in each, on Segments'
  Along across it; the brush, the marks, the simulation (est.); the canvas;
  the prototype's files. TRACE: every pipe's outline on its lanes 1 and n,
  DRAG's own lines, so the dry brush runs over the trace exactly (the owner,
  2026-10-10, `alu-result/`: "I brush first, do the trace, and think Drag
  will go along this outline, but it goes quite otherwise, inside the
  trace's outline … remove the slider and make a strict correspondence";
  before, the line's outer edge on the pipe's, TYPE's way, (Brush width −
  Line width) / 2 outside the lanes, no slider of its own); cut to the
  canvas, one whole on it a loop on 60 % over its start. MARKS: every dash, a dip every 4 marks
  (est.), **from lane 1 to lane n, no ticks** (the owner, 2026-10-11: "MARKS
  has the same trouble TRACE had — the strokes stick out a lot, they do not
  meet DRAG's way … the ticks turned out unnecessary; the lines are enough
  for me"; before, the pipe's edge less 0.5 mm, and TYPE's abacus). DRAG: every run a row — whole lanes n … 1, each the whole pipe, a
  landing and a lift each — the dry brush, no dip. 3 Drag numbers the lanes
  at their starts as the owner's page does. **The snake** (the owner,
  2026-10-10: "I need a run as a snake, back and forth, the brush going
  non-stop, without flying back to the start through the air. This one is
  needed too, but let there be a switch"; "STOP, HARD STOP — there is room
  to the right of them … shaped like INK on / off, so it is near the DRAG
  key; no words, just an icon as in iTunes, ↻, the loop, ON by default";
  "🔁, that is the icon I meant — maybe you can draw it yourself"): a
  switch right of STOP, under DRAG — the repeat icon drawn in the deck's
  lines, Off and On as INK's, the knob's dot orange, not INK's green — ON by
  default, kept with the save. **STOP without its dot, and no HARD STOP**
  on ALU and SMKN (the owner, the same evening: "remove the dots of • STOP
  and •• HARD STOP — they give you room for on / off as on INK … or let us
  remove HARD STOP altogether! I do not use it"); Esc is STOP still.
  **PAUSE on DRAG at a lane's end** (the owner, the same evening: "check
  PAUSE too; it must work while DRAG runs, so as not to use STOP, or
  everything starts over"; then: "simpler: the pause works only at the ends
  of a line — it comes on only when the brush stands at the start of the
  sausage or at its end"): DRAG's blocks go marked `pauseAtEnd`, and
  `rembrandt.py` never brakes one on its line: a pause asked on a lane waits
  for its end, lifts the brush there and holds; CONT. presses it and goes on.
  A snake goes as a block a lane, the brush down between them, cut where each
  lane ends (`stopsAt`), so it pauses at the pipe's end too. TRACE and MARKS
  pause on the line as before. ON, a
  pipe's lanes back and forth in one row, the brush down, a step across from
  a lane's end to the next one's start: across the pipe's flat end on the
  canvas, on the trace's line there; along the edge past the canvas where
  the lanes are cut (within 3 pitches, est.; farther, where a pipe leaves
  the canvas and comes back, it lifts). A pipe a landing. OFF, every lane
  one way, a lift after each, as before. Segments' Along follows the same
  switch, its two keys under the brush's sliders gone (*Claude's choice*).
  Run on the
  machine since 2026-10-10.
- **TAPE**, the first tab (2026-10-12, §1; `app/index.html`, `app/src/tape.js`,
  `app/src/tapeplan.js`; `TAPE-Claude/TAPE.md`): CCD's page — its board, the
  canvas from home with the cassette in its centre, PROGRESS, the zoom, the
  LCD — with the deck **TEST · PAUSE, TRACE · Snake · Air, STOP**. TRACE:
  the cassette's outline — its shell, round from 12 o'clock and on 60 %
  over its start — and the tape's guide, every run's centre line on the
  canvas, the very line DRAG runs, with the brush; with **INK** ON in
  watercolour from the cup, a dip, then lines on what the brush holds up to
  the dip run, as ALU's. The rest of the cassette drawn by hand with a
  stencil, faint on Trace. DRAG: the tape in one go, no stop — Snake one
  path of its strokes, the brush landing once, Air a path a stroke, the
  brush landing and lifting on the move; PAUSE where the tape passes the
  seam or at a turn. The panel: INK; the views **Trace · Drag ·
  Result**, ▶ Play the run (the prototype's, about 30 times as fast); the
  cassette, **Default · Load SVG…** (its transforms applied, its size from
  its width in mm or cm, else a real cassette's); Trace: **Cassette outline ·
  Tape guide**, Trace speed (40 mm/s, est.); Brush, DRAG: Brush = tape,
  Speed, Gap, Corners (Angle · Cassette · Round), **Lane change · Closed
  rings**, **Clockwise · Counter**; Adjustments: Cassette size, First lane,
  Lane change, Strokes, Edge overrun, **Round · Flat**, Flat
  angle; the canvas; the reading — the tape lane, the lanes, the seam, DRAG
  and TRACE with their times (est.), one ⚠ line a warning. The Result's
  ground and tape colours in the Tools; M and Clear the spokes over them;
  the owner's paints a strip by the Tools, a chip a paint, its name and
  where its colour was read on hover, its spokes counted under it; Paints
  in the panel, the spokes read. 💾 SAVE TAPE, the Library opening it
  here: an SVG centred on the canvas, its layers cassette (its SVG nested
  as it is), trace-cassette (its outline), trace-tape and drag-tape, lines
  and arcs.
- **ALU-CUT**, the first tab from 2026-10-11 to 10-12, `alucut.html` since (2026-10-11, §1; chat-Claude's task,
  `ALU-cut-Claude/README.md`, and `ALU-Claude/ALU.md`, its section): ALU's
  page and plan with cuts. Master Flo's one drag through every paint at once
  muddies where dark runs into white — Florian Markus's way, and Plot Bot
  Studio's, a clone at €225 — and the owner wants Belem Lett's clean
  palettes (the owner: "it may not be very Instagram-friendly… but this way
  we move away from Florian and his American clone"). **✂ Cut (C)** in the
  Tools under the pencil (the owner: "the scissors I would rather see in the
  Tools under the pencil; S is taken, but C — cut"; "A — it is simpler",
  chat-Claude agreeing; no switch on the deck): a click on a pipe puts a cut,
  the next part a family of paints of its own; on a seam it makes a cut, on
  a cut takes it away; with S a click on a cut makes it a seam again, to
  compare with Florian's one run. DRAG paints part by part, in the pipe's
  way, every part as the snake or one way, the pipe's lane numbers and order
  going on across a cut; every lane, and the snake's step across, half a
  brush clear of the cut's line, on a bend too. **A stop before every part
  but the first** — at each cut and before every next pipe ("if such a design
  is made at all, then yes — a good idea") — the brush up at the part's end
  right over the canvas ("I am careful; if it does not work, I will ask for
  it over home"), a pause block, the LCD: "Pipe 1, part 2 of 3: wipe or wash
  the brush, squeeze its paints, then Continue"; none after the last. MARKS
  one pass as before; **Marks from a cut**, 0 … 3 mm, 2 by default (est.;
  "a slider from 0 to 3 mm? If I go on when the paint has dried, neither 2
  nor 3 mm is needed"). Result: a clean brush every part, wet on wet; a part
  over another's wet paint, or another pipe's, picked up, and one ⚠ in the
  reading ("yes, OK!"). The DRAG confirm counts the stops; the time leaves
  them out. 3 Drag and the other views draw a cut solid with ❚❚ by it.
  **No New composition; New colours for the chosen segment** (the owner, the
  same day: "New composition — not needed at all; we remove it. New colours
  is needed, but it changes every colour … I would rather pick one segment
  and colour just it"): a click on a pipe chooses its segment, New colours
  picks its family again, the rest as they are. The orange guides over the
  Result too, but for Play the run; the views Design · Trace · Marks · Drag ·
  Result, no numbers ("only noise").
- **SMKN**, after ALU (2026-10-08, §1): ALU's page with the paints in stock
  (`app/smkn.html`, its body `data-tab="smkn"`; `aluplan.js`, SMKN_TUBES):
  the strip the fourteen tubes, light to dark — 116 Titanium White, 029
  Iridescent Silver, 250 Light Rose Ochre, 543 Cadmium Yellow Deep Hue, 640
  Saturn Orange, 208 Raw Sienna, 645 Chinese Orange, 613 Cadmium Red Light
  Hue, 686 Primary Red (Sennelier Abstract), Azo Pink (Pébéo), 921 Light
  Violet, 323 Cerulean Blue Hue, 070 Iridescent Black (Sennelier), 4982
  Ivory Black (Lukas) — a name and maker on hover; their colours est., the
  iridescent two drawn as their colour, no shine. New composition, New
  colours and New pipe in them; 💾 SAVE SMKN, the Library
  opens it here.
- **Test**, a tab between Job and Adjustments (2026-10-02): the test bench —
  a 30 × 30 board ("the ideal format for tests", the owner), black only;
  rows of hairpins drawn by the plotter, X and Y, lines and arcs: a line
  out, a half circle, a line back, the wrist lifting the brush with its
  hook; a pause after each row for paint. Pattern C, the snake (the owner,
  2026-10-02, `references/Screenshot 2026-10-02 snake.png`): one continuous
  line, row after row, a half circle at either end, the brush down from the
  first row to the last. Placed by "Here" (the brush over
  the board's centre); at 100 % the carriage goes home, to the corner where
  home is set, as a job does (the owner, 2026-10-02: the end seen "not only
  on the screen but in the real world"). The board's margins are a hint, not a limit ("too
  many limits — let it go past"); nor are the machine's walls since
  2026-10-03 ("remove this restriction", D1 2 mm past the bottom wall): the
  path is pressed into them as on the Job tab, what lies past one running
  along it, and the page says how many mm. It began as the arm-stroke bench "3DOF".
  Sliders for the rows, as on Calibration; the board's width and height two
  numbers. **💾 SAVE TEST** puts a test in the Library, on a second shelf
  under a line — paintings above, tests below — and the Library opens it
  on the Test tab (the owner, 2026-10-02).
  **The wrist on the board** (the owner, 2026-10-02, the 15-row snake in
  `test_results/`). At a turn the bristles flipped over: "+15° at the end
  of the right run, −15° at the end of the left one, so the bristles do not
  leave a fat mark and the brush is not spoilt"; upright again once the
  turn is done (**Wrist at a turn**, ±°). ±15° left the brush on the
  board; on Calibration it leaves at −45°, and the camera lets the wrist
  past to +45° — so the turns go at ±45°, in the air; the wrist goes to
  ±60° at most, a reserve ("the camera will take it"). Coming down from −54° the brush touches the board
  ~50 mm before the row (a ruler) and drags there; lifting, it drags as
  far the other way. The Test tab draws the brush's own trace by these two
  numbers (a tip ≈ 71 mm from the wrist's axis, est.): the drags, and a
  tilted stretch shifted along Y. A carriage standing 50 mm into the row
  was tried and dropped the same day: the drag runs along Y only, a bowed
  row starts at a slant, and the row bent off its arc and left a gap — the
  owner: "fix it as it was". Open.
  **On the move** (the owner, 2026-10-02): a pass is one move, no stop at
  a turn. Over the first and the last **Tail** mm of a row the elbow eases
  the brush from pressed (0°) to the lift-off (+15°) and back, on a half
  cosine — "the tail a smooth easing of the pressure"; through a turn it is
  up (+25°, est.). The elbow goes by place: the board turns it as the
  carriage reaches each piece (`W 2`). **Lift at the turns**, a tick: off,
  a snake's turns are painted too. (The same evening it was the wrist,
  tilting to ±45° with the carriage stepping aside — "(a) + (b)" — until the
  new arm made it the broom again.) Up to 250 mm/s. **No slivers to the board** (the owner, 2026-10-04: "of course, no need to send such noise to the board"): a piece under 0.05 mm, left by a tail's cut, is not sent — the firmware takes an arc ending where it starts for a full circle. No pause for paint
  every few rows ("let's not overthink it"); between D's passes the carriage
  stays where it is — "a break, not the end of the working day" — and goes
  home only at 100 %. Turn is hidden on C and D.
  **Its keys** (the owner, 2026-10-02): four in two rows — **PLAY** (dark
  grey) and **PAUSE**, one key with two states: down and dark, saying
  CONTINUE, whenever the run waits, by hand or for the paint between D's
  passes; then • STOP and •• HARD STOP.
  **Pattern D** (the owner, 2026-10-02, `references/IMG_9455.JPG`,
  `PATTERN-D1…3.jpg`, `PATTERN-D all.jpg`) is for the style of
  `nolan-images/Untitled-7.png` and `Untitled-8.png`, bands of strokes
  nested and pinched into one another (the owner, 2026-10-04: "Untitled-7
  is directly tied to Test, D1 / D2 / D3"; a 16 mm pinch is of that style,
  not NOLAN's). Three passes, each the snake
  of C — "keep the geometry of C", the sketches are rough on purpose — turned
  its own way: D1 rows upright and bowed to the left (nested Cs, orange),
  D2 down to the lower right (red), D3 up to the upper right (dark grey);
  *Claude's reading*: 90°, 50° and 120°. The sliders are shared by all
  three (the owner's choice); where each pass lies is its own — **X ↑ and
  Y →** for D1, D2 and D3, under the pattern keys (the owner: "the rows,
  the length, the bow and the wave go to all three; where they lie I want
  to change"), and **↻**, each pass turned ±90° more from its own angle,
  plus clockwise, a scale −90 · −45 · 0 · +45 · +90 under it. **D1 · D2 · D3** latch like Reference · Lanes
  · Drops: one, two or all three run, in their order, a pause between for
  the paint. **Wave** (all patterns): a row waves either side of its line or
  arc, 0 for none — "from a perfectly straight pass to waves"; laid as
  biarcs, the tangent continuous, about 100 mm a wave (est.).
  **INK** (the owner, 2026-10-03, `machine/IMAGE 2026-10-03 ink bow*.jpg`):
  a switch in a row of its own under the pattern keys, as Lift at the
  turns, green; named INK as the sliders are (Rows, Row to row), a gap
  under the keys, OFF left of the switch and ON right of it, on the
  name's line, the switch to the right (the owner, 2026-10-03). OFF: every test as it was ("then the tests need no
  rewriting"). ON: the brush takes its paint from the cup of the Ink tab.
  Before every row it goes there, the elbow over the rim, dips — down into
  the paint, 1 s, up — goes to the row, comes down to +25° in the air and
  lands on the move as always; after the row it goes back to the cup, "not
  up, back to the cup", and home at the end: D1 at 14 rows is 14 dips. C's
  and D's rows run one way each, as the snake's first row — top to bottom
  on D1; no turns, no pause for paint, the cup gives it; between D's passes
  the pause asks for the next paint in the cup. PLAY waits until the cup's
  centre is taken. The board draws the cup as the Ink tab's red scope, the
  brush's way in the air dashed, home, and during a run the carriage's
  trail ("so I follow the trajectory").
- **Ink**, a tab between Test and Adjustments (the owner, 2026-10-03: "maybe
  one more tab, INK"; "just INK, it is clear anyway"): where the brush takes
  its paint. One cup for now, ⌀50 and 20 mm high, by the left edge of the
  canvas — the first of the dip station (§1). Its centre is taken as Here
  on Test: the carriage jogged on Calibration until the brush, down in the
  cup, is over it, then **Here: the brush is over the cup's centre**. The
  elbow **over the rim** (+35°, est.) and **in the cup** (+5°, est.) until
  measured with Calibration's elbow handle; **in the paint** 1 s ("1
  second is perfect"). The machine from above, as on Calibration, with the
  cup, home and the Test board. Kept in `app/ink.json` through
  `rembrandt.py` (`/ink`). **The canvas from the cup** (the owner,
  2026-10-03: "I do not see where the centre of 500 × 700 is, there is no
  laser"; every point found by hand adds its own error): the cup is the one
  point found on the machine, and two ruler numbers place the canvas from
  its centre — its left edge so many mm to the right, its bottom edge so
  many mm down ("the bottom is easier"). With the board's size the Test tab
  finds the centre itself and uses it as Here ("a great solution, much
  handier"); its Here key stays only until the two numbers are typed. The
  jog of Calibration is on the tab, and the cup is drawn as a red scope to
  aim the brush at. Not Calibration, which
  is the machine's and never the paint's, and not Test: the cups will be
  many, each with its place, its height and its paint.
  **Since 2026-10-06 the Ink tab shows the canvas from home** in place of
  the canvas from the cup — the one base of TYPE, NOLAN and New Yuri, its
  four fields under Cup (§1); the Test tab keeps its own Here.
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
