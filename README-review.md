# Rembrandt: planning paintings for a brush machine

A request for an outside view, 2026-10-01. We want critical, concrete
feedback. If you think part of this is wrong, say so and say why.

## 1. What we ask you

Read this and answer in numbered points:

1. **The idea.** Does the method below make paintings that hold up as art,
   or does it make "plotter art"? What would push it towards the first?
2. **The painting method** (§5): home and tail, optical mixing, the layers.
   Will it work with real acrylic? Where will it fail first?
3. **Dosing** (§6): about 200 hand-squeezed "standard drops" per painting,
   placed under a machine pointer. Is there a better way within the
   constraints (§8)?
4. **Geometry** (§4): above the curve, the lines are vertical copies of it,
   so they overlap by up to 26–50 % on steep slopes. Accept that as texture,
   or do something else?
5. **What is missing**, and **what you would cut**.

Short and concrete beats long and general. Numbers welcome.

## 2. The intent

The artist is the author; the machine is his tool, like an airbrush. The
technology must not become the subject of the work. The goal is painting
that stands in the serious art world, not machine-made decoration. Every
decision — composition, palette, which tube goes where, the order of the
layers, what ornament the machine leaves — is the artist's. The software
turns those decisions into machine paths and a paint plan.

## 3. The machine

- **CNCDM-001**, self-built. A gantry on an aluminium frame, two belt axes
  (NEMA 17, TMC2209 drivers, ESP32 board). The brush can reach
  **568.5 × 865 mm**.
- **An arm on the carriage**: shoulder, elbow and wrist servos. During a
  job the shoulder and elbow hold one fixed pose; only X, Y and the wrist
  move.
- **The wrist lifts the brush by swinging it sideways** (to −54°), not
  straight up. A spring-loaded holder presses the tip onto the canvas. A
  USB camera sits on the bracket.
- **Own firmware**, no G-code. Paths are straight lines and circular arcs
  only (no Béziers), with no stop at smooth joints.
- **Brush**: round, about 10 mm (Raphael No. 4). **Paint**: acrylic with
  retarder (stays wet for hours).
- **The previous program, RUBENS**, turned one hand-drawn stroke into eight
  parallel brush lanes. Rembrandt plans a whole painting.

## 4. The first painting

- **The key image**: a white sheet curling over a warm glow — yellow, orange,
  red — on black. One curve separates the sheet above from the glow below.
  If the image is attached, it is IMG_9422.JPG.
- **Canvas 50 × 70 cm, laid on a 100 × 70 cm canvas.** The machine paints
  its whole reach (56.85 × 86.5 cm, almost the 2 : 3 of the image), so the
  paint runs past the small canvas on purpose: the edges stay loose.
- **One curve**, lines and arcs, drawn by the artist over the reference.
- **The lines**: 8 mm wide, 8 mm apart, covering the whole reach.
  - Below the curve: exact parallel offsets.
  - Above it: vertical copies of the curve. Offsets there would fold inside
    the dip; copies never fold and stay exact lines and arcs. On a 42° slope
    neighbours overlap by about 26 %, on 60° by 50 %.
- **Four layers in a fixed order**. Inside a layer the lighter tube runs
  first.

  | layer | where | tubes |
  |---|---|---|
  | 1 Light | below the curve | yellow, orange, red, crimson |
  | 2 Dark | below the curve | oxblood, dark red, maroon, black |
  | 3 Sheet | above the curve, over the dry layers 1–2 | white, cream, three greys |
  | 4 Black | the top, into the wet grey of layer 3 | black |

  The sheet's first line runs along the curve: that makes the edge sharp.
- **Estimates for this painting**, none measured yet: about 120 lines, 68 m
  of brush path, 29 minutes of machine time at 40 mm/s, about 195 drops,
  about 410 ml of paint.

## 5. The painting method

- **Paint per line, from the reference.** Every 4 mm along a line the
  program takes the nearest tube of that layer. What it missed by is carried
  to the next line at the same place, like dithering. So where the image
  lies between two tubes, neighbouring lines alternate: **optical mixing**.
  Runs shorter than 24 mm join a neighbour.
