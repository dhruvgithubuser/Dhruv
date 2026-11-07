// The Return of Ram: a pure function of time. window.seek(t) paints frame t (lib/motion.js).
// Timing in beats (u) on the 72 bpm grid; docs/shotlist.md is the plan, timeline.json the shared clock
// (narration phrases + fireworks are read by both this file and audio/score.py).
// Plates are the user's own 15 reference images (assets/plates), split into depth layers for parallax.
import * as M from './lib/motion.js';

const { W, H, E, prog, lerp, clamp, bump, kf, springU, SPRING, font, layout, glyph, hash01, noise1, mulberry32, TAU } = M;

const DISPLAY = 'Display', UI = 'UI';
const GOLD = ['#fff6d8', '#f6cf7a', '#d39a35', '#ffe4a0'];
const C = { ink: '#07090f', gold: '#f2c46a', ember: '#ff9a3c', white: '#fff8ec' };

let TL = null, PLATES = null;
const LAYERS = {};                               // k -> {full, bg, fg}
let off = null, offc = null, small = null, smallc = null, sprite = {}, grainTiles = [];

// ------------------------------------------------------------------ hits (sfx.mjs voices them)
const HITS = [
  ...Array.from({ length: 13 }, (_, i) => [0.2 + i * 0.22, `count ${i + 2}`, 'tick', { gain: 0.5, pitch: 1200 + i * 60 }]),
  [3.1, '14 lands', 'thud', { gain: 0.6 }],
  [4, 'cut to exile', 'whoosh', { len: 0.9, from: 300, to: 1500, gain: 0.5 }],
  [10, 'title rises', 'swell', { len: 1.6, gain: 0.5 }],
  [15, 'into the clouds', 'whoosh', { len: 1.2, from: 200, to: 1800, gain: 0.5 }],
  [17.5, 'vimana tag', 'tick', { gain: 0.3 }],
  [20, 'Ram card', 'tick', { gain: 0.35 }],
  [23, 'flare wipe to Sita', 'whoosh', { len: 0.8, from: 2400, to: 700, gain: 0.4 }],
  [26, 'to the city', 'whoosh', { len: 0.9, from: 500, to: 2200, gain: 0.4 }],
  [38, 'match cut to diya', 'sub', { len: 0.8, gain: 0.4 }],
  [38.6, 'match flares', 'whoosh', { len: 0.35, from: 3000, to: 900, gain: 0.5 }],
  [40, 'wick catches', 'whoosh', { len: 0.6, from: 400, to: 1400, gain: 0.35 }],
  [42.2, 'KNOWLEDGE', 'thud', { gain: 0.3, pitch: 110, to: 70 }],
  [45.1, 'HOPE', 'thud', { gain: 0.3, pitch: 110, to: 70 }],
  [47.3, 'VICTORY', 'thud', { gain: 0.35, pitch: 110, to: 70 }],
  [48, 'push into the flame', 'riser', { len: 1.6, gain: 0.4 }],
  [51.5, 'name tags', 'tick', { gain: 0.3 }],
  [62, 'wave of lamps', 'swell', { len: 1.2, gain: 0.4 }],
  [70, 'river', 'whoosh', { len: 0.8, from: 600, to: 1600, gain: 0.3 }],
  [77, 'reunion dissolve', 'swell', { len: 1.4, gain: 0.3 }],
  [90, 'to Ram', 'whoosh', { len: 1.0, from: 300, to: 1100, gain: 0.3 }],
  [99.3, 'TRUTH', 'thud', { gain: 0.3, pitch: 110, to: 70 }],
  [100.3, 'COURAGE', 'thud', { gain: 0.3, pitch: 110, to: 70 }],
  [101.4, 'DHARMA', 'thud', { gain: 0.4, pitch: 100, to: 60 }],
  [104, 'to Hanuman', 'whoosh', { len: 1.0, from: 300, to: 1300, gain: 0.35 }],
  [109, 'light within', 'whoosh', { len: 0.8, from: 1500, to: 500, gain: 0.3 }],
  [120, 'aerial', 'whoosh', { len: 1.2, from: 200, to: 1600, gain: 0.4 }],
  [128, 'finale', 'swell', { len: 1.6, gain: 0.4 }],
  [132.6, 'shubh deepavali', 'bell', { pitch: 'D6', gain: 0.25 }],
  [137, 'Jai Shri Ram', 'impact', { gain: 0.35 }],
];

// ------------------------------------------------------------------ helpers
const logz = (a, b, p) => a * (b / a) ** p;                      // zoom in log space
function goldFill(ctx, y0, y1) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, GOLD[0]); g.addColorStop(0.35, GOLD[1]); g.addColorStop(0.75, GOLD[2]); g.addColorStop(1, GOLD[3]);
  return g;
}
function radial(ctx, x, y, r, stops) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  return g;
}
function makeSprite(r, stops) {
  const c = document.createElement('canvas'); c.width = c.height = r * 2;
  const x = c.getContext('2d'); x.fillStyle = radial(x, r, r, r, stops); x.fillRect(0, 0, r * 2, r * 2);
  return c;
}

// Camera on a plate: cx, cy = focal point (0..1 of the plate), z = zoom (1 = plate height fills frame).
function camXform(img, cx, cy, z) {
  const s = (H / img.height) * z;
  const dw = img.width * s, dh = img.height * s;
  let x = W / 2 - cx * dw, y = H / 2 - cy * dh;
  x = clamp(x, W - dw, 0); y = clamp(y, H - dh, 0);
  return { x, y, s, dw, dh };
}
function drawLayer(ctx, img, cx, cy, z, ox = 0, oy = 0) {
  const T = camXform(img, cx, cy, z);
  ctx.drawImage(img, T.x + ox, T.y + oy, T.dw, T.dh);
  return T;
}
// A plate with optional 2.5-D parallax: bg at the camera, fg (depth cut-out) pushed harder.
// par = 0..1 progress of the move; pz = fg extra zoom; px/py = fg extra drift in px.
function plate(ctx, k, cam, { pz = 0.04, px = 0, py = 0, between } = {}) {
  const L = LAYERS[k];
  if (!L) return null;
  const { cx, cy, z } = cam;
  if (L.fg && L.bg) {
    const T = drawLayer(ctx, L.bg, cx, cy, z);
    if (between) between(T);
    // the fg scales about the frame centre a little more than the bg: depth
    const zf = z * (1 + pz);
    const Tf = camXform(L.fg, cx, cy, zf);
    // keep the fg registered to the bg at the focal point, then add the drift
    const fx = T.x + cx * T.dw, fy = T.y + cy * T.dh;
    const gx = Tf.x + cx * Tf.dw, gy = Tf.y + cy * Tf.dh;
    ctx.drawImage(L.fg, Tf.x + (fx - gx) + px, Tf.y + (fy - gy) + py, Tf.dw, Tf.dh);
    return T;
  }
  const T = drawLayer(ctx, L.full, cx, cy, z);
  if (between) between(T);
  return T;
}
// Plate-space point -> screen, for a transform T
const P2S = (T, nx, ny) => [T.x + nx * T.dw, T.y + ny * T.dh];

