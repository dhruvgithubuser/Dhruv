# Thumbnail prompt: "Napoleon's Coffin Was Opened 19 Years Later"

Works in Google Flow (Imagen), Midjourney, ChatGPT/DALL·E, Leonardo or Ideogram.

## Settings
- **Image**, aspect **9:16** (Shorts cover). Use **16:9** for the wide version (Prompt 3).
- **Reference images** (Flow "Ingredients", Midjourney `--cref`/image prompt):
  - `reference-napoleon-portrait.jpg` (David, 1812) for Napoleon's real face
  - `reference-coffin-lithograph-1840.jpg` (drawn at the opening, 1840) for how the body looked
- Generate 4 variations and pick the one with the clearest face.

## Prompt 1 (main): the opened coffin, 9:16, no text
```
Vertical 9:16 cinematic history poster, realistic oil-painting style, dark and moody. A night scene on the island of Saint Helena, October 1840: an open excavated grave lit by flaming torches. Inside the grave, four nested coffins (tin, mahogany, lead, mahogany) with their lids lifted, and a white satin sheet folded back to reveal Napoleon Bonaparte lying perfectly preserved, eyes closed as if asleep, pale calm face matching the reference portrait, wearing his green Chasseurs uniform with the red sash of the Legion of Honour and gold epaulettes, his bicorne hat resting on his legs. Shadowy silhouettes of British redcoat soldiers with shovels and French officers in 1840 uniforms stand around the edge, faces lit orange from below. Warm torchlight gold against deep brown and black shadows, drifting embers and smoke, dramatic top-down three-quarter angle looking into the grave, rich detail, high contrast, film grain. Leave clean dark empty space across the top third and the bottom fifth for headline text. No text, no letters, no words, no logos, no watermark.
```

## Prompt 2 (alternative): the face close-up, 9:16, no text
```
Vertical 9:16 cinematic close-up, realistic oil-painting style. The preserved face of Napoleon Bonaparte inside an open coffin, eyes closed as if peacefully asleep, matching the reference portrait, white satin lining and a folded satin sheet around his head, collar of a green uniform with gold embroidery. Warm flickering torchlight from the top right, deep black shadows, gold and sepia palette, faint embers in the air, film grain, eerie and quiet mood. Empty dark space at the top and bottom for text. No text, no letters, no logos, no watermark.
```

## Prompt 3 (wide 16:9 thumbnail), no text
```
Horizontal 16:9 cinematic history thumbnail, realistic oil-painting style. Left half: a dramatic half-length portrait of Napoleon Bonaparte alive in 1812, matching the reference portrait, standing in dark uniform, serious expression, rim-lit in gold. Right half: the same man in 1840 lying in an open coffin under torchlight, eyes closed, perfectly preserved, white satin around him, British soldiers with torches at the edge of the grave. Dark vignette, gold and deep brown palette, embers, high contrast. Keep the upper right area dark and empty for a headline. No text, no letters, no logos, no watermark.
```

## Avoid (add as negative prompt if the tool allows)
```
text, letters, watermark, logo, gore, decay, skeleton, skull, zombie, horror, blood, extra fingers, distorted face, modern clothing, cartoon
```
Keep it dignified: "asleep", not horror. A corpse that looks gruesome can get limited-ads or age-restricted.

## Text to add on top (channel poster style)
If your tool can't spell reliably, send me the image and I'll add this layer:
- Headline, top: **HE LOOKED** (white) **ASLEEP.** (gold), bold condensed font
- Gold round badge: **ST HELENA · 15 OCTOBER 1840**
- Stat box, bottom left: **19 YEARS** / AFTER HIS DEATH
- Icon captions, bottom right: 🔒 **4 SEALED COFFINS** · 🔥 **OPENED BY TORCHLIGHT**

If you want the tool to render text itself (Ideogram does this best), append:
```
Bold headline text at the top in white and gold condensed capitals: "HE LOOKED ASLEEP."
```

---

# Prompts WITH text on the thumbnail

Best tools for spelling: **Ideogram 2/3**, **ChatGPT image (GPT-4o)**, **Google Flow / Imagen 4**, **Midjourney v7**. Keep the quoted words exactly as written. If a word comes out misspelled, regenerate or fix just that word with the tool's edit/inpaint brush.

## Prompt A: Shorts cover, 9:16, with text
```
Vertical 9:16 YouTube Shorts cover, editorial history poster design, realistic cinematic oil-painting style, dark brown and black background with warm gold torchlight.

TOP of the image: a huge bold condensed sans-serif headline in two lines, all capitals, perfectly spelled: first line "HE LOOKED" in white, second line "ASLEEP." in rich gold, with a strong black drop shadow.

CENTER: Napoleon Bonaparte lying in an open coffin at night, perfectly preserved, eyes closed as if peacefully asleep, pale calm face matching the reference portrait, green uniform with gold epaulettes and the red sash of the Legion of Honour, white satin sheet folded back, four nested coffin rims (tin, mahogany, lead) around him, flaming torches at the edges of the grave, British redcoat soldiers with shovels in shadow, drifting embers.

RIGHT SIDE, below the headline: a round gold medallion badge with the small text "ST HELENA 1840".

BOTTOM LEFT: a black rectangle with a thin gold border containing large white text "19 YEARS" and below it smaller gold text "AFTER HIS DEATH".

BOTTOM RIGHT: two small gold circle icons, a padlock and a flame, with short white captions "4 SEALED COFFINS" and "OPENED BY TORCHLIGHT".

High contrast, sharp clean typography, plenty of breathing space around the text, film grain, dignified not gruesome. No other text, no watermark, no logo.
```

## Prompt B: Shorts cover, 9:16, minimal text (most reliable spelling)
```
Vertical 9:16 YouTube Shorts cover, realistic cinematic oil painting. Close-up of Napoleon Bonaparte's preserved face inside an open coffin, eyes closed as if asleep, matching the reference portrait, white satin around his head, warm torchlight from the right, deep black shadows, gold embers. At the top, huge bold condensed capital letters with black shadow: "HE LOOKED" in white and "ASLEEP." in gold. At the bottom, a gold-bordered black box with white text "19 YEARS LATER". Only these words, spelled exactly. No watermark, no logo, not gruesome.
```

## Prompt C: Long-video / 16:9 thumbnail, with text
```
Horizontal 16:9 YouTube thumbnail, editorial history poster design, realistic cinematic oil painting, dark brown background with gold light. LEFT 45%: half-length portrait of Napoleon Bonaparte alive in 1812, matching the reference portrait, serious expression, gold rim light. RIGHT side, top: huge bold condensed capital headline with black shadow, "HE LOOKED" in white on the first line and "ASLEEP." in gold on the second line. RIGHT side, middle: an aged sepia drawing of Napoleon lying in an open coffin under torchlight, framed like an old print, with a small gold caption "OPENED 1840". BOTTOM RIGHT: gold-bordered black box with large white text "19 YEARS" and small gold text "AFTER HIS DEATH". Only these words, spelled exactly, sharp clean typography. No watermark, no logo, not gruesome.
```

## Negative prompt (if supported)
```
misspelled text, extra words, gibberish letters, watermark, logo, gore, decay, skull, skeleton, horror, blood, distorted face, extra fingers, cartoon
```
