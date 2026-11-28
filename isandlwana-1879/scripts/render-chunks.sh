#!/usr/bin/env bash
# Resumable long-video render: bundle once, render 30-second chunks (lossless-ish h264 + PCM in mkv; a chunk already on
# disk is kept, so a restarted container resumes where it stopped), then decode all chunks and encode the final video
# ONCE at a constant 30 fps with the joined audio normalised to -14 LUFS. Never stream-copy chunks together: that
# breaks timestamps and makes playback stutter.
#   bash scripts/render-chunks.sh <work_dir>
set -euo pipefail
cd "$(dirname "$0")/.."
WORK=${1:?work dir}
COMP=Isandlwana
OUT=output/isandlwana-1879-zulu-vs-british.mp4
B=${REMOTION_BROWSER:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
STEP=900
mkdir -p "$WORK" output
[ -f "$WORK/bundle/index.html" ] || npx remotion bundle src/index.ts --out-dir="$WORK/bundle" --log=error
N=$(python3 -c "import json,math;print(math.ceil(json.load(open('src/data/timeline.json'))['duration'])*30)")
INS=(); FL=""; n=0
for ((s=0; s<N; s+=STEP)); do
  e=$((s+STEP-1)); [ $e -ge $N ] && e=$((N-1))
  if [ ! -s "$WORK/part_$s.mkv" ]; then
    npx remotion render "$WORK/bundle" $COMP "$WORK/tmp_$s.mkv" --frames=$s-$e --browser-executable="$B" --codec=h264 --crf=16 \
      --pixel-format=yuv420p --audio-codec=pcm-16 --gl=swiftshader --concurrency=3 --log=error
    mv "$WORK/tmp_$s.mkv" "$WORK/part_$s.mkv"
  fi
  INS+=(-i "$WORK/part_$s.mkv"); FL="$FL[$n:v][$n:a]"; n=$((n+1)); echo "chunk $s-$e $(date +%H:%M)"
done
ffmpeg -loglevel error -y "${INS[@]}" -filter_complex "${FL}concat=n=$n:v=1:a=1[v][a];[a]loudnorm=I=-14:TP=-1:LRA=11[an]" -map "[v]" -map "[an]" -r 30 \
  -c:v libx264 -preset medium -crf 18 -maxrate 12M -bufsize 24M -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$OUT"
cp public/assets/sound/voiceover.mp3 output/voiceover.mp3
node scripts/make-srt.mjs > output/isandlwana-1879-zulu-vs-british.srt
ffprobe -v error -show_entries stream=codec_name,width,height,avg_frame_rate -show_entries format=duration,size -of compact "$OUT"
