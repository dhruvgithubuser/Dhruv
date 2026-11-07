"""Sound design for the documentary, synthesized in code (seeded, reproducible).

    python scripts/build-audio.py

Reads src/timeline.json (narration timing) and writes:
  public/audio/background-music.wav/.mp3   score: drone, tension ostinato, silence, space pad, warm rise
  public/audio/sound-effects/*.wav         bunker hum, relays, beeps, siren, impacts, radar, heartbeat...
  src/sfx-cues.json                        where each effect plays (seconds) and how loud
"""
import json
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
DUR = 80.0
rng = np.random.default_rng(26091983)
OUT_SFX = ROOT / "public" / "audio" / "sound-effects"
OUT_SFX.mkdir(parents=True, exist_ok=True)

TL = json.loads((ROOT / "src" / "timeline.json").read_text())
PH = TL["phrases"]
first = {}
for p in PH:
    first.setdefault(p["scene"], p["start"])
S = {n: (0.0 if n == 1 else first[n] - 0.3) for n in range(1, 16)}  # scene start (s), same rule as theme.ts


def word_t(scene, word, nth=0):
    ws = [w for p in PH if p["scene"] == scene for w in p.get("words", [])]
    hits = [w for w in ws if "".join(c for c in w["w"].lower() if c.isalnum() or c == "'") == word]
    return hits[min(nth, len(hits) - 1)]["start"] if hits else S[scene]


# ---------------------------------------------------------------- dsp
def t_(n):
    return np.arange(n) / SR


def lp(x, f, o=2):
    return sosfilt(butter(o, f, "lowpass", fs=SR, output="sos"), x)


def hp(x, f, o=2):
    return sosfilt(butter(o, f, "highpass", fs=SR, output="sos"), x)


def bp(x, lo, hi, o=2):
    return sosfilt(butter(o, [lo, hi], "bandpass", fs=SR, output="sos"), x)


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def saw(f, n, ph=0.0):
    p = (np.cumsum(np.full(n, f) if np.isscalar(f) else f) / SR + ph) % 1.0
    return 2 * p - 1


def env(n, a=0.01, r=0.1):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr)
    return e


def reverb(x, secs=2.5, decay=0.9, wet=0.3):
    n = int(secs * SR)
    ir = rng.standard_normal(n) * np.exp(-t_(n) / decay)
    ir = lp(ir, 5000)
    ir /= np.sqrt((ir ** 2).sum())
    return x + wet * fftconvolve(x, ir)[: len(x)]


def pad(midis, length, cutoff=1200, voices=4, det=0.10):
    n = int(length * SR)
    x = np.zeros(n)
    for m in midis:
        for v in range(voices):
            c = (v - (voices - 1) / 2) * det
            x += saw(hz(m) * 2 ** (c / 12), n, rng.random())
    return lp(x, cutoff) / (len(midis) * voices) ** 0.5


def place(bus, sig, at, gain=1.0):
    i = int(at * SR)
    if i >= len(bus): return
    j = min(len(bus), i + len(sig))
    bus[i:j] += gain * sig[: j - i]


def save(name, x, peak=-1.0):
    x = x / (np.abs(x).max() + 1e-9) * 10 ** (peak / 20)
    sf.write(OUT_SFX / name, x.astype(np.float32), SR, subtype="PCM_16")
    return name


# ---------------------------------------------------------------- sound effects
def sfx_hum(length=56):
    n = int(length * SR); t = t_(n)
    x = sum(a * np.sin(2 * np.pi * 50 * k * t) for k, a in ((1, 0.6), (2, 0.35), (3, 0.2), (5, 0.08)))
    vent = lp(rng.standard_normal(n), 900) * 0.35 * (1 + 0.2 * np.sin(2 * np.pi * 0.07 * t))
    buzz = bp(rng.standard_normal(n), 2400, 3600) * 0.03 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.3 * t) ** 8)
    return (x * 0.5 + vent + buzz) * env(n, 1.5, 3)


def sfx_relays(length=2.2, count=14):
    n = int(length * SR); x = np.zeros(n)
    for _ in range(count):
        m = int(0.012 * SR); c = bp(rng.standard_normal(m), 1500, 6000) * np.exp(-t_(m) / 0.002)
        place(x, c, rng.random() * (length - 0.05), 0.4 + rng.random() * 0.6)
    return x


