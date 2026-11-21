"""Score + sound design for "The 15-Minute Ambush That Started a World War" (synthesized, seeded, reproducible).

    python scripts/build-audio.py

Reads src/timeline.json. Writes public/audio/score.wav/.mp3, public/audio/sfx/*.wav and src/sfx-cues.json.
Tone: 18th-century frontier documentary. Low strings and a slow snare under the narration, forest dawn ambience,
musket volleys, rain at Fort Necessity, chapter stingers, a broad resolve at the end. Music stays below the voice.
"""
import json
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, sosfilt

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
rng = np.random.default_rng(1754)
TL = json.loads((ROOT / "src" / "data" / "timeline.json").read_text())
PH = TL["phrases"]
DUR = float(np.ceil(TL["duration"]))
OUT = ROOT / "public" / "assets" / "sound"
MUS = ROOT / "public" / "assets" / "music"
OUT.mkdir(parents=True, exist_ok=True); MUS.mkdir(parents=True, exist_ok=True)


def ph(n):
    return [p for p in PH if p["scene"] == n]


S = {1: 0.0}
for n in range(2, 60):
    S[n] = ph(n)[0]["start"] - 0.3


def word_t(scene, word, nth=0):
    ws = [w for p in ph(scene) for w in p.get("words", [])]
    hits = [w for w in ws if "".join(c for c in w["w"].lower() if c.isalnum()) == word]
    return hits[min(nth, len(hits) - 1)]["start"] if hits else S[scene]


t_ = lambda n: np.arange(n) / SR
lp = lambda x, f: sosfilt(butter(2, f, "lowpass", fs=SR, output="sos"), x)
hp = lambda x, f: sosfilt(butter(2, f, "highpass", fs=SR, output="sos"), x)
bp = lambda x, a, b: sosfilt(butter(2, [a, b], "bandpass", fs=SR, output="sos"), x)
hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)


def env(n, a, r):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr)
    return e


def reverb(x, secs=3.5, decay=1.4, wet=0.35):
    n = int(secs * SR)
    ir = lp(rng.standard_normal(n) * np.exp(-t_(n) / decay), 5000)
    ir /= np.sqrt((ir ** 2).sum())
    return x + wet * fftconvolve(x, ir)[: len(x)]


def place(bus, sig, at, g=1.0):
    i = int(at * SR)
    j = min(len(bus), i + len(sig))
    if i < len(bus): bus[i:j] += g * sig[: j - i]


def piano(m, length=4.0):
    n = int(length * SR); t = t_(n); f = hz(m)
    x = sum(a * np.sin(2 * np.pi * f * k * (1 + 0.0003 * k * k) * t) * np.exp(-t * (0.8 + 0.5 * k)) for k, a in ((1, 1), (2, .4), (3, .15), (4, .06)))
    return x * (1 - np.exp(-t / 0.004))


def pad(ms, length, cutoff=900):
    n = int(length * SR); x = np.zeros(n)
    for m in ms:
        for d in (-0.08, 0, 0.08):
            ph0 = rng.random()
            x += 2 * ((hz(m) * 2 ** (d / 12) * t_(n) + ph0) % 1) - 1
    return lp(x, cutoff) / (len(ms) * 3) ** 0.5 * env(n, 1.5, 2.0)





# ---------------------------------------------------------------- instruments
def strings(ms, length, cutoff=1400):
    n = int(length * SR); x = np.zeros(n); t = t_(n)
    vib = 1 + 0.003 * np.sin(2 * np.pi * 5.0 * t)
    for m in ms:
        for d in (-0.07, 0, 0.07):
            x += 2 * ((np.cumsum(hz(m) * 2 ** (d / 12) * vib) / SR + rng.random()) % 1) - 1
    return lp(x, cutoff) / (len(ms) * 3) ** 0.5 * env(n, 1.4, 2.0)


def kick(g=1.0):
    m = int(0.4 * SR); tm = t_(m)
    return np.sin(2 * np.pi * (44 + 50 * np.exp(-tm / 0.03)) * tm) * np.exp(-tm / 0.15) * g


def snare(g=1.0):
    m = int(0.18 * SR); tm = t_(m)
    return (bp(rng.standard_normal(m), 1500, 7000) * np.exp(-tm / 0.03) + np.sin(2 * np.pi * 200 * tm) * np.exp(-tm / 0.02) * 0.4) * g


def march_drum(length):
    n = int(length * SR); x = np.zeros(n); tt = 0.0; k = 0
    pat = [1, 0, 0.5, 0.5, 1, 0, 0.5, 0]
    while tt < length - 0.2:
        g = pat[k % 8]
        if g: place(x, snare(0.5 * g), tt)
        tt += 0.25; k += 1
    return x * env(n, 1.0, 1.5)


