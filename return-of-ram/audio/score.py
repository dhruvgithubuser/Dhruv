# /// script
# requires-python = ">=3.10"
# dependencies = ["librosa>=0.10", "numpy", "scipy", "soundfile"]
# ///
"""Bespoke score for The Return of Ram. Reads timeline.json (shared with film.js) so the music,
fireworks and narration sit on the same clock as the picture.

    MOTION_REEL_SKILL=<skill> uv run return-of-ram/audio/score.py

Writes audio/music.wav, audio/vo.wav, beats.json.
Key: D (Yaman colour: raised 4th, G#), 72 bpm. Dark drone -> strings -> conch + choir + tabla -> finale.
"""
import json, os, sys
from pathlib import Path
import numpy as np
import soundfile as sf
import librosa

sys.path.insert(0, os.path.join(os.environ["MOTION_REEL_SKILL"], "scripts"))
import dsp  # noqa
from dsp import SR, Bus, filt, peq, adsr, tvec, saw, pad_chord, bass_note, ks_pluck, bol, crash, riser, \
    sub_drop, whoosh, reverb, hz, harmonium, keys, limit  # noqa

FILM = Path(__file__).resolve().parent.parent
TL = json.loads((FILM / "timeline.json").read_text())
CFG = json.loads((FILM / "film.json").read_text())
DUR = float(CFG["duration"])
BPM = 72
P = 60 / BPM
NB = int(round(DUR / P))
dsp.seed(72)
rng = np.random.default_rng(7)


# ---------------------------------------------------------------- instruments
def bell(f0=392.0, length=5.0, bright=1.0):
    """Temple bell: inharmonic partials, long decay, slight beating."""
    n = int(length * SR); t = tvec(n)
    parts = [(0.5, 0.5, 3.5), (1.0, 1.0, 3.0), (1.19, 0.5, 2.2), (1.56, 0.4, 1.6), (2.0, 0.45, 1.4),
             (2.74, 0.3 * bright, 0.9), (3.76, 0.2 * bright, 0.6), (5.4, 0.12 * bright, 0.35)]
    x = sum(a * np.sin(2 * np.pi * f0 * m * t * (1 + 0.0007 * np.sin(2 * np.pi * 1.3 * t))) * np.exp(-t / d) for m, a, d in parts)
    x += filt(rng.standard_normal(n) * np.exp(-t / 0.004), "bandpass", [2000, 9000]) * 0.4
    return x * (1 - np.exp(-t / 0.0006)) / 2.5


def conch(length=3.2, f0=hz("D4")):
    """Shankh: nasal reed tone, pitch scoops up, breath noise, formants."""
    n = int(length * SR); t = tvec(n)
    f = f0 * (0.94 + 0.06 * (1 - np.exp(-t / 0.35))) * (1 + 0.004 * np.sin(2 * np.pi * 5.2 * t) * np.clip(t - 0.6, 0, 1))
    ph = np.cumsum(f) / SR
    x = sum((1 / k) * np.sin(2 * np.pi * k * ph) for k in range(1, 14))
    x = np.tanh(2.2 * x)
    x = peq(peq(peq(x, 950, 9, 2.5), 1750, 6, 3), 2900, 4, 3)
    x += filt(rng.standard_normal(n), "bandpass", [700, 3000]) * 0.08
    env = np.clip(t / 0.5, 0, 1) ** 1.5 * np.clip((length - t) / 0.9, 0, 1)
    return filt(x, "highpass", 180) * env * 0.35


def flute(note, length, vib=0.012):
    """Bansuri-like: sine + 2nd/3rd partials, delayed vibrato, breath."""
    n = int(length * SR); t = tvec(n)
    f = hz(note) * (1 + vib * np.clip((t - 0.25) / 0.4, 0, 1) * np.sin(2 * np.pi * 5.0 * t))
    ph = np.cumsum(f) / SR
    x = np.sin(2 * np.pi * ph) + 0.18 * np.sin(4 * np.pi * ph) + 0.06 * np.sin(6 * np.pi * ph)
    x += filt(rng.standard_normal(n), "bandpass", [1500, 6000]) * 0.05
    return x * adsr(n, 0.12, 0.3, 0.85, 0.35) * 0.5


