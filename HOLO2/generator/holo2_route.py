"""HOLO2's picture by the owner's route (2026-11-20). Not part of the app: it writes app/holo2/<id>.json and its renders.

The owner, the same day, of the first plans read off the drawing by an algorithm (a snake a colour's band, hundreds of them): "this is
complicated and long. Let us do it as in ST-JOHN" (ST-JOHN's ▶ Play: one line, loop after loop, the paint taken up from the spokes) — "only we
taught the machine to put the drops itself, we need no more squeezing from tubes onto the canvas". The route is his: he drew it in stages
over the plan's contour, 1 px a mm (`HOLO2/01.png` … `05.png`): blue from the bottom left forward to the bottom right, pink back to the bottom
left ("one ribbon by your route … yes, all right; I build the line stage by stage"; "the brush must drive without a stop"; "we need even
lines").

So:
  - the route: every stage's new line traced from where the last one ended, straight on through every crossing; smoothed (σ `smooth` mm);
  - the lanes: the route moved `pitch` mm aside again and again, `lanes` of them, as ST-JOHN's rings — even, parallel, a road's markings;
  - the snake: lane 1 the whole route forward, a step aside at its end, lane 2 the whole route back … the brush down from start to end;
  - the colours: Untitled-19 read across the ribbon all along the route, the nearest of his jars, bands at least `band` mm long; the canon
    of the jars;
  - a band a group, as HOLO's: its rows of dabs, one on every lane, `spoke` mm apart, every dab upright (the owner: "the brush is flat: it can
    put the drops only as in the first HOLO"), then at once its snake over them, lane after lane, no dip; a jar's groups along the route, then
    the next jar ("first the drops of one colour, the machine drives over them, then the drops of another colour"); Layer 1 the blues and the
    white, Layer 2 the reds and the yellow;
  - the model: the brush taking up a dab and laying it thinner and thinner on, est.

python holo2_route.py [id …]        (holo2_gen.py's venv: numpy, pillow, scipy, scikit-image)
"""
import sys, os, json, math
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd
from skimage.morphology import skeletonize
import holo2_gen as G

R = G.R
PICS = {
    'holo2-19': dict(src='HOLO2/Untitled-19.png', crop=(54, 40, 972, 984), w=600, h=600, field=540, title='HOLO2 · 19, the route',
                     sub='the route, 60 × 60', jars=[j[0] for j in G.JARS],
                     # his stages; his green in `01 update 2.png` stage 1's end, "through, not aside" (the owner: the blue had gone aside there, his
                     # trackpad); `06.png`'s green, stage 4 on up the diagonal from its small loop, as the stages run it
                     stages=['01.png', ('01 update 2.png', 'green'), '02.png', '03.png', '04.png', '05.png']),
}
# est.: pitch, the lanes apart (the brush); lanes, how many (a ribbon 40 mm); smooth, the route's smoothing along it, mm; band, a colour along the
# route at least, mm; spoke, the rows of dabs apart along a band at most, mm; over, a band's drag past its ends into its neighbours, mm; mark, a dab's leg;
# the model: a dab's paint gives out over `fade` mm of lane (HOLO's 55 a dab, est.)
EST = dict(pitch=5.0, lanes=8, smooth=6.0, band=30.0, spoke=40.0, over=10.0, mark=8.0, fade=30.0, track=7.0)


def stageMasks(f, kind='line'):
    a = np.asarray(Image.open(os.path.join(G.ROOT, 'HOLO2', f)).convert('RGB')).astype(int); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    if kind == 'green':                                                                              # his green: the way a line goes, its largest stroke
        m = (g > 150) & (r < 120) & (b < 120)
        lab, n = nd.label(nd.binary_closing(m, iterations=2)); s = nd.sum(m, lab, range(1, n + 1))
        return lab == 1 + int(np.argmax(s))
    return ((b > r + 60) & (b > g + 40) & (b > 120)) | ((r > 170) & (b > 140) & (g < r - 70))      # his blue and his pink


def endsOf(sk):
    nb = nd.convolve(sk.astype(int), np.ones((3, 3), int), mode='constant') - 1
    return np.argwhere(sk & (nb == 1))[:, ::-1]


