// shots_v2.js: the PAINTED cut (Globexplained style). Same shot timing as shots.js (so the narration,
// subtitles and score still fit), but every scene is an AI-painted plate (v2/plates/<id>.png, made by
// v2/plates.json) animated with slow camera moves and atmosphere, plus the channel's motion graphics:
// gold titles, parchment maps, callouts, timelines, archival inserts.
import { E, kf, shake } from './lib/motion.js';
import { look, clamp, smooth, lerp, h01, css, hex, mixc } from './lib/util.js';
import { puff } from './lib/paint.js';
import { fall, bounces, rays, lightning, veil } from './lib/fx.js';
import { drawMap } from './sets/map.js';
import { timeline, calendar } from './sets/diagrams.js';
import { archival, endCard } from './sets/views.js';
import { buildShots } from './shots.js';
import { callout, stamp, lowerThird, capsText, goldText, F, GOLD, CREAM, RED } from './lib/gfx.js';

const REC = 'ARTISTIC RECONSTRUCTION · AI-ASSISTED', FIC = 'FICTIONAL FAMILY · AI-ASSISTED RECONSTRUCTION', SCI = 'ILLUSTRATION · SIMPLIFIED · AI-ASSISTED', NOW = 'PRESENT DAY · AI-ASSISTED ILLUSTRATION';
const TAU = Math.PI * 2;

