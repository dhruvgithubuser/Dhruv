"""Photoreal cinematic stills for "Trafalgar 1805: What Happened and Why", generated locally on CPU.

    python scripts/generate-stills.py <out_dir> [shot ...]

Model: Realistic Vision V5.1 (SD 1.5 fine-tune; CreativeML OpenRAIL-M, commercial use allowed) + sd-vae-ft-mse
+ LCM-LoRA (8 steps), 1024x576. Dramatized reconstructions (not archival): labelled as such in the film.
"""
import sys
from pathlib import Path

import torch
from diffusers import AutoencoderKL, LCMScheduler, StableDiffusionPipeline
from huggingface_hub import hf_hub_download

STYLE = ", cinematic film still, Napoleonic era 1805, 35mm film, dramatic natural light, highly detailed, photorealistic"
NEG = ("painting, oil painting, illustration, drawing, sketch, cartoon, anime, 3d render, cgi, text, watermark, logo, frame, border, "
       "modern ship, steel ship, steamship, battleship, funnel, smokestack, electric lamp, picture frame, framed, modern clothing, deformed, disfigured, extra limbs, extra fingers, blurry, lowres, gore, blood, duplicate, split image")
SHOTS = {
    "t01_fleet_dawn": ("fleet of wooden ships of the line under full sail at dawn on a calm sea, golden light, sailing warships", 7001),
    "t02_headland": ("rocky headland on the coast of southern Spain at dawn, calm sea, tiny sailing warships far on the horizon", 7002),
    "t03_napoleon": ("Napoleon Bonaparte in a grey greatcoat and black bicorne hat standing alone on a cliff at night looking across the sea, wind, moonlight", 7003),
    "t04_boulogne": ("huge military camp on the French coast with thousands of soldiers and rows of flat-bottomed invasion barges on the beach, overcast", 7004),
    "t05_blockade": ("British wooden warships patrolling off a French harbour in rough grey sea, blockade, wind, spray", 7005),
    "t06_chart_room": ("French naval officers of 1805 wearing black bicorne hats and long dark blue tailcoats with gold epaulettes around a table covered with old sea charts, candles, dark wood room", 7106),
    "t07_villeneuve": ("anxious French admiral of 1805 with powdered grey hair wearing a black bicorne hat and a dark blue tailcoat with gold epaulettes, standing alone at the wooden rail of a sailing warship, worried face, grey sea", 7107),
    "t08_atlantic": ("fleet of wooden sailing warships crossing the open Atlantic ocean under a stormy sky, big swells", 7008),
    "t09_caribbean": ("wooden sailing warships anchored off a Caribbean island with palm trees and turquoise water, bright sun", 7009),
    "t10_cadiz": ("white walled harbour city of Cadiz in Spain with many wooden warships at anchor, evening light", 7010),
    "t11_army_march": ("Napoleonic French army columns marching away along a dusty country road inland, seen from behind, banners", 7011),
    "t12_frigate": ("fast sailing frigate on watch off a coastline at dusk, a lookout with a telescope in the rigging", 7012),
    "t13_gun_deck_crew": ("dark lower gun deck of an 1805 wooden warship with a long row of black iron cannons, young sailors in striped shirts and neckerchiefs crouching nervously beside the guns, lantern light, low ceiling beams", 7113),
    "t14_letter": ("French admiral in uniform reading a letter by candlelight in his ship cabin, shocked expression", 7014),
    "t15_leave_harbour": ("line of wooden warships slowly leaving a harbour in very light wind, sails hanging half full, calm water", 7015),
    "t16_line_battle": ("two parallel lines of wooden sailing warships firing broadsides at each other, white cannon smoke, wide view", 7016),
    "t17_dinner": ("naval officers in 1805 blue uniforms around a candlelit dinner table in a ship's great cabin, an admiral with one arm explaining a plan, wine glasses", 7017),
    "t18_bow_on": ("view from the bow of a wooden warship sailing straight toward a long line of enemy warships, cannon smoke ahead, tense", 7018),
    "t19_lookout": ("sailor lookout high in the rigging of a warship at dawn pointing at a distant line of enemy sails on the horizon", 7019),
    "t20_signal_flags": ("colourful signal flags being hoisted up the mast of a wooden warship, sailors hauling ropes, blue sky", 7020),
    "t21_gun_crew": ("sailors loading a heavy cannon on the gun deck of a ship of the line, gunpowder smoke, sweat, lantern light", 7021),
    "t22_breakthrough": ("great three-deck wooden warship under full sail cutting through a line of enemy ships, firing both sides, thick smoke", 7022),
    "t23_dismasted": ("dismasted wooden warship with broken masts and wreckage, still flying a British flag, cannon smoke around", 7023),
    "t24_wheel": ("shattered ship's wheel on the quarterdeck of a wooden warship, splinters and smoke, damage", 7024),
    "t25_raking": ("two old wooden sailing ships of the line with tall masts and canvas sails at close range, one firing a broadside of cannons into the carved wooden stern of the other, orange muzzle flashes, white smoke, 1805", 7125),
    "t26_locked": ("two wooden warships locked together side by side, rigging tangled, sailors fighting on deck, smoke", 7026),
    "t27_marksman": ("French marksman in the fighting top of a warship mast aiming a musket down at the deck below, smoke, ropes", 7027),
    "t28_admiral_falls": ("officers rushing to a fallen admiral in a blue coat on the deck of a wooden warship, smoke, chaos", 7028),
    "t29_cockpit": ("dim lower deck of a wooden warship lit by lanterns, wounded sailors lying in rows, a surgeon working", 7029),
    "t30_boarders": ("sailors with cutlasses and muskets crowding the rail ready to board an enemy ship, smoke, chaos", 7030),
    "t31_surrender": ("flag being lowered on a battered wooden warship, smoke clearing, defeated sailors", 7031),
    "t32_giant_ship": ("enormous old wooden Spanish sailing ship of the line with four rows of gun ports, three tall masts and full canvas sails, hull painted dark red and black, firing its cannons in battle, white smoke, 1805", 7132),
    "t33_sail_away": ("group of wooden sailing warships sailing away from a distant battle, smoke on the horizon", 7033),
    "t34_explosion": ("wooden warship exploding in a huge fireball at sea, debris flying, smoke, late afternoon", 7034),
    "t35_storm": ("real photograph style, wooden sailing warships with broken masts tossed by huge waves in a violent storm at night, rain, lightning, dark sea, full frame", 7135),
    "t36_wreck": ("wrecked wooden warship broken on rocks near a coast in a storm, survivors clinging to the rocks", 7036),
    "t37_after_storm": ("calm sea at dawn after a storm with floating debris and a battered warship, quiet, mist", 7037),
    "t38_ulm": ("Napoleon on horseback receiving surrendering Austrian officers in white uniforms, autumn, army behind", 7038),
    "t39_inn": ("rustic 1806 French country inn bedroom at night, rough stone walls, wooden beams, a simple wooden bed, a single tallow candle on a wooden table, deep shadows, sinister, no electric lamps", 7139),
    "t40_austerlitz": ("Napoleonic battlefield in winter fog at sunrise, columns of soldiers advancing, frost", 7040),
    "t41_ship_home": ("single great wooden warship with damaged rigging sailing home into an English harbour under grey sky, flags at half mast", 7041),
    "t42_fleet_glory": ("fleet of British wooden warships sailing on a sunny sea with Union flags flying, proud, wide view", 7042),
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
