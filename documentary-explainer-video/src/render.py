"""Reel renderer: every frame is a pure function of time t (seconds).
Usage:
  python3 render.py frame T out.png          # single still (preview)
  python3 render.py range F0 F1 out.mp4      # render frames [F0,F1) to a silent segment
  python3 render.py cues out.json            # dump SFX cue list for audio.py
"""
import json, math, os, subprocess, sys
import numpy as np
import skia

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = lambda *p: os.path.join(ROOT, "assets", *p)
W, H, FPS = 1080, 1920, 30
TIMING = json.load(open(A("timing.json")))
DUR = TIMING["duration"]
WORDS = json.load(open(A("words.json")))
GEO = json.load(open(A("geo.json")))

# ---------------------------------------------------------------- helpers
def wt(tok, after=0.0, default=None):
    """Spoken time of the first word starting with tok at/after `after`."""
    tok = tok.lower()
    for w in WORDS:
        k = w["w"].lower().strip(".,?!'\"-")
        if w["s"] >= after - 0.05 and k.startswith(tok):
            return w["s"]
    return default if default is not None else after

clamp = lambda x, a=0.0, b=1.0: max(a, min(b, x))
lerp = lambda a, b, p: a + (b - a) * p
def prog(t, a, b): return clamp((t - a) / max(1e-6, b - a))
def eio(p): return 4 * p ** 3 if p < .5 else 1 - (-2 * p + 2) ** 3 / 2
def eout(p): return 1 - (1 - p) ** 3
def eexpo(p): return 1 if p >= 1 else 1 - 2 ** (-10 * p)
def eback(p, s=1.7): p -= 1; return p * p * ((s + 1) * p + s) + 1

def hexc(h, a=1.0):
    h = h.lstrip("#"); return skia.ColorSetARGB(int(255 * clamp(a)), int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))

C = dict(bg="#071019", water="#0b1a26", water2="#0f2433", land="#1d2833", land_top="#243241", side="#0d151d",
         coast="#5b7a91", red="#ff3b30", orange="#ff8a3d", teal="#2ad4c4", yellow="#ffd23f", white="#f3f6f8",
         grey="#8fa3b3", paper="#f3efe6", ink="#16191c")

FD = "/usr/share/fonts/opentype/inter/"
_tf = {}
def TF(name):
    if name not in _tf:
        path = name if name.startswith("/") else FD + name + ".otf"
        _tf[name] = skia.Typeface.MakeFromFile(path)
    return _tf[name]
SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
MONO = "/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Bold.ttf"

def P(color, a=1.0, stroke=None, blur=None, shader=None, effect=None):
    p = skia.Paint(AntiAlias=True, Color=hexc(color, a) if isinstance(color, str) else color)
    if stroke is not None:
        p.setStyle(skia.Paint.kStroke_Style); p.setStrokeWidth(stroke)
        p.setStrokeCap(skia.Paint.kRound_Cap); p.setStrokeJoin(skia.Paint.kRound_Join)
    if blur: p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, blur))
    if shader is not None: p.setShader(shader)
    if effect is not None: p.setPathEffect(effect)
    return p

def text_w(s, size, font="InterDisplay-Black", track=0.0):
    f = skia.Font(TF(font), size)
    return f.measureText(s) + track * size * max(0, len(s) - 1)

def text(c, s, x, y, size, color="#f3f6f8", a=1.0, font="InterDisplay-Black", align="l", track=0.0,
         shadow=True, reveal=1.0, glow=None):
    """Draw text; `reveal` 0..1 types characters on. align l/c/r. Returns width."""
    if a <= 0.003 or not s: return 0
    f = skia.Font(TF(font), size); f.setSubpixel(True)
    tw = text_w(s, size, font, track)
    x0 = x - tw / 2 if align == "c" else x - tw if align == "r" else x
    n = int(round(len(s) * clamp(reveal)))
    if n <= 0: return tw
    paint = P(color, a)
    if shadow:
        paint.setImageFilter(skia.ImageFilters.DropShadow(0, size * 0.04, size * 0.06, size * 0.06, hexc("#000000", 0.7 * a)))
    if track == 0:
        if glow: c.drawString(s[:n], x0, y, f, P(glow, a * 0.8, blur=size * 0.18))
        c.drawString(s[:n], x0, y, f, paint)
    else:
        cx = x0
        for ch in s[:n]:
            if glow: c.drawString(ch, cx, y, f, P(glow, a * 0.8, blur=size * 0.18))
            c.drawString(ch, cx, y, f, paint)
            cx += f.measureText(ch) + track * size
    return tw

def wrap(s, size, maxw, font):
    words, lines, cur = s.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if text_w(t, size, font) > maxw and cur: lines.append(cur); cur = w
        else: cur = t
    if cur: lines.append(cur)
    return lines

def rrect(c, x, y, w, h, r, paint): c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), r, r), paint)

def pill(c, s, x, y, size, fg, bg, a=1.0, align="l", font="Inter-Bold", track=0.12):
    tw = text_w(s, size, font, track); padx, h = size * 0.7, size * 1.9
    x0 = x - (tw + 2 * padx) / 2 if align == "c" else x
    rrect(c, x0, y - h * 0.7, tw + 2 * padx, h, h / 2, P(bg, a))
    text(c, s, x0 + padx, y + size * 0.05, size, fg, a, font, track=track, shadow=False)
    return tw + 2 * padx

# ---------------------------------------------------------------- map
def merc(lon, lat):
    return lon, math.degrees(math.log(math.tan(math.pi / 4 + math.radians(lat) / 2)))

def mkpath(rings, close=True):
    p = skia.Path(); p.setFillType(skia.PathFillType.kEvenOdd)
    for r in rings:
        for i, (lo, la) in enumerate(r):
            x, y = merc(lo, la)
            (p.moveTo if i == 0 else p.lineTo)(x, y)
        if close: p.close()
    return p

LAND = mkpath(GEO["land"]); LAKES = mkpath(GEO["lakes"])
STATES = {k: mkpath(v) for k, v in GEO["states"].items()}
SLINES = mkpath(GEO["state_lines"], close=False)

PTS = dict(KNEW=(-90.0283, 30.0424), KFMY=(-81.8633, 26.5866), CRASH=(-88.615, 30.262), HORN=(-88.655, 30.238),
           PASC=(-88.556, 30.366), BILOXI=(-88.885, 30.396), GULFPORT=(-89.093, 30.367), MOBILE=(-88.043, 30.695),
           NOLA=(-90.07, 29.95), FTMYERS=(-81.87, 26.64), SHIP=(-88.95, 30.215), PETIT=(-88.46, 30.215))
# approximate track (schematic; no public track data): New Orleans -> along coast -> crash area
TRACK = [PTS["KNEW"], (-89.80, 30.13), (-89.45, 30.22), (-89.10, 30.27), (-88.85, 30.28), PTS["CRASH"]]
TRACK_PATH = skia.Path()
for i, (lo, la) in enumerate(TRACK):
    x, y = merc(lo, la); (TRACK_PATH.moveTo if i == 0 else TRACK_PATH.lineTo)(x, y)

OX, OY, OW, OH = -260, -720, 1600, 2460   # flat-map offscreen region (covers the tilted view up to 30 deg)
_OFF = {}
def offscreen():
    if "s" not in _OFF:
        _OFF["buf"] = np.zeros((OH, OW, 4), np.uint8); _OFF["s"] = skia.Surface(_OFF["buf"])
    return _OFF["s"]

class Cam:
    """Map camera. Geometry is drawn flat (affine) into an offscreen surface, then that image is drawn
    through a perspective homography so the map plane tilts away (top recedes) without wrap artifacts."""
    def __init__(s, lon, lat, z, tilt=16.0, yoff=0.0):
        cx, cy = merc(lon, lat)
        s.A = skia.Matrix.MakeAll(z, 0, W / 2 - z * cx, 0, -z, H / 2 + z * cy + yoff, 0, 0, 1)
        ang = math.radians(tilt); d = 1500.0
        t1 = skia.Matrix.Translate(-W / 2, -H / 2)
        pm = skia.Matrix.MakeAll(1.08, 0, 0, 0, 1.08 * math.cos(ang), 0, 0, -math.sin(ang) / d, 1)
        t2 = skia.Matrix.Translate(W / 2, H / 2 + 40)
        s.Pm = skia.Matrix.Concat(t2, skia.Matrix.Concat(pm, t1))
        s.M = skia.Matrix.Concat(s.Pm, s.A)
        s.z = z
    def pt(s, lon, lat):
        x, y = merc(lon, lat); p = s.M.mapXY(x, y); return p.x(), p.y()
    def flat(s, p):
        q = skia.Path(p); q.transform(s.A); return q
    def path(s, p):  # screen-space path (only for small, on-screen geometry such as routes)
        q = skia.Path(p); q.transform(s.M); return q

