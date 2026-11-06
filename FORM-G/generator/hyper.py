#!/usr/bin/env python3
"""OPM-G study: the watch as hyperrealism on 60 x 80, the brush of watch_60x80.jpg, no outlines, no background: bare canvas.
All 54 shades (PRISMA_PENCILS, est.) open to every column. Each column picks its chain of paints by dynamic programming against the photo's colour
(a switch costs, a span no shorter than LMIN), what it could not reach goes on to the next column: so neighbouring columns of neighbouring shades mix by eye."""
import json, os, pickle, sys, time
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from brushsim import Paint, Sim, srgb2lin, lin2srgb, hex2rgb
import watchplan as WP
from watchplan import P, PITCH, MARGIN, thresholds
import watchgeo as G
import clean_photo
import paintrun
from distance_core import to_lab

PAL = json.load(open('palette54.json')) + [dict(id='tapeturq', name='Turquoise', hex='#31E2CA', code=''), dict(id='lavender', name='Lavender', hex='#A9ADD8', code=''),
    dict(id='lightgray', name='Light grey', hex='#B0B2B4', code=''), dict(id='greyn5', name='Grey N5', hex='#747983', code=''), dict(id='darkgray', name='Dark grey', hex='#464A52', code='')]
P.clear()
for q in PAL:
    lum = float(srgb2lin(hex2rgb(q['hex'])) @ np.array([0.2126, 0.7152, 0.0722], np.float32))
    P[q['id']] = Paint(q['name'], q['hex'], 0.26 + 0.36 * (1 - lum) ** 2, 0.30)   # est.: pale paints cover soon; the film by the same formula as before
PIDS = list(P)
K = len(PIDS)
LS = np.array([10, 16, 25, 40, 70, 130], np.float32)


def apparent_by_length():
    """What a leg reads as, by its length: film and ridges averaged on a little snake. A long leg is paler, a short one is the paint itself."""
    cache = 'apparentL.pkl'
    if os.path.exists(cache):
        t = pickle.load(open(cache, 'rb'))
        if set(t) == set(PIDS):
            return t
    table = {}
    for pid in PIDS:
        rows = []
        for L in LS:
            sim = Sim(60, int(L) + 30, ppm=4, seed=21)
            T = np.zeros((sim.h, sim.w), np.float32)
            s = 0.0
            for i in range(8):
                x = 12 + i * PITCH
                if i % 2 == 0:
                    sim.leg(T, x, 15, 15 + L, s, s + L, 'turn', 'turn', solid=L < 14)
                else:
                    sim.leg(T, x, 15, 15 + L, s + L, s, 'turn', 'turn', solid=L < 14)
                s += L + PITCH
            sim.lay(T, P[pid])
            crop = sim.R[int(15 * 4):int((15 + L) * 4), int((12 + 2 * PITCH - 2.5) * 4):int((12 + 5 * PITCH + 2.5) * 4)]
            rows.append(crop.reshape(-1, 3).mean(axis=0))
        table[pid] = np.array(rows)
    pickle.dump(table, open(cache, 'wb'))
    return table


APP = apparent_by_length()
APP_ALL = np.stack([APP[p] for p in PIDS])       # K, len(LS), 3


def app_of(k, L):
    """The apparent colour of paint k in a leg of length L."""
    x = np.log(np.clip(L, LS[0], LS[-1]))
    lg = np.log(LS)
    i = int(np.clip(np.searchsorted(lg, x) - 1, 0, len(LS) - 2))
    u = (x - lg[i]) / (lg[i + 1] - lg[i])
    return APP_ALL[k, i] * (1 - u) + APP_ALL[k, i + 1] * u


