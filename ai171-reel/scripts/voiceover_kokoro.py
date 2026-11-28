"""AI171 narration: Kokoro-82M ONNX, Indian-English male voice (hm_omega).

    python scripts/voiceover_kokoro.py <kokoro_dir> [--whisper]

<kokoro_dir> holds model.onnx and am_michael.bin / am_onyx.bin from
huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX. Synthesizes the script phrase by phrase with
deliberate dramatic pauses, then (with --whisper) gets word timestamps from faster-whisper so the
on-screen captions follow the voice word by word.

Writes public/audio/voiceover.wav + voiceover.mp3 and src/timeline.json
(phrases with start/end seconds, scene ids, and word timings).
"""
import difflib
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro
from scipy.signal import resample_poly, butter, sosfilt

ROOT = Path(__file__).resolve().parent.parent
KDIR = Path(sys.argv[1])
SR = 48000
SPEED = 1.04
PAUSE_SCALE = 1.0
LEAD = 0.4  # satellite cold open breathes before the first line  # silence before the first word

# (scene, spoken text (what the TTS reads), caption text (exact script wording), pause after in s)
PHRASES = [
    (1, "Thirty-two seconds. That is how long Air India Flight one seven one was in the air.", "Thirty-two seconds. That is how long Air India Flight 171 was in the air.", 0.6),
    (2, "Thursday, the twelfth of June, twenty twenty-five. Ahmedabad, Gujarat.", "Thursday, the twelfth of June, 2025. Ahmedabad, Gujarat.", 0.5),
    (3, "Two hundred and thirty passengers and twelve crew boarded a Boeing seven eight seven Dreamliner, bound for London Gatwick.", "230 passengers and 12 crew boarded a Boeing 787 Dreamliner, bound for London Gatwick.", 0.5),
    (4, "The aircraft, V-T-A-N-B, had flown with Air India since twenty fourteen.", "The aircraft, VT-ANB, had flown with Air India since 2014.", 0.5),
    (5, "At one thirty-eight in the afternoon, it lifted off from runway two-three.", "At 1:38 in the afternoon, it lifted off from runway 23.", 0.6),
    (6, "Three seconds later, the flight recorder logged both engine fuel switches moving from RUN to CUTOFF... one second apart.", "Three seconds later, the flight recorder logged both engine fuel switches moving from RUN to CUTOFF, one second apart.", 0.7),
    (7, "On the cockpit recording, one pilot asks the other why he cut off the fuel. The other says he did not.", "On the cockpit recording, one pilot asks the other why he cut off the fuel. The other says he did not.", 0.6),
    (8, "The switches were moved back to RUN. The engines tried to relight. Then, a mayday call.", "The switches were moved back to RUN. The engines tried to relight. Then, a mayday call.", 0.7),
    (9, "Thirty-two seconds after takeoff, the jet came down on a medical college hostel, one point seven kilometres from the runway.", "Thirty-two seconds after takeoff, the jet came down on a medical college hostel, 1.7 kilometres from the runway.", 0.7),
    (10, "Two hundred and forty-one people on board were killed, and nineteen on the ground. One passenger, in seat eleven A, survived.", "241 people on board were killed, and 19 on the ground. One passenger, in seat 11A, survived.", 0.7),
    (11, "The preliminary report found no mechanical fault. It did not say why the switches moved.", "The preliminary report found no mechanical fault. It did not say why the switches moved.", 0.7),
    (12, "Two hundred and sixty lives. Thirty-two seconds. The final answer is still awaited.", "260 lives. Thirty-two seconds. The final answer is still awaited.", 0.0),
]
TAIL = 4.0  # title card after the last word


def voice_style():
    return np.fromfile(KDIR / "hm_omega.bin", dtype=np.float32).reshape(-1, 1, 256)  # Indian-English male


def warm(x):
    """Gentle broadcast EQ: low-shelf-ish lift + a little air cut, then normalise."""
    lows = sosfilt(butter(2, 180, "lowpass", fs=SR, output="sos"), x)
    x = x + 0.25 * lows
    x = sosfilt(butter(2, 9500, "lowpass", fs=SR, output="sos"), x)
    return x


