"""Painted 9:16 background plates (no people) for the New Orleans 1815 Short. DreamShaper 8 + LCM-LoRA, CPU.

    python scripts/paint-backgrounds.py <out_dir> [name[:seed] ...]
"""
import sys
from pathlib import Path
import torch
from diffusers import LCMScheduler, StableDiffusionPipeline

STYLE = ", semi-realistic digital painting, 18th century historical documentary illustration, muted earthy palette, painterly, atmospheric, detailed"
NEG = "people, person, soldier, man, woman, face, figure, text, letters, watermark, logo, modern, road, car, power lines, photo, 3d render, cartoon, blurry, frame, border"
SHOTS = {
    "field_dawn": ("flat open sugar cane stubble field at dawn in Louisiana, thick fog, a long low earthen rampart and ditch across the field, cypress swamp forest at the edge, 1815, cold light", 6101),
    "swamp_fog": ("misty Louisiana cypress swamp at dawn, still dark water, spanish moss, bayou, eerie light, 1815", 6102),
    "river_city": ("the Mississippi river beside the old French colonial city of New Orleans in 1815, sailing ships at the levee, church spires, hazy morning", 6103),
    "ocean_ship": ("a lone three-masted sailing ship on a stormy grey Atlantic ocean in winter, big waves, dramatic clouds, 1815", 6104),
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
    img = pipe(prompt + STYLE, negative_prompt=NEG, width=576, height=1024, num_inference_steps=8, guidance_scale=1.5,
               generator=torch.Generator().manual_seed(int(so or seed))).images[0]
    img.save(out / f"{tag}.png"); print("saved", tag, flush=True)
