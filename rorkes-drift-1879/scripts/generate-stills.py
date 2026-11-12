"""Photoreal cinematic stills for "How 150 Men Held Off 4,000 Zulu Warriors" (Rorke's Drift, 1879), generated locally on CPU.

    python scripts/generate-stills.py <out_dir> [shot ...]

Model: Realistic Vision V5.1 (SD 1.5 fine-tune; CreativeML OpenRAIL-M, commercial use allowed) + sd-vae-ft-mse
+ LCM-LoRA (8 steps), 1024x576. Dramatized reconstructions (not archival): labelled as such in the film.
"""
import sys
from pathlib import Path

import torch
from diffusers import AutoencoderKL, LCMScheduler, StableDiffusionPipeline
from huggingface_hub import hf_hub_download

STYLE = ", cinematic film still, historical war epic, 1879, 35mm film, dramatic lighting, highly detailed, photorealistic"
NEG = ("painting, oil painting, illustration, drawing, sketch, cartoon, anime, 3d render, cgi, text, watermark, logo, "
       "modern clothing, deformed, disfigured, extra limbs, extra fingers, blurry, lowres, gore, blood")
SHOTS = {
    "r01_outpost": ("small remote mission station with two long stone buildings with thatched roofs at the foot of a rocky hill, South African grassland, a few British soldiers in red tunics and white pith helmets, late afternoon sun", 301),
    "r02_charge": ("front view, dozens of African Zulu warriors charging straight toward the camera, tall oval black and white cowhide shields, short spears, feather headdresses, running through tall golden grass, dust clouds, low angle, late afternoon sun, intense faces", 912),
    "r03_barricade": ("British soldiers in red tunics and white pith helmets stacking heavy grain sacks and wooden crates into a chest high wall, 1879 South Africa, hot afternoon, urgency", 303),
    "r04_hospital_fire": ("long building with a thatched roof burning at night, flames and sparks, silhouettes of soldiers carrying a wounded man, smoke", 304),
    "r05_night": ("British redcoat soldiers in white pith helmets firing rifles over a wall of grain sacks at night, lit orange by a burning building behind, smoke, muzzle flashes", 305),
    "r06_dawn": ("misty dawn over a smoking ruined mission station in grassland, exhausted British soldiers in red tunics sitting behind a wall of sacks, quiet", 306),
    "r07_redcoat": ("close-up portrait of an exhausted young British soldier, red tunic, white pith helmet, dirt and sweat on his face, firelight, night, intense eyes", 307),
    "r08_shields": ("close-up of a line of Zulu warriors holding tall black and white cowhide shields and short spears, grassland, dramatic sky, dignified", 308),
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
    img = pipe(prompt + STYLE, negative_prompt=NEG, width=1024, height=576, num_inference_steps=8, guidance_scale=1.5,
               generator=torch.Generator().manual_seed(seed)).images[0]
    img.save(out / f"{n}.png")
    print("saved", n, flush=True)
