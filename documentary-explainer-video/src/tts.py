"""Temporary synthetic voiceover (Kokoro-82M, Apache-2.0). Synthesises each beat separately so the
beat boundaries are known exactly, then writes voiceover.wav + timing.json.
Replace with a real recording later: see README."""
import json, sys, os
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
sys.path.insert(0, os.path.dirname(__file__))
from beats import BEATS

DATA, OUT = sys.argv[1], sys.argv[2]
VOICE = os.environ.get("VOICE", "am_onyx")
SPEED = float(os.environ.get("SPEED", "1.05"))
k = Kokoro(f"{DATA}/kokoro-v1.0.onnx", f"{DATA}/voices-v1.0.bin")
SR = 24000
LEAD, GAP = 0.35, 0.28  # silence before first beat / between beats

def trim(a, thr=0.008):
    idx = np.where(np.abs(a) > thr)[0]
    return a[max(idx[0] - 240, 0): idx[-1] + 480] if len(idx) else a

parts, timing, t = [np.zeros(int(LEAD * SR), np.float32)], [], LEAD
for b in BEATS:
    audio, sr = k.create(b["text"], voice=VOICE, speed=SPEED, lang="en-us")
    assert sr == SR
    a = trim(audio.astype(np.float32))
    dur = len(a) / SR
    timing.append(dict(id=b["id"], scene=b["scene"], start=round(t, 3), end=round(t + dur, 3), text=b["text"]))
    parts += [a, np.zeros(int(GAP * SR), np.float32)]
    t += dur + GAP
parts.append(np.zeros(int(1.2 * SR), np.float32))  # tail for end card
full = np.concatenate(parts)
full = full / max(1e-6, np.abs(full).max()) * 0.89
sf.write(f"{OUT}/voiceover.wav", full, SR)
json.dump(dict(duration=round(len(full) / SR, 3), beats=timing), open(f"{OUT}/timing.json", "w"), indent=1)
print(f"voice={VOICE} total={len(full)/SR:.2f}s")
for x in timing:
    print(f'{x["id"]} {x["start"]:6.2f}-{x["end"]:6.2f} {x["scene"]}')
