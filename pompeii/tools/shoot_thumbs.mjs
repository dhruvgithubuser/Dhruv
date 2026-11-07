// node pompeii/tools/shoot_thumbs.mjs -> pompeii/deliverables/thumbnails/thumb_{1,2,3}.png (1280x720) + _full (1920x1080)
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
const ROOT = path.resolve('pompeii');
const srv = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(new URL(q.url, 'http://x').pathname)); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': { '.js': 'text/javascript', '.html': 'text/html', '.woff2': 'font/woff2', '.json': 'application/json' }[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); });
await new Promise((r) => srv.listen(0, r));
const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } }); pg.on('pageerror', (e) => console.error(e.message));
const dir = path.join(ROOT, 'deliverables/thumbnails'); fs.mkdirSync(dir, { recursive: true });
for (const k of ['1', '2', '3']) { await pg.goto(`http://127.0.0.1:${srv.address().port}/thumbs.html?k=${k}`); await pg.waitForFunction(() => window.done);
  const full = path.join(dir, `thumb_${k}_full.png`); await pg.screenshot({ path: full });
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', full, '-vf', 'scale=1280:720:flags=lanczos', path.join(dir, `thumb_${k}.png`)]); fs.rmSync(full); console.log('thumb', k); }
await b.close(); srv.close();