# ---------------------------------------------------------------- score: four movements keyed to the chapters
def score():
    n = int(DUR * SR); x = np.zeros(n); t = t_(n)
    x += (np.sin(2 * np.pi * hz(38) * t) * 0.45 + lp(rng.standard_normal(n), 130) * 0.3) * (0.55 + 0.2 * np.sin(2 * np.pi * t / 21)) * 0.28
    def pads(start, end, chords, cutoff=1300, g=0.2, step=5.0):
        tt, k = start, 0
        while tt < end - 1:
            place(x, strings(chords[k % len(chords)], min(step + 1.5, end - tt + 1), cutoff), tt, g); tt += step; k += 1
    # cold open: D minor, tense
    pads(0, S[7], [[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 49, 52]], 1100, 0.2)
    for k, m in enumerate([62, 65, 69, 67]): place(x, piano(m, 5), 0.8 + k * 1.6, 0.14)
    # I-III: frontier, modal and spacious
    pads(S[7], S[25], [[50, 57, 62], [48, 55, 60], [46, 53, 58], [45, 52, 57]], 1500, 0.17, 6.0)
    for k in range(int((S[25] - S[7]) / 9)): place(x, piano([62, 64, 65, 69][k % 4], 5), S[7] + 1 + k * 9, 0.1)
    # IV the glen: dark, pulse from the night march to the shot
    pads(S[25], S[35], [[38, 45, 50], [36, 43, 48], [34, 41, 46], [37, 44, 49]], 900, 0.22)
    a, b = S[29], word_t(31, "fire")
    tt = a
    while tt < b - 0.1: place(x, kick(0.3 + 0.5 * (tt - a) / max(1, b - a)), tt); tt += 0.75
    # V dispute: sparse
    pads(S[35], S[41], [[50, 53, 57], [49, 52, 56]], 1000, 0.15, 6.0)
    # VI Fort Necessity: storm
    pads(S[41], S[50], [[38, 45, 48], [36, 43, 46], [34, 41, 45], [33, 40, 45]], 1000, 0.22)
    # VII world on fire: broad, rising
    pads(S[50], S[57], [[43, 50, 55, 59], [45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 62]], 1800, 0.2)
    # epilogue: resolve to D major
    pads(S[57], DUR, [[50, 54, 57, 62], [47, 54, 59, 62], [43, 50, 55, 59], [50, 54, 57, 62]], 1600, 0.22, 5.0)
    for k, m in enumerate([62, 66, 69, 74]): place(x, piano(m, 6), S[57] + 0.5 + k * 1.8, 0.14)
    x = reverb(x, 4.0, 1.8, 0.4)
    s0 = word_t(31, "fire") + 0.15
    i0, i1 = int(s0 * SR), int((s0 + 1.0) * SR)
    g = np.ones(n); g[i0:i1] = 0.0; r = int(0.04 * SR); g[i0 - r:i0] = np.linspace(1, 0, r); g[i1:i1 + int(1.5 * SR)] = np.linspace(0, 1, int(1.5 * SR))
    x *= g
    fade = int(3 * SR); x[-fade:] *= np.linspace(1, 0, fade) ** 1.5
    return x


# ---------------------------------------------------------------- sfx
def paper():
    m = int(0.5 * SR); tm = t_(m)
    return bp(rng.standard_normal(m), 1500, 9000) * np.exp(-tm / 0.12) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 23 * tm)))


def quill(length=1.6):
    n = int(length * SR); x = bp(rng.standard_normal(n), 3000, 9000) * 0.3
    return x * (0.4 + 0.6 * (np.sin(2 * np.pi * 3.3 * t_(n)) > 0)) * env(n, 0.05, 0.3)


def impact():
    m = int(1.6 * SR); tm = t_(m)
    return reverb(np.sin(2 * np.pi * (38 + 40 * np.exp(-tm / 0.05)) * tm) * np.exp(-tm / 0.5) + bp(rng.standard_normal(m), 100, 1200) * np.exp(-tm / 0.05) * 0.4, 2, 1.0, 0.3)


def musket():
    n = int(2.6 * SR); tt = t_(n)
    crack = bp(rng.standard_normal(n), 300, 7000) * np.exp(-tt / 0.03)
    boom = np.sin(2 * np.pi * (50 + 80 * np.exp(-tt / 0.02)) * tt) * np.exp(-tt / 0.25)
    return reverb(crack * 1.2 + boom, 2.5, 1.2, 0.5)


def volley(k=6, spread=0.5):
    x = np.zeros(int((spread + 3) * SR))
    for i in range(k): place(x, musket() * (0.6 + 0.4 * rng.random()), spread * rng.random())
    return x


def forest(length):
    n = int(length * SR); tt = t_(n)
    x = lp(rng.standard_normal(n), 900) * 0.25
    for k in range(int(length * 0.8)):
        at = rng.random() * (length - 1); m = int(0.35 * SR); tm = t_(m)
        f0 = 2400 + 1600 * rng.random()
        chirp = np.sin(2 * np.pi * np.cumsum(f0 + 600 * np.sin(2 * np.pi * 9 * tm)) / SR) * np.exp(-((tm - 0.12) ** 2) / 0.004)
        place(x, chirp * 0.25, at)
    return x * env(n, 2.0, 2.0)


