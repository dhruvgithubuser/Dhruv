#!/usr/bin/env bash
# Low-disk render: bundle once, render 10-second chunks (one browser each, so Chrome never runs out of blob space),
# then decode all chunks and encode the final video ONCE at a constant 30 fps (2-pass x264), with the joined audio
# normalised to -14 LUFS. Never stream-copy chunks together: that breaks timestamps and makes playback stutter.
#   bash scripts/render-chunks.sh <work_dir>
set -euo pipefail
cd "$(dirname "$0")/.."
WORK=${1:?work dir}
COMP=ChurchillWanted
OUT=output/churchills-wanted-poster-1899.mp4
B=${REMOTION_BROWSER:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
mkdir -p "$WORK"
rm -rf "${WORK:?}/bundle" "$WORK"/part_*.mkv
npx remotion bundle src/index.ts --out-dir="$WORK/bundle" --log=error
N=$(python3 -c "import json,math;print(math.ceil(json.load(open('src/data/timeline.json'))['duration'])*30)")
INS=(); FL=""; n=0
for ((s=0; s<N; s+=300)); do
  e=$((s+299)); [ $e -ge $N ] && e=$((N-1))
  npx remotion render "$WORK/bundle" $COMP "$WORK/part_$s.mkv" --frames=$s-$e --browser-executable="$B" --codec=h264 --crf=14 \
    --pixel-format=yuv420p --audio-codec=pcm-16 --gl=swiftshader --concurrency=1 --log=error
  INS+=(-i "$WORK/part_$s.mkv"); FL="$FL[$n:v][$n:a]"; n=$((n+1)); echo "chunk $s-$e"
done
ffmpeg -loglevel error -y "${INS[@]}" -filter_complex "${FL}concat=n=$n:v=1:a=1[v][a];[a]anullsink" -map "[v]" -r 30 -c:v libx264 -preset slow -b:v 9000k -pass 1 -passlogfile "$WORK/x264" -an -f mp4 /dev/null
ffmpeg -loglevel error -y "${INS[@]}" -filter_complex "${FL}concat=n=$n:v=1:a=1[v][a];[a]loudnorm=I=-14:TP=-1:LRA=11[an]" -map "[v]" -map "[an]" -r 30 \
  -c:v libx264 -preset slow -b:v 9000k -pass 2 -passlogfile "$WORK/x264" -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$OUT"
rm -f "$WORK"/part_*.mkv "$WORK"/x264*
cp public/assets/sound/voiceover.mp3 output/voiceover.mp3
node scripts/make-srt.mjs > output/churchills-wanted-poster-1899.srt
ffprobe -v error -show_entries stream=codec_name,width,height,avg_frame_rate -show_entries format=duration,size -of compact "$OUT"
