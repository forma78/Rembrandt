#!/usr/bin/env python3
"""FORM-G: the classic red 911's headlight, a detail, on 60 × 80 — GEN-F's first approved sketch (the owner, 2026-11-16: "I suddenly approved 60 × 80,
Classic Red Porsche Headlight Detail · GEN-F · 60x80 · 14.json; the file is with you, Classic Red Porsche Headlight Detail.png in the GEN-F folder").

racecark.py's RaceFaceK — hyper2.py's columns against the picture, the miss carried to the next, the brush model, Kuzya's B (no hue apart on the red paint)
and C (a cut cheap where the form turns) — with no geometry by hand: a detail, the whole picture painted, no ground; its size and place GEN-F's sketch's,
540 × 720 mm, 30 mm in from the left edge, 40 down from the top. The carry kept within the red paint or within the metal and the glass (self.key), so a
chrome's light does not run on into the paint. No gloss, no volume added: the red classic's own way (redcark.py), its body's shadows a deep red (tone_map).

The jars: GEN-F's 14, each the owner's own numbered jar of the red classic (his shelf, porsche-red-k.json) where that jar's dried leg lies within NEAR of
the sketch's colour, else a new jar made to measure (hyper2's invert), "New 1" … — no number of his given to a paint he has not mixed (the jars are
physical). Kept in porsche-headlight.jars.json once made.

  python headlight.py 6 2 porsche-headlight.jpg
  python export_formg.py porsche-headlight porsche-headlight.jpg.pkl"""
import os, json
import numpy as np
from scipy import ndimage as ndi
from PIL import Image
import hyper2 as H
from hyper2 import lab2lin, jar, invert, leg_colour
from brushsim import srgb2lin
from distance_core import to_lab
from watchplan import PITCH, MARGIN
from redcar import main
from racecark import RaceFaceK

HERE = os.path.dirname(os.path.abspath(__file__))
GENF = os.path.join(HERE, '..', '..', 'GEN-F')
SKETCH = os.path.join(GENF, 'Classic Red Porsche Headlight Detail · GEN-F · 60x80 · 14.json')
SHELF = os.path.join(HERE, '..', '..', 'app', 'formg', 'porsche-red-k.json')


