"""Score + sound design for "The Mistake That Cost Napoleon His Empire" (long documentary) (synthesized, seeded, reproducible).

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
rng = np.random.default_rng(1812)
TL = json.loads((ROOT / "src" / "data" / "timeline.json").read_text())
PH = TL["phrases"]
DUR = float(np.ceil(TL["duration"]))
OUT = ROOT / "public" / "assets" / "sound"
MUS = ROOT / "public" / "assets" / "music"
OUT.mkdir(parents=True, exist_ok=True); MUS.mkdir(parents=True, exist_ok=True)


def ph(n):
    return [p for p in PH if p["scene"] == n]


S = {1: 0.0}
for n in range(2, 50):
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


def brass(ms, length, cutoff=700):
    n = int(length * SR); x = np.zeros(n)
    for m in ms:
        for d in (-0.06, 0.06):
            x += 2 * ((hz(m) * 2 ** (d / 12) * t_(n) + rng.random()) % 1) - 1
    swell = np.minimum(1, t_(n) / (length * 0.6))
    return (lp(x, cutoff) * (1 - swell) + lp(x, cutoff + 900) * swell) / len(ms) * env(n, min(0.6, length * 0.3), min(1.4, length * 0.5)) * (0.5 + 0.5 * swell)


def snare_roll(length, g0=0.2, g1=1.0):
    n = int(length * SR); x = np.zeros(n); tt = 0.0; k = 0
    while tt < length:
        m = int(0.05 * SR); tm = t_(m)
        hit = bp(rng.standard_normal(m), 1800, 7000) * np.exp(-tm / 0.012) + np.sin(2 * np.pi * 190 * tm) * np.exp(-tm / 0.02) * 0.5
        place(x, hit * (g0 + (g1 - g0) * tt / length) * (1.0 if k % 2 else 0.75), tt)
        tt += 0.065; k += 1
    return x


def timpani(m=38, g=1.0, length=2.2):
    n = int(length * SR); tm = t_(n); f0 = hz(m)
    body = sum(a * np.sin(2 * np.pi * f0 * k * (1 + 0.004 * np.exp(-tm / 0.05)) * tm) * np.exp(-tm / d) for k, a, d in ((1, 1, 0.9), (1.5, 0.35, 0.5), (1.98, 0.2, 0.35)))
    thud = lp(rng.standard_normal(n), 300) * np.exp(-tm / 0.03) * 0.6
    return (body + thud) * g


def cello(m, length=0.3, g=1.0):
    n = int(length * SR); tm = t_(n); x = np.zeros(n)
    for d in (-0.05, 0.05):
        x += 2 * ((hz(m) * 2 ** (d / 12) * tm + rng.random()) % 1) - 1
    return lp(x, 900) * env(n, 0.012, 0.08) * g * 0.5


def march(start, end, g=0.5):
    """Military snare: 2/4 march with flams and a roll every 4 bars."""
    bar = 4 * BEAT; tt = start; k = 0
    while tt < end - 0.1:
        b = k % 4
        place(X, snare(0.55 * g), tt); place(X, snare(0.3 * g), tt + BEAT); place(X, snare(0.35 * g), tt + 1.5 * BEAT)
        place(X, snare(0.5 * g), tt + 2 * BEAT); place(X, snare(0.28 * g), tt + 3 * BEAT); place(X, snare(0.3 * g), tt + 3.5 * BEAT)
        if b == 3: place(X, snare_roll(BEAT * 1.6, 0.15 * g, 0.6 * g), tt + 2.3 * BEAT)
        tt += bar; k += 1


def ostinato(start, end, roots, g=0.5):
    tt = start; k = 0
    while tt < end - 0.05:
        r = roots[int((tt - start) / (8 * BEAT)) % len(roots)]
        m = r + (0, 0, 7, 0, 12, 0, 7, 3)[k % 8]
        place(X, cello(m, BEAT * 0.45, g * (1.0 if k % 2 == 0 else 0.7)), tt)
        tt += BEAT / 2; k += 1


X = None


def score():
    global X
    n = int(DUR * SR); X = np.zeros(n)
    def brassline(start, end, chords, g=0.22, step=8 * BEAT, cutoff=700):
        tt, k = start, 0
        while tt < end - 0.5:
            place(X, brass(chords[k % len(chords)], min(step + 1.0, end - tt + 1), cutoff), tt, g); tt += step; k += 1
    def pads(start, end, chords, g=0.16, cutoff=900, step=8 * BEAT):
        tt, k = start, 0
        while tt < end - 0.5:
            place(X, strings(chords[k % len(chords)], min(step + 1.5, end - tt + 1), cutoff), tt, g); tt += step; k += 1
    def drums(start, end, every, m=38, g=0.5):
        tt = start
        while tt < end - 0.3: place(X, timpani(m, g), tt); tt += every
    Dm = [[38, 45, 50], [34, 41, 46], [36, 43, 48], [33, 40, 45]]
    # cold open (1-4): solemn low strings, distant timpani, a horn call on the title
    pads(0, S[5], [[26, 38, 45], [22, 34, 41], [24, 36, 43], [21, 33, 40]], 0.22, 650)
    drums(1.0, S[4], 4 * BEAT, 33, 0.35)
    for k_, (m, d) in enumerate([(62, 0.6), (65, 0.6), (69, 1.8)]): place(X, brass([m], d + 0.9, 1500), S[4] + 0.6 + k_ * 0.65, 0.16)
    place(X, timpani(38, 0.9), S[4] + 0.6)
    # I-II (5-13): the imperial machine: snare march, ostinato, brass
    march(S[5], S[14] - 0.2, 0.5)
    ostinato(S[5], S[14] - 0.2, [38, 34, 36, 33], 0.38)
    brassline(S[5] + 2, S[14], [[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 49, 52]], 0.16, 8 * BEAT, 900)
    drums(S[5], S[14] - 0.3, 8 * BEAT, 38, 0.45)
    # III (14-20): the empty land: drone, slow heartbeat timpani
    pads(S[14], S[21], [[26, 33, 38], [27, 34, 39], [26, 33, 38], [24, 31, 36]], 0.24, 700)
    drums(S[14], S[21] - 0.3, 2 * BEAT, 33, 0.3)
    for t0 in (S[16], S[18], S[20]): place(X, brass([45, 52], 4.0, 600), t0, 0.12)
    # IV (21-25): Borodino: battle
    march(S[21], S[26] - 0.3, 0.85)
    ostinato(S[21], S[26] - 0.3, [38, 39, 41, 38], 0.5)
    brassline(S[21], S[26], [[38, 45, 50, 53], [39, 46, 51, 55], [41, 48, 53, 57], [38, 45, 50, 53]], 0.26, 4 * BEAT, 1000)
    drums(S[21], S[26] - 0.3, BEAT, 38, 0.55)
    place(X, snare_roll(2.5, 0.2, 1.0), S[22] - 2.5)
    # V-VI (26-32): Moscow, the fire, the waiting: eerie and sparse
    pads(S[26], S[33], [[38, 45, 48], [36, 43, 46], [34, 41, 45], [33, 40, 45]], 0.2, 800)
    for k_ in range(int((S[33] - S[26]) / 3.2)): place(X, piano([62, 65, 69, 67, 64, 62][k_ % 6], 4.5), S[26] + 1 + k_ * 3.2, 0.09)
    drums(S[28], S[33] - 0.3, 6 * BEAT, 26, 0.35)
    # VII-VIII (33-43): the retreat: tragic minor strings, a slow funeral drum
    pads(S[33], S[44], [[26, 33, 38, 41], [22, 29, 34, 38], [24, 31, 36, 39], [21, 28, 33, 37]], 0.26, 750)
    tt = S[33]
    while tt < S[44] - 1: place(X, snare(0.25), tt); place(X, snare_roll(0.6, 0.1, 0.3), tt + 1.4); tt += 4 * BEAT
    brassline(S[39], S[44], [[38, 45, 50], [36, 43, 48], [34, 41, 46], [33, 40, 45]], 0.18, 8 * BEAT, 700)
    drums(S[39], S[44] - 0.3, 2 * BEAT, 33, 0.45)
    # IX + close (44-49): elegy, then a D-major brass chorale
    pads(S[44], DUR, [[38, 45, 50, 53], [34, 41, 46, 50], [36, 43, 48, 52], [33, 40, 45, 49]], 0.18, 900)
    brassline(S[47], DUR - 0.5, [[50, 54, 57], [55, 59, 62], [47, 50, 54], [57, 61, 64], [50, 54, 57, 62]], 0.22, 6 * BEAT, 1100)
    place(X, timpani(38, 1.0), S[48]); place(X, timpani(38, 0.9), DUR - 4)
    x = reverb(X, 3.5, 1.6, 0.36)
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


def cannon():
    n = int(3.0 * SR); tt = t_(n)
    boom = np.sin(2 * np.pi * (35 + 60 * np.exp(-tt / 0.04)) * tt) * np.exp(-tt / 0.6)
    crack = bp(rng.standard_normal(n), 200, 5000) * np.exp(-tt / 0.05)
    return reverb(boom + crack * 0.8, 3, 1.6, 0.5)


def gallop(length=6.0):
    x = np.zeros(int(length * SR)); tt = 0.0
    while tt < length - 0.3:
        for d in (0, 0.09, 0.2):
            m = int(0.06 * SR); place(x, lp(rng.standard_normal(m), 400) * np.exp(-t_(m) / 0.015) * 0.8, tt + d)
        tt += 0.42
    return x * env(len(x), 1.0, 1.5)


def ice(length=3.0):
    n = int(length * SR); x = np.zeros(n)
    for k in range(25):
        m = int(0.02 * SR); place(x, bp(rng.standard_normal(m), 2000, 9000) * np.exp(-t_(m) / 0.004) * rng.random(), rng.random() * length)
    return x + lp(rng.standard_normal(n), 300) * 0.3 * env(n, 0.5, 1.0)


def main():
    files = {"wind.wav": wind(12.0), "fire.wav": fire(10.0), "cannon.wav": cannon(), "volley.wav": volley(8, 0.8), "musket.wav": musket(), "gallop.wav": gallop(), "ice.wav": ice(),
             "clock.wav": clock(6.0), "paper.wav": paper(), "quill.wav": quill(), "impact.wav": impact(), "whoosh.wav": whoosh(0.8, 200, 3000), "thunder.wav": thunder()}
    for k, v in files.items():
        save(k, v)
    w = word_t
    cues = []
    for sc in (1, 3, 4, 34, 35, 36, 38, 39, 41, 42, 43, 48, 49):
        cues.append(("wind.wav", S[sc], 0.45 if sc != 34 else 0.7))
    cues += [("wind.wav", S[34] + 6, 0.6), ("wind.wav", S[38] + 6, 0.4)]
    for sc in (14, 19, 27, 28):
        cues += [("fire.wav", S[sc], 0.45), ("fire.wav", S[sc] + 9, 0.35)]
    cues += [("impact.wav", w(4, "mistake"), 0.4)]
    cues += [("whoosh.wav", S[n_], 0.22) for n_ in (5, 10, 14, 21, 26, 28, 33, 39, 44)]
    cues += [("cannon.wav", S[22] + 0.2, 0.6), ("cannon.wav", S[22] + 1.8, 0.5), ("volley.wav", S[22] + 3.0, 0.5), ("cannon.wav", S[22] + 4.6, 0.55), ("volley.wav", S[22] + 6.0, 0.45),
             ("cannon.wav", S[23] + 1.0, 0.3), ("cannon.wav", S[24] + 0.5, 0.3), ("volley.wav", S[24] + 2.5, 0.3)]
    cues += [("thunder.wav", S[21] + 2, 0.3), ("impact.wav", w(28, "waited"), 0.5), ("quill.wav", w(28, "letters") - 0.5, 0.35), ("paper.wav", S[29] + 0.2, 0.4),
             ("clock.wav", S[30] + 0.2, 0.4), ("clock.wav", S[30] + 6.2, 0.4)]
    cues += [("gallop.wav", S[37], 0.55), ("musket.wav", S[37] + 2.0, 0.35), ("ice.wav", S[40] + 0.5, 0.5), ("ice.wav", S[40] + 6, 0.4), ("cannon.wav", S[41] + 0.5, 0.35), ("musket.wav", S[43] + 0.8, 0.45), ("musket.wav", S[43] + 2.6, 0.4),
             ("gallop.wav", S[42], 0.3), ("cannon.wav", S[45] + 0.5, 0.35), ("volley.wav", S[45] + 2.0, 0.3), ("thunder.wav", S[47] + 0.5, 0.35), ("paper.wav", w(44, "best") - 1.0, 0.4)]
    (ROOT / "src" / "data" / "sfx-cues.json").write_text(json.dumps([{"file": f, "at": round(a, 3), "volume": v} for f, a, v in cues], indent=1))
    m = score()
    m = m / (np.abs(m).max() + 1e-9) * 10 ** (-3 / 20)
    sf.write(MUS / "score.wav", np.stack([m, m], 1).astype(np.float32), SR, subtype="PCM_16")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(MUS / "score.wav"), "-b:a", "192k", str(MUS / "score.mp3")], check=True)
    print("score", DUR, "s; cues", len(cues))


if __name__ == "__main__":
    main()
