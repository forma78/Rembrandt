#!/usr/bin/env python3
"""OPM-G: the G-wagon from the front, hyperrealism on a 60 x 60 canvas, bare white ground (the owner, 2026-11-07: "start with g-wagon.JPG, on a 60 x 60
canvas, with the new data of LAB / real 2"). The Porsche's technique (hyper2.py): one grid of columns 5 mm apart, every column a DP over the jars, what it
could not reach carried to the next; jars made to measure in pairs of neighbouring shades.

What is new, the owner's words and LAB's real strokes 2 (OPM-G/IMG_2435 … 2486, the night of 2026-11-06/07):
  * at most 36 jars, every jar 1 m of line at least ("cut the colours from 60 to 36 … a jar that does one 'tuk', one micro-stroke, no different from Jar 1
    or Jar 2 … merge them with others, so that every colour has some minimum of strokes, for example 1 metre at least"). A jar under it is taken out and
    the picture planned again, so its legs go to the jars that can paint them: merged by the plan, not by recolouring its legs;
  * long legs: on that canvas the long legs (48 … 174 mm) came out clean, every copy alike; short legs alone, 13 … 32 mm, of the second paint came out fat
    pills with a dark rim. So no span shorter than 12 mm is planned (the Porsche's 8), and a cut costs more (LAM);
  * the grille's slats on the grid: every third column (15 mm), one long chrome leg each, symmetric about the middle column; the bull bar's chrome off
    the photo's own light, its tubes at least 12 mm across; the headlights' rings at least 9 mm (a light leg runs 3 mm under the dark beside it).
Run: python gwagon.py <ppm> <passes> <out.jpg>; its plan in <out.jpg>.pkl for export_formg.py."""
import os, sys, time, pickle
import numpy as np
from scipy import ndimage as ndi
from PIL import Image
import hyper2 as hy
from hyper2 import jar, invert, Palette, kmeans, guided, lab2lin, paint_all, save, BIN, WEIGHT
from brushsim import srgb2lin
from distance_core import to_lab
import watchplan as WP
from watchplan import P, PITCH, MARGIN, thresholds
import gwagongeo as G
import paintrun

hy.LBINS = [l for l in hy.LBINS if l * BIN >= 12]          # no span under 12 mm on purpose (real strokes 2)

# the locked things' jars: the chrome's three as masstones, the locked legs being short and solid (L* 86, 70, 53: the photo's top, side and underside of a tube, est.);
# the mesh and the ink as the Porsche's; the seats' red, the photo's one accent, its own jar so that it stays (a jar under 1 m would go)
FIXED = [('chrome', '#DADAD6', 1), ('chromeM', '#ABABA8', 1), ('chromeD', '#7D7E7D', 1), ('ink', '#0C0C0C', 2), ('grille', '#262728', 2), ('seat', None, 1)]
MAX_JARS, MIN_PAGE_MM = 36, 1000.0


def page_mm(runs):
    """A jar's metres as FORM-G's list shows them (formgplan.js's cellOf, est. here): every leg half the tip in from both ends, the steps between
    legs, and the idle run, legs evenly over the cell's width 3.76 mm apart, +2 mm past their ends."""
    tip, over, pas = 4.0, 2.0, PITCH * 4.38 / 5.83
    out = 0.0
    for run in runs:
        legs = [(sp['x'], sp['yb'] - sp['ya']) for sp, d in run]
        first = sum(max(3.0, L - tip) for _, L in legs)
        steps = sum(np.hypot(b[0] - a[0], 4.0) for a, b in zip(legs[:-1], legs[1:]))
        if len(legs) < 2:
            idle = max(3.0, legs[0][1] - tip) + over
        else:
            W = abs(legs[-1][0] - legs[0][0])
            n = max(1, round(W / pas)) + 1
            idle = sum(max(3.0, min(legs, key=lambda l: abs(l[0] - (legs[0][0] + W * j / (n - 1))))[1] - tip) + 2 * over for j in range(n)) + W
        out += first + steps + idle
    return out


