# I. Voice-over and subtitle files

## Files
| File | What |
|---|---|
| `audio/script.json` | The narration source: scene by scene, line by line, with the pause after each line |
| `audio/vo.wav` | The placed narration (48 kHz), male voice, 7:19. Committed as `audio/vo.flac`; restore with `ffmpeg -i pompeii/audio/vo.flac -ac 2 pompeii/audio/vo.wav` |
| `audio/vo/takes/*.wav` | One cached take per line (hash of voice + speed + text); never regenerated unless the text changes |
| `timeline.json` | Scene, line and **word** timings; the clock for picture, subtitles and sound |
| `deliverables/voiceover_script.txt` | Clean text for a human narrator, scene-headed with timecodes |
| `deliverables/pompeii_en.srt` | English subtitles, 103 cues, max 2 lines x 42 characters, 1-6 s each |
| `deliverables/pompeii_en.vtt` | The same as WebVTT |
| `deliverables/youtube_chapters.txt` | Chapter list for the description |

## The voice
- Engine: **Kokoro-82M** (Apache-2.0, runs locally on CPU via `kokoro-onnx`). Voice `am_michael` (male, warm, US English), speed 1.0.
- Chain: trim, high-pass 70 Hz, low-mid warmth and presence lift, 4:1 RMS compression, peak-normalise.
- Each line was transcribed back with faster-whisper (`small.en`) and checked against the script. All 77 lines match. The only differences are formatting ("A .D." for "A.D.", "1748" for "seventeen forty-eight").

### Regenerate
```bash
pip install kokoro-onnx soundfile scipy faster-whisper
# model.onnx + voices.bin (Kokoro v1.0, from huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX)
python pompeii/audio/build_vo.py --kokoro <dir> --whisper <faster-whisper-small.en dir>
python3 pompeii/tools/make_subs.py          # SRT/VTT/chapters
node pompeii/tools/export_shots.mjs          # shots re-anchor to the new timings automatically
```

### Upgrading the voice
The synthetic voice is clear, but it is not a premium documentary read. Better options, in order:
1. **A human narrator.** Record `deliverables/voiceover_script.txt` dry, one file per line (or one long take cut at the pauses), and drop the files into `audio/vo/takes/` under the same names. Or replace `vo.wav` and re-time `timeline.json` with `build_vo.py` (it accepts any audio through the same whisper alignment).
2. **ElevenLabs** (a deep documentary male voice such as a "narrator" premade). Generate each line and keep the same file layout.
Either way, keep the line breaks: the shot list is anchored to them.

## Subtitle style (if burned in for social cut-downs)
Cinzel is for titles only. Use a clean sans for subtitles (YouTube's own CC renderer is recommended), 2 lines max, bottom-centre, above the honesty tag. The main YouTube upload uses the **SRT as closed captions**, not burned in, so viewers can turn them off and auto-translation works.
