# The Ghost Army: 3D documentary Short

This is the 3D remake of `ghost-army-1944/`, at the user's request ("3D documentary style with more explanation to the US audience"). It is built with Remotion 4.0.541 and `@remotion/three` (react-three-fiber + three.js 0.170). Everything is procedural low-poly 3D: no downloaded models and no AI images. Archival US Army photos appear as insets.

- `src/three/`: Stage (sky dome, sun with shadows, room-environment reflections, camera rig), Models (Sherman, GI, cyclist, truck, gun, half-track, bulldozer, recon plane, field), Map3D (extruded Natural Earth sand table, Rhine, arrows, pins), util (labels, textures)
- `src/scenes/`: Field (1–4), Unit (5–7), Tactics (8–10), MapScenes (11–13), Legacy (14–16)
- `src/Overlays.tsx`: documentary titles, stats, chips, stamps, photo insets, viewfinder, grade
- Renders with `--gl=swangle`. SwiftShader cannot create a WebGL2 context for three.js here.

Run `npm install`, then `bash scripts/render-video.sh`. The narration (`scripts/voiceover_kokoro.py`) and the score/SFX (`scripts/build-audio.py`) work the same way as in the other projects.
