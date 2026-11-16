#!/usr/bin/env python3
"""The old generator's renders on white gesso (the owner, 2026-11-16: "why is our ground cream on FORM-G? I take a canvas, the gesso there is white").
brushsim.py laid them on a cream ground, (243, 240, 230), its weave in it; the bare canvas alone — a pixel the ground's own colour, its weave's light and
shade but no paint in it (its three channels in the ground's proportions within SPREAD, its light within LIGHT) — goes to the white, (251, 250, 247), the same
weave; paint, a film over the ground included, is left as it was. Renders that cannot be made again (the classic's v.2 was touched by hand) keep their paint
to the pixel.

  python whiten.py <jpg> …"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

CREAM, WHITE = np.array([243, 240, 230], np.float32), np.array([251, 250, 247], np.float32)
SPREAD, LIGHT = 0.015, (0.88, 1.08)

for path in sys.argv[1:]:
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    r = a / CREAM
    k, spread = r.mean(-1), r.max(-1) - r.min(-1)
    bare = ndi.binary_opening((spread < SPREAD) & (k > LIGHT[0]) & (k < LIGHT[1]), iterations=1)
    out = np.where(bare[..., None], np.clip(a * (WHITE / CREAM), 0, 255), a)
    Image.fromarray(np.round(out).astype(np.uint8)).save(path, quality=93, subsampling=0)
    print(path.split('/')[-1], f'{100 * bare.mean():.1f} % bare canvas made white')