def strings(notes, length, cutoff=(900, 2400), attack=1.2):
    """Ensemble strings: slow-attack detuned saws, darker than a synth pad."""
    x = pad_chord(notes, length, cutoff, attack=attack, release=1.2, voices=5, detune=0.09)
    return x * 1.2


def choir(notes, length, attack=1.6):
    """'Aah' choir: detuned saws through vowel formants."""
    x = pad_chord(notes, length, 3800, attack=attack, release=1.5, voices=5, detune=0.14)
    out = []
    for ch in x:
        y = peq(peq(peq(ch, 730, 10, 2.2), 1090, 7, 2.5), 2440, 4, 3)
        out.append(filt(y, "lowpass", 3200))
    return np.stack(out) * 0.35


def tanpura(sa, length):
    """Pa-Sa-Sa-Sa cycle, plucked with jawari buzz."""
    n = int(length * SR); out = np.zeros(n)
    notes = [sa * 1.5 / 2, sa, sa, sa / 2]
    cyc = 2 * P
    for i in range(int(length / cyc) + 1):
        for j, f in enumerate(notes):
            st = int((i * cyc + j * cyc / 4) * SR)
            if st >= n: break
            s = ks_pluck(f, length=3.0, bright=0.35, buzz=0.6)
            e = min(n, st + len(s)); out[st:e] += s[: e - st]
    return out * 0.35


def firework(size=1.0):
    """Launch thump + bang + crackle tail."""
    n = int(3.0 * SR); t = tvec(n)
    bang = sub_drop(1.2, 90, 32)[:n] * 0.9
    bang = np.pad(bang, (0, n - len(bang)))
    crack = np.zeros(n)
    for k in range(int(40 * size)):
        st = int((0.15 + rng.exponential(0.5)) * SR)
        if st >= n - 400: continue
        c = rng.standard_normal(300) * np.exp(-np.arange(300) / 40)
        crack[st:st + 300] += c * rng.uniform(0.1, 0.4) * np.exp(-st / SR / 1.2)
    crack = filt(crack, "highpass", 1500)
    body = filt(rng.standard_normal(n), "lowpass", 900) * np.exp(-t / 0.18) * 0.6
    return (bang + body + crack) * size * 0.5


# ---------------------------------------------------------------- arrangement
D3, sa = "D3", hz("D4") / 2
CH = {  # chord tones (pad voicing), bass
    "D": (["D3", "A3", "F#4", "A4"], "D2"), "Dm": (["D3", "A3", "F4", "A4"], "D2"),
    "Bm": (["B2", "F#3", "D4", "F#4"], "B1"), "G": (["G2", "D3", "B3", "D4"], "G1"),
    "A": (["A2", "E3", "C#4", "E4"], "A1"), "Em": (["E3", "B3", "G4", "B4"], "E2"),
    "Gmaj7": (["G2", "D3", "F#3", "B3"], "G1"), "Bb": (["Bb2", "F3", "D4", "F4"], "Bb1"),
}
music, perc, fx, choirb = (Bus(DUR, BPM) for _ in range(4))


def chords(seq, start, bars_each, inst="strings", gain=1.0, cutoff=(900, 2400)):
    b = start
    for c in seq:
        notes, bass = CH[c]
        ln = bars_each * 4 * P + 1.0
        if inst == "strings":
            music.add(strings(notes, ln, cutoff), b, gain)
        elif inst == "choir":
            choirb.add(choir([dsp.note_name(dsp.midi(x) + 12) for x in notes], ln), b, gain)
        music.add(np.stack([bass_note(bass, ln, 300)] * 2) * 0.35, b, gain * 0.7)
        b += bars_each * 4


# 0 .. 15  dark opening: low drone, bells, mist
music.add(np.stack([tanpura(sa, 15 * P + 2)] * 2), 0, 0.7)
music.add(strings(["D2", "A2", "D3"], 15 * P + 2, (300, 700), attack=0.4), 0, 0.9)
fx.add(bell(hz("D4"), 6), 0, 0.9, -0.2)
fx.add(bell(hz("A4"), 5, 0.6), 4, 0.5, 0.3)
fx.add(whoosh(2.2, 200, 1200, peak=0.8), 3, 0.25)
music.add(flute("A4", 2.3), 4.5, 0.35); music.add(flute("G#4", 1.0), 7, 0.3); music.add(flute("A4", 1.6), 8, 0.3)
# title swell (brass-ish low strings) b8..b15
music.add(strings(["D2", "A2", "D3", "F#3"], 7 * P + 2, (400, 2200), attack=2.2), 8, 1.1)
fx.add(bell(hz("D5"), 5, 0.8), 10, 0.4, 0.2)

