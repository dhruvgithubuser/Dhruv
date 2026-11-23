"""Photoreal cinematic 9:16 stills for "Montgomery's Body Double" (Operation Copperhead, 1944), generated locally on CPU.

    python scripts/generate-stills.py <out_dir> [shot ...]

Model: Realistic Vision V5.1 (SD 1.5 fine-tune; CreativeML OpenRAIL-M, commercial use allowed) + sd-vae-ft-mse
+ LCM-LoRA (8 steps), 576x1024. Dramatized reconstructions (not archival): labelled as such in the film.
"""
import sys
from pathlib import Path

import torch
from diffusers import AutoencoderKL, LCMScheduler, StableDiffusionPipeline
from huggingface_hub import hf_hub_download

STYLE = ", cinematic film still, 1944 Second World War period drama, 35mm film grain, dramatic lighting, highly detailed, photorealistic"
NEG = ("painting, oil painting, illustration, drawing, sketch, cartoon, anime, 3d render, cgi, text, watermark, logo, "
       "modern clothing, peaked cap, visor cap, smartphone, modern car, deformed, disfigured, extra limbs, extra fingers, blurry, lowres, gore, blood, duplicate, two heads")
SHOTS = {
    "g01_spy": ("man in a 1944 civilian grey suit and fedora hat holding binoculars to his eyes, seen from behind his shoulder on a Spanish hillside, looking across the bay at the huge Rock of Gibraltar, morning haze", 6013),
    "g01_land": ('a lean British army general in his fifties with a thin face, sharp pointed nose, small grey moustache, soft black beret worn tilted, with two small cap badges on the beret, khaki battledress stepping down from a four-engine military transport aircraft onto an airfield, officers saluting, the Rock of Gibraltar behind, 1944', 6014),
    "g02_map": ('British intelligence officers in 1944 uniforms leaning over a large map table of Europe and the Mediterranean in a dim underground war room, lamp light, cigarette smoke', 6021),
    "g03_clerk": ('tired middle-aged British army lieutenant with a thin face, sharp nose and small grey moustache, at a cluttered desk counting banknotes and ledgers in a drab 1940s army pay office', 6031),
    "g04_drink": ('middle-aged British officer with a thin face and small grey moustache secretly pouring gin into a glass and smoking a cigar alone in a dim hotel room at night, 1944', 6041),
    "g05_study": ('a man in civilian clothes with a notebook watching closely from the side as a lean British army general in his fifties with a thin face, sharp pointed nose, small grey moustache, soft black beret worn tilted, with two small cap badges on the beret, khaki battledress speaks to soldiers in an English field, 1944', 6053),
    "g06_plane": ("side view of a single large four-engine propeller transport aircraft parked on a wet airfield at dusk, 1944, ground crew walking beside it, floodlights, rain", 6063),
    "g07_breakfast": ('breakfast table in an elegant colonial dining room, a lean British army general in his fifties with a thin face, sharp pointed nose, small grey moustache, soft black beret worn tilted, with two small cap badges on the beret, khaki battledress and an older British governor in uniform talking, a Spanish man in a dark suit listening at the edge of the frame, morning light through tall windows, 1944', 6071),
    "g07_phone": ('Spanish man in a 1940s dark suit making a secret call from an old wall telephone in a dim bar, glancing over his shoulder, 1944', 6072),
    "g08_algiers": ('a lean British army general in his fifties with a thin face, sharp pointed nose, small grey moustache, soft black beret worn tilted, with two small cap badges on the beret, khaki battledress stepping out of a staff car in a sunlit North African city street, white buildings, palm trees, crowds and press photographers, 1944', 6081),
    "g08_cairo": ('a lonely man in a white shirt sitting in a shuttered room in Cairo, slatted light through the blinds, ceiling fan, waiting, 1944', 6082),
    "g09_generals": ("1944 German Wehrmacht staff officers in field-grey uniforms with silver collar tabs and black and white Iron Cross medals, bare heads, grey hair, leaning over a map of the French coast in a concrete bunker, a lamp overhead", 6095),
    "g10_desk": ('middle-aged British lieutenant with a thin face and small grey moustache sitting back at a plain office desk with ledgers, alone, grey afternoon light, 1944', 6103),
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
