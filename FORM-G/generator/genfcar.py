#!/usr/bin/env python3
"""FORM-G: a picture from a GEN-F sketch the owner approved, made final (the owner, 2026-11-16: "GEN-F is the creative workshop"; FORM-G the library of finished
works). headlight.py's way made general, for a picture on a plain ground:

  racecark.py's RaceFaceK — hyper2.py's columns against the picture, the miss carried to the next, the brush model, Kuzya's B and C, no gloss (the classic's) — on
  no geometry by hand: the picture's size, place and canvas the sketch's; its plain ground bare canvas (the ground the border reaches, as GEN-F's bareMask); the
  carry kept within the red paint or within the rest (self.key).
  The jars: the sketch's colours, each first made to measure (hyper2's invert), then the owner's own numbered jar of the red classic whose dried leg lies within
  NEAR of that one's, nearest pair first over all of them; the rest new, "New 1" … (the jars are physical).
  MIRROR: a car seen square on, the right half the left's mirror, column for column (the 911's canon: "the main thing is to make the geometry perfect").
  CREST: the maker's crest off the bonnet, its place painted as the paint round it, and a mark of two Black columns about the axis there (the owner, 2026-11-10:
  "no Porsche logo, but a mark one cannot read").

A picture: a subclass with its SKETCH (GEN-F/<…>.json), KEEP and the switches; its id in export_formg.py's GENF."""
import os, json
import numpy as np
from scipy import ndimage as ndi
from PIL import Image
import hyper2 as H
from hyper2 import lab2lin, jar, invert, leg_colour
from brushsim import srgb2lin
from distance_core import to_lab
from watchplan import PITCH, MARGIN
from racecark import RaceFaceK

HERE = os.path.dirname(os.path.abspath(__file__))
GENF = os.path.join(HERE, '..', '..', 'GEN-F')
SHELF = os.path.join(HERE, '..', '..', 'app', 'formg', 'porsche-red-k.json')      # the owner's numbered jars of the red classic, his shelf
FORMATS = {'60x60': (600, 600), '60x80': (600, 800), '70x100': (700, 1000), '90x120': (900, 1200), '100x150': (1000, 1500)}


