// Fast frame-exact renderer for long films: reads the canvas pixels directly (no page screenshots)
// and streams raw RGBA into ffmpeg in frame order. Same render contract as the motion-reel skill:
// window.seek(t) paints frame t.
//
//   node pompeii/tools/render_fast.mjs [--fps 30] [--workers 4] [--from 0] [--to <dur>] [--out out/pompeii/video_16x9.mp4]
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const ROOT = process.cwd(), FILM = 'pompeii';
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, FILM, 'film.json'), 'utf8'));
const FPS = Number(opt('fps', cfg.fps || 30)), WORKERS = Number(opt('workers', 4));
const FROM = Number(opt('from', 0)), TO = Number(opt('to', cfg.duration));
const OUT = opt('out', path.join('out', FILM, 'video_16x9.mp4'));
const W = 1920, H = 1080;
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.woff2': 'font/woff2', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.wav': 'audio/wav' };
const srv = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(new URL(q.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); });
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${srv.address().port}/${FILM}/index.html?render=1&blur=0&fps=${FPS}&format=16x9&w=${W}&h=${H}`;
const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text'] });
const pages = await Promise.all(Array.from({ length: WORKERS }, async () => {
  const pg = await browser.newPage({ viewport: { width: W, height: H } });
  pg.on('pageerror', (e) => console.error('[page]', e.message));
  await pg.goto(url); await pg.waitForFunction(() => window.filmReady === true, null, { timeout: 120000 });
  return pg;
}));

const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
  '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p',
  '-profile:v', 'high', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-movflags', '+faststart', OUT], { stdio: ['pipe', 'inherit', 'inherit'] });
const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg ' + c)))));

const f0 = Math.round(FROM * FPS), f1 = Math.round(TO * FPS), N = f1 - f0;
const grab = (pg, t) => pg.evaluate((t) => { window.seek(t); const c = document.getElementById('film'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let s = ''; const CH = 0x8000; for (let i = 0; i < d.length; i += CH) s += String.fromCharCode.apply(null, d.subarray(i, i + CH)); return btoa(s); }, t);
const ready = new Map(); let next = 0, written = 0, waiters = []; const LEAD = WORKERS * 4; const t0 = Date.now();
const wake = () => { const w = waiters; waiters = []; w.forEach((r) => r()); };
let chain = Promise.resolve();
const flush = async () => { while (ready.has(written)) { const b = ready.get(written); ready.delete(written); written++; if (!ff.stdin.write(b)) await new Promise((r) => ff.stdin.once('drain', r));
  if (written % 150 === 0) { const fps = written / ((Date.now() - t0) / 1000); process.stdout.write(`\r  ${written}/${N}  ${fps.toFixed(1)} fps  eta ${((N - written) / fps / 60).toFixed(1)} min   `); } } wake(); };
await Promise.all(pages.map(async (pg) => { while (next < N) { while (next - written > LEAD) await new Promise((r) => waiters.push(r)); const i = next++;
  ready.set(i, Buffer.from(await grab(pg, (f0 + i) / FPS), 'base64')); chain = chain.then(flush); } }));
await chain; ff.stdin.end(); await done;
console.log(`\n${N} frames -> ${OUT} in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
await browser.close(); srv.close();
