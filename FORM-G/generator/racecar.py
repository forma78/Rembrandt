#!/usr/bin/env python3
"""FORM-G: the red racing 911 from the front on 60 × 60, 54 cm across, in the green 911's place (the owner, 2026-11-10: "the frontal racing Porsche's face";
"we make the face right now, in place of the green"; FORM-G "works out its own size, and it does not scale").

redcar.py's RedCar — hyper2.py's technique: jars made to measure in pairs of neighbouring shades, every column solved against the picture, what it could not reach
carried to the next, passes against the render — on racegeo.py's geometry, the parts read off the picture and made symmetric about the axis. As the red classic's:
no leg across a part's edge or a seam, and the seams given by colour, not a stroke (the owner and Kuzya, 2026-11-08, "no more fat lines"): a seam across a column
cuts it, its darker side taken down next to it; a seam running along a column, that column's piece of it a shade darker. The seams are the picture's own thin lines
(racegeo.py), not drawn by hand.

The banner's PORSCHE as a hint (the owner, 2026-11-10: "the letters as if not there, but you know what is written"; his LEGO/ Mona Lisa and Van Gogh: "hellish pixels
… but the pictures are there; OPM in its purest form"): every column through the letters one leg the letters' height, its grey by how much of the column the
letters' white takes — a column through an upright stroke light, through the bars alone a darker grey, between the letters the strip's black. RECARO and the
seat's crest left to the tones ("not scary, just gradation"). The crest on the bonnet off (racegeo.py), a mark of two columns in its place (BADGE)."""
import sys
import numpy as np
from scipy import ndimage as ndi
import hyper2 as H
from hyper2 import lab2lin, kmeans, invert, jar
from distance_core import to_lab
from watchplan import P, PITCH, MARGIN, thresholds
import paintrun
import racegeo
import redcar
from redcar import RedCar, main

# the jars geometry holds; the others made to measure. The neon is the owner's own fluorescent lemon ("yes, I have a fluorescent yellow; lemon, really fierce"),
# a jar as it comes; the greys of the banner's letters, the headlights' bar and the cup; the ink, the carbon; the seams' deep red
RACE_FIXED = [('chrome', '#E6E5DF', 1), ('chromeM', '#C6C6C1', 1), ('chromeD', '#9B9C9A', 1), ('ink', '#0C0C0C', 2), ('carbon', '#2B2B2C', 1), ('neon', '#EEED08', 1),
              ('seam', '#3C0608', 2)]
PARTS = ['wing', 'wind', 'mirrors', 'heads', 'vents', 'neon', 'lower']


def segment_var(pal, lab, lams, prev, beta, ban):
    """hyper2's Palette.segment, a cut's cost its own at every bin (lams[i]: a run starting at bin i) — dear on flat paint, cheap where the form turns"""
    K, n = pal.K, len(lab)
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
    if n < H.LBINS[0]:
        j = int(np.argmin(np.abs(np.array(H.LBINS) - n)))
        d = lab[:, None, :] - pal.A_LAB[j][None, :, :]
        return np.full(n, int(((d * d).sum(axis=(0, 2)) + ban * n - beta * aff[n]).argmin()))
    D, Pk = {}, {}
    for j, l in enumerate(H.LBINS):
        if l > n:
            break
        d1 = S1[l:] - S1[:-l]
        d2 = S2[l:] - S2[:-l]
        c = d2[:, None] - 2 * (d1 @ pal.A_LAB[j].T) + l * pal.A_NORM[j][None, :] + ban[None, :] * l - beta * (aff[l:] - aff[:-l])
        Pk[l] = c.argmin(axis=1)
        D[l] = c.min(axis=1)
    ls = sorted(D)
    dp = [1e18] * (n + 1)
    back = [(0, 0)] * (n + 1)
    dp[0] = -float(lams[0])
    for r in range(H.LBINS[0], n + 1):
        bv, bl = 1e18, 0
        for l in ls:
            if l > r:
                break
            v = dp[r - l]
            if v >= 1e17:
                continue
            v = v + float(lams[r - l]) + D[l][r - l]
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


def band(Lg, m, lo, hi):
    """a grid's L* (rows 1 mm, columns 5 mm) between lo and hi mm, within the mask"""
    w = m.astype(np.float32)
    f = lambda a, s: ndi.gaussian_filter(a * w, (s, s / PITCH)) / np.maximum(ndi.gaussian_filter(w, (s, s / PITCH)), 1e-3)
    return f(Lg, lo) - f(Lg, hi)


