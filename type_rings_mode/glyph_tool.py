"""
Stroke letters v2 for the REMBRANDT Type tool — between the Meta sheet (round pills)
and the 1970s inline-stripe book faces (cut ends, continuous paths).

Same skeleton idea as v1, but:
  * a letter is drawn with as few CONTINUOUS paths as possible (L, U, Z, S, E, V, W...),
    so rows turn corners instead of overlapping pills;
  * bends are filleted with circular arcs (radius per corner, 0 = sharp);
  * ENDS is one switch for the whole alphabet:
      "cut"   — flat ends; ends that run into baseline/capline are cut along that line
      "round" — pill ends (v1 look)
  * draw order = list order, later strokes paint over earlier ones.

Units: inner box, y=0 skeleton baseline, y=1 skeleton capline, y up.
Placement: h = H - 2w, w = ROWS * ROW_TO_ROW, (x,y) -> (left + w + x*h, base + w + y*h).
"""
import json, math, os
from shapely.geometry import LineString, Polygon, box
from shapely.ops import unary_union

# ------------------------------------------------------------ path builder (fillets)
def path(pts, r=0.0, closed=False):
    """pts: [(x,y) or (x,y,radius)], r: default corner radius. Returns stroke dict."""
    P = [(p[0], p[1], p[2] if len(p) > 2 else r) for p in pts]
    n = len(P)
    def corner(i):
        x, y, rad = P[i]
        a, b = P[i - 1], P[(i + 1) % n]
        ux, uy = x - a[0], y - a[1]; lu = math.hypot(ux, uy); ux, uy = ux / lu, uy / lu
        vx, vy = b[0] - x, b[1] - y; lv = math.hypot(vx, vy); vx, vy = vx / lv, vy / lv
        phi = math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)
        if rad <= 0 or abs(phi) < 1e-6:
            return [("L", (x, y))]
        t = rad * math.tan(abs(phi) / 2)
        t1 = (x - ux * t, y - uy * t)
        s = 1 if phi > 0 else -1
        c = (t1[0] - uy * rad * s, t1[1] + ux * rad * s)
        a0 = math.degrees(math.atan2(t1[1] - c[1], t1[0] - c[0]))
        return [("L", t1), ("A", c, rad, a0, a0 + math.degrees(phi))]
    seq = []
    idx = range(n) if closed else range(1, n - 1)
    for i in idx:
        seq += corner(i)
    if closed:
        # start at the first tangent point of corner 0 / mid of edge n-1 -> 0
        start = ((P[-1][0] + P[0][0]) / 2, (P[-1][1] + P[0][1]) / 2)
        seq.append(("L", start))
    else:
        start = (P[0][0], P[0][1]); seq.append(("L", (P[-1][0], P[-1][1])))
    nodes = []
    for s in seq:
        if s[0] == "L":
            nodes.append({"line": [round(s[1][0], 4), round(s[1][1], 4)]})
        else:
            _, c, rad, a0, a1 = s
            nodes.append({"arc": {"c": [round(c[0], 4), round(c[1], 4)], "r": round(rad, 4),
                                  "from": round(a0, 3), "to": round(a1, 3)}})
    return {"start": [round(start[0], 4), round(start[1], 4)], "nodes": nodes, "closed": closed}

def ln(x0, y0, x1, y1): return path([(x0, y0), (x1, y1)])
def rrect(x0, y0, x1, y1, r): return path([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], r, closed=True)

# ------------------------------------------------------------ glyphs
G = {}
def g(ch, width, *strokes): G[ch] = {"width": width, "strokes": list(strokes)}

R = 0.30   # big bends (C, U, O, bowls)
r = 0.22   # small bowls (B top, P, R)

g("A", .78, ln(.099, .30, .681, .30), path([(0, 0), (.33, 1), (.45, 1), (.78, 0)]))
g("B", .60, path([(0, 1), (.50, 1), (.50, .52), (0, .52)], r),
            path([(0, .52), (.60, .52), (.60, 0), (0, 0)], .24), ln(0, 0, 0, 1))
