# GTA V Farewell × GTA VI Welcome — 60s Reel Production Kit

Vertical 9:16 · 24 fps · 10 scenes × 6 s · sunset beach promenade

---

## How to make it (the workflow that actually keeps faces consistent)

AI video tools lose a person's identity quickly when they only get text. The approach
that works best for this kind of reel:

1. **Make one keyframe still per scene first** with an image model that accepts several
   reference photos (Gemini / Nano Banana, GPT-image, Seedream, Midjourney Omni-ref…).
   Attach only the references listed for that scene, and fix the still until every face,
   outfit and car is right. This is where you get your likeness right.
2. **Animate each still** with an image-to-video model (Kling, Veo, Seedance, Hailuo /
   MiniMax, Runway), using the still as the **start frame**, and paste the *Motion*
   prompt. Generate 8 s and trim to 6 s; models tend to drift near the end of a clip.
3. **Reuse the last frame** of a clip as the start frame of the next clip when the
   cut is continuous (marked ↪ below). This keeps the location and lighting the same.
4. **Dialogue**: record your own lines on your phone (you sound like you). For the
   other characters, use a model with native audio (Veo / Gemini Omni) or add text
   captions. Lip-sync is optional; most shots below are framed so it isn't needed.
5. **Assemble** with `assemble.sh` (hard cuts, titles, fade to black, music mix), or
   send the 10 clips back to Claude and it can run the script for you.

### Reference images (attach these, not the names)

Image and video models do not reliably know who “Michael” or “Lucia” are, and many
of them refuse prompts that name copyrighted characters. The look comes from the
reference image plus the description, so **every prompt below describes people by
appearance**. Paste the descriptor block for each person in the shot.

| Tag | Reference file | Descriptor to paste |
|---|---|---|
| **[ME]** | your selfie | South Asian man, about 30, full dark beard with a few grey flecks at the chin, thick dark textured hair swept up, clear transparent thick rectangular glasses, small black stud earrings, thin beaded necklace, loose black button overshirt worn open over a plain white crew-neck T-shirt, dark trousers |
| **[GREY SUIT]** | grey blazer pic | white man in his late 40s, dark hair combed back with a receding hairline, light stubble, tailored light-grey blazer, open-collar white dress shirt, grey trousers |
| **[VARSITY]** | green jacket pic | Black man in his mid-20s, close-cropped hair, short beard, green varsity jacket with cream leather sleeves and green-and-white striped cuffs, white T-shirt, dark-blue jeans |
| **[V-NECK]** | white V-neck pic | white man in his late 40s, balding with a receding hairline and messy dark hair at the sides, weathered intense face, worn off-white V-neck T-shirt, a dotted line tattooed across his neck with the words “CUT HERE” |
| **[TROPICAL]** | illustrated pic | white man in his mid-30s, short brown hair, trimmed beard, open blue short-sleeve shirt with a faint palm-tree print over a white T-shirt, silver wristwatch, photorealistic human, not illustrated |
| **[PINK TOP]** | pink top pic | Latina woman in her late 20s, dark wavy hair tied up high, pink long-sleeve crop top, blue patterned (camo-print) jeans, thin gold necklace |
| **[BLACK CAR]** | black car pic | late-1960s black American two-door hardtop coupe, long flat trunk deck, wide full-width chrome rear bumper, glossy black paint |
| **[RED CAR]** | red car pic | 1970 red muscle coupe (Chevelle style) with black vinyl roof, chrome front bumper, quad headlights, white pinstripe along the rocker panel, closed hardtop (not a convertible) |

⚠️ The Lucia and Jason references show a gun. Before attaching, **crop the gun out**
(Lucia: crop above the left hand; Jason: use a face-and-shoulders crop), and keep
“hands empty, no weapons” in the prompt. Otherwise the model will copy the gun in.

### Global style line (append to every prompt)

