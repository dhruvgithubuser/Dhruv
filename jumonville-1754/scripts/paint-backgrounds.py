"""Painted 16:9 background plates (no people) for the Jumonville 1754 documentary. DreamShaper 8 + LCM-LoRA, CPU.

    python scripts/paint-backgrounds.py <out_dir> [name[:seed] ...]
"""
import sys
from pathlib import Path
import torch
from diffusers import LCMScheduler, StableDiffusionPipeline

STYLE = ", semi-realistic digital painting, 18th century historical documentary illustration, muted earthy palette, painterly, atmospheric, detailed"
NEG = "people, person, soldier, man, woman, face, figure, text, letters, watermark, logo, modern, road, car, power lines, photo, 3d render, cartoon, blurry, frame, border"
SHOTS = {
    "glen_dawn": ("rocky wooded ravine in an old Pennsylvania forest at dawn, mossy boulders and ledges, mist between tall trees, a small campfire smoking below, cold blue light", 5401),
    "forest_night_rain": ("dark dense old-growth forest at night in heavy rain, a narrow trail between huge trees, mud, faint moonlight, ominous", 5402),
    "forks_ohio": ("wide view of two rivers meeting at a forested point of land in the American wilderness in 1754, wooded hills, morning haze, no buildings", 5403),
    "fort_snow": ("small wooden log stockade fort with a gate in a snowy winter forest beside a frozen creek, 1753 frontier, smoke from a chimney, grey sky", 5404),
    "meadow_rain": ("small round log palisade stockade in a wet open meadow surrounded by forested hills, heavy rain, dark storm clouds, muddy trenches, 1754", 5405),
    "great_meadows": ("open grassy meadow in a mountain valley surrounded by dense forest, summer evening light, mist, wilderness, 1754", 5406),
}
out = Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
names = sys.argv[2:] or list(SHOTS)
torch.set_num_threads(4)
pipe = StableDiffusionPipeline.from_pretrained("Lykon/dreamshaper-8", torch_dtype=torch.float32, safety_checker=None)
pipe.load_lora_weights("latent-consistency/lcm-lora-sdv1-5"); pipe.fuse_lora()
pipe.scheduler = LCMScheduler.from_config(pipe.scheduler.config)
for spec in names:
    n, _, so = spec.partition(":")
    tag = f"{n}_{so}" if so else n
    if (out / f"{tag}.png").exists():
        continue
    prompt, seed = SHOTS[n]
    img = pipe(prompt + STYLE, negative_prompt=NEG, width=1024, height=576, num_inference_steps=8, guidance_scale=1.5,
               generator=torch.Generator().manual_seed(int(so or seed))).images[0]
    img.save(out / f"{tag}.png"); print("saved", tag, flush=True)
