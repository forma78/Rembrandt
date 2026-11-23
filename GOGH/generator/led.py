# GOGH's "1 and ½" (the owner, 2026-11-23: "do we need the chess at all? maybe simply in stripes, as rgb-led.png … I would build it by the principle of 1 and ½
# — to save time. If a headlight or some small detail, ½ a seed; if a fill as the bonnet, there 1 leg"; his Screenshot 2026-11-23 at 4.12.12 PM.png: a column
# one long cell beside one cut in two; "as in FORM-G, vertical lines … only no paint dragged, short legs and seeds"): vertical columns PITCH apart, every one
# cut into cells UNIT long in level rows, no chess; a cell one leg of one jar where its two halves are the same jar, else two seeds, ½ each, each its own — a
# seed on the machine as RUN 6 lays it (the card's dab.seed, goghplan.js); a cell's top and bottom, and a half's, where the picture's paint begins and ends
# under it, the white ground bare; a part's jar the one most of its pixels are nearest to, of all the sketch's colours (no jar canon); the lightest last.
# Two layers (the owner, 2026-11-23, of the gummy bear's head: "our principle of 1 and ½ the other way round … last we lay only the seeds of the lightest and the
# darkest. Properly as Layer 2. Then the wet on wet is solved too"): with NEAR a cell whose halves' jars lie nearer than it a leg, a fill's
# near shades not cut into seeds; with `ext` the seeds of the EXT lightest and the EXT darkest jars a line of their own each,
# `late`, Layer 2, on the dry first layer — the darks first, the lightest the very last; the legs, and every other seed, Layer 1, light to dark as before.
#   python3 led.py sketch.json picture.png out.json [side mm] [pitch mm] [id] [title] [edges] [unit mm] [ext] [near ΔE] [orange jar's name]
import json, sys, numpy as np
from PIL import Image, ImageDraw
sk = json.load(open(sys.argv[1])); im0 = Image.open(sys.argv[2]).convert('RGB'); OUT = sys.argv[3]
SIDE = float(sys.argv[4]) if len(sys.argv) > 4 else 200; PITCH = float(sys.argv[5]) if len(sys.argv) > 5 else 3
ID = sys.argv[6] if len(sys.argv) > 6 else 'led'; TITLE = sys.argv[7] if len(sys.argv) > 7 else ID; EDGES = sys.argv[8] if len(sys.argv) > 8 else 'tl'
UNIT = float(sys.argv[9]) if len(sys.argv) > 9 else 12; HALF_ = UNIT / 2
LAYERS = len(sys.argv) > 10 and sys.argv[10] == 'ext'; EXT = 2   # the lightest and the darkest jars, so many each way (est.)
ORANGE = sys.argv[12] if len(sys.argv) > 12 else ''   # the jar the picture's orange is painted by, its name (the owner's Jar 6): a part a third of it orange its
# (hue over 45°, chroma over 40, est.) — the photo's indicator darker than his paint, by colour alone nearer a red (2026-11-23, the headlight)
NEAR = float(sys.argv[11]) if len(sys.argv) > 11 else 0   # CIELAB ΔE76: a cell's halves nearer than it one leg — a fill's near shades not cut into seeds (est.)
f0 = sk['format'].split('x'); K_ = SIDE / (float(f0[0]) * 10)
bx = sk['image'].get('box') or [0, 0, im0.width, im0.height]
im = np.asarray(im0.crop(tuple(bx))).astype(float) / 255; H, W = im.shape[:2]
def lab(rgb):
    c = np.where(rgb > 0.04045, ((rgb + 0.055) / 1.055) ** 2.4, rgb / 12.92)
    X = c @ np.array([0.4124, 0.3576, 0.1805]) / 0.95047; Y = c @ np.array([0.2126, 0.7152, 0.0722]); Z = c @ np.array([0.0193, 0.1192, 0.9505]) / 1.08883
    f = lambda t: np.where(t > 0.008856, np.cbrt(t), 7.787 * t + 16 / 116)
    return np.stack([116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))], -1)
