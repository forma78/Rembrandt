"""Stop-motion reel v2: the whole robot from artist.svg, and what it says in
a speech bubble (English subtitles) with its voice under it.

usage: python3 make_reel2.py FRAMES_DIR OUT.mp4 CUES.json VOICE_DIR [--stills DIR]
CUES.json: ["text", ...]; VOICE_DIR/cue<i>.wav for each.
"""
import glob, json, math, os, subprocess, sys
import numpy as np, soundfile as sf
from PIL import Image, ImageDraw, ImageFont, ImageEnhance

W, H, FPS = 1080, 1920, 30
DUR = 10.0
NF = int(DUR * FPS)

INK = (17, 17, 17)
FACE = (246, 242, 232)
RED = (229, 40, 30)
GREY = (154, 154, 150)
GREY_D = (124, 124, 120)

HERE = os.path.dirname(os.path.abspath(__file__))
POPPINS = os.environ.get("POPPINS", "/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf")

# when each line starts (s): set against what the frames show
CUE_AT = [0.25, 2.6, 4.75, 7.7]   # the last on the drag of one leg (photo 50 -> 7.7 s)


# ---------- the photo ----------
def prep(path):
    im = Image.open(path).convert("RGB").rotate(-90, expand=True)
    w, h = im.size
    cw = round(h * 9 / 16)
    x0 = (w - cw) // 2
    im = im.crop((x0, 0, x0 + cw, h)).resize((W, H), Image.LANCZOS)
    return ImageEnhance.Contrast(im).enhance(1.08)


# ---------- the robot, in artist.svg's units ----------
SS = 3                     # supersample
S = 0.62                   # svg unit -> output px
OX, OY, SW, SH = 150, 20, 640, 1040     # the svg window drawn


def rot(p, c, deg):
    a = math.radians(deg)
    dx, dy = p[0] - c[0], p[1] - c[1]
    return (c[0] + dx * math.cos(a) - dy * math.sin(a), c[1] + dx * math.sin(a) + dy * math.cos(a))


class Pen:
    def __init__(self):
        self.img = Image.new("RGBA", (int(SW * S * SS), int(SH * S * SS)), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.img)
        self.k = S * SS

    def P(self, x, y):
        return ((x - OX) * self.k, (y - OY) * self.k)

    def rect(self, x, y, w, h, r, fill):
        a = self.P(x, y); b = self.P(x + w, y + h)
        self.d.rounded_rectangle([a, b], radius=r * self.k, fill=fill)

    def circle(self, cx, cy, r, fill):
        a = self.P(cx - r, cy - r); b = self.P(cx + r, cy + r)
        self.d.ellipse([a, b], fill=fill)

    def ellipse(self, cx, cy, rx, ry, fill):
        a = self.P(cx - rx, cy - ry); b = self.P(cx + rx, cy + ry)
        self.d.ellipse([a, b], fill=fill)

    def line(self, pts, width, fill=INK):
        q = [self.P(*p) for p in pts]
        self.d.line(q, fill=fill, width=int(width * self.k), joint="curve")
        r = width / 2
        for p in pts:                       # round caps and joins
            self.circle(p[0], p[1], r, fill)

    def poly(self, pts, fill):
        self.d.polygon([self.P(*p) for p in pts], fill=fill)


def draw_head(pen, tilt, eye_dx, eye_dy, blink, mouth, cam_deg):
    """The head on its own layer, turned round the neck (400, 390)."""
    hp = Pen()
    # the camera on its arm
    base = (520, 124)
    end = rot((574, 78), base, cam_deg)
    hp.line([base, end], 14)
    ux, uy = end[0] - base[0], end[1] - base[1]
    n = math.hypot(ux, uy); ux, uy = ux / n, uy / n
    cc = (end[0] + ux * 30, end[1] + uy * 30)
    ang = 24 + cam_deg
    corners = [(-46, -25), (46, -25), (46, 25), (-46, 25)]
    hp.poly([rot((cc[0] + x, cc[1] + y), cc, ang) for x, y in corners], INK)
    lens = rot((cc[0] + 50, cc[1] + 1), cc, ang)
    hp.circle(*lens, 17, (255, 255, 255)); hp.circle(lens[0] + 2, lens[1], 7, RED)
    # the head
    hp.rect(236, 120, 328, 270, 36, INK)
    hp.rect(262, 146, 276, 218, 18, FACE)
    if blink:
        hp.rect(328 + eye_dx, 228 + eye_dy, 24, 12, 6, INK)
        hp.rect(448 + eye_dx, 228 + eye_dy, 24, 12, 6, INK)
    else:
        hp.rect(330 + eye_dx, 196 + eye_dy, 20, 74, 10, INK)
        hp.rect(450 + eye_dx, 196 + eye_dy, 20, 74, 10, INK)
    # the mouth: one puddle; open = taller
    rx, ry = mouth
    hp.ellipse(400 + eye_dx * 0.4, 312, rx, ry, RED)
    piv = hp.P(400, 390)
    layer = hp.img.rotate(tilt, resample=Image.BICUBIC, center=piv)
    pen.img.alpha_composite(layer)


