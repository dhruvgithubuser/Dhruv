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
    "control_room": ("cramped 1960s Soviet submarine control room, officers at analog gauges and valves, red emergency light, steam", 593),
    "engine_room": ("1960s submarine battery and engine compartment, analog gauges, pipes, flickering dim yellow lights, sailor checking dials", 594),
    "radio": ("Soviet sailor radio operator with headphones turning dials on 1960s radio equipment, red light, submarine", 595),
    "crew_heat": ("exhausted sweating sailors in a cramped hot submarine compartment, bunks and pipes, dim red light", 596),
    "surfacing": ("Soviet diesel submarine surfacing on the Atlantic ocean in daylight, water pouring off the hull, US destroyer nearby", 597),
    "ocean_gold": ("calm ocean horizon at golden sunrise, soft clouds, peaceful, warm light on the water", 598),
    # character lock: one portrait each, reused everywhere
    "arkhipov": ("portrait of a 36 year old Soviet navy officer in 1962, short dark hair, clean-shaven, calm serious face, black naval uniform, shoulder boards, red light", 701),
    "savitsky": ("portrait of a tense exhausted Soviet submarine captain in 1962, short dark hair, clean-shaven, black naval uniform with captain insignia, sweat, red light", 702),
    "political": ("portrait of a stern Soviet naval political officer in 1962, short hair, clean-shaven, black naval uniform, shoulder boards, red light", 703),
}
NEG = "photo, photograph, 3d render, cgi, anime, cartoon, text, watermark, logo, letters, deformed face, extra fingers, blurry, modern, touchscreen, beard, mustache"

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
