# /// script
# requires-python = ">=3.10"
# dependencies = ["librosa>=0.10", "numpy", "scipy", "soundfile"]
# ///
"""The Nvidia Honey Trap: bespoke score + beat-locked narration.

    MOTION_REEL_SKILL=<skill> uv run honeytrap/audio/score.py

Reads  audio/vo/<id>.wav + audio/vo/takes.json   (Kokoro af_heart takes, Whisper word times)
Writes audio/music.wav, audio/vo.wav, beats.json, vo.js (phrase + word times in film time)

100 BPM, 4/4, D minor. A Vox-style tension bed: ticking clock, muted pulse, low pads.
Sections follow the narration: hook / chips / story / (hard stop) worse / dc / payoff / end.
"""
import json
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
BPM = 100
BEAT = 60 / BPM
seed(20261112)

# gap (in beats, minimum) BEFORE each phrase; section changes breathe longer
GAP = {"hook2": 0.25, "turn": 0.6, "chips1": 0.35, "chips2": 0.2, "admit": 0.75, "nyt": 0.35,
       "goal": 0.35, "trap": 0.3, "deny": 0.6, "worse": 1.5, "second": 0.75, "wsj": 0.3,
       "money": 0.3, "trump": 0.9, "house": 0.3, "why": 1.0, "center": 0.6, "q": 0.5, "end": 0.9}
START_BEAT = 1.0


def T(b):
    return b * BEAT


def place():
    takes = json.loads((HERE / "vo" / "takes.json").read_text())
    out, cursor = [], START_BEAT
    for k, tk in enumerate(takes):
        y, sr = sf.read(HERE / "vo" / f"{tk['id']}.wav")
        if sr != SR:
            y = librosa.resample(y, orig_sr=sr, target_sr=SR)
        # speech onset inside the trimmed take
        e = np.abs(y) > 0.02
        on = np.argmax(e) / SR
        if k == 0:
            beat = START_BEAT
        else:
            want = out[-1]["t1"] / BEAT + GAP.get(tk["id"], 0.4)
            beat = np.ceil(want * 4) / 4          # next quarter beat
        t0 = T(beat) - on
        out.append({"id": tk["id"], "sec": tk["sec"], "text": tk["text"], "beat": float(beat),
                    "t0": round(T(beat), 3), "t1": round(t0 + len(y) / SR, 3), "start": t0, "y": y,
                    "words": [{"w": w["w"], "t0": round(t0 + w["t0"], 3), "t1": round(t0 + w["t1"], 3)}
                              for w in tk["words"]]})
    return out


def compress(x, thresh_db=-22, ratio=3.0, attack=0.004, release=0.08, makeup_db=4):
    e = env_follow(x, attack, release)
    over = np.maximum(20 * np.log10(e + 1e-9) - thresh_db, 0)
    return x * 10 ** ((-over * (1 - 1 / ratio) + makeup_db) / 20)


def vo_chain(x):
    x = filt(x, "highpass", 80, 2)
    x = peq(x, 250, -2.0, 1.0)
    x = peq(x, 3000, 2.5, 0.9)
    x = peq(x, 10000, 1.5, 0.7)
    return compress(x)


def tick(hi=True):
    n = int(0.05 * SR)
    t = tvec(n)
    f = 2600 if hi else 1900
    x = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.006) + filt(rng.standard_normal(n), "highpass", 4000) * np.exp(-t / 0.003) * 0.5
    return x


def low_pulse(note, length):
    n = int(length * SR)
    t = tvec(n)
    f = hz(note)
    x = np.sin(2 * np.pi * f * t) + 0.3 * saw(f, n)
    x = sweep_filter(x, 200 + 900 * np.exp(-t / 0.05), "lowpass", 1.2)
    return np.tanh(1.4 * x) * np.exp(-t / 0.18) * (1 - np.exp(-t / 0.002))


def bell(note, length=2.5):
    n = int(length * SR)
    t = tvec(n)
    f = hz(note)
    x = np.sin(2 * np.pi * f * t + 2.0 * np.exp(-t / 0.4) * np.sin(2 * np.pi * f * 3.5 * t))
    return x * np.exp(-t / 0.9) * (1 - np.exp(-t / 0.002))


