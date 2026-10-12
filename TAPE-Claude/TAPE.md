# TAPE — new Rembrandt tab

Status: **approved prototype v0.3, 12 Oct 2026.** This file is the spec. `reference/TAPE-prototype.html` is the working prototype the numbers and pictures below come from. Port the behaviour, not the code: follow Rembrandt's own structure and the conventions of the existing tab specs (TYPE.md, NOLAN.md, ALU.md, SOUMKINE.md).

## What it is for

A small square canvas for the Soumkine Etsy line. In the centre, a compact cassette at real size, painted by hand. Around it, the cassette's tape, painted by the machine with the brush: lanes of tape wound around the cassette, touching each other like Florian Markus's lanes, running off the canvas edges.

Order on the table:

1. **Trace** (pencil): the machine draws the cassette outline and, optionally, a centre-line guide of the tape.
2. **Drag** (brush): the machine paints the tape, segment by segment. Before each segment the machine pauses so Yury can squeeze the paint for it.
3. **By hand, last**: Yury colours the cassette like a colouring book. The cassette paint covers the start of the tape, which comes out from under the cassette edge.

There is **no Marks pass** in this tab. Do not add one.

## Glossary

| Term | Meaning |
|---|---|
| Lane | One loop of tape around the cassette, one brush wide. Lane 1 is the one touching the cassette. |
| Pitch | Distance between neighbouring lane centre lines = brush + gap. With gap 0 the lanes touch. |
| Seam | The place where the tape moves out to the next lane: the middle of the right side. |
| Lane change | The stretch, starting at the seam, over which the tape drifts out by one pitch. Its length is set in brush widths. When it is longer than lane 1 it covers the whole turn and the tape becomes one continuous spiral with no visible seam. |
| Closed rings | Alternative seam mode: each lane closes on itself and the brush lifts to the next lane. |
| Run | A continuous piece of tape on the canvas, between two edge crossings (or path start/end). |
| Segment | Part of a run painted from one squeeze of paint. One paint stop per segment. |
| Paint stop | Machine pauses at a segment start so Yury squeezes paint there. |
| Overrun | How far the brush carries on past the canvas edge before lifting, so the tape runs cleanly off the edge. |
| u | Position along a lane, 0…9 (see Geometry). Same u on two lanes = same spot across the tape. |

## Controls

All lengths in mm. English UI. Defaults are what Yury approved.

**Format**: square canvases 20 / 30 / 40 / 50 / 60 cm. Default **20 × 20**. The cassette is always centred, for every format.

**Cassette**
- Default cassette: `assets/cassette_trace.svg` (real shell, 100.4 × 63.8 mm, Inkscape layers: 01 корпус, 02 этикетка, 03 окно, 04 бобины, 05 головка и отверстия, 06 винты).
- Load SVG… replaces it for this job. "Default" restores the built-in one.

**Trace · pencil**
- Cassette outline — on by default.
- Tape guide (centre line of every run) — on by default.

**Drag · brush**

| Control | Range | Default |
|---|---|---|
| Mode | Snake / One way | Snake |
| Brush = tape (mm) | 2–20, step 0.5 | 4 (real tape is 3.81) |
| Speed (mm/s) | 5–80 | 25 |
| Gap (mm) | 0–10, step 0.5 | 0 (lanes touching) |
| Corners | −50 … +50, labels Angle · Cassette · Round | 0 |
| Seam | Lane change / Closed rings | Lane change |
| Direction | Clockwise / Counter | Clockwise |

**Adjustments**

| Control | Range | Default |
|---|---|---|
| Cassette size (%) | 80–130 | 100 (= real size) |
| First lane (mm), gap between cassette and lane 1 | 0–10, step 0.5 | 0 |
| Lane change (× brush) | 4–120 | **48** (192 mm with a 4 mm brush) |
| Segment (mm), tape per squeeze | 40–400, step 10 | 180 |
| Strokes per segment | 1–6 | 3 |
| Edge overrun (mm) | 0–15 | 4 |
| Brush type | Round / Flat | Round |
| Flat angle (°), only for Flat | 0–90, step 5 | 45 |

Preview-only colours: ground `#efe9de`, tape `#3a2a1f`.

## Geometry

Coordinates in this spec: mm, origin at the canvas centre, x right, **y down**. Convert to Rembrandt's canvas coordinates at the end (Calibrate). H = format / 2.

### Cassette box