def traceSk(sk, start, d, gap=40):
    """along a skeleton from `start` the way `d`, straight on through crossings, over gaps up to `gap` px, a hairpin onto new line only"""
    ys, xs = np.nonzero(sk); P = np.stack([xs, ys], 1); vis = np.zeros_like(sk, int)
    cur = np.array(start, int); pts = [cur.astype(float)]; along = 0
    for _ in range(20000):
        vis[cur[1], cur[0]] += 1
        best = None
        for Rr, cone in ((3, 75), (12, 60), (gap, 45), (14, 150)):
            m = (np.abs(P[:, 0] - cur[0]) <= Rr) & (np.abs(P[:, 1] - cur[1]) <= Rr)
            for q in P[m]:
                v = q - cur; L = np.linalg.norm(v)
                if L < 1.5 or L > Rr: continue
                c = (v / L) @ d
                if c < math.cos(math.radians(cone)): continue
                if cone > 90 and (vis[max(0, q[1] - 2):q[1] + 3, max(0, q[0] - 2):q[0] + 3].any() or min(np.linalg.norm(np.array(pts[-60:]) - q, axis=1)) < 6): continue
                score = (1 - c) * 4 + vis[q[1], q[0]] * 3 + (L / Rr) * 0.5
                if best is None or score < best[0]: best = (score, q)
            if best: break
        if best is None and len(pts) > 30:                                              # stuck: the way over the last 30 steps (an arrowhead bends the last few)
            dl = cur - pts[-30]; dl = dl / (np.linalg.norm(dl) or 1)
            m = (np.abs(P[:, 0] - cur[0]) <= gap) & (np.abs(P[:, 1] - cur[1]) <= gap)
            for q in P[m]:
                v = q - cur; L = np.linalg.norm(v)
                if L < 4 or L > gap or vis[q[1], q[0]] or min(np.linalg.norm(np.array(pts[-80:]) - q, axis=1)) < 6: continue
                c = (v / L) @ dl
                if c < math.cos(math.radians(55)): continue
                score = (1 - c) * 4 + (L / gap)
                if best is None or score < best[0]: best = (score, q)
            if best is not None: d = dl
        if best is None and len(pts) > 30:                                              # a sharp turn where the line meets one already run (his arrow into
            allp = np.array(pts)                                                        # a junction, the way on up another): the nearest new line, 8 px clear
            g2 = gap * 1.6
            m = (np.abs(P[:, 0] - cur[0]) <= g2) & (np.abs(P[:, 1] - cur[1]) <= g2)     # of every point run so far, within 110° of the way
            for q in P[m]:
                v = q - cur; L = np.linalg.norm(v)
                if L < 4 or L > g2 or vis[q[1], q[0]] or (v / L) @ dl < math.cos(math.radians(110)) or np.min(np.linalg.norm(allp - q, axis=1)) < 8: continue
                if best is None or L < best[0]: best = (L, q)
            if best is not None: d = (best[1] - cur) / (np.linalg.norm(best[1] - cur) or 1)
        if best is None: break
        cur = best[1]; pts.append(cur.astype(float))
        # back along its own way, the other way round, longer than a crossing (10 steps): the stage's line has ended there, the steps back cut off
        if len(pts) > 60:
            old = np.array(pts[:-40]); dist = np.linalg.norm(old - cur, axis=1); j = int(np.argmin(dist))
            dj = old[min(len(old) - 1, j + 3)] - old[max(0, j - 3)]
            if dist[j] < 3.5 and dj @ d < -0.3 * (np.linalg.norm(dj) or 1):
                along += 1
                if along > 10: pts = pts[:-along]; break
            else: along = 0
        back = pts[-8] if len(pts) >= 8 else pts[0]; dd = cur - back
        if np.linalg.norm(dd) > 0: d = 0.5 * d + 0.5 * dd / np.linalg.norm(dd); d /= np.linalg.norm(d)
    return np.array(pts), d


