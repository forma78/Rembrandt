#!/usr/bin/env python3
"""The red classic 911 off `FORM-G/Top-Down Classic Red Porsche 911.png` (the owner, 2026-11-08: "a new classic Porsche for FORM-G, red, on 70 × 100";
"do not spare the colours, 60 or 70 shades; the main thing is to make the geometry perfect"; "and we have the limit of 850 mm in height").

The geometry is read off the picture itself, not drawn by eye, and made symmetric about the car's axis: every part found as a region of its own kind of pixel —
black (dark and neutral), chrome (light and neutral), amber — in a box round it, its holes filled, then averaged with its own mirror. So the outline, the glass,
the louvres, the lights, the mirrors lie where the picture has them, the left and the right alike. The body is a dark red, L* about 27, so dark alone is not black.

Off, told to the owner: the crest on the bonnet (25 × 26 px, 14 mm: a blot under a 5 mm brush), the wiper (2 px, about 1 mm across: under the brush's track)."""
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from distance_core import to_lab
from brushsim import srgb2lin
from watchplan import poly_mask

PHOTO = '/Users/fiodorsumkin/Rembrandt/FORM-G/Top-Down Classic Red Porsche 911.png'
AXIS = 465.5                       # the windscreen's, the grille's, the outline's middle (465.0 … 466.0)
TOP, BOTTOM = 57, 1602             # the bonnet's front, the bumper's chrome tips: below them the floor's shadow
CREST = (452, 122, 481, 152)
WIPER = [(281, 612), (330, 596), (400, 572), (466, 551)]
KNOB = (466, 551, 9)                # the wiper's pivot, black, 6 mm: off with the wiper
# the headlights, ellipses off the left one, the right its mirror (in the picture it sits ~7 px off the axis): the bezel's outside, and the dark lens in it; between them the
# metal, a thin rim above the lens and a wide crescent under it (the owner, 2026-11-08, lights.png: "not just glass but a metal contour too; I would not leave it out;
# one or two colours at least, and the volume comes at once")
HEAD = (236.0, 166.0, 44.0, 23.0)   # centre x, y, half width, half height, px
LENS = (240.0, 162.5, 36.0, 12.5)
CAP = (466, 361, 33)                # the fuel cap on the bonnet: off (the owner, 2026-11-08, comments-1.jpg, 1: "take the black tank off the bonnet")
# the door mirror, the left one off the picture, the right one its mirror (comments-1.jpg, 4: "the mirror a little bigger on the left, as on the right: they are equal,
# symmetric"): a teardrop from its tip out at the side to its foot on the door
MIRROR = [(145, 726), (150, 712), (160, 700), (175, 693), (195, 688), (206, 692), (208, 712), (190, 719), (170, 725), (150, 730)]
# the rear wings' edge, a thin white light along it, both sides alike (comments-1.jpg, 6: "try a thin white highlight, not as fat as on the right; it lacks a more
# pronounced, symmetric form"): just outside the crease the picture has on the left wing, out from the side to the tail
WING = [(176, 1322), (183, 1350), (190, 1380), (196, 1400), (200, 1420), (205, 1440), (208, 1460), (212, 1480), (217, 1500), (224, 1520), (238, 1540)]
# the shadow down the right of the bonnet's middle, black from y 380, a dark red above, longer than the picture's black alone (comments-1.jpg, 2: "carry the black shadow
# on the right a little further"): the picture's darkest x in every row
SHADOW = [(573, 315), (575, 380), (576, 440), (577, 500), (578, 532)]
# the panels' seams, thin dark lines, fitted to the picture's own seam pixels and their mirror's: 'y' a near-upright line x(y) (its mirror the other side's),
# 'x' a line across y(x), even about the axis. The guess, the span, the corridor round the guess, px. The bonnet's sides, front and back; the engine lid's sides and top.
SEAMS = dict(
    bonnet_side=('y', ((321, 86), (242, 548)), (80, 556), 8),
    lid_side=('y', ((284, 1355), (281, 1535)), (1346, 1546), 8),
    bonnet_front=('x', ((321, 80), (610, 80)), (312, 619), 8),
    # the bonnet's back edge, arched as the glass under it (comments-1.jpg, 3: "the black band, the bonnet's edge, is straight: make it arched, parallel to the glass"):
    # the picture's own thin line, 524 px in the middle, 543 at x 300 and 630
    scuttle=('x', ((240, 560), (270, 551), (300, 543), (330, 537), (360, 531), (390, 527), (420, 525), (465.5, 524), (511, 525), (541, 527), (571, 531), (601, 537), (631, 543), (661, 551), (691, 560)), (236, 695), 5),
    # the rear window's two arcs of light (comments-1.jpg, 5: "I like the two arcs inside there"), its bright lines
    arc_hi=('x', ((300, 1196), (330, 1231), (360, 1250), (390, 1260), (420, 1265), (465.5, 1267), (511, 1265), (541, 1260), (571, 1250), (601, 1231), (631, 1196)), (296, 635), 8),
    arc_lo=('x', ((320, 1290), (370, 1310), (465.5, 1322), (561, 1310), (611, 1290)), (310, 621), 8),
    lid_top=('x', ((300, 1352), (631, 1352)), (276, 655), 8),
)