def robot(p):
    pen = Pen()
    # the base and wheels
    pen.rect(240, 905, 320, 62, 22, INK)
    for cx in (300, 500):
        pen.circle(cx, 985, 42, INK); pen.circle(cx, 985, 15, GREY)
    # the post
    pen.rect(384, 380 + p["bob"], 32, 530 - p["bob"], 0, GREY)
    pen.rect(396, 380 + p["bob"], 8, 530 - p["bob"], 0, GREY_D)
    b = p["bob"] * 0.5
    # the left arm (viewer's left), the free hand
    sh = (322, 588 + b)
    el = rot((246, 700 + b), sh, p["l1"])
    ha = rot(rot((292, 806 + b), sh, p["l1"]), el, p["l2"])
    # the right arm, with the jar
    sh2 = (478, 588 + b)
    el2 = rot((572, 690 + b), sh2, p["r1"])
    ha2 = rot(rot((640, 640 + b), sh2, p["r1"]), el2, p["r2"])
    pen.rect(318, 560 + b, 164, 54, 20, INK)               # the shoulders
    pen.line([sh, el, ha], 28)
    pen.circle(*el, 20, GREY)
    # two fingers, turned with the forearm
    fa = math.degrees(math.atan2(ha[1] - el[1], ha[0] - el[0])) - math.degrees(math.atan2(806 - 700, 292 - 246))
    for (x0, y0), (x1, y1) in (((276, 800), (292, 834)), ((308, 796), (312, 832))):
        a = rot((ha[0] + x0 - 292, ha[1] + y0 - 806), ha, fa)
        c = rot((ha[0] + x1 - 292, ha[1] + y1 - 806), ha, fa)
        pen.line([a, c], 12)
    pen.line([sh2, el2, ha2], 28)
    pen.circle(*el2, 20, GREY)
    jx, jy = ha2[0] - 4, ha2[1] - 52
    pen.rect(jx, jy, 62, 72, 8, RED)
    pen.rect(jx - 6, jy - 14, 74, 20, 6, INK)
    draw_head(pen, p["tilt"], p["edx"], p["edy"], p["blink"], p["mouth"], p["cam"])
    img = pen.img.resize((int(SW * S), int(SH * S)), Image.LANCZOS)
    return img


