"""Score + sound design for "AI171: Thirty-Two Seconds" (synthesized, seeded, reproducible).

    python scripts/build-audio.py

Reads src/timeline.json. Writes public/audio/score.wav/.mp3, public/audio/sfx/*.wav and src/sfx-cues.json.
Tone: restrained investigative documentary. Low drone, sparse piano, a pulse through the 32 seconds,
true silence where the recordings end. No crash sound effects.
"""
import json
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, sosfilt

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
rng = np.random.default_rng(171)
TL = json.loads((ROOT / "src" / "timeline.json").read_text())
PH = TL["phrases"]
DUR = float(np.ceil(TL["duration"]))
OUT = ROOT / "public" / "audio"
(OUT / "sfx").mkdir(parents=True, exist_ok=True)


def ph(n):
    return [p for p in PH if p["scene"] == n]


S = {1: 0.0, 3: ph(2)[-1]["end"] + 0.6}
for n in (2, 4, 5, 6, 7, 8, 9, 10, 11, 12):
    S[n] = ph(n)[0]["start"] - 0.5


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


# ---------------------------------------------------------------- score
def score():
    n = int(DUR * SR); x = np.zeros(n); t = t_(n)
    # low drone A1/E2 through the whole film, breathing
    drone = (np.sin(2 * np.pi * hz(33) * t) * 0.6 + np.sin(2 * np.pi * hz(40) * t) * 0.35 + lp(rng.standard_normal(n), 180) * 0.3)
    drone *= 0.55 + 0.25 * np.sin(2 * np.pi * t / 23)
    x += drone * 0.32
    # sparse piano motif in the opening and the epilogue (A minor: A C E / F E D C)
    motif = [69, 72, 76, 74, 72, 71, 69]
    for k, m in enumerate(motif * 2):
        place(x, piano(m), 4.0 + k * 2.4, 0.18)
    for k, m in enumerate([77, 76, 74, 72, 69, 72, 71, 69]):
        place(x, piano(m, 5), S[12] + 0.5 + k * 2.2, 0.2)
    # pads: Am | F | C | G in the flight chapter; darker Dm | Am later
    for k, ch in enumerate([[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]] * 2):
        place(x, pad(ch, 6.5, 1100), S[4] + k * 5.5, 0.22)
    for k, ch in enumerate([[50, 53, 57], [45, 48, 52]] * 6):
        place(x, pad(ch, 7.0, 700), S[10] + k * 6.0, 0.24)
    # the 32 seconds: a pulse (60 bpm) from the cutoff to the end of the recordings, rising
    cut, stop = word_t(7, "cutoff"), word_t(9, "stopped")
    k = 0; tt = cut
    while tt < stop + 0.4:
        m = int(0.22 * SR); tm = t_(m)
        thump = np.sin(2 * np.pi * (50 + 40 * np.exp(-tm / 0.03)) * tm) * np.exp(-tm / 0.09)
        place(x, thump, tt, 0.5 + 0.4 * (tt - cut) / (stop - cut))
        tt += 1.0; k += 1
    # high sustained string-like tension over the 32 seconds
    tens = pad([81, 82], stop - cut + 1.0, 2400)
    place(x, tens * np.linspace(0.2, 1, len(tens)), cut, 0.12)
    # title swell
    sw = pad([45, 52, 57, 64], 5.0, 1800) * np.linspace(0, 1, int(5.0 * SR)) ** 2
    place(x, sw, S[3] - 3.5, 0.35)
    x = reverb(x, 4.0, 1.6, 0.4)
    # silence where the recordings end (2.5 s), then the drone returns
    a, b = int((stop + 0.15) * SR), int((stop + 2.6) * SR)
    g = np.ones(n); g[a:b] = 0.0
    ramp = int(0.08 * SR); g[a - ramp:a] = np.linspace(1, 0, ramp); g[b:b + int(1.5 * SR)] = np.linspace(0, 1, int(1.5 * SR))
    x *= g
    fade = int(4 * SR); x[-fade:] *= np.linspace(1, 0, fade) ** 1.5
    return x


# ---------------------------------------------------------------- sfx
def whoosh(length=3.0, f0=150, f1=2500):
    n = int(length * SR); x = rng.standard_normal(n); out = np.zeros(n)
    for b in range(48):
        i0, i1 = b * n // 48, (b + 1) * n // 48
        fc = f0 * (f1 / f0) ** (b / 48)
        out[i0:i1] = bp(x[i0:i1], max(30, fc * 0.6), min(20000, fc * 1.5))
    return out * np.sin(np.pi * t_(n) / length) ** 2


