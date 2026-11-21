"""Score + sound design for "One Wrong Turn That Started World War I" (synthesized, seeded, reproducible).

    python scripts/build-audio.py

Reads src/timeline.json. Writes public/audio/score.wav/.mp3, public/audio/sfx/*.wav and src/sfx-cues.json.
Tone: dark historical thriller. Low drone and sparse piano, a pulse that tightens from the wrong turn to the
shots, a beat of silence after them, then a military snare and low brass as Europe goes to war.
"""
import json
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, sosfilt

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
rng = np.random.default_rng(1914)
TL = json.loads((ROOT / "src" / "timeline.json").read_text())
PH = TL["phrases"]
DUR = float(np.ceil(TL["duration"]))
OUT = ROOT / "public" / "audio"
(OUT / "sfx").mkdir(parents=True, exist_ok=True)


def ph(n):
    return [p for p in PH if p["scene"] == n]


S = {1: 0.0}
for n in range(2, 22):
    S[n] = ph(n)[0]["start"] - 0.35


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
def snare_roll(length, g0=0.2, g1=1.0):
    n = int(length * SR); x = np.zeros(n); tt = 0.0; k = 0
    while tt < length:
        m = int(0.05 * SR); tm = t_(m)
        hit = bp(rng.standard_normal(m), 1800, 7000) * np.exp(-tm / 0.012) + np.sin(2 * np.pi * 190 * tm) * np.exp(-tm / 0.02) * 0.5
        place(x, hit * (g0 + (g1 - g0) * tt / length) * (1.0 if k % 2 else 0.75), tt)
        tt += 0.065; k += 1
    return x


def brass(ms, length, cutoff=700):
    n = int(length * SR); x = np.zeros(n)
    for m in ms:
        for d in (-0.06, 0.06):
            x += 2 * ((hz(m) * 2 ** (d / 12) * t_(n) + rng.random()) % 1) - 1
    swell = np.minimum(1, t_(n) / (length * 0.6))
    return (lp(x, cutoff) * (1 - swell) + lp(x, cutoff + 900) * swell) / len(ms) * env(n, 0.8, 1.5) * (0.5 + 0.5 * swell)


def kick(g=1.0):
    m = int(0.35 * SR); tm = t_(m)
    return np.sin(2 * np.pi * (45 + 60 * np.exp(-tm / 0.03)) * tm) * np.exp(-tm / 0.12) * g


def score():
    n = int(DUR * SR); x = np.zeros(n); t = t_(n)
    drone = (np.sin(2 * np.pi * hz(38) * t) * 0.6 + np.sin(2 * np.pi * hz(45) * t) * 0.3 + lp(rng.standard_normal(n), 160) * 0.3)
    drone *= 0.55 + 0.25 * np.sin(2 * np.pi * t / 19)
    x += drone * 0.3
    # D minor pads through the setup
    for k, ch in enumerate([[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 49, 52]] * 2):
        place(x, pad(ch, 6.0, 900), S[1] + k * 5.2, 0.2)
    # piano motif (sparse) in the hook and at the date
    for k, m in enumerate([62, 65, 64, 62, 57]):
        place(x, piano(m, 4), 0.4 + k * 1.3, 0.16)
    for k, m in enumerate([69, 67, 65]):
        place(x, piano(m, 4), S[3] + 0.2 + k * 0.9, 0.12)
    # pulse: from the new plan to the shots, tightening
    a, b = S[10], word_t(16, "twice")
    tt = a
    while tt < b - 0.2:
        place(x, kick(0.35 + 0.55 * (tt - a) / (b - a)), tt)
        tt += 0.8 - 0.35 * (tt - a) / (b - a)
    tens = pad([81, 82], b - S[13], 2600)
    place(x, tens * np.linspace(0.1, 1, len(tens)), S[13], 0.1)
    # mourning piano after the shots
    for k, m in enumerate([57, 60, 64, 62, 57, 53]):
        place(x, piano(m, 5), S[17] + 0.3 + k * 0.85, 0.17)
    # war: snare roll + low brass swell + timpani-like kicks
    war = S[18]
    place(x, snare_roll(S[21] - war + 0.5, 0.15, 0.9), war, 0.22)
    for k, ch in enumerate([[38, 45, 50], [36, 43, 48], [34, 41, 46], [38, 45, 50]]):
        place(x, brass(ch, 4.0, 600), war + k * 3.4, 0.3)
    for k in range(int((S[21] - war) / 1.7)):
        place(x, kick(0.8), war + k * 1.7)
    # resolve
    place(x, pad([38, 50, 53, 57, 62], 6.0, 1400), S[21], 0.3)
    place(x, piano(50, 6), word_t(21, "turn"), 0.25)
    x = reverb(x, 4.0, 1.6, 0.4)
    # silence after the two shots
    s0 = word_t(16, "twice") + 0.45
    a0, b0 = int(s0 * SR), int((s0 + 1.1) * SR)
    g = np.ones(n); g[a0:b0] = 0.0
    r = int(0.05 * SR); g[a0 - r:a0] = np.linspace(1, 0, r); g[b0:b0 + int(1.2 * SR)] = np.linspace(0, 1, int(1.2 * SR))
    x *= g
    fade = int(2.5 * SR); x[-fade:] *= np.linspace(1, 0, fade) ** 1.5
    return x


