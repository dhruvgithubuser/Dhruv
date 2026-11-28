"""Photoreal cinematic 9:16 stills for "The Radar Operators Who Saw Pearl Harbor Coming" (1941), generated locally on CPU.

    python scripts/generate-stills.py <out_dir> [shot ...]

Model: Realistic Vision V5.1 (SD 1.5 fine-tune; CreativeML OpenRAIL-M, commercial use allowed) + sd-vae-ft-mse
+ LCM-LoRA (8 steps), 576x1024. Dramatized reconstructions (not archival): labelled as such in the film.
"""
import sys
from pathlib import Path

import torch
from diffusers import AutoencoderKL, LCMScheduler, StableDiffusionPipeline
from huggingface_hub import hf_hub_download

STYLE = ", cinematic film still, 1941 World War II period drama, 35mm film grain, dramatic lighting, photorealistic"
NEG = ("beret, woman, female, text, letters, numbers, painting, oil painting, illustration, drawing, sketch, cartoon, anime, 3d render, cgi, text, watermark, logo, letters, "
       "modern clothing, smartphone, computer, modern car, jet, two moons, floating objects, deformed, disfigured, extra limbs, extra fingers, blurry, lowres, gore, blood, duplicate, two heads")
SHOTS = {
    "r01_hero": ('close-up portrait of a young American man, 20 year old male soldier in 1941, short cropped hair, no hat, khaki army shirt, wearing big round 1940s leather radio headphones, his face lit from below by green glow of a radar screen, dark truck interior, eyes wide in alarm, staring at the screen', 8111),
    "r02_opana": ("tall metal lattice radar antenna on a grassy hilltop above the Pacific ocean at dawn, Hawaiian coastline below, army trucks parked beside it, 1941, wide shot", 8021),
    "r03_van": ("two young American army privates in 1941 khaki uniforms inside a cramped army radar truck at dawn, one wearing headphones facing a round oscilloscope screen, the other holding a pencil over a paper plotting board, early light through the open door", 8031),
    "r04_scope": ('close-up of a vintage round cathode ray tube screen glowing green with a single bright jagged line across it, set into a black metal military radio console with round knobs, dark, no text, no numbers', 8141),
    "r05_phone": ('young American soldier in 1941 khaki shirt, no hat, holding a black candlestick field telephone receiver to his ear and shouting into it urgently, inside a dark army radar truck, green glow on his face', 8151),
    "r06_tyler": ("young American army lieutenant in a 1941 khaki uniform sitting alone at a desk in a quiet military plotting room with a large map table, holding a telephone receiver, calm relaxed expression, early morning light through windows", 8061),
    "r07_b17": ('four-engine B-17 Flying Fortress bombers in formation flying over the Pacific ocean at sunrise, silver metal, clouds below, 1941, four propellers on each plane', 8171),
    "r08_jp": ("a formation of 1941 Japanese navy propeller bombers with red circle insignia flying low over the ocean toward a green mountainous island at sunrise, seen from behind", 8081),
    "r09_harbor": ("battleships burning in a harbor, thick black smoke rising into the sky, fire on the water, warships, 1941 Pearl Harbor attack", 8091),
    "r10_dusk": ("silhouette of a tall lattice radar antenna on a hilltop at sunset over the ocean, empty, lonely, 1941", 8101),
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
