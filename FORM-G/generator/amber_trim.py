#!/usr/bin/env python3
"""The front indicators' orange left whole on a finished FORM-G plan (the owner, 2026-11-11, FORM-G/details-2-3.png: "trim the red on the bumper a little,
so that it does not climb onto the orange at all; on the left the photo, as in the original"). paintrun.py runs a lighter span UNDER (3 mm) under the darker
one it butts, for the darker comes after it; the orange, Jar 6, is the first of Layer 2 since the same day (README's canon), and the bumper's dark reds'
second coats come after it. So in every column of a front indicator, a leg of another jar on the bumper's side — reaching past the orange's front end —
starts where the orange ends; one that keeps less than MIN_LEG there, or lies within the orange on that side, goes, its cell broken there so that no step
crosses the gap (formgplan.js's framedPic does the same). The wing's side, behind the orange, as it was. The plan's json changed in place; the render not.

  python amber_trim.py <id>"""
import sys, os, json

MIN_LEG = 3.0       # mm: formgplan.js's FORMG.minLeg — a shorter leg is laid as 3 mm round its middle, back onto the orange
FRONT = 500.0       # mm: the front half of the 70 × 100 (y up): the indicators, not the tail's amber


def trim(pic):
    late = [j for j in pic['jars'] if j.get('late')]
    amber = {}
    for j in late:
        for c in j['cells']:
            for x, a, b in c['legs']:
                lo, hi = min(a, b), max(a, b)
                if lo >= FRONT:
                    amber[x] = (min(lo, amber.get(x, (lo, hi))[0]), max(hi, amber.get(x, (lo, hi))[1]))
    said = []
    for j in pic['jars']:
        if j.get('late'):
            continue
        cells = []
        for c in j['cells']:
            run = []
            def flush():
                if run:
                    cells.append({**c, 'legs': list(run)})
                    run.clear()
            for leg in c['legs']:
                x, a, b = leg
                lo, hi = min(a, b), max(a, b)
                o = amber.get(x)
                if not o or hi <= o[0] or lo >= o[1] or (lo + hi) / 2 <= (o[0] + o[1]) / 2:
                    run.append(leg)                       # not on the orange, or on the wing's side of it
                    continue
                new = o[1]                                # the bumper's side: from the orange's front end on
                if hi - new < MIN_LEG:
                    said.append(f"{j['name']} x {x}: {lo:g}…{hi:g} out")
                    flush()
                    continue
                said.append(f"{j['name']} x {x}: {lo:g}…{hi:g} → {new:g}…{hi:g}")
                run.append([x, new, hi] if b >= a else [x, hi, new])
            flush()
        j['cells'] = [{**c, 'n': n + 1} for n, c in enumerate(cells)]
    return said


if __name__ == '__main__':
    which = sys.argv[1]
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'app', 'formg', f'{which}.json')
    pic = json.load(open(path))
    said = trim(pic)
    json.dump(pic, open(path, 'w'), separators=(',', ':'))
    print('\n'.join(said) or 'nothing on the orange')
    print(which, len(said), 'legs')
