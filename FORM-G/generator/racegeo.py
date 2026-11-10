#!/usr/bin/env python3
"""The red racing 911 from the front, off `FORM-G/Red Porsche GT Race Car.png` (the owner, 2026-11-10: "the frontal racing Porsche's face … in place of the green
Porsche in FORM-G"; "PORSCHE on the glass as a hint: the letters as if not there, but you know what is written"; "RECARO and the crest, not scary: just gradation").

redgeo.py's way: the geometry read off the picture, every part a region of its own kind of pixel in a box round it, its holes filled, made symmetric about the car's
axis (its mirror and itself, half each), so the left and the right alike. The tones stay the picture's own.

Off, before the tones are read: the two stickers on the bonnet's right (the "E" roundel, the blue triangle: one side only, not the car's) and the crest under the
bonnet's black triangle, a badge laid in its place after the plan (redcar.py's BADGE, the owner, 2026-11-10, of the red classic: "a black badge on the bonnet …
no Porsche logo, but a mark one cannot read")."""
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from distance_core import to_lab
from brushsim import srgb2lin
from redgeo import mirror as _mirror, inpaint, largest, boxed

PHOTO = '/Users/fiodorsumkin/Rembrandt/FORM-G/Red Porsche GT Race Car.png'
AXIS = 625.5                        # the best mirror of the whole car's dark pixels (624.0 … 627.0 tried)
STICKERS = [(733, 484, 783, 518), (830, 490, 884, 516)]   # the "E" roundel, the blue triangle: boxes, px; their non-red pixels off
CREST = (606, 646, 646, 692)        # the crest under the triangle: its non-red pixels off; the badge's place
# the parts' boxes, the left side's (the right is the mirror); the kind of pixel each takes
WING = (195, 268, 372, 386)         # the rear wing's left half past the roof, its endplate
WIND = (250, 288, 1002, 498)        # the windscreen, the banner over it, what is seen through it, the side glass
MIRROR = (92, 418, 262, 522)        # the door mirror, its head and its arm
HEAD = (118, 530, 312, 722)         # the headlight
VENTS = (372, 492, 880, 702)        # the bonnet's cup, its two nostrils, the black triangle, the two oval vents
LOWER = 742                         # below it: the intakes, the ducts, the grille, the splitter, the canards — dark or neon
BANNER = (352, 296, 900, 352)
OMP = (340, 778, 412, 836)          # the tow strap on the bumper's left, red with its black buckle: the car's own, one side only; no part, its tones the picture's       # the PORSCHE banner's letters, light on the dark strip


def mirror(a):
    return _mirror(a, AXIS)


def sym(m, soft=1.2):
    f = ndi.gaussian_filter(m.astype(np.float32), soft)
    return (f + mirror(f)) / 2 > 0.5


def both(box):
    """a box and its mirror's, as one mask's maker: the left box's region, then the mirror box's"""
    x0, y0, x1, y1 = box
    return [box, (int(2 * AXIS - x1), y0, int(2 * AXIS - x0) + 1, y1)]


