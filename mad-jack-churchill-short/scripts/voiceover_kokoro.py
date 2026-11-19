"""Mad Jack Churchill narration: Kokoro-82M ONNX, deep American male (am_michael/am_onyx blend).

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
SPEED = 1.14
PAUSE_SCALE = 0.8
LEAD = 0.35  # silence before the first word

# (scene, spoken text (what the TTS reads), caption text (exact script wording), pause after in s)
PHRASES = [
    (1, "You're looking at the man who brought a longbow to World War Two. One arrow made him a legend. But did it happen?", "You're looking at the man who brought a longbow to World War 2. One arrow made him a legend. But did it happen?", 0.45),
    (2, "Jack Churchill. Before the war, he shot for Britain at the World Archery Championships, and played an archer in a movie.", "Jack Churchill. Before the war, he shot for Britain at the World Archery Championships, and played an archer in a movie.", 0.4),
    (3, "France, nineteen forty. The story goes: from behind a wall, he draws his bow, and drops a German with a single arrow. The only longbow kill of the war.", "France, 1940. The story goes: from behind a wall, he draws his bow, and drops a German with a single arrow. The only longbow kill of the war.", 0.5),
    (4, "But Churchill himself later said his bows had been crushed by a truck earlier in that campaign.", "But Churchill himself later said his bows had been crushed by a truck earlier in that campaign.", 0.45),
    (5, "The rest of his war? That part is true.", "The rest of his war? That part is true.", 0.4),
    (6, "Norway, nineteen forty-one. As the ramps drop, he leaps ashore playing the bagpipes. The garrison falls in under ten minutes.", "Norway, 1941. As the ramps drop, he leaps ashore playing the bagpipes. The garrison falls in under ten minutes.", 0.4),
    (7, "Sicily, nineteen forty-three. He lands with a broadsword at his waist, a longbow around his neck, and his bagpipes under his arm.", "Sicily, 1943. He lands with a broadsword at his waist, a longbow around his neck, and his bagpipes under his arm.", 0.4),
    (8, "At Salerno, with one corporal, he slips into a German-held town, and comes back with forty-two prisoners.", "At Salerno, with one corporal, he slips into a German-held town, and comes back with 42 prisoners.", 0.35),
    (9, "Then he walks back alone, to fetch the sword he lost in the fight.", "Then he walks back alone, to fetch the sword he lost in the fight.", 0.45),
    (10, "Yugoslavia, nineteen forty-four. A mortar shell kills or wounds every man around him. So he plays his pipes as the Germans close in, until grenades knock him out.", "Yugoslavia, 1944. A mortar shell kills or wounds every man around him. So he plays his pipes as the Germans close in, until grenades knock him out.", 0.45),
    (11, "The Germans think he's related to Winston Churchill, and fly him to Berlin. He wasn't. He survived the war, and lived to eighty-nine.", "The Germans think he's related to Winston Churchill, and fly him to Berlin. He wasn't. He survived the war, and lived to 89.", 0.45),
    (12, "So, the longbow kill. Legend, or truth? Tell me below, and follow Buried Chronicles.", "So, the longbow kill. Legend, or truth? Tell me below, and follow Buried Chronicles.", 0.2),
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
    npz = KDIR / "voices_jack.npz"
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
