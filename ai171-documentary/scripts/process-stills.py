"""Upscale each still to 1920x1080 and estimate its depth map for the parallax "drone" shots.

    python scripts/process-stills.py <stills_dir>

Upscale: Swin2SR x2 (Apache-2.0) then resize to 1920x1080, light sharpening.
Depth: Depth Anything V2 Small (Apache-2.0), relative inverse depth (white = near), smoothed.
Writes public/stills/<name>.jpg and <name>_depth.png.
"""
import sys
from pathlib import Path

import numpy as np
import torch
from PIL import Image, ImageFilter
from transformers import AutoImageProcessor, AutoModelForDepthEstimation, Swin2SRForImageSuperResolution, Swin2SRImageProcessor

SRC = Path(sys.argv[1])  # add --sr for Swin2SR x2 upscaling
OUT = Path(__file__).resolve().parent.parent / "public" / "stills"
OUT.mkdir(parents=True, exist_ok=True)
torch.set_num_threads(4)

dproc = AutoImageProcessor.from_pretrained("depth-anything/Depth-Anything-V2-Small-hf")
dmodel = AutoModelForDepthEstimation.from_pretrained("depth-anything/Depth-Anything-V2-Small-hf").eval()
USE_SR = "--sr" in sys.argv  # Swin2SR is ~5 min per image on a 4-core CPU; Lanczos + sharpen by default
if USE_SR:
    sproc = Swin2SRImageProcessor.from_pretrained("caidas/swin2SR-classical-sr-x2-64")
    smodel = Swin2SRForImageSuperResolution.from_pretrained("caidas/swin2SR-classical-sr-x2-64").eval()


def upscale(im):
    # tile to keep memory sane: 4 x 2 tiles of 256x288 with 16 px overlap
    w, h = im.size
    out = Image.new("RGB", (w * 2, h * 2))
    tw, th, ov = w // 4, h // 2, 16
    for ty in range(2):
        for tx in range(4):
            box = (max(0, tx * tw - ov), max(0, ty * th - ov), min(w, (tx + 1) * tw + ov), min(h, (ty + 1) * th + ov))
            tile = im.crop(box)
            with torch.no_grad():
                o = smodel(**sproc(tile, return_tensors="pt")).reconstruction[0]
            arr = (o.clamp(0, 1).permute(1, 2, 0).numpy() * 255).astype(np.uint8)
            t2 = Image.fromarray(arr).crop((0, 0, (box[2] - box[0]) * 2, (box[3] - box[1]) * 2))
            l, t = (tx * tw - box[0]) * 2, (ty * th - box[1]) * 2
            out.paste(t2.crop((l, t, l + tw * 2, t + th * 2)), (tx * tw * 2, ty * th * 2))
    return out


for p in sorted(SRC.glob("*.png")):
    name = p.stem
    if (OUT / f"{name}_depth.png").exists():
        continue
    im = Image.open(p).convert("RGB")
    big = (upscale(im) if USE_SR else im).resize((1920, 1080), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=2.0, percent=55, threshold=2))
    big.save(OUT / f"{name}.jpg", quality=92)
    with torch.no_grad():
        d = dmodel(**dproc(images=im, return_tensors="pt")).predicted_depth[0].numpy()
    d = (d - d.min()) / (d.max() - d.min() + 1e-9)
    Image.fromarray((d * 255).astype(np.uint8)).resize((960, 540), Image.BICUBIC).filter(ImageFilter.GaussianBlur(3)).save(OUT / f"{name}_depth.png")
    print("processed", name, flush=True)
