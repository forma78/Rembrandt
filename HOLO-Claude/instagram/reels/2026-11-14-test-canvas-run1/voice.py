import os
import sys, json, soundfile as sf, numpy as np
from kokoro_onnx import Kokoro
T = os.environ.get("KOKORO_DIR", "tts") + "/"
k = Kokoro(T + "kokoro-v1.0.int8.onnx", T + "voices-v1.0.bin")
voice, speed = sys.argv[1], float(sys.argv[2])
cues = json.load(open(sys.argv[3]))
out = []
for i, text in enumerate(cues):
    a, sr = k.create(text, voice=voice, speed=speed, lang="en-us")
    # trim silence at the ends
    idx = np.where(np.abs(a) > 0.01)[0]
    a = a[max(0, idx[0] - 600): idx[-1] + 1200]
    sf.write(f"voice/cue{i}.wav", a, sr)
    out.append(len(a) / sr)
print(json.dumps({"sr": sr, "dur": out, "total": sum(out)}))
