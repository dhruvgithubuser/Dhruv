"""Photoreal cinematic 9:16 stills for "The British General Who Could not Be Killed" (Carton de Wiart), generated locally on CPU.

    python scripts/generate-stills.py <out_dir> [shot ...]

Model: Realistic Vision V5.1 (SD 1.5 fine-tune; CreativeML OpenRAIL-M, commercial use allowed) + sd-vae-ft-mse
+ LCM-LoRA (8 steps), 576x1024. Dramatized reconstructions (not archival): labelled as such in the film.
"""
import sys
from pathlib import Path

import torch
from diffusers import AutoencoderKL, LCMScheduler, StableDiffusionPipeline
from huggingface_hub import hf_hub_download

STYLE = ", cinematic film still, historical war documentary, 35mm film grain, dramatic lighting, highly detailed, photorealistic"
NEG = ("painting, oil painting, illustration, drawing, sketch, cartoon, anime, 3d render, cgi, text, watermark, logo, "
       "modern clothing, deformed, disfigured, extra limbs, extra fingers, blurry, lowres, gore, blood, duplicate, two heads")
SHOTS = {
    "g02_boer": ("british soldiers in khaki uniforms and slouch hats with rifles on the dusty South African veld, 1900, rocky kopje hill behind, harsh sunlight, heat haze", 2021),
    "g03_fort": ("british camel corps soldiers attacking a white stone desert fort in Somaliland, 1914, rifle smoke, harsh sun, dust, thorn bushes", 2031),
    "g05_trench": ("world war one british trench at night 1915, mud, sandbags, a shell explosion lighting the sky orange, soldiers in steel helmets ducking", 2051),
    "g06_hospital": ("1915 military hospital ward with rows of iron beds, wounded soldiers with white bandages, a nurse in a long white apron and veil carrying a tray, tall windows, dim morning light, somber, wide shot", 2062),
    "g07_somme": ("british soldiers climbing out of a trench and advancing at the Somme 1916, barbed wire, smoke, explosions in the distance, dawn, cratered mud", 2071),
    "g09_crash": ("twin engine world war two bomber plane ditched and sinking in a dark rough sea at dusk, waves breaking over the wings, smoke, 1941", 2091),
    "g09_beach": ("italian soldiers in 1941 uniforms on a Libyan beach at dawn leading away a soaked british officer, sea behind, sand, grey sky", 2092),
    "g10_castle": ("medieval stone castle with battlements and a tower on a hill in Tuscany at dusk, cypress trees, moody sky", 2101),
    "g10_tunnel": ("narrow hand dug tunnel under a stone castle lit by a single candle, dirt walls, wooden props, a shovel and a bucket, claustrophobic", 2102),
    "g11_peasant": ("old man in a worn peasant coat and flat cap walking alone on a dirt country road through Tuscan fields, seen from behind, 1943, misty morning", 2111),
    "g12_book": ("old leather bound book open on a wooden desk beside a black eye patch, a pair of round spectacles and war medals, warm lamp light, dark room", 2121),
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
