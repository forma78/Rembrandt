"""The G-wagon's render beside the photo, and as the eye sees it from 3 and 6 m (distance_core's S-CIELAB blur, a model, not a measurement).
python farwagon.py <render.jpg> <out.jpg> [<cmid column's mm>]"""
import sys, numpy as np
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
from brushsim import srgb2lin, lin2srgb
from distance_core import at_distance
import gwagongeo as G
fn = sys.argv[1]
out_fn = sys.argv[2] if len(sys.argv) > 2 else 'farwagon.jpg'
mid = float(sys.argv[3]) if len(sys.argv) > 3 else 297.5
S = 1200                                   # px for the 600 mm canvas: 2 px/mm, as farcar.py
small = Image.open(fn).convert('RGB').resize((S, S), Image.BOX)
lin = srgb2lin(np.asarray(small, np.float32)).astype(np.float32)
panels = [lin2srgb(at_distance(lin, 2, d)) for d in (3, 6)]
g = G.load()
ys, xs = np.where(g['mask'])
s = 500.0 / (xs.max() - xs.min() + 1) * 2
cut = np.ones_like(g['im']) * np.array([243, 240, 230], np.float32) / 255
cut[g['mask']] = g['im'][g['mask']]
ph = Image.fromarray((cut * 255).astype(np.uint8))
ph = ph.resize((int(ph.width * s), int(ph.height * s)), Image.LANCZOS)
canvas = Image.new('RGB', (S, S), (243, 240, 230))
canvas.paste(ph, (int(mid * 2 - G.AXIS * s), int(S / 2 - (ys.min() + ys.max()) / 2 * s)))
out = Image.new('RGB', (S * 4 + 120, S), (205, 205, 205))
x = 0
for p in [np.asarray(canvas, np.float32) / 255, np.asarray(small, np.float32) / 255] + panels:
    out.paste(Image.fromarray((np.clip(p, 0, 1) * 255).astype(np.uint8)), (x, 0)); x += S + 40
out.thumbnail((2400, 2400)); out.save(out_fn, quality=90)
