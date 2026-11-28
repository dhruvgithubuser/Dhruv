"""Score + sound design for "The Real Story Behind Operation Valkyrie" (synthesized, seeded, reproducible).

    python scripts/build-audio.py

Reads src/timeline.json. Writes public/audio/score.wav/.mp3, public/audio/sfx/*.wav and src/sfx-cues.json.
Tone: restrained, serious. Low strings and brass under the narration, a clock-like pulse while the bomb waits,
a controlled blast and a beat of silence, tension through the coup, a solemn ending. Music stays below the voice.
"""
import json
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, sosfilt

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
rng = np.random.default_rng(1944)
TL = json.loads((ROOT / "src" / "data" / "timeline.json").read_text())
PH = TL["phrases"]
DUR = float(np.ceil(TL["duration"] + 0.6))
OUT = ROOT / "public" / "assets" / "sound"
MUS = ROOT / "public" / "assets" / "music"
OUT.mkdir(parents=True, exist_ok=True); MUS.mkdir(parents=True, exist_ok=True)


def ph(n):
    return [p for p in PH if p["scene"] == n]


S = {1: 0.0}
for n in range(2, 9):
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




# ---------------------------------------------------------------- score
def strings(ms, length, cutoff=1400):
    n = int(length * SR); x = np.zeros(n); t = t_(n)
    vib = 1 + 0.003 * np.sin(2 * np.pi * 5.2 * t)
    for m in ms:
        for d in (-0.07, 0, 0.07):
            ph = np.cumsum(hz(m) * 2 ** (d / 12) * vib) / SR
            x += 2 * ((ph + rng.random()) % 1) - 1
    return lp(x, cutoff) / (len(ms) * 3) ** 0.5 * env(n, 1.2, 1.8)


def kick(g=1.0):
    m = int(0.4 * SR); tm = t_(m)
    return np.sin(2 * np.pi * (42 + 55 * np.exp(-tm / 0.03)) * tm) * np.exp(-tm / 0.14) * g


def score():
    n = int(DUR * SR); x = np.zeros(n); t = t_(n)
    x += (np.sin(2 * np.pi * hz(36) * t) * 0.5 + lp(rng.standard_normal(n), 140) * 0.35) * (0.6 + 0.2 * np.sin(2 * np.pi * t / 17)) * 0.3
    # C minor string pads under scenes 1-2
    for k, ch in enumerate([[48, 51, 55], [44, 48, 51], [46, 50, 53], [43, 47, 50]]):
        place(x, strings(ch, 5.0), S[1] + k * 4.4, 0.22)
    # waiting bomb: a clock-like pulse from the briefcase placement to the blast
    a, b = word_t(3, "placed"), word_t(4, "explosion")
    tt = a
    while tt < b - 0.1:
        place(x, kick(0.35 + 0.4 * (tt - a) / max(1, b - a)), tt); tt += 0.5
    tens = strings([79, 80], b - a + 0.5, 3000)
    place(x, tens * np.linspace(0.1, 1, len(tens)), a, 0.08)
    # after the blast: low brass swell, coup tension (scenes 5-6)
    for k, ch in enumerate([[36, 43, 48], [34, 41, 46], [36, 43, 48], [35, 42, 47]]):
        place(x, strings(ch, 5.2, 900), S[5] + k * 4.6, 0.26)
    for k in range(int((word_t(6, "alive") - S[5]) / 1.0)):
        place(x, kick(0.45), S[5] + 0.5 + k * 1.0)
    # solemn ending
    for k, ch in enumerate([[41, 48, 53, 56], [39, 46, 51, 55], [36, 43, 48, 51, 55]]):
        place(x, strings(ch, 6.5, 1200), S[7] + k * 5.2, 0.24)
    place(x, piano(48, 6), S[8] + 0.4, 0.2); place(x, piano(55, 6), S[8] + 3.2, 0.16); place(x, piano(60, 7), word_t(8, "stop"), 0.18)
    x = reverb(x, 4.0, 1.7, 0.42)
    # silence right after the blast
    s0 = word_t(4, "explosion") + 0.2
    i0, i1 = int(s0 * SR), int((s0 + 1.3) * SR)
    g = np.ones(n); g[i0:i1] = 0; r = int(0.04 * SR); g[i0 - r:i0] = np.linspace(1, 0, r); g[i1:i1 + int(1.4 * SR)] = np.linspace(0, 1, int(1.4 * SR))
    x *= g
    fade = int(2.5 * SR); x[-fade:] *= np.linspace(1, 0, fade) ** 1.5
    return x


# ---------------------------------------------------------------- sfx
def paper():
    m = int(0.5 * SR); tm = t_(m)
    return bp(rng.standard_normal(m), 1500, 9000) * np.exp(-tm / 0.12) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 23 * tm)))


def typewriter(n_keys=12, gap=0.09):
    x = np.zeros(int((n_keys * gap + 0.4) * SR))
    for k in range(n_keys):
        m = int(0.05 * SR); tm = t_(m)
        place(x, bp(rng.standard_normal(m), 2000, 9000) * np.exp(-tm / 0.006) + np.sin(2 * np.pi * 900 * tm) * np.exp(-tm / 0.01) * 0.3, k * gap * (0.8 + 0.4 * rng.random()))
    return x


def bell(length=2.6):
    """Mechanical telephone: two bell partials struck by a 20 Hz clapper, 1 s on, 0.6 s off."""
    n = int(length * SR); t = t_(n)
    gate = ((t % 1.6) < 1.0).astype(float)
    clap = (np.sin(2 * np.pi * 20 * t) > 0).astype(float)
    tone = np.sin(2 * np.pi * 1150 * t) + 0.6 * np.sin(2 * np.pi * 1630 * t) + 0.3 * np.sin(2 * np.pi * 2880 * t)
    return lp(tone * (0.3 + 0.7 * clap) * gate, 6000) * env(n, 0.01, 0.2)


