# The Nvidia Honey Trap: publish kit

Facts as of **Nov 12, 2026**. The board had met but announced no decision. If it decides before you post,
re-record the last line ("As of November 12th, there's no decision") and the end card.

## Title (yt-package, scored 100/100)
**Nvidia's $450B Honey Trap, Explained**  (36 chars, survives the mobile cut)
Cover text: **WHY DC WORRIES**  (different words from the title, 3 words)

Runner-up: **The $450B Honey Trap at Nvidia** / cover: **NOT ABOUT CHEATING**

Note: "$450B" is CBS News' count of market value lost since Nov 8. The drop also followed the second-relationship
and ouster reports, so the description says "since the probe began", not "caused by".

## Description (YouTube Shorts / Reels caption)
Nvidia CEO Jensen Huang admitted an affair with Alice Huang, a woman U.S. authorities reportedly suspect was recruited by Chinese intelligence: an alleged honey trap.
Here's why Washington cares more than Wall Street, even with $450B+ in Nvidia value gone since the probe began (CBS News).

What's covered:
- why Nvidia's AI chips are a national-security asset (U.S. export limits on China)
- what The New York Times reported about the alleged spy, and what China and Nvidia's board said
- the second-relationship report (NYT) and the board ouster report (WSJ)
- Trump's defense of Huang, and Congress's Nov 18 closed-door briefing request

All allegations are unproven. China calls the spy story "unsubstantiated"; Nvidia's board says it has
"no reason to believe" secrets were compromised.

Sources: The New York Times, The Wall Street Journal, CBS News, Axios, CNBC, Reuters (Nov 8-12, 2026).

#Nvidia #JensenHuang #HoneyTrap #AI #China #Shorts

## Tags (for disambiguation only)
nvidia, jensen huang, alice huang, nvidia honey trap, jensen huang spy, nvidia ceo affair, megaspeed,
nvidia board, ai chips china, export controls, nvda stock, nvidia scandal explained

## Query test
| query a person types | title | first 2 lines |
|---|---|---|
| nvidia honey trap | yes | yes |
| jensen huang spy | no | yes ("Jensen Huang", "Chinese intelligence") |
| jensen huang alice huang | no | yes |

## Script (as narrated, 96 s)
Hook (hookscore 61, Direct Address, best of 15 tested):
> If you own an index fund, an alleged Chinese honey trap just cost you money. But that's not why Washington is worried.

Runner-up hook (60): You have never met Jensen Huang, but his affair just hit your retirement account. Here is why Washington is even more worried than Wall Street.

Full narration: `honeytrap/audio/script.json`. Shot list: `honeytrap/docs/shotlist.md`.

## Viral analysis (yt-viral, 91 videos on this story, Nov 7-12)
Ranked by views over each channel's own median:
| multiple | views | channel | title | formula |
|---|---|---|---|---|
| 1407x | 1.9M | The Megawatts | Nvidia CEO Jensen Huang and Chinese Spy? This is why Elon Musk started making chips | Unclassified |
| 313x | 158K | NDTV | Who Did Jensen Huang Cheat With / Who Is Alice Huang... | The Question |
| 247x | 81K | NDTV World | Jensen Huang's 'Spy Probe' Shock: Who Is Alice Huang... | The Question |
| 17x | 383K | Sky News | Nvidia's spy scandal is more dangerous than you think | Unclassified |
| 13x | 431K | BBC News | Why is Nvidia CEO Jensen Huang's affair such a big deal? | The Question |

What they share: they ask a question the headline doesn't answer ("who is she", "why does it matter"),
rather than repeating the gossip. This reel takes the "why it matters" angle.

## Production notes
- Narrator: Kokoro-82M, voice `af_heart` (open-weight TTS, run locally), chosen over 6 others because its
  Whisper transcript was word-perfect on "Nvidia", "Huang" and "Ministry of State Security".
- Music + SFX: synthesized in code (`honeytrap/audio/score.py`), original, no licensing.
- Map: Natural Earth via `world-atlas`. No photos, likenesses, logos or mastheads are used.
