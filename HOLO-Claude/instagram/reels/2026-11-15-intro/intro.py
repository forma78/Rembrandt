"""HOLO intro reel: the robot rolls in, says hello, takes a tomato and a boo,
paints with the tomato, and the boo loses its B.

usage: python3 intro.py OUT.mp4            full render (video + voice + sfx)
       python3 intro.py --stills DIR t1 t2  frames at given seconds
"""
import math, os, random, subprocess, sys, zlib
import cairo, numpy as np, soundfile as sf

W, H, FPS = 1080, 1920, 30
DUR = 24.0
GROUND = 1100
HERE = os.path.dirname(os.path.abspath(__file__))
VOICE = os.path.join(HERE, os.environ.get("HOLO_VOICE", "voice_fable"))

def rgb(h): return tuple(int(h[i:i + 2], 16) / 255 for i in (1, 3, 5))
INK = rgb("#1A1714"); FACE = rgb("#F6F2E8"); RED = rgb("#E5281E")
BG = rgb("#EFE0CC"); FLOOR = rgb("#E4D0B5"); GREY = rgb("#9A9A96")
ORANGE = rgb("#C8402A"); YEL = rgb("#F0AC26"); BLUE = rgb("#2B49C7")
GREEN = rgb("#3E8A3A"); WOOD = rgb("#C38E5A"); CAT = rgb("#A9A49B")
CANVAS = rgb("#FCFAF5"); CATDARK = rgb("#6F6A62")

# ---------------- timeline (s) ----------------
T_ARRIVE = 1.4
L1, L2, L3, L5, L6 = 1.6, 7.0, 8.9, 15.1, 20.4
T_KUZ_IN, T_KUZ = 12.75, 13.75      # Takeda rides in on his bicycle, then speaks
T_TAK_STOP = 13.5
KX, KY, KS = 225, 1830, 1.1
T_KIN = 0.9                         # Kuzya walks in early and watches
T_CAT_IN, T_THROW, T_HIT, T_CAT_OUT = 4.15, 4.7, 5.15, 5.9
T_WIPE0, T_WIPE1 = 6.15, 6.85
T_LOOKHAND = 8.2
T_MOVE0, T_MOVE1 = 10.0, 10.4
T_TOUCH = 10.78
T_CRAB = 11.35
T_BOO = 11.9
T_BFALL = 19.4
T_OOO = 19.55
T_END = 21.75
ROBOT_X0, ROBOT_X1 = 540, 455
CRAB_X = 800
RS, ES, CS = 1.0, 1.0, 1.0
SC = RS / 1.2                       # the tomato cat, drawn at the old size
TOUCH = (-212, -238)   # the left hand on the canvas, robot units

# ---------------- helpers ----------------
def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def seg(t, a, b): return clamp((t - a) / (b - a))
def smooth(x): x = clamp(x); return x * x * (3 - 2 * x)
def back_out(x, s=1.6):
    x = clamp(x) - 1
    return x * x * ((s + 1) * x + s) + 1
def lerp(a, b, k): return a + (b - a) * k
def lerp2(p, q, k): return (lerp(p[0], q[0], k), lerp(p[1], q[1], k))

def keys(t, kf):
    """kf: [(time, value), ...] value float or tuple; smooth between keys."""
    if t <= kf[0][0]: return kf[0][1]
    for (t0, v0), (t1, v1) in zip(kf, kf[1:]):
        if t <= t1:
            k = smooth((t - t0) / (t1 - t0)) if t1 > t0 else 1
            if isinstance(v0, tuple): return lerp2(v0, v1, k)
            return lerp(v0, v1, k)
    return kf[-1][1]

def resample(pts, n):
    P = pts + [pts[0]]
    L = [0.0]
    for a, b in zip(P, P[1:]): L.append(L[-1] + math.dist(a, b))
    tot = L[-1]; out = []; j = 0
    for i in range(n):
        s = tot * i / n
        while L[j + 1] < s: j += 1
        k = (s - L[j]) / (L[j + 1] - L[j] or 1)
        out.append(lerp2(P[j], P[j + 1], k))
    return out

def rr_pts(x, y, w, h, r, n=90):
    r = min(r, w / 2, h / 2); pts = []
    for cx, cy, a0 in ((x + w - r, y + r, -90), (x + w - r, y + h - r, 0), (x + r, y + h - r, 90), (x + r, y + r, 180)):
        for i in range(9):
            a = math.radians(a0 + 90 * i / 8)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return resample(pts, n)

def ell_pts(cx, cy, rx, ry, n=60):
    return [(cx + rx * math.cos(2 * math.pi * i / n), cy + ry * math.sin(2 * math.pi * i / n)) for i in range(n)]

def wob(pts, sid, boil, amp=2.4):
    r = random.Random(zlib.crc32(sid.encode()) * 7919 + boil)
    ph = [r.uniform(0, 6.283) for _ in range(4)]
    k1, k2 = r.choice((2, 3)), r.choice((4, 5))
    n = len(pts); out = []
    for i, (x, y) in enumerate(pts):
        u = 6.283 * i / n
        out.append((x + amp * (0.6 * math.sin(k1 * u + ph[0]) + 0.4 * math.sin(k2 * u + ph[1])),
                    y + amp * (0.6 * math.sin(k1 * u + ph[2]) + 0.4 * math.sin(k2 * u + ph[3]))))
    return out

def jit(p, sid, boil, amp=1.8):
    r = random.Random(zlib.crc32(sid.encode()) * 104729 + boil)
    return (p[0] + r.uniform(-amp, amp), p[1] + r.uniform(-amp, amp))


class Pen:
    def __init__(self, ctx, boil):
        self.c = ctx; self.b = boil
        ctx.set_line_cap(cairo.LINE_CAP_ROUND); ctx.set_line_join(cairo.LINE_JOIN_ROUND)

    def poly(self, pts, fill=None, stroke=INK, lw=8, alpha=1.0):
        c = self.c
        c.move_to(*pts[0])
        for p in pts[1:]: c.line_to(*p)
        c.close_path()
        if fill is not None:
            c.set_source_rgba(*fill, alpha)
            if stroke is not None: c.fill_preserve()
            else: c.fill()
        if stroke is not None:
            c.set_source_rgba(*stroke, alpha); c.set_line_width(lw); c.stroke()

    def shape(self, sid, pts, fill=None, stroke=INK, lw=8, amp=2.4, alpha=1.0):
        self.poly(wob(pts, sid, self.b, amp), fill, stroke, lw, alpha)

    def line(self, sid, pts, lw=8, col=INK, amp=1.6, alpha=1.0):
        c = self.c
        q = [jit(p, sid + str(i), self.b, amp) for i, p in enumerate(pts)]
        c.move_to(*q[0])
        for p in q[1:]: c.line_to(*p)
        c.set_source_rgba(*col, alpha); c.set_line_width(lw); c.stroke()

    def curve(self, sid, p0, c1, c2, p1, lw=8, col=INK, amp=1.6):
        c = self.c
        p0 = jit(p0, sid + "a", self.b, amp); p1 = jit(p1, sid + "b", self.b, amp)
        c.move_to(*p0); c.curve_to(*c1, *c2, *p1)
        c.set_source_rgb(*col); c.set_line_width(lw); c.stroke()

    def dot(self, x, y, r, col, alpha=1.0):
        self.c.arc(x, y, r, 0, 6.2832); self.c.set_source_rgba(*col, alpha); self.c.fill()


