#!/usr/bin/env bash
# Full render: Remotion (H.264 1920x1080 30 fps + mixed audio) -> -14 LUFS master + upload copy + SRT.
set -euo pipefail
cd "$(dirname "$0")/.."
BFLAG=()
[ -n "${REMOTION_BROWSER:-}" ] && BFLAG=(--browser-executable="$REMOTION_BROWSER")
mkdir -p output
npx remotion render src/index.ts AI171 output/_raw.mp4 "${BFLAG[@]}" --codec=h264 --crf=17 --pixel-format=yuv420p --audio-codec=aac --audio-bitrate=320k --gl=swiftshader
ffmpeg -loglevel error -y -i output/_raw.mp4 -c:v copy -af "loudnorm=I=-14:TP=-1:LRA=11" -ar 48000 -c:a aac -b:a 320k -movflags +faststart output/ai171-thirty-two-seconds.mp4
rm -f output/_raw.mp4
ffmpeg -loglevel error -y -i output/ai171-thirty-two-seconds.mp4 -c:v libx264 -preset medium -crf 21 -pix_fmt yuv420p -c:a copy -movflags +faststart output/ai171-thirty-two-seconds_upload.mp4
cp public/audio/voiceover.mp3 output/narration.mp3
node scripts/make-srt.mjs > output/ai171-thirty-two-seconds.srt
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate -show_entries format=duration -of compact output/ai171-thirty-two-seconds.mp4
