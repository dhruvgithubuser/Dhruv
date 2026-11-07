# The Return of Ram — When Ayodhya Became a City of Light

A Badi Diwali Instagram Reel: 9:16, 1080×1920, 120 s, cinematic VFX + motion graphics, narrated.

**Deliverable:** `exports/the_return_of_ram_reel.mp4` (H.264 + AAC, -14 LUFS), `subtitles.srt`, `exports/poster.png`.

## How it is made
- **Plates = the 15 reference images** (`assets/plates_src/`), so every character, costume and location is exactly as supplied.
  `assets/plates/` holds each plate upscaled (Lanczos + sharpen) with a depth map (Depth-Anything-V2) split into a
  foreground cut-out (`_fg.webp`) and an in-painted background (`_bg.jpg`) for 2.5-D parallax.
- **Film** (`film.js`): a pure function of time rendered frame-exact in headless Chromium. 18 shots on a 72 bpm grid
  (`docs/shotlist.md`). VFX: parallax camera moves, volumetric light shafts, embers, petals, dust, mist/cloud passes,
  a procedural diya flame that ignites from the match, the lamp-wave that lights the ghats, simulated fireworks, bloom,
  grade, grain. Motion type: Cinzel + Tiro Devanagari (name cards, keyword landings, title, end card, word-by-word captions).
- **Sound** (`audio/score.py`): synthesized score (tanpura drone, strings, bansuri-style flute, temple bells, conch,
  choir, tabla keherwa, fireworks) on the same clock as the picture (`timeline.json`); narration from `audio/script.txt`
  generated per phrase with Kokoro TTS (`audio/vo/`); mastered to -14 LUFS / -1 dBTP.

## Rebuild
```
MOTION_REEL_SKILL=<motion-reel skill> uv run return-of-ram/audio/score.py
node <skill>/scripts/sfx.mjs return-of-ram
node <skill>/scripts/render.mjs --film return-of-ram --format 9x16 --video-only --fps 30
node <skill>/scripts/mix.mjs return-of-ram --vo-db 5 --music-db -2
```
To swap the voice: drop new per-phrase recordings into `audio/vo/pNN.wav` (same order as `timeline.json`) and rerun
the score + mix; captions and timing follow `timeline.json`.
