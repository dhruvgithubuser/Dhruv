# Reference analysis

**Source:** the brief's PART 1 asks for a reference video, but no video file was provided. What was provided:
three phone screenshots of YouTube search results for "The Submarine Officer..." (competing Shorts on
Vasili Arkhipov / B-59). This analysis is from those thumbnails; it describes the *visual language*
to match, not footage to copy. Nothing from those videos is reused.

## Visual characteristics seen in the top Shorts
- Painted, semi-realistic 2D illustration (Sketchy Tales, The Timeless Archive, 102eugi2 es real):
  dark Soviet submarine interiors, red emergency light, officers in black naval uniforms, gauges.
- A recurring explainer graphic: **three officers, two ticks, one cross** ("3 officers must agree",
  Saga of Centuries; TheTurningPointFiles: captain ✓ / political officer ✓ / Arkhipov ✗ over a map).
- Big one-word typography as the hook: "NO", "ONE MAN SAID NO", "WAR HAD...", "except".
- Historical portrait of Arkhipov used as an anchor image.
- Maps: Atlantic / Cuba with the submarine's position.

## What this film takes from that language
| Element | Implementation |
|---|---|
| Painted semi-realistic stills | DreamShaper 8 painted illustrations, 2.5-D depth parallax (DepthShot) |
| Red emergency interiors | RedAlert pulse + flicker over the control-room / crew scenes |
| Three-officer decision graphic | `Officers` component: captain ✓, political officer ✓, Arkhipov ✕ + "NO" stamp |
| Big bold hook words | word-by-word captions (Inter 800, black stroke), key words in amber |
| Maps | `Globe1962`: USA, Cuba, USSR, quarantine line, B-59 approach; `Sonar`; `DepthCharges` |
| Rhythm | 18 scenes in 88 s ≈ a new picture every 4–5 s; each scene has a camera move |

## Camera / transitions
Slow push-ins on portraits, lateral tracks on interiors, log-scale zooms; scene changes are short
push-in dissolves (10 frames); impact shakes on explosions; a white surfacing flash; fade to black.

## Typography
Captions centred at ~y 1270 (above the Reels/Shorts UI), 2–3 words per beat; IDs as lower-thirds;
data readouts in IBM Plex Mono.

## Audio
Dark drone + hull groan, sonar pings during the hunt, depth-charge booms synced to the shockwaves,
radio static, a pulse from the torpedo reveal to Arkhipov's "no", warm major-key resolve on surfacing.
