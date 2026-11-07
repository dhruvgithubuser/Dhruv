# C. Character design and identity sheets

**All four characters are fictional.** They are a narrative device and are always labelled `FICTIONAL FAMILY · RECONSTRUCTION` on screen. They never speak, and the film never states what happened to them.

Rendered reference sheets (front, three-quarter, side, back, 6-key walk cycle, head close-up):
`deliverables/characters/marcus_sheet.png`, `livia_sheet.png`, `julia_sheet.png`, `gaius_sheet.png` (regenerate with `node pompeii/tools/shoot_sheets.mjs`).
The code definitions in `lib/figures.js` (`CHAR`) are the identity lock. Every shot draws the same parameters, so faces, hair, clothing and proportions cannot drift.

## Identity locks

### Marcus: shopkeeper, about 40
- **Build:** 1.76 m, solid (build 1.06). Upright posture.
- **Face:** warm olive-brown skin (#b5815f), short dark hair (#261a14) cropped above the ears, **neatly trimmed full dark beard**, dark brown eyes, straight brows.
- **Costume:** cream knee-length tunic (#e4d9c0) with short sleeves, dark leather belt; **brown wool outer garment (#7b5639) draped over the left shoulder** and across the chest; brown leather sandals.
- **Props / place:** runs the thermopolium (hot-food counter with dolia jars) on the right side of the main street.
- **Acting notes:** practical, protective. Gestures are small and purposeful (opening shutters, holding the doorway, carrying Julia). In the escape shot he carries a torch.

### Livia: his wife, about 35
- **Build:** 1.64 m, slender (0.9).
- **Face:** olive skin (#c08c69), **dark hair parted in the centre, braided and coiled at the nape** (#22160f).
- **Costume:** **muted terracotta ankle-length stola (#a8624a)** over a cream under-tunic that shows at the hem, terracotta palla (#8e5040) over the shoulder, girdle high at the waist, Roman sandals.
- **Acting notes:** calm and steady; keeps Julia close. Often framed with Julia.

### Julia: their daughter, about 9
- **Build:** 1.30 m, child proportions (larger head ratio, 8.6 vs 6.9 adult head units).
- **Face:** light olive skin (#c79873), **dark curly hair** in a rounded mass of curls.
- **Costume:** **simple light cream knee-length tunic (#efe6d2)** with a pale belt, small sandals.
- **Prop:** a small wooden toy horse (inspired by toys from the Roman world). It appears in 7F, alone on the ash. That is the film's only "loss" image, and it is deliberately non-graphic.
- **Acting notes:** curious; reaches out to catch the first ash (4H).

### Gaius: elderly neighbour, about 65
- **Build:** 1.70 m, **slight stoop** (0.07), walking staff.
- **Face:** weathered (forehead and cheek lines), **short grey hair** (#c3bcb2), grey stubble.
- **Costume:** **faded brown tunic (#86684b)**, dark belt, worn sandals.
- **Acting notes:** the one who reads the danger first: he points at the mountain (4F) and urges the family to leave (5D).

## Crowd
Seeded variations from a palette of Roman dyes (undyed cream, madder red, ochre, olive, woad blue, brown), with women in stola and palla (some veiled), men in tunics with optional cloaks, children, and people carrying amphorae or baskets. Excavation crews (`digger()`) wear 18th-century dress (tricorn hats, coats, breeches) for 1748, and 19th-century dress (straw or top hats) for the Fiorelli era.

## Using the sheets with an image model (docs/F)
Attach the relevant sheet as a character or style reference, and paste the matching identity paragraph above into the prompt. Generate a turnaround first (front / three-quarter / side / back on a neutral ground), lock that seed, and reuse it for every shot in the scene.
