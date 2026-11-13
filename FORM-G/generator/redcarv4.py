#!/usr/bin/env python3
"""FORM-G: the red classic 911 on 70 × 100, v.4 — v.3 to the leg, and its shadow on the right, in Black, the list's last line.

The owner, 2026-11-13, of the 70 × 100 painted by v.3 (FORM-G/IMG_6176.JPG, his green outline; FORM-G/shadow.png, his grey sketch beside the car): "at the very start
I shifted the Porsche a little, and this is an expensive canvas 70 × 100 … I decided to keep it. But on its right the old red lines stayed. I cannot tell where the old
contour is, wrong, shifted, and where the new one … If we make a v.4 with the red Porsche's perfect form as it is now, I will just add black paint and carefully paint
over the old contour"; "on the screen it is right beside it, a shadow, our stripes; the Porsche's form is not to be touched"; "just draw me the shadow, about 10 cm to
the side, that is enough for me". The old lines are the first runs of 2026-11-10/11 on this canvas (FORM-G/IMG_2682.jpg), laid while the arm's wires came loose in
the drag chain.

The shadow is the car's own silhouette moved SHIFT mm to the right, the car taken out of it: in every column, the car's spans in the column SHIFT to its left, less the
car's own spans in it, GAP away along the column — so its edge copies the car's (the wings, the mirror) a hand to the right, and it wraps the car's corners at the front
and the rear as far as the moved silhouette reaches. A column beside the car's last one is the car's neighbour as any two columns of the car are. Its legs in snakes, a
new cell where the step to the next leg would be longer than STEP_MAX (paintrun's). One jar, Black (#0C0C0C, the car's), two coats as the car's Black (one coat of a
long leg leaves a film in its middle the old reds would show through), `last`: both its lines after every line of v.3, so Start from its first runs the shadow alone.
The render: v.3's jpg, the shadow laid by brushsim on its own, as hyper2.paint_all lays a jar, and put over it.

    python3 redcarv4.py          (numpy, pillow, scipy: a venv in the scratchpad)
"""
import json
import os

import numpy as np
from PIL import Image

from brushsim import Sim, smooth01
from hyper2 import jar as jar_of

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.normpath(os.path.join(HERE, '..', '..', 'app', 'formg'))
SRC, OUT = 'porsche-red-v3', 'porsche-red-v4'

SHIFT = 80.0      # mm to the right, whole columns. The owner: "about 10 cm to the side"; at his canon place (left −60) the brush reaches 628 mm from the canvas's left
                  # edge (placeRange: the left edge −59.2 at most for a leg at 627.5, −79 for 647.5), and the rear wing ends at 547.5: 80 mm the most the whole shadow can be
GAP = 6.0         # mm along a column between a leg of the car and one of the shadow: the car's J3 lift 3 mm later and the shadow's 3 mm earlier (est.)
JOIN = 3.0        # the car's legs in a column this near one another one span (est.)
MIN_LEG = 8.0     # a shadow leg shorter than this goes out: a dab, not a stripe (est.)
ABOVE = 5.0       # mm the shadow ends above the car's lowest line: its legs that end there lift out past it, so low the carriage would press the bottom wall
                  # 10 mm at the place (−68), past PRESS_OK's 8 (formg.js); 5 mm up, as v.3 (est.)
STEP_MAX = 7.0    # paintrun's: a step between two legs of a snake at most this long, else a new cell
BLACK = '#0C0C0C'
COATS = 2         # as the car's Black (v.3)
PPM = 3           # the render's px a mm, v.3's jpg (2100 × 3000)


def spans_of(pic):
    """The car's spans in every column, y up as the json's: its legs' union, JOIN closed."""
    col = {}
    for j in pic['jars']:
        for c in j['cells']:
            for x, a, b in c['legs']:
                col.setdefault(round(x, 2), []).append((min(a, b), max(a, b)))
    out = {}
    for x, iv in col.items():
        m = []
        for a, b in sorted(iv):
            if m and a <= m[-1][1] + JOIN:
                m[-1][1] = max(m[-1][1], b)
            else:
                m.append([a, b])
        out[x] = [tuple(s) for s in m]
    return out


def minus(iv, cut):
    """Spans iv less the spans cut."""
    out = list(iv)
    for c0, c1 in cut:
        nxt = []
        for a, b in out:
            if c1 <= a or c0 >= b:
                nxt.append((a, b))
                continue
            if a < c0:
                nxt.append((a, c0))
            if c1 < b:
                nxt.append((c1, b))
        out = nxt
    return out


def shadow_of(car, pitch):
    """{x: [(a, b)]}: the moved silhouette less the car, GAP off it along the column, ABOVE the car's lowest line; legs under MIN_LEG out."""
    xs = sorted(car)
    k = int(round(SHIFT / pitch))
    out = {}
    lo, hi = xs[0], xs[-1] + SHIFT
    low = min(a for iv in car.values() for a, _ in iv) + ABOVE
    for i in range(int(round((hi - lo) / pitch)) + 1):
        x = round(lo + i * pitch, 2)
        src = car.get(round(x - k * pitch, 2))
        if not src:
            continue
        cut = [(a - GAP, b + GAP) for a, b in car.get(x, [])] + [(-1e9, low)]
        keep = [(round(a, 1), round(b, 1)) for a, b in minus(src, cut) if b - a >= MIN_LEG]
        if keep:
            out[x] = keep
    return out


