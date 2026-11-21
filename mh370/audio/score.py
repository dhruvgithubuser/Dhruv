# /// script
# requires-python = ">=3.10"
# dependencies = ["librosa>=0.10", "numpy", "scipy", "soundfile"]
# ///
"""MH370 score: 120 s at 72 bpm (144 beats, 36 bars), D minor. Sober documentary bed:
low drone, felt-piano motif, a clock tick on the beat, heartbeat sub-pulse while the plane goes
dark, swells at the satellite, the debris and the memorial. Writes audio/music.wav + beats.json.

    MOTION_REEL_SKILL=<skill> uv run mh370/audio/score.py
"""
import json
import os
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

sys.path.insert(0, str(Path(os.environ["MOTION_REEL_SKILL"]) / "scripts"))
import dsp  # noqa: E402
from dsp import SR, Bus, adsr, crash, filt, hz, measure_beats, pad_chord, reverb, sub_drop, tvec  # noqa: E402

FILM = Path(__file__).resolve().parent.parent
BPM, DUR = 72.0, 120.0
BEAT = 60 / BPM
NB = int(round(DUR / BEAT))  # 144
dsp.seed(370)


def piano(note, length=3.0, bright=1.0):
    """Felt piano: a few inharmonic partials, soft hammer, long decay."""
    n = int(length * SR)
    t = tvec(n)
    f = hz(note)
    x = np.zeros(n)
    for k, a in ((1, 1.0), (2, 0.42 * bright), (3, 0.18 * bright), (4, 0.08 * bright), (5, 0.04 * bright)):
        fk = f * k * (1 + 0.0004 * k * k)
        x += a * np.sin(2 * np.pi * fk * t) * np.exp(-t * (0.9 + 0.55 * k))
    x += 0.15 * np.sin(2 * np.pi * f * 1.002 * t) * np.exp(-t * 0.7)
    hammer = filt(dsp.rng.standard_normal(n), "lowpass", 1800) * np.exp(-t / 0.006) * 0.05
    return (x + hammer) * (1 - np.exp(-t / 0.004)) * np.clip((length - t) / 0.3, 0, 1)


def tick(hi=True):
    n = int(0.06 * SR)
    t = tvec(n)
    x = filt(dsp.rng.standard_normal(n), "bandpass", (2500, 6500) if hi else (1500, 4000))
    x += 0.4 * np.sin(2 * np.pi * (2100 if hi else 1600) * t)
    return x * np.exp(-t / 0.006)


def heartbeat():
    n = int(0.5 * SR)
    t = tvec(n)
    f = 48 + 30 * np.exp(-t / 0.03)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12) * (1 - np.exp(-t / 0.004))


def drone(length, notes, cutoff):
    n = int(length * SR)
    t = tvec(n)
    x = np.zeros(n)
    for nt, a in notes:
        f = hz(nt)
        x += a * (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * 1.001 * t + 0.4))
    x += 0.04 * filt(dsp.rng.standard_normal(n), "bandpass", (180, 900))  # air / tape hiss
    return filt(x, "lowpass", cutoff)


ticks, keys_, low, fx = (Bus(DUR, BPM) for _ in range(4))

# chord loop per bar: Dm | Bb | F | C ; root (bass) + piano voicing + motif notes (one per beat)
LOOP = [
    ("D2", ["D4", "F4", "A4"], ["A4", "F5", "E5", "D5"]),
    ("Bb1", ["D4", "F4", "Bb4"], ["F5", "D5", "C5", "Bb4"]),
    ("F2", ["C4", "F4", "A4"], ["A4", "C5", "F5", "E5"]),
    ("C2", ["C4", "E4", "G4"], ["G4", "E5", "D5", "C5"]),
]