hexrgb = lambda h: np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)]) / 255
L = lab(im); ground = sk['image'].get('ground') or '#FFFFFF'
g = lab(hexrgb(ground)) if ground != '#FFFFFF' else np.array([100.0, 0, 0])
near = (np.sqrt(((L - g) ** 2).sum(-1)) < 10) | ((L[..., 0] > 90) & (np.hypot(L[..., 1], L[..., 2]) < 8))
fl = Image.fromarray((near * 255).astype(np.uint8)).copy()
starts = ([(u, 0) for u in range(0, W, 3)] if 't' in EDGES else []) + ([(u, H - 1) for u in range(0, W, 3)] if 'b' in EDGES else []) \
       + ([(0, v) for v in range(0, H, 3)] if 'l' in EDGES else []) + ([(W - 1, v) for v in range(0, H, 3)] if 'r' in EDGES else [])
for p in starts:
    if fl.getpixel(p) == 255: ImageDraw.floodfill(fl, p, 128)
bg = np.asarray(fl) == 128
cols = [(j['name'], j['hex']) for j in sk['jars']] + [(f"Colour {len(sk['jars']) + 1 + i}", o['hex']) for i, o in enumerate(sk.get('out', []))]
cols.sort(key=lambda c: -lab(hexrgb(c[1]))[0])
pal = np.array([lab(hexrgb(h)) for _, h in cols]); LAST, HIGH = 90, 0.25
X0, Y0 = sk['left'] * K_, sk['top'] * K_; PW, PH = sk['picture_mm'][0] * K_, sk['picture_mm'][1] * K_
px = lambda x: (x - X0) / PW * W; py = lambda yt: (yt - Y0) / PH * H
light = [i for i in range(len(pal)) if pal[i][0] >= LAST]
ORANGE_K = next((i for i, c in enumerate(cols) if c[0] == ORANGE), None)
def jar_of(x, a, b):                       # the part's jar: a highlight if a quarter of it is the lightest, else the one most pixels are nearest to
    u0, u1 = max(0, int(px(x - PITCH / 2))), min(W, int(np.ceil(px(x + PITCH / 2)))); v0, v1 = int(py(a)), min(H, int(np.ceil(py(b))))
    q = L[v0:v1, u0:u1][~bg[v0:v1, u0:u1]]
    if not len(q): return None
    cnt = np.bincount(np.argmin(((q[:, None, :] - pal[None]) ** 2).sum(-1), 1), minlength=len(pal))
    if light and cnt[light].sum() >= HIGH * len(q): return max(light, key=lambda i: cnt[i])
    if ORANGE and ORANGE_K is not None and ((np.degrees(np.arctan2(q[:, 2], q[:, 1])) > 45) & (np.hypot(q[:, 1], q[:, 2]) > 40)).mean() >= 1 / 3: return ORANGE_K
    return int(np.argmax(np.where([i in light for i in range(len(pal))], -1, cnt)))
def paint_span(x, a, b):                   # where the picture's paint begins and ends on the part's axis
    u0, u1 = max(0, int(px(x - PITCH / 4))), min(W, int(np.ceil(px(x + PITCH / 4)))); v0, v1 = int(py(a)), min(H, int(np.ceil(py(b))))
    on = (~bg[v0:v1, u0:u1]).mean(1) > 0.5
    if not on.any(): return None
    i = np.nonzero(on)[0]; return a + i[0] / (v1 - v0) * (b - a), a + (i[-1] + 1) / (v1 - v0) * (b - a)
