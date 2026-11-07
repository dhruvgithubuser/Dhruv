"""Painted semi-realistic 2D illustrations (9:16) for the B-59 short, generated locally on CPU.

    python scripts/paint-stills.py <out_dir> [name ...]

Model: DreamShaper 8 (CreativeML OpenRAIL-M) + LCM-LoRA, 576x1024. One portrait per officer is generated
ONCE and reused in every scene (character lock). Prompts stay under CLIP's 77-token limit.
"""
import sys
from pathlib import Path

import torch
from diffusers import LCMScheduler, StableDiffusionPipeline

STYLE = ", semi-realistic digital painting, historical documentary illustration, painterly brush strokes, cinematic lighting, detailed"
SHOTS = {
    # environments
    "sub_underwater": ("Soviet Foxtrot class diesel submarine gliding deep underwater, dark navy ocean, light rays from surface, warship hulls above", 591),
    "destroyers": ("1960s US Navy destroyers sailing on grey Atlantic ocean, cold daylight, overcast sky, spray", 592),
    "control_room": ("crowded 1960s Soviet submarine control room, many male sailors and officers at periscope, valves and analog gauges, red emergency light", 811),
    "engine_room": ("1960s submarine battery and engine compartment, analog gauges, pipes, flickering dim yellow lights, sailor checking dials", 594),
    "radio": ("male Soviet navy sailor radio operator with headphones at 1960s submarine radio set, turning dials, red light, sweat", 812),
    "crew_heat": ("group of exhausted sweating male sailors in undershirts crowded in a hot cramped submarine compartment, pipes, dim red light", 813),
    "surfacing": ("black diesel submarine conning tower rising out of grey Atlantic waves, water pouring off, US navy destroyer in the distance", 814),
    "ocean_gold": ("calm ocean horizon at golden sunrise, soft clouds, peaceful, warm light on the water", 598),
    # character lock: one portrait each, reused everywhere
    "arkhipov": ("head and shoulders portrait of a 36 year old Soviet navy officer man, mature face, short dark hair, clean-shaven, calm serious eyes, black naval uniform, red light", 821),
    "savitsky": ("head and shoulders portrait of a 45 year old Soviet submarine captain man, tense exhausted lined face, short dark hair, clean-shaven, black naval uniform, sweat, red light", 822),
    "political": ("head and shoulders portrait of a 40 year old stern Soviet naval political officer man, short hair, clean-shaven, black naval uniform, red light", 823),
}
NEG = "photo, photograph, 3d render, cgi, anime, cartoon, text, watermark, logo, letters, deformed face, extra fingers, blurry, modern, touchscreen, beard, mustache, woman, girl, female, child, teenager, young boy, frame, border, poster"

out = Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
names = sys.argv[2:] or list(SHOTS)
torch.set_num_threads(4)
pipe = StableDiffusionPipeline.from_pretrained("Lykon/dreamshaper-8", torch_dtype=torch.float32, safety_checker=None)
pipe.load_lora_weights("latent-consistency/lcm-lora-sdv1-5"); pipe.fuse_lora()
pipe.scheduler = LCMScheduler.from_config(pipe.scheduler.config)
for n in names:
    if (out / f"{n}.png").exists():
        continue
    prompt, seed = SHOTS[n]
    img = pipe(prompt + STYLE, negative_prompt=NEG, width=576, height=1024, num_inference_steps=8, guidance_scale=1.5,
               generator=torch.Generator().manual_seed(seed)).images[0]
    img.save(out / f"{n}.png")
    print("saved", n, flush=True)
