"""Painted cover art for the Short, generated locally on CPU.

    python scripts/paint-thumbnail.py <out_dir> [seed ...]

Model: DreamShaper 8 (Stable Diffusion 1.5 fine-tune, CreativeML OpenRAIL-M: commercial use allowed)
+ LCM-LoRA for 8-step sampling. Writes <out_dir>/cover_<seed>.png at 576x1024 (9:16).
The character description matches assets/characters/petrov-character-reference.md.
"""
import sys
from pathlib import Path

import torch
from diffusers import LCMScheduler, StableDiffusionPipeline

OUT = Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
SEEDS = [int(s) for s in sys.argv[2:]] or [1983, 2609, 44, 370]

PROMPT = (
    "semi-realistic digital painting, historical documentary illustration, portrait of a 44 year old Soviet "
    "lieutenant colonel in 1983, short dark brown hair neatly combed back with a side part, clean-shaven, "
    "strong square jaw, serious composed tense expression, looking slightly off camera, dark olive green "
    "Soviet military uniform jacket, gold shoulder boards, white shirt, dark tie, standing in a dark underground "
    "Soviet command bunker, glowing red radar screens and a large wall map behind him, red emergency light, "
    "volumetric haze, dramatic cinematic lighting, painterly brush strokes, highly detailed face, masterpiece"
)
NEG = ("cartoon, anime, 3d render, cgi, photo, photograph, blurry, lowres, deformed face, asymmetric eyes, "
       "extra fingers, bad hands, text, watermark, signature, helmet, hat, cap, beard, mustache, modern")

torch.set_num_threads(4)
pipe = StableDiffusionPipeline.from_pretrained("Lykon/dreamshaper-8", torch_dtype=torch.float32, safety_checker=None)
pipe.load_lora_weights("latent-consistency/lcm-lora-sdv1-5")
pipe.fuse_lora()
pipe.scheduler = LCMScheduler.from_config(pipe.scheduler.config)
for s in SEEDS:
    img = pipe(PROMPT, negative_prompt=NEG, width=576, height=1024, num_inference_steps=8, guidance_scale=1.5,
               generator=torch.Generator().manual_seed(s)).images[0]
    img.save(OUT / f"cover_{s}.png")
    print("saved", s, flush=True)
