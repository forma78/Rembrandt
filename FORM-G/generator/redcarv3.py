#!/usr/bin/env python3
"""FORM-G: the red classic 911 on 70 × 100, v.3 — the v.2's half the jar changes (the owner, 2026-11-11: "13 hours and 62 jar changes are physically hard for
me. Let us cut their number in two … I think we can risk cutting the colours in half without an obvious loss in the optical perception. If it does not work,
we can always go back to v.2"; "if every colour's legs grow from 1 metre to 3–4, then the paintings can go into production").

RedCarK as it is — its form, its target, B, C and D — with fewer jars kept (porsche-red-v3.jars.json): the 9 fixed ones and 15 of v.2's 32 made ones, every one a
v.2 jar under its own number, none new. Which ones: those that leave every jar that goes within a mix of two neighbouring columns of jars that stay (CIEDE2000,
weighted by its line in v.2, est.) — a step of the body's dark reds between two that stay costs nothing, as the plan mixes neighbouring columns in the eye anyway —
under 31 lines of the list, the second coats counted. Then the whole picture planned again with them, so their legs go to the jars that can paint them, never
recoloured one by one (as OPM-G's G-wagon, gwagon.py). 24 jars, 7 of them two coats: 31 lines (v.2: 41 jars, 62 lines)."""
from redcark import RedCarK
from redcar import main


class RedCarV3(RedCarK):
    KEEP = 'porsche-red-v3.jars.json'


if __name__ == '__main__':
    main(RedCarV3, 'porsche-red-v3.jpg')
