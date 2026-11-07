# Critique log

Scores 1-10: hook · readability (phone) · motion · variety · reference fidelity · sound sync

## Round 1 (stills 0-30 s)
Scores: 7 · 6 · 7 · 7 · 9 · n/a
1. Gold gradient on big type rendered almost white (gradient in page space, glyphs in local space) -> fixed, local gradients.
2. Ram/Sita name cards collided with captions; Devanagari card unreadable over the busy vimana -> cards moved to y=1090, soft dark scrim behind every card.
3. Ram intro washed out (between-layer glow + bloom + light-wipe band) -> glow 0.5->0.28, bloom 0.42->0.3, band 0.75->0.42.

## Round 2 (contact sheet, every 3 beats, + phone sheet)
Scores: 8 · 7 · 7 · 7 · 9 · 8
1. KNOWLEDGE / HOPE / VICTORY low-contrast over the flame glow and too tight -> 180 px spacing + dark elliptical scrim per word.
2. Reunion held ~11 s without a new event -> camera re-frame mid-shot (Bharat -> Ram's face) + "भरत · BHARAT" card.
3. LAKSHMAN tag ran off the left edge; aerial beam over-bright; end-card text sat over faces -> tags clamped into the safe area, beam VFX cut to a whisper, end card moved to the lower third with a darkening band.
Also: captions got an outline (legible on bright frames), "01" counter padding removed.

## Round 3 (detail stills + audio)
Scores: 8 · 8 · 8 · 8 · 9 · 8
1. Lamp-wave reveal read as a round porthole -> origin moved far off-frame, so the front sweeps across the ghats as a broad, soft edge.
2. "Badi" pronounced "batty" (ASR check on the mix) -> regenerated with phonetic spelling, ASR now hears it right.
3. Tags too small at phone size -> 34 -> 42 px.
Sync: 31/42 hits within 20 ms of an audio onset, median 6.7 ms (the misses are soft whoosh peaks).
Narration: whole mix transcribed by Whisper, every line recovered word-for-word under the music.

## Remaining (next pass)
- Plates are 0.5-1.5 MP AI images, so 9:16 crops are ~2.3x upscales and look soft on close-ups (vimana tag shot, ghat 06). An AI upscaler pass (Real-ESRGAN / Topaz) on the 15 plates would sharpen every shot.
- Narration is an open-source TTS voice (vidIQ had no credits for the ElevenLabs voice); a human or premium voice would lift the emotion most.
- Rendered at 30 fps (CPU-only container); 60 fps would smooth the slow pushes.
