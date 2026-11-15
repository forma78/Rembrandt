"""A little robot in a voice: a short metal comb and a light ring modulator over the dry voice."""
import sys, numpy as np, soundfile as sf, shutil, os
from scipy.signal import lfilter
src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
for k in ("L1", "L2", "L3", "L4", "L5", "L6"):
    x, sr = sf.read(f"{src}/{k}.wav", dtype="float32")
    t = np.arange(len(x)) / sr
    # metal: feedback comb, 2.6 ms (a small tin tube)
    d = int(0.0026 * sr); a = np.zeros(d + 1); a[0] = 1; a[d] = -0.55
    comb = lfilter([1.0], a, x) - x
    # robot: ring modulation at 95 Hz
    rm = x * np.sin(2 * np.pi * 95 * t)
    y = 0.78 * x + 0.30 * comb + 0.22 * rm
    y = y / (np.abs(y).max() + 1e-6) * 0.9
    sf.write(f"{dst}/{k}.wav", y.astype(np.float32), sr)
for k in ("BOO", "OOO"): shutil.copy(f"voice/{k}.wav", f"{dst}/{k}.wav")
print("ok", dst)
