#!/usr/bin/env python3
"""The G-wagon off OPM-G/g-wagon.JPG (the owner, 2026-11-07: "start with g-wagon.JPG, on a 60 x 60 canvas"): a front view on white, 624 x 608 px.
Cut from its white ground; the ground's shadow under it left out, the tyres kept. The badges taken off, as the Porsche's and the watch's: the star on the
bonnet and the one on the grille, the model's plate. The grille is laid again by geometry, its slats on the grid (gwagon.py), so the star leaves no hole."""
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

PHOTO = '/Users/fiodorsumkin/Rembrandt/OPM-G/g-wagon.JPG'
AXIS = 313.5            # px: the car's middle, between the headlights' centres and the grille's frame
# badges (x0, y0, x1, y1), photo px: the star on the bonnet, the model's plate on the grille; the grille's own star goes with the grille
BOXES = [(305, 240, 323, 253), (398, 326, 422, 337)]
GRILLE = (192, 282, 437, 352)          # its frame, outside
LAMPS = [(145.0, 315.0), (482.0, 315.0)]  # the headlights' centres
LAMP_R = 25.5                            # their chrome ring, outer radius, px (est., off the photo)
BAR = (350, 462)                         # the bull bar's rows, px
UPRIGHTS = [(181, 202), (426, 447)]      # its two uprights' columns, px
FLOOR = 466                              # below this only the tyres: the rest is the ground's shadow


def clean(im):
    im = im.copy()
    for x0, y0, x1, y1 in BOXES:
        left = im[y0:y1, x0 - 3:x0].mean(axis=1)
        right = im[y0:y1, x1:x1 + 3].mean(axis=1)
        u = np.linspace(0, 1, x1 - x0)[None, :, None]
        im[y0:y1, x0:x1] = left[:, None, :] * (1 - u) + right[:, None, :] * u
    return im


def load():
    im = np.asarray(Image.open(PHOTO).convert('RGB'), dtype=np.float32) / 255.0
    h, w, _ = im.shape
    off = np.abs(im - 1.0).max(axis=2) > 0.07
    Y, X = np.mgrid[0:h, 0:w]
    lum = im @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    # below the bull bar and its skid plate only the tyres, dark rubber: the floor between and under them is shadow
    tyres = (Y >= FLOOR) & (lum < 0.30) & ((np.abs(X - AXIS) > 150))
    mask = off & ((Y < FLOOR) | tyres)
    mask = ndi.binary_opening(mask, iterations=1)
    lab, n = ndi.label(mask)
    if n > 1:
        sizes = ndi.sum(mask, lab, range(1, n + 1))
        mask = np.isin(lab, 1 + np.flatnonzero(sizes > 400))
    mask = ndi.binary_fill_holes(ndi.gaussian_filter(mask.astype(np.float32), 1.2) > 0.5)
    return dict(im=clean(im), raw=im, mask=mask, h=h, w=w)


if __name__ == '__main__':
    g = load()
    ys, xs = np.where(g['mask'])
    print('mask bbox x', xs.min(), xs.max(), 'y', ys.min(), ys.max(), 'area', g['mask'].sum())
    cut = np.ones_like(g['im'])
    cut[g['mask']] = g['im'][g['mask']]
    e = ndi.binary_dilation(g['mask'], iterations=1) & ~g['mask']
    ov = g['im'].copy()
    ov[e] = (1, 0, 1)
    Image.fromarray((np.concatenate([ov, cut], axis=1) * 255).astype(np.uint8)).save('gwagon_mask.png')
