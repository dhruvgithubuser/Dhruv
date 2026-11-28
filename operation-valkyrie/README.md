# The Real Story Behind Operation Valkyrie

A 9:16 editorial 2D documentary Short (1080×1920, 30 fps, ~71 s), built in React + [Remotion](https://www.remotion.dev).
Buried Chronicles style ("MG-VOXSTAGE"): an aged-parchment stage, paper-cutout characters, archival photos, animated maps,
typewriter documents and red route lines. Every visual is a pure function of the frame, so preview = render.

## Install
```bash
npm install
```
Requires Node 18+ and ffmpeg (for the final loudness pass and compressed copy).

## Preview / edit
```bash
npx remotion studio src/index.ts      # composition "Valkyrie"
```

## Render the MP4
```bash
bash scripts/render-video.sh
# -> output/the-real-story-behind-operation-valkyrie_master.mp4 (CRF 18, -14 LUFS)
#    output/the-real-story-behind-operation-valkyrie.mp4 (compressed, ~2.2 Mb/s, for upload/sharing)
#    output/the-real-story-behind-operation-valkyrie.srt
```
Or directly: `npx remotion render src/index.ts Valkyrie out.mp4 --codec=h264`.
On a CPU-only machine add `--gl=swiftshader` (the script does).

## Project structure
```
public/assets/
  backgrounds/   paper texture, painted plates (briefing hut, Wolf's Lair forest, courtyard at night)
  characters/    stauffenberg.jpg (public-domain portrait, c. 1934)
  documents/     room_after.jpg (Bundesarchiv Bild 146-1972-025-10, CC BY-SA 3.0 DE)
  sound/         voiceover + sound effects;  music/ score
  fonts/ textures/
src/
  components/    DocumentaryStage (stage, fonts, camera drift, film finish) · CharacterCutout (paper-cutout cast)
                 ArchivalDocument (paper cards, typewriter text, stamps, photo prints, strike-through)
                 MapAnimation (Europe map with 3D table tilt, Berlin schematic) · TextOverlay (headlines, notes,
                 captions, timeline) · Transition (paper wipe, red-line wipe) · Room (the briefing hut + blast)
  scenes/        Scene01.tsx … Scene08.tsx
  data/          storyboard.ts (scene titles, transitions, asset paths) · narration.ts · timeline.json (word timings)
                 sfx-cues.json (generated) · europe.json (Natural Earth coastlines)
  Documentary.tsx · Root.tsx · theme.ts (palette, fonts, timing helpers)
scripts/         voiceover_kokoro.py · build-audio.py · paint-backgrounds.py · render-video.sh · stills.mjs · make-srt.mjs
```

## Changing things
- **Scene timing** follows the narration automatically (`src/theme.ts` → `SCENES`). Re-record with
  `python scripts/voiceover_kokoro.py <kokoro_dir> --whisper`, then `python scripts/build-audio.py` to re-sync the music and effects.
- **Assets**: replace a file at the same path (see `ASSETS` in `src/data/storyboard.ts`).
- **Characters** are drawn in `src/components/CharacterCutout.tsx` (one design per person, reused everywhere).
- **Review frames**: `node scripts/stills.mjs sheet.png 2,10,20 5` renders a contact sheet.

## Production notes
- Narration: Kokoro-82M (Apache-2.0), deep American male blend; word timings from faster-whisper.
- Music and effects are synthesized in `scripts/build-audio.py` (no third-party audio).
- Painted plates: DreamShaper 8 + LCM-LoRA (CreativeML OpenRAIL-M). They contain no people; the cards that use them say
  "illustration"/"diagram".
- Fonts: Oswald, Courier Prime, IBM Plex Mono, Inter (all SIL OFL).
- No Nazi insignia are shown (keeps the Short advertiser-friendly); the Berlin map is schematic.
- "After Effects" was not available in this environment; Remotion is the code-based equivalent used for the build.
