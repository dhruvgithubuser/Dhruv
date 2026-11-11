# The Ghost Army: 2D WWII documentary Short (final version)

This is the final version the user asked for: 2D style, war music, and the longer narration (104 s) written for a US audience. The 3D remake is in `../ghost-army-3d/` and was set aside.

- `src/components/Art.tsx`: cinematic 2D illustration kit (SVG): parallax landscapes (dusk, day, night), a shaded M4 Sherman (rubber mode with shine and wobble), GIs (stand, walk, lift, sit, ghost), cyclists, trucks, a loudspeaker half-track, bulldozer, top-down dummies, a recon plane, a radio mast, the spy, and the gold medal
- `src/components/ParchMap.tsx`: parchment map (Natural Earth 1:50m) with routes, pins and labels
- `src/scenes/All.tsx`: the 16 scenes
- `src/Overlays.tsx`: documentary titles, stats, chips, stamps, photo insets, viewfinder, grade
- `scripts/build-audio.py`: war-documentary score (military snare march, timpani, low brass, cello ostinato, D-major brass chorale) plus SFX
