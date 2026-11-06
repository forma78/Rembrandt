#!/usr/bin/env python3
"""OPM-G study: the green 911 as hyperrealism on 70 x 100, upright, bare canvas. The technique of watch_60x80_hyper.jpg.
The owner mixes any shade in jars (2026-11-06: "I mix them in jars, so I can make practically any shade"), so the jars are made for this picture: the photo's colours clustered, for each
tone a pair of neighbouring shades, so that no leg is the colour itself and the eye makes it. A jar's colour is worked out backwards from what its long leg should come to. Too deep for one coat: two."""
import os, pickle, sys, time, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from brushsim import Paint, Sim, srgb2lin, lin2srgb
from distance_core import to_lab
import watchplan as WP
from watchplan import P, PITCH, MARGIN, thresholds
import cargeo
import paintrun

M_XYZ = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]], np.float32)
WHITE = M_XYZ.sum(axis=1)
Minv = np.linalg.inv(M_XYZ)


def lab2lin(lab):
    fy = (lab[..., 0] + 16) / 116
    fx = lab[..., 1] / 500 + fy
    fz = fy - lab[..., 2] / 200
    g = lambda f: np.where(f > 6 / 29, f ** 3, 3 * (6 / 29) ** 2 * (f - 4 / 29))
    xyz = np.stack([g(fx) * WHITE[0], g(fy) * WHITE[1], g(fz) * WHITE[2]], -1)
    return np.clip(xyz @ Minv.T, 0, 1)


def lin2hex(c):
    v = (lin2srgb(np.clip(c, 0, 1)) * 255).round().astype(int)
    return '#%02X%02X%02X' % tuple(v)


LS = np.array([10, 16, 25, 40, 70, 130], np.float32)
CACHE_FILE = 'jars_cache.pkl'
CACHE = pickle.load(open(CACHE_FILE, 'rb')) if os.path.exists(CACHE_FILE) else {}


def jar(hexv, coats=1, jid=None):
    lin = srgb2lin(tuple(int(hexv[i:i + 2], 16) for i in (1, 3, 5)))
    lum = float(lin @ np.array([0.2126, 0.7152, 0.0722], np.float32))
    p = Paint(jid or hexv, hexv, 0.26 + 0.36 * (1 - lum) ** 2, 0.30)
    p.coats = coats
    return p


def leg_colour(p, L, seed=21):
    """What a little snake of this jar comes to at leg length L, its coats included."""
    key = (p.hex, p.coats, float(L))
    if key in CACHE:
        return CACHE[key]
    sim = Sim(60, int(L) + 30, ppm=4, seed=seed)
    for coat in range(p.coats):
        T = np.zeros((sim.h, sim.w), np.float32)
        s = 0.0
        for i in range(8):
            x = 12 + i * PITCH
            if i % 2 == 0:
                sim.leg(T, x, 15, 15 + L, s, s + L, 'turn', 'turn', solid=L < 14)
            else:
                sim.leg(T, x, 15, 15 + L, s + L, s, 'turn', 'turn', solid=L < 14)
            s += L + PITCH
        sim.lay(T, p)
    crop = sim.R[int(15 * 4):int((15 + L) * 4), int((12 + 2 * PITCH - 2.5) * 4):int((12 + 5 * PITCH + 2.5) * 4)]
    out = crop.reshape(-1, 3).mean(axis=0)
    CACHE[key] = out
    return out


def invert(target_lin, L=40.0):
    """A jar whose long leg comes to the target: one coat if it can, two if the colour is too deep for one. Returns the Paint and how far off it stays (dE)."""
    tlab = to_lab(target_lin.astype(np.float32)[None])[0]
    best = None
    for coats in (1, 2):
        m = np.clip(target_lin.copy(), 0.004, 0.985)
        for _ in range(6):
            p = jar(lin2hex(m), coats)
            a = leg_colour(p, L)
            m = np.clip(m * (np.maximum(target_lin, 0.004) / np.maximum(a, 0.004)) ** 1.15, 0.004, 0.985)
        p = jar(lin2hex(m), coats)
        a = leg_colour(p, L)
        err = float(np.sqrt(((to_lab(a.astype(np.float32)[None])[0] - tlab) ** 2).sum()))
        if best is None or err < best[1] - 2.0:
            best = (p, err)
        if err < 3.0:
            break
    return best


