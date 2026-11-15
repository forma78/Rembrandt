"""Stop-motion reel from the machine camera's frames (HOLO-Claude/eyes/<date>/).

Each frame is turned so the brush comes from the top, cropped to 9:16,
and shown for ~0.15 s. Bottom left: the robot's head on its post, and a
timecode that runs through the film's own time (0:00 -> 2:10).

usage: python3 make_reel.py FRAMES_DIR OUT.mp4 [--stills DIR]
"""
import glob, math, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont, ImageEnhance

W, H, FPS = 1080, 1920, 30
DUR = 10.0                      # seconds of reel
NF = int(DUR * FPS)            # 300 output frames
FILM_SECONDS_PER_PHOTO = 2.0    # one frame was cut every 2 s of the film

INK = (17, 17, 17)
FACE = (246, 242, 232)
RED = (229, 40, 30)
GREY = (154, 154, 150)
GREY_D = (124, 124, 120)

FONT = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"
if not os.path.exists(FONT):
    FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"


# ---------- the photo: turn, crop, grade ----------
def prep(path):
    im = Image.open(path).convert("RGB")
    im = im.rotate(-90, expand=True)            # brush from the left -> brush from the top
    w, h = im.size                              # 1080 x 1620
    cw = round(h * 9 / 16)                      # 911
    x0 = (w - cw) // 2
    im = im.crop((x0, 0, x0 + cw, h)).resize((W, H), Image.LANCZOS)
    im = ImageEnhance.Contrast(im).enhance(1.08)
    return im


# ---------- the robot's head, from artist.svg ----------
SS = 4  # supersample


