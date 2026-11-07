// paint.js: the hand-painted look. Everything here is built once in init() into offscreen canvases
// (seeded, so every render page builds identical art), then composited per frame.
import { rng, canvas, hex, css, mixc, mulc, fbm, vnoise, clamp, lerp } from './util.js';

export const ART = {};

// ---------------------------------------------------------------- textures
function grainTex(w, h, seed, amp) {
  const c = canvas(w, h), x = c.getContext('2d'), d = x.createImageData(w, h), r = rng(seed);
  for (let i = 0; i < w * h; i++) { const v = 128 + (r() - 0.5) * amp; d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = 255; }
  x.putImageData(d, 0, 0); return c;
}
function paperTex(w, h) {
  const c = canvas(w, h), x = c.getContext('2d'), r = rng(77);
  x.fillStyle = '#808080'; x.fillRect(0, 0, w, h);
  const d = x.getImageData(0, 0, w, h);
  for (let j = 0; j < h; j += 1) for (let i = 0; i < w; i += 1) {
    const n = fbm(i / 180, j / 180, 5, 4) * 26 + fbm(i / 9, j / 9, 9, 2) * 10;
    const k = (j * w + i) * 4; d.data[k] = d.data[k + 1] = d.data[k + 2] = 128 + n;
  }
  x.putImageData(d, 0, 0);
  // canvas-weave fibres + soft brush streaks
  x.globalAlpha = 0.05;
  for (let i = 0; i < 2600; i++) {
    x.strokeStyle = r() < 0.5 ? '#ffffff' : '#000000'; x.lineWidth = 0.6 + r() * 1.4;
    const px = r() * w, py = r() * h, a = (r() - 0.5) * 0.5 + (r() < 0.5 ? 0 : Math.PI / 2), l = 20 + r() * 90;
    x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
  }
  x.globalAlpha = 1; return c;
}

// A soft billowing puff, lit from the upper left. tone: base colour; shade: underside colour.
function puffTex(seed, tone, shade, size = 256) {
  const c = canvas(size, size), x = c.getContext('2d'), r = rng(seed), R = size / 2;
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * R * 0.42;
    const cx = R + Math.cos(a) * d, cy = R + Math.sin(a) * d * 0.85, rr = R * (0.22 + r() * 0.3);
    const lit = clamp(0.5 - (cy - R) / (R * 1.2) - (cx - R) / (R * 3));
    const col = mixc(shade, tone, lit);
    const g = x.createRadialGradient(cx - rr * 0.25, cy - rr * 0.3, rr * 0.1, cx, cy, rr);
    g.addColorStop(0, css(mixc(col, [255, 255, 255], 0.08), 0.9)); g.addColorStop(0.6, css(col, 0.7)); g.addColorStop(1, css(col, 0));
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, rr, 0, Math.PI * 2); x.fill();
  }
  return c;
}

