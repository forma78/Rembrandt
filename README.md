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
  FORM-G/generator/  how FORM-G's paintings are made, on this Mac, at the owner's request; not part of the app
  design/
    create-tab.html  the UI design (downloaded from the design canvas)
  adjustments/       Sonnet's four layers on 500 × 700, the Adjustments tab's start
                     (app/adjustments links to it, so the server sees it)
  rembrandt.py       starts app/rembrandt.py from here
  firmware/
    CNCDM-001/       the board's firmware (from RUBENS, Rembrandt's since 2026-10-02)
  app/
    index.html       Rembrandt's home: goes on to OPM-N, opmn.html (2026-11-04)
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
    formg.html       FORM-G, a library of finished paintings, no photo and no drawing tools: a picture's plan in formg/, OPM-N's DRAG SNAKE to the command, its question with Start from, BACK ONE CELL and the iPhone's remote; the brush fixed at 5 mm, the jars given (new, 2026-11-06; src/formgplan.js, src/formg.js; FORM-G/generator)
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
    adjustments.html Adjustments (new)
    calibration.html Calibration (from RUBENS); the wave test, the pencil's lines left and right (wavetest.js, 2026-10-29)
    library.html     Library (from RUBENS)
    prefs.html       Preferences, the gear after Library: what holds for every tab, in this browser — TEST's margin and its dots at TL (new, 2026-10-20; src/prefs.js; and the top row, every tab ticked in or out, 2026-10-27, src/tabs.js)
    style.css        RUBENS tokens
    rembrandt.py     server and USB board (from rubens.py); on the home Wi-Fi too since 2026-11-02, from another address only /remote with the key of remote.key (not in git)
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
Yuri's letters as rings), `typeplan.js` (TYPE's bands and passes), `loveplan.js` (LOVE's copy of it), `aluplan.js` (ALU's pipes), `ccdplan.js` (CCD's rectangles of lanes), `biasplan.js` (BIAS's diagonal lanes and four runs, 90's upright and across, the plain stripes), `loomplan.js` (LOOM's woven cloth, its hops and halves), `inkaplan.js` (INKA's tiles, blocks and figures, their spirals, the wipes, the Result on a grid of the canvas; ST-JOHN's ⌘, its lobes and loops), `blendplan.js` (BLEND's keys, steps, loops and core, its spokes all round), `dacheplan.js` (DACHE's pencil box, bands and modules off the Result, the hatches, a pass a pencil, the pencil changes), `prismaplan.js` (PRISMA's rings and rays off the Preview, its twenty-seven more pencils, a pencil one path, rubbed), `opmplan.js` (OPM's cells, their pencils and contours, merged or not; OPM-S's outer contour and its one pencil, the one that shows best on the ground; OPM-W's corners in straight pieces, `facets`; OPM-P's blocks, every one its own rows the brush apart, its lines once and DRAG a colour at a time, `opmpPlan`), `formplan.js` (FORM's forms off a photo, `autoForms`, the background grown from its rim; the knife, `cutForms`; a form drawn on top, `drawForms`; forms laid again on top, a paste or a transform, `layForms`, `transformForms`; the place a transform left given to a neighbour, `settleLeft`; Reflect, `reflectForms`; Unite, `mergeForms`; the materials, `withMaterials`; every form's rings, the straight skeleton's wavefront, glass's rounded inside; the cells cut by the photo's colours, then OPM-P's `linesOf` and `dragsOf`; the Preview, `formPreview`, the brush through spokes of sausages), `form.js` (FORM's page: its panel, V and K, the pen and the shapes, the photo on the canvas, the view turned), `formgplan.js` (FORM-G's pictures into OPM-N's rows: a jar a colour, a cell a run of legs, its idle run at once; the dial's dips in rows; the list, the second layer last), `formg.js` (FORM-G's page, and OPM-G's by its tab), `canon.js` (the canon of a long leg, no. 9: the landing inside, `startOnLong`, `ridersOnLong`; LAB's and OPM-G's), `align.js` (OPM-S's Align: the figures centred on the canvas, their gaps made even), `tapeplan.js` (TAPE's lanes round a cassette), `wash.js`
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
   the jar).
4. The paint taken: **ELBOW up first**, to +30°.
5. **SHOULDER back to 0°.** Painting goes on.

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
whole degrees, the servo stops up to ~1° short); and while the cup at hand
is on, `rembrandt.py` refuses a turn of the shoulder with the elbow out of
its fork up, the elbow below +14° with the shoulder off 0, and the wrist
with the shoulder off 0 — a run's or a jog's.

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

`src/canon.js`. On LAB (`real 2`, run on canvas the night of 2026-11-06/07, `OPM-G/IMG_2435` …
`IMG_2486`: the long legs clean and alike in all four copies) and OPM-G's run since 2026-11-07; not
yet in OPM-N's or FORM-G's.

## Working rules

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
