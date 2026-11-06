#!/usr/bin/env python3
"""The car off porsche-911-1.jpg: cut from its background by the clean right side, mirrored for the left, which lies in shadow. The badges taken off, row by row."""
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from distance_core import to_lab
from brushsim import srgb2lin

PHOTO = '/Users/fiodorsumkin/Rembrandt/OPM-G/porsche-911-1.jpg'
AXIS = 371.0
# badges: the crest on the bonnet, the script on the tail, the crest on the steering wheel's hub
BOXES = [(356, 178, 390, 208), (326, 1258, 414, 1276), (258, 588, 292, 620)]


def clean(im):
    im = im.copy()
    for x0, y0, x1, y1 in BOXES:
        left = im[y0:y1, x0 - 4:x0].mean(axis=1)
        right = im[y0:y1, x1:x1 + 4].mean(axis=1)
        u = np.linspace(0, 1, x1 - x0)[None, :, None]
        im[y0:y1, x0:x1] = left[:, None, :] * (1 - u) + right[:, None, :] * u
    return im


def load():
    im = np.asarray(Image.open(PHOTO).convert('RGB'), dtype=np.float32) / 255.0
    h, w, _ = im.shape
    lab = to_lab(srgb2lin(im * 255).astype(np.float32))
    bg = np.median(lab[:, 655:690], axis=1, keepdims=True)
    dist = np.sqrt(((lab - bg) ** 2).sum(axis=2))
    right = dist > 13.0
    right[:, :int(AXIS)] = False
    right[:, 660:] = False
    right = ndi.binary_opening(right, iterations=1)
    # the outer edge, row by row: reflections of the ground cut dents in it, a dent is closed, a real bump (the mirror) stays
    rows = np.arange(h)
    edge = np.where(right.any(axis=1), w - 1 - np.argmax(right[:, ::-1], axis=1), int(AXIS))
    edge[(rows < 163) | (rows > 1322)] = int(AXIS)
    on = (rows >= 163) & (rows <= 1322)
    closed = edge.copy()
    mid = (rows >= 230) & (rows <= 1235)      # not at the car's two ends: there the closing would square the corners off
    closed[mid] = ndi.grey_closing(edge[mid], size=61)
    closed[on] = ndi.median_filter(closed[on], size=7)
    right = np.zeros((h, w), bool)
    for y in np.flatnonzero(on):
        right[y, int(AXIS):closed[y] + 1] = True
    # the mirror
    xs = np.arange(w)
    mx = np.clip(np.round(2 * AXIS - xs).astype(int), 0, w - 1)
    left = right[:, mx]
    mask = right | left
    # no shadow under the tail: below the bumper only the two posts and the exhaust
    Yp, Xp = np.mgrid[0:h, 0:w]
    tail = Yp > 1322
    posts = ((np.abs(Xp - 245) < 16) | (np.abs(Xp - 493) < 16)) & (Yp > 1290) & (Yp < 1340) & (dist > 18)
    exhaust = (np.abs(Xp - 267) < 12) & (Yp > 1300) & (Yp < 1358)
    mask = (mask & ~tail) | posts | exhaust
    mask = ndi.binary_fill_holes(ndi.gaussian_filter(mask.astype(np.float32), 2.6) > 0.5)
    return dict(im=clean(im), raw=im, mask=mask, h=h, w=w)


if __name__ == '__main__':
    g = load()
    ys, xs = np.where(g['mask'])
    print('mask bbox x', xs.min(), xs.max(), 'y', ys.min(), ys.max(), 'area', g['mask'].sum())
    ov = g['im'].copy()
    e = ndi.binary_dilation(g['mask'], iterations=1) & ~g['mask']
    ov[e] = (1, 0, 1)
    cut = np.ones_like(g['im']) * np.array([243, 240, 230], np.float32) / 255
    cut[g['mask']] = g['im'][g['mask']]
    out = np.concatenate([ov, cut], axis=1)
    Image.fromarray((out * 255).astype(np.uint8)).save('car_mask.png')
