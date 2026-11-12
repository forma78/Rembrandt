"""HOLO, a study for the owner (cloud-Claude, 2026-11-12). Not Rembrandt's code: it draws the sheets of HOLO/ and writes the plans of HOLO/plans/.
Vertical legs only, 5 mm apart. Two runs:
  run 1, LIGHT: puddles of the light jars along every leg, dragged in one stroke the leg's whole length;
  run 2, SHADOW (on the dry first): one puddle of a dark jar at every band's edge, dragged away from the edge until it gives out.
Everything here is a model, est.: how far a puddle lasts, how it fades, how the light jars run into each other."""
import sys, json, numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter1d, gaussian_filter

PPM = 5
GROUND = np.array([243, 240, 230]) / 255.0
def s2l(c): c = np.asarray(c, float); return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def l2s(c): c = np.clip(c, 0, 1); return np.where(c <= 0.0031308, c * 12.92, 1.055 * c ** (1 / 2.4) - 0.055)
def hexlin(h): return s2l(np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)]) / 255.0)
def Lstar(lin):
    y = float(np.asarray(lin) @ np.array([0.2126, 0.7152, 0.0722])); return 116 * (np.cbrt(y) if y > 216 / 24389 else (24389 / 27 * y + 16) / 116) - 16
ks = lambda R: (1 - R) ** 2 / (2 * R)
rr = lambda k: 1 + k - np.sqrt(k * k + 2 * k)
cl = lambda v: np.clip(v, 0.002, 0.998)

# the jars, the reference's own colours (k-means of the picture); a slat kind: its light jars from a band's shadowed end to its lit end, its two shadow jars
PAL = {
 'warm': dict(kinds=[dict(light='#F2E9DC', dark=['#C22303', '#791406']), dict(light='#F0AC26', dark=['#791406', '#3B0807']),
                     dict(light='#FAD321', dark=['#E45C06', '#791406']), dict(light='#EB870F', dark=['#3B0807', '#791406'])],
              accent=dict(light='#F2E9DC', dark=['#2B49C7', '#141A55'])),
 'blue': dict(kinds=[dict(light='#F1F3F2', dark=['#1C77E8', '#0F1DC2']), dict(light='#46A4EF', dark=['#09116C', '#0E0820']),
                     dict(light='#C6E7FA', dark=['#134BC9', '#09116C']), dict(light='#1C77E8', dark=['#0E0820', '#09116C'])],
              accent=dict(light='#EDDAC9', dark=['#F15518', '#80241C'])),
}
ACC = ((3, 7), (5,))
# TIERS' jars, off the owner's second references (2026-11-12): two families, a shadow only over a ground of its own family; None the bare primed canvas
TIERS = dict(warm=dict(ground=['#E6D9C3', '#E6D9C3', '#D98A4E'], dark=['#A43E20', '#A43E20', '#622019', '#33140F']),
             cool=dict(ground=[None, '#8DBDE1', '#8DBDE1', '#3D8BD3'], dark=['#0539A5', '#0539A5', '#02036C', '#090715']),
             pins=['#C3271B', None])

def widths(n_half):
    seq = [2, 2, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8, 9, 10]; out = []
    for w in seq:
        if sum(out) + w > n_half: break
        out.append(w)
    r = n_half - sum(out)
    if r >= 4: out.append(r)
    else: out[-1] += r
    return out