// ------------------------------------------------------------------ grade
function grade(ctx, { cold = 0, warm = 0, dark = 0, lift = 0 }) {
  ctx.save();
  if (cold > 0) {
    ctx.globalCompositeOperation = 'color'; ctx.globalAlpha = 0.55 * cold; ctx.fillStyle = '#29466e'; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = cold; ctx.fillStyle = '#7d93b8'; ctx.fillRect(0, 0, W, H);
  }
  if (warm > 0) {
    ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = warm; ctx.fillStyle = '#ffae4a'; ctx.fillRect(0, 0, W, H);
  }
  if (dark > 0) { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = dark; ctx.fillStyle = '#04060c'; ctx.fillRect(0, 0, W, H); }
  if (lift > 0) { ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = lift; ctx.fillStyle = '#3a2410'; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
}

// ------------------------------------------------------------------ particles (all seeded, pure in u)
// Rising embers: each particle loops on its own period; position is a function of time only.
function embers(ctx, u, { n = 60, seed = 1, alpha = 1, rise = 1, size = 1, x0 = 0, x1 = 1, spark = sprite.ember } = {}) {
  const t = M.TS(u);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const h = (j) => hash01(i * 7 + j, seed);
    const sp = (70 + 140 * h(1)) * rise;                     // px/s
    const span = H + 300;
    const y = H + 150 - ((t * sp + h(2) * span) % span);
    const x = W * lerp(x0, x1, h(3)) + 40 * noise1(t * 0.4 + i, seed + 3) + 18 * Math.sin(t * (1 + h(4)) + i);
    const life = 1 - Math.abs((y / H) - 0.5) * 0.9;
    const fl = 0.55 + 0.45 * noise1(t * 6 + i * 3, seed + 7);
    const r = (6 + 12 * h(5)) * size;
    ctx.globalAlpha = clamp(alpha * life * fl, 0, 1);
    ctx.drawImage(spark, x - r, y - r, r * 2, r * 2);
  }
  ctx.restore();
}
// Falling petals / leaves: tumbling ellipses.
function petals(ctx, u, { n = 30, seed = 4, colors = ['#ff9f1c', '#ffbf3c', '#f2711c'], alpha = 1, size = 1, fall = 1 } = {}) {
  const t = M.TS(u);
  ctx.save();
  for (let i = 0; i < n; i++) {
    const h = (j) => hash01(i * 11 + j, seed);
    const sp = (90 + 120 * h(1)) * fall, span = H + 200;
    const y = -100 + ((t * sp + h(2) * span) % span);
    const x = W * h(3) + 70 * Math.sin(t * (0.6 + h(4)) + i) + 30 * t * (h(6) - 0.3);
    const rot = t * (1 + 2 * h(5)) + i, flip = Math.cos(t * (2 + 2 * h(7)) + i);
    const r = (10 + 12 * h(8)) * size;
    ctx.save(); ctx.translate(((x % W) + W) % W, y); ctx.rotate(rot); ctx.scale(1, Math.abs(flip) * 0.8 + 0.2);
    ctx.globalAlpha = alpha * (0.75 + 0.25 * h(9));
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.6, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
// Dust motes drifting in light.
function motes(ctx, u, { n = 50, seed = 9, alpha = 0.6, color = sprite.mote } = {}) {
  const t = M.TS(u);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const h = (j) => hash01(i * 5 + j, seed);
    const x = W * h(1) + 60 * noise1(t * 0.15 + i, seed), y = H * h(2) + 80 * noise1(t * 0.12 + i * 2, seed + 1) - t * 6;
    const r = 3 + 6 * h(3);
    ctx.globalAlpha = alpha * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * (1 + h(4)) + i)));
    ctx.drawImage(color, x - r, ((y % H) + H) % H - r, r * 2, r * 2);
  }
  ctx.restore();
}
// Volumetric light shafts from (sx, sy) towards angle a, spread s.
function shafts(ctx, u, sx, sy, a, { n = 6, spread = 0.5, len = 2400, alpha = 0.35, seed = 2, color = '255,210,140' } = {}) {
  const t = M.TS(u);
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < n; i++) {
    const h = (j) => hash01(i * 3 + j, seed);
    const ang = a + (h(1) - 0.5) * spread + 0.03 * Math.sin(t * 0.3 + i);
    const w = 0.02 + 0.05 * h(2);
    const g = ctx.createLinearGradient(sx, sy, sx + Math.cos(ang) * len, sy + Math.sin(ang) * len);
    const k = alpha * (0.5 + 0.5 * h(3)) * (0.75 + 0.25 * Math.sin(t * 0.7 + i * 2));
    g.addColorStop(0, `rgba(${color},${k})`); g.addColorStop(0.5, `rgba(${color},${k * 0.35})`); g.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(ang - w) * len, sy + Math.sin(ang - w) * len);
    ctx.lineTo(sx + Math.cos(ang + w) * len, sy + Math.sin(ang + w) * len);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
