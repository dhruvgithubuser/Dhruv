// diagrams.js: scientific / archaeological illustrations, drawn as painted cross-sections.
// cutaway (magma beneath Vesuvius), pdcSide (column collapse -> pyroclastic current), lavaVsPdc,
// strata (deposits over the town), plan (domus floor plan), timeline, calendar evidence, objects.
import { hex, css, mixc, mulc, h01, clamp, smooth, lerp, fbm } from '../lib/util.js';
import { paintSky, puff, ART } from '../lib/paint.js';
import { column, current, fall } from '../lib/fx.js';
import { callout, capsText, goldText, GOLD, CREAM, RED, INKC } from '../lib/gfx.js';
import { E } from '../lib/motion.js';

const TAU = Math.PI * 2;
const ground = (x, W) => { // surface profile for the cutaway: Vesuvius cone at x~0.34W, plain to the right
  const u = x / W; const cone = Math.max(0, 1 - Math.abs(u - 0.34) / 0.2); return 0.58 - 0.32 * cone ** 1.4 - 0.012 * fbm(u * 12, 1, 3, 3);
};

// ---------------------------------------------------------------- cutaway
// st: { p (0..1 build), rise (magma rising 0..1), quake (rings), pan (0 mountain .. 1 city), labels, lk }
export function cutaway(ctx, W, H, t, st) {
  const pan = st.pan || 0, zoom = 1 + (st.zoom || 0);
  ctx.save(); ctx.translate(-pan * W * 0.45, 0);
  const lk = st.lk; const Wd = W * 1.6;
  paintSky(ctx, Wd, H, lk, H * 0.5, t, 0.6);
  const sy = (x) => ground(x, Wd) * H;
  // strata bands
  const bands = [['#9b8a6c', 0.0], ['#7f6f58', 0.08], ['#6a5b49', 0.18], ['#584b3f', 0.3], ['#463b33', 0.44]];
  for (let b = bands.length - 1; b >= 0; b--) {
    ctx.fillStyle = bands[b][0]; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= Wd; x += 16) ctx.lineTo(x, sy(x) + bands[b][1] * H + 10 * Math.sin(x / 140 + b) + (b ? 6 * fbm(x / 200, b, 2, 2) * 6 : 0));
    ctx.lineTo(Wd, H); ctx.closePath(); ctx.fill();
  }
  // surface: green slopes, the town on the plain at the right
  ctx.strokeStyle = '#5d6b3c'; ctx.lineWidth = 8; ctx.beginPath(); for (let x = 0; x <= Wd; x += 12) x ? ctx.lineTo(x, sy(x)) : ctx.moveTo(x, sy(x)); ctx.stroke();
  const tx = Wd * 0.8;
  for (let i = 0; i < 18; i++) { const x = tx - 160 + i * 18 + h01(i, 2) * 6, h = 14 + h01(i, 3) * 14, y = sy(x); ctx.fillStyle = h01(i, 4) < 0.5 ? '#e2cfa6' : '#d6bd92'; ctx.fillRect(x, y - h, 15, h); ctx.fillStyle = '#b45d3c'; ctx.beginPath(); ctx.moveTo(x - 2, y - h); ctx.lineTo(x + 7.5, y - h - 7); ctx.lineTo(x + 17, y - h); ctx.fill(); }
  // magma chamber + conduit
  const vx = Wd * 0.34, vy = sy(vx), cy = H * 0.94, rise = st.rise ?? 0.5;
  const mg = ctx.createRadialGradient(vx, cy, 10, vx, cy, 260); mg.addColorStop(0, '#ffcf6a'); mg.addColorStop(0.35, '#f07a2a'); mg.addColorStop(1, 'rgba(140,30,10,0)');
  ctx.fillStyle = mg; ctx.beginPath(); ctx.ellipse(vx, cy, 300, 110, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(160,40,10,0.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(vx, cy, 230, 80, 0, Math.PI, TAU); ctx.stroke();
  const top = lerp(cy - 80, vy + 8, smooth(0, 1, rise));
  const cg = ctx.createLinearGradient(0, cy, 0, top); cg.addColorStop(0, '#f28a34'); cg.addColorStop(1, '#ffd27a');
  ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(vx - 16, cy - 70); ctx.bezierCurveTo(vx - 26, (cy + top) / 2, vx - 10, top + 40, vx - 8, top); ctx.lineTo(vx + 8, top); ctx.bezierCurveTo(vx + 12, top + 40, vx + 30, (cy + top) / 2, vx + 16, cy - 70); ctx.fill();
  for (let i = 0; i < 30; i++) { const ph = ((t * 0.18 + h01(i, 5)) % 1), y = lerp(cy - 40, top, ph); if (y < top) continue; ctx.fillStyle = `rgba(255,240,180,${0.8 * (1 - ph)})`; ctx.beginPath(); ctx.arc(vx + (h01(i, 6) - 0.5) * 18 * (1 - ph), y, 3 + 4 * h01(i, 7), 0, TAU); ctx.fill(); }
  // seismic rings
  if (st.quake) for (let i = 0; i < 4; i++) { const ph = ((t * 0.6 + i / 4) % 1); ctx.strokeStyle = `rgba(255,220,160,${0.5 * (1 - ph) * st.quake})`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(vx, cy - 40, 60 + ph * 700, 30 + ph * 340, 0, Math.PI, TAU); ctx.stroke(); }
  // depth ruler (no precise figure: "several km")
  ctx.restore();
  const L = st.labels || 0;
  const px = (x) => x - pan * W * 0.45;
  callout(ctx, px(vx), cy, px(vx) + 330, cy - 140, 'MAGMA RESERVOIR', 'several kilometres below the surface', clamp(L * 3));
  callout(ctx, px(vx), lerp(cy - 70, vy, 0.5), px(vx) + 300, H * 0.45, 'CONDUIT', 'pathway for rising magma and gas', clamp(L * 3 - 1));
  callout(ctx, px(tx), sy(tx) - 30, px(tx) - 40, sy(tx) - 190, 'POMPEII', 'about 10 km from the summit', clamp(L * 3 - 2), { align: 'right' });
}

// ---------------------------------------------------------------- pdcSide
// st: { stage 0..1 column stable, collapse 0..1, flow 0..1, labels 0..1, lk }
export function pdcSide(ctx, W, H, t, st) {
  const lk = st.lk; paintSky(ctx, W, H, lk, H * 0.72, t, 0.3);
  const base = H * 0.84, vx = W * 0.3, top = H * 0.5;
  // volcano profile
  ctx.fillStyle = '#5a4c40'; ctx.beginPath(); ctx.moveTo(-50, base); ctx.lineTo(vx - 70, top + 6); ctx.lineTo(vx + 70, top + 6); ctx.lineTo(W + 50, base + 30); ctx.lineTo(W + 50, H); ctx.lineTo(-50, H); ctx.closePath(); ctx.fill();
  const sg = ctx.createLinearGradient(vx, top, vx + 300, base); sg.addColorStop(0, 'rgba(255,255,255,0.08)'); sg.addColorStop(1, 'rgba(0,0,0,0.25)'); ctx.fillStyle = sg; ctx.fill();
  ctx.fillStyle = '#3e352e'; ctx.fillRect(-50, base + 20, W + 100, H);
  // town silhouette at the far right
  for (let i = 0; i < 14; i++) { const x = W * 0.8 + i * 22, h = 18 + h01(i, 3) * 16, y = base + 6 + (x - vx) * 0.01; ctx.fillStyle = '#d9c39a'; ctx.fillRect(x, y - h, 18, h); ctx.fillStyle = '#a4513a'; ctx.beginPath(); ctx.moveTo(x - 2, y - h); ctx.lineTo(x + 9, y - h - 8); ctx.lineTo(x + 20, y - h); ctx.fill(); }
  const collapse = st.collapse || 0;
  column(ctx, vx, top + 4, 22, t, { grow: 1, spread: 0.8 * (1 - collapse * 0.5), tone: 0.5, collapse, glow: 0.4, H: 18 * (1 - 0.45 * collapse) });
  if (st.flow > 0) current(ctx, [[vx + 40, top + 30], [vx + 260, top + 140], [W * 0.62, base - 20], [W * 0.95, base + 10]], st.flow, 110, t, { tone: 'grey', glow: 0.22 });
  const L = st.labels || 0;
  callout(ctx, vx + 40, top - 260, vx + 260, top - 330, 'ERUPTION COLUMN', 'gas, ash and pumice rising tens of km', clamp(L * 2));
  if (st.flow > 0.3) callout(ctx, W * 0.6, base - 70, W * 0.52, H * 0.28, 'PYROCLASTIC CURRENT', 'hot gas + ash + rock fragments, hugging the ground', clamp((st.flow - 0.3) * 3), { accent: '#d9662e' });
}

// ---------------------------------------------------------------- lava vs PDC
export function lavaVsPdc(ctx, W, H, t, st) {
  const p = st.p ?? 1, lk = st.lk;
  for (const side of [0, 1]) {
    const x0 = side * W / 2;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, 0, W / 2, H); ctx.clip();
    paintSky(ctx, W, H, lk, H * 0.55, t, 0.4); ctx.fillStyle = side ? '#4f453c' : '#55493e'; ctx.fillRect(x0, H * 0.55, W / 2, H);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let i = 0; i < 6; i++) ctx.fillRect(x0, H * (0.6 + i * 0.07), W / 2, 2);
    if (!side) { // lava: a slow incandescent tongue, crust breaking
      const len = 120 + 220 * smooth(0, 1, (t % 30) / 30) * p;
      const g = ctx.createLinearGradient(x0 + 60, 0, x0 + 60 + len, 0); g.addColorStop(0, '#2b1a14'); g.addColorStop(0.7, '#a83a14'); g.addColorStop(1, '#ffb050');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0 + 40, H * 0.68); ctx.bezierCurveTo(x0 + 60 + len * 0.5, H * 0.64, x0 + 60 + len, H * 0.7, x0 + 60 + len, H * 0.76); ctx.bezierCurveTo(x0 + 60 + len, H * 0.82, x0 + 60 + len * 0.4, H * 0.84, x0 + 40, H * 0.82); ctx.fill();
      for (let i = 0; i < 20; i++) { ctx.strokeStyle = 'rgba(255,170,80,0.6)'; ctx.lineWidth = 1.5; const xx = x0 + 60 + h01(i, 4) * len * 0.9, yy = H * (0.7 + h01(i, 5) * 0.11); ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + 12, yy + 4); ctx.stroke(); }
    } else { // PDC: a fast, tall, ground-hugging cloud racing across
      const prog = smooth(0, 1, ((t * 0.32) % 1.4)) * p;
      current(ctx, [[x0 - 100, H * 0.62], [x0 + W * 0.25, H * 0.7], [x0 + W / 2 + 200, H * 0.76]], Math.max(0.05, prog), 140, t, { tone: 'grey', glow: 0.25 });
    }
    ctx.restore();
  }
  ctx.fillStyle = 'rgba(243,232,207,0.85)'; ctx.fillRect(W / 2 - 2, 0, 4, H);
  const a = smooth(0, 0.3, p);
  capsText(ctx, 'LAVA FLOW', W * 0.25, 150, 54, CREAM, a, 'center', 0.12);
  capsText(ctx, 'PYROCLASTIC CURRENT', W * 0.75, 150, 54, '#f2b07a', a, 'center', 0.08);
  const sub = (s, x, y, k) => { ctx.save(); ctx.globalAlpha = k; ctx.font = 'italic 400 34px Display'; ctx.fillStyle = CREAM; ctx.textAlign = 'center'; ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 10; ctx.fillText(s, x, y); ctx.restore(); };
  sub('molten rock, usually slow-moving', W * 0.25, 205, smooth(0.2, 0.45, p)); sub('hot gas, ash and rock, fast and deadly', W * 0.75, 205, smooth(0.2, 0.45, p));
  if (p > 0.55) { ctx.save(); ctx.globalAlpha = smooth(0.55, 0.7, p); ctx.strokeStyle = RED; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(W * 0.08, H * 0.3); ctx.lineTo(W * 0.42, H * 0.9); ctx.stroke(); ctx.restore(); capsText(ctx, 'NOT WHAT HAPPENED AT POMPEII', W * 0.25, H * 0.95, 26, CREAM, smooth(0.6, 0.75, p), 'center', 0.15); }
  capsText(ctx, 'CAN MOVE AT HUNDREDS OF KM/H · HUNDREDS OF °C', W * 0.75, H * 0.95, 24, CREAM, smooth(0.65, 0.8, p), 'center', 0.1);
}