class GenFCar(RaceFaceK):
    FIXED = []
    SKETCH = None               # the approved sketch, GEN-F's json
    KEEP = None
    NEAR = 8.0                  # a jar of his within so much of a sketch colour's own jar, dried (CIELAB ΔE), is that colour's jar (est.)
    GROUND_DE = 12.0            # the ground: its colour within so much, reached from the border (GEN-F's bareDE)
    RED = (18.0, -25.0, 65.0)   # the red paint: chroma at least, its hue from, to (°) (est.)
    VOLUME, GLOSS = 0.0, 0.0
    BADGE, AMBER_MM = None, None
    MIRROR = False
    CREST = False
    MIN_SKETCH = 0.1            # a sketch colour with less line than this, m, no jar of its own (hyper2's MIN_LINE)

    def __init__(self):
        path = self.SKETCH if os.path.isabs(self.SKETCH) else os.path.join(HERE, self.SKETCH)
        self.sk = json.load(open(path))
        self.W, self.H = FORMATS[self.sk['format']]
        self.N = int((self.W - 2 * MARGIN) / PITCH)
        self.x0 = (self.W - self.N * PITCH) / 2
        self.R = int(self.H - 2 * MARGIN)
        self.xs = self.x0 + PITCH * (np.arange(self.N) + 0.5)
        self.ys = MARGIN + np.arange(self.R) + 0.5
        H.FIXED = self.FIXED
        name = self.sk['image']['name']
        src_path = next(p for p in (os.path.join(GENF, name), os.path.join(HERE, '..', name)) if os.path.exists(p))
        src = np.asarray(Image.open(src_path).convert('RGB')).astype(np.float32) / 255
        bx, by, bw, bh = self.sk['image']['box']
        self.box = (bx, by, bw, bh)
        self.s = self.sk['picture_mm'][0] / bw                                   # mm a px
        self.axis = bx + bw / 2                                                  # the picture's axis, px: its box's middle
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

    def ground(self):
        """the plain ground, px: near the border's colour and reached from the border"""
        g = self.sk['image'].get('ground')
        if not g:
            return np.zeros(self.srcLab.shape[:2], bool)
        gl = to_lab(srgb2lin(tuple(int(g[i:i + 2], 16) for i in (1, 3, 5))).astype(np.float32)[None])[0]
        near = np.sqrt(((self.srcLab - gl) ** 2).sum(-1)) < self.GROUND_DE
        lab, n = ndi.label(near)
        edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
        return np.isin(lab, edge[edge > 0])

    def crest(self):
        """the crest's px: a gold blob near the axis in the front half (a* low, b* high, light enough), its largest piece, a little round it"""
        L, a, b = self.srcLab[..., 0], self.srcLab[..., 1], self.srcLab[..., 2]
        bx, by, bw, bh = self.box
        yy, xx = np.mgrid[0:L.shape[0], 0:L.shape[1]]
        gold = (b > 22) & (a < 28) & (L > 35) & (np.abs(xx - self.axis) < 0.12 * bw) & (yy < by + 0.45 * bh)
        lab, n = ndi.label(ndi.binary_closing(gold, iterations=2))
        if not n:
            return None
        k = 1 + int(np.argmax(ndi.sum(np.ones_like(L), lab, range(1, n + 1))))
        return ndi.binary_dilation(lab == k, iterations=3)

    def make_target(self):
        self.mask = self.inside & (self.at((~self.ground()).astype(np.float32), order=1) > 0.5)
        m = self.mask
        a, b = self.srcLab[..., 1], self.srcLab[..., 2]
        h = np.degrees(np.arctan2(b, a))
        red = (np.hypot(a, b) > self.RED[0]) & (h > self.RED[1]) & (h < self.RED[2])
        self.body = m & (self.at(ndi.gaussian_filter(red.astype(np.float32), 3.0 / self.s), order=1) > 0.5)
        self.parts = {}
        self.key = np.where(m, np.where(self.body, 1, 2), -1)                   # the carry's gate: the paint, or the rest
        self.cut = np.where(m, 0, -1)                                            # no cut by hand: the columns' programme finds the edges
        T = np.zeros((self.R, self.N, 3), np.float32)
        for c in range(3):
            sharp = self.samp(self.photo[..., c], (0.9, 1.4))
            wide = self.samp(self.photo[..., c], (7.0, 7.0))
            T[..., c] = sharp + 0.30 * (sharp - wide)
        T = np.clip(T, 0, 1)
        # the crest off: its cells the paint just behind it in the same column
        self.crestcells = None
        if self.CREST:
            cm = self.crest()
            if cm is not None:
                cc = self.mask & (self.at(cm.astype(np.float32), order=1) > 0.3)
                for c in np.flatnonzero(cc.any(axis=0)):
                    rows = np.flatnonzero(cc[:, c])
                    r1 = min(self.R - 1, rows.max() + 3)
                    T[rows, c] = T[r1, c]
                    self.body[rows, c] = self.body[r1, c] or self.body[rows, c].any()
                self.crestcells = cc
                print('crest off:', int(cc.sum()), 'cells, rows', int(np.flatnonzero(cc.any(axis=1)).min()), '…', int(np.flatnonzero(cc.any(axis=1)).max()), flush=True)
        lab = to_lab(T)
        Ln, An, Bn = self.tone_map(lab[..., 0], lab[..., 1], lab[..., 2])
        T = lab2lin(np.stack([Ln, An, Bn], -1)).astype(np.float32)
        if self.MIRROR:                                                          # the target even about the axis too, so the left half is planned on both
            T = 0.5 * (T + T[:, ::-1])
        self.lock = -np.ones((self.R, self.N), np.int16)
        T = self.glossy(T)
        Lb = to_lab(T)[..., 0]
        w = self.body.astype(np.float32)
        sm = ndi.gaussian_filter1d(Lb * w, self.SLOPE_MM, axis=0) / np.maximum(ndi.gaussian_filter1d(w, self.SLOPE_MM, axis=0), 1e-3)
        self.slope = np.where(self.body, np.abs(np.gradient(sm, axis=0)), 0.0)
        return T

    def make_jars(self):
        """the sketch's colours: each a jar made to measure, then the owner's own whose dried leg is near it, nearest pair first; the rest new"""
        dried = lambda p: to_lab(leg_colour(p, 40.0).astype(np.float32)[None])[0]
        own = []
        for q in json.load(open(SHELF))['jars']:
            p = jar(q['hex'], q['coats'], q['name'])
            p.name = q['name']
            own.append((p, dried(p)))
        want = []
        for q in self.sk['jars']:
            if q.get('line_m', 1) < self.MIN_SKETCH:                             # a colour the sketch gives a few cm (the crest's gold): no jar for it
                print(f"{q['name']} {q['hex']}: {q['line_m']} m in the sketch, no jar for it", flush=True)
                continue
            t = srgb2lin(tuple(int(q['hex'][i:i + 2], 16) for i in (1, 3, 5))).astype(np.float32)
            p, e = invert(t)
            want.append((q, p, e, dried(p)))
        pairs = sorted((float(np.sqrt(((w[3] - d) ** 2).sum())), i, k) for i, w in enumerate(want) for k, (_, d) in enumerate(own))
        got, taken = {}, set()
        for d, i, k in pairs:
            if d <= self.NEAR and i not in got and k not in taken:
                got[i] = (k, d)
                taken.add(k)
        out = []
        for i, (q, p, e, d) in enumerate(want):
            out.append((q, own[got[i][0]][0], own[got[i][0]][1], f'dried ΔE {got[i][1]:.1f}') if i in got else (q, p, d, f'made to measure, {e:.1f} off'))
        # Kuzya's D (racecark.py, MERGE_DE): jars whose dried legs the eye cannot tell apart, one — his own first, then the lighter; a colour the brush cannot dry as
        # deep as the picture is the deepest a jar gives, so two such are one jar, and the Black
        order = sorted(range(len(out)), key=lambda i: (not out[i][1].name.startswith(('Jar', 'Black')), -out[i][2][0]))
        keep, into = [], {}
        for i in order:
            near = next((k for k in keep if float(np.sqrt(((out[i][2] - out[k][2]) ** 2).sum())) < self.MERGE_DE), None)
            if near is None:
                keep.append(i)
            else:
                into[i] = near
        new, jars = 0, []
        for i in sorted(keep):
            p = out[i][1]
            if not p.name.startswith(('Jar', 'Black')):
                new += 1
                p.name = f'New {new}'
            jars.append(p)
        for i, (q, p, d, how) in enumerate(out):
            to = out[into[i]][1] if i in into else p
            print(f"{q['name']} {q['hex']} → {to.name} {to.hex} ×{to.coats}, {how}" + (', one with it (dried, under ΔE 2.5)' if i in into else ''), flush=True)
        out = jars
        if self.CREST and not any(p.name == 'Black' for p in out):              # the crest's mark wants the Black
            k = next(k for k, (p, _) in enumerate(own) if p.name == 'Black')
            out.append(own[k][0])
        return out

    def prune(self):
        """the colours the owner approved stay: none taken out, none merged"""
        return 0

    def locks(self):
        pass

    def plan(self):
        super().plan()
        if self.MIRROR:                                                          # the right half the left's mirror, column for column
            n = self.N
            for c in range(n // 2):
                self.grid[:, n - 1 - c] = self.grid[:, c]
                self.form[:, n - 1 - c] = self.form[:, c]
        return self

    def touch(self):
        """the crest's mark: two Black columns about the axis over the crest's rows, on the finished grid; nothing else moves"""
        if self.crestcells is None:
            return self
        names = [p.name for p in self.pal.jars]
        rows = np.flatnonzero(self.crestcells.any(axis=1))
        axis_mm = self.sk['left'] + (self.axis - self.box[0]) * self.s
        on = np.zeros_like(self.mask)
        on[rows.min():rows.max() + 1] = True
        on &= (np.abs(self.xs[None, :] - axis_mm) < PITCH) & self.mask
        self.grid[on], self.form[on] = names.index('Black'), 1
        print('the crest\'s mark:', int(on.any(axis=0).sum()), 'columns ×', int(on.any(axis=1).sum()), 'mm of Black', flush=True)
        return self
