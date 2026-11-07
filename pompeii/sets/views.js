// views.js: painted 2-D compositions with layered parallax: Misenum across the bay (Pliny's
// viewpoint), the vineyard slopes of Vesuvius, archival illustrations (Ken Burns), finds, end card.
import { hex, css, mixc, mulc, h01, clamp, smooth, lerp, fbm } from '../lib/util.js';
import { paintSky, puff, ART, drawVeiled } from '../lib/paint.js';
import { column, fall, veil } from '../lib/fx.js';
import { drawFigure, crowdSpec } from '../lib/figures.js';
import { capsText, goldText, GOLD, CREAM, INKC, RED } from '../lib/gfx.js';
import { E } from '../lib/motion.js';

const TAU = Math.PI * 2;

// ---------------------------------------------------------------- Misenum, across the bay
// st: { lk, cam: {x, s} (parallax pan + scale), erupt, pine (0..1 outline compare), figure }
export function bay(ctx, W, H, t, st) {
  const lk = st.lk, cx = st.cam?.x || 0, sc = st.cam?.s || 1;
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(sc, sc); ctx.translate(-W / 2, -H / 2);
  const hzn = H * 0.6;
  paintSky(ctx, W, H, lk, hzn, t, 0.8);
  // far coast with Vesuvius (right of centre)
  const vxBase = W * 0.66 + cx * 0.1, mh = H * 0.13, mw = mh * 5.5;
  drawVeiled(ctx, ART.v79, vxBase - mw / 2, hzn - mh, mw, mh, lk.fog, 0.45);
  ctx.fillStyle = css(mixc(lk.fog, hex('#7d8a8a'), 0.3)); ctx.beginPath(); ctx.moveTo(-50, hzn); for (let x = -50; x <= W + 50; x += 30) ctx.lineTo(x, hzn - 8 - 10 * fbm(x / 300, 2, 4, 3) - (x > W * 0.85 ? (x - W * 0.85) * 0.12 : 0)); ctx.lineTo(W + 50, hzn); ctx.fill();
  if (st.erupt) column(ctx, vxBase, hzn - mh * 0.93, mh * 0.42, t, { ...st.erupt, H: st.erupt.H || 22, wind: 0.5 });
  // sea
  const sg = ctx.createLinearGradient(0, hzn, 0, H); sg.addColorStop(0, css(mixc(lk.sky[2], hex('#6f8f9f'), 0.5))); sg.addColorStop(1, css(mulc(hex('#3f5f72'), lk.light)));
  ctx.fillStyle = sg; ctx.fillRect(-50, hzn, W + 100, H);
  ctx.strokeStyle = css(mixc(lk.sky[2], [255, 255, 255], 0.3), 0.25); ctx.lineWidth = 1.5;
  for (let i = 0; i < 70; i++) { const y = hzn + (i / 70) ** 1.8 * (H - hzn), x = (h01(i, 3) * W + t * 8 * (1 + i / 30)) % (W + 200) - 100, l = 20 + 120 * (i / 70); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + l, y); ctx.stroke(); }
  // foreground: rocky shore with a villa terrace wall, an umbrella pine, an anonymous onlooker
  ctx.translate(cx, 0);
  ctx.fillStyle = css(mulc(hex('#4b4136'), lk.light)); ctx.beginPath(); ctx.moveTo(-100, H); ctx.lineTo(-100, H * 0.7); for (let x = -100; x < W * 0.45; x += 20) ctx.lineTo(x, H * 0.72 + 30 * fbm(x / 150, 3, 5, 3) + (x / W) * 140); ctx.lineTo(W * 0.45, H); ctx.fill();
  ctx.fillStyle = css(mulc(hex('#d9c7a2'), lk.light * 0.85)); ctx.fillRect(-100, H * 0.66, W * 0.36, H * 0.07);
  ctx.fillStyle = css(mulc(hex('#b45d3c'), lk.light * 0.8)); ctx.fillRect(-100, H * 0.655, W * 0.36, H * 0.012);
  const pw = H * 0.9; ctx.drawImage(ART.pine[0], W * 0.02 - pw * 0.5, H * 0.72 - pw * 0.88, pw, pw * 0.88);
  if (st.figure !== false) drawFigure(ctx, W * 0.24, H * 0.665, H * 0.2, { ...crowdSpec(5, 3), tunic: '#d8ccb2', cloak: '#6a5a7a', hairStyle: 'short', beard: null, female: false, length: 'knee', h: 1.7 }, { view: 'back', armUp: [0, 0.35] });
  ctx.restore();
  // the comparison: an umbrella pine outline traced over the column
  if (st.pine) {
    const k = st.pine, x = W * 0.66 + cx * 0.1, y = hzn - mh * 0.93;
    ctx.save(); ctx.strokeStyle = GOLD; ctx.lineWidth = 4; ctx.setLineDash([14, 10]); ctx.lineDashOffset = -t * 20; ctx.globalAlpha = smooth(0, 0.3, k);
    const crownW = H * 0.42, crownY = y - H * 0.47, L = smooth(0, 1, k);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 10, lerp(y, crownY + 30, L)); ctx.stroke();
    if (k > 0.4) { ctx.beginPath(); ctx.ellipse(x + 30, crownY, crownW * smooth(0.4, 0.9, k), H * 0.07, 0, Math.PI, TAU); ctx.lineTo(x + 30 - crownW * smooth(0.4, 0.9, k), crownY); ctx.stroke(); }
    ctx.restore();
  }
}

