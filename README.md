# Rembrandt — read this first

For Claude in VS Code, and for the owner.

Rembrandt plans paintings for the machine CNCDM-001: which tube, how much,
where, in which layer. It is the successor of RUBENS (`Forma78/Rubens`,
frozen at v0.1.3) and reuses its Calibration and Job.

## Read in this order

1. This file.
2. **`Rembrandt.md`** — the spec. Its glossary (§0) defines every word;
   §1 is decided and is not proposed again.
3. **`design/create-tab.html`** — the UI, five screens. Open it in a browser.
4. From RUBENS, for the parts we reuse: `../Rubens/rubens-preview/HANDOFF.md`
   and `../Rubens/Rubens_v2.md`.

## Folder layout (target)

```
Rembrandt/
  README.md          this file
  CLAUDE.md          points Claude here
  Rembrandt.md       the spec
  NOLAN.md           the NOLAN tab's task (2026-10-03)
  LOOM.md            LOOM: how to run it, DRAG and the technology (2026-10-16)
  OPM-N.md           OPM-N's task and its decisions (2026-11-01, from the talk with cloud-Claude)
  CHANGELOG.md       what changed, newest first
  nolan-images/      the pictures NOLAN is made for
  RoArte/            the owner's hand tests of the brush and the paint for OPM-N (2026-11-01)
  FORM-G/generator/  how FORM-G's paintings are made, on this Mac, at the owner's request; not part of the app; a new picture only by GEN-F → genfpic.py (2026-11-16)
  FORM-G/photos/     the owner's iPhone photos of FORM-G's runs, a folder a day, pushed by cloud-Claude; listed in FORM-G/PHOTOS.md (2026-11-16)
  FORM-G/eyes/       the machine camera's frames of FORM-G's runs, cut from its films, a folder a day; listed in FORM-G/PHOTOS.md (2026-11-16)
  GEN-F/             the sketches the owner approved on GEN-F, a json each, for the generator's final work (2026-11-16)
  GOGH/              GOGH's start: the owner's photos of FORM-G's cola on canvas and their crops, of the new brushes (2, 3, 5 mm) and the 2 mm's strokes, the painters shown for it (on this Mac alone), the GEN-V sketches; generator/genvpic.py, a sketch into a card of GOGH (2026-11-22)
  HOLO-Claude/       HOLO's task from cloud-Claude (HOLO.md, its sheets and study) and generator/, its pictures in the owner's jars (2026-11-12)
  HOLO-Claude/photos/  the owner's iPhone photos of HOLO's runs, a folder a day, pushed by cloud-Claude; listed in HOLO-Claude/PHOTOS.md (2026-11-14)
  HOLO-Claude/eyes/    the machine camera's frames of HOLO's runs, cut from its films, a folder a day; listed in HOLO-Claude/PHOTOS.md (2026-11-14)
  HOLO2/             the owner's drawings for HOLO2 (Untitled-18 … 20, his blue ribbon lines) and generator/, its pictures off them in his jars (2026-11-20)
  design/
    create-tab.html  the UI design (downloaded from the design canvas)
  adjustments/       Sonnet's four layers on 500 × 700, the Adjustments tab's start
                     (app/adjustments links to it, so the server sees it)
  rembrandt.py       starts app/rembrandt.py from here
  firmware/
    CNCDM-001/       the board's firmware (from RUBENS, Rembrandt's since 2026-10-02)
  app/
    index.html       Rembrandt's home: goes on to GOGH, gogh.html (2026-11-25; to OPM-N from 2026-11-04)
    inka.html        INKA, Inca patterns: tiles a spiral each, the brush on through a figure without a lift, a wipe between figures (new, 2026-10-17; the first tab, index.html, from 2026-10-19 to 11-04, then off the top row; INKA/)
    stjohn.html      ST-JOHN, INKA with ⌘, St. John's Arms: four lobes, every loop round all of them from the top left lobe's window out, their inner sides across the middle (new, 2026-10-19; INKA's inka.js and inkaplan.js; St_John/)
    blend.html       BLEND, INKA with Illustrator's blend: keys and Steps shapes between every two, every shape a loop of the brush, the outermost first and every next over it, the core filled (new, 2026-10-26; INKA's inka.js and inkaplan.js, its blendplan.js; BLEND/)
    dache.html       DACHE, BLEND in coloured pencils on paper: BLEND's page, all of it; the Result the colour the pencils draw (new, 2026-10-27; INKA's inka.js and inkaplan.js, blendplan.js; DACHE/)
    opm.html         OPM, Optical Pigment Mixing: the machine draws thin contours in coloured pencils, a person paints them in — cells by the blend's own geometry, the loops' bands cut by the sausages' strips, every one its pencil, its paint; or Merged, one pencil's cells one area (new, 2026-10-27; inka.js and opmplan.js; OPM/)
    opmb.html        OPM-B, OPM bigger for the 60 × 60 cm canvases: rows 6 mm at least, the rays 10 mm wide, the pencil off the paper between contours, four rounds (new, 2026-10-28; OPM kept as it was)
    opms.html        OPM-S, OPM for the small canvases, OPM as it is and two things more: FRAME by TEST, the picture's outer contour alone, to lay the canvas straight by it; DRAW BW · DRAW CLR in a row, every contour in one pencil without a change, or the colours as before; Align and the ground in a second column of the Tools (new, 2026-10-28; OPM and OPM-B kept as they were)
    opmw.html        OPM-W, OPM-S for wood, all of it, and no arc: every corner of the loops, the keys and the frame in straight pieces, Corner facets, three at first — to cut in wooden sticks or foam board and glue on (new, 2026-10-28, v.1.1.2; OPM-S kept as it was)
    opmp.html        OPM-P, OPM-W for paint: every block — a side, a facet of a bevel — its own rows the brush apart, ending on the blend's perspective rays, bound by its bands (12 mm = 6 + 6); every line once, the rows block after block first, then the rays; DRAG in DRAW CLR's place, a colour at a time with one brush, Rubs times, a pause between; PAINTING MACHINE with its ELBOW LIVE (new, 2026-10-29, v.1.1.3; OPM-W kept as it was)
    opmn.html        OPM-N (Numbers), OPM-P with the cells numbered: every cell of a colour its number, from the centre clockwise, painted on its own by a thin brush that takes its paint from the cup, the owner's DIP from an iPhone remote, every dip in a journal (new, 2026-11-01, v.1.1.8; OPM-N.md; so far OPM-P's page under its own name, the cells numbered, DRAG by cells in their tracks, Snake · Air; OPM-P kept as it was)
    form.html        FORM, OPM-P for figurative painting: the forms off a photo — Auto forms, the background left out — every form OPM-P's rings and rays (the straight skeleton), its cells the photo's colours; metal, glass (its rings rounded inside, a curl in the middle), rubber; V a form and its points, + · − a point in or out, P the pen, R a rectangle, L an ellipse drawn on top, E Free Transform, ⌘C ⌘V, K the knife, O Reflect, U Unite, M the sausages, Out · in; the Preview, the brush through sausages off the photo; Rotate Canvas CCW · CW by the zoom (new, 2026-10-30; src/form.js, src/formplan.js; FORM/)
    formg.html       FORM-G (Points · Jar 0, a dot of white at each outermost point to centre the canvas by, 2026-11-16), a library of finished paintings (and on this Mac alone the pictures of others' works, formg/local.json, gitignored, 2026-11-16), no photo and no drawing tools: a picture's plan in formg/, OPM-N's DRAG SNAKE to the command — since 2026-11-17 drops first, then the snake: a zone's every leg its drops, one every 35 mm, then one snake over the cell on no dip, its turns square, and at once back over its legs; a stroke a dip a leg, then the leg again the same way (README's canon; v.1.2.5, the owner's best so far); THE JARS' 🔄, a colour painted by one of his numbered jars, app/formg/jars.json — its question with Start from, BACK ONE JAR (a jar again from its own pause, BACK ONE CELL's place since 2026-11-13) and the iPhone's remote; the brush fixed at 5 mm, the jars given; F, OPM-W's frame, a piece run alone at its place from home; DRAW BW, the contour in a pen in the brush's holder, every border between two colours once, to lay the canvas by and study the picture on paper first; its run as LAB's real 3, a dip every 79 mm and the J3 compensation (new, 2026-11-06, the frame 2026-11-08, DRAW BW and real 3's run 2026-11-10; MARKS, the printer's marks at the middles of the canvas's edges, a jar's one dip and its marks after every change of jar, 2026-11-11; src/formgplan.js, src/formg.js; FORM-G/generator)
    genf.html        GEN-F, the creative workshop (FORM-G is the library of finished works): a picture in — its plain ground left bare — FORM-G's grid of 5 mm legs out, a sketch on three screens side by side, each its own colours, the one chosen approved; the format (40 × 40, 60 × 60, 60 × 80, 70 × 100; 90 × 120 and 100 × 150 for a new frame), the colours asked (10 … 100), the canon of the jars on them; GROUND, white or black, the bare canvas on the screen; Motion blur, a layer under the picture, every column smeared along itself in the picture's own jars, its Opacity OPM's raster of them, the share of the columns that paint; the time by FORM-G's own run, est.; APPROVE saves it to GEN-F/ for the final work in FORM-G/generator. Moves nothing on the machine (new, 2026-11-16, v.1.2.4; src/genfplan.js, src/genf.js)
    gogh.html        GOGH, painting in dabs (the owner, 2026-11-22: "painting in strokes, like real painting"; "in GOGH we copy FORM-G's functionality fully … the one difference: no long strokes! All of them drops of 2 cm"): FORM-G's page, all of it — TEST, PAUSE, POINTS · JAR 0, DRAG DABS in DRAG SNAKE's place, BACK ONE JAR, STOP, HOME, Picture · Drag · ▶ Play, the iPhone's remote, ELBOW LIVE, THE JARS' 🔄 (FORM-G's jars.json), MARKS, F — its library app/gogh/, made by GEN-V; every leg a dab: a dip, one stroke ≈ 20 mm down the picture, the brush up, nothing over it (README's canon "GOGH: a dab, a dip, nothing after it") (new, 2026-11-22; src/formg.js with data-tab="gogh", src/goghplan.js; GOGH/)
    genv.html        GEN-V, GOGH's generator (the owner, 2026-11-22: "a new picture generator as GEN-F, with the same functionality … let us call it GEN-V (as Vincent :)"): GEN-F's page — the format (and a 20 × 20 for tests, a 30 × 30 since 2026-11-25), the colours on three screens, the ground, APPROVE — the brush 2, 3 or 5 mm; its sketch GOGH's dabs, every column cut into dabs of 12 … 24 mm, ≈ 20 (the 2 mm's 8 … 15, ≈ 12), one jar each, as bricks; no motion blur; APPROVE saves it into GOGH/ for GOGH/generator/genvpic.py. Moves nothing on the machine (new, 2026-11-22; src/goghplan.js, src/genv.js)
    libv.html        LIB-V, GOGH's library as Library's page (the owner, 2026-11-22: "make Library-V as here"; of 💾 SAVE's file in Downloads: "I need it in the library"): GOGH's pictures as cards, this Mac's first (GEN-V's 🐾 APPROVE, newest first), then GOGH_LIB's, and below the line every 💾 SAVE of a picture's jars on GOGH (app/gogh/jars/, out of git); a click opens it on GOGH (its jars as 📂 LOAD), × one of this Mac's into app/gogh/.deleted/ (src/libv.js; rembrandt.py's /gogh/library, /gogh/jars)
    libg.html        LIB-G, FORM-G's library to look at, while it paints or not (the owner, 2026-11-19: "while a picture is being painted I cannot switch between the pictures in the library at all … so that I can study the files in peace"): FORM-G's page with data-tab="libg", its pictures, the views, ▶ Play, the (i), THE JARS' 🔄; no machine — no run looked at, nothing sent; its jars FORM-G's to start from, its changes in this browser alone, never jars.json; 💾 SAVE · 📂 LOAD, a picture's jars as a file, a version with another set of paints (FORM-G's own 💾 · 📂 too, its LOAD into jars.json, not while a run is on) (new, 2026-11-19; src/formg.js)
    holo.html        HOLO, vertical legs alone in two runs: the brush lays even puddles of paint from the cup at hand, then drags them — run 1 the light, run 2 the shadow on the dry first; FORM-G's page, a library of cloud-Claude's pictures (40 × 40, 60 × 60) in the owner's jars, ▶ Play, every picture's v.2 after it, its edges ragged (2026-11-14, `HOLO-Claude/generator/holo_v2.py`); FORM-G's machine keys — TEST, PAUSE, DRAW BW (the pen along the strokes as the brush lays them), BACK ONE JAR, STOP, HOME, the iPhone's remote, ELBOW LIVE — since 2026-11-14; RUN 1 · RUN 2 not wired yet, after LAB's sheet; the warm 40 × 40's V4, every pass of both runs a group at a time: run 1 by LAB's + idle 6.0, its snake a stroke a leg, its idle snake legs + 1; run 2 Air, its dots on one side, legs + 1 tracks from them (2026-11-15, `HOLO-Claude/HOLO/001-40x40-v4.md`) (new, 2026-11-12; HOLO-Claude/HOLO.md; src/holoplan.js, src/holo.js; app/holo/, made by HOLO-Claude/generator)
    holo2.html       HOLO2, ALU with the owner's jars, COLORS' palette (the owner, 2026-11-20: "ALU is the cleanest … let us take it as the base, with all its tools for drawing, but with our palette COLORS"): ALU's page and plan as they are, the pipes drawn by hand over a reference, its tubes his 60 jars (Jar 1 … 52, Black, HOLO's jars with no number yet); an ALU save opens here too, every tube the nearest jar (src/alu.js with data-tab="holo2", aluplan.js's HOLO2_TUBES; HOLO2/ holds his drawings and the first tries' generator)
    opmg.html        OPM-G, FORM-G's page with its own library, opmg/ — the G-wagon on 60 × 60 first, 36 jars at most, every jar 1 m of line at least — and its run by the canon of a long leg, no. 9 (new, 2026-11-07; src/formg.js with data-tab="opmg", src/canon.js; FORM-G/generator/gwagon.py)
    prisma.html      PRISMA, DACHE's Preview in rings and rays: the pencil's lines clockwise round the blend's loops and along its spokes, a cross stroke, every shade its own pencil, a pencil one path, up and down on the move (new, 2026-10-27; inka.js and prismaplan.js; PRISMA/)
    pencils.html     Pencils, BLEND compositions as separate pencil passes on paper: A3, editable inventory, coats, colour interleaving and SVG separations; planning/export (2026-10-26; PENCILS.md; off the top row since 2026-10-27, DACHE in its place)
    nolan.html       NOLAN, the ribbons (new; NOLAN.md; off the top row since 2026-10-19)
    newyuri.html     New Yuri, letters as rings (new; off the top row since 2026-10-06)
    glyphs.json      the owner's letters: skeletons of lines and arcs
    tape.html        TAPE, a cassette and its tape (new, 2026-10-12; the first tab, index.html, until 2026-10-19, then off the top row; TAPE-Claude/)
    cassette_trace.svg  TAPE's built-in cassette, the owner's (100.4 × 63.8 mm)
    basf.html        BASF, TAPE's tape wound to the middle, no cassette (new, 2026-10-12; off the top row since 2026-10-19)
    alucut.html      ALU-CUT, ALU with the new things (new, 2026-10-11; first until 2026-10-12; ALU-cut-Claude/)
    ccd.html         CCD, rectangles of straight lanes after Carlos Cruz-Diez (new, 2026-10-11; Cruz-Diez/)
    bias.html        BIAS, CCD's rectangles with diagonal lanes in four runs, a plaid on the bias, or straight stripes, or upright and across at 90 (new, 2026-10-15; BIAS-plaid/)
    loom.html        LOOM, Claude's own: a woven cloth, the strips over and under by the elbow, two layers, two halves (new, 2026-10-16; off the top row since 2026-10-19; Claude-Freedome/)
    type.html        TYPE, letters as bands in three passes (new; off the top row since 2026-10-11)
    love.html        LOVE, TYPE's copy for the new things (new, 2026-10-07; off the top row since 2026-10-11)
    alu.html         ALU, pipes of paint in whole lanes (new, 2026-10-08; ALU-Claude/)
    smkn.html        SMKN, ALU with the paints in stock, Soumkine's palette (new, 2026-10-08)
    create.html      Create (hidden from the top row since 2026-10-04)
    job.html         Job (from RUBENS, plus pointer mode; off the top row since 2026-10-06)
    test.html        Test, the test bench (new; off the top row since 2026-10-19)
    ink.html         Ink: the cup the brush dips into (new)
    inky.html        INK-Y, the cup at hand: the jar on the carriage by the arm, a dip by How to dip below — the elbow up, the shoulder over the jar, the elbow in, up, the shoulder back (new, 2026-11-03, the cup on the beam the night before; once on, every dip goes there; src/inkypage.js)
    lab.html         LAB, a sheet of trial strokes on a scrap, numbered: how the brush lands and lifts across the arm and along it, the elbow, the carriage against it, the wrist (new, 2026-11-04; src/labplan.js, src/lab.js)
    labh.html        LAB-H, HOLO's LAB sheet on a 20 × 20, one jar: A a dab (1, 2, 3 on the same 8 mm or end to end), B how far a puddle of 1 … 4 dabs lasts, C run 1's puddles every 30, 40, 55 mm dragged, D the open time, puddles dragged at 30, 20, 10, 5 min, the brush in the jar between; LAB's page with that sheet alone, none of LAB's other keys (new, 2026-11-14; src/labplan.js's sheetHolo, src/labh.js)
    colors.html      COLORS, the library, after LAB (the owner, 2026-11-08: "so that our library is there"): a card a jar of LAB's real 3 by its name there — Kuzya's card, Target, Mix recipe, Advice, Medium, Dry LAB, ΔE, Coats — his scale, and the paints on the shelf measured off LAB/'s photos, all est. (new, 2026-11-08; src/colorlib.js, src/colors.js; LAB/)
    adjustments.html Adjustments (new)
    calibration.html Calibration (from RUBENS); the wave test, the pencil's lines left and right (wavetest.js, 2026-10-29)
    library.html     Library (from RUBENS)
    prefs.html       Preferences, the gear after Library: what holds for every tab, in this browser — TEST's margin and its dots at TL (new, 2026-10-20; src/prefs.js; and the top row, every tab ticked in or out, 2026-10-27, src/tabs.js)
    style.css        RUBENS tokens
    rembrandt.py     server and USB board (from rubens.py); on the home Wi-Fi too since 2026-11-02, from another address only /remote with the key of remote.key (not in git); POST /run/swap since 2026-11-22, GOGH's live gap and run; POST /genv/approve the same evening, GEN-V's 🐾 APPROVE into GOGH/ and GOGH's library (nothing on the machine); GET /gogh/library, POST /gogh/jars, DELETE /gogh/pic/…, /gogh/jars/…, LIB-V's; POST /gogh/card since 2026-11-23, GOGH's brush (a card's dabs given other jars of its own; nothing on the machine, not while a run is on)
    remote.html      the iPhone's remote, /remote: DIP, ⏮ Back · ⏭ Skip · ▶️ Go to, Pause · Continue, 🟥 STOP, the colour and the cell now (OPM-N, 2026-11-02; its key by the QR code on OPM-N); its Progress tab, the yellow LCD, when the next paint change falls and a mini-screen of the picture (2026-11-04)
    src/             ES modules, no build step
    test/            node --test
```

