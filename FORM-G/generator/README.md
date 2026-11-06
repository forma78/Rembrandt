# FORM-G's generator

How the paintings of the FORM-G tab are made, on this Mac, by Claude, at the owner's request ("I will simply ask you to add something else", 2026-11-06). Not part of the app: the tab has no photo and no algorithm, only the finished plans in `app/formg/`.

A plan is one grid of columns 5 mm apart, the brush's. Every column is solved on its own against the photo, what it could not reach goes on to the next, so neighbouring columns of neighbouring shades mix in the eye.

| file | what |
|---|---|
| `brushsim.py` | the rubber brush on canvas, read off `OPM-G/IMG_2415` (est.): track, ridges, film, the load falling off along a line |
| `paintrun.py` | a plan's cells into spans and snakes, light under dark |
| `watchgeo.py`, `clean_photo.py`, `hyper.py` | the watch: the geometry of its dial, the printed words off, the 54 shades + 5 |
| `cargeo.py`, `hyper2.py` | the green 911: its outline, the badges off, 60 jars made to measure |
| `distance_core.py`, `far.py`, `farcar.py` | the view from 3 and 6 m: S-CIELAB's widths of blur, a model, not a measurement |
| `export_formg.py` | a finished plan into `app/formg/<id>.json`, the cells, a jar's layers |

The photos are others' and stay out of git (`.gitignore`): `OPM-G/Blue-Patek…`, `OPM-G/porsche-911-1.jpg`.

To run: a venv with numpy, pillow and scipy, the working directory this one.

```
python hyper.py 6 2 watch.jpg        # px/mm, correction passes, the render; its plan in watch.jpg.pkl
python hyper2.py 6 2 porsche.jpg
python export_formg.py watch watch.jpg.pkl
python export_formg.py porsche porsche.jpg.pkl
```

A new picture: its own `*geo.py` and planner, a name in `FORMG_LIB` (`app/src/formgplan.js`), its json and a 3 px/mm jpg in `app/formg/`.

A picture must fit the machine's reach, 865 × 568 mm, with the carriage's own run past a leg's end: the elbow's sweep takes it about 20 mm at the bottom. `placeRange` says where the canvas may lie; FORM-G refuses what would be pressed into a wall. So the Porsche is 85 cm long, its exhaust 9 mm short (`LOWEST`).

A jar with `coats: 2` comes again last in the list, over the dry first layer (the owner, 2026-11-06). The render lays its film twice; the tab's run lays every cell's snake and at once its idle run, both times. The same plan, the idle runs not rendered, the difference untested on canvas.
