"""Painted-canvas + film-grain textures (seeded, deterministic) -> public/images/textures/."""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

OUT = Path(__file__).resolve().parent.parent / "public" / "images" / "textures"
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(1983)


def smooth_noise(h, w, scale):
    small = rng.random((max(2, h // scale), max(2, w // scale)))
    return np.asarray(Image.fromarray((small * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC), dtype=np.float32) / 255


# painted canvas: multi-scale blotches + directional brush streaks, as luminance around mid-grey
H, W = 1920, 1080
canvas = 0.45 * smooth_noise(H, W, 240) + 0.3 * smooth_noise(H, W, 60) + 0.25 * smooth_noise(H, W, 12)
streak = rng.random((H // 3, W // 40))
streak = np.asarray(Image.fromarray((streak * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC), dtype=np.float32) / 255
img = Image.fromarray(np.clip((canvas * 0.7 + streak * 0.3) * 255, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
fine = (rng.random((H, W)) * 40 - 20)
arr = np.clip(np.asarray(img, dtype=np.float32) + fine, 0, 255).astype(np.uint8)
Image.fromarray(arr).convert("L").save(OUT / "canvas.png", optimize=True)

# film grain: 8 frames, half resolution (scaled up in the film), alpha noise
for i in range(8):
    g = rng.normal(128, 46, (H // 2, W // 2)).clip(0, 255).astype(np.uint8)
    Image.fromarray(g).save(OUT / f"grain_{i}.png", optimize=True)
print("textures ->", OUT)
