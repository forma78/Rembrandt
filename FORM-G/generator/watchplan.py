#!/usr/bin/env python3
"""OPM-G study: a watch in pop colours on ONE grid of columns, a column the brush's track (5 mm), three canvases, three optical languages.

  40 x 60  GRAPHIC  every tone one paint, hard borders: a sign. No mixing but the brush's own film and ridges.
  60 x 80  TEETH    the same tube paints, but every border a comb: every column its own threshold (1-D Bayer).
  70 x 100 OPTICAL  no grey in a tube: steel from Orange, 03, White and Black, each colour a ratio of pure paints in neighbouring columns.

Rules kept from the owner's and the OPM-G notes: legs along the canvas's height only; no span gives its paint to a neighbour (a short one is laid short);
same-paint spans of a column join under a darker piece (light under dark); paints light to dark; a dip every 95 mm of line.
"""
import numpy as np
from scipy import ndimage as ndi
from scipy.optimize import nnls
from brushsim import Paint, srgb2lin
import watchgeo as G

PITCH = 5.0
MARGIN = 10.0
LMIN = 8.0        # mm: the shortest span planned on purpose, est. (the OPM-G notes: legs of 8-12 mm in a snake paint on 94 % of their track, est.)

# the owner's paints (src/tapeplan.js, TAPE_PAINTS, read off swatches, est.), Lavender off the first canvas (IMG_2415, est.)
P = {
    'white': Paint('White', '#FBF9F0', 0.26, 0.25),
    'lemon': Paint('Lemon Yellow', '#FFF200', 0.42, 0.22),
    'oyellow': Paint('Orange Yellow', '#FA9B00', 0.42, 0.26),
    'orange': Paint('Orange', '#DB2B01', 0.50, 0.24),
    'red': Paint('Red', '#BF020B', 0.50, 0.27),
    'deepred': Paint('Deep Red', '#9D1529', 0.55, 0.30),
    'pink': Paint('Pink', '#ED5D65', 0.42, 0.34),
    'roseazo': Paint('Rose Azo', '#BA085E', 0.50, 0.25),
    'magenta': Paint('Magenta', '#AA0955', 0.55, 0.27),
    'purple': Paint('Purple', '#3E1B56', 0.60, 0.30),
    'turquoise': Paint('Turquoise', '#31E2CA', 0.45, 0.32),
    'sky': Paint('Sky Blue', '#418CBA', 0.45, 0.28),
    'p03': Paint('03', '#0E72B5', 0.50, 0.27),
    'ultra': Paint('Ultramarine', '#122387', 0.65, 0.30),
    'black': Paint('Black', '#090909', 0.60, 0.30),
    'lavender': Paint('Lavender', '#A9ADD8', 0.32, 0.30),
}


def apparent(table={}):
    """What a long leg of a paint reads as from afar: the film and the ridges averaged. Rendered once on a patch."""
    if table:
        return table
    import os, pickle
    cache = 'apparent.pkl'
    if os.path.exists(cache):
        table.update(pickle.load(open(cache, 'rb')))
        if set(table) == set(P):
            return table
        table.clear()
    from brushsim import Sim
    sim = Sim(70, 110, ppm=4, seed=21)
    box = (20, 40, 70, 100)
    x0 = 10
    for pid, paint in P.items():
        sim2 = Sim(70, 110, ppm=4, seed=21)
        T = np.zeros((sim2.h, sim2.w), np.float32)
        s = 0.0
        for i in range(11):
            x = x0 + i * PITCH
            sim2.leg(T, x, 5, 105, s, s + 100, 'turn', 'turn')
            s += 105
        sim2.lay(T, paint)
        crop = sim2.R[int(30 * 4):int(80 * 4), int(15 * 4):int(55 * 4)]
        table[pid] = crop.reshape(-1, 3).mean(axis=0)
    pickle.dump(dict(table), open(cache, 'wb'))
    return table


