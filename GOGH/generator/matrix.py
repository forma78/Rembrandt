# GOGH's round matrix (the owner, 2026-11-23: "not FORM-G's lines, which made the effect of an RGB LED — the pattern of a round matrix"; "all the colours of
# the GEN-V tab"; of a bear's head: "try such a gummy bear head on 30 × 30, please"), any GEN-V sketch: every dab a pixel of its own, rows 12 mm apart, in a
# row PITCH apart, every other row PITCH / 2 aside; a dab's top and bottom where the picture's paint begins and ends under it, so the contour stays; its
# colour the one most of its pixels are nearest to (not the mean: no mush), of all the sketch's colours, the ones its jar canon took out too — no jar canon; the sketch's ground, where it joins the edges named,
# bare; the lightest colours (L* 90 and over, est.) the highlights, last, over the rest. GOGH/generator/press4_matrix.py its first, for-LAB's.
#   python3 matrix.py sketch.json picture.png out.json [side mm] [pitch mm] [id] [title] [edges: t l r b, the ground's]
import json, sys, numpy as np
from PIL import Image, ImageDraw
sk = json.load(open(sys.argv[1])); im0 = Image.open(sys.argv[2]).convert('RGB'); OUT = sys.argv[3]
SIDE = float(sys.argv[4]) if len(sys.argv) > 4 else 300; PITCH = float(sys.argv[5]) if len(sys.argv) > 5 else 5
ID = sys.argv[6] if len(sys.argv) > 6 else 'matrix'; TITLE = sys.argv[7] if len(sys.argv) > 7 else ID; EDGES = sys.argv[8] if len(sys.argv) > 8 else 'tlr'
f0 = sk['format'].split('x'); K_ = SIDE / (float(f0[0]) * 10)                 # the sketch's canvas → this one
bx = sk['image'].get('box') or [0, 0, im0.width, im0.height]
im = np.asarray(im0.crop(tuple(bx))).astype(float) / 255; H, W = im.shape[:2]
def lab(rgb):
    c = np.where(rgb > 0.04045, ((rgb + 0.055) / 1.055) ** 2.4, rgb / 12.92)
    X = c @ np.array([0.4124, 0.3576, 0.1805]) / 0.95047; Y = c @ np.array([0.2126, 0.7152, 0.0722]); Z = c @ np.array([0.0193, 0.1192, 0.9505]) / 1.08883
    f = lambda t: np.where(t > 0.008856, np.cbrt(t), 7.787 * t + 16 / 116)
    return np.stack([116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))], -1)
hexrgb = lambda h: np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)]) / 255
L = lab(im); g = lab(hexrgb(sk['image'].get('ground') or '#FFFFFF'))
near = np.sqrt(((L - g) ** 2).sum(-1)) < 10                                  # the ground's colour, est.
fl = Image.fromarray((near * 255).astype(np.uint8)).copy()
starts = ([(u, 0) for u in range(0, W, 3)] if 't' in EDGES else []) + ([(u, H - 1) for u in range(0, W, 3)] if 'b' in EDGES else []) \
       + ([(0, v) for v in range(0, H, 3)] if 'l' in EDGES else []) + ([(W - 1, v) for v in range(0, H, 3)] if 'r' in EDGES else [])
for p in starts:
    if fl.getpixel(p) == 255: ImageDraw.floodfill(fl, p, 128)
