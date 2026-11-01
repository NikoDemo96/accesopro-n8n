#!/usr/bin/env node
// Monta vídeos 9:16 y 16:9 con subtítulos quemados + marca, y la miniatura. Sin dependencias.
// Uso: node render.js b64:<json en base64>   |   node render.js /ruta/job.json
// Job: { id, kind: 'tts'|'clip', formats: ['9x16','16x9'], title, kicker, audioPath?, sourceVideo?, start?, end?, words:[{w,s,e}] }
// words en segundos relativos al inicio de la pieza.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const arg = process.argv[2] || '';
const job = JSON.parse(arg.startsWith('b64:') ? Buffer.from(arg.slice(4), 'base64').toString('utf8') : fs.readFileSync(arg, 'utf8'));

const ROOT = '/data';
const BRAND = `${ROOT}/brand`;
const FONTS = `${BRAND}/fonts`;
const LOGO = `${BRAND}/logo.png`;
const NAVY = '0x111E32';
const GREEN = '0x59C267';
const GREEN_ASS = '&H67C259&';
const WHITE_ASS = '&HFFFFFF&';
const tmpDir = `${ROOT}/video/tmp`;
fs.mkdirSync(tmpDir, { recursive: true });
fs.mkdirSync(`${ROOT}/video`, { recursive: true });
fs.mkdirSync(`${ROOT}/thumbs`, { recursive: true });

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status !== 0) {
    throw new Error(`${cmd} falló (${r.status}): ${(r.stderr || '').split('\n').slice(-12).join('\n')}`);
  }
  return r.stdout;
}

function probeDuration(file) {
  return parseFloat(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).trim());
}

