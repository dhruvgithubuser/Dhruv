"""Give a public-domain period photograph the film's painted sepia finish (keeps the real likeness).

    python scripts/stylize-photo.py <photo> <out.png>

Writes a 576x1024 frame like the painted stills: the photo in the upper part, a dark painted surround,
light oil-paint smoothing (mode filter), warm sepia tone and canvas grain.
"""
import sys
import numpy as np
from PIL import Image, ImageFilter, ImageOps, ImageEnhance

src, out = sys.argv[1], sys.argv[2]
im = ImageOps.grayscale(Image.open(src))
im = ImageOps.autocontrast(im, cutoff=1)
im = ImageOps.contain(im, (576, 760), Image.LANCZOS)
im = im.filter(ImageFilter.ModeFilter(3)).filter(ImageFilter.SMOOTH_MORE).filter(ImageFilter.UnsharpMask(2, 80, 2))
bg = Image.new("L", (576, 1024), 18)
mask = Image.new("L", im.size, 0)
w, h = im.size
m = np.zeros((h, w), np.float32)
yy, xx = np.mgrid[0:h, 0:w]
m = np.clip(1.4 - np.sqrt(((xx - w / 2) / (w * 0.55)) ** 2 + ((yy - h * 0.45) / (h * 0.62)) ** 2), 0, 1)
mask = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(20))
bg.paste(im, ((576 - w) // 2, 120), mask)
g = np.asarray(bg, np.float32) / 255
rng = np.random.default_rng(19)
g = np.clip(g + rng.normal(0, 0.025, g.shape), 0, 1)
rgb = np.stack([g ** 0.95 * 1.02, g ** 1.0 * 0.9, g ** 1.1 * 0.74], -1)
Image.fromarray((np.clip(rgb, 0, 1) * 255).astype(np.uint8)).save(out)