def main():
    P = place()
    DUR = round(P[-1]["t1"] + 2.4, 2)
    N = int(SR * DUR)
    nb = int(DUR / BEAT) + 1
    print("VO placement:")
    for a, b in zip(P, P[1:] + [None]):
        gap = (b["t0"] - a["t1"]) if b else DUR - a["t1"]
        print(f"  {a['id']:7} b{a['beat']:6.1f}  {a['t0']:6.2f}-{a['t1']:6.2f}  gap {gap*1000:+5.0f} ms" + ("  OVERLAP" if gap < 0 else ""))
    print("duration", DUR)

    sec = {}
    for p in P:
        s = sec.setdefault(p["sec"], [p["beat"], p["beat"]])
        s[1] = max(s[1], p["t1"] / BEAT)
    B = {k: (np.floor(v[0]), np.ceil(v[1])) for k, v in sec.items()}
    worse_b = next(p["beat"] for p in P if p["id"] == "worse")
    trap_word = next(w for p in P if p["id"] == "trap" for w in p["words"] if w["w"].lower().startswith("trap"))
    why_b = next(p["beat"] for p in P if p["id"] == "why")
    center_b = next(p["beat"] for p in P if p["id"] == "center")
    end_b = next(p["beat"] for p in P if p["id"] == "end")
    money_b = next(p["beat"] for p in P if p["id"] == "money")

    drums, bass, music, fx = (Bus(DUR, BPM) for _ in range(4))

    # harmony: D minor. Dm - Bb - Gm - A (2 beats... each chord = 1 bar of 4 beats)
    prog = [(["D3", "F3", "A3", "D4"], "D2"), (["Bb2", "D3", "F3", "Bb3"], "Bb1"),
            (["G2", "Bb2", "D3", "G3"], "G1"), (["A2", "C#3", "E3", "A3"], "A1")]

    def chord(b):
        return prog[int(b // 8) % 4]          # two bars per chord: slow, brooding

    stop0, stop1 = worse_b - 1.5, worse_b + 2.0        # hard stop around "Then it got worse."
    calm0, calm1 = why_b - 0.5, center_b + 4           # payoff strips back

    def active(b):
        return not (stop0 <= b < stop1)

    # ---- pads all the way (except the stop): two-bar chords, slow filter
    for b in range(0, nb, 8):
        if b >= stop0 - 0.01 and b < stop1:
            continue
        L = min(8, nb - b) * BEAT
        notes, _ = chord(b)
        g = 0.20 if b < B["chips"][0] else 0.26
        cut = (500, 1300) if not (calm0 <= b < calm1) else (400, 800)
        music.add(pad_chord(notes, L + 0.3, cut, attack=0.4, release=0.6), b, g)
    # ---- clock tick: 8ths from the top; this is the "spy" texture
    for b2 in range(0, nb * 2):
        b = b2 / 2
        if not active(b) or b >= end_b + 6:
            continue
        drums.add(tick(b2 % 2 == 0), b, 0.10 if b2 % 2 else 0.14, pan=0.35)
    # ---- low pulse on 8ths in the hook, quarters later
    for b2 in range(0, nb * 2):
        b = b2 / 2
        if not active(b) or b >= end_b + 4 or (calm0 <= b < calm1):
            continue
        root = chord(b)[1]
        if b < B["chips"][0] or b2 % 2 == 0:
            bass.add(low_pulse(root[:-1] + str(int(root[-1]) + 1), BEAT * 0.5), b, 0.30 if b2 % 2 else 0.42)
    # ---- kick + rim: enters at the chips section, heavier after "worse"
    for b in range(int(B["chips"][0]), nb):
        if not active(b) or (calm0 <= b < calm1) or b >= end_b + 3:
            continue
        after = b >= stop1
        if b % 4 in (0, 2.5) or (after and b % 2 == 0):
            drums.add(kick(soft=not after), b, 0.75 if after else 0.55)
        if b % 4 == 2 and b >= B["story"][0]:
            drums.add(clap(tight=True), b, 0.22 if after else 0.14, pan=-0.05)
        if after:
            drums.add(hat(), b + 0.5, 0.10, pan=-0.25)
        if b % 4 == 3:
            drums.add(kick(soft=True), b + 0.5, 0.35)
    # ---- sub bass under the story onward
    for b in range(int(B["story"][0]), nb, 2):
        if not active(b) or (calm0 <= b < calm1) or b >= end_b + 3:
            continue
        bass.add(bass_note(chord(b)[1], BEAT * 1.8, 500), b, 0.42)
    # ---- accents
    fx.add(bell("A5"), 1.0, 0.10, pan=0.3)                                  # hook entry
    fx.add(sub_drop(1.4), 0, at=trap_word["t0"], gain=0.55)                    # "honey TRAP"
    fx.add(bell("D5", 3.0), 0, at=trap_word["t0"], gain=0.14, pan=-0.2)
    fx.add(riser(T(stop1 - stop0 - 0.1)), stop0 + 0.05, 0.16)               # into the drop
    fx.add(sub_drop(1.2), stop1, 0.6)
    drums.add(crash(1.8), stop1, 0.18)
    fx.add(whoosh(T(1.5), 300, 3000, 0.8), money_b - 1.5, 0.10)
    for nt, off in (("D5", 0), ("F5", 1.5), ("A5", 3), ("E5", 4.5)):       # payoff: bare bells
        fx.add(bell(nt), why_b + off, 0.09, pan=0.2)
    music.add(pad_chord(["D3", "A3", "D4", "F4", "A4"], T(6) + 2.0, (900, 400), attack=0.2, release=1.5), end_b + 1, 0.30)
    fx.add(bell("D5", 3.5), end_b + 1, 0.12)

    # ---- bed
    ir = reverb_ir(2.2, 0.6)
    wet_src = music.x * 0.5 + fx.x * 0.4 + drums.x * 0.05
    wet = np.stack([signal.fftconvolve(wet_src[c], ir[c])[: wet_src.shape[1]] for c in range(2)])
    kick_t = [T(b) for b in range(int(B["chips"][0]), nb) if active(b)]
    pump = sidechain(kick_t, bass.x.shape[1], 0.3, 0.12)
    bed = drums.x * 0.8 + bass.x * 0.85 + music.x * pump * 0.8 + fx.x * 0.8 + wet * 0.5
    bed = np.stack([filt(ch, "highpass", 28) for ch in bed])[:, :N]
    bed /= np.abs(bed).max() + 1e-9
    bed *= 0.5
    fade = int(1.2 * SR)
    bed[:, -fade:] *= np.linspace(1, 0, fade) ** 2
    sf.write(HERE / "music.wav", bed.T, SR, subtype="PCM_24")

    grid = measure_beats(drums.x[:, :N].mean(axis=0), SR, BPM)
    grid.update({"designed_bpm": BPM, "downbeats": grid["beats"][::4],
                 "sections": {k: [float(a), float(b)] for k, (a, b) in B.items()},
                 "source": "honeytrap/audio/score.py drum stem"})
    (FILM / "beats.json").write_text(json.dumps(grid, indent=1))
    print(f"beats: {grid['bpm']} bpm, offset {grid['offset']*1000:.1f} ms")

    # ---- VO
    vo = np.zeros(N + SR)
    for p in P:
        s = int(round(p["start"] * SR))
        seg = p["y"].copy()
        vo[s:s + len(seg)] += seg[: len(vo) - s]
    v = vo_chain(vo[:N])
    v = v / (np.abs(v).max() + 1e-9) * 0.7
    sf.write(HERE / "vo.wav", np.stack([v, v]).T, SR, subtype="PCM_24")

    meta = [{k: p[k] for k in ("id", "sec", "text", "beat", "t0", "t1", "words")} for p in P]
    (FILM / "vo.js").write_text("// generated by audio/score.py\nexport const BPM = %d;\nexport const DUR = %s;\nexport const VO = %s;\n"
                                % (BPM, DUR, json.dumps(meta, indent=0)))
    fj = json.loads((FILM / "film.json").read_text())
    fj["duration"] = DUR
    (FILM / "film.json").write_text(json.dumps(fj, indent=1))


if __name__ == "__main__":
    main()