class RaceFace(RedCar):
    FIXED = RACE_FIXED
    SEAM = 'seam'
    KEEP = 'porsche-race.jars.json'
    W, H = 600, 600
    WIDTH_MM = 540.0            # the car across, the mirrors' and the canards' outsides: 30 mm of canvas each side; the carriage's span 535 mm of the 568 across (Y)
    WIDEN = 1.0
    KCLUSTERS = 40              # 28 of the body's reds, 12 of the rest, in pairs, before the jars with next to nothing to paint go
    MIN_LEGS, MIN_LINE = 4, 0.10
    CROSS = 5                   # a seam's piece in a column at most so many mm long crosses it; longer, it runs along the column
    LETTERS = (0.55, 0.30)      # a column's share of the letters' white over their height: at least the first, chromeM (an upright); the second, chromeD (the bars); less, the strip's black (est.)
    BADGE = 'chromeD'           # the mark in the crest's place, two columns about the axis: a grey of metal, so it is not one with the black triangle above it
    AMBER_MM = None
    GLASS = (0.9, 1.4)          # through the glass, the picture read so wide, mm (along, across): as the body, sharp — 2.5 the first evening dissolved the cage (Kuzya) (est.)
    # the volume and the gloss (Kuzya, 2026-11-10, of the first try: "the photograph of the racing Porsche turned into a rather flat graphic illustration"; "for a glossy
    # body not only steps of red are needed: cool reflections, light coral and pink shades, near-neutral highlights"; the owner: "I agree with Kuzya completely, we were
    # taught this at art school"). The picture's body is flat itself: 70 % of it within L* 32 … 48, one hue. So, on the body only, after everything else:
    VOLUME = 0.6                # its light and shade between 6 and 40 mm made stronger by so much (its spread 0.90 of the photo's at 0 → 1.18) (est.)
    GLOSS = 1.0                 # the hue turned by L* to HUES so much, the chroma down till it is in the gamut — else a clip turns it back to the same red (est.)
    HUES = ([0, 22, 30, 38, 44, 52, 60, 72, 86, 95, 100], [10, 12, 18, 30, 40, 52, 34, 6, -6, -25, -25])   # L* → hue °: the shadows crimson, the light coral, the
                                # highlight's fringe pink to lilac, the highlight near neutral and cool (est.)
    LAM = 1400.0                # a cut of a column's colour, its cost: hyper2's 2200 kept a lit bonnet and its shade in one leg (Kuzya) (est.)
    JIT = (2.0, 3.0)            # the columns' hue apart for the eye to mix, a* b*: hyper2's 3.5, 5.0 painterly, too much for smooth paint (Kuzya) (est.)
    JIT_BODY = None             # 0: no hue apart on the red body at all (Kuzya's audit, B); None: JIT everywhere
    SURFACE = None              # (LAM where the paint is flat, LAM where the form turns, slope from, slope to — L* a mm): a cut's cost by the form (Kuzya's audit, C); None: LAM
    SLOPE_MM = 8.0              # the body's light smoothed over so many mm along a column before its slope is read: the form, not the brush's grain (est.)

    def __init__(self):
        self.N = int((self.W - 2 * MARGIN) / PITCH)
        self.x0 = (self.W - self.N * PITCH) / 2
        self.R = int(self.H - 2 * MARGIN)
        self.xs = self.x0 + PITCH * (np.arange(self.N) + 0.5)
        self.ys = MARGIN + np.arange(self.R) + 0.5
        H.FIXED = self.FIXED
        g = racegeo.load()
        self.g = g
        ys, xs = np.where(g['mask'])
        self.s = self.WIDTH_MM / (xs.max() - xs.min() + 1)
        X, Y = np.meshgrid(self.xs, self.ys)
        self.px = racegeo.AXIS + (X - self.W / 2) / self.s                      # the axis between two columns: column c and N-1-c alike
        self.py = (ys.min() + ys.max() + 1) / 2 + (Y - self.H / 2) / self.s
        self.forms = [dict(name='body', idle=True, dose=1.0), dict(name='dark', idle=False, dose=1.3)]
        src = g['im']
        self.srcL = ndi.gaussian_filter(g['lab'][..., 0], 1.5)
        smooth = np.stack([H.guided(src[..., k], 5, 0.03 ** 2) for k in range(3)], axis=-1)
        self.photo = H.srgb2lin(np.clip(smooth, 0, 1) * 255).astype(np.float32)
        self.target0 = self.make_target()
        self.target = self.target0.copy()

    def at(self, a, order=0):
        """a picture-sized array read at every cell of the grid"""
        return ndi.map_coordinates(a, [self.py, self.px], order=order, mode='constant')

    def make_target(self):
        g = self.g
        self.mask = self.part(g['mask'])
        m = self.mask
        self.parts = {k: self.part(g['parts'][k]) & m for k in PARTS}
        pid = np.zeros((self.R, self.N), np.int32)
        for i, k in enumerate(PARTS):
            pid[self.parts[k] & (pid == 0)] = i + 1
        self.body = m & (pid == 0)
        # the carry's gate: a part, or a panel of the body between seams
        panel = self.at(g['panels'].astype(np.float32)).astype(np.int32)
        self.key = np.where(m, np.where(self.body, 1000 + panel, pid), -1)
        T = np.zeros((self.R, self.N, 3), np.float32)
        for c in range(3):
            sharp = self.samp(self.photo[..., c], (0.9, 1.4))
            wide = self.samp(self.photo[..., c], (7.0, 7.0))
            T[..., c] = sharp + 0.30 * (sharp - wide)
        # through the glass: read as GLASS says, its colour half (the first try: the cage, the seats and the light behind in a crowd of bluish short legs)
        wind = self.parts['wind'] & ~self.part(g['strip'])
        for c in range(3):
            T[..., c] = np.where(wind, self.samp(self.photo[..., c], self.GLASS), T[..., c])
        T = np.clip(T, 0, 1)
        lab = to_lab(T)
        lab[..., 1:] *= np.where(wind, 0.5, 1.0)[..., None]
        Ln, An, Bn = self.tone_map(lab[..., 0], lab[..., 1], lab[..., 2])
        T = lab2lin(np.stack([Ln, An, Bn], -1)).astype(np.float32)
        side = m & ~(np.roll(m, 1, axis=1) & np.roll(m, -1, axis=1))
        T = np.where(side[..., None], T * 0.85, T)
        # the seams by colour (redcar.py's EDGE and ALONG): where the seam lies within a column's width, row by row; a short piece crosses the column — the column
        # cut at its middle, the side the picture has darker taken down over EDGE mm — a long piece runs along it, its own piece of the column, a shade darker
        sm = ndi.gaussian_filter(g['seams'].astype(np.float32), 0.6)
        half = PITCH / 2 / self.s
        hit = np.zeros((self.R, self.N), bool)
        for dx in np.linspace(-half * 0.8, half * 0.8, 7):
            hit |= ndi.map_coordinates(sm, [self.py, self.px + dx], order=1, mode='constant') > 0.35
        hit &= self.body
        L0 = to_lab(T)[..., 0]
        count = np.zeros((self.R, self.N), np.int32)
        cross = along = 0
        for c in range(self.N):
            h_ = hit[:, c]
            if not h_.any():
                continue
            runs = np.split(np.flatnonzero(h_), np.flatnonzero(np.diff(np.flatnonzero(h_)) > 1) + 1)
            step = np.zeros(self.R + 1, np.int32)
            for r in runs:
                a, b = int(r[0]), int(r[-1]) + 1
                if b - a <= self.CROSS:
                    mid = (a + b) // 2
                    step[mid] += 1
                    up, dn = L0[max(0, a - 6):a, c], L0[b:b + 6, c]
                    if not len(up) or not len(dn):
                        continue
                    if up.mean() < dn.mean():                                       # above it darker: its last EDGE mm down to the seam
                        rr = np.arange(max(0, a - int(self.EDGE[0])), mid)
                        off = mid - rr
                    else:
                        rr = np.arange(mid, min(self.R, b + int(self.EDGE[0])))
                        off = rr - mid
                    rr, off = rr[self.body[rr, c]], off[self.body[rr, c]]
                    T[rr, c] *= (1 - self.EDGE[1] * (1 - off / self.EDGE[0]))[:, None]
                    cross += 1
                else:
                    step[a] += 1
                    step[b] += 1
                    T[a:b, c] *= 1 - self.ALONG[1]
                    along += 1
            count[:, c] = np.cumsum(step)[:self.R]
        print('seams: crossings', cross, 'along a column', along, flush=True)
        self.cut = np.where(m, pid * 4096 + count, -1)
        self.lock = -np.ones((self.R, self.N), np.int16)
        self.locks()
        T = self.glossy(T)
        # the form's turns along a column: the slope of the body's light over SLOPE_MM (Kuzya's C: "a region-level L* target … lower the segment penalty near
        # meaningful L* gradients"), L* a mm
        Lb = to_lab(T)[..., 0]
        w = self.body.astype(np.float32)
        sm = ndi.gaussian_filter1d(Lb * w, self.SLOPE_MM, axis=0) / np.maximum(ndi.gaussian_filter1d(w, self.SLOPE_MM, axis=0), 1e-3)
        self.slope = np.where(self.body, np.abs(np.gradient(sm, axis=0)), 0.0)
        return T

    def glossy(self, T):
        """the body's volume made stronger (VOLUME) and its colour laid as a painter lays gloss (GLOSS, HUES): shadows cooler, light warmer, a highlight's fringe pink
        and lilac, the highlight near neutral; the hue kept, the chroma down to the gamut"""
        lab = to_lab(T)
        if self.VOLUME:
            lab[..., 0] = np.where(self.body, np.clip(lab[..., 0] + self.VOLUME * band(lab[..., 0], self.body, 6.0, 40.0), 12, 98), lab[..., 0])
        if self.GLOSS:
            L, a, b = lab[..., 0], lab[..., 1].copy(), lab[..., 2].copy()
            C, h = np.hypot(a, b), np.degrees(np.arctan2(b, a))
            h2 = h + self.GLOSS * ((np.interp(L, *self.HUES) - h + 180) % 360 - 180)
            C2 = C * np.interp(L, [0, 80, 95, 100], [1, 1, 0.45, 0.3])
            hot = self.body & (C > 6)
            for _ in range(40):
                lab[..., 1] = np.where(hot, C2 * np.cos(np.radians(h2)), a)
                lab[..., 2] = np.where(hot, C2 * np.sin(np.radians(h2)), b)
                fy = (L + 16) / 116
                xyz = np.stack([lab[..., 1] / 500 + fy, fy, fy - lab[..., 2] / 200], -1)
                xyz = np.where(xyz > 6 / 29, xyz ** 3, 3 * (6 / 29) ** 2 * (xyz - 4 / 29)) * H.WHITE
                out = hot & (((xyz @ H.Minv.T) < -0.002) | ((xyz @ H.Minv.T) > 1.002)).any(-1)
                if not out.any():
                    break
                C2 = np.where(out, C2 * 0.95, C2)
        return lab2lin(lab).astype(np.float32)

    def locks(self):
        """the banner's PORSCHE as a hint, as LEGO's bricks (the owner's LEGO/): one band the letters' height along the banner's arch, every column through it one leg,
        its grey by the letters' share of it — an upright stroke the light grey, the bars alone the darker, the gaps between the letters the strip's black"""
        F = {q[0]: i for i, q in enumerate(self.FIXED)}
        lt = self.g['letters'].astype(np.float32)
        share = ndi.uniform_filter1d(lt, int(round(PITCH / self.s)), axis=1)     # the letters' white across the column's 5 mm, row by row
        sh = self.at(share, order=1)
        band = (sh > 0.01) & self.parts['wind']
        cols = [c for c in range(self.N) if band[:, c].sum() >= 6]
        if not cols:
            return
        tops = np.array([np.flatnonzero(band[:, c]).min() for c in cols], float)
        bots = np.array([np.flatnonzero(band[:, c]).max() + 1 for c in cols], float)
        pt, pb = np.polyfit(cols, tops, 2), np.polyfit(cols, bots, 2)             # the arch: the letters' top and foot, smooth along the banner
        self.banner = []
        for c in range(min(cols), max(cols) + 1):
            a, b = int(round(np.polyval(pt, c))), int(round(np.polyval(pb, c)))
            v = float(sh[a:b, c].mean())
            k = 'chromeM' if v >= self.LETTERS[0] else 'chromeD' if v >= self.LETTERS[1] else None
            self.banner.append((c, a, b, round(v, 2), k))
            self.lock[a:b, c] = F[k or 'ink']                                    # between the letters the strip's black, not the glass's grey
        print('banner', ''.join('|' if q[4] == 'chromeM' else ':' if q[4] == 'chromeD' else '.' for q in self.banner), 'band mm', round(float(np.mean(bots - tops)), 1), flush=True)

    def make_jars(self):
        """hyper2's, the neon in its light left to the owner's own fluorescent jar: no jar made to measure for it; every tone its say (even), not the mid red's crowd"""
        lab = to_lab(self.target0)
        lit = self.parts['neon'] & (lab[..., 0] > 70)
        rng = np.random.default_rng(1)

        def even(X, n=2500):                                                    # as many of every tone as there are, up to n a band of 6 L*: the highlights and the shadows their say
            q = np.floor(X[:, 0] / 6).astype(int)
            return X[np.concatenate([rng.choice(np.flatnonzero(q == k), min(n, int((q == k).sum())), replace=False) for k in np.unique(q)])]
        C1, _ = kmeans(even(lab[self.body & (self.lock < 0)]), self.KCLUSTERS - 12)
        C2, _ = kmeans(even(lab[self.mask & ~self.body & (self.lock < 0) & ~lit]), 12, seed=5)
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
        seen, uniq, errs = set(), [], []
        for w in wanted:
            p, e = invert(lab2lin(np.array(w, np.float32)))
            errs.append(e)
            if (p.hex, p.coats) not in seen:
                seen.add((p.hex, p.coats))
                uniq.append(p)
        fixed = []
        for name, hexv, coats in self.FIXED:
            p = jar(hexv, coats, name)
            p.name = name
            fixed.append(p)
        for i, p in enumerate(uniq):
            p.name = f'J{i + 1:02d}'
        print('jars', len(fixed + uniq), 'inverse dE mean', round(float(np.mean(errs)), 1), 'max', round(float(np.max(errs)), 1), flush=True)
        return fixed + uniq

    def touch(self):
        """the mark in the crest's place, two columns about the axis over the crest's height, on the finished grid: nothing else moves"""
        names = [p.name for p in self.pal.jars]
        if self.BADGE and self.BADGE in names:
            x0, y0, x1, y1 = racegeo.CREST
            on = (np.abs(self.px - racegeo.AXIS) * self.s < PITCH) & (self.py >= y0 + 4) & (self.py <= y1 - 4) & self.body
            self.grid[on], self.form[on] = names.index(self.BADGE), 1
        return self

    def plan(self):
        """redcar.py's plan; a column cut where its part or its seams change (self.cut), its carry kept within a part or a panel (self.key)"""
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
        ban_body[[i for i, q in enumerate(self.FIXED) if q[0] != self.SEAM]] = 400.0
        for c in range(N):
            m = self.mask[:, c]
            if not m.any():
                carry[:] = 0
                continue
            want = np.clip(T[:, c] + carry, 0, 1)
            lab = to_lab(want)
            na = ndi.gaussian_filter1d(rng.standard_normal(R).astype(np.float32), 30)
            nb = ndi.gaussian_filter1d(rng.standard_normal(R).astype(np.float32), 30)
            na, nb = na / (na.std() + 1e-6), nb / (nb.std() + 1e-6)
            fade = np.clip(lab[:, 0] / 100, 0, 1) ** 1.5
            lab2 = lab.copy()
            jit = np.where(self.body[:, c], 0.0, 1.0) if self.JIT_BODY == 0 else 1.0     # Kuzya's B: none on the red body
            lab2[:, 1] += self.JIT[0] * (2 * taua[c] - 1 + 0.5 * na) * fade * jit
            lab2[:, 2] += self.JIT[1] * (2 * taub[c] - 1 + 0.5 * nb) * fade * jit
            lab2 *= H.WEIGHT
            applied = np.zeros((R, 3), np.float32)
            key = self.cut[:, c].astype(np.int64) * 64 + self.lock[:, c].astype(np.int64) + 1
            cuts = sorted(set([0, R] + [int(q) + 1 for q in np.flatnonzero(np.diff(key) | np.diff(m.astype(np.int64)))]))
            for u, v in zip(cuts[:-1], cuts[1:]):
                if not m[u]:
                    continue
                if self.lock[u, c] >= 0:
                    grid[u:v, c] = self.lock[u, c]
                    applied[u:v] = want[u:v]
                    continue
                bins = max(1, (v - u) // H.BIN)
                edges = u + np.arange(bins + 1) * H.BIN
                edges[-1] = v
                lb = np.stack([lab2[edges[q]:edges[q + 1]].mean(axis=0) for q in range(bins)])
                prev = grid[edges[:-1], c - 1].astype(int) if c > 0 else -np.ones(bins, int)
                if self.SURFACE and self.body[u, c]:                                  # Kuzya's C: a cut cheap where the form turns, dear where the paint is flat
                    lam = np.interp(np.array([self.slope[edges[q]:edges[q + 1], c].max() for q in range(bins)]), self.SURFACE[2:], self.SURFACE[:2])
                    path = segment_var(pal, lb, lam, prev, self.BETA, ban_body)
                else:
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
            dark = lab[:, 0] < 30
            err[dark] = np.clip(err[dark], -0.04, 0.04)
            if c < N - 1:
                gate = (np.abs(Lstar[:, c + 1] - Lstar[:, c]) < 14) & self.mask[:, c + 1] & (self.key[:, c + 1] == self.key[:, c])
                carry = self.GAIN * err * gate[:, None]
        lums = np.array([P[p].lum for p in self.pids] + [2.0])
        form[self.mask] = 0
        form[self.mask & (lums[grid] < 0.03)] = 1
        form[self.lock >= 0] = 1
        self.grid, self.form = grid, form
        return self


if __name__ == '__main__':
    main(RaceFace, 'porsche-race.jpg')
