import sys, numpy as np
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
from brushsim import srgb2lin, lin2srgb
from distance_core import at_distance
import cargeo
fn = sys.argv[1]
out_fn = sys.argv[2] if len(sys.argv) > 2 else 'farcar.jpg'
im = Image.open(fn)
small = im.resize((1400, 2000), Image.BOX)
lin = srgb2lin(np.asarray(small, np.float32)).astype(np.float32)
panels = [lin2srgb(at_distance(lin, 2, d)) for d in (3, 6)]
g = cargeo.load()
ys, xs = np.where(g['mask'])
s = 850.0 / (ys.max() - ys.min()) * 2
cut = np.ones_like(g['im']) * np.array([243, 240, 230], np.float32) / 255
cut[g['mask']] = g['im'][g['mask']]
ph = Image.fromarray((cut * 255).astype(np.uint8))
ph = ph.resize((int(ph.width * s), int(ph.height * s)), Image.LANCZOS)
canvas = Image.new('RGB', (1400, 2000), (243, 240, 230))
canvas.paste(ph, (700 - int(cargeo.AXIS * s), 1000 - int((ys.min() + ys.max()) / 2 * s)))
out = Image.new('RGB', (1400 * 3 + 80, 2000), (205, 205, 205))
out.paste(canvas, (0, 0))
x = 1440
for p in panels:
    out.paste(Image.fromarray((p * 255).astype(np.uint8)), (x, 0)); x += 1440
out.thumbnail((2000, 2000)); out.save(out_fn, quality=90)
