# K. Editing and export instructions

## Pipeline (all from the repository root)
```bash
npm i                                              # fonts + map data (Playwright is used from the system install)
python pompeii/audio/build_vo.py --kokoro <dir> --whisper <dir>   # 1. narration -> vo.wav + timeline.json
python3 pompeii/tools/make_subs.py                 # 2. SRT / VTT / chapters
node pompeii/tools/export_shots.mjs                # 3. shot list -> cues.json
uv run pompeii/audio/sound.py                      # 4. score + SFX -> music.wav, sfx.wav  (~4 min)
node <motion-reel>/scripts/mix.mjs pompeii --music-db -7 --sfx-db -1 --vo-db 2 --no-mux   # 5. mix -> mix.wav (-14 LUFS)
node pompeii/tools/render_fast.mjs --fps 30 --workers 4   # 6. picture -> out/pompeii/video_16x9.mp4 (~45 min on 4 CPUs)
ffmpeg -i out/pompeii/video_16x9.mp4 -i pompeii/audio/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -shortest -movflags +faststart out/pompeii/final.mp4
python3 pompeii/tools/make_docs.py                 # docs E-H from the shot list
node pompeii/tools/shoot_sheets.mjs && node pompeii/tools/shoot_thumbs.mjs   # character sheets + thumbnails
```
Preview interactively: serve the repo root (`npx http-server .`), open `/pompeii/index.html`, then use space to play, arrows to step and a click to scrub.

## How the film is built
- `film.js` is a **pure function of time**: `window.seek(t)` paints frame t, so any frame can be re-rendered alone.
- `shots.js` is the edit decision list. Each shot is anchored to a narration line (`T('S04', 3)`), with a transition, a camera move, an honesty tag, on-screen text and SFX.
- `sets/*.js` hold the painted worlds (street, forum, atrium, aerial, maps, diagrams, views); `lib/` holds the camera, painting, figures, effects and the graphics kit.

## Editing rules used
- Cut on narration beats; dissolves 0.5-1.2 s; hard cuts on impacts. No shot is shorter than about 1.5 s, and most run 3-8 s.
- Chapter cards appear 0.5 s into each chapter for 4.5 s, lower left, without stopping the picture.
- On-screen text never competes with a new narration sentence. Callouts appear after the noun they name is spoken.
- The honesty tag is visible on every shot except the title and end card.

## Swapping in premium painted plates
To replace a code-painted shot with a generated still or clip (docs F/G), put the image or video frames in `assets/plates/<shotID>.*`, and change that shot's `draw` to `archival(...)` (Ken Burns over a still) or to a video-frame draw. Timing, transitions, captions and sound stay as they are.

## Delivery spec (YouTube)
| | |
|---|---|
| Container | MP4 (faststart) |
| Video | H.264 High, 1920x1080, 30 fps progressive, yuv420p, BT.709, CRF 17 |
| Audio | AAC-LC 320 kbps, 48 kHz stereo, -14 LUFS integrated, -1 dBTP |
| Captions | `pompeii_en.srt` uploaded separately |
| Chapters | paste `youtube_chapters.txt` into the description (first at 0:00) |
| Thumbnail | 1280x720 PNG under 2 MB (`deliverables/thumbnails/`) |

For a 4K master, render at 3840x2160 (the canvas code is resolution-independent apart from the sizes table in `lib/motion.js`). Expect about 4x the render time.