def load():
    im = np.asarray(Image.open(PHOTO).convert('RGB'), dtype=np.float32) / 255.0
    h, w, _ = im.shape
    lab0 = to_lab(srgb2lin(im * 255).astype(np.float32))
    L0, A0, B0 = lab0[..., 0], lab0[..., 1], lab0[..., 2]
    red0 = (A0 > 25) & (np.degrees(np.arctan2(B0, A0)) > -15) & (np.degrees(np.arctan2(B0, A0)) < 65)
    hole = np.zeros((h, w), bool)
    for x0, y0, x1, y1 in STICKERS + [CREST]:
        hole[y0:y1, x0:x1] = ~red0[y0:y1, x0:x1]
    hole = ndi.binary_dilation(hole, iterations=3)
    im = inpaint(im, hole)
    lab = to_lab(srgb2lin(im * 255).astype(np.float32))
    L, A, B = lab[..., 0], lab[..., 1], lab[..., 2]
    C = np.hypot(A, B)
    hue = np.degrees(np.arctan2(B, A))
    rows = np.arange(h)[:, None]
    # the car: what is not the white ground joined to the picture's edge; from the splitter's wooden edge down the floor's shadow, not the car
    white = (im.min(axis=2) > 0.93) & (im.max(axis=2) - im.min(axis=2) < 0.05)
    lb, n = ndi.label(white)
    edge = set(np.unique(np.r_[lb[0], lb[-1], lb[:, 0], lb[:, -1]])) - {0}
    ground = np.isin(lb, list(edge))
    car = ~ground
    wood = (im[..., 0] > 0.55) & (im[..., 0] - im[..., 2] > 0.2) & (im[..., 1] > 0.4) & (rows > 985) & (rows < 1045)
    bottom = np.full(w, -1)
    for x in range(w):                                          # the wood itself, 1.4 mm, under the brush: the car ends on the carbon over it (its pills of tan, the first try)
        r = np.flatnonzero(wood[:, x])
        if len(r):
            bottom[x] = r.min() - 1
    have = np.flatnonzero(bottom >= 0)
    xs = np.arange(w)
    floor = np.interp(xs, have, bottom[have]).astype(int)     # past the wood's ends, its nearest end's row
    car &= rows <= floor[None, :]
    car = largest(ndi.binary_opening(car, iterations=1))
    mask = sym(car, 1.4)
    neon = mask & (C > 40) & (hue > 85) & (hue < 120) & (L > 35)          # the fluorescent lemon, lit or in shade
    red = mask & (A > 18) & (hue > -15) & (hue < 65)
    dark = mask & ~red & ~neon & (L < 48)
    nonred = mask & ~red & ~neon
    Y, X = np.mgrid[0:h, 0:w]

    def part(kind, box, k=1, close=2):
        out = np.zeros((h, w), bool)
        for b in both(box):
            r = boxed(kind, b)
            if close:
                r = ndi.binary_closing(r, iterations=close)
            out |= largest(ndi.binary_fill_holes(r), k)
        return sym(out | (mirror(out) > 0.5), 1.0) & mask

    P = {}
    P['wing'] = part(dark, WING)
    r = ndi.binary_closing(boxed(nonred & ~ndi.binary_dilation(P['wing'], iterations=2), WIND), iterations=2)
    wl = largest(ndi.binary_fill_holes(r), 3)
    P['wind'] = sym(wl | (mirror(wl) > 0.5), 1.0) & mask
    P['mirrors'] = part(dark, MIRROR, close=3)
    P['heads'] = part(nonred, HEAD, close=3)
    v = np.zeros((h, w), bool)
    r = ndi.binary_closing(boxed(dark, VENTS), iterations=2)
    lv, nv = ndi.label(ndi.binary_fill_holes(r))
    sz = ndi.sum(np.ones_like(lv), lv, range(1, nv + 1))
    v = np.isin(lv, np.flatnonzero(sz >= 120) + 1)
    P['vents'] = sym(v | (mirror(v) > 0.5), 1.0) & mask
    P['neon'] = sym(ndi.binary_closing(neon, iterations=2), 1.0) & mask
    omp = np.zeros((h, w), bool)
    for x0, y0, x1, y1 in both(OMP):
        omp[y0:y1, x0:x1] = True
    low = ndi.binary_closing(dark & (rows >= LOWER) & ~omp, iterations=2)
    lw, nw = ndi.label(ndi.binary_fill_holes(low))
    sz = ndi.sum(np.ones_like(lw), lw, range(1, nw + 1))
    low = np.isin(lw, np.flatnonzero(sz >= 150) + 1)
    P['lower'] = sym(low | (mirror(low) > 0.5), 1.0) & mask & ~P['neon']
    taken = np.zeros((h, w), bool)
    for k in ['neon', 'heads', 'wing', 'wind', 'mirrors', 'vents', 'lower']:     # the first takes a pixel two claim
        P[k] &= ~taken
        taken |= P[k]
    # the PORSCHE banner's letters: light, neutral, in the banner's box, inside the windscreen
    bx0, by0, bx1, by1 = BANNER
    letters = np.zeros((h, w), bool)
    letters[by0:by1, bx0:bx1] = ((L > 62) & (C < 18))[by0:by1, bx0:bx1]
    letters &= P['wind']
    # the banner's strip, black, the letters in it: read sharp, not as the glass under it
    strip = np.zeros((h, w), bool)
    strip[by0:by1, bx0:bx1] = ((L < 40) | letters)[by0:by1, bx0:bx1]
    strip = ndi.binary_opening(ndi.binary_closing(strip & P['wind'], iterations=2), iterations=1)
    strip = sym(strip | (mirror(strip) > 0.5), 1.0) & P['wind']
    # the body's seams and creases, the picture's own thin dark lines on the red (redgeo.py's kind of seam pixel), the bonnet's outline, its bulge, the wings', the
    # bumper's edge: pieces of 40 px at least, made symmetric (a line on one side within a pixel or two of its mirror's stays, a reflection on one side alone goes)
    body = mask & ~taken
    seam = (ndi.grey_closing(L, size=(7, 7)) - L > 5) & (C > 10) & ndi.binary_erosion(body, iterations=3)
    ls, ns = ndi.label(seam, structure=np.ones((3, 3)))
    sz = ndi.sum(seam, ls, range(1, ns + 1))
    seam = np.isin(ls, np.flatnonzero(sz >= 40) + 1)
    f = ndi.gaussian_filter(ndi.binary_dilation(seam, iterations=1).astype(np.float32), 1.0)
    seams = ((f + mirror(f)) / 2 > 0.3) & body
    # the body's panels, cut by the seams: a seam's pixel the nearest panel's
    pl, npl = ndi.label(body & ~seams)
    near = ndi.distance_transform_edt(pl == 0, return_distances=False, return_indices=True)
    panels = np.where(body, pl[near[0], near[1]], 0)
    return dict(im=im, lab=lab, mask=mask, parts=P, letters=letters, strip=strip, red=red, neon=neon, seams=seams, panels=panels, h=h, w=w, floor=floor)


if __name__ == '__main__':
    import sys
    g = load()
    ys, xs = np.where(g['mask'])
    print('mask x', xs.min(), xs.max(), 'y', ys.min(), ys.max(), 'middle', (xs.min() + xs.max() + 1) / 2)
    ov = (g['im'] * 255).astype(np.uint8).copy()
    col = dict(wing=(0, 255, 0), wind=(0, 200, 255), mirrors=(0, 0, 255), heads=(0, 255, 255), vents=(255, 0, 255), neon=(255, 128, 0), lower=(128, 0, 255))
    for k, m in g['parts'].items():
        e = m & ~ndi.binary_erosion(m, iterations=2)
        ov[e] = col[k]
        ys, xs = np.where(m)
        print(f'{k:8s} x {xs.min() if len(xs) else -1} … {xs.max() if len(xs) else -1}  y {ys.min() if len(ys) else -1} … {ys.max() if len(ys) else -1}  px {m.sum()}')
    e = g['mask'] & ~ndi.binary_erosion(g['mask'], iterations=2)
    ov[e] = (0, 0, 0)
    ov[g['letters']] = (255, 0, 0)
    print('letters px', g['letters'].sum())
    Image.fromarray(ov).save(sys.argv[1] if len(sys.argv) > 1 else 'race_parts.png')
