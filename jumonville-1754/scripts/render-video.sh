#!/usr/bin/env bash
# Render the 16:9 long-form cut: master (CRF 18, -14 LUFS), a 1080p upload copy, a small 720p copy, subtitles.
set -euo pipefail
cd "$(dirname "$0")/.."
BFLAG=()
[ -n "${REMOTION_BROWSER:-}" ] && BFLAG=(--browser-executable="$REMOTION_BROWSER")
N=the-15-minute-ambush-that-started-a-world-war
mkdir -p output
npx remotion render src/index.ts Jumonville output/_raw.mp4 "${BFLAG[@]}" --codec=h264 --crf=18 --pixel-format=yuv420p --audio-codec=aac --audio-bitrate=256k --gl=swiftshader --concurrency=4
ffmpeg -loglevel error -y -i output/_raw.mp4 -c:v copy -af "loudnorm=I=-14:TP=-1:LRA=11" -ar 48000 -c:a aac -b:a 256k -movflags +faststart output/${N}_master.mp4
rm -f output/_raw.mp4
ffmpeg -loglevel error -y -i output/${N}_master.mp4 -c:v libx264 -preset medium -crf 23 -maxrate 4500k -bufsize 9000k -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart output/${N}_1080p.mp4
ffmpeg -loglevel error -y -i output/${N}_master.mp4 -vf scale=1280:720 -c:v libx264 -preset medium -crf 26 -maxrate 1500k -bufsize 3000k -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart output/${N}_720p_small.mp4
cp public/assets/sound/voiceover.mp3 output/voiceover.mp3
node scripts/make-srt.mjs > output/${N}.srt
ls -la output/*.mp4
