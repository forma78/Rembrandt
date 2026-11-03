# OPM-N — the task

For Claude in VS Code. Written 2026-11-01 from the owner's talk with
Claude in the cloud chat (the owner: "here we discuss, go to Amazon,
comment the photos; in VS Code we test, and new commits go from there to
GitHub"). Read `README.md`, then `Rembrandt.md` (glossary first), then this.

**OPM-N (Numbers)**: OPM-P's page, all of it, and the paint no longer
squeezed onto the canvas: every cell of a colour numbered, painted on its
own by a thin brush that takes its paint from the cup, the owner dipping
it from an iPhone remote, every dip written to a journal.

The owner: "In essence we just need controllable, perfectly even lines
that the machine draws with a brush."

## Decisions of 2026-11-01 (for §1, with his words)

- **No potter's wheel.** "We drop the idea of the potter's wheel, where the
  brush goes round in a spiral and knocks down absolutely all the sausages
  of paint, and in the end it comes out a dirty swill — we do not do that."
  (IMG_5976, 2026-10-26: sausages, the brush, then a palette knife.)
- **The paint from the cup, never squeezed on the canvas** — the way of §1
  (2026-10-02, "the way ahead is the brush dipping into cups"). One cup for
  now, the Ink tab's (`app/ink.json`, `dipAt` in `ink.js`); its colour
  changed by hand at a colour's pause. A second machine, the apprentice,
  serving the cups comes later (below).
- **The paint as it is, no thinning** ("we will struggle diluting acrylic —
  why? Let the brush go 25 mm/s, not 60, and dip more often"). Brush speed
  25 mm/s at first. *The same evening, after his hand tests: thinned with
  pouring medium after all — below.*
- **The tab: OPM-N** ("I propose to call the tab OPM-N (Numbers)").
- **Numbers by colour** ("not continuous numbering but by colours: if we
  have 20 colours, every colour its own set of numbers").
- **From the centre, clockwise** ("the numbering goes from the centre
  clockwise. I started with deep blue: 1 — by the clock face it is
  midnight, a new day — and so on to 8 in the morning"). His drawing on the
  tunnel blend (2026-11-01): deep blue (the core) 1 at 12 o'clock, 2–4 on
  the right, 5 at 6, 6–8 on the left; blue ring 1 1–8, ring 2 from 9 at 12
  o'clock; light blue 1 and 2 on ring 2's right facets, 3 at its bottom, 4
  on the left of the next ring.
- **A cell in several passes** ("two options: back and forth, and through
  the air"), **Rubs** as the pencil's ("as we did with the pencil, rubbed
  like sandpaper"). **Brush 2 mm** at first, **2 … 4 mm in 0.5 mm** steps.
- **Between two cells of a colour, through the air** ("the blue is already
  painted, so the brush may not go over the canvas: it lifts and goes
  through the air to the next cell").
- **Back = DRAG again in this cell** ("of course there is no ⌘Z in the
  physical world: repeat DRAG in the current cell"; Monopoly's "go back
  three spaces").
- **The dip by hand, from the iPhone** ("I will press the button 'dip into
  paint' as the cells get painted; they are of different sizes and we do
  not know yet how far a dip goes").
- **The journal** ("a log that records with which cell I pressed 'dip' how
  many times — data for the second robot helper; the colour too, so the
  paint, its pigment and binder, may differ; the cell's length and the
  number of runs; from it we find the right number of dips for every
  colour").
- **The iPhone remote** ("not only to pause the machine but to go back on
  the runs of every rectangle").

## Decisions of 2026-11-01, the evening, after his hand tests (`RoArte/`)

Claude in VS Code read the photos (IMG_1905 … 1971, on paper over a pencil
tunnel blend, a ruler in the later ones); the owner answered.

- **One brush: 0 Raphaël Textura 860 round** ("I chose one brush").
- **The tracks laid by the track's width, not the brush's size**: 2.5 … 3 mm
  by the ruler (IMG_1949: six tracks ≈ 17.5 mm; est.) — INKA's trail and
  swell ("I agree; that is why I took the photos with the ruler").
- **A dip**: ≈ 30 mm of track in pure acrylic (IMG_1954, a seam in the
  middle of its ~63 mm tracks: "pure acrylic — yes"); **75–80 mm mixed with
  pouring medium** (IMG_1971, no seam: "all 75–80 mm if the acrylic is
  mixed with pouring medium"). So **the acrylic thinned with pouring
  medium** ("if even you noticed the difference, we will have to take the
  trouble and thin our acrylic; until now I was not sure it was needed").
  **The ratio ≈ 1 : 1: 15 g of acrylic and 15 g of pouring medium in a 50 g
  jar** (est., by eye: "I have no scales. I am buying jars now — the ones
  the second robot helper will serve later; 50 grams. I will not fill it
  up, probably 15 g of acrylic + 15 g of pouring medium"). IMG_1971's
  ratio was by eye too, so L is measured anew at 1 : 1. The journal keeps
  the medium and its ratio with the paint, L differing two and a half
  times by it.
- **The brush's elbow may rest on the paper, as a pencil's** (`opmn` in
  `PENCIL_PAGES`, `rembrandt.py`; "yes, may and even must"): else DRAW BW,
  FRAME and DRAG stop when the brush lands and the elbow stays above its
  pose.
- **A track's bulb is its start, the fork always its end** ("the bulb is the
  start, the fork is always the end of a track").
- **His hand's marks are not the machine's**: the white between tracks, the
  bulbs and forks ("I cannot draw a line with even pressure and speed as a
  machine does, so white glints stayed; with the drawing machine there will
  be none"; "the hand shakes; all this is smoothed by the program") — no
  overlap or trick at the ends for them; the first run on the machine
  shows.
- **A dip's seam in a track kept** ("a little of the brush's effect gives a
  warm, valve-amp charm; the main thing is that all strokes are alike, but
  this is not a digital print, so all is fine"): DIP during a track as
  below, back to the same point, no lap.
- **`RoArte/`'s pictures of the arm kit stay** ("not authors' photographs
  but working pictures; I would leave it as it is"); its HEICs JPEGs, for
  GitHub later.
- **OPM-N is v.1.1.8; before FORM in the top row** ("OPM-N is now
  v.1.1.8"; "before FORM, please").

## Proposed by cloud-Claude, confirmed by the owner the same day ("yes, all so; checked")

- A colour starts with **one dip by itself**; every next dip is the owner's.
- **DIP during a track**: the brush lifts at once, flies to the cup, dips
  (in the paint 1 s, the Ink tab's), flies back to the same point, lands on
  the move and goes on; the journal keeps the track and the mm.
- **⏮ Back**: the brush lifts at once and DRAG runs this cell again from
  its first track; no dip by itself.
- Several figures on the canvas: a colour's numbers go on from one figure
  to the next, in OPM-P's figure order.

## Decisions of 2026-11-02

- **No colour in fewer than five cells but one, the accent, in one** (his
  OPM-N with 29 colours, RoArte/Screenshot 2026-11-02 at 2.11.07 and
  2.11.21 PM: Crimson Lake in one cell, Salmon Pink in two; 2.29.29 and
  2.29.37 PM: Sky Blue and Sky Blue Light in one each). The owner: "we
  have 29 colours, but some are in one or two cells only. I would keep for
  an accent only one colour that may be in one cell"; "the rule: one
  colour in one cell; then at once five cells at least are allowed; not
  two colours of one cell each in one picture, not three"; "I think the
  colours can be cut to 20 from 29"; "change the brush for one stroke? —
  a joke, simply"; Delete Yellow "a useful function, but I still have to
  look through all 29 colours, not very handy". So, by itself: a colour in
  fewer than five cells left out, its cells to the nearest of the rest,
  again till none is; of those in a single cell one stays, the accent —
  the one its nearest would change most (ΔE 2000, Claude's choice). On
  OPM-N alone (`fewCells` in `opmpPlan`), in place of OPM-P's next to
  nothing to paint (300 mm of brush), which took the one cell too. On his
  new palette (Library 2026-11-02 14-53) 21 colours: "21 and even 25 are
  allowed, if the proportion is logical and adequate" — no cap on the
  number of colours.
- **The iPhone remote, with the key** (asked: `rembrandt.py` on the home
  Wi-Fi, a key by a QR code on OPM-N's page; "yes, with the key"); the
  Mac's address on the Wi-Fi 192.168.0.227 that day. Step 5 goes on.
- **A dip every 75 mm, for now** (asked how to paint till DIP comes from
  the iPhone: "every 75 mm, for now"): the first of a colour by itself, as
  decided, then by itself every Dip every mm; whether it stays once DIP
  works is his to say.
- **🟥 STOP and ▶️ Go to on the iPhone** ("on the iPhone let us replace
  the Stop icon with 🟥 and add ▶️ Go to, without №"): the keys' labels
  only, the same keys.
- **The dip, open**: "it seems we will have to rework the INK tab and
  rethink the dip, so the machine does not drive to the other end of the
  table every 70 mm" — the cup at x ≈ 867 mm made a run of 3 h 22 min
  without dips 10 h 28 min with them (est., the page's sum); the owner is
  to describe how the dip should work.
- **The rows' step up to 45 mm** (Construction's slider, 20 at most till
  then: "I need it up to 45 mm. It is important for big formats"); OPM-P's
  brush width stays 20 at most.
- **The blend in Construction** ("into the CONSTRUCTION module at once":
  Blend 1, ↻ · ↺, its keys, + Key · − Key, Steps, Corners, the core's
  Step, Spokes, K1 · K2 in turn · Key after key); **the core always
  filled** ("take away Core filled, Core empty — I never leave it empty");
  **no Blends and tiles list, no Nodes** on the page ("I do not use it, it
  only makes noise") — the B, N and K tools still in the Tools.
- **The first DRAG on paper, a pencil in the brush's place** (22:18, DRAG
  AIR, Light Peach, the run stopped in cell 10; his photos and screenshots
  in `OPM-N/`, the HEICs made JPEGs on his word). TEST passed, the iPhone
  remote worked over the Wi-Fi. "It cannot stay like this":
  - **a 5–6 mm gap at every dip in a track** (IMG_2055, IMG_2056, cell 10)
    — the plan, rebuilt from the journal's settings, goes on from the very
    point; the brush lands and lifts on the move (README, "The brush lands
    and lifts on the move"). His words: "maybe count in the coordinates not
    the literal landing of the brush but with a compensating −5 mm" →
    **Dip overlap**, 5 mm back over the track after a dip in one (est.);
  - **a track's ends short of its cell's edges** (IMG_2052, IMG_2057, cells
    4, 2, 3: "between the 4th and the 2nd a good 1 cm") — the plan's tracks
    edge to edge; on paper each starts at the left edge with a hook and
    stops 4–8 mm short of the right one. Open;
  - **cell 4's first four tracks** (gone back to with ⏮ Back several times)
    lie ~7 mm right of its other five; the plan has them all edge to edge,
    the jump goes to the same commands. Not understood yet;
  - cell 6 the best of them (IMG_2053).

## Decisions of 2026-11-03

- **The cup on the beam — INK-Y, v.1.1.9** (the owner, `OPM-N/IMG_2060`,
  `IMG_2061`, `IMG_2062`: "the jar somewhere near … they fit at the left
  side, 90 mm between the 60 × 60 canvas and the frame … the machine need
  not go across the whole table, it is enough to drive along Y. SHOULDER
  turns −25.1°, then ELBOW dips −5°. Then up and back. All as now, only the
  jar not at a fixed point as on INK, but riding on the beam Y"; "let us
  write a tab INK-Y for it, the old one with the fixed jar I will hide";
  twelve flat-bottomed jars, ⌀57, ordered). The jar on a bracket of the
  beam's left end plate, riding with it in X. A dip: the brush over the
  rim, the carriage along Y alone to the cup's Y, the shoulder to −25.1°
  (40°/s, est.), the elbow in, a second, up, the shoulder back to 0, the
  carriage back; the pause between colours with the brush over the cup, as
  before. **Here** on INK-Y takes the carriage's Y and the shoulder's angle
  at once; the elbow's numbers the Ink tab's till typed. Once set, every dip
  goes there. On the 23:53 run (1879 dips): the flights to the cup 919 → 498
  m one way, ≈ 8 h 33 → 7 h 53 min (est.) — the shoulder's two turns, 1.3 s a
  dip at 40°/s, take back half of what the shorter flights give; the dip
  itself (in, 1 s, up, the turns) ≈ 4 s, 2 h of the run: **Dip every** is
  the bigger lever. The page asks `rembrandt.py` before such a run: only
  one that knows the cup on the beam turns the shoulder back by itself
  before ⏮ Back, ⏭ Skip and ▶️ Go to, and at the next run after one stopped
  over the cup — he restarts it himself.
- **The first run with INK-Y** (01:34, the shoulder −27.8°, the carriage at
  Y 0.1): the first dip whole, after the second "shoulder to 0°: the
  shoulder does not get to 0.0°" — it stood at −0.6° ("maybe just ignore
  such deviations?"). The dip's shoulder turns let off 1.5° (est.), every
  miss of 0.6° or more in the journal (`near`), to see how it comes back.
  At ~100 mm from the shoulder to the brush (est., from −27.8° to the cup)
  1° is ≈ 1.7 mm at the brush.
- **The shoulder on the flights** (`OPM-N/IMG_2073.MOV`, "20 seconds a
  stroke": to the cup 00:01–00:05, the shoulder and the dip 00:06–00:09,
  back 00:11–00:15; his: "drives to the cup and at the same time the
  shoulder turns −24° … back to the cell, and on the way the shoulder to
  0°"). The shoulder's turn is sent just before the flight and not waited
  for; seen there before the elbow. The firmware's "the arm and the rail
  never move together" (RUBENS's, eased 2026-10-02 for the wrist and the
  elbow's W) stays: it refuses a J once a path runs, not a path while a
  joint turns, so no flash was needed. His rule for rules the same night:
  "we write rules to avoid chaos, because chaos slows the work … if rules
  slow the work, speed is above the rules; they may be rewritten when it is
  conscious and raises productivity and speed".
- **The red pen's run was DRAG SNAKE** (23:53, `snake: true`, Dip overlap
  5; the pencil's at 22:18 AIR) — he asked, he had not written it down.
- **Cells 4, 2, 3 against cell 10** (IMG_2069, IMG_2068: "the size between
  the traces differs"). The plan, rebuilt from the journal (15081 blocks, as
  run), lays them alike: 2.3 … 2.4 mm apart in both. On paper the diagonal
  cells' snake goes in pairs — ≈ 5 mm, then ≈ 0.5 … 1 mm — where cell 10's,
  along X, is even: a diagonal track turns back in X and Y both, cell 10's
  turns step Y one way only. The pen lags behind the carriage against its
  way (play in the belts or the shoulder, or the arm giving to the pen's
  drag) — the same as the hooks at a track's start. To measure on scrap: a
  small snake along X, along Y and at 45°, the pairs' offset each; then AIR
  for the diagonal cells or the tracks shifted by half of it. Open.

## 1 · Numbers

Every cell of OPM-P's plan (`opmpPlan` in `opmplan.js`: `blocksIn`,
`blockCellsOf`, `dragRowsOf`) gets a **colour** (its pencil/paint, as now)
and a **number in that colour**:

- its **ring**: the band it lies in, counted from the core out — the core's
  own cells ring 0 (on a tile: its rings from the middle out);
- its **hour**: the angle of the cell's centre round its figure's centre,
  clockwise from 12 o'clock (0° at 12; a cell across 12 has ~0° and comes
  first, one just left of 12 comes last);
- sorted by ring, then by hour; numbered 1 … n in every colour.

The board shows the numbers in the cells (the owner's drawings: the number
in the cell's middle, its size by the cell), in the Paint view and in
Contour; the chosen colour's numbers strong, the others faint. The run goes
by them: a colour after another (the run's order, as OPM-P's), in a colour
cell 1, 2, 3 …

## 2 · A cell, the unit of the run

Every cell on its own: the brush comes in the air, lands, paints its tracks,
lifts. So the run can start at any cell.

- **Tracks** along the cell's row (its long edges, as OPM-P's drag runs
  along the rows' middles): k = ⌈W / B⌉ for a cell W wide and brush B,
  evenly apart (W / k ≤ B, no white between), the outer ones B/2 in from
  its contour; a trapezoid's tracks end on its rays.
- **Snake** — back and forth with the brush down, turning inside the cell —
  or **Air** — every track one way, the brush up and back through the air.
  Every track **Rubs** times (OPM-P's).
- **Brush** 2.0 mm, 2.0 … 4.0 in 0.5 (est.), on the panel (**Track width**, 2.5 at first, since 2026-11-02) — the tracks by
  its track's width, 2.5 … 3 mm for the 0 Textura (est., above); **Brush speed**
  25 mm/s (the owner's); the rest as PAINTING MACHINE has it (ELBOW LIVE ·
  brush, ↻ CW · ↺ CCW).
- Between cells of a colour: up, through the air, never over the canvas
  low.
- Between colours: OPM-P's pause — the brush up to Wipe; the owner wipes it,
  puts the next colour in the cup, Continue; then that colour's first dip.

## 3 · The iPhone remote

A page of `rembrandt.py`, `/remote`, Safari on the same Wi-Fi, "Add to Home
Screen" for an icon. Big keys, one hand:

- on top: the colour's swatch and name, **"Deep blue 3 / 8"**, the ring,
  the track;
- **DIP** (the biggest), **⏸ / ▶**, **⏮ Back** (DRAG again in this cell),
  **⏭ Skip**, **▶️ Go to** (a number pad, in this colour), **🟥 STOP**;
- at a colour's pause: "Next: Ultramarine — wipe the brush, change the cup,
  ▶".

**Network — ask the owner before this** (it moves the machine):
`rembrandt.py` listens on `127.0.0.1:5164` only; the iPhone needs it on the
home network. Then anyone on that Wi-Fi could move the machine, so the
remote carries a **key**: OPM-N's page on the Mac shows a QR code with it,
the iPhone scans it once; every `/remote` and `/run/*` call from another
address without the key is refused.

**The runner** (ask before changing it): today `/run/pause`,
`/run/continue`, `/run/stop`, `/run/kill`, `/run/trim`. New: a dip now, a
cell again, a cell skipped, go to a cell, and the state (colour, cell,
track) for the remote. Dips, cells and flights are ordinary moves — the
firmware's contract should not change; if it must, stop and ask.

## 4 · The journal

The owner: "this is robot training: first the leather one shows how it
should be done, then the machine goes by itself, having got the data" —
learning from demonstration: his DIP presses are the demonstration, the
journal its record.

Every run of OPM-N writes one, in `logs/` (kept off GitHub,
`.gitignore`): a line an event — the time, the painting, the **colour**
(its paint: name, pigment, brand), the **cell** (number, ring, hour), its
**length C** (its tracks' mean), **width W**, **brush B**, **tracks k**,
Rubs, speed, Snake or Air, and what happened: start, **dip** (on which
track, at which mm), back, skip, done.

After a run, per colour: the brush's way painted P = Σ k·C (times Rubs if
the journal shows it matters), the dips pressed D, and **L = P / D, mm a
dip** — shown on OPM-N and, once the owner says so, put into Adjustments as
that paint's measured number (no longer est.).

The formula the owner asked to check (he had C + B): dips in a cell
**i = ⌈W / B⌉ · C / L** — the paint goes on an area, so a product, not a
sum. A 6 × 40 mm cell, brush 2 mm: 3 tracks, 120 mm; at L 80 mm, 1.5 → 2
dips — L 75–80 with pouring medium, ≈ 30 in pure acrylic, 4 dips (his tests,
above; est.). Later the apprentice dips every L mm by itself.

## 5 · Later: the apprentice

Not now. A second small machine serving the cups (the owner's 50 g jars,
above) to one dock by the
canvas, so the brush always dips in one place, at one height, a wire to
wipe on (§11). Talked over on 2026-11-01: the Freenove robot arm kit
(FNK0036, three NEMA17, ±1 mm without load, 25 × 10 cm reach) as the
apprentice, run by a spare ESP32 in place of a Raspberry Pi, on USB from
`rembrandt.py` — never on the carriage, never squeezing paint on the
canvas. The journal's L per colour is what it will need.

## Order of work — small commits, a CHANGELOG line each

1. `opmn.html`, OPM-N as OPM-P's copy (`OPMN` within `OPMP` in `inka.js`),
   its own keep and Library label, a first visit OPM-P's composition; in
   the top row before FORM (the owner's). Done 2026-11-01, `opmn` in
   `PENCIL_PAGES` with it (the owner's yes).
2. The numbers: ring and hour, the order, the labels on the board; tests.
   Done 2026-11-01 (`numbersOf` in `opmplan.js`): a ring every band of the
   blend, the core's first; the hour round its band's own middle (a tunnel's
   core off the figure's middle has its own 12 o'clock); two rows of a band
   at one hour the inner first; a colour with no cell in the innermost ring
   starts further out. On Paint and Contour as big as the cell holds, none
   under 6 px (closer, they come); the chosen colour's strong, the rest faint.
3. A cell's tracks, Snake · Air, Brush 2 … 4; tests. Done 2026-11-02
   (`tracksOf`, `cellDragsOf` in `opmplan.js`): **Track width** 2.5 mm at
   first (2 … 4 in 0.5, est.), the panel's Brush; a wedge shorter along its
   row than across — a core's corner — along its long edges, from its outer
   row line to its inner (along its row it had tracks of 0.1 … 1 mm, the
   brush's dabs); a cell within 5 % of the track one, in its middle, not two
   a hair apart (OPM-P's FIT); a row cell's tracks from its outer edge in,
   the way round, across ones side by side the way round. DRAG, Drag and
   ▶ Play Drag by cells, a colour's by their numbers; Brush speed 25 mm/s;
   the rows' step in Construction. No dip yet: DRAG asks to load the brush
   by hand. The same day, after he tried it: **DRAG SNAKE · DRAG AIR** keys
   in the deck in place of the switch ("Painting machine is not very
   handy"), and the views **Drag · Preview · Contour · Numbers · Result**
   ("Paint replaced by Numbers … the last one Result, the final version,
   without numbers").
4. The run by cells, a colour's first dip from the cup; tests. **Ask before
   the runner.** Done 2026-11-02, no runner change (plotRun's dips, the
   Ink tab's cup): a dip at every colour's start, then every **Dip every**
   mm of track, 75 at first (the owner's "every 75 mm, for now" till DIP
   comes from the iPhone; 0 a colour's first alone) — between two strokes
   when the brush has painted half of it, else in one, back to the same
   point; the pause between colours over the cup.
5. `/remote` and the key. **Ask before `rembrandt.py` listens beyond the
   Mac.** Asked and answered 2026-11-02 ("yes, with the key"). Done the same
   day: the Wi-Fi with the key (`app/remote.key`), `remote.html`, DIP in
   the runner, Pause · Continue, STOP, the colour and the cell, the QR code
   on OPM-N (**iPhone remote**). ⏮ Back, ⏭ Skip and Go to № the same day
   ("the next step"): the brush up at once, through the air to the cell's
   first track, down, on; Skip after a colour's last cell to its pause;
   Go to a cell of the colour now, by a number pad; no dip by itself.
6. The journal and L per colour.

`cd app && node --test` stays green (441 on 2026-11-01, 444 on 2026-11-02, 452
on 2026-11-03), and `python3 app/test/runner_test.py` (88; 105 on 2026-11-03).