// Mist banks drifting across the frame.
function mist(ctx, u, { n = 8, seed = 5, alpha = 0.25, y0 = 0.3, y1 = 0.9, tint = sprite.mist, speed = 30 } = {}) {
  const t = M.TS(u);
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < n; i++) {
    const h = (j) => hash01(i * 13 + j, seed);
    const r = 380 + 420 * h(1);
    const span = W + 2 * r;
    const x = ((h(2) * span + t * speed * (0.5 + h(3))) % span) - r;
    const y = H * lerp(y0, y1, h(4));
    ctx.globalAlpha = alpha * (0.5 + 0.5 * h(5));
    ctx.drawImage(tint, x - r, y - r * 0.45, r * 2, r * 0.9);
  }
  ctx.restore();
}
// A procedural diya flame: teardrop body, hot core, halo. h = height in px.
function flame(ctx, x, y, h, u, { seed = 1, alpha = 1, halo = 1 } = {}) {
  const t = M.TS(u);
  const sway = noise1(t * 3.1, seed) * 0.12 * h + noise1(t * 9, seed + 4) * 0.04 * h;
  const hh = h * (1 + 0.1 * noise1(t * 7, seed + 2));
  const w = h * 0.36;
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = 'lighter';
  if (halo > 0) {
    ctx.globalAlpha = alpha * halo * (0.85 + 0.15 * noise1(t * 11, seed + 6));
    ctx.fillStyle = radial(ctx, x, y - h * 0.4, h * 3.2, [[0, 'rgba(255,190,90,0.55)'], [0.25, 'rgba(255,140,40,0.22)'], [1, 'rgba(255,100,20,0)']]);
    ctx.fillRect(x - h * 3.4, y - h * 3.8, h * 6.8, h * 6.8);
  }
  const body = (sc, cols) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x - w * sc, y - hh * 0.1 * sc, x - w * 0.7 * sc + sway * 0.4, y - hh * 0.6 * sc, x + sway, y - hh * sc);
    ctx.bezierCurveTo(x + w * 0.7 * sc + sway * 0.4, y - hh * 0.6 * sc, x + w * sc, y - hh * 0.1 * sc, x, y);
    const g = ctx.createLinearGradient(x, y, x, y - hh * sc);
    cols.forEach(([o, c]) => g.addColorStop(o, c));
    ctx.fillStyle = g; ctx.fill();
  };
  ctx.globalAlpha = alpha;
  body(1, [[0, 'rgba(90,120,255,0.55)'], [0.12, 'rgba(255,200,90,0.95)'], [0.55, 'rgba(255,150,40,0.85)'], [1, 'rgba(255,90,20,0)']]);
  body(0.62, [[0, 'rgba(255,255,240,0.9)'], [0.5, 'rgba(255,240,180,0.9)'], [1, 'rgba(255,200,100,0)']]);
  ctx.restore();
}
// Fireworks: a shell launched from below, bursting at beat b. Analytic ballistics with drag + gravity.
function firework(ctx, u, [b, nx, ny, hue, size], seed) {
  const t = (u - b) * M.GRID.period;                   // seconds since burst
  const launch = 0.7;
  if (t < -launch || t > 3.2) return;
  const X = nx * W, Y = ny * H + 120;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  if (t < 0) {                                           // rising streak
    const p = 1 + t / launch, yy = lerp(H * 0.95, Y, E.outQuad(p));
    const g = ctx.createLinearGradient(X, yy, X, yy + 160);
    g.addColorStop(0, 'rgba(255,230,170,0.9)'); g.addColorStop(1, 'rgba(255,160,60,0)');
    ctx.strokeStyle = g; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(X, yy); ctx.lineTo(X + 4 * Math.sin(p * 9), yy + 160); ctx.stroke();
    ctx.restore(); return;
  }
  const N = Math.round(70 * size), k = 1.6, g = 140;
  const fade = clamp(1 - t / 3.0) ** 1.4;
  // flash at the core
  if (t < 0.35) {
    ctx.globalAlpha = (1 - t / 0.35) * 0.8;
    ctx.fillStyle = radial(ctx, X, Y, 260 * size, [[0, `hsla(${hue},100%,85%,0.9)`], [1, `hsla(${hue},100%,60%,0)`]]);
    ctx.fillRect(X - 300 * size, Y - 300 * size, 600 * size, 600 * size);
  }
  for (let i = 0; i < N; i++) {
    const a = (i / N) * TAU + hash01(i, seed) * 0.2;
    const v = (380 + 120 * hash01(i + 99, seed)) * size;
    const pos = (tt) => {
      const d = (1 - Math.exp(-k * tt)) / k;
      return [X + Math.cos(a) * v * d, Y + Math.sin(a) * v * d + 0.5 * g * tt * tt];
    };
    const tw = t > 1.2 ? (0.5 + 0.5 * Math.sin(t * 40 + i * 7)) : 1;
    for (let s = 0; s < 4; s++) {
      const tt = Math.max(0, t - s * 0.06);
      const [px, py] = pos(tt);
      ctx.globalAlpha = fade * tw * (1 - s * 0.24);
      const r = (s === 0 ? 7 : 5) * size;
      ctx.drawImage(i % 3 === 0 ? sprite.sparkW : sprite.spark[hue < 30 ? 0 : hue < 45 ? 1 : 2], px - r, py - r, r * 2, r * 2);
    }
  }
  ctx.restore();
}
function fireworksIn(ctx, u, b0, b1, yShift = 0) {
  TL.fireworks.forEach((f, i) => {
    if (f[0] - 1 < b1 && f[0] + 4 > b0 && f[0] >= b0 - 0.5) firework(ctx, u, [f[0], f[1], f[2] + yShift, f[3], f[4]], i + 1);
  });
}

// ------------------------------------------------------------------ motion type
// Words that land: per-glyph spring from scale 1.6 + tracking closing, gold, with a sweeping sheen.
function landWord(ctx, word, cx, base, size, u, u0, { weight = 800, track = 0.12, family = DISPLAY, out = null } = {}) {
  const f = font(size, weight, family);
  const L = layout(ctx, word, f, track * size);
  const k = springU(u, u0, SPRING.gentle);
  if (k <= 0.001) return;
  const o = out ? 1 - E.inCubic(prog(u, out, out + 0.6)) : 1;
  if (o <= 0) return;
  const x0 = cx - L.width / 2;
  ctx.save();
  ctx.globalAlpha = 0.55 * clamp(k) * o;
  ctx.fillStyle = radial(ctx, cx, base - size * 0.35, L.width * 0.75, [[0, 'rgba(8,4,0,0.85)'], [1, 'rgba(8,4,0,0)']]);
  ctx.save(); ctx.translate(cx, base - size * 0.35); ctx.scale(1, 0.45); ctx.translate(-cx, -(base - size * 0.35));
  ctx.fillRect(cx - L.width, base - size * 0.35 - L.width, L.width * 2, L.width * 2); ctx.restore();
  ctx.shadowColor = 'rgba(0,0,0,0.65)'; ctx.shadowBlur = size * 0.35;
  L.glyphs.forEach((g, j) => {
    const kj = springU(u, u0 + j * 0.04, SPRING.gentle);
    if (kj <= 0) return;
    const spread = (1 - kj) * (g.cx - L.width / 2) * 0.35;
    const sc = lerp(1.5, 1, kj);
    ctx.globalAlpha = clamp(kj * 1.4) * o;
    glyph(ctx, g.ch, x0 + g.cx + spread, base, f, goldFill(ctx, -size * 0.75, 0), sc, sc);
  });
  ctx.restore();
  // sheen: a bright band crossing the word once
  const sp = prog(u, u0 + 0.3, u0 + 1.6);
  if (sp > 0 && sp < 1) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.55 * Math.sin(sp * Math.PI) * o;
    ctx.beginPath(); ctx.rect(x0 + (sp * 1.4 - 0.2) * L.width - size * 0.3, base - size, size * 0.6, size * 1.3); ctx.clip();
    L.glyphs.forEach((g) => glyph(ctx, g.ch, x0 + g.cx, base, f, '#fff6e0'));
    ctx.restore();
  }
}
// Name card: Devanagari name (Tiro) + tracked Latin (Cinzel), revealed by a moving clip with a gold rule.
function nameCard(ctx, u, u0, u1, deva, latin, x, y, { size = 120, align = 'center' } = {}) {
  const pin = E.outCubic(prog(u, u0, u0 + 1.2));
  const pout = E.inCubic(prog(u, u1 - 0.6, u1));
  if (pin <= 0 || pout >= 1) return;
  const fD = font(size, 400, UI), fL = font(size * 0.3, 600, DISPLAY);
  ctx.save();
  ctx.font = fD; const wD = ctx.measureText(deva).width;
  ctx.font = fL; ctx.letterSpacing = `${size * 0.12}px`; const wL = ctx.measureText(latin).width; ctx.letterSpacing = '0px';
  const wMax = Math.max(wD, wL) + 40;
  const left = align === 'center' ? x - wMax / 2 : x;
  ctx.globalAlpha = (1 - pout) * pin;
  ctx.fillStyle = radial(ctx, x, y - size * 0.1, wMax * 0.9, [[0, 'rgba(0,0,0,0.5)'], [1, 'rgba(0,0,0,0)']]);
  ctx.fillRect(x - wMax, y - size * 1.6, wMax * 2, size * 3);
  ctx.globalAlpha = 1 - pout;
  ctx.beginPath(); ctx.rect(left - 20, y - size * 1.3, (wMax + 40) * pin, size * 2.2); ctx.clip();
  ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 24;
  ctx.textAlign = align === 'center' ? 'center' : 'left';
  ctx.font = fD; ctx.fillStyle = goldFill(ctx, y - size, y); ctx.fillText(deva, x, y);
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(242,196,106,0.9)';
  const rw = wMax * 0.7 * pin;
  ctx.fillRect((align === 'center' ? x - rw / 2 : x), y + size * 0.28, rw, 2);
  ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 16;
  ctx.font = fL; ctx.letterSpacing = `${size * 0.12}px`; ctx.fillStyle = C.white;
  ctx.fillText(latin, x + (align === 'center' ? size * 0.06 : 0), y + size * 0.72);
  ctx.letterSpacing = '0px';
  ctx.restore();
  // the glint riding the reveal edge
  if (pin < 1) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.9 * (1 - pin);
    ctx.drawImage(sprite.glint, left - 20 + (wMax + 40) * pin - 120, y - 120, 240, 240); ctx.restore();
  }
}
// A label with a leader line pointing at a figure in the plate.
function tag(ctx, u, u0, u1, text, px, py, lx, ly) {
  const p = E.outCubic(prog(u, u0, u0 + 0.8)), q = 1 - E.inCubic(prog(u, u1 - 0.5, u1));
  if (p <= 0 || q <= 0) return;
  ctx.save(); ctx.globalAlpha = q;
  ctx.strokeStyle = 'rgba(242,196,106,0.9)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(lerp(px, lx, p), lerp(py, ly, p)); ctx.stroke();
  ctx.fillStyle = C.gold; ctx.beginPath(); ctx.arc(px, py, 6, 0, TAU); ctx.fill();
  ctx.font = font(42, 600, DISPLAY); ctx.letterSpacing = '6px';
  const tw = ctx.measureText(text).width;
  const tx = clamp(lx - tw / 2, 80, W - 160 - tw);
  ctx.textAlign = 'left'; ctx.fillStyle = C.white;
  ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 12;
  ctx.globalAlpha = q * clamp((p - 0.6) / 0.4);
  ctx.fillText(text, tx, ly + (ly > py ? 44 : -16));
  ctx.letterSpacing = '0px';
  ctx.restore();
}

