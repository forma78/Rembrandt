"""HOLO's pictures, v.2: the same compositions and jars as v.1 (holo_jars.py), their edges ragged. Not part of the app: it writes
app/holo/<id>-v2.json and its two renders.

The owner, 2026-11-14 (HOLO-Claude/opm-n-screen.png, opm-w-screen.png, IMG_2907.jpg, his sketch): "the graphics live in a banal square, which
still has to be laid evenly on the canvas, debugged as if it were a print on a T-shirt … my works have no four even edges, they sit in the middle
of the picture and go out in rays. So if we do not hit the centre to the millimetre, nothing terrible: it will be the artist's intent. 'Ragged'
edges, with no clear frame, will help us technically, and the work itself will not look shut in a frame." "You decide, I do not insist … but if
you do it, keep the first ones too! The new ones then v.2."

Every leg its own ends, top and bottom apart (his sketch: blocks stepped over each other, a wave along them, a staircase down a side):
  - blocks: every slat its ends stepped from its neighbour's, a random walk of whole steps, now and then a jump;
  - a wave along the edge, through the slats, a few mm;
  - the sides: the outer slats shorter, a staircase in, each side its own.
Run 1 lays every leg's puddles along its own length and drags it end to end. One rhythm for both runs (the owner, the same day, of the first
v.2, its run-2 bands flat across a slat while run 1's puddles danced with the legs' ends: "if the drops in run 1 are even in a row, then in run 2
they are even … keep the dance in the second layer"; README): run 2's bands are the composition's, in its base frame (the v.1 field's height),
laid on every leg between its own ends, the stroke's end never past it, a dab by its length there — holoplan.js's bandOn and dabsOn, the same
numbers. The 60 × 60s 520 mm across (v.1 560 and 540), so that MARKS fit on the canvas by the field (README's canon).

Every slat of v.1's, none lost (the owner, 2026-11-14, `../Screenshot 2026-11-14 at 7.27.03 PM.png`, the 40 × 40's last slat gone in v.2: "did
you leave out the last column on purpose? … I would bring the lost column back. But these are your pictures — you decide"). The first v.2s
were drawn on a study with a wider margin all round, so its row of slats was cut shorter: the 40 × 40 lost its outermost slat on the right
(Jar 1, 6 legs; Jar 6 9 legs wide for 6), the blue its two outermost, the tiers its last two in one and its colours in another order. Now a v.2
is its v.1's own row: the 40 × 40 360 mm across as v.1; the blue pressed to 520 mm by one leg off each of its widest slats, every slat kept.
The ragged edges as the owner saw them that day: the first v.2's rhythm (the old row, seeded as before) carried slat for slat onto v.1's row;
a slat it never had, one more step of the walk past its neighbour and its staircase a step deeper.
The tiers' v.2 stays as it was, its own row (`own`): the owner, the same evening, as the work was under way: "I really like the tiers v.2 —
I say it as a professional who has seen a great deal, it came out very well. I cannot wait to paint it"

python holo_v2.py [id …]     (a venv with numpy, pillow and scipy; the working directory this one; ids the v.1 ones: holo-40-warm … for their
                              v.2, or a made one's own: holo-60-tiers-v3)
"""
import sys, json, os, importlib.util
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter1d, gaussian_filter

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('holo_jars', os.path.join(HERE, 'holo_jars.py'))
J = importlib.util.module_from_spec(spec); spec.loader.exec_module(J)
H = J.H
OUT = J.OUT
PPM = H.PPM

