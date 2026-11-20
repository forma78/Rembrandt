"""HOLO2's pictures (2026-11-20). Not part of the app: it writes app/holo2/<id>.json and its renders.

The owner, 2026-11-20: "I made the tab HOLO2; Untitled-19.png lies in it … we need Untitled-19.png on 60 × 60, no more than 10 colours.
I can mix 10 more jars — but you can use the ones we have." The difference from HOLO: "the brush goes back and forth without a stop,
now and then going down on a diagonal or a short way left or right. These horizontal lines are the most dangerous: the paint may not
lay there, our brush is flat. We draw the horizontal lines all the same, but on paper in the canvas's place, and test: we photograph,
study and correct the fragments of the brush's way that fail." What stays from HOLO: "the principle Layer 1, Layer 2. Yellow mixes
with blue and gives mud, so the blues and the whites go in one layer, the red and the yellow in the other." Then, the same day:
"Untitled-19.png is only a drawing, the drops will likely go otherwise when the brush drives; what matters is the principle of two
layers, two runs — the blues and white, then the red and yellow, once the first has dried."

The picture is ribbons, every ribbon its lanes along it, the brush apart, as a road's markings (the owner, the same day, of the first
try, its strokes across the ribbons: "very beautiful, but the stripes must run along, as the markings of a road, not as the boards of a
fence or sleepers"; HOLO2/Untitled-20.png, "here are the stripes the right way"), the colour changing band by band along it. So:
  - the mask: what is painted, off the cream ground;
  - the field: the ribbon's way at every point, two readings of it — the ribbon's own edges, and the picture's texture (its dabs) where
    two ribbons cross, the one on top showing;
  - the lanes: lines along that field, `pitch` apart across the ribbon (the brush, 5 mm), the first `edge` mm in from a ribbon's edge,
    every next seeded `pitch` beside one laid (Jobard and Lefer's evenly spaced lines); a lane stops at the ribbon's end, near another
    lane, or where it would turn off its way inside a crossing (the ribbon under another: painted only where it shows);
  - the colours: every point the nearest of the owner's jars in CIELAB, a run along a lane shorter than `minrun` given to its neighbour;
  - Layer 1 the cool jars (the blues and the white), Layer 2 the warm (the yellow, the oranges, the reds) — the owner's split;
  - the snakes: a colour's band, its lanes one after another, along a lane, a few mm aside to the next at the band's end ("a short way
    left or right, or on a diagonal"), back along it … the brush down throughout, as HOLO's legs; a new snake where none lies beside.
The dabs, the batches and the run are the app's (app/src/holo2plan.js), from the snakes.

python holo2_gen.py [id …]        (a venv with numpy, pillow, scipy and scikit-image; any working directory; about a minute)
"""
import sys, os, json, math
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd
from scipy.spatial import cKDTree
from skimage import measure

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(ROOT, 'app', 'holo2')
R = 2                      # px a mm, the work raster
GROUND = (243, 240, 230)   # the primed canvas as the app draws it (holo.js's GROUND)

# the owner's jars, the 10 of the picture: id, name, his number (None: none on the lid), hex, layer, seen, note. The hexes as the jars are
# known elsewhere: a numbered one FORM-G's (app/formg/*.json, jars.json's `mine`), HOLO's unnumbered ones holo_jars.py's (est.)
JARS = [
    ('j1', 'Jar 1', 1, '#E6E5DF', 1, 'formg', 'the white, the pale between the warm and the cool'),
    ('sky', 'Sky', None, '#58BCF6', 1, 'photo', "HOLO's, no number on its lid yet"),
    ('skyblue', 'Sky Blue', None, '#4090C0', 1, 'tube', "HOLO's new jar, Sky Blue straight from the tube"),
    ('blue04', 'Blue 04', None, '#1653AA', 1, 'tube', "HOLO's new jar, the blue marked 04 on the palette sheet, straight from the tube"),
    ('ultra', 'Ultramarine', None, '#101F7E', 1, 'tube', "HOLO's new jar, Ultramarine straight from the tube"),
    ('j52', 'Jar 52', 52, '#F8C126', 2, 'mine', 'the yellow'),
    ('amber', 'Amber', None, '#FFA401', 2, 'photo', "HOLO's, no number on its lid yet"),
    ('j14', 'Jar 14', 14, '#E5281E', 2, 'formg', 'the red orange'),
    ('j20', 'Jar 20', 20, '#C12614', 2, 'formg', 'the red'),
    ('j39', 'Jar 39', 39, '#5A0D0D', 2, 'formg', 'the dark red'),
]

