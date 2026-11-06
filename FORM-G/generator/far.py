import sys, numpy as np
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
from brushsim import srgb2lin, lin2srgb
from distance_core import at_distance
import clean_photo
fn, ppm = sys.argv[1], int(sys.argv[2])
im = Image.open(fn)
k = ppm // 2 if ppm > 2 else 1
small = im.resize((1200, 1600), Image.BOX)
lin = srgb2lin(np.asarray(small, np.float32)).astype(np.float32)
panels = [lin2srgb(at_distance(lin, 2, d)) for d in (3, 6)]
s = 0.385 * 2  # px per photo px at 2 px/mm
ph = Image.fromarray((clean_photo.clean() * 255).astype(np.uint8))
pw, phh = int(ph.width * s), int(ph.height * s)
ph = ph.resize((pw, phh), Image.LANCZOS)
canvas = Image.new('RGB', (1200, 1600), (243, 240, 230))
canvas.paste(ph, (600 - int(823 * s), 800 - int(1018 * s)))
out = Image.new('RGB', (1200 * 3 + 80, 1600), (205, 205, 205))
out.paste(canvas, (0, 0))
x = 1240
for p in panels:
    out.paste(Image.fromarray((p * 255).astype(np.uint8)), (x, 0)); x += 1240
out.thumbnail((2000, 2000)); out.save('far.jpg', quality=90)
