"""Painted layers for the Short's cover, generated locally on CPU (DreamShaper 8 + LCM-LoRA).

    python scripts/paint-thumbnail.py <out_dir>

hero_<seed>.png: Arkhipov repainted from the locked portrait (public/stills/arkhipov.jpg, img2img), so the
face matches the film, now in red emergency light inside the submarine.
torpedo_<seed>.png: the torpedo room with the nuclear torpedo.
"""
import sys
from pathlib import Path

import torch
from diffusers import LCMScheduler, StableDiffusionImg2ImgPipeline, StableDiffusionPipeline
from PIL import Image

OUT = Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
STYLE = ", semi-realistic digital painting, historical documentary illustration, painterly brush strokes, cinematic lighting, detailed"
NEG = ("photo, photograph, 3d render, cgi, anime, cartoon, text, watermark, logo, letters, deformed face, extra fingers, "
       "blurry, modern, beard, mustache, woman, child, frame, border")
HERO = ("head and shoulders portrait of a 36 year old Soviet navy officer man, short dark hair, clean-shaven, tense determined eyes, "
        "sweat, black naval uniform, harsh red emergency light from the side, dark submarine interior, pipes, deep shadows")
TORP = ("dark cramped 1960s submarine torpedo room, one huge torpedo on a rack in the foreground, torpedo tube hatches, "
        "pipes and valves, glowing red emergency light, haze, ominous")

torch.set_num_threads(4)
t2i = StableDiffusionPipeline.from_pretrained("Lykon/dreamshaper-8", torch_dtype=torch.float32, safety_checker=None)
t2i.load_lora_weights("latent-consistency/lcm-lora-sdv1-5"); t2i.fuse_lora()
t2i.scheduler = LCMScheduler.from_config(t2i.scheduler.config)
i2i = StableDiffusionImg2ImgPipeline(**t2i.components)

src = Image.open("public/stills/arkhipov.jpg").convert("RGB").resize((576, 1024), Image.LANCZOS)
for s in (901, 902, 903):
    i2i(HERO + STYLE, image=src, strength=0.5, negative_prompt=NEG, num_inference_steps=10, guidance_scale=1.5,
        generator=torch.Generator().manual_seed(s)).images[0].save(OUT / f"hero_{s}.png"); print("hero", s, flush=True)
for s in (911, 912):
    t2i(TORP + STYLE, negative_prompt=NEG + ", people, sailors", width=576, height=1024, num_inference_steps=8,
        guidance_scale=1.5, generator=torch.Generator().manual_seed(s)).images[0].save(OUT / f"torpedo_{s}.png"); print("torp", s, flush=True)