N = int(PW // PITCH); left = X0 + (PW - N * PITCH) / 2 + PITCH / 2
dabs = []; legs = seeds = 0
for k in range(N):
    x = left + k * PITCH; t = Y0
    while t < Y0 + PH - 3:
        b = min(t + UNIT, Y0 + PH); sp = paint_span(x, t, b)
        if sp:
            m = (t + b) / 2; A, B = paint_span(x, t, m), paint_span(x, m, b)
            ja = jar_of(x, *A) if A and A[1] - A[0] >= 3 else None; jb = jar_of(x, *B) if B and B[1] - B[0] >= 3 else None
            if ja is not None and jb is not None and ja != jb and np.linalg.norm(pal[ja] - pal[jb]) < NEAR and sp[1] - sp[0] > HALF_ + 1:
                ja = jb = jar_of(x, *sp)                                               # two near reds one fill: a leg in the cell's own
            if ja is not None and ja == jb and sp[1] - sp[0] > HALF_ + 1:
                dabs.append((k, x, sp[0], sp[1], ja, 'leg')); legs += 1              # 1: a leg
            else:
                for part, j in ((A, ja), (B, jb)):                                     # ½ + ½: a seed each, its plan ½ long at the part's top
                    if part and j is not None: dabs.append((k, x, part[0], min(part[0] + HALF_, part[1] if part[1] - part[0] >= HALF_ else part[0] + HALF_), j, 'seed')); seeds += 1
        t += UNIT
used = sorted({d[4] for d in dabs}, key=lambda i: -pal[i][0])                 # light to dark
light_, dark_ = (used[:EXT], used[-EXT:]) if LAYERS else ([], [])
late = lambda d: d[5] == 'seed' and (d[4] in light_ or d[4] in dark_)
snake = lambda ds: sorted(ds, key=lambda d: (d[0], d[2] if d[0] % 2 == 0 else -d[2]))   # column by column, a snake
jar = lambda k_, ds, two: {'id': f'l{k_}' + ('-2' if two else ''), 'name': cols[k_][0], 'code': '', 'hex': cols[k_][1], 'coats': 1,
                           **({'late': True} if two else {}), **({'last': True} if not LAYERS and pal[k_][0] >= LAST else {}),
                           'cells': [{'n': i + 1, 'legs': [[round(d[1], 2), round(SIDE - d[2], 2), round(SIDE - d[3], 2)]]} for i, d in enumerate(snake(ds))]}
jars = [jar(k_, ds, False) for k_ in used if (ds := [d for d in dabs if d[4] == k_ and not late(d)])]
jars += [jar(k_, ds, True) for k_ in [*dark_, *reversed(light_)] if (ds := [d for d in dabs if d[4] == k_ and late(d)])]   # Layer 2: the darks, then the lights, the lightest last
pic = {'id': ID, 'title': TITLE, 'sub': f"{SIDE / 10:g} × {SIDE / 10:g}: {sk['image'].get('name', '')} in 1 and ½ — columns {PITCH:g} mm apart, cells of {UNIT:g} mm in level rows, a cell one leg or two seeds; all GEN-V's {len(cols)} colours, no jar canon; " + (f"Layer 2 on the dry first: the seeds of the {EXT} lightest and the {EXT} darkest jars; " if LAYERS else "the lightest last; ") + f"the 2 mm brush, the new; {legs} legs, {seeds} seeds",
       'w': SIDE, 'h': SIDE, 'pitch': 2, 'columns': N, 'kind': 'dabs', 'dab': {'aim': UNIT, 'min': 3, 'max': UNIT, 'brush': 2, 'seed': HALF_},
       'jars': jars, 'image': f'gogh/{ID}.jpg', 'look': {'gap': 0.2, 'wide': 2.2}, 'drop': 'colour'}
xs = [d[1] for d in dabs]; ys = [SIDE - v for d in dabs for v in d[2:4]]; pic['box'] = [min(xs) - 1, min(ys), max(xs) + 1, max(ys)]
json.dump(pic, open(OUT, 'w'), separators=(',', ':'))
print('columns', N, 'dabs', len(dabs), 'legs', legs, 'seeds', seeds, 'lines', len(jars), 'layer 2', [(j['name'], len(j['cells'])) for j in jars if j.get('late')])
