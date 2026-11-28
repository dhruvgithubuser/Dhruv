# The Ghost Army (9:16 Short)

A Vox-style explainer about the WWII Ghost Army (23rd Headquarters Special Troops). It uses public-domain US Army photos as collage cut-outs and flat vector icons (Sherman, GIs, cyclists, sound truck, radio). It also has a Natural Earth map from Normandy to the Rhine with Operation Viersen animated, plus kinetic type and data graphics. There are no AI paintings.

- `docs/script.md`: fact sheet with sources and the script
- `output/youtube-seo.md`: keyword research, titles, description, tags, hashtags and Instagram caption

Pipeline: same as `burning-of-washington-1814/`.
1. `scripts/prep-archival.py`
2. `scripts/build-geo.mjs` (Natural Earth 1:50m land + borders)
3. `scripts/voiceover_kokoro.py --whisper`
4. `scripts/build-audio.py`
5. `scripts/render-video.sh`