# ---------------------------------------------------------------- sfx
def whoosh(length=1.6, f0=150, f1=2500):
    n = int(length * SR); x = rng.standard_normal(n); out = np.zeros(n)
    for b in range(48):
        i0, i1 = b * n // 48, (b + 1) * n // 48
        fc = f0 * (f1 / f0) ** (b / 48)
        out[i0:i1] = bp(x[i0:i1], max(30, fc * 0.6), min(20000, fc * 1.5))
    return out * np.sin(np.pi * t_(n) / length) ** 2


def click():
    m = int(0.06 * SR)
    return bp(rng.standard_normal(m), 1500, 8000) * np.exp(-t_(m) / 0.006) + np.sin(2 * np.pi * 180 * t_(m)) * np.exp(-t_(m) / 0.02) * 0.6


def boom(length=5.0):
    n = int(length * SR); t = t_(n)
    body = np.sin(2 * np.pi * np.cumsum(28 + 50 * np.exp(-t / 0.25)) / SR) * np.exp(-t / 1.2)
    crack = bp(rng.standard_normal(n), 200, 6000) * np.exp(-t / 0.25)
    return reverb(body + 0.8 * crack, 3, 1.5, 0.3)


def gunshot():
    n = int(2.5 * SR); t = t_(n)
    crack = hp(rng.standard_normal(n), 900) * np.exp(-t / 0.018)
    thump = np.sin(2 * np.pi * (70 + 120 * np.exp(-t / 0.01)) * t) * np.exp(-t / 0.08)
    return reverb(crack * 1.2 + thump, 2.5, 0.9, 0.55)


def stamp():
    m = int(0.4 * SR); tm = t_(m)
    return np.sin(2 * np.pi * (60 + 90 * np.exp(-tm / 0.01)) * tm) * np.exp(-tm / 0.07) + lp(rng.standard_normal(m), 2500) * np.exp(-tm / 0.02) * 0.6


def tick():
    m = int(0.05 * SR); tm = t_(m)
    return bp(rng.standard_normal(m), 2500, 9000) * np.exp(-tm / 0.004) + np.sin(2 * np.pi * 3200 * tm) * np.exp(-tm / 0.008) * 0.4


def heartbeat(length=4.0, bpm=72):
    n = int(length * SR); x = np.zeros(n); per = 60 / bpm; tt = 0.0
    while tt < length - 0.4:
        place(x, kick(1.0), tt); place(x, kick(0.6), tt + 0.22); tt += per
    return lp(x, 160)


def crowd(length=8.0):
    n = int(length * SR); t = t_(n)
    m = bp(rng.standard_normal(n), 300, 2500) * (0.6 + 0.4 * np.abs(lp(rng.standard_normal(n), 3) * 8))
    cheer = bp(rng.standard_normal(n), 900, 4000) * (0.5 + 0.5 * np.sin(2 * np.pi * t / 3.1)) * 0.5
    return reverb((m + cheer) * env(n, 1.0, 2.0), 2, 1.0, 0.3)


def engine_stall(length=2.4):
    n = int(length * SR); t = t_(n)
    rate = 18 * np.exp(-t / 0.9) + 2  # firing pulses slowing down
    ph = np.cumsum(rate) / SR
    pulses = (np.sin(2 * np.pi * ph) > 0.6).astype(float)
    x = lp(rng.standard_normal(n), 400) * pulses * np.exp(-t / 1.1) + np.sin(2 * np.pi * 55 * t) * np.exp(-t / 0.8) * 0.4
    x[int(1.9 * SR):] *= np.linspace(1, 0, n - int(1.9 * SR))
    return x