## Reuse from RUBENS — copy, do not rewrite

From `../Rubens/rubens-preview/` at commit `a143fbc` (GitHub `main`, eleven
commits after the tag v0.1.3: the canvas by its four edges, the wrist's zero
upright, Reach on the Create tab): `calibration.js`, `machine.js`, `job.js`,
`jobpage.js`, `lcd.js`, `ui.js`, `color.js`, `geometry.js`, `fillet.js`,
`util.js`, `svg.js`, `style.css`, `rubens.py` (→ `rembrandt.py`), and their
tests. They import `config.js`, `cnc.js` and `paint.js`; the Pen and Arc tools
need `gesture.js`, the Library tab `librarypage.js`, the tests
`test/shapes.js` — copy those too, or nothing runs. Keep the tests passing
after the copy.

**The firmware is Rembrandt's now**, `firmware/CNCDM-001/`, copied from RUBENS
`a143fbc` on 2026-10-02. The owner: "RUBENS is closed, we make Rembrandt; we
can change everything. Let's reflash the board!" It is flashed only together
with the owner, after a host test (`test_host/`), and tried in the air first.

New modules: `curve.js` (the curve, lines and arcs), `bands.js` (offsets and
blended lanes, clipping), `tubes.js` (inventory), `drops.js` (drop plan, ml),
`pairs.js` (muddy pairs, keep-out, ⚠), `adjustments.js`, `rings.js` (New
Yuri's letters as rings), `typeplan.js` (TYPE's bands and passes), `loveplan.js` (LOVE's copy of it), `aluplan.js` (ALU's pipes), `ccdplan.js` (CCD's rectangles of lanes), `biasplan.js` (BIAS's diagonal lanes and four runs, 90's upright and across, the plain stripes), `loomplan.js` (LOOM's woven cloth, its hops and halves), `inkaplan.js` (INKA's tiles, blocks and figures, their spirals, the wipes, the Result on a grid of the canvas; ST-JOHN's ⌘, its lobes and loops), `blendplan.js` (BLEND's keys, steps, loops and core, its spokes all round), `dacheplan.js` (DACHE's pencil box, bands and modules off the Result, the hatches, a pass a pencil, the pencil changes), `prismaplan.js` (PRISMA's rings and rays off the Preview, its twenty-seven more pencils, a pencil one path, rubbed), `opmplan.js` (OPM's cells, their pencils and contours, merged or not; OPM-S's outer contour and its one pencil, the one that shows best on the ground; OPM-W's corners in straight pieces, `facets`; OPM-P's blocks, every one its own rows the brush apart, its lines once and DRAG a colour at a time, `opmpPlan`), `formplan.js` (FORM's forms off a photo, `autoForms`, the background grown from its rim; the knife, `cutForms`; a form drawn on top, `drawForms`; forms laid again on top, a paste or a transform, `layForms`, `transformForms`; the place a transform left given to a neighbour, `settleLeft`; Reflect, `reflectForms`; Unite, `mergeForms`; the materials, `withMaterials`; every form's rings, the straight skeleton's wavefront, glass's rounded inside; the cells cut by the photo's colours, then OPM-P's `linesOf` and `dragsOf`; the Preview, `formPreview`, the brush through spokes of sausages), `form.js` (FORM's page: its panel, V and K, the pen and the shapes, the photo on the canvas, the view turned), `formgplan.js` (FORM-G's pictures into OPM-N's rows: a jar a colour, a cell a run of legs, its idle run at once; the dial's dips in rows; the list, the second layer last; a piece in F's frame, `framedPic`; DRAW BW's contour, `contourOf`; real 3's run, `R3`), `formg.js` (FORM-G's page, and OPM-G's by its tab), `genfplan.js` (GEN-F's sketch: the ground off, the fit to the field, the columns by a dynamic programme with the miss carried on, k-means jars, paintrun.py's spans and snakes, FORM-G's json, the canon of the jars), `genf.js` (GEN-F's page), `goghplan.js` (GOGH's dabs: GEN-V's sketch, every column cut into dabs by a dynamic programme, `dabsOf`, a jar's dabs in stacks the nearest next, `stacksOf`, the sketch with the canon of the jars, `sketchV`; GOGH's run, every dab a run on a dip of its own, `passesV`, `dabRunsOf`), `genv.js` (GEN-V's page), `holoplan.js` (HOLO's pictures into their two runs: the list, run 1's jars light to dark then run 2's; a jar's puddles laid a batch at a time, then dragged; the moves for ▶ Play; DRAW BW's lines, `contourHolo`, by FORM-G's `contourOf`), `holo.js` (HOLO's page, FORM-G's machine keys), `colorlib.js` (COLORS' library: the paints on the shelf, measured, est.; every jar of real 3 its recipe and its advice; Kuzya's scale), `colorreg.js` (COLORS' registry: every picture's jars read from its plan, a key each, the same hex elsewhere a candidate), `colormix.js` (COLORS' mixing model: two-constant Kubelka–Munk on the shelf's paints, the painter's families, a recipe for any jar, est.), `colors.js` (COLORS' page, a picture's jars at a time), `canon.js` (the canon of a long leg, no. 9: the landing inside, `startOnLong`, `ridersOnLong`; the dose, `dosed`, every run its own dip; LAB's and OPM-G's, the dose FORM-G's too; the J3 compensation, `ELBOW_J3`, LAB's real 3's and FORM-G's), `align.js` (OPM-S's Align: the figures centred on the canvas, their gaps made even), `tapeplan.js` (TAPE's lanes round a cassette), `wash.js`
(the watercolour on the board, NOLAN's and TYPE's), and pointer mode in
`jobpage.js`.