# ---------------- the audio: phrase starts inside a line ----------------
def load(name):
    a, sr = sf.read(os.path.join(VOICE, name + ".wav"), dtype="float32"); return a, sr

def phrase_starts(name, min_gap=0.13):
    a, sr = load(name)
    hop = int(sr * 0.01)
    env = np.array([np.sqrt(np.mean(a[i:i + hop] ** 2)) for i in range(0, len(a) - hop, hop)])
    quiet = env < 0.012
    starts, run = [0.0], 0
    for i, q in enumerate(quiet):
        if q: run += 1
        else:
            if run * 0.01 >= min_gap and i * 0.01 > 0.2: starts.append(i * 0.01)
            run = 0
    return starts, len(a) / sr

def pick(starts, dur, fracs):
    out = []
    for f in fracs:
        cand = [s for s in starts[1:] if s not in out]
        out.append(min(cand, key=lambda s: abs(s - f * dur)) if cand else f * dur)
    return sorted(out)

D = {}
for k in ("L1", "L2", "L3", "KUZ", "L5", "K2", "L7", "L6", "BOO", "OOO"):
    D[k] = phrase_starts(k)
LEN = {k: v[1] for k, v in D.items()}
# the late beats follow the voice, so a slower voice still fits
L5 = max(14.6, T_KUZ + LEN["KUZ"] + 0.45)
K2 = L5 + LEN["L5"] + 0.3                                  # Kuzya: "Is that a real canvas?"
L7 = K2 + LEN["K2"] + 0.25                                 # "Yes! I use acrylic..."
T_BFALL = max(19.4, L7 + LEN["L7"] + 0.3)
T_OOO = T_BFALL + 0.15
L6 = max(20.4, T_OOO + LEN["OOO"] + 0.15)
T_END = max(21.75, L6 + LEN["L6"] + 0.15)
DUR = max(24.0, T_END + 2.3)
L1_red = L1 + pick(*D["L1"], [0.7])[0]                    # "No name yet."
L5_s = [L5] + [L5 + s for s in pick(*D["L5"], [0.5])]    # two phrases
G0 = L7 - 0.15                                            # the answer: point at the canvas

# the robot's bubble: (start, end, [(text, colour, size, appears_at)])
BUBBLES = [
    (L1 - 0.05, max(T_CAT_IN + 0.3, L1 + LEN["L1"] + 0.1), [("Hi! I'm an AI artist.", INK, 58, 0), ("No name yet.", RED, 48, L1_red)]),
    (L2 - 0.05, L2 + LEN["L2"] + 0.5, [("Okay. Fair.", INK, 60, 0)]),
    (L3 - 0.05, L3 + LEN["L3"] + 0.7, [("Nice red, though.", INK, 60, 0)]),
    (L5_s[0] - 0.05, L5_s[1] - 0.02, [("I plan every touch.", INK, 58, 0)]),
    (L5_s[1] - 0.02, L5 + LEN["L5"] + 0.25, [("A machine paints it.", INK, 58, 0)]),
    (L7 - 0.05, L7 + LEN["L7"] + 0.2, [("Yes! I use acrylic", INK, 56, 0), ("with pouring medium.", INK, 56, 0)]),
    (L6 - 0.05, T_END - 0.02, [("Tomatoes welcome.", INK, 60, 0)]),
]

def talking(t):
    for k, t0 in (("L1", L1), ("L2", L2), ("L3", L3), ("L5", L5), ("L7", L7), ("L6", L6)):
        if t0 <= t <= t0 + LEN[k]: return k, t - t0
    return None, 0

# mouth envelope per voice line, at 15 fps
ENV = {}
for k in ("L1", "L2", "L3", "KUZ", "L5", "K2", "L7", "L6", "BOO", "OOO"):
    a, sr = load(k); step = sr // 15
    e = np.array([np.sqrt(np.mean(a[i:i + step] ** 2)) for i in range(0, len(a), step)])
    ENV[k] = np.clip(e / (np.percentile(e, 90) + 1e-6), 0, 1)

def mouth_open(k, dt):
    if k is None: return 0.0
    e = ENV[k]; i = int(dt * 15)
    return float(e[i]) if i < len(e) else 0.0


# ---------------- the robot ----------------
def robot_x(t):
    if t < T_ARRIVE:
        return lerp(-170, ROBOT_X0, back_out(seg(t, 0.0, T_ARRIVE), 0.9))
    return keys(t, [(T_MOVE0, ROBOT_X0), (T_MOVE1, ROBOT_X1)])

def look(t):
    return keys(t, [(0, (0, 0)), (4.1, (0, 0)), (4.35, (12, -4)), (5.1, (12, -4)), (5.25, (0, 0)),
                    (8.1, (0, 0)), (8.3, (-13, 8)), (9.8, (-13, 8)), (10.0, (-14, 4)), (11.2, (-14, 4)),
                    (11.6, (12, 6)), (T_KUZ - 0.1, (12, 6)), (T_KUZ + 0.15, (-12, 12)), (L5 - 0.15, (-12, 12)), (L5 + 0.1, (4, 4)), (K2 - 0.1, (4, 4)), (K2 + 0.15, (-12, 12)), (G0 - 0.05, (-12, 12)), (G0 + 0.25, (-14, 4)), (T_BFALL - 0.1, (-14, 4)),
                    (T_BFALL + 0.1, (8, 10)), (L6 - 0.2, (8, 10)), (L6, (0, 0))])

BLINKS = [2.9, 6.05, 12.4, 16.6, DUR - 1.0]