// ---------------------------------------------------------------- strata over the buried town
// st: { layers 0..1 (how many deposit layers built), labels, ruler, lk, green }
export function strata(ctx, W, H, t, st) {
  const lk = st.lk; paintSky(ctx, W, H, lk, H * 0.25, t, 0.5);
  const g0 = H * 0.86; // ancient ground
  ctx.fillStyle = '#5d4a39'; ctx.fillRect(0, g0, W, H);
  // town walls in section
  const houses = [[160, 230, 150], [420, 260, 120], [720, 300, 175], [1080, 240, 130], [1360, 280, 160], [1680, 220, 140]];
  for (const [x, w, h] of houses) { ctx.fillStyle = '#d8c4a0'; ctx.fillRect(x, g0 - h * 2.2, 24, h * 2.2); ctx.fillRect(x + w, g0 - h * 2.2, 24, h * 2.2); ctx.fillStyle = '#9b3a2a'; ctx.fillRect(x + 24, g0 - h * 0.9, w - 24, h * 0.9 * 0.35); ctx.fillStyle = 'rgba(40,30,22,0.35)'; ctx.fillRect(x + 24, g0 - h * 2.2, w - 24, h * 2.2); }
  const layers = [['WHITE PUMICE', '#e7e1d2', 0.16, 'fall deposit, first hours'], ['GREY PUMICE', '#a9a296', 0.14, 'fall deposit, later'], ['PYROCLASTIC CURRENT LAYERS', '#7d7368', 0.14, 'fine ash, the next morning'], ['LATER SOILS', '#6b5a3e', 0.1, 'centuries of new ground']];
  let y = g0; const n = (st.layers ?? 1) * layers.length;
  layers.forEach(([name, c, th, sub], i) => {
    const k = clamp(n - i); if (k <= 0) return;
    const h = th * H * k, yy = y - h;
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, y); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, yy + 6 * Math.sin(x / 90 + i * 2)); ctx.lineTo(W, y); ctx.closePath(); ctx.fill();
    if (i < 2) for (let j = 0; j < 140 * k; j++) { ctx.fillStyle = `rgba(${i ? 120 : 200},${i ? 112 : 192},${i ? 100 : 176},0.7)`; ctx.beginPath(); ctx.arc(h01(j, i + 3) * W, yy + h01(j, i + 9) * h, 2 + 3 * h01(j, i + 4), 0, TAU); ctx.fill(); }
    if (i === 3 && st.green) for (let j = 0; j < 80; j++) { ctx.fillStyle = 'rgba(90,110,60,0.9)'; ctx.fillRect(h01(j, 7) * W, yy - 8 + 6 * Math.sin(h01(j, 7) * W / 90 + 6), 3, -10 - 14 * h01(j, 8) * st.green); }
    if (st.labels && k > 0.6) callout(ctx, W * 0.86, yy + h / 2, W * 0.66, yy + h / 2 - 10, name, sub, clamp((st.labels - i * 0.18) * 2.2), { align: 'right' });
    y = yy;
  });
  // the buried houses, shown as ghosted outlines through the deposits
  ctx.save(); ctx.strokeStyle = 'rgba(90,40,25,0.75)'; ctx.lineWidth = 3; ctx.setLineDash([10, 6]);
  for (const [x, w, h] of houses) { ctx.strokeRect(x, g0 - h * 2.2, w + 24, h * 2.2); ctx.fillStyle = 'rgba(155,58,42,0.35)'; ctx.fillRect(x + 24, g0 - h * 0.9, w - 24, h * 0.9 * 0.35); }
  ctx.restore();
  capsText(ctx, 'BURIED HOUSES', 160, g0 - 360, 24, '#5a2a1a', smooth(0.2, 0.6, st.layers ?? 1), 'left', 0.2);
  if (st.ruler) { const k = smooth(0, 1, st.ruler); ctx.strokeStyle = GOLD; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(90, g0); ctx.lineTo(90, g0 - (g0 - y) * k); ctx.stroke(); for (let i = 0; i <= 6; i++) { const yy = g0 - (g0 - y) * (i / 6) * k; ctx.beginPath(); ctx.moveTo(80, yy); ctx.lineTo(100, yy); ctx.stroke(); } capsText(ctx, 'SEVERAL METRES OF DEPOSITS', 120, y - 20, 26, CREAM, k, 'left', 0.12); }
}

