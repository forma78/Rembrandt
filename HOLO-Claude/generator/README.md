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

Every slat of v.1's (2026-11-14, the night; the owner, of the 40 × 40's last slat gone: "I would bring the lost column back. But these are your
pictures — you decide"): the warm 40 × 40 and the blue are v.1's own row, the blue pressed to 520 mm by one leg off its widest slats; their ragged
edges the first v.2's, carried slat for slat. The tiers' v.2 is kept as it was, its own row and colours ("I really like the tiers v.2").
Then the tiers' **v.3** (the owner, of the blue redrawn so: "the new one is better. Maybe you will make a v.3 for the tiers?"): v.1's row and
colours, every slat, at 520 mm, the v.2's ragged edges carried onto it — `app/holo/holo-60-tiers-v3.*`; `python holo_v2.py holo-60-tiers-v3`.

## V4, the drag every 2.5 mm (2026-11-15)

The owner, of the test canvas's run 1: "I propose the second pass, the one that clears the paint, at 2.5 mm … That gives not six grooves but
twelve" (`../HOLO/001-40x40-v4.md`). `holo-40-warm-v4` is the warm 40 × 40's v.2 number for number, and `drag: { per_leg: 2, step: 2.5 }`,
read by `app/src/holoplan.js`'s `workOf`: two strokes a leg, 1.25 mm either side of its middle, the left down, the right up. Its renders are v.2's
model (no channels drawn, est.). `python holo_v2.py holo-40-warm-v4`.

```
python holo_v2.py                    # all three v.2s, the tiers' v.3 and the warm's V4
python holo_v2.py holo-60-blue       # one; --out=<dir> elsewhere
```
