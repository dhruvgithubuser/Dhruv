# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy", "scipy", "soundfile"]
# ///
"""Score + sound design for POMPEII, synthesized in code (no samples, no licences to clear).

    uv run pompeii/audio/sound.py            -> pompeii/audio/music.wav, pompeii/audio/sfx.wav

Reads pompeii/timeline.json (narration clock) and pompeii/cues.json (shot list: ambience per shot +
timed SFX). The music cue sheet below follows docs/J_sound_design.md. Everything is seeded.
"""
import json, os
import numpy as np
import soundfile as sf
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__)); FILM = os.path.dirname(HERE)
SR = 48000
TL = json.load(open(os.path.join(FILM, "timeline.json")))
CU = json.load(open(os.path.join(FILM, "cues.json")))
DUR = TL["duration"]; N = int(DUR * SR) + SR * 4
SC = {s["id"]: s for s in TL["scenes"]}
def L(sc, i=-1, off=0.0): return (SC[sc]["start"] if i < 0 else SC[sc]["lines"][i]["start"]) + off
rng = np.random.default_rng(79)

# ---------------------------------------------------------------- helpers
NOTE = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}
def hz(n):
    name, octv = (n[:2], n[2:]) if len(n) > 2 and n[1] in "#b" else (n[:1], n[1:])
    return 440.0 * 2 ** ((NOTE[name] + 12 * (int(octv) + 1) - 69) / 12)
def tv(n): return np.arange(n) / SR
def filt(x, kind, f, order=2): return signal.sosfilt(signal.butter(order, f, btype=kind, fs=SR, output="sos"), x)
def saw(f, n, ph=0.0):
    p = (np.cumsum(np.full(n, f) if np.isscalar(f) else f) / SR + ph) % 1.0
    return 2 * p - 1
def env(n, a, r, s=1.0):
    e = np.ones(n) * s; ai, ri = max(1, int(a * SR)), max(1, int(r * SR))
    e[:ai] *= np.linspace(0, 1, min(ai, n))[: min(ai, n)] if ai <= n else np.linspace(0, 1, n)
    if ri < n: e[-ri:] *= np.linspace(1, 0, ri)
    return e
def pan(x, p):
    a = (p + 1) / 2; return np.stack([x * np.sqrt(1 - a), x * np.sqrt(a)])
class Bus:
    def __init__(self): self.x = np.zeros((2, N))
    def add(self, sig, t, g=1.0, p=0.0):
        if sig.ndim == 1: sig = pan(sig, p)
        s = int(t * SR); e = min(N, s + sig.shape[1])
        if s < 0: sig = sig[:, -s:]; s = 0
        if e > s: self.x[:, s:e] += g * sig[:, : e - s]
def reverb(x, length=3.2, decay=1.1, wet=0.35, seed=3):
    r = np.random.default_rng(seed); n = int(length * SR); t = tv(n)
    ir = np.stack([r.standard_normal(n), r.standard_normal(n)]) * np.exp(-t / decay)
    ir = np.stack([filt(c, "lowpass", 5000) for c in ir]); ir /= np.sqrt((ir ** 2).sum(1, keepdims=True))
    return x + wet * np.stack([signal.fftconvolve(x[c], ir[c])[: x.shape[1]] for c in range(2)])

# ---------------------------------------------------------------- instruments
def strings(notes, dur, a=1.6, r=2.0, cut=1900, trem=0.0, bright=1.0):
    n = int(dur * SR); t = tv(n); out = np.zeros((2, n))
    for i, nt in enumerate(notes):
        f = hz(nt)
        for v in range(4):
            vib = 1 + 0.003 * np.sin(2 * np.pi * (5.1 + 0.3 * v) * t + v)
            x = saw(f * (1 + (v - 1.5) * 0.0035) * vib, n, rng.uniform())
            out += pan(x, ((i + v) % 3 - 1) * 0.5)
    out = np.stack([filt(c, "lowpass", cut * bright) for c in out])
    e = env(n, a, r)
    if trem: e = e * (0.65 + 0.35 * np.sin(2 * np.pi * trem * t) ** 2)
    return out * e / np.sqrt(len(notes) * 4) * 0.5
def choir(notes, dur, a=2.0, r=2.5, vowel=(700, 1150)):
    n = int(dur * SR); t = tv(n); x = np.zeros(n)
    for nt in notes:
        for v in range(5): x += saw(hz(nt) * (1 + (v - 2) * 0.004) * (1 + 0.004 * np.sin(2 * np.pi * 4.6 * t + v)), n, rng.uniform())
    y = sum(filt(x, "bandpass", [f * 0.8, f * 1.2]) * g for f, g in zip(vowel, (1.0, 0.6)))
    y = filt(y + 0.15 * filt(x, "lowpass", 400), "lowpass", 3000)
    st = np.stack([y, np.roll(y, 300)])
    return st * env(n, a, r) / np.sqrt(len(notes) * 5) * 0.7
