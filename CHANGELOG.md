# Changelog

Rembrandt, the successor of RUBENS, for CNCDM-001. Newest first.
Machine measurements stay in RUBENS: `../Rubens/CALIBRATION.md`.

## Unreleased

- **Rembrandt runs on its own** (the owner, 2026-10-01: "run everything in
  Rembrandt, so there is order from day one"): the pages say "start
  rembrandt.py" where they said rubens.py; nothing reads from `../Rubens`.
- **The Create tab, first cut** (build order step 1, without the bands yet):
  the image area 568.5 × 865 mm with the canvas in it, 50 × 70 or 60 × 80,
  placed from Calibration or, until then, 50 mm under the top wall; the
  reference covering the image area, with its opacity; one curve drawn with
  RUBENS's Gesture, Pen and Select; every Curve number typed in place — a
  segment's own numbers, the length (scales the curve), the inner corner
  radius; the three layers with [+] and ×, the lighter tube first; the tubes
  in use. The house opens the curve of IMG_9422. New modules `curve.js` and
  `tubes.js`, with tests; Calibration offers 50 × 70 too. Adjustments has its
  tab, empty until step 4.
- **`rembrandt.py` on port 5164**, `rubens.py` renamed and nothing else changed
  in how it talks to the board; the tabs in the spec's order, Create · Job ·
  Adjustments · Calibration · Library, on every page.
- **Stage by stage, one tube at a time** (the owner, 2026-10-01): the tube's
  drops, its runs, then the machine waits for the owner's look — Again or
  Next. **Orange is in by default**, its home from the reference.
- **The owner's corrections of the UI sketch** (2026-10-01), in §8, which now
  wins over the sketch: two rows as in RUBENS, the view toggles centred in
  the second; formats 500 × 700 and 600 × 800 drawn on the image area as on
  the Calibration tab; the RUBENS tools on the left; Add new reference; every
  Curve number editable, the inner corner radius with no upper limit; [+] a
  tube in each layer; the Job tab as in RUBENS, STOP and HARD STOP under
  Pause; ⚠ only closer than the keep-out.
- **Port 5164**, the owner's lucky number (2026-10-01), instead of 8767.
- **The upper line is built by the program** (the owner, 2026-10-01); the
  blended lanes are fitted with lines and arcs within 0.1 mm, tangent
  continuous, for the firmware's `L` and `A`.
- **The machine paints everything, the black too** (the owner, 2026-10-01):
  from the edges inward, tails into the red and the grey; at the top along
  the U of the upper line, past the canvas by about 5 cm on purpose. The
  first painting's table now lists homes, tails and order; its numbers are
  computed, the old ones for 70 × 100 are gone. Orange is open.
- **Home and tail** (the owner, 2026-10-01, untested): every tube starts at
  its home with a full brush and dries out into its neighbour; the brush
  lifts at the end of the tail and goes back in the air. Swing marks are an
  ornament. Within a layer the lighter tube runs first. Drops lie at the
  homes; the colour preview uses the tail model of the spiral research.
- **The image area is the machine's reach** (the owner, 2026-10-01): one arm
  pose, 568.5 × 865 mm, a 50 × 70 canvas inside it on the 100 × 70 one; the
  paint past the small canvas is on purpose. The "57 → ~80 cm" of §1 was
  two poses; Rembrandt uses one.
- **Rembrandt is private** (the owner, 2026-10-01). **The copy from RUBENS**
  is from commit `a143fbc`, not the tag v0.1.3, and takes every module the
  listed ones import (`config.js`, `cnc.js`, `paint.js`, `gesture.js`,
  `librarypage.js`, `test/shapes.js`).
- **The start.** The spec v0.1, the design (five screens), the key image
  IMG_9422, the references and the earlier research from the chat, as the
  owner set them up on 2026-10-01.
