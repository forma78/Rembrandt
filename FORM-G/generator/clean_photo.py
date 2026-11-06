#!/usr/bin/env python3
"""The photo with every printed word taken off the dial, row by row, so the dial's horizontal ribs go on through the place. Nothing else is touched."""
import numpy as np
from PIL import Image
import watchgeo as G

# boxes in the photo's pixels, read off the overlay: x0, y0, x1, y1
BOXES = [(680, 712, 948, 770), (748, 760, 872, 804), (718, 1062, 902, 1110), (768, 1238, 862, 1274)]


def clean():
    im = np.asarray(Image.open(G.PHOTO).convert('RGB'), dtype=np.float32) / 255.0
    im = im.copy()
    for x0, y0, x1, y1 in BOXES:
        left = im[y0:y1, x0 - 6:x0].mean(axis=1)
        right = im[y0:y1, x1:x1 + 6].mean(axis=1)
        u = np.linspace(0, 1, x1 - x0)[None, :, None]
        im[y0:y1, x0:x1] = left[:, None, :] * (1 - u) + right[:, None, :] * u
    return im


if __name__ == '__main__':
    im = clean()
    Image.fromarray((im[480:1320, 400:1240] * 255).astype(np.uint8)).save('clean_dial.png')
