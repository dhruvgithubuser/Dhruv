"""Score + sound design for "The Ghost Army (3D documentary)" (synthesized, seeded, reproducible).

    python3 scripts/build-audio.py

Tone: playful spy caper. Muted plucks in D minor (light and sneaky) for the reveal, a driving explainer pulse for
the Ghost Army's toolkit, low tension for Operation Viersen, then a warm D-major lift for the medal and the ending.
SFX: bicycle bell, air hiss (inflation), Morse beeps, a loudspeaker tank rumble, stamps, counters.
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
DUR = float(np.ceil(TL["duration"]))
OUT = ROOT / "public" / "assets" / "sound"
MUS = ROOT / "public" / "assets" / "music"
OUT.mkdir(parents=True, exist_ok=True); MUS.mkdir(parents=True, exist_ok=True)


def ph(n):
    return [p for p in PH if p["scene"] == n]


S = {1: 0.0}
for n in range(2, 17):
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
    def pads(start, end, chords, cutoff=1300, g=0.2, step=8 * BEAT):
        tt, k = start, 0
        while tt < end - 0.5:
            place(x, strings(chords[k % len(chords)], min(step + 1.5, end - tt + 1), cutoff), tt, g); tt += step; k += 1
    def arp(start, end, chords, g=0.16, kickg=0.35, hats=True, octave=12):
        tt, k = start, 0
        while tt < end - 0.05:
            ch = chords[int((tt - start) / (8 * BEAT)) % len(chords)]
            place(x, pluck(ch[(0, 2, 1, 2)[k % 4]] + octave, 0.7), tt, g * (1.0 if k % 2 == 0 else 0.6))
            if kickg and k % 4 == 0: place(x, kick(kickg), tt)
            if hats and k % 2 == 1: place(x, hat(0.06), tt)
            tt += BEAT / 2; k += 1
    DM = [[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]]
    # 1-4: cinematic opening, low strings + sneaky plucks, reveal
    pads(0, S[5], [[38, 45, 50], [34, 41, 46], [36, 43, 48], [33, 40, 45]], 900, 0.22)
    arp(0.5, S[4], DM[:2], g=0.1, kickg=0, hats=False)
    for k_, m in enumerate([62, 65, 69]): place(x, piano(m, 4), S[4] + 0.2 + k_ * 0.35, 0.12)
    # 5-10: the unit and its tricks: driving documentary pulse
    pads(S[5], S[11], [[38, 45, 50], [34, 41, 46], [41, 48, 53], [36, 43, 48]], 1300, 0.17)
    arp(S[5], S[11] - 0.2, DM, g=0.14, kickg=0.36)
    # 11-13: the Rhine, building tension
    pads(S[11], S[14], [[26, 33, 38], [27, 34, 39], [26, 33, 38], [29, 36, 41]], 800, 0.3)
    tt = S[11]
    while tt < S[14] - 0.2:
        place(x, kick(0.25 + 0.45 * (tt - S[11]) / (S[14] - S[11])), tt); tt += BEAT
    arp(S[12] + 2, S[14], [[50, 53, 57]], g=0.07, kickg=0, hats=True, octave=0)
    # 14-16: secrecy -> honour: warm D major lift
    pads(S[14], DUR, [[38, 45, 50, 54], [43, 50, 55, 59], [35, 42, 47, 50], [45, 52, 57, 61]], 1700, 0.22)
    arp(S[15], DUR - 1.5, [[50, 54, 57], [55, 59, 62], [47, 50, 54], [57, 61, 64]], g=0.14, kickg=0.34)
    for k_, m in enumerate([62, 66, 69, 74]): place(x, piano(m, 5), S[15] + 0.3 + k_ * 0.5, 0.12)
    x = reverb(x, 2.8, 1.2, 0.32)
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


def bell():
    m = int(1.2 * SR); tm = t_(m)
    return sum(np.sin(2 * np.pi * f0 * tm) * np.exp(-tm * d) * g for f0, d, g in ((2100, 5, 1), (2650, 7, .6), (4200, 9, .3)))


def hiss(length=1.4):
    n = int(length * SR); out = np.zeros(n); x = rng.standard_normal(n)
    for b in range(30):
        i0, i1 = b * n // 30, (b + 1) * n // 30; fc = 1500 + 4000 * b / 30
        out[i0:i1] = bp(x[i0:i1], fc * 0.6, min(18000, fc * 1.4))
    return out * env(n, 0.15, 0.25)


def morse(code="-.-. --.- -.. . ...- ..--- ...-- .-. -.. ...-- -....", unit=0.06):
    seq = []
    for ch in code:
        if ch == '.': seq += [(1, 1), (0, 1)]
        elif ch == '-': seq += [(1, 3), (0, 1)]
        else: seq += [(0, 3)]
    x = np.zeros(int(sum(d for _, d in seq) * unit * SR) + SR // 10); t0 = 0
    for on, d in seq:
        m = int(d * unit * SR)
        if on: x[t0:t0 + m] += np.sin(2 * np.pi * 720 * t_(m)) * env(m, 0.004, 0.004)
        t0 += m
    return x


def rumble(length=4.0):
    n = int(length * SR); tm = t_(n)
    eng = lp(rng.standard_normal(n), 120) * (1 + 0.5 * np.sin(2 * np.pi * 9 * tm)) + np.sin(2 * np.pi * 38 * tm) * 0.4
    clank = np.zeros(n)
    for k in range(int(length * 7)): place(clank, bp(rng.standard_normal(1200), 800, 3000) * np.exp(-t_(1200) / 0.01), k / 7 + 0.02 * rng.random(), 0.5)
    return bp(eng + clank, 60, 3500) * env(n, 0.4, 0.8)


def main():
    files = {"paper.wav": paper(), "impact.wav": impact(), "whoosh.wav": whoosh(0.7, 200, 3000), "pop.wav": pop(), "stamp.wav": stamp(),
             "ticks.wav": ticks(), "bell.wav": bell(), "hiss.wav": hiss(), "morse.wav": morse(), "rumble.wav": rumble(5.0), "clock.wav": clock(2.5),
             "wind.wav": wind(8.0), "plane.wav": rumble(6.0)}
    for k, v in files.items():
        save(k, v)
    w = word_t
    cues = [("wind.wav", 0.0, 0.25), ("bell.wav", w(1, "bicycles") - 0.2, 0.3), ("bell.wav", w(1, "stopped"), 0.25), ("rumble.wav", w(1, "four") - 0.5, 0.2), ("impact.wav", w(1, "picked"), 0.3)]
    cues += [("whoosh.wav", S[n] - 0.15, 0.28) for n in range(2, 17)]
    cues += [("ticks.wav", w(2, "33"), 0.25), ("rumble.wav", S[2], 0.25)]
    cues += [("pop.wav", w(3, "americans") - 0.3, 0.3)]
    cues += [("hiss.wav", w(4, "rubber") - 0.3, 0.5), ("impact.wav", w(4, "rubber"), 0.35), ("paper.wav", w(4, "93") - 0.4, 0.35), ("ticks.wav", w(4, "93"), 0.25)]
    cues += [("paper.wav", S[5] + 0.1, 0.4), ("stamp.wav", w(5, "secret"), 0.55), ("impact.wav", w(5, "ghost") - 0.1, 0.45)]
    cues += [("ticks.wav", S[6] + 0.1, 0.25), ("pop.wav", w(6, "artists"), 0.3), ("pop.wav", w(6, "designers"), 0.3), ("pop.wav", w(6, "ad"), 0.3), ("wind.wav", w(6, "believe") - 0.5, 0.3), ("ticks.wav", w(6, "were"), 0.25)]
    cues += [("pop.wav", w(7, "air"), 0.35), ("morse.wav", w(7, "radio"), 0.2), ("pop.wav", w(7, "spies"), 0.35), ("stamp.wav", w(7, "faked"), 0.45), ("stamp.wav", w(7, "all"), 0.4), ("stamp.wav", w(7, "three"), 0.4)]
    cues += [("hiss.wav", w(8, "tanks") - 0.3, 0.45), ("hiss.wav", w(8, "trucks") - 0.3, 0.4), ("hiss.wav", w(8, "artillery") - 0.3, 0.4), ("rumble.wav", w(8, "bulldozer") - 0.3, 0.4), ("plane.wav", w(8, "reconnaissance") - 2.0, 0.3), ("paper.wav", w(8, "photos"), 0.3)]
    cues += [("morse.wav", S[9] + 0.3, 0.3), ("morse.wav", w(9, "style"), 0.25)]
    cues += [("rumble.wav", w(10, "played") - 0.2, 0.5), ("ticks.wav", w(10, "15"), 0.25), ("pop.wav", w(10, "patches"), 0.3), ("pop.wav", w(10, "talked"), 0.3)]
    cues += [("ticks.wav", w(11, "twenty") - 0.3, 0.25)]
    cues += [("impact.wav", w(12, "march"), 0.3), ("hiss.wav", w(12, "faked") - 0.2, 0.35), ("pop.wav", w(12, "two"), 0.3), ("pop.wav", w(12, "divisions"), 0.3), ("ticks.wav", w(12, "600") - 0.3, 0.3)]
    cues += [("whoosh.wav", w(13, "bait") - 0.4, 0.35), ("whoosh.wav", w(13, "real"), 0.35), ("paper.wav", w(13, "real") + 0.3, 0.3), ("stamp.wav", w(13, "resistance"), 0.55)]
    cues += [("stamp.wav", w(14, "classified"), 0.55), ("ticks.wav", w(14, "for"), 0.2), ("stamp.wav", w(14, "1996"), 0.55)]
    cues += [("impact.wav", w(15, "2022") - 0.2, 0.35), ("bell.wav", w(15, "medal"), 0.35), ("pop.wav", w(15, "rubber"), 0.25), ("pop.wav", w(15, "sound"), 0.25), ("pop.wav", w(15, "imagination"), 0.3)]
    cues += [("wind.wav", S[16], 0.25), ("hiss.wav", w(16, "fallen"), 0.2)]
    (ROOT / "src" / "data" / "sfx-cues.json").write_text(json.dumps([{"file": f, "at": round(a, 3), "volume": v} for f, a, v in cues], indent=1))
    m = score()
    m = m / (np.abs(m).max() + 1e-9) * 10 ** (-3 / 20)
    sf.write(MUS / "score.wav", np.stack([m, m], 1).astype(np.float32), SR, subtype="PCM_16")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(MUS / "score.wav"), "-b:a", "192k", str(MUS / "score.mp3")], check=True)
    print("score", DUR, "s; cues", len(cues))


if __name__ == "__main__":
    main()