## Run

```
cd ~/Rembrandt
python3 rembrandt.py        # http://localhost:5164; Ctrl+C stops it
cd app && node --test       # the tests
```

`rembrandt.py` in the root only starts `app/rembrandt.py`; either works.
Since 2026-11-02 it listens on the home Wi-Fi too, for the iPhone's remote
(`/remote`, its key by the QR code on OPM-N); `REMBRANDT_LISTEN=127.0.0.1
python3 rembrandt.py` keeps it on this Mac alone.

Port 5164 — the owner's lucky number (2026-10-01). Only one program owns
the USB board: close RUBENS (port 8766) first.

## The brush lands and lifts on the move — gaps (it keeps coming back)

The owner, 2026-11-02, after OPM-N's first DRAG: "we have this all the
time; I would write it in the README, because it has been more than once".

`plotRun` (`strokes.js`, `onTheMove`) lands the brush along the line
itself and lifts it the same way, over `tail` mm at each end (3 by
default), the elbow easing between the lift-off and pressed. The tip
touches only near the end of a landing and leaves near the start of a
lift, and the elbow lags the carriage. So **a line cut in two — the brush
up, then down again at the same point — leaves a gap on the canvas**,
though the plan has none, and a line's ends fall a few mm short.

- 2026-10-04, NOLAN: the lines began 5–10 mm late, the elbow still on its
  way down from +25° when the carriage set off → `ELBOW_HOVER` +12°; a
  dip's split goes on 20 mm back (`DIP_LAP`, `band.js`).
- 2026-10-12, TAPE: the landing and the lift-off, 3 mm each, ate half of
  a 12.6 mm screw → a closed outline twice round.
- INKA, ST-JOHN: TRACE after a dip on from `DIP_LAP` back.
- 2026-11-02, OPM-N (`OPM-N/IMG_2055`, `IMG_2056`, a pencil in the brush's
  place): a 5–6 mm gap at every dip in a track → **Dip overlap**, 5 mm
  back (est.). A track's ends also stop 4–8 mm short of its cell's edges
  (`IMG_2057`), and the tip slides a few mm sideways as the elbow turns
  (the hooks at both ends) — open.
- 2026-11-10, LAB's real 3 on canvas (`LAB/IMG_2614` … `2616`): "5–6 mm are
  cut off absolutely every leg" → **the J3 compensation**: every paint run on
  the machine lands 3 mm earlier and lifts 3 mm later (`ELBOW_J3`, `canon.js`);
  LAB's real 3, then FORM-G's run the same day.

**The rule:** wherever a new run cuts a line the brush paints — a dip, a
segment, a stop — the part after the cut starts back over the part before
it, by a lap on a slider marked est. Look for this before a new tab's
first run, not after it.

## How to dip — the cup at hand (canon)

