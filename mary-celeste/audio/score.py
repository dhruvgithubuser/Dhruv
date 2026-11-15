# /// script
# requires-python = ">=3.10"
# dependencies = ["librosa>=0.10", "numpy", "scipy", "soundfile"]
# ///
"""Mary Celeste का रहस्य: bespoke mystery score + the supplied VO cut onto the grid.

    MOTION_REEL_SKILL=<skill> uv run mary-celeste/audio/score.py

The supplied recording (audio/vo/vo_source.mp3) reads the whole brief aloud, stage directions
included. CLIPS keeps only the narration: each clip is a source window (seconds, from a Whisper
word alignment), the gap that precedes it, and the clean on-screen text. Instruction phrases
("बताएं कि", "समझाएं कि", "अंत में साफ कहें कि" ...) are cut out at the word boundary.

90 BPM, D minor. Writes audio/music.wav, audio/vo.wav, beats.json, vo.json (phrases in film time).
"""
import json
import math
import os
import sys
from pathlib import Path

import librosa
import numpy as np
import soundfile as sf
from scipy import signal


def _skill_dir():
    if os.environ.get("MOTION_REEL_SKILL"):
        return Path(os.environ["MOTION_REEL_SKILL"])
    found = sorted((Path.home() / ".claude/plugins").glob("**/skills/motion-reel/scripts/dsp.py"))
    if found:
        return found[-1].parent.parent
    sys.exit("set MOTION_REEL_SKILL")


sys.path.insert(0, str(_skill_dir() / "scripts"))
from dsp import *  # noqa: E402,F403

HERE = Path(__file__).resolve().parent
FILM = HERE.parent
BPM = 90
BEAT = 60 / BPM
seed(1872)


def T(b):
    return b * BEAT


# ---------------------------------------------------------------- VO edit
# (src start, src end, gap before in s, section, on-screen text, opts)
CLIPS = [
    (27.68, 31.80, 0.00, "hook", "समुद्र में मिला जहाज़, सामान मौजूद, लेकिन…", {}),
    (31.80, 33.20, 0.55, "hook", "पूरा crew गायब।", {"key": True}),
    (22.30, 27.40, 0.75, "hook", "जहाज़ टूटा हुआ नहीं था, इसलिए रहस्य और भी बड़ा हो गया।", {}),
    (0.00, 4.00, 0.35, "hook", "Mary Celeste का रहस्य: crew कहाँ गायब हुआ?", {}),
    (45.268, 53.30, 0.75, "facts", "Mary Celeste नवंबर 1872 में New York से Genoa जा रही थी, और उस पर Captain समेत 10 लोग थे।", {"exact": True}),
    (53.80, 59.40, 0.35, "facts", "दिसंबर में जहाज़ मिला, लेकिन crew नहीं था, और lifeboat भी गायब थी।", {}),
    (60.00, 64.80, 0.35, "facts", "जहाज़ चलने लायक था, और उसका ज़्यादातर सामान भी मौजूद था।", {}),
    (67.35, 69.60, 0.45, "facts", "तो सबने जहाज़ क्यों छोड़ा?", {"key": True}),
    (113.66, 118.40, 0.85, "theory", "सबसे मशहूर theory: crew ने खतरा समझकर जहाज़ छोड़ा।", {}),
    (92.00, 97.75, 0.40, "theory", "Cargo में alcohol था, इसलिए fumes या आग का डर होने की बात भी कही गई।", {}),
    (101.10, 104.90, 0.40, "theory", "समुद्री तूफ़ान या दूसरी वजहें भी अंदाज़े हैं।", {}),
    (118.34, 120.45, 0.70, "proof", "पर इसका proof आज भी नहीं है।", {"key": True, "gain_db": 2.5}),
    (105.10, 109.40, 0.55, "proof", "किसी theory से यह साबित नहीं होता कि crew के साथ क्या हुआ।", {}),
    (135.035, 138.40, 0.75, "end", "Mary Celeste का रहस्य अब तक हल नहीं हुआ है।", {"exact": True}),
    (144.94, 147.90, 0.70, "end", "आपके हिसाब से crew ने जहाज़ क्यों छोड़ा?", {}),
    (148.26, 150.70, 0.40, "end", "अपनी theory comment में बताइए।", {}),
]
LEAD = 0.12          # first word on frame ~7: the hook is speaking from the start
TAIL = 2.6           # end card holds after the last word