def mirror(a, axis=AXIS):
    """a (h, w) array mirrored about the axis, sub-pixel"""
    h, w = a.shape
    xs = 2 * axis - np.arange(w)
    return ndi.map_coordinates(a.astype(np.float32), [np.repeat(np.arange(h), w).reshape(h, w), np.tile(xs, (h, 1))], order=1, mode='nearest')


def sym(m, soft=1.2):
    """a region made symmetric: its soft mask and its mirror's, half each"""
    f = ndi.gaussian_filter(m.astype(np.float32), soft)
    return (f + mirror(f)) / 2 > 0.5


def inpaint(im, hole, iters=400):
    """the hole filled from round it, a harmonic fill: what lies under a badge or a wiper"""
    out = im.copy()
    near = ndi.binary_dilation(hole, iterations=3) & ~hole
    for c in range(3):
        a = out[..., c]
        a[hole] = a[near].mean()
        for _ in range(iters):
            s = ndi.uniform_filter(a, 3)
            a[hole] = s[hole]
    return out


def line_mask(shape, pts, half):
    h, w = shape
    Y, X = np.mgrid[0:h, 0:w]
    d = np.full(shape, 1e9, np.float32)
    for (ax, ay), (bx, by) in zip(pts[:-1], pts[1:]):
        vx, vy = bx - ax, by - ay
        u = np.clip(((X - ax) * vx + (Y - ay) * vy) / (vx * vx + vy * vy), 0, 1)
        d = np.minimum(d, np.hypot(X - (ax + u * vx), Y - (ay + u * vy)))
    return d <= half


def line_dist(pts, X, Y):
    """the distance from every point to a polyline, px"""
    d = np.full(np.shape(X), 1e9, np.float32)
    for (ax, ay), (bx, by) in zip(pts[:-1], pts[1:]):
        vx, vy = bx - ax, by - ay
        u = np.clip(((X - ax) * vx + (Y - ay) * vy) / (vx * vx + vy * vy), 0, 1)
        d = np.minimum(d, np.hypot(X - (ax + u * vx), Y - (ay + u * vy)))
    return d


def boxed(m, box):
    x0, y0, x1, y1 = box
    out = np.zeros_like(m)
    out[y0:y1, x0:x1] = m[y0:y1, x0:x1]
    return out


def largest(m, k=1):
    lb, n = ndi.label(m)
    if n == 0:
        return m
    sz = ndi.sum(m, lb, range(1, n + 1))
    keep = np.argsort(-sz)[:k] + 1
    return np.isin(lb, keep)


def region(m, box, k=1, close=2):
    """a part: its kind of pixel in the box, closed, its holes filled, the k largest pieces"""
    r = boxed(m, box)
    if close:
        r = ndi.binary_closing(r, iterations=close)
    return largest(ndi.binary_fill_holes(r), k)