# 15 .. 38  journey: strings D Bm G A, flute line, tanpura continues
music.add(np.stack([tanpura(sa, 23 * P + 2)] * 2), 15, 0.5)
chords(["D", "Bm", "G", "A"], 15, 1.0, gain=0.8)
chords(["D", "Bm", "Gmaj7", "A"], 31, 1.0, gain=0.75)
mel = [(16, "F#4", 1.5), (17.5, "A4", 1.5), (19, "B4", 2), (21, "A4", 1), (22, "G#4", 1), (23, "A4", 3),
       (27, "D5", 1.5), (28.5, "C#5", 1.5), (30, "B4", 2), (32, "A4", 2), (34, "F#4", 2)]
for b, nt, l in mel:
    music.add(flute(nt, l * P + 0.4), b, 0.33, 0.1)
fx.add(whoosh(1.4, 300, 2500), 14.2, 0.3)          # cloud push into vimana
for b in (26, 30, 34):
    fx.add(bell(hz("A5"), 3, 0.5), b, 0.18, 0.4)   # small house bells while the city prepares

# 38 .. 50  the single flame: hush, one bell, pluck ostinato, riser into the arrival
fx.add(bell(hz("D4"), 7), 38, 1.0)
music.add(strings(["D3", "A3", "D4"], 12 * P + 1, (500, 1600), attack=2.0), 38, 0.6)
for i in range(16):
    b = 42 + i * 0.5
    music.add(np.stack([ks_pluck(hz(["D4", "A4", "D5", "A4"][i % 4]), 1.2, 0.5, 0.4)] * 2), b, 0.18 + 0.012 * i)
fx.add(riser(4 * P), 46, 0.5)

# 50 .. 77  arrival + city of lights: conch, crash, choir, tabla from the wave
fx.add(conch(3.6), 50, 0.9)
fx.add(conch(3.0, hz("A4")), 52.5, 0.45, 0.2)
fx.add(np.stack([crash(3.0)] * 2), 50, 0.45)
fx.add(sub_drop(1.4), 50, 0.7)
for b in (50, 52, 54):
    fx.add(bell(hz("D5"), 4, 0.8), b + 0.5, 0.3, -0.3 + 0.3 * (b - 50) / 2)
chords(["D", "G", "A", "D"], 50, 1.0, gain=1.0, cutoff=(1200, 3500))
chords(["D", "G", "Bm", "A"], 50, 1.0, inst="choir", gain=0.9)
chords(["D", "Bm", "G", "A"], 66, 0.75, gain=1.0, cutoff=(1500, 3800))
chords(["D", "Bm", "G", "A"], 66, 0.75, inst="choir", gain=1.0)
fx.add(riser(3 * P), 59, 0.35)
# tabla keherwa: dha ge na ti | na ka dhi na  (eighths) from b62 to b77
TH = ["dha", "ge", "na", "ti", "na", "ka", "dhi", "na"]
def tabla(b0, b1, gain=0.55):
    b = b0; i = 0
    while b < b1:
        g = gain * (1.0 if i % 8 in (0, 6) else 0.75)
        perc.add(bol(TH[i % 8], sa=hz("D5")), b, g, 0.1 * ((i % 2) * 2 - 1))
        b += 0.5; i += 1
tabla(62, 77)
fx.add(sub_drop(1.0), 62, 0.5)

# 77 .. 104  reunion + dharma: soft keys, warm strings, no drums
chords(["G", "D", "Em", "A", "G", "D", "Bm", "A"], 77, 0.75, gain=0.7, cutoff=(700, 1800))
for i, c in enumerate(["G", "D", "Em", "A", "G", "D", "Bm", "A", "G", "D"]):
    music.add(np.stack([keys(CH[c][0][1:], 2.6)] * 2), 77 + i * 3, 0.25)
