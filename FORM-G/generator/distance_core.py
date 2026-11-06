import numpy as np
from scipy.ndimage import gaussian_filter
XYZ = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]], np.float32)
WHITE = XYZ.sum(axis=1)
# lightness, red-green, blue-yellow, built so that a neutral has no colour at all, whatever the blur: S-CIELAB's widths of blur, not its matrix (my simplification)
OPP = np.array([[0, 1, 0], [1 / WHITE[0], -1, 0], [0, 1, -1 / WHITE[2]]], np.float32)
M = OPP @ XYZ
Minv = np.linalg.inv(M)
KERN = [[(0.05, 1.00327), (0.225, 0.11442), (7.0, -0.11769)], [(0.0685, 0.61673), (0.826, 0.38328)], [(0.0920, 0.56789), (0.6451, 0.43212)]]
PPM = 2
def at_distance(lin, ppm, dist_m):
    ppd = dist_m * 1000 * np.tan(np.radians(1)) * ppm
    opp = lin @ M.T
    out = np.zeros_like(opp)
    for c in range(3):
        for s, w in KERN[c]:
            sig = s * ppd
            if sig > 200:
                out[..., c] += w * opp[..., c].mean()
            else:
                out[..., c] += w * gaussian_filter(opp[..., c], sig, mode='nearest')
    return np.clip(out @ Minv.T, 0, 1)
def to_lab(lin):
    X = lin @ np.array([0.4124, 0.3576, 0.1805], np.float32) / 0.9505
    Y = lin @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    Z = lin @ np.array([0.0193, 0.1192, 0.9505], np.float32) / 1.089
    f = lambda t: np.where(t > 0.008856, np.cbrt(t), 7.787 * t + 16 / 116)
    fx, fy, fz = f(X), f(Y), f(Z)
    return np.stack([116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)], -1)
