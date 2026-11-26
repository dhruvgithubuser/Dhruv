"""Synthesised documentary bed + SFX, ducked under the voiceover. Pure numpy, no samples needed.
Usage: python3 audio.py voiceover.wav cues.json out_mix.wav"""
import json, subprocess, sys
import numpy as np

SR = 48000
rng = np.random.default_rng(11)

def load(path):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()

def env(n, a, r, curve=4.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-curve * np.maximum(0, t - a) / max(r, 1e-4))
    return e

def lp(x, fc):
    """One-pole low-pass; fc scalar or per-sample array (Hz)."""
    fc = np.broadcast_to(np.asarray(fc, float), x.shape)
    a = 1 - np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x); s = 0.0
    for i in range(len(x)):
        s += a[i] * (x[i] - s); y[i] = s
    return y

def hp(x, fc): return x - lp(x, fc)

def sine(f, n, ph=0.0):
    f = np.broadcast_to(np.asarray(f, float), (n,))
    return np.sin(ph + 2 * np.pi * np.cumsum(f) / SR)

# ---------------------------------------------------------------- SFX
def whoosh(dur=0.55, up=True):
    n = int(dur * SR); x = rng.standard_normal(n)
    t = np.linspace(0, 1, n)
    fc = 300 + 5000 * (np.sin(np.pi * t) ** 2)
    y = hp(lp(x, fc), 150) * np.sin(np.pi * t) ** 1.5
    return y / np.abs(y).max() * 0.5

def tick():
    n = int(0.05 * SR)
    y = hp(rng.standard_normal(n), 2500) * env(n, 0.0005, 0.012, 3) + 0.4 * sine(1900, n) * env(n, 0.0005, 0.01, 3)
    return y / np.abs(y).max() * 0.22

def impact():
    n = int(2.4 * SR); t = np.arange(n) / SR
    boom = sine(35 + 60 * np.exp(-t * 6), n) * env(n, 0.004, 1.6, 3)
    splash = lp(rng.standard_normal(n), 2500) * env(n, 0.01, 0.9, 5) * 0.6
    y = boom + splash
    return y / np.abs(y).max() * 0.85

def ping():
    n = int(1.4 * SR)
    y = sine(1350, n) * env(n, 0.002, 0.9, 5)
    out = y.copy()
    for d, g in ((0.11, 0.35), (0.23, 0.2), (0.37, 0.1)):
        k = int(d * SR); out[k:] += g * y[:-k]
    return out * 0.28

def glitch():
    n = int(0.42 * SR); y = np.zeros(n)
    for _ in range(14):
        s = rng.integers(0, n - 2000); L = rng.integers(400, 2400)
        f = rng.choice([180, 360, 720, 1440, 2880])
        y[s:s + L] += np.sign(sine(f, L)) * rng.uniform(0.3, 1.0)
    y += hp(rng.standard_normal(n), 3000) * 0.25
    return lp(y, 6000) * env(n, 0.003, 0.35, 2) * 0.35

def pop():
    n = int(0.16 * SR); t = np.arange(n) / SR
    y = sine(650 * np.exp(-t * 18) + 140, n) * env(n, 0.002, 0.08, 4)
    y += 0.3 * lp(rng.standard_normal(n), 3000) * env(n, 0.001, 0.02, 4)
    return y * 0.4

def underwater():
    n = int(3.2 * SR); t = np.arange(n) / SR
    y = lp(rng.standard_normal(n), 380) * np.minimum(1, t / 0.6) * np.exp(-np.maximum(0, t - 1.4) * 1.5) * 2.5
    for _ in range(18):  # bubbles
        s = rng.integers(0, n - 6000); L = rng.integers(1500, 4500); f0 = rng.uniform(500, 1400)
        y[s:s + L] += sine(f0 * np.linspace(1, 1.8, L), L) * env(L, 0.003, 0.05, 4) * 0.12
    return y * 0.5

def hit():
    n = int(1.6 * SR); t = np.arange(n) / SR
    y = sine(48 + 40 * np.exp(-t * 10), n) * env(n, 0.003, 1.0, 3) + lp(rng.standard_normal(n), 1200) * env(n, 0.002, 0.25, 5) * 0.5
    return y / np.abs(y).max() * 0.7

def boom():
    n = int(4.0 * SR); t = np.arange(n) / SR
    y = sine(32 + 30 * np.exp(-t * 4), n) * env(n, 0.01, 3.0, 2.5)
    y += lp(rng.standard_normal(n), 600) * env(n, 0.02, 1.5, 3) * 0.4
    return y / np.abs(y).max() * 0.8