def cells_of(sh, pitch):
    """Snakes from the car outward: a leg goes on the cell whose last leg is in the column before, overlaps it, and ends within STEP_MAX of where this one starts."""
    cells, open_ = [], []
    for x in sorted(sh):
        nxt = []
        for a, b in sh[x]:
            best = None
            for c in open_:
                px, pa, pb, up = c['last']
                if abs(px - (x - pitch)) > 1e-6 or b <= pa or a >= pb:
                    continue
                step = abs(pb - b) if up else abs(pa - a)       # went up: this one starts at its top and goes down; went down: starts at its bottom
                if step <= STEP_MAX and (best is None or step < best[0]):
                    best = (step, c)
            if best:
                c = best[1]
                up = not c['last'][3]
                open_.remove(c)
            else:
                c, up = {'legs': []}, True
                cells.append(c)
            c['legs'].append([x, a, b] if up else [x, b, a])
            c['last'] = (x, a, b, up)
            nxt.append(c)
        open_ = nxt
    return [{'n': i + 1, 'legs': c['legs']} for i, c in enumerate(cells)]


def render(img, cells, H, W):
    """The shadow laid by brushsim on the ground alone, as hyper2.paint_all lays a jar (its coats, its snakes' turns, its idle run on the last), then put over v.3's
    render where its paint lies."""
    sim = Sim(W, H, ppm=PPM)
    paint = jar_of(BLACK, COATS, 'Black')
    for coat in range(COATS):
        T = np.zeros((sim.h, sim.w), np.float32)
        for c in cells:
            legs = [(x, H - max(a, b), H - min(a, b), 1 if b < a else -1) for x, a, b in c['legs']]    # y down; d > 0: down the image (the json's y falls)
            s = float(sim.rng.uniform(0, 40)) if coat else 0.0
            for k, (x, ya, yb, d) in enumerate(legs):
                L = yb - ya
                first, last = k == 0, k == len(legs) - 1
                solid = L < 14
                cap_in = 'turn' if (solid or not first) else 'free'
                cap_out = 'turn' if (solid or not last) else 'free'
                if d > 0:
                    sim.leg(T, x, ya, yb, s, s + L, cap_in, cap_out, solid=solid)
                else:
                    sim.leg(T, x, ya, yb, s + L, s, cap_out, cap_in, solid=solid)
                s += L
                if not last:
                    nx, na, nb, nd = legs[k + 1]
                    end = yb if d > 0 else ya
                    start = na if nd > 0 else nb
                    side = 1 if d > 0 else -1
                    load = float(sim.loader.load(np.array(s)))
                    sim.turn(T, x, end - side * 2.0, nx, start + (2.0 if nd > 0 else -2.0), side, min(load, 1.3))
                    s += float(np.hypot(nx - x, start - end))
            if coat == COATS - 1 and len(legs) >= 3:         # the idle run, the snake again closer together, on legs with a neighbour
                for x, ya, yb, d in legs:
                    if yb - ya > 14:
                        sim.leg(T, x, ya - 0.5, yb + 0.5, 300, 300 + yb - ya, 'free', 'free', dose=0.5, idle=True)
        sim.lay(T, paint)
    sh = np.clip(sim.finish(), 0, 1)
    alpha = smooth01(0.02, 0.25, sim.Hmap)[..., None]
    base = np.asarray(img, dtype=np.float32) / 255
    return Image.fromarray((np.clip(alpha * sh + (1 - alpha) * base, 0, 1) * 255).astype(np.uint8))


def main():
    pic = json.load(open(os.path.join(APP, f'{SRC}.json')))
    pitch = pic['pitch']
    car = spans_of(pic)
    sh = shadow_of(car, pitch)
    cells = cells_of(sh, pitch)
    line = sum(abs(b - a) for c in cells for _, a, b in c['legs'])
    jar = dict(id='shadow', name='Black · shadow', code='', hex=BLACK, coats=COATS, last=True, cells=cells)
    out = dict(pic, id=OUT, title='Porsche, red · v.4',
               sub=pic['sub'].split(';')[0] + f'; v.3 to the leg and its shadow {SHIFT / 10:.0f} cm to the right, in Black, the last two lines: over the old lines beside the car',
               image=f'formg/{OUT}.jpg', jars=pic['jars'] + [jar])
    ys = [v for j in out['jars'] for c in j['cells'] for l in c['legs'] for v in l[1:]]
    xs = [l[0] for j in out['jars'] for c in j['cells'] for l in c['legs']]
    out['box'] = [min(xs), min(ys), max(xs), max(ys)]
    img = Image.open(os.path.join(APP, f'{SRC}.jpg')).convert('RGB')
    render(img, cells, pic['h'], pic['w']).save(os.path.join(APP, f'{OUT}.jpg'), quality=90)
    with open(os.path.join(APP, f'{OUT}.json'), 'w') as f:
        json.dump(out, f, separators=(',', ':'))
    print(OUT, 'shadow: columns', len(sh), 'cells', len(cells), 'legs', sum(len(c['legs']) for c in cells), 'line m', round(line / 1000, 2),
          'x', min(sh), '…', max(sh), 'box', out['box'])


if __name__ == '__main__':
    main()