def sfx_beeps(length=2.0, f0=1200):
    n = int(length * SR); x = np.zeros(n)
    for i in range(int(length / 0.12)):
        m = int(0.06 * SR); f = f0 * (1 + 0.5 * (rng.random() > 0.5))
        place(x, np.sign(np.sin(2 * np.pi * f * t_(m))) * env(m, 0.002, 0.01) * 0.3, i * 0.12 + rng.random() * 0.03)
    return lp(x, 4000)


def sfx_impact(length=3.5):
    n = int(length * SR); t = t_(n)
    f = 30 + 60 * np.exp(-t / 0.18)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.8)
    crack = lp(rng.standard_normal(n), 2500) * np.exp(-t / 0.08) * 0.6
    tail = lp(rng.standard_normal(n), 400) * np.exp(-t / 1.2) * 0.4
    return reverb(np.tanh(1.6 * (boom + crack + tail)), 3, 1.2, 0.25)


def sfx_siren(length):
    """Two-tone Soviet-style alert wail: slow rise/fall, slightly gritty, with a long fade-out."""
    n = int(length * SR); t = t_(n)
    f = 520 + 300 * (0.5 - 0.5 * np.cos(2 * np.pi * t / 2.6))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sign(np.sin(2 * np.pi * np.cumsum(f * 2) / SR)) * 0.3
    x = bp(x, 300, 3000)
    e = np.minimum(1, t / 0.25) * np.clip((length - t) / 4.0, 0, 1)
    return reverb(x * e, 2.5, 1.0, 0.45)


def sfx_alert(length=3.0):
    n = int(length * SR); x = np.zeros(n)
    for i in range(int(length / 0.25)):
        m = int(0.14 * SR)
        place(x, np.sin(2 * np.pi * (1760 if i % 2 else 1320) * t_(m)) * env(m, 0.003, 0.02), i * 0.25)
    return x


def sfx_radar(length=2.4):
    n = int(length * SR); t = t_(n)
    ping = np.sin(2 * np.pi * 1450 * t) * np.exp(-t / 0.35)
    sweep = bp(rng.standard_normal(n), 300, 1400) * np.sin(np.pi * t / length) ** 2 * 0.25
    return reverb(ping * 0.6 + sweep, 2, 0.8, 0.4)


def sfx_tone(length=0.7, f=880):
    n = int(length * SR); t = t_(n)
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2 * t)) * env(n, 0.005, 0.2)


def sfx_pulse(length=0.5):
    n = int(length * SR); t = t_(n)
    return np.sin(2 * np.pi * (300 + 500 * np.exp(-t / 0.05)) * t) * np.exp(-t / 0.12)


def sfx_whoosh(length=1.6, f0=200, f1=3000):
    n = int(length * SR); x = rng.standard_normal(n); out = np.zeros(n)
    blocks = 64
    for b in range(blocks):
        a, z = b * n // blocks, (b + 1) * n // blocks
        fc = f0 * (f1 / f0) ** (b / blocks)
        out[a:z] = bp(x[a:z], max(40, fc * 0.6), min(20000, fc * 1.6))
    return out * np.sin(np.pi * t_(n) / length) ** 2


def sfx_heartbeat(length=6.0, bpm=58):
    n = int(length * SR); x = np.zeros(n)
    for k in range(int(length * bpm / 60)):
        for off, g in ((0, 1.0), (0.28, 0.7)):
            m = int(0.25 * SR); tt = t_(m)
            place(x, np.sin(2 * np.pi * (45 + 25 * np.exp(-tt / 0.04)) * tt) * np.exp(-tt / 0.09) * g, k * 60 / bpm + off)
    return lp(x, 200)


def sfx_typewriter(length=1.8, count=18):
    n = int(length * SR); x = np.zeros(n)
    for i in range(count):
        m = int(0.03 * SR)
        place(x, bp(rng.standard_normal(m), 1200, 7000) * np.exp(-t_(m) / 0.005), i * length / count + rng.random() * 0.02)
    m = int(0.4 * SR)
    place(x, np.sin(2 * np.pi * 2600 * t_(m)) * np.exp(-t_(m) / 0.15) * 0.3, length - 0.4)  # carriage bell
    return x


