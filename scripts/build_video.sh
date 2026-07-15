#!/usr/bin/env bash
# Genera el video lirico completo de "Lassie" a partir de:
#   assets/bg_base.png   (fondo generado por make_background.py)
#   output/lassie.ass    (subtitulos generados por build_ass.py)
#   assets/audio/LASSIE_MASTER.wav
set -euo pipefail
cd "$(dirname "$0")/.."

DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 assets/audio/LASSIE_MASTER.wav)
FPS=24
ZOOM_END=1.12
TOTAL_FRAMES=$(python3 -c "print(int(${DURATION}*${FPS}))")
ZOOM_STEP=$(python3 -c "print((${ZOOM_END}-1.0)/${TOTAL_FRAMES})")

ffmpeg -y -loop 1 -i assets/bg_base.png -i assets/audio/LASSIE_MASTER.wav \
  -vf "zoompan=z='min(zoom+${ZOOM_STEP},${ZOOM_END})':d=1:s=1080x1920:fps=${FPS}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',format=gray,scale=360:640,noise=alls=14:allf=t+u,scale=1080:1920:flags=lanczos,vignette=PI/4,subtitles=output/lassie.ass" \
  -map 0:v -map 1:a \
  -c:v libx264 -preset medium -crf 29 -pix_fmt yuv420p \
  -c:a aac -b:a 192k \
  -t "${DURATION}" \
  -movflags +faststart \
  output/lassie_lyric_video.mp4

echo "Listo: output/lassie_lyric_video.mp4"
