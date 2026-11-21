"""Painted 2D documentary illustrations (9:16) for the AI171 reel, generated locally on CPU.

    python scripts/paint-stills.py <out_dir> [name ...]

Model: DreamShaper 8 (CreativeML OpenRAIL-M, commercial use allowed) + LCM-LoRA, 576x1024.
"vtanb" is an img2img repaint of the real VT-ANB photo (Wikimedia Commons, RyanZ225 PC, CC BY-SA 4.0),
so the livery stays the real one. Nothing depicts the crash or its victims. Prompts < 77 tokens.
"""
import sys
from pathlib import Path

import torch
from diffusers import LCMScheduler, StableDiffusionImg2ImgPipeline, StableDiffusionPipeline
from PIL import Image

STYLE = ", semi-realistic digital painting, documentary illustration, painterly brush strokes, cinematic light"
SHOTS = {
    "city": ("aerial view of Ahmedabad city India, Sabarmati riverfront, hot hazy summer noon", 101),
    "gate": ("families at an airport departure gate window watching a large white airliner, seen from behind", 102),
    "boarding": ("passengers with hand luggage walking through a jet bridge toward an open aircraft door, seen from behind", 103),
    "cockpit": ("captain and first officer, only two pilots, side by side in an airliner cockpit, seen from behind, bright daylight, runway ahead", 214),
    "runway": ("long airport runway at noon, heat haze, control tower in the distance, empty", 105),
    "tower": ("air traffic controller with headset seen from behind looking out of a control tower window", 106),
    "lab": ("accident investigators in gloves examining an orange flight recorder on a workbench", 107),
    "vigil": ("candlelight vigil at night, hundreds of candles and marigold flowers, silhouettes of mourners", 108),
}
NEG = "photo, photograph, 3d render, cgi, anime, cartoon, text, watermark, logo, letters, deformed, blurry, fire, explosion, crash, blood"

out = Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
names = sys.argv[2:] or list(SHOTS) + ["vtanb"]
torch.set_num_threads(4)
pipe = StableDiffusionPipeline.from_pretrained("Lykon/dreamshaper-8", torch_dtype=torch.float32, safety_checker=None)
pipe.load_lora_weights("latent-consistency/lcm-lora-sdv1-5"); pipe.fuse_lora()
pipe.scheduler = LCMScheduler.from_config(pipe.scheduler.config)
for n in names:
    if (out / f"{n}.png").exists():
        continue
    if n == "vtanb":
        i2i = StableDiffusionImg2ImgPipeline(**pipe.components)
        src = Image.open(sys.argv[0].replace("scripts/paint-stills.py", "public/stills/vtanb_photo_src.jpg")).convert("RGB").resize((1024, 680))
        img = i2i("Air India Boeing 787 airliner flying in clear blue sky" + STYLE, image=src, strength=0.45, num_inference_steps=10,
                  guidance_scale=1.5, negative_prompt=NEG, generator=torch.Generator().manual_seed(171)).images[0]
    else:
        prompt, seed = SHOTS[n]
        img = pipe(prompt + STYLE, negative_prompt=NEG, width=576, height=1024, num_inference_steps=8, guidance_scale=1.5,
                   generator=torch.Generator().manual_seed(seed)).images[0]
    img.save(out / f"{n}.png")
    print("saved", n, flush=True)
