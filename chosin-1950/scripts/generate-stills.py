"""Photoreal cinematic stills for "Chosin 1950: The Trap MacArthur Was Warned About", generated locally on CPU.

    python scripts/generate-stills.py <out_dir> [shot ...]

Model: Realistic Vision V5.1 (SD 1.5 fine-tune; CreativeML OpenRAIL-M, commercial use allowed) + sd-vae-ft-mse
+ LCM-LoRA (8 steps), 1024x576. Dramatized reconstructions (not archival): labelled as such in the film.
"""
import sys
from pathlib import Path

import torch
from diffusers import AutoencoderKL, LCMScheduler, StableDiffusionPipeline
from huggingface_hub import hf_hub_download

STYLE = ", cinematic film still, Korean War 1950, 35mm film, cold winter light, highly detailed, photorealistic"
NEG = ("painting, oil painting, illustration, drawing, sketch, cartoon, anime, 3d render, cgi, text, watermark, logo, "
       "modern clothing, deformed, disfigured, extra limbs, extra fingers, blurry, lowres, gore, blood, corpse, duplicate, split image")
SHOTS = {
    "k01_marines_snow": ("US Marines in hooded parkas trudging through deep snow on a mountain road at dusk, breath steam, rifles slung, exhausted faces, 1950", 6001),
    "k02_hq": ("military headquarters office in 1950 with a large map of Korea on the wall, officers in uniform, cigarette smoke, desk lamp", 6002),
    "k03_column_north": ("long column of US army trucks and soldiers moving north on a dirt road through brown Korean hills in late autumn 1950, dust", 6003),
    "k04_chinese_crossing": ("thousands of soldiers in padded cotton uniforms crossing a long bridge over a river at night, moonlight, silhouettes, 1950", 6004),
    "k05_hills_snow": ("snow covered mountain ridges in North Korea at dusk with a frozen lake below, bleak, vast, cold", 6005),
    "k06_road": ("narrow gravel mountain road winding between snowy peaks, a few military trucks small in the distance, cold grey sky", 6006),
    "k07_frozen_rifle": ("close up of an M1 rifle and an ammunition belt covered in thick white frost lying in the snow", 6007),
    "k08_medic": ("army medic in a cold tent holding a frozen bottle of blood plasma, breath steam, lantern light, wounded soldier on a cot, 1950", 6008),
    "k09_general_tent": ("American Marine general in a parka studying maps by lantern light inside a tent, serious, calm, 1950", 6009),
    "k10_airstrip": ("Marine engineers with bulldozers carving an airstrip into frozen ground in a snowy valley, 1950, tents in the background", 6010),
    "k11_chinese_ridge": ("soldiers in white camouflage and quilted uniforms lying hidden on a snowy ridge at dusk, watching a road below, 1950", 6011),
    "k12_chinese_cold": ("soldiers in thin quilted cotton uniforms and fur caps huddled together in deep snow, shivering, exhausted, 1950", 6012),
    "k13_night_attack": ("night battle on a snowy ridge, parachute flares in the sky, tracer fire, silhouettes of soldiers charging up the slope, 1950", 6013),
    "k14_foxhole": ("US Marines in parkas firing from a snowy foxhole at night, muzzle flashes, breath steam, fear and determination", 6014),
    "k15_quad_guns": ("American half-track with quad anti-aircraft machine guns firing at night in the snow, tracers, 1950", 6015),
    "k16_fox_hill": ("small group of US Marines dug in on a snowy hilltop above a mountain pass at dawn, exhausted, frost on their faces", 6016),
    "k17_helicopter": ("small military helicopter landing in a snowy army perimeter, a general in a parka stepping out, soldiers watching, 1950", 6017),
    "k18_wounded_trucks": ("army trucks loaded with wounded soldiers under blankets in the snow, medics, grim faces, 1950", 6018),
    "k19_napalm": ("huge orange napalm fireball exploding on a snowy hillside, soldiers diving into the snow, 1950", 6019),
    "k20_ice_walk": ("a few wounded soldiers stumbling across a vast frozen lake in a snowstorm, tiny figures, 1950", 6020),
    "k21_airlift": ("C-47 transport plane on a snowy dirt airstrip, stretchers of wounded soldiers being loaded, 1950, cold sky", 6021),
    "k22_hellfire": ("burning trucks on a snowy valley road at night under attack, fire and smoke, chaos, 1950", 6022),
    "k23_commandos": ("British Royal Marine commandos in green berets and parkas in the snowy mountains of Korea, 1950", 6023),
    "k24_night_march": ("column of US Marines marching single file over snowy mountains at night, moonlight, deep snow, silent", 6024),
    "k25_reporters": ("war correspondents in parkas with notebooks talking to a Marine officer in a snowy camp, 1950", 6025),
    "k26_convoy": ("long military convoy of trucks and tanks with Marines walking alongside on a snowy mountain road, 1950", 6026),
    "k27_corsairs": ("F4U Corsair fighter planes flying low over snowy mountains, 1950", 6027),
    "k28_blown_bridge": ("destroyed bridge over a deep gorge in snowy mountains, broken concrete and twisted steel, 1950", 6028),
    "k29_c119": ("C-119 Flying Boxcar cargo planes dropping huge loads on large parachutes over snowy mountains, 1950", 6029),
    "k30_engineers": ("army engineers assembling a steel bridge over a gorge in the snow, trucks waiting in line behind them, 1950", 6030),
    "k31_crossing": ("military trucks crossing a narrow steel bridge over a deep snowy gorge, 1950, tense", 6031),
    "k32_candy": ("US Marine in a frosty parka eating a piece of candy in the snow, tired faint smile, 1950, close up", 6032),
    "k33_hungnam": ("harbour of Hungnam crowded with navy ships in December 1950, smoke, cranes, snow on the docks", 6033),
    "k34_refugees": ("crowds of Korean refugees in winter clothes carrying bundles on a snowy dock waiting to board ships, 1950", 6034),
    "k37_crosses": ("rows of simple wooden crosses in the snow at dusk, quiet, 1950", 6037),
    "k38_empty_ridge": ("abandoned trenches on a snowy hill at dawn, frozen, silent, mist", 6038),
    "k39_veterans": ("elderly American veterans in caps with Korean War patches saluting at a memorial, autumn", 6039),
    "k40_empty_road": ("empty snowy mountain road at dawn, mist, quiet, tire tracks in the snow", 6040),
    "k41_map": ("large map of Korea on a wall with pins and red arrows, an officer's hand pointing at the north, 1950, lamplight", 6041),
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
    img = pipe(prompt + STYLE, negative_prompt=NEG, width=1024, height=576, num_inference_steps=8, guidance_scale=1.5,
               generator=torch.Generator().manual_seed(seed)).images[0]
    img.save(out / f"{n}.png")
    print("saved", n, flush=True)
