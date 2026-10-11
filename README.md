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
    nolan.html       NOLAN, the ribbons (new; NOLAN.md)
    newyuri.html     New Yuri, letters as rings (new; off the top row since 2026-10-06)
    glyphs.json      the owner's letters: skeletons of lines and arcs
    index.html       ALU-CUT, ALU with the new things, the first tab (new, 2026-10-11; ALU-cut-Claude/)
    ccd.html         CCD, rectangles of straight lanes after Carlos Cruz-Diez (new, 2026-10-11; Cruz-Diez/)
    type.html        TYPE, letters as bands in three passes (new; off the top row since 2026-10-11)
    love.html        LOVE, TYPE's copy for the new things (new, 2026-10-07; off the top row since 2026-10-11)
    alu.html         ALU, pipes of paint in whole lanes (new, 2026-10-08; ALU-Claude/)
    smkn.html        SMKN, ALU with the paints in stock, Soumkine's palette (new, 2026-10-08)
    create.html      Create (hidden from the top row since 2026-10-04)
    job.html         Job (from RUBENS, plus pointer mode; off the top row since 2026-10-06)
    test.html        Test, the test bench (new)
    ink.html         Ink: the cup the brush dips into (new)
    adjustments.html Adjustments (new)
    calibration.html Calibration (from RUBENS)
    library.html     Library (from RUBENS)
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
Yuri's letters as rings), `typeplan.js` (TYPE's bands and passes), `loveplan.js` (LOVE's copy of it), `aluplan.js` (ALU's pipes), `ccdplan.js` (CCD's rectangles of lanes), `wash.js`
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
- **Rembrandt is private on GitHub** since 2026-10-11, the references of
  ALU-cut-Claude/ in it (the owner: "put all the works in and close access;
  we will open it later if chat-Claude needs to be shown again"). Public
  earlier the same day ("unfortunately GitHub cannot be closed: private
  repos do not work for chat-Claude"); private 2026-10-05 … 10 ("close it, please, make it private", on hearing
  that the references hold other artists' works); public 2026-10-04 … 05
  ("I opened it for Claude in chat. You may push, I allow it, and leave it
  public"); private before (2026-10-01: "Private on git: this is strategic
  development at the Art Basel level"). Nothing is pushed without the
  owner's word.
