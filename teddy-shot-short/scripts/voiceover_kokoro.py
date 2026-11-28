"""Teddy Roosevelt shot Short narration: Kokoro-82M ONNX, deep American male (am_michael/am_onyx blend).

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
SPEED = 1.07
PAUSE_SCALE = 0.8
LEAD = 0.35  # silence before the first word

# (scene, spoken text (what the TTS reads), caption text (exact script wording), pause after in s)
PHRASES = [
    (1, "You're shot in the chest in nineteen twelve. You refuse the hospital and speak for fifty minutes. So why aren't you dead?", "You're shot in the chest in 1912. You refuse the hospital and speak for 50 minutes. So why aren't you dead?", 0.45),
    (2, "October fourteenth, nineteen twelve. Milwaukee. Former President Teddy Roosevelt is campaigning for the White House.", "October 14, 1912. Milwaukee. Former President Teddy Roosevelt is campaigning for the White House.", 0.3),
    (3, "Outside his hotel, a man named John Schrank fires one shot into his chest.", "Outside his hotel, a man named John Schrank fires one shot into his chest.", 0.4),
    (4, "But the bullet first tears through a steel glasses case, and his speech, folded in half. Fifty pages thick.", "But the bullet first tears through a steel glasses case, and his speech, folded in half. 50 pages thick.", 0.35),
    (5, "He coughs into his hand. No blood. So the lung is fine.", "He coughs into his hand. No blood. So the lung is fine.", 0.3),
    (6, "He walks on stage. I don't know whether you fully understand that I have just been shot. But it takes more than that to kill a Bull Moose.", "He walks on stage. \"I don't know whether you fully understand that I have just been shot. But it takes more than that to kill a Bull Moose.\"", 0.35),
    (7, "He speaks for fifty minutes, blood seeping into his shirt. Then he goes to the hospital.", "He speaks for 50 minutes, blood seeping into his shirt. Then he goes to the hospital.", 0.35),
    (8, "An X-ray finds it lodged in his chest muscle. Doctors leave it there. He carried it for the rest of his life. Would you have walked on stage? Tell me below.", "An X-ray finds it lodged in his chest muscle. Doctors leave it there. He carried it for the rest of his life. Would you have walked on stage? Tell me below.", 0.2),
]
TAIL = 1.0  # title card after the last word


def voice_style():
    m = np.fromfile(KDIR / "am_michael.bin", dtype=np.float32).reshape(-1, 1, 256)
    o = np.fromfile(KDIR / "am_onyx.bin", dtype=np.float32).reshape(-1, 1, 256)
    return (0.8 * m + 0.2 * o).astype(np.float32)  # clear American documentary male, a touch of depth


def warm(x):
    """Broadcast clarity chain: high-pass, de-mud, presence and air lift, gentle compression, peak-safe."""
    x = sosfilt(butter(2, 75, "highpass", fs=SR, output="sos"), x)
    mud = sosfilt(butter(2, [180, 420], "bandpass", fs=SR, output="sos"), x)
    pres = sosfilt(butter(2, [2200, 5500], "bandpass", fs=SR, output="sos"), x)
    air = sosfilt(butter(2, 9000, "highpass", fs=SR, output="sos"), x)
    x = x - 0.30 * mud + 0.55 * pres + 0.20 * air
    # soft-knee compression on a smoothed envelope (about 3:1 above -18 dBFS)
    env = np.sqrt(sosfilt(butter(1, 12, "lowpass", fs=SR, output="sos"), x * x) + 1e-9)
    thr = 10 ** (-18 / 20) * np.abs(x).max()
    gain = np.where(env > thr, (thr / env) ** (2 / 3), 1.0)
    x = x * gain
    return x / (np.abs(x).max() + 1e-9) * 0.89


def main():
    npz = KDIR / "voices_teddy.npz"
    np.savez(npz, narrator=voice_style())
    tts = Kokoro(str(KDIR / "model.onnx"), str(npz))
    parts, phrases, t = [np.zeros(int(LEAD * SR))], [], LEAD
    for scene, spoken, caption, pause in PHRASES:
        audio, sr = tts.create(spoken, voice="narrator", speed=SPEED, lang="en-us")
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
    out = ROOT / "public" / "assets" / "sound"
    sf.write(out / "voiceover.wav", vo.astype(np.float32), SR, subtype="PCM_24")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(out / "voiceover.wav"), "-c:a", "libmp3lame",
                    "-b:a", "192k", str(out / "voiceover.mp3")], check=True)

    if "--whisper" in sys.argv:
        add_words(vo, phrases)
    timeline = {"fps": 30, "duration": round(duration, 3), "voice": "kokoro am_michael/am_onyx blend (en-us)",
                "phrases": phrases}
    (ROOT / "src" / "data" / "timeline.json").write_text(json.dumps(timeline, indent=1))
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
