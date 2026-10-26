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
| **NOLAN** | The tab that paints ribbons, in Create's place from 2026-10-04, off the top row since 2026-10-19 (§1); the page stays. Its task: `NOLAN.md`. The only tab where the hand works too (§1). |
| **New Yuri** | The tab that paints letters as rings of circles, after NOLAN on 2026-10-06, off the top row the same day (§1, §8); the page stays, and the Library opens its saves there. Named by the owner. |
| **Letter** | On New Yuri: one glyph of `app/glyphs.json` on the canvas, a figure of its own — its baseline and left edge, its height, Weight and Step, Rings or Coil. |
| **Skeleton** | A letter stroke's centre line, lines and arcs, in a box from the baseline to the capline inset by the Weight; the circles' centres walk along it. |
| **Weight · Step** | New Yuri: a letter's circle radius, and the distance between neighbouring circles along a skeleton, mm. |
| **Rings · Coil** | New Yuri's two ways to draw a stroke: every circle a ring of its own — it lands, goes round, on 60 % over its start, lifts; or one line a stroke, a whole turn from circle to circle. |
| **TYPE** | The tab that paints letters as bands, the first of the top row and `index.html` from 2026-10-06 to 10-11, then off the row, `type.html` (§1, §8): TRACE, MARKS, DRAG. After the prototype of Claude in chat, `TYPE-Claude/`. |
| **LOVE** | TYPE's copy, after it in the top row from 2026-10-07 to 10-11, then off it (§1), where the new things go — Play the run, then the ribbon of `TYPE-Claude/RIBBON-new.md` — so that TYPE stays as it is to go back to. `love.html`, its plan `loveplan.js`. |
| **ALU** | The tab that paints pipes of paint, after LOVE in the top row since 2026-10-08 (§1, §8): TYPE's passes, TRACE · MARKS · DRAG, on pipes. `alu.html`, its plan `aluplan.js`, after the spec and the prototype of Claude in chat, `ALU-Claude/`; the rest of its words in `ALU-Claude/ALU.md`. |
| **TAPE** | The tab of a cassette and its tape, the first tab from 2026-10-12 to 10-19, then off the top row, `tape.html` (§1, §8): a compact cassette at real size in the centre of the canvas, its outline traced by the machine, the rest drawn with a stencil and coloured by hand last — or, since the same evening, none at all, the tape wound from the centre (Cassette size 0 %); its tape wound round it by the brush, lane after lane, touching, off the canvas's edges — after chat-Claude's prototype v0.3 (`TAPE-Claude/`, its words in `TAPE-Claude/TAPE.md`). TRACE the cassette's outline and the tape's guide with the brush, with INK ON in watercolour; DRAG in two keys, Snake and Air; no MARKS. `tape.html` since 2026-10-19 (`index.html` before), its plan `tapeplan.js`, its page module `tape.js`. |
| **BASF** | TAPE's tape wound from the middle of the canvas, no cassette, after TAPE in the top row from 2026-10-12 to 10-19, in honour of the cassettes gone (§1): every lane a rounded square of one shape, the innermost at the middle, Corners its rounding. `basf.html`, its body `data-tab="basf"`; TAPE's page module and plan (`inner`), its own keep and Library label. |
| **Lane · pitch (on TAPE)** | A lane: one loop of the tape round the cassette, one brush wide, a rounded rectangle whose four corner arcs share one centre, so the next lies one pitch outside it all the way round; lane 1 the one touching the cassette. The pitch: lane centre to lane centre, the brush and the Gap; at Gap 0 the lanes touch. |
| **Seam · lane change · closed rings (on TAPE)** | The seam: where the tape moves out to the next lane, the middle of the right side. The lane change: the stretch from the seam over which it drifts out one pitch, Lane change brush widths long, one smoothstep for every lane, so neighbours never bunch or part; longer than lane 1, one continuous spiral and no seam seen. Closed rings instead: every lane closing on itself, the brush lifting to the next. Not ALU's seam. |
| **Run · overrun (on TAPE)** | A run: the tape whole, from where it comes out from under the cassette to its last lane, the brush down off the canvas too (a closed ring a run of its own). The overrun: how far the brush carries on past the canvas's edge at a run's end before it lifts. No segments and no paint stops since 2026-10-12, the evening (§1). |
| **Spoke (on TAPE)** | Paint squeezed across the lanes at one spot round the cassette, from it outwards, as the owner laid it on paper (`TAPE-images/` 17:22): one of his paints over 1, 2 or 6 lanes with M, or a stripe's lanes in the pattern (New spokes) — lined up with a spoke lying there, a drag lane to lane — so a spot may hold one, two or three colours, dash after dash outwards; on the canvas only; the tape passes it lap after lap and the brush drags it along. Laid with M; the Result mixes them as the brush goes. A map for the hand, never run on the machine. |
| **Snake · Air (on TAPE)** | DRAG's two keys on TAPE: the snake, the run's strokes forward, back, forward … with the brush down; air, forward on the canvas, the brush lifting at the end and flying back to its start, the strokes over. Not CCD's snake, lane after lane. |
| **ALU-CUT** | ALU with the new things, the first tab from 2026-10-11 to 10-12, in TYPE's and LOVE's place, then after TAPE (§1): cuts made with the scissors, ✂ (C), the brush stopping at each, every part its own palette and a clean brush (chat-Claude's task, `ALU-cut-Claude/`). `alucut.html` since 2026-10-12 (`index.html` before), its body `data-tab="alucut"`; ALU's page module and plan, ALU's palette, its own keep and Library label. |
| **Cut · part** | On ALU-CUT: a seam made with the scissors, ✂ (C), where DRAG stops — the brush lifted, wiped or washed, the next part's paints squeezed, Continue; a part, the pipe between two cuts or a cut and an end, painted on its own with a clean brush, its lanes half a brush clear of a cut, the pipe's lane numbers going on across it (2026-10-11, §8). A seam (S) only changes the paints. |
| **SMKN** | ALU with the paints in stock, after it in the top row since 2026-10-08 (§1, §8): the palette of the owner's brand Soumkine, fourteen tubes — Sennelier Abstract, Lukas Cryl Terzia, Pébéo Studio Acrylics — their colours read off his photographs (est.). `smkn.html`; ALU's page module and plan, its own keep and Library label. |
| **CCD** | The tab of rectangles of straight lanes, after Carlos Cruz-Diez — not the camera's chip — after ALU-CUT in the top row since 2026-10-11 (§1): the paint squeezed by hand along one edge, the dry brush driving it across, lane after lane; since 2026-10-13 TAPE's paints, straight — sausages in rows across the lanes — MARKS where they go and DRAG in four keys: Snake, the lanes back and forth with the brush down, a step across at each end; Air, each lane one way and a flight back; Duo Snake and Duo Air. No TRACE. `ccd.html`, its plan `ccdplan.js`, its own page module `ccd.js`; ALU-CUT's untouched, TAPE's paints imported. |
| **Rectangle (on CCD)** | A free-transform box on the canvas — dragged, stretched by its eight handles, or typed by the ruler from the canvas's bottom left corner (Left, Bottom, Width, Height) — Vertical, every lane from its bottom edge up, or Horizontal, from its left edge to the right; 1 … 218 lanes, the outer lanes' brush edges on its sides. DRAG stops before every next one. |
| **Sausage · row · stripe (on CCD)** | A sausage: one paint squeezed across a stripe's lanes, SAUSAGE_W along them (5 mm, est.), the owner's hand on a MARKS dash. A stripe: neighbouring lanes, 1, 2, 3 or 6 (TAPE's stripes). A row: the sausages at one place along the lanes; the rows evenly from the paint's edge to the far one, both in — Rows, 1 … 12, four on the owner's 20 × 20 (2026-10-13). Density: the paint in a sausage, 50 % the measured one, the line full 70 mm, then fading. |
| **Genesis (on CCD)** | The pattern a rectangle's sausages were laid in — its lanes, pitch, rows, stripes and paints — on the rectangle as it was (New spokes, a meta key, New colours with none lying); a bigger rectangle repeats it at its scale, its pitch kept and its lanes more, the stripes and the rows again and again, cut at its sides (the owner, 2026-10-13: "from the genesis 20 × 20 we then enlarge it as an ornament … a repeat at the same scale, not bigger"). |
| **Duo Air · Duo Snake (on CCD)** | DRAG's two Duo keys on CCD, after TAPE-colors/IMAGE 2026-10-12 18:44:00, the top half first, the right one on a horizontal rectangle (2026-10-13). Duo Air: every lane from the far edge to the middle and 5 mm on (Duo Air: past the middle; the head comes off before it), the brush lifting there and flying back to the next, then every lane from the paint's edge. Duo Snake: each half the snake — every lane from its edge to the middle and back along itself with the brush down, turning at the middle, a step across at the edge to the next. |
| **BIAS** | CCD's rectangles with diagonal lanes, a plaid on the bias, after CCD in the top row since 2026-10-15 (§1, §8): CCD's paints, MARKS and DRAG Snake · Air (45 SNAKE · 45 AIR since 2026-10-16), SNAKE PLAIN → · ↑, 90 SNAKE · 90 AIR, BIAS SNAKE · BIAS AIR; every rectangle two families of lanes, rising ↗ at Angle and descending ↘ square to them (or their mirror), one step apart, one lane of each through its bottom left corner; DRAG in four runs, no stop between them — 1 rising every other lane from the bottom right corner up, 2 descending every other lane from the top right corner down, 3 and 4 the lanes skipped — the brush never on a painted lane. `bias.html`, its plan `biasplan.js`, its page module `bias.js`; CCD's untouched. |
| **BIAS SNAKE · BIAS AIR** | BIAS's two DRAG keys (2026-10-15, the afternoon): every lane, a rising one and a crossing one in turn — the rising from the bottom right corner up, each run down ↙ from the right or the top; the crossing from the top right corner, each run ↘ to the right side, or from the bottom left, ↖ — every lane starting and ending RUNOUT mm off the canvas (30, the owner's) within the margin, so the brush crosses the edge at an even pressure. Between two: the snake keeps the brush down off the canvas where it can go round no farther than 1.25 times straight across, else it lifts and flies over; the air always flies. Snake and Air stay, four runs. |
| **45 SNAKE · 45 AIR · 90 SNAKE · 90 AIR** | BIAS's four-run DRAG keys (2026-10-16): 45, Snake and Air renamed, the lanes on the bias at the rectangle's Angle; 90, the counter check at a right angle — the same four runs, the lanes upright ↑ and across →, whatever the Angle: 1 upright every other lane from the right edge, 2 across every other lane from the top, 3 and 4 the lanes skipped. 90's lanes centred on the rectangle, Step apart, none down its middle, the brush wholly on it. Under them BIAS SNAKE · BIAS AIR. |
| **SNAKE PLAIN → · SNAKE PLAIN ↑** | BIAS's straight stripes, as CCD's (2026-10-16, the evening, after 90 looked "some kind of parquet"): one family and one run, every lane in its order, the snake with the brush down, turning off the rectangle — → every lane across from the bottom up, → then ←; ↑ every lane upright from the left, ↑ then ↓. 90's lanes: centred, Step apart, none down the middle, the brush wholly on the rectangle. Before 90 SNAKE · 90 AIR on the deck. |
| **Run (on BIAS)** | One of the four: the lanes of one family it paints, every other one, in their order — a snake of them with the brush down, turning off the rectangle, or each one way through the air. Not TAPE's run. |
| **Edge sausages · rows (on BIAS)** | Where BIAS's paint is squeezed (the owner's hand test, BIAS-plaid/ 10:30:07 … 10:30:10): along the rectangle's four edges, where every lane lands, and along vertical rows inside, evenly — Rows counts the sides, three on the 20 × 20, one down the middle; each edge and row cut into stripes of 1, 2, 3 or 6 half-steps, a paint each. |
| **LOOM** | Claude's own tab, after BIAS in the top row from 2026-10-16 to 10-19 (§1, §8), on the owner's offer of "full freedom": the canvas one woven cloth — BIAS SNAKE's strips, square to each other, a rising one and a crossing one in turn, 30 mm off the canvas at both ends — and where a strip should go under one laid before it, the elbow lifts the brush over it on the move. Two layers, each its own drawing and paints, run on their own; a canvas past the reach in two halves, turned round between. MARKS and DRAG Snake · Air; no TRACE. `loom.html`, its plan `loomplan.js`, its page module `loom.js`; BIAS's untouched. Its instructions: `LOOM.md`. |
| **Strip · hop (on LOOM)** | A strip: a lane of LOOM's cloth, one brush wide, a step from its neighbours across, one of each family through the canvas's centre. A hop: where a strip goes under one painted before it, the brush up from Hop mm before that strip to Hop mm past it — the piece a turn for plotRun, the elbow up through it (+25°) and down to the lift-off by its end, Lands and lifts over its tail either side — so the earlier strip stays on top there. |
| **Weave (on LOOM)** | Which strip lies on top where two cross: **Plain**, one over and one under in turn, a chessboard — the intrecciato; **Twill**, two and two along the diagonals, its ribs straight across the canvas at 45°; **Basket**, the strips in pairs; **Lattice**, no hop, the later strip on top, as BIAS and IMG_0924. By the strips' indices on the canvas as it lies first. |
| **Layer 1 · Layer 2 (on LOOM)** | Two runs, each its own drawing — weave, angle, step, crossing corner, rows — and its own sausages and paints: layer 1 on the white canvas, layer 2 another way over it once it has set (the owner, 2026-10-16, IMG_0921: "two independent runs, and it looks dearer than one"). The Result on Layer 2 shows the second over the first. A layer in this glossary's sense. |
| **Halves · the turn (on LOOM)** | A canvas past the reach (60 × 80, 70 × 100) run in two: half 1, the near half — the left (↔) or the bottom (↕) — and the overlap past the middle; the carriage home, a pause; the canvas turned round 180° by hand, its far corner C on the stop where the near one, A, was; half 2, the same lattice in the canvas's turned frame, its strips going on from the first's, the paint dragged the other way. |
| **INKA** | The tab of Inca patterns, after LOOM in the top row from 2026-10-17, the first tab since 2026-10-19 (§1, §8): square tiles "like Mexican rugs or chocolate bars", each filled by a spiral of the dry brush, the tiles that touch one figure, the brush down through all of them without a lift — Florian Markus's way with the paint, not his race tracks — and Heather Day's pure colour in a figure of one paint. MARKS and DRAG, no Air, no TRACE; ▶ Play the run. `index.html` since 2026-10-19 (`inka.html` before), its plan `inkaplan.js`, its page module `inka.js`; CCD's untouched. |
| **Tile · block · unit · figure (on INKA)** | A tile: a rectangle laid with R, as CCD's. A block: tiles laid over one another, one outline, its rings the outline's — the owner's "[". A unit: a tile or a block. A figure: units side by side, sharing a side, no farther apart than One figure: tiles apart up to (5 mm, est.) — one line of the brush; units touching only at a corner, or farther apart, a figure each. |
| **Trail · swell (on INKA)** | The trail: what the brush lays with paint, wider than it is set — the swell, the paint it takes up (the owner, 2026-10-19: "the brush is not a felt-tip or a Posca marker"); 9 mm at Brush width 3.5, measured by the ruler on his canvas of 2026-10-17, so the swell 5.5 mm (est. at other widths). The Drag strip, the Result and the core go by it — the outer ring by the brush's half, so touching tiles meet in any paint (since the evening of 2026-10-19); MARKS' dashes by the brush. |
| **Ring · spiral (on INKA)** | A ring: one loop of the brush round a unit — its outline moved in by the brush's half, its edge on it, then by Step each time, its turns rounded by Corners — until the paint meets in the middle: the innermost ring the trail wide, none narrower (since 2026-10-19; before, the brush's half and rings down to 1 mm). The spiral: the rings joined — from a corner, each a step short and on along the next; from a side's middle, the **ring change**, an S over the side's last stretch, Ring change mm or as much as it has (TAPE's lane change, 2026-10-19). A figure's units in a snake from its bottom left, up first; the first from its middle out, the next from its outside in, and so on — out to the corner nearest the next unit, in from the corner nearest the brush, from a middle straight to the next middle across the rings, as the owner's scheme draws it. |
| **Wipe (on INKA)** | Before every next figure: the brush flies over its start and goes up to Wipe (+45°, the elbow's highest, est.), the run pauses; the owner wipes it and squeezes that figure's sausages; Continue brings it down to land. |
| **Node · magnet (on INKA)** | A node: the owner's link from one tile to the next (2026-10-17), laid with N — the brush's way set by hand, no algorithm. A magnet: where a node holds — a tile's middle, where its spiral ends inside, or a corner or a side's middle of its outer ring. A node into a tile's middle: it spirals out, its outer ring turned to end where its next node leaves; into its outer ring: it spirals in from there. One way out of a tile, one in; the chains are the figures, a tile no node touches a figure of its own. No nodes: the snake. A tile whose nodes are both in its middle, or both on its edge — the brush crossing its rings to leave — is marked **!** (the owner's sign, not ⚠, which is the muddy pair's). |
| **Knife (on INKA)** | K in the Tools, under N: a line dragged across the canvas cuts every node it crosses, a click on a node cuts that one; the chain falls apart there (2026-10-19, the owner's "scalpel", where Clear nodes is the sledgehammer). |
| **Turn (on INKA)** | The way the brush goes round a tile as it paints it, in or out: ↻ clockwise, ↺ anticlockwise; a block's its first rectangle's. |
| **To buy · •** | A paint not in the owner's stock yet, shown in INKA's strip under his 24 with a red dot: four fluorescents read off his canvases (2026-10-19, `TO_BUY`). Not ⚠ and not INKA's **!**. |
| **Reference palette (on INKA)** | The palette off the reference's painting — its wall and frame off, a phone's status bar too (2026-10-26) — in the owner's paints, a fluorescent to buy where his own are far: every pixel to the nearest of them (CIEDE2000), the six with the most of the picture the core, the next three thin, their shares its weights; OK in the Reference block deals it on every tile, at random in its shares (2026-10-19); its **spot**, the brightest speck, one tile only. Several references since 2026-10-26, **Reference 1, 2 …** as a blend's keys, the chosen one over the canvas, its palette in sight under the block. On BLEND read in **tints**: a pale colour its paint laid thin over the white, the pixel the paint's by how much of it there is, the rest White's — a pale pink Rose Azo and White, not White alone. |
| **Spoke (on INKA)** | A sausage across a unit's rings, so every ring takes it up: since 2026-10-19 the arms of an X — from every corner of a tile along its diagonal to its innermost ring, its round end on the tile; a block's from every corner of its outline at 45° (before, eight from the sides, at most 60 mm apart). M lays the arm nearest the point clicked, or one where it is dragged. Not TAPE's spoke. |
| **ST-JOHN** | INKA's page with ⌘, St. John's Arms, after INKA in the top row since 2026-10-19 (§1, §8): INKA's tiles, nodes, paints, DRAG and Result, ⌘ in the Tools between R and N, and TRACE in MARKS' place. `stjohn.html`, its body `data-tab="stjohn"`; INKA's page module `inka.js` and plan `inkaplan.js`, its own keep and Library label. The owner's references in `St_John/`. |
| **⌘ · lobe · loop (on ST-JOHN)** | ⌘: St. John's Arms, a figure of its own laid with ⌘ (J), its box in four lobes, its quarters, in the brush's order — 1 the top left, 2 the bottom left, 3 the bottom right, 4 the top right (since 2026-10-20; until then the bottom right first, the owner's numbers on the old sign) — every lobe's rings a tile's. A loop: one ring of every lobe at one depth, as ⌘ is drawn in one line — round lobe 1 clockwise, down its inner side straight on through the middle into lobe 2, round it, on into 3, into 4, back into 1 — every lobe's inner sides going on across the middle, crossing there: the sign's middle a grid. The brush lands on lobe 1's innermost ring, round its window, and goes loop after loop outward, from one to the next by the ring change, an S on lobe 1's bottom: one line, no lift (since 2026-10-20; from the middle inward before). ↺, the sign mirrored. **Width**: the loop edge to edge, as ALU-CUT's pipe — the rings only so far in from the sign's outline, a window in every lobe, the grid in the middle 2 Width across; at half a lobe the lobes filled; a new one's a fifth of its box, the owner's best, 74 mm on his 387. Its turns concentric: the outer ring's Corners, each ring inside it its depth less, never under 4 mm, never past half its ring's side — at Corners 100 every ring round, three quarters of a circle and its straight inner sides, the windows too. No node holds on it; it melts into no tile and joins none. Its sausages an X on every lobe; one paint or two, the second on lobes 2 and 4. |
| **TRACE (on ST-JOHN)** | In MARKS' place on ST-JOHN's deck (2026-10-19): every figure's path, the very line DRAG runs, at DRAG's speed, figure after figure, no wipe — with INK ON the same brush in tinted water from the cup, a dip every 1440 mm (TRACE_DIP, the owner's, 2026-10-19; est.; NOLAN's, ALU's and TAPE's 720), each next stretch on from 20 mm back (DIP_LAP); the trace the owner squeezes the paint on, as Florian, before DRAG. Not TYPE's TRACE of outlines. |
| **BLEND** | The tab of Adobe Illustrator's blend for the machine, after ST-JOHN in the top row since 2026-10-26 (§1, §8): INKA's page, all of it, and **B**, the blend, in the Tools between R and N — the first tab whose lines lie over one another, not beside (the owner: "until now we made figures whose lines did not cross but lay side by side"). `blend.html`, its body `data-tab="blend"`; INKA's page module `inka.js` and plan `inkaplan.js`, the blend's `blendplan.js`; its own keep and Library label. The owner's references in `BLEND/`, IMG_1554 the key one. |
| **Key · step · Steps (on BLEND)** | A key: one of the shapes a blend is made between, a rounded rectangle — key 1, A, the blend's box, the outermost; the others in A's fractions, so they move and stretch with it; the last one the core; every key its Corners, mm. A step: a shape between two keys, its edges and corner going evenly from the one to the next. Steps: how many between every two keys, Illustrator's Specified Steps — IMG_1554's 13, its three keys A, a square three eighths of it against its top, and the core against that one's bottom. |
| **Loop · core (on BLEND)** | A loop: one shape of a blend as the brush paints it, its edge on the shape's outline as a tile's outer ring, its turns the shape's corner less its depth, never under 4 mm. Since 2026-10-26's evening **K1 · K2 in turn** — a loop of every two keys' series in turn, one of Key 1's, one of Key 2's, and so on, every contour drawn once, a stroke of its own from the middle of the side where its series' loops meet (IMG_1554: Key 1's at 12 o'clock, Key 2's at 6, under the core) round to there, the brush up and on in the air to the next; or **Key after key**, one line, the outermost first and every next over it — where the shapes close in, the paint over the paint — on from one to the next by an S on the side where they lie nearest, the S's one under another. The core: the last key filled by rings of its own, a tile's, a figure of its own after the loops — a wipe, its pure paint, from its middle out; Core empty, the line goes round it too. Not ST-JOHN's loop. |
| **Spokes · patches (on BLEND)** | A blend's sausages since 2026-10-26: **spokes** all round — **Spokes** of them, the blend's own number in its panel, at first one every ≈ 95 mm, as far as the paint carries at Density 50 % (est.), never moved by the Density — shared out over the sides of its outer loop, every side parted evenly, from each place across every loop to the same place on the last, straight from key to key, in pieces as long as they lie apart; a run of one paint along a spoke one sausage; the core an X of its own, its Step moving that X alone. **Patches**: the palette dealt over them, every paint its share of the sausages, grown at random from seeds over their neighbours, so the colours lie in clouds over the loops, the brush running one into the next; the core the spot, else the pure paint. Before, an X along every corner's way, the outer half one paint, the inner half another. |
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
| **Preferences** | The gear ⚙ after Library in the top row (2026-10-20, §1, §8), `prefs.html`, `src/prefs.js`: what holds for every tab, kept in this browser as the lamp's day and night. For now TEST's: the margin of its dots, 10 mm at first, and TL one dot or two, 5 s apart at first. Moves nothing by itself. |
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
  "a small update to v.1.0.5"); **v.1.0.6**, Tape, on 2026-10-12, with TAPE
  first, BASF after it, the owner's paints and their spokes mixed by the
  brush (the owner: "great! thank you very much! we set v.1.0.6 and can
  push it to GitHub"); **v.1.0.7**, Phone, on 2026-10-13, with the pages
  laid out for the iPhone (the owner: "all great. We can push. Make it
  v.1.0.7, write an update about the mobile version"); **v.1.0.8**,
  Genesis, on 2026-10-13, with CCD's paints in straight rows, MARKS, Duo,
  the genesis repeated and HOME (the owner: "now we can push and make an
  update on GitHub, it is REMBRANDT v.1.0.8"); **v.1.0.9** on 2026-10-19,
  with INKA first and the top row cleaned (the owner: "this will be the
  v.1.0.9 update").
- **The canvas lies from home; TEST's dots 20 mm in from its edges** (10 mm since 2026-10-20, below; the
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
  next rectangle; the board the canvas and home, not the whole image area
  (all *Claude's*). A round brush (the owner, 2026-10-13: "we do not take
  the flat brush, the tests showed it is useless"): till then the flat one,
  turned by hand where the direction turns. **HOME** next to STOP (the owner, the same
  day: "so that the arm with the brush goes back to the bottom left
  corner"): the brush up, the carriage home, when nothing runs; on TAPE
  and BASF too ("yes, it can go on TAPE and BASF"). **TAPE's paints on
  CCD, straight** (the owner, 2026-10-13, Cruz-Diez/IMAGE 2026-10-13
  14:47:37: "I want to bring these paints to our CCD tab … the intensity
  of the paint sausages must be regulated … at a run there is enough for
  70 mm on average, then it starts to fade"; "PAINTS i, New colours, New
  spokes, meta 1, meta 2 (presets) and DENSITY, and the set of paints in
  use — only ours go straight"): sausages in rows across the lanes; **MARKS**
  added, no TRACE, Snake and Air kept ("CCD will probably need MARKS — no
  trace — and SNAKE and AIR stay"); **rows inside, a slider for them** ("my
  20 × 20 had four rows in all, two in the middle and at the edges, left and
  right; I chose the horizontal run"); **the genesis repeated at the same
  scale** on 30 × 30 and 40 × 40 ("on 40 × 40 they are copied as a pattern
  — that is the trick of the algorithm"; "a repeat at the same scale, not
  bigger"); **the drips wanted** ("the drops show it is not a digital
  print, that is the whole point"); **Duo** ("a run to the centre, a lift,
  back … then from the other edge to the centre"; the return in the air,
  the right half first on a horizontal rectangle: "it will do, that is how
  it was meant"); after the first Duo on the machine, **5 mm past the
  middle at the lift** ("the head with the brush comes off before the
  centre") and **two Duo keys, Duo Snake and Duo Air** ("DUO SNAKE, when the
  brush reaches the centre, turns and goes back"; "it can be split" — a
  row of their own); **back along the same lane**, in Duo Snake and in
  Snake ("yes, listen, along the same lane. Redo it here and in Snake. I am
  testing it live; sometimes in practice our ideas do not work as in
  theory"): every lane there and back, then a step across to the next, the
  brush down (Claude's: the step with the brush down, as the snake's
  before); the same evening **Snake back to the next lane**, Duo Snake
  staying on the same one ("let us bring SNAKE back with the return along
  the opposite lane, as it was", Cruz-Diez/IMAGE 2026-10-13 19:02:03);
  **meta 3, meta 4** from TAPE-colors/ 18:43:57 and 18:43:59
  ("beautiful combinations"). Density at 50 % the measured 70 mm, the rest
  of the paint's behaviour est.; a palette and a pattern each rectangle's
  own, the Result's Snake leaving its bead at a lane's end (all *Claude's*).
- **BIAS, a tab of its own: CCD on the bias** (the owner, 2026-10-15,
  `BIAS-plaid/`, his hand test photographed, three tartans beside it: "I came
  up with a new way of painting, on the base of the CCD tab. There will be
  absolutely the same palette and the same principle — DRAG Snake / DRAG
  Air. The only difference: the stripes not straight but diagonal"). After
  CCD: TAPE · BASF · ALU-CUT · CCD · BIAS · ALU · SMKN · NOLAN · Test · Ink ·
  Calibration · Library. **Four runs, skipping one** ("choose the canvas's
  format, 20 × 20 cm, say — the brush, from the bottom left corner, skipping
  one run, rises along the diagonal; skipping one: if the step is 32 mm, the
  brush's diameter 6 mm, it goes back not along the same trajectory, and not
  along the next one, +32 mm, but skipping one, +64 mm. And so to the end;
  then it turns over and goes the other way, descending. Important: the
  machine does not stop there, but rises a second time — the third run —
  from the bottom left corner and paints the ones skipped, +32 mm, again
  skipping one but minding them: the brush must not drive over the ones
  already painted. Then it descends a second time, again painting the lines
  skipped — the fourth run. That is all"); his schemes the same morning,
  10:52:26 "the first run, how the brush rises" and 10:52:30 "the second run,
  how the brush comes down on the canvas": **rising from the bottom right
  corner to the top left, then down from the top right** ("on my scheme the
  brush starts rising from the bottom right corner and reaches the top left
  … then, to come down, it may move over to the top right corner, that is
  allowed; there are no rules here"; "we do not have to make the brush's
  turn continuous"). *Claude's choices*: the name off his folder; the second
  family square to the first, as on 10:52:30 and the tartans, **Mirror** a
  key, as on his sketch 10:30:04; Angle 26.6°, his sketches' — a corner to
  the middle of the far side — Step 32 mm and the brush 6 mm, his numbers;
  one lane of each family through the rectangle's bottom left corner; run 1
  the rising lanes of the lowest one's parity, run 2 the descending ones of
  the highest one's; the snake turning 2 mm clear of the rectangle (est.),
  round the corner between if it must, so its step never crosses a lane; a
  lift and a flight between the runs, a stop only before the next
  rectangle; Air every lane left to right; the sausages along the four
  edges and vertical rows inside, as his hand test laid them; the Result
  run after run on a grid of the canvas, the later lanes through the
  earlier's wet paint; no Duo.
  **BIAS SNAKE · BIAS AIR, two runs** (the owner, the same afternoon, after
  the four on the machine, `BIAS-plaid/` 12.57.38 … 13:04:33: "the brush went
  from one corner to the other continuously … in the first two passes it
  takes all the paint, leaving none for the third and fourth — mud"; "the
  brush's direction changes only twice, both diagonal, but straight away —
  one pass along the diagonal one way, then it crosses the other"; "two
  runs, not four"; "call the brush BIAS SNAKE // BIAS AIR"): every rising
  lane from the bottom right corner, then every crossing one, Snake and Air
  kept. **30 mm off the canvas at every lane's ends** ("lifting off the
  canvas the brush changes its pressure and the line's thickness, 13:04:33 —
  untidy, as if a person did it. Our construction allows simply going +30 mm
  aside, so the brush straightens out off the canvas and reaches the edge
  evenly — then it turns, comes onto the canvas and runs an even, solid line
  with no change of thickness"). **The crossing from either side** ("we do
  not have to make the crossing line there too; it can be drawn from the
  opposite side"; "the task: to see how the paints mix as we drag the brush
  from different corners"): from the top right corner, its strokes ↘, or the
  bottom left, ↖ (*Claude's*: the strokes turned with it, so the paint is
  dragged from the other edge; in the snake every other lane only).
  **The two families in turn, not one after the other** (the owner, the
  same afternoon, on the first try, 2.13.26 PM and 14:17:03: "a row of
  diagonals goes one way. What is needed: after the first diagonal of the
  first part of the run the brush makes only one line, then goes the other
  way to make a pass in the opposite direction"; "the brush has already
  made 7 lines one way and not one across"): a rising lane, a crossing one,
  a rising one …, each family on from its own corner, the longer one's last
  lanes on their own. *Claude's*: in the snake every lane from its end
  nearer, round the canvas, to where the one before it left — the brush down
  off the canvas the whole way round, at least the clearance off it.
  **A margin round the canvas** (the owner, the same afternoon: "the canvas
  is not 350 × 350 mm, really it is 30 × 30 — I had no strength left to ask
  you for 25 mm of margin on every side to let the brush turn; but maybe it
  can be done with a margin on the screen, so that it is all professional"):
  the canvas the real one, **Margin round the canvas** 25 mm on every side,
  drawn round it; BIAS's run off the canvas no farther than the margin lets
  the brush's edge go, a warning when anything goes past it (*Claude's*: the
  margin BIAS's own, the canvas base every tab's left the real canvas, so
  TEST's dots stay 20 mm in from its corners).
  **Fewer idle moves** (the owner, the same afternoon, Screenshot 2.27.09 PM:
  "the brush always goes from the right side, makes a pass down the
  diagonal to the centre, then comes back to the right side and from there
  goes to the top corner, as if throwing the paint off the canvas — it can
  be done so, but slowly"; 2.27.43 PM: "let only one diagonal start from the
  right side and go sideways down; then an idle pass over the canvas up, and
  straight from there a pass along the opposite diagonal to the right side;
  from there down through the air, and the second pass along the diagonal
  to the bottom side; from the bottom through the air up again, and the
  second line of the opposite diagonal"): the rising lanes each run down ↙,
  the crossing ones ↘ to the right side, every lane its way; the snake's
  brush down off the canvas only where that is short, along the side it
  left by, else a flight over the canvas (*Claude's*: ROUND_MAX 1.25; the
  nearest-end rule of the hour before gone).
  **90 SNAKE · 90 AIR, the counter check at a right angle** (the owner,
  2026-10-16, `BIAS-plaid/` Screenshot 9.08.29 PM, straight lanes drawn in
  blue over the bias: "here the counter check is at a right angle. We have
  two keys, SNAKE and AIR — they should probably become 45 SNAKE / 45 AIR —
  and add 90 SNAKE / 90 AIR, before the BIAS SNAKE // BIAS AIR keys"): Snake
  and Air renamed **45 SNAKE · 45 AIR**, as they were, at the rectangle's
  Angle; **90 SNAKE · 90 AIR** their four runs with the lanes upright and
  across. *Claude's*: 90 the four runs, as 45's, not BIAS's turn — 1 upright
  ↑ every other lane from the right edge, 2 across → from the top, 3 and 4
  the lanes skipped; whatever the Angle; Step the rectangle's; the lanes
  centred on it, none down its middle — so none runs along the middle row of
  sausages — the brush wholly on it (a lane through the corner, as the
  bias's, would run along the edge, half off it); the sausages as they lie.
  **SNAKE PLAIN → · SNAKE PLAIN ↑, straight stripes** (the owner, the same
  evening, on 90 tried: "thank you. I tested it … eh … some kind of parquet
  :)) Let us simply do it as in CCD, straight stripes. Snake Plain →, Snake
  Plain ↑. And add them before the 90 SNAKE 90 AIR keys"): one family each,
  every lane in turn, the snake. *Claude's*: the order CCD's lane 1 — across
  from the bottom up, upright from the left — 90's lanes and Step, the turns
  off the rectangle as BIAS's snake, not along its edge as CCD's; no Air; 90
  kept.
- **LOOM, Claude's own tab** (the owner, 2026-10-16, a Friday evening,
  `Claude-Freedome/`: "I made a folder for you … the works we made together
  this week: CCD, BIAS Plaid … Of everything we made, the coolest is
  IMG_0924.jpg. So I want to offer you full freedom: study the result
  yourself and come up with a tab entirely your own. You can call it FREE,
  or CLAUDE, or something else — we usually have 4–5 letters"; "no limits:
  we have three servo actuators in the construction, not only the NEMA17s
  for X and Y"; "canvases not only 20 × 20 and 40 × 40 but also 60 × 80 and
  70 × 100 — they can be done in two runs, though that is a tricky
  construction; maybe make something simple"; "the Crimson Ruby Weave turned
  out the most interesting: it has a texture like Bottega Veneta's. I also
  look at whether it is Instagrammable. Just driving stripes back and forth
  as on CCD turned out less gripping"). IMG_0924 is BIAS SNAKE of
  2026-10-15 15:17 (the run log): 45°, a step of 8 mm, the brush 6 mm,
  three rows, the crossing from the top right, 90 mm/s. **Two layers** (the
  owner, the same evening, on IMG_0921: "two independent runs, and it looks
  dearer than one … first one run with one drawing and a set of our paints,
  then a second run and another direction. But I need to understand that
  the canvas must dry a little") — the drying in `LOOM.md`, never a timer.
  *Claude's*, all of it: the name, a loom; the canvas one cloth, no
  rectangles; BIAS SNAKE's order and its 30 mm off the canvas kept; **the
  weave by the elbow** — where a strip goes under one painted before it,
  the elbow lifts the brush over it on the move: Plain, Twill, Basket, and
  Lattice with none; the lattice from the canvas's centre; layer 2 at first
  twice the step, Lattice, the crossing from the bottom left; **two halves
  turned round 180°** for a canvas past the reach — no measuring: the far
  corner, C, on the stop where the near one, A, was — 30 mm past the middle; the tones Crimson Ruby
  (IMG_0924's), Fall, Azure and Dusk, after his works on SOUMKINE; Angle 45°,
  Step 9 mm (IMG_0924's 8 and room for the hop), Hop 1 mm, Lands and lifts
  over 1.5 mm, Drag 30 mm/s, so the elbow keeps up — ≈ 200°/s of its 211
  (est.); the shortest stretch with the brush down between two lifts twice
  the tail. Not tried on the machine: the hop first on a scrap.
- **INKA, a tab of its own: Inca patterns** (the owner, 2026-10-17, a
  Saturday, `INKA/`: "I came up with a new tab, INKA"; Florian Markus's
  workshop in `master_flo_hires/` — "I am not interested in copying him; I
  only want to adopt his technical techniques — how the paint goes, how the
  gradient comes when the paints mix"; "the fundamental difference: he
  makes race tracks and uses a lot of colours that form a gradient when
  they mix. I have Inca patterns, square, like Mexican rugs or chocolate
  bars"; his paper test and its scheme in `personal_references/`; Heather
  Day in `HDay/` — "I like her colour range and palette, but that cannot be
  done on our plotter … the brown rectangle on the right, a '[' like an
  opening square bracket — I borrowed the pure colour from her, as on
  Painting 12"). After LOOM: TAPE · BASF · ALU-CUT · CCD · BIAS · LOOM ·
  INKA · ALU · SMKN · NOLAN · Test · Ink · Calibration · Library. **Only
  DRAG, one line a figure** ("AIR is not needed, only DRAG, a solid line
  without a lift on one figure. If 6 tiles with beige, orange, ochre, pink
  and yellow — the brush goes on non-stop over the modules. First it paints
  the first square with a spiral, the second, the third … — I show it on
  IMG_1009. Only when all six rectangles are painted the brush lifts and
  moves over to the brown. Here the brush can be lifted up, so that I wipe
  it. On the timer we will have 50 % of the work done. Then I press
  Continue and the brush paints the brown rectangle non-stop"). **CCD's
  paints** ("we have one palette on CCD, BIAS, TAPE — the random offers,
  PAINTS Rect 1 i, New colours / New spokes"). **▶ Play the run, as ALU's**
  ("only the button ■ Stop playing / Play the run needs adding, as it is
  done in ALU"). **Round turns, never a stop** ("they may be not so sharp,
  they only have to be Instagrammable :)"; then: "stop. Braking to zero is
  not Instagrammable — better rounded corners; on a big format it will not
  matter, and a stop of the brush during the process kills the mesmerising
  effect. For the first clients we need traffic from the social networks,
  else advertising costs too much"): every turn a tangent arc, the board
  never stopping on a figure; a figure one block, so PAUSE waits for its
  end. *Claude's choices*: the words tile, block, unit, figure; tiles laid
  over one another one block, one outline — the "[" four rectangles — and
  side by side within 5 mm one figure (est.), a corner only not; the snake
  from the bottom left, up first, as the scheme (Screenshot 12.52.59 PM);
  the first unit from its middle out, the next from its outside in, middle
  to middle across the rings, as the scheme; Corners 4 mm (≈ 31 mm/s through
  a turn), a jog of the brush's half where the path would turn back; the
  wipe over the next figure's start at +45°, the elbow's highest (est.);
  spokes across the rings, Florian's sausages across every lane, at most
  60 mm apart round a unit; a unit its core paint, never its neighbour's,
  now and then a second or an accent, thin; a figure of one unit one pure
  paint — the palette's, or its darkest core but black and white; the
  palette keys Inka (his paper test, IMG_1027), HDay warm and HDay blue
  (Claude's reading in his paints) beside CCD's meta 1 … 4; the Result a
  walk of the brush's five grooves on a grid of the canvas, CCD's lane walk
  in two dimensions, the bristles holding 120 film-mm at most (est.); Brush
  6 mm, Step 7, Drag 40 mm/s; a first visit lays his paper test. The LCD's
  percent goes by the length painted: at the wipe it stands where the
  figures' lengths put it — 68 % on the paper test on 200 × 200, not 50 —
  the reading names it.
  **Nodes, the brush's way by hand** (the owner, the same afternoon, after
  his first tries, `INKA/result/` Screenshot 3.20.43 PM, 3.23.00 PM: "you
  have the brush's way and the colour quite out of control"; "we simply
  did not talk it over and the brush's way went as it pleased, anyhow —
  and we need to set its direction"; IMG_1033 and Screenshot 3.31.29 PM, the
  nodes in red: "let us make nodes … add a nodes key to the TOOLS, N is
  free … on every square I made round points — magnets the nodes hold to
  … the bottom left square (1) I hooked to the centre of the second (2),
  and the third, top right (3), its node goes from the edge of the square
  to the centre. They are set as one wishes, there is no algorithm. The
  one thing: that the magnets work somehow. If you lead the node of the
  top right square (3) down to hook the fourth (4), it turns the outer
  line, whose hook is at the centre"). **⌘C ⌘V** ("for copying the
  squares I need cmd+c and cmd+v — Duplicate is not very handy").
  *Claude's choices*: the magnets a tile's middle and its outer ring's
  corners and sides' middles; a node into a middle, the tile spirals out
  to where the next leaves, into the edge in from there, both on the edge
  in and across, both in the middle out and back across; one way out and
  one in, a later node in the place of the one before, none closing a
  loop; a tile no node touches a figure of its own; N with no nodes lays
  the snake as nodes to change; every tile its **turn**, ↻ or ↺ (*Claude's*,
  on "set its direction"); ⌘V beside the one copied, touching. **!** on a
  tile its nodes both in its middle, or both on its edge (the owner, the
  same afternoon, Screenshot 3.54.39 PM, a node laid in and out of one
  middle by mistake: "maybe such a square should be marked with the sign
  !"; then 3.57.31 PM, put right: "it came out very worthy"): the badge by
  its place in the run, ! in its key, a line in red under Nodes; the run as
  it is, a hint, never a stop. **⌘A** (the owner, the same evening,
  Screenshot 5.11.30 PM: "I need a selection that takes every figure on
  the canvas, cmd+A"): every tile chosen together — a drag moves them all,
  the arrows, ⌫, ⌘C ⌘V with the nodes between them; ⇧ and a click one more
  or one less (*Claude's*); a click on the canvas or Esc lets them go.
  **The brush with paint, the core, the ring change, the X** (the owner,
  2026-10-19, `INKA/update-19-10-2026-1.0.9/`: his canvas of 2026-10-17
  photographed with a ruler — "I am not sure that our brush and the width of
  the paint's trail on the tab match the real canvas exactly … study the
  results and make the adjustment yourself"; "important: I mentioned 9 mm
  several times, though on the screen I set 3.5 mm. We did not take into
  account that the brush is not a felt-tip or a Posca marker. It takes up
  paint, as on Florian's photographs, and swells in volume. We need to
  account for this when we imitate the picture on the screen"). **The
  trail**: the brush and its swell, 5.5 mm by default — set at 3.5 mm, it
  laid 9: the strip from tile to tile 8.5 … 9 mm by the ruler (IMG_1190,
  1191), a tile's paint 1.4 … 4.3 mm past its outline, 2.8 on average
  (IMG_1193, 1194), where the brush's edge had been on it; the outer ring
  its half in, so the paint ends on the outline, the Drag strip and the
  Result as wide. **The core** ("in the centre it has no room left to turn,
  yet the program says it must turn three or four more times — with a 9 mm
  pass it starts to fidget in place. Our machine with a brush has trouble
  with circles anyway, so I propose to cut the passes in the core at any
  brush width. The same at the move to the next square — the brush first
  shakes in place; maybe with a 0.5 mm pencil that made sense, not with a
  9 mm brush"): the rings a step apart until the paint meets in the middle,
  the innermost the trail wide — on his 64 × 63.5 tile nine rings, the last
  9 mm across, where eleven went down to 1.75. **The ring change**
  (Screenshot 2.21.20 PM, three transitions circled: "too sharp. In reality
  the paint lies like this", IMG_1195, 1196; "let the transition be as in
  TAPE or BASF — there it is smoothed from one turn to the next"): from a
  side's middle an S, two arcs, over the side's last stretch — Ring change,
  30 mm, or as much as the side has; from a corner the square spiral as it
  was. **The X** (the same screenshot, his beige tile 1 laid by hand: "the
  paint shown with a cross X — logical and simple; at the corners eight
  times turned out of no use in practice"): New spokes and a first visit lay
  four arms a tile, corner to the innermost ring. *Claude's choices*: the
  swell added to the brush, not a ratio; the outer ring moved in by the
  trail, so a tile on the screen is the paint on the canvas (on 2026-10-17
  the paint went 2.75 mm past every tile, est.) — undone the same evening,
  the outer ring by the brush's half again, after his canvas in a thin
  paint showed 7 … 11 mm gaps between the tiles ("they must adjoin one
  another, as on the screen … such gigantic gaps"): the trail the Drag
  strip's, the Result's and the core's, never the tile's edge; and after
  his second canvas, white still along some sides ("even half-round
  corners should leave a gap only at the corners, the sides must be flush.
  Maybe we make an optical compensation?"): the ring change past the seam,
  so the outer ring runs whole along the edge, and **Edge: out by**, 0 by
  default, the outer ring that much nearer the edge, never past it; after
  his third, 2 … 4 mm of white left ("maybe one more pass on every square —
  let it go overlapping"), **Overlap**, 0 by default: one more ring, the
  outermost, its brush's edge that far past the tile's, on the outline
  grown; the innermost ring placed
  where its paint meets — or, under half a step on, the one before it moved
  there, so no two crowd (est., the swell closing 0.25 mm); the S only at a
  side's middle, Ring change 30 mm (est.); M a click the arm of the X
  nearest it, never twice; Brush 3.5 and Step 3 the new tile's and a first
  visit's, his; the jog where the path turns back the trail's half; the
  Result's grooves across the trail.
  **Reference, a palette off a picture, on every tile** (the owner, the
  same afternoon, Screenshot 4.15.26 PM, twelve tiles, six of them painted:
  "only up to the 6th tile; put 10 and there are no colours :)"; "below we
  have REFERENCE, 📎 Add new reference — pictures with a colour range can go
  there, and it appears on all 10 squares. Important: the reference's
  analysis must match the colours we have in stock"; asked, he chose the
  range dealt on all the tiles, not each tile the colour under it): the
  keys had dealt the chosen tile's figure only, and tiles no node links are
  a figure each. *Claude's choices*: every pixel to the nearest of his 24
  paints in Lab, lightness at half weight (CMC 2 : 1); the core the six
  with the most of the picture, at least 4 % of it, the next three thin, at
  least 1.5 %; dealt by their shares, the paint furthest under its share
  next, a tile never its touching neighbour's in any figure, a lone figure
  one paint; the picture whole, its background counted (× takes a paint
  out); the keys with tiles chosen together act on all their figures. The
  same evening the key went to **OK** in the Reference block, its deal at
  random as from an urn of the tiles, a paint its share of them ("there is
  no random going through the colours, as in meta"): before, the paint
  furthest under its share each time, a press dealing the same again.
  **The spot** (the owner, the same evening, Screenshot 5.10.28 PM, the red
  speck of IMG_1522 gone: "not by which colour has the most area, but by
  which is the brightest speck in the picture, and let it go on one square
  only, never two or three"): *Claude's choices*: the brightest by its
  pixels' mean chroma, C* 45 at least, 0.1 % of the painting at least; of
  the paints not in the core nor within ΔE 12 of one; its like out of the
  accents; its tile at random, all four arms its own; a deal with touching
  tiles of one paint dealt again, 20 times at most.
  **The painting, not the wall; paints to buy** (the owner, the same
  afternoon, `INKA/references/`, twelve of his canvases photographed framed
  on a wall: the reference "broke"; "we have fluorescent colours there,
  intense, but I can buy such … a square of the new 'acid' paint, and in its
  cell on the left in the TOOLS, where all the colours are, a red dot • — to
  buy, or not in stock yet"): the wall had come out the largest paint.
  *Claude's choices*: the painting the box of what differs from the
  picture's outer ring by more than ΔE 15, in 4 % for the frame; CIEDE2000;
  four fluorescents to buy, read off his twelve — Fluo Red, Fluo Pink, Fluo
  Orange, Fluo Lime (est.) — under his 24 in INKA's strip, two a column, a
  red dot; a paint to buy only 1.5 times nearer than his nearest in stock.
- **INKA first; TAPE, BASF, LOOM, NOLAN and Test off the top row** (the
  owner, 2026-10-19, a Monday: "let us do a general cleanup. We need to
  remove the TAPE, BASF, LOOM, NOLAN and TEST tabs"; INKA "is the most
  essential"; asked, he chose INKA first, `index.html`, and the tabs off the
  row, their pages kept, as TYPE's and LOVE's): INKA · ALU-CUT · CCD · BIAS ·
  ALU · SMKN · Ink · Calibration · Library. INKA is `index.html`, the
  server's first page, `start.command` opens it; TAPE's page `tape.html`;
  BASF's, LOOM's, NOLAN's and Test's as they were, the Library opening their
  saves there. TAPE's plan stays wherever it is shared — CCD, BIAS and INKA
  import its paints.
- **ST-JOHN, INKA with ⌘, St. John's Arms** (the owner, 2026-10-19, the
  evening, `St_John/`: "name the tab ST-JOHN and make it exactly like INKA,
  only in the tools between R and N we put ⌘ (Command, St. John's Arms)";
  the old sign, Screenshot 8.23.36 PM — "an interesting solution for us, how
  the brush will go" — his arrows on it in … PM 2, his drawing IMAGE
  2026-10-19 20:22:20; of the rings drawn: "it is just how the brush goes
  over the canvas. There may be 25 of them, it depends on the size of the
  canvas … now we have a 40 × 40 cm canvas"; "the ⌘ sign goes from the
  centre"; `preview.webp`: "roughly how Florian paints, but in our style and
  in one or two colours. Let the brush run on Instagram"). After INKA: INKA
  · ST-JOHN · ALU-CUT · CCD · BIAS · ALU · SMKN · Ink · Calibration ·
  Library. `stjohn.html`, INKA's page module and plan, its own keep and
  Library label; INKA as it was. *Claude's choices*: the lobes the quarters
  of the sign's box, square as INKA's tiles, their turns by Corners; every
  loop the ⌘ in one line — lobes 1, 2, 3, 4 in his numbers, each clockwise
  as his arrows go, their inner sides on across the middle, crossing (the
  grid of his drawing; lobe 1's and lobe 2's lines on one upright on his
  scheme); the outermost loop first, through the middle, then inward; the
  ring change an S on lobe 4's top; ↺ the sign mirrored; J on the keyboard;
  a figure of its own — no block, no figure with tiles, no node; an X on
  every lobe; one paint or two, the second on lobes 2 and 4, half the time;
  a first visit one ⌘ the whole canvas in two paints of Inka. On 40 × 40,
  Step 3, the brush 3.5, 9 with paint: 32 loops, 64.6 m, ≈ 27 min at 40
  mm/s (est.). Not run on the machine yet. **Width and Corners to 50** (the
  owner, the same evening, on the lobes filled to their middles: "I lack
  CORNERS … it must go up to 50 mm. And we need a slider as in ALU-CUT
  called WIDTH — there the loop's thickness can be raised. Now the figure
  came out somehow strange"): Width the loop edge to edge, a window in every
  lobe, the grid in the middle 2 Width across, a new one's an eighth of its
  box — 50 mm, 17 loops, 43.5 m on his 40 × 40; Corners 0.5 … 50 mm on INKA
  and ST-JOHN. *Claude's choices*: on a ⌘ the turns concentric, as a pipe's
  lanes — the outer ring's Corners, each inside its depth less, never under
  4 mm; its X laid again on its loop, its paints kept, whenever its Width,
  Corners or size change. **Corners to 100; the rings round** (the owner, the same
  evening, Screenshot 9.24.56 PM, the roundings he wants drawn in blue:
  "much better already, but Corners can be turned up to 100 mm"; Screenshot
  9.27.36 PM, the windows' rings circled in blue: "the optimal width came
  out 74! … the rings must be really round, not squares as now"): Corners
  0.5 … 100 mm, ST-JOHN's 100 at first, INKA's 4 as before; a ring's turn no
  more than half its side, so at 100 every ring round, the windows teardrops
  pointing to the middle; a new ⌘'s Width a fifth of its box, as his 74 on
  387. **TRACE in MARKS' place** (the owner, the same evening, St_John/
  Screenshot 8.50.53 PM, Florian's canvas traced faint, the sausages over
  it: "where MARKS · DRAG are in the controls — we remove MARKS and put
  TRACE in its place. But see that it coincides perfectly with DRAG, because
  I will dip the same brush in water, only the water slightly tinted, so
  the brush leaves a trail — that is the trace I see and can squeeze the
  paint on, as Florian"): DRAG's own pieces, cut only where the dips fall,
  every 720 mm (est.), each next stretch on from 20 mm back; at DRAG's
  speed; on his 40 × 40 at Width 76, Corners 100: 50.6 m, 69 dips, ≈ 34 min
  (est.). Corners and the reading under i on INKA too ("they are alike").
  **A dip every 1440 mm** (the owner, the same evening, testing, asked how
  far TRACE goes between dips, 720: "1440 can easily be done — it is all
  water here :)"): TRACE_DIP, ST-JOHN's own, NOLAN's, ALU's and TAPE's 720
  as they were; 34 dips, ≈ 27 min on his 40 × 40 (est.).
  **From the top left lobe's window out** (the owner, 2026-10-20, the
  first tests, `St_John/` IMG_1215 — the trace squeezed in blue — and
  Screenshot 10.14.40 AM, the brush in the middle's grid: "our main flaw —
  now it starts from the middle and as it goes it goes to the lobes. We
  need it the other way round", Screenshot 10.29.11 AM and on, his red and
  purple loops: "first the top left lobe, from there it pushes the paint
  into the bottom left. Then into the bottom right"): the lobes renumbered
  in the brush's order, 1 the top left, 2 the bottom left, 3 the bottom
  right, 4 the top right, each clockwise as before — the loop the same line,
  the second paint on 2 and 4 the same lobes; the brush lands on lobe 1's
  innermost ring, round its window, and goes loop after loop outward, the
  ring change an S on lobe 1's bottom, landing in its middle (or where the
  next ring's turn begins, if further on), Ring change long before it, so
  the S's lie one under another; the first loop begins where it ends, the
  innermost ring closed round its window, the last ends where it began.
  *Claude's choices*: where the S lies; ↺, the sign mirrored, from the top
  right. On his 40 × 40, Width 76, Corners 100, Step 3: 49.4 m, 25 loops,
  35 dips of TRACE (est.).
- **Preferences, a gear after Library; TEST 10 mm in, two dots at TL**
  (the owner, 2026-10-20, after the first ST-JOHN tests: "it puts four
  points everywhere, that is all fine. But they have too big a margin —
  20 mm. Let's reduce the margin to 10 mm everywhere — or better, after INK
  / Calib. / Library create a gear (icon), that will be Preferences.
  Second, on the first top point I need two touches of the brush 5
  seconds apart. When I put a new canvas, I do not understand where to put
  it. Two or one point in the test can also go into Preferences"):
  `prefs.html`, the gear ⚙ after Library on every page; `src/prefs.js`, kept
  in this browser (`rembrandt.prefs.v01`), as the lamp's day and night. TEST
  on every tab reads it when pressed: its dots **Margin** in from both edges
  of their corner, 10 mm at first (1 … 100); at **TL, the first corner,
  one dot or two**, two at first, **Between** them 5 s at first (0 … 10, the
  longest wait `rembrandt.py` takes): a dot, the brush up where it lifted,
  the wait, a dot there again, then TR, BR, BL and home. *Claude's choices*:
  kept in the browser, not on the Mac, so `rembrandt.py` is not touched —
  another browser, the phone too, has its own, the defaults the owner's; the
  wait a `wait` block, as the cup's dwell; the brush during it over the dot
  at its lift height.
- **BLEND, a tab of its own: Illustrator's blend** (the owner, 2026-10-26,
  a Monday, `BLEND/`: "we start a new tab with you, BLEND, as in Adobe
  Illustrator, but for our machine. Until now we made figures whose lines
  did not cross but lay side by side"; "the key image in the BLEND folder is
  IMG_1554.PNG — we start testing with it. IMG_1555 and the next ones can
  wait"; "for BLEND take INKA as the base, it has all the menu panels we
  need"). After ST-JOHN: INKA · ST-JOHN · BLEND · ALU-CUT · CCD · BIAS · ALU
  · SMKN · Ink · Calibration · Library. `blend.html`, INKA's page module and
  plan, the blend's `blendplan.js`, its own keep and Library label; INKA and
  ST-JOHN as they were. *Claude's choices*: IMG_1554 read as three keys — A,
  a square three eighths of it against its top, the orange core against that
  one's bottom — 13 steps between each two, one corner for all, 3.86 % of
  A's side (off the picture: the lines 19 and 38 px apart outside, 7 and 14
  inside, the outer ones' tops on A's, the inner ones' bottoms on the middle
  key's); a blend a rectangle of its own kind, its keys in A's fractions,
  every key its Corners; every shape a loop of the brush, its edge on the
  outline as a tile's outer ring, the outermost first and every next over it
  — as a blend's front objects lie over its back ones — one line, the S on
  the side where the loops lie nearest (IMG_1554's top), the S's in one
  column; the core filled, a figure of its own after a wipe, from its middle
  out, its pure paint; B on the keyboard; a click in a key chooses it, its
  own handles, A's stretching the whole; INKA's deck, MARKS · DRAG; its X
  along every corner's way through the loops' turns, the outer half one
  paint, the inner half another — the paint going over as the shapes do —
  the core its own, the spot or the pure paint; a first visit IMG_1554 in
  black and orange. On a 40 × 40: 28 loops, the core's 6 rings, 16.3 m,
  ≈ 7 min at 40 mm/s (est.). Not run on the machine yet.
- **BLEND's sausages all round, its paints in patches off a reference;
  several references** (the owner, 2026-10-26, the same day, `BLEND/`
  Screenshots 11.43.09 and 11.43.17 AM, the X's Result on a 60 × 60 dry over
  most of the loops: "let's fix the colour palette and the sausages … no,
  unfortunately a plain X will not do here. Too much empty space stays
  unpainted"; IMAGE 2026-10-26 11:55:05, soft clouds of pink, peach, orange,
  lilac and navy, among fourteen pictures of colour ranges: "I need an
  algorithm that turns it at random into such a colour range — but our tool,
  REFERENCE over the canvas, as tracing paper, needs work. Study it and
  propose your solution"; "I like how you made Blend 1 / Key 1 / Key 2 /
  Key 3 — REFERENCE needs the same"). *Claude's choices*: spokes all round —
  every side of A's loop parted evenly, corner to corner, no further apart
  than the brush carries a sausage's paint, half way from the line full to
  the paint gone at the Density (≈ 95 mm at 50 %, est.), from each place
  across every loop to the same place on the last, the same piece of it and
  share of that piece, straight from key to key, cut in pieces no longer
  than that: 16 spokes, 45 sausages and the core's X on a 40 × 40, 20 and
  76 on a 60 × 60; phase 0 a spoke on every corner's apex, New spokes
  moving them on along the sides, each new one the paint of the old one
  nearest; the palette in patches — every core paint its share of the
  sausages, an accent 4 % of them, thin, grown at random from seeds (one a
  8) over every sausage's 5 nearest — a press a new deal; the core the spot,
  else the pure paint; an X from before laid anew as spokes. The reference
  read in tints on BLEND: every pixel the paint, at 0 · 30 · 55 · 75 · 88 %
  white over it in linear light, nearest by CIEDE2000, its share the
  paint's by how much of it, the rest White's — IMAGE 11:55:05 White 37 %,
  Rose Azo 14, Purple 12, Ultramarine 10, Pink 5, 04 5; Orange, Black,
  Magenta thin; the spot Orange Yellow (read plain: White 44, Pink 15,
  Purple 11, Ultramarine 7) — INKA and ST-JOHN read plain, as before. A
  phone's status bar off every reference: rows of one colour at the top or
  the bottom, no more than 6 % of it (its grey had come out Viridian).
  Reference 1, 2 … under the block's heading on INKA, ST-JOHN and BLEND,
  the chosen one over the canvas and OK's, its palette under the block —
  its paints and shares, the thin ones, the spot; 📎 adds one and chooses
  it, × takes the chosen one away; kept in the browser's IndexedDB, a list
  a tab, the one kept before the first.
- **A blend's Spokes its own, never the Density's; the core's Step moves
  the core alone** (the owner, 2026-10-26, the same afternoon, Screenshots
  12.57.59, 1.03.27 and 1.03.40 PM, his Density 86 %: "I see the 60 × 60 has
  just 20 spokes; 76 and 4 I do not see"; "I added rings to the core (key 3,
  core) — it was 15 / 12, now STEP, THE CORE'S RINGS 3 — and all the spokes
  fell apart"; "changing the core's rings' Step must work out its inner way
  again and, if need be, its own paint; the outer spokes, their pieces and
  their paints must stay. Now the change lays the spokes all anew by the
  Density, and a composition already set up falls apart"). The spokes had
  been laid as far apart as the Density carries, and every change of the
  blend laid them again — at 86 %, 262 mm, two a side. *Claude's choices*:
  **Spokes** in the blend's panel (4 … 80 by the slider, to 200 typed), the
  blend's own, shared out over A's sides by their lengths, none set one
  every ≈ 95 mm (Density 50 %'s reach), the Density never moving them; its
  reading under **i**: how many, on which sides, how far apart, and dry
  between them where farther than the paint carries; the core's Step: the
  core's X laid again on its rings, its paint kept, every other sausage as
  it lies, its pieces and paints; keys, Steps, Corners, Core filled · empty
  and Spokes: the spokes laid again, each piece the paint of the old sausage
  nearest it; a run of one paint along a spoke, key to key, one sausage, so
  the sausages are what is seen.
- **K1 · K2 in turn, every contour once, the brush in the air between**
  (the owner, 2026-10-26, the evening, after the first run in paint,
  Screenshots 8.51.21 and 8.51.38 PM, his drawing 8.53.35 PM: "everything is
  fine, but we need to change how K 1 and K 2 are built. Now they go one
  after the other — first the big square is built whole, at its top the
  lines always meet in one, and then the inner Key 2 is drawn. But with
  paint it gathers in little hills at the top"; "the first contour drawing
  Key 1 comes to the middle at the top and leaves it. Instead of going on
  with Key 1's big contour into the second spiral, it draws Key 2 straight
  away, and only then from the middle of the top goes on to Key 1 … one line
  of Key 1, then one line of Key 2, then K1 again, and so in turn"). Claude
  first kept it one line, an S from loop to loop — rejected the same hour,
  Screenshots 9.28.24 and 9.29.47 PM, the line traced in green: "no, not
  that … it goes down without a lift right over the host and makes a circle
  not needed. The idea was just to keep from such an overlap. The brush must
  lift, to draw this going over in the air"; "the right test here: every
  contour of the blend drawn once, K1 and K2 in turn, the moves between
  them in the air. The tops of the contours where they meet stay — the lift
  takes away just the passes that join them, not needed". So: the loops
  between every two keys a series, a loop of each in turn, the outermost
  series first, every loop a stroke of its own — it lands in the middle of
  its top (the side where Key 1's loops meet), goes round once to there,
  lifts, and goes in the air to the next; DRAG a row a loop, the brush up and
  on between them, no wipe till the core. *Claude's choices*: every landing
  on one column, the middle of the narrowest loop, so the brush goes over
  straight up and down; two radii clear of a loop's corners, or, not so on
  that column, one, those two turns a little tighter; no lap over the
  landing (each contour once); a blend of one series one line, as ever;
  **K1 · K2 in turn · Key after key** in the blend's panel, in turn at first;
  the spokes and their paints as they lie. His blend: 52 landings, 56.1 m,
  ≈ 28 min at 40 mm/s, key after key 55.9 m, ≈ 24 (est.); no S, no white
  left inside A; Key 1's 26 loops still meet on A's top and land on one spot
  there.
  **Key 2's from 6 o'clock** (the owner, the same evening, Screenshot
  9.44.16 PM, a red ring over the core: "you did Key 1 right, but stumbled on
  Key 2 … your join, the start and the end, is OVER the yellow cross, just
  where an even line is needed, as below on Key 1. Turn the building of the
  second axis upside down in Key 2: on a clock face you start at 12 noon —
  start at 6 in the evening! Then the brush's lifts hide under the yellow
  cross and all the lines are smooth"): every series lands in the middle of
  the side where its own loops meet in one line — Key 1's on A's top, Key
  2's on Key 2's bottom, under the core — the join under their paint, every
  other side smooth; the brush in the air between, straight up and down the
  column. His blend: ≈ 29 min (est.).

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
  the owner squeezes by hand, "Marks is not needed". **A spoke six lanes
  at most** ("I do not lay the colour as an even sausage over the whole
  length. It wants breaking into 6 lines at most; I will make 12 myself, one
  after another, as a dashed line — and 18 too; then one fragment at the
  bottom may have one colour, or two, or three"): a click lays the block of
  six under the pointer, lined up with a spoke lying there; a drag six at
  most. **New colours, as ALU's** (the owner, the same evening, `TAPE-colors/`,
  eleven striped canvases: "I need an algorithm as for ALU, so that I click
  a key and the palette changes at random … but ours will be with our own
  paints and the spiral round the cassette"): eight families read off the
  references in his paints (*Claude's reading*: Ice, Ember, Signal, Cream,
  Blush, Sky and rust, Carnival, Dusk), a family's core carrying the tape,
  its accents thin; New colours picks another family and three to five of
  its core paints, the spokes lying there taking them — or, none lying,
  new ones laid; New spokes lays four to eight spots round the cassette, a
  dash a block of six lanes out to the canvas's edge, now and then its last
  two lanes an accent, the palette as it is; two dashes on a radius never
  one paint. The palette and its seed kept with the save.
  **Density and the spoke's lanes** (the owner, the same evening, his
  screenshots 6.49 … 6.52 PM in `TAPE-colors/`, a reference beside the
  Result: "they are somehow thin. The reference has rich colours, grown-up.
  We need a density of colour slider, to come near the original"; "use the
  sausages of colour not only over 6 lanes but over 2; I would try 1 lane
  at all — such paints there are"): **Density**, 0 … 100 %, the paint in a
  spoke ½ … 64 times SPOKE_MM, 50 % by default (est.; before, about 14 %);
  **Spoke: 1 lane · 2 lanes · 6 lanes**, for a click and New spokes; **the
  paints in use in sight**, a chip, a name, its spokes, thin marked ("what
  is useful to see here is the chosen colours with numbers or names"), the
  rest under the Paints' i. **The pattern, not a daisy** (the owner, the
  same evening, his collage `TAPE-colors/Screenshot-…6.51.00 PM-.png` and
  the paper test of 2026-10-08 photographed again, 19:23: "your density
  changes at random, and the drawing is always the same"; "strictly on every
  corner two spokes"; "the reference is a mix"; "we did not count that the
  distance from the cassette makes a different drawing. The nearer the
  cassette, the richer the colours; the farther, the colour comes to
  nothing. So the number of spokes must not be random. Only the palette
  changes, the sausages stay in their places; and they are built not as a
  daisy, petals from the cassette, but with what we know from the 8 October
  tests — the brush runs out after 7 cm; the pattern must be made with
  that"): stripes of lanes, 6, 3, 2 or 1 wide, mixed; each through spots at
  both ends of every corner, and more where its outer lane would go RUN_MM,
  70 mm, without paint — MARK_MM, 60 mm, apart at most, the paper test's
  (`ALU-Claude/paper-test/`, ALU's run and spacing) — so the longer outer
  lanes get more spots; along a stripe the paint changes at every spot.
  New colours repaints the spokes in their places; New spokes mixes the
  stripes anew, the spots as the rule says. **The Result after the owner's
  ideal** (`TAPE-colors/meta-tape-01.jpg`, the same evening: "much better
  already! but I would take the sausages themselves off the Result, let them
  be on Drag only"; "and take away 1 lane, 2 lanes, 6 lanes — better an
  option to add or change a colour among those chosen"): the spokes on Drag
  only; every lane five grooves, each its own pick and breath, its colour
  dragged forward 5 … 45 mm, lane by lane, its brightness wandering — the
  changes torn into streaks (est.); a ring holds its tone, dark and light in
  turn; an accent a fleck, a third of the paint; the lane keys gone, M laying
  the pattern's stripe under the pointer, else six; in the paints' list a
  click and a paint in the strip change one, + adds one, × takes one out.
  **meta 1 · meta 2** (the owner, the same evening, `meta-tape-02.jpg`
  beside the first: "maybe you can take something from them for new keys,
  meta 1 and meta 2, in place of 1 lane, 2 lanes"): his two ideals as
  palettes in his paints (*Claude's reading*) — meta 1 ultramarine, 04,
  sky, white, black, 03, orange, orange yellow and purple flecks, the first
  ring white and sky; meta 2 purple, black, pink, sand, white, orange,
  ochre, ultramarine, red and rose azo threads, the first ring ochre and
  orange, gold — a press a new deal in it, the spokes in their places. The
  spokes are a map for his hand only, never run (the owner: "it is only
  visual, we have no marks! I will squeeze onto the canvas quickly").
  **The cassette may go: Cassette size from 0 %** (the owner, the same
  evening, on the Result in meta 2: "OMG!!! Claude, this is incredibly
  beautiful!!! We did it"; then: "wait… why do we need the cassette at all
  now? We seem to have outdone ourselves. First we gave up drawing the
  cassette, kept only its outline. Now maybe — Adjustments, Cassette size,
  the limit there is 80 % — take it to 0 %? … I woke up this morning with
  the idea of parting CCD, which is for Melnicomm, from Soumkine, and the
  cassette was a fine answer — its tape suits Soumkine's vibe perfectly.
  But when we had made the tab I was lost: I have 18 jars of paint and a
  few of my own mixes. Doing as Florian does — making mud — I did not
  want. So we took up a special algorithm. It came out so cool that the
  cassette only cheapens it. Without the cassette, contemporary art of an
  amazing shape"): Cassette size 0 … 130 %, at 0 % no cassette, no outline
  in TRACE, the tape wound from the centre — its shape as Corners says,
  circles at Cassette, squares at Angle; a small one, a window the inner
  lanes round and the outer ones near circles. Spots at a corner's ends that
  coincide, the sides gone, are one.
  **BASF, a tab of its own: the tape wound to the middle** (the owner, the
  same evening: "it all decided itself. We really need a new tab, but there
  is a nuance. Let's call the new tab BASF, in honour of the cassettes gone.
  And leave the winding at 100 % where the cassette is now. We will reduce
  nothing, because I tried — reducing drags our layout of the paint drops
  along. Just grow the spiral inwards, so that without touching Cassette
  size (100 % by default) the spiral winds on to the middle of the canvas.
  Then on Drag we lead the sausages to the centre, and in the Result we have
  the same proportion, but the wound tape in the centre"): after TAPE in the
  top row; TAPE as it is. Lanes inside the cassette's lane 1, true offsets
  inwards, one pitch apart, the first at the middle; the lane change as the
  cassette's lane has it; no cassette drawn, none in TRACE, its section off
  the panel; the pattern and the presets as TAPE's, a preset's first ring
  the middle's. TAPE's page module and plan (*Claude's choice*: a fix
  reaches both, as SMKN's and ALU's). **Then squares** (the owner, the same
  night, his screenshot 8.15.45 PM, the short rectangle in the middle
  ringed: "our canvas is 20 × 20, and with no cassette there is no need to
  break the width and height in its memory. You can make a square with
  round corners at once; such sharp corners I will not make with a brush
  anyway"): every lane a rounded square, all of one shape, from the middle
  out, the innermost half a brush across; Corners the corner's share of
  the half-size — half at 0, squares at Angle, circles at Round; the sides
  one pitch apart, the corners a little wider, 0.41 of the straight share
  of a pitch (*Claude's*: lanes rounded to the middle cannot all touch);
  the lane change reckoned on the lane about 40 mm out (est.); Cassette
  size and First lane off the panel.
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
  **v.1.0.9**, then the tabs **INKA · ST-JOHN · BLEND · ALU-CUT · CCD · BIAS ·
  ALU · SMKN · Ink · Calibration · Library** (BLEND after ST-JOHN since
  2026-10-26; ST-JOHN after INKA since the evening of 2026-10-19; INKA first since 2026-10-19, TAPE, BASF,
  LOOM, NOLAN and Test off the row then; INKA after LOOM since 2026-10-17; LOOM after BIAS since 2026-10-16, Claude's own; BIAS after CCD since 2026-10-15; TAPE first and BASF after it since 2026-10-12; ALU-CUT
  first from 2026-10-11, TYPE and LOVE off the row then, CCD after it; LOVE since 2026-10-07, ALU and SMKN since
  2026-10-08; Create hidden since 2026-10-04, Adjustments since 2026-10-05,
  Job and New Yuri since 2026-10-06, §1), and after Library the gear ⚙,
  **Preferences** (2026-10-20, §1), on every page; and on
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
- **The phone** (2026-10-13, v.1.0.7): up to 760 px wide, or 500 px high
  lying down, every page one column that scrolls — the top row's tabs slide
  sideways, the current one in sight; the zoom; the board the screen's
  width (lying down its height); the tools in a row; the panel; the status.
  TAPE and BASF upright: the paints two rows of 12 under the board. The
  Mac's page as it was. The phone reaches the Mac through a view-only
  bridge on port 5165 (reading only; runs and saves stay on the Mac).
- **Format** — the canvas laid on the image area: **500 × 700** (default),
  **600 × 800**, **400 × 600** and **400 × 300** mm (the last two the owner's,
  2026-10-02); 700 × 1000 is out of reach and gone. Drawn as on the
  RUBENS Calibration tab (`references/Screenshot 2026-09-30
  calibration.png`): the canvas inside the image area, the walls dashed,
  hatched where the machine does not reach (600 > 568.5 mm across). The
  status bar names both: `Canvas 500 × 700 · image area 568.5 × 865 · …`.
- **NOLAN**, the first tab, in Create's place (2026-10-04), off the top row
  since 2026-10-19 (§1): ribbons of
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
- **TAPE**, the first tab from 2026-10-12 to 10-19, then off the top row (§1;
  `app/tape.html`, `app/src/tape.js`,
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
  the owner's paints a strip by the Tools, two columns of 12, a chip a
  paint, its name on hover, its spokes counted under it; Paints in the
  panel — **New colours · New spokes**, **meta 1 · meta 2**, Density, the paints in use — a
  click and a paint in the strip to change one, + to add, × to take out —
  the palette and the spokes under its i. 💾 SAVE TAPE, the Library opening it
  here: an SVG centred on the canvas, its layers cassette (its SVG nested
  as it is), trace-cassette (its outline), trace-tape and drag-tape, lines
  and arcs.
- **BIAS**, after CCD (2026-10-15, §1; `app/bias.html`, `app/src/bias.js`,
  `app/src/biasplan.js`): CCD's page — its rectangles, the strip of paints,
  M, the deck **TEST · PAUSE, MARKS · 45 Snake · 45 Air, Snake Plain → ·
  Snake Plain ↑ under them, 90 Snake · 90 Air, Bias Snake · Bias Air, STOP ·
  HOME** (45, Plain and 90 since 2026-10-16), INK, the views **Drag ·
  Result** and **45 Snake · Plain → · 90 Snake · Bias Snake** over **45 Air ·
  Plain ↑ · 90 Air · Bias Air** — every rectangle laid with diagonal lanes,
  straight ones, or upright and across at 90.
  A rectangle's own: **⊥ Square · ✕ Mirror**, **Crossing ↘ from top right ·
  ↖ from bottom left** (the BIAS keys'; on Drag their lanes numbered in their
  turn, the rising in ink, the crossing in rust), **Angle**
  (5 … 85°, 26.6), **Step** (1 … 200 mm, 32), typed or by the slider, as
  CCD's Lanes, **Rows** (2 … 12, 3), its place and size by the ruler. Drag:
  every lane a faint strip, where the brush comes in an orange dot and its
  run's number — 1 and 2 in ink, 3 and 4 in rust — an arrow the way it
  goes, the snake's turns dashed; the sausages on the edges and rows, MARKS'
  dashes under them. Brush, DRAG: Brush width (6 mm), Drag speed, Lands
  before the edge, Lifts past the edge, **Snake: turns off the canvas**
  (2 mm, est.), **BIAS: off the canvas** (30 mm, the owner's), **Margin
  round the canvas** (25 mm, the owner's), drawn round it. The reading
  counts every run's lanes; with the canvas on a wall a warning — the snake's turns there would run along its edge over
  the lanes' ends — and how far off the walls to lay it. 💾 SAVE BIAS, the
  Library opening it here.
- **LOOM**, after BIAS from 2026-10-16 to 10-19, then off the top row (§1;
  `app/loom.html`, `app/src/loom.js`,
  `app/src/loomplan.js`; how to run it, `LOOM.md`): BIAS's page with no
  rectangles — the cloth is the canvas. Tools: M and its clear, Undo, Redo.
  The deck **TEST · PAUSE, MARKS · Snake · Air, STOP · HOME**, INK, the
  views **Drag · Result** and **Snake · Air**, all for the layer chosen. The
  panel: **Layer 1 · Layer 2** (1 and 2 on the keyboard); **Plain · Twill ·
  Basket · Lattice**; **Crossing ↘ from top right · ↖ from bottom left**;
  **Angle** (45°), **Step** (9 mm), **Rows** (3); the layer's paints — the
  tones **Crimson Ruby · Fall · Azure · Dusk**, New colours, New spokes,
  Density, the paints in use; **One run · Halves ↔ · Halves ↕**, the reading
  saying whether the canvas fits the reach; Brush, DRAG: Brush width (6 mm),
  Drag speed (30 mm/s), **Hop: clear of the strip** (1 mm, est.), **Lands and
  lifts over** (1.5 mm, est.), Snake: turns off the canvas (2 mm), Off the
  canvas (30 mm), Margin round the canvas (25 mm), **Halves: past the
  middle** (30 mm). Drag: every stretch with the brush down an opaque strip —
  the rising grey, the crossing rust — in running order, so the hops show
  the weave; layer 1 faint under layer 2; the landings, the arrows and the
  flights as BIAS's; the middle of a halved canvas shaded. Result: layer 1,
  and on Layer 2 the second over it, a tuck's shadow where a strip dives
  under. A warning when the elbow cannot keep up with the hops. 💾 SAVE
  LOOM, both layers, the Library opening it here.
- **INKA**, after LOOM (2026-10-17), the first tab since 2026-10-19 (§1;
  `app/index.html`, `app/src/inka.js`,
  `app/src/inkaplan.js`): CCD's page — the tiles CCD's rectangles, R a
  tile, V moves and stretches it, the edges snapping; M and the strip of
  paints; **N**, the nodes: every tile's magnets — its middle a dot, its
  outer ring's corners and sides' middles rings — a drag from one to one of
  another tile a node, a click on a node chooses it, ⌫ takes it away;
  **K**, the knife, under it (the owner, 2026-10-19: "Clear nodes is a
  sledgehammer, and I need a scalpel :)"): a line dragged across the canvas
  cuts every node it crosses, orange as it is drawn, a click one node;
  ⌘C ⌘V a tile, or the tiles chosen together — ⌘A all, ⇧ and a click one
  more — in a dashed box with their size, moved, copied and taken away
  together. The deck **TEST · PAUSE, MARKS · DRAG, STOP · HOME** (ST-JOHN's
  TRACE · DRAG), INK, the
  views **Drag · Result**, **Flights** Off · On under them — the flights
  between figures on Drag, OFF by default (the owner, 2026-10-19: "I do not
  really need them … I just use NODES") — and **▶ Play the run** (■ Stop
  playing while it plays, ALU's). The panel: the tiles as keys — □ a tile, ▣ in a
  block, F and the figure's number — **Nodes**: From the snake · Clear
  nodes, the chains and the tiles alone — the chosen one's **↻ Clockwise ·
  ↺ Anticlockwise**, **Step** (1 … 100 mm,
  3; typed or by the slider), **Corners** under it (0.5 … 100 mm, 4, the
  canvas's; out of Brush, DRAG since the evening of 2026-10-19, as on
  ST-JOHN), the reading of its figure under an **i** by its name, its turn in the
  run, its rings, out or in, its place and size by the ruler, Whole canvas
  · Duplicate (beside it, touching: the same figure), Run earlier · Run
  later (a figure runs in the order of its first tile) · Delete; **Paints ·
  Figure n** — New colours · New spokes, meta 1 … 4, **Inka · HDay warm ·
  HDay blue**, Density, the paints in use (CCD's list, the chosen figure's) — the
  keys on every figure of the tiles chosen together; **Reference** under
  them since 2026-10-19 (the owner: "near Paints … so it is all logical"),
  the image over the canvas, its opacity and **OK**, a deck key beside it
  ("in the style of MARKS / DRAG"): its palette on every tile, dealt anew
  at every press;
  Brush, DRAG: Brush width (3.5 mm), **With paint** (+5.5 mm, the trail
  beside it, 9 mm), **Edge: out by** (0 mm, the outer ring's place beside
  it), **Overlap** (0 mm, off; one more ring that far past the edge), Drag
  speed (40 mm/s), **Ring change** (30 mm), **One figure: tiles
  apart up to** (5 mm), **Wipe: the brush up to** (+45°); the canvas; the
  file, every figure a path. Drag: every figure's path a faint strip the
  trail's width — the paint to the tile's edge — and its centre line, an orange dot where it lands, a ring where it
  lifts, an arrow where it comes onto every tile and its place in the run
  (1·1 … 2·1, in its top right corner), the nodes in red, an arrow their
  way, the flight to the next figure dashed blue with Flights ON, ❚❚ wipe; the
  sausages in their paints over MARKS' watercolour. Result: the brush
  through the sausages, the paints mixed as pigments (est.). The reading:
  the figures, their lengths and rings, DRAG's time, the wipes and where
  the LCD stands at each. 💾 SAVE INKA, the Library opening it here.
- **ST-JOHN**, after INKA (2026-10-19, the evening, §1; `app/stjohn.html`,
  INKA's `inka.js` and `inkaplan.js`): INKA's page, all of it, and **⌘**
  in the Tools between R and N, J on the keyboard, its key's label ⌘: a
  drag lays the sign, as R a tile — V moves and stretches it, its four
  lobes dashed in its outline; ⌘C ⌘V, Whole canvas, Step, ↻ · ↺ as a
  tile's, and under Step its **Width** (1 mm … half a lobe by the slider, to
  500 typed; ALU-CUT's pipe's; a new one's a fifth of its box) and **Corners**
  under it, up to 100 mm, ST-JOHN's 100 at first — the construction, not
  the brush, so on ST-JOHN not under Brush, DRAG (the owner, 2026-10-19),
  one value for the whole canvas as on INKA. The chosen one's reading under
  its **i**, by its name (the owner: "this text we hide under (i)"); both
  on INKA too since the same evening ("they are alike"). The panel's keys ⌘ n;
  the reading of the chosen one its loops, from lobe 1's window out, the
  lobes 1 ↖ 2 ↙ 3 ↘ 4 ↗, its Width, the windows and the grid. Drag, Result, ▶ Play the
  run and DRAG as INKA's, the ⌘ one figure, a wipe before the next. The deck
  **TRACE · DRAG**, TRACE in MARKS' place: DRAG's own line, with INK ON in
  tinted water, a dip every 1440 mm; on Drag a blue ring where it goes on
  after a dip, no MARKS dashes under the sausages; the reading its length,
  dips and time.
  A first visit: one ⌘ the whole canvas, two paints. 💾 SAVE ST-JOHN, the
  Library opening it here.
- **BLEND**, after ST-JOHN (2026-10-26, §1; `app/blend.html`, INKA's
  `inka.js` and `inkaplan.js`, `app/src/blendplan.js`): INKA's page, all of
  it, and **B**, the blend, in the Tools between R and N, B on the keyboard:
  a drag lays one, IMG_1554's three keys, A the box dragged, its corners
  IMG_1554's share of it to half a mm. Its keys dashed and rounded as they
  are; a click in one chooses it — orange, its own eight handles, a drag in
  it moving it alone, snapping to A's and the other keys' edges; in A
  outside its keys, the whole blend, A's handles stretching it with its keys.
  The panel's keys ⧉ n; the chosen blend's ↻ · ↺, **Key 1 · A … Key n ·
  core**, **+ Key** (half way between the chosen and the next) · **− Key**,
  **Steps** (1 … 60 by the slider, to 200 typed; 13), **Corners, key k**
  (0.5 … 100, to 500 typed), **Step, the core's rings** with the core
  filled, **Core filled · Core empty**, the chosen key by the ruler, Whole
  canvas · Duplicate, Run earlier · Run later · Delete; its reading under
  **i**: its loops, the side its S's go on, how far apart the loops lie —
  white between them where wider than the trail, the paint over the paint
  where nearer — the core's rings. Drag, Result, ▶ Play the run and MARKS ·
  DRAG as INKA's, the core's badge in its own corner, a wipe before it. A
  first visit: IMG_1554 on the canvas, its loops black, its core orange.
  💾 SAVE BLEND, the Library opening it here. Its sausages spokes all round
  in pieces, its paints in patches (2026-10-26); the Reference block, as
  INKA's and ST-JOHN's, **Reference 1 … n** over the thumbnail, the chosen
  one's palette under it, read in tints. **Spokes** after Corners and Step;
  **K1 · K2 in turn · Key after key** over Core filled · Core empty (the
  evening of 2026-10-26), its reading under **i**: every contour once, where
  each series' loops land, how many landings; with Flights ON the brush's way in the
  air from loop to loop, dashed.
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
- **Test**, a tab between Job and Adjustments (2026-10-02), off the top row
  since 2026-10-19 (§1), the page kept: the test bench —
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
