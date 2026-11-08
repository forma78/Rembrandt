#!/usr/bin/env python3
"""FORM-G: the red classic 911 on 70 × 100, 85 cm long, upright (the owner, 2026-11-08: "a new classic Porsche for FORM-G, red; will you draw it on 70 × 100 cm?";
"do not spare the colours, 60 or 70 shades can be; the main thing is to make the geometry perfect"; "and we have the limit of 850 mm in height").

hyper2.py's technique, the green 911's, all of it — jars made to measure in pairs of neighbouring shades, every column solved against the picture, what it could not reach
carried to the next, passes against the render — on redgeo.py's geometry: the outline and every part read off the picture and made symmetric about the axis. Two things more
for the geometry: no leg runs across a part's edge or a panel's seam (a column is cut where it crosses one, and no colour is carried over one to the next column), and the
seams that run along the brush, the bonnet's and the engine lid's sides, are a column of the seam's own jar, as the scuttle's line across is."""
import sys, os, json, time, pickle
import numpy as np
from scipy import ndimage as ndi
import hyper2 as H
from hyper2 import lab2lin, guided, kmeans, paint_all, save, BIN, WEIGHT
from brushsim import srgb2lin
from distance_core import to_lab
from watchplan import P, PITCH, MARGIN, thresholds
import paintrun
import redgeo

# the jars geometry holds; the others made to measure. Chrome by the light, the black of the glass, the carbon under the tail, the tail lights' red, the indicators'
# amber, the seams' deep red, the louvres' grey
RED_FIXED = [('chrome', '#E6E5DF', 1), ('chromeM', '#C6C6C1', 1), ('chromeD', '#9B9C9A', 1), ('ink', '#0C0C0C', 2), ('carbon', '#2B2B2C', 1), ('tail', '#E5281E', 1),
             ('amber', '#EE8A22', 1), ('seam', '#3C0608', 2), ('louvre', '#8F908E', 1), ('glass', '#4B4D4E', 1)]
H.FIXED = RED_FIXED
SLATS = (1392, 1412, 1432)    # the louvres' bright slats, px: the rows' brightest, across x 340 … 590 of the picture
PARTS = ['wind', 'rear', 'grille', 'sides', 'mirrors', 'heads', 'diffuser', 'posts', 'amber', 'tail']