BIN = 2                       # mm: a column is planned in steps of this
LBINS = [4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 60, 75, 90, 120, 160, 200, 250, 320]
WEIGHT = np.array([1.35, 0.45, 0.45], np.float32)   # lightness first: the form reads by tone, the colour lives on top of it
A_LAB = [to_lab(np.stack([app_of(k, l * BIN) for k in range(K)]).astype(np.float32)) * WEIGHT for l in LBINS]
A_NORM = [(A * A).sum(axis=1) for A in A_LAB]
SHORT_PEN = [np.maximum(0.0, np.hypot(A[:, 1] / WEIGHT[1], A[:, 2] / WEIGHT[2]) - 9.0) ** 2 * (1.6 if l * BIN <= 16 else 0.0) for l, A in zip(LBINS, A_LAB)]


def dp_segment(lab, lam, prev, beta, ban, steel=False):
    """The cheapest chain of paints along one stretch of a column, a paint judged by what it comes to at that leg's length.
    lab: n x 3 of weighted Lab per bin. prev: the paint in the column before, per bin (-1 none); beta: what continuing it earns. ban: K, a price per bin."""
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
        d = lab[:, None, :] - A_LAB[j][None, :, :]
        cost = (d * d).sum(axis=(0, 2)) + ban * n - beta * aff[n]
        return np.full(n, int(cost.argmin()))
    # for every length: the best paint for a run ending at every bin
    D, Pk = {}, {}
    for j, l in enumerate(LBINS):
        if l > n:
            break
        d1 = S1[l:] - S1[:-l]
        d2 = S2[l:] - S2[:-l]
        c = d2[:, None] - 2 * (d1 @ A_LAB[j].T) + l * A_NORM[j][None, :] + ban[None, :] * l - beta * (aff[l:] - aff[:-l])
        if steel:
            c = c + l * SHORT_PEN[j][None, :]
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
        if l == 0:           # a stretch no chain reaches exactly: fill it with the nearest
            out[:r] = out[r] if r < n else 0
            break
        out[r - l:r] = k
        r -= l
    return out