- **Home and tail** (untested):
  - Every run of one paint starts at its home with a full brush, runs
    towards its neighbour colour and thins out into a dry tail.
  - At the end of the tail the wrist lifts the brush, and it travels back
    to the home in the air for the next trip.
  - Colours meet tail to tail; a full brush never drags one colour into
    another. The point is to stop the mud: in the artist's experience a
    brush that runs on from yellow into wet black ends in grey.
  - The home is the end at the edge of the reach, or next to a darker paint.
    A run that reaches the edge does not thin: the brush goes out at full
    width.
- **The swing mark.** Lifting a wet brush sideways leaves a small hook
  across the neighbouring lines. In RUBENS this was a defect. Here it is
  kept as an ornament, repeated where the tails end.
- **Stage by stage, one tube at a time**: its drops, its runs, then the
  machine stops and the artist looks. "Again" re-runs the same trips;
  "Next" goes on to the next tube. The next tube's paint is not on the
  canvas yet, so nothing dries in the meantime.
- **The inventory is large**: two sets, 50 and 80 tubes (Pebeo, Liquitex).
  A gradient can be several real shades side by side instead of premixes.
- **Muddy pairs** (yellow + black gives olive) go into different layers and
  are kept 40 mm apart. A warning appears when they come closer. It is a
  hint, it never blocks.

## 6. Dosing: the standard drop

- **Paint goes on by hand from squeeze bottles**, as drops across the
  lines, before the brush runs.
- **A standard drop**: a 6 mm nozzle, a bead 100 mm long, so a fixed volume
  (about 2.1 ml, est.). The amount is set by the number of drops, never by
  squeezing harder.
- **Calibration**: weigh 10 drops on a 0.01 g scale. The camera measures
  how far one drop travels under the brush (the smear length, which is the
  tail).
- **Placement**: a drop lies across the lines at their home and feeds up to
  12 neighbouring lines. A run that needs more paint gets more drops spaced
  along it. Drops go one tube at a time, the lighter first.
- **The machine is the pointer**: the lifted brush hovers over the start of
  the next drop, then moves along its 100 mm slowly while the artist
  squeezes behind it. A foot pedal advances to the next drop.
- **Open problem: the hover pose.** Upright, the spring holder touches the
  canvas; the brush-off pose swings the tip far aside. We need a wrist
  angle where the tip clears the canvas by about 5 mm, with the sideways
  shift compensated in X/Y. Fallback: a laser dot on the bracket.
- **Paint volume**: length × 8 mm × 0.30 mm film × 1.25 (what the brush
  keeps), all est.

## 7. The software

A browser app on the Mac with a small Python server that owns the machine's
USB link. It has five tabs:

- **Create**: the reference, the curve, the four layers, the lines and the
  drops. Every number on it can be edited.
- **Job**: runs a layer on the machine.
- **Adjustments**: the paints, their measured behaviour, and a layered
  layout made by another AI model without our spec, for a fresh look.
- **Calibration**: the machine settings.
- **Library**: saved paintings.

Every number not yet measured is marked "est.".

## 8. Constraints already decided

Please do not propose these again:

- Paths are lines and arcs only. No projector, and no outlines drawn by the
  machine: a pencil in the spring holder drifts from run to run.
- No drying timers. No brush-washing station: several brushes sit on a
  quick-swap mount.
- The arm holds one pose during a job, so one pose covers 56.85 cm across.
  A wider frame (2000 × 1220 mm) is the plan if the first paintings sell.
- Paint is dosed by hand with standard drops; the machine only points.
- Muddy pairs are hinted, never blocked. No traffic lights.

## 9. Later

These are ideas, not decided:

- A spiral texture.
- Lanes that follow a direction field read from the reference.
- Spectral line bundles (dispersion by Cauchy's law, seeded).
- A dip station for the brush.
- Turning a flat brush by moving the arm while the gantry holds the tip
  still.
- Closed-loop correction from the camera.
- **Finish**: gloss gel medium, then gloss varnish or an epoxy layer over
  the relief.
