"""Photoreal cinematic stills for "The Mistake That Cost Napoleon His Empire", generated locally on CPU.

    python scripts/generate-stills.py <out_dir> [shot ...]

Model: Realistic Vision V5.1 (SD 1.5 fine-tune; CreativeML OpenRAIL-M, commercial use allowed) + sd-vae-ft-mse
+ LCM-LoRA (8 steps), 1024x576. Dramatized reconstructions (not archival): labelled as such in the film.
"""
import sys
from pathlib import Path

import torch
from diffusers import AutoencoderKL, LCMScheduler, StableDiffusionPipeline
from huggingface_hub import hf_hub_download

STYLE = ", cinematic film still, historical war epic, 1812, 35mm film, dramatic lighting, highly detailed, photorealistic"
NEG = ("painting, oil painting, illustration, drawing, sketch, cartoon, anime, 3d render, cgi, text, watermark, logo, "
       "modern clothing, deformed, disfigured, extra limbs, extra fingers, blurry, lowres, gore")
SHOTS = {
    "s01_frozen_bridge": ("ragged freezing Napoleonic soldiers in tattered greatcoats crossing a snowy wooden bridge over a frozen river, blizzard, grey dawn", 101),
    "s02_crossing": ("Napoleonic infantry in blue coats and shakos marching across a wooden pontoon bridge over a wide river, summer, flags, crowded, golden sunlight", 102),
    "s03_cannon_snow": ("abandoned cannon half buried in deep snow on a frozen plain, crows, broken wagon wheel, bleak winter light", 103),
    "s04_napoleon_horse": ("Napoleon Bonaparte on a white horse in grey greatcoat and black bicorne hat on a snowy road, army behind him, somber, overcast", 104),
    "s05_napoleon_map": ("Napoleon Bonaparte in green military uniform studying a large map on a desk, candlelight, palace study", 105),
    "s06_navy": ("British ships of the line under full sail on a stormy sea, cannons, sea spray, overcast", 106),
    "s07_port": ("quiet European harbor with idle sailing ships and stacked barrels on the quay, soldiers guarding, overcast morning", 107),
    "s08_tsar": ("Tsar Alexander I of Russia in white and green imperial uniform with epaulettes standing in a grand palace hall, chandeliers", 108),
    "s09_napoleon_window": ("Napoleon Bonaparte standing at a tall window in a dark palace room, backlit, rain on glass, contemplative", 109),
    "s11_camp": ("vast Napoleonic army encampment at dawn, rows of tents, campfires, rows of cannons and horses, soldiers in blue uniforms, mist", 111),
    "s12_nations": ("row of Napoleonic soldiers in different colorful uniforms marching on a summer road, lancers with pennants, golden eagle standard", 112),
    "s13_ford": ("Napoleonic cavalry crossing a river, water splashing, summer, banners, long columns of infantry behind", 113),
    "s14_burning_village": ("Russian wooden village burning on a summer plain, Cossack horsemen riding away, columns of smoke", 114),
    "s15_wagons": ("long column of horse-drawn supply wagons on a dusty dirt road, exhausted Napoleonic soldiers pushing a stuck cart, hot summer", 115),
    "s16_heat": ("exhausted Napoleonic soldiers collapsed by a dusty roadside in blazing summer heat, drinking from canteens, sick men", 116),
    "s17_horses": ("fallen dead horses along a dusty road, abandoned supply cart, Napoleonic army marching past in the distance, hazy heat", 117),
    "s19_smolensk": ("old Russian walled city burning at night, flames and smoke, silhouettes of Napoleonic soldiers in the foreground", 119),
    "s20_kutuzov": ("elderly heavy Russian general with white hair and a scarred right eye, dark green uniform with medals, sitting in a tent, candlelight", 120),
    "s22_borodino": ("French cuirassiers in steel helmets on horseback charging with sabers raised through cannon smoke, Napoleonic battle, earthworks", 222),
    "s23_aftermath": ("battlefield at dusk, smoke drifting over a field with broken cannons and fallen soldiers in Napoleonic uniforms, somber", 123),
    "s24_guard": ("French Imperial Guard grenadiers in tall bearskin hats standing in ranks in reserve, battle smoke behind them", 124),
    "s25_russian_army": ("Russian infantry in dark green Napoleonic era uniforms marching away on a road, wounded men on carts, overcast", 125),
    "s26_moscow_view": ("Napoleon Bonaparte on horseback on a hill overlooking Moscow, golden onion domes and the Kremlin in the distance, September afternoon", 126),
    "s27_moscow_fire": ("Moscow burning at night in 1812, onion domes silhouetted against huge flames, sparks, smoke, empty street", 127),
    "s28_kremlin_desk": ("Napoleon Bonaparte alone at a desk writing a letter by candlelight, orange fire glow through the window, night", 128),
    "s29_letter": ("sealed letter with a red wax seal lying on a polished table in a palace, single candle, dark moody", 129),
    "s31_napoleon_close": ("close-up portrait of Napoleon Bonaparte in a bicorne hat, tired thoughtful expression, smoke behind, cinematic lighting", 131),
    "s32_leaving": ("long column of Napoleonic soldiers and carts loaded with goods leaving a burned city, autumn, grey sky, smoke", 132),
    "s34_blizzard": ("Napoleonic army marching through a blizzard on a snowy road, soldiers wrapped in blankets, horses struggling, white-out", 134),
    "s35_frozen_soldier": ("close-up of a freezing Napoleonic soldier with frost on his face and shako, thin uniform, snow falling", 135),
    "s36_abandoned": ("abandoned cannons and wagons in deep snow beside a road, Napoleonic retreat, grey winter, crows", 136),
    "s37_cossacks": ("Russian Cossack cavalry with lances charging out of a snowy birch forest, Napoleonic soldiers fleeing, winter", 137),
    "s38_campfire": ("Napoleonic soldiers huddled around a small campfire in deep snow at night, freezing, wrapped in blankets", 138),
    "s40_pontonniers": ("soldiers standing chest-deep in an icy river building a wooden bridge, ice floes, winter, Napoleonic engineers", 140),
    "s41_bridge_chaos": ("crowd of desperate Napoleonic soldiers on a narrow wooden bridge over an icy river, snow, smoke, wagons", 141),
    "s42_sleigh": ("horse-drawn sleigh racing across a snowy plain at night, lanterns, a cloaked figure in a bicorne hat, moonlight", 142),
    "s43_rearguard": ("French officer with a musket leading a few soldiers firing in the snow, rear guard, burning village behind, winter dusk", 143),
    "s45_leipzig": ("Prussian infantry in dark blue Napoleonic uniforms advancing with bayonets through cannon smoke, autumn field, town behind", 145),
    "s46_elba": ("small Mediterranean island with a stone fortress at sunset, sailing ship, calm sea", 146),
    "s47_waterloo": ("Napoleon Bonaparte seen from behind on a horse on a muddy ridge, storm clouds, battle lines below", 147),
    "s48_eagle": ("golden French imperial eagle standard lying in the snow on a frozen battlefield, crows, cold dawn light", 148),
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