g("C", .62, path([(.62, 1), (0, 1), (0, 0), (.62, 0)], R))
g("D", .64, path([(0, 1), (.64, 1), (.64, 0), (0, 0)], R), ln(0, 0, 0, 1))
g("E", .56, ln(0, .5, .46, .5), path([(.56, 1), (0, 1), (0, 0), (.56, 0)]))
g("F", .56, ln(0, .5, .46, .5), path([(.56, 1), (0, 1), (0, 0)]))
g("G", .64, path([(.64, 1), (0, 1, R), (0, 0, R), (.64, 0, .2), (.64, .46), (.34, .46)]))
g("H", .64, ln(0, .5, .64, .5), ln(0, 0, 0, 1), ln(.64, 0, .64, 1))
g("I", 0, ln(0, 0, 0, 1))
g("J", .50, path([(.50, 1), (.50, 0), (0, 0)], .26))
g("K", .60, path([(.60, 1), (.02, .46), (.60, 0)]), ln(0, 0, 0, 1))
g("L", .52, path([(0, 1), (0, 0), (.52, 0)]))
g("M", .84, path([(0, 1), (.42, .18), (.84, 1)]), ln(0, 0, 0, 1), ln(.84, 0, .84, 1))
g("N", .64, ln(0, 1, .64, 0), ln(0, 0, 0, 1), ln(.64, 0, .64, 1))
g("O", .66, rrect(0, 0, .66, 1, .33))
g("P", .58, path([(0, 1), (.58, 1), (.58, .45), (0, .45)], .24), ln(0, 0, 0, 1))
g("Q", .70, rrect(0, 0, .66, 1, .33), ln(.40, .30, .70, 0))
g("R", .62, ln(.30, .45, .62, 0), path([(0, 1), (.58, 1), (.58, .45), (0, .45)], .24), ln(0, 0, 0, 1))
g("S", .60, path([(.60, .80), (.60, 1, .20), (0, 1, .25), (0, .5, .25), (.60, .5, .25),
                  (.60, 0, .25), (0, 0, .20), (0, .20)]))
g("T", .66, ln(.33, 0, .33, 1), ln(0, 1, .66, 1))
g("U", .64, path([(0, 1), (0, 0), (.64, 0), (.64, 1)], .32))
g("V", .72, path([(0, 1), (.36, 0), (.72, 1)]))
g("W", 1.0, path([(0, 1), (.25, 0), (.5, 1), (.75, 0), (1, 1)]))
g("X", .70, ln(0, 1, .70, 0), ln(.70, 1, 0, 0))
g("Y", .70, ln(.35, .45, .35, 0), path([(0, 1), (.35, .45), (.70, 1)]))
g("Z", .62, path([(0, 1), (.62, 1), (0, 0), (.62, 0)]))

g("0", .60, rrect(0, 0, .60, 1, .30))
g("1", .16, path([(0, .80), (.16, 1), (.16, 0)]))
g("2", .60, path([(0, .70), (0, 1, R), (.60, 1, R), (.60, .55, .2), (0, 0), (.60, 0)]))
g("3", .60, path([(0, 1), (.58, 1), (.20, .60), (.60, .60, R), (.60, 0, R), (0, 0)]))
g("4", .66, path([(.45, 0), (.45, 1), (0, .32), (.66, .32)]))
g("5", .60, path([(.60, 1), (0, 1), (0, .58), (.60, .58, .25), (.60, 0, .25), (0, 0)]))
g("6", .60, path([(.60, 1), (0, 1, R), (0, 0, R), (.60, 0, .25), (.60, .58, .25), (0, .58)]))
g("7", .60, path([(0, 1), (.60, 1), (.15, 0)]))
g("8", .60, rrect(.06, .52, .54, 1, .22), rrect(0, 0, .60, .52, .26))
g("9", .60, path([(0, 0), (.60, 0, R), (.60, 1, R), (0, 1, .25), (0, .42, .25), (.60, .42)]))

# ------------------------------------------------------------ geometry
def pol(cx, cy, rr, a): return cx + rr * math.cos(math.radians(a)), cy + rr * math.sin(math.radians(a))

