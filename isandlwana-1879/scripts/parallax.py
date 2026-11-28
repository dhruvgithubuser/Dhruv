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

W, H, FPS, SECS = 1920, 1080, 30, 14
# motion per shot: (kind, strength). kinds: push (dolly in), pull (dolly out), left/right (truck with parallax), rise, drift
MOTION = {
    "i01_mountain_dawn": ("right", 1.0),
    "i02_impi_ridge": ("left", 1.0),
    "i03_redcoats_line": ("right", 1.1),
    "i04_ultimatum_tree": ("push", 1.0),
    "i05_frere": ("push", 1.2),
    "i06_crossing": ("left", 1.0),
    "i07_cetshwayo": ("push", 1.1),
    "i08_council": ("push", 1.0),
    "i09_ntshingwayo": ("push", 1.3),
    "i10_army_gathers": ("right", 1.0),
    "i11_march": ("left", 1.1),
    "i12_camp": ("right", 1.0),
    "i13_wagons": ("push", 1.0),
    "i14_chelmsford": ("push", 1.2),
    "i15_valley_hidden": ("drift", 1.0),
    "i16_night_march": ("left", 1.0),
    "i17_pulleine": ("push", 1.2),
    "i18_durnford": ("right", 1.1),
    "i19_patrol": ("left", 1.0),
    "i20_discovery": ("push", 1.4),
    "i21_warriors_rise": ("rise", 1.1),
    "i22_horns_run": ("right", 1.3),
    "i23_firing_line": ("left", 1.0),
    "i24_rocket": ("push", 1.1),
    "i25_guns": ("right", 1.0),
    "i26_warriors_ground": ("push", 1.0),
    "i27_ammo": ("push", 1.1),
    "i28_ammo_box": ("push", 1.4),
    "i29_chest_charge": ("push", 1.5),
    "i30_eclipse": ("rise", 1.0),
    "i31_melee_tents": ("push", 1.3),
    "i32_last_stand": ("push", 1.2),
    "i33_flight": ("left", 1.2),
    "i34_river": ("right", 1.1),
    "i35_colour": ("push", 1.2),
    "i36_dusk_field": ("right", 0.9),
    "i37_chelmsford_return": ("push", 1.1),
    "i38_rorkes": ("push", 1.0),
    "i39_zulu_return": ("left", 1.0),
    "i40_london": ("push", 1.0),
    "i41_ulundi": ("right", 1.0),
    "i42_burning": ("rise", 1.0),
    "i43_captive": ("push", 1.1),
    "i44_old_general": ("pull", 1.2),
    "i45_cairns": ("right", 0.9),
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
                           "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p", str(dst)], stdin=subprocess.PIPE)
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
