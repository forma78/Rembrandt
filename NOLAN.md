# NOLAN.md

Task for Claude in VS Code: the **NOLAN** tab in Rembrandt — named after
Christopher Nolan, who shot *Interstellar* (the owner, 2026-10-03). The
tab paints ribbons: a **ribbon** is the object, **NOLAN** the tab.
Written 2026-10-03 in chat with the owner, after reading the repo at `be04058`;
corrected with him in VS Code on 2026-10-04.
The layout of the modes was tried on a phone-sized prototype on 2026-10-03.

Read `README.md` and `Rembrandt.md` (glossary first) before this file, as
`CLAUDE.md` says. The working rules of `README.md` apply: English, `est.` on
every unmeasured number, no drying timers, small commits with a CHANGELOG
line, **ask before changing anything that moves the machine** (Job,
`rembrandt.py`, the firmware contract). Where this file and the code built
since disagree, say so first and do not guess.

A bare "§" below is a section of this file; a section of the spec is
written "Rembrandt.md §".

---

## The pictures — `nolan-images/`

- **`IMG_9424.jpg` is what NOLAN is made for**: a glowing render of
  ribbons on black, each ribbon a bundle of fine parallel strokes. Not the
  owner's picture; it is in git because the repo is private (the owner,
  2026-10-04). A copy is in `references/`.
- **`IMG_9424-N1_N2_N3_paths.webp`**: the owner's three paths over it,
  drawn by finger, every square or triangle an anchor. Three ribbons for
  now; N4, N5 later — "keep it in mind" (the owner, 2026-10-04).
- **`Untitled-2` … `Untitled-5`**: the owner's tries, with an AI, at
  imitating the result.
- **`Untitled-7.png`, `Untitled-8.png`**: the other style — bands of
  strokes nested and pinched into one another. That style is the Test
  tab's, its pattern D (D1 · D2 · D3), not NOLAN's (the owner, 2026-10-04:
  "Untitled-7 is directly tied to Test, D1 / D2 / D3"). A 16 mm pinch
  belongs there, not here.
- `references/images*.jpeg`: more ribbon pictures, for the look.

---

## 0. Owner decisions — record them first

One commit to `Rembrandt.md`, before any code. Dates and his words, in English.

1. **The ribbon collection** comes first: ordinary canvas, Florian Markus's
   way, on a black background. The reference is the glowing ribbon render
   (`nolan-images/IMG_9424.jpg`); the owner changes its geometry and
   colours ("I just need to change the colours and the geometry"). A
   reference is never painted as is (Rembrandt.md §0).
2. **NOLAN is the one tab where "the machine paints everything" does not
   hold.** The machine paints the ribbons on the white ground; the owner
   paints the black around them by hand at the end, the dark glazes, and the
   glow with an airbrush. The owner: "Who said the machine has to do
   everything?" and "I am not Florian, not an architect — I am not afraid to
   move a brush over the canvas." Write it into Rembrandt.md §0 *Hand
   layer* and §1 *The machine paints everything* as an exception that
   names NOLAN: the rule stands on Test and everywhere else. Its
   exceptions belong to NOLAN alone; nothing of them leaks into the other
   tabs.
3. **Glazes in glazing medium, not water** (the owner agreed): water-thinned
   acrylic loses its binder and goes patchy; the medium keeps the lines
   showing through the shadow.
