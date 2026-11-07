# N. Final quality-control checklist

Status key: [x] checked in this build · [ ] for the human reviewer before publishing

## Historical accuracy
- [x] The eruption date is not presented as certain; the 24 August tradition and the autumn evidence are both shown (S04, 4A/4B)
- [x] The AD 62 earthquake is hedged ("about AD 62")
- [x] Phases are distinct: column and pumice/ash fall, then night, then pyroclastic currents; no lava at Pompeii
- [x] PDCs are drawn as ground-hugging gas/ash/rock clouds; the lava comparison is crossed out
- [x] Herculaneum first, Pompeii next morning: hedged ("studies of the deposits suggest"); no clock times
- [x] No casualty figure anywhere in the narration or on screen
- [x] No invented dialogue, identities or quotations; Pliny is paraphrased and attributed
- [x] Pre-79 Vesuvius is a single cone; the twin profile appears only after the time-lapse
- [x] Excavation dates: 1748 (Pompeii), Fiorelli in the 19th century, UNESCO 1997, about two-thirds excavated
- [ ] Second reader re-checks docs/A against the sources (open items listed there)

## Evidence vs reconstruction
- [x] Honesty tag on every shot (reconstruction / fictional / map / scientific / archival / present-day)
- [x] The fictional family is labelled every time it appears, and in the description
- [x] Archival images credited on screen and in the description
- [ ] Confirm the holding institution and reuse terms for the Capaldo watercolour

## Animation consistency
- [x] The four characters are drawn from one parameter set (lib/figures.js); identical in every shot
- [x] Light states progress without skipping a step between adjacent shots
- [x] Vesuvius sits in a consistent screen direction across aerials
- [x] Something changes on screen at least every 2-4 s (camera, people, particles, graphics)
- [x] No modern objects in AD 79 shots
- [x] Non-graphic throughout; no bodies or casts

## Picture
- [x] Contact sheets reviewed (whole film every 5 s) before the final render
- [x] Titles, chapter cards, callouts and map labels readable at half size (phone sheet)
- [x] No blank or flash frames at cuts; fade from black only at the head, fade out at the tail
- [x] 1920x1080, 30 fps, yuv420p, BT.709 (verified with ffprobe on the final file)

## Sound
- [x] Mix: -14.1 LUFS integrated, -1.3 dBTP true peak
- [x] Music ducks under the narration; whisper transcription of the loudest passages recovers every word
- [x] SFX tied to the shot list (same clock as the picture)
- [x] Silence cues in place (drop before "still to come", after the currents, end fade)
- [ ] Listen through on headphones and on a phone speaker

## Delivery
- [x] SRT/VTT (103 cues, ≤2 lines x 42 characters), chapters (12, first at 0:00, all ≥10 s)
- [x] Thumbnails 1280x720 (3 concepts)
- [x] Title, description, tags (≤500 characters), hashtags
- [ ] YouTube "altered or synthetic content" disclosure ticked (AI narration)
- [ ] End screen and cards added in YouTube Studio

## Known limitations of this build (honest notes)
- The art is **code-painted**: flat-shaded planes with painterly texture, not hand-painted frames. The characters are stylised rather than semi-realistic. docs/F and docs/G hold per-shot prompts to upgrade any shot to premium painted plates and image-to-video clips without changing the edit.
- The narration is a synthetic voice (Kokoro). It is clear, but a human or premium TTS narrator would lift the film considerably (docs/I).
- The score is synthesized (strings, choir, percussion in code). It is functional and on-cue, but not orchestral-library quality.
