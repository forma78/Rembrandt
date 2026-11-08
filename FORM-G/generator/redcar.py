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
# amber, the seams' deep red (now the bonnet's shadow's top and the body's deepest), the glass's and the louvres' dark grey
RED_FIXED = [('chrome', '#E6E5DF', 1), ('chromeM', '#C6C6C1', 1), ('chromeD', '#9B9C9A', 1), ('ink', '#0C0C0C', 2), ('carbon', '#2B2B2C', 1), ('tail', '#E5281E', 1),
             ('amber', '#EE8A22', 1), ('seam', '#3C0608', 2), ('glass', '#4B4D4E', 1)]
H.FIXED = RED_FIXED
SLATS = (1392, 1412, 1432)    # the louvres' bright slats, px: the rows' brightest, across x 340 … 590 of the picture
PARTS = ['wind', 'rear', 'grille', 'sides', 'mirrors', 'heads', 'diffuser', 'posts', 'amber', 'tail']


class RedCar(H.Car):
    """The canon of the 911's form (the owner, 2026-11-08: "I would take the red one as the canon"; "to change the colours but not the form"): a colour of it is a
    subclass that gives its own picture to take the tones from (source), its body's shadows (tone_map), its fixed jars and the jars of its seams, its shadow and its
    wings' light — the geometry, every part, seam and lock's place, stays this one's."""
    FIXED = RED_FIXED
    SEAM, SHADOW, WING = 'seam', ('seam', 'ink'), 'chrome'
    EDGE = (10.0, 0.35)         # a seam across the car: so many mm on its darker side, the light taken down by up to so much at it (est.)
    ALONG = (5.0, 0.25)         # a seam along the car: a column on its darker side, its light taken down by so much (est.)
    WHEEL = (358.0, 727.0, 61.0, 22.0)   # the steering wheel through the glass, an oval ring of ink, centre x, y and half axes in the canon's px — the red's too since
                                         # 2026-11-08 (the owner: "yes, I thought so too; the wheel must be added"); None leaves it out
    KEEP = 'porsche-red.jars.json'
    # the canon 4 % wider than the red picture (the owner, 2026-11-08, of the new white he and Kuzya made, at 0.475 width to length against the red's 0.458, every part
    # along the length within 0.5 %: "its proportions are tasty"; asked how wide the canon: "as the new, +4 %"): the whole form, its glass, mirrors and seams, across
    WIDEN = 0.475 / 0.458
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
        H.FIXED = self.FIXED
        g = redgeo.load()
        self.g = g
        ys, xs = np.where(g['mask'])
        self.s = self.LENGTH_MM / (ys.max() - ys.min() + 1)
        X, Y = np.meshgrid(self.xs, self.ys)
        self.px = redgeo.AXIS + (X - self.W / 2) / (self.s * self.WIDEN)   # the axis between two columns: the left and the right alike
        self.py = (ys.min() + ys.max() + 1) / 2 + (Y - self.H / 2) / self.s
        self.forms = [dict(name='body', idle=True, dose=1.0), dict(name='dark', idle=False, dose=1.3)]
        src = self.source(g)
        self.srcL = ndi.gaussian_filter(to_lab(srgb2lin(np.clip(src, 0, 1) * 255).astype(np.float32))[..., 0], 1.5)
        smooth = np.stack([guided(src[..., k], 5, 0.03 ** 2) for k in range(3)], axis=-1)
        self.photo = srgb2lin(np.clip(smooth, 0, 1) * 255).astype(np.float32)
        self.target0 = self.make_target()
        self.target = self.target0.copy()

    def source(self, g):
        """the picture the tones are taken from, in the canon's own pixels"""
        return g['im']

    def tone_map(self, L, A, B):
        """the body's shadows a deep red, the car's own, not black; the glass, the louvres, the rubber stay dark and neutral"""
        Lb = np.interp(L, [0, 8, 16, 24, 32, 45, 60, 80, 100], [16, 18, 21, 25, 31, 45, 60, 80, 100])
        Lo = np.interp(L, [0, 8, 20, 35, 50, 70, 100], [14, 18, 27, 37, 50, 70, 100])
        deep = np.clip((30 - L) / 18, 0, 1) * self.body
        Ln = np.where(self.body, Lb, Lo)
        return Ln, A * (1 - deep) + 38.0 * deep, B * (1 - deep) + 24.0 * deep

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
        Ln, An, Bn = self.tone_map(lab[..., 0], lab[..., 1], lab[..., 2])
        T = lab2lin(np.stack([Ln, An, Bn], -1)).astype(np.float32)
        side = m & ~(np.roll(m, 1, axis=1) & np.roll(m, -1, axis=1))
        T = np.where(side[..., None], T * 0.85, T)
        # the seams by colour, not by a stroke (the owner, 2026-11-08, lines-.png: "your line is for a drawing in very thin brushes; ours is almost 5 mm, we cannot
        # make such waves; solve it with several colours and make the optical effect of a line"; Kuzya's points 1 and 2, the owner's "yes"): every column is cut where
        # a seam crosses it (self.key), and the side the picture has darker is taken down next to it — across the car its legs' last 10 mm, along it a column — so the
        # line is where two colours meet, not a stroke of its own. Which side is darker, the picture says, seam by seam, the left and the right apart
        self.edges = {}
        for name, q in g['seams'].items():
            if name.startswith('arc'):
                continue
            a, b = q['span']
            if q['along'] == 'y':
                ys = np.arange(a + 6, b - 6, 2.0)
                for sgn in (-1, 1):                                                 # the left seam, then its mirror
                    xs = np.polyval(q['p'], ys) if sgn < 0 else 2 * redgeo.AXIS - np.polyval(q['p'], ys)
                    l_ = ndi.map_coordinates(self.srcL, [ys, xs - 5], order=1).mean()
                    r_ = ndi.map_coordinates(self.srcL, [ys, xs + 5], order=1).mean()
                    dark = -1 if l_ < r_ else 1
                    self.edges[(name, sgn)] = dark
                    x = np.polyval(q['p'], self.py) if sgn < 0 else 2 * redgeo.AXIS - np.polyval(q['p'], self.py)
                    off = (self.px - x) * dark * self.s * self.WIDEN                   # mm into the darker side
                    band = self.body & (self.py >= a) & (self.py <= b) & (off > 0) & (off < self.ALONG[0])
                    T = np.where(band[..., None], T * (1 - self.ALONG[1]), T)
            else:
                xs = np.arange(a + 4, b - 4, 2.0)
                yq = np.polyval(q['p'], (xs - redgeo.AXIS) ** 2)
                up_ = ndi.map_coordinates(self.srcL, [yq - 6, xs], order=1).mean()
                dn_ = ndi.map_coordinates(self.srcL, [yq + 6, xs], order=1).mean()
                dark = -1 if up_ < dn_ else 1                                       # -1: above it (towards the front)
                self.edges[name] = dark
                y = np.polyval(q['p'], (self.px - redgeo.AXIS) ** 2)
                off = (self.py - y) * dark * self.s                                  # mm into the darker side
                band = self.body & (self.px >= a) & (self.px <= b) & (off >= 0) & (off < self.EDGE[0])
                f = 1 - self.EDGE[1] * (1 - off / self.EDGE[0])
                T = np.where(band[..., None], T * f[..., None], T)
        # the mirrors alike, as the right one: the left lies in shadow in the picture and looked the smaller (comments-1.jpg, 4); the grid is even about the axis, column c and N-1-c
        mi = self.parts['mirrors']
        left = mi & (self.px < redgeo.AXIS)
        T[left] = T[:, ::-1][left]
        self.lock = -np.ones((self.R, self.N), np.int16)
        self.locks()
        return T

    def locks(self):
        """What a 5 mm brush holds of the small things, by geometry: the carbon, the posts, the tail lights and the indicators their own jars; the grille a dark mass. Since the owner's "no more fat lines" (2026-11-08) no seam is a stroke of its own:
        make_target gives them by colour."""
        F = {q[0]: i for i, q in enumerate(self.FIXED)}
        L, g, s = self.lock, self.g, self.s
        P_ = self.parts
        # the black shadow down the right of the bonnet's middle, a column, carried up past the picture's black (comments-1.jpg, 2): ink from y 380, the seam's dark red above
        sh = redgeo.line_dist(redgeo.SHADOW, self.px, self.py) * s < PITCH / 2
        L[sh & self.body & (self.py < 380)] = F[self.SHADOW[0]]
        L[sh & self.body & (self.py >= 380)] = F[self.SHADOW[1]]
        # the rear wings' thin white light, a column each side, the same both sides (comments-1.jpg, 6)
        wing = [(2 * redgeo.AXIS - x, y) for x, y in redgeo.WING]
        wl = np.minimum(redgeo.line_dist(redgeo.WING, self.px, self.py), redgeo.line_dist(wing, self.px, self.py)) * s < PITCH / 2
        L[wl & self.body] = F[self.WING]
        # the steering wheel through the glass, an oval ring of ink 5 mm across, where a colour asks for it: centre x, y and half axes, px
        if self.WHEEL:
            cx, cy, ra, rb = self.WHEEL
            u, v = (self.px - cx) / ra, (self.py - cy) / rb
            r = np.hypot(u, v)
            ring = np.abs(r - 1) * np.hypot(ra * u, rb * v) / np.maximum(r, 1e-6) * s < 2.5
            L[ring & P_['wind']] = F['ink']
        # the rear window's two arcs of light, 5 mm across (comments-1.jpg, 5)
        d = redgeo.seam_dist(g['seams'], self.px, self.py, ['arc_hi', 'arc_lo'])
        L[(d * s < 2.5) & P_['rear']] = F['glass']
        L[P_['diffuser']] = F['carbon']
        L[P_['posts']] = F['chromeM']
        L[P_['tail']] = F['tail']
        L[P_['amber'] & ~P_['tail']] = F['amber']
        # the tail's lettering, PORSCHE (the owner, 2026-11-08, porsche-logo.png: "not a solid line: the letters PORSCHE, they read as sticks - - - -, the gaps white"):
        # seven red pieces of 4 columns, a column of the body's colour between, the middle one on the axis, 5 mm high along the bar's middle; past them, inside the
        # engine lid's seams, the body; the side lights on the wings past the seams as they were
        tl = P_['tail']
        mid = self.N // 2
        gaps, last = {3, 8, 13}, 17
        seam_k = int(181 * s * self.WIDEN / PITCH + 0.5)
        for k in range(1, self.N // 2 + 1):
            for c in (mid - k, mid + k - 1):
                rows = np.flatnonzero(tl[:, c])
                if not len(rows):
                    continue
                if k > seam_k:
                    continue
                L[rows, c] = -1
                if k <= last and k not in gaps:
                    m = rows.mean()
                    L[rows[np.abs(rows - m) <= 2.5], c] = F['tail']
        # the grille a dark mass, its louvres a hint (Kuzya's (b), the owner's "agreed": "the grille first one dark area; the louvres only hinted, a slightly lighter
        # grey; not every narrow strip"): the louvres' block one leg of the carbon's dark grey down every column, the intake under it ink; the slats and the intake's
        # two little chrome pieces, a millimetre or two, not strokes of their own
        gr = P_['grille']
        L[gr & (self.py < SLATS[-1] + 12)] = F['carbon']                       # the carbon's grey, a shade off the ink: a hint (the glass's grey read as a slab)
        L[gr & (self.py >= SLATS[-1] + 12)] = F['ink']
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


def main(cls, default_out):
    ppm = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    loops = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    out = sys.argv[3] if len(sys.argv) > 3 else default_out
    t0 = time.time()
    car = cls()
    print('columns', car.N, 'scale mm/px', round(car.s, 4), 'car cells', int(car.mask.sum()), 'car width mm', int(car.mask.any(axis=0).sum() * PITCH), flush=True)
    # the jars: the kept ones (porsche-red.jars.json), so that an edit in one place does not re-make the palette and with it every column — the roof the owner liked
    # (roof-1-2.png) stays as it was; RED_NEW_JARS=1 makes them again from the picture and keeps those
    keep = os.path.join(os.path.dirname(os.path.abspath(__file__)), cls.KEEP)
    if os.path.exists(keep) and not os.environ.get('RED_NEW_JARS'):
        jars = []
        for name, hexv, coats in cls.FIXED + [(q['name'], q['hex'], q['coats']) for q in json.load(open(keep))['jars']]:
            p = H.jar(hexv, coats, name)
            p.name = name
            jars.append(p)
        print('jars kept', len(jars), flush=True)
    else:
        jars = car.make_jars()
        fixed = {q[0] for q in cls.FIXED}
        json.dump(dict(note=f'{cls.__name__}: its jars made to measure, kept; the fixed ones its FIXED', jars=[dict(name=p.name, hex=p.hex, coats=int(p.coats)) for p in jars if p.name not in fixed]), open(keep, 'w'), indent=1)
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


if __name__ == '__main__':
    main(RedCar, 'porsche-red.jpg')