def pose(i, mouth_open):
    sway = [0, 2, 3, 2, 0, -2, -3, -2]
    edge = i in (47, 48, 49, 63, 64)
    p = dict(
        tilt=sway[i % 8],
        bob=[0, -4, -8, -4][i % 4],
        edx=[6, 8, 10, 8][(i // 2) % 4],
        edy=[-8, -10, -8, -6][(i // 3) % 4],
        blink=i in (9, 10, 28, 41, 57),
        cam=[0, -4, -6, -4, 0, 3][i % 6],
        l1=[0, 4, 8, 4][(i // 2) % 4], l2=[0, -6, -10, -6][(i // 2) % 4],
        r1=[0, -4, -8, -4][i % 4], r2=[0, -6, -12, -6][i % 4],
    )
    if edge:                                # past the canvas: arm up, "oh"
        p.update(l1=45, l2=-195, blink=False)
    m = 0.0 if p["blink"] and mouth_open < 0.2 else mouth_open
    if edge and m < 0.3:
        p["mouth"] = (20, 22)
    else:
        p["mouth"] = (14 + 4 * m, 14 + 12 * m)
    p["roll"] = [0, 2, 4, 2, 0, -2, -4, -2][(i // 2) % 8]
    return p


# where the robot stands: left arm's edge at x 36, wheels' bottom at y 1585
def to_px(x, y):
    return 48 + (x - 226) * S, 1585 - (1027 - y) * S


# ---------- the speech bubble ----------
class Bubble:
    def __init__(self, size=48):
        self.font = ImageFont.truetype(POPPINS, size)
        self.lh = int(size * 1.22)

    def wrap(self, text, maxw):
        if "|" in text:
            return [l.strip() for l in text.split("|")]
        words = text.split()
        L = lambda ws: self.font.getlength(" ".join(ws))
        if L(words) <= maxw:
            return [" ".join(words)]
        best = None
        for nl in (2, 3):
            import itertools
            for cuts in itertools.combinations(range(1, len(words)), nl - 1):
                parts = [words[a:b] for a, b in zip((0,) + cuts, cuts + (len(words),))]
                m = max(L(x) for x in parts)
                if m <= maxw and (best is None or m < best[0]):
                    best = (m, [" ".join(x) for x in parts])
            if best:
                return best[1]
        return [" ".join(words)]

    def draw(self, frame, text, left, cy, maxw=540):
        lines = self.wrap(text, maxw)
        tw = max(self.font.getlength(l) for l in lines)
        padx, pady, bw = 40, 30, 6
        w = int(tw + 2 * padx)
        h = int(len(lines) * self.lh + 2 * pady)
        top = int(cy - h / 2)
        # draw at 3x for clean edges
        k = 3
        layer = Image.new("RGBA", ((w + 60) * k, (h + 20) * k), (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        x0 = 40 * k
        tail_y = h / 2 * k + 10 * k
        # the tail, pointing at the head
        d.polygon([(x0 + 6 * k, tail_y - 26 * k), (2 * k, tail_y + 4 * k), (x0 + 6 * k, tail_y + 22 * k)], fill=INK)
        d.rounded_rectangle([x0, 10 * k, x0 + w * k, 10 * k + h * k], radius=40 * k, fill=INK)
        d.polygon([(x0 + 14 * k, tail_y - 16 * k), (12 * k, tail_y + 3 * k), (x0 + 14 * k, tail_y + 13 * k)], fill=FACE)
        d.rounded_rectangle([x0 + bw * k, 10 * k + bw * k, x0 + (w - bw) * k, 10 * k + (h - bw) * k],
                            radius=(40 - bw) * k, fill=FACE)
        layer = layer.resize((w + 60, h + 20), Image.LANCZOS)
        frame.alpha_composite(layer, (int(left - 40), top - 10))
        dd = ImageDraw.Draw(frame)
        y = top + pady - 4
        for l in lines:
            lw = self.font.getlength(l)
            dd.text((left + (w - lw) / 2, y), l, font=self.font, fill=INK)
            y += self.lh


def main():
    src, out, cues_path, vdir = sys.argv[1:5]
    stills = sys.argv[sys.argv.index("--stills") + 1] if "--stills" in sys.argv else None
    files = sorted(glob.glob(os.path.join(src, "frame-*.jpg")))
    n = len(files)
    cues = json.load(open(cues_path))

    # the voice track
    sr = 24000
    track = np.zeros(int(DUR * sr), dtype=np.float32)
    for k, t0 in enumerate(CUE_AT):
        a, s = sf.read(os.path.join(vdir, f"cue{k}.wav"), dtype="float32")
        assert s == sr
        i0 = int(t0 * sr)
        a = a[: len(track) - i0]
        track[i0: i0 + len(a)] += a
    peak = np.abs(track).max()
    track = track / peak * 0.89
    wav = out[:-4] + ".voice.wav"
    sf.write(wav, track, sr)
    # mouth: loudness per output frame, held on twos (15 fps)
    env = []
    for f in range(NF):
        g = (f // 2) * 2
        a = track[int(g / FPS * sr): int((g + 2) / FPS * sr)]
        env.append(float(np.sqrt(np.mean(a ** 2))) if len(a) else 0.0)
    env = np.array(env); env = np.clip(env / (np.percentile(env[env > 0.01], 90) if (env > 0.01).any() else 1), 0, 1)

    bub = Bubble(48)
    head_px = to_px(564, 255)          # the head's right edge, its middle

    def frame_at(f, base, i):
        t = f / FPS
        p = pose(i, env[f])
        fr = base.copy().convert("RGBA")
        spr = robot(p)
        x, y = to_px(OX, OY)
        fr.alpha_composite(spr, (int(x + p["roll"]), int(y)))
        k = max([j for j, t0 in enumerate(CUE_AT) if t0 - 0.05 <= t] or [0])
        bub.draw(fr, cues[k], left=332 + p["roll"], cy=head_px[1] + 8)
        return fr.convert("RGB")

    if stills:
        os.makedirs(stills, exist_ok=True)
        for t in (0.5, 3.0, 5.5, 7.3, 8.4):
            f = int(t * FPS); i = min(n - 1, int(f * n / NF))
            frame_at(f, prep(files[i]), i).save(os.path.join(stills, f"v2-{t:.1f}.jpg"), quality=92)
        return

    tmp = out[:-4] + ".video.part.mp4"
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-c:v", "libx264", "-preset", "slow", "-crf", "15", "-pix_fmt", "yuv420p",
           "-profile:v", "high", "-r", str(FPS), tmp]
    pr = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    cur, base = -1, None
    for f in range(NF):
        i = min(n - 1, int(f * n / NF))
        if i != cur:
            base = prep(files[i]); cur = i
        pr.stdin.write(frame_at(f, base, i).tobytes())
    pr.stdin.close()
    if pr.wait() != 0:
        sys.exit("ffmpeg failed")
    silent = out[:-4] + "-silent.mp4"
    subprocess.check_call(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp, "-c:v", "copy",
                           "-movflags", "+faststart", silent + ".part.mp4"])
    os.replace(silent + ".part.mp4", silent)
    subprocess.check_call(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp, "-i", wav,
                           "-map", "0:v", "-map", "1:a", "-c:v", "copy",
                           "-af", "loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000",
                           "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
                           "-t", str(DUR), out[:-4] + ".part.mp4"])
    os.replace(out[:-4] + ".part.mp4", out)
    os.remove(tmp)
    print("ok", out, silent)


if __name__ == "__main__":
    main()
