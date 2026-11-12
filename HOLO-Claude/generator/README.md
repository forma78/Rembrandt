# HOLO's generator

HOLO's pictures in the owner's jars (2026-11-12), on this Mac, by Claude. Not part of the app: the tab has only the finished plans in `app/holo/`.

The owner, of cloud-Claude's sheets in `../HOLO/`: "very beautiful, but I would like to stay within the range where our jars are already mixed and
there is paint" — `../IMAGE 2026-11-12 12:32:52.jpg`, his jars of the day, and four empty ones: "I can easily add four more colours".

`holo_jars.py` takes `../HOLO/study/holo_study.py` as it is — the same slats, bands, puddles and seeds — and gives every colour of a picture one of
his jars, by hand, light for light and dark for dark, a family kept (a shadow only over its own family or white). A numbered jar by its hex in
FORM-G's red classic (`app/formg/porsche-red-k.json`), but Jar 6 and Jar 12, whose lids read another colour, by the photo; a jar with no number by
the photo, white-balanced on the empty aluminium lids; the four new ones from the tubes on the shelf (`app/src/colorlib.js`). All est.

| picture | jars | new |
|---|---|---|
| `holo-40-warm`, the fan, warm, 40 × 40 | 10 | Orange, Blue 04 |
| `holo-60-blue`, the fan, blue, 60 × 60 | 10 | Sky Blue, Blue 04, Ultramarine |
| `holo-60-tiers`, the tiers, 60 × 60 | 11 | Orange, Sky Blue, Blue 04, Ultramarine |

To run: a venv with numpy, pillow and scipy, the working directory this one; about a minute.

```
python holo_jars.py                  # all three: app/holo/<id>.json, <id>.jpg (the picture), <id>-run1.jpg (run 1 dry)
python holo_jars.py holo-60-blue     # one
```
