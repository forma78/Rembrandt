# HOLO2's generator

**`holo2_route.py`** — the picture by the owner's route (2026-11-20, "as in ST-JOHN"): his line, drawn stage by stage over the plan's contour at
1 px a mm (`../01.png` … `05.png`, blue forward, pink back; his green in `../01 update 2.png` where the blue had gone aside), traced stage after
stage straight through every crossing, smoothed; 8 lanes 5 mm apart, the snake lane 1 forward, lane 2 back …; the colours of `../Untitled-19.png`
read across the ribbon along it, bands of his jars, the canon of the jars; rows of dabs across the ribbon in every band, 40 mm apart at most; a
model of the drag (a dab taken up and laid thinner on, est.). The route pressed about the canvas's middle where the ribbon would be wider than
540 mm (MARKS on a 60 × 60's margins). `python holo2_route.py`, about 15 s.

`holo2_gen.py` below — the first try, the ribbons read off the drawing by an algorithm — keeps the shared pieces (the jars, the mask, the
contours); its own plans are no longer made ("complicated and long", the owner).

HOLO2's pictures off the owner's drawings in `../`, on this Mac, by Claude. Not part of the app: the tab has only the finished plans in `app/holo2/`.

The owner, 2026-11-20: "Untitled-19.png on 60 × 60, no more than 10 colours … you can use the jars we have"; of the first try, its strokes across the
ribbons: "the stripes must run along, as the markings of a road, not as the boards of a fence or sleepers" (`../Untitled-20.png`, "the stripes the
right way").

`holo2_gen.py` reads a drawing's ribbons: the painted mask off its cream ground; the ribbon's way at every point — its edges where a ribbon lies alone,
the dabs' texture where two cross, the one on top showing; lanes along that way 5 mm apart (Jobard and Lefer's evenly spaced lines), the first 2.5 mm
in from an edge, a lane ending where the ribbon goes under another; every point the nearest of his jars (CIELAB), the canon of the jars; a colour's
band of a ribbon a snake, its lanes back and forth. Layer 1 the cool jars, Layer 2 the warm. Writes `app/holo2/<id>.json`, `<id>.jpg` (the model),
`<id>-layer1.jpg` (Layer 1 dry), and DRAW BW's lines. All est.

```
python holo2_gen.py              # every picture
python holo2_gen.py holo2-19     # one
```

A venv with numpy, pillow, scipy and scikit-image; about 20 s.
