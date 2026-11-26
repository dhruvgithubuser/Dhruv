# Documentary reel: Mississippi plane crash into the Gulf (24 Nov 2026)

A 65-second, 1080×1920 reel made entirely from code: animated maps from Natural Earth data, motion graphics,
recreated source clippings, a synthesised music bed and sound effects, and a temporary AI voiceover.

## Deliverables (`output/`)
| File | What |
|---|---|
| `mississippi_gulf_crash_reel.mp4` | Final reel: H.264 1080×1920 30 fps, AAC 48 kHz, −14 LUFS |
| `cover_thumbnail.png` | Reel cover (key text inside the centre 3:4 grid crop) |
| `captions.srt` | Timed captions; upload to Instagram/TikTok/YouTube as auto-captions or burn in |

Docs: `01_research_brief.md` (timeline, conflicting figures, references) · `02_script_and_scene_plan.md`.

## Before you post
- **Verify facts.** Article pages could not be opened from the build environment, so facts come from search-result
  extracts. Ages and names are deliberately left out because sources conflict. The NTSB preliminary report will update the story.
- **Voice:** the narration is a synthetic placeholder voice (Kokoro-82M `am_michael`). Swap in your own recording (below).
- Suggested caption: "6 people died when a Cessna 210 plunged into the Gulf near Horn Island, Mississippi. The FAA says
  it was descending at ~10,000 ft/min. Sources: WLOX, FLYING, CBS, WINK News, Mississippi Free Press. #NTSB #aviation"

## Re-render
```bash
pip install skia-python kokoro-onnx soundfile shapely   # skia also needs libegl1 (apt)
python3 src/prep_geo.py <natural-earth-geojson-dir> assets/geo.json            # only if map data changes
python3 src/tts.py <kokoro-model-dir> assets                                      # temp voice -> voiceover.wav + timing.json
python3 src/render.py cues assets/cues.json
python3 src/audio.py assets/voiceover.wav assets/cues.json mix.wav
python3 src/render.py range 0 1968 video.mp4      # or split into ranges and run in parallel, then concat
ffmpeg -i video.mp4 -i mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest output/reel.mp4
python3 src/render.py cover output/cover_thumbnail.png
python3 src/render.py frame 30.0 preview.png      # single-frame preview at t = 30 s
```

### Using your own voiceover
Replace `assets/voiceover.wav`, regenerate `assets/words.json` (word timestamps, e.g. Whisper/faster-whisper)
and the beat start times in `assets/timing.json`. Every animation is keyed to those spoken-word times, so the visuals re-sync on re-render.

## Layout
- `src/beats.py`: narration text and source refs (single source of truth)
- `src/render.py`: all scenes; each frame is a pure function of time
- `src/audio.py`: music bed, SFX, ducking, loudness
- `assets/`: map geometry, voiceover, timings, SFX cues
