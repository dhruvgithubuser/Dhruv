"""Score + sound design for "America's Biggest Win of 1812 Came After the Peace Treaty" (synthesized, seeded, reproducible).

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
rng = np.random.default_rng(1815)
TL = json.loads((ROOT / "src" / "data" / "timeline.json").read_text())
PH = TL["phrases"]
DUR = float(np.ceil(TL["duration"]))
OUT = ROOT / "public" / "assets" / "sound"
MUS = ROOT / "public" / "assets" / "music"
OUT.mkdir(parents=True, exist_ok=True); MUS.mkdir(parents=True, exist_ok=True)


def ph(n):
    return [p for p in PH if p["scene"] == n]


S = {1: 0.0}
for n in range(2, 12):
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


def whoosh(length=1.4, f0=150, f1=2500):
    n = int(length * SR); x = rng.standard_normal(n); out = np.zeros(n)
    for b in range(40):
        i0, i1 = b * n // 40, (b + 1) * n // 40
        fc = f0 * (f1 / f0) ** (b / 40)
        out[i0:i1] = bp(x[i0:i1], max(30, fc * 0.6), min(20000, fc * 1.5))
    return out * np.sin(np.pi * t_(n) / length) ** 2



def score():
    n = int(DUR * SR); x = np.zeros(n); t = t_(n)
    x += (np.sin(2 * np.pi * hz(38) * t) * 0.45 + lp(rng.standard_normal(n), 130) * 0.3) * 0.26
    def pads(start, end, chords, cutoff=1300, g=0.2, step=4.6):
        tt, k = start, 0
        while tt < end - 1: place(x, strings(chords[k % len(chords)], min(step + 1.5, end - tt + 1), cutoff), tt, g); tt += step; k += 1
    pads(0, S[4], [[50, 54, 57], [47, 50, 54], [45, 49, 52], [43, 47, 50]], 1500, 0.18)   # stately D major: the peace
    pads(S[4], S[7], [[38, 45, 50], [36, 43, 48], [34, 41, 46]], 1000, 0.22)            # threat
    place(x, march_drum(S[9] - S[7]), S[7], 0.6)                                          # the advance
    pads(S[7], S[9], [[38, 45, 48], [36, 43, 46], [34, 41, 45]], 900, 0.24, 3.6)
    pads(S[9], DUR, [[50, 54, 57, 62], [47, 54, 59, 62], [43, 50, 55, 59], [50, 54, 57, 62]], 1700, 0.22)  # resolve
    for k, m in enumerate([62, 66, 69, 74]): place(x, piano(m, 6), S[11] + 0.5 + k * 1.6, 0.14)
    x = reverb(x, 4.0, 1.7, 0.4)
    fade = int(2.5 * SR); x[-fade:] *= np.linspace(1, 0, fade) ** 1.5
    return x


def paper():
    m = int(0.5 * SR); tm = t_(m)
    return bp(rng.standard_normal(m), 1500, 9000) * np.exp(-tm / 0.12) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 23 * tm)))
def quill(length=1.6):
    n = int(length * SR); return bp(rng.standard_normal(n), 3000, 9000) * 0.3 * (0.4 + 0.6 * (np.sin(2 * np.pi * 3.3 * t_(n)) > 0)) * env(n, 0.05, 0.3)
def impact():
    m = int(1.6 * SR); tm = t_(m)
    return reverb(np.sin(2 * np.pi * (38 + 40 * np.exp(-tm / 0.05)) * tm) * np.exp(-tm / 0.5) + bp(rng.standard_normal(m), 100, 1200) * np.exp(-tm / 0.05) * 0.4, 2, 1.0, 0.3)
def musket():
    n = int(2.6 * SR); tt = t_(n)
    return reverb(bp(rng.standard_normal(n), 300, 7000) * np.exp(-tt / 0.03) * 1.2 + np.sin(2 * np.pi * (50 + 80 * np.exp(-tt / 0.02)) * tt) * np.exp(-tt / 0.25), 2.5, 1.2, 0.5)
def volley(k=8, spread=0.6):
    x = np.zeros(int((spread + 3) * SR))
    for i in range(k): place(x, musket() * (0.6 + 0.4 * rng.random()), spread * rng.random())
    return x
def cannon():
    n = int(4 * SR); tt = t_(n)
    return reverb(np.sin(2 * np.pi * np.cumsum(30 + 60 * np.exp(-tt / 0.15)) / SR) * np.exp(-tt / 0.9) + bp(rng.standard_normal(n), 100, 3000) * np.exp(-tt / 0.08), 3, 1.4, 0.4)
def sea(length=6.0):
    n = int(length * SR); tt = t_(n)
    waves = lp(rng.standard_normal(n), 600) * (0.5 + 0.5 * np.sin(2 * np.pi * tt / 2.2) ** 2)
    creak = np.zeros(n)
    for k in range(int(length / 1.6)):
        m = int(0.5 * SR); tm = t_(m); place(creak, np.sin(2 * np.pi * np.cumsum(180 + 60 * np.sin(2 * np.pi * 3 * tm)) / SR) * np.exp(-((tm - 0.25) ** 2) / 0.02) * 0.3, k * 1.6 + 0.4)
    return (waves + creak) * env(n, 1.0, 1.5)
def save(name, x):
    x = x / (np.abs(x).max() + 1e-9) * 0.7
    sf.write(OUT / name, x.astype(np.float32), SR, subtype="PCM_16")
def main():
    files = {"paper.wav": paper(), "quill.wav": quill(), "impact.wav": impact(), "volley.wav": volley(), "cannon.wav": cannon(), "sea.wav": sea(), "whoosh.wav": whoosh(), "drum.wav": march_drum(6.0)}
    for k, v in files.items(): save(k, v)
    cues = [("impact.wav", 0.2, 0.45), ("paper.wav", word_t(1, "treaty") - 0.1, 0.3), ("impact.wav", word_t(1, "after"), 0.4),
            ("paper.wav", S[2] + 0.3, 0.4), ("quill.wav", word_t(2, "signed") - 0.3, 0.35), ("impact.wav", word_t(2, "signed") + 0.2, 0.45),
            ("sea.wav", S[3], 0.4), ("paper.wav", word_t(3, "america") - 0.2, 0.3),
            ("whoosh.wav", S[4] - 0.2, 0.25), ("drum.wav", S[4] + 0.3, 0.3),
            ("paper.wav", word_t(5, "regulars") - 0.1, 0.25), ("paper.wav", word_t(5, "black") - 0.1, 0.25), ("paper.wav", word_t(5, "lafittes") - 0.1, 0.25),
            ("impact.wav", word_t(6, "waited"), 0.35),
            ("cannon.wav", word_t(7, "guns") - 0.2, 0.7), ("volley.wav", word_t(7, "guns"), 0.75),
            ("volley.wav", S[8] + 0.3, 0.6), ("cannon.wav", S[8] + 1.2, 0.5), ("volley.wav", S[8] + 2.6, 0.45), ("impact.wav", word_t(8, "two"), 0.45), ("impact.wav", word_t(8, "dead"), 0.55),
            ("impact.wav", word_t(9, "seventyone"), 0.55), ("paper.wav", S[10] + 0.2, 0.3), ("impact.wav", word_t(10, "february"), 0.45),
            ("impact.wav", word_t(11, "hero"), 0.4), ("impact.wav", word_t(11, "president"), 0.5)]
    (ROOT / "src" / "data" / "sfx-cues.json").write_text(json.dumps([{"file": f, "at": round(a, 3), "volume": v} for f, a, v in cues], indent=1))
    m = score(); m = m / (np.abs(m).max() + 1e-9) * 10 ** (-3 / 20)
    sf.write(MUS / "score.wav", np.stack([m, m], 1).astype(np.float32), SR, subtype="PCM_16")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(MUS / "score.wav"), "-b:a", "192k", str(MUS / "score.mp3")], check=True)
    print("score", DUR, "s; cues", len(cues))

if __name__ == "__main__":
    main()