def poly_mask(X, Y, pts):
    """Even-odd fill of a polygon, on arrays of points."""
    inside = np.zeros_like(X, dtype=bool)
    n = len(pts)
    for i in range(n):
        x1, y1 = pts[i]
        x2, y2 = pts[(i + 1) % n]
        cond = (y1 > Y) != (y2 > Y)
        with np.errstate(divide='ignore', invalid='ignore'):
            xint = (x2 - x1) * (Y - y1) / (y2 - y1 + 1e-12) + x1
        inside ^= cond & (X < xint)
    return inside


def star_pts(cx, cy, R, r=None, n=5, rot=-np.pi / 2):
    r = R * 0.42 if r is None else r
    return [(cx + (R if i % 2 == 0 else r) * np.cos(rot + i * np.pi / n), cy + (R if i % 2 == 0 else r) * np.sin(rot + i * np.pi / n)) for i in range(2 * n)]


def bayer(n=16):
    """1-D ordered thresholds by bit reversal: neighbours as far apart as can be, every level evenly spread."""
    bits = int(np.log2(n))
    return np.array([int(format(i, f'0{bits}b')[::-1], 2) for i in range(n)], dtype=np.float32) / n + 0.5 / n


def thresholds(N, seed=0, n=16):
    b = bayer(n)
    return b[(np.arange(N) + seed * 5) % n]


def smooth_y(a, mask, sigma):
    """Blur along a column only, and only inside the form."""
    if sigma <= 0:
        return a
    w = ndi.gaussian_filter1d(mask.astype(np.float32), sigma, axis=0)
    if a.ndim == 3:
        out = ndi.gaussian_filter1d(a * mask[..., None], sigma, axis=0) / np.maximum(w[..., None], 1e-3)
    else:
        out = ndi.gaussian_filter1d(a * mask, sigma, axis=0) / np.maximum(w, 1e-3)
    return out