BIN = 2
LBINS = [4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 60, 75, 90, 120, 160, 200, 250, 320]
WEIGHT = np.array([1.35, 0.55, 0.55], np.float32)


class Palette:
    def __init__(self, jars):
        self.jars = jars
        self.K = len(jars)
        self.table = np.stack([np.stack([leg_colour(p, float(L)) for L in LS]) for p in jars])
        self.A_LAB = [to_lab(np.stack([self.app(k, l * BIN) for k in range(self.K)]).astype(np.float32)) * WEIGHT for l in LBINS]
        self.A_NORM = [(A * A).sum(axis=1) for A in self.A_LAB]
        pickle.dump(CACHE, open(CACHE_FILE, 'wb'))

    def app(self, k, L):
        x = np.log(np.clip(L, LS[0], LS[-1]))
        lg = np.log(LS)
        i = int(np.clip(np.searchsorted(lg, x) - 1, 0, len(LS) - 2))
        u = (x - lg[i]) / (lg[i + 1] - lg[i])
        return self.table[k, i] * (1 - u) + self.table[k, i + 1] * u

    def segment(self, lab, lam, prev, beta, ban=None):
        ban = np.zeros(self.K, np.float32) if ban is None else ban
        K = self.K
        n = len(lab)
        if n == 0:
            return np.zeros(0, int)
        S1 = np.vstack([np.zeros((1, 3), np.float32), np.cumsum(lab, axis=0)])
        S2 = np.concatenate([[0.0], np.cumsum((lab * lab).sum(axis=1))])
        aff = np.zeros((n + 1, K), np.float32)
        on = prev >= 0
        if on.any():
            hit = np.zeros((n, K), np.float32)
            hit[np.flatnonzero(on), prev[on]] = 1.0
            aff[1:] = np.cumsum(hit, axis=0)
        if n < LBINS[0]:
            j = int(np.argmin(np.abs(np.array(LBINS) - n)))
            d = lab[:, None, :] - self.A_LAB[j][None, :, :]
            return np.full(n, int(((d * d).sum(axis=(0, 2)) + ban * n - beta * aff[n]).argmin()))
        D, Pk = {}, {}
        for j, l in enumerate(LBINS):
            if l > n:
                break
            d1 = S1[l:] - S1[:-l]
            d2 = S2[l:] - S2[:-l]
            c = d2[:, None] - 2 * (d1 @ self.A_LAB[j].T) + l * self.A_NORM[j][None, :] + ban[None, :] * l - beta * (aff[l:] - aff[:-l])
            Pk[l] = c.argmin(axis=1)
            D[l] = c.min(axis=1)
        ls = sorted(D)
        dp = [1e18] * (n + 1)
        back = [(0, 0)] * (n + 1)
        dp[0] = -lam
        for r in range(LBINS[0], n + 1):
            bv, bl = 1e18, 0
            for l in ls:
                if l > r:
                    break
                v = dp[r - l]
                if v >= 1e17:
                    continue
                v = v + lam + D[l][r - l]
                if v < bv:
                    bv, bl = v, l
            dp[r] = bv
            back[r] = (bl, int(Pk[bl][r - bl]) if bl else 0)
        out = np.zeros(n, int)
        r = n
        while r > 0:
            l, k = back[r]
            if l == 0:
                out[:r] = out[r] if r < n else 0
                break
            out[r - l:r] = k
            r -= l
        return out


def kmeans(X, k, seed=3, iters=40):
    rng = np.random.default_rng(seed)
    C = [X[rng.integers(len(X))]]
    for _ in range(k - 1):
        d = np.min([((X - c) ** 2).sum(axis=1) for c in C], axis=0)
        C.append(X[rng.choice(len(X), p=d / d.sum())])
    C = np.array(C)
    for _ in range(iters):
        lab = np.argmin(((X[:, None, :] - C[None, :, :]) ** 2).sum(axis=2), axis=1)
        for j in range(k):
            if (lab == j).any():
                C[j] = X[lab == j].mean(axis=0)
    return C, np.bincount(lab, minlength=k)


