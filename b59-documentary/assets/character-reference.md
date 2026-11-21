# Character reference: B-59, 27 October 1962

**Character lock:** each officer is ONE generated portrait (`public/stills/<name>.jpg`, from
`scripts/paint-stills.py`, fixed seed), reused in every scene where he appears: close-ups, the officer
cards, lower-thirds and the final portrait. No scene generates a new face, so faces cannot drift.
These are illustrations, not likenesses: no licensed historical photograph was available in this
session (Wikimedia rate-limited the request). To swap in a portrait painted from a real photo, replace
the file and keep the name.

| Character | File | Description (prompt) | Seed |
|---|---|---|---|
| Vasili Arkhipov (36), brigade chief of staff aboard B-59 | `stills/arkhipov.jpg` | Soviet navy officer, short dark hair, clean-shaven, calm serious face, black naval uniform, shoulder boards | 701 |
| Valentin Savitsky, commander of B-59 | `stills/savitsky.jpg` | tense, exhausted Soviet submarine captain, short dark hair, clean-shaven, black uniform, captain insignia, sweat | 702 |
| Political officer (Ivan Maslennikov in most accounts; unnamed in the script) | `stills/political.jpg` | stern Soviet naval political officer, short hair, clean-shaven, black uniform | 703 |

Lighting is applied in the film (red alert / warm), never baked differently per scene.
