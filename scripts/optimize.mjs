import sharp from 'sharp';
import { readdirSync, writeFileSync } from 'node:fs';
import { parse } from 'node:path';
const out = {};
// the custard-apple painting is stored rotated 90 degrees in the PDF (it is placed upright on its page)
const ROT = { 'art-539': 270 };
const UP = { 'art-trinity': 3 };            // small source files: smooth upscale, no added detail
for (const f of readdirSync('raw')) {
  const { name } = parse(f);
  const max = name === 'hero-lab' ? 2400 : 2200;
  const info = await sharp(`raw/${f}`).rotate(ROT[name]).flatten({ background: '#ffffff' }).resize(UP[name] ? { width: Math.round((await sharp(`raw/${f}`).metadata()).width * UP[name]), kernel: 'lanczos3' } : { width: max, withoutEnlargement: true })
    .webp({ quality: 80, effort: 5 }).toFile(`public/img/${name}.webp`);
  out[name] = { w: info.width, h: info.height };
}
writeFileSync('src/manifest.json', JSON.stringify(out));
console.log(Object.keys(out).length, 'images');
