# ALU-Claude

For Claude Code in VS Code, in the Rembrandt repo. Prepared by Claude in chat with the owner on 2026-10-08.

Put this folder in the repo root next to `TYPE-Claude/`, as `ALU-Claude/`. It holds:

- `ALU.md`: the spec of the ALU tab.
- `Rembrandt · ALU.html`: the working prototype. It is a single file with no dependencies; open it in a browser.
- `paper-test/`: the owner's hand-made run of the machine on paper, black and white acrylic, with its own README. This is the reference for Whole lanes, Master Flo.
- `new_composition_1-9.jpg`: New composition, compositions 1 to 9, as the prototype draws them.

## Read in this order

1. The repo's `README.md` and `Rembrandt.md` (glossary first), as always.
2. `ALU.md`.
3. `paper-test/README.md`, with the photographs.
4. `Rembrandt · ALU.html` in a browser. Press **Paper test, 8 Oct**, then **New composition** a few times.

Port the logic; do not call the prototype.

## If ALU is already in the repo

Bring it up to this version. Here is what changed since the first ALU prototype:

- **Whole lanes, Master Flo**: the new brush mode and the default. Every lane is the whole pipe in one run, inside lane first, with a lift after each. Marks go right across the pipe, by hand (the **Marks** tool) or every spacing. Paints lie along the pipe, a mark right across in each; never across it (corrected by the owner on 2026-10-08: the paints across are Segments, Alu's — `ALU.md`, Marks across).
- **Segments, Alu**: the old mode, formerly "Segments, Lett". Seams, Along and Across, fan ends.
- **Result**: paint now mixes as pigment, with strength by lightness. The brush is not washed between lanes. Wet paint is loaded into the brush. The brush's own track is laid behind it, which fixes lanes passing a wet crossing without taking paint. Tuned on the paper test.
- **New composition**: draws parallel whole-lane pipes only, in tubes. No Across segments and no fans.
- **Largest corner radius**: a new pipe setting.
- **Paper**: a new ground. The page 148 × 210 is new, and so is the Paper test preset.
- **Brushed aluminium**: removed.

## The owner's decisions of 2026-10-08

Record these in `Rembrandt.md` §1 and `CHANGELOG.md`, with the date and his words:

- "We do everything inside Rembrandt, that is what it was made for." No Illustrator.
- "The configuration we have now: three servos and two NEMA17. If it sells, I will build a second machine." No servo to turn the brush.
- "I will drive the brush as Florian does": the beads, and the crossings as stairs.
- The paper test: one lane per step at a crossing, "not in twos".
- New composition: "take out the across ones, just stripes in parallel."
- The modes are renamed **Whole lanes, Master Flo** and **Segments, Alu**.
- "Remove Brushed aluminium, I do not plan it at all."

## Not included

The other artists' works the owner showed as references are named in `ALU.md` but not included. The repo went private once over other artists' works in `references/`.

The rules of the repo's `README.md` apply. Write English everywhere. Make small commits, each with a line in `CHANGELOG.md`. Ask before changing anything that moves the machine.