> Photorealistic live-action cinema, vertical 9:16, shot on 35mm anamorphic, deep
> golden-orange sunset, warm rim light, realistic skin texture and pores, natural
> facial expressions, shallow depth of field, subtle film grain. Location: a seaside
> promenade with a black metal railing, wide sandy beach and calm ocean behind, a tall
> palm-lined two-lane coastal road, and a pier with a Ferris wheel and amusement
> lights in the far distance.

### Global negative / avoid line

> no text, no subtitles, no watermark, no logos, no weapons, no extra people, no
> duplicated faces, no extra fingers, no face morphing, no outfit change, no
> cartoon or video-game render look, no convertible, no floating objects

---

## Scene prompts

### 01 · The Last Sunset · 0–6 s
**Refs:** GREY SUIT, VARSITY, V-NECK
**Keyframe still:** Medium-wide shot. Three men stand side by side at the black metal
beach railing, gazing toward the coastal road on the right. Left: [GREY SUIT]. Centre:
[VARSITY]. Right: [V-NECK]. Ocean glowing orange behind them, sun low on the horizon,
palm trees on the right edge.
**Motion:** Slow aerial descent that settles into a gentle ground-level dolly-in to a
medium-wide shot of the three men. Palm fronds sway in the breeze, waves roll in, hair
moves slightly. The men stay still, with quiet, nostalgic, slightly sad expressions.
**Audio:** soft waves, distant gulls, gentle piano.

### 02 · The Black Car Arrives · 6–12 s
**Refs:** BLACK CAR, ME
**Keyframe still:** Low rear three-quarter view on the palm-lined coastal road: the
[BLACK CAR] drives toward the promenade, sun flaring off its chrome rear bumper.
**Motion:** The camera tracks low behind the car, then arcs around to a front-side
angle as it slows and parks beside the promenade. Through the open driver's window
we see [ME] at the wheel. Smooth, unhurried, realistic suspension movement.
**Audio:** deep vintage V8 rumble, tyres on asphalt, piano continues.

### 03 · The Walk Toward Old Friends · 12–18 s ↪ (from 02)
**Refs:** ME, BLACK CAR
**Keyframe still:** Medium close-up of [ME] standing beside the driver's door of the
parked [BLACK CAR], golden light on his glasses.
**Motion:** He closes the car door, looks off toward the railing, and a small smile
fades into sadness; his eyes become glassy with tears. He starts walking slowly
forward. The camera moves behind his shoulder, revealing the three men from scene 01
waiting at the railing; the one in the grey suit recognises him and smiles.
**Line (ME, record yourself):** “I can't believe it's time to say goodbye.”
**Audio:** footsteps, wind, piano.

### 04 · The First Hug · 18–24 s
**Refs:** ME, GREY SUIT
**Keyframe still:** Medium two-shot at the railing: [GREY SUIT] opens his arms with a
bittersweet smile as [ME] steps in.
**Motion:** The two men share a sincere, natural hug. Both sets of arms wrap around
naturally and the bodies do not merge. [ME] closes his eyes behind his glasses, holding
back tears; the older man pats his back twice. The camera drifts to a close-up over the
grey-suited man's shoulder onto [ME]'s face.
**Line (GREY SUIT):** “It's been one hell of a ride, kid.”
**Audio:** piano, soft wind.

### 05 · Two More Goodbyes · 24–30 s (generate as **two 3 s clips**)
**5a Refs:** ME, VARSITY — Close-up: [VARSITY] pulls [ME] into a warm hug, smiling
sadly, then pats his shoulder.
**5b Refs:** ME, V-NECK — Close-up: [V-NECK], unusually emotional, pulls [ME] into a
strong brotherly hug and briefly closes his eyes; [ME] fights back tears.
**Line (V-NECK):** “Don't forget us, brother.”
**Audio:** orchestral strings begin to rise.

