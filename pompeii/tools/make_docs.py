"""Generate the shot-driven production docs from pompeii/cues.json (exported from shots.js):

    python3 pompeii/tools/make_docs.py
    -> docs/E_storyboard.md   (shot IDs, timecodes, durations, transitions, on-screen text, SFX)
       docs/F_image_prompts.md (one image-generation prompt per shot, identity-locked)
       docs/G_video_prompts.md (one image-to-video prompt per shot: subject / environment / camera / duration)
       docs/H_camera_transitions.md (camera move + transition per shot)
"""
import json, os
FILM = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(FILM, "docs"); os.makedirs(D, exist_ok=True)
C = json.load(open(os.path.join(FILM, "cues.json")))
TL = json.load(open(os.path.join(FILM, "timeline.json")))

def tc(t): t = max(0, t); return f"{int(t // 60):02d}:{t % 60:05.2f}"
def scene_of(t):
    for s in TL["scenes"]:
        if s["start"] - 0.01 <= t < s["end"]: return s
    return TL["scenes"][-1]

STYLE = ("semi-realistic hand-painted 2D documentary illustration, gouache and oil texture, visible brush strokes on canvas, "
         "cinematic 16:9 composition (1920x1080), layered foreground / midground / background for parallax, "
         "historically accurate 1st-century AD Roman Campania")
NEG = ("no modern buildings, no vehicles, no electric light, no modern clothing, no text, no logos, no watermark, "
       "no cartoon or chibi style, no anime, no gore, no visible bodies, no lava rivers at Pompeii, no extra fingers")
