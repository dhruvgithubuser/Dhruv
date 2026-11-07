# Character reference — Lt. Col. Stanislav Petrov (26 September 1983)

One character model, `src/components/Petrov.tsx`, is used in every shot (bust, close-up, seated,
standing via `PetrovStanding` in `src/components/Sets.tsx`, and silhouette). Shots only change
framing, lighting and expression parameters — never the geometry — so his face stays identical.

## Identity (do not change)
| Feature | Spec in the model |
|---|---|
| Age | ~44 (born 7 Sept 1939) |
| Face | broad, strong square jaw (`HEAD` path), clean-shaven with a faint cool jaw tint |
| Hair | short, dark brown-black, neatly combed back with a side part (`HAIR_SHAPE`, part at x≈252) |
| Brows | thick, straight, dark; inner ends drop with `brow` (tension) |
| Eyes | dark brown irises, heavy upper lid line, tired under-eyes (night duty) |
| Nose / mouth | straight nose, firm closed mouth with a slight downturn |
| Expression | serious, composed |

## Uniform (Soviet Air Defence Forces officer, 1983)
- Dark olive jacket (`UNI` palette #4b5337 / #2b3120), lapels, gold buttons
- White shirt, dark tie
- Lieutenant-colonel shoulder boards: two stripes, two stars (gold)
- Collar tabs with a small gold emblem; a ribbon bar on the left chest

## Parameters per shot
| Prop | Range | Use |
|---|---|---|
| `light` | neutral, red, radar, warm, dim | scene key light colour |
| `lightAmt` | 0–1 | how strongly the coloured light tints him |
| `turn` | -1–1 | head turn (features slide, far side narrows) |
| `gaze` | x,y -1–1 | where he looks |
| `blink` | 0–1 | eyelids |
| `brow` | 0–1 | calm → furrowed |
| `mouth` | 0–1 | speaking (scene 11) |
| `handset` | 0–1 | red phone raised to the ear |
| `silhouette` | bool | black figure with rim light (scene 15) |

## When adding painted illustrations
Use the 1983 photograph of Petrov as the identity reference and keep to the table above. Prompts
for every scene are in `src/asset-manifest.json` (built by `npm run validate`); a file placed at
`public/images/scene-NN/illustration.png` (1080×1920) replaces that scene's code-drawn art.
