"""Score + sound design for "A Storm Hit Washington the Day After Britain Burned It" (synthesized, seeded, reproducible).

    python3 scripts/build-audio.py

Reads src/data/timeline.json. Writes public/assets/music/score.wav/.mp3, public/assets/sound/*.wav and src/data/sfx-cues.json.
Tone: Vox explainer. A muted plucked arpeggio and soft kick drive the story, the pulse drops out for the storm
(low pad, rain, thunder, tornado wind), then lifts into C major for Baltimore and the myth-buster ending.
"""
import json
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, sosfilt

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
rng = np.random.default_rng(1814)
TL = json.loads((ROOT / "src" / "data" / "timeline.json").read_text())
PH = TL["phrases"]
DUR = float(np.ceil(TL["duration"]))
OUT = ROOT / "public" / "assets" / "sound"
MUS = ROOT / "public" / "assets" / "music"
OUT.mkdir(parents=True, exist_ok=True); MUS.mkdir(parents=True, exist_ok=True)


def ph(n):
    return [p for p in PH if p["scene"] == n]


S = {1: 0.0}
for n in range(2, 14):
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


# ---------------------------------------------------------------- score
BEAT = 60 / 96


def pluck(m, length=0.9, g=1.0):
    n = int(length * SR); t = t_(n); f = hz(m)
    x = sum(a * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (6 + 3 * k)) for k, a in ((1, 1), (2, .5), (3, .2)))
    return lp(x, 3500) * (1 - np.exp(-t / 0.002)) * g


def hat(g=1.0):
    m = int(0.06 * SR); return hp(rng.standard_normal(m), 7000) * np.exp(-t_(m) / 0.012) * g


def score():
    n = int(DUR * SR); x = np.zeros(n)
    def pads(start, end, chords, cutoff=1300, g=0.2, step=4 * BEAT * 2):
        tt, k = start, 0
        while tt < end - 0.5:
            place(x, pad(chords[k % len(chords)], min(step + 1.2, end - tt + 1), cutoff), tt, g); tt += step; k += 1
    def arp(start, end, chords, g=0.16, kickg=0.35, hats=True, octave=12):
        tt, k = start, 0
        while tt < end - 0.05:
            ch = chords[int((tt - start) / (8 * BEAT)) % len(chords)]
            notes = [ch[0] + octave, ch[1] + octave, ch[2] + octave, ch[1] + octave + 12]
            place(x, pluck(notes[k % 4], 0.8), tt, g * (1.0 if k % 2 == 0 else 0.7))
            if kickg and k % 4 == 0: place(x, kick(kickg), tt)
            if hats and k % 2 == 1: place(x, hat(0.08), tt)
            tt += BEAT / 2; k += 1
    AM = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
    storm0, storm1 = S[7], S[9]
    # hook: tension (no kick until the first downbeat after "the sky")
    pads(0, S[2], [[45, 52, 57], [41, 48, 53]], 900, 0.22)
    arp(0.4, S[2], AM[:1] + AM[1:2], g=0.11, kickg=0, hats=False)
    # the march on Washington: driving explainer pulse
    pads(S[2], storm0, [[45, 52, 57], [41, 48, 53], [36, 43, 48], [43, 50, 55]], 1200, 0.16)
    arp(S[2], storm0 - 0.3, AM, g=0.15, kickg=0.38)
    # the storm: pulse drops, low dark pad
    pads(storm0, storm1, [[33, 40, 45], [29, 36, 41], [31, 38, 43]], 650, 0.3, 4.0)
    # Cockburn + 26 hours: sparse plucks over a pad
    pads(storm1, S[11], [[45, 52, 57], [41, 48, 53]], 1000, 0.18)
    arp(storm1, S[11], [[57, 60, 64], [53, 57, 60]], g=0.1, kickg=0, hats=False)
    # the verdict: half-time
    pads(S[11], S[12], [[41, 48, 53], [43, 50, 55]], 1100, 0.18)
    arp(S[11], S[12], [[53, 57, 60], [55, 59, 62]], g=0.12, kickg=0.25, hats=False)
    # Baltimore → the myth: lift into C major
    CM = [[48, 52, 55], [55, 59, 62], [57, 60, 64], [53, 57, 60]]
    pads(S[12], DUR, [[36, 43, 48, 52], [43, 50, 55, 59], [45, 52, 57, 60], [41, 48, 53, 57]], 1600, 0.2)
    arp(S[12], DUR - 1.5, CM, g=0.16, kickg=0.4)
    x = reverb(x, 2.5, 1.0, 0.3)
    fade = int(2.5 * SR); x[-fade:] *= np.linspace(1, 0, fade) ** 1.5
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




def fire(length=6.0):
    n = int(length * SR); x = lp(rng.standard_normal(n), 500) * 0.35
    for k in range(int(length * 30)):
        m = int(0.012 * SR); place(x, bp(rng.standard_normal(m), 1500, 8000) * np.exp(-t_(m) / 0.003) * (0.3 + rng.random()), rng.random() * length)
    return x * env(n, 0.6, 1.2)


def pop():
    m = int(0.12 * SR); tm = t_(m)
    return np.sin(2 * np.pi * (300 + 500 * np.exp(-tm / 0.01)) * tm) * np.exp(-tm / 0.03) + bp(rng.standard_normal(m), 2000, 6000) * np.exp(-tm / 0.01) * 0.3


def marker(length=0.45):
    n = int(length * SR); tm = t_(n)
    return bp(rng.standard_normal(n), 2500, 6000) * (0.6 + 0.4 * np.sin(2 * np.pi * 14 * tm)) * env(n, 0.03, 0.1)