# every picture's v.2: v.1's own row of slats (holo_study's PICTURES), `legs` across if fewer than v.1's; and how ragged, mm, est.:
#   make, margin: the first v.2's study, its rhythm drawn on its row (carried onto v.1's, `carry`; `own`: that row itself, the tiers' as
#   the owner liked it); margin: the base of the ends;
#   out: as far as an end stands out past it; step: a block's step; deep: the walk's deepest in; wave: (amplitude, wavelength);
#   stair: (slats a side, mm a step) for the sides
V2 = {
    'holo-40-warm': dict(make=lambda m: H.Study(400, 'warm', margin=m), margin=30, out=12, step=7, deep=34, wave=(3.5, 70), stair=(3, 26), seed=11),
    'holo-60-blue': dict(make=lambda m: H.Study(600, 'blue', margin=m, slope=0.36, xf=0.58, yf=0.44, acc=((4, 8), (3, 7))), margin=40, out=14, step=9,
                         deep=46, wave=(4.5, 95), stair=(3, 34), seed=5, legs=104),
    'holo-60-tiers': dict(make=lambda m: H.Tiers(600, margin=m), margin=40, out=14, step=9, deep=46, wave=(4.5, 95), stair=(3, 34), seed=8, own=True),
}
SUB = {'holo-40-warm': 'the fan, warm', 'holo-60-blue': 'the fan, blue', 'holo-60-tiers': 'the tiers'}
# every picture made here: its id → (its v.1, how, its version). The tiers' v.3 (the owner, 2026-11-14, the night, of the blue redrawn on v.1's
# row: "the new one is better. Maybe you will make a v.3 for the tiers?"): v.1's row and colours, every slat, at 520 mm, the v.2's ragged edges
# carried onto it; its v.2 stays as it is.
# The warm 40 × 40's V4 (the owner, 2026-11-15, of the test canvas's run 1, every stroke a clean channel between two ridges: "I propose the second
# pass, the one that clears the paint, at 2.5 mm … six from the bottom up and six from the top down. That gives not six grooves but twelve";
# ../HOLO/001-40x40-v4.md): its v.2 number for number — the composition, the jars, the ragged ends, the puddles, run 2 — and one thing more, run
# 1's drag, two strokes a leg 2.5 mm apart (`drag`, read by holoplan.js's workOf). The 40 × 40 has no v.3; his name, V4. The renders v.2's model:
# they draw no channels (est.).
MADE = {**{pid + '-v2': (pid, c, 2) for pid, c in V2.items()},
        'holo-60-tiers-v3': ('holo-60-tiers', dict(V2['holo-60-tiers'], own=False, legs=104), 3),
        'holo-40-warm-v4': ('holo-40-warm', dict(V2['holo-40-warm'], drag=dict(per_leg=2, step=2.5), say='the drag every 2.5 mm'), 4)}


def rhythm(st, c):
    """the ragged ends' rhythm on a row of slats: every slat its walk in from the top and from the bottom and its staircases, mm; the wave's phase"""
    rng = np.random.default_rng(c['seed']); n = len(st.slats); out, step, deep = c['out'], c['step'], c['deep']

    def walk():
        v, vs = rng.uniform(-out * 0.3, deep * 0.3), []
        for _ in range(n):
            r = rng.random()
            v += step * (rng.choice([-2, 2]) if r < 0.12 else rng.choice([-1, 0, 0, 1]))     # a block's step, now and then a jump
            v = float(np.clip(v, -out, deep)); vs.append(v)
        return vs

    # a staircase in at one to three of the four corners, each its own (his sketch: down the left side's lower half, not all round —
    # all four made a barrel, an octagon)
    k0, s0 = c['stair']; st_top, st_bot = np.zeros(n), np.zeros(n)
    corners = [(a, side) for a in (st_top, st_bot) for side in (0, 1)]
    for ci in rng.choice(4, size=int(rng.integers(1, 4)), replace=False):
        a, side = corners[ci]; k = int(rng.integers(2, k0 + 2)); s = s0 * rng.uniform(0.6, 1.2)
        for q in range(k):                                              # the outermost slat the deepest
            a[q if side == 0 else n - 1 - q] += (k - q) * s

    tops, bots, phase = walk(), walk(), rng.uniform(0, 2 * np.pi, 2)
    return dict(top=list(tops), bot=list(bots), st_top=list(st_top), st_bot=list(st_bot), phase=phase)


