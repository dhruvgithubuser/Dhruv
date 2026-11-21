# The 15-Minute Ambush That Started a World War (Jumonville Glen, 1754)

Long-form 16:9 documentary (1920×1080, 30 fps, 8:28) for Buried Chronicles, built in React + Remotion.
Editorial 2D style: parchment maps with real coastlines and Great Lakes, inked rivers, animated routes and marching
columns, paper-cutout characters, typewritten/quill documents, painted backgrounds with camera moves, subtitles.

## Render
```bash
npm install
bash scripts/render-video.sh   # master (CRF 18, -14 LUFS), 1080p upload copy, 720p small copy, .srt
npx remotion still src/index.ts Thumbnail output/thumbnail.png --frame=0
```
Preview: `npx remotion studio src/index.ts` · contact sheet: `node scripts/stills.mjs sheet.png 10,60,120 6`.

## How it's built
- `scripts/voiceover_kokoro.py`: the 59-line narration (Kokoro TTS, deep American voice) + word timings (faster-whisper)
  → `src/data/timeline.json`. Every scene starts with its line, so re-recording re-times the film.
- `scripts/build-audio.py`: original score (four movements by chapter) + effects (forest, rain, thunder, muskets, drums, quill, paper).
- `scripts/paint-backgrounds.py`: six painted plates without people (DreamShaper 8 + LCM-LoRA).
- `scripts/build-geo.mjs`: map data. Natural Earth land (world-atlas) + Great Lakes from OpenStreetMap (@geo-maps, ODbL).
- `src/components/`: `Maps.tsx` (North America + world maps, routes, pins, territories), `Cast.tsx` (characters),
  `Docs.tsx` (cards, quotes, stamps, subtitles, chapter cards, timeline, stopwatch), `Stage.tsx` (parchment, plates, rain, mist, musket smoke).
- `src/scenes/Part1–3.tsx`: shots S01–S59, one per narration line; chapters are set in `src/Documentary.tsx`.

## Credits
Maps: Natural Earth (public domain); lakes © OpenStreetMap contributors (ODbL). Fonts: Oswald, Courier Prime, Playfair Display,
IBM Plex Mono, Inter (SIL OFL). Narration: Kokoro-82M (Apache-2.0). Characters are illustrations, not likenesses.