class Hyper:
    W, H, s = 600, 800, 0.385
    RIB = 80.0        # mm: the dial's dips in rows, as watch_60x80.jpg, est.
    LAM = 1500.0      # the price of a switch along a column
    BETA = 30.0       # what continuing the neighbour's paint earns, per bin: snakes and combs, the technique of watch_60x80.jpg
    GREY_TAX = 35.0   # per bin, in weighted dE^2
    GAIN = 0.72       # what a column could not reach goes on to the next
    JIT = dict(steel=(5.0, 9.0), dial=(1.6, 1.6))    # the chroma jitter by column, a* and b*: warm and cool greys side by side, the texture; none in the dark
    DIAL = ['tapeturq', 'cloudblue', 'skylight', 'lightaqua', 'lightcerulean', 'sky', 'caribbean', 'turquoise', 'jade', 'palesage',
            'white', 'coolgrey20', 'lightgray', 'greyn5', 'grey', 'darkgray', 'indigo', 'peacockblue']

    def __init__(self, seed=4):
        self.N = int((self.W - 2 * MARGIN) / PITCH)
        self.x0 = (self.W - self.N * PITCH) / 2
        self.R = int(self.H - 2 * MARGIN)
        self.xs = self.x0 + PITCH * (np.arange(self.N) + 0.5)
        self.ys = MARGIN + np.arange(self.R) + 0.5
        X, Y = np.meshgrid(self.xs, self.ys)
        self.px = 823 + (X - self.W / 2) / self.s
        self.py = 1018 + (Y - self.H / 2) / self.s
        self.pids = PIDS
        self.forms = [dict(name='steel', idle=True, dose=1.0), dict(name='dial', air=True, rib=self.RIB, dose=1.15), dict(name='dark', idle=False, dose=1.3)]
        self.rng = np.random.default_rng(seed)
        self.geo = G.load()
        self.photo = srgb2lin(clean_photo.clean() * 255).astype(np.float32)
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

    def zoned_photo(self):
        """The photo smoothed inside each of the watch's zones and never across them: the bezel's flat calm, the polished ring and the links crisp at their edges."""
        ph = self.photo
        h, w = ph.shape[:2]
        Yp, Xp = np.mgrid[0:h, 0:w].astype(np.float32)
        sup = lambda a, b, n: (np.abs(Xp - 810.0) / a) ** n + (np.abs(Yp - 896.0) / b) ** n < 1
        watch = self.geo['watch']
        dial, inner, outer = sup(376, 374, 3.1), sup(430, 445, 3.1), sup(483, 495, 3.3)
        links = []
        anyl = np.zeros((h, w), bool)
        for x0, y0, x1, y1 in WP.Plan.LINKS:
            q = (Xp >= x0) & (Xp <= x1) & (Yp >= y0) & (Yp <= y1) & watch
            links.append(q)
            anyl |= q
        zones = [(dial, (1.4, 1.4)), (inner & ~dial & watch, (9.0, 9.0)), (outer & ~inner & watch, (2.5, 2.5))]
        zones += [(q, (3.2, 5.0)) for q in links]
        rest = watch & ~outer & ~anyl
        edges = [0] + WP.Plan.GAPS + [h]
        for u, v in zip(edges[:-1], edges[1:]):
            zones.append((rest & (Yp >= u) & (Yp < v), (3.0, 4.0)))
        Z = np.ones_like(ph)
        for mask, sig in zones:
            ys, xs = np.where(mask)
            if len(ys) == 0:
                continue
            pad = int(4 * max(sig) / self.s) + 2
            y0, y1, x0, x1 = max(0, ys.min() - pad), min(h, ys.max() + pad), max(0, xs.min() - pad), min(w, xs.max() + pad)
            mm = mask[y0:y1, x0:x1].astype(np.float32)
            sg = (sig[0] / self.s, sig[1] / self.s)
            wt = np.maximum(ndi.gaussian_filter(mm, sg), 1e-3)
            for c in range(3):
                v = ndi.gaussian_filter(ph[y0:y1, x0:x1, c] * mm, sg) / wt
                Z[y0:y1, x0:x1, c][mask[y0:y1, x0:x1]] = v[mask[y0:y1, x0:x1]]
        return Z

    def make_target(self):
        self.watch = self.samp(self.geo['watch'], (0.5, 0.5)) > 0.5
        self.dialm = (np.abs(self.px - 810.0) / 376.0) ** 3.1 + (np.abs(self.py - 896.0) / 374.0) ** 3.1 < 1
        Z = self.zoned_photo()
        T = np.stack([ndi.map_coordinates(Z[..., c], [self.py, self.px], order=0, mode='nearest') for c in range(3)], axis=-1).astype(np.float32)
        T = np.clip(T, 0, 1)
        # a measure of chrome's contrast on the steel: the hyperrealist's curve, in L*, chroma kept; the photo stays the aim
        steel = self.watch & ~self.dialm
        L = to_lab(T)[..., 0]
        Ln = np.interp(L, [0, 30, 50, 70, 80, 88, 94, 98, 100], [0, 20, 38, 58, 70, 81, 90, 96, 100])
        def Y_of(v):
            f = (v + 16) / 116
            return np.where(f > 6 / 29, f ** 3, 3 * (6 / 29) ** 2 * (f - 4 / 29))
        ratio = Y_of(Ln) / np.maximum(Y_of(L), 1e-4)
        T = np.where(steel[..., None], np.clip(T * ratio[..., None], 0, 1), T)
        # the darks the eye needs and a 5 mm brush can hold, by tone: the form's sides, round the dial, the gaps between links, under the polished pieces
        w = self.watch
        side = w & ~(np.roll(w, 1, axis=1) & np.roll(w, -1, axis=1))
        T = np.where(side[..., None], T * 0.62, T)
        rim = self.ring(self.dialm, 5.0, outside=True) & w
        T = np.where(rim[..., None], np.minimum(T, 0.05), T)
        outer = (np.abs(self.px - 810.0) / 483.0) ** 3.3 + (np.abs(self.py - 896.0) / 495.0) ** 3.3 < 1
        anyl = np.zeros_like(w)
        ends = (self.py < 62) | (self.py > 1935)
        T = np.where((ends & w)[..., None], T ** 0.5, T)
        for x0, y0, x1, y1 in WP.Plan.LINKS:
            q = (self.px >= x0) & (self.px <= x1) & (self.py >= y0) & (self.py <= y1)
            anyl |= q
            T = np.where(q[..., None], np.clip(T ** 0.62 * 1.08, 0, 1), T)
            bot = q & (self.py > y1 - 5.0 / self.s)
            T = np.where(bot[..., None], T * 0.28, T)
        gap = np.zeros_like(w)
        for y in WP.Plan.GAPS:
            gap |= (np.abs(self.py - y) * self.s < 3.0) & w & ~anyl & ~outer
        T = np.where(gap[..., None], T * 0.22, T)
        self.lock = -np.ones((self.R, self.N), np.int16)
        self.furniture()
        return T

    def furniture(self):
        """Hands, batons, pivot, date, the second hand and the minute track: geometry, the sizes of watch_60x80.jpg, what a 5 mm brush can hold of them."""
        px, py, s = self.px, self.py, self.s
        black, white, ind = PIDS.index('black'), PIDS.index('white'), PIDS.index('peacockblue')
        def half(w):
            return max(w * s / 2 + 1.5, 7.5)
        hand_d = np.full_like(px, 1e9, dtype=np.float32)
        for a, b, w in G.HANDS:
            hand_d = np.minimum(hand_d, G.seg_dist(px, py, a, b) * s - half(w))
        def lay(bars, keep):
            outer = np.zeros_like(self.dialm)
            inner = np.zeros_like(self.dialm)
            for a, b, w in bars:
                d = G.seg_dist(px, py, a, b) * s
                outer |= d < half(w)
                inner |= d < max(half(w) - 4.5, 3.0)
            if keep:
                outer &= hand_d > 6.0
                inner &= hand_d > 6.0
            self.lock[outer & self.dialm] = black
            for c in range(self.N):
                lab, n = ndi.label(inner[:, c] & self.dialm[:, c])
                for i in range(1, n + 1):
                    ii = np.where(lab == i)[0]
                    if len(ii) >= 6:
                        self.lock[ii, c] = white
        lay(G.BATONS, True)
        lay(G.HANDS, False)
        (x0, y0), (x1, y1) = G.DATE
        pad = 2.0 / s
        box = (px >= x0 - pad) & (px <= x1 + pad) & (py >= y0 - pad) & (py <= y1 + pad)
        self.lock[box] = black
        inner = (px >= x0 + 2.0 / s) & (px <= x1 - 2.0 / s) & (py >= y0 + 6.4 / s) & (py <= y1 - 6.4 / s)
        self.lock[inner] = white
        self.c_sec = int(np.argmin(np.abs(px[0] - G.SECOND[0][0])))
        self.sec_rows = (py[:, self.c_sec] >= G.SECOND[0][1]) & (py[:, self.c_sec] <= G.SECOND[1][1])
        self.lock[self.sec_rows, self.c_sec] = black
        (ppx, ppy), pr = G.PIVOT
        self.lock[np.hypot(px - ppx, py - ppy) * s < max(pr * s, 10.0)] = black
        for i in range(60):
            if i % 5 == 0:
                continue
            th = 2 * np.pi * i / 60
            u, v = np.sin(th), -np.cos(th)
            q = (np.abs(u / 376.0) ** 3.1 + np.abs(v / 374.0) ** 3.1) ** (-1 / 3.1) * 0.925
            dx, dy = 810 + q * u, 896 + q * v
            c = int(np.argmin(np.abs(px[0] - dx)))
            rr = int(np.argmin(np.abs(py[:, 0] - dy)))
            self.lock[max(0, rr - 5):rr + 5, c] = ind

    def plan(self):
        R, N = self.R, self.N
        grid = -np.ones((R, N), np.int16)
        form = -np.ones((R, N), np.int16)
        T = self.target
        paintrun.STEP_MAX = 7.0       # no long hooks in a tonal picture: a far step lifts
        taua, taub = thresholds(N, 3), thresholds(N, 7)
        carry = np.zeros((R, 3), np.float32)
        Lstar = to_lab(self.target0)[..., 0]
        ban_dial = np.array([0.0 if p in self.DIAL else 1e4 for p in PIDS], np.float32)
        # a tax on the neutrals on the steel: where a tinted shade of the same lightness will do, it goes in, and the next columns balance its tint
        ban_none = np.array([self.GREY_TAX if p in ('coolgrey20', 'warmgrey20', 'frenchgrey20', 'lightgray', 'grey', 'greyn5', 'darkgray') else 0.0 for p in PIDS], np.float32)
        rng = np.random.default_rng(4)
        for c in range(N):
            m = self.watch[:, c]
            lab_rows, n = ndi.label(m)
            want = np.clip(T[:, c] + carry, 0, 1)
            lab = to_lab(want)
            na = ndi.gaussian_filter1d(rng.standard_normal(R).astype(np.float32), 30)
            nb = ndi.gaussian_filter1d(rng.standard_normal(R).astype(np.float32), 30)
            na, nb = na / (na.std() + 1e-6), nb / (nb.std() + 1e-6)
            d = self.dialm[:, c]
            fade = np.clip(lab[:, 0] / 100, 0, 1) ** 1.5          # no jitter in the dark
            ja = np.where(d, self.JIT['dial'][0], self.JIT['steel'][0]) * (2 * taua[c] - 1 + 0.5 * na) * fade
            jb = np.where(d, self.JIT['dial'][1], self.JIT['steel'][1]) * (2 * taub[c] - 1 + 0.5 * nb) * fade
            lab2 = lab.copy()
            lab2[:, 1] += ja
            lab2[:, 2] += jb
            lab2 *= WEIGHT
            applied = np.zeros((R, 3), np.float32)
            for i in range(1, n + 1):
                ii = np.where(lab_rows == i)[0]
                a, b = ii[0], ii[-1] + 1
                key = d[a:b].astype(np.int32) * 1000 + self.lock[a:b, c]
                cuts = [a] + [int(q) + 1 for q in np.flatnonzero(np.diff(key)) + a] + [b]
                for u, v in zip(cuts[:-1], cuts[1:]):
                    if self.lock[u, c] >= 0:
                        grid[u:v, c] = self.lock[u, c]
                        applied[u:v] = want[u:v]
                        continue
                    nb_bins = max(1, (v - u) // BIN)
                    edges = u + np.arange(nb_bins + 1) * BIN
                    edges[-1] = v
                    lb = np.stack([lab2[edges[q]:edges[q + 1]].mean(axis=0) for q in range(nb_bins)])
                    prev = (grid[edges[:-1], c - 1].astype(int) if c > 0 else -np.ones(nb_bins, int))
                    path = dp_segment(lb, self.LAM, prev, self.BETA, ban_dial if d[u] else ban_none, steel=not d[u])
                    for q in range(nb_bins):
                        grid[edges[q]:edges[q + 1], c] = path[q]
                    q = u
                    while q < v:
                        e = q + 1
                        while e < v and grid[e, c] == grid[q, c]:
                            e += 1
                        applied[q:e] = app_of(int(grid[q, c]), e - q)
                        q = e
            err = (want - applied) * m[:, None]
            err = ndi.gaussian_filter1d(err, 4.0, axis=0)
            err = np.clip(err, -0.22, 0.22)
            dark = lab[:, 0] < 42
            err[dark] = err[dark].mean(axis=1, keepdims=True)
            if c < N - 1:
                gate = (np.abs(Lstar[:, c + 1] - Lstar[:, c]) < 12) & self.watch[:, c + 1] & (self.dialm[:, c + 1] == d)
                if c == self.c_sec or c + 1 == self.c_sec:
                    gate = gate & ~self.sec_rows
                carry = self.GAIN * err * gate[:, None]
        lums = np.array([P[p].lum for p in PIDS] + [2.0])
        lg = lums[grid]
        form[self.watch] = 0
        form[self.watch & self.dialm] = 1
        form[self.watch & (lg < 0.045)] = 2
        form[self.lock >= 0] = 2
        self.grid, self.form = grid, form
        return self

    def residual_loop(self, img_srgb, ppm, gain=0.6):
        """Compare what the paint came to with the photo, at about 10 mm, and move the target by the difference."""
        lin = srgb2lin(img_srgb * 255).astype(np.float32)
        out = np.zeros_like(self.target0)
        for c in range(3):
            f = ndi.uniform_filter(lin[..., c], (int(6 * ppm), int(PITCH * ppm)))
            out[..., c] = ndi.map_coordinates(f, [(np.arange(self.R)[:, None] + MARGIN + 0.5) * ppm * np.ones((1, self.N)), self.xs[None, :] * ppm * np.ones((self.R, 1))], order=1)
        m = (self.watch & (self.lock < 0))[..., None].astype(np.float32)
        def blur(a):
            w = ndi.gaussian_filter(m[..., 0], (5, 1.0))
            return ndi.gaussian_filter(a * m, (5, 1.0, 0)) / np.maximum(w[..., None], 1e-3)
        A, B = blur(self.target0), blur(out)
        labA, labB = to_lab(A), to_lab(B)
        free = self.watch & (self.lock < 0)
        dE = np.sqrt(((labA - labB) ** 2).sum(axis=2))[free]
        self.target = np.clip(self.target + gain * (A - B) * m, 0, 1)
        self.meanA = (lin2srgb(A[free & self.dialm].mean(0)) * 255).round()
        self.meanB = (lin2srgb(B[free & self.dialm].mean(0)) * 255).round()
        return float(np.mean(dE)), float(np.percentile(dE, 90)), float((labB - labA)[..., 0][free].mean())


def save(img, path):
    Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).save(path, quality=93, subsampling=0)


