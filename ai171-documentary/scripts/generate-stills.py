"""Photoreal dramatization stills for the AI171 documentary, generated locally on CPU.

    python scripts/generate-stills.py <out_dir> [shot ...]

Model: Realistic Vision V5.1 (SD 1.5 fine-tune, CreativeML OpenRAIL-M: commercial use allowed) with
the sd-vae-ft-mse VAE and LCM-LoRA (8 steps). 1024x576 (16:9). Every shot is generic: no airline
livery or logo, no identifiable real person, and nothing depicts the crash or its victims.
Prompts stay under CLIP's 77-token limit.
"""
import sys
from pathlib import Path

import torch
from diffusers import AutoencoderKL, LCMScheduler, StableDiffusionPipeline

STYLE = ", cinematic documentary still, 35mm film, natural light, highly detailed, photorealistic"
SHOTS = {
    "city_aerial": ("aerial drone photo of a flat modern Indian city, dense concrete apartment blocks, wide river with riverfront promenade, hazy hot summer day", 31),
    "terminal": ("international airport terminal in India, wide glass facade, palm trees, hot sunny afternoon", 12),
    "gate": ("passengers waiting at an airport departure gate, seen from behind, large window, airliner outside", 13),
    "jet_runway": ("plain white twin engine Boeing 787 airliner taking off, landing gear down, side view, heat haze, clear sky, no text", 47),
    "cockpit": ("modern airliner cockpit seen from behind two pilots, bright daylight through windshield", 15),
    "tower": ("air traffic control tower interior, controller with headset looking out at runway, afternoon", 16),
    "runway_low": ("low angle view along an empty airport runway, heat shimmer, distant city skyline", 17),
    "fire_trucks": ("red fire truck with ladder and flashing emergency lights driving fast on a dusty Indian city road, firefighters, hazy afternoon", 72),
    "lab": ("accident investigation laboratory, orange flight recorder on a workbench, technicians in gloves", 19),
    "documents": ("investigation report pages and photographs spread on a dark desk, desk lamp, moody", 20),
    "hospital": ("quiet hospital corridor in India at night, soft lights, empty chairs", 21),
    "vigil": ("candlelight vigil at night, hundreds of candles and marigold flowers, people silhouettes", 22),
    "river_sunset": ("Sabarmati riverfront Ahmedabad at sunset, golden light, calm water, city lights", 23),
    "runway_night": ("airport runway lights at night, empty, long exposure, quiet, blue hour", 24),
}
NEG = ("cartoon, anime, illustration, painting, 3d render, cgi, text, watermark, logo, letters, deformed, "
       "blurry, lowres, extra limbs, fire, explosion, crash, wreckage, blood")

out = Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
names = sys.argv[2:] or list(SHOTS)
torch.set_num_threads(4)
vae = AutoencoderKL.from_pretrained("stabilityai/sd-vae-ft-mse", torch_dtype=torch.float32)
pipe = StableDiffusionPipeline.from_pretrained("SG161222/Realistic_Vision_V5.1_noVAE", vae=vae, torch_dtype=torch.float32, safety_checker=None)
pipe.load_lora_weights("latent-consistency/lcm-lora-sdv1-5")
pipe.fuse_lora()
pipe.scheduler = LCMScheduler.from_config(pipe.scheduler.config)
for n in names:
    if (out / f"{n}.png").exists():
        continue
    prompt, seed = SHOTS[n]
    img = pipe(prompt + STYLE, negative_prompt=NEG, width=1024, height=576, num_inference_steps=8, guidance_scale=1.5,
               generator=torch.Generator().manual_seed(seed)).images[0]
    img.save(out / f"{n}.png")
    print("saved", n, flush=True)
