"""Photoreal cinematic stills for "The Trial After Little Bighorn" (Custer, 1876 / Reno Court of Inquiry, 1879), generated locally on CPU.

    python scripts/generate-stills.py <out_dir> [shot ...]

Model: Realistic Vision V5.1 (SD 1.5 fine-tune; CreativeML OpenRAIL-M, commercial use allowed) + sd-vae-ft-mse
+ LCM-LoRA (8 steps), 1024x576. Dramatized reconstructions (not archival): labelled as such in the film.
"""
import sys
from pathlib import Path

import torch
from diffusers import AutoencoderKL, LCMScheduler, StableDiffusionPipeline
from huggingface_hub import hf_hub_download

STYLE = ", cinematic film still, American West 1870s, 35mm film, dramatic natural lighting, highly detailed, photorealistic"
NEG = ("painting, oil painting, illustration, drawing, sketch, cartoon, anime, 3d render, cgi, text, watermark, logo, "
       "modern clothing, deformed, disfigured, extra limbs, extra fingers, blurry, lowres, gore, blood")
SHOTS = {
    "c01_chicago": ("snowy city street in 1879 Chicago at night, gas street lamps, horse drawn carriages, brick buildings, people in long coats and top hats", 401),
    "c02_court": ("grand hotel ballroom turned into a military courtroom, 1879, US army officers in dark blue uniforms seated behind a long table, gaslight chandeliers, wood paneling", 402),
    "c03_reno": ("middle aged US army cavalry major with a dark mustache in a dark blue 1870s uniform sitting alone at a wooden table, tense, looking down, dim courtroom", 403),
    "c04_papers": ("pile of old 1870s newspapers and letters on a wooden desk lit by an oil lamp, ink bottle, dramatic shadows", 404),
    "c05_markers": ("white marble grave markers scattered across a grassy hillside in Montana, wind in the tall grass, overcast sky, rolling hills", 405),
    "c06_jury": ("empty wooden chairs in an old courtroom, beams of light through tall windows, dust in the air, quiet", 406),
    "c07_general": ("young cavalry general with long golden curly hair and a red neckerchief on a horse, Civil War era, battlefield smoke behind, confident", 407),
    "c10_expedition": ("long column of US cavalry and white canvas wagons winding through pine covered hills, 1874, dust, sunlight", 410),
    "c11_gold": ("hands of a miner holding a gold pan with gold flakes in a mountain stream, 1870s, close up", 411),
    "c12_council": ("Lakota elders sitting in a circle inside a large tipi in council, firelight, serious faces, 1870s, dignified", 412),
    "c13_column": ("long column of US cavalry troopers in blue shirts and wide brimmed hats riding across open prairie, 1876, dust, guidon flags", 413),
    "c14_gatling": ("Gatling gun on a wheeled carriage pulled by four horses across the prairie, 1876, soldiers walking alongside", 414),
    "c15_ravine": ("soldiers struggling to push a heavy wheeled gun carriage through a rocky ravine, 1870s, sweat, dust", 415),
    "c16_agency": ("clerk in a waistcoat writing in a large ledger at a desk in a frontier government office, 1876, window light", 416),
    "c17_village": ("vast camp of hundreds of white tipis along a winding river in a green valley, smoke from fires, large horse herd, 1876, wide view", 417),
    "c18_scouts": ("Native American army scouts on a hilltop at dawn, one looking through a brass telescope toward a distant valley, mist, sunrise", 418),
    "c19_custer_back": ("cavalry officer in a buckskin jacket seen from behind on horseback looking down into a valley, other riders behind him, dust, summer", 419),
    "c20_charge": ("US cavalry troopers charging on horses across a shallow river, water splashing, 1876, cottonwood trees, dust", 420),
    "c21_skirmish": ("dismounted cavalry soldiers kneeling in tall grass firing carbines, gun smoke, 1876, tense", 421),
    "c22_timber": ("soldiers taking cover among cottonwood trees by a river, smoke drifting, chaos, 1876", 422),
    "c23_bluffs": ("cavalry soldiers and horses scrambling up steep dusty bluffs above a river in retreat, panic, dust clouds, 1876", 423),
    "c24_witness": ("army officer standing in a courtroom giving testimony with his right hand raised, 1879, gaslight, officers watching", 424),
    "c25_trumpeter": ("lone cavalry trumpeter galloping across grassy hills carrying a message, 1876, dust trail, urgency", 425),
    "c26_hill": ("exhausted soldiers digging shallow rifle pits on a dusty hilltop, pack mules and saddles piled as barricade, 1876", 426),
    "c27_riders": ("Lakota and Cheyenne warriors on horseback on a ridge, eagle feather headdresses, war shields, dust, golden light, dignified", 427),
    "c28_dawn_tipi": ("single painted tipi on the prairie at dawn, smoke rising, figure wrapped in a blanket standing beside it, quiet, 1876", 428),
    "c29_horseman": ("lone Native American horseman silhouetted on a ridge at sunset, wind, long shadows", 429),
    "c31_dust": ("chaotic battle on a dusty grassy hillside, silhouettes of cavalry soldiers and horses in thick dust and smoke, 1876", 431),
    "c33_weir": ("cavalry company on a high ridge looking north at distant dust and smoke clouds, 1876, worried officers, afternoon", 433),
    "c34_relief": ("column of infantry soldiers and officers on horses arriving through a river valley in the morning, 1876, solemn", 434),
    "c36_testimony": ("thick stack of handwritten testimony pages tied with string on a desk, quill pen, ink, oil lamp, 1879", 436),
    "c37_verdict": ("senior army colonel with a grey beard reading a document aloud in a courtroom, 1879, officers listening, gaslight", 437),
    "c38_barracks": ("group of cavalry enlisted men talking quietly in a frontier barracks at night, lamp light, wary faces, 1879", 438),
    "c39_alone": ("lonely old man in a worn coat sitting by a window in a dim boarding house room, 1880s, rain outside", 439),
    "c40_honors": ("honor guard firing a rifle salute at a funeral in a cemetery on a grassy hill, white grave markers, 1960s, flag", 440),
    "c42_hills": ("Black Hills of South Dakota at dusk, pine covered mountains, mist in the valleys, dramatic sky", 442),
    "c45_writer": ("writer with mutton chop whiskers writing a book manuscript by lamplight in a cluttered 1876 study, books and newspapers, focused", 445),
    "c46_washita": ("US cavalry riding through deep snow at dawn toward a river valley with tipis and rising smoke, winter 1868, grey light, distant", 446),
    "c48_rosebud": ("distant battle on rolling green hills by a creek, cavalry and mounted warriors in clouds of dust and gun smoke, 1876, wide shot", 448),
    "c49_packer": ("rough civilian mule packer with a beard in a buckskin shirt testifying in a 1879 courtroom, pointing, officers watching from a long table", 449),
    "c50_packtrain": ("long line of pack mules loaded with wooden ammunition boxes on a dusty trail, soldiers leading them, 1876, hot afternoon", 450),
    "c51_archaeology": ("archaeologists with metal detectors and small red marker flags on a burned blackened grassland hill, 1984, overcast", 451),
    "c52_comanche": ("badly wounded bay cavalry horse standing alone on an empty grassy battlefield in morning mist, saddle still on, somber", 452),
    "c53_widow": ("Victorian widow in a black dress writing at a desk by lamplight, framed portrait of a cavalry officer on the desk, 1880s", 453),
    "c54_memorial": ("modern memorial sculpture of horse riders in dark metal silhouette on a grassy hill at sunset, Montana, wide sky", 454),
    "c55_water": ("soldiers crawling down a steep ravine toward a river carrying canteens and kettles, gun smoke above, 1876, desperate", 455),
    "c56_elder": ("elderly Native American man in a blanket telling a story to a man with a notebook outside a log cabin, early 1900s, warm light", 456),
    "c03b_reno": ("portrait of a single middle aged US army cavalry major with a dark mustache in a dark blue 1870s uniform sitting alone at a wooden table in a dim courtroom, tense, looking down, one man", 503),
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