# sections (beats): hook 0, title 8, story 16, dark 32, turn 40, satellite 56, arcs 68, south 80,
# search 92, debris 100, report 112, still 120, memorial 132
for b in range(NB):
    bar = b // 4
    dark = 36 <= b < 40           # the transponder goes silent: the tick stops
    if b < 132 and not dark:
        ticks.add(tick(b % 4 == 0), b, 0.22 if b % 4 == 0 else 0.13, pan=0.12)
    if b % 4 == 0 and b < 132:
        root, chord, motif = LOOP[bar % 4]
        intensity = 0.55 if b < 16 else 0.7 if b < 56 else 0.85 if b < 112 else 0.65
        if not (32 <= b < 40):
            for i, nt in enumerate(chord):
                keys_.add(piano(nt, 4 * BEAT + 1.2, 0.6), b, 0.16 * intensity, pan=-0.2 + 0.2 * i)
        # motif: sparse at first, full in the middle, thinning in the report section
        steps = [0] if b < 16 else [0, 2] if b < 56 else [0, 1, 2, 3] if b < 112 else [0, 2]
        if 32 <= b < 40:
            steps = [0]
        for s in steps:
            keys_.add(piano(motif[s], 2.6, 1.0), b + s, 0.30 * intensity, pan=0.15)
        low.add(drone(4 * BEAT + 0.6, [(root, 0.5), (root[:-1] + str(int(root[-1]) + 1), 0.25)], 400 + 300 * intensity), b, 0.55)
    # heartbeat sub-pulse while the aircraft is dark (b36..56)
    if 36 <= b < 56:
        low.add(heartbeat(), b, 0.55)
        low.add(heartbeat(), b + 0.28, 0.32)

# swells into the structural moments (end ON the beat)
for target, length, gain in ((8, 2.5, 0.22), (56, 4.0, 0.3), (100, 3.3, 0.26), (132, 4.0, 0.25)):
    rev = crash(length)[::-1]
    fx.add(rev, target - length / BEAT, gain)
    fx.add(sub_drop(1.6, 62, 30), target, 0.35)
fx.add(sub_drop(2.4, 55, 26), 36, 0.5)  # transponder off: low drop into silence
fx.add(sub_drop(1.2, 70, 30), 0, 0.45)

# memorial: open D minor add9 pad + a single high piano line, ringing out
fx.add(pad_chord(["D3", "A3", "E4", "F4", "A4"], 10.5, (2600, 700), attack=0.6, release=2.0), 132, 0.32)
for i, nt in enumerate(["A5", "F5", "E5", "D5"]):
    keys_.add(piano(nt, 5.0, 0.8), 132 + i * 2, 0.3)
keys_.add(piano("D3", 7.0, 0.5), 132, 0.3)
keys_.add(piano("D6", 6.0, 0.6), 138, 0.18)

N = ticks.n
mix = ticks.x + reverb(keys_.x, 0.45, length=3.0, decay=1.1) + low.x + reverb(fx.x, 0.3)
mix = mix[:, :N]
fade = int(3.0 * SR)
mix[:, -fade:] *= np.linspace(1, 0, fade) ** 1.5
mix *= 10 ** (-3 / 20) / (np.abs(mix).max() + 1e-9)
sf.write(FILM / "audio" / "music.wav", mix.T.astype(np.float32), SR, subtype="FLOAT")

grid_src = ticks.x[:, :N].mean(axis=0)
grid = measure_beats(grid_src.astype(np.float32), SR, BPM, n_beats=NB + 1)
grid["sections"] = [{"name": n, "beat": b} for n, b in (
    ("hook", 0), ("title", 8), ("departure", 16), ("lastwords", 24), ("dark", 32), ("turn", 40), ("lastradar", 48),
    ("satellite", 56), ("arcs", 68), ("south", 80), ("search", 92), ("debris", 100), ("report", 112),
    ("still", 120), ("memorial", 132))]
grid["source"] = "bespoke score (audio/score.py), 72 bpm D minor; grid measured on the clock-tick stem"
(FILM / "beats.json").write_text(json.dumps(grid, indent=1))
print(f"music.wav {DUR}s; grid {grid['bpm']} bpm offset {grid['offset']} residual {grid['fit_residual_ms']} ms")
