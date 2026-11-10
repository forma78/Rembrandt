#!/usr/bin/env python3
"""FORM-G: the white 911 in the red one's form (the owner, 2026-11-08: "the white must be built at 0.46: the red is the canon"); its tones off the picture he and Kuzya
made, `FORM-G/White Vintage Porsche 911, Saddle-Tan Interior.png` (asked which white: "the new, saddle-tan"), within 0.5 % of the canon along the car, the canon made
4 % wider to it. The first try took the Singer-style picture, its proportions squeezed (0.53), for its wheel and brown seats.

redcar.py's RedCar, all of its geometry — the outline, every part, seam and lock in its place — and the tones taken from the white picture, laid onto the canon:
along the car by the landmarks both pictures have (the front, the windscreen, the rear window, the louvres, the carbon, the tips), across every row by the two
outlines' half widths at it; inside the glass and the louvres by their own boxes, so that the wheel and the brown seats fall inside the canon's windscreen.
A white car's own jars: the seams, the bonnet's shadow and the wings' line greys, its shadows neutral."""
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
import redgeo
import redcar
from redcar import RedCar

WPHOTO = '/Users/fiodorsumkin/Rembrandt/FORM-G/White Vintage Porsche 911, Saddle-Tan Interior.png'
# along the car, the canon's rows (the red picture's px) to the white picture's: the front, the windscreen's top and foot, the rear window's, the louvres', the carbon's, the tips
YMAP = [(57, 47), (541, 503), (772, 720), (1108, 1022), (1346, 1251), (1372, 1275), (1487, 1382), (1564, 1454), (1595, 1483), (1602, 1490)]
# the glass and the louvres by their own boxes, the canon's to the white's (x0, y0, x1, y1); the side windows the left one's, the right its mirror
BOXES = {'wind': ((212, 541, 719, 772), (265, 503, 758, 720)), 'rear': ((276, 1108, 655, 1346), (327, 1022, 695, 1251)),
         'grille': ((301, 1372, 630, 1487), (352, 1275, 667, 1382))}
WSIDE = (255, 630, 302, 1118)
# off the white picture as off the red: the crest, the fuel cap, the wiper over the white scuttle (the glass's black frame under it stays)
WCREST, WCAP, WWIPER = (494, 110, 525, 142), (511.0, 337.5, 31.0), [(434, 528), (470, 516), (512, 505)]
WHITE_FIXED = [('chrome', '#E6E5DF', 1), ('chromeM', '#C6C6C1', 1), ('chromeD', '#9B9C9A', 1), ('ink', '#0C0C0C', 2), ('carbon', '#2B2B2C', 1), ('tail', '#E5281E', 1),
               ('amber', '#EE8A22', 1), ('seam', '#7E7E7A', 1), ('glass', '#4B4D4E', 1)]


def outline(mask):
    """every row's left and right edge of a car's mask, -1 where none"""
    on = mask.any(axis=1)
    left = np.where(on, mask.argmax(axis=1), -1)
    right = np.where(on, mask.shape[1] - 1 - mask[:, ::-1].argmax(axis=1), -1)
    return left.astype(np.float32), right.astype(np.float32)


class WhiteCar(RedCar):
    FIXED = WHITE_FIXED
    SEAM, SHADOW, WING = 'seam', ('chromeM', 'chromeD'), 'chromeM'
    KEEP = 'porsche-white.jars.json'
    AMBER_MM, BADGE = None, None    # the red's marks of 2026-11-10 (redcar.py) not the white's: it stays as it was

    def source(self, g):
        wim = np.asarray(Image.open(WPHOTO).convert('RGB'), dtype=np.float32) / 255.0
        hw, ww, _ = wim.shape
        hole = np.zeros((hw, ww), bool)
        x0, y0, x1, y1 = WCREST
        hole[y0:y1, x0:x1] = True
        hole |= redgeo.line_mask((hw, ww), [WCAP[:2], (WCAP[0], WCAP[1] + 0.01)], WCAP[2])
        bright = ndi.median_filter(wim.mean(axis=2), 11) > 0.6
        hole |= redgeo.line_mask((hw, ww), WWIPER, 4.0) & bright | redgeo.line_mask((hw, ww), [WWIPER[-1], (WWIPER[-1][0], WWIPER[-1][1] + 0.01)], 9.0)
        wim = redgeo.inpaint(wim, hole)
        h, w = g['h'], g['w']
        wcar = ndi.binary_fill_holes(np.sqrt(((1 - wim) ** 2).sum(axis=2)) > 0.05)
        wl, wr = outline(wcar)
        rl, rr = outline(g['mask'])
        Y, X = np.mgrid[0:h, 0:w].astype(np.float32)
        ry, wy = np.array([q[0] for q in YMAP], np.float32), np.array([q[1] for q in YMAP], np.float32)
        y2 = np.interp(Y, ry, wy)
        # across: the canon's half width at its row to the white's at the row it maps to, each about its own middle
        rows = np.arange(h)
        rhalf = np.where(rr >= 0, (rr - rl) / 2, 1)
        rmid = np.where(rr >= 0, (rr + rl) / 2, redgeo.AXIS)
        wrow = np.clip(np.round(np.interp(rows, ry, wy)).astype(int), 0, hw - 1)
        whalf = ndi.median_filter(np.where(wr >= 0, (wr - wl) / 2, 1), 9)[wrow]
        wmid = ndi.median_filter(np.where(wr >= 0, (wr + wl) / 2, ww / 2), 9)[wrow]
        x2 = wmid[:, None] + (X - rmid[:, None]) * (whalf / np.maximum(rhalf, 1))[:, None]
        # the glass and the louvres by their boxes
        def box(m, a, b):
            (ax0, ay0, ax1, ay1), (bx0, by0, bx1, by1) = a, b
            x2[m] = bx0 + (X[m] - ax0) * (bx1 - bx0) / (ax1 - ax0)
            y2[m] = by0 + (Y[m] - ay0) * (by1 - by0) / (ay1 - ay0)
        P = g['parts']
        for k, (a, b) in BOXES.items():
            box(P[k], a, b)
        sides = P['sides']
        ys, xs = np.where(sides & (X < redgeo.AXIS))
        left = (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max()))
        box(sides & (X < redgeo.AXIS), left, WSIDE)
        wax = (BOXES['wind'][1][0] + BOXES['wind'][1][2]) / 2 + 0.0            # the white picture's own axis, its windscreen's middle
        right = (int(2 * redgeo.AXIS - left[2]), left[1], int(2 * redgeo.AXIS - left[0]), left[3])
        box(sides & (X >= redgeo.AXIS), right, (2 * wax - WSIDE[2], WSIDE[1], 2 * wax - WSIDE[0], WSIDE[3]))
        out = np.stack([ndi.map_coordinates(wim[..., k], [y2, x2], order=1, mode='nearest') for k in range(3)], axis=-1)
        self.warped = out
        return out

    def tone_map(self, L, A, B):
        """a white car's shadows neutral greys, its whites as they are; the glass and the leather as the red's"""
        Lo = np.interp(L, [0, 8, 20, 35, 50, 70, 100], [14, 18, 27, 37, 50, 70, 100])
        Lb = np.minimum(L, 97.0)
        return np.where(self.body, Lb, Lo), A, B


if __name__ == '__main__':
    redcar.main(WhiteCar, 'porsche-white.jpg')