def lerp_cam(k0, k1, p, tilt=16.0):
    """Interpolate (lon,lat,z) keyframes; zoom interpolated in log space."""
    lon = lerp(k0[0], k1[0], p); lat = lerp(k0[1], k1[1], p)
    z = math.exp(lerp(math.log(k0[2]), math.log(k1[2]), p))
    return Cam(lon, lat, z, tilt)

GRAIN = []
def _grain():
    rng = np.random.default_rng(7)
    for i in range(6):
        g = rng.integers(0, 255, (H // 2, W // 2), dtype=np.uint8)
        arr = np.dstack([g, g, g, np.full_like(g, 255)])
        GRAIN.append(skia.Image.fromarray(np.ascontiguousarray(arr)))
_grain()

def draw_water(c, t, cam=None, tint=1.0):
    c.drawPaint(P(C["bg"]))
    sh = skia.GradientShader.MakeLinear([(0, 0), (0, H)], [hexc("#050c13"), hexc(C["water"]), hexc(C["water2"])], [0, .45, 1])
    c.drawPaint(P("#000000", shader=sh))

def draw_map(c, cam, t, hi=None, lines=True, grat=True, coast_glow=0.7, scrim=True):
    """hi: {state: (color, alpha)}"""
    draw_water(c, t)
    surf = offscreen(); o = surf.getCanvas(); o.clear(skia.ColorTRANSPARENT)
    o.save(); o.translate(-OX, -OY)
    if grat:  # graticule
        step = 1.0 if cam.z < 250 else 0.25 if cam.z < 1500 else 0.05
        gp = skia.Path()
        lon_a, lon_b, lat_a, lat_b = (-108, -68, 14, 47) if step >= 1 else (-92, -85, 27, 33)
        lon = math.floor(lon_a / step) * step
        while lon <= lon_b:
            gp.moveTo(*merc(lon, lat_a)); gp.lineTo(*merc(lon, lat_b)); lon += step
        lat = lat_a
        while lat <= lat_b:
            gp.moveTo(*merc(lon_a, lat)); gp.lineTo(*merc(lon_b, lat)); lat += step
        o.drawPath(cam.flat(gp), P("#9fc3dd", 0.06, stroke=1.0))
    land = cam.flat(LAND)
    # fake extrusion: darker copies offset downward give the 3D slab look
    for dy, col in ((10, "#04080c"), (6, C["side"])):
        q = skia.Path(land); q.offset(0, dy); o.drawPath(q, P(col))
    o.drawPath(land, P(C["land"], shader=skia.GradientShader.MakeLinear(
        [(0, OY), (0, OY + OH)], [hexc("#2c3a48"), hexc("#18222b")])))
    o.drawPath(cam.flat(LAKES), P(C["water"]))
    if hi:
        for st, (col, a) in hi.items():
            if a > 0.01 and st in STATES:
                sp = cam.flat(STATES[st])
                o.drawPath(sp, P(col, 0.28 * a))
                o.drawPath(sp, P(col, 0.9 * a, stroke=2.2))
                o.drawPath(sp, P(col, 0.5 * a, stroke=6, blur=6))
    if lines:
        o.drawPath(cam.flat(SLINES), P("#7f99ad", 0.45, stroke=1.4, effect=skia.DashPathEffect.Make([6, 6], 0)))
    if coast_glow:
        o.drawPath(land, P(C["teal"], 0.18 * coast_glow, stroke=5, blur=5))
        o.drawPath(land, P("#8fb3c9", 0.55 * coast_glow, stroke=1.2))
    o.restore()
    img = surf.makeImageSnapshot()
    c.save(); c.concat(cam.Pm)
    c.drawImage(img, OX, OY, skia.SamplingOptions(skia.FilterMode.kLinear))
    c.restore()
    if scrim:
        c.drawRect(skia.Rect.MakeWH(W, 820), P("#000000", shader=skia.GradientShader.MakeLinear(
            [(0, 0), (0, 820)], [hexc("#03070b", 0.85), hexc("#03070b", 0.55), hexc("#03070b", 0)], [0, .55, 1])))

def map_label(c, cam, lon, lat, s, size=30, color="#f3f6f8", a=1.0, font="Inter-Bold", track=0.16, dx=0, dy=0, align="c"):
    x, y = cam.pt(lon, lat)
    text(c, s, x + dx, y + dy, size, color, a, font, align=align, track=track)

def pin(c, x, y, color, a=1.0, t=0.0, r=9, pulse=True):
    if a <= 0: return
    if pulse:
        for k in range(2):
            ph = ((t * 0.9) + k * 0.5) % 1.0
            c.drawCircle(x, y, r + ph * 46, P(color, a * (1 - ph) * 0.8, stroke=2.5))
    c.drawCircle(x, y, r * 2.2, P(color, 0.35 * a, blur=10))
    c.drawCircle(x, y, r, P(color, a)); c.drawCircle(x, y, r * 0.45, P("#ffffff", a))

def plane_icon(c, x, y, ang, size=52, color="#f3f6f8", a=1.0, glow=None):
    """Top-down high-wing single (nose along +x)."""
    c.save(); c.translate(x, y); c.rotate(math.degrees(ang)); s = size / 100
    p = skia.Path()
    p.moveTo(50 * s, 0); p.cubicTo(48 * s, -6 * s, 38 * s, -7 * s, 30 * s, -7 * s)
    p.lineTo(10 * s, -7 * s); p.lineTo(10 * s, -48 * s); p.lineTo(-4 * s, -48 * s); p.lineTo(-6 * s, -7 * s)
    p.lineTo(-34 * s, -4 * s); p.lineTo(-38 * s, -18 * s); p.lineTo(-46 * s, -18 * s); p.lineTo(-46 * s, 0)
    p.lineTo(-46 * s, 18 * s); p.lineTo(-38 * s, 18 * s); p.lineTo(-34 * s, 4 * s); p.lineTo(-6 * s, 7 * s)
    p.lineTo(-4 * s, 48 * s); p.lineTo(10 * s, 48 * s); p.lineTo(10 * s, 7 * s); p.lineTo(30 * s, 7 * s)
    p.cubicTo(38 * s, 7 * s, 48 * s, 6 * s, 50 * s, 0); p.close()
    q = skia.Path(p); q.offset(4, 8); c.drawPath(q, P("#000000", 0.45 * a, blur=5))
    if glow: c.drawPath(p, P(glow, 0.7 * a, blur=12))
    c.drawPath(p, P(color, a)); c.restore()

def route_draw(c, cam, path, p0, p1, color, a=1.0, width=5, dash=None, glow=True):
    """Draw sub-segment [p0,p1] (fractions) of a geo path in screen space."""
    sp = cam.path(path); pm = skia.PathMeasure(sp, False); L = pm.getLength()
    seg = skia.Path(); pm.getSegment(L * p0, L * p1, seg, True)
    eff = skia.DashPathEffect.Make(dash, 0) if dash else None
    if glow: c.drawPath(seg, P(color, 0.35 * a, stroke=width * 2.6, blur=6))
    c.drawPath(seg, P(color, a, stroke=width, effect=eff))
    pos, tan = pm.getPosTan(L * clamp(p1, 0, 0.9999))
    return pos.x(), pos.y(), math.atan2(tan.y(), tan.x())

# ---------------------------------------------------------------- chrome / overlays
def chrome(c, t, src=None, tag_a=1.0):
    # vignette
    c.drawPaint(P("#000000", shader=skia.GradientShader.MakeRadial(
        (W / 2, H * 0.48), H * 0.62, [hexc("#000000", 0), hexc("#000000", 0), hexc("#000000", 0.62)], [0, 0.55, 1])))
    # grain
    g = GRAIN[int(t * 24) % len(GRAIN)]
    gp = skia.Paint(); gp.setAlphaf(0.06); gp.setBlendMode(skia.BlendMode.kOverlay)
    c.drawImageRect(g, skia.Rect.MakeWH(W, H), skia.SamplingOptions(), gp)
    # top tag
    if tag_a > 0:
        x = 64; y = 150
        c.drawCircle(x + 9, y - 10, 8, P(C["red"], tag_a * (0.55 + 0.45 * math.sin(t * 5) ** 2)))
        text(c, "GULF COAST · PLANE CRASH", x + 30, y, 25, C["white"], tag_a * 0.92, "Inter-Bold", track=0.16)
        text(c, "24 NOV 2026", W - 64, y, 25, C["grey"], tag_a * 0.85, "Inter-SemiBold", align="r", track=0.12)
    # progress bar
    c.drawRect(skia.Rect.MakeXYWH(0, 0, W, 8), P("#ffffff", 0.12))
    c.drawRect(skia.Rect.MakeXYWH(0, 0, W * t / DUR, 8), P(C["red"], 0.95))
    if src:
        text(c, "SOURCE: " + src, 64, 1600, 22, C["grey"], 0.9, "Inter-SemiBold", track=0.08)

def headline(c, lines, y, size=96, color="#f3f6f8", a=1.0, t=0.0, t0=0.0, x=64, accent=None, stagger=0.12, lh=1.04):
    """Big left-aligned stacked headline sliding up per line. accent: set of line idx drawn in red."""
    for i, ln in enumerate(lines):
        p = eexpo(prog(t, t0 + i * stagger, t0 + i * stagger + 0.55))
        if p <= 0: continue
        col = C["red"] if accent and i in accent else color
        c.save()
        c.clipRect(skia.Rect.MakeXYWH(0, y + i * size * lh - size * 1.05, W, size * 1.3))
        text(c, ln, x, y + i * size * lh + (1 - p) * size * 1.1, size, col, a, "InterDisplay-Black", track=-0.01)
        c.restore()

def bar_accent(c, x, y, w, color, p):
    c.drawRect(skia.Rect.MakeXYWH(x, y, w * eout(p), 8), P(color))

# ---------------------------------------------------------------- shots
B = {b["id"]: b for b in TIMING["beats"]}
def bs(i): return B[f"b{i:02d}"]["start"]

T_C1 = 3.95                      # hook: date card -> plunge
T_AIR = bs(2) - 0.05             # aircraft card
T_FAM = wt("on", 10.5, 11.0) - 0.05     # family map
T_ROUTE = bs(3) - 0.05
T_ZOOM = bs(4) - 0.05
T_VSI = bs(5) - 0.05
T_CMP = wt("far", 31.0, 31.7) - 0.15
T_TIME = bs(6) - 0.05
T_RADAR = wt("controllers", 35.5, 36.6) - 0.1
T_DEBRIS = bs(7) - 0.05
T_DIVE = bs(8) - 0.05
T_CLIP = bs(9) - 0.05
T_NTSB = wt("ntsb", 54.5, 55.5) - 0.35
T_END = bs(10) - 0.05

def shot_hook_a(c, t):
    p = eio(prog(t, 0, T_C1 + 0.3))
    cam = lerp_cam((-88.2, 27.6, 62), (-88.4, 28.6, 82), p, tilt=22)
    draw_map(c, cam, t, hi={"Mississippi": (C["teal"], prog(t, 1.2, 2.2))}, scrim=False)
    map_label(c, cam, -89.0, 27.6, "GULF OF MEXICO", 34, C["grey"], 0.75 * prog(t, 0.4, 1.4), "Inter-SemiBold", 0.42)
    for st, lo, la in (("LOUISIANA", -92.2, 31.0), ("MISSISSIPPI", -89.7, 32.4), ("ALABAMA", -86.8, 32.4), ("FLORIDA", -81.6, 28.3)):
        map_label(c, cam, lo, la, st, 26, C["white"], 0.8 * prog(t, 0.8, 1.8), "Inter-Bold", 0.22)
    # date card (sits over open water, below the coastline)
    y = 1230
    text(c, "TUESDAY", 64, y - 92, 34, C["red"], prog(t, 0.2, 0.5), "Inter-Black", track=0.3)
    text(c, "24 NOVEMBER", 64, y, 112, C["white"], 1, "InterDisplay-Black", reveal=prog(t, 0.45, 1.2), track=-0.01)
    text(c, "2026", 64, y + 118, 112, C["white"], 1, "InterDisplay-Black", reveal=prog(t, 1.2, 1.55))
    bar_accent(c, 64, y + 150, 260, C["red"], prog(t, 1.5, 2.1))
    text(c, "AFTERNOON · MISSISSIPPI COAST", 64, y + 205, 30, C["grey"], prog(t, 1.9, 2.4), "Inter-SemiBold", track=0.14)
    chrome(c, t, tag_a=0)

def shot_hook_b(c, t):
    p = eexpo(prog(t, T_C1, T_C1 + 2.6))
    cam = lerp_cam((-88.4, 28.6, 82), (-88.62, 30.05, 720), p, tilt=24)
    draw_map(c, cam, t, hi={"Mississippi": (C["teal"], 1 - p * 0.4)})
    cx, cy = cam.pt(*PTS["CRASH"])
    t_imp = wt("gulf", 5.5, 6.2)
    # falling plane streak toward the crash point
    fp = prog(t, wt("falls", 3.8, 4.2) - 0.1, t_imp)
    if fp < 1:
        ang = math.radians(100)
        sx, sy = cx - 520 * (1 - eio(fp)) * math.cos(ang - 0.6), cy - 900 * (1 - eio(fp))
        c.drawLine(sx, sy - 160, sx, sy, P(C["red"], 0.5 * fp, stroke=4, blur=3))
        plane_icon(c, sx, sy, math.radians(70 + 200 * fp), 60 + 30 * (1 - fp), C["white"], 1.0, glow=C["red"])
    else:
        k = t - t_imp
        for i in range(3):
            ph = clamp(k * 0.9 - i * 0.22, 0, 1)
            if ph > 0: c.drawCircle(cx, cy, 20 + ph * 260, P(C["red"], (1 - ph) * 0.9, stroke=5 - 3 * ph))
        flash = clamp(1 - k * 3)
        if flash > 0: c.drawPaint(P("#ffffff", 0.25 * flash))
        pin(c, cx, cy, C["red"], 1, t, r=11)
    headline(c, ["A SMALL", "PLANE.", "6 ON BOARD."], 420, 118, t=t, t0=T_C1 + 0.05, accent={2})
    text(c, "INTO THE GULF", 64, 1400, 64, C["red"], prog(t, t_imp, t_imp + 0.25), "InterDisplay-Black", track=0.02,
         glow=C["red"])
    chrome(c, t, src="U.S. Coast Guard via WLOX, Mississippi Free Press")

def cessna_side(c, x, y, s, a=1.0, prop_t=0.0):
    """Generic stylised high-wing single-engine retractable (illustrative, not a specific airframe)."""
    c.save(); c.translate(x, y); c.scale(s, s)
    body = skia.Path()
    pts = [(0, 150), (14, 126), (70, 112), (175, 104), (250, 62), (470, 58), (560, 92), (700, 112), (770, 14), (842, 10),
           (858, 22), (872, 132), (880, 146), (860, 152), (560, 176), (320, 200), (140, 196), (52, 182), (10, 168)]
    body.moveTo(*pts[0]); [body.lineTo(*p) for p in pts[1:]]; body.close()
    sh = skia.GradientShader.MakeLinear([(0, 40), (0, 210)], [hexc("#ffffff"), hexc("#dfe6ec"), hexc("#9aa9b5")], [0, .55, 1])
    q = skia.Path(body); q.offset(0, 26)
    c.drawPath(q, P("#000000", 0.35 * a, blur=22))
    c.drawPath(body, P("#ffffff", a, shader=sh))
    # livery stripe (generic)
    st = skia.Path(); st.moveTo(40, 160); st.lineTo(560, 150); st.lineTo(872, 120); st.lineTo(874, 132); st.lineTo(560, 164); st.lineTo(46, 172); st.close()
    c.drawPath(st, P(C["red"], a))
    st2 = skia.Path(); st2.moveTo(770, 40); st2.lineTo(846, 36); st2.lineTo(850, 56); st2.lineTo(774, 60); st2.close()
    c.drawPath(st2, P(C["red"], a))
    # windows
    for poly in ([(196, 102), (252, 70), (330, 68), (330, 104)], [(344, 68), (440, 66), (440, 104), (344, 104)],
                 [(454, 66), (530, 92), (454, 104)]):
        w = skia.Path(); w.moveTo(*poly[0]); [w.lineTo(*p) for p in poly[1:]]; w.close()
        c.drawPath(w, P("#1b2a38", a))
        c.drawPath(w, P("#6fa0c4", 0.35 * a, shader=skia.GradientShader.MakeLinear([(200, 60), (420, 110)], [hexc("#9cc7e6", .6), hexc("#000000", 0)])))
    # high wing (seen edge-on as an airfoil on the roof)
    wg = skia.Path(); wg.moveTo(232, 60); wg.cubicTo(250, 40, 300, 38, 430, 46); wg.lineTo(436, 54); wg.cubicTo(300, 60, 260, 64, 232, 60); wg.close()
    c.drawPath(wg, P("#cfd8e0", a))
    # horizontal stabiliser
    hs = skia.Path(); hs.moveTo(730, 122); hs.lineTo(890, 116); hs.lineTo(892, 126); hs.lineTo(732, 132); hs.close()
    c.drawPath(hs, P("#c3ccd4", a))
    # panel lines
    c.drawLine(176, 106, 176, 194, P("#7d8b96", 0.6 * a, stroke=2)); c.drawLine(560, 92, 560, 176, P("#7d8b96", 0.5 * a, stroke=2))
    # spinner + prop disc
    c.drawCircle(4, 150, 16, P("#3a4550", a))
    ph = (prop_t * 37) % 1
    c.drawOval(skia.Rect.MakeXYWH(-14, 40, 20, 220), P("#c8d3dc", 0.18 * a))
    c.drawLine(-4, 150 - 105 * math.cos(ph * 6.28), -4, 150 + 105 * math.cos(ph * 6.28), P("#20262b", 0.55 * a, stroke=6))
    c.restore()

def shot_aircraft(c, t):
    lt = t - T_AIR
    draw_water(c, t)
    # blueprint grid
    gp = skia.Path()
    for i in range(0, W + 1, 60): gp.moveTo(i, 0); gp.lineTo(i, H)
    for j in range(0, H + 1, 60): gp.moveTo(0, j); gp.lineTo(W, j)
    c.drawPath(gp, P("#7fb6dc", 0.06, stroke=1))
    # speed lines
    for i in range(14):
        yy = 760 + (i * 97) % 520; xx = (W + 400) - ((lt * 1900 + i * 331) % (W + 800))
        c.drawLine(xx, yy, xx + 240, yy, P("#ffffff", 0.08, stroke=2))
    p = eexpo(prog(t, T_AIR, T_AIR + 1.0))
    bob = math.sin(lt * 2.2) * 8
    cessna_side(c, lerp(W + 100, 120, p), 820 + bob, 0.98, a=1, prop_t=lt)
    t_c = wt("cessna", 9.0, 9.6)
    headline(c, ["CESSNA 210"], 420, 120, t=t, t0=t_c - 0.25)
    text(c, "SINGLE-ENGINE · PISTON", 64, 500, 34, C["teal"], prog(t, wt("single", 8.5, 8.9) - 0.1, wt("single", 8.5, 8.9) + 0.3),
         "Inter-Bold", track=0.14)
    # callouts
    for i, (lab, ax, ay, tx, ty) in enumerate((("6 SEATS", 380, 905, 330, 1240), ("HIGH WING", 330, 855, 560, 720),
                                               ("RETRACTABLE GEAR", 520, 1015, 520, 1320))):
        q = prog(t, T_AIR + 1.1 + i * 0.35, T_AIR + 1.5 + i * 0.35)
        if q <= 0: continue
        c.drawLine(ax, ay, lerp(ax, tx, eout(q)), lerp(ay, ty, eout(q)), P(C["yellow"], q, stroke=2.5))
        c.drawCircle(ax, ay, 7, P(C["yellow"], q))
        if q > .6: pill(c, lab, tx - 20, ty + (30 if ty > ay else -10), 24, C["ink"], C["yellow"], prog(q, .6, 1), "l")
    text(c, "ILLUSTRATION · NOT THE ACTUAL AIRCRAFT", W - 64, 1540, 20, C["grey"], 0.8, "Inter-SemiBold", align="r", track=0.1)
    chrome(c, t, src="FLYING Magazine, CBS News")

def shot_family(c, t):
    p = eio(prog(t, T_FAM, T_ROUTE + 0.2))
    cam = lerp_cam((-86.9, 28.3, 76), (-87.0, 28.6, 82), p, tilt=20)
    t_fl = wt("florida", 12.2, 12.7); t_la = wt("louisiana", 14.8, 15.3)
    draw_map(c, cam, t, hi={"Florida": (C["orange"], prog(t, t_fl - 0.2, t_fl + 0.3)),
                            "Louisiana": (C["teal"], prog(t, t_la - 0.3, t_la + 0.2))})
    map_label(c, cam, -82.3, 28.9, "FLORIDA", 34, C["white"], prog(t, t_fl - .2, t_fl + .3), track=0.3)
    map_label(c, cam, -91.6, 31.3, "LOUISIANA", 34, C["white"], prog(t, t_la - .3, t_la + .2), track=0.3)
    # arc Louisiana -> Florida "heading home"
    t_home = wt("heading", 12.8, 13.2)
    x0, y0 = cam.pt(-90.6, 29.6); x1, y1 = cam.pt(-81.9, 26.9)
    arc = skia.Path(); arc.moveTo(x0, y0); arc.quadTo((x0 + x1) / 2, min(y0, y1) - 330, x1, y1)
    pm = skia.PathMeasure(arc, False); L = pm.getLength(); q = eio(prog(t, t_home - 0.1, t_home + 1.6))
    if q > 0:
        seg = skia.Path(); pm.getSegment(0, L * q, seg, True)
        c.drawPath(seg, P(C["orange"], 0.9, stroke=5, effect=skia.DashPathEffect.Make([18, 12], -t * 40)))
        pos, tan = pm.getPosTan(L * min(q, .999))
        plane_icon(c, pos.x(), pos.y(), math.atan2(tan.y(), tan.x()), 54)
    pin(c, x0, y0, C["teal"], prog(t, t_la - .3, t_la), t)
    pin(c, x1, y1, C["orange"], prog(t, t_fl - .2, t_fl + .1), t)
    headline(c, ["A FAMILY", "HEADING HOME"], 420, 104, t=t, t0=T_FAM + 0.15, accent={1})
    text(c, "AFTER A FISHING TRIP IN LOUISIANA", 64, 620, 32, C["grey"], prog(t, wt("fishing", 14.2, 14.5) - .2, wt("fishing", 14.2, 14.5) + .2),
         "Inter-SemiBold", track=0.12)
    chrome(c, t, src="Fox News, People, WINK News")

def shot_route(c, t):
    lt = t - T_ROUTE; d = T_ZOOM - T_ROUTE
    p = eio(prog(t, T_ROUTE, T_ZOOM + 0.25))
    cam = lerp_cam((-86.6, 28.7, 88), (-88.9, 29.75, 260), p, tilt=22)
    draw_map(c, cam, t, hi={"Mississippi": (C["teal"], 0.5)})
    t_no = wt("new", 16.9, 17.1); t_fm = wt("fort", 19.4, 19.7)
    # planned destination line (dashed, faint) New Orleans -> Fort Myers
    dest = skia.Path(); dest.moveTo(*merc(*PTS["KNEW"])); dest.lineTo(*merc(*PTS["KFMY"]))
    q = eio(prog(t, t_fm - 0.4, t_fm + 1.0))
    if q > 0: route_draw(c, cam, dest, 0, q, "#ffffff", 0.55, 3, dash=[14, 12], glow=False)
    kx, ky = cam.pt(*PTS["KNEW"]); fx, fy = cam.pt(*PTS["KFMY"])
    pin(c, kx, ky, C["teal"], prog(t, t_no - .2, t_no + .1), t)
    if q > 0.6: pin(c, fx, fy, C["orange"], prog(q, .6, 1), t)
    # actual (approximate) track
    tp = eio(prog(t, t_no + 0.3, T_ZOOM + 0.3)) * 0.42
    if tp > 0.005:
        x, y, ang = route_draw(c, cam, TRACK_PATH, 0, tp, C["orange"], 1, 5)
        plane_icon(c, x, y, ang, 56, glow=C["orange"])
    a = prog(t, t_no - .1, t_no + .3)
    text(c, "NEW ORLEANS", kx - 20, ky + 60, 30, C["white"], a, "Inter-Black", align="c", track=0.14)
    text(c, "LAKEFRONT AIRPORT", kx - 20, ky + 96, 22, C["teal"], a, "Inter-Bold", align="c", track=0.14)
    if q > 0.6:
        text(c, "FORT MYERS, FL", min(fx, W - 80), fy - 34, 28, C["white"], prog(q, .6, 1), "Inter-Black", align="r", track=0.12)
    headline(c, ["DEPARTS", "NEW ORLEANS"], 420, 104, t=t, t0=T_ROUTE + 0.1)
    pill(c, "DESTINATION: FORT MYERS, FLORIDA", 64, 640, 26, C["ink"], C["orange"], prog(t, t_fm - 0.2, t_fm + 0.2))
    text(c, "FLIGHT TRACK SHOWN IS APPROXIMATE", W - 64, 1540, 20, C["grey"], 0.8, "Inter-SemiBold", align="r", track=0.1)
    chrome(c, t, src="WINK News, Fox News")

def shot_zoom(c, t):
    p = eexpo(prog(t, T_ZOOM, T_ZOOM + 2.2))
    cam = lerp_cam((-88.9, 29.75, 260), (-88.70, 30.21, 2300), p, tilt=26)
    t_wrong = wt("terribly", 24.5, 24.9)
    draw_map(c, cam, t, hi={"Mississippi": (C["teal"], 0.5 * (1 - p) + 0.15)})
    la = prog(t, T_ZOOM + 1.2, T_ZOOM + 1.8)
    map_label(c, cam, *PTS["PASC"], "PASCAGOULA", 30, C["white"], la, "Inter-Black", 0.14, dy=-20)
    map_label(c, cam, *PTS["BILOXI"], "BILOXI", 26, C["grey"], la, "Inter-Bold", 0.14, dy=-20)
    map_label(c, cam, -88.80, 30.315, "MISSISSIPPI SOUND", 24, "#9fc3dd", la * 0.9, "Inter-SemiBold", 0.3)
    hx, hy = cam.pt(*PTS["HORN"])
    ha = prog(t, wt("horn", 22.7, 23.0) - 0.3, wt("horn", 22.7, 23.0) + 0.1)
    if ha > 0:
        c.drawOval(skia.Rect.MakeXYWH(hx - 230, hy - 50, 460, 100), P(C["teal"], 0.9 * ha, stroke=3, effect=skia.DashPathEffect.Make([10, 8], t * 30)))
        text(c, "HORN ISLAND", hx, hy + 110, 40, C["teal"], ha, "Inter-Black", "c", track=0.16, glow=C["teal"])
        text(c, "GULF ISLANDS NATIONAL SEASHORE", hx, hy + 150, 20, C["grey"], ha, "Inter-SemiBold", "c", track=0.12)
    tp = lerp(0.42, 1.0, eio(prog(t, T_ZOOM, t_wrong + 0.2)))
    x, y, ang = route_draw(c, cam, TRACK_PATH, 0, tp, C["orange"], 1, 6)
    danger = prog(t, t_wrong - 0.2, t_wrong + 0.1)
    blink = 0.5 + 0.5 * math.sin(t * 22) if danger > 0 else 0
    plane_icon(c, x, y, ang, 64, C["white"] if danger < .5 else C["red"], 1, glow=C["red"] if danger > 0 else C["orange"])
    if danger > 0:
        c.drawCircle(x, y, 60 + 30 * blink, P(C["red"], 0.7 * danger, stroke=4))
    headline(c, ["OVER THE", "MISSISSIPPI SOUND"], 420, 96, t=t, t0=T_ZOOM + 0.05)
    text(c, "SOMETHING WENT WRONG", 64, 625, 44, C["red"], danger, "InterDisplay-Black", track=0.04, glow=C["red"])
    chrome(c, t, src="U.S. Coast Guard via WLOX")

def shot_vsi(c, t):
    lt = t - T_VSI
    draw_water(c, t)
    t_10 = wt("10", 29.5, 29.8)
    cx, cy, R = W / 2, 960, 320
    # gauge
    c.drawCircle(cx, cy, R + 30, P("#0a141c")); c.drawCircle(cx, cy, R + 30, P("#3d5466", 1, stroke=3))
    a0, a1 = math.radians(150), math.radians(390)
    def ang(v): return a0 + (a1 - a0) * v / 12000
    # normal band 0..1000
    rect = skia.Rect.MakeXYWH(cx - R + 26, cy - R + 26, 2 * R - 52, 2 * R - 52)
    c.drawArc(rect, math.degrees(ang(0)), math.degrees(ang(1000) - ang(0)), False, P(C["teal"], 0.9, stroke=22))
    c.drawArc(rect, math.degrees(ang(8000)), math.degrees(ang(12000) - ang(8000)), False, P(C["red"], 0.85, stroke=22))
    for v in range(0, 12001, 500):
        a = ang(v); big = v % 2000 == 0
        r0 = R - (62 if big else 46)
        c.drawLine(cx + r0 * math.cos(a), cy + r0 * math.sin(a), cx + (R - 12) * math.cos(a), cy + (R - 12) * math.sin(a), P("#d6e2ea", 0.9, stroke=5 if big else 2.5))
        if big:
            text(c, str(v // 1000), cx + (R - 112) * math.cos(a), cy + (R - 112) * math.sin(a) + 16, 44, C["white"], 0.9, "Inter-Bold", "c", shadow=False)
    text(c, "DESCENT RATE", cx, cy - 120, 26, C["grey"], 1, "Inter-Bold", "c", track=0.2, shadow=False)
    text(c, "× 1,000 FT/MIN", cx, cy - 82, 22, C["grey"], 0.8, "Inter-SemiBold", "c", track=0.12, shadow=False)
    q = eout(prog(t, T_VSI + 0.8, t_10 + 0.6))
    shake = math.sin(t * 40) * 0.012 * prog(t, t_10 + 0.5, t_10 + 0.8)
    val = 10000 * q
    a = ang(val) + shake
    c.drawLine(cx, cy, cx + (R - 40) * math.cos(a), cy + (R - 40) * math.sin(a), P(C["red"], 0.5, stroke=16, blur=8))
    c.drawLine(cx - 50 * math.cos(a), cy - 50 * math.sin(a), cx + (R - 40) * math.cos(a), cy + (R - 40) * math.sin(a), P(C["red"], 1, stroke=9))
    c.drawCircle(cx, cy, 30, P("#cfd8e0")); c.drawCircle(cx, cy, 12, P("#1b252e"))
    text(c, f"{int(round(val / 10) * 10):,}", cx, cy + R + 175, 130, C["white"], prog(t, T_VSI + 0.6, T_VSI + 0.9), "InterDisplay-Black", "c", track=-0.01)
    text(c, "FEET PER MINUTE", cx, cy + R + 230, 30, C["red"], prog(t, T_VSI + 0.6, T_VSI + 0.9), "Inter-Black", "c", track=0.24)
    headline(c, ["THE FAA:", "A DIVE"], 400, 110, t=t, t0=T_VSI + 0.05, accent={1})
    chrome(c, t, src="FAA via FLYING Magazine, Simple Flying")

def shot_compare(c, t):
    draw_water(c, t)
    lt = t - T_CMP
    headline(c, ["FAR FASTER", "THAN NORMAL"], 420, 110, t=t, t0=T_CMP + 0.05, accent={0})
    x0, maxw = 64, W - 128
    rows = (("TYPICAL LIGHT-PLANE DESCENT", "≈ 500 FT/MIN", 500, C["teal"]),
            ("THIS FLIGHT (FAA)", "≈ 10,000 FT/MIN", 10000, C["red"]))
    for i, (lab, val, v, col) in enumerate(rows):
        y = 800 + i * 260
        q = eexpo(prog(t, T_CMP + 0.4 + i * 0.5, T_CMP + 1.4 + i * 0.5))
        text(c, lab, x0, y, 30, C["grey"], prog(q, 0, .3), "Inter-Bold", track=0.14)
        rrect(c, x0, y + 30, maxw, 64, 10, P("#ffffff", 0.06))
        rrect(c, x0, y + 30, max(18, maxw * v / 10000 * q), 64, 10, P(col, 0.95))
        text(c, val, x0, y + 160, 56, C["white"], prog(q, .5, 1), "InterDisplay-Black")
    k = prog(t, T_CMP + 1.9, T_CMP + 2.3)
    text(c, "≈20×", W - 64, 1420, 170, C["red"], k, "InterDisplay-Black", "r", glow=C["red"])
    text(c, "ABOUT 167 FEET EVERY SECOND", W - 64, 1480, 26, C["white"], k, "Inter-Bold", "r", track=0.12)
    text(c, "TYPICAL VALUE FOR COMPARISON ONLY", 64, 1540, 20, C["grey"], 0.8, "Inter-SemiBold", track=0.1)
    chrome(c, t, src="FAA via FLYING Magazine, Simple Flying")

def shot_time(c, t):
    draw_water(c, t)
    lt = t - T_TIME
    cx, cy = W / 2, 900
    # clock
    c.drawCircle(cx, cy, 230, P("#0a141c")); c.drawCircle(cx, cy, 230, P("#d6e2ea", 0.9, stroke=6))
    for i in range(12):
        a = i / 12 * 6.283
        c.drawLine(cx + 190 * math.sin(a), cy - 190 * math.cos(a), cx + 214 * math.sin(a), cy - 214 * math.cos(a), P("#d6e2ea", 0.9, stroke=6))
    spin = eout(prog(t, T_TIME, T_TIME + 1.2))
    mins = lerp(3 * 60, 3 * 60 + 45, spin) + 0  # 3:00 -> 3:45
    ha = (mins / 60) / 12 * 6.283; ma = (mins % 60) / 60 * 6.283
    c.drawLine(cx, cy, cx + 120 * math.sin(ha), cy - 120 * math.cos(ha), P(C["white"], 1, stroke=14))
    c.drawLine(cx, cy, cx + 175 * math.sin(ma), cy - 175 * math.cos(ma), P(C["red"], 1, stroke=8))
    c.drawCircle(cx, cy, 14, P(C["red"]))
    s = "3:45 PM"
    text(c, s, cx, 1330, 190, C["white"], 1, "InterDisplay-Black", "c", reveal=prog(t, T_TIME + 0.1, T_TIME + 0.7), track=-0.02)
    text(c, "APPROX. · LOCAL TIME", cx, 1395, 26, C["grey"], prog(t, T_TIME + .6, T_TIME + 1), "Inter-Bold", "c", track=0.2)
    text(c, "MOBILE AIR TRAFFIC CONTROL", 64, 420, 44, C["white"], prog(t, T_TIME + 0.2, T_TIME + 0.6), "InterDisplay-Black", track=0.02)
    text(c, "ALERTS THE U.S. COAST GUARD", 64, 480, 44, C["teal"], prog(t, T_TIME + 0.4, T_TIME + 0.8), "InterDisplay-Black", track=0.02)
    chrome(c, t, src="U.S. Coast Guard via Mississippi Free Press, Fox News")

def shot_radar(c, t):
    draw_water(c, t)
    cx, cy, R = W / 2, 920, 440
    cam = Cam(-88.62, 30.30, 1350, tilt=0)
    c.save(); c.clipPath(skia.Path.Circle(cx, cy, R), doAntiAlias=True)
    c.translate(0, cy - H / 2)
    draw_map(c, cam, t, grat=False, lines=False, coast_glow=0.4, scrim=False)
    c.restore()
    c.drawCircle(cx, cy, R, P(C["teal"], 0.12))
    for k in (0.33, 0.66, 1.0): c.drawCircle(cx, cy, R * k, P(C["teal"], 0.5, stroke=2))
    c.drawLine(cx - R, cy, cx + R, cy, P(C["teal"], 0.3, stroke=1.5)); c.drawLine(cx, cy - R, cx, cy + R, P(C["teal"], 0.3, stroke=1.5))
    sweep_a = (t - T_RADAR) * 2.4
    c.save(); c.translate(cx, cy); c.rotate(math.degrees(sweep_a))
    sh = skia.GradientShader.MakeSweep(0, 0, [hexc(C["teal"], 0), hexc(C["teal"], 0), hexc(C["teal"], 0.55)], [0, 0.78, 1])
    c.clipPath(skia.Path.Circle(0, 0, R), doAntiAlias=True); c.drawPaint(P("#000000", shader=sh)); c.restore()
    c.drawLine(cx, cy, cx + R * math.cos(sweep_a), cy + R * math.sin(sweep_a), P(C["teal"], 0.9, stroke=3))
    # blip near crash area (in radar frame)
    bx, by = cam.pt(*PTS["CRASH"]); by += cy - H / 2
    t_lost = wt("contact", 38.8, 39.14)
    lost = prog(t, t_lost - 0.05, t_lost + 0.25)
    if lost < 1:
        ba = 0.4 + 0.6 * abs(math.sin(t * 4))
        c.drawCircle(bx, by, 16, P(C["orange"], ba * (1 - lost), blur=6)); c.drawCircle(bx, by, 9, P(C["orange"], (1 - lost)))
        text(c, "C210 · 6 POB", bx + 24, by - 18, 22, C["orange"], 1 - lost, "Inter-Bold", track=0.1, shadow=False)
    if lost > 0:
        for dx, dy in ((-22, -22), (22, -22)):
            c.drawLine(bx + dx, by + dy, bx - dx, by - dy, P(C["red"], lost, stroke=6))
    headline(c, ["CONTROLLERS", "IN MOBILE"], 380, 100, t=t, t0=T_RADAR + 0.05)
    g = prog(t, t_lost - 0.05, t_lost + 0.1)
    if g > 0:
        jit = (math.sin(t * 90) * 10) if (t - t_lost) < 0.35 else 0
        rrect(c, 64 + jit, 1420, W - 128, 120, 12, P(C["red"], 0.95 * g))
        text(c, "CONTACT LOST", W / 2 + jit, 1505, 86, "#ffffff", g, "InterDisplay-Black", "c", track=0.04, shadow=False)
    chrome(c, t, src="U.S. Coast Guard via Mississippi Free Press")

def lifejacket(c, x, y, s, a):
    c.save(); c.translate(x, y); c.scale(s, s)
    p = skia.Path()
    p.moveTo(-40, -50); p.lineTo(-14, -50); p.cubicTo(-10, -26, 10, -26, 14, -50); p.lineTo(40, -50)
    p.lineTo(46, 40); p.cubicTo(30, 52, -30, 52, -46, 40); p.close()
    c.drawPath(p, P(C["orange"], a)); c.drawPath(p, P("#7a2e00", a * 0.6, stroke=3))
    c.drawLine(-44, 5, 44, 5, P("#e8e8e8", a * 0.9, stroke=7)); c.drawLine(0, -28, 0, 46, P("#7a2e00", a * .5, stroke=3))
    c.restore()

def raft(c, x, y, s, a):
    c.save(); c.translate(x, y); c.scale(s, s)
    c.drawOval(skia.Rect.MakeXYWH(-80, -52, 160, 104), P(C["orange"], a))
    c.drawOval(skia.Rect.MakeXYWH(-58, -32, 116, 64), P("#3a1a08", a))
    c.drawOval(skia.Rect.MakeXYWH(-80, -52, 160, 104), P("#7a2e00", a * .6, stroke=3))
    c.drawArc(skia.Rect.MakeXYWH(-70, -70, 140, 80), 200, 140, False, P("#ffd8b8", a * 0.8, stroke=5))
    c.restore()

def cabin(c, x, y, s, a):
    c.save(); c.translate(x, y); c.scale(s, s); c.rotate(-14)
    rrect(c, -95, -38, 190, 76, 18, P("#c9d2da", a))
    for i in range(3): rrect(c, -70 + i * 50, -20, 38, 26, 6, P("#24323f", a))
    c.drawLine(-95, 22, 95, 22, P(C["red"], a, stroke=6))
    c.restore()

def shot_debris(c, t):
    lt = t - T_DEBRIS
    # top-down water close-up: animated wave noise via moving bands
    c.drawPaint(P("#0b2230"))
    for i in range(40):
        yy = (i * 53 + lt * 18) % (H + 100) - 50
        w = 0.5 + 0.5 * math.sin(i * 1.7 + lt * 0.8)
        c.drawLine(0, yy + 20 * math.sin(lt + i), W, yy - 20 * math.sin(lt * 0.7 + i), P("#5fa3c2", 0.05 + 0.04 * w, stroke=3 + 4 * w, blur=3))
    items = ((wt("three", 41.2, 41.4) - 0.1, "3 LIFE JACKETS", 330, 870, lambda x, y, a: [lifejacket(c, x + dx, y + dy, 1.05, a) for dx, dy in ((-110, 0), (0, -40), (110, 10))]),
             (wt("raft", 43.0, 43.22) - 0.15, "LIFE RAFT", 760, 1080, lambda x, y, a: raft(c, x, y, 1.2, a)),
             (wt("cabin", 44.0, 44.3) - 0.15, "PLANE'S CABIN", 420, 1300, lambda x, y, a: cabin(c, x, y, 1.15, a)))
    for t0, lab, x, y, fn in items:
        q = prog(t, t0, t0 + 0.4)
        if q <= 0: continue
        bob = math.sin((t - t0) * 2.0 + x) * 6
        for k in range(2):
            ph = ((t - t0) * 0.5 + k * 0.5) % 1
            c.drawOval(skia.Rect.MakeXYWH(x - 120 - ph * 120, y - 60 - ph * 50 + bob, 240 + ph * 240, 120 + ph * 100), P("#bfe6f5", (1 - ph) * 0.35 * q, stroke=3))
        fn(x, y + bob - (1 - eback(q)) * 40, q)
        pill(c, lab, x, y + 140, 26, C["ink"], C["white"], prog(q, .5, 1), "c")
    headline(c, ["FOUND ON", "THE WATER"], 400, 110, t=t, t0=T_DEBRIS + 0.05)
    text(c, "BETWEEN PASCAGOULA AND HORN ISLAND", 64, 580, 28, C["teal"], prog(t, T_DEBRIS + .4, T_DEBRIS + .8), "Inter-Bold", track=0.1)
    text(c, "GRAPHIC RECONSTRUCTION", W - 64, 1540, 20, C["grey"], 0.8, "Inter-SemiBold", align="r", track=0.1)
    chrome(c, t, src="U.S. Coast Guard via Mississippi Free Press, FLYING")

def shot_divers(c, t):
    lt = t - T_DIVE
    c.drawPaint(P("#000000", shader=skia.GradientShader.MakeLinear([(0, 0), (0, H)], [hexc("#0f4b5c"), hexc("#062330"), hexc("#01080c")], [0, .45, 1])))
    # light rays
    for i in range(7):
        x = 80 + i * 160 + 50 * math.sin(lt * 0.4 + i)
        p = skia.Path(); p.moveTo(x - 30, -10); p.lineTo(x + 30, -10); p.lineTo(x + 180, H * 0.8); p.lineTo(x + 40, H * 0.8); p.close()
        c.drawPath(p, P("#9fe3ff", 0.05 + 0.03 * math.sin(lt * 1.3 + i * 2), blur=18))
    # particles
    rng = np.random.default_rng(3)
    for i in range(70):
        px, py, sp = rng.random() * W, rng.random() * H, 20 + rng.random() * 50
        y = (py - lt * sp) % H
        c.drawCircle(px + 8 * math.sin(lt + i), y, 1.5 + rng.random() * 2.5, P("#cfefff", 0.25))
    # seabed + fuselage silhouette (illustrative)
    bed = skia.Path(); bed.moveTo(0, 1500); bed.cubicTo(300, 1450, 700, 1530, W, 1470); bed.lineTo(W, H); bed.lineTo(0, H); bed.close()
    c.drawPath(bed, P("#03090c"))
    c.save(); c.translate(W / 2 - 300, 1440); c.rotate(-8); c.scale(0.62, 0.62)
    sil = skia.Path(); sil.moveTo(0, 60); sil.cubicTo(60, 0, 300, 0, 700, 30); sil.lineTo(860, 10); sil.lineTo(870, 70); sil.cubicTo(500, 120, 100, 130, 0, 60); sil.close()
    c.drawPath(sil, P("#0b1a22", 0.95)); c.restore()
    # 4-hour counter
    q = eout(prog(t, T_DIVE + 0.1, wt("later", 47.0, 47.22) + 0.3))
    mins = int(240 * q)
    text(c, f"{mins // 60}:{mins % 60:02d}", 64, 560, 200, C["white"], 1, "InterDisplay-Black", track=-0.02)
    text(c, "HOURS OF SEARCHING (APPROX.)", 64, 620, 28, C["teal"], prog(t, T_DIVE + .3, T_DIVE + .7), "Inter-Bold", track=0.14)
    t_div = wt("state", 47.8, 48.0)
    text(c, "MISSISSIPPI DEPT. OF", 64, 760, 40, C["white"], prog(t, t_div - .1, t_div + .3), "InterDisplay-Black")
    text(c, "MARINE RESOURCES DIVERS", 64, 810, 40, C["white"], prog(t, t_div, t_div + .4), "InterDisplay-Black")
    t_all = wt("all", 48.8, 48.92)
    k = prog(t, t_all - 0.1, t_all + 0.3)
    if k > 0:
        text(c, "ALL 6 ABOARD", 64, 1030, 104, C["white"], k, "InterDisplay-Black")
        text(c, "FOUND INSIDE THE FUSELAGE", 64, 1090, 32, C["grey"], k, "Inter-Bold", track=0.12)
    t_ch = wt("among", 51.0, 51.2)
    k2 = prog(t, t_ch - 0.1, t_ch + 0.4)
    for i in range(6):
        x = 64 + 40 + i * 100
        c.drawCircle(x, 1220, 26, P("#ffffff", 0.85 * prog(k2, i * 0.1, i * 0.1 + 0.4)))
    text(c, "INCLUDING CHILDREN", 64, 1330, 44, C["red"], prog(t, wt("children", 51.6, 51.8) - .1, wt("children", 51.6, 51.8) + .25), "InterDisplay-Black", track=0.04)
    chrome(c, t, src="U.S. Coast Guard via WLOX, Breitbart, FLYING")

def clipping_card(c, cx, cy, rot, outlet, date, head, hl_words, hl_p, a=1.0, url=""):
    c.save(); c.translate(cx, cy); c.rotate(rot)
    w, h = 900, 620
    rrect(c, -w / 2 + 10, -h / 2 + 24, w, h, 10, P("#000000", 0.55 * a, blur=30))
    rrect(c, -w / 2, -h / 2, w, h, 10, P(C["paper"], a))
    x0, y = -w / 2 + 50, -h / 2 + 80
    text(c, outlet, x0, y, 34, C["ink"], a, "Inter-Black", track=0.06, shadow=False)
    text(c, date, w / 2 - 50, y, 22, "#6b6f73", a, "Inter-SemiBold", "r", shadow=False)
    c.drawLine(x0, y + 26, w / 2 - 50, y + 26, P("#c9c3b5", a, stroke=2))
    size = 54; lines = wrap(head, size, w - 100, SERIF); y += 110
    f = skia.Font(TF(SERIF), size)
    # highlight: marker behind matching words, drawn on progressively in reading order
    total = 0; spans = []
    for i, ln in enumerate(lines):
        x = x0
        for wd in ln.split(" "):
            ww = f.measureText(wd)
            if wd.strip("'\".,:").lower() in hl_words: spans.append((x, y + i * size * 1.18, ww)); total += ww
            x += ww + f.measureText(" ")
    rem = total * clamp(hl_p)
    for (sx, sy, sw) in spans:
        d = min(sw + 8, rem)
        if d > 0: c.drawRect(skia.Rect.MakeXYWH(sx - 4, sy - size * 0.78, d, size * 0.98), P(C["yellow"], 0.85 * a)); rem -= d
    for i, ln in enumerate(lines):
        text(c, ln, x0, y + i * size * 1.18, size, C["ink"], a, SERIF, shadow=False)
    yb = y + len(lines) * size * 1.18 + 20
    for j in range(4):
        rrect(c, x0, yb + j * 34, (w - 100) * (0.95 if j < 3 else 0.6), 12, 6, P("#cfc9bc", a))
    text(c, "RECREATED HEADLINE · " + url, x0, h / 2 - 30, 18, "#7d7a73", a, "Inter-SemiBold", track=0.08, shadow=False)
    c.restore()

def shot_clip(c, t):
    draw_water(c, t)
    p = eexpo(prog(t, T_CLIP, T_CLIP + 0.7))
    t_hb = wt("heartbreaking", 53.6, 53.92)
    clipping_card(c, W / 2, lerp(1300, 960, p), lerp(-8, -2.5, p) + 0.4 * math.sin(t * 0.7), "WLOX", "NOV. 25, 2026",
                  "'Heartbreaking outcome': 6 killed in plane crash near Horn Island, Coast Guard says",
                  {"heartbreaking", "outcome"}, prog(t, t_hb - 0.15, t_hb + 0.6), a=p, url="WLOX.COM")
    headline(c, ["THE COAST", "GUARD"], 380, 100, t=t, t0=T_CLIP + 0.05)
    chrome(c, t, src="wlox.com")

def shot_ntsb(c, t):
    draw_water(c, t)
    lt = t - T_NTSB
    clipping_card(c, W / 2 + 20, 1280, 4 + 0.3 * math.sin(t * .6), "FLYING", "NOV. 2026",
                  "6 Killed, Including 2 Children, in Cessna 210 Crash Off Mississippi Coast", set(), 0,
                  a=0.55 * prog(t, T_NTSB + 0.3, T_NTSB + 0.8), url="FLYINGMAG.COM")
    t_n = wt("ntsb", 55.3, 55.58)
    text(c, "NTSB", 64, 600, 250, C["white"], prog(t, t_n - .15, t_n + .1), "InterDisplay-Black", track=-0.02, glow=None)
    text(c, "NOW LEADS THE INVESTIGATION", 64, 670, 36, C["teal"], prog(t, t_n + .1, t_n + .5), "Inter-Black", track=0.08)
    rows = (("ASSISTED BY", "FAA"), ("CAUSE", "NOT YET DETERMINED"), ("PRELIMINARY REPORT", "PENDING"))
    for i, (k, v) in enumerate(rows):
        q = prog(t, wt("leading", 57.5, 57.86) - 0.3 + i * 0.3, wt("leading", 57.5, 57.86) + i * 0.3)
        y = 790 + i * 70
        text(c, k, 64, y, 26, C["grey"], q, "Inter-Bold", track=0.16)
        text(c, v, 470, y, 30, C["white"] if i else C["teal"], q, "Inter-Black", track=0.06)
    chrome(c, t, src="Fox News, WINK News, FLYING")

def shot_end(c, t):
    lt = t - T_END
    cam = lerp_cam((-88.66, 30.26, 2600), (-88.63, 30.262, 3400), eio(prog(t, T_END, DUR)), tilt=30)
    draw_map(c, cam, t, coast_glow=0.6)
    x, y = cam.pt(*PTS["CRASH"])
    pin(c, x, y, C["red"], 1, t, r=12)
    text(c, "APPROX. CRASH AREA", x, y + 70, 24, C["red"], prog(t, T_END + .3, T_END + .7), "Inter-Black", "c", track=0.14)
    map_label(c, cam, *PTS["HORN"], "HORN ISLAND", 30, C["teal"], 0.9, "Inter-Black", 0.16, dy=70)
    t_w = wt("what", 61.8, 62.08)
    c.drawPaint(P("#000000", 0.35 * prog(t, t_w - .4, t_w)))
    headline(c, ["WHAT MADE", "IT FALL", "SO FAST?"], 520, 128, t=t, t0=t_w - 0.1, accent={2}, stagger=0.28)
    k = prog(t, DUR - 1.6, DUR - 1.1)
    text(c, "INVESTIGATION ONGOING · FACTS AS OF 26 NOV 2026", 64, 1010, 24, C["grey"], k, "Inter-Bold", track=0.08)
    text(c, "SOURCES: WLOX · FLYING · CBS · WINK · MS FREE PRESS · FOX", 64, 1050, 22, C["grey"], k, "Inter-SemiBold", track=0.06)
    chrome(c, t)
    c.drawPaint(P("#000000", prog(t, DUR - 0.45, DUR)))

SHOTS = [(0.0, shot_hook_a), (T_C1, shot_hook_b), (T_AIR, shot_aircraft), (T_FAM, shot_family), (T_ROUTE, shot_route),
         (T_ZOOM, shot_zoom), (T_VSI, shot_vsi), (T_CMP, shot_compare), (T_TIME, shot_time), (T_RADAR, shot_radar),
         (T_DEBRIS, shot_debris), (T_DIVE, shot_divers), (T_CLIP, shot_clip), (T_NTSB, shot_ntsb), (T_END, shot_end)]
# continuous map moves (no zoom-through): hook_a->hook_b, route->zoom
SOFT = {T_C1, T_ZOOM}
TR = 0.24

def frame(c, t):
    starts = [s for s, _ in SHOTS]
    idx = max(i for i, s in enumerate(starts) if s <= t + 1e-9)
    nxt = starts[idx + 1] if idx + 1 < len(starts) else None
    if nxt is not None and t > nxt - TR / 2 and nxt not in SOFT:
        p = eio(prog(t, nxt - TR / 2, nxt + TR / 2))
        _layer(c, SHOTS[idx][1], t, 1 - p, 1 + 0.10 * p)
        _layer(c, SHOTS[idx + 1][1], t, p, 1.14 - 0.14 * p)
        return
    cut = starts[idx]
    if idx > 0 and t < cut + TR / 2 and cut not in SOFT:
        p = eio(prog(t, cut - TR / 2, cut + TR / 2))
        _layer(c, SHOTS[idx - 1][1], t, 1 - p, 1 + 0.10 * p)
        _layer(c, SHOTS[idx][1], t, p, 1.14 - 0.14 * p)
        return
    SHOTS[idx][1](c, t)

def _layer(c, fn, t, alpha, scale):
    if alpha <= 0.002: return
    c.saveLayerAlpha(None, int(255 * clamp(alpha)))
    c.translate(W / 2, H / 2); c.scale(scale, scale); c.translate(-W / 2, -H / 2)
    fn(c, t); c.restore()


def cover(c):
    """Reel cover / thumbnail: key text kept inside the centre 1080x1440 (profile-grid crop)."""
    t = 3.0
    cam = Cam(-88.66, 30.262, 2600, tilt=26, yoff=330)
    draw_map(c, cam, t, coast_glow=0.8, scrim=False)
    x, y = cam.pt(*PTS["CRASH"])
    for i in range(3): c.drawCircle(x, y, 40 + i * 70, P(C["red"], 0.8 - i * 0.25, stroke=5 - i))
    pin(c, x, y, C["red"], 1, 0.15, r=14, pulse=False)
    hx, hy = cam.pt(*PTS["HORN"])
    text(c, "HORN ISLAND", hx, hy + 80, 34, C["teal"], 1, "Inter-Black", "c", track=0.16)
    text(c, "APPROX. CRASH AREA", x, y - 110, 26, C["red"], 1, "Inter-Black", "c", track=0.14)
    c.drawRect(skia.Rect.MakeWH(W, 1000), P("#000000", shader=skia.GradientShader.MakeLinear(
        [(0, 0), (0, 1000)], [hexc("#03070b", 0.95), hexc("#03070b", 0.7), hexc("#03070b", 0)], [0, .6, 1])))
    pill(c, "MISSISSIPPI COAST · 24 NOV 2026", 64, 330, 26, "#ffffff", C["red"], 1)
    for i, (ln, col) in enumerate((("PLANE", C["white"]), ("PLUNGES", C["white"]), ("INTO THE GULF", C["red"]))):
        text(c, ln, 64, 500 + i * 150, 156 if i < 2 else 118, col, 1, "InterDisplay-Black", track=-0.015,
             glow=C["red"] if i == 2 else None)
    rrect(c, 64, 840, 610, 76, 10, P("#ffffff", 0.95))
    text(c, "6 DEAD · 10,000 FT/MIN DIVE", 88, 892, 34, C["ink"], 1, "Inter-Black", track=0.02, shadow=False)
    plane_icon(c, x + 250, y - 330, math.radians(125), 120, C["white"], 1, glow=C["red"])
    c.drawLine(x + 420, y - 570, x + 270, y - 360, P(C["red"], 0.6, stroke=5, blur=3))
    c.drawPaint(P("#000000", shader=skia.GradientShader.MakeRadial((W / 2, H * 0.5), H * 0.62,
        [hexc("#000000", 0), hexc("#000000", 0), hexc("#000000", 0.6)], [0, 0.55, 1])))

def cues():
    out = [dict(t=s, kind="whoosh") for s, _ in SHOTS[1:] if s not in SOFT]
    out += [dict(t=T_C1, kind="whoosh_long")]
    out += [dict(t=0.45 + i * 0.07, kind="tick") for i in range(11)] + [dict(t=1.2 + i * 0.08, kind="tick") for i in range(4)]
    out += [dict(t=wt("gulf", 5.5, 6.2), kind="impact")]
    out += [dict(t=T_TIME + 0.1 + i * 0.09, kind="tick") for i in range(7)]
    out += [dict(t=T_RADAR + 0.2 + k * 2.618, kind="ping") for k in range(2)]
    out += [dict(t=wt("contact", 38.8, 39.14) - 0.02, kind="glitch")]
    out += [dict(t=wt("three", 41.2, 41.4) - 0.1, kind="pop"), dict(t=wt("raft", 43.0, 43.22) - 0.15, kind="pop"),
            dict(t=wt("cabin", 44.0, 44.3) - 0.15, kind="pop")]
    out += [dict(t=T_DIVE, kind="underwater")]
    out += [dict(t=wt("ntsb", 55.3, 55.58) - 0.15, kind="hit"), dict(t=wt("what", 61.8, 62.08) - 0.1, kind="boom")]
    out += [dict(t=wt("terribly", 24.5, 24.9) - 0.2, kind="alarm")]
    return sorted(out, key=lambda d: d["t"])

def render_range(f0, f1, out):
    buf = np.zeros((H, W, 4), np.uint8)
    surf = skia.Surface(buf); c = surf.getCanvas()
    ff = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}",
                           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "16",
                           "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
    for f in range(f0, f1):
        c.clear(skia.ColorBLACK); frame(c, f / FPS); surf.flushAndSubmit()
        ff.stdin.write(buf.tobytes())
    ff.stdin.close(); ff.wait()

if __name__ == "__main__":
    mode = sys.argv[1]
    if mode == "frame":
        buf = np.zeros((H, W, 4), np.uint8); surf = skia.Surface(buf); c = surf.getCanvas()
        c.clear(skia.ColorBLACK); frame(c, float(sys.argv[2])); surf.flushAndSubmit()
        surf.makeImageSnapshot().save(sys.argv[3], skia.kPNG)
    elif mode == "range":
        render_range(int(sys.argv[2]), int(sys.argv[3]), sys.argv[4])
    elif mode == "cover":
        buf = np.zeros((H, W, 4), np.uint8); surf = skia.Surface(buf); c = surf.getCanvas()
        c.clear(skia.ColorBLACK); cover(c); surf.flushAndSubmit()
        surf.makeImageSnapshot().save(sys.argv[2], skia.kPNG)
    elif mode == "cues":
        json.dump(dict(duration=DUR, cues=cues()), open(sys.argv[2], "w"), indent=1)
    elif mode == "nframes":
        print(int(math.ceil(DUR * FPS)))
