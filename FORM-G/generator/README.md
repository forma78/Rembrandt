# FORM-G's generator

How the paintings of the FORM-G tab are made, on this Mac, by Claude, at the owner's request ("I will simply ask you to add something else", 2026-11-06). Not part of the app: the tab has no photo and no algorithm, only the finished plans in `app/formg/`.

A plan is one grid of columns 5 mm apart, the brush's. Every column is solved on its own against the photo, what it could not reach goes on to the next, so neighbouring columns of neighbouring shades mix in the eye.

| file | what |
|---|---|
| `brushsim.py` | the rubber brush on canvas, read off `OPM-G/IMG_2415` (est.): track, ridges, film, the load falling off along a line |
| `paintrun.py` | a plan's cells into spans and snakes, light under dark |
| `watchgeo.py`, `clean_photo.py`, `hyper.py` | the watch: the geometry of its dial, the printed words off, the 54 shades + 5 |
| `cargeo.py`, `hyper2.py` | the green 911: its outline, the badges off, 60 jars made to measure |
| `whitecar.py`, `porsche-white.jars.json` | the white 911 in the canon's form, its tones off the owner's and Kuzya's picture laid onto the canon; a colour of the canon is such a subclass of `RedCar`: its picture (`source`), its body's shadows (`tone_map`), its fixed jars |
| `redgeo.py`, `redcar.py`, `porsche-red.jars.json` | the red classic 911 (2026-11-08), the canon of the 911's form (the owner: "I would take the red one as the canon"); its jars kept in the json, so that an edit does not re-make the palette (`RED_NEW_JARS=1` makes them again): hyper2's technique on a geometry read off the picture and made symmetric about the axis — the outline, the glass, the louvres, the lights, the cap, the panels' seams fitted to the picture's own; no leg across a part's edge or a seam; the crest and the wiper off; after the plan (`touch`, 2026-11-10) the indicators 10 mm deep and a black mark of two columns where the crest was, nothing else moved |
| `racegeo.py`, `racecar.py`, `porsche-race.jars.json` | the red racing 911 from the front on 60 × 60, 54 cm across (2026-11-10), in the green's place in the library: the red classic's `RedCar` on a geometry read off the picture, symmetric about the axis — the wing, the glass, the mirrors, the headlights, the bonnet's vents, the neon, the intakes and the splitter, each its own part; the body's seams the picture's own thin lines, found, not drawn; the stickers and the crest off, a grey mark of two columns in the crest's place; the banner's PORSCHE a hint, every column through the letters one leg of a grey by their share of it; the neon the owner's fluorescent lemon as it comes |
| `redcark.py` | the red classic's v.2 Kuzya (2026-11-11), a card of its own: `RedCar` with the GT audit's B, C, D (`racecark.py`'s), the same form, target and starting jars |
| `racecark.py` | the face's v.2 Kuzya (2026-11-10), a card of its own, the first kept: `RaceFace` with Kuzya's audit (`FORM-G/Rembrandt_FORM-G_GT_Color_Tone_Audit_2026-11-10.pdf`) — no hue apart on the red body, a cut's cost by the form (dear on flat paint, cheap where it turns), and jars whose dried legs the brush model cannot tell apart (dE under 2.5) one; the same target, geometry and starting jars |
| `distance_core.py`, `far.py`, `farcar.py` | the view from 3 and 6 m: S-CIELAB's widths of blur, a model, not a measurement |
| `gwagongeo.py`, `gwagon.py`, `farwagon.py` | OPM-G's G-wagon on 60 × 60: its outline off a white ground, the badges off; the grille's slats on the grid, the bull bar's chrome, the headlights, the seats' red by geometry; 36 jars at most, every jar 1 m of line at least; no span under 12 mm; the view from 3 and 6 m |
| `export_formg.py` | a finished plan into `app/formg/<id>.json` (OPM-G's into `app/opmg/`), the cells, a jar's layers |

The photos are others' and stay out of git (`.gitignore`): `OPM-G/Blue-Patek…`, `OPM-G/porsche-911-1.jpg`, `OPM-G/g-wagon.JPG`, and the pictures in `FORM-G/` itself (`Top-Down Classic Red Porsche 911.png`, `Red Porsche GT Race Car.png`).

To run: a venv with numpy, pillow and scipy, the working directory this one.

```
python hyper.py 6 2 watch.jpg        # px/mm, correction passes, the render; its plan in watch.jpg.pkl
python hyper2.py 6 2 porsche.jpg
python export_formg.py watch watch.jpg.pkl
python export_formg.py porsche porsche.jpg.pkl
python redcar.py 6 2 porsche-red.jpg     # the red 911; its jpg to 3 px/mm in app/formg/
python export_formg.py porsche-red porsche-red.jpg.pkl
python racecar.py 6 2 porsche-race.jpg    # the racing 911's face; its jpg to 3 px/mm in app/formg/
python export_formg.py porsche-race porsche-race.jpg.pkl
python racecark.py 6 2 porsche-race-k.jpg   # its v.2 Kuzya
python export_formg.py porsche-race-k porsche-race-k.jpg.pkl
python gwagon.py 6 2 gwagon.jpg      # OPM-G's: its plan into app/opmg/
python export_formg.py gwagon gwagon.jpg.pkl
python farwagon.py gwagon.jpg gwagon_distance.jpg
```

**OPM-G's jars** (the owner, 2026-11-07: "cut the colours from 60 to 36 … every colour some minimum of strokes, for example 1 metre at least"): `gwagon.py` plans with every candidate jar, then takes out those under 1 m as FORM-G's list counts it (the legs half the tip in, the steps, the idle run) and plans again, so their legs go to the jars that can paint them, never recoloured one by one; at most 36 stay. The G-wagon kept 15: a black car needs few, and the others never came to a metre. The seats' red is locked by geometry, its own jar, so the picture's one accent does not drop out under the line.

**From LAB's real strokes 2** (`OPM-G/IMG_2435` … `IMG_2486`, the night of 2026-11-06/07): long legs clean; short legs alone of the second paint fat pills with a dark rim. So OPM-G plans no span under 12 mm (the Porsche's 8) and a cut costs more (`LAM` 3400, the Porsche's 2200); the G-wagon's legs: median 24 mm, 10 % under 12 (the Porsche 43 … 48 %).

A new picture: its own `*geo.py` and planner, a name in `FORMG_LIB` (`app/src/formgplan.js`), its json and a 3 px/mm jpg in `app/formg/`.

A picture must fit the machine's reach, 865 × 568 mm, with the carriage's own run past a leg's end: the elbow's sweep takes it about 20 mm at the bottom. `placeRange` says where the canvas may lie; FORM-G refuses what would be pressed into a wall. So the Porsche is 85 cm long, its exhaust 9 mm short (`LOWEST`).

A jar with `coats: 2` comes again last in the list, over the dry first layer (the owner, 2026-11-06). The render lays its film twice; the tab's run lays every cell's snake and at once its idle run, both times. The same plan, the idle runs not rendered, the difference untested on canvas.

**Thin lines by colour** (the owner and Kuzya, 2026-11-08, `lines-.png`: "no more fat lines"): what in a picture is thinner than the brush, 5 mm, is not a stroke of its own. A seam cuts the columns it crosses, so a leg ends on it, and the side the picture has darker is taken down next to it (`EDGE` across the car, `ALONG` along it); the eye reads the line where two shades meet. Details of a millimetre or two (a grille's slats, small chrome) go into the mass they sit in. The paint's mechanics never change for it: the 5 mm brush, legs along X, canon.js, LAB 4.0. Only which jar a leg has and where it ends.