def expression(t):
    k, dt = talking(t)
    m = mouth_open(k, dt)
    blink = any(b <= t <= b + 0.13 for b in BLINKS) or (T_HIT <= t <= T_HIT + 0.16)
    if T_HIT + 0.16 < t < L2 + LEN["L2"] + 0.4: mood = "sad"
    elif 4.9 <= t < T_HIT: mood = "surprised"
    elif 8.62 <= t < L3: mood = "surprised"
    elif T_BOO - 0.05 <= t < T_BOO + 0.5: mood = "surprised"
    elif T_BFALL <= t < L6: mood = "surprised"
    elif t >= L6 and k is None: mood = "happy"
    elif t >= L6: mood = "happytalk"
    elif (T_ARRIVE <= t < L1) or (L1 + LEN["L1"] < t < 4.4) or (9.9 < t < 11.4) or (T_KUZ <= t < L5) or (K2 <= t < L7): mood = "smile"
    else: mood = "neutral"
    return mood, m, blink

def hands(t):
    rest_l = (-152 + 3 * math.sin(t * 2.1), -172 + 4 * math.sin(t * 1.7))
    rest_r = (152 + 3 * math.sin(t * 2.3 + 1), -172 + 4 * math.sin(t * 1.9 + 2))
    # right hand: wave hello, and wave at the end
    wave = (182 + 26 * math.sin(t * 2 * math.pi * 2.2), -560)
    if 1.35 <= t <= 4.2:
        k = smooth(seg(t, 1.35, 1.6)) * (1 - smooth(seg(t, 3.9, 4.2)))
        R = lerp2(rest_r, wave, k)
    elif t >= T_END - 0.3:
        R = lerp2(rest_r, wave, smooth(seg(t, T_END - 0.3, T_END)))
    else:
        R = rest_r
    # left hand: wipe, look at it, dab, point at the canvas
    L = keys(t, [(T_WIPE0 - 0.25, rest_l), (T_WIPE0, (-175, -500)), (T_WIPE1, (175, -470)),
                 (T_WIPE1 + 0.3, (90, -330)), (T_LOOKHAND - 0.1, (-40, -260)), (T_LOOKHAND + 0.2, (-185, -440)),
                 (T_MOVE0 + 0.15, (-185, -440)), (T_TOUCH, TOUCH), (T_TOUCH + 0.15, TOUCH),
                 (T_TOUCH + 0.55, rest_l)])
    if t > T_TOUCH + 0.55:
        L = keys(t, [(G0, rest_l), (G0 + 0.35, (-215, -330)), (T_BFALL - 0.2, (-215, -330)), (T_BFALL + 0.1, rest_l)])
    if t < T_WIPE0 - 0.25: L = rest_l
    return L, R

def tilt(t):
    a = 2.2 * math.sin(t * 2 * math.pi * 0.45)
    if t > T_HIT: a += -16 * math.exp(-(t - T_HIT) * 4.5) * math.cos((t - T_HIT) * 14)
    a += keys(t, [(9.95, 0), (10.2, -5), (11.3, -5), (11.6, 5), (T_KUZ - 0.1, 5), (T_KUZ + 0.2, -4), (L5 - 0.1, -4), (L5 + 0.2, 2), (K2 - 0.1, 2), (K2 + 0.2, -4), (G0, -4), (G0 + 0.3, -5), (T_BFALL - 0.1, -5), (T_BFALL + 0.2, 0)])
    if t < T_ARRIVE + 0.6 and t > T_ARRIVE:
        a += 6 * math.exp(-(t - T_ARRIVE) * 6) * math.sin((t - T_ARRIVE) * 18)
    return a

def splat_state(t):
    if t < T_HIT: return 0, 0, 0
    drip = smooth(seg(t, T_HIT, T_HIT + 1.3))
    if t < T_WIPE0 + 0.1: return 1, drip, 0
    k = smooth(seg(t, T_WIPE0 + 0.1, T_WIPE1))
    return 1 - k, drip, k     # splat fades, smear grows