bg = np.asarray(fl) == 128
cols = [(j['name'], j['hex']) for j in sk['jars']] + [(f"Colour {len(sk['jars']) + 1 + i}", o['hex']) for i, o in enumerate(sk.get('out', []))]
cols = [c for c in cols if c[1].upper() != (sk['image'].get('ground') or '').upper()]
cols.sort(key=lambda c: -lab(hexrgb(c[1]))[0])
pal = np.array([lab(hexrgb(h)) for _, h in cols]); LAST, HIGH = 90, 0.25   # a highlight: a dab with a quarter of it the lightest (est.)
X0, Y0 = sk['left'] * K_, sk['top'] * K_; PW, PH = sk['picture_mm'][0] * K_, sk['picture_mm'][1] * K_
px = lambda x: (x - X0) / PW * W; py = lambda yt: (yt - Y0) / PH * H           # mm from the canvas's top → px
P, Q, HALF, MIN = PITCH, 12.0, PITCH / 4, 3.0
N = int(PW // P); left = X0 + (PW - N * P) / 2 + P / 2
dabs = []; r = 0; t = Y0
while t < Y0 + PH:
    off = P / 2 if r % 2 else 0
    for k in range(N):
        x = left + k * P + off
        if x > X0 + PW - 1: continue
        u0, u1 = max(0, int(px(x - HALF))), min(W, int(np.ceil(px(x + HALF))))
        a, b = t, min(t + Q, Y0 + PH); v0, v1 = int(py(a)), min(H, int(np.ceil(py(b))))
        on = (~bg[v0:v1, u0:u1]).mean(1) > 0.5
        if not on.any(): continue
        idx = np.nonzero(on)[0]; top, bot = a + idx[0] / (v1 - v0) * (b - a), a + (idx[-1] + 1) / (v1 - v0) * (b - a)
        if bot - top < MIN: continue
        w0, w1 = max(0, int(px(x - 2))), min(W, int(np.ceil(px(x + 2)))); vv0, vv1 = int(py(top)), min(H, int(np.ceil(py(bot))))
        m = ~bg[vv0:vv1, w0:w1]; q = L[vv0:vv1, w0:w1][m]
        near_ = np.argmin(((q[:, None, :] - pal[None]) ** 2).sum(-1), 1); cnt = np.bincount(near_, minlength=len(pal))
        light = [i for i in range(len(pal)) if pal[i][0] >= LAST]
        k_ = max(light, key=lambda i: cnt[i]) if light and cnt[light].sum() >= HIGH * len(q) else int(np.argmax(np.where([i in light for i in range(len(pal))], -1, cnt)))
        dabs.append((r, round(x, 2), round(SIDE - top, 2), round(SIDE - bot, 2), k_))
    r += 1; t += Q
jars = []
for k_, (name, hx) in enumerate(cols):
    mine = sorted([d for d in dabs if d[4] == k_], key=lambda d: (d[0], d[1] if d[0] % 2 == 0 else -d[1]))
    if mine: jars.append({'id': f'm{k_}', 'name': name, 'code': '', 'hex': hx, 'coats': 1, **({'last': True} if pal[k_][0] >= LAST else {}),
                          'cells': [{'n': i + 1, 'legs': [[d[1], d[2], d[3]]]} for i, d in enumerate(mine)]})
pic = {'id': ID, 'title': TITLE, 'sub': f"{SIDE / 10:g} × {SIDE / 10:g}: {sk['image'].get('name', '')} as a round matrix — every dab a pixel, rows 12 mm apart, in a row {P:g} mm apart, every other row {P / 2:g} mm aside, a dab's top and bottom by the picture's contour; all GEN-V's {len(cols)} colours, no jar canon, the lightest last; the 2 mm brush",
       'w': SIDE, 'h': SIDE, 'pitch': 2, 'columns': N * 2, 'kind': 'dabs', 'dab': {'aim': 12, 'min': 3, 'max': 12, 'brush': 2},
       'jars': jars, 'image': f'gogh/{ID}.jpg', 'look': {'gap': 0.2, 'wide': 2.2}, 'drop': 'colour'}
xs = [d[1] for d in dabs]; ys = [v for d in dabs for v in d[2:4]]; pic['box'] = [min(xs) - 1, min(ys), max(xs) + 1, max(ys)]
json.dump(pic, open(OUT, 'w'), separators=(',', ':'))
print('rows', r, 'dabs', len(dabs), 'jars', len(jars)); [print(' ', j['name'], j['hex'], len(j['cells']), 'last' if j.get('last') else '') for j in jars]
