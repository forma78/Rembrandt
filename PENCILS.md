# Pencils · paper studies

2026-10-26. The owner's proposal: “Take BLEND as the base, call the new tab
Pencils”; “10 pencils — 10 passes”; “at least test it on A3.” The colour
placement is already his. The new model turns that composition into strokes
of a finite pencil inventory. The initial study uses orange, yellow, brown,
green and blue, after the fragment he singled out in his 23:04:34 screenshot.

Open `http://localhost:5164/pencils.html` with `rembrandt.py` running.
Off the top row since 2026-10-27, DACHE in its place (the owner: "it
can be hidden, and its ideas taken"); the page stays, at its address.

1. **From current BLEND** copies the browser's BLEND drawing and its colour
   placements. Alternatively open a BLEND Library save or its saved project
   SVG. The source stays untouched. A3 is 297 × 420 mm; landscape and A4
   are also available. Fit scales the composition uniformly inside the margin.
2. **Colour source** has two modes. **BLEND Result** treats the digital
   painting as the desired colour reference, then matches each tint to a
   real pencil and a stroke coverage. A pale tint leaves more paper visible.
   BLEND's existing paint renderer supplies only that reference; it is not
   presented as a prediction of acrylic or pencil behaviour. **Placements**
   uses the original colour-placement map directly, with editable assignments.
3. **Pencil box** is a separate inventory: editable names, swatch colours,
   enabled pencils and coats (1–6). The initial ten swatches are placeholders,
   not a claim about the owner's stock. BLEND colours are assigned to the
   nearest enabled swatch in CIE Lab; each assignment can be changed by hand.
   White areas default to unmarked paper. Green requires a green pencil.
4. **Mark making** fills each BLEND contour's band with narrow parallel
   pencil tracks, and its core with concentric tracks. Stroke spacing and
   band width control coverage. Adjacent colour regions interleave strokes
   over Transition mm in Placements mode; no calculated mixture creates a
   new pencil. Interleaving length holds a chosen colour along each short
   stroke section, avoiding a lift for every reference-image pixel.
   The seed keeps a study repeatable. New interleaving changes this pattern.
5. **Passes** collect every stroke of a pencil, with all its coats before
   the next pencil is mounted. Separate strokes need a lift; travel is
   ordered in alternating strips. Each coat repeats the same physical
   paths. Changing the number of coats does not change the colour map.
6. **Paper**, **Paths**, **Colour map**, individual pencil buttons and
   **Play the passes** show the plan. V enables moving and resizing keys;
   the key fields also edit their corners, sizes and positions. Undo/redo
   and Library saves preserve the full study and inventory.

The preview renders the exported centre lines with estimated coverage and a
paper-tooth overlay. It is not a measured pigment or pressure simulation.
Trace width, swatch colours, tone and timing remain **est.** Timing includes
drawing, pen-up travel and an estimated 0.8 seconds per lift/lower cycle;
it excludes mounting, sharpening and machine acceleration. The swatch SVG
gives each pencil three patches: one, two and three coats. Use the same
paper and spacing as the study, inspect the result, then adjust swatches,
trace width, spacing and coats.

**Exports:** one SVG per colour, one layered SVG with every colour, and a
JSON pass list. All drawing coordinates are real millimetres, with a lift
between paths. Coats are explicit repeated paths. The swatch sheet's text
is in a separate `labels` group; only `strokes` is the drawing. No paper
rectangle is plotted. Stroke centre lines are clipped half a trace width
inside the sheet, so the whole nominal nib stays on paper. A project SVG's
metadata reopens its full editable state; the Library routes PENCILS saves
back to this tab.

This version plans and exports. It does not call the machine's run, arm,
home, ink or calibration endpoints. The existing machine protocol and
runner are unchanged; SVG is not a CNCDM-001 command file. Connecting pencil
passes to execution needs a separate holder/lift test with the owner.

Files: `app/pencils.html`, `app/pencils.css`, `app/src/pencils.js`,
`app/src/pencilplan.js`, `app/src/pencilreference.js`, `app/src/pencilworker.js`.
Geometry and colour placement reuse BLEND and INKA. The optional digital
reference is rendered separately; the pencil plan uses only actual pencils.
Paper dimensions and inventory are kept under `rembrandt.pencils.v01`,
independent of the shared machine canvas. `node --test test/pencilplan.test.js`
checks finite-colour separation, repeats, bounds, import and SVG round trips.