// Vesuvius. kind: 'v79' (a single green cone, as the Bacchus fresco from the House of the Centenary
// suggests), 'modern' (Somma rim + Gran Cono). Drawn at w x h with base at the bottom edge.
export function mountainTex(kind, w = 2400, h = 900, seed = 11) {
  const c = canvas(w, h), x = c.getContext('2d'), r = rng(seed);
  const prof = (u) => { // u 0..1 across, returns height 0..1
    if (kind === 'modern') {
      const somma = 0.78 * Math.exp(-(((u - 0.36) / 0.2) ** 2)) + 0.18 * Math.exp(-(((u - 0.2) / 0.25) ** 2));
      const cono = 0.86 * Math.exp(-(((u - 0.6) / 0.12) ** 2) * 1.0);
      const base = 0.2 * Math.exp(-(((u - 0.5) / 0.38) ** 2));
      return Math.max(somma, cono, base) + 0.012 * vnoise(u * 40, 1, seed);
    }
    const cone = 1 - Math.abs(u - 0.5) / 0.34;
    const shoulder = 0.35 * Math.exp(-(((u - 0.5) / 0.42) ** 2));
    let v = Math.max(0, cone) ** 1.25 * 0.95 + shoulder * 0.6;
    if (Math.abs(u - 0.5) < 0.035) v = Math.min(v, 0.93 + 0.02 * vnoise(u * 90, 2, seed)); // a blunt summit
    return Math.min(1, v) + 0.01 * vnoise(u * 50, 3, seed);
  };
  const pts = []; for (let i = 0; i <= 240; i++) { const u = i / 240; pts.push([u * w, h - prof(u) * h * 0.95]); }
  const shape = () => { x.beginPath(); x.moveTo(0, h); pts.forEach(([px, py]) => x.lineTo(px, py)); x.lineTo(w, h); x.closePath(); };
  const green = kind === 'v79';
  const lit = hex(green ? '#8c8a5a' : '#8a7a68'), dark = hex(green ? '#3f4a3a' : '#4a4240');
  const g = x.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, css(mixc(lit, dark, 0.2))); g.addColorStop(0.45, css(lit)); g.addColorStop(0.55, css(mixc(lit, dark, 0.55))); g.addColorStop(1, css(dark));
  shape(); x.fillStyle = g; x.fill();
  x.save(); shape(); x.clip();
  // gullies running down from the summit
  const peakX = kind === 'modern' ? 0.6 * w : 0.5 * w;
  for (let i = 0; i < 520; i++) {
    const u = r(); const sx = u * w, top = h - prof(u) * h * 0.95;
    const len = (h - top) * (0.3 + r() * 0.9);
    const dir = (sx - peakX) / w;
    x.strokeStyle = css(r() < 0.5 ? mulc(dark, 0.8) : mixc(lit, [255, 240, 210], 0.25), 0.08 + r() * 0.14);
    x.lineWidth = 1 + r() * 4;
    x.beginPath(); x.moveTo(sx, top + 4);
    x.bezierCurveTo(sx + dir * len * 0.3, top + len * 0.3, sx + dir * len * 0.7 + (r() - 0.5) * 30, top + len * 0.7, sx + dir * len + (r() - 0.5) * 40, top + len);
    x.stroke();
  }
  // vegetation dabs and vineyard terraces on the lower slopes (AD 79), bare ash on top (modern)
  for (let i = 0; i < (green ? 2600 : 900); i++) {
    const px = r() * w, py = h * (0.35 + r() * 0.65);
    const surf = h - prof(px / w) * h * 0.95; if (py < surf + 10) continue;
    const low = (py - surf) / (h - surf + 1);
    const col = green ? mixc(hex('#55663f'), hex('#7c8450'), r()) : mixc(hex('#5f5a48'), hex('#776b55'), r());
    x.fillStyle = css(mulc(col, px < peakX ? 1.05 : 0.75), (green ? 0.25 : 0.15) * (0.5 + low));
    x.beginPath(); x.ellipse(px, py, 3 + r() * 9, 2 + r() * 4, 0, 0, Math.PI * 2); x.fill();
  }
  // haze toward the base
  const hz = x.createLinearGradient(0, h * 0.4, 0, h); hz.addColorStop(0, 'rgba(230,220,200,0)'); hz.addColorStop(1, 'rgba(230,220,200,0.35)');
  x.fillStyle = hz; x.fillRect(0, 0, w, h);
  x.restore();
  // the profile line, a painter's edge
  x.strokeStyle = 'rgba(40,35,30,0.25)'; x.lineWidth = 2; x.beginPath(); pts.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py))); x.stroke();
  c.peak = [peakX / w, 1 - prof(peakX / w) * 0.95];
  return c;
}