### 06 · The Legacy Gift · 30–36 s (generate as **two 3 s clips**)
**6a Refs:** ME, GREY SUIT, VARSITY, V-NECK — Medium group shot against the sunset: the
grey-suited man hands [ME] a game disc case; the men in the varsity jacket and V-neck
hand him a second one. He takes both.
**6b Refs:** ME + **your two real cover images** — Extreme close-up of [ME]'s hands
(black shirt cuffs) holding two blue game cases, trembling slightly, warm sunset light
glinting on the plastic.
*Tip:* attaching the actual cover art to the still for 6b gives readable covers. If the
lettering still warps, generate the cases blank and show the covers on a 1 s cut-in
photo in the edit.
**Audio:** piano reaches its peak.

### 07 · A New Engine · 36–42 s
**Refs:** ME, RED CAR
**Keyframe still:** Over-the-shoulder from behind [ME] (holding two game cases),
looking at the coastal road where the [RED CAR] approaches, sunlight streaking across
its chrome.
**Motion:** [ME] turns his head toward the engine sound. Cut-feel move into a low-angle
tracking shot of the red coupe rolling slowly in and stopping near the parked black
coupe. A man drives and a woman sits in the passenger seat.
**Audio:** engine rumble; the music turns into an exciting cinematic score.

### 08 · New Arrivals · 42–48 s ↪ (from 07)
**Refs:** TROPICAL, PINK TOP, RED CAR
**Keyframe still:** Low-angle medium-wide shot: [TROPICAL] stepping out of the driver's
side and [PINK TOP] out of the passenger side of the [RED CAR], hands empty.
**Motion:** They close the doors and walk side by side with confidence toward the
camera. A slow cinematic push-in; the woman gives a warm, welcoming smile.
**Line (PINK TOP):** “Ready for the next chapter?”
**Audio:** score builds, footsteps.

### 09 · Passing the Torch · 48–54 s
**Refs:** ME, GREY SUIT, VARSITY, V-NECK, TROPICAL, PINK TOP (if your tool caps
references, make the still in two passes: first the left group, then add the right group)
**Keyframe still:** Wide shot on the promenade: the three men (grey suit, varsity,
V-neck) on the left, [ME] in the centre holding two game cases, the man in the tropical
shirt and the woman in the pink top on the right. Sunset behind everyone.
**Motion:** Slow semicircular dolly around the group. [ME] looks back at the three men
with tearful eyes, then turns toward the new pair. The grey-suited man nods, the man in
the varsity jacket smiles, and the man in the V-neck raises one hand in farewell. End
on a close-up of [ME]'s emotional face.
**Line (ME):** “Goodbye, legends. I'll never forget you.”
**Audio:** music turns triumphant.

### 10 · Goodbye Los Santos, Hello Vice City · 54–60 s
**Refs:** ME, TROPICAL, PINK TOP, RED CAR, BLACK CAR
**Keyframe still:** Wide shot: [ME] walking toward the man in the tropical shirt and the
woman in the pink top, who wait beside the [RED CAR]; the [BLACK CAR] stays parked in
the background.
**Motion:** He gives one last wave over his shoulder, then walks on to join the pair. The
camera pulls back and up, revealing the ocean, palms, promenade and both cars, while
the sky shifts from deep orange to neon pink and purple.
**Audio:** triumphant orchestral finish, then gentle waves.
*(The titles and fade to black are added by `assemble.sh`.)*

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Your face drifts | Use your selfie as the only face reference for that shot, re-make the still, keep clips ≤ 6 s, and pick the take where you look most like yourself |
| Hugs look like melting bodies | Keep the hug camera static, describe “arms around each other's backs, heads over shoulders”, try Kling / Seedance (these are better at contact) |
| Content-policy rejection | Remove character and game names from the prompt (the descriptors above already avoid them) and remove any gun in the references |
| Six people in one shot fall apart | Make scene 09 as two shots: left trio + you, then you + right pair, and cut between them |
| Car turns into a convertible | Add “closed hardtop with solid roof” and attach the car reference again |