// ------------------------------------------------------------------ shots
// Each shot: [id, b0, draw(ctx, u, l)] where l = u - b0. Transitions are drawn by drawAt().
const S = {};
const FL = { x: 0.462, y: 0.405, mx: 0.437, my: 0.352 };   // diya wick + match head on plate 08

S.hook14 = (ctx, u, l) => {
  const p = prog(u, 0, 10);
  plate(ctx, '14', { cx: 0.27, cy: 0.42, z: logz(1.32, 1.18, E.inOutSine(p)) });
  grade(ctx, { cold: 1, dark: 0.35 });
  mist(ctx, u, { alpha: 0.35, y0: 0.45, y1: 0.95, seed: 3 });
  // "14": digits roll from 01 to 14
  const n = Math.min(14, 1 + Math.floor(E.outCubic(prog(u, 0, 3.05)) * 13 + 1e-6));
  const out = E.inBack(prog(u, 3.6, 4.0), 1.2);
  const size = 520, base = 1010 - out * 900;
  ctx.save(); ctx.globalAlpha = 1 - out;
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 60;
  const s = String(n);
  const f = font(size, 800, DISPLAY);
  const L = layout(ctx, s, f, -0.02 * size);
  const land = springU(u, 3.05, SPRING.bouncy);
  const sc = 1 + 0.06 * (1 - land) * (u > 3.05 ? 1 : 0);
  L.glyphs.forEach((g, j) => glyph(ctx, g.ch, W / 2 - L.width / 2 + g.cx, base, f, goldFill(ctx, -size * 0.72, 0), sc, sc));
  ctx.restore();
  landWord(ctx, 'YEARS', W / 2, base + 140, 92, u, 0.9, { weight: 600, track: 0.45, out: 3.6 });
  landWord(ctx, 'OF EXILE', W / 2, base + 250, 54, u, 1.8, { weight: 600, track: 0.5, out: 3.6 });
};
S.exile = (ctx, u, l) => {
  const p = prog(u, 4, 10);
  plate(ctx, '03', { cx: 0.5, cy: 0.42, z: logz(1.02, 1.12, p) }, {
    pz: 0.05 * p, py: -10 * p,
    between: () => shafts(ctx, u, W * 1.05, -100, 2.1, { alpha: 0.28, n: 5, seed: 4 }),
  });
  grade(ctx, { warm: 0.3, dark: 0.12 });
  petals(ctx, u, { n: 16, seed: 21, colors: ['#8a5a2b', '#a87132', '#6b4a24'], size: 0.9, alpha: 0.85, fall: 0.6 });
  motes(ctx, u, { n: 40, alpha: 0.5 });
};
S.title = (ctx, u, l) => {
  const p = prog(u, 10, 15.5);
  plate(ctx, '14', { cx: 0.3, cy: 0.45, z: logz(1.08, 1.0, E.outCubic(p)) });
  grade(ctx, { cold: 0.85, dark: 0.45 });
  mist(ctx, u, { alpha: 0.45, y0: 0.35, y1: 1.0, seed: 8, speed: 45 });
  const y = 820;
  const fade = 1 - E.inCubic(prog(u, 14.5, 15.2));
  ctx.save(); ctx.globalAlpha = fade;
  // "THE RETURN" / "OF RAM": glyphs rise out of the mist
  [['THE RETURN', 104, y, 10.3], ['OF RAM', 178, y + 190, 10.9]].forEach(([w, size, base, u0]) => {
    const f = font(size, 800, DISPLAY), L = layout(ctx, w, f, 0.08 * size);
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 40;
    L.glyphs.forEach((g, j) => {
      const k = springU(u, u0 + j * 0.06, SPRING.gentle);
      if (k <= 0) return;
      ctx.globalAlpha = fade * clamp(k * 1.3);
      glyph(ctx, g.ch, W / 2 - L.width / 2 + g.cx, base + (1 - k) * 90, f, goldFill(ctx, -size * 0.75, 0));
    });
    ctx.restore();
  });
  const rp = E.outCubic(prog(u, 11.6, 12.8));
  ctx.fillStyle = 'rgba(242,196,106,0.85)'; ctx.fillRect(W / 2 - 260 * rp, y + 260, 520 * rp, 2);
  ctx.globalAlpha = fade * E.outCubic(prog(u, 12.1, 13.1));
  ctx.font = `italic ${font(46, 400, UI)}`; ctx.textAlign = 'center'; ctx.fillStyle = C.white;
  ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 20;
  ctx.fillText('When Ayodhya became a city of light', W / 2, y + 340);
  ctx.restore();
  embers(ctx, u, { n: 24, seed: 3, alpha: 0.6, size: 0.7 });
};
S.vimana = (ctx, u, l) => {
  const p = prog(u, 15, 20);
  plate(ctx, '05', { cx: lerp(0.40, 0.22, E.inOutSine(p)), cy: 0.42, z: 1.04 }, { pz: 0.02, px: lerp(60, -40, p), py: -12 * Math.sin(p * Math.PI) });
  grade(ctx, { warm: 0.25 });
  mist(ctx, u, { alpha: 0.4, y0: 0.05, y1: 0.45, seed: 11, speed: 120, tint: sprite.cloud });
  embers(ctx, u, { n: 50, seed: 6, alpha: 0.8, size: 0.8, rise: 0.7 });
  nameCard(ctx, u, 16.2, 19.6, 'पुष्पक विमान', 'PUSHPAK VIMANA', W / 2, 1090, { size: 104 });
};
S.ramlak = (ctx, u, l) => {
  const p = prog(u, 20, 23.5);
  plate(ctx, '01', { cx: 0.52, cy: lerp(0.5, 0.36, E.inOutSine(p)), z: logz(1.05, 1.18, p) }, {
    pz: 0.03 * p,
    between: (T) => { const [x, y] = P2S(T, 0.53, 0.22); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = radial(ctx, x, y, 700, [[0, 'rgba(255,190,110,0.28)'], [1, 'rgba(255,150,60,0)']]); ctx.fillRect(0, 0, W, H); ctx.restore(); },
  });
  grade(ctx, { warm: 0.3 });
  embers(ctx, u, { n: 36, seed: 12, alpha: 0.7, size: 0.8 });
  nameCard(ctx, u, 20.3, 23.3, 'श्री राम', 'SHRI RAM', W / 2, 1090, { size: 130 });
};
S.sita = (ctx, u, l) => {
  const p = prog(u, 23, 26.5);
  plate(ctx, '02', { cx: 0.63, cy: 0.42, z: logz(1.0, 1.1, p) }, {
    pz: 0.04 * p,
    between: () => shafts(ctx, u, W * 0.0, H * 0.02, 0.9, { alpha: 0.32, n: 6, seed: 7 }),
  });
  grade(ctx, { warm: 0.2 });
  motes(ctx, u, { n: 46, alpha: 0.6, seed: 14 });
  nameCard(ctx, u, 23.6, 26.2, 'सीता', 'SITA', W / 2, 1090, { size: 140 });
};
S.rangoli = (ctx, u, l) => {
  const cam = kf(u, [[26, [0.22, 0.52, 1.0]], [32.5, [0.5, 0.55, 1.03]], [38, [0.5, 0.86, 1.55]]], E.inOutSine);
  plate(ctx, '07', { cx: cam[0], cy: cam[1], z: cam[2] });
  grade(ctx, { warm: 0.25, lift: 0.04 });
  petals(ctx, u, { n: 34, seed: 5, size: 1.1 });
  embers(ctx, u, { n: 30, seed: 15, alpha: 0.5, size: 0.6, rise: 0.5 });
};
S.flame = (ctx, u, l) => {
  const push = E.inCubic(prog(u, 47.6, 50));
  const z = logz(1.04, 1.14, prog(u, 38, 47.6)) * logz(1, 5.5, push);
  const cx = lerp(0.47, FL.x, push), cy = lerp(0.42, FL.y - 0.05, push);
  const T = plate(ctx, '08', { cx, cy, z }, { pz: 0.04 * prog(u, 38, 48) });
  grade(ctx, { dark: 0.1 * (1 - push) });
  // the match head flares, then the wick catches
  const [mx, my] = P2S(T, FL.mx, FL.my), [wx, wy] = P2S(T, FL.x, FL.y);
  const sc = T.s / (H / 2000);
  const mflare = bump(u, 38.9, 0.9) + 0.35 * prog(u, 38.6, 39.2) * (1 - prog(u, 40.5, 41.5));
  if (mflare > 0) flame(ctx, mx, my + 8 * sc, 110 * sc * clamp(mflare), u, { seed: 3, alpha: clamp(mflare), halo: 0.7 });
  const ign = E.outCubic(prog(u, 39.9, 41.0));
  if (ign > 0) flame(ctx, wx, wy, 210 * sc * ign, u, { seed: 5, alpha: ign, halo: 1.0 });
  embers(ctx, u, { n: 26, seed: 18, alpha: 0.55 * ign, size: 0.7, x0: 0.25, x1: 0.75, rise: 0.6 });
  landWord(ctx, 'KNOWLEDGE', W / 2, 540, 100, u, 42.2, { out: 47.6 });
  landWord(ctx, 'HOPE', W / 2, 720, 100, u, 45.1, { out: 47.6 });
  landWord(ctx, 'VICTORY', W / 2, 900, 100, u, 47.3, { out: 48.6 });
  // the glow swallows the frame: gold, not white
  if (push > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = E.inQuad(push);
    ctx.fillStyle = radial(ctx, wx, wy - 100 * sc, W * 1.4, [[0, 'rgba(255,214,140,1)'], [0.5, 'rgba(255,170,70,0.9)'], [1, 'rgba(160,80,20,0.6)']]);
    ctx.fillRect(0, 0, W, H); ctx.restore();
  }
};
S.arrive = (ctx, u, l) => {
  const p = prog(u, 50, 62);
  plate(ctx, '12', { cx: 0.5, cy: 0.5, z: logz(1.5, 1.02, E.outCubic(prog(u, 50, 58))) }, { pz: 0.05 * p, py: 14 * p });
  grade(ctx, { warm: 0.15 });
  fireworksIn(ctx, u, 50, 62, -0.02);
  petals(ctx, u, { n: 20, seed: 31, size: 0.8, alpha: 0.9 });
  embers(ctx, u, { n: 40, seed: 19, alpha: 0.6, size: 0.7 });
  // name tags with leader lines (plate 12 figures: Lakshman 0.453, Ram 0.5, Sita 0.546, at y~0.5)
  const T = camXform(LAYERS['12'].full, 0.5, 0.5, logz(1.5, 1.02, E.outCubic(prog(u, 50, 58))));
  const at = (nx, ny) => P2S(T, nx, ny);
  const [lx, ly] = at(0.452, 0.47), [rx, ry] = at(0.5, 0.43), [sx, sy] = at(0.548, 0.5);
  tag(ctx, u, 52.5, 57, 'LAKSHMAN', lx, ly, 260, ly + 260);
  tag(ctx, u, 52.0, 57, 'SHRI RAM', rx, ry, W / 2 + 40, ry - 330);
  tag(ctx, u, 53.0, 57, 'SITA', sx, sy, W - 230, sy + 200);
};
S.wave = (ctx, u, l) => {
  const p = prog(u, 62, 70);
  const cam = { cx: 0.64, cy: 0.5, z: logz(1.0, 1.08, p) };
  // dark city first
  plate(ctx, '10', cam);
  grade(ctx, { cold: 0.9, dark: 0.55 });
  // the lit city spreads in a wave from the lowest step (a lamp is lit, its neighbour catches)
  const wv = E.inOutSine(prog(u, 62.6, 67.5));
  if (wv > 0) {
    offc.save(); offc.globalCompositeOperation = 'source-over'; offc.clearRect(0, 0, W, H);
    plate(offc, '10', cam);
    grade(offc, { warm: 0.2 });
    const ox = W * 1.9, oy = H * 1.45, R = 900 + wv * 3900;
    offc.globalCompositeOperation = 'destination-in';
    offc.fillStyle = radial(offc, ox, oy, Math.max(1, R), [[0, 'rgba(0,0,0,1)'], [0.7, 'rgba(0,0,0,1)'], [1, 'rgba(0,0,0,0)']]);
    offc.fillRect(0, 0, W, H);
    offc.restore();
    ctx.drawImage(off, 0, 0);
    // a gold front riding the wave
    if (wv < 1) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = radial(ctx, ox, oy, Math.max(1, R), [[0, 'rgba(0,0,0,0)'], [0.72, 'rgba(0,0,0,0)'], [0.86, 'rgba(255,170,60,0.4)'], [1, 'rgba(255,140,40,0)']]);
      ctx.fillRect(0, 0, W, H); ctx.restore();
    }
  }
  embers(ctx, u, { n: 60, seed: 22, alpha: 0.75 * wv, size: 0.8 });
  fireworksIn(ctx, u, 62, 70);
};
S.ghat = (ctx, u, l) => {
  const p = prog(u, 70, 74);
  plate(ctx, '06', { cx: 0.62, cy: 0.5, z: logz(1.0, 1.06, p) });
  grade(ctx, { warm: 0.15 });
  embers(ctx, u, { n: 40, seed: 25, alpha: 0.6, size: 0.7 });
};
S.crowd = (ctx, u, l) => {
  const p = prog(u, 73.5, 77.5);
  plate(ctx, '05', { cx: 0.86, cy: 0.62, z: logz(1.06, 1.14, p) }, { pz: 0.04 * p, px: -20 * p });
  grade(ctx, { warm: 0.15 });
  embers(ctx, u, { n: 40, seed: 26, alpha: 0.7, size: 0.8 });
};
S.reunion = (ctx, u, l) => {
  const p = prog(u, 77, 90.5);
  const rc = kf(u, [[77, [0.5, 0.5, 1.0]], [83.5, [0.55, 0.36, 1.12]], [90.5, [0.6, 0.3, 1.22]]], E.inOutSine);
  plate(ctx, '11', { cx: rc[0], cy: rc[1], z: rc[2] }, {
    pz: 0.04 * p,
    between: () => shafts(ctx, u, W * 0.5, -200, 1.6, { alpha: 0.22, n: 7, seed: 9 }),
  });
  grade(ctx, { warm: 0.25 });
  // drifting light leaks
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  const lx = W * (0.8 + 0.25 * Math.sin(M.TS(u) * 0.15)), ly = H * 0.15;
  ctx.fillStyle = radial(ctx, lx, ly, 900, [[0, 'rgba(255,170,80,0.35)'], [1, 'rgba(255,120,40,0)']]); ctx.fillRect(0, 0, W, H);
  ctx.restore();
  motes(ctx, u, { n: 50, alpha: 0.55, seed: 33 });
  nameCard(ctx, u, 78.6, 83.4, 'भरत', 'BHARAT', W / 2, 1090, { size: 130 });
};
S.dharma = (ctx, u, l) => {
  const p = prog(u, 90, 104.5);
  const cam = kf(u, [[90, [0.5, 0.55, 1.0]], [104.5, [0.54, 0.34, 1.32]]], E.inOutSine);
  plate(ctx, '01', { cx: cam[0], cy: cam[1], z: cam[2] }, {
    pz: 0.04 * p,
    between: (T) => {
      // a subtle aura from the lamps behind the head: between the layers, not on the face
      const [x, y] = P2S(T, 0.53, 0.2);
      ctx.save(); ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.6 + 0.2 * Math.sin(M.TS(u) * 0.8);
      ctx.fillStyle = radial(ctx, x, y, 520 * T.s, [[0, 'rgba(255,205,120,0.7)'], [0.4, 'rgba(255,160,70,0.25)'], [1, 'rgba(255,120,40,0)']]);
      ctx.fillRect(0, 0, W, H); ctx.restore();
    },
  });
  grade(ctx, { cold: 0.25, warm: 0.2, dark: 0.12 });
  embers(ctx, u, { n: 46, seed: 41, alpha: 0.7, size: 0.8 });
  const outA = 103.4;
  landWord(ctx, 'TRUTH', W / 2, 560, 104, u, 99.3, { out: outA });
  landWord(ctx, 'COURAGE', W / 2, 740, 104, u, 100.3, { out: outA });
  landWord(ctx, 'DHARMA', W / 2, 940, 128, u, 101.4, { out: outA + 0.3 });
};
S.hanuman = (ctx, u, l) => {
  const p = prog(u, 104, 109.5);
  plate(ctx, '04', { cx: 0.52, cy: 0.42, z: logz(1.0, 1.1, p) }, {
    pz: 0.04 * p,
    between: () => shafts(ctx, u, W * 1.0, H * 0.3, 3.0, { alpha: 0.3, n: 7, seed: 12 }),
  });
  grade(ctx, { warm: 0.2 });
  embers(ctx, u, { n: 36, seed: 44, alpha: 0.6, size: 0.7 });
  nameCard(ctx, u, 104.6, 108.8, 'हनुमान', 'HANUMAN', W / 2, 1090, { size: 130 });
};
S.within = (ctx, u, l) => {
  const p = prog(u, 109, 114.5);
  plate(ctx, '13', { cx: lerp(0.32, 0.56, E.inOutSine(p)), cy: 0.55, z: 1.08 });
  grade(ctx, { warm: 0.15 });
  motes(ctx, u, { n: 40, alpha: 0.7, seed: 50, color: sprite.bokeh });
  embers(ctx, u, { n: 30, seed: 51, alpha: 0.5, size: 0.6 });
};
S.chariot = (ctx, u, l) => {
  const p = prog(u, 114, 120.5);
  plate(ctx, '09', { cx: 0.5, cy: 0.55, z: logz(1.0, 1.12, p) }, { pz: 0.04 * p });
  grade(ctx, { warm: 0.1 });
  fireworksIn(ctx, u, 114, 120);
  embers(ctx, u, { n: 40, seed: 55, alpha: 0.6, size: 0.7 });
};
S.aerial = (ctx, u, l) => {
  const p = prog(u, 120, 128.5);
  const T = plate(ctx, '14', { cx: 0.28, cy: 0.45, z: logz(1.42, 1.0, E.outCubic(p)) });
  grade(ctx, { warm: 0.12 });
  // the beam from the temple spire grows
  const [bx, by] = P2S(T, 0.218, 0.2);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const bh = E.outCubic(prog(u, 120.5, 124)) * by;
  const g = ctx.createLinearGradient(0, by, 0, by - bh - 40);
  g.addColorStop(0, 'rgba(255,200,120,0.28)'); g.addColorStop(1, 'rgba(255,170,80,0)');
  ctx.fillStyle = g; ctx.fillRect(bx - 14, by - bh - 40, 28, bh + 40);
  ctx.fillStyle = radial(ctx, bx, by, 220, [[0, 'rgba(255,210,140,0.22)'], [1, 'rgba(255,160,60,0)']]); ctx.fillRect(bx - 300, by - 300, 600, 600);
  ctx.restore();
  fireworksIn(ctx, u, 120, 128);
  embers(ctx, u, { n: 50, seed: 61, alpha: 0.7, size: 0.7 });
};
S.finale = (ctx, u, l) => {
  const p = prog(u, 128, 144);
  // pan across all four: Lakshman, Ram, Sita, Hanuman
  const cx = kf(u, [[128, 0.36], [133, 0.5], [138, 0.62], [144, 0.66]], E.inOutSine);
  plate(ctx, '15', { cx, cy: 0.5, z: logz(1.0, 1.06, p) }, { pz: 0.03 * p });
  grade(ctx, { warm: 0.15, dark: 0.4 * E.inOutSine(prog(u, 129, 133)) });
  ctx.save(); const eg = ctx.createLinearGradient(0, H * 0.45, 0, H * 0.8); eg.addColorStop(0, 'rgba(0,0,0,0)'); eg.addColorStop(0.5, `rgba(0,0,0,${0.45 * prog(u, 128, 130)})`); eg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = eg; ctx.fillRect(0, H * 0.45, W, H * 0.35); ctx.restore();
  petals(ctx, u, { n: 30, seed: 66, size: 1.0 });
  fireworksIn(ctx, u, 128, 144, -0.03);
  embers(ctx, u, { n: 50, seed: 67, alpha: 0.7, size: 0.8 });
  endCard(ctx, u);
};
function endCard(ctx, u) {
  // line 1: the blessing, as words (narration says it at 107 s)
  const a1 = E.outCubic(prog(u, 128.4, 129.6)) * (1 - E.inCubic(prog(u, 131.8, 132.5)));
  if (a1 > 0) {
    ctx.save(); ctx.globalAlpha = a1; ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 24;
    ctx.font = `italic ${font(58, 400, UI)}`; ctx.fillStyle = C.white;
    ctx.fillText('May the light of Shri Ram', W / 2, 1080 + (1 - a1) * 30);
    ctx.fillText('illuminate every heart.', W / 2, 1160 + (1 - a1) * 30);
    ctx.restore();
  }
  // शुभ दीपावली: reveal left to right with a glint, then the diya above it
  const r = E.inOutCubic(prog(u, 132.6, 134.2));
  if (r > 0) {
    const size = 160, base = 1060;
    ctx.save();
    ctx.font = font(size, 400, UI); ctx.textAlign = 'center';
    const w = ctx.measureText('शुभ दीपावली').width;
    ctx.beginPath(); ctx.rect(W / 2 - w / 2 - 20, base - size * 1.2, (w + 40) * r, size * 1.8); ctx.clip();
    ctx.shadowColor = 'rgba(0,0,0,0.75)'; ctx.shadowBlur = 40;
    ctx.fillStyle = goldFill(ctx, base - size, base + size * 0.2);
    ctx.fillText('शुभ दीपावली', W / 2, base);
    ctx.restore();
    if (r < 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(sprite.glint, W / 2 - w / 2 - 20 + (w + 40) * r - 160, base - 220, 320, 320); ctx.restore(); }
    const d = E.outCubic(prog(u, 133.4, 134.6));
    if (d > 0) {
      // the clay diya: a small bowl drawn in gold line + a live flame
      const dx = W / 2, dy = base - size * 1.05;
      ctx.save(); ctx.globalAlpha = d; ctx.fillStyle = goldFill(ctx, dy, dy + 40);
      ctx.beginPath(); ctx.moveTo(dx - 70, dy); ctx.quadraticCurveTo(dx, dy + 70, dx + 70, dy); ctx.quadraticCurveTo(dx + 40, dy + 8, dx + 90, dy - 10); ctx.quadraticCurveTo(dx, dy + 30, dx - 70, dy); ctx.fill();
      ctx.restore();
      flame(ctx, dx + 52, dy - 4, 70 * d, u, { seed: 9, alpha: d, halo: 0.8 });
    }
    const s2 = E.outCubic(prog(u, 133.6, 134.8));
    ctx.save(); ctx.globalAlpha = s2; ctx.textAlign = 'center'; ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 18;
    ctx.font = `italic ${font(50, 400, UI)}`; ctx.fillStyle = C.white;
    ctx.fillText('Wishing you a blessed Badi Diwali', W / 2, base + 110);
    ctx.restore();
  }
  landWord(ctx, 'JAI SHRI RAM', W / 2, 1330, 80, u, 137, { weight: 800, track: 0.16 });
  const rule = E.outCubic(prog(u, 137.6, 138.6));
  ctx.fillStyle = 'rgba(242,196,106,0.85)'; ctx.fillRect(W / 2 - 200 * rule, 1366, 400 * rule, 2);
}