// Distant ridge band (Lattari mountains, Campi Flegrei hills): a soft silhouette strip.
function ridgeTex(seed, w, h, col, rough = 1) {
  const c = canvas(w, h), x = c.getContext('2d');
  x.beginPath(); x.moveTo(0, h);
  for (let i = 0; i <= 300; i++) { const u = i / 300; x.lineTo(u * w, h * (0.35 + 0.35 * fbm(u * 4 * rough, 0.3, seed, 4) + 0.12 * Math.sin(u * 7 + seed))); }
  x.lineTo(w, h); x.closePath();
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, col); g.addColorStop(0.7, col); g.addColorStop(1, 'rgba(200,190,170,0)');
  x.fillStyle = g; x.fill(); return c;
}

function cypressTex(seed) {
  const c = canvas(90, 420), x = c.getContext('2d'), r = rng(seed);
  for (let i = 0; i < 260; i++) {
    const t = r(), y = 400 - t * 390, half = 34 * Math.sin(Math.min(1, (1 - t) * 1.6) * Math.PI * 0.5) * (1 - t * 0.4) + 3;
    const px = 45 + (r() - 0.5) * 2 * half;
    x.fillStyle = css(mixc(hex('#1f2d1e'), hex('#4c5e35'), r() * (px < 45 ? 1 : 0.5)), 0.7);
    x.beginPath(); x.ellipse(px, y, 5 + r() * 7, 9 + r() * 10, (r() - 0.5) * 0.6, 0, Math.PI * 2); x.fill();
  }
  x.fillStyle = '#3a2a1e'; x.fillRect(42, 395, 6, 25); return c;
}
function pineTex(seed) { // umbrella pine (Pinus pinea): bare trunk, flat spreading crown
  const c = canvas(520, 460), x = c.getContext('2d'), r = rng(seed);
  x.strokeStyle = '#3b2c22'; x.lineCap = 'round';
  const br = (x0, y0, a, l, w, d) => {
    const x1 = x0 + Math.cos(a) * l, y1 = y0 + Math.sin(a) * l; x.lineWidth = w; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke();
    if (d > 0) { br(x1, y1, a - 0.45 - r() * 0.2, l * 0.62, w * 0.65, d - 1); br(x1, y1, a + 0.45 + r() * 0.2, l * 0.62, w * 0.65, d - 1); }
  };
  x.lineWidth = 20; x.beginPath(); x.moveTo(262, 460); x.quadraticCurveTo(250, 330, 268, 210); x.stroke();
  br(268, 210, -Math.PI / 2 - 0.5, 90, 13, 3); br(268, 210, -Math.PI / 2 + 0.55, 95, 13, 3);
  for (let i = 0; i < 900; i++) {
    const a = r() * Math.PI, rr = Math.sqrt(r());
    const px = 260 + Math.cos(a) * 250 * rr * (r() < 0.5 ? -1 : 1) * 0.98, py = 125 - Math.sin(a) * 85 * rr + r() * 40;
    const top = (140 - py) / 120;
    x.fillStyle = css(mixc(hex('#1d2a1c'), hex('#5b6c3c'), clamp(top * 0.9 + r() * 0.3)), 0.55);
    x.beginPath(); x.ellipse(px, py, 8 + r() * 14, 5 + r() * 7, (r() - 0.5) * 0.4, 0, Math.PI * 2); x.fill();
  }
  return c;
}
function roundTreeTex(seed, hue = '#4e5b37') {
  const c = canvas(240, 260), x = c.getContext('2d'), r = rng(seed);
  x.strokeStyle = '#3d3024'; x.lineWidth = 10; x.beginPath(); x.moveTo(120, 260); x.lineTo(118, 150); x.stroke();
  for (let i = 0; i < 420; i++) {
    const a = r() * Math.PI * 2, rr = Math.sqrt(r()) * 95, px = 120 + Math.cos(a) * rr, py = 110 + Math.sin(a) * rr * 0.8;
    x.fillStyle = css(mixc(mulc(hex(hue), 0.55), mixc(hex(hue), hex('#c9c08a'), 0.35), clamp(0.6 - (py - 110) / 140 - (px - 120) / 300 + (r() - 0.5) * 0.3)), 0.6);
    x.beginPath(); x.ellipse(px, py, 7 + r() * 11, 5 + r() * 8, r() * 3, 0, Math.PI * 2); x.fill();
  }
  return c;
}

