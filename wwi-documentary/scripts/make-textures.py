"""Procedural textures for the 1914 graphics (seeded): aged map paper and storm clouds.

    python scripts/make-textures.py   -> public/images/paper.jpg, public/images/clouds.png
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

OUT = Path(__file__).resolve().parent.parent / "public" / "images"
rng = np.random.default_rng(1914)
W, H = 1080, 1920


def fbm(w, h, octaves=6, base=4):
    out = np.zeros((h, w), np.float32); amp = 1.0; tot = 0
    for o in range(octaves):
        s = base * 2 ** o
        g = rng.random((s + 1, int(s * w / h) + 2)).astype(np.float32)
        im = Image.fromarray((g * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
        out += amp * np.asarray(im, np.float32) / 255; tot += amp; amp *= 0.55
    return out / tot


# aged paper: warm base, fibre noise, stains, darker edges
n = fbm(W, H, 7, 3)
fine = rng.standard_normal((H, W)).astype(np.float32)
y, x = np.mgrid[0:H, 0:W]
edge = ((x / W - 0.5) ** 2 * 2.2 + (y / H - 0.5) ** 2 * 1.6)
base = np.array([233, 220, 192], np.float32) / 255
p = base[None, None, :] * (0.86 + 0.18 * n[..., None]) - 0.25 * edge[..., None] * np.array([0.6, 0.75, 0.95])
st = fbm(W, H, 4, 2); p -= 0.10 * np.clip(st - 0.6, 0, 1)[..., None] * np.array([0.5, 0.8, 1.2])
p += 0.025 * fine[..., None]
Image.fromarray((np.clip(p, 0, 1) * 255).astype(np.uint8)).save(OUT / "paper.jpg", quality=90)

# storm clouds: dark, soft, alpha from fbm
c = fbm(W, H, 6, 3)
a = np.clip((c - 0.42) * 3.2, 0, 1) ** 1.3
rgb = np.stack([0.10 + 0.12 * c, 0.10 + 0.11 * c, 0.11 + 0.12 * c], -1)
img = Image.fromarray((np.dstack([rgb, a]) * 255).astype(np.uint8), "RGBA").filter(ImageFilter.GaussianBlur(3))
img.save(OUT / "clouds.png")
print("textures ok")
