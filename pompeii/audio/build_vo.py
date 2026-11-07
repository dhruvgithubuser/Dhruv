"""Build the narration track for the Pompeii documentary.

    python pompeii/audio/build_vo.py --kokoro <dir with model.onnx + voices.bin> --whisper <faster-whisper model dir>

Reads  pompeii/audio/script.json
Writes pompeii/audio/vo/takes/<hash>.wav   one cached TTS take per line (never re-generated)
       pompeii/audio/vo.wav                 48 kHz mono-in-stereo narration, placed on the timeline
       pompeii/timeline.json                scene + line + word timings (the film and the SRT read this)
       pompeii/film.json                    duration updated to the narration's length

Voice: Kokoro-82M (Apache-2.0), voice set in script.json (default am_michael, a male US narrator).
Word timings come from faster-whisper run on each take, mapped back onto the script's own words.
"""
import argparse, hashlib, json, os, re, sys
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly, butter, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
FILM = os.path.dirname(HERE)
SR = 48000

ap = argparse.ArgumentParser()
ap.add_argument("--kokoro", required=True)
ap.add_argument("--whisper", default=None)
args = ap.parse_args()

script = json.load(open(os.path.join(HERE, "script.json")))
voice, speed = script["voice"], script["speed"]
GS = script.get("gap_scale", 1.0)
takes_dir = os.path.join(HERE, "vo", "takes")
os.makedirs(takes_dir, exist_ok=True)

kokoro = None
def tts(text):
    global kokoro
    key = hashlib.sha1(f"{voice}|{speed}|{text}".encode()).hexdigest()[:16]
    path = os.path.join(takes_dir, f"{key}.wav")
    if not os.path.exists(path):
        if kokoro is None:
            from kokoro_onnx import Kokoro
            kokoro = Kokoro(os.path.join(args.kokoro, "model.onnx"), os.path.join(args.kokoro, "voices.bin"))
        s, sr = kokoro.create(text, voice=voice, speed=speed, lang="en-us")
        s = resample_poly(s.astype(np.float64), SR // 1000, sr // 1000)
        sf.write(path, s.astype(np.float32), SR)
    s, _ = sf.read(path)
    return s, path

def trim(x, thr_db=-45):
    env = np.abs(x)
    thr = 10 ** (thr_db / 20) * env.max()
    idx = np.where(env > thr)[0]
    a, b = max(0, idx[0] - int(0.02 * SR)), min(len(x), idx[-1] + int(0.08 * SR))
    return x[a:b]

# Narrator chain: rumble HPF, gentle warmth + presence, soft compression.
def process(x):
    x = sosfilt(butter(2, 70, "highpass", fs=SR, output="sos"), x)
    low = sosfilt(butter(2, 220, "lowpass", fs=SR, output="sos"), x)
    pres = sosfilt(butter(2, [2500, 5000], "bandpass", fs=SR, output="sos"), x)
    x = x + 0.22 * low + 0.18 * pres
    # RMS compressor, 4:1 above -20 dBFS, 10 ms / 120 ms
    a, r = np.exp(-1 / (0.010 * SR)), np.exp(-1 / (0.120 * SR))
    env = np.zeros_like(x); e = 0.0
    sq = x * x
    for i in range(0, len(x), 32):                      # block-wise for speed
        v = sq[i:i + 32].mean()
        e = (a if v > e else r) * e + (1 - (a if v > e else r)) * v
        env[i:i + 32] = e
    lvl = 10 * np.log10(env + 1e-12)
    over = np.maximum(0, lvl - (-20))
    g = 10 ** (-(over * (1 - 1 / 4)) / 20)
    x = x * g
    return x / (np.abs(x).max() + 1e-9) * 0.89

whisper = None
def words_for(x, text, dur):
    """Word timings within a take: whisper's word stamps, re-labelled with the script's own words."""
    global whisper
    script_words = text.split()
    if args.whisper:
        if whisper is None:
            from faster_whisper import WhisperModel
            whisper = WhisperModel(args.whisper, device="cpu", compute_type="int8")
        a = resample_poly(x, 1, 3).astype(np.float32)
        segs, _ = whisper.transcribe(a, language="en", word_timestamps=True, initial_prompt=text)
        ws = [w for sg in segs for w in sg.words]
        if ws:
            # map script words onto the recognised words proportionally by character position
            rc = np.cumsum([len(w.word.strip()) + 1 for w in ws]); rc = rc / rc[-1]
            sc = np.cumsum([len(w) + 1 for w in script_words]); sc = sc / sc[-1]
            out, prev_end = [], 0.0
            for i, w in enumerate(script_words):
                j = min(len(ws) - 1, int(np.searchsorted(rc, sc[i] - 1e-6)))
                end = max(prev_end + 0.05, float(ws[j].end))
                start = prev_end if i else float(ws[0].start)
                out.append([w, round(start, 3), round(min(end, dur), 3)])
                prev_end = end
            return out, " ".join(w.word.strip() for w in ws)
    # fallback: spread by character count
    tot = sum(len(w) + 1 for w in script_words); t = 0.0; out = []
    for w in script_words:
        d = dur * (len(w) + 1) / tot; out.append([w, round(t, 3), round(t + d, 3)]); t += d
    return out, None

timeline = {"voice": voice, "scenes": []}
pieces, t = [], 0.0
for sc in script["scenes"]:
    lead = max(0.8, sc.get("lead", 1.5) * GS) if sc["id"] != "S01" else sc.get("lead", 1.5)
    pieces.append(np.zeros(int(lead * SR))); scene_start = t; t += lead
    lines = []
    for text, gap in sc["lines"]:
        raw, path = tts(text)
        x = process(trim(raw))
        dur = len(x) / SR
        words, heard = words_for(x, text, dur)
        lines.append({"text": text, "start": round(t, 3), "end": round(t + dur, 3),
                      "words": [[w, round(t + a, 3), round(t + b, 3)] for w, a, b in words],
                      **({"heard": heard} if heard else {})})
        pieces.append(x); t += dur
        gap = gap * GS if gap < 5 else gap
        pieces.append(np.zeros(int(gap * SR))); t += gap
    timeline["scenes"].append({"id": sc["id"], "title": sc["title"], "start": round(scene_start, 3),
                               "end": round(t, 3), "lines": lines})
    print(f"{sc['id']} {scene_start:7.2f}-{t:7.2f}  {sc['title']}")

vo = np.concatenate(pieces)
sf.write(os.path.join(HERE, "vo.wav"), np.stack([vo, vo], 1).astype(np.float32), SR)
timeline["duration"] = round(t, 3)
json.dump(timeline, open(os.path.join(FILM, "timeline.json"), "w"), indent=1)
cfg_path = os.path.join(FILM, "film.json")
cfg = json.load(open(cfg_path)); cfg["duration"] = round(t, 2)
json.dump(cfg, open(cfg_path, "w"), indent=1)
n_words = sum(len(l[0].split()) for s in script["scenes"] for l in s["lines"])
print(f"narration {t:.1f} s ({t/60:.2f} min), {n_words} words, {n_words / (t/60):.0f} wpm overall")