def drone(note, dur, a=3.0, r=3.0, g=1.0):
    n = int(dur * SR); t = tv(n); f = hz(note)
    x = np.sin(2 * np.pi * f * t) + 0.4 * filt(saw(f, n), "lowpass", 300) + 0.3 * np.sin(2 * np.pi * f * 2.003 * t)
    return pan(x * env(n, a, r) * (0.85 + 0.15 * np.sin(2 * np.pi * 0.11 * t)) * 0.35 * g, 0)
def harp(note, dur=2.5, bright=0.6):
    n = int(dur * SR); t = tv(n); f = hz(note); x = np.zeros(n)
    for k in range(1, 9): x += np.sin(2 * np.pi * f * k * t + rng.uniform()) * np.exp(-t * (1.2 + k * 0.9 / bright)) / k ** 1.1
    return x * (1 - np.exp(-t / 0.002)) * 0.35
def pizz(note, dur=0.6):
    n = int(dur * SR); t = tv(n); f = hz(note)
    x = filt(saw(f, n), "lowpass", 1400) * np.exp(-t / 0.12) + np.sin(2 * np.pi * f * t) * np.exp(-t / 0.2)
    return x * (1 - np.exp(-t / 0.002)) * 0.35
def ost(note, dur=0.28, cut=900):
    n = int(dur * SR); t = tv(n); f = hz(note)
    x = filt(saw(f, n) + saw(f * 1.004, n), "lowpass", cut) * (1 - np.exp(-t / 0.008)) * np.exp(-t / (dur * 0.6))
    return x * 0.3
def taiko(dur=1.2, f0=62, g=1.0):
    n = int(dur * SR); t = tv(n); f = f0 * (1 + 0.6 * np.exp(-t / 0.03))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.35) + filt(rng.standard_normal(n), "lowpass", 900) * np.exp(-t / 0.05) * 0.5
    return np.tanh(1.5 * x) * g * 0.6
def timp(note="D2", dur=2.0, g=1.0):
    n = int(dur * SR); t = tv(n); f = hz(note) * (1 + 0.05 * np.exp(-t / 0.05))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.7) + 0.4 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR) * np.exp(-t / 0.4)
    x += filt(rng.standard_normal(n), "bandpass", [80, 900]) * np.exp(-t / 0.04) * 0.4
    return x * g * 0.5
def roll(note, dur, g=1.0):
    n = int(dur * SR); t = tv(n); x = np.zeros(n)
    for k in range(int(dur * 14)): s = int(k / 14 * SR); h = timp(note, 0.6, 0.35 + 0.65 * (k / (dur * 14)))[: n - s]; x[s:s + len(h)] += h
    return x * g * 0.6
def bell(note, dur=4.0, g=1.0):
    n = int(dur * SR); t = tv(n); f = hz(note)
    x = sum(np.sin(2 * np.pi * f * m * t) * np.exp(-t / d) * a for m, d, a in [(1, 2.2, 1), (2.76, 1.2, 0.5), (5.4, 0.6, 0.3), (8.93, 0.3, 0.2)])
    return x * (1 - np.exp(-t / 0.001)) * g * 0.25
def flute(notes, step, g=1.0):  # legato breathy line: [(note|None, beats)]
    out = [];
    for nt, b in notes:
        n = int(b * step * SR); t = tv(n)
        if nt is None: out.append(np.zeros(n)); continue
        f = hz(nt) * (1 + 0.004 * np.sin(2 * np.pi * 5.2 * t) * np.clip(t / 0.4, 0, 1))
        x = np.sin(2 * np.pi * np.cumsum(np.full(n, f) if np.isscalar(f) else f) / SR) + 0.15 * filt(rng.standard_normal(n), "bandpass", [hz(nt) * 0.9, hz(nt) * 3])
        out.append(x * env(n, 0.12, 0.15))
    return np.concatenate(out) * g * 0.18
def cello(notes, step, g=1.0):
    out = []
    for nt, b in notes:
        n = int(b * step * SR); t = tv(n)
        if nt is None: out.append(np.zeros(n)); continue
        f = hz(nt) * (1 + 0.005 * np.sin(2 * np.pi * 5.0 * t) * np.clip(t / 0.5, 0, 1))
        x = filt(saw(f, n) + 0.5 * saw(f * 1.003, n), "lowpass", 1500) + 0.3 * np.sin(2 * np.pi * np.cumsum(f) / SR)
        out.append(x * env(n, 0.35, 0.35))
    return np.concatenate(out) * g * 0.22

M = Bus()
def chords(seq, t0, each, **kw):
    t = t0
    for ch in seq: M.add(strings(ch, each + 1.8, **kw), t, kw.pop("_g", 1.0) if "_g" in kw else 1.0); t += each
