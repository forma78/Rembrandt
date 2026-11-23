# Press test 4 as a matrix (the owner, 2026-11-23: "not FORM-G's lines, which made the effect of an RGB LED — the pattern of a round matrix"; "the blue
# sausages … make a smooth contour as a television's matrix"; "the white stripes will go with a chess arrangement of the strokes"; "all the colours of
# GEN-V"): every dab a pixel of its own, rows 12 mm apart, in a row 6 mm apart, every other row 3 mm aside; a dab's top where the picture's paint begins
# under it, its bottom where it ends, so the contour stays; its colour the nearest of all GEN-V's colours (the white ground none); no jar canon
# 30 × 30 and the highlights (the owner, the same afternoon, of the white highlight under the headlight, lost: "maybe on 30 × 30? … the distance between
# the sausages can be 1 mm less"): python3 press4_matrix.py out.json [side mm] [pitch mm] [id]; the photo's white joined to its top or left edge the ground,
# bare; a white closed in by the car a highlight, painted in white, last, over the reds
import json, sys, numpy as np
from PIL import Image, ImageDraw
SIDE = float(sys.argv[2]) if len(sys.argv) > 2 else 200; PITCH = float(sys.argv[3]) if len(sys.argv) > 3 else 6
ID = sys.argv[4] if len(sys.argv) > 4 else 'press-porsche-matrix-20'; K_ = SIDE / 200
R = '/Users/fiodorsumkin/Rembrandt/'
sk = json.load(open(R + 'GOGH/for-LAB · GEN-V · 20x20 · 2 mm · 16.json'))
im = np.asarray(Image.open(R + 'GOGH/for-LAB.png').convert('RGB')).astype(float) / 255
H, W = im.shape[:2]
def lab(rgb):
    c = np.where(rgb > 0.04045, ((rgb + 0.055) / 1.055) ** 2.4, rgb / 12.92)
    X = c @ np.array([0.4124, 0.3576, 0.1805]) / 0.95047; Y = c @ np.array([0.2126, 0.7152, 0.0722]); Z = c @ np.array([0.0193, 0.1192, 0.9505]) / 1.08883
    f = lambda t: np.where(t > 0.008856, np.cbrt(t), 7.787 * t + 16 / 116)
    return np.stack([116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))], -1)
L = lab(im); white = (L[..., 0] > 90) & (np.hypot(L[..., 1], L[..., 2]) < 8)
# the ground: the white joined to the photo's top or left edge (its bottom and right cut through the car); the rest of the white a highlight
fl = Image.fromarray((white * 255).astype(np.uint8)).copy()
for u in range(0, W, 4):
    if fl.getpixel((u, 0)) == 255: ImageDraw.floodfill(fl, (u, 0), 128)
for v in range(0, H, 4):
    if fl.getpixel((0, v)) == 255: ImageDraw.floodfill(fl, (0, v), 128)
bg = np.asarray(fl) == 128; hi = white & ~bg
hexrgb = lambda h: np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)]) / 255
# all GEN-V's colours: its jars and the two its canon took out, the white ground none; light to dark
cols = [(j['name'], j['hex']) for j in sk['jars'] if j['hex'] != '#FEFDFD'] + [(f"Colour {15 + i}", o['hex']) for i, o in enumerate(sk['out'])]
cols.sort(key=lambda c: -lab(hexrgb(c[1]))[0])
WHITE = len(cols); cols.append(('Colour 1', '#FEFDFD'))                  # the highlights' white, last
pal = np.array([lab(hexrgb(h)) for _, h in cols[:WHITE]])
X0, Y0, PW, PH = 6 * K_, 10 * K_, 188 * K_, 180 * K_
px = lambda x: (x - X0) / PW * W; py = lambda yt: (yt - Y0) / PH * H        # mm from the canvas's top → px
P, Q, HALF, MIN = PITCH, 12.0, PITCH / 4, 3.0
N = int(PW // P); left = X0 + (PW - N * P) / 2 + P / 2
dabs = []
r = 0; t = Y0
while t < Y0 + PH:
    off = P / 2 if r % 2 else 0
    for k in range(N + (0 if r % 2 else 0)):
        x = left + k * P + off
        if x > X0 + PW - 1: continue
        u0, u1 = int(px(x - HALF)), int(np.ceil(px(x + HALF)))
        a, b = t, min(t + Q, Y0 + PH)
        v0, v1 = int(py(a)), int(np.ceil(py(b)))
        rows = ~bg[v0:v1, u0:u1]
        on = rows.mean(1) > 0.5                       # the picture's paint along the dab's axis, row by row of px
        if not on.any(): continue
        idx = np.nonzero(on)[0]; i0, i1 = idx[0], idx[-1] + 1
        top, bot = a + i0 / (v1 - v0) * (b - a), a + i1 / (v1 - v0) * (b - a)
        if bot - top < MIN: continue
        w0, w1 = int(px(x - 2)), int(np.ceil(px(x + 2))); vv0, vv1 = int(py(top)), int(np.ceil(py(bot)))
        m = ~bg[vv0:vv1, w0:w1]; h_ = hi[vv0:vv1, w0:w1][m]
        if h_.mean() > 0.5: k_ = WHITE
        else: mean = L[vv0:vv1, w0:w1][m & ~hi[vv0:vv1, w0:w1]].mean(0); k_ = int(np.argmin(((pal - mean) ** 2).sum(1)))
        dabs.append((r, round(x, 2), round(SIDE - top, 2), round(SIDE - bot, 2), k_))
    r += 1; t += Q
jars = []
for k_, (name, hx) in enumerate(cols):
    mine = [d for d in dabs if d[4] == k_]
    if not mine: continue
    mine.sort(key=lambda d: (d[0], d[1] if d[0] % 2 == 0 else -d[1]))       # row by row, a snake
    jars.append({'id': f'm{k_}', 'name': name, 'code': '', 'hex': hx, 'coats': 1, **({'last': True} if k_ == WHITE else {}), 'cells': [{'n': i + 1, 'legs': [[d[1], d[2], d[3]]]} for i, d in enumerate(mine)]})
pic = {'id': ID, 'title': f'Press test 4 · porsche · matrix' + ('' if SIDE == 200 else f' · {SIDE / 10:g} × {SIDE / 10:g}'),
       'sub': f"{SIDE / 10:g} × {SIDE / 10:g}: for-LAB as a round matrix — every dab a pixel, rows 12 mm apart, in a row {P:g} mm apart, every other row {P / 2:g} mm aside, a dab's top and bottom where the picture's paint begins and ends under it; all GEN-V's colours, its white the highlights alone, last, the ground bare; no jar canon; the 2 mm brush",
       'w': SIDE, 'h': SIDE, 'pitch': 2, 'columns': N * 2, 'kind': 'dabs', 'dab': {'aim': 12, 'min': 3, 'max': 12, 'brush': 2},
       'jars': jars, 'image': f'gogh/{ID}.jpg', 'look': {'gap': 0.2, 'wide': 2.2}, 'drop': 'colour', 'from': 'for-lab-20x20-2mm-16'}
xs = [d[1] for d in dabs]; ys = [v for d in dabs for v in d[2:4]]
pic['box'] = [min(xs) - 1, min(ys), max(xs) + 1, max(ys)]
json.dump(pic, open(sys.argv[1], 'w'), separators=(',', ':'))   # then raised, so the drops' tails stay on the canvas: 14.8 mm for for-LAB, by goghplan.js's dropOf
print('rows', r, 'dabs', len(dabs), 'jars', len(jars))
for j in jars: print(' ', j['name'], j['hex'], len(j['cells']))