def fit_seams(lab):
    L, C = lab[..., 0], np.hypot(lab[..., 1], lab[..., 2])
    seam = (ndi.grey_closing(L, size=(7, 7)) - L > 6) & (C > 10)
    bright = (L - ndi.grey_opening(L, size=(9, 9)) > 8) & (C < 18)
    out = {}
    for name, (along, pts, span, corr) in SEAMS.items():
        (ax, ay), (bx, by) = pts[0], pts[-1]
        light = name.startswith('arc')
        ys, xs = np.where(bright if light else seam)
        if along == 'y':
            g = lambda t: ax + (bx - ax) * (t - ay) / (by - ay)
            T = np.r_[ys, ys]; V = np.r_[xs, 2 * AXIS - xs]
            sel = (T >= span[0] + 6) & (T <= span[1] - 6) & (np.abs(V - g(T)) < corr)
            deg, var = (1 if name == 'lid_side' else 2), T
        else:
            gx, gy = np.array([q[0] for q in pts], float), np.array([q[1] for q in pts], float)
            g = lambda t: np.interp(t, gx, gy)
            T = np.r_[xs, 2 * AXIS - xs]; V = np.r_[ys, ys]
            sel = (T >= span[0] + 4) & (T <= span[1] - 4) & (np.abs(V - g(T)) < corr)
            deg, var = 2, (T - AXIS) ** 2          # even about the axis
        T, V, U = T[sel], V[sel], var[sel]
        p = np.polyfit(U, V, deg)
        ok = np.abs(V - np.polyval(p, U)) < 2.5
        p = np.polyfit(U[ok], V[ok], deg)
        out[name] = dict(along=along, p=p, span=span, n=int(ok.sum()), off=float(np.abs(V[ok] - np.polyval(p, U[ok])).mean()))
    return out


def seam_dist(seams, px, py, names=None):
    """the distance, photo px, from every point to the nearest of the seams named, both sides"""
    d = np.full(px.shape, 1e9, np.float32)
    for name, q in seams.items():
        if names and name not in names:
            continue
        a, b = q['span']
        if q['along'] == 'y':
            x = np.polyval(q['p'], py)
            on = (py >= a) & (py <= b)
            d = np.where(on, np.minimum(d, np.minimum(np.abs(px - x), np.abs(px - (2 * AXIS - x)))), d)
        else:
            y = np.polyval(q['p'], (px - AXIS) ** 2)
            on = (px >= a) & (px <= b)
            d = np.where(on, np.minimum(d, np.abs(py - y)), d)
    return d