def stamp():
    m = int(0.6 * SR); tm = t_(m)
    return np.sin(2 * np.pi * (70 + 60 * np.exp(-tm / 0.02)) * tm) * np.exp(-tm / 0.12) + bp(rng.standard_normal(m), 300, 3000) * np.exp(-tm / 0.02) * 0.6


def tick():
    m = int(0.03 * SR); return bp(rng.standard_normal(m), 3000, 9000) * np.exp(-t_(m) / 0.004)


def ticks(length=1.2, rate=18):
    x = np.zeros(int(length * SR))
    for k in range(int(length * rate)): place(x, tick(), k / rate, 0.5 + 0.5 * k / (length * rate))
    return x


def wind(length=7.0):
    n = int(length * SR); tm = t_(n); x = rng.standard_normal(n)
    sweep = 450 + 220 * np.sin(2 * np.pi * 0.7 * tm) + 120 * np.sin(2 * np.pi * 2.3 * tm)
    out = np.zeros(n)
    for b in range(70):
        i0, i1 = b * n // 70, (b + 1) * n // 70
        fc = float(sweep[(i0 + i1) // 2]); out[i0:i1] = bp(x[i0:i1], fc * 0.5, fc * 1.6)
    return (out + lp(rng.standard_normal(n), 90) * 0.8) * env(n, 1.0, 1.5)


def clock(length=4.0):
    x = np.zeros(int(length * SR))
    for k in range(int(length * 2)): place(x, tick() * 1.5, k * 0.5)
    return x


def main():
    files = {"paper.wav": paper(), "impact.wav": impact(), "rain.wav": rain(16.0), "thunder.wav": thunder(), "whoosh.wav": whoosh(0.5, 300, 4000),
             "fire.wav": fire(), "pop.wav": pop(), "marker.wav": marker(), "stamp.wav": stamp(), "ticks.wav": ticks(), "wind.wav": wind(), "clock.wav": clock()}
    for k, v in files.items():
        save(k, v)
    w = word_t
    cues = [("impact.wav", 0.15, 0.4), ("paper.wav", 0.1, 0.4), ("fire.wav", w(1, "burned") - 0.2, 0.35), ("marker.wav", w(1, "washington") + 0.2, 0.3),
            ("thunder.wav", w(1, "sky") - 0.2, 0.6), ("rain.wav", w(1, "sky"), 0.35)]
    cues += [("whoosh.wav", S[n] - 0.05, 0.35) for n in range(2, 14)]
    cues += [("pop.wav", w(2, "british") - 0.4, 0.4), ("ticks.wav", w(2, "4500"), 0.25), ("ticks.wav", w(2, "6000"), 0.25), ("marker.wav", w(2, "mocked") + 0.3, 0.35), ("whoosh.wav", w(2, "mocked"), 0.25)]
    cues += [("pop.wav", w(3, "president") - 0.3, 0.4), ("stamp.wav", w(3, "fled") - 0.25, 0.6)]
    cues += [("fire.wav", w(4, "torched"), 0.4), ("ticks.wav", w(4, "3000") - 0.1, 0.25), ("fire.wav", w(4, "books") - 0.2, 0.45)]
    cues += [("paper.wav", w(5, "dinner") - 0.2, 0.4), ("marker.wav", w(5, "ate"), 0.3), ("stamp.wav", w(5, "ate") + 0.25, 0.5), ("fire.wav", w(5, "burned"), 0.4)]
    cues += [("fire.wav", S[6], 0.5)]
    cues += [("thunder.wav", w(7, "black") - 0.1, 0.75), ("thunder.wav", w(7, "storm") + 0.05, 0.6), ("rain.wav", w(7, "storm") - 0.2, 0.6)]
    cues += [("wind.wav", w(8, "tornado") - 0.3, 0.55), ("rain.wav", S[8], 0.45), ("impact.wav", w(8, "lifting") + 1.3, 0.45), ("thunder.wav", S[8] + 3.5, 0.35)]
    cues += [("paper.wav", S[9] + 0.1, 0.4), ("marker.wav", S[9] + 0.95, 0.3), ("paper.wav", w(9, "is") - 0.2, 0.35), ("marker.wav", w(9, "infernal"), 0.35), ("rain.wav", S[9], 0.15)]
    cues += [("clock.wav", w(10, "occupation") - 0.2, 0.35)]
    cues += [("marker.wav", w(11, "save"), 0.3), ("paper.wav", w(11, "historians") - 0.3, 0.35), ("marker.wav", w(11, "no"), 0.35), ("stamp.wav", w(11, "no") + 0.15, 0.5), ("paper.wav", w(11, "british") - 0.3, 0.35)]
    cues += [("stamp.wav", w(12, "failed") + 0.1, 0.55), ("impact.wav", w(12, "failed"), 0.35), ("paper.wav", w(12, "inspiring") - 0.25, 0.4), ("marker.wav", w(12, "starspangled"), 0.3)]
    cues += [("paper.wav", S[13] + 0.1, 0.35), ("stamp.wav", w(13, "marks") + 0.15, 0.6), ("ticks.wav", w(13, "it"), 0.2), ("impact.wav", w(13, "1798"), 0.35)]
    (ROOT / "src" / "data" / "sfx-cues.json").write_text(json.dumps([{"file": f, "at": round(a, 3), "volume": v} for f, a, v in cues], indent=1))
    m = score()
    m = m / (np.abs(m).max() + 1e-9) * 10 ** (-3 / 20)
    sf.write(MUS / "score.wav", np.stack([m, m], 1).astype(np.float32), SR, subtype="PCM_16")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(MUS / "score.wav"), "-b:a", "192k", str(MUS / "score.mp3")], check=True)
    print("score", DUR, "s; cues", len(cues))


if __name__ == "__main__":
    main()