def build_vo():
    y, _ = librosa.load(HERE / "vo" / "vo_source.mp3", sr=SR, mono=True)
    hop = int(SR * 0.005)
    rms = librosa.feature.rms(y=y, frame_length=hop * 4, hop_length=hop)[0]
    db = 20 * np.log10(rms + 1e-9) - 20 * np.log10(rms.max())

    def quiet_point(t, win=0.07):
        i0, i1 = max(0, int((t - win) / 0.005)), int((t + win) / 0.005)
        return (i0 + int(np.argmin(db[i0:i1]))) * 0.005

    placed, t_cursor = [], LEAD
    for k, (a, b, gap, sec, txt, o) in enumerate(CLIPS):
        a = a if (o.get("exact") or a <= 0.05) else quiet_point(a)
        b = quiet_point(b)
        i0, i1 = int(a / 0.005), int(b / 0.005)
        loud = np.nonzero(db[i0:i1] > -34)[0]
        on = a if o.get("exact") else a + loud[0] * 0.005
        off = a + loud[-1] * 0.005 + 0.04
        start = t_cursor + (gap if k else 0)
        if k:      # speech onset on the nearest half beat at or after the wanted start
            start = math.ceil((start - 0.06) / (BEAT / 2)) * (BEAT / 2)
        else:
            start = LEAD
        shift = start - on
        placed.append(dict(k=k, a=a, b=b, on=on, off=off, shift=shift, t0=on + shift, t1=off + shift,
                           sec=sec, text=txt, key=bool(o.get("key")), gain=o.get("gain_db", 0), exact=bool(o.get("exact"))))
        t_cursor = off + shift
    dur = math.ceil((t_cursor + TAIL) / (BEAT * 4)) * BEAT * 4        # whole bars
    n = int(SR * dur)
    vo = np.zeros(n + SR)
    for p in placed:
        seg = y[int(p["a"] * SR):int(p["b"] * SR)].copy()
        fi, fo = int((0.012 if p.get("exact") else 0.006) * SR), int(0.02 * SR)
        seg[:fi] *= np.linspace(0, 1, fi)
        seg[-fo:] *= np.linspace(1, 0, fo)
        seg *= 10 ** (p["gain"] / 20)
        s = int(round((p["a"] + p["shift"]) * SR))
        if s < 0:
            seg, s = seg[-s:], 0
        vo[s:s + len(seg)] += seg
    print("VO edit:")
    for p, q in zip(placed, placed[1:] + [None]):
        gap = (q["t0"] - p["t1"]) if q else dur - p["t1"]
        print(f"  {p['k']:2d} {p['sec']:6s} {p['t0']:6.2f}-{p['t1']:6.2f}  b{p['t0'] / BEAT:5.1f}  gap {gap * 1000:+5.0f} ms  {p['text'][:40]}")
    return vo[:n], placed, dur


def compress(x, thresh_db=-22, ratio=3.0, attack=0.004, release=0.08, makeup_db=4):
    e = env_follow(x, attack, release)
    over = np.maximum(20 * np.log10(e + 1e-9) - thresh_db, 0)
    return x * 10 ** ((-over * (1 - 1 / ratio) + makeup_db) / 20)


def vo_chain(x):
    x = filt(x, "highpass", 85, 2)
    x = peq(x, 250, -2.0, 1.0)
    x = peq(x, 3000, 3.0, 0.9)
    x = peq(x, 9000, 1.5, 0.7)
    return compress(x)


# ---------------------------------------------------------------- instruments

def sea(length, gain=1.0):
    """Waves: low-passed noise breathing on a slow swell, a little hiss on each crest."""
    n = int(length * SR)
    t = tvec(n)
    swell = 0.55 + 0.45 * np.sin(2 * np.pi * t / 5.3) * np.sin(2 * np.pi * t / 8.9 + 1)
    x = filt(rng.standard_normal(n), "lowpass", 520) * swell
    x += filt(rng.standard_normal(n), "bandpass", [1800, 5200]) * np.clip(swell - 0.6, 0, 1) * 0.5
    return x * gain


def heartbeat(gain=1.0):
    """Lub-dub: two soft low thumps."""
    out = np.zeros(int(0.7 * SR))
    for dt, g in ((0, 1.0), (0.24, 0.7)):
        n = int(0.35 * SR)
        t = tvec(n)
        f = 48 + 30 * np.exp(-t / 0.03)
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12) * (1 - np.exp(-t / 0.002))
        i = int(dt * SR)
        out[i:i + n] += x * g
    return np.tanh(1.4 * out) * gain


def tick(bright=1.0):
    """Ship's clock tick: a dry wooden click."""
    n = int(0.06 * SR)
    t = tvec(n)
    x = filt(rng.standard_normal(n), "bandpass", [2200 * bright, 6500]) * np.exp(-t / 0.004)
    x += 0.4 * np.sin(2 * np.pi * 1850 * bright * t) * np.exp(-t / 0.008)
    return x


