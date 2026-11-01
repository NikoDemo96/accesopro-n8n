FROM n8nio/n8n:latest

USER root

# FFmpeg y ffprobe estáticos (incluyen soporte de subtítulos)
COPY --from=mwader/static-ffmpeg:latest /ffmpeg /usr/local/bin/ffmpeg
COPY --from=mwader/static-ffmpeg:latest /ffprobe /usr/local/bin/ffprobe

# yt-dlp (versión para Alpine/musl)
ADD --chmod=755 https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_musllinux /usr/local/bin/yt-dlp

USER node