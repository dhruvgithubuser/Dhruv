"""Photoreal cinematic 9:16 stills for "The Only Soldier to Kill With a Longbow in WWII?" (Mad Jack Churchill), generated locally on CPU.

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
    "g02_archery": ("1930s archery tournament on a green field, a British gentleman archer in white clothes drawing a tall wooden longbow, straw targets in the distance, spectators, summer light", 3021),
    "g03_france": ("British soldier in a 1940 khaki uniform and steel helmet kneeling behind a ruined stone wall in a French village, holding a tall wooden longbow, smoke and dust, dusk", 3031),
    "g04_truck": ("broken wooden longbow and scattered arrows crushed into the mud under the big wheel of a 1940 army truck, rain, close up", 3041),
    "g06_landing": ("British commandos jumping from a landing craft ramp onto a snowy rocky Norwegian shore in winter 1941, smoke from burning buildings, grey dawn", 3061),
    "g07_sicily": ("British commando officer with a mustache walking up a sandy Sicilian beach in 1943 with a long sword at his hip and a longbow on his back, soldiers and landing craft behind him, smoke, hot sun", 3071),
    "g08_prisoners": ("long column of captured German soldiers in grey uniforms with their hands on their heads walking down a winding mountain road in southern Italy 1943, guarded by two British commandos with rifles", 3081),
    "g09_sword": ("one single soldier walking alone away from the camera down a wide empty ruined Italian town street at dawn, small figure, rubble and broken walls, dust in the air, long shadows, wide shot", 3094),
    "g10_brac": ("British commandos taking cover on a rocky Adriatic island hilltop under mortar fire in 1944, explosions, smoke, scrub bushes, sea below", 3101),
    "g10_piper": ("silhouette of a Scottish piper in a kilt playing the bagpipes with drones over his shoulder on a rocky hilltop at dusk, smoke drifting across a red sky, dramatic backlight", 3103),
    "g11_room": ("bare interrogation room in 1944, a single lamp hanging over a wooden table, two chairs, a wounded British officer sitting with a bandaged head, shadows", 3111),
    "g12_thames": ("elderly English gentleman with a white mustache steering a small vintage steam launch on the river Thames, willow trees, calm morning, 1980s", 3121),
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
