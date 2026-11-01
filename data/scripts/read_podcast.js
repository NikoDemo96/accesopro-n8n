#!/usr/bin/env node
// Uso: node read_podcast.js <carpeta_podcast> <tema_id>  (p. ej. T1_S01). Imprime el texto o nada si no existe.
const fs = require('fs');
const path = require('path');
const [dir, tema] = process.argv.slice(2);
const file = path.join(dir, `${tema}_podcast.json`);
if (!fs.existsSync(file)) process.exit(0);
const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
const p = raw.podcast || raw;
const lines = [];
if (p.titulo) lines.push(`Título: ${p.titulo}`);
for (const t of p.turnos || []) lines.push(`${t.hablante}: ${t.texto}`);
process.stdout.write(lines.join('\n'));
