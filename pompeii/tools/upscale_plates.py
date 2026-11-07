"""Upscale painted plates for 1080p camera moves: v2/plates/*.png (1024x576) -> v2/plates_hd/*.jpg (2048x1152).
Lanczos 2x, a gentle unsharp mask, and a light warm grade so all plates sit in one palette."""
import os, sys
from PIL import Image, ImageFilter, ImageEnhance
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src, dst = os.path.join(HERE, "v2/plates"), os.path.join(HERE, "v2/plates_hd"); os.makedirs(dst, exist_ok=True)
for f in sorted(os.listdir(src)):
    if not f.endswith(".png"): continue
    out = os.path.join(dst, f[:-4] + ".jpg")
    if os.path.exists(out) and os.path.getmtime(out) > os.path.getmtime(os.path.join(src, f)): continue
    im = Image.open(os.path.join(src, f)).convert("RGB").resize((2048, 1152), Image.LANCZOS)
    im = im.filter(ImageFilter.UnsharpMask(radius=2.2, percent=70, threshold=2))
    im = ImageEnhance.Color(im).enhance(1.05)
    warm = Image.new("RGB", im.size, (255, 236, 205)); im = Image.blend(im, Image.composite(im, warm, Image.new("L", im.size, 230)), 0.5)
    im.save(out, quality=92); print(f)