// ---------------------------------------------------------------- domus plan (blueprint lines on parchment)
export function plan(ctx, W, H, t, st) {
  const p = st.p ?? 1;
  const g = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W * 0.7); g.addColorStop(0, '#efe3c6'); g.addColorStop(1, '#cdb88f'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const ox = W * 0.22, oy = H * 0.2, s = 46; // metres -> px
  const rooms = [['FAUCES', 0, 6, 3, 3], ['ATRIUM', 3, 0, 12, 15], ['IMPLUVIUM', 7, 5.5, 4, 4], ['TABLINUM', 15, 4, 5, 7], ['PERISTYLE GARDEN', 20, -1, 11, 17], ['CUBICULUM', 3, 0, 0, 0]];
  ctx.strokeStyle = INKC; ctx.lineWidth = 4; ctx.lineCap = 'round';
  const seg = (x0, y0, x1, y1, k) => { ctx.beginPath(); ctx.moveTo(ox + x0 * s, oy + y0 * s); ctx.lineTo(ox + (x0 + (x1 - x0) * k) * s, oy + (y0 + (y1 - y0) * k) * s); ctx.stroke(); };
  const walls = [[0, 0, 31, 0], [31, 0, 31, 15], [31, 15, 0, 15], [0, 15, 0, 9], [0, 6, 0, 0], [3, 0, 3, 6], [3, 9, 3, 15], [15, 0, 15, 4], [15, 11, 15, 15], [20, 0, 20, 4], [20, 11, 20, 15], [3, 4, 6, 4], [3, 11, 6, 11], [6, 0, 6, 4], [6, 11, 6, 15]];
  walls.forEach((w, i) => seg(...w, clamp(p * walls.length * 0.5 - i * 0.5)));
  ctx.lineWidth = 2; ctx.setLineDash([6, 6]); if (p > 0.4) { ctx.strokeRect(ox + 7 * s, oy + 5.5 * s, 4 * s * smooth(0.4, 0.6, p), 4 * s); } ctx.setLineDash([]);
  for (let i = 0; i < 10 && p > 0.5; i++) { const a = (i / 10) * TAU; ctx.beginPath(); ctx.arc(ox + (25.5 + Math.cos(a) * 3.5) * s, oy + (7.5 + Math.sin(a) * 4.5) * s, 7, 0, TAU); ctx.stroke(); }
  const lab = [['ATRIUM', 9, 3, 0.45], ['IMPLUVIUM', 9, 8.2, 0.55], ['TABLINUM', 17.5, 7.6, 0.62], ['PERISTYLE', 25.5, 7.8, 0.7], ['FAUCES', 0.6, 7.8, 0.75], ['CUBICULA', 4.5, 13.3, 0.8]];
  for (const [n, x, y, at] of lab) capsText(ctx, n, ox + x * s, oy + y * s, 22, INKC, smooth(at, at + 0.1, p), 'center', 0.12);
  capsText(ctx, 'A POMPEIAN HOUSE · SIMPLIFIED PLAN', W / 2, H * 0.12, 30, INKC, smooth(0, 0.2, p), 'center', 0.2);
  void rooms;
}