def bell(note, length=3.0):
    """Ship's bell: inharmonic partials, long decay."""
    n = int(length * SR)
    t = tvec(n)
    f = hz(note)
    x = np.zeros(n)
    for r, g, d in ((1, 1.0, 1.6), (2.0, 0.5, 1.0), (2.76, 0.35, 0.7), (5.4, 0.15, 0.3), (0.5, 0.25, 2.2)):
        x += g * np.sin(2 * np.pi * f * r * t) * np.exp(-t / d)
    return x * (1 - np.exp(-t / 0.002)) * 0.4


def strings(notes, length, cutoff=1400, attack=0.6):
    return pad_chord(notes, length, cutoff, attack=attack, release=0.8, voices=5, detune=0.18)


def creak(length=1.2):
    """Wooden hull creak: a slowly gliding, rough resonance."""
    n = int(length * SR)
    t = tvec(n)
    f = 140 + 60 * np.sin(np.pi * t / length)
    pulses = (np.sin(2 * np.pi * np.cumsum(f) / SR) > 0.97).astype(float)
    x = filt(pulses, "bandpass", [300, 1400]) * np.sin(np.pi * t / length) ** 2
    return x * 3


def boom(length=2.4):
    x = sub_drop(length, 70, 28) * 1.0
    n = len(x)
    t = tvec(n)
    x[:n] += filt(rng.standard_normal(n), "lowpass", 900) * np.exp(-t / 0.08) * 0.6
    return np.tanh(1.5 * x)


# ---------------------------------------------------------------- score

