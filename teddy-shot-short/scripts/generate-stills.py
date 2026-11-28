"""Photoreal cinematic 9:16 stills for "Teddy Roosevelt Was Shot, Then Spoke for 50 Minutes" (1912), generated locally on CPU.

    python scripts/generate-stills.py <out_dir> [shot ...]

Model: Realistic Vision V5.1 (SD 1.5 fine-tune; CreativeML OpenRAIL-M, commercial use allowed) + sd-vae-ft-mse
+ LCM-LoRA (8 steps), 576x1024. Dramatized reconstructions (not archival): labelled as such in the film.
"""
import sys
from pathlib import Path

import torch
from diffusers import AutoencoderKL, LCMScheduler, StableDiffusionPipeline
from huggingface_hub import hf_hub_download

STYLE = ", cinematic film still, 1912 American period drama, 35mm film grain, dramatic lighting, photorealistic"
NEG = ("neon, signs, red tie, empty seats, beret, woman, female, text, letters, numbers, painting, oil painting, illustration, drawing, sketch, cartoon, anime, 3d render, cgi, watermark, logo, "
       "modern clothing, smartphone, microphone, modern car, two moons, floating objects, deformed, disfigured, extra limbs, extra fingers, blurry, lowres, gore, duplicate, two heads")
TR = "a stocky American man in his fifties with round wire spectacles, a thick brown walrus mustache and short hair, dark three-piece suit and overcoat"
SHOTS = {
    "t01_hero": (TR + ", close-up from the chest up, standing at a wooden podium on a dark stage, his right hand pressed flat against his chest inside his coat, grimacing but defiant, single hard spotlight from above, black background, 1912", 9301),
    "t02_street": ("a crowded street at night in 1912 Milwaukee, an open-top black touring car with brass lamps parked in front of a brick hotel entrance, a crowd of men in bowler hats and overcoats, warm gas street lamps, no signs, no neon", 9302),
    "t03_shot": ("night street outside a brick hotel in 1912, a crowd recoiling in panic, a bright muzzle flash from a revolver in the crowd, men in bowler hats grabbing a man, motion, chaos", 9203),
    "t04_cough": (TR + ", sitting in the back seat of an open-top car at night, coughing into a white handkerchief and looking at it, serious, city lights behind", 9204),
    "t05_stage": ("a packed 1912 theatre auditorium full of people seen from the back of the stage, thousands of men in dark suits and hats filling every seat and the balconies, warm footlights, a lone stocky speaker in silhouette at the front of the stage facing the crowd", 9305),
    "t06_speech": (TR + ", speaking passionately at a podium with papers in his hand, a small dark red stain on his white shirt under his open coat, sweating, theatre stage lights", 9206),
    "t07_hospital": (TR + ", lying calmly in a 1912 hospital bed, white sheets, a nurse and a doctor in white beside him, window light, quiet", 9207),
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
