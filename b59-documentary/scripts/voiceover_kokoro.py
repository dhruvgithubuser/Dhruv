"""B-59 narration: Kokoro-82M ONNX, deep American male (am_michael/am_onyx blend).

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
SPEED = 1.15
PAUSE_SCALE = 0.8
LEAD = 0.3  # satellite cold open breathes before the first line  # silence before the first word

# (scene, spoken text (what the TTS reads), caption text (exact script wording), pause after in s)
PHRASES = [
    (1, 'A Soviet submarine was surrounded by American warships.', 'A Soviet submarine was surrounded by American warships.', 0.35),
    (2, 'Its crew believed World War Three might have already begun.', 'Its crew believed World War III might have already begun.', 0.35),
    (3, 'Then one officer refused to authorize a nuclear strike.', 'Then one officer refused to authorize a nuclear strike.', 0.8),
    (4, 'October twenty-seventh, nineteen sixty-two.', 'October 27, 1962.', 0.4),
    (5, 'The Cuban Missile Crisis had brought the United States and Soviet Union dangerously close to nuclear war.', 'The Cuban Missile Crisis had brought the United States and Soviet Union dangerously close to nuclear war.', 0.55),
    (6, 'Deep beneath the Atlantic, Soviet submarine B fifty-nine was being hunted by American destroyers.', 'Deep beneath the Atlantic, Soviet submarine B-59 was being hunted by American destroyers.', 0.5),
    (7, 'The Americans began dropping practice depth charges, designed to force the submarine to surface.', 'The Americans began dropping practice depth charges, designed to force the submarine to surface.', 0.5),
    (8, 'But inside B fifty-nine, the explosions sounded like an attack.', 'But inside B-59, the explosions sounded like an attack.', 0.6),
    (9, 'The submarine was running low on battery power.', 'The submarine was running low on battery power.', 0.3),
    (10, 'Temperatures were rising, communications with Moscow had been lost,', 'Temperatures were rising, communications with Moscow had been lost,', 0.2),
    (11, 'and the exhausted crew feared war had already begun.', 'and the exhausted crew feared war had already begun.', 0.6),
    (12, "What the Americans didn't know... was that B fifty-nine carried a nuclear-armed torpedo.", "What the Americans didn't know was that B-59 carried a nuclear-armed torpedo.", 0.6),
    (13, 'Its captain, Valentin Savitsky, reportedly considered launching it against the American ships.', 'Its captain, Valentin Savitsky, reportedly considered launching it against the American ships.', 0.4),
    (14, 'The political officer agreed.', 'The political officer agreed.', 0.6),
    (15, 'But another senior officer was aboard: Vasili Arkhipov.', 'But another senior officer was aboard: Vasili Arkhipov.', 0.5),
    (16, 'He opposed the launch, and urged the captain to surface and seek orders from Moscow.', 'He opposed the launch and urged the captain to surface and seek orders from Moscow.', 0.6),
    (17, 'His position prevailed. B fifty-nine finally surfaced. The nuclear torpedo was never fired.', 'His position prevailed. B-59 finally surfaced. The nuclear torpedo was never fired.', 0.7),
    (18, 'For decades, the world knew little about this underwater confrontation.', 'For decades, the world knew little about this underwater confrontation.', 0.6),
    (18, 'Sometimes, history is changed not by the weapon that is fired... but by the person who refuses to authorize it.', 'Sometimes, history is changed not by the weapon that is fired, but by the person who refuses to authorize it.', 0.0),
]
TAIL = 2.8  # title card after the last word


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
    npz = KDIR / "voices_b59.npz"
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
    out = ROOT / "public" / "audio"
    sf.write(out / "voiceover.wav", vo.astype(np.float32), SR, subtype="PCM_24")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(out / "voiceover.wav"), "-c:a", "libmp3lame",
                    "-b:a", "192k", str(out / "voiceover.mp3")], check=True)

    if "--whisper" in sys.argv:
        add_words(vo, phrases)
    timeline = {"fps": 30, "duration": round(duration, 3), "voice": "kokoro am_michael/am_onyx blend (en-us)",
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
