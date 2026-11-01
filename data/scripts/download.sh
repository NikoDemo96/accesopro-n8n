#!/bin/sh
# Uso: download.sh <url> <destino.mp4>   (idempotente: no vuelve a descargar si ya existe)
set -e
URL="$1"
OUT="$2"
if [ -s "$OUT" ]; then echo "cached $OUT"; exit 0; fi
yt-dlp --js-runtimes node --no-playlist -f 'bv*[height<=1080][ext=mp4]+ba[ext=m4a]/b[height<=1080]' --merge-output-format mp4 -o "$OUT" "$URL" >&2
echo "downloaded $OUT"
