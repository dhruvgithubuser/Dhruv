"""Photoreal cinematic stills for "Isandlwana: The Zulu General Who Out-Planned the British Empire" (1879), generated locally on CPU.

    python scripts/generate-stills.py <out_dir> [shot ...]

Model: Realistic Vision V5.1 (SD 1.5 fine-tune; CreativeML OpenRAIL-M, commercial use allowed) + sd-vae-ft-mse
+ LCM-LoRA (8 steps), 1024x576. Dramatized reconstructions (not archival): labelled as such in the film.
"""
import sys
from pathlib import Path

import torch
from diffusers import AutoencoderKL, LCMScheduler, StableDiffusionPipeline
from huggingface_hub import hf_hub_download

STYLE = ", cinematic film still, 1879 Anglo-Zulu War period drama, 35mm film, dramatic natural light, highly detailed, photorealistic"
NEG = ("sombrero, women, female, pyramids, painting, oil painting, illustration, drawing, sketch, cartoon, anime, 3d render, cgi, text, watermark, logo, frame, border, "
       "modern clothing, modern building, car, airplane, steel helmet, camouflage, tank, deformed, disfigured, extra limbs, extra fingers, blurry, lowres, gore, blood, corpse, duplicate, split image")
SHOTS = {
    "i01_mountain_dawn": ('the sphinx-shaped rocky crag of Isandlwana mountain rising above the rolling grassy plains of Zululand at dawn, mist in the valleys, golden light, epic wide landscape', 9001),
    "i02_impi_ridge": ('thousands of Zulu warriors with tall oval cowhide shields and short stabbing spears, wearing traditional headdresses and cow-tail ornaments cresting a grassy ridge in a vast wave, dust, harsh afternoon sun, epic wide shot', 9002),
    "i03_redcoats_line": ('a line of British infantry in red tunics, white foreign-service helmets and Martini-Henry rifles kneeling and firing, white gunsmoke drifting over the grassland, afternoon', 9003),
    "i04_ultimatum_tree": ('a huge old fig tree beside a wide river in Natal, British colonial officials in 1878 civilian suits reading a long document aloud to a group of Zulu envoys seated on the grass, December heat', 9004),
    "i05_frere": ('Victorian colonial governor in his sixties with a grey beard and dark frock coat, writing at a desk covered with papers and maps, oil lamp, stern expression, 1878', 9005),
    "i06_crossing": ('a long British army column crossing a river ford, ox wagons and British infantry in red tunics, white foreign-service helmets and Martini-Henry rifles wading through brown water, overcast sky, January 1879', 9006),
    "i07_cetshwayo": ('a heavy-set dignified African king in his late forties, seated on a carved stool inside a great royal homestead of beehive huts, wearing a leopard-skin cape and a headring, attendants around him, 1879', 9007),
    "i08_council": ('elderly Zulu commanders with headrings and leopard-skin capes seated in a circle inside a great homestead enclosure, deep in discussion, firelight, dusk', 9008),
    "i09_ntshingwayo": ('an elderly Zulu general in his seventies with grey hair and a headring, leopard-skin cape, calm wise determined expression, holding a staff, standing on a hilltop at dusk with a vast army camped below', 9009),
    "i10_army_gathers": ('tens of thousands of Zulu warriors with tall oval cowhide shields and short stabbing spears, wearing traditional headdresses and cow-tail ornaments assembled by regiment, each regiment with shields of a different colour, at a vast royal homestead, dust in the air, 1879', 9010),
    "i11_march": ('long columns of Zulu warriors with tall oval cowhide shields and short stabbing spears, wearing traditional headdresses and cow-tail ornaments jogging fast through tall golden grass in loose open formation across rolling hills, morning', 9011),
    "i12_camp": ('a large British army camp at the foot of a sphinx-shaped rocky mountain, rows of white bell tents, parked ox wagons, British infantry in red tunics, white foreign-service helmets and Martini-Henry rifles walking between tents, afternoon, wide shot', 9012),
    "i13_wagons": ('ox wagons standing unhitched in a sprawling army camp, oxen grazing, white bell tents, no defensive circle, soldiers resting in the sun, 1879', 9013),
    "i14_chelmsford": ('a tall Victorian British general in his fifties, balding with a dark beard, blue patrol jacket, looking through a field telescope from a grassy hill, staff officers behind him, 1879', 9014),
    "i15_valley_hidden": ('thousands of Zulu warriors with tall oval cowhide shields and short stabbing spears, wearing traditional headdresses and cow-tail ornaments sitting silently in a deep grassy valley, shields resting on the ground, no fires, early morning mist, hidden', 9015),
    "i16_night_march": ('British infantry in red tunics, white foreign-service helmets and Martini-Henry rifles marching out of a camp in the dark before dawn, lanterns, silhouettes against a pale sky, 1879', 9016),
    "i17_pulleine": ('a British lieutenant colonel with a moustache in a red tunic and white helmet standing among white bell tents, reading a note, worried, 1879', 9017),
    "i18_durnford": ('a Victorian British army colonel with a long drooping moustache in a dark blue patrol jacket and white sun helmet, riding a brown horse at the head of a column of African mounted troops with carbines, grassland, 1879', 9118),
    "i19_patrol": ('mounted colonial troopers in dark uniforms and slouch hats riding over a high grassy plateau, scanning the horizon, 1879', 9019),
    "i20_discovery": ('mounted troopers on horses at the edge of a deep valley, looking down in shock at thousands of Zulu warriors with tall oval cowhide shields and short stabbing spears, wearing traditional headdresses and cow-tail ornaments rising up from the grass below', 9020),
    "i21_warriors_rise": ('close-up of Zulu warriors with tall oval cowhide shields and short stabbing spears, wearing traditional headdresses and cow-tail ornaments rising from the long grass with shields raised, dust, fierce determined faces, intense, adult male warriors, muscular men', 9121),
    "i22_horns_run": ('Zulu warriors with tall oval cowhide shields and short stabbing spears, wearing traditional headdresses and cow-tail ornaments running at full speed across a grassy plain in a long curving line, flanking, dust trail, aerial-like wide shot', 9022),
    "i23_firing_line": ('British infantry in red tunics, white foreign-service helmets and Martini-Henry rifles spread far apart in a long thin firing line in open grassland, firing toward a distant dark mass of warriors, gunsmoke, wide shot', 9023),
    "i24_rocket": ('British soldiers firing a Hale war rocket from a trough on a grassy slope, bright smoke trail across the sky, 1879', 9024),
    "i25_guns": ('two British field guns firing on a grassy slope below a rocky mountain, gunners in dark blue uniforms, white smoke, 1879', 9025),
    "i26_warriors_ground": ('Zulu warriors with tall oval cowhide shields and short stabbing spears, wearing traditional headdresses and cow-tail ornaments lying flat in the long grass under rifle fire, shields held over their heads, dust kicked up around them', 9026),
    "i27_ammo": ('British infantry in red tunics, white foreign-service helmets and Martini-Henry rifles running between white bell tents carrying heavy wooden ammunition boxes, urgency, 1879', 9027),
    "i28_ammo_box": ('close-up of hands opening a heavy wooden ammunition box with brass screws, packets of cartridges inside, gunsmoke drifting, 1879', 9028),
    "i29_chest_charge": ('a massed charge of Zulu warriors with tall oval cowhide shields and short stabbing spears, wearing traditional headdresses and cow-tail ornaments rushing straight toward the camera with shields and spears, dust, motion, 1879', 9029),
    "i30_eclipse": ('the sun partly eclipsed in a dim afternoon sky over a smoky battlefield below a sphinx-shaped rocky mountain, eerie bronze light', 9030),
    "i31_melee_tents": ('chaos among white bell tents, thick gunsmoke, running silhouettes of soldiers and warriors, a collapsing tent, eerie dim light, 1879', 9031),
    "i32_last_stand": ('a small group of British infantry in red tunics, white foreign-service helmets and Martini-Henry rifles standing back to back with fixed bayonets on a rocky slope, thick smoke around them, last stand', 9032),
    "i33_flight": ('men on foot and on horseback fleeing down a steep rocky ravine toward a river, 1879, dust and panic', 9033),
    "i34_river": ('a flooded fast-flowing brown river between rocks, men and horses struggling to cross, spray, 1879', 9034),
    "i35_colour": ('two young British officers on horseback galloping down a rocky slope, one carrying a furled regimental colour in a leather case, 1879', 9035),
    "i36_dusk_field": ('a silent abandoned battlefield at dusk below a large rocky crag, overturned wooden ox wagons, collapsed torn canvas bell tents, thin smoke rising, crows circling, grassland', 9136),
    "i37_chelmsford_return": ('a British general and British infantry in red tunics, white foreign-service helmets and Martini-Henry rifles arriving at dusk at a destroyed camp, shocked faces, torn tents, 1879', 9037),
    "i38_rorkes": ('a small mission station with a thatched roof and a stone cattle kraal at night, barricades of biscuit boxes and grain sacks, fires, 1879', 9038),
    "i39_zulu_return": ('exhausted Zulu warriors with tall oval cowhide shields and short stabbing spears, wearing traditional headdresses and cow-tail ornaments walking home across hills at sunset, some carrying captured rifles, 1879', 9039),
    "i40_london": ('Victorian London street in 1879, a newsboy holding up a newspaper, crowd of shocked people in top hats and bonnets, gaslight, rain', 9040),
    "i41_ulundi": ('British infantry in red tunics, white foreign-service helmets and Martini-Henry rifles formed in a hollow square with fixed bayonets on an open plain, gunsmoke, July 1879', 9041),
    "i42_burning": ('a great royal homestead of beehive huts burning on a hill, smoke rising into the sky, 1879', 9042),
    "i43_captive": ('a heavy-set African king seated under guard, British soldiers standing nearby, dignified sad expression, 1879', 9043),
    "i44_old_general": ('an elderly Zulu general with grey hair and a headring sitting alone on a hilltop at sunset, looking over a vast plain, thoughtful', 9044),
    "i45_cairns": ('the sphinx-shaped rocky crag of Isandlwana mountain on a quiet afternoon, small white-painted stone cairns scattered across the grassy slope below, peaceful', 9045),
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