const SHOTS = [
  ['hook14', 0], ['exile', 4], ['title', 10], ['vimana', 15], ['ramlak', 20], ['sita', 23], ['rangoli', 26],
  ['flame', 38], ['arrive', 50], ['wave', 62], ['ghat', 70], ['crowd', 73.5], ['reunion', 77], ['dharma', 90],
  ['hanuman', 104], ['within', 109], ['chariot', 114], ['aerial', 120], ['finale', 128], ['end', 999],
];
// transition INTO each shot: type + length in beats (drawn over the first beats of the new shot)
const TR = {
  exile: ['mist', 0.9], title: ['mist', 1.2], vimana: ['cloud', 1.0], ramlak: ['light', 0.8], sita: ['light', 0.8],
  rangoli: ['dissolve', 1.0], flame: ['dissolve', 0.6], arrive: ['iris', 1.6], wave: ['dissolve', 0.6], ghat: ['light', 0.7],
  crowd: ['dissolve', 0.6], reunion: ['dissolve', 1.6], dharma: ['ember', 1.2], hanuman: ['light', 0.9], within: ['dissolve', 0.8],
  chariot: ['burst', 0.8], aerial: ['light', 0.9], finale: ['dissolve', 1.4],
};

function shotAt(u) {
  let i = 0;
  while (i + 1 < SHOTS.length && u >= SHOTS[i + 1][1]) i++;
  return i;
}
function drawShot(ctx, i, u) {
  const [id, b0] = SHOTS[i];
  ctx.save(); S[id](ctx, u, u - b0); ctx.restore();
}