class GWagon:
    W, H = 600, 600
    WIDTH_MM = 500.0      # the car across, the photo's own share of its frame (81 %)
    LAM, BETA, GAIN = float(os.environ.get('GW_LAM', 3400)), float(os.environ.get('GW_BETA', 6)), 0.72
    JIT = (3.0, 4.0)
    KCLUSTERS = 30

    def __init__(self):
        self.N = int((self.W - 2 * MARGIN) / PITCH)
        self.x0 = (self.W - self.N * PITCH) / 2
        self.R = int(self.H - 2 * MARGIN)
        self.xs = self.x0 + PITCH * (np.arange(self.N) + 0.5)
        self.ys = MARGIN + np.arange(self.R) + 0.5
        g = G.load()
        self.g = g
        ys, xs = np.where(g['mask'])
        self.s = self.WIDTH_MM / (xs.max() - xs.min() + 1)
        # the car's middle on a column, so that the grille's slats lie symmetric on the grid
        self.cmid = int(np.argmin(np.abs(self.xs - self.W / 2)))
        X, Y = np.meshgrid(self.xs, self.ys)
        self.px = G.AXIS + (X - self.xs[self.cmid]) / self.s
        self.py = (ys.min() + ys.max()) / 2 + (Y - self.H / 2) / self.s
        # every cell has its idle run on the tab, the dark ones too (formgplan.js): so one form here, not the Porsche's thick dark one
        self.forms = [dict(name='body', idle=True, dose=1.0), dict(name='locked', idle=True, dose=1.0)]
        smooth = np.stack([guided(g['im'][..., k], 3, 0.03 ** 2) for k in range(3)], axis=-1)
        self.photo = srgb2lin(np.clip(smooth, 0, 1) * 255).astype(np.float32)
        self.target0 = self.make_target()
        self.target = self.target0.copy()

    def samp(self, a, sig):
        f = ndi.gaussian_filter(a.astype(np.float32), (sig[0] / self.s, sig[1] / self.s))
        return ndi.map_coordinates(f, [self.py, self.px], order=1, mode='nearest')

    def make_target(self):
        self.mask = self.samp(self.g['mask'], (0.4, 0.4)) > 0.5
        m, px, py = self.mask, self.px, self.py
        x0, y0, x1, y1 = G.GRILLE
        self.grille = (px > x0 + 3) & (px < x1 - 3) & (py > y0 + 3) & (py < y1 - 2) & m
        wind = (px > 150) & (px < 485) & (py > 102) & (py < 196)
        T = np.zeros((self.R, self.N, 3), np.float32)
        for c in range(3):
            sharp = self.samp(self.photo[..., c], (0.9, 1.4))
            wide = self.samp(self.photo[..., c], (7.0, 7.0))
            T[..., c] = sharp + 0.30 * (sharp - wide)
        T = np.clip(T, 0, 1)
        lab = to_lab(T)
        L, A, B = lab[..., 0], lab[..., 1], lab[..., 2]
        # the black paint keeps its form: the deepest lifted a little, so the bonnet's and the wings' light reads on a canvas (est.)
        Ln = np.interp(L, [0, 10, 25, 40, 55, 70, 100], [13, 18, 28, 40, 54, 70, 100])
        seat = wind & (np.hypot(A, B) > 6) & (A > 3)
        An = np.where(seat, A * 1.25, A)
        Bn = np.where(seat, B * 1.15, B)
        T = lab2lin(np.stack([Ln, An, Bn], -1)).astype(np.float32)
        side = m & ~(np.roll(m, 1, axis=1) & np.roll(m, -1, axis=1))
        T = np.where(side[..., None], T * 0.85, T)
        self.body = m & ~self.grille
        red = wind & (A > 3.5) & (L > 30) & (L < 68)          # through the tinted glass the seats are a dusty red, a* 4 … 8
        red = ndi.binary_opening(ndi.binary_closing(red, structure=np.ones((5, 1))), structure=np.ones((5, 1)))
        self.seats = red
        lab_t = to_lab(T)
        self.seat_lab = lab_t[red].mean(axis=0) * np.array([1, 1.35, 1.35], np.float32) if red.any() else np.array([45, 9, 3], np.float32)   # a little richer than through the glass (est.)
        self.lockF = -np.ones((self.R, self.N), np.int16)      # FIXED's index; self.lock the jar's, as the jars now stand (use)
        self.lock = self.lockF
        self.locks(L)
        return T

    def locks(self, L0):
        """What a 5 mm brush holds of the small things, by geometry: the slats, the bull bar, the headlights' rings."""
        F = {q[0]: i for i, q in enumerate(FIXED)}
        L, px, py, s = self.lockF, self.px, self.py, self.s
        # the grille: its mesh dark, a chrome slat every third column from the middle one out
        L[self.grille] = F['grille']
        x0, y0, x1, y1 = G.GRILLE
        for c in range(self.N):
            k = c - self.cmid
            if k % 3 == 0:
                col = self.grille[:, c] & (py[:, c] > y0 + 4) & (py[:, c] < y1 - 4)
                if col.sum() > 30:
                    L[col, c] = F['chromeM']          # the photo's slats are grey chrome, not white
        # the headlights, by geometry: the chrome bezel at least 9 mm where a column cuts it, the lens dark, the projector in its middle
        for cx, cy in G.LAMPS:
            r = np.hypot(px - cx, py - cy) * s
            R = G.LAMP_R * s
            dy = np.abs(py - cy) * s
            lamp = (r < R) & self.mask
            L[lamp] = F['grille']
            bezel = lamp & ((r > R - 5.5) | (dy > R - 9.0))
            L[bezel & (px < cx - 6)] = F['chromeM']
            L[bezel & (px >= cx - 6)] = F['chrome']
            L[lamp & (r < 8.5)] = F['chromeD']
        # the seats, the red in the windscreen: one jar, every run of it in a column 12 mm at least
        for c in range(self.N):
            lab_, n = ndi.label(self.seats[:, c])
            for i in range(1, n + 1):
                ii = np.flatnonzero(lab_ == i)
                if len(ii) >= 12:
                    L[ii, c] = F['seat']
        # the bull bar: the photo's chrome, light and neutral, in its rows; a run of it in a column one jar, by its mean light, 14 mm at least
        a0, a1 = G.BAR
        band = (py > a0) & (py < a1) & self.mask & ~self.grille
        lab = to_lab(self.samp_photo())
        Lp, ch = lab[..., 0], np.hypot(lab[..., 1], lab[..., 2])
        chrome = band & (Lp > 46) & (ch < 9)
        chrome = ndi.binary_closing(chrome, structure=np.ones((5, 1)))
        chrome = ndi.binary_opening(chrome, structure=np.ones((3, 1)))
        # its two uprights whole, top tube to bottom tube: their dark reflections are chrome too
        for u0, u1 in G.UPRIGHTS:
            chrome |= (px > u0) & (px < u1) & (py > G.BAR[0] + 6) & (py < G.BAR[1] - 10) & self.mask
        TUBE = 14
        for c in range(self.N):
            lab_, n = ndi.label(chrome[:, c])
            for i in range(1, n + 1):
                ii = np.flatnonzero(lab_ == i)
                v = float(np.mean(Lp[ii, c]))
                if len(ii) < TUBE:
                    mid = (ii[0] + ii[-1]) // 2
                    ii = np.arange(max(0, mid - TUBE // 2), min(self.R, mid + TUBE - TUBE // 2))
                    ii = ii[self.mask[ii, c]]
                L[ii, c] = F['chrome'] if v > 76 else F['chromeM'] if v > 58 else F['chromeD']

    def samp_photo(self):
        return np.clip(np.stack([self.samp(self.photo[..., k], (0.6, 0.6)) for k in range(3)], -1), 0, 1)

    def make_jars(self, k=None):
        k = k or self.KCLUSTERS
        lab = to_lab(self.target0)
        free = self.mask & (self.lock < 0)
        C, _ = kmeans(lab[free][::2], k)
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
        jars, errs, seen = [], [], set()
        for w in wanted:
            p, e = invert(lab2lin(np.array(w, np.float32)))
            errs.append(e)
            if (p.hex, p.coats) not in seen:
                seen.add((p.hex, p.coats))
                jars.append(p)
        self.fixed = []
        for name, hexv, coats in FIXED:
            if hexv is None:                       # the seats: their mean colour, a little richer, as the target has it
                hexv = tuple(float(v) for v in self.seat_lab)
            p = jar(hexv, coats, name) if isinstance(hexv, str) else invert(lab2lin(np.array(hexv, np.float32)))[0]
            p.name = name
            self.fixed.append(p)
        for i, p in enumerate(jars):
            p.name = f'J{i + 1:02d}'
        print('jars', len(FIXED) + len(jars), 'inverse dE mean', round(float(np.mean(errs)), 1), 'max', round(float(np.max(errs)), 1), flush=True)
        return self.fixed + jars

    # a locked jar taken out (under 1 m) hands its cells to the next of its kind
    FALLBACK = {'chromeD': ['chromeM', 'chrome'], 'chromeM': ['chrome', 'chromeD'], 'chrome': ['chromeM', 'chromeD'], 'grille': ['ink'], 'ink': ['grille'], 'seat': []}

    def use(self, jars):
        self.pal = Palette(jars)
        P.clear()
        self.pids = []
        for i, p in enumerate(jars):
            P[f'j{i}'] = p
            self.pids.append(f'j{i}')
        at = {p.name: i for i, p in enumerate(jars)}
        idx = []
        for name, _, _ in FIXED:
            k = at.get(name, next((at[f] for f in self.FALLBACK.get(name, []) if f in at), -1))
            idx.append(k)
        idx = np.array(idx + [-1], np.int16)
        self.lock = np.where(self.lockF >= 0, idx[self.lockF], -1).astype(np.int16)

    residual_loop = hy.Car.residual_loop

    def plan(self):
        """hyper2's Car.plan, no ban: every jar may go anywhere the photo asks for it; the locked cells as they are."""
        R, N, pal = self.R, self.N, self.pal
        grid = -np.ones((R, N), np.int16)
        form = -np.ones((R, N), np.int16)
        T = self.target
        taua, taub = thresholds(N, 3), thresholds(N, 7)
        carry = np.zeros((R, 3), np.float32)
        Lstar = to_lab(self.target0)[..., 0]
        rng = np.random.default_rng(4)
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
                key = self.lock[a0:b0, c].astype(np.int32)
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
                    path = pal.segment(lb, self.LAM, prev, self.BETA, None)
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

    def jar_metres(self):
        paintrun.STEP_MAX = 7.0
        runs = paintrun.build_runs(self, paintrun.spans_of(self))
        return np.array([page_mm(runs.get(k, [])) for k in range(self.pal.K)])

    def prune(self):
        """Every jar 1 m at least, 36 at most: those under it out, the weakest first, and the picture planned again; the locked ones stay unless they fall under it too."""
        mm = self.jar_metres()
        order = np.argsort(mm)
        weak = [k for k in order if mm[k] < MIN_PAGE_MM]
        over = self.pal.K - len(weak) - MAX_JARS
        if over > 0:
            weak += [k for k in order if k not in weak][:over]
        # not too many at once: their legs go to their neighbours in the next plan, which may lift another over the line
        weak = weak[:max(1, (len(weak) + 1) // 2)] if len(weak) > 4 else weak
        if not weak:
            return 0, mm
        keep = [p for k, p in enumerate(self.pal.jars) if k not in set(weak)]
        self.use(keep)
        return len(weak), mm




if __name__ == '__main__':
    ppm = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    loops = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    out = sys.argv[3] if len(sys.argv) > 3 else 'gwagon_try.jpg'
    t0 = time.time()
    car = GWagon()
    print('columns', car.N, 'mm/px', round(car.s, 3), 'cells', int(car.mask.sum()), 'car mm', int(car.mask.any(axis=0).sum() * PITCH), 'x', int(car.mask.any(axis=1).sum()), flush=True)
    car.use(car.make_jars())
    print('jars ready', round(time.time() - t0), 's', flush=True)
    car.plan()
    for _ in range(8):
        d, mm = car.prune()
        print('pruned', d, 'left', car.pal.K, 'weakest m', round(float(np.sort(mm)[0]) / 1000, 2), f'[{time.time()-t0:.0f}s]', flush=True)
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
            mm = car.jar_metres()
            if mm.min() < MIN_PAGE_MM:          # the plan moved: a jar fell under the line, out and again
                car.prune()
                car.plan()
    mm = car.jar_metres()
    save(img, out)
    print('jars', car.pal.K, 'page m min', round(float(mm.min()) / 1000, 2), 'max', round(float(mm.max()) / 1000, 2), 'sum', round(float(mm.sum()) / 1000, 1))
    print('legs', st['legs'], 'lifts', st['runs'], 'line m', round(st['line'] / 1000, 1), 'idle m', round(st['idle'] / 1000, 1), 'dips', int(st['dips']), 'short<12', st['shortlegs'], 'two-coat jars', sum(1 for p in st['per'].values() if p['coats'] == 2))
    pickle.dump(dict(grid=car.grid, form=car.form, st=st, jars=[(p.name, p.hex, p.coats) for p in car.pal.jars], cmid=car.cmid), open(out + '.pkl', 'wb'))