def airport(length=20.0):
    n = int(length * SR); t = t_(n)
    murmur = bp(rng.standard_normal(n), 250, 1800) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 0.37 * t + rng.random(n) * 0.2)))
    hvac = lp(rng.standard_normal(n), 300) * 0.5
    x = murmur * 0.4 + hvac
    for k, (f, at) in enumerate(((784, 6.0), (659, 6.45))):  # two-tone PA chime
        m = int(1.6 * SR); place(x, np.sin(2 * np.pi * f * t_(m)) * np.exp(-t_(m) / 0.5) * 0.4, at)
    return reverb(x * env(n, 1.5, 2.5), 2.5, 1.0, 0.3)


def jet(length=12.0, rise=True):
    n = int(length * SR); t = t_(n)
    roar = lp(rng.standard_normal(n), 1400) + 0.4 * bp(rng.standard_normal(n), 2500, 6000)
    whine = sum(np.sin(2 * np.pi * np.cumsum(np.full(n, f) * (1 + 0.4 * (t / length if rise else 1))) / SR) for f in (900, 1350)) * 0.05
    e = (t / length) ** 0.6 if rise else np.ones(n)
    return (roar * 0.5 + whine) * e * env(n, 0.5, 2.5)


def click():
    m = int(0.06 * SR)
    return bp(rng.standard_normal(m), 1500, 8000) * np.exp(-t_(m) / 0.006) + np.sin(2 * np.pi * 180 * t_(m)) * np.exp(-t_(m) / 0.02) * 0.6


def radio(length=3.0):
    n = int(length * SR)
    x = bp(rng.standard_normal(n), 400, 3500) * 0.5
    sq = int(0.12 * SR); x[:sq] += bp(rng.standard_normal(sq), 1500, 6000) * 1.5
    return x * env(n, 0.01, 0.4)


def sirens(length=10.0):
    n = int(length * SR); t = t_(n)
    f = 650 + 250 * (0.5 - 0.5 * np.cos(2 * np.pi * t / 1.4))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.6 * np.sin(2 * np.pi * np.cumsum(f * 1.12) / SR + 1)
    return reverb(lp(x, 2500) * env(n, 2, 3) * 0.4, 3, 1.5, 0.7)


def boom(length=5.0):
    n = int(length * SR); t = t_(n)
    return reverb(np.sin(2 * np.pi * np.cumsum(28 + 40 * np.exp(-t / 0.3)) / SR) * np.exp(-t / 1.4), 3, 1.5, 0.3)


def save(name, x):
    x = x / (np.abs(x).max() + 1e-9) * 0.7
    sf.write(OUT / "sfx" / name, x.astype(np.float32), SR, subtype="PCM_16")


def main():
    files = {"whoosh.wav": whoosh(), "airport.wav": airport(), "jet-roll.wav": jet(), "click.wav": click(), "radio.wav": radio(),
             "sirens.wav": sirens(), "boom.wav": boom(), "wind.wav": lp(rng.standard_normal(int(14 * SR)), 500) * env(int(14 * SR), 3, 4)}
    for k, v in files.items():
        save(k, v)
    cut = word_t(7, "cutoff")
    cues = [
        ("wind.wav", 0.0, 0.5), ("whoosh.wav", 1.0, 0.35),
        ("airport.wav", S[2] + 4.5, 0.45),
        ("jet-roll.wav", ph(2)[1]["start"] - 1.0, 0.35),
        ("boom.wav", S[3] + 0.1, 0.6),
        ("whoosh.wav", S[4] - 1.0, 0.3),
        ("jet-roll.wav", ph(6)[1]["start"], 0.45),
        ("click.wav", cut, 0.8), ("click.wav", cut + 1.0, 0.8),
        ("click.wav", word_t(7, "run", 1), 0.7), ("click.wav", word_t(7, "second", 1), 0.7),
        ("radio.wav", word_t(8, "mayday") - 0.2, 0.5),
        ("sirens.wav", ph(10)[3]["start"] - 1.0, 0.28),
        ("whoosh.wav", S[11] - 0.8, 0.25),
        ("wind.wav", S[12], 0.35),
    ]
    (ROOT / "src" / "sfx-cues.json").write_text(json.dumps([{"file": f, "at": round(a, 3), "volume": v} for f, a, v in cues], indent=1))
    m = score()
    m = m / (np.abs(m).max() + 1e-9) * 10 ** (-3 / 20)
    sf.write(OUT / "score.wav", np.stack([m, m], 1).astype(np.float32), SR, subtype="PCM_16")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(OUT / "score.wav"), "-b:a", "224k", str(OUT / "score.mp3")], check=True)
    print("score", DUR, "s; cues", len(cues), "; cutoff at", round(cut, 2))


if __name__ == "__main__":
    main()
