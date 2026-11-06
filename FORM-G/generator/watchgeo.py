#!/usr/bin/env python3
"""The watch off the photo: its silhouette, its dial, the steel's tone. The dial's furniture redrawn as geometry,
so no name, logo or printed word comes along: only what is drawn here exists."""
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

PHOTO = '/Users/fiodorsumkin/Rembrandt/OPM-G/Blue-Patek-Philippe-Nautilus-57111A018-Tiffany-170th-Anniversary.jpg'
K = 2048 / 2000     # the coordinates below were read off a 2000-high view


def P(x, y):
    return (x * K, y * K)


# the batons: from, to, width; all in the photo's pixels
BATONS = [
    (P(773, 552), P(773, 645), 22 * K),   # 12, the double
    (P(806, 552), P(806, 645), 22 * K),
    (P(967, 577), P(925, 663), 26 * K),   # 1
    (P(1092, 705), P(1012, 757), 30 * K),  # 2
    (P(1012, 1005), P(1092, 1055), 30 * K),  # 4
    (P(918, 1098), P(973, 1182), 26 * K),  # 5
    (P(792, 1115), P(792, 1215), 24 * K),  # 6
    (P(678, 1095), P(610, 1182), 26 * K),  # 7
    (P(580, 1008), P(490, 1060), 30 * K),  # 8
    (P(458, 880), P(558, 880), 28 * K),    # 9
    (P(490, 702), P(580, 755), 30 * K),    # 10
    (P(602, 577), P(665, 665), 26 * K),    # 11
]
HANDS = [
    (P(752, 852), P(622, 762), 30 * K),    # the hour hand
    (P(832, 850), P(1048, 690), 30 * K),   # the minute hand
]
PIVOT = (P(790, 875), 26 * K)
SECOND = (P(793, 752), P(793, 1115))       # one straight line: a single column, the brush's own
DATE = (P(1050, 843), P(1133, 912))        # the window, no digits
CENTRE = P(795, 880)


def load():
    im = np.asarray(Image.open(PHOTO).convert('RGB'), dtype=np.float32) / 255.0
    h, w, _ = im.shape
    # the white of the sheet, grown from the border
    near_white = im.min(axis=2) > 0.955
    lab, n = ndi.label(near_white)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, border[border > 0])
    watch = ~bg
    watch = ndi.binary_opening(watch, iterations=2)
    lab, n = ndi.label(watch)
    sizes = ndi.sum(watch, lab, range(1, n + 1))
    watch = lab == (1 + int(np.argmax(sizes)))
    watch = ndi.binary_fill_holes(watch)
    # the dial: where it is teal
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    teal = (g - r > 0.16) & (b - r > 0.14)
    teal = ndi.binary_closing(teal, iterations=14)
    lab, n = ndi.label(teal)
    sizes = ndi.sum(teal, lab, range(1, n + 1))
    dial = lab == (1 + int(np.argmax(sizes)))
    dial = ndi.binary_fill_holes(dial)
    dial = ndi.gaussian_filter(dial.astype(np.float32), 6) > 0.5
    L = 0.2126 * r + 0.7152 * g + 0.0722 * b
    return dict(im=im, watch=watch, dial=dial, L=L, w=w, h=h)


def seg_dist(X, Y, a, b):
    ax, ay = a
    bx, by = b
    vx, vy = bx - ax, by - ay
    v2 = vx * vx + vy * vy + 1e-9
    u = np.clip(((X - ax) * vx + (Y - ay) * vy) / v2, 0, 1)
    return np.hypot(X - (ax + u * vx), Y - (ay + u * vy))


if __name__ == '__main__':
    g = load()
    print('watch px', g['watch'].sum(), 'dial px', g['dial'].sum())
    ys, xs = np.where(g['watch'])
    print('watch bbox', xs.min(), xs.max(), ys.min(), ys.max())
    ys, xs = np.where(g['dial'])
    print('dial bbox', xs.min(), xs.max(), ys.min(), ys.max())
    ov = g['im'].copy()
    Y, X = np.mgrid[0:g['h'], 0:g['w']].astype(np.float32)
    e = ndi.binary_dilation(g['watch'], iterations=2) & ~g['watch']
    ov[e] = (1, 0, 1)
    e = ndi.binary_dilation(g['dial'], iterations=2) & ~g['dial']
    ov[e] = (1, 0.5, 0)
    for a, b, w_ in BATONS + HANDS:
        d = seg_dist(X, Y, a, b)
        ov[np.abs(d - w_ / 2) < 1.5] = (1, 0, 0)
    d = seg_dist(X, Y, SECOND[0], SECOND[1])
    ov[d < 1.5] = (1, 0, 0)
    d = np.hypot(X - PIVOT[0][0], Y - PIVOT[0][1])
    ov[np.abs(d - PIVOT[1]) < 1.5] = (1, 0, 0)
    (x0, y0), (x1, y1) = DATE
    box = (X >= x0) & (X <= x1) & (Y >= y0) & (Y <= y1)
    ov[box & ~ndi.binary_erosion(box, iterations=2)] = (1, 0, 0)
    Image.fromarray((ov * 255).astype(np.uint8)).crop((200, 400, 1500, 1400)).save('overlay.png')