4. **Create is hidden, NOLAN takes its place** (the owner, 2026-10-04: "I
   would hide Create for now. It just isn't working — a pile-up of
   colours"). The top row: REMBRANDT, its version **v0.2** right after the
   name, then NOLAN · Job · Test · Ink · Adjustments · Calibration ·
   Library. Create's page stays; the Library still opens a painting on it.

---

## 1. New terms for the glossary

| term | meaning |
|---|---|
| **NOLAN** | The tab that paints ribbons (this file), in Create's place. The only tab where the hand works too (§0). |
| **Ribbon** | One traced band of the reference: a centre path (lines and arcs, Create's tools), a width as a count of lines — the same along the whole ribbon — and its lines, each with its tube. A painting has several. |
| **Bundle** | The lines of one ribbon, running along its centre path. Every ribbon is its own bundle; there is no grid over the whole canvas. |
| **N1, N2, N3** | The ribbons by their painting order; N4, N5 later. Each is a layer of its own. Named N so as not to be taken for the D passes of the Test tab (the owner, 2026-10-04). |
| **Geometry** (NOLAN mode) | Black and white: white canvas, dark lines, the centre dashed, the anchors as squares to drag. No colour. |
| **Palette** (NOLAN mode) | The preview: the lines in their tubes, anchors hidden; **Black ground** and **Hand** live here (the owner, 2026-10-04). |
| **Watercolour run** | NOLAN's first run of a layer, what used to be the pencil: the brush dips in a thin wash from the Ink cup and traces the ribbon, so the owner sees where to squeeze the paint. |
| **Paint run** | NOLAN's main run: the paint squeezed onto the canvas by hand, the brush drags it along the lines. No cup. |
| **One way · Snake** | The two ways of the Paint run: each line top to bottom with the return in the air; or down, a turn in the air, up the next line on the canvas. |
| **Dip run** | The length one dip in the cup paints along a line before the brush goes back for more (Watercolour run only). est. until Adjustments measures it. |

---

## 2. What the owner does on the tab

**NOLAN** sits in the top row where Create was (§0.4), same two rows, same
Braun look, same left tools (Pen, Arc, Select…). Keep it this simple.

**Two modes, one switch in the second row: Geometry | Palette** (the owner,
2026-10-03: "geometry is better built in black and white — drag the
squares, play with the form; colour is for the preview: how the colour will
lie and which paints are needed").

- **Geometry**: white canvas — the owner: "on white the geometry is easier"
  — every line dark grey, a narrow groove between neighbours so the 8 mm
  lines read one by one, the centre dashed orange, the anchors as squares;
  the picked anchor filled orange. All shape editing happens here.
- **Palette**: the same lines in their tubes; anchors hidden, nothing to
  drag. Two toggles here only: **Black ground** (everything outside the
  ribbons black, as after his hand) and **Hand** (phase 2, §6: the G and A
  zones).

The reference sits under both modes, as on Create. The steps:

1. **📎 Add new reference**, at 45 %, opacity slider — as on Create.
2. **Draw a ribbon**: its centre with Pen and Arc, as the curve on Create.
   The owner's paths (`nolan-images/IMG_9424-N1_N2_N3_paths.webp`): three
   ribbons of 4–5 anchors — the upper arc, the middle one running to the
   left loop, the lower loop. Every square or triangle on it is an anchor,
   drawn by finger the Illustrator way (the owner, 2026-10-03).
3. **Per ribbon** (Geometry): **Width**, one for the whole ribbon (the
   owner, 2026-10-04), stepping by 8 mm — one line at a time; the readout
   says both (`96 mm · 12 lines`).
4. **Colours**: **Sample** fills every line of the ribbon with a tube from
   the reference (§4); a click on a line changes its tube from *Tubes in
   use*.
5. **N1, N2, N3**: the ribbons are named by painting order and each is a
   layer (the owner, 2026-10-03: "three arcs as three layers"). N1 is the
   upper arc, N2 the lower loop, N3 the middle ribbon lying on top of both.
   Dragging a ribbon in the list renames them in the new order. Their keys
   latch as D1 · D2 · D3 on Test (the owner, 2026-10-04): one, two or all,
   run in their order, **a pause between passes**. The owner presses
   CONTINUE: in the Paint run once the layer below is dry, in the
   Watercolour run at once. No timers.
6. **Preview** in Palette (above).
7. **💾 SAVE**, as on Create. The run starts from the tab itself, as on
   Test (§5).

---

## 3. Geometry

- **Bundles, not a grid** (the owner, 2026-10-03: "bundles, in
  principle"). Each ribbon's lines run along its own centre path, so the
  brush follows the thread of the ribbon as in the reference.
- **Lines** as in v0.1: 8 mm wide, 8 mm apart (Rembrandt.md §3), each **one
  stroke, one way** (the owner, 2026-10-04: "an 8 mm stroke one way, for
  IMG_9424"). **N lines from one end of the ribbon to the other**; no
  taper, no pinch, no twist — those are Untitled-7's style, the Test
  tab's. Line k is the offset of the centre by `(k − (N − 1) / 2) · 8 mm`
  — exact lines and arcs, through `offsetSegs` of `fillet.js`; do not
  write a second offsetter. est. as everything in §3.
- **The ends of a line** land and lift on the move, the elbow easing the
  pressure as in Test's *Tail* — the new arm's tail, no flags.
- **Where geometry fails** — a line folds where the centre bends tighter
  than half the ribbon — a red "!" at the place, as Create marks a rounding
  that does not fit; the owner opens the bend or narrows the ribbon.
  (`offsetSegs` itself cuts a fold into a sharp point; the "!" says it
  happened.) The blend of Rembrandt.md §3 stays the alternative if folds
  get in the way.
- **Past the walls** — pressed into them as on Job and Test; the page says
  by how many mm.

---

## 4. Colour

- **Sample** uses `paintLanes` of `bands.js` along every line of the
  ribbon: read every 4 mm, nearest tube of the inventory (OKLab), what it
  missed by goes to the next line — optical mixing, as on Create.
- **One tube per line** in v1 — the tube most of the line took. *Claude's
  decision, to confirm* (§8).
- **Within a ribbon the lighter tube runs first** (Rembrandt.md §1).
- **Muddy pairs**: neighbouring lines of one ribbon are wet together. A
  muddy pair side by side gets one **⚠** between them — a hint, never a
  block; an *intended* pair shows none (Rembrandt.md §6). In the reference
  the orange and the blue are nearly always parted by a pearl-white line:
  the owner may want the same.

---

## 5. Two runs: Watercolour, then Paint

Every layer (N1, N2, N3) is painted in two runs, Watercolour first, then
Paint (the owner, 2026-10-03; the watercolour canon of Rembrandt.md §1,
which replaced the pencil). A switch **WATERCOLOUR · PAINT** sits under the
N keys, as INK sits on Test; the owner picks the run and the layers, then
PLAY. The keys and PROGRESS as on Test: PLAY, PAUSE / CONTINUE, • STOP,
•• HARD STOP.

The Watercolour run only lays in the form, so **all three ribbons are
traced together, first**, before any paint (the owner, 2026-10-04: "if the
watercolour goes first, the machine just lays in the form, dipping in the
paint, for the preliminary trace — all three layers can safely run
together"). Then the Paint runs, layer by layer, CONTINUE when the one
below is dry.

### 5.1 Watercolour — the trace

What used to be the pencil: the brush dips in acrylic thinned with water to
a transparent wash and traces the ribbon on the white canvas, so the owner
sees exactly where to squeeze the paint.

- **The paint comes from the Ink cup**, as Test with INK ON: a dip before a
  run, back to the cup after it, home at the end.
- **One way per line, home → tail** (Rembrandt.md §1), the elbow landing
  and lifting on the move.
- **Which lines it traces**: **Edges** (the two outer lines of the ribbon)
  or **All lines** — a switch, Edges by default. *Claude's decision, to
  confirm* (§8).
- **Long lines**: a line longer than the dip run is split into runs; each
  starts with a fresh dip and lands where the last one's tail began.
  Neighbouring lines split half a dip run apart, so the tails never line up.
  *Claude's decision.*
- **One cup, one wash** for the whole trace; a pause for another wash only
  if the owner gives lines different ones.
- Water is right here: the trace lies under the acrylic. Glazing medium is
  for the hand glazes over the dry paint (§0.3, §6).

### 5.2 Paint — the main run

The owner squeezes the paint onto the canvas by eye, on the trace, as
Florian Markus does; **no cup in this run**. The machine drags the brush
through it along the lines, tube by tube, light to dark (Rembrandt.md §1),
a pause between tubes for the next paint. Two ways, a switch **ONE WAY ·
SNAKE**:

- **ONE WAY**: every line top to bottom — from the ribbon's first anchor to
  its last — on the canvas; at the end the brush lifts and goes back to the
  top in the air for the next line. Home and tail of Rembrandt.md §1, as
  they are.
- **SNAKE**: down one line on the canvas, a turn **in the air** at the end —
  the elbow lifts, the carriage steps to the next line, the brush lands on
  the move — then up that line on the canvas, and so on. No half circle on
  the canvas, so no flags at the turns (the owner: "so as not to make
  flags"). The turn is the lift and landing of Test's *Tail*.

"Top" is the ribbon's first anchor; a **⇅** per ribbon swaps its ends.

### 5.3 This moves the machine

The run goes from the NOLAN tab, as Test's does: Test sends its blocks to
`/run`, and `rembrandt.py` already runs the dip's wait in the cup and the
pause for paint. Job (from RUBENS) knows no cup. Anything new that moves
the machine — a new kind of block, a change to `rembrandt.py` or the
firmware — propose the smallest change and **wait for the owner's word**
before writing it.

---

## 6. Phase 2, after the first ribbon painting: the hand map

The **Hand** toggle of Palette shows these zones over the preview. The map
itself is a black-and-white sheet of the canvas, printable 1 : 1 in tiles or shown on a
screen by the easel: closed zones the owner draws, each with a letter.

- **G** glaze: ultramarine + burnt umber in glazing medium; the cavities
  where a ribbon turns under (his yellow marks of 2026-10-03, to add as
  `nolan-images/IMG_9664_glaze.jpeg`);
- **B** black ground;
- **A** airbrush glow.

No machine moves. Not in phase 1.

---

## 7. Done when

- The reference opens and the owner traces his three ribbons in under ten
  minutes, in Geometry, by dragging squares.
- Geometry ↔ Palette switches at once; anchors only in Geometry.
- A width step adds or removes one line; the readout says mm and lines.
- A moved anchor, a width or a tube updates the preview at once.
- Sample fills the lines; a muddy neighbour shows one ⚠.
- Black ground preview works.
- N1 · N2 · N3 latch as D1 · D2 · D3 on Test, a pause between passes.
- Each layer runs as Watercolour, then Paint; Paint runs One way and Snake,
  and Snake turns in the air, never on the canvas.
- The run starts from the tab with its dips, cup waits and pauses, and runs
  in the air on 500 × 700 before any paint.
- The Library keeps the painting; `CHANGELOG.md` and the glossary are
  updated; `node --test` passes.

---

## 8. Ask the owner, do not guess

1. One tube per line (v1), or may a line change tube along the ribbon?
2. The dip run: until Adjustments measures it, what length to use? (est.)
3. The Watercolour run traces the Edges by default, or All lines?
4. Where the canvas lies on the machine: from the cup and two ruler numbers
   (the Ink tab), as the Test board — or by Calibration's canvas corners,
   as on Create? *Claude's proposal: from the cup.*
5. Snake in the Paint run: every second line runs bottom to top, so its
   paint should lie at the bottom. Where does the owner squeeze it — at the
   start of each line, at both ends, along the whole trace?
