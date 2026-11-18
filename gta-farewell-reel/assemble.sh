#!/usr/bin/env bash
# Assemble the GTA V Farewell × GTA VI Welcome reel from generated scene clips.
#
#   clips/01.mp4 ... clips/10.mp4   one clip per scene (any size, any fps, audio optional)
#   clips/05a.mp4 clips/05b.mp4     split scenes: a clip named NNa / NNb is cut to 3 s
#   audio/music.(mp3|wav|m4a)       optional: score, laid under the whole reel
#   audio/vo.(mp3|wav|m4a)          optional: one 60 s dialogue/voice-over track
#
# Output: out/gta_farewell_reel.mp4 (1080x1920, 24 fps, H.264 + AAC, about -14 LUFS)
#
# Options (environment variables):
#   SCENE_LEN=6     seconds kept from each full scene clip
#   SPLIT_LEN=3     seconds kept from each NNa / NNb clip
#   CLIP_OFFSET=0.3 seconds skipped at the start of every clip (AI clips often start stiff)
#   CLIP_VOL=0.7    volume of the clips' own audio   MUSIC_VOL=0.5   VO_VOL=1.0
#   TITLE1="GOODBYE GTA V"  TITLE2="HELLO GTA VI"  FONT=/path/to/font.ttf
set -euo pipefail
cd "$(dirname "$0")"

SCENE_LEN=${SCENE_LEN:-6}; SPLIT_LEN=${SPLIT_LEN:-3}; CLIP_OFFSET=${CLIP_OFFSET:-0.3}
CLIP_VOL=${CLIP_VOL:-0.7}; MUSIC_VOL=${MUSIC_VOL:-0.5}; VO_VOL=${VO_VOL:-1.0}
TITLE1=${TITLE1:-GOODBYE GTA V}; TITLE2=${TITLE2:-HELLO GTA VI}

if [[ -z "${FONT:-}" ]]; then
  for f in fonts/*.ttf /usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf \
           /Library/Fonts/Arial\ Bold.ttf /System/Library/Fonts/Supplemental/Arial\ Bold.ttf \
           C:/Windows/Fonts/arialbd.ttf; do
    [[ -f "$f" ]] && FONT=$f && break
  done
fi
[[ -n "${FONT:-}" ]] || { echo "No font found: set FONT=/path/to/font.ttf"; exit 1; }

shopt -s nullglob
clips=(clips/*.mp4 clips/*.mov)
[[ ${#clips[@]} -gt 0 ]] || { echo "Put your scene clips in clips/ (01.mp4 ... 10.mp4)"; exit 1; }
IFS=$'\n' clips=($(printf '%s\n' "${clips[@]}" | sort)); unset IFS

rm -rf out/tmp && mkdir -p out/tmp
: > out/tmp/list.txt
total=0
for c in "${clips[@]}"; do
  name=$(basename "${c%.*}")
  if [[ $name =~ ^[0-9]+[ab]$ ]]; then len=$SPLIT_LEN; else len=$SCENE_LEN; fi
  if ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$c" | grep -q .; then
    ain=(-ss "$CLIP_OFFSET" -i "$c"); amap="1:a:0"
  else
    ain=(-f lavfi -i anullsrc=r=48000:cl=stereo); amap="1:a"
  fi
  echo "• $name  ($len s)"
  ffmpeg -v error -y -ss "$CLIP_OFFSET" -i "$c" "${ain[@]}" -t "$len" \
    -filter_complex "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=24,format=yuv420p,tpad=stop_mode=clone:stop_duration=$len,trim=duration=$len,setpts=PTS-STARTPTS[v];[$amap]aresample=48000,aformat=channel_layouts=stereo,apad,atrim=duration=$len,asetpts=PTS-STARTPTS[a]" \
    -map "[v]" -map "[a]" -c:v libx264 -preset medium -crf 16 -c:a pcm_s16le "out/tmp/$name.mkv"
  echo "file '$name.mkv'" >> out/tmp/list.txt
  total=$(awk "BEGIN{print $total+$len}")
done
echo "Total length: ${total}s"

ffmpeg -v error -y -f concat -safe 0 -i out/tmp/list.txt -c copy out/tmp/joined.mkv

# Titles: TITLE1 for 2.5 s, then TITLE2 until just before the end, then a fade to black.
t1=$(awk "BEGIN{print $total-5.5}"); t2=$(awk "BEGIN{print $total-3}")
fo=$(awk "BEGIN{print $total-1}")
esc() { printf '%s' "$1" | sed "s/[\\:']/\\\\&/g"; }
fade() { echo "if(lt(t,$1),0,if(lt(t,$1+0.5),(t-$1)/0.5,if(lt(t,$2-0.5),1,if(lt(t,$2),($2-t)/0.5,0))))"; }
vf="[0:v]drawtext=fontfile='$FONT':text='$(esc "$TITLE1")':fontsize=92:fontcolor=white:shadowcolor=black@0.6:shadowx=4:shadowy=4:x=(w-tw)/2:y=h*0.42:alpha='$(fade "$t1" "$t2")',"
vf+="drawtext=fontfile='$FONT':text='$(esc "$TITLE2")':fontsize=100:fontcolor=0xFF5FC8:borderw=3:bordercolor=0x6A1B9A:shadowcolor=black@0.6:shadowx=4:shadowy=4:x=(w-tw)/2:y=h*0.42:alpha='$(fade "$t2" "$fo")',"
vf+="fade=t=out:st=$fo:d=1[v]"

inputs=(-i out/tmp/joined.mkv); mix="[0:a]volume=$CLIP_VOL[a0]"; labels="[a0]"; n=1
for kind in music vo; do
  found=(audio/$kind.mp3 audio/$kind.wav audio/$kind.m4a audio/$kind.aac)
  f=""; for g in "${found[@]}"; do [[ -f "$g" ]] && f=$g && break; done
  [[ -n "$f" ]] || continue
  vol=$MUSIC_VOL; [[ $kind == vo ]] && vol=$VO_VOL
  inputs+=(-i "$f"); mix+=";[$n:a]aresample=48000,volume=$vol,apad[a$n]"; labels+="[a$n]"; n=$((n+1))
  echo "+ $kind: $f"
done
mix+=";${labels}amix=inputs=$n:duration=first:normalize=0,afade=t=out:st=$(awk "BEGIN{print $total-2}"):d=2,loudnorm=I=-14:TP=-1.5:LRA=11[a]"

ffmpeg -v error -y "${inputs[@]}" -filter_complex "$vf;$mix" -map "[v]" -map "[a]" \
  -t "$total" -c:v libx264 -preset slow -crf 18 -profile:v high -pix_fmt yuv420p -r 24 \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart out/gta_farewell_reel.mp4
rm -rf out/tmp
echo "Done → $(pwd)/out/gta_farewell_reel.mp4"
