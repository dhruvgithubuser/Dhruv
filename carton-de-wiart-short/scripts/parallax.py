"""2.5D camera motion for still images: monocular depth (Depth Anything V2 Small) + depth-weighted warp.

    python scripts/parallax.py <stills_dir> <clips_dir> [name ...]

For each still, writes a 1080x1920 30 fps clip (length per shot) in which the camera dollies into the scene (or pans, rises, drifts)
and near objects move more than far ones, so the photo reads as a filmed shot. Pure function of the image + MOTION table.
"""
import subprocess
import sys
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image, ImageFilter
from transformers import AutoImageProcessor, AutoModelForDepthEstimation

W, H, FPS = 1080, 1920, 30
# per shot: (kind, strength, seconds, focus x, focus y) - focus in -1..1 is the point the camera pushes toward.
# kinds: push (dolly in), pull (dolly out), left/right (truck with parallax), rise, drift
MOTION = {
    "a01_cairo": ("push", 3.0, 8, 0.0, -0.5), "a02_young": ("push", 1.0, 6, 0.1, -0.35), "g02_boer": ("right", 1.0, 6, 0, 0),
    "g03_fort": ("push", 1.1, 8, 0, 0), "a04_beaton": ("push", 1.0, 5, 0.0, -0.4), "g05_trench": ("push", 1.2, 8, 0, -0.1),
    "g06_hospital": ("push", 0.9, 4, 0, 0), "g07_somme": ("push", 1.2, 6, 0, 0), "g07_vc": ("push", 0.8, 4, 0, 0),
    "g09_crash": ("left", 1.0, 5, 0, 0), "g09_beach": ("push", 0.9, 5, 0, 0), "g10_castle": ("rise", 1.0, 4, 0, 0),
    "g10_tunnel": ("push", 1.3, 5, 0, 0), "g11_peasant": ("push", 1.0, 9, 0, 0), "g12_book": ("push", 0.9, 7, 0, 0),
    "a13_cairo": ("pull", 1.0, 6, -0.05, -0.3),
}


def depth_map(img, proc, model):
    with torch.no_grad():
        out = model(**proc(images=img, return_tensors="pt")).predicted_depth  # relative inverse depth (bigger = nearer)
    d = F.interpolate(out[None], size=(H, W), mode="bicubic", align_corners=False)[0, 0].numpy()
    lo, hi = np.percentile(d, 2), np.percentile(d, 98)
    d = np.clip((d - lo) / (hi - lo + 1e-6), 0, 1)
    d = np.asarray(Image.fromarray((d * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6)), dtype=np.float32) / 255
    return d


def ease(t):
    return t * t * (3 - 2 * t)


def render(name, src, dst, proc, model):
    img = Image.open(src).convert("RGB").resize((W, H), Image.LANCZOS).filter(ImageFilter.UnsharpMask(2, 60, 2))
    d = torch.from_numpy(depth_map(img, proc, model))[None, None]
    im = torch.from_numpy(np.asarray(img, dtype=np.float32) / 255).permute(2, 0, 1)[None]
    kind, k, secs, fx, fy = MOTION.get(name, ("push", 1.0, 8, 0, 0))
    ys, xs = torch.meshgrid(torch.linspace(-1, 1, H), torch.linspace(-1, 1, W), indexing="ij")
    base = 1.09  # overscan so edges never show
    ff = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                           "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", str(dst)], stdin=subprocess.PIPE)
    n = FPS * secs
    for i in range(n):
        t = ease(i / (n - 1))
        z, tx, ty = 0.0, 0.0, 0.0
        if kind == "push": z = 0.10 * k * t
        elif kind == "pull": z = 0.10 * k * (1 - t)
        elif kind == "left": tx, z = -0.05 * k * (t - 0.5), 0.03 * t
        elif kind == "right": tx, z = 0.05 * k * (t - 0.5), 0.03 * t
        elif kind == "rise": ty, z = 0.045 * k * (t - 0.5), 0.03 * t
        elif kind == "drift": tx, ty, z = 0.03 * k * (t - 0.5), -0.015 * k * (t - 0.5), 0.05 * t
        # backward map: sample the source where a point of disparity dd would have come from; refine depth once
        dd = d[0, 0]
        for _ in range(2):
            sc = base * (1 + z * (0.35 + 0.9 * dd))
            gx = fx * (1 - 1 / sc) * 1.0 + xs / sc + tx * (0.25 + 1.2 * dd)
            gy = fy * (1 - 1 / sc) + ys / sc + ty * (0.25 + 1.2 * dd)
            dd = F.grid_sample(d, torch.stack([gx, gy], -1)[None], mode="bilinear", padding_mode="border", align_corners=True)[0, 0]
        frame = F.grid_sample(im, torch.stack([gx, gy], -1)[None], mode="bilinear", padding_mode="border", align_corners=True)[0]
        ff.stdin.write((frame.clamp(0, 1).permute(1, 2, 0).numpy() * 255).astype(np.uint8).tobytes())
    ff.stdin.close(); ff.wait()


def main():
    sdir, cdir = Path(sys.argv[1]), Path(sys.argv[2]); cdir.mkdir(parents=True, exist_ok=True)
    names = sys.argv[3:] or sorted(p.stem for p in sdir.glob("*.png"))
    torch.set_num_threads(4)
    proc = AutoImageProcessor.from_pretrained("depth-anything/Depth-Anything-V2-Small-hf")
    model = AutoModelForDepthEstimation.from_pretrained("depth-anything/Depth-Anything-V2-Small-hf").eval()
    for nm in names:
        dst = cdir / f"{nm}.mp4"
        if dst.exists():
            continue
        render(nm, sdir / f"{nm}.png", dst, proc, model)
        print("clip", nm, flush=True)


if __name__ == "__main__":
    main()