def sfx_tick(length=3.0):
    n = int(length * SR); x = np.zeros(n)
    for i in range(int(length)):
        m = int(0.02 * SR)
        place(x, bp(rng.standard_normal(m), 2000, 5000) * np.exp(-t_(m) / 0.003), i + 0.0)
    return x


def sfx_space(length=8.0):
    n = int(length * SR); t = t_(n)
    x = lp(rng.standard_normal(n), 600) * 0.4 + sum(np.sin(2 * np.pi * f * t + rng.random() * 6) * 0.08 for f in (220, 330, 440, 660))
    return reverb(x * env(n, 1.5, 2.5), 3, 1.5, 0.5)


def sfx_shimmer(length=2.5):
    n = int(length * SR); t = t_(n)
    x = sum(np.sin(2 * np.pi * f * t) * np.exp(-t / (0.6 + k * 0.2)) for k, f in enumerate((1760, 2349, 2637, 3520)))
    return reverb(x * env(n, 0.01, 0.5), 2.5, 1.0, 0.5)


# ---------------------------------------------------------------- music
def score():
    n = int(DUR * SR)
    L = np.zeros(n)
    t = t_(n)

    def ramp(a, b, c, d):  # 0 before a, up to 1 at b, held, down to 0 from c to d
        return np.clip((t - a) / max(1e-3, b - a), 0, 1) * np.clip((d - t) / max(1e-3, d - c), 0, 1)

    # dark drone: D1/D2/A2 with a breathing filter, until the warm ending takes over
    drone = sum(a * np.sin(2 * np.pi * hz(m) * t + rng.random()) for m, a in ((26, 0.7), (38, 0.5), (45, 0.25)))
    drone += lp(rng.standard_normal(n), 220) * 0.25
    L += drone * 0.35 * ramp(0, 2.0, S[14] + 2, S[14] + 6)

    # low orchestral tension pads (D minor -> Bb -> Gm -> A), from Petrov's introduction to the decision
    prog = [[50, 53, 57], [46, 50, 53], [43, 46, 50], [45, 49, 52]]
    bar = 2.4
    k, start = 0, S[4]
    while start < S[12]:
        ch = pad(prog[k % 4], bar + 0.6, 700 + 500 * (start > S[5]), 4, 0.12)
        place(L, ch * env(len(ch), 0.6, 0.6), start, 0.55)
        start += bar; k += 1

    # tension ostinato from the alarm: low pulse 8ths at 100 bpm, swelling through scenes 6-10
    alarm = word_t(5, "alarms")
    beat = 60 / 100
    tt = alarm
    i = 0
    while tt < S[12] - 0.2:
        m = int(0.18 * SR)
        hit = np.sin(2 * np.pi * hz(38 if i % 4 else 26) * t_(m)) * np.exp(-t_(m) / 0.09)
        stac = pad([62 if i % 8 < 4 else 60], 0.16, 2400, 3, 0.08) * env(int(0.16 * SR), 0.003, 0.06)
        inten = 0.5 + 0.5 * np.clip((tt - alarm) / (S[10] - alarm), 0, 1)
        place(L, hit, tt, 0.9 * inten)
        place(L, stac, tt, 0.35 * inten)
        tt += beat / 2; i += 1
    # impacts in the score at the alarm and "catastrophe"
    place(L, sfx_impact() * 0.6, alarm, 0.8)

    # space pad for the satellite explanation
    sp = pad([62, 69, 74, 76], S[14] - S[13] + 1.5, 2600, 3, 0.05)
    sp *= np.minimum(1, t_(len(sp)) / 1.2) * np.clip((len(sp) / SR - t_(len(sp))) / 1.5, 0, 1)
    place(L, sp, S[13], 0.35)

    # warm orchestral rise: D major -> B minor -> G -> A -> D, crescendo into the title
    rise = [[50, 54, 57, 62], [47, 50, 54, 59], [43, 47, 50, 55], [45, 49, 52, 57], [38, 50, 54, 57, 62, 66]]
    span = (DUR - S[14]) / 5.2
    for j, ch in enumerate(rise):
        ln = span + 1.2 if j < 4 else DUR - (S[14] + 4 * span)
        x = pad(ch, ln, 900 + j * 450, 5, 0.1) + 0.3 * pad([c + 12 for c in ch[-2:]], ln, 3000, 3, 0.06)
        x *= env(len(x), 0.8, 0.9 if j < 4 else 4.0)
        place(L, x, S[14] + j * span, 0.35 + 0.15 * j)
    # gentle low bell under the final title
    place(L, sfx_shimmer() * 0.5, S[15] + (PH[-1]["start"] - S[15]) + 1.0, 0.5)

    L = reverb(L, 3.0, 1.4, 0.35)
    fade = int(3.0 * SR)
    L[-fade:] *= np.linspace(1, 0, fade) ** 1.5
    return L