def impact():
    m = int(1.6 * SR); tm = t_(m)
    return reverb(np.sin(2 * np.pi * (38 + 40 * np.exp(-tm / 0.05)) * tm) * np.exp(-tm / 0.5) + bp(rng.standard_normal(m), 100, 1200) * np.exp(-tm / 0.05) * 0.4, 2, 1.0, 0.3)


def boom(length=5.0):
    n = int(length * SR); t = t_(n)
    body = np.sin(2 * np.pi * np.cumsum(26 + 55 * np.exp(-t / 0.22)) / SR) * np.exp(-t / 1.3)
    crack = bp(rng.standard_normal(n), 150, 6000) * np.exp(-t / 0.2)
    debris = bp(rng.standard_normal(n), 800, 5000) * np.exp(-((t - 0.8) ** 2) / 0.5) * 0.25
    return reverb(body + 0.8 * crack + debris, 3, 1.4, 0.3)


def room(length):
    n = int(length * SR)
    return lp(rng.standard_normal(n), 400) * 0.6 + bp(rng.standard_normal(n), 2000, 4000) * 0.03


def clock(length=6.0):
    n = int(length * SR); x = np.zeros(n); tt = 0.0
    while tt < length - 0.1:
        m = int(0.04 * SR); tm = t_(m)
        place(x, bp(rng.standard_normal(m), 2500, 8000) * np.exp(-tm / 0.005), tt); tt += 0.5
    return x


def plane(length=6.0):
    n = int(length * SR); t = t_(n)
    hum = sum(np.sin(2 * np.pi * f0 * t + rng.random()) / (k + 1) for k, f0 in enumerate((92, 184, 276, 368)))
    return lp(hum * (0.7 + 0.3 * np.sin(2 * np.pi * 1.7 * t)) + lp(rng.standard_normal(n), 600) * 0.5, 1800) * env(n, 1.5, 2.0)


def save(name, x):
    x = x / (np.abs(x).max() + 1e-9) * 0.7
    sf.write(OUT / name, x.astype(np.float32), SR, subtype="PCM_16")


def main():
    files = {"paper.wav": paper(), "typewriter.wav": typewriter(), "bell.wav": bell(), "impact.wav": impact(), "boom.wav": boom(),
             "room.wav": room(DUR) * env(int(DUR * SR), 2, 3), "clock.wav": clock(7.0), "plane.wav": plane(), "whoosh.wav": whoosh()}
    for k, v in files.items():
        save(k, v)
    cues = [
        ("room.wav", 0.0, 0.12), ("impact.wav", 0.15, 0.45), ("paper.wav", word_t(1, "officers") - 0.1, 0.4), ("typewriter.wav", word_t(1, "officers"), 0.25),
        ("paper.wav", S[2], 0.45), ("paper.wav", word_t(2, "colonel") - 0.25, 0.4), ("impact.wav", word_t(2, "briefcase"), 0.3), ("whoosh.wav", word_t(2, "entered"), 0.2),
        ("paper.wav", word_t(2, "wolfs") - 0.2, 0.35),
        ("whoosh.wav", S[3] - 0.2, 0.25), ("clock.wav", word_t(3, "placed"), 0.22), ("impact.wav", word_t(3, "placed") + 0.4, 0.2),
        ("boom.wav", word_t(4, "explosion"), 0.9), ("paper.wav", word_t(4, "survived") - 0.15, 0.4), ("paper.wav", word_t(4, "moved") - 0.3, 0.4),
        ("plane.wav", word_t(5, "rushed") - 0.3, 0.3), ("paper.wav", word_t(5, "valkyrie") - 0.15, 0.45), ("typewriter.wav", word_t(5, "it"), 0.25), ("impact.wav", word_t(5, "secretly") + 0.2, 0.45),
        ("whoosh.wav", word_t(6, "troops") - 0.2, 0.25), ("bell.wav", word_t(6, "then"), 0.4), ("typewriter.wav", word_t(6, "then") + 0.3, 0.2),
        ("impact.wav", word_t(6, "alive"), 0.55), ("impact.wav", word_t(6, "collapsed"), 0.5),
        ("paper.wav", S[7] + 0.3, 0.35), ("impact.wav", word_t(7, "executed"), 0.4),
        ("paper.wav", S[8] + 0.1, 0.35), ("impact.wav", TL["phrases"][-1]["end"] - 0.1, 0.55),
    ]
    (ROOT / "src" / "data" / "sfx-cues.json").write_text(json.dumps([{"file": f, "at": round(a, 3), "volume": v} for f, a, v in cues], indent=1))
    m = score()
    m = m / (np.abs(m).max() + 1e-9) * 10 ** (-3 / 20)
    sf.write(MUS / "score.wav", np.stack([m, m], 1).astype(np.float32), SR, subtype="PCM_16")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(MUS / "score.wav"), "-b:a", "224k", str(MUS / "score.mp3")], check=True)
    print("score", DUR, "s; cues", len(cues))


def whoosh(length=1.4, f0=150, f1=2500):
    n = int(length * SR); x = rng.standard_normal(n); out = np.zeros(n)
    for b in range(40):
        i0, i1 = b * n // 40, (b + 1) * n // 40
        fc = f0 * (f1 / f0) ** (b / 40)
        out[i0:i1] = bp(x[i0:i1], max(30, fc * 0.6), min(20000, fc * 1.5))
    return out * np.sin(np.pi * t_(n) / length) ** 2


if __name__ == "__main__":
    main()