def carry(old, st, R, c):
    """the old row's rhythm onto st's row: slat for slat in order, where their middles lie nearest; the wave at the old slat's own place, so a
    slat's legs end where they did; a slat the old row never had, outward from the last that had: one more step of the walk (its own seed) and
    its staircase one step deeper, if its neighbour stood on one → (rhythm a slat of st, the wave's x at every slat's left edge)"""
    edge = lambda S, sl: S.x0 + sl['i0'] * S.pitch
    mid = lambda S, sl: edge(S, sl) + sl['w'] * S.pitch / 2
    no, nn = len(old.slats), len(st.slats)
    pairs = lambda o: [(i, i - o) for i in range(nn) if 0 <= i - o < no]
    o = min(range(-3, 4), key=lambda o: np.mean([abs(mid(st, st.slats[i]) - mid(old, old.slats[j])) for i, j in pairs(o)]))
    P = dict(pairs(o)); lo, hi = min(P), max(P)
    T = {k: [None] * nn for k in ('top', 'bot', 'st_top', 'st_bot')}; xs = [None] * nn
    for i, j in P.items():
        for k in T: T[k][i] = R[k][j]
        xs[i] = edge(old, old.slats[j])
    rng = np.random.default_rng(c['seed'] + 1000)
    for i, a, b in [(i, i - 1, i - 2) for i in range(hi + 1, nn)] + [(i, i + 1, i + 2) for i in range(lo - 1, -1, -1)]:
        for k in ('top', 'bot'):
            T[k][i] = float(np.clip(T[k][a] + c['step'] * rng.choice([-1, 0, 0, 1]), -c['out'], c['deep']))
        for k in ('st_top', 'st_bot'):
            u, v = T[k][a], T[k][b] if 0 <= b < nn and T[k][b] is not None else 0.0
            T[k][i] = u + (u - v) if u > v else 0.0
        xs[i] = edge(st, st.slats[i]) + xs[a] - edge(st, st.slats[a])
    return dict(T, phase=R['phase']), xs


def ragged(st, c, R=None, xs=None):
    """every leg its ends (study's mm, y down): [top, bottom], by a rhythm a slat (its own row's, or carried) and the wave at xs, a slat's left edge"""
    R = R or rhythm(st, c); m = c['margin']; amp, lam = c['wave']; phase = R['phase']
    for si, sl in enumerate(st.slats):
        x0 = xs[si] if xs else st.x0 + sl['i0'] * st.pitch; ends = []
        for j in range(sl['w']):
            x = x0 + (j + 0.5) * st.pitch
            t = m + R['top'][si] + R['st_top'][si] + amp * np.sin(2 * np.pi * x / lam + phase[0])
            b = st.H - m - R['bot'][si] - R['st_bot'][si] - amp * np.sin(2 * np.pi * x / (lam * 1.37) + phase[1])
            if b - t < 0.4 * (st.H - 2 * m):                            # never a stub: at least 0.4 of the base's height
                mid = (t + b) / 2; t, b = mid - 0.2 * (st.H - 2 * m), mid + 0.2 * (st.H - 2 * m)
            ends.append((round(float(t), 1), round(float(b), 1)))
        sl['ends'] = ends
    for leg in st.legs:
        sl = leg['slat']; leg['ends'] = sl['ends'][leg['n'] - sl['i0']]


def narrow(st, legs):
    """v.1's row pressed to `legs` legs across: one leg off each of its widest slats, of two alike the nearer the horizon, so the fan still
    widens outward; every slat kept, its bands and its jars as v.1's; the horizon between the same two slats"""
    cut_ = sorted(range(len(st.slats)), key=lambda i: (-st.slats[i]['w'], abs(st.slats[i]['cx'] - st.xc)))[:st.N - legs]
    nl = round((st.xc - st.x0) / st.pitch) - sum(1 for i in cut_ if st.slats[i]['cx'] < st.xc)
    for i in cut_: st.slats[i]['w'] -= 1
    st.N = legs; st.x0 = (st.W - legs * st.pitch) / 2; st.xc = st.x0 + nl * st.pitch; st.legs, i = [], 0
    for sl in st.slats:
        sl['i0'] = i; sl['cx'] = st.x0 + (i + sl['w'] / 2) * st.pitch
        for j in range(sl['w']): st.legs.append(dict(x=st.x0 + (i + j + 0.5) * st.pitch, slat=sl, n=i + j))
        i += sl['w']


