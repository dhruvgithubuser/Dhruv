"""MH370 narration: Kokoro-82M (ONNX, Apache-2.0) voice, one take per line, each placed at its cue.

    python vo_build.py <kokoro_dir>     (kokoro_dir holds model.onnx + <voice>.bin from
                                         huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX)

Writes audio/vo.wav (48 kHz stereo, dry) and audio/vo_lines.json (placed start/end per line).
Cues are seconds on the film clock, chosen so each line lands under the picture it describes.
"""
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro
from scipy.signal import resample_poly

FILM = Path(__file__).resolve().parent.parent
KDIR = Path(sys.argv[1])
VOICE, SPEED = "am_michael", 1.02
DUR, SR = 120.0, 48000

LINES = [  # (cue s, text)
    (0.4, "On March eighth, twenty fourteen, a Boeing seven seven seven vanished."),
    (4.6, "Two hundred and thirty-nine people were on board."),
    (8.3, "This is the mystery of Flight M H three seventy."),
    (14.0, "Just after midnight, it took off from Kuala Lumpur, bound for Beijing."),
    (20.2, "At one nineteen, the last words from the cockpit."),
    (23.4, "Good night. Malaysian three seven zero."),
    (26.8, "A few minutes later, over the South China Sea, the transponder went silent."),
    (33.6, "But military radar saw a blip. The plane had turned back, across Malaysia."),
    (40.4, "At two twenty-two, it was seen for the last time."),
    (44.4, "Then... nothing."),
    (47.0, "Yet it kept flying. For six more hours, it exchanged automatic handshakes with a satellite."),
    (56.9, "Each one gave only a distance: a ring on the map."),
    (61.9, "The final handshake, at eight nineteen, marks the seventh arc."),
    (67.0, "The signal pointed south, not north."),
    (71.3, "Malaysia announced the flight had ended in the southern Indian Ocean."),
    (77.0, "Sonar swept a hundred and twenty thousand square kilometres of seabed. Nothing."),
    (83.8, "In July twenty fifteen, a piece of wing washed ashore on Reunion Island. It was from M H three seventy."),
    (91.0, "More debris followed, along Africa's coast."),
    (95.1, "Investigators could not determine why the plane disappeared."),
    (100.3, "New searches followed, in twenty eighteen and twenty twenty-five."),
    (105.2, "As the search company put it: it isn't where we looked."),
    (110.2, "It remains aviation's greatest mystery."),
    (114.6, "Two hundred and thirty-nine people."),
    (117.0, "Still missing."),
]


def main():
    voices = {VOICE: np.fromfile(KDIR / f"{VOICE}.bin", dtype=np.float32).reshape(-1, 1, 256)}
    npz = KDIR / "voices_mh370.npz"
    np.savez(npz, **voices)
    tts = Kokoro(str(KDIR / "model.onnx"), str(npz))
    out = np.zeros(int(DUR * SR) + SR)
    placed, prev_end = [], 0.0
    for cue, text in LINES:
        audio, sr = tts.create(text, voice=VOICE, speed=SPEED, lang="en-us")
        a = resample_poly(audio.astype(np.float64), SR, sr)
        # trim leading/trailing silence (-40 dB) so the cue is the speech onset
        env = np.abs(a)
        thr = env.max() * 10 ** (-40 / 20)
        idx = np.where(env > thr)[0]
        a = a[max(0, idx[0] - int(0.04 * SR)): idx[-1] + int(0.08 * SR)]
        start = max(cue, prev_end + 0.25)
        end = start + len(a) / SR
        i0 = int(start * SR)
        out[i0:i0 + len(a)] += a
        placed.append({"cue": cue, "start": round(start, 3), "end": round(end, 3), "text": text})
        flag = "  <-- pushed late" if start > cue + 1e-6 else ""
        print(f"{start:7.2f}-{end:7.2f}  ({end - start:4.2f}s)  {text[:60]}{flag}")
        prev_end = end
    out = out[: int(DUR * SR)]
    out *= 10 ** (-3 / 20) / (np.abs(out).max() + 1e-9)
    sf.write(FILM / "audio" / "vo.wav", np.stack([out, out], axis=1).astype(np.float32), SR, subtype="FLOAT")
    (FILM / "audio" / "vo_lines.json").write_text(json.dumps({"voice": VOICE, "speed": SPEED, "lines": placed}, indent=1))
    over = [p for p in placed if p["end"] > DUR - 0.8]
    print("ends past the end card:" if over else "all lines fit", over or "")


if __name__ == "__main__":
    main()
