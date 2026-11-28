"""Compose the Short's cover (1080x1920) from the painted layers.

    python scripts/compose-thumbnail.py [hero_seed] [out.png]

Layers: assets/thumbnail/hero_<seed>.png (Arkhipov, repainted from the locked portrait), and
public/stills/sub_underwater.jpg (the submarine under the destroyers, as in the film).
Text: "1 SAID NO" hook + the three-officer vote (captain yes, political officer yes, Arkhipov no).
"""
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops, ImageEnhance
import numpy as np

SEED = sys.argv[1] if len(sys.argv) > 1 else "902"
OUT = sys.argv[2] if len(sys.argv) > 2 else "output/thumbnail-short.png"
W, H = 1080, 1920
OSW = "assets/thumbnail/Oswald-700.ttf"
INTER = "/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf"
RED, AMBER, WHITE = (226, 32, 28), (255, 184, 46), (255, 255, 255)

def arr(im): return np.asarray(im, dtype=np.float32) / 255
def img(a): return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))

# --- background: the submarine painting, dark and cold, lower half
sub = Image.open("public/stills/sub_underwater.jpg").convert("RGB").resize((W, H))
sub = ImageEnhance.Brightness(sub).enhance(0.55)
# --- hero portrait, full bleed, pushed slightly up and in
hero = Image.open(f"assets/thumbnail/hero_{SEED}.png").convert("RGB")
hero = hero.resize((int(W * 1.12), int(H * 1.12)), Image.LANCZOS).crop((60, 40, 60 + W, 40 + H))
h, s = arr(hero), arr(sub)
y = np.linspace(0, 1, H)[:, None, None]; x = np.linspace(0, 1, W)[None, :, None]
# red emergency light from the right, cold shadow on the left
lum = h.mean(2, keepdims=True)
red_key = np.clip((x - 0.35) / 0.65, 0, 1) ** 1.4
graded = h * (0.55 + 0.25 * (1 - red_key)) * np.array([0.85, 0.9, 1.05])           # cold base
graded += red_key * lum * np.array([1.25, 0.18, 0.1]) * 0.9                         # red rim
graded = graded ** 1.08
# blend hero over the submarine: hero dominant at top, fades out from y=0.48 to 0.68
m = np.clip((y - 0.50) / 0.22, 0, 1) ** 1.2
comp = graded * (1 - m) + s * np.array([0.7, 0.85, 1.0]) * m
# vignette + bottom darkening for text
vig = 1 - 0.55 * (((x - 0.5) * 1.6) ** 2 + ((y - 0.42) * 1.1) ** 2)
comp = comp * np.clip(vig, 0.25, 1)
comp = comp * (1 - 0.6 * np.clip((y - 0.55) / 0.35, 0, 1))
base = img(comp)
# subtle film grain
grain = (arr(Image.effect_noise((W, H), 40).convert("RGB")) - 0.5) * 0.06
base = img(arr(base) + grain)

d = ImageDraw.Draw(base)

def shadow_text(xy, text, font, fill, anchor="mm", stroke=0, blur=14, sh=(0, 0, 0)):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(layer).text((xy[0] + 6, xy[1] + 10), text, font=font, fill=sh + (230,), anchor=anchor, stroke_width=stroke + 4)
    base.paste(Image.new("RGB", (W, H)), (0, 0), layer.filter(ImageFilter.GaussianBlur(blur)).split()[3])
    ImageDraw.Draw(base).text(xy, text, font=font, fill=fill, anchor=anchor, stroke_width=stroke, stroke_fill=(0, 0, 0))

# top tag
f_tag = ImageFont.truetype(INTER, 38)
tag = "OCTOBER 1962 · NUCLEAR TORPEDO"
tw = d.textlength(tag, font=f_tag)
d.rounded_rectangle((W / 2 - tw / 2 - 26, 118, W / 2 + tw / 2 + 26, 182), radius=10, fill=AMBER)
d.text((W / 2, 150), tag, font=f_tag, fill=(20, 14, 6), anchor="mm")

# hook: "1 SAID" white, "NO" red stamp
shadow_text((W / 2, 1040), "1 SAID", ImageFont.truetype(OSW, 230), WHITE, stroke=4)
no = Image.new("RGBA", (660, 360), (0, 0, 0, 0))
nd = ImageDraw.Draw(no)
nd.rounded_rectangle((18, 18, 642, 342), radius=24, outline=RED + (255,), width=20)
nd.text((330, 182), "NO", font=ImageFont.truetype(OSW, 285), fill=RED + (255,), anchor="mm")
# stamp wear: knock random specks out of the ink
rng = np.random.default_rng(7)
alpha = np.asarray(no.split()[3], dtype=np.float32)
specks = rng.random(alpha.shape) < 0.035
alpha[specks] *= 0.15
no.putalpha(Image.fromarray(alpha.astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8)))
no = no.rotate(-7, resample=Image.BICUBIC, expand=True)
glow = Image.new("RGB", no.size, (0, 0, 0))
base.paste(glow, (W // 2 - no.width // 2 + 8, 1140 + 12), no.split()[3].filter(ImageFilter.GaussianBlur(16)))
base.paste(no, (W // 2 - no.width // 2, 1140), no)

# the vote: captain ✓, political officer ✓, Arkhipov ✗
f_lab = ImageFont.truetype(INTER, 30)
f_mark = ImageFont.truetype(OSW, 86)
cols = [(210, "CAPTAIN", "✓", (120, 200, 120)), (540, "POLITICAL\nOFFICER", "✓", (120, 200, 120)), (870, "ARKHIPOV", "✕", RED)]
for cx, lab, mark, col in cols:
    box = (cx - 120, 1590, cx + 120, 1745)
    d.rounded_rectangle(box, radius=14, fill=(10, 10, 14), outline=col if mark == "✕" else (90, 90, 96), width=4 if mark == "✕" else 2)
    mf = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 64)
    d.text((cx, 1640), mark, font=mf, fill=col, anchor="mm")
    d.multiline_text((cx, 1707), lab, font=f_lab if "\n" not in lab else ImageFont.truetype(INTER, 22), fill=WHITE, anchor="mm", align="center", spacing=2)

base.save(OUT)
base.convert("RGB").save(OUT.replace(".png", ".jpg"), quality=92)
print("saved", OUT)