function mottleTex(seed, size, scale, amp, base = 128) {
  const c = canvas(size, size), x = c.getContext('2d'), d = x.createImageData(size, size);
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    // tileable: sample noise on a torus
    const a = (i / size) * Math.PI * 2, b = (j / size) * Math.PI * 2, R = size / scale / 6.283;
    const n = fbm(Math.cos(a) * R + 50, Math.sin(a) * R + Math.cos(b) * R * 0.7, seed, 4) + 0.5 * fbm(Math.sin(b) * R * 3 + 9, Math.cos(a) * R * 3, seed + 5, 2);
    const v = base + n * amp, k = (j * size + i) * 4; d.data[k] = d.data[k + 1] = d.data[k + 2] = v; d.data[k + 3] = 255;
  }
  x.putImageData(d, 0, 0); return c;
}
// Fill the current path with a painterly texture anchored at (ox, oy) and scaled by k (follows the surface).
export function texFill(ctx, kind, ox, oy, k, alpha = 0.35, mode = 'overlay') {
  const pat = ART.pat[kind]; if (!pat) return;
  pat.setTransform(new DOMMatrix([k, 0, 0, k, ox, oy]));
  ctx.save(); ctx.globalCompositeOperation = mode; ctx.globalAlpha = alpha; ctx.fillStyle = pat; ctx.fill(); ctx.restore();
}
// Draw an image with a colour veil over its own pixels only (aerial perspective without boxes).
let _tc = null;
export function drawVeiled(ctx, img, x, y, w, h, rgb, a) {
  if (w < 1 || h < 1) return;
  const cw = Math.min(2048, Math.ceil(w)), ch = Math.ceil(h * cw / w);
  if (!_tc) _tc = canvas(2048, 1400);
  const t = _tc.getContext('2d'); t.clearRect(0, 0, cw, ch);
  t.globalCompositeOperation = 'source-over'; t.drawImage(img, 0, 0, cw, ch);
  t.globalCompositeOperation = 'source-atop'; t.fillStyle = css(rgb, a); t.fillRect(0, 0, cw, ch);
  t.globalCompositeOperation = 'source-over';
  ctx.drawImage(_tc, 0, 0, cw, ch, x, y, w, h);
}

export function buildArt() {
  if (ART.ready) return ART;
  ART.paper = paperTex(1920, 1080);
  ART.grain = [0, 1, 2, 3].map((i) => grainTex(960, 540, 100 + i, 60));
  const L = hex('#f2eee6'), M = hex('#b9b2a7'), D = hex('#5a544f'), K = hex('#2a2624'), B = hex('#6b5a4a');
  ART.puffLight = [0, 1, 2, 3].map((i) => puffTex(10 + i, L, M));
  ART.puffGrey = [0, 1, 2, 3].map((i) => puffTex(20 + i, M, D));
  ART.puffDark = [0, 1, 2, 3].map((i) => puffTex(30 + i, D, K));
  ART.puffBrown = [0, 1, 2, 3].map((i) => puffTex(40 + i, hex('#9a8670'), B));
  ART.puffGlow = [0, 1].map((i) => puffTex(50 + i, hex('#ffb066'), hex('#a8401c')));
  ART.v79 = mountainTex('v79');
  ART.modern = mountainTex('modern', 2400, 900, 12);
  ART.lattari = ridgeTex(4, 2600, 400, 'rgba(120,128,150,0.95)', 1.3);
  ART.hills = ridgeTex(9, 2600, 300, 'rgba(96,110,96,0.95)', 0.8);
  ART.cypress = [0, 1, 2].map((i) => cypressTex(60 + i));
  ART.pine = [0, 1].map((i) => pineTex(70 + i));
  ART.tree = [0, 1, 2].map((i) => roundTreeTex(80 + i, ['#4e5b37', '#5b6640', '#6b6d45'][i]));
  ART.texPlaster = mottleTex(3, 256, 70, 46);
  ART.texStone = mottleTex(8, 256, 18, 60);
  ART.texGround = mottleTex(12, 256, 40, 54);
  const pc = document.createElement('canvas').getContext('2d');
  ART.pat = { plaster: pc.createPattern(ART.texPlaster, 'repeat'), stone: pc.createPattern(ART.texStone, 'repeat'), ground: pc.createPattern(ART.texGround, 'repeat') };
  ART.ready = true;
  return ART;
}