SET = {
    "aerial": "high oblique aerial view from the south-east: the walled town of Pompeii on its low lava spur, terracotta-roofed insulae on a street grid, the Forum, the amphitheatre at the east end, vineyards and the Sarno plain, the Bay of Naples to the west, Mount Vesuvius beyond as a single broad cone (pre-AD 79 profile, green lower slopes)",
    "street": "a Pompeian street at eye level: basalt polygonal paving with cart ruts, raised pavements and stepping stones, two-storey plastered frontages with red lower dado bands, open tabernae with wooden shutter boards, a thermopolium counter with set-in dolia jars, a stone public fountain, painted red electoral notices, projecting tiled eaves, an honorific arch closing the view with Vesuvius beyond",
    "forum": "the Forum of Pompeii looking north: travertine paving, two-storey colonnades on both sides, statue bases, the Temple of Jupiter on its high podium flanked by arches, Vesuvius rising behind",
    "atrium": "the atrium of a wealthy Pompeian house: compluvium opening in the timber roof, marble-edged impluvium pool, Fourth-Style wall painting (red panels with gold frames over a black dado, white upper zone with garlands), a lararium shrine, the tablinum opening onto a colonnaded peristyle garden",
    "map": "an antique parchment map in the style of a hand-drawn atlas: sepia coastlines with soft blue-grey sea, Cinzel-style capital labels, relief hatching for mountains, a compass rose",
    "cutaway": "a painted geological cross-section of Vesuvius: rock strata, a glowing magma reservoir, a conduit rising to the summit, the town on the plain at right",
    "pdc": "a painted side-profile scientific illustration of a volcano: a tall eruption column, its collapse, and a ground-hugging pyroclastic density current racing down the flank",
    "lava": "a split-screen scientific illustration: left a slow incandescent lava flow, right a fast billowing grey pyroclastic current",
    "strata": "a painted archaeological section: the walls of Roman houses buried under labelled layers of white pumice, grey pumice, fine pyroclastic ash and later soil",
    "plan": "a hand-drawn architectural floor plan of a Pompeian domus on aged parchment: fauces, atrium with impluvium, tablinum, peristyle garden, cubicula",
    "calendar": "dark museum table with two documents: a manuscript page of Pliny's letters and a charcoal inscription 'XVI K NOV' on plaster",
    "bay": "the shore at Misenum across the Bay of Naples: a villa terrace and an umbrella pine (Pinus pinea) in the foreground, calm sea, the distant coast with Vesuvius and its eruption column on the horizon",
    "slopes": "the lower slopes of Vesuvius: rows of grapevines converging toward the mountain, cypress trees, farm workers among the vines",
    "archival": "(use the supplied public-domain archival illustration; no generation needed)",
    "finds": "a museum still life on dark cloth: amphora, painted plaster fragment, painted notice, terracotta oil lamp, carbonised round loaf (panis quadratus)",
    "title": "the darkened aerial view of Pompeii at dusk, space for a gold title",
    "end": "a dark warm vignette with a gold compass-medallion emblem (channel end card)",
}
LIGHT = {
    "dawn": "soft dawn light, mist on the plain, warm gold on the rooftops", "street_morning": "warm golden morning sunlight, long soft shadows",
    "market": "bright Mediterranean midday sun", "room": "light shaft falling through the compluvium", "forum": "warm golden light",
    "country": "late golden afternoon", "wind": "brooding overcast light", "quake": "harsh light through rising dust",
    "forum_work": "clear warm daylight", "deep": "illustrative cross-section lighting", "paper": "low museum lamp light",
    "eruption": "daylight turning bruised and amber as the column rises", "street_alarm": "dimming amber light under the spreading cloud",
    "sea": "hazy afternoon light, column lit from the side", "map": "even parchment light", "map_dark": "parchment darkened as if by smoke",
    "pumice": "murky grey-brown half-light, falling pumice", "interior_pumice": "single oil-lamp glow, deep shadows",
    "night_chaos": "night: torchlight and lamp glow in ash fog, volcanic lightning", "interior_quake": "swaying oil-lamp light, dust in the air",
    "eruption_night": "night, incandescent glow at the vent, lightning in the column", "science": "clean illustrative light",
    "rush": "grey dawn under ash", "silence": "flat grey light, thick ash haze", "aftermath": "pale weak sun through smoke, ash-grey palette",
    "time": "time-lapse light, gradually warming", "dig": "18th-century golden afternoon", "museum": "spotlit museum still life",
    "modern_site": "clear present-day sunlight", "evening": "sunset, coral and gold sky", "street_evening": "warm sunset glow down the street", "end": "dark",
}
CHARS = {
    "Marcus": "MARCUS (fictional shopkeeper, ~40, short dark hair, neatly trimmed dark beard, cream knee-length belted tunic, brown wool outer garment over one shoulder, brown leather sandals)",
    "Livia": "LIVIA (fictional, his wife, ~35, dark hair braided and coiled at the nape, muted terracotta ankle-length stola over a cream under-tunic, terracotta palla, Roman sandals)",
    "Julia": "JULIA (fictional, their daughter, ~9, dark curly hair, simple light cream knee-length tunic with a pale belt, small sandals)",
    "Gaius": "GAIUS (fictional elderly neighbour, ~65, short grey hair, grey stubble, weathered lined face, faded brown tunic, slight stoop, wooden walking staff)",
}
CAM = {
    "1A": "slow descending aerial push-in (drone-style), 8 s", "1B": "slow forward dolly at eye level, slight pan right", "1C": "low aerial glide toward the mountain",
    "1D": "gentle lateral drift, medium-wide on the shopfront", "1E": "tilt up + slow zoom from street to Vesuvius", "2A": "map zoom: Mediterranean > Italy > Campania",
    "2B": "lateral tracking past shopfronts", "2C": "forward glide through the atrium", "2D": "slow push across the Forum", "2E": "slow push into the vineyard toward the mountain",
    "3A": "slow aerial drift along the cone", "3B": "locked-off wide with earthquake shake", "3C": "slow lateral drift", "3D": "static diagram, animated elements", "3E": "pan right from mountain to town",
    "4A": "static, document slides in", "4B": "static, second document slides in", "4C": "extreme wide, slow pull-back with impact shake", "4D": "low-angle tilt up", "4E": "slow push and pan across the bay",
    "4F": "over-the-shoulder, slight push", "4G": "steep tilt up to the sky", "4H": "close-up, very slow push", "4I": "wide aerial slow pull-back", "5A": "map: slow push",
    "5B": "slow forward creep at street level", "5C": "high wide, slow push", "5D": "slow push in on the family", "5E": "tracking behind fleeing figures", "5F": "slow push on huddled figures",
    "5G": "low angle on roof line, shake on collapse", "5H": "tracking behind the family", "6A": "wide aerial time-lapse, locked", "6B": "slow forward creep", "6C": "static wide, impact shake",
    "6D": "static wide", "6E": "slow push into the fog", "6F": "slow push, gentle shake", "6G": "slow aerial pull-back", "7A": "static diagram", "7B": "static diagram, flow animates",
    "7C": "split screen, static", "7D": "static map", "7E": "extreme wide, locked", "7F": "slow push down onto the toy, fade to grey", "8A": "slow aerial pull-back", "8B": "static section, layers build",
    "8C": "slow push across the empty Forum", "8D": "static map, pins drop", "8E": "slow aerial pull-back", "9A": "locked aerial time-lapse", "9B": "static section", "9C": "slow aerial pull-back, time-lapse",
    "9D": "high aerial, x-ray reveal", "10A": "slow push over the trench", "10B": "Ken Burns pan/zoom", "10C": "Ken Burns pan/zoom", "10D": "static, cards rise in", "10E": "crane down as the deposit drops",
    "10F": "slow aerial glide", "11A": "slow forward dolly, divider wipe", "11B": "low static on the paving", "11C": "static, plan draws on", "11D": "slow lateral glide along the wall", "11E": "slow aerial glide",
    "11F": "slow forward dolly", "12A": "slow backward dolly as the family approaches", "12B": "aerial pull-back", "12C": "aerial push-in", "12D": "slow forward dolly", "12E": "static", "12F": "static",
}
MOTION = {
    "street": "crowd walking with natural gait, cloth swaying, dust motes drifting, light flicker on plaster",
    "aerial": "drifting haze, slow cloud shadows across fields, smoke or column billowing where present",
    "atrium": "light shaft shimmering, water rippling in the impluvium, curtains stirring",
    "forum": "people crossing the square, pigeons, banners stirring",
    "map": "labels and routes draw on, sea texture gently moving",
    "bay": "sea ripples, pine needles stirring, the distant column slowly billowing",
    "slopes": "vine leaves stirring, workers picking grapes",
}

