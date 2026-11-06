#!/usr/bin/env python3
"""A simulation of the rubber brush on primed canvas, read off OPM-G/IMG_2415 (20 x 20 cm).

What the photo shows (all est., from the photo, not measured on the machine):
  * track about 5 mm wide; a pale film in the middle with the weave showing through;
  * a thick glossy ridge along both sides, about 1 mm;
  * a thick U at every turn of the snake, its paint running back into the film in feathered tongues;
  * a dip every 95 mm of line: the load falls off along the line, so short legs come out solid, long ones as film;
  * a thin dark paint in film goes violet (Indigo reads lilac): modelled by Kubelka-Munk per channel.
"""
import numpy as np
from scipy.ndimage import gaussian_filter

GROUND_SRGB = (243, 240, 230)


def srgb2lin(c):
    c = np.asarray(c, dtype=np.float32) / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def lin2srgb(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055)


def hex2rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


class Paint:
    """A paint: its masstone (hex, thick), its film (a glaze: thin paint multiplies what lies under it), how soon it covers.
    film = masstone ** kappa, Beer-like; read off IMG_2415: Indigo's film lilac, kappa about 0.37 (est.)."""
    TF = 0.2            # the film's reference thickness

    def __init__(self, name, hex_, cover=0.55, kappa=0.33):
        self.name, self.hex, self.cover, self.kappa = name, hex_, cover, kappa
        self.Rinf = np.clip(srgb2lin(hex2rgb(hex_)), 0.004, 0.985)
        self.logF = kappa * np.log(self.Rinf)
        self.lum = float(self.Rinf @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32))


def km_over(Rg, paint, t):
    """A layer of `paint`, thickness t, over the reflectance Rg: a glaze while thin, the masstone once thick."""
    out = Rg.copy()
    on = t > 1e-3
    if not on.any():
        return out
    tt = t[on][:, None]
    c = 1 - np.exp(-(tt / paint.cover) ** 2)
    glaze = Rg[on] * np.exp(paint.logF * (tt / paint.TF))
    out[on] = glaze * (1 - c) + paint.Rinf * c
    return out


def smooth01(a, b, x):
    u = np.clip((x - a) / (b - a), 0, 1)
    return u * u * (3 - 2 * u)


_NOISE = {}


class Noise:
    def __init__(self, ppm, seed=7):
        rng = np.random.default_rng(seed)
        n = 2048
        self.n = n
        base = rng.standard_normal((n, n)).astype(np.float32)
        # streaks along the leg: fine across, long along
        s = gaussian_filter(base, (9 * ppm, 0.28 * ppm), mode='wrap')
        self.streak = s / (s.std() + 1e-6)
        s2 = gaussian_filter(rng.standard_normal((n, n)).astype(np.float32), (2.2 * ppm, 0.32 * ppm), mode='wrap')
        self.tongue = s2 / (s2.std() + 1e-6)
        b = gaussian_filter(rng.standard_normal((n, n)).astype(np.float32), 0.8 * ppm, mode='wrap')
        self.blotch = b / (b.std() + 1e-6)
        self.rng = rng

    def take(self, tile, iy, ix, ox, oy):
        return tile[(iy + oy) % self.n][:, (ix + ox) % self.n]


def weave_map(h, w, ppm, seed=3):
    """The primed canvas: a plain weave about 0.65 mm the thread (read off the photo)."""
    rng = np.random.default_rng(seed)
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    period = 0.5 * ppm * 2
    wx = np.sin(2 * np.pi * x / period)
    wy = np.sin(2 * np.pi * y / period)
    v = 0.5 * (wx * np.sign(np.sin(np.pi * y / period) + 1e-6) + wy * np.sign(np.sin(np.pi * x / period + 1.57) + 1e-6))
    v = gaussian_filter(v, 0.15 * ppm)
    n = gaussian_filter(rng.standard_normal((h, w)).astype(np.float32), 0.25 * ppm)
    n = n / (n.std() + 1e-6)
    return (v * 0.85 + n * 0.25).astype(np.float32)


class Loader:
    """The load on the tip along a line: dip, fall off, dip."""
    every = 95.0     # mm of line a dip (LAB, README)
    sigma = 48.0     # est.: how fast the load falls off

    def load(self, s):
        m = np.mod(s, self.every)
        return 0.16 + 0.84 * np.exp(-m / self.sigma)