def alarm():
    n = int(0.9 * SR); t = np.arange(n) / SR
    f = np.where((t * 6).astype(int) % 2 == 0, 880, 660)
    y = np.sign(sine(f, n)) * 0.5 + sine(f, n) * 0.5
    return lp(y, 2500) * env(n, 0.01, 0.6, 2) * 0.12

SFX = dict(whoosh=lambda: whoosh(0.5), whoosh_long=lambda: whoosh(1.1), tick=tick, impact=impact, ping=ping,
           glitch=glitch, pop=pop, underwater=underwater, hit=hit, boom=boom, alarm=alarm)
LEAD = dict(whoosh=0.25, whoosh_long=0.55)  # centre the whoosh on the cut

# ---------------------------------------------------------------- music bed
def bed(n, dur):
    t = np.arange(n) / SR
    # minor progression, 8 s per chord: Am, F, Dm, E
    roots = [55.0, 43.65, 36.71, 41.20]
    triads = [[0, 3, 7], [0, 4, 7], [0, 3, 7], [0, 4, 7]]
    pad = np.zeros(n)
    seg = 8.0
    for k in range(int(np.ceil(dur / seg)) + 1):
        i = k % 4; s = int(k * seg * SR); e = min(n, int((k + 1) * seg * SR + 2 * SR))
        if s >= n: break
        L = e - s; tt = np.arange(L) / SR
        a = np.minimum(1, tt / 2.0) * np.minimum(1, np.maximum(0, (L / SR - tt)) / 2.0)
        for semi in triads[i]:
            f = roots[i] * 2 ** (semi / 12) * 2
            for det in (-0.25, 0.25):
                pad[s:e] += sine(f + det, L) * a * 0.10
                pad[s:e] += sine(2 * f + det, L) * a * 0.035
    drone = sine(55, n) * 0.22 + sine(55.3, n) * 0.18 + sine(27.5, n) * 0.18
    drone *= 0.75 + 0.25 * np.sin(2 * np.pi * t / 7.0)
    # heartbeat pulse at 72 bpm
    pulse = np.zeros(n); beat = 60 / 72
    k = 0
    while k * beat < dur:
        for off, g in ((0, 1.0), (0.22, 0.6)):
            s = int((k * beat + off) * SR); L = int(0.3 * SR)
            if s + L < n:
                tt = np.arange(L) / SR
                pulse[s:s + L] += np.sin(2 * np.pi * (60 * tt - 20 * tt ** 2)) * np.exp(-tt * 18) * g
        k += 1
    shimmer = lp(rng.standard_normal(n), 5000)
    shimmer = hp(shimmer, 3000) * 0.012
    m = pad + drone + pulse * 0.35 + shimmer
    return m / np.abs(m).max()

def main(vo_path, cue_path, out_path):
    vo = load(vo_path); cues = json.load(open(cue_path))
    dur = cues["duration"]; n = int(dur * SR) + SR
    vo = np.pad(vo, (0, max(0, n - len(vo))))[:n]
    music = bed(n, dur)
    # section dynamics: drop under the divers scene, swell at the end, fade in/out
    t = np.arange(n) / SR
    def at(kind): return [c["t"] for c in cues["cues"] if c["kind"] == kind]
    dyn = np.ones(n)
    for td in at("underwater"):
        dyn *= 1 - 0.45 * ((t > td) & (t < td + 6.0))
    music = lp(music, 2200) * dyn
    music *= np.minimum(1, t / 1.5) * np.clip((dur + 0.3 - t) / 1.5, 0, 1)
    # ducking: follow the voice envelope
    venv = np.abs(vo)
    w = int(0.08 * SR); venv = np.convolve(venv, np.ones(w) / w, mode="same")
    venv = venv / max(1e-6, venv.max())
    duck = 1 - 0.55 * np.clip(venv * 6, 0, 1)
    duck = np.convolve(duck, np.ones(int(0.25 * SR)) / int(0.25 * SR), mode="same")
    music *= duck
    sfx = np.zeros(n)
    for c in cues["cues"]:
        y = SFX[c["kind"]](); s = int((c["t"] - LEAD.get(c["kind"], 0)) * SR)
        if s < 0: y = y[-s:]; s = 0
        e = min(n, s + len(y)); sfx[s:e] += y[:e - s]
    mix = vo * 1.0 + music * 0.11 + sfx * 0.55
    mix = np.tanh(mix * 1.1) / 1.1
    mix = mix[:int(dur * SR)]
    pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes()
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-",
                    "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", str(SR), "-ac", "2", out_path], input=pcm, check=True)
    print("mix written", out_path, f"{dur:.2f}s")

if __name__ == "__main__":
    main(*sys.argv[1:4])