def main():
    vo, placed, DUR = build_vo()
    N = int(SR * DUR)
    NB = DUR / BEAT
    B = lambda k: placed[k]["t0"] / BEAT                 # beat of phrase k's first word
    E_ = lambda k: placed[k]["t1"] / BEAT                # beat of its last word

    amb, pulse, music, fx = (Bus(DUR, BPM) for _ in range(4))

    # sea under everything; it carries the silences
    amb.add(sea(DUR + 1), 0, 0.22)
    for b in (3, B(4) - 1, B(9), B(13) - 2):
        fx.add(creak(1.4), b, 0.18, pan=-0.3)

    Dm, Bb, Gm, A7, F = (["D3", "A3", "D4", "F4"], "D2"), (["Bb2", "F3", "D4", "F4"], "Bb1"), \
        (["G2", "D3", "Bb3", "D4"], "G1"), (["A2", "E3", "C#4", "G4"], "A1"), (["F2", "C3", "A3", "C4"], "F1")

    # ---- hook: heartbeat + drone; everything stops for "पूरा crew गायब", the bell answers it
    stop0, stop1 = E_(0) + 0.1, B(1)
    music.add(strings(["D2", "A2", "D3"], T(stop0), 700, 0.05), 0, 0.30)
    for b in range(0, int(stop0)):
        if b % 2 == 0:
            pulse.add(heartbeat(), b, 0.75)
    fx.add(boom(2.6), B(1), 0.65)
    music.add(bell("D5", 4.0), E_(1) + 0.25, 0.30, pan=0.2)
    music.add(strings(Dm[0], T(B(4) - B(2)), 900), B(2) - 0.5, 0.20)
    for b in np.arange(math.ceil(B(2)), B(4) - 0.5, 1):
        pulse.add(heartbeat(), b, 0.55 if int(b) % 2 == 0 else 0.0)
    music.add(bell("A4", 3.0), B(3), 0.22, pan=-0.2)
    fx.add(riser(T(2.0)), B(4) - 2, 0.16)

    # ---- facts: the ship's clock ticks, a pizzicato arpeggio walks the route
    f0, f1 = B(4) - 0.5, E_(7) + 0.5
    prog_ = [Dm, Bb, Gm, A7]
    bar0 = int(f0 // 4) * 4
    for i, bb in enumerate(np.arange(bar0, f1, 4)):
        ch = prog_[i % 4]
        music.add(strings(ch[0], T(4.1), 1100, 0.3), max(bb, f0), 0.17)
        music.add(bass_note(ch[1], T(1.6), 500), max(bb, f0), 0.42)
        notes = ch[0][1:] + [ch[0][1][:-1] + str(int(ch[0][1][-1]) + 1)]
        for j, q in enumerate(np.arange(0, 4, 0.5)):
            b = bb + q
            if f0 <= b < f1 - 1:
                music.add(pluck([notes[j % len(notes)]], 0.25, 2600), b, 0.10, pan=0.25 * (1 if j % 2 else -1))
    for b in np.arange(math.ceil(f0), f1, 1):
        pulse.add(tick(), b, 0.20, pan=0.35)
        pulse.add(tick(0.8), b + 0.5, 0.10, pan=0.35)
    # the question hangs: a held diminished chord, no pulse
    music.add(strings(["C#3", "G3", "Bb3", "E4"], T(E_(7) - B(7) + 2), 1300, 0.2), B(7), 0.22)
    fx.add(riser(T(B(8) - B(7))), B(7), 0.18)

    # ---- theories: tension builds, ticks go 16ths, heartbeat returns
    t0b, t1b = B(8), E_(10) + 0.3
    for i, bb in enumerate(np.arange(t0b, t1b, 4)):
        ch = [Dm, Bb, Gm, A7][i % 4]
        music.add(strings(ch[0], T(4.1), 900 + 200 * i, 0.4), bb, 0.20)
        music.add(bass_note(ch[1], T(3.6), 400), bb, 0.40)
    for b in np.arange(t0b, t1b, 0.25):
        g = 0.07 + 0.08 * (b - t0b) / (t1b - t0b)
        pulse.add(tick(1.0 if (b * 4) % 2 == 0 else 0.85), b, g, pan=0.3)
    for b in np.arange(t0b, t1b, 2):
        pulse.add(heartbeat(), b, 0.5)
    fx.add(riser(T(2.5)), B(11) - 2.5, 0.25)

    # ---- proof: the hard stop, then a boom under "proof नहीं है"
    fx.add(boom(3.0), B(11), 0.8)
    music.add(bell("D4", 5.0), B(11) + 0.1, 0.3)
    music.add(strings(["D2", "A2", "F3"], T(E_(12) - B(11) + 1.5), 600, 0.8), B(11) + 1.0, 0.24)

    # ---- end: unresolved, then the friendly ask: a gentle Dm(add9) motif under the CTA
    e0 = B(13) - 0.5
    music.add(strings(["D3", "A3", "E4", "F4"], T(NB - e0), 1200, 0.6), e0, 0.18)
    music.add(bass_note("D2", T(NB - e0), 380), e0, 0.35)
    motif = [("A4", 0), ("D5", 0.5), ("E5", 1.0), ("F5", 1.5), ("E5", 3.0), ("A4", 3.5)]
    for rep, bb in enumerate((B(14) - 0.5, B(15) + 1)):
        for nt, q in motif:
            music.add(pluck([nt], 0.5, 3000), bb + q, 0.12, pan=0.2)
    music.add(bell("D5", 4.0), NB - 3.5, 0.18)

    # ---- mix
    ir = reverb_ir(2.4, 0.5)
    wet_src = music.x * 0.5 + fx.x * 0.15 + pulse.x * 0.1
    wet = np.stack([signal.fftconvolve(wet_src[c], ir[c])[: wet_src.shape[1]] for c in range(2)])
    bed = amb.x * 0.9 + pulse.x * 0.9 + music.x * 0.8 + fx.x * 0.8 + wet * 0.55
    bed = np.stack([filt(ch, "highpass", 25) for ch in bed])[:, :N]
    # silence the bed in the "पूरा crew गायब" pause (only the sea and the boom's tail remain)
    a, b = int(T(stop0) * SR), int(T(B(1)) * SR)
    keep = (amb.x[:, a:b] * 0.6)
    bed[:, a:b] = keep * np.linspace(1, 0.4, b - a)
    bed /= np.abs(bed).max() + 1e-9
    bed *= 0.5
    fade = int(1.2 * SR)
    bed[:, -fade:] *= np.linspace(1, 0, fade) ** 2
    sf.write(HERE / "music.wav", bed.T, SR, subtype="PCM_24")

    # grid: designed, not measured (the bed has no drum kit); offset 0
    beats = [round(T(i), 4) for i in range(int(NB) + 1)]
    secs = {"hook": [0, round(B(4) - 0.5, 2)], "facts": [round(B(4) - 0.5, 2), round(B(8), 2)],
            "theory": [round(B(8), 2), round(B(11), 2)], "proof": [round(B(11), 2), round(B(13) - 0.5, 2)],
            "end": [round(B(13) - 0.5, 2), round(NB, 2)]}
    grid = {"bpm": BPM, "designed_bpm": BPM, "period": BEAT, "offset": 0.0, "beats": beats,
            "downbeats": beats[::4], "duration": DUR, "sections": secs,
            "source": "mary-celeste/audio/score.py, designed grid"}
    (FILM / "beats.json").write_text(json.dumps(grid, indent=1))

    v = vo_chain(vo)
    v = v / (np.abs(v).max() + 1e-9) * 0.7
    sf.write(HERE / "vo.wav", np.stack([v, v]).T, SR, subtype="PCM_24")
    (FILM / "vo.json").write_text(json.dumps({"duration": DUR, "phrases": [
        {"k": p["k"], "t0": round(p["t0"], 3), "t1": round(p["t1"], 3), "u0": round(p["t0"] / BEAT, 3),
         "u1": round(p["t1"] / BEAT, 3), "sec": p["sec"], "key": p["key"], "text": p["text"]} for p in placed]},
        ensure_ascii=False, indent=1))
    print(f"duration {DUR:.2f}s = {NB:.0f} beats; sections {secs}")


if __name__ == "__main__":
    main()
