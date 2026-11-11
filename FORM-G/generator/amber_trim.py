#!/usr/bin/env python3
"""The front indicators' orange on a finished FORM-G plan, by the owner's marks (2026-11-11, the classic's v.2):

- FORM-G/details-2-3.png: "trim the red on the bumper a little, so that it does not climb onto the orange at all; on the left the photo, as in the
  original". paintrun.py runs a lighter span UNDER (3 mm) under the darker one it butts, for the darker comes after it; the orange, Jar 6, is the first
  of Layer 2 since the same day (README's canon), and the bumper's dark reds' second coats come after it. So in every column of a front indicator a leg
  of another jar on the bumper's side — reaching past the orange's front end — starts where the orange ends; one that keeps less than MIN_LEG there, or
  lies within the orange on that side, goes, its cell broken there so that no step crosses the gap (formgplan.js's framedPic does the same). The wing's
  side, behind the orange, as it was.
- FORM-G/details-2-5.png: "literally 4 strokes on the left and 4 strokes on the right can be pulled down; and the two outermost orange ones removed, I
  crossed them out in green". CORNERS: the four columns at each indicator's outer corner keep the generator's own start, their lower ends on the
  straight line he drew. TIPS: the lone orange leg at each indicator's inner end goes, the red leg under it runs on to the orange's front end, so that
  no bare canvas is left and it runs UNDER the bumper's leg above, which keeps its own start.

The plan's json changed in place; the render not.

  python amber_trim.py <id>"""
import sys, os, json

MIN_LEG = 3.0       # mm: formgplan.js's FORMG.minLeg — a shorter leg is laid as 3 mm round its middle, back onto the orange
FRONT = 500.0       # mm: the front half of the 70 × 100 (y up): the indicators, not the tail's amber
UNDER = 3.0         # mm: paintrun.py's, a lighter span under the darker it butts
CORNERS = {217.5, 222.5, 227.5, 232.5, 467.5, 472.5, 477.5, 482.5}   # the owner's four strokes left and right (details-2-5.png), x of the 70 × 100
TIPS = {267.5, 432.5}                                                # the two orange legs he crossed out, the indicators' inner ends


def span(leg):
    return min(leg[1], leg[2]), max(leg[1], leg[2])


def recut(j, keep):
    # a jar's cells, a leg changed or dropped by keep(leg) → the leg, or None; a cell broken where a leg goes; numbered again
    cells = []
    for c in j['cells']:
        run = []
        for leg in c['legs']:
            new = keep(leg)
            if new is None:
                if run:
                    cells.append({**c, 'legs': run})
                run = []
            else:
                run.append(new)
        if run:
            cells.append({**c, 'legs': run})
    j['cells'] = [{**c, 'n': n + 1} for n, c in enumerate(cells)]


def trim(pic):
    said, late = [], [j for j in pic['jars'] if j.get('late')]
    # the two orange tips out; the leg under each runs on to where the orange ended
    gone = []
    for j in late:
        def tip(leg):
            lo, hi = span(leg)
            if leg[0] in TIPS and lo >= FRONT:
                gone.append((leg[0], lo, hi))
                said.append(f"{j['name']} x {leg[0]}: {lo:g}…{hi:g} out")
                return None
            return leg
        recut(j, tip)
    for x, lo, hi in gone:
        below = [(j, leg) for j in pic['jars'] if not j.get('late') for c in j['cells'] for leg in c['legs']
                 if leg[0] == x and lo - 0.5 <= span(leg)[1] <= lo + UNDER + 0.5 and span(leg)[0] < lo]
        if below:
            j, leg = max(below, key=lambda q: span(q[1])[1])
            a, b = span(leg)
            if b >= a and leg[2] >= leg[1]:
                leg[2] = hi
            else:
                leg[1] = hi
            said.append(f"{j['name']} x {x}: {a:g}…{b:g} → {a:g}…{hi:g}")
    # the bumper's side of every front indicator left: its legs from the orange's front end on, the corners' as they were
    amber = {}
    for j in late:
        for c in j['cells']:
            for leg in c['legs']:
                lo, hi = span(leg)
                if lo >= FRONT:
                    o = amber.get(leg[0], (lo, hi))
                    amber[leg[0]] = (min(lo, o[0]), max(hi, o[1]))
    for j in pic['jars']:
        if j.get('late'):
            continue
        def keep(leg):
            x, a, b = leg
            lo, hi = span(leg)
            o = amber.get(x)
            if not o or x in CORNERS or hi <= o[0] or lo >= o[1] or (lo + hi) / 2 <= (o[0] + o[1]) / 2:
                return leg                                # not on the orange, a corner's, or on the wing's side of it
            new = o[1]                                    # the bumper's side: from the orange's front end on
            if hi - new < MIN_LEG:
                said.append(f"{j['name']} x {x}: {lo:g}…{hi:g} out")
                return None
            if new > lo:
                said.append(f"{j['name']} x {x}: {lo:g}…{hi:g} → {new:g}…{hi:g}")
            return [x, max(lo, new), hi] if b >= a else [x, hi, max(lo, new)]
        recut(j, keep)
    return said


if __name__ == '__main__':
    which = sys.argv[1]
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'app', 'formg', f'{which}.json')
    pic = json.load(open(path))
    said = trim(pic)
    json.dump(pic, open(path, 'w'), separators=(',', ':'))
    print('\n'.join(said) or 'nothing on the orange')
    print(which, len(said), 'legs')
