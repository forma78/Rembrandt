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
  owner's picture; it went into git while the repo was private, and stays
  now that the owner keeps it public (2026-10-04). A copy is in
  `references/`.
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

## 0. Owner decisions

Recorded in `Rembrandt.md` (§0, §1, §8) on 2026-10-04, before any code.

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
| **Ribbon** | One flat band in space along one centre curve, its lines parallel on it, each with its tube; the painting is one ribbon turned as a whole (§3.0, 2026-10-04). Before: a band traced flat on the canvas, a painting of several. |
| **Roll** | The band's angle about its centre curve at a point: 0° flat, facing you — the lines open; 90° edge-on — they close up. The lever of the bundles (§3.0). |
| **Squeeze** | The whole band's lever, beside each point's Roll: it presses the band towards edge-on (+, the bundles close up) or towards flat (−, they open); a slanted place moves most, a flat one stays flat (the owner, 2026-10-04: "why a glossary, if the panel has two Rolls? That is unprofessional — the second one, Squeeze?"). |
| **Imprint** | «Слепок», the owner's word: the ribbon in space projected onto the canvas, its hidden parts left out — what the machine paints (§3.0). |
| **Bundle** | The lines of one ribbon, running along its centre path. Every ribbon is its own bundle; there is no grid over the whole canvas. |
| **N1, N2, N3** | The layers: whole bundles, stretches of the ribbon between **cuts** along its length, painted in order — a stretch after every one it lies over, once that is dry (§3.0, 2026-10-04); N4, N5 as many as the cuts make. By depth before, in patches. Named N so as not to be taken for the D passes of the Test tab (the owner, 2026-10-04). |
| **Cut** | Where the ribbon is parted into layers, a place along it (mm from its start). Suggested where it hides behind itself, turns over or edge-on — there its rows end anyway, so the cut shows no edge of its own; the owner drags it, adds, takes it out (§3.0). **Uncut**: none, the ribbon one layer (2026-10-04). |
| **Geometry · Palette** | The two modes of the first draft (2026-10-03), gone with its second row when the tab was built on Test (2026-10-04, §2). The board draws the lines dark on the white canvas; the colour preview and the drop map come back with the colours (§4). |
| **Watercolour run** | NOLAN's first run of a layer, what used to be the pencil: the brush dips in a thin wash from the Ink cup and traces the ribbon, so the owner sees where to squeeze the paint. |
| **Paint run** | NOLAN's main run: the paint squeezed onto the canvas by hand, the brush drags it along the lines. No cup. |
| **One way · Snake** | The two ways of the Paint run: each line top to bottom with the return in the air; or down, a turn in the air, up the next line on the canvas. |
| **Dip run** | The length one dip in the cup paints along a line before the brush goes back for more (Watercolour run only). 720 mm, est. (§5.1). |

---

## 2. What the owner does on the tab