def main():
    npz = KDIR / "voices_ai171reel.npz"
    np.savez(npz, narrator=voice_style())
    tts = Kokoro(str(KDIR / "model.onnx"), str(npz))
    parts, phrases, t = [np.zeros(int(LEAD * SR))], [], LEAD
    for scene, spoken, caption, pause in PHRASES:
        audio, sr = tts.create(spoken, voice="narrator", speed=SPEED, lang="en-gb")
        a = resample_poly(audio.astype(np.float64), SR, sr)
        env = np.abs(a)
        idx = np.where(env > env.max() * 10 ** (-42 / 20))[0]
        a = a[max(0, idx[0] - int(0.03 * SR)): idx[-1] + int(0.06 * SR)]
        start, end = t, t + len(a) / SR
        phrases.append({"scene": scene, "text": caption, "start": round(start, 3), "end": round(end, 3)})
        pause *= PAUSE_SCALE
        parts += [a, np.zeros(int(pause * SR))]
        t = end + pause
        print(f"S{scene:02d} {start:6.2f}-{end:6.2f}  {caption[:70]}")
    parts.append(np.zeros(int(TAIL * SR)))
    vo = warm(np.concatenate(parts))
    vo *= 10 ** (-1.5 / 20) / (np.abs(vo).max() + 1e-9)
    duration = len(vo) / SR
    out = ROOT / "public" / "audio"
    sf.write(out / "voiceover.wav", vo.astype(np.float32), SR, subtype="PCM_24")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(out / "voiceover.wav"), "-c:a", "libmp3lame",
                    "-b:a", "192k", str(out / "voiceover.mp3")], check=True)

    if "--whisper" in sys.argv:
        add_words(vo, phrases)
    timeline = {"fps": 30, "duration": round(duration, 3), "voice": "kokoro hm_omega (en-gb phonemes)",
                "phrases": phrases}
    (ROOT / "src" / "timeline.json").write_text(json.dumps(timeline, indent=1))
    print(f"duration {duration:.2f}s -> public/audio/voiceover.mp3, src/timeline.json")


def norm(w):
    return re.sub(r"[^a-z0-9']", "", w.lower().replace("’", "'"))


def add_words(vo, phrases):
    """Word times from faster-whisper, mapped onto the exact script words of each phrase."""
    from faster_whisper import WhisperModel
    a16 = resample_poly(vo, 1, 3).astype(np.float32)
    model = WhisperModel("base.en", device="cpu", compute_type="int8")
    for p in phrases:
        seg = a16[int((p["start"] - 0.1) * 16000): int((p["end"] + 0.15) * 16000)]
        segs, _ = model.transcribe(seg, word_timestamps=True, language="en")
        heard = [(w.word.strip(), w.start + p["start"] - 0.1, w.end + p["start"] - 0.1) for s in segs for w in s.words]
        script = p["text"].split()
        sm = difflib.SequenceMatcher(a=[norm(w) for w in script], b=[norm(h[0]) for h in heard], autojunk=False)
        times = [None] * len(script)
        for blk in sm.get_matching_blocks():
            for k in range(blk.size):
                times[blk.a + k] = heard[blk.b + k][1:]
        # fill gaps (numbers spoken as words, etc.) by interpolating inside the phrase
        known = [(i, tm) for i, tm in enumerate(times) if tm]
        anchors = [(-1, (p["start"], p["start"]))] + known + [(len(script), (p["end"], p["end"]))]
        for (i0, t0), (i1, t1) in zip(anchors, anchors[1:]):
            n = i1 - i0
            for k in range(1, n):
                s = t0[1] + (t1[0] - t0[1]) * (k - 1) / max(1, n - 1)
                e = t0[1] + (t1[0] - t0[1]) * k / max(1, n - 1)
                times[i0 + k] = (s, max(e, s + 0.12))
        p["words"] = [{"w": w, "start": round(tm[0], 3), "end": round(tm[1], 3)} for w, tm in zip(script, times)]
        print(f"  words S{p['scene']:02d}: {sum(1 for x in sm.get_matching_blocks() for _ in range(x.size))}/{len(script)} matched")


if __name__ == "__main__":
    main()