def draw_robot(p, t, x):
    c = p.c
    mood, m, blink = expression(t)
    L, R = hands(t)
    lk = look(t)
    talk_bob = -3 * m
    c.save(); c.translate(x, GROUND); c.scale(RS, RS)
    # landing squash
    sq = 1.0
    if T_ARRIVE < t < T_ARRIVE + 0.7: sq = 1 - 0.05 * math.exp(-(t - T_ARRIVE) * 5) * math.cos((t - T_ARRIVE) * 16)
    if T_HIT < t < T_HIT + 0.6: sq *= 1 - 0.04 * math.exp(-(t - T_HIT) * 6) * math.cos((t - T_HIT) * 18)
    c.scale(1, sq)
    # wheels
    ang = (x - (-300)) / 44
    for wx in (-80, 80):
        p.shape(f"wheel{wx}", ell_pts(wx, -44, 44, 44, 40), INK, INK, 6, amp=1.5)
        for k in range(3):
            a = ang + k * 2.094
            p.line(f"sp{wx}{k}", [(wx + 12 * math.cos(a), -44 + 12 * math.sin(a)), (wx + 32 * math.cos(a), -44 + 32 * math.sin(a))], 6, GREY, 0.6)
        p.dot(wx, -44, 11, FACE)
    p.shape("base", rr_pts(-128, -112, 256, 48, 24), INK, INK, 6)
    c.translate(0, talk_bob)
    # the body: a painter's smock, with paint on it
    p.shape("body", rr_pts(-102, -334, 204, 228, 58), FACE, INK, 9)
    p.shape("sp1", ell_pts(-52, -258, 15, 12, 24), YEL, None, amp=1.2)
    p.shape("sp2", ell_pts(46, -196, 11, 9, 20), BLUE, None, amp=1.0)
    p.shape("sp3", ell_pts(-26, -158, 9, 8, 20), RED, None, amp=1.0)
    p.shape("sp4", rr_pts(-58, -250, 9, 28, 4, 24), YEL, None, amp=0.8)
    # a pocket with a brush
    p.line("brush", [(52, -282), (70, -348)], 9, WOOD)
    p.shape("bristle", ell_pts(71, -352, 7, 11, 16), RED, INK, 4, amp=0.6)
    p.shape("pocket", rr_pts(28, -292, 54, 44, 10, 40), FACE, INK, 6, amp=1.2)
    # the neck
    p.shape("neck", rr_pts(-15, -366, 30, 40, 8, 40), GREY, INK, 6, amp=1.0)

    # ---- the head, turned round the neck
    c.save(); c.translate(0, -362); c.rotate(math.radians(tilt(t))); c.translate(0, 362)
    # the camera on its arm, looking at the work
    p.line("camarm", [(108, -604), (150, -662)], 13)
    c.save(); c.translate(180, -680); c.rotate(math.radians(24 + 6 * math.sin(t * 1.3)))
    p.shape("cam", rr_pts(-44, -24, 88, 48, 14, 50), INK, INK, 4, amp=1.2)
    p.dot(46, 0, 15, FACE); p.dot(48, 0, 6.5, RED)
    c.restore()
    p.shape("head", rr_pts(-152, -614, 304, 254, 74), INK, INK, 4)
    scr = rr_pts(-124, -586, 248, 198, 52)
    p.shape("screen", scr, FACE, None)
    # the red beret, on the side opposite the camera
    c.save(); c.translate(-52, -630); c.rotate(-0.21)
    ber = [(112 * math.cos(u), (46 if math.sin(u) < 0 else 20) * math.sin(u)) for u in [6.283 * i / 70 for i in range(70)]]
    p.shape("beret", ber, RED, INK, 8, amp=1.6)
    p.line("beretfold", [(-70, -6), (-20, -18), (40, -14)], 5, rgb("#B81F17"), 0.8)
    p.line("stem", [(4, -44), (10, -64)], 10)
    c.restore()
    # blush
    bl_a = 0.18 + 0.22 * smooth(seg(t, T_KUZ + 0.5, T_KUZ + 0.8)) * (1 - smooth(seg(t, L5 + 0.4, L5 + 0.9)))
    p.dot(-90, -452, 21, RED, bl_a); p.dot(90, -452, 21, RED, bl_a)
    ex, ey = lk
    # eyes
    for s in (-1, 1):
        cx, cy = s * 52 + ex, -506 + ey
        if blink:
            p.shape(f"bl{s}", rr_pts(cx - 16, cy - 4, 32, 10, 5, 30), INK, None, amp=0.8)
        elif mood in ("happy", "happytalk"):
            c.arc(cx, cy + 14, 19, math.pi * 1.08, math.pi * 1.92)
            c.set_source_rgb(*INK); c.set_line_width(10); c.stroke()
        elif mood == "surprised":
            p.shape(f"ey{s}", rr_pts(cx - 13, cy - 42, 26, 84, 13, 40), INK, None, amp=1.0)
        elif mood == "sad":
            p.shape(f"ey{s}", rr_pts(cx - 11, cy - 22, 22, 56, 11, 40), INK, None, amp=1.0)
            p.line(f"brow{s}", [(cx - s * 24, cy - 54), (cx + s * 16, cy - 40)], 8)
        else:
            p.shape(f"ey{s}", rr_pts(cx - 11, cy - 33, 22, 66, 11, 40), INK, None, amp=1.0)
    # mouth: one puddle
    mx, my = ex * 0.4, -440 + ey * 0.3
    if mood in ("smile", "happy") and m < 0.05:
        c.arc(mx, my - 22, 28, math.radians(25), math.radians(155))
        c.set_source_rgb(*RED); c.set_line_width(10); c.stroke()
    elif mood == "sad" and m < 0.05:
        c.arc(mx, my + 26, 24, math.radians(205), math.radians(335))
        c.set_source_rgb(*RED); c.set_line_width(9); c.stroke()
    elif mood == "surprised" and m < 0.05:
        p.shape("mo", ell_pts(mx, my, 15, 19, 30), RED, None, amp=0.8)
    else:
        rx, ry = 13 + 6 * m, 11 + 16 * m
        if mood == "happytalk": ry += 2
        p.shape("mt", ell_pts(mx, my, rx, ry, 30), RED, None, amp=0.6)
    # the tomato on the screen
    alpha, drip, smear = splat_state(t)
    if alpha > 0 or smear > 0:
        c.save()
        c.move_to(*scr[0])
        for q in scr[1:]: c.line_to(*q)
        c.close_path(); c.clip()
        if alpha > 0:
            r = random.Random(7)
            bl = [(18 + 60 * (1 + 0.18 * math.sin(5 * u) + 0.1 * math.sin(9 * u + 1)) * math.cos(u),
                   -500 + 56 * (1 + 0.18 * math.sin(5 * u) + 0.1 * math.sin(9 * u + 1)) * math.sin(u))
                  for u in [6.283 * i / 60 for i in range(60)]]
            p.shape("splat", bl, RED, None, amp=1.5, alpha=alpha)
            for i, (dx, dl) in enumerate(((-22, 70), (14, 46), (44, 84))):
                ln = dl * drip
                p.shape(f"drip{i}", rr_pts(18 + dx - 8, -470, 16, 30 + ln, 8, 30), RED, None, amp=0.6, alpha=alpha)
            for i in range(6):
                a = r.uniform(0, 6.28); d = r.uniform(80, 110)
                p.dot(18 + d * math.cos(a), -500 + d * 0.8 * math.sin(a), r.uniform(5, 10), RED, alpha)
        if smear > 0:
            sm = rr_pts(-90, -508 + 8, 200 * smear + 20, 30, 15, 40)
            p.shape("smear", sm, RED, None, amp=2, alpha=0.28 * (1 - smooth(seg(t, 7.4, 8.6))))
        c.restore()
    c.restore()  # head

    # ---- the arms: soft hoses, mitten hands
    for side, H_ in ((-1, L), (1, R)):
        S = (side * 98, -298)
        d = math.dist(S, H_)
        up = clamp((S[1] - H_[1]) / 90, -1, 1)
        c1 = (S[0] + side * 0.45 * d, S[1] + 0.12 * d)
        c2 = (H_[0], H_[1] + 0.42 * d * up)
        p.curve(f"arm{side}", S, c1, c2, H_, 22)
        p.shape(f"thumb{side}", ell_pts(H_[0] - side * 22, H_[1] - 12, 11, 11, 20), FACE, INK, 6, amp=0.8)
        p.shape(f"hand{side}", ell_pts(H_[0], H_[1], 27, 25, 36), FACE, INK, 7, amp=1.0)
        if side == -1 and T_WIPE1 - 0.2 < t:
            k = 1.0 if t < T_TOUCH else 0.55
            p.shape("redhand", ell_pts(H_[0] + 3, H_[1] + 2, 15 * k + 2, 12 * k + 2, 24), RED, None, amp=1.2)
    c.restore()
    return L


# ---------------- the cat (ours), the tomato ----------------
CAT_X = W - 60
CAT_RELEASE = (CAT_X - 90 * SC, GROUND - 380 * SC)