PICS = {
    'holo2-19': dict(src='HOLO2/Untitled-19.png', crop=(54, 40, 972, 984), w=600, h=600, field=540, title='HOLO2 · 19, the ribbons',
                     sub='the ribbons, 60 × 60', jars=[j[0] for j in JARS]),
}
# est.: pitch, the lanes apart across a ribbon, the brush (5 mm); track, what a lane lays across (LAB's real 3 measured ≈ 8 mm); edge, the first lane in from a ribbon's edge (half the brush); kink, a lane's
# turn in one step of half a mm at most, degrees (noise); cross, how far a lane may turn off its way inside a crossing before it ends there,
# degrees; near, how close to another lane it may come (× pitch); seed, a new lane's least distance from the others (× pitch); minlen, a lane
# or a piece shorter is none; minrun, a colour along a lane shorter goes to its neighbour; link, the brush down from a lane to the next at
# most (× pitch); parallel, two lanes' ends a snake joins at most so far off one way, degrees; lasts, a dab along the line (HOLO's 55)
EST = dict(pitch=5.0, track=7.0, edge=2.5, kink=12.0, cross=25.0, near=0.45, seed=0.85, minlen=4.0, minrun=8.0, link=2.4, parallel=40.0, lasts=55.0)


def hexrgb(h): return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)]) / 255.0


def lab(rgb):
    rgb = np.asarray(rgb, float)
    c = np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)
    M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    t = c @ M.T / np.array([0.95047, 1, 1.08883])
    f = np.where(t > 216 / 24389, np.cbrt(t), (24389 / 27 * t + 16) / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)


def load(P):
    im = Image.open(os.path.join(ROOT, P['src'])).convert('RGB').crop(P['crop'])
    return np.asarray(im.resize((P['w'] * R, P['h'] * R), Image.LANCZOS)).astype(float) / 255


def maskOf(a):
    """what is painted: off the ground by colour, ΔE over 4.5 in CIELAB from the ground's median (its lightest px, L* over 90) — the white
    ribbon is ΔE 5 … 9 off the cream (the owner, of a break in it, `HOLO2/Screenshot 2026-11-20 at 4.48.03 PM.png`: "there is no break here");
    the dabs' gaps closed, specks out"""
    med = np.stack([nd.median_filter(a[..., i], size=5) for i in range(3)], -1)
    L = lab(med)
    g = np.median(L[L[..., 0] > 90], 0)
    m = np.linalg.norm(L - g, axis=2) > 4.5
    m = nd.binary_opening(nd.binary_closing(m, iterations=3), iterations=2)
    lab_, n = nd.label(m)
    sizes = nd.sum(m, lab_, range(1, n + 1))
    keep = np.isin(lab_, 1 + np.flatnonzero(sizes >= 50 * R * R))
    return keep, med


