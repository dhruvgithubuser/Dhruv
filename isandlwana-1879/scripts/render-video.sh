#!/usr/bin/env bash
# Disk-lean render for the long video: one Remotion pass at a fixed YouTube-grade bitrate, then loudness to -14 LUFS (video stream copied).
set -euo pipefail
cd "$(dirname "$0")/.."
BFLAG=()
[ -n "${REMOTION_BROWSER:-}" ] && BFLAG=(--browser-executable="$REMOTION_BROWSER")
OUT=output/isandlwana-1879-zulu-vs-british.mp4
mkdir -p output
npx remotion render src/index.ts Isandlwana output/_raw.mp4 "${BFLAG[@]}" --codec=h264 --video-bitrate=7M --pixel-format=yuv420p --audio-codec=aac --audio-bitrate=256k --gl=swiftshader --concurrency=2
ffmpeg -loglevel error -y -i output/_raw.mp4 -c:v copy -af "loudnorm=I=-14:TP=-1:LRA=11" -ar 48000 -c:a aac -b:a 192k -movflags +faststart "$OUT"
rm -f output/_raw.mp4
cp public/assets/sound/voiceover.mp3 output/voiceover.mp3
node scripts/make-srt.mjs > output/isandlwana-1879-zulu-vs-british.srt
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate -show_entries format=duration,size -of compact "$OUT"
