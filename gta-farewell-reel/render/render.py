"""GTA V Farewell x GTA VI Welcome — 60 s vertical reel, rendered from the supplied photos.

usage: python3 render.py stills 3 9 15 ...   -> stills/t_XX.jpg contact frames
       python3 render.py render               -> out/reel.mp4 (no audio)
"""
import math, os, sys, random, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS, DUR = 1080, 1920, 24, 60.0
FONT = "/usr/share/fonts/opentype/inter/InterDisplay-BlackItalic.otf"
FONT2 = "/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf"

# face centre (x frac, y frac) and face width as a fraction of image height
FACE = {
    "me": (0.540, 0.260, 0.330), "michael": (0.439, 0.332, 0.364),
    "trevor": (0.531, 0.297, 0.407), "franklin": (0.603, 0.111, 0.163),
    "jason": (0.527, 0.519, 0.648), "lucia": (0.600, 0.230, 0.120),
}
SRC = {"me": "clean/me.png", "michael": "clean/michael.png", "trevor": "clean/trevor.png",
       "franklin": "clean/franklin_hd.png", "jason": "clean/jason_hd.png", "lucia": "clean/lucia_hd.png",
       "redcar": "clean/redcar_hd.png", "blackcar": "clean/blackcar_hd.png"}


# ---------------------------------------------------------------- helpers
def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def lerp(a, b, u): return a + (b - a) * u
def smooth(u): u = clamp(u); return u * u * (3 - 2 * u)
def ease_out(u): u = clamp(u); return 1 - (1 - u) ** 3
def ease_io(u): u = clamp(u); return 4 * u ** 3 if u < .5 else 1 - (-2 * u + 2) ** 3 / 2
def seg(t, a, b): return clamp((t - a) / (b - a))