- Physical width = the SVG's `width` when given in mm or cm, otherwise 100.4 mm. Multiply by Cassette size %.
- Height from the viewBox aspect.
- Centred on the canvas.
- Shell corner radius r_c = 1.8 mm × (width / 100.4). This is the corner radius of `body-1` in the default SVG.

### Lanes

Every lane is a rounded rectangle whose four corner arcs share one centre. This is what keeps lane k+1 exactly one pitch outside lane k all the way round, corners included.

```
w  = brush, p = w + gap, c = first-lane gap, v = corners (−50…+50)
μ  = v < 0 ? (v + 50) / 50 : 1          // −50 sharp (mitred) … 0 true offset of the cassette outline
λ  = v > 0 ? v / 50 : 0                 // 0 … +50 lanes turn into circles
ex = cw/2 − r_c,  ey = ch/2 − r_c       // cassette corner-arc centre
cx = ex·(1 − λ),  cy = ey·(1 − λ)       // shared corner centre of all lanes
R0 = λ·hypot(ex, ey) + r_c + c + w/2

lane k (k = 0 is lane 1 in the UI):
  R_k = R0 + k·p
  a_k = cx + R_k      (half width of the centre line)
  b_k = cy + R_k      (half height)
  r_k = max(0, μ·R_k) (corner radius)
```

At corners = 0 every lane is a true offset of the cassette outline, so lane 1 hugs the cassette's own rounded corner. That is what Yury marked on the sketch.

### Position along a lane: u

A lane is cut into 9 pieces. Start at the seam (middle of the right side) and run clockwise on screen.

With sa = a − r, sb = b − r and q = πr/2, the pieces are:

| u | Piece | Length |
|---|---|---|
| 0 | right side, lower half | sb |
| 1 | bottom-right corner | q |
| 2 | bottom | 2·sa |
| 3 | bottom-left corner | q |
| 4 | left | 2·sb |
| 5 | top-left corner | q |
| 6 | top | 2·sa |
| 7 | top-right corner | q |
| 8 | right side, upper half | sb |

u = piece index + fraction (0…9). Straight pieces go linearly; corner pieces go by angle. The exact point formulas are in `rrU()` in the prototype.

Sampling: about every `max(0.6, format/500)` mm, and always on the piece ends. That keeps mitred corners exactly sharp.

### Lane change (Seam = Lane change)

```
Lb   = min(laneChange × w, P_0)       // P_0 = perimeter of lane 1
U    = u at arc length Lb on lane 1   // U = 9 when Lb = P_0 → continuous spiral, no seam
f(u) = smoothstep( L_0(u) / Lb )      // L_0(u) = arc length on lane 1 at u; smoothstep(x) = x²(3 − 2x)
```

**The same f(u) is used for every lane.** That is the whole trick: neighbours drift out together, so they never bunch or open a gap.

- **Band k → k+1**: for u from 0 to U, point = lerp(lane_k(u), lane_{k+1}(u), f(u)).
- **Lead-in**: the tape comes out from under the cassette using the same lane change.
  - If r_0 > 0: point = lane_0(u) pushed inward along its own normal by p·(1 − f(u)). With tangent (tx, ty), that is (x − ty·o, y + tx·o), where o = p·(1 − f). This keeps the cassette's rounded corners. Blending with a "lane 0" instead gives it a negative radius and leaves a light sliver at the cassette corners.
  - If r_0 = 0 (corners −50): blend with lane −1 (R0 − p), which is also sharp.

Path order:

1. Lead-in.
2. For k = 0, 1, 2, …:
   - arc on lane k from u = U to 9 (skip this when U = 9);
   - band k → k+1.
3. Stop before lane k when it no longer touches the canvas. The test: the rounded rectangle (a_k − w/2, b_k − w/2, r_k − w/2) contains the canvas corner (H, H).

### Closed rings (Seam = Closed rings)

Each lane is its own path, from u = 0 to 9. It ends where it began, at the middle of the right side. The brush lifts between lanes. Same stop test as above.

### Direction

Counter-clockwise = mirror y. The seam stays on the right.

### On the canvas, runs, overrun

- A sample counts as on the canvas while any part of the lane width still touches it: max(|x|, |y|) ≤ H + w/2 − 0.2.
- Runs are maximal stretches on the canvas inside one path.
- Every run end that meets an edge is extended along the path by overrun + one sample. The brush carries on off the edge, then lifts.
- Path starts and the ends of closed rings are not extended.

### Segments

- Split each run into n = max(1, ceil(L / segment − 0.15)) equal lengths.
- Short corner pieces of a run still get their own segment. The readout warns when any are under 12 mm.

