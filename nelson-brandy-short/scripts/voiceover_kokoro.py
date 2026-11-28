"""Nelson brandy narration: Kokoro-82M ONNX, deep American male (am_michael/am_onyx blend).

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
    (1, "You're looking at the hero of Trafalgar. He won Britain's greatest sea battle in eighteen oh five, then came home in a barrel of brandy. Why?", "You're looking at the hero of Trafalgar. He won Britain's greatest sea battle in 1805, then came home in a barrel of brandy. Why?", 0.45),
    (2, "October twenty-first, eighteen oh five. Admiral Horatio Nelson walks the deck of H M S Victory, in his admiral's coat, his medals catching the light.", "October 21, 1805. Admiral Horatio Nelson walks the deck of HMS Victory, in his admiral's coat, his medals catching the light.", 0.4),
    (3, "High in the rigging of a French ship, a marksman takes aim, from fifty feet away. The ball goes through his shoulder, his lung, and his spine.", "High in the rigging of a French ship, a marksman takes aim, from 50 feet away. The ball goes through his shoulder, his lung, and his spine.", 0.45),
    (4, "Three hours later, below deck, Nelson dies. The battle is won.", "Three hours later, below deck, Nelson dies. The battle is won.", 0.5),
    (5, "But England is weeks away. So the surgeon puts his body in a cask of brandy, mixed with camphor and myrrh. It's lashed to the mainmast, under armed guard.", "But England is weeks away. So the surgeon puts his body in a cask of brandy, mixed with camphor and myrrh. It's lashed to the mainmast, under armed guard.", 0.45),
    (6, "At Gibraltar, he's moved to a lead coffin, filled with spirits of wine.", "At Gibraltar, he's moved to a lead coffin, filled with spirits of wine.", 0.4),
    (7, "Legend says sailors secretly drank from the cask, tapping the admiral, and that's why rum is called Nelson's Blood. There's no proof. And it wasn't even rum.", "Legend says sailors secretly drank from the cask, \"tapping the admiral\", and that's why rum is called \"Nelson's Blood\". There's no proof. And it wasn't even rum.", 0.45),
    (8, "His outer coffin? Made from the mast of a French flagship he had destroyed, a gift from one of his captains, years before.", "His outer coffin? Made from the mast of a French flagship he had destroyed, a gift from one of his captains, years before.", 0.4),
    (9, "January ninth, eighteen oh six. Thirty-two admirals, over a hundred captains and ten thousand soldiers escort him to St Paul's, where he lies in a tomb first carved for a cardinal.", "January 9, 1806. 32 admirals, over 100 captains and 10,000 soldiers escort him to St Paul's, where he lies in a tomb first carved for a cardinal.", 0.45),
    (10, "Would you have drunk from the barrel? Tell me below, and follow Buried Chronicles.", "Would you have drunk from the barrel? Tell me below, and follow Buried Chronicles.", 0.2),
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
    npz = KDIR / "voices_nelson.npz"
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
