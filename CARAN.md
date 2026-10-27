# CARAN · a frozen Result in pencil

2026-10-27. The owner's change of principle: “take a cast of the Preview,
assign each shade its own pencil”; “a full pass across the sheet, as the
brush used to go — it lifts here and lands there”; small squares may be
drawn perpendicular to the contours, “like weaving a basket”. CARAN sits
beside DACHE so the two approaches can be compared.

Open `http://localhost:5164/caran.html` with the existing server running.

1. **Capture DACHE / Capture BLEND** copies that tab's current composition
   and renders its Result with the same renderer and native raster spacing.
   The result is frozen. Changes to pencils, spacing, speed, coats or a paper
   fragment do not regenerate it. On first visit CARAN reads the current
   DACHE or BLEND from this browser; if neither exists, it offers the latest
   saved composition through the Library. Open project also reads their SVGs.
2. **Snapshot / Pencils / Drawing** distinguish the original, the assigned
   finite palette, and actual drawing paths. Compare places the original
   beside the selected view, with matching zoom and position. No paint mixing,
   inferred tone, extra white overlay or paper-texture filter is applied.
   Every non-background source pixel selects one enabled pencil by CIEDE2000;
   Preserve sausage squares protects existing local contrast as described below.
   Exact background pixels remain paper. Pale pencils are ordinary colours
   here. A short run or rarely used colour is not removed.
3. **Long passes** follow rounded contours between the source keys. Geometry
   supplies travel directions only: colour is always sampled from the fixed
   raster. Covered contours can be skipped. Matching areas may be connected
   on paper only if the entire connecting centre line has that same assigned
   colour. Empty spans are lifted flights; long empty gaps are visited in a
   local order instead of repeatedly circling across them.
4. **Cross strokes on sausages**, on by default (the owner, 2026-10-27:
   “can we keep the sausages, so there are transverse strokes”; the barrel
   needs wooden staves as well as metal rings), keeps the actual sausage
   positions stored with the snapshot. Their strips are filled along their
   spokes, across the rings. Each strip still uses the pencils assigned from
   the frozen Result, with lifts where that colour ends. The reserved strips
   use this direction in place of the ring direction, with the same explicit
   coat count. The switch works on existing frozen projects without recapture.
   **Preserve sausage squares**, also on by default, addresses the owner's
   hand-marked Screenshot 2026-10-27 at 12.36.17 PM: separate green and red
   rectangles at the crossings, as well as the crosswise movement. When a
   darker source cell and both surrounding sides would all get the same
   pencil, choose a suitable darker enabled pencil in the cell's hue family.
   Its contrast must already exist in the frozen Result; flat areas gain no
   new marks. This is a palette-matching heuristic (est.), with an independent
   switch; no extra coats or old paint-placement colours are added. The plan
   reports how many source cells received this contrast protection.
   **Perpendicular small details** separately identifies small connected
   colour patches in the raster itself. A raster coverage pass also reaches
   gaps and isolated pixels missed by the contours. No darker squares or
   old paint colours are invented. Playback, actual paths, exports and DRAW
   all include the cross strokes; the plan reports their length.
5. **Line spacing / Pencil trace / Drawing speed / Coats** are independent.
   Default spacing and nominal trace are 1 mm, one coat, speed 80 mm/s,
   all **est.** Lift allowance is 0.18 s per cycle **est.**, editable under
   Lift timing & detail size. The motion estimate comes from the existing
   planner with its acceleration and corner limits, plus that separate lift
   allowance. Human pencil changes and sharpening are excluded. Lift time can
   overlap motion on real hardware; the displayed sum is an estimate, not a
   measured duration or a promise that only pencil changes take time.
6. **F / Paper fragment** limits the drawing to a rectangle at its original
   size and position. It does not scale the artwork or change the shared
   canvas. The pencil box is copied from DACHE when available and remains
   independently editable. A swatch shows its pass; Earlier/Later changes
   the order. Adding a pencil does not claim that an arbitrary RGB is in stock.
7. **DRAW** asks with the actual pencil order. Each pencil is sent as one
   continuous path with the existing planner's on-path elbow lifts (`W`).
   The existing `p-pause` waits for the first pencil and each subsequent
   change with the tool down. PAUSE resumes from the same point. STOP waits
   until the runner is paused before offering Continue drawing / Go home.
   Escape sends the existing stop. Opening, planning, playback and export
   never start a machine run. No server or firmware changes were needed.
8. **SAVE CARAN**, project JSON and drawing SVG preserve the frozen raster,
   source settings, inventory and drawing options. Library saves reopen in
   CARAN. The browser keeps the raster in its own IndexedDB database and
   settings under `rembrandt.caran.v01`; other tabs' saves are untouched.

The finite palette can differ visibly from the original's many shades. More
accurate measured pencil swatches and a suitable inventory improve that match.
The Drawing view shows nominal stroke footprints, not a pressure/pigment
simulation. A feature narrower than the actual tip, mechanical lift latency
and registration between pencils must be checked on paper. An assigned source
cell reached by a nominal path is not proof of a matching physical colour.

Files: `app/caran.html`, `app/caran.css`, `app/src/caran.js`,
`app/src/caranplan.js`, `app/src/caranworker.js`. Shared BLEND rendering,
DACHE's geometry helpers and pencil-change blocks, and `strokes.js` are
reused without changing their drawing behaviour on the other tabs.

Validation: `cd app && node --test`. CARAN's tests cover single-pixel details,
pale areas, finite-colour separation, explicit coats, fixed source data,
fragments, on-path lifts and pencil-change blocks. Browser checks use an
isolated profile with machine endpoints intercepted; real hardware has not
been run by Codex.