mel2 = [(78, "B4", 2), (80, "A4", 1), (81, "F#4", 2), (84, "E4", 1.5), (85.5, "F#4", 1.5), (87, "A4", 3),
        (90, "D5", 2), (92, "C#5", 1), (93, "B4", 2), (96, "A4", 3), (100, "F#4", 3)]
for b, nt, l in mel2:
    music.add(flute(nt, l * P + 0.5), b, 0.3, -0.1)
fx.add(bell(hz("D4"), 6, 0.7), 90, 0.4)

# 104 .. 114  devotion + light within: low choir, build
chords(["Bm", "G", "Bb"], 104, 1.0, inst="choir", gain=0.7)
music.add(strings(["D2", "A2", "D3"], 10 * P + 2, (400, 2000), attack=1.5), 104, 0.8)
fx.add(bell(hz("A4"), 5), 109, 0.6)
fx.add(riser(5 * P), 109, 0.5)

# 114 .. 144  finale: full ensemble, tabla, fireworks, conch, resolve
fx.add(np.stack([crash(3.0)] * 2), 114, 0.5); fx.add(sub_drop(1.4), 114, 0.7)
chords(["D", "G", "A", "D", "Bm", "G", "A", "D"], 114, 0.75, gain=1.05, cutoff=(1600, 4200))
chords(["D", "G", "A", "D", "Bm", "G", "A", "D"], 114, 0.75, inst="choir", gain=1.1)
tabla(114, 136, 0.6)
fx.add(conch(4.0), 128, 0.85)
fx.add(np.stack([crash(4.0)] * 2), 128, 0.4)
music.add(strings(["D2", "A2", "D3", "F#3", "A3", "D4"], 8 * P + 4, (2400, 900), attack=0.6), 136, 1.0)
choirb.add(choir(["D4", "A4", "F#5", "A5"], 8 * P + 4), 136, 1.0)
for b in (136, 138, 140):
    fx.add(bell(hz(["D5", "A4", "D4"][(b - 136) // 2]), 6), b, 0.5)
for fw in TL["fireworks"]:
    fx.add(firework(fw[4]), fw[0], 0.55, (fw[1] - 0.5) * 1.2)

# ---------------------------------------------------------------- render stems
def finish(bus, wet=0.35, **kw):
    x = bus.x[:, : int(DUR * SR)]
    return reverb(x, wet, **kw)

m = finish(music, 0.45, length=3.0, decay=0.9) + finish(choirb, 0.6, length=3.5, decay=1.1) * 1.1 \
    + finish(perc, 0.2) * 0.9 + finish(fx, 0.4, length=3.0, decay=0.9)
# fade out last 2 s
n = m.shape[1]; fade = np.ones(n); k = int(2.0 * SR); fade[-k:] = np.linspace(1, 0, k) ** 2
m *= fade
m = m / np.abs(m).max() * 10 ** (-3 / 20)
sf.write(FILM / "audio" / "music.wav", m.T.astype(np.float32), SR)

# narration: phrases placed at their timeline times, light EQ + room
vo = np.zeros(n + SR)
for v in TL["vo"]:
    y, _ = librosa.load(FILM / v["file"], sr=SR)
    st = int(v["t"] * SR); vo[st: st + len(y)] += y[: len(vo) - st]
vo = peq(peq(filt(vo, "highpass", 80), 180, 2.0, 0.9), 3500, 2.5, 1.0)[:n]
vo2 = reverb(np.stack([vo, vo]), 0.12, length=1.2, decay=0.35)
vo2 = vo2 / np.abs(vo2).max() * 10 ** (-3 / 20)
sf.write(FILM / "audio" / "vo.wav", vo2.T.astype(np.float32), SR)

grid = {"bpm": BPM, "period": P, "offset": 0.0, "designed_bpm": BPM,
        "beats": [round(i * P, 5) for i in range(NB + 1)], "downbeats": [round(i * P, 5) for i in range(0, NB + 1, 4)],
        "sections": {"opening": [0, 15], "journey": [15, 38], "flame": [38, 50], "arrival": [50, 77],
                     "reunion": [77, 104], "devotion": [104, 114], "finale": [114, NB]}}
(FILM / "beats.json").write_text(json.dumps(grid, indent=1))
print("music", m.shape[1] / SR, "s; vo placed", len(TL["vo"]), "phrases")