function assTime(t) {
  const cs = Math.max(0, Math.round(t * 100));
  const h = Math.floor(cs / 360000);
  const m = Math.floor((cs % 360000) / 6000);
  const s = Math.floor((cs % 6000) / 100);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs % 100).padStart(2, '0')}`;
}

const esc = (s) => String(s).replace(/[{}\\]/g, '');

function wrap(text, max) {
  const out = [];
  let line = '';
  for (const w of String(text).split(/\s+/)) {
    if ((line + ' ' + w).trim().length > max && line) {
      out.push(line);
      line = w;
    } else {
      line = (line + ' ' + w).trim();
    }
  }
  if (line) out.push(line);
  return out;
}

function chunkWords(words) {
  const chunks = [];
  let cur = [];
  let len = 0;
  for (const w of words) {
    cur.push(w);
    len += w.w.length + 1;
    if (cur.length >= 4 || len >= 24 || /[.!?¿:]$/.test(w.w)) {
      chunks.push(cur);
      cur = [];
      len = 0;
    }
  }
  if (cur.length) chunks.push(cur);
  return chunks;
}

function buildAss(fmt, duration) {
  const v = fmt === '9x16';
  const W = v ? 1080 : 1920;
  const H = v ? 1920 : 1080;
  const subSize = v ? 82 : 64;
  const subMargin = job.kind === 'clip' ? (v ? 330 : 60) : v ? 760 : 70;
  const lines = [
    '[Script Info]',
    'ScriptType: v4.00+',
    `PlayResX: ${W}`,
    `PlayResY: ${H}`,
    'WrapStyle: 2',
    '',
    '[V4+ Styles]',
    'Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding',
    `Style: Sub,Inter,${subSize},&HFFFFFF,&HFFFFFF,&H321E11,&H00000000,-1,0,0,0,100,100,0,0,1,${v ? 9 : 7},2,2,60,60,${subMargin},1`,
    `Style: Title,Inter Black,${v ? 84 : 54},&HFFFFFF,&HFFFFFF,&H321E11,&H00000000,0,0,0,0,100,100,0,0,1,0,0,8,70,70,${v ? 340 : 40},1`,
    `Style: Kicker,Inter,${v ? 40 : 32},${GREEN_ASS},${GREEN_ASS},&H321E11,&H00000000,-1,0,0,0,100,100,2,0,1,0,0,8,70,70,${v ? 270 : 30},1`,
    '',
    '[Events]',
    'Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text',
  ];
  if (job.kind === 'tts') {
    if (job.kicker) lines.push(`Dialogue: 0,${assTime(0)},${assTime(duration)},Kicker,,0,0,0,,${esc(job.kicker).toUpperCase()}`);
    if (job.title) lines.push(`Dialogue: 0,${assTime(0)},${assTime(duration)},Title,,0,0,0,,${wrap(esc(job.title), v ? 20 : 48).join('\\N')}`);
  }
  for (const chunk of chunkWords(job.words || [])) {
    chunk.forEach((w, i) => {
      const start = w.s;
      const end = i < chunk.length - 1 ? chunk[i + 1].s : Math.max(w.e, w.s + 0.2) + 0.12;
      const text = chunk
        .map((c, j) => (j === i ? `{\\c${GREEN_ASS}}${esc(c.w)}{\\c${WHITE_ASS}}` : esc(c.w)))
        .join(' ');
      lines.push(`Dialogue: 1,${assTime(start)},${assTime(Math.min(end, duration))},Sub,,0,0,0,,${text}`);
    });
  }
  const file = `${tmpDir}/${job.id}_${fmt}.ass`;
  fs.writeFileSync(file, lines.join('\n'), 'utf8');
  return file;
}

function renderOne(fmt) {
  const v = fmt === '9x16';
  const W = v ? 1080 : 1920;
  const H = v ? 1920 : 1080;
  const out = `${ROOT}/video/${job.id}_${fmt}.mp4`;
  let duration;
  const args = ['-hide_banner', '-v', 'error', '-y'];
  let filter;

  if (job.kind === 'tts') {
    duration = probeDuration(job.audioPath);
    const ass = buildAss(fmt, duration);
    args.push('-f', 'lavfi', '-i', `color=c=${NAVY}:s=${W}x${H}:r=25`, '-i', LOGO, '-i', job.audioPath);
    const logoW = v ? 760 : 520;
    const logoY = v ? 110 : 40;
    const waveH = v ? 380 : 260;
    filter =
      `[2:a]asplit[a1][a2];[a1]showwaves=s=${W}x${waveH}:mode=cline:colors=${GREEN}:rate=25,format=rgba[wave];` +
      `[1:v]scale=${logoW}:-1[logo];[0:v][logo]overlay=(W-w)/2:${logoY}[b1];` +
      `[b1][wave]overlay=0:H-h-${v ? 120 : 20}:format=auto[b2];[b2]ass=${ass}:fontsdir=${FONTS}[v]`;
    args.push('-filter_complex', filter, '-map', '[v]', '-map', '[a2]', '-t', String(duration + 0.3));
  } else {
    duration = job.end - job.start;
    const ass = buildAss(fmt, duration);
    args.push('-ss', String(job.start), '-t', String(duration), '-i', job.sourceVideo, '-i', LOGO);
    if (v) {
      filter =
        `[0:v]split[bg][fg];[bg]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},boxblur=40:6,eq=brightness=-0.25[b];` +
        `[fg]crop=${job.crop || '1440:1080:0:0'},scale=${W}:-2[f];[b][f]overlay=(W-w)/2:(H-h)/2-80[v1];` +
        `[1:v]scale=520:-1[logo];[v1][logo]overlay=(W-w)/2:90[v2];[v2]ass=${ass}:fontsdir=${FONTS}[v]`;
    } else {
      filter =
        `[0:v]scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=${NAVY}[b];` +
        `[1:v]scale=300:-1[logo];[b][logo]overlay=W-w-40:30[v2];[v2]ass=${ass}:fontsdir=${FONTS}[v]`;
    }
    args.push('-filter_complex', filter, '-map', '[v]', '-map', '0:a:0');
  }
  args.push('-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-r', '25', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', out);
  run('ffmpeg', args);
  return { format: fmt, path: out, duration: Math.round(duration * 10) / 10, sizeMB: Math.round((fs.statSync(out).size / 1048576) * 10) / 10 };
}

function renderThumb() {
  const out = `${ROOT}/thumbs/${job.id}.jpg`;
  const textFile = `${tmpDir}/${job.id}_thumb.txt`;
  const kickerFile = `${tmpDir}/${job.id}_kicker.txt`;
  fs.writeFileSync(textFile, wrap(job.thumbText || job.title, 20).slice(0, 4).join('\n'), 'utf8');
  fs.writeFileSync(kickerFile, String(job.kicker || 'AccesoPro').toUpperCase(), 'utf8');
  const fontBlack = `${FONTS}/Inter-Black.ttf`;
  const fontBold = `${FONTS}/Inter-Bold.ttf`;
  const filter =
    `[1:v]scale=420:-1[l];[0:v][l]overlay=60:50[b];` +
    `[b]drawbox=x=60:y=250:w=14:h=360:color=${GREEN}:t=fill,` +
    `drawtext=fontfile=${fontBold}:textfile=${kickerFile}:fontcolor=${GREEN}:fontsize=34:x=100:y=250,` +
    `drawtext=fontfile=${fontBlack}:textfile=${textFile}:fontcolor=white:fontsize=88:line_spacing=10:x=100:y=310`;
  run('ffmpeg', ['-hide_banner', '-v', 'error', '-y', '-f', 'lavfi', '-i', `color=c=${NAVY}:s=1280x720`, '-i', LOGO, '-filter_complex', filter, '-frames:v', '1', '-q:v', '3', out]);
  return out;
}

const result = { id: job.id, videos: [], thumb: null };
const MAX_SECONDS = 59.5;
if (job.kind === 'tts') {
  const original = probeDuration(job.audioPath);
  if (original > MAX_SECONDS) {
    const tempo = Math.min(1.25, original / 58.5);
    const fast = `${tmpDir}/${job.id}_fast.mp3`;
    run('ffmpeg', ['-hide_banner', '-v', 'error', '-y', '-i', job.audioPath, '-filter:a', `atempo=${tempo.toFixed(4)}`, '-c:a', 'libmp3lame', '-b:a', '128k', fast]);
    job.audioPath = fast;
    job.words = (job.words || []).map((w) => ({ w: w.w, s: w.s / tempo, e: w.e / tempo }));
    result.tempo = Math.round(tempo * 1000) / 1000;
    result.original_seconds = Math.round(original * 10) / 10;
  }
}
for (const fmt of job.formats || ['9x16', '16x9']) result.videos.push(renderOne(fmt));
result.thumb = renderThumb();
process.stdout.write(JSON.stringify(result));