def head_sprite(eye_dx=0, eye_dy=0, blink=False, oh=False, cam_deg=0):
    """The head as in artist.svg (x 236..564, y 120..390), plus the camera.
    Returns an RGBA sprite at 1x of the svg's units, pivot at (400, 390)."""
    # svg window: x 200..720, y 20..400  (room for the camera)
    ox, oy, sw, sh = 200, 20, 520, 380
    img = Image.new("RGBA", (sw * SS, sh * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    def R(x, y, w, h, r, fill):
        d.rounded_rectangle([(x - ox) * SS, (y - oy) * SS, (x - ox + w) * SS, (y - oy + h) * SS],
                            radius=r * SS, fill=fill)

    def C(cx, cy, r, fill):
        d.ellipse([(cx - ox - r) * SS, (cy - oy - r) * SS, (cx - ox + r) * SS, (cy - oy + r) * SS], fill=fill)

    # the camera on its arm, looking at the canvas
    a = math.radians(cam_deg)
    bx, by = 520, 124
    ex, ey = 574, 78
    # rotate the arm's end round its base
    vx, vy = ex - bx, ey - by
    ex2 = bx + vx * math.cos(a) - vy * math.sin(a)
    ey2 = by + vx * math.sin(a) + vy * math.cos(a)
    d.line([((bx - ox) * SS, (by - oy) * SS), ((ex2 - ox) * SS, (ey2 - oy) * SS)], fill=INK, width=14 * SS)
    C(bx, by, 7, INK); C(ex2, ey2, 7, INK)
    cam = Image.new("RGBA", (130 * SS, 90 * SS), (0, 0, 0, 0))
    cd = ImageDraw.Draw(cam)
    cd.rounded_rectangle([14 * SS, 20 * SS, 106 * SS, 70 * SS], radius=12 * SS, fill=INK)
    cd.ellipse([(108 - 17) * SS, (45 - 17) * SS, (108 + 17) * SS, (45 + 17) * SS], fill=(255, 255, 255))
    cd.ellipse([(110 - 7) * SS, (45 - 7) * SS, (110 + 7) * SS, (45 + 7) * SS], fill=RED)
    cam = cam.rotate(-(24 + cam_deg), resample=Image.BICUBIC, expand=True)
    # camera body centre sits beyond the arm's end
    ux, uy = (ex2 - bx), (ey2 - by)
    n = math.hypot(ux, uy); ux, uy = ux / n, uy / n
    ccx, ccy = ex2 + ux * 30, ey2 + uy * 30
    img.alpha_composite(cam, (int((ccx - ox) * SS - cam.width / 2), int((ccy - oy) * SS - cam.height / 2)))

    # the head
    R(236, 120, 328, 270, 36, INK)
    R(262, 146, 276, 218, 18, FACE)
    # the eyes: two strokes
    if blink:
        R(328 + eye_dx, 228 + eye_dy, 24, 12, 6, INK)
        R(448 + eye_dx, 228 + eye_dy, 24, 12, 6, INK)
    else:
        R(330 + eye_dx, 196 + eye_dy, 20, 74, 10, INK)
        R(450 + eye_dx, 196 + eye_dy, 20, 74, 10, INK)
    # the mouth: one puddle
    C(400 + eye_dx * 0.4, 312, 22 if oh else 14, RED)

    img = img.resize((sw, sh), Image.LANCZOS)
    return img, (400 - ox, 390 - oy)   # sprite, pivot (neck) in sprite px


# ---------- the timecode ----------
def fmt(t):
    m = int(t // 60); s = t - m * 60
    ms = int(round((s - int(s)) * 1000))
    si = int(s)
    if ms == 1000: ms = 0; si += 1
    return f"{m:02d}:{si:02d}.{ms:03d}"


class Timecode:
    def __init__(self, size=46):
        self.font = ImageFont.truetype(FONT, size)
        # fixed cells, so the digits do not jump
        self.cell = max(self.font.getbbox(c)[2] for c in "0123456789") + 2
        self.sep = max(self.font.getbbox(c)[2] for c in ":.") + 4
        self.asc = self.font.getbbox("0")

    def draw(self, d, x, y, text, fill):
        for ch in text:
            w = self.sep if ch in ":." else self.cell
            bb = self.font.getbbox(ch)
            d.text((x + (w - bb[2]) / 2, y), ch, font=self.font, fill=fill)
            x += w
        return x

    def width(self, text):
        return sum(self.sep if ch in ":." else self.cell for ch in text)


# ---------- the pose, a step per photo (stop-motion) ----------
def pose(i, n):
    # a small sway, as a puppet moved by hand between shots
    sway = [0, 2, 3, 2, 0, -2, -3, -2]
    tilt = sway[i % len(sway)]
    bob = [0, -6, -10, -6][i % 4]
    # the eyes follow the brush: up and to the right, a little drift
    eye_dx = [6, 8, 10, 8][(i // 2) % 4]
    eye_dy = [-8, -10, -8, -6][(i // 3) % 4]
    blink = i in (9, 10, 28, 41, 57)
    # past the canvas's edge: "oh"
    edge = i in (47, 48, 49, 63, 64)
    cam = [0, -4, -6, -4, 0, 3][i % 6]
    return tilt, bob, eye_dx, eye_dy, blink, edge, cam


def compose(base, i, n, t_film, tc, scale=0.68):
    tilt, bob, edx, edy, blink, edge, cam = pose(i, n)
    frame = base.copy().convert("RGBA")
    d = ImageDraw.Draw(frame)

    neck_x = 60 + int(400 * scale) - int(236 * scale)   # head's left edge at x ~60
    neck_y = 1530 + bob                                  # bottom of the head

    # the post, from the neck down off the frame
    pw = int(32 * scale)
    d.rectangle([neck_x - pw // 2, neck_y - 4, neck_x + pw // 2, H], fill=GREY)
    d.rectangle([neck_x - int(4 * scale), neck_y - 4, neck_x + int(4 * scale), H], fill=GREY_D)

    spr, (px, py) = head_sprite(edx, edy, blink, edge, cam)
    spr = spr.resize((int(spr.width * scale), int(spr.height * scale)), Image.LANCZOS)
    px, py = px * scale, py * scale
    # rotate round the neck: pad so the pivot is the centre
    pad_w = int(2 * max(px, spr.width - px)) + 4
    pad_h = int(2 * max(py, spr.height - py)) + 4
    pad = Image.new("RGBA", (pad_w, pad_h), (0, 0, 0, 0))
    pad.alpha_composite(spr, (int(pad_w / 2 - px), int(pad_h / 2 - py)))
    pad = pad.rotate(tilt, resample=Image.BICUBIC)
    frame.alpha_composite(pad, (int(neck_x - pad_w / 2), int(neck_y - pad_h / 2)))

    # the timecode plate, beside the head
    text = fmt(t_film)
    tw = tc.width(text)
    dot = 16
    padx, pady = 26, 18
    th = tc.asc[3] - tc.asc[1]
    x0 = neck_x + int(190 * scale) + 22
    plate_h = th + 2 * pady
    y0 = int(1530 - 135 * scale - plate_h / 2)   # centred on the head
    plate_w = padx + dot + 16 + tw + padx
    d.rounded_rectangle([x0, y0, x0 + plate_w, y0 + plate_h], radius=14, fill=INK)
    cy = y0 + plate_h / 2
    d.ellipse([x0 + padx, cy - dot / 2, x0 + padx + dot, cy + dot / 2], fill=RED)
    tc.draw(d, x0 + padx + dot + 16, y0 + pady - tc.asc[1], text, FACE)
    return frame.convert("RGB")


def main():
    src, out = sys.argv[1], sys.argv[2]
    stills = None
    if "--stills" in sys.argv:
        stills = sys.argv[sys.argv.index("--stills") + 1]
    files = sorted(glob.glob(os.path.join(src, "frame-*.jpg")))
    n = len(files)
    tc = Timecode(46)
    film_total = n * FILM_SECONDS_PER_PHOTO

    if stills:
        os.makedirs(stills, exist_ok=True)
        for i in (3, 9, 30, 48, 55):
            f = int(i * NF / n) + 1
            t = f / NF * film_total
            compose(prep(files[i]), i, n, t, tc).save(os.path.join(stills, f"still-{i:03d}.jpg"), quality=92)
        return

    tmp = out[:-4] + ".part.mp4"
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-c:v", "libx264", "-preset", "slow", "-crf", "15", "-pix_fmt", "yuv420p",
           "-profile:v", "high", "-movflags", "+faststart", "-r", str(FPS), tmp]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    cur_i, base = -1, None
    for f in range(NF):
        i = min(n - 1, int(f * n / NF))
        if i != cur_i:
            base = prep(files[i]); cur_i = i
        t = f / NF * film_total
        p.stdin.write(compose(base, i, n, t, tc).tobytes())
    p.stdin.close()
    if p.wait() == 0:
        os.replace(tmp, out)
        print("ok", out)
    else:
        sys.exit("ffmpeg failed")


if __name__ == "__main__":
    main()