def draw_cat(p, t):
    """Our cat, sitting at the right edge on the floor."""
    if not (T_CAT_IN - 0.05 < t < T_CAT_OUT + 0.45): return None
    c = p.c
    off = 300 * (1 - back_out(seg(t, T_CAT_IN, T_CAT_IN + 0.35), 1.2)) + 320 * smooth(seg(t, T_CAT_OUT, T_CAT_OUT + 0.4))
    c.save(); c.translate(CAT_X + off, GROUND); c.scale(SC, SC)
    if t < T_THROW:
        paw = lerp2((-150, -150), (-90, -350), smooth(seg(t, T_CAT_IN + 0.25, T_THROW)))
    else:
        paw = lerp2((-90, -350), (-250, -250), smooth(seg(t, T_THROW, T_THROW + 0.12)))
        if t > T_THROW + 0.5: paw = lerp2((-250, -250), (-170, -130), smooth(seg(t, T_THROW + 0.5, T_THROW + 0.9)))
    p.shape("catbody", ell_pts(-50, -88, 105, 90, 60), CAT, INK, 8)
    p.curve("cattail", (40, -30), (120, -40), (110, -200), (60, -230), 30, INK)
    p.curve("cattail2", (40, -30), (120, -40), (110, -200), (60, -230), 18, CAT)
    sh = (-110, -150)
    p.curve("catarm", sh, (sh[0] - 30, sh[1] - 10), (paw[0] + 10, paw[1] + 40), paw, 34, INK)
    p.curve("catarm2", sh, (sh[0] - 30, sh[1] - 10), (paw[0] + 10, paw[1] + 40), paw, 22, CAT)
    hx, hy = -100, -225
    for s_, ex in ((-1, hx - 52), (1, hx + 48)):
        p.shape(f"ear{s_}", [(ex - 30, hy - 40), (ex - 4 + s_ * 8, hy - 112), (ex + 28, hy - 46)], CAT, INK, 8, amp=1.2)
    p.shape("cathead", ell_pts(hx, hy, 90, 78, 60), CAT, INK, 8)
    for i in range(3):
        p.line(f"stripe{i}", [(hx - 22 + i * 20, hy - 70), (hx - 18 + i * 20, hy - 44)], 7, CATDARK)
    for ex in (hx - 32, hx + 30):            # smug, half-closed
        c.arc(ex, hy - 4, 13, 0, math.pi); c.set_source_rgb(*INK); c.fill()
        p.line(f"lid{ex}", [(ex - 16, hy - 6), (ex + 16, hy - 6)], 7)
    p.line("catmouth", [(hx - 12, hy + 32), (hx, hy + 40), (hx + 12, hy + 32)], 6)
    for s_ in (-1, 1):
        p.line(f"wh{s_}", [(hx + s_ * 34, hy + 28), (hx + s_ * 84, hy + 20 + s_ * 4)], 4)
    p.shape("paw", ell_pts(paw[0], paw[1], 26, 24, 30), CAT, INK, 7, amp=1)
    c.restore()
    return (CAT_X + off + SC * paw[0], GROUND + SC * paw[1])

def draw_tomato(p, x, y, rot, scale=1.0):
    c = p.c
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(scale, scale)
    p.shape("tom", ell_pts(0, 0, 36, 33, 40), RED, INK, 7, amp=1.0)
    p.dot(-12, -10, 8, FACE, 0.55)
    star = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5; r_ = 22 if i % 2 == 0 else 8
        star.append((r_ * math.cos(a), -28 + r_ * 0.55 * math.sin(a)))
    p.shape("calyx", star, GREEN, INK, 4, amp=0.6)
    c.restore()


# ---------------- the easel and the canvas ----------------
def draw_easel(p, t):
    c = p.c
    c.save(); c.translate(200, GROUND); c.scale(ES, ES); c.translate(-200, -GROUND)
    G = GROUND
    p.line("leg1", [(130, G - 380), (88, G)], 16, INK); p.line("leg1w", [(130, G - 380), (88, G)], 8, WOOD, 0)
    p.line("leg2", [(270, G - 380), (312, G)], 16, INK); p.line("leg2w", [(270, G - 380), (312, G)], 8, WOOD, 0)
    p.line("leg3", [(200, G - 390), (200, G - 10)], 14, INK); p.line("leg3w", [(200, G - 390), (200, G - 10)], 6, WOOD, 0)
    p.line("ledge", [(96, G - 128), (304, G - 128)], 18, INK); p.line("ledgew", [(96, G - 128), (304, G - 128)], 9, WOOD, 0)
    p.shape("canvas", rr_pts(110, G - 342, 180, 206, 6), CANVAS, INK, 8, amp=1.6)
    if t >= T_TOUCH:
        k = back_out(seg(t, T_TOUCH, T_TOUCH + 0.25), 2.0)
        r = random.Random(3)
        cx = 200 + (ROBOT_X1 + RS * TOUCH[0] - 200) / ES
        cy = GROUND + (RS * TOUCH[1]) / ES
        bl = [(cx + 17 * k * (1 + 0.15 * math.sin(4 * u + 1)) * math.cos(u), cy + 13 * k * (1 + 0.15 * math.sin(4 * u + 1)) * math.sin(u))
              for u in [6.283 * i / 30 for i in range(30)]]
        p.shape("dab", bl, RED, None, amp=0.8)
    c.restore()


# ---------------- the crab (ours) ----------------
def draw_crab(p, t):
    if t < T_CRAB: return
    c = p.c
    rise = 640 * (1 - back_out(seg(t, T_CRAB, T_CRAB + 0.42), 1.4))
    c.save(); c.translate(CRAB_X, GROUND + rise); c.scale(CS, CS)
    boo = T_BOO <= t <= T_BOO + 0.8
    surprised = t >= T_BFALL
    shake = 10 * math.sin(t * 40) if boo else 0
    # legs
    for s in (-1, 1):
        for i in range(3):
            x0 = s * (40 + i * 22)
            p.line(f"leg{s}{i}", [(x0, -40), (x0 + s * 26, -18), (x0 + s * 30, 0)], 9)
    # claws
    for s in (-1, 1):
        lift = -40 if surprised else 0
        tip = (s * 110, -172 + shake * s + lift * -0.5)
        p.line(f"carm{s}", [(s * 76, -70), (s * 100, -112), tip], 13)
        c.save(); c.translate(*tip); c.rotate(s * -0.35)
        p.shape(f"jawA{s}", ell_pts(0, -22, 26, 20, 30), ORANGE, INK, 7, amp=1)
        p.shape(f"jawB{s}", ell_pts(s * 6, 12, 22, 14, 30), ORANGE, INK, 7, amp=1)
        c.restore()
    # body
    p.shape("crabbody", ell_pts(0, -62, 98, 52, 60), ORANGE, INK, 8)
    # eyes on short stalks
    gaze = keys(t, [(T_CRAB, (0, 0)), (12.6, (-6, 0)), (T_KUZ, (-9, 4)), (L5, (-9, 4)), (L5 + 0.3, (-6, 0)), (K2, (-9, 4)), (L7, (-9, 4)), (G0 + 0.3, (-8, 3))])
    for s in (-1, 1):
        p.line(f"stalk{s}", [(s * 26, -104), (s * 32, -136)], 8)
        r_ = 19 if surprised else 16
        p.shape(f"eyeb{s}", ell_pts(s * 33, -146, r_, r_, 30), FACE, INK, 5, amp=0.6)
        p.dot(s * 33 + gaze[0], -146 + gaze[1], 6.5, INK)
        if not surprised:
            p.line(f"cbrow{s}", [(s * 52, -172), (s * 18, -160)], 7)   # cross
        else:
            p.line(f"cbrow{s}", [(s * 50, -178), (s * 18, -182)], 6)
    if surprised:
        p.shape("cmouth", ell_pts(0, -50, 11, 14, 24), INK, None, amp=0.6)
    elif boo:
        p.shape("cmouth", ell_pts(0, -52, 14, 12 + 6 * abs(math.sin(t * 20)), 24), INK, None, amp=0.6)
    else:
        p.line("cmouth", [(-14, -48), (0, -54), (14, -48)], 6)
    c.restore()


