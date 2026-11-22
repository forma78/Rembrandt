#!/usr/bin/env python3
"""GOGH: a GEN-V sketch made a card of GOGH's library, TRUE TO THE SKETCH (as genfpic.py for FORM-G; the owner, 2026-11-16: "it must be held to strictly").

The owner, 2026-11-22: "in GOGH we copy FORM-G's functionality fully … the one difference: no long strokes! All of them drops of 2 cm"; "a new picture
generator as GEN-F … GEN-V (as Vincent :)". GEN-V's APPROVE saves the sketch, a json whose `pic` is GOGH's plan already — every leg a dab, a cell a stack of
a jar's dabs in one column, the cells in the brush's order (app/src/goghplan.js). So here only:

  1. the plan as it is: its jars, names, colours, dabs and their order untouched; its id, title, sub and image set;
  2. beside a colour with no jar of his yet, as its code, his own numbered jar of the red classic's shelf (app/formg/porsche-red-k.json) within NEAR of it —
     "≈ Jar 16", a hint, nothing changed (genfpic.py's);
  3. the render: every dab flat in its jar's colour, the brush's width, its ends round, a hair of canvas between two in a column — GEN-V's Sketch (est.).

  python genvpic.py <sketch.json> <id> "<title>" "<sub>" [--local]   → app/gogh/<id>.json, <id>.jpg; --local: in app/gogh/local.json, this Mac alone

Then the name in GOGH_LIB (app/src/goghplan.js) — files first (README's lesson of 2026-11-10) — or, a picture of another's work or a brand, --local alone."""
import sys, os, json
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.join(HERE, '..', '..', 'app')
OUT = os.path.join(APP, 'gogh')
SHELF = os.path.join(APP, 'formg', 'porsche-red-k.json')
NEAR = 8.0          # a jar of his within so much of a sketch colour, CIELAB ΔE76, its hint (est.)
PPM = 3             # the render, px a mm
WIDE = 0.96         # a dab's width, of the pitch (GEN-V's)
GAP = 0.6           # mm of canvas between two dabs in a column (GEN-V's, est.)
GESSO = '#FBFAF7'


def lab(h):
    r, g, b = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = f(r), f(g), f(b)
    X, Y, Z = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, 0.2126 * r + 0.7152 * g + 0.0722 * b, (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883
    F = lambda t: t ** (1 / 3) if t > 216 / 24389 else (24389 / 27 * t + 16) / 116
    return (116 * F(Y) - 16, 500 * (F(X) - F(Y)), 200 * (F(Y) - F(Z)))


def dE(a, b):
    return sum((p - q) ** 2 for p, q in zip(lab(a), lab(b))) ** 0.5


def render(pic, path):
    W, H, p = pic['w'], pic['h'], pic['pitch']
    im = Image.new('RGB', (round(W * PPM), round(H * PPM)), GESSO)
    d = ImageDraw.Draw(im)
    r = WIDE * p / 2
    for j in pic['jars']:
        for c in j['cells']:
            for x, a, b in c['legs']:
                top, bot = max(a, b) - GAP / 2, min(a, b) + GAP / 2
                if top - bot < 2 * r:
                    m = (top + bot) / 2
                    d.ellipse([(x - r) * PPM, (H - m - r) * PPM, (x + r) * PPM, (H - m + r) * PPM], fill=j['hex'])
                else:
                    d.rounded_rectangle([(x - r) * PPM, (H - top) * PPM, (x + r) * PPM, (H - bot) * PPM], radius=r * PPM, fill=j['hex'])
    im.save(path, quality=92)


def make(sketch_path, pid, title, sub, local=False, out=OUT):
    sk = json.load(open(sketch_path))
    pic = json.loads(json.dumps(sk['pic']))
    assert pic.get('kind') == 'dabs', 'not a GEN-V sketch'
    # 2. his jars as hints, beside the colours with no jar's name yet
    shelf = json.load(open(SHELF))['jars']
    pairs = sorted((dE(j['hex'], q['hex']), i, k) for i, j in enumerate(pic['jars']) for k, q in enumerate(shelf) if not j['name'].startswith('Jar ') and not j.get('code'))
    got, taken = {}, set()
    for dd, i, k in pairs:
        if dd <= NEAR and i not in got and k not in taken:
            got[i] = k
            taken.add(k)
    for i, k in got.items():
        pic['jars'][i]['code'] = f"≈ {shelf[k]['name']}"
    pic.update(id=pid, title=title, sub=sub, image=f'gogh/{pid}.jpg')
    os.makedirs(out, exist_ok=True)
    json.dump(pic, open(os.path.join(out, f'{pid}.json'), 'w'), separators=(',', ':'))
    render(pic, os.path.join(out, f'{pid}.jpg'))
    if local:
        lp = os.path.join(out, 'local.json')
        ids = json.load(open(lp))['ids'] if os.path.exists(lp) else []
        if pid not in ids:
            ids.insert(0, pid)
        json.dump({'note': "GOGH's pictures on this Mac alone (others' works, a brand): out of git", 'ids': ids}, open(lp, 'w'), indent=1)
    dabs = sum(len(c['legs']) for j in pic['jars'] for c in j['cells'])
    print(f"{pid}: {len(pic['jars'])} jars, {dabs} dabs, {sum(len(j['cells']) for j in pic['jars'])} stacks, {len(got)} ≈ Jar hints → {out}")
    return pic


if __name__ == '__main__':
    a = [q for q in sys.argv[1:] if q != '--local']
    if len(a) != 4:
        sys.exit(__doc__)
    make(*a, local='--local' in sys.argv)
