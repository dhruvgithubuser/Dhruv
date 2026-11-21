// Review helper: bundle once, render stills at the given seconds, tile them into a contact sheet.
//   node scripts/stills.mjs out.png 1,5,9.5 [cols]
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [out, list, cols = '5'] = process.argv.slice(2);
const times = list.split(',').map(Number);
const browserExecutable = process.env.REMOTION_BROWSER;
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const composition = await selectComposition({ serveUrl, id: 'NapoleonVox', browserExecutable });
const dir = fs.mkdtempSync(path.join(path.dirname(path.resolve(out)), 'st-'));
const files = [];
for (const t of times) {
  const f = path.join(dir, `${String(t).padStart(6, '0')}.jpeg`);
  await renderStill({ composition, serveUrl, output: f, frame: Math.round(t * 30), imageFormat: 'jpeg', jpegQuality: 85, browserExecutable, chromiumOptions: { gl: 'swiftshader' } });
  files.push(f);
}
const c = Number(cols), rows = Math.ceil(files.length / c);
const inputs = files.flatMap((f) => ['-i', f]);
const parts = files.map((_, i) => `[${i}]scale=640:360,drawtext=text='${times[i]}s':x=10:y=10:fontsize=28:fontcolor=yellow:box=1:boxcolor=black@0.6[s${i}]`);
const pad = rows * c - files.length;
const blanks = Array.from({ length: pad }, (_, i) => `color=black:s=640x360:d=1[b${i}]`);
const layout = Array.from({ length: rows * c }, (_, i) => `${(i % c) * 640}_${Math.floor(i / c) * 360}`).join('|');
const labels = [...files.map((_, i) => `[s${i}]`), ...Array.from({ length: pad }, (_, i) => `[b${i}]`)].join('');
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...inputs, '-filter_complex', [...parts, ...blanks, `${labels}xstack=inputs=${rows * c}:layout=${layout}`].join(';'), '-frames:v', '1', out]);
fs.rmSync(dir, { recursive: true });
console.log(`${files.length} stills -> ${out}`);