def sample(st, step=3):
    pts = [tuple(st["start"])]
    for n in st["nodes"]:
        if "line" in n:
            p = tuple(n["line"])
            if math.dist(p, pts[-1]) > 1e-6: pts.append(p)
        else:
            a = n["arc"]; k = max(2, int(abs(a["to"] - a["from"]) / step))
            for i in range(1, k + 1):
                pts.append(pol(*a["c"], a["r"], a["from"] + (a["to"] - a["from"]) * i / k))
    return pts

def extend_ends(pts, w):
    """cut mode: ends that run into baseline/capline get extended, then clipped."""
    pts = list(pts)
    for end in (0, -1):
        p, q = (pts[0], pts[1]) if end == 0 else (pts[-1], pts[-2])
        d = (p[0] - q[0], p[1] - q[1]); L = math.hypot(*d)
        if (abs(p[1]) < 1e-3 or abs(p[1] - 1) < 1e-3) and abs(d[1]) / L > 0.2:
            e = (p[0] + d[0] / L * 4 * w, p[1] + d[1] / L * 4 * w)
            if end == 0: pts.insert(0, e)
            else: pts.append(e)
    return pts

def stroke_geom(st, w, rows, ends, width=10, pitch=None):
    """returns (body polygon, list of row lines) in inner units."""
    pts = sample(st)
    band = box(-w, -w, width + w, 1 + w)          # letter box: everything is clipped to it
    pitch = pitch or w / (rows + 0.5)
    if st["closed"]:
        ring = LineString(pts + [pts[0]])
        body = ring.buffer(w, quad_segs=24)
        lines = []
        for k in range(1, rows + 1):
            b = ring.buffer(k * pitch, quad_segs=24)
            lines += [b.exterior] + list(b.interiors)
        return body, lines
    if ends == "round":
        ls = LineString(pts)
        body = ls.buffer(w, quad_segs=24)
        lines = []
        for k in range(1, rows + 1):
            b = ls.buffer(k * pitch, quad_segs=24)
            lines += [b.exterior] + list(b.interiors)
        return body, lines
    ls = LineString(extend_ends(pts, w))
    body = ls.buffer(w, cap_style="flat", join_style="mitre", mitre_limit=2.2).intersection(band)
    clip = body.buffer(1e-6)
    lines = []
    for k in range(1, rows + 1):
        for s in (1, -1):
            lines.append(ls.offset_curve(s * k * pitch, quad_segs=24, join_style="round").intersection(clip))
    return body, lines

# ------------------------------------------------------------ svg helpers
def geom_to_d(geom, T):
    out = []
    def ring(coords, close):
        c = list(coords)
        if not c: return
        out.append("M" + " L".join(f"{T(x, y)[0]:.2f},{T(x, y)[1]:.2f}" for x, y in c) + (" Z" if close else ""))
    def walk(gm):
        t = gm.geom_type
        if t == "Polygon":
            ring(gm.exterior.coords, True); [ring(i.coords, True) for i in gm.interiors]
        elif t in ("LineString", "LinearRing"):
            ring(gm.coords, t == "LinearRing")
        elif hasattr(gm, "geoms"):
            [walk(x) for x in gm.geoms]
    walk(geom)
    return " ".join(out)

def svg_true_path(st, T, sx):
    x, y = st["start"]; d = [f"M{T(x, y)[0]:.2f},{T(x, y)[1]:.2f}"]
    for n in st["nodes"]:
        if "line" in n:
            px, py = T(*n["line"]); d.append(f"L{px:.2f},{py:.2f}")
        else:
            a = n["arc"]; a0, a1 = a["from"], a["to"]
            ex, ey = T(*pol(*a["c"], a["r"], a1))
            d.append(f"A{a['r']*sx:.2f},{a['r']*sx:.2f} 0 {1 if abs(a1-a0) > 180 else 0} {0 if a1 > a0 else 1} {ex:.2f},{ey:.2f}")
    if st["closed"]: d.append("Z")
    return " ".join(d)

