"""2.5D camera motion for still images: monocular depth (Depth Anything V2 Small) + depth-weighted warp.

    python scripts/parallax.py <stills_dir> <clips_dir> [name ...]

For each still, writes a 10 s 1920x1080 30 fps clip in which the camera dollies into the scene (or pans, rises, drifts)
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

W, H, FPS, SECS = 1920, 1080, 30, 10
# motion per shot: (kind, strength). kinds: push (dolly in), pull (dolly out), left/right (truck with parallax), rise, drift
MOTION = {
    "c01_chicago": ("push", 1.0), "c02_court": ("push", 0.8), "c03_reno": ("push", 1.0), "c04_papers": ("right", 0.8), "c05_markers": ("left", 1.0),
    "c06_jury": ("push", 0.8), "c07_general": ("push", 1.0), "c10_expedition": ("left", 1.0), "c11_gold": ("push", 0.7), "c12_council": ("push", 0.8),
    "c13_column": ("right", 1.0), "c14_gatling": ("left", 0.9), "c15_ravine": ("push", 0.9), "c16_agency": ("push", 0.8), "c17_village": ("right", 1.0),
    "c18_scouts": ("push", 1.0), "c19_custer_back": ("push", 1.2), "c20_charge": ("push", 1.2), "c21_skirmish": ("left", 1.0), "c22_timber": ("right", 1.0),
    "c23_bluffs": ("rise", 1.0), "c24_witness": ("push", 0.9), "c25_trumpeter": ("left", 1.2), "c26_hill": ("push", 0.9), "c27_riders": ("right", 1.0),
    "c28_dawn_tipi": ("push", 0.8), "c29_horseman": ("drift", 1.0), "c31_dust": ("push", 1.1), "c33_weir": ("push", 1.0), "c34_relief": ("left", 0.9),
    "c36_testimony": ("push", 0.8), "c37_verdict": ("push", 0.9), "c38_barracks": ("right", 0.8), "c39_alone": ("push", 0.8), "c40_honors": ("left", 0.9),
    "c42_hills": ("pull", 1.0), "c45_writer": ("push", 0.8), "c46_washita": ("right", 1.0), "c48_rosebud": ("left", 1.0), "c49_packer": ("push", 0.9),
    "c50_packtrain": ("right", 1.0), "c51_archaeology": ("left", 0.9), "c52_comanche": ("push", 0.9), "c53_widow": ("push", 0.8), "c54_memorial": ("rise", 0.9),
    "c55_water": ("push", 1.0), "c56_elder": ("push", 0.8), "c03b_reno": ("push", 1.0),
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
    kind, k = MOTION.get(name, ("push", 1.0))
    ys, xs = torch.meshgrid(torch.linspace(-1, 1, H), torch.linspace(-1, 1, W), indexing="ij")
    base = 1.09  # overscan so edges never show
    ff = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                           "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", str(dst)], stdin=subprocess.PIPE)
    n = FPS * SECS
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
            gx = xs / sc + tx * (0.25 + 1.2 * dd)
            gy = ys / sc + ty * (0.25 + 1.2 * dd)
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