def routeOf(P):
    """the owner's route, stage by stage: each stage's new line from where the last ended → [[x, y]] mm on the canvas, y up. A green stage
    is his correction of the line before it: that line cut where it comes to the green's start, the green on from there"""
    route, end, d, prev = [], None, None, None
    for f in P['stages']:
        f, kind = (f, 'line') if isinstance(f, str) else f
        m = stageMasks(f, kind)
        new = m if prev is None or kind == 'green' else m & ~nd.binary_dilation(prev, iterations=3)
        if kind != 'green': prev = m
        new = nd.binary_closing(new, iterations=2)
        lab, n = nd.label(new); sz = nd.sum(new, lab, range(1, n + 1)); new = np.isin(lab, 1 + np.flatnonzero(sz >= 40))
        sk = skeletonize(new); ys, xs = np.nonzero(sk); Pk = np.stack([xs, ys], 1)
        if kind == 'green':
            last = route[-1]; half = last[len(last) // 2:]
            E = endsOf(sk); g0 = min(E, key=lambda p: np.min(np.linalg.norm(half - p, axis=1)))
            i = len(last) // 2 + int(np.argmin(np.linalg.norm(half - g0, axis=1)))
            route[-1] = last[:i + 1]                                                   # the line before it, to where the green starts
            dd = last[i] - last[max(0, i - 8)]; d = dd / (np.linalg.norm(dd) or 1)
            start = g0; d = (Pk[np.argsort(np.linalg.norm(Pk - g0, axis=1))[6]] - g0); d = d / (np.linalg.norm(d) or 1)
        elif end is None:
            E = endsOf(sk); start = min(E, key=lambda p: p[1] * -1 + p[0] * 0.2)          # the lowest end, the bottom left
            d = np.array([0.0, -1.0])
        else:                                                                           # the nearest of its new line ahead of where the last ended
            ahead = (Pk - end) @ d > -3
            Q = Pk[ahead] if ahead.any() else Pk
            start = Q[np.argmin(np.linalg.norm(Q - end, axis=1))]
        seg, d = traceSk(sk, start, d)
        if kind == 'green' and len(seg) > 60:                                           # its arrowhead off: the way out before it
            seg = seg[:-15]; d = seg[-1] - seg[-25]; d = d / (np.linalg.norm(d) or 1)
        route.append(seg); end = seg[-1]
        print(f"  stage {f}{' (green)' if kind == 'green' else ''}: {len(seg)} px, {np.linalg.norm(np.diff(seg, axis=0), axis=1).sum():.0f} mm, {seg[0].astype(int).tolist()} → {seg[-1].astype(int).tolist()}")
    Rt = np.concatenate(route)
    return np.stack([Rt[:, 0] + 0.5, P['h'] - Rt[:, 1] - 0.5], 1)


def resample(Pts, step=1.0):
    d = np.r_[0, np.cumsum(np.linalg.norm(np.diff(Pts, axis=0), axis=1))]
    t = np.arange(0, d[-1], step)
    return np.stack([np.interp(t, d, Pts[:, 0]), np.interp(t, d, Pts[:, 1])], 1)


def smoothOf(Pts, sigma):
    """resampled every mm, its jitter out (a Gaussian along it), its ends where they were, then every mm again"""
    Q = resample(Pts, 1.0)
    S = np.stack([nd.gaussian_filter1d(Q[:, i], sigma, mode='nearest') for i in (0, 1)], 1)
    return resample(S, 1.0)


def lanesOf(C, offs):
    """every lane the route moved aside by its offset (left of the way, mm); where a turn is tighter than the offset, the lane's loop cut
    out (its way turning back against the route's) → [(points, the route's index of every point)]"""
    t = np.gradient(C, axis=0); t /= np.linalg.norm(t, axis=1)[:, None]
    n = np.stack([-t[:, 1], t[:, 0]], 1)
    out = []
    for o in offs:
        L = C + n * o
        tl = np.gradient(L, axis=0); ok = (tl * t).sum(1) > 0.15 * np.linalg.norm(tl, axis=1)
        idx = np.flatnonzero(ok)
        out.append((L[idx], idx))
    return out


def run(pid):
    P = PICS[pid]; E = dict(EST); jars = [j for j in G.JARS if j[0] in P['jars']]
    print(pid)
    C = smoothOf(routeOf(P), E['smooth'])
    N = E['lanes']; offs = [(k - (N - 1) / 2) * E['pitch'] for k in range(N)]
    W = N * E['pitch']
    # the ribbon as wide as `field` at most across, so MARKS fit on a 60 × 60's margins (README's canon): the route drawn edge to edge pressed
    # about the canvas's middle, the lanes kept the brush apart
    ext = lambda Q: max(Q[:, 0].max() - Q[:, 0].min(), Q[:, 1].max() - Q[:, 1].min()) + W + E['pitch']
    route_scale = 1.0
    if ext(C) > P['field']:
        route_scale = (P['field'] - W - E['pitch']) / (ext(C) - W - E['pitch'])
        mid = np.array([P['w'] / 2, P['h'] / 2]); C = resample(mid + (C - mid) * route_scale, 1.0)
        print(f'  the route pressed to {route_scale * 100:.1f} %, the ribbon {P["field"]} mm across at most')
    lanes = lanesOf(C, offs)
    # Untitled-19 under the route: the picture's mm as its first plan placed it (holo2_gen.py: the paint's box as wide as `field`, centred)
    a = G.load(P); mask, med = G.maskOf(a)
    rows, cols = np.nonzero(mask)
    x0, x1 = cols.min() / R, (cols.max() + 1) / R; y0, y1 = P['h'] - (rows.max() + 1) / R, P['h'] - rows.min() / R
    s = min(1.0, P['field'] / (x1 - x0), P['field'] / (y1 - y0)); cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    toImg = lambda Q: np.stack([cx + (Q[:, 0] - P['w'] / 2) / s, cy + (Q[:, 1] - P['h'] / 2) / s], 1)
    JL = G.lab(np.array([G.hexrgb(j[3]) for j in jars])); L_ = G.lab(med)
    t = np.gradient(C, axis=0); t /= np.linalg.norm(t, axis=1)[:, None]; nrm = np.stack([-t[:, 1], t[:, 0]], 1)
    across = np.linspace(-W / 2, W / 2, 9)

    def bandsOf(live):
        labels = np.array(live)[np.argmin(((L_[..., None, :] - JL[live][None, None]) ** 2).sum(-1), -1)]
        jar = np.full(len(C), -1)
        for i in range(len(C)):
            Q = toImg(C[i][None] + nrm[i][None] * across[:, None])
            rr = np.clip(np.round((P['h'] - Q[:, 1]) * R - 0.5).astype(int), 0, mask.shape[0] - 1); cc = np.clip(np.round(Q[:, 0] * R - 0.5).astype(int), 0, mask.shape[1] - 1)
            v = labels[rr, cc][mask[rr, cc]]
            if len(v): jar[i] = np.bincount(v).argmax()
        runs = []                                                                       # [jar, mm]
        for v in jar:
            if runs and runs[-1][0] == v: runs[-1][1] += 1
            else: runs.append([int(v), 1])
        while len(runs) > 1:
            k = min(range(len(runs)), key=lambda i: (runs[i][0] >= 0, runs[i][1]))
            if runs[k][0] >= 0 and runs[k][1] >= E['band']: break
            nb = [i for i in (k - 1, k + 1) if 0 <= i < len(runs)]
            j = max(nb, key=lambda i: (runs[i][0] >= 0, runs[i][1])); runs[j][1] += runs[k][1]; del runs[k]
            m = []
            for q in runs:
                if m and m[-1][0] == q[0]: m[-1][1] += q[1]
                else: m.append(q)
            runs = m
        out, s0 = [], 0
        for v, k in runs: out.append(dict(jar=v, s0=s0, s1=s0 + k)); s0 += k
        return out
    # the canon of the jars (README, 2026-11-08): a jar with less line than the canvas's long side goes to its nearest that stays (ΔE 25 at most)
    live, gone = list(range(len(jars))), {}
    while True:
        bands = bandsOf(live)
        mm = {i: sum(b['s1'] - b['s0'] for b in bands if b['jar'] == i) * N for i in live}
        drop = None
        for v, i in sorted((v, i) for i, v in mm.items() if v < max(P['w'], P['h'])):
            k = min((k for k in live if k != i), key=lambda k: np.linalg.norm(JL[k] - JL[i]))
            if np.linalg.norm(JL[k] - JL[i]) <= 25 or v == 0: drop = (i, k, v); break
        if not drop: break
        live.remove(drop[0])
        if drop[2]: gone[jars[drop[0]][1]] = (jars[drop[1]][1], round(drop[2]))
    for g, (k, v) in gone.items(): print(f'  the canon of the jars: {g} ({v} mm of line) → {k}')
    # a band a group, as HOLO's (the owner, the same day: "the brush is flat: it can put the drops only as in the first HOLO"; "first we put
    # the drops of one colour, the machine drives over them, then the drops of another colour" — so they do not dry before the brush comes):
    # its rows of dabs, every dab upright, HOLO's mark along X whatever the lane's way, `spoke` mm apart at most along the band, one on every
    # lane; then at once its snake, no dip — lane 1 along the band, a step aside, lane 2 back … — `over` mm into its neighbours either end
    groups = []
    for b in bands:
        a0, a1 = max(0, b['s0'] - E['over']), min(len(C) - 1, b['s1'] + E['over'])
        legs = []
        for k, (Lp, idx) in enumerate(lanes):
            sel = np.flatnonzero((idx >= a0) & (idx <= a1))
            if len(sel) < 3: continue
            runs = np.split(sel, np.flatnonzero(np.diff(idx[sel]) > 3) + 1); r = max(runs, key=len)    # a lane cut at a tight turn: its longest piece
            if len(r) >= 3: legs.append((k, Lp[r], idx[r]))
        out = []                                                                            # lane 1 along the route, every next from its end nearer the last's
        for j, (k, P_, I_) in enumerate(legs):
            if out and np.linalg.norm(P_[-1] - out[-1][1][-1]) < np.linalg.norm(P_[0] - out[-1][1][-1]): P_, I_ = P_[::-1], I_[::-1]
            out.append((k, P_, I_))
        legs = out
        Lb = b['s1'] - b['s0']; n = max(1, int(math.ceil(Lb / E['spoke'])))
        dabs = []
        for q in range(n):
            si = b['s0'] + (q + 0.5) * Lb / n
            for (k, P_, I_) in legs:
                m = int(np.argmin(np.abs(I_ - si)))
                if abs(I_[m] - si) > 3: continue
                dy = P_[min(len(P_) - 1, m + 2)][1] - P_[max(0, m - 2)][1]
                dabs.append((k, int(I_[m]), P_[m], 1 if dy >= 0 else -1))                         # the mark up or down, the way the lane goes there
        groups.append(dict(jar=b['jar'], s0=b['s0'], s1=b['s1'], legs=legs, dabs=dabs))
    full = np.concatenate([P_ for g in groups for (_, P_, _) in g['legs']])
    # the model: the list's jars in turn, a group at a time; the brush along a leg takes up a dab of its group on its lane where it passes it,
    # lays it thinner and thinner on (est.); Layer 2 over Layer 1
    k_ = 3
    canvas = Image.new('RGBA', (P['w'] * k_, P['h'] * k_), (*G.GROUND, 255)); layer1 = canvas.copy()
    Ls = {i: float(JL[i][0]) for i in range(len(jars))}
    order = sorted(live, key=lambda i: (jars[i][4], -Ls[i]))
    for li_, i in enumerate(order):
        col = np.array(G.hexrgb(jars[i][3]))
        im = Image.new('RGBA', canvas.size, (0, 0, 0, 0)); d = ImageDraw.Draw(im)
        for g in (g for g in groups if g['jar'] == i):
            at = {}
            for (k, sI, p, w) in g['dabs']: at.setdefault((k, sI), 0); at[(k, sI)] += 1
            for (k, P_, I_) in g['legs']:
                A, w = 0.0, int(round(E['pitch'] * 0.95 * k_))
                for t in range(1, len(P_)):
                    for sI in range(min(I_[t - 1], I_[t]), max(I_[t - 1], I_[t]) + 1): A = min(2.0, A + at.pop((k, sI), 0))
                    if A < 0.03: continue
                    a_, b_ = P_[t - 1], P_[t]
                    d.line([(a_[0] * k_, (P['h'] - a_[1]) * k_), (b_[0] * k_, (P['h'] - b_[1]) * k_)], fill=(*[int(v * 255) for v in col], int(min(1.0, A) ** 0.6 * 235)), width=w)
                    A *= math.exp(-np.linalg.norm(b_ - a_) / E['fade'])
        canvas = Image.alpha_composite(canvas, im)
        if jars[i][4] == 1: layer1 = canvas.copy()
    os.makedirs(G.OUT, exist_ok=True)
    canvas.convert('RGB').save(os.path.join(G.OUT, f'{pid}.jpg'), quality=88)
    layer1.convert('RGB').save(os.path.join(G.OUT, f'{pid}-layer1.jpg'), quality=88)
    # DRAW BW's lines: the ribbon's outline as the track lays it; every border too: the bands' ends across it
    Wp, Hp = P['w'] * R, P['h'] * R
    cov = Image.new('L', (Wp, Hp), 0); dc = ImageDraw.Draw(cov)
    for Lp, _ in lanes: dc.line([(x * R, (P['h'] - y) * R) for x, y in Lp], fill=255, width=int(round(E['track'] * R)), joint='curve')
    cov = nd.binary_closing(np.asarray(cov) > 0, iterations=3)
    outline = G.contoursOf(cov, P['h'])
    cross = [np.array([C[b['s0']] + nrm[b['s0']] * (W / 2 + 1), C[b['s0']] - nrm[b['s0']] * (W / 2 + 1)]) for b in bands[1:]]
    def order_lines(ls):
        out, at, left = [], np.array([0.0, 0.0]), list(ls)
        while left:
            k = min(range(len(left)), key=lambda q: min(np.linalg.norm(left[q][0] - at), np.linalg.norm(left[q][-1] - at)))
            l = left.pop(k)
            if np.linalg.norm(l[-1] - at) < np.linalg.norm(l[0] - at): l = l[::-1]
            out.append([[round(float(x), 1), round(float(y), 1)] for x, y in l]); at = l[-1]
        return out
    r1 = lambda v: round(float(v), 1)
    lenOf = lambda Q: float(np.linalg.norm(np.diff(Q, axis=0), axis=1).sum())
    sin30 = math.sin(math.radians(30))
    def flatOf(Q): d = np.diff(Q, axis=0); L = np.linalg.norm(d, axis=1); return float(L[np.abs(d[:, 1]) < sin30 * np.maximum(L, 1e-9)].sum())
    J = []
    for i in order:
        jid, name, num, hx, layer, seen, note = jars[i]
        G_ = [g for g in groups if g['jar'] == i]; dn = sum(len(g['dabs']) for g in G_)
        if not dn: continue
        J.append(dict(id=jid, name=name, number=num, hex=hx, L=round(Ls[i], 1), layer=layer, seen=seen, note=note, run1_dabs=dn if layer == 1 else 0, run2_dabs=dn if layer == 2 else 0,
                      groups=len(G_), band_mm=int(sum(g['s1'] - g['s0'] for g in G_)), drag_mm=round(sum(lenOf(P_) for g in G_ for (_, P_, _) in g['legs']))))
    legs_all = [P_ for g in groups for (_, P_, _) in g['legs']]
    plan = dict(id=pid, title=P['title'], sub=P['sub'], version=3, composition='route', w=P['w'], h=P['h'], pitch=E['pitch'],
                field=dict(x0=r1(full[:, 0].min() - E['pitch'] / 2), x1=r1(full[:, 0].max() + E['pitch'] / 2), y0=r1(full[:, 1].min() - E['pitch'] / 2), y1=r1(full[:, 1].max() + E['pitch'] / 2)),
                source=P['src'], stages=[f'HOLO2/{f if isinstance(f, str) else f[0]}' for f in P['stages']], route_scale=round(route_scale, 4), image=f'holo2/{pid}.jpg', after1=f'holo2/{pid}-layer1.jpg',
                est=dict(a_dab_lasts=E['fade'], mark_leg=E['mark'], s_per_dab=9, lanes=N, smooth=E['smooth'], band=E['band'], spoke=E['spoke'], over=E['over']),
                count=dict(route_m=round(lenOf(C) / 1000, 2), lanes=N, line_m=round(sum(lenOf(Q) for Q in legs_all) / 1000, 1), bands=len(bands), groups=len(groups),
                           dabs=sum(len(g['dabs']) for g in groups), horizontal_m=round(sum(flatOf(Q) for Q in legs_all) / 1000, 1)),
                jars=J, gone=[dict(name=g, to=k, mm=v) for g, (k, v) in gone.items()],
                route=[[r1(x), r1(y)] for x, y in G.rdp(C, 0.08)],
                lanes=[[[r1(x), r1(y)] for x, y in G.rdp(Lp, 0.15)] for Lp, _ in lanes],
                groups=[dict(jar=jars[g['jar']][0], s0=g['s0'], s1=g['s1'], legs=[[r1(v) for p in G.rdp(P_, 0.15) for v in p] for (_, P_, _) in g['legs']],
                             dabs=[[r1(p[0]), r1(p[1]), w] for (_, _, p, w) in g['dabs']]) for g in groups],
                contour=dict(outline=order_lines(outline), all=order_lines(list(outline) + cross)))
    with open(os.path.join(G.OUT, f'{pid}.json'), 'w') as f: json.dump(plan, f, separators=(',', ':'))
    c = plan['count']
    print(f"  route {c['route_m']} m, {N} lanes, {c['line_m']} m of drag, {c['bands']} bands = groups, {c['dabs']} dabs, horizontal {c['horizontal_m']} m")
    for j in J: print(f"  L{j['layer']} {j['name']:12s} {j['hex']}  {j['groups']:3d} groups  {j['run1_dabs'] + j['run2_dabs']:4d} dabs  {j['drag_mm'] / 1000:5.1f} m")

if __name__ == '__main__':
    for pid in (sys.argv[1:] or list(PICS)): run(pid)
