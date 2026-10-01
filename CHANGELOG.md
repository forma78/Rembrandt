# Changelog

Rembrandt, the successor of RUBENS, for CNCDM-001. Newest first.
Machine measurements stay in RUBENS: `../Rubens/CALIBRATION.md`.

## Unreleased

- **The owner's decisions after the outside review** (2026-10-02): paint by
  eye for now, the brush dipping into cups later — no pointer, no laser, no
  syringe; the firmware is Rembrandt's; the edge matters more than the fill;
  arm strokes under study. Sonnet's layout stays in Adjustments, on hold.
- **The firmware in Rembrandt**: `firmware/CNCDM-001/`, from RUBENS
  `a143fbc`, unchanged.
- **`python3 rembrandt.py` in the project's root** starts the server too.
- **The paint is reckoned on the real gap between the lines** (Claude in the
  chat, in the outside review of 2026-10-01): above the curve the vertical
  copies lie closer on a slope, pitch × cos(slope), and a line there gets
  paint for that gap only — no double film, no ridges. IMG_9422's default
  curve: 195 → 189 drops, 409 → 397 ml (est.).
- **💾 SAVE on the Create tab**, in the second row after Export PNG (the
  owner): every save a new painting in the Library, named by the time; a
  click there opens it again, the reference and the layers with it.
  `rembrandt.py` takes Rembrandt's paintings into the Library as it took
  RUBENS's drawings; nothing else in it changed.
- **The owner's palette**, `app/tubes.json`, in git.
- **`README-review.md`**: the project for an outside view (the owner shares it
  with other AI models): the intent, the machine, the method, the dosing, the
  constraints, and the questions we want answered.
- **Four layers, the same on Create and Adjustments** (the owner,
  2026-10-01): Light, Dark below the curve; Sheet, Black above it, the black
  into the wet grey. A saved three-layer state goes over to the four. Tails
  or Round per layer is one setting for both tabs.
- **Only the chosen layer is a key** (the owner): the others are flat.
- **The tubes are the owner's**: on the Create tab a click on the shade or
  the name changes it, + adds a tube at the end, ⋮⋮ drags it in the list,
  × deletes one no layer uses; ⌘Z undoes it. **Kept on this Mac** in
  `app/tubes.json` — `rembrandt.py` serves and saves it at `/tubes`, as it
  does `calibration.json`; nothing else in it changed. Adjustments shows
  Sonnet's paints in the owner's shades and names.
- **Lanes and Drops on the Create tab** (build order steps 1 and 2, first
  cut): lines 8 mm wide and 8 mm apart over the whole image area — offsets
  below the curve, vertical copies above it, Sonnet's way; each line's paint
  read from the reference, neighbouring lines taking turns where it lies
  between two tubes; every run from its home into its tail; the drops across
  the lines at the homes, one tube at a time, the lighter first, with drops
  and ml per tube, est. Tails or Round per layer; a layer click shows the
  layers up to it. The paint numbers (line width, film, brush keeps, drop,
  nozzle, tail) live on the Adjustments tab, est. The inventory is Sonnet's
  13 shades with White; the layers as Sonnet laid them out. New modules
  `bands.js`, `drops.js`, `adjust.js`, with tests.
- **Adjustments: one row on top**, as on Job and Calibration (the owner): the
  layers 1–4 and Export PNG moved into the Layout block, the canvas rose.
- **Adjustments: Tails or Round per layer** (the owner, 2026-10-01: the top is
  solid black), in each layer's card; the top row keeps the layers 1–4 and
  Export PNG. The black U of layer 4 is Round by default, the rest Tails.
- **The Adjustments tab, first cut**: Sonnet's layout read from
  `adjustments/` — layers 1 to 4 one by one, 13 paints in the order they run,
  each line drawn as the brush leaves it: full width at its home, thinning
  into a tail (120 mm est., a slider), or round-ended as Sonnet drew them.
  Each paint's home, left or right, can be switched. 46.5 m of line, ≈ 19 min
  at 40 mm/s est. New module `layers.js`, tested against the real files.
- **The inventory is large** (the owner, 2026-10-01: a Pebeo set of 50 tubes,
  a Liquitex set of 80): gradients of many real shades side by side —
  **optical mixing**, Sonnet's way — next to the tail. **The top black goes
  into the wet grey**, after it in the sheet's session; Create's layer 2 is
  White, Grey, Black. The Adjustments tab starts from Sonnet's layout in
  `adjustments/`, 13 paints, the lines drawn with tails.
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
