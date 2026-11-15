"""usage: gen_lines.py VOICE SPEED OUTDIR ROBOT(0/1) KEY=TEXT ..."""
import sys, numpy as np, soundfile as sf, os
from kokoro_onnx import Kokoro
from scipy.signal import lfilter
T = os.environ.get("KOKORO_DIR", "tts") + "/"
k = Kokoro(T + "kokoro-v1.0.int8.onnx", T + "voices-v1.0.bin")
voice, speed, out, robot = sys.argv[1], float(sys.argv[2]), sys.argv[3], sys.argv[4] == "1"
os.makedirs(out, exist_ok=True)
for kv in sys.argv[5:]:
    key, text = kv.split("=", 1)
    a, sr = k.create(text, voice=voice, speed=speed, lang=("en-gb" if voice.startswith("b") else "en-us"))
    idx = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, idx[0] - 600): idx[-1] + 1200]
    if robot:
        t = np.arange(len(a)) / sr
        d = int(0.0026 * sr); den = np.zeros(d + 1); den[0] = 1; den[d] = -0.55
        comb = lfilter([1.0], den, a) - a
        a = 0.78 * a + 0.30 * comb + 0.22 * a * np.sin(2 * np.pi * 95 * t)
        a = a / (np.abs(a).max() + 1e-6) * 0.9
    sf.write(f"{out}/{key}.wav", a.astype(np.float32), sr)
    print(voice, key, round(len(a) / sr, 2))
