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
  CHANGELOG.md       what changed, newest first
  nolan-images/      the pictures NOLAN is made for
  design/
    create-tab.html  the UI design (downloaded from the design canvas)
  adjustments/       Sonnet's four layers on 500 × 700, the Adjustments tab's start
                     (app/adjustments links to it, so the server sees it)
  rembrandt.py       starts app/rembrandt.py from here
  firmware/
    CNCDM-001/       the board's firmware (from RUBENS, Rembrandt's since 2026-10-02)
  app/
    index.html       INKA, Inca patterns: tiles a spiral each, the brush on through a figure without a lift, a wipe between figures (new, 2026-10-17; the first tab since 2026-10-19; INKA/)
    stjohn.html      ST-JOHN, INKA with ⌘, St. John's Arms: four lobes, every loop round all of them from the top left lobe's window out, their inner sides across the middle (new, 2026-10-19; INKA's inka.js and inkaplan.js; St_John/)
    blend.html       BLEND, INKA with Illustrator's blend: keys and Steps shapes between every two, every shape a loop of the brush, the outermost first and every next over it, the core filled (new, 2026-10-26; INKA's inka.js and inkaplan.js, its blendplan.js; BLEND/)
    dache.html       DACHE, BLEND in coloured pencils on paper: BLEND's page, all of it; the Result the colour the pencils draw (new, 2026-10-27; INKA's inka.js and inkaplan.js, blendplan.js; DACHE/)
    opm.html         OPM, Optical Pigment Mixing: the machine draws thin contours in coloured pencils, a person paints them in — cells by the blend's own geometry, the loops' bands cut by the sausages' strips, every one its pencil, its paint; or Merged, one pencil's cells one area (new, 2026-10-27; inka.js and opmplan.js; OPM/)
    opmb.html        OPM-B, OPM bigger for the 60 × 60 cm canvases: rows 6 mm at least, the rays 10 mm wide, the pencil off the paper between contours, four rounds (new, 2026-10-28; OPM kept as it was)
    opms.html        OPM-S, OPM for the small canvases, OPM as it is and two things more: FRAME by TEST, the picture's outer contour alone, to lay the canvas straight by it; DRAW BW · DRAW CLR in a row, every contour in one pencil without a change, or the colours as before; Align and the ground in a second column of the Tools (new, 2026-10-28; OPM and OPM-B kept as they were)
    opmw.html        OPM-W, OPM-S for wood, all of it, and no arc: every corner of the loops, the keys and the frame in straight pieces, Corner facets, three at first — to cut in wooden sticks or foam board and glue on (new, 2026-10-28, v.1.1.2; OPM-S kept as it was)
    opmp.html        OPM-P, OPM-W for paint: every block — a side, a facet of a bevel — its own rows the brush apart, ending on the blend's perspective rays, bound by its bands (12 mm = 6 + 6); every line once, the rows block after block first, then the rays; DRAG in DRAW CLR's place, a colour at a time with one brush, Rubs times, a pause between; PAINTING MACHINE with its ELBOW LIVE (new, 2026-10-29, v.1.1.3; OPM-W kept as it was)
    form.html        FORM, OPM-P for figurative painting: the forms off a photo — Auto forms, the background left out — every form OPM-P's rings and rays (the straight skeleton), its cells the photo's colours; metal, glass (its rings rounded inside, a curl in the middle), rubber; V a form and its points, K the knife, O Reflect, U Unite, M the sausages, Out · in; the Preview, the brush through sausages off the photo; Rotate Canvas CCW · CW by the zoom (new, 2026-10-30; src/form.js, src/formplan.js; FORM/)
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
    adjustments.html Adjustments (new)
    calibration.html Calibration (from RUBENS); the wave test, the pencil's lines left and right (wavetest.js, 2026-10-29)
    library.html     Library (from RUBENS)
    prefs.html       Preferences, the gear after Library: what holds for every tab, in this browser — TEST's margin and its dots at TL (new, 2026-10-20; src/prefs.js; and the top row, every tab ticked in or out, 2026-10-27, src/tabs.js)
    style.css        RUBENS tokens
    rembrandt.py     server and USB board (from rubens.py)
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
Yuri's letters as rings), `typeplan.js` (TYPE's bands and passes), `loveplan.js` (LOVE's copy of it), `aluplan.js` (ALU's pipes), `ccdplan.js` (CCD's rectangles of lanes), `biasplan.js` (BIAS's diagonal lanes and four runs, 90's upright and across, the plain stripes), `loomplan.js` (LOOM's woven cloth, its hops and halves), `inkaplan.js` (INKA's tiles, blocks and figures, their spirals, the wipes, the Result on a grid of the canvas; ST-JOHN's ⌘, its lobes and loops), `blendplan.js` (BLEND's keys, steps, loops and core, its spokes all round), `dacheplan.js` (DACHE's pencil box, bands and modules off the Result, the hatches, a pass a pencil, the pencil changes), `prismaplan.js` (PRISMA's rings and rays off the Preview, its twenty-seven more pencils, a pencil one path, rubbed), `opmplan.js` (OPM's cells, their pencils and contours, merged or not; OPM-S's outer contour and its one pencil, the one that shows best on the ground; OPM-W's corners in straight pieces, `facets`; OPM-P's blocks, every one its own rows the brush apart, its lines once and DRAG a colour at a time, `opmpPlan`), `formplan.js` (FORM's forms off a photo, `autoForms`, the background grown from its rim; the knife, `cutForms`; Reflect, `reflectForms`; Unite, `mergeForms`; the materials, `withMaterials`; every form's rings, the straight skeleton's wavefront, glass's rounded inside; the cells cut by the photo's colours, then OPM-P's `linesOf` and `dragsOf`; the Preview, `formPreview`, the brush through spokes of sausages), `form.js` (FORM's page: its panel, V and K, the photo on the canvas, the view turned), `align.js` (OPM-S's Align: the figures centred on the canvas, their gaps made even), `tapeplan.js` (TAPE's lanes round a cassette), `wash.js`
(the watercolour on the board, NOLAN's and TYPE's), and pointer mode in
`jobpage.js`.

## Run

```
cd ~/Rembrandt
python3 rembrandt.py        # http://localhost:5164; Ctrl+C stops it
cd app && node --test       # the tests
```

`rembrandt.py` in the root only starts `app/rembrandt.py`; either works.

Port 5164 — the owner's lucky number (2026-10-01). Only one program owns
the USB board: close RUBENS (port 8766) first.

## Working rules

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