def nnls_weights(target, A):
    """Weights of the palette's apparent colours that average to the target, per cell (solved once per quantised colour)."""
    q = np.clip((target * 40).astype(np.int32), 0, 40)
    keys = q[..., 0] * 1681 + q[..., 1] * 41 + q[..., 2]
    uniq, inv = np.unique(keys, return_inverse=True)
    W = np.zeros((len(uniq), A.shape[0]), np.float32)
    M = np.vstack([A.T, 3.0 * np.ones(A.shape[0])])
    for i, k in enumerate(uniq):
        c = np.array([(k // 1681) / 40, ((k // 41) % 41) / 40, (k % 41) / 40], np.float32)
        w, _ = nnls(M, np.concatenate([c, [3.0]]))
        W[i] = w / max(w.sum(), 1e-6)
    return W[inv].reshape(target.shape[:2] + (A.shape[0],))


CFG = {
    '40x60': dict(W=400, H=600, s=0.2925, mode='graphic'),
    '60x80': dict(W=600, H=800, s=0.395, mode='teeth'),
    '70x100': dict(W=700, H=1000, s=0.50, mode='optical'),
}


class Plan:
    def __init__(self, name, seed=4):
        c = CFG[name]
        self.name = name
        self.W, self.H, self.s, self.mode = c['W'], c['H'], c['s'], c['mode']
        self.N = int((self.W - 2 * MARGIN) / PITCH)
        self.x0 = (self.W - self.N * PITCH) / 2
        self.R = int(self.H - 2 * MARGIN)            # rows, 1 mm each
        self.xs = self.x0 + PITCH * (np.arange(self.N) + 0.5)
        self.ys = MARGIN + np.arange(self.R) + 0.5
        self.X, self.Y = np.meshgrid(self.xs, self.ys)
        self.grid = -np.ones((self.R, self.N), np.int16)      # paint index per cell
        self.form = -np.ones((self.R, self.N), np.int16)      # form index per cell
        self.pids = list(P.keys())
        self.forms = []                                       # settings per form
        self.rng = np.random.default_rng(seed)
        self.geo = G.load()
        self.A = apparent()
        self.px = 823 + (self.X - self.W / 2) / self.s
        self.py = 1018 + (self.Y - self.H / 2) / self.s

    def pid(self, p):
        return self.pids.index(p)

    def add_form(self, **kw):
        self.forms.append(kw)
        return len(self.forms) - 1

    def set(self, mask, paint, fid):
        self.grid[mask] = self.pid(paint)
        self.form[mask] = fid

    # sample a photo-space array on the cells
    def sample(self, arr, sig_mm=(0.8, 2.5)):
        f = ndi.gaussian_filter(arr.astype(np.float32), (sig_mm[0] / self.s, sig_mm[1] / self.s))
        return ndi.map_coordinates(f, [self.py, self.px], order=1, mode='nearest')

    def lay_colour(self, mask, target, palette, fid, sigma=6.0, amp=1.0, seed=0, n=16):
        """Every column its own threshold: cum weights against tau. amp 0: the one paint with the most share; 1: full dither."""
        A = np.stack([self.A[p] for p in palette])
        idx = np.argsort(-A @ np.array([0.2126, 0.7152, 0.0722]))
        A = A[idx]
        palette = [palette[i] for i in idx]
        t = np.where(mask[..., None], target, 0)
        W = nnls_weights(np.clip(t, 0, 1), A) * mask[..., None]
        W = smooth_y(W, mask, sigma) * mask[..., None]
        tau = 0.5 + (thresholds(self.N, seed, n) - 0.5) * amp
        cum = np.cumsum(W, axis=2)
        cum[..., -1] = 1.01
        pick = (cum < tau[None, :, None]).sum(axis=2)
        pick = np.clip(pick, 0, len(palette) - 1)
        for i, p in enumerate(palette):
            self.set(mask & (pick == i), p, fid)

    def lay_tones(self, mask, tone, ramp, levels, fid, sigma=0.0, delta=0.0, seed=0):
        """A ramp of paints by tone (0 dark ... 1 light): hard at delta 0; with delta a comb at every border, each column shifted by its threshold."""
        t = smooth_y(tone, mask, sigma) if sigma else tone
        tau = thresholds(self.N, seed) - 0.5
        v = t + delta * tau[None, :]
        pick = np.searchsorted(np.asarray(levels), v)
        for i, p in enumerate(ramp):
            self.set(mask & (pick == i), p, fid)

    # ------------------------------------------------------------------ the background: a pop collage, no names, no characters
    def background(self):
        W, H, X, Y = self.W, self.H, self.X, self.Y
        m = self.mode
        field = self.add_form(name='field', idle=(m != 'optical'), dose=1.25, stripes=(m == 'optical'))
        k = W / 700.0

        def Pm(*pts):
            return poly_mask(X, Y, [(u * W, v * H) for u, v in pts])

        tl = Pm((-.1, -.1), (.5, -.1), (.5, .20), (-.1, .36))
        ml = Pm((-.1, .36), (.5, .20), (.5, .60), (-.1, .66))
        bl = Pm((-.1, .66), (.5, .60), (.5, 1.1), (-.1, 1.1))
        tr = Pm((.5, -.1), (1.1, -.1), (1.1, .30), (.5, .40))
        mr = Pm((.5, .40), (1.1, .30), (1.1, .62), (.5, .70))
        br = Pm((.5, .70), (1.1, .62), (1.1, 1.1), (.5, 1.1))
        ramp_y = lambda a, b: np.clip((Y - a * H) / ((b - a) * H), 0, 1)

        def paint_field(mask, flat, teeth, optical, ya, yb, seed):
            """flat: a paint; teeth: (ramp, top to bottom); optical: (palette, colour top, colour bottom in sRGB)."""
            if m == 'graphic':
                self.set(mask, flat, field)
            elif m == 'teeth':
                ramp = teeth
                n = len(ramp)
                v = ramp_y(ya, yb) * (n - 1)
                tau = thresholds(self.N, seed) - 0.5
                pick = np.clip(np.round(v + 0.92 * tau[None, :]).astype(int), 0, n - 1)
                for i, p in enumerate(ramp):
                    self.set(mask & (pick == i), p, field)
            else:
                pal, c0, c1 = optical
                c0, c1 = srgb2lin(c0), srgb2lin(c1)
                u = ramp_y(ya, yb)[..., None]
                self.lay_colour(mask, c0 * (1 - u) + c1 * u, pal, field, sigma=10, amp=1, seed=seed)

        paint_field(tl, 'lemon', ['lemon', 'oyellow'], (['lemon', 'oyellow', 'pink'], (252, 232, 60), (250, 170, 50)), 0.0, 0.36, 1)
        paint_field(ml, 'pink', ['oyellow', 'pink', 'roseazo'], (['pink', 'lemon', 'magenta'], (245, 150, 110), (225, 80, 110)), 0.2, 0.66, 2)
        paint_field(bl, 'roseazo', ['pink', 'roseazo', 'magenta'], (['pink', 'magenta', 'ultra'], (225, 80, 120), (120, 30, 120)), 0.6, 1.0, 3)
        paint_field(tr, 'ultra', ['p03', 'ultra'], (['ultra', 'magenta', 'p03'], (40, 60, 170), (60, 25, 130)), 0.0, 0.4, 4)
        paint_field(mr, 'lemon', ['lemon', 'oyellow'], (['lemon', 'oyellow', 'white'], (245, 235, 80), (248, 180, 40)), 0.3, 0.7, 5)
        paint_field(br, 'orange', ['oyellow', 'orange', 'red'], (['orange', 'lemon', 'magenta'], (248, 150, 40), (215, 50, 40)), 0.62, 1.0, 6)

        # the sphere: Kuzya's, made of straight legs of different lengths, with a run of drips
        cx, cy, R = 0.158 * W, 0.165 * H, 0.112 * W
        sph = (X - cx) ** 2 + (Y - cy) ** 2 < R ** 2
        lx, ly, lz = -0.45, -0.55, 0.70
        nx, ny = (X - cx) / R, (Y - cy) / R
        nz = np.sqrt(np.clip(1 - nx * nx - ny * ny, 0, 1))
        lit = np.clip(nx * lx + ny * ly + nz * lz, 0, 1)
        sf = self.add_form(name='sphere', idle=False, dose=1.2, stripes=(m == 'optical'))
        drips = np.zeros_like(sph)
        for ci in range(self.N):
            xc = self.xs[ci]
            if abs(xc - cx) < R * 0.86:
                yb = cy + np.sqrt(max(R * R - (xc - cx) ** 2, 0))
                L = (self.rng.choice([18, 34, 58, 90, 130]) * self.rng.uniform(0.8, 1.2)) * (0.55 + 0.45 * k)
                drips[:, ci] = (Y[:, ci] >= yb - 1) & (Y[:, ci] < yb + L)
        self.set(drips, 'red', self.add_form(name='drips', idle=False, dose=1.5))
        if m == 'graphic':
            self.lay_tones(sph, lit, ['red', 'orange', 'oyellow'], [0.42, 0.86], sf)
        elif m == 'teeth':
            self.lay_tones(sph, lit, ['purple', 'deepred', 'red', 'orange', 'oyellow', 'lemon'], [0.14, 0.34, 0.56, 0.78, 0.93], sf, sigma=2, delta=0.20, seed=3)
        else:
            c = np.stack([np.interp(lit, [0, .35, .7, 1], [0.05, 0.42, 0.85, 1.0]),
                          np.interp(lit, [0, .35, .7, 1], [0.02, 0.05, 0.20, 0.85]),
                          np.interp(lit, [0, .35, .7, 1], [0.10, 0.03, 0.02, 0.25])], axis=-1)
            self.lay_colour(sph, c, ['lemon', 'orange', 'red', 'ultra', 'magenta'], sf, sigma=3, amp=1, seed=3)
        ink = self.add_form(name='ink', idle=False, dose=1.6)
        rim = ((X - cx) ** 2 + (Y - cy) ** 2 < (R + 5) ** 2) & ~sph
        self.set(rim, 'black', ink)

        # a white star on the blue
        stf = self.add_form(name='star', idle=True, dose=1.3)
        star = poly_mask(X, Y, star_pts(0.835 * W, 0.15 * H, (0.145 if k < 0.7 else 0.125) * W, r=(0.145 if k < 0.7 else 0.125) * W * 0.46))
        self.set(star, 'white', stf)
        # a little one, on a canvas with room for it
        if k > 0.8:
            s2 = poly_mask(X, Y, star_pts(0.905 * W, 0.325 * H - 0 * k, 0.040 * W))
            s2 &= tr
            self.set(s2, 'pink', stf)

        # a bolt on the rose, black round it
        bx, by, bw, bh = 0.135 * W, 0.80 * H, 0.20 * W, 0.235 * H
        bolt_pts = [(-0.18, 0), (0.42, 0), (0.12, 0.36), (0.46, 0.36), (-0.40, 1.0), (-0.12, 0.50), (-0.46, 0.50)]
        bolt_pts = [(bx + a * bw, by - bh / 2 + b * bh) for a, b in bolt_pts]
        bolt = poly_mask(X, Y, bolt_pts)
        if k >= 0.8:
            out = ndi.binary_dilation(bolt, structure=np.ones((9, 3), bool)) & ~bolt
            self.set(out, 'black', ink)
        self.set(bolt, 'lemon', self.add_form(name='bolt', idle=False, dose=1.4))

        # Ben-Day, one dimension: a black leg per dot on the yellow, its length the tone; the machine's own halftone
        dab = self.add_form(name='dab', idle=False, dose=1.7, free=True)
        stepy = 24
        for ci in range(self.N):
            if ci % 3:
                continue
            off = (ci // 3 % 2) * stepy / 2
            for yy in np.arange(0.33 * H + off, 0.72 * H, stepy):
                xc = self.xs[ci]
                if not (mr[int(np.clip(yy - MARGIN, 0, self.R - 1)), ci]):
                    continue
                u = np.clip((xc / W - 0.72) / 0.28, 0, 1)
                L = 8 + 10 * u
                self.set((np.abs(Y - yy) < L / 2) & (np.abs(X - xc) < 1), 'black', dab)

        # a race flag in the bottom right corner: squares of whole columns, long enough to land on
        q = 4
        sq = q * PITCH
        fx0, fy0 = self.xs[self.N - 1 - 3 * q - (self.N % q) * 0] + PITCH / 2 + 0.0, 0.0
        flag = (X > W - MARGIN - 3 * q * PITCH * (0.75 + 0.25 * k) - 0.01) & (Y > H - MARGIN - 3 * sq)
        cx_i = (np.arange(self.N) // q)
        ry = ((Y - (H - MARGIN - 3 * sq)) // sq).astype(int)
        chk = ((cx_i[None, :] + ry) % 2) == 0
        fla = self.add_form(name='flag', idle=False, dose=1.5, free=True)
        self.set(flag & chk, 'black', fla)
        self.set(flag & ~chk, 'white', fla)

    # ------------------------------------------------------------------ the steel
    LINKS = [(676, 28, 925, 50), (662, 65, 942, 128), (655, 155, 958, 240), (635, 274, 978, 350),
             (636, 1478, 987, 1576), (655, 1620, 962, 1732), (661, 1776, 944, 1876), (669, 1910, 926, 1990)]
    GAPS = [38, 98, 205, 325, 1515, 1670, 1818, 1940]

    def super_mask(self, a, b, n):
        return (np.abs(self.px - 810.0) / a) ** n + (np.abs(self.py - 896.0) / b) ** n < 1

    def link_masks(self):
        out = []
        for x0, y0, x1, y1 in self.LINKS:
            r = 14.0
            qx = np.abs(self.px - (x0 + x1) / 2) - ((x1 - x0) / 2 - r)
            qy = np.abs(self.py - (y0 + y1) / 2) - ((y1 - y0) / 2 - r)
            d = np.hypot(np.maximum(qx, 0), np.maximum(qy, 0)) + np.minimum(np.maximum(qx, qy), 0) - r
            out.append(d < 0)
        return out

    def dial_mask(self):
        """The cushion: a superellipse fitted to the teal of the photo."""
        return self.super_mask(376.0, 374.0, 3.1)

    def steel(self):
        g = self.geo
        watch = self.sample(g['watch'].astype(np.float32), (0.6, 0.6)) > 0.5
        dialm = self.dial_mask()
        L = self.sample(g['L'], (1.2, 2.5))
        tone = np.clip((L - 0.56) / (0.955 - 0.56), 0, 1)
        outer = self.super_mask(483, 495, 3.3)
        inner = self.super_mask(430, 445, 3.1)
        flat = inner & ~dialm
        # the brushed bezel: calm, lighter to the top left
        dirn = ((self.px - 810) / 430 + (self.py - 896) / 445) / 2
        tone = np.where(flat, 0.54 - 0.24 * dirn, tone)
        links = self.link_masks()
        any_link = np.logical_or.reduce(links)
        tone = np.where(any_link, np.maximum(tone, 0.92), tone)
        sf = self.add_form(name='steel', idle=(self.mode != 'optical'), dose=1.0, stripes=(self.mode == 'optical'))
        body = watch & ~dialm
        if self.mode == 'graphic':
            self.lay_tones(body, tone, ['purple', 'lavender', 'white'], [0.30, 0.74], sf, sigma=1.5)
        elif self.mode == 'teeth':
            self.lay_tones(body, tone, ['purple', 'lavender', 'white'], [0.30, 0.74], sf, sigma=6, delta=0.30, seed=2)
        else:
            c = (0.24 + 0.62 * np.clip(tone, 0, 1)[..., None]) * np.array([1.04, 1.0, 0.95], np.float32)
            self.lay_colour(body, c, ['white', 'orange', 'p03'], sf, sigma=6, amp=1, seed=2)
        self.watch, self.dialm, self.body, self.links, self.outer = watch, dialm, body, links, outer

    # ------------------------------------------------------------------ black outlines: a span across a column no shorter than LMIN
    def grow_ink(self, ink, into, L=LMIN):
        """A dark line across a column shorter than L grows to L, into the form (a horizontal is many flattened verticals)."""
        out = ink.copy()
        for c in range(self.N):
            lab, n = ndi.label(ink[:, c])
            for i in range(1, n + 1):
                ii = np.where(lab == i)[0]
                a, b = ii[0], ii[-1] + 1
                if b - a < L:
                    need = int(np.ceil(L - (b - a)))
                    aa, bb = a, b
                    for _ in range(need):
                        up = aa - 1 >= 0 and into[aa - 1, c]
                        dn = bb < self.R and into[bb, c]
                        if dn and (not up or (bb - b) <= (a - aa)):
                            bb += 1
                        elif up:
                            aa -= 1
                        else:
                            break
                    out[aa:bb, c] = True
        return out

    def ring_of(self, mask, w_mm, outside=False):
        """Cells within w_mm of the mask's edge, on its inside (or its outside)."""
        hi = ndi.zoom((~mask if outside else mask).astype(np.float32), (1, PITCH), order=0) > 0.5
        dist = ndi.distance_transform_edt(hi)
        dist = dist[:, int(PITCH / 2)::int(PITCH)][:, :self.N]
        return (~mask if outside else mask) & (dist < w_mm)

    def outlines(self):
        ink_f = self.add_form(name='ink', idle=False, dose=1.6)
        w, dm, body = self.watch, self.dialm, self.body
        sil = self.ring_of(w, 4.0)
        rim = self.ring_of(dm, 4.0, outside=True)
        bez = self.ring_of(self.outer, 3.2) & w
        ink = sil | rim | (bez if self.mode != 'graphic' else (bez & False))
        any_link = np.logical_or.reduce(self.links)
        # the gaps between the outer links, off the central pieces
        half = max(2.0, 0.5 * LMIN)
        gaps = np.zeros_like(w)
        for y in self.GAPS:
            gaps |= (np.abs(self.py - y) * self.s < half) & w & ~any_link & ~self.outer
        ink |= gaps
        # the central polished links: white, black under them and at their sides, a drop shadow
        for m in (self.links if self.mode != 'graphic' else []):
            bot = self.ring_of(m, 3.5)
            rows = np.where(m.any(axis=1))[0]
            if len(rows) == 0:
                continue
            ymid = rows.mean()
            if self.mode == 'optical':
                sidebot = bot & ((np.arange(self.R)[:, None] > ymid) | (self.px > self.px[m].mean()))
            else:
                sidebot = bot & (np.arange(self.R)[:, None] > ymid)
            ink |= sidebot
        ink = self.grow_ink(ink, body)
        self.set(ink & w, 'black', ink_f)

    # ------------------------------------------------------------------ the dial
    def crown(self):
        x0, y0, x1, y1 = 1300, 826, 1420, 966
        box = (self.px >= x0) & (self.px <= x1) & (self.py >= y0) & (self.py <= y1)
        f = self.add_form(name='crown', idle=False, dose=1.2, free=True)
        cols = np.where(box.any(axis=0))[0]
        if len(cols) == 0:
            return
        dark = 'p03' if self.mode == 'optical' else 'purple'
        for i, c in enumerate(cols):
            self.set(box & (np.arange(self.N)[None, :] == c), 'white' if i % 2 == 0 else dark, f)
        ink_f = self.add_form(name='ink', idle=False, dose=1.6)
        edge = box & ~ndi.binary_erosion(box, structure=np.ones((17, 3), bool), border_value=0)
        self.set(edge, 'black', ink_f)

    def dial(self):
        dm = self.dialm
        m = self.mode
        cx, cy = 810.0, 896.0
        r = np.hypot((self.px - cx) / 376.0, (self.py - cy) / 374.0)
        df = self.add_form(name='dial', idle=(m == 'graphic'), dose=1.15, air=(m != 'graphic'), rib=62.0 if m == 'optical' else 80.0)
        if m == 'graphic':
            self.set(dm, 'turquoise', df)
        elif m == 'teeth':
            dd = ((self.px - cx) / 376.0 + (self.py - cy) / 374.0) / 2
            self.lay_tones(dm, np.clip(0.62 - 0.55 * dd - 0.25 * np.clip(r - 0.72, 0, 1), 0, 1), ['sky', 'turquoise', 'white'], [0.26, 0.95], df, sigma=3, delta=0.26, seed=6)
        else:
            t = np.clip(r, 0, 1)[..., None]
            c0, c1 = srgb2lin((158, 228, 224)), srgb2lin((128, 206, 216))
            self.lay_colour(dm, c0 * (1 - t) + c1 * t, ['turquoise', 'sky'], df, sigma=8, amp=1, seed=6)
        self.furniture()

    def furniture(self):
        """Batons, hands, pivot, date, the second hand. Sizes in mm by canvas, a span across a column never under LMIN."""
        m = self.mode
        s = self.s
        ink_f = self.add_form(name='ink', idle=False, dose=1.6)
        lume_f = self.add_form(name='lume', idle=False, dose=1.3)
        px, py = self.px, self.py
        two_tone = m != 'graphic'
        def half_of(w):
            wmm = w * s
            return max(wmm / 2 + 1.5, 7.5) if two_tone else max(wmm / 2, 5.5)

        # the hands' keep-out: a baton they cross stops short of them, so the hand reads whole
        hand_d = np.full_like(px, 1e9, dtype=np.float32)
        for a, b, w in G.HANDS:
            hand_d = np.minimum(hand_d, G.seg_dist(px, py, a, b) * s - half_of(w))

        def lay_bars(bars, keepout):
            outer = np.zeros_like(self.dialm)
            inner = np.zeros_like(self.dialm)
            for a, b, w in bars:
                d = G.seg_dist(px, py, a, b) * s
                half = half_of(w)
                outer |= d < half
                if two_tone:
                    inner |= d < max(half - 4.5, 3.0)
            if keepout:
                outer &= hand_d > 6.0
                inner &= hand_d > 6.0
            ink = self.grow_ink(outer & self.dialm, self.dialm, 5.0)
            self.set(ink, 'black', ink_f)
            if two_tone:
                # a light core only where the span can land
                for c in range(self.N):
                    lab, n = ndi.label(inner[:, c])
                    for i in range(1, n + 1):
                        ii = np.where(lab == i)[0]
                        if len(ii) >= 6:
                            self.grid[ii, c] = self.pid('white')
                            self.form[ii, c] = lume_f

        lay_bars(G.BATONS, True)
        lay_bars(G.HANDS, False)
        # the date window: black frame, white inside, no digits
        (x0, y0), (x1, y1) = G.DATE
        pad = max(2.0 / s, 0)
        box = (px >= x0 - pad) & (px <= x1 + pad) & (py >= y0 - pad) & (py <= y1 + pad)
        self.set(box, 'black', ink_f)
        inner = (px >= x0 + 2.0 / s) & (px <= x1 - 2.0 / s) & (py >= y0 + 8 / s * 0.8) & (py <= y1 - 8 / s * 0.8)
        self.set(inner, 'white', lume_f)
        # the second hand: one column, one straight leg (the brush's best thing)
        c = int(np.argmin(np.abs(self.px[0] - G.SECOND[0][0])))
        col = (py[:, c] >= G.SECOND[0][1]) & (py[:, c] <= G.SECOND[1][1])
        self.grid[col, c] = self.pid('black')
        self.form[col, c] = ink_f
        # the pivot
        (ppx, ppy), pr = G.PIVOT
        d = np.hypot(px - ppx, py - ppy) * s
        self.set(d < max(pr * s, 10.0), 'black', ink_f)
        # the minute track: dabs, where the canvas has room for them
        if m != 'graphic':
            dab_f = self.add_form(name='dab', idle=False, dose=1.7, free=True)
            n = 60
            for i in range(n):
                if i % 5 == 0:
                    continue
                th = 2 * np.pi * i / n
                u, v = np.sin(th), -np.cos(th)
                # on a superellipse inset from the rim
                q = (np.abs(u / 376.0) ** 3.1 + np.abs(v / 374.0) ** 3.1) ** (-1 / 3.1) * 0.925
                dx, dy = 810 + q * u, 896 + q * v
                c = int(np.argmin(np.abs(self.px[0] - dx)))
                rr = int(np.argmin(np.abs(self.py[:, 0] - dy)))
                L = 10
                self.grid[max(0, rr - L // 2):rr + L // 2, c] = self.pid('black')
                self.form[max(0, rr - L // 2):rr + L // 2, c] = dab_f

    # ------------------------------------------------------------------ all
    def build(self):
        self.background()
        self.steel()
        self.outlines()
        self.crown()
        self.dial()
        self.grid[self.grid < 0] = self.pid('white')
        return self

    def flat(self, px_per_mm=2):
        """A plan map: flat apparent colours."""
        from brushsim import lin2srgb
        cols = np.stack([self.A[p] for p in self.pids])
        out = lin2srgb(cols[self.grid])
        img = np.ones((int(self.H * px_per_mm), int(self.W * px_per_mm), 3), np.float32) * np.array([243, 240, 230], np.float32) / 255
        y0, x0 = int(MARGIN * px_per_mm), int(self.x0 * px_per_mm)
        hh = ndi.zoom(out, (px_per_mm, PITCH * px_per_mm, 1), order=0)
        img[y0:y0 + hh.shape[0], x0:x0 + hh.shape[1]] = hh
        return img


if __name__ == '__main__':
    from PIL import Image
    import sys
    names = sys.argv[1:] or list(CFG)
    ims = []
    for n in names:
        pl = Plan(n).build()
        im = pl.flat(2)
        ims.append(im)
        spans = sum(int((np.diff(pl.grid, axis=0) != 0).sum()) for _ in [0]) + pl.N
        print(n, 'columns', pl.N, 'rows', pl.R, 'spans', spans)
    H = max(i.shape[0] for i in ims)
    W = sum(i.shape[1] for i in ims) + 20 * (len(ims) - 1)
    sheet = np.ones((H, W, 3), np.float32) * 0.85
    x = 0
    for i in ims:
        sheet[H - i.shape[0]:H, x:x + i.shape[1]] = i
        x += i.shape[1] + 20
    Image.fromarray((sheet * 255).astype(np.uint8)).save('plans.png')
