"""Photoreal cinematic 9:16 stills for "Churchill's Wanted Poster" (Boer War, 1899), generated locally on CPU.

    python scripts/generate-stills.py <out_dir> [shot ...]

Model: Realistic Vision V5.1 (SD 1.5 fine-tune; CreativeML OpenRAIL-M, commercial use allowed) + sd-vae-ft-mse
+ LCM-LoRA (8 steps), 576x1024. Dramatized reconstructions (not archival): labelled as such in the film.
"""
import sys
from pathlib import Path

import torch
from diffusers import AutoencoderKL, LCMScheduler, StableDiffusionPipeline
from huggingface_hub import hf_hub_download

STYLE = ", cinematic film still, 1899 Boer War period drama, 35mm film grain, dramatic lighting, photorealistic"
NEG = ("painting, oil painting, illustration, drawing, sketch, cartoon, anime, 3d render, cgi, text, watermark, logo, "
       "modern clothing, smartphone, modern car, airplane, steel helmet, deformed, disfigured, extra limbs, extra fingers, blurry, lowres, gore, blood, duplicate, two heads")
SHOTS = {
    "g02_train": ('armoured train derailed on a hillside railway in South Africa in 1899, overturned armoured trucks, steam and smoke, Boer riflemen firing from a ridge, grassy veld', 7021),
    "g03_reporter": ("slim pale young Englishman with red-brown hair in a khaki 1899 war correspondent's uniform and slouch hat, helping wounded soldiers beside a derailed armoured train under fire, smoke", 7031),
    "g03_capture": ('slim pale young Englishman with red-brown hair in khaki surrendering, hands raised, surrounded by bearded Boer horsemen with rifles and wide-brimmed hats on the open veld, 1899', 7032),
    "g04_prison": ('British officer prisoners of war in 1899 uniforms standing in the courtyard of a red brick school building behind an iron fence, Pretoria, armed Boer guard at the gate', 7041),
    "g05_wall": ('slim pale young Englishman with red-brown hair climbing over a high corrugated iron fence at night, moonlight, a sentry with a rifle far away with his back turned, 1899 Pretoria', 7051),
    "g06_post": ('blank paper notice nailed to a wooden post in a dusty 1899 South African frontier town street, Boer policemen on horseback passing, harsh sun', 7061),
    "g07_train": ('slim pale young Englishman with red-brown hair leaping onto a slow moving steam goods train at night on the African veld, sparks, moonlight, coal wagons', 7071),
    "g08_mine": ('coal mine at night on the South African highveld in 1899, wooden pithead headframe, a mine manager with a lantern leading a tired young fugitive in a dark suit', 7081),
    "g09_shaft": ('slim pale young Englishman with red-brown hair hiding alone deep underground in a dark coal mine tunnel, sitting on straw by a single candle, rats on the ground, wooden props', 7091),
    "g10_wool": ('slim pale young Englishman with red-brown hair hidden between large wool bales inside a dark wooden railway goods wagon, thin stripes of daylight through the slats, sweating, 1899', 7101),
    "g11_crowd": ('cheering crowd waving Union Jack flags on a harbour quay in Durban in December 1899, a slim pale young Englishman with red-brown hair in a pale suit giving a speech from steps, steamships behind', 7111),
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