rows, fp, gp, hp = [], [], [], []
for s in C["shots"]:
    d = s["t1"] - s["t0"]; sc = scene_of(s["t0"])
    vo = " ".join(l["text"] for l in sc["lines"] if l["start"] < s["t1"] and l["end"] > s["t0"])
    onscreen = "; ".join(x for x in [("TITLE: POMPEII / The City That Disappeared in One Day" if s["title"] else None), (" / ".join(s["lower"]) if s["lower"] else None), (s["stamp"] or None), (s["caption"] or None)] if x)
    rows.append(f"| {s['id']} | {sc['id']} | {tc(s['t0'])} | {d:.1f}s | {s['set']} | {s['desc']} | {s['tin'][0]} {s['tin'][1]}s | {onscreen or '-'} | {', '.join(x[1] for x in s['sfx']) or '-'} · amb: {s['amb']} | {s['tag'] or '-'} |")
    who = [v for k, v in CHARS.items() if k in s["desc"] or (k == "Julia" and "toy" in s["desc"]) or ("family" in s["desc"] and k in ("Marcus", "Livia", "Julia"))]
    if "Gaius" in s["desc"] and CHARS["Gaius"] not in who: who.append(CHARS["Gaius"])
    if s["set"] == "archival":
        fp.append(f"### {s['id']} · {tc(s['t0'])} · {d:.1f}s\nUse the supplied public-domain archival image (`assets/archival/`). No generation. Credit on screen: see shots.js.\n")
    else:
        fp.append(f"### {s['id']} · {tc(s['t0'])} · {d:.1f}s · {s['set']}\n**Prompt:** {s['desc']} Setting: {SET.get(s['set'], '')}. Lighting: {LIGHT.get(s['amb'], '')}."
                  + (f" Characters (keep identical to the reference sheets): {'; '.join(who)}." if who else "")
                  + f" Style: {STYLE}.\n\n**Negative:** {NEG}.\n\n**Label in edit:** {s['tag'] or 'none'}\n")
    gp.append(f"### {s['id']} · {d:.1f}s\n- **Start frame:** the {s['id']} still (docs/F).\n- **Subject motion:** {('the characters as described: ' + s['desc']) if who else s['desc']}\n- **Environmental motion:** {MOTION.get(s['set'], 'subtle drifting particles and light')}"
              + (", falling ash and pumice" if s["amb"] in ("pumice", "night_chaos", "interior_pumice") else "") + f"\n- **Camera:** {CAM.get(s['id'], 'slow push')}\n- **Duration:** {d:.1f} s (generate {min(10, max(4, round(d + 1)))} s and trim)\n- **Keep:** faces, hairstyles and clothing identical to the reference sheets; no morphing; no new people entering frame unless stated; no text.\n")
    hp.append(f"| {s['id']} | {tc(s['t0'])} | {CAM.get(s['id'], '-')} | {s['tin'][0]} ({s['tin'][1]} s) |")