# ---------------- Takeda's lines (the functions kept their first name) ----------------
def kuz_mouth(t):
    if T_KUZ <= t <= T_KUZ + LEN["KUZ"]: return mouth_open("KUZ", t - T_KUZ)
    if K2 <= t <= K2 + LEN["K2"]: return mouth_open("K2", t - K2)
    return 0.0

def kuz_talks(t, pad=0.0):
    return (T_KUZ - pad < t < T_KUZ + LEN["KUZ"] + pad) or (K2 - pad < t < K2 + LEN["K2"] + pad)

# ---------------- Takeda: the owner's red pig on a bicycle (Noble Piggies), from his own file ----------------
_TAK_FILE = os.path.join(HERE, "takeda_bike.png")
if not os.path.exists(_TAK_FILE):
    sys.exit("takeda_bike.png is not in the repository (the owner's trademark): see instagram/README.md")
TAK = cairo.ImageSurface.create_from_png(_TAK_FILE)
TW, TH = TAK.get_width(), TAK.get_height()
TS = 717 / TH                          # 28 % bigger than the first cut
TAK_X, TAK_BOTTOM = 20, 1850          # where he stops: the sprite's left edge, its bottom
TAK_RED = rgb("#EB1F27")
TAK_EYES = [(527, 164, 654, 216), (873, 174, 996, 218)]   # sprite px, eyes with their outline

def takeda_x(t):
    k = seg(t, T_KUZ_IN, T_TAK_STOP)
    return lerp(W + 40, TAK_X, 1 - (1 - k) ** 3)

def draw_takeda(p, t):
    if t < T_KUZ_IN: return
    c = p.c
    x = takeda_x(t)
    moving = t < T_TAK_STOP
    m = kuz_mouth(t)
    talking = kuz_talks(t)
    bob = (-5 * abs(math.sin(t * 2 * math.pi * 3.2)) if moving else 0) + (1.5 * math.sin(t * 2.4) if not moving else 0)
    if talking: bob += -3 * m
    # braking: a little nod forward (the bike faces left), then back
    tilt = 0.0
    if t >= T_TAK_STOP:
        u = t - T_TAK_STOP
        tilt = -4.5 * math.exp(-u * 6) * math.cos(u * 15)
    c.save()
    # speed lines behind him while he rides
    if moving:
        for i in range(3):
            yy = TAK_BOTTOM - 140 - i * 70
            x0 = x + TW * TS + 20 + 15 * i
            p.line(f"speed{i}", [(x0, yy), (x0 + 70 + 20 * i, yy)], 6, INK, 1.0, alpha=0.5)
    c.translate(x + 120 * TS, TAK_BOTTOM + bob)          # pivot near the front wheel
    c.rotate(math.radians(tilt))
    c.scale(TS, TS)
    c.translate(-120, -TH)
    c.set_source_surface(TAK, 0, 0); c.paint()
    # blinks, and a wink at the end
    blinks = (15.9, 18.4)
    for j, (x0, y0, x1, y1) in enumerate(TAK_EYES):
        shut = any(b <= t <= b + 0.13 for b in blinks) or (j == 1 and T_END + 0.5 <= t <= T_END + 1.1)
        if shut:
            cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
            c.save(); c.translate(cx, cy); c.scale((x1 - x0) / 2 + 6, (y1 - y0) / 2 + 6)
            c.arc(0, 0, 1, 0, 6.2832); c.restore()
            c.set_source_rgb(*TAK_RED); c.fill()
            c.move_to(x0 + 6, cy + 4); c.curve_to(cx - 20, cy + 16, cx + 20, cy + 16, x1 - 6, cy + 4)
            c.set_source_rgb(*INK); c.set_line_width(9); c.stroke()
    # the mouth, only while he talks
    if m > 0.05:
        c.save(); c.translate(740, 345); c.scale(30, 8 + 26 * m); c.arc(0, 0, 1, 0, 6.2832); c.restore()
        c.set_source_rgb(*rgb("#5A0E10")); c.fill()
    c.restore()


# ---------------- bubbles and text ----------------
def font(c, size):
    c.select_font_face("Poppins", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD); c.set_font_size(size)

def bubble(p, sid, cx, bottom, lines, t, t0, tail_to, left=None):
    """lines: [(text, colour, size, appears_at)] — all lines size the bubble from the start."""
    c = p.c
    sizes = []
    for text, col, size, _ in lines:
        font(c, size); e = c.text_extents(text); sizes.append((e.x_advance, size))
    tw = max(s[0] for s in sizes)
    lh = [int(s * 1.18) for _, s in sizes]
    padx, pady = 46, 30
    w = tw + 2 * padx; h = sum(lh) + 2 * pady
    x0 = left if left is not None else clamp(cx - w / 2, 40, W - 40 - w); y0 = bottom - h
    k = back_out(seg(t, t0, t0 + 0.18), 2.2)
    c.save(); c.translate(tail_to[0], tail_to[1]); c.scale(0.55 + 0.45 * k, 0.55 + 0.45 * k); c.translate(-tail_to[0], -tail_to[1])
    if tail_to[0] < x0 + 10:          # a tail out of the left side
        by = clamp(tail_to[1], y0 + 50, y0 + h - 50)
        tail = [(x0 + 4, by - 24), (tail_to[0], tail_to[1]), (x0 + 4, by + 22)]
        cover = [(x0 + 13, by - 17), (tail_to[0] + 11, tail_to[1]), (x0 + 13, by + 15)]
    else:
        bx = clamp(tail_to[0], x0 + 60, x0 + w - 60)
        tail = [(bx - 26, bottom - 4), (tail_to[0], tail_to[1]), (bx + 24, bottom - 4)]
        cover = [(bx - 20, bottom - 12), (tail_to[0] + 0.0, tail_to[1] - 10), (bx + 18, bottom - 12)]
    p.shape(sid + "tail", tail, FACE, INK, 8, amp=1)
    p.shape(sid + "box", rr_pts(x0, y0, w, h, 44, 100), FACE, INK, 8, amp=1.8)
    p.poly(cover, FACE, None)
    y = y0 + pady
    for (text, col, size, at), l_h, (adv, _) in zip(lines, lh, sizes):
        y += l_h
        if t >= at:
            font(c, size); c.set_source_rgb(*col)
            c.move_to(x0 + (w - adv) / 2, y - l_h * 0.22); c.show_text(text)
    c.restore()

