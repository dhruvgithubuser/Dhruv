# A Storm Hit Washington the Day After Britain Burned It (9:16 Short)

A Vox-style explainer Short about the Burning of Washington (24–25 August 1814). It uses real public-domain archival engravings and portraits as collage cut-outs, yellow highlighter, hand-drawn circles and arrows, flat vector maps (Natural Earth), kinetic type and data motion graphics. There are no AI paintings.

- `docs/script.md`: research fact sheet, script and visual plan
- `output/youtube-seo.md`: titles, description, tags, hashtags and Instagram caption

## Pipeline

```bash
python3 scripts/prep-archival.py           # archival_raw/ -> public/assets/archival/*.png (torn-paper cards) + paper texture
node scripts/build-geo.mjs                 # Natural Earth 1:50m -> src/data/chesapeake.json
HF_HOME=… HF_HUB_OFFLINE=1 <venv>/python scripts/voiceover_kokoro.py <kokoro_dir> --whisper   # narration + word timings
<venv>/python scripts/build-audio.py       # synthesized score + SFX cues
REMOTION_BROWSER=… bash scripts/render-video.sh
```

Every visual is a pure function of the frame. Scene timing comes from `src/data/timeline.json`, and `wf(scene, word)` keys each animation to a spoken word.

## Code

- `src/components/VoxKit.tsx`: Paper, Card (archival cut-out), Hl (highlighter), Kinetic, Tag, Circle, Arrow, Stamp, Counter, Quote, Flame, Rain, Cloud, Bolt
- `src/components/VoxMaps.tsx`: RegionMap (Chesapeake) and CityMap (schematic Washington City, 1814)
- `src/Scenes.tsx`: S01–S13
- `src/Documentary.tsx`: composition, whip cuts, captions, audio

## Credits

- Archival images: public domain (Wikimedia Commons, PD-Art)
- Maps: Natural Earth
- Voice: Kokoro-82M
- Music and sound effects: synthesized in `scripts/build-audio.py`
