#!/usr/bin/env bash
# Full render: Remotion (H.264 1080x1920 30 fps + mixed audio) -> loudness-normalised master,
# separate narration, SRT subtitles and the thumbnail. Run from the project root.
set -euo pipefail
cd "$(dirname "$0")/.."
BROWSER=${REMOTION_BROWSER:-}
BFLAG=()
[ -n "$BROWSER" ] && BFLAG=(--browser-executable="$BROWSER")
mkdir -p output

npx tsx scripts/validate-assets.ts
npx remotion render src/index.ts Documentary output/_raw.mp4 "${BFLAG[@]}" \
  --codec=h264 --crf=17 --pixel-format=yuv420p --audio-codec=aac --audio-bitrate=320k --gl=swiftshader
# master the mix to -14 LUFS integrated / -1 dBTP (YouTube / Instagram reference)
ffmpeg -loglevel error -y -i output/_raw.mp4 -c:v copy \
  -af "loudnorm=I=-14:TP=-1:LRA=11" -ar 48000 -c:a aac -b:a 320k -movflags +faststart \
  output/the-soldier-who-refused-ww3.mp4
rm -f output/_raw.mp4
cp public/audio/voiceover.mp3 output/narration.mp3
node scripts/make-srt.mjs > output/the-soldier-who-refused-ww3.srt
npx remotion still src/index.ts Thumbnail output/thumbnail.png "${BFLAG[@]}" --gl=swiftshader
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate -show_entries format=duration -of compact output/the-soldier-who-refused-ww3.mp4
