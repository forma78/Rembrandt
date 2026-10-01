# REMBRANDT

Spec v0.1 · 2026-10-01 · owner: Yury Melnikau (Melnicomm) · machine: CNCDM-001

Rembrandt is the successor of RUBENS. RUBENS turns one hand-drawn stroke into
eight brush lanes. Rembrandt plans a whole painting: which tube, how much of
it, where, and in which layer — so that the machine and the owner's hand
together paint the picture.

The name: Rembrandt built light out of darkness. Here too: light against a
dark surround, the darks left to the hand.

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
| **Reference** | An image attached on the Create tab. Shown under the canvas, traced, sampled for colours. Never painted as is. |
| **Curve** | The one master path of a painting. Lines and arcs only. Every band is built from it. |
| **Band** | The part of a layer on one side of the curve, N lanes wide. |
| **Upper line** | A calm curve that a band on the concave side blends towards, so its lanes never fold (§3). |
| **Lane** | One brush width along a band, 20 mm by default. Same word as in RUBENS. |
| **Trip** | One run of the brush along a lane. A lane is painted in 2, 4 or 8 trips (RUBENS Job tab). In Rembrandt a trip runs one way, from a home to its tail; the brush lifts there and goes back in the air. |
| **Layer** | Everything painted in one session over the dry layer below it: a band, its tubes, its drops. Not "pass" — in RUBENS a pass is a brush run inside a lane. |
| **Hand layer** | A layer the owner paints by hand (the black). Rembrandt only shows where. |
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
- **Dosing by hand with standard drops**, the machine as the pointer.
  (2026-10-01)
- **Layers in a fixed order**: light first, on the white ground (yellow dies
  on black); the sheet over the dry light; black last, by hand. (2026-10-01)
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
2. Build the layers from the curve: Light (below), Sheet (above), Black (hand).
3. For each machine layer: lanes, trips, tubes, the drop plan, ml per tube.
4. Check muddy pairs against the keep-out.
5. Job: pointer mode for the drops, then Do Job for the lanes.

Everything else is in §11 (later).

---

## 3. Geometry

- **Curve**: lines and arcs, inner corner radius from RUBENS (10 mm by
  default), clipped to the canvas and to the reach from Calibration.
- **Band on the convex side**: exact offsets of the curve, lane pitch = lane
  width, no gaps.
- **Band on the concave side**: plain offsets fold once the band is wider than
  the curve's radius there. Instead, lane *k* of *N* blends from the curve to
  the upper line at the same curve parameter:
  `P_k(t) = C(t) + (k/N) · (U(t) − C(t))`. Lanes then widen (for example
  20–24 mm); the trips spread across a wider lane as in RUBENS (lane width /
  trips apart).
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
- **The colour preview** of a layer uses the tail model of
  `previous_research/rembrandt_spiral_passes_simulation.html` (`sim`): every
  mm the brush lays part of what it carries and the rest fades over the tail
  length; colours mix by RUBENS `pigmentMix`. *Claude's decision.*
- **Order**: one tube at a time, light to dark; within a tube, nearest
  neighbour from the last drop.
- Every ml stays **est.** until Adjustments has weighed that tube.

---

## 6. Pair check

- Each tube's footprint = its drops + smear length along their lanes.
- For every muddy pair, and for every tube against the hand-black zone, the
  closest distance is measured.
- Closer than the keep-out → ⚠ on the canvas at the closest point, and a row
  in the Pairs section. The job still runs.
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

---

## 8. UI

The reference is `design/create-tab.html` (five screens). The top bar: the
tabs **Create · Job · Adjustments · Calibration · Library**; toggles
**Reference · Lanes · Drops · Reach · Grid**; Import SVG, Export PNG, and the
green **Open Job**. Tools on the left as in RUBENS: Pen (P), Arc (A),
Select (V), Undo, Redo, Delete. Status bar at the bottom, in mono.

1. **Create — reference and curve.** Reference under the canvas at 45 %,
   Replace and an opacity slider; Trace curve, Sample colours. Panel: Curve
   (segments, length, inner corner radius), Layers (three rows, fixed order),
   Tubes in use.
2. **Create — layer 1, light.** Lanes below the curve and the drop plan.
   Panel: side of the curve (Below | Above), lanes, trips per lane (2 | 4 | 8),
   ground; Drops: film, brush keeps, nozzle, drop size, a row per tube
   (drops, ml), the total, the est. note.
3. **Create — layer 2, sheet.** Layer 1 shown dry, in colour. Blended lanes
   above the curve, the curve highlighted as lane 1. Drops: white left, grey
   right.
4. **Create — layer 3, black by hand.** Hatched where the black goes, arrows
   from the edges inward. Pairs: the ⚠ row (black next to yellow, keep-out,
   the measured distance), the intended row (black into red).
5. **Job — squeeze the drops.** An LCD counter (`05 / 19`), the current tube
   and drop, **Next drop** (Space or a USB foot pedal that sends Space),
   Back, Skip; the bottles in order with progress; Do Job unlocks after the
   last drop.

**Pointer mode** (Job): the brush hovers over the start of the drop, then
moves along its length slowly while the owner squeezes behind it.

**Open question — the hover pose.** Upright, the spring holder touches the
canvas; brush off (−54°) swings the tip aside. Find on the Calibration tab a
wrist angle where the tip clears the canvas by about 5 mm, and compensate the
tip's sideways offset in X/Y. Fallback: a laser dot on the bracket.

---

## 9. The first painting — the sheet

Canvas 50 × 70 cm, portrait, white ground, laid on the 100 × 70 one. The
reference covers the whole image area (§0), the canvas is a window in it.
One curve; a white sheet over a warm glow; black around.

| layer | how | lanes | tubes and drops | ml |
|---|---|---|---|---|
| 1 Light | machine, below the curve | 13 × 20 mm, 4 trips | Yellow × 3, Orange × 5, Red × 11 = 19 | ≈ 40 est. |
| 2 Sheet | machine, above the curve, blended to the upper line | 15 × 20–24 mm, 4 trips | White × 13 (left), Grey N5 × 8 (right) = 21 | ≈ 44 est. |
| 3 Black | by hand, edges inward | — | Black, into the red and the top of the sheet | as needed |

- Yellow lies next to the curve on the right, orange behind it, red outermost
  and on the left. Yellow needs the white ground under it.
- The top of the sheet is left for the black.
- Keep-out yellow ↔ black: 40 mm; the planned distance is 160 mm.
- Machine time ≈ 20 min per layer (13 lanes × 4 trips at 40 mm/s, est.).
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
   owner's idea, 2026-10-01).
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
- **Dip station**: cups with paint level flush with the canvas, a wire to
  wipe on, water, a sponge.
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
