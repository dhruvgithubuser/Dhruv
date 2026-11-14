# The Mistake That Cost Napoleon His Empire (Vox-style cut)

A 16:9, 7:05 explainer cut of the Napoleon 1812 long video. It reuses the same narration, score and SFX as `../napoleon-russia-1812`, and rebuilds every visual in the Buried Chronicles "MG-VOXSTAGE" look from the Operation Valkyrie Short:

- parchment map (Natural Earth coastlines, approximate 1812 regions, red French and green Russian arrows);
- polaroid photo cards: public-domain portraits (Napoleon by David 1812, Alexander I by Dawe, Kutuzov by Volkov, Rostopchin, Ney by Gérard) and dramatized photoreal stills;
- typewriter tags, red rubber stamps, counters, icon grids, a thermometer, calendars;
- bold word-by-word captions in the lower third.

## Files
- `src/kit.tsx`: Vox primitives.
- `src/VoxMap.tsx`: the map.
- `src/ScenesA.tsx` / `src/ScenesB.tsx`: the 49 scenes, timed to words of `src/data/timeline.json`.
- `scripts/stills.mjs out.png 1,5,9 [cols]`: renders a contact sheet.
- `scripts/render-video.sh`: final render. It writes `output/the-mistake-that-cost-napoleon-his-empire-vox.mp4` and the matching `.srt`.

Run with `REMOTION_BROWSER=<chrome-headless-shell>`.
