# Critique log

## Round 1
| hook | read | motion | variety | brand | sync | min |
|  7   |  6   |   6    |    8    |   8   |  -   |  6  |

Worst three:
1. [b39.5-40, 47.5-48, 67.5-68, 73.5-74, 79.5-80, 85-86, 91.5-92] caption swaps: outgoing slip (inBack) and incoming slip (spring) cross mid-frame, timestamps print over each other ("02:22 MILITARY RADAR", "2014–17 24 MARCH") -> reads as a glitch -> drive both with one shared whip curve so they travel as a pair (old exits right as new arrives from left, never overlapping).
2. [all captions, phone] Courier 44 px caption and 30 px red sub-labels are thin at phone size -> caption 48 px / 60 lh, sub-labels 33-36 px.
3. [b0-8] "VANISHED" overruns the newspaper sheet; [b138-144] dateline overlaps the bottom row of the 239 marks; [b92-98] search grid is a sliver at z 36 -> fitSize the headline, lift the marks 90 px, push the search camera to z 50.

Also: "INDIA" label collides with the satellite tag (removed).
Checks failed: caption overlap (1). Sound not checked yet.
Verdict: ANOTHER ROUND

## Round 2
| hook | read | motion | variety | brand | sync | min |
|  8   |  8   |   8    |    8    |   8   |  8   |  8  |

Sync: 52/65 hits within 20 ms, median 2 ms; the 13 outside are whooshes/swells that peak on the hit by design (no sharp onset). Mix -14.1 LUFS / -1.2 dBTP.
Worst three:
1. [b120-131] timestamp "2018 · 2025" disagrees with the swath tag "2018 · 2025–26" -> use "2018 · 2025–26", fitted to 840 px.
2. [b92-98] sonar grid still a thin sliver on the arc -> widen the band to ±1.5° so the squares read as squares.
3. [b107-111] debris place tags at 24 px are below phone legibility -> 28 px.
Checks: caption whips now travel as a pair (strip whip_40), no overlap. Longest gap without a new event ≈ 2.5 s (memorial hold, intentional).
Verdict: ANOTHER ROUND

## Round 3
| hook | read | motion | variety | brand | sync | min |
|  8   |  8   |   8    |    8    |   8   |  8   |  8  |

Worst three (fixed):
1. [b0] frame 0 caught "A BOEING 777" mid-spring with half-scaled glyphs -> line 1 starts settling 1.1 beats before frame 0, so frame 0 is a finished headline with the sheet still landing; VANISHED slams at b0.9.
2. [b93-97] counter "km²" slides as the digit width changes and smears under motion blur -> number right-aligned to a fixed edge, unit fixed.
3. [b130-132] about two beats of near-empty paper as the map fades before the first marks -> accepted: it is the breath before the memorial and the score drops to the pad there.
Checks: all pass. Verdict: READY