class Headlight(RaceFaceK):
    FIXED = []
    KEEP = 'porsche-headlight.jars.json'
    W, H = 600, 800
    NEAR = 8.0                  # a jar of his within so much of the sketch's colour, dried (CIELAB ΔE), is that colour's jar (est.)
    RED = (18.0, -25.0, 65.0)   # the red paint: chroma at least, its hue from, to (°), the lens's orange-red with it (est.)
    VOLUME, GLOSS = 0.0, 0.0    # the classic's way: no gloss (redcark.py)
    BADGE, AMBER_MM = None, None

    def __init__(self):
        self.sk = json.load(open(SKETCH))
        self.N = int((self.W - 2 * MARGIN) / PITCH)
        self.x0 = (self.W - self.N * PITCH) / 2
        self.R = int(self.H - 2 * MARGIN)
        self.xs = self.x0 + PITCH * (np.arange(self.N) + 0.5)
        self.ys = MARGIN + np.arange(self.R) + 0.5
        H.FIXED = self.FIXED
        src = np.asarray(Image.open(os.path.join(GENF, self.sk['image']['name'])).convert('RGB')).astype(np.float32) / 255
        bx, by, bw, bh = self.sk['image']['box']
        self.s = self.sk['picture_mm'][0] / bw                                   # mm a px
        X, Y = np.meshgrid(self.xs, self.ys)
        self.px = bx + (X - self.sk['left']) / self.s - 0.5
        self.py = by + (Y - self.sk['top']) / self.s - 0.5
        self.inside = (self.px >= bx - 0.5) & (self.px <= bx + bw - 0.5) & (self.py >= by - 0.5) & (self.py <= by + bh - 0.5)
        self.forms = [dict(name='body', idle=True, dose=1.0), dict(name='dark', idle=False, dose=1.3)]
        self.srcLab = to_lab(srgb2lin(src * 255).astype(np.float32))
        self.srcL = ndi.gaussian_filter(self.srcLab[..., 0], 1.5)
        smooth = np.stack([H.guided(src[..., k], 5, 0.03 ** 2) for k in range(3)], axis=-1)
        self.photo = srgb2lin(np.clip(smooth, 0, 1) * 255).astype(np.float32)
        self.target0 = self.make_target()
        self.target = self.target0.copy()

    def make_target(self):
        m = self.inside
        self.mask = m
        # the red paint, read off the picture over ~3 mm: the rest is metal, glass, rubber, the dark
        a, b = self.srcLab[..., 1], self.srcLab[..., 2]
        h = np.degrees(np.arctan2(b, a))
        red = (np.hypot(a, b) > self.RED[0]) & (h > self.RED[1]) & (h < self.RED[2])
        red = ndi.gaussian_filter(red.astype(np.float32), 3.0 / self.s)
        self.body = m & (self.at(red, order=1) > 0.5)
        self.parts = {}
        self.key = np.where(m, np.where(self.body, 1, 2), -1)                   # the carry's gate: the paint, or the rest
        self.cut = np.where(m, 0, -1)                                            # no cut by hand: the columns' programme finds the edges
        T = np.zeros((self.R, self.N, 3), np.float32)
        for c in range(3):
            sharp = self.samp(self.photo[..., c], (0.9, 1.4))
            wide = self.samp(self.photo[..., c], (7.0, 7.0))
            T[..., c] = sharp + 0.30 * (sharp - wide)
        T = np.clip(T, 0, 1)
        lab = to_lab(T)
        Ln, An, Bn = self.tone_map(lab[..., 0], lab[..., 1], lab[..., 2])
        T = lab2lin(np.stack([Ln, An, Bn], -1)).astype(np.float32)
        self.lock = -np.ones((self.R, self.N), np.int16)
        T = self.glossy(T)
        Lb = to_lab(T)[..., 0]
        w = self.body.astype(np.float32)
        sm = ndi.gaussian_filter1d(Lb * w, self.SLOPE_MM, axis=0) / np.maximum(ndi.gaussian_filter1d(w, self.SLOPE_MM, axis=0), 1e-3)
        self.slope = np.where(self.body, np.abs(np.gradient(sm, axis=0)), 0.0)
        return T

    def make_jars(self):
        """GEN-F's colours: first the jar that comes nearest each on canvas (hyper2's invert — a deep red the brush cannot dry as dark as the picture is the
        deepest it can); then his own jar whose dried leg is within NEAR of that one's, matched nearest pair first over all of them, so no colour takes another's
        jar; the rest new, made to measure"""
        dried = lambda p: to_lab(leg_colour(p, 40.0).astype(np.float32)[None])[0]
        own = []
        for q in json.load(open(SHELF))['jars']:
            p = jar(q['hex'], q['coats'], q['name'])
            p.name = q['name']
            own.append((p, dried(p)))
        want = []
        for q in self.sk['jars']:
            t = srgb2lin(tuple(int(q['hex'][i:i + 2], 16) for i in (1, 3, 5))).astype(np.float32)
            p, e = invert(t)
            want.append((q, p, e, dried(p)))
        pairs = sorted((float(np.sqrt(((w[3] - d) ** 2).sum())), i, k) for i, w in enumerate(want) for k, (_, d) in enumerate(own))
        got, taken = {}, set()
        for d, i, k in pairs:
            if d <= self.NEAR and i not in got and k not in taken:
                got[i] = (k, d)
                taken.add(k)
        out, new = [], 0
        for i, (q, p, e, _) in enumerate(want):
            if i in got:
                k, d = got[i]
                print(f"{q['name']} {q['hex']} → {own[k][0].name} {own[k][0].hex} ×{own[k][0].coats}, dried ΔE {d:.1f} from the jar made for it (that one {e:.1f} off the colour)", flush=True)
                out.append(own[k][0])
            else:
                new += 1
                p.name = f'New {new}'
                print(f"{q['name']} {q['hex']} → New {new} {p.hex} ×{p.coats}, made to measure, {e:.1f} off the colour", flush=True)
                out.append(p)
        return out

    def prune(self):
        """the 14 the owner approved stay: none taken out, none merged"""
        return 0

    def locks(self):
        pass

    def touch(self):
        return self


if __name__ == '__main__':
    main(Headlight, 'porsche-headlight.jpg')
