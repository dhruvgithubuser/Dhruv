"""Photoreal cinematic 9:16 stills for "Nelson Came Home in a Barrel of Brandy" (1805), generated locally on CPU.

    python scripts/generate-stills.py <out_dir> [shot ...]

Model: Realistic Vision V5.1 (SD 1.5 fine-tune; CreativeML OpenRAIL-M, commercial use allowed) + sd-vae-ft-mse
+ LCM-LoRA (8 steps), 576x1024. Dramatized reconstructions (not archival): labelled as such in the film.
"""
import sys
from pathlib import Path

import torch
from diffusers import AutoencoderKL, LCMScheduler, StableDiffusionPipeline
from huggingface_hub import hf_hub_download

STYLE = ", cinematic film still, 18th century historical drama, 35mm film grain, dramatic lighting, highly detailed, photorealistic"
NEG = ("painting, oil painting, illustration, drawing, sketch, cartoon, anime, 3d render, cgi, text, watermark, logo, "
       "modern clothing, deformed, disfigured, extra limbs, extra fingers, blurry, lowres, gore, blood, duplicate, two heads")
SHOTS = {
    "g02_victory": ("great wooden three-deck ship of the line HMS Victory under full sail in battle in 1805, cannon firing from its gun ports, thick white smoke, other warships around, dramatic sky", 5021),
    "g04_death": ("dying 18th century admiral lying wrapped in a white sheet in the dim lower deck of a wooden warship, officers and a surgeon kneeling around him, lantern light, solemn", 5041),
    "g03_marksman": ("French marksman in a 1805 uniform aiming a long musket down from high in the rigging of a wooden sailing warship, ropes and sails around him, thick cannon smoke below", 5031),
    "g05_surgeon": ("ship surgeon in an 1805 naval coat pouring brandy from a bottle into a large wooden cask in the dark lower deck of a sailing warship, lantern light, deep shadows", 5051),
    "g05_cask": ("large old wooden barrel lashed with thick ropes to the base of the mainmast on the deck of a sailing warship at night, a red-coated marine with a musket standing guard beside it, lantern light", 5052),
    "g06_gibraltar": ("battle-damaged wooden sailing warship with broken masts being towed by another ship toward the rock of Gibraltar at dawn, calm sea, 1805", 5061),
    "g07_sailors": ("two sailors in 1805 clothes crouching in the dark hold of a wooden ship secretly drinking from a large wooden barrel by candlelight, guilty glances, shadows", 5071),
    "g08_coffin": ("ornate dark wooden coffin with brass fittings resting on black-draped trestles in a grand candlelit hall with a painted ceiling, mourners in black, 1806", 5081),
    "g09_thames": ("funeral procession of black-draped boats and a state barge on the river Thames in winter 1806, crowds on the banks, grey sky, London", 5091),
    "g09_crypt": ("stone crypt beneath a cathedral with a large dark marble sarcophagus on a pedestal, candlelight, arches, quiet", 5092),
}

out = Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
names = sys.argv[2:] or list(SHOTS)
torch.set_num_threads(4)
ckpt = hf_hub_download("SG161222/Realistic_Vision_V5.1_noVAE", "Realistic_Vision_V5.1_fp16-no-ema.safetensors")
vae = AutoencoderKL.from_pretrained("stabilityai/sd-vae-ft-mse", torch_dtype=torch.float32)
pipe = StableDiffusionPipeline.from_single_file(ckpt, config=sys.argv[0].replace('scripts/generate-stills.py', '') + 'sd15-config', vae=vae, torch_dtype=torch.float32, safety_checker=None)
pipe.load_lora_weights("latent-consistency/lcm-lora-sdv1-5", weight_name="pytorch_lora_weights.safetensors")
pipe.fuse_lora()
pipe.scheduler = LCMScheduler.from_config(pipe.scheduler.config)
for n in names:
    if (out / f"{n}.png").exists():
        continue
    prompt, seed = SHOTS[n]
    img = pipe(prompt + STYLE, negative_prompt=NEG, width=576, height=1024, num_inference_steps=8, guidance_scale=1.5,
               generator=torch.Generator().manual_seed(seed)).images[0]
    img.save(out / f"{n}.png")
    print("saved", n, flush=True)
