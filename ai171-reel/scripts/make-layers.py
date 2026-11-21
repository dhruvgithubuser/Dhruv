"""Split each still into depth layers for 2.5-D parallax (far = full frame, mid and near = feathered cut-outs).

    python scripts/make-layers.py

Reads public/stills/<name>.jpg + <name>_depth.png (white = near). Writes <name>_mid.png and
<name>_near.png (RGBA, 1080x1920) beside them. Layers are soft-edged so a small camera move never
shows a hard seam; the full image always sits underneath, so there are no holes.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

D = Path(__file__).resolve().parent.parent / "public" / "stills"


def smooth(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


for img_p in sorted(D.glob("*.jpg")):
    dp = D / f"{img_p.stem}_depth.png"
    if not dp.exists():
        continue
    im = np.asarray(Image.open(img_p).convert("RGB"))
    d = np.asarray(Image.open(dp).convert("L").resize((1080, 1920), Image.BICUBIC), dtype=np.float32) / 255
    # thresholds relative to this image's depth distribution
    q50, q75, q90 = np.quantile(d, [0.5, 0.75, 0.9])
    for name, a, b in (("mid", q50, q75), ("near", q75, q90)):
        alpha = smooth(d, a, b)
        al = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))
        rgba = np.dstack([im, np.asarray(al)])
        Image.fromarray(rgba, "RGBA").save(D / f"{img_p.stem}_{name}.png", optimize=True)
    print("layers", img_p.stem, flush=True)