class RedCar(H.Car):
    W, H = 700, 1000
    LENGTH_MM = 843.0          # the owner's limit is 850; at 850 the carriage ran 4 mm past the bottom wall (the elbow's sweep past the lowest leg's end, about 20 mm),
                               # so the whole car 0.8 % smaller, the green's painted 843, rather than its chrome tips cut short
    KCLUSTERS = 44             # 34 of the body's reds, 10 of the rest, in pairs: about 90 jars before the ones with next to nothing to paint are taken out. 60 gave 59 jars, the same picture (dE 9.7), more short legs
    MIN_LEGS, MIN_LINE = 4, 0.10

    def __init__(self):
        self.N = int((self.W - 2 * MARGIN) / PITCH)
        self.x0 = (self.W - self.N * PITCH) / 2
        self.R = int(self.H - 2 * MARGIN)
        self.xs = self.x0 + PITCH * (np.arange(self.N) + 0.5)
        self.ys = MARGIN + np.arange(self.R) + 0.5
        g = redgeo.load()
        self.g = g
        ys, xs = np.where(g['mask'])
        self.s = self.LENGTH_MM / (ys.max() - ys.min() + 1)
        X, Y = np.meshgrid(self.xs, self.ys)
        self.px = redgeo.AXIS + (X - self.W / 2) / self.s          # the axis between two columns: the left and the right alike
        self.py = (ys.min() + ys.max() + 1) / 2 + (Y - self.H / 2) / self.s
        self.forms = [dict(name='body', idle=True, dose=1.0), dict(name='dark', idle=False, dose=1.3)]
        smooth = np.stack([guided(g['im'][..., k], 5, 0.03 ** 2) for k in range(3)], axis=-1)
        self.photo = srgb2lin(np.clip(smooth, 0, 1) * 255).astype(np.float32)
        self.target0 = self.make_target()
        self.target = self.target0.copy()

    def part(self, m):
        return ndi.map_coordinates(ndi.gaussian_filter(m.astype(np.float32), 0.5), [self.py, self.px], order=1, mode='constant') > 0.5

    def make_target(self):
        g = self.g
        self.mask = self.part(g['mask'])
        m = self.mask
        self.parts = {k: self.part(g['parts'][k]) & m for k in PARTS}
        # where a leg must stop: a part's edge, or a seam's crossing — every cell's key, the part it is in and which side of every seam it lies
        key = np.zeros((self.R, self.N), np.int32)
        for i, k in enumerate(PARTS):
            key[self.parts[k]] = i + 1
        bit = 1
        for name, q in g['seams'].items():
            a, b = q['span']
            if q['along'] == 'y':
                x = np.polyval(q['p'], self.py)
                side = (self.px > x).astype(np.int32) + 2 * (self.px > 2 * redgeo.AXIS - x)
                on = (self.py >= a) & (self.py <= b)
            else:
                side = (self.py > np.polyval(q['p'], (self.px - redgeo.AXIS) ** 2)).astype(np.int32)
                on = (self.px >= a) & (self.px <= b)
            key += 16 * bit * np.where(on, side + 1, 0)
            bit *= 4
        self.key = np.where(m, key, -1)
        self.body = m & (key % 16 == 0)
        T = np.zeros((self.R, self.N, 3), np.float32)
        for c in range(3):
            sharp = self.samp(self.photo[..., c], (0.9, 1.4))
            wide = self.samp(self.photo[..., c], (7.0, 7.0))
            T[..., c] = sharp + 0.30 * (sharp - wide)
        T = np.clip(T, 0, 1)
        lab = to_lab(T)
        L, A, B = lab[..., 0], lab[..., 1], lab[..., 2]
        # the body's shadows a deep red, the car's own, not black; the glass, the louvres, the rubber stay dark and neutral
        Lb = np.interp(L, [0, 8, 16, 24, 32, 45, 60, 80, 100], [16, 18, 21, 25, 31, 45, 60, 80, 100])
        Lo = np.interp(L, [0, 8, 20, 35, 50, 70, 100], [14, 18, 27, 37, 50, 70, 100])
        deep = np.clip((30 - L) / 18, 0, 1) * self.body
        Ln = np.where(self.body, Lb, Lo)
        An = A * (1 - deep) + 38.0 * deep
        Bn = B * (1 - deep) + 24.0 * deep
        T = lab2lin(np.stack([Ln, An, Bn], -1)).astype(np.float32)
        side = m & ~(np.roll(m, 1, axis=1) & np.roll(m, -1, axis=1))
        T = np.where(side[..., None], T * 0.85, T)
        # the mirrors alike, as the right one: the left lies in shadow in the picture and looked the smaller (comments-1.jpg, 4); the grid is even about the axis, column c and N-1-c
        mi = self.parts['mirrors']
        left = mi & (self.px < redgeo.AXIS)
        T[left] = T[:, ::-1][left]
        self.lock = -np.ones((self.R, self.N), np.int16)
        self.locks()
        return T

    def locks(self):
        """What a 5 mm brush holds of the small things, by geometry: the seams along the brush a column, the scuttle's across 6 mm; the cap, the carbon, the posts,
        the tail lights and the indicators their own jars; the louvres in rows at the picture's own pitch."""
        F = {q[0]: i for i, q in enumerate(RED_FIXED)}
        L, g, s = self.lock, self.g, self.s
        P_ = self.parts
        d = redgeo.seam_dist(g['seams'], self.px, self.py, ['bonnet_side', 'lid_side'])
        L[(d * s < PITCH / 2) & self.body] = F['seam']
        d = redgeo.seam_dist(g['seams'], self.px, self.py, ['scuttle'])
        L[(d * s < 3.0) & self.mask & ~P_['wind']] = F['seam']
        # the black shadow down the right of the bonnet's middle, a column, carried up past the picture's black (comments-1.jpg, 2): ink from y 380, the seam's dark red above
        sh = redgeo.line_dist(redgeo.SHADOW, self.px, self.py) * s < PITCH / 2
        L[sh & self.body & (self.py < 380)] = F['seam']
        L[sh & self.body & (self.py >= 380)] = F['ink']
        # the rear wings' thin white light, a column each side, the same both sides (comments-1.jpg, 6)
        wing = [(2 * redgeo.AXIS - x, y) for x, y in redgeo.WING]
        wl = np.minimum(redgeo.line_dist(redgeo.WING, self.px, self.py), redgeo.line_dist(wing, self.px, self.py)) * s < PITCH / 2
        L[wl & self.body] = F['chrome']
        # the rear window's two arcs of light, 5 mm across (comments-1.jpg, 5)
        d = redgeo.seam_dist(g['seams'], self.px, self.py, ['arc_hi', 'arc_lo'])
        L[(d * s < 2.5) & P_['rear']] = F['glass']
        L[P_['diffuser']] = F['carbon']
        L[P_['posts']] = F['chromeM']
        L[P_['tail']] = F['tail']
        L[P_['amber'] & ~P_['tail']] = F['amber']
        # the louvres: the picture's three bright slats, 20 px (11 mm) apart, rows at their own heights, louvre grey on the ink; under them, in the black of the intake,
        # its two little upright chrome pieces, a leg each — at ±48 and ±60 px in the picture, put even at a column each side, ±27.5 mm
        self.slats = SLATS
        gr = P_['grille']
        L[gr] = F['ink']
        for y in self.slats:
            L[gr & (np.abs(self.py - y) * s < 2.5)] = F['louvre']
        mid = self.W / 2
        for x in (mid - 27.5, mid + 27.5):
            c = int(np.argmin(np.abs(self.xs - x)))
            on = (self.py[:, c] >= 1450) & (self.py[:, c] <= 1472) & gr[:, c]
            L[on, c] = F['louvre']
        # the headlights: the lens white, with two or three black strokes where the picture's lens is darkest along a column (the owner, 2026-11-08: "the lenses must be
        # white, do not change them to black; two or three black strokes on a white ground are enough"); round it the metal (lights.png: "not just glass but a metal contour
        # too … the volume comes at once"), the rim above the lens and the crescent under it, each column's piece a grey by the picture's light there, mid or dark, so the
        # bezel turns; a piece under 4 mm takes the other's grey, one leg under the lens. The left one off the picture, the right its mirror, column for column
        hx, hy, ha, hb = redgeo.HEAD
        lx, ly, la, lb_ = redgeo.LENS
        inl = ((self.px - lx) / la) ** 2 + ((self.py - ly) / lb_) ** 2 <= 1
        gL = ndi.gaussian_filter(g['lab'][..., 0], 1.0)
        at = lambda rr, c: ndi.map_coordinates(gL, [self.py[rr, c], self.px[rr, c]], order=1)
        grey = lambda v: F['chromeM'] if v >= 55 else F['chromeD']
        hd = P_['heads']
        strokes = []
        for c in range(self.N // 2):
            rows = np.flatnonzero(hd[:, c])
            if not len(rows):
                continue
            lens = rows[inl[rows, c]]
            if len(lens) < 5:
                L[rows, c] = grey(float(at(rows, c).mean()))
                continue
            rim, cres = rows[rows < lens.min()], rows[rows > lens.max()]
            v = {k: grey(float(at(rr, c).mean())) for k, rr in (('rim', rim), ('cres', cres)) if len(rr)}
            if 'rim' in v and 'cres' in v:
                if len(rim) < 4:
                    v['rim'] = v['cres']
                elif len(cres) < 4:
                    v['cres'] = v['rim']
            if len(rim):
                L[rim, c] = v['rim']
            if len(cres):
                L[cres, c] = v['cres']
            L[lens, c] = F['chrome']
            dark = lens[at(lens, c) < 25]
            if len(dark):                                                       # its longest dark run, a stroke if 5 mm at least
                runs = np.split(dark, np.flatnonzero(np.diff(dark) > 1) + 1)
                best = max(runs, key=len)
                if len(best) >= 5:
                    strokes.append((len(best), c, best))
        took = []                                                               # strokes apart, a column of white between: three strokes, not one blot
        for n, c, rr in sorted(strokes, key=lambda q: -q[0]):
            if len(took) < 3 and all(abs(c - t) > 1 for t in took):
                took.append(c)
                L[rr, c] = F['ink']
        for c in range(self.N // 2):
            rows = np.flatnonzero(hd[:, c])
            L[rows, self.N - 1 - c] = L[rows, c]

    def plan(self):
        """hyper2's plan, every column cut at a part's edge and a seam's crossing (self.key), its carry kept on its own side of them"""
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
        ban_body[[i for i, q in enumerate(RED_FIXED) if q[0] != 'seam']] = 400.0
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
            lab2[:, 1] += self.JIT[0] * (2 * taua[c] - 1 + 0.5 * na) * fade
            lab2[:, 2] += self.JIT[1] * (2 * taub[c] - 1 + 0.5 * nb) * fade
            lab2 *= WEIGHT
            applied = np.zeros((R, 3), np.float32)
            key = self.key[:, c].astype(np.int64) * 64 + self.lock[:, c].astype(np.int64) + 1
            on = np.flatnonzero(m)
            cuts = sorted(set([0, R] + [int(q) + 1 for q in np.flatnonzero(np.diff(key) | np.diff(m.astype(np.int64)))]))
            for u, v in zip(cuts[:-1], cuts[1:]):
                if not m[u]:
                    continue
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
            dark = lab[:, 0] < 30
            err[dark] = np.clip(err[dark], -0.04, 0.04)
            if c < N - 1:
                gate = (np.abs(Lstar[:, c + 1] - Lstar[:, c]) < 14) & self.mask[:, c + 1] & (self.key[:, c + 1] == self.key[:, c])
                carry = self.GAIN * err * gate[:, None]
        lums = np.array([P[p].lum for p in self.pids] + [2.0])
        form[self.mask] = 0
        form[self.mask & (lums[grid] < 0.03)] = 1
        form[self.lock >= 0] = 1                                                        # as hyper2's: a locked thing no idle run, the dark's dose
        self.grid, self.form = grid, form
        return self


if __name__ == '__main__':
    ppm = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    loops = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    out = sys.argv[3] if len(sys.argv) > 3 else 'porsche-red.jpg'
    t0 = time.time()
    car = RedCar()
    print('columns', car.N, 'scale mm/px', round(car.s, 4), 'car cells', int(car.mask.sum()), 'car width mm', int(car.mask.any(axis=0).sum() * PITCH), 'slats', car.slats, flush=True)
    # the jars: the kept ones (porsche-red.jars.json), so that an edit in one place does not re-make the palette and with it every column — the roof the owner liked
    # (roof-1-2.png) stays as it was; RED_NEW_JARS=1 makes them again from the picture and keeps those
    keep = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'porsche-red.jars.json')
    if os.path.exists(keep) and not os.environ.get('RED_NEW_JARS'):
        jars = []
        for name, hexv, coats in RED_FIXED + [(q['name'], q['hex'], q['coats']) for q in json.load(open(keep))['jars']]:
            p = H.jar(hexv, coats, name)
            p.name = name
            jars.append(p)
        print('jars kept', len(jars), flush=True)
    else:
        jars = car.make_jars()
        fixed = {q[0] for q in RED_FIXED}
        json.dump(dict(note='the red 911\'s jars made to measure, kept; the fixed ones are redcar.py\'s RED_FIXED', jars=[dict(name=p.name, hex=p.hex, coats=int(p.coats)) for p in jars if p.name not in fixed]), open(keep, 'w'), indent=1)
    car.use(jars)
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
    print('legs', st['legs'], 'lifts', st['runs'], 'line m', round(st['line'] / 1000, 1), 'idle m', round(st['idle'] / 1000, 1), 'dips', int(st['dips']), 'short<12', st['shortlegs'], 'jars', len(st['per']), 'two-coat jars', two)
    pickle.dump(dict(grid=car.grid, form=car.form, st=st, jars=[(p.name, p.hex, p.coats) for p in car.pal.jars]), open(out + '.pkl', 'wb'))