def render(lines_of_text, ends, look, sx=110, w=0.13, rows=4, gap=0.10, margin=40, pitch=None):
    """look: 'book' = black body + white stripes, 'machine' = black rows on white (knockout)."""
    lh = (1 + 2 * w + 0.4) * sx
    items, maxw = [], 0
    for li, text in enumerate(lines_of_text):
        x = 0
        for ch in text:
            if ch == " ": x += 0.5; continue
            items.append((ch, x + w, li)); x += G[ch]["width"] + 2 * w + gap
        maxw = max(maxw, x)
    Wd, Ht = maxw * sx + 2 * margin, len(lines_of_text) * lh + margin
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {Wd:.0f} {Ht:.0f}" width="{Wd:.0f}" height="{Ht:.0f}">',
         '<rect width="100%" height="100%" fill="#fff"/>']
    body_fill, line_col = ("#111", "#fff") if look == "book" else ("#fff", "#111")
    for ch, ox, li in items:
        base = margin + li * lh + (1 + w) * sx
        T = lambda x, y, ox=ox, base=base: (margin + (ox + x) * sx, base - y * sx)
        for st in G[ch]["strokes"]:
            body, lines = stroke_geom(st, w, rows, ends, G[ch]["width"], pitch)
            o.append(f'<path d="{geom_to_d(body, T)}" fill="{body_fill}" fill-rule="evenodd"'
                     + (' stroke="#111" stroke-width="0.9"' if look == "machine" else "") + "/>")
            for ln_ in lines:
                o.append(f'<path d="{geom_to_d(ln_, T)}" fill="none" stroke="{line_col}" stroke-width="1"/>')
    o.append("</svg>")
    return "\n".join(o)

def glyph_svg(ch, sx=200, w=0.13):
    gl = G[ch]; pad = w * sx + 10
    Wd, Ht = gl["width"] * sx + 2 * pad, sx + 2 * pad
    T = lambda x, y: (pad + x * sx, pad + sx - y * sx)
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {Wd:.1f} {Ht:.1f}" width="{Wd:.0f}" height="{Ht:.0f}">',
         '<rect width="100%" height="100%" fill="#fff"/>', '<g id="skeleton">']
    for i, st in enumerate(gl["strokes"], 1):
        o.append(f'<path id="stroke{i}" d="{svg_true_path(st, T, sx)}" fill="none" stroke="#000" stroke-width="2" stroke-linejoin="round"/>')
    o += ["</g>", '<g id="cut-preview" opacity="0.25">']
    for st in gl["strokes"]:
        body, _ = stroke_geom(st, w, 4, "cut", gl["width"])
        o.append(f'<path d="{geom_to_d(body, T)}" fill="#000"/>')
    o += ["</g>", "</svg>"]
    return "\n".join(o)

if __name__ == "__main__":
    import cairosvg
    here = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(f"{here}/svg", exist_ok=True)
    json.dump({"version": 2,
               "units": "inner box: y=0 skeleton baseline, y=1 skeleton capline, y up",
               "placement": "h = H - 2w; (x,y) -> (left + w + x*h, base + w + y*h); w = ROWS*ROW_TO_ROW",
               "arc": "degrees; to > from = CCW, to < from = CW; starts at current point",
               "ends": "cut: flat; ends meeting baseline/capline are cut along that line. round: pill ends",
               "order": "list order = draw order, later strokes over earlier",
               "glyphs": G}, open(f"{here}/glyphs.json", "w"), indent=1)
    for ch in G:
        open(f"{here}/svg/{ch}.svg", "w").write(glyph_svg(ch))
    alpha = ["ABCDEFGHI", "JKLMNOPQR", "STUVWXYZ", "0123456789"]
    BOOK = dict(rows=3, pitch=0.13 * 0.17); MACH = dict(rows=7)
    jobs = [("specimen_cut_book", alpha, "cut", "book", BOOK), ("specimen_cut_machine", alpha, "cut", "machine", MACH),
            ("specimen_round_machine", alpha, "round", "machine", MACH),
            ("words_cut_book", ["AMOUR", "BAUHAUS", "LOVE 2026"], "cut", "book", BOOK)]
    for name, txt, ends, look, kw in jobs:
        s = render(txt, ends, look, **kw); open(f"{here}/{name}.svg", "w").write(s)
        cairosvg.svg2png(bytestring=s.encode(), write_to=f"{here}/{name}.png")
    print(len(G), "glyphs")