// ------------------------------------------------------------------ captions (narration, word by word)
function captions(ctx, u) {
  const t = M.TS(u);
  const v = TL.vo.find((x, i) => i < 28 && t >= x.t - 0.1 && t <= x.end + 0.45);
  if (!v) return;
  const a = clamp((t - (v.t - 0.1)) / 0.18) * (1 - clamp((t - v.end - 0.15) / 0.3));
  const words = v.text.split(' ');
  const chars = v.text.replace(/\s/g, '').length;
  const f = font(52, 400, UI);
  ctx.save(); ctx.font = f;
  const maxW = W - 72 - 150 - 20;
  const lines = [[]]; let lw = 0;
  const sp = ctx.measureText(' ').width;
  words.forEach((w) => { const ww = ctx.measureText(w).width; if (lw + ww > maxW && lines[lines.length - 1].length) { lines.push([]); lw = 0; } lines[lines.length - 1].push(w); lw += ww + sp; });
  const lh = 64, y0 = 1440 - (lines.length - 1) * lh;
  let acc = 0;
  const speak = (t - v.t) / Math.max(0.3, v.end - v.t - 0.15);
  ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 14; ctx.textAlign = 'left';
  lines.forEach((ln, li) => {
    const tw = ln.reduce((s, w) => s + ctx.measureText(w).width, 0) + sp * (ln.length - 1);
    let x = W / 2 - tw / 2 - 39;               // centred in the safe area (right side keeps clear of the Reels buttons)
    ln.forEach((w) => {
      const w0 = acc / chars; acc += w.replace(/\W/g, '').length || 1;
      const on = clamp((speak - w0) * 8);
      ctx.globalAlpha = a * (0.55 + 0.45 * on);
      ctx.lineWidth = 7; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(10,6,2,0.55)'; ctx.strokeText(w, x, y0 + li * lh);
      ctx.fillStyle = on > 0.5 && speak < acc / chars + 0.02 ? C.gold : C.white;
      ctx.fillText(w, x, y0 + li * lh);
      x += ctx.measureText(w).width + sp;
    });
  });
  ctx.restore();
}