def brakes(length=0.9):
    n = int(length * SR); t = t_(n)
    sq = np.sin(2 * np.pi * np.cumsum(1900 + 300 * np.sin(2 * np.pi * 7 * t)) / SR) * 0.3 + bp(rng.standard_normal(n), 300, 1200)
    return sq * env(n, 0.03, 0.4)


def artillery(length=7.0):
    n = int(length * SR); x = np.zeros(n)
    for k, at in enumerate((0.2, 1.4, 2.1, 3.6, 4.4, 5.6)):
        place(x, lp(boom(1.5), 300) * (0.4 + 0.6 * rng.random()), at)
    return x


def save(name, x):
    x = x / (np.abs(x).max() + 1e-9) * 0.7
    sf.write(OUT / "sfx" / name, x.astype(np.float32), SR, subtype="PCM_16")


def main():
    files = {"whoosh.wav": whoosh(), "click.wav": click(), "boom.wav": boom(), "gunshot.wav": gunshot(), "stamp.wav": stamp(),
             "tick.wav": tick(), "heartbeat.wav": heartbeat(9.0, 76), "crowd.wav": crowd(), "stall.wav": engine_stall(),
             "brakes.wav": brakes(), "artillery.wav": artillery(), "wind.wav": lp(rng.standard_normal(int(8 * SR)), 500) * env(int(8 * SR), 2, 3)}
    for k, v in files.items():
        save(k, v)
    tw = word_t(16, "twice")
    cues = [
        ("wind.wav", 0.0, 0.35), ("boom.wav", 0.05, 0.35),
        ("whoosh.wav", word_t(2, "wrong") - 0.3, 0.35), ("stamp.wav", word_t(2, "wrong"), 0.5),
        ("stall.wav", word_t(2, "stalled"), 0.4), ("gunshot.wav", word_t(2, "gunshots"), 0.55), ("gunshot.wav", word_t(2, "gunshots") + 0.3, 0.45),
        ("click.wav", S[3] + 0.1, 0.4), *[("tick.wav", S[3] + 0.2 + 0.1 * k, 0.25) for k in range(7)],
        ("crowd.wav", S[4], 0.35), ("click.wav", word_t(4, "franz") - 0.1, 0.45), ("click.wav", word_t(4, "sophie") - 0.15, 0.45),
        ("whoosh.wav", S[5] - 0.3, 0.3), *[("tick.wav", word_t(5, "six") + 0.15 * k, 0.35) for k in range(6)],
        *[("tick.wav", word_t(6, "ten") - 0.2 + 0.5 * k, 0.3) for k in range(5)], ("whoosh.wav", word_t(6, "throws"), 0.25),
        ("boom.wav", word_t(7, "explodes"), 0.75), ("crowd.wav", word_t(7, "explodes") + 0.4, 0.25),
        ("stamp.wav", word_t(8, "unharmed"), 0.5), ("stamp.wav", word_t(8, "failed"), 0.6),
        ("whoosh.wav", S[10] - 0.3, 0.3), ("click.wav", S[11] + 0.1, 0.4), ("stamp.wav", word_t(11, "driver"), 0.55),
        ("whoosh.wav", S[12] - 0.3, 0.3),
        ("stamp.wav", word_t(13, "wrong"), 0.5), ("brakes.wav", word_t(13, "brakes"), 0.4), ("stall.wav", word_t(13, "stalls") - 0.2, 0.6),
        ("heartbeat.wav", S[14], 0.5),
        ("gunshot.wav", tw, 0.9), ("gunshot.wav", tw + 0.4, 0.85),
        ("whoosh.wav", S[18] - 0.4, 0.3), ("stamp.wav", word_t(18, "declares"), 0.5),
        *[("stamp.wav", word_t(19, w), 0.35) for w in ("russia", "germany", "france", "britain")],
        ("artillery.wav", S[20], 0.5), ("wind.wav", S[20] + 2.0, 0.3),
        ("boom.wav", word_t(21, "turn"), 0.35),
    ]
    (ROOT / "src" / "sfx-cues.json").write_text(json.dumps([{"file": f, "at": round(a, 3), "volume": v} for f, a, v in cues], indent=1))
    m = score()
    m = m / (np.abs(m).max() + 1e-9) * 10 ** (-3 / 20)
    sf.write(OUT / "score.wav", np.stack([m, m], 1).astype(np.float32), SR, subtype="PCM_16")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(OUT / "score.wav"), "-b:a", "224k", str(OUT / "score.mp3")], check=True)
    print("score", DUR, "s; cues", len(cues))


if __name__ == "__main__":
    main()
