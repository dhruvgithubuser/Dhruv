"""Painted background plates for Operation Valkyrie (no people), generated locally on CPU.

    python scripts/paint-backgrounds.py <out_dir> [name ...]

DreamShaper 8 + LCM-LoRA, 576x1024. Characters are NOT painted: they are 2D cutouts drawn in code
(src/components/CharacterCutout.tsx) so they stay identical in every scene.
"""
import sys
from pathlib import Path
import torch
from diffusers import LCMScheduler, StableDiffusionPipeline

STYLE = ", semi-realistic digital painting, historical documentary illustration, muted sepia palette, painterly, cinematic lighting, detailed"
NEG = "people, person, soldier, man, woman, face, text, letters, watermark, logo, swastika, flag, modern, photo, 3d render, cartoon, blurry, frame, border"
SHOTS = {
    "briefing_hut": ("interior of a plain wooden barracks briefing hut in 1944, long heavy oak map table on thick wooden plinths, maps on the table, "
                     "row of windows with daylight, pine plank walls, empty room", 4401),
    "wolfslair_forest": ("camouflaged grey concrete bunkers hidden in a dense pine forest, 1944, barbed wire fence, overcast light, East Prussia", 4402),
    "bendlerblock_day": ("large grey stone government office building in Berlin, 1944, rows of tall windows, army trucks parked in front, overcast summer afternoon", 4403),
    "courtyard_night": ("enclosed stone courtyard of a Berlin office building at night, 1944, harsh headlight beams across cobblestones, sandbags by a wall, deep shadows, empty", 4404),
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
