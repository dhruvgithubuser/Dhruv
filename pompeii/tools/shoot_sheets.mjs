// Render character reference sheets: node pompeii/tools/shoot_sheets.mjs -> pompeii/deliverables/characters/*.png
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.resolve('pompeii');
const srv = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(new URL(q.url, 'http://x').pathname));
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': { '.js': 'text/javascript', '.html': 'text/html', '.woff2': 'font/woff2', '.json': 'application/json' }[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); });
await new Promise((r) => srv.listen(0, r));
const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
pg.on('pageerror', (e) => console.error(e.message)); pg.on('console', (m) => m.type() === 'error' && console.error(m.text()));
fs.mkdirSync(path.join(ROOT, 'deliverables/characters'), { recursive: true });
for (const who of (process.argv[2] || 'marcus,livia,julia,gaius').split(',')) {
  await pg.goto(`http://127.0.0.1:${srv.address().port}/sheets.html?who=${who}`); await pg.waitForFunction(() => window.done);
  await pg.screenshot({ path: path.join(ROOT, `deliverables/characters/${who}_sheet.png`) }); console.log(who);
}
await b.close(); srv.close();
