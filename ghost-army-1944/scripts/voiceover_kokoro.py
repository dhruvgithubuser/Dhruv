"""Ghost Army narration: Kokoro-82M ONNX, deep American male (am_michael/am_onyx blend).

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
SPEED = 1.24
PAUSE_SCALE = 0.65
LEAD = 0.35  # silence before the first word

# (scene, spoken text (what the TTS reads), caption text (exact script wording), pause after in s)
PHRASES = [
    (1, "In nineteen forty-four, two French cyclists watched four American soldiers pick up a Sherman tank.", "In 1944, two French cyclists watched four American soldiers pick up a Sherman tank.", 0.4),
    (2, "One soldier reportedly shrugged: Americans are very strong.", "One soldier reportedly shrugged: \"Americans are very strong.\"", 0.5),
    (3, "The tank was a balloon. It weighed ninety-three pounds.", "The tank was a balloon. It weighed 93 pounds.", 0.5),
    (4, "It belonged to the Ghost Army: eleven hundred Americans whose job was to look like thirty thousand.", "It belonged to the Ghost Army: 1,100 Americans whose job was to look like 30,000.", 0.4),
    (5, "Many were artists, recruited from art schools and ad agencies.", "Many were artists, recruited from art schools and ad agencies.", 0.35),
    (6, "They inflated fake tanks, trucks and cannons in a few hours.", "They inflated fake tanks, trucks and cannons in a few hours.", 0.35),
    (7, "Sound trucks blasted recordings of tank columns that carried fifteen miles. Radio operators faked the chatter of entire divisions.", "Sound trucks blasted recordings of tank columns that carried 15 miles. Radio operators faked the chatter of entire divisions.", 0.4),
    (8, "From Normandy to the Rhine, they staged more than twenty deceptions.", "From Normandy to the Rhine, they staged more than twenty deceptions.", 0.4),
    (9, "The biggest came in March, nineteen forty-five. Along the Rhine, they set up more than six hundred dummies, and impersonated two divisions.", "The biggest came in March 1945. Along the Rhine, they set up more than 600 dummies and impersonated two divisions.", 0.4),
    (10, "The Germans took the bait. To the north, the real Ninth Army crossed the river, and met little resistance.", "The Germans took the bait. To the north, the real Ninth Army crossed the river and met little resistance.", 0.5),
    (11, "The unit stayed secret until nineteen ninety-six. In twenty twenty-two, they were awarded the Congressional Gold Medal.", "The unit stayed secret until 1996. In 2022, they were awarded the Congressional Gold Medal.", 0.5),
    (12, "An army of artists, fighting with balloons. Would you have fallen for it?", "An army of artists, fighting with balloons. Would you have fallen for it?", 0.0),
]
TAIL = 1.6  # title card after the last word


def voice_style():
    m = np.fromfile(KDIR / "am_michael.bin", dtype=np.float32).reshape(-1, 1, 256)
    o = np.fromfile(KDIR / "am_onyx.bin", dtype=np.float32).reshape(-1, 1, 256)
    return (0.6 * m + 0.4 * o).astype(np.float32)  # deep American documentary male


def warm(x):
    """Gentle broadcast EQ: low-shelf-ish lift + a little air cut, then normalise."""
    lows = sosfilt(butter(2, 180, "lowpass", fs=SR, output="sos"), x)
    x = x + 0.25 * lows
    x = sosfilt(butter(2, 9500, "lowpass", fs=SR, output="sos"), x)
    return x


def main():
    npz = KDIR / "voices_ghostarmy.npz"
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
