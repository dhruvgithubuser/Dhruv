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
SPEED = 0.97
PAUSE_SCALE = 1.0
LEAD = 6.5  # satellite cold open breathes before the first line  # silence before the first word

# (scene, spoken text (what the TTS reads), caption text (exact script wording), pause after in s)
PHRASES = [
    (1, "Thursday, the twelfth of June, twenty twenty-five. Ahmedabad, Gujarat.", "Thursday, the twelfth of June, 2025. Ahmedabad, Gujarat.", 0.7),
    (1, "The afternoon was hot and clear. Light winds. Six kilometres of visibility.", "The afternoon was hot and clear. Light winds. Six kilometres of visibility.", 0.9),
    (2, "At Sardar Vallabhbhai Patel International Airport, a Boeing seven eight seven Dreamliner was being prepared for a long flight west... to London Gatwick.", "At Sardar Vallabhbhai Patel International Airport, a Boeing 787 Dreamliner was being prepared for a long flight west, to London Gatwick.", 0.8),
    (2, "This is the story of Air India Flight one seven one, and of thirty-two seconds that are still not fully explained.", "This is the story of Air India Flight 171, and of thirty-two seconds that are still not fully explained.", 5.0),
    (4, "Air India Flight one seven one. Two hundred and thirty passengers. Twelve crew.", "Air India Flight 171. Two hundred and thirty passengers. Twelve crew.", 0.6),
    (4, "The aircraft, registered V-T-A-N-B, had flown with Air India since twenty fourteen.", "The aircraft, registered VT-ANB, had flown with Air India since 2014.", 0.8),
    (5, "In the cockpit sat an experienced crew. The captain had logged around fifteen thousand six hundred hours. The first officer, around three thousand four hundred.", "In the cockpit sat an experienced crew. The captain had logged around 15,600 hours. The first officer, around 3,400.", 0.9),
    (6, "The jet was cleared for a full-length takeoff from runway two-three.", "The jet was cleared for a full-length takeoff from runway 23.", 0.6),
    (6, "After a sixty-two-second takeoff roll, at one thirty-eight and thirty-nine seconds in the afternoon, Flight one seven one left the ground.", "After a 62-second takeoff roll, at 1:38 and 39 seconds in the afternoon, Flight 171 left the ground.", 1.2),
    (7, "Three seconds later, at one hundred and eighty knots, the flight recorder logged something extraordinary.", "Three seconds later, at 180 knots, the flight recorder logged something extraordinary.", 0.7),
    (7, "Both engine fuel control switches moved from RUN... to CUTOFF. One after the other. One second apart.", "Both engine fuel control switches moved from RUN to CUTOFF. One after the other. One second apart.", 0.9),
    (7, "Fuel to both engines stopped. Thrust began to fall away. The ram air turbine, the aircraft's emergency power source, dropped into the airstream.", "Fuel to both engines stopped. Thrust began to fall away. The ram air turbine, the aircraft's emergency power source, dropped into the airstream.", 0.8),
    (7, "On the cockpit voice recording, one pilot asks the other why he cut off the fuel. The other replies that he did not.", "On the cockpit voice recording, one pilot asks the other why he cut off the fuel. The other replies that he did not.", 0.9),
    (7, "Ten seconds after the cutoff, the first switch was moved back to RUN. Four seconds later, the second. The engines began trying to relight.", "Ten seconds after the cutoff, the first switch was moved back to RUN. Four seconds later, the second. The engines began trying to relight.", 0.8),
    (8, "Then, a mayday call. A loss of thrust. The controller asked for the flight's call sign. There was no reply.", "Then, a mayday call. A loss of thrust. The controller asked for the flight's call sign. There was no reply.", 0.9),
    (9, "Thirty-two seconds after takeoff, at thirteen thirty-nine and eleven seconds, the recordings stopped.", "Thirty-two seconds after takeoff, at 13:39 and 11 seconds, the recordings stopped.", 2.2),
    (10, "Flight one seven one came down one point seven kilometres from the runway, onto the hostel buildings of B. J. Medical College, in Meghani Nagar.", "Flight 171 came down 1.7 kilometres from the runway, onto the hostel buildings of B.J. Medical College, in Meghani Nagar.", 0.8),
    (10, "It was lunchtime. Of the two hundred and forty-two people on board, two hundred and forty-one were killed. On the ground, nineteen more lost their lives, and sixty-seven were seriously injured.", "It was lunchtime. Of the 242 people on board, 241 were killed. On the ground, nineteen more lost their lives, and 67 were seriously injured.", 1.0),
    (10, "One passenger survived. He had been sitting in seat eleven A, beside an emergency exit.", "One passenger survived. He had been sitting in seat 11A, beside an emergency exit.", 0.8),
    (10, "Hundreds of firefighters, soldiers and disaster response teams were sent to the site.", "Hundreds of firefighters, soldiers and disaster response teams were sent to the site.", 1.4),
    (11, "India's Aircraft Accident Investigation Bureau led the inquiry, assisted by British and American investigators.", "India's Aircraft Accident Investigation Bureau led the inquiry, assisted by British and American investigators.", 0.7),
    (11, "Both flight recorders were recovered. A month later, the preliminary report set out what the switches did... but not why.", "Both flight recorders were recovered. A month later, the preliminary report set out what the switches did, but not why.", 0.8),
    (11, "It found no mechanical fault. It made no safety recommendations for Boeing, or for the engine maker, G-E.", "It found no mechanical fault. It made no safety recommendations for Boeing, or for the engine maker, GE.", 0.7),
    (11, "In twenty eighteen, the U-S regulator had advised operators to inspect the switches' locking feature. Air India had not done so, because the advice was not mandatory. Later inspections of its fleet found no problems.", "In 2018, the US regulator had advised operators to inspect the switches' locking feature. Air India had not done so, because the advice was not mandatory. Later inspections of its fleet found no problems.", 0.8),
    (11, "At the time of this film, the final report had not been made public.", "At the time of this film, the final report had not been made public.", 1.6),
    (12, "Two hundred and sixty lives. Thirty-two seconds.", "Two hundred and sixty lives. Thirty-two seconds.", 0.9),
    (12, "And a question that their families are still waiting to have answered.", "And a question that their families are still waiting to have answered.", 0.0),
]
TAIL = 14.0  # title card after the last word


def voice_style():
    return np.fromfile(KDIR / "hm_omega.bin", dtype=np.float32).reshape(-1, 1, 256)  # Indian-English male


def warm(x):
    """Gentle broadcast EQ: low-shelf-ish lift + a little air cut, then normalise."""
    lows = sosfilt(butter(2, 180, "lowpass", fs=SR, output="sos"), x)
    x = x + 0.25 * lows
    x = sosfilt(butter(2, 9500, "lowpass", fs=SR, output="sos"), x)
    return x


def main():
    npz = KDIR / "voices_ai171.npz"
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
