# HOLO's generator

HOLO's pictures in the owner's jars (2026-11-12), on this Mac, by Claude. Not part of the app: the tab has only the finished plans in `app/holo/`.

The owner, of cloud-Claude's sheets in `../HOLO/`: "very beautiful, but I would like to stay within the range where our jars are already mixed and
there is paint" — `../IMAGE 2026-11-12 12:32:52.jpg`, his jars of the day, and four empty ones: "I can easily add four more colours".

`holo_jars.py` takes `../HOLO/study/holo_study.py` as it is — the same slats, bands, puddles and seeds — and gives every colour of a picture one of
his jars, by hand, light for light and dark for dark, a family kept (a shadow only over its own family or white). A numbered jar by its hex in
FORM-G's red classic (`app/formg/porsche-red-k.json`), but Jar 12 by the photo, its lid's lilac (the owner, 2026-11-14: "Jar 6 is orange, Jar 12 is
lilac"); a jar with no number by the photo, white-balanced on the empty aluminium lids; the new ones from the tubes on the shelf
(`app/src/colorlib.js`) — three: the fourth, Orange, was the recipe of Jar 6's own orange, so Jar 6 in its place. All est.

| picture | jars | new |
|---|---|---|
| `holo-40-warm`, the fan, warm, 40 × 40 | 10 | Blue 04 |
| `holo-60-blue`, the fan, blue, 60 × 60 | 10 | Sky Blue, Blue 04, Ultramarine |
| `holo-60-tiers`, the tiers, 60 × 60 | 11 | Sky Blue, Blue 04, Ultramarine |

To run: a venv with numpy, pillow and scipy, the working directory this one; about a minute.

```
python holo_jars.py                  # all three: app/holo/<id>.json, <id>.jpg (the picture), <id>-run1.jpg (run 1 dry)
python holo_jars.py holo-60-blue     # one
```

## v.2, ragged edges (2026-11-14)

The owner, of `../opm-n-screen.png`, `../opm-w-screen.png` and his sketch `../IMG_2907.jpg`: "the graphics live in a banal square, which still has
to be laid evenly on the canvas … 'ragged' edges, with no clear frame, will help us technically, and the work itself will not look shut in a frame";
"you decide, I do not insist … keep the first ones too! The new ones then v.2." `holo_v2.py`: the same compositions and jars, every leg its own
ends — blocks stepped slat to slat, a wave along them, a staircase in at one to three corners; run 2's shadows within what a slat's legs share;
the 60 × 60s 520 mm across, so MARKS fit on the canvas by the field. Writes `app/holo/<id>-v2.json` and its two renders, v.1 untouched.

```
python holo_v2.py                    # all three v.2s
python holo_v2.py holo-60-blue       # one; --out=<dir> elsewhere
```