def fieldOf(a, mask, sigma=14, wide=31.0):
    """the rungs' way at every px, two readings of it as structure tensors (image px, y down), each its trace 1:
      - the texture's: the picture's lightness, its strongest gradient — the dabs' gaps run along the ribbon, so across it (σ 7 mm);
      - the ribbon's own: the distance to the ground, its gradient square to the nearest edge, so across a ribbon of one width.
    Where the paint is wider than one ribbon (`wide` mm from its middle to the ground, the local most; a ribbon ≈ 26 mm, est.) — a crossing,
    two side by side — the texture alone: it shows the ribbon on top; elsewhere the edges first, the texture with them (its grid of dabs
    reads both ways in places). → the doubled angle in the canvas's mm, y up"""
    tens = lambda gx, gy, s: [nd.gaussian_filter(v, s) for v in (gx * gx, gy * gy, gx * gy)]
    norm = lambda T: [v / (T[0] + T[1] + 1e-12) for v in T]
    L = a @ [0.299, 0.587, 0.114]
    Tt = norm(tens(nd.sobel(L, 1), nd.sobel(L, 0), sigma))
    dist = nd.distance_transform_edt(mask) / R
    ds = nd.gaussian_filter(dist, 2)
    Td = norm(tens(nd.sobel(ds, 1), nd.sobel(ds, 0), 6))
    loc = nd.maximum_filter(dist, size=int(30 * R) + 1)
    wd = np.clip((wide - loc) / 4.0, 0, 1)
    Jxx, Jyy, Jxy = (Tt[i] * (0.25 + (1 - wd)) + Td[i] * wd for i in range(3))
    th = 0.5 * np.arctan2(2 * Jxy, Jxx - Jyy)          # image coords; in mm (y up) the angle is −th
    return np.cos(2 * th), -np.sin(2 * th), wd, dist


class Field:
    """the field on the work raster: the rung's way (across a ribbon) as a doubled angle, the single-ribbon weight, the distance to the ground"""
    def __init__(self, c2, s2, wd, dist, mask, h):
        self.c2, self.s2, self.wd, self.dist, self.mask, self.h = c2, s2, wd, dist, mask, h
        self.rows, self.cols = mask.shape

    def px(self, p): return (self.h - p[1]) * R - 0.5, p[0] * R - 0.5

    def ij(self, p):
        r, c = self.px(p); return int(round(r)), int(round(c))

    def ok(self, i, j): return 0 <= i < self.rows and 0 <= j < self.cols

    def along(self, p):
        """the ribbon's way at p, a unit vector (either sense): the rung's way turned a quarter"""
        r, c = self.px(p)
        i, j = int(math.floor(r)), int(math.floor(c)); fr, fc = r - i, c - j
        i0, i1, j0, j1 = max(0, min(self.rows - 1, i)), max(0, min(self.rows - 1, i + 1)), max(0, min(self.cols - 1, j)), max(0, min(self.cols - 1, j + 1))
        bl = lambda A: (A[i0, j0] * (1 - fc) + A[i0, j1] * fc) * (1 - fr) + (A[i1, j0] * (1 - fc) + A[i1, j1] * fc) * fr
        a = 0.5 * math.atan2(bl(self.s2), bl(self.c2))
        return np.array([-math.sin(a), math.cos(a)])

    def lane(self, p, edge):
        i, j = self.ij(p); return self.ok(i, j) and self.dist[i, j] >= edge - 0.25

    def wide(self, p):
        i, j = self.ij(p); return self.ok(i, j) and self.wd[i, j] < 0.5


class Occ:
    """the lanes laid so far on a raster, for the distance tests"""
    def __init__(self, shape, h):
        self.o = np.zeros(shape, bool); self.h = h; self.disks = {}

    def disk(self, rad):
        k = int(math.ceil(rad * R))
        if k not in self.disks:
            yy, xx = np.mgrid[-k:k + 1, -k:k + 1]; sel = yy * yy + xx * xx <= (rad * R) ** 2
            self.disks[k] = (yy[sel], xx[sel])
        return self.disks[k]

    def near(self, p, rad):
        r, c = int(round((self.h - p[1]) * R - 0.5)), int(round(p[0] * R - 0.5))
        dy, dx = self.disk(rad)
        rr, cc = r + dy, c + dx
        ok = (rr >= 0) & (rr < self.o.shape[0]) & (cc >= 0) & (cc < self.o.shape[1])
        return bool(self.o[rr[ok], cc[ok]].any())

    def add(self, pts):
        for p in pts:
            r, c = int(round((self.h - p[1]) * R - 0.5)), int(round(p[0] * R - 0.5))
            if 0 <= r < self.o.shape[0] and 0 <= c < self.o.shape[1]: self.o[r, c] = True