// ------------------------------------------------------------------ film
M.film({
  fonts: [font(100, 800, DISPLAY), font(100, 600, DISPLAY), font(52, 400, UI), `italic ${font(52, 400, UI)}`],
  samples: 1,
  shutter: 0.5,
  hits: HITS,
  async init(ctx) {
    await document.fonts.load(font(100, 400, UI), 'शुभ दीपावली सीता हनुमान श्री राम पुष्पक विमान');
    TL = await fetch('timeline.json').then((r) => r.json());
    PLATES = await fetch('assets/plates/plates.json').then((r) => r.json());
    const load = async (src) => { const im = new Image(); im.src = src; await im.decode(); return im; };
    await Promise.all(Object.entries(PLATES).map(async ([k, m]) => {
      LAYERS[k] = { full: await load(`assets/plates/${k}.jpg`) };
      if (m.split) { LAYERS[k].bg = await load(`assets/plates/${k}_bg.jpg`); LAYERS[k].fg = await load(`assets/plates/${k}_fg.webp`); }
    }));
    off = document.createElement('canvas'); off.width = W; off.height = H; offc = off.getContext('2d');
    small = document.createElement('canvas'); small.width = W / 8; small.height = H / 8; smallc = small.getContext('2d');
    sprite.ember = makeSprite(32, [[0, 'rgba(255,240,200,1)'], [0.2, 'rgba(255,170,70,0.9)'], [0.6, 'rgba(255,110,30,0.25)'], [1, 'rgba(255,80,0,0)']]);
    sprite.mote = makeSprite(16, [[0, 'rgba(255,240,210,0.9)'], [1, 'rgba(255,220,160,0)']]);
    sprite.bokeh = makeSprite(48, [[0, 'rgba(255,200,120,0.5)'], [0.85, 'rgba(255,180,90,0.35)'], [1, 'rgba(255,160,60,0)']]);
    sprite.mist = makeSprite(128, [[0, 'rgba(140,165,200,0.55)'], [1, 'rgba(120,140,180,0)']]);
    sprite.cloud = makeSprite(128, [[0, 'rgba(255,210,160,0.6)'], [1, 'rgba(240,170,110,0)']]);
    sprite.glint = makeSprite(64, [[0, 'rgba(255,255,240,1)'], [0.15, 'rgba(255,220,150,0.6)'], [1, 'rgba(255,180,80,0)']]);
    sprite.sparkW = makeSprite(16, [[0, 'rgba(255,255,240,1)'], [1, 'rgba(255,240,200,0)']]);
    sprite.spark = [[255, 140, 60], [255, 200, 90], [255, 230, 150]].map(([r, g, b]) => makeSprite(16, [[0, `rgba(255,250,230,1)`], [0.3, `rgba(${r},${g},${b},0.9)`], [1, `rgba(${r},${g},${b},0)`]]));
    // film grain tiles (seeded)
    for (let k = 0; k < 4; k++) {
      const c = document.createElement('canvas'); c.width = 540; c.height = 960;
      const x = c.getContext('2d'); const im = x.createImageData(540, 960); const r = mulberry32(1000 + k);
      for (let i = 0; i < im.data.length; i += 4) { const v = 128 + (r() - 0.5) * 120; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
      x.putImageData(im, 0, 0); grainTiles.push(c);
    }
  },
  draw(ctx, u, t) {
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
    const i = shotAt(u);
    const id = SHOTS[i][0];
    if (id === 'end') { drawShot(ctx, i - 1, u); return; }
    const tr = TR[id], b0 = SHOTS[i][1];
    if (!tr || u >= b0 + tr[1] || i === 0) { drawShot(ctx, i, u); return; }
    // transition: the outgoing shot keeps running underneath; the new one arrives over it
    const p = (u - b0) / tr[1];
    drawShot(ctx, i - 1, u);
    offc.save(); offc.setTransform(1, 0, 0, 1, 0, 0); offc.globalAlpha = 1; offc.globalCompositeOperation = 'source-over';
    offc.fillStyle = C.ink; offc.fillRect(0, 0, W, H);
    // shots that use `off` themselves (wave) need it free: draw the wave directly with a fade instead
    if (id === 'wave') { ctx.save(); ctx.globalAlpha = E.inOutSine(p); drawShot(ctx, i, u); ctx.restore(); offc.restore(); return; }
    drawShot(offc, i, u);
    offc.restore();
    const type = tr[0];
    ctx.save();
    if (type === 'dissolve' || type === 'mist' || type === 'cloud' || type === 'ember') {
      ctx.globalAlpha = E.inOutSine(p);
      ctx.drawImage(off, 0, 0);
      ctx.globalAlpha = 1;
      if (type === 'mist') mist(ctx, u, { alpha: 0.9 * Math.sin(p * Math.PI), y0: 0.1, y1: 0.95, n: 12, seed: 77, speed: 160 });
      if (type === 'cloud') mist(ctx, u, { alpha: 1.1 * Math.sin(p * Math.PI), y0: 0.0, y1: 1.0, n: 14, seed: 78, speed: 400, tint: sprite.cloud });
      if (type === 'ember') embers(ctx, u, { n: 120, seed: 79, alpha: Math.sin(p * Math.PI), size: 1.3, rise: 3 });
    } else if (type === 'light' || type === 'burst') {
      // a diagonal band of light sweeps; behind it is the new shot
      const e = E.inOutCubic(p), x = lerp(-W * 0.6, W * 1.6, e);
      ctx.beginPath(); ctx.moveTo(x - 500, 0); ctx.lineTo(x + 300, 0); ctx.lineTo(x - 300, H); ctx.lineTo(-W, H); ctx.lineTo(-W, 0); ctx.closePath();
      ctx.clip(); ctx.drawImage(off, 0, 0); ctx.restore(); ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(x - 450, 0, x + 250, 0);
      g.addColorStop(0, 'rgba(255,180,80,0)'); g.addColorStop(0.55, `rgba(255,220,150,${0.42 * Math.sin(p * Math.PI)})`); g.addColorStop(1, 'rgba(255,180,80,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    } else if (type === 'iris') {
      // out of the flame: the new shot opens from the flame's centre through the gold glow
      const R = E.inOutCubic(p) * 1500 + 40;
      ctx.beginPath(); ctx.arc(W * 0.5, H * 0.46, R, 0, TAU); ctx.clip();
      ctx.drawImage(off, 0, 0); ctx.restore(); ctx.save();
      ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 1 - E.outCubic(p);
      ctx.fillStyle = radial(ctx, W * 0.5, H * 0.46, R + 300, [[0, 'rgba(255,200,120,0.2)'], [0.85, 'rgba(255,190,110,0.8)'], [1, 'rgba(255,170,80,1)']]);
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  },
  post(ctx, u, t) {
    // bloom: threshold-ish by contrast, blurred at 1/8 size, screened back
    smallc.save(); smallc.filter = 'brightness(0.75) contrast(2.6) blur(5px)';
    smallc.clearRect(0, 0, small.width, small.height);
    smallc.drawImage(ctx.canvas, 0, 0, small.width, small.height); smallc.restore();
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.24; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(small, 0, 0, W, H); ctx.restore();
    // vignette + a dark band for the captions
    ctx.save();
    ctx.fillStyle = radial(ctx, W / 2, H * 0.45, H * 0.75, [[0, 'rgba(0,0,0,0)'], [0.6, 'rgba(0,0,0,0.05)'], [1, 'rgba(0,0,0,0.6)']]);
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, H * 0.6, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = g; ctx.fillRect(0, H * 0.6, W, H * 0.4);
    ctx.restore();
    if (M.CFG.captions !== false) captions(ctx, u);   // film.json "captions": false -> song-ready version
    // grain at 24 fps
    ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.09;
    ctx.drawImage(grainTiles[Math.floor(t * 24) % 4], 0, 0, W, H); ctx.restore();
    // fade up from black over the first frames is banned; fade down at the very end only
    const fo = prog(t, 118.6, 120);
    if (fo > 0) { ctx.fillStyle = `rgba(0,0,0,${fo})`; ctx.fillRect(0, 0, W, H); }
  },
});
