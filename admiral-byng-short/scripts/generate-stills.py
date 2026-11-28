"""Photoreal cinematic 9:16 stills for "Britain Shot Its Own Admiral (1757)" (Admiral John Byng), generated locally on CPU.

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
    "g02_fleet": ("fleet of 18th century British wooden ships of the line under full white sails leaving Portsmouth harbour, 1756, grey overcast sky, choppy sea", 4021),
    "g03_battle": ("two lines of 18th century wooden sailing warships firing broadsides at each other on the Mediterranean sea, thick white cannon smoke, orange muzzle flashes, 1756", 4031),
    "g03_gibraltar": ("damaged 18th century wooden warship with torn sails sailing toward the huge rock of Gibraltar at dusk, calm sea, melancholy", 4032),
    "g04_effigy": ("angry crowd in an 18th century English town street at night burning a straw effigy on a pole, torches, people in tricorn hats and long coats", 4041),
    "g05_court": ("single wide shot of an 18th century naval court martial inside the great cabin of a wooden warship, stern officers in dark blue coats and white powdered wigs seated behind one long table, candlelight, tall stern windows behind them", 4053),
    "g06_king": ("elderly 18th century king in a red velvet coat and ermine robe with a white powdered wig sitting on a throne in a dim palace room, stern face, candlelight", 4061),
    "g07_deck": ("quarterdeck of an 18th century wooden warship at grey dawn, a line of red-coated marines with muskets standing at attention, sailors watching in silence, small boats on the water", 4071),
    "g07_cushion": ("a single red velvet cushion on the wooden deck of an old sailing warship, a white handkerchief lying beside it, cold morning light, empty, quiet", 4072),
    "g08_voltaire": ("thin elderly man with a long curly white powdered wig and a sharp smiling face, 18th century French philosopher in a brown velvet coat, writing with a quill pen by candlelight at a desk with books, warm light", 4082),
    "g09_tomb": ("interior of an old English village church at dusk, a carved stone memorial tablet on the wall, candles, light through a window, quiet", 4091),
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