def arp(seq, t0, t1, step, inst=harp, g=0.8, oct_up=True):
    t, i = t0, 0
    while t < t1:
        ch = seq[int((t - t0) / ((t1 - t0) / len(seq))) % len(seq)]
        nt = ch[i % len(ch)]; M.add(inst(nt), t, g, 0.3 * ((i % 3) - 1)); t += step; i += 1

# ---------------------------------------------------------------- the cue sheet
# S01 warm opening (D major), turns minor on "a volcano"
s1e = L("S01", 4)
for i, ch in enumerate([["D3", "A3", "F#4", "E5"], ["B2", "F#3", "D4", "A4"], ["G2", "D3", "B3", "F#4"], ["A2", "E3", "C#4", "E4"], ["D3", "A3", "F#4", "A4"]]):
    M.add(strings(ch, 7.4, a=2.2, r=2.0, cut=1700), 0.5 + i * 6.0, 0.9)
arp([["D4", "F#4", "A4", "E5"], ["B3", "D4", "F#4", "A4"], ["G3", "B3", "D4", "F#4"], ["A3", "C#4", "E4", "A4"]], 2.0, s1e - 0.5, 0.40, g=0.6)
M.add(flute([("A5", 3), ("F#5", 1), ("E5", 2), ("D5", 2), (None, 2), ("B4", 3), ("C#5", 1), ("D5", 2), ("E5", 4)], 0.8), 8.0, 0.8)
M.add(strings(["D2", "A2", "F3", "D4"], DUR and 7.5, a=1.0, r=3.0, cut=900), s1e - 0.2, 1.0)
M.add(drone("D1", 8), s1e, 0.9); M.add(roll("D2", 2.4, 0.8), L("S01", 4, 2.0)); M.add(timp("D2", 3, 1.0), L("S01", 4, 4.3))
# S02 pastoral bustle
s2, s2b = L("S02"), L("S02", 5)
prog2 = [["G2", "D3", "B3", "G4"], ["F#2", "D3", "A3", "F#4"], ["E2", "B2", "G3", "E4"], ["A2", "E3", "C#4", "A4"]]
for i in range(int((s2b - s2) // 5.2)): M.add(strings(prog2[i % 4], 7.0, a=1.4, r=1.8, cut=1600), s2 + i * 5.2, 0.7)
t = s2 + 0.5; k = 0
while t < s2b - 0.6:
    nts = prog2[int((t - s2) // 5.2) % 4]; M.add(pizz(nts[1 + k % 3].replace("2", "3")), t, 0.8, 0.4 * ((k % 2) * 2 - 1))
    if k % 4 == 0: M.add(taiko(0.6, 110, 0.25), t, 0.6)
    t += 0.325; k += 1
M.add(flute([("D5", 2), ("E5", 1), ("F#5", 1), ("G5", 2), ("F#5", 2), ("E5", 3), ("D5", 1), ("B4", 4), (None, 4), ("A4", 2), ("B4", 1), ("D5", 1), ("E5", 2), ("F#5", 2), ("E5", 6)], 0.65), s2 + 9.0, 0.8)
arp(prog2, s2 + 14, s2b - 0.5, 0.65, g=0.45)
M.add(strings(["D3", "A3", "F4", "Bb4"], s2 + (SC["S02"]["end"] - s2) - (s2b - s2) + 4, a=2.5, r=2.5, cut=1100, trem=4.0), s2b, 0.8)
M.add(drone("D1", SC["S02"]["end"] - s2b + 3), s2b + 1, 0.8)
# S03 suspense
s3, s3e = L("S03"), SC["S03"]["end"]
M.add(drone("D1", s3e - s3 + 2, a=2, r=2), s3, 1.0)
for i, ch in enumerate([["D3", "F3", "A3", "D4"], ["Bb2", "F3", "Bb3", "D4"], ["G2", "D3", "Bb3", "D4"], ["A2", "E3", "A3", "C#4"], ["D3", "F3", "A3", "D4"]]):
    M.add(strings(ch, 8.6, a=1.6, r=2.0, cut=1000, trem=5.0), s3 + i * 6.8, 0.75)
for k in range(int((s3e - s3) / 1.3)): M.add(taiko(0.9, 48, 0.4), s3 + 0.3 + k * 1.3, 0.55)
M.add(strings(["A5", "D6"], 9, a=3, r=3, cut=5000), L("S03", 3), 0.35)
# S04 dating (quiet ticking) -> ERUPTION hit -> driving ostinato -> fragile ash
s4 = L("S04"); hit = L("S04", 3)
M.add(timp("D2", 3, 1.0), s4 + 0.1); M.add(strings(["D3", "A3", "D4", "F4"], hit - s4 + 1, a=2.0, r=1.0, cut=900), s4 + 0.3, 0.6)
for k in range(int((hit - s4 - 3.5) / 0.5)): M.add(pizz(["A4", "D5"][k % 2], 0.4), s4 + 3.4 + k * 0.5, 0.45)
M.add(roll("D2", 3.0, 1.0), hit - 3.0)
M.add(choir(["D3", "A3", "D4", "F4", "A4"], 9, a=0.05, r=4), hit, 1.1); M.add(strings(["D2", "D3", "A3", "D4", "F4", "A4"], 9, a=0.02, r=4, cut=3000), hit, 1.0)
M.add(taiko(1.6, 45, 1.0), hit, 1.2); M.add(timp("D2", 3, 1.2), hit)
ost_end = L("S04", 6)
seqb = ["D2", "D2", "D3", "D2", "F2", "D2", "C3", "D2"]; t = hit + 1.6; k = 0
while t < ost_end:
    M.add(ost(seqb[k % 8]), t, 0.9);
    if k % 4 == 0: M.add(taiko(1.0, 55, 0.6), t, 0.8)
    t += 0.3; k += 1
for i, ch in enumerate([["D3", "A3", "F4"], ["Bb2", "F3", "D4"], ["C3", "G3", "E4"], ["A2", "E3", "C#4"]]): M.add(strings(ch, 6.2, a=1, r=1.5, cut=1600), hit + 2 + i * 4.8, 0.8)
M.add(strings(["A5", "D6", "E6"], SC["S04"]["end"] - ost_end + 2, a=2.5, r=2.5, cut=6000), ost_end, 0.35); M.add(drone("D1", SC["S04"]["end"] - ost_end + 2), ost_end, 0.9)
# S05 + S06 building tension, then the drop
s5, s6, s6e = L("S05"), L("S06"), SC["S06"]["end"]
drop = L("S06", 6, 2.4)
t = s5 + 0.4; k = 0; seq5 = ["D2", "D2", "F2", "D2", "Eb2", "D2", "A1", "D2"]
while t < drop:
    rate = 0.32 if t < s6 else 0.2
    M.add(ost(seq5[k % 8], 0.22 if t >= s6 else 0.28, 800 if t < s6 else 1300), t, 0.85 if t < s6 else 1.0)
    if k % (4 if t < s6 else 4) == 0: M.add(taiko(0.9, 52, 0.5 if t < s6 else 0.8), t, 0.8)
    t += rate; k += 1
for i, ch in enumerate([["D3", "F3", "A3"], ["G2", "Bb2", "D3", "G3"], ["Bb2", "F3", "D4"], ["A2", "E3", "C#4", "G4"]] * 3):
    tt = s5 + i * 6.6
    if tt < drop - 1: M.add(strings(ch, 8, a=1.4, r=1.6, cut=1400 if tt < s6 else 2200, trem=6 if tt > s6 else 0), tt, 0.8)
M.add(strings(["D3", "Eb3", "A3", "D4", "Eb4"], drop - s6 - 1, a=4, r=0.3, cut=2500), s6 + 1, 0.6)
M.add(drone("D1", 9, a=0.2, r=3), drop, 1.1)
# S07 deep, restrained; climax on the current; silence after
s7 = L("S07"); cl = L("S07", 6); quiet = L("S07", 7)
M.add(choir(["D2", "A2", "D3"], cl - s7 + 1, a=3, r=1, vowel=(500, 900)), s7, 0.9)
for k in range(int((cl - s7) / 2.2)): M.add(taiko(1.4, 44, 0.8), s7 + 0.5 + k * 2.2, 0.9)
M.add(choir(["D3", "A3", "D4", "Eb4", "A4"], quiet - cl + 1.2, a=1.0, r=1.0), cl, 1.0); M.add(strings(["D2", "A2", "D3", "Eb3", "A3", "D4"], quiet - cl + 1.2, a=0.8, r=1.0, cut=2600, trem=7), cl, 0.9)
M.add(roll("D2", quiet - cl, 1.1), cl)
M.add(strings(["A5"], SC["S07"]["end"] - quiet + 3, a=0.5, r=4, cut=6000), quiet, 0.25)
# S08 lament (cello over Dm)
s8, s8e = L("S08"), SC["S08"]["end"]
for i, ch in enumerate([["D2", "A2", "F3"], ["Bb1", "F2", "D3"], ["G1", "D2", "Bb2"], ["A1", "E2", "C#3"], ["D2", "A2", "F3"]]): M.add(strings(ch, 8.5, a=2.5, r=2.5, cut=900), s8 + 1 + i * 6, 0.75)
M.add(cello([("A3", 3), ("G3", 1), ("F3", 2), ("E3", 2), ("D3", 4), (None, 2), ("F3", 2), ("G3", 2), ("A3", 3), ("Bb3", 1), ("A3", 4), (None, 2), ("D4", 3), ("C4", 1), ("Bb3", 2), ("A3", 2), ("G3", 2), ("F3", 2), ("E3", 2), ("D3", 6)], 0.62), s8 + 2.5, 0.9)
# S09 passage of time
s9, s9e = L("S09"), SC["S09"]["end"]
prog9 = [["F2", "C3", "A3", "E4"], ["C2", "G2", "E3", "G4"], ["D2", "A2", "F3", "A4"], ["Bb1", "F2", "D3", "F4"]]
for i in range(int((s9e - s9) / 5.8) + 1): M.add(strings(prog9[i % 4], 7.6, a=2.2, r=2, cut=1500), s9 + i * 5.8, 0.7)
arp([["F4", "A4", "C5", "E5"], ["C4", "E4", "G4", "C5"], ["D4", "F4", "A4", "D5"], ["Bb3", "D4", "F4", "A4"]], s9 + 1, s9e - 0.5, 0.36, g=0.4)
# S10 curious discovery (D lydian-ish, celesta)
s10, s10e = L("S10"), SC["S10"]["end"]
prog10 = [["D3", "A3", "E4", "G#4"], ["B2", "F#3", "D4", "A4"], ["G2", "D3", "B3", "E4"], ["A2", "E3", "C#4", "E4"]]
for i in range(int((s10e - s10) / 4.8) + 1): M.add(strings(prog10[i % 4], 6.4, a=1.2, r=1.6, cut=1700), s10 + i * 4.8, 0.6)
t = s10 + 0.6; k = 0
while t < s10e - 0.8:
    ch = prog10[int((t - s10) // 4.8) % 4]; M.add(pizz(ch[1 + k % 3].replace("2", "3"), 0.5), t, 0.7, 0.4 * ((k % 2) * 2 - 1))
    if k % 8 == 0: M.add(bell(ch[2].replace("3", "5").replace("4", "6"), 3, 0.7), t)
    t += 0.31; k += 1
# S11 reflective, warm
s11, s11e = L("S11"), SC["S11"]["end"]
prog11 = [["D3", "A3", "F#4", "A4"], ["G2", "D3", "B3", "G4"], ["B2", "F#3", "D4", "F#4"], ["A2", "E3", "C#4", "E4"]]
for i in range(int((s11e - s11) / 5.5) + 1): M.add(strings(prog11[i % 4], 7.2, a=1.8, r=2, cut=1800), s11 + i * 5.5, 0.75)
arp(prog11, s11 + 0.5, s11e - 0.5, 0.46, g=0.5)
M.add(flute([("F#5", 2), ("E5", 1), ("D5", 1), ("A4", 4), (None, 1), ("B4", 2), ("C#5", 1), ("D5", 1), ("E5", 4), (None, 2), ("F#5", 2), ("A5", 2), ("G5", 2), ("F#5", 2), ("E5", 6)], 0.7), s11 + 4, 0.75)
# S12 emotional finale, resolve, logo bell
s12, fin, logo = L("S12"), L("S12", 5), L("S12", 6)
prog12 = [["D3", "A3", "F#4", "D5"], ["C#3", "A3", "E4", "A4"], ["B2", "F#3", "D4", "B4"], ["G2", "D3", "B3", "G4"], ["D3", "F#3", "A3", "F#4"], ["E3", "G3", "B3", "E4"], ["A2", "E3", "C#4", "A4"]]
seg = (fin - s12) / len(prog12)
for i, ch in enumerate(prog12):
    g = 0.7 + 0.5 * (i / len(prog12)); M.add(strings(ch, seg + 2.2, a=1.6, r=2.2, cut=1500 + 300 * i), s12 + i * seg, g)
    if i >= 3: M.add(choir(ch, seg + 2, a=1.5, r=2), s12 + i * seg, 0.45 + 0.1 * i)
M.add(cello([("A3", 4), ("B3", 2), ("C#4", 2), ("D4", 4), ("F#4", 4), ("E4", 2), ("D4", 2), ("B3", 4), ("D4", 3), ("C#4", 1), ("A3", 4), ("D4", 8)], seg / 4), s12 + 2, 0.7)
M.add(strings(["D2", "A2", "D3", "F#3", "A3", "D4", "F#4", "A4"], 9, a=1.5, r=5, cut=2400), fin - 0.2, 1.0); M.add(choir(["D3", "A3", "D4", "F#4"], 9, a=1.5, r=5), fin - 0.2, 0.7)
M.add(timp("D2", 4, 0.9), fin); M.add(bell("D6", 6, 1.2), logo + 0.4); M.add(bell("A5", 6, 0.7), logo + 0.4); M.add(drone("D1", 9, a=1, r=6), logo, 0.8)

music = reverb(M.x, wet=0.38)
music = music / (np.abs(music).max() + 1e-9) * 0.8
fade = np.ones(N); fe = int((DUR - 0.5) * SR); fade[fe:] = 0; fade[int((DUR - 6) * SR):fe] = np.linspace(1, 0, fe - int((DUR - 6) * SR)) ** 1.5
music *= fade

# ---------------------------------------------------------------- ambience beds
n = N; T = tv(n)
def noise(seed): return np.random.default_rng(seed).standard_normal(n)
def lfo(f, ph=0): return 0.5 + 0.5 * np.sin(2 * np.pi * f * T + ph)
def events(rate, fn, seed, stereo=True):
    r = np.random.default_rng(seed); out = np.zeros((2, n)); t = 0.0
    while t < DUR:
        t += r.exponential(1 / rate); s = fn(r)
        if s is None: continue
        b = int(t * SR); e = min(n, b + len(s)); p = r.uniform(-0.8, 0.8)
        out[:, b:e] += pan(s[: e - b], p)
    return out
def chirp(r):
    m = int(r.uniform(0.04, 0.14) * SR); tt = tv(m); f0 = r.uniform(2600, 5200)
    f = f0 * (1 + r.uniform(-0.3, 0.3) * tt / tt[-1]) + 300 * np.sin(2 * np.pi * r.uniform(20, 45) * tt)
    reps = r.integers(1, 4); s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / tt[-1]) ** 2
    return np.concatenate([np.concatenate([s, np.zeros(int(0.05 * SR))]) for _ in range(reps)]) * r.uniform(0.05, 0.2)
def step(r):
    m = int(0.09 * SR); tt = tv(m); return filt(np.random.default_rng(r.integers(1e9)).standard_normal(m), "bandpass", [150, 1800]) * np.exp(-tt / 0.02) * r.uniform(0.05, 0.15)
def click(r):
    m = int(0.03 * SR); tt = tv(m); return filt(np.random.default_rng(r.integers(1e9)).standard_normal(m), "highpass", r.uniform(1500, 4000)) * np.exp(-tt / 0.004) * r.uniform(0.05, 0.25)
def crackle(r):
    m = int(0.02 * SR); tt = tv(m); return np.random.default_rng(r.integers(1e9)).standard_normal(m) * np.exp(-tt / 0.003) * r.uniform(0.05, 0.3)
def clink(r):
    m = int(0.5 * SR); tt = tv(m); f = r.uniform(1800, 2600)
    return (np.sin(2 * np.pi * f * tt) + 0.5 * np.sin(2 * np.pi * f * 2.7 * tt)) * np.exp(-tt / 0.06) * 0.25 + filt(np.random.default_rng(r.integers(1e9)).standard_normal(m), "bandpass", [300, 2000]) * np.exp(-tt / 0.03) * 0.2
def babble(seed, voices=10, alarm=False):
    x = np.zeros(n); r = np.random.default_rng(seed)
    for v in range(voices):
        syl = (filt(r.standard_normal(n), "lowpass", 6) * 8).clip(0, None)        # syllable envelope
        car = filt(r.standard_normal(n), "bandpass", [r.uniform(250, 500), r.uniform(1400, 2600)])
        x += car * filt((lfo(r.uniform(3.5, 6), r.uniform(0, 6)) * syl), "lowpass", 20)
    x = filt(x, "lowpass", 2500 if not alarm else 3500)
    return np.stack([x, np.roll(x, 2400)]) / voices
BEDS = {
    "birds": lambda: events(1.6, chirp, 1),
    "crowd": lambda: babble(2, 10),
    "crowd_alarm": lambda: babble(3, 14, True) * 1.4,
    "steps": lambda: events(4.0, step, 4),
    "cart": lambda: pan(filt(noise(5), "lowpass", 140) * 0.4 * lfo(0.07), 0.3) + events(3, click, 6) * 0.4,
    "fountain": lambda: pan(filt(noise(7), "bandpass", [1800, 7000]) * (0.6 + 0.4 * lfo(0.3)) * 0.18, -0.5),
    "wind": lambda: np.stack([filt(noise(8), "bandpass", [120, 900]) * (0.4 + 0.6 * lfo(0.06)), filt(noise(9), "bandpass", [120, 900]) * (0.4 + 0.6 * lfo(0.05, 2))]) * 0.35,
    "insects": lambda: pan(filt(noise(10), "bandpass", [4500, 7500]) * (lfo(23) > 0.6) * 0.1 * lfo(0.2), 0.2),
    "rumble": lambda: pan(filt(noise(11), "lowpass", 70) * (0.5 + 0.5 * lfo(0.09)) * 2.2, 0),
    "pumice": lambda: events(160, click, 12) * 0.9 + pan(filt(noise(13), "bandpass", [2000, 8000]) * 0.05, 0),
    "pumice_roof": lambda: events(90, lambda r: filt(click(r), "lowpass", 1800) * 2, 14),
    "fire": lambda: events(25, crackle, 15) + pan(filt(noise(16), "lowpass", 400) * 0.12, 0),
    "sea": lambda: pan(filt(noise(17), "lowpass", 900) * (0.25 + 0.75 * lfo(0.11) ** 3) * 0.4, -0.2),
    "rush": lambda: pan(filt(noise(18), "lowpass", 260) * 1.6 + filt(noise(19), "bandpass", [300, 1500]) * 0.3, 0),
    "room": lambda: pan(filt(noise(20), "lowpass", 250) * 0.05, 0),
    "dig": lambda: events(1.3, clink, 21) + events(0.8, lambda r: filt(np.random.default_rng(r.integers(1e9)).standard_normal(int(0.4 * SR)), "bandpass", [200, 1500]) * np.exp(-tv(int(0.4 * SR)) / 0.15) * 0.12, 22),
    "hammer": lambda: events(1.8, clink, 23) * 0.7,
}
AMB = {
    "dawn": {"birds": 0.5, "wind": 0.15, "crowd": 0.05}, "street_morning": {"crowd": 0.35, "birds": 0.3, "steps": 0.35, "fountain": 0.2, "cart": 0.15},
    "market": {"crowd": 0.55, "steps": 0.35, "cart": 0.2, "fountain": 0.15}, "room": {"room": 0.4, "birds": 0.1, "fountain": 0.15},
    "forum": {"crowd": 0.6, "steps": 0.3, "birds": 0.12}, "country": {"birds": 0.5, "wind": 0.25, "insects": 0.3}, "wind": {"wind": 0.55},
    "quake": {"crowd_alarm": 0.35, "rumble": 0.7}, "forum_work": {"crowd": 0.3, "hammer": 0.45}, "deep": {"rumble": 0.45, "wind": 0.1},
    "paper": {"room": 0.3}, "eruption": {"rumble": 0.8, "wind": 0.4, "crowd_alarm": 0.15}, "street_alarm": {"crowd_alarm": 0.45, "wind": 0.25, "rumble": 0.35},
    "sea": {"sea": 0.5, "wind": 0.3, "rumble": 0.2}, "map": {"room": 0.2, "sea": 0.12}, "map_dark": {"rumble": 0.3, "wind": 0.2},
    "pumice": {"pumice": 0.7, "wind": 0.35, "rumble": 0.3, "crowd_alarm": 0.2}, "interior_pumice": {"pumice_roof": 0.5, "room": 0.2, "fire": 0.3, "rumble": 0.2},
    "night_chaos": {"pumice": 0.4, "wind": 0.5, "rumble": 0.4, "fire": 0.35, "crowd_alarm": 0.25}, "interior_quake": {"rumble": 0.6, "fire": 0.3, "pumice_roof": 0.4},
    "eruption_night": {"rumble": 0.75, "wind": 0.5}, "science": {"rumble": 0.25, "wind": 0.15}, "rush": {"rush": 0.8, "rumble": 0.5},
    "silence": {"wind": 0.25}, "aftermath": {"wind": 0.45, "fire": 0.1}, "time": {"wind": 0.2, "birds": 0.2}, "dig": {"dig": 0.55, "birds": 0.3, "wind": 0.15},
    "museum": {"room": 0.35}, "modern_site": {"birds": 0.4, "wind": 0.25, "insects": 0.35}, "evening": {"birds": 0.3, "insects": 0.35, "wind": 0.15},
    "street_evening": {"crowd": 0.25, "birds": 0.3, "insects": 0.2, "steps": 0.25}, "end": {"wind": 0.1},
}
# gain envelopes per bed (piecewise, 0.9 s crossfades)
G = {k: np.zeros(n) for k in BEDS}
for s in CU["shots"]:
    a, b = int(s["t0"] * SR), int(s["t1"] * SR)
    for k, g in AMB.get(s["amb"], {}).items(): G[k][a:b] = g
xf = np.hanning(int(0.9 * SR)); xf /= xf.sum()
amb = np.zeros((2, n))
for k, g in G.items():
    if g.max() <= 0: continue
    g = signal.fftconvolve(g, xf, mode="same")
    amb += BEDS[k]() * g
    print("bed", k)

# ---------------------------------------------------------------- hits (timed SFX from the shot list)
def hit(name, g):
    m = lambda d: int(d * SR)
    if name in ("blast", "impact"):
        d = 4.0 if name == "blast" else 2.5; tt = tv(m(d))
        x = np.tanh(2 * np.sin(2 * np.pi * np.cumsum(30 + 50 * np.exp(-tt / 0.25)) / SR) * np.exp(-tt / (1.2 if name == "blast" else 0.6)))
        x += filt(rng.standard_normal(m(d)), "lowpass", 2500) * np.exp(-tt / (0.6 if name == "blast" else 0.25)) * 0.8
        return pan(x, 0) * g
    if name in ("boom", "sub", "thud"):
        d = {"boom": 3.0, "sub": 2.5, "thud": 0.8}[name]; tt = tv(m(d)); f = 40 + 40 * np.exp(-tt / 0.2)
        return pan(np.tanh(1.6 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-tt / (d / 3)) * (1 - np.exp(-tt / 0.004)), 0) * g
    if name in ("rumble", "quake"):
        d = 5.0 if name == "quake" else 4.0; tt = tv(m(d)); e = np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 0.7
        x = filt(rng.standard_normal(m(d)), "lowpass", 90) * 3 * e
        if name == "quake": x = x + events_local(m(d), 30, lambda r: filt(click(r), "lowpass", 1200) * 3)[0] * e
        return pan(x, 0) * g
    if name in ("crack", "creak", "wood"):
        d = {"crack": 0.6, "creak": 1.2, "wood": 0.35}[name]; tt = tv(m(d))
        if name == "creak": x = filt(saw(90 + 30 * np.sin(2 * np.pi * 2 * tt), m(d)), "bandpass", [200, 1600]) * np.sin(np.pi * tt / d) * 0.3
        elif name == "wood": x = (np.sin(2 * np.pi * 420 * tt) + filt(rng.standard_normal(m(d)), "bandpass", [300, 2500])) * np.exp(-tt / 0.04) * 0.4
        else: x = filt(rng.standard_normal(m(d)), "highpass", 800) * np.exp(-tt / 0.06) + events_local(m(d), 60, crackle)[0]
        return pan(x, 0.2) * g
    if name == "collapse":
        d = 4.0; tt = tv(m(d)); x = filt(rng.standard_normal(m(d)), "lowpass", 700) * np.exp(-tt / 0.9) * 1.5 + events_local(m(d), 70, lambda r: filt(click(r), "lowpass", 2500) * 3)[0] * np.exp(-tt / 1.2)
        x += np.tanh(np.sin(2 * np.pi * np.cumsum(35 + 40 * np.exp(-tt / 0.2)) / SR) * np.exp(-tt / 0.5) * 2)
        return pan(x, 0.3) * g
    if name == "thunder":
        d = 3.5; tt = tv(m(d)); x = filt(rng.standard_normal(m(d)), "lowpass", 400) * (np.exp(-tt / 0.15) * 2 + np.exp(-tt / 1.2)) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 3 * tt)))
        return pan(x, -0.3) * g
    if name in ("whoosh", "rush", "riser", "swell"):
        d = {"whoosh": 1.0, "rush": 5.0, "riser": 2.0, "swell": 3.0}[name]; tt = tv(m(d)); p = tt / d
        fc = {"whoosh": 300 * 20 ** np.sin(np.pi * p), "rush": 150 + 900 * np.sin(np.pi * p), "riser": 200 * 30 ** p, "swell": 400 * 8 ** p}[name]
        x = sig_sweep(rng.standard_normal(m(d)), fc) * (np.sin(np.pi * p) ** 2 if name in ("whoosh", "rush") else p ** 2)
        return pan(x * (2.5 if name == "rush" else 1.2), 0) * g
    if name in ("tick", "pin", "clock"):
        d = 0.25; tt = tv(m(d)); f = {"tick": 2400, "pin": 1300, "clock": 1800}[name]
        x = np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.03) * 0.5
        if name == "clock": x = np.concatenate([np.concatenate([x, np.zeros(m(0.75))]) for _ in range(6)])
        return pan(x, 0) * g
    if name == "paper":
        d = 0.8; tt = tv(m(d)); return pan(filt(rng.standard_normal(m(d)), "bandpass", [1500, 7000]) * (np.abs(np.sin(2 * np.pi * 6 * tt)) * np.sin(np.pi * tt / d)) * 0.4, 0.1) * g
    if name == "pick":
        return pan(clink(rng), 0.3) * g * 2
    if name in ("bell", "shimmer"):
        x = bell("D6", 4) + bell("A6", 4) * 0.6 if name == "bell" else sum(bell(nn, 2.5) * 0.4 for nn in ("D6", "F#6", "A6", "E7"))
        return pan(x, 0) * g * 2
    if name == "pumice_start":
        return events_local(m(3), 120, click) * np.linspace(0, 1, m(3))[None] * g
    print("unknown sfx", name); return np.zeros((2, 10))
def sig_sweep(x, fc):
    out = np.zeros_like(x); B = 512
    for i in range(0, len(x), B):
        f = float(np.clip(fc[i], 60, 18000)); out[i:i + B] = filt(x[max(0, i - 2048):i + B], "bandpass", [f * 0.7, min(f * 1.4, 23000)])[-len(x[i:i + B]):]
    return out
def events_local(m, rate, fn):
    r = np.random.default_rng(int(m) + rate); out = np.zeros((2, m)); t = 0
    while True:
        t += r.exponential(1 / rate); b = int(t * SR)
        if b >= m: break
        s = fn(r); e = min(m, b + len(s)); out[:, b:e] += pan(s[: e - b], r.uniform(-0.7, 0.7))
    return out
H = Bus()
for s in CU["shots"]:
    for t, name, g in s["sfx"]: H.add(hit(name, g), t - (0.5 if name == "whoosh" else 2.0 if name == "riser" else 3.0 if name == "swell" else 0))
sfx = amb * 0.55 + H.x * 0.8
sfx = sfx / (np.abs(sfx).max() + 1e-9) * 0.8 * fade

for name, x in (("music", music), ("sfx", sfx)):
    sf.write(os.path.join(HERE, f"{name}.wav"), x[:, : int(DUR * SR)].T.astype(np.float32), SR)
    print(name, "written", x.shape)