FIXED = [('chrome', '#E6E5DF', 1), ('chromeM', '#C6C6C1', 1), ('chromeD', '#9B9C9A', 1), ('ink', '#0C0C0C', 2), ('wood', '#8A3A1C', 1), ('tail', '#C4261A', 1), ('steel', '#6E7072', 1), ('creaseL', '#E4EDE2', 1), ('creaseD', '#16321F', 2), ('seam', '#2C5A40', 1), ('louvre', '#2B2D2D', 2)]


def guided(I, r, eps):
    """A guided filter, self-guided (He et al.): the paint's metal grain off, the edges kept."""
    f = lambda a: ndi.uniform_filter(a, 2 * r + 1, mode='nearest')
    m = f(I)
    v = f(I * I) - m * m
    k = v / (v + eps)
    return f(k) * I + (m - f(k) * m)


class Car:
    W, H = 700, 1000
    LENGTH_MM = 850.0   # the machine reaches 865 mm along X (the owner, 2026-11-06: "more white background, the Porsche 850 mm"; it was 950, past the reach)
    LAM, BETA, GAIN = 2200.0, 6.0, 0.72
    JIT = (3.5, 5.0)
    KCLUSTERS = 30
    MIN_LEGS, MIN_LINE = 6, 0.15

    def __init__(self):
        self.N = int((self.W - 2 * MARGIN) / PITCH)
        self.x0 = (self.W - self.N * PITCH) / 2
        self.R = int(self.H - 2 * MARGIN)
        self.xs = self.x0 + PITCH * (np.arange(self.N) + 0.5)
        self.ys = MARGIN + np.arange(self.R) + 0.5
        g = cargeo.load()
        self.g = g
        ys, xs = np.where(g['mask'])
        self.s = self.LENGTH_MM / (ys.max() - ys.min())
        X, Y = np.meshgrid(self.xs, self.ys)
        self.px = cargeo.AXIS + (X - self.W / 2) / self.s
        self.py = (ys.min() + ys.max()) / 2 + (Y - self.H / 2) / self.s
        self.forms = [dict(name='body', idle=True, dose=1.0), dict(name='dark', idle=False, dose=1.3)]
        smooth = np.stack([guided(g['im'][..., k], 7, 0.03 ** 2) for k in range(3)], axis=-1)
        self.photo = srgb2lin(np.clip(smooth, 0, 1) * 255).astype(np.float32)
        self.target0 = self.make_target()
        self.target = self.target0.copy()

    def samp(self, a, sig):
        f = ndi.gaussian_filter(a.astype(np.float32), (sig[0] / self.s, sig[1] / self.s))
        return ndi.map_coordinates(f, [self.py, self.px], order=1, mode='nearest')

    def ring(self, mask, w_mm, outside=False):
        src = ~mask if outside else mask
        hi = ndi.zoom(src.astype(np.float32), (1, PITCH), order=0) > 0.5
        dist = ndi.distance_transform_edt(hi)
        dist = dist[:, int(PITCH / 2)::int(PITCH)][:, :self.N]
        return src & (dist < w_mm)

    # the car's parts, in the photo's pixels
    WIND = [(172, 562), (230, 545), (300, 532), (375, 527), (450, 532), (520, 543), (580, 558), (572, 600), (558, 652), (470, 640), (370, 632), (270, 640), (192, 652), (180, 610)]
    REAR = [(206, 916), (214, 912), (530, 912), (538, 918), (528, 1092), (520, 1100), (372, 1110), (226, 1100), (218, 1092)]
    GRILLE = [(232, 1140), (510, 1136), (504, 1204), (238, 1204)]
    SEAM = [(180, 520), (270, 500), (370, 492), (465, 497), (560, 510)]
    TAILS = [[(168, 1238), (195, 1275), (230, 1292)], [(510, 1292), (548, 1275), (578, 1232)]]

    def make_target(self):
        self.mask = self.samp(self.g['mask'], (0.4, 0.4)) > 0.5
        m = self.mask
        px, py = self.px, self.py
        self.wind = WP.poly_mask(px, py, self.WIND)
        self.rear = WP.poly_mask(px, py, self.REAR)
        self.grille = WP.poly_mask(px, py, self.GRILLE)
        mirrors = (((np.abs(px - cargeo.AXIS) - 245) / 28) ** 2 + ((py - 617) / 15) ** 2) < 1
        self.mirrors = mirrors & m
        head = (py < 195) & (np.abs(np.abs(px - cargeo.AXIS) - 165) < 45)
        low = py > 1296
        self.body = m & ~self.wind & ~self.rear & ~self.grille & ~self.mirrors & ~head & ~low
        T = np.zeros((self.R, self.N, 3), np.float32)
        for c in range(3):
            sharp = self.samp(self.photo[..., c], (0.9, 1.4))
            wide = self.samp(self.photo[..., c], (7.0, 7.0))
            T[..., c] = sharp + 0.30 * (sharp - wide)
        T = np.clip(T, 0, 1)
        lab = to_lab(T)
        L, A, B = lab[..., 0], lab[..., 1], lab[..., 2]
        # the shadows of the body are bottle green, as the car; the glass, the grille, the rubber stay dark and neutral
        Lb = np.interp(L, [0, 10, 25, 40, 55, 70, 100], [22, 25, 33, 42, 54, 70, 100])
        Lo = np.interp(L, [0, 8, 20, 35, 50, 70, 100], [16, 20, 28, 38, 50, 70, 100])
        deep = np.clip((42 - L) / 22, 0, 1) * self.body
        Ln = np.where(self.body, Lb, Lo)
        An = A * (1 - deep) + (-17.0) * deep
        Bn = B * (1 - deep) + (7.0) * deep
        seat = self.rear & (np.hypot(A, B) > 12)
        Ln = np.where(seat, L * 1.14 + 5, Ln)
        An = np.where(seat, A * 1.02, An)
        Bn = np.where(seat, B * 1.12, Bn)
        rseat = seat & (self.px > cargeo.AXIS)
        An = np.where(rseat, An * 1.3, An)
        Bn = np.where(rseat, Bn * 1.3, Bn)
        T = lab2lin(np.stack([Ln, An, Bn], -1)).astype(np.float32)
        side = m & ~(np.roll(m, 1, axis=1) & np.roll(m, -1, axis=1))
        T = np.where(side[..., None], T * 0.80, T)
        self.lock = -np.ones((self.R, self.N), np.int16)
        self.locks()
        return T

    def locks(self):
        """What a 5 mm brush can hold of the small things: geometry, not tone. Rings at least a short leg across (9 mm), a near-vertical line a single straight leg: the brush's best thing."""
        px, py, s = self.px, self.py, self.s
        F = {q[0]: i for i, q in enumerate(FIXED)}
        L = self.lock
        def line(pts, half):
            d = np.full_like(px, 1e9, dtype=np.float32)
            for a, b in zip(pts[:-1], pts[1:]):
                ax, ay = a
                bx, by = b
                vx, vy = bx - ax, by - ay
                u = np.clip(((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy + 1e-9), 0, 1)
                d = np.minimum(d, np.hypot(px - (ax + u * vx), py - (ay + u * vy)))
            return d * s < half
        # the chrome goes by the light: from the right, as the photo
        def chrome(mask):
            L[mask & (px < 230)] = F['chromeD']
            L[mask & (px >= 230) & (px < 450)] = F['chromeM']
            L[mask & (px >= 450)] = F['chrome']
        # the seam across the scuttle, darker where the wipers lie
        sm = line(self.SEAM, 4.5) & self.mask
        L[sm] = F['seam']
        L[sm & (px < 440)] = F['creaseD']
        # the bonnet's two creases: one bright, one dark
        L[line([(300, 280), (290, 478)], 2.5)] = F['creaseL']
        L[line([(448, 275), (458, 480)], 2.5)] = F['creaseD']
        # the steering wheel: the wood's ring, the hub
        ww = np.hypot((px - 278) / 62.0, (py - 600) / 43.0)
        inside = self.wind & ~self.ring(self.wind, 5.0)
        L[(np.abs(ww - 1) * 52 * s < 4.5) & inside] = F['wood']
        L[(np.hypot(px - 278, py - 603) * s < 11) & inside] = F['steel']
        # the chrome round the glass
        chrome(self.ring(self.wind, 4.5))
        chrome(self.ring(self.rear, 4.5))
        # the grille: louvres, whole rows of short legs, the middle bar one straight leg
        pitch = 8.7 / s
        rows = ((py - 1138) // pitch).astype(int)
        L[self.grille] = F['ink']
        L[self.grille & (rows % 2 == 1)] = F['louvre']
        L[self.grille & (np.abs(px - cargeo.AXIS) * s < 2.5)] = F['steel']
        # the headlights' domes
        for cx in (207, 539):
            q = (((px - cx) / 38.0) ** 2 + ((py - 180) / 17.0) ** 2 < 1) & self.mask
            L[q] = F['chromeD'] if cx < 300 else F['chrome']
        # the tail lights
        for t in self.TAILS:
            L[line(t, 4.5) & self.mask] = F['tail']
        # the bumper's strip, the door mirrors, the posts, the exhaust
        L[line([(258, 1296), (372, 1302), (480, 1296)], 4.5) & self.mask] = F['chromeM']
        L[self.mirrors] = F['creaseD']
        posts = (py > 1290) & (py < 1340) & ((np.abs(px - 245) < 14) | (np.abs(px - 493) < 14)) & self.mask
        L[posts] = F['ink']
        L[(py > 1325) & (np.abs(px - 267) < 10) & self.mask] = F['steel']

    def make_jars(self):
        lab = to_lab(self.target0)
        C1, _ = kmeans(lab[self.body & (self.lock < 0)][::3], self.KCLUSTERS - 10)
        C2, _ = kmeans(lab[self.mask & ~self.body & (self.lock < 0)][::2], 10, seed=5)
        C = np.vstack([C1, C2])
        C = C[np.argsort(-C[:, 0])]
        wanted = []
        for c in C:
            L, a, b = c
            chroma = np.hypot(a, b)
            if chroma > 8:
                ta, tb = -b / chroma, a / chroma
                d = 4.5 + 0.08 * chroma
                wanted += [np.array([L, a + d * ta, b + d * tb]), np.array([L, a - d * ta, b - d * tb])]
            else:
                wanted += [np.array([L, a + 2.0, b + 5.0]), np.array([L, a - 2.0, b - 5.0])]
        jars, errs = [], []
        for w in wanted:
            p, e = invert(lab2lin(np.array(w, np.float32)))
            jars.append(p)
            errs.append(e)
        # the same jar twice is one jar
        seen, uniq = set(), []
        for i, p in enumerate(jars):
            key = (p.hex, p.coats)
            if key not in seen:
                seen.add(key)
                uniq.append(p)
        self.fixed = []
        for name, hexv, coats in FIXED:
            p = jar(hexv, coats, name)
            p.name = name
            self.fixed.append(p)
        for i, p in enumerate(uniq):
            p.name = f'J{i + 1:02d}'
        uniq = self.fixed + uniq
        print('jars', len(uniq), 'two coats', sum(p.coats == 2 for p in uniq), 'inverse dE mean', round(float(np.mean(errs)), 1), 'max', round(float(np.max(errs)), 1), flush=True)
        return uniq

    def use(self, jars):
        self.pal = Palette(jars)
        P.clear()
        self.pids = []
        for i, p in enumerate(jars):
            pid = f'j{i}'
            P[pid] = p
            self.pids.append(pid)

    def plan(self):
        R, N, pal = self.R, self.N, self.pal
        grid = -np.ones((R, N), np.int16)
        form = -np.ones((R, N), np.int16)
        T = self.target
        taua, taub = thresholds(N, 3), thresholds(N, 7)
        carry = np.zeros((R, 3), np.float32)
        Lstar = to_lab(self.target0)[..., 0]
        rng = np.random.default_rng(4)
        paintrun.STEP_MAX = 7.0
        ban_body = np.zeros(pal.K, np.float32)
        ban_body[[i for i, q in enumerate(FIXED) if q[0] not in ('creaseL', 'creaseD', 'seam')]] = 400.0
        for c in range(N):
            m = self.mask[:, c]
            lab_rows, n = ndi.label(m)
            if n == 0:
                carry[:] = 0
                continue
            want = np.clip(T[:, c] + carry, 0, 1)
            lab = to_lab(want)
            na = ndi.gaussian_filter1d(rng.standard_normal(R).astype(np.float32), 30)
            nb = ndi.gaussian_filter1d(rng.standard_normal(R).astype(np.float32), 30)
            na, nb = na / (na.std() + 1e-6), nb / (nb.std() + 1e-6)
            fade = np.clip(lab[:, 0] / 100, 0, 1) ** 1.5
            lab2 = lab.copy()
            lab2[:, 1] += self.JIT[0] * (2 * taua[c] - 1 + 0.5 * na) * fade
            lab2[:, 2] += self.JIT[1] * (2 * taub[c] - 1 + 0.5 * nb) * fade
            lab2 *= WEIGHT
            applied = np.zeros((R, 3), np.float32)
            for i in range(1, n + 1):
                ii = np.where(lab_rows == i)[0]
                a0, b0 = ii[0], ii[-1] + 1
                key = self.lock[a0:b0, c].astype(np.int32) * 2 + self.body[a0:b0, c].astype(np.int32)
                cuts = [a0] + [int(q) + 1 for q in np.flatnonzero(np.diff(key)) + a0] + [b0]
                for u, v in zip(cuts[:-1], cuts[1:]):
                    if self.lock[u, c] >= 0:
                        grid[u:v, c] = self.lock[u, c]
                        applied[u:v] = want[u:v]
                        continue
                    bins = max(1, (v - u) // BIN)
                    edges = u + np.arange(bins + 1) * BIN
                    edges[-1] = v
                    lb = np.stack([lab2[edges[q]:edges[q + 1]].mean(axis=0) for q in range(bins)])
                    prev = grid[edges[:-1], c - 1].astype(int) if c > 0 else -np.ones(bins, int)
                    path = pal.segment(lb, self.LAM, prev, self.BETA, ban_body if self.body[u, c] else None)
                    for q in range(bins):
                        grid[edges[q]:edges[q + 1], c] = path[q]
                    q = u
                    while q < v:
                        e = q + 1
                        while e < v and grid[e, c] == grid[q, c]:
                            e += 1
                        applied[q:e] = pal.app(int(grid[q, c]), e - q)
                        q = e
            err = ndi.gaussian_filter1d((want - applied) * m[:, None], 4.0, axis=0)
            err = np.clip(err, -0.12, 0.12)
            Y = err @ np.array([0.2126, 0.7152, 0.0722], np.float32)
            err = err - 0.75 * Y[:, None]
            dark = lab[:, 0] < 42
            err[dark] = np.clip(err[dark], -0.04, 0.04)
            if c < N - 1:
                gate = (np.abs(Lstar[:, c + 1] - Lstar[:, c]) < 14) & self.mask[:, c + 1]
                carry = self.GAIN * err * gate[:, None]
        lums = np.array([P[p].lum for p in self.pids] + [2.0])
        form[self.mask] = 0
        form[self.mask & (lums[grid] < 0.03)] = 1
        form[self.lock >= 0] = 1
        self.grid, self.form = grid, form
        return self

    def prune(self):
        """A jar for a handful of legs is not worth mixing (the owner on OPM-N, 2026-11-02: "the colours can be cut"): out, and plan again."""
        lens = np.zeros(self.pal.K)
        legs = np.zeros(self.pal.K, int)
        for c in range(self.N):
            col = self.grid[:, c]
            cuts = np.flatnonzero(np.diff(col)) + 1
            for a, b in zip(np.r_[0, cuts], np.r_[cuts, self.R]):
                if col[a] >= 0:
                    legs[col[a]] += 1
                    lens[col[a]] += (b - a) / 1000
        keep = [p for k, p in enumerate(self.pal.jars) if k < len(FIXED) or (legs[k] >= self.MIN_LEGS and lens[k] >= self.MIN_LINE)]
        dropped = self.pal.K - len(keep)
        if dropped:
            self.use(keep)
        return dropped

    def residual_loop(self, img_srgb, ppm, gain=0.6):
        lin = srgb2lin(img_srgb * 255).astype(np.float32)
        out = np.zeros_like(self.target0)
        yy = (np.arange(self.R)[:, None] + MARGIN + 0.5) * ppm * np.ones((1, self.N))
        xx = self.xs[None, :] * ppm * np.ones((self.R, 1))
        for c in range(3):
            f = ndi.uniform_filter(lin[..., c], (int(6 * ppm), int(PITCH * ppm)))
            out[..., c] = ndi.map_coordinates(f, [yy, xx], order=1)
        free = self.mask & (self.lock < 0)
        m = free[..., None].astype(np.float32)
        wt = ndi.gaussian_filter(m[..., 0], (5, 1.0))
        blur = lambda a: ndi.gaussian_filter(a * m, (5, 1.0, 0)) / np.maximum(wt[..., None], 1e-3)
        A, B = blur(self.target0), blur(out)
        la, lb = to_lab(A), to_lab(B)
        dE = np.sqrt(((la - lb) ** 2).sum(axis=2))[free]
        self.target = np.clip(self.target + gain * (A - B) * m, 0, 1)
        self.target = np.clip(self.target, self.target0 * 0.7, self.target0 + 0.10)
        dL = (lb - la)[..., 0][free]
        ca, cb = np.hypot(la[..., 1], la[..., 2])[free], np.hypot(lb[..., 1], lb[..., 2])[free]
        return float(dE.mean()), float(np.percentile(dE, 90)), float(dL.mean()), float(ca.mean()), float(cb.mean())


def paint_all(pl, ppm, seed=11):
    """paintrun's painter, every jar as many coats as it asks for, a coat's legs laid again over its own."""
    t0 = time.time()
    spans = paintrun.spans_of(pl)
    runs = paintrun.build_runs(pl, spans)
    sim = Sim(pl.W, pl.H, ppm=ppm, seed=seed)
    order = sorted(range(len(pl.pids)), key=lambda i: -P[pl.pids[i]].lum)
    st = dict(per={}, line=0.0, idle=0.0, legs=0, runs=0, dips=0.0, shortlegs=0)
    idle_step = PITCH * paintrun.IDLE_RATIO
    for pi in order:
        rs = runs.get(pi, [])
        if not rs:
            continue
        paint = P[pl.pids[pi]]
        line = idle_line = 0.0
        legs = 0
        for coat in range(paint.coats):
            T = np.zeros((sim.h, sim.w), np.float32)
            for run in rs:
                s = float(sim.rng.uniform(0, 40)) if coat else 0.0
                for k, (sp, d) in enumerate(run):
                    f = pl.forms[sp['f']] if sp['f'] >= 0 else {}
                    dose = f.get('dose', 1.0)
                    L = sp['yb'] - sp['ya']
                    first, last = k == 0, k == len(run) - 1
                    solid = L < 14
                    cap_in = 'turn' if (solid or not first) else 'free'
                    cap_out = 'turn' if (solid or not last) else 'free'
                    if d > 0:
                        sim.leg(T, sp['x'], sp['ya'], sp['yb'], s, s + L, cap_in, cap_out, dose=dose, solid=solid)
                    else:
                        sim.leg(T, sp['x'], sp['ya'], sp['yb'], s + L, s, cap_out, cap_in, dose=dose, solid=solid)
                    s += L
                    line += L
                    st['dips'] += L / 95.0
                    if coat == 0:
                        legs += 1
                        if L < 12:
                            st['shortlegs'] += 1
                    if not last:
                        nx, nd = run[k + 1]
                        end = sp['yb'] if d > 0 else sp['ya']
                        start = nx['ya'] if nd > 0 else nx['yb']
                        side = 1 if d > 0 else -1
                        load = float(sim.loader.load(np.array(s))) * dose
                        sim.turn(T, sp['x'], end - side * 2.0, nx['x'], start + (2.0 if nd > 0 else -2.0), side, min(load, 1.3))
                        stp = np.hypot(nx['x'] - sp['x'], start - end)
                        s += stp
                        line += stp
                f = pl.forms[run[0][0]['f']] if run[0][0]['f'] >= 0 else {}
                if f.get('idle') and len(run) >= 3 and coat == paint.coats - 1:
                    bycol = {}
                    for sp, d in run:
                        bycol.setdefault(sp['c'], []).append(sp)
                    cols = sorted(bycol)
                    x, xend = bycol[cols[0]][0]['x'], bycol[cols[-1]][0]['x']
                    while x <= xend + 1e-6:
                        c = int(round((x - pl.xs[0]) / PITCH))
                        for sp in bycol.get(c, []):
                            if (c - 1 in bycol or c + 1 in bycol) and sp['yb'] - sp['ya'] > 14:
                                sim.leg(T, x, sp['ya'] - 0.5, sp['yb'] + 0.5, 300, 300 + sp['yb'] - sp['ya'], 'free', 'free', dose=0.5, idle=True)
                                idle_line += sp['yb'] - sp['ya']
                        x += idle_step
            sim.lay(T, paint)
            del T
        st['per'][pl.pids[pi]] = dict(legs=legs, line_m=round(line / 1000, 2), runs=len(rs), coats=paint.coats, hex=paint.hex)
        st['line'] += line
        st['idle'] += idle_line
        st['legs'] += legs
        st['runs'] += len(rs) * paint.coats
    return sim.finish(), st


def save(img, path):
    Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).save(path, quality=93, subsampling=0)


if __name__ == '__main__':
    ppm = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    loops = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    out = sys.argv[3] if len(sys.argv) > 3 else 'car_try.jpg'
    t0 = time.time()
    car = Car()
    print('columns', car.N, 'scale mm/px', round(car.s, 3), 'car cells', int(car.mask.sum()), 'car width mm', int(car.mask.any(axis=0).sum() * PITCH), flush=True)
    car.use(car.make_jars())
    print('jars ready', round(time.time() - t0), 's', flush=True)
    car.plan()
    for _ in range(2):
        d = car.prune()
        print('pruned', d, 'left', car.pal.K, flush=True)
        if not d:
            break
        car.plan()
    for i in range(loops + 1):
        final = i == loops
        img, st = paint_all(car, ppm if final else 3)
        d = car.residual_loop(img, ppm if final else 3, gain=0.0 if final else 0.6)
        print(f'pass {i}: dE mean {d[0]:.1f}, p90 {d[1]:.1f}, L* off {d[2]:+.1f}, chroma aim {d[3]:.1f} painted {d[4]:.1f}  [{time.time()-t0:.0f}s]', flush=True)
        if not final:
            car.plan()
    save(img, out)
    two = sum(1 for p in st['per'].values() if p['coats'] == 2)
    twom = sum(p['line_m'] for p in st['per'].values() if p['coats'] == 2)
    print('two-coat jars take', round(twom, 1), 'm of the line, half of it the second coat', flush=True)
    print('legs', st['legs'], 'lifts', st['runs'], 'line m', round(st['line'] / 1000, 1), 'idle m', round(st['idle'] / 1000, 1), 'dips', int(st['dips']), 'short<12', st['shortlegs'], 'jars', len(st['per']), 'two-coat jars', two)
    pickle.dump(dict(grid=car.grid, form=car.form, st=st, jars=[(p.name, p.hex, p.coats) for p in car.pal.jars]), open(out + '.pkl', 'wb'))
