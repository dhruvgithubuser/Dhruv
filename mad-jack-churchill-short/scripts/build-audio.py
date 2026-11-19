"""Score + sound design for "The Only Soldier to Kill With a Longbow in WWII?" (Mad Jack Churchill Short) (synthesized, seeded, reproducible).

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
rng = np.random.default_rng(1876)
TL = json.loads((ROOT / "src" / "data" / "timeline.json").read_text())
PH = TL["phrases"]
DUR = float(np.ceil(TL["duration"]))
OUT = ROOT / "public" / "assets" / "sound"
MUS = ROOT / "public" / "assets" / "music"
OUT.mkdir(parents=True, exist_ok=True); MUS.mkdir(parents=True, exist_ok=True)


def ph(n):
    return [p for p in PH if p["scene"] == n]


S = {1: 0.0}
for n in range(2, 13):
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
    na, nr = min(n, int(a * SR)), min(n, int(r * SR))
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


def war_drum(g=1.0):
    """Big cinematic war drum: pitched body + skin slap + room."""
    n = int(1.6 * SR); tm = t_(n)
    body = np.sin(2 * np.pi * (48 + 50 * np.exp(-tm / 0.06)) * tm) * np.exp(-tm / 0.45)
    slap = bp(rng.standard_normal(n), 300, 2500) * np.exp(-tm / 0.03) * 0.5
    return (body + slap) * g


def pipes(start, tune, g=0.2, drone=45, step=0.36):
    """Synth Highland pipes: two drones (A) under a nasal chanter line. `tune` is a list of (midi, beats)."""
    total = sum(b for _, b in tune) * step + 0.6
    n = int(total * SR); tm = t_(n)
    d = sum(np.sign(np.sin(2 * np.pi * hz(drone + o) * tm)) * w for o, w in ((0, 0.5), (12, 0.35)))
    d = lp(d, 1200) * 0.35
    ch = np.zeros(n); tt = 0.0
    for m, beats in tune:
        k0 = int(tt * SR); k1 = min(n, int((tt + beats * step) * SR)); tk = t_(k1 - k0)
        saw = 2 * ((hz(m) * tk) % 1) - 1
        ch[k0:k1] += saw * env(k1 - k0, 0.008, 0.02)
        tt += beats * step
    ch = bp(ch, 600, 4200) * 0.8
    sig = (d + ch) * env(n, 0.2, 0.5)
    place(X, sig, start, g)


def score():
    """War score for Mad Jack Churchill: a mystery opening, a stinger on the twist, Highland pipes over battle drums
    for Norway and Brac, a march for Sicily and Salerno, a lament as he is captured, and a hard ending."""
    global X
    n = int(DUR * SR); X = np.zeros(n)
    def pads(start, end, chords, g=0.16, cutoff=900, step=8 * BEAT):
        tt, k = start, 0
        while tt < end - 0.5:
            place(X, strings(chords[k % len(chords)], min(step + 1.5, end - tt + 1), cutoff), tt, g); tt += step; k += 1
    def drums(start, end, pattern, g=0.6):
        tt = start
        while tt < end - 0.3:
            for off, acc in pattern: place(X, war_drum(g * acc), tt + off * BEAT)
            tt += 4 * BEAT
    def brassline(start, end, chords, g=0.2, step=4 * BEAT, cutoff=1000):
        tt, k = start, 0
        while tt < end - 0.5:
            place(X, brass(chords[k % len(chords)], min(step + 1.0, end - tt + 1), cutoff), tt, g); tt += step; k += 1
    Am = [[33, 40, 45, 48], [29, 36, 41, 45], [31, 38, 43, 47], [28, 35, 40, 44]]
    low = [[21, 28, 33, 36], [17, 24, 29, 33], [19, 26, 31, 35], [16, 23, 28, 32]]
    w = word_t
    # tunes (original, A mixolydian): a quick march and a slow lament
    MARCH = [(69, 1), (71, 0.5), (73, 0.5), (74, 1), (73, 1), (71, 1), (69, 1), (76, 1.5), (74, 0.5), (73, 1), (71, 1), (69, 2),
             (73, 1), (74, 0.5), (76, 0.5), (78, 1), (76, 1), (74, 1), (73, 1), (71, 1.5), (73, 0.5), (69, 2)]
    LAMENT = [(69, 2), (71, 1), (73, 3), (71, 1), (69, 1), (67, 2), (64, 2), (69, 3), (71, 1), (73, 2), (74, 2), (73, 4)]
    # S1 hook: low strings and a heartbeat
    pads(0, S[2], low, 0.24, 700); drums(0.3, S[2], [(0, 1.0), (0.5, 0.5)], 0.45)
    place(X, timpani(21, 0.9), w(1, "arrow")); place(X, snare_roll(1.0, 0.1, 0.7), S[2] - 1.0)
    # S2 archer: light and curious
    pads(S[2], S[3], Am, 0.16, 1000)
    k = 0
    while S[2] + 0.4 + k * 1.2 < S[3]: place(X, pluck([69, 72, 76, 74, 72, 71][k % 6], 0.9, 0.5), S[2] + 0.4 + k * 1.2, 0.5); k += 1
    # S3 the legend: tension then a hit on the arrow
    pads(S[3], S[4], low, 0.22, 800); drums(S[3], S[4] - 0.2, [(0, 0.8), (2, 0.6)], 0.5)
    place(X, war_drum(1.4), w(3, "single")); place(X, timpani(21, 1.0), w(3, "only"))
    # S4 the twist: everything drops out, a single low stinger
    place(X, strings([20, 27, 32, 35], S[5] - S[4] + 1, 700), S[4], 0.24); place(X, war_drum(1.5), w(4, "crushed"))
    # S5 the rest is true: a lift
    place(X, brass([45, 49, 52, 57], S[6] - S[5] + 1, 1300), S[5] + 0.2, 0.22)
    # S6 Norway: pipes over battle drums
    drums(S[6], S[7] - 0.2, [(0, 1.0), (1, 0.5), (2, 0.9), (3, 0.5)], 0.5); pads(S[6], S[7], Am, 0.14, 900)
    pipes(w(6, "playing") - 0.3, MARCH, 0.24)
    # S7 + S8 Sicily / Salerno: march, ostinato, brass
    march(S[7], S[9] - 0.2, 0.7); ostinato(S[7], S[9] - 0.2, [33, 29, 31, 28], 0.4); drums(S[7], S[9] - 0.2, [(0, 1.0), (2, 0.8)], 0.5)
    brassline(S[8], S[9], [[45, 48, 52], [41, 45, 48], [43, 47, 50], [40, 44, 47]], 0.2, 4 * BEAT, 1100)
    place(X, war_drum(1.4), w(8, "42"))
    # S9 back for the sword: hush
    place(X, strings([33, 40, 45, 52], S[10] - S[9] + 1, 1000), S[9], 0.2)
    # S10 Brac: mortar, then the lament on pipes, cut by grenades
    drums(S[10], w(10, "plays"), [(0, 1.0), (1, 0.6), (2, 0.9), (3, 0.6)], 0.6); place(X, war_drum(1.5), w(10, "mortar"))
    pads(S[10], S[11], low, 0.2, 700)
    pipes(w(10, "plays"), LAMENT, 0.26, step=0.42)
    place(X, war_drum(1.6), w(10, "grenades")); place(X, timpani(21, 1.0), w(10, "grenades"))
    # S11 captured / old age: strings, warm lift on "survived"
    pads(S[11], w(11, "survived"), low, 0.2, 700)
    Amaj = [[33, 40, 45, 49], [38, 45, 50, 54], [40, 47, 52, 56], [33, 40, 45, 49]]
    pads(w(11, "survived"), S[12], Amaj, 0.24, 1300, 4 * BEAT)
    # S12 ending
    drums(S[12], DUR - 1.0, [(0, 1.0), (1, 0.5), (2, 0.9), (3, 0.5)], 0.5); pads(S[12], DUR, Am, 0.2, 1100)
    place(X, war_drum(1.6), DUR - 2.0); place(X, timpani(21, 1.0), DUR - 2.0)
    x = reverb(X, 3.0, 1.4, 0.3)
    fade = int(1.4 * SR); x[-fade:] *= np.linspace(1, 0, fade) ** 1.5
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


def gavel():
    out = np.zeros(int(1.2 * SR))
    for k, g in ((0, 1.0), (0.32, 0.8)):
        m = int(0.25 * SR); tm = t_(m)
        hit = (np.sin(2 * np.pi * 180 * tm) * 0.8 + np.sin(2 * np.pi * 410 * tm) * 0.4) * np.exp(-tm / 0.05) + bp(rng.standard_normal(m), 600, 3500) * np.exp(-tm / 0.012)
        place(out, hit * g, k)
    return reverb(out, 1.6, 1.0, 0.4)


def murmur(length=8.0):
    n = int(length * SR); x = np.zeros(n)
    for v in range(10):
        s = bp(rng.standard_normal(n), 250 + 40 * v, 900 + 60 * v) * (0.6 + 0.4 * np.sin(2 * np.pi * (0.4 + 0.13 * v) * t_(n) + v))
        x += s
    return x * 0.25 * env(n, 1.0, 1.5)


def bugle():
    out = np.zeros(int(2.6 * SR))
    for k, (m, d) in enumerate([(67, 0.18), (72, 0.18), (76, 0.18), (79, 0.7)]):
        place(out, brass([m], d + 0.15, 2400), sum(x[1] for x in [(67, 0.18), (72, 0.18), (76, 0.18), (79, 0.7)][:k]) * 1.1, 0.9)
    return reverb(out, 2.5, 1.4, 0.5)


def gavel():
    out = np.zeros(int(1.2 * SR))
    for k, g in ((0, 1.0), (0.32, 0.8)):
        m = int(0.25 * SR); tm = t_(m)
        hit = (np.sin(2 * np.pi * 180 * tm) * 0.8 + np.sin(2 * np.pi * 410 * tm) * 0.4) * np.exp(-tm / 0.05) + bp(rng.standard_normal(m), 600, 3500) * np.exp(-tm / 0.012)
        place(out, hit * g, k)
    return reverb(out, 1.6, 1.0, 0.4)


def murmur(length=8.0):
    n = int(length * SR); x = np.zeros(n)
    for v in range(10):
        s = bp(rng.standard_normal(n), 250 + 40 * v, 900 + 60 * v) * (0.6 + 0.4 * np.sin(2 * np.pi * (0.4 + 0.13 * v) * t_(n) + v))
        x += s
    return x * 0.25 * env(n, 1.0, 1.5)


def bugle():
    out = np.zeros(int(2.6 * SR))
    for k, (m, d) in enumerate([(67, 0.18), (72, 0.18), (76, 0.18), (79, 0.7)]):
        place(out, brass([m], d + 0.15, 2400), sum(x[1] for x in [(67, 0.18), (72, 0.18), (76, 0.18), (79, 0.7)][:k]) * 1.1, 0.9)
    return reverb(out, 2.5, 1.4, 0.5)


def dig(length=3.0):
    x = np.zeros(int(length * SR))
    for k in range(int(length * 1.6)):
        m = int(0.18 * SR); tm = t_(m)
        hit = lp(rng.standard_normal(m), 900) * np.exp(-tm / 0.04) + bp(rng.standard_normal(m), 1500, 5000) * np.exp(-tm / 0.015) * 0.4
        place(x, hit * (0.7 + 0.3 * rng.random()), k / 1.6 + 0.05 * rng.random())
    return reverb(x, 1.5, 1.0, 0.3)


def creak(length=1.2):
    n = int(length * SR); tm = t_(n)
    f0 = 140 + 60 * np.sin(2 * np.pi * 0.8 * tm)
    saw = (np.cumsum(f0) / SR) % 1.0 - 0.5
    grit = (rng.random(n) < 0.004) * 1.0
    return bp(saw + grit * 2, 300, 3000) * env(n, 0.05, 0.4) * 0.7


def explosion():
    n = int(3.5 * SR); tm = t_(n)
    boom = np.sin(2 * np.pi * (30 + 70 * np.exp(-tm / 0.05)) * tm) * np.exp(-tm / 0.9)
    crack = bp(rng.standard_normal(n), 300, 6000) * np.exp(-tm / 0.08)
    rumble = lp(rng.standard_normal(n), 140) * np.exp(-tm / 1.4) * 1.5
    return reverb(boom + crack * 0.9 + rumble, 3.0, 1.6, 0.45)


def plane_flyby(length=4.0):
    n = int(length * SR); tm = t_(n)
    f0 = 90 + 30 * np.tanh((tm - length / 2) * 1.5) * -1
    eng = np.sin(2 * np.pi * np.cumsum(f0) / SR) + 0.5 * np.sin(4 * np.pi * np.cumsum(f0) / SR)
    noise = bp(rng.standard_normal(n), 200, 2000) * 0.6
    amp = np.exp(-((tm - length / 2) ** 2) / 0.9)
    return (eng * 0.6 + noise) * amp


def waves(length=8.0):
    n = int(length * SR); tm = t_(n)
    sw = lp(rng.standard_normal(n), 900) * (0.55 + 0.45 * np.sin(2 * np.pi * tm / 3.1) ** 2)
    return sw * np.minimum(1, tm / 0.8) * np.minimum(1, (length - tm) / 1.0)


def splash():
    n = int(2.5 * SR); tm = t_(n)
    return (bp(rng.standard_normal(n), 300, 5000) * np.exp(-tm / 0.35) + lp(rng.standard_normal(n), 300) * np.exp(-tm / 0.8)) * 0.9


def arrow_sfx():
    n = int(0.9 * SR); tm = t_(n)
    swish = bp(rng.standard_normal(n), 1500, 7000) * np.exp(-((tm - 0.3) ** 2) / 0.01) * 0.8
    thud = lp(rng.standard_normal(n), 300) * np.exp(-np.maximum(0, tm - 0.55) / 0.05) * (tm > 0.55) * 1.4
    return swish + thud


def bowstring():
    n = int(0.6 * SR); tm = t_(n)
    return np.sin(2 * np.pi * 95 * tm) * np.exp(-tm / 0.12) * 0.8 + bp(rng.standard_normal(n), 800, 3000) * np.exp(-tm / 0.03) * 0.5


def main():
    files = {"wind.wav": wind(8.0), "paper.wav": paper(), "impact.wav": impact(), "whoosh.wav": whoosh(0.8, 200, 3000),
             "volley.wav": volley(6, 0.6), "explosion.wav": explosion(), "fire.wav": fire(10.0), "waves.wav": waves(8.0), "splash.wav": splash(),
             "arrow.wav": arrow_sfx(), "bowstring.wav": bowstring()}
    for k, v in files.items():
        save(k, v)
    w = word_t
    cues = [("wind.wav", 0.0, 0.3), ("bowstring.wav", w(1, "arrow") - 0.4, 0.5), ("arrow.wav", w(1, "arrow") - 0.3, 0.6), ("impact.wav", w(1, "happen"), 0.45),
            ("whoosh.wav", S[2], 0.22), ("bowstring.wav", w(2, "archer"), 0.45), ("arrow.wav", w(2, "archer") + 0.05, 0.45),
            ("wind.wav", S[3], 0.35), ("volley.wav", S[3] + 0.5, 0.25), ("bowstring.wav", w(3, "draws"), 0.55), ("bowstring.wav", w(3, "single") - 0.15, 0.55),
            ("arrow.wav", w(3, "single") - 0.1, 0.7), ("impact.wav", w(3, "only"), 0.4),
            ("impact.wav", w(4, "crushed"), 0.55), ("paper.wav", S[4] + 0.2, 0.4),
            ("impact.wav", w(5, "true"), 0.4),
            ("splash.wav", w(6, "drop"), 0.55), ("waves.wav", S[6], 0.4), ("volley.wav", w(6, "garrison"), 0.4), ("wind.wav", S[6], 0.35),
            ("whoosh.wav", S[7], 0.22), ("waves.wav", S[7], 0.3), ("volley.wav", S[7] + 4.0, 0.25),
            ("volley.wav", S[8] + 0.5, 0.25), ("impact.wav", w(8, "42"), 0.4),
            ("wind.wav", S[9], 0.3),
            ("explosion.wav", w(10, "mortar"), 0.7), ("explosion.wav", w(10, "mortar") + 0.8, 0.45), ("fire.wav", S[10], 0.3),
            ("explosion.wav", w(10, "grenades"), 0.75), ("impact.wav", w(10, "grenades"), 0.5),
            ("paper.wav", S[11] + 0.2, 0.4), ("impact.wav", w(11, "wasnt"), 0.4), ("waves.wav", w(11, "survived"), 0.25),
            ("whoosh.wav", S[12], 0.22), ("impact.wav", w(12, "legend"), 0.35), ("impact.wav", w(12, "truth"), 0.35)]
    (ROOT / "src" / "data" / "sfx-cues.json").write_text(json.dumps([{"file": f, "at": round(a, 3), "volume": v} for f, a, v in cues], indent=1))
    m = score()
    m = m / (np.abs(m).max() + 1e-9) * 10 ** (-3 / 20)
    sf.write(MUS / "score.wav", np.stack([m, m], 1).astype(np.float32), SR, subtype="PCM_16")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(MUS / "score.wav"), "-b:a", "192k", str(MUS / "score.mp3")], check=True)
    print("score", DUR, "s; cues", len(cues))


if __name__ == "__main__":
    main()
