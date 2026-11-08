"""Painted semi-realistic 2D stills (9:16) for "One Wrong Turn That Started World War I", generated locally on CPU.

    python scripts/paint-stills.py <out_dir> [name ...]

Model: DreamShaper 8 (CreativeML OpenRAIL-M) + LCM-LoRA, 576x1024, prompts under CLIP's 77-token limit.
Character lock: the three real people are painted ONCE each, by img2img over their public-domain 1914-era
photographs (assets/reference/, from Wikimedia Commons), so the faces follow the real likeness. Those portraits
are reused in every scene where the person appears close up. Scenes with figures use small, distant figures.
"""
import sys
from pathlib import Path

import numpy as np
import torch
from diffusers import LCMScheduler, StableDiffusionImg2ImgPipeline, StableDiffusionPipeline
from PIL import Image, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent
STYLE = ", semi-realistic digital painting, historical documentary illustration, painterly brush strokes, cinematic lighting, detailed"
NEG = ("photo, photograph, 3d render, cgi, anime, cartoon, text, watermark, logo, letters, signature, deformed face, extra fingers, "
       "blurry, modern car, 1950s car, 1960s car, license plate, modern clothes, asphalt road markings, frame, border, poster")
SHOTS = {
    "sarajevo_storm": ("Sarajevo in 1914, Ottoman old town in a green valley, mosque domes and slender minarets, red tiled roofs, "
                       "shallow river with stone bridges, dark storm clouds rolling over the hills", 1411),
    "motorcade": ("side view of a 1910s open-top touring car with spoked wheels on a riverside street, mustached officer in light blue "
                  "tunic and lady in white in the back seat, chauffeur, crowd, flags, summer morning", 1412),
    "bomb": ("black smoke explosion on a 1910s cobbled street behind a vintage open-top touring car with spoked wheels, "
             "people running, Austro-Hungarian buildings, dust", 1413),
    "townhall": ("pseudo-Moorish revival town hall with red and ochre striped walls and horseshoe arched windows, beside a river, "
                 "Sarajevo 1914, officers in uniform and open touring cars in front, morning", 1424),
    "latin_bridge": ("small old stone arched bridge over a shallow river at the corner of a narrow street, 1914 town, "
                     "open-top touring car turning the corner, crowd on the pavement", 1405),
    "car_stall": ("1914 open-top touring car stopped at a narrow street corner, chauffeur in cap looking back over his shoulder, "
                  "officers in uniform, onlookers on the pavement, tense quiet", 1406),
    "deli_corner": ("young man in a dark suit standing in the shadow beside an old corner shop with an awning, 1914 street, "
                    "seen from behind, an open car slowing in the sunlit street ahead, tension", 1407),
    "street_bg": ("straight-on view of a row of Austro-Hungarian building facades along a riverside street in 1914 Sarajevo, "
                  "shops with awnings, flags hanging from windows, sunny morning, empty pavement, no people", 1420, (1024, 576)),
    "trenches": ("World War I soldiers in a muddy trench, steel helmets, rifles, sandbags and wooden planks, barbed wire beyond, "
                 "smoke and distant shell bursts, grey overcast sky", 1418),
    "crosses": ("World War I military cemetery, long rows of identical white crosses on green grass stretching to the horizon, "
                "misty morning light, solemn", 1419),
}
PORTRAITS = {  # name: (reference photo, prompt, seed, strength)
    "ff": ("ff.jpg", "portrait of a 50 year old Austrian archduke, heavy face, large upturned dark moustache, short grey hair, "
           "light blue military tunic with high collar and medals, warm light, dark background", 1501, 0.5),
    "sophie": ("sophie.jpg", "portrait of a 46 year old elegant Austrian duchess, dark hair in an updo, gentle face, white lace gown, "
               "pearl necklace, tiara, soft warm light, dark background", 1502, 0.5),
    "princip": ("princip.jpg", "portrait of a gaunt 19 year old young man, hollow cheeks, unkempt dark hair, faint thin moustache, "
                "tired intense eyes, dark wool jacket, dramatic side light, dark background", 1503, 0.36),
}


def canvas(photo):
    """Place a portrait photo into a 576x1024 frame (face in the upper half), fill the rest from the photo, warm it."""
    im = Image.open(photo).convert("RGB")
    im = ImageOps.contain(im, (576, 720))
    bg = im.resize((576, 1024)).filter(ImageFilter.GaussianBlur(30))
    bg = Image.fromarray((np.asarray(bg) * 0.35).astype(np.uint8))
    bg.paste(im, ((576 - im.width) // 2, 140))
    g = np.asarray(bg.convert("L"), dtype=np.float32) / 255  # sepia-warm base so img2img starts from skin tones
    tint = np.stack([g * 1.0, g * 0.86, g * 0.72], -1)
    return Image.fromarray((np.clip(tint, 0, 1) * 255).astype(np.uint8))


out = Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
names = sys.argv[2:] or list(SHOTS) + list(PORTRAITS)
torch.set_num_threads(4)
pipe = StableDiffusionPipeline.from_pretrained("Lykon/dreamshaper-8", torch_dtype=torch.float32, safety_checker=None)
pipe.load_lora_weights("latent-consistency/lcm-lora-sdv1-5"); pipe.fuse_lora()
pipe.scheduler = LCMScheduler.from_config(pipe.scheduler.config)
i2i = StableDiffusionImg2ImgPipeline(**pipe.components)
for spec in names:
    n, _, seed_override = spec.partition(":")
    tag = f"{n}_{seed_override}" if seed_override else n
    if (out / f"{tag}.png").exists():
        continue
    if n in PORTRAITS:
        ref, prompt, seed, strength = PORTRAITS[n]
        img = i2i(prompt + STYLE, image=canvas(ROOT / "assets" / "reference" / ref), strength=strength, negative_prompt=NEG,
                  num_inference_steps=12, guidance_scale=1.5, generator=torch.Generator().manual_seed(seed)).images[0]
    else:
        prompt, seed, *size = SHOTS[n]
        w, h = size[0] if size else (576, 1024)
        seed = int(seed_override or seed)
        img = pipe(prompt + STYLE, negative_prompt=NEG, width=w, height=h, num_inference_steps=8, guidance_scale=1.5,
                   generator=torch.Generator().manual_seed(seed)).images[0]
    img.save(out / f"{tag}.png")
    print("saved", tag, flush=True)
