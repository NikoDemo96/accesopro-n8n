#!/bin/sh
# Uso: prepare_audio.sh <video> <dir_salida> [segundos_por_trozo]
# Extrae audio mono ligero en trozos para la API de Whisper (límite 25 MB) e imprime un JSON con los trozos.
set -e
VIDEO="$1"
DIR="$2"
SEG="${3:-600}"
mkdir -p "$DIR"
if [ ! -s "$DIR/chunk_000.mp3" ]; then
  ffmpeg -hide_banner -v error -y -i "$VIDEO" -vn -ac 1 -ar 16000 -b:a 32k -f segment -segment_time "$SEG" -reset_timestamps 1 "$DIR/chunk_%03d.mp3"
fi
i=0
printf '['
for f in "$DIR"/chunk_*.mp3; do
  [ "$i" -gt 0 ] && printf ','
  printf '{"file":"%s","offset":%d}' "$f" $((i * SEG))
  i=$((i + 1))
done
printf ']'