**The tab is built on Test** (the owner, 2026-10-04: "Stop. We are copying
CREATE, which did not work for us. Let's go back to TEST as the base."):
Test's board, the canvas placed from the cup (§3); Test's PROGRESS, keys,
INK and run; Test's words for the sliders (the owner: "the terminology from
TEST, so there is no mess: ROWS first, ROW TO ROW and so on; and TAIL"). From
Create only **the Tools on the left**. The ribbon is the one ribbon in 3D of
§3.0 (the owner, 2026-10-04: "yes, that is it — it can go into NOLAN").

The panel, top to bottom:

1. **PROGRESS**: the LCD, the sun and the moon; **PLAY · PAUSE / CONTINUE ·
   • STOP · •• HARD STOP**.
2. **💾 SAVE NOLAN** — to the Library. It sits on the tests' shelf for now
   (`rembrandt.py` knows paintings and tests); the Library opens it on NOLAN.
3. **N1 · N2 · N3**, a key for each layer the imprint has, latching as
   Test's D1 · D2 · D3: one, two or all, run in their order, a pause
   between them; the last one stays on; a layer off is faint on Imprint
   and Layers (the owner, 2026-10-04: "I do not see the keys as on TEST").
   **Auto** at the end of the row: the cuts as suggested again (§3.0);
   **Uncut**: no cuts, the ribbon one layer, one pass — every row whole,
   broken only where another part lies over it (the owner, 2026-10-04:
   "what if we add an option Uncut and do not cut at all?"; the suggested
   cuts lay on the pinches, and every row ended there).
   **INK** OFF · switch · ON: OFF the Paint run (§5.2), ON the Watercolour
   run (§5.1).
4. **Geometry · Colour · Layers · Imprint**, **White · Black**: the rows dark,
   red where they lie closer than a row's width; IMG_9424's stripes, the
   band's back darker for the glazes; what lies over what; what the machine
   paints — the visible pieces, their tails thinning; with INK ON the
   watercolour as it lies on the paper (the owner, 2026-10-04: "I would like
   to see on the screen a more exact drawing of what I paint with the
   brush"): darkest where the brush lands fresh from the cup, paler along the
   dip run, wet rows under 1 mm apart one wash, strokes over one another
   darker (`washOf` in `band.js`, est.).
5. The band: **Rows** (first), **Row to row**, **Row width**, **Stack**,
   **Twist**, **Squeeze** — Roll is a point's alone (glossary).
6. The ribbon in space: **Rotate X**, **Rotate Y**, **↻**, **Size**, **X ↑**,
   **Y →**, **Lens**; *Face the canvas*; *Paste a shape* (from the
   prototype's *Copy the shape*).
7. **Point n of m**: its **Depth** and **Roll**.
8. The brush, Test's: **Brush on**, **Between rows**, **Tail** — the elbow
   landing and lifting the brush over the ends of every piece, so the tails
   are as long as the owner sets them ("we can make tails of different
   lengths now") — **3 … 20 mm** (the owner, 2026-10-04: "take it away past
   20 mm altogether, it is not needed, so there is no temptation"; at
   155 mm the pieces' ends went unpainted, `machine/2026-10-04-test_both.png`;
   then "the line must go on", `2026-10-04 Nolan-v2-details.jpg`). The
   elbow keeps pace with the carriage, which starts every piece at rest and
   stops at its end: before, it lifted at the speed the carriage never
   reaches there, ~7 mm before the end. **Overlap**, 0 … 10 mm, 4 by
   default (est.): where a row goes under another part, or comes out from
   under it, its stroke goes on under it so far, within its layer — the
   part over it, painted after, covers it (the owner, 2026-10-04: "if the
   brush goes in overlapping, even better — only not these awful white
   gaps"). Before a stroke the brush waits just over the canvas, +12°
   (est.), not at +25°: from there the elbow was still coming down when
   the carriage set off, and the line began 5–10 mm late. Then **Board
   width · Board height**.
9. **Reference**: tracing paper over the canvas, its opacity; the round ×.

Test's *Row length*, *Bow*, *Wave* and *Lift at the turns* are not here: the
ribbon's length and bends are its points, and every piece runs one way, no
turns. Test's pattern keys are not drawn.

On the board:

1. **The ribbon through IMG_9424** opens by default — 17 points; the house
   brings it back, the ring (the first try's donut) is the other blank.
2. **Select** drags a square to move a point in the screen's plane; dragged
   elsewhere the ribbon turns — Shift moves it, Alt spins it, the wheel sizes
   it. **Pen** adds a point at the ribbon's end; ⌫ takes the picked one out;
   ⌘Z undoes; Esc is STOP, as on Test.
3. **N1, N2, N3** are the layers, stretches between the cuts: the run
   paints N1, pauses — CONTINUE when it is dry — then N2, and on; with INK
   ON, the watercolour, one after another with no pause (§5; the owner,
   2026-10-04: "on watercolour all 3 layers at once"). In a layer row by
   row, each piece one way, the way the ribbon runs. No timers.
4. **Cut** (C), the scissors in the Tools on the left (the owner,
   2026-10-04: "maybe move the scissors into TOOLS on the left?"): each cut
   a dashed line across the ribbon and a circle on its centre, each
   stretch named N1 … where it lies, in any look — Layers colours them.
   The circle drags along the ribbon, a click on the ribbon adds a cut,
   ⌫ or the bin takes the picked one out, ⌘Z undoes; dragged elsewhere the
   ribbon turns, as with Select.
5. **The image area**, as on Calibration (the owner, 2026-10-04: "at the
   bottom there is no edge; I do not see the image area — can you carry it
   over?"): the machine's walls dashed orange and named, the canvas past
   them hatched — there the brush runs along the wall (§3, past the walls).

Later, and where on the tab to settle with the owner: **Sample** (a tube
for every stretch of every row from the reference, §4), the drop map, the
colours' preview with **Black ground** and **Hand** (§6).

---

## 3. Geometry

### 3.0 The ribbon in 3D (2026-10-04) — the look; §3's flat offsets below are the first draft

On the Test-based tab the owner: the parallel lines "stand like idols, a
rake; they do not gather into bundles", and a slider of "sausages" "does
not reach international standards". He proposed 3D and an imprint of it,
«слепок»: "the natural shape of bundles of lines that converge in one place
and part in another". Then: "I was wrong about three independent donuts —
let's make one construction that turns, something like IMG_9424 in shape."
The model, from Claude in chat (`nolan-images/nolan-band-prototype.html`)
and Claude in VS Code (`previous_research/nolan_3d_prototype.html`):

- **One flat band along one centre curve in space** — a ribbon, not a tube.
  The centre from anchors `{ x, y, z, roll }`: x, y on the canvas as the
  owner draws them now, z the depth, roll the band's angle there; in plan
  biarcs through them, lines and arcs as Pen and Arc draw; z and roll ease
  between them.
- **Roll is the lever**: flat (0°) the lines open, edge-on (90°) they close
  up into a bundle. Twist adds half turns along the whole ribbon.
- The lines lie on the band a pitch apart, and a little apart in depth too
  (**Stack**): at a fold they fan like a deck of cards, as in IMG_9424.
- **The whole construction turns, moves and zooms** — the composition. The
  canvas is its **imprint**: orthographic, a lens for perspective.
- **Depth decides what lies on top**: hidden parts are not painted.
- **The layers are stretches of the ribbon, cut along it** (the owner,
  2026-10-04: `machine/layers selected.png` — "continuous bundles, where the
  line goes naturally and a human understands it; pleasant to the eye" —
  and `layers how to cut.png`). By depth before (a part one layer up from
  what it covers), the second layer came in patches, "very strange to the
  eye". A cut where the ribbon hides behind itself, turns over (its back
  to you) or edge-on shows no edge: its rows end there anyway, at the line
  where it goes under. `band.js`: `cutsOf` suggests them — the least seen
  place of each such stretch, 60 mm apart at least and from the ends —
  `stretchesOf` orders the stretches: one after every stretch it lies over
  (hides more of than it is hidden by), each once that is dry; free to
  choose, or in a ring, the farthest first. The owner's cuts, kept with the
  ribbon, replace the suggestion; ✂ brings it back. On the first run's
  ribbon the suggestion cuts at 20, 54 and 75 % of its 2.2 m — the owner's
  four bundles, the first cut 8 % lower than his, at the pinch below the
  fold; painted: the loop at the end, the left side, the fan, the middle
  band over them all.
- **The band's back** is where the hand glazes go (zone G, §6).
- **Red**: lines on the canvas closer than the brush. The owner's choice
  there: merge the bundle, or keep the overlap as a light rim.
- A ring — the first try's "donut" — can stay **a blank of the centre line**
  the band is stretched on (Claude in chat).

**The machine still gets flat lines and arcs: 3D lives only in the
drawing.** Each visible piece of a line is fitted into lines and arcs
(≤ 0.1 mm, Rembrandt.md §3), then Test's run (`plotRun`), as now.

On the tab (`app/src/band.js`): the centre in plan as biarcs through the
points, depth and roll eased between them; the imprint's visible runs
fitted into biarcs within 0.1 mm, an arc flatter than 2 m laid as its chord
— a centre kilometres away is no command for the board. **A sliver is never
sent**: a tail's cut can leave a piece a thousandth of a mm long, and the
firmware takes an arc ending where it starts for a full circle (`path.h`,
`arc`); the run leaves out pieces shorter than 0.05 mm (`plotRun`,
`MIN_PIECE`). Test's run too, by the owner's word (2026-10-04: "of course, no need
to send such noise to the board"): its journal held one such arc, the D1 of
2026-10-03 14:49 pressed into the bottom wall.

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
  pressure as in Test's *Tail* — the new arm's tail, no flags. The elbow
  goes 211°/s at most: on a piece shorter than about 22 mm at 150 mm/s it
  lags, and the paint lies further on. Kept as it is, no slowing down and
  no pieces left out (the owner, 2026-10-04: "we leave it as it is and do
  the first test"); the warning stays red on the tab.
- **Where geometry fails** — a line folds where the centre bends tighter
  than half the ribbon — a red "!" at the place, as Create marks a rounding
  that does not fit; the owner opens the bend or narrows the ribbon.
  (`offsetSegs` itself cuts a fold into a sharp point; the "!" says it
  happened.) The blend of Rembrandt.md §3 stays the alternative if folds
  get in the way. **Built 2026-10-04** on the 3D ribbon (the owner: "turn
  the construction and there is a gap; the imprint must be smooth — I
  killed one point"; of the "!": "a great idea"): `foldsOf` in `band.js`
  finds where two or more rows run back against the ribbon on the canvas,
  where it is painted — the rows a fold hides count too, the gap is what
  shows; the board marks each with a red "!", the reading says where.
- **Past the walls** — pressed into them as on Job and Test; the page says
  by how many mm. Kept so, not left out (the owner, 2026-10-04:
  "as now, pressed to the wall").
- **The canvas on the machine** lies from the cup: the two ruler numbers
  of the Ink tab, its left edge and its bottom edge from the cup's centre
  (`canvasFrom` of `ink.js`), as the Test board does (the owner,
  2026-10-04). Not Calibration's canvas corners.

---

## 4. Colour

- **Sample** uses `paintLanes` of `bands.js` along every line of the
  ribbon: read every 4 mm, nearest tube of the inventory (OKLab), what it
  missed by goes to the next line — optical mixing, as on Create.
- **A line changes tube along the ribbon** (the owner, 2026-10-04), as the
  strands of IMG_9424 do — orange → white → blue → lilac — and as Florian
  Markus's drops do (`references/preview.webp`, `preview-1 copy.jpg`). A
  line is stretches, each with its tube and a drop at its start in the
  brush's direction; the brush runs through the drops and drags each into
  the next. The stretches are the runs of `paintLanes`; a stretch's home
  is its start in the brush's direction, not set by lightness. How one
  colour flows into the next — the blue into the lilac — is est. until
  tested on Test.
- **The drop map**: the colour preview shows where every drop goes, its tube and its
  length, so the owner squeezes them on the trace by it.
- **Not tube by tube**: all the drops of a layer lie on the canvas before
  PLAY and the brush goes line by line through them (§5.2), so the
  lighter-first and stage-by-stage rules of Rembrandt.md §1 do not hold on
  NOLAN.
- **Muddy pairs**: neighbouring lines of one ribbon are wet together. A
  muddy pair side by side gets one **⚠** between them — a hint, never a
  block; an *intended* pair shows none (Rembrandt.md §6). In the reference
  the orange and the blue are nearly always parted by a pearl-white line:
  the owner may want the same.

---

## 5. Two runs: Watercolour, then Paint

Every layer (N1, N2, N3) is painted in two runs, Watercolour first, then
Paint (the owner, 2026-10-03; the watercolour canon of Rembrandt.md §1,
which replaced the pencil). The switch is **INK**, as on Test (the owner,
2026-10-04): ON the Watercolour run, OFF the Paint run; then PLAY. The keys
and PROGRESS as on Test: PLAY, PAUSE / CONTINUE, • STOP, •• HARD STOP.

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
- **Which lines it traces**: **All lines** by default (the owner,
  2026-10-04: "I need all the lines, or I will get lost … I am ready to
  wait to get the full picture"). The colour changes along every line
  (§4), so every line needs its trace to lay its drops on — "definitely
  the full trace in watercolour". **Edges**, the two outer lines of the
  ribbon, stays on the switch as the faster trace.
- **The dip run: 720 mm, est.** (the owner, 2026-10-04: "I think all
  720 mm will go easily; the photo shows well it is not the limit"). On
  2026-10-03 one dip carried a 330 mm row of the wash with paint to spare
  (`machine/photo_2026-10-04 01.29.23.jpeg`), and later rows of 430 and
  520 mm ran on one dip each (the run journal). The 720 mm stays est.
  until a line that long is run.
- **Short pieces: no dip** (the owner, 2026-10-04: "under 50 mm, do not
  dip, work with what is on the brush; it should be enough. Even if the
  paint runs out, I will see it by the density of the other lines"). A dip
  before a dot under 1 cm left a puddle of water. Then 75 mm (the owner,
  the same day: "50 mm without a dip works. Let's raise it to 75 mm — it
  should go faster still. The trace is quite clear"). A piece shorter than
  75 mm (`NO_DIP`) goes on what the brush holds. A layer starts on its
  first piece of 50 mm or more, with a dip — the brush dry, or waited
  through the pause — the others after it in their order, so a full brush
  never lands on a dot (*Claude's decision*, the owner: "agreed"; N2 of
  the first run began on a 21.8 mm piece). NOLAN only, not Test (the owner, 2026-10-04). On the
  first run's ribbon: 139 dips of 276, ≈ 42 min of 60.
- **A split laps 20 mm** (`DIP_LAP`, est.): the brush ran dry before the
  split, and the fresh run starting 3 mm back left a gap
  (`machine/2026-10-04 Nolan-v3-both.png`, in blue).
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
Florian Markus does, by the drop map; **no cup in this run**. **All the
drops of the layer go on before PLAY** (the owner, 2026-10-04: "yes, all
correct"), as in `references/preview.webp`; the machine drags the brush
through them line by line, with no pause between tubes. Two ways, a switch
**ONE WAY · SNAKE** — SNAKE for now, the switch with the keys later:

- **ONE WAY**: every line top to bottom — from the ribbon's first anchor to
  its last — on the canvas; at the end the brush lifts and goes back to the
  top in the air for the next line.
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

A **Hand** toggle of the colour preview shows these zones over it. The map
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

- The tab opens with the three ribbons; the owner fits them to the
  reference in under ten minutes, by dragging squares.
- A Rows step adds or removes one line; the readout says mm and lines.
- A moved square, a slider or a tube updates the board at once.
- Sample fills the lines, a line changing tube along the ribbon; the drop
  map shows every drop; a muddy neighbour shows one ⚠.
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

1. ~~One tube per line (v1), or may a line change tube along the ribbon?~~
   It changes, a drop at the start of every stretch (the owner, 2026-10-04;
   §4).
2. ~~The dip run: what length to use?~~ 720 mm, est. (the owner,
   2026-10-04; §5.1).
3. ~~The Watercolour run traces the Edges by default, or All lines?~~
   All lines (the owner, 2026-10-04; §5.1).
4. ~~Where the canvas lies on the machine?~~ From the cup and the two
   ruler numbers, as the Test board (the owner, 2026-10-04; §3).
5. ~~Snake in the Paint run: where does the owner squeeze the paint of a
   line that runs bottom to top?~~ Where the drop map says: at the start
   of each stretch in the brush's direction — on Snake's upward lines, at
   the bottom of the stretch (follows from 1).
6. ~~The Paint run: all the drops of a layer before PLAY, or tube by
   tube?~~ All the drops before PLAY, the brush line by line through them,
   no pause between tubes (the owner, 2026-10-04; §5.2).
