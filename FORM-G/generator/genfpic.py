#!/usr/bin/env python3
"""FORM-G: a GEN-F sketch made final TRUE TO THE SKETCH — its own legs and colours, as the owner approved them on the screen he chose.

The owner, 2026-11-16, of the Targa made by genfcar.py (hyper2's re-solve through the brush model): "Claude, we have problems. You generated something wrong.
Compare the Porsche on GEN-F and on FORM-G: the highlights on the glass are gone, the seats are gone, it all turned into mush" (`GEN-F/Screenshot 2026-11-16
at 3.20.47 PM.png`). The brush model takes a leg for a film with the white between legs showing, so for a grey it takes a darker jar and the small lights go;
LAB's real 3 measured a track ≈ 8 mm on the 5 mm grid (LAB/), the legs overlap and the canvas shows the jar's own colour, as GEN-F draws it. So the sketch's
plan is the final, and only the canon is laid on it:

  1. the jars as the sketch has them, their names and colours untouched (the owner, the same hour: "we have Graphite Seats … 30.json; it must be held to
     strictly; I feel the generator also mirrored one side and put it on the other" — genfcar.py's MIRROR did); beside a colour, as its code, his own numbered
     jar of the red classic (his shelf, app/formg/porsche-red-k.json) within NEAR of it, nearest pair first — "≈ Jar 16", a hint for the shelf, nothing changed;
  2. CREST: the maker's crest off — the legs of a sketch colour with less than CREST_M of line near the axis go to the jar painted next to them in their column,
     and two columns about the axis over its height in the sketch's darkest colour, a cell of its own (the owner, 2026-11-10: "no Porsche logo, but a mark one
     cannot read");
  3. the motion blur's layer under the picture, if the sketch has it (`under`): its jars, the picture's own colours, one coat, `under`, painted first, the
     picture over it when dry (FORM-G's seqOf; the owner, 2026-11-16, sending mickey 2 with blur 110 · 90 % to FORM-G);
  4. the idle run n + 1 (`idle`; the owner, the same message: "the idle stroke's offset as in LAB + IDLE 6.0 (n+1)");
  5. nothing else: the legs, their snakes, the coats, the light-under-dark the sketch's. The render GEN-F's: the legs 5 mm wide, flat, the layer under first (est.).

  python genfpic.py <sketch.json> <id> "<title>" "<sub>"   → app/formg/<id>.json, <id>.jpg"""
import sys, os, json
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'app', 'formg')
SHELF = os.path.join(OUT, 'porsche-red-k.json')
NEAR = 8.0          # a jar of his within so much of a sketch colour, CIELAB ΔE76, is that colour's jar (est.)
CREST_M = 0.1       # a colour with less line than this, m, near the axis: the crest
PPM = 3             # the render, px a mm