The owner, 2026-11-03: "Not two jars at the sides of Y, but a jar right
by the arm. No need to drive anywhere, neither right nor left. The jar is
always at hand." The jar sits on a bracket bolted to the carriage that
carries the arm (the 3DOF), so its place against the arm never changes;
it rides the whole length of Y with the carriage, clear of the rails, and
the brush does not get in the way of the travel. It stands **over the
canvas, above the level the brush paints at**. Photos in `OPM-N/`:
`IMG_2109`, `IMG_2110` — the bracket being fitted; `IMG_2114` — a dip (a
pen in the brush's place while testing); `IMG_2116` — the brush painting;
`IMG_2120` — the brush taking paint.

A dip, in this order, every step finished before the next begins:

1. **ELBOW up** from where it paints (+2.5°) to **+30°** (+35° allowed).
2. Only then **SHOULDER** from 0° to **+35°** (the fork +30° … +35°).
3. **ELBOW down into the jar**, to **+15°** at the lowest: the jar stands
   above the canvas (the fork +14° … +16°, set by how much paint is in
   the jar; **+20° on top since 2026-11-22**, the owner: "not deeper, but a
   little higher" — a full jar drowns the brush; ELBOW LIVE · JAR sets it
   live, by half degrees, the floor +14° as it was).
4. The paint taken: **ELBOW up first**, to +30°.
5. **SHOULDER back to 0°.** Painting goes on.

**Their speeds** (2026-11-22, the evening; the owner: "220 is the ceiling … test 70, then step by step to 220"; "SHOULDER too"; "I give
permission to flash"): the shoulder's at INK-Y's `swing`, the elbow's three turns at INK-Y's `elbow` — none at first, the firmware's own 53°/s down
and `rembrandt.py`'s ELBOW_UP_SPEED, 28°/s, up (a cure of 2026-11-11's silent arm that was not: a splice under tape) — both up to 220°/s, the
firmware's J as fast as that since the same evening, its acceleration by its speed (`joint.h`, `accFor`: 30 at 53°/s as ever, 125 at 220); GOGH's
sliders Dip · shoulder and Dip · elbow. A dab took 10.6 s at 28 / 40 / 1 s in the paint, the arm's turns most of it (the journal, 2026-11-22). The same
evening a step counts as finished sooner, never before it is (the owner: "more than a second of stop between the turn and the tilt"; "I allow
the change"): looked at every 0.05 s, not 0.15; standing still in its fork is there (the servo stops ~1° short of the middle, and waited 0.6 s every
time); standing still at all after 0.25 s, not 0.6; a slow stroke under 10°/s as before (`Arm._settle`, SETTLE_*). The journal's dip carries every
move since the last, `moves`: joint, s, s settling.

**The shoulder never turns unless the elbow is up (+30° … +35°).** The
owner: "if the shoulder turns instead of the elbow lifting, we can break
the brush or knock the jar over, and then the paint spills onto the
canvas. We spoil the picture." So for every turn of the shoulder, not
only a dip's: a stop, ⏮ Back, ⏭ Skip, ▶️ Go to, a jog, the next run's
start.

No calibration: the arm's servos read their own angles from power-on (the
steppers of X and Y do not — they home by the switches), and the jar never
moves against the arm. Only the depth in the paint changes as the jar
empties (+14° … +16°).

How Rembrandt keeps it (INK-Y, `src/inkypage.js`; `strokes.js`,
`handDip`; `rembrandt.py`, `hand_guard`): the five steps are the plan's
own blocks, the carriage standing over the line's start; every step a fork
the joint counts as there in, aimed at its middle (the firmware turns
whole degrees, the servo stops up to ~1° short), and since 2026-11-13 up to
1.5° past its edges once a step was aimed into it (`FORK_WITHIN`, the owner:
"we fixed that 1.5° is allowed"; the miss in the journal); and while the cup at hand
is on, `rembrandt.py` refuses a turn of the shoulder with the elbow out of
its fork up, the elbow below +14° with the shoulder off 0, and the wrist
with the shoulder off 0 — a run's or a jog's.