def grade(im, mode):
    """Relight a cutout for the sunset: 'warm' = sun in front, 'back' = sun behind (rim light)."""
    a = np.asarray(im, np.float32)
    rgb, al = a[..., :3], a[..., 3]
    if mode == "warm":
        rgb = rgb * [1.07, 0.96, 0.83] + [12, 4, -2]
        rgb = (rgb - 128) * 1.05 + 128
        rim_k = 0.45
    else:
        rgb = rgb * [0.80, 0.66, 0.62] + [6, 0, 4]
        rim_k = 1.15
    A = Image.fromarray(al.astype(np.uint8))
    er = np.asarray(A.filter(ImageFilter.MinFilter(13)), np.float32)
    rim = np.asarray(Image.fromarray(np.clip(al - er, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(5)), np.float32) / 255
    yy = np.linspace(1, 0.35, al.shape[0])[:, None]
    rgb = rgb + (rim * yy)[..., None] * np.array([255, 168, 92]) * rim_k
    # soft fade on the bottom edge so a cut-off torso never shows a hard line
    fade = np.ones(al.shape[0], np.float32)
    n = int(al.shape[0] * 0.05)
    fade[-n:] = np.linspace(1, 0, n) ** 0.7
    al = al * fade[:, None]
    m = int(al.shape[1] * 0.06)
    side = np.ones(al.shape[1], np.float32)
    side[:m] = np.linspace(0, 1, m) ** 0.8
    side[-m:] = np.linspace(1, 0, m) ** 0.8
    al = al * side[None, :]
    return Image.fromarray(np.dstack([np.clip(rgb, 0, 255), al]).astype(np.uint8), "RGBA")


def load_assets():
    A = {}
    for k, p in SRC.items():
        im = Image.open(p).convert("RGBA")
        if im.height > 1800:
            im = im.resize((int(im.width * 1800 / im.height), 1800), Image.LANCZOS)
        if k in ("redcar", "blackcar"):
            a = np.asarray(im, np.float32)
            a[..., :3] = a[..., :3] * [1.05, 0.95, 0.86] + [10, 2, 0]
            A[k] = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGBA")
        else:
            A[(k, "warm")] = grade(im, "warm")
            A[(k, "back")] = grade(im, "back")
    for n in ("Ao", "Bo", "Co", "Cv"):
        A[n] = Image.open(f"plates/{n}.png").convert("RGB")
        A[n + "g"] = [Image.open(f"plates/{n}_g{i}.png") for i in range(6)]
    A["case_v"], A["case_vi"] = make_case(A, "V"), make_case(A, "VI")
    A["title1"] = make_title("GOODBYE GTA V", (255, 255, 255), (255, 214, 170))
    A["title2"] = make_title("HELLO GTA VI", (255, 92, 190), (255, 170, 90))
    # grain + vignette
    rnd = np.random.default_rng(7)
    A["grain"] = [rnd.normal(0, 9, (H // 2, W // 2)).astype(np.float32) for _ in range(8)]
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.sqrt(((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - H / 2) / (H * 0.62)) ** 2)
    A["vig"] = np.clip(1 - 0.55 * d ** 2.4, 0.25, 1)[..., None]
    gy, gx = np.mgrid[0:H * 2, 0:W * 2].astype(np.float32)
    g = np.exp(-(((gx - W) ** 2 + (gy - H) ** 2) / (2 * 260.0 ** 2)))
    A["flare"] = g
    return A


def make_case(A, num):
    """Original collector-case artwork (no real logos): character collage + big numeral."""
    cw, ch = 520, 680
    case = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    d = ImageDraw.Draw(case)
    d.rounded_rectangle([0, 0, cw - 1, ch - 1], 22, fill=(18, 52, 150, 255))
    d.rounded_rectangle([0, 0, cw - 1, 78], 22, fill=(10, 30, 96, 255))
    d.rectangle([0, 50, cw - 1, 78], fill=(10, 30, 96, 255))
    f = ImageFont.truetype(FONT2, 30)
    lab = "FAREWELL EDITION" if num == "V" else "NEXT CHAPTER EDITION"
    d.text((cw / 2, 40), lab, font=f, fill=(235, 240, 255, 255), anchor="mm")
    # cover
    cov = Image.new("RGB", (cw - 36, ch - 112))
    pal = [(255, 196, 96), (238, 104, 72), (96, 40, 96)] if num == "V" else [(255, 170, 200), (220, 70, 170), (60, 24, 120)]
    ca = np.zeros((cov.height, cov.width, 3), np.float32)
    ys = np.linspace(0, 1, cov.height)
    for c in range(3):
        ca[..., c] = np.interp(ys, [0, 0.5, 1], [pal[2][c], pal[1][c], pal[0][c]])[:, None]
    cov = Image.fromarray(ca.astype(np.uint8)).convert("RGBA")
    who = ["michael", "franklin", "trevor"] if num == "V" else ["lucia", "jason"]
    n = len(who)
    for i, k in enumerate(who):
        im = A[(k, "warm")]
        fx, fy, fw = FACE[k]
        face = 150 if k != "jason" else 190
        h = face / fw; s = h / im.height
        r = im.resize((max(1, int(im.width * s)), max(1, int(h))), Image.LANCZOS)
        cx = cov.width * (i + 0.5) / n
        cov.paste(r, (int(cx - fx * r.width), int(cov.height * 0.34 - fy * r.height)), r)
    dc = ImageDraw.Draw(cov)
    big = ImageFont.truetype(FONT, 250 if num == "V" else 220)
    x, y = cov.width / 2, cov.height * 0.80
    dc.text((x + 6, y + 8), num, font=big, fill=(0, 0, 0, 160), anchor="mm")
    dc.text((x, y), num, font=big, fill=(255, 255, 255, 255) if num == "V" else (255, 120, 200, 255),
            anchor="mm", stroke_width=6, stroke_fill=(20, 10, 30, 255))
    case.paste(cov, (18, 94))
    # glossy plastic sheen
    sheen = Image.new("L", (cw, ch), 0)
    ImageDraw.Draw(sheen).polygon([(0, 0), (cw * 0.45, 0), (0, ch * 0.42)], fill=46)
    case = Image.composite(Image.new("RGBA", (cw, ch), (255, 255, 255, 255)), case, sheen.filter(ImageFilter.GaussianBlur(20))).copy()
    mask = Image.new("L", (cw, ch), 0); ImageDraw.Draw(mask).rounded_rectangle([0, 0, cw - 1, ch - 1], 22, fill=255)
    case.putalpha(mask)
    return case


def make_title(text, c1, c2):
    f = ImageFont.truetype(FONT, 118)
    tw = int(f.getlength(text)) + 120
    if tw > W - 40:
        f = ImageFont.truetype(FONT, int(118 * (W - 160) / (tw - 120)))
        tw = int(f.getlength(text)) + 120
    th = 260
    mask = Image.new("L", (tw, th), 0)
    ImageDraw.Draw(mask).text((tw / 2, th / 2), text, font=f, anchor="mm", fill=255)
    g = np.zeros((th, tw, 3), np.float32)
    ys = np.linspace(0, 1, th)[:, None]
    for c in range(3):
        g[..., c] = c1[c] + (c2[c] - c1[c]) * ys
    m = np.asarray(mask, np.float32) / 255
    glow = np.asarray(mask.filter(ImageFilter.GaussianBlur(18)), np.float32) / 255
    shadow = np.asarray(mask.filter(ImageFilter.GaussianBlur(6)), np.float32) / 255
    rgb = g * m[..., None] + np.array(c1) * 0.9 * (1 - m[..., None]) * glow[..., None]
    al = np.clip(m + glow * 0.75 + shadow * 0.5, 0, 1)
    rgb = np.where(m[..., None] > 0, rgb, rgb * 0.6)
    return Image.fromarray(np.dstack([np.clip(rgb, 0, 255), al * 255]).astype(np.uint8), "RGBA")


# ---------------------------------------------------------------- drawing primitives
class Frame:
    def __init__(self, A, fi):
        self.A, self.fi = A, fi
        self.im = None

    def bg(self, plate, cx, cy, vw, blur=0, mix=None, glit=0.8):
        PW, PH = self.A[plate].size
        vw = min(vw, PW, PH * W / H)
        vh = vw * H / W
        cx = clamp(cx, vw / 2, PW - vw / 2)
        cy = clamp(cy, vh / 2, PH - vh / 2)
        box = (cx - vw / 2, cy - vh / 2, cx + vw / 2, cy + vh / 2)
        base = self.A[plate].resize((W, H), Image.BILINEAR, box=box)
        arr = np.asarray(base, np.float32)
        gl = self.A[plate + "g"][(self.fi // 3) % 6].resize((W, H), Image.BILINEAR, box=box)
        g = np.asarray(gl, np.float32)[..., None] / 255
        arr = arr + g * np.array([255, 226, 180]) * glit
        if mix is not None:
            p2, u = mix
            b2 = np.asarray(self.A[p2].resize((W, H), Image.BILINEAR, box=box), np.float32)
            g2 = np.asarray(self.A[p2 + "g"][(self.fi // 3) % 6].resize((W, H), Image.BILINEAR, box=box), np.float32)[..., None] / 255
            b2 = b2 + g2 * np.array([255, 200, 230]) * glit
            arr = arr * (1 - u) + b2 * u
        im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
        if blur:
            im = im.filter(ImageFilter.GaussianBlur(blur))
        self.im = im
        self.view = box
        return self

    def to_screen(self, px, py):
        x0, y0, x1, y1 = self.view
        return (px - x0) * W / (x1 - x0), (py - y0) * H / (y1 - y0), W / (x1 - x0)

    def person(self, k, fx, fy, face, mode="warm", alpha=1.0, blur=0, dark=0.0, flip=False):
        im = self.A[(k, mode)]
        nx, ny, nf = FACE[k]
        h = face / nf
        s = h / im.height
        w = im.width * s
        if w < 2 or h < 2:
            return
        r = im.resize((int(w), int(h)), Image.BILINEAR)
        if flip:
            r = r.transpose(Image.FLIP_LEFT_RIGHT); nx = 1 - nx
        self._paste(r, fx - nx * w, fy - ny * h, alpha, blur, dark)

    def car(self, k, cx, bottom, width, alpha=1.0, blur=0, mblur=0, dark=0.0, shadow=True, brake=0.0, glint=None):
        im = self.A[k]
        s = width / im.width
        r = im.resize((max(2, int(width)), max(2, int(im.height * s))), Image.BILINEAR)
        if mblur > 1:
            a = np.asarray(r, np.float32)
            acc = np.zeros_like(a)
            n = 9
            for i in range(n):
                acc += np.roll(a, int((i - n // 2) * mblur / n), axis=1)
            r = Image.fromarray((acc / n).astype(np.uint8), "RGBA")
        if glint is not None:
            a = np.asarray(r, np.float32).copy()
            xs = np.arange(r.width)[None, :] / r.width
            band = np.exp(-((xs - glint) / 0.05) ** 2) * 0.55
            a[..., :3] += band[..., None] * 255 * (a[..., 3:4] / 255)
            r = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGBA")
        x0, y0 = cx - r.width / 2, bottom - r.height
        if shadow:
            sh = Image.new("RGBA", (int(r.width * 1.2), int(r.height * 0.35)), (0, 0, 0, 0))
            ImageDraw.Draw(sh).ellipse([0, 0, sh.width, sh.height], fill=(10, 4, 10, 170))
            sh = sh.filter(ImageFilter.GaussianBlur(max(2, r.height * 0.06)))
            self.im.paste(sh, (int(cx - sh.width / 2), int(bottom - sh.height * 0.6)), sh)
        self._paste(r, x0, y0, alpha, blur, dark)
        if brake > 0:
            for fxr in (0.13, 0.87):
                self.glow(x0 + fxr * r.width, y0 + 0.66 * r.height, r.width * 0.045, (255, 50, 30), brake * 0.7)

    def _paste(self, r, x, y, alpha, blur, dark):
        if blur:
            r = r.filter(ImageFilter.GaussianBlur(blur))
        if dark or alpha < 1:
            a = np.asarray(r, np.float32).copy()
            a[..., :3] *= (1 - dark)
            a[..., 3] *= alpha
            r = Image.fromarray(a.astype(np.uint8), "RGBA")
        self.im.paste(r, (int(round(x)), int(round(y))), r)

    def paste(self, r, cx, cy, scale=1.0, rot=0.0, alpha=1.0):
        if scale != 1:
            r = r.resize((max(2, int(r.width * scale)), max(2, int(r.height * scale))), Image.BILINEAR)
        if rot:
            r = r.rotate(rot, Image.BILINEAR, expand=True)
        self._paste(r, cx - r.width / 2, cy - r.height / 2, alpha, 0, 0)

    def glow(self, x, y, r, col, k):
        a = np.asarray(self.im, np.float32)
        x0, y0 = int(x - r * 3), int(y - r * 3)
        x1, y1 = int(x + r * 3), int(y + r * 3)
        X0, Y0, X1, Y1 = max(0, x0), max(0, y0), min(W, x1), min(H, y1)
        if X1 <= X0 or Y1 <= Y0:
            return
        yy, xx = np.mgrid[Y0:Y1, X0:X1].astype(np.float32)
        g = np.exp(-(((xx - x) ** 2 + (yy - y) ** 2) / (2 * r * r)))
        a = a.copy()
        a[Y0:Y1, X0:X1] += g[..., None] * np.array(col, np.float32) * k
        self.im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))

    def zoom(self, k, cx, cy):
        if abs(k - 1) < 1e-3:
            return
        vw, vh = W / k, H / k
        cx = clamp(cx, vw / 2, W - vw / 2); cy = clamp(cy, vh / 2, H - vh / 2)
        box = (cx - vw / 2, cy - vh / 2, cx + vw / 2, cy + vh / 2)
        self.im = self.im.resize((W, H), Image.BICUBIC, box=box)


def scene_plate_A(f, t, push=0.0, blur=0, cy=1560, vw=1260):
    f.bg("Ao", 750, cy - push * 40, vw - push * 90, blur=blur)


# ---------------------------------------------------------------- the ten scenes
def s01(f, t):  # the last sunset: crane down from the sky onto the trio
    u = ease_io(t / 5.2)
    f.bg("Ao", 750, lerp(860, 1600, u), lerp(900, 1440, u))
    up = (1 - ease_out(seg(t, 2.0, 3.9))) * 820
    if t > 1.9:
        sway = math.sin(t * 1.3) * 3
        f.person("franklin", 548, 1330 + up + 30, 280, "back")
        f.person("michael", 222 + sway, 1385 + up, 300, "back")
        f.person("trevor", 865 - sway, 1410 + up, 300, "back")


def s02(f, t):  # black coupe drives in and parks
    f.bg("Bo", 760, lerp(1650, 1690, t / 6), lerp(1440, 1360, t / 6), glit=0.5)
    u = ease_out(seg(t, 0, 4.6))
    by = lerp(2200, 1560, u)
    # road geometry: plate y for that screen y, then lane centre and width
    x0, y0, x1, y1 = f.view
    py = y0 + by * (y1 - y0) / H
    half = 18 + (py - 1500) / 1500 * 1300
    k = W / (x1 - x0)
    lane_cx = (760 + half * 0.27 - x0) * k
    width = half * 0.50 * k
    bob = math.sin(t * 10) * 2.5 * (1 - u)
    f.car("blackcar", lane_cx, by + bob, width, brake=smooth(seg(t, 3.4, 4.2)) * (1 - 0.4 * seg(t, 5, 6)))


def s03(f, t):  # protagonist close-up, then over-the-shoulder to his three friends
    if t < 3.4:
        scene_plate_A(f, t, push=t / 3.4, blur=5)
        face = lerp(430, 470, t / 3.4)
        f.person("me", 540, 1920 - 0.74 * face / 0.330 + 18, face, "warm")
        f.glow(860, 520, 120, (255, 190, 110), 0.55)
        f.glow(700, 760, 40, (255, 220, 160), 0.35)
    else:
        u = (t - 3.4) / 2.6
        scene_plate_A(f, t, push=u, blur=0)
        f.person("franklin", 560, 1350, 250, "warm")
        f.person("michael", 300, 1420, 270, "warm")
        f.person("trevor", 820, 1450, 270, "warm")
        f.person("me", -60 + u * 20, 1320, 760, "back", blur=7, dark=0.35)


def two_shot(f, t, other, side, flip=False, face=400):
    """Two characters drawing together for the embrace."""
    f.bg("Ao", 750, 1500, 1150 - t * 18, blur=6)
    u = ease_io(seg(t, 0, 2.4))
    gap = lerp(330, 205, u)
    cx = 540
    me_x = cx - gap if side == "right" else cx + gap
    ot_x = cx + gap if side == "right" else cx - gap
    me_face = face + t * 10
    f.person("me", me_x, 1920 - 0.74 * me_face / 0.330 + 30, me_face, "warm")
    ny = FACE[other][1]; nf = FACE[other][2]
    o_face = face + t * 10
    oy = 1920 - (1 - ny) * o_face / nf + 40 if other != "franklin" else 1920 - 0.74 * me_face / 0.330 + 10
    f.person(other, ot_x, oy, o_face, "warm", flip=flip)
    f.glow(cx, 760, 260, (255, 170, 100), 0.25 + 0.35 * smooth(seg(t, 1.5, 3)))


def s04(f, t):  # the first embrace
    if t < 3.9:
        two_shot(f, t, "michael", "right")
    else:
        u = (t - 3.9) / 2.1
        f.bg("Ao", 760, 1480, 1000, blur=8)
        f.person("me", 470, 860 + u * 10, 520 + u * 30, "warm")
        f.person("michael", 1080, 1120, 900, "back", blur=6, dark=0.25)
        f.glow(300, 420, 200, (255, 180, 110), 0.35)


def s05(f, t):  # Franklin, whip, Trevor
    if t < 3.0:
        two_shot(f, t * 1.25, "franklin", "right", face=390)
    else:
        two_shot(f, (t - 3.0) * 1.25, "trevor", "left", face=400)


def s06(f, t):  # the legacy gift
    if t < 3.0:
        f.bg("Ao", 750, 1560, 1300, blur=4)
        f.person("franklin", 548, 1330, 280, "warm")
        f.person("michael", 222, 1385, 300, "warm")
        f.person("trevor", 865, 1410, 300, "warm")
        u = ease_out(seg(t, 0.2, 2.4))
        for i, key in enumerate(("case_v", "case_vi")):
            x = 540 + (i - 0.5) * lerp(180, 400, u)
            y = lerp(1500, 820, u)
            f.paste(f.A[key], x, y, scale=lerp(0.4, 0.72, u), rot=(i - 0.5) * lerp(-20, -8, u))
        f.glow(540, 760, 240, (255, 210, 150), 0.35 * u)
    else:
        u = (t - 3.0) / 3.0
        f.bg("Ao", 760, 1480, 1080, blur=7)
        face = 400 + u * 25
        f.person("me", 540, 1920 - 0.74 * face / 0.330 + 20, face, "warm")
        sweep = lerp(-0.3, 1.3, seg(t, 3.6, 5.2))
        for i, key in enumerate(("case_v", "case_vi")):
            x, y = 540 + (i - 0.5) * 380, 1560 - i * 10
            f.paste(f.A[key], x, y, scale=0.72 + u * 0.03, rot=(i - 0.5) * -10)
            f.glow(x + (sweep - 0.5) * 300, y - 120, 70, (255, 240, 220), 0.5 * math.sin(math.pi * clamp(sweep)))


def s07(f, t):  # a new engine: the red coupe rolls in
    cy, vw = 1640, 1300
    f.bg("Co", 750, cy - t * 6, vw - t * 30)
    u = ease_out(seg(t, 0.2, 3.8))
    sx, by, k = f.to_screen(lerp(-700, 820, u), 2330)
    speed = (1 - u) ** 2
    f.car("redcar", sx, by, 760 * k, mblur=speed * 60, brake=0, glint=lerp(-0.2, 1.2, seg(t, 3.6, 5.6)))
    if t < 2.6:
        f.person("me", 1150, 1180, 820, "back", blur=8, dark=0.4, alpha=1 - smooth(seg(t, 2.1, 2.6)))


def s08(f, t):  # the new pair arrive
    f.bg("Co", 750, 1600 - t * 8, 1250 - t * 25, blur=5)
    sx, by, k = f.to_screen(820, 2330)
    f.car("redcar", sx, by, 760 * k, blur=3)
    u = ease_out(seg(t, 0.0, 1.8))
    up = (1 - u) * 500
    f.person("lucia", 330, 1050 + up * 0.8, 150 + t * 4, "warm")
    f.person("jason", 760, 1540 + up, 560 + t * 10, "warm")


def s09(f, t):  # passing the torch: the full line-up, then push into the protagonist
    d = math.sin((t / 6) * math.pi - math.pi / 2)
    f.bg("Ao", 750 + d * 40, 1560, 1320, blur=3)
    f.person("lucia", 860 + d * 25, 1150, 110, "warm")
    f.person("franklin", 250 + d * 25, 1335, 175, "warm")
    f.person("michael", 85 + d * 25, 1520, 190, "warm")
    f.person("trevor", 290 + d * 25, 1590, 180, "warm")
    f.person("jason", 1000 + d * 50, 1700, 400, "warm")
    face = 250
    f.person("me", 600 + d * 60, 1920 - 0.74 * face / 0.330 + 30, face, "warm")
    z = 1 + 0.55 * ease_io(seg(t, 3.6, 6.0))
    f.zoom(z, 600 + d * 60, lerp(H / 2, 1330, ease_io(seg(t, 3.6, 6.0))))


def s10(f, t):  # goodbye Los Santos, hello Vice City: crane up and away
    vice = smooth(seg(t, 0.3, 4.2))
    u = ease_io(seg(t, 0.4, 5.6))
    f.bg("Co", 750, lerp(1780, 1460, u), lerp(1150, 1500, u), mix=("Cv", vice))
    for key, px, w_ in (("blackcar", 300, 470), ("redcar", 1020, 760)):
        sx, by, k = f.to_screen(px, 2340 if key == "redcar" else 2390)
        f.car(key, sx, by, w_ * k, brake=0)
    drop = ease_io(seg(t, 1.6, 4.0)) * 1300
    a = 1 - smooth(seg(t, 3.0, 4.0))
    if a > 0:
        f.person("lucia", 250, 1100 + drop, 120, "warm", alpha=a)
        f.person("jason", 900, 1700 + drop, 430, "warm", alpha=a)
        face = 330
        f.person("me", 560, 1920 - 0.74 * face / 0.330 + 30 + drop, face, "warm", alpha=a)


SCENES = [s01, s02, s03, s04, s05, s06, s07, s08, s09, s10]


def finish(f, T):
    a = np.asarray(f.im, np.float32)
    # titles
    for key, t0, t1 in (("title1", 54.6, 57.0), ("title2", 57.0, 59.3)):
        if t0 - 0.01 <= T <= t1:
            al = smooth(seg(T, t0, t0 + 0.45)) * (1 - smooth(seg(T, t1 - 0.4, t1)))
            ti = f.A[key]
            sc = 1 + 0.04 * seg(T, t0, t1)
            r = ti.resize((int(ti.width * sc), int(ti.height * sc)), Image.BILINEAR)
            ra = np.asarray(r, np.float32)
            x0, y0 = int(W / 2 - r.width / 2), int(H * 0.40 - r.height / 2)
            xa, xb = max(0, -x0), min(r.width, W - x0)
            reg = a[y0:y0 + r.height, x0 + xa:x0 + xb]
            m = ra[:, xa:xb, 3:4] / 255 * al
            a[y0:y0 + r.height, x0 + xa:x0 + xb] = reg * (1 - m) + ra[:, xa:xb, :3] * m
    a = a * f.A["vig"]
    g = f.A["grain"][f.fi % 8]
    g = np.repeat(np.repeat(g, 2, 0), 2, 1)
    a = a + g[..., None]
    a = a * 0.97 + np.array([8, 4, 6])       # lifted, warm blacks
    # cut flashes / fades
    for tc in (6.0, 12.0, 36.0, 48.0, 54.0):
        k = max(0, 1 - abs(T - tc) / 0.12)
        if k:
            a = a + k * 90 * np.array([1.0, 0.8, 0.6])
    if T < 0.6:
        a = a * smooth(T / 0.6)
    if T > 59.0:
        a = a * (1 - smooth(T - 59.0))
    return np.clip(a, 0, 255).astype(np.uint8)


def render_frame(A, fi):
    T = fi / FPS
    si = min(9, int(T // 6))
    f = Frame(A, fi)
    SCENES[si](f, T - si * 6)
    # whip transition in scene 05
    if 26.88 <= T <= 27.12:
        a = np.asarray(f.im, np.float32)
        k = 1 - abs(T - 27.0) / 0.12
        acc = np.zeros_like(a)
        for i in range(10):
            acc += np.roll(a, int((i - 5) * 22 * k), axis=1)
        f.im = Image.fromarray((acc / 10).astype(np.uint8))
    return finish(f, T)


_A = None
def _init():
    global _A
    _A = load_assets()
def _work(fi):
    return render_frame(_A, fi).tobytes()


if __name__ == "__main__":
    mode = sys.argv[1]
    if mode == "stills":
        A = load_assets()
        os.makedirs("stills", exist_ok=True)
        for s in sys.argv[2:]:
            fi = int(float(s) * FPS)
            Image.fromarray(render_frame(A, fi)).save(f"stills/t_{float(s):05.1f}.jpg", quality=88)
    elif mode == "render":
        from multiprocessing import Pool
        os.makedirs("out", exist_ok=True)
        n = int(DUR * FPS)
        cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
               "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p",
               "-profile:v", "high", "-movflags", "+faststart", "out/reel.mp4"]
        p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
        with Pool(os.cpu_count(), initializer=_init) as pool:
            for i, buf in enumerate(pool.imap(_work, range(n), chunksize=4)):
                p.stdin.write(buf)
                if i % 120 == 0:
                    print(f"frame {i}/{n}", flush=True)
        p.stdin.close(); p.wait()
        print("done")