// Ken Burns in log space: from/to = [focusX, focusY, zoom]; optional slow roll.
function plate(ctx, img, W, H, k, from, to, { roll = 0, grade = null, shakeAmp = 0, t = 0 } = {}) {
  if (!img) { ctx.fillStyle = '#20160f'; ctx.fillRect(0, 0, W, H); return; }
  const p = E.inOutSine(clamp(k));
  const z = 1.07 * from[2] * (to[2] / from[2]) ** p, fx = lerp(from[0], to[0], p), fy = lerp(from[1], to[1], p);
  const s = Math.max(W / img.width, H / img.height) * z, dw = img.width * s, dh = img.height * s;
  ctx.save();
  if (shakeAmp) ctx.translate(shakeAmp * Math.sin(t * 53) * Math.sin(t * 7), shakeAmp * Math.cos(t * 47) * Math.sin(t * 5));
  if (roll) { ctx.translate(W / 2, H / 2); ctx.rotate(roll * (p - 0.5)); ctx.translate(-W / 2, -H / 2); }
  ctx.drawImage(img, (W - dw) * fx, (H - dh) * fy, dw, dh);
  ctx.restore();
  if (grade) { ctx.save(); ctx.globalCompositeOperation = grade[0]; ctx.fillStyle = grade[1]; ctx.globalAlpha = grade[2]; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}
// Atmosphere layers over a painting.
function embers(ctx, W, H, t, n = 60, seed = 3) {
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < n; i++) { const per = 4 + 4 * h01(i, seed), ph = ((t / per) + h01(i, seed + 1)) % 1; const x = W * h01(i, seed + 2) + 40 * Math.sin(t + i), y = H * (1.05 - ph * 1.1); const r = 1.5 + 2.5 * h01(i, seed + 3); ctx.fillStyle = `rgba(255,${150 + 60 * h01(i, 9) | 0},70,${0.8 * Math.sin(Math.PI * ph)})`; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function smoke(ctx, W, H, t, a = 0.4, kind = 'grey', y = 0.85, seed = 5) {
  for (let i = 0; i < 14; i++) { const x = ((h01(i, seed) * (W + 600) + t * (12 + 10 * h01(i, seed + 1))) % (W + 600)) - 300; puff(ctx, kind, i, x, H * y + 60 * Math.sin(t * 0.3 + i), 220 + 160 * h01(i, seed + 2), a); }
}
function flicker(ctx, W, H, t, x, y, r, a = 0.5) {
  const f = 0.8 + 0.2 * Math.sin(t * 11) * Math.sin(t * 7.3);
  ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(x, y, 0, x, y, r * f); g.addColorStop(0, `rgba(255,170,80,${a})`); g.addColorStop(1, 'rgba(255,120,40,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
}
function flash(ctx, W, H, t, times) { for (const ts of times) { const k = t - ts; if (k >= 0 && k < 0.35) { ctx.fillStyle = `rgba(220,225,255,${0.35 * (k < 0.08 ? 1 : 1 - (k - 0.08) / 0.27)})`; ctx.fillRect(0, 0, W, H); } } }
function split(ctx, W, H, k) { ctx.fillStyle = GOLD; ctx.fillRect(W * k - 2, 0, 4, H); }

export function plateList() {
  return ['1A', '1B', '1C', '1D', '1E', '2B', '2C', '2D', '2E', '3A', '3B', '3C', '3D', '3E', '4C', '4D', '4E', '4F', '4G', '4H', '4I', '5B', '5C', '5D', '5E', '5F', '5G', '5H', '6A', '6B', '6C', '6D', '6E', '6F', '6G', '7A', '7Ca', '7Cb', '7E', '7F', '8A', '8B', '8C', '8E', '9A', '9B', '9C', '10A', '10D', '10E', '10F', '11R', '11C', '11D', '11F', '12A', '12B', '12C', '12D'];
}

export function buildShotsV2(TL) {
  const base = buildShots(TL);
  const P = (id) => 'P' + id;   // image key
  // per-shot painted direction: [plate, from, to, extra(ctx, lt, d, t, W, H)]
  const V = {
    '1A': [P('1A'), [0.5, 0.6, 1.18], [0.5, 0.5, 1.0], (c, lt, d, t, W, H) => smoke(c, W, H, t, 0.05, 'light', 0.75)],
    '1B': [P('1B'), [0.5, 0.55, 1.0], [0.5, 0.45, 1.15], (c, lt, d, t, W, H) => fall(c, W, H, t, { kind: 'dust', density: 0.6, wind: 6 })],
    '1C': [P('1C'), [0.4, 0.5, 1.05], [0.55, 0.45, 1.2]],
    '1D': [P('1D'), [0.3, 0.5, 1.15], [0.6, 0.45, 1.05], (c, lt, d, t, W, H) => fall(c, W, H, t, { kind: 'dust', density: 0.5, wind: 5 })],
    '1E': [P('1E'), [0.5, 0.8, 1.0], [0.5, 0.25, 1.3]],
    '2B': [P('2B'), [0.1, 0.5, 1.15], [0.9, 0.5, 1.15], (c, lt, d, t, W, H) => { callout(c, W * 0.3, H * 0.55, W * 0.12, H * 0.2, 'TABERNA', 'a shop open to the street', smooth(0.6, 1.8, lt) * (1 - smooth(d - 0.6, d, lt))); callout(c, W * 0.7, H * 0.6, W * 0.62, H * 0.2, 'BAKERY & FOOD COUNTER', 'bread, wine and hot food', smooth(2, 3.2, lt) * (1 - smooth(d - 0.6, d, lt))); }],
    '2C': [P('2C'), [0.5, 0.4, 1.0], [0.5, 0.6, 1.2], (c, lt, d, t, W, H) => { rays(c, W * 0.5, 0, H * 0.9, 0.35, 0.12, [255, 230, 180], 6, t); callout(c, W * 0.5, H * 0.78, W * 0.62, H * 0.86, 'IMPLUVIUM', 'rainwater basin under the roof opening', smooth(2.6, 3.8, lt) * (1 - smooth(d - 0.6, d, lt))); }],
    '2D': [P('2D'), [0.5, 0.6, 1.0], [0.5, 0.4, 1.18], (c, lt, d, t, W, H) => callout(c, W * 0.5, H * 0.35, W * 0.64, H * 0.16, 'TEMPLE OF JUPITER', 'the heart of the Forum', smooth(1.5, 2.8, lt) * (1 - smooth(d - 0.6, d, lt)))],
    '2E': [P('2E'), [0.5, 0.7, 1.0], [0.5, 0.35, 1.22], (c, lt, d, t, W, H) => { if (lt > d - 4) { c.fillStyle = `rgba(30,18,8,${0.25 * smooth(d - 4, d, lt)})`; c.fillRect(0, 0, W, H); } }],
    '3A': [P('3A'), [0.5, 0.4, 1.2], [0.5, 0.5, 1.0], (c, lt, d, t, W, H) => smoke(c, W, H, t, 0.15, 'grey', 0.3)],
    '3B': [P('3B'), [0.5, 0.5, 1.1], [0.5, 0.5, 1.2], (c, lt, d, t, W, H) => { smoke(c, W, H, t, 0.35 * smooth(0.5, 2, lt), 'brown', 0.8); }, { shake: (lt, d) => 16 * (1 - smooth(3, d, lt)) }],
    '3C': [P('3C'), [0.3, 0.5, 1.12], [0.6, 0.5, 1.0], (c, lt, d, t, W, H) => lowerThird(c, W, H, 'REPAIRS STILL UNDER WAY', 'EVIDENCE FROM EXCAVATED BUILDINGS', smooth(0.2, 1.2, lt), smooth(d - 0.6, d, lt))],
    '3D': [P('3D'), [0.5, 0.5, 1.05], [0.5, 0.65, 1.2], (c, lt, d, t, W, H) => { callout(c, W * 0.5, H * 0.82, W * 0.66, H * 0.7, 'MAGMA RESERVOIR', 'several kilometres below the surface', smooth(0.5, 2, lt)); callout(c, W * 0.5, H * 0.5, W * 0.64, H * 0.38, 'CONDUIT', 'pathway for rising magma and gas', smooth(2.2, 3.6, lt)); }],
    '3E': [P('3E'), [0.3, 0.5, 1.15], [0.7, 0.5, 1.15], (c, lt, d, t, W, H) => flicker(c, W, H, t, W * 0.5, H * 1.05, H * 0.6, 0.25 * smooth(1, d, lt))],
    '4C': [P('4C'), [0.5, 0.75, 1.3], [0.5, 0.4, 1.0], (c, lt, d, t, W, H) => { flash(c, W, H, t, [t - lt + 0.02]); smoke(c, W, H, t, 0.2, 'grey', 0.9); }, { shake: (lt) => 12 * (1 - smooth(0, 1.6, lt)) }],
    '4D': [P('4D'), [0.5, 0.7, 1.0], [0.5, 0.35, 1.18]],
    '4E': [P('4E'), [0.4, 0.5, 1.05], [0.6, 0.45, 1.15], (c, lt, d, t, W, H) => { const k = smooth(1.4, 5, lt); if (k > 0) { c.save(); c.strokeStyle = GOLD; c.lineWidth = 4; c.setLineDash([14, 10]); c.lineDashOffset = -t * 20; c.globalAlpha = smooth(0, 0.3, k); c.beginPath(); c.ellipse(W * 0.52, H * 0.2, W * 0.12 * k, H * 0.07, 0, Math.PI, TAU); c.moveTo(W * 0.52, H * 0.22); c.lineTo(W * 0.52, H * 0.22 + H * 0.3 * k); c.stroke(); c.restore(); capsText(c, 'AN UMBRELLA PINE', W * 0.52, H * 0.09, 30, GOLD, smooth(3.5, 4.5, lt), 'center', 0.2); } }],
    '4F': [P('4F'), [0.5, 0.6, 1.0], [0.5, 0.5, 1.12]],
    '4G': [P('4G'), [0.5, 0.7, 1.0], [0.5, 0.3, 1.15], (c, lt, d, t, W, H) => { c.fillStyle = `rgba(20,14,10,${0.35 * lt / d})`; c.fillRect(0, 0, W, H); }],
    '4H': [P('4H'), [0.5, 0.45, 1.0], [0.5, 0.4, 1.12], (c, lt, d, t, W, H) => fall(c, W, H, t, { kind: 'ash', density: 0.35, wind: 25 })],
    '4I': [P('4I'), [0.5, 0.5, 1.15], [0.5, 0.5, 1.0], (c, lt, d, t, W, H) => fall(c, W, H, t, { kind: 'ash', density: 0.25, wind: 40 })],
    '5B': [P('5B'), [0.5, 0.5, 1.05], [0.5, 0.6, 1.2], (c, lt, d, t, W, H) => { fall(c, W, H, t, { kind: 'pumice', density: 0.9, wind: 40 }); bounces(c, W, t, H * 0.75, H, 0.8); fall(c, W, H, t, { kind: 'ash', density: 0.5, wind: 50 }); }],
    '5C': [P('5C'), [0.5, 0.5, 1.15], [0.5, 0.5, 1.0], (c, lt, d, t, W, H) => { c.fillStyle = `rgba(10,7,5,${0.45 * lt / d})`; c.fillRect(0, 0, W, H); fall(c, W, H, t, { kind: 'ash', density: 0.6, wind: 40 }); }],
    '5D': [P('5D'), [0.45, 0.5, 1.0], [0.55, 0.45, 1.15], (c, lt, d, t, W, H) => flicker(c, W, H, t, W * 0.45, H * 0.4, H * 0.7, 0.3)],
    '5E': [P('5E'), [0.5, 0.5, 1.0], [0.5, 0.4, 1.15], (c, lt, d, t, W, H) => { fall(c, W, H, t, { kind: 'pumice', density: 1, wind: 40 }); fall(c, W, H, t, { kind: 'ash', density: 0.6, wind: 50 }); }],
    '5F': [P('5F'), [0.5, 0.5, 1.12], [0.5, 0.5, 1.0], (c, lt, d, t, W, H) => { flicker(c, W, H, t, W * 0.5, H * 0.45, H * 0.6, 0.3); fall(c, W, H, t, { kind: 'dust', density: 0.8, wind: 4 }); }],
    '5G': [P('5G'), [0.5, 0.35, 1.0], [0.5, 0.55, 1.15], (c, lt, d, t, W, H) => { fall(c, W, H, t, { kind: 'pumice', density: 0.8, wind: 30 }); smoke(c, W, H, t, 0.5 * smooth(3, 4, lt), 'brown', 0.7); }, { shake: (lt) => (lt > 3 ? 10 * (1 - smooth(3, 4, lt)) : 0) }],
    '5H': [P('5H'), [0.5, 0.5, 1.0], [0.5, 0.45, 1.15], (c, lt, d, t, W, H) => { flicker(c, W, H, t, W * 0.55, H * 0.35, H * 0.5, 0.35); fall(c, W, H, t, { kind: 'pumice', density: 0.7, wind: 30 }); fall(c, W, H, t, { kind: 'ash', density: 0.6, wind: 40 }); }],
    '6A': [P('6A'), [0.5, 0.5, 1.0], [0.5, 0.45, 1.1], (c, lt, d, t, W, H) => { flash(c, W, H, t, [t - lt + 1.8, t - lt + 3.6]); timeline(c, W, H, t, { p: smooth(0, 1.5, lt), cursor: 0.18 + 0.32 * lt / d, title: 'THE ERUPTION · APPROXIMATE PHASES', items: [['DAY 1, MIDDAY', 'eruption begins', 0.04], ['AFTERNOON-NIGHT', 'pumice and ash fall', 0.34], ['NIGHT', 'first currents (Herculaneum)', 0.64], ['DAY 2, MORNING', 'currents reach Pompeii', 0.94]] }); }],
    '6B': [P('6B'), [0.5, 0.5, 1.0], [0.5, 0.5, 1.14], (c, lt, d, t, W, H) => { embers(c, W, H, t, 40); fall(c, W, H, t, { kind: 'ash', density: 0.7, wind: 40 }); }],
    '6C': [P('6C'), [0.5, 0.45, 1.05], [0.5, 0.55, 1.15], (c, lt, d, t, W, H) => smoke(c, W, H, t, 0.5 * smooth(0.8, 1.6, lt), 'brown', 0.75), { shake: (lt) => (lt > 0.9 ? 12 * (1 - smooth(0.9, 1.8, lt)) : 0) }],
    '6D': [P('6D'), [0.4, 0.5, 1.1], [0.6, 0.5, 1.1], (c, lt, d, t, W, H) => { embers(c, W, H, t, 30); fall(c, W, H, t, { kind: 'ash', density: 0.8, wind: 40 }); }],
    '6E': [P('6E'), [0.5, 0.5, 1.0], [0.5, 0.5, 1.2], (c, lt, d, t, W, H) => { veil(c, W, H, [70, 60, 52], 0.3 + 0.4 * lt / d, 0.2 + 0.4 * lt / d); fall(c, W, H, t, { kind: 'ash', density: 1, wind: 40 }); }],
    '6F': [P('6F'), [0.5, 0.4, 1.0], [0.5, 0.5, 1.12], (c, lt, d, t, W, H) => { flicker(c, W, H, t, W * 0.5, H * 0.3, H * 0.6, 0.3); fall(c, W, H, t, { kind: 'dust', density: 1, wind: 3 }); }, { shake: (lt) => 4 * smooth(1, 1.5, lt) }],
    '6G': [P('6G'), [0.5, 0.45, 1.0], [0.5, 0.5, 1.15], (c, lt, d, t, W, H) => { flash(c, W, H, t, [t - lt + 1.0]); if (lt > d - 2) { c.fillStyle = `rgba(0,0,0,${0.4 * smooth(d - 2, d, lt)})`; c.fillRect(0, 0, W, H); } }],
    '7A': [P('7A'), [0.4, 0.4, 1.15], [0.45, 0.45, 1.05], (c, lt, d, t, W, H) => callout(c, W * 0.4, H * 0.25, W * 0.56, H * 0.14, 'ERUPTION COLUMN', 'gas, ash and pumice rising tens of km', smooth(0.4, 1.8, lt))],
    '7B': [P('7A'), [0.45, 0.45, 1.05], [0.6, 0.6, 1.25], (c, lt, d, t, W, H) => { callout(c, W * 0.6, H * 0.7, W * 0.42, H * 0.86, 'PYROCLASTIC CURRENT', 'hot gas + ash + rock, hugging the ground', smooth(1.0, 2.4, lt), { accent: '#d9662e' }); smoke(c, W, H, t, 0.3, 'grey', 0.9); }],
    '7E': [P('7E'), [0.5, 0.5, 1.0], [0.5, 0.5, 1.25], (c, lt, d, t, W, H) => smoke(c, W, H, t, 0.35 + 0.4 * lt / d, 'grey', 0.8)],
    '7F': [P('7F'), [0.5, 0.5, 1.0], [0.5, 0.55, 1.15], (c, lt, d, t, W, H) => { fall(c, W, H, t, { kind: 'ash', density: 0.4, wind: 20 }); c.fillStyle = `rgba(150,142,132,${0.9 * smooth(d - 2.2, d, lt)})`; c.fillRect(0, 0, W, H); }],
    '8A': [P('8A'), [0.5, 0.5, 1.15], [0.5, 0.5, 1.0], (c, lt, d, t, W, H) => smoke(c, W, H, t, 0.18, 'grey', 0.55)],
    '8B': [P('8B'), [0.5, 0.5, 1.0], [0.5, 0.55, 1.12], (c, lt, d, t, W, H) => { callout(c, W * 0.42, H * 0.3, W * 0.62, H * 0.16, 'SEALED BENEATH THE DEPOSITS', 'layers of pumice and ash, several metres deep', smooth(0.5, 2, lt)); }],
    '8C': [P('8C'), [0.5, 0.5, 1.0], [0.5, 0.45, 1.12], (c, lt, d, t, W, H) => rays(c, W * 0.7, 0, H, 0.4, 0.1, [255, 240, 210], 6, t)],
    '8E': [P('8E'), [0.5, 0.5, 1.2], [0.5, 0.5, 1.0], (c, lt, d, t, W, H) => smoke(c, W, H, t, 0.12, 'grey', 0.4)],
    '9A': [P('9A'), [0.5, 0.5, 1.15], [0.5, 0.5, 1.0], (c, lt, d, t, W, H) => stamp(c, W, H, `AD ${Math.round(lerp(79, 500, smooth(1, d, lt)))}`, smooth(0, 1, lt), 0, { y: H * 0.2, size: 96 })],
    '9B': [P('9B'), [0.5, 0.4, 1.0], [0.5, 0.6, 1.15], (c, lt, d, t, W, H) => callout(c, W * 0.5, H * 0.7, W * 0.62, H * 0.3, 'PRESERVED, NOT ERASED', 'walls, paintings and objects sealed in place', smooth(0.3, 2, lt))],
    '9C': [P('9C'), [0.5, 0.5, 1.12], [0.5, 0.45, 1.0], (c, lt, d, t, W, H) => stamp(c, W, H, `AD ${Math.round(lerp(500, 1700, smooth(0, d - 0.5, lt)))}`, 1, 0, { y: H * 0.2, size: 96, sub: lt > 2 ? 'VESUVIUS ERUPTS AGAIN · 472 · 1631' : null })],
    '9D': [P('9A'), [0.5, 0.6, 1.0], [0.5, 0.7, 1.25], (c, lt, d, t, W, H) => { const k = smooth(0.4, 2.6, lt); c.save(); c.globalCompositeOperation = 'screen'; c.strokeStyle = `rgba(255,205,110,${0.7 * k})`; c.lineWidth = 2; c.beginPath(); c.ellipse(W * 0.5, H * 0.78, W * 0.26, H * 0.09, -0.05, 0, TAU); c.stroke(); c.lineWidth = 1; c.strokeStyle = `rgba(255,205,110,${0.4 * k})`; c.beginPath(); for (let i = -6; i <= 6; i++) { c.moveTo(W * 0.5 + i * W * 0.04, H * 0.7); c.lineTo(W * 0.5 + i * W * 0.04 * 1.15, H * 0.86); } for (let j = 0; j < 4; j++) { c.moveTo(W * 0.27, H * (0.73 + j * 0.035)); c.lineTo(W * 0.73, H * (0.73 + j * 0.035)); } c.stroke(); c.restore(); callout(c, W * 0.5, H * 0.78, W * 0.64, H * 0.5, 'POMPEII', 'buried beneath the fields', smooth(1.4, 3.2, lt)); }],
    '10A': [P('10A'), [0.5, 0.5, 1.0], [0.5, 0.5, 1.15]],
    '10D': [P('10D'), [0.2, 0.5, 1.2], [0.8, 0.5, 1.2], (c, lt, d, t, W, H) => capsText(c, 'EVERYDAY THINGS, PRESERVED', W / 2, 120, 38, CREAM, smooth(0.2, 1, lt), 'center', 0.2)],
    '10E': [P('10E'), [0.5, 0.4, 1.15], [0.5, 0.6, 1.0]],
    '10F': [P('10F'), [0.5, 0.5, 1.0], [0.5, 0.5, 1.18]],
    '11A': [P('1B'), [0.5, 0.5, 1.05], [0.5, 0.5, 1.15], (c, lt, d, t, W, H, IMG) => { const x = W * kf(lt, [[0, 1.02], [1.8, 0.5], [4.2, 0.5], [5.4, 0.3], [d, 0.5]], E.inOutSine); c.save(); c.beginPath(); c.rect(x, 0, W - x, H); c.clip(); plate(c, IMG[P('11R')], W, H, lt / d, [0.5, 0.5, 1.05], [0.5, 0.5, 1.15]); c.restore(); split(c, W, H, x / W); capsText(c, 'AD 79', x - 40, 120, 34, CREAM, smooth(1.5, 2.2, lt), 'right', 0.2); capsText(c, 'TODAY', x + 40, 120, 34, CREAM, smooth(1.5, 2.2, lt), 'left', 0.2); }],
    '11B': [P('11R'), [0.5, 0.7, 1.4], [0.5, 0.75, 1.6], (c, lt, d, t, W, H) => { const k = smooth(0.2, 1.4, lt); c.save(); c.lineWidth = 6; c.setLineDash([18, 12]); c.lineDashOffset = -t * 60; c.strokeStyle = `rgba(155,42,26,${0.9 * k})`; for (const x of [0.4, 0.6]) { c.beginPath(); c.moveTo(W * x, H); c.lineTo(W * (0.5 + (x - 0.5) * 0.4), H * 0.45); c.stroke(); } c.strokeStyle = `rgba(232,189,85,${0.95 * smooth(1, 2, lt)})`; c.beginPath(); c.moveTo(W * 0.1, H * 0.66); c.bezierCurveTo(W * 0.35, H * 0.55, W * 0.65, H * 0.55, W * 0.92, H * 0.66); c.stroke(); c.restore(); capsText(c, 'CART RUTS', W * 0.3, H * 0.92, 28, CREAM, k, 'center', 0.2); capsText(c, 'STEPPING STONES', W * 0.5, H * 0.45, 28, GOLD, smooth(1, 2, lt), 'center', 0.2); }],
    '11C': [P('11C'), [0.5, 0.5, 1.0], [0.5, 0.5, 1.12], (c, lt, d, t, W, H) => { callout(c, W * 0.42, H * 0.5, W * 0.18, H * 0.2, 'ATRIUM', 'the reception hall', smooth(0.2, 1, lt)); callout(c, W * 0.66, H * 0.5, W * 0.8, H * 0.2, 'PERISTYLE', 'colonnaded garden', smooth(0.8, 1.6, lt), { align: 'right' }); }],
    '11D': [P('11D'), [0.2, 0.5, 1.15], [0.8, 0.5, 1.15], (c, lt, d, t, W, H) => callout(c, W * 0.5, H * 0.45, W * 0.66, H * 0.2, 'WALL PAINTINGS', 'colour, imagery and personal taste', smooth(0.5, 2, lt))],
    '11E': [P('10F'), [0.4, 0.5, 1.2], [0.6, 0.5, 1.05], null],
    '11F': [P('11F'), [0.5, 0.5, 1.0], [0.5, 0.5, 1.12], (c, lt, d, t, W, H, IMG) => { const k = smooth(1.5, 4.5, lt); if (k > 0) { c.save(); c.globalAlpha = k; plate(c, IMG[P('2C')], W, H, lt / d, [0.5, 0.5, 1.0], [0.5, 0.5, 1.12]); c.restore(); } }],
    '12A': [P('12A'), [0.5, 0.5, 1.15], [0.5, 0.5, 1.0], (c, lt, d, t, W, H) => fall(c, W, H, t, { kind: 'dust', density: 0.7, wind: 5 })],
    '12B': [P('12B'), [0.5, 0.5, 1.25], [0.5, 0.5, 1.0]],
    '12C': [P('12C'), [0.5, 0.5, 1.0], [0.5, 0.5, 1.15]],
    '12D': [P('12D'), [0.5, 0.5, 1.0], [0.5, 0.45, 1.2], (c, lt, d, t, W, H) => fall(c, W, H, t, { kind: 'dust', density: 0.6, wind: 5 })],
    '12E': [P('12B'), [0.5, 0.5, 1.0], [0.5, 0.5, 1.06], (c, lt, d, t, W, H) => { c.fillStyle = 'rgba(8,5,3,0.5)'; c.fillRect(0, 0, W, H); stamp(c, W, H, 'Pompeii', smooth(0, 1, lt), 0, { size: 170, sub: 'AD 79' }); }],
  };
  const TAG = { '1D': FIC, '4F': FIC, '4H': FIC, '5D': FIC, '5H': FIC, '7F': FIC, '12A': FIC, '3D': SCI, '7A': SCI, '7B': SCI, '8B': SCI, '9B': SCI, '11C': SCI, '10F': NOW, '11B': NOW, '11E': NOW, '12C': NOW, '12D': NOW, '11A': 'RECONSTRUCTION ↔ PRESENT DAY' };
  for (const s of base) {
    if (s.id === '7C') { // painted split: lava vs pyroclastic current
      s.draw = (ctx, lt, d, t, IMG, W, H) => { const p = smooth(0, d * 0.9, lt);
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W / 2, H); ctx.clip(); plate(ctx, IMG[P('7Ca')], W, H, lt / d, [0.5, 0.5, 1.1], [0.5, 0.5, 1.2]); ctx.restore();
        ctx.save(); ctx.beginPath(); ctx.rect(W / 2, 0, W / 2, H); ctx.clip(); plate(ctx, IMG[P('7Cb')], W, H, lt / d, [0.5, 0.5, 1.0], [0.5, 0.5, 1.25]); ctx.restore();
        split(ctx, W, H, 0.5); ctx.fillStyle = 'rgba(10,6,4,0.35)'; ctx.fillRect(0, 0, W, 240);
        capsText(ctx, 'LAVA FLOW', W * 0.25, 150, 54, CREAM, smooth(0, 0.3, p), 'center', 0.12); capsText(ctx, 'PYROCLASTIC CURRENT', W * 0.75, 150, 54, '#f2b07a', smooth(0, 0.3, p), 'center', 0.08);
        if (p > 0.55) { ctx.save(); ctx.globalAlpha = smooth(0.55, 0.7, p); ctx.strokeStyle = RED; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(W * 0.08, H * 0.3); ctx.lineTo(W * 0.42, H * 0.9); ctx.stroke(); ctx.restore(); capsText(ctx, 'NOT WHAT HAPPENED AT POMPEII', W * 0.25, H * 0.95, 26, CREAM, smooth(0.6, 0.75, p), 'center', 0.15); }
        capsText(ctx, 'FAST · HUNDREDS OF °C · HUGS THE GROUND', W * 0.75, H * 0.95, 24, CREAM, smooth(0.65, 0.8, p), 'center', 0.1); };
      s.tag = SCI; continue;
    }
    const v = V[s.id]; if (!v) continue;           // maps, calendar, archival, end card keep their graphics
    const [key, from, to, extra, opt = {}] = v;
    s.draw = (ctx, lt, d, t, IMG, W, H) => { plate(ctx, IMG[key], W, H, lt / d, from, to, { t, shakeAmp: opt.shake ? opt.shake(lt, d) : 0 }); if (extra) extra(ctx, lt, d, t, W, H, IMG); };
    s.tag = TAG[s.id] || (s.tag ? REC : null);
  }
  return base;
}