// ---------------------------------------------------------------- per-frame helpers

// Sky: three-stop gradient + a band of painted cloud strokes (seeded, drifting with t).
export function paintSky(ctx, W, H, lk, horizon, t = 0, clouds = 1) {
  const g = ctx.createLinearGradient(0, 0, 0, horizon);
  g.addColorStop(0, css(lk.sky[0])); g.addColorStop(0.62, css(lk.sky[1])); g.addColorStop(1, css(lk.sky[2]));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, Math.max(horizon, 1) + 2);
  clouds *= clamp((lk.light - 0.55) * 2.5);
  if (clouds <= 0) return;
  const r = rng(5);
  for (let i = 0; i < 46; i++) {
    const y = horizon * (0.12 + r() * 0.75), len = 140 + r() * 420, x = ((r() * (W + len * 2) + t * (6 + r() * 6)) % (W + len * 2)) - len;
    const c = mixc(lk.sky[2], [255, 252, 245], 0.4 + r() * 0.3);
    ctx.fillStyle = css(c, (0.05 + r() * 0.12) * clouds);
    ctx.beginPath(); ctx.ellipse(x, y, len / 2, 6 + r() * 16, (r() - 0.5) * 0.04, 0, Math.PI * 2); ctx.fill();
  }
}

// Puff sprite: kind light|grey|dark|brown|glow; i picks a variant.
export function puff(ctx, kind, i, x, y, r, a = 1, rot = 0) {
  const arr = ART['puff' + kind[0].toUpperCase() + kind.slice(1)]; const img = arr[Math.abs(i | 0) % arr.length];
  if (a <= 0.002 || r < 0.5) return;
  ctx.globalAlpha = Math.min(1, a);
  if (rot) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.drawImage(img, -r, -r, r * 2, r * 2); ctx.restore(); }
  else ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = 1;
}

// Post: paper weave, animated grain, vignette. Runs after the frame is complete.
let _bloom = null;
export function finish(ctx, W, H, t, { grain = 0.07, paper = 0.16, vignette = 0.42, bloom = 0.22 } = {}) {
  ctx.save();
  if (bloom > 0) { // soft painterly bloom: a blurred copy screened back on
    if (!_bloom) _bloom = canvas(W / 4, H / 4);
    const b = _bloom.getContext('2d'); b.filter = 'blur(3px)'; b.drawImage(ctx.canvas, 0, 0, W / 4, H / 4); b.filter = 'none';
    ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = bloom * 1.6; ctx.drawImage(_bloom, 0, 0, W, H);
    ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = bloom * 0.45; ctx.drawImage(_bloom, 0, 0, W, H);
  }
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = paper; ctx.drawImage(ART.paper, 0, 0, W, H);
  const gi = Math.floor(t * 24) % 4, ox = (Math.floor(t * 24) * 37) % 200, oy = (Math.floor(t * 24) * 53) % 120;
  ctx.globalAlpha = grain; ctx.drawImage(ART.grain[gi], -ox, -oy, W + 400, H + 240);
  ctx.globalCompositeOperation = 'source-over';
  const v = ctx.createRadialGradient(W / 2, H * 0.52, H * 0.35, W / 2, H / 2, H * 1.05);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(12,8,5,${vignette})`);
  ctx.globalAlpha = 1; ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