// ---------------------------------------------------------------- timeline bar
// st: { items: [[label, sub, x01]], p, cursor (x01), title }
export function timeline(ctx, W, H, t, st, overlay = true) {
  const p = st.p ?? 1, y = st.y ?? H - 140, x0 = 160, x1 = W - 160;
  if (overlay) { const g = ctx.createLinearGradient(0, y - 140, 0, H); g.addColorStop(0, 'rgba(8,5,3,0)'); g.addColorStop(1, 'rgba(8,5,3,0.7)'); ctx.fillStyle = g; ctx.fillRect(0, y - 140, W, H - y + 140); }
  ctx.fillStyle = 'rgba(243,232,207,0.35)'; ctx.fillRect(x0, y, x1 - x0, 3);
  ctx.fillStyle = GOLD; ctx.fillRect(x0, y, (x1 - x0) * clamp(st.cursor ?? p), 3);
  (st.items || []).forEach(([lab, sub, x], i) => {
    const k = smooth(i * 0.12, i * 0.12 + 0.2, p); if (k <= 0) return; const xx = lerp(x0, x1, x);
    ctx.fillStyle = (st.cursor ?? 1) >= x ? GOLD : 'rgba(243,232,207,0.7)'; ctx.beginPath(); ctx.arc(xx, y + 1.5, 8 * k, 0, TAU); ctx.fill();
    capsText(ctx, lab, xx, y - 26, 24, CREAM, k, 'center', 0.12);
    if (sub) { ctx.save(); ctx.globalAlpha = k; ctx.font = 'italic 400 22px Display'; ctx.fillStyle = 'rgba(243,232,207,0.85)'; ctx.textAlign = 'center'; ctx.fillText(sub, xx, y + 40); ctx.restore(); }
  });
  if (st.title) capsText(ctx, st.title, x0, y - 80, 22, GOLD, smooth(0, 0.2, p), 'left', 0.3);
}