// ---------------------------------------------------------------- vineyards on the slopes of Vesuvius
export function slopes(ctx, W, H, t, st) {
  const lk = st.lk, push = st.push || 0;
  ctx.save(); ctx.translate(W / 2, H * 0.55); const s = 1 + push * 0.18; ctx.scale(s, s); ctx.translate(-W / 2, -H * 0.55);
  const hzn = H * 0.62; paintSky(ctx, W, H, lk, hzn, t);
  const mh = H * 0.55, mw = mh * 3.4; drawVeiled(ctx, ART.v79, W * 0.55 - mw / 2, hzn - mh + 40, mw, mh, lk.fog, 0.15);
  if (st.rumble) { ctx.fillStyle = `rgba(30,20,10,${0.15 * st.rumble})`; ctx.fillRect(0, 0, W, H); }
  // rolling ground
  ctx.fillStyle = css(mulc(hex('#7a7a45'), lk.light)); ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, hzn + 20); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, hzn + 20 + 20 * Math.sin(x / 300) + 10 * fbm(x / 100, 1, 2, 2)); ctx.lineTo(W, H); ctx.fill();
  // vine rows converging toward the mountain
  for (let i = -14; i <= 14; i++) {
    const x0 = W * 0.5 + i * 140 * (1 + push * 0.2), x1 = W * 0.55 + i * 18;
    ctx.strokeStyle = css(mulc(hex('#3f4f2a'), lk.light), 0.9); ctx.lineWidth = 14; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, H + 20); ctx.lineTo(x1, hzn + 34); ctx.stroke();
    for (let k = 0; k < 16; k++) { const u = (k / 16) ** 1.6, x = lerp(x0, x1, 1 - u), y = lerp(H + 20, hzn + 34, 1 - u), r = 4 + 26 * u; ctx.fillStyle = css(mulc(mixc(hex('#4f6a32'), hex('#8a9a4a'), h01(i * 31 + k, 3)), lk.light), 0.85); ctx.beginPath(); ctx.ellipse(x, y - r * 0.6, r, r * 0.7, 0, 0, TAU); ctx.fill(); if (u > 0.5 && h01(i * 7 + k, 9) < 0.3) { ctx.fillStyle = '#4a2a4a'; ctx.beginPath(); ctx.arc(x + r * 0.3, y - r * 0.2, r * 0.18, 0, TAU); ctx.fill(); } }
  }
  for (let i = 0; i < 5; i++) { const x = W * (0.08 + i * 0.2), h = H * (0.32 + 0.1 * h01(i, 3)); ctx.drawImage(ART.cypress[i % 3], x - h * 0.1, hzn + 30 - h, h * 0.21, h); }
  for (let i = 0; i < 3; i++) drawFigure(ctx, W * (0.3 + i * 0.22), H * (0.8 + 0.05 * i), H * (0.18 + 0.03 * i), crowdSpec(40 + i, 9), { view: '3q', face: i % 2 ? -1 : 1, crouch: 0.3, armUp: [0.4, 0.2] });
  ctx.restore();
}