def main():
    files = {
        "bunker-hum.wav": sfx_hum(), "relay-clicks.wav": sfx_relays(), "computer-beeps.wav": sfx_beeps(),
        "impact-deep.wav": sfx_impact(), "siren.wav": sfx_siren(S[12] - word_t(5, "alarms") + 4.0),
        "alert-beeps.wav": sfx_alert(), "radar-sweep.wav": sfx_radar(), "warning-tone.wav": sfx_tone(),
        "pulse.wav": sfx_pulse(), "whoosh.wav": sfx_whoosh(), "heartbeat.wav": sfx_heartbeat(),
        "typewriter.wav": sfx_typewriter(), "clock-tick.wav": sfx_tick(), "space-ambience.wav": sfx_space(),
        "shimmer.wav": sfx_shimmer(),
    }
    for name, x in files.items():
        save(name, x, -3.0)

    alarm = word_t(5, "alarms")
    cues = [
        ("bunker-hum.wav", 0.0, 0.35), ("impact-deep.wav", 0.0, 0.55), ("radar-sweep.wav", 1.2, 0.25),
        ("typewriter.wav", S[2] + 0.25, 0.4), ("clock-tick.wav", S[2], 0.35),
        ("whoosh.wav", S[3] - 0.5, 0.35),
        ("relay-clicks.wav", S[4] + 0.6, 0.35), ("computer-beeps.wav", S[4] + 2.5, 0.12),
        ("siren.wav", alarm - 0.05, 0.32), ("alert-beeps.wav", alarm, 0.28), ("impact-deep.wav", alarm, 0.7),
        ("radar-sweep.wav", S[6] + 0.2, 0.35),
        *[("warning-tone.wav", S[6] + (30 + i * 22) / 30, 0.18) for i in range(5)],
        ("relay-clicks.wav", S[7] + 1.0, 0.3), ("pulse.wav", S[7] + 2.0, 0.25),
        ("whoosh.wav", S[8] - 0.4, 0.4), ("impact-deep.wav", word_t(8, "catastrophe."), 0.75),
        ("heartbeat.wav", S[9], 0.55),
        ("pulse.wav", word_t(10, "one"), 0.35), *[("pulse.wav", word_t(10, "four") + i * 7 / 30, 0.3) for i in range(4)],
        ("warning-tone.wav", word_t(10, "five"), 0.3), ("whoosh.wav", PH[11]["start"] - 0.5, 0.3),
        ("relay-clicks.wav", S[11] + 0.3, 0.35), ("typewriter.wav", word_t(11, "false"), 0.35),
        ("heartbeat.wav", S[12], 0.6), ("clock-tick.wav", S[12] + 0.2, 0.45),
        ("whoosh.wav", S[13] - 0.6, 0.45), ("space-ambience.wav", S[13], 0.5), ("shimmer.wav", S[13] + 4.5, 0.4),
        ("whoosh.wav", S[14] - 0.5, 0.3),
        ("impact-deep.wav", PH[-1]["start"] + 1.0, 0.45),
    ]
    (ROOT / "src" / "sfx-cues.json").write_text(json.dumps([{"file": f, "at": round(a, 3), "volume": v} for f, a, v in cues], indent=1))

    m = score()
    m = m / (np.abs(m).max() + 1e-9) * 10 ** (-3 / 20)
    mp = ROOT / "public" / "audio" / "background-music.wav"
    sf.write(mp, np.stack([m, m], 1).astype(np.float32), SR, subtype="PCM_16")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(mp), "-b:a", "224k", str(mp.with_suffix(".mp3"))], check=True)
    print(f"music + {len(files)} sfx + {len(cues)} cues; alarm at {alarm:.2f}s")


if __name__ == "__main__":
    main()