// ---------------------------------------------------------------- calendar evidence (manuscript vs inscription)
export function calendar(ctx, W, H, t, st) {
  const p = st.p ?? 1, stage = st.stage || 0;
  const g = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W * 0.75); g.addColorStop(0, '#3b2d22'); g.addColorStop(1, '#16100b'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const card = (x, y, w, h, rot, k, draw) => { if (k <= 0) return; ctx.save(); ctx.translate(x, y + (1 - E.outCubic(k)) * 120); ctx.rotate(rot); ctx.globalAlpha = smooth(0, 0.4, k); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18; draw(w, h); ctx.restore(); };
  // left: manuscript page
  card(W * 0.3, H * 0.48, 560, 660, -0.04, smooth(0, 0.35, p), (w, h) => {
    ctx.fillStyle = '#e9dcbc'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(90,60,30,0.25)'; for (let i = 0; i < 18; i++) { ctx.beginPath(); ctx.moveTo(-w / 2 + 50, -h / 2 + 130 + i * 26); ctx.lineTo(w / 2 - 50 - h01(i, 3) * 120, -h / 2 + 130 + i * 26); ctx.lineWidth = 6; ctx.stroke(); }
    ctx.fillStyle = '#7a2a14'; ctx.font = 'italic 800 46px Display'; ctx.textAlign = 'center'; ctx.fillText('Pliny the Younger', 0, -h / 2 + 80);
    ctx.fillStyle = INKC; ctx.font = '700 22px Caps'; ctx.fillText('LETTERS 6.16 & 6.20 · MEDIEVAL COPIES', 0, -h / 2 + 114);
    ctx.fillStyle = 'rgba(155,42,26,0.15)'; ctx.fillRect(-w / 2 + 40, h / 2 - 190, w - 80, 120);
    ctx.fillStyle = '#7a2a14'; ctx.font = '700 30px Caps'; ctx.fillText('TRADITIONAL READING', 0, h / 2 - 140); ctx.font = 'italic 800 52px Display'; ctx.fillText('24 August, AD 79', 0, h / 2 - 88);
  });
  // right: charcoal inscription (stage 1)
  card(W * 0.7, H * 0.48, 560, 660, 0.035, smooth(0, 0.35, stage), (w, h) => {
    ctx.fillStyle = '#d9cbb0'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#c9b996'; for (let i = 0; i < 60; i++) ctx.fillRect(-w / 2 + h01(i, 3) * w, -h / 2 + h01(i, 4) * h, 2 + h01(i, 5) * 30, 1.5);
    ctx.fillStyle = '#1e1a17'; ctx.font = '400 64px Caps'; ctx.textAlign = 'center'; ctx.save(); ctx.rotate(-0.04); ctx.globalAlpha = 0.85; ctx.fillText('XVI K NOV', 0, -60); ctx.restore();
    ctx.fillStyle = INKC; ctx.font = '700 22px Caps'; ctx.fillText('CHARCOAL INSCRIPTION · REGIO V · FOUND 2018', 0, -h / 2 + 70);
    ctx.font = 'italic 400 28px Display'; ctx.fillText('"16 days before the Kalends of November"', 0, 30); ctx.fillText('= 17 October', 0, 70);
    ctx.fillStyle = 'rgba(30,60,40,0.15)'; ctx.fillRect(-w / 2 + 40, h / 2 - 190, w - 80, 120);
    ctx.fillStyle = '#2f5a3a'; ctx.font = '700 30px Caps'; ctx.fillText('SUGGESTS', 0, h / 2 - 140); ctx.font = 'italic 800 52px Display'; ctx.fillText('an autumn eruption', 0, h / 2 - 88);
  });
  // evidence chips (stage 2): autumn fruit, sealed wine jars, braziers / heavier clothing
  const chips = ['AUTUMN FRUIT REMAINS', 'WINE STORED IN SEALED JARS', 'BRAZIERS IN USE'];
  chips.forEach((c, i) => { const k = smooth(0.4 + i * 0.12, 0.6 + i * 0.12, stage); if (k <= 0) return; ctx.save(); ctx.globalAlpha = k; ctx.font = '700 22px Caps'; ctx.letterSpacing = '3px'; const w = ctx.measureText(c).width + 40, x = W * 0.7 - w / 2, y = H * 0.84 + i * 0; void y; ctx.restore(); });
  const ck = smooth(0.4, 0.8, stage);
  if (ck > 0) { ctx.save(); ctx.globalAlpha = ck; ctx.font = '700 22px Caps'; ctx.letterSpacing = '3px'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(243,232,207,0.92)'; ctx.fillText('OTHER CLUES DEBATED BY RESEARCHERS: ' + chips.join(' · '), W / 2, H * 0.95); ctx.restore(); }
}
