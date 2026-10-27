"""
Rings mode: a circle of radius R is placed along each skeleton every STEP.
RAMP changes the spacing along the stroke: 0 = even, >0 = dense at the start,
sparse at the end (<0 the other way). COIL = the same circles as one continuous
looping line (no pen lifts).
Reference implementation for Claude Code; uses glyphs.json skeletons.
"""
import math, json, os
from glyph_tool import G, sample

def resample(pts):
    """polyline -> (points, cumulative lengths)"""
    acc = [0.0]
    for a, b in zip(pts, pts[1:]):
        acc.append(acc[-1] + math.dist(a, b))
    return pts, acc

def point_at(pts, acc, s):
    s = max(0, min(acc[-1], s))
    lo, hi = 0, len(acc) - 1
    while hi - lo > 1:
        m = (lo + hi) // 2
        if acc[m] <= s: lo = m
        else: hi = m
    seg = acc[hi] - acc[lo] or 1e-9
    t = (s - acc[lo]) / seg
    (x0, y0), (x1, y1) = pts[lo], pts[hi]
    return x0 + (x1 - x0) * t, y0 + (y1 - y0) * t

def centres(stroke, step, ramp=0.0):
    pts = sample(stroke, step=2)
    if stroke["closed"]: pts = pts + [pts[0]]
    pts, acc = resample(pts); L = acc[-1]
    # spacing grows linearly from step*(1-ramp) to step*(1+ramp) along the stroke
    pos, s = [0.0], 0.0
    while True:
        f = s / L
        s += step * (1 - ramp + 2 * ramp * f)
        if s >= L: break
        pos.append(s)
    if not stroke["closed"]:
        # stretch so the last circle sits exactly on the end -> symmetric round ends
        if L - pos[-1] > 1e-9:
            pos.append(L)
        k = L / pos[-1]; pos = [p * k for p in pos]
    else:
        k = L / (pos[-1] + step * (1 + ramp)); pos = [p * k for p in pos]
    return [point_at(pts, acc, p) for p in pos]

def coil(cs, R, per_turn=48):
    """continuous loop: one full turn between consecutive centres"""
    out = []
    for i in range(len(cs) - 1):
        (x0, y0), (x1, y1) = cs[i], cs[i + 1]
        for j in range(per_turn):
            t = j / per_turn; th = 2 * math.pi * t + math.pi / 2
            cx, cy = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
            out.append((cx + R * math.cos(th), cy + R * math.sin(th)))
    xe, ye = cs[-1]
    out += [(xe + R * math.cos(2 * math.pi * j / per_turn + math.pi / 2),
             ye + R * math.sin(2 * math.pi * j / per_turn + math.pi / 2)) for j in range(per_turn + 1)]
    return out

def render(rows_spec, sx=100, R=0.17, gap=0.08, margin=30, lw=1.1):
    lh = (1 + 2 * R + 0.55) * sx
    blocks, maxw = [], 0
    for li, (text, step, ramp, mode, label) in enumerate(rows_spec):
        x = 0
        for ch in text:
            if ch == " ": x += 0.5; continue
            blocks.append((ch, x + R, li, step, ramp, mode)); x += G[ch]["width"] + 2 * R + gap
        maxw = max(maxw, x)
    W, H = maxw * sx + 2 * margin + 10, len(rows_spec) * lh + margin
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.0f} {H:.0f}" width="{W:.0f}" height="{H:.0f}">',
         '<rect width="100%" height="100%" fill="#fff"/>']
    for li, spec in enumerate(rows_spec):
        o.append(f'<text x="{margin}" y="{margin + li*lh + 14:.0f}" font-family="monospace" font-size="13" fill="#c55">{spec[4]}</text>')
    n_total = 0
    for ch, ox, li, step, ramp, mode in blocks:
        base = margin + 22 + li * lh + (1 + R) * sx
        T = lambda x, y: (margin + (ox + x) * sx, base - y * sx)
        for st in G[ch]["strokes"]:
            cs = centres(st, step, ramp); n_total += len(cs)
            if mode == "rings":
                for x, y in cs:
                    px, py = T(x, y)
                    o.append(f'<circle cx="{px:.2f}" cy="{py:.2f}" r="{R*sx:.2f}" fill="none" stroke="#000" stroke-width="{lw}"/>')
            else:
                pts = coil(cs, R)
                o.append('<polyline fill="none" stroke="#000" stroke-width="%s" points="%s"/>' %
                         (lw, " ".join("%.2f,%.2f" % T(x, y) for x, y in pts)))
    o.append("</svg>")
    return "\n".join(o)

if __name__ == "__main__":
    import cairosvg
    here = os.path.dirname(os.path.abspath(__file__))
    spec = [("AMOUR", 0.035, 0.0, "rings", "RINGS  STEP dense, RAMP 0"),
            ("AMOUR", 0.09, 0.0, "rings", "RINGS  STEP sparse, RAMP 0"),
            ("AMOUR", 0.06, 0.8, "rings", "RINGS  STEP mid, RAMP 0.8  (dense -> sparse along each stroke)"),
            ("AMOUR", 0.06, 0.0, "coil", "COIL   STEP mid  (one continuous line per stroke, no pen lifts)")]
    s = render(spec); open(f"{here}/rings_specimen.svg", "w").write(s)
    cairosvg.svg2png(bytestring=s.encode(), write_to=f"{here}/rings_specimen.png")
    s = render([("ABCDEFGHI", .05, 0, "rings", "STEP 0.05"), ("JKLMNOPQR", .05, 0, "rings", ""),
                ("STUVWXYZ", .05, 0, "rings", ""), ("0123456789", .05, 0, "rings", "")])
    open(f"{here}/rings_alphabet.svg", "w").write(s)
    cairosvg.svg2png(bytestring=s.encode(), write_to=f"{here}/rings_alphabet.png")