def cut(st):
    """run 1's puddles along every leg's own length, as the study lays them along the field"""
    for leg in st.legs:
        sl = leg['slat']; t, b = leg['ends']
        if not sl['light']: leg['light'] = []; continue
        g = sl['light'][0][1]; k = int(np.ceil((b - t - 8) / st.gap)) + 1
        leg['light'] = [(float(y), g, 1) for y in np.linspace(t + 4, b - 4, k)]


jsround = lambda v: int(np.floor(v + 0.5))                             # JavaScript's Math.round, not Python's to-even


def band_on(p, ends, band):
    """holoplan.js's bandOn and dabsOn, number for number: the band on a leg between its ends, y up → (band, its dabs)"""
    B = p['base']; y0, y1 = ends
    w = lambda y: y0 + (y - B['y0']) * (y1 - y0) / (B['y1'] - B['y0'])
    q = dict(band, y0=w(band['y0']), y1=w(band['y1']), start=w(band['start']), end=min(y1, max(y0, w(band['end']))))
    return q, max(1, min(4 if p['composition'] == 'tiers' else 3, jsround((q['y1'] - q['y0']) / p['est']['a_dab_lasts'])))


def warp_dark(st, p):
    """every leg's run 2 from the plan's numbers, in the study's frame (y down) for its render: (start, jar, dabs, blen, down, a, b)"""
    Hh = st.H
    for leg in st.legs:
        s = p['slats'][st.slats.index(leg['slat'])]; e = s['ends'][leg['n'] - leg['slat']['i0']]; dark = []
        for band in s['bands']:
            q, d = band_on(p, e, band)
            down = band['way'] == 'down'
            dark.append((Hh - q['start'], band['hex'], d, abs(q['end'] - q['start']) / st.last, down, Hh - q['y1'], Hh - q['y0']))
        leg['dark'] = dark


