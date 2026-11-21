# America's Biggest Win of 1812 Came After the Peace Treaty

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
npx remotion studio src/index.ts      # composition "NewOrleans"
```

## Render the MP4
```bash
bash scripts/render-video.sh
# -> output/americas-biggest-win-of-1812-came-after-the-peace-treaty_master.mp4 (CRF 18, -14 LUFS)
#    output/americas-biggest-win-of-1812-came-after-the-peace-treaty.mp4 (compressed, ~2.2 Mb/s, for upload/sharing)
#    output/americas-biggest-win-of-1812-came-after-the-peace-treaty.srt
```
Or directly: `npx remotion render src/index.ts NewOrleans out.mp4 --codec=h264`.
On a CPU-only machine add `--gl=swiftshader` (the script does).

## Notes
Same editorial 2D system as the Valkyrie Short (9:16): `src/Scenes.tsx` (11 scenes, one per narration line), `src/components/Maps.tsx`
(Atlantic + Gulf Coast parchment maps), `src/components/Cast.tsx` (Andrew Jackson, Edward Pakenham, side-view soldiers),
`scripts/voiceover_kokoro.py`, `scripts/build-audio.py`, `scripts/paint-backgrounds.py`. Facts: Wikipedia, "Battle of New Orleans" and "Treaty of Ghent".
