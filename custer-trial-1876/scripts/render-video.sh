#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
BFLAG=()
[ -n "${REMOTION_BROWSER:-}" ] && BFLAG=(--browser-executable="$REMOTION_BROWSER")
mkdir -p output
npx remotion render src/index.ts CusterTrial output/_raw.mp4 "${BFLAG[@]}" --codec=h264 --crf=18 --pixel-format=yuv420p --audio-codec=aac --audio-bitrate=256k --gl=swiftshader --concurrency=3
ffmpeg -loglevel error -y -i output/_raw.mp4 -c:v copy -af "loudnorm=I=-14:TP=-1:LRA=11" -ar 48000 -c:a aac -b:a 256k -movflags +faststart output/the-trial-after-little-bighorn_master.mp4
rm -f output/_raw.mp4
ffmpeg -loglevel error -y -i output/the-trial-after-little-bighorn_master.mp4 -vf hqdn3d=2:2:3:3 -c:v libx264 -preset slow -b:v 5000k -pass 1 -passlogfile output/x264 -an -f mp4 /dev/null
ffmpeg -loglevel error -y -i output/the-trial-after-little-bighorn_master.mp4 -vf hqdn3d=2:2:3:3 -c:v libx264 -preset slow -b:v 5000k -pass 2 -passlogfile output/x264 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart output/the-trial-after-little-bighorn.mp4
rm -f output/x264*
cp public/assets/sound/voiceover.mp3 output/voiceover.mp3
node scripts/make-srt.mjs > output/the-trial-after-little-bighorn.srt
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate -show_entries format=duration,size -of compact output/the-trial-after-little-bighorn.mp4