def rain(length):
    n = int(length * SR)
    x = bp(rng.standard_normal(n), 800, 8000) * 0.5 + lp(rng.standard_normal(n), 300) * 0.4
    for k in range(int(length * 20)): place(x, bp(rng.standard_normal(200), 2000, 9000) * 0.6, rng.random() * length)
    return x * env(n, 1.5, 2.0)


def thunder():
    n = int(5 * SR); tt = t_(n)
    return reverb(lp(rng.standard_normal(n), 200) * np.exp(-tt / 1.6) * (1 + 0.6 * np.sin(2 * np.pi * 3 * tt)), 3, 1.6, 0.3)


def stinger():
    n = int(3.0 * SR); tt = t_(n)
    return reverb(kick(1.0)[: n] if False else np.concatenate([kick(1.0), np.zeros(n - int(0.4 * SR))]) + strings([38, 45, 50], 3.0, 900) * 0.6, 3, 1.5, 0.4)


def whoosh(length=1.4, f0=150, f1=2500):
    n = int(length * SR); x = rng.standard_normal(n); out = np.zeros(n)
    for b in range(40):
        i0, i1 = b * n // 40, (b + 1) * n // 40
        fc = f0 * (f1 / f0) ** (b / 40)
        out[i0:i1] = bp(x[i0:i1], max(30, fc * 0.6), min(20000, fc * 1.5))
    return out * np.sin(np.pi * t_(n) / length) ** 2


def save(name, x):
    x = x / (np.abs(x).max() + 1e-9) * 0.7
    sf.write(OUT / name, x.astype(np.float32), SR, subtype="PCM_16")


def main():
    files = {"paper.wav": paper(), "quill.wav": quill(), "impact.wav": impact(), "musket.wav": musket(), "volley.wav": volley(),
             "forest.wav": forest(14.0), "rain.wav": rain(16.0), "thunder.wav": thunder(), "stinger.wav": stinger(), "whoosh.wav": whoosh(),
             "drum.wav": march_drum(10.0)}
    for k, v in files.items():
        save(k, v)
    CH = [7, 14, 20, 25, 35, 41, 50, 57]
    DOCS = [15, 18, 19, 20, 23, 28, 34, 36, 37, 38, 46, 49, 52, 53, 55]
    cues = [("forest.wav", 0.0, 0.35), ("forest.wav", S[2], 0.3), ("musket.wav", S[4] + 0.3, 0.5), ("volley.wav", S[4] + 0.7, 0.4),
            ("impact.wav", S[6] + 0.4, 0.5), ("whoosh.wav", S[13] - 0.2, 0.2)]
    cues += [("stinger.wav", S[c] + 0.1, 0.45) for c in CH]
    cues += [("paper.wav", S[d] + 0.15, 0.35) for d in DOCS] + [("quill.wav", S[d] + 0.4, 0.25) for d in DOCS]
    cues += [("drum.wav", S[24], 0.25), ("drum.wav", S[43], 0.25), ("drum.wav", S[50], 0.3)]
    cues += [("rain.wav", S[29], 0.4), ("forest.wav", S[30], 0.25), ("musket.wav", word_t(31, "shot"), 0.7), ("volley.wav", word_t(31, "fire") + 0.1, 0.9),
             ("volley.wav", S[32] + 0.2, 0.6), ("musket.wav", S[32] + 2.0, 0.4), ("musket.wav", S[33] + 0.3, 0.3)]
    cues += [("rain.wav", S[44] - 0.5, 0.45), ("rain.wav", S[44] + 14, 0.4), ("thunder.wav", S[44] + 1, 0.45), ("volley.wav", S[44] + 0.5, 0.45), ("volley.wav", S[44] + 3.5, 0.4),
             ("rain.wav", S[46], 0.35), ("impact.wav", word_t(45, "surrendered"), 0.5), ("impact.wav", word_t(47, "assassination"), 0.6), ("impact.wav", word_t(48, "declaration"), 0.45),
             ("impact.wav", word_t(50, "defeats"), 0.5), ("whoosh.wav", S[51], 0.25), ("impact.wav", word_t(55, "stamp"), 0.4), ("impact.wav", word_t(56, "george"), 0.45)]
    (ROOT / "src" / "data" / "sfx-cues.json").write_text(json.dumps([{"file": f, "at": round(a, 3), "volume": v} for f, a, v in cues], indent=1))
    m = score()
    m = m / (np.abs(m).max() + 1e-9) * 10 ** (-3 / 20)
    sf.write(MUS / "score.wav", np.stack([m, m], 1).astype(np.float32), SR, subtype="PCM_16")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(MUS / "score.wav"), "-b:a", "192k", str(MUS / "score.mp3")], check=True)
    print("score", DUR, "s; cues", len(cues))


if __name__ == "__main__":
    main()