### Moves for each segment

1. If not already there: lift, travel through the air to the segment start, lower.
2. **Paint stop** "squeeze #n" at the segment start.
3. Strokes:
   - **Snake**: forward, back, forward… (Strokes count) without lifting.
   - **One way**: forward on the canvas, then lift, go straight back to the start through the air, lower; repeat.

Time estimate constants used in the readout:
- air travel 80 mm/s;
- lift + lower 0.8 s;
- pencil trace 40 mm/s;
- paint stops are counted, not timed.

### Trace layers

- **Cassette**: the SVG paths, scaled and centred.
- **Tape guide**: centre line of each run's on-canvas part, without overrun.

Both are drawn with the pencil. Use the repo's existing tool-change / pause flow between Trace and Drag. If there is none, add a manual pause: "Swap pencil → brush".

### Brush type

Round is the honest default. Flat has no rotation servo, so the painted width depends on direction: width = max(1.6, w·|sin(direction − angle)|). At 45° the four sides match but the corners vary. Show this in the preview only and keep the ⚠️ hint. Do not add hardware for it.

## Readouts

Show these lines, as in the prototype:
- cassette size;
- tape lane (brush vs real tape 3.81 mm, pitch, "lanes touching");
- lanes to the side edges / to top-bottom / to fill the corners;
- seam (where, length, % of lane 1, or "continuous spiral");
- segments × strokes and mode;
- paint / air metres and lifts;
- machine time + number of paint stops;
- trace time.

Warnings are **one soft ⚠️ line each**, never a traffic light:
- the cassette does not fit the format;
- corner pieces under 12 mm, each needing its own paint stop;
- flat brush changes width with direction.

## Views

- **Preview**: painted look, with bristle grooves and lane-edge ridges. Lanes beyond the canvas show as a faint ghost. The cassette body is filled light, the cassette lines in ink.
- **Path**: segment centre lines in alternating colours, numbered paint stops, dashed air moves. One-way returns are faint.
- **Trace**: pencil lines only.
- **Play**: animates the brush through the moves at about 25–35× speed and shows the clock, segment and state.

## Export

SVG in mm, viewBox −H … H, with these groups:

- `<metadata>`: all params as JSON.
- `rect#canvas`.
- `g#trace-cassette`: the cassette SVG nested as-is, Inkscape layers kept.
- `g#trace-tape`: one `path#guide-n` per run.
- `g#drag-tape`: one `path#seg-###` per segment. Attributes: `data-mode`, `data-strokes`, `data-brush-mm`, `data-speed-mm-s`.

`reference/tape_20x20_snake_default.svg` is the prototype's export at default settings. The machine job itself goes through Rembrandt's existing Job pipeline, not through this SVG.

## Acceptance checks

Default settings: 20 × 20, brush 4, gap 0, corners 0, Lane change ×48, Snake, 3 strokes, segment 180, overrun 4, cassette 100%. Results should match `reference/acceptance.json` to within rounding.

| Case | Lanes total / to sides / to top-bottom | Segments | Paint m | Machine min |
|---|---|---|---|---|
| Default | 22 / 12 / 17 | 72 | 27.1 | 19.8 |
| Closed rings | 22 / 12 / 17 | 76 | 26.7 | 19.7 |
| Corners −50 | 18 / 12 / 17 | 56 | 26.5 | 18.7 |
| Corners +50 | 21 / 10 / 10 | 72 | 24.2 | 18.1 |
| Lane change ×120 (continuous spiral) | 22 / 12 / 17 | 71 | 27.4 | 20.0 |
| Gap 3 | 13 / 7 / 10 | 42 | 16.0 | 11.7 |
| One way | 22 / 12 / 17 | 72 | 27.1 | 24.8 |
| 30 × 30, brush 5 | 32 / 19 / 23 | 123 | 53.2 | 38.8 |

Other values for the default case:
- lane 1 R0 = 3.8 mm;
- lane 1 perimeter 337.9 mm;
- lane change 192 mm.

Visual checks against `reference/renders/`:
- no seam visible at ×48;
- lane 1 follows the cassette's rounded corners with no light sliver;
- lanes touch everywhere with gap 0;
- tape runs cleanly off all four edges.

## Not in scope

- Marks pass.
- Paint dosing per segment (Yury squeezes by hand at each paint stop).
- Brush rotation.
- Colour planning (one tape colour per job).
- Illustrator: everything is drawn inside Rembrandt; the cassette SVG is an asset Yury supplies.
