# Buried Chronicles: locked visual style (from 15 Nov 2026)

**One style for every Short and long video: Vox-style parchment with animated paper-cutout characters.**
Mixing styles (realistic AI scenes, then Vox, then painted) gives YouTube and viewers no single identity to recognise. The Valkyrie Short is the reference.

## The look
- **Stage:** aged parchment, a faint map grid, sepia light, vignette and film grain.
- **Maps:** coastline maps on parchment with red attack routes, green or blue defenders, pins with Oswald labels, and approximate historical regions as hatched washes.
- **Real photos:** archival photographs as polaroid cards, with a typewriter caption and credit.
- **Text:**
  - typewriter tags with a red rule (e.g. "COLONEL · AGE 36");
  - red rubber stamps;
  - counting numbers;
  - bold word-by-word captions with key words in gold.
- **Charts:** one-dot-per-man and icon grids for numbers (150 vs 4,000, soldiers lost).

## Characters with motion (new standard)
Paper-cutout characters drawn in code, with a white paper edge and a drop shadow. Every appearance is identical, so viewers recognise them.
- **Motions:**
  - walk and run, march in step, ride (bobbing horse);
  - point, salute, aim and fire (muzzle flash), raise a fist, write a letter, read;
  - turn the head, nod while talking, breathe and sway when idle, blink;
  - fall, crouch behind cover.
- **Famous leaders:** a real archival face cut out on an animated body (e.g. Napoleon, Custer, Churchill, Yamamoto). Signature props make them readable at a glance: Napoleon's bicorne, Churchill's cigar, Custer's buckskin and curls.
- **Uniform sets, built once and reused:**
  - Napoleonic French; British redcoat (1800s);
  - US cavalry (1870s); Civil War;
  - WWI Tommy; WWI German;
  - WW2 GI; Wehrmacht officer; Japanese naval officer;
  - Royal Navy sailor (Nelson era).
- **Warriors:** Zulu and Lakota/Cheyenne warriors drawn respectfully: accurate shields, dress and feathers, never caricature.
- **Crowds:** many small cutout figures in formation, for charges and lines.

## Sound and voice
The same narrator voice, war score and sound-design set every time. Narration follows `~/.claude/youtube/voice.md`.

## What we stop
- realistic AI-photo scenes as the main visuals;
- painted styles;
- mixing styles inside one video.

Real archival photos stay, always as polaroid cards inside the Vox stage.

## Production standard (from 16 Nov 2026, every video)
**Base style:** Vox with moving cut-out characters. Each video gets its own flavour so videos don't look copy-pasted:
- Frontier 1876 (dusty prairie parchment, for Custer);
- Pacific 1941 naval chart (dark navy, for Yamamoto);
- more flavours to come.

1. **Character motion in every scene:** walking, riding, pointing, writing, saluting, nodding, breathing. Famous people get their real archival face on an animated body.
2. **Visual effects (`src/vfx.tsx`):**
   - explosions (flash, fireball, smoke columns, debris);
   - burning targets;
   - anti-aircraft tracers;
   - smoke trails behind planes;
   - embers and dust;
   - screen shake on impacts and stamps;
   - a warm light-leak flash on every scene change;
   - a subtle film flicker.
3. **Narrator voice, clear:**
   - Kokoro blend: 80% am_michael, 20% am_onyx.
   - Broadcast chain: high-pass at 75 Hz, a cut in the 180–420 Hz mud range, a presence lift at 2.2–5.5 kHz, a little air above 9 kHz, gentle 3:1 compression, peaks at −1 dB.
4. **War music under the voice, every time:** a war score of big war drums, snare march, low-string ostinato and a brass chorale, which builds with the story.
   - **Ducking:** about 0.62 of full level in gaps, dropping to about 0.20 under the voice, so the narrator always stays clear.
   - **Sound effects:** explosion, plane fly-by, gallop, volley, bugle, paper and stamp hits.
5. **Thumbnails:** the editorial poster style:
   - a headline in white and gold;
   - the hero's real portrait blended into the scene;
   - the key document;
   - a stat box;
   - a badge;
   - two icon captions;
   - a dark vignette.