class Sim:
    HW = 2.5  # half the track: 5 mm, the owner's

    def __init__(self, W, H, ppm=6, seed=11):
        self.W, self.H, self.ppm = W, H, ppm
        self.h, self.w = int(H * ppm), int(W * ppm)
        if (ppm, seed) not in _NOISE:
            _NOISE[(ppm, seed)] = Noise(ppm, seed)
        self.noise = _NOISE[(ppm, seed)]
        self.rng = np.random.default_rng(seed + 1)
        self.weave = weave_map(self.h, self.w, ppm)
        self.R = np.empty((self.h, self.w, 3), dtype=np.float32)
        self.R[:] = srgb2lin(GROUND_SRGB)
        self.R *= (1 + 0.035 * self.weave)[..., None]
        self.Hmap = np.zeros((self.h, self.w), dtype=np.float32)
        self.Gloss = np.zeros((self.h, self.w), dtype=np.float32)
        self.loader = Loader()

    # ---- one leg
    def leg(self, T, xc, ya, yb, s_top, s_bot, cap_top, cap_bot, dose=1.0, idle=False, every=None, solid=False):
        """xc, ya < yb in mm. s_top, s_bot: mm of line since the run's start, at the top and at the bottom.
        cap: 'turn' (a U of thick paint), 'free' (landing or lift), 'off' (nothing, for the idle run)."""
        ppm, HW = self.ppm, self.HW
        pad = 1.2
        ix0, ix1 = max(0, int((xc - HW - pad) * ppm)), min(self.w, int((xc + HW + pad) * ppm) + 1)
        iy0, iy1 = max(0, int((ya - pad) * ppm)), min(self.h, int((yb + pad) * ppm) + 1)
        if ix1 <= ix0 or iy1 <= iy0:
            return
        ix = np.arange(ix0, ix1)
        iy = np.arange(iy0, iy1)
        X = (ix + 0.5) / ppm
        Y = (iy + 0.5) / ppm
        rng = self.rng
        ox, oy = int(rng.integers(0, 2048)), int(rng.integers(0, 2048))
        n = self.noise
        streak = n.take(n.streak, iy, ix, ox, oy)
        tongue = n.take(n.tongue, iy, ix, oy, ox)
        blotch = n.take(n.blotch, iy, ix, ox + 91, oy + 17)
        wander = 0.05 * n.streak[(iy + oy) % n.n, ox % n.n]             # inhuman: under 0.1 mm rms (IMG_2359, est.)
        hw = HW * (1 + 0.012 * n.streak[(iy + oy + 300) % n.n, (ox + 77) % n.n])
        dx = np.abs(X[None, :] - (xc + wander)[:, None])
        Yc = Y[:, None]

        rt = HW if cap_top == 'turn' else 1.5
        rb = HW if cap_bot == 'turn' else 1.5
        L = yb - ya
        rt, rb = min(rt, L / 2), min(rb, L / 2)
        hwc = hw[:, None]
        sd = dx - hwc
        # top end
        qy = (ya + rt) - Yc
        qx = dx - (hwc - rt)
        zone = qy > 0
        sd = np.where(zone, np.where(qx > 0, np.hypot(qx, qy) - rt, qy - rt), sd)
        qy = Yc - (yb - rb)
        zone = qy > 0
        sd = np.where(zone, np.where(qx > 0, np.hypot(qx, qy) - rb, qy - rb), sd)
        e = -sd
        m = np.clip(e / 0.16 + 0.5, 0, 1)

        # the load along the leg
        if s_bot >= s_top:
            s = s_top + (Yc - ya)
        else:
            s = s_bot + (yb - Yc)
        ev = every or self.loader.every
        m95 = np.mod(s, ev)
        ld = 0.16 + 0.84 * np.exp(-m95 / self.loader.sigma) * smooth01(0.0, 7.0, m95)
        load = np.clip(ld * dose, 0, 1.5)

        if idle:
            lam_top = lam_bot = 1.5
            amp_top = amp_bot = 0.0
            w0 = 0.20
            film = 0.02
            thick = 0.34 + 0.22 * load
        else:
            lam = 2.0 + 3.2 * load
            lam_top = lam * (1.0 if cap_top == 'turn' else 0.45)
            lam_bot = lam * (1.0 if cap_bot == 'turn' else 0.45)
            amp_top = 1.0 if cap_top == 'turn' else 0.22
            amp_bot = 1.0 if cap_bot == 'turn' else 0.22
            w0 = 0.26 + 0.26 * load
            film = 0.13 + 0.14 * load
            thick = 0.74 + 0.60 * load

        d_top = np.maximum(Yc - ya, 0)
        d_bot = np.maximum(yb - Yc, 0)
        pool = np.maximum(amp_top * np.exp(-(d_top / lam_top) ** 1.5), amp_bot * np.exp(-(d_bot / lam_bot) ** 1.5))
        if not idle:
            pool = np.maximum(pool, 0.80 * np.exp(-(m95 / 7.0) ** 1.5) * smooth01(0.0, 5.0, m95))
        side = np.sign(X[None, :] - (xc + wander)[:, None])
        w_ridge = w0 * (1 + 0.42 * streak + 0.28 * side * (1 if s_bot >= s_top else -1)) + 1.08 * HW * pool
        w_ridge = np.maximum(w_ridge, 0.06)
        # no ridge across a free end: there the distance is to the sides only
        e_side = hwc - dx
        free_zone = ((Yc < ya + 3.0) & (cap_top != 'turn')) | ((Yc > yb - 3.0) & (cap_bot != 'turn'))
        e_r = np.where(free_zone, e_side, e)
        e_n = e_r + (0.12 + 1.15 * pool) * tongue
        feather = 0.10 + 0.95 * pool
        rho = 1 - smooth01(w_ridge - feather, w_ridge + feather, e_n)

        weave = self.weave[iy0:iy1, ix0:ix1]
        film_t = film * (1 - 0.42 * np.clip(weave, -1.2, 1.2)) * (1 + 0.14 * streak)
        film_t = np.maximum(film_t, 0)
        thick_t = thick * (1 + 0.16 * blotch)
        if solid:
            rho = np.maximum(rho, 0.97)
        t = m * (film_t + (thick_t - film_t) * rho)
        win = T[iy0:iy1, ix0:ix1]
        if idle:
            fade = smooth01(0.0, 4.0, d_top) * smooth01(0.0, 4.0, d_bot)
            near = np.exp(-np.minimum(d_top, d_bot) / 22.0)
            line = (0.30 + 0.70 * near) * (0.55 + 0.45 * np.tanh(1.2 * blotch)) * fade
            T[iy0:iy1, ix0:ix1] = np.maximum(win + 0.22 * m * film_t, t * line)
        else:
            T[iy0:iy1, ix0:ix1] = np.maximum(win, t)

    # ---- a turn: the U of thick paint from one leg's end to the next's
    def turn(self, T, x1, y1, x2, y2, side, load):
        """side -1: over the top, +1: under the bottom. y1, y2: the anchors, a half track inside the outer contour."""
        ppm, HW = self.ppm, self.HW
        bulge = 1.3 * side
        pts = []
        for u in np.linspace(0, 1, 9):
            cx = (1 - u) ** 2 * x1 + 2 * u * (1 - u) * (x1 + x2) / 2 + u ** 2 * x2
            cy = (1 - u) ** 2 * y1 + 2 * u * (1 - u) * ((y1 + y2) / 2 + 2 * bulge) + u ** 2 * y2
            pts.append((cx, cy))
        pad = HW + 1
        ix0, ix1 = max(0, int((min(x1, x2) - pad) * ppm)), min(self.w, int((max(x1, x2) + pad) * ppm) + 1)
        iy0, iy1 = max(0, int((min(y1, y2) - pad - 2) * ppm)), min(self.h, int((max(y1, y2) + pad + 2) * ppm) + 1)
        if ix1 <= ix0 or iy1 <= iy0:
            return
        X = ((np.arange(ix0, ix1) + 0.5) / ppm)[None, :]
        Y = ((np.arange(iy0, iy1) + 0.5) / ppm)[:, None]
        d = np.full((iy1 - iy0, ix1 - ix0), 1e9, dtype=np.float32)
        for (ax, ay), (bx, by) in zip(pts[:-1], pts[1:]):
            vx, vy = bx - ax, by - ay
            v2 = vx * vx + vy * vy + 1e-9
            u = np.clip(((X - ax) * vx + (Y - ay) * vy) / v2, 0, 1)
            d = np.minimum(d, np.hypot(X - (ax + u * vx), Y - (ay + u * vy)))
        n = self.noise
        ox, oy = int(self.rng.integers(0, 2048)), int(self.rng.integers(0, 2048))
        blotch = n.take(n.blotch, np.arange(iy0, iy1), np.arange(ix0, ix1), ox, oy)
        e = HW - d + 0.10 * blotch
        m = np.clip(e / 0.16 + 0.5, 0, 1)
        t = m * (0.74 + 0.60 * load) * (1 + 0.16 * blotch) * (1 + 0.20 * smooth01(0, 1.6, e))
        T[iy0:iy1, ix0:ix1] = np.maximum(T[iy0:iy1, ix0:ix1], t)

    # ---- a paint laid: T onto the canvas
    def lay(self, T, paint):
        self.R = km_over(self.R, paint, T)
        self.Hmap += T
        self.Gloss = np.maximum(self.Gloss, smooth01(0.35, 1.0, T))

    # ---- the light
    def finish(self):
        ppm = self.ppm
        relief = gaussian_filter(self.Hmap, 0.10 * ppm)
        relief_full = relief * 0.075 + self.weave * 0.016 * (1 - 0.70 * smooth01(0.3, 1.1, relief))
        gy, gx = np.gradient(relief_full, 1 / ppm)
        lx, ly = -0.55, -0.72            # the light from the top left
        slope = gx * lx + gy * ly
        shade = 1 + 0.30 * np.tanh(slope * 1.6)
        nz = 1 / np.sqrt(1 + gx * gx + gy * gy)
        hx, hy, hz = -0.30, -0.40, 0.866
        ndoth = np.clip((-gx * hx - gy * hy + hz) * nz, 0, 1)
        spec = ndoth ** 90 * 0.20 * self.Gloss
        # a soft occlusion in the troughs beside thick paint
        ao = np.clip(relief - gaussian_filter(self.Hmap, 1.1 * ppm), -1, 0)
        out = self.R * (shade * (1 + 0.14 * ao))[..., None] + spec[..., None]
        return lin2srgb(out)
