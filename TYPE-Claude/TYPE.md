# TYPE tab

Letters as bands of parallel brush lanes, painted in three passes. The working prototype is `rembrandt_type.html` (single file, no dependencies); port its logic into Rembrandt as the TYPE tab, keeping the glyph skeletons (`glyphs.json`, New Yuri) as the source of letter shapes.

## Glossary additions

- **Band**: one straight or curved run of a letter, a pill with round ends. A stroke of `glyphs.json` is split at every corner sharper than 25°, so V, M, Z, L are made of overlapping bands. O, 0, 8 are closed bands.
- **Lane**: one brush-down loop inside a band. Open bands get concentric stadium loops (out on one side, round the end, back on the other); closed bands get concentric rings; dots get concentric circles. Lane half-widths run from `band/2 − brush/2` down to 0, spaced by the lane pitch.
- **Mark**: a short stroke across a band drawn from INK-2. It shows where the painter squeezes a stripe of paint. Optional ticks next to it give the paint number (1 tick = paint 1).
- **Session**: a group of bands that are marked and dragged together. Bands that overlap a band of an earlier session go to a later session; the earlier one must dry first. Modes: wet on wet (one session), dry between letters, dry every overlap.
- **INK-1**: watercolour cup, used only by pass 1.
- **INK-2**: mark cup. **Dip here only for marking (pass 2).** A neutral, diluted acrylic that disappears under the paint squeezed on top of it.

## The three passes

1. **Trace**, INK-1, watercolour. The outline of every band at its full width. Dip every 400 mm of line.
2. **Marks**, INK-2. Per session, one stroke across each band every `mark spacing` mm, plus ticks. Dip every 4 marks. After the pass the painter squeezes the paints onto the marks by hand, following the paint map.
3. **Drag**, no dip, dry brush. Per session, every lane as one continuous brush-down path. Each lane starts 4 mm before the band's first mark and runs 14 mm past its own start at the end, so it closes without a seam.

## Files the prototype writes

All SVG in canvas mm, y down, origin top left, `width`/`height` in mm. Each `<path>` is one brush-down run, in drawing order.

| File | Group id | `data-ink` | Extra attributes |
|---|---|---|---|
| `*_1_trace.svg` | `pass1-trace` | `INK-1` | `data-dip-every-mm` |
| `*_2_marks[_sN].svg` | `pass2-marks-sN` | `INK-2` | `data-dip-every-marks`, per path `data-paint`, `data-tick` |
| `*_3_drag[_sN].svg` | `pass3-drag-sN` | `none` | `data-brush-mm`, per path `data-letter`, `data-lane` |
| `*_paint_map.svg` | | | For the painter only, not for the machine |
| `*_plan.json` | | | Bands, sessions, mark positions and paint numbers |

## For Claude Code

- Add INK-2 to the INK tab (cup position on the table) and to the canon/README with the line above.
- Pass 2 dips into INK-2, pass 3 never dips; read `data-ink` rather than guessing from the file name.
- Keep the Result simulation in the tab: it is how layouts get judged before paint goes on the canvas.
