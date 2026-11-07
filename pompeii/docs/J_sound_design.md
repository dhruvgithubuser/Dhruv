# J. Sound design and music timeline

Everything is synthesized in code by `audio/sound.py` (score + ambience + SFX). There are no samples or library tracks, so there are no licences to clear. The voice-over is `audio/vo.wav`. `mix.mjs` (from the motion-reel toolkit) sums the stems, ducks the music under the voice (sidechain, 6:1), and masters to **-14 LUFS integrated / -1 dBTP**. Measured result: -14.1 LUFS, -1.3 dBTP.

Stem levels in the final mix: music -7 dB, SFX/ambience -1 dB, voice +2 dB. Whisper transcription of the loudest passages (eruption, ash, currents) recovers the narration word for word.

## Music cue sheet (key: D; minor for danger, major for life and memory)
| Time | Cue | Content |
|---|---|---|
| 0:00.0-0:30.5 | M1 "Final Morning" | D major, strings pad + harp arpeggio + breathy flute melody; warm, unhurried |
| 0:30.5-0:36.6 | M1b turn | Low D minor strings, D1 drone, timpani roll and hit on "change everything" |
| 0:36.6-1:05.6 | M2 "City Life" | Pastoral D major (G-D/F#-Em-A), pizzicato pulse, light frame-drum thump, flute melody, harp |
| 1:05.6-1:16.1 | M2b unease | Tremolo strings on D minor with Bb, low drone; a rumble under the vineyards |
| 1:16.1-1:49.0 | M3 "The Mountain" | Suspense: D1 drone, tremolo strings Dm-Bb-Gm-A, heartbeat taiko every 1.3 s, high harmonics on the cutaway |
| 1:49.0-2:09.5 | M4a "Dating the eruption" | Quiet: timpani on "AD 79", soft strings, ticking pizzicato; timpani roll into the blast |
| 2:09.5-2:27.5 | M4b ERUPTION | Full hit: choir + strings tutti on D minor, taiko + timpani; then a driving low-string ostinato at ~100 bpm with taiko |
| 2:27.5-2:41.8 | M4c fragile | Ostinato stops; high string harmonics (A5-D6-E6) over the drone as the ash begins |
| 2:41.8-3:15.5 | M5 "Ash Falls" | Ostinato returns (~94 bpm) with taiko; Dm-Gm-Bb-A; slowly denser |
| 3:15.5-3:42.7 | M6 "Chaos" | Faster ostinato (~150 bpm feel), tremolo, Eb cluster against D; builds |
| 3:42.7-3:44.9 | DROP | Music cuts on "still to come": only a sub drone. SILENCE CUE |
| 3:44.9-4:14.6 | M7 "Currents" | Restrained: low choir drone, deep taiko every 2.2 s |
| 4:14.6-4:20.3 | M7b climax | Choir + strings cluster (D-Eb-A) with a timpani roll as the current reaches the town |
| 4:20.3-4:26.4 | SILENCE | A single high A fading; wind only. SILENCE CUE |
| 4:26.4-4:56.6 | M8 "Lament" | Solo cello melody over a sparse D minor pad |
| 4:56.6-5:26.3 | M9 "Centuries" | F-C-Dm-Bb strings, ticking harp ostinato: the passage of time |
| 5:26.3-6:04.8 | M10 "Rediscovery" | Curious: D lydian strings, pizzicato, celesta/bell accents |
| 6:04.8-6:38.0 | M11 "A Window" | Warm D major strings and harp, flute melody |
| 6:38.0-7:08.4 | M12 "Reflection" | Emotional build: D-A/C#-Bm-G-D/F#-Em-A, choir joins, cello line |
| 7:08.4-7:19.3 | M12b resolve + logo | D major tutti on "This was Pompeii", bells on the logo, fade to silence |

## Ambience beds (crossfaded 0.9 s at every cut)
Bed components: birds, crowd murmur, alarmed crowd, footsteps, carts, fountain, wind, insects, deep rumble, pumice patter (street and roof), fire crackle, sea, the pyroclastic "rush", room tone, excavation picks, hammers.

| Ambience preset | Shots |
|---|---|
| `dawn` | 1A, 1C |
| `street_morning` | 1B, 1D, 1E |
| `map` | 2A |
| `market` | 2B |
| `room` | 2C, 11D, 11F |
| `forum` | 2D |
| `country` | 2E |
| `wind` | 3A, 4G, 4H |
| `quake` | 3B |
| `forum_work` | 3C |
| `deep` | 3D, 3E |
| `paper` | 4A, 4B, 11C |
| `eruption` | 4C, 4I |
| `street_alarm` | 4D, 4F |
| `sea` | 4E |
| `map_dark` | 5A, 7D, 8D |
| `pumice` | 5B, 5C, 5E, 5G, 5H |
| `interior_pumice` | 5D, 5F |
| `eruption_night` | 6A, 6G |
| `night_chaos` | 6B, 6C, 6D, 6E |
| `interior_quake` | 6F |
| `science` | 7A, 7C |
| `rush` | 7B, 7E |
| `silence` | 7F |
| `aftermath` | 8A, 8B, 8C, 8E |
| `time` | 9A, 9B, 9C, 9D |
| `dig` | 10A, 10B, 10C, 10E |
| `museum` | 10D |
| `modern_site` | 10F, 11A, 11B, 11E |
| `street_evening` | 12A |
| `evening` | 12B, 12C, 12D, 12E |
| `end` | 12F |

## Timed SFX (from shots.js)
| Time | Shot | Sound | Gain |
|---|---|---|---|
| 0:00.0 | 1A | swell | 0.5 |
| 0:15.6 | 1C | swell | 0.6 |
| 0:17.0 | 1C | boom | 0.35 |
| 0:23.4 | 1D | wood | 0.5 |
| 0:24.4 | 1D | wood | 0.4 |
| 0:25.4 | 1D | wood | 0.4 |
| 0:30.7 | 1E | rumble | 0.25 |
| 0:37.0 | 2A | paper | 0.6 |
| 0:39.8 | 2A | tick | 0.4 |
| 0:41.8 | 2A | tick | 0.4 |
| 0:43.2 | 2A | whoosh | 0.3 |
| 0:44.8 | 2A | tick | 0.4 |
| 0:47.7 | 2B | whoosh | 0.4 |
| 0:48.7 | 2B | tick | 0.35 |
| 0:49.9 | 2B | tick | 0.35 |
| 0:51.1 | 2B | tick | 0.35 |
| 1:10.4 | 2E | rumble | 0.3 |
| 1:19.8 | 3B | quake | 0.9 |
| 1:19.9 | 3B | impact | 0.6 |
| 1:23.0 | 3B | crack | 0.5 |
| 1:25.3 | 3B | crack | 0.4 |
| 1:31.2 | 3C | pick | 0.4 |
| 1:31.9 | 3C | pick | 0.4 |
| 1:32.6 | 3C | pick | 0.4 |
| 1:34.1 | 3D | rumble | 0.5 |
| 1:49.1 | 4A | impact | 0.6 |
| 1:52.4 | 4A | paper | 0.6 |
| 1:59.1 | 4B | paper | 0.6 |
| 2:02.9 | 4B | tick | 0.3 |
| 2:09.5 | 4C | blast | 1 |
| 2:09.5 | 4C | impact | 0.8 |
| 2:10.0 | 4C | rumble | 0.8 |
| 2:22.4 | 4E | shimmer | 0.4 |
| 2:36.8 | 4I | rumble | 0.6 |
| 2:42.1 | 5A | paper | 0.5 |
| 2:44.2 | 5A | whoosh | 0.3 |
| 2:48.4 | 5B | pumice_start | 0.7 |
| 3:05.2 | 5G | creak | 0.6 |
| 3:05.8 | 5G | collapse | 1 |
| 3:17.3 | 6A | thunder | 0.6 |
| 3:19.1 | 6A | thunder | 0.5 |
| 3:26.6 | 6C | collapse | 1 |
| 3:35.2 | 6F | rumble | 0.6 |
| 3:37.6 | 6F | crack | 0.4 |
| 3:41.3 | 6G | thunder | 0.5 |
| 3:42.9 | 6G | sub | 0.7 |
| 3:50.2 | 7B | rush | 0.9 |
| 3:50.2 | 7B | riser | 0.5 |
| 3:56.7 | 7C | whoosh | 0.5 |
| 4:01.5 | 7C | thud | 0.6 |
| 4:06.1 | 7D | rush | 0.5 |
| 4:11.1 | 7D | rush | 0.5 |
| 4:14.8 | 7E | rush | 1 |
| 4:18.0 | 7E | impact | 0.5 |
| 4:32.6 | 8B | thud | 0.4 |
| 4:33.8 | 8B | thud | 0.4 |
| 4:35.0 | 8B | thud | 0.4 |
| 4:43.6 | 8D | pin | 0.5 |
| 4:44.6 | 8D | pin | 0.5 |
| 4:45.6 | 8D | pin | 0.5 |
| 4:46.6 | 8D | pin | 0.5 |
| 4:57.1 | 9A | clock | 0.4 |
| 5:13.9 | 9C | clock | 0.5 |
| 5:20.6 | 9D | shimmer | 0.6 |
| 5:26.6 | 10A | pick | 0.5 |
| 5:27.4 | 10A | pick | 0.5 |
| 5:28.2 | 10A | pick | 0.5 |
| 5:29.0 | 10A | pick | 0.5 |
| 5:29.8 | 10A | pick | 0.5 |
| 5:30.6 | 10A | pick | 0.5 |
| 5:32.3 | 10B | paper | 0.4 |
| 5:43.8 | 10D | tick | 0.4 |
| 5:44.8 | 10D | tick | 0.4 |
| 5:45.8 | 10D | tick | 0.4 |
| 5:46.8 | 10D | tick | 0.4 |
| 5:47.8 | 10D | tick | 0.4 |
| 6:05.6 | 11A | whoosh | 0.5 |
| 6:09.2 | 11A | whoosh | 0.4 |
| 6:15.5 | 11C | paper | 0.5 |
| 6:31.6 | 11F | shimmer | 0.5 |
| 7:08.5 | 12E | boom | 0.5 |
| 7:10.4 | 12F | bell | 0.5 |

## Silence and space
- **Cold open** (0:00-0:03): birds and dawn wind only, before the first word.
- **The drop** at the end of S06 ("...still to come"): the music cuts to a sub drone.
- **After the currents** (7F): music falls to one high note, then wind. The toy-horse shot plays almost silent.
- **End:** music resolves, then bells on the logo, then a fade to silence.

## Re-scoring with a composer
Keep the cue boundaries above, which are tied to narration lines. Write in D, hit the eruption at 2:09.5 and the drop at 3:42.7, and leave space under the voice (avoid busy 1-4 kHz content during speech).
