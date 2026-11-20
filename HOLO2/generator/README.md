# HOLO2's generator

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