def render(st, stage, seed=7):
    """the study's render, every leg within its own ends: past them the bare canvas, its end rounded as the rubber tip leaves it"""
    rng = np.random.default_rng(seed); Wp = int(st.W * PPM); tw = int(st.pitch * PPM)
    top = min(l['ends'][0] for l in st.legs); bot = max(l['ends'][1] for l in st.legs)
    r0 = int(np.floor(top * PPM)); n = int(np.ceil(bot * PPM)) - r0; ys = (np.arange(n) + r0) / PPM
    img = H.s2l(np.tile(H.GROUND, (Wp, Wp, 1)) + rng.normal(0, 0.007, (Wp, Wp))[..., None]).astype(np.float32)
    st.y0, st.y1 = r0 / PPM, (r0 + n) / PPM                             # the study's own drawing over the whole box
    u = (np.arange(tw) + 0.5 - tw / 2) / (tw / 2); capmm = (1 - np.sqrt(np.clip(1 - u * u, 0, 1))) * 1.6
    if stage != 'p1':
        for leg in st.legs:
            xa = int(round((leg['x'] - st.pitch / 2) * PPM)); t, b = leg['ends']
            inside = ((ys[:, None] >= t + capmm[None, :]) & (ys[:, None] <= b - capmm[None, :])).astype(float)
            soft = gaussian_filter(inside, (0.6, 0.3))
            old = img[r0:r0 + n, xa:xa + tw].astype(float)
            if not leg['light']:
                band = old
            else:
                leg['slat']['light'] = leg['light']                   # the study's bead along this leg's own puddles
                prof = st.light_profile(leg, leg['n'] % 2 == 0, n)
                streak = 1 + gaussian_filter1d(rng.normal(0, 0.05, tw), 1.2); drift = gaussian_filter(rng.normal(0, 1, (n, tw)), (40, 1.5)) * 0.22
                edge = np.ones(tw); edge[:2] = 0.82; edge[-2:] = 0.82; edge[2] = edge[-3] = 1.06
                band = prof[:, None, :] * (streak[None, :, None] * (1 + drift[..., None])) * edge[None, :, None]
            if stage == 'r2':
                leg['slat']['dark'] = leg['dark']                     # this leg's own bands, between its ends
                sh = st.shadow(leg, n)
                cap = (capmm * 2.2 / 1.6 * PPM).astype(int)
                sft = lambda v, k: np.concatenate([np.zeros(k), v[:len(v) - k]]) if k > 0 else (np.concatenate([v[-k:], np.zeros(-k)]) if k < 0 else v)
                cd = np.stack([sft(sh[True][0], k) for k in cap], 1); cu = np.stack([sft(sh[False][0], -k) for k in cap], 1)
                c2 = np.maximum(cd, cu); cover = np.maximum(sh[True][0], sh[False][0])
                col = np.where((sh[True][0] >= sh[False][0])[:, None], sh[True][1], sh[False][1])
                st2 = 1 + gaussian_filter1d(rng.normal(0, 0.22, tw), 1.0)
                cv = np.clip(c2 * (0.55 + 0.45 * c2 + (1 - c2) * (st2[None, :] - 1) * 2.0), 0, 1)
                cv = cv * np.where(np.arange(tw) < 2, 0.9, 1.0)[None, :]
                band = H.rr(H.ks(H.cl(band)) * (1 - cv[..., None]) + H.ks(H.cl(col))[:, None, :] * cv[..., None])
                band = band * (1 - 0.10 * (cover[:, None, None] > 0.05) * (np.abs(np.arange(tw) - tw / 2) > tw / 2 - 2)[None, :, None])
            img[r0:r0 + n, xa:xa + tw] = np.clip(old * (1 - soft[..., None]) + band * soft[..., None], 0, 1)
    pil = Image.fromarray((H.l2s(img) * 255).astype(np.uint8))
    if stage in ('p1', 'p2'):
        d = ImageDraw.Draw(pil)
        for leg in st.legs:
            pts = [(y, c, 1) for y, c, _ in leg['light']] if stage == 'p1' else [(q[0], q[1], q[2]) for q in leg['dark']]
            for y, c, dose in pts:
                rx, ry = 2.0, 2.6 + 1.1 * dose
                colr = tuple(int(v * 255) for v in H.l2s(H.hexlin(c))); X, Y = leg['x'] * PPM, y * PPM
                d.ellipse([X - rx * PPM, Y - ry * PPM, X + rx * PPM, Y + ry * PPM], fill=colr)
    return pil


def plan(st, pid, title):
    """the study's plan, its bands in the base frame (the v.1 field's height, `base`), every slat its legs' ends, the field the box round
    them all; the counts by every leg's own puddles and its warped bands"""
    up = lambda y: round(st.H - y, 1)
    for sl in st.slats: sl['light'] = sl['light'][:1] if sl['light'] else []   # the ground's jar, for the study's own plan
    p = st.plan(pid, title)
    p['base'] = dict(y0=up(st.y1), y1=up(st.y0))
    for s, sl in zip(p['slats'], st.slats):
        s['ends'] = [[up(b), up(t)] for t, b in sl['ends']]         # y up: [bottom, top]
        s['puddles_y'] = []
        for b in s['bands']: b['hex'] = b['jar']
    jars = {}
    for leg in st.legs:
        for _, c, _ in leg['light']: jars.setdefault(c, [0, 0])[0] += 1
    run2_puddles = run2_dabs = 0
    for s, sl in zip(p['slats'], st.slats):
        for e in s['ends']:
            for band in s['bands']:
                _, d = band_on(p, e, band); jars.setdefault(band['jar'], [0, 0])[1] += d; run2_puddles += 1; run2_dabs += d
    for q in p['jars']: q['run1_dabs'], q['run2_dabs'] = jars.get(q['hex'], [0, 0])
    p['jars'] = [q for q in p['jars'] if q['run1_dabs'] or q['run2_dabs']]
    top = min(l['ends'][0] for l in st.legs); bot = max(l['ends'][1] for l in st.legs)
    p['field'].update(y0=up(bot), y1=up(top))
    line = sum(l['ends'][1] - l['ends'][0] for l in st.legs)
    p['count'].update(run1_dabs=sum(len(l['light']) for l in st.legs), run2_puddles=run2_puddles, run2_dabs=run2_dabs, line_m=round(line / 1000, 1))
    return p


