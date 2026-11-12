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

    def wt(pid, prefix):
        return next(w["t0"] for p in P if p["id"] == pid for w in p["words"] if w["w"].lower().startswith(prefix))

    t_trap, t_oust, t_land = trap_word["t0"], wt("wsj", "oust"), wt("money", "billion")
    t_target, t_dec = wt("center", "targeted"), wt("end", "decision")
    stop0, stop1 = worse_b - 1.5, worse_b + 2.0        # hard stop around "Then it got worse."
    calm0, calm1 = why_b - 0.5, center_b + 4           # payoff strips back
    story0 = B["story"][0]

    def active(b):
        return not (stop0 <= b < stop1)

    # ---- suspense palette: D Phrygian (D Eb F G A Bb C). Drones, clusters, pizzicato, heartbeat.
    def drone(notes, length, cut=(260, 520), lfo=0.11):
        n = int(length * SR); t = tvec(n)
        x = np.zeros(n)
        for nt in notes:
            f = hz(nt)
            x += saw(f, n) * 0.5 + saw(f * 1.004, n) * 0.5 + np.sin(2 * np.pi * f * t) * 0.8
        fc = np.geomspace(cut[0], cut[1], n) * (1 + 0.35 * np.sin(2 * np.pi * lfo * t))
        x = sweep_filter(x, fc, "lowpass", 0.9) / len(notes)
        env = np.clip(t / 2.5, 0, 1) * np.clip((length - t) / 2.0, 0, 1)
        return np.stack([x * env, np.roll(x, 240) * env])

    def tremolo(notes, length, rate=11.0, cut=2600):
        x = pad_chord(notes, length, cut, attack=1.2, release=1.2, voices=3, detune=0.08)
        t = tvec(x.shape[1])
        return x * (0.55 + 0.45 * np.sin(2 * np.pi * rate * t))

    def pizz(note, g=1.0):
        return ks_pluck(hz(note), 0.5, bright=0.45, buzz=0.15) * g

    def heartbeat():
        a = kick(soft=True); out = np.zeros(int(0.7 * SR))
        out[:len(a)] += a[:len(out)]
        b = kick(soft=True) * 0.7; i = int(0.24 * SR)
        out[i:i + len(b)] += b[:len(out) - i]
        return filt(out, "lowpass", 180)

    def braam(length=2.6):
        n = int(length * SR); t = tvec(n)
        x = sum(saw(hz(nt), n) + saw(hz(nt) * 1.006, n) for nt in ("D1", "D2", "Eb2", "A2"))
        x = sweep_filter(x, 120 + 1400 * np.exp(-t / 0.35), "lowpass", 1.1)
        x = np.tanh(1.8 * x / 4) * np.exp(-t / 1.1) * (1 - np.exp(-t / 0.01))
        return x

    # drones under everything but the stop (cluster gets darker as the story escalates)
    sections = [(0, story0, ["D1", "A1"]), (story0, stop0, ["D1", "A1", "Eb2"]),
                (stop1, calm0, ["D1", "Eb2", "A2"]), (calm0, nb, ["D1", "A1"])]
    for b0, b1, nts in sections:
        if b1 <= b0: continue
        music.add(drone(nts, T(b1 - b0) + 1.5), b0, 0.9 if b0 < stop0 else 0.6)
    # high string tremolo: minor-2nd rub, enters with the story
    for b0, b1, nts, g in ((8, story0, ["A4", "Bb4"], 0.07), (story0, stop0, ["D5", "Eb5"], 0.11), (stop1, calm0, ["A4", "Bb4", "D5"], 0.13),
                           (center_b, nb - 4, ["D5", "Eb5", "A5"], 0.09)):
        music.add(tremolo(nts, T(b1 - b0)), b0, g)
    # clock tick: 8ths, the spy texture
    for b2 in range(0, nb * 2):
        b = b2 / 2
        if not active(b) or b >= end_b + 6:
            continue
        drums.add(tick(b2 % 2 == 0), b, 0.05 if b2 % 2 else 0.08, pan=0.35)
    # heartbeat: from "honey trap" in the hook, every 2 beats; every beat after the drop
    for b in range(int(trap_word["t0"] / BEAT) - 4, nb):
        if not active(b) or (calm0 <= b < calm1) or b >= end_b + 3:
            continue
        fast = b >= stop1
        if fast or b % 2 == 0:
            drums.add(heartbeat(), b, 0.8 if fast else 0.6)
    # pizzicato motif, the "sneaking" line: D . F . Ab(=G#) G . Eb . D
    motif = [(0, "D4"), (1, "F4"), (2, "G#4"), (2.5, "G4"), (4, "D#4"), (6, "D4"), (6.5, "A3")]
    for bar in range(0, nb, 8):
        if bar >= end_b + 2: break
        for off, nt in motif:
            b = bar + off
            if not active(b) or (calm0 <= b < calm1):
                continue
            bass.add(pizz(nt), b, 0.33, pan=-0.25 if off % 2 else 0.25)
            bass.add(pizz(nt[:-1] + str(int(nt[-1]) - 1)), b, 0.22)
    # low pulse after the drop (driving, uneasy)
    for b2 in range(int(stop1 * 2), int(calm0 * 2)):
        b = b2 / 2
        bass.add(low_pulse("D2" if (b // 8) % 2 == 0 else "Eb2", BEAT * 0.45), b, 0.30 if b2 % 2 else 0.4)
    # ---- stingers on the reveals
    fx.add(braam(2.6), 0, at=t_trap, gain=0.55)
    fx.add(sub_drop(1.6), 0, at=t_trap, gain=0.5)
    fx.add(riser(T(stop1 - stop0 - 0.1)), stop0 + 0.05, 0.18)
    fx.add(braam(3.0), stop1, 0.65)
    fx.add(sub_drop(1.4), stop1, 0.6)
    drums.add(crash(2.0), stop1, 0.14)
    fx.add(braam(1.8), 0, at=t_oust, gain=0.35)
    fx.add(sub_drop(1.0), 0, at=t_land, gain=0.45)
    fx.add(braam(2.4), 0, at=t_target, gain=0.5)
    for nt, off in (("D5", 0), ("Eb5", 1.5), ("A4", 3)):
        fx.add(bell(nt), why_b + off, 0.08, pan=0.2)
    fx.add(braam(3.5), 0, at=t_dec, gain=0.45)
    music.add(drone(["D1", "A1", "D2"], T(8) + 2.0, (400, 160)), end_b + 1, 0.4)

    # ---- bed
    ir = reverb_ir(2.2, 0.6)
    wet_src = music.x * 0.5 + fx.x * 0.4 + drums.x * 0.05
    wet = np.stack([signal.fftconvolve(wet_src[c], ir[c])[: wet_src.shape[1]] for c in range(2)])
    kick_t = [T(b) for b in range(int(stop1), int(calm0))]
    pump = sidechain(kick_t, bass.x.shape[1], 0.3, 0.12)
    bed = drums.x * 0.8 + bass.x * 0.85 + music.x * pump * 0.75 + fx.x * 0.85 + wet * 0.55
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