hdr = "| Shot | Scene | In | Dur | Set | Action / visual | Transition in | On-screen text | SFX · ambience | Honesty label |\n|---|---|---|---|---|---|---|---|---|---|\n"
open(os.path.join(D, "E_storyboard.md"), "w").write(
    "# E. Storyboard and shot list\n\nGenerated from `shots.js` by `tools/make_docs.py` (do not edit by hand; edit shots.js and re-run).\n"
    f"Total: {len(C['shots'])} shots · {TL['duration']:.1f} s ({TL['duration'] / 60:.2f} min) · 1920x1080 · 30 fps.\n\n"
    "Every shot is anchored to a narration line, so retiming the voice-over retimes the picture.\n\n" + hdr + "\n".join(rows) + "\n")
open(os.path.join(D, "F_image_prompts.md"), "w").write(
    "# F. Image-generation prompts (one per shot)\n\nUse these to replace the code-painted plates with premium painted frames in any image model "
    "(Midjourney, Flux, Imagen, SDXL...). Generate at 1920x1080 or larger. Feed the character sheets in `deliverables/characters/` "
    "as image references for every shot with a named character, and keep the same seed/style reference across a scene.\n\n"
    "**Global style suffix:** " + STYLE + "\n\n**Global negative:** " + NEG + "\n\n" + "\n".join(fp))
open(os.path.join(D, "G_video_prompts.md"), "w").write(
    "# G. Image-to-video animation prompts (one per shot)\n\nFor Runway / Kling / Veo / Pika-style image-to-video. Start from the F still, describe motion only. "
    "Keep moves slow and physically plausible; the edit's own transitions (H) join the clips.\n\n" + "\n".join(gp))
open(os.path.join(D, "H_camera_transitions.md"), "w").write(
    "# H. Camera movements and transitions\n\n## Grammar\n- Default join is a **dissolve** (0.5-1.2 s): documentary pacing, continuous time.\n"
    "- **Hard cuts** only on impacts and shocks (earthquake, eruption blast, collapses) so the cut itself is the hit.\n"
    "- **Dip to black** marks a change of mode (into evidence or science sections).\n- **Whip** (both shots on screen, sliding) for the jump from map to street.\n"
    "- **Wipe** with a gold divider for the lava/PDC comparison and the then/now sequence.\n"
    "- Camera moves are slow eased pushes, pulls, dollies and tilts (ease-in-out sine). Zooms read as dolly moves. Shake only on seismic or impact moments, decaying within ~1 s.\n"
    "- Continuity: adjacent shots share light state (golden > storm > ash > dark > grey > golden > modern > sunset) and screen direction (Vesuvius sits upper-left/centre in every aerial).\n\n"
    "| Shot | In | Camera | Transition in |\n|---|---|---|---|\n" + "\n".join(hp) + "\n")
print("docs E-H written:", len(C["shots"]), "shots")