def crab_bubble(p, t):
    if t < T_BOO - 0.08: return
    c = p.c
    size = 70
    font(c, size)
    advB = c.text_extents("B").x_advance
    advR = c.text_extents("OOO!").x_advance
    tw = advB + advR
    w, h = tw + 80, 120
    cx, bottom = CRAB_X, GROUND - 254 * CS
    x0, y0 = cx - w / 2, bottom - h
    k = back_out(seg(t, T_BOO - 0.08, T_BOO + 0.12), 2.2)
    tip = (CRAB_X, GROUND - 184 * CS)
    c.save(); c.translate(*tip); c.scale(0.5 + 0.5 * k, 0.5 + 0.5 * k); c.translate(-tip[0], -tip[1])
    tail = [(cx - 24, bottom - 4), tip, (cx + 22, bottom - 4)]
    p.shape("ctail", tail, FACE, INK, 8, amp=1)
    p.shape("cbox", rr_pts(x0, y0, w, h, 40, 90), FACE, INK, 8, amp=1.8)
    p.poly([(cx - 18, bottom - 12), (tip[0], tip[1] - 10), (cx + 16, bottom - 12)], FACE, None)
    tx, ty = x0 + 40, y0 + 88
    font(c, size); c.set_source_rgb(*INK)
    c.move_to(tx + advB, ty); c.show_text("OOO!")
    c.restore()
    # the B: on the bubble, then it falls
    font(c, size)
    bx, by = tx + advB / 2, ty - 26          # B's centre
    if t < T_BFALL:
        c.save(); c.translate(tip[0], tip[1]); c.scale(0.5 + 0.5 * k, 0.5 + 0.5 * k); c.translate(-tip[0], -tip[1])
        c.set_source_rgb(*RED); c.move_to(tx, ty); c.show_text("B"); c.restore()
        return
    # simple fall with a bounce
    dt = t - T_BFALL
    g, vy, vx = 2600.0, -380.0, -40.0
    floor_y = GROUND - 28
    y, x, ang = by, bx, 0.0
    steps = int(dt * 240)
    for _ in range(steps):
        h_ = 1 / 240
        vy += g * h_; y += vy * h_; x += vx * h_
        if y > floor_y and vy > 0:
            y = floor_y; vy = -vy * 0.32; vx *= 0.6
            if abs(vy) < 60: vy = 0
    ang = min(dt * 7.0, math.radians(100)) if y < floor_y else math.radians(100)
    c.save(); c.translate(x, y); c.rotate(-ang)
    c.set_source_rgb(*RED); c.move_to(-advB / 2, 26); c.show_text("B")
    c.restore()

def end_card(p, t):
    if t < T_END: return
    c = p.c
    k = back_out(seg(t, T_END, T_END + 0.3), 2.0)
    c.save(); c.translate(W / 2, 250); c.scale(k, k)
    for i, (text, col, size) in enumerate((("Follow to see", INK, 78), ("canvas 001 finish.", RED, 90))):
        font(c, size); e = c.text_extents(text)
        c.set_source_rgb(*col); c.move_to(-e.x_advance / 2, -10 + i * 112); c.show_text(text)
    c.restore()