class Study:
    def __init__(self, size, pal, pitch=5.0, margin=20.0, pmin=62.0, slope=0.62, gap=40.0, last=0.8, acc=ACC, xf=0.42, yf=0.57):
        self.W = self.H = size; self.pitch = pitch; self.pal = PAL[pal]
        self.N = int(round((size - 2 * margin) / pitch)); self.x0 = (size - self.N * pitch) / 2
        self.y0, self.y1 = margin, size - margin; self.last = last; self.flat = 0.0; self.comp = 'fan'; self.palname = pal; self.margin = margin; self.gap = gap
        nl = int(round(self.N * xf)); self.xc = self.x0 + nl * pitch; self.yc = self.y0 + (self.y1 - self.y0) * yf
        wl, wr = widths(nl), widths(self.N - nl); ws = wl[::-1] + wr; mid = len(wl)
        self.slats, self.legs, i = [], [], 0
        for s, w in enumerate(ws):
            k = s - mid if s >= mid else mid - 1 - s; side = 1 if s >= mid else -1
            cx = self.x0 + (i + w / 2) * pitch; P = pmin + slope * abs(cx - self.xc)
            accent = (k in acc[0] and side < 0) or (k in acc[1] and side > 0)
            kind = self.pal['accent'] if accent else self.pal['kinds'][(k + (2 if side > 0 else 0)) % 4]
            sl = dict(i0=i, w=w, cx=cx, P=P, kind=kind, down=(s % 2 == 0), accent=accent)
            # the bands: edges at yc + n P; a band's shadowed end is where its stroke starts
            n0 = int(np.floor((self.y0 - self.yc) / P)); n1 = int(np.ceil((self.y1 - self.yc) / P))
            light, dark = [], []
            for n in range(n0, n1):
                a, b = max(self.y0, self.yc + n * P), min(self.y1, self.yc + (n + 1) * P)
                if b - a < 12: continue
                dose = int(np.clip(round((b - a) / 55), 1, 3))
                start = a + 5 if sl['down'] else b - 5
                dark.append((start, kind['dark'][n % 2], dose, (b - a), sl['down'], a, b))
            m = int(np.ceil((self.y1 - self.y0 - 8) / gap)) + 1
            light = [(float(y), kind['light'], 1) for y in np.linspace(self.y0 + 4, self.y1 - 4, m)]
            sl['light'], sl['dark'] = light, dark
            self.slats.append(sl)
            for j in range(w): self.legs.append(dict(x=self.x0 + (i + j + 0.5) * pitch, slat=sl, n=i + j))
            i += w

    def light_profile(self, leg, down, n):
        """run 1: a bead before the rubber tip that takes each puddle in and lays a film behind; the light jars run into each other"""
        ys = np.arange(n) / PPM + self.y0; out = np.zeros((n, 3)); on = np.zeros(n, bool)
        bk = np.zeros(3); bs = 0.0; vol = 0.0; R = 4.5; take = 1.0 / (2 * R * PPM); lay = 1.0 / (40.0 * PPM)
        P = [(y, hexlin(c)) for y, c, _ in leg['slat']['light']]
        for i in (range(n) if down else range(n - 1, -1, -1)):
            for py, lin in P:
                if abs(ys[i] - py) <= R:
                    s = 1 + 5 * (Lstar(lin) / 100) ** 2
                    bk += ks(cl(lin)) * s * take; bs += s * take; vol += take
            if vol > 1e-4:
                out[i] = rr(bk / bs); on[i] = True
                f = min(vol, lay) / vol; bk *= 1 - f; bs *= 1 - f; vol -= min(vol, lay)
        idx = np.flatnonzero(on); out = out[idx[np.clip(np.searchsorted(idx, np.arange(n)), 0, len(idx) - 1)]]
        for ch in range(3): out[:, ch] = rr(gaussian_filter1d(ks(cl(out[:, ch])), 4.0 * PPM, mode='nearest'))   # the lag laid out by the plan, the idle run back
        return out

    def shadow(self, leg, n):
        """run 2: the film of a dark puddle, thick where the stroke starts, gone where the band ends"""
        ys = np.arange(n) / PPM + self.y0; sl = leg['slat']; out = {}
        for way in (True, False):
            cover = np.zeros(n); col = np.zeros((n, 3))
            for start, c, dose, blen, down, a, b in sl['dark']:
                if down != way: continue
                d = (ys - start) if down else (start - ys)
                reach = self.last * blen                                     # the dose chosen so that the puddle lasts this far (est.)
                f = np.clip(1 - d / reach, 0, 1)
                t = f ** 1.5 if not self.flat else np.clip(f / (1 - self.flat), 0, 1) ** 1.3   # TIERS: laid full over `flat` of the band, then giving out
                t = np.where((d >= -3) & (d <= reach), t, 0.0)
                t = np.where(d < 0, np.clip(1 + d / 3, 0, 1) * (d >= -3), t)  # the bulb where it lands
                m = t > cover; cover = np.where(m, t, cover); col[m] = hexlin(c)
            out[way] = (np.clip(cover * 1.15, 0, 1), col)
        return out

    def render(self, stage, seed=7):
        """stage: 'p1' the light puddles, 'r1' after run 1, 'p2' the dark puddles on the dry first, 'r2' the painting"""
        rng = np.random.default_rng(seed); Wp = int(self.W * PPM); n = int((self.y1 - self.y0) * PPM); r0 = int(self.y0 * PPM); tw = int(self.pitch * PPM)
        img = s2l(np.tile(GROUND, (Wp, Wp, 1)) + rng.normal(0, 0.007, (Wp, Wp))[..., None]).astype(np.float32)
        if stage != 'p1':
            for leg in self.legs:
                xa = int(round((leg['x'] - self.pitch / 2) * PPM))
                bare = not leg['slat']['light']
                prof = img[r0:r0 + n, xa + tw // 2].astype(float) if bare else self.light_profile(leg, leg['n'] % 2 == 0, n)
                streak = 1 + gaussian_filter1d(rng.normal(0, 0.05, tw), 1.2); drift = gaussian_filter(rng.normal(0, 1, (n, tw)), (40, 1.5)) * 0.22
                edge = np.ones(tw); edge[:2] = 0.82; edge[-2:] = 0.82; edge[2] = edge[-3] = 1.06
                band = img[r0:r0 + n, xa:xa + tw].astype(float) if bare else prof[:, None, :] * (streak[None, :, None] * (1 + drift[..., None])) * edge[None, :, None]
                if stage == 'r2':
                    sh = self.shadow(leg, n)
                    u = (np.arange(tw) + 0.5 - tw / 2) / (tw / 2); cap = ((1 - np.sqrt(np.clip(1 - u * u, 0, 1))) * 2.2 * PPM).astype(int)
                    sft = lambda v, k: np.concatenate([np.zeros(k), v[:len(v) - k]]) if k > 0 else (np.concatenate([v[-k:], np.zeros(-k)]) if k < 0 else v)   # a shift, nothing coming round the end
                    cd = np.stack([sft(sh[True][0], k) for k in cap], 1); cu = np.stack([sft(sh[False][0], -k) for k in cap], 1)
                    c2 = np.maximum(cd, cu); cover = np.maximum(sh[True][0], sh[False][0])
                    col = np.where((sh[True][0] >= sh[False][0])[:, None], sh[True][1], sh[False][1])
                    st2 = 1 + gaussian_filter1d(rng.normal(0, 0.22, tw), 1.0)   # the film thins in the tip's grooves as it gives out
                    cv = np.clip(c2 * (0.55 + 0.45 * c2 + (1 - c2) * (st2[None, :] - 1) * 2.0), 0, 1)
                    cv = cv * np.where(np.arange(tw) < 2, 0.9, 1.0)[None, :]
                    band = rr(ks(cl(band)) * (1 - cv[..., None]) + ks(cl(col))[:, None, :] * cv[..., None] * 1.0)
                    band = band * (1 - 0.10 * (cover[:, None, None] > 0.05) * (np.abs(np.arange(tw) - tw / 2) > tw / 2 - 2)[None, :, None])
                img[r0:r0 + n, xa:xa + tw] = np.clip(band, 0, 1)
        pil = Image.fromarray((l2s(img) * 255).astype(np.uint8))
        if stage in ('p1', 'p2'):
            d = ImageDraw.Draw(pil)
            for leg in self.legs:
                pts = [(y, c, 1) for y, c, _ in leg['slat']['light']] if stage == 'p1' else [(q[0], q[1], q[2]) for q in leg['slat']['dark']]
                for y, c, dose in pts:
                    rx, ry = 2.0, 2.6 + 1.1 * dose
                    colr = tuple(int(v * 255) for v in l2s(hexlin(c))); X, Y = leg['x'] * PPM, y * PPM
                    d.ellipse([X - rx * PPM, Y - ry * PPM, X + rx * PPM, Y + ry * PPM], fill=colr)
                    hl = tuple(min(255, int(v + (255 - v) * 0.4)) for v in colr)
                    d.ellipse([X - rx * PPM * 0.5, Y - ry * PPM * 0.7, X - rx * PPM * 0.05, Y - ry * PPM * 0.2], fill=hl)
        return pil

    def stats(self):
        jars = {}   # a jar: [its dabs in run 1, its dabs in run 2]
        for leg in self.legs:
            for _, c, _ in leg['slat']['light']: jars.setdefault(c, [0, 0])[0] += 1
            for q in leg['slat']['dark']: jars.setdefault(q[1], [0, 0])[1] += q[2]
        l = sum(v[0] for v in jars.values()); dk = sum(v[1] for v in jars.values())
        dp = sum(len(leg['slat']['dark']) for leg in self.legs)
        return dict(size_mm=self.W, legs=len(self.legs), slats=[(s['w'], round(s['P'])) for s in self.slats], light_puddles=l, dark_puddles=dp, dark_dabs=dk,
                    line_m=round(len(self.legs) * (self.y1 - self.y0) / 1000, 1),
                    jars=[(c, round(Lstar(hexlin(c))), v[0], v[1]) for c, v in sorted(jars.items(), key=lambda kv: -Lstar(hexlin(kv[0])))])

    def plan(self, pid, title):
        """the picture as numbers, in the picture's mm, x right, y up (as FORM-G's legs)"""
        up = lambda y: round(self.H - y, 1); st = self.stats(); slats = []
        for sl in self.slats:
            bands = []
            for start, c, dose, blen, down, a, b in sl['dark']:
                reach = self.last * blen
                bands.append(dict(y0=up(b), y1=up(a), jar=c, dabs=dose, start=up(start), end=up(start + reach if down else start - reach), way='down' if down else 'up'))
            slats.append(dict(x0=round(self.x0 + sl['i0'] * self.pitch, 1), legs=sl['w'], ground=(sl['light'][0][1] if sl['light'] else None),
                              puddles_y=[up(y) for y, _, _ in sl['light']], bands=bands))
        return dict(id=pid, title=title, note='HOLO, a study: every number est., nothing run on the machine', composition=self.comp, w=self.W, h=self.H, pitch=self.pitch,
                    field=dict(x0=round(self.x0, 1), x1=round(self.x0 + self.N * self.pitch, 1), y0=up(self.y1), y1=up(self.y0)), horizon=dict(x=round(self.xc, 1), y=up(self.yc)),
                    est=dict(puddle_gap=self.gap, a_dab_lasts=55 if self.comp == 'fan' else 45, shadow_reach=self.last, shadow_full=self.flat, mark_leg=8, s_per_dab=9),
                    count=dict(legs=st['legs'], slats=len(self.slats), run1_dabs=st['light_puddles'], run2_puddles=st['dark_puddles'], run2_dabs=st['dark_dabs'], line_m=st['line_m']),
                    jars=[dict(hex=c, L=L, run=(1 if a else 2), run1_dabs=a, run2_dabs=b) for c, L, a, b in st['jars']], slats=slats)

class Tiers(Study):
    """TIERS: the same two runs on straight tiers. Every slat a ground (or the bare canvas) its whole height; every tier of it either left open or shadowed by one stroke
    from the tier's edge, laid full over most of the tier and giving out before the next. The tiers' strokes go down and up in turn: a crisp joint, a soft one, a crisp one."""
    def __init__(self, size, pitch=5.0, margin=30.0, gap=40.0, last=1.0, flat=0.6, hmin=54.0, grow=1.32, xf=0.56, yf=0.40, seed=4, share=0.5):
        rng = np.random.default_rng(seed)
        self.W = self.H = size; self.pitch = pitch; self.pal = TIERS; self.palname = 'tiers'; self.margin = margin; self.gap = gap
        self.N = int(round((size - 2 * margin) / pitch)); self.x0 = (size - self.N * pitch) / 2
        self.y0, self.y1 = margin, size - margin; self.last = last; self.flat = flat; self.comp = 'tiers'
        nl = int(round(self.N * xf)); self.xc = self.x0 + nl * pitch; self.yc = self.y0 + (self.y1 - self.y0) * yf
        def edges(room):
            out, h = [], hmin
            while sum(out) + h <= room: out.append(h); h *= grow
            r = room - sum(out)
            if r > 0.55 * h or not out: out.append(r)
            else: out[-1] += r
            return out
        upw, dn = edges(self.yc - self.y0), edges(self.y1 - self.yc)
        ys = [self.yc - sum(upw[:k]) for k in range(len(upw), 0, -1)] + [self.yc + sum(dn[:k]) for k in range(len(dn) + 1)]
        self.tiers = [(ys[k], ys[k + 1]) for k in range(len(ys) - 1)]
        ws = []
        W0 = widths(nl)[::-1] + widths(self.N - nl)
        for q, w in enumerate(W0):
            if w >= 4 and 0 < q < len(W0) - 1 and rng.random() < 0.55: ws += [(1, True), (w - 1, False)] if rng.random() < 0.5 else [(w - 1, False), (1, True)]
            else: ws.append((w, False))
        self.slats, self.legs, i, fam, run = [], [], 0, 'warm', 0
        for s, (w, pin) in enumerate(ws):
            light, dark = [], []
            if pin:
                g = TIERS['pins'][int(rng.random() < 0.35)]
            else:
                if run >= 2 or rng.random() < 0.5: fam, run = ('cool' if fam == 'warm' else 'warm'), 0
                run += 1; F = TIERS[fam]; g = F['ground'][int(rng.integers(len(F['ground'])))]
                for t, (a, b) in enumerate(self.tiers):
                    if rng.random() > share: continue
                    down = t % 2 == 0; blen = b - a
                    dark.append((a + 5 if down else b - 5, F['dark'][int(rng.integers(len(F['dark'])))], int(np.clip(round(blen / 45), 1, 4)), blen, down, a, b))
            if g:
                m = int(np.ceil((self.y1 - self.y0 - 8) / gap)) + 1
                light = [(float(y), g, 1) for y in np.linspace(self.y0 + 4, self.y1 - 4, m)]
            sl = dict(i0=i, w=w, cx=self.x0 + (i + w / 2) * pitch, P=0, kind=None, down=True, accent=pin, light=light, dark=dark)
            self.slats.append(sl)
            for j in range(w): self.legs.append(dict(x=self.x0 + (i + j + 0.5) * pitch, slat=sl, n=i + j))
            i += w

PICTURES = {
 'holo-40-warm': (lambda: Study(400, 'warm'), 'HOLO · 40 × 40, the fan, warm'),
 'holo-60-blue': (lambda: Study(600, 'blue', slope=0.36, xf=0.58, yf=0.44, acc=((4, 8), (3, 7))), 'HOLO · 60 × 60, the fan, blue'),
 'holo-60-tiers': (lambda: Tiers(600), 'HOLO · 60 × 60, the tiers'),
}

if __name__ == '__main__':
    if sys.argv[1] in PICTURES:                         # python holo_study.py holo-60-tiers out/   → its four stages as png, its plan as json
        make, title = PICTURES[sys.argv[1]]; st = make(); out = sys.argv[2].rstrip('/') + '/' + sys.argv[1]
        if '--plan-only' not in sys.argv:
            for stage in ('p1', 'r1', 'p2', 'r2'): st.render(stage).save(f'{out}-{stage}.png')
        json.dump(st.plan(sys.argv[1], title), open(out + '.json', 'w'), separators=(',', ':'))
        print(json.dumps(st.stats())); sys.exit()

    size, pal, out = int(sys.argv[1]), sys.argv[2], sys.argv[3]
    st = Study(size, pal, **(json.loads(sys.argv[4]) if len(sys.argv) > 4 else {}))
    for stage in ('p1', 'r1', 'p2', 'r2'): st.render(stage).save(f'{out}-{stage}.png')
    print(json.dumps(st.stats()))