def lanesOf(F, occ, pitch, E):
    """the lanes, along the field, `pitch` apart: the first of a ribbon `edge` in from its edge, every next seeded beside one laid"""
    step, cosK, cosX = 0.5, math.cos(math.radians(E['kink'])), math.cos(math.radians(E['cross']))
    near, seedD = E['near'] * pitch, E['seed'] * pitch

    def half(seed, v0):
        pts, p, v, enter, keep = [], seed, v0, None, 0
        own = {}
        for n in range(6000):
            t1 = F.along(p); t1 = t1 if t1 @ v >= 0 else -t1
            t2 = F.along(p + t1 * step / 2); t2 = t2 if t2 @ v >= 0 else -t2
            if t2 @ v < cosK: break
            q = p + t2 * step
            if not F.lane(q, E['edge']) or occ.near(q, near): break
            cell = (int(q[0] // 2), int(q[1] // 2))                       # its own way again (a ring): no
            if any(k < n - 30 and np.linalg.norm(pts[k] - q) < near for dx in (-1, 0, 1) for dy in (-1, 0, 1) for k in own.get((cell[0] + dx, cell[1] + dy), ())): break
            # a crossing: the way it came in kept; turned off it more than `cross`, it ends where it was still on it
            if F.wide(q):
                if enter is None: enter, keep = v.copy(), len(pts)
                dev = t2 @ enter
                if dev >= math.cos(math.radians(6)): keep = len(pts) + 1
                if dev < cosX: pts = pts[:keep]; break
            else: enter = None
            own.setdefault(cell, []).append(n); pts.append(q); p, v = q, t2
        return pts

    H, W = F.rows / R, F.cols / R
    # the first seeds: a ribbon's edge, `edge` in; then anywhere left
    band = [np.array([x, y]) for y in np.arange(H - 1, 0, -2.0) for x in np.arange(1, W, 2.0) if F.lane(np.array([x, y]), E['edge']) and F.dist[F.ij(np.array([x, y]))] < E['edge'] + 0.75]
    rest = [np.array([x, y]) for y in np.arange(H - 1.5, 0, -3.0) for x in np.arange(1.5, W, 3.0)]
    grid, gi, queue, lanes = band + rest, 0, [], []
    while True:
        if not queue:
            while gi < len(grid) and (not F.lane(grid[gi], E['edge']) or occ.near(grid[gi], seedD)): gi += 1
            if gi >= len(grid): break
            queue.append(grid[gi]); gi += 1
        seed = queue.pop(0)
        if not F.lane(seed, E['edge']) or occ.near(seed, seedD): continue
        t0 = F.along(seed)
        pts = half(seed, -t0)[::-1] + [seed] + half(seed, t0)
        if len(pts) < 2 or np.linalg.norm(np.diff(np.array(pts), axis=0), axis=1).sum() < E['minlen']: continue
        occ.add(pts); lanes.append(np.array(pts))
        for k in range(0, len(pts), 10):                                    # every 5 mm along it, a seed a pitch either side
            t = F.along(pts[k]); nrm = np.array([-t[1], t[0]])
            queue.append(pts[k] + nrm * pitch); queue.append(pts[k] - nrm * pitch)
    return lanes


def piecesOf(lanes, labels, F, E):
    """every lane cut where its colour changes: [{ pts, jar }], a run shorter than minrun given to its longer neighbour"""
    out, minN = [], max(1, int(round(E['minrun'] / 0.5)))
    for L in lanes:
        rr = np.clip(np.round((F.h - L[:, 1]) * R - 0.5).astype(int), 0, F.rows - 1)
        cc = np.clip(np.round(L[:, 0] * R - 0.5).astype(int), 0, F.cols - 1)
        runs = []
        for v in labels[rr, cc]:
            if runs and runs[-1][0] == v: runs[-1][1] += 1
            else: runs.append([v, 1])
        while len(runs) > 1:
            k = min(range(len(runs)), key=lambda i: runs[i][1])
            if runs[k][1] >= minN: break
            nb = [i for i in (k - 1, k + 1) if 0 <= i < len(runs)]
            j = max(nb, key=lambda i: runs[i][1])
            runs[j][1] += runs[k][1]; del runs[k]
            m = []
            for q in runs:
                if m and m[-1][0] == q[0]: m[-1][1] += q[1]
                else: m.append(q)
            runs = m
        i0 = 0
        for v, k in runs:
            P = L[i0:i0 + k + (1 if i0 + k < len(L) else 0)]                # the piece to its neighbour's first point: no gap between colours
            if len(P) >= 2 and np.linalg.norm(np.diff(P, axis=0), axis=1).sum() >= E['minlen']: out.append(dict(pts=P, jar=int(v)))
            i0 += k
    return out


def snakesOf(pieces, pitch, E):
    """a jar's pieces into snakes: from a piece's end on to a piece of its jar lying beside it, its end within `link` pitches and pointing
    the same way — the brush down across, "a short way left or right, or on a diagonal" — and back along it to its other end"""
    cosP = math.cos(math.radians(E['parallel'])); link = E['link'] * pitch
    def outward(P, end):                                                     # the way out of a piece at an end, over its last 2 mm
        k = min(len(P) - 1, 4)
        d = (P[0] - P[k]) if end == 0 else (P[-1] - P[-1 - k])
        return d / (np.linalg.norm(d) or 1)
    by = {}
    for i, p in enumerate(pieces): by.setdefault(p['jar'], []).append(i)
    snakes = []
    for jar, ids in by.items():
        ends = np.array([pieces[i]['pts'][0 if k == 0 else -1] for i in ids for k in (0, 1)])
        tree = cKDTree(ends)
        out = {(i, k): outward(pieces[i]['pts'], k) for i in ids for k in (0, 1)}
        mid = {i: pieces[i]['pts'][len(pieces[i]['pts']) // 2] for i in ids}
        def nbrs(i, k):
            at, e = pieces[i]['pts'][0 if k == 0 else -1], out[(i, k)]
            res = []
            for q in tree.query_ball_point(at, link):
                j, kk = ids[q // 2], q % 2
                if j != i and e @ out[(j, kk)] >= cosP: res.append((float(np.linalg.norm(ends[q] - at)), j, kk))
            return res
        deg = {i: len({j for _, j, _ in nbrs(i, 0) + nbrs(i, 1)}) for i in ids}
        left = set(ids)
        while left:
            i = min(left, key=lambda q: (deg[q], ids.index(q)))
            P = pieces[i]['pts']
            # the first piece's way: out at the end its neighbours lie by, else from the end nearer the canvas's top left
            n0, n1 = [x for x in nbrs(i, 0) if x[1] in left], [x for x in nbrs(i, 1) if x[1] in left]
            fwd = P if (n1 and not n0) or (not n0 and not n1 and (P[0][0] - P[0][1]) <= (P[-1][0] - P[-1][1])) else P[::-1]
            if n0 and not n1: fwd = P[::-1]
            chain = [fwd]; left.discard(i); cur, curK, prog = i, (1 if fwd is P else 0), None
            while True:
                cand = [(dd + (5.0 if prog is not None and (mid[j] - mid[cur]) @ prog < 0 else 0.0), j, kk) for dd, j, kk in nbrs(cur, curK) if j in left]
                if not cand: break
                _, j, kk = min(cand)
                Q = pieces[j]['pts']
                chain.append(Q if kk == 0 else Q[::-1])
                prog = mid[j] - mid[cur]; cur, curK = j, (1 if kk == 0 else 0); left.discard(j)
            snakes.append(dict(jar=jar, legs=chain))
    return snakes


def orderSnakes(snakes, start=(0.0, 600.0)):
    """a jar's snakes nearest first from where the last one ended, each the way that starts nearer"""
    out, at, left = [], np.array(start), list(snakes)
    while left:
        best = min(range(len(left)), key=lambda k: min(np.linalg.norm(left[k]['legs'][0][0] - at), np.linalg.norm(left[k]['legs'][-1][-1] - at)))
        s = left.pop(best)
        if np.linalg.norm(s['legs'][-1][-1] - at) < np.linalg.norm(s['legs'][0][0] - at):
            s = dict(jar=s['jar'], legs=[g[::-1] for g in reversed(s['legs'])])
        out.append(s); at = s['legs'][-1][-1]
    return out


def rdp(pts, eps):
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]; ab = b - a; L = np.linalg.norm(ab)
    v = pts - a
    d = np.abs(ab[0] * v[:, 1] - ab[1] * v[:, 0]) / L if L > 0 else np.linalg.norm(v, axis=1)
    k = int(np.argmax(d))
    if d[k] > eps: return np.vstack([rdp(pts[:k + 1], eps)[:-1], rdp(pts[k:], eps)])
    return np.vstack([a, b])


def contoursOf(cover, h, minmm=8.0, eps=0.35):
    """a coverage raster's borders as lines in mm, simplified"""
    out = []
    for c in measure.find_contours(nd.gaussian_filter(cover.astype(float), 0.8), 0.5):
        pts = np.stack([(c[:, 1] + 0.5) / R, h - (c[:, 0] + 0.5) / R], 1)
        if np.linalg.norm(np.diff(pts, axis=0), axis=1).sum() < minmm: continue
        out.append(rdp(pts, eps))
    return out


def plen(P): return float(np.linalg.norm(np.diff(P, axis=0), axis=1).sum()) if len(P) > 1 else 0.0


def run(pid):
    P = PICS[pid]; E = dict(EST); jars = [j for j in JARS if j[0] in P['jars']]
    a = load(P); mask, med = maskOf(a)
    c2, s2, wd, dist = fieldOf(a, mask)
    F = Field(c2, s2, wd, dist, mask, P['h'])
    # the field: the picture's painted part as wide as P['field'] at most across, centred on the canvas (60 × 60: MARKS on its margins)
    rows, cols = np.nonzero(mask)
    x0, x1 = cols.min() / R, (cols.max() + 1) / R; y0, y1 = P['h'] - (rows.max() + 1) / R, P['h'] - rows.min() / R
    s = min(1.0, P['field'] / (x1 - x0), P['field'] / (y1 - y0))
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    to = lambda Q: np.stack([P['w'] / 2 + (Q[:, 0] - cx) * s, P['h'] / 2 + (Q[:, 1] - cy) * s], 1)
    # the drawing's own mm: the lanes the brush apart on the canvas, the first half the brush in from the edge
    Ei = dict(E, edge=E['edge'] / s, minlen=E['minlen'] / s, minrun=E['minrun'] / s)
    pitch = E['pitch'] / s
    lanes = lanesOf(F, Occ(mask.shape, P['h']), pitch, Ei)
    # the colours: every px the nearest jar (CIELAB) of the picture smoothed; the canon of the jars (README, 2026-11-08): a jar with less line
    # than the canvas's long side goes, its px to the nearest jar that stays, the shortest first, again and again; it stays as a last resort
    # when even its nearest is over ΔE 25 (est.)
    JL = lab(np.array([hexrgb(j[3]) for j in jars])); L_ = lab(med)
    live, gone = list(range(len(jars))), {}
    while True:
        labels = np.array(live)[np.argmin(((L_[..., None, :] - JL[live][None, None]) ** 2).sum(-1), -1)]
        pieces = piecesOf(lanes, labels, F, Ei)
        mm = {i: sum(plen(q['pts']) for q in pieces if q['jar'] == i) * s for i in live}
        drop = None
        for v, i in sorted((v, i) for i, v in mm.items() if v < max(P['w'], P['h'])):
            k = min((k for k in live if k != i), key=lambda k: np.linalg.norm(JL[k] - JL[i]))
            if np.linalg.norm(JL[k] - JL[i]) <= 25: drop = (i, k, v); break
        if not drop: break
        live.remove(drop[0]); gone[jars[drop[0]][1]] = (jars[drop[1]][1], round(drop[2]))
    for g, (k, v) in gone.items(): print(f'  the canon of the jars: {g} ({v} mm of line) → {k}')
    for q in pieces: q['pts'] = rdp(to(q['pts']), 0.12)
    snakes = snakesOf(pieces, E['pitch'], E)
    # the list: Layer 1's jars light to dark, then Layer 2's; a jar's snakes nearest first
    Ls = {i: float(JL[i][0]) for i in range(len(jars))}
    order = [i for i in sorted(range(len(jars)), key=lambda i: (jars[i][4], -Ls[i])) if i in live]
    out_snakes, at = [], (0.0, P['h'])
    for i in order:
        S = orderSnakes([q for q in snakes if q['jar'] == i], at)
        if S: at = tuple(S[-1]['legs'][-1][-1])
        out_snakes += S
    # a jar's dabs as the app counts them (holo2plan.js, workOf): a snake's first leg, then a leg's start whenever `lasts` mm of line has gone
    # since the last (half the leg counted), and every `lasts` mm along a long leg
    def dabsOn(S):
        n, since = 0, None
        for g in S['legs']:
            L = plen(g)
            if since is None or since + min(L, E['lasts']) / 2 >= E['lasts']: n += 1; since = 0.0
            extra = int(max(0.0, since + L - 1e-9) // E['lasts']); n += extra; since = (since + L) - extra * E['lasts']
        return n
    J = []
    for i in order:
        S = [q for q in out_snakes if q['jar'] == i]
        jid, name, num, hx, layer, seen, note = jars[i]
        d = sum(dabsOn(q) for q in S); mm = sum(plen(g) for q in S for g in q['legs'])
        J.append(dict(id=jid, name=name, number=num, hex=hx, L=round(Ls[i], 1), layer=layer, seen=seen, note=note,
                      run1_dabs=d if layer == 1 else 0, run2_dabs=d if layer == 2 else 0, mm=round(mm), snakes=len(S), legs=sum(len(q['legs']) for q in S)))
    # the horizontal share: line within 30° of the canvas's horizontal (the machine's Y) — the brush is flat, the dangerous ones (the owner)
    legs = [g for q in out_snakes for g in q['legs']]
    sin30 = math.sin(math.radians(30))
    def flatMm(g):
        d = np.diff(g, axis=0); L = np.linalg.norm(d, axis=1); return float(L[np.abs(d[:, 1]) < sin30 * np.maximum(L, 1e-9)].sum())
    hor_m = sum(flatMm(g) for g in legs) / 1000
    # the renders: a leg the brush wide, its lane's edges a shade darker, Layer 2 over Layer 1; the coverage for DRAW BW's lines
    W, Hh = P['w'] * R, P['h'] * R
    def render(layers, k=3):
        im = Image.new('RGB', (P['w'] * k, P['h'] * k), GROUND); d = ImageDraw.Draw(im)
        for q in out_snakes:
            j = jars[q['jar']]
            if j[4] not in layers: continue
            col = tuple(int(v * 255) for v in hexrgb(j[3])); edge = tuple(int(v * 0.84) for v in col)
            for g in q['legs']:
                xy = [(x * k, (P['h'] - y) * k) for x, y in g]
                d.line(xy, fill=edge, width=int(round(E['pitch'] * 1.02 * k)), joint='curve')
            for g in q['legs']:
                xy = [(x * k, (P['h'] - y) * k) for x, y in g]
                d.line(xy, fill=col, width=max(1, int(round(E['pitch'] * 0.7 * k))), joint='curve')
        return im
    os.makedirs(OUT, exist_ok=True)
    render({1, 2}).save(os.path.join(OUT, f'{pid}.jpg'), quality=88)
    render({1}).save(os.path.join(OUT, f'{pid}-layer1.jpg'), quality=88)
    per = {i: Image.new('L', (W, Hh), 0) for i in order}
    for q in out_snakes:
        dd = ImageDraw.Draw(per[q['jar']])
        for g in q['legs']: dd.line([(x * R, (P['h'] - y) * R) for x, y in g], fill=255, width=int(round(E['track'] * R)), joint='curve')
    # a jar's paint as the track lays it, the slits between its lanes closed: DRAW BW's lines round the ribbons, not between their lanes
    per = {i: nd.binary_closing(np.asarray(v) > 0, iterations=3) for i, v in per.items()}
    top = np.full((Hh, W), -1, int)                                          # every px of paint its top jar: Layer 2 over Layer 1
    for i in order: top[per[i]] = i
    outline = contoursOf(top >= 0, P['h'])
    # every border between two colours once: a jar's border where it meets a jar later in the list (the bare canvas's is the outline's)
    allb = list(outline)
    for k, i in enumerate(order):
        later = nd.binary_dilation(np.isin(top, order[k + 1:]), iterations=2) if k + 1 < len(order) else np.zeros_like(top, bool)
        for c in contoursOf(top == i, P['h']):
            rr = np.clip(np.round((P['h'] - c[:, 1]) * R).astype(int), 0, Hh - 1); cc = np.clip(np.round(c[:, 0] * R).astype(int), 0, W - 1)
            run_, cur = [], []
            for p, kk in zip(c, later[rr, cc]):
                if kk: cur.append(p)
                elif cur: run_.append(cur); cur = []
            if cur: run_.append(cur)
            allb += [np.array(q) for q in run_ if len(q) > 1 and plen(np.array(q)) >= 6]
    def order_lines(ls):
        out, at, left = [], np.array([0.0, 0.0]), list(ls)
        while left:
            k = min(range(len(left)), key=lambda q: min(np.linalg.norm(left[q][0] - at), np.linalg.norm(left[q][-1] - at)))
            l = left.pop(k)
            if np.linalg.norm(l[-1] - at) < np.linalg.norm(l[0] - at): l = l[::-1]
            out.append([[round(float(x), 1), round(float(y), 1)] for x, y in l]); at = l[-1]
        return out
    allpts = np.concatenate(legs)
    r1 = lambda v: round(float(v), 1)
    plan = dict(id=pid, title=P['title'], sub=P['sub'], version=1, composition='ribbons', w=P['w'], h=P['h'], pitch=E['pitch'],
                field=dict(x0=r1(allpts[:, 0].min() - E['pitch'] / 2), x1=r1(allpts[:, 0].max() + E['pitch'] / 2), y0=r1(allpts[:, 1].min() - E['pitch'] / 2), y1=r1(allpts[:, 1].max() + E['pitch'] / 2)),
                source=P['src'], scale=round(s, 4), image=f'holo2/{pid}.jpg', after1=f'holo2/{pid}-layer1.jpg',
                est=dict(a_dab_lasts=E['lasts'], mark_leg=8, inset=4, s_per_dab=9, edge=E['edge'], cross=E['cross'], minrun=E['minrun'], link=E['link']),
                count=dict(lanes=len(lanes), snakes=len(out_snakes), legs=len(legs), line_m=round(sum(plen(g) for g in legs) / 1000, 1), horizontal_m=round(hor_m, 1)),
                jars=J, gone=[dict(name=g, to=k, mm=v) for g, (k, v) in gone.items()],
                snakes=[dict(jar=jars[q['jar']][0], legs=[[r1(v) for p in g for v in p] for g in q['legs']]) for q in out_snakes],
                contour=dict(outline=order_lines(outline), all=order_lines(allb)))
    with open(os.path.join(OUT, f'{pid}.json'), 'w') as f: json.dump(plan, f, separators=(',', ':'))
    print(pid, f'scale {s:.3f}', f'field {plan["field"]}', f'lanes {len(lanes)}', f'legs {len(legs)}', f'snakes {len(out_snakes)}',
          f'{plan["count"]["line_m"]} m', f'horizontal {plan["count"]["horizontal_m"]} m')
    for j in J: print(f"  L{j['layer']} {j['name']:12s} {j['hex']}  {j['mm'] / 1000:5.1f} m  {j['snakes']:4d} snakes  {j['legs']:5d} legs  {j['run1_dabs'] + j['run2_dabs']:5d} dabs")


if __name__ == '__main__':
    for pid in (sys.argv[1:] or list(PICS)): run(pid)
