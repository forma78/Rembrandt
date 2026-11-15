import json, sys, shutil, soundfile as sf, numpy as np, os
from kokoro_onnx import Kokoro
T = os.environ.get("KOKORO_DIR", "tts") + "/"
k = Kokoro(T + "kokoro-v1.0.int8.onnx", T + "voices-v1.0.bin")
voice, out = sys.argv[1], sys.argv[2]; mul = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
os.makedirs(out, exist_ok=True)
lines = {"L1": "Hi! I'm an AI artist. No name yet.", "L2": "Okay. Fair.", "L3": "Nice red, though.",
         "L4": "You don't know me yet. Give me a chance.",
         "L5": "I plan every touch. A machine paints it. Real canvas, real paint.", "L6": "Tomatoes welcome."}
res = {}
for key, text in lines.items():
    a, sr = k.create(text, voice=voice, speed=(0.95 if key == "L2" else 1.0) * mul, lang=("en-gb" if voice.startswith("b") else "en-us"))
    idx = np.where(np.abs(a) > 0.01)[0]
    a = a[max(0, idx[0] - 600): idx[-1] + 1200]
    sf.write(f"{out}/{key}.wav", a, sr); res[key] = round(len(a) / sr, 2)
for key in ("BOO", "OOO"): shutil.copy(f"voice/{key}.wav", f"{out}/{key}.wav")
print(voice, json.dumps(res))