# ---------------- the frame ----------------
def make_bg():
    rng = np.random.default_rng(5)
    img = np.zeros((H, W, 3), np.float32)
    img[:] = np.array(BG) * 255
    img[GROUND:] = np.array(FLOOR) * 255
    n = rng.normal(0, 3.2, (H, W, 1)).astype(np.float32)
    from PIL import Image as _I
    big = rng.normal(0, 1, (H // 60 + 2, W // 60 + 2)).astype(np.float32)
    big = np.array(_I.fromarray(big, mode="F").resize((W, H), _I.BICUBIC))[:, :, None] * 2.2
    img = np.clip(img + n + big, 0, 255).astype(np.uint8)
    bgra = np.dstack([img[:, :, 2], img[:, :, 1], img[:, :, 0], np.full((H, W), 255, np.uint8)]).copy()
    return cairo.ImageSurface.create_for_data(bgra, cairo.FORMAT_ARGB32, W, H, W * 4), bgra

BG_SURF, _BG_KEEP = make_bg()

def frame(t):
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    c = cairo.Context(surf)
    c.set_source_surface(BG_SURF, 0, 0); c.paint()
    p = Pen(c, int(t * 10))          # the line boils at 10 fps
    p.line("ground", [(-20, GROUND), (300, GROUND + 2), (700, GROUND - 2), (1100, GROUND + 1)], 7)
    draw_easel(p, t)
    x = robot_x(t)
    draw_crab(p, t)
    draw_robot(p, t, x)
    paw = draw_cat(p, t)
    draw_takeda(p, t)
    # the tomato: in the paw, then in the air
    if T_CAT_IN < t < T_THROW and paw:
        draw_tomato(p, paw[0], paw[1] - 30, 0)
    elif T_THROW <= t < T_HIT:
        k = seg(t, T_THROW, T_HIT)
        p0 = CAT_RELEASE
        p1 = (ROBOT_X0 + RS * 18, GROUND - RS * 500)
        xx = lerp(p0[0], p1[0], k); yy = lerp(p0[1], p1[1], k) - 90 * math.sin(math.pi * k)
        draw_tomato(p, xx, yy, -k * 7.0)
    # the robot's words
    for t0, t1, lines in BUBBLES:
        if t0 <= t < t1:
            hx = x
            bubble(p, "rb", hx + 30, GROUND - 729 * RS, lines, t, t0, (hx + 83 * RS, GROUND - 642 * RS))
    if T_KUZ - 0.05 <= t < min(L5 - 0.1, T_KUZ + LEN["KUZ"] + 0.6):
        bubble(p, "kb", 0, 1380, [("Hey!", INK, 62, 0), ("Give him", INK, 58, 0), ("a chance.", INK, 58, 0)], t, T_KUZ - 0.05, (538, 1228), left=572)
    if K2 - 0.05 <= t < min(L7 - 0.05, K2 + LEN["K2"] + 0.5):
        bubble(p, "kb2", 0, 1392, [("Is that a real", INK, 50, 0), ("canvas?", INK, 50, 0), ("Real paint?", INK, 50, 0)], t, K2 - 0.05, (538, 1228), left=556)
    crab_bubble(p, t)
    end_card(p, t)
    surf.flush()
    return surf


# ---------------- sound ----------------
SR = 24000
def sfx_track():
    n = int(DUR * SR); tr = np.zeros(n, np.float32)
    rng = np.random.default_rng(1)
    def put(t0, a, gain=1.0):
        i = int(t0 * SR); a = a[: max(0, n - i)]; tr[i:i + len(a)] += gain * a
    def tone(f0, f1, dur, shape=2.0):
        tt = np.arange(int(dur * SR)) / SR
        f = np.linspace(f0, f1, len(tt)); ph = 2 * np.pi * np.cumsum(f) / SR
        env = (1 - tt / dur) ** shape
        return np.sin(ph) * env
    def noise(dur, lp=0.2):
        a = rng.normal(0, 1, int(dur * SR)).astype(np.float32)
        out = np.zeros_like(a); y = 0.0
        for i, v in enumerate(a):
            y += lp * (v - y); out[i] = y
        return out / (np.abs(out).max() + 1e-6)
    # wheels rolling in: a soft rumble and two squeaks
    r = noise(1.4, 0.03); r *= np.sin(np.linspace(0, np.pi, len(r)))
    put(0.0, r, 0.12)
    put(0.55, tone(1900, 2400, 0.07, 1.0), 0.06); put(1.25, tone(2100, 1700, 0.08, 1.0), 0.06)
    put(1.4, tone(120, 70, 0.15), 0.25)                     # settles
    # whoosh and splat
    w = noise(0.45, 0.35); w *= np.linspace(0.1, 1, len(w)) ** 2
    put(T_THROW, w, 0.22)
    s = noise(0.35, 0.12) * np.exp(-np.linspace(0, 9, int(0.35 * SR)))
    put(T_HIT, s, 0.75); put(T_HIT, tone(140, 60, 0.18), 0.6)
    # wipe: a short squeak of a hand on glass
    put(T_WIPE0 + 0.2, tone(1500, 1900, 0.18, 0.5) * 0.5, 0.05)
    # rolling to the easel, the dab
    r2 = noise(0.4, 0.03); r2 *= np.sin(np.linspace(0, np.pi, len(r2))); put(T_MOVE0, r2, 0.1)
    put(T_TOUCH, tone(700, 320, 0.09), 0.3)
    # the crab pops up
    put(T_CRAB + 0.2, tone(300, 900, 0.12, 1.0), 0.18)
    rr = noise(T_TAK_STOP - T_KUZ_IN, 0.04); rr *= np.linspace(1, 0.3, len(rr)); put(T_KUZ_IN, rr, 0.10)
    def bell(t0):
        tt = np.arange(int(0.35 * SR)) / SR
        b = (np.sin(2 * np.pi * 2650 * tt) + 0.6 * np.sin(2 * np.pi * 3720 * tt) + 0.3 * np.sin(2 * np.pi * 5300 * tt)) * np.exp(-tt * 11)
        put(t0, b / 1.9, 0.16)
    bell(T_KUZ_IN + 0.35); bell(T_KUZ_IN + 0.52)
    put(T_TAK_STOP, tone(160, 90, 0.12), 0.18)
    put(T_KUZ, tone(900, 600, 0.05), 0.08); put(K2, tone(900, 600, 0.05), 0.08)
    # bubbles pop
    for t0, _, _ in BUBBLES: put(t0, tone(900, 600, 0.05), 0.08)
    # the B falls: a slide whistle down, a plink
    put(T_BFALL, tone(1400, 500, 0.32, 0.6), 0.12)
    put(T_BFALL + 0.33, tone(1200, 1000, 0.08), 0.18); put(T_BFALL + 0.47, tone(1300, 1100, 0.05), 0.08)
    # the end card
    put(T_END, tone(660, 990, 0.1, 1.0), 0.12); put(T_END + 0.1, tone(990, 1320, 0.14, 1.5), 0.12)
    return tr

def voice_track():
    n = int(DUR * SR); tr = np.zeros(n, np.float32)
    for k, t0, g in (("L1", L1, 1), ("L2", L2, 1), ("L3", L3, 1), ("KUZ", T_KUZ, 1), ("L5", L5, 1), ("K2", K2, 1), ("L7", L7, 1), ("L6", L6, 1),
                     ("BOO", T_BOO, 0.9), ("OOO", T_OOO, 0.9)):
        a, sr = load(k); assert sr == SR
        i = int(t0 * SR); a = a[: n - i]; tr[i:i + len(a)] += g * a
    return tr


def main():
    if "--stills" in sys.argv:
        d = sys.argv[sys.argv.index("--stills") + 1]; os.makedirs(d, exist_ok=True)
        for s in sys.argv[sys.argv.index("--stills") + 2:]:
            frame(float(s)).write_to_png(os.path.join(d, f"t{float(s):05.2f}.png"))
        return
    out = sys.argv[1]
    base = out[:-4]
    v = voice_track(); fx = sfx_track()
    v = v / (np.abs(v).max() + 1e-6) * 0.85
    mix = v + fx
    mix = mix / max(1.0, np.abs(mix).max() / 0.95)
    sf.write(base + ".audio.wav", mix, SR)
    tmp = base + ".video.part.mp4"
    nf = int(DUR * FPS)
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "bgra", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "16",
           "-pix_fmt", "yuv420p", "-profile:v", "high", tmp]
    pr = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for f in range(nf):
        s = frame(f / FPS)
        pr.stdin.write(bytes(s.get_data()))
    pr.stdin.close()
    if pr.wait() != 0: sys.exit("ffmpeg failed")
    subprocess.check_call(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp, "-i", base + ".audio.wav",
                           "-map", "0:v", "-map", "1:a", "-c:v", "copy",
                           "-af", "loudnorm=I=-15:TP=-1.5:LRA=11,aresample=48000", "-c:a", "aac", "-b:a", "192k",
                           "-movflags", "+faststart", "-t", str(DUR), base + ".part.mp4"])
    os.replace(base + ".part.mp4", out); os.remove(tmp)
    print("ok", out)


if __name__ == "__main__":
    main()
