"""English subtitles (SRT + WebVTT) and YouTube chapters from pompeii/timeline.json.

    python3 pompeii/tools/make_subs.py

Cues: at most 2 lines x 42 characters, 1.0-6.0 s, broken at punctuation where possible,
timed on the narration's word stamps (build_vo.py). Writes pompeii/deliverables/.
"""
import json, os, textwrap

FILM = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(FILM, "deliverables")
os.makedirs(OUT, exist_ok=True)
tl = json.load(open(os.path.join(FILM, "timeline.json")))
MAXC, MAXD = 84, 6.0

def ts(t, sep=","):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d}{sep}{ms:03d}"

def wrap(txt):
    lines = textwrap.wrap(txt, 42)
    if len(lines) <= 2: return "\n".join(lines)
    return "\n".join(textwrap.wrap(txt, (len(txt) + 1) // 2 + 2)[:2])

cues = []
for sc in tl["scenes"]:
    for ln in sc["lines"]:
        ws = ln["words"]; cur = []
        for i, w in enumerate(ws):
            cur.append(w)
            txt = " ".join(x[0] for x in cur)
            nxt = " ".join(x[0] for x in cur + ws[i + 1:i + 2])
            dur = cur[-1][2] - cur[0][1]
            last = i == len(ws) - 1
            punct = w[0][-1] in ",;:." and len(txt) > 30
            if last or len(nxt) > MAXC or dur > MAXD or (punct and len(txt) > 50):
                cues.append([cur[0][1], cur[-1][2], txt]); cur = []

# hold each cue until just before the next one (reading time), never past 6 s or across a long pause
for i, c in enumerate(cues):
    nxt = cues[i + 1][0] if i + 1 < len(cues) else c[1] + 2
    c[1] = min(max(c[1] + 0.35, c[0] + 1.0), nxt - 0.05, c[0] + MAXD)

srt = "\n".join(f"{i + 1}\n{ts(a)} --> {ts(b)}\n{wrap(t)}\n" for i, (a, b, t) in enumerate(cues))
open(os.path.join(OUT, "pompeii_en.srt"), "w").write(srt)
vtt = "WEBVTT\n\n" + "\n".join(f"{ts(a, '.')} --> {ts(b, '.')}\n{wrap(t)}\n" for a, b, t in cues)
open(os.path.join(OUT, "pompeii_en.vtt"), "w").write(vtt)

# Chapters: YouTube needs the first at 0:00, >= 3 chapters, each >= 10 s.
def mmss(t): t = int(t); return f"{t // 60}:{t % 60:02d}"
ch = [f"{mmss(0 if i == 0 else s['start'])} {s['title']}" for i, s in enumerate(tl["scenes"])]
open(os.path.join(OUT, "youtube_chapters.txt"), "w").write("\n".join(ch) + "\n")

# Clean VO script for recording / re-generation (text only, scene headed)
vo = []
for s in tl["scenes"]:
    vo.append(f"[{s['id']} | {mmss(s['start'])}] {s['title'].upper()}")
    vo += [l["text"] for l in s["lines"]]
    vo.append("")
open(os.path.join(OUT, "voiceover_script.txt"), "w").write("\n".join(vo))
print(f"{len(cues)} cues, {len(ch)} chapters -> {os.path.relpath(OUT)}")
print("\n".join(ch))