def make(vid, out=OUT, renders=True):
    pid, c, ver = MADE[vid]; byhex = J.recolour(pid)
    old = c['make'](c['margin'])                                        # the first v.2's row, for its rhythm
    if c.get('own'):
        st = old; ragged(st, c)
    else:
        st = H.PICTURES[pid][0]()                                       # v.1's own row
        if c.get('legs'): narrow(st, c['legs'])
        ragged(st, c, *carry(old, st, rhythm(old, c), c))
    cut(st)
    p = plan(st, vid, '')
    warp_dark(st, p)
    for s in p['slats']:
        s['ground'] = byhex[s['ground']] if s['ground'] else None
        for b in s['bands']: b['jar'] = byhex[b['jar']]; del b['hex']
    src = {}
    for k, v in J.MAP[pid].items(): src.setdefault(v, []).append(k)
    jars = []
    for q in p['jars']:
        j = J.JAR[byhex[q['hex']]]
        jars.append(dict(id=j[0], name=j[1], number=j[2], hex=j[3], L=round(J.lab(j[3])[0]), seen=j[4], new=j[4] == 'tube', note=j[5],
                         study=src[j[0]], run1_dabs=q['run1_dabs'], run2_dabs=q['run2_dabs']))
    p.update(title=f'HOLO · {p["w"] // 10} × {p["h"] // 10}, {SUB[pid]} · v.{ver}', sub=f'{SUB[pid]}, v.{ver}, ' + (c['say'] if c.get('say') else 'ragged edges' + (', every slat of v.1' if ver > 2 else '')),
             jars=jars, of=pid, version=ver, note=f'HOLO v.{ver}, its edges ragged (the owner, 2026-11-14): every number est., nothing run on the machine',
             image=f'holo/{vid}.jpg', after1=f'holo/{vid}-run1.jpg')
    if c.get('drag'):                                                   # V4: run 1's drag, its strokes counted; the render v.2's, no channels
        d = c['drag']; p['drag'] = dict(d)
        p['count']['run1_strokes'] = d['per_leg'] * sum(1 for l in st.legs if l['light'])
        p['note'] = (f'HOLO v.{ver}, v.2 and run 1\'s drag {d["per_leg"]} strokes a leg {d["step"]} mm apart (the owner, 2026-11-15): every number est., '
                     'the renders v.2\'s model, no channels drawn; nothing run on the machine')
    os.makedirs(out, exist_ok=True)
    json.dump(p, open(os.path.join(out, vid + '.json'), 'w'), separators=(',', ':'))
    if renders:
        for stage, name in (('r2', vid), ('r1', vid + '-run1')):
            im = render(st, stage); im = im.resize((1200, 1200), resample=1); im.save(os.path.join(out, name + '.jpg'), quality=88)
    return p


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    out = next((a[6:] for a in sys.argv[1:] if a.startswith('--out=')), OUT)
    for vid in [a if a in MADE else a + '-v2' for a in args] or list(MADE):    # a v.1's id: its v.2
        p = make(vid, out)
        f = p['field']
        print(vid, p['count'], f'field {f["x1"] - f["x0"]:.0f} × {f["y1"] - f["y0"]:.0f}', [(j['name'], j['run1_dabs'], j['run2_dabs']) for j in p['jars']])
