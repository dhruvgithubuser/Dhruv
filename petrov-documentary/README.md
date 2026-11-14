# The Soldier Who Refused to Start World War III

A 80-second 2D animated documentary short (9:16, 1080×1920, 30 fps) about Lt. Col. Stanislav Petrov
and the Soviet false nuclear alarm of 26 September 1983, built with React + Remotion + TypeScript.
Every frame is a pure function of the Remotion frame (useCurrentFrame / interpolate / spring), so the
render is deterministic.

## Outputs (`output/`)
| File | What |
|---|---|
| `the-soldier-who-refused-ww3.mp4` | final video, H.264 + AAC, mastered to -14 LUFS / -1 dBTP |
| `narration.mp3` | narration only |
| `the-soldier-who-refused-ww3.srt` | subtitles |
| `thumbnail.png` | Shorts cover |

## Setup
```bash
npm install
# optional: a local Chrome/Chromium for rendering (Remotion downloads one otherwise)
export REMOTION_BROWSER=/path/to/chrome-headless-shell
npm run studio            # preview in the browser
bash scripts/render-video.sh   # full render + master + srt + thumbnail
```

## Voiceover
`scripts/generate-voiceover.ts` uses **ElevenLabs** when `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID`
are set (copy `.env.example` to `.env`; keys are only read from the environment). Without them it uses
the free local **Kokoro-82M** voice (`scripts/voiceover_kokoro.py`: a blend of its `am_michael` and
`am_onyx` American male voices), which is what the delivered video uses:

```bash
pip install kokoro-onnx faster-whisper scipy soundfile
# model.onnx + voices/am_michael.bin + voices/am_onyx.bin from
# https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX
KOKORO_DIR=~/kokoro npx tsx scripts/generate-voiceover.ts
```
It writes `public/audio/voiceover.mp3` and `src/timeline.json`. Scene cuts, picture accents and the
word-by-word captions all read their timing from that file, so a new narration re-times the film.

## Sound
`scripts/build-audio.py` synthesizes the score (dark drone, low tension pads, alarm ostinato, space pad,
warm orchestral rise) and 15 effects (bunker hum, relays, beeps, siren, alert, radar sweep, impacts,
heartbeat, typewriter, clock, space ambience...) and writes `src/sfx-cues.json`. The music ducks under
the narration in `src/Documentary.tsx`.

## Art
All characters, sets and graphics are drawn in code (SVG):
- `src/components/Petrov.tsx` — the single Petrov character model (see `assets/characters/petrov-character-reference.md`)
- `Sets.tsx` — bunker, consoles, officers, red phone, calendar, clock, corridor
- `RadarAnimation.tsx`, `MissileTrajectory.tsx`, `AnimatedGlobe.tsx`, `SatelliteOrbit.tsx`, `TimelineGraphic.tsx`
- `CinematicCamera.tsx`, `ParallaxScene.tsx`, `ParticleSystem.tsx`, `EmergencyLights.tsx`, `FilmGrain.tsx`, `SceneTransition.tsx`
- maps: Natural Earth 1:110m via `world-atlas` (`scripts/build-geo.mjs` → `src/geo.json`)

**Hand-painted illustrations (optional).** `npm run validate` writes `src/asset-manifest.json` with an
image-generation prompt for every scene. Put a 1080×1920 image at `public/images/scene-NN/illustration.png`
and that scene plays it (slow push + dust) instead of its code-drawn art.

## Scenes
| # | Narration | Picture |
|---|---|---|
| 1 | What if the fate of the world… | lone officer in the bunker, push-in, globe, red pulse |
| 2 | On September 26, 1983, | tear-off calendar turns to 26 СЕНТЯБРЬ, clock, typed date |
| 3 | during the height of the Cold War, | globe: USA / USSR light up, bombers, arcs |
| 4 | Soviet officer Stanislav Petrov… | Petrov at his console, lower thirds |
| 5 | Suddenly, alarms erupted. | red lights, СТАРТ sign, officers turn, shake |
| 6 | The Soviet satellite system reported… | radar CRT, five tracks USA → USSR |
| 7 | According to procedure… | Petrov and the red telephone |
| 8 | A false decision could have pushed… | phone before rising missile silhouettes |
| 9 | But something didn't feel right. | extreme close-up of his eyes |
| 10 | just one launch, followed by four more… | radar count 1 → 5, scale comparison |
| 11 | He decided the alert was probably a false alarm… | Petrov reports on the phone |
| 12 | Minutes passed. No missiles arrived. | alarms fade, clock and timeline |
| 13 | sunlight reflecting off high-altitude clouds… | Sun → clouds → satellite sensor diagram |
| 14 | Petrov's judgment helped prevent… | corridor, red → warm, pull back to Earth |
| 15 | He was not a man who launched a weapon… | silhouette against Earth, title, fade |

## Licences
Remotion is free for individuals and small companies (see remotion.dev/license). Fonts: Oswald and
Cinzel (SIL OFL). Kokoro-82M: Apache-2.0. Map data: Natural Earth (public domain).