if __name__ == '__main__':
    ppm = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    loops = int(sys.argv[2]) if len(sys.argv) > 2 else 0
    out = sys.argv[3] if len(sys.argv) > 3 else 'hyper_try.jpg'
    t0 = time.time()
    h = Hyper()
    print('palette', K, 'target ready', round(time.time() - t0), 's', flush=True)
    for i in range(loops + 1):
        h.plan()
        print('plan', i, round(time.time() - t0), 's', flush=True)
        final = i == loops
        img, st = paintrun.paint(h, ppm if final else 3)
        if not final:
            d = h.residual_loop(img, 3)
            print(f'loop {i}: dE mean {d[0]:.1f}, p90 {d[1]:.1f}, mean L* off {d[2]:+.1f}', flush=True)
    save(img, out)
    d = h.residual_loop(img, ppm, gain=0)
    used = sorted(st['per'], key=lambda p: -st['per'][p]['line_m'])
    print(f'final: dE mean {d[0]:.1f}, p90 {d[1]:.1f}, mean L* off {d[2]:+.1f}; dial target {h.meanA}, painted {h.meanB}')
    print('columns', h.N, 'legs', st['legs'], 'runs', st['runs'], 'line m', round(st['line'] / 1000, 1), 'idle m', round(st['idle'] / 1000, 1), 'dips', int(st['dips']), 'short<12', st['shortlegs'], 'paints used', len(used), 'of', K)
    print(' '.join(f"{P[p].name}:{st['per'][p]['line_m']}" for p in used))
    pickle.dump(dict(grid=h.grid, form=h.form, target=h.target, st={k: st[k] for k in ('legs', 'runs', 'line', 'idle', 'dips', 'shortlegs')}, used=used, per=st['per']), open(out + '.pkl', 'wb'))
