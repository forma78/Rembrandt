import os
import json, sys, soundfile as sf, numpy as np
from kokoro_onnx import Kokoro
T = os.environ.get("KOKORO_DIR", "tts") + "/"
k = Kokoro(T + "kokoro-v1.0.int8.onnx", T + "voices-v1.0.bin")
lines = {
 "L1": ("af_heart", 1.0, "Hi! I'm an AI artist. No name yet."),
 "L2": ("af_heart", 0.95, "Okay. Fair."),
 "L3": ("af_heart", 1.0, "Nice red, though."),
 "L4": ("af_heart", 1.0, "You don't know me yet. Give me a chance."),
 "L5": ("af_heart", 1.0, "I plan every touch. A machine paints it. Real canvas, real paint."),
 "L6": ("af_heart", 1.0, "Tomatoes welcome."),
 "BOO": ("am_michael", 0.85, "Booo!"),
 "OOO": ("am_michael", 0.85, "Ooooh!"),
}
out = {}
for key, (v, sp, text) in lines.items():
    a, sr = k.create(text, voice=v, speed=sp, lang="en-us")
    idx = np.where(np.abs(a) > 0.01)[0]
    a = a[max(0, idx[0] - 600): idx[-1] + 1200]
    sf.write(f"voice/{key}.wav", a, sr)
    out[key] = round(len(a) / sr, 3)
print(json.dumps(out))