def load():
    im = np.asarray(Image.open(PHOTO).convert('RGB'), dtype=np.float32) / 255.0
    h, w, _ = im.shape
    hole = np.zeros((h, w), bool)
    x0, y0, x1, y1 = CREST
    hole[y0:y1, x0:x1] = True
    hole |= line_mask((h, w), WIPER, 3.0) & (np.arange(h)[:, None] < 566)      # over the red scuttle only: over the glass's black frame it is black on black
    hole |= line_mask((h, w), [KNOB[:2], (KNOB[0], KNOB[1] + 0.01)], KNOB[2])
    hole |= line_mask((h, w), [CAP[:2], (CAP[0], CAP[1] + 0.01)], CAP[2])
    im = inpaint(im, hole)
    lab = to_lab(srgb2lin(im * 255).astype(np.float32))
    L, A, B = lab[..., 0], lab[..., 1], lab[..., 2]
    C = np.hypot(A, B)
    hue = np.degrees(np.arctan2(B, A))
    rows = np.arange(h)[:, None]
    # the car: red or dark, the floor's grey shadow not; the chrome in it as its holes; below the bumper only the tips
    car = (C > 18) | (L < 50)
    car &= (rows >= TOP) & (rows <= BOTTOM)
    car = largest(ndi.binary_opening(car, iterations=1))
    black = (C < 18) & (L < 35)
    chrome = (C < 18) & (L >= 35)
    tips = region(chrome | black, (288, 1555, 342, BOTTOM + 1), close=1) | region(chrome | black, (589, 1555, 643, BOTTOM + 1), close=1)
    Y, X = np.mgrid[0:h, 0:w].astype(np.float32)
    mirrors = sym(poly_mask(X, Y, MIRROR) | (mirror(poly_mask(X, Y, MIRROR)) > 0.5), 0.8)
    car = ndi.binary_fill_holes(car | tips | mirrors)
    mask = sym(car, 1.6)
    black &= mask
    chrome &= mask
    amber = mask & (C > 40) & (hue > 48) & (hue < 82)
    P = {}
    P['wind'] = sym(region(black, (205, 535, 728, 782)))                       # the windscreen, its black frame and what is seen through it
    P['rear'] = sym(region(black, (268, 1100, 664, 1352)))                     # the rear window
    P['grille'] = sym(region(black | chrome, (296, 1368, 636, 1540)))          # the engine lid's louvres and the black under them
    P['sides'] = sym(region(black | chrome, (160, 640, 262, 1242)) | region(black | chrome, (669, 640, 771, 1242)), 1.0)   # the side windows and their chrome
    ell = lambda e: ((X - e[0]) / e[2]) ** 2 + ((Y - e[1]) / e[3]) ** 2 <= 1
    P['heads'] = sym(ell(HEAD) | (mirror(ell(HEAD)) > 0.5), 0.6)               # the headlights, bezel and lens
    P['diffuser'] = sym(region(black, (330, 1556, 600, 1600), close=1))
    P['posts'] = sym(tips & ~P['diffuser'])
    P['amber'] = sym(ndi.binary_closing(amber, iterations=2), 1.0)
    # the tail lights: the bright red bar across the tail, its segments one bar
    tl = mask & (rows > 1536) & (rows < 1566) & (L > 30) & (C > 50) & (A > 45)
    P['tail'] = sym(ndi.binary_closing(tl, structure=np.ones((3, 9)), iterations=1), 1.0)
    P['mirrors'] = mirrors
    seams = fit_seams(lab)
    # the body's panels: the body cut by the seams, every piece its own (the bonnet, the engine lid …), so that no leg runs across a seam
    Y, X = np.mgrid[0:h, 0:w].astype(np.float32)
    body = mask & ~np.any(np.stack([m for k, m in P.items() if k != 'mirrors']), axis=0)
    cut = seam_dist(seams, X, Y) < 1.5
    panels, n = ndi.label(body & ~cut)
    return dict(im=im, lab=lab, mask=mask, parts=P, black=black, chrome=chrome, seams=seams, panels=panels, h=h, w=w)


if __name__ == '__main__':
    import sys
    g = load()
    ys, xs = np.where(g['mask'])
    print('mask x', xs.min(), xs.max(), 'y', ys.min(), ys.max(), 'middle', (xs.min() + xs.max()) / 2)
    ov = (g['im'] * 255).astype(np.uint8).copy()
    col = dict(wind=(0, 255, 0), rear=(0, 200, 255), grille=(255, 0, 255), sides=(255, 255, 0), mirrors=(0, 0, 255), heads=(0, 255, 255), diffuser=(128, 0, 255), posts=(255, 128, 0), amber=(255, 220, 0), tail=(255, 255, 255))
    for k, m in g['parts'].items():
        e = m & ~ndi.binary_erosion(m, iterations=2)
        ov[e] = col[k]
        ys, xs = np.where(m)
        if len(xs):
            print(f'{k:9s} x {xs.min()} … {xs.max()}  y {ys.min()} … {ys.max()}  px {m.sum()}')
    e = g['mask'] & ~ndi.binary_erosion(g['mask'], iterations=2)
    ov[e] = (0, 0, 0)
    for k, q in g['seams'].items():
        print(f'seam {k:12s} {q["n"]} px, {q["off"]:.2f} px off on average')
    Y, X = np.mgrid[0:g['h'], 0:g['w']].astype(np.float32)
    ov[seam_dist(g['seams'], X, Y) < 0.8] = (0, 255, 255)
    lb = g['panels']
    sz = ndi.sum(lb > 0, lb, range(1, lb.max() + 1))
    print('panels', int((sz > 2000).sum()), 'of 2000 px at least')
    Image.fromarray(ov).save(sys.argv[1] if len(sys.argv) > 1 else 'red_parts.png')