**The shoulder back at +0.6 … +0.9°** (Press test 3, 2026-11-23, `GOGH/README.md`): coming back from the jar the servo stops short of 0, a dip
in five, the same at 40°/s as at 195°/s — the servo, not the speed; at the tip ≈ 3.6 mm a degree (est.), so that dab lies 2 … 3 mm to the
right. Left as it is, the cause known; no carriage compensation (the owner: "that would complicate the already complicated code. I fear it
would create yet another threat of error. And then — they do come back. Let us leave it as it is for now, but we will know the cause").

## How to lay a module — the rubber brush (canon)

The owner, 2026-11-05, of a Colour Shaper soft no. 2, a rubber tip, on
LAB's `+ idle 5.0`: "the best quality, what I want from robotic painting:
inhuman precision of the line" (`OPM-N/IMG_2356`). On `+ idle 6.0`,
`OPM-N/IMG_2363`: "LAB may count as work successfully finished"; "+ IDLE 6.0
is to go into OPM-N's painting algorithm". It is OPM-N's DRAG SNAKE since
that day (`src/idleplan.js`). A module, 80 × 17.5 mm:

1. **A snake of legs along X**, 5.83 mm apart, the brush down at its turns,
   **a dip every 95 mm of line**, the carriage against the elbow 1.25 mm/°;
   pressed to its end, its lift beyond.
2. **At once an idle run, no dip**, without the jar or the shoulder: legs
   **4.38 mm apart within the module's width**, **+2 mm** past the ends at
   its start and its turns, catching the bulbs from behind; **at its very
   end 0**, no tail ("at the end +2 mm is not needed, just 0 mm", LAB's nos. 1
   and 4).

**The brush paints only up and down, along X, whatever the module's way.**
Along Y it breaks into dashes (`IMG_2357`): "it cannot paint horizontally at
all"; "no horizontal lines at all, we build them from many flattened
verticals". A module lying down is such a snake of short legs; **one with
slanted sides, the same legs cut short by them, its idle run +3 mm to the very
end** ("we leave them as they are", LAB's nos. 7 and 8). The steps between
legs stay on the paper, short.

## How a long leg is laid — no. 9 (canon)

The owner, 2026-11-06, of the first canvas of LAB's `real strokes`
(`OPM-N/IMG_2432`), its no. 9, a long leg of 174 mm: "I would start from this and
take it as the canon"; of its four ways, "the third came out best"; of the first,
as the brush had come from the jar till then (`IMG_2431`): "out at once; the first
long line breaks in the middle".

1. **It lands inside the leg**, 16 mm along it (0.6 of a shorter leg), **pressed
   back to the leg's start, then along the leg**: the first of the paint goes into
   the leg's own line.
2. **A dip every 95 mm of line.** The next run starts 15 mm back and lands inside
   the same way, so it paints back over the place where the last gave out.
3. **At once an idle run, no dip.**
4. **The dose: every run on a dip of its own**, none on what another left; **a leg under 30 mm
   after 60 mm of line since the dip, a dip of its own** at its start. The owner, 2026-11-09, of
   real 3 on canvas (`LAB/IMG_2606`, `IMG_2609`): short cells on what a longer one left came out
   dabs, 8 mm for 17 and 13, and a 20 mm tail after 79 mm pale: "not short legs but very short";
   "clearly it needs a second dip".

`src/canon.js`. On LAB (`real 2`, run on canvas the night of 2026-11-06/07, `OPM-G/IMG_2435` …
`IMG_2486`: the long legs clean and alike in all four copies) and OPM-G's run since 2026-11-07; not
yet in OPM-N's or FORM-G's. The dose (4) on LAB's real 3, OPM-G and FORM-G since 2026-11-09:
FORM-G's new dips at the run's start, as its other dips, not landing inside.

## How many jars — the canvas's long side (canon)

The owner, 2026-11-08: "Honestly, I do not have so many jars, nor do I see the point of nuances of
RGB: ours is optical mixing, so I propose a compromise. The rule 'take less than 1 m' is for a
canvas whose long side is 1 metre; ours is 100 × 70 cm, all fair. But LAB's canvas is 20 × 20 cm:
I propose a universal rule. Take out the jars with less than the canvas's own long side, if they
do not change the look; so under 20 cm. It can go into the canon."

1. **A jar's line** — its legs and its idle run, as the list shows it — **shorter than the long
   side of the canvas it is painted on**: the jar goes out, its cells to the jar nearest to it in
   colour that stays, so every leg is still painted, by the paint most like it: no paint mixed,
   no leg moved. The owner, of a brown jar left for want of a neighbour within ΔE 15.9: "can we
   not simply find a neighbour a little farther, not merging the colour?"
2. **As a last resort it stays** (the owner: "at worst, yes"): when even its nearest is over
   CIELAB ΔE 25 (est.), the colour cannot be replaced, as the ink of a lamp by any red (34).
3. The shortest first, again and again, so two near jars too short each may make one long
   enough; then every jar that went to the nearest of those that stay, so no colour drifts along
   a chain. The list says which went where (Kuzya's rule below).

`src/canon.js`, `jarsByCanvas`. On LAB's real 3 (200 mm: 33 jars → 19); FORM-G's pictures (1 m)
with the canon's switch there, after real 3.

**FORM-G's alone** (the owner, 2026-11-23, of GOGH's Press test 4, the headlight lost: "the rule works only for FORM-G, and it stops with the arrival
of GEN-F — there is a slider there and I choose the number of colours by hand. All the more it must not be applied to GOGH"). GEN-F and GEN-V still apply
it in their code at v.1.2.8; GOGH's pictures to come keep every colour GEN-V gives.

## The orange, Jar 6, first in Layer 2 (canon)

The owner, 2026-11-11, after the red classic's first jars on canvas, the orange painted between the
greys: "Jar 6, the orange, is sensitive to the grey next to it. Before it Jar 3, right after it Jar 7.
I propose to take the orange to the very start of Layer 2, and to put it into the canon for the
future: Jar 6 always at the start of Layer 2."

1. **The orange of the indicators** — Jar 6, his numbered jar of `#EE8A22` — is not in the first
   layer: it is **the first line of Layer 2**, once, on the dry first layer, its cells run as a first
   coat runs them. The first layer one line shorter: on the red classic's v.2, 40 lines, Black the
   40th; Jar 6 the 41st, then the second coats.
2. A jar `late` in a picture's plan (`formgplan.js`, `seqOf`); the generator marks the amber jar so
   (`FORM-G/generator/export_formg.py`). On the red classic, v.2 and v.1, and the white since the
   same day.

## MARKS beside the canvas — paper on the plates (canon)

The owner, 2026-11-14, of `HOLO-Claude/IMG_2903.jpg` (two places circled in green) and `HOLO-Claude/color_marks.png`
(FORM-G's MARKS on the red classic, strips 1 and 3): "There I circled in green the places where the papers will lie, so that
the machine dips as in color_marks.png — this is the new canon. All the new pictures come with such tables."

1. **Every new picture has its MARKS**, FORM-G's (`formgplan.js`, `MARKS`): after every change of jar one dip, then the
   jar's mark, a leg of 8 mm along X, in its own cell of every strip; then its first cell on a dip of its own.
2. **The strips lie off the canvas**: paper slips on the two metal plates beside it, one by the middle of the canvas's left
   edge, one by its right, against the edge. FORM-G's were taped over the canvas, 15 mm in from its edge.
3. **A canvas wider than the reach — on it**: the slips taped over its margins by the field's edges, the marks 4 mm off the
   field (est.). The owner, the same day, of a 60 × 60 ("we will put them right on the canvas, as with 70 × 100"), and
   `HOLO-Claude/IMG_2904.jpg`: the red classic's two strips laid on a 60 × 60, their marks the machine's.
4. Sizes: a slip 3 cm across Y (the owner: "3 cm left and 3 cm right is enough"), ≈ 150 mm along X, FORM-G's cells 14 mm
   apart; a mark as wide as the brush, 5 mm ("IMPORTANT — the brush is 5 mm"; LAB's real 3 measured a track ≈ 8 mm, est.).
5. The marks within the Y reach, 568.5 mm, both slips': beside a canvas up to 550 mm across Y, on it by a field up to 550
   (one row; 526 with a second, a jar in both of HOLO's runs). HOLO: the 40 × 40 off the canvas; the tiers (field 540) on
   it; the blue (field 560, two rows) none — the owner, thinking it over.

`holoplan.js` (`MARKS_BESIDE`, `besideOf`, `markCells`; `placeRange` keeps both slips' marks within the walls, off the canvas
first, else on it); on HOLO since 2026-11-14 — the slips on the screen, the marks in the plan and ▶ Play. RUN 1 · RUN 2 still
send nothing.

## A picture's edges and its rhythm — HOLO's v.2 (canon)

The owner, 2026-11-14, of the first three HOLO pictures (`HOLO-Claude/opm-n-screen.png`, `opm-w-screen.png`, his sketch
`IMG_2907.jpg`): "the graphics live in a banal square, which still has to be laid evenly on the canvas, debugged as if it were a
print on a T-shirt … my works have no four even edges, they sit in the middle of the picture and go out in rays. So if we do not hit
the centre to the millimetre, nothing terrible: it will be the artist's intent." Then, of the first v.2 (`Screenshot 2026-11-14 at
4.36.18 PM.png`, `4.30.38 PM.png`): "be consistent and remember how your first tab is made: one rhythm for two runs. If the drops are
even in a row in the first run, then in the second they are even … in the first run the drops begin to 'dance'. A more complex rhythm
appears, which makes the picture a work of art, not algorithmic rubbish from a UI/UX designer making iPhone wallpapers. But be
consistent then! Keep the dance in the second layer — for now it is a 'relic' of v.1."

1. **No even frame.** A picture's edges are ragged — blocks stepped over each other, a wave along them, a staircase in at a corner
   or two — so that a canvas laid a few mm off reads as intent, and the work is not shut in a square.
2. **One rhythm for both runs.** Whatever moves run 1's puddles moves run 2's too: a leg's every puddle, band and shadow laid
   between its own ends by the same measure, stretched or pressed with the leg. No layer keeps the old even grid while another
   dances.

`holoplan.js` (`legsOf`, `puddlesAlong`, `bandOn`, `dabsOn`), `HOLO-Claude/generator/holo_v2.py`. Every v.1 kept; a v.2 after it.
Since 2026-11-15 the v.1s are off the library's cards (`HOLO_HIDDEN`; the owner: "let's hide all the v.1s, so as not to get confused"),
their files and tests kept; a page left on one opens its v.2.

## DRAG Snake before DRAG Air — always (canon)

The owner, 2026-11-17: "we need the snake, not through the air. Otherwise it is long and not
Instagram-worthy. When the brush leaves the canvas, a person blinks, the brain restarts and he
scrolls to another reel. … One can say the picture's quality matters. But there are two million
artists on Saatchi; we need content to break through and fight the competition."

**Wherever a run can go on with the brush down — across to the next leg, a turn — it goes so: DRAG
Snake. DRAG Air (the brush up, back through the air to start the next stroke) only where nothing
else will do.** The film is part of the work: a run the camera shows is a run without blinks. A
lift for a dip stays (the paint has to come from somewhere); a lift to come back and start again
does not. Before a new tab's or a new picture's first run, look for its lifts as for its gaps.

## FORM-G: drops first, then the snake — zones and strokes (canon)

The owner, 2026-11-17, of Mickey's beige on 60 × 60 (`FORM-G/DROPS-FIRST.md`,
`FORM-G/photos/2026-11-16/`: teardrops where the brush restarted mid-leg after a dip, a cap at every
turn of the snake): "we do as in HOLO — first we drop all the drops on the grooves of one colour,
the brush does not drag them at first. The second round — the brush goes once in a snake over the
whole zone of the fill. This is the one truth for FORM-G." And: "not all colours go in zones. There
are those that go in strokes."

1. **A zone, a flat fill** (Mickey's Colour 1, 3, 4, 9, 15): a cell at a time, **its drops first** —
   every leg its drop **at the start of its way**, so the snake's legs, down and up in turn, have
   their drops top and bottom in turn; **then one every 35 mm of the leg at most** (2026-11-17, noon:
   "I would put a drop every 35 mm", 80 till then); every drop a dip of its own, a mark of 8 mm the
   way the snake will go. **Then at once one snake** over the cell's legs, the brush down, **no dip**,
   never stopping inside a leg, **and on at once, the brush still down, back over the same legs**, the
   last first, 2 mm past their ends (the second run, the same noon: "let us bring back the second run,
   so that it drives the clots apart").
2. **Strokes** (Mickey's Colour 2, 5, 6, 7, 8, 10, 11 … 14): "painted at once, there is nowhere to
   come back to" — **a dip a leg**, from its start to its end; **then the brush up, through the air to
   the leg's start, and the leg again the same way, no dip**, from 2 mm before its start (the owner,
   2026-11-17, noon: "in the strokes through the air and again. There is nothing 'back' there … It must
   be driven down, not from the bottom up"). A motion blur's stripe is a stroke in any jar, and so is a
   dial's leg.
3. **The snake's turns square — every leg to its very end, then straight across** (the owner,
   2026-11-17, `FORM-G/Screenshot 2026-11-17 at 11.00.36 AM.png`, ⊓ ⊓ in red: "it moves over to the
   second row on the move, not having passed the first track fully … the brush is flat, so it is
   exceptionally important to pass the track fully and only then go over to the next"). Two legs side
   by side seldom end level: across at the level both reach — back along this leg to it, or on along
   the next to its own start. Legs that do not overlap at all go straight, as before (≈ 2 % of turns).

A jar's `fill` in its picture's json, `zone` or `strokes`, when the owner names it; else by its
cells: a zone when 40 % of its line lies in cells 3 legs wide or more and its legs are 30 mm long on
average (`FILL`, est.; it gives Mickey's split). `src/formgplan.js`: `fillOf`, `dropsOn`,
`squareSnake`, `backLine`, `againOf`, `fillRunsOf`; the list shows every line's `zone` or `strokes`. OPM-G keeps the canon of a long leg.

## FORM-G: a mass of one colour, one area (canon)

The owner, 2026-11-17, the evening, of the Targa's Colour 6 on canvas (`FORM-G/IMG_3172.HEIC`, `Screenshot 2026-11-17 at
9.11.51 PM.png`, 9.12.46, 9.18.16): "the brush breaks the groups into small areas and paints them one by one … the picture breaks
because of the several runs — look on the left, all is beautiful"; "we use acrylic with medium, we timed that 20 minutes it holds
easily"; "when more than 1 metre, paint it all at once"; "we need the algorithm … there are few such areas, but it is good content
for the social networks: the brush goes without a lift, the brain is hooked".

1. **A zone's cells that touch** — legs a column apart, their spans meeting — **are one area**: all its drops first, leg after
   leg, then its snakes one after another, each a chain of legs a column apart, square turns, and back over it, the brush down.
2. **A strokes jar's area of 1 m of legs or more** (3 columns at least) **is a zone too**; the rest stay strokes.
3. **80 drops an area at most** (≈ 10.7 s a drop by the journal, ≈ 14 min, under his 20; est.); a bigger one in parts.
4. **A stroke longer than 45 mm: its drops first**, one every 45 mm at most, evenly from its start, each a dip; **then the leg once
   its own way, no dip; then again the same way**, as every stroke. The owner, the same evening, of a 75 … 90 mm stroke on one dip by
   a ruler (`FORM-G/IMG_3173.jpg`, `IMG_3175.jpg`: fat for 5 … 6 cm, then a ring round bare canvas), asked 35 (≈ +1 h on the Targa)
   or 45 (≈ +26 min): "every 45, then". Shorter strokes as before. `STROKE_DROPS`; the journal's `strokeDrops`.

`src/formgplan.js`: `JOIN`, `areasOf`, `chainsOf`, `joinedCells`; the journal's DRAG writes `join`, so FROM THE BREAK makes a run
from before it again as it ran.

## THE JARS: a colour swapped keeps its own line (canon)

The owner, 2026-11-18, the Targa painted to line 9 (Jar 14, C10), then C11 given Jar 7 by 🔄 — it merged into line 5, C6's, painted
already, "C6 + C11" (`FORM-G/Screenshot 2026-11-18 at 11.59.26 AM.png`, his arrows): "That is a mistake, I cannot go back; the 10th
colour must simply be Jar 7 again, without merging with the colours already worked. This must be written into the canon."

1. **A colour given one of his jars keeps its own line, at its own place in the list**, its cells, its fill and its coats its own;
   only the name and the hex change.
2. **Never merged with another line**, painted or not: two colours in one jar are two lines, the jar put in twice. No line before it
   moves, so Start from holds on a picture half painted.

`src/formgplan.js`, `withJars`; the 🔄 marks a jar already in the list with •.

## GEN-F, the workshop · FORM-G, the library

The owner, 2026-11-16: "FORM-G is the library of finished works. GEN-F is the creative workshop."
A new picture starts on GEN-F, never on FORM-G:

1. **GEN-F**: the owner opens his illustration, picks the format, the colours and, if the picture
   moves, the motion blur, and looks at the sketch. APPROVE saves it into `GEN-F/`.
2. **Claude**, told "GEN-F, <the file>": the final work in `FORM-G/generator/` — the brush model,
   the jars to measure, his own numbered jars where one is near, the canon.
3. **FORM-G**: the finished plan as a card of THE LIBRARY, to run.

What GEN-F tries (a layer under the picture, the ground's colour) is not run on FORM-G until the
owner says so: a new kind of layer changes the machine's run. The machine's limit across Y is
the field, 540 mm (est.): a picture that fills a canvas wider than that waits for a new frame
(the owner, 2026-11-16, of the headlight on 60 × 80: "we will come back to it when the machine has
a new frame"); a picture on the white, as the GT, fits now.

## GOGH: a dab, a dip, nothing after it (canon)

The owner, 2026-11-22, of FORM-G's cola on canvas (`GOGH/01.png` … `04.png`, crops of `IMG_3375`, `IMG_3376`: the paint in a ring at a
leg's sides, the canvas bare in its middle, `03.png` nearly white) and of MARKS' slip (`GOGH/IMG_3377.jpg`): "FORM-G's algorithm makes the
brush go in two passes: first it dips into the jar, lays a drop of paint — then, unfortunately, the second idle run takes the painted layer
off completely. IMPORTANT (!) — on 01.png … 04.png exactly this problem. But it is not there on IMG_3377"; of the thick burgundy he circled
(`IMG_3374.jpg`): "these drops did not spread, as on 03.png, because they are short. In your language, short legs"; and of GOGH: "no long
strokes! All of them drops of 2 cm, as on IMG_3377".

1. **A dab: a dip, the brush down at its top, one stroke ≈ 2 cm down the picture, the brush up. Nothing over it** — no snake, no second
   run, no idle run, no drop before it.
2. **No long strokes**: a dab 12 … 24 mm, ≈ 20 (est.), one jar; every stretch of a picture's paint cut into dabs, the cuts where its
   colour changes.
3. **Upright**, along X, in FORM-G's 5 mm columns (README, "How to lay a module"), a column's ends off the next one's, as bricks: Signac's
   mosaic, upright. A curling stroke as Van Gogh's wants the wrist turned and a LAB sheet first.
4. On the machine a dab's leg 3 mm in from both its ends, the J3's 3 + 3 (canon.js) giving them back: 14 mm sent, 20 on the machine, as
   MARKS' 8 mm made 14 and painted 13 … 17 (est.). Every lift a dip's: "DRAG Snake before DRAG Air" holds.

5. **Four sliders** (the owner, the same night: "three sliders on the principle of ELBOW LIVE · BRUSH … Oh, I need a fourth"):
   - **the brush**, GEN-V's, 2, 3 or 5 mm — a picture's columns its brush apart ("now always 5 mm, but I ordered new brushes, there is a 3
     mm"; of the cola's ≈ 15 h with it: "if they buy the one made in 15 hours, so much the better for us"). **The 2 mm, the sharpest, its dabs
     8 … 15 mm, ≈ 12** (est.; the same evening, the brushes come, `GOGH/IMG_3395.jpg`, the three of them, the 2 mm circled; his strokes by a
     ruler, `IMG_3390.jpg`: "I could not stretch it to 20 mm. All as you warned: a brush this narrow does not hold much paint, so the longest
     stroke is 15 mm. But that is enough for us"); the 3 and the 5 12 … 24 as before (`DAB_BRUSH`, `dabOf`);
   - **the gap**, dab to dab in a column, −0.6 … +0.6 mm, 0.6 at first — every dab half of it shorter at both ends, minus longer ("so your
     default hair can be squeezed in tests"), the plan's and the screen's; **a brush's own**, as the width, **−0.2 the 2 mm's** (the owner's
     setting: "I make the adjustment for exactly the new 2 mm brush");
   - **the width**, the screen's alone, 1 … 8 mm — "we cannot simply widen the dab, it depends on how thick the paint is and how much of it
     hangs on the brush … this slider will just show approximately what we will see on the canvas";
   - **the run**, the machine's alone, +0 … +4 mm at both ends — the brush lands earlier and lifts later, the picture as it is: a 20 mm dab
     runs 20, 22, 24, 26, 28 ("four options, checked by tests"). **Down to −3 since 2026-11-23**, the new brush (the owner: "I need a smaller stroke
     now … can we bring the slider down to 6 mm?"): it lands later and lifts earlier, the 2 mm's 12 mm dab running 6, 8, 10; a leg no shorter than
     0.2 mm (`DAB_LEG`), the J3's 3 + 3 on it. **Down to −4 the same evening** (the owner: "can we make ¼ at all? 6 mm and 4 mm?"): what the leg cannot give
     the J3 gives, its 3 mm at each end less (`dabJ3`, a run's own `j3` in `j3Runs`) — the 12 mm dab running 8, 6, 4; a long dab and a seed as before.

   The gap and the run live during a DRAG (the owner: "I allow changing it", of `rembrandt.py`): the page makes the plan again and
   `rembrandt.py`'s POST `/run/swap` puts it in place of the run's own steps, only where nothing but where the brush goes differs — the same
   steps, the elbow's, the dips' and the pauses' as they were, every L and M `SWAP_MM` (5) at most apart (`swap_refuses`); the dab painting
   then as it was sent, the next one on the new.

6. **A 20 × 20 for tests on GEN-V** (the owner, the same evening: "a 20 × 20 cm format for tests"), LAB's canvas, in front of GEN-F's formats;
   GEN-F's own list unchanged (`GENV_FORMATS`, `formatV`).
7. **No margin where the canvas lies within the reach** (the owner, the same evening, of the 20 × 20's first sketch in a field of 140 × 140,
   `GOGH/bear-20-20.png`: "there must be none. Margins only for 60 × 60 and up, our limit is physical, 550 mm. But 200 × 200 mm we print without
   trouble … 40 × 40 too, without the limiting contour"): on GEN-V the 20 × 20 and the 40 × 40 — and the **30 × 30** since 2026-11-25 (the owner, of the
   piglet: "add the format 30 × 30 to the generator GEN-V") — painted edge to edge, no dashed field on the screen;
   60 × 60 and up the canvas as far as the brush reaches it (`wholeV`, `reachV`, `fieldV`).
8. **Across Y a brush's own: the 2 mm's 556** (the owner, the same evening: "540 — there we are being careful. Yes, it held while the brush was 5 mm.
   But for the 2 mm brush it is far too big a reserve. Why? We can easily make 556 mm — add 16 mm, 8 mm a side"; "only for GEN-V"); the 3 and the 5
   540, GEN-F's own as it was (`ACROSS_V`). Counted on GOGH's carriage: a 556 picture of the 2 mm runs the carriage 554 mm across Y of the walls'
   568.5, the canvas's left edge 8.7 … 22.8 mm before home on a 60 × 60 (est.).
9. **Margins · zoom, 0 … 20 mm** (the owner, the same evening: "I would like to place the picture on 20 × 20 and 40 × 40 myself … a margins slider
   on all the formats, on 60 × 60 and 70 × 100 too! Make such a zoom for the picture, from 0 to 20 mm"; of its name: "yes, great"): GEN-V's field so
   many mm in on every side, the picture as large as the rest lets it, in the middle; a format's own, 0 at first (`MARGIN_UI`, `marginOf`); the
   sketches made again on letting the slider go; the sketch's file keeps it.

10. **🐾 APPROVE straight into the library** (the owner, the same evening: "why do I download to the desktop at all … the same APPROVE key — on the
    principle of library.html, without extra moves: I press APPROVE (add a paw 🐾, by the way) and the picture appears in Library-V"; asked about
    `rembrandt.py`: "yes, add it"; where: "a LIB-V tab, and GOGH"). GEN-V makes the card itself, as `genvpic.py` does (`cardOfSketch`: the plan
    as it is, the ≈ Jar hints, the look; its jpg the same render), and `rembrandt.py`'s POST `/genv/approve` (`genv_approve`; this Mac only; nothing
    on the machine) writes the sketch into `GOGH/`, the card into `app/gogh/<id>.json`, `.jpg`, and its id first in `app/gogh/local.json`: at once
    in **LIB-V** (`libv.html`, GOGH's library to look at, as LIB-G is FORM-G's; told by a BroadcastChannel) and first in GOGH's library
    (after a reload of GOGH, never during a run). On this Mac, out of git, till Claude puts a card in `GOGH_LIB`. A `rembrandt.py` of before (404 to
    the probe): the file to Downloads, as till then. `genvpic.py` stays for a card by hand.

11. **THE BRUSH as sliders** (the owner, the same evening, a run on: "can this block be made as sliders … I want to try a faster dip"): Speed · brush
    5 … 120 mm/s and Travel · air 20 … 180 mm/s, GOGH's own; **Dip · shoulder** 5 … 100°/s and **Dip · in the paint** 0 … 3 s, INK-Y's own (`ink.json`
    by `/ink`, every tab's dips alike; 40°/s est. and 1 s till then) — not while a run is on; all from the next DRAG. The elbow's three turns of a dip
    stay the firmware's own, ≈ 53°/s. Their words behind the section's (i).

12. **💎, a canvas finished** (the owner, the same night: "by every picture a place as an NFT, with such an icon 💎. If a picture was painted two or
    three times, they are simply added: 💎💎💎"; `GOGH/Screenshot 2026-11-22 at 10.49.38 PM.png`: "only a separate row in the block"; of a passport
    from the journal: "a good idea, as a certificate … I will ask for it later"). LIB-V's **+💎** on a picture marks a canvas of it finished; its row of 💎
    on LIB-V's card and GOGH's, a row of its own under the title; a 💎 clicked on LIB-V taken away (by mistake). Every 💎 keeps its passport to be, read
    from the journal: the picture's DRAG runs on GOGH since the last 💎 — from, to, runs, dabs, jars in the order dipped, the runs' seconds
    (`rembrandt.py`'s `gogh_passport`, `gogh_diamond_add`; `app/gogh/diamonds.json`, in git, the canvases' record).

13. **ELBOW LIVE · JAR, and the panel in modules** (the owner, the same night, of the jar's fill, `GOGH/IMG_3280.jpg` a brush sunk in a full jar,
    `IMG_3294.jpg` a low one: "not only the press on the canvas, but the moment the brush dips in the jar … ELBOW LIVE · BRUSH plus the jar, one module;
    and all these [gap, width, run] another"). The elbow's angle in the paint, INK-Y's `dip`, a slider by ELBOW LIVE · BRUSH: written to `ink.json`, and
    during a DRAG `rembrandt.py`'s POST `/run/jar` from the next dip on (`Runner.set_jar`, `_jar_block`: the plan's `paint` block and the server's own dips,
    the fork a degree either side), by half degrees within +14 … +20° (his +14 … +16° of 2026-11-03, the top raised the same night: "not deeper, but a little
    higher"), the servo landing anywhere in its 1° fork. GOGH's panel: Progress; Elbow live (the brush, the jar); The dabs (gap, width, run); The canvas; The brush.
    **The press test**, `app/gogh/press-lengths-20` (the first, Jar 19's cluster six times, made again the same night: "from zero, with legs of
    different lengths"): six blocks, a line a block, the pause before each its own press and jar; each its lone dabs 4 · 6 · 8 · 10 · 12 · 15 mm 6 mm
    apart, to measure a dab's length and width, and a patch of 10 × 2 dabs of 12 mm side by side, to see the flood begin (156 dabs, ≈ 18 min).

14. **TEST BRUSH · TEST JAR, and a scale under ELBOW LIVE** (the owner, 2026-11-23, the night: "two buttons — TEST BRUSH and TEST JAR — they work
    only at a stop, as TEST or POINTS. TEST BRUSH: it goes down at the centre of the 20 × 20 and drives its 15 mm, then stands there. I can bring it
    back by pressing HOME. TEST JAR: the brush just dips in the jar … I simply watch how deep it dips"; "there are no divisions below. I do not
    understand the step"). TEST BRUSH: no dip, the canvas's centre, ELBOW LIVE · BRUSH's press, 15 mm down the picture, up, no home (the cup at hand's
    opening first: the elbow up into its fork, the shoulder to 0). TEST JAR: one dip at hand at ELBOW LIVE · JAR, nothing painted. Both at a stop
    alone, asked first. Under BRUSH −4 … +8°, under JAR 14 … 20°.

15. **TEST a tap at each corner itself** (the owner, 2026-11-23, the night: BL to BR measured 19 cm, "but there should be 20, no?" — every dot of
    TEST a 6 mm stroke toward the centre, the brush touching its middle ≈ 3 mm in; offered a tap: "of course!"): on GOGH, the canvas's corners by
    Preferences' margin, the carriage at the corner, the elbow down to the press (ELBOW LIVE · BRUSH) and at once up, nothing along the canvas; one dip
    at the first corner, TL twice with its wait, home (`tapRun`). The owner, at once: "now exactly 20 cm" — across Y too, where the strokes had read
    190: the dots' geometry, not the axis.

16. **Calibration: the press test first, the screen laid over the canvas** (the owner, 2026-11-23, the night, after `press-lengths-20` run: "it should
    have begun with it, not with the bear"; "write the adjustment into the canon, as a rule of calibration — useful for the future"). Before a picture
    on a new brush, jar or press:
    1. **TEST** at the canvas's corners (its taps 20 cm apart each way).
    2. **The press test** (`press-lengths-20`): six blocks, one thing changed a block — RUN, BRUSH or JAR — set in the pause before it, the journal
       keeping it (`dabs`, `press`, the `jar` events), pencil by the block on the canvas.
    3. **The whole canvas photographed square on**, its four edges in the frame (`GOGH/IMG_3441.jpg`); a ruler is not needed.
    4. **The overlay**: GOGH's screen dabs in blue (each block its RUN and GAP, the width 2.2) over the paint in pink, the photo laid by the
       canvas's edges for y, each block by its six lone dabs for x (`GOGH/IMG_3441 · six blocks overlay.png`).
    5. **The adjustment read off it** — the 2 mm brush, JAR +14 … +16, BRUSH +0.5 … +0.8, RUN 12 … 18 (blocks 2, 4, 5, 6; block 1 lay on the old
       flood, block 3 dry at JAR 18):
       - **the top** where the screen's is, 0 … 3 mm lower (≈ 1.5): the brush lands at the plan's top, J3's early 3 mm in the air;
       - **the tail ≈ 14 mm past the screen's end** (12 … 15; ≈ 11 for the 15 mm dab): a dab on the canvas the screen's + 12 … 14 mm. The lone
         dabs 4 · 6 · 8 · 10 mm alike (the floor: FORMG.minLeg 3 + RUN + J3 3 + 3): 17 mm at RUN 12, 19 at RUN 14, 24 at RUN 18; the 15 mm's 22,
         23, 25 (est.). The RUN moves the length one to one;
       - **the width ≈ 5 … 6 mm** 4 mm under the top (the screen's 2.2), ≈ 3 at JAR 18;
       - **columns apart**: 2 and 3 mm one mass, 4 mm in groups of three or four — apart only from ≈ 6 mm, the head's width;
       - **x**: the dabs where the plan puts them, within ±0.5 mm in a row of six; across the whole canvas not read better than ±3 mm from a photo.
    6. **GOGH's screen and GEN-V not yet changed by it**: a dab still drawn as the plan's, 2.2 wide — the adjustment theirs when the owner says
       (paint mechanics: proposed first). GEN-V's 8 … 15 mm dabs of the 2 mm brush come out ≈ 17 … 25 on the canvas.

17. **Master and slave on the screen** (the owner, 2026-11-23, the day: "a barely visible yellow contour of the sausage, the master, and the pink drop
    with its red contour its phantom slave. So we can correct that drop of 1.5 mm and its tip 13 mm past the end … the blue sausage is the Drag key, and
    the overlay the Picture key"): the master the plan's dab, the slave the paint as the press test laid it, hung on the master's way by two numbers of
    the screen's alone — **Drop · top**, the paint's top under the way's start (1.5), and **Drop · tip**, its tip past the way's end (12; the RUN's 2 mm a
    step more) — read again off every press test's overlay. On Press test 3's card first (`press-paints-20`, `drop`); **on every
    picture of GOGH since 2026-11-25** (the owner, of the piglet: "add to the new pictures from GEN-V / LIB-V the function Drop TIP + Drop TOP, these two
    sliders are not there now"): a GEN-V picture's Picture in drops as wide as Width, no outline; GEN-V's own sketch still the plan's dabs (`goghplan.js`,
    `DROP`, `dropOf`; `formg.js`, `drawDabs`, `drawDrops`, `drawMasters`; the drops made once for the sliders as they are, `pathOf`, drawn at any zoom).

17b. **1 and ½, and the brush** (the owner, 2026-11-23, the evening: "maybe simply in stripes, as rgb-led.png … by the principle of 1 and ½ … if a headlight or
    some small detail, ½ a seed; if a fill as the bonnet, there 1 leg"; then: "can a vertical tools menu be made, with a brush? I marked here the seeds I want to
    paint over"; of where to keep the changes: "this is GOGH-2's preparation. We put everything on GitHub. With the repainting — I just need orange indicators —
    this is v.1.2.9"):
    - **a seed in the plan**: a card's `dab.seed` — a dab no longer than it laid as RUN 6 lays every dab, ≈ 7 × 3.5 mm, whatever the RUN; a longer one a
      leg, the RUN its own; so legs and seeds go in one DRAG (`isSeed`, `dabLeg`, `dropOf`); `GOGH/generator/led.py` makes such a card off a GEN-V sketch;
    - **the tools**, a column at the picture's left: **V** the hand, **B the brush** — a jar chosen in THE JARS (its row), a drag over the dabs gives every one
      it touches that jar, a cell of its own; let go, the card and its picture written into `app/gogh/` by `rembrandt.py`'s POST `/gogh/card`
      (`gogh_card_edit`: every jar as it was but its cells, no dab added or lost, a jar left with none out); **⌘Z** undoes a stroke; not while a run is on,
      not on a frame's piece (`formg.js`, `brushDown`, `brushAt`, `cardSave`).
    - **+ ADD COLOR** (the owner, the same evening: "one more paint, the light grey Jar 3 — I will try to redraw the headlights, I do not like that there is so
      much black on it"): one of his jars, THE JARS' list, a line of its own in the picture, after the card's jars (last in Layer 1), none of its dabs yet —
      chosen at once, the brush on; its first stroke saves it into the card (`a<n>`, `gogh_card_edit`); DRAG refuses while it has none;
    - **two layers** (the owner, of the gummy bear's head: "last we lay only the seeds of the lightest and the darkest. Properly as Layer 2. Then the wet on
      wet is solved too"): `led.py`'s `ext` — the seeds of the two lightest and the two darkest jars a line each, `late`, Layer 2 on the dry first, the darks
      first, the lightest last; and `near`, a cell's halves of near shades (ΔE76 under 12, est.) one leg.
    - **THE JARS at the left, the cards' ×** (the owner, the same evening: "let us move the paint jars to the left, nearer the library of pictures. The brush and
      the arrow go up. So it is easier to choose the colours — and the Progress panel opposite"; "crosses (x) on the cards … so that they hide in LIB-V. If
      needed, in LIB-V you click on them, they come back. There are many now and I get confused"): on GOGH THE JARS a column between the library and the
      picture, the tools at the picture's top left; a card's × hides it — this browser's list, `rembrandt.gogh.hidden.v01` — LIB-V showing the hidden under
      their own line, a click bringing one back; a run's own picture never hidden.
    - **PAINT, a view key** (the owner, the same evening: "for all the pictures in GOGH a new key: PAINT — and in it, just there, the light yellow contour
      from DRAG … in Picture no yellow contour, so I do not get confused when zoomed far out"): Picture · Paint · Drag · ▶ Play — Picture the drops alone (a
      card in drops; else the dabs as GEN-V drew them), Paint every picture's drops with the masters' yellow hair, Drag the masters.

`src/goghplan.js` (`dabsOf`, `sketchV`, `dabLeg`, `passesV`, `dabRunsOf`, `DAB_UI`, `DAB_BRUSH`, `dabOf`, `fitV`, `dabOnScreen`, `GENV_FORMATS`, `fieldV`, `cardOfSketch`, `idOfSketch`); GOGH's
page FORM-G's (`formg.js`, `data-tab="gogh"`), GEN-V its generator, as GEN-F FORM-G's.

## The panel: no notes on it — everything under (i) (canon)

The owner, 2026-11-22, the evening, of GOGH's canvas section (the walls, the frame and MARKS written out under it) and the line under its sliders:
"it is forbidden to make noise and mush in the control panel. No explanatory notes in the UI / UX on my own — all of it is needed, but under the pop-up
info button (i)"; of the sliders' line: "it is obvious as it is".

1. **The panel shows keys, sliders, fields and their values; nothing written out beside them.** What explains — how a slider works, where the walls
   are, why MARKS have no room, what a frame does, what a screen will cost — goes behind an **(i)** by the heading it belongs to (`<button class="info"
   data-for="#…">`), closed at first.
2. **A warning too**: its text behind the (i), the (i) its colour, steady (`.info.warn`; "No blinking"); the key that would do harm refuses when pressed,
   with its reason, as before. Only what stops a run colours it — MARKS with no room does not.
3. A result after a press stays a line, short (🐾 Approved → LIB-V); its detail a tooltip.

On GOGH, LIB-V, FORM-G's family (`formg.js`'s `canvasReads`) and GEN-V since that evening; a new tab or key by it from the start.

## Working rules

- **`git pull` first. What the machine did comes in two ways**, both
  listed, newest first, in the `PHOTOS.md` of the tab the run belongs to:
  **`HOLO-Claude/PHOTOS.md`** and, since 2026-11-16, **`FORM-G/PHOTOS.md`**:
  - **photos**: the owner's iPhone → the cloud chat → cloud-Claude pushes
    them to `HOLO-Claude/photos/<date>/` or `FORM-G/photos/<date>/`;
  - **films**: the machine's camera is wired to the MacBook, so a film
    stays on this Mac; Claude in VS Code cuts a frame every 2 s into
    `HOLO-Claude/eyes/<date>/` or `FORM-G/eyes/<date>/`, writes the batch
    in that tab's `PHOTOS.md` and pushes.

  Cloud-Claude pushes `HOLO-Claude/JOURNAL.md` too. At the start of every
  session, and before every commit: `git pull`, then read the newest batch
  in both `PHOTOS.md`. When the owner speaks in VS Code of "the photos",
  "the latest photos", "what I sent", he means the newest batch there.
  (The owner, 2026-11-16: "I take the photos on the iPhone and send them to
  you in the chat. You upload them to GitHub with a note for yourself in
  VS Code. When I write to you in VS Code on the computer, you already know
  which photos are meant"; "yes, I allow adding FORM-G to
  HOLO-Claude/PHOTOS.md. The README may be added to.") (The owner, 2026-11-14: "I post the photos of the
  process here, from the iPhone. You can upload them to GitHub yourself,
  start a PHOTOS.md for you in VS Code, add an update to the README; so
  that when I open a new chat, you understand that the new photos have to
  be pulled from GitHub into HOLO-Claude." Then: "Video I can't shoot from
  the iPhone, the camera is tied to the MacBook. You can add this to the
  README too. Photos to GitHub from the iPhone, and from the MacBook the
  video from the MacBook. In fact you and I have just made a phone :))")
- **The artist decides what to paint. The brush determines how it can be
  painted. The algorithm must reconcile the two without sacrificing either.**
  An algorithm may adapt a painting to the machine, but it must never silently
  change the artist's intent: what the machine cannot paint, the program reports
  to the artist and does not quietly redraw. (Kuzya, 2026-11-06, after a first
  try at OPM-G gave short spans of a composition to another paint; the owner,
  asked if it goes into this README: "yes".)
- **English everywhere**: UI, docs, code comments, commit messages.
- **Do not re-propose** anything in `Rembrandt.md` §1.
- **Mark every unmeasured number `est.`**, in the UI and in the code. Paint
  behaviour goes into Adjustments, never hardcoded.
- **No drying timers or warnings. No washing station.**
- **Ask before changing anything that moves the machine**: the Job tab,
  `rembrandt.py`, the contract with the firmware.
- **Small commits**, one change each, with a line in `CHANGELOG.md`.
  An owner decision is recorded with its date and his words, in English.
- **Rembrandt is private on GitHub** again since 2026-10-30, the evening
  (the owner: "you may push, and close it please; it will be private
  again"); public from 2026-10-29 (the owner: "open it,
  please, for a minute, I want to show it to Kuzya"), and the works of
  other artists are out of it and of its history ("maybe just delete the
  others' works? keep ours and the photos of the machine"), INKA/ too ("do
  not put it on GitHub at all, it is full of secret pictures"), TAPE-images/
  ("stays on the disk, not to GitHub"): they stay
  on this Mac, in `.gitignore`; a new reference by another artist goes
  there too. Before that private since 2026-10-11, the references of
  ALU-cut-Claude/ in it (the owner: "put all the works in and close access;
  we will open it later if chat-Claude needs to be shown again"). Public
  earlier the same day ("unfortunately GitHub cannot be closed: private
  repos do not work for chat-Claude"); private 2026-10-05 … 10 ("close it, please, make it private", on hearing
  that the references hold other artists' works); public 2026-10-04 … 05
  ("I opened it for Claude in chat. You may push, I allow it, and leave it
  public"); private before (2026-10-01: "Private on git: this is strategic
  development at the Art Basel level"). Nothing is pushed without the
  owner's word.