// ---------------------------------------------------------------- archival illustration, Ken Burns
// st: { img, from: [fx, fy, zoom], to: [fx, fy, zoom], p, credit, label }
export function archival(ctx, W, H, t, st, IMG) {
  const img = IMG[st.img]; ctx.fillStyle = '#16100b'; ctx.fillRect(0, 0, W, H);
  if (!img) return;
  const p = E.inOutSine(clamp(st.p ?? 0)), [fx, fy, z] = st.from.map((v, i) => lerp(v, st.to[i], p));
  const s = Math.max(W / img.width, H / img.height) * z, dw = img.width * s, dh = img.height * s;
  ctx.save(); ctx.filter = st.sepia ? 'sepia(0.25) contrast(1.05)' : 'none';
  ctx.drawImage(img, (W - dw) * fx, (H - dh) * fy, dw, dh); ctx.restore();
  const g = ctx.createLinearGradient(0, H * 0.7, 0, H); g.addColorStop(0, 'rgba(10,6,4,0)'); g.addColorStop(1, 'rgba(10,6,4,0.75)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (st.label) capsText(ctx, st.label, 110, H - 130, 34, CREAM, smooth(0.1, 0.3, st.p ?? 1), 'left', 0.12);
  if (st.credit) { ctx.save(); ctx.globalAlpha = smooth(0.15, 0.35, st.p ?? 1); ctx.font = 'italic 400 24px Display'; ctx.fillStyle = 'rgba(243,232,207,0.85)'; ctx.fillText(st.credit, 110, H - 88); ctx.restore(); }
}

// ---------------------------------------------------------------- finds (illustrated object cards)
const OBJ = {
  amphora(ctx, s) { ctx.fillStyle = '#b06a42'; ctx.beginPath(); ctx.moveTo(-s * 0.08, -s * 0.9); ctx.lineTo(s * 0.08, -s * 0.9); ctx.quadraticCurveTo(s * 0.4, -s * 0.5, s * 0.3, s * 0.2); ctx.quadraticCurveTo(s * 0.1, s * 0.75, 0, s * 0.95); ctx.quadraticCurveTo(-s * 0.1, s * 0.75, -s * 0.3, s * 0.2); ctx.quadraticCurveTo(-s * 0.4, -s * 0.5, -s * 0.08, -s * 0.9); ctx.fill(); ctx.strokeStyle = '#8a4a2a'; ctx.lineWidth = s * 0.05; ctx.beginPath(); ctx.moveTo(-s * 0.08, -s * 0.78); ctx.quadraticCurveTo(-s * 0.32, -s * 0.8, -s * 0.24, -s * 0.48); ctx.moveTo(s * 0.08, -s * 0.78); ctx.quadraticCurveTo(s * 0.32, -s * 0.8, s * 0.24, -s * 0.48); ctx.stroke(); },
  lamp(ctx, s) { ctx.fillStyle = '#c08a5a'; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.42, s * 0.3, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(s * 0.3, -s * 0.12); ctx.lineTo(s * 0.72, -s * 0.06); ctx.quadraticCurveTo(s * 0.82, 0, s * 0.72, s * 0.06); ctx.lineTo(s * 0.3, s * 0.12); ctx.fill(); ctx.fillStyle = '#7a4a2a'; ctx.beginPath(); ctx.arc(0, 0, s * 0.12, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(s * 0.68, 0, s * 0.05, 0, TAU); ctx.fill(); },
  loaf(ctx, s) { ctx.fillStyle = '#2e2018'; ctx.beginPath(); ctx.arc(0, 0, s * 0.62, 0, TAU); ctx.fill(); ctx.strokeStyle = '#140c08'; ctx.lineWidth = s * 0.05; for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * s * 0.12, Math.sin(a) * s * 0.12); ctx.lineTo(Math.cos(a) * s * 0.6, Math.sin(a) * s * 0.6); ctx.stroke(); } ctx.fillStyle = 'rgba(120,90,70,0.3)'; ctx.beginPath(); ctx.ellipse(-s * 0.2, -s * 0.25, s * 0.25, s * 0.12, -0.5, 0, TAU); ctx.fill(); },
  fresco(ctx, s) { ctx.fillStyle = '#a3352a'; ctx.beginPath(); ctx.moveTo(-s * 0.7, -s * 0.6); ctx.lineTo(s * 0.55, -s * 0.7); ctx.lineTo(s * 0.72, s * 0.3); ctx.lineTo(s * 0.4, s * 0.68); ctx.lineTo(-s * 0.6, s * 0.6); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#e2b74a'; ctx.lineWidth = s * 0.04; ctx.strokeRect(-s * 0.5, -s * 0.45, s * 0.95, s * 0.95); ctx.fillStyle = '#efe0b8'; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.16, s * 0.28, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#4f6b4a'; ctx.beginPath(); ctx.ellipse(0, s * 0.04, s * 0.08, s * 0.13, 0.5, 0, TAU); ctx.fill(); },
  notice(ctx, s) { ctx.fillStyle = '#e9e1cf'; ctx.fillRect(-s * 0.8, -s * 0.4, s * 1.6, s * 0.8); ctx.fillStyle = '#9b2a1e'; ctx.font = `400 ${s * 0.26}px Caps`; ctx.textAlign = 'center'; ctx.fillText('· · · · ·', 0, -s * 0.05); ctx.fillRect(-s * 0.6, s * 0.1, s * 1.2, s * 0.06); ctx.fillRect(-s * 0.45, s * 0.24, s * 0.9, s * 0.05); },
};
export function finds(ctx, W, H, t, st) {
  const p = st.p ?? 1;
  const g = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, W * 0.7); g.addColorStop(0, '#3a2c20'); g.addColorStop(1, '#120c08'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const items = [['amphora', 'AMPHORA', 'storage jar for wine or oil'], ['fresco', 'WALL PAINTING', 'fragment of painted plaster'], ['notice', 'PAINTED NOTICE', 'electoral & public messages'], ['lamp', 'OIL LAMP', 'everyday terracotta'], ['loaf', 'CARBONISED BREAD', 'found in a bakery oven']];
  items.forEach(([k, name, sub], i) => {
    const e = clamp(p * 6 - i * 0.9); if (e <= 0) return;
    const x = W * (0.14 + i * 0.18), y = H * 0.5 + (1 - E.outBack(e, 1.4)) * 200;
    ctx.save(); ctx.globalAlpha = smooth(0, 0.4, e);
    ctx.fillStyle = 'rgba(243,232,207,0.06)'; ctx.fillRect(x - 150, y - 230, 300, 440); ctx.strokeStyle = 'rgba(232,189,85,0.5)'; ctx.lineWidth = 1.5; ctx.strokeRect(x - 150, y - 230, 300, 440);
    ctx.translate(x, y - 40); ctx.rotate(0.04 * Math.sin(t * 0.5 + i)); OBJ[k](ctx, 110); ctx.restore();
    capsText(ctx, name, x, y + 140, 22, GOLD, smooth(0.3, 0.6, e), 'center', 0.12);
    ctx.save(); ctx.globalAlpha = smooth(0.4, 0.7, e); ctx.font = 'italic 400 20px Display'; ctx.fillStyle = CREAM; ctx.textAlign = 'center'; ctx.fillText(sub, x, y + 176); ctx.restore();
  });
  capsText(ctx, 'EVERYDAY THINGS, PRESERVED', W / 2, 150, 38, CREAM, smooth(0, 0.15, p), 'center', 0.2);
}

// ---------------------------------------------------------------- end card
export function endCard(ctx, W, H, t, st) {
  const k = st.k ?? 1;
  const g = ctx.createRadialGradient(W / 2, H * 0.45, 50, W / 2, H / 2, W * 0.7); g.addColorStop(0, '#2c2118'); g.addColorStop(1, '#0d0906'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const cx = W / 2, cy = H * 0.38, R = 110 * E.outBack(clamp(k * 2), 1.3);
  if (R > 1) { // medallion: compass coin
    ctx.save(); ctx.translate(cx, cy); ctx.rotate((1 - clamp(k * 2)) * -1.2);
    const mg = ctx.createRadialGradient(-R * 0.3, -R * 0.3, R * 0.1, 0, 0, R); mg.addColorStop(0, '#f5d98a'); mg.addColorStop(0.6, '#c9952e'); mg.addColorStop(1, '#6e4a14'); ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(60,35,10,0.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, R * 0.86, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(60,35,10,0.85)'; for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU - Math.PI / 2, L = i % 2 ? R * 0.42 : R * 0.74; ctx.beginPath(); ctx.moveTo(Math.cos(a - 0.2) * R * 0.1, Math.sin(a - 0.2) * R * 0.1); ctx.lineTo(Math.cos(a) * L, Math.sin(a) * L); ctx.lineTo(Math.cos(a + 0.2) * R * 0.1, Math.sin(a + 0.2) * R * 0.1); ctx.fill(); }
    ctx.restore();
  }
  capsText(ctx, 'BURIED CHRONICLES', cx, cy + 210, 76, CREAM, smooth(0.3, 0.6, k), 'center', 0.16, 900);
  const rw = 600 * E.outCubic(clamp(k * 2 - 0.8)); ctx.fillStyle = GOLD; ctx.fillRect(cx - rw / 2, cy + 240, rw, 3);
  ctx.save(); ctx.globalAlpha = smooth(0.6, 0.9, k); ctx.font = 'italic 400 36px Display'; ctx.fillStyle = 'rgba(243,232,207,0.9)'; ctx.textAlign = 'center'; ctx.fillText('History, uncovered.', cx, cy + 300); ctx.restore();
  capsText(ctx, 'SOURCES & FULL CREDITS IN THE DESCRIPTION', cx, H - 90, 20, 'rgba(243,232,207,0.6)', smooth(0.8, 1, k), 'center', 0.25);
}