def lab(h):
    r, g, b = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = f(r), f(g), f(b)
    X, Y, Z = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, 0.2126 * r + 0.7152 * g + 0.0722 * b, (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883
    F = lambda t: t ** (1 / 3) if t > 216 / 24389 else (24389 / 27 * t + 16) / 116
    return (116 * F(Y) - 16, 500 * (F(X) - F(Y)), 200 * (F(Y) - F(Z)))


def dE(a, b):
    return sum((p - q) ** 2 for p, q in zip(lab(a), lab(b))) ** 0.5


def line(j):
    return sum(abs(l[2] - l[1]) for c in j['cells'] for l in c['legs']) / 1000


def make(sketch_path, pid, title, sub, crest=True, out=OUT, idle='n+1'):
    sk = json.load(open(sketch_path))
    pic = json.loads(json.dumps(sk['pic']))
    jars = pic['jars']
    axis = (pic['box'][0] + pic['box'][2]) / 2
    pitch = pic['pitch']
    say = []
    # 2. the crest
    mark = None
    if crest:
        for j in [j for j in jars if line(j) < CREST_M and all(abs(l[0] - axis) <= 2 * pitch for c in j['cells'] for l in c['legs'])]:
            ys = [y for c in j['cells'] for l in c['legs'] for y in l[1:]]
            mark = (min(ys), max(ys)) if mark is None else (min(mark[0], min(ys)), max(mark[1], max(ys)))
            for c in j['cells']:
                for x, a, b in c['legs']:
                    lo, hi = min(a, b), max(a, b)
                    # the jar painted next to it in its column: the leg whose end lies nearest this leg's
                    near = min(((min(abs(min(q[1], q[2]) - hi), abs(max(q[1], q[2]) - lo)), k) for k, o in enumerate(jars) if o is not j
                                for cc in o['cells'] for q in cc['legs'] if abs(q[0] - x) < 0.1), default=None)
                    if near:
                        jars[near[1]]['cells'].append({'n': 0, 'legs': [[x, a, b]]})
            say.append(f"the crest, {j['name']} {j['hex']} ({line(j):.2f} m), off: its legs to the paint next to them")
            jars.remove(j)
    # 1. the jars: the sketch's own; his jar a hint beside it
    shelf = json.load(open(SHELF))['jars']
    pairs = sorted((dE(j['hex'], q['hex']), i, k) for i, j in enumerate(jars) for k, q in enumerate(shelf))
    got, taken = {}, set()
    for d, i, k in pairs:
        if d <= NEAR and i not in got and k not in taken:
            got[i] = (k, d)
            taken.add(k)
    for i, j in enumerate(jars):
        j['code'] = f"≈ {shelf[got[i][0]]['name']}" if i in got else ''
        say.append(f"{j['name']} {j['hex']}" + (f" ≈ {shelf[got[i][0]]['name']} {shelf[got[i][0]]['hex']}, ΔE {got[i][1]:.1f}" if i in got else ', none of his near'))
    if mark:
        dark = min(jars, key=lambda j: lab(j['hex'])[0])                         # the sketch's darkest colour
        xs = [axis - pitch / 2, axis + pitch / 2]
        dark['cells'].append({'n': 0, 'legs': [[xs[0], mark[1], mark[0]], [xs[1], mark[0], mark[1]]]})
        say.append(f"the crest's mark: {dark['name']} {dark['hex']}, two columns at {xs[0]} and {xs[1]}, {mark[0]} … {mark[1]} mm")
    # 3. the layer under: its jars after the picture's in the json, `under`, FORM-G runs them first
    under = []
    for u in (sk.get('under') or {}).get('jars', []):
        u = json.loads(json.dumps(u))
        main = next((j for j in jars if j['name'] == u['name']), None)
        u.update(under=True, coats=1, code=main['code'] if main else '')
        u.pop('paint', None); u.pop('glaze', None)
        under.append(u)
    if under:
        say.append(f"the layer under, the motion blur {sk.get('blur_mm')} mm, opacity {round(100 * sk.get('blur_alpha', 1))} % as a raster: {len(under)} of its colours, {sum(len(c['legs']) for u in under for c in u['cells'])} legs, first")
    jars += under
    for j in jars:
        for n, c in enumerate(j['cells']):
            c['n'] = n + 1
        j['code'] = j.get('code', '')
    legs = [l for j in jars for c in j['cells'] for l in c['legs']]
    xs_, ys_ = [l[0] for l in legs], [y for l in legs for y in l[1:]]
    pic.update(id=pid, title=title, sub=sub, image=f'formg/{pid}.jpg', box=[min(xs_), min(ys_), max(xs_), max(ys_)], jars=jars, **({'idle': idle} if idle else {}))
    json.dump(pic, open(os.path.join(out, f'{pid}.json'), 'w'), separators=(',', ':'))
    # the render: GEN-F's, the legs 5 mm wide in the list's order (light under dark), flat
    W, H = pic['w'] * PPM, pic['h'] * PPM
    im = Image.new('RGB', (W, H), (251, 250, 247))                              # the canvas, white gesso (2026-11-16)
    dr = ImageDraw.Draw(im)
    for j in sorted(jars, key=lambda q: not q.get('under')):                    # the layer under first
        rgb = tuple(int(j['hex'][i:i + 2], 16) for i in (1, 3, 5))
        for c in j['cells']:
            for x, a, b in c['legs']:
                dr.rectangle([round((x - pitch / 2) * PPM), round((pic['h'] - max(a, b)) * PPM), round((x + pitch / 2) * PPM) - 1, round((pic['h'] - min(a, b)) * PPM) - 1], fill=rgb)
    im.save(os.path.join(out, f'{pid}.jpg'), quality=93, subsampling=0)
    print('\n'.join(say))
    print(pid, 'jars', len(jars), 'a jar of his near', sum(1 for j in jars if j['code']), 'two coats', sum(1 for j in jars if j['coats'] == 2),
          'cells', sum(len(j['cells']) for j in jars), 'legs', len(legs), 'box', pic['box'])
    return pic


if __name__ == '__main__':
    make(*sys.argv[1:5])
